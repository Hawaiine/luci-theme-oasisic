-- luci-theme-oasisic — Wallpaper proxy controller
-- Server-side Bing wallpaper fetcher (bypasses CORS)
-- Reference: Argon's luci.argon_wallpaper RPC daemon

module("luci.controller.oasisic.wallpaper", package.seeall)

local http = require("luci.http")
local jsonc = require("luci.jsonc")

function index()
	entry({"admin", "oasisic", "wallpaper"}, call("ajax_wallpaper"), nil).dependent = false
end

function ajax_wallpaper()
	http.prepare_content("application/json")
	http.header("Cache-Control", "public, max-age=21600") -- 6 hours
	
	local cmd = "wget -qO- 'https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN' 2>/dev/null"
	local f = io.popen(cmd)
	if not f then
		http.write_json({success = false, message = "Failed to execute wget"})
		return
	end
	
	local result = f:read("*all")
	f:close()
	
	if result and result ~= "" then
		local data = jsonc.parse(result)
		if data and data.images and data.images[1] then
			local img = data.images[1]
			http.write_json({
				success = true,
				url = "https://www.bing.com" .. img.url,
				copyright = img.copyright or ""
			})
			return
		end
	end
	
	http.write_json({success = false, message = "Failed to fetch wallpaper"})
end