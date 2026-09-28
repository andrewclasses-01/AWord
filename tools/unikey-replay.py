# Phát lại "UniKey 4.6 Telex" vào Chrome ngầm qua CDP — đúng khuôn đã đo thật 28/9:
#   phím biến đổi ⇒ keydown bị NUỐT, bơm "·"(231) + Backspace×(1+n) + chữ mới (231, code ""),
#   rồi keyup của phím thật (code KeyX) tới sau; "w" đứng một mình ⇒ bơm thẳng "ư" (không xoá).
import json, subprocess, sys, time, unicodedata, urllib.request, os
import websocket

PORT = 9339
BASE = os.environ.get("VNBASE", "http://localhost:5619") + "/tools/vn-guard-test.html?t="
HERE = os.environ.get("TEMP", os.path.dirname(os.path.abspath(__file__)))

CIRC = "\u0302"; BREVE = "\u0306"; HORN = "\u031B"
TONES = {"s": "\u0301", "f": "\u0300", "r": "\u0309", "x": "\u0303", "j": "\u0323"}
VOW = "aeiouyAEIOUY"

def nfd(c): return unicodedata.normalize("NFD", c)
def nfc(s): return unicodedata.normalize("NFC", s)
def base(c): return "d" if c == "đ" else "D" if c == "Đ" else nfd(c)[0]
def marks(c): return nfd(c)[1:]
def is_vowel(c): return base(c) in VOW
def mk(b, ms): return nfc(b + "".join(sorted(ms, key=lambda m: 0 if m in (CIRC, BREVE, HORN) else 1)))

def telex(word, k):
    """(new_word | None). None = không biến đổi (phím đi qua)."""
    lk = k.lower()
    w = list(word)
    if lk in "aeo":
        for i in range(len(w) - 1, -1, -1):
            if base(w[i]).lower() == lk:
                ms = marks(w[i])
                if CIRC in ms:   # undo
                    w[i] = mk(base(w[i]), [m for m in ms if m != CIRC]); return "".join(w) + k
                if BREVE in ms or HORN in ms: return None
                if i == len(w) - 1 or all(not is_vowel(c) for c in w[i+1:]) or True:
                    if i != len(w) - 1 and is_vowel(w[i+1]) and base(w[i+1]).lower() != lk: return None
                    w[i] = mk(base(w[i]), ms + CIRC); return "".join(w)
        return None
    if lk == "w":
        idx = [i for i, c in enumerate(w) if base(c).lower() in "aou"]
        if idx:
            i = idx[-1]
            if HORN in marks(w[i]) or BREVE in marks(w[i]):   # undo
                w[i] = mk(base(w[i]), [m for m in marks(w[i]) if m not in (HORN, BREVE)]); return "".join(w) + k
            if CIRC in marks(w[i]): return None
            if base(w[i]).lower() == "o" and i > 0 and base(w[i-1]).lower() == "u":
                w[i-1] = mk(base(w[i-1]), marks(w[i-1]) + HORN)
            w[i] = mk(base(w[i]), marks(w[i]) + (BREVE if base(w[i]).lower() == "a" else HORN)); return "".join(w)
        return "".join(w) + ("Ư" if k == "W" else "ư")
    if lk == "d":
        for i, c in enumerate(w):
            if c in "dD": w[i] = "đ" if c == "d" else "Đ"; return "".join(w)
            if c in "đĐ": w[i] = "d" if c == "đ" else "D"; return "".join(w) + k
        return None
    if lk in TONES or lk == "z":
        vi = [i for i, c in enumerate(w) if is_vowel(c)]
        if not vi: return None
        for i in vi:   # đã có dấu thanh
            t = [m for m in marks(w[i]) if m in TONES.values()]
            if t:
                if lk != "z" and t[0] == TONES[lk]:
                    w[i] = mk(base(w[i]), [m for m in marks(w[i]) if m != t[0]]); return "".join(w) + k
                w[i] = mk(base(w[i]), [m for m in marks(w[i]) if m != t[0]] + ([TONES[lk]] if lk != "z" else [])); return "".join(w)
        if lk == "z": return None
        pref = [i for i in vi if set(marks(w[i])) & {CIRC, BREVE, HORN}]
        if pref: i = pref[-1]
        elif len(vi) >= 2 and vi[-1] == len(w) - 1: i = vi[-2]
        else: i = vi[-1]
        w[i] = mk(base(w[i]), marks(w[i]) + TONES[lk]); return "".join(w)
    return None

