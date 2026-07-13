--[[
luci-theme-oasisic — 主题配置控制器
]]

module("luci.controller.oasisic.config", package.seeall)

local http = require("luci.http")
local uci = require("luci.model.uci").cursor()
local io = require("io")
local os = require("os")

function index()
	entry({"admin", "system", "oasisic"}, alias("admin", "system", "oasisic", "config"), _("Oasisic 主题配置"), 80).dependent = false
	entry({"admin", "system", "oasisic", "config"}, cbi("oasisic-config"), _("主题设置"), 1)
	entry({"admin", "system", "oasisic", "upload_bg"}, post("upload_bg"), nil).dependent = false
	entry({"admin", "system", "oasisic", "reset"}, post("do_reset"), nil).dependent = false
end

-- 检查文件是否为有效图片（检查 magic bytes）
local function is_valid_image(filepath)
	if not filepath then return false end
	local f = io.open(filepath, "rb")
	if not f then return false end
	local header = f:read(4)
	f:close()
	if not header then return false end
	-- PNG: 89 50 4E 47, JPEG: FF D8 FF, GIF: 47 49 46
	if header:byte(1) == 0x89 and header:byte(2) == 0x50 and header:byte(3) == 0x4E and header:byte(4) == 0x47 then
		return true
	end
	if header:byte(1) == 0xFF and header:byte(2) == 0xD8 then
		return true
	end
	if header:byte(1) == 0x47 and header:byte(2) == 0x49 and header:byte(3) == 0x46 then
		return true
	end
	return false
end

function upload_bg()
	local upload = require("luci.http.upload")
	local file = upload.file()
	if not file or not file.file then
		http.write_json({success = false, message = "未选择文件"})
		return
	end

	-- 检查文件大小（限制 2MB）
	local size = tonumber(os.stat(file.file).size or 0) or 0
	if size > 2 * 1024 * 1024 then
		os.remove(file.file)
		http.write_json({success = false, message = "文件过大，请上传小于 2MB 的图片"})
		return
	end

	-- 检查文件格式
	if not is_valid_image(file.file) then
		os.remove(file.file)
		http.write_json({success = false, message = "仅支持 PNG/JPEG/GIF 图片格式"})
		return
	end

	-- 使用 io 库复制文件，避免 shell 拼接
	local dest = "/www/luci-static/oasisic/img/custom-bg.jpg"
	local src_f = io.open(file.file, "rb")
	local dst_f = io.open(dest, "wb")
	if src_f and dst_f then
		local data = src_f:read("*all")
		dst_f:write(data)
		src_f:close()
		dst_f:close()
		os.execute("chmod 644 " .. dest)
		uci:set("oasisic", "config", "bg_image", "/luci-static/oasisic/img/custom-bg.jpg")
		uci:commit("oasisic")
		http.write_json({success = true, path = "/luci-static/oasisic/img/custom-bg.jpg"})
	else
		if src_f then src_f:close() end
		if dst_f then dst_f:close() end
		http.write_json({success = false, message = "文件写入失败"})
	end
	os.remove(file.file)
end

function do_reset()
	uci:delete("oasisic", "config")
	uci:commit("oasisic")
	os.execute("rm -f /www/luci-static/oasisic/img/custom-bg.jpg")
	http.write_json({success = true})
end