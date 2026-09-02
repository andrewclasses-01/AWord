# =============================================================
# Đợt 285/286 — SINH / KIỂM hai thứ, đều từ các câu `import` tĩnh THẬT trong code:
#
#   (1) khối <link rel="modulepreload"> trong index.html và play.html
#       (mọi module đi tới được từ main.js / play.js);
#   (2) core/tpl-files.js — với TỪNG template trong core/catalog.js: file css +
#       mọi module đi tới được từ file `load:` của nó. registry.ensureTemplate()
#       fetch() cả danh sách một lúc trước khi import() (xem chú thích bên đó).
#
# Vì sao: trình duyệt chỉ biết một file JS cần những file nào SAU KHI đã tải
# xong chính file đó ⇒ tải nối đuôi từng vòng ~300ms. Liệt kê sẵn thì tất cả
# đi cùng một đợt. Không viết tay hai danh sách này.
#
# Cách dùng (chạy trong thư mục web/):
#   python tools/sinh-preload.py            # chỉ in danh sách + báo lệch
#   python tools/sinh-preload.py --check    # mã thoát 1 nếu file đích lệch so với code
#   python tools/sinh-preload.py --write    # ghi lại khối AW-PRELOAD + core/tpl-files.js
#
# KHI NÀO PHẢI CHẠY LẠI: thêm/bớt một `import` tĩnh ở main.js, play.js, bất kỳ
# file core/ hay templates/ nào; thêm template mới vào catalog. Quên chạy thì
# KHÔNG hỏng gì — file mới chỉ tải chậm như trước (rơi về kiểu tải nối đuôi).
# Import động `import("...")` CỐ Ý không nằm trong danh sách trang (template,
# fight, showdown-export... chỉ tải khi dùng tới).
# =============================================================
import os, re, sys, io
# Console Windows mặc định cp1252 — in tiếng Việt là nổ UnicodeEncodeError.
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))   # .../web
PAGES = { "index.html": "main.js", "play.html": "play.js" }
BEGIN, END = "  <!-- AW-PRELOAD:BEGIN -->", "  <!-- AW-PRELOAD:END -->"
TPL_OUT = "core/tpl-files.js"
CATALOG = "core/catalog.js"

IMP = re.compile(r'^\s*(?:import|export)\s[^;]*?from\s*["\']([^"\']+)["\']|^\s*import\s*["\']([^"\']+)["\']', re.M)

def rel_join(base_rel, target):
    return os.path.normpath(os.path.join(os.path.dirname(base_rel), target)).replace(os.sep, "/")

def static_graph(entry):
    """Mọi module đi tới được từ `entry` bằng import TĨNH, theo thứ tự gặp (BFS
    theo độ sâu — file gần gốc đứng trước để trình duyệt ưu tiên đúng)."""
    seen, order, queue = set(), [], [entry]
    while queue:
        rel = queue.pop(0)
        if rel in seen: continue
        seen.add(rel); order.append(rel)
        p = os.path.join(ROOT, rel)
        # file chưa tồn tại (vd core/tpl-files.js ở lần chạy đầu, hoặc import
        # trỏ sai) — vẫn liệt kê, chỉ không lần tiếp; đừng làm generator chết.
        if not os.path.exists(p):
            print(f"    ! không thấy {rel} (import từ đâu đó) — bỏ qua nhánh này")
            continue
        src = io.open(p, encoding="utf-8").read()
        for m in IMP.finditer(src):
            t = m.group(1) or m.group(2)
            if not t.startswith("."): continue
            queue.append(rel_join(rel, t))
    return order

# ---- (1) khối modulepreload cho từng trang ----------------------------------
def block_for(entry):
    mods = static_graph(entry)[1:]          # bỏ chính file gốc — <script src> đã nạp nó
    # fetchpriority="high": mặc định Chrome xếp modulepreload vào nhóm "có thể trì
    # hoãn" (dưới CSS/font); 39 file này đều nằm trên đường găng.
    lines = [f'  <link rel="modulepreload" href="{m}" fetchpriority="high" />' for m in mods]
    return mods, "\n".join(lines)

def current_block(html):
    a, b = html.find(BEGIN), html.find(END)
    if a < 0 or b < 0 or b < a: raise SystemExit("thiếu mốc AW-PRELOAD trong HTML")
    return a + len(BEGIN), b

# ---- (2) core/tpl-files.js ---------------------------------------------------
ENTRY = re.compile(
    r'type:\s*"([^"]+)"(?P<body>.*?)load:\s*\(\)\s*=>\s*import\("([^"]+)"\)', re.S)
CSS = re.compile(r'css:\s*"([^"]+)"')

def template_files():
    """{type: [đường dẫn tương đối gốc web...]} — css trước, rồi module theo BFS.
    Lấy hết mọi template (kể cả chưa built) — template chưa built thì không ai
    gọi ensureTemplate, danh sách thừa vô hại."""
    src = io.open(os.path.join(ROOT, CATALOG), encoding="utf-8").read()
    out = {}
    for m in ENTRY.finditer(src):
        typ, body, load = m.group(1), m.group("body"), m.group(3)
        files = []
        c = CSS.search(body)
        if c: files.append(c.group(1))
        files += static_graph(rel_join(CATALOG, load))
        # bỏ file core/ dùng chung — trang đã modulepreload sẵn, khỏi fetch lại
        files = [f for f in files if not f.startswith("core/")]
        out[typ] = files
    return out

def tpl_source(tf):
    lines = [
        "// =============================================================",
        "// core/tpl-files.js — SINH TỰ ĐỘNG bởi `python tools/sinh-preload.py --write`",
        "// ⛔ ĐỪNG SỬA TAY. Với từng template: file css + mọi module import tĩnh đi từ",
        "// file `load:` trong core/catalog.js (bỏ core/ dùng chung — trang đã preload).",
        "// registry.ensureTemplate() fetch() cả danh sách một lúc trước khi import()",
        "// (Đợt 286). Thiếu/lệch danh sách chỉ làm chậm, không làm hỏng.",
        "// =============================================================",
        "export const TPL_FILES = {",
    ]
    for typ in tf:
        items = ", ".join(f'"{f}"' for f in tf[typ])
        lines.append(f'  "{typ}": [{items}],')
    lines.append("};")
    return "\n".join(lines) + "\n"

def write_atomic(path, text):
    tmp = path + ".tmp"
    io.open(tmp, "w", encoding="utf-8", newline="").write(text)
    os.replace(tmp, path)

def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else ""
    bad = 0
    # (2) trước, vì registry.js import tpl-files.js ⇒ nó phải TỒN TẠI khi quét (1)
    tf = template_files()
    want_tpl = tpl_source(tf)
    tpl_path = os.path.join(ROOT, TPL_OUT)
    have_tpl = io.open(tpl_path, encoding="utf-8", newline="").read() if os.path.exists(tpl_path) else ""
    ok = have_tpl == want_tpl
    print(f"{TPL_OUT}: {len(tf)} template — {'KHỚP' if ok else 'LỆCH'}")
    if mode == "":
        for typ in tf: print(f"    {typ}: {len(tf[typ])} file")
    if not ok:
        bad += 1
        if mode == "--write":
            write_atomic(tpl_path, want_tpl)
            print(f"    -> đã ghi {TPL_OUT}")
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
                write_atomic(path, html[:s] + "\n" + want + "\n" + html[e:])
                print(f"    -> đã ghi lại khối trong {page}")
    if mode == "--check" and bad: sys.exit(1)

if __name__ == "__main__":
    main()
