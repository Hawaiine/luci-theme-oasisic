--[[
luci-theme-oasisic — TOTP 两步验证模块
基于 oath-toolkit (oathtool) 实现 TOTP 验证
]]

module("luci.controller.oasisic.totp", package.seeall)

local http = require("luci.http")
local sauth = require("luci.sauth")
local i18n = require("luci.i18n")
local sys = require("luci.sys")
local uci = require("luci.model.uci").cursor()

-- TOTP 密钥存储路径
local TOTP_SECRET_FILE = "/etc/oasisic/totp_secret"
local TOTP_ENABLED_FILE = "/etc/oasisic/totp_enabled"

function index()
	entry({"admin", "system", "oasisic-2fa"}, alias("admin", "system", "oasisic-2fa", "setup"), _("两步验证"), 90).dependent = false
	entry({"admin", "system", "oasisic-2fa", "setup"}, template("oasisic/totp_setup"), _("2FA 设置"), 1).dependent = false
	entry({"admin", "system", "oasisic-2fa", "verify"}, post("verify_totp"), nil).dependent = false
	entry({"admin", "system", "oasisic-2fa", "status"}, call("ajax_status"), nil).dependent = false
	entry({"admin", "system", "oasisic-2fa", "generate"}, post("ajax_generate"), nil).dependent = false
	entry({"admin", "system", "oasisic-2fa", "enable"}, post("ajax_enable"), nil).dependent = false
	entry({"admin", "system", "oasisic-2fa", "disable"}, post("ajax_disable"), nil).dependent = false
end

-- 检查 oathtool 是否可用
function oathtool_available()
	return os.execute("command -v oathtool >/dev/null 2>&1") == 0
end

-- 获取当前用户 TOTP 密钥
function get_secret()
	local f = io.open(TOTP_SECRET_FILE, "r")
	if f then
		local secret = f:read("*line")
		f:close()
		return secret
	end
	return nil
end

-- 保存 TOTP 密钥
function save_secret(secret)
	local f = io.open(TOTP_SECRET_FILE, "w")
	if f then
		f:write(secret .. "\n")
		f:close()
		os.execute("chmod 600 " .. TOTP_SECRET_FILE)
		return true
	end
	return false
end

-- 检查是否启用了 TOTP
function is_enabled()
	local f = io.open(TOTP_ENABLED_FILE, "r")
	if f then
		local status = f:read("*line")
		f:close()
		return status == "1"
	end
	return false
end

-- 设置启用状态
function set_enabled(enabled)
	local f = io.open(TOTP_ENABLED_FILE, "w")
	if f then
		f:write(enabled and "1" or "0")
		f:close()
		return true
	end
	return false
end

-- 验证 TOTP 验证码
function verify_totp(code, secret)
	if not code or code == "" then
		return false, "验证码不能为空"
	end
	if not secret then
		secret = get_secret()
	end
	if not secret then
		return false, "TOTP 未配置"
	end

	local cmd = string.format("oathtool --totp -b '%s' 2>/dev/null", secret)
	local f = io.popen(cmd)
	local expected = f:read("*line")
	f:close()

	if not expected then
		return false, "oathtool 执行失败"
	end

	-- 支持前后各 1 个时间窗口（共 3 个有效码，各 30 秒）
	for offset = -1, 1 do
		local cmd2 = string.format("oathtool --totp -b '%s' -d 6 --now='%d' 2>/dev/null", secret, offset)
		local f2 = io.popen(cmd2)
		local token = f2:read("*line")
		f2:close()
		if token and token:match("^%d+$") and token == code then
			return true
		end
	end

	return false, "验证码无效，请重试"
end

-- ===== AJAX 处理函数 =====

-- 获取 TOTP 状态（用于前端）
function ajax_status()
	http.prepare_content("application/json")
	local data = {
		available = oathtool_available(),
		enabled = is_enabled(),
		has_secret = get_secret() ~= nil,
	}
	http.write_json(data)
end

-- 生成新的 TOTP 密钥和二维码数据
function ajax_generate()
	http.prepare_content("application/json")
	if not oathtool_available() then
		http.write_json({success = false, message = "oathtool 未安装"})
		return
	end

	-- 生成随机密钥 (Base32, 16 字节 = 26 字符)
	local cmd = "dd if=/dev/urandom bs=10 count=1 2>/dev/null | base32 | tr -d '=' | head -c 26"
	local f = io.popen(cmd)
	local secret = f:read("*line")
	f:close()

	if not secret or #secret < 10 then
		http.write_json({success = false, message = "密钥生成失败"})
		return
	end

	-- 保存密钥（但不启用）
	save_secret(secret)
	set_enabled(false)

	local hostname = sys.hostname() or "OpenWrt"
	local issuer = "Oasisic:" .. hostname
	local label = issuer .. ":" .. (sauth.get_user() or "admin")
	local otpauth = string.format("otpauth://totp/%s?secret=%s&issuer=%s&algorithm=SHA1&digits=6&period=30",
		label, secret, issuer)

	http.write_json({
		success = true,
		secret = secret,
		otpauth_url = otpauth,
		issuer = issuer,
	})
end

-- 启用 TOTP（用户已验证过一次后）
function ajax_enable()
	http.prepare_content("application/json")
	local code = http.formvalue("code")
	local ok, err = verify_totp(code)
	if ok then
		set_enabled(true)
		http.write_json({success = true})
	else
		http.write_json({success = false, message = err or "验证失败"})
	end
end

-- 禁用 TOTP
function ajax_disable()
	http.prepare_content("application/json")
	set_enabled(false)
	if os.execute("rm -f " .. TOTP_SECRET_FILE .. " " .. TOTP_ENABLED_FILE) == 0 then
		http.write_json({success = true})
	else
		http.write_json({success = true, message = "配置文件已清除"})
	end
end

-- 登录时的 TOTP 验证端点
function verify_action()
	http.prepare_content("application/json")
	local code = http.formvalue("code")
	local session_id = http.formvalue("session")

	-- 验证会话中是否有 2FA pending 标记
	if not session_id or not nixio.fs.access("/tmp/luci-2fa-" .. session_id) then
		http.write_json({success = false, message = "会话无效或已过期"})
		return
	end

	local ok, err = verify_totp(code)
	if ok then
		-- 清除 2FA pending 标记，完成登录
		os.execute("rm -f /tmp/luci-2fa-" .. session_id)
		http.write_json({success = true})
	else
		http.write_json({success = false, message = err or "验证码无效"})
	end
end

return {
	oathtool_available = oathtool_available,
	is_enabled = is_enabled,
	verify_totp = verify_totp,
	get_secret = get_secret,
}