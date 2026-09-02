# =============================================================
# Đợt 285 — SINH / KIỂM khối <link rel="modulepreload"> trong index.html và play.html
#
# Vì sao có file này: trình duyệt chỉ biết một file JS cần những file nào SAU
# KHI đã tải xong chính file đó, nên 39 file mã của main.js về theo 4 đợt nối
# đuôi (đo thật 2,8 giây trắng lúc mạng lạnh). Liệt kê sẵn toàn bộ bằng
# modulepreload thì tất cả tải cùng một đợt. Danh sách này SINH TỰ ĐỘNG từ các
# câu `import` tĩnh thật (đi từ main.js / play.js), không viết tay.
#
# Cách dùng (chạy trong thư mục web/):
#   python tools/sinh-preload.py            # chỉ in danh sách + báo lệch
#   python tools/sinh-preload.py --check    # mã thoát 1 nếu HTML lệch so với code
#   python tools/sinh-preload.py --write    # ghi lại khối giữa 2 mốc AW-PRELOAD
#
# KHI NÀO PHẢI CHẠY LẠI: thêm/bớt một `import` tĩnh trong main.js, play.js hay
# bất kỳ file core/ nào. Quên chạy thì KHÔNG hỏng gì — file mới chỉ tải chậm
# như trước Đợt 285 (rơi về kiểu tải nối đuôi). Import động `import("...")`
# CỐ Ý không nằm trong danh sách (template, fight, showdown-export... chỉ tải
# khi dùng tới).
# =============================================================
import os, re, sys, io
# Console Windows mặc định cp1252 — in tiếng Việt là nổ UnicodeEncodeError.
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))   # .../web
PAGES = { "index.html": "main.js", "play.html": "play.js" }
BEGIN, END = "  <!-- AW-PRELOAD:BEGIN -->", "  <!-- AW-PRELOAD:END -->"

IMP = re.compile(r'^\s*(?:import|export)\s[^;]*?from\s*["\']([^"\']+)["\']|^\s*import\s*["\']([^"\']+)["\']', re.M)

def static_graph(entry):
    """Mọi module đi tới được từ `entry` bằng import TĨNH, theo thứ tự gặp (BFS
    theo độ sâu — file gần gốc đứng trước để trình duyệt ưu tiên đúng)."""
    seen, order, queue = set(), [], [entry]
    while queue:
        rel = queue.pop(0)
        if rel in seen: continue
        seen.add(rel); order.append(rel)
        src = io.open(os.path.join(ROOT, rel), encoding="utf-8").read()
        for m in IMP.finditer(src):
            t = m.group(1) or m.group(2)
            if not t.startswith("."): continue
            queue.append(os.path.normpath(os.path.join(os.path.dirname(rel), t)).replace(os.sep, "/"))
    return order

def block_for(entry):
    mods = static_graph(entry)[1:]          # bỏ chính file gốc — <script src> đã nạp nó
    lines = [f'  <link rel="modulepreload" href="{m}" />' for m in mods]
    return mods, "\n".join(lines)

def current_block(html):
    a, b = html.find(BEGIN), html.find(END)
    if a < 0 or b < 0 or b < a: raise SystemExit("thiếu mốc AW-PRELOAD trong HTML")
    return a + len(BEGIN), b

def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else ""
    bad = 0
    for page, entry in PAGES.items():
        path = os.path.join(ROOT, page)
        html = io.open(path, encoding="utf-8", newline="").read()
        mods, want = block_for(entry)
        s, e = current_block(html)
        have = html[s:e].strip("\r\n")
        ok = have == want
        print(f"{page}: {len(mods)} module tĩnh từ {entry} — {'KHỚP' if ok else 'LỆCH'}")
        if mode == "":
            for m in mods: print("   ", m)
        if not ok:
            bad += 1
            if mode == "--write":
                new = html[:s] + "\n" + want + "\n" + html[e:]
                tmp = path + ".tmp"
                io.open(tmp, "w", encoding="utf-8", newline="").write(new)
                os.replace(tmp, path)
                print(f"    -> đã ghi lại khối trong {page}")
    if mode == "--check" and bad: sys.exit(1)

if __name__ == "__main__":
    main()