class CDP:
    def __init__(self, ws_url):
        self.ws = websocket.create_connection(ws_url, timeout=20, suppress_origin=True); self.n = 0
    def call(self, method, **params):
        self.n += 1; mid = self.n
        self.ws.send(json.dumps({"id": mid, "method": method, "params": params}))
        while True:
            m = json.loads(self.ws.recv())
            if m.get("id") == mid: return m.get("result", m.get("error"))
    def burst(self, calls):
        """Gửi cả loạt lệnh LIỀN MỘT LƯỢT rồi mới đọc trả lời — như UniKey SendInput đổ cả gói
        vào hàng đợi Windows một lần (giờ phím tới do trình duyệt đóng, trang bận cũng không giãn)."""
        ids = []
        for method, params in calls:
            self.n += 1; ids.append(self.n)
            self.ws.send(json.dumps({"id": self.n, "method": method, "params": params}))
        left = set(ids)
        while left:
            m = json.loads(self.ws.recv())
            left.discard(m.get("id"))
    def ev(self, expr):
        r = self.call("Runtime.evaluate", expression=expr, returnByValue=True, awaitPromise=True)
        return r.get("result", {}).get("value")

PUNCT = {".": (190, "Period"), ",": (188, "Comma"), "'": (222, "Quote"), "!": (49, "Digit1"), "?": (191, "Slash"), "-": (189, "Minus")}
def vk_of(ch):
    if ch in PUNCT: return PUNCT[ch]
    if ch == " ": return 32, "Space"
    if ch.isalpha(): return ord(ch.upper()), "Key" + ch.upper()
    if ch.isdigit(): return ord(ch), "Digit" + ch
    return 0, ""

def phys_down(c, ch):
    vk, code = vk_of(ch)
    c.call("Input.dispatchKeyEvent", type="keyDown", key=ch, code=code, windowsVirtualKeyCode=vk, text=ch, unmodifiedText=ch, modifiers=8 if ch.isupper() else 0)
def phys_up(c, ch):
    vk, code = vk_of(ch)
    c.call("Input.dispatchKeyEvent", type="keyUp", key=ch, code=code, windowsVirtualKeyCode=vk, modifiers=8 if ch.isupper() else 0)
def bs(c):
    c.call("Input.dispatchKeyEvent", type="rawKeyDown", key="Backspace", code="Backspace", windowsVirtualKeyCode=8)
    c.call("Input.dispatchKeyEvent", type="keyUp", key="Backspace", code="Backspace", windowsVirtualKeyCode=8)
SHIFT_OK = os.environ.get("NOSHIFT") != "1"
def inj(c, ch, shift=False):
    c.call("Input.dispatchKeyEvent", type="keyDown", key=ch, code="", windowsVirtualKeyCode=231, text=ch, unmodifiedText=ch, modifiers=8 if (shift and SHIFT_OK) else 0)
    c.call("Input.dispatchKeyEvent", type="keyUp", key="Unidentified", code="", windowsVirtualKeyCode=231)

ROLL = os.environ.get("ROLL") == "1"
def type_seq(c, seq, gap=0.07, unikey=True):
    """ROLL=1: gõ dồn — phím bị nuốt chỉ được NHẢ sau khi phím kế tiếp đã xuống."""
    if ROLL: gap = 0.035
    gap = float(os.environ.get("GAP", gap))   # vd GAP=0.25 cho Crossword (game tự nuốt chữ khi gõ quá nhanh)
    word = ""
    held = None
    for k in seq:
        swallowed = False
        if k == "<":            # Backspace thật
            bs(c); word = word[:-1]
        else:
            new = telex(word, k) if (unikey and k.isalpha()) else None
            if new is None:
                phys_down(c, k); time.sleep(0.02); phys_up(c, k)
                word = "" if not k.isalpha() else word + k
            else:
                p = 0
                while p < len(word) and p < len(new) and word[p] == new[p]: p += 1
                sh = 8 if (k.isupper() and SHIFT_OK) else 0
                J = lambda ch: [("Input.dispatchKeyEvent", dict(type="keyDown", key=ch, code="", windowsVirtualKeyCode=231, text=ch, unmodifiedText=ch, modifiers=sh)),
                                ("Input.dispatchKeyEvent", dict(type="keyUp", key="Unidentified", code="", windowsVirtualKeyCode=231, modifiers=sh))]
                B = [("Input.dispatchKeyEvent", dict(type="rawKeyDown", key="Backspace", code="Backspace", windowsVirtualKeyCode=8)),
                     ("Input.dispatchKeyEvent", dict(type="keyUp", key="Backspace", code="Backspace", windowsVirtualKeyCode=8))]
                if p == len(word) and len(new) == len(word) + 1 and new[-1] in "ưƯ" and k.lower() == "w":
                    c.burst(J(new[-1]))
                else:
                    c.burst(J("·") + B * (1 + len(word) - p) + [x for ch in new[p:] for x in J(ch)])
                word = new
                swallowed = True
        if held is not None:
            phys_up(c, held); held = None
        if swallowed:
            if ROLL: held = k
            else: time.sleep(0.03); phys_up(c, k)
        time.sleep(gap)
    if held is not None: phys_up(c, held)

