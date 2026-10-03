"""Sinh core/words-picker.css từ tools/wp.src.css: mỗi số kèm dấu @ (vd 54@) -> calc(54 * var(--p)).
Chạy:  python tools/wp-css.py      (từ thư mục gốc kho web)"""
import os, re, sys
here = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(here, "wp.src.css")
dst = os.path.join(here, "..", "core", "words-picker.css")
s = open(src, encoding="utf-8", newline="").read()
out, n = re.subn(r"(-?\d*\.?\d+)@", lambda m: "calc(%s * var(--p))" % m.group(1), s)
if re.search(r"[0-9.]@", out):
    sys.exit("còn dấu @ lạ trong kết quả — dừng, không ghi")
tmp = dst + ".tmp"
open(tmp, "w", encoding="utf-8", newline="").write(out)
os.replace(tmp, dst)
print("ok", n)
