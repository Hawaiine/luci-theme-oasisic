# 🏝️ luci-theme-oasisic

**一款现代优雅的 OpenWrt LuCI 主题** — Apple 风格极简设计，支持旁路网关模式自适应、Nikki 代理状态面板和每日 Bing 壁纸

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![OpenWrt](https://img.shields.io/badge/OpenWrt-24.10+-orange)](https://openwrt.org)
[![Version](https://img.shields.io/badge/version-1.0.0-black)](.)

---

## 📸 截图预览

| 页面 | 预览 |
|------|------|
| **🔐 登录页** — 毛玻璃卡片 + Bing 每日壁纸 + Passkey/2FA | ![登录页](https://raw.githubusercontent.com/Hawaiine/luci-theme-oasisic/main/assets/screenshots/login.png) |
| **📊 仪表盘** — 探针风格概览 + Nikki 代理状态 + 拓扑 + 流量图 | ![仪表盘](https://raw.githubusercontent.com/Hawaiine/luci-theme-oasisic/main/assets/screenshots/dashboard.png) |

---

## ✨ 特性

### 🎨 设计
- **Apple 极简设计语言** — 毛玻璃（Glassmorphism）登录卡片、卡片式仪表盘、精准的字体间距系统
- **深色/浅色模式** — 跟随系统 `prefers-color-scheme`，支持快捷键 `T` 手动切换
- **响应式布局** — 完美适配桌面端（≥1200px）、平板（768-1199px）、手机（<768px）
- **system-ui 原生字体** — 不加载任何外部字体，各平台自动选择渲染最佳字体

### 🌐 旁路网关模式
- **自动检测** — 检测到 WAN 未连接 + 有上游网关时，自动进入旁路模式
- **仪表盘调整** — 状态栏显示上游网关和代理状态，而非 WAN 信息
- **拓扑可视化** — 显示主路由 → 旁路 → 客户端 → 代理节点的完整拓扑
- **代理流量图** — 流量图表展示代理流量占比（如 78%）

### ⚡ Nikki 代理集成
- 仪表盘首页实时显示 **Nikki 状态卡片**：
  - 代理模式（规则/全局/直连）
  - 当前节点及延迟（如 🇯🇵 AWS-JP · 42ms）
  - 今日流量统计（↑ 128MB · ↓ 1.2GB）
  - 运行时长
- 自动跟随 `nikkinikki-org/OpenWrt-nikki` 上游更新做适配

### 🖼️ 每日壁纸系统
- 登录页自动获取 **Bing 每日壁纸**（国内直连，无需 API Key）
- 6 小时自动更换，缓存到 localStorage
- 自动适配屏幕分辨率（桌面/平板/手机）
- 加载失败时自动降级到内置深色渐变背景

### 🔐 安全认证
- **Passkey / WebAuthn** — 登录页支持无密码生物认证（需安装 `webauthn-token`）
- **TOTP 两步验证** — 基于 `oath-toolkit` 的完整实现
  - 支持 Google Authenticator、Authy、1Password 等扫码绑定
  - 两步登录流程：密码 → TOTP 验证码 → 登录成功
  - 设置入口：系统 → 两步验证
  - 前后各 1 个时间窗口容错（共 90 秒有效窗口）

### 📐 技术架构
- **零外部依赖** — 纯 CSS + JavaScript，无 Node.js、无 CDN 字体、无构建工具
- **CSS 自定义属性体系** — 完整的 Design Token，一键切换亮/暗模式
- **Shadow-border 技术** — 用 `box-shadow` 替代传统 CSS border，更精细的视觉表现
- **双模板引擎** — 同时支持 Lua 和 ucode 模板，兼容新旧 OpenWrt
- **i18n 国际化** — 英文 + 中文，模板化支持扩展其他语言

---

## 🔧 安装

### 方式一：预编译包（推荐）

从 [Releases 页面](https://github.com/Hawaiine/luci-theme-oasisic/releases) 下载：

```bash
# OpenWrt 24.10+ (APK 包管理器)
apk add luci-theme-oasisic_1.0.0_all.apk

# OpenWrt 23.05 (IPK 包管理器)
opkg install luci-theme-oasisic_1.0.0_all.ipk
```

### 方式二：源码编译

```bash
# 克隆到 OpenWrt 源码目录
git clone https://github.com/Hawaiine/luci-theme-oasisic.git package/luci-theme-oasisic

# 配置 feeds（如果尚未添加）
./scripts/feeds update -a
./scripts/feeds install -a

# 选择主题
make menuconfig
# → LuCI → Themes → luci-theme-oasisic

# 编译
make package/luci-theme-oasisic/compile V=s
```

### 方式三：手动安装

```bash
# 将文件直接复制到路由器
cp -r htdocs/luci-static/oasisic /www/luci-static/
cp -r luasrc/* /usr/lib/lua/luci/
cp -r ucode/* /usr/share/ucode/luci/template/
```

### 启用主题

进入 **系统 → 系统 → 语言和界面**，在「主题」下拉菜单中选择「Oasisic」。

---

## 🎨 设计系统

### 色彩体系

| 色值 | 浅色模式 | 深色模式 | 用途说明 |
|------|---------|---------|---------|
| `--primary` | `#0071e3` | `#0071e3` | Apple Blue — 所有可交互元素 |
| `--bg-body` | `#f5f5f7` | `#1c1c1e` | 页面背景色 |
| `--bg-card` | `#ffffff` | `#2c2c2e` | 卡片/面板背景 |
| `--bg-sidebar` | `#1d1d1f` | `#0f0f11` | 侧栏导航背景 |
| `--text-primary` | `#1d1d1f` | `#f5f5f7` | 正文主色 |
| `--text-secondary` | `#86868b` | `#98989d` | 辅助文字 |
| 绿色 | `#30d158` | `#30d158` | 成功/在线状态 |
| 橙色 | `#ff9f0a` | `#ff9f0a` | 警告/告警 |
| 红色 | `#ff453a` | `#ff453a` | 错误/离线 |

### 字体系统

```css
/* 主字体 — 各平台原生最优 */
font-family: system-ui, -apple-system, 'Segoe UI', Roboto,
             'Helvetica Neue', sans-serif;

/* 等宽字体 — 代码和数据 */
font-family: ui-monospace, SFMono-Regular, Menlo, Monaco,
             Consolas, 'Liberation Mono', 'Courier New', monospace;
```

### 间距 & 圆角

| CSS 变量 | 值 | 用途 |
|----------|-----|------|
| `--radius-sm` | 6px | 按钮、输入框、小标签 |
| `--radius-md` | 10px | 标准卡片、面板 |
| `--radius-lg` | 14px | 大卡片、弹窗 |
| `--radius-xl` | 18px | 外层容器、登录卡 |
| 登录卡 | 24px | 毛玻璃登录卡片 |

### 旁路模式检测逻辑

```
检测设备网络角色
├── WAN 已连接 → 普通路由模式
│   ├── 状态栏：WAN IP / 在线设备数
│   └── 流量图：WAN 接口流量
│
└── WAN 未连接 + 有上游网关 → 旁路网关模式
    ├── 状态栏：代理状态（Nikki） / 上游网关 / DNS
    ├── 卡片区：Nikki 状态置顶 / 系统信息 / 网络状态
    ├── 拓扑图：主路由 → 旁路网关 → 客户端 → 代理节点
    ├── 流量图：代理流量 + 代理占比（如 78%）
    └── 侧栏：标注「旁路」标识
```

---

## 🔄 兼容性

### OpenWrt 版本

| 版本 | 包格式 | 状态 | 说明 |
|------|--------|------|------|
| 25.12+ | APK | ✅ 计划中 | 支持 APK 包管理器 |
| 24.10 | APK/IPK | ✅ 已验证 | **推荐版本** |
| 23.05 | IPK | ✅ 已验证 | 广泛兼容 |
| 22.03 | IPK | ⚠️ 待测试 | 可能需要微调 |

### 第三方插件适配

| 插件 | 适配状态 | 说明 |
|------|---------|------|
| **luci-app-nikki** | ✅ **完整适配** | 仪表盘首页状态卡片、所有页面样式适配 |
| luci-app-passwall | ⏳ 计划中 | 页面样式适配 |
| luci-app-ssr-plus | ⏳ 计划中 | 页面样式适配 |
| luci-app-openclash | ⏳ 计划中 | 页面样式适配 |

---

## ⚙️ 配置

### 版本号更新
修改 `Makefile` 中的 `PKG_VERSION`，所有页面（登录页脚、仪表盘右上角）自动跟随：

```makefile
PKG_VERSION:=1.0.1  # 改为新版本号后重新编译
```

### 登录页壁纸
- **默认：** Bing 每日壁纸，每 6 小时自动更换
- **自定义：** 安装 `luci-app-oasisic-config`（规划中）后可在界面上传
- **回退：** 内置深色渐变 `#1a1a2e → #16213e → #0f3460`

### 开启 TOTP 两步验证
```bash
# 1. 安装 oath-toolkit
opkg update && opkg install oath-toolkit

# 2. 在 LuCI 中配置
# 进入 系统 → 两步验证 → 生成密钥
# 用 Google Authenticator 扫码
# 输入验证码 → 启用

# 3. 此后登录流程
# 输入密码 → 输入 TOTP 验证码 → 登录成功
```

---

## 📦 项目结构

```
luci-theme-oasisic/
├── Makefile                              # OpenWrt 编译规则
├── README.md                             # 说明文档（中英双语）
├── README.zh-CN.md                       # 中文说明
├── LICENSE                               # Apache 2.0
│
├── .github/workflows/
│   ├── build-test.yml                    # CI: 语法检查 + 结构验证
│   └── sync-upstream.yml                 # CI: 每日检测 OpenWrt/Nikki 更新
│
├── htdocs/luci-static/oasisic/           # 前端静态资源
│   ├── css/
│   │   ├── oasisic.css                   # 核心样式（变量 + 布局 + 全部组件）
│   │   ├── oasisic-dark.css              # 深色模式覆盖
│   │   ├── login.css                     # 登录页专用样式
│   │   └── dashboard.css                 # 仪表盘 + 拓扑 + 响应式
│   ├── js/
│   │   ├── oasisic.js                    # 核心：主题切换、侧栏折叠、快捷键
│   │   ├── login.js                      # 登录页：壁纸、TOTP、抖动动画
│   │   ├── dashboard.js                  # 仪表盘：自动刷新 10s
│   │   └── totp.js                       # TOTP 设置：生成密钥、启用/停用
│   └── img/logo.svg                      # 菱形网络节点 Logo
│
├── luasrc/                               # Lua 后端
│   ├── dispatcher/oasisic.lua            # 主题注册器（L.registerTheme）
│   ├── controller/oasisic/totp.lua       # TOTP 验证控制器
│   └── template/oasisic/                 # 页面模板
│       ├── header.htm                    # 页面头部（侧栏、导航）
│       ├── footer.htm                    # 页面底部
│       ├── sysauth.htm                   # 登录页（含 2FA 流程）
│       └── totp_setup.htm               # TOTP 设置页
│
├── ucode/template/oasisic/              # ucode 模板（OpenWrt 24.10+）
│   ├── header.ut
│   └── footer.ut
│
├── assets/
│   └── screenshots/                      # 截图
│       ├── login.png
│       └── dashboard.png
│
└── assets/concepts/                      # 设计概念图（gitignore）
```

---

## 📌 未来规划

- [ ] **luci-app-oasisic-config** — 可视化主题配置 App
  - 自定义背景图上传
  - 主题色预设切换（5+ 套配色）
  - 侧栏布局选项（展开/图标/磁贴）
  - 仪表盘卡片显隐控制
- [ ] **实时流量拓扑** — 类似 UniFi 的节点间连线动画
- [ ] **PWA 支持** — 移动端添加到主屏幕，App 级体验
- [ ] **WebSSH 终端** — 内嵌主题化 Web Shell
- [ ] **性能分析面板** — 网络延迟/吞吐量历史图表
- [ ] **系统健康报告** — 一键导出 PDF 报告
- [ ] **多主题色预设** — 内置 5-8 套配色方案一键切换
- [ ] **区块编辑器** — 仪表盘卡片拖拽排序/显隐

---

## 🤝 贡献

1. **Fork** 本仓库
2. 创建功能分支：`git checkout -b feat/your-feature`
3. 提交变更（**请使用中文描述 commit**）
4. Push 并创建 Pull Request

> 质量要求：
> - 每个 PR 需在至少 2 个 OpenWrt 版本上验证
> - 页面加载 < 500ms
> - 主题包体积 < 200KB（不含背景图）
> - 兼容 Chrome / Firefox / Safari / Edge

---

## 📄 许可证

Apache 2.0 © 2026 [Oasisic OpenWrt](LICENSE)

---

<p align="center">
  <sub>Made with ❤️ by Oasisic OpenWrt</sub>
</p>