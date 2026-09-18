# -*- coding: utf-8 -*-
r"""
ftg-prepare.py — chuẩn bị MỘT bài nghe thành act FIND THE GAP (gói .json để Import vào AWord).

Việc nó làm (Đợt 340, 18/9/2026):
  1. Tìm nguyên liệu theo MÃ BÀI trong D:\4. LISTENING (hoặc nhận đường dẫn thẳng):
       <mã>.txt   kịch bản (mỗi dòng "Người nói: câu"), AUDIO\<mã>.mp3 (không có thì rút từ .mp4),
       <mã>.xlsm  sheet WORDTABLE/WORDS = từ vựng của bài (gợi ý chỗ trống).
  2. ffmpeg → wav 16 kHz → Parakeet (E:\LAP TRINH APP\MODEL\parakeet_words.py) → mốc giây từng chữ.
  3. Khớp từng dòng kịch bản vào dòng chữ ASR (SequenceMatcher, cửa sổ tuần tự) → start/end mỗi dòng.
     Dòng khớp yếu (< 0,6) được ghi cờ `weak` + chữ máy nghe được để thầy sửa text trong editor.
  4. Chỗ trống: nếu .xlsm có sheet FILLGAP (myWord sinh bằng CLI — thầy chốt 18/9) thì lấy Y NGUYÊN từ đó:
       cột A người nói · cột B câu với từ/cụm cần khoét bọc [ngoặc vuông] · cột C, D, E… nhiễu cho chỗ ₁, ₂, ₃
       (mỗi ô một danh sách cách nhau bằng dấu phẩy). Các dòng của sheet thay cho kịch bản .txt.
     Không có sheet đó: kịch bản .txt + gợi ý = từ trong câu có mặt trong WORDTABLE/WORDS (so lỏng bỏ s/es/ed/ing).
  5. Ghi gói {folder, folderPath, folderPathKnown, activities:[act]} — đúng hình dạng Import của
     AWord (core/lesson-import.js) — cạnh file .txt hoặc vào --out.

Dùng:
  python tools\ftg-prepare.py LSA2-S1.T1.P1-2-3
  python tools\ftg-prepare.py LSA2-S1.T1.P1-2-3 --out "D:\...\LSA2-S1.T1.P1-2-3.ftg.json"
  python tools\ftg-prepare.py --txt a.txt --audio a.mp3 [--xlsm a.xlsm] --code LSA2-S1.T1.P1-2-3
  --no-gaps      không gợi ý chỗ trống     --keep-narrator  KHÔNG tắt các dòng "Question N:" (mặc định giữ nhưng tắt)
  --pk file.json dùng lại kết quả Parakeet đã có (bỏ qua bước nghe)
  --no-cache     nghe lại băng dù đã có cache <audio>.pk.json

Đợt 341 (18/9/2026 — myWord v2.5.0 gọi tool này bằng nút "Tạo gói AWord"):
  • Gọi parakeet_words.py ĐÚNG GIAO ƯỚC `--out <base>` (bản cũ quên --out → argparse chết ngay trên máy có
    parakeet_words.py bản 20/07). Thư mục tạm trải về đường dẫn đầy đủ (bẫy 8.3 `ANDREW~1` làm libsndfile không mở
    được wav — bài học mySpeaking 21/07).
  • CACHE mốc giây từng chữ cạnh audio: `AUDIO\<mã>.pk.json` (thầy chốt 18/9) — sửa FILLGAP rồi tạo gói lại chỉ khớp
    lại (<1 s), không nghe lại cả băng. Đây là NGOẠI LỆ duy nhất của luật "chỉ đọc thư mục bài".
  • ffmpeg DÒ nhiều chỗ (MODEL\ffmpeg, AutoSubs, myLesson-data\bin, PATH) — máy thầy không có ffmpeg trong PATH.
  • Dòng FILLGAP (kể cả Narrator) LUÔN enabled — thầy chốt "câu hỏi đề bài tính như câu thoại thường".
  • Dòng cuối stdout: `@@KQ {"out","items","gaps","weak","cache"}` để myWord đọc kết quả, không đoán từ log.

⛔ CHỈ ĐỌC nguyên liệu gốc (trừ file cache .pk.json nói trên); wav tạm ghi vào %TEMP%. Không đụng .xlsm/.txt/.mp3.
Yêu cầu: Python 3 + openpyxl (đọc .xlsm), ffmpeg (dò), Parakeet venv E:\LAP TRINH APP\MODEL\_parakeet_venv (GPU).
"""
import argparse, io, json, os, re, subprocess, sys, tempfile, time
from difflib import SequenceMatcher

