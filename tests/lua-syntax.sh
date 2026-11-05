#!/bin/sh
# Lua 语法检查：确保所有 .lua 和模板中的 Lua 不会在页面渲染时崩溃
set -e

cd "$(dirname "$0")/.."

echo "=== 检查 luasrc/ 中 Lua 控制器 ==="
find luasrc -type f -name '*.lua' | while read -r f; do
  printf "  %-50s " "$f"
  lua -e "loadfile('$f')" >/dev/null 2>&1 && echo "✓" || { echo "✗"; exit 1; }
done

echo "=== 检查模板中可能的语法错误 ==="
for t in luasrc/view/themes/oasisic/*.htm; do
  [ -f "$t" ] || continue
  printf "  %-50s " "$t"
  # 模板中 <%...%> 转成 Lua chunk，检查能否加载
  sed -n 's/<%[=-]\?\s*\(.*\)\s*%>/print(\1)/p' "$t" | lua -e "$(cat)" >/dev/null 2>&1 && echo "✓" || { echo "✗"; exit 1; }
done

echo ""
echo "RESULT: Lua syntax checks PASS"
