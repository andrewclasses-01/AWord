# GHI CHÚ — SPEAKING

**TRẠNG THÁI: ✅ ĐÃ CHỐT, SỐNG Ở TRANG CHỦ** (11/8/2026, Đợt 108, v0.9.82). Thầy test cơ bản trên máy
thật (mic thật) rồi duyệt đưa lên live để test tiếp — đã thêm vào `core/catalog.js` + commit + push.
**Đang trong giai đoạn thầy test thêm trên bản LIVE — sẽ còn chỉnh sửa theo phản hồi.**

## Đợt 108 (11/8/2026, v0.9.82) — 6 CẢI TIẾN THẦY GỬI SAU KHI TEST LIVE

Thầy chơi thử bản live rồi gửi 6 điểm; đã hỏi lại 6 câu bằng AskUserQuestion trước khi code (thầy chốt:
được sửa core; bỏ câu hướng dẫn nhưng GIỮ báo trạng thái; sao **tối đa 5, nấc nửa sao**; **ngưỡng đạt
trong Options đổi hẳn từ % sang SAO**; thang quy đổi **chia đều `% ÷ 20`**). Thầy nói "ok build" + cho
phép tự test xong thì tự commit/push/ghi nhật ký.

1. **Tải bộ chấm NGAY khi mở act, chưa xong thì chưa có nút PLAY** ⭐ CÓ SỬA CORE — móc mới
   `tpl.prepare(activity, onProgress)` trong `core/engine.js` (+ `.aw-ready-prep*` trong `core/app.css`,
   + `warmup()` trong `core/speech-score.js`). Hợp đồng đầy đủ: `core/HUONG DAN CORE.md` mục "CHUẨN BỊ
   TRƯỚC KHI CHƠI". Template gộp tiến độ theo TỪNG FILE của transformers.js thành 1 con số %.
2. **Slogan** "SPEAKING IN ANDREW CLASSES" giữa hàng đồng hồ/điểm (đúng khuôn Anagram/Crossword; nhớ
   `sloganEl.remove()` trong `cleanup`).
3. **Tự dừng ghi âm khi học sinh nói xong** — `startLevelWatch()`: `AnalyserNode` + `setInterval`
   (KHÔNG `requestAnimationFrame` — bẫy tab ẩn), đo RMS, **học mức ồn của phòng trong 250ms đầu** rồi
   suy ra 2 ngưỡng bật/tắt, im `SILENCE_HOLD_MS` = 800ms sau khi đã có tiếng nói thì tự `stopRecording()`.
   Bấm mic lần nữa vẫn dừng tay được; trần cứng 6s vẫn giữ.
4. **Hiện IPA** (`it.phonemes`) ngay dưới từ, chữ monospace mờ.
5. **Bỏ hết câu hướng dẫn** ("Tap the microphone…", "…or press Next"); dòng chữ chỉ còn trạng thái thật
   (Listening… / Checking… / mic bị chặn / bản ghi quá ngắn).
6. **Sao 0–5 nấc nửa sao** (`starsForScore` = `Math.round(score/10)/2`), vẽ bằng 2 lớp sao chồng nhau,
   lớp vàng bị **cắt theo `width` %** — đó là cách ra nửa sao mà không cần thêm hình. Options đổi
   "Pass threshold (%)" → **"Stars needed to pass" (1→5, nấc 0,5, mặc định 3,5★)**; act cũ lưu
   `passThreshold` % vẫn chạy (quy đổi cùng công thức ÷20 → 70% = 3,5★). Điểm tổng vẫn = **số từ đạt**.

### Đã tự test THẬT (Browser pane, cổng riêng 5511 vì phiên Claude khác đang giữ 5510)

**Mẹo test quan trọng — GIẢ LẬP MICRO, dùng lại được cho mọi lần sau**: Browser pane không xin được
quyền mic thật, nhưng **tráo `navigator.mediaDevices.getUserMedia`** trả về `MediaStreamAudioDestinationNode`
phát một `AudioBuffer` tự dựng = **0,4s im + clip giọng AI (Kokoro TTS) + 2,0s im** thì toàn bộ đường
đi thật (MediaRecorder → AnalyserNode → mô hình AI → chấm điểm → sao) chạy y như mic thật.

