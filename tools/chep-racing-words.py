# -*- coding: utf-8 -*-
"""
CHÉP RACING WORDS (myGame speed-run) ⇒ AWord templates/racing-words/  — Đợt 527 (15/10/2026)

RACING WORDS (tên cũ SPEED RUN — đua siêu xe 2 đội, intro xưởng ANDREW STUDIO, âm thanh thật) được THIẾT KẾ ở kho myGame
(E:/LAP TRINH APP/myGame/speed-run, mẫu 3o = GÓI NHÚNG core/rw-3o.js ⇒ createRacingWords). Khuôn ghép như STAR LOOT / TRAIN RUSH.
⛔ Không sửa tay templates/racing-words/3d/ — sửa ở myGame (bản mới = tên mới), thầy OK rồi chạy lại công cụ này
(đổi GOC nếu gói nhúng đổi tên, và đường import trong racing-words.js).

Công cụ làm:
  1. Lần theo import từ GOC (rw-3o.js) + GOC_THEM (màn iPad cho pad.js, đường nối iPad) ⇒ chép vào 3d/, đổi import:
       "three"                    ⇒ "../../rocket-race/vendor/three/three.module.min.js"   (dùng CHUNG three r170 của Rocket Race)
       "three/addons/<nhom>/X.js" ⇒ "../../rocket-race/vendor/three/addons/X.js"           (Đợt 527 thêm GLTFLoader, meshopt, Decal, RectAreaLight*)
       "../../maze-chase/core/mc3d-qr.js" ⇒ "./mc3d-qr.js"                                (mã QR của bảng iPad — chép kèm)
  2. Chép CSS (CSS bên dưới), BỎ luật html/body/#game (AWord không được đụng trang).
  3. Chép 13 xe xe3d/<id>.glb (BỎ H3 Bugatti Divo — CC-BY-NC) + toàn bộ sfx/ (29 tiếng + NGUON AM THANH.md).
  4. Ghi 3d/NGUON.json = mã commit myGame + danh sách file.
Chạy:  python tools/chep-racing-words.py
"""
import json, os, re, shutil, subprocess, sys

SRC = r"E:/LAP TRINH APP/myGame/speed-run"
QR = r"E:/LAP TRINH APP/myGame/maze-chase/core/mc3d-qr.js"
WEB = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DST = os.path.join(WEB, "templates", "racing-words")
GOC = "rw-3q.js"   # Đợt 531: 3q = 3p + Fight options (Lives · Missile damages · Time delay · Miss wait · streak) + cảnh xa đúng vật lý + 35 km/h. Trước: GOC = "rw-3p.js"   # Đợt 529: 3p = 3o + chạm đúp bỏ intro + tối ưu (gộp lưới xe, bỏ kính transmission, số đo xe đo sẵn, dịch sẵn shader). Đợt 527: 3o — gói nhúng
GOC_THEM = ["sr3d-padui-3m.js", "sr3d-padlink-3e.js"]   # màn iPad (pad.js nạp) + đường nối iPad (racing-words.js nạp createPadHost)
CSS = ["sr3d-3g.css", "sr3d-3l.css", "sr3d-intro-3o.css", "rw-3q.css"]   # Đợt 531: rw-3q.css (vạch Lives, thanh chờ)
BO_XE = {"H3"}     # Bugatti Divo: CC-BY-NC — thầy chốt bỏ (lớp học có thu phí)
VENDOR = "../../rocket-race/vendor/three"


def rd(p):
    with open(p, "r", encoding="utf-8", newline="") as f:
        return f.read()


def wr(p, s):
    s.encode("utf-8")
    tmp = p + ".tmp"
    with open(tmp, "w", encoding="utf-8", newline="") as f:
        f.write(s)
    os.replace(tmp, p)