def expected(seq):
    out = ""
    for k in seq:
        out = out[:-1] if k == "<" else out + k
    return out

def main():
    t = sys.argv[1] if len(sys.argv) > 1 else "tta"
    cases = sys.argv[2:] or ["book was good dd feel too catt<"]
    prof = os.path.join(HERE, "prof-cdp")
    chrome = subprocess.Popen([r"C:\Program Files\Google\Chrome\Application\chrome.exe", f"--remote-debugging-port={PORT}",
        f"--user-data-dir={prof}", "--headless=new", "--remote-allow-origins=*", "--no-first-run", "--window-size=1200,850", "about:blank"])
    try:
        for _ in range(50):
            try: tabs = json.load(urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json")); break
            except Exception: time.sleep(0.2)
        page = [x for x in tabs if x["type"] == "page"][0]
        c = CDP(page["webSocketDebuggerUrl"])
        c.call("Runtime.enable")
        ok_all = True
        def run(seq, unikey):
            c.call("Page.navigate", url=BASE + t)
            for _ in range(60):
                time.sleep(0.25)
                if c.ev("!!window.__ready && !!(document.querySelector('.aw-tta-input,.aw-rw-input,.aw-cw-letter,.aw-ftg-inputtext'))"): break
            time.sleep(1.2)
            if t == "cw":
                for _ in range(20):
                    if c.ev("!!window.cwPicked"): break
                    time.sleep(0.2)
                time.sleep(0.8)
            if t in ("tta", "rw"):
                c.ev("(()=>{const i=document.querySelector('.aw-tta-input,.aw-rw-input'); i.focus(); return document.activeElement===i})()")
            else:
                c.ev("document.activeElement && document.activeElement.blur && document.activeElement.blur()")
            if os.environ.get("STALL") == "1":   # trang bận: cứ 70 ms lại kẹt 60 ms (như lúc vừa tải)
                c.ev("window.__st = setInterval(() => { const t = performance.now(); while (performance.now() - t < 60); }, 70)")
            type_seq(c, seq, unikey=unikey)
            c.ev("clearInterval(window.__st)")
            time.sleep(0.5)
            return c.ev(sys_snap(t))
        for case in cases:
            unikey = not case.startswith("!")
            seq = case.lstrip("!")
            got = run(seq, unikey)
            exp = expected(seq) if t in ("tta", "rw") else run(seq, False)
            if t == "rw": got, exp = (got or "").upper(), exp.upper()
            ok = got == exp
            if not ok: ok_all = False
            print(("PASS" if ok else "FAIL"), f"[{t} {'UniKey' if unikey else 'no-IME'}] typed={seq!r} expected={exp!r} got={got!r}")
        errs = c.ev("window.__errs || []")
        print("ALL PASS" if ok_all else "SOME FAIL")
    finally:
        chrome.kill()

def sys_snap(t):
    if t == "tta": return "document.querySelector('.aw-tta-input').value"
    if t == "rw": return "document.querySelector('.aw-rw-input').value"
    if t == "cw": return "[...document.querySelectorAll('.aw-cw-letter')].map(x=>x.textContent).join('')"
    return "document.querySelector('.aw-ftg-inputtext').textContent"

if __name__ == "__main__":
    main()