- **Thanh %**: PLAY bị ẩn (`display:none`), thanh chạy thật 38% → 61% → xong sau **23,5 giây**, rồi PLAY
  hiện ra. Dựng lại act lần 2: PLAY hiện sau **55 mili giây** (mô hình đã nhớ).
- **Tự dừng**: mở mic ở mốc 0 → "Listening…" ở 20ms → **"Checking…" ở 2123ms** = đúng 0,4s im đầu +
  ~0,9s tiếng + 0,8s im cuối. Không hề bấm lần 2.
- **Chấm + sao**: đọc "elephant" cho từ "elephant" → **100% = 5 sao**, đạt, điểm lên 1, tự sang từ sau.
  Đọc "elephants" cho từ "elephant" → **86% = 4,5 sao** (4 sao đầy + 1 nửa, đúng `width:50%`), với
  ngưỡng 5★ thì KHÔNG đạt, đứng lại, mic vẫn bấm lại được.
- **Act kiểu cũ** (`passThreshold: 70`, không có `passStars`): 86% → 4,5★ ≥ 3,5★ → đạt, điểm 1. ✔
- **Quay lại từ đã chấm** (nút Previous): sao + % hiện lại đúng.
- **Options**: hiện "Stars needed to pass", min 1 / max 5 / step 0,5, kéo ra "2.5 ★" đúng.
- **Không hồi quy**: Quiz + Anagram mở lên PLAY hiện NGAY, không có thanh %, chơi bình thường.
- **Editor**: vẫn mở đúng 4 từ mẫu kèm IPA.
- **0 lỗi console** (chỉ 2 dòng cảnh báo quen thuộc của onnxruntime).

### ⚠️ Lỗi thật bắt được lúc tự test (và đã sửa)

Hàng sao làm nội dung **tràn 9px** ở tỷ lệ 16:9 (mức hẹp nhất khi phủ kín màn hình) — sửa bằng cách
siết `gap` của `.aw-spk-card` 3cqw→2,2cqw, `.aw-spk-micwrap` 1,4cqw→1cqw, sao 4,8cqw→4,2cqw. Đo lại: 0
tràn ở cả 16:10,5 lẫn 16:9, **ca kiểm chứng 21:6 vẫn báo tràn 132px** (chứng minh phép đo có thật, đúng
luật "cho bàn đo một ca phải-thấy-tràn" của HUONG DAN CORE mục 4b). Màn điện thoại 375px: 0 tràn, nút
mic chạm sàn 64px như thiết kế.

## Đợt 107b (11/8/2026) — thầy duyệt + 3 thay đổi trước khi lên live

1. **Đổi tên template**: "Pronunciation check" → **"SPEAKING"** (thầy đặt). Đổi TOÀN BỘ: thư mục
   `templates/pronunciation-check/` → `templates/speaking/`, mọi file `pronunciation-check.*` →
   `speaking.*`, `type: "pronunciation_check"` → `"speaking"`, class CSS `aw-prc-*` → `aw-spk-*`,
   `openPronunciationCheckEditor` → `openSpeakingEditor`. Đổi được an toàn vì CHƯA có act nào lưu với type
   cũ (template chưa từng vào catalog trước lần commit đầu tiên này). ⚠️ Đừng nhầm với **Speaking cards**
   (`speaking_cards`) — 2 template khác nhau.
2. **Bỏ âm "Oh my god"**: không gọi `ui.sound.correct()`/`ui.sound.wrong()` của engine nữa (wrong mặc
   định của engine = "Oh my god" mp3). Thêm `speaking-sound.js` + copy 9 mp3 bộ classic Wordwall từ
   `templates/type-the-answer/sounds/` vào `./sounds/` riêng (đúng quy ước tự-chứa): intro / correct×3 /
   incorrect×3 / gamecompleted / restart. Khai `tpl.sounds = {play, restart, complete}` để engine dùng
   thay chuông mặc định. Đã xác nhận qua Browser pane: 9/9 file nạp sẵn (`pack.stats()` ra
   `ready:9, primed:true`), mọi request 200.
3. **Gộp trang chủ**: thêm 1 mục vào `core/catalog.js` (đúng khuôn HUONG DAN TEMPLATE.md). Đã test đường
   nạp thật từ trang gốc (`play.html` console): `templateEntry("speaking")` đúng, `ensureTemplate` tự chèn
   CSS + đăng ký module, `startGame` mount ra khung `.aw-stage` tên "SPEAKING" — 0 lỗi.