def main():
    core = os.path.join(SRC, "core")
    out3d = os.path.join(DST, "3d")
    os.makedirs(out3d, exist_ok=True)
    # 1. lần import
    todo, files = [GOC] + GOC_THEM, []
    while todo:
        f = todo.pop()
        if f in files:
            continue
        files.append(f)
        s = rd(os.path.join(core, f))
        for r in re.findall(r'from\s+"\./([\w.-]+\.js)"', s) + re.findall(r'import\("\./([\w.-]+\.js)"\)', s):
            todo.append(r)
    for f in files:
        s = rd(os.path.join(core, f))
        s = re.sub(r'from\s+"three"', f'from "{VENDOR}/three.module.min.js"', s)
        s = re.sub(r'from\s+"three/addons/[\w-]+/([\w.-]+\.js)"', rf'from "{VENDOR}/addons/\1"', s)
        s = s.replace('from "../../maze-chase/core/mc3d-qr.js"', 'from "./mc3d-qr.js"')
        left = re.findall(r'from\s+"(three)[^"]*"', s) + re.findall(r'from\s+"\.\./(?!\.\./rocket-race/vendor/)[^"]*"', s) + re.findall(r'https://cdn\.jsdelivr\.net[^"\']*', s)
        if left:
            sys.exit(f"DỪNG: {f} còn import / đường CDN chưa đổi: {left}")
        for addon in re.findall(r'vendor/three/addons/([\w.-]+\.js)"', s):
            if not os.path.exists(os.path.join(WEB, "templates", "rocket-race", "vendor", "three", "addons", addon)):
                sys.exit(f"DỪNG: thiếu addon three {addon} trong rocket-race/vendor/three/addons")
        wr(os.path.join(out3d, f), s)
        print("chép", f)
    shutil.copyfile(QR, os.path.join(out3d, "mc3d-qr.js")); files.append("mc3d-qr.js"); print("chép mc3d-qr.js")
    # 2. CSS — bỏ luật đụng cả trang
    for c in CSS:
        s = rd(os.path.join(core, c))
        keep = [l for l in s.splitlines(True) if not re.match(r'\s*(html\s*,\s*body|body|html|#game)\b[^{]*\{', l)]
        s = "".join(keep)
        if re.search(r'(^|[\s,}])(html|body|#game)\s*[,{]', re.sub(r'/\*.*?\*/', '', s, flags=re.S)):
            sys.exit(f"DỪNG: {c} còn luật html/body/#game nhiều dòng — sửa tay ở myGame")
        wr(os.path.join(out3d, c), s)
        print("chép", c)
    # 2b. dọn file cũ trong 3d/
    keep = set(files) | set(CSS) | {"NGUON.json"}
    for f in os.listdir(out3d):
        if f not in keep:
            os.remove(os.path.join(out3d, f)); print("xoá cũ", f)
    # 3. xe + tiếng
    for sub, ok in (("xe3d", lambda f: f.endswith(".glb") and f[:-4] not in BO_XE), ("sfx", lambda f: f.endswith(".mp3") or f.endswith(".md"))):
        sd, od = os.path.join(SRC, sub), os.path.join(DST, sub)
        os.makedirs(od, exist_ok=True)
        names = sorted(f for f in os.listdir(sd) if ok(f))
        for f in names:
            shutil.copyfile(os.path.join(sd, f), os.path.join(od, f))
        for f in os.listdir(od):
            if f not in names:
                os.remove(os.path.join(od, f)); print("xoá cũ", sub, f)
        print(f"{sub}: {len(names)} file")
    head = subprocess.run(["git", "-C", os.path.dirname(SRC), "rev-parse", "--short", "HEAD"], capture_output=True, text=True).stdout.strip()
    dirty = subprocess.run(["git", "-C", os.path.dirname(SRC), "status", "--porcelain", "speed-run"], capture_output=True, text=True).stdout.strip()
    wr(os.path.join(out3d, "NGUON.json"), json.dumps({"nguon": "myGame/speed-run/core", "goc": GOC, "commit": head,
        "con_sua_chua_commit": bool(dirty), "js": files, "css": CSS, "bo_xe": sorted(BO_XE)}, ensure_ascii=False, indent=1) + "\n")
    print("xong — myGame", head, "(CÒN SỬA CHƯA COMMIT)" if dirty else "")


if __name__ == "__main__":
    main()
