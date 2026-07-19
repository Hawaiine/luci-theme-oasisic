-- luci-theme-oasisic — Wallpaper proxy controller
-- Server-side Bing wallpaper fetcher (bypasses CORS)
-- Reference: Argon's luci.argon_wallpaper RPC daemon

module("luci.controller.oasisic.wallpaper", package.seeall)

local http = require("luci.http")

function index()
    entry({"admin", "oasisic", "wallpaper"}, call("ajax_wallpaper"), nil).dependent = false
end

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