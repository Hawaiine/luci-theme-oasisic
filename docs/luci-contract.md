# LuCI 25.12 主题契约（Oasisic 实现规范）

本文件记录 `luci-theme-oasisic` 必须满足的 LuCI 主题契约。`scripts/check-contract.sh`
会逐项静态校验这些规则（不证明页面能渲染，只拦截会让主题静默失效的回归）。

## 模板（ucode）契约

- **header.ut**
  - 输出文档头到 `<body>` 为止；`#view` 由核心在 `#maincontent` 内注入，**主题不得输出 `#view`**。
  - 提供 `<div id="maincontent">`（对匿名/空白页也开一个 `<div id="maincontent">`）。
  - 提供 `<div id="indicators">`（核心把 uci-changes / poll-status / media_error 写到这里）。
  - 在 body 上设置 `data-page`。
  - 加载 `cbi.js`：**不得**再加载 `luci.js`（核心 header 已打印 `L = new LuCI(...)`）。
  - **不得**使用 `node`（ucode 渲染路径上该变量永远未设置）。
  - 外壳（侧栏/顶栏）只在有 `ctx.authsession` 时输出。
- **footer.ut**
  - 闭合 `#maincontent` 与外壳。
  - 仅在有 session 时 `L.require('menu-oasisic')` 加载侧栏脚本。
- **sysauth.ut（登录页）**
  - 表单 `method="post"`，字段 `luci_username` / `luci_password`，无 `action` 属性（回发到当前 URL）。
  - 登录表单**不带** CSRF 字段（LuCI 登录契约如此）。
  - `fuser` 仅供测试、绝不解引用（它来自请求，攻击者可控制）；错误提示为通用文案。
  - `duser`（上次成功登录的用户）必须 `entityencode` 后回显。

## 打包契约（Makefile）

- 使用标准 `luci.mk`，**不得**手写 `$(INSTALL_DIR)` 之类的安装规则（`luci.mk` 按树形映射
  `ucode/→/usr/share/ucode/luci/`、`htdocs/→/www/`、`root/→/`、`po/→luci-i18n-*`）。
- `LUCI_MINIFY_CSS:=0`：主题用现代 CSS（`@property`、`:has()`、`:is()`、`color-mix()`、`clamp()`），
  csstidy 会破坏它们，必须原样发布。
- 提供 `postrm`：卸载/升级后若 `luci.main.mediaurlbase` 仍指向本主题，回退到 Bootstrap（或任一已注册主题），
  并删除 `luci.themes.Oasisic`，避免 LuCI 指向已消失的主题。
- **不得**保留 `luasrc/`（会引入 Lua 运行时，而主题已在 ucode 上）。
- **不得**发布 Service Worker（`sw.js` / `manifest.json`）——LuCI 页面由核心管理，注册 SW 会劫持核心请求。

## 主题注册契约（uci-defaults）

- 注册 `luci.themes.Oasisic=/luci-static/oasisic`。
- 仅在「全新安装且该条目为新」时把 `luci.main.mediaurlbase` 设为本主题，升级/重装不得覆盖管理员已选主题
  （用 `PKG_UPGRADE` 判断）。

## 核心控件 CSS

LuCI 的控件 JS 只设置状态类，是否显示/隐藏由 CSS 决定（`cbi-dropdown`、`#modal_overlay`、
`data-tab-title`、`cbi-progressbar`、`cbi-tooltip`、`cbi-input-invalid`、`uci-change-list`、
`ifacebadge`、`zonebadge`、`fade-out`、`cbi-dynlist`、`.hidden`）。`luci-base.css` 从 bootstrap
原样 vendored，保证每个原生页面在 Oasisic 下可用；Oasisic 的设计在 `oasisic.css` 之上叠加。

## 资产

模板引用的 `{{ media }}/...` 资产必须真实存在于 `htdocs/luci-static/oasisic/`；`resources/menu-oasisic.js`
也必须存在（由 footer 在 session 下 require）。
