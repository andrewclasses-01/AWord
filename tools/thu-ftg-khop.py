# -*- coding: utf-8 -*-
r"""thu-ftg-khop.py — kiểm bộ máy khớp mốc giây Đợt 369 của ftg-prepare.py. KHÔNG cần ffmpeg, KHÔNG cần
Parakeet, KHÔNG đụng ổ D: dựng sẵn chuỗi chữ băng giả rồi soi kết quả.

Bốn việc phải đúng (đều là lỗi THẬT gặp ngày 22/9/2026 trên LSA2-S3.T3.P1-2):
  1. Dòng nào KHÔNG có trong băng thì bị báo thẳng (`suyra`), KHÔNG được chộp cửa sổ của dòng khác.
     — bản cũ gán câu "She's been ill." vào chỗ băng phát "Oh. Isn't that".
  2. Không dòng nào chồng lấn dòng trước (bản cũ 11/50 câu chồng nhau vì đệm cứng ±0,15/0,25 s).
  3. Mốc giây bám khe nghỉ thật, và dòng suy ra nằm ĐÚNG vào khoảng trống giữa hai hàng xóm.
  4. do_sot() chỉ tính vùng CÓ TIẾNG mà không có chữ, và gọt hai đầu cho khỏi ôm đuôi im lặng.

Chạy: python tools/thu-ftg-khop.py
"""
import importlib.util, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("ftg", os.path.join(HERE, "ftg-prepare.py"))
ftg = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ftg)

loi = 0
def kiem(dk, msg):
    global loi
    if not dk:
        loi += 1
        print("  FAIL:", msg)

def dong(text):
    return {"text": text, "words": [t for w in re.findall(r"[A-Za-z0-9’'.:]+", text) for t in ftg.asr_tokens(w)]}

def bang(chuoi, tu=0.0, moi_chu=0.4, nghi=0.0):
    """Dựng [{word,start,end}] đều đặn từ một câu chữ."""
    ra, t = [], tu
    for w in chuoi.split():
        ra.append({"word": w, "start": round(t, 2), "end": round(t + moi_chu, 2)})
        t += moi_chu + nghi
    return ra

# ── 1) dòng KHÔNG có trong băng: phải suyra, và KHÔNG được chộp chỗ của dòng khác ──────────────
asr = bang("She is so thin", 10.0) + bang("Oh is not that Robert", 20.0)
lines = [dong("She is so thin"),
         dong("She has been ill"),                 # băng KHÔNG có câu này
         dong("That man in the big hat is her husband James"),   # cũng không có
         dong("Oh is not that Robert")]
ftg.khop_toan_cuc(lines, asr)
kiem(lines[0]["start"] is not None and lines[3]["start"] is not None, "hai dòng CÓ trong băng phải neo được")
kiem(lines[1]["start"] is None and lines[2]["start"] is None, "hai dòng KHÔNG có trong băng phải trả start=None (bản cũ chộp đại cửa sổ)")
kiem(abs(lines[3]["start"] - 20.0) < 0.01, "dòng cuối phải neo đúng vào 20,0 s chứ không bị dòng thiếu kéo lệch")

khe = [(11.6, 20.0)]        # khoảng nghỉ thật giữa hai câu
ra = ftg.suy_ra_va_cat(lines, khe, 24.0)
kiem(len(ra) == 4, "trả đủ 4 mốc")
kiem(ra[1]["suyra"] and ra[2]["suyra"], "hai dòng thiếu phải mang cờ suyra")
kiem(not ra[0]["suyra"] and not ra[3]["suyra"], "hai dòng có thật KHÔNG được mang cờ suyra")
kiem(ra[1]["weak"] and ra[2]["weak"], "dòng suy ra phải tính là câu cần thầy xem")
kiem(ra[1]["start"] >= 11.5 and ra[2]["end"] <= 20.1,
     f"hai dòng suy ra phải nằm gọn trong khoảng trống 11,6–20,0 s (được {ra[1]['start']}–{ra[2]['end']})")
kiem(ra[1]["end"] <= ra[2]["start"] + 0.01, "hai dòng suy ra chia nhau khoảng trống, không đè nhau")
kiem(len(lines[2]["words"]) > len(lines[1]["words"]) and (ra[2]["end"] - ra[2]["start"]) > (ra[1]["end"] - ra[1]["start"]),
     "câu dài hơn phải được chia phần băng dài hơn")

# ── 2) không dòng nào chồng lấn dòng trước ────────────────────────────────────────────────────
chong = [k for k in range(1, len(ra)) if ra[k]["start"] < ra[k - 1]["end"] - 0.01]
kiem(not chong, f"không được có dòng chồng lấn (dính ở {chong})")
kiem(all(x["end"] > x["start"] for x in ra), "mọi mốc phải có end > start")

# ── 3) bám khe nghỉ: đuôi câu được nới tới giữa khe, không cụt ─────────────────────────────────
a2 = bang("one two three", 5.0, 0.4)                 # chữ cuối kết thúc 5.8
l2 = [dong("one two three")]
ftg.khop_toan_cuc(l2, a2)
r2 = ftg.suy_ra_va_cat(l2, [(5.9, 6.5)], 12.0)
kiem(r2[0]["end"] > 5.95, f"đuôi câu phải nới vào khe nghỉ 5,9–6,5 s chứ không dừng ở 5,8 (được {r2[0]['end']})")
kiem(r2[0]["end"] < 6.5, "nhưng không được ăn hết khe sang câu sau")
kiem(r2[0]["start"] <= 5.0, "đầu câu không được cắt vào chữ đầu tiên")

# ── 4) do_sot: chỉ vùng CÓ TIẾNG mới tính, và phải gọt đuôi im lặng ───────────────────────────
asr3 = bang("hello there", 0.0) + bang("goodbye now", 30.0)
#   1–5 s im lặng hẳn (không phải sót) · 10–14 s có tiếng mà không có chữ (SÓT) · 31–40 s đuôi im lặng
khe3 = [(1.0, 10.0), (14.0, 30.0), (31.0, 40.0)]
sot = ftg.do_sot(asr3, khe3, 40.0)
kiem(len(sot) == 1, f"chỉ có ĐÚNG một vùng sót thật (được {sot})")
if sot:
    s, e, t = sot[0]
    kiem(abs(s - 10.0) < 0.2 and abs(e - 14.0) < 0.2, f"vùng sót phải gọt về đúng 10–14 s (được {s}–{e})")
    kiem(t >= 3.9, f"số giây có tiếng phải ≈4 s (được {t})")
kiem(ftg.do_sot(bang("a b c", 0.0), [(1.2, 40.0)], 40.0) == [], "băng chỉ còn im lặng sau chữ cuối thì KHÔNG phải vùng sót")
kiem(abs(ftg.giay_co_tieng(0.0, 10.0, [(2.0, 4.0), (6.0, 7.0)]) - 7.0) < 0.01, "giay_co_tieng trừ đúng phần im lặng")

# ── 5) băng rỗng / dòng rỗng: không được nổ ───────────────────────────────────────────────────
l4 = [dong("hello"), {"text": "", "words": []}]
ftg.khop_toan_cuc(l4, [])
r4 = ftg.suy_ra_va_cat(l4, [], 0.0)
kiem(len(r4) == 2 and all(x["weak"] for x in r4), "băng rỗng: trả đủ dòng, tất cả đều là câu cần thầy xem")

print("thu-ftg-khop: " + ("OK" if not loi else f"{loi} LOI"))
sys.exit(1 if loi else 0)
