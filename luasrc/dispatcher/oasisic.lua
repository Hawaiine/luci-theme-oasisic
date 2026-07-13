--[[
luci-theme-oasisic — Theme dispatcher
Copyright (C) 2026 Oasisic OpenWrt
Licensed under Apache 2.0
]]

module("luci.dispatcher.oasisic", package.seeall)

local theme_name = "oasisic"
local theme_version = "1.0.0"

function init(module)
	-- Register theme with LuCI
	L.registerTheme(theme_name, {
		title      = "Oasisic",
		version    = theme_version,
		author     = "Oasisic OpenWrt",
		description= "A modern, Apple-inspired LuCI theme with bypass gateway awareness",
		license    = "Apache-2.0",
		dark_mode  = true,
	})

	-- Register theme assets path
	L.addStaticPath(theme_name, "luci-static/" .. theme_name)
end

function header(module)
	return L.theme(theme_name) .. "/header"
end

function footer(module)
	return L.theme(theme_name) .. "/footer"
end

function sysauth(module)
	return L.theme(theme_name) .. "/sysauth"
end

function version()
	return theme_version
end

return {
	init     = init,
	header   = header,
	footer   = footer,
	sysauth  = sysauth,
	version  = version,
}