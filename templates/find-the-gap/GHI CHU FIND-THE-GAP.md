# GHI CHÚ — FIND THE GAP (type `find_the_gap`, template thứ 19)

**Trạng thái: ✅ ĐÃ CHỐT — Đợt 340 (18/9/2026); Đợt 341–344 (18/9 tối/khuya): nguồn dữ liệu = Import `.xlsm` có sheet FILLGAP (myWord v2.6.1), ✅ thầy nghiệm thu trên trang thật (xem mục cuối): thầy bấm tay 4 vòng (test.html, 3 mode, Options) rồi "Đã test ok" → COMMIT + PUSH +
LIVE cùng ngày; bench cuối 63/63; đã ở `core/catalog.js` (mục thứ 19).** ⬜ Chưa bấm tay trên TRANG CHỦ THẬT (New activity ▸
Find the gap, Import gói `.ftg.json`, editor lưu Firestore), TOMKO, điện thoại, Showdown thật, myWord app thật. Game do thầy tự nghĩ (không có trong Wordwall):
nghe băng thật, điền chỗ trống. Thiết kế đã duyệt qua canvas https://claude.ai/artifact/Qe5PJEBRUfGSHU6azNFzkF
(bản 3: đáp án hiện ngay, trả lời được cả lúc đang nghe; Options đúng khuôn core).

## Cách chơi

Một act = MỘT bài nghe (`content.audio` = mã bài trong kho `myLesson-audio`, hoặc URL mp3). Mỗi lượt = MỘT CÂU
THOẠI (`content.items[]`): câu hiện ở dải trên với chỗ trống `₁ ₂ …` (chỗ đang điền tô xanh), băng **tự phát
đúng đoạn** `start→end`; nút 🔊 góc phải nghe lại **không giới hạn** (đang phát thì hiện sóng). Vùng dưới hiện
NGAY từ đầu, trả lời được cả khi băng chưa xong. Điền **lần lượt** ₁ → ₂ → ₃; xong hết chỗ trống = xong câu → tự
sang câu kế (0,9 s đúng / 1,5 s có sai). Đúng: chữ lấp vào chỗ trống (xanh) + ✓ bay. Sai: chỗ trống hiện đáp án
đúng (đỏ, tooltip ghi em đã trả lời gì) + ✗ bay + mất tim + "−N" bay về ô điểm rồi mới trừ (`ui.flyPenalty`).

**Ba mode (`options.mode`):**
- `quiz` — mỗi chỗ trống một bộ ≤ 6 ô (`options.choices` 3–6); nhiễu = đáp án của các chỗ trống KHÁC trong bài,
  ưu tiên từ giống nhất (`buildChoices` ở `ftg-shared.js`, `gap.choices` của editor thắng nếu có). Sau khi xong
  câu, bộ ô cuối giữ nguyên: ô đúng viền trắng, ô chọn sai đỏ, còn lại mờ.
- `type` — bàn phím core (`createKeyboard`) + một ô nhập cho mỗi chỗ trống; Submit / Enter chấm ô ĐANG điền
  (không phân biệt hoa thường, dấu); sai thì ô hiện đáp án đúng màu đỏ rồi nhảy ô kế. Nút ⌨ cạnh Menu
  (`hasKeyboardToggle`) ẩn/hiện bàn phím. Gõ bàn phím thật cũng được.
- `find` — TOÀN BỘ từ khoét của bài thành lưới ô (khuôn Find the match, 5 hàng, ≤ 35 ô/trang, `--gfit` co cả
  lưới cho vừa vùng dưới); ô đúng mờ đi để lại lỗ; > 35 chỗ trống thì chia trang theo CÂU (mỗi trang là một
  vòng khép kín, nav hiện `x of N · Page p / n`).

**Điểm (`options.scoring`):** `gap` = 1 điểm/chỗ trống (total = số chỗ trống) · `sentence` = 1 điểm/câu đúng
trọn (total = số câu). `review` LUÔN một hàng mỗi câu (yourText = các từ đã điền nối " · "), `perQuestion` theo
câu. Points off / Lives / Time cost / Time each round / Allow skip: dùng ô chung của core; riêng: Mode · Scoring
· Choices · Lives (slider) · ô tích "Speaker names".

## Dữ liệu

```
content: { audio: "LSA2-S1.T1.P1-2-3",
           items: [{ speaker, text, gaps: [{ word, answers?, choices? }], start, end, enabled }] }
```
`gap.word` = CHỈ SỐ TOKEN (tách theo khoảng trắng) — chỗ trống trỏ vào vị trí từ, text giữ nguyên dấu câu.
`answers` = cách viết khác được chấp nhận (từ gốc luôn được nhận). `enabled:false` = editor giữ nhưng game bỏ.
Cách đọc/khoét/chuẩn hoá nằm trọn ở `ftg-shared.js` (module lá, game và editor cùng import).

## Audio (`ftg-audio.js`) — thầy chốt 18/9 sau khi đo

`loadAudio(url)` tải TRỌN mp3 qua `tpl.prepare` (thanh % thay nút PLAY), giữ Cache Storage `aword-ftg-audio-v1`
1 ngày, trả `blob:` URL ⇒ mọi cú tua 1 ms trên mọi mạng (đo `scratch/ftg-seek-test.html`: wifi 0,67 s tải; 4G giả
lập 14 s; 3G yếu 52 s — còn phát thẳng URL trên 3G thì mỗi câu chờ 1–1,8 s). `createSegmentPlayer` = một
`<audio>`, dừng ở `end` bằng poll 25 ms (timeupdate chỉ ~4 lần/s). ⛔ ☰ Menu của core KHÔNG dừng `<audio>`
trần ⇒ bắc cầu `ftgPauseHandlers` → `tpl.onPause` (khuôn maze-chase/group-sort). URL kho:
`https://andrewclasses-01.github.io/myLesson-audio/<LEVEL>/<MÃ>.mp3` (Accept-Ranges + CORS `*`).

## Fight / Showdown

`fightMode` + `showdownMode` + `sdDeal` (khuôn Quiz). Trong trận: mọi dấu nói từ nào đúng bị GIỮ tới `reveal()`
(chỗ trống hiện "•••", ô đã bấm xám `is-taken`, vùng dưới `.is-fightlost`); `wordDone` báo khi XONG CÂU
(đúng = mọi chỗ trống đúng); chỉ bàn 0 có `<audio>` (`ctl.speaks`), bàn kia nhại trạng thái 🔊 qua
`syncVoice`, chạm 🔊 ở bàn kia → `requestVoiceToggle("ftg:<index>")`. `.aw-fight-board.is-concealed` che vùng
dưới + chữ trong chỗ trống. ⛔ KHÔNG khai `fightTurns` (hai bàn hai đoạn nghe cùng lúc = tồn đọng voice của
core). Showdown: `setNav({index})` mỗi câu, `ui.roundDone()` khi xong câu, `setRoundTimeout` → hết giờ = mọi chỗ
trống còn lại tính sai, 1 lần Points off, 1 tim. ⬜ Fight đã bấm thử trên dev server (khoá/giấu/reveal/đẩy câu
đúng); Showdown chỉ nối dây theo hợp đồng, CHƯA chạy thật với phòng chờ.

## Công cụ chuẩn bị bài — `tools/ftg-prepare.py`

`python tools\ftg-prepare.py LSA2-S1.T1.P1-2-3` → tự tìm `.txt/.mp3(.mp4)/.xlsm` trong `D:\4. LISTENING` →
ffmpeg → Parakeet (GPU, `E:\LAP TRINH APP\MODEL`) → khớp từng dòng kịch bản vào chữ máy nghe (SequenceMatcher,
cửa sổ tuần tự; số ↔ chữ được quy về một dạng: "6.15" = "six fifteen") → gợi ý chỗ trống = từ trong sheet
WORDTABLE/WORDS (so lỏng bỏ s/es/ed/ing, tối đa 3/câu) → gói `.ftg.json` đúng hình dạng Import (folderPath
theo `LESSON_TREE`). Dòng "Question N:" giữ nhưng `enabled:false`; dòng khớp < 0,6 mang cờ `weak` + `heard`
(chữ máy nghe) để thầy sửa text. Đo thật bài LSA2-S1.T1.P1-2-3: **16 s**, 53 dòng, 17 gợi ý, 1 dòng yếu — và
dòng yếu ấy là text gốc SAI ("Son of our sister!" — máy nghe "So did my sister" đúng). ⛔ Chỉ đọc nguyên liệu,
file tạm ở %TEMP%, ghi gói qua file tạm + `os.replace`.

## Editor (`find-the-gap-editor.js`)

Tiêu đề · Audio (nút Check tải file thật, hiện ✓ thời lượng) · mỗi dòng: người nói · text (sửa được, chỗ trống
tự bám theo từ) · **chip từng từ, bấm = khoét/bỏ** · start → end · ▶ phát đúng đoạn · In game/Off · Remove ·
mỗi chỗ trống một ô "cách viết khác". Thanh bulk: Paste transcript ("Male: câu" mỗi dòng) · Suggest gaps from
word list (dán từ vựng) · Clear all gaps · Delete all lines. Lưu `{audio, items}`; validate tiêu đề/audio/≥1
dòng bật có chỗ trống/end > start.

## Bộ file
`find-the-gap.js` · `find-the-gap.css` (`.aw-ftg-*`, cả CSS editor) · `find-the-gap-editor.js` · `ftg-shared.js`
(lá) · `ftg-audio.js` · `ftg-sound.js` + `sounds/` (bộ băng chuyền chép từ Find the match) · `sample-find-the-gap.js`
(14 câu thật LSA2-S1.T1.P1-2-3, `optVer:4`) · `test.html` + `test.js` (`?mode= ?scoring= ?choices= ?lives=
?points= ?timer= ?edit=1 ?src=<gói json>`). Catalog: mục `find_the_gap`, icon `fmtWord`; `core/tpl-files.js` +
khối preload sinh lại bằng `tools/sinh-preload.py --write` (tiện thể nó bổ sung `core/classes.js` bị sót vào
`play.html`). ⛔ KHÔNG sửa `core/`.

## Đã kiểm (dev server 5591, 18/9/2026)
- `scratch/ftg-bench.html` **40/40**: QUIZ chấm gap (19 chỗ trống, 1 sai ⇒ correct 18, review 14 hàng có
  `src`) · Points off 10 + Lives 2 ⇒ −10 sau khi bay, Game over, −20 đã flush · TYPE gõ bàn phím thật, sai lộ
  đáp án, chấm sentence total 14, ☰ Submit answers giữa chừng answered 2 · FIND 19 ô, ô đúng mờ, ô sai đứng
  yên · Start again sạch tim, không còn card. 0 lỗi console.
- Mắt: QUIZ 6 ô 2 hàng · TYPE bàn phím + ô nhập + ⌨ · FIND co `--gfit` 0,853 vừa khung 1 px · editor ✓ 4:14.5
  · Fight 2 bàn: bàn trái đúng → 1 điểm, bàn phải xám, trọng tài đẩy cả hai sang câu 2, loa bàn phải nhại.
- ⛔ Bẫy bàn thử: `press()` của core nghe cả `pointerdown` LẪN click không tin cậy ⇒ tap giả phải bắn ĐÚNG
  `pointerdown`; `optVer` phải ở CẤP ACT (không trong options) kẻo Points off ×20; chip điểm đếm dần nên đọc
  số phải chờ ~0,9 s. Hai bẫy TDZ/khoá ô sau khi chuyển câu ở FIND đều do bench bắt được.

## ⬜ Chờ thầy / ĐỀ XUẤT
- Thầy bấm tay: trang chủ thật → New activity ▸ Find the gap (mẫu) · Import gói `.ftg.json` · editor · 3 mode ·
  Fight · TOMKO cảm ứng · điện thoại (tải trọn file lần đầu).
- Showdown thật với phòng chờ; convert.js (Change template sang/từ Find the gap) chưa có — cần sửa core, chờ
  thầy chốt; Print chỉ ra dạng "câu có ___ · đáp án".
- Gợi ý chỗ trống mới so đơn từ; cụm 2 từ trong WORDTABLE (INSTEAD OF) bỏ qua.

## Sửa vòng 2 (18/9/2026, thầy bấm tay bản 1 rồi góp 4 nhóm ý) — bench 50/50
1. **QUIZ nhiễu khó hơn** (`ftg-shared.js` `wordVariants` + `buildChoices`): thứ tự nhiễu = `gap.choices` của
   editor → **cặp số ít/nhiều của chính từ đúng** (passport ↔ passports, photo ↔ photos, luôn có 1 ô) → từ khác
   trong bài giống nhất → (bài quá ít từ) các dạng động từ +ing/+ed. Không bao giờ lấy dạng trùng đáp án được chấp
   nhận. Nhiễu tinh hơn (cặp âm gần, từ ngoài bài) chờ đường myWord/CLI (đề xuất riêng, chưa chốt).
2. **Điểm mặc định = "Each sentence"**: câu 2 chỗ trống phải đúng cả 2 mới 1 điểm (`normScoring` mặc định,
   sample + tool); ô "Each gap" vẫn còn trong Options cho ai muốn.
3. **Fight — "ai nhiều ô đúng hơn thắng vòng"** (KHÔNG sửa core): hai bàn chung một module nên có **sổ chung
   `ftgFightLedger`** (số ô đúng mỗi bàn theo vòng, bàn 0 mở sổ, bàn 1 dùng chung). Báo trọng tài
   `wordDone({correct: có ≥1 ô đúng})` để bàn 1/2 KHÔNG bị khoá như sai; lúc trọng tài `reveal()` mỗi bàn tự chốt
   `points = (mình > 0 && mình ≥ bàn kia) ? 1 : 0` rồi `ui.setScore`. Đo 4 vòng: 1↔0 → 1/0 · 1/2↔1/2 → mỗi bên
   +1 · đúng↔đúng → +1 mỗi bên · 2/2↔1/2 → chỉ 2/2. Time delay / "Slower team keeps points" của trọng tài vẫn
   giữ nguyên nghĩa (bàn bị khoá/đóng băng thì không được điểm dù đếm nhiều hơn).
   ⛔ Bẫy: `lock(false)` của trọng tài từng bật ô ngay giữa lúc trượt câu (`animating`) ⇒ bấm bị bỏ qua; nay
   mở khoá đi qua `syncTileLocks()` (tôn trọng `canAnswer()`).
4. **FIND hết lẹm hàng cuối**: thêm ResizeObserver trên `root`/`area`/**ô đầu lưới** ⇒ cỡ ô đổi sau lần đo đầu
   (`--aw-u` đặt muộn, zoom) là co lại `--gfit`; đo 1240×830: mép dưới 1 px.
5. **Option "Remove corrects"** (ô tích chung, khoá `removeCorrects`, mặc định bật, `checkOrder`): tắt thì ô đã
   đúng ở lại lưới y như ô khác (luật Find the match), bấm lại cho chỗ trống khác = sai.

## Vòng 3 (18/9/2026 tối) — KHOÉT CỤM NHIỀU TỪ + đọc sheet FILLGAP của myWord — bench 50/50
- `gap.span` (mặc định 1): một chỗ trống phủ N token liền nhau ("High Street", "ten minutes"); `gapText()`
  nối core các token, `gapEnd()`; chỗ trống không được chồng nhau (normalizeItems giữ chỗ trước). Câu vẽ theo
  vòng `for` nhảy qua span; dấu câu đầu/cuối cụm giữ ngoài ô. Editor: chip cụm gộp làm một, mỗi chỗ trống có
  nút `−` / `+ word` để nới/co cụm (không cho chồng lên chỗ khác); Save ghi `span` chỉ khi > 1.
- `tools/ftg-prepare.py`: có sheet **FILLGAP** trong .xlsm (myWord v2.4.0 sinh bằng CLI) thì lấy Y NGUYÊN
  dòng/chỗ trống/nhiễu từ sheet (A người nói · B câu có [ngoặc] · C… nhiễu), bỏ kịch bản .txt + gợi ý máy;
  `parse_bracket_line` bỏ ngoặc rồi tách theo khoảng trắng nên chỉ số từ khớp `tokenize()` của game và dấu câu
  dính từ ("[bookshop].") vẫn đúng. ⛔ Sheet chỉ chọn vài câu rải rác nên khớp ASR phải dò **toàn băng**
  (`align(..., whole=True)`), cửa sổ tuần tự hẹp chỉ dùng cho kịch bản đầy đủ — đo: dòng Paul 163,7 s khớp đúng.
  Dòng tiêu đề sheet (`SPEAKER | LINE …`) bị bỏ qua. Thử: `scratch/ftg-fillgap.json` (3 câu, cụm "High Street",
  nhiễu của sheet) chơi đúng trên test.html `?src=`.
- Phía myWord: v2.4.0 `008f58e` (module `find-gap.js`, sheet FILLGAP thêm mới vào file cũ, 6 test xanh, CLI thật
  32 s / 8 câu / 0 lỗi luật) — xem `E:\LAP TRINH APP\myWord\GHI CHU DU AN.md` mục v2.4.0.

## Vòng 4 (18/9/2026 tối, thầy góp 4 ý về Options) — bench 63/63
- **Ô mờ theo mode**: `Choices` chỉ sáng ở Quiz, `Remove corrects` chỉ sáng ở Find — dùng đúng class core
  `.is-locked` (khuôn `setLocked` của Fight: mờ 0,4 + `disabled`, KHÔNG ẩn — luật Đợt 143/220); nghe seg Mode
  đổi là cập nhật ngay, mở bảng cũng đặt đúng trạng thái ban đầu.
- **Min gaps** (thanh kéo 1–10, khoá `minGaps`, mặc định 1): mỗi câu ít nhất N chỗ trống — thiếu thì game khoét
  thêm, chọn ĐỊNH TRƯỚC từ dài trước (đáng nghe), cùng dài thì từ đứng trước; câu ít từ hơn N thì khoét hết
  (đo: kéo 10 trên câu 16 từ → 10 chỗ, chừa "it at I to").
- **Random gaps** (ô tích, khoá `randomGaps`, mặc định tắt): mỗi ván — kể cả Start again — bốc lại vị trí chỗ
  trống; số chỗ = max(Min gaps, số thầy khoét); cụm thầy khoét là một đơn vị bốc; ưu tiên từ ≥ 3 chữ, chỉ động
  tới "a/the/I" khi hết từ dài. Chỗ khoét thêm dùng nhiễu tự sinh (không có `gap.choices`).
  ⛔ Fight: hai bàn PHẢI khoét cùng từ — bàn 0 bốc rồi ghi vào sổ chung `ftgFightLedger.gaps` (khoá theo object
  câu gốc `it.src`, hai bàn dùng chung object), bàn 1 lấy lại. Cùng khuôn với sổ đếm ô vòng 2.
- Cài đặt ở `applyGapPolicy()` (module-level, đầu file) — chạy sau khi xáo câu, trước khi dựng `pool`/`state`.

## Đợt 341 (18/9/2026 tối, đi cùng myWord v2.5.0 — thầy chốt "SỐ CÂU HỎI" + dùng hết câu thoại + nút Tạo gói) — CHỈ `tools/ftg-prepare.py`
Game và editor **không đổi một dòng**. Thay đổi nằm ở nguồn dữ liệu và công cụ chuẩn bị:
- **Sheet FILLGAP nay là CÂU HỎI, không phải lượt nói** (myWord `find-gap.js tachCau` + `gopCauHoi`): kịch bản được máy tách
  thành CÂU, thầy đặt **Số câu hỏi** N ∈ [số lượt nói … số câu], câu dư được MÁY gộp vào câu liền kề cùng người nói ⇒ **mọi
  câu thoại đều được dùng, mỗi dòng sheet = một lượt chơi**, ô B có thể là 2–3 câu nối nhau. Dòng đề bài / `Question N:` là
  câu thường với người nói `Narrator` (thầy chốt) ⇒ tool **luôn `enabled:true`** cho dòng FILLGAP (đường `.txt` cũ vẫn tắt
  Narrator theo `--keep-narrator`).
- **`parakeet_words.py` gọi ĐÚNG giao ước `--out <base>`** — bản Đợt 340 quên `--out` nên trên máy có `parakeet_words.py`
  bản 20/07 (`required=True`) là argparse chết ngay; con số "16 s" của Đợt 340 đo trên máy khác (ổ E không đồng bộ).
  `tmpdir` trải `os.path.realpath` (bẫy đường dẫn 8.3 làm libsndfile không mở wav — mySpeaking 21/07).
- **Cache mốc giây cạnh audio: `AUDIO\<mã>.pk.json`** (hoặc cạnh `.mp4` khi tiếng rút từ video). Đo P1: Parakeet 41,2 s lần
  đầu → **1,0 s** lần sau; `--no-cache` để nghe lại. Đây là ngoại lệ duy nhất của luật "chỉ đọc thư mục bài".
- **ffmpeg DÒ** (MODEL\ffmpeg → AutoSubs → MODEL\whispercpp → myLesson-data\bin → myStudent-data\bin → C:\ffmpeg → PATH);
  máy 1 không có `MODEL\ffmpeg`, có ở AutoSubs.
- Dòng FILLGAP **không khớp băng thì KHÔNG bị bỏ** (giữ `start 0 / end 0.25` + `weak`) để đủ N — thầy đặt mốc tay trong editor.
  `OK.` ↔ `Okay.` quy về một từ khi so.
- Dòng cuối stdout `@@KQ {"out","items","gaps","weak","cache"}` — myWord (`goi-aword.js`) spawn tool này bằng nút **"Tạo gói
  AWord"** (`--xlsm <file bài> --code <mã> --out <cạnh file>.ftg.json`), stream log vào app, đọc dòng này ra kết quả.
- **Đo thật trên P1 (LSB1-S1.T1.P1, 55 câu / 27 lượt → 45 câu hỏi, 81 chỗ trống):** gói 45 dòng, **45/45 chơi được** qua
  `normalizeItems` (8 cụm `span > 1`: "platform six", "lost property", "sports bags"…), 1 dòng khớp yếu — và lần này cũng là
  **text gốc sai**: dòng đề bài P1.3 trong `.txt` chép nhầm câu của Girl, băng nói "Who lives with Josh in his house?".
- ⬜ Chưa Import gói này vào trang thật / chưa chơi 3 mode với câu hỏi gộp (câu dài hơn ở dải trên — cần nhìn TOMKO).

## Đợt 342 (18/9/2026 tối) — Import: kéo `.xlsm` có FILLGAP vào trang KHÔNG ra Find the gap (cần mốc giây) — hộp Import nay nói rõ + gợi ý gói `.ftg.json`; `ftg-prepare.py --require-fillgap` (myWord luôn truyền). Xem `GHI CHU DU AN.md` Đợt 342.

## Đợt 343 (18/9/2026 khuya) — NGUỒN DỮ LIỆU CHÍNH nay là Import `.xlsm`: `core/lesson-import.js` đọc sheet FILLGAP (A người nói · B câu [ngoặc] · C/D/E nhiễu · **F/G mốc giây do myWord v2.6.0 đo** · H match) → act riêng `<mã> / FIND THE GAP`. `ftg-prepare.py` còn hai vai: `--align-json` (myWord gọi lấy mốc giây) và đường gói `.ftg.json` cũ. Xem `GHI CHU DU AN.md` Đợt 343.
