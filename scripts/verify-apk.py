#!/usr/bin/env python3
"""Verify a luci-theme-oasisic .apk contains the expected theme paths.

apk-tools 3 packages are NOT gzip tarballs: they begin with the 4-byte magic
"ADBd" followed by a raw-deflate stream of ADB segments. `tar -tzf` therefore
fails with "not in gzip format", which is why the old CI check always printed
"部分路径缺失". This script decompresses the payload and asserts the path
markers really exist.

Exit 0 if every marker is present, 1 otherwise (CI treats 1 as failure).
"""
import sys
import zlib

# Path markers that must appear in the packaged tree. Kept as bytes because we
# search the raw decompressed stream.
NEED = [
    b'www/luci-static/oasisic/css',
    b'www/luci-static/oasisic/js',
    b'www/luci-static/oasisic/img',
    b'usr/share/ucode/luci/template/themes/oasisic',
    b'etc/uci-defaults/30_luci-theme-oasisic',
    b'menu-oasisic.js',
    b'theme.js',
    b'header.ut',
    b'footer.ut',
    b'sysauth.ut',
    b'luci-base.css',
    b'luci-mobile.css',
    b'oasisic.css',
    b'oasisic-dark.css',
    b'shell.css',
    b'presets.css',
    b'login.css',
    b'logo.svg',
]


def main(path):
    data = open(path, 'rb').read()
    if data[:4] != b'ADBd':
        print('FAIL: not an apk v3 (ADB) package, magic=%r' % data[:4])
        return 1
    try:
        dec = zlib.decompressobj(-15).decompress(data[4:])
    except zlib.error as exc:
        print('FAIL: cannot decompress ADB payload: %s' % exc)
        return 1

    missing = [p.decode() for p in NEED if p not in dec]
    if missing:
        print('FAIL: missing markers: ' + ', '.join(missing))
        return 1
    print('OK: %d/%d markers present in %s' % (len(NEED), len(NEED), path))
    return 0


if __name__ == '__main__':
    if len(sys.argv) != 2:
        print('usage: verify-apk.py <package.apk>')
        sys.exit(2)
    sys.exit(main(sys.argv[1]))
