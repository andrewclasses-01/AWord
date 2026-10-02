# -*- coding: utf-8 -*-
"""
CHÉP STAR LOOT (myGame) ⇒ AWord templates/maze-chase/  — Đợt 447 (02/10/2026)

STAR LOOT được THIẾT KẾ ở kho myGame (E:/LAP TRINH APP/myGame/maze-chase, mẫu mới nhất có chỗ nối AWord = 2n).
AWord chỉ CHÉP lại, không sửa tay các file trong templates/maze-chase/3d/ — sửa ở myGame (bản mới = tên mới),
thầy OK rồi chạy lại công cụ này (đổi BAN bên dưới nếu lõi đổi tên).

Việc công cụ làm:
  1. Chép các file lõi STAR LOOT vào templates/maze-chase/3d/ , đổi import three:
       "three"                    ⇒ "../../rocket-race/vendor/three/three.module.min.js"
       "three/addons/<nhom>/X.js" ⇒ "../../rocket-race/vendor/three/addons/X.js"
     (dùng CHUNG bộ three r170 mà Rocket Race đã vendor — không tải two lần, không CDN)
  2. Chép đúng các file tiếng mà mc3d-audio-*.js khai trong LIB vào templates/maze-chase/am-thanh/ (+ NGUON.md giấy phép).
  3. Ghi 3d/NGUON.json: mã commit myGame + danh sách file, để biết AWord đang chạy bản nào.
Chạy:  python tools/chep-star-loot.py            (từ thư mục gốc web hoặc worktree)
"""
import json, os, re, shutil, subprocess, sys

SRC = r"E:/LAP TRINH APP/myGame/maze-chase"
WEB = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DST = os.path.join(WEB, "templates", "maze-chase")

# lõi STAR LOOT đang dùng (đọc từ dòng import của mc3d-2n.js)
BAN = "2n"
CORE = [f"mc3d-{BAN}.js", f"mc3d-{BAN}.css", "mc3d-audio-2n.js", "mc3d-intro-2m.js", "mc3d-maps-1t.js",
        "mc3d-floor-1f.js", "mc3d-boom-1v.js", "mc3d-hatch-1s.js", "mc3d-ship-2j.js", "mc3d-gate-2b.js"]
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
    src_core = os.path.join(SRC, "core")
    # 0. lõi phải import đúng bộ file trên (lệch = dừng, đừng chép nửa vời)
    main_js = rd(os.path.join(src_core, CORE[0]))
    imported = set(re.findall(r'from\s+"\./(mc3d-[\w-]+\.js)"', main_js))
    need = set(f for f in CORE if f.endswith(".js")) - {CORE[0]}
    for f in list(need):
        imported |= set(re.findall(r'from\s+"\./(mc3d-[\w-]+\.js)"', rd(os.path.join(src_core, f))))
    if imported - need:
        sys.exit(f"DỪNG: lõi import file chưa có trong CORE: {sorted(imported - need)}")
    if need - imported:
        print(f"chú ý: CORE thừa (không ai import): {sorted(need - imported)}")

    out3d = os.path.join(DST, "3d")
    os.makedirs(out3d, exist_ok=True)
    for f in CORE:
        s = rd(os.path.join(src_core, f))
        if f.endswith(".js"):
            s = re.sub(r'from\s+"three"', f'from "{VENDOR}/three.module.min.js"', s)
            s = re.sub(r'from\s+"three/addons/[\w-]+/([\w-]+\.js)"', rf'from "{VENDOR}/addons/\1"', s)
            left = re.findall(r'from\s+"three[^"]*"', s)
            if left:
                sys.exit(f"DỪNG: {f} còn import three chưa đổi: {left}")
            for addon in re.findall(r'vendor/three/addons/([\w-]+\.js)"', s):
                if not os.path.exists(os.path.join(WEB, "templates", "rocket-race", "vendor", "three", "addons", addon)):
                    sys.exit(f"DỪNG: thiếu addon three {addon} trong rocket-race/vendor/three/addons")
        wr(os.path.join(out3d, f), s)
        print("chép", f)

    # 2. tiếng: đúng các khoá LIB của module âm thanh
    audio = rd(os.path.join(src_core, "mc3d-audio-2n.js"))
    lib = audio[audio.index("const LIB = {"):]
    lib = lib[:lib.index("\n};")]
    ids = re.findall(r'(?<![\w.])(\w+):\s*\{\s*v:', lib)
    adir_src = os.path.join(SRC, "am-thanh")
    adir = os.path.join(DST, "am-thanh")
    os.makedirs(adir, exist_ok=True)
    total = 0
    for i in ids:
        p = os.path.join(adir_src, i + ".mp3")
        if not os.path.exists(p):
            sys.exit(f"DỪNG: thiếu file tiếng {i}.mp3")
        shutil.copyfile(p, os.path.join(adir, i + ".mp3"))
        total += os.path.getsize(p)
    shutil.copyfile(os.path.join(adir_src, "NGUON.md"), os.path.join(adir, "NGUON.md"))
    # dọn file tiếng cũ không còn dùng
    for f in os.listdir(adir):
        if f.endswith(".mp3") and f[:-4] not in ids:
            os.remove(os.path.join(adir, f))
            print("xoá tiếng thừa", f)
    print(f"tiếng: {len(ids)} file, {total / 1048576:.1f} MB")

    head = subprocess.run(["git", "-C", os.path.dirname(SRC), "rev-parse", "--short", "HEAD"], capture_output=True, text=True).stdout.strip()
    dirty = subprocess.run(["git", "-C", os.path.dirname(SRC), "status", "--porcelain", "maze-chase"], capture_output=True, text=True).stdout.strip()
    wr(os.path.join(out3d, "NGUON.json"), json.dumps({
        "nguon": "myGame/maze-chase/core", "ban": BAN, "commit": head, "con_sua_chua_commit": bool(dirty),
        "files": CORE, "tieng": len(ids)}, ensure_ascii=False, indent=1) + "\n")
    print("xong — myGame", head, "(CÒN SỬA CHƯA COMMIT)" if dirty else "")


if __name__ == "__main__":
    main()
