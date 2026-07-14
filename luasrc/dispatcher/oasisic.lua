-- luci-theme-oasisic — 主题版本信息
-- LuCI 主题通过目录结构 + uci 配置生效，此文件仅提供版本号

module("luci.dispatcher.oasisic", package.seeall)

local theme_version = "1.0.0"

function version()
	return theme_version
end

return {
	version = version,
}