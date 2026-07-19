-- luci-theme-oasisic — Login/TOTP authentication controller
-- Custom login flow: password check → TOTP verification → session signing
-- Reference: OpenWrt LuCI dispatcher entry() pattern
--   https://github.com/openwrt/luci/blob/openwrt-25.12/modules/luci-base/luasrc/dispatcher.lua
-- OpenWrt 25.12 removed luci.sauth, use luci.sys.user + direct session management
-- Reference: https://github.com/openwrt/luci/commit/xxxx (luci.sauth removal)

module("luci.controller.oasisic.login", package.seeall)

local http = require("luci.http")
local sys = require("luci.sys")
local uci = require("luci.model.uci")
local io = require("io")
local os = require("os")

local PENDING_AUTH_DIR = "/tmp/oasisic-pending/"
local OATHTOOL_BIN = "oathtool"
local TOTP_SECRET_FILE = "/etc/oasisic/totp_secret"
local TOTP_ENABLED_FILE = "/etc/oasisic/totp_enabled"
local TICKET_TTL = 300 -- 5 minutes

function index()
    -- Login check (no auth required)
    entry({"admin", "oasisic", "login_check"}, post("ajax_login_check"), nil).dependent = false
    -- Login verify (TOTP step, no auth required)
    entry({"admin", "oasisic", "login_verify"}, post("ajax_login_verify"), nil).dependent = false
    -- TOTP status (no auth required for login page detection)
    entry({"admin", "oasisic", "status"}, call("ajax_status"), nil).dependent = false
    -- TOTP generate (requires auth)
    entry({"admin", "oasisic", "generate"}, post("ajax_generate"), nil)
    -- TOTP enable (requires auth)
    entry({"admin", "oasisic", "enable"}, post("ajax_enable"), nil)
    -- TOTP disable (requires auth)
    entry({"admin", "oasisic", "disable"}, post("ajax_disable"), nil)
    -- Bing wallpaper proxy (no auth, bypasses CORS)
    entry({"admin", "oasisic", "wallpaper"}, call("ajax_wallpaper"), nil).dependent = false
end

-- ===== Shell escaping helper =====

local function shell_escape(s)
    return "'" .. s:gsub("'", "'\\''") .. "'"
end

-- ===== Password check (no session signing) =====

function ajax_login_check()
    http.prepare_content("application/json")

    local username = http.formvalue("username")
    local password = http.formvalue("password")

    if not username or not password then
        http.write_json({success = false, message = "Missing credentials"})
        return
    end

    -- Validate credentials using OpenWrt's shadow-based auth
    local valid = sys.checkpasswd(username, password)
    if not valid then
        http.write_json({success = false, message = "Invalid username or password"})
        return
    end

    if is_totp_enabled() then
        -- Generate one-time ticket (do NOT sign session yet)
        local ticket = sys.uniqueid(16)
        create_ticket(ticket, username)
        http.write_json({
            success = true,
            totp_required = true,
            ticket = ticket,
        })
    else
        -- No TOTP: sign session immediately
        write_session(username)
        http.write_json({success = true, totp_required = false, redirect = http.url("admin")})
    end
end

-- ===== TOTP verification + session signing =====

function ajax_login_verify()
    http.prepare_content("application/json")

    local code = http.formvalue("code")
    local ticket = http.formvalue("ticket")

    if not code or not ticket then
        http.write_json({success = false, message = "Missing code or ticket"})
        return
    end

    -- Validate ticket
    local username, err = validate_ticket(ticket)
    if not username then
        http.write_json({success = false, message = err or "Invalid ticket"})
        return
    end

    -- Verify TOTP code
    if not verify_totp(code) then
        -- Ticket is NOT consumed on failed TOTP (retry allowed)
        http.write_json({success = false, message = "Invalid verification code"})
        return
    end

    -- SUCCESS: sign session and consume ticket
    delete_ticket(ticket)
    write_session(username)
    http.write_json({success = true, redirect = http.url("admin")})
end

-- ===== TOTP status =====

function ajax_status()
    http.prepare_content("application/json")
    local available = oathtool_available()
    local enabled = is_totp_enabled()

    http.write_json({
        success = true,
        available = available,
        enabled = enabled,
    })
end

-- ===== TOTP key generation =====

function ajax_generate()
    http.prepare_content("application/json")

    if not oathtool_available() then
        http.write_json({success = false, message = "oathtool not installed"})
        return
    end

    -- Generate a 160-bit (20-byte) random secret, base32 encoded
    local secret = generate_secret()
    -- Store secret temporarily for verification
    store_pending_secret(secret)

    local otpauth_url = string.format(
        "otpauth://totp/Oasisic:%s?secret=%s&issuer=Oasisic&algorithm=SHA1&digits=6&period=30",
        get_username(), secret
    )

    http.write_json({
        success = true,
        secret = secret,
        otpauth_url = otpauth_url,
    })
end

-- ===== TOTP enable (verify code + commit secret) =====

function ajax_enable()
    http.prepare_content("application/json")

    local code = http.formvalue("code")
    if not code or #code ~= 6 then
        http.write_json({success = false, message = "Invalid code"})
        return
    end

    local secret = get_pending_secret()
    if not secret then
        http.write_json({success = false, message = "No pending secret, generate first"})
        return
    end

    -- Verify the code against the pending secret
    local ok = verify_totp_with_secret(secret, code)
    if not ok then
        http.write_json({success = false, message = "Invalid verification code"})
        return
    end

    -- Commit secret and enable TOTP
    commit_secret(secret)
    enable_totp()

    http.write_json({success = true})
end

