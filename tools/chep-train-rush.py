# -*- coding: utf-8 -*-
"""
CHÉP TRAIN RUSH FIGHT (myGame) ⇒ AWord templates/balloon-pop/3d/  — Đợt 449 (03/10/2026)

TRAIN RUSH (Balloon pop 3D miền Tây) được THIẾT KẾ ở kho myGame (E:/LAP TRINH APP/myGame/balloon-pop, mẫu mới nhất 1aj).
AWord dùng phần FIGHT (Balloon pop ▸ Mode ▸ Fight — kiểu Rocket Race: Single vẫn 2D, Fight là cảnh 3D).
⛔ Không sửa tay templates/balloon-pop/3d/ — sửa ở myGame (bản mới = tên mới), thầy OK rồi chạy lại công cụ này
(đổi GOC nếu mô-đun Fight đổi tên, và đường import trong balloon-pop.js).

Công cụ làm:
  1. Lần theo import từ GOC (fight-1aj.js) ⇒ chép mọi file lõi cần vào 3d/, đổi import:
       "three"                    ⇒ "../../rocket-race/vendor/three/three.module.min.js"   (dùng CHUNG three r170 của Rocket Race)
       "three/addons/<nhom>/X.js" ⇒ "../../rocket-race/vendor/three/addons/X.js"
       "cannon-es"                ⇒ "../vendor/cannon-es.js"                              (cannon-es 0.20.0 vendor)
       phông helvetiker trên jsDelivr ⇒ bản vendor của Rocket Race
  2. Chép CSS của trận (CSS bên dưới), BỎ luật html/body/#game (AWord không được đụng trang).
  3. Chép nguyên thư mục tiếng assets/sound-1ah (+ NGUON.md) ⇒ templates/balloon-pop/assets/sound-1ah/.
  4. Ghi 3d/NGUON.json = mã commit myGame + danh sách file.
Chạy:  python tools/chep-train-rush.py
"""
import json, os, re, shutil, subprocess, sys

SRC = r"E:/LAP TRINH APP/myGame/balloon-pop"
WEB = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DST = os.path.join(WEB, "templates", "balloon-pop")
GOC = "fight-1ak.js"   # Đợt 450: 1ak — Single cũng 3D (lõi bp3d-1ak có chỗ nối AWord `host`)
CSS = ["bp3d.css", "bp3d-1j.css", "bp3d-1p.css", "bp3d-1q.css", "bp3d-1r.css", "bp3d-1ab.css", "fight-cine-1ae.css", "fight-1ak.css", "bp3d-1ak.css"]
SOUND = "sound-1ah"
VENDOR = "../../rocket-race/vendor/three"
FONT_CDN = "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/fonts/helvetiker_bold.typeface.json"


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
    todo, files = [GOC], []
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
        s = re.sub(r'from\s+"three/addons/[\w-]+/([\w-]+\.js)"', rf'from "{VENDOR}/addons/\1"', s)
        s = re.sub(r'from\s+"cannon-es"', 'from "../vendor/cannon-es.js"', s)
        s = s.replace(f'"{FONT_CDN}"', f'new URL("{VENDOR}/helvetiker_bold.typeface.json", import.meta.url).href')
        left = re.findall(r'from\s+"(three|cannon-es)[^"]*"', s) + re.findall(r'https://cdn\.jsdelivr\.net[^"\']*', s)
        if left:
            sys.exit(f"DỪNG: {f} còn import / đường CDN chưa đổi: {left}")
        for addon in re.findall(r'vendor/three/addons/([\w-]+\.js)"', s):
            if not os.path.exists(os.path.join(WEB, "templates", "rocket-race", "vendor", "three", "addons", addon)):
                sys.exit(f"DỪNG: thiếu addon three {addon} trong rocket-race/vendor/three/addons")
        wr(os.path.join(out3d, f), s)
        print("chép", f)
    # 2. CSS — bỏ luật đụng cả trang
    for c in CSS:
        s = rd(os.path.join(core, c))
        keep = [l for l in s.splitlines(True) if not re.match(r'\s*(html\s*,\s*body|body|html|#game)\b[^{]*\{', l)]
        s = "".join(keep)
        if re.search(r'(^|[\s,}])(html|body|#game)\s*[,{]', re.sub(r'/\*.*?\*/', '', s, flags=re.S)):
            sys.exit(f"DỪNG: {c} còn luật html/body/#game nhiều dòng — sửa tay ở myGame")
        wr(os.path.join(out3d, c), s)
        print("chép", c)
    # 2b. dọn file cũ trong 3d/ không còn trong bộ (đổi bản 1aj ⇒ 1ak…)
    keep = set(files) | set(CSS) | {"NGUON.json"}
    for f in os.listdir(out3d):
        if f not in keep:
            os.remove(os.path.join(out3d, f)); print("xoá cũ", f)
    # 3. tiếng
    sdir = os.path.join(SRC, "assets", SOUND)
    odir = os.path.join(DST, "assets", SOUND)
    os.makedirs(odir, exist_ok=True)
    n = 0
    for f in os.listdir(sdir):
        shutil.copyfile(os.path.join(sdir, f), os.path.join(odir, f)); n += 1
    print(f"tiếng: {n} file")
    head = subprocess.run(["git", "-C", os.path.dirname(SRC), "rev-parse", "--short", "HEAD"], capture_output=True, text=True).stdout.strip()
    dirty = subprocess.run(["git", "-C", os.path.dirname(SRC), "status", "--porcelain", "balloon-pop"], capture_output=True, text=True).stdout.strip()
    wr(os.path.join(out3d, "NGUON.json"), json.dumps({"nguon": "myGame/balloon-pop/core", "goc": GOC, "commit": head,
        "con_sua_chua_commit": bool(dirty), "js": files, "css": CSS, "tieng": SOUND}, ensure_ascii=False, indent=1) + "\n")
    print("xong — myGame", head, "(CÒN SỬA CHƯA COMMIT)" if dirty else "")


if __name__ == "__main__":
    main()