## Mô tả

Ý tưởng riêng của Teacher Andrew — KHÔNG có template tương đương bên Wordwall. Mỗi lượt hiện 1 từ tiếng
Anh, học sinh bấm mic đọc to, AI chấm điểm phát âm (0-100%) rồi so với ngưỡng đạt (Options) để quyết định
đúng/sai cho từ đó.

Nghiên cứu ban đầu: 2 dự án mã nguồn mở "chấm phát âm" phổ biến nhất (OpenPronounce, AI Pronunciation
Trainer) đều cần máy chủ Python — không hợp AWord (web tĩnh, mọi AI chạy thẳng trong trình duyệt học sinh,
giống hệt giọng đọc AI Kokoro của Anagram). Nên dựng lại đúng CÔNG THỨC của họ (nghe → nhận diện ÂM → so
khớp ÂM chuẩn) bằng 2 mảnh AI chạy 100% trong trình duyệt, không máy chủ riêng.

## Kiến trúc — 2 file core MỚI (thuần cộng thêm, giống tiền lệ `core/tts.js` ở Đợt 94)

- **`core/phonemize.js`** — gói `phonemizer` (Xenova, Apache-2.0, eSpeak-NG/WASM) đổi 1 từ thành IPA
  "chuẩn". Chỉ chạy ở EDITOR (biên soạn nội dung), không đụng gì lúc chơi, không cần đăng nhập.
- **`core/speech-score.js`** — nghe bản ghi âm của học sinh bằng mô hình
  `onnx-community/wav2vec2-lv-60-espeak-cv-ft-ONNX` (Facebook/Meta, Apache-2.0, qua
  `@huggingface/transformers`), ra IPA "nghe được", so với IPA chuẩn bằng Levenshtein tự viết (so ký tự
  IPA, bỏ qua dấu trọng âm/độ dài) ra điểm 0-100.

## ⭐⭐ Bẫy thật bắt được lúc test — ĐỌC TRƯỚC KHI SỬA `core/speech-score.js`

`pipeline("automatic-speech-recognition", MODEL_ID)` của `@huggingface/transformers@3.8.1` LUÔN lỗi
`Could not locate file: "tokenizer.json"` — kho mô hình này chỉ có `vocab.json` (định dạng tokenizer cũ),
thư viện chưa hỗ trợ dự phòng đọc thẳng `vocab.json` (hạn chế còn MỞ của chính thư viện — xem GitHub
`huggingface/transformers.js` issue #93; xác nhận cả gọi trực tiếp `Wav2Vec2CTCTokenizer.from_pretrained`
cũng lỗi y hệt, không phải lỗi riêng của `pipeline()`).

**Sửa (đã áp dụng)**: bỏ hẳn tokenizer của thư viện. Tự tải `AutoProcessor` (xử lý âm thanh) +
`AutoModelForCTC` (mô hình) — 2 phần này KHÔNG cần tokenizer — tự `fetch()` thẳng `vocab.json` (chỉ là
bảng ký-hiệu↔số), rồi tự viết giải mã CTC kiểu "greedy" (~15 dòng: mỗi khung thời gian lấy ký hiệu điểm
cao nhất, gộp khung liên tiếp trùng nhau, bỏ ký hiệu "trống"). Nếu thư viện sau này vá issue #93, có thể
quay lại dùng `pipeline()` cho gọn — không bắt buộc, cách hiện tại vẫn đúng và không phụ thuộc bản vá đó.

**Xác nhận đúng bằng vòng lặp thật** (không đoán): TTS (Kokoro) tạo âm thanh cho "elephant" → đưa qua toàn
bộ pipeline `speech-score.js` → nghe ra `"ɛlɪfənt"`, so với `phonemizeWord("elephant")` =
`"ˈɛlɪfənt"` → khớp **100%**; so ngược với mục tiêu "banana" ra **0%**.

## Quyết định kỹ thuật thứ 2 — LUÔN q4/wasm, không thử WebGPU

