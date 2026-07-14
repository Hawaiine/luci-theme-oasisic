--[[
luci-theme-oasisic — TOTP 两步验证模块
基于 oath-toolkit (oathtool) 实现 TOTP 验证
兼容 OpenWrt 25.12+（无 luci.sauth）
]]

module("luci.controller.oasisic.totp", package.seeall)

local http = require("luci.http")
local sys = require("luci.sys")
local io = require("io")
local os = require("os")

-- TOTP 密钥存储路径
local TOTP_SECRET_FILE = "/etc/oasisic/totp_secret"
local TOTP_ENABLED_FILE = "/etc/oasisic/totp_enabled"
local PENDING_AUTH_DIR = "/tmp/oasisic-pending/"

function index()
	entry({"admin", "system", "oasisic-2fa"}, alias("admin", "system", "oasisic-2fa", "setup"), _("两步验证"), 90).dependent = false
	entry({"admin", "system", "oasisic-2fa", "setup"}, template("oasisic/totp_setup"), _("2FA 设置"), 1).dependent = false
	entry({"admin", "system", "oasisic-2fa", "status"}, call("ajax_status"), nil).dependent = false
	entry({"admin", "system", "oasisic-2fa", "generate"}, post("ajax_generate"), nil).dependent = false
	entry({"admin", "system", "oasisic-2fa", "enable"}, post("ajax_enable"), nil).dependent = false
	entry({"admin", "system", "oasisic-2fa", "disable"}, post("ajax_disable"), nil).dependent = false
end

-- 检查 oathtool 是否可用
function oathtool_available()
	return os.execute("command -v oathtool >/dev/null 2>&1") == 0
end

function get_secret()
	local f = io.open(TOTP_SECRET_FILE, "r")
	if f then
		local secret = f:read("*line")
		f:close()
		return secret
	end
	return nil
end

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

function is_enabled()
	local f = io.open(TOTP_ENABLED_FILE, "r")
	if f then
		local status = f:read("*line")
		f:close()
		return status == "1"
	end
	return false
end

function set_enabled(enabled)
	local f = io.open(TOTP_ENABLED_FILE, "w")
	if f then
		f:write(enabled and "1" or "0")
		f:close()
		return true
	end
	return false
end

-- Shell 安全转义
local function shell_escape(s)
	return "'" .. s:gsub("'", "'\\''") .. "'"
end

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

	local escaped_secret = shell_escape(secret)
	for offset = -1, 1 do
		local cmd = string.format("oathtool --totp -b %s -d 6 --now='+%d' 2>/dev/null",
			escaped_secret, offset)
		local f = io.popen(cmd)
		local token = ""
		if f then
			token = f:read("*line") or ""
			f:close()
		end
		if token:match("^%d+$") and token == code then
			return true
		end
	end
	return false, "验证码无效，请重试"
end

-- AJAX 处理函数

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

	-- 生成 16 字节（128 bit）随机密钥
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
	local label = issuer .. ":admin"
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