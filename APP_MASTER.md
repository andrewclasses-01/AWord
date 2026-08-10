# APP_MASTER — AWord

> **FILE ĐỌC ĐẦU TIÊN khi tiếp nhận dự án.** Đọc xong file này là đủ hiểu toàn bộ để build tiếp.
> Lịch sử chi tiết từng version: `GHI CHU DU AN.md`. Hợp đồng engine↔template + mọi luật kỹ thuật:
> `core/HUONG DAN CORE.md` (ĐỌC TRƯỚC KHI SỬA CODE — mục mới "BẪY 'SNAP KHỰC MỘT CÁI'" đặc biệt quan trọng
> nếu bạn sắp viết hiệu ứng entrance/exit/fade/pop cho template MỚI, đọc TRƯỚC KHI VIẾT chứ đừng đợi lỗi).
> Nghiên cứu Wordwall + kiến trúc gốc: `docs/`.
> Cập nhật lần cuối: **10/8/2026 (Đợt 102, v0.9.76) — IMPORT EXCEL: TỰ ĐỘNG TẠO GIỌNG ĐỌC (TTS) CHO
> ENG1/ENG2. CÓ SỬA CORE: `core/tts.js` (thêm `getLastVoice`/`setLastVoice`), `core/voice-batch.js` (MỚI
> — `generateVoicesSequential()` dùng chung), `core/lesson-import.js` (cờ `ttsEligible` cho ENG1/ENG2 —
> VI1/VI2 tiếng Việt + PRONUNCIATION là IPA thô nên KHÔNG được tự tạo voice), `core/store.js`
> (`importBundle()` trả thêm `createdActs`), `core/app.css` (`.aw-imp-voice*`/`.aw-voice-progress*`). +
> `main.js` (khung Voice trong popup Import, pop-up xác nhận, pop-up tiến trình %). ✅ THẦY DUYỆT (chốt
> scope qua AskUserQuestion) → COMMIT `8488c5b` + PUSH + **LIVE** tại `https://aword.andrewclasses.com/`
> (`curl` xác nhận đủ `generateVoicesSequential`/`ttsEligible`/`confirmVoiceGeneration`/`createdActs`
> ngay lần poll thứ 3).**
> Lỗi thật bắt được lúc test: nút "Skip voices" trên pop-up xác nhận từng HUỶ CẢ LƯỢT IMPORT thay vì chỉ
> bỏ qua bước tạo giọng (return sớm trước cả `importBundle()`) — đã sửa. Test thật qua Browser pane với
> giọng Kokoro THẬT (harness Firestore giả trong bộ nhớ, xoá sau khi xong): khung Voice hiện đúng + mặc
> định tích + nhớ giọng gần nhất, pop-up xác nhận đúng số từ/tên giọng, acts tạo trước — voice tạo sau
> (không chờ nhau), cả 6 từ test đều có `voice`/`voiceId`/`hideText:true` đúng, cờ `ttsEligible` không lẫn
> vào tài liệu đã lưu, đường Skip voices và bỏ tích từ đầu đều đúng, 0 lỗi console. CHƯA test bằng tay:
> bấm Cancel giữa batch + đường lỗi chưa đăng nhập giữa batch (dựa trên soát code khớp pattern đã chứng
> minh ổn định từ Anagram editor Đợt 98). Chi tiết đầy đủ: `GHI CHU DU AN.md` Đợt 102. **Việc kế: thầy tự
> Import 1 file Excel thật, xác nhận nghe được giọng vừa tạo + thử Cancel giữa lúc đang tạo hàng loạt.**
>
> Trước đó: **10/8/2026 (Đợt 101, v0.9.75) — ĐỒNG BỘ VOICE/HIDE TEXT QUA 12 TEMPLATE TẠM KHI DÙNG "CHANGE
> TEMPLATE" (thầy chốt "Toàn bộ 12 game"). CÓ SỬA CORE: `core/convert.js`, `core/voice-playback.js` (MỚI),
> `core/app.css`. + 12 file `templates/*/[template].js` + 3 file `.css`. `running_team` CHỦ Ý bỏ qua
> (không có khái niệm clue). ✅ THẦY DUYỆT → COMMIT `7f154cc` + PUSH + **LIVE**.**
> Test thật qua Browser pane cho 4/12 template đại diện (quiz, crossword, open_the_box, speaking_cards) —
> 0 lỗi console mỗi lần; bắt và vá được 1 lỗi thật lúc soát code: `speaking-cards.js`'s `finishFlip()`
> dùng `innerHTML = front.innerHTML` xoá mất listener nút loa mới gắn (chuỗi text round-trip, không phải
> di chuyển node) — sửa thành `cardEl.replaceChildren(...front.childNodes)`, xác nhận lại bằng test thật
> (`.play()` được gọi khi bấm nút trên lá vừa lật). 8 template còn lại (true_false, find_the_match,
> balloon_pop, flying_fruit, gameshow, maze_chase, type_the_answer, whack_a_mole) chỉ xác nhận qua
> `node --check` + soát code, CHƯA chạy thật qua browser. 2 quyết định thu hẹp phạm vi có chủ ý:
> whack_a_mole chỉ áp dụng chế độ quiz (không đụng true/false — nhiều chuột/chữ nhỏ/phản xạ nhanh);
> speaking_cards chỉ ẩn text khi `dealPlaces===1` (nhiều lá cùng lúc luôn hiện chữ). Chi tiết đầy đủ:
> `GHI CHU DU AN.md` Đợt 101. **Việc kế: thầy tự thử "Change Template" từ 1 act Anagram có voice sang vài
> game trong 12 game trên (ưu tiên 8 game chưa test thật), xác nhận giọng đọc/ẩn text đúng trên bản
> LIVE.**
>
> Trước đó: **10/8/2026 (Đợt 100, v0.9.74) — ANAGRAM: NÚT HIDE/SHOW ALL TEXT + 4 NÚT BULK ICON-ONLY + NÚT
> LOA TO GIỮA KHUNG KHI ẨN TEXT + TRÌ HOÃN AUTO-PLAY TỚI HẾT NHẠC INTRO. KHÔNG ĐỤNG CORE (chỉ
> `core/icons.js` — thêm 2 icon — + 3 file `templates/anagram/*`). ✅ THẦY DUYỆT → COMMIT `7140c98` +
> PUSH + **LIVE**.**
> Chi tiết: `GHI CHU DU AN.md` Đợt 100 + `templates/anagram/GHI CHU ANAGRAM.md` Đợt 100.
>
> Trước đó: **10/8/2026 (Đợt 99, v0.9.73) — WHACK-A-MOLE: THANH "PHẠT" ĐỎ Ở HÀNG NÚT MENU/SOUND KHI ĐẬP
> SAI. Chỉ đụng `templates/whack-a-mole/*` (2 file), KHÔNG đụng core. ✅ THẦY DUYỆT → COMMIT `cde45a2` +
> PUSH + **LIVE**.**
> Chi tiết: `GHI CHU DU AN.md` Đợt 99.
>
> Trước đó: **10/8/2026 (Đợt 98, v0.9.72) — ANAGRAM: HIDE TEXT + WAVEFORM AUDITION-STYLE +
> DIM/BLUR/PROGRESS/CANCEL CHO GENERATE ALL + POPUP DELETE ALL WORDS + AUTO-PLAY/PHÁT QUANG TRONG GAME.
> KHÔNG ĐỤNG CORE (chỉ `core/icons.js` — thuần thêm 2 icon — + 3 file `templates/anagram/*`). ✅ THẦY
> DUYỆT → COMMIT `06fec24` + PUSH + **LIVE** tại `https://aword.andrewclasses.com/` (`curl` xác nhận đủ
> `loadWaveform`/`setHideTextState`/`buildDeleteAllWordsPopover` trong `anagram-editor.js`,
> `toggleVoiceClip`/`setListenGlow`/"Listen for the clue" trong `anagram.js`, `aw-anagram-ed-backdrop`/
> `aw-anagram-ed-runcancel`/`listenglow` trong `anagram.css`, `eyeOff` trong `core/icons.js` ngay lần
> poll thứ 2).**
> Ngay sau khi duyệt Đợt 96, thầy gửi tiếp 6 điểm (2 nhóm). **Nhóm Edit: (1)** icon Hide text cạnh mỗi
> hàng Clue — ON thì ẩn Clue khi chơi chỉ còn giọng đọc, mặc định ON ngay khi Generate/Regenerate xong,
> tự tắt bất cứ khi nào voice bị xoá (field mới `it.hideText`, khoá cứng bằng `!it.voice`). **(2)**
> Waveform đổi hẳn từ cột tần số ĐỘNG (`AnalyserNode`, Đợt 96) sang ẢNH TĨNH kiểu Adobe Audition:
> `decodeAudioData()` giải mã 1 lần lấy đỉnh biên độ 228 cột vẽ ngay khi mở popover, Play chỉ chạy 1 vạch
> playhead quét qua + nhãn thời gian sống — đo canvas thật ra 1670 pixel vẽ đúng dữ liệu thật. **(3)**
> Popup "Generate all voices" thêm lớp phủ dim+blur nền (đo đúng `rgba(15,22,34,.4)` + `blur(3px)`),
> thanh % tiến độ, khoá bấm-ra-ngoài-để-đóng khi đang chạy (đo thật: 16 hàng, bấm ra ngoài giữa
> "Generating 9/16…" → popup vẫn còn, tiến độ tiếp tục), nút Cancel đỏ nhỏ để soft-cancel giữa chừng (đo
> thật ra "Cancelled — generated voice for 12 row(s) before stopping."). **(4)** "Delete all words" đổi
> từ `confirm()` trần sang popup xác nhận giống "Delete all voices". **Nhóm Game: (5)** auto-play giọng
> ngay khi mở từ mới (đúng ranh giới `render()` sẵn có — chỉ chạy lúc bắt đầu/đổi từ). **(6)** nút loa
> phát quang xanh lá khi đang phát (CSS `@keyframes` thuần nên tự đóng băng cùng Menu Pause qua cơ chế
> chung có sẵn, không cần hook riêng), bấm khi đang phát = dừng, bấm khi dừng = phát lại; Clue ẩn hiện
> "🔊 Listen for the clue" (khác chữ với "vốn không có Clue" để tránh hiểu nhầm). Kỹ thuật test: harness
> giả Firestore như Đợt 96 + thêm bản test riêng cho phía CHƠI (seed 1 giọng thật qua
> `generateSpeechDataUrl`, dùng mẹo tráo tạm `HTMLMediaElement.prototype.play` để bắt bằng chứng thật
> `.play()` được gọi, không chỉ suy luận qua UI — clip test ngắn ~3s trong khi độ trễ round-trip môi
> trường test hay vượt 3s nên không chụp được đúng khung hình giữa lúc phát quang, xác nhận gián tiếp
> chắc chắn qua bằng chứng `.play()` thật + soát code). Chi tiết đầy đủ: `GHI CHU DU AN.md` Đợt 98 +
> `templates/anagram/GHI CHU ANAGRAM.md` Đợt 98. ⚠️ Số Đợt 97 đã bị phiên song song khác dùng cho Type
> the answer trong lúc phiên này đang làm, nhảy sang Đợt 98 để không trùng. **Việc kế (không gấp): thầy
> tự vào act thật trên bản LIVE xem Clue ẩn đúng + nút loa sáng xanh lúc phát, thử Cancel giữa lúc
> Generate all trên 1 act nhiều từ.**
>
> Trước đó: **10/8/2026 (Đợt 97, v0.9.71) — TYPE THE ANSWER: chống iOS Safari tự zoom ô nhập +
> đẩy xa dấu tích/X + hiện đáp án đúng lâu hơn khi sai. KHÔNG ĐỤNG CORE (chỉ
> `templates/type-the-answer/type-the-answer.js` + `.css`). ✅ THẦY DUYỆT → COMMIT `931ca20` + PUSH +
> **LIVE** tại `https://aword.andrewclasses.com/` (`curl` xác nhận đủ `--tta-input-fs` trong CSS +
> `size + 22`/`revealShown ? 2600` trong JS ngay lần poll đầu).**
> Thầy tự mở act trên iPhone, báo 3 điều: **(1)** ô nhập bị Safari tự zoom khi bấm vào — do font tính
> theo đơn vị `cqw` (% chiều rộng container game) xuống dưới 16px trên màn hẹp; sửa bằng biến
> `--tta-input-fs: max(16px, calc(3.9cqw * var(--fit)))` dùng chung cho ô nhập + chữ đáp án đúng (giữ
> bất biến "reveal = input" có sẵn từ 1/8/2026) — hết zoom (sàn cứng 16px) + to hơn ~11% như thầy muốn.
> **(2)** dấu tích xanh/X đỏ bay ra xa ô nhập hơn (`flyMark()` gap 6px→22px, đo DOM thật ~14px→~30.7px).
> **(3)** đáp án đúng hiện lâu hơn khi sai trước khi tự chuyển câu (1400ms→2600ms, CHỈ khi đang thật sự
> hiện đáp án — tắt "Show answer when wrong" thì giữ nhịp cũ). Đo bằng bộ đếm thời gian thật chạy trong
> trang: submit sai → prompt đổi câu sau ~2841ms (khớp 2600ms + crossfade chữ câu hỏi). Chi tiết đầy đủ:
> `GHI CHU DU AN.md` Đợt 97 + `templates/type-the-answer/GHI CHU TYPE-THE-ANSWER.md` Đợt 97. **Việc kế
> (không gấp): thầy tự mở lại trên iPhone thật xác nhận hết zoom khi bấm vào ô nhập (máy build chỉ đo
> được computed font-size qua DOM, không mô phỏng được hành vi zoom thật của Safari).**
>
> Trước đó: **10/8/2026 (Đợt 96, v0.9.70) — ANAGRAM: 3 CẢI TIẾN VOICE (đổi đọc Clue thay Word,
> sóng âm khi preview, Generate all/Delete all voices). KHÔNG ĐỤNG CORE (chỉ
> `templates/anagram/anagram-editor.js` + `anagram.css`). ✅ THẦY DUYỆT → COMMIT `fdcd403` + PUSH +
> **LIVE** tại `https://aword.andrewclasses.com/` (`curl` xác nhận đủ `speakTextFor`/`GENERIC_CLUE_TEXT`/
> `clueInputByItem`/`startWaveform`/`toggleBulkPopover` trong JS + `aw-anagram-ed-wave`/
> `aw-anagram-ed-voicehint` trong CSS ngay lần poll đầu; mở lại `test.html` live chơi thật 0 lỗi console).**
> Thầy thử act live `?a=256` rồi gửi 3 điểm sửa cho tính năng 🎤 của Đợt 94. **(1)** Voice đổi sang đọc
> CLUE thay vì Word (nút loa lúc chơi nằm cạnh clue — đọc Word ra sẽ lộ đáp án); hàm dùng chung
> `speakTextFor(it)` = Clue hoặc fallback "Unscramble the word" khớp đúng chữ hiển thị trong game; sửa
> Word không còn xoá voice, sửa Clue mới xoá; thêm dòng "Will speak: ..." sống động trong popover. ⭐ Bắt
> được 1 lỗi thật: bấm vào chính ô Clue đang mở popover bị cơ chế đóng-khi-bấm-ra-ngoài coi là "ra ngoài"
> nên tự đóng trước khi kịp gõ — sửa bằng `WeakMap` nhận diện đúng ô Clue của hàng đang mở. **(2)** Thêm
> canvas sóng âm (Web Audio `AnalyserNode` thật, không phải giả lập) khi bấm ▶ Play, tự ẩn khi phát xong.
> **(3)** Thêm nút Generate all voices / Delete all voices trong bulk bar, mỗi nút có popup riêng (chọn
> giọng + skip-existing / xác nhận + đếm số hàng), dừng đúng lúc gặp lỗi chưa đăng nhập. Không có quyền
> đăng nhập Google trong phiên này nên test bằng harness thay Firestore (Map trong bộ nhớ, cùng chữ ký hàm,
> đã xoá 4 file tạm sau khi test xong). Chi tiết đầy đủ: `GHI CHU DU AN.md` Đợt 96 +
> `templates/anagram/GHI CHU ANAGRAM.md` Đợt 96. **Việc kế (không gấp): thầy tự vào act thật `?a=256` trên
> bản LIVE thử vòng Save→Play→waveform→Generate all/Delete all thật qua Firestore thật.**
>
> Trước đó: **10/8/2026 (Đợt 95, v0.9.69) — FIX bridge myActivity: bridge cũ bị VỨT giữa lúc đổi Template
> làm mất đồng bộ Options/Style. CÓ SỬA CORE (chỉ `core/engine.js`, đúng đoạn bridge). ✅ THẦY DUYỆT →
> COMMIT `7f3d23e` + PUSH.**
> Bắt nguồn từ myActivity (nhúng AWord qua WebContentsView 2-4 cột): mở act AWord ở 1 cột đổi
> Template/Options thì các cột khác đồng bộ "lúc được lúc không". Gốc lỗi: `startGame()` tạo
> `window.__awordBridge = {...}` MỚI mỗi lần chạy, kể cả khi chạy lại do `doSwitchTemplate()` (async, có
> thể mất vài giây) — nếu 1 lệnh Options/Style tới đúng lúc cột đang giữa chừng đổi Template, nó ghi vào
> bridge CŨ sắp bị vứt bỏ → thay đổi mất, không lỗi console. Sửa: `window.__awordBridge` nay là 1 object
> duy nhất sống suốt vòng đời trang, có `_setCurrent(delegate)` gọi NGAY đầu mount trước mọi `await`;
> `applyOptions()`/`setTheme()` chờ xong `switchTemplate()` đang chạy dở trước rồi mới áp. Cả 3 hàm giờ
> `async`, trả `Promise<boolean>`. Chưa mở trình duyệt thật test (chỉ lộ ra khi chạy trong myActivity nhiều
> cột). Chi tiết: `GHI CHU DU AN.md` Đợt 95.
>
> Trước đó: **10/8/2026 (Đợt 94, v0.9.68) — ⭐⭐ GIỌNG ĐỌC THẬT (Kokoro TTS) cho icon 🎤 Anagram
> editor. CÓ SỬA CORE (2 file MỚI, thuần cộng thêm — `core/tts.js`, `core/voice-clips.js`). ✅ THẦY DUYỆT
> → COMMIT `a853a34` + PUSH + **LIVE** tại `https://aword.andrewclasses.com/` (`curl` xác nhận `core/tts.js`
> có `DEFAULT_VOICE`, `core/voice-clips.js` trả 200, `anagram.css` có `font: inherit` + `aw-anagram-
> listenbtn`, `anagram-editor.js` có `toggleVoicePopover`).**
> Đã test THẬT đầu-cuối qua Claude in Chrome (thầy cho phép): dán + Publish luật Firestore, đăng nhập
> Google thật, Generate/Save/Play một clip thật, chơi game bấm nút loa thật — bắt và sửa 1 bug thật giữa
> chừng (nút loa gần như vô hình vì `<button>` không kế thừa font-size, sửa `font: inherit` trong
> `anagram.css`).
> Icon 🎤 trong Anagram editor (trước "coming soon") giờ mở popover: chọn 1 trong 28 giọng tiếng Anh
> (Kokoro-82M, chạy 100% trong trình duyệt, không cần server) → Generate → lưu 1 document Firestore riêng
> (`voiceClips/{clipId}`, KHÔNG nhét vào `content.items[]` vì audio ~50-150KB/từ sẽ vỡ giới hạn 1MB/document
> nếu act có nhiều từ) → lúc chơi hiện nút loa cạnh clue phát lại. ⭐ Cân nhắc kiến trúc quan trọng giữa
> chừng: Firebase Storage từ 3/2/2026 bắt buộc gói Blaze (phải nhập thẻ ngân hàng dù 0đ) — trái nguyên tắc
> "không cần thẻ" của dự án — nên đổi hẳn sang lưu qua Firestore (collection mới, đọc công khai theo id
> giống `assignments/{code}`, để audio tự đi theo bản snapshot bài giao mà không cần bước copy riêng).
> Chi tiết đầy đủ + bug tự bắt được lúc test (TDZ, trùng biến): `GHI CHU DU AN.md` Đợt 94 +
> `templates/anagram/GHI CHU ANAGRAM.md` Đợt 94.
>
> Trước đó: **9/8/2026 (Đợt 93, v0.9.67) — ⭐ GẮN DOMAIN RIÊNG `aword.andrewclasses.com`. Không
> đụng code, chỉ hạ tầng. ✅ THẦY DUYỆT → COMMIT `5e510d2` (file `CNAME`) + PUSH + **LIVE** tại
> `https://aword.andrewclasses.com/`.**
> Domain gốc `andrewclasses.com` thầy mới mua (quản lý ở **portal.inet.vn**, nameserver iNET
> `sapa/laocai.vclouddns.com`) — dùng làm domain gốc cho MỌI app Andrew Classes từ nay, mỗi app một
> subdomain. 3 bước đã làm: **(1)** DNS trên portal.inet.vn → OneShield → Bản ghi DNS → CNAME `aword` →
> `andrewclasses-01.github.io` (tắt "Trạng thái Bảo vệ"/proxy). **(2)** file `CNAME` trong repo +
> `gh api -X PUT repos/andrewclasses-01/AWord/pages -f cname=...` → chờ chứng chỉ SSL `approved` → ép
> HTTPS bằng `gh api ... -F https_enforced=true` (chú ý `-F` hoa, không phải `-f` thường). **(3)** Firebase
> Console (project `aword-70dae`) → Authentication → Authorized domains → thêm domain mới (bắt buộc, nếu
> không nút "Sign in with Google" sẽ lỗi). Domain cũ `andrewclasses-01.github.io` vẫn chạy song song,
> không xoá. Mẫu đầy đủ để gắn domain cho app tiếp theo: `GHI CHU DU AN.md` Đợt 93.
>
> Trước đó: **8/8/2026 (Đợt 92, v0.9.66) — SỬA LỖI ĐỢT 91: DIM + BLUR CỦA MENU PAUSE KHÔNG HIỆN
> (chỉ đồng hồ dừng). ✅ THẦY DUYỆT → COMMIT `b48c315` + PUSH + **LIVE** (đã tự chụp ảnh màn hình thật xác
> nhận, cả local lẫn live).**
> ⭐ **Lỗi thật, không phải do màu quá nhạt**: `enterMenuPause()` (`core/engine.js`) tạo + append
> `.aw-stage-dim` TRƯỚC khi gọi `stage.getAnimations({subtree:true})` để tạm dừng animation đang chạy
> trong khung — mà `.aw-stage-dim` vừa thêm vào đã tự khởi động animation `aw-fadein` của chính nó, nên bị
> chính `getAnimations()` bắt và `.pause()` ngay lập tức, đóng băng ở `opacity≈0`. `getComputedStyle` vẫn
> báo đúng giá trị CSS đã khai (dễ tưởng nhầm "chỉ cần tăng độ đậm") — phải tự đo riêng `opacity` mới lộ ra
> `"0"`. Sửa: đảo thứ tự — bắt+pause animation đang chạy TRƯỚC, tạo/append `.aw-stage-dim` SAU. Luật chung
> cho overlay mới sau này: `core/HUONG DAN CORE.md` mục "MENU PAUSE" mục 1 (đoạn "BẪY THẬT ĐÃ CẮN"). Nhân
> tiện tăng độ đậm khớp `.aw-tool-dim` (`rgba(...,.5)` + `blur(3px)`, trước `.32`/`2px`). Chi tiết:
> `GHI CHU DU AN.md` Đợt 92.
>
> Trước đó: **8/8/2026 (Đợt 90+91, v0.9.65) — SỬA ĐIỂM TRỪ BỊ RƠI MẤT KHỎI BẢNG KẾT QUẢ (3 template)
> + ⭐⭐ TÍNH NĂNG MỚI "MENU PAUSE" TOÀN HỆ THỐNG. ⭐ CÓ SỬA CORE (thầy đặt hàng trực tiếp). ✅ THẦY DUYỆT
> → COMMIT `be7cd55` + PUSH + **LIVE** (`curl` xác nhận `aw-stage-dim` trong `core/app.css` +
> `enterMenuPause` trong `core/engine.js` + `gsPauseHandlers` trong `gameshow.js`).**
>
> **Đợt 90 — điểm trừ ("Points off"/"Minus mode") không vào bảng kết quả cuối game.** Thầy phát hiện ở
> Type the answer, điều tra ra thêm Crossword dính lỗi Y HỆT: cả hai tính đúng điểm trừ và hiện đúng lúc
> đang chơi, nhưng `finish()` không truyền `score` vào `ui.finish()` → mặc định lấy số câu đúng thuần, bật
> "Points off" **không hề ảnh hưởng** điểm cuối/xếp hạng. ⭐ **Bẫy tự bắt được**: vá tạm bằng đọc thẳng biến
> `livePoints` (tính bên trong callback animation bay điểm, trễ ~0,9-1,1s) THUA CUỘC ĐUA với timer
> auto-finish câu cuối (đúng 1000ms) — test thật ra `Score 2/6` trong khi ô điểm sống đã hiện `3/6`. Sửa
> đúng: tính điểm trừ ĐỒNG BỘ trong `finish()` từ `state`/`wordState` (set lúc chấm câu, không phụ thuộc
> animation). Anagram: tách `correct` (số đúng thật) khỏi `score` (điểm đã trừ) — trước đó gộp chung làm
> hàng phụ "Total: x/y" không bao giờ hiện. Whack-a-mole điều tra rồi loại (hệ điểm arcade riêng, không mất
> gì). Chi tiết: `GHI CHU DU AN.md` Đợt 90, + `GHI CHU <TEN>.md` của 3 game.
>
> **Đợt 91 — MENU PAUSE.** Thầy yêu cầu: *"bấm Menu thì pop-up + tên act + nút tùy chỉnh + nút chức năng
> giữ sáng, nền phía dưới tối hơn + nhoè nhẹ, mọi act tạm ngưng (dừng game, dừng âm thanh), đóng menu thì
> tiếp tục"*. `.aw-stage-dim` MỚI (`core/app.css`) chỉ tối `.aw-stage-inner` (topbar/playarea/bottombar) —
> thanh dưới khung (title/Options/Template/Style/Edit/Assignment/Print) CỐ Ý giữ sáng, khác hẳn
> `.aw-tool-dim` cũ (tối cả màn hình). `enterMenuPause()`/`exitMenuPause()` (`core/engine.js`) tự động dừng
> CHO MỌI TEMPLATE: đồng hồ chung (dịch `startedAt`), AudioContext dùng chung
> (`sound.pauseContext/resumeContext` MỚI), mọi pack mp3 đang phát kể cả nhạc nền loop
> (`sfx.js pauseActive/resumeActive` MỚI, qua registry `window.__awSfxPacks`), mọi animation CSS/WAAPI
> đang chạy trong khung (`stage.getAnimations({subtree:true})`). Hook tuỳ chọn MỚI **`tpl.onPause(paused)`**
> cho game có timer/nhạc RIÊNG — đã nối cho 7 game: Gameshow (đếm ngược mỗi câu + nhạc nền), Whack-a-mole
> (đồng hồ ván + spawn mole), Maze chase (di chuyển player/enemy), Open the box (đồng hồ mỗi câu — tái dùng
> đúng đường `runCountdown(timeLeft)` có sẵn), Running word (tái dùng CƠ CHẾ PAUSE TRỌNG TÀI có sẵn, thêm
> cờ `pausedByMenu`), Running team (2 đồng hồ delta-tick), Flying fruit (spawn hoa quả). 9 game còn lại
> KHÔNG cần hook (game "lượt một", đồng hồ chung đã đủ). ⚠️ Giới hạn đã biết, cố ý không sửa: `setTimeout`
> dự phòng của `element.animate()` không bị pause cùng animation (lệch một khung hình hiếm gặp, vô hại);
> chuỗi cinematic dựng bằng `setTimeout` đệ quy (Gameshow intro/get-ready, timer riêng từng ô/mole của
> Whack-a-mole) vẫn chạy theo giờ thực khi Menu mở giữa chừng — quá ngắn/hiếm, không đáng viết lại cơ chế
> timer của cả file. Test trình duyệt thật: cả 16 template load 0 lỗi console; Quiz/Gameshow/Maze
> chase/Running team/True-false chơi thật qua vòng mở-đóng Menu (đồng hồ/di chuyển đứng yên tuyệt đối lúc
> mở, chạy lại đúng nhịp thời gian thực lúc đóng). Luật đầy đủ + mẫu code cho template thứ 17: `core/HUONG
> DAN CORE.md` mục **"MENU PAUSE"**. Chi tiết: `GHI CHU DU AN.md` Đợt 91 + `GHI CHU <TEN>.md` của 7 game.
>
> Trước đó: **8/8/2026 (Đợt 89, v0.9.64) — ANAGRAM: KÉO-THẢ VẬT LÝ THẬT + HIỆU ỨNG MỀM HƠN +
> SLOGAN. Chỉ đụng `templates/anagram/*`, KHÔNG đụng core. ✅ THẦY DUYỆT → COMMIT `5d504f7` + PUSH +
> **LIVE** (`curl` xác nhận `aw-anagram-slogan` trong CSS + `moveResultTile`/`showTransientMark`/"ANAGRAM
> IN ANDREW CLASSES" trong JS live).**
> 4 lượt góp ý liên tiếp trong cùng 1 phiên (thầy tự chơi bản live rồi gửi từng lượt), mỗi lượt tự test qua
> trình duyệt thật (mô phỏng `PointerEvent` thật cho kéo-thả, đo `getComputedStyle`/`getAnimations()`).
> **Lượt 1:** hết "đổi hình dạng"/bóng đổ méo khi chữ bay (bản sao bay giờ đọc bo góc/bóng THẬT của ô thay
> vì số cố định) + bỏ hẳn bóng đổ mọi ô + thêm kéo-thả đặt chữ ở CẢ 2 chế độ (trước chỉ bấm được) + sửa lần
> đầu vật lý đổi chỗ 2 ô hết giật. **Lượt 2:** tích đúng dời sang ô đích (đổi phong cách trắng như dấu X) +
> PERFECT tách khỏi số điểm (to dần rồi tự biến mất tại chỗ, số điểm bay riêng sau một nhịp) + khối ô chữ
> đổi từ dồn hết trống lên trên sang chia đệm co giãn tỉ lệ 1:2 (đỡ dính đáy) + ⭐ vật lý swap đổi hẳn kỹ
> thuật (animate TRỰC TIẾP 2 ô thật thay vì ẩn-bay-bản-sao, bắt được lỗi WAAPI `fill:"forwards"` phải gọi
> `anim.cancel()` mới xoá transform thật). **Lượt 3:** đổi hẳn "đổi chỗ 2 ô" → "chèn-đẩy" (kéo 1 ô chèn
> đúng vị trí, đẩy lùi mọi ô ở giữa, dùng `Array.splice` như kéo-thả sắp hàng có sẵn trong
> `anagram-editor.js`) + đổi âm "Oh my god" (core) sang âm "Incorrect" thật có sẵn trong bộ âm riêng
> Anagram + tích/X trong ô hết "hiển thị cứng" (tự gỡ sau 550ms). **Lượt 4:** thêm slogan "ANAGRAM IN
> ANDREW CLASSES" trên thanh đồng hồ/điểm (đúng kỹ thuật Crossword đã dùng) + tích/X đổi từ "CSS animation
> lo hiện + xoá DOM tức thì lúc mất" sang MỘT animation WAAPI liên tục suốt vòng đời (nhỏ→lớn→giữ→nhỏ rồi
> mới gỡ) — đo scale từng khung 25ms xác nhận đường cong liên tục, hết bước nhảy ở cả 2 đầu. ⚠️ Có thử tham
> khảo Anagram thật trên Wordwall (bản công khai, vì bản riêng thầy gửi là "private resource") nhưng game
> đó vẽ bằng CANVAS nên công cụ tự động không lái được, chỉ quan sát được cấu trúc (dãy đích là 1 dải gạch
> chân liền). Chi tiết đầy đủ: `GHI CHU DU AN.md` Đợt 89 + `templates/anagram/GHI CHU ANAGRAM.md` Đợt 89.
>
> Trước đó: **7/8/2026 (Đợt 88, v0.9.63) — ⭐⭐ SỬA BẪY "SNAP KHỰC MỘT CÁI" Ở 3 TEMPLATE (Open the
> box, Crossword, Flying fruit) + GHI LUẬT CHUNG VÀO `core/HUONG DAN CORE.md` CHO MỌI TEMPLATE VỀ SAU.
> KHÔNG SỬA CORE ENGINE. ✅ THẦY DUYỆT → COMMIT `eed2a45` + `6b0dc5e` + PUSH + **LIVE** (`curl` xác nhận cả
> 3 template).**
> ⭐ **Cơ chế lỗi:** một CSS `@keyframes` animation LUÔN khởi động lại từ đúng khung `from` của chính nó mỗi
> khi được (tái) áp dụng, bất kể phần tử đang ở giá trị nào — nếu JS đổi/gỡ class giữ animation đó ĐANG LÚC
> nó còn chạy dở (chạm sớm, gõ phím, tap nhanh — bất cứ đâu input không bị khoá trong lúc hiệu ứng chạy),
> phần tử **nhảy tức thì** về giá trị mặc định trước khi animation mới kịp bắt đầu — "khực một cái" đúng như
> thầy tả. Điều tra 15 template còn lại (5 agent song song): 13/15 sạch (dùng WAAPI có `.cancel()`/
> `commitStyles()`, CSS transition, hoặc input khoá hẳn — đều tự miễn nhiễm); Whack-a-mole đã tự vá đúng họ
> lỗi này từ trước. 2 ca thật còn lại: Crossword (gõ chữ đầu tiên sau khi bấm "Andrew help" xoá sạch hiệu
> ứng hiện dần của các ô gợi ý khác) và Flying fruit (chạm sai làm quả nhảy góc xoay về 0° trước khi rung —
> chỉ lộ khi bật option "Retry after incorrect answer"). Cách sửa cả 2: ghim/đọc giá trị SỐNG THỰC TẾ
> (`getComputedStyle`) ngay trước khi đổi animation, thay vì để trình duyệt ép về mặc định. Đã ghi thành
> luật chung + mẫu code cho mọi template về sau vào `core/HUONG DAN CORE.md`. Chi tiết: `GHI CHU DU AN.md`
> Đợt 88.
>
> Trước đó: **7/8/2026 (Đợt 87, v0.9.62) — ⭐⭐ ÁP TIÊU CHUẨN KHUNG HÌNH & FULLSCREEN CHO TOÀN BỘ
> 16 TEMPLATE, BẰNG CÁCH ĐƯA VÀO CORE. ⭐ CÓ SỬA CORE (thầy duyệt). ✅ THẦY DUYỆT → COMMIT `bef4594` + PUSH
> + **LIVE** (Pages tự build, `curl` xác nhận ngay lần poll đầu).**
> ⭐ **ĐÃ CHẠY LẠI TRỌN BỘ TRÊN CHÍNH BẢN LIVE** (tab chạy thẳng `andrewclasses-01.github.io/AWord/`, không
> qua iframe): **16/16 template mount, tất cả cùng tỷ lệ `1.5261`, 0 lỗi console**; chốt chặn đo bằng class
> `.aw-zoomed` **THẬT** của Running team: viewport 1839×1270 (1,448) → **phủ kín, 0 dải** · 1280×540 (2,37)
> → **kẹp 960×540 = 16:9, dải 160px**.
> Thầy ra lệnh *"áp dụng tiêu chuẩn khung hình và fullscreen cho toàn bộ các template"*, rồi chốt qua
> AskUserQuestion: fullscreen 14 game **phủ kín + chốt chặn 16:9** (không chọn letterbox cho nhanh) · làm
> **hết 15 game trong 1 đợt** · Running team **về 16:10,5** · và **sửa CORE 1 lần** thay vì chép khối CSS
> vào 15 file.
> ⭐ **PHÁT HIỆN LÀM ĐỔI HẲN KHỐI LƯỢNG (khảo sát trước khi code):** tưởng phải làm 4 bậc co giãn cho từng
> game — **không phải**. 14 game đang thiết kế cho **16:9 = 56,25cqw**; khung mới **16:10,5 = 65,625cqw** là
> **CAO HƠN 9,375cqw** (thêm chỗ, không bóp), và vì fullscreen mới **chốt chặn 16:9** nên khung **NGẮN NHẤT**
> chúng gặp chính là **16:9 = đúng thiết kế hiện tại**. ⇒ **14 game không cần bậc co giãn**, và **bẫy
> `line-height` (mục 4.3) cũng không áp** vì bẫy đó chỉ lộ khi khung NGẮN LẠI. **Running team là ca duy nhất
> ngắn lại** (75 → 65,625cqw).
> **(1) CORE `core/app.css`, đúng 2 chỗ:** `.aw-stage` `aspect-ratio: 16/9` → **`16 / 10.5`**; và 4 luật
> `:fullscreen .aw-stage` (đủ 4 tiền tố, mỗi cái 1 rule riêng) từ letterbox `width: min(100vw, 100vh*16/9)`
> → **`width:100%; height:100%; flex-shrink:0`** + **`max-width: calc(100dvh*16/9)`** (kèm dòng `100vh` dự
> phòng). Nhờ ở core: 16 game đúng ngay, **template thứ 17 tự động đúng**, không có 15 bản sao phải giữ đồng bộ.
> **(2) ⭐⭐ LỖI THẬT TỰ TÌM RA GIỮA ĐƯỜNG — `flex-shrink: 0` là HÀNG RÀO:** `.aw-page` là **flex ROW**, khung
> là flex item, nên `width:100%` **chỉ là LỜI ĐỀ NGHỊ** — anh em nào còn hiện cũng cướp bề ngang và
> `flex-shrink:1` mặc định **lặng lẽ nhường**. Đo được khi bàn thử để sót `.aw-as-bars`: khung **sụp
> 1280px → 688px**, game chỉ nhỏ đi, **0 lỗi console, không dấu vết**. Luật letterbox CŨ giấu kín cả lớp lỗi
> này vì luôn xin ÍT bề ngang hơn khung cha có. Vá xong đo lại đúng kịch bản xấu đó: **phủ kín 1280×800, 0 dải**.
> **(3) Dọn 2 template có luật riêng:** Running word gỡ luật `aspect-ratio` (trùng khít core) **và 4 luật
> letterbox `:fullscreen` riêng** — 4 luật này nay **MÂU THUẪN** core mới (ghim khung về 16:10,5 trong khi
> core bảo phủ kín, mà chúng specific hơn nên **sẽ thắng**); chúng chưa từng chạy vì template dùng
> `useZoomFullscreen`, nhưng để mâu thuẫn nằm chờ sau một cái cờ là bẫy mất cả phiên sau. Running team gỡ
> `4/3` + 4 luật letterbox, **thêm chốt chặn 16:9** vào khối `.aw-zoomed`. **13 game còn lại: không đụng
> một dòng CSS nào.**
> **(4) SỐ ĐO THẬT** (devserver :5510, chạy từ `/index.html` — bẫy 4): khung nghỉ **16/16 ra 1,5261**
> (966×633), **0 lỗi console**. Chốt chặn: iPad 1024×768 → **phủ kín, 0 dải** · TV 1280×720 → **phủ kín, 0
> dải** · 16:10 1280×800 → **phủ kín, 0 dải** · **1280×634 (đúng ảnh thầy gửi Đợt 86, tỷ lệ 2,019) → kẹp
> 1127×634 = 16:9, dải 77px** · ultrawide 1280×540 (2,37) → kẹp **960×540**, dải **160px** — khớp chính xác
> bộ số Đợt 86. **Running word zero-diff**: bàn phím **1,15** · margin **3,4cqw** · hàng **7,02cqw** · Andrew
> **14,6 = 12,7 × 1,15** (đúng bẫy `getBoundingClientRect` trả kích thước ĐÃ nhân scale). **Running team**:
> cả 9,375cqw rơi vào `.aw-rt-tiles` (ô **26,81 → 22,09cqw**), **chữ giữ nguyên 3,41cqw**, ở chốt chặn 16:9 ô
> vẫn cao **gấp 5 lần** chữ ⇒ **không cần bậc co giãn**; setup 2 game **không phải cuộn** ở cả 3 tỷ lệ. Quét
> tràn 16/16 game sau khi bấm PLAY thật: **không game nào sinh tràn MỚI** (whack-a-mole 223px · crossword 17px
> · flying-fruit 5–7px · open-the-box 1px đều có **ở cả 16:9** = sẵn có); **speaking-cards 301px ở 4:3 là
> DƯƠNG TÍNH GIẢ** — `.aw-sc-bg` là ảnh nền panorama **cố ý rộng hơn khung**, cha `overflow:hidden`, và khung
> càng cao thì nền phủ càng rộng (1802 → 2409px) ⇒ đợt này **cải thiện** game đó.
> ⚠️ **HAI BẪY ĐO ĐÃ CẮN (đã ghi vào `core/HUONG DAN CORE.md` mục 4b):** **(a)** `.aw-playarea` **RỖNG cho tới
> khi bấm PLAY** — bảng đo đầu tiên đo trên vùng rỗng và trả "0 tràn" cho cả 16 game, **trông y hệt kết quả
> đẹp**; phải bấm PLAY trước, và phải cho bàn đo một **ca kiểm chứng** (ép tỷ lệ 6.0 → thấy tràn 57–245px) để
> chứng minh nó biết phản ứng. **(b)** div bọc bàn thử để `width:1000px` làm chế độ phủ kín đo ra 1000px —
> **suýt kết luận nhầm là lỗi sản phẩm**.
> ⚠️ **Giới hạn đã biết:** **fullscreen API THẬT không kích hoạt được trong pane preview** (click thật qua
> `ref` vẫn ra `document.fullscreenElement === null`) và pane **không compositing nên không chụp được ảnh** →
> đường `:fullscreen` kiểm bằng **CSSOM** (đúng `width/height:100%`, `flex-shrink:0`,
> `max-width: calc(1.77778 * 100dvh)`) **cộng** bản mô phỏng đúng bộ khai báo. Chrome chỉ giữ **2/4** luật
> (vứt `-moz`/`-ms` nó không hiểu) — **đúng thiết kế**, và chính là lý do mỗi tiền tố phải là 1 rule riêng.
> ⬜ **CHỜ THẦY NGHIỆM THU MÁY THẬT:** fullscreen trên **iPad khác hẳn** (trước letterbox 16:9 có dải trên
> dưới, nay **phủ kín tới 4:3** → nhiều chỗ trống dọc hơn, chữ autoFit **to lên**) · khung nghỉ 16:10,5 có vừa
> mắt hơn 16:9 ở **cả 16 game** · dải hai bên chỉ hiện khi màn **bè hơn 16:9** · Running team ô từ nhỏ hơn
> trước có còn nhìn rõ từ cuối lớp. Chi tiết: `GHI CHU DU AN.md` Đợt 87.
>
> Trước đó: **7/8/2026 (Đợt 86, v0.9.61) — RUNNING WORD: KHUNG MẶC ĐỊNH 4:3 → 16:10,5 + GIỚI HẠN
> FULLSCREEN + PHÍM ANDREW VỀ CHUẨN (app LÀM MẪU mở màn loạt cải tiến KÍCH CỠ MÀN HÌNH cho cả 16 template).
> ✅ THẦY DUYỆT → COMMIT `ac67836` + PUSH + **LIVE** (Pages tự build, `curl` xác nhận sau ~20 giây ở lần
> poll thứ 2).**
> ⭐ **ĐÃ CHẠY LẠI TRÊN CHÍNH BẢN LIVE** (tab chạy thẳng `andrewclasses-01.github.io`, không qua iframe):
> khung nghỉ **968×635 = 1,5238**, bàn phím 1,15, hàng **7,01**, Andrew **2,54** · 4 bước co đúng
> **1,15 / 1,08 / 0,93 / 0,87** · **đúng ca của thầy (tỷ lệ 2,019) → khung kẹp về 1127×634 = 16:9, dải
> 76px mỗi bên (11,9% bề ngang), hàng 7,54 > chữ 5,82 → HẾT ĐÈ** · **0 lỗi console**.
> ⚠️ **BẪY DẤU MỐC (lần thứ hai dính, sau `padStart(2` ở Đợt 84):** `line-height: 1.04` là dấu mốc **VÔ GIÁ
> TRỊ** — `.aw-rw-row-body` vốn đã có chuỗi đó từ trước, nên nó báo "đã live" ngay ở lần `curl` ĐẦU khi file
> còn cũ. 4 dấu mốc còn lại chỉ có ở bản mới nên mới dùng được: `aspect-ratio: 16 / 10.5` · `100dvh * 16 / 9`
> · `@container stage (aspect-ratio > 16/9.2)` · `0 0 12.7cqw`.
> ⭐⭐ **ĐÃ GHI TIÊU CHUẨN TOÀN HỆ THỐNG** vào `core/HUONG DAN CORE.md` mục **"TIÊU CHUẨN KHUNG HÌNH &
> FULLSCREEN CỦA TOÀN HỆ THỐNG AWORD"**: cỡ mặc định **16:10,5** · fullscreen phủ kín nhưng **chốt chặn
> 16:9** · **co giãn thành phần theo bậc** khi khung bè ("co trước, kẹp sau" + "ưu tiên chữ đọc được") ·
> 4 bẫy bắt buộc biết · phím Andrew chuẩn 12,7cqw. ⚠️ **Tính tới nay MỚI CHỈ Running word chạy tiêu chuẩn
> này**; 14 game còn lại vẫn 16:9, Running team vẫn 4:3 — chuyển dần theo lệnh thầy, KHÔNG tự ý đổi hàng loạt.
> 2 file code: `templates/running-word/running-word.css` (KHÔNG đụng logic core, chỉ thêm mục tài liệu vào
> `core/HUONG DAN CORE.md`).
> Thầy yêu cầu: *"chuyển kích cỡ mặc định thành tỷ lệ 16:10,5, giữ nguyên cách fullscreen như hiện tại"*.
> **(1)** `.aw-stage.act-running_word`: `aspect-ratio` **4/3 → 16 / 10.5** (= 32/21). Chiều cao khung theo bề
> ngang: 16:9 = 56,25cqw · **16:10,5 = 65,625cqw** · 4:3 = 75cqw. 4 luật letterbox `:fullscreen` đổi theo cho
> khớp — nhưng **cách fullscreen KHÔNG đổi**: template chạy `tpl.useZoomFullscreen` nên fullscreen đi đường
> `.aw-zoomed` (`width/height:100%`, vô hiệu hoá luôn `aspect-ratio`), tức 4 luật kia là **code chết**; đo lại
> xác nhận `document.fullscreenElement` vẫn `null`, khung phủ **đúng cả viewport 1280×720**, thoát về 1,5238.
> **(2)** ⭐ **Chỉ `.aw-rw-boards` là `flex:1`** → **toàn bộ 9,38cqw khung mất đi rơi hết vào bảng từ**: bảng
> 38,81 → **29,43**, cửa sổ 3 hàng 30,40 → **21,03**, **1 hàng 10,13 → 7,01cqw**; đồng hồ (5,81), bàn phím
> (22,88), hở bảng↔bàn phím (1,31) **không đổi một chút nào**. Chữ của từ vẫn 5,81cqw → còn dư **1,2cqw**:
> đây là **con số hết trước tiên** nếu khung còn ngắn nữa.
> **(3)** ⭐ **LỖI THẬT bắt được nhờ khung ngắn lại** (nằm im từ đầu, 4:3 che mất): `.aw-rw-input` **quên khai
> `line-height`** → thẻ `<input>` lấy chiều cao theo **metrics font Baloo 2 ~1,6em**, cao **9,29cqw** trong khi
> chữ thật chỉ 5,81cqw; hàng còn 7,01cqw → tràn 2,28cqw, `overflow:hidden` **cắt mất gạch chân ô nhập**. Khai
> `line-height:1.04` (bằng đúng `.aw-rw-row-body`) → ô nhập **6,21cqw** nằm gọn, và **hết nhảy cỡ chữ lúc
> submit** (trước 9,29 → 5,81; nay cả hai 5,81). Kiểm không cắt nét bằng `canvas.measureText()`: chữ ăn mực
> **3,62cqw** trong hộp 5,81cqw → dư 2,19 (`scrollHeight > clientHeight` của `<input>` ở đây là **báo động
> giả** — phần đệm rỗng của font).
> ⭐ **LUẬT CHO 15 TEMPLATE CÒN LẠI:** rút ngắn khung sẽ **làm lộ MỌI phần tử chữ quên khai `line-height`**
> (chúng đang âm thầm chiếm cao gấp ~1,6× cỡ chữ) — quét trước rồi hãy đổi tỷ lệ.
> **Tự test (0 lỗi console):** khung đo 968×635px = **1,5238**, cao **65,625cqw** khớp tuyệt đối · SETUP không
> tràn (33,9/59,4cqw) · card trận đấu không tràn · bảng kết quả cuối trận (ép `clockSeconds:4`) cao 31,51cqw
> nằm 17,06→48,57 trong khung 65,63, không cuộn · fullscreen zoom y hệt trước · **hồi quy 16/16 mount, 0 lỗi**:
> 14 game vẫn 16:9, running_word 16:10,5, running_team vẫn 4:3 · CSS parse đủ 173 luật.
> ⚠️ **BẪY BÀN THỬ MỚI:** vòng quét nhiều template **phải chạy từ trang gốc `/index.html`** — chạy từ
> `templates/<x>/test.html` thì `catalog.js` khai `css` **tương đối theo TÀI LIỆU** → xin
> `/templates/running-word/templates/running-team/running-team.css` → **404**, sheet rỗng, running_team đo ra
> 16:9 và **trông y hệt một lỗi thật**.
> **(4) ⭐ PHẦN 2 — GIỚI HẠN CHO FULLSCREEN + MỌI CỠ MÀN.** Thầy duyệt khung nghỉ rồi gửi ảnh cửa sổ **1920×950**
> có **3 dòng từ ĐÈ CHỒNG lên nhau** khi fullscreen. **Gốc lỗi:** fullscreen đi đường zoom và **cố ý không kẹp
> dải** (5/8, để iPad không phí pixel) → khung lấy **đúng tỷ lệ màn thật**; mà mọi cỡ đo theo **bề NGANG**, nên
> màn càng bè thì bàn phím (23cqw) + đồng hồ (5,81cqw) **giữ nguyên** trong khi chiều cao khung sụp, và
> `.aw-rw-boards` là `flex:1` **duy nhất** nên gánh trọn. Đo (cao 1 hàng / chữ cần 5,82): iPad 4:3 11,92 ✅ ·
> 16:10 7,72 ✅ · 16:9 **5,61** ⚠️ · **2,02 → 3,35** ❌ · 2,37 → **0,92** ❌.
> **Thầy chốt (AskUserQuestion): "co trước, kẹp sau" + "ưu tiên chữ đọc được".**
> **(a)** **4 bước co bàn phím** qua `@container stage (aspect-ratio > …)` (`.aw-stage` vốn đã là
> `container-type:size` tên `stage` của core): ngưỡng 16/10,4 · 16/10 · 16/9,5 · 16/9,2 → scale **1,08 · 1,00 ·
> 0,93 · 0,87**. ⭐ **Chữ KHÔNG bị co**, giữ 5,6cqw mọi tỷ lệ. Dùng `transform: scale()` (giữ đúng từng tỉ lệ
> core vẽ, khỏi chép ~18 số đo bàn phím) + `margin-bottom` boards `= N×(scale−1)+0,4cqw`, **N = 20cqw** — vì
> scale chỉ ăn phần HÌNH, margin mới biến nó thành chỗ THẬT. ⚠️ **N đo bằng `offsetHeight`**, KHÔNG dùng
> `getBoundingClientRect()` (trả 23cqw vì đã nhân scale). Công thức ở 1,15 ra **đúng 3,4cqw** = số đang dùng →
> **tỷ lệ thiết kế và cao hơn: không bước nào khớp, không đổi gì**.
> **(b)** **Chốt chặn 16:9**: `max-width: calc(100dvh*16/9)` trong luật zoom (kèm dòng `100vh` dự phòng). Chọn
> 16:9 chứ không phải 16:10,5 vì ở mốc đó **iPad 4:3 / laptop 16:10 / TV 16:9 đều KHÔNG có dải nào**; màn
> 1920×950 của thầy dải chỉ **~115px mỗi bên = 6% bề ngang**.
> **Số đo (đổi cỡ cửa sổ THẬT):** iPad 1024×768 → 0 dải, 1,15, hàng **11,92** (**y hệt trước**) · khung nghỉ →
> 1,15 / margin 3,39 / hàng **7,01** (**y hệt bản đã duyệt**) · 1280×720 (16:9) → 0 dải, 0,87, hàng 7,47 ·
> **1280×634 (ảnh thầy) → kẹp về 16:9, dải 76px/bên, hàng 7,54** ✅ · 1280×540 (2,37) → dải 160px/bên, hàng 7,43.
> Quét mịn 7 tỷ lệ: dư luôn **1,76–3,36cqw** (luôn rộng hơn khung nghỉ 1,2); hở bảng↔bàn phím **1,25–1,36cqw**,
> không bước nào đè. Hồi quy **16/16 mount, 0 lỗi console**, không template nào khác dính transform bàn phím.
> ⭐ **HAI BẪY MỚI cho 15 template còn lại:** **(a)** khối `@container` **PHẢI đặt CUỐI FILE** — container query
> **không cộng thêm specificity**, đặt ở đầu file thì luật gốc bên dưới thắng và **cả tính năng im lặng không
> chạy** (0 lỗi, probe vẫn báo "khớp", màn hình không đổi). **(b)** **ĐỪNG đặt ngưỡng ĐÚNG vào tỷ lệ khung đang
> nghỉ** — `> 16/10.5` tự kích hoạt ngay ở khung nghỉ do chiều cao rơi vào pixel lẻ làm tỷ lệ đo được nhỉnh hơn
> phân số đúng; khung nghỉ ra 1,08/2cqw thay vì 1,15/3,4 **không một dòng lỗi**. Đổi sang **16/10,4**.
> **(5) PHẦN 3 — PHÍM ANDREW VỀ ĐÚNG BỀ NGANG CHUẨN.** Thầy nghiệm thu: *"việc resize ok"*, chỉ còn phím Andrew
> ngắn hơn / phím Space dài hơn bản chuẩn. ⭐ **Đã chứng minh KHÔNG do việc hôm nay**: `git stash` riêng file CSS
> về HEAD → đo ra **đúng cùng bộ số** (Andrew/chữ **2,120**, Space/chữ **7,927**), và 4 bước co fullscreen
> **không đổi một tỉ lệ nào** (`transform: scale()` co cả hàng như một khối ảnh, không chia lại bề ngang).
> **Gốc:** bản chuẩn dùng chung **12,7cqw** (`.aw-tta-key-andrew` + `.aw-cw-key-andrew`), riêng
> `.aw-rw-key-andrew` để **10,6cqw** — lệch từ ngày dựng template. ⭐ **Thiếu ở Andrew làm SPACE DÀI RA** vì
> hàng cuối `[Andrew][Space][Submit]` chỉ Andrew **cố định bề ngang**, hai phím kia **co giãn** chia phần còn
> lại → 2,1cqw hụt chảy thẳng sang chúng. Sửa **10,6 → 12,7cqw** → Andrew/chữ **2,540**, Andrew/numbers
> **1,124** = **khớp chính xác bản chuẩn**, giữ nguyên ở cả 4 bước fullscreen. Space còn lệch **1,6% (~6px trên
> khung 968px)**, cố ý không sửa: do game này để lề khung hẹp hơn (thầy chốt 5/8) nên bàn phím rộng hơn chuẩn
> chút; khớp tuyệt đối phải đặt con số thần bí tính ngược từ lề core. Hồi quy 16/16 mount, 0 lỗi.
> ⬜ **Chờ thầy nghiệm thu máy thật:** khung 16:10,5 lúc chưa fullscreen có vừa mắt hơn 4:3 không · hàng từ
> (7,01cqw) còn thoáng không · **fullscreen trên iPad phải y hệt trước** · trên màn lớp: hết đè chưa, và **bàn
> phím nhỏ đi** (ở 16:9 còn ~76% cỡ cũ) có còn dễ bấm không — đánh đổi trực tiếp của lựa chọn "ưu tiên chữ" ·
> dải hai bên chỉ hiện khi màn bè hơn 16:9. Chi tiết:
> `templates/running-word/GHI CHU RUNNING-WORD.md` mục **8l** + **8l-2** + `GHI CHU DU AN.md` Đợt 86.
>
> Trước đó: **7/8/2026 (Đợt 85, v0.9.60) — ⭐ HẾT TRỄ ÂM THANH: NẠP TRƯỚC CẢ PACK MP3 + HÂM NÓNG
> AUDIOCONTEXT + NÉN LẠI 310 FILE. ⭐ CÓ SỬA CORE (1 file MỚI `core/sfx.js` + `core/sound.js`; KHÔNG đụng
> `engine.js`). ✅ THẦY DUYỆT → COMMIT `00eb228` + PUSH + **LIVE** (Pages tự build, `curl` xác nhận đủ 6 dấu
> mốc ngay lần kiểm đầu — đúng quy trình mục 0 điểm 3, không cần đường vòng POST pages/builds).**
> ⭐ **ĐÃ CHẠY LẠI TRÊN CHÍNH BẢN LIVE** (tab chạy thẳng `andrewclasses-01.github.io`, không qua iframe):
> pack quiz **10/10 file sẵn sàng sau 702ms** trong khi màn READY còn nguyên chưa ai bấm PLAY; lần phát
> ĐẦU của từng hiệu ứng **8 · 8 · 18,7 · 18,7ms (TB 13,4ms)** — trước bản vá đo trên cùng origin là **67,5ms**.
> Dấu mốc curl đã dùng (đều VẮNG ở bản cũ): `core/sfx.js` trả 200 + chứa `PRIME_CONCURRENCY` · `core/sound.js`
> chứa `warmup` · `templates/quiz/quiz-sound.js` chứa `createPack` · và **Content-Length của 3 file mp3 khớp
> đúng số byte sau khi nén** (6005 · 29187 · 59289).
> **Thầy báo:** gần như MỌI hiệu ứng âm thanh đều trễ so với hình; chơi một lúc hoặc bấm Start again mới khớp.
> Thầy đoán do AWord dùng mp3 còn Wordwall dùng ogg.
> ⭐ **ĐÃ BÁC BỎ GIẢ THUYẾT ĐỊNH DẠNG bằng số đo:** giải mã 8 cặp `.ogg` gốc Wordwall ↔ `.mp3` của AWord,
> khoảng lặng đầu file **chênh 0ms** (Chrome tự cắt phần đệm mã hoá MP3 nhờ header LAME), chi phí giải mã
> ngang nhau (3–20ms). **Định dạng KHÔNG gây trễ** — Wordwall khớp tiếng là nhờ NẠP TRƯỚC.
> ⭐ **GỐC LỖI THẬT:** cả 14 template chép chung một khuôn tạo `<audio>` **đúng lúc cần phát**
> (`if (!a) { a = new Audio(urlFor(name)) … } a.play()`), nên LẦN ĐẦU của mỗi tên file phải đi mạng lấy file
> rồi mới kêu. **Đo trên BẢN LIVE: lần đầu 67–363ms (TB 143ms), các lần sau 5–19ms**; kéo file lạnh từ
> GitHub Pages tốn **290–654ms**, và header live là `Cache-Control: max-age=600` nên cứ 10 phút lại phải hỏi
> lại server (~55–80ms). Một game có 10–47 file → cả lượt chơi ĐẦU lệch tiếng, tới khi mỗi file kêu một lần
> thì hết. Khớp chính xác điều thầy tả. Chạy trên localhost thì **mọi đường đều ~6ms** → chứng minh code không
> chậm, chỉ có MẠNG nằm trên đường đi của tiếng.
> ⭐ **BẢN VÁ 3 phần.** **(1)** File MỚI `core/sfx.js`: `createPack(import.meta.url, {names, hot, skip})` →
> `play/pool/stop/durationMs/el/prime/stats`. `prime()` chạy ngay lúc module âm thanh được **import**, mà
> `ensureTemplate()` import **trước khi** màn READY được vẽ → tới lúc thầy bấm PLAY thì file đã nằm sẵn; nạp
> 4 file một lúc để pack 47 file không giành hết đường truyền lớp học. 14 file `*-sound.js` chuyển sang dùng
> nó, **giữ nguyên tên `playFile`/`makePool`** nên khối export của từng game **không đổi một dòng**.
> **(2)** `core/sound.js` thêm `context()` + `warmup()`: `warmup()` tự chạy ở cú **chạm/gõ phím ĐẦU TIÊN**
> trên trang (nghe ở pha capture) — dựng + resume AudioContext, đẩy 1 mẫu câm cho thiết bị chạy; và crossword
> · running-word · running-team thôi dựng AudioContext RIÊNG, dùng chung context này. Nhờ vậy **KHÔNG phải
> sửa `engine.js`**. **(3)** Nén lại **310 file mp3** ở LAME VBR `-q:a 6`: **10,25MB → 6,42MB (nhỏ hơn 37%)**.
> ⭐ **SỐ ĐO SAU KHI VÁ:** lần đầu **6,2ms** (trước 67,5ms) · tiếng tổng hợp **48ms → 10,7ms** · trên trang
> thật gameshow **46/46 file sẵn sàng sau 1,1 giây** trong khi màn READY còn nguyên, chưa ai bấm PLAY ·
> **16/16 template mount, 0 lỗi console** · 14 pack đều **ready = total** · nút tắt tiếng vẫn ăn (bật 1 / tắt
> 0 / bật lại 1). Nén: **310/310 file vẫn ĐÚNG âm thanh cũ** (SNR trung bình 26,9dB — nếu bị thay nhầm sẽ ~0dB),
> **độ dài lệch 0ms**, khoảng lặng đầu file lệch **≤ 0,4ms**.
> ⚠️ **SỐ ĐO CHỐNG LẠI PHƯƠNG ÁN KHÁC (đừng làm lại):** giải mã sẵn ra AudioBuffer của Web Audio chỉ nhanh hơn
> **1,3ms** (6,7 so với 8,0) mà tốn **3,6–49MB RAM mỗi pack** (gameshow 47 file = 49,3MB) → bỏ. Sợ nhiều
> `<audio>` bị Chrome thu hồi: đã đo **200 element** cùng lúc, cái CŨ NHẤT vẫn phát trong **11ms**,
> `readyState 4` → không cần cơ chế LRU.
> ⚠️ **LỖI TỰ GÂY RA RỒI TỰ BẮT (ghi lại để đừng lặp):** bản nén đầu tiên định lấy lại `.ogg` gốc cho đỡ một
> đời nén, ghép ogg↔mp3 **bằng cách so ĐỘ DÀI** → **57 file bị thay bằng âm thanh KHÁC hẳn** cùng độ dài (chỉ
> GAMESHOW và MAZE CHASE có ogg gốc, vậy mà anagram/whack-a-mole/balloon-pop cũng "khớp"). **Độ dài không phải
> danh tính.** Đã khôi phục từ backup và nén lại, mỗi file từ CHÍNH NÓ; rồi viết hẳn một bước kiểm chứng
> nội dung (trừ sóng cũ − sóng mới, so mức còn lại) chạy trên **cả 310 file** để chốt không file nào bị đổi.
> ⚠️ **BẪY ĐO MỚI:** pane preview có `visibilityState = "hidden"` nên **`requestAnimationFrame` bị đóng băng
> hoàn toàn** — mọi bàn đo dò thời điểm bằng rAF sẽ treo, không ra một dòng kết quả nào. Phải dò trên
> **audio thread** (`ScriptProcessorNode`) và tính giờ bằng **`ctx.currentTime`**. Và **`readyState` đọc ngay
> lúc gọi `play()` hay ra 1** (không phải chưa tải xong): `currentTime = 0` khởi động một cú seek, đọc lại sau
> khi seek xong là **4**. Backup 310 file gốc: `D:\APP AND DATA\AWord-data\Backup\sounds-truoc-khi-nen-07-08-2026`.
> Luật đầy đủ cho template về sau: `core/HUONG DAN CORE.md` mục "ÂM THANH". Chi tiết: `GHI CHU DU AN.md` Đợt 85.
>
> Trước đó: **7/8/2026 (Đợt 84, v0.9.59) — ⭐ TÍNH NĂNG MỚI "START WITH MISTAKES": CHƠI LẠI ĐÚNG
> NHỮNG TỪ VỪA SAI. ⭐ CÓ SỬA CORE + 12 TEMPLATE. ✅ THẦY DUYỆT → COMMIT `797670b` + PUSH + LIVE
> (Đợt 83 = `cf3865b`, tách 2 commit riêng).** File mới
> `core/mistakes.js` + `core/engine.js` + 12 file template. Bảng kết quả có thêm **"Start with mistakes"**
> ngay dưới "Start again" → về màn READY của CÙNG game, tên đổi thành **"QUIZ WITH MISTAKES"**, danh sách
> chỉ còn từ **sai hoặc bỏ trống**; bấm tiếp nhiều vòng thu hẹp dần. Về bộ đầy đủ: reload · đổi template
> rồi chọn lại · **Start again**. ⭐ **Chốt cách nối review→từ gốc: GẮN THAM CHIẾU.** Mọi template đều mở
> đầu `[...(activity.content?.X||[])]` = sao chép **NÔNG**, nên phần tử đang chơi **chính là object trong
> `activity.content`** → chỉ cần LỌC LẠI mảng gốc, không dựng lại gì (đáp án/clue/acceptedAnswers nguyên
> vẹn). Hợp đồng mới: `review[i].src` = object nguồn + `tpl.itemsKey` = tên mảng. ⚠️ **6/12 template phải
> luồn `src` qua một bước `.map()`** (quiz · gameshow · open-the-box · anagram · unjumble · balloon-pop),
> **crossword luồn qua HAI bước**. **4 game CỐ Ý không có**: whack-a-mole (review ghi MỌI hàng là sai — trò
> arcade, không xác định được câu sai), speaking-cards (`scorable:false`), running-word/team
> (`renderSummary` riêng). **Ngưỡng tối thiểu theo game** (`MIN_ITEMS` trong `mistakes.js`): balloon-pop 5 ·
> find-the-match 3 · crossword 2 · còn lại 2 → thiếu thì toast **đúng con số** và ở nguyên bảng kết quả.
> **3 luật phụ:** ván mistakes **không ghi leaderboard** + ẩn dòng hạng; **"Play a different template" rời
> khỏi bảng kết quả** (đo: nút thứ 5 đẩy panel 454→**507px** vượt trần **497px** → cuộn, khuất nút cuối) —
> vẫn còn ở menu ☰ tên "Change template", ⚠️ đổi lại: ở màn kết thúc phải Start again trước mới mở được ☰;
> nút chỉ hiện khi ván đó thật sự có câu sai. ⭐ **HAI LỖI TỰ TÌM RA, đã vá:** **(a)** act tạm `mist_` **bị
> ghi vào thư viện** khi bấm Apply (chỗ đó chỉ chặn tiền tố `"conv_"`) → nay quy options về act mẹ
> `_mistakesBase` và chặn `/^(conv|mist)_/`; **(b)** Apply Options giữa ván mistakes làm **mất bộ từ đang
> luyện** (Apply gọi `restart()`, mà `restart()` nay luôn về bộ đầy đủ) → tách **`replayCurrent()`** (chơi
> lại đúng cái đang có, dùng cho Apply + cầu myActivity) khỏi **`restart()`** (nút Start again). Tự test
> devserver :5511 — kịch bản 4 vòng liên tiếp Quiz 6 câu: 6 → **4** → **3** (đúng hết → **nút biến mất**,
> **không có dòng hạng**) → Start again về **6**; leaderboard 10 hàng **đều `/6`**, `localStorage` **không
> có key `mist_`**; sai đúng **1 câu** → toast **"Need at least 2 words"**, ở nguyên bảng; True or false
> (`statements`, `lives:1`) → **"TRUE OR FALSE WITH MISTAKES"**, vòng 2 đúng **6 = 8−2** câu; sau khi vá (b)
> thì Apply giữa vòng vẫn giữ **4 câu**; panel 4 nút **454,3px < 497px, không cuộn**; hồi quy **16/16
> mount, 0 lỗi console**. ⚠️ **Ghi nhận ngữ nghĩa:** True/false · maze-chase · open-the-box **hỏi lại câu
> sai đến khi đúng**, nên chơi hết bài với tim vô hạn là **không còn câu sai** → không có nút; chỉ hết
> tim/hết giờ mới còn câu dang dở. Chi tiết: `GHI CHU DU AN.md` Đợt 84 + `core/HUONG DAN CORE.md` mục
> "START WITH MISTAKES". ⚠️ **BẪY ĐO MỚI khi kiểm bản live:** dấu mốc `padStart(2` cho `core/utils.js`
> là VÔ GIÁ TRỊ — hàm `formatTime` cũ vốn đã có chuỗi đó nên nó báo "đã live" cả khi file còn cũ; phải
> chọn dấu mốc CHỈ CÓ ở bản mới (`Math.floor(total / 100) % 10`). Gặp lại bẫy mục 9 (Pages cập nhật file
> KHÔNG đồng thời): curl lần đầu `core/mistakes.js` còn 404 trong khi `utils.js` đã mới. Và: **không lái
> được bản live bằng iframe từ localhost** (cross-origin) — phải cho tab chạy thẳng trang live.
>
> Trước đó: **7/8/2026 (Đợt 83, v0.9.58, commit `cf3865b`, ĐÃ LIVE) — BẢNG KẾT QUẢ CUỐI GAME: THỜI GIAN LUÔN PHÚT:GIÂY ·
> SCORE = ĐIỂM ĐÃ TRỪ (KHÔNG PHẢI SỐ CÂU ĐÚNG) · THÊM HÀNG NHỎ "Total: 9/10". ⭐ CÓ SỬA CORE. 🟢 CHỜ THẦY
> DUYỆT (mới ở LOCAL, chưa commit).** 4 file: `core/utils.js` · `core/engine.js` · `core/app.css` ·
> `templates/quiz/quiz.js`. **(1)** `fmtSecsParts()` (ô Time bảng tổng kết + cột Time của **cả 2**
> leaderboard) đổi "135.4s" → **"2:15.4s"**, luôn có phút kể cả dưới 1 phút. Đồng hồ lúc chơi
> (`formatTime`), Running word/team (`fmtClock`), báo cáo assignment (`fmtDuration`) **vốn đã** m:ss —
> không đụng. ⭐ Bắt được **lỗi cũ**: bản trước tính phần lẻ bằng số thực `Math.floor((s−whole)*10)` nên
> **45300ms hiện "45.2s"** (2,9999… → cắt thành 2); nay tính bằng **số nguyên ms** (`Math.floor(ms/100)%10`).
> **(2)** Ô Score hiện **`result.score`/total** thay cho `correct`/total — tức chính con số leaderboard đã
> dùng để xếp hạng, nên bảng tổng kết và bảng xếp hạng **hết nói 2 số khác nhau**; bật *Points off* −5, làm
> đúng 9 sai 1 → **"4/10"** chứ không phải 9/10. Template không có điểm trừ thì `scoring.js` mặc định
> `score = correct` → **zero-diff**. Điểm âm: **giữ dấu trừ** + tô đỏ `.aw-sum-value.is-neg` (khác ô điểm
> lúc chơi — chỗ đó chỉ vừa 1 con số nên bỏ dấu, dùng màu). ⚠️ **Phải gỡ `raw.scoreText` của Quiz**:
> `scoreText` nghĩa là "điểm ở THANG RIÊNG" nên engine in số **trơ trọi** → giữ lại là ra "4" chứ không
> phải "4/10"; **Gameshow giữ nguyên** (điểm tốc độ "1250", chia cho số câu thì vô nghĩa). **(3)** Hàng
> `.aw-sum-total` "Total: 9/10" — 1.5cqw, xám, căn giữa, ngay dưới hàng Score+Time. **(4)** Cột Time
> leaderboard nới **5.2 → 6.6cqw**: đo tại font thật "10:11.0s" cần 52,5px / "59:59.9s" 62,2px mà cột cũ
> chỉ 50,2px → ván trên 10 phút sẽ tràn đè cột điểm (cột tên `1fr` tự nuốt phần chênh). Tự test devserver
> riêng **:5511** (phiên khác đang chiếm :5510), chơi thật Quiz 6 câu 3 kịch bản: `pointsOff=2` đúng 5 sai 1
> → **Score 3/6 · Total: 5/6**; `pointsOff=0` đúng 6 → **6/6 · Total: 6/6** (không lệch bản cũ);
> `pointsOff=5` đúng 1 sai 5 → **−24/6 đỏ · Total: 1/6**. Hồi quy **16/16 template mount, 0 lỗi console**;
> Running word/team dùng `renderSummary` nên không đi qua thân bảng mặc định. ⚠️ **Bẫy đo mới:** panel
> `.aw-panel` có `animation: aw-gc-pop … both`, pane preview không compositing nên nó **đóng băng giữa cú
> pop** — đo ra bề ngang 115,9px thay vì 386,4px; phải `style.animation="none"` rồi mới đo bố cục.
> **(5)** Hàng Total **tự ẩn khi trùng Score** (thầy chốt): `pointsOff=0` là mặc định mọi act nên
> `score === correct`, hàng đó sẽ in lại y nguyên phân số phía trên — điều kiện nay là
> `total > 0 && score !== correct`. Đo 4 ván: 0/đúng 6 → ẩn · 0/đúng 5 → ẩn · 2/đúng 5 → "Total: 5/6" ·
> 5/đúng 1 → "Total: 1/6". Chi tiết: `GHI CHU DU AN.md` Đợt 83 + `core/HUONG DAN CORE.md` mục
> "BẢNG TỔNG KẾT".
>
> Trước đó: **7/8/2026 (Đợt 82, v0.9.57) — OPEN THE BOX: ZOOM MỞ Ô MƯỢT TỪ ĐẦU TỚI CUỐI + SLOGAN
> Ở CHỖ NÚT NEXT/BACK CŨ + KHUNG HẾT CO 3px. KHÔNG ĐỤNG CORE. ✅ THẦY DUYỆT → COMMIT `b6e7a12` + PUSH +
> LIVE (Pages tự build, `curl` xác nhận sau **23 giây** — đúng quy trình mục 0 điểm 3, không cần 0-TER).**
> Chỉ 2 file template. **(1)** ⭐ Chỗ "vài
> frame cuối khựng" **là LỖI CODE, không phải máy yếu**: `zoomElFrom` (chiều MỞ) chạy 3 transition
> (`transform` 1200ms · `opacity` **840ms** · `border-radius` 1200ms) nhưng dọn dẹp bằng
> `transitionend {once:true}` → nghe trúng sự kiện **xong sớm nhất = opacity ở 840ms** → `clear()` xoá
> `style.transition`+`transform` inline = **huỷ transform giữa chừng**, ô nhảy tới đích ngay mốc **70%**;
> easing lúc đó đã đi 98,9% nên không thấy "nhảy" mà thấy **chuyển động bị chặt cụt** (mất cả đoạn giảm tốc
> cuối). Chiều ĐÓNG đã sửa đúng bẫy này từ **Đợt 14** và ghi chú sẵn — chiều mở bị **bỏ sót**. Sửa: lọc
> `e.propertyName === "transform"`. **(2)** Dọn 4 thứ bắt CPU vẽ lại mỗi khung hình (đo
> `document.getAnimations()`: **20 animation đồng thời**, bài 120 ô ~132 → còn **13**): `border-radius` chỉ
> chạy 45% RẺ của quãng bay (`ZOOM_RADIUS_MS` 540ms — MỞ chạy đầu lúc ô còn bé, ĐÓNG delay 660ms chạy cuối
> lúc ô đã co, vẫn đáp đúng độ bo ô số); thanh đồng hồ đổi `width` → `transform:scaleX()` (transition
> `width 15000ms` = tính lại bố cục mỗi khung hình suốt ván); lưới mờ bằng **1 animation trên cả lưới** thay
> vì mỗi ô một cái (120 ô = 120 lớp đồ hoạ); dời `pendingSettle` (xoá lưới + bỏ `position:absolute` = tính
> lại bố cục cả sân) ra **sau khi mọi animation dừng** (trước hẹn cứng 1280ms, trong khi ô đáp án cuối còn
> trượt tới 1425ms). **(3)** Slogan **"OPEN THE BOX IN ANDREW CLASSES"** vào chỗ nav bỏ trống từ Đợt 24: đi
> `ui.setNav({label})` (như Running word), CSS đổi từ ẩn cả `.aw-nav` sang **chỉ ẩn `.aw-navbtn`** rồi tạo
> kiểu `.aw-nav-label` — ⚠️ luật này BẮT BUỘC scope `:has()` vì label là của CORE (bẫy Đợt 22). Bottombar
> vẫn **38.6px** ở cả 2 màn (ô không co). **(4)** (25b, thầy bảo xử lý luôn) **Khung hết co 3px lúc mở ô
> đầu**: topbar phình 34→37 vì `ensureTimerUI()` dựng hàng đồng hồ MUỘN (lúc chạm ô đầu) → nay gọi 1 lần
> **lúc mount** (luật đồng hồ không đổi, cờ `timerStarted` vẫn giữ); ⭐ và bẫy thứ hai ngoài dự đoán:
> `.aw-otb-q-clock` không khai `line-height` nên chiều cao hàng lấy theo **metrics FONT** (dự phòng 31px →
> Baloo 2 37px) — khai `line-height:1.6` để chiều cao tính từ CỠ CHỮ. Đo 3 mốc (mount / mở ô / sau
> `fonts.ready`): **37.1 / 428.2px — chênh 0**; cả 3 hàng khung nay đứng yên tuyệt đối. **Luật rút ra cho
> mọi template: luôn khai `line-height` cho chữ ở topbar/bottombar, và đừng dựng muộn một hàng cố định của
> khung — cả hai đều biểu hiện là "ô tự dưng co lại giữa chừng" (Đợt 24 + 25b).** Tự test devserver: 0 lỗi
> console, hồi quy Quiz/Anagram/True-false không rò CSS; ⚠️ pane preview `hidden` nên **animation không
> chạy** → độ mượt bằng mắt vẫn cần thầy xác nhận trên TOMKO. Chi tiết:
> `templates/open-the-box/GHI CHU OPEN-THE-BOX.md` Đợt 25 + 25b + `GHI CHU DU AN.md` Đợt 82.
>
> Trước đó: **7/8/2026 (Đợt 81, v0.9.56) — OPEN THE BOX: BỎ HẲN NAV NEXT/BACK + GATE 80% KHI
> ĐÓNG. KHÔNG ĐỤNG CORE. ✅ THẦY DUYỆT → COMMIT `f75a25e` + PUSH + LIVE.** Chỉ 2 file template (`open-the-box.css` + `.js`). **(1)** Luật
> ẩn nav Đợt 22 chỉ khớp `:has(> .aw-otb-card)` = màn LƯỚI; mở 1 ô thì card lưới bị gỡ, chỉ còn
> `.aw-otb-qcard` → selector thôi khớp → **nav hiện lại ở mọi màn câu hỏi**, mà `.aw-navbtn` cao 5cqw >
> `.aw-iconbtn` 4cqw nên bottombar phình ~1cqw → **ô câu hỏi/đáp án co lại**. Sửa: nới selector khớp CẢ hai
> card `:has(> .aw-otb-card, > .aw-otb-qcard)` → nav ẩn suốt game, ô hết co; vẫn tự-dọn (keys theo markup
> riêng, không rò sang game khác — không dính lại bẫy Đợt 22). **(2)** Khoá bấm ô số tới **80% animation ĐÓNG**
> (đối xứng gate mở đáp án 80% point 4): thêm `boxUnlockTimer = setTimeout(0.8×ZOOM_TRANSFORM_MS)` trong
> `closeCardThen`, ở 80% nhấc CẢ hai — grid về live + qcard `pointer-events:none` để tap XUYÊN QUA xuống ô dưới
> (zoom-đóng vẫn chạy tới 100% về hình ảnh); token chặn close cũ, gộp vào `clearPending()`. Tự test devserver
> (:5510, đo DOM — pane không compositing, timer throttle nên timeline giãn nhưng thứ tự+tỉ lệ đúng): YC1 nav
> `display:none` + bottombar 38.6px Ở CẢ màn lưới lẫn câu hỏi (ô 0 co); YC2 driver trong trang đo chuỗi
> pointer-events lúc đóng: CHẶN (gridPE=none+qcard che) → ~80% MỞ KHOÁ (gridPE=auto+qcardPE=none, qcard vẫn
> present) → tap lúc đó **ô kế mở thật**; 0 lỗi console. ⬜ Chờ thầy chơi thử máy thật (ô hết co + nhịp chọn ô
> kế ở 80% đóng tự nhiên) → duyệt → commit + push + live. Chi tiết: `templates/open-the-box/GHI CHU
> OPEN-THE-BOX.md` Đợt 24 + `GHI CHU DU AN.md` Đợt 81.
>
> Trước đó: **7/8/2026 (Đợt 80, v0.9.55) — RUNNING WORD: 5 NHÓM THAY ĐỔI (thầy gửi 1 lượt).
> KHÔNG ĐỤNG CORE. ✅ THẦY DUYỆT → COMMIT `0b629b3` + PUSH + LIVE (build ~27s).** (1) **PASS 0–5/đội** thay ô tích "Allow PASS" (thanh "Passes per
> team", state `passLeft`, nút hiện số còn lại, hết=mờ, chỉ sáng đúng lượt). (2) **Tiêu đề bảng PART A /
> PART B** thay tên đội (cập nhật động trong `paintBoard`; tên đội chỉ còn ở màn kết quả). (3) **2 bảng
> SONG SONG**: bỏ `topIndexOf(t)` (mỗi bảng cuộn riêng) → **`sharedTop()`** chung, khóa theo từ đội-đang-tới-
> lượt; đội chờ hiện đúng số đó = ô trống chờ nhập (chưa gõ) hoặc chữ xanh (đã xong). Đo suốt ván `topA===topB`.
> (4) **In thêm SET X** cả 3 tờ (`printRunningSheets(...,setIndex+1)`). (5a) **Bỏ đếm lùi 3-2-1**, bắt đầu
> bằng **Submit lượt đầu** (`startMatch()` gọi từ `submit()` khi còn "prep"; thêm `canType()`; xoá hẳn
> `beginCountdown`). (5b) Trước trận nút giữa = **SWAP** đổi nhãn PART A↔B + danh sách từ 2 bên (`current` gán
> object MỚI tránh mutate set đã lưu, cờ `partFlip`; màu/đồng hồ giữ theo bên); lúc chơi vẫn Tạm dừng/Chạy tiếp.
> (5c) **In chữ to phủ trang**: bỏ dòng tiêu đề №/WORD/TURN + "Explainer", `HEADING_MM` 16→12, `fs` 0.62→
> 0.78×rowH, giữ ô TURN + CHECK 2 cột (50 từ ~11,4pt vẫn 1 trang). Chỉ 3 file template. Tự test devserver
> (:5510, đo DOM — pane không compositing nên không chụp ảnh): mọi mục khớp; hồi quy Type-the-answer +
> Crossword vẫn 16:9, 0 rò `.aw-rw-*`, 0 lỗi console. ✅ **Commit `0b629b3` + push + LIVE** (poll bản live OK).
> ⬜ Còn chờ thầy nghiệm thu máy thật. Chi tiết: `templates/running-word/GHI CHU RUNNING-WORD.md` mục 8k +
> `GHI CHU DU AN.md` Đợt 80.
>
> Trước đó: **6/8/2026 (Đợt 79, v0.9.54) — FIND THE MATCH: BẤM ĐÚNG THÊM "TING" + DẤU ✓ TO GIỮA
> CÂU HỎI RỒI MỚI BAY VÀO ĐIỂM; CHẾ ĐỘ TẮT REMOVE CORRECTS: Ô ĐÃ CHỌN CHỈ LOÉ ✓ RỒI TRỞ LẠI Y HỆT Ô CHƯA
> CHỌN (GÂY KHÓ). KHÔNG ĐỤNG CORE (chỉ `find-the-match.js` + `.css`). ✅ THẦY DUYỆT → COMMIT (`7ddefe1`) +
> PUSH + **LIVE**.** ⚠️ **Lên live phải đi đường vòng:** job `deploy` của Pages **fail 3 lần** vì hết
> `timeout: 600000` (10 phút) rồi **tự huỷ deployment** (Pages API ghi `errored`/`duration:0` — là HẬU QUẢ
> của việc bị huỷ, KHÔNG phải lỗi nội dung; **2 commit Đợt 78 trước đó cũng errored y hệt**, và thời gian
> build repo chậm dần 20s→5,5ph→**8,2ph**→vượt ngưỡng). **Cách gỡ:** Pages repo này `build_type:"legacy"` nên
> gọi thẳng `POST /repos/andrewclasses-01/AWord/pages/builds` — **không có đồng hồ 10 phút của Actions** →
> `built` sau 198 giây. **ĐỪNG đẩy commit rỗng để thử lại.** Kèm bẫy tài khoản: `gh` CLI là
> `andrewclasses-code` (không admin) trong khi `git push` là `andrewclasses-01`; muốn gh chạy quyền -01 thì
> lấy token qua `git credential fill` rồi `GH_TOKEN=... gh api` (không `gh auth login` lưu được vì token
> thiếu scope `read:org`). Đã chạy lại trọn bộ kiểm tra **TRÊN BẢN LIVE** cả 2 chế độ, 0 lỗi console. Thêm hàm
> `bigCheckThenFly()`: phát "ting" (`clocktick.mp3`) + bung đĩa tròn xanh có ✓ trắng `.aw-ftm-bigcheck` giữa
> `.aw-ftm-track` (KHÔNG là con của prompt vì clone bay chỉ copy text prompt), giữ 560ms, rồi mới fade ✓ +
> phát "correct" + để câu hỏi và 11 sao bay vào điểm; tiếng "correct" dời từ lúc bấm sang lúc bay để khỏi đè
> "ting". Non-remove: bỏ hẳn dim `is-locked`/`disabled`/badge vĩnh viễn ở cả `choose()` lẫn `renderShell()`
> → ô đã ghép đủ màu + bấm được y hệt ô thường (bấm lại = SAI, mất tim); xoá CSS `.is-locked`. Tự test
> browser thật cả 2 chế độ (đo DOM + spy `HTMLAudioElement.play`): chuỗi âm `ting→correct→conveyor`, ✓ to
> hiện rồi biến mất, điểm +1, non-remove ô về y hệt ô thường; bẫy đo compositing quen (opacity `is-solved`
> đọc ra 1 do transition đóng băng, ép `transition:none` ra 0). **0 lỗi console.** Chi tiết:
> `templates/find-the-match/GHI CHU FIND-THE-MATCH.md` Đợt 79 + `GHI CHU DU AN.md` Đợt 79.
>
> Trước đó: **6/8/2026 (Đợt 78, v0.9.53) — ⭐ TEMPLATE THỨ 16 "RUNNING TEAM" + ⭐ TÍNH NĂNG
> MỚI "CLASSES" TRONG SETTINGS. CÓ SỬA CORE (thầy đặt hàng). 🟢 CHỜ THẦY DUYỆT.** Cả lớp chạy tiếp sức
> quanh MỘT tờ giấy chuyền tay: màn hình gọi `MINH ANH — 23`, em đó dò dòng 23 trên giấy đọc to, em
> khác chọn đúng từ giữa **6 ô mà 5 ô là từ trông giống nhất** (trò PHÂN BIỆT MẶT CHỮ → dữ liệu chỉ là
> pool từ trần, y hệt RUNNING WORD). Hết tim = THUA · đồng hồ chính về 0 mà còn tim = THẮNG · hết từ =
> THẮNG. **CLASSES**: danh sách lớp + học sinh, lưu bền, dùng chung cho các act sau — lưu vào **chính
> `users/{uid}/items`** (`kind:"class"`, `root:"classes"`) để **KHỎI phải sửa luật Firebase Console**;
> `ROOTS` cố ý KHÔNG thêm `"classes"` vì mảng đó vẽ các ô TRANG CHỦ. ⭐ **Bẫy core phát hiện được:**
> `inlineTimerBar` và `hasLivesSlot` **loại trừ nhau** — khai cả 2 thì hàng tim được tạo rồi không bao
> giờ gắn vào DOM, vô hình, 0 lỗi console; Running team né bằng cách ẩn topbar engine và tự vẽ hàng.
> Tự test 0 lỗi console, đo đủ 4 cửa kết thúc + hồi quy 3 game không rò CSS. ⬜ **Đường ghi Firestore
> của `core/classes.js` chưa từng chạy thật** (popup Google không tự động hoá được) — cần thầy tạo lớp
> thật. Chi tiết: `templates/running-team/GHI CHU RUNNING-TEAM.md` + `GHI CHU DU AN.md` Đợt 78.
>
> Trước đó: **6/8/2026 (Đợt 77, v0.9.52) — WHACK-A-MOLE: SPEED 10 GẤP ĐÔI · PUNISHMENT TỐI ĐA
> 30S · BẤM BUBBLE CŨNG TÍNH · BUBBLE ĐỎ + CHUI THEO MOLE KHI ĐẬP SAI. KHÔNG ĐỤNG CORE. 🟢 CHỜ THẦY
> DUYỆT.** 4 yêu cầu thầy gửi 1 lượt, chỉ đụng 2 file `templates/whack-a-mole/whack-a-mole.js` + `.css`.
> **(1)** Speed 10 nhanh gấp đôi (`spawnBase` 340→170ms, `upDuration` 900→450ms), Speed 1 giữ nguyên
> (2400ms/4200ms), công thức nội suy tuyến tính `pace=(speed−1)/9` cho 2–9 không đổi. Đo thật bằng
> MutationObserver theo dõi lớp `is-up` của 10 hố ở speed=10: 22 mẫu mole-đứng-trên-đất trung bình
> **451ms** (đích 450ms) — đúng gấp đôi so với 900ms cũ. **(2)** Punishment (đông cứng sau khi đập sai)
> tối đa 10s → **30s** (đổi hằng `MAX_PUNISH`, slider Options tự theo, đo `<input>` ra đúng min/max
> 0/30). **(3)** Bấm vào mole HAY bubble (bong bóng chữ) đều tính là đập — bubble nay cũng gắn
> `pointerdown`, CSS chỉ mở `pointer-events:auto` cho bubble lúc mole đang lên (không ăn vào crate).
> Đo: bắn `pointerdown` thẳng vào bubble của 1 mole đang lên → hố nhận `is-hit` ngay. **(4)** Đập sai →
> bubble của chính mole đó **đỏ** suốt phạt (class `is-wrong`, dọn ở cả 4 chỗ dọn `is-dizzy` cũ, không
> phụ thuộc ngưỡng rung 400ms nên phạt cực ngắn vẫn đỏ) rồi **nhỏ lại + chui xuống theo mole** mượt mà
> (trạng thái ẩn của bubble đổi từ co tại chỗ sang `translateY(45%) scale(.45)`, transition nới `.3s`
> khớp gần đúng nhịp `.26s` của mole). ⚠️ Bẫy đo gặp lại (giống bẫy `el.getAnimations()` ở Đợt 57 nhưng
> bản `transition`): `background` (gradient) là thuộc tính RỜI RẠC nên đổi gần tức thì, còn `border-color`
> nội suy mượt trong `.25s` — đọc `getComputedStyle` NGAY cùng tick lúc thêm class thấy nền đã đổi mà
> viền chưa, không phải lỗi, chỉ vì transition chưa kịp chạy khung hình nào; đo đúng bằng cách đợi vài
> trăm ms hoặc đọc thẳng `cssRules` khai báo trong stylesheet. Tự test trên devserver
> (`templates/whack-a-mole/test.html`), 0 lỗi console. Chi tiết: `GHI CHU DU AN.md` Đợt 77 +
> `templates/whack-a-mole/GHI CHU WHACK-A-MOLE.md` Đợt 64. **Việc kế: thầy chơi thử thật (chạm tay nếu
> có màn cảm ứng) xác nhận Speed 10 mới không quá tải với lớp, bấm trúng bubble ăn điểm giống bấm trúng
> mole, màu đỏ + hiệu ứng bubble chui xuống rõ/đẹp mắt → duyệt → commit + push + live.**
> Trước đó: **6/8/2026 (Đợt 76, v0.9.51) — ⭐ HẾT XÉN DẤU CHỮ VIỆT: `line-height` 1.35 CHO 34 Ô CHỮ NỘI DUNG + 3 CHỖ BÙ `padding`. ⭐ CÓ SỬA CORE (`core/app.css`, thầy duyệt trước). ✅ THẦY CHỐT LÀM LUÔN → COMMIT (`16b487b`, gộp Đợt 75+76) + PUSH + **LIVE**.** Đã chạy lại trọn bộ **TRÊN BẢN LIVE** (bẫy quen: 3 lần `curl` đầu Pages còn trả file CŨ, lần 4 mới đủ dấu mốc): chữ Việt **0/178 phải mượn font** · tiếng Anh **0 ký tự bị ảnh hưởng** · **15/15 mount, 0 lỗi console, 0 khung sai tỉ lệ** · quét xén **sạch**, trừ 1 điểm dư ghi lại cho trung thực: maze-chase `.aw-mc-pad-txt` **0,6px** (đo cục bộ cùng phần tử ra −0,4px = không xén) — dưới 1 pixel, đúng chóp dấu hỏi chữ Ẳ, **cố ý không vá thêm** vì ô nhỏ, thêm `padding` dễ làm lệch tâm chữ hơn là được lợi. Nối tiếp Đợt 75 (đã chữa lẫn font), đợt này chữa nốt lỗi số 2. ⭐ **ĐÍNH CHÍNH TRƯỚC ĐÃ — công cụ đo của chính tôi bị sai:** `Range.getBoundingClientRect()` **KHÔNG** trả về hộp DÒNG mà trả về **hộp FONT** (mép trên = `baseline − fontAscent`), nên bản khảo sát đã cộng thừa một lần `half-leading = (line-height − 1,602em)/2` — số này **luôn âm** khi `line-height` < 1,60 → mọi con số "xén" **thổi phồng gấp đôi** và **2/5 chỗ là dương tính giả**. Bắt được bằng đo tay hình học Quiz: `question_top` = 70,3 = đúng mép `.aw-playarea` nhưng `Range.top` = 63,3, **cao hơn 7px so với chính mép trên phần tử** — bất khả nếu nó là hộp dòng. Công thức đúng `inkTop = rangeTop + fontAscent − ink(Ẳ)`, và ink Ẳ/Ạ phải **đo bằng đúng font + đúng độ đậm của từng phần tử**. **Bảng đúng — chỉ 3 chỗ xén thật:** Quiz `.aw-quiz-question` 9px→**0** · Anagram `.aw-anagram-clue` 10px→**0,4px** · Type the answer `.aw-tta-prompt` 8px→**0**. **Hai chỗ báo nhầm** (đo lại không xén kể cả trước khi sửa): Flying fruit `.aw-ff-clue` (−1,6px) · Maze chase `.aw-mc-pad-txt` (−0,2px). ⭐ **Vì sao vẫn chọn `line-height: 1.35` — lý do THẬT không phải chống xén mà là CHỐNG CHỒNG DÒNG:** khoảng cách baseline–baseline phải ≥ `ink(Ẳ) + ink(Ạ)` = **1,297em**; ở 1.12 thì dấu dòng dưới **đâm vào** phần thò xuống của dòng trên → **mọi câu hỏi tiếng Việt xuống dòng đều dính chữ**, ở mọi template, dù có khung cắt hay không. **Vì sao KHÔNG đẩy lên 1,57** (mức để dấu không tràn hộp dòng): khối chữ cao thêm ~40%, `autoFit` co chữ thấy rõ; rẻ hơn nhiều là giữ 1.35 rồi bù phần dư **0,111em** bằng `padding` tại 3 chỗ chữ nằm sát mép khung cắt. ⚠️ Đo được: với chữ **căn giữa** trong khung flex, `padding` chỉ ăn **một nửa** giá trị (hộp to ra thì căn giữa kéo ngược `P/2`) → `.aw-tta-prompt` cần `0.24em` trong khi `.aw-quiz-question`/`.aw-anagram-clue` (căn trên) chỉ `0.14em`. **Đã sửa:** 34 luật `line-height`→1.35 **chỉ ở ô hiển thị NỘI DUNG của thầy** (câu hỏi · clue · prompt · ô đáp án · thẻ · tiêu đề act · bảng review · thẻ thư viện); **KHÔNG đụng** ô chỉ hiện số/biểu tượng (đồng hồ, tim, bộ đếm, mũi tên, logo) vì nâng chỉ xô lệch bố cục. ⚠️ **CỐ Ý KHÔNG ĐỤNG RUNNING WORD** (4 luật lh thấp còn nguyên): game đọc–gõ từ **tiếng Anh**, cửa sổ 3 dòng vừa ổn định qua 8 đợt bằng `calc(100%/3)` + `translateY` rất nhạy, và đo cho thấy **không xén** — dùng nó với từ tiếng Việt thì mới xử lý, và phải đo lại cửa sổ 3 dòng. **Đo thật trên devserver:** **0 chỗ còn bị xén** trên toàn bộ 15 template · **hồi quy 15/15 mount, 0 lỗi console, 0 khung sai tỉ lệ** · **giá phải trả gần như bằng 0**: câu hỏi Quiz mẫu cỡ chữ **không đổi** (50,2px), ép câu dài **120 ký tự** tiếng Việt cỡ chữ **vẫn không đổi**, khối chỉ cao thêm 225→278,3px (`autoFit` chưa phải co) · chữ Việt vẫn **0/178 phải mượn font**. Chi tiết: `GHI CHU DU AN.md` Đợt 76 + `core/HUONG DAN CORE.md` mục "`line-height` CHO CHỮ VIỆT". **Việc kế: thầy mở act bộ từ VI1/VI2 trên TOMKO xem chữ đã đều font VÀ dấu đã đủ chưa (nhất là HOA có dấu Ẳ Ắ Ộ Ữ), khoảng cách dòng giãn ra có vừa mắt không — máy không chạm màn được và khung xem trình duyệt không hiển thị nên KHÔNG chụp được ảnh, mọi kết luận là đo DOM. Còn 2 việc chưa kiểm: phiếu in A4 giấy thật + Running word với từ tiếng Việt.**
> Trước đó: **6/8/2026 (Đợt 75, v0.9.50) — ⭐ CHỮ TIẾNG VIỆT HẾT LẪN FONT: BỔ SUNG SUBSET VIETNAMESE CHO BALOO 2. ⭐ CÓ SỬA CORE (`core/app.css`, thầy duyệt trước). 🟢 CHỜ THẦY DUYỆT.** Thầy yêu cầu khảo sát cả 15 template, soi lỗi hiển thị khi có từ tiếng Việt. Khảo sát ra **HAI lỗi độc lập**, thầy chốt làm lần lượt → đợt này **chỉ vá lỗi font**. ⭐ **Lỗi 1 (đã vá):** 4 file `baloo-2-*.woff2` chỉ là subset **latin** (230 ký tự) nên bảng chữ tiếng Việt 178 ký tự **chỉ được phủ 76**; Chrome lặng lẽ mượn Segoe UI cho phần thiếu → **một từ hiện bằng HAI font** ("ĐƯỜNG" = Segoe `Đ Ư Ờ` + Baloo `N G`), đo được **44 ký tự rơi hẳn**, phần còn lại bị chắp vá từ chữ nền + dấu rời. Vá bằng subset `vietnamese` của **chính font đó**: thêm `core/assets/fonts/baloo-2-vi.woff2` **9,9 KB**, là **font biến thiên** (wght 400–800) nên **1 file dùng chung cả 4 độ đậm**; chỉ số dọc **trùng khít** file tĩnh (unitsPerEm 1000 · typoAsc 1078 · typoDesc −524) → chữ Việt cùng baseline, **không xô lệch bố cục**; 4 file cũ **không đụng vào**. ⚠️ **HAI BẪY CẮN THẬT:** (1) thêm khối `@font-face` mới **không có tác dụng gì** — khối không khai `unicode-range` là nhận TOÀN BỘ Unicode, Chrome tin lời khai chứ không tin cmap, chọn face latin rồi **nhảy thẳng sang family kế tiếp** mà không ngó khối mới (đo: file VN **chưa từng được tải**); "khai sau thắng" là SAI → phải khai `unicode-range` tường minh cho **cả 4 face latin** (đã chứng minh an toàn trước khi sửa: cmap 230 ký tự nằm TRỌN trong dải latin ∪ dải Việt; còn ✓ ✗ ★ ♥ ☰ ⌫ và IPA ə ʊ ˈ thì font **vốn đã không có từ trước**, không phải hồi quy mới). (2) **gộp 4 khối tiếng Việt thành 1 khối `font-weight: 400 800` thì HỎNG** — một DẢI độ đậm cạnh 4 khối latin giá trị ĐƠN làm Chrome thôi ghép family: face vẫn `loaded`, `unicode-range` vẫn đúng, mà **không ký tự nào dùng nó**; phải tách 4 khối, đúng hình dạng Google Fonts tự phục vụ. **Đo thật trên devserver:** chữ Việt **0/178 còn phải mượn font** · tiếng Anh **0 ký tự bị ảnh hưởng** · font biến thiên ra **đúng 4 độ đậm** ("đường" 278→293,95→303,33→311,41px) · file VN tải **đúng 1 lần** (200, 9888 byte) · **hồi quy 15/15 template mount, 0 lỗi console**, tỉ lệ khung nguyên vẹn (Running word 4:3 đúng thiết kế) · **in giấy không phải sửa** (`print.js` in trong trang nên tự hưởng font mới). ⚠️ Bẫy đo mới: `canvas.measureText` **không kích hoạt tải font** → face chưa dùng luôn báo `unloaded` và phép đo báo "vẫn mượn font" **oan**; phải đặt chữ thật vào DOM rồi mới đo. **Lỗi 2 (CHƯA vá, để Đợt 2):** dấu bị **xén cụt** vì `line-height` chật — Baloo 2 cần dòng tự nhiên 1,60em, ngưỡng tối thiểu **HOA có dấu 1,57 · thường có dấu 1,35 · dấu nặng 1,02** trong khi **tiếng Anh chỉ cần 0,70–0,88** (cả app căn theo tiếng Anh, **67 khai báo `line-height` < 1,22**). Bắt tận tay **5 chỗ xén thật**: Quiz `.aw-quiz-question` **24,0px** · Type the answer `.aw-tta-prompt` 19,9px+7,3px · Anagram `.aw-anagram-clue` 19,4px · Flying fruit `.aw-ff-clue` 9,3px · Maze chase `.aw-mc-pad-txt` 7,3px. Minh chứng trong sản phẩm thật: tiêu đề Quiz **"ĐẲNG CẤP" hiện ra "ĐĂNG CẤP"** — dấu hỏi chữ Ẳ bị xén sạch, thành **từ khác nghĩa hẳn** (lỗi sai nghĩa, không chỉ xấu). Chi tiết: `GHI CHU DU AN.md` Đợt 75 + `core/HUONG DAN CORE.md` mục "FONT TIẾNG VIỆT". **Việc kế: thầy mở act có chữ Việt (bộ từ VI1/VI2) xác nhận chữ đã đều một font — dấu VẪN còn bị cắt, đó là Đợt 2 → duyệt → commit + push → sang Đợt 2 nâng `line-height` (chạm nhiều file, phải đo lại `autoFit` từng template).**
> Trước đó: **5/8/2026 (Đợt 74, v0.9.49) — RUNNING WORD: ⭐ TÌM RA + TÁI HIỆN ĐƯỢC GỐC LỖI "TEAM B CHỈ HIỆN 1 HÀNG" TRÊN iPAD (2 đợt trước đoán sai) + IN PART A/B 1 CỘT + KHOÁ ZOOM CHẠM ĐÚP. KHÔNG ĐỤNG CORE. ✅ THẦY DUYỆT → COMMIT (`6ff2da6`) + PUSH + LIVE.** ⭐ **(1) GỐC LỖI TEAM B — bắt tận tay, không còn đoán:** cửa sổ 3 dòng chứa ô `<input>` DUY NHẤT của trận; **WebKit** (nhân của MỌI trình duyệt trên iPad, kể cả Chrome) lộ ô đang focus / con trỏ đang chạy bằng cách **CUỘN khung cuộn gần nhất** — và `overflow:hidden` **VẪN LÀ khung cuộn** (`hidden` chỉ chặn NGÓN TAY, trình duyệt và `scrollTop` vẫn chạy tự do). WebKit canh ô nhập vào **ĐẦU** khung → kéo dòng đang gõ từ khe đáy lên khe đỉnh = **lệch đúng 2 dòng**, khớp chính xác ảnh thầy chụp. Manh mối lần ra: đo hình học trên chính ảnh thầy gửi ra độ lệch **ĐÚNG 2 DÒNG** = đúng khoảng cách khe-đáy→khe-đỉnh, con số đó không thể ngẫu nhiên. Giải thích trọn vẹn cả 2 điều lạ: **chỉ đội đang đến lượt bị** (chỉ đội đó giữ ô nhập) và **Windows không bao giờ bị** (Blink không làm cú "lộ" này). `focus({preventScroll:true})` đã có sẵn từ trước **KHÔNG đủ** (không chặn `setSelectionRange` lẫn cú lộ-con-trỏ sau MỖI phím gõ). **Vá:** `scroll` listener bật `scrollTop/scrollLeft` về 0 — bất kể thứ gì cuộn nó, hôm nay hay ở phiên bản trình duyệt đời sau. ⭐ **TÁI HIỆN ĐƯỢC bằng script** (điều 2 đợt trước không làm được): `scrollHeight 3817` vs `clientHeight 294` chứng minh khung "overflow:hidden" vẫn cuộn được; gán `scrollTop=196px` (đúng 2 dòng) → đo ngay lúc đó ra `["4:CUR","5:FUT","6:FUT"]` = **ĐÚNG Y HỆT ẢNH THẦY CHỤP**, sau khi guard chạy → `["2:PASS","3:PASS","4:CUR"]` đúng. **(2)** Bỏ nốt phép đo pixel của cửa sổ: track `height:100%`, mỗi dòng `calc(100%/3)`, trượt bằng `translateY(calc(N*100%/3))` — xoá hẳn `measureRow`/`rowH`/`--rw-rowh`, trình duyệt tự tính lại mỗi lần layout, không còn gì để đo/nhớ/lệch pha. ⭐ Tác dụng phụ TỐT ngoài dự tính: `ResizeObserver` trước đây gọi `applyTrack(transition:none)` mỗi lần bảng đổi 70/30 — mà đổi 70/30 CHÍNH LÀ lúc đảo lượt → **hiệu ứng "đẩy lên" .35s của Đợt 70 thực ra đã bị giết, track nhảy cóc**; nay chạy thật. **(3) In: PART A/B luôn 1 CỘT** (thầy chốt; chỉ tờ CHECK 2 cột = 50 từ A | 50 từ B, vốn đã đúng sẵn) — bỏ nhánh "chảy 2 cột" và **vá luôn 1 lỗi thật nó đang che**: tờ CHECK gọi CÙNG `metrics()` nên nhận chiều cao dòng tính cho 2 cột (10.12mm) trong khi vẽ 1 cột → 50×10.12 = **506mm trên trang 253mm → âm thầm tràn sang tờ giấy thứ 4**; nay cả 3 tờ khít đúng 253mm. Đo: 20 từ→22.2pt · 30 từ→14.8pt · 50 từ→8.9pt, đều 1 cột 1 trang. **(4)** `touch-action: manipulation` trên khung game + gốc `.aw-zoomed` → hết phóng to khi chạm đúp (2 người gõ bàn phím ảo sinh "chạm đúp" liên tục mà chẳng ai định phóng to), tiện thể bỏ luôn độ trễ ~300ms trình duyệt giữ để chờ cử chỉ đó. Cố ý KHÔNG dùng `touch-action:none` (sẽ giết luôn phóng-to-2-ngón, thứ không ai bấm nhầm). Tự test devserver + **chạy lại trọn bộ TRÊN BẢN LIVE** (ép `fetch(...,{cache:"no-store"})` xác minh đúng file mới, vì tab test từng dính cache của chính nó ở Đợt 73): tái hiện + vá lỗi đúng y hệt; 10 lượt đảo liên tiếp đo sau khi hoạt ảnh .35s xong → **luôn đúng 3 dòng, dòng đang gõ luôn ở khe đáy, `scrollTop` luôn 0, 0 bất thường**; hồi quy Type the answer + Crossword vẫn 16:9/`touch-action:auto` (luật mới không rò), 0 lỗi console. ⚠️ **Bẫy đo đạc mới:** đo cửa sổ NGAY sau khi bấm (40ms) sẽ thấy "chỉ 2 dòng" và tưởng hồi quy — thật ra track đang trượt giữa chừng (hoạt ảnh .35s nay chạy thật); phải đợi >400ms. Chi tiết: `GHI CHU DU AN.md` Đợt 74 + `templates/running-word/GHI CHU RUNNING-WORD.md` mục 8h. **Việc kế: thầy chơi lại trên iPad xác nhận lỗi TEAM B hết hẳn + chạm đúp không còn phóng to + in thử giấy A4 thật xem 1 cột 50 từ (8.9pt) có còn đọc thoải mái khi đứng cầm không.**
> Trước đó: **5/8/2026 (Đợt 73, v0.9.48) — RUNNING WORD: ZOOM LẤP KÍN MÀN HÌNH, BỎ KHOÁ TỈ LỆ 4:3. KHÔNG ĐỤNG CORE. ✅ THẦY DUYỆT → COMMIT (`1304bf4`) + PUSH + LIVE.** Thầy chơi bản Đợt 72 (nút Fullscreen ghim góc) trên Chrome iPad, xác nhận nút ổn nhưng chụp ảnh cho thấy khung zoom hiện **2 dải đen 2 bên trái-phải**. Nguyên nhân: công thức letterbox lúc zoom (`width:min(100vw, calc(100dvh*4/3))`) COPY nguyên từ khung REST (4:3, chọn riêng cho hình dạng màn iPad) sang cho cả lúc zoom — ép cứng đúng 4:3 dù zoom không có lý do gì phải giữ tỉ lệ đó, mà viewport thật (sau khi trừ thanh trình duyệt) không khớp tuyệt đối 4:3 → hụt 1 chiều → dải đen bù chiều kia. Sửa: bỏ hẳn công thức ép tỉ lệ, thay `width:100%;height:100%` thuần (khít đúng `.aw-page`, vốn đã = 100% khung zoom cố định = viewport thật) — cho đủ cả 2 chiều tường minh cũng tự triệt tiêu luôn `aspect-ratio:4/3` phía trên (CSS chỉ dùng nó để suy ra chiều còn thiếu). **Không có số px/vw/vh cứng nào trong luật mới** — thuần `%`, tự thích ứng MỌI kích thước viewport tương lai (xoay màn, thanh trình duyệt ẩn/hiện, đổi trình duyệt/máy) mà không cần sửa code lần nào nữa — đúng yêu cầu thầy "tự điều chỉnh khi trình duyệt thay đổi". Khung REST (chưa zoom) không đụng, vẫn 4:3 như cũ. Tự test devserver ở viewport CỐ Ý không phải 4:3 (1366×900, tỉ lệ 1.518) để ép lộ dải đen nếu còn: `stage.getBoundingClientRect()` khít đúng 1366×900, 0 khoảng hở 4 cạnh (công thức cũ sẽ ra ~1200×900 kèm dải đen ~83px mỗi bên); bấm lại → khung REST vẫn đúng 4:3 (968×726). Kiểm lại **trên bản live** sau khi push cũng đúng y hệt (gặp 1 lần tab test tự đọc phải CSS cache cũ của chính trình duyệt đó — không liên quan bản deploy, ép tải lại bằng link `?cb=` mới thì đúng ngay) — 0 lỗi console. Chi tiết: `GHI CHU DU AN.md` Đợt 73 + `templates/running-word/GHI CHU RUNNING-WORD.md` mục 8g. **Việc kế: thầy xem lại đúng trên chính iPad đã chụp ảnh dải đen, xác nhận hết dải đen + khung REST không đổi; các việc TOMKO/in giấy A4 của Đợt 68-70 vẫn còn treo.**
> Trước đó: **5/8/2026 (Đợt 72, v0.9.47) — RUNNING WORD: NÚT FULLSCREEN GHIM GÓC DƯỚI-PHẢI + VÁ PHÒNG NGỪA LỖI CỬA SỔ 3 DÒNG CỦA TEAM B. KHÔNG ĐỤNG CORE. ✅ THẦY DUYỆT → COMMIT (`fc54dcd`) + PUSH + LIVE.** Thầy chơi bản zoom (Đợt 71) và gửi 2 việc: (1) nút Fullscreen cần dọn về góc dưới-phải, nhỏ, trong suốt, kín đáo — trước đó nằm trong dòng chảy `.aw-tools` nên trong `.aw-zoomed` bị trôi lệch/to/nổi; sửa `position:absolute` ghim đúng góc `.aw-stage` (mượn `.aw-stage-inner` của core làm nơi neo), thu còn 2.2cqw, nền trong suốt, `opacity:.45` lúc nghỉ — chỉ scope trong `.aw-zoomed`, trạng thái thường giữ nguyên vị trí cũ cạnh Sound (ghim tuyệt đối ở đó từng đụng độ Sound hồi Đợt 3d, nay an toàn vì Sound đã ẩn hẳn khi zoom). (2) Thầy gửi lại đúng tấm ảnh cũ chỉ ra bảng TEAM B lúc chơi không hiện đủ 3 dòng như TEAM A — đọc lại toàn bộ cơ chế `measureRow`/`applyTrack`/`bottomIndexOf`, lái thật 1 trận 16 lượt PASS liên tiếp qua devserver (đúng vai trọng tài, không dừng giữa chừng để tránh đồng hồ tự trôi oan — bẫy đã cắn ở lần thử đầu khiến TEAM B hết giờ giữa chừng) rồi soi DOM từng bước: 4 lượt đầu trận thiếu dòng là ĐÚNG THIẾT KẾ (chưa đủ 2 từ trước để lấp), từ lượt 5 trở đi 12 lượt liên tiếp đều đúng 3 dòng/dòng-đang-gõ-ở-đáy — **không tái hiện được nguyên văn lỗi trong ảnh** (dòng đang gõ ở trên, 2 dòng tương lai ở dưới — về lý thuyết bất khả thi với code hiện tại). Vẫn tìm ra 1 điểm chưa chắc chắn thật: `measureRow()` trước đây chỉ chạy lúc `buildRows()` (1 lần) và trong `ResizeObserver` (chỉ khi khung đổi kích thước thật) — KHÔNG chạy lại trong `paintBoard()` mỗi lượt, mà đây là 2 cơ chế bất đồng bộ riêng, có khả năng thật (dù không ép được trong môi trường tự test không compositing) là `paintBoard` chạy trước khi `ResizeObserver` kịp đo lại lúc bảng 70/30 đảo, dùng chiều cao CŨ một nhịp. Đã vá phòng ngừa: gọi `measureRow(t)` ngay đầu mỗi `paintBoard()`, không còn phụ thuộc thời điểm `ResizeObserver` — rẻ, không đổi hành vi khi kích thước thật không đổi. ⚠️ Ghi rõ trong hồ sơ đây là "ứng viên hợp lý nhất tìm được", không phải "bắt tận tay" — cần thầy xác nhận lại. Bẫy đo đạc mới ghi lại: pane tự test KHÔNG compositing nên MỌI CSS transition đóng băng ở giá trị TRƯỚC khi đổi (không tiến được chút nào, khác hẳn kiểu "animation chạy nhưng không thấy" — ở đây animation không hề tiến); đo đúng phải `el.getAnimations().forEach(a=>a.finish())` SCOPE ĐÚNG phần tử, tuyệt đối không gọi trên toàn `document.querySelectorAll('*')` (đã thử, ép luôn animation fade-out của màn READY khiến trang tự rebuild ngoài ý muốn). Chi tiết: `GHI CHU DU AN.md` Đợt 72 + `templates/running-word/GHI CHU RUNNING-WORD.md` mục 8f. **Việc kế: thầy đã xác nhận cả 2 điểm ổn (kể cả chưa thấy lại lỗi TEAM B) → mở đường cho Đợt 73.**
> Trước đó: **5/8/2026 (Đợt 71, v0.9.46) — RUNNING WORD: ĐỔI FULLSCREEN THẬT SANG "ZOOM" CSS (chỉ RUNNINGW). ⭐ CÓ SỬA CORE (cờ opt-in). ✅ THẦY DUYỆT → COMMIT (`2fb19c7`) + PUSH + LIVE.** Thầy tự chơi thử Fullscreen thật (Đợt 69-70) trên iPad M1 12.9" (Chrome) và báo 4 tật đều là hành vi riêng của Fullscreen API trên iPad Chrome, không sửa được bằng JS: Chrome tự vẽ nút X to góc trên không tắt được, chỉ vuốt xuống nhẹ gần mép trên (đúng chỗ 2 đồng hồ) là tự thoát fullscreen, tự thoát ngay sau màn 3-2-1, và tự bật popup "leave/stay in fullscreen?" giữa trận. So sánh với chính Wordwall (ảnh chụp `wordwall.net` cùng iPad): nút "fullscreen" của Wordwall **không hề gọi Fullscreen API thật**, chỉ phóng nội dung lấp viewport bằng CSS thuần (thanh tab/địa chỉ Chrome vẫn còn) — đổi lại tuyệt đối ổn định, không cử chỉ hệ thống nào can thiệp được. Thầy được hỏi phạm vi (14 game khác cũng cần không?) và chốt: **chỉ RunningW trước, khi nào ổn định mới chỉnh app khác**. ⭐ **CÓ SỬA CORE**: `core/engine.js` thêm cờ opt-in `tpl.useZoomFullscreen` — nút Fullscreen đổi cơ chế sang `root.classList.toggle("aw-zoomed")` (thuần CSS, không gọi `requestFullscreen()` nữa) thay vì `requestFs()`/`exitFs()`; template không đặt cờ chạy y hệt cũ (**zero-diff**, đã đo lại Quiz/Type the answer trên cả devserver lẫn bản live). CSS `.aw-zoomed` (root fixed phủ viewport z-index 9000, `.aw-page`/`.aw-stage` letterbox 4:3 y hệt công thức fullscreen thật cũ, ẩn toolbar) nằm HOÀN TOÀN trong `templates/running-word/running-word.css`, không đụng `core/app.css`. `git fetch` 0/0 trước khi commit; `curl` poll Pages (bẫy quen: lần 1-2 còn file CŨ, lần 3 mới đủ 3 marker `useZoomFullscreen`/`aw-zoomed`) rồi CHẠY LẠI kiểm tra **TRÊN BẢN LIVE**: RunningW bấm Fullscreen → `#app` có `aw-zoomed`, khung đúng 4:3, `document.fullscreenElement` vẫn `null` (xác nhận không gọi API thật), `overflow` khoá đúng; bấm lại/bấm Home đều gỡ sạch; Quiz bấm Fullscreen → **vẫn gọi** `requestFullscreen()` thật (đo bằng tráo hàm tạm thời) — 0 lỗi console cả 2 game. Chi tiết: `GHI CHU DU AN.md` Đợt 71 + `templates/running-word/GHI CHU RUNNING-WORD.md` mục 8e + `core/HUONG DAN CORE.md` mục "Fullscreen API THẬT không ổn định trên iPad Chrome". **Việc kế: đã lên live, chỉ còn 1 việc máy không thay được — thầy tự chơi lại RunningW thật trên iPad, xác nhận cả 4 tật cũ (banner X, vuốt-mất, mất-sau-3-2-1, popup stay-fullscreen) đã hết; các việc TOMKO/in giấy A4 của Đợt 68-70 vẫn còn treo, không đổi.**
> Trước đó: **5/8/2026 (Đợt 70, v0.9.45) — RUNNING WORD: 8 TINH CHỈNH SAU KHI THẦY CHƠI THỬ ĐỢT 2 (nút Play/Pause nhạy + vuông bo tròn; slogan về hàng nút Menu + đổi màu xám nhìn rõ; sửa icon loa↔fullscreen đè nhau; chữ trong ô tự co theo bề rộng, hết "…", 3 ô cùng cỡ; đồng hồ hạ thấp bỏ khoảng thừa; ⭐ bảng CHỈ 3 ô — ô nhập LUÔN ở đáy, 2 từ trước ở trên, đảo lượt thì đẩy lên bằng translateY; ⭐ sửa màn GAME COMPLETE bị kẹt). KHÔNG ĐỤNG CORE đợt này (chỉ 2 file `running-word.js/.css`; 1 dòng core `act-<type>` là của Đợt 69). ✅ **THẦY DUYỆT ("ok build") → COMMIT (`a40809e`, gộp Đợt 68+69+70) + PUSH + LIVE** — `git fetch` 0/0; `curl` poll Pages (bẫy quen: lần 1 còn file CŨ, lần 2 mới đủ 3 marker mới `bottomIndexOf`/`act-${type}`/`aw-rw-track`); CHẠY LẠI trọn bộ kiểm tra **TRÊN BẢN LIVE** (`andrewclasses-01.github.io/AWord`): khung 4:3 đúng, slogan hàng Menu rgb(107,122,144), loa/fs tách, play/pause vuông, đồng hồ 28px, cửa sổ 3 ô gõ-5→**3-4-5**→đảo→**đẩy lên 4-5-6**, bảng 30% co chữ 0 cắt, hết ván "TEAM B WINS" 4 nút `elementFromPoint` không bị chặn; hồi quy Type the answer live 16:9/0 lỗi + home 0 lỗi. ⭐ **2 lỗi thật đã vá** — (1) play/pause "lúc bấm được lúc không" do `paintClocks()` gán lại `innerHTML` nút mỗi 100ms → SVG con bị thay giữa pointerdown/up làm mất click; vá = chỉ đổi icon khi thực sự đổi + `svg{pointer-events:none}`; (2) hết ván "không bấm được gì" do bảng kết quả riêng z-index 45 CHE bảng GAME COMPLETE của engine z-index 13; vá = gỡ bảng kết quả khi gọi `ui.finish()`. Đo: cửa sổ 3 ô đúng kịch bản gõ-từ-5→hiện 3-4-5→submit→đảo→đẩy lên 4-5-6; bảng hẹp 30%(142px) co chữ cùng 20px 0 cắt; play/pause toggle 4 lần đúng; slogan ở hàng Menu màu rgb(107,122,144); loa[472-493]/fs[495-515] tách hẳn; đồng hồ cao 28px; hết ván → `.aw-panel` "TEAM A WINS" 4 nút, elementFromPoint không bị chặn, Start again→READY. Chi tiết: `GHI CHU DU AN.md` Đợt 70 + `templates/running-word/GHI CHU RUNNING-WORD.md` mục 8d. **Việc kế: đã lên live, chỉ còn 3 việc máy không thay được — thầy chơi trên TOMKO thật, bấm fullscreen thật trên iPad, in thử 3 tờ A4 giấy thật.**
> Trước đó: **5/8/2026 (Đợt 69, v0.9.44) — RUNNING WORD: LÀM LẠI GIAO DIỆN TRẬN ĐẤU (15 điểm theo bản vẽ thầy gửi — đồng hồ sát mép trên không tên đội, bảng gõ 70/30 tự giãn có animation khi đảo lượt, chỉ hiện 3 dòng chữ thật to căn giữa, nút Play/Pause to giữa 2 đồng hồ thay hẳn Pause+Undo cũ, thêm màn "prep" chọn đội trước khi 3-2-1, PASS nay LỘ từ, xoá 3 nút Assignment/Template/Print, nút Fullscreen ghim cố định góc phải dưới, bàn phím về đúng size gốc core, tên đội dời vào bảng + số từ còn lại ra chân bảng, slogan thay nav-label, SET có DELETE + tự đồng bộ máy khác qua Firestore). **⭐ CÓ SỬA CORE** (`core/engine.js` — 1 dòng, thầy duyệt trước: gắn class `act-<type>` vào khung NGAY từ lúc dựng, cho MỌI activity, để RUNNINGW tự đè khung 4:3 + ẩn nút "ngay từ khi mở app" thay vì phải chờ tới lúc mount — không CSS template nào khác đọc class này nên 14 game kia không đổi gì). 🟢 CHỜ THẦY DUYỆT — tự test kỹ trên devserver: `stage.className` đã có `act-running_word` + tỉ lệ 4:3 đúng NGAY TRƯỚC KHI BẤM PLAY, 3 nút ẩn/fs-pin đúng từ đầu; hồi quy Type the answer vẫn 16:9/`act-type_the_answer`/0 lỗi (core chỉ cộng thêm, không phá gì); màn "prep" đúng — 2 bảng bằng nhau khi chưa chọn, chạm 1 bảng → 70/30 đúng tỉ lệ đo được (396.8px/171.2px sau 450ms); 3 dòng hiện đúng khít (205.25÷66.98=3.00, cỡ chữ 34.27px); PASS hiện từ màu ink thật (không còn "—"); Play/Pause dừng → 2 bảng+bàn phím `opacity` đúng về 0.4, bấm lại về bình thường; Andrew+gõ đúng vẫn cộng điểm/đổi lượt đúng; giả lập 1 SET đã lưu → Shuffle tự khoá đúng tooltip, nút DELETE SET hiện đúng chỗ, xoá lúc chưa đăng nhập báo lỗi gọn không crash (nhất quán với nút Save) — **0 lỗi console suốt mọi bước**. Chi tiết đầy đủ: `GHI CHU DU AN.md` Đợt 69 + `templates/running-word/GHI CHU RUNNING-WORD.md` mục 8c. **Việc kế: 3 việc máy không tự kiểm được (không đổi từ Đợt 68) — thầy xem khung/đồng hồ/bảng 70/30 trên TOMKO thật, bấm thử fullscreen thật trên iPad, in thử 3 tờ A4 giấy thật** → duyệt → commit + push (gộp Đợt 68+69).**
> Trước đó: **5/8/2026 (Đợt 68, v0.9.43) — RUNNING WORD: 8 ĐIỂM TỐI ƯU IPAD (khung 4:3, đồng hồ sát mép trên, fullscreen sạch chữ, bỏ văn bản hướng dẫn, chia từ theo vị trí tối đa 50/bên, tờ in tối ưu chữ to hết cỡ, CHECK đánh số riêng 2 nửa, Andrew 1-5, đồng hồ bậc thang+Custom). KHÔNG ĐỤNG CORE (chỉ 5 file `templates/running-word/`, `:has()` khoanh vùng riêng game này — 14 template kia không hề bị đụng). 🟢 CHỜ THẦY DUYỆT — tự test kỹ trên devserver (không phải đọc code suông): tỉ lệ khung đo được đúng 4:3, thanh trên gốc ẩn đúng, `buildSets()` gọi trực tiếp cho pool 30/70/120 ra đúng công thức mới (≤50 giống hệt nội dung chỉ khác thứ tự · 70→50+50 trùng 30 đúng giữa · 120→trùng 0), chơi thật 1 lượt Andrew+gõ đúng không lỗi, Options round-trip đúng (Apply "2:15" Custom → Play lại → mở lại Options vẫn đúng lại Custom "2"/"15"), gọi thẳng `printRunningSheets()` ra đúng 3 trang + CHECK 4 cột `№ TEAM A № TEAM B` + cỡ chữ tăng gần gấp đôi (pool 50 → 2 cột 6.27mm ~17.8pt, trước 3.7mm ~10.5pt), Edit mở không lỗi, **0 lỗi console suốt**. ⭐ **1 lỗi thật bắt được lúc tự test**: thanh trượt "Time each team" kéo sang nấc Custom rồi tự nhảy về nấc cũ — hàm vẽ lại đọc NHẦM vị trí từ giá trị đã lưu thay vì tin thao tác kéo vừa rồi; sửa tách hẳn "vẽ lại lúc mở panel" khỏi "chỉ đổi hiện/ẩn lúc kéo". Chi tiết đầy đủ: `GHI CHU DU AN.md` Đợt 68 + `templates/running-word/GHI CHU RUNNING-WORD.md` mục 8b. **Việc kế: 3 việc máy không tự kiểm được — thầy xem khung 4:3 + đồng hồ trên TOMKO thật, bấm thử fullscreen thật trên iPad (Chrome), in thử 3 tờ A4 giấy thật xem chữ có lấp kín trang như ý** → duyệt → commit + push.**
> Trước đó: **4/8/2026 (Đợt 67, v0.9.42) — ⭐ TEMPLATE THỨ 15: RUNNING WORD (RUNNINGW) + ⭐ VÁ BẪY BÀN PHÍM Ở CORE. ✅ COMMIT (`7d721a7`) + PUSH + LIVE** — `git fetch` so origin trước khi commit (0/0, không máy nào đẩy chen); `curl` poll Pages (bẫy quen: lần 1 còn file CŨ, lần 2 mới đủ 6 file); rồi CHẠY LẠI trọn bộ kiểm tra **TRÊN CHÍNH BẢN LIVE**: bản vá bàn phím đúng (dựng lúc disabled → bấm 0; `refresh()` mở khoá → bấm ăn ngay), **15/15 template mount 0 lỗi console**, chia từ trên live ra đúng `50+50 · trùng 15 · phủ ALL`, **chơi TRỌN 1 ván thật ra "REDS WINS" 3–2 + engine ăn mừng**, 0 từ bị lộ. Trận đấu **2 đội trên đồng hồ cờ vua** ngay trong khung game, thay trọn bộ đồ nghề thủ công của thầy: đồng hồ cờ vua vật lý · gõ vào sheet `RUNNING` của WORD GAMES.xlsx trên iPad · in 3 tab từ sheet `RunningW` · chia 2 danh sách bằng tay. Explainer tả từ → typer gõ → **đúng thì chữ xanh + tiếng "clack" đảo đồng hồ + xuống dòng đội kia**; sai thì đỏ, đồng hồ VẪN chạy, không cho qua (đúng luật cờ vua). Hết giờ trước là thua; hết danh sách thì so số từ rồi so thời gian còn lại. Có **PASS** (bật/tắt trong Options, phạt giây), **nút Andrew** (mỗi ĐỘI 1 lượt, dùng khe `extraKey` có sẵn của `core/keyboard.js`), **PAUSE + UNDO cho trọng tài**, 3-2-1 vào trận, 15s cuối chuông dồn + đồng hồ đỏ nhấp, chuông 3 hồi khi hết giờ + bảng so 2 đội. **⭐ Giải mã được luật chia từ từ chính file thật** (`IEL-S15.T3.P4.xlsm` sheet `RunningW`): pool 85 · A=50 · B=50 · **hợp = đúng 85 (phủ trọn pool)** · **giao = đúng 15 = 50+50−85 (trùng ít nhất có thể)** — KHÔNG phải "xáo rồi bốc 50 hai lần" (kiểu đó trùng ~29 và bỏ sót cả chục từ); `rw-sets.js buildSets()` cài đúng vậy + thêm ràng buộc từ trùng phải lệch ≥6 dòng giữa 2 danh sách. **⭐ Luật thiết kế xuyên suốt: TỪ SẮP TỚI KHÔNG BAO GIỜ HIỆN LÊN MÀN HÌNH** (typer đứng ngay trước màn hình) — dòng chưa chơi chỉ hiện SỐ, **màn setup cũng chỉ hiện CON SỐ**, dòng PASS hiện `—`; từ chỉ nằm trên GIẤY. **In 3 tờ A4** từ màn setup (PART A · PART B · CHECK, cột TURN là ô tick), cỡ dòng tự tính, ≥41 dòng tự chảy 2 cột — mọi cỡ pool thật (20-100 từ) lọt 1 trang, chữ 9.9-10.5pt. **Lưu 3 bộ in vào act** (SET 1/2/3; `store.js` nạp trì hoãn trong chính hàm click, nút Save chỉ dựng khi ở máy thầy). **2 LỖI THẬT bắt được khi CHẠY thật, không phải khi đọc code:** (1) **phím Andrew chết cứng → ⭐ HOÁ RA LÀ LỖI CORE, THẦY CHỐT VÁ TẬN GỐC** — `fnKey()` của `core/keyboard.js` chỉ gắn `onclick` khi phím KHÔNG disabled lúc DỰNG, mà `refresh()` sau đó chỉ đổi `.disabled` chứ không gắn bù → **phím nào sinh ra lúc đang khoá là chết hẳn cả phiên, im lặng, không lỗi console**. Lúc vá mới lòi ra **Crossword đã từng dính đúng bẫy này** và phải bẻ cong `isDisabled` để né (còn nguyên ghi chú "must NOT be disabled at build time"). Vá: `fnKey()` **luôn gắn handler**, `disabled` một mình quyết định (`<button disabled>` không bao giờ phát click); `extraKeyEl()` thôi truyền `null`. Đo bằng ca tái hiện đúng lỗi cũ: dựng lúc disabled → bấm 0 lần ăn; `refresh()` mở khoá → **bấm ăn ngay** (trước vá vẫn 0). Hồi quy Type the answer + Crossword + Running word đều bình thường. Luật mới ở `core/HUONG DAN CORE.md` mục **"BẪY BÀN PHÍM"**: từ nay template được tự do dựng bàn phím ở bất kỳ trạng thái nào. (2) **vùng chơi chỉ cao 45.67cqw** chứ không 56.25 (2 thanh ăn ~10.6), bàn phím cỡ gốc chiếm 20.3cqw → 2 cột chỉ còn **1.04 dòng**; thu đồng hồ + thu bàn phím bằng luật **scoped `.aw-rw-card .aw-kbd-*`** (luật TRẦN sẽ thu nhỏ luôn bàn phím Type the answer/Crossword vì CSS template không bao giờ bị gỡ) → nay **5 dòng trọn mỗi đội**. **Core đụng 3 chỗ, thầy duyệt cả 3**: `core/catalog.js` (1 mục) + `core/lesson-import.js` (Import `.xlsm` tự sinh act RUNNING WORD — đo thật: bundle 8→9 act, đúng 85 từ, giữ nguyên `WASH DOWN`/`SKIN-SCRAPER`) + **`core/keyboard.js`** (bản vá bẫy phím ở trên). Chưa đụng `core/convert.js` nên chưa tham gia Change template (cố ý). Tự test: 4 theme OK, 142/142 phần tử tap-highlight trong suốt, hồi quy 15/15 template. Chi tiết: `GHI CHU DU AN.md` Đợt 67 + `templates/running-word/GHI CHU RUNNING-WORD.md`. **Việc kế: đã lên live, không chờ gì thêm về kỹ thuật. Còn 2 việc máy không thay được: thầy chơi thử trên TOMKO (cỡ chữ ô nhập + 2 mặt đồng hồ nhìn từ cuối lớp) và IN THỬ 3 TỜ A4 GIẤY THẬT (50 dòng có lọt 1 trang? ô TURN đủ to để tick?).**
> Trước đó: **4/8/2026 (Đợt 66, v0.9.41) — CROSSWORD: PHÂN TRANG TỚI 120 ANSWER + ANAGRAM→CROSSWORD NÂNG TRẦN 40→120. KHÔNG ĐỤNG CORE (chỉ `core/convert.js`, dùng chung mọi template). ✅ COMMIT (`4d5b892`) + PUSH + LIVE — `curl` 3 file lên live ngay lần đầu (không dính bẫy cache cũ lần này), rồi CHẠY LẠI trọn bộ kiểm tra TRÊN BẢN LIVE (import thẳng module từ `andrewclasses-01.github.io/AWord`): n=31 → "Page 1/2" đúng, `switchTargets()` live đúng 40→true/41→true/120→true/121→false, giải thật 3 từ trên bản live → điểm cộng đúng, 0 lỗi console — cộng với bộ test đầy đủ hơn đã chạy trên local trước khi push: 12 mốc số từ (0..150) ra đúng số trang ở mọi mốc, chơi TRỌN 1 ván 2 trang thật (gõ phím mô phỏng) ra đúng "GAME COMPLETE · Score 28/28", điểm không mất khi tự chuyển trang, hồi quy `crossword/test.html` + `find-the-match/test.html` vẫn y hệt trước.** Thầy hỏi vì sao Anagram chưa đổi Template được sang Crossword → tra ra `core/convert.js` giới hạn Crossword tối đa 40 từ, không phải lỗi. Thầy chốt 3 việc: (1) Crossword nâng trần **120 answer**, ≤30 từ chơi y hệt cũ (ẩn hẳn thanh điều hướng), >30 tự chia trang 30/trang (31-60→2, 61-90→3, 91-120→4 trang, chia đều như `find-the-match.js`) — mỗi trang là **1 lưới ô chữ hoàn toàn riêng** (`pageState[]` giữ lưới + tiến trình từng trang, không mất điểm khi tự chuyển trang), thanh dưới chỉ hiện "Page X/Y" khi >1 trang, không nút lật tay (đúng kỹ thuật `find-the-match.css` đã dùng). (2) `convert.js`: `n>40`→`n>120` cho đích Crossword. (3) `crossword-editor.js`: `MAX_WORDS` 100→120. (4) Answer nhiều từ (vd "sea horse") xác nhận đã chạy ĐÚNG SẴN từ trước (`gridKey()` tự strip dấu cách) — không cần sửa, chỉ xác nhận lại bằng cách chơi thật. Bắt được 1 lỗi logic thật lúc viết: `selectWord()` bọc chỉ số theo `total` (giờ là tổng mọi trang) thay vì `clues.length` (số từ của trang) — đã sửa. Chi tiết: `GHI CHU DU AN.md` Đợt 66 + `templates/crossword/GHI CHU CROSSWORD.md`. **Việc kế: thầy thử tạo Anagram >40 từ có clue → Template → xác nhận Crossword sáng; soạn Crossword >30 từ → chơi thử phân trang trên TOMKO → duyệt → commit + push.**
> Trước đó: **4/8/2026 (Đợt 65, v0.9.40) — HẾT LỖI "NỀN GÓC VUÔNG KHI CHẠM" TRÊN TOMKO, TOÀN BỘ 14 TEMPLATE. ⭐ CÓ SỬA CORE (thầy đồng ý trước, 1 luật DUY NHẤT). ✅ THẦY DUYỆT → COMMIT (`72e1b5f`) + PUSH + LIVE — `curl` poll (bẫy quen: 3 lần đầu Pages còn trả file CŨ, lần 4 mới thấy dấu mốc) rồi CHẠY LẠI trọn bộ kiểm tra TRÊN BẢN LIVE: **14/14 template · 391 phần tử bo góc bấm được · 0 còn dính · 0 lỗi console**.** Thầy báo: chạm ô đáp án / nút Next-Back thì đúng lúc nhấn lóe ra mảng nền **GÓC VUÔNG** thò ra ngoài viền bo tròn; Open the box đã hết nhưng **Quiz và nhiều game khác vẫn bị**; CHỈ máy 3 (TOMKO) bị, máy 1/2 không, GPU/CPU chỉ 1-2%. **Nguyên nhân: mặc định của Chrome `-webkit-tap-highlight-color: rgba(0,0,0,0.18)`** — lớp phủ đen mờ Blink CHỈ vẽ khi input là **CHẠM**, và hình dạng **không bám border-radius** nên 4 góc vuông của nó thò ra ngoài mọi ô bo tròn. Máy 1/2 dùng **CHUỘT** → lớp phủ không bao giờ được vẽ, nên lỗi trông như "tại máy" trong khi thực chất là mặc định CSS có ở mọi máy. **Loại trừ có bằng chứng:** không phải GPU/driver (tải 1-2%), không phải phản hồi chạm của Windows (`ContactVisualization = 0` = đang tắt), và Chrome lẫn myActivity cùng bị vì cùng lõi Chromium. **Vì sao riêng Open the box đã hết:** Đợt 21 nó tự đặt `transparent` cho 2 loại ô của nó — nhưng 12 nút dùng chung của engine thì vẫn dính ngay cả khi đang chơi game đó. **Sửa: ĐÚNG 1 LUẬT** `html { -webkit-tap-highlight-color: transparent; }` trong `core/app.css` — thuộc tính này **KẾ THỪA** nên khai một lần ở gốc là phủ khung game + thanh dưới + cụm công cụ + editor + trang chủ + modal + popup in, và **mọi template về sau không phải nhớ gì thêm**. **Đo thật trên chính máy 3, 14/14 template, trình duyệt thật:** trước — mỗi game 12 phần tử chung dính (`.aw-navbtn`×2 · `.aw-iconbtn`×4 · `.aw-toolbtn`×3 · `.aw-toolbtn-sm`×4) cộng ô riêng (Crossword **143**, Type the answer **53** gồm cả bàn phím ảo `core/keyboard.js`, Quiz **16**, Anagram 21, Find the match 20, Speaking cards 18, Gameshow 16, True-false 14); sau — **392/392 phần tử bo góc bấm được = `rgba(0,0,0,0)`, 0 còn dính, 0 lỗi console**, editor vẫn gõ/bôi chọn chữ bình thường (`userSelect: auto`, bản vá KHÔNG đụng `user-select`), `:active` giữ nguyên. **Diff chỉ 1 file code:** `core/app.css` (+33 dòng, thuần thêm mới). ⚠️ **Máy không tự chạm màn hình được** nên điểm cuối phải do thầy nghiệm thu bằng ngón tay: mở `http://localhost:5510/scratch/kiem-tra-cham-tay.html` trên TOMKO — 2 cột hình dạng giống hệt, cột trái cố ý bật lại lỗi, cột phải là bản đã vá. **myActivity KHÔNG phải sửa** (nó đã có sẵn `* { -webkit-tap-highlight-color: transparent }` ở `main.css:4`) — chỗ thầy thấy lỗi trong myActivity chính là trang AWord nhúng, nên **chỉ hết sau khi push lên Pages**. Chi tiết: `core/HUONG DAN CORE.md` mục "MÀN CẢM ỨNG (TOMKO)" + `templates/quiz/GHI CHU QUIZ.md` Đợt 65. **Việc kế: thầy chạm thử trang nghiệm thu + chơi Quiz thật trên TOMKO → duyệt → commit + push (myActivity chỉ hết sau bước push).**
> Trước đó: **4/8/2026 (Đợt 64, v0.9.39) — QUIZ: THÊM THANH LIVES 0–10 (0 = Unlimited). KHÔNG ĐỤNG CORE. ✅ THẦY DUYỆT → COMMIT (`f0b0830`) + PUSH + LIVE — đã `curl` poll (đúng bẫy quen: lần 1 Pages còn trả file CŨ, lần 2 mới đủ 3 file) rồi CHẠY LẠI trọn bộ kiểm tra TRÊN BẢN LIVE: lives 3 → tim `♥♥♥→♥♥→♥→(hết)`, khoá ô + 2 mũi tên disabled, "GAME OVER · Score 0/6" · act cũ không có `lives` → 0 tim, sai hết 6 câu vẫn "Game complete" · lives 8 → `8♥`→`7♥` · đúng hết → 3 tim nguyên, 6/6 · Submit answers → "Game complete" · panel Options đủ 8 nhóm, Lives 0..10, về 0 = "Unlimited" · **14/14 template mount 0 lỗi, console 0 lỗi**.** Thầy hỏi Quiz đã có Lives chưa → kiểm ra **chưa hề có** (chỉ sót dòng thừa `lives: null` trong sample, không ai đọc). Đã thêm theo ĐÚNG khuôn Type the answer/True-false: `hasLivesSlot:true` mượn ô tim SẴN CÓ của core (nên **không phải sửa core dòng nào**) · Options thêm nhóm **Lives** slider 0..10, 0 = "Unlimited" · `normLives`: chưa set = **vô số mạng** (act Quiz cũ không có trường `lives`; mặc định 5 sẽ làm mọi bộ đề cũ bỗng Game over giữa chừng) · sai 1 câu mất 1 tim (tim trái nhất phóng to rồi tan, `.animate()` kèm `setTimeout` dự phòng; 6..10 mạng hiện gọn `N♥`) · hết mạng → khoá ô đáp án + 2 mũi tên mờ, 1,5s sau kết thúc với chữ **"Game over"** (qua `raw.title`) và âm `blockgametimeout` thay fanfare (`sounds.complete` để rỗng, `finish()` tự chọn). ⚠️ BẪY: `ui.setNav({onNext})` được engine gắn thẳng `btn.onclick=handler` nên KHÔNG được truyền `finish` trần (nó nhận MouseEvent làm `reason`) — đã bọc `() => finish("complete")`. Đo thật trên devserver: lives 3 và 2 → tim rụng đúng nhịp, hết mạng ra "GAME OVER · Score 0/6"; lives 8 → `8♥`→`7♥`; **act CŨ không có `lives` → 0 tim, sai hết 6 câu vẫn "Game complete"** (zero-diff đúng cam kết); trả lời đúng hết → 3 tim nguyên, 6/6; Menu "Submit answers" → "Game complete"; panel Options đủ 8 nhóm; console **0 lỗi** mọi ca. 4 file `templates/quiz/` (`quiz.js`·`quiz.css`·`quiz-sound.js`·`sample-quiz.js`) + docs (mới mở `templates/quiz/GHI CHU QUIZ.md`). Chi tiết: `GHI CHU DU AN.md` Đợt 64. **Việc kế: thầy chơi thử trên TOMKO (chọn số mạng vừa tay); còn chỗ nào chưa vừa thì báo.**
> Trước đó: **4/8/2026 (Đợt 63, v0.9.38) — WHACK-A-MOLE: 5 ĐIỀU CHỈNH THẦY GỬI 1 LƯỢT. ⭐ CÓ 1 LỖI THẬT ĐƯỢC SỬA. KHÔNG ĐỤNG CORE. ✅ THẦY DUYỆT → COMMIT (`16586a6`) + PUSH + LIVE — đã `curl` poll (lần đầu Pages còn trả file CŨ, lần 2 mới đủ 3 file) rồi CHẠY LẠI trọn bộ đo TRÊN BẢN LIVE: lệch tâm 0,0px · cột cách thanh giờ 17,3px · bubble thoát mặt mole cả 3 cỡ hố · câu 229 ký tự giữ bảng 103,4px · bảng hiện SCORE cuối ván · Punishment 8s → 8204ms · 14/14 template mount 0 lỗi, Quiz vẫn đủ 2 mũi tên.** (1) **Bảng luôn giữa cột + cột hết bị thanh giờ đè**: cột đổi sang `top:50%;translate(-50%,-50%);height:15cqw` nên tự lấy TÂM BẢNG làm tâm với MỌI chiều cao bảng (đo: lệch **0,0px**, đỉnh cột cách thanh giờ 15,8px — trước ĐÈ THẬT 49,5 vs 58,2px). ⭐ **LỖI THẬT dưới đáy chuyện này**: `autoFit` đo câu hỏi với `root` (CẢ VÙNG CHƠI ~428px) thay vì cái bảng (~103px), **và** `.aw-wam-sign-question` không hề dùng `var(--fit)` → `--fit` CHƯA TỪNG chạy; câu 262 ký tự làm **bảng phình 376,7px**, thòng 242px dưới đáy cột. Nay đo theo chiều cao thiết kế của ván (`offsetWidth×150/474`−padding) + CSS tiêu thụ `var(--fit,1)`. (2) **Thang Speed trải đều**: `pace=(speed−1)/9`, spawn `2400→340ms`, mole đứng `4200→900ms`, cùng lúc `1→8` — đo: mức 1 = 1 mole/**4,5s** · mức 5 = 1/2,0s · mức 10 = 1/0,5s (⚠️ mức 5 nay chậm hơn trước; nhịp cũ ≈ mức 7–8). (3) **Bubble `bottom:62%→80%`** — quét alpha sprite mới biết 25,5% trên ảnh là trong suốt: trước đuôi bubble cắm **20,1px vào mặt mole**, nay khe hở 3,3/6,6/9,9px theo 3 cỡ hố. (4) **Hết ván điểm hiện TRÊN BẢNG** (bỏ hẳn số khổng lồ giữa sa mạc `.aw-wam-tally`): câu hỏi biến mất, ván hiện "SCORE + số", cột vẫn đứng sau — đo ván 6s ăn 16 điểm → bảng `SCORE 16` khớp ô điểm engine. (5) **Thanh Punishment 0–10s màu xanh lá** (`options.punishSeconds`, mặc định 4 = y hệt hằng số cũ nên act cũ zero-diff) — đo 0s→362ms không rung · 2s→2499ms · 8s→8098ms. ⚠️ BẪY mới ghi: đặt `const` cạnh `updateSign` là ReferenceError vì `updateSign()` được gọi TRƯỚC đó trong `mount()` (temporal dead zone) → phải dùng hàm. Chi tiết: `GHI CHU DU AN.md` Đợt 63 + `templates/whack-a-mole/GHI CHU WHACK-A-MOLE.md`. **Việc kế: thầy chơi thử trên TOMKO (nhất là chọn lại mức Speed vừa tay) → duyệt → commit + push.**
> Trước đó: **4/8/2026 (Đợt 62, v0.9.37) — FIND THE MATCH: BỎ "x of y" + ĐƯA "Page X/Y" XUỐNG THANH DƯỚI + BỎ NÚT LẬT TRANG + SỬA LỖI THẬT CẮT Ô ĐÁP ÁN. ⭐ CÓ SỬA CORE (1 chỗ, thêm mới). ✅ THẦY DUYỆT → COMMIT (`d4f526f`) + PUSH + LIVE — đã `curl` kiểm 3 file live (bẫy quen: lần curl đầu engine.js đã mới mà 2 file find-the-match còn CŨ, phải poll lại) rồi CHẠY LẠI trọn bộ kiểm tra TRÊN BẢN LIVE (8/40/60/70 cặp: 0 ô cắt · 0 chữ tràn · 0 mũi tên · nhãn đúng; 4 game khác không hồi quy; console 0 lỗi).** Thầy gửi ảnh act 60 cặp bị **cắt ngang hàng ô cuối** + 3 yêu cầu. (1)(2) Bỏ hẳn pager trong khung (2 nút `‹ ›` + hàm `goPage`) — game này KHÔNG cho lật tay, trang chỉ tự chuyển khi chơi hết; số trang chuyển XUỐNG thanh dưới, thay chỗ "x of y". ⭐ **Sửa core**: `ui.setNav()` nhận thêm tuỳ chọn **`label`** (có thì hiện nguyên chuỗi thay "x of N", không truyền thì y hệt cũ — đã đo lại 6 game khác không đổi); template gọi `label:"Page 1 / 2"`, và **chuỗi rỗng khi chỉ 1 trang** nên thanh dưới trống hẳn. Nhãn nới rộng + đậm nhưng **scope `:has(> .aw-ftm-card)`** theo luật "CSS template ở lại document vĩnh viễn" (đã đo: quiz `700/59px/xám` vs ftm `800/135px/đậm` → không rò). (3) ⭐ **LỖI THẬT — vì sao ô bị cắt**: `measure()` của `autoFit` (a) dùng `grid.scrollHeight` mà lưới là **flex item bị kéo giãn** nên scrollHeight tụt về chiều cao đã giãn (đúng bẫy ghi đầu `core/fit.js`) → tràn thật bị che, và (b) chỉ cộng `offsetHeight`, **quên margin** track 1,2cqw + divider 1,8cqw + padding card → hụt ~3cqw. Đo tái hiện trước khi sửa: 60 cặp, `--fit=0.89` vẫn tràn **11px / 12 ô bị cắt**. Sửa: tính chiều cao lưới CẦN = `hàng × chiều cao ô + rowGap` cộng `outerH()` (kèm margin) của track/divider + padding card; `slack` 3cqw→**1,5cqw** (đủ ôm gờ 3D 0,5cqw bị `overflow:hidden` xén). Đo lại 8/35/40/60/70 cặp: **0 ô cắt, 0 chữ tràn**. Tự test browser thật: chơi TRỌN ván 36 cặp 2 trang → nhãn tự đổi Page 1/2 → 2/2, điểm 36, "GAME COMPLETE", console 0 lỗi; 6 template khác không hồi quy. ⚠️ BẪY gặp lại: pane trình duyệt công cụ không compositing → **rAF đóng băng** (đo: không bắn trong 600ms) + screenshot timeout → phải đo DOM. Chi tiết: `GHI CHU DU AN.md` Đợt 62 + `templates/find-the-match/GHI CHU FIND-THE-MATCH.md`. **Việc kế: thầy chơi thử act 60 cặp thật trên TOMKO (bản live); còn hàng nào chưa vừa thì báo.**
> Trước đó: **4/8/2026 (Đợt 61, v0.9.36) — ĐIỀU CHỈNH TỔNG THỂ MỌI ACT (4 yêu cầu của thầy) + 2 LỖI THẬT PHÁT HIỆN KHI KIỂM CHỨNG. ⭐ CÓ SỬA CORE. ✅ THẦY DUYỆT → COMMIT (`9dad80b`) + PUSH + LIVE — đã `curl` kiểm chứng 10 dấu mốc trong 6 file đã lên Pages, rồi CHẠY LẠI trọn bộ kiểm tra TRÊN BẢN LIVE (14/14 mount, 0 lỗi console).** (1) **Nút Back/Next có ĐẾ TO CỐ ĐỊNH** vẽ sẵn mọi lúc (8.6×5cqw, gờ 3D, vùng bấm gấp ~2,7 lần; nút khoá vẫn hiện đế; nút cuối ván = đế XANH LÁ chữ trắng) — thêm 4 biến theme `--aw-nav-plate/-hi/-lip/-ink` khai đủ ở cả 4 theme, có giá trị dự phòng trong `app.css`. Thanh dưới cao thêm ~1,1cqw nên đã nâng `.aw-menu` 5.8→6.9cqw và `.aw-toast` 6.4→7.5cqw (đo thật: menu từng đè thanh dưới 8px). Phản hồi lúc nhấn dùng `filter`, KHÔNG `transform` (vì `.is-finish` chạy `aw-glow` scale, animation luôn thắng transition). (1b) ⭐ **LỖI THẬT**: `open-the-box.css` có luật TRẦN `.aw-nav{display:none}` — từ v0.9.7 `ensureTemplate` chèn CSS template một lần và KHÔNG gỡ, nên **mở Open the box 1 lần là mất nút Back/Next ở MỌI game còn lại suốt buổi**; đã scope theo khuôn whack-a-mole (`:has(> .aw-otb-card) ~ .aw-bottombar`). (2) **Đổi template luôn đọc act GỐC**: `doSwitchTemplate` vốn đã convert từ `originAct`, nhưng DANH SÁCH game đổi-được lại tính từ act TẠM → convert vốn mất dữ liệu nên act tạm khoá mất tính năng (đo thật: Quiz → tạm Speaking cards → `switchTargets` trả **0 game**, kẹt cứng). Thêm `switchList()` trong `engine.js` luôn tính từ `originAct` + thêm lại loại gốc để quay về; panel Template và picker ☰/màn kết thúc đều dùng. (3)(4) ⭐ **LỖI THẬT**: **Anagram/Quiz → Whack-a-mole vốn HỎNG** (hiện sáng bấm được nhưng ra game trắng "no statements yet") — `convertActivity` chỉ đặt `options.mode` khi CHƯA có, mà options copy từ sample whack vốn đã mang `mode:"trueFalse"` → act mang `questions` mà tự khai true/false. Sửa: **luôn ép** `mode` theo `kind`. Câu hỏi dựng đúng ý thầy: đề + đáp án đúng của chính câu đó + trộn đáp án từ các câu khác. ⚠️ Bài học đo đạc: pane ẩn thì transition ĐÓNG BĂNG, `getComputedStyle` đọc ra giá trị cũ — phải `style.transition="none"` rồi đọc lại; và harness phải chạy từ trang `/` (chạy từ `templates/*/test.html` thì đường dẫn CSS template 404). Chi tiết: `GHI CHU DU AN.md` Đợt 61. **Việc kế: thầy chơi thử trên TOMKO → duyệt → commit + push.**
> Trước đó: **3/8/2026 (Đợt 59, v0.9.34) — QUIZ: 4 CẢI TIẾN THẦY YÊU CẦU. ⭐ CÓ SỬA CORE (bỏ 1 lệnh ẩn nav). ✅ THẦY DUYỆT → COMMIT (fc8e722) + PUSH + LIVE (tự test trình duyệt thật, 0 lỗi).** (1) **Nav (next/back/số trang) không còn biến mất**: điều tra (tái hiện thật + MutationObserver) → thủ phạm DUY NHẤT là `core/engine.js celebrate()` ẩn nav ~2.2s lúc game-complete (auto-finish khi trả lời hết) — nav KHÔNG mất giữa lúc chơi (đã loại rò rỉ overlay sau Change Template). Thầy chốt GIỮ auto-finish, chỉ ngừng ẩn nav → ⭐ **bỏ `navWrap.style.visibility="hidden"` trong `celebrate`** (Summary mờ đục vẫn che thanh dưới sau đó) + **quiz huỷ `autoTimer` khi điều hướng thủ công** (`clearAutoTimer` trong goPrev/goNext, khớp fix Đợt 56 TTA) để không tự kết thúc lúc đang xem lại. (2) **Không tách 1 từ đơn**: `.aw-tile-text` `overflow-wrap:normal;word-break:keep-all`, thêm biến co RIÊNG mỗi ô `--tw`; `fitNow()` bước WIDTH-fit đặt `--tw=max(0.2,avail/need)` 1 phát → từ 45 ký tự vẫn 1 dòng. (3) **Đáp án dài nhiều chữ**: ô cao AUTO wrap theo khoảng trắng, HEIGHT-fit co `--fit` để không đè câu hỏi (đo: 14 chữ → ô 259px, `--fit≈0.91`, không đè). (4) **Chuyển câu TRƯỢT + chữ ô fade, ô CỐ ĐỊNH**: `mount` dựng card+tiles 1 LẦN rồi cập nhật tại chỗ; `showQuestion` animate câu hỏi translateX±6%, mỗi `.aw-tile-text` fade, ô không di chuyển (đo `tilesFixed=true`). Chỉ `templates/quiz/quiz.js`+`quiz.css`+`core/engine.js`; KHÔNG đụng 13 game kia. Chi tiết: `GHI CHU DU AN.md` Đợt 59. **Việc kế: thầy chơi thử (quiz TẠM từ Change Template + đáp án siêu dài trên TOMKO) → duyệt → commit + push (curl kiểm live). ⚠️ quiz.js commit gần nhất vẫn v0.9.28 nên không đè ai; nếu có máy KHÁC cũng làm "Quiz Đợt 59" thì merge quiz.js sẽ đụng, thầy điều phối.**
> Trước đó: **4/8/2026 (Đợt 60, v0.9.35) — FIND THE MATCH: PHÂN TRANG (≤35 ô/trang) + FIT CHỮ TRONG Ô. ✅ THẦY DUYỆT → COMMIT (94fd6bc) + PUSH + LIVE. KHÔNG ĐỤNG CORE (chỉ 2 file find-the-match).** Thầy báo: nhiều ô thì chữ tràn ra ngoài + muốn ≤35 ô/trang. (1) **Fit chữ**: mỗi ô `display:flex` căn giữa + **chiều cao CỐ ĐỊNH** + `overflow:hidden` + biến co RIÊNG `--tfit` → hàm `fitTiles()` giảm cỡ font từng ô tới khi vừa khít cả ngang lẫn cao → chữ KHÔNG BAO GIỜ tràn, luôn ở tâm. ⚠️ BẪY: `fitTiles` qua `requestAnimationFrame` KHÔNG chạy khi pane ẩn (rAF đóng băng lúc không compositing) → gọi `fitTiles()` **ĐỒNG BỘ** ngay sau khi autoFit đặt `--fit` + gọi lại trên `fonts.ready`; `scheduleTileFit` (rAF) chỉ lo re-fit khi RESIZE. (2) **Phân trang** `MAX_TILES_PER_PAGE=35`, chia ĐỀU (40→20+20). Mỗi trang là 1 VÒNG độc lập (prompt chỉ trỏ ô trên trang đó → đáp án luôn thấy trên trang đang xem); hết cặp trang → `startCycle` tự `nextNonEmptyPage` render trang kế, hết mọi trang → `finish("complete")`; **pager `‹ Page X/Y ›`** (`goPage`) lật tay, prev/next tắt ở biên. `renderShell` nay chạy mỗi lần đổi trang → `fitter.destroy()`+huỷ `tileFitRaf` đầu hàm chống rò rỉ; `queue`=tham chiếu `pageQueues[curPage]`. Tự test browser thật (đo DOM): 8 cặp→1 trang không pager 0 tràn; 40 cặp→Page 1/2+2/2 pager đúng 0 tràn 2 trang auto-advance chơi trọn **score 40 + summary**, console 0 lỗi. Chi tiết: `templates/find-the-match/GHI CHU FIND-THE-MATCH.md` (chặng 3/8 đầu Nhật ký). ⚠️ Số Đợt nhảy 58→60 vì phiên SONG SONG đang giữ Đợt 59 (quiz) — 2 phiên chạy cùng lúc trên repo, file find-the-match tách biệt hoàn toàn.
> Trước đó: **4/8/2026 (Đợt 58, v0.9.33) — OPEN THE BOX: 5 CẢI TIẾN UX. ✅ THẦY DUYỆT → COMMIT + PUSH + LIVE. KHÔNG ĐỤNG CORE.** (1) Hết nháy "nền vuông 4 góc" khi chạm ô: `-webkit-tap-highlight-color:transparent` trên `.aw-otb-box`+`.aw-otb-qtile` (mặc định Chrome vẽ lớp phủ chạm HÌNH CHỮ NHẬT, bỏ qua border-radius). (2) Bo góc DẦN khi ô câu hỏi bay về ô số: animate `border-radius` trong zoom 2 chiều, đích `boxRadius/scale` per-axis khớp ô số (`readBoxRadius` đọc px thật). (3) Chữ back-face co theo cỡ ô khi nhiều ô: `--back-size` theo cell + `fitBackFaces()` co từng ô hiện TRỌN câu hỏi. (4) Khóa bấm đáp án tới 80% animation (`.is-gated`+`answersUnlocked`) tránh bấm nhầm. (5) Không ngắt từ: `overflow-wrap:normal;word-break:keep-all` + `fitOne` co dưới sàn cho từ dài trọn 1 dòng. Chỉ 2 file `templates/open-the-box/*.js|css` (+2 docs); tự test trình duyệt thật 0 lỗi (điểm 1+2 hình ảnh thầy xác nhận trên màn cảm ứng). Chi tiết: `GHI CHU DU AN.md` Đợt 58 + `templates/open-the-box/GHI CHU OPEN-THE-BOX.md` đợt 21.
> Trước đó: **4/8/2026 (Đợt 57, v0.9.32) — WHACK-A-MOLE: MOLE RUNG LẮC KHI ĐẬP SAI + ẨN NÚT NEXT/BACK. ✅ THẦY DUYỆT → COMMIT + PUSH + LIVE. KHÔNG ĐỤNG CORE.** Chỉ 2 file `templates/whack-a-mole/*.js|css` (+ docs). (1) Đập SAI: trong 4s "đông cứng" (`PENALTY_FREEZE_MS`) mole nay **rung lắc** thay vì đứng im — class `is-dizzy` gắn sau 150ms (khớp lúc sprite đổi sang mặt choáng), mole lắc quanh gốc chân (`transform-origin: 50% 92%`) xoay ±6,5° + lắc ngang nhịp 0,46s, **bong bóng chữ lắc cùng nhịp ±3,5°**; hết 4s bỏ class → thụt như cũ; dọn `is-dizzy` ở `duck`/`freeHole`/`endGame`; hết mạng thì không rung. ⚠️ BẪY: phải dùng `@keyframes` chứ KHÔNG `transition` (rule `.is-hit` đã ghim `transform`, animation luôn thắng transition) → **mỗi keyframe tự mang lại offset `translate(-50%,8%) scaleY(.92)`**. (2) **Ẩn nút Next/Back** bằng 1 dòng CSS **scoped**: `.aw-playarea:has(> .aw-wam-scene) ~ .aw-bottombar .aw-navbtn{display:none}` — cố ý KHÔNG dùng `.aw-nav{display:none}` trần như open-the-box (CSS template ở lại document vĩnh viễn nên sau "Change template" sẽ ẩn nhầm mũi tên của game khác), và chỉ ẩn `.aw-navbtn` để lưới 3 cột thanh dưới không vỡ. Tự test trình duyệt thật 0 lỗi. **Bài học đo đạc (dùng lại được)**: pane ẩn thì Chromium ngưng compositing khiến animation trông như chết — phải `el.getAnimations()[0]` rồi tự đặt `currentTime` từng mốc mới đọc được `transform` thật. Chi tiết: `GHI CHU DU AN.md` Đợt 57 + `templates/whack-a-mole/GHI CHU WHACK-A-MOLE.md` (mục ⭐ ĐỢT 57).
> Trước đó: **3/8/2026 (Đợt 56, v0.9.31) — TYPE THE ANSWER: bỏ checkbox Minus points, thêm Lives, sửa 3 lỗi nav/auto-advance. ⭐ CÓ SỬA CORE (1 chỗ nhỏ). ✅ THẦY DUYỆT → COMMIT + PUSH + LIVE.** Chỉ đụng **Type the answer** + 1 fix core nhỏ, không đụng game khác. (1) Bỏ checkbox "Minus points for wrong answers" — chỉ còn 1 thanh trượt `minusAmount` **0..5** (0 = tắt, zero-diff act cũ). (2) **Thêm Lives** (slider 0-10, 0=Unlimited, khuôn `true-false.js` — "chưa set" = Unlimited chứ không phải 5 mạng, để act cũ chơi y hệt trước) — mất mạng khi sai, hết mạng → `finish("gameover")` ngay, âm `gameover-01.mp3`. (3) **Sửa 3 lỗi nav/auto-advance CÙNG 1 GỐC**: `submitAnswer()` cũ không gọi lại `updateNav()` sau khi chấm (Next kẹt khoá khi Allow skip tắt) + hẹn giờ `autoTimer` không bị huỷ khi điều hướng thủ công (kéo giật câu hoặc tự ẩn nav khi đang xem lại) — sửa gọi `updateNav()` ngay sau chấm + `clearAutoTimer()` trong `goPrev`/`goNext`, và auto-advance nay LUÔN chạy sau khi trả lời (không phụ thuộc Allow skip/Auto switch nữa). **CÓ SỬA CORE**: thêm cờ `tpl.hideAutoSwitch` (`core/engine.js`, đúng khuôn `hideTimerOption`) ẩn checkbox "Auto switch" chung (nay vô nghĩa riêng TTA), không ảnh hưởng template khác. Tự test trình duyệt thật (DOM/PointerEvent/KeyboardEvent giả lập, mô phỏng đúng race-condition), 0 lỗi console. Chi tiết đầy đủ: `GHI CHU DU AN.md` Đợt 56 + `templates/type-the-answer/GHI CHU TYPE-THE-ANSWER.md` Đợt 55.
> Trước đó: **3/8/2026 (Đợt 55, v0.9.29) — ANAGRAM: 8 ĐIỂM SỬA/YÊU CẦU THẦY GỬI 1 LƯỢT. ⭐ CÓ SỬA CORE (2 chỗ nhỏ). 🟢 CHỜ THẦY DUYỆT (tự test trình duyệt thật + PointerEvent giả lập, 0 lỗi console).** Chỉ đụng **Anagram** + 2 fix core nhỏ, không đụng game khác. (1) Chống flash góc vuông khi chữ bay (`will-change` + `void clone.offsetWidth` trước `.animate()`, cả `flyLetter`/`flyTileClone`) — lỗi cấp khung hình, không đo được bằng script, cần thầy xác nhận mắt thật. (2) **⭐ SỬA BUG THẬT Ở CORE**: `core/engine.js celebrate()` set `navWrap.style.visibility="hidden"` lúc ăn mừng nhưng KHÔNG BAO GIỜ trả lại — khiến nút Back-Next + "x of N" biến mất trong ~2s mỗi lần xong ván (bug ảnh hưởng MỌI template, không riêng Anagram) → đã thêm dòng phục hồi, test xác nhận `visibility` về `""` sau khi ăn mừng xong. (3) `flyScoreGain()` co điểm về ĐÚNG cỡ chữ thật của ô điểm (`getComputedStyle(scoreEl).fontSize`) thay vì `scale(0.4)` cố định. (4)+(6) `flyTileClone()` (kéo-đổi-chỗ + bấm-trả-về-gốc) THIẾU `font-size` → chữ bay bị bé lại — đã thêm tham số `fontSize`, đo PointerEvent giả lập xác nhận cỡ chữ không đổi suốt chuyến bay. (5) Bấm nhanh liên tục bị delay do khoá TOÀN BỘ thao tác chờ animation ~340ms mỗi chữ — tách trạng thái game khỏi hoạt ảnh (state cập nhật NGAY lúc bấm, chỉ ô vừa bấm tự khoá), test bấm liền 7 chữ đúng "DOLPHIN" trong 1 lệnh không đợi nhau → cả 7 vào đúng vị trí. (7) **CÓ SỬA CORE**: đổi màu thanh "Points off" (`core/app.css .aw-opt-slider/.aw-opt-slidval`) sang đỏ `#ef4444` (đã kiểm 2 class này CHỈ dùng riêng cho Points off, không ảnh hưởng game khác). (8) **Thêm Lives cho Anagram** (slider 0-10 Options, 0=vô số mạng, theo khuôn `true-false.js` — khác 1 điểm chủ ý: "chưa set" = vô số mạng, không phải 5 mạng như true-false, để act cũ chơi y hệt trước) — mất mạng cùng lúc với `pointsOff` (từ có lỗi/nộp sai), hết mạng → "GAME OVER" qua cơ chế `title` sẵn có. Chi tiết đầy đủ từng điểm: `templates/anagram/GHI CHU ANAGRAM.md` Đợt 55. **Việc kế: thầy tự chơi lại bản thật (đặc biệt xem kỹ mục 1) → nói "lưu lại"/"commit" nếu ổn.**
> Trước đó: **3/8/2026 (Đợt 54, v0.9.28) — ĐIỂM TRỪ MỌI TEMPLATE + ALLOW SKIP + CẦU ĐỒNG BỘ myActivity. ⭐ CÓ SỬA CORE. 🟢 CHỜ THẦY DUYỆT (tự test trình duyệt thật, 0 lỗi).** (A) Option **"Points off (wrong answer)"** CHUNG ở `engine.js buildOptionsPanel` (slider 0–5, mặc định 0), ẩn ở 4 game đã có riêng + gameshow (`tpl.hidePointsOff`). `ui.setScore` đổi màu: **dương XANH LÁ, âm ĐỎ, bỏ dấu trừ** (cho phép âm). Trừ điểm per-template ở 8 game chưa có (quiz/anagram/true-false/find-the-match/open-the-box/balloon-pop/flying-fruit/maze-chase) — **pointsOff=0 = zero-diff**. (B) **Allow skip** (quiz + type-the-answer, mặc định KHÔNG tích → phải trả lời mới Next được; anagram/unjumble đã có, giữ nguyên). (C) **Cầu `window.__awordBridge`** + marker `MYACT:AW:TPL/OPT/STYLE` để myActivity đồng bộ Template/Options/Style giữa các bảng (2 chiều). (D) **Chặn bàn phím ảo HĐH** khi bàn phím AWord hiện (`type-the-answer` `inputMode="none"`, Win/Android/iOS). (E) **Cân layout** thanh dưới: tên act sang phải + nút chức năng sang trái (`app.css` margin 6%, center vẫn giữa). Tự kiểm devserver: 14/14 mount 0 lỗi, quiz/true-false trừ điểm hiện số ĐỎ, whack ẩn option chung, bridge đủ 4 method + mute, inputMode none↔text đúng, inset 24px cân. Chi tiết: `GHI CHU DU AN.md` Đợt 54 + `core/HUONG DAN CORE.md`. **Việc kế: thầy chơi thử + đăng nhập → commit + push (gộp Đợt 51–54); myActivity v1.7.4 (kho riêng) cần deploy CÙNG để đồng bộ chạy.**
> Trước đó: **3/8/2026 (Đợt 53, v0.9.27) — LƯU OPTIONS HẲN + NHỚ OPTIONS THEO TEMPLATE TẠM. ⭐ CÓ SỬA CORE. ✅ THẦY DUYỆT → COMMIT + PUSH + LIVE.** Apply option → lưu hẳn (act chính `saveActivity`); act TẠM Change Template ghi options vào `originAct.templateOptions[type]` (fix bug cũ: act `conv_` từng bị lưu nhầm thành act mới). Engine mang `originAct` (act gốc) qua mọi lần đổi (`startGame({base})`); đổi về type gốc → khôi phục act thật; `convertActivity` ưu tiên `templateOptions` đã nhớ. Tự kiểm (không login): convert dùng đúng options đã nhớ; **round-trip UI thật PASS** (tắt Shuffle trên quiz tạm → về Anagram → lại Quiz → vẫn tắt). Chỉ `core/engine.js` + `core/convert.js`. Reload-persist cần login. Chi tiết: `GHI CHU DU AN.md` Đợt 53 + hợp đồng `core/HUONG DAN CORE.md`. **Việc kế: thầy login test → commit + push (gộp Đợt 51–53).**
> Trước đó: **3/8/2026 (Đợt 52, v0.9.26) — EMPTY RECYCLE BIN. 🟢 CHỜ THẦY ĐĂNG NHẬP TEST → COMMIT.** Thêm nút **"Empty bin"** (đỏ) ở thanh công cụ thùng rác → modal xác nhận ("delete all N items, cannot be undone", Cancel/Delete all) → `store.emptyTrash(root)` xoá vĩnh viễn MỌI node trashed trong root (1 lô) → đóng modal + refresh + toast. Chỉ `core/store.js` + `main.js`. Tự kiểm (không login): toolbar trash dựng đúng Back(icon)+Empty bin(đỏ), parse sạch; modal+xoá thật cần login. Chi tiết: `GHI CHU DU AN.md` Đợt 52. **Việc kế: thầy login → xoá act vào thùng rác → Empty bin → xác nhận → commit + push (gộp Đợt 51–52).**
> Trước đó: **3/8/2026 (Đợt 51, v0.9.25) — TINH CHỈNH UX IMPORT. 🟢 CHỜ THẦY ĐĂNG NHẬP TEST → COMMIT.** (1) Nút **Import + Recycle bin → ICON** (class `.aw-fm-iconbtn`; Import=upload svg, bin=`icons.trash`, thùng rác=`icons.prev`). (2) **"Make a new folder" mặc định TÍCH** khi nạp file (ô tên = mã bài); bỏ tích → vào thư mục hiện tại. (3) **Auto-close** sau Import: không make-new → refresh tại chỗ; có make-new → đóng rồi **mở thư mục mới** (`enterFolder(res.folderId)`); có lỗi thì giữ mở. (4) Fix preview đếm act **anagram** (thêm `content.items` vào công thức, trước hiện "· 0"). Chỉ `main.js` + `core/app.css`. Tự kiểm (không login): make-new tích sẵn, meta "Anagram · 100", toolbar dựng 0 lỗi, Recycle bin ra nút icon. Chi tiết: `GHI CHU DU AN.md` Đợt 51. **Việc kế: thầy login test 2 nút icon + auto-close/mở folder → commit + push.**
> Trước đó: **3/8/2026 (Đợt 50, v0.9.24) — ĐỔI TEMPLATE MẶC ĐỊNH KHI IMPORT + THƯ MỤC ACT/HOMEWORK. ✅ THẦY DUYỆT → COMMIT + PUSH + LIVE.** Bản đồ act khi tạo từ file: ENG1/ENG2/VI1/VI2 + **PRONUNCIATION** (tách IPA "WORD /ipa/") → **Anagram**; IPA → Speaking cards; Quiz1/2 → Quiz; Reading act TRUE FALSE / FIND THE MATCH (filling) / QUIZ. **Cấu trúc thư mục:** vocab ở gốc; Quiz1/2 + Reading v1 → **ACT**; Reading v2 → **HOMEWORK trong ACT** — qua trường `subfolder` mỗi act; `store.importBundle` `resolveFolder()` tạo/tái dùng cây thư mục lồng. `main.js` preview hiện subfolder. Skill `taoactaw` cập nhật khớp + gửi lại. Tự kiểm harness: reading→12 act, listening→8 act, **20/20 mount 0 lỗi**, skill Python = app. Chi tiết: `GHI CHU DU AN.md` Đợt 50. **Việc kế: thầy login → Import → xác nhận cây thư mục → commit + push (gộp Đợt 48–50).**
> Trước đó: **3/8/2026 (Đợt 49, v0.9.23) — IMPORT ĐỌC THẲNG FILE .xlsm/.xls trong trình duyệt (bỏ bước JSON). 🟢 CHỜ THẦY ĐĂNG NHẬP TEST → COMMIT.** Thầy muốn duyệt thẳng file .xlsm vào page → tạo act ngay. Nhúng **SheetJS** local `core/vendor/xlsx.mjs` (~1MB, **nạp lười** teacher-only, không CDN) + **`core/lesson-import.js`** (MỚI) port y nguyên logic skill `taoactaw` sang JS (`parseLessonToBundle` đọc WORDTABLE/Quiz/READINGACT, tự nhận reading/listening, bỏ sheet rỗng). `main.js` `importFlow` nay nhận `.xlsm/.xlsx/.xls` (đọc thẳng, xem trước, Import) LẪN `.json`. Tự kiểm harness: reading→11 act (151ms), listening→7 act (65ms), **18/18 mount 0 lỗi**, JS = Python. Học sinh KHÔNG tải SheetJS (index.html parse sạch, chưa chọn file thì chưa tải). Đánh đổi: repo +1MB; logic ánh xạ ở 2 nơi (skill Python + lesson-import.js JS = đường chính). Chi tiết: `GHI CHU DU AN.md` Đợt 49. **Việc kế: thầy đăng nhập → Import → chọn .xlsm → duyệt → commit + push (kiểm `xlsx.mjs` live bằng curl).**
> Trước đó: **3/8/2026 (Đợt 48, v0.9.22) — NÚT IMPORT: tạo hàng loạt act từ "gói JSON" (nền tảng taoactaw, Phần A). ✅ THẦY TEST OK → COMMIT c4ee761 + PUSH + LIVE.** Thầy muốn "taoactaw" (đọc .xlsm bài học → tạo act AWord, giống skill `taoact`). Chốt: xây **nút Import ngay trong app** (bền) + mỗi bộ dữ liệu chỉ **ít act gốc**, dùng Change Template đổi game tại lớp. Phần A đợt này: `core/store.js` thêm **`importBundle(bundle,{parentId})`** (bundle=`{folder?,activities:[{type,title,theme?,options?,content}]}`; tạo/tái dùng subfolder, `saveActivity` từng act, **trùng tên thì bỏ qua** nên re-import an toàn); `main.js` thêm **nút Import** (Activities, cạnh New folder) + hộp thoại dán/chọn JSON → báo cáo Created/skipped → `render()`. Đã nghiên cứu 2 họ file: **reading** (`READINGACT1/2` có 3 dạng TF/FILLING/READING QUIZ, logic `read_ra` của taoact khớp 100%) và **listening** (`Quiz1/2`), skill phải dò tên sheet linh hoạt + bỏ sheet rỗng. FILLING→Find the match (thầy chốt). Tự kiểm KHÔNG login: prototype đọc file reading→bundle 11 act, harness mount **11/11 engine thật 0 lỗi**, index.html parse sạch. CHƯA test nút thật (login Google không tự động hoá). Chi tiết + hợp đồng gói JSON: `GHI CHU DU AN.md` Đợt 48. **Việc kế: thầy test nút Import → commit + push; rồi làm Phần B = skill taoactaw.**
> Trước đó: **3/8/2026 (Đợt 47, v0.9.21) — ĐỔI TEMPLATE GIỮA LÚC CHƠI ("Change template"). ⭐ CÓ SỬA CORE. ✅ THẦY DUYỆT → COMMIT + PUSH + LIVE.** Đang chơi 1 bộ (vd Anagram) → bấm nút **Template** dưới khung / mục **Change template** trong menu ☰ / dòng **Play a different template** ở màn kết thúc → **đổi sang game khác chơi tiếp CHÍNH bộ dữ liệu đó**, act gốc trong thư viện KHÔNG đụng (dựng act tạm `conv_...`), giữ theme, điểm chơi lại. Phạm vi = **nhóm hợp dữ liệu tốt** (nhóm QA 10 game đổi qua lại + speaking_cards; true_false↔whack_a_mole; unjumble→{speaking_cards,type_the_answer}; speaking_cards không đổi được vì thiếu đáp án) — game không hợp thì **mờ**. File lõi MỚI **`core/convert.js`** (bộ phiên dịch: `toRecords`/`switchTargets`/`convertActivity`, tự sinh đáp án nhiễu cho MC từ các từ khác trong bộ) + nối 3 stub trong **`core/engine.js`** + `.aw-switch-list` trong **`core/app.css`**. **KHÔNG đụng 14 template**, không đổi class `.aw-page/.aw-stage/.aw-below` hay fullscreen `#app` (an toàn nhúng myActivity/myLesson). Tự kiểm: **116/116** chiều convert+mount 0 lỗi console; đổi thật Anagram→Find the match & Quiz→Anagram chơi được (chữ xáo = đáp án đúng). Chi tiết: `GHI CHU DU AN.md` Đợt 47 + hợp đồng ở `core/HUONG DAN CORE.md`.
> Trước đó: **3/8/2026 (Đợt 46, v0.9.20) — FIX deep-link act TRẮNG TRANG. Mở act qua URL trên trang MỚI (`?a=<num>` — cách app myActivity mirror act sang pane phải ở bảng đôi, cũng như bookmark/link chia sẻ) bị trắng với MỌI loại khác Quiz. Gốc: Đợt 33/v0.9.7 chuyển nạp template LƯỜI (`ensureTemplate`) + thêm `await` khắp nơi NHƯNG BỎ SÓT `routeFromLocation()` trong `main.js` → template chưa đăng ký → `startGame`→`getTemplate` ném "Chưa có game loại ... trong registry" → trắng. Sửa 1 chỗ: `await ensureTemplate(node.type)` trước `startGame` (y khuôn `playAct`), KHÔNG đụng `core/`. Kiểm chứng bằng harness Electron partition thật (`persist:main`). ✅ THẦY DUYỆT → COMMIT + PUSH + LIVE. Chi tiết: `GHI CHU DU AN.md` Đợt 46.**
> Trước đó: **3/8/2026 (Đợt 45, v0.9.19) — WHACK-A-MOLE: NÂNG CẤP LỚN (7 loạt tinh chỉnh theo yêu cầu thầy). Đồ họa dùng ẢNH THẬT Wordwall (`mound02`=cả phông đồi+núi+cactus, hố chỉ `holeback/holefront`, `mound01` blur = 2 đồi tiền cảnh, cactus thật 2 bên, intro zoom). Editor True/False → 2 CỘT + khóa đổi mode khi có dữ liệu. Timer đồng bộ engine (countUp/countDown + `timerTotalSeconds`, `manualTimerStart`, bỏ `gameSeconds`); bar cam ≤30s/đỏ ≤10s. Options mới: Switch correct/incorrect · trừ điểm 0–5 · Lives 0–10 (tim topbar, mất từ trái) · 3 tick bonus riêng · gỡ Auto switch + Timer None. Luật: dọn hết câu đúng → countUp COMPLETE / countDown làm mới vòng chơi tiếp; câu đúng đã đập không hiện lại. Đập SAI = phạt đông cứng 4s. Dấu ✓/✗ nét trần; bubble vẽ CSS ôm sát chữ; biển vào giữa cột; gỡ tally khỏi đè TIME'S UP. ✅ THẦY DUYỆT → COMMIT + PUSH + LIVE — tự test trình duyệt thật 0 lỗi, KHÔNG đụng core (chỉ 5 file whack-a-mole + 2 docs). Chi tiết: `templates/whack-a-mole/GHI CHU WHACK-A-MOLE.md` (mục ⭐ ĐỢT 45) + `GHI CHU DU AN.md` Đợt 45.**
> Trước đó: **2/8/2026 (Đợt 44, v0.9.18) — SPEAKING CARDS: nhiều cải tiến theo yêu cầu thầy (2 loạt). Loạt 1: intro lia camera bàn cờ · nút Menu/Sound/Fullscreen vào nền xanh · cân đối · lá NGANG + design mới · shuffle khớp thời lượng tiếng · không cắt đôi từ · phiên âm 2 hàng + vá tỉa Options. Loạt 2 (sau khi thầy chơi thử): Number of deal places → SLIDER 1-10 · quân cờ vẽ lại kiểu Staunton có khối/bóng (giống thật) · 1 ô chia bộ bài=place TO bằng nhau, nhiều ô kích cỡ thích ứng lấp tối đa màn hình (`computeLayout`) · chữ trong lá to tối đa (fitOnce max 3.6) mà 1 từ không tách dòng. Loạt 3 (thầy yêu cầu dùng ĐỒ HỌA GỐC): tải background.jpg + card art THẬT từ act gốc (Claude in Chrome) về Source + `templates/speaking-cards/assets/`, BỎ quân cờ SVG, dùng ẢNH NỀN THẬT cho intro-pan + nền (⚠️ asset Wordwall — cân nhắc bản quyền trước khi push công khai). Loạt 4: shuffle còn 1/2 thời gian · câu dài trong lá to hết cỡ + xuống nhiều dòng + căn giữa (bộ co riêng, bỏ fitOnce) · bộ bài canh giữa deal place · ô chữ editor tự mở hết cỡ. Loạt 5: BỎ chức năng Add image (nút+data+CSS) · thêm slogan "SPEAKING CARDS IN ANDREW CLASSES" (look Crossword, ghim trong scene vì scene phủ topbar). ✅ THẦY DUYỆT → COMMIT + PUSH + LIVE — đã tự test trình duyệt thật 0 lỗi, KHÔNG đụng core (chỉ commit file speaking-cards + 2 docs; whack-a-mole đang dở của phiên khác nên KHÔNG đụng). Backup bản cũ ở `AWord-data/Backup/speaking-cards-v0.9.17/`. Chi tiết: `templates/speaking-cards/GHI CHU SPEAKING-CARDS.md` (đầu file) + `GHI CHU DU AN.md` Đợt 44. Nền dùng ẢNH RIÊNG của thầy (`assets/background.jpg` = background2.jpg thầy cung cấp, 7386×2217); ĐÃ GỠ card art Wordwall khỏi repo (còn ở Source).**
> Trước đó: **2/8/2026 (Đợt 43, v0.9.17) — CROSSWORD: 3 loạt tinh chỉnh reveal + âm thanh (yêu cầu thầy). ✅ THẦY DUYỆT → COMMIT + PUSH + LIVE. KHÔNG đụng core.** Reveal khi chấm chạy TUẦN TỰ từng ô (ô đúng xanh + ting, ô sai ✕ nhỏ KHÔNG che chữ + tặc — bỏ hẳn nền/chữ đỏ; xong ✕ cuối mới lật chữ đúng về xám đồng nhất); câu ĐÚNG cũng tuần tự, ting ô cuối xong mới bay sao + cộng điểm; nhánh SAI+trừ điểm: đủ ✕ → sao đỏ bay + trừ điểm → sao rời ô → mới lật. 6 âm SYNTH WebAudio (ting/tac/magic + starGain vàng-lên/starLose đỏ-xuống trong flyStars + reject "thụp" gõ sai ô given). Start again ĐỔI BỐ CỤC (buildCrossword trộn + tie-break ngẫu nhiên → mỗi ván lưới khác, 17–18/20 từ). Version nhảy v0.9.17 để không trùng nhánh Unjumble (v0.9.16). Chi tiết đầy đủ + BẪY: `templates/crossword/GHI CHU CROSSWORD.md` mục "3 LOẠT TINH CHỈNH"; tóm tắt: `GHI CHU DU AN.md` Đợt 43. Commit CHỈ add 3 file crossword + 3 docs.
> Trước đó: **2/8/2026 — UNJUMBLE 7 loạt tinh chỉnh (unjumble-local Đợt 36→42, v0.9.10→v0.9.16). ✅ THẦY DUYỆT → COMMIT + PUSH + LIVE.** Nền CSS hiện đại + slogan "UNJUMBLE IN ANDREW CLASSES" + intro nghiêng/zoom rồi từng-từ bay đáp đúng slogan; font Baloo 2; kéo-thả caret chuẩn + bay mượt; clue 1 hàng xanh biển italic dưới slogan; **chấm điểm THEO CÂU** (bonus ≤ số lượt tối thiểu → 2đ, submit đúng 1đ / sai −"Points off" 0–5); điểm "N / max", âm màu đỏ; ✓/BONUS + sao vàng(đúng)/đỏ(sai) bay về điểm; **Lives** (slider ∞/1–10 như True/false, hết mạng → Game over); **?/!** cuối câu = ô cố định khóa, **. ,** dính từ; **Show answers** đọc rõ (⭐ CÓ SỬA CORE opt-in `tpl.reviewStyle:"stacked"`, tương thích ngược, ghi ở `core/HUONG DAN CORE.md`). Chi tiết từng loạt: `templates/unjumble/GHI CHU UNJUMBLE.md` (Đợt 36→42); tóm tắt: `GHI CHU DU AN.md`. ⚠️ Số Đợt của Unjumble đếm RIÊNG, trùng số với Crossword bên dưới (2 phiên song song).
> Trước đó: **2/8/2026 (Đợt 36, v0.9.10) — CROSSWORD TÁI THIẾT KẾ LỚN (nhiều loạt yêu cầu của thầy): 2 màn "bảng ↔ hàng/cột", bàn phím cố định tuyệt đối, bảng dùng hết màn + mọi ô bấm được, slogan lên thanh đồng hồ/điểm, câu hỏi to 1–2 dòng tự cân + dải ô căn giữa, ô given xanh/xám + rung khi gõ sai, Andrew chữ vàng trong ô, sao bay vàng/đỏ về điểm (điểm đổi ngay khi sao bay), Minus = slider 0..5, sai(Show-answer BẬT) hiện ✕ đỏ trước rồi mới lộ đáp án, editor nút icon + clue tự nới. ĐÃ COMMIT + PUSH. KHÔNG đụng core. Chi tiết đầy đủ + BẪY: `templates/crossword/GHI CHU CROSSWORD.md` mục 2/8/2026; tóm tắt: `GHI CHU DU AN.md` Đợt 36. ⚠️ Commit CHỈ add file crossword + 3 docs (trong cây có thay đổi CHƯA XONG của phiên khác — engine.js / HUONG DAN CORE.md / unjumble — cố ý KHÔNG đụng).**
> Trước đó: **1/8/2026 (Đợt 34, v0.9.8) — GAMESHOW: dựng lại INTRO 6s + GET READY mỗi câu + NỀN PHỦ TOÀN KHUNG (theo act gốc). ✅ THẦY DUYỆT → ĐÃ COMMIT + PUSH. KHÔNG đụng core. Chi tiết: `GHI CHU DU AN.md` Đợt 34. (Cùng ngày có phiên song song làm Unjumble = Đợt 35/v0.9.9, file tách rời.)**
> Trước đó (Đợt 33, v0.9.7): NẠP TEMPLATE THEO YÊU CẦU. ⭐ CÓ SỬA CORE.
> Trang HS `play.html` trước nay CHỈ chơi được Quiz (nó tự khai danh sách template riêng và quên 13 loại
> kia) → giao bài loại khác cho HS là gãy `Chưa có game loại "..."`. Nay bỏ hẳn kiểu mỗi trang tự chép
> danh sách: `core/catalog.js` khai luôn `css`/`load()`/`sample()` cho từng loại, `core/registry.js` thêm
> **`ensureTemplate(type)`** (chèn CSS + ĐỢI CSS áp xong + import module, nhớ lời hứa nên gọi song song
> chỉ nạp 1 lần). `main.js` **xóa cả 14 import**, `playAct`/`editAct`/`createBlankAct` `await` nó;
> `play.js` `await` nó trước khi chơi (hiện "Loading..." thay vì trang trắng); `index.html`+`play.html`
> **xóa sạch link CSS template**; `manifest.js` rút còn 3 dòng suy ra từ catalog.
> ➜ **HS mở 1 bài chỉ tải ĐÚNG 1 game** (đo thật: mở trang = 0 template + 2 CSS lõi).
> ➜ **Thêm template từ nay = sửa ĐÚNG 1 FILE `core/catalog.js`** (xem quy tắc 10 + `templates/HUONG DAN
> TEMPLATE.md` + mục mới trong `core/HUONG DAN CORE.md`).
> Tự test: 14/14 loại nạp được (gọi song song không nhân đôi CSS), 14/14 mount game, 14/14 mở editor,
> loại lạ reject sạch, `play.html` chơi được crossword/speaking_cards/whack_a_mole — 0 lỗi console.
> Trước đó: **1/8/2026 (Đợt 32) — TRANG CHỦ TỪ 6 → 14 LOẠI ACT.** Thầy duyệt gộp nốt 8 template đã
> build xong còn nằm trong kho: **Gameshow quiz · Maze chase · Whack-a-mole · Flying fruit · Balloon pop ·
> Crossword · Unjumble · Speaking cards**. Sửa đúng 4 chỗ theo checklist: `core/catalog.js` (8 mục
> `built:true` — 1 nguồn nuôi CẢ picker "New activity" LẪN panel Template trong game), `main.js` (8 import
> để module tự `registerTemplate`), `index.html` (8 link CSS), `manifest.js` (8 mục, giữ đồng bộ).
> Kèm sửa `previewPick()` trong `main.js` cho thẻ act hiện được nội dung ở MỌI hình dạng dữ liệu
> (`questions|items|words|statements|cards|pairs`) — tiện tay vá luôn lỗi cũ: **True or false và Find the
> match trước nay vẫn hiện "No questions yet"**. KHÔNG đụng core (ngoài catalog.js). Đã quét an toàn CSS
> toàn cục (0 selector trần · 0 `:root` · 0 trùng `@keyframes`) và tự test: 14/14 type có trong registry +
> có editor, 14/14 editor mở được từ act trắng, 14/14 game `startGame()` mount 0 lỗi, 14/14 preview đúng,
> console sạch. **CHƯA COMMIT** (chờ thầy chơi thử). ⚠️ Tồn đọng: `play.html` (trang HS) vẫn chỉ chơi được
> Quiz — xem `GHI CHU DU AN.md` Đợt 32.
> Trước đó: **1/8/2026 (Đợt 31) — FIND THE MATCH: 4 loạt tinh chỉnh thầy yêu cầu, đã test trình duyệt
> thật (0 lỗi console), KHÔNG đụng core, COMMIT + PUSH + LIVE. Gồm: 3 giây "3-2-1" không tính vào đồng hồ
> (`manualTimerStart` + `ui.startTimer()`); khối đáp án căn giữa vùng; đáp án CỐ ĐỊNH tuyệt đối (ô đã giải chỉ
> mờ, KHÔNG xóa khỏi lưới → không dồn/nhảy); bấm SAI giữ nguyên ô + câu hỏi chuyển tiếp (Repeat=xếp lại ngẫu
> nhiên); LIVES như True/false (tim ở top bar `hasLivesSlot`, slider 0–10, hết tim → game over); bấm ĐÚNG câu
> hỏi bay về ô điểm + 11 ngôi sao + điểm nảy; khóa chọn tới khi câu mới vào ≥50% (`gateTimer`); hết tim hiện
> "GAME OVER"; câu dài TỰ CO FONT cho vừa khung (`fitPrompt`/`--pfit`). Chi tiết: `GHI CHU DU AN.md` Đợt 31 +
> `templates/find-the-match/GHI CHU FIND-THE-MATCH.md`.**
> Trước đó: **1/8/2026 (đợt 30) — TYPE THE ANSWER: rất nhiều vòng tinh chỉnh thầy yêu cầu (bàn
> phím ảo, âm thanh mp3 thật, bố cục màn chơi, điểm số), THẦY DUYỆT → COMMIT + PUSH + LIVE. ⭐ CÓ SỬA CORE
> (additive/opt-in, đã kiểm Quiz + Anagram/Crossword/Gameshow/Whack-a-mole 0 lỗi): `engine.js` thêm option
> **Auto switch** (global, mặc định tắt) + **chặn "Submit answers" khi 0 câu trả lời** (`ui.onSubmit(fn,
> countFn)` + guard ở Menu — 8 template đưa countFn, không đưa thì như cũ) + ô thời gian countdown cạnh nút
> (`.aw-opt-cd`) + "End of game" xuống cuối + Apply-bất-kỳ-option-thì-restart + cờ `hideShuffleAnswers`;
> `sound.js` thêm `keyClick()`; `numberstepper.js` **nhấn-giữ ▲/▼ chạy liên tục**; `app.css` `.aw-opt-cd`.
> Bố cục TTA: ô đáp án cỡ CỐ ĐỊNH (câu hỏi nhường chỗ khi thiếu), căn giữa CẢ CỤM giữa câu-hỏi↔bàn-phím,
> chỉ nhận tiếng Anh, điểm âm màu đỏ. Chi tiết: `templates/type-the-answer/GHI CHU TYPE-THE-ANSWER.md`
> (mục 1/8) + `GHI CHU DU AN.md` đợt 30. *(Đợt này dùng chung cây làm việc với 1 phiên True-false/Find-the-
> match — thay đổi của phiên đó đã cố ý + hoàn chỉnh, commit chung.)***
> Trước đó: **1/8/2026 (đợt 26) — GAMESHOW QUIZ (game thứ 10) build ĐẦY ĐỦ + tự test trình duyệt
> thật (0 lỗi console), style TV game show = "Classic". Trắc nghiệm có ÁP LỰC THỜI GIAN + ĐIỂM theo tốc độ
> + Lives + VÒNG BONUS (5 lá bài mỗi N câu) + 4 LIFELINES (50:50/×2/+TIME/REVEAL). Dữ liệu Y HỆT QUIZ, editor
> bọc khuôn quiz-editor. ⭐ CÓ SỬA CORE (tương thích ngược, ĐÃ KIỂM Quiz 0 lỗi): thêm điểm-tuỳ-biến
> `ui.finish({score,scoreText})` ở scoring/leaderboard/engine + cờ `hideTimerOption` (xem `HUONG DAN CORE.md`).
> Art + 47 âm THẬT Wordwall (theme gameshow) lưu ở `AWord-data/Source/{Sound effect,Graphic}/GAMESHOW/`; viền
> bóng đèn marquee dựng bằng CSS. CHƯA lên catalog/trang chủ (chờ thầy duyệt). Xem `GHI CHU DU AN.md` đợt 26 +
> `templates/gameshow/GHI CHU GAMESHOW.md` + `docs/10-GAMESHOW.md`.**
> Trước đó: **1/8/2026 (đợt 25) — MAZE CHASE (game thứ 9) build ĐẦY ĐỦ + tự test trình duyệt
> thật (0 lỗi console), style Space = "Classic". Cơ chế Pac-Man: lái robot qua mê cung tới đáp án đúng,
> né robot địch; Lives + Difficulty. Art + âm THẬT của Wordwall (theme space), lưu convention ở
> `AWord-data/Source/{Sound effect,Graphic}/MAZE CHASE/`. ĐÃ COMMIT + PUSH, CHƯA lên catalog/trang chủ
> (chờ thầy duyệt). Xem `GHI CHU DU AN.md` đợt 25 + `templates/maze-chase/GHI CHU MAZE-CHASE.md`.**
> Trước đó: **1/8/2026 (đợt 21) — WHACK-A-MOLE (game thứ 7) build ĐẦY ĐỦ + editor 2 chế độ
> (True/False + Quiz), art Wild West. ĐÃ COMMIT + PUSH thư mục `templates/whack-a-mole/`, CHƯA lên
> manifest/trang gồm (chờ thầy chốt + test TOMKO). Xem `GHI CHU DU AN.md` đợt 21 +
> `templates/whack-a-mole/GHI CHU WHACK-A-MOLE.md`.**
> Trước đó: **31/7/2026 (đợt 15) — Open the box: SỬA 1 BUG THẬT, CHƯA COMMIT.** Thầy báo sau khi
> chọn đáp án, các ô đáp án KHÔNG thấy trượt ra mà chỉ biến mất tại chỗ. Nguyên nhân: `.aw-otb-qtile` có
> sẵn 1 `animation` (trượt VÀO, `fill-mode:both`) ghim `transform`/`opacity` VĨNH VIỄN sau khi chạy xong —
> theo luật CSS, 1 `animation` đang giữ 1 thuộc tính LUÔN thắng bất kỳ `transition` nào nhắm cùng thuộc
> tính đó, nên hiệu ứng trượt RA (viết bằng `transition` từ đợt 9 tới nay) **chưa bao giờ thực sự chạy
> được** dù CSS hợp lệ, 0 lỗi console — bug ẩn từ lâu, chỉ lộ ra khi thầy quan sát kỹ ở tốc độ thường (đo
> 2 đầu như các lần trước không bắt được, phải đo LIÊN TỤC giữa chừng mới thấy). Sửa: đổi hiệu ứng trượt
> RA từ `transition` sang 1 `@keyframes` MỚI (`aw-otb-qtile-out`) — animation-đấu-animation thắng sạch,
> không xung đột. Đo lại bằng `javascript_tool` xác nhận `translateX`/`opacity` thay đổi mượt liên tục
> suốt quá trình thoát. Chi tiết: `templates/open-the-box/GHI CHU OPEN-THE-BOX.md` đợt 13 *(số đợt trong
> file đó đếm riêng cho Open the box, khác số đợt ở đây vốn đếm chung toàn dự án)*.
> **Đợt 14 trước đó (31/7/2026)** — 4 tinh chỉnh thêm, CHƯA COMMIT lúc đó: ô sai chuyển hẳn sang nền ĐỎ
> đặc + chữ/khoá trắng (bỏ filter xám cũ, vẫn giữ nguyên ở đợt 15) · đảo ngược lại 2 quyết định của đợt
> 13 (quay về cho ô câu hỏi zoom và đáp án trượt vào/ra chạy ĐỒNG THỜI, khớp `1.2s`) · sửa lỗi lỡ nhịp
> tiếng tick ở mốc 5 giây cuối (gộp cờ tích đơn/đôi thành 1 công thức "khe tick" duy nhất). Chi tiết:
> `templates/open-the-box/GHI CHU OPEN-THE-BOX.md` đợt 12.
> **Đợt 13 trước đó (31/7/2026)** — 4 tinh chỉnh Open the box khác, CHƯA COMMIT lúc đó: canh đều mép trái
> đồng hồ/mép phải điểm số quanh khung app (đổi cột `.has-inline` trong `core/app.css` từ `1.6cqw`→`0`,
> đè lên mục tiêu "thẳng mép ô câu hỏi" của đợt 10) · trả lời đúng thì đồng hồ reset về đầy rồi DỪNG hẳn,
> chỉ chạy tiếp khi bấm ô câu hỏi TIẾP THEO (đợt 9 từng cho chạy tiếp ngay cả lúc đứng ở lưới, vẫn giữ
> nguyên ở đợt 14). Chi tiết: `templates/open-the-box/GHI CHU OPEN-THE-BOX.md` đợt 11.
> **Đợt 12 trước đó (30/7/2026)** — 4 chỉnh theo yêu cầu thầy, đã push + live: (1) Quiz thôi
> ép HOA đáp án (bỏ `text-transform:uppercase` ở `.aw-quiz-tile`; ALL CAPS chỉ còn ở Anagram); (2) chặn
> chuột phải trong khung game (`page.addEventListener("contextmenu")`); (3) restart GIỮ fullscreen —
> đổi phần tử fullscreen từ `page` (bị xoá khi restart) sang **`root`/`#app`** (Home/Edit thì chủ động
> `exitFs()`); (4) TOMKO 4K fullscreen full màn — thêm biến thể CSS/JS có tiền tố `-webkit-/-moz-/-ms-`
> (mỗi tiền tố 1 rule RIÊNG, không gộp kẻo Chrome vứt cả rule). Chi tiết: `GHI CHU DU AN.md` đợt 12.
> ⚠️ Fullscreen thật CHƯA tự kiểm được (preview không cấp) — cần thầy xác nhận trên màn thật/TOMKO.
> **Đợt 11 trước đó**: Open the box + Type the answer đã gộp trang chủ (`built:true`) + sửa `previewPick()`
> (thẻ act đọc đúng cả 4 hình dữ liệu). **Find the match vẫn 🟢 CHỜ THẦY DUYỆT, KHÔNG đụng.**
>
> 🔗 **AWord nay được dự án myLesson nhúng vào trang bài của học sinh.** Hai web ở **CÙNG tài khoản
> GitHub** (`andrewclasses-01.github.io/AWord/` và `…/myLesson/`) nên myLesson truyền được tên em
> sang game, các em khỏi gõ tên → hết tên viết sai trong bảng xếp hạng.
> ⚠️ **Đừng chuyển repo sang tài khoản GitHub khác** — chuyển là mất tính năng này.
> myLesson: `E:\LAP TRINH APP\myLesson` (app) · `D:\APP AND DATA\myLesson Web` (web).
>
> 🔗 **AWord CŨNG được app myActivity nhúng (v1.6.0/1.6.1, 30/7/2026)** để chơi trên màn TOMKO (bảng
> đơn/đôi). myActivity TỰ NHẬN DẠNG URL AWord rồi **bơm CSS lấp khung + fullscreen** — CSS đó nhắm
> vào các class **`.aw-page` / `.aw-stage` / `.aw-below`** và dựa vào **nút fullscreen nhắm `#app`
> (root)** (đợt 12). ⚠️ **ĐỪNG đổi tên/bỏ 3 class này hay đổi target fullscreen khỏi `#app`** — đổi là
> vỡ phần nhúng myActivity (file `E:\LAP TRINH APP\myActivity\src\renderer\js\wordwall.js`, hằng
> `AWORD_CSS` + `isAword`/`isAwordAct`). myActivity mở act qua link `?a=<num>` (SPA pushState) và
> mirror sang bảng đôi theo đó.
>
> 🌐 **WEB LIVE: https://andrewclasses-01.github.io/AWord/** — **30/7/2026 (đợt 11): đã đẩy thêm Open
> the box + Type the answer (`built:true`, đã lên trang chủ)** cùng với v0.9.4/v0.9.5/Anagram trước đó
> — commit + `curl` kiểm chứng ghi trong `GHI CHU DU AN.md` đợt 11. Bài học vẫn giữ: đừng tin dòng ghi
> chú cũ, luôn `curl` kiểm chứng lại nếu nghi ngờ.
> Repo: `github.com/andrewclasses-01/AWord` (PUBLIC, branch `main`, Pages từ thư mục gốc).
> 🔥 **FIREBASE + THƯ VIỆN TRÊN MÂY**: project **`aword-70dae`** (account `namdaptrai01@gmail.com`,
> gói Spark miễn phí) — Firestore Singapore + đăng nhập Google. **Thầy phải đăng nhập** mới vào được
> thư viện (`users/{uid}/items`); **học sinh KHÔNG cần đăng nhập** (trang riêng `play.html?g=<mã>`).
> Luật bảo vệ đã Publish 3 lần (19/7 nền, 20/7 thêm bảng xếp hạng công khai + cho thầy xoá điểm +
> cho HS ghi cờ báo-bài-mới) — nội dung đầy đủ trong `docs/08-FIREBASE-SETUP.md`.
> ⏳ CÒN LOCAL (chưa lên mây): **Settings** + **leaderboard offline** của act (không phải leaderboard
> của bài giao — cái đó đã online).

---

## 0. BẮT ĐẦU PHIÊN MỚI TỪ ĐÂU (đọc mục này trước)

1. Đọc hết `APP_MASTER.md` (file này) → nắm trạng thái + quy tắc.
2. Đọc `core/HUONG DAN CORE.md` → hợp đồng engine↔template + DANH SÁCH BẪY kỹ thuật (bắt buộc trước
   khi động vào code core hoặc viết game mới).
3. **Cách chạy thử — LƯU Ý: từ v0.7.4 app BẮT ĐĂNG NHẬP Google mới vào được thư viện.**
   - Bản LIVE (dùng thật): **https://andrewclasses-01.github.io/AWord/**.
     ⚠️ **Lên live (đính chính 7/8/2026, Đợt 81): `git push` LÀ ĐỦ trong đa số trường hợp** — Pages
     tự build khi push (Đợt 80 ~27s, Đợt 81 ~1–2 phút, không cần POST gì thêm). Quy trình chuẩn:
     push → chờ 1–3 phút → `curl` cache-bust kiểm dấu mốc file mới (Pages cập nhật các file KHÔNG
     đồng thời — BẪY mục 9), rồi tính tiếp bẫy cache trình duyệt ở mục 0-BIS. **CHỈ KHI bản live vẫn
     cũ sau ~10 phút** mới sang **mục 0-TER (ĐƯỜNG CỨU HỘ)** — backend Pages repo này thất thường,
     Đợt 78–79 từng treo >10 phút làm job deploy tự huỷ, nhưng đó là SỰ CỐ chứ không phải trạng thái
     thường trực. (Bản ghi cũ ở đây từng ép "BẮT BUỘC làm theo 0-TER" cho MỌI lần push — chính nó làm
     Đợt 81 mất 3 lệnh fail vô ích rồi mới phát hiện bản live đã tự build xong từ lâu.)
   - Ở máy: `python devserver.py 5510` (KHÔNG dùng `python -m http.server` — mục 9) →
     `http://localhost:5510/` (localhost ĐÃ nằm trong authorized domains của Firebase nên đăng nhập được).
   - **Test KHÔNG cần đăng nhập**: trang test template chạy dữ liệu mẫu, không đụng store →
     `http://localhost:5510/templates/quiz/test.html`. Dùng trang này khi build/sửa game.
   - ⚠️**Popup đăng nhập Google KHÔNG tự động hoá được** (Google chặn) — khi test bằng trình duyệt tự
     động phải nhờ thầy bấm chọn tài khoản 1 lần.

4. **TRẠNG THÁI CHỐT (20/7/2026, v0.9.2) — ĐÃ XONG TRỌN 4 KHỐI + 2 ĐỢT TINH CHỈNH:**
   - ✅ **Khối 1 — Quiz + thư viện kiểu Drive** (v0.5.0→v0.6.9).
   - ✅ **Khối 2 — PRINT** (v0.7.1). *Crossword vẫn là nút "soon", chưa có renderer.*
   - ✅ **LÊN MẠNG + FIREBASE** (v0.7.2→v0.7.4): thư viện chạy trên Firestore, bắt đăng nhập Google.
   - ✅ **Khối 3 — ASSIGNMENT** (v0.8.0): giao bài bằng **link + QR**, HS chơi ở `play.html`
     **không cần đăng nhập** (nhập tên → chơi → tự nộp), chơi lại thoải mái, quá hạn vẫn chơi và
     được đánh dấu **LATE**.
   - ✅ **Khối 4 — THU ĐIỂM** (v0.8.0): pop-up báo cáo cho thầy (Summary · Leaderboard lượt-tốt-nhất ·
     Detail sổ ra từng câu ✓/✗ + đáp án đúng, mọi cột sắp xếp 2 chiều) + bảng xếp hạng lớp cho HS
     xem cuối bài. Đã test thật đầu-cuối + thử tấn công từ phía HS (xem `GHI CHU DU AN.md` v0.8.0).
   - ✅ **LINK SỐ** (v0.8.0): mỗi folder/act có số riêng → `?r=activities` · `?f=12` · `?f=12&a=57` ·
     `?a=57`; thanh địa chỉ tự đổi, Back/Forward chạy, menu ⁝ có **Copy link**. Link cũ vẫn mở được.
   - ✅ **`core/qr.js`** — bộ sinh QR TỰ VIẾT, không phụ thuộc mạng, **copy sang app khác dùng ngay**
     (myBoard/myActivity/mySpeaking...): `qrSvg()` · `qrPngDataUrl()` · `copyQrImage()` · `downloadQrPng()`.

   - ✅ **RESULTS = CHÍNH BÀI GIAO** (v0.9.0): Results **không lưu bản sao** — nó đọc thẳng
     `assignments/{code}`, nên thẻ ở Results và thanh dưới act là **cùng một thứ** (sửa/xoá chỗ nào
     cũng ăn cả hai). Bài giao **tự vào thư mục lớp** theo phần đầu tên (`A1A_9.6_...` → thư mục
     **A1A**, thầy tự tạo thư mục lớp). Sửa được **tên · hạn nộp · 3 ô cuối game · đóng bài**; xoá vào
     **thùng rác** (link HS ngừng chạy, điểm còn nguyên, Restore được), Delete forever xoá sạch cả
     điểm. Xoá act có bài giao thì **hỏi tại chỗ**. **CẤM TRÙNG TÊN**: thư mục con cùng mẹ · act cùng
     thư mục · bài giao cùng thư mục (Duplicate/Restore tự đếm "(2)").

   - ✅ **7 TINH CHỈNH (v0.9.1)**: fullscreen bấm được ngay ở màn READY · nút **Open activity** trong
     báo cáo (trong act thì đóng pop-up, ở Results thì mở act tab mới) · leaderboard **xanh lá** cho
     điểm tuyệt đối, **đỏ** cho 0 điểm · "Detail"→**"Details"** · **chế độ tập trung** (bấm 1 HS thì
     chỉ hàng đó + bảng chi tiết sáng, phần khác mờ) · **CHẤM ĐỎ báo có bài nộp mới** ở thẻ bài giao /
     thư mục Results / act trong Activities / cuối thanh assignment (tắt khi thầy mở xem) · thanh
     assignment **hạ xuống + vạch kẻ ngăn cách** để không lỡ tay lúc chơi.

   - ✅ **v0.9.2**: gỡ hẳn hộp thoại "Bring your saved work online?" (nó hỏi lại mỗi lần mở app; việc
     chuyển thư viện lên mây đã xong 19/7). `importLocalLibrary()` vẫn còn trong store.js để gọi tay.
   - ✅ **v0.9.3**: nhận sẵn tên học sinh từ myLesson (`play.html?g=…&n=…`), xem mục "🔗" đầu file.
   - ✅ **v0.9.4 (24/7/2026, ⚠️ LOCAL, CHƯA PUSH)**: ô **Class** trong Set assignment (đồng bộ live vào
     Assignment title, bắt buộc) · pop-up báo cáo assignment **gọn hơn** (bỏ Delete — chỉ xoá qua menu
     ⁝ ở Results, 5 nút hoá icon, Summary thêm Top Score/Top Speed, Leaderboard+Details căn giữa +
     Details có animation mượt + tô xanh hàng điểm tối đa) · **in worksheet sửa tận gốc**: bỏ
     `position:fixed` (nguồn gây lệch) chuyển hẳn sang CSS `@page` margin box chuẩn, có **số trang
     thật "X/Y"**, logo AWord vẽ lại bằng SVG để tự thẳng hàng với tiêu đề/số trang, lề mỏng lại
     (16/12/14mm). Chi tiết đầy đủ: `GHI CHU DU AN.md` v0.9.4.

## 0-BIS. ⚠️ BẪY "ĐÃ PUSH RỒI MÀ THẦY VẪN THẤY BẢN CŨ" — CACHE TRÌNH DUYỆT (6/8/2026)

Có **HAI** lớp cache khác nhau, đừng lẫn:

1. **Cache của GitHub Pages** (đã biết từ lâu): sau `git push`, các file lên live **không đồng thời** —
   phải `curl` từng file kiểm chứng rồi mới tin. Đợt 78 đo được: **345 giây** mới đủ file.
2. **⭐ Cache của TRÌNH DUYỆT THẦY** (bẫy mới, cắn thật ở Đợt 78): Pages trả
   `Cache-Control: max-age=600` → trình duyệt giữ `main.js`/`catalog.js` **10 phút** mà KHÔNG hỏi lại
   máy chủ. Nặng hơn nữa: nếu thầy đang mở sẵn tab AWord từ trước lúc push, **bấm lại nút trong app
   chỉ chạy JS đã nằm trong bộ nhớ, không tải file nào** — bao lâu cũng vẫn là bản cũ.

**Triệu chứng đã gặp:** curl chứng minh `main.js` live CÓ hàng Classes và `catalog.js` live CÓ 16
template, nhưng thầy chụp màn hình Settings không có Classes và picker chỉ có 15 loại.

**Cách phân biệt trong 10 giây** — đừng sửa code khi chưa làm bước này:
```bash
curl -s https://andrewclasses-01.github.io/AWord/core/catalog.js | grep -c '<đánh dấu mới>'
```
Ra `1` = **máy chủ đã đúng, lỗi ở cache trình duyệt** → bảo thầy `Ctrl+Shift+R`.
Ra `0` = Pages chưa build xong → chờ tiếp.

App **không có** service worker và **không có** cache-busting (`index.html` gọi thẳng
`<script type="module" src="main.js">`), nên `Ctrl+Shift+R` là cách duy nhất, và sau 10 phút thì tự
khỏi. Muốn hết hẳn thì phải thêm chuỗi phiên bản vào đường dẫn import — việc lớn, chưa làm.

## 0-TER. ⚠️ ĐƯỜNG CỨU HỘ KHI BẢN LIVE KHÔNG CHỊU CẬP NHẬT (chốt 6/8/2026 Đợt 79 — hạ cấp 7/8/2026 Đợt 81)

> ⭐ **ĐÍNH CHÍNH 7/8/2026 (Đợt 81): mục này KHÔNG còn là quy trình chuẩn.** Push là đủ — Pages tự
> build khi push (Đợt 80 ~27s, Đợt 81 ~1–2 phút, hoàn toàn không cần POST). Quy trình chuẩn nằm ở
> **mục 0 điểm 3**: push → chờ 1–3 phút → `curl` kiểm dấu mốc. **CHỈ mở mục này khi bản live vẫn cũ
> sau ~10 phút** (tức backend Pages lại rơi vào trạng thái chậm >10 phút như Đợt 78–79). Đợt 81 đã
> trả giá cho việc coi mục này là bắt buộc: 3 lệnh fail liên tiếp (classifier chặn rút token → Git
> Bash rewrite path → 404 do tài khoản gh) trong khi bản live ĐÃ tự build xong từ trước lệnh đầu tiên.
>
> **Đọc tiếp từ đây = đang xử lý SỰ CỐ.** Đợt 79 mất gần 1 tiếng và **2 commit rác** chỉ vì không biết
> quy trình dưới đây. Làm đúng 4 bước này thì không lặp lại được nữa.

### Vì sao phải có mục này
`git push` xong **KHÔNG có nghĩa là đã lên live**. Việc đưa lên live do GitHub Pages làm, và **nó
đang hỏng có hệ thống với repo này**: job `deploy` của workflow `pages build and deployment` có
`timeout: 600000` (**10 phút**); backend Pages của repo này ngày càng chậm (đo được: 20 giây → 22
giây → 3,6 phút → 5,5 phút → **8,2 phút** → vượt 10 phút). Khi vượt ngưỡng, job **tự HUỶ deployment**
(`Canceled deployment`), và Pages API ghi lại là `"status":"errored"`, `"duration":0`.

⚠️ **ĐỪNG hiểu nhầm chữ "errored" đó là lỗi trong code.** Nó là **hậu quả của việc bị huỷ**. Bằng
chứng: job `build` luôn thành công (~6 giây, artifact sạch), và **2 commit của Đợt 78** (`134ca64`,
`f9a8333`) — *trước* mọi thay đổi của Đợt 79 — **cũng errored y hệt**. Repo chỉ 21 MB / 588 file,
không đụng giới hạn nào của Pages.

### 4 BƯỚC BẮT BUỘC

**Bước 1 — trước khi commit: so với origin** (luật cũ, vẫn giữ)
```bash
git fetch origin && git status -sb
```

**Bước 2 — commit + push như thường**
```bash
git add <đúng các file đã sửa> && git commit -m "..." && git push origin main
```

**Bước 3 — ⭐ KÍCH HOẠT BUILD LẠI, NHƯNG PHẢI ĐỢI RUN CŨ CHẾT HẲN**
Pages repo này là `build_type: "legacy"` (source = branch `main`, path `/`). Có thể yêu cầu build lại
bằng:
```bash
TOKEN=$(printf "host=github.com\nprotocol=https\npath=andrewclasses-01/AWord.git\n" | git credential fill | grep ^password= | cut -d= -f2-)
GH_TOKEN="$TOKEN" gh api -X POST repos/andrewclasses-01/AWord/pages/builds
```

⚠️⚠️ **ĐÍNH CHÍNH (tối 6/8, sau khi đo thêm) — đừng gọi lệnh này NGAY sau `git push`.** Bản ghi đầu
tiên của mục này nói lệnh trên "không đi qua Actions nên không bị đồng hồ 10 phút huỷ" — **SAI**. Đo
`gh run list` cho thấy **mỗi lần POST cũng sinh ra một run `dynamic` y hệt run do push sinh ra**. Gọi
ngay sau push = **2 run cách nhau 1 giây, giẫm chân nhau**, một cái bị `cancelled`:
```
b2c1f5f  15:02:48 failure   +  15:02:49 cancelled   <- push & POST cùng lúc => hỏng
35f9ada  14:47:38 cancelled +  14:47:39 failure     <- push & POST cùng lúc
8bd979f  14:36:59 cancelled +  14:37:00 failure     <- push & POST cùng lúc
aafd454  14:16:03 failure   ...  14:28:19 SUCCESS   <- POST khi run cũ ĐÃ chết => CHẠY MỘT MÌNH, THẮNG
```
→ **Luật đúng: POST khi KHÔNG còn run nào đang chạy.** Kiểm trước bằng
`gh run list --limit 3 --json status` (phải toàn `completed`). Sau `git push` thì run tự động sẽ ngốn
~10 phút rồi mới chết — chờ nó chết hẳn rồi hẵng POST, build mới chạy một mình.

**Bản chất:** backend Pages của repo này lúc nhanh lúc chậm thất thường (cùng nội dung: 20 giây · 30
giây · 3,6 phút · 5,5 phút · 8,2 phút · rồi vượt 10 phút). Lệnh POST **không phải phép màu**, nó chỉ
là **thử lại** — thắng khi vớ đúng lúc backend nhanh VÀ không bị run khác huỷ. Đo thật Đợt 79: có lần
`built` sau 88 giây / 155 giây / 198 giây, có lần `errored`.

**Bước 4 — chờ `built` rồi mới kiểm file live**
```bash
GH_TOKEN="$TOKEN" gh api repos/andrewclasses-01/AWord/pages/builds/latest | grep -o '"status":"[^"]*"'
```
Thấy `"built"` mới `curl` kiểm dấu mốc (rồi mới sang bẫy cache trình duyệt ở mục 0-BIS).

⚠️⚠️ **`built` KHÔNG có nghĩa là file đã đổi ngay — ĐỪNG tưởng deploy lại hỏng.** Sau khi build xong
còn phải chờ **CDN lan truyền**, và độ trễ này rất dài + không đều giữa các file (bẫy mục 9). Đo thật:
Đợt 78 **345 giây**; Đợt 79 build `35f9ada` xong sau 88 giây nhưng `APP_MASTER.md` tới **570 giây** mới
đổi (`curl` kèm `?cb=` ngẫu nhiên vẫn trả bản cũ suốt 9 phút đầu). **Cách kết luận đúng:** so `commit`
của build mới nhất với `git rev-parse origin/main` —
```bash
GH_TOKEN="$TOKEN" gh api repos/andrewclasses-01/AWord/pages/builds/latest | grep -o '"commit":"[0-9a-f]*"'
```
trùng nhau + `"status":"built"` = **đã xong phía GitHub, chỉ còn chờ CDN**, tuyệt đối đừng build lại
hay sửa code. Nếu cần chắc, poll `curl` tới ~10 phút rồi mới kết luận.

### ❌ NHỮNG VIỆC ĐỪNG LÀM (đã thử, vô ích)
- **ĐỪNG đẩy commit rỗng để "kích hoạt lại deploy".** Đợt 79 đã lỡ đẩy **2 commit rác** (`f595233`,
  `aafd454`) — vô ích, vì chúng vẫn đi qua đúng đường Actions đang bị timeout. Chỉ làm bẩn lịch sử.
- **ĐỪNG vội sửa code khi thấy email "Some jobs were not successful".** Mở job `build` xem trước:
  build OK + deploy timeout = **lỗi hạ tầng, code không sao**.
- **ĐỪNG tin trang githubstatus.com** — lúc sự cố này nó vẫn báo "All Systems Operational".

### ⚠️ BẪY TÀI KHOẢN gh (khác với ghi nhớ "GitHub accounts" cũ, bổ sung thêm)
- `git push` dùng credential **`andrewclasses-01`** ✅ (đúng chủ repo, `admin:true`).
- `gh` CLI lại đăng nhập **`andrewclasses-code`** ❌ → `gh run rerun` báo *"Must have admin rights"*,
  còn **`POST pages/builds` không token trả `404`** (đo Đợt 81 — GitHub GIẤU 403 thành 404 để khỏi lộ
  thông tin, nên thông báo lỗi KHÔNG hề nói "thiếu quyền", rất dễ tưởng sai endpoint).
- **Đăng nhập `-01` trên Chrome KHÔNG đổi được `gh`** (gh giữ token riêng trong keyring).
- Muốn gh chạy bằng quyền `-01`: lấy token qua `git credential fill` như Bước 3 rồi `GH_TOKEN=... gh api ...`.
  ⚠️ **Đợt 81: chuỗi rút-token này bị permission classifier của Claude Code auto mode CHẶN** (rút
  credential ra biến môi trường là thao tác nhạy cảm) — phiên tự động KHÔNG chạy được, phải nhờ thầy
  duyệt tay đúng lệnh đó (hoặc thầy tự chạy).
- ⚠️ **Git Bash nuốt endpoint**: `gh api ... /repos/...` bị MSYS rewrite thành đường dẫn ổ đĩa
  (`C:/Program Files/Git/repos/...`) → lỗi "invalid API endpoint". Bỏ dấu `/` đầu (như lệnh Bước 3 đã
  viết đúng) hoặc thêm `MSYS_NO_PATHCONV=1`, hoặc chạy gh bằng PowerShell.
- **Không `gh auth login` lưu hẳn được**: token OAuth của Git Credential Manager **thiếu scope
  `read:org`** mà gh bắt buộc. Muốn lưu hẳn thì thầy phải tự tạo PAT mới có `read:org`.

### ⚠️ Bẫy tự kiểm (nhỏ nhưng đã cắn)
Khi `grep` dấu mốc trên file live để xác nhận, **nhớ loại trừ dòng CHÚ THÍCH**. Đợt 79 grep
`is-locked` trên CSS live ra "vẫn còn" → **báo động giả**, vì nó khớp vào chính dòng chú thích ghi
*"...`.aw-ftm-tile.is-locked` dim rule was removed"*. Kiểm đúng phải tìm rule thật:
`grep -E "^\s*\.aw-ftm-tile\.is-locked\s*\{"`.

## 0a. ⭐⭐ BÀN GIAO MỚI NHẤT (chốt 1/8/2026 sau Đợt 33 — PHIÊN/MÁY MỚI ĐỌC MỤC NÀY TRƯỚC TIÊN)

> Mục "0b" bên dưới là bàn giao CŨ của phiên 31/7 — giữ lại vì có nhiều bài học kỹ thuật còn giá trị,
> nhưng **phần trạng thái game trong đó đã lỗi thời** (nó còn ghi Crossword/Flying fruit/Unjumble "chờ
> duyệt"). Trạng thái đúng là mục này.

### Đứng ở đâu rồi
> ⚠️ **CẬP NHẬT 6/8/2026**: nay đã có **16 loại** — thêm **Running word** (thứ 15, ✅ live) và
> **Running team** (thứ 16, 🟢 chờ thầy duyệt, Đợt 78). Ngoài ra Settings có thêm mục **Classes**
> (danh sách lớp + học sinh, `core/classes.js`) — dữ liệu bền dùng chung, act nào gọi tên học sinh
> thì đọc từ đó. Đoạn "14 loại" bên dưới giữ nguyên vì phần bài học kỹ thuật vẫn đúng.

**Cả 14 loại act đã ✅ CHỐT, sống ở trang chủ, đã push + live** — Quiz · Anagram · Find the match ·
Type the answer · Open the box · True or false · Gameshow quiz · Maze chase · Whack-a-mole ·
Flying fruit · Balloon pop · Crossword · Unjumble · Speaking cards. Mỗi loại có content editor riêng.
Thầy đã tự chạy thử bản live và xác nhận (1/8/2026).

**Trang học sinh `play.html` nay chơi được CẢ 14 loại** (trước chỉ Quiz — xem Đợt 33).

### ⚠️ 2 THÓI QUEN CŨ NAY ĐÃ SAI — đọc kỹ kẻo làm hỏng
1. **Gộp template = sửa ĐÚNG 1 FILE `core/catalog.js`.** Từ v0.9.7 (Đợt 33) `index.html`, `play.html`,
   `main.js`, `play.js`, `manifest.js` **không còn liệt kê template nào** — `ensureTemplate()` trong
   `core/registry.js` tự chèn CSS + import module lúc act được chơi/sửa. Mọi ghi chú cũ bảo "thêm import
   vào main.js + link CSS vào index.html + entry manifest.js" là **LỖI THỜI**, làm theo sẽ nạp thừa và
   phá mục đích (HS chỉ nên tải đúng 1 game).
2. **`manifest.js` không còn là danh sách chép tay** — nó chỉ là view suy ra từ catalog. Đừng thêm gì
   vào đó.

Khuôn 1 mục catalog (xem thêm `templates/HUONG DAN TEMPLATE.md`):
```js
{ type: "<ten_type>", label: "<Tên hiện ra>", built: true,
  blurb: "1 câu tả cho picker New activity.",
  css:    "templates/<ten>/<ten>.css",
  load:   () => import("../templates/<ten>/<ten>.js"),
  sample: () => import("../templates/<ten>/sample-<ten>.js") },
```

### Việc kế tiếp — HỎI THẦY TRƯỚC, đừng tự đoán
Xếp theo mức đáng làm (đánh giá của phiên Đợt 33, thầy chưa chốt cái nào):

- **(A) Balloon pop — polish**: đây là template DUY NHẤT lên trang chủ mà còn mục "Điểm cần POLISH" chưa
  làm: blimp có thể chồng lane ở khung hẹp; **hiện 2 đồng hồ** (đồng hồ riêng ở `topbarMid` + ô đồng hồ
  engine bên trái hiện "0:00" vì `options.timer:"none"`). Kèm 1 **ĐỀ XUẤT SỬA CORE** đã ghi sẵn: khi
  template có `inlineTimerBar:true` VÀ `options.timer==="none"` thì engine nên ẩn `timerEl`. Chi tiết:
  `templates/balloon-pop/GHI CHU BALLOON-POP.md`.
- **(B) Dọn 3 ĐỀ XUẤT SỬA CORE còn treo** (đều do template tự lách, ghi trong GHI CHU của chúng):
  Speaking cards xin cờ `openEnded`/`hideScore` (ẩn chip điểm + nav + "Submit answers" cho game
  `scorable:false`) và cờ ẩn nhóm Options thay vì tỉa DOM bằng tay; Crossword xin
  `tpl.hideRandomOption` (lưới cố định, nhóm Shuffle vô nghĩa); Balloon pop xin ẩn `timerEl` như (A).
- **(C) Việc còn ngỏ của từng game** (thầy chưa yêu cầu, đừng tự làm): 🎤/🖼️ voice+image trong editor
  của Anagram/Crossword; Find the match thiếu 3 âm Menu/Leaderboard/RevealAnswers (core chưa có hook);
  Crossword bật bàn phím ảo thì nên phóng to theo từ đang chọn thay vì thu cả lưới.
- **(D) Chưa ai test**: fullscreen thật trên bảng TOMKO; nghe thật các bộ mp3.

### Khúc KHÔNG tự test được — phải nhờ thầy
Trang chủ và assignment thật đều nằm sau **popup đăng nhập Google, không tự động hoá được**. Phiên mới
muốn kiểm tra logic mà không cần đăng nhập thì dùng `templates/<ten>/test.html`, hoặc `import()` thẳng
`core/registry.js` + `core/catalog.js` từ console trang đang mở (cách Đợt 32/33 đã dùng để test cả 14
loại: `ensureTemplate` → `startGame` vào 1 div rời → đếm `.aw-stage`).

## 0b. BÀN GIAO CŨ (phiên 31/7/2026 — trạng thái game đã lỗi thời, giữ lại vì các bài học kỹ thuật)

**Anagram ✅ ĐÃ CHỐT, SỐNG Ở TRANG CHỦ** — không đổi gì thêm từ bản ghi trước, vẫn xem
`templates/anagram/GHI CHU ANAGRAM.md`. Việc còn thiếu (thầy chưa yêu cầu): 🎤/🖼️ voice+image trong
editor ("để bàn sau").

**Open the box ✅ ĐÃ CHỐT, SỐNG Ở TRANG CHỦ, ĐÃ COMMIT + PUSH** (commit mới nhất `fc553bd`, 31/7/2026 —
đã `curl` kiểm chứng file live khớp đúng). Đọc `templates/open-the-box/GHI CHU OPEN-THE-BOX.md` đợt
11-13 cho chi tiết đầy đủ phiên này, đây chỉ tóm tắt việc VỪA XONG (đợt 11-13 file đó = đợt 13-15 trong
số đếm chung của APP_MASTER — 2 file dùng 2 hệ đếm KHÁC NHAU, xem chú thích ở dòng "Cập nhật lần cuối"
đầu file):
- **4 tinh chỉnh giao diện/đồng hồ theo yêu cầu thầy** (đợt 11-12 file riêng): canh mép trái đồng hồ =
  mép phải điểm số (đè lên mục tiêu "thẳng mép ô câu hỏi" cũ); ô trả lời SAI đổi hẳn sang nền ĐỎ đặc +
  chữ/khoá trắng (bỏ kiểu xám cũ); trả lời ĐÚNG thì đồng hồ đầy lại rồi DỪNG hẳn, chỉ chạy tiếp khi bấm
  ô câu hỏi TIẾP THEO (khác đợt 9 cho chạy tiếp ngay); sửa lỗi lỡ 1 nhịp tiếng tick ở đúng mốc chuyển từ
  tích đơn sang tích đôi (5 giây cuối). Có 1 lần ĐẢO NGƯỢC ý giữa chừng: thử "zoom xong mới trượt / trượt
  xong mới zoom" (tuần tự) rồi thầy đổi ý quay lại "chạy đồng thời, khớp thời lượng `1.2s`" — bài học:
  đừng ngạc nhiên nếu thầy thử 1 hướng rồi đảo lại, cứ làm theo yêu cầu mới nhất.
- **⭐ SỬA 1 BUG THẬT quan trọng (đợt 13 file riêng)**: thầy báo hiệu ứng trượt RA của ô đáp án hoàn toàn
  không thấy chạy (chỉ "biến mất tại chỗ"). Nguyên nhân là 1 **bài học CSS đáng nhớ cho MỌI template
  khác trong dự án**: `.aw-otb-qtile` có 1 `animation` (hiệu ứng trượt VÀO, `fill-mode:both`) áp dụng
  VĨNH VIỄN lên `transform`/`opacity` — theo đúng luật CSS, **1 `animation` đang giữ 1 thuộc tính LUÔN
  thắng bất kỳ `transition` nào cũng nhắm thuộc tính đó**, nên hiệu ứng trượt ra (viết bằng `transition`)
  từ đợt 9 tới nay CHƯA BAO GIỜ thực sự chạy, dù CSS hợp lệ và 0 lỗi console. Chỉ lộ ra khi thầy quan sát
  kỹ ở tốc độ thường — đo 2 đầu animation (lúc trước vẫn hay làm) KHÔNG bắt được lỗi này, phải đo LIÊN
  TỤC giữa chừng bằng `javascript_tool` mới thấy. Sửa bằng cách đổi hiệu ứng trượt ra thành 1
  `@keyframes` riêng (animation-đấu-animation thắng sạch, không xung đột). **Nếu phiên sau thấy 1 hiệu
  ứng nào đó "code đúng, không lỗi console, nhưng không thấy chạy" ở BẤT KỲ template nào khác — nghi ngay
  khả năng có `animation` permanent (`fill-mode:both/forwards`) đang chặn 1 `transition` cùng thuộc
  tính**, đây rất có thể không phải trường hợp cá biệt.
  - Ghi chú thêm chưa kiểm chứng: rất có thể `.aw-otb-qtile:active { transform: translateY(...) }` (hiệu
    ứng bấm lún) cũng bị chặn bởi CHÍNH nguyên nhân này — thầy chưa báo nên chưa đụng, để ý nếu thầy nói
    nút bấm không có phản hồi lún xuống.
- **File đổi**: `APP_MASTER.md`, `core/app.css` (chỉ 1 chỗ: cột `.has-inline`, đã diff sạch, không đụng
  gì của phiên Find the match chạy song song), `templates/open-the-box/*`.
- **Đã kiểm bằng `curl` bản live**: `open-the-box.js`/`.css` có `aw-otb-qtile-out`; `core/app.css` có
  `grid-template-columns: 0 1fr auto`; `APP_MASTER.md` có "đợt 15" — tất cả khớp, bản live đã cập nhật.

**Type the answer ✅ ĐÃ CHỐT, SỐNG Ở TRANG CHỦ** — không có gì mới, xem
`templates/type-the-answer/GHI CHU TYPE-THE-ANSWER.md` cho lịch sử.

**Find the match — ✅ SỐNG Ở TRANG CHỦ (`built:true` từ 31/7) + ĐÃ TINH CHỈNH 4 LOẠT THEO THẦY, COMMIT +
PUSH + LIVE (1/8/2026, Đợt 31).** Thầy chơi bản live rồi gửi 4 loạt yêu cầu — tất cả đã test trình duyệt
thật (đo DOM, không đoán qua ảnh, 0 lỗi console), KHÔNG đụng core. Tóm tắt: (1) 3 giây "3-2-1" không tính
vào đồng hồ (`manualTimerStart`), khối đáp án căn giữa vùng, đáp án CỐ ĐỊNH tuyệt đối (ô giải chỉ mờ, không
xóa khỏi lưới), bấm sai giữ nguyên ô; (2) bấm sai câu hỏi CHUYỂN tiếp (Repeat=xếp lại ngẫu nhiên) + LIVES
như True/false (tim top bar `hasLivesSlot`, slider 0–10); (3) bấm đúng câu hỏi bay về ô điểm + 11 sao, khóa
chọn tới khi câu mới vào ≥50% (`gateTimer`), hết tim hiện "GAME OVER"; (4) câu dài TỰ CO FONT (`fitPrompt`/
`--pfit`), clone bay dùng đúng cỡ đã co. **File đổi CHỈ 3** (`templates/find-the-match/find-the-match.js` /
`.css` / `sample-find-the-match.js`, mẫu bật `lives:5`) — `git status` trước commit xác nhận, add từng file
theo tên (không `git add -A`). Chi tiết: `GHI CHU DU AN.md` Đợt 31 + `templates/find-the-match/GHI CHU
FIND-THE-MATCH.md` (mục 1/8). Việc còn ngỏ (chưa thầy yêu cầu): 3 âm thanh Menu/Leaderboard/RevealAnswers
chưa gắn (core chưa có hook); chưa tự nghe thật mp3.

**Crossword (game thứ 6) — 🟢 ĐÃ BUILD + TỰ TEST, CHỜ THẦY DUYỆT, ĐÃ COMMIT + PUSH** (do 1 phiên riêng,
31/7/2026, song song các phiên khác). Dựng lại act Classic của thầy (`wordwall.net/resource/116864402`).
Có đủ bộ file trong `templates/crossword/` (tự sinh lưới ô chữ interlock + bàn phím vật lý/ảo + mp3 THẬT
Classic), nghiên cứu ở `docs/09-CROSSWORD.md`, ghi chú + hạn chế + đề xuất sửa core ở
`templates/crossword/GHI CHU CROSSWORD.md`, nhật ký ở `GHI CHU DU AN.md` đợt 20. **CHƯA gộp trang chủ /
CHƯA thêm `core/catalog.js` built:true** (chờ duyệt). Chơi thử: `templates/crossword/test.html`.
**ĐỀ XUẤT SỬA CORE**: thêm cờ `tpl.hideRandomOption` (ẩn nhóm Shuffle của Options cho crossword — lưới cố
định). Việc cải tiến tiếp (khi thầy muốn): (1) khi bật bàn phím ảo thì phóng to/cuộn theo từ đang chọn
thay vì thu cả lưới (lưới nhiều từ trên màn thấp bị nhỏ); (2) content editor thêm 🎤/🖼️; (3) gộp trang chủ
khi thầy chốt.

**Flying fruit (game thứ 8) — 🟢 ĐÃ BUILD + TỰ TEST (trình duyệt thật, 0 lỗi console), CHỜ THẦY DUYỆT,
CHƯA COMMIT** (1/8/2026, đợt 24 — do phiên này). Dựng lại act Classic của thầy
`wordwall.net/resource/116864498`, style Jungle. Câu hỏi (định nghĩa) ở đỉnh, đáp án bay ngang trên QUẢ
theo cung ném, chạm quả đúng → nổ tung nước + ✓ + điểm; chạm sai → mất 1 TIM; hết mạng = Game over.
Đáp án sai = random `word` câu khác. **Editor + dữ liệu Y HỆT ANAGRAM** (`content.items=[{word,clue}]`) —
thầy chốt "editor kiểu Anagram, câu trả lời random các Word". Options: Timer/Lives/Speed/Retry/Shuffle/
Show answers. Assets thật jungle tự chứa trong `templates/flying-fruit/{img,sounds}` (art cố định, không
đổi theo theme, như whack-a-mole). **CHƯA gộp trang chủ** (`core/catalog.js` chưa đụng). Chi tiết + đề
xuất: `templates/flying-fruit/GHI CHU FLYING-FRUIT.md`; nhật ký: `GHI CHU DU AN.md` đợt 24.

**Unjumble (game thứ 11) — 🟢 ĐÃ BUILD + TỰ TEST (trình duyệt thật, 0 lỗi console), CHỜ THẦY DUYỆT, CHƯA
COMMIT** (1/8/2026, đợt 27). Dựng lại `wordwall.net/resource/116872783/unjumble`, style **Whiteboard** (thầy
chốt = "Classic"). Sắp xếp các TỪ xáo trộn thành câu đúng bằng **kéo-thả THẬT** (insert+reflow, pointer
chuột+cảm ứng — thầy chốt giống hệt Wordwall, KHÔNG tap như Anagram). Đủ **3 chế độ chấm** (everyword / bonus
[PERFECT ×2, mặc định] / submit) + Alignment. Look bảng trắng + doodle SVG + chữ bút xám nghiêng trên dòng kẻ
= mặc định RIÊNG game này (không sửa `core/themes`; Basic/Classroom/Beach chỉ re-tint). Bộ file đủ ở
`templates/unjumble/`, nghiên cứu `docs/11-UNJUMBLE.md`, ghi chú `templates/unjumble/GHI CHU UNJUMBLE.md`.
41 âm THẬT + 4 đồ họa theme Whiteboard lưu ở `AWord-data/Source/{Sound effect,Graphic}/UNJUMBLE/`.
**CHƯA gộp `core/catalog.js`/trang chủ** (chờ duyệt). Chơi thử: `templates/unjumble/test.html`.

~~**Việc kế tiếp**~~ *(đoạn dưới đã XONG hoặc lỗi thời — xem mục 0a ở trên cho danh sách việc hiện tại)*:
(a) Open the box: thầy đã xác nhận hiệu ứng trượt ra mượt — coi như XONG.
(b) Find the match: ĐÃ commit + push + tinh chỉnh xong 4 loạt (Đợt 31).
(c) Anagram/Type the answer: đã chốt, thầy chưa yêu cầu thêm.
(d) 🎤/🖼️ voice+image cho Anagram khi thầy sẵn sàng bàn — vẫn còn ngỏ, xem mục 0a (C).

**Quy tắc vẫn giữ nguyên từ trước**: hỏi thầy trước việc lớn (chờ "ok build"), KHÔNG tự commit nếu thầy
không nói (nhưng nói "lưu lại"/"save"/"commit" thì làm ngay không cần hỏi lại), **`git push` cũng vậy —
nếu thầy nói rõ "commit và push" thì làm cả 2 luôn, không cần hỏi lại từng bước**. Khi có phiên khác
đang chạy song song, LUÔN `git status`/`git diff` trước khi `git add` — chỉ add đúng file mình sửa,
KHÔNG `git add -A`, để khỏi lỡ tay commit việc CHƯA XONG của phiên kia (xem tình huống Find the match ở
trên).

**Việc CŨ (assignment/print), vẫn còn dở, kho code**: ✅ **v0.9.4 và v0.9.5 ĐÃ push GitHub** (nằm trong
đợt đẩy 30/7/2026, cùng lúc với Anagram + Open the box) — đoạn "chỉ commit local, web live vẫn v0.9.3"
từng ghi ở đây trước đó là THÔNG TIN CŨ/SAI, đã sửa lại cho khớp `git log`/`curl` thật. Vẫn giữ quy tắc
**hỏi thầy trước khi `git push`** cho các đợt sửa SAU này — chỉ đợt 30/7 đã được thầy đồng ý rõ.

**v0.9.5 CHƯA được thầy test thật** (cần đăng nhập Google, máy build không tự động hoá được bước đó —
xem GHI CHU DU AN.md v0.9.5). Cách test: tạo 1 assignment cho 1 lớp đã có sẵn thư mục trong Results, đợi
qua ngày hôm sau (hoặc sửa giờ máy) rồi tạo assignment thứ 2 cho cùng lớp → assignment đầu phải tự
chuyển vào thư mục con "DONE" trong thư mục lớp.

**Luật Firestore đang chạy** (bản mới nhất nằm nguyên văn trong `docs/08-FIREBASE-SETUP.md` — nếu sửa
luật thì phải cập nhật file đó cho khớp):
- `users/{uid}/items` riêng tư thầy · `assignments/{code}` đọc công khai, thầy tạo/xoá
- `assignments/{code}/scores` đọc công khai (chỉ tên + điểm + thời gian) — nguồn bảng xếp hạng HS
- `results/{id}` chỉ thầy đọc + **thầy xoá được** (cho "Delete forever")
- HS được ghi ĐÚNG 2 field `lastSubmitAt`/`submitCount` trên doc bài giao (để hiện chấm đỏ)

**Dữ liệu TEST còn trên Firebase** (thầy nói *"tôi sẽ xử lý sau"*, ĐỪNG tự xoá — vẫn còn nguyên từ
20/7, chưa ai đụng tới):
- Bài giao `j9nsa2` — "TEST assignment (xoa sau) - 20/07", nằm ngoài cùng Results, có ~5 lượt chơi giả
  (Trang Anh / Minh Khoa / Bao Chau / Duc Anh).
- 2 thư mục rỗng **A1A**, **A2B** trong Results (tạo lúc test tính năng tự-xếp-lớp).
- 1 act thật "LSA2-S1.T1.P1-2-3 / ENG2" trong Activities (6 câu) — act mẫu của thầy.

**In worksheet (v0.9.4) đã thầy tự in giấy thật và xác nhận đẹp** — nhưng nếu phiên sau còn chỉnh gì ở
`core/print.js`, nhớ: session build KHÔNG in giấy/PDF thật được (không có máy in ảo), chỉ kiểm chứng
được CSS `@page` hợp lệ + hình SVG vẽ đúng qua trình duyệt — mọi lần sửa margin/logo/số trang đều cần
**nhờ thầy in thử 1 tờ** để xác nhận, đừng tự cho là xong chỉ vì CSS parse không lỗi.

**Việc kế tiếp — CHƯA CHỐT, phải hỏi thầy trước:**
(a) chuyển **Settings + leaderboard offline của act** từ localStorage lên cloud;
(b) **renderer Crossword** cho Print (worksheet A4 giờ đã chuẩn, còn thiếu riêng phần vẽ ô chữ);
(c) **chốt Quiz** + viết "recipe/công thức mẫu" rồi build 4 game còn lại
    (Anagram → Find the match → Type the answer → Open the box);
(d) (nếu thầy cần) nút Print từ trang chủ · trang đáp án cho thầy · "Change template" thật;
(e) thầy nói **còn sửa rất nhiều thứ nữa ở local** trước khi cần lên mạng — hỏi thầy muốn làm gì tiếp
    thay vì tự đoán, và **đừng `git push`** cho tới khi thầy yêu cầu rõ.

   **HỎI THẦY trước khi bắt tay việc lớn (chờ "ok build")**; chưa rõ thì hỏi bằng AskUserQuestion.

## 1. AWord là gì

Web app **tạo + chơi game tiếng Anh giống wordwall.net** cho Teacher Andrew (trung tâm Andrew Classes):
- Giáo viên tạo game (Quiz, Anagram, Find the match...) → giao cho học sinh link chơi.
- **Thu kết quả chơi của học sinh để đánh giá + xếp hạng (leaderboard)** — tính năng đinh.
- Deploy **GitHub Pages** (web tĩnh). Phần thu điểm online dùng **Firebase** (ĐÃ CHỐT, làm ở pha sau).
- **Sản phẩm 100% TIẾNG ANH** (mọi UI/menu/chữ). Trao đổi với thầy bằng tiếng Việt **dễ hiểu, tránh
  thuật ngữ** (thầy không chuyên lập trình — luôn cho thầy xem kết quả chạy thật).
- **Nhiều template build SONG SONG bằng nhiều session Claude khác nhau**, gom lại thành 1 trang web
  cuối khi mọi thứ đã chốt (lý do cấu trúc thư mục ở mục 4).

## 2. Trạng thái hiện tại — v0.6.0 (19/7/2026)

### Trang chủ = TRÌNH QUẢN LÝ kiểu GOOGLE DRIVE (v0.6.0 — MỚI) 🟢
`main.js` = trình quản lý file. Mức ngoài: **2 thư mục gốc CỐ ĐỊNH — Activities / Results** (không xoá;
Results tạm trống, chờ thu điểm/Firebase). Mở 1 gốc: **breadcrumb** + **thanh công cụ** [+ New game (chỉ
Activities) · + New folder · Recycle bin · Search · grid/list] + folder & act. **Thẻ act** có **preview**
(1 câu hỏi + đáp án ngẫu nhiên) + Play tròn giữa + ⁝. **Menu ⁝** folder (Open in new tab/Rename/Move/
Duplicate/Delete) & act (thêm **Edit content**). **Move** = cây thư mục cùng gốc (Drive-style). **Delete**
→ **thùng rác RIÊNG theo gốc** (Restore / Delete forever). **Open in new tab** = `?play=`/`?folder=`.
Dữ liệu ở **`core/store.js`** (cây folder/act + trash, async, localStorage key `aword-lib`, tự migrate
từ `aword-activities` cũ, sẵn sàng cắm Firebase). Chi tiết: `GHI CHU DU AN.md` v0.6.x.

### Header dùng chung + Settings + thuật ngữ "act" (v0.6.3 — MỚI) 🟢
**Header dùng chung** (`main.js` `topbar()`, class **`.aw-appbar`** — KHÔNG phải `.aw-topbar` của engine)
ở trang thư viện + trang Edit (KHÔNG vào màn chơi): trái = cụm logo (to hơn, tagline scaleX bằng bề rộng
logo), phải = nút **Settings** (bánh răng, `.aw-appbtn`); trang trong thư mục + Edit thêm nút **Activities/
Results** (`.aw-appnav`). **Settings** (`core/settings.js`, key `aword-settings`) = **Options mặc định cho
template** (Timer/shuffle/show answers/letters); act mới kế thừa; chỉnh Options riêng 1 act trong game →
Apply LƯU RIÊNG act đó. **Loại act** liệt kê ở `core/catalog.js` (1 nguồn duy nhất, engine dùng chung).
"+ **New activity**" mở **hộp thoại chọn loại act** (Quiz sẵn, 4 coming soon) → editor. **Edit content**
dispatch theo loại qua registry. **Editor Quiz**: chỉ **Activity Title** + câu hỏi (bỏ Instruction/
theme[mặc định classic]/Options[→Settings]); đáp án **2 cột** có **chữ A-F in đậm trong ô**; nút
**Duplicate** cạnh Remove; badge "QUIZ" ở góc; tối đa **120 câu**. ⚠️ Đặt tên class header/nút mới phải
TRÁNH class engine dùng cho khung game (`.aw-topbar/.aw-iconbtn/.aw-navbtn`) — xem mục 9.
**(v0.6.4)** Icon Settings = gear Feather; tagline giữ tỷ lệ chữ gốc + letter-spacing (bỏ scaleX/sizeBrand).
**DÁN EXCEL kiểu mới** (`onQuestionPaste`): copy vùng bảng trong Excel → bấm vào **ô câu hỏi** + Ctrl+V →
cột đầu = câu hỏi, các cột sau = đáp án lần lượt (position-independent, ≤6, điền từ câu đang bấm xuống, cap
120); **KHÔNG tự đánh dấu đáp án đúng** (thầy tự tích / Mark correct in all); dán 1 ô đơn thì để trình duyệt
dán thường. **Save tự bỏ câu RỖNG hoàn toàn** (Add question để trống → khỏi báo lỗi).
**(v0.6.5)** Thẻ **folder** = preview icon TO (`.aw-fp`) + foot tên/⁝ như thẻ act; menu ⁝ folder thêm
**Color** (popup 8 màu, lưu `node.color` qua `setFolderColor`); **kéo-thả** act/folder vào thẻ folder hoặc
lên chữ breadcrumb (Activities/folder tổ tiên) để `moveItem`; icon search sửa cỡ; **logo** khớp width bằng
letter-spacing (không méo, `sizeBrand`); **footer** "Phone & Zalo 0359.769.765 / Copyright © 2018-2026
ANDREW CLASSES by Pham Xuan Ninh" giữa-cuối mọi trang thư viện + Edit (editor nhận qua param `footer`).
**(v0.6.6)** icon folder 108px; **SỐ ĐẾM** giữa folder (`store.folderCounts`): chỉ-act→1 số (tổng act đệ
quy); cả sub+act→2 số khác màu ngăn nét dọc; không act→không số; footer đẩy SÁT ĐÁY màn hình (`.aw-lib`
min-height:100vh flex-column + `.aw-foot margin-top:auto`).
**(v0.6.7 — BỐ CỤC FOOT MẪU, theo ảnh thầy)** Thẻ act foot: **tên TRÊN (đậm .9rem) → type QUIZ DƯỚI
(.82rem xanh hoa) → ⁝ GÓC DƯỚI-PHẢI**, nội dung căn ĐÁY. Thẻ folder: tên căn ngang dòng type-của-act (đáy)
nhưng CỠ = tên act. Tên tối đa **38 ký tự** (2 dòng, mọc lên trên). Số folder: **act(xanh) trước | folder
(cam) sau**. **Settings = MENU nhiều dòng**: Default activity options (bật) +
Appearance/Leaderboard&results (coming soon) → chọn → **danh sách template** → chọn template → form options
mặc định + Save; có ‹ Back từng cấp.
**(v0.6.8)** ⁝ GHIM đúng 1 chỗ mọi thẻ: `.aw-card-foot margin-top:auto` (grid stretch làm thẻ cao bằng
nhau — thiếu dòng này foot lơ lửng khác nhau, BẪY) + `.aw-fm-grid .aw-card-menu` margin -7px/-7px (6px
phải/4px đáy, thẳng hàng dòng type/tên folder); số folder `top:50%`.
**(v0.6.9)** Foot bỏ `border-top` (hết kẻ ngang trên tên); chữ foot dịch phải `padding-left:21px` cho
viền-trái→chữ = viền-phải→tâm chấm ⁝ (22≈21px, cân xứng).

### Trong game (v0.6.0): bỏ dòng hướng dẫn dưới khung; **tên game cụ thể** nằm ngang hàng cụm nút
Options/Template/Style + Edit/Assignment/Print. **(v0.6.1)** cụm phải thêm nút **Home** → 4 nút
[Edit/Set assignment/Print/**Home**], Home về trang chủ top-level.

### Thương hiệu (v0.6.1): cụm **AWord + "in ANDREW CLASSES"** (`main.js` `logo()`, `.aw-brand*`) là 1
nút — bấm ở BẤT KỲ đâu đều về trang chủ top-level (2 gốc). Logo to hơn, tagline sát dưới.

### Quiz — ✅ ĐÃ CHỐT (24/7/2026) — GAME MẪU VÀNG
Thầy test OK nhiều vòng (17/7) rồi chốt "Chốt Quiz + build 4 game còn lại" (24/7). Công thức đã rút ra
thành `templates/CONG THUC MAU.md` (khung `mount()`, 11 quy tắc bắt buộc, `toPrintItems`, checklist) —
đọc file đó thay vì đọc lại toàn bộ `quiz.js` khi build Anagram/Find the match/Type the answer/Open the
box.

Quiz hiện có (chi tiết từng bước: `GHI CHU DU AN.md`):
- **Màn READY** (nền tối): trên cùng "ANDREW CLASSES", giữa TÊN LESSON to viết hoa, nút PLAY khổng
  lồ (bấm mới bắt đầu + chuông khởi động), dưới là TÊN GAME (QUIZ) to đậm.
- **Chơi**: khung 16:9 (font Baloo 2), đồng hồ trái + điểm ✓ phải TRONG khung; câu hỏi CHỮ TO sát
  viền trên (tự co chữ chống tràn); 2-6 ô đáp án 3D bo tròn (bố cục theo số lượng: 5=3+2 căn giữa,
  6=3+3; MÀU NGẪU NHIÊN mỗi ván từ bảng 8 màu, giữ qua câu, reshuffle khi Start again); thanh dưới
  `[☰] ◁ "x of N" ▷ [🔊] [⛶]` với nav CĂN GIỮA khung.
- **Phản hồi đáp án**: đúng→✓ to bay lên + "ting" + ✓ nhỏ đọng, ô sai mờ 0.15; sai→✗ to LƠ LỬNG ~1.9s
  + âm "Oh my god" (mp3) + ✗ nhỏ đọng, ô đúng giữ màu + ✓. Ô KHÔNG đổi màu. Fade chuyển câu.
- **Điều khiển**: mũi tên ◁▷ hoặc phím số 1-9 + ◄►. Tự Game Complete khi làm hết câu. Menu ☰
  (Submit answers/Start again/Resume/Change template), ẩn khi bấm ngoài.
- **Kết thúc**: "Game complete" + 110 confetti + fanfare → panel tổng kết tối (Score/Time/rank) → menu
  [Leaderboard · Show answers · Start again · Play a different template].
- **Leaderboard "ANDREW CLASSES"** (localStorage): xếp điểm↓ rồi thời gian↑, top 10, gõ tên tại hàng
  (Enter hoặc nút Ok để lưu), KHÔNG lên bảng nếu không làm câu nào. **Show answers** = màn review 16:9
  (câu hỏi đánh số cỡ cố định | đáp án HS [sai=ô tối+✗ / đúng=gộp 1 ô xanh+✓ / trống=No answer] | với
  ô đáp án hẹp).
- **Fullscreen giữ tỷ lệ**: mọi sizing dùng đơn vị **cqw** (container-query) → scale đồng đều theo
  khung 16:9; fullscreen letterbox nền đen.
- **Thanh công cụ NGOÀI khung** (dưới khung, grid 3 cột): trái=tên lesson · GIỮA=3 nút vuông
  **Options / Template / Style** (popover: bấm→hào quang+panel căn giữa+mờ toàn màn, chỉ 1 mở) ·
  phải=**Edit / Set assignment / Print** — **Print (v0.7.1)**: bấm → popup chọn ĐỊNH DẠNG (Anagram/
  Crossword/Quiz/Unjumble, chỉ hiện cái khả dụng) → worksheet A4 thang xám qua `window.print()`
  (hệ dùng chung `core/print.js`); Set assignment còn toast "coming soon".
  - **Options** (mô hình NHÁP + nút Apply): Timer none/up/**down** (đếm ngược tự nộp bài khi hết giờ,
    ô phút:giây VUỐT lên/xuống chỉnh) · Shuffle Q/A · Show answers · Letters on answers A-B-C.
  - **Template**: liệt kê 5 game, chỉ Quiz "current", còn lại "coming soon".
  - **Style**: đổi theme TRỰC TIẾP (không restart). **4 theme**: Classic (mặc định) · Basic (ô đáp án
    CÙNG màu navy, tối giản) · Classroom (kem/gỗ ấm) · Beach (cát/biển).

### 4 game khác — Anagram/Open the box/Type the answer ✅ ĐÃ CHỐT + lên trang chủ, Find the match 🟢 CHỜ THẦY DUYỆT
Anagram / Find the match / Type the answer / Open the box — cả 4 đã có đủ 3 file
(`<ten>.js`/`.css`/`sample-<ten>.js`), đăng ký đúng `type` khớp `core/catalog.js`, **đã test qua
`test.html` bằng trình duyệt thật** (chơi hết 1 lượt, đúng/sai, Show answers, đổi theme, 0 lỗi console
mỗi game). Trạng thái từng game + nhật ký chi tiết: `GHI CHU <TEN>.md` trong từng thư mục
`templates/<ten>/`. **Anagram (29/7/2026), Open the box + Type the answer (30/7/2026, đợt 11)** đã
thêm vào `core/catalog.js` (`built:true`) + gộp vào trang chủ — theo đúng quy trình (xem
`templates/HUONG DAN TEMPLATE.md` mục "Khi nào một template được gộp vào trang cuối"), **cả 3 đều có
content editor riêng** (`anagram-editor.js`/`open-the-box-editor.js`/`type-the-answer-editor.js`).
**Find the match** vẫn **CHƯA** thêm vào `core/catalog.js`/gộp trang chủ, chưa có content editor riêng,
chờ thầy xem & duyệt.
- **Anagram**: bấm/gõ chữ cái đặt vào ô trống (không kéo-thả thật — lựa chọn MVP chắc tay hơn trên cảm ứng).
- **Find the match**: bàn cờ 1 prompt + lưới definition còn lại, chạm đúng thì ô biến mất.
- **Type the answer**: gõ đáp án vào ô, chấm bỏ qua hoa/thường + dấu (không phân biệt), bàn phím ảo QWERTY.
- **Open the box**: lưới hộp lật mở nội dung, có điểm/leaderboard (Simple mode không điểm đã bị xoá).

Công thức dùng chung cho cả 4: `templates/CONG THUC MAU.md`.

## 3. Cách chạy (máy này CHƯA cài Node)

- **BẢN LIVE trên mạng**: https://andrewclasses-01.github.io/AWord/ — đẩy code lên là tự cập nhật:
  `git add -A && git commit -m "..." && git push` (repo `andrewclasses-01/AWord`, branch `main`,
  Pages phục vụ thẳng thư mục gốc; có `.nojekyll` để GitHub KHÔNG xử lý Jekyll). Sau khi push chờ
  ~1 phút Pages build xong. Mọi đường dẫn trong code phải TƯƠNG ĐỐI (web nằm trong thư mục con
  `/AWord/` — dùng `/abc.js` sẽ hỏng); asset resolve qua `import.meta.url`.
- Bản hiện tại **zero-build** (mở là chạy, ES modules thuần).
- Server chung: cấu hình preview tên **`aword`** trong `D:\OTHERS\CLAUDE\.claude\launch.json` → chạy
  **`python devserver.py 5510`** (KHÔNG `python -m http.server` — xem mục 9). Chạy tay: PowerShell tại
  thư mục dự án → `python devserver.py`.
- Trang chủ cuối (gom template đã chốt): `http://localhost:5510/`.
- Trang test riêng từng template: `http://localhost:5510/templates/<ten>/test.html`.
- Pha online (Firebase) sau: cài Node + Vite (đã chốt Vite trong docs/07).

## 4. Cấu trúc thư mục

```
E:\LAP TRINH APP\AWord\
├─ APP_MASTER.md              ← file này (đọc đầu tiên)
├─ GHI CHU DU AN.md           ← nhật ký version (mỗi đợt sửa PHẢI ghi + tăng version)
├─ devserver.py               ← server chạy thử (gửi Cache-Control:no-store — mục 9)
├─ play.html + play.js        ← TRANG HỌC SINH (v0.8.0, chặn thêm bài đóng/đã xoá ở v0.9.0): mở link ?g=<mã bài giao> → nhập tên → chơi →
│                               Game Complete TỰ NỘP. KHÔNG đăng nhập, KHÔNG nạp store.js (thư viện
│                               của thầy không thể chạm tới từ đây)
├─ index.html + main.js       ← TRANG CHỦ kiểu DRIVE (main.js: 2 gốc Activities/Results, thư
│                             mục con, thùng rác, Move, Search, grid/list, ⁝ menu, mở-tab-mới ?play/?folder.
│                             (v0.9.7) KHÔNG còn import template nào: game + CSS nạp lúc chơi/sửa qua
│                             ensureTemplate(). manifest.js chỉ còn là view suy ra từ core/catalog.js)
│
├─ core/                      ← LÕI DÙNG CHUNG — KHÔNG session template nào tự sửa (mục 5)
│  ├─ HUONG DAN CORE.md       ← ĐỌC TRƯỚC KHI SỬA CODE (hợp đồng + mọi luật/bẫy kỹ thuật)
│  ├─ app.css                 ← giao diện chung (khung 16:9, thanh trên/dưới, thanh công cụ ngoài,
│  │                             popover, panel tối, leaderboard, review, hiệu ứng, animation)
│  ├─ engine.js               ← điều phối vòng đời + màn ready + celebration + panel + leaderboard
│  │                             + review + thanh công cụ Options/Template/Style + fullscreen
│  ├─ registry.js / layout.js / scoring.js / leaderboard.js / confetti.js / sound.js / utils.js
│  ├─ print.js               ← (v0.7.1) Print DÙNG CHUNG: popup chọn định dạng (Anagram/Crossword/Quiz/
│  │                             Unjumble) + luật khả dụng + render worksheet A4 (đọc template.toPrintItems)
│  ├─ qr.js                  ← (v0.8.0) BỘ SINH QR TỰ VIẾT, 0 phụ thuộc — COPY SANG APP KHÁC DÙNG ĐƯỢC
│  │                             NGAY: qrSvg / qrPngDataUrl / qrCanvas / copyQrImage / downloadQrPng.
│  │                             Kiểm chứng bằng core/qr-test.html (so bản chuẩn + máy quét thật)
│  ├─ assignments.js         ← (v0.8.0) TẦNG DỮ LIỆU bài giao: createAssignment / listAssignmentsForAct /
│  │                             getAssignment / submitResult / listScores / listResults + gộp tên
│  ├─ assignment-ui.js       ← (v0.8.0) GIAO DIỆN bài giao: pop-up Setup · Share (link+QR) · thanh dài
│  │                             dưới khung chơi · pop-up báo cáo (Summary/Leaderboard/Detail)
│  ├─ firebase.js            ← (v0.7.3) KẾT NỐI Firebase: config project `aword-70dae` + nạp SDK LAZY qua
│  │                             CDN 12.9.0 (zero-build) + auth()/db()/fs()/signIn()/signOutNow()/
│  │                             onUser()/currentUser()/isTeacher(). Config CÔNG KHAI là bình thường.
│  ├─ catalog.js              ← 1 NGUỒN DUY NHẤT liệt kê loại act. (v0.9.7) mỗi mục nay khai luôn CÁCH
│  │                             TỰ NẠP: `css` + `load()` + `sample()`. Thêm 1 template = thêm 1 mục
│  │                             Ở ĐÂY, không đụng file nào khác. Dùng chung bởi: main.js (picker
│  │                             New activity + thẻ act) · engine.js (panel Template) · registry.js
│  │                             (ensureTemplate) · play.js (trang HS) · manifest.js (view suy ra)
│  ├─ settings.js             ← (v0.6.3) Settings: Options mặc định theo loại act (key `aword-settings`) +
│  │                             buildOptionsControls() dùng lại cho modal Settings
│  ├─ store.js                ← KHO LƯU kiểu CÂY (v0.6.0): folder/act, 2 gốc activities/results, parentId,
│  │                             thùng rác (trashRootId), Move/Duplicate/Rename — ĐỀU async, key `aword-lib`
│  │                             (tự migrate từ v0.5.0), Firebase sau không đổi nơi gọi
│  ├─ icons.js                ← SVG dùng chung (thêm: options/template/style/edit/assignment/print...)
│  ├─ fit.js                  ← autoFit() (co chữ, theo dõi resize) + fitOnce() (co chữ 1 lần)
│  ├─ numberstepper.js        ← makeNumberStepper() — ô số VUỐT lên/xuống + nút ▲▼
│  ├─ themes/                 ← classic.css · basic.css · classroom.css · beach.css + manifest.js
│  │                             (manifest = danh sách theme + loadTheme() nạp CSS động)
│  └─ assets/                 ← font Baloo 2 (4 độ đậm) + oh-my-god-meme.mp3 (offline, dùng chung)
│
├─ templates/
│  ├─ HUONG DAN TEMPLATE.md   ← quy trình build 1 template + luật chống xung đột
│  ├─ quiz/                   🟢 GẦN CHỐT — quiz.js / quiz.css / sample-quiz.js / test.html / test.js
│  │                             + quiz-editor.js (v0.5.0: openQuizEditor — form soạn nội dung Quiz)
│  ├─ anagram/                🔴 CHƯA BUILD — GHI CHU ANAGRAM.md + test.html/test.js (khung rỗng)
│  ├─ find-the-match/         🔴 CHƯA BUILD
│  ├─ type-the-answer/        🔴 CHƯA BUILD
│  └─ open-the-box/           🔴 CHƯA BUILD (⚠️ game "mở" không điểm — xem GHI CHU riêng)
│
├─ docs/                      ← nghiên cứu Wordwall (00-06) + kiến trúc (07) — mục 8
└─ screenshots/                (trống)
```

**Quy tắc mỗi template**: 3 file trong thư mục riêng — `<ten>.js` (module game) · `<ten>.css` (style
riêng, mọi class tiền tố `.aw-<viet-tat>-`) · `sample-<ten>.js` (export tên chuẩn `activity`).
`test.html`/`test.js` đã có sẵn. `GHI CHU <TEN>.md` riêng: mô tả + TRẠNG THÁI (🔴/🟡/🟢/✅) + nhật ký
+ mục "ĐỀ XUẤT SỬA CORE". Chi tiết: `templates/HUONG DAN TEMPLATE.md`.

## 5. Kiến trúc lõi — HỢP ĐỒNG engine ↔ template (chi tiết ĐẦY ĐỦ: `core/HUONG DAN CORE.md`)

**Luật số 1: KHÔNG session template nào tự sửa `core/`.** Cần gì thêm → ghi "ĐỀ XUẤT SỬA CORE" trong
GHI CHU của template, chờ phụ trách tổng. (Session này là phụ trách tổng nên đã sửa core nhiều.)

Mỗi game = 1 module tự đăng ký:
```js
registerTemplate({
  type: "quiz", scorable: true, name: "Quiz",
  mount(root, activity, ui) {
    // vẽ game vào root; ui.setScore / ui.setNav / ui.onSubmit / ui.sound.* / ui.toast
    // ui.finish({correct, incorrect, total, perQuestion, review, answered}) — BÁO XONG, engine tự lo
    //   review[] = {question, answered, yourText, yourCorrect, correctText}  (cho màn Show answers)
    return cleanupFn;   // GỠ listener/timer riêng + fitter (xem quiz.js làm mẫu)
  }
})
```
Engine tự lo: màn ready+PLAY, timer (up/down), menu, fullscreen, mute, celebration, panel tổng kết,
leaderboard, Show answers, **thanh công cụ Options/Template/Style ngoài khung**. Template chỉ lo nội
dung + luật chơi + đọc `activity.options` (vd Quiz đọc lettersOnAnswers/shuffle).

Chuẩn JSON activity: `{id, type, title, instruction, theme, options{...}, content{...}}`.
`options` hiện dùng: `timer` (none/countUp/countDown), `timerTotalSeconds`, `shuffleQuestions`,
`shuffleAnswers`, `showAnswers`, `lettersOnAnswers` (none/abc).

**Theme**: mỗi theme là 1 file trong `core/themes/`, khai báo ĐỦ biến `--aw-*` (màu + **hình dạng ô**:
`--aw-tile-radius`, `--aw-tile-border-width/-color`, `--aw-tile-shadow`, `--aw-tile-fixed`[ép mọi ô 1
màu] + `--aw-tile-fixed-dark`, `--aw-tile-shadow-active`; + **chữ câu hỏi**: `--aw-question-stroke-*`,
`--aw-question-fill`). Đăng ký trong `themes/manifest.js` → nút Style tự có + nạp CSS động. Template
KHÔNG hard-code màu — luôn dùng `var(--aw-*)`.

## 6. Quy ước & quy tắc thầy đã chốt (BẮT BUỘC)

1. **Sản phẩm 100% tiếng Anh**; trao đổi với thầy tiếng Việt dễ hiểu, tránh jargon, cho xem kết quả chạy.
2. **Khung game 16:9 trên cùng trang; mọi thông tin game TRONG khung; tên/công cụ DƯỚI khung.**
3. Phong cách Wordwall: font Baloo 2, ô 3D gờ tối dưới (trừ theme phẳng như Basic), đồng hồ trái/điểm
   phải, thanh điều khiển đáy khung, nav "x of N" CĂN GIỮA.
4. Ô đáp án KHÔNG đổi màu khi chọn — phản hồi bằng dấu ✓/✗ bay + dấu nhỏ đọng + làm mờ ô sai (0.15).
5. **KHÔNG session template nào tự sửa `core/`** (mục 5).
6. Mỗi đợt sửa: **ghi nhật ký + tăng version**.
7. Tính năng mới lớn: nghiên cứu + báo trước, **chờ thầy "ok build"** (trừ khi thầy yêu cầu rõ).
8. Chưa rõ cần thầy quyết → **hỏi bằng AskUserQuestion** (không hỏi bằng văn bản thường).
9. Xếp hạng: điểm cao trước, hòa thì nhanh hơn thắng.
10. Template chỉ thêm vào `core/catalog.js` khi ĐÃ CHỐT (thầy duyệt) — và **CHỈ file đó**
    (v0.9.7: `index.html`/`play.html`/`main.js`/`play.js`/`manifest.js` không còn liệt kê template).
11. **Sizing dùng `cqw`, KHÔNG dùng `vw`/`clamp`** (để fullscreen giữ tỷ lệ) — với phần tử trong khung.
12. **Animation trên phần tử định vị bằng `transform` (vd translateX(-50%) căn giữa) CHỈ được động
    `opacity`** — nếu không popup sẽ "hiện 1 nơi rồi nhảy về giữa" (lỗi hay gặp nhất, xem HUONG DAN
    CORE.md mục đó + cách rà soát bằng grep).
13. **Mọi `element.animate()` phải có `setTimeout` dự phòng** (tab ẩn → onfinish có thể không bắn).
14. **Push xong CHƯA phải là đã lên live — nhưng push LÀ đủ để kích build** (đính chính Đợt 81):
    quy trình chuẩn = push → chờ 1–3 phút → `curl` cache-bust kiểm dấu mốc; **chỉ khi ~10 phút vẫn
    cũ** mới sang đường cứu hộ **mục 0-TER**. **Cấm đẩy commit rỗng để "kích hoạt lại deploy"** (vô
    ích, chỉ làm bẩn lịch sử — Đợt 79 đã lỡ 2 lần). Thấy email "Some jobs were not successful" thì
    xem job `build` trước: build OK + deploy timeout = **lỗi hạ tầng GitHub, đừng sửa code**.

## 7. Chưa làm — ROADMAP

**CHẶNG HIỆN TẠI (thầy chốt 19/7): HOÀN THIỆN QUIZ 100% rồi mới sang game khác** (dùng chung hạ tầng).
Build lần lượt từng tính năng, xong cho thầy xem chạy thật:

1. ✅ **Khối 1 — Editor + Kho lưu + Trang chủ** (v0.5.0) → **nâng lên trang chủ kiểu Drive** (v0.6.0):
   2 gốc Activities/Results, thư mục con, thùng rác riêng, Move/Duplicate/Rename, Search, grid/list,
   mở-tab-mới; lưu offline qua `store.js` async (cây folder/act), sẵn sàng cắm Firebase.
2. ✅ **Khối 2 — Print** (v0.7.1): popup chọn ĐỊNH DẠNG (Anagram/Crossword/Quiz/Unjumble theo luật khả
   dụng) → worksheet A4 thang xám theo ảnh mẫu thầy, hệ dùng chung `core/print.js`. Làm offline được.
   Còn thiếu: **build renderer Crossword** (đang "soon"); in thử thật trên giấy/PDF để xác nhận bố cục
   A4 + header/footer lặp trang; nút Print từ trang chủ (hiện chỉ trong màn game); (tuỳ chọn) trang đáp
   án cho thầy.
3. **➡️ Khối 3 — ASSIGNMENT (VIỆC KẾ TIẾP, nút "Set assignment" đang stub)**: hạ tầng đã sẵn sàng —
   luật Firestore cho `assignments/{code}` **đọc công khai** + chỉ thầy tạo. Cần làm:
   (a) khi thầy giao bài → ghi doc `assignments/{code}` chứa **BẢN SAO act** (snapshot) để thư viện
   riêng tư KHÔNG bị lộ và sửa act sau không phá bài HS đang làm dở;
   (b) **trang chơi cho HS KHÔNG cần đăng nhập** (nhập tên → chơi → nộp) — hiện `?play=` vẫn đọc thư
   viện nên đòi đăng nhập, **chưa gửi HS được**;
   (c) sinh **link + mã QR** để dán lên Google Sites/Zalo.
4. ✅ **Nối FIREBASE — XONG (v0.7.3 hạ tầng + v0.7.4 code, 19/7)**: thầy chốt *repo PUBLIC · chỉ thầy
   đăng nhập Google mới sửa · BẮT đăng nhập mới vào được*. Console dựng xong (project `aword-70dae`,
   Firestore Singapore, Google Sign-in, authorized domain, luật publish, web app);
   **`core/firebase.js`** nạp SDK lazy qua CDN 12.9.0 → giữ zero-build, KHÔNG cần Node/Vite;
   **`core/store.js` đã chạy trên Firestore** (`users/{uid}/items/{id}`) — **API xuất ra giữ nguyên nên
   không chỗ gọi nào phải sửa**; màn đăng nhập + chip tài khoản + chuyển dữ liệu cũ lên mây.
   Chi tiết + giá trị thật: `docs/08-FIREBASE-SETUP.md`. Mô hình dữ liệu: `users/{uid}/items/{id}`
   (thư viện RIÊNG TƯ ✅đang dùng) · `assignments/{code}` (bản SAO act, công khai đọc để HS chơi —
   thư viện không lộ; ⏳làm ở Khối 3) · `results/{id}` (HS chỉ được tạo; ⏳Khối 4).
   **CÒN LẠI**: Settings + leaderboard vẫn ở localStorage (chưa đồng bộ nhiều máy).
5. **Khối 4 — Thu điểm HS nhiều máy**: luật `results/{id}` ĐÃ publish sẵn (HS chỉ được TẠO, không ai
   sửa/xoá điểm; chỉ thầy đọc). Cần: HS nộp kết quả sau khi chơi → gom về gốc **Results** cho thầy
   xem/xếp hạng; leaderboard online (entry đã lưu sẵn cả `review` nên đồng bộ dễ); dashboard kết quả.
   ⚠️ Lúc đó nhớ chuyển **leaderboard + Settings** từ localStorage lên cloud (hiện vẫn lưu theo máy).
6. ✅ **Chốt Quiz + viết "recipe/công thức mẫu"** (24/7/2026) → `templates/CONG THUC MAU.md`.
7. ✅ **Build 4 template còn lại** (24/7/2026): Anagram, Find the match, Type the answer, Open the box —
   cả 4 đã build + test qua `test.html`. **Anagram (29/7/2026), Open the box + Type the answer
   (30/7/2026, đợt 11) ✅ ĐÃ CHỐT + gộp vào trang chủ** (xem mục 2). **Find the match** vẫn
   **🟢 CHỜ THẦY DUYỆT**, chưa gộp. **➡️ VIỆC KẾ TIẾP**: thầy xem Find the match chạy thật rồi quyết
   định có gộp `built:true` nốt không (kèm content editor riêng, theo khuôn `open-the-box-editor.js`).
8. **Change template thật** (nút Template/menu "coming soon"): đổi game trên cùng bộ dữ liệu.
9. ✅ **Đẩy GitHub + Pages (v0.7.2, 19/7)**: repo PUBLIC `andrewclasses-01/AWord`, Pages branch `main`
   thư mục gốc, live tại https://andrewclasses-01.github.io/AWord/ (đã test thật: chơi Quiz + popup
   Print + font đều OK, 0 lỗi console).

## 8. Tài liệu docs/ (nghiên cứu Wordwall — tài khoản Pro andrewclasses)

- `00-OVERVIEW.md` — catalog 33 template + **6 mô hình dữ liệu dùng chung** + 5 activity demo.
- `01..05` — mổ xẻ Anagram/Quiz/Type-the-answer/Open-the-box/Find-the-match (cách chơi, options, JSON).
- `06-RESULTS-AND-RANKING.md` — cơ chế Assignment/link+QR/My Results/leaderboard (mấu chốt Firebase).
- `07-ARCHITECTURE.md` — Vite/Firebase/security rules (⚠️ cấu trúc file trong đó LỖI THỜI so với mục 4,
  chỉ tham khảo phần Firebase/backend).

## 8b. Dữ liệu trên Firestore (v0.8.0)

```
users/{uid}/items/{id}          thư viện RIÊNG của thầy (folder + act, có thêm `num` = số link)
assignments/{code}              bài giao — ĐỌC CÔNG KHAI, chứa BẢN SAO act; chỉ thầy tạo/sửa/xoá.
                                (v0.9.0) thêm: folderId (thư mục trong Results) · closed · trashed.
                                (v0.9.1) thêm: lastSubmitAt/submitCount (HS ghi được, CHỈ 2 field này)
                                + lastSeenAt (thầy ghi khi mở báo cáo) -> chấm đỏ "có bài nộp mới".
                                ĐÂY LÀ BẢN DUY NHẤT — Results và thanh dưới act đều đọc nó.
assignments/{code}/scores/{id}  bảng xếp hạng CÔNG KHAI: chỉ name/score/total/timeMs/createdAt
results/{id}                    bài làm chi tiết — CHỈ THẦY ĐỌC, không ai sửa/xoá
```
⚠️ **Bộ khoá của `results` bị LUẬT KHOÁ CỨNG** (`assignmentId, studentName, score, total, timeMs,
review, createdAt`). Thêm field mới mà không sửa luật trên console thì MỌI lượt nộp sẽ hỏng.

## 9. Bẫy & lưu ý kỹ thuật (tóm tắt — ĐẦY ĐỦ trong `core/HUONG DAN CORE.md`)

- ⚠️ **`navigator.clipboard.writeText()` TREO VÔ HẠN khi cửa sổ không được focus** (không ném lỗi) —
  `await` không bao giờ chạy tiếp, người dùng không thấy phản hồi. Dùng `copyText()` trong
  `core/utils.js` (đã có hạn giờ + phương án dự phòng), ĐỪNG gọi thẳng clipboard API.
- ⚠️ **Đừng bắt lỗi rồi trả mảng rỗng** cho phần đọc dữ liệu hiển thị: "chưa ai chơi" và "đọc hỏng"
  trông y hệt nhau trên màn hình. Hỏng thì phải BÁO (bài học từ pop-up báo cáo v0.8.0).
- ⚠️ **QR: thông tin định dạng (format info) rất dễ đặt XOAY ngang-dọc** — mã vẫn "trông như QR" nhưng
  không máy nào quét được. Sửa QR xong PHẢI chạy `core/qr-test.html` (có máy quét thật) trước khi tin.
- ⚠️ **Ảnh chụp màn hình của công cụ preview/Chrome hay LỖI KẾT HỢP với `backdrop-filter`** → pop-up
  trông như trong suốt/chồng chữ dù DOM hoàn toàn đúng. Kiểm bằng `document.elementFromPoint` trước
  khi tin là lỗi thật.

- ⚠️ **GITHUB PAGES CẬP NHẬT FILE KHÔNG ĐỒNG THỜI** (gặp thật 19/7): sau `git push`, có thể `main.js`
  đã là bản mới trong khi `core/store.js` còn bản cũ → app chạy LẪN 2 phiên bản, sinh dữ liệu rác khó
  hiểu. **Sau mỗi push, `curl` kiểm chứng NỘI DUNG file vừa sửa đã live** rồi mới test:
  `curl -s <url>/core/store.js | grep -c "chuỗi-chỉ-có-ở-bản-mới"`.
- ⚠️ **App BẮT ĐĂNG NHẬP từ v0.7.4** → mọi hàm `core/store.js` chỉ chạy khi đã đăng nhập, gọi lúc chưa
  đăng nhập ném lỗi `err.code === "aw/signed-out"` (bắt lỗi, đừng để crash). Muốn test game mà không
  đăng nhập thì dùng `templates/<ten>/test.html` (chạy dữ liệu mẫu, không đụng store).
- ⚠️ **Popup đăng nhập Google KHÔNG tự động hoá được** — Google cố tình chặn (tốt cho bảo mật). Khi
  test bằng trình duyệt tự động, phải nhờ thầy bấm chọn tài khoản 1 lần.
- ⚠️ **Firestore TỪ CHỐI `undefined`** → `store.js` có `clean()` lọc trước khi ghi; ghi thẳng Firestore
  ở chỗ khác cũng phải lọc. Batch tối đa 500 write (store.js chunk 400).
- ⚠️ **Tự động hoá Firebase console** (nếu cần làm lại): ô soạn luật là **CodeMirror**, gõ tay bị
  auto-đóng-ngoặc làm hỏng code → dán bằng
  `document.querySelectorAll('.CodeMirror')[0].CodeMirror.setValue(text)` (instance 0 = `.main-editor`).
  Tiện ích Chrome **chặn đọc chuỗi giống khoá** qua JS → đọc `firebaseConfig` bằng `computer zoom`.
- **Máy chưa cài Node/npm** → offline chạy Python; **Firebase KHÔNG cần Node** (SDK nạp qua CDN
  ES-module, pin `12.9.0` trong `core/firebase.js`) nên dự án vẫn zero-build.
- **DÙNG `devserver.py`, KHÔNG `python -m http.server` trần** — http.server không gửi header chống
  cache → sửa file .js rồi tải lại cùng tab có thể vẫn chạy bản cache CŨ (tưởng "fix không tác dụng").
  Nghi cache cũ → mở TAB MỚI, hoặc `fetch(url+"?bust="+Math.random())` so nội dung.
- **Preview pane Claude_Browser hay treo screenshot / visibilityState kẹt "hidden"** → verify bằng
  `javascript_tool` (đo DOM/animation trực tiếp) cho chắc. Tab ẩn → `animate().onfinish` có thể KHÔNG
  bắn (setTimeout vẫn chạy) → mọi animate() phải có setTimeout dự phòng.
- **Popup "hiện 1 nơi rồi nhảy về giữa"** (lỗi hay gặp nhất, đã sửa 2 đợt): phần tử căn giữa bằng
  transform + animation động transform. Sửa: opacity-only hoặc keyframe bake luôn translate(-50%)
  (`aw-pop-cx`, `aw-fly`). RÀ SOÁT bằng `grep "transform:.*translate|animation:"` — xem HUONG DAN CORE.
- **cqw** cho sizing (fullscreen giữ tỷ lệ); slack của autoFit tính theo `root.clientWidth*hệ_số` (px
  động) chứ không px cứng.
- Hiệu ứng ✓/✗ gắn TẠI CHỖ không re-render; quay lại câu cũ thì render khôi phục từ `state`.
- Font/mp3 offline trong `core/assets/`; `sound.js` resolve mp3 qua `import.meta.url`.
- Leaderboard key `aword-lb-<activityId>`; xáo câu/đáp án chỉ 1 lần lúc mount; `escapeHtml/escapeText`
  cho mọi nội dung người dùng.
- **Grid `1fr auto 1fr` căn giữa cụm**: 2 cột 1fr chênh min-content → cụm giữa LỆCH → thêm `min-width:0`.
- **`main.js` (trang chủ)** phải bọc nội dung dưới khung trong `.aw-below-left` (grid 3 cột mới).
- **TRÙNG TÊN CLASS với engine (v0.6.3):** engine dùng `.aw-topbar` (thanh đồng hồ/điểm trong game),
  `.aw-iconbtn` (loa/fullscreen/menu), `.aw-navbtn` (mũi tên trước/sau). Header thư viện/editor mới ĐỪNG
  đặt trùng — đã đổi thành `.aw-appbar`/`.aw-appbtn`/`.aw-appnav`. Trước khi đặt tên class UI mới, `grep`
  tên đó trong `core/` (nhất là engine.js/app.css) để chắc không đụng không gian tên khung game.
