"""Sinh templates/<game>/load-files.js — danh sách file một game 3D tải lúc MÀN CHỜ (Đợt 544: % load thật).

Đầu vào: bản ghi đo thật (scratch/dot543-rec.html?t=<game> gửi rec-<game>.json: mọi file tải TỪ LÚC màn chờ hiện).
Giữ: file cùng gốc dưới /templates/ hoặc /core/ (module, css, ảnh, fetch). Bỏ: thẻ <audio> (nhạc phát dần, không cần đợi), file ngoài.
Số byte lấy từ ĐĨA (sau khi nén tiếng) ⇒ đổi tiếng / xe / module thì chạy lại.
Chạy (từ gốc kho web):  python -I tools/tao-load-files.py <thư mục chứa rec-*.json>
"""
import glob, json, os, sys

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
SRC = sys.argv[1]
AUD = (".mp3", ".ogg")


def size(rel):
    p = os.path.join(ROOT, rel)
    return os.path.getsize(p) if os.path.isfile(p) else 0


for f in sorted(glob.glob(os.path.join(SRC, "rec-*.json"))):
    d = json.load(open(f, encoding="utf-8"))
    t = d["t"]
    seen, rows, alt, cars = set(), [], {}, {}
    for r in d["rec"]:
        u = r["u"].split("?")[0].split("#")[0]
        if not u.startswith("/") or r["i"] in ("audio", "video", "beacon"):
            continue
        rel = u.lstrip("/")
        if not (rel.startswith("templates/") or rel.startswith("core/")) or rel in seen:
            continue
        seen.add(rel)
        if t == "racing-words" and "/xe3d/" in rel:
            continue                                   # xe: template tự thêm đúng 2 xe đang chọn (CARS)
        b = size(rel)
        if not b:
            continue
        snd = rel.endswith(AUD)
        rows.append([rel, b, 1 if snd else 0])
        if rel.endswith(".ogg"):
            m = rel[:-4] + ".mp3"
            if size(m):
                alt[rel] = [m, size(m)]
    if t == "racing-words":
        for g in sorted(glob.glob(os.path.join(ROOT, "templates/racing-words/xe3d/*.glb"))):
            cars[os.path.basename(g)[:-4]] = os.path.getsize(g)
    tong = sum(r[1] for r in rows) + (sum(sorted(cars.values())[:2]) if cars else 0)
    js = ("// SINH bằng tools/tao-load-files.py (Đợt 544) từ lần đo thật — ĐỪNG sửa tay; đổi tiếng / xe / module thì chạy lại.\r\n"
          "// File game tải lúc MÀN CHỜ: [đường dẫn từ gốc web, số byte trên đĩa, là tiếng (1)] · ALT: .ogg ⇒ .mp3 (trình duyệt không đọc ogg)\r\n"
          f"export const FILES = {json.dumps(rows, ensure_ascii=False)};\r\n"
          f"export const ALT = {json.dumps(alt, ensure_ascii=False)};\r\n"
          + (f"export const CARS = {json.dumps(cars)};\r\n" if cars else ""))
    out = os.path.join(ROOT, "templates", t, "load-files.js")
    tmp = out + ".tmp"
    open(tmp, "w", encoding="utf-8", newline="").write(js)
    os.replace(tmp, out)
    print(f"{t:14s} {len(rows):3d} file  {tong // 1024:6d} KB  (tieng {sum(1 for r in rows if r[2])})")
