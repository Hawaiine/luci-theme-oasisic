# 🏝️ luci-theme-oasisic

**A modern, elegant OpenWrt LuCI theme** — Apple-inspired minimal design with bypass gateway awareness, Nikki proxy dashboard, and daily Bing wallpapers.

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![OpenWrt](https://img.shields.io/badge/OpenWrt-24.10+-orange)](https://openwrt.org)
[![Version](https://img.shields.io/badge/version-1.0.0-black)](.)

---

## ✨ Features

- **Apple-inspired design** — Clean glassmorphism login page, card-based dashboard, precise typography
- **Bypass gateway aware** — Automatically detects bypass/sidecar mode, prioritizes proxy status display
- **Nikki integration** — Dashboard shows Nikki proxy status (mode, node latency, traffic) when installed
- **Daily wallpapers** — Login background auto-fetches Bing daily wallpaper with 6-hour refresh
- **Dark / Light mode** — Follows system preference with manual toggle (Ctrl+B or sidebar switch)
- **Passkey & 2FA ready** — WebAuthn and TOTP support on login page
- **Responsive** — Desktop, tablet, and mobile optimized
- **i18n ready** — English + Chinese (zh-CN) with extensible language support
- **Modern CSS** — CSS custom properties, shadow-border technique, smooth transitions
- **No external dependencies** — Pure CSS/JS, no Node.js, no CDN fonts, no build tools

## 📸 Screenshots

| Page | Preview |
|------|---------|
| **Login** | ![Login](assets/screenshots/login.png) |
| **Dashboard** | ![Dashboard](assets/screenshots/dashboard.png) |
| **Sidebar** | ![Sidebar](assets/screenshots/sidebar.png) |

> Screenshots will be added after first release.

## 🔧 Installation

### Option 1: Pre-built IPK/APK (recommended)

Download from [Releases](https://github.com/Hawaiine/luci-theme-oasisic/releases):

```bash
# OpenWrt 24.10+ (APK)
apk add luci-theme-oasisic_1.0.0_all.apk

# OpenWrt 23.05 (IPK)
opkg install luci-theme-oasisic_1.0.0_all.ipk
```

### Option 2: Build from source

```bash
# Clone into your OpenWrt source tree
git clone https://github.com/Hawaiine/luci-theme-oasisic.git package/luci-theme-oasisic

# Select in menuconfig
make menuconfig
# → LuCI → Themes → luci-theme-oasisic

# Build
make package/luci-theme-oasisic/compile V=s
```

### Option 3: Manual install

```bash
# Copy files directly
cp -r htdocs/luci-static/oasisic /www/luci-static/
cp -r luasrc/* /usr/lib/lua/luci/
cp -r ucode/* /usr/share/ucode/luci/template/
```

After installing, go to **System → System → Language and Style** and select "Oasisic" as the theme.

## ⚙️ Configuration

Set the `PKG_VERSION` in `Makefile` before building to update the version displayed on every page:

```makefile
PKG_VERSION:=1.0.1  # Change this
```

### Login wallpaper

By default, the theme fetches **Bing daily wallpaper** every 6 hours. To use a custom background:

1. Go to **System → Oasisic Config** (if `luci-app-oasisic-config` is installed)
2. Upload your own background image
3. Or set a custom wallpaper URL

Fallback: If no wallpaper is available, a dark gradient (`#1a1a2e → #0f3460`) is used.

## 🎨 Design System

### Colors

| Token | Light | Dark |
|-------|-------|------|
| Primary Blue | `#0071e3` | `#0071e3` |
| Background | `#f5f5f7` | `#1c1c1e` |
| Card | `#ffffff` | `#2c2c2e` |
| Sidebar | `#1d1d1f` | `#0f0f11` |
| Text | `#1d1d1f` | `#f5f5f7` |

### Typography

- **Font stack:** `system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif`
- **Mono:** `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`
- No external fonts loaded — uses system-native fonts for zero network overhead

### Bypass mode detection

The theme automatically detects if the device is in bypass gateway mode:
- WAN not connected? Upstream gateway set? → Bypass mode
- Dashboard shows Nikki status, upstream gateway info, proxy traffic chart
- Sidebar shows "bypass" tag

## 🔄 Compatibility

| OpenWrt | Status | Notes |
|---------|--------|-------|
| 25.12+ (APK) | ✅ Planned | APK package support |
| 24.10 | ✅ Tested | Recommended |
| 23.05 | ✅ Tested | IPK package |
| 22.03 | ⚠️ Untested | May work with adjustments |

**Third-party plugins adapted:**

| Plugin | Status | Dashboard integration |
|--------|--------|----------------------|
| luci-app-nikki | ✅ Full | Status card on home page |
| luci-app-passwall | ⏳ Planned | Plugin pages adapted |

## 📌 Future Roadmap

- [ ] `luci-app-oasisic-config` — visual theme configuration (background, accent color, layout)
- [ ] Real-time traffic topology visualization
- [ ] PWA support for mobile app-like experience
- [ ] Multi-accent-color preset switching (5+ color schemes)
- [ ] Dashboard widget editor (drag & drop card visibility)
- [ ] WebSSH terminal in theme styling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (use Chinese descriptions)
4. Push and open a Pull Request

Please test on at least 2 OpenWrt versions before submitting.

## 📄 License

Apache 2.0 © 2026 [Oasisic OpenWrt](LICENSE)