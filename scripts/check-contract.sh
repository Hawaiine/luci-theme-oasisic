#!/bin/sh
# Static contract check for the Oasisic LuCI theme.
#
# Asserts the rules a LuCI 25.12 theme must satisfy (see docs/luci-contract.md)
# directly against the tree. It cannot prove that a page renders - only a
# real device can - but it catches the regressions that make a theme silently
# unusable: a missing #maincontent, a theme loading luci.js twice, an
# unescaped login form, or core widget CSS left out.
#
# Exit status: 0 all checks passed, 1 at least one failed.

set -u
cd "$(dirname "$0")/.." || exit 2

fail=0
ok()   { printf '  ok    %s\n' "$1"; }
bad()  { printf '  FAIL  %s\n' "$1"; fail=$((fail + 1)); }

need() { # file, pattern, description
	if [ -f "$1" ] && grep -qE -- "$2" "$1"; then ok "$3"; else bad "$3"; fi
}
deny() { # file, pattern, description
	if [ -f "$1" ] && grep -qE -- "$2" "$1"; then bad "$3"; else ok "$3"; fi
}

H=ucode/template/themes/oasisic/header.ut
F=ucode/template/themes/oasisic/footer.ut
S=ucode/template/themes/oasisic/sysauth.ut
U=root/etc/uci-defaults/30_luci-theme-oasisic
M=Makefile

echo '== templates =='
need "$H" 'id="maincontent"'        'header opens #maincontent'
need "$H" 'id="indicators"'         'header provides #indicators'
need "$H" 'data-page='              'header sets body[data-page]'
need "$H" '\{\{ resource \}\}/cbi\.js' 'header loads cbi.js'
deny "$H" '\{\{ resource \}\}/luci\.js' 'header does not load luci.js (core does)'
deny "$H" 'node\?\.'                'header does not use node (never set on the ucode path)'
deny "$H" '<script src="[^"]*luci\.js' 'header has no hard-coded luci.js tag'
need "$H" 'ctx\.authsession'        'header gates the shell on a session'
deny "$H" '"#view"|id="view"'       'header does not emit #view (core owns it)'

need "$F" '</main>'                 'footer closes #maincontent'
need "$F" "L\.require\('menu-oasisic'\)" 'footer requires the menu module'
need "$F" 'ctx\.authsession'        'footer only requires the menu for a session'

need "$S" 'method="post"'           'login form posts'
need "$S" 'name="luci_username"'    'login form has luci_username'
need "$S" 'name="luci_password"'    'login form has luci_password'
deny "$S" 'action="'                'login form has no action attribute'
deny "$S" 'csrf_token'              'login form has no CSRF field'
deny "$S" 'fuser\.'                 'login page never dereferences fuser (attacker-controlled)'
need "$S" 'entityencode\(duser'     'login echoes duser entity-encoded'

echo '== packaging =='
need "$M" 'luci\.mk'                'Makefile includes luci.mk'
need "$M" 'LUCI_MINIFY_CSS:=0'      'modern CSS is not minified by csstidy'
need "$M" 'luci-theme-oasisic/postrm' 'Makefile ships a postrm'
deny "$M" '\$\(INSTALL_DIR\)'       'Makefile has no hand-written install rules'
if [ -d luasrc ]; then bad 'no luasrc/ (would pull the Lua runtime)'; else ok 'no luasrc/'; fi
if [ -f htdocs/luci-static/oasisic/sw.js ]; then bad 'no service worker'; else ok 'no service worker'; fi

echo '== theme registration =='
need "$U" 'luci\.themes\.Oasisic'   'uci-defaults registers luci.themes.Oasisic'
need "$U" 'PKG_UPGRADE'             'uci-defaults keeps the chosen theme on upgrade'
need "$U" 'mediaurlbase'            'uci-defaults selects the theme on a fresh install'

echo '== core widget CSS (LuCI sets state, CSS shows it) =='
C=htdocs/luci-static/oasisic/css/luci-base.css
for sel in '#modal_overlay' 'cbi-dropdown' 'data-tab-title' 'cbi-progressbar' \
           'cbi-tooltip' 'cbi-input-invalid' 'uci-change-list' 'ifacebadge' \
           'zonebadge' 'fade-out' 'cbi-dynlist' '\.hidden'; do
	need "$C" "$sel" "core CSS covers $sel"
done

echo '== assets referenced by the templates exist =='
for f in $(grep -ohE '\{\{ media \}\}/[A-Za-z0-9_./-]+' "$H" "$S" | sed 's|{{ media }}/||' | sort -u); do
	if [ -f "htdocs/luci-static/oasisic/$f" ]; then ok "asset $f"; else bad "asset $f is missing"; fi
done
if [ -f htdocs/luci-static/resources/menu-oasisic.js ]; then ok 'asset resources/menu-oasisic.js'; else bad 'menu-oasisic.js is missing'; fi

echo '== javascript syntax =='
if command -v node >/dev/null 2>&1; then
	for js in htdocs/luci-static/resources/menu-oasisic.js htdocs/luci-static/oasisic/js/theme.js; do
		if node --check "$js" 2>/dev/null; then ok "syntax $js"; else bad "syntax $js"; fi
	done
else
	printf '  skip  node not available\n'
fi

echo '== css brace balance =='
for css in htdocs/luci-static/oasisic/css/*.css; do
	open=$(tr -cd '{' < "$css" | wc -c)
	close=$(tr -cd '}' < "$css" | wc -c)
	if [ "$open" -eq "$close" ]; then ok "braces $css ($open)"; else bad "braces $css ($open/$close)"; fi
done

echo
if [ "$fail" -eq 0 ]; then
	echo "RESULT: PASS (all contract checks)"
	exit 0
fi
echo "RESULT: FAIL ($fail check(s) failed)"
exit 1