MODEL_DIR = r"E:\LAP TRINH APP\MODEL"
PK_PY = os.path.join(MODEL_DIR, "_parakeet_venv", "Scripts", "python.exe")
PK_SCRIPT = os.path.join(MODEL_DIR, "parakeet_words.py")
LISTEN_ROOT = r"D:\4. LISTENING"

def find_ffmpeg():
    """ffmpeg không có trong PATH của máy thầy — dò các chỗ đã biết (khuôn mySpeaking sub.js) rồi mới tới PATH."""
    cands = [
        os.path.join(MODEL_DIR, "ffmpeg", "ffmpeg.exe"),
        os.path.join(os.path.expanduser("~"), "AppData", "Local", "AutoSubs", "ffmpeg.exe"),
        os.path.join(MODEL_DIR, "whispercpp", "ffmpeg.exe"),
        r"E:\LAP TRINH APP\myLesson-data\bin\ffmpeg.exe",
        r"E:\LAP TRINH APP\myStudent-data\bin\ffmpeg.exe",
        r"C:\ffmpeg\bin\ffmpeg.exe",
    ]
    for p in cands:
        if os.path.exists(p):
            return p
    for d in os.environ.get("PATH", "").split(os.pathsep):
        p = os.path.join(d, "ffmpeg.exe")
        if d and os.path.exists(p):
            return p
    return None

FFMPEG = find_ffmpeg()

# Cây thư mục của AWord (chép từ core/lesson-import.js LESSON_TREE — giữ cho khớp)
LESSON_TREE = {
    "LSFLY": ["LISTENING", "1. LISTENING FOR FLYER"], "FLY": ["LISTENING", "1. LISTENING FOR FLYER"],
    "LSA2": ["LISTENING", "2. LISTENING FOR A2"], "LSB1": ["LISTENING", "3. LISTENING FOR B1"],
    "IEL": ["LISTENING", "4. LISTENING FOR IELTS"], "IE": ["LISTENING", "4. LISTENING FOR IELTS"],
}
RE_LESSON_CODE = re.compile(r"^([A-Za-z0-9]+)-S(\d+)((?:\.[A-Za-z0-9+\-]+)*)")

NUM_WORDS = {
    "0": "zero", "1": "one", "2": "two", "3": "three", "4": "four", "5": "five", "6": "six", "7": "seven",
    "8": "eight", "9": "nine", "10": "ten", "11": "eleven", "12": "twelve", "13": "thirteen", "14": "fourteen",
    "15": "fifteen", "16": "sixteen", "17": "seventeen", "18": "eighteen", "19": "nineteen", "20": "twenty",
    "30": "thirty", "40": "forty", "50": "fifty", "60": "sixty", "70": "seventy", "80": "eighty", "90": "ninety",
}

def log(*a):
    print(*a, flush=True)

def norm_word(w):
    w = w.lower().replace("’", "'").replace("‘", "'")
    w = re.sub(r"[^a-z0-9']", "", w)
    return "okay" if w in ("ok", "o'k") else w   # kịch bản viết "OK." còn máy nghe "Okay." (đo P1: dòng 1 chữ khớp 0.00 oan)