Khác `core/tts.js` (Kokoro): `core/speech-score.js` KHÔNG thử nhánh WebGPU/fp32. Đo thật: bản fp32/WebGPU
nặng **~1,26GB** (tải bị "kẹt" lâu bất thường lúc test), bản q4/wasm chỉ **~240MB** và nhận diện 1 từ ngắn
vẫn đủ nhanh dù không có GPU tăng tốc. Khác Kokoro (nơi thầy tạo NHIỀU giọng liên tục trong 1 phiên editor
nên tốc độ đáng công đổi lấy file nặng hơn — đo thật ở Đợt 103: WebGPU nhanh hơn wasm ~8,6 lần) — ở đây
mỗi lượt học sinh chỉ ghi 1 từ ngắn 1 lần, dung lượng tải LẦN ĐẦU quan trọng hơn tốc độ suy luận.

## Cách chơi

Mỗi lượt: từ + **IPA chuẩn ngay dưới từ** (+ gợi ý tuỳ chọn) + nút 🔊 nghe phát âm chuẩn (tái dùng
NGUYÊN hạ tầng `voiceClips` + `core/voice-playback.js` đã có của Anagram/Type the answer — KHÔNG viết
lại) + nút 🎤 tròn ghi âm. Bấm 🎤 rồi đọc, **nói xong là nó tự dừng và tự chấm** (không phải bấm lần 2);
kết quả hiện bằng **0–5 sao (nấc nửa sao) + số %**. Đạt ngưỡng sao (Options → "Stars needed to pass",
mặc định 3,5★) → tự sang từ sau; chưa đạt → đứng lại, cho bấm 🎤 thử lại (Options → "Allow trying
again") hoặc tự bấm Next bỏ qua — **chỉ lần ghi CUỐI của mỗi từ được tính điểm**. Khoá nút chuyển câu
(`Previous`/`Next`) trong lúc AI đang chấm — tránh đổi câu giữa chừng làm sai lệch kết quả (xem
`updateNav()`'s biến `locked`).

`itemsKey: "items"` (hỗ trợ "Start with mistakes"). `hidePointsOff`/`hideLettersOption`/
`hideShuffleAnswers` = true (không áp dụng cho game này). `toPrintItems` trả về dạng danh sách từ đơn giản
(clue/answer) — Print cho game này chỉ có ý nghĩa tham khảo, không phải mục đích chính.

## Editor (`speaking-editor.js`)

Mỗi từ bắt buộc bấm "Generate phonemes" (từng hàng hoặc 1 nút chạy cả loạt) trước khi chơi được — từ chưa
có `phonemes` bị game tự lọc bỏ (không chặn Save, giống tinh thần "voice tuỳ chọn" của Anagram). Nút
"🔊 Generate voice" (tuỳ chọn, tái dùng `core/tts.js` + `core/voice-clips.js`) dùng 1 giọng mặc định
(`DEFAULT_VOICE`), KHÔNG có popover chọn giọng đầy đủ như Anagram — có thể bổ sung sau nếu thầy muốn.
Generate voice CẦN đăng nhập (ghi Firestore); Generate phonemes KHÔNG cần (thuần WASM client-side).

## Đã tự test — CÁCH test + giới hạn đã biết

Qua Browser pane thật (`http://localhost:5510/templates/speaking/test.html`):
- `phonemizeWord()` ra IPA THẬT cho 4 từ mẫu (elephant/banana/butterfly/umbrella) — dữ liệu mẫu
  (`sample-speaking.js`) dùng ĐÚNG kết quả thật này, không tự bịa IPA.
- Vòng TTS→AI nghe→chấm điểm (chi tiết ở trên) — đúng.
- Giao diện chơi (`test.html`, bấm Play thật): từ + gợi ý + nút mic + trạng thái Next/Previous khoá đúng
  lúc chưa trả lời.
- Màn hình Editor (mở qua nút "Edit" thật của engine): hiện đúng 4 từ mẫu kèm IPA đã lưu; thêm từ mới
  "giraffe" + bấm "Generate phonemes" trên giao diện thật ra đúng "/dʒᵻɹˈæf/".
- 0 lỗi console JS thật suốt phiên test (chỉ vài dòng cảnh báo vô hại của chính onnxruntime).

**KHÔNG tự test được**: quyền microphone thật — Browser pane build tự động CHẶN HẲN xin quyền mic (giống
giới hạn "không tự động hoá popup đăng nhập Google" đã biết). Đã xác nhận nhánh lỗi ("Microphone access
was blocked…") hiện đúng thông báo + nút mic trở về bình thường, không kẹt màn hình — nhưng CHƯA có bằng
chứng thật về ghi-âm-thật→chấm-điểm trên GIỌNG NGƯỜI THẬT (chỉ xác nhận trên giọng máy tổng hợp TTS).

## ⚠️ Rủi ro về độ chính xác — thầy ĐÃ test cơ bản, đang test thêm trên live

Mô hình `wav2vec2-lv-60-espeak-cv-ft` vốn luyện cho câu nói dài (CommonVoice, giọng người lớn nhiều ngôn
ngữ), chưa có số đo công bố cho: (a) 1 từ đơn lẻ ngắn, (b) giọng học sinh Việt Nam/trẻ em nói tiếng Anh.
**11/8/2026: thầy đã test cơ bản bằng mic thật trên máy thật và duyệt đưa lên live để test tiếp** — nếu
độ chính xác chưa như ý ở diện rộng, ngưỡng đạt đã là Option (từ Đợt 108 tính bằng **sao**) nên thầy tự
chỉnh thử được ngay không cần sửa code; nặng hơn mới tính cân nhắc mô hình khác.

## Việc kế tiếp

1. **Thầy test thêm trên bản LIVE** (nhiều từ, nhiều giọng học sinh thật) — sẽ còn chỉnh sửa theo phản hồi.
2. **Riêng phần TỰ DỪNG (Đợt 108) cần tai người nghiệm thu**: máy build chỉ chứng minh được bằng giọng
   AI trong phòng hoàn toàn yên. Lớp ồn thật có thể cần chỉnh `SILENCE_HOLD_MS` (800ms) hoặc 2 hệ số
   ngưỡng `floor * 3.2` / `floor * 1.8` trong `startLevelWatch()` — 3 con số này nằm cùng một chỗ, đổi
   rất nhanh.
3. Nếu muốn: bổ sung popover chọn giọng đầy đủ cho "Generate voice" (hiện chỉ 1 giọng mặc định
   `DEFAULT_VOICE`, khác Anagram có popover 28 giọng).
4. Chưa test thật trên iPhone/iPad (Safari) — MediaRecorder trên iOS ra định dạng mp4/aac thay vì webm,
   `read_audio` của transformers.js giải mã qua Web Audio nên NHIỀU KHẢ NĂNG vẫn ổn, nhưng chưa có bằng
   chứng thật. iOS cũng là nơi đáng nghi nhất cho phần tự-dừng (AudioContext trên Safari khắt khe hơn về
   "phải có cú chạm của người dùng" — ở đây cú chạm nút mic chính là cú chạm đó, cộng `ctx.resume()`).

---

## Đợt 140 (13/8/2026) — BẢNG OPTIONS v2: tuỳ chọn riêng của template này chuyển sang lưới chung
✅ THẦY DUYỆT → COMMIT + PUSH + LIVE. Thầy yêu cầu thiết kế lại toàn bộ bảng Options (*"rất rối, khó nhìn, không thẳng
hàng"*); chi tiết đo đạc + 5 luật mới nằm ở `../../GHI CHU DU AN.md` Đợt 140 và
`../../core/HUONG DAN CORE.md` mục **"OPTIONS PANEL v2"**.

**Đổi ở template này**: `buildExtraOptions` viết lại bằng 4 hàm dựng chung engine truyền vào —
`mkCell` · `mkSeg` (thay hàng radio) · `mkSliderCell` (thanh trượt + chip giá trị 52px) ·
`addCheck` (đẩy ô tick vào khối switch dùng chung ở đáy panel).
**KHÔNG đổi**: tên trường trong `draft`/`activity.options`, khoảng giá trị, mặc định, hay bất kỳ hành
vi nào lúc chơi. Act cũ mở lên vẫn đúng y như trước.

⚠️ Thanh "Stars to pass" chạy theo bước **0.5** — vì nó mà `mkSliderCell` của core phải clamp bằng
`Number()` chứ không `v|0` (phép bitwise sẽ nuốt sạch nửa sao mà không báo gì).

**Đo thật panel của template này (1280×720, cùng phép đo trước/sau)**: **396px → 274px**.