-- ===== TOTP disable =====

function ajax_disable()
    http.prepare_content("application/json")
    disable_totp()
    http.write_json({success = true})
end

-- ===== Bing wallpaper proxy (bypasses CORS) =====

function ajax_wallpaper()
    http.prepare_content("application/json")
    local cmd = "wget -qO- 'https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN' 2>/dev/null"
    local f = io.popen(cmd)
    local result = f:read("*all")
    f:close()
    if result and result ~= "" then
        local ok, data = pcall(function() return luci.json.parse(result) end)
        if ok and data and data.images and data.images[0] and data.images[0].url then
            http.write_json({
                success = true,
                url = "https://www.bing.com" .. data.images[0].url,
                copyright = data.images[0].copyright or ""
            })
            return
        end
    end
    http.write_json({success = false, message = "Failed to fetch wallpaper"})
end

-- ===== Helper functions =====

function get_username()
    -- Try to get the authenticated username from session context
    if luci and luci.dispatcher and luci.dispatcher.context and luci.dispatcher.context.authuser then
        return luci.dispatcher.context.authuser
    end
    return "root"
end

function oathtool_available()
    return sys.call("command -v " .. OATHTOOL_BIN .. " >/dev/null 2>&1") == 0
end

function is_totp_enabled()
    return sys.call("test -f " .. TOTP_ENABLED_FILE) == 0
end

function enable_totp()
    os.execute("touch " .. TOTP_ENABLED_FILE)
end

function disable_totp()
    os.execute("rm -f " .. TOTP_ENABLED_FILE .. " " .. TOTP_SECRET_FILE)
end

function generate_secret()
    -- Generate 20 random bytes, base32 encode
    local f = io.popen("dd if=/dev/urandom bs=20 count=1 2>/dev/null | base32 | tr -d '='")
    local secret = f:read("*line")
    f:close()
    return secret or "ABCDEFGHIJKLMNOP"
end

function store_pending_secret(secret)
    os.execute("mkdir -p " .. PENDING_AUTH_DIR)
    local f = io.open(PENDING_AUTH_DIR .. "pending_secret", "w")
    if f then
        f:write(secret)
        f:close()
    end
end

function get_pending_secret()
    local f = io.open(PENDING_AUTH_DIR .. "pending_secret", "r")
    if not f then return nil end
    local secret = f:read("*line")
    f:close()
    return secret
end

function commit_secret(secret)
    os.execute("mkdir -p /etc/oasisic")
    local f = io.open(TOTP_SECRET_FILE, "w")
    if f then
        f:write(secret .. "\n")
        f:close()
    end
    os.execute("chmod 600 " .. TOTP_SECRET_FILE)
end

function read_secret()
    local f = io.open(TOTP_SECRET_FILE, "r")
    if not f then return nil end
    local secret = f:read("*line")
    f:close()
    return secret
end

function verify_totp(code)
    local secret = read_secret()
    if not secret then return false end
    return verify_totp_with_secret(secret, code)
end

function verify_totp_with_secret(secret, code)
    if not secret or not code then return false end

    -- Check current TOTP code and also the previous slot (allow 30s clock skew)
    for offset = 0, 1 do
        local cmd = string.format(
            "%s --totp -b %s -d 6 --now='+%d' 2>/dev/null",
            OATHTOOL_BIN, shell_escape(secret), offset
        )
        local f = io.popen(cmd)
        local result = f:read("*line")
        f:close()
        if result and result == code then
            return true
        end
    end
    return false
end

-- ===== Ticket management =====

function create_ticket(ticket, username)
    os.execute("mkdir -p " .. PENDING_AUTH_DIR)
    local f = io.open(PENDING_AUTH_DIR .. ticket, "w")
    if f then
        f:write(username .. "\n")
        f:write(tostring(os.time()) .. "\n")
        f:close()
    end
end

function validate_ticket(ticket)
    if not ticket or ticket == "" then
        return nil, "No ticket"
    end
    -- Prevent path traversal
    if ticket:match("[/%.]") then
        return nil, "Invalid ticket"
    end
    local f = io.open(PENDING_AUTH_DIR .. ticket, "r")
    if not f then
        return nil, "Ticket not found (expired or invalid)"
    end
    local username = f:read("*line")
    local create_time = tonumber(f:read("*line") or "0")
    f:close()

    if os.time() - create_time > TICKET_TTL then
        os.remove(PENDING_AUTH_DIR .. ticket)
        return nil, "Ticket expired"
    end

    return username, nil
end

function delete_ticket(ticket)
    if ticket and not ticket:match("[/%.]") then
        os.remove(PENDING_AUTH_DIR .. ticket)
    end
end

-- ===== Session management (no luci.sauth, OpenWrt 25.12+) =====
-- Reference: LuCI dispatcher session management
-- Sessions are stored in /tmp/luci-sessions/<sessionid>
-- Cookie name: sysauth_<username>=<sessionid>

function write_session(username)
    local sessionid = sys.uniqueid(32)
    local sessions_dir = "/tmp/luci-sessions/"

    os.execute("mkdir -p " .. sessions_dir)

    -- Write session file: username\n<expiry_timestamp>
    local expiry = os.time() + 86400 -- 24 hours
    local f = io.open(sessions_dir .. sessionid, "w")
    if f then
        f:write(username .. "\n")
        f:write(tostring(expiry) .. "\n")
        f:close()
    end

    -- Set the sysauth cookie
    -- This matches what LuCI dispatcher expects for session auth
    http.setcookie("sysauth_" .. username, sessionid, {["max-age"] = 86400, path = "/"})
end