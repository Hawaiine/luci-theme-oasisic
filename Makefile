#
# Copyright (C) 2026 Oasisic OpenWrt
#
# This is free software, licensed under the Apache 2.0 License.
#

include $(TOPDIR)/rules.mk

LUCI_TITLE:=Oasisic — A modern, elegant LuCI theme
LUCI_DESCRIPTION:=Apple-inspired minimal design with bypass gateway awareness, Nikki proxy status, daily Bing wallpapers, and full dark/light mode support.
LUCI_DEPENDS:=+luci-base

PKG_NAME:=luci-theme-oasisic
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_LICENSE:=Apache-2.0
PKG_LICENSE_FILES:=LICENSE
PKG_MAINTAINER:=Noah

include $(INCLUDE_DIR)/package.mk

define Package/$(PKG_NAME)
  SECTION:=luci
  CATEGORY:=LuCI
  SUBMENU:=Themes
  TITLE:=$(LUCI_TITLE)
  DEPENDS:=$(LUCI_DEPENDS)
  PKGARCH:=all
endef

define Package/$(PKG_NAME)/description
  $(LUCI_DESCRIPTION)
endef

define Build/Compile
endef

define Package/$(PKG_NAME)/install
	$(INSTALL_DIR) $(1)/www/luci-static/oasisic
	$(INSTALL_DIR) $(1)/usr/lib/lua/luci/view/oasisic
	$(INSTALL_DIR) $(1)/usr/share/ucode/luci/template/oasisic

	# Static assets
	$(CP) ./htdocs/luci-static/oasisic/* $(1)/www/luci-static/oasisic/

	# Lua templates
	$(CP) ./luasrc/template/oasisic/* $(1)/usr/lib/lua/luci/view/oasisic/

	# Lua dispatcher
	$(CP) ./luasrc/dispatcher/oasisic.lua $(1)/usr/lib/lua/luci/dispatcher/

	# ucode templates
	$(CP) ./ucode/template/oasisic/* $(1)/usr/share/ucode/luci/template/oasisic/
endef

$(eval $(call BuildPackage,$(PKG_NAME)))