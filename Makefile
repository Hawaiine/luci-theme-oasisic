#
# Copyright (C) 2026 Oasisic OpenWrt
# Licensed under Apache 2.0
#
# Standard LuCI theme package: luci.mk maps the tree onto the target
#   ucode/  -> /usr/share/ucode/luci/     (templates)
#   htdocs/ -> /www/                       (luci-static assets)
#   root/   -> /                           (uci-defaults)
#   po/     -> luci-i18n-oasisic-<lang>    (translation packages, if any)
# so no manual install rules are needed.
#

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-theme-oasisic
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_LICENSE:=Apache-2.0
PKG_LICENSE_FILES:=LICENSE

LUCI_TITLE:=Oasisic theme
LUCI_DESCRIPTION:=A calm, Apple-inspired LuCI theme: sidebar navigation, \
	light and dark modes, and a clean login page.
LUCI_DEPENDS:=+luci-base
LUCI_MAINTAINER:=Noah <noah@oasisic.dev>
LUCI_URL:=https://github.com/Hawaiine/luci-theme-oasisic

# The stylesheet uses modern CSS (custom properties, :has(), :is(),
# color-mix(), clamp()) that csstidy mangles, so it ships as written.
LUCI_MINIFY_CSS:=0

#
# Never leave LuCI pointing at a theme whose files are gone: on removal,
# fall back to Bootstrap when it is registered, else to any other
# registered theme. An upgrade runs postrm too, so skip that case.
#
define Package/luci-theme-oasisic/postrm
#!/bin/sh
[ "$${1:-}" != upgrade ] && [ "$${PKG_UPGRADE:-}" != 1 ] || exit 0
[ -n "$${IPKG_INSTROOT}" ] || {
	if [ "$$(uci -q get luci.main.mediaurlbase)" = "/luci-static/oasisic" ]; then
		alt="$$(uci -q get luci.themes.Bootstrap)"
		[ -n "$$alt" ] || alt="$$(uci -q show luci.themes | sed -n \"s|^luci\\.themes\\.[A-Za-z0-9_]*='\\(/luci-static/[A-Za-z0-9_.-]*\\)'$$|\\1|p\" | grep -v '^/luci-static/oasisic$$' | head -n 1)"
		[ -z "$$alt" ] || uci -q set luci.main.mediaurlbase="$$alt"
	fi
	uci -q delete luci.themes.Oasisic
	uci -q commit luci
}
exit 0
endef

# In the LuCI tree (themes/luci-theme-oasisic) use ../../luci.mk; built from
# an external feed, use the luci feed installed in the build tree.
include $(if $(wildcard $(CURDIR)/../../luci.mk),$(CURDIR)/../../luci.mk,$(TOPDIR)/feeds/luci/luci.mk)

# call BuildPackage - OpenWrt buildroot signature
