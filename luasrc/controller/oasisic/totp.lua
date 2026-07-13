--[[
luci-theme-oasisic — TOTP 两步验证模块
基于 oath-toolkit (oathtool) 实现 TOTP 验证
]]

module("luci.controller.oasisic.totp", package.seeall)

local http = require("luci.http")
local sauth = require("luci.sauth")
local sys = require("luci.sys")
local json = require("luci.json")
local io = require("io")
local os = require("os")

-- TOTP 密钥存储路径
local TOTP_SECRET_FILE = "/etc/oasisic/totp_secret"
local TOTP_ENABLED_FILE = "/etc/oasisic/totp_enabled"
-- 待二次验证票据目录
local PENDING_AUTH_DIR = "/tmp/oasisic-pending/"

function index()
	entry({"admin", "system", "oasisic-2fa"}, alias("admin", "system", "oasisic-2fa", "setup"), _("两步验证"), 90).dependent = false
	entry({"admin", "system", "oasisic-2fa", "setup"}, template("oasisic/totp_setup"), _("2FA 设置"), 1).dependent = false
	entry({"admin", "system", "oasisic-2fa", "status"}, call("ajax_status"), nil).dependent = false
	entry({"admin", "system", "oasisic-2fa", "generate"}, post("ajax_generate"), nil).dependent = false
	entry({"admin", "system", "oasisic-2fa", "enable"}, post("ajax_enable"), nil).dependent = false
	entry({"admin", "system", "oasisic-2fa", "disable"}, post("ajax_disable"), nil).dependent = false
	-- 登录相关路由
	entry({"admin", "system", "oasisic-2fa", "login_check"}, post("ajax_login_check"), nil).dependent = false
	entry({"admin", "system", "oasisic-2fa", "login_verify"}, post("ajax_login_verify"), nil).dependent = false
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

-- 验证 TOTP 验证码（shell 安全版本）
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

	-- 使用 shell 安全转义
	local function shell_escape(s)
		return "'" .. s:gsub("'", "'\\''") .. "'"
	end

	local escaped_secret = shell_escape(secret)
	local escaped_code = shell_escape(code)

	-- 验证当前码以及前后各 1 个时间窗口（共 3 个有效码，各 30 秒）
	for offset = -1, 1 do
		local cmd = string.format("oathtool --totp -b %s -d 6 --now='+%d' 2>/dev/null",
			escaped_secret, offset)
		local f = io.popen(cmd)
		local token = ""
		if f then
			token = f:read("*line") or ""
			f:close()
		end
		if token:match("^%d+$") and token == escaped_code:gsub("'\\''", "'"):gsub("^'(.*)'$", "%1") then
			return true
		end
	end

	return false, "验证码无效，请重试"
end

-- ===== 登录流程：密码校验（不签发 session） =====

function ajax_login_check()
	http.prepare_content("application/json")
	local username = http.formvalue("username")
	local password = http.formvalue("password")

	if not username or not password then
		http.write_json({success = false, message = "缺少用户名或密码"})
		return
	end

	-- 调用 LuCI 标准密码校验
	local auth_result = sauth.check(username, password)
	if not auth_result then
		http.write_json({success = false, message = "用户名或密码错误"})
		return
	end

	-- 密码正确，检查 TOTP 是否启用
	if is_enabled() then
		-- 生成一次性票据
		os.execute("mkdir -p " .. PENDING_AUTH_DIR)
		local ticket = sys.uniqueid(16)
		local ticket_file = PENDING_AUTH_DIR .. ticket
		local f = io.open(ticket_file, "w")
		if f then
			f:write(username .. "\n")
			f:write(os.time() .. "\n")
			f:close()
		end
		http.write_json({
			success = true,
			totp_required = true,
			ticket = ticket,
		})
	else
		-- TOTP 未启用，直接完成登录
		local session = sauth.write(username, "default")
		http.write_json({
			success = true,
			totp_required = false,
			session = session,
		})
	end
end

-- ===== 登录流程：TOTP 验证 → 签发 session =====

function ajax_login_verify()
	http.prepare_content("application/json")
	local code = http.formvalue("code")
	local ticket = http.formvalue("ticket")

	if not code or not ticket then
		http.write_json({success = false, message = "缺少验证码或票据"})
		return
	end

	-- 验证票据是否存在且未过期
	local ticket_file = PENDING_AUTH_DIR .. ticket
	local f = io.open(ticket_file, "r")
	if not f then
		http.write_json({success = false, message = "票据无效或已过期"})
		return
	end

	local username = f:read("*line")
	local create_time = tonumber(f:read("*line") or "0")
	f:close()

	-- 票据有效期 5 分钟
	local now = os.time()
	if now - create_time > 300 then
		os.remove(ticket_file)
		http.write_json({success = false, message = "票据已过期，请重新登录"})
		return
	end

	-- 验证 TOTP 码
	local ok, err = verify_totp(code)
	if not ok then
		http.write_json({success = false, message = err or "验证码无效"})
		return
	end

	-- 验证通过，清除票据，签发最终 session
	os.remove(ticket_file)
	local session = sauth.write(username, "default")

	http.write_json({
		success = true,
		session = session,
	})
end

-- ===== AJAX 处理函数 =====

function ajax_status()
	http.prepare_content("application/json")
	http.write_json({
		available = oathtool_available(),
		enabled = is_enabled(),
		has_secret = get_secret() ~= nil,
	})
end

function ajax_generate()
	http.prepare_content("application/json")
	if not oathtool_available() then
		http.write_json({success = false, message = "oathtool 未安装"})
		return
	end

	-- 生成 16 字节（128 bit）随机密钥 → Base32 编码 → 26 字符
	local cmd = "dd if=/dev/urandom bs=16 count=1 2>/dev/null | base32 | tr -d '=' | tr -d '\n'"
	local f = io.popen(cmd)
	local secret = ""
	if f then
		secret = f:read("*all") or ""
		f:close()
	end
	secret = secret:sub(1, 26)

	if #secret < 10 then
		http.write_json({success = false, message = "密钥生成失败"})
		return
	end

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

function ajax_disable()
	http.prepare_content("application/json")
	set_enabled(false)
	os.execute("rm -f " .. TOTP_SECRET_FILE .. " " .. TOTP_ENABLED_FILE)
	http.write_json({success = true, message = "配置已清除"})
end

return {
	oathtool_available = oathtool_available,
	is_enabled = is_enabled,
	verify_totp = verify_totp,
	get_secret = get_secret,
}