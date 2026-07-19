#
# Copyright (C) 2026 Oasisic OpenWrt
# Licensed under Apache 2.0
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

define Build/Configure
endef

define Build/Compile
endef

define Package/$(PKG_NAME)/install
	# 静态文件
	$(INSTALL_DIR) $(1)/www/luci-static/oasisic/css
	$(INSTALL_DIR) $(1)/www/luci-static/oasisic/js
	$(INSTALL_DIR) $(1)/www/luci-static/oasisic/img
	$(CP) ./htdocs/luci-static/oasisic/css/* $(1)/www/luci-static/oasisic/css/
	$(CP) ./htdocs/luci-static/oasisic/js/* $(1)/www/luci-static/oasisic/js/
	$(CP) ./htdocs/luci-static/oasisic/img/* $(1)/www/luci-static/oasisic/img/
	$(CP) ./htdocs/luci-static/oasisic/manifest.json $(1)/www/luci-static/oasisic/
	$(CP) ./htdocs/luci-static/oasisic/sw.js $(1)/www/luci-static/oasisic/

	# Lua 模板（主题视图路径）
	$(INSTALL_DIR) $(1)/usr/lib/lua/luci/view/themes/oasisic
	$(CP) ./luasrc/template/themes/oasisic/* $(1)/usr/lib/lua/luci/view/themes/oasisic/

	# ucode 模板（主题视图路径）
	$(INSTALL_DIR) $(1)/usr/share/ucode/luci/view/themes/oasisic
	$(CP) ./ucode/template/themes/oasisic/* $(1)/usr/share/ucode/luci/view/themes/oasisic/

	# 控制器
	$(INSTALL_DIR) $(1)/usr/lib/lua/luci/controller/oasisic
		$(CP) ./luasrc/controller/oasisic/*.lua $(1)/usr/lib/lua/luci/controller/oasisic/

	# 版本信息
	$(INSTALL_DIR) $(1)/usr/lib/lua/luci/dispatcher
	$(CP) ./luasrc/dispatcher/oasisic.lua $(1)/usr/lib/lua/luci/dispatcher/

	# 主题注册
	$(INSTALL_DIR) $(1)/etc/uci-defaults
	$(CP) ./root/etc/uci-defaults/* $(1)/etc/uci-defaults/
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(CP) ./root/usr/share/luci/menu.d/* $(1)/usr/share/luci/menu.d/

	# 翻译文件
	$(INSTALL_DIR) $(1)/usr/lib/lua/luci/i18n
		$(CP) ./luasrc/controller/oasisic/$(PKG_NAME).zh-cn.lmo $(1)/usr/lib/lua/luci/i18n/
endef

$(eval $(call BuildPackage,$(PKG_NAME)))