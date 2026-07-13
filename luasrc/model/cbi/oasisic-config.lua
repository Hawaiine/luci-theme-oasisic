--[[
luci-theme-oasisic — 主题配置 CBI 模型
]]

local uci = require("luci.model.uci").cursor()

-- 确保默认配置存在
if not uci:get("oasisic", "config") then
	uci:section("oasisic", "config", "config", {
		theme_color = "blue",
		sidebar_mode = "expanded",
		dark_mode = "auto",
		blur_intensity = "80",
		show_cpu = "1",
		show_memory = "1",
		show_storage = "1",
		show_nikki = "1",
		show_traffic = "1",
		auto_refresh = "10",
	})
	uci:commit("oasisic")
end

m = Map("oasisic", translate("Oasisic 主题配置"),
	translate("配置 luci-theme-oasisic 的显示选项、主题色和布局"))

-- ===== 外观设置 =====
s = m:section(NamedSection, "config", "config", translate("外观设置"))
s.addremove = false

-- 主题色预设
color = s:option(ListValue, "theme_color", translate("主题色预设"),
	translate("选择一套配色方案"))
color:value("blue", translate("🔵 科技蓝（默认）"))
color:value("green", translate("🟢 翡翠绿"))
color:value("purple", translate("🟣 极光紫"))
color:value("orange", translate("🟠 暖阳橙"))
color:value("teal", translate("🔷 青碧"))
color.default = "blue"

-- 深色模式
dark = s:option(ListValue, "dark_mode", translate("深色模式"))
dark:value("auto", translate("🌓 跟随系统（默认）"))
dark:value("light", translate("☀️ 浅色模式"))
dark:value("dark", translate("🌙 深色模式"))
dark.default = "auto"

-- 侧栏模式
sidebar = s:option(ListValue, "sidebar_mode", translate("侧栏模式"))
sidebar:value("expanded", translate("展开（默认）"))
sidebar:value("collapsed", translate("折叠（仅图标）"))
sidebar.default = "expanded"

-- 毛玻璃强度
blur = s:option(ListValue, "blur_intensity", translate("毛玻璃强度"))
blur:value("40", translate("微弱"))
blur:value("60", translate("适中"))
blur:value("80", translate("较强（默认）"))
blur:value("100", translate("极强"))
blur.default = "80"

-- 背景图 URL
bg = s:option(Value, "bg_image", translate("登录背景图"),
	translate("自定义背景图片 URL（留空使用 Bing 每日壁纸）"))
bg.placeholder = "https://example.com/bg.jpg"

-- 上传按钮（仅触发用，实际处理在 controller）
local upload_btn = s:option(Button, "_upload", translate("上传背景图"))
upload_btn.inputstyle = "apply"
function upload_btn.write(self, section)
	-- 由 controller 处理，此处留空
end

-- ===== 仪表盘设置 =====
s2 = m:section(NamedSection, "config", "config", translate("仪表盘设置"))
s2.addremove = false

refresh = s2:option(ListValue, "auto_refresh", translate("自动刷新"))
refresh:value("5", translate("5 秒"))
refresh:value("10", translate("10 秒（默认）"))
refresh:value("30", translate("30 秒"))
refresh:value("0", translate("关闭自动刷新"))
refresh.default = "10"

s2:option(Flag, "show_cpu", translate("显示 CPU 进度条")).default = "1"
s2:option(Flag, "show_memory", translate("显示内存进度条")).default = "1"
s2:option(Flag, "show_storage", translate("显示存储进度条")).default = "1"
s2:option(Flag, "show_nikki", translate("显示 Nikki 代理状态")).default = "1"
s2:option(Flag, "show_traffic", translate("显示流量图表")).default = "1"

-- ===== 关于 =====
s3 = m:section(NamedSection, "config", "config", translate("关于"))
s3.addremove = false

local ver = s3:option(DummyValue, "_version", translate("主题版本"))
ver.default = "1.0.0"

local auth = s3:option(DummyValue, "_author", translate("作者"))
auth.default = "Oasisic OpenWrt"

local lic = s3:option(DummyValue, "_license", translate("许可证"))
lic.default = "Apache 2.0"

return m