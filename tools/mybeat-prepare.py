r"""
mybeat-prepare.py — My Beat Prep: turn a song file into a .beat.json for AWord My Beat.
Dot 385 (25/9/2026). Runs 100% OFFLINE (thay chot): no step opens the internet.

    py tools\mybeat-prepare.py --audio song.mp3 --link "https://youtu.be/XXXXXXXXXXX"
        [--desc description.txt] [--lyrics lyrics.txt] [--title "Song title"]
        [--own] [--no-check] [--out folder]

  --audio   the song file already on this computer (mp3/wav/m4a/mp4...)   REQUIRED
  --link    the YouTube link the game will play (only WRITTEN into the file,
            never opened)
  --desc    the video description saved as a .txt -> licence + credit lines
  --lyrics  the real lyrics (.txt, one sung line per line, blank line between
            parts, optional [Chorus]/[Verse 2] tags) -> the machine keeps YOUR
            words and only borrows its timing
  --own     the song is an Andrew Classes original (no credit needed)
  --no-check  skip the 2nd listening pass (faster; no "words to check")

What it does (measured 25/9/2026 on "Lie 2 You", 4:03, RTX 5060 Ti):
  1. ffmpeg -> 16 kHz mono wav                                   (~1 s)
  2. Parakeet listens to the ORIGINAL mix: words + start times   (~20 s)
  3. Demucs separates the voice, Parakeet listens again; words the two passes
     heard differently are marked "check" (the voice-only pass alone LOST a
     whole line, so it is only used for checking)                (~30 s)
  4. with --lyrics: align your words to the heard words (timing only)
  5. lines = pauses > 0.6 s (held-note scraps of <= 2 words join the line
     before); parts = pauses > 4 s or blank lines in the lyrics; a part whose
     lines repeat elsewhere is guessed "Chorus"
  6. write <name>.beat.json next to the audio (or --out)

Models already on disk: E:\LAP TRINH APP\MODEL\_cache (Parakeet) and
_cache\torch (Demucs htdemucs). Offline flags are forced below.
"""
import argparse, difflib, json, os, re, shutil, subprocess, sys, tempfile, time

MODEL_DIR = r"E:\LAP TRINH APP\MODEL"
VENV_PY = os.path.join(MODEL_DIR, "_parakeet_venv", "Scripts", "python.exe")
PARAKEET = os.path.join(MODEL_DIR, "parakeet_words.py")
FFMPEG = os.path.join(MODEL_DIR, "ffmpeg", "ffmpeg.exe")

LINE_PAUSE = 0.6      # a new line when the voice rests longer than this
PART_PAUSE = 4.0      # a new part (verse/chorus) after a rest this long
SCRAP_WORDS = 2       # a "line" this short right after another is a held note
SCRAP_GAP = 2.5

# ---- never touch the network: every model must come from the local cache
OFFLINE_ENV = dict(os.environ)
OFFLINE_ENV.update({
    "HF_HOME": os.path.join(MODEL_DIR, "_cache"),
    "HF_HUB_OFFLINE": "1", "TRANSFORMERS_OFFLINE": "1", "HF_DATASETS_OFFLINE": "1",
    "TORCH_HOME": os.path.join(MODEL_DIR, "_cache", "torch"),
    "PYTHONIOENCODING": "utf-8",
})
OFFLINE_ENV["PATH"] = os.path.join(MODEL_DIR, "ffmpeg") + os.pathsep + OFFLINE_ENV.get("PATH", "")


def say(msg):
    print(msg, flush=True)


def norm(w):
    return re.sub(r"[^a-z0-9]", "", w.lower())


def run(cmd, what):
    t0 = time.time()
    p = subprocess.run(cmd, env=OFFLINE_ENV, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if p.returncode != 0:
        tail = (p.stderr or p.stdout or "").strip().splitlines()[-12:]
        raise SystemExit(f"\n[LOI] {what} failed (exit {p.returncode}).\n" + "\n".join(tail))
    return time.time() - t0


def to_wav16(src, dst):
    run([FFMPEG, "-y", "-loglevel", "error", "-i", src, "-ac", "1", "-ar", "16000", dst], "ffmpeg")


def listen(wav, base):
    secs = run([VENV_PY, PARAKEET, wav, "--out", base], "Parakeet")
    with open(base + ".json", encoding="utf-8") as f:
        words = json.load(f)
    words = [w for w in words if str(w.get("word", "")).strip()]
    return words, secs


def duration_of(wav):
    import wave
    with wave.open(wav, "rb") as w:
        return w.getnframes() / float(w.getframerate())


# ------------------------------------------------------------------ check pass
def mark_checks(main, other):
    """main words that the other pass did not hear the same (+-1 s) -> check=True"""
    used = set()
    for w in main:
        best = None
        for j, v in enumerate(other):
            if j in used or norm(v["word"]) != norm(w["word"]):
                continue
            d = abs(v["start"] - w["start"])
            if d < 1.0 and (best is None or d < best[0]):
                best = (d, j)
        if best:
            used.add(best[1])
            w["check"] = False
        else:
            w["check"] = True
    return sum(1 for w in main if w["check"])


# ------------------------------------------------------------------ lines & parts
def lines_from_pauses(words):
    lines, cur = [], []
    for w in words:
        if cur and w["start"] - cur[-1]["end"] > LINE_PAUSE:
            lines.append(cur); cur = []
        cur.append(w)
    if cur:
        lines.append(cur)
    merged = []
    for l in lines:
        if merged and len(l) <= SCRAP_WORDS and l[0]["start"] - merged[-1][-1]["end"] < SCRAP_GAP:
            merged[-1] += l
        else:
            merged.append(l)
    return merged


def parts_from_pauses(lines):
    starts = [0]
    for i in range(1, len(lines)):
        if lines[i][0]["start"] - lines[i - 1][-1]["end"] > PART_PAUSE:
            starts.append(i)
    return [(s, None) for s in starts]


def name_parts(lines_text, parts):
    """parts = [(from, tag or None)] -> [{name, from, guess}]"""
    keys = [" ".join(norm(w) for w in t.split()) for t in lines_text]
    count = {}
    for k in keys:
        count[k] = count.get(k, 0) + 1
    out, verse = [], 0
    for i, (frm, tag) in enumerate(parts):
        to = parts[i + 1][0] if i + 1 < len(parts) else len(lines_text)
        if tag:
            out.append({"name": tag, "from": frm, "guess": False})
            continue
        block = keys[frm:to]
        rep = sum(1 for k in block if count.get(k, 0) > 1) / max(1, len(block))
        if rep >= 0.6:
            out.append({"name": "Chorus", "from": frm, "guess": True})
        else:
            verse += 1
            out.append({"name": f"Verse {verse}", "from": frm, "guess": True})
    return out


# ------------------------------------------------------------------ lyrics alignment
def read_lyrics(path):
    """-> list of (text, part_tag_or_None, starts_part)"""
    raw = open(path, encoding="utf-8-sig").read().splitlines()
    out, tag, new_part = [], None, True
    for line in raw:
        s = line.strip()
        if not s:
            new_part = True; continue
        m = re.match(r"^\[(.+?)\]$", s)
        if m:
            tag, new_part = m.group(1).strip().title(), True; continue
        out.append((re.sub(r"\s+", " ", s), tag if new_part else None, new_part))
        tag, new_part = None, False
    return out


def align_lyrics(lyr, heard):
    """Give every lyric word a time from the heard words. Unmatched words get a
    time between their neighbours and are marked check."""
    toks = []
    for li, (text, _, _) in enumerate(lyr):
        for k, w in enumerate(text.split(" ")):
            toks.append({"li": li, "k": k, "w": w})
    a = [norm(t["w"]) for t in toks]
    b = [norm(h["word"]) for h in heard]
    sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    for blk in sm.get_matching_blocks():
        for n in range(blk.size):
            t, h = toks[blk.a + n], heard[blk.b + n]
            t["start"], t["end"], t["check"] = h["start"], h["end"], bool(h.get("check"))
    # fill holes by interpolation
    known = [i for i, t in enumerate(toks) if "start" in t]
    if not known:
        raise SystemExit("[LOI] The lyrics do not match what was heard at all — is it the right song?")
    for i, t in enumerate(toks):
        if "start" in t:
            continue
        prev = max([k for k in known if k < i], default=None)
        nxt = min([k for k in known if k > i], default=None)
        if prev is None:
            t0 = toks[nxt]["start"] - 0.3 * (nxt - i)
        elif nxt is None:
            t0 = toks[prev]["end"] + 0.3 * (i - prev)
        else:
            span = toks[nxt]["start"] - toks[prev]["end"]
            t0 = toks[prev]["end"] + span * (i - prev) / (nxt - prev)
        t["start"], t["end"], t["check"] = max(0.0, t0), max(0.0, t0) + 0.25, True
    matched = sum(1 for t in toks if not t["check"])
    return toks, matched


# ------------------------------------------------------------------ description -> licence + credit
LIC_RE = re.compile(r"\bCC\s*BY(?:-(?:SA|NC|ND))*(?:\s*\d\.\d)?", re.I)


def read_desc(path):
    txt = open(path, encoding="utf-8-sig").read()
    lic = ""
    m = LIC_RE.search(txt)
    if m:
        lic = re.sub(r"\s+", " ", m.group(0).upper().replace("CC BY", "CC BY")).strip()
    elif re.search(r"creative commons", txt, re.I):
        lic = "Creative Commons (see credit)"
    elif re.search(r"free to use|no copyright|royalty.free", txt, re.I):
        lic = "Free with credit (channel terms)"
    # the credit block: lines between two rows of dashes that mention "by" or a licence
    # the credit block: a short block between rows of dashes that names the
    # licence ("CC BY-SA 3.0"); a block that only says "Creative Commons" is the
    # fallback (channel adverts often say that in their first line).
    credit = ""
    blocks = [[l.strip() for l in b.strip().splitlines() if l.strip()]
              for b in re.split(r"\n\s*[-–—_]{3,}\s*\n", "\n" + txt + "\n")]
    blocks = [b for b in blocks if 1 <= len(b) <= 8]
    for test in (lambda l: LIC_RE.search(l), lambda l: re.search(r"creative commons", l, re.I)):
        hit = next((b for b in blocks if any(test(l) for l in b)), None)
        if hit:
            credit = " · ".join(hit)
            break
    if not credit:
        m = re.search(r"^(.+\bby\b.+)$", txt, re.M | re.I)
        if m:
            credit = m.group(1).strip()
    return lic, credit[:500]


# ------------------------------------------------------------------ main
def main():
    ap = argparse.ArgumentParser(description="My Beat Prep — song file -> .beat.json (offline)")
    ap.add_argument("--audio", required=True)
    ap.add_argument("--link", default="")
    ap.add_argument("--desc", default="")
    ap.add_argument("--lyrics", default="")
    ap.add_argument("--title", default="")
    ap.add_argument("--artist", default="")
    ap.add_argument("--own", action="store_true")
    ap.add_argument("--no-check", dest="no_check", action="store_true")
    ap.add_argument("--out", default="")
    a = ap.parse_args()

    for p, label in [(VENV_PY, "Parakeet python"), (PARAKEET, "parakeet_words.py"), (FFMPEG, "ffmpeg")]:
        if not os.path.exists(p):
            raise SystemExit(f"[LOI] Missing {label}: {p}")
    if not os.path.exists(a.audio):
        raise SystemExit(f"[LOI] Audio file not found: {a.audio}")
    t_all = time.time()
    name = os.path.splitext(os.path.basename(a.audio))[0]
    out_dir = a.out or os.path.dirname(os.path.abspath(a.audio))
    tmp = tempfile.mkdtemp(prefix="mybeat_")
    try:
        say(f"My Beat Prep - {name}  (offline)")
        wav = os.path.join(tmp, "mix16.wav")
        to_wav16(a.audio, wav)
        dur = duration_of(wav)
        say(f"  1/5 audio ready ({dur:.0f} s)")

        heard, secs = listen(wav, os.path.join(tmp, "mix"))
        say(f"  2/5 heard {len(heard)} words ({secs:.0f} s)")

        n_check = 0
        if not a.no_check:
            t0 = time.time()
            run([VENV_PY, "-m", "demucs", "--two-stems=vocals", "-n", "htdemucs", "-o", os.path.join(tmp, "sep"), wav], "Demucs")
            voc = None
            for root, _, files in os.walk(os.path.join(tmp, "sep")):
                if "vocals.wav" in files:
                    voc = os.path.join(root, "vocals.wav")
            if not voc:
                raise SystemExit("[LOI] Demucs finished but no vocals.wav was found.")
            voc16 = os.path.join(tmp, "voc16.wav")
            to_wav16(voc, voc16)
            heard2, _ = listen(voc16, os.path.join(tmp, "voc"))
            n_check = mark_checks(heard, heard2)
            say(f"  3/5 second listen: {n_check} words to check ({time.time() - t0:.0f} s)")
        else:
            for w in heard:
                w["check"] = False
            say("  3/5 second listen skipped (--no-check)")

        if a.lyrics:
            lyr = read_lyrics(a.lyrics)
            toks, matched = align_lyrics(lyr, heard)
            lines = []
            for li, (text, _, _) in enumerate(lyr):
                ws = [t for t in toks if t["li"] == li]
                lines.append(ws)
            parts, i = [], 0
            for li, (_, tag, starts) in enumerate(lyr):
                if starts or li == 0:
                    parts.append((li, tag))
            texts = [t for t, _, _ in lyr]
            say(f"  4/5 lyrics: {len(lyr)} lines, {matched}/{len(toks)} words matched the singing")
            line_objs = []
            for li, ws in enumerate(lines):
                s = [round(w["start"], 2) for w in ws]
                e = round(max(w["end"] for w in ws), 2)
                c = [k for k, w in enumerate(ws) if w["check"]]
                line_objs.append({"x": texts[li], "s": s, "e": e, "c": c, "n": []})
        else:
            groups = lines_from_pauses(heard)
            parts = parts_from_pauses(groups)
            texts = [" ".join(w["word"] for w in g) for g in groups]
            line_objs = [{"x": texts[i], "s": [round(w["start"], 2) for w in g], "e": round(g[-1]["end"], 2),
                          "c": [k for k, w in enumerate(g) if w.get("check")], "n": []} for i, g in enumerate(groups)]
            say(f"  4/5 no lyrics file: {len(line_objs)} lines from the pauses (words as heard)")
        sections = name_parts(texts, parts)
        # keep the timing monotonic inside every line
        for l in line_objs:
            for k in range(1, len(l["s"])):
                if l["s"][k] < l["s"][k - 1]:
                    l["s"][k] = l["s"][k - 1]
            l["e"] = max(l["e"], l["s"][-1] + 0.2)

        lic, credit = ("", "")
        if a.desc and os.path.exists(a.desc):
            lic, credit = read_desc(a.desc)
        yt = ""
        m = re.search(r"(?:youtu\.be/|[?&]v=|/embed/|/shorts/)([\w-]{11})", a.link or "")
        if m:
            yt = m.group(1)
        pkg = {
            "format": "mybeat/1", "made": time.strftime("%Y-%m-%d %H:%M"),
            "title": a.title or name, "artist": a.artist,
            "youtube": yt, "link": a.link,
            "source": "own" if a.own else ("cc" if (lic or credit) else ""),
            "licence": lic, "credit": credit,
            "duration": round(dur, 2), "sections": sections, "lines": line_objs,
        }
        os.makedirs(out_dir, exist_ok=True)
        out = os.path.join(out_dir, re.sub(r"[^\w\- ]+", "", name).strip().replace(" ", "-").lower() + ".beat.json")
        tmp_out = out + ".tmp"
        with open(tmp_out, "w", encoding="utf-8") as f:
            json.dump(pkg, f, ensure_ascii=False, indent=1)
        os.replace(tmp_out, out)
        n_words = sum(len(l["x"].split()) for l in line_objs)
        say(f"  5/5 {len(line_objs)} lines | {len(sections)} parts | {n_words} words | {sum(len(l['c']) for l in line_objs)} to check")
        if not yt:
            say("  !  no YouTube link given - add it in AWord (step 1)")
        if not a.own and not credit:
            say("  !  no credit found - add --desc, or type the credit in AWord")
        say(f"DONE in {time.time() - t_all:.0f} s -> {out}")
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    main()