def asr_tokens(word):
    """Một 'chữ' ASR có thể là '6.15' hay '10' — đổi số thành chữ để so được với kịch bản."""
    w = word.lower().replace("’", "'")
    parts = re.split(r"[.:]", w) if re.fullmatch(r"[\d.:]+", w) else [w]
    out = []
    for p in parts:
        p = norm_word(p)
        if not p:
            continue
        if p.isdigit():
            n = int(p)
            if p in NUM_WORDS:
                out.append(NUM_WORDS[p])
            elif 21 <= n <= 99:
                out.append(NUM_WORDS[str(n // 10 * 10)])
                out.append(NUM_WORDS[str(n % 10)])
            else:
                out.append(p)
        else:
            out.append(p)
    return out

def lesson_folder_path(code):
    m = RE_LESSON_CODE.match(re.sub(r"\.{2,}", ".", re.sub(r"\s*\(\d+\)", "", code)))
    if not m or m.group(1).upper() not in LESSON_TREE:
        return {"segments": [code], "leaf": code, "known": False}
    parts = f"{m.group(1)}-S{m.group(2)}{m.group(3)}".split(".")
    chain = [".".join(parts[: i + 1]) for i in range(len(parts))]
    chain[-1] = code
    return {"segments": LESSON_TREE[m.group(1).upper()] + chain, "leaf": code, "known": True}

# ---------------------------------------------------------------- tìm nguyên liệu
def find_materials(code):
    found = {"txt": None, "audio": None, "mp4": None, "xlsm": None}
    for root, dirs, files in os.walk(LISTEN_ROOT):
        for f in files:
            stem, ext = os.path.splitext(f)
            if stem != code:
                continue
            p = os.path.join(root, f)
            e = ext.lower()
            if e == ".txt": found["txt"] = found["txt"] or p
            elif e == ".mp3": found["audio"] = found["audio"] or p
            elif e == ".mp4": found["mp4"] = found["mp4"] or p
            elif e in (".xlsm", ".xlsx"): found["xlsm"] = found["xlsm"] or p
    return found

# ---------------------------------------------------------------- kịch bản
def read_transcript(path):
    lines = []
    for raw in io.open(path, encoding="utf-8-sig").read().splitlines():
        raw = raw.strip()
        if not raw or re.fullmatch(r"PART\s+\d+", raw, re.I):
            continue
        m = re.match(r"^([A-Za-z][A-Za-z .'\-]{0,24}):\s*(.+)$", raw)
        speaker, text = (m.group(1).strip(), m.group(2).strip()) if m else ("", raw)
        narrator = bool(re.match(r"^(question|part)\s*\d+", raw, re.I))
        if narrator:
            speaker, text = "Narrator", raw
        # cùng một phép đổi số→chữ với phía ASR ("22" → "twenty two"), không thì "Room 22" khớp yếu oan
        words = [t for w in re.findall(r"[A-Za-z0-9’'.:]+", text) for t in asr_tokens(w)]
        lines.append({"speaker": speaker, "text": text, "words": words, "narrator": narrator})
    return lines

# ---------------------------------------------------------------- sheet FILLGAP (myWord)
def parse_bracket_line(text):
    """'I work in the [High Street], next to the [bookshop].' → (câu sạch, [{word, span?}]).
    Ngoặc chỉ là dấu hiệu: bỏ đi rồi tách từ theo khoảng trắng, nên dấu câu dính từ ("[bookshop].")
    vẫn ở nguyên trong token — chỉ số từ khớp với cách tokenize() của ftg-shared.js."""
    out, gaps = [], []
    open_at = None
    for tok in text.split():
        has_open = "[" in tok
        has_close = "]" in tok
        clean = tok.replace("[", "").replace("]", "")
        if not clean:
            continue
        idx = len(out)
        out.append(clean)
        if has_open and open_at is None:
            open_at = idx
        if has_close and open_at is not None:
            span = idx - open_at + 1
            gaps.append({"word": open_at, "span": span} if span > 1 else {"word": open_at})
            open_at = None
    if open_at is not None:   # ngoặc quên đóng: coi như khoét một từ
        gaps.append({"word": open_at})
    return " ".join(out), gaps

def read_fillgap(xlsm):
    try:
        import openpyxl
    except ImportError:
        return None
    wb = openpyxl.load_workbook(xlsm, read_only=True, data_only=True)
    name = next((n for n in wb.sheetnames if n.strip().upper().replace(" ", "") == "FILLGAP"), None)
    if not name:
        return None
    lines = []
    for row in wb[name].iter_rows(values_only=True):
        if not row or len(row) < 2 or not row[1] or not isinstance(row[1], str):
            continue
        b = row[1].strip()
        speaker = str(row[0] or "").strip()
        # dòng tiêu đề của sheet (myWord ghi "SPEAKER | LINE (gaps in [brackets]) | GAP 1 distractors…")
        if not b or speaker.upper() == "SPEAKER" or b.upper().startswith(("LINE", "CÂU", "SENTENCE")):
            continue
        text, gaps = parse_bracket_line(b)
        for k, g in enumerate(gaps):
            cell = row[2 + k] if len(row) > 2 + k else None
            if cell and isinstance(cell, str):
                ch = [x.strip() for x in cell.replace(";", ",").split(",") if x.strip()]
                if ch:
                    g["choices"] = ch
        narrator = bool(re.match(r"^(question|part)\s*\d+", text, re.I))
        words = [t for w in re.findall(r"[A-Za-z0-9’'.:]+", text) for t in asr_tokens(w)]
        lines.append({"speaker": speaker or ("Narrator" if narrator else ""), "text": text, "words": words,
                      "narrator": narrator, "gaps": gaps})
    return lines

# ---------------------------------------------------------------- audio → ASR
def need_ffmpeg():
    if not FFMPEG:
        raise SystemExit("Không thấy ffmpeg.exe (đã dò MODEL\\ffmpeg, AutoSubs, myLesson-data\\bin, PATH)")
    return FFMPEG

def cache_path(audio_path):
    """Cache mốc giây từng chữ cạnh audio: AUDIO\\LSB1-S1.T1.P1.mp3 → AUDIO\\LSB1-S1.T1.P1.pk.json."""
    base, _ = os.path.splitext(audio_path)
    return base + ".pk.json"

def run_parakeet(audio_path, tmpdir):
    # tmpdir có thể ở dạng 8.3 (C:\Users\ANDREW~1\...) → thư viện đọc âm của Parakeet không mở được; trải về đường dẫn đầy đủ
    tmpdir = os.path.realpath(tmpdir)
    wav = os.path.join(tmpdir, "ftg.wav")
    log(f">> ffmpeg → wav 16 kHz: {audio_path}")
    subprocess.run([need_ffmpeg(), "-v", "error", "-y", "-i", audio_path, "-ac", "1", "-ar", "16000", wav], check=True)
    if not os.path.exists(PK_PY) or not os.path.exists(PK_SCRIPT):
        raise SystemExit(f"Không thấy Parakeet ({PK_PY} / {PK_SCRIPT}) — máy này chưa dựng kho MODEL")
    log(">> Parakeet (GPU)…")
    t0 = time.time()
    base = os.path.join(tmpdir, "ftg_pk")
    env = dict(os.environ, HF_HOME=os.path.join(MODEL_DIR, "_cache"), PYTHONIOENCODING="utf-8")
    r = subprocess.run([PK_PY, PK_SCRIPT, wav, "--out", base, "--model", "v2"], capture_output=True, text=True,
                       encoding="utf-8", errors="replace", env=env)
    pk = base + ".json"
    if r.returncode != 0 or not os.path.exists(pk):
        sys.stderr.write(r.stdout[-3000:] + "\n" + r.stderr[-3000:] + "\n")   # giữ trọn đuôi lỗi, không cắt gọn
        raise SystemExit("Parakeet lỗi (mã thoát %d)" % r.returncode)
    log(f"   xong sau {time.time() - t0:.1f}s")
    return json.load(io.open(pk, encoding="utf-8"))

def load_or_run_parakeet(audio_path, tmpdir, use_cache=True, cache_for=None):
    """Có cache cạnh audio thì dùng; không thì nghe rồi ghi cache (ghi qua file tạm + os.replace).
    cache_for = file gốc để đặt cache cạnh (mp3 trong AUDIO, hoặc .mp4 khi tiếng phải rút từ video)."""
    cp = cache_path(cache_for or audio_path)
    if use_cache and os.path.exists(cp):
        try:
            asr = json.load(io.open(cp, encoding="utf-8"))
            if isinstance(asr, list) and asr:
                log(f">> mốc giây lấy từ cache: {cp}")
                return asr, True
        except Exception as e:   # cache hỏng thì nghe lại, không chết
            log(f"   ⚠ cache hỏng ({e}) — nghe lại")
    asr = run_parakeet(audio_path, tmpdir)
    try:
        tmp = cp + ".tmp"
        io.open(tmp, "w", encoding="utf-8").write(json.dumps(asr, ensure_ascii=False))
        os.replace(tmp, cp)
        log(f"   đã ghi cache: {cp}")
    except Exception as e:
        log(f"   ⚠ không ghi được cache ({e}) — bỏ qua")
    return asr, False

def extract_audio(mp4, tmpdir):
    mp3 = os.path.join(os.path.realpath(tmpdir), "ftg.mp3")
    log(f">> rút tiếng từ mp4: {mp4}")
    subprocess.run([need_ffmpeg(), "-v", "error", "-y", "-i", mp4, "-vn", "-ac", "1", "-ar", "44100", "-b:a", "64k", mp3], check=True)
    return mp3

# ---------------------------------------------------------------- khớp
def align(lines, asr, whole=False):
    """whole=True: mỗi dòng dò trên TOÀN BỘ phần băng còn lại (sheet FILLGAP chỉ chọn vài câu rải rác);
    False: cửa sổ tuần tự hẹp — hợp với kịch bản đầy đủ, tránh 'Yes.' khớp nhầm câu 'Yes.' khác."""
    asr = [a for a in asr if a.get("start") is not None]
    flat = []   # (norm token, asr index)
    for i, a in enumerate(asr):
        for t in asr_tokens(str(a.get("word", ""))):
            flat.append((t, i))
    words = [t for t, _ in flat]
    pos = 0
    for L in lines:
        n = len(L["words"])
        if n == 0:
            L.update(start=None, end=None, ratio=0.0, heard="")
            continue
        best = None
        win_end = len(words) if whole else min(len(words), pos + n * 6 + 80)
        for s in range(pos, max(pos + 1, win_end - 1)):
            for extra in (0, 1, 2, -1, 3):
                e = s + n + extra
                if e <= s or e > len(words):
                    continue
                r = SequenceMatcher(None, L["words"], words[s:e]).ratio()
                if best is None or r > best[0]:
                    best = (r, s, e)
        if best is None:
            L.update(start=None, end=None, ratio=0.0, heard="")
            continue
        r, s, e = best
        L["ratio"] = round(r, 2)
        L["start"] = round(float(asr[flat[s][1]]["start"]), 2)
        L["end"] = round(float(asr[flat[e - 1][1]]["end"]), 2)
        L["heard"] = " ".join(str(asr[k]["word"]) for k in range(flat[s][1], flat[e - 1][1] + 1))
        if r >= 0.6:
            pos = e
    return lines

# ---------------------------------------------------------------- từ vựng
def read_vocab(xlsm):
    try:
        import openpyxl
    except ImportError:
        log("   (không có openpyxl — bỏ qua gợi ý chỗ trống)")
        return []
    wb = openpyxl.load_workbook(xlsm, read_only=True, data_only=True)
    vocab = []
    for name in ("WORDTABLE", "WORDS"):
        if name not in wb.sheetnames:
            continue
        ws = wb[name]
        for row in ws.iter_rows(values_only=True):
            v = row[0] if row else None
            if not v or not isinstance(v, str):
                continue
            w = re.sub(r"\s*\(.*?\)\s*$", "", v).strip().lower()
            if w and " " not in w and re.fullmatch(r"[a-z'’-]+", w):
                vocab.append(w)
        if vocab:
            break
    return sorted(set(vocab))

def stem(w):
    for suf in ("ies", "es", "s", "ed", "ing", "d"):
        if w.endswith(suf) and len(w) - len(suf) >= 3:
            return w[: -len(suf)]
    return w

def suggest_gaps(text, vocab):
    if not vocab:
        return []
    vs = {v: stem(v) for v in vocab}
    toks = text.split()
    gaps = []
    for i, t in enumerate(toks):
        core = re.sub(r"^[^\w’']+|[^\w’']+$", "", t)
        k = norm_word(core)
        if not k or len(k) < 3:
            continue
        if k in vs or stem(k) in vs.values():
            gaps.append({"word": i})
    return gaps[:3]

# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser(description="Chuẩn bị act Find the gap từ một bài nghe")
    ap.add_argument("code", nargs="?", help="mã bài, vd LSA2-S1.T1.P1-2-3")
    ap.add_argument("--txt"); ap.add_argument("--audio"); ap.add_argument("--xlsm"); ap.add_argument("--code", dest="code_opt")
    ap.add_argument("--out"); ap.add_argument("--pk", help="file _pk.json Parakeet đã có")
    ap.add_argument("--no-gaps", action="store_true"); ap.add_argument("--keep-narrator", action="store_true")
    ap.add_argument("--no-cache", action="store_true", help="nghe lại băng dù đã có <audio>.pk.json")
    a = ap.parse_args()
    code = a.code or a.code_opt
    if not code:
        ap.error("cần mã bài (hoặc --code)")

    mats = {"txt": a.txt, "audio": a.audio, "xlsm": a.xlsm, "mp4": None}
    if not (mats["txt"] and mats["audio"]):
        log(f">> tìm nguyên liệu {code} trong {LISTEN_ROOT}…")
        f = find_materials(code)
        for k in mats:
            mats[k] = mats[k] or f.get(k)
    if not mats["txt"] and not mats["xlsm"]:
        raise SystemExit("Không thấy file .txt kịch bản (hoặc .xlsm có sheet FILLGAP)")
    log(f"   txt  : {mats['txt']}\n   audio: {mats['audio'] or '(rút từ mp4: %s)' % mats['mp4']}\n   xlsm : {mats['xlsm'] or '(không có)'}")

    fill = read_fillgap(mats["xlsm"]) if mats["xlsm"] else None
    if fill:
        lines = fill
        log(f">> sheet FILLGAP: {len(lines)} dòng (chỗ trống + nhiễu lấy từ sheet, bỏ gợi ý máy)")
    else:
        lines = read_transcript(mats["txt"])
        log(f">> {len(lines)} dòng kịch bản")

    from_cache = False
    with tempfile.TemporaryDirectory(prefix="ftg_") as tmp:
        if a.pk:
            asr = json.load(io.open(a.pk, encoding="utf-8"))
        else:
            src = mats["audio"] or mats["mp4"]
            if not src:
                raise SystemExit("Không có file nghe (.mp3/.mp4)")
            cp = cache_path(src)
            if not a.no_cache and os.path.exists(cp):
                audio = src                      # có cache thì khỏi rút tiếng/ffmpeg
            else:
                audio = mats["audio"] or extract_audio(mats["mp4"], tmp)
            asr, from_cache = load_or_run_parakeet(audio, tmp, use_cache=not a.no_cache, cache_for=src)
        log(f"   ASR: {len(asr)} chữ")
        align(lines, asr, whole=bool(fill))

    vocab = read_vocab(mats["xlsm"]) if (mats["xlsm"] and not a.no_gaps and not fill) else []
    if not fill:
        log(f">> từ vựng gợi ý: {len(vocab)} từ")

    items, weak = [], 0
    for L in lines:
        if L["start"] is None:
            weak += 1
            log(f"   ⚠ không khớp: {L['text'][:60]}")
            if not fill:
                continue
            # FILLGAP: KHÔNG được bỏ câu hỏi nào ("dùng hết mọi câu thoại") — giữ với mốc 0 + cờ weak để thầy đặt tay trong editor
            L.update(start=0.0, end=0.0, ratio=0.0, heard="")
        gaps = L["gaps"] if "gaps" in L else ([] if (a.no_gaps or L["narrator"]) else suggest_gaps(L["text"], vocab))
        # Sheet FILLGAP (myWord): MỌI dòng đều là câu hỏi của game, kể cả Narrator (thầy chốt 18/9 — "câu hỏi
        # đề bài tính như câu thoại thường"); chỉ đường .txt cũ mới tắt dòng "Question N:" theo --keep-narrator.
        it = {"speaker": L["speaker"], "text": L["text"], "gaps": gaps,
              "start": max(0.0, round(L["start"] - 0.15, 2)), "end": round(L["end"] + 0.25, 2),
              "enabled": True if fill else (not (L["narrator"] and not a.keep_narrator))}
        if L["ratio"] < 0.6:
            weak += 1
            it["weak"] = True
            it["heard"] = L["heard"]
            log(f"   ⚠ khớp yếu {L['ratio']:.2f}: {L['text'][:50]}  ←  máy nghe: {L['heard'][:50]}")
        items.append(it)

    path = lesson_folder_path(code)
    act = {
        "schemaVersion": 1, "type": "find_the_gap", "optVer": 4,
        "title": f"{code} / FIND THE GAP",
        "instruction": "Listen and fill in the missing words.",
        "theme": "classic",
        "options": {"timer": "countUp", "shuffleQuestions": True, "showAnswers": True, "allowSkip": False,
                    "speakerNames": True, "mode": "quiz", "scoring": "sentence", "choices": 6, "lives": 0, "pointsOff": 0},
        "content": {"audio": code, "items": items},
    }
    bundle = {"folder": path["leaf"], "folderPath": path["segments"], "folderPathKnown": path["known"], "activities": [act]}
    out = a.out or os.path.join(os.path.dirname(mats["txt"] or mats["xlsm"]), f"{code}.ftg.json")
    tmp_out = out + ".tmp"
    io.open(tmp_out, "w", encoding="utf-8").write(json.dumps(bundle, ensure_ascii=False, indent=1))
    os.replace(tmp_out, out)
    ngaps = sum(len(i["gaps"]) for i in items)
    log(f"\nXONG: {len(items)} dòng · {ngaps} chỗ trống · {weak} dòng cần thầy xem\n   → {out}\n"
        f"   Import vào AWord (nút Import ▸ chọn file .json) rồi mở editor để duyệt chỗ trống.")
    # dòng máy đọc (myWord "Tạo gói AWord") — luôn là dòng CUỐI của stdout
    log("@@KQ " + json.dumps({"out": out, "items": len(items), "gaps": ngaps, "weak": weak, "cache": from_cache}, ensure_ascii=False))

if __name__ == "__main__":
    main()
