# -*- coding: utf-8 -*-
"""
kiem-live.py — KIỂM BẢN LIVE aword.andrewclasses.com đã đúng HEAD chưa (Đợt 482, 05/10/2026)

Từ Đợt 482 GitHub Pages xuất bản BẢN THU GỌN (.github/workflows/xuat-ban.yml + tools/xuat-ban.mjs):
file .js/.css trên live KHÁC byte với repo ⇒ so băm trực tiếp như trước sẽ luôn "lệch".
Công cụ này đọc build.json trên live:
  - build.json.sha == HEAD ⇒ bản live dựng đúng từ commit này.
  - mỗi file .js/.css: băm NGUỒN (CRLF→LF) ở HEAD == build.json.nguon[file].
  - file khác (.html, ảnh…): so byte live với HEAD (CRLF→LF) như cũ.
Chưa bật xuất bản thu gọn (live không có build.json) ⇒ so byte trực tiếp mọi file như cũ.

Dùng:
  python tools/kiem-live.py                 # các file đổi trong commit HEAD
  python tools/kiem-live.py core/engine.js index.html ...
  python tools/kiem-live.py --cho 300       # chờ tối đa 300 s cho tới khi khớp (sau khi push)
"""
import hashlib, json, os, subprocess, sys, time, urllib.request, urllib.error

GOC = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIVE = 'https://aword.andrewclasses.com/'


def git(*a):
    return subprocess.check_output(['git', *a], cwd=GOC)


def bam(b):
    return hashlib.sha256(b.replace(b'\r\n', b'\n')).hexdigest()[:16]


def tai(duong):
    q = urllib.parse.quote(duong) + ('&' if '?' in duong else '?') + 'k=' + str(time.time())
    try:
        with urllib.request.urlopen(urllib.request.Request(LIVE + q, headers={'Cache-Control': 'no-cache'}), timeout=30) as r:
            return r.read()
    except urllib.error.HTTPError as e:
        return None if e.code == 404 else b''


def kiem(files):
    head = git('rev-parse', 'HEAD').decode().strip()
    bj = tai('build.json')
    info = json.loads(bj) if bj else None
    ok = 0
    if info:
        print(f"build.json live: sha {info.get('sha', '?')[:7]} · dựng {info.get('luc', '?')} · thu gọn {info.get('thuGon')} file · lỗi {len(info.get('loi', []))}")
        if info.get('sha') != head:
            print(f"  ⏳ live chưa phải HEAD {head[:7]}")
    else:
        print('build.json: chưa có trên live ⇒ chế độ cũ (so byte trực tiếp)')
    for f in files:
        try:
            nguon = git('show', f'HEAD:{f}')
        except subprocess.CalledProcessError:
            print(f'  ?  {f} (không có ở HEAD)'); continue
        if info and f in info.get('nguon', {}):
            khop = info['nguon'][f] == bam(nguon)
            cach = 'nguồn'
        else:
            live = tai(f)
            khop = live is not None and bam(live) == bam(nguon)
            cach = 'byte'
        ok += khop
        print(f"  {'✅' if khop else '❌'} {f} ({cach})")
    tong_ok = ok == len(files) and (not info or info.get('sha') == head)
    print(f"LIVE {ok}/{len(files)}" + (' ✅' if tong_ok else ' ❌'))
    return tong_ok


if __name__ == '__main__':
    import urllib.parse
    a = sys.argv[1:]
    cho = 0
    if '--cho' in a:
        i = a.index('--cho'); cho = int(a[i + 1]); del a[i:i + 2]
    files = a or [x for x in git('diff', '--name-only', 'HEAD~1', 'HEAD').decode('utf-8').splitlines()
                  if x and not x.startswith(('.github/', 'scratch/', '_backup/')) and not x.endswith('.md')]
    het = time.time() + cho
    while True:
        if kiem(files) or time.time() > het:
            break
        time.sleep(20)
