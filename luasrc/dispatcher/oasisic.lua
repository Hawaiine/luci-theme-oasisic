--[[
luci-theme-oasisic — 主题注册器
使用标准 LuCI 主题机制：目录结构约定 + uci 配置
主题通过 Makefile 安装到正确路径，在 系统 → 语言和界面 中选择生效
]]

module("luci.dispatcher.oasisic", package.seeall)

local theme_version = "1.0.0"

function version()
	return theme_version
end

return {
	version = version,
}