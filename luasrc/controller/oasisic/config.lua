--[[
luci-theme-oasisic — 主题配置控制器
]]

module("luci.controller.oasisic.config", package.seeall)

function index()
	entry({"admin", "system", "oasisic"}, alias("admin", "system", "oasisic", "config"), _("Oasisic 主题配置"), 80).dependent = false
	entry({"admin", "system", "oasisic", "config"}, cbi("oasisic-config"), _("主题设置"), 1)
	entry({"admin", "system", "oasisic", "upload_bg"}, post("upload_bg"), nil).dependent = false
	entry({"admin", "system", "oasisic", "reset"}, post("do_reset"), nil).dependent = false
end

function upload_bg()
	local http = require("luci.http")
	local upload = require("luci.http.upload")
	local uci = require("luci.model.uci").cursor()

	-- 处理上传的背景图
	local file = upload.file()
	if file and file.file then
		local dest = "/www/luci-static/oasisic/img/custom-bg.jpg"
		os.execute("cp " .. file.file .. " " .. dest)
		os.execute("chmod 644 " .. dest)
		uci:set("oasisic", "config", "bg_image", "/luci-static/oasisic/img/custom-bg.jpg")
		uci:commit("oasisic")
		http.write_json({success = true, path = "/luci-static/oasisic/img/custom-bg.jpg"})
	else
		http.write_json({success = false, message = "上传失败"})
	end
end

function do_reset()
	local uci = require("luci.model.uci").cursor()
	uci:delete("oasisic", "config")
	uci:commit("oasisic")
	os.execute("rm -f /www/luci-static/oasisic/img/custom-bg.jpg")
	http.write_json({success = true})
end