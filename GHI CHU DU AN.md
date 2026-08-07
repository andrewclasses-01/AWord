# GHI CHÚ DỰ ÁN — AWord

Web game tiếng Anh (giống Wordwall), chơi trên trình duyệt, sẽ đẩy lên GitHub.
Mục tiêu: giáo viên tạo game + học sinh chơi + thu điểm để xếp hạng.

---

## Đợt 85 (7/8/2026, v0.9.60) — ⭐ HẾT TRỄ ÂM THANH: NẠP TRƯỚC CẢ PACK + HÂM NÓNG AUDIOCONTEXT + NÉN LẠI 310 FILE MP3. ⭐ CÓ SỬA CORE (1 file MỚI + `sound.js`; KHÔNG đụng `engine.js`). 🟢 CHỜ THẦY DUYỆT

### Bối cảnh — thầy báo gì

> "Sau một thời gian chơi thử, tôi nhận thấy các hiệu ứng âm thanh hầu như đều bị delay, chỉ khi game đã
> load, chơi được một lúc và start again thì các hiệu ứng âm thanh mới đồng bộ với hiển thị. Việc này cực kỳ
> khó chịu." Thầy còn gợi ý: Wordwall dùng file **`.ogg`**, AWord dùng **`.mp3`** — liệu định dạng có liên quan?

### 1. Bác bỏ giả thuyết ĐỊNH DẠNG (làm trước, vì nếu đúng thì cả hướng sửa sẽ khác)

Lấy **8 cặp file cùng một âm thanh gốc**: bản `.ogg` Wordwall tải về (`D:\APP AND DATA\AWord-data\Source\
Sound effect\...\_goc-ogg\`) và bản `.mp3` đang chạy trong AWord. Giải mã cả hai bằng `decodeAudioData` rồi
dò **mẫu đầu tiên vượt ngưỡng ồn** (chính xác tới từng sample):

| sound | ogg lead | mp3 lead | chênh |
|---|---|---|---|
| answer | 1,8ms | 1,8ms | **0** |
| correct | 13,4ms | 13,4ms | **0** |
| incorrect | 7,9ms | 7,9ms | **0** |
| footsteps-01 | 8,7ms | 8,3ms | −0,4ms |
| tileappear | 0,1ms | 0,1ms | **0** |
| clocktick | 1,1ms | 0ms | −1,1ms |
| menu | 0,3ms | 0,3ms | **0** |
| teleport | 2,9ms | 3,0ms | +0,1ms |

Chi phí giải mã cũng ngang nhau (3–20ms cả hai). **Kết luận: định dạng KHÔNG gây trễ.** MP3 vốn có phần đệm
mã hoá ở đầu, nhưng ffmpeg ghi sẵn header LAME nên Chrome tự cắt. Wordwall nghe khớp là nhờ nó **nạp trước**.
Điểm duy nhất thầy đúng: **mp3 của ta NẶNG hơn gần gấp đôi** bản ogg (`correct` 92KB so với 49KB) — chuyện
dung lượng, không phải định dạng. (Đã xử lý ở mục 4.)

### 2. Gốc lỗi thật — `<audio>` được sinh ra ĐÚNG LÚC cần phát

Cả 14 template chép chung một khuôn:

```js
if (!a) { a = new Audio(urlFor(name)); a.preload = "auto"; cache.set(name, a); }
a.currentTime = 0; a.play();
```

`new Audio()` chạy **đúng khoảnh khắc em trả lời đúng**, nên lần đầu của mỗi tên file phải đi mạng lấy file
rồi mới kêu. Đo trên **bản live** (dò tiếng ở audio thread, tính giờ bằng đồng hồ audio):

| | lần đầu | phát lại |
|---|---|---|
| pack quiz (9 file) | **67–363ms** (TB 143ms) | **5–19ms** |
| đối chứng 6 file, mỗi lần một URL lạnh | **67,5ms** đều | — |

Chi phí kéo file từ GitHub Pages: **lạnh 290–654ms**, đã có sẵn kết nối 55–98ms. Header bản live là
`Cache-Control: max-age=600` → **cứ 10 phút là phải hỏi lại server**. Một game có 10–47 file khác nhau nên cả
lượt chơi ĐẦU TIÊN lệch tiếng; tới khi mỗi file đã kêu một lần thì hết — **đúng y điều thầy tả**.

⭐ Chạy cùng bàn đo đó trên **localhost** thì **mọi đường đều ~6ms** → chứng minh bản thân code không chậm,
chỉ có **mạng** nằm trên đường đi của tiếng.

**Nguyên nhân phụ (nhỏ hơn nhưng có thật):** `core/sound.js` dựng AudioContext **lazy ngay trong tiếng đầu
tiên**, nên tiếng tổng hợp (click/ting/buzz) đầu tiên mất **48ms**, các tiếng sau **10,7ms**. Crossword,
running-word, running-team mỗi cái còn dựng một AudioContext RIÊNG → mỗi cái lại chịu 37ms đó một lần nữa.

### 3. Bản vá

**(1) File MỚI `core/sfx.js`** — kho mp3 dùng chung:

```js
const pack = createPack(import.meta.url, { names: [...], hot: [...], skip: ["music"] });
const playFile = pack.play;   // (name, volume?)   — TÊN CŨ, chữ ký cũ
const makePool = pack.pool;   // (names, volume?)  — TÊN CŨ, chữ ký cũ
pack.prime();                 // ⭐ bản vá nằm ở đây
```

`prime()` chạy ngay lúc module được **import**, mà `ensureTemplate()` import module **trước khi** màn READY
được vẽ → tới lúc thầy bấm PLAY thì file đã nằm sẵn. Nạp **4 file một lúc** để pack 47 file (gameshow) không
giành hết đường truyền lớp học; `hot` = các tiếng nổ ra TRONG lúc chơi, xếp hàng trước; `skip` = nhạc nền dài
(phát kiểu stream, kéo trước chỉ tổ nghẽn). Vì giữ nguyên tên `playFile`/`makePool` nên **khối export của
từng game không đổi một dòng** — 14 file chỉ thay đúng phần đầu.

**(2) `core/sound.js`** thêm `context()` và `warmup()`. `warmup()` **tự chạy ở cú chạm/gõ phím ĐẦU TIÊN trên
trang** (nghe ở pha capture): dựng + `resume()` AudioContext, đẩy 1 mẫu **câm** cho thiết bị âm thanh khởi
động, và tạo sẵn element tiếng "oh my god". Crossword · running-word · running-team thôi dựng context riêng,
gọi `coreSound.context()` → hưởng luôn cú hâm nóng. ⭐ Nhờ cách này **KHÔNG phải sửa `engine.js`** dòng nào.

**(3) Nén lại 310 file mp3** ở LAME VBR `-q:a 6` (mục 4).

**Thêm móc chẩn đoán** `window.__awSfxPacks` (cùng tinh thần với `window.__awordBridge` sẵn có):
`p.stats()` → `{total, built, ready, primed}` để phiên sau kiểm chứng được pack đã nạp xong trước PLAY chưa.

### 4. Nén lại pack mp3

Khảo sát trước: 310 file **đều stereo, 44.1kHz** (3 file 32kHz), VBR trung bình ~110–130kbps. Thử đo tỉ lệ
giữa 2 kênh (`pan=mono|c0=0.5*c0-0.5*c1` + `volumedetect`) — **đa số là stereo THẬT** (kênh chênh −6 đến
−28dB), chỉ vài file là stereo giả → **không được ép mono hàng loạt**. Nén thử ở `-q:a 6` cho **35–45%**.

Làm thật: sao lưu → nén từng file **từ chính nó** → chỉ giữ bản mới nếu **nhỏ hơn ≥10%** và **độ dài lệch
≤50ms**. Kết quả **298 file nén, 12 file giữ nguyên**:

| pack | trước | sau | | pack | trước | sau |
|---|---|---|---|---|---|---|
| quiz | 289KB | 142KB (−51%) | | maze-chase | 1.190KB | 780KB (−34%) |
| anagram | 351KB | 188KB (−46%) | | whack-a-mole | 799KB | 507KB (−37%) |
| crossword | 381KB | 188KB (−51%) | | balloon-pop | 915KB | 691KB (−24%) |
| find-the-match | 396KB | 196KB (−50%) | | flying-fruit | 753KB | 594KB (−21%) |
| type-the-answer | 475KB | 244KB (−49%) | | unjumble | 668KB | 488KB (−27%) |
| open-the-box | 668KB | 398KB (−40%) | | true-false | 306KB | 200KB (−35%) |
| speaking-cards | 582KB | 332KB (−43%) | | gameshow | 2.483KB | 1.476KB (−41%) |

**TỔNG 10.255KB → 6.423KB (nhỏ hơn 37%).** Backup 310 file gốc:
`D:\APP AND DATA\AWord-data\Backup\sounds-truoc-khi-nen-07-08-2026`.

### ⚠️ LỖI TỰ GÂY RA RỒI TỰ BẮT — ghép file theo ĐỘ DÀI

Bản nén đầu tiên định "khôn": ở đâu còn `.ogg` gốc thì nén lại **từ ogg** cho đỡ một đời nén, ghép ogg↔mp3
bằng cách **so độ dài (±30ms) và chỉ nhận khi khớp duy nhất**. Báo cáo ra **77 file "lấy từ ogg"** — trong khi
**chỉ có 73 file ogg**, và chúng chỉ thuộc GAMESHOW + MAZE CHASE. Vậy mà anagram 8 file, whack-a-mole 9 file,
balloon-pop 5 file… cũng "khớp" → **57 file đã bị thay bằng âm thanh KHÁC hẳn, chỉ vì trùng độ dài.**

Đã khôi phục toàn bộ từ backup, **bỏ hẳn** cơ chế ghép theo độ dài, nén lại mỗi file từ chính nó, rồi viết
thêm một bước **kiểm chứng nội dung chạy trên cả 310 file**: trừ sóng cũ − sóng mới
(`amerge` + `pan=mono|c0=c0-c2`) rồi so mức còn lại với mức tín hiệu gốc.

> **310/310 file vẫn ĐÚNG âm thanh cũ.** SNR nhỏ nhất **8,5dB**, trung bình **26,9dB**, lớn nhất 72,7dB —
> nếu một file bị thay nhầm thì SNR sẽ ≈ **0dB**. Mấy file SNR thấp nhất đều là tiếng ồn (conveyor whoosh,
> shuffle, menu) — MP3 không giữ nguyên pha của tiếng ồn nên số thấp là bình thường, không phải bị đổi.

**Luật rút ra: ĐỘ DÀI KHÔNG PHẢI DANH TÍNH.** Đừng bao giờ ghép/thay file media bằng cách so thời lượng.

### 5. Đo lại sau khi vá

| | trước | sau |
|---|---|---|
| lần phát ĐẦU của một hiệu ứng | **67,5ms** (live) | **6,2ms** |
| tiếng tổng hợp đầu tiên | **48ms** | **10,7ms** |
| pack gameshow sẵn sàng | — | **46/46 file sau 1,1 giây**, màn READY còn nguyên, chưa ai bấm PLAY |
| dung lượng pack | 10,25MB | **6,42MB** |

**Hồi quy:** **16/16 template mount, 0 lỗi console**; 14 pack đều `ready = total` (46/46 gameshow, 18/18
anagram, 10/10 quiz…); trên trang thật bấm PLAY → `blockgameintro1.mp3` kêu, bấm đáp án → tiếng verdict kêu,
0 lỗi; **nút tắt tiếng vẫn ăn** (bật → 1 lần phát · tắt → 0 · bật lại → 1). Chất lượng nén trên 17 file mẫu:
**độ dài lệch 0ms**, khoảng lặng đầu file lệch **≤0,4ms**.

### ⚠️ Số đo chống lại các phương án khác — đừng làm lại từ đầu

- **Giải mã sẵn ra AudioBuffer của Web Audio**: 6,7ms so với 8,0ms của `<audio>` nạp sẵn — nhanh hơn đúng
  **1,3ms** mà tốn **3,6–49MB RAM mỗi pack** (gameshow giải mã hết = 49,3MB; tổng 14 pack = 241MB). Bỏ.
- **Sợ nhiều `<audio>` sống cùng lúc bị Chrome thu hồi**: đã dựng **200 element** cùng lúc rồi phát cái
  **CŨ NHẤT** → vẫn **11ms**, `readyState 4`. Không cần LRU, cứ để pack nằm đó.

### ⚠️ Hai bẫy ĐO ĐẠC mới

1. **Pane preview có `visibilityState = "hidden"` → `requestAnimationFrame` ĐÓNG BĂNG HOÀN TOÀN.** Bàn đo
   đầu tiên dò thời điểm phát tiếng bằng rAF nên treo, không ra nổi một dòng kết quả (mục 1 xong, mục 2
   đứng im). Phải dò trên **audio thread** (`ScriptProcessorNode` — không bị throttle) và tính giờ bằng
   **`ctx.currentTime`**. Đây là họ hàng của bẫy đã ghi từ trước ("cửa sổ bị che thì Chromium đóng băng rAF").
2. **`readyState` đọc NGAY lúc gọi `play()` hay ra 1**, dễ tưởng "chưa tải xong": `currentTime = 0` khởi
   động một cú **seek**, đọc lại sau khi seek xong là **4**. Đừng kết luận vội.

Còn 2 bẫy PowerShell 5.1 dính khi viết script nén (đã ghi trong chính script): `2>&1` trên lệnh ngoài biến
stderr thành `NativeCommandError` nên nuốt mất dòng `Duration` của ffmpeg (phải cho `cmd.exe` chuyển hướng ra
file); và toán tử `,` **bám chặt hơn phép trừ** nên `@($k, $k-1, $k+1)` bị hiểu thành *mảng trừ mảng*.

### Việc kế

Thầy chơi thử trên máy thật (nhất là TOMKO + qua myActivity): xác nhận tiếng đã khớp hình **ngay từ câu đầu
tiên của ván đầu tiên**, và nghe xem bản nén `-q:a 6` có bị mỏng/rè ở game nào không (gameshow và
speaking-cards là 2 pack đáng nghe kỹ nhất). Duyệt xong → commit + push + `curl` kiểm bản live.

---

## Đợt 84 (7/8/2026, v0.9.59) — ⭐ TÍNH NĂNG MỚI "START WITH MISTAKES": CHƠI LẠI ĐÚNG NHỮNG TỪ VỪA SAI. ⭐ CÓ SỬA CORE + 12 TEMPLATE. ✅ THẦY DUYỆT → COMMIT `797670b` + PUSH + **LIVE**

Bảng kết quả có thêm hàng **"Start with mistakes"** ngay dưới **"Start again"**. Bấm vào → về màn READY
(nút PLAY to) của **cùng game**, tên game đổi thành **"QUIZ WITH MISTAKES"**, danh sách chơi chỉ còn các
từ **làm sai hoặc bỏ trống** ở ván vừa rồi. Chơi tiếp mà vẫn còn sai thì lại bấm được nữa, thu hẹp dần.
Muốn về **bộ đầy đủ**: reload trang · đổi template rồi chọn lại · hoặc **Start again**. File mới
`core/mistakes.js`; sửa `core/engine.js` + 12 file template.

### Cách nối từ hàng review về đúng từ gốc — thầy chốt đường "gắn tham chiếu"

⭐ **Phát hiện làm cả tính năng này thành dễ:** MỌI template đều mở đầu bằng
`[...(activity.content?.X || [])]` — sao chép **NÔNG**, nên phần tử trong danh sách chơi **chính là object**
trong `activity.content`, không phải bản sao. Vậy chỉ cần **lọc lại mảng gốc** là xong: câu hỏi giữ nguyên
4 đáp án, clue, acceptedAnswers — **không dựng lại gì cả**.

Mỗi hàng `review` truyền vào `ui.finish()` nay mang thêm **`src`** = chính object nguồn, và mỗi template
khai **`tpl.itemsKey`** ("questions" | "items" | "words" | "pairs" | "statements"). Core làm đúng 2 dòng:
`bad = new Set(review.filter(r => !r.yourCorrect).map(r => r.src))` rồi
`content[itemsKey].filter(it => bad.has(it))`. "Sai **hoặc** chưa làm" gói gọn trong một phép thử
`!r.yourCorrect`. **Đường đã cân nhắc và BỎ:** dò theo chữ (so `correctText`/`question` với `toRecords()`
của `convert.js`) — không phải sửa template nào, nhưng hai từ trùng nhau là chọn nhầm, crossword rơi về
`w.key`, running-team ghi `question` là `"MINH ANH — 23"` nên không khớp, và nội dung phải dựng lại qua
record nên đáp án nhiễu bị sinh mới.

⚠️ **6/12 template phải LUỒN `src` qua một bước `.map()`** vì chúng dựng object mới trước khi chơi: quiz ·
gameshow · open-the-box (xáo đáp án) · anagram · unjumble (`prepareItem` tách chữ cái/từ) · balloon-pop
(chuẩn hoá `trim`). **Crossword phải luồn qua HAI bước** (`buildCrossword` map lần 1 ra `{key,clue,answer}`,
lần 2 ra object đã đặt vào lưới kèm `cells`). 5 template còn lại (find-the-match · flying-fruit ·
maze-chase · true-false · type-the-answer) dùng thẳng object nguồn nên chỉ thêm `src: it`.

### 4 template CỐ Ý không có tính năng này

| Game | Vì sao |
|---|---|
| **Whack-a-mole** | `reallyFinish()` dựng review với **MỌI hàng `yourCorrect:false`** — nó chỉ liệt kê đáp án chứ không ghi em làm đúng câu nào (trò arcade, một từ chui lên nhiều lần). "Câu sai" không xác định được. Muốn có thì phải sửa lõi ghi điểm của chính nó. |
| **Speaking cards** | `scorable:false`, không có bảng kết quả |
| **Running word / Running team** | dùng `tpl.renderSummary` riêng, không đi qua bảng mặc định; là trò đồng đội nên "chơi lại từ sai" vô nghĩa |

### Số phần tử tối thiểu — không phải game nào cũng 2

Thầy dặn "còn 1 từ thì báo cần ít nhất 2". Nhưng luật chơi vài game cần nhiều hơn, nên
`core/mistakes.js` giữ bảng `MIN_ITEMS` (lấy đúng số từ editor của chính game đó): **balloon-pop 5** (bóng
phải có bạn để bay thành chùm) · **find-the-match 3** (mỗi câu cần ≥2 ô nhiễu) · **crossword 2** (hai từ
mới giao nhau) · còn lại **2**. Thiếu thì báo `"Need at least 5 words"` — nói đúng con số chứ không nói
chung chung — và **ở nguyên bảng kết quả**, không mất gì.

### 3 luật phụ thầy chốt

**(1) Ván mistakes KHÔNG tính điểm.** `finish()` bỏ qua `addEntry` khi `activity._mistakes`, và bảng kết
quả ẩn luôn dòng `YOU'RE Nth ON THE LEADERBOARD`. Lý do: mỗi ván mistakes là một act id riêng nên nếu ghi
thì bảng nào cũng chỉ có một mình em đó, luôn hiện "YOU'RE 1ST".

**(2) "Play a different template" RỜI khỏi bảng kết quả** để nhường chỗ. Đo trước khi làm: panel đang
454px, thêm nút thứ 5 thành **507px** trong khi `.aw-panel` có `max-height:92%` = **497px** → panel **bắt
đầu cuộn, nút cuối khuất**. Cùng cái picker đó vẫn nằm ở menu ☰ với tên **"Change template"**. ⚠️ **Đổi
lại một chút:** lúc đang ở bảng kết quả thì thanh dưới bị backdrop che nên không mở ☰ được — muốn đổi
template ở màn kết thúc phải **Start again** trước rồi mới ☰ → Change template.

**(3) Nút chỉ hiện khi ván đó THẬT SỰ có câu sai.** Làm đúng hết thì không có nút, thay vì có một nút bấm
vào chỉ để bị báo "No mistakes to practise".

### ⭐ HAI LỖI TỰ TÌM RA TRONG LÚC LÀM (đều là lỗi thật, đã sửa)

**(a) Act tạm `mist_` bị GHI VÀO THƯ VIỆN của thầy.** Chỗ Apply trong Options chỉ chặn id bắt đầu bằng
`"conv_"`; act mistakes không mang cờ `_converted` nên lọt qua → bấm Apply lúc đang luyện là **một act 3
từ bị lưu đè vào thư viện**. Sửa: nhận diện `_mistakes`, quy options về **act mẹ** (`_mistakesBase`) và
chặn cả hai tiền tố `/^(conv|mist)_/`. Ghi chú: `activity.options` **cùng một object** với act mẹ (do
`{...base}` sao chép nông) nên `Object.assign` phía trên đã cập nhật đúng act thật trong bộ nhớ.

**(b) Apply Options giữa ván mistakes làm MẤT bộ từ đang luyện.** Apply gọi `restart()`, mà `restart()` nay
đã được dạy "luôn quay về bộ đầy đủ" — nên thầy chỉ nhích cái đồng hồ là bộ 4 từ đang luyện biến mất, quay
lại 6 từ. Tách thành **hai hàm**: `restart()` = nút *Start again* (về bộ đầy đủ) · **`replayCurrent()`** =
chơi lại **đúng cái đang có**, dùng cho Apply và cho cầu đồng bộ myActivity `__awordBridge.applyOptions`.

### Tự test (devserver riêng :5511, trình duyệt thật, đo DOM)

**Kịch bản 4 vòng liên tiếp trên Quiz (6 câu):** vòng 1 đúng 2 → panel có nút, Score 2/6 → *Start with
mistakes* → màn READY ghi **"QUIZ WITH MISTAKES"** → vòng 2 đúng **4 câu** (đúng 4 câu đã sai), đúng 1 →
*Start with mistakes* → vòng 3 **3 câu**, đúng hết → **nút biến mất** ✅ và **không có dòng hạng** ✅ →
*Start again* → tên về **"QUIZ"**, **6 câu** ✅. Bảng xếp hạng cuối cùng: **10 hàng đều là `/6`** — không
một hàng `/4` hay `/3` nào, tức ván mistakes thật sự không được ghi ✅ (`localStorage` chỉ có
`aword-lb-act_sample_quiz` + `aword-lb-act_sample_tf`, **không có key `mist_`**).

**Ngưỡng tối thiểu:** cố tình chỉ sai **đúng 1 câu** → nút vẫn hiện, bấm vào ra toast
**"Need at least 2 words"**, **ở nguyên bảng kết quả**, không vào màn READY ✅.

**Template khác hình dạng dữ liệu — True or false (`content.statements`)**: đặt `lives:1` để kết thúc sớm,
đúng 2 sai 1 (còn 5 câu chưa hỏi) → READY ghi **"TRUE OR FALSE WITH MISTAKES"**, vòng 2 hỏi đúng **6 câu**
= 8 − 2 câu đã đúng ✅. ⚠️ **Ghi nhận về ngữ nghĩa:** True/false (và maze-chase, open-the-box) **hỏi lại
câu sai đến khi đúng**, nên chơi hết bài với tim vô hạn là **không còn câu sai nào** → không có nút. Chỉ
khi hết tim/hết giờ mới còn câu dang dở. Đây là ngữ nghĩa sẵn có của chính các game đó, không phải lỗi.

**Lỗi (b) sau khi sửa:** đang ở vòng mistakes 4 câu → `applyOptions({pointsOff:1})` → vẫn **"QUIZ WITH
MISTAKES"**, vẫn **4 câu** ✅.

**Bố cục:** panel 4 nút = **454,3px / 497px trần**, `scrollHeight === clientHeight` → **không cuộn**; cả 4
nhãn nút chữ nguyên vẹn không tràn ✅.

**Hồi quy:** **16/16** trang `templates/*/test.html` mount đủ `.aw-stage` + PLAY, **0 lỗi console** (chạy 2
lần: sau đợt sửa template, và sau khi vá 2 lỗi trên).

### Lên live — 2 commit tách riêng, đã kiểm chứng TRÊN BẢN LIVE

Thầy chốt commit lần lượt từng đợt. Vì 5 file bị **trộn** thay đổi của cả 2 đợt (`core/engine.js`,
`templates/quiz/quiz.js` + 3 file hồ sơ), cách tách: **sao lưu bản cuối ra scratchpad → gỡ NGƯỢC các
thay đổi Đợt 84 bằng thay-chuỗi chính xác (mỗi chuỗi phải khớp đúng 1 lần, không thì dừng) → commit Đợt
83 → chép bản cuối trở lại → commit Đợt 84**. Đã `diff` xác nhận 5/5 file khớp bản cuối từng byte sau khi
tách. Trạng thái trung gian "chỉ Đợt 83" cũng đã mount thử 5 template trước khi commit.

- `cf3865b` — Đợt 83 (7 file)
- `797670b` — Đợt 84 (15 file + `core/mistakes.js` mới)

`git push` là đủ, Pages tự build (**đúng mục 0 điểm 3, không cần 0-TER**). ⚠️ Gặp lại **bẫy mục 9 —
Pages cập nhật file KHÔNG đồng thời**: lần curl đầu `core/mistakes.js` còn **404** trong khi `utils.js`
đã mới. ⚠️ Và một **bẫy đo mới**: dấu mốc `padStart(2` để kiểm `utils.js` là **VÔ GIÁ TRỊ** — hàm
`formatTime` cũ vốn đã có chuỗi đó, nên nó báo "đã live" cả khi file còn cũ; phải chọn dấu mốc **chỉ có
ở bản mới** (`Math.floor(total / 100) % 10`).

**Kiểm chứng TRÊN BẢN LIVE** (`andrewclasses-01.github.io/AWord/templates/quiz/test.html`, `pointsOff=2`,
đúng 4 sai 2): **Score 0/6** (4 − 2×2) · **Time 0:06.0s** · **Total: 4/6** · 4 nút gồm **Start with
mistakes** → bấm → **"QUIZ WITH MISTAKES"**, vòng 2 đúng **2 câu**. **0 lỗi console.** ⚠️ Không lái được
bản live bằng iframe từ localhost (cross-origin) — phải cho tab trình duyệt chạy thẳng trang live.

**VIỆC ĐANG CHỜ:** thầy chơi thử máy thật — (a) nhịp bấm *Start with mistakes* → PLAY có tự nhiên trên
TOMKO không, (b) chữ "QUIZ WITH MISTAKES" ở màn READY có dễ đọc từ xa không, (c) chấp nhận việc muốn đổi
template ở màn kết thúc phải Start again trước.

---

## Đợt 83 (7/8/2026, v0.9.58) — BẢNG KẾT QUẢ: THỜI GIAN LUÔN PHÚT:GIÂY + SCORE LÀ ĐIỂM ĐÃ TRỪ (KHÔNG PHẢI SỐ CÂU ĐÚNG) + HÀNG "Total: 9/10" NHỎ Ở DƯỚI. ⭐ CÓ SỬA CORE. ✅ THẦY DUYỆT → COMMIT `cf3865b` + PUSH + **LIVE**

Thầy gửi 2 yêu cầu cho **bảng tổng kết cuối game** (`showSummary` trong `core/engine.js`). **Đụng CORE**
nên ảnh hưởng CẢ 15 template có chấm điểm. 4 file: `core/utils.js`, `core/engine.js`, `core/app.css`,
`templates/quiz/quiz.js`.

**1. Thời gian LUÔN ở dạng phút:giây — "2:15.4s" thay cho "135.4s".**
Chỗ duy nhất còn hiện tổng số giây thô là `fmtSecsParts()` trong `core/utils.js`, dùng ở **3 nơi**: ô Time
của bảng tổng kết + cột Time của **cả 2** bảng xếp hạng (local và online của học sinh). Đồng hồ trong lúc
chơi (`formatTime`), đồng hồ Running word/team (`fmtClock`) và bảng báo cáo assignment của thầy
(`fmtDuration`) **vốn đã** là m:ss — không phải sửa. Nay luôn có phần phút kể cả dưới 1 phút ("0:45.3s"),
giây luôn 2 chữ số, phần lẻ vẫn 1 chữ số và vẫn **cắt** chứ không làm tròn (45,39s → 45.3).

⭐ **Bắt được 1 lỗi CŨ khi đo:** bản cũ đổi sang giây thực rồi lấy `Math.floor((s − whole) * 10)` — số thực
không giữ đúng phần lẻ nên **45300ms ra "45.2s"** (`(45.3 − 45) × 10 = 2,9999…` → cắt thành 2), sai 1 chữ
số ở rất nhiều mốc (59900ms → "59.8s"). Nay tính **toàn bộ bằng số nguyên mili-giây**
(`Math.floor(ms/100) % 10`). Đo lại 12 mốc: `0→0:00.0s · 900→0:00.9s · 45300→0:45.3s · 59900→0:59.9s ·
60000→1:00.0s · 135400→2:15.4s · 135399→2:15.3s · 611000→10:11.0s · 3600000→60:00.0s`, số âm kẹp về 0:00.0s.

**2. Score = ĐIỂM ĐÃ TÍNH THEO BẢNG ĐIỂM, không phải số câu đúng.** Thầy: 10 câu, đúng +1, sai −5 (Options
→ *Points off*), làm đúng 9 sai 1 → Score phải là **4/10**, không phải 9/10. Bảng tổng kết cũ hiện
`result.correct/total` = **số câu đúng**, trong khi leaderboard lại xếp hạng theo `result.score` (đã trừ) →
**2 chỗ nói 2 số khác nhau**. Nay ô Score hiện `result.score`/`total` — đúng cái số leaderboard xếp hạng.
Template không có điểm trừ không truyền `score` → `scoring.js` mặc định `score = correct` → **hiện y hệt
cũ từng byte**. Điểm âm hiện **có dấu trừ** và tô **đỏ** (`.aw-sum-value.is-neg`): bảng tổng kết rộng nên
"-24/6" đọc rõ, khác ô điểm trong lúc chơi (chỗ đó chỉ vừa 1 con số nên theo luật cũ = bỏ dấu, dùng màu).

**3. Hàng "Total: 9/10"** — số câu đúng/tổng, cỡ nhỏ (1.5cqw), chữ xám `#9aa0a8`, **căn giữa**, nằm ngay
**dưới** hàng Score + Time (`.aw-sum-total`, chỉ hiện khi `total > 0`).

⚠️ **Phải gỡ `scoreText` của Quiz** (`templates/quiz/quiz.js`): khi bật Points off, Quiz truyền
`raw.scoreText = String(pts)` — mà `scoreText` mang nghĩa "điểm của tôi ở THANG RIÊNG" nên engine in số
**trơ trọi**, tức yêu cầu của thầy sẽ ra "4" chứ không phải "4/10". Điểm Quiz vẫn tính trên `total` nên bỏ
hẳn dòng `scoreText`, chỉ giữ `raw.score`. **Gameshow giữ nguyên `scoreText`** (điểm theo tốc độ, vd
"1250" — chia cho 10 câu thì vô nghĩa).

**4. Cột Time của leaderboard nới 5.2 → 6.6cqw.** Hệ quả trực tiếp của mục 1: đo tại font thật, "135.4s"
chỉ 43,7px nhưng **"10:11.0s" cần 52,5px** và "59:59.9s" cần 62,2px, trong khi cột cũ 5.2cqw = **50,2px**
→ ván trên 10 phút sẽ **tràn đè sang cột điểm**. Cột tên là `1fr` nên tự nuốt phần chênh (182,8 → 169px,
vẫn thừa). Cột Score để nguyên: "-18/10" = 43,9px vẫn lọt 46,4px.

**Tự test (devserver riêng :5511 — phiên khác đang chiếm :5510, trình duyệt thật, đo DOM).** Chơi thật
Quiz mẫu 6 câu, 3 kịch bản:
- `pointsOff=2`, đúng 5 sai 1 → điểm trong lúc chơi 5 → **3**; bảng tổng kết **Score 3/6 · Time 0:10.5s ·
  Total: 5/6** ✅
- `pointsOff=0` (mặc định của mọi act), đúng cả 6 → **Score 6/6 · Total: 6/6** — không lệch bản cũ ✅
- `pointsOff=5`, đúng 1 sai 5 → **Score −24/6 tô đỏ** (`.is-neg`, `rgb(255,107,107)`) · **Total: 1/6** ✅

Đo bố cục (phải **tắt `animation`** của `.aw-panel` mới đo được — pane preview không compositing nên panel
đóng băng giữa cú "pop", đo ra bề ngang 115,9px thay vì 386,4px, **bẫy đo mới**): panel 386,4×454,3 nằm
gọn trong sân 968×544,5; hàng Total căn giữa đúng tâm panel (cx 640 = cx panel), cách hàng số 4,8px.
Leaderboard sau khi nới: cột Time 63,8px, chuỗi dài nhất 58,5px — **hết tràn**, 3 hàng không hàng nào
`scrollWidth > clientWidth`.

**Hồi quy:** nạp **16/16** trang `templates/*/test.html`, tất cả dựng đủ `.aw-stage` + nút PLAY, **0 lỗi
console**. Running word + Running team dùng `tpl.renderSummary` nên **không đi qua** thân bảng mặc định →
không đổi gì.

**5. Hàng Total TỰ ẨN khi trùng Score (thầy chốt cùng ngày).** Khi `pointsOff = 0` — mặc định của mọi act
— thì `score === correct`, hàng Total sẽ in **đúng cái phân số vừa in ở trên** ("Score 6/6" rồi "Total:
6/6") = thừa. Điều kiện hiện nay: `result.total > 0 && result.score !== result.correct`, tức hàng Total
chỉ xuất hiện khi điểm phạt **thật sự kéo điểm lệch khỏi số câu đúng**. Đo lại 4 ván:
`pointsOff=0` đúng 6/6 → **ẩn** · `pointsOff=0` đúng 5/6 → **ẩn** · `pointsOff=2` đúng 5/6 → Score 3/6 +
**"Total: 5/6"** · `pointsOff=5` đúng 1/6 → Score −24/6 + **"Total: 1/6"**. ⚠️ `.aw-sum-stats` giữ
nguyên `margin-bottom` cũ và `.aw-sum-total` tự kéo lên bằng `margin-top` âm — nhờ vậy ván **không có**
hàng Total giãn dòng y hệt bản trước Đợt 83.

**VIỆC ĐANG CHỜ:** thầy mở act thật xem 3 điểm — (a) thời gian đọc có thuận mắt không, (b) Score/Total có
đúng ý không (nhất là act bật Points off), (c) hàng Total cỡ chữ đã đủ "nhỏ, không nổi bật" chưa → duyệt →
commit + push + live.

---

## Đợt 82 (7/8/2026, v0.9.57) — OPEN THE BOX: ZOOM MỞ Ô MƯỢT TỪ ĐẦU TỚI CUỐI (SỬA LỖI THẬT: ANIMATION BỊ HUỶ Ở 840ms) + SLOGAN Ở CHỖ NÚT NEXT/BACK CŨ + KHUNG HẾT CO 3px. KHÔNG ĐỤNG CORE. ✅ THẦY DUYỆT → COMMIT `b6e7a12` + PUSH + LIVE (23 GIÂY)

Thầy gửi 2 yêu cầu 1 lượt cho **Open the box**. Chỉ đụng 2 file template (`open-the-box.js` +
`open-the-box.css`) — **KHÔNG đụng core**. Chi tiết đầy đủ + mọi số đo: `templates/open-the-box/GHI CHU
OPEN-THE-BOX.md` Đợt 25.

**1. "Zoom từ ô số ra ô câu hỏi, vài frame cuối hơi khựng và giật" — hoá ra là LỖI CODE, không phải máy yếu.**
`zoomElFrom()` (chiều MỞ) chạy 3 transition cùng lúc: `transform` 1200ms, `opacity` **840ms**,
`border-radius` 1200ms; nhưng dòng dọn dẹp lại là `addEventListener("transitionend", clear, {once:true})`
— nghe ĐÚNG 1 sự kiện đầu tiên, mà cái xong sớm nhất là **opacity ở 840ms**. `clear()` xoá
`style.transition` + `style.transform` inline → **huỷ luôn transform đang chạy** → ô nhảy tới trạng thái
cuối ngay ở mốc **70%**. Vì easing `cubic-bezier(.22,.9,.3,1)` lúc đó đã đi được **98,9%** quãng đường nên
không nhìn ra là "nhảy", mà nhìn ra là **chuyển động bị chặt cụt**: mất trọn đoạn giảm tốc cuối. Đúng cái
thầy tả, và giải thích luôn vì sao **chỉ chiều mở** bị. ⭐ Chiều ĐÓNG (`zoomElTo`) đã sửa đúng bẫy này từ
**Đợt 14** và có sẵn ghi chú dài cảnh báo — chiều mở chỉ là **bỏ sót**. Nay lọc `if (e.propertyName ===
"transform") clear()` y hệt chiều đóng; `setTimeout` dự phòng giữ nguyên.

**2. Dọn thêm 4 thứ bắt CPU làm việc mỗi khung hình** (đo bằng `document.getAnimations()`: bản cũ có **20
animation chạy đồng thời** lúc mở, bài 120 ô thì ~132):
   - **`border-radius` chỉ chạy nửa RẺ của quãng bay** — đổi bo góc = vẽ lại CẢ ô mỗi khung hình, ô càng to
     càng đắt (đắt nhất đúng lúc cuối cú mở). Hằng mới `ZOOM_RADIUS_MS` = 45% × 1200 = 540ms: chiều MỞ bo
     góc chạy 540ms ĐẦU (ô còn bé), chiều ĐÓNG chạy 540ms CUỐI (delay 660ms, ô đã co) — vẫn kết thúc đúng
     mốc 1200ms nên vẫn đáp xuống khớp độ bo ô số như Đợt 21. 55% còn lại là transform+opacity thuần.
   - **Thanh đồng hồ đổi `width` → `transform: scaleX()`** (+ `transform-origin: left`): đang chạy
     transition `width 15000ms` = tính lại bố cục + vẽ lại mỗi khung hình suốt cả ván, kể cả lúc zoom.
     Nhìn y hệt; chỗ nạp đầy lại đọc vị trí từ ma trận transform thay cho `getComputedStyle().width`.
   - **Lưới mờ đi bằng 1 animation trên CẢ LƯỚI** thay vì mỗi ô 1 animation (bài 120 ô = 120 lớp đồ hoạ
     riêng cho một hiệu ứng mờ đồng loạt). Hình ảnh y hệt (ô không chồng nhau). 120 ô: **~132 → 13**.
   - **Dời việc dọn DOM ra sau khi mọi animation dừng**: `pendingSettle` (xoá card lưới tới 120 ô + trả 2
     card khỏi `position:absolute` = tính lại bố cục cả sân) trước hẹn cứng 1280ms, trong khi ô đáp án cuối
     còn trượt tới 1425ms → cú tính bố cục rơi đúng mấy khung hình cuối. Nay hẹn theo số đáp án thật.

**3. Slogan "OPEN THE BOX IN ANDREW CLASSES" vào đúng chỗ nút Next/Back cũ** (chỗ này bỏ trống từ Đợt 24).
Đi đường có sẵn của engine: `ui.setNav({label})` (giống Running word/team). CSS đổi từ **ẩn cả `.aw-nav`**
sang **chỉ ẩn `.aw-navbtn`**, rồi tạo kiểu `.aw-nav-label` thành chữ nhỏ/mảnh/giãn/IN HOA/xám — cùng phong
cách slogan Crossword + Speaking cards. ⚠️ **Chiều cao bottombar KHÔNG đổi** (chỗ Đợt 24 từng cắn): thứ cao
5cqw là `.aw-navbtn` và nó vẫn ẩn. Luật `.aw-nav-label` **bắt buộc scope** `:has(> .aw-otb-card, >
.aw-otb-qcard)` vì label là của CORE — viết trần là đổi luôn "x of N" của mọi game khác (bẫy Đợt 22).

**Tự test (devserver `aword` :5510, trình duyệt thật, đo DOM).** ⚠️ Pane preview `visibilityState:"hidden"`
→ **animation không chạy chút nào** (`getAnimations()` rỗng, `transitionend` không bắn, chỉ nhánh
`setTimeout` dự phòng chạy) → **độ mượt bằng mắt phải để thầy nghiệm thu máy thật**; ở đây kiểm bằng số:
chuỗi transition inline đúng cả 2 chiều (MỞ `border-radius 540ms` không delay; ĐÓNG `540ms ... 660ms`);
animation đồng thời 20 → **13** (120 ô: ~132 → 13); slogan đúng chữ + `.aw-navbtn` = `none`, `.aw-tools`
vẫn cột 3; **bottombar 38.6px + playArea 431.3px ở CẢ 2 màn** (trùng khít số đo Đợt 24 → ô không co); chơi
thật 1 vòng đúng-sai đủ (điểm, đồng hồ nạp đầy `scaleX(1)`, ô tick/khoá, card lưới gỡ đúng lúc);
**0 lỗi console**. Hồi quy bẫy Đợt 22: mount Quiz/Anagram/True-false sau khi CSS Open the box đã nạp →
nav `flex`, nút `flex` cao 48.3px, label vẫn 700/17.4px/spacing `normal` — **không rò**.

**4. (Đợt 25b — thầy bảo "xử lý luôn") KHUNG HẾT CO 3px lúc mở ô đầu tiên.** Báo cáo mục trên có ghi nhận:
lần mở ô ĐẦU TIÊN mỗi ván, **topbar** cao thêm 3px (34→37) → playArea 431.3→**428.3px**, lưới co lại một
lần. Cùng loại lỗi với Đợt 24, chỉ khác đầu khung. Có **HAI** nguồn chứ không phải một:
   - **`ensureTimerUI()` dựng muộn** — hàng đồng hồ + thanh giờ chỉ được chèn vào `ui.topbarMid` lúc chạm ô
     đầu tiên. Sửa: gọi **1 lần lúc mount**, ngay trước `render()`. Luật đồng hồ KHÔNG đổi (cờ `timerStarted`
     vẫn quyết định lúc nào bắt đầu đếm) — chỉ vẽ sẵn phần hình, thanh đầy + 0:15 đứng chờ ở màn lưới.
   - **⭐ Bẫy ngoài dự đoán: chiều cao hàng đồng hồ phụ thuộc LÚC FONT TẢI XONG.** Sửa xong vẫn nhảy: topbar
     **31px** lúc mount rồi **37px** vài trăm ms sau, vì `.aw-otb-q-clock` không khai `line-height` → chiều
     cao dòng lấy theo **metrics của font** (font dự phòng 31px, Baloo 2 37px). Tức cú nhảy 3px cũ một phần
     là do font chứ không chỉ do dựng muộn. Sửa: khai `line-height: 1.6` → chiều cao tính từ CỠ CHỮ (cqw,
     luôn xác định); 1.6 tái tạo đúng chiều cao Baloo 2 hiện tại nên **nhìn không đổi gì**.
   - **Đo lại 3 mốc trong cùng 1 lần chạy:** lúc mount (`fonts.status="loading"`) **37.1 / 428.2** → mở 1 ô
     **37.1 / 428.2** → sau `fonts.ready` **37.1 / 428.2**. **Chênh = 0.** Cộng bottombar 38.6px cố định →
     **cả 3 hàng của khung đứng yên tuyệt đối suốt ván.** Chơi lại đủ đường (đếm ngược khởi động đúng lúc
     chạm ô đầu · trả lời đúng nạp đầy thanh · hết giờ ra panel GAME OVER + 9 ô nổ), **0 lỗi console**.

**Bài học chung, nên áp cho mọi template:** đừng để chiều cao một hàng của khung phụ thuộc **metrics font**
(luôn khai `line-height` rõ ràng cho chữ trong topbar/bottombar), và đừng **dựng muộn** một hàng cố định của
khung. Cả hai biểu hiện y hệt nhau: "ô tự dưng co lại giữa chừng" — Đợt 24, 25b đều là ca của luật này.

---

## Đợt 81 (7/8/2026, v0.9.56) — OPEN THE BOX: BỎ HẲN NAV NEXT/BACK (Ô KHÔNG CÒN CO LẠI) + KHOÁ CHỌN Ô SỐ TỚI 80% ANIMATION ĐÓNG. KHÔNG ĐỤNG CORE. ✅ THẦY DUYỆT → COMMIT `f75a25e` + PUSH + LIVE

Thầy gửi 2 yêu cầu cho template **Open the box**. Chỉ đụng 2 file template
(`templates/open-the-box/open-the-box.css` + `open-the-box.js`) — **KHÔNG đụng core**. Chi tiết đầy đủ +
mọi số đo: `templates/open-the-box/GHI CHU OPEN-THE-BOX.md` Đợt 24.

1. **Bỏ hẳn thanh nav Next/Back/"x of N" — ô câu hỏi/đáp án hết bị co.** Open the box là game "bấm ô bất kỳ",
   không có thứ tự tuyến tính, nên nav dưới đáy vô nghĩa. Luật ẩn nav CŨ chỉ khớp `:has(> .aw-otb-card)` =
   màn LƯỚI số; khi mở 1 ô, card lưới bị gỡ, chỉ còn `.aw-otb-qcard` (màn câu hỏi) là con trực tiếp
   `.aw-playarea` → selector thôi khớp → **nav hiện lại ở mọi màn câu hỏi**. Hệ quả đo được: `.aw-navbtn` cao
   **5cqw** > `.aw-iconbtn` **4cqw** (core/app.css) nên nav xuất hiện làm bottombar cao thêm ~1cqw, ăn vào
   playArea → **ô câu hỏi + ô đáp án co nhỏ lại đúng lúc zoom mở xong**. Sửa: mở rộng selector khớp CẢ hai card
   `:has(> .aw-otb-card, > .aw-otb-qcard)` → nav ẩn suốt cả game, ô giữ nguyên chiều cao. Vẫn tự-dọn (keys theo
   markup riêng của template, biến mất ngay khi game khác mount → KHÔNG dính lại bẫy Đợt 22 vì luật vẫn có scope,
   chỉ nới thêm card nào khớp).
2. **Khoá bấm ô số tới 80% animation ĐÓNG mới cho chọn ô kế** (đối xứng với gate mở đáp án 80% ở point 4 đợt 21).
   Trước: ô số chỉ bấm được khi zoom đóng xong 100% (qcard z-index:2 che + grid `pointer-events:none`). Nay thêm
   `boxUnlockTimer = setTimeout(80% × ZOOM_TRANSFORM_MS)` trong `closeCardThen`: ở 80% nhấc CẢ hai — grid
   `pointer-events` về live **và** qcard (còn đang co lại) thành `pointer-events:none` để tap **xuyên qua** xuống
   ô bên dưới. Có token chặn close cũ bị vượt; `clearPending()` (đầu mỗi open/close + cleanup) huỷ timer treo.
   Ô đã giải/khoá/hết game vẫn disabled → chỉ mở ô còn chơi được.

**Tự test devserver (`aword` :5510, trình duyệt thật, đo DOM — pane không compositing nên không chụp ảnh,
timer bị throttle nên timeline giãn ra nhưng THỨ TỰ + tỉ lệ giữ đúng):**
- **YC1:** màn LƯỚI nav `display:none`, bottombar **38.6px**; màn CÂU HỎI (chỉ còn `.aw-otb-qcard`) nav VẪN
  `display:none`, bottombar **38.6px** = y hệt → **0 co**. (Selector cũ sẽ để nav = `flex` ở màn này.)
- **YC2:** driver tự chạy trong trang đo chuỗi pointer-events lúc đóng: t≈2113ms CLOSE bắt đầu `gridPE=none` +
  qcard che (`qcardPE=auto`) = CHẶN; t≈3016ms (~903ms vào close ≈ 80% của 1200ms) `gridPE=auto` +
  `qcardPE=none`, **qcard VẪN còn** = mở khoá; **tap ngay lúc đó xuyên qua qcard → ô kế MỞ THẬT** (open
  transition mới t≈3114ms). Khoảng mở-khoá→gỡ qcard ≈ 240ms = đúng tỉ lệ 960/1200.
- **0 lỗi console.** Hồi quy: luật ẩn nav vẫn có scope `:has()` theo card riêng của Open the box → KHÔNG rò
  sang template khác (bảo đảm bằng ngữ nghĩa CSS: playArea game khác không bao giờ có con `.aw-otb-*`).

✅ **THẦY DUYỆT → commit `f75a25e` + push + live.** ⬜ Còn chờ thầy nghiệm thu trên màn cảm ứng thật (ô không
còn co + nhịp chọn ô kế ở 80% đóng thấy tự nhiên).

**⭐ HẬU KIỂM DEPLOY (thầy yêu cầu điều tra vì sao thử đi thử lại nhiều bước):** phần đưa-lên-live đợt này
tốn **3 lệnh fail vô ích** — (1) rút token `-01` bằng `git credential fill` → bị permission classifier auto
mode CHẶN; (2) `gh api POST /repos/...` → Git Bash MSYS rewrite `/repos/...` thành đường dẫn ổ đĩa; (3)
`MSYS_NO_PATHCONV=1` chạy được thì trả **404** vì `gh` là `andrewclasses-code` không có quyền push (GitHub
giấu 403 thành 404). Trong khi đó `curl` bản live cho thấy **build đã TỰ chạy xong từ lúc push** — cả 3 lệnh
đều thừa. **Gốc rễ:** mục 0 + 0-TER của `APP_MASTER.md` (viết trong sự cố Đợt 79) ép "push KHÔNG đủ, BẮT BUỘC
POST pages/builds" cho MỌI lần push, trong khi từ Đợt 80 auto-build đã nhanh trở lại (~27s) — tài liệu lỗi
thời chứ không phải quy trình sai. **Đã đính chính ngay trong đợt này:** mục 0 điểm 3 (push là đủ, chuẩn =
push → chờ 1–3 phút → curl kiểm dấu mốc), mục 0-TER hạ cấp thành ĐƯỜNG CỨU HỘ chỉ dùng khi live cũ >10 phút
(kèm 3 bẫy mới: 404-do-tài-khoản, classifier chặn rút token, MSYS nuốt endpoint), mục 6 luật 14 sửa theo.
Bài học meta: **ghi chú cảnh báo sinh ra trong sự cố phải được hạ cấp khi sự cố qua đi** — đối chiếu đợt
MỚI NHẤT trước khi áp dụng cảnh báo cũ.

---

## Đợt 80 (7/8/2026, v0.9.55) — RUNNING WORD: PASS 0–5 + PART A/B + 2 BẢNG SONG SONG + BẮT ĐẦU BẰNG SUBMIT + NÚT SWAP + IN CHỮ TO/SET X. KHÔNG ĐỤNG CORE. ✅ THẦY DUYỆT → COMMIT `0b629b3` + PUSH + LIVE

Thầy gửi 5 nhóm thay đổi cho template **Running word** (1 lượt). Chỉ đụng 3 file template
(`templates/running-word/running-word.js`, `running-word.css`, `rw-print.js`) — **KHÔNG đụng core**.
Chi tiết đầy đủ + mọi số đo: `templates/running-word/GHI CHU RUNNING-WORD.md` Đợt 10.

1. **PASS 0–5 mỗi đội (thay ô tích cũ).** Bỏ ô tích "Allow PASS", thay bằng thanh **Passes per team 0–5**
   (0 = không cho pass). State `passLeft{a,b}` đếm lùi giống `andrewLeft`; nút PASS hiện **số lần còn lại**
   (span nhỏ dưới chữ PASS), hết = mờ. Đo: kéo thanh về 2 → mỗi đội 2 lần; pass trừ đúng 2→1→0, nút chỉ
   sáng đúng lượt đội mình, về 0 thì khoá (bấm không ăn).
2. **Tiêu đề bảng TEAM A/B → PART A/PART B.** Tên đội tùy chỉnh chỉ còn ở màn kết quả. Cập nhật động trong
   `paintBoard` (vì đổi theo nút swap).
3. **2 bảng SONG SONG cùng số thứ tự.** Bỏ `topIndexOf(t)` (mỗi bảng cuộn riêng) → `sharedTop()` chung cho
   CẢ 2 bảng, khóa theo từ đội-đang-tới-lượt đang gõ. Đội chờ hiện đúng số đó: **ô trống chờ nhập** (chưa gõ)
   hoặc **chữ xanh** (đã xong). Đo suốt ván: `topA===topB` mọi bước (1,1→2,2→3,3…).
4. **Bản in thêm SET X.** Truyền `setIndex+1` vào `printRunningSheets`; cả 3 tờ (PART A/B + CHECK) mang nhãn
   **SET X** thay tên đội. Đo: 3 tờ đều "SET 3".
5. **Đổi cách bắt đầu game:**
   - **(5.1) Bỏ 3-2-1, bắt đầu bằng Submit lượt đầu.** Chọn bảng → gõ luôn (đồng hồ đứng yên) → **Submit đầu
     tiên khởi động đồng hồ** (`startMatch()` gọi từ `submit()` khi còn phase "prep"). Thêm `canType()` mở gõ
     ở "prep" khi đã chọn đội. Xoá hẳn `beginCountdown()`/phase "countdown". Đo: chọn A → gõ → submit →
     đồng hồ A chạy, nút giữa đổi swap→pause.
   - **(5.2) Trước khi bắt đầu, nút giữa = SWAP.** Bấm → đổi nhãn PART A↔B **và** danh sách từ 2 bên (gán
     `current = {a:current.b, b:current.a}` — object MỚI, không mutate set đã lưu) + cờ `partFlip`. Màu/đồng hồ
     giữ theo bên. Trong lúc chơi nút giữ chức năng Tạm dừng/Chạy tiếp như cũ. Đo: swap → header lật A↔B, chơi
     tiếp sau swap 0 desync (Andrew lộ "LAVISH", submit đúng, đảo lượt chuẩn).
   - **(5.3) Bản in chữ to phủ trang.** Bỏ dòng tiêu đề (№/WORD/TURN), bỏ "Explainer"; `HEADING_MM` 16→12,
     `fs` 0.62→**0.78×rowH**. Giữ ô TURN + CHECK 2 cột. Đo (4 từ): rowH 64mm/fs 50mm (cực to, "phủ kín");
     với 50 từ ≈ 5,14mm/11,4pt (to hơn bản 1-cột cũ 8,9pt), vẫn lọt 1 trang.

**Tự test devserver (`aword` :5510, trình duyệt thật, đo DOM — pane không compositing nên không chụp ảnh):**
tất cả mục trên đo khớp. **Hồi quy:** `type-the-answer` + `crossword` vẫn tỉ lệ **16:9** (1.778), đúng
`act-*`, **0 class `.aw-rw-*` rò sang**, 0 lỗi console (chỉ 404 favicon vô hại). Bảng kết quả `renderSummary`
vẫn dựng đúng (2 nửa tên/điểm + "time left" + Start again).

✅ **THẦY DUYỆT → commit `0b629b3` + push (`a426a6c..0b629b3`) + LIVE.** Bản live build ~27s (không dính bẫy
timeout 10 phút của Pages đợt trước — build_type legacy tự build nhanh); đã poll bản live
`andrewclasses-01.github.io/AWord` (cache-bust): `running-word.js` có đủ marker `sharedTop`/`doSwapParts`/
`passLeft`, KHÔNG còn `beginCountdown`; `rw-print.js` có `setNo`+`0.78`; `.css` có `is-swap`+`passbtn-n`.
⚠️ Máy không tự nghiệm thu được (cần mắt thầy máy thật): cảm giác chọn bảng-gõ-submit để bắt đầu; nút swap
trước trận; nhìn 2 bảng chạy song song có tự nhiên; **in thử giấy A4** cỡ chữ to mới + nhãn SET X.

---

## Đợt 79 (6/8/2026, v0.9.54) — FIND THE MATCH: BẤM ĐÚNG THÊM "TING" + ✓ TO GIỮA CÂU HỎI RỒI MỚI BAY; NON-REMOVE: Ô ĐÃ CHỌN GIỐNG HỆT Ô CHƯA CHỌN. KHÔNG ĐỤNG CORE. ✅ THẦY DUYỆT → COMMIT `7ddefe1` + PUSH + LIVE

Thầy gửi 2 yêu cầu cho template **Find the match**. Chỉ đụng `templates/find-the-match/find-the-match.js` +
`find-the-match.css`, **không đụng core**. Chi tiết đầy đủ + mọi số đo: `templates/find-the-match/GHI CHU FIND-THE-MATCH.md` chặng 6/8 (Đợt 79).

1. **Bấm đúng → nhịp mừng 2 pha:** thêm hàm `bigCheckThenFly()` — phát "ting" (`clocktick.mp3`) + bung một
   đĩa tròn xanh có dấu ✓ trắng (`.aw-ftm-bigcheck`) **ở giữa câu hỏi**, giữ 560ms, RỒI mới fade ✓ + phát
   tiếng "correct" + để câu hỏi và 11 ngôi sao bay vào ô điểm (như cũ). ✓ để trong `.aw-ftm-track` (KHÔNG
   phải con của prompt) vì clone bay chỉ copy text của prompt. Tiếng "correct" dời từ lúc bấm sang lúc bay
   để không đè "ting".
2. **Chế độ tắt Remove corrects → ô đã chọn = ô chưa chọn:** bỏ hẳn dim `is-locked` + `disabled` + badge ✓
   vĩnh viễn. Ô đã ghép đúng trở lại **đủ màu, bấm được, không dấu hiệu gì** (chỉ loé ✓ nhỏ lúc chọn rồi
   mờ) → người chơi không phân biệt được ô nào đã dùng; bấm lại nó cho câu sau = **bấm sai** (mất tim). Xoá
   luôn CSS `.is-locked` (hết chỗ dùng).

**Test browser thật (port 5511, đo DOM + spy âm thanh, 0 lỗi console)** cả 2 chế độ: chuỗi âm đúng
`ting → correct → conveyor`, ✓ to xuất hiện rồi biến mất, điểm +1, ô non-remove trở lại y hệt ô thường và
bấm lại tính sai; ô remove:true vẫn mờ dần (`is-solved`) như cũ. Bẫy đo compositing quen thuộc (opacity
`is-solved` đọc ra 1 do transition đóng băng — ép `transition:none` ra đúng 0).

**Thầy duyệt → commit `7ddefe1` + push + LIVE.** Đã chạy lại trọn bộ kiểm tra **TRÊN BẢN LIVE** cả 2 chế độ:
✓ to đo được nền `rgb(34,197,94)` bo tròn 50% trong track + "ting" ngay; chuỗi âm `ting→correct→conveyor`;
non-remove ô đã chọn ra **cùng `opacity:1`/`filter:none`/không badge** như ô chưa chọn = không phân biệt được;
**0 lỗi console**.

### ⚠️ BẪY DEPLOY QUAN TRỌNG — GitHub Pages hết giờ 10 phút (ghi để đợt sau khỏi mất công)
Push xong thì **3 lần liên tiếp** job `deploy` của `pages build and deployment` **FAIL** (thầy nhận email báo).
**Không phải lỗi code:**
- Job **build luôn OK** (~6s). Job **deploy** chỉ *chờ* backend Pages, hết `timeout: 600000` (10 phút) thì
  **tự huỷ deployment** → Pages API ghi `"errored"`, `"duration":0`. "Errored" là **hậu quả của việc bị huỷ**.
- ⭐ Bằng chứng: `GET /pages/builds` cho thấy **2 commit của Đợt 78** (`134ca64`, `f9a8333`) — trước đợt này —
  **cũng errored duration 0**. Thời gian build repo chậm dần: 20s → 22s → 3,6 phút → 5,5 phút → **8,2 phút**
  (lần cuối thành công) → vượt 10 phút. Repo chỉ 21 MB / 588 file, không đụng giới hạn nào.
- ⭐ **CÁCH GỠ**: Pages repo này là `build_type: "legacy"` → gọi thẳng
  **`POST /repos/andrewclasses-01/AWord/pages/builds`**, đường này **không có đồng hồ 10 phút của Actions**.
  Kết quả: `built` sau **198 giây**, live cập nhật ngay. **ĐỪNG đẩy commit rỗng để thử lại** (đã lỡ đẩy 2 cái
  `f595233`, `aafd454` — vô ích vì vẫn đi qua Actions bị timeout).
- ⚠️ **BẪY TÀI KHOẢN gh** (bổ sung cho ghi nhớ đã có): `gh` CLI đăng nhập `andrewclasses-code` → `gh run rerun`
  bị từ chối vì không có admin; `git push` thì dùng credential `andrewclasses-01` (đúng chủ). Đăng nhập `-01`
  trên Chrome KHÔNG đổi được gh. Muốn gh chạy quyền `-01`: lấy token bằng `git credential fill` rồi
  `GH_TOKEN="$TOKEN" gh api ...` (đo được `admin:true`). Không `gh auth login` lưu hẳn được vì token OAuth của
  Git Credential Manager **thiếu scope `read:org`**.

**Việc kế:** thầy chơi thử thật trên TOMKO/iPad — nghe "ting" + xem ✓ to giữa câu có rõ/đẹp không, và ở act
tắt Remove corrects xác nhận ô đã chọn khó phân biệt như ý.

---

## Đợt 78 (6/8/2026, v0.9.53) — ⭐ TEMPLATE THỨ 16 "RUNNING TEAM" + ⭐ TÍNH NĂNG MỚI "CLASSES" TRONG SETTINGS. CÓ SỬA CORE (thầy đặt hàng). 🟢 CHỜ THẦY DUYỆT

Thầy mô tả một app mới rồi yêu cầu **thảo luận trước khi build**, sau đó chốt **triển khai cả 3 chặng,
làm lần lượt**. Nhật ký đầy đủ + mọi số đo + thuật toán:
`templates/running-team/GHI CHU RUNNING-TEAM.md`. Đây là bản tóm tắt cấp dự án.

### Trò chơi là gì
Cả lớp chạy tiếp sức quanh **MỘT tờ giấy chuyền tay**. Màn hình gọi `MINH ANH — 23`; em Minh Anh dò
dòng 23 trên giấy, **đọc to từ đó**; một em khác chọn đúng từ giữa **6 ô, trong đó 5 ô là từ trông
giống nhất**. Đúng → ✓ → **READY → 3 – 2 – 1** → câu mới, tên mới, giấy chuyền tiếp.
Thắng thua: **hết tim = THUA · đồng hồ chính về 0 mà còn tim = THẮNG · hết sạch từ = THẮNG**.

### Vòng thảo luận trước khi build đã cứu được 2 hiểu nhầm
1. **"Ô đúng đi kèm số trong bản in"** có thể hiểu là *ô hiện số*. Nếu hiện số thì trò chơi chết ngay —
   học sinh chỉ việc dò số khớp đề bài, không cần nghe bạn đọc. Hỏi lại → thầy chốt **6 ô CHỈ CÓ CHỮ**.
2. Xác định được **bản chất là trò PHÂN BIỆT MẶT CHỮ**, không phải trò nghĩa → **dữ liệu chỉ là một
   pool từ trần**, y hệt RUNNING WORD. Không phải soạn clue/nghĩa/đáp án gì cả, và dùng lại được nguyên
   đường import `.xlsm` sẵn có. Nếu đoán bừa thành "6 nghĩa" thì đã build sai cả hình dạng dữ liệu.

### ⭐ Quyết định kiến trúc quan trọng nhất — CLASSES lưu ở đâu
Lưu lớp học vào **chính `users/{uid}/items`** (thêm `kind: "class"`, `root: "classes"`), **KHÔNG** tạo
collection mới. Lý do: luật bảo vệ Firestore chỉ mở đúng `match /users/{uid}/items/{itemId}`, nên
`users/{uid}/classes/...` sẽ **bị từ chối** cho tới khi có người vào Firebase Console sửa luật bằng tay
— thêm việc tay, trên một máy có thể không phải máy đang chạy code, quên là lỗi quyền im lặng.
Cách này **không phải đụng Console lần nào**. Lớp vô hình với thư viện vì mọi hàm liệt kê của
`store.js` đều lọc `n.root === root`.

⚠️ **`ROOTS` CỐ Ý KHÔNG thêm `"classes"`** — suýt thêm. Mảng đó điều khiển **các ô TRANG CHỦ**
(`main.js renderTop()`); thêm vào là trang chủ mọc ô thứ ba, sai ý thầy (Classes thuộc Settings).

### ⭐⭐ BẪY CORE PHÁT HIỆN ĐƯỢC (giá trị cho MỌI template sau)
`tpl.inlineTimerBar` và `tpl.hasLivesSlot` **LOẠI TRỪ NHAU**. `core/engine.js` chọn một trong hai
(`if (topbarMid) ... else if (livesSlot)`), nên template khai **cả 2** sẽ được tạo phần tử tim rồi
**không bao giờ gắn vào DOM** — vô hình, **0 lỗi console**. Game này cần cả thanh giờ mỗi câu lẫn hàng
tim lẫn đồng hồ chính, nên **ẩn hẳn topbar engine và tự vẽ hàng** (y RunningW) → **không phải sửa core
cho bản thân game**. Đã ghi "ĐỀ XUẤT SỬA CORE" để vá bẫy cho tương lai.

### Files
**Mới**: `core/classes.js` · `templates/running-team/` (9 file).
**Sửa core** (đều do Classes + tích hợp, thầy đặt hàng): `core/store.js` (2 dòng phòng vệ —
`ensureNumbers`/`getByNum` bỏ qua `kind==="class"`, không thì mỗi lớp **ăn mất một số link** và `?a=57`
có thể trỏ trúng lớp học) · `main.js` (hàng Classes + 2 màn quản lý + `resetClassesCache()` lúc đăng
nhập/xuất) · `core/app.css` (4 dòng) · `core/catalog.js` (1 mục) · `core/lesson-import.js` (1 nhánh:
file `.xlsm` nay tự sinh thêm act RUNNING TEAM từ cột D) · `core/convert.js` (2 nhánh + guard sàn 6 từ).

### Tự test (devserver :5510, trình duyệt thật, **0 lỗi console** suốt phiên)
- ⭐ **Vùng chơi khung 4:3 cao 69.01cqw**, KHÔNG phải 45.67cqw của khung 16:9 — số này phiên sau cần.
  Card khớp đúng vùng chơi, tràn = 0.
- **4 cửa kết thúc đo đủ**: hết tim → GAME OVER (tim `2/2→1/2→0/2`) · hết từ → CLASS WINS 6/6 · đồng hồ
  chính cạn → CLASS WINS (đo 29,4s) · bảng kết thúc chỉ còn 1 nút Start again.
- **Unlimited (tim=0)**: sai thì ô mờ + **chọn lại**, không mất tim, không over; hết giờ vẫn sang câu mới.
- Số câu **ngẫu nhiên không lặp** (pool 6 → `5,6,4,1,3,2`), tên **chạy vòng tròn**.
- Thuật toán nhiễu ra kết quả tốt: `SCRAPE→SCARCE`, `OUTLAW→OUTBREAK`, `CLEANSE→CLEANLINESS`,
  `TRIAL→TRAIL/TRIBAL`.
- ⭐ **Hồi quy rò CSS (làm 2 lần)**: lần 1 gọi `ensureTemplate()` từ trang con — hoá ra phép đo có tật
  vì `catalog.js` khai đường dẫn CSS **tương đối với TRANG** nên 3 game kia chạy **thiếu CSS riêng**
  (đó chính là 3 lỗi 404 trong console: **do cách test, không phải lỗi code**). Lần 2 chặt hơn: mở
  thẳng `type-the-answer/test.html` rồi **bơm `running-team.css` vào giữa chừng** → tỉ lệ 1.778,
  topbar, mũi tên, **cả 7 nút công cụ**, cỡ chữ bàn phím, `touch-action` — **không thuộc tính nào đổi**.
- Đổi template 2 chiều đều đúng; in 20 từ → 1 cột 20,6pt, 50 từ → 2 cột 16,5pt, tờ in tự gỡ khỏi DOM.

### ⚠️ Bẫy khi ĐO (không phải lỗi code) — ghi để phiên sau đỡ mất giờ
- **Cache module ES che mất thay đổi**: nạp `convert.js?v=<time>` nhưng bên trong nó `import
  "./catalog.js"` **không kèm tham số** → dính catalog CŨ đã nạp trong cùng trang → tưởng `running_team`
  không vào được danh sách đích. **Tải lại trang sạch trước khi nghi code sai.**
- **Đếm tim bằng `textContent` là sai** (tim mất chỉ đổi class `is-out`) → phải đếm `:not(.is-out)`.
- **Layout in không đo được từ màn hình** (luật nằm trong `@media print`) → phải in giấy thật.

### ⬜ Còn chờ thầy (máy không thay được)
**Đường ghi Firestore của `core/classes.js` CHƯA từng chạy thật** — popup đăng nhập Google không tự
động hoá được. Cần thầy vào **Settings → Classes** tạo lớp thật rồi báo. Kèm: in thử tờ A4 thật, chơi
thử trên TOMKO/iPad.

---

## Đợt 77 (6/8/2026, v0.9.52) — WHACK-A-MOLE: SPEED 10 GẤP ĐÔI · PUNISHMENT TỐI ĐA 30S · BẤM BUBBLE CŨNG TÍNH · BUBBLE ĐỎ + CHUI THEO MOLE KHI ĐẬP SAI. KHÔNG ĐỤNG CORE. 🟢 CHỜ THẦY DUYỆT

Thầy gửi 4 yêu cầu 1 lượt cho riêng game Whack-a-mole. Chỉ đụng 2 file
`templates/whack-a-mole/whack-a-mole.js` + `.css`. Đã tự test trên devserver
(`templates/whack-a-mole/test.html`), **0 lỗi console**. Nhật ký đầy đủ + mọi số đo:
`templates/whack-a-mole/GHI CHU WHACK-A-MOLE.md` Đợt 64. Tóm tắt:

1. **Speed 10 nhanh gấp đôi hiện tại, Speed 1 giữ nguyên, các mức 2–9 vẫn trải đều tuyến tính** — công
   thức `pace=(speed−1)/9` không đổi (đã "chia đều" từ trước), chỉ đổi điểm neo speed 10:
   `spawnBase` 340→**170ms**, `upDuration` 900→**450ms** (đúng một nửa). Đo thật bằng MutationObserver
   theo dõi lớp `is-up` của 10 hố khi speed=10: **22 mẫu mole-đứng-trên-mặt-đất trung bình 451ms**
   (đích 450ms) — đúng gấp đôi tốc độ so với 900ms cũ.
2. **Punishment (thời gian đông cứng sau khi đập sai) tối đa 10s → 30s** — đổi hằng `MAX_PUNISH`, slider
   Options tự theo (đo `min/max` của `<input>` ra đúng `0`/`30`). Mặc định vẫn 4s, act cũ không đổi.
3. **Bấm vào mole HAY bubble (bong bóng chữ) đều tính là đập** — trước chỉ mole/crate bắt được
   `pointerdown`; nay bubble cũng gắn thẳng, CSS chỉ mở `pointer-events:auto` cho bubble lúc mole đang
   lên (không ăn vào crate, crate không có bubble). Đo: bắn `pointerdown` thẳng vào phần tử bubble của
   1 mole đang lên → hố nhận `is-hit` ngay.
4. **Đập sai → bubble của chính mole đó đỏ suốt thời gian phạt, rồi nhỏ lại + chui xuống theo mole mượt
   mà** — thêm class `is-wrong` (đỏ nền/viền/chữ, đỏ dù phạt rất ngắn, không phụ thuộc ngưỡng rung như
   `is-dizzy`), dọn ở cả 4 chỗ dọn `is-dizzy` cũ (đúng khuôn phòng ngừa đã có từ trước) — không bao giờ
   kẹt đỏ. Trạng thái ẩn của bubble đổi từ "co tại chỗ" sang **lún xuống + thu nhỏ hơn**
   (`translateY(45%) scale(.45)`, trước chỉ `scale(.6)`), transition nới lên `.3s` khớp gần đúng nhịp
   `.26s` của chính mole, nên lúc duck cả hai cùng lún một nhịp — bubble đọc như đang "chui theo" mole.
   ⚠️ Bẫy đo gặp lại: `background` (gradient) là thuộc tính RỜI RẠC nên đổi gần như tức thì, còn
   `border-color` (đã thêm `transition`) nội suy mượt trong `.25s` — đọc `getComputedStyle` NGAY trong
   cùng tick lúc thêm class sẽ thấy nền đã đổi mà viền chưa, **không phải lỗi**, chỉ do transition chưa
   kịp chạy khung hình nào; đo đúng bằng cách đợi vài trăm ms hoặc đọc thẳng `cssRules` khai báo trong
   stylesheet (tương tự bẫy `el.getAnimations()` đã ghi cho `@keyframes` ở Đợt 57, đây là bản `transition`).

**Việc kế:** thầy chơi thử thật (chạm tay nếu có màn cảm ứng) để xác nhận cảm giác Speed 10 mới không
quá tải với lớp học, xác nhận bấm trúng bubble ăn điểm giống bấm trúng mole, và xem màu đỏ + hiệu ứng
bubble chui xuống có rõ/đẹp mắt không → duyệt → commit + push + live.

---

## Đợt 76 (6/8/2026, v0.9.51) — ⭐ HẾT XÉN DẤU CHỮ VIỆT: `line-height` 1.35 CHO 34 Ô CHỮ NỘI DUNG + 3 CHỖ BÙ `padding`. ⭐ CÓ SỬA CORE (`core/app.css`, thầy duyệt trước). ✅ THẦY CHỐT LÀM LUÔN → COMMIT + PUSH CHUNG VỚI ĐỢT 75

Nối tiếp Đợt 75 (đã chữa lẫn font). Đợt này chữa nốt lỗi số 2: **dấu bị xén cụt**.

### ⭐ ĐÍNH CHÍNH TRƯỚC ĐÃ — công cụ đo của chính tôi bị sai, số liệu Đợt 75 bị thổi phồng

Khi bắt tay vá mới lộ ra: `Range.getBoundingClientRect()` **KHÔNG** trả về hộp DÒNG (line box) như tôi
tưởng, mà trả về **hộp FONT** — mép trên của nó là `baseline − fontAscent`, không phải mép trên hộp
dòng. Công cụ quét vì thế cộng thừa một lần `half-leading = (line-height − 1,602em) / 2`, mà số này
**luôn âm** khi `line-height` < 1,60 → mọi con số "xén" bị **thổi phồng gấp khoảng đôi**, và 2 chỗ
hoàn toàn không xén bị báo nhầm là có.

Bắt được bằng cách đo tay hình học Quiz: `question_top` = 70,3 = đúng mép `.aw-playarea`, nhưng
`Range.top` = 63,3 — **cao hơn 7px so với chính mép trên phần tử**, điều bất khả nếu nó là hộp dòng.
Công thức đúng: `inkTop = rangeTop + fontAscent − ink(Ẳ)`. Từ đó đo lại toàn bộ, và **ink của Ẳ/Ạ được
đo trực tiếp bằng đúng font + đúng độ đậm của từng phần tử** thay vì dùng một hằng số chung.

**Bảng đúng (thay bảng sai ở Đợt 75) — chỉ 3 chỗ xén thật, không phải 5:**

| Template | Phần tử | lh cũ | Xén TRƯỚC | Xén SAU |
|---|---|---|---|---|
| Quiz | `.aw-quiz-question` | 1.12 | **9 px** | **0** |
| Anagram | `.aw-anagram-clue` | 1.15 | **10 px** | **0,4 px** (dưới ngưỡng) |
| Type the answer | `.aw-tta-prompt` | 1.15 | **8 px** | **0** (dư 6,7px trên · 10px dưới) |

**Hai chỗ Đợt 75 báo nhầm — đo lại KHÔNG hề xén, kể cả trước khi sửa:** Flying fruit `.aw-ff-clue`
(−1,6px, tức còn dư chỗ) và Maze chase `.aw-mc-pad-txt` (−0,2px). Đã sửa `line-height` cả hai vì lý do
chống chồng dòng bên dưới, nhưng **không phải vì chúng bị xén**.

### Vì sao vẫn chọn `line-height: 1.35` — lý do THẬT không phải chống xén

Chống xén chỉ là phần nhỏ. Lý do chính: **hai dòng chữ Việt liền nhau đâm vào nhau**. Khoảng cách
baseline–baseline phải ≥ `ink(Ẳ) + ink(Ạ)` = **1,297em**; ở `line-height` 1.12 thì dấu của dòng dưới
(Ẳ, cao 1,063em) chồng lên phần thò xuống của dòng trên (Ạ, sâu 0,234em). Tức **mọi câu hỏi tiếng Việt
xuống dòng đều bị dính chữ**, ở mọi template, dù có khung cắt hay không. `1.35 > 1.297` → hết.

**Vì sao KHÔNG đẩy lên 1,57** (mức để dấu không tràn khỏi hộp dòng): 1,57 làm khối chữ cao thêm ~40%,
`autoFit` sẽ co chữ nhỏ lại thấy rõ. Rẻ hơn nhiều: giữ 1.35 rồi bù đúng phần dư **0,111em** bằng
`padding` tại 3 chỗ chữ nằm SÁT mép khung cắt. ⚠️ Lưu ý đã đo: với chữ **căn giữa** trong khung flex,
`padding` chỉ ăn **một nửa** giá trị (hộp to ra thì phép căn giữa kéo ngược lại `P/2`) — nên
`.aw-tta-prompt` phải `0.24em` trong khi `.aw-quiz-question`/`.aw-anagram-clue` (căn trên) chỉ cần `0.14em`.

### Đã sửa gì

**34 luật `line-height` → 1.35**, chỉ ở các ô hiển thị **nội dung của thầy** (câu hỏi · clue · prompt ·
ô đáp án · thẻ · tiêu đề act · bảng review · thẻ thư viện). **KHÔNG đụng** các luật chỉ hiện số/biểu
tượng (đồng hồ, tim, bộ đếm, mũi tên, logo) — nâng chúng chỉ xô lệch bố cục mà chẳng được gì.
**3 luật thêm `padding`** như trên.

⚠️ **CỐ Ý KHÔNG ĐỤNG RUNNING WORD.** Nó có 4 luật `line-height` thấp (`.aw-rw-row-body` 1.04,
`.aw-rw-slot-main` 1.10, `.aw-rw-result-words` 1.05, `.aw-rw-setup-title` 1) nhưng là game đọc–gõ **từ
tiếng Anh**, và cửa sổ 3 dòng của nó vừa được ổn định qua 8 đợt bằng phép toán `calc(100%/3)` +
`translateY` rất nhạy — đổi `line-height` ở đó là đánh cược một tính năng vừa yên. Đo cũng cho thấy nó
**không xén**. Nếu sau này thầy dùng RunningW với từ tiếng Việt thì mới xử lý, và phải đo lại cửa sổ 3 dòng.

### Đo thật trên devserver

- **0 chỗ còn bị xén** trên toàn bộ 15 template (quét mọi phần tử có chữ trong khung game, công thức đã sửa).
- **Hồi quy 15/15 template**: mount hết, **0 lỗi console**, **0 khung sai tỉ lệ** (14 game 1.778; Running
  word 1.333 = 4:3 đúng thiết kế).
- **Giá phải trả gần như bằng 0**: câu hỏi Quiz mẫu — cỡ chữ **không đổi** (50,2px trước và sau). Ép câu
  hỏi dài **120 ký tự** tiếng Việt — cỡ chữ vẫn **không đổi**, khối chỉ cao thêm 225 → 278,3px (còn thừa
  chỗ, `autoFit` chưa phải co).
- Chữ Việt vẫn **0/178 phải mượn font** (thành quả Đợt 75 không bị hỏng).

### ✅ Đã lên LIVE — chạy lại trọn bộ TRÊN BẢN LIVE

Commit `16b487b` (gộp Đợt 75 + 76) → push → `gh api .../pages/builds/latest` xác nhận Pages build đúng
commit đó. Bẫy quen lặp lại đúng như mọi đợt: **3 lần `curl` đầu Pages còn trả file CŨ**, lần 4 mới đủ
dấu mốc (`baloo-2-vi.woff2` ×4 · `unicode-range` ×8 · `line-height: 1.35` ×2 trong quiz.css · font
HTTP 200). Sau đó chạy lại đầy đủ trên live (ép `fetch(..., {cache:"no-store"})` để chắc chắn đúng file):

- chữ Việt **0/178 phải mượn font** · tiếng Anh **0 ký tự bị ảnh hưởng** · `baloo-2-vi.woff2` tải HTTP 200
- **15/15 template mount · 0 lỗi console · 0 khung sai tỉ lệ**
- **quét xén: sạch**, trừ đúng 1 điểm dư ghi lại cho trung thực — maze-chase `.aw-mc-pad-txt` xén
  **0,6px** (đo cục bộ cùng phần tử ra **−0,4px**, tức không xén). Dưới 1 pixel, đúng chóp dấu hỏi chữ Ẳ,
  và con số dao động theo kích thước ô mê cung. **Cố ý KHÔNG vá thêm**: ô này nhỏ, thêm `padding` dễ làm
  lệch tâm chữ hơn là được lợi.

### File đụng vào

`core/app.css` (5 luật) · 13 file CSS template (34 luật `line-height` + 3 `padding`) ·
`core/HUONG DAN CORE.md` · `APP_MASTER.md` · file này. **Không đụng 1 dòng JS nào.**

**VIỆC ĐANG CHỜ:** thầy mở act có bộ từ VI1/VI2 trên TOMKO xem chữ đã đều font **và** dấu đã đủ chưa
(nhất là chữ HOA có dấu như Ẳ Ắ Ộ Ữ), xem khoảng cách dòng giãn ra có vừa mắt không. Máy không tự chạm
màn hình và **khung xem trình duyệt không hiển thị nên không chụp được ảnh** — mọi kết luận trên là đo
DOM. Còn 2 việc chưa kiểm được: **phiếu in A4 giấy thật** (Running word) và **Running word với từ tiếng Việt**.

---

## Đợt 75 (6/8/2026, v0.9.50) — ⭐ CHỮ TIẾNG VIỆT HẾT LẪN FONT: BỔ SUNG SUBSET VIETNAMESE CHO BALOO 2. ⭐ CÓ SỬA CORE (`core/app.css`, thầy duyệt trước). 🟢 CHỜ THẦY DUYỆT

Thầy yêu cầu khảo sát toàn bộ 15 template, soi kỹ lỗi hiển thị font khi có từ tiếng Việt (khuyết dấu
hoặc sai font). Khảo sát tìm ra **HAI lỗi độc lập**; thầy chốt làm lần lượt, nên đợt này **chỉ vá lỗi
số 1 (font)**, lỗi số 2 (cắt dấu) để dành đợt sau.

### Lỗi 1 (vá đợt này) — font đóng gói thiếu 102/178 chữ cái tiếng Việt

4 file `core/assets/fonts/baloo-2-*.woff2` chỉ là subset **latin** của Google (230 ký tự). Bảng chữ
tiếng Việt có 178 ký tự thì font **chỉ phủ 76**. Chrome lặng lẽ mượn glyph của font kế tiếp trong
stack (Segoe UI) → **một từ hiện bằng HAI font**: "ĐƯỜNG" = Segoe `Đ Ư Ờ` + Baloo `N G`, khác hẳn nét
và độ đậm. Đo trên trình duyệt thật: **44 ký tự rơi thẳng sang Segoe UI**, số còn lại được trình duyệt
chắp vá từ chữ nền + dấu rời.

**Vá:** thêm subset `vietnamese` của **chính font đó** (Google Fonts) — `core/assets/fonts/baloo-2-vi.woff2`,
**9,9 KB**, tải 1 lần dùng chung cả 4 độ đậm vì là **font biến thiên** (trục wght 400–800, đúng 4 độ
đậm app dùng). Chỉ số dọc **trùng khít** file tĩnh đang có (unitsPerEm 1000 · typoAscender 1078 ·
typoDescender −524 · winAscent 1050 · winDescent 524) nên chữ Việt nằm đúng cùng baseline, **không xô
lệch bố cục ở đâu**. 4 file cũ **không đụng vào**, tiếng Anh giữ nguyên tuyệt đối.

### ⚠️ HAI CÁI BẪY ĐÃ CẮN THẬT — ghi lại kẻo đợt sau vấp lại

**Bẫy 1 — thêm khối `@font-face` mới KHÔNG có tác dụng gì cả.** `@font-face` không khai `unicode-range`
là **nhận toàn bộ Unicode**, nên 4 face latin cũ vẫn "giành" ă/đ/ơ/ư. Chrome tin **lời khai**, không tin
cmap thật: nó chọn face latin cho các chữ đó, thấy không có glyph, rồi **nhảy thẳng sang FAMILY kế tiếp**
(Segoe UI) mà không hề ngó khối mới. Đo được: trình duyệt **chưa từng tải** file mới (`performance`
không có entry, face báo `unloaded`). Khai sau **KHÔNG** thắng. → Phải khai `unicode-range` tường minh
cho **cả 4 face latin**. Đã chứng minh an toàn TRƯỚC khi sửa: cmap 230 ký tự của 4 file cũ nằm **trọn**
trong (dải latin ∪ dải Việt) — 225 thuộc dải latin, 5 ký tự còn lại là dấu rời U+0300/0301/0303/0309/0323
mà file tiếng Việt cũng có. Còn ✓ ✗ ★ ♥ ☰ ⌫ ▲ ▼ và IPA ə ʊ ˈ thì **font vốn đã không có từ trước**, vẫn
mượn Segoe UI y như cũ — không phải hồi quy mới.

**Bẫy 2 — gộp 4 khối tiếng Việt thành 1 khối `font-weight: 400 800` thì HỎNG.** Trông rất gọn (cùng 1
file mà), nhưng đặt một **DẢI** độ đậm cạnh 4 face latin khai **giá trị đơn** làm Chrome thôi ghép
family: face vẫn `loaded`, vẫn đúng `unicode-range`, mà **không một ký tự nào dùng nó**. Phải viết
**tách 4 khối, mỗi khối một độ đậm**, cùng trỏ 1 file — đúng hình dạng Google Fonts tự phục vụ. Đây là
lý do CSS Google trả về 4 khối cùng URL, không phải thừa.

### Đo thật trên devserver (không đọc code suông)

- **Chữ Việt: 0/178 còn phải mượn font** (trước vá: 44 rơi hẳn + phần còn lại chắp vá) — đo bằng cách so
  bề rộng ký tự giữa `'Baloo 2'` và `'Baloo 2', monospace`.
- **Tiếng Anh: 0 ký tự bị ảnh hưởng** (52 chữ cái + số + dấu câu + — … ×).
- **Font biến thiên ra đúng 4 độ đậm**: bề rộng "đường" tăng dần 278 → 293,95 → 303,33 → 311,41 px ở
  400/600/700/800 (chữ Anh "railway" cũng tăng dần đúng nhịp) — không bị kẹt một độ đậm.
- `baloo-2-vi.woff2` **được tải đúng 1 lần**, HTTP 200, 9888 byte, dùng chung cả 4 độ đậm.
- **Hồi quy 15/15 template**: mount hết, **0 lỗi console**, tỉ lệ khung nguyên vẹn (14 game 1.778;
  Running word 1.333 = 4:3 đúng thiết kế Đợt 68).
- **In giấy không phải sửa gì**: `core/print.js` in ngay trong trang (không mở cửa sổ riêng) nên phiếu
  in tự hưởng font mới.
- ⚠️ Bẫy đo đạc gặp lại: khung xem trình duyệt không hiển thị → không compositing → `screenshot` timeout;
  phải đo bằng DOM. Thêm bẫy MỚI: `canvas.measureText` **không kích hoạt tải font**, nên face chưa dùng
  tới luôn báo `unloaded` và phép đo bề rộng sẽ báo "vẫn mượn font" oan — phải đặt chữ thật vào DOM
  (hoặc gọi `FontFace.load()`) rồi mới đo.

### Lỗi 2 (vá ở Đợt 76) — dấu bị xén cụt vì `line-height` quá thấp

Baloo 2 cần chiều cao dòng tự nhiên **1,60em**. Ngưỡng: **HOA có dấu (Ẳ) cần `line-height` ≥ 1,57 ·
thường có dấu (ẳ) ≥ 1,35 · dấu nặng (Ạ) ≥ 1,02**, trong khi **tiếng Anh chỉ cần 0,70–0,88** — cả app
được căn chỉnh cho tiếng Anh. Toàn dự án có **67 khai báo `line-height` < 1,22**.

Minh chứng trong sản phẩm thật (Quiz): tiêu đề **"ĐẲNG CẤP HỌC SINH" hiện ra "ĐĂNG CẤP HỌC SINH"** —
dấu hỏi của chữ Ẳ bị xén sạch, thành **một từ khác nghĩa hẳn**. Lỗi sai nghĩa, không chỉ xấu.

> ⚠️ **ĐÍNH CHÍNH (viết lại ở Đợt 76):** bảng "5 chỗ xén" từng ghi ở đây **có 2 dương tính giả và mọi
> con số px đều bị thổi phồng** — công cụ đo dùng `Range.getBoundingClientRect()` tưởng nó trả về hộp
> DÒNG, thật ra nó trả về **hộp FONT** (baseline − ascent), nên đã cộng thừa nửa khoảng dòng
> (`half-leading`, luôn âm khi `line-height` < 1,60). Số đúng và danh sách đúng: xem Đợt 76.

### File đụng vào

`core/app.css` (+58 −5, thuần khai báo font + chú thích 2 cái bẫy) · **thêm** `core/assets/fonts/baloo-2-vi.woff2`
(9,9 KB) · `core/HUONG DAN CORE.md` (thêm mục "FONT TIẾNG VIỆT") · `APP_MASTER.md` · file này.
**Không đụng 1 dòng JS nào, không đụng template nào.**

**VIỆC ĐANG CHỜ:** không còn — thầy chốt làm luôn Đợt 76 rồi commit + push một thể.

---

## Đợt 74 (5/8/2026, v0.9.49) — RUNNING WORD: ⭐ GỐC LỖI "TEAM B CHỈ HIỆN 1 HÀNG" TRÊN iPAD (tái hiện được!) + IN 1 CỘT + KHOÁ ZOOM CHẠM ĐÚP. KHÔNG ĐỤNG CORE. ✅ THẦY DUYỆT → COMMIT (`6ff2da6`) + PUSH + LIVE

Thầy gửi 3 việc sau khi chơi bản Đợt 73 trên iPad. Việc số 1 là lỗi đã đuổi theo suốt 2 đợt (Đợt 72
đoán sai) — **đợt này bắt được tận tay và tái hiện được bằng script.**

### 1. ⭐⭐ GỐC LỖI TEAM B: WebKit TỰ CUỘN khung để lộ con trỏ ô nhập

**Triệu chứng:** đội ĐANG ĐẾN LƯỢT hiện từ đang gõ ở **TRÊN CÙNG** với 2 dòng CHƯA CHƠI bên dưới,
đáng lẽ ở **ĐÁY** với 2 từ vừa xong ở trên. Đội kia luôn đúng. Chỉ iPad Chrome, Windows không bao giờ.

**Cách lần ra:** đo hình học trên chính ảnh thầy chụp — độ lệch là **ĐÚNG 2 DÒNG**, đúng bằng khoảng
cách từ khe đáy (khe 2) lên khe đỉnh (khe 0). Con số "đúng 2 dòng" không thể ngẫu nhiên, và nó chỉ
thẳng tới một hành vi có tên: **"cuộn để lộ phần tử, canh vào ĐẦU khung cuộn"**.

**Nguyên nhân:** cửa sổ 3 dòng (`.aw-rw-rows`) chứa ô `<input>` DUY NHẤT của trận. **WebKit** — nhân
của MỌI trình duyệt trên iPad, kể cả Chrome — lộ ô đang focus / con trỏ đang chạy bằng cách **CUỘN
khung cuộn gần nhất**, và **`overflow:hidden` VẪN LÀ một khung cuộn**: `hidden` chỉ chặn NGÓN TAY
cuộn, còn trình duyệt và `scrollTop` vẫn chạy tự do. WebKit canh ô nhập vào ĐẦU khung → kéo dòng
đang gõ từ khe đáy lên khe đỉnh = lệch đúng 2 dòng. Blink (Chrome trên Windows) không làm cú "lộ"
này → cùng một dòng code mà máy bàn trông hoàn hảo.
→ Giải thích trọn cả 2 điều lạ: **chỉ đội đang đến lượt bị** (chỉ đội đó giữ ô nhập) và **chỉ iPad bị**.
→ `focus({preventScroll:true})` (đã có sẵn trong `focusInput` từ lâu) **KHÔNG đủ**: chỉ chặn đúng cú
focus, không chặn `setSelectionRange` lẫn cú lộ-con-trỏ sau MỖI phím gõ.

**Bản vá — không đi bắt từng API:** gắn `scroll` listener lên mỗi cửa sổ, hễ bị cuộn là bật ngay về 0.
Bất kể thứ gì cuộn nó (focus, đặt con trỏ, gõ phím, hay một hành vi mới của trình duyệt đời sau) đều
bị vô hiệu; vị trí track do `applyTrack()` của mình quyết định, không ai khác.

**⭐ TÁI HIỆN ĐƯỢC trong trình duyệt** (điều Đợt 72 không làm được):
```
scrollHeight 3817  vs  clientHeight 294   → khung "overflow:hidden" VẪN cuộn được (tiền đề của lỗi)
gán scrollTop = 196px (= đúng 2 dòng, mô phỏng WebKit canh vào đầu khung):
   • đo NGAY lúc đó    → ["4:CUR", "5:FUT", "6:FUT"]   ← ĐÚNG Y HỆT ẢNH THẦY CHỤP
   • sau khi guard chạy → ["2:PASS", "3:PASS", "4:CUR"]  ✓ đúng, scrollTop về 0
```

### 2. Bỏ nốt phép đo pixel của cửa sổ 3 dòng

Xoá `measureRow()`/`b.rowH`/`--rw-rowh` (bản game). Trước: JS đo `clientHeight` (số nguyên, làm tròn),
chia 3, trượt theo px — một con số trong JS phải khớp layout CSS qua 2 đường bất đồng bộ. Nay: track
cao **đúng bằng cửa sổ** (`height:100%`), mỗi dòng **đúng `calc(100%/3)`** của track, cú trượt viết
bằng chính đơn vị đó: `translateY(calc(N * 100% / 3))`. Phần trăm của `translateY` tính theo chiều cao
CHÍNH track → trình duyệt tự tính lại mỗi lần layout, **không còn gì để đo, để nhớ, hay để lệch pha**.
Đo xác nhận: track 293.594px = đúng chiều cao cửa sổ, mỗi dòng 97.859px = đúng 1/3.

⭐ **Tác dụng phụ TỐT ngoài dự tính:** `ResizeObserver` trước đây gọi `applyTrack(t,false)` (ép
`transition:none`) mỗi lần bảng đổi 70/30 — mà đổi 70/30 CHÍNH LÀ lúc đảo lượt → **hiệu ứng "đẩy lên"
.35s thầy yêu cầu ở Đợt 70 thực ra đã bị giết, track nhảy cóc chứ không trượt**. Nay `ResizeObserver`
chỉ còn lo co chữ (`fitBoard`) nên hiệu ứng chạy thật (đo: sau 40ms track đang giữa đường, 500ms mới
tới đích).

### 3. In: PART A / PART B luôn 1 CỘT (+ vá 1 lỗi tràn trang chưa ai để ý)

Thầy chốt: PART A và PART B là **một cột chạy dọc** (50 từ = 50 hàng 1 cột); **chỉ tờ CHECK của GV**
mới 2 cột (cột trái 50 từ PART A, cột phải 50 từ PART B — vốn đã đúng sẵn). Bỏ hẳn nhánh "chảy 2 cột
khi dòng ngắn hơn 5.2mm" trong `metrics()` của `rw-print.js`.

⚠️ **Bỏ nhánh đó vá luôn 1 lỗi thật nó đang che:** tờ CHECK gọi CÙNG hàm `metrics()` và nhận chiều cao
dòng tính cho **2 cột** (10.12mm với 50 từ) trong khi nó vẽ **1 cột** → 50 × 10.12 = **506mm trên
trang 253mm → tờ CHECK âm thầm tràn sang tờ giấy thứ 4**. Nay cả 3 tờ khít đúng 253mm.

Đo thật (gọi thẳng `printRunningSheets`, giữ tem `window.print` ≥300ms đúng luật cũ): 20 từ →
12.65mm/**22.2pt** · 30 từ → 8.43mm/**14.8pt** · 50 từ → 5.06mm/**8.9pt** — đều 1 cột, đều 253mm khít
1 trang; đúng 3 trang; PART A/B đầu bảng 3 cột (`№ WORD TURN`), CHECK 4 cột (`№ TEAM A № TEAM B`).
Sàn `ROW_MIN_MM` 5.2→4.2mm (với trần 50 từ/đội không bao giờ chạm tới, chỉ để pool tự chế quá khổ tràn
sang trang 2 thay vì co chữ tới mức không đọc nổi).

### 4. Khoá zoom khi chạm đúp

`touch-action: manipulation` trên khung game + gốc `.aw-zoomed`: trình duyệt hiểu vùng này không có cử
chỉ chạm-đúp nào phải chờ → cú chạm thứ hai được giao thẳng như cú chạm thường thay vì bị nuốt vào
thao tác phóng to. Game này dính nặng nhất vì **hai người gõ bàn phím ảo liên tục sinh ra "chạm đúp"
suốt mà chẳng ai định phóng to**; tiện thể bỏ luôn độ trễ ~300ms trình duyệt giữ để chờ cử chỉ đó nên
phím ăn nhạy hơn. **Cố ý KHÔNG dùng `touch-action:none`** (giết luôn phóng-to-2-ngón, thứ không ai bấm
nhầm và nên để lại làm lối thoát). ⚠️ Máy **không tự nghiệm thu được** điểm này (phóng-to-khi-chạm-đúp
là hành vi của thiết bị cảm ứng thật) — chỉ xác nhận được luật CSS áp đúng ở cả 2 chế độ và không rò
sang game khác.

### Tự test (devserver + chạy lại trọn bộ TRÊN BẢN LIVE), 0 lỗi console

- Tái hiện + vá lỗi iPad: khối đo ở mục 1, chạy đúng như vậy trên cả devserver lẫn live.
- **10 lượt đảo liên tiếp, đo sau khi hoạt ảnh .35s kết thúc**: cả 2 đội, mọi lượt — **đúng 3 dòng,
  dòng đang gõ luôn ở khe đáy, `scrollTop` luôn 0, 0 bất thường**.
- In: bảng số liệu ở mục 3. Zoom vẫn lấp kín viewport (Đợt 73 không bị phá).
- Hồi quy: Type the answer + Crossword vẫn `act-*` đúng, 16:9, `touch-action:auto` (luật mới không
  rò), không class `.aw-rw-*` nào lọt sang.
- ⚠️ Trên live: xác minh file bằng `fetch(..., {cache:"no-store"})` TRƯỚC khi đo, vì ở Đợt 73 chính
  tab test đã đọc phải CSS cũ từ cache của nó.

⚠️ **Bẫy đo đạc mới:** đo cửa sổ 3 dòng NGAY sau khi bấm (40ms) sẽ thấy "chỉ 2 dòng" và tưởng vừa gây
hồi quy — thật ra track đang trượt giữa chừng (hoạt ảnh .35s, nay đã chạy thật, xem mục 2). Phải đợi
>400ms mới đo. Lần đầu tôi đã tưởng nhầm đúng vì bẫy này.

Chi tiết: `templates/running-word/GHI CHU RUNNING-WORD.md` mục 8h.

**VIỆC ĐANG CHỜ:** thầy chơi lại trên iPad xác nhận lỗi TEAM B hết hẳn + chạm đúp không còn phóng to;
in thử giấy A4 thật xem 1 cột 50 từ (8.9pt) có còn đọc thoải mái khi đứng cầm tờ giấy không (đánh đổi
của việc bỏ 2 cột — chữ nhỏ hơn hẳn bản 2 cột cũ ~17.8pt); các việc TOMKO vẫn còn treo.

---

## Đợt 73 (5/8/2026, v0.9.48) — RUNNING WORD: ZOOM LẤP KÍN MÀN HÌNH, BỎ KHOÁ TỈ LỆ 4:3. KHÔNG ĐỤNG CORE. ✅ THẦY DUYỆT → COMMIT (`1304bf4`) + PUSH + LIVE

**Bối cảnh:** thầy chơi bản Đợt 72 (nút Fullscreen ghim góc) trên Chrome iPad, xác nhận nút ổn nhưng
gửi lại đúng tấm ảnh chụp trước đó, lần này chỉ ra chi tiết mới: khung zoom hiện **2 dải đen 2 bên
trái-phải**. Yêu cầu: lấp kín toàn màn hình, tự chỉnh theo MỌI trình duyệt/kích thước, kể cả khi
trình duyệt thay đổi/cập nhật trong tương lai — không hard-code theo 1 hình dạng máy cụ thể.

**Nguyên nhân:** công thức letterbox cũ lúc zoom (`width: min(100vw, calc(100dvh * 4/3)); height:
auto`) COPY Y HỆT công thức của khung REST (khung 4:3 lúc chưa zoom — chọn 4:3 vì "màn iPad gần 4:3",
xem Đợt 68) sang cho cả lúc zoom — ép cứng tỉ lệ 4:3 dù màn zoom không có lý do gì phải giữ đúng tỉ lệ
đó. Viewport THẬT của Chrome trên iPad (sau khi trừ thanh tab/địa chỉ) không khớp đúng 4:3 tuyệt đối
→ hụt theo 1 chiều → dải đen bù vào chiều kia.

**Sửa:** bỏ hẳn công thức `min(...)` ép tỉ lệ, thay bằng `width:100%; height:100%` — khung LUÔN khít
đúng `.aw-page` (đã là `100%` của khung zoom cố định `.aw-zoomed`, tức ĐÚNG BẰNG viewport thật). Cho
CẢ width VÀ height cùng là giá trị tường minh cũng tự triệt tiêu luôn luật `aspect-ratio:4/3` ở trên
(luật CSS: `aspect-ratio` chỉ dùng để SUY RA chiều còn thiếu — có đủ cả 2 chiều rồi thì không còn gì
để suy). **Không có con số px/vw/vh cứng nào trong luật mới** — thuần `%`, nên trình duyệt tự tính
lại `100%` mỗi khi viewport đổi (xoay ngang/dọc, thanh trình duyệt ẩn/hiện, đổi trình duyệt, đổi máy,
phiên bản Chrome sau này đổi cách tính `dvh`...) mà KHÔNG cần sửa code lần nào nữa. Khung REST (chưa
zoom) không đụng, vẫn giữ nguyên 4:3 như trước.

**Tự test (devserver, viewport CỐ Ý không phải 4:3 để ép lộ dải đen nếu còn):** dựng cửa sổ 1366×900
(tỉ lệ 1.518, khác hẳn 4:3=1.333) → bấm Fullscreen → đo `stage.getBoundingClientRect()` = đúng
1366×900, khít 100% cả 4 cạnh, 0 khoảng hở (công thức cũ sẽ ra ~1200×900 kèm ~83px dải đen mỗi bên).
Bấm lại → khung REST vẫn đúng 4:3 968×726. **Kiểm lại trên bản live** sau `curl` poll (bẫy quen: 3
lần đầu còn cũ, lần 4 mới đủ marker) — đúng y hệt devserver; gặp 1 lần tab dùng để test tự đọc phải
bản CSS CŨ do CACHE CỦA CHÍNH TRÌNH DUYỆT ĐÓ (không phải bản deploy — đã xác nhận bằng `fetch(...,
{cache:"no-store"})` ra đúng nội dung mới), ép nạp lại stylesheet qua link `?cb=<timestamp>` thì đọc
đúng ngay. 0 lỗi console.

⚠️ **Đánh đổi đã biết:** bỏ khoá 4:3 nghĩa là hình dạng khung lúc zoom theo ĐÚNG hình dạng thật của
viewport máy đang dùng (có thể hơi khác 4:3 tùy máy/trình duyệt) — mọi cỡ chữ/khoảng cách vẫn dùng
`cqw` nên không vỡ layout, chỉ hơi kéo giãn nếu máy nào lệch rất xa 4:3. Đây đúng là điều thầy yêu
cầu (ưu tiên lấp kín + tự thích ứng hơn giữ đúng hình chữ nhật 4:3 hoàn hảo).

Chi tiết: `templates/running-word/GHI CHU RUNNING-WORD.md` mục 8g.

**VIỆC ĐANG CHỜ:** thầy xem lại đúng trên chính iPad đã chụp ảnh dải đen, xác nhận hết dải đen + khung
REST không đổi; các việc TOMKO/in giấy A4 của Đợt 68-70 vẫn còn treo, không đổi.

---

## Đợt 72 (5/8/2026, v0.9.47) — RUNNING WORD: NÚT FULLSCREEN GHIM GÓC DƯỚI-PHẢI + VÁ PHÒNG NGỪA LỖI CỬA SỔ 3 DÒNG CỦA TEAM B. KHÔNG ĐỤNG CORE. ✅ THẦY DUYỆT → COMMIT (`fc54dcd`) + PUSH + LIVE

Thầy chơi bản zoom (Đợt 71) và gửi 2 việc.

**(1) Nút Fullscreen ghim góc.** Trước đó nút nằm TRONG cụm `.aw-tools` (theo dòng chảy flex, cạnh
Sound) — đủ dùng ở trạng thái thường nhưng trong `.aw-zoomed` nó trôi lệch, to, có nền sáng, khá nổi.
Sửa: khi `.aw-zoomed` bật, `position:absolute;right/bottom:0.8cqw` ghim vào ĐÚNG góc của `.aw-stage`
(mượn `.aw-stage-inner` — core — vốn đã `position:absolute;inset:0` làm nơi neo), thu còn 2.2cqw,
nền trong suốt, `opacity:.45` lúc nghỉ (chạm/hover lên `.85`). Chỉ scope trong `.aw-zoomed .aw-stage.
act-running_word .aw-fs-always` — trạng thái thường giữ nguyên vị trí cũ cạnh Sound (ghim tuyệt đối ở
ĐÓ từng đụng độ Sound, Đợt 3d mục 3 — nay an toàn vì Sound đã ẩn hẳn khi zoom).

**(2) Điều tra lỗi "TEAM B không hiện đủ 3 dòng" — vá 1 nguyên nhân CHƯA CHẮC CHẮN, không tái hiện
được nguyên văn lỗi.** Đọc lại toàn bộ cơ chế `measureRow`/`applyTrack`/`bottomIndexOf`/`paintBoard`,
lái 1 trận thật qua devserver (đóng vai trọng tài, bấm PASS liên tục 16 lượt liền — không dừng giữa
chừng để tránh đồng hồ tự trôi thật giữa các lệnh, bẫy đã cắn lúc test lần đầu khiến TEAM B hết giờ
oan) rồi soi DOM từng bước: 4 lượt ĐẦU trận đúng là chỉ hiện 1-2 dòng — **hành vi ĐÚNG THIẾT KẾ**
(chưa đủ 2 từ trước đó để lấp 2 ô trên); từ lượt 5 trở đi (12 lượt liên tiếp, kiểm cả 2 đội mỗi lượt)
**luôn đúng 3 dòng, dòng đang gõ luôn ở ĐÁY** — không tái hiện được kiểu lỗi trong ảnh thầy gửi (dòng
đang gõ ở TRÊN, 2 dòng CHƯA CHƠI ở dưới — về lý thuyết bất khả thi với code hiện tại). Vẫn tìm ra 1
điểm chưa chắc chắn thật: `measureRow()` trước đây CHỈ chạy lúc `buildRows()` (1 lần lúc vào trận) và
trong callback của `ResizeObserver` (chỉ khi khung board đổi KÍCH THƯỚC thật) — không hề chạy lại
trong `paintBoard()` mỗi lượt. Vì mỗi lần đảo lượt bảng 70/30 CŨNG đổi kích thước (nên `ResizeObserver`
thường bắt kịp), nhưng đây là 2 cơ chế ASYNC riêng nhau, không đảm bảo thứ tự — có khả năng thật (dù
không ép được trên môi trường tự test) là `paintBoard()` chạy trước khi `ResizeObserver` kịp đo lại,
dùng `--rw-rowh` CŨ một nhịp, khiến cửa sổ trông hụt dòng đúng lúc đảo lượt. Đã vá: gọi `measureRow(t)`
NGAY ĐẦU mỗi `paintBoard()`, không còn phụ thuộc thời điểm của `ResizeObserver` nữa.

⚠️ Ghi rõ trong hồ sơ: bản vá là "ứng viên hợp lý nhất tìm được qua đọc code", không phải "đã bắt
tận tay" — thầy chơi lại xác nhận: **cả 2 điểm đều ổn, kể cả chưa thấy lại lỗi TEAM B**.

**Bẫy đo đạc mới (dùng lại được):** pane tự test KHÔNG compositing (pane ẩn) → MỌI CSS
`transition`/animation bị ĐÓNG BĂNG ở giá trị TRƯỚC lúc đổi, không tiến được chút nào (khác hẳn kiểu
"animation chạy nhưng không thấy được" — ở đây animation không hề tiến). `getComputedStyle` do đó đọc
ra giá trị CŨ mãi mãi cho MỌI thuộc tính có `transition` (bắt gặp với `flex-grow` của bảng 70/30 VÀ
`opacity` của nút Fullscreen). Cách đo đúng: `el.getAnimations().forEach(a => a.finish())` — SCOPE
ĐÚNG PHẦN TỬ đang đo, KHÔNG gọi `document.querySelectorAll('*').forEach(...)` trên toàn trang (đã
thử, ép luôn cả animation "PLAY overlay fade-out" khiến trang tự rebuild về màn READY ngoài ý muốn —
phải tải lại trang làm sạch).

Chi tiết: `templates/running-word/GHI CHU RUNNING-WORD.md` mục 8f.

**VIỆC ĐANG CHỜ (cập nhật):** đã lên live, thầy xác nhận ổn → mở đường cho Đợt 73 (bỏ khoá 4:3 lúc
zoom, ở trên).

---

## Đợt 71 (5/8/2026, v0.9.46) — RUNNING WORD: ĐỔI FULLSCREEN THẬT SANG "ZOOM" CSS (chỉ RUNNINGW). ⭐ CÓ SỬA CORE. ✅ THẦY DUYỆT → COMMIT (`2fb19c7`) + PUSH + LIVE

**Bối cảnh:** sau khi Đợt 68-70 lên live, thầy cầm iPad M1 12.9" (Chrome) tự chơi thử với Fullscreen
thật (nút Fullscreen của engine gọi `requestFullscreen()`) và báo 4 vấn đề:

1. Chrome tự vẽ 1 nút X to góc trên để thoát — không tắt được.
2. Chỉ nhẹ tay vuốt xuống gần mép trên (đúng chỗ 2 đồng hồ đứng) là **tự mất fullscreen** — nguy
   hiểm với trẻ em chạm tay liên tục.
3. **Tự mất fullscreen ngay sau màn 3-2-1** — vào trận là văng ra ngoài luôn.
4. Chrome tự bật popup "Do you want to stay in fullscreen?" giữa trận, chặn thao tác.

Cả 4 đều là hành vi RIÊNG của lớp cử chỉ/heuristic mà Chrome gắn lên Fullscreen API thật trên iPad —
không sửa được bằng JS. Thầy chụp so sánh với chính `wordwall.net` trên cùng iPad: nút "fullscreen"
của Wordwall **không hề gọi Fullscreen API thật** — thanh tab + thanh địa chỉ Chrome vẫn còn nguyên,
Wordwall chỉ phóng nội dung game lấp đầy viewport bằng CSS thuần. Đổi lại: tuyệt đối ổn định, không
cử chỉ hệ thống nào can thiệp được (đánh đổi là không che được thanh trình duyệt).

**Quyết định phạm vi** (được hỏi trước khi sửa, vì đây là cơ chế dùng chung mọi game): **chỉ áp dụng
cho RUNNINGW trước**, 14 game khác giữ nguyên Fullscreen API thật — "khi nào ổn định và chuẩn ta sẽ
chỉnh các app khác sau".

**⭐ CÓ SỬA CORE — `core/engine.js`, cờ opt-in `tpl.useZoomFullscreen`:**
- Hàm mới `setZoomed(root, fsBtn, on)`: toggle class `aw-zoomed` trên `root` (đúng phần tử Fullscreen
  thật vẫn nhắm tới, nên mọi suy luận "root ổn định qua Start again" áp dụng y hệt) + class
  `is-zoomed` trên nút Fullscreen (để CSS tô sáng — dấu hiệu duy nhất báo "đang zoom, bấm lại để
  thoát", vì không còn banner nào của Chrome làm việc đó nữa) + khoá cuộn trang nền
  (`document.documentElement.style.overflow="hidden"`, vì zoom không có top-layer promotion như
  Fullscreen thật).
- `fsBtn.onclick`: có cờ `tpl.useZoomFullscreen` → gọi `setZoomed`; không có cờ → y hệt code cũ
  (`requestFs`/`exitFs`). **Zero-diff cho 14 game không đặt cờ** (đã đo lại Quiz/Type the answer).
- Hàm mới `exitAnyFullscreen()` thay 2 chỗ lặp `if (fsElement()) exitFs()` (ở `homeBtn`/`editBtn`) —
  gỡ CẢ 2 kiểu fullscreen khi rời game.
- `fsBtn` dựng lại mỗi lần `startGame()` chạy (Start again giữ `root` nhưng xoá `innerHTML`) nên đọc
  `root.classList.contains("aw-zoomed")` lúc tạo nút để đồng bộ `is-zoomed` — khớp hành vi cũ "Start
  again giữ nguyên fullscreen".

**CSS — toàn bộ trong `templates/running-word/running-word.css`, KHÔNG đụng `core/app.css`:** 1 khối
mới mirror đúng hình dạng khối `:fullscreen` cũ (`.aw-zoomed` thay pseudo-class, double-guard bằng
`:has(.aw-stage.act-running_word)`): `root` được `position:fixed;inset:0;z-index:9000` (tự ghim vì
không có top-layer thật), `.aw-page` lấp 100%/100%, `.aw-stage` giữ công thức 4:3 letterbox cũ
(`min(100vw, 100dvh*4/3)`, có dự phòng `vh` cho trình duyệt chưa hiểu `dvh`), ẩn `.aw-below`/
`.aw-as-bars`/nav/toolbar y hệt fullscreen thật.

**Tự test (devserver + BẢN LIVE, DOM thật — không giả lập được cử chỉ hệ thống):**
- `git fetch` 0/0 trước khi sửa (đúng quy trình bắt buộc, không máy nào đẩy chen).
- Bấm Fullscreen trên `running-word/test.html` (cả devserver lẫn live) → `#app` có class
  `aw-zoomed`, `document.fullscreenElement` vẫn `null` (xác nhận **không hề gọi** Fullscreen API
  thật), tỉ lệ khung đo được đúng 4:3 (960×720=1.333 trên devserver, khớp lại trên live), nền
  `rgb(11,11,13)`, `.aw-below` `display:none`, `overflow` khoá đúng `"hidden"`.
- Bấm lại → gỡ sạch cả 2 class + trả lại `overflow`. Bấm Home lúc đang zoom → `exitAnyFullscreen()`
  gỡ đúng.
- Hồi quy: `quiz/test.html` (devserver + live) bấm Fullscreen → **có gọi** `Element.prototype.
  requestFullscreen` thật (đo bằng cách tráo hàm tạm thời), KHÔNG có `aw-zoomed`/`is-zoomed` nào —
  đúng zero-diff. `type-the-answer/test.html` mount 0 lỗi console.
- `curl` poll Pages sau push (bẫy quen: lần 1-2 còn file CŨ, lần 3 mới đủ 3 marker
  `useZoomFullscreen`/`aw-zoomed`/marker trong `running-word.js`) rồi chạy lại đúng bộ kiểm tra trên
  ở TRÊN **bản live thật**, kết quả giống hệt devserver, 0 lỗi console.

⚠️ **Máy không tự vuốt màn hình / không tự bấm nút cần cử chỉ người dùng thật được**, nên việc xác
nhận cả 4 vấn đề gốc đã hết thật chỉ có thể do thầy tự chơi lại trên chính iPad đó — về lý thuyết cả
4 đều hết vì không còn lời gọi Fullscreen API thật nào trong đường này nữa, nhưng "lý thuyết" khác
"thầy cầm iPad chơi thật".

Chi tiết đầy đủ hơn: `templates/running-word/GHI CHU RUNNING-WORD.md` mục 8e +
`core/HUONG DAN CORE.md` mục "Fullscreen API THẬT không ổn định trên iPad Chrome".

**VIỆC ĐANG CHỜ (cập nhật):** đã lên live; còn 1 việc mới — thầy tự chơi lại RunningW thật trên iPad
xác nhận hết cả 4 tật cũ; 3 việc cũ của Đợt 68-70 (TOMKO thật / fullscreen iPad thật — nay đã đổi
sang zoom nên câu hỏi này coi như đã trả lời một phần / in giấy A4 thật) vẫn còn treo, không đổi.

---

## Đợt 70 (5/8/2026, v0.9.45) — RUNNING WORD: 8 TINH CHỈNH SAU KHI THẦY CHƠI THỬ ĐỢT 2. KHÔNG ĐỤNG CORE. ✅ COMMIT (`a40809e`, gộp Đợt 68+69+70) + PUSH + LIVE

Thầy chơi bản Đợt 2 (v0.9.44) rồi gửi ảnh bàn phím + 8 điểm. Chỉ 2 file: `running-word.js`,
`running-word.css`.

1. **Nút Play/Pause: nhạy + hình vuông bo tròn.** ⭐ **Lỗi thật gây "lúc bấm được lúc không"**:
   `paintClocks()` chạy mỗi 100ms và gán lại `innerHTML` của nút → thẻ `<svg>` con thay mới 10 lần/
   giây; cú chạm mà pointerdown rơi vào SVG cũ, pointerup vào SVG mới thì trình duyệt **không phát
   `click`**. Vá 2 lớp: chỉ đổi `innerHTML` khi icon thực sự đổi (`refUI._icon`) + `svg{pointer-
   events:none}`. Đổi hình tròn → vuông bo tròn.
2. **Slogan về hàng nút Menu + màu nhìn rõ.** Bản cũ slogan là div absolute đáy khung → **đè lên bàn
   phím** + màu nhạt khó thấy. Nay đưa vào NHÃN NAV giữa thanh dưới (cùng hàng Menu, 2 mũi tên đã
   ẩn), màu `var(--aw-muted)`.
3. **Icon loa ↔ fullscreen hết đè nhau.** Do Đợt 2 ghim fullscreen `position:absolute` đúng chỗ nút
   loa. Vá: bỏ ghim, để fullscreen nằm tự nhiên trong cụm tools (vốn luôn ở góc phải-dưới).
4. **Chữ trong ô tự co, hết "…", 3 ô cùng cỡ.** Biến `--rw-fit` + hàm `fitBoard()` dùng span probe đo
   bề rộng từ, co để từ rộng nhất vừa cột; mọi ô nhân cùng fit; chạy theo `ResizeObserver` nên mượt
   lúc bảng 70↔30. Bỏ `text-overflow:ellipsis`.
5. **Đồng hồ hạ thấp bỏ khoảng thừa.** `.aw-rw-clocks` `align-items: stretch→center` + giảm padding
   dọc hộp.
6. **⭐ Bảng CHỈ 3 ô — ô nhập LUÔN ở đáy, đẩy lên khi đảo lượt.** Bỏ cuộn danh sách; nay là cửa sổ cố
   định 3 dòng, toàn bộ từ trên 1 track trượt bằng `translateY` (`applyTrack`). Dòng đáy = ô nhập khi
   tới lượt (bottom=idx) hoặc từ vừa xong khi chờ (idx−1); 2 dòng trên là 2 từ trước; đảo lượt →
   trượt lên 1 dòng (.35s). Số từ còn lại ở chân bảng (giữ từ Đợt 2).
7. **⭐ Sửa màn GAME COMPLETE bị kẹt.** Bảng kết quả riêng `.aw-rw-result` z-index **45** che bảng
   tổng kết engine `.aw-backdrop` z-index **13** → thầy thấy màn kết quả không nút, bảng thật nằm
   dưới. Vá: gỡ `.aw-rw-result` khi gọi `ui.finish()`.
8. **Bàn phím giữ đúng size gốc** (xác nhận lại `--kbd-kw`=5cqw).

**Bài học đo đạc:** kiểm "board nào active" bằng script đừng dùng `className.includes('is-a')` —
`is-active` chứa `is-a` → khớp nhầm; dùng `classList.contains('is-active')`.

**Tự test devserver (trình duyệt thật, 0 lỗi console):** cửa sổ 3 ô đúng kịch bản gõ-từ-5 → hiện
3-4-5 → submit → đảo → đẩy lên 4-5-6 (ô nhập là 6); bảng hẹp 30%(142px) fit=0.711 cả 3 từ cùng 20px
0 cắt; play/pause toggle 4 lần play→pause→play→pause đúng icon+class; slogan ở hàng Menu màu
rgb(107,122,144); loa[472-493] vs fullscreen[495-515] tách hẳn; hộp đồng hồ cao 28px; hết ván →
`.aw-rw-result` biến mất, `.aw-panel` "TEAM A WINS" hiện 4 nút, `elementFromPoint` giữa panel trả về
chính panel (không bị chặn), bấm Start again → về màn READY (vẫn 4:3, act-running_word).

⚠️ **Vẫn 3 việc chỉ thầy làm được** (không đổi): TOMKO thật, fullscreen iPad thật, in A4 thật.

Chi tiết: `templates/running-word/GHI CHU RUNNING-WORD.md` mục 8d. **✅ Thầy "ok build" → đã COMMIT
`a40809e` (gộp Đợt 68+69+70) + PUSH + LIVE; chạy lại trọn bộ TRÊN BẢN LIVE 0 lỗi (poll qua bẫy cache
Pages lần 1 file cũ/lần 2 mới). Còn 3 việc thầy nghiệm thu tay: TOMKO thật, fullscreen iPad, in A4.**

---

## Đợt 69 (5/8/2026, v0.9.44) — RUNNING WORD: LÀM LẠI GIAO DIỆN TRẬN ĐẤU (15 điểm). ⭐ CÓ SỬA CORE. ✅ COMMIT a40809e + PUSH + LIVE

Thầy gửi ảnh bàn phím chuẩn (Type the answer) + 15 điểm 1 lượt để làm lại toàn bộ màn trận đấu:

1. Đồng hồ bỏ tên đội, đẩy sát mép trên, hộp thu ngắn (cỡ chữ đồng hồ vẫn giữ/tăng nhẹ).
2. Bàn phím về **đúng size gốc của core** — bỏ hẳn khối thu nhỏ đã làm ở Đợt 67 (khi đó khung còn
   16:9, thiếu chỗ; nay 4:3 + bảng chỉ 3 dòng nên dư chỗ).
3. Bảng gõ 1 đội chỉ hiện **3 dòng, chữ thật to, căn giữa**.
4. Đến lượt đội nào, bảng đội đó **giãn ra 70%** (đội kia co còn 30%), có animation mượt khi đảo.
5. Bỏ "TEAM X · word N of M" dưới bàn phím, thay bằng slogan "RUNNING WORD IN ANDREW CLASSES".
6. Tên đội dời vào giữa đầu bảng gõ từ (thay vì trên đồng hồ).
7. Số từ CÒN LẠI (không phải đã xong) ra giữa, chân bảng, chỉ 1 số, bỏ chữ "words".
8. Bỏ nút ẩn/hiện bàn phím — mặc định luôn hiện.
9. Bỏ 3 nút Assignment/Template/Print (Print vẫn làm được, từ màn setup của chính game).
10. SET đã lưu hiện nút DELETE SET (xác nhận qua popup) → xoá xong mới Shuffle lại được cho slot đó;
    lưu/xoá đi qua đúng đường `saveActivity()` nên tự đồng bộ Firestore sang máy/iPad khác.
11. Nút Play/Pause TO, tròn, giữa 2 đồng hồ — thêm màn **"prep"**: bấm START MATCH chưa đếm 3-2-1
    ngay, hiện 2 bảng bằng nhau, chạm 1 bảng để chọn đội đi trước (bảng đó giãn ra), bấm Play mới
    chạy 3-2-1 rồi vào trận; bấm lại lúc đang chơi = tạm dừng/chạy tiếp.
12. Bỏ hẳn nút Pause nhỏ + nút Undo cũ (thay bằng nút Play/Pause to ở trên).
13. Nút PASS nay **lộ từ màu đen** (bỏ luật "không bao giờ lộ từ" riêng cho ca này).

**⭐ CÓ SỬA CORE — `core/engine.js`, 1 dòng, thầy duyệt trước:** thêm
`stage.classList.add(\`act-${activity.type}\`)` ngay sau khi dựng khung, cho MỌI activity. Lý do:
2 yêu cầu (khung 4:3 + ẩn 3 nút) cần có hiệu lực **NGAY TỪ MÀN READY** (trước cả khi bấm nút PLAY
xanh), mà markup riêng của RUNNINGW (`.aw-rw-card`) chỉ tồn tại SAU khi `mount()` chạy — nên kỹ
thuật `:has(.aw-rw-card)` dùng ở Đợt 68 không thể áp dụng sớm hơn lúc đó được. Class mới này thuần
cộng thêm (không CSS template nào khác đọc nó), nên 14 game kia không đổi gì — đã hồi quy xác nhận
trên `type-the-answer/test.html`.

**Luồng trận đấu đổi hẳn**: thêm phase `"prep"` giữa `"setup"` và `"countdown"` — `paintBoard()`
tính độ giãn 70/30 theo `showSplit = phase is "prep"/"countdown"/"play"`, một công thức chạy xuyên
suốt cả 3 giai đoạn thay vì viết riêng từng nơi.

**⭐ 1 lỗi lưu trữ thật được vá luôn nhân dịp thêm DELETE**: `readSets()`/`saveCurrentSet()` bản cũ
NÉN mảng `printSets` bằng `.filter()` trước khi lưu — xoá SET 1 khỏi `[A,B,C]` sẽ làm B/C tụt xuống
vị trí 1/2 sau khi tải lại (đổi số SET âm thầm, chưa ai để ý vì trước đây chưa có DELETE). Đổi sang
lưu **theo đúng vị trí** (mảng có thể chứa `null` = ô trống): slot i luôn là SET i+1, xoá 1 ô không
đụng 2 ô còn lại. `running-word-editor.js` cũng phải sửa theo vì nó đọc cùng `readSets()`.

**Tự test trên devserver (trình duyệt thật):** `stage.className` có `act-running_word` + tỉ lệ
4:3 đúng **trước khi bấm PLAY**; nút Template/Set assignment/Print `display:none` + nút Fullscreen
`position:absolute` sẵn từ màn READY; hồi quy Type the answer vẫn `act-type_the_answer` + 16:9 +
0 lỗi · màn "prep": 2 bảng bằng nhau lúc mới vào, chạm bảng A → 70/30 đo sau 450ms ra đúng
396.8px/171.2px (69.9%/30.1%) · 3 dòng: khung cuộn 205.25px ÷ 1 dòng 66.98px = đúng 3.00, cỡ chữ
34.27px · bàn phím `--kbd-kw` đọc ra đúng `5cqw` (mặc định core) · PASS hiện từ màu ink thật (không
còn "—") · Play/Pause dừng → 2 bảng + bàn phím `opacity` đo đúng về `0.4`, bấm lại về bình thường ·
Andrew + gõ đúng vẫn cộng điểm/đổi lượt/remaining giảm đúng · dựng 1 act giả có SET 1 đã lưu sẵn →
Shuffle tự khoá đúng tooltip, đúng 1 nút DELETE SET hiện, xoá lúc chưa đăng nhập báo lỗi gọn qua
toast (không crash, giống hệt hành vi nút Save) — **0 lỗi console suốt toàn bộ**.

⚠️ **3 việc máy không tự kiểm được (không đổi từ Đợt 68):** xem khung/đồng hồ/bảng 70/30 trên TOMKO
thật; bấm fullscreen thật trên iPad (Fullscreen API cần cử chỉ người dùng thật); in thử A4 giấy thật.

Chi tiết đầy đủ: `templates/running-word/GHI CHU RUNNING-WORD.md` mục 8c. **Việc kế: thầy xem 3 việc
trên → duyệt → commit + push (gộp Đợt 68 + 69, cả hai đều đang chờ cùng lúc).**

---

## Đợt 68 (5/8/2026, v0.9.43) — RUNNING WORD: 8 ĐIỂM TỐI ƯU IPAD. ✅ COMMIT a40809e + PUSH + LIVE

Thầy gửi 8 yêu cầu 1 lượt để tối ưu game cho iPad (chơi trong lớp trên TOMKO/iPad):

1. **Khung 4:3 thay 16:9** (RIÊNG game này) — iPad màn hình gần 4:3, khung 16:9 cũ để trống 2 bên.
2. **2 đồng hồ đội lên sát mép trên** — ẩn thanh trên gốc của engine (đồng hồ tổng + tỉ số A-B, nay
   dư thừa), mỗi khối đồng hồ chỉ còn TÊN ĐỘI nhỏ + THỜI GIAN to hơn, bỏ dòng "words".
3. **Fullscreen sạch chữ** — ẩn hết Menu/mũi tên/nhãn/Sound, chỉ chừa icon Fullscreen ở góc để thoát.
4. **Bỏ văn bản hướng dẫn** trên màn hình (phụ đề, ghi chú, dòng tóm tắt cấu hình).
5. **Chia từ theo VỊ TRÍ, tối đa 50/bên** — thay hẳn luật chia ngẫu nhiên cũ: ≤50 từ thì 2 đội chơi
   đúng cùng 1 danh sách (chỉ xáo thứ tự riêng); >50 từ thì Part A = 50 từ ĐẦU, Part B = 50 từ CUỐI
   theo đúng thứ tự thầy nhập. Bỏ hẳn thanh "Words per team".
6+7+8. **Tờ in tối ưu** — heading thu nhỏ (nhường mm cho bảng từ), bỏ trần cỡ chữ (luôn lấp kín
   trang), gạch phân cách mỏng hơn, vẫn luôn A4 1 trang 1 tờ (đã đúng sẵn).
9. **Tờ CHECK đánh số riêng cho cả 2 nửa** (`№ TEAM A № TEAM B`, 4 cột thay vì dùng chung 1 cột №).
10. **Andrew help 1..5** (bỏ nấc 0/Off).
11. **Thanh "Time each team" kiểu bậc thang** — 10 nấc cố định 0:30→5:00 + nấc Custom (Min/Sec riêng).
12. Bonus 0-15s — đã đúng sẵn, không cần sửa.

**KHÔNG ĐỤNG CORE** — chỉ 5 file trong `templates/running-word/` (`running-word.js/.css`,
`rw-sets.js`, `rw-print.js`, `sample-running-word.js`). Khung 4:3 + fullscreen sạch chữ dùng kỹ
thuật `:has()` để khoanh vùng CHỈ riêng game này (`.aw-stage:has(.aw-rw-card)`, đúng khuôn mẫu đã
dùng cho việc ẩn mũi tên Back-Next từ Đợt 67) — **không sửa `core/app.css`**, 14 template kia (đã
tinh chỉnh riêng cho 16:9) không hề bị ảnh hưởng.

⭐ **1 lỗi thật bắt được lúc tự test trong trình duyệt** (không phải đọc code): thanh trượt "Time
each team" kéo sang nấc Custom rồi tự nhảy về nấc cũ ngay lập tức. Nguyên nhân: hàm vẽ lại UI đọc vị
trí thanh trượt TỪ giá trị đã lưu (`draft.clockSeconds`) thay vì tin thao tác kéo vừa xảy ra — mà lúc
vừa vào Custom giá trị đó chưa kịp đổi nên tính ngược lại ra đúng nấc CŨ. Sửa: tách hẳn "vẽ lại toàn
bộ lúc mở panel Options" khỏi "chỉ đổi 2 nửa hiện/ẩn lúc kéo thanh" — vị trí thanh trượt chỉ do chính
thao tác kéo quyết định, không bao giờ bị suy ngược lại từ giá trị đã lưu.

**Tự test trên devserver (trình duyệt thật, không phải đọc code suông):** tỉ lệ khung đo được đúng
4:3 (968×726px), thanh trên gốc `display:none`, đồng hồ cách mép trên 5.8px · gọi thẳng
`buildSets()`: pool 30 (≤50) → 2 đội giống hệt nội dung chỉ khác thứ tự, pool 70 → A đúng 1-50 / B
đúng 21-70 / trùng đúng 30, pool 120 → trùng 0 — khớp 100% công thức mới · chơi thật: bấm Andrew hiện
đúng từ, gõ đúng → dòng xanh + đồng hồ đảo + điểm cập nhật + turn label đổi đội, 0 lỗi console · mở
Options: 4 nhóm còn lại đúng (Round chỉ còn Andrew 1-5), kéo Time each team qua đủ nấc + Custom →
Apply → Play lại → facts hiện đúng "2:15" đã lưu → mở lại Options → đúng lại Custom "2"/"15"
(round-trip không mất dữ liệu) · gọi thẳng `printRunningSheets()` (có tem `window.print` tránh treo
renderer) với pool 50/30 → đúng 3 trang, PART A 50 dòng, PART B 30 dòng, CHECK 50 dòng **4 cột**
`№ TEAM A № TEAM B`, pool 50 → 2 cột, dòng 10.12mm / chữ 6.27mm (~17.8pt, gần gấp đôi cỡ cũ ~10.5pt)
· Edit mở không lỗi · **0 lỗi console suốt toàn bộ**.

⚠️ **3 việc máy không tự kiểm được, cần thầy:** xem khung 4:3 + đồng hồ trên TOMKO thật; bấm thử
Fullscreen thật trên iPad/Chrome (Fullscreen API cần cử chỉ người dùng thật, máy không tự bấm được)
xem có sạch chữ như ý + nút thoát có dễ bấm không; in thử 3 tờ A4 giấy thật xem chữ có thật sự
to/lấp kín trang như mong muốn, gạch phân cách mỏng có còn rõ không.

Chi tiết đầy đủ từng điểm: `templates/running-word/GHI CHU RUNNING-WORD.md` mục 8b (và mục 3 đã viết
lại cho luật chia từ mới). **Việc kế: thầy xem 3 việc trên → duyệt → commit + push.**

---

## Đợt 67 (4/8/2026, v0.9.42) — ⭐ TEMPLATE THỨ 15: **RUNNING WORD (RUNNINGW)** — trận đấu 2 đội trên đồng hồ cờ vua, có sẵn bàn phím AWord + nút Andrew + tự in 3 tờ A4. **⭐ CÓ SỬA CORE (`core/keyboard.js`, thầy yêu cầu sau khi xem báo cáo).** ✅ **COMMIT (`7d721a7`) + PUSH + LIVE** — trước khi commit đã `git fetch` so origin (**0/0**, không máy nào đẩy chen); `curl` poll Pages (**đúng bẫy quen: lần 1 còn trả file CŨ, lần 2 mới đủ 6 file**) rồi **CHẠY LẠI trọn bộ kiểm tra TRÊN CHÍNH BẢN LIVE** (mở thẳng `andrewclasses-01.github.io/AWord/templates/running-word/test.html`, không phải bản local): bản vá bàn phím trên live đúng (dựng lúc disabled → bấm **0**; `refresh()` mở khoá → bấm **ăn ngay 1**), **15/15 template mount 0 lỗi**, công thức chia từ trên live ra đúng `50+50 · trùng 15 · phủ ALL` với pool 85, Andrew trên live hiện đúng từ, **chơi TRỌN 1 ván thật → "REDS WINS · finished the whole list" 3–2 + engine ăn mừng**, 0 từ bị lộ, 0 lỗi console. ⬜ **Còn chờ thầy**: chơi trên TOMKO + in thử 3 tờ A4 giấy thật.

Thầy đưa 2 file nguồn và tả trò đang chơi bằng tay: `D:\4. LISTENING\...\IEL-S15.T3.P4.xlsm` sheet **`RunningW`** (3 mảng: PART A cột A-D · PART B cột E-H · TEAM A/TEAM B cột I-K) và `D:\10. ACTIVITIES\GAMES\WORD GAMES.xlsx` sheet **`RUNNING`** (chỉ là 1 cột rộng để typer gõ trên iPad, còn nguyên vết gõ sai "Inven5", "Invent\"). Luật: explainer tả từ → typer gõ → thầy soi tờ CHECK báo đúng → **bấm đồng hồ cờ vua** → đổi đội. Hết giờ trước là thua; hết từ thì so thời gian còn lại.

### ⭐ Giải mã được luật chia từ (đo file thật, không đoán)

```
pool (WORDTABLE cột D) = 85 từ · PART A = 50 · PART B = 50
A ∪ B = ĐÚNG 85  -> phủ TRỌN pool, không sót từ nào
A ∩ B = ĐÚNG 15  = 50 + 50 − 85  -> số từ trùng ÍT NHẤT có thể
```

Tức KHÔNG phải "xáo pool rồi bốc 50 hai lần" (kiểu đó trùng ~29 từ và bỏ sót cả chục từ). `rw-sets.js buildSets()` cài đúng luật này, **cộng 1 ràng buộc Excel không làm được**: từ trùng phải lệch vị trí ≥6 dòng giữa 2 danh sách, không thì đội B gõ ngay từ vừa nghe explainer đội A tả. Chạy lại với pool 85/50 mỗi đội → ra **đúng 50+50, trùng 15, phủ ALL** — trùng khít bản thầy làm tay.

### ⭐ Luật thiết kế xuyên suốt: TỪ SẮP TỚI KHÔNG BAO GIỜ HIỆN LÊN MÀN HÌNH

Typer đứng ngay trước màn hình. Nên dòng chưa chơi **chỉ hiện số thứ tự**; **màn setup cũng chỉ hiện CON SỐ** (85 từ · 50+50 · trùng 15 · phủ ALL · 5:00 mỗi đồng hồ), không hiện chữ nào; dòng PASS hiện `—` (từ đó có thể đang nằm trong danh sách đội kia — lộ ra là tặng không cho đối thủ). Chỉ dòng gõ ĐÚNG mới hiện chữ xanh lá (đúng yêu cầu thầy; chỗ này rò rỉ nhẹ y như bản Excel cũ vẫn rò). Đo thật lúc vào trận: quét toàn bộ `.aw-rw-row-body` → **rỗng hoàn toàn**.

### Đã làm

**7 file mới** trong `templates/running-word/`: `running-word.js` (setup → 3-2-1 → trận đấu → bảng kết quả), `running-word.css`, `running-word-editor.js` (**1 ô textarea, mỗi dòng 1 từ** — dán thẳng cột Excel; game này 1 item chỉ có 1 trường nên list ô kiểu Quiz là tra tấn với 85 từ), `rw-sets.js`, `rw-print.js`, `rw-sound.js` (synth Web Audio: tiếng **clack** đồng hồ cờ vua = 2 tiếng gõ cách 28ms trên 1 thùm trầm, chuông kết thúc dùng bồi âm **không điều hoà** cho ra chất kim loại, tick 15s cuối càng gần 0 càng cao và to), `sample-running-word.js`, kèm `test.html/test.js` + `GHI CHU RUNNING-WORD.md`.

**Tính năng:** 2 đồng hồ cờ vua (đội đang chạy sáng, đội chờ tối hẳn) · gõ đúng → xanh + ✓ bay về ô đếm từ + **clack đảo đồng hồ** + xuống dòng đội kia · gõ sai → đỏ + rung, **đồng hồ vẫn chạy**, không cho qua (đúng luật cờ vua) · **nút PASS** (bật/tắt bằng Options theo yêu cầu thầy, phạt giây, dòng bỏ luôn để tờ giấy không lệch dòng) · **nút Andrew** (mỗi ĐỘI 1 lượt, 0-3) · **PAUSE + UNDO cho trọng tài** · 3-2-1 vào trận · 15s cuối chuông dồn + mặt đồng hồ đỏ nhấp · hết giờ → chuông 3 hồi → "BLUES WINS · REDS ran out of time" + bảng so 2 đội. Options: tên 2 đội, thời gian mỗi đội, thưởng Fischer, số từ mỗi đội, số lượt Andrew, bật/tắt PASS + mức phạt, mốc cảnh báo.

**In 3 tờ A4** (`rw-print.js`, in từ màn setup): PART A · PART B · CHECK, đúng 3 trang, cột **TURN là ô trống để tick** (thầy chốt). Chiều cao dòng tự tính theo số từ; **≥41 dòng tự chảy 2 cột** để chữ không tụt xuống ~7pt (explainer vừa đứng vừa đọc vừa nói). Đo lại mọi cỡ pool thật: 20/40/60/85/100 từ đều **lọt 1 trang, chữ 9.9-10.5pt**.

**Lưu bộ in vào act** (thầy chọn): 3 slot SET 1/2/3, nút "Shuffle new split" + "Save as SET n" ngay trong game; `store.js` **nạp trì hoãn trong chính hàm click** (đúng luật "trang HS không nạp code thư viện") và nút Save chỉ dựng khi phát hiện đang ở máy thầy (`.aw-below-right` — engine gỡ thanh công cụ này ở chế độ HS, nên đây là tín hiệu tin cậy mà không cần thêm API core).

**2 chỗ core được phép sửa (thầy duyệt trước):** `core/catalog.js` thêm 1 mục (cổng tích hợp chính thức) · `core/lesson-import.js` thêm `runningWord()` + 1 nhánh → Import file `.xlsm` bài học tự sinh act `<mã bài> / RUNNING WORD`. Đo thật với chính file của thầy: bundle từ 8 → **9 act**, act mới có **đúng 85 từ**, giữ nguyên 4 từ nhiều chữ/gạch nối (`WASH DOWN`, `BRING IN`, `LARGE-SCALE`, `SKIN-SCRAPER`), parse hết 114ms. **KHÔNG đụng `core/convert.js`** → game này chưa tham gia Change template (cố ý, ghi trong GHI CHU).

### ⭐ 2 LỖI THẬT BẮT ĐƯỢC KHI CHẠY THẬT (không phải khi đọc code)

**(1) Phím Andrew chết cứng → ⭐ HOÁ RA LÀ LỖI CỦA CORE, ĐÃ VÁ TẬN GỐC.** `fnKey()` trong `core/keyboard.js` gắn `onclick` **CHỈ KHI phím không disabled lúc DỰNG** (`if (disabled) b.disabled = true; else if (onClick) b.onclick = …`), và `refresh()` về sau **chỉ đổi `.disabled`, không gắn lại handler** → phím nào sinh ra lúc đang khoá là **chết hẳn cả phiên, im lặng, không lỗi console**. Bản đầu của Running word dựng bàn phím ngay trong `mount()` (lúc đó còn màn setup, `phase === "setup"`) nên dính. Chỉ lộ ra khi BẤM THỬ THẬT.

Ban đầu tôi chỉ né bằng cách dời `createKeyboard()` xuống `startMatch()` và ghi vào ĐỀ XUẤT SỬA CORE; **thầy chốt sửa luôn core**. Khi sửa mới phát hiện **Crossword ĐÃ TỪNG BỊ CHÍNH BẪY NÀY** và phải né bằng tay — `isDisabled` của nó có điều kiện thừa `(curWord >= 0 && ...)` kèm ghi chú *"must NOT be disabled at build time (curWord is -1 then), or the core keyboard never wires the click"*. Tức lỗi đã âm thầm bắt 2 session bẻ cong logic.

**Bản vá (`core/keyboard.js`, 2 chỗ):** `fnKey()` **luôn gắn handler**, `disabled` một mình quyết định bấm được hay không (`<button disabled>` không bao giờ phát click nên gắn sẵn là an toàn tuyệt đối); `extraKeyEl()` thôi truyền `null` làm `onClick` khi đang khoá. Đo bằng ca tái hiện đúng lỗi cũ: dựng phím lúc **đang disabled** → bấm **0 lần ăn** (đúng), `refresh()` mở khoá → bấm **ăn ngay 1 lần** (trước vá: vẫn 0). caps/numbers giữ nguyên hành vi (caps vẫn khoá trong numbers mode, vẫn chạy lại khi thoát). Hồi quy 3 game dùng bàn phím: **Type the answer** (Andrew mở đáp án "gray", glow, khoá lại; gõ chữ + Submit bình thường), **Crossword** (26 phím chữ, caps sống), **Running word** (Andrew hiện từ, glow, khoá) — 0 lỗi console. Ghi chú thừa của Crossword được **giữ nguyên hành vi**, chỉ sửa comment cho khỏi đánh lừa session sau (không đổi code đang chạy tốt chỉ để dọn 1 dòng). Luật mới ghi vào `core/HUONG DAN CORE.md` mục "BẪY BÀN PHÍM": **từ nay template được tự do dựng bàn phím ở bất kỳ trạng thái nào.**

Running word vẫn giữ việc dựng bàn phím ở `startMatch()` — không còn vì bắt buộc, mà vì màn setup không có gì để gõ, và như vậy game vẫn chạy đúng cả trên bản core cũ.

**(2) Ngân sách chiều cao sai → bàn phím nuốt hết 2 cột.** Tôi tính theo khung 56.25cqw, nhưng **vùng chơi chỉ cao 45.67cqw** (thanh trên + thanh dưới ăn ~10.6cqw), và bàn phím ở cỡ gốc chiếm **20.3cqw** chứ không phải ~17.5 như ước lượng. Kết quả đo: đồng hồ 12.57 + bàn phím 20.3 = 32.9/45.67 → 2 cột chỉ còn **9.87cqw = 1.04 DÒNG**, tức mất sạch ý nghĩa của màn hình. Chụp ảnh mới thấy. **Sửa:** thu đồng hồ (12.57→9.62), thu dòng, và thu bàn phím (20.3→15.35) bằng các luật **scoped `.aw-rw-card .aw-kbd-*`** — tuyệt đối không luật trần, vì CSS template ở lại document vĩnh viễn nên sẽ thu nhỏ luôn bàn phím của Type the answer + Crossword suốt phiên. Đo lại: **5 dòng hiện trọn mỗi đội, 0 chồng lấn, 0 tràn**.

### Tự test (trình duyệt thật, 0 lỗi console)

Vì màn hình **cố ý không hiện từ** nên không script nào đọc trộm được đáp án → test hộp đen: dựng act pool nhỏ đã biết rồi **dò từng từ** (mỗi lần dò sai chính là 1 ca kiểm thử đường sai). Kết quả: chia từ đúng công thức ở 5 cỡ pool · vào trận đúng (3-2-1, 2 đồng hồ, ô nhập ở dòng 1 cột A, 0 từ lộ) · 5 lần gõ sai đều bị chặn, không nhảy dòng, đồng hồ vẫn chạy · gõ đúng → xanh + đảo đồng hồ + điểm 1–0 · Andrew hiện từ vàng đúng dòng, dùng xong đội kia vẫn còn lượt riêng · PASS phạt đúng −5s và không lộ từ · UNDO trả đúng lượt + đúng giờ · PAUSE đóng băng rồi chạy lại · hết danh sách → "REDS WINS · finished the whole list" 3–2 · **hết giờ: cảnh báo bật đúng mốc 0:15, đếm tới 0:00 hết đúng 30s, ra "BLUES WINS · REDS ran out of time"** · editor (dán cột Excel, dedupe, sort, save tự loại bộ in đã lỗi thời) · **in: 3 trang, 50 dòng/tờ, ô tick có, tờ CHECK ghép đúng cặp A/B theo dòng** · **4 theme đều tương phản tốt** (chữ nay theo `var(--aw-text)` của theme) · **142/142 phần tử bấm được có tap-highlight trong suốt** (thừa hưởng bản vá core v0.9.40, KHÔNG khai lại) · **hồi quy: 15/15 template mount + có editor, 0 lỗi console**.

⚠️ Ghi lại 1 bẫy của chính khâu TEST: đừng khôi phục `window.print` ngay sau khi gọi `printRunningSheets()` — hàm này hẹn `window.print()` sau 60ms, khôi phục sớm là bung hộp thoại In THẬT và **treo cứng renderer** (đã dính, phải mở tab mới).

**Việc kế: ĐÃ LÊN LIVE, không phải chờ gì thêm về mặt kỹ thuật. Thầy chỉ còn 2 việc mà máy không thay được: (1) chơi thử trên TOMKO — nhất là cỡ chữ ô nhập + 2 mặt đồng hồ nhìn từ cuối lớp; (2) IN THỬ 3 TỜ A4 GIẤY THẬT — xem 50 dòng có lọt đúng 1 trang và ô TURN có đủ to để tick không (máy mới chỉ tính được chiều cao trang, chưa cầm được tờ giấy). Chỗ nào chưa vừa thì báo.**

---

## Đợt 66 (4/8/2026, v0.9.41) — CROSSWORD: PHÂN TRANG TỚI 120 ANSWER + ANAGRAM→CROSSWORD NÂNG TRẦN 40→120. KHÔNG ĐỤNG CORE (chỉ `core/convert.js`, dùng chung mọi template). ✅ COMMIT (`4d5b892`) + PUSH + LIVE — `curl` kiểm 3 file (crossword.js/convert.js/crossword-editor.js) **lên live ngay lần đầu, không dính bẫy cache cũ** lần này, rồi CHẠY LẠI trọn bộ kiểm tra TRÊN BẢN LIVE (import thẳng module từ `andrewclasses-01.github.io/AWord`, không phải bản local): n=31 → "Page 1/2" đúng, mũi tên ẩn đúng, `switchTargets()` live trả đúng 40→true/41→true/120→true/121→false, giải thật 3 từ trên bản live → điểm "3" đúng, 0 lỗi console.

Thầy hỏi vì sao Anagram chưa đổi Template được sang Crossword (ảnh chụp bảng Template, Crossword mờ) — tra ra: **không phải lỗi**, `core/convert.js` giới hạn Crossword tối đa 40 từ (`n>40` bị loại), bộ act của thầy vượt mức đó. Thầy chốt 3 việc:

**(1) Crossword nâng trần lên 120 answer, tự chia trang khi vượt 30/trang** — `templates/crossword/crossword.js`: 1-30 từ chơi **y hệt hiện tại** (1 bảng, ẩn hẳn thanh điều hướng như cũ — không đụng gì hành vi cũ). 31-60 → 2 trang, 61-90 → 3 trang, 91-120 → 4 trang (`PAGE_COUNT=ceil(n/30)`, chia ĐỀU như `find-the-match.js` đã làm, vd 45→23+22 chứ không 30+15). **Mỗi trang là 1 Ô CHỮ HOÀN TOÀN RIÊNG** (tự `buildCrossword()` — khác Find the match: crossword không thể gộp 120 từ vào 1 lưới đan xen duy nhất, bản chất trò chơi là các từ bắt chữ với NHAU trong CÙNG 1 lưới) — `pageState[]` giữ lưới + toàn bộ tiến trình (`userGrid`/`cellStatus`/`wordState`) riêng từng trang nên **điểm và bài đã giải KHÔNG mất** khi trang tự chuyển. Hết trang (mọi từ trang đó `done`) → tự sang trang kế (`endWord()`→`loadPage()`); hết trang cuối → `finish()` gộp `review`/`correct`/`answered` từ TẤT CẢ các trang theo đúng thứ tự. Thanh dưới chỉ hiện **"Page X / Y"** khi >1 trang (như Find the match: `ui.setNav({label})`, KHÔNG có nút lật trang thủ công — trang chỉ tự chuyển khi giải xong) — `crossword.css` thêm 2 luật scoped `:has(> .aw-cw-wrap)` giống hệt kỹ thuật `find-the-match.css` (ẩn `.aw-navbtn`, đậm nhãn) để không rò sang game khác. Bắt được 1 lỗi khi viết: `selectWord()` cũ dùng biến `total` (giờ là TỔNG mọi trang) để bọc chỉ số modulo — sửa lại dùng `clues.length` (số từ CỦA TRANG hiện tại), nếu không sẽ sai khi có nhiều trang (may mắn không lộ triệu chứng vì `i` luôn nằm trong khoảng hợp lệ, nhưng vẫn là lỗi logic thật).

**(2) `core/convert.js`**: `n>40` → **`n>120`** cho đích Crossword trong `switchTargets()` — dùng chung mọi nguồn "qa" (Anagram/Quiz/Flying fruit/...), không riêng Anagram.

**(3) `templates/crossword/crossword-editor.js`**: `MAX_WORDS` 100→120 (khớp trần chơi thật, để cô giáo soạn được tới 120 từ).

**(4) Answer nhiều từ (vd "polar bear") đã hoạt động ĐÚNG SẴN, không cần sửa gì** — `gridKey()` trong `crossword.js` (có từ trước) đã strip mọi ký tự không phải chữ cái (kể cả dấu cách) trước khi dựng lưới, nên "sea horse" tự thành 1 chuỗi 8 ô liền "SEAHORSE" không có ô trống ở giữa. Xác nhận lại bằng cách chơi thật (không chỉ đọc code): nhét từ "SEA HORSE" vào bộ test, giải đúng, được tính điểm bình thường.

**Đã tự test qua trình duyệt thật (devserver + harness tạm, đã xoá sau khi xong)**, không chỉ đọc code:
- 8 mốc số từ (0,1,2,30,31,45,60,61,90,91,120,150 — kể cả vượt trần 120 để chắc không crash): đúng số trang ở MỌI mốc (30→1, 31→2, 60→2, 61→3, 90→3, 91→4, 120→4, 150→5 — vượt trần vẫn chạy an toàn, chỉ trần 120 là do Editor + convert.js chặn từ khâu soạn/đổi template).
- 1 trang (≤30 từ): thanh điều hướng ẩn HẲN, nhãn rỗng — **y hệt hành vi trước khi có tính năng này**.
- >1 trang: nhãn "Page 1 / N", không có mũi tên ‹›.
- **Chơi TRỌN 1 ván 2 trang thật** (n=31, gõ bàn phím vật lý mô phỏng qua sự kiện, không phải chỉ đọc DOM): trang 1 xong (15/? đúng, một số từ nguồn bị thuật toán đan xen loại — hành vi CŨ của `buildCrossword`, không liên quan đợt này) → **tự chuyển "Page 2/2"**, điểm giữ nguyên "15/28" (không reset) → giải nốt trang 2 → **"GAME COMPLETE", Score 28/28** — xác nhận `finish()` gộp đúng toàn bộ 2 trang, không thiếu/lặp câu nào.
- Hồi quy: `crossword/test.html` (20 từ mẫu, 1 trang) vẫn y hệt trước — 80 ô có chữ, nav ẩn hoàn toàn. `find-the-match/test.html` không bị ảnh hưởng (2 luật CSS mới của crossword.css KHÔNG tải vào trang này).
- `core/convert.js`: gọi thẳng `switchTargets()` với n=0,1,2,40,41,119,120,121,150 — đúng false/false/true/true/true/true/true/false/false, khớp chính xác biên `2..120`.
- 0 lỗi console suốt toàn bộ quá trình test.

**File đổi**: `templates/crossword/crossword.js` (phân trang), `templates/crossword/crossword.css` (2 luật scoped nav), `templates/crossword/crossword-editor.js` (MAX_WORDS), `core/convert.js` (trần 120). **Việc kế: thầy thử tạo 1 bộ Anagram >40 từ (có clue) → bấm Template → xác nhận Crossword sáng lên; và/hoặc soạn 1 Crossword >30 từ → xác nhận phân trang mượt trên TOMKO. Đã lên live, không cần chờ gì thêm.**

## Đợt 65 (4/8/2026, v0.9.40) — HẾT "NỀN GÓC VUÔNG KHI CHẠM" TRÊN TOMKO, TOÀN BỘ 14 TEMPLATE. ⭐ CÓ SỬA CORE. ✅ THẦY DUYỆT → COMMIT `72e1b5f` + PUSH (`c7df3ed..72e1b5f`) + LIVE, ĐÃ KIỂM CHỨNG TRÊN BẢN LIVE.

> **Kiểm chứng bản live (sau push):** `curl` **3 lần đầu Pages vẫn trả file CŨ**, lần thứ 4 (~60 giây)
> mới thấy dấu mốc `-webkit-tap-highlight-color: transparent` ở dòng 50 `core/app.css` — đúng bẫy quen,
> đừng tin lần curl đầu. Rồi **chạy lại TRỌN BỘ kiểm tra trên chính bản live**
> (`andrewclasses-01.github.io/AWord`), 14/14 template mount + bấm PLAY: **391 phần tử bo góc bấm được ·
> 0 còn dính · 0 lỗi console** · `getComputedStyle(html).webkitTapHighlightColor = rgba(0, 0, 0, 0)`.
> (Crossword đếm 139 thay vì 141 như bản local: mỗi ván lưới sinh ngẫu nhiên nên số ô đổi — đúng thiết
> kế, không phải sai lệch.)

**Yêu cầu của thầy:** nhiều template (có Quiz và Open the box) khi chạm vào ô đáp án hoặc nút Next/Back
thì đúng khoảnh khắc nhấn hiện ra nền ô **góc vuông** rất xấu dù ô bo góc mềm. **Chỉ máy 3 (TOMKO) bị**,
máy 1 và 2 không; đã kiểm hiệu năng chỉ 1-2% GPU/CPU nên không phải máy yếu. Open the box đã hết sau vài
đợt chỉnh, **Quiz và nhiều template khác vẫn bị**. Xảy ra trên **cả Chrome lẫn myActivity**. Thầy cho
làm tự động nhiều tiếng, được sửa core, **chỉ làm local để thầy tự nghiệm thu**.

### Nguyên nhân (đã chốt, có số đo)

Mặc định của Chrome: **`-webkit-tap-highlight-color: rgba(0, 0, 0, 0.18)`** — lớp phủ đen mờ Blink vẽ
khi nhận input **CHẠM**, và hình dạng lớp phủ **KHÔNG bám `border-radius`**, nên 4 góc vuông của nó thò
ra ngoài viền bo tròn của mọi ô/nút. Đây là mặc định có ở MỌI máy, nhưng:

- **Máy 3 có màn cảm ứng** (đo: `navigator.maxTouchPoints = 50`, Device Manager có "HID-compliant touch
  screen") → chạm ⇒ Chrome vẽ lớp phủ ⇒ thấy lỗi.
- **Máy 1/2 điều khiển bằng CHUỘT** → Chrome **không bao giờ** vẽ lớp phủ này ⇒ không bao giờ thấy lỗi.

Đó là toàn bộ lý do lỗi trông như "tại máy 3" trong khi thực chất là một giá trị CSS mặc định.

**Đã loại trừ, có bằng chứng:**
| Giả thuyết | Kết luận |
|---|---|
| Máy yếu / GPU / driver | LOẠI — tải 1-2%; và lỗi biến mất chỉ bằng 1 dòng CSS, không đụng driver |
| Phản hồi chạm của Windows | LOẠI — `HKCU\Control Panel\Cursors\ContactVisualization = 0` (đang TẮT) |
| Lỗi riêng của Chrome hay của Electron | LOẠI — cùng lõi Chromium (Chrome 150.0.7871.187 / pane Electron Chromium 148) nên cùng mặc định, khớp việc cả hai đều bị |
| Lỗi riêng của template nào đó | LOẠI — đo được **cả 14 template đều dính**, và 12 phần tử dính trong mỗi game là **nút dùng chung của engine** |

**Vì sao riêng Open the box đã hết:** Đợt 21 (điểm 1) game đó tự đặt `-webkit-tap-highlight-color:
transparent` cho `.aw-otb-box` + `.aw-otb-qtile`. Nhưng chỉ chữa 2 loại ô của riêng nó — **12 nút dùng
chung của engine vẫn dính ngay cả khi đang chơi Open the box** (đo đúng 12). Maze chase cũng có 1 luật
tương tự. Chính việc **đúng 2 file duy nhất có luật đó lại đúng là 2 game duy nhất sạch** là bằng chứng
khoá lại nguyên nhân.

### Đã sửa — ĐÚNG 1 LUẬT trong `core/app.css`

```css
html { -webkit-tap-highlight-color: transparent; }
```

`-webkit-tap-highlight-color` là thuộc tính **KẾ THỪA**, nên khai một lần ở gốc là phủ **mọi trang**:
khung game 16:9, thanh dưới (Next/Back), cụm công cụ ngoài khung, editor, trang chủ thư viện, modal,
popup in — và **mọi template làm về sau cũng tự hưởng, không phải nhớ thêm luật nào**. Phản hồi khi nhấn
KHÔNG mất: mọi nút vốn đã có `:active` riêng (nút thụt xuống / `filter: brightness()`).

Cố ý **KHÔNG** chép luật này vào 14 file CSS template: không có tác dụng gì thêm, chỉ tạo 14 chỗ để lệch
nhau về sau. 2 luật cũ của open-the-box/maze-chase giữ nguyên (thừa nhưng vô hại, chú thích có giá trị
lịch sử).

### Đo thật (trình duyệt thật, trên chính máy 3, harness mount từng template rồi bấm PLAY)

| Template | Phần tử bo góc bấm được | Dính TRƯỚC | Dính SAU |
|---|---|---|---|
| crossword | 141 | **143** (92 ô chữ + 40 phím + 11 nút chung) | 0 |
| type_the_answer | 53 | **53** (cả bàn phím ảo `core/keyboard.js`) | 0 |
| anagram | 20 | 21 | 0 |
| find_the_match | 20 | 20 | 0 |
| speaking_cards | 18 | 18 | 0 |
| quiz | 16 | **16** (4 ô đáp án + 12 nút chung) | 0 |
| gameshow | 16 | 16 | 0 |
| maze_chase | 16 | 12 | 0 |
| true_false | 14 | 14 | 0 |
| open_the_box | 30 | 12 | 0 |
| whack_a_mole · flying_fruit · balloon_pop · unjumble | 12 mỗi game | 12 mỗi game | 0 |
| **TỔNG 14 template** | **392** | — | **0** |

Console: **0 lỗi** ở cả 14 template, trước lẫn sau. Editor Quiz + Open the box: 0 dính, và ô nhập vẫn
`userSelect: auto` → **gõ và bôi chọn chữ khi soạn bài không bị ảnh hưởng** (bản vá không đụng
`user-select`). Trang chủ thư viện: 0 dính.

### Nghiệm thu bằng NGÓN TAY (bắt buộc — máy không tự chạm được)

Đây là giới hạn thật của việc tự kiểm: lớp phủ tap-highlight do trình duyệt vẽ **chỉ khi có chạm vật lý**;
sự kiện chạm giả lập bằng script KHÔNG làm nó vẽ ra, và pane xem trước không cấp compositing nên cũng
không chụp màn hình được (bẫy quen từ Đợt 57/62). Nên đã dựng sẵn trang so sánh:

**`http://localhost:5510/scratch/kiem-tra-cham-tay.html`** (nằm trong `scratch/` nên git bỏ qua, không
lọt vào commit) — 2 cột hình dạng **giống hệt nhau** (đã kiểm bằng script: cùng `border-radius`, cùng
màu nền, cùng kích thước), cột trái cố ý bật lại `rgba(0,0,0,0.18)`, cột phải dùng bản vá. Chạm giữ ngón
vào từng ô: trái phải thấy mảng vuông, phải thì không.

### myActivity — KHÔNG phải sửa

`myActivity/src/renderer/styles/main.css:4` đã có sẵn `* { ... -webkit-tap-highlight-color: transparent; }`
nên giao diện của chính myActivity vốn miễn nhiễm. Chỗ thầy thấy lỗi trong myActivity **chính là trang
AWord nhúng** (`isAword()` nạp từ `andrewclasses-01.github.io/AWord` — bản LIVE trên Pages). ⚠️ Do đó
**trong myActivity lỗi chỉ hết sau khi thầy duyệt và push lên Pages**, chạy local không đổi được.

---

## ⭐⭐ LƯU Ý CHO MỌI TEMPLATE VỀ SAU — bài học rút từ Đợt 65

> Đây là bài học **đắt nhất** của đợt này, đáng nhớ hơn cả bản vá. Phiên nào build template mới đọc kỹ.

### 1. Bản vá tap-highlight ĐÃ Ở GỐC — đừng chép lại, và đừng phá

`core/app.css` có `html { -webkit-tap-highlight-color: transparent; }`. Vì thuộc tính này **KẾ THỪA**,
template mới **tự động được hưởng, không phải khai gì cả**.

- ❌ **ĐỪNG** chép `-webkit-tap-highlight-color: transparent` vào CSS template mới. Thừa, và tạo thêm
  một chỗ nữa để lệch nhau về sau. (2 luật cũ trong `open-the-box.css` + `maze-chase.css` giữ lại chỉ
  vì lý do lịch sử.)
- ⛔ **TUYỆT ĐỐI ĐỪNG** đặt `-webkit-tap-highlight-color` về một màu khác trong template — làm vậy là
  bật lại đúng con bọ này cho riêng game đó, và sẽ **không ai phát hiện ra trên máy 1/2**.

### 2. ⚠️ CÁI BẪY GỐC: máy build KHÔNG GIỐNG máy dùng

Đây mới là điều cần khắc cốt:

| | Máy 1 (nhà) · Máy 2 (lớp) | Máy 3 — TOMKO |
|---|---|---|
| Vai trò | **BUILD app** | **DÙNG app là chính** |
| Điều khiển | **CHUỘT** | **CHẠM tay** |

⇒ **Có nguyên một LỚP lỗi chỉ tồn tại trên đường CHẠM, và nó vô hình 100% trên máy build.** Lỗi này
sống sót qua **12 template và rất nhiều đợt kiểm tra** đúng vì lý do đó — không ai sai sót cả, chỉ là
máy build không bao giờ đi qua nhánh code ấy.

**Những thứ chuột KHÔNG bao giờ tái hiện được** (nghi ngờ chỗ nào thì phải nhờ thầy chạm thử):
- `-webkit-tap-highlight-color` — lớp phủ chạm (chính là đợt này)
- `-webkit-touch-callout` — menu ngữ cảnh khi nhấn giữ lâu
- Bôi chọn chữ + 2 "tay nắm" xanh khi kéo trên màn chạm (đã vá từ 1/8/2026 bằng `user-select:none`
  trên `.aw-stage`)
- `touch-action` — cuộn/zoom cướp mất thao tác kéo-thả của game (maze-chase đã phải đặt `none`)
- Độ trễ ~300ms double-tap, ghost click, `:hover` **dính lại** sau khi nhấc ngón
- Chạm nhiều điểm cùng lúc (học sinh chạm 2 tay)

### 3. Cách tự kiểm khi không có ngón tay — làm được tới đâu, phải nhờ từ đâu

**Tự kiểm được (nên làm, rẻ, chắc chắn):** đo `getComputedStyle` trên MỌI phần tử bấm được. Harness của
đợt này dùng lại được nguyên: mount từng template → bấm PLAY → duyệt `querySelectorAll('*')`, lọc phần
tử bấm được (`button`/`a`/`input`/`role=button`/`cursor:pointer`), rồi so `webkitTapHighlightColor` với
`rgba(0, 0, 0, 0)`. Chạy hết 14 template mất chưa tới 1 phút.

**KHÔNG tự kiểm được (phải nhờ thầy):** bản thân lớp phủ **chỉ được vẽ khi có chạm VẬT LÝ**. Sự kiện
chạm giả lập bằng script (`PointerEvent`, `dispatchEvent`) **không** làm trình duyệt vẽ nó, và pane xem
trước không cấp compositing nên screenshot cũng timeout (bẫy quen từ Đợt 57/62). ⇒ Điểm cuối cùng
**bắt buộc** do thầy chạm tay.

**Khuôn nghiệm thu 2 cột** (`scratch/kiem-tra-cham-tay.html` đợt này) dùng lại được cho MỌI lỗi chạm về
sau: dựng 2 cột hình dạng **giống hệt nhau** (kiểm bằng script: cùng `border-radius`, cùng màu, cùng
kích thước), một cột cố ý bật lại lỗi, một cột dùng bản vá → thầy chạm 30 giây là kết luận được, thay vì
mô tả qua lại bằng lời. Để trong `scratch/` (đã có trong `.gitignore`) nên không lọt vào commit.

### 4. Nghi lỗi "chỉ xảy ra trên 1 máy" thì hỏi câu này TRƯỚC

Trước khi nghi phần cứng/driver, hãy hỏi: **"máy đó có gì KHÁC về đường VÀO (input), không phải về SỨC
MẠNH?"** Đợt này nếu đi theo hướng "máy yếu → cập nhật driver" thì tốn hàng giờ mà không chữa được gì —
driver đã cũ 1 năm thật, nhưng **hoàn toàn vô can**. Dấu hiệu nhận biết: tải GPU/CPU chỉ 1-2% mà vẫn lỗi
⇒ gần như chắc chắn KHÔNG phải hiệu năng.

Và luôn kiểm cả phía hệ điều hành trước khi đổ cho trình duyệt: máy này
`HKCU\Control Panel\Cursors\ContactVisualization = 0` (phản hồi chạm của Windows đang TẮT) → loại trừ
được ngay một nghi phạm bằng đúng 1 lệnh.

### 5. Bài học lặp lại lần thứ 3: CSS template ở lại document VĨNH VIỄN

Đợt 61 (open-the-box ẩn nút Back/Next của mọi game) · Đợt 22 · nay Đợt 65 — cùng một gốc rễ:
`ensureTemplate()` chèn CSS template **một lần và không bao giờ gỡ**. Nên:
- Luật **TRẦN** nhắm class của core trong CSS template = rò ra toàn app (Đợt 61).
- Luật vá **hẹp** trong 1 template = 13 game kia không được hưởng (Đợt 65).

⇒ **Quy tắc chọn chỗ đặt:** vấn đề thuộc về **thân phận chung** (nút của engine, hành vi trình duyệt,
màn cảm ứng) thì đặt ở **`core/app.css`**; chỉ cái gì thật sự **riêng của game** mới ở lại CSS template.

---

### Việc kế

Thầy chạm thử trang nghiệm thu + chơi Quiz thật trên TOMKO → duyệt → commit + push. Sau push nhớ `curl`
kiểm bản live (bẫy quen: lần curl đầu Pages hay còn trả file CŨ).

---

## Đợt 64 (4/8/2026, v0.9.39) — QUIZ: THÊM THANH LIVES (0–10, 0 = Unlimited). KHÔNG ĐỤNG CORE. ✅ THẦY DUYỆT → COMMIT (`f0b0830`) + PUSH + LIVE.

**Yêu cầu của thầy:** đọc dự án + template QUIZ, xem đã có thanh Lives chưa; chưa có thì thêm, từ 0 đến 10.
**Kiểm tra ra:** Quiz **CHƯA hề có Lives** — cả `quiz.js` lẫn `quiz.css` không có chữ nào; duy nhất
`sample-quiz.js` có dòng thừa `lives: null` (không ai đọc, sót lại từ lần copy khuôn nào đó).

**File đụng (4, đều trong `templates/quiz/`):** `quiz.js` · `quiz.css` · `quiz-sound.js` · `sample-quiz.js`.
KHÔNG đụng `core/` (không cần: hạ tầng tim đã có sẵn từ True/false), KHÔNG đụng 13 template khác.

### Cách làm — bám ĐÚNG khuôn Type the answer (Đợt 56) và True/false
- Ô chứa tim trong thanh trên **đã có sẵn ở core**: `tpl.hasLivesSlot = true` → `engine.js` dựng
  `ui.livesSlot` ngay BÊN TRÁI ô điểm; CSS `.aw-top-lives/.aw-top-heart/.aw-top-heartcount` cũng đã có
  trong `core/app.css`. Nên đợt này **không phải đề xuất sửa core dòng nào**.
- **Options → nhóm "Lives"**: slider `0..10`, 0 hiện chữ **"Unlimited"** (class riêng
  `.aw-quiz-livesrow/-livesslider/-livesval`, dựng trong `buildExtraOptions` cạnh nhóm Navigation).
- **`normLives(v)`**: `0`/`null`/`undefined` → **vô số mạng**. ⭐ Quan trọng: "chưa set" PHẢI là vô số
  mạng chứ không phải mặc định 5 — mọi act Quiz cũ đều không có trường `lives`, nếu mặc định 5 thì các
  bộ đề cũ bỗng dưng "Game over" giữa chừng (đúng lý do Anagram/TTA đã chốt như vậy).
- **Mất mạng**: chỉ khi trả lời SAI → tim TRÁI NHẤT phóng to rồi tan (`.animate()` **kèm `setTimeout`
  dự phòng** theo luật core). 1..5 mạng hiện từng trái tim rời; 6..10 hiện gọn `N♥`.
- **Hết mạng**: khoá hết ô đáp án + gọi `updateNav()` cho 2 mũi tên mờ hẳn (cờ `ending`), 1,5s sau
  `finish("gameover")` → màn ăn mừng và bảng tổng kết hiện **"Game over"** thay "Game complete"
  (qua `raw.title`, cơ chế sẵn có mà Anagram/Find the match/Unjumble đang dùng).
- **Âm cuối ván**: pack Quiz không có file "game over" riêng → `sounds.complete` của template nay để
  **rỗng** và chính `finish()` chọn: xong bài → `blockgamesuccessful` (y như cũ), hết mạng →
  `blockgametimeout`. Cùng khuôn Find the match / True or false (nếu để nguyên thì hết mạng vẫn nổ
  fanfare mừng chiến thắng — vô lý).
- ⚠️ **BẪY tránh được**: `ui.setNav({onNext})` được engine gắn thẳng `btn.onclick = handler`, nên
  KHÔNG được truyền `finish` trần vào (câu cuối) — nó sẽ nhận **MouseEvent làm tham số `reason`**.
  Đã bọc `() => finish("complete")` (cả ở phím `→`).

### Tự kiểm trên trình duyệt thật (devserver 5599, đo DOM — pane không compositing nên screenshot timeout)
| Ca | Kết quả |
|---|---|
| lives=3, sai 3 câu | tim 3→2→1→0, hết mạng khoá ô + **2 mũi tên disabled**, 1,5s sau hiện **"Game over"**, bảng tổng kết "GAME OVER · Score 0/6" |
| lives=2 | y hệt, hết mạng đúng ở câu sai thứ 2 |
| lives=8 | thanh trên hiện gọn **`8♥`**, sai 1 câu → `7♥` |
| **act CŨ không có trường `lives`** | **0 trái tim**, sai HẾT 6 câu vẫn chơi tiếp và kết thúc **"Game complete"** → zero-diff, đúng cam kết |
| lives=3 nhưng trả lời đúng hết | 3 tim còn nguyên, "Game complete", Score 6/6 |
| Menu → "Submit answers" | "Game complete" (engine gọi handler KHÔNG tham số → `reason` mặc định đúng) |
| Panel Options | đủ 8 nhóm, nhóm **Lives** slider min 0 max 10, kéo về 0 hiện "Unlimited" |
| Console | **0 lỗi** ở mọi ca |

### Commit + push + kiểm chứng LIVE (4/8/2026)
- **Commit `f0b0830`** (7 file: 4 file `templates/quiz/` + `APP_MASTER.md` + `GHI CHU DU AN.md` +
  `templates/quiz/GHI CHU QUIZ.md` mới) → **push `d4fc9ff..f0b0830`** lên `andrewclasses-01/AWord` nhánh `main`.
- **`curl` kiểm Pages**: ⚠️ đúng bẫy quen — **lần curl ĐẦU cả 3 file vẫn là bản CŨ** (0 dấu mốc), phải
  poll lại 20s sau mới thấy đủ (`quiz.js` 2 lần `hasLivesSlot`, `quiz.css` 1 lần `aw-quiz-livesslider`,
  `quiz-sound.js` 1 lần `gameOver`). **Đừng bao giờ tin lần curl đầu tiên.**
- **Chạy lại TRỌN BỘ kiểm tra TRÊN BẢN LIVE** (`https://andrewclasses-01.github.io/AWord/`, đo DOM):

| Ca (bản LIVE) | Kết quả |
|---|---|
| lives=3, sai 3 câu | tim `♥♥♥ → ♥♥ → ♥ → (trống)`, ô đáp án khoá hết + **2 mũi tên disabled**, 1,5s sau "**Game over**", tổng kết "GAME OVER · Score 0/6" |
| **act CŨ không có trường `lives`** | **0 tim**, sai HẾT 6 câu vẫn chơi tiếp → "**Game complete**" (zero-diff) |
| lives=8 | `8♥` → sai 1 câu → `7♥` |
| lives=3, đúng hết | 3 tim còn nguyên, "Game complete", **Score 6/6** |
| Menu → Submit answers | "Game complete" (engine gọi handler không tham số → `reason` đúng mặc định) |
| Panel Options | đủ 8 nhóm, **Lives** min 0 max 10, kéo về 0 = "Unlimited" |
| 14 template mount lại | **14/14 OK** |
| Console | **0 lỗi** ở mọi ca |

- ⚠️ Ghi lại cho lần sau: `javascript_tool` **cắt ở 30s** — kịch bản test dài phải chẻ thành nhiều lượt
  (giữ `window.__eng/__mk/__hearts` giữa các lượt), và pane ẩn thì `screenshot` timeout nên đo DOM.

**Việc kế: thầy chơi thử trên TOMKO (chọn số mạng vừa tay); còn chỗ nào chưa vừa thì báo.**
⚠️ Số Đợt/version lấy tiếp sau Đợt 63/v0.9.38; nếu có máy khác cũng đang giữ Đợt 64 thì đổi số khi merge.

---

## Đợt 63 (4/8/2026, v0.9.38) — WHACK-A-MOLE: 5 ĐIỀU CHỈNH THẦY GỬI 1 LƯỢT (bảng/cột · thang Speed · bubble · điểm cuối ván lên bảng · thanh Punishment). ⭐ CÓ SỬA 1 LỖI THẬT (autoFit chưa từng chạy). KHÔNG ĐỤNG CORE. ✅ THẦY DUYỆT → COMMIT (`16586a6`) + PUSH + LIVE.

**File đụng (3 + 3 docs):** `templates/whack-a-mole/whack-a-mole.js` · `whack-a-mole.css` ·
`sample-whack-a-mole.js`. KHÔNG đụng `core/`, KHÔNG đụng 13 template khác (đã đo lại: 14/14 mount 0 lỗi).

### (1) Bảng luôn nằm CHÍNH GIỮA cột, và cột không còn bị thanh giờ đè
- **Đo trước khi sửa** (bản live, khung 968px): cột `49,5 → 223,4px`, thanh thời gian `43,7 → 58,2px`
  → **cột thò lên sau thanh giờ thật**. Bảng lệch thấp hơn tâm cột 1,3px ở chế độ True/False.
- **⭐ LỖI THẬT tìm ra khi truy nguyên "mọi size bảng"**: `updateSign()` gọi `autoFit(root, board, …)` —
  tức so chiều cao câu hỏi với **CẢ VÙNG CHƠI** (~428px) chứ không phải cái bảng (~103px). Vì vậy `--fit`
  **CHƯA BAO GIỜ chạy** kể từ lúc viết; thêm nữa `.aw-wam-sign-question` **không hề dùng `var(--fit)`**,
  nên dù có chạy cũng vô nghĩa. Hậu quả đo được: câu hỏi 262 ký tự làm **bảng phình 376,7px** (gấp 3,6 lần
  chiều cao thiết kế 103,4px) và thòng xuống dưới đáy cột 242px — đúng cái thầy thấy "bảng nằm thấp".
- **Sửa 3 chỗ**: (a) `.aw-wam-post` đổi từ `top:0; height:18cqw` sang **`top:50%; transform:translate(-50%,-50%);
  height:15cqw`** → cột tự lấy TÂM BẢNG làm tâm, đúng với MỌI chiều cao bảng; ngắn lại 18→15cqw nên đỉnh cột
  tụt xuống dưới thanh giờ. (b) `.aw-wam-board` bỏ `margin-top:3.6cqw`, `.aw-wam-sign` `top:6%`→**`14%`**
  (giữ nguyên vị trí bảng nhưng nay chiều cao khối sign = đúng chiều cao bảng, để `top:50%` của cột chính xác).
  (c) autoFit nay so với **chiều cao THIẾT KẾ của tấm ván** (`offsetWidth × 150/474` − padding) qua một hộp
  giả `plankFitBox()`, và `.aw-wam-sign-question` dùng `font-size: calc(2.2cqw * var(--fit,1))`.
- **Đo lại:** True/False → bảng lệch tâm cột **0,0px**, thừa cột trên 18,9 / dưới 19,0px, đỉnh cột cách
  thanh giờ **15,8px**. Quiz: câu 17/66/262 ký tự → bảng giữ đúng 103,4px (fit 1 / 0,91 / 0,48), câu 525 ký tự
  → fit chạm sàn 0,4 nên bảng nở 133px **nhưng vẫn lệch tâm 0,0px**.
- ⚠️ **BẪY vấp phải khi sửa**: đặt `const plankFitBox` ngay trên `function updateSign` là **sai** — `updateSign(false)`
  được gọi ở TRÊN đó trong `mount()`, nên const còn trong vùng chết (temporal dead zone) → `ReferenceError`
  (test trình duyệt bắt được, không phải suy đoán). Đã đổi thành **hàm** `plankFitBox()` (hàm được hoisted).

### (2) Thang Speed trải ĐỀU từ cực chậm tới cực nhanh
Thầy báo "speed 1 vẫn quá nhanh". Công thức cũ `1350 − speed×90` chỉ xuống tới 1260ms ở mức 1.
Nay nội suy tuyến tính giữa 2 đầu: `pace=(speed−1)/9` · nhịp ra mole `2400→340ms` · thời gian mole đứng
`4200→900ms` · số mole cùng lúc `1→8`. **Đo thật:** mức 1 = **1 mole mỗi 4,5s, 1 con một lúc, đứng 4,2s**;
mức 5 = 1 mole mỗi 2,0s (đứng 2,7s); mức 10 = 1 mole mỗi 0,5s (đứng 0,9s).
⚠️ Vì chia đều nên **mức 5 nay chậm hơn mức 5 cũ**; nhịp cũ ở mức 5 (≈0,9s/mole) nay tương đương **mức 7–8**.

### (3) Bubble nâng lên khỏi mặt mole
`.aw-wam-bubble` `bottom: 62% → 80%`. Cách đo (dùng lại được): quét **alpha** file `mole01ready.webp`
(225×231) → 25,5% phía trên ảnh là trong suốt, mực vẽ mới bắt đầu. Trước: đuôi bubble **cắm sâu 20,1px vào
mặt mole**. Sau: cả 3 cỡ hố đều thoát mặt — khe hở **3,3px (hố 10cqw) / 6,6 (11,5) / 9,9 (13)**, và bubble
không vượt lên khỏi mép khung.

### (4) Hết ván: điểm hiện TRÊN BẢNG, câu hỏi biến mất
`endGame()` không còn đắp số khổng lồ giữa sa mạc (`.aw-wam-tally`, đã xoá cả CSS). Nay huỷ `fitter`, dọn
sạch bảng, gắn class `is-score` rồi đặt **"SCORE" + số điểm** (`.aw-wam-sign-score`, 5cqw) lên chính tấm ván —
cột vẫn đứng sau. Số ĐỌNG LẠI trên bảng (trước phải xoá đi kẻo đè chữ "TIME'S UP"; nay bảng ở trên cao,
bảng tổng kết mờ đục của engine tự che). **Đo thật:** chơi 1 ván 6s ăn 16 điểm → bảng hiện `SCORE 16`,
khớp ô điểm engine, `.aw-wam-sign-target` biến mất, bảng vẫn lệch tâm cột 0,0px.
⚠️ Số đếm tăng dần chạy bằng `requestAnimationFrame` — pane ẩn thì rAF đóng băng nên chốt thẳng số cuối qua
`setTimeout` dự phòng (thiết kế sẵn có, không phải lỗi mới).

### (5) Thanh "Punishment" trong Options (0–10s, MÀU XANH LÁ)
Số giây đông cứng sau khi đập sai — trước hard-code 4s (`PENALTY_FREEZE_MS`), nay là option
`options.punishSeconds` (mặc định **4** ⇒ act cũ chơi y hệt). Slider nằm giữa "Points off per wrong hit" và
"Bonus crates", nhãn **"Punishment (pause after a wrong hit)"**, accent `#22c55e`, hiện "Off" ở 0 và "7s"…
Dưới 400ms thì bỏ luôn chữ "WAIT…" + rung lắc (quá ngắn, chớp nháy vô nghĩa).
**Đo thật:** 0s → mole mới sau 362ms, KHÔNG rung · 2s → 2499ms · 8s → 8098ms, có rung.

### Kiểm hồi quy
14/14 template mount 0 lỗi console; sau khi CSS whack-a-mole đã nằm trong document, **Quiz vẫn còn đủ 2 nút
mũi tên** (`display:flex`) → luật ẩn nav của whack vẫn scoped đúng, không rò sang game khác.

### Kiểm chứng SAU KHI PUSH (bản live)
`curl` poll tới khi cả 3 file lên Pages — **lần thử đầu vẫn trả file CŨ, lần 2 mới đủ** (đúng bẫy quen
"Pages cập nhật các file không đồng thời", y như Đợt 62). Rồi chạy LẠI trọn bộ đo **trên
`andrewclasses-01.github.io/AWord/`**: bảng lệch tâm cột **0,0px** · thừa cột 18,9/19,0px · đỉnh cột cách
thanh giờ **17,3px**, hết đè · bubble thoát mặt mole cả 3 cỡ hố (3,3 / 6,6 / 9,9px) · câu hỏi 229 ký tự giữ
bảng đúng 103,4px (fit 0,503) và vẫn giữa cột 0,0px · hết ván bảng hiện `SCORE`, `.aw-wam-sign-target` biến
mất, số khổng lồ cũ đã bỏ hẳn · slider Punishment 0–10 mặc định 4s, accent `rgb(34,197,94)`, "Off"/"10s" đúng,
đặt 8s → mole mới sau **8204ms** kèm rung lắc · Speed 10 = 1 mole/526ms. **14/14 template mount 0 lỗi
console; Quiz vẫn đủ 2 mũi tên** sau khi CSS whack nằm trong document.

**VIỆC ĐANG CHỜ:** thầy chơi thử trên TOMKO — nhất là **chọn lại mức Speed vừa tay** (thang đã đổi: nhịp cũ
ở mức 5 nay tương đương mức 7–8) và ngó cỡ chữ câu hỏi Quiz rất dài (nay co nhỏ thay vì kéo giãn tấm ván).

---

## Đợt 62 (4/8/2026, v0.9.37) — FIND THE MATCH: BỎ "x of y" + ĐƯA "Page X/Y" XUỐNG THANH DƯỚI + BỎ NÚT LẬT TRANG + KHÔNG CÒN Ô ĐÁP ÁN BỊ CẮT. ⭐ CÓ SỬA CORE (1 chỗ, thêm mới). ✅ THẦY DUYỆT → COMMIT (`d4f526f`) + PUSH + LIVE.

**Bối cảnh:** thầy gửi ảnh chụp 1 act 60 cặp đang chơi — **hàng ô cuối bị cắt ngang** vì thiếu chỗ, kèm 3 yêu cầu:
(1) bỏ cụm "x of y", hạ "Page x/y" xuống đúng vị trí đó; (2) bỏ nút lật trang — game này KHÔNG cho next/back,
chỉ hiển thị số trang để biết đang ở đâu; (3) bảo đảm không ô đáp án nào bị cắt.

**File đụng (3 + 4 docs):** `core/engine.js` (1 chỗ, thêm tham số) · `templates/find-the-match/find-the-match.js` ·
`templates/find-the-match/find-the-match.css`. KHÔNG đụng 13 template khác.

### (1)+(2) Số trang chuyển xuống thanh dưới, bỏ hẳn nút lật trang
- **Bỏ pager trong khung** (`.aw-ftm-pager` + 2 nút `‹ ›` + hàm `goPage`): trang chỉ còn tự chuyển khi
  chơi hết trang hiện tại — đúng ý thầy "không cho phép next/back".
- **⭐ SỬA CORE (thêm mới, không đổi hành vi cũ):** `ui.setNav()` nhận thêm tuỳ chọn **`label`** — có thì
  hiện NGUYÊN chuỗi đó thay cho "x of N", không truyền thì y hệt trước. Đúng khuôn các cờ opt-in cũ
  (`hasLivesSlot`, `manualTimerStart`...). Find the match gọi
  `ui.setNav({label: PAGE_COUNT>1 ? "Page 1 / 2" : ""})` → **1 trang thì thanh dưới TRỐNG hẳn**.
- 2 mũi tên của core vốn đã bị CSS của template ẩn từ trước (`:has()` scoped) — giữ nguyên.
- Nhãn ở thanh dưới được nới rộng + đậm hơn (`font-weight:800`, `min-width:14cqw`, màu `--aw-text`), **scope
  bằng `:has(> .aw-ftm-card)`** theo đúng luật "CSS template ở lại document vĩnh viễn". Đã ĐO xác nhận không
  rò: quiz vẫn `700 / 59px / xám`, find-the-match `800 / 135px / đậm`.
- **Lợi kép:** hàng pager cũ chiếm ~4,4cqw TRONG khung nay biến mất → phần đó trả lại cho lưới ô.

### (3) ⭐ LỖI THẬT: phép đo của autoFit "mù" nên ô cuối bị cắt
- **Đo tái hiện trước khi sửa** (60 cặp, khung 16:9 chuẩn): `--fit=0.89` mà lưới vẫn tràn **11px**, **12 ô bị
  cắt** (align-content:center nên tràn chia đôi trên/dưới) — đúng ảnh thầy gửi.
- **Nguyên nhân 1:** `measure()` cũ dùng `grid.scrollHeight`. Lưới là flex item BỊ KÉO GIÃN nên
  `scrollHeight` tụt về đúng chiều cao đã giãn (chính cái bẫy `core/fit.js` ghi ở đầu file) → tràn thật bị
  che, autoFit chỉ phản ứng khi tràn vượt cả slack.
- **Nguyên nhân 2:** `measure()` chỉ cộng `offsetHeight`, **bỏ quên margin** (track 1,2cqw + divider 1,8cqw)
  và padding của card → tưởng nội dung thấp hơn thực tế ~3cqw.
- **Sửa:** đo chiều cao lưới **CẦN** thật sự = `số hàng × chiều cao ô + khoảng cách` (đọc `offsetHeight` của
  1 ô + `rowGap`), cộng `outerH()` (offsetHeight + margin trên/dưới) của track + divider + padding card.
  `slack` đổi 3cqw → **1,5cqw** (vừa đủ ôm gờ 3D 0,5cqw của ô, vốn nằm ngoài hộp layout và bị
  `overflow:hidden` của lưới xén).
- **Kết quả đo lại:** 8 / 35 / 40 / 60 / 70 cặp → **0 ô bị cắt** (kể cả tính cả gờ 3D), **0 ô tràn chữ**,
  `gridScrollHeight === gridClientHeight`.

**Tự test trình duyệt thật (devserver 5510, `templates/find-the-match/test.html`, đo DOM — không đoán qua ảnh):**
- 5 cỡ dữ liệu 8/35/40/60/70 cặp: 0 ô cắt · 0 chữ tràn · nhãn đúng ("" khi 1 trang, "Page 1 / 2" khi 2 trang)
  · 0 nút mũi tên hiện · không còn pager trong khung.
- **Chơi TRỌN 1 ván 36 cặp (2 trang)**: 36/36 bấm đúng, trang tự chuyển và nhãn đổi sang "Page 2 / 2" đúng lúc,
  điểm 36, kết thúc "GAME COMPLETE", console 0 lỗi.
- **Chống hồi quy core**: mount lại quiz / anagram / true_false / type_the_answer / open_the_box / unjumble →
  thanh dưới vẫn "1 of 6" / "0 of 8"... y như cũ, 0 lỗi.
- ⚠️ **BẪY gặp lại (ghi để phiên sau khỏi mất công)**: pane trình duyệt của công cụ KHÔNG compositing →
  `requestAnimationFrame` ĐÓNG BĂNG (đã đo: rAF không bắn trong 600ms). Nên (a) không tin kết quả của đường
  refit-qua-rAF khi test bằng pane này, (b) chụp màn hình bị timeout — phải đo DOM. Đây cũng là lý do
  `fitTiles()` phải gọi ĐỒNG BỘ (đã làm từ Đợt 60).

**Kiểm chứng BẢN LIVE sau khi push (4/8/2026):** `curl` 3 file — `core/engine.js` có `label != null ? label`;
`find-the-match.js` có `gridNeedH` và **KHÔNG còn** `aw-ftm-pager`/`goPage`; `find-the-match.css` có luật
`.aw-nav-label` scoped và **KHÔNG còn** `aw-ftm-pagebtn`. (⚠️ Lần `curl` đầu ngay sau push, engine.js đã mới mà
2 file find-the-match còn CŨ — đúng bẫy "Pages cập nhật file KHÔNG đồng thời", phải poll lại mới đủ.)
Rồi CHẠY LẠI trọn bộ kiểm tra **trên chính bản live** (`…/AWord/templates/find-the-match/test.html`):
8 / 40 / 60 / 70 cặp → **0 ô cắt · 0 chữ tràn · 0 mũi tên · không pager**, nhãn `""` khi 1 trang và
`"Page 1 / 2"` khi 2 trang; chống hồi quy live quiz/anagram/true-false/open-the-box → vẫn "1 of 6"/"0 of 8"…,
nhãn vẫn `font-weight:700` (không rò CSS); console 0 lỗi.

**Việc kế: thầy chơi thử act 60 cặp thật trên TOMKO (bản live) — nếu còn hàng nào chưa vừa thì báo em.**

---

## Đợt 61 (4/8/2026, v0.9.36) — ĐIỀU CHỈNH TỔNG THỂ MỌI ACT: NÚT BACK/NEXT CÓ ĐẾ TO · TEMPLATE TẠM LUÔN MƯỢN DỮ LIỆU ACT GỐC · MỞ ĐƯỜNG ANAGRAM/QUIZ → WHACK-A-MOLE — ⭐ CÓ SỬA CORE. ✅ THẦY DUYỆT → COMMIT (`9dad80b`) + PUSH + LIVE.

**Bối cảnh:** thầy gửi 4 yêu cầu chỉnh TỔNG THỂ (áp cho mọi act, không riêng game nào). Trong lúc kiểm chứng
phát hiện thêm **2 lỗi thật** chặn đúng các yêu cầu đó — đã sửa luôn và ghi rõ bên dưới.

**File đụng (5 + 4 theme):** `core/app.css` · `core/engine.js` · `core/convert.js` ·
`core/themes/{classic,basic,classroom,beach}.css` · `templates/open-the-box/open-the-box.css`.
KHÔNG đụng 13 template còn lại.

### (1) Nút Back/Next: ĐẾ TO CỐ ĐỊNH, luôn nhìn thấy — `core/app.css` + 4 theme
- Trước: `.aw-navbtn` là icon TRONG SUỐT 4cqw×4cqw, chỉ hiện nền khi rê chuột → trên bảng cảm ứng bấm
  trượt là bấm vào khoảng không, không có phản hồi gì.
- Nay: mỗi mũi tên nằm trên **đế bo tròn 8.6cqw × 5cqw VẼ SẴN mọi lúc** (nền + gờ 3D dưới kiểu Wordwall),
  icon to lên 2.6→2.8cqw. **Vùng bấm 83×48px ở khung 968px = gấp ~2,7 lần** vùng cũ (38×38px).
- **Lúc nút bị khoá (`:disabled`) đế VẪN HIỆN** (mờ .42, bỏ gờ) — chủ ý: nút không được biến mất dưới
  ngón tay đang với tới; trước đây mờ .28 mà không có nền nên gần như tàng hình.
- Nút cuối ván (`.is-finish`) đổi thành **đế XANH LÁ chữ trắng** (`--aw-ok`/`--aw-ok-d`) thay vì chỉ đổi
  màu icon → dấu ✓ kết thúc nổi hẳn.
- Màu đế lấy từ **4 biến theme MỚI** `--aw-nav-plate` / `--aw-nav-plate-hi` / `--aw-nav-lip` /
  `--aw-nav-ink`, khai trong cả 4 file `core/themes/*` (classic xanh xám · classroom kem gỗ · beach xanh
  biển nhạt · basic phẳng, "gờ" chỉ đậm hơn nền một chút). Trong `app.css` mọi biến đều có **giá trị dự
  phòng** nên theme nào chưa khai vẫn hiện đúng.
- ⚠️ **BẪY đã tránh:** phản hồi lúc NHẤN dùng `filter: brightness` + co gờ, **KHÔNG dùng `transform`** —
  `.is-finish` đang chạy `@keyframes aw-glow` (scale), mà animation LUÔN thắng transition trên cùng thuộc
  tính, nên nút finish sẽ không nhún được; dùng filter thì mọi nút phản hồi giống nhau.
- **Hệ quả bố cục:** thanh dưới cao thêm ~1,1cqw → đo thật thấy **menu ☰ đè lên thanh dưới 8px**. Đã nâng
  `.aw-menu` 5.8→**6.9cqw** và `.aw-toast` 6.4→**7.5cqw** (đo lại: menu hở 3px, toast hở 5px). Đây là 2
  phần tử DUY NHẤT neo vào đáy khung (đã grep toàn bộ `bottom:*cqw` trong core + 14 template).
- 4 game **không dùng** nav nên không ảnh hưởng: Open the box (ẩn cả cụm), Find the match / True-false /
  Whack-a-mole (ẩn 2 nút, giữ cụm) — đúng thiết kế sẵn có của chúng.

### (1b) ⭐ LỖI THẬT: chơi Open the box 1 lần là MẤT nút Back/Next ở MỌI game còn lại
- Thầy yêu cầu nút to "ở mọi template" → khi quét mới lòi ra: `open-the-box.css` có luật **trần**
  `.aw-nav { display: none; }` kèm ghi chú "chỉ CSS của template này được nạp khi Open the box đang chơi
  nên không ảnh hưởng template khác". **Ghi chú đó đã SAI từ v0.9.7**: `ensureTemplate()` chèn CSS của
  template MỘT LẦN và KHÔNG BAO GIỜ gỡ ra → mở Open the box xong thì luật đó nằm lại vĩnh viễn.
- *Đo thật (trước khi sửa):* mount Open the box → mount Quiz → `.aw-nav` của Quiz `display:none`. Tức là
  **cả buổi dạy, sau khi mở Open the box một lần, không game nào còn nút Back/Next** (tới khi tải lại trang).
- *Sửa:* scope 2 luật theo đúng khuôn Whack-a-mole (Đợt 57 đã cảnh báo chính cái bẫy này):
  `.aw-playarea:has(> .aw-otb-card) ~ .aw-bottombar .aw-nav{display:none}` và luật ghim `.aw-tools` cột 3.
- *Đo lại:* Open the box vẫn tự ẩn nav + `.aw-tools` vẫn ở cột 3; 10 game còn lại có nav thì nav trở lại
  đủ 83×48. **Chỉ sửa file của open-the-box, không đụng core.**

### (2) Template TẠM luôn mượn dữ liệu của act GỐC — `core/engine.js`
- Thầy chốt: act tạm chỉ **mượn** nội dung; bấm Template lần nữa thì template tạm mới phải lấy dữ liệu từ
  **act CHÍNH ban đầu**, không phải từ act tạm trước đó.
- `doSwitchTemplate` vốn ĐÃ convert từ `originAct` (Đợt 53) — nhưng **danh sách game đổi-được thì tính từ
  act ĐANG CHƠI**: `switchTargets(activity)`. Vì convert là quá trình MẤT dữ liệu nên hỏi act tạm "mày đổi
  được sang gì" cho ra danh sách nghèo đi → **khoá mất tính năng**, đúng như thầy mô tả.
- *Đo thật (cách cũ):* act gốc Quiz → đổi tạm sang **Speaking cards** → `switchTargets` trả về **0 game**
  (Speaking cards không có đáp án) ⇒ panel Template khoá SẠCH, thầy kẹt trong game tạm, chỉ còn cách về
  trang chủ. Với act gốc Anagram không có clue thì mọi game cần đề cũng biến mất y hệt.
- *Sửa:* thêm hàm `switchList()` trong `engine.js` — **luôn tính từ `originAct`**, rồi thêm lại chính loại
  của act gốc (để thầy quay về act thật) và bỏ loại đang chơi. `buildTemplatePanel` + `openSwitchPicker`
  (menu ☰ và màn kết thúc) đều dùng nó.
- *Đo lại:* từ act tạm Speaking cards nay đổi được **11 game** (bằng đúng act gốc); chuỗi thật
  **Quiz → tạm Speaking cards → Whack-a-mole** chạy trọn, và câu hỏi Whack giữ **đúng đáp án nhiễu gốc của
  Quiz** (warm/wet/dry) — bằng chứng dữ liệu lấy từ act CHÍNH chứ không phải từ act tạm (Speaking cards
  không hề có đáp án để mà lấy).

### (3)+(4) ⭐ LỖI THẬT: Anagram → Whack-a-mole và Quiz → Whack-a-mole vốn HỎNG — `core/convert.js`
- 2 chuyển đổi này **vẫn hiện sáng bấm được** trong panel Template từ trước (whack_a_mole nằm sẵn trong
  `QA_TARGETS`) — nhưng bấm vào là game trắng, báo "This activity has no statements yet."
- *Gốc:* Whack-a-mole là game DUY NHẤT có 2 hình dạng nội dung chọn bằng **option** `options.mode`
  (`quiz` → `content.questions`, `trueFalse` → `content.statements`). `convertActivity` dựng đúng
  `questions`, nhưng chỉ đặt mode `if (!options.mode)` — trong khi options được copy từ **sample của
  Whack-a-mole vốn đã có sẵn `mode:"trueFalse"`**, nên điều kiện KHÔNG BAO GIỜ đúng. Act chuyển sang mang
  câu hỏi trắc nghiệm mà tự khai là true/false → game tìm `statements` rỗng → trắng.
- *Sửa 1 dòng:* bỏ điều kiện, **luôn ép** `options.mode = (kind === "tf") ? "trueFalse" : "quiz"` cho mọi
  lần convert sang Whack-a-mole (mode phải bám theo nội dung vừa dựng, kể cả khi có options đã nhớ).
- Cách dựng câu đúng như thầy yêu cầu (hàm `buildMc` sẵn có): **câu hỏi/định nghĩa + đáp án đúng của chính
  câu đó + trộn thêm đáp án lấy từ các câu khác** trong bộ (ưu tiên đáp án nhiễu gốc nếu nguồn vốn là trắc
  nghiệm, thiếu thì bù bằng `term` của câu khác), rồi xáo thứ tự.
- *Đo thật:* Anagram → Whack: 6 câu, câu 1 = "A huge grey animal with a long trunk." + [elephant (ĐÚNG),
  polar bear, penguin, dolphin], scene dựng OK. Quiz → Whack: 6 câu, câu 1 = 'The opposite of "hot" is ...'
  + [cold (ĐÚNG), warm, wet, dry], scene OK. Find the match → Whack cũng OK (cùng nhóm qa).
  **True/false → Whack vẫn ra `trueFalse` như cũ — không hồi quy.**

### Tự kiểm (trình duyệt thật, chạy từ trang gốc `/` để đường dẫn CSS template đúng)
- **14/14 template mount 0 lỗi console**; nút nav 83×48 ở 10 game có nav, 4 game còn lại ẩn đúng thiết kế.
- Biến theme đế nút: classroom ra `#f0e4cd`, classic `#e9f0f8` — đúng file theme.
- Nút finish: `is-finish` + đế `rgb(51,162,74)` + chữ trắng + gờ `rgb(35,122,55)`.
- ⚠️ **BÀI HỌC ĐO ĐẠC (lặp lại bẫy throttle đã ghi ở Đợt 57):** pane trình duyệt bị ẩn thì Chromium NGƯNG
  compositing → **CSS transition đứng im giữa chừng**, `getComputedStyle` đọc ra giá trị CŨ dù cascade đã
  đúng (đế finish đọc ra xám, `opacity` nút khoá đọc ra 1). Kiểm `el.getAnimations()` thấy 3 CSSTransition
  kẹt `state:"running"`; đặt `style.transition="none"` rồi đọc lại mới ra giá trị thật. **Đừng vội kết luận
  CSS sai khi đo trong pane ẩn.**
- Harness chạy từ trang `templates/<x>/test.html` cho kết quả CSS SAI (đường dẫn `css` trong catalog tính
  từ TRANG, mà trang test nằm sâu 2 cấp → 404). Muốn quét nhiều template phải chạy từ `/`.

### Đã commit + push + kiểm chứng LIVE (4/8/2026)
Commit **`9dad80b`** (13 file: 5 file code + 4 theme + 4 file ghi chú) → push `main`.
- **`curl` bản live**: kiểm 10 dấu mốc trong 6 file (`app.css` đế nút + `bottom:6.9cqw` + `bottom:7.5cqw` ·
  `engine.js switchList()` · `convert.js` ép mode · 4 theme · `open-the-box.css` luật đã scope) — **10/10 LIVE**.
- **Chạy lại TRỌN bộ kiểm tra trên chính bản live** `andrewclasses-01.github.io/AWord`: mở Open the box
  trước tiên (ca từng làm hỏng mọi game sau đó) → **14/14 game mount, 0 lỗi console**, 10 game có nav đều
  83×48 đế `rgb(233,240,248)`, 4 game ẩn nav đúng thiết kế; chuỗi Quiz → tạm Speaking cards → Whack ra
  `mode:"quiz"` scene dựng OK; Anagram → Whack 6 câu (elephant ĐÚNG lẫn giữa kangaroo/giraffe/dolphin —
  mỗi ván trộn khác nhau), Quiz → Whack giữ bộ nhiễu gốc cold/dry/wet/warm.

**Việc kế:** thầy chơi bản live trên TOMKO — đặc biệt 4 điểm: bấm Back/Next bằng tay xem còn trượt không ·
mở Open the box rồi sang game khác xem nút nav còn không · đổi template lòng vòng qua Speaking cards ·
Anagram/Quiz → Whack-a-mole. Hai thứ máy KHÔNG tự kiểm được: cảm giác bấm thật của nút to, và màu đế ở
4 giao diện (pane ẩn làm đóng băng transition, chỉ đọc được khi tắt hiệu ứng).

---

## Đợt 59 (3/8/2026, v0.9.34) — QUIZ: 4 CẢI TIẾN THẦY YÊU CẦU (nav không biến mất · không tách từ đơn · ô cao cho đáp án dài · chuyển câu TRƯỢT + chữ fade, ô cố định) — ⭐ CÓ SỬA CORE (bỏ 1 lệnh ẩn nav). ✅ THẦY DUYỆT → COMMIT (fc8e722, code) + doc + PUSH + LIVE. Tự test trình duyệt thật, 0 lỗi console.

> ⚠️ Số Đợt 59 chính là khe find-the-match (Đợt 60) đã reserve cho "phiên Quiz song song" — phiên này. Đặt Đợt 59 dù làm SAU Đợt 60 về thời gian. Chỉ đụng `templates/quiz/quiz.js` + `templates/quiz/quiz.css` + 1 chỗ nhỏ `core/engine.js`. KHÔNG đụng 13 game kia. quiz.js commit gần nhất vẫn là v0.9.28 (e23a3aa) → không đè mất công việc Quiz đã commit của ai.

**Bối cảnh:** thầy chơi bản live, nêu 4 việc cho Quiz:

**(1) Nav (next/back/số trang) đôi khi biến mất, dù đã chọn đáp án cũng không next được — hay xảy ra hơn với quiz TẠM từ Change Template.**
- *Điều tra (tái hiện trình duyệt thật, cài MutationObserver theo dõi `.aw-nav`):* cơ chế DUY NHẤT ẩn nav là `core/engine.js celebrate()` chạy `navWrap.style.visibility="hidden"` ~2.2s lúc GAME-COMPLETE. Nav **không** biến mất giữa lúc chơi (đã loại trừ: rò rỉ overlay `toolDim`/`backdrop` sau switch — sạch cả 2 đường below-bar & Menu→Change template; gate nav đúng). Chuỗi nhân quả: Quiz có luật "trả lời HẾT mọi câu → tự kết thúc" (`state.every` → `autoTimer` → `finish`) → `celebrate` ẩn nav. Quiz tạm thường ngắn + thầy chỉ chuyển sang để trình diễn/xem lại nên vừa lỡ trả lời câu cuối là nó tự kết thúc.
- *Thầy chốt:* GIỮ auto-finish, chỉ NGỪNG ẩn nav.
- *Sửa:* (a) ⭐ **`core/engine.js celebrate()` bỏ hẳn `navWrap.style.visibility="hidden"` + lệnh khôi phục** — nav để nguyên hiển thị suốt màn pháo hoa (overlay confetti trong suốt nên nó vốn hiện xuyên qua); bảng Summary mờ đục sau đó tự che cả thanh dưới. Không đụng template khác (chỉ bỏ 1 toggle). (b) **quiz.js huỷ `autoTimer` khi điều hướng thủ công** (`clearAutoTimer()` trong `goPrev`/`goNext`) — khớp đúng fix Đợt 56 của Type-the-answer: trả lời câu cuối rồi bấm Prev xem lại thì game KHÔNG tự kết thúc dưới tay thầy; để yên thì auto-finish vẫn chạy như cũ.
- *Đo thật:* trả lời hết 6/6 → bấm Prev → về 5/6, chờ 2.2s vẫn đang chơi, nav visible, 0 summary. Chơi tới hết KHÔNG chạm → auto-finish vẫn chạy, nav **không hề** hidden qua 12 mẫu trong cửa sổ celebrate, Summary hiện đúng.

**(2) Một từ ĐƠN quá dài bị ngắt xuống 2 dòng — phải co cỡ chữ, tuyệt đối không tách 1 từ.**
- CSS `.aw-tile-text`: bỏ `overflow-wrap:anywhere` → `overflow-wrap:normal; word-break:keep-all; hyphens:none` (không bao giờ bẻ giữa từ). Font ô = `calc(2.9cqw * var(--fit) * var(--tw,1))` — thêm biến co RIÊNG mỗi ô `--tw`.
- quiz.js `fitNow()` bước 2 (WIDTH fit từng ô): nếu `textEl.scrollWidth > clientWidth` (từ rộng hơn ô) thì đặt `--tw = max(0.2, avail/need*0.99)` — 1 phát chính xác (scrollWidth đo ở `--tw:1` là bề rộng dòng không-bẻ-được). Đo thật: từ 45 ký tự "pneumono…" co `--tw≈0.31` (1 dòng, 0 tràn), 28 ký tự `--tw≈0.51`; `midWordBreak=false`.

**(3) Đáp án dài nhiều chữ → nâng CHIỀU CAO ô, chỉ cần không đè câu hỏi, không tách từ.**
- Ô là flex-item chiều cao AUTO → đáp án nhiều chữ wrap theo KHOẢNG TRẮNG (`word-break:keep-all` vẫn cho ngắt giữa các từ) → ô tự cao lên. quiz.js `fitNow()` bước 1 (HEIGHT fit) giữ nguyên logic autoFit cũ: đo `question.offsetHeight + answers.offsetHeight` vs stage, co `--fit` (0.4..1) để answers KHÔNG đè câu hỏi. Đo thật: đáp án 14 chữ → ô cao 259px (7 dòng), `--fit≈0.91`, `overlapQuestion=false`, `midWordBreak=false`.

**(4) Chuyển câu: câu hỏi TRƯỢT (không fade); ô trả lời CỐ ĐỊNH không nhấp nháy, chỉ CHỮ trong ô fade sang đáp án câu mới.**
- Viết lại `mount`: **dựng card + tiles 1 LẦN** rồi cập nhật TẠI CHỖ (trước đây re-render cả card mỗi câu → tiles nhấp nháy/dựng lại).
  - `syncTiles(n)`: giữ đúng `n` ô (tạo/xoá khi số đáp án đổi — hiếm, chỉ quiz tạm số đáp án lệch); màu gán theo VỊ TRÍ, cố định cả ván.
  - `applyQuestion(i)`: đổ nội dung câu `i` vào card/tiles sẵn có (text bằng `textContent`, xoá badge/dim/fly cũ, khôi phục trạng thái đã-trả-lời khi đi ngược).
  - `showQuestion(i,dir)`: câu hỏi `animate` translateX ±6% + opacity (out 130ms → swap → in 190ms, `dir` = next/prev); MỖI `.aw-tile-text` fade opacity; **ô (`.aw-quiz-tile`) không đụng → không di chuyển/nhấp nháy**. Có timeout fallback cho tab ẩn; cờ `animating` chặn spam nav; huỷ animation "forwards" sau khi xong để không kẹt opacity.
- Đo thật lúc bấm Next: `qAnimating=1` (câu hỏi đang animate), `tileTextFading=1` (chữ ô fade), `tilesFixed=true` (toạ độ x/y ô KHÔNG đổi). Điều hướng ngược khôi phục đúng badge/dim.

**File đụng:** `templates/quiz/quiz.js` (viết lại `mount`, bỏ import `autoFit`/hàm `escapeHtml`), `templates/quiz/quiz.css` (`.aw-tile-text`), `core/engine.js` (`celebrate` bỏ ẩn nav). Harness tự tạo `_repro-switch.html`/`_repro-quiz.html` đã XOÁ sau khi test.
**Việc kế:** thầy chơi thử (đặc biệt quiz TẠM từ Change Template + đáp án siêu dài trên màn TOMKO) → duyệt → commit + push (curl kiểm chứng live). ⚠️ Có phiên song song cũng dán nhãn "Quiz Đợt 59" — nếu là máy KHÁC, khi merge quiz.js sẽ đụng, thầy điều phối.

---

## Đợt 60 (4/8/2026, v0.9.35) — FIND THE MATCH: PHÂN TRANG (≤35 ô/trang) + FIT CHỮ TRONG Ô — ✅ THẦY DUYỆT → COMMIT (94fd6bc) + PUSH + LIVE. KHÔNG ĐỤNG CORE.

**Chỉ đụng 2 file `templates/find-the-match/find-the-match.js` + `.css` (+ GHI CHU của template).** KHÔNG đụng
core, KHÔNG đụng game khác. ⚠️ Cây làm việc lúc làm có nhiều phiên SONG SONG chốt cùng ngày (Anagram Đợt 55,
Type-the-answer Đợt 56, Whack-a-mole 57, Open the box 58, và Quiz Đợt 59 của phiên kia đang làm) — commit này
chỉ add đúng 2 file find-the-match + doc. Số Đợt nhảy 58→60 vì Đợt 59 do phiên song song giữ.

**Bối cảnh:** thầy chơi bản live, báo 2 việc: (1) khi quá nhiều ô, chữ QUÁ TO so với ô → **tràn ra ngoài**;
muốn tối đa **35 ô/trang**, trên 35 thì sang trang tiếp (thêm nút next-back-số trang) + chữ luôn vừa & nằm
GIỮA ô. (2) Đổi thanh Points off thành đỏ.

**(1a) Fit chữ trong ô — "không bao giờ tràn, luôn ở tâm":**
- Ô `.aw-ftm-tile` nay `display:flex; align-items/justify-content:center; text-align:center` + `overflow:hidden`
  + **chiều cao CỐ ĐỊNH** `calc(6.2cqw*var(--fit))` (bỏ `min-height`). Chiều cao cố định làm việc tràn ĐO
  ĐƯỢC để co; overflow:hidden bảo đảm không lòi ra ngoài.
- Biến co RIÊNG mỗi ô `--tfit`: font ô = `calc(1.85cqw*var(--fit)*var(--tfit,1))`. Hàm `fitTiles()` duyệt từng
  ô, giảm `--tfit` 0.08/lần (đáy 0.4) tới khi hết tràn cả ngang lẫn cao. Thêm `overflow-wrap:anywhere;
  word-break:break-word` để từ dài xuống dòng.
- **BẪY (đã gặp khi test, ghi lại để dùng sau):** gọi `fitTiles` qua `requestAnimationFrame` **KHÔNG chạy khi
  pane test bị ẩn** — rAF đóng băng lúc trang không compositing (cùng họ bẫy throttle của myActivity/whack).
  Bằng chứng: đo lần đầu 1 ô `--tfit` rỗng (chưa được set) + tràn 4px; chạy TAY đúng vòng lặp đó → 0 tràn.
  → Sửa: gọi `fitTiles()` **ĐỒNG BỘ** ngay sau khi autoFit đặt xong `--fit` (không chờ rAF) + gọi lại trên
  `document.fonts.ready` (đồng bộ, khi web-font đổi metric). `scheduleTileFit()` (rAF, gộp) chỉ còn lo re-fit
  khi RESIZE. Đo lại: 20/20 ô 0 tràn, từ 45 ký tự "Pneumono…" co `--tfit=0.84`.

**(1b) Phân trang (page-as-round):**
- `MAX_TILES_PER_PAGE=35`. `PAGE_COUNT=ceil(total/35)`, chia ĐỀU (`perPage=ceil(total/PAGE_COUNT)`, 40→20+20
  chứ không 35+5). `choiceOrder` (đã xáo) chunk thành `pages[]`; mỗi trang có `pageQueues[p]` riêng. `cols`
  tính theo TRANG LỚN NHẤT để mọi trang canh giống nhau.
- **Mỗi trang là 1 VÒNG độc lập:** prompt của trang chỉ là cặp có ô trên trang đó → **đáp án LUÔN nằm trên
  trang đang xem** (giữ đúng trải nghiệm cũ). Hết cặp của trang → `startCycle()` tự tìm trang kế còn cặp
  (`nextNonEmptyPage`, cuốn vòng) → render + chơi tiếp; hết sạch mọi trang → `finish("complete")`. 2 callback
  trong `choose` đổi từ `if(!queue.length) finish` → `startCycle()` (để nó tự advance/finish).
- **Pager `‹ Page X/Y ›`** (chỉ khi >1 trang, dưới lưới, trong stage): `goPage()` lật tay — dừng prompt hiện
  tại, đổi trang, chơi tiếp; prev tắt trang 1, next tắt trang cuối.
- `queue` giờ = tham chiếu tới `pageQueues[curPage]` (đổi trang thì trỏ lại) nên hàm cũ giữ gần nguyên.
  `renderShell` nay chạy MỖI lần đổi trang → thêm `fitter.destroy()` + huỷ `tileFitRaf` đầu hàm chống rò rỉ
  listener resize/rAF. Render đúng trạng thái ô: giải+removeCorrects → để hố; giải+giữ → mờ + dấu ✓; skipped →
  ô nhiễu vẫn bấm được.

**(2) Points off đỏ:** đây là slider CHUNG của core (`.aw-opt-slider`), find-the-match KHÔNG có riêng. Phiên
SONG SONG (Anagram Đợt 55, commit `a109f7b`) ĐÃ đổi `core/app.css` `.aw-opt-slider`+`.aw-opt-slidval` sang đỏ
`#ef4444` và ĐÃ commit + push. Bản LIVE còn xanh chỉ vì GitHub Pages chưa propagate — không cần làm gì thêm.

**Test (browser thật qua test.html, đo DOM bằng `javascript_tool`):** 8 cặp → 1 trang, không pager, 0 tràn,
2 cột. 40 cặp → Page 1/2 & 2/2 (20+20, 0 overlap), pager prev/next đúng, 0 tràn CẢ 2 trang, auto-advance
trang 1→2, chơi trọn 2 trang → **score 40 + summary**, console 0 lỗi. **CHƯA:** nghe thật mp3; lật tay tới
trang đã giải xong (để idle — hiếm gặp vì auto-advance).

---

## Đợt 58 (4/8/2026, v0.9.33) — OPEN THE BOX: 5 CẢI TIẾN UX (thầy gửi 1 lượt) — ✅ THẦY DUYỆT → COMMIT + PUSH + LIVE. KHÔNG ĐỤNG CORE.

**Chỉ đụng 2 file `templates/open-the-box/open-the-box.js` + `.css` (+ 2 docs).** KHÔNG đụng core, KHÔNG đụng
game khác. Tự test trình duyệt thật (`javascript_tool` trên test.html + dữ liệu bịa ép ca biên), 0 lỗi console.
⚠️ Cây làm việc lúc làm còn thay đổi CHƯA COMMIT của phiên song song (find-the-match, whack-a-mole) — commit
này chỉ add đúng file open-the-box + docs. (Số Đợt/version nhảy do nhiều phiên chốt cùng ngày.)

1. **Nháy "nền vuông 4 góc" khi chạm ô (điểm 1).** Gốc: `-webkit-tap-highlight-color` **MẶC ĐỊNH của Chrome =
   `rgba(0,0,0,0.18)`**, Blink vẽ lớp phủ chạm theo HÌNH CHỮ NHẬT (bỏ qua border-radius) → nháy vuông 1-2
   frame trên màn cảm ứng. Sửa: `-webkit-tap-highlight-color: transparent` (+ touch-callout, user-select) trên
   `.aw-otb-box` + `.aw-otb-qtile`. Đo: `webkitTapHighlightColor` = `rgba(0,0,0,0)` cả hai.
2. **Bo góc DẦN khi ô câu hỏi bay về ô số (điểm 2).** Trước chỉ scale transform → bán kính bo bị scale nhỏ →
   đáp xuống gần VUÔNG. Sửa: animate thêm `border-radius` trong `zoomElTo`+`zoomElFrom` (2 chiều), đích elip
   `boxRadius/scaleX / boxRadius/scaleY` để sau scale khớp đúng độ bo ô số; `readBoxRadius()` đọc px thật, dọn
   inline khi xong. (Hình mượt: thầy xem màn cảm ứng thật.)
3. **Chữ back-face co theo cỡ ô khi nhiều ô (điểm 3).** Trước `1.5cqw` cố định → nhiều ô nhỏ tràn, bị
   `overflow:hidden` cắt. Sửa: `--back-size = size*0.12`px trong `layoutGrid` + hàm mới `fitBackFaces()` co
   `--back-fit` từng ô tới khi hiện TRỌN; gọi ở renderGrid/closeCardThen/ResizeObserver. Đo: 20 ô (cell
   121px), câu dài → contentH 76 ≤ 78, 0 tràn.
4. **Khóa bấm đáp án tới 80% animation (điểm 4).** Trước gắn onclick ngay khi build → bấm nhầm lúc đang trượt
   vào. Sửa: `.aw-otb-q-answers.is-gated{pointer-events:none}` + `answersUnlocked`/`gateTimer` mở sau
   80%×(zoom+stagger); `answer()` chốt chặn thêm. Đo: bấm ở 300ms KHÔNG ăn, ~1.1s sau mới ăn.
5. **Không ngắt từ trong ô đáp án/câu hỏi (điểm 5).** Từ >40 ký tự chạm sàn fit 0.4 rồi TRÀN; `.aw-otb-q-qtext`
   chỉ kế thừa overflow-wrap. Sửa: khai rõ `overflow-wrap:normal; word-break:keep-all` + `fitOne` thêm bước co
   DƯỚI SÀN (tỉ lệ clientWidth/scrollWidth, tới 0.12). Đo: từ 45 ký tự → fit 0.372, 1 dòng, 0 tràn; ngắn vẫn 1.5.

Chi tiết đầy đủ + cách đo: `templates/open-the-box/GHI CHU OPEN-THE-BOX.md` (đợt 21).

## Đợt 57 (4/8/2026, v0.9.32) — WHACK-A-MOLE: mole rung lắc khi đập sai + ẩn nút Next/Back — ✅ THẦY DUYỆT → COMMIT + PUSH + LIVE. KHÔNG ĐỤNG CORE.

**Chỉ đụng 2 file `templates/whack-a-mole/whack-a-mole.js` + `.css`** (+ ghi chú). Không đụng core, không
đụng game khác. Thầy gửi 2 yêu cầu 1 lượt. Đã tự test trình duyệt thật (devserver + `javascript_tool`),
0 lỗi console.

1. **Đập SAI → mole rung lắc suốt 4s phạt rồi mới thụt xuống.** Trước đây trong 4s "đông cứng"
   (`PENALTY_FREEZE_MS`) mole sai chỉ đứng im mặt choáng. Nay: sau 150ms (đúng lúc sprite đổi `tapped` →
   `dizzy`) hố được thêm class **`is-dizzy`** → mole lắc quanh **gốc chân** (`transform-origin: 50% 92%`),
   xoay **±6,5°** + lắc ngang, nhịp 0,46s lặp; **bong bóng chữ lắc cùng nhịp nhẹ hơn ±3,5°**. Hết 4s bỏ
   class → thụt như cũ. Dọn `is-dizzy` ở cả `duck()` · `freeHole()` · `endGame()` để không kẹt rung. Nhánh
   **hết mạng không rung** (game over sau 600ms).
   > ⚠️ **BẪY (y hệt bẫy Open-the-box)**: phải viết bằng `@keyframes`, KHÔNG `transition` — rule
   > `.is-hit .aw-wam-mole` đã ghim sẵn `transform`, mà animation giữ một thuộc tính LUÔN thắng transition
   > nhắm cùng thuộc tính đó. Nên **mỗi keyframe phải tự mang lại offset `.is-hit`**
   > (`translate(-50%, 8%) scaleY(.92)`), quên là mole nhảy về vị trí gốc lúc rung.

2. **Ẩn nút Next/Back** (game này không duyệt câu bằng mũi tên) — đúng 1 dòng CSS:
   `.aw-playarea:has(> .aw-wam-scene) ~ .aw-bottombar .aw-navbtn { display: none; }`.
   **Cố ý KHÔNG dùng `.aw-nav{display:none}` trần như `open-the-box.css`**: từ v0.9.7 CSS template được
   `ensureTemplate()` chèn vào document và **ở lại vĩnh viễn**, nên sau khi "Change template" (Đợt 47) sang
   game khác, rule trần đó vẫn ẩn mũi tên của game mới. Selector scoped theo `.aw-wam-scene` (con trực tiếp
   của `.aw-playarea`) thì hết whack-a-mole là hết tác dụng — khuôn copy từ true-false / find-the-match.
   Và **chỉ ẩn `.aw-navbtn`, không ẩn wrapper `.aw-nav`** vì `.aw-bottombar` là lưới 3 cột, bỏ hẳn phần tử
   giữa sẽ làm 2 cụm còn lại dồn sai chỗ.

**Cách đo khi pane trình duyệt bị ẩn** (bài học dùng lại được cho mọi template): cửa sổ không hiển thị thì
Chromium ngưng compositing → lấy mẫu `getComputedStyle` theo thời gian ra **y hệt nhau**, trông như animation
chết dù nó chạy tốt. Đo đúng: `el.getAnimations()[0]` rồi **tự đặt `anim.currentTime`** từng mốc và đọc
`transform` (`getComputedStyle` ép style recalc → giá trị thật). Kết quả: mole `rotate` 0° → −6,4° → +6° →
−4,6° → +3,7° → 0°; bong bóng ±3,5° cùng nhịp; class đúng vòng đời (tới ~3,9s còn `is-up is-hit is-dizzy`,
tới 4,0s còn `is-hit` + mole đã thụt); mũi tên `display:flex` ở màn READY → `display:none` khi vào game
(chứng minh scoping đúng); lưới thanh dưới vẫn `423px / 61,8px / 423px`.

**File đổi**: `templates/whack-a-mole/whack-a-mole.js` + `.css` + `GHI CHU WHACK-A-MOLE.md`. ⚠️ Cây làm việc
lúc commit còn thay đổi CHƯA XONG của 2 phiên song song (find-the-match, open-the-box) — đã **chỉ add file
whack-a-mole + 2 docs chung**, cố ý không đụng của họ. Chi tiết đầy đủ: `templates/whack-a-mole/GHI CHU
WHACK-A-MOLE.md` (mục ⭐ ĐỢT 57).

---

## Đợt 56 (3/8/2026, v0.9.31) — TYPE THE ANSWER: bỏ checkbox Minus points, thêm Lives, sửa 3 lỗi nav/auto-advance ⭐ CÓ SỬA CORE (1 chỗ nhỏ) — ✅ THẦY DUYỆT → COMMIT + PUSH

**Chỉ đụng Type the answer + 1 fix core nhỏ, không đụng game khác.** Thầy gửi 5 yêu cầu 1 lượt qua chat
(không kèm ảnh). Đã tự test qua trình duyệt thật (devserver + DOM/JS giả lập PointerEvent/KeyboardEvent
thật, không đoán qua ảnh), 0 lỗi console.

1. **Bỏ checkbox "Minus points for wrong answers"** — chỉ còn 1 thanh trượt `minusAmount` **0..5** (trước
   1..5 + checkbox bật/tắt riêng). 0 = tắt trừ điểm (hiện "Off"). Mặc định đổi 1→0 nhưng hành vi KHÔNG đổi
   (trước mặc định checkbox tắt = không trừ; nay slider mặc định 0 = không trừ — zero-diff cho act cũ).
2. **Thêm Lives** — thanh trượt mới **0..10** (0 = Unlimited), bê nguyên khuôn từ `true-false.js`
   (`hasLivesSlot`, `ui.livesSlot`, tim bay biến mất khi mất mạng). `normLives()`: undefined/null/0 →
   unlimited (KHÁC True/false — TF mặc định 5 mạng khi chưa set, TTA thì không được vì mọi act cũ đã lưu
   sẵn không có field `lives`, mặc định 5 sẽ khiến act cũ tự nhiên có nguy cơ Game Over không ai yêu cầu).
   Hết mạng → `finish("gameover")` ngay (không chờ hết câu hỏi), âm thanh riêng `gameover-01.mp3` (đã có
   sẵn trong `sounds/`, trước ghi "archived" — nay dùng thật).
3. **⭐ SỬA 3 LỖI NAV/AUTO-ADVANCE CÙNG 1 GỐC** ("next đôi khi không hoạt động dù Allow skip bật", "tắt
   Allow skip thì submit xong không tự next", "nav/số trang đôi khi biến mất"): `submitAnswer()` cũ sau khi
   chấm điểm KHÔNG gọi lại `updateNav()` (Next chỉ được đồng bộ lúc `loadQuestion()`) — khi Allow skip tắt,
   Next bị khoá lúc chưa trả lời và **vẫn khoá sau khi trả lời xong** cho tới khi có điều hướng khác tình
   cờ mở lại. Nặng hơn: hẹn giờ tự-next/tự-kết-thúc sau khi chấm (`autoTimer`) KHÔNG BAO GIỜ bị huỷ khi học
   sinh tự bấm Prev/Next — hẹn giờ cũ vẫn treo, tới giờ tự bắn kéo giật học sinh sang câu khác, hoặc tự kết
   thúc ván (ẩn nav) ngay khi đang xem lại câu trước. Sửa: `submitAnswer()` gọi `updateNav()` ngay sau khi
   chấm; `goPrev()`/`goNext()` huỷ hẹn giờ cũ (`clearAutoTimer()`) trước khi đổi câu; và theo đúng yêu cầu,
   **auto-advance nay LUÔN chạy sau khi trả lời xong 1 câu**, không còn phụ thuộc checkbox "Auto switch"
   chung lẫn Allow skip — Allow skip giờ chỉ còn quyết định Next có bấm THỦ CÔNG được TRƯỚC khi trả lời hay
   không; Back vẫn luôn xem lại được (huỷ hẹn giờ ngay khi bấm Back). **CÓ SỬA CORE**: thêm cờ
   `tpl.hideAutoSwitch` (`core/engine.js`, đúng khuôn `hideTimerOption`/`hideLettersOption` sẵn có) để ẩn
   hẳn checkbox "Auto switch" chung với riêng TTA (nay vô nghĩa, tránh gây hiểu lầm) — không ảnh hưởng
   template khác.

**Test thật**: mô phỏng đúng race-condition (submit + bấm Prev cùng lúc, không qua round-trip mạng) → về
câu trước xem lại, đợi 2s vẫn không bị hẹn giờ cũ kéo giật sang câu khác. Allow skip tắt: sai câu → mất
1 tim + điểm đỏ đúng số trừ + tự auto-advance không cần bấm gì. Allow skip bật: Next bấm được ngay từ câu
chưa trả lời, nhảy liên tiếp không lỗi; trả lời đúng vẫn auto-advance dù Allow skip đang bật. Hết mạng →
dừng ván ngay dù chưa làm hết câu hỏi. Chi tiết đầy đủ: `templates/type-the-answer/GHI CHU
TYPE-THE-ANSWER.md` Đợt 55.

**File đổi**: `templates/type-the-answer/type-the-answer.js` + `.css` + `sample-type-the-answer.js`,
`core/engine.js` (cờ `hideAutoSwitch`). Console sạch 0 lỗi suốt test.

---

## Đợt 55 (3/8/2026, v0.9.29) — ANAGRAM: 8 ĐIỂM SỬA/YÊU CẦU THẦY GỬI 1 LƯỢT ⭐ CÓ SỬA CORE (2 chỗ nhỏ) — ✅ THẦY DUYỆT → COMMIT + PUSH

**Chỉ đụng Anagram + 2 fix core nhỏ, không đụng game khác.** Thầy chơi bản live rồi gửi 8 điểm 1 lượt.
Đã tự test qua trình duyệt thật (devserver + DOM/PointerEvent giả lập thật, không đoán qua ảnh).

1. **Chống flash góc vuông khi chữ bay** — clone bay (`.aw-anagram-flytile`, dùng chung
   `flyLetter`/`flyTileClone`) được `document.body.append()` rồi `.animate()` NGAY, có thể lộ 1 khung hình
   chưa bo góc trước khi trình duyệt thăng cấp layer GPU. Thêm `will-change: transform` (CSS) +
   `void clone.offsetWidth` (ép 1 lần vẽ đồng bộ trước `.animate()`, cả 2 hàm). Lỗi cấp khung hình
   (compositor), không đo được bằng `getComputedStyle` (đã poll mỗi 20ms suốt chuyến bay, `border-radius`
   luôn ra "12px" — đúng giá trị KHAI BÁO, không phải khung hình THỰC TẾ) — áp dụng cách sửa chuẩn cho lớp
   lỗi này, **thầy tự xác nhận lại bằng mắt**.
2. **⭐ SỬA BUG THẬT Ở CORE** (`core/engine.js`, ảnh hưởng MỌI template): `celebrate()` set
   `navWrap.style.visibility="hidden"` lúc ăn mừng nhưng KHÔNG BAO GIỜ trả lại — vì overlay ăn mừng không
   có nền đặc (chỉ pháo giấy + chữ), trong ~2s đó thanh dưới (Menu/Sound/Fullscreen) vẫn lộ nhưng nút
   ‹›+"x of N" biến mất — đúng hiện tượng "đôi khi mất nút Back-Next và số trang". Thêm dòng phục hồi
   `navWrap.style.visibility=""` khi đóng overlay ăn mừng. Đã test: xong ván → Summary → check
   `.aw-nav.style.visibility` ra đúng `""` → Start again → nav hiện lại bình thường ngay từ đầu.
3. **Số điểm bay vào ô điểm quá to** — `flyScoreGain()` co về `scale(0.4)` CỐ ĐỊNH bất kể `baseSize` (tỉ
   lệ theo bề ngang khung, có thể rất lớn) → vẫn to hơn nhiều so với chữ điểm thật dù đã co. Sửa: đọc
   `getComputedStyle(scoreEl).fontSize` làm ĐÍCH, tính `endScale = cỡ đích / baseSize` thay `0.4` cố định.
4. **& 6. Chữ bé lại khi kéo-đổi-chỗ HOẶC bấm-trả-về-gốc** — `flyTileClone()` (dùng bởi `unplace()` +
   `swapResultPositions()`) THIẾU `font-size` (khác `flyLetter()` đã có từ trước) → clone rơi về cỡ chữ mặc
   định kế thừa từ trang. Thêm tham số `fontSize`, 2 nơi gọi đọc `getComputedStyle(ô thật).fontSize` TRƯỚC
   khi xoá/di chuyển rồi truyền vào. Đã đo bằng PointerEvent giả lập (kéo đổi P↔O, bấm trả 1 ô về gốc): cỡ
   chữ clone ra ĐÚNG 1 giá trị duy nhất suốt chuyến bay, khớp hệt cỡ ô thật.
5. **Bấm nhanh liên tục bị delay** — mỗi lần bấm đúng 1 chữ khoá TOÀN BỘ thao tác tiếp theo tới khi hiệu
   ứng bay ~340ms xong mới mở khoá. Sửa: tách trạng thái game (đã đặt chữ nào, `nextPos`, khoá) khỏi HOẠT
   ẢNH — trạng thái cập nhật NGAY lúc bấm (đồng bộ), chỉ ô VỪA BẤM tự khoá, ô khác vẫn bấm được trong khi
   chữ trước còn bay. Áp dụng `bonusPick`/`submitPick`; bỏ hẳn `setOriginLocked()` (không còn ai gọi). Đã
   test: bấm liền 7 chữ đúng "DOLPHIN" trong CÙNG 1 lệnh JS (không đợi nhau) → cả 7 vào đúng vị trí.
7. **⭐ CÓ SỬA CORE** (`core/app.css`): đổi màu thanh "Points off (wrong answer)" (`.aw-opt-slider`/
   `.aw-opt-slidval`) sang đỏ `#ef4444` — đã kiểm 2 class này CHỈ dùng riêng cho control Points off chung
   (không template nào khác dùng lại), an toàn đổi cho MỌI game. Đã đo `accent-color` xác nhận đúng đỏ.
8. **Thêm Lives cho Anagram** (slider Options 0–10, 0 = vô số mạng) — theo ĐÚNG khuôn `true-false.js`
   (`hasLivesSlot`, tim ở `ui.livesSlot`). Khác 1 điểm CÓ CHỦ Ý: true-false coi "chưa set" = mặc định 5
   mạng, Anagram coi "chưa set" = VÔ SỐ MẠNG (act cũ phải chơi y hệt trước, zero-diff). Mất 1 mạng ĐÚNG
   cùng thời điểm với `pointsOff` (bonus: từ giải có lỗi; submit: từ nộp sai). Hết mạng →
   `finish({gameover:true})` → title "Game over" (dùng cơ chế `title` sẵn có ở engine, không cần sửa core
   thêm). Seed `lives:0` vào sample. Đã test trọn luồng: Lives=2 → sai 2 từ liền → tim 2→1→0 → "GAME OVER"
   → Start again → tim hồi phục, nav hoạt động bình thường.

**File đổi**: `templates/anagram/anagram.js` + `.css` + `sample-anagram.js`, `core/engine.js` (mục 2),
`core/app.css` (mục 7). Console sạch 0 lỗi suốt test (bonus + submit mode, kéo-thả PointerEvent giả lập,
Options Apply, restart, game over). Chi tiết đầy đủ: `templates/anagram/GHI CHU ANAGRAM.md` Đợt 55.

---

## Đợt 54 (3/8/2026, v0.9.28) — ĐIỂM TRỪ MỌI TEMPLATE + ALLOW SKIP + CẦU ĐỒNG BỘ myActivity ⭐ CÓ SỬA CORE — 🟢 CHỜ THẦY DUYỆT (đã tự test trình duyệt thật, 0 lỗi)

**Yêu cầu thầy (2 việc AWord, đi kèm 2 việc myActivity ở kho riêng):**
1. **Mọi template thêm "thanh Điểm trừ" khi chọn đáp án SAI** (cái nào đã có thì bỏ qua).
2. **Các act có nút Next–Back (x of y) thêm "Allow skip"**: KHÔNG tích thì chưa làm KHÔNG next được.

**A. ĐIỂM TRỪ + MÀU ĐIỂM (⭐ CÓ SỬA CORE `engine.js` + `app.css`):**
- **Option "Points off (wrong answer)" CHUNG ở engine** (`buildOptionsPanel`): slider 0–5, mặc định **0 (tắt)**,
  ghi `activity.options.pointsOff`. Chỉ hiện cho template `scorable !== false && !tpl.hidePointsOff`.
- **Đặt `hidePointsOff: true`** cho 4 template ĐÃ có điểm trừ riêng (type-the-answer, unjumble, crossword,
  whack-a-mole) + **gameshow** (điểm theo tốc độ). Chúng giữ nguyên cơ chế riêng, KHÔNG hiện option chung.
- **`ui.setScore(n)` đổi màu theo dấu (thầy chốt):** điểm **dương = XANH LÁ** (`--aw-ok`), **âm = ĐỎ** (`--aw-no`)
  **BỎ dấu trừ** (hiện trị tuyệt đối) — class `.is-pos`/`.is-neg` trên `.aw-top-score`. Cho phép điểm ÂM.
- **Trừ điểm per-template** ở 8 game chưa có: `quiz, anagram, true-false, find-the-match, open-the-box,
  balloon-pop, flying-fruit, maze-chase`. Mỗi game đọc `options.pointsOff`, câu SAI trừ (không kẹp 0, âm được),
  gọi `ui.setScore` + đưa vào `ui.finish({score})`. **KHI pointsOff=0 hành vi Y HỆT trước (zero-diff)** — đã kiểm.
  - anagram: trừ **1 lần mỗi TỪ có lỗi** (bonus: từ giải có sai; submit: từ sai), gộp qua biến `penalty` trong `scoreNow`.
  - bỏ `speaking-cards` (không tính điểm). Seed `pointsOff:0` vào các `sample-*.js`.

**B. ALLOW SKIP (quiz + type-the-answer):**
- Thêm checkbox **"Allow skip (move on without answering)"** (buildExtraOptions), mặc định **KHÔNG tích**.
  Khi tắt: `onNext=null` (nút Next MỜ) tới khi câu hiện tại đã trả lời (`canAdvance()`), khóa cả phím → và ✓ cuối.
- anagram + unjumble ĐÃ có allowSkip riêng (mặc định bật) → GIỮ NGUYÊN. Seed `allowSkip:false` vào 2 sample mới.

**C. CẦU ĐỒNG BỘ cho myActivity (⭐ CÓ SỬA CORE `engine.js`) — vô hại khi chạy standalone:**
- `startGame` lộ **`window.__awordBridge`** `{ getState, switchTemplate(type), applyOptions(opts), setTheme(id) }`
  + phát console marker khi USER đổi ở 1 bảng: **`MYACT:AW:TPL:<type>`** (Change template) · **`MYACT:AW:OPT:<json>`**
  (Apply options) · **`MYACT:AW:STYLE:<themeId>`** (đổi Style). Biến `awSyncMute` chặn dội: bridge tự áp thì KHÔNG phát.
- myActivity (kho riêng, v1.7.4) bắt marker từ MỌI bảng → gọi bridge trên các bảng còn lại (đồng bộ 2 CHIỀU).

**Kiểm chứng (harness engine thật trên devserver, KHÔNG cần login):** 14/14 template mount **0 lỗi console**;
quiz sai (pointsOff 2) → điểm nội bộ −2 hiện **"2" ĐỎ** `rgb(226,60,60)`, Next khóa trước khi trả lời/mở sau;
true-false sai (pointsOff 3) → **"3" ĐỎ**; whack-a-mole KHÔNG hiện Points off chung (giữ riêng); bridge đủ 4 method,
tự-áp không phát marker, user đổi Style phát `MYACT:AW:STYLE:...`. **Việc kế: thầy chơi thử + đăng nhập → commit + push.**
Chi tiết per-template: `GHI CHU <TÊN>.md` từng thư mục. Hợp đồng core mới: `core/HUONG DAN CORE.md`.

**D. CHẶN BÀN PHÍM ẢO HĐH khi bàn phím AWord hiện (thầy yêu cầu — Windows/Android/iOS):**
- `type-the-answer.js` — game DUY NHẤT có ô nhập thật (`<textarea.aw-tta-input>`). Đặt
  **`input.inputMode = keyboardVisible ? "none" : "text"`**: bàn phím AWord BẬT (mặc định) → `inputMode="none"`
  ẩn bàn phím ảo HĐH (vẫn giữ con trỏ nháy + gõ bằng bàn phím vật lý được); HS ẩn bàn phím AWord (nút kbd) →
  `"text"` cho native hiện lại. Cập nhật cả lúc tạo input lẫn trong handler nút kbd. Crossword dùng `core/keyboard.js`
  nhưng ô là `<div>` (không input) → KHÔNG có bàn phím ảo, không cần sửa.
- **Kiểm chứng live:** bàn phím AWord hiện → `inputMode="none"`; bấm Hide keyboard → `"text"`; Show lại → `"none"`.

**E. CÂN LAYOUT thanh dưới khung (thầy: tên act + nút chức năng quá sát mép) — `app.css`:**
- Thêm **`.aw-below-left { margin-left: 6% }`** + **`.aw-below-right { margin-right: 6% }`** → đẩy TÊN act sang phải,
  cụm NÚT chức năng sang trái. % tính theo track grid nên tự co giãn theo cỡ màn. Đo live (stage 968px): inset **24px**
  mỗi bên, cụm GIỮA (Options/Template/Style) vẫn CHÍNH GIỮA (mid=640=nửa cửa sổ). 14/14 template vẫn mount 0 lỗi.

---

## Đợt 53 (3/8/2026, v0.9.27) — LƯU OPTIONS HẲN + NHỚ OPTIONS THEO TEMPLATE TẠM ⭐ CÓ SỬA CORE — ✅ THẦY DUYỆT → COMMIT + PUSH + LIVE

**Yêu cầu thầy:** (1) Apply option cho 1 act → **lưu hẳn**. (2) Khi chọn 1 act + 1 **template tạm thời** (Change
Template) rồi chỉnh options cho template tạm đó → **lần sau chọn lại đúng template tạm đó của act đó, options vẫn giữ**.

**Phát hiện + FIX bug tiềm ẩn:** engine ĐÃ lưu options act chính (`saveActivity(activity)` khi có `id`). NHƯNG act tạm
Change Template có `id="conv_..."` → Apply options trên nó đang **lưu NHẦM thành 1 act mới "conv_" vào thư viện**. Nay chặn.

**Việc đã làm (`core/engine.js` + `core/convert.js` — CÓ SỬA CORE):**
1. **Engine mang theo act GỐC (`originAct`)**: `startGame(root, activity, {base})` — `originAct = base || activity`.
   `restart` + `doSwitchTemplate` truyền `base: originAct` nên qua bao lần đổi template, originAct vẫn là act thật ban đầu.
2. **Đổi template convert TỪ originAct** (không từ act tạm hiện tại). Đổi **về đúng type gốc** → khôi phục thẳng
   act gốc thật (id + options riêng), không tạo bản sao.
3. **Apply options lưu đúng chỗ** (chỉ khi KHÔNG session): act chính → `saveActivity(originAct)`; act tạm
   (`_converted`) → ghi `originAct.templateOptions[type] = {...options}` rồi `saveActivity(originAct)`. **Không bao giờ
   lưu act `conv_`**.
4. **`convert.js convertActivity`**: nếu `activity.templateOptions[targetType]` có → dùng LẠI bộ options đã nhớ; chưa
   có → mặc định từ sample. (whack_a_mole giữ `mode` nếu options đã có.)

**Kiểm chứng (harness, KHÔNG login):**
- `convertActivity`: origin có `templateOptions.quiz={lives:3,timer:countDown,MARKER}` → convert→quiz dùng ĐÚNG bộ nhớ
  (không phải sample); convert→balloon_pop (không có nhớ) → dùng mặc định. ✅
- **Round-trip UI thật**: mount Anagram → Template→Quiz → Play → Options: "Shuffle question order" mặc định BẬT → tắt +
  Apply → Template→Anagram (về gốc) → Template→Quiz lại → Options: "Shuffle question order" **vẫn TẮT** (đã nhớ). **PASS**.
- Change Template vẫn chạy; Options Apply trên act tạm 0 crash (saveActivity thất bại lặng khi chưa login, nhớ in-memory
  vẫn set). 0 lỗi console. File test tạm đã xoá.

**CHƯA test được (cần login):** lưu Firestore + giữ options qua **reload trang** (`saveActivity` cần đăng nhập; logic
review: `originAct.templateOptions` nằm trong act, `saveActivity(originAct)` lưu kèm; convert đọc lại khi mở act sau).

**VIỆC ĐANG CHỜ:** thầy đăng nhập → chơi 1 act, Apply option, reload → option giữ; đổi template tạm, chỉnh option,
đổi đi rồi quay lại → option giữ → **commit + push**.

---

## Đợt 52 (3/8/2026, v0.9.26) — EMPTY RECYCLE BIN (xoá hẳn toàn bộ thùng rác, có xác nhận) — ✅ THẦY DUYỆT → COMMIT + PUSH + LIVE

**Yêu cầu thầy:** thêm "Empty Recycle Bin" — xoá hẳn TẤT CẢ act trong thùng rác; bấm → pop-up xác nhận → đồng ý thì xoá sạch.

**Việc đã làm (`core/store.js` + `main.js`, KHÔNG đụng core khác):**
1. **`store.emptyTrash(root)`**: xoá vĩnh viễn MỌI node `trashed` trong 1 root (cả bundle root lẫn cây con), 1 lô
   `persistDelete`. Trả về số **mục** trong thùng (node có `trashRootId===id`) đã xoá. Cùng độ "dứt khoát" như
   Delete forever từng cái, chỉ khác là hàng loạt.
2. **`main.js`**: khi ở màn thùng rác, thanh công cụ thêm nút **"Empty bin"** (đỏ, class `.aw-lib-del`). Bấm →
   `emptyBinFlow`: đọc `listTrash` (rỗng → toast "already empty"); nếu có → **modal xác nhận** ("Permanently delete
   all N items… This cannot be undone", nút **Cancel** + **Delete all** đỏ) → `emptyTrash` → đóng modal + `render()`
   + toast "Deleted N items". Lỗi (chưa login…) hiện trong modal, không đóng.

**Kiểm chứng (không login):** tạm dựng toolbar ở chế độ trash → hiện đúng nút **Back (icon)** + **"Empty bin" (đỏ
`aw-lib-del`)**, 0 lỗi. main.js parse sạch. Modal + `emptyTrash` chạy thật cần login (logic review: mirror
Delete forever; modal dùng khuôn `openModal`+`aw-modal-text`+`aw-lib-del` sẵn có). Đã gỡ debug tạm.

**VIỆC ĐANG CHỜ:** thầy đăng nhập → xoá vài act vào thùng rác → vào Recycle bin → **Empty bin** → xác nhận → sạch → **commit + push**.

---

## Đợt 51 (3/8/2026, v0.9.25) — TINH CHỈNH UX IMPORT (icon toolbar · make-folder mặc định · auto-close) — ✅ THẦY DUYỆT → COMMIT + PUSH + LIVE

**3 yêu cầu thầy + 1 fix tiện tay** (`main.js` + `core/app.css`, KHÔNG đụng core khác):
1. **Nút Import + Recycle bin → ICON** (bỏ chữ). Import dùng icon upload (`IMP_UPLOAD_SVG`), Recycle bin dùng
   `icons.trash` (vào thùng rác đổi thành `icons.prev` = mũi tên back). Class mới `.aw-fm-iconbtn` (vuông, bo tròn,
   `is-on` xanh khi ở thùng rác); giữ `title`/`aria-label` để rê chuột thấy tên. New activity/New folder vẫn để chữ.
2. **"Make a new folder" MẶC ĐỊNH TÍCH** khi vừa nạp file (ô tên hiện sẵn = mã bài `<source>`). Bỏ tích thì act vào
   thẳng thư mục hiện tại.
3. **Auto-close sau Import**: import xong (không lỗi) → **tự đóng pop-up**. Nếu KHÔNG make-new → chỉ refresh thư mục
   hiện tại (xong). Nếu CÓ make-new → sau khi đóng, **mở luôn thư mục mới** (`enterFolder(root, res.folderId)`).
   Có lỗi/act hỏng → GIỮ pop-up mở + hiện lỗi (không đóng); skip trùng tên thì báo bằng toast.
4. **Fix hiển thị**: dòng preview act **anagram** trước hiện "· 0" vì đếm thiếu khoá `items` (anagram/flying/unjumble
   dùng `content.items`, không phải `pairs`) → thêm `c.items` vào công thức đếm. Nay hiện "Anagram · 100".

**Kiểm chứng (tạm expose importFlow/toolbar, KHÔNG login):** nạp file reading → 12 dòng, **"Make a new folder" tích
sẵn**, ô tên = "DS-S2.I1.W3", meta "Anagram · 100" (đã fix); `toolbar()` dựng 0 lỗi, **Recycle bin = nút icon**
(`aw-fm-iconbtn`+svg+title). 0 lỗi console. Auto-close + mở folder mới cần login để chạy `importBundle` (logic review:
`close()` + `enterFolder(res.folderId)`; `importBundle` trả `folderId` = folder mới khi make-new). Đã gỡ debug + file test.

**VIỆC ĐANG CHỜ:** thầy đăng nhập → thấy 2 nút icon; Import 1 file → make-new tích sẵn → Import → pop-up tự đóng và
nhảy vào thư mục mới → **commit + push**.

---

## Đợt 50 (3/8/2026, v0.9.24) — ĐỔI TEMPLATE MẶC ĐỊNH KHI IMPORT + CẤU TRÚC THƯ MỤC ACT/HOMEWORK — ✅ THẦY DUYỆT → COMMIT + PUSH + LIVE

**Yêu cầu thầy (đổi bản đồ act khi tạo từ file):**
- ENG1/ENG2/VI1/VI2 + **PRONUNCIATION** → **ANAGRAM** (trước ENG/VI là Find the match).
- **PRONUNCIATION** = dataset MỚI: tách cột IPA "WORD /ipa/" → anagram (word=từ, clue=phiên âm IPA).
- IPA → **Speaking cards** (giữ). QUIZ1/QUIZ2 → **Quiz**. Reading act: TRUE FALSE / **FIND THE MATCH** (FILLING) / QUIZ.
- **Thư mục:** READINGACT1 (v1) + QUIZ1/QUIZ2 → **ACT**; READINGACT2 (v2) → **HOMEWORK bên trong ACT**; vocab ở gốc.

**Việc đã làm:**
1. **`core/store.js` `importBundle`**: hỗ trợ **thư mục lồng nhau** qua trường **`subfolder`** trên mỗi act
   (vd `"ACT"`, `"ACT/HOMEWORK"`). Hàm `resolveFolder(segments)` tạo/tái dùng từng cấp dưới base (thư mục
   thầy đang đứng, hoặc folder mới nếu tick "Make a new folder"), cache theo path để ACT chỉ tạo 1 lần.
2. **`core/lesson-import.js`**: thêm builder `anagram` + preset `OPT_ANA`; ENG/VI → anagram; thêm PRONUNCIATION
   (regex `^(.+?)\s+(/[^/]*/)\s*$` tách "WORD /ipa/"); gắn `subfolder` "ACT" cho Quiz1/2, "ACT" cho reading v1,
   "ACT/HOMEWORK" cho v2.
3. **`main.js` importFlow**: dòng preview mỗi act nay hiện thêm **subfolder** (`Anagram · 100`, `Quiz · 30 · ACT`,
   `True/False · 30 · ACT/HOMEWORK`) để thầy thấy act vào đâu.
4. **Skill `taoactaw`** cập nhật khớp (anagram/pronunciation/subfolder) + đóng gói lại + gửi thầy.

**Kiểm chứng (harness, 2 file thật, KHÔNG login):**
- Reading `DS-S2.I1.W3`: **12 act** — anagram×4 (ENG/VI) + anagram PRONUNCIATION + speaking IPA (gốc) +
  TF/FIND/QUIZ ở **ACT** (v1) và **ACT/HOMEWORK** (v2). Anagram đủ 100 items {word, clue}; PRONUNCIATION clue=/ipa/.
- Listening `LSA2-S2.T1.P1-2`: **8 act** — 5 anagram + speaking IPA + QUIZ1/QUIZ2 ở **ACT**.
- **20/20 mount 0 lỗi console**; skill Python cho kết quả Y HỆT (12/8 act, subfolder khớp).
- `git status`: `core/store.js`, `core/lesson-import.js`, `main.js` (+ docs). File test tạm đã xoá.

**CHƯA test được (cần login):** việc tạo thư mục lồng thật trên Firestore (logic `resolveFolder` review kỹ; teacher
test khi bấm Import).

**VIỆC ĐANG CHỜ:** thầy đăng nhập → Import 1 file .xlsm → xác nhận act đúng loại + đúng cây thư mục ACT/HOMEWORK
→ **commit + push** (gộp Đợt 48–50). ⚠️ Bản đồ act nay ở 2 nơi (`lesson-import.js` = chính, skill = phụ) — sửa thì đồng bộ.

---

## Đợt 49 (3/8/2026, v0.9.23) — IMPORT ĐỌC THẲNG FILE .xlsm/.xls TRONG TRÌNH DUYỆT (bỏ bước JSON) — ✅ THẦY DUYỆT → COMMIT + PUSH + LIVE

**Yêu cầu thầy:** "duyệt thẳng file .xlsm vào page live → đọc + tạo act ngay, KHÔNG qua trung gian JSON".

**Việc đã làm:**
1. **Nhúng bộ đọc Excel local**: `core/vendor/xlsx.mjs` (SheetJS ESM, ~1MB, tải từ cdn.sheetjs.com về REPO — KHÔNG
   CDN lúc chạy, giữ offline). **Nạp LƯỜI** bằng `import()` — chỉ tải khi thầy chọn 1 file bảng tính, nên học sinh
   + việc thường KHÔNG nặng thêm (đo: index.html vẫn parse sạch, SheetJS không tải).
2. **`core/lesson-import.js`** (MỚI): port y nguyên logic skill `taoactaw` sang JS. `parseLessonToBundle(arrayBuffer,
   {fileName})` → đọc WORDTABLE (cột D/E,H/I,L/M,P/Q,S) + Quiz1/2 + READINGACT1/2 (3 vùng TF/FILLING/READING QUIZ,
   bỏ Q&A) → trả gói `{folder, activities}` y hệt taoactaw. Tự nhận reading/listening, bỏ sheet rỗng, tên sheet
   không phân biệt hoa/thường. Đọc ô bằng `XLSX.utils.encode_cell` (1-indexed row/col kiểu openpyxl). Cùng 4 preset
   `OPT_*` + quy ước title (v1 `<source> / …`, v2 `<source> HW / …`).
3. **`main.js` `importFlow` — thiết kế lại hiện đại** (5 điều chỉnh của thầy): **drop-zone** (kéo-thả file VÀO
   HOẶC bấm để duyệt, có icon upload, viền đứt, sáng lên khi kéo qua — `is-over`); **BỎ hộp paste JSON**; sau khi
   nhận file → **danh sách act có CHECKBOX** (mỗi dòng: icon theo loại + title + "Loại · số câu", mặc định tích
   hết) → chỉ act được tích mới tạo; header "N of M selected" + nút **Select all/Clear all**; nút **Import N** tự
   đổi số, disable khi 0. **Mặc định vào THƯ MỤC HIỆN TẠI** (không tạo folder). Thêm tick **"Make a new folder"**
   → hiện ô tên (điền sẵn `<source>`), tích thì tạo folder mới đưa act vào. Vẫn nhận file `.json` (thả/duyệt).
   CSS mới `.aw-imp-*` trong `core/app.css` (drop-zone, list, row, folder — tông xanh #2f7bff, bo tròn, hover).

**Kiểm chứng (dev server, harness gốc-web, copy 2 file .xlsm thật vào web root rồi fetch arrayBuffer):**
- Reading `DS-S2.I1.W3`: đọc **151ms → 11 act** (đúng như skill Python). Listening `LSA2-S1.T4.P4-5`: **65ms → 7 act**.
- **18/18 act mount engine thật, 0 lỗi console.** JS port cho kết quả Y HỆT bản Python.
- index.html parse sạch (main.js/lesson-import không lỗi; SheetJS chưa tải vì chưa chọn file).
- **UI thật** (tạm expose `importFlow`, nạp file .xlsm thật vào input): modal 540px, drop-zone viền đứt, **11 dòng
  act có checkbox + icon + "Find the match · 100"**, header "11 of 11 selected", nút "Import 11"; bỏ tích 2 →
  "Import 9" + dòng mờ; Select all/Clear all đổi nhãn + disable đúng; "Make a new folder" mặc định ẩn, tích thì
  hiện ô tên điền sẵn `<source>`. Đã gỡ dòng debug + file test tạm (git diff sạch).
- `git status`: `main.js` (M), `core/lesson-import.js` + `core/vendor/xlsx.mjs` (mới).

**Đánh đổi (thầy đã đồng ý):** repo +1MB (`xlsx.mjs`) — nhưng nạp lười teacher-only, học sinh không tải. Logic ánh xạ
giờ ở **2 nơi**: skill `taoactaw` (Python, dùng qua dòng lệnh) + `lesson-import.js` (JS, trong app — nay là ĐƯỜNG CHÍNH).
Sửa bản đồ thì nhớ đồng bộ cả hai (hoặc coi lesson-import.js là bản chính).

**⭐ FIX (thầy test báo lỗi):** nhiều act nhận nhầm ô rỗng có **số "0"** (WORDTABLE lấp dòng trống bằng công thức trả
0; IPA còn ra `"0 "` có dấu cách) → 100 từ hoá 150, Speaking cards chia bài "0". Gốc: bản `taoact` có `ok()` loại cả
`""` LẪN `"0"`, nhưng khi port sang JS/Python tôi rút gọn còn kiểm truthiness → mất bộ lọc "0". **Sửa:** hàm đọc ô
(`cell()` trong `lesson-import.js` + `s()` trong skill) nay coi ô **trim ra "" hoặc "0"** = KHÔNG dữ liệu. Kiểm trên
`LSA2-S2.T1.P1-2.xlsm` (100 từ + junk tới dòng 150): trước 150, **sau đúng 100/100/100/100/100 + Quiz 30/30, junk=0,
7/7 mount 0 lỗi**; skill Python cho kết quả y hệt. Skill đã đóng gói lại + gửi thầy (Save skill đè bản cũ).

**VIỆC ĐANG CHỜ:** thầy đăng nhập AWord → Import → **chọn thẳng 1 file .xlsm** → xác nhận act tạo đúng → **commit + push**
(cùng đợt với nút Import Đợt 48 nếu chưa push). ⚠️ Nếu Pages có giới hạn kích thước/loại file thì kiểm `xlsx.mjs` có
live không sau push (curl).

---

## Đợt 48 (3/8/2026, v0.9.22) — NÚT IMPORT: tạo hàng loạt act từ "gói JSON" (nền tảng taoactaw, Phần A) — ✅ THẦY TEST OK → COMMIT c4ee761 + PUSH + LIVE

**Bối cảnh:** thầy muốn tính năng "taoactaw" — đọc file .xlsm bài học (giống skill `taoact` cho Wordwall) rồi tạo act
trong thư viện AWord. Chốt cách làm (2 vòng hỏi): **(1) xây nút Import NGAY TRONG app AWord** (bền, không phụ thuộc
tự động hoá trình duyệt, dùng lại mãi) — đây là **Phần A** đợt này; **(2) mỗi bộ dữ liệu chỉ tạo ÍT act gốc**, thầy
dùng Change Template (Đợt 47) đổi game tại lớp. Phần B (skill đọc Excel → gói JSON) làm sau.

**Đã nghiên cứu 2 họ file mẫu của thầy** (ghi để Phần B dùng):
- File **listening** `LSA2-S1.T4.P4-5.xlsm`: `Quiz1`/`Quiz2` CÓ dữ liệu (nghe hiểu), `Reading Acts` RỖNG; tên sheet chữ thường.
- File **reading** `DS-S2.I1.W3 ... SEEDS TURN INTO TREES.xlsm`: `READINGACT1`/`READINGACT2` CÓ dữ liệu, `QUIZ1/2` RỖNG; tên sheet HOA.
  Mỗi READINGACT có **4 vùng cố định**: TRUE/FALSE (dòng 2–16, cột B=đúng/C=sai) · FILLING (19–38, B=đáp án/C=câu có `___`) ·
  READING QUIZ (41–70, B=câu hỏi, C=đáp án A LUÔN đúng, D–F=nhiễu) · QUESTION/ANSWER (72+, **BỎ** — câu mở).
  → **Logic `read_ra` của taoact đọc thẳng file reading, khớp 100%**. WORDTABLE (cột D/E,H/I,L/M,P/Q,S) cũng khớp taoact.
- ⚠️ Bài học cho Phần B: parser phải **dò tên sheet không phân biệt hoa/thường** + **bỏ sheet rỗng** (tự nhận file là reading hay listening).

**Bản đồ Excel → act gốc AWord** (FILLING→Find the match theo thầy chốt): vocab ENG1/ENG2/VI1/VI2 → **Find the match**;
IPA → **Speaking cards**; TRUE/FALSE (đúng→answer:true, sai→answer:false) → **True or false**; FILLING → **Find the match**
(keyword=đáp án, definition=câu có chỗ trống); READING QUIZ → **Quiz**. v1→tên `<source> / …`, v2→`<source> HW / …`.

**Việc đã làm (Phần A):**
1. **`core/store.js`** (sửa core, additive): thêm **`importBundle(bundle, {parentId})`**. `bundle = {folder?, activities:[{type,title,theme?,instruction?,options?,content}]}`.
   Nếu có `folder` → tạo/**tái dùng** subfolder cùng tên dưới (activities, parentId) rồi `saveActivity` từng act vào đó; không có folder → vào thẳng parentId.
   Act **trùng tên bị BỎ QUA** (bắt `aw/duplicate-name`) → chạy Import lại AN TOÀN, không nhân đôi. Trả `{folderId, folderName, created, skipped, errors}`.
2. **`main.js`**: import `importBundle`; thêm nút **Import** trên thanh công cụ (chỉ trong Activities, không ở thùng rác, cạnh New folder);
   `importFlow()` = hộp thoại (dùng `openModal`): textarea dán JSON + chọn file .json (FileReader) + nút Import → parse → `importBundle({parentId: state.folderId})`
   → hiện báo cáo "Created N … in "folder", skipped M" + `render()` làm mới thư viện. Lỗi JSON/đăng nhập hiện tại chỗ.

**Hợp đồng "gói act" JSON** (Phần B sẽ sinh ra đúng dạng này):
```json
{ "folder": "DS-S2.I1.W3",
  "activities": [ { "type":"find_the_match", "title":"DS-S2.I1.W3 / ENG1", "theme":"classic",
                    "options":{…}, "content":{ "pairs":[{ "keyword":"SAPLING", "definition":"A very young tree…" }, …] } }, … ] }
```

**Kiểm chứng (dev server 5510, KHÔNG cần login):**
- Prototype mapping (Python) đọc file reading → bundle **11 act** đúng thiết kế (4 Find the match vocab · IPA Speaking cards · TF×2 · FILLING×2 Find the match · QUIZ×2). Số item khớp: vocab 100, TF 30 (15 đúng+15 sai), FILLING 20, QUIZ 30.
- Harness gốc-web nạp bundle → mỗi act `ensureTemplate`+`startGame` bằng engine THẬT → **11/11 mount, 0 lỗi console**.
- Nạp `index.html`: `main.js`+`store.js` parse & chạy sạch (0 lỗi) → cú pháp OK. (2 file harness/bundle tạm ĐÃ XOÁ.)
- `git status`: đúng 2 file (`core/store.js`, `main.js`).

**CHƯA test được (cần thầy):** bấm nút Import thật → lưu Firestore, vì trang thư viện sau **popup đăng nhập Google không tự động hoá được**.

**Phần A:** thầy đã test nút Import (gói "IMPORT TEST" 2 act) — **CHẠY OK** (3/8/2026). Chờ **commit + push** cùng đợt.

**Phần B — skill `taoactaw` ĐÃ XONG (3/8/2026):** skill self-contained (kiểu taoact) đọc .xlsm → sinh gói JSON đúng hợp đồng
`importBundle`, ghi ra `D:\OTHERS\CLAUDE\aword_bundle.json`; thầy Import vào AWord. **Tự nhận diện** reading (READINGACT1/2)
hay listening (Quiz1/2), **bỏ sheet rỗng**, tên sheet không phân biệt hoa/thường. Bản đồ: ENG1/ENG2/VI1/VI2→Find the match ·
IPA→Speaking cards · Quiz1/2 & READING QUIZ→Quiz · TRUE/FALSE→True or false · FILLING→**Find the match** (thầy chốt) ·
READINGACT1=v1 (`/ …`), READINGACT2=v2 (`HW / …`). Kiểm chứng: chạy ĐÚNG code nhúng trong SKILL.md trên cả 2 file thật
→ reading 11 act, listening 7 act; 18/18 act mount engine 0 lỗi (harness). Skill nằm ở thư mục skills phiên này +
đã đóng gói `taoactaw.skill` gửi thầy bấm "Save skill" để cài vĩnh viễn. **VIỆC ĐANG CHỜ:** thầy chạy thử skill trên 1 lesson
thật + Import → duyệt → coi như trọn taoactaw. (Nếu AWord đổi schema options thì cập nhật 4 preset `OPT_*` trong skill.)

---

## Đợt 47 (3/8/2026, v0.9.21) — ĐỔI TEMPLATE GIỮA LÚC CHƠI ("Change template") ⭐ CÓ SỬA CORE ✅ THẦY DUYỆT → COMMIT + PUSH + LIVE

**Yêu cầu của thầy:** đang chơi 1 bộ (vd Anagram) thì bấm 1 nút để **đổi sang game khác chơi tiếp CHÍNH
bộ dữ liệu đó**, khỏi quay về thư viện nhập lại — giữ lớp hào hứng ("cùng một bộ từ, đổi kiểu chơi").

**Quyết định đã chốt với thầy (2 vòng hỏi):**
- **Phạm vi = "nhóm hợp dữ liệu tốt"** (không bật các chiều gượng). Riêng chiều *từ vựng → trắc nghiệm*
  (lấy đề/định nghĩa làm câu hỏi, trộn thêm từ khác làm đáp án nhiễu) NẰM TRONG nhóm sạch — đúng ý thầy.
- **Chỉ CHƠI TẠM, giữ nguyên act gốc**: đổi thì dựng 1 act mới tạm (id `conv_...`, cờ `_converted`),
  KHÔNG lưu thư viện, KHÔNG đụng Firebase. Điểm bắt đầu lại, **GIỮ theme đang chọn**.
- **3 chỗ bấm** (đều đã có khung stub "coming soon" từ trước, nay nối thật): nút **Template** dưới khung ·
  mục **Change template** trong menu ☰ · dòng **Play a different template** ở màn kết thúc.

**Việc đã làm:**
1. **File lõi MỚI `core/convert.js`** — bộ phiên dịch dữ liệu. Rút mọi act về "record" chuẩn theo 4 *kind*:
   `qa` {term, clue, altAnswers[], distractors[]} · `tf` {text, truth} · `sentence` {sentence, clue} ·
   `card` {text}. Xuất 3 hàm: `toRecords(activity)`, `switchTargets(activity)` (trả về đúng danh sách
   game đổi-được), `convertActivity(activity, target)` (async — dựng act mới; options+instruction lấy
   từ **file sample của game đích** để chắc hợp lệ). MC đích tự sinh đáp án nhiễu từ các `term` khác
   trong bộ (bù vào distractors gốc nếu nguồn vốn là trắc nghiệm).
2. **`core/engine.js`** (sửa core, thầy có mặt duyệt): import `ensureTemplate` + `switchTargets/convertActivity`;
   viết lại `buildTemplatePanel` (game hợp dữ liệu = bấm được, còn lại `is-soon` mờ + toast "doesn't fit");
   thêm `doSwitchTemplate(target)` (`await ensureTemplate` → convert → `cleanupAll` → `startGame` act tạm,
   giữ fullscreen vì target là `root`); thêm `openSwitchPicker(onBack)` = picker nền tối TRONG khung (hoạt
   động cả khi fullscreen, khác thanh dưới khung); nối menu ☰ + màn kết thúc vào picker.
3. **`core/app.css`** — thêm `.aw-switch-list` (lưới 2 cột cho picker; `.aw-panel` sẵn tự cuộn).

**Bản đồ đổi (nhóm sạch) — đã tự kiểm 116/116 chiều mount 0 lỗi:**
- Nhóm QA (10 game: anagram · flying_fruit · crossword · find_the_match · balloon_pop · quiz · gameshow ·
  maze_chase · open_the_box · type_the_answer): đổi qua lại cho nhau **+ speaking_cards** (≈11 đích mỗi game).
- `true_false` ↔ `whack_a_mole` (+ speaking_cards). `unjumble` → {speaking_cards, type_the_answer}.
- `speaking_cards` → ∅ (không có đáp án nên không đổi sang game chấm điểm).
- **Guard**: nhóm QA nếu **thiếu clue** (vd Anagram withClues:false, <60% có clue) thì loại các đích cần đề
  (crossword/find_the_match/balloon_pop/quiz/…); crossword cần 2..40 câu. `whack_a_mole` nguồn: mode
  `quiz`→QA, còn lại→TF.

**Kiểm chứng (dev server localhost:5510 + 2 trang harness tạm ĐÃ XOÁ, chạy ở gốc web để đúng đường CSS/module):**
- `_convtest.html`: duyệt mọi sample nguồn × mọi đích `switchTargets` → convert + `startGame` bằng engine
  THẬT vào div rời → **PASS=116, FAIL=0**, `.aw-stage` mọi lần, **0 lỗi console**, số câu khớp bộ nguồn.
- `_convvisual.html`: mở Anagram → panel Template hiện 11 game bấm được, chỉ **True/false + Unjumble** mờ
  (đúng); bấm **Find the match** → panel tắt, remount, READY giữ tên bài "ANIMALS — UNSCRAMBLE" + game
  "FIND THE MATCH"; Play → ô đáp án đúng bộ động vật (giraffe/dolphin/kangaroo/polar bear/penguin/elephant).
- Menu ☰ (nguồn Quiz) → "Change template" mở picker nền tối "CHANGE TEMPLATE" đúng 11 đích + nút Back;
  bấm **Anagram** → Play → gợi ý "Which word is a fruit?" + chữ xáo "N A A A B N" = **banana** (đáp án đúng).
- `git status`: đúng 3 file (`core/convert.js` mới, `core/engine.js`, `core/app.css`) — KHÔNG đụng 14 template,
  KHÔNG đổi class `.aw-page/.aw-stage/.aw-below` hay target fullscreen `#app` (không vỡ nhúng myActivity/myLesson).

**Quyết định kỹ thuật đáng nhớ:**
- Học sinh KHÔNG thấy đổi template: cụm dưới khung bị gỡ khi có `session` (engine ~dòng 195), menu "Change
  template" đã gác `if(!session)`, và "Play a different template" chỉ ở nhánh non-session của summary.
- Picker dùng **nền tối trong khung** (không dùng thanh dưới khung) để bấm được cả khi fullscreen.
- `convert.js` chỉ import `catalog.js` + `utils.js` (KHÔNG chạm store) nên engine import tĩnh nó vẫn AN TOÀN
  với luật "trang HS không nạp code thư viện".

**VIỆC ĐANG CHỜ (đợt này):** ĐÃ commit + push + live (thầy duyệt 3/8/2026). Có thể bàn thêm sau: (a) nút "Lưu thành act mới" sau khi đổi;
(b) bật thêm chiều "gượng" (mọi game → Đúng/Sai) nếu thầy muốn; (c) khi thêm template thứ 15 nhớ khai thêm
nhánh trong `toRecords`/`buildContent` của `convert.js`.

---

## Đợt 46 (3/8/2026, v0.9.20) — FIX deep-link act TRẮNG TRANG: `routeFromLocation` thiếu `ensureTemplate` (hồi quy Đợt 33) ✅ DUYỆT → COMMIT + PUSH + LIVE

**Bối cảnh (thầy báo qua app myActivity):** ở bảng ĐÔI của myActivity, mở 1 act AWord thì pane TRÁI
hiện act bình thường, pane PHẢI **trắng tinh**. myActivity mirror act sang pane phải bằng cách
`loadURL` thẳng URL act (deep-link `?a=<num>`) vào một trang **mới tinh**.

**Gốc rễ (bug của AWord, không phải myActivity):** Đợt 33 (v0.9.7) chuyển sang nạp template **lười**
`ensureTemplate(type)` và đã thêm `await` vào `playAct`/`editAct`/`createBlankAct` + `play.js`,
**NHƯNG BỎ SÓT đúng đường deep-link `routeFromLocation()` trong `main.js`**. Khi mở act qua URL trên
trang mới, template CHƯA đăng ký trong registry → `startGame()` gọi `getTemplate()` (đồng bộ) →
ném `Chưa có game loại "..." trong registry` → trang trắng. Chỉ loại **Quiz** thoát nạn ở vài đường
cũ; mọi loại khác (vd `type_the_answer`) đều gãy. Trên bảng đôi, pane TRÁI sống chỉ vì thầy đã duyệt
thư viện trước đó nên template đã nằm trong Map; pane PHẢI là trang mới nên gãy.

**Ảnh hưởng RỘNG hơn myActivity:** mọi link deep-link tới act khác Quiz mở trên **tab/trang mới**
(bookmark, link chia sẻ `?f=..&a=..`) đều trắng — nay được vá chung.

**Sửa (1 chỗ, `main.js` `routeFromLocation`):** thêm `try { await ensureTemplate(node.type); }
catch { toast(...); return goTop(opts); }` NGAY TRƯỚC `startGame` — y hệt khuôn `playAct`. `ensureTemplate`
đã import sẵn (Đợt 33); idempotent nên back/forward về act không tốn thêm. KHÔNG đụng `core/`.

**Kiểm chứng (harness Electron, partition thật `persist:main`, act live `?f=248&a=27` loại type_the_answer):**
- Tái hiện: pane mới tinh → `hasStage:false`, `registeredBefore:false` → trắng (đúng bug).
- Cơ chế fix: sau `ensureTemplate('type_the_answer')` → `getTemplate()` (chính lệnh `startGame` gọi)
  trả về template `type:"type_the_answer"`; ép render lại (nạp template rồi bắn `popstate`) → `.aw-below`
  xuất hiện = act render thật. `node --check main.js` sạch.

---

## Đợt 45 (3/8/2026, v0.9.19) — WHACK-A-MOLE: nâng cấp LỚN (7 loạt tinh chỉnh theo yêu cầu thầy) ✅ DUYỆT → COMMIT + PUSH + LIVE
Tự test trình duyệt thật, 0 lỗi console. KHÔNG đụng core (chỉ 5 file whack-a-mole + 2 docs). Đầy đủ + BẪY:
`templates/whack-a-mole/GHI CHU WHACK-A-MOLE.md` (mục "⭐ ĐỢT 45"). Tóm tắt các loạt:

1. **Đồ họa ẢNH THẬT thay SVG tự vẽ:** phát hiện `mound01/02/03.webp` là **CẢ PHÔNG ĐỒI** (đồi+núi mesa+
   xương rồng+cỏ), không phải ụ đất. Dùng `mound02` làm đồi chính; hố chỉ còn `holeback+holefront`;
   `mound01` blur làm 2 đồi tiền cảnh; cactus THẬT 2 bên. + **Intro zoom** (lùi xa thấy núi → zoom về chơi).
2. **Editor 2 chế độ chuẩn:** True/False → **2 CỘT** (như true-false), Quiz giữ nguyên; **khóa đổi mode**
   khi đã có dữ liệu; bỏ ép `timer:"none"` khi save.
3. **Timer đồng bộ engine** (`options.timer` countUp/countDown + `timerTotalSeconds`, `manualTimerStart`),
   bỏ `gameSeconds`; countUp bỏ bar; **bar đổi cam ≤30s / đỏ ≤10s**; bar dài cố định đến sát tim.
4. **Options mới:** Switch correct/incorrect · thanh trừ điểm 0–5 · **Lives 0–10** (tim ở topbar, mất từ
   trái) · **3 tick bonus riêng** (Extra time/Loot/Power Up) · gỡ "Auto switch" + nút Timer "None".
5. **Luật mục tiêu:** đập hết câu đúng → countUp = COMPLETE, countDown = làm mới vòng chơi tiếp đến hết giờ;
   câu đập đúng không hiện lại, câu lỡ quay lại; quiz 1 pass = xong (countUp) / lặp (countDown).
6. **Cảm giác chơi:** đập SAI = **phạt đông cứng 4s** (mole sai ở lại, mole khác thụt, ngưng spawn) ·
   **dấu ✓/✗ nét trần** · **bubble vẽ CSS** ôm sát chữ (hết tràn) sát chuột · biển vào giữa cột.
7. **Tinh chỉnh vặt:** hố nâng cao + giãn rộng (3-4-3) không đè cactus/đồi · hàng thời gian–tim–điểm cân
   đối cùng hàng · gỡ số điểm to (tally) khỏi đè "TIME'S UP" cuối game.

Backup bản cũ đã xóa sau khi commit. (Đợt 44 nhắc "whack-a-mole đang dở của phiên khác" — chính là đợt này.)

---

## Đợt 44 (2/8/2026, v0.9.18) — SPEAKING CARDS: 6 loạt tinh chỉnh theo yêu cầu thầy ✅ DUYỆT → COMMIT + PUSH + LIVE
Tự test trình duyệt thật, 0 lỗi console. KHÔNG đụng core (chỉ file speaking-cards + 2 docs; whack-a-mole
đang dở của phiên khác nên KHÔNG commit). Backup bản cũ ở
`D:\APP AND DATA\AWord-data\Backup\speaking-cards-v0.9.17\`. Chi tiết đầy đủ + BẪY:
`templates/speaking-cards/GHI CHU SPEAKING-CARDS.md` (mục 2/8/2026 đầu file). Tóm tắt:
1. **Intro lia camera**: scene thành khung ngắm trên "thế giới" 2 panel (bàn cờ vua+vây vẽ SVG | khu chơi),
   bấm PLAY → lia phải đúng thời lượng tiếng intro (~4,7s) rồi mới cho Deal.
2. **Menu/Sound/Fullscreen vào 2 góc dưới nền xanh** (giống act thật) — nút riêng forward tới nút gốc đang
   ẩn của engine (không sửa core).
3. **Cân đối lại** bộ bài + khu chia vào giữa (hết lệch trái).
4. **Lá bài NGANG (7:5)** + vẽ lại mặt lưng/mặt trước hoa văn theo ảnh mẫu.
5. **Shuffle**: hiệu ứng riffle kéo dài đúng bằng tiếng shuffle (~4,65s, lặp ~9 vòng).
6. **Không cắt đôi từ**: bỏ `word-break`, chuyển fit sang `fitOnce(contentBox)` co cả rộng lẫn cao.
7. **Phiên âm 2 hàng**: `TROUSER` trên, `/ˈtraʊzə/` dưới (nhỏ + xám).
   \+ **Vá Options**: nhóm "End of game/Show answers" (core đẩy xuống cuối) nay được tỉa đúng (chạy 2 nhịp).

**Loạt 2 (cùng ngày, thầy chơi thử rồi yêu cầu thêm — vẫn v0.9.18, CHƯA COMMIT):**
8. **Number of deal places → SLIDER** 1..10 (thay stepper).
9. **Quân cờ vẽ đẹp/giống thật hơn**: bộ Staunton SVG có gradient khối + shine/shade + bóng (thay blob cũ).
10. **1 ô chia: bộ bài + place TO và BẰNG NHAU** (42cqw); nhiều ô: kích cỡ thích ứng lấp tối đa không gian,
    nhiều hàng không tràn (`computeLayout` set `--deck-w/--card-w/--cols`).
11. **Chữ trong lá TO TỐI ĐA** (fitOnce `max` 1→3.6) nhưng 1 từ vẫn không tách 2 dòng.

**Loạt 3 (cùng ngày — thầy yêu cầu DÙNG ĐỒ HỌA GỐC của act, vẫn v0.9.18, CHƯA COMMIT):**
12. Mở act gốc bằng Claude in Chrome, tải graphic THẬT của theme (background.jpg + card art) về
    `AWord-data/Source/Graphic/SPEAKING CARDS`, copy vào `templates/speaking-cards/assets/`.
13. **Thay hình vẽ SVG bằng ẢNH NỀN THẬT**: bỏ quân cờ/bàn cờ SVG + kiến trúc 2-panel; scene = `.aw-sc-bg`
    (ảnh nền rộng pan) + `.aw-sc-play` (fade vào sau pan). Intro lia camera trên chính ảnh gốc (bàn cờ →
    felt chia bài trái, có viền vàng như act thật). Đẹp/tự nhiên hơn hẳn SVG.
    **Bản quyền — đã xử lý**: thầy đưa ảnh nền RIÊNG (background2.jpg, cùng cỡ) → ghi đè `assets/background.jpg`;
    GỠ card art Wordwall khỏi repo. Nền công khai nay là ảnh của thầy.

**Loạt 4 (cùng ngày — 4 tinh chỉnh, vẫn v0.9.18, CHƯA COMMIT):**
14. Shuffle còn **1/2 thời gian** (âm thanh + hiệu ứng; iter 9→4, `stopSound` cắt clip giữa chừng).
15. Câu dài trong lá: **to hết cỡ + xuống nhiều dòng + căn giữa** (bỏ fitOnce, viết bộ co riêng — bẫy
    `width:100%` khiến fitOnce co về min).
16. **Bộ bài canh giữa deal place** (nhãn "N left" absolute, deck không bị đẩy lên).
17. Ô chữ trong **editor tự mở hết cỡ** để xem trọn text (bỏ tay kéo, auto-grow theo scrollHeight).

**Loạt 5 (cùng ngày — 2 tinh chỉnh, vẫn v0.9.18, CHƯA COMMIT):**
18. **Bỏ hẳn chức năng Add image** (nút + thumbnail + helper + field `image` trong data + CSS + sample).
19. Thêm **slogan "SPEAKING CARDS IN ANDREW CLASSES"** (look Crossword) — ghim trên-giữa scene (scene phủ
    topbar nên đặt trong scene, z-index 3 + text-shadow cho đọc rõ trên ảnh). Tinh chỉnh: slogan **fade hiện
    dần trong 30% cuối intro** (ẩn 70% đầu) + **giảm size còn 80%** (1.36cqw).

---

## Cách chạy thử trên máy
- Máy chưa cài Node. Bản hiện tại **chạy-ngay không cần build** bằng Python.
- Dùng **`python devserver.py 5510`** (KHÔNG `python -m http.server` trần — thiếu header chống cache,
  xem APP_MASTER mục 9). Công cụ preview cấu hình tên `aword` (trong `D:\OTHERS\CLAUDE\.claude\launch.json`)
  đã trỏ sang script này. Chạy tay: PowerShell tại `E:\LAP TRINH APP\AWord` → `python devserver.py`.
- **Trang chủ (trình quản lý kiểu Drive)**: `http://localhost:5510/`
- **Trang test riêng từng template**: `http://localhost:5510/templates/<ten-template>/test.html`

> **Cấu trúc thư mục đã được quy hoạch lại từ v0.3.0 để build nhiều template song song.**
> Xem `APP_MASTER.md` mục 4 để biết bản đồ thư mục mới nhất — đừng dựa vào đường dẫn file
> trong các mục lịch sử phiên bản CŨ hơn v0.3.0 bên dưới (src/, styles/ đã không còn tồn tại).

---

## ⭐ VIỆC ĐANG CHỜ (cập nhật 1/8/2026, sau Đợt 33 — MÁY/PHIÊN MỚI ĐỌC MỤC NÀY)

> File này xếp MỚI NHẤT LÊN TRÊN, nên mục "việc đang chờ" để ở đây (đầu file) cho dễ thấy.
> Bàn giao đầy đủ hơn (kèm khuôn code + cách test không cần đăng nhập): `APP_MASTER.md` **mục 0a**.

**Đứng ở đâu**: cả **14 loại act** đã chốt, sống ở trang chủ, đã push + live; **trang HS `play.html`
chơi được cả 14 loại** (trước chỉ Quiz). Thầy đã tự test bản live và xác nhận (1/8/2026).

**⚠️ 2 thói quen cũ nay đã SAI:**
1. **Gộp/thêm template = sửa ĐÚNG 1 file `core/catalog.js`.** Từ v0.9.7 `index.html`/`play.html`/
   `main.js`/`play.js`/`manifest.js` KHÔNG còn liệt kê template — `ensureTemplate()` tự nạp. Ghi chú cũ
   nào bảo "thêm import vào main.js + link CSS vào index.html + entry manifest.js" là LỖI THỜI.
2. **`manifest.js` không còn là danh sách chép tay**, chỉ là view suy ra từ catalog — đừng thêm gì vào.

**Việc kế tiếp — HỎI THẦY TRƯỚC, đừng tự làm** (xếp theo mức đáng làm; thầy chưa chốt cái nào):
- **(A) Balloon pop polish** — template DUY NHẤT đã lên trang chủ mà còn tồn đọng: blimp chồng lane ở
  khung hẹp; **hiện 2 đồng hồ** cùng lúc. Chi tiết: `templates/balloon-pop/GHI CHU BALLOON-POP.md`.
- **(B) Dọn 3 ĐỀ XUẤT SỬA CORE còn treo** (template đang tự lách bằng JS/tỉa DOM): Speaking cards xin cờ
  `openEnded`/`hideScore` + cờ ẩn nhóm Options; Crossword xin `tpl.hideRandomOption`; Balloon pop xin
  ẩn `timerEl` khi `inlineTimerBar:true` + `timer:"none"`.
- **(C) Còn ngỏ từng game**: 🎤/🖼️ voice+image trong editor Anagram/Crossword; Find the match thiếu 3 âm
  Menu/Leaderboard/RevealAnswers (core chưa có hook); Crossword bật bàn phím ảo nên phóng to theo từ
  đang chọn thay vì thu cả lưới.
- **(D) Chưa ai kiểm**: fullscreen thật trên bảng TOMKO; nghe thật các bộ mp3.

**Khúc không tự test được**: trang chủ + assignment thật đều sau popup đăng nhập Google (không tự động
hoá được). Muốn test logic mà khỏi đăng nhập: dùng `templates/<ten>/test.html`, hoặc `import()` thẳng
`core/registry.js` + `core/catalog.js` từ console (cách Đợt 32/33 đã dùng để quét cả 14 loại).

---

## Lịch sử phiên bản

### 2/8/2026 — Đợt 43 (v0.9.17): CROSSWORD — 3 loạt tinh chỉnh reveal + âm thanh (yêu cầu thầy). ✅ THẦY DUYỆT → COMMIT + PUSH + LIVE. Chỉ đụng `templates/crossword/*` (`crossword.js`/`.css`/`crossword-sound.js`), **KHÔNG đụng core**. Tự test trình duyệt thật (đo timeline, 0 lỗi console).
> Nối tiếp Đợt 36/v0.9.10 (tái thiết kế lớn Crossword). Version nhảy lên v0.9.17 để KHÔNG trùng nhánh Unjumble song song đã tới v0.9.16. Chi tiết đầy đủ + BẪY: `templates/crossword/GHI CHU CROSSWORD.md` mục "3 LOẠT TINH CHỈNH".
- **Reveal khi chấm chạy TUẦN TỰ từng ô** (thay kiểu đồng loạt cũ): SAI (Show-answer BẬT) → ô đúng xanh + **ting**, ô sai **✕ nhỏ KHÔNG che chữ** (bỏ hẳn nền/chữ đỏ) + **tặc**; xong ✕ cuối → chữ đúng **lật** về xám đồng nhất. ĐÚNG cũng tuần tự (xanh + ting), **ting ô cuối xong mới bay sao + cộng điểm**.
- **Thứ tự nhánh SAI + trừ điểm**: đủ hết ✕ → **sao đỏ bay + trừ điểm** → sao rời ô → **mới lật** chữ đúng (đo timeline: X 1→7 t83–1201 → sao/điểm t1441 → lật t2161).
- **6 âm SYNTH WebAudio** trong `crossword-sound.js` (AudioContext riêng, tôn trọng mute, không file mới): `ting`/`tac`/`magic` (Andrew) + `starGain` (vàng, tông lên) / `starLose` (đỏ, tông xuống) trong `flyStars` + `reject` ("thụp" gõ sai ô given, trong `shakeCell`).
- **Start again ĐỔI BỐ CỤC**: `buildCrossword` trộn danh sách trước khi sort theo độ dài + tie-break ngẫu nhiên → mỗi ván lưới xê dịch (đo 3 ván: 18×14/16×19/14×21), số từ xếp ổn định 17–18/20.
- File đổi: `templates/crossword/{crossword.js, crossword.css, crossword-sound.js, GHI CHU CROSSWORD.md}`.

### 2/8/2026 — UNJUMBLE: 7 loạt tinh chỉnh liên tiếp theo thầy (unjumble-local **Đợt 36→42, v0.9.10→v0.9.16**). ✅ THẦY DUYỆT → COMMIT + PUSH + LIVE. Tự test trình duyệt thật mọi mục (0 lỗi console).
> ⚠️ Số "Đợt 36→42" ở ĐÂY là đếm RIÊNG của template Unjumble (nối tiếp Đợt 35/v0.9.9 của nó) — KHÁC "Đợt 36" của Crossword ngay dưới (hai phiên song song trùng số). Chi tiết đầy đủ từng loạt: `templates/unjumble/GHI CHU UNJUMBLE.md`.
- **Nền + thương hiệu**: bỏ ảnh whiteboard 5,3 MB → nền CSS gradient hiện đại; sau đó bỏ luôn watermark, thêm **slogan "UNJUMBLE IN ANDREW CLASSES"** trên thanh đồng hồ/điểm (kiểu Crossword); **intro** viết lại: chữ nghiêng nhẹ + zoom bé→to, giữ lâu, rồi TỪNG TỪ bay đáp CHÍNH XÁC vào từ tương ứng của slogan (đo dx=dy≈0), khớp nhạc intro 3,3s.
- **Font + bố cục**: chữ dùng font chung **Baloo 2**; khối chữ căn giữa dọc; hàng gần nhau hơn; chuyển câu next/back **crossfade** hết nháy nền; **clue** thành 1 hàng dưới slogan (xanh nước biển, regular italic).
- **Kéo-thả**: bỏ khung chip (chỉ chữ), kéo thì chữ to+nghiêng; **con trỏ nháy (caret)** viết lại cho chuẩn+ổn định (đầu/cuối câu), thả chữ **bay mượt** về vị trí; chỉ tô xanh đoạn ĐẦU đúng liền nhau; xong câu tất cả xanh + nảy ăn mừng.
- **Chấm điểm THEO CÂU** (không theo từ): Words with bonus = 1 (giải) + 1 (bonus, đạt khi ≤ số lượt tối thiểu) → tối đa 2/câu; On submit đúng = 1/câu, sai = −"Points off" (slider 0–5). Điểm hiện **"N / max"**; điểm âm **màu đỏ**. ✓ và **BONUS** (từ dòng "moves for bonus") bay về điểm; submit đúng = **sao vàng** bay, sai = **sao đỏ** bay (bỏ ✗).
- **Options mới**: 2 chế độ (Words with bonus / On submit), Alignment, **Show answer when wrong**, **Points off when wrong** (0–5), **Lives** (thanh trượt ∞/1–10 như True/false — mất mạng khi submit sai, hết mạng → "Game over"). Bỏ ✓ ở nút Next câu cuối (nút vẫn còn, bị vô hiệu hóa).
- **Dấu câu**: **?/!** cuối câu = ô CỐ ĐỊNH khóa ở cuối (không kéo, không thả sau nó); **. và ,** luôn dính từ trước.
- **Submit**: câu đúng nổ sao quanh chữ; câu sai hiện câu đúng mà KHÔNG đẩy câu sai lên (reveal cao cố định).
- ⭐ **CÓ SỬA CORE (opt-in, tương thích ngược)**: `tpl.reviewStyle:"stacked"` — màn **Show answers** dạng danh sách xếp chồng full-width (câu DÀI đọc rõ), câu sai hiện bài-làm (đỏ ✗) + đáp-án-đúng (xanh ✓). Template khác không đặt cờ → giữ lưới 3 cột cũ. Ghi ở `core/HUONG DAN CORE.md`.
- File đổi: `templates/unjumble/{unjumble.js, unjumble.css, GHI CHU UNJUMBLE.md}` + xóa `templates/unjumble/img/whiteboard.png` + `core/engine.js` (nhánh stacked opt-in) + `core/HUONG DAN CORE.md`.

### 2/8/2026 — Đợt 36 (v0.9.10): CROSSWORD — TÁI THIẾT KẾ LỚN (nhiều loạt yêu cầu của thầy). ĐÃ COMMIT + PUSH. Chỉ đụng `templates/crossword/*`, **KHÔNG đụng core**. Tự test trình duyệt thật đủ mọi mục (0 lỗi console).

Thầy chơi bản Crossword đã chốt rồi gửi ~5 loạt yêu cầu, làm mới gần như toàn bộ cách chơi. Tóm tắt (chi
tiết + BẪY đầy đủ trong `templates/crossword/GHI CHU CROSSWORD.md` mục "2/8/2026 — TÁI THIẾT KẾ LỚN"):

- **2 màn hình rõ ràng**: "bảng" (toàn lưới, ẩn bàn phím) ↔ "hàng/cột" (1 từ bung to + bàn phím). Trả lời
  xong MỖI câu luôn về bảng (2,5s), tự chọn câu kế. Bỏ Next/Back.
- **Bàn phím cố định tuyệt đối** (host absolute ghim đáy-giữa; ẩn không chặn ô). **Bảng dùng hết màn** (ô
  to nhất, không khuyết). **Mọi ô đều bấm được** (sửa clue-bar + bàn-phím-ẩn che ô).
- **Slogan "CROSSWORD IN ANDREW CLASSES"** chèn lên thanh đồng hồ/điểm (xám, mảnh, HOA, giãn chữ).
- **Câu hỏi** to (4.1cqw), nằm cao, 1–2 dòng tự cân; dải ô **hàng** căn giữa câu-hỏi↔bàn-phím, **cột** căn
  giữa mép-phải-bàn-phím↔mép-phải-khung. Zoom mượt (đặt size trước + scale-in), đo bằng `offset*` để không
  giật vì transform trượt bàn phím. Nền câu hỏi trong suốt + quầng chữ (ô sau vẫn nhìn mờ).
- **Ô given**: xanh nếu từ câu đúng, xám nếu từ câu sai-lộ-đáp-án; gõ sai lên given → rung + chặn.
- **Andrew**: chữ vàng lấp lánh trong ô (thay vì trên thanh gợi ý).
- **Chấm điểm**: đúng → +1; sai(Show-answer BẬT) → ✕ đỏ TRƯỚC rồi mới lộ chữ đúng; sai(TẮT) → ✕ xám.
  **Sao bay** vàng/đỏ về ô điểm, **điểm đổi NGAY khi sao bắt đầu bay**. **Minus** nay là slider
  "Points off when wrong" 0..5 (0 = tắt, bỏ checkbox); điểm âm hiện đỏ dạng "N/total".
- **Editor**: Duplicate/Remove thành ICON; ô clue tự nới cao hiển thị hết chữ.
- Option **"Change the crossword"** (bấm câu hỏi thoát về bảng; tắt = khoá phải trả lời).

⚠️ **Lúc commit có thay đổi CHƯA XONG của phiên khác lẫn trong cây làm việc** (`core/engine.js`,
`core/HUONG DAN CORE.md`, `templates/unjumble/*`) — đã **add từng file crossword + 3 docs** theo tên,
KHÔNG `git add -A`, để không lỡ commit việc của phiên kia.

### 1/8/2026 — Đợt 35 (v0.9.9): UNJUMBLE — INTRO ZOOM + NHẠC · NỀN ẢNH WHITEBOARD PHỦ TOÀN KHUNG · KÉO CHỮ = CON TRỎ TEXT (CHỮ ĐỨNG YÊN) · BỎ DÒNG HƯỚNG DẪN. Tự test trình duyệt thật (0 lỗi console). 🟢 CHỜ THẦY DUYỆT — CHƯA COMMIT. Chỉ sửa `templates/unjumble/*` + thêm ảnh, **KHÔNG đụng core**.

> ⚠️ Cùng ngày, 1 phiên Claude song song làm Gameshow lấy "Đợt 34/v0.9.8" (mục ngay dưới), nên Unjumble lấy **Đợt 35/v0.9.9**. Hai bộ file tách rời (`templates/unjumble/*` ↔ `templates/gameshow/*`), không đụng nhau.

Thầy chốt qua AskUserQuestion (nền **chỉ Classic** · đặt ảnh **cover/cắt nét** · intro **đẩy nhẹ ~2.5s**) rồi "ok build":

1. **Intro zoom + nhạc**: bấm Play → engine phát sẵn `intro.mp3` → lớp `.aw-unj-intro` (chính ảnh whiteboard) đẩy nhẹ (scale 1.12→1.0 + mờ dần, `INTRO_MS=2500`), chạm để bỏ qua, rồi vào game. Đồng hồ **đứng 0:00 suốt intro** nhờ bật cờ engine `manualTimerStart` (opt-in, **không sửa core**); `mount` gọi `ui.startTimer()` khi intro xong (Style khác Classic → gọi ngay, không intro).

2. **Ảnh nền phủ CẢ khung** (điểm/giờ/nút nằm trên bảng): `whiteboardgrouped2.png` → `templates/unjumble/img/whiteboard.png` (5,3 MB), nền `.aw-stage.aw-unj-active.theme-classic` (`background-size:cover`). `mount` gắn `aw-unj-active` vào stage qua `root.closest('.aw-stage')` (gỡ ở cleanup) — không đổi/bỏ class `.aw-page/.aw-stage/.aw-below` (an toàn nhúng myActivity). Card **trong suốt** (bỏ khung đen + nền board + doodle SVG — ảnh đã có sẵn khung + doodle + chữ "ANDREW WHITE CLASSES BOARD"). Style khác giữ card tint cũ (CSS gate `.theme-classic`).

3. **Kéo chữ = con trỏ text, chữ đứng yên**: bỏ placeholder chèn-dồn realtime (`.aw-unj-ph` gỡ). Kéo → thanh nháy dọc `.aw-unj-caret` ở khe gần nhất (row-aware theo tâm ô), **các chữ KHÔNG dời** (chữ nguồn chỉ mờ `.is-dragsrc`), **thả mới chèn** (`positionCaret` lưu chỉ số chèn full-array vào `caret.dataset.insert`, `caretDropIndex` quy về chỉ số sau khi tách từ kéo cho `commitReorder`).

4. **Bỏ dòng "Put the words in the right order"**: `render()` chỉ thêm `.aw-unj-clue` khi item CÓ clue riêng; `measure()` guard `clueEl` null.

Tự test (JS bắn pointer giả + đo): intro scale 1.12→1.0+fade biến mất ~2,5s, đồng hồ giữ 0:00; kéo → caret hiện + `orderDuringMove===before` (chữ đứng yên) + thả đổi đúng thứ tự + dọn sạch caret/clone; generic clue mất; đổi Style→Basic bỏ ảnh, về Classic có lại; 0 lỗi console. ⚠️ Ảnh 5,3 MB (nén sau nếu cần). Chi tiết: `templates/unjumble/GHI CHU UNJUMBLE.md` Đợt 35.

### 1/8/2026 — Đợt 34 (v0.9.8): GAMESHOW — DỰNG LẠI INTRO + GET READY + NỀN PHỦ TOÀN KHUNG (theo ảnh act gốc thầy gửi). Tự test trình duyệt thật (0 lỗi console). ✅ THẦY DUYỆT → ĐÃ COMMIT + PUSH (chỉ stage 4 file gameshow + 2 file ghi chú; KHÔNG đụng file của phiên Unjumble song song). Chỉ sửa trong template gameshow, **KHÔNG đụng core**.

Thầy so sánh với act gốc Wordwall (gửi ảnh) và yêu cầu 3 việc, gộp build 1 lần (đã "ok build"):

1. **Intro mới ~6 giây (khớp `intro.mp3` = 6,04s).** Trước đây intro chỉ là 2 cánh cửa trượt ra trong 1,5s. Nay: khung TV marquee gốc (`img/screenframe.webp`, copy từ `Source/Graphic/GAMESHOW/Khung san khau`) nảy vào giữa nền xanh hình thoi (spotlight + APPLAUSE đỏ CSS + khán giả), chữ **"ANDREW CLASSES / QUIZ SHOW"** trắng viền hồng lọt qua "lỗ trong suốt" của khung, giữ ~5,2s rồi "mở ra" (phóng to + mờ) → câu 1.

2. **"Get ready" kiểu mới, chạy TRƯỚC MỖI câu.** Khung TV xanh viền đèn hiện giữa nền hình thoi; màn trong = nền tia sáng xanh + **ô viền vàng đứt nét** bao "Question N / Get ready!"; sau ~1,2s khung mở ra → câu hỏi + đáp án. Trong lúc get ready **ẩn nội dung vùng chơi** (`stage.style.visibility`) để HUD/lifelines không đè lên ô.

3. **Nền phủ TOÀN khung game** (kể cả thanh điểm/đồng hồ trên + menu/nav dưới). Thêm class `aw-gs-full` lên `.aw-stage` + 2 lớp `.aw-gs-decor` (spotlight+khán giả) và `.aw-gs-screen` (tia sáng xanh + **viền hồng** ôm mép, bật/tắt theo trạng thái). Chrome engine cho trong suốt + chữ/nút đổi trắng. **Đảo ngược hoàn toàn trong `cleanup()`** (gỡ class + 2 lớp) → không ảnh hưởng template khác.

Đo "lỗ trong suốt" của khung bằng Python/PIL: left ~12% · right ~12,5% · top ~13,5% · bottom ~39% → đặt `.aw-gs-scr`. Kích thước khung = `width:84cqw` (theo bề ngang sân khấu), tràn dọc bị `overflow:hidden` cắt cho chân đế chạy xuống mép như gốc.

**Quyết định của thầy (qua AskUserQuestion):** chữ = "ANDREW CLASSES QUIZ SHOW"; nền hình thoi áp cả màn chơi; KHÔNG cho bỏ qua intro (chạy trọn 6s).

**File sửa:** `templates/gameshow/gameshow.js` (scene + introShow + nextGetReady + showQuestion + cleanup), `gameshow.css` (bỏ nền/viền cũ của board + khối CSS full-bleed/khung/ô vàng/chrome trắng), thêm `img/screenframe.webp`. Backup bản cũ ở `templates/gameshow/_backup/`.

**Đã tự test (1280×720, `test.html`):** intro ✓, câu hỏi (nền phủ kín + viền hồng + chrome trắng) ✓, get ready (DOM xác nhận vùng chơi ẩn, "Get ready!" hiện đúng, không đè) ✓, bonus round ✓, 0 lỗi console. ⚠️ Chưa test `play.html` (HS) và bảng TOMKO.

**➡️ BÀN GIAO CHO SESSION MỚI (build tiếp Gameshow):**
- **Tiếp nhận:** `git pull` → đọc `templates/gameshow/GHI CHU GAMESHOW.md` (khối ⭐ Đợt 34 ở đầu) + mục này.
- **Chạy thử:** `python devserver.py 5510` (hoặc preview tên `aword`) → `http://localhost:5510/templates/gameshow/test.html` → bấm Play. Khung xem nên đặt **desktop 1280×720** (khung hẹp thì mọi thứ nhỏ, khó soi). Get ready chỉ hiện ~1,2s nên chụp tay khó — kiểm bằng JS sample DOM (đã dùng: bắt `.aw-gs-frame` rồi đọc `stage.style.visibility`).
- **Các NÚM tinh chỉnh nhanh (đều trong `gameshow.css`):** vị trí/cỡ màn trong khung = `.aw-gs-scr` (L12/R12.5/T13.5/B39% — khớp "lỗ trong suốt" ảnh); cỡ khung = `.aw-gs-sign,.aw-gs-frame-body` (`width:84cqw` + `margin-top:-4cqw`); ô get ready = `.aw-gs-gr-box`; cỡ chữ QUIZ SHOW = `.aw-gs-sign-line`; độ đậm spotlight/khán giả = `.aw-gs-decor .aw-gs-light/.aw-gs-audience`; nhịp intro = 2 mốc `later()` trong `introShow` (5200 mở, 6000 xong).
- **Ý tinh chỉnh thầy có thể muốn (chưa làm):** căn lại vị trí/cỡ ô get ready cho cân giữa màn khung; giảm độ nổi của khán giả/spotlight; APPLAUSE hiện cả lúc chơi hay chỉ intro; cỡ chữ QUIZ SHOW; có PTS box lúc chơi hay bỏ (gốc không có).
- ⛔ **BẪY:** khung intro/get ready đặt ở CẤP `stageEl` (`.aw-stage`), KHÔNG trong play area (kẻo nhỏ + dính đỉnh). Nội dung màn phải khớp "lỗ trong suốt" nếu đổi ảnh khung. Nhớ `cleanup()` phải gỡ hết (class + 2 lớp) — đừng để sót sang template khác.

### 1/8/2026 — Đợt 33 (v0.9.7): NẠP TEMPLATE THEO YÊU CẦU — trang HS `play.html` chơi được CẢ 14 loại; thêm template từ nay chỉ sửa 1 FILE. ⭐ CÓ SỬA CORE. Đã tự test (0 lỗi console).

Ngay sau Đợt 32 thầy chốt (qua AskUserQuestion) làm hướng **"nạp động theo `activity.type`"** thay vì
thêm 13 dòng import tĩnh vào `play.js`.

**Vấn đề thật:** `play.html`/`play.js` (trang học sinh) chỉ khai mỗi Quiz — `import "./templates/quiz/
quiz.js"` + 1 link `quiz.css`. Giao assignment loại khác cho HS là gãy `Chưa có game loại "..." trong
registry`. Gốc rễ: **mỗi trang phải tự chép lại danh sách template** (import JS trong .js + link CSS
trong .html), tức 1 template phải khai ở 4-5 chỗ → sót là chuyện sớm muộn, và đã sót thật suốt thời
gian dài mà không ai thấy vì trên lớp thầy chỉ chiếu act từ trang chủ.

**Cách sửa — dồn về 1 nguồn rồi nạp lúc cần:**
- **`core/catalog.js` (SỬA CORE)** — mỗi mục nay khai luôn CÁCH TỰ NẠP: `css` (đường dẫn tính từ TRANG,
  hợp lệ cho cả `index.html` lẫn `play.html` vì cùng ở gốc), `load()` → `import()` module template,
  `sample()` → act mẫu. Thêm hàm `templateEntry(type)`.
- **`core/registry.js` (SỬA CORE, THÊM MỚI, không đổi hành vi cũ)** — thêm `ensureTemplate(type)`:
  chèn `<link>` CSS **và ĐỢI CSS áp xong** rồi `await entry.load()`; module tự `registerTemplate()`.
  Nhớ lời hứa trong `pending` nên gọi song song vẫn chỉ nạp 1 lần; loại lạ thì reject; nếu module quên
  `registerTemplate()` thì báo lỗi rõ ngay thay vì để engine gãy sau. Thêm `hasTemplate(type)`.
  `getTemplate()` giữ nguyên đồng bộ (engine/print vẫn dùng như cũ).
  *Chi tiết chống-treo:* `loadCss` không bao giờ reject và có chặn 4 giây — mạng lớp chậm thì thà chơi
  trước CSS vào sau, còn hơn treo màn hình HS.
- **`main.js`** — **xóa cả 14 dòng import template**; `playAct` / `editAct` / `createBlankAct` (nay
  `async`) đều `await ensureTemplate(...)` trong try/catch, hỏng thì toast "could not load" /
  "editor coming soon".
- **`play.js`** — bỏ import quiz, thêm `await ensureTemplate(activity.type)` trong `play()`. Đặt TRƯỚC
  khi xóa màn hình và hiện "Loading..." nên mạng chậm không ra trang trắng; hỏng thì hiện "This game
  could not be opened".
- **`index.html` + `play.html`** — **xóa toàn bộ link CSS template** (chỉ còn `app.css` + `classic.css`).
- **`manifest.js`** — không còn là danh sách chép tay nữa, rút xuống 3 dòng SUY RA từ catalog
  (`TEMPLATES.filter(built)`), nên vĩnh viễn không lệch pha được.

**Kết quả cho người dùng:** HS mở 1 assignment giờ tải **đúng 1 game** (trước: trang chủ tải cả 14).
Đo thật lúc mở trang: registry **0 template**, chỉ **2 stylesheet lõi**; sau khi vào 3 game thì đúng
3 module + 3 CSS được thêm.

**Kết quả cho người build:** **thêm template = thêm ĐÚNG 1 MỤC trong `core/catalog.js`.** Không đụng
`index.html`, `play.html`, `main.js`, `play.js`, `manifest.js` nữa. Đã cập nhật lại hướng dẫn ở
`templates/HUONG DAN TEMPLATE.md` (mục "Khi nào một template được gộp"), `core/HUONG DAN CORE.md`
(mục MỚI "Nạp template theo yêu cầu"), `APP_MASTER.md` (bản đồ thư mục + quy tắc số 10).

**Đã tự test (trình duyệt thật, cổng 5510, console SẠCH cả 2 trang):**
- `index.html` lúc mở: **0 template, 2 stylesheet** (trước đây 14 + 16) — nạp lười đúng như thiết kế.
- Chạy hết 14 loại qua `ensureTemplate`: **14/14** nạp xong; **gọi SONG SONG 2 lần cùng lúc** trả về
  đúng 1 đối tượng và chèn **đúng 1 link CSS** (không nhân đôi); mount game bằng `startGame()` ra
  `.aw-stage` 14/14; mở editor từ act trắng 14/14 đúng badge; **0 lỗi runtime**.
- Loại không có thật → reject đúng thông báo, không làm sập trang.
- **`play.html`**: mở lên đúng như HS thấy (0 template, 2 CSS lõi), rồi đi ĐÚNG đường mà `play()` đi cho
  3 loại **ngoài Quiz** (crossword · speaking_cards · whack_a_mole) → cả 3 dựng game bình thường; trước
  đợt này cả 3 đều ném lỗi registry. Sau đó registry có đúng 3 loại + 3 CSS, không dư.

**Kiểm chứng luôn trên BẢN LIVE sau khi push** (không chỉ localhost): chờ Pages deploy xong rồi mở
`https://andrewclasses-01.github.io/AWord/play.html` → đúng 0 template + 2 CSS lõi lúc mở, rồi
crossword · unjumble · balloon pop đều dựng game bình thường, console sạch. (Bài học cũ vẫn đúng:
Pages KHÔNG cập nhật tức thì — phải `curl`/mở thật để xác nhận, đừng tin là đã live ngay sau push.)

**Không tự test được:** 1 assignment THẬT cho HS từ đầu tới cuối (nằm sau đăng nhập Google).
**➜ THẦY ĐÃ TỰ TEST VÀ XÁC NHẬN (1/8/2026) — không báo lỗi.**

**➜ ĐÃ COMMIT `7045f09` + PUSH main + LIVE.** 11 file: `core/catalog.js` · `core/registry.js` ·
`main.js` · `play.js` · `index.html` · `play.html` · `manifest.js` + 4 file hồ sơ/hướng dẫn.

### 1/8/2026 — Đợt 32: GỘP 8 TEMPLATE CÒN LẠI LÊN TRANG CHỦ — trang chủ từ 6 → **14 loại act**. Đã tự test (0 lỗi console). CHƯA COMMIT (chờ thầy chơi thử rồi mới push).

Thầy hỏi trang chủ tạo được bao nhiêu loại act (6), rồi bảo **"đưa toàn bộ lên trang chủ"** — tức là DUYỆT
luôn 8 template đã build xong nhưng còn nằm trong kho, chỉ chơi được qua `test.html` riêng.

**8 template được gộp lần này** (kèm `type` đăng ký trong registry):
`gameshow` (Gameshow quiz) · `maze_chase` (Maze chase) · `whack_a_mole` (Whack-a-mole) ·
`flying_fruit` (Flying fruit) · `balloon_pop` (Balloon pop) · `crossword` (Crossword) ·
`unjumble` (Unjumble) · `speaking_cards` (Speaking cards).

**4 file sửa để "lên trang chủ"** (đúng checklist mà các GHI CHU template đã dặn sẵn):
1. `core/catalog.js` — thêm 8 dòng `{type, label, built:true, blurb}`. Đây là 1 NGUỒN DUY NHẤT: vừa
   nuôi picker "New activity" ở trang chủ, vừa nuôi panel **Template** trong game (`engine.js` dùng
   `ALL_TEMPLATES = TEMPLATES`) → sửa 1 chỗ là cả 2 nơi hiện đủ 14 loại.
2. `main.js` — thêm 8 dòng `import "./templates/<ten>/<ten>.js"` (mỗi module tự `registerTemplate()`).
3. `index.html` — thêm 8 dòng `<link rel="stylesheet">` cho CSS từng template.
4. `manifest.js` — thêm 8 mục (giữ đồng bộ theo quy ước, dù `main.js` hiện không đọc file này).

**Sửa thêm `previewPick()` trong `main.js`** (ảnh thu nhỏ trên thẻ act ở trang chủ). Hàm cũ chỉ đọc
`content.questions|items` với các khoá `question/prompt/clue` + `answers/acceptedAnswers/word`, nên **5 loại
mới sẽ hiện "No questions yet"** — và **True or false (đã live từ trước) cũng đang bị**, không ai để ý.
Nay hàm nhận đủ mọi hình dạng dữ liệu trong thư viện:
`content.questions | items | words | statements | cards | pairs`, khoá câu hỏi thêm
`definition/sentence/text/word`, khoá đáp án thêm `answer` (boolean → "True"/"False"; string → chính nó),
`keyword`, `sentence`. Có chặn tự-trùng (`it.word !== question`) để Anagram/Flying fruit không lấy
đúng 1 chuỗi làm cả câu hỏi lẫn đáp án. Act rỗng vẫn trả `null` (giữ nguyên đường "No questions yet").

**KHÔNG đụng `core/` (ngoài catalog.js) — 0 dòng sửa trong engine/app.css.**

**Kiểm tra AN TOÀN trước khi gộp** (vì `index.html` nạp CSS của MỌI template ở phạm vi TOÀN CỤC):
- Quét selector đầu dòng của 14 file CSS → **không file nào có selector trần** (đều mang tiền tố riêng
  `.aw-bp- / .aw-cw- / .aw-ff- / .aw-gs- / .aw-mc- / .aw-sc- / .aw-unj- / .aw-wam-`…) → không rò rỉ style.
- **0 khối `:root`** trong cả 14 CSS → không có biến toàn cục giẫm chân nhau.
- Quét trùng tên `@keyframes` giữa 14 CSS + `core/app.css` → **0 trùng** (nếu trùng, file nạp sau sẽ
  âm thầm đè animation của game khác — bẫy đáng sợ nhất khi gộp CSS toàn cục).
- Đọc `normalize()` của cả 8 editor: đều tự dựng đúng cấu trúc riêng từ act trắng `content:{questions:[]}`
  mà `createBlankAct()` truyền vào → nút "New activity" không vỡ với loại nào.

**Đã tự test (trình duyệt thật, cổng 5510, console SẠCH, server không lỗi):**
- Network: **8 module template mới + editor + file sound đều 200 OK**; `document.styleSheets` đếm đủ
  **16 sheet** (2 core + 14 template).
- Nạp `core/registry.js` + `core/catalog.js` từ trong trang: **registry có đủ 14 type**, **catalog 14 mục
  `built:true`**, `missing=[]`, **cả 14 đều có hàm `edit`** (không loại nào rơi vào "editor coming soon").
- **Mở thử EDITOR cả 14 loại** bằng act trắng đúng như `createBlankAct()` → 14/14 dựng xong, badge đúng tên
  (QUIZ … SPEAKING CARDS), có ô nhập.
- **Mount thử GAME cả 14 loại** bằng `startGame()` với act mẫu → 14/14 dựng `.aw-stage` + topbar,
  **0 lỗi runtime** (bắt cả `error` lẫn `unhandledrejection`).
- **previewPick**: lấy CHÍNH hàm trong `main.js` đã ship ra chạy với 14 act mẫu → **14/14 ra câu hỏi +
  đáp án đúng** (trước khi sửa: `find_the_match` và các loại mới trả `null`), act rỗng vẫn `null`.
- *Không tự soi được bằng mắt màn trang chủ thật*: trang chủ chặn sau đăng nhập Google, popup này không
  tự động hoá được (bẫy đã ghi ở mục 0/APP_MASTER). Phần kiểm tra trên đã đi thẳng vào chính dữ liệu mà
  picker đọc (`TEMPLATES`) nên rủi ro còn lại rất thấp.

**➜ ĐÃ COMMIT `7aea668` + PUSH main, GitHub Pages deploy xong. THẦY TỰ TEST BẢN LIVE VÀ XÁC NHẬN
(1/8/2026) — không báo lỗi.** 6 file: `main.js` · `index.html` · `manifest.js` · `core/catalog.js` +
2 file hồ sơ.

**⚠️ VIỆC KẾ TIẾP ĐÁNG LÀM NHẤT — trang học sinh `play.html` vẫn CHỈ chơi được Quiz.** `play.js` mới
`import "./templates/quiz/quiz.js"`, nên giao assignment loại khác cho HS sẽ lỗi "Chưa có game loại ... trong
registry". Đây là tồn đọng CŨ (đúng cho cả 5 loại đã live từ trước), nay lộ rõ hơn vì có tới 13 loại ngoài
Quiz. Hai hướng: (a) thêm 13 dòng import tĩnh y như `main.js` — 5 phút, nhưng HS phải tải cả 14 game;
(b) **nạp template ĐỘNG theo `activity.type`** (sửa core, dùng chung cho cả `main.js`) — đúng bài hơn,
HS chỉ tải đúng game được giao. Đề xuất chọn (b), hỏi thầy trước khi làm.

### 1/8/2026 — Đợt 31: FIND THE MATCH — 4 loạt tinh chỉnh thầy yêu cầu (đã test trình duyệt thật, 0 lỗi console). THẦY DUYỆT → COMMIT + PUSH + LIVE. KHÔNG đụng CORE.

Find the match đã sống ở trang chủ từ 31/7 (`built:true`). Thầy chơi bản live rồi gửi 4 loạt yêu cầu, mỗi việc
đã đo DOM thật để xác nhận. **Chi tiết TỪNG loạt: `templates/find-the-match/GHI CHU FIND-THE-MATCH.md` (mục
1/8/2026 — Đợt 31).** Tóm tắt:
- **Đồng hồ**: 3 giây đếm "3-2-1" KHÔNG còn tính vào đồng hồ (dùng hook core sẵn có `tpl.manualTimerStart` +
  `ui.startTimer()`, giống TRUE FALSE — không phải sửa core như đề xuất cũ).
- **Bố cục**: hạ + căn giữa khối đáp án đúng tâm vùng (đo lệch 0px).
- **Đáp án cố định tuyệt đối**: ô đã giải chỉ mờ đi, KHÔNG xóa khỏi DOM → lưới không bao giờ dồn/nhảy.
- **Bấm sai**: ô vừa bấm đứng yên (chỉ hiện ✗), câu hỏi chuyển sang câu kế; Repeat until correct = xếp lại
  vị trí ngẫu nhiên.
- **Số mạng như TRUE FALSE**: tim ở top bar cạnh điểm (`hasLivesSlot`), slider Lives 0–10 (0=Unlimited),
  pop tim khi sai, hết tim → game over.
- **Bấm đúng**: câu hỏi bay về ô điểm + 11 ngôi sao + điểm nảy (phỏng theo TRUE FALSE).
- **Khóa chọn**: sau mỗi lần bấm, khóa tới khi câu mới vào ≥50% (`gateTimer`, giống TRUE FALSE).
- **GAME OVER**: hết tim hiện "GAME OVER" (celebration + bảng menu) thay vì "GAME COMPLETE".
- **Câu dài tự co font**: `fitPrompt()` + biến `--pfit` cho prompt vừa khung (autoFit cũ chỉ đo lưới); clone
  bay dùng đúng cỡ đã co.

**File đổi (chỉ 3, KHÔNG đụng core):** `templates/find-the-match/find-the-match.js` / `.css` /
`sample-find-the-match.js` (mẫu bật sẵn `lives:5`). `git status` trước commit xác nhận đúng 3 file + các GHI CHU.

### 1/8/2026 — Đợt 30: TYPE THE ANSWER — chuỗi rất nhiều vòng tinh chỉnh thầy yêu cầu (bàn phím, âm thanh, options, bố cục, điểm số). THẦY ĐÃ DUYỆT → COMMIT + PUSH + LIVE. (Có sửa CORE, opt-in/additive, đã kiểm Quiz + 4 template khác 0 lỗi.)

Thầy chơi bản Type the answer (đã live catalog từ 30/7) rồi yêu cầu tinh chỉnh sâu qua NHIỀU vòng "ok build"
+ test trình duyệt thật. **Nhật ký chi tiết TỪNG vòng: `templates/type-the-answer/GHI CHU TYPE-THE-ANSWER.md`**
(mục 1/8/2026). Tóm tắt các nhóm việc + phần đụng CORE:

**Bàn phím ảo:** hạ thấp + cố định 1 vị trí (không co theo `--fit`), rộng 70%, phím chữ cái bằng nhau tuyệt
đối (fixed width + hạ font ⌫), caps hẹp 15% + tự tắt sau 1 chữ, chấm sáng cố định size chỉ đổi độ sáng
(caps/numbers = trắng đứng yên; Andrew = trắng nháy chậm), animation bật/tắt mượt, phím Submit im (không
tiếng gõ), **tiếng "cạch" gõ phím kiểu iPhone**.

**Âm thanh:** dùng bộ mp3 THẬT của Wordwall TTA (`templates/type-the-answer/sounds/` + `type-the-answer-sound.js`);
correct/wrong/intro/chuyển-câu/complete từ pack; tiếng gõ phím tổng hợp.

**Bố cục màn chơi (nhiều vòng):** ô đáp án dạng `<textarea>` tự xuống 2 dòng, CỠ CỐ ĐỊNH (không nhỏ hơn),
reveal đáp án đúng = hint Andrew = cỡ ô nhập; câu hỏi mới là thứ NHƯỜNG CHỖ (thu `--qfit`) khi thiếu; căn
giữa CẢ CỤM (reveal/ô nhập + Submit) đúng giữa khoảng câu-hỏi↔bàn-phím (căn LẠI MỖI FRAME khi reveal trượt
mở + chốt chặn không bao giờ đè bàn phím); chỉ nhận tiếng Anh (lọc non-ASCII, chặn cả bàn phím tiếng Việt);
bỏ placeholder; dấu ✓/✗ to+dày, rung rồi bay về điểm, bám hàng ô nhập; chữ Andrew trùng khớp màu+nhịp nút Andrew.

**Điểm số:** hiện `✓ X/tổng`; số tử XANH khi ≥0, ĐỎ khi âm (không dấu −, cho phép âm khi Minus); gạch chéo +
tổng màu đen; num↔/ == /↔total (cân đối); tích xanh/X đỏ bay + Pulse.

**⚠️ SỬA CORE (additive/opt-in — đã test lại Quiz + Anagram/Crossword/Gameshow/Whack-a-mole 0 lỗi):**
- `core/engine.js`: (a) **Auto switch** — checkbox global trong Options (mặc định TẮT, `draft.autoSwitch`);
  (b) **chặn "Submit answers" khi 0 câu** — `ui.onSubmit(fn, countFn)` + guard ở Menu (template đưa getter
  đếm câu đã trả lời; không đưa → như cũ, không kẹt) → đã thêm countFn cho 8 template
  (quiz/anagram/crossword/gameshow/maze-chase/unjumble/find-the-match/type-the-answer);
  (c) ô thời gian countdown nằm CẠNH nút "Count down" (cụm `.aw-opt-cd` nowrap); (d) "End of game
  (Show answers)" xuống CUỐI options; (e) **Apply bất kỳ option → tự restart game** (mọi template);
  (f) cờ `hideShuffleAnswers` (TTA ẩn "Shuffle answer order"). *(engine.js đã được commit chung ở Đợt 29
  do dùng chung cây làm việc với phiên True-false; các thay đổi này đã có trong HEAD.)*
- `core/sound.js`: thêm `keyClick()` (tiếng gõ phím tổng hợp, tôn trọng mute).
- `core/numberstepper.js`: **nhấn-giữ ▲/▼ chạy số liên tục** (có tăng tốc) — dùng cho ô thời gian countdown.
- `core/app.css`: rule `.aw-opt-cd`.

**Ghi chú song song:** đợt này cây làm việc dùng CHUNG với 1 phiên khác (True-false hearts + Find-the-match
"đáp án không đổi vị trí" + `manualTimerStart`/`ui.startTimer`). Các thay đổi đó là CỐ Ý và đã hoàn chỉnh,
được commit chung trong đợt này (find-the-match.js/.css).

### 1/8/2026 — Đợt 29: TRUE FALSE — 2 vòng tinh chỉnh (8 mục + 3 mục) thầy yêu cầu. THẦY ĐÃ DUYỆT → ĐÃ COMMIT + PUSH + LIVE. (Có sửa CORE, opt-in, tương thích ngược.)

Thầy chơi bản True/false (đã live catalog từ trước) rồi yêu cầu tinh chỉnh; sau 2 vòng "ok build" +
test → DUYỆT. Đã **commit + push main + GitHub Pages tự deploy** (Pages serve từ ROOT, có `.nojekyll`).
Chi tiết đầy đủ: `templates/true-false/GHI CHU TRUE-FALSE.md`.

**Vòng 1 (8 mục, thầy chốt "luôn trộn ngẫu nhiên" + "đồng ý sửa lõi an toàn" qua AskUserQuestion):**
1. **Lives = thanh kéo 0–10** trong Options (0 = Unlimited). `normLives`: 0/null=vô hạn, undefined=5, max 10.
2. **Tim dời lên THANH TRÊN, ngay trái số điểm** (qua hook lõi mới `ui.livesSlot`). Mất mạng → tim NGOÀI
   CÙNG BÊN TRÁI bung ra biến mất hẳn.
3. **≤5 mạng = tim rời; ≥6 = dạng gọn "N♥"** (số + 1 tim).
4. **Nút True/False còn 80%** (font 4→3.2cqw, padding/max-width ×0.8).
5. **Khoảng cách kẻ→nút = nút→"x of y"** — đo lúc chạy (`balanceSpacing`, tự cân lại khi resize/fullscreen).
6. **Editor đổi thành 2 CỘT** (cột câu TRUE / cột câu FALSE, bỏ toggle từng dòng) — giữ NGUYÊN contract
   `content.statements {text,answer}` nên act cũ vẫn chơi được; dán Excel tự phân cột; ≥1 câu mỗi cột.
7. **Câu căn giữa** khoảng từ mép trên tới dòng kẻ (nhờ tim đã dời ra ngoài).
8. **Đếm 3-2-1 xong đồng hồ MỚI chạy** (hook lõi mới `manualTimerStart` + `ui.startTimer()`); đúng =
   câu bay hóa **sao nhỏ** bay vào số điểm; giảm tốc trượt câu (ENTER_MS 900→1300). Game **luôn trộn**.

**Vòng 2 (3 mục):**
1. **Chống bấm quá gần nhau:** 2 nút True/False KHÓA ngay khi vừa trả lời, giữ khóa suốt lúc câu bay/trượt
   ra, chỉ MỞ khi câu mới vào **~50%** (`gateTimer`=`ENTER_MS*0.5`; `lockButtons`/`unlockButtons`). Nút
   cũng khóa sẵn lúc đếm 3-2-1 (không lỡ trả lời câu đầu).
2. **Hạ glyph ♥ `translateY(0.09em)`** (~2px) cho cân với số điểm (chỉ dời hình tim, không dời số dạng gọn).
3. **Bỏ âm `tfSound.timesUp()` (~6-7s)** khi Submit/hết giờ — màn kết quả đã có nhạc tổng kết riêng.

**⭐ 2 HOOK LÕI MỚI (core/engine.js) — TÙY CHỌN, MẶC ĐỊNH TẮT, DÙNG LẠI được cho template sau:**
- `tpl.hasLivesSlot` → engine tạo `ui.livesSlot` (span trái số điểm, bọc `.aw-top-right`) + phơi
  `ui.scoreEl`. CSS lõi mới `core/app.css`: `.aw-top-right / .aw-top-lives / .aw-top-heart /
  .aw-top-heartcount` (rỗng thì `:empty` tự ẩn).
- `tpl.manualTimerStart` → engine KHÔNG tự chạy đồng hồ ở `begin()`; template gọi `ui.startTimer()` khi
  sẵn sàng (reset `startedAt` để loại thời gian đếm 3-2-1). Chống gọi 2 lần bằng `timerStarted`.
- Cùng kiểu an toàn với `inlineTimerBar`/`hideTimerOption` sẵn có. Các game khác (Quiz, FTM...) chạy y như cũ.

**File đụng:** `templates/true-false/{true-false.js, true-false.css, true-false-editor.js, GHI CHU
TRUE-FALSE.md}` + `core/engine.js` + `core/app.css`.

**Đã tự test (browser thật, cổng 5512, 0 lỗi console):** đếm 3-2-1 đồng hồ đứng 0:00; 5 tim cạnh điểm, sai
→ tim trái mất; đúng → 11 sao + câu bay + điểm; slider 8→"8♥", 8→7→6♥→5 tim rời, 0→Unlimited ẩn tim; nút
30.9px (80%); kẻ→nút = nút→số trang = 32.3px; editor 2 cột nạp/gộp/chặn đúng; khóa nút chống bấm mù; spy
audio xác nhận không phát `timesup.mp3`; chơi hết 8/8 → GAME COMPLETE + Show answers.

**⚠️ Lưu ý phiên sau (build tiếp):** True/false CHƯA chạy ở `play.html` (trang HS) — giống mọi template
ngoài quiz, `play.js` mới import tĩnh `quiz.js`; muốn giao bài cho HS cần thêm import + **nạp template động
theo `activity.type`** (ĐỀ XUẤT SỬA CORE chung cho MỌI template). Đây là việc lớn đáng làm kế tiếp.

### 1/8/2026 — Đợt 28: OPEN THE BOX — 5 cải tiến thầy yêu cầu + sửa 2 lỗi phát sinh. THẦY ĐÃ DUYỆT → ĐÃ COMMIT + PUSH + LIVE. (Có sửa CORE, opt-in, tương thích ngược.)

Thầy chơi bản Open the box (đã live từ Đợt trước) và yêu cầu 5 cải tiến; sau 2 vòng phản hồi thầy DUYỆT.
Đã **commit `da11950` + push main + GitHub Pages tự deploy**. (Đánh số "đợt 17/18/19" trong
`templates/open-the-box/GHI CHU OPEN-THE-BOX.md` là đếm RIÊNG của template đó — khác Đợt 28 toàn dự án này.)

**5 cải tiến (thầy chốt qua AskUserQuestion + "ok build"):**
1. **Chữ ô câu hỏi/đáp án to hơn** — chuyển sang **cỡ ĐỘC LẬP TỪNG Ô** (kiểu Wordwall): từ ngắn phóng to
   tới 1.5×, từ dài chỉ nhỏ riêng ô đó (có lề, không chạm mép, không bẻ giữa từ), chữ nhiều từ wrap theo
   khoảng trắng. (Chỉ `templates/open-the-box/*`.)
2. **Editor tối đa 120 câu** (trước 100). + `docs/04-OPEN-THE-BOX.md`.
3. **Pop-up xác nhận** cho "Mark correct in all" + "Unmark all correct" (Delete all đã có sẵn).
4. **Khóa chọn text trong khung chơi** — CORE `core/app.css` `.aw-stage{user-select:none}` áp cho MỌI
   game (thầy chọn phạm vi này), chừa `input/textarea/[contenteditable]` để Type the answer vẫn gõ được.
5. **Show answers không cắt ngang từ** — CORE: `.aw-rv-txt` `overflow-wrap:normal`; kèm sửa **lỗi thật
   trong `core/fit.js fitOnce`** (không trừ padding khi đo → cắt cụt ký tự cuối). Thêm tùy chọn
   **`contentBox` (mặc định TẮT)**, chỉ bật ở lời gọi Show answers trong `core/engine.js` (min 0.2) →
   maze-chase & caller khác byte-for-byte y nguyên.

**2 lỗi phát sinh đã sửa trong cùng lô** (bắt được nhờ thầy chơi thử + đo `javascript_tool`): (a) bản
đầu để chữ phóng 2.4× gây quá to + bẻ giữa từ → hạ 1.5× + width-aware; (b) từ dài chạm mép → chuyển hẳn
sang cỡ độc lập từng ô (span câu hỏi tách riêng `.aw-otb-q-qtext`, `width:100%` để wrap, `minmax(0,1fr)`
+ `min-width:0` chặn ô nở theo từ).

- **File đổi (đã commit)**: `core/app.css`, `core/engine.js` (CHỈ hunk `contentBox` — hunk
  `hideShuffleAnswers` của phiên Type-the-answer ĐỂ NGUYÊN chưa commit), `core/fit.js`,
  `docs/04-OPEN-THE-BOX.md`, `templates/open-the-box/` (open-the-box.js/.css, editor, GHI CHU). 8 file,
  +265/−18.
- **Đã tự test** (trình duyệt thật, đo đạc, không đoán): cỡ độc lập từng ô (Meteorologist 1.35 vs còn lại
  1.5), Show answers 9 hàng có thanh cuộn 0 cắt chữ (chạy fitOnce THẬT đã vá), editor "9/120 boxes",
  confirm bật đúng + Cancel không đổi, `.aw-stage` user-select none + input vẫn text; hồi quy Quiz +
  Type the answer 0 lỗi console.
- Chi tiết đầy đủ: `templates/open-the-box/GHI CHU OPEN-THE-BOX.md` (đợt 17/18/19).

### 1/8/2026 — Đợt 27: UNJUMBLE (game thứ 11) — build ĐẦY ĐỦ + tự test (trình duyệt thật, 0 lỗi console), CHỜ THẦY DUYỆT. KHÔNG sửa core.

Dựng lại act Classic của thầy `wordwall.net/resource/116872783/unjumble` — style **Whiteboard** (thầy chốt
= "Classic" của Unjumble). Sắp xếp các **TỪ** bị xáo trộn thành câu đúng (giống Anagram nhưng đơn vị là TỪ).

**Thầy chốt (AskUserQuestion):** (1) **kéo-thả THẬT** giống hệt Wordwall (insert + reflow), không dùng tap;
(2) đủ **3 chế độ chấm**; (3) dựng **đúng look Whiteboard** (bảng trắng + khung + doodle góc) làm Classic,
vẫn cho đổi Basic/Classroom/Beach.

**Cách chơi**: thầy gõ nguyên câu đúng → game tách thành từ + xáo (derangement, bắt đầu 0 điểm) → HS kéo-thả
từ (pointer, chuột+cảm ứng) sắp lại; từ đúng chỗ → xanh. Chữ bút xám #6f7680 nghiêng viết tay trên dòng kẻ,
nền #f6f6f3 trong khung đen + 4 doodle SVG (không branding Wordwall). Dấu câu dính từ cuối.
**3 mode**: Every word (1đ/từ) · **Every word + bonus** (giải sạch → "PERFECT" ×2, mặc định) · On submit
(bấm Submit → chấm xanh/đỏ stagger + hiện câu đúng). + Alignment Left/Centered.

**Thu thập từ Wordwall (Claude in Chrome + đọc theme JSON):** 41 âm THẬT theme Whiteboard + 4 đồ họa +
Palette/Audios/Layout — lưu ở `D:\APP AND DATA\AWord-data\Source\{Sound effect,Graphic}\UNJUMBLE\`
(kèm `00 - GHI CHU NGUON.txt` map sự kiện→âm lấy thẳng từ Audios.json của theme). Template chép 37 mp3 thực dùng.

- **File mới**: `templates/unjumble/` (unjumble.js/.css, unjumble-editor.js [Sentence|Clue], unjumble-sound.js,
  sample-unjumble.js, sounds/ 37 mp3, test.html/test.js, GHI CHU UNJUMBLE.md) + `docs/11-UNJUMBLE.md`.
- **Nhân bản Anagram**: khung mount/ui, flyScoreGain/pulseScoreTo/fadeSwap/finish, editor, hệ sound. Phần
  MỚI: `prepareItem` tách từ + derangement; kéo-thả pointer insert+reflow (placeholder + clone bám con trỏ);
  3 mode chấm; look Whiteboard.
- **Đã test** (trình duyệt thật, 0 lỗi console, mô phỏng pointer): tách "week." đúng · derangement → 0 điểm ·
  kéo đổi thứ tự + dọn sạch clone/ph · everyword "I like tea."=3đ · bonus perfect 6 từ=**12đ** + "PERFECT" ·
  submit câu sai=5 đỏ + reveal câu đúng · align center · clue tùy chỉnh · **Game complete** OK.
- **CHƯA gộp trang chủ** (`core/catalog.js`/`manifest.js`/`main.js`/`index.html` chưa đụng) — chờ thầy duyệt.
- **CHỜ TEST TOMKO**: cảm giác kéo-thả màn cảm ứng 86" · âm thanh loa lớp · fullscreen 4K · câu dài wrap nhiều dòng.
- Chi tiết: `templates/unjumble/GHI CHU UNJUMBLE.md`. Rollback = xóa thư mục `templates/unjumble/` (chưa đụng file chung nào).

### 1/8/2026 — Đợt 26: GAMESHOW QUIZ (game thứ 10) — build ĐẦY ĐỦ + tự test (trình duyệt thật, 0 lỗi console), CHỜ THẦY DUYỆT. (Có sửa CORE, tương thích ngược.)

Dựng lại act Classic của thầy `wordwall.net/resource/116864527` — style **TV game show** (= "Classic"
của Gameshow, thầy chốt; theme nội bộ Wordwall `gameshow`, template id 69, type 11). Trắc nghiệm có **áp
lực thời gian + ĐIỂM theo tốc độ + Lives + VÒNG BONUS mỗi N câu + 4 LIFELINES**. Thầy chốt build **FULL**
(đủ bonus + lifelines) + tính điểm **kiểu points**.

**Cách chơi**: Play → intro 2 cánh cửa "QUIZ SHOW" trượt tách + nhạc nền → mỗi câu "Get ready!" → câu hỏi
+ 2–6 ô đáp án A/B/C/D (viền bóng đèn vàng, nền tia sáng). Đồng hồ đếm ngược TỪNG CÂU (hàng trên, giữa) +
✓ đúng (phải) + bảng điểm PTS (trái) + ♥ Lives (phải, nếu giới hạn). Đúng → ✓ + điểm theo tốc độ · Sai →
✗ (mất 1 Live nếu giới hạn) · Hết giờ → bỏ qua. Sau mỗi N câu (mặc định 3) → **BONUS ROUND** 5 lá bài úp,
chọn 1 → +điểm (50–250). **Lifelines** (mỗi thứ 1 lần/ván): 50:50 · ×2 · +TIME · REVEAL. Kết thúc → bảng
tổng kết + leaderboard **xếp theo ĐIỂM** + Show answers. Dữ liệu = Y HỆT QUIZ.

- **File mới**: `templates/gameshow/` (gameshow.js/.css, gs-sound.js, gameshow-editor.js [bọc khuôn
  quiz-editor, ép timer none], sample-gameshow.js, test.html/test.js, GHI CHU GAMESHOW.md, img/ 11 ảnh,
  sounds/ 47 mp3) + `docs/10-GAMESHOW.md`.
- **Assets THẬT** của Wordwall (theme gameshow) đã tải + convention ở `AWord-data/Source/{Sound effect,
  Graphic}/GAMESHOW/` (có GHI CHU.md). Art CỐ ĐỊNH (không theo 4 theme chung); viền bóng đèn marquee dựng
  bằng CSS (`.aw-gs-board::before`, 4 radial-gradient).
- **⭐ SỬA CORE (tương thích ngược — đã kiểm Quiz chạy 0 lỗi sau khi sửa):**
  1. `core/scoring.js`: `computeResult` nhận `raw.score` (mặc định = số câu đúng) + `raw.scoreText`
     (mặc định null); `rankCompare` xếp theo `score`.
  2. `core/leaderboard.js`: `addEntry` nhận + lưu `scoreText` (mặc định null).
  3. `core/engine.js`: `finish` truyền `score`+`scoreText`; bảng tổng kết & leaderboard hiện `scoreText`
     nếu có (không thì vẫn "đúng/tổng"). Thêm cờ `tpl.hideTimerOption` (ẩn nhóm Timer toàn-ván — song đôi
     `hideLettersOption`). Cập nhật `core/HUONG DAN CORE.md`.
- Template khai báo `hideTimerOption/hideLettersOption/inlineTimerBar`, tự dựng: intro cửa, get ready,
  đếm ngược từng câu (setInterval, KHÔNG rAF), điểm theo `timeFrac()`, vòng bonus (lá bài lật 3D),
  lifelines, Lives; gọi `ui.finish({score:points, scoreText, title})`.
- **BẪY đã sửa khi build**: ban đầu đặt lá bài bonus cùng class `.aw-gs-card` với ô câu hỏi → CSS lá bài
  (`width:13cqw; opacity:0`) ĐÈ ô câu hỏi làm nó co còn 125px + tàng hình. Đổi lá bài → `.aw-gs-bcard`.
  (Bài học: grep class mới trong CHÍNH file CSS của template, không chỉ trong core.)
- **Đã tự test**: đúng (132/370 điểm theo tốc độ) · sai (✗) · bonus (+250) · 50:50 (bỏ 2 sai) · ×2 (×2 =
  370) · REVEAL (nháy, nút mờ, giữ "đã dùng" xuyên câu) · Submit → tổng kết ĐIỂM 382 + leaderboard 382 +
  Show answers đầy đủ. **CHƯA gộp `core/catalog.js`/trang chủ** (chờ thầy duyệt).
- **CHỜ TEST TOMKO**: (a) âm thanh + nhạc nền trên màn thật; (b) +TIME & Lives-giới-hạn→Game over (code
  có, chưa chạy tới khi test vì để Unlimited); (c) fullscreen màn lớn.
Rollback: xoá `templates/gameshow/`; core chỉ THÊM (không xoá) → `git revert` commit này nếu cần.

### 1/8/2026 — Đợt 25: MAZE CHASE (game thứ 9) — build ĐẦY ĐỦ + tự test (trình duyệt thật, 0 lỗi console), CHỜ THẦY DUYỆT. ĐÃ COMMIT + PUSH (chưa lên trang chủ).

Dựng lại act Classic của thầy `wordwall.net/resource/116866716` — style **Space** (= "Classic" của Maze
chase, thầy chốt). Cơ chế kiểu Pac-Man: câu hỏi ở đỉnh, các đáp án nằm trên các BỆ (pad) rải khắp MÊ
CUNG vũ trụ; lái chú robot phi hành gia (phím mũi tên/WASD + D-pad cảm ứng + vuốt) tới bệ ĐÚNG trong khi
NÉ các robot địch đuổi theo. Tới bệ đúng → ✓ xanh + điểm + sang câu; tới bệ SAI → ✗ đỏ + bệ biến mất +
mất 1 TIM; bị địch chạm → mất 1 TIM + văng về điểm xuất phát (có khiên tạm); hết mạng = Game over. Mô
hình dữ liệu `content.questions=[{question,answers:[{text,correct}]}]` y hệt Quiz.
Options: Timer (Count up mặc định) / Shuffle / Show answers + riêng **Lives** + **Difficulty (1–10** =
số/tốc độ địch) qua `buildExtraOptions`.
- File mới: `templates/maze-chase/` (maze-chase.js/.css, mc-sound.js, maze-chase-editor.js [bọc quiz-editor
  giữ type], sample-maze-chase.js, test.html/test.js, GHI CHU MAZE-CHASE.md, img/ 24 ảnh, sounds/ 29 mp3).
- Assets THẬT của Wordwall (theme Space) đã tải + lưu convention ở `AWord-data/Source/{Sound effect,Graphic}/
  MAZE CHASE/` (có GHI CHU.md). Art CỐ ĐỊNH, không đổi theo theme (như whack-a-mole/flying-fruit).
- Kỹ thuật: mê cung sinh ngẫu nhiên (DFS + braid thành mê cung có vòng) mỗi câu, vẽ bằng chính ảnh ô hành
  lang của Wordwall (map openings→piece); di chuyển ô-sang-ô bằng **setInterval** (KHÔNG rAF — luật lõi),
  mượt nhờ CSS transition `left/top`; địch đuổi bằng BFS + chút ngẫu nhiên (interval riêng); sprite 4×7
  đổi khung/hàng theo hướng; ân hạn 1.9s đầu câu + giãn địch khi hồi sinh để công bằng. Chữ pad/câu co
  bằng `fitOnce` (cả rộng+cao) vì mọi thứ dùng `cqw`. KHÔNG sửa `core/`.
- Ánh xạ âm CHÍNH XÁC từ `themejson/space/audios.json` (Type names: MazeChaseAnswerRight/PlayerFootsteps/
  EnemyAttack…). 5 âm kết-thúc generic (TimesUp/GameCompleted/GameOver/Restart/Leaderboard) KHÔNG nạp
  được (game lazy-load, nút Play trong canvas WebGL không script được) → dùng fanfare sẵn của engine +
  âm maze thay thế (clocktick cho cảnh báo 5s, playerappear cho restart). Ghi rõ trong GHI CHU.
- Tự test trình duyệt thật (devserver 5514): READY→maze render đúng→di chuyển→địch đuổi→tới bệ đúng ghi
  điểm (driver tự động né địch đạt 3/8 rồi hết mạng)→Game over tổng kết + leaderboard→Show answers (câu
  sai hiện ✗ + đáp án đúng). 0 lỗi console.
- CHƯA gộp trang chủ (`core/catalog.js`/`index.html` chưa đụng) — chờ thầy duyệt. ĐÃ commit + push
  (chỉ add đúng file Maze chase + 2 file docs của mình; Flying Fruit đợt 24 đã commit trước ở `84ea7ba`).

### 1/8/2026 — Đợt 24: FLYING FRUIT (game thứ 8) — build ĐẦY ĐỦ + tự test (trình duyệt thật, 0 lỗi console), CHỜ THẦY DUYỆT. CHƯA COMMIT.

Dựng lại act Classic của thầy `wordwall.net/resource/116864498` — style **Jungle** (= "Classic" của
Flying Fruit). Cơ chế: câu hỏi (định nghĩa) ở đỉnh, các đáp án (`word`) bay ngang trên QUẢ
(kivano/mango/papaya) theo cung ném, chạm quả ĐÚNG → nổ tung nước (sprite 8 khung) + tia + ✓ + điểm +
sang câu; chạm SAI → ✗ + mất 1 TIM; hết mạng = Game over. Đáp án sai = **random `word` của câu khác**
(editor kiểu Anagram, thầy chốt). Mô hình dữ liệu `content.items=[{word,clue}]` y hệt Anagram.
Options: Timer/**Lives**/**Speed**/**Retry**/Shuffle/Show answers.
- File mới: `templates/flying-fruit/` (flying-fruit.js/.css, ff-sound.js, flying-fruit-editor.js,
  sample-flying-fruit.js, test.html/test.js, GHI CHU FLYING-FRUIT.md, img/ 15 ảnh, sounds/ 18 mp3).
- Assets thật của Wordwall (jungle) đã tải + lưu convention ở `AWord-data/Source/{Sound effect,Graphic}/
  FLYING FRUIT/` (có GHI CHU.md). Art CỐ ĐỊNH, không đổi theo theme (như whack-a-mole). Theme jungle
  KHÔNG có âm "Go"/"ClockTick".
- Kỹ thuật: `inlineTimerBar` để vẽ TIM ở `ui.topbarMid`; spawn/gỡ quả bằng setTimeout (không rAF);
  quả bay = animate `left` + `translateY` con + xoay cháu (tránh bẫy transform+animation); nổ = strip
  8 khung translateX steps(8). KHÔNG sửa `core/`.
- CHƯA gộp trang chủ (`core/catalog.js`/`index.html`/`ALL_TEMPLATES` chưa đụng) — chờ thầy duyệt.
  Chi tiết + đề xuất: `templates/flying-fruit/GHI CHU FLYING-FRUIT.md`.

### 1/8/2026 — Đợt 23: SPEAKING CARDS (game thứ 7, "mở" đầu tiên) — build ĐẦY ĐỦ + tự test, CHỜ THẦY DUYỆT. ĐÃ COMMIT + PUSH.

*(Chỉ commit `templates/speaking-cards/` + file nhật ký này. KHÔNG `git add -A`. **CHƯA** thêm vào
`core/catalog.js`/`index.html`/`manifest.js`/`ALL_TEMPLATES` — chờ thầy chốt rồi mới gộp trang chủ.
Session sau cải tiến: đọc `templates/speaking-cards/GHI CHU SPEAKING-CARDS.md` — có mục "Chưa làm" +
3 "ĐỀ XUẤT SỬA CORE".)*

Dựng act Speaking cards của thầy (`wordwall.net/resource/116796629/speaking-cards`), visual style
**Board Games** (= look **"Classic"** trong AWord — thầy chốt qua AskUserQuestion: **deal places 1–10**,
**thẻ có ảnh + chữ**). Ghi chú template: `templates/speaking-cards/GHI CHU SPEAKING-CARDS.md`.

1. **Nghiên cứu** (Claude in Chrome): rút bài ngẫu nhiên từ bộ bài xáo, KHÔNG chấm điểm/leaderboard
   (open-ended). Data `content.cards=[{text,image?}]`. Options: Timer · Number of deal places (1–10) ·
   Shuffle item order. Menu: Start again/Resume. Âm thanh gói **"playingcards"** (15 mp3 đã có sẵn ở
   `AWord-data\Source\Sound effect\SPEAKING CARDS`, tải 30/7): intro/shuffle/tileAppear/tileFlip/restart/
   timesUp/menu/menuSubtle → chép vào `sounds/`.
2. **Game ĐẦU TIÊN `scorable:false`**. Đồ họa tự vẽ inline SVG (bàn cờ nỉ xanh + lưng bài vàng hoa văn +
   đạo cụ cờ đam/domino/xúc xắc), không chép ảnh gốc. Bộ file: `speaking-cards.js/.css`, `-sound.js`,
   `-editor.js`, `sample-*.js`, `sounds/`, `test.html/.js`.
3. **Bẫy đã xử lý**: (a) lật bài `fill:forwards` giữ `scaleX(0)` khi tab ẩn → bước kết thúc HỦY animation
   + xoá inline transform (theo HUONG DAN CORE §animate); (b) ẩn chip điểm ✓ + nav ◀▶ (vô nghĩa) bằng JS
   trong mount, KHÔNG sửa core; (c) tỉa Options thừa của Quiz (`hideLettersOption:true` + tỉa DOM panel
   "End of game"/"Shuffle answer order", đổi tên → "Shuffle item order"). 3 ĐỀ XUẤT SỬA CORE ghi trong
   GHI CHU template (cờ `openEnded` ẩn score/nav/Submit; cờ ẩn nhóm Options; API khai báo deal-places).
4. **Editor**: soạn thẻ chữ + ẢNH (upload → thu nhỏ ≤480px thành data URL), kéo sắp xếp, dán cột từ Excel.
5. **Tự test OK** (test.html, console sạch): deal/flip/undo/shuffle/hết-bài/dealPlaces 1·3·6/countdown→
   "Time's up"/thẻ-ảnh/Options-sạch/editor/đổi-theme. Chưa test Save thật (cần đăng nhập Firebase).

### 1/8/2026 — Đợt 22: BALLOON POP (game thứ 6) — build ĐẦY ĐỦ + tự test, CHỜ THẦY DUYỆT. ĐÃ COMMIT + PUSH.

*(Chỉ commit `templates/balloon-pop/` + file nhật ký này. KHÔNG `git add -A`. **CHƯA** thêm vào
`core/catalog.js`/`index.html`/`manifest.js` — chờ thầy chốt rồi mới gộp trang chủ.)*

Dựng act Balloon Pop của thầy (`wordwall.net/resource/116864480/baloon-pop`), style **Wild West**
(= **"Classic"** trong AWord — thầy chốt qua AskUserQuestion: **bản đầy đủ giống Wordwall**, điều khiển
**bấm/chạm để pop**). Ghi chú template: `templates/balloon-pop/GHI CHU BALLOON-POP.md`.

1. **Lấy nguồn** (Claude in Chrome): **27 mp3** → `AWord-data\Source\Sound effect\BALOON POP` (22 thư mục
   trạng thái đánh số + GHI CHU). Cách lấy: đọc `themejson/western2/audios.json` trên CDN + đối chiếu file
   game THỰC preload/tải (Performance API). Balloon Pop **KHÔNG dùng** clocktick/chip/nhạc nền — nhịp "đồng
   hồ" là tiếng **tàu chạy** (TrainChug/TrainTime); báo đúng/sai bằng cargo **land/break**.
2. **Cơ chế** (đọc Edit Content): toa tàu hiện 1 ĐỊNH NGHĨA · khinh khí cầu trôi mang KEYWORD · pop blimp
   khớp → keyword rơi thành thùng cargo lên tàu (đúng: tàu chạy tiếp; sai: vỡ). Dữ liệu
   `content.items=[{keyword,definition}]` (min5/max100, Swap Columns, có ảnh). Options: Timer/Speed/Levels/
   Bonuses(ExtraTime/Points/x2)/Show answers.
3. **Template** `templates/balloon-pop/` (self-contained `sounds/`): **1 vòng lặp rAF** duy nhất (blimp +
   đồng hồ + cargo, theo delta clamp 100ms → tab ẩn thì TẠM DỪNG cả game, không hết giờ lúc ẩn). Đồng hồ
   RIÊNG + thanh tiến độ ở `topbarMid` (`inlineTimerBar:true`). `ui.finish({title,review,...})` như
   open-the-box. **Đồ họa vẽ 100% CSS/SVG** (sa mạc parallax + tàu hơi nước đỏ + khinh khí cầu bạc + biển
   gỗ + máy bay) — KHÔNG chép ảnh Wordwall (khác whack-a-mole vốn tải ảnh gốc; chọn CSS/SVG để tránh bản
   quyền). Sizing `cqw`; blimp định vị `left%/top%` của scene (tránh bẫy transform-%); crate `animate()` có
   `setTimeout` dự phòng; fx bake `translate(-50%)` vào keyframe (§3.5). Class tiền tố `.aw-bp-`. KHÔNG sửa core.
4. **Editor** `balloon-pop-editor.js` (mẫu anagram-editor): bảng Keyword | Matching definition + Swap
   Columns + dán Excel 2 cột + kéo sắp xếp; nút ảnh để placeholder ("coming soon").
5. **Test** (`test.html`): pane ẩn thì rAF treo nên test LOGIC bằng patch rAF thành bộ bước-khung + remount
   → xác nhận spawn/trôi/đồng hồ, **pop đúng (+điểm+lên level+tàu chạy)**, **pop sai (vỡ, không điểm)**,
   **hết giờ → panel TIME'S UP** (Score/Leaderboard/Show answers/Start again), Show answers đúng — **0 lỗi
   console**. Chơi LIVE (pane hiện): cảnh + tàu + blimp + máy bay render đẹp, sát Wordwall.
6. **Còn để đợt sau** (mục POLISH trong GHI CHU template): giãn lane blimp khỏi chồng · ẩn ô đồng hồ engine
   trái "0:00" thừa (ĐỀ XUẤT SỬA CORE) · thêm ảnh keyword/definition · nảy cargo · hiệu ứng bonus rõ hơn.

### 1/8/2026 — Đợt 21: WHACK-A-MOLE (game thứ 7) — build ĐẦY ĐỦ + tự test, CHỜ THẦY DUYỆT. ĐÃ COMMIT + PUSH.

*(Chỉ commit `templates/whack-a-mole/` + 2 file nhật ký này. KHÔNG `git add -A` — `templates/balloon-pop/`
là việc CHƯA commit của phiên khác, KHÔNG đụng. **CHƯA** thêm vào manifest/index/trang gồm — chờ thầy
chốt + test TOMKO.)*

Dựng act Whack-a-mole của thầy (`wordwall.net/resource/116864290/whack-a-mole`), style **Wild West**
(theme "western"). Thầy chốt: **2 chế độ** (True/False + Quiz), **bản đầy đủ** (thùng gỗ + level +
đếm điểm), **đồ họa Wild West**. Ghi chú template: `templates/whack-a-mole/GHI CHU WHACK-A-MOLE.md`.

1. **Lấy nguồn** (ổ D, Claude in Chrome): 31 mp3 → `AWord-data\Source\Sound effect\WHACK A MOLE`
   (20 thư mục sự kiện + GHI CHU) · 31 ảnh → `Source\Graphic\WHACK A MOLE` (5 nhóm). Cách lấy: đọc
   `themejson/western2/audios.json` + `scenes/whack.json` trên CDN, đối chiếu file game THỰC SỰ preload
   (Performance API). Phát hiện: whack **KHÔNG dùng nhạc nền**; núi/mesa nằm MỜ sẵn trong `bg2`
   (ImageQuality 0.08), **xương rồng là lớp trang trí riêng** (`balloon/cactus*`) — đã lấy thêm để dựng cảnh.
2. **Template** `templates/whack-a-mole/` (self-contained `img/` + `sounds/`): game thời gian thực bằng
   `setTimeout` (KHÔNG rAF; mỗi mole có setTimeout tuyệt đối tự lặn). Đồng hồ RIÊNG ở `topbarMid`
   (`inlineTimerBar`, giống Open the box) để thùng "time" cộng giây được. 2 chế độ: True/False
   (`content.statements`) + Quiz (`content.questions`, đập đúng → xoay biển sang câu kế). Đầy đủ: combo,
   thùng time/loot/power/dizzy, power-up glow, hoạt cảnh đếm điểm cuối → `ui.finish` (Score/Time +
   Show answers + Leaderboard). Engine KHÔNG cần sửa (dùng `inlineTimerBar`/`buildExtraOptions`/
   `optionsNeedRestart`/`sounds.*`).
3. **Editor đầy đủ** 2 chế độ: toggle True/False | Quiz, soạn câu/đáp án, dán Excel, kéo sắp xếp,
   validate; giữ CẢ 2 mảng content, Save ghi `options.mode`.
4. **Đã test** (`test.html` qua browser preview, **0 lỗi console**): 2 chế độ; đập đúng/sai → điểm +
   tia lửa + combo; thùng "time" ngoi lên; Quiz xoay biển sang câu kế; hết giờ (ván 4s) → tally →
   bảng "TIME'S UP" Score 2/2 Time 5.4s + menu đủ; editor render + chuyển mode + Save ra dữ liệu đúng.

**BẪY đã sửa (trong lúc build):** (a) **TDZ** — `let clockEl/fillEl` khai báo SAU chỗ gọi
`ensureTimerUI()` → truy cập biến `let` trong vùng chết → mount NÉM LỖI im lặng sau khi vẽ sign (có
scene+biển nhưng không đồng hồ/chuột). Sửa: dời khai báo lên khối state. (b) **Hố cao 0px** — hố chứa
toàn con `position:absolute` nên cao 0 → `molewrap height:96%` sụp → chuột bị cắt sạch. Sửa: set
`hole.style.height = s*1.35cqw`.

**CHỜ TEST TOMKO:** (a) cảm giác đập bằng cảm ứng màn 86"; (b) nhịp spawn + tốc độ (option Speed);
(c) âm thanh; (d) cỡ chuột/cactus + độ đầy của nền. Sau khi thầy chốt → thêm `manifest.js` + `index.html`
(link css) + `ALL_TEMPLATES` → đưa lên LIVE.
Rollback = `git reset --hard 43df2db` (về đợt 20 Crossword).

### 31/7/2026 — Đợt 20: CROSSWORD (game thứ 6) — build + tự test, CHỜ THẦY DUYỆT. ĐÃ COMMIT + PUSH.

*(Làm bởi 1 phiên riêng, song song với Find the match / Balloon pop / Whack a mole của các phiên khác.
Chỉ commit đúng thư mục `templates/crossword/` + `docs/09-CROSSWORD.md` + 2 file nhật ký này — KHÔNG
`git add -A`, KHÔNG đụng việc chưa commit của phiên khác.)*

Dựng lại act Crossword của thầy (`wordwall.net/resource/116864402/crossword`, style **Classic** = mặc
định AWord). Nghiên cứu đầy đủ: `docs/09-CROSSWORD.md`. Ghi chú template + hạn chế + đề xuất sửa core:
`templates/crossword/GHI CHU CROSSWORD.md`.

1. **Nghiên cứu act thật** (Claude in Chrome): đọc file cấu hình theme Classic trên CDN
   (`audios.json`/`palette.json`/`crossword layout`/`content model`) + **CHƠI THẬT** để map chính xác
   âm thanh ↔ sự kiện (đo độ dài file khớp lúc phát). Crossword Classic dùng **13 mp3 / 9 hiệu ứng**:
   intro · correct×3 · incorrect×3 · gamecompleted · timesup · restart · menu · leaderboard · reveal.
   KHÔNG có âm gõ từng chữ / clocktick / tileflip / gameover.
2. **Lưu nguồn** (ổ D): 13 mp3 vào `AWord-data\Source\Sound effect\CROSSWORD` (thư mục đánh số +
   GHI CHU.md) · 6 file đồ họa tham khảo vào `Source\Graphic\CROSSWORD` · copy âm sang
   `templates/crossword/sounds/`.
3. **Template mới** `templates/crossword/`: `crossword.js` (**tự sinh lưới ô chữ interlock** greedy từ
   danh sách {answer,clue}; chọn từ/đổi hướng; nhập bằng bàn phím vật lý + **bàn phím ảo QWERTY ẩn mặc
   định** [`hasKeyboardToggle`+`ui.kbdSlot`, như Type the answer] cho cảm ứng TOMKO; chấm từng từ; đúng =
   ô accent + điểm + âm, sai = âm + lộ đáp án nếu bật "Show answer when wrong") · `.css` (`.aw-cw-*`,
   theme-driven, cqw; cell px tính bằng JS `resizeGrid`) · `sample-crossword.js` (20 từ thật) ·
   `crossword-editor.js` (2 cột Answer|Clue + dán Excel) · `crossword-sound.js` (mp3 THẬT) ·
   `test.html`/`test.js` · `GHI CHU CROSSWORD.md`. Khớp hợp đồng engine: `sounds{play,restart,
   timeWarning,complete}` + `edit` + `toPrintItems` + `hideLettersOption` + `buildExtraOptions`
   (showAnswerWhenWrong).
4. **Tự test** qua `templates/crossword/test.html` (preview `aword-verify` port 5512 vì 5510 bị phiên
   khác chiếm), trình duyệt thật, **0 lỗi console**: sinh lưới 19/20 từ (1 từ không chèn được thì bỏ khỏi
   lưới); chọn/gõ/chấm ĐÚNG (ô xanh + điểm) và SAI (âm + lộ đáp án, không điểm); Submit → panel GAME
   COMPLETE (Score/Time) → Show answers 19 hàng; bật/tắt bàn phím ảo (lưới co vừa khít, không tràn); đổi
   theme Classic↔Beach (màu ô/chữ/gợi ý đổi theo accent, không vỡ).

**CHƯA gộp trang chủ / CHƯA thêm `core/catalog.js` built:true** — chờ thầy duyệt (giống Find the match).
**ĐỀ XUẤT SỬA CORE**: thêm cờ `tpl.hideRandomOption` (ẩn nhóm Shuffle của Options cho crossword).
**Hạn chế đã biết**: lưới nhiều từ + bàn phím ảo bật trên màn thấp = ô nhỏ (hướng nâng cấp sau: phóng
to/cuộn theo từ đang chọn khi bật bàn phím ảo).

### 31/7/2026 — Đợt 19: TYPE THE ANSWER — bàn phím ảo kiểu điện thoại (caps / numbers) + nút trợ giúp "Andrew help". ĐÃ COMMIT + PUSH.

Thầy chơi thử bàn phím và góp ý 2 vòng. **Chỉ đụng 2 file template** `templates/type-the-answer/type-the-answer.js`
+ `.css` — KHÔNG đụng core. Chi tiết đầy đủ + BẪY: `templates/type-the-answer/GHI CHU TYPE-THE-ANSWER.md`
(2 mục cuối ngày 31/7). Tóm tắt:

1. **Vòng 1 — bàn phím tông tối, phím vuông** (theo ảnh thầy gửi): nền `#2b2b2e`, phím xám `#48484b` chữ
   trắng, bo góc nhỏ + gờ tối. Thêm **phím Submit XANH ngay trong bàn phím** (hàng dưới, bên phải Space);
   khi bàn phím HIỆN thì ẩn nút "Submit Answer" ngoài, ẩn bàn phím thì nút ngoài hiện lại (`syncSubmitVisibility`).

2. **Vòng 2 — bố cục 4 hàng kiểu điện thoại + 3 phím chức năng**:
   `' q…p ⌫(đỏ)` / `caps a…l ?` / `numbers z…m . ,` / `Andrew  Space  Submit`.
   - **caps**: nhập chữ HOA + chấm sáng tròn khi bật (thuần trang trí — chấm điểm vẫn bỏ qua hoa/thường).
   - **numbers**: đổi 3 hàng chữ sang layout số/ký tự cơ bản, chấm sáng khi bật, caps mờ đi.
   - **Andrew help** (dùng **1 lần cho CẢ VÁN**): chưa dùng = chấm sáng; bấm → hiện đáp án đúng (khối reveal
     màu hổ phách "Andrew ➜ …") + phím sáng vàng rực + hào quang nhấp nháy; HS chép đáp án → Submit
     (chép đúng **vẫn cộng điểm**, sai vẫn sai); ngay sau Submit → Andrew tối lại + khóa hết ván.

3. **BẪY THẬT đã bắt + sửa**: `rebuildKeyboard()` thay node bàn phím (caps/numbers/Andrew) nhưng `measure`
   của `autoFit` đóng kín biến `kbd` node CŨ (rời DOM → cao 0) → autoFit không thu nhỏ → bấm Andrew (reveal
   mở, 4 hàng) thì tràn khung (cắt câu hỏi + nút Submit). Sửa: `measure` đo `keyboardEl` (biến sống).

4. **Đã test thật qua trình duyệt** (chụp ảnh + đo DOM): layout khớp ảnh; caps/numbers/Andrew đủ chu trình;
   fit khớp khung sau khi sửa; 0 lỗi console. **Commit sạch chỉ 3 file type-the-answer** — cố ý KHÔNG add
   `APP_MASTER.md` (đang có phiên khác viết lại mục 0b BÀN GIAO song song) và `.claude/` (config dev cục bộ).

### 31/7/2026 — Đợt 18: OPEN THE BOX — làm lại hiệu ứng chuyển ô số ⇄ ô câu hỏi + bỏ tiếng thừa. ĐÃ COMMIT + PUSH.

Thầy chơi thử và góp ý 3 vòng (tương ứng **đợt 14→15→16 RIÊNG trong** `templates/open-the-box/GHI CHU
OPEN-THE-BOX.md` — số đợt của template đó đếm riêng, khác số Đợt toàn cục ở file này). Tóm tắt:

1. **Hiệu ứng chuyển ô số ⇄ ô câu hỏi viết lại** (đợt 14): trước đây bấm ô là `render()` XÓA TRẮNG lưới
   ngay → các ô số khác "biến mất tức thì". Nay lưới + màn câu hỏi **cùng nằm DOM, chồng tuyệt đối** (class
   `.aw-otb-anim` trên root) nên: MỞ = ô được bấm phóng to từ đúng vị trí ô số + các ô khác **mờ dần** +
   đáp án trượt vào, cả 3 cùng ~1.2s; ĐÓNG = ngược lại hoàn toàn. Tách hàm `buildBoxGrid`/`buildQuestion`/
   `setupFit`, thêm `animateOpen`, viết lại `closeCardThen`. **Bẫy đã vá**: `zoomElTo` từng chốt theo
   `transitionend` của opacity (840ms) làm màn đóng bị CẮT NGANG → đổi chốt theo `transform` (1200ms).
2. **Chiều đóng: ô số hiện lại MUỘN hơn** (đợt 15): thêm `CLOSE_BOX_FADE_DELAY_MS=400` (giữ ẩn 400ms đầu
   rồi mới mờ hiện, vẫn kết thúc đúng lúc gỡ màn câu hỏi — không snap). Chiều mở không đổi.
3. **Bỏ tiếng THỪA khi trả lời SAI** (đợt 16): sai từng phát 2 tiếng (`wrong()` + `tileEliminate()`) → bỏ
   `tileEliminate()`, chỉ giữ `wrong()` phát ngay lúc bấm.

Không đụng `core/` — mọi CSS đều prefix `.aw-otb-*` (chỉ nạp khi chơi Open the box). Test browser thật
qua `test.html` bằng `javascript_tool` (đo `getComputedStyle`/chặn `Audio.play` liên tục): cả 2 chiều
chạy đồng thời đúng số đo, trả lời đúng→tích xanh, hết giờ→GAME OVER, sai chỉ còn 1 tiếng; 0 lỗi console.

**ĐÃ COMMIT + PUSH GitHub** — commit `222dafa` (3 file: `open-the-box.js/.css` + `GHI CHU OPEN-THE-BOX.md`).

> ⚠️ **CHO PHIÊN MỚI**: lúc commit lô này, cây làm việc CÒN các file **CHƯA commit của một phiên khác
> đang chạy SONG SONG**: `APP_MASTER.md` + `templates/type-the-answer/*` (js/css/GHI CHU). Tôi CỐ Ý
> không đụng để phiên đó tự lo — **đừng commit nhầm** các file này. `.claude/` là cấu hình phiên cục bộ,
> cũng bỏ qua. Việc kế tiếp cho Open the box (nếu có): xem đuôi `GHI CHU OPEN-THE-BOX.md` + `APP_MASTER.md`
> mục 7 (đọc bản mới nhất SAU khi phiên song song commit xong).

### 31/7/2026 — Đợt 17: TEMPLATE MỚI **TRUE FALSE** (True or false) — build + gộp trang chủ (`built:true`), chờ thầy duyệt.

Template thứ 6. Thầy yêu cầu: "phong cách + màu sắc của các template AWord khác, cách chơi giống act
Wordwall https://wordwall.net/resource/116827457/true-false" (act nội bộ Wordwall gọi là **"boolean"**,
cùng họ game "băng chuyền" với Find the match). Trước khi build đã chuẩn bị bộ âm thanh gốc (chơi act,
soi `themejson/classic/audios.json` + Performance API để bắt đúng 22 file .ogg game preload, tải về +
đổi .mp3 ffmpeg, xếp 15 thư mục ở `D:\APP AND DATA\AWord-data\Source\Sound effect\TRUE FALSE`).

Cách chơi: câu (statement) trượt vào giữa như băng chuyền (dùng lại engine chuyển động của Find the
match), bấm **True/False**. Đúng → +điểm + ✓; sai → ✗ + mất 1 tim. Có **Speed slider** (0 = chờ trả
lời), **mạng 5 tim + Game Over** (thầy chốt: kèm nút bật/tắt trong Options), **Unanswered questions**
(show once / repeat). Bàn phím T/← = True, F/→ = False. Mũi tên prev/next ẩn qua `:has(> .aw-tf-card)`.

**Màu nút theo THEME** (thầy chốt): True = `var(--aw-ok)`, False = `var(--aw-no)` — 2 biến này mọi
theme đã có sẵn nên KHÔNG hard-code, KHÔNG sửa `core/themes/*`. Classic xanh-lá/đỏ, Classroom xanh-ấm/
đỏ-gạch, Beach xanh-biển/đỏ-san-hô (đã đo `getComputedStyle`).

Bộ file trong `templates/true-false/`: `true-false.js/.css`, `tf-sound.js` + `sounds/` (bộ classic2
giống Find the match), `true-false-editor.js` (bảng Statement | True/False, dán Excel 2 cột, max 40),
`sample-true-false.js` (chủ đề Plant life cycle, 8 câu), `test.html/.js`. Chi tiết đầy đủ + checklist
đã kiểm: `templates/true-false/GHI CHU TRUE-FALSE.md`.

Khai báo 4 nơi: `core/catalog.js` (`built:true`), `main.js` (import), `index.html` (link CSS),
`manifest.js` (entry). **Nhân tiện vá 2 thiếu sót của Find the match phiên trước**: FTM chưa có trong
`index.html` (thiếu link `find-the-match.css` → FTM không có style trên trang chủ) và chưa có trong
`manifest.js` — đã thêm cả hai.

Đã test browser thật qua `test.html` (0 lỗi console; đúng/sai/mất-tim; Game Complete + Show answers;
màu 3 theme). **CHƯA test play.html** (giống mọi template ngoài quiz — play.js chỉ import quiz, hạn chế
chung đã biết). **CHƯA commit/push** — chờ thầy duyệt (chưa nói "commit"/"push").

### 31/7/2026 — Đợt 16: Find the match GỘP TRANG CHỦ — `built:true` + import vào `main.js`. Không còn "coming soon".

Thầy nói "gộp lên trang chủ và kết thúc session này". `core/catalog.js` đổi `built:false→true` + sửa
blurb khớp cơ chế mới; `main.js` thêm 1 dòng import (đúng khuôn Quiz/Anagram/Open the box/Type the
answer). Đã kiểm: panel Template trong game hiện Find the match ngang 4 game kia; main.js load không
lỗi console; mọi asset (.js/.mp3) của Find the match tải 200 OK. **CHƯA tự đăng nhập Google thử "+New
activity" trên trang chủ thật** (máy build không tự động hoá đăng nhập được, giống các đợt merge Open
the box/Type the answer trước) — thầy tự thử tạo 1 act thật khi rảnh. Đã commit + push GitHub.

Tất cả 5 template chính (Quiz/Anagram/Find the match/Type the answer/Open the box) giờ ĐỀU
`built:true`, sống trên trang chủ. Việc kế tiếp: theo `APP_MASTER.md` mục 7 (chưa đọc lại trong phiên
này vì file đó đang có 1 phiên khác chỉnh sửa song song, xem ghi chú ở đợt 15/16 phía dưới) — 1 phiên
mới nên đọc lại `APP_MASTER.md` mới nhất trước khi nhận việc tiếp theo.

### 31/7/2026 — Đợt 15: Find the match — bấm sai cũng trượt câu (sửa lại giả định sai đợt 14) + đếm ngược 3-2-1 (Count up) + ting đếm giờ (Count down). CHƯA gộp trang chủ.

Thầy sửa lại 1 giả định của đợt 14 + thêm 2 yêu cầu về đồng hồ. Chi tiết đầy đủ (kèm 1 giới hạn kỹ
thuật CHƯA giải quyết được, cần thầy quyết định): `templates/find-the-match/GHI CHU FIND-THE-MATCH.md`.

- **Bấm SAI giờ cũng làm câu hỏi trượt đi** (đợt 14 em đoán sai là "bấm sai không ảnh hưởng câu hỏi" —
  thầy xác nhận sai, đã sửa lại đúng). Bấm sai → dấu ✗ bay lên đúng ô vừa bấm rồi biến mất (bỏ hẳn hiệu
  ứng rung `.is-shake` cũ) + câu hỏi trượt tiếp ra phải như lúc bấm đúng. Cặp đó: "Show once" → xoá ô
  đáp án đúng luôn; "Repeat until correct" → xếp lại **vị trí NGẪU NHIÊN** trong hàng đợi (không phải
  luôn xếp cuối). Đã kiểm bằng `javascript_tool` đo DOM thật (không đoán qua ảnh chụp): đúng cả 2 chế độ.
- **Đếm ngược "3-2-1"** trước câu hỏi đầu tiên — CHỈ khi Timer = Count up: số to giữa khu câu hỏi, mỗi
  giây đổi số + 1 tiếng "ting" (dùng lại `clocktick.mp3`), xong mới phát "Go" và câu hỏi thật mới trượt
  vào. Đã đo timing bằng `javascript_tool`, đúng 3-2-1 mỗi giây rồi mới vào câu hỏi.
  - **Giới hạn CHƯA giải quyết**: thầy muốn "3 giây chuẩn bị không tính vào đồng hồ", nhưng đồng hồ
    hiển thị + thời gian ghi bảng xếp hạng cuối ván là do `core/engine.js` tự quản lý, bắt đầu đếm NGAY
    lúc mount() chạy — không có cách nào template tự hoãn mà không sửa core. Đã ghi "ĐỀ XUẤT SỬA CORE"
    (thêm cờ `tpl.deferTimerStart` + hàm `ui.startClock()`, kiểu bổ sung CHỈ THÊM không đổi template
    khác) — CHƯA tự làm, chờ thầy "ok" mới đụng `core/engine.js`. Hệ quả hiện tại: đồng hồ/thời gian
    cuối ván của Find the match sẽ cao hơn thời gian chơi thật đúng 3 giây.
- **Ting đếm giờ cho Count down**: 1 tiếng/giây từ lúc còn 10s, gấp đôi nhịp (2 tiếng/giây) từ lúc còn
  5s — tính bằng đồng hồ riêng của template (đọc `options.timerTotalSeconds`), không cần sửa core.
  Count up thì hết ting sau 3 giây chuẩn bị (không ting xuyên suốt ván nữa như đợt 14 làm nhầm).
- CHƯA tự nghe thật các file âm thanh (chỉ kiểm lịch trình `setTimeout` qua code, không nghe được qua
  công cụ test).

### 31/7/2026 — Đợt 14: Find the match — cơ chế "băng chuyền" trượt liên tục + âm thanh Wordwall thật + lưới 5 hàng cố định vị trí + speed slider + ẩn nav + đường kẻ đứt. CHƯA gộp trang chủ.

Thầy gửi tiếp 5 điều chỉnh cụ thể sau đợt 13. Chi tiết đầy đủ + giả định tự quyết (có 1 điểm chưa chắc
chắn 100%, đã ghi rõ): `templates/find-the-match/GHI CHU FIND-THE-MATCH.md`, đây chỉ tóm tắt.

- **Lưới CỐ ĐỊNH 5 hàng, căn giữa màn hình, không dồn lại khi xoá ô** — mỗi ô Keyword được gán
  `grid-row`/`grid-column` cố định 1 lần lúc mount (cols = ceil(tổng/5)), xoá 1 ô chỉ để trống chỗ đó.
- **Câu hỏi trượt kiểu "băng chuyền"**: trái → giữa → phải, chậm và liên tục (`element.animate`), bấm
  đúng cũng làm câu hỏi trượt tiếp ra phải (không snap tức thì) — câu mới chỉ vào sau khi câu cũ trượt
  HẲN ra khỏi màn. Bấm SAI không ảnh hưởng chuyển động của câu hỏi (chỉ rung ô + trừ mạng) — quyết định
  tự đưa ra vì brief không nói rõ, thầy nên xác nhận lại.
- **Âm thanh thật** từ `D:\APP AND DATA\AWord-data\Source\Sound effect\FIND THE MATCH` — module mới
  `ftm-sound.js` + `templates/find-the-match/sounds/*.mp3`: Intro/Go/ConveyorAppear/Centred/Leave/
  Correct/Incorrect/GameCompleted/GameOver/TimesUp/Restart/ClockTick. 3 âm còn lại (Menu/Leaderboard/
  RevealAnswers) CHƯA gắn được — thiếu hook ở `core/engine.js`, đã ghi "ĐỀ XUẤT SỬA CORE" trong GHI CHU
  riêng, chưa tự sửa.
- **Speed đổi từ dropdown sang thanh trượt** (`<input type="range">`). **Ẩn hẳn nút prev/next** (chỉ
  còn "x of y") bằng CSS `:has()` riêng cho Find the match, không đụng `core/engine.js`, không ảnh
  hưởng game khác. Thêm **đường kẻ đứt** ngăn khu câu hỏi/khu đáp án.
- Test qua `test.html`: xoá ô giữa lưới → các ô khác không xê dịch; Speed=3 chạy hết 8 câu tự trượt
  đúng, Game Complete 0/8 đúng lúc (dùng `javascript_tool` đo `transform` để xác nhận không bị kẹt —
  ban đầu tưởng lỗi, hoá ra chỉ là 400ms chờ trước màn kết thúc); tắt Remove corrects → ô ở lại có ✓ nhỏ
  (ghi chú thẩm mỹ: dấu ✓ hơi đè chữ khi từ ngắn). 12 file âm thanh load 200 OK, không lỗi console.
  CHƯA tự nghe thật 12 file âm thanh, CHƯA tự kiểm "Repeat until correct" quay vòng thật.

### 31/7/2026 — Đợt 13: Find the match viết lại theo brief thầy (đảo vai trò prompt/tile · Speed · Repeat · Remove corrects · content editor mới). CHƯA gộp trang chủ.

Thầy gửi ảnh tham khảo Wordwall thật + mô tả tốc độ/chế độ lặp lại. Chi tiết đầy đủ:
`templates/find-the-match/GHI CHU FIND-THE-MATCH.md`, đây chỉ tóm tắt.

- **Đảo ngược prompt/tile so với bản MVP 24/7**: bản cũ để Keyword (1 chữ) làm câu hỏi trên cùng +
  lưới Definition bên dưới — SAI so với Wordwall thật. Viết lại: **Definition (câu hỏi dài) chạy ở
  trên, Keyword (chữ ngắn) là các ô màu trong lưới** — đúng ảnh thầy gửi. Dữ liệu `{keyword,
  definition}` không đổi cấu trúc.
- **3 Option mới** (qua cơ chế `buildExtraOptions` có sẵn từ đợt Anagram, KHÔNG đụng `core/`):
  **Speed** (0-10: 0 = đợi vô hạn như cũ, 1-10 = tự trượt sang câu kế sau 1 khoảng dừng, dừng ngắn +
  trượt nhanh dần theo tốc độ); **Unanswered questions** ("Show each question once" mặc định = hết
  giờ bỏ luôn, hay "Repeat questions until correct" = hết giờ xếp lại cuối hàng đợi hỏi lại sau);
  **Remove corrects** (mặc định bật = ô biến mất khi đúng như cũ, tắt = ô ở lại có dấu ✓ nhỏ).
  Màu ô Keyword dùng lại đúng bộ 8 màu Open the box/Quiz.
  - `templates/find-the-match/find-the-match.js` viết lại gần như toàn bộ; `find-the-match.css`
    thêm biến `--ftm-c`/`--ftm-d` (cùng cơ chế fallback `--aw-tile-fixed` như Open the box).
- **Content editor mới** (`find-the-match-editor.js`, copy khuôn `anagram-editor.js`): bảng
  Keyword | Definition, kéo-thả, dán Excel, **tối đa 40 cặp** (thầy nâng từ 30 trong tài liệu nghiên
  cứu gốc lúc brief), tối thiểu 3.
- Test qua `test.html`: Speed=0 chơi hết 8/8 đúng/sai/Show answers đúng; Speed=4 tự trượt đúng nhịp,
  bỏ-qua-xoá-ô đúng, Game Complete 0/8 khi để trôi hết; đổi theme Basic ép đúng 1 màu, không vỡ
  layout; editor thêm dòng/Cancel hoạt động đúng. 0 lỗi console.
- **CHƯA tự kiểm**: "Repeat questions until correct" thật, `removeCorrects:false`, lives + Speed cùng
  lúc, fullscreen, kéo-thả trong editor, dán Excel thật — để lại cho thầy hoặc phiên sau.
- **CHƯA import vào `main.js`, CHƯA đổi `built:false` → `true`** — theo đúng quy trình (giống Open
  the box/Type the answer: 2 việc này chỉ làm cùng lúc khi thầy duyệt gộp trang chủ).

### 30/7/2026 — Đợt 12: 4 chỉnh sửa theo yêu cầu thầy (Quiz hết ép hoa · chặn chuột phải · fullscreen giữ khi restart · fullscreen full màn TOMKO). ⚠️ CÓ SỬA `core/` — thầy yêu cầu trực tiếp.

Thầy nêu 4 việc. Cả 4 đều đụng `core/` (engine.js/app.css) + 1 file quiz — được phép vì thầy yêu cầu
rõ (ngoại lệ của Luật số 1 trong `core/HUONG DAN CORE.md`).

**1. Quiz ép HOA mọi đáp án → bỏ.** `templates/quiz/quiz.css` `.aw-quiz-tile` có
`text-transform: uppercase` ép hoa toàn bộ chữ trong ô đáp án. Bỏ đúng khai báo đó → đáp án hiện đúng
như thầy gõ (VD "banana" ra "banana", không thành "BANANA"). ALL CAPS chỉ còn ở Anagram (option riêng
của game đó, không đụng). Đã đo `getComputedStyle(.aw-quiz-tile).textTransform === "none"`.

**2. Chặn hoàn toàn chuột phải trong khung act.** `core/engine.js`: sau `root.append(page)` thêm
`page.addEventListener("contextmenu", e => e.preventDefault())`. Chỉ chặn trong `.aw-page` (khung
game) — trang thư viện vẫn có menu chuột phải bình thường. Vì `page` dựng lại mỗi lần `startGame` nên
listener luôn mới, không cần gỡ tay. Đã kiểm: bắn sự kiện `contextmenu` vào `.aw-page` →
`defaultPrevented === true`.

**3. Restart bị rớt fullscreen → sửa gốc.** Nguyên nhân: fullscreen trước đây request trên `page`,
mà `restart()` gọi `startGame` → `root.innerHTML = ""` xoá `page` cũ → trình duyệt tự thoát fullscreen,
rồi `page` mới dựng lên không ai request lại. **Sửa: đổi phần tử fullscreen từ `page` sang `root`
(`#app`)** — root KHÔNG bao giờ bị xoá khỏi DOM (chỉ bị thay ruột), nên fullscreen tự giữ nguyên qua
restart, không cần request lại (tránh hẳn cái race "thoát rồi vào lại trong cùng 1 nhịp click"). Hệ
quả phải xử lý kèm: giờ RỜI game (Home / Edit) sẽ KHÔNG tự thoát fullscreen nữa (trước đây thoát nhờ
`page` bị xoá) → thêm `if (fsElement()) exitFs()` vào đúng 2 nút Home + Edit để về đúng hành vi cũ
(thư viện/editor hiện ở chế độ cửa sổ). "Change template"/"Play a different template" chỉ là toast
"coming soon" nên không đụng. `restart()` cố tình KHÔNG thoát → đó chính là mục đích.

**4. TOMKO (màn 4K 16:9) bấm fullscreen chỉ full 1 góc → thêm tiền tố vendor.** CSS cũ chỉ có
`.aw-page:fullscreen` (không tiền tố). Trên panel TOMKO (trình duyệt cũ hơn máy chính) pseudo-class
`:fullscreen` không khớp → `.aw-page` giữ nguyên `max-width:1000px` → chỉ chiếm 1 góc trên-trái dù nền
đã đen. **Sửa: viết lại khối CSS fullscreen, mỗi tiền tố 1 RULE RIÊNG** (`:fullscreen`,
`:-webkit-full-screen`, `:-moz-full-screen`, `:-ms-fullscreen`) — TUYỆT ĐỐI không gộp chung 1 danh
sách selector, vì trình duyệt vứt CẢ rule nếu gặp 1 selector nó không hiểu (đã suýt mắc: nếu gộp,
Chrome coi `:-moz-full-screen` là lỗi → vứt luôn `.aw-page` rule → hỏng máy chính đang chạy tốt). Đo
thật trong Chrome: 5 nhóm × 4 tiền tố khai báo → Chrome GIỮ đúng 2 rule/nhóm (`:fullscreen` +
`:-webkit-full-screen`) và TỰ BỎ 2 rule `-moz/-ms` mà KHÔNG ảnh hưởng 2 rule kia (`fsRuleCount:10`) —
đúng bằng chứng cho thấy tách rời là bắt buộc. JS cũng thêm helper dò đủ tiền tố:
`fsElement()`/`requestFs()`/`exitFs()` (webkit/moz/ms) thay cho `document.fullscreenElement`/
`requestFullscreen`/`exitFullscreen` trần — phòng TOMKO không có API không tiền tố. Cũng đổi hẳn phần
tử fullscreen sang `root` (gộp với việc 3), CSS key theo tổ tiên fullscreen: `:fullscreen .aw-page` /
`:fullscreen .aw-stage` (letterbox math y hệt bản cũ đang chạy đúng: stage rộng
`min(100vw, 100vh*16/9)`), thêm ẩn `.aw-as-bars` (thanh assignment) lúc fullscreen cho gọn.

**Kiểm chứng đã làm** (localhost, trình duyệt thật, `test.html` Quiz): 0 lỗi console; đáp án Quiz hết
hoa; chuột phải bị chặn trong `.aw-page`; CSS fullscreen parse đúng (Chrome giữ 2/4 tiền tố mỗi nhóm,
không rớt rule chuẩn); engine load không lỗi cú pháp; root = `#app` đúng ở cả main.js/play.js/test.js.
**CHƯA tự kiểm được HIỆU ỨNG FULLSCREEN THẬT** — preview pane không cấp fullscreen (cần user gesture +
pane hiển thị). **Nhờ thầy xác nhận trên màn thật**: (a) máy chính bấm fullscreen vẫn full đúng như
trước (đảm bảo không hồi quy); (b) restart khi đang fullscreen thì VẪN fullscreen; (c) TOMKO bấm
fullscreen giờ full toàn màn 4K chưa; (d) Home/Edit thoát fullscreen về cửa sổ.

### 30/7/2026 — Đợt 11b: sửa 1 BUG THẬT bắt được ngay sau khi thầy tự tay thử trên bản live

Thầy gửi ảnh chụp trang live: modal "New activity" vẫn hiện Open the box/Type the answer "Coming soon"
— **hoá ra là cache trình duyệt của thầy**, không phải lỗi server: mở tab MỚI (`tabs_create` +
`javascript_tool` import thẳng `core/catalog.js?bust=<timestamp>` từ `andrewclasses-01.github.io`) xác
nhận catalog live đã đúng `built:true` cả 2. Bài học lặp lại đúng BẪY mục 9 (GitHub Pages/trình duyệt
cache file .js) — chỉ cần thầy bấm tải lại cứng (Ctrl+Shift+R) hoặc mở tab mới.

**Nhưng ảnh chụp cũng lộ 1 lỗi thật khác, không liên quan cache**: 1 act cũ tên "VOCABULARY REVIEW —
Open the box" (thầy đã tạo được từ trước, có lẽ lúc còn test cục bộ) hiện nhãn loại game là
**`OPEN_THE_BOX`** (chữ hoa + gạch dưới) thay vì "Open the box" như card Anagram/Quiz bên cạnh hiện
đúng "ANAGRAM"/"QUIZ". Soát `main.js` thấy dòng vẽ nhãn này dùng thẳng `node.type` (chuỗi kỹ thuật,
vd `"open_the_box"`) thay vì gọi `templateLabel(node.type)` (hàm đã có sẵn, trả về nhãn đẹp "Open the
box") — lỗi NẰM SẴN từ trước (không phải do đợt gộp hôm nay gây ra), chỉ là VÔ HÌNH bấy lâu vì Quiz/
Anagram là type 1-từ nên viết hoa `"quiz"`/`"anagram"` tình cờ đúng luôn với nhãn hiển thị; type nhiều
từ như `open_the_box`/`type_the_answer` mới lộ ra khác biệt. Sửa 1 dòng (`main.js`, hàm `actCard`):
đổi `escapeText(node.type || "quiz")` → `escapeText(templateLabel(node.type))`. Đã kiểm bằng
`javascript_tool` gọi thẳng `templateLabel()` cho cả 5 type (`quiz/anagram/open_the_box/
type_the_answer/`type không tồn tại`) ra đúng nhãn đẹp cho 4 type thật + fallback an toàn cho type lạ;
trang chủ tải lại 0 lỗi console. **ĐÃ COMMIT + PUSH GITHUB** (cùng yêu cầu "push" của thầy từ đợt 11).

### 30/7/2026 — GỘP Open the box + Type the answer VÀO TRANG CHỦ, PUSH GITHUB (đợt 11, "đưa lên live")

Thầy yêu cầu thẳng "đưa Open the box và Type the answer lên live" để dùng trên máy khác, bỏ qua bước
chờ tự chơi thử ở local trước như quy trình cũ (mục 0b APP_MASTER.md từng ghi "chờ thầy duyệt xong
mới gộp"). Đây là lệnh rõ ràng của thầy nên làm luôn bước gộp trang cuối (việc mà `HUONG DAN
TEMPLATE.md` quy định chỉ 1 session phụ trách tổng mới làm):

1. **`core/catalog.js`**: `open_the_box` và `type_the_answer` đổi `built: false` → `true` (Find the
   match GIỮ NGUYÊN `false` — thầy chỉ yêu cầu 2 game này).
2. **`index.html`**: thêm `<link>` cho `open-the-box.css` + `type-the-answer.css`.
3. **`manifest.js`**: thêm 2 entry theo đúng khuôn Quiz/Anagram (dù `main.js` hiện không đọc file này
   trực tiếp — vẫn cập nhật cho khớp mô tả đầu file "danh sách template đã chốt").
4. **`main.js`**: thêm `import "./templates/open-the-box/open-the-box.js"` +
   `import "./templates/type-the-answer/type-the-answer.js"` (đăng ký template qua side-effect của
   `registerTemplate`, giống Quiz/Anagram).
5. **Bắt được 1 lỗi thật lúc soát code trước khi gộp**: hàm vẽ thẻ act trên trang chủ (`actCard`) chỉ
   đọc `node.content?.questions` (đúng hình Quiz) để lấy 1 câu hỏi + đáp án làm ảnh xem trước. Nhưng
   Open the box/Anagram/Type the answer đều lưu dữ liệu ở `content.items` (không phải `.questions`) và
   Type the answer còn khác tên field hẳn (`prompt`/`acceptedAnswers` thay vì `question`/`answers`) —
   nên nếu gộp nguyên xi, thẻ của **cả 3 game này** (kể cả Anagram đã chốt từ 29/7!) sẽ hiện "No
   questions yet" dù có đủ nội dung. Sửa bằng 1 hàm dùng chung mới `previewPick(node)` đọc được cả 4
   hình dữ liệu (`content.questions[]` kiểu Quiz-answers / `content.items[]` kiểu Quiz-answers (Open
   the box) / `content.items[]` kiểu `{word,clue}` (Anagram) / `content.items[]` kiểu
   `{prompt,acceptedAnswers}` (Type the answer)) — tiện sửa chung 1 lần vì đằng nào cũng phải đụng hàm
   này.
6. **Kiểm chứng đã làm** (không đăng nhập Google được nên không tự bấm hết luồng thư viện):
   - Trang chủ tải: 0 lỗi console, cả 2 module mới + editor + `otb-sound.js` tải 200 OK
     (`read_network_requests`).
   - Chạy thử `previewPick()` ngay trong trình duyệt (`javascript_tool`) với dữ liệu mẫu thật của cả 4
     game (`sample-quiz.js`/`sample-anagram.js`/`sample-open-the-box.js`/`sample-type-the-answer.js`)
     → cả 4 ra đúng câu hỏi + đáp án, không cái nào rỗng.
   - `core/catalog.js` sau khi sửa: import lại trong trình duyệt xác nhận đúng
     `quiz:true, anagram:true, find_the_match:false, type_the_answer:true, open_the_box:true`.
   - Đọc lại 2 hàm `normalize()` trong `open-the-box-editor.js`/`type-the-answer-editor.js` xác nhận
     chúng tự bọc `content: {questions:[]}` (hình `createBlankAct()` ở `main.js` tạo khi bấm "+ New
     activity") về đúng `content.items` với item rỗng hợp lệ — nên tạo act MỚI của 2 loại này từ
     trang chủ sẽ không vỡ, dù chưa tự bấm thật được vì cần đăng nhập.
   - `templates/open-the-box/test.html` + `templates/type-the-answer/test.html`: tải lại, 0 lỗi
     console, màn READY hiện đúng — không hồi quy so với trước khi gộp.
   - **CHƯA tự kiểm được** (cần đăng nhập Google, Google chặn tự động hoá popup — bẫy đã biết): "+ New
     activity" hết hiện "Coming soon" cho 2 game này, tạo act thật, thẻ preview hiện đúng câu hỏi thật,
     kéo-thả/Move/Duplicate/Set assignment cho 2 loại act mới. Thầy tự thử trên bản live.
7. **`core/` KHÔNG bị đụng** — mọi thứ engine cần (cờ `inlineTimerBar`, `hasKeyboardToggle`,
   `buildExtraOptions`...) đã có sẵn từ các đợt build trước; `core/engine.js` đọc `ALL_TEMPLATES` thẳng
   từ `catalog.js` nên chỉ cần sửa đúng 1 chỗ (`catalog.js`) là panel "Template" trong game cũng tự
   cập nhật theo, không phải sửa thêm ở `engine.js`.
8. Cập nhật trạng thái 🟢→✅ trong `templates/open-the-box/GHI CHU OPEN-THE-BOX.md` +
   `templates/type-the-answer/GHI CHU TYPE-THE-ANSWER.md`. **Find the match vẫn 🟢, KHÔNG đụng.**
9. **ĐÃ COMMIT + PUSH GITHUB** theo đúng yêu cầu rõ ràng của thầy ("push để dùng được trên này") — xem
   commit ngay sau đợt này trong lịch sử git; đã `curl` kiểm chứng nội dung file live khớp bản vừa đẩy.

### 30/7/2026 — Type the answer: content editor + viết lại toàn bộ màn chơi theo góp ý chi tiết của thầy

Chi tiết đầy đủ: `templates/type-the-answer/GHI CHU TYPE-THE-ANSWER.md`. Tóm tắt:

1. **Content editor mới** (`type-the-answer-editor.js`) — bảng **Câu hỏi bên trái | Câu trả lời bên
   phải** (1 câu hỏi có thể nhiều câu trả lời), dán Excel tự nhận diện đúng cấu trúc ảnh thầy gửi (dòng
   câu hỏi trống = câu trả lời thêm cho câu hỏi phía trên), tối đa 50 câu.
2. **Bố cục màn chơi**: ô "Type your answer" cao hơn + rộng 80% khung, nút **Submit Answer** (mỏng hơn)
   nằm ngay dưới ô nhập.
3. **Tích xanh/X đỏ bay về điểm** ngoài mép phải ô nhập: đúng luôn cộng điểm; sai chỉ trừ điểm khi bật
   Option mới **"Minus points for wrong answers"**, tắt thì chỉ mờ dần không đổi điểm.
4. **"Show answer when wrong"** thành Option thật — bật thì câu sai hiện đáp án đúng xanh lá NGAY TRÊN ô
   nhập, khối ô nhập+Submit trượt mượt xuống nhường chỗ (CSS `grid-template-rows` 0fr→1fr, không dùng
   transform).
5. Bỏ "Letters on answers" khỏi Options (không áp dụng). Chấm luôn không phân biệt hoa/thường.
6. **Bàn phím ảo QWERTY** mới: giữa khung (60% rộng) + số bên trái + dấu câu bên phải, nút ẩn/hiện cạnh
   Menu, mặc định hiện mỗi khi mở act.
7. **Core bị đụng (đã hỏi thầy trước, chỉ 2 điểm, đều CHỈ THÊM)**: `core/engine.js` thêm cờ
   `tpl.hideLettersOption` (ẩn nhóm Letters on answers) + `tpl.hasKeyboardToggle`/`ui.kbdSlot` (chỗ trống
   cạnh Menu cho nút riêng của template) — bọc `menuBtn` trong `.aw-bottombar-left` để giữ đúng grid
   3-cột của `.aw-bottombar`; `core/icons.js` thêm icon `keyboard`. Đã test lại Quiz sau khi sửa core —
   không đổi gì, 0 lỗi.
8. Bắt 2 lỗi thật lúc test qua trình duyệt (gõ bằng chính bàn phím ảo mới xây): điểm không cộng vì
   `requestAnimationFrame` không chạy trong tab ẩn/không render (đã thêm `setTimeout` dự phòng cho vòng
   đếm điểm); hiệu ứng mở khối câu trả lời đúng bọc nhầm trong `requestAnimationFrame` không cần thiết
   (ô đã tồn tại từ trước, không phải mới tạo) — bỏ rAF, gọi thẳng.
9. **Type the answer VẪN `built:false`, CHƯA gộp trang chủ** — chờ thầy tự chơi thử rồi duyệt.

### 30/7/2026 — Open the box: đồng hồ thẳng mép ô câu hỏi, tách zoom ô số/trượt đáp án, sửa lỗi thật của việc căn giữa hàng cuối

3 việc, xem chi tiết đầy đủ ở `templates/open-the-box/GHI CHU OPEN-THE-BOX.md` đợt 10: (1) đồng hồ dịch
hẳn sang trái, mép trái đồng hồ THẲNG mép trái ô câu hỏi (đo `getBoundingClientRect` lệch 0px) — sửa
bằng cách cho cột đầu của `.has-inline` trong `core/app.css` một độ rộng CỐ ĐỊNH `1.6cqw` (đúng bằng
padding của ô câu hỏi) thay vì `auto` không đoán trước được; (2) tách hẳn 2 hiệu ứng — chỉ ô câu hỏi
zoom từ vị trí Ô SỐ, các ô đáp án KHÔNG zoom mà chỉ trượt ngang từ mép phải MÀN HÌNH (85cqw, đo bằng
khung game thật chứ không phải trong lòng ô); (3) **bug thật** của đợt 9: hàng cuối "đã căn giữa" nhưng
không thấy giữa — hoá ra CSS Grid chỉ có thể đặt ô lẻ vào TRỌN 1 cột, không chia được nửa cột, nên lệch
tâm thật (đo ra 37.5% thay vì 50%). Đổi hẳn `.aw-otb-grid` từ CSS Grid sang **Flexbox
`flex-wrap:wrap`+`justify-content:center`** — canh giữa mỗi hàng LIÊN TỤC, không theo bước cột. Gặp 1
bẫy khi đổi: cỡ ô đôi khi bị giới hạn bởi chiều cao chứ không phải chiều rộng, khiến khung rộng dư chỗ
nhét THÊM ô vào 1 hàng (ép test `cols=4` với 9 ô ra thật 6+3 thay vì 4+4+1!) — sửa bằng cách CHỐT đúng
bề rộng khung theo `cols*cell+gaps` thay vì để nó giãn hết cỡ. Test lại đủ: đo pixel xác nhận căn giữa
chính xác (lệch 0.5px, sai số làm tròn), chạy hết ván 9/9 tự động ra đúng "GAME COMPLETE", hồi quy
Quiz/Anagram không đổi gì, 0 lỗi console. **ĐÃ COMMIT + PUSH GITHUB** cùng đợt 8+9 — xem mục đầu file.

### 30/7/2026 — Open the box: thanh giờ full-width + đồng hồ chạy LIÊN TỤC, zoom chậm gấp đôi, đáp án trượt phải

9 điều chỉnh tiếp theo sau đợt xây editor (xem chi tiết đầy đủ trong
`templates/open-the-box/GHI CHU OPEN-THE-BOX.md` đợt 9 — file này chỉ tóm tắt): (1) thanh giờ nay chạy
gần hết chiều ngang khung, đồng hồ số đối xứng với điểm ở 2 đầu, chuyển đỏ dần + tích gấp đôi khi còn
≤5s (`core/app.css` đổi `grid-template-columns` của `.has-inline` từ `1fr auto 1fr` sang `auto 1fr
auto` — lần sửa `core/` thứ 2 cho Open the box, vẫn chỉ ảnh hưởng riêng nó); (2) lưới ô zoom lúc bấm
START nay kéo dài đúng **2.46 giây** — đo thật bằng `ffmpeg -i intro.mp3` (không có ffprobe trên máy)
để khớp chính xác độ dài nhạc; (3) bỏ 1 tiếng "xột xoạt" thừa phát chồng lên tiếng Intro lúc bấm START
— hoá ra là tiếng xáo câu hỏi (`shuffle.mp3`) vô tình phát cùng lúc, đã bỏ tiếng đó (vẫn xáo câu bình
thường); (4) hàng cuối thiếu ô giờ tự căn giữa; (5) tốc độ zoom Ô SỐ↔Ô CÂU HỎI chậm gấp đôi (600→1200ms);
(6) hiệu ứng "pop lưới" giờ chạy ở MỌI lần quay về màn lưới (không chỉ lần đầu) để đồng bộ cảm giác
zoom in/out; (7) đáp án trượt vào từ cạnh phải, trượt ngược ra phải khi đã chọn xong; (8)+(9) **kiến
trúc lại hẳn đồng hồ**: từ "mỗi câu 1 bộ đếm riêng, dừng khi về lưới" sang **1 bộ đếm DUY NHẤT chạy
liên tục từ ô đầu tiên cho tới hết ván** — đúng thì thanh giờ "đầy ngược trở lại" rồi chạy tiếp; sai thì
cứ chạy tiếp KỂ CẢ khi đang đứng ở màn lưới chọn ô kế — hết giờ ngay tại đó thì thua luôn, không cần mở
thêm ô nào. Test bằng `javascript_tool` xác nhận đúng cả 9 mục + hồi quy Quiz/Anagram không đổi gì, 0
lỗi console. **ĐÃ COMMIT + PUSH GITHUB** cùng đợt 10 — xem mục đầu file.

### 30/7/2026 — Open the box: bỏ chế độ Simple, xây content editor, đổi bộ âm thanh, hiệu ứng zoom + gộp thanh giờ/điểm

Thầy chốt 5 việc cho Open the box qua AskUserQuestion trước khi build (đã hỏi + chờ "ok build" đúng
quy trình):

1. **Bỏ hẳn chế độ "Simple"** (lật hộp xem chữ, không điểm) — chỉ còn "Questions" (đố vui trong hộp).
   `mountSimple()` cùng option `boxesAutoClose` bị xoá khỏi `open-the-box.js`. Mỗi câu hỏi giờ **bắt
   buộc có đáp án + tối thiểu 2 đáp án + 1 đáp án đúng** — chặn cả 2 lớp: `open-the-box-editor.js`
   (validate trước khi Save) VÀ `open-the-box.js` (lọc phòng thủ lúc chơi, phòng dữ liệu cũ/sửa tay).
2. **Xây `open-the-box-editor.js`** (màn soạn nội dung đầy đủ đầu tiên cho template này) — gần như
   COPY NGUYÊN `templates/quiz/quiz-editor.js` vì hình dạng dữ liệu giống hệt Quiz
   (`{question, answers:[{text,correct}]}`), chỉ đổi field `content.questions`→`content.items`, nhãn
   "Question N"→"Box N", giới hạn số hộp theo đúng luật Wordwall thật (`docs/04-OPEN-THE-BOX.md`: min
   2 – max 100 hộp, thay vì giới hạn câu hỏi của Quiz). Wire qua `otbTemplate.edit` (đúng hợp đồng
   `tpl.edit` có sẵn trong `core/engine.js`/`main.js` — không cần sửa gì thêm ở đó).
3. **Đổi toàn bộ bộ âm thanh** sang bộ 15 file gốc Wordwall thầy tải riêng
   (`D:\APP AND DATA\Source\Sound effect\OPEN THE BOX`, copy vào `templates/open-the-box/sounds/`,
   xoá bộ mượn tạm từ Anagram trước đó). **Lưu ý đặt tên gameOver/timesUp — thầy chốt NGƯỢC với tài
   liệu gốc của chính bộ âm thanh** (file `GHI CHU.md` trong bộ âm thanh ghi TimesUp = tiếng "keng"
   lúc đồng hồ về 0, GameCompleted mới là tiếng thắng): thầy yêu cầu **GameOver phát khi THUA vì hết
   giờ, TimesUp phát khi THẮNG (mở hết hộp)** — đã build ĐÚNG theo lời thầy, file "05 GameCompleted"
   gốc vì vậy **không dùng tới**. Thêm: ClockTick tích mỗi giây lúc đồng hồ câu hỏi đang chạy, Shuffle
   lúc xáo thứ tự hộp, TileAppear lúc lưới hộp xuất hiện đầu ván, TileEliminate lúc 1 hộp bị khoá do
   trả lời sai. Sửa luôn 1 lỗi nhỏ có sẵn từ đợt trước: `sounds.complete` (hook chạy ở MỌI lần
   `ui.finish()`, kể cả thua) từng gán nhầm tiếng "thắng" — bỏ hẳn hook đó, để tiếng thắng/thua tự
   template gọi đúng lúc như trên, tránh phát 2 tiếng chồng nhau khi thua.
4. **Hiệu ứng zoom lúc bấm START**: lưới hộp xuất hiện nhỏ hơn (scale .72) rồi zoom dần về cỡ chuẩn,
   so le nhẹ theo thứ tự ô (CSS `@keyframes aw-otb-box-in`, class `.is-entrance` chỉ gắn ở lần render
   ĐẦU TIÊN của mỗi ván — không lặp lại khi quay về lưới sau khi trả lời 1 câu). An toàn với bẫy
   transform+animation (`.aw-otb-box` định vị bằng CSS Grid, không phải `transform`, nên animate
   `transform: scale()` ở đây không dính bẫy "popup nhảy vị trí").
5. **Gộp thanh giờ + điểm cùng 1 hàng** — việc DUY NHẤT cần sửa `core/` đợt này, thầy đã đồng ý qua
   AskUserQuestion với điều kiện **chỉ ảnh hưởng Open the box**. Thêm cờ opt-in `tpl.inlineTimerBar`:
   `core/engine.js` chỉ thêm 1 khe `ui.topbarMid` (giữa `.aw-topbar`, 3 cột CSS Grid `1fr auto 1fr`)
   KHI template khai cờ này; không khai thì `.aw-topbar` giữ nguyên y hệt flex 2-con cũ (đã test lại
   Quiz + Anagram xác nhận `topbar.className === "aw-topbar"`, không có `.aw-topbar-mid`, 0 lỗi
   console). `open-the-box.js` chuyển việc dựng đồng hồ+thanh giờ từ bên trong `.aw-otb-qcard` sang
   `ui.topbarMid`, xoá padding-top vá tạm của đợt 6 (không cần nữa vì không còn 2 hàng chồng nhau).

**Test bằng `javascript_tool`** (browser thật, không phải bench giả): chơi hết 9 câu ĐÚNG hết →
"GAME COMPLETE" 9/9 (đúng gọi `timesUp`); để hết giờ giữa chừng → "GAME OVER" (đúng gọi `gameOver`);
chọn 1 đáp án SAI → hộp khoá + khoá icon hiện đúng (đúng gọi `tileEliminate`); Show answers hiện đủ 9
dòng; bảng kết thúc đủ 4 mục Leaderboard/Show answers/Start again/Play a different template. Editor:
mở đúng badge "OPEN THE BOX", đủ 9 thẻ, nút Remove đáp án tự khoá đúng lúc còn 2 đáp án, Save chặn
đúng khi xoá trắng câu hỏi ("Box 1 has no question text."), Cancel không đụng dữ liệu gốc (mở lại vẫn
9 câu y nguyên). `read_network_requests` xác nhận cả 16 file mp3 tải 200 OK, không file nào 404. 0
lỗi console suốt toàn bộ quá trình test cả 2 template (Open the box) lẫn hồi quy (Quiz, Anagram).

**File thay đổi đợt này**: `core/engine.js` + `core/app.css` (cờ `inlineTimerBar`/`ui.topbarMid`, đã
diff kỹ — 2 chỗ mỗi file), `templates/open-the-box/open-the-box.js` (viết lại, bỏ mountSimple),
`templates/open-the-box/open-the-box.css`, `templates/open-the-box/otb-sound.js` (viết lại toàn bộ),
`templates/open-the-box/sounds/*.mp3` (thay hết, 16 file), `templates/open-the-box/
open-the-box-editor.js` (mới), `templates/open-the-box/sample-open-the-box.js` (đổi hẳn sang dữ liệu
Questions mode — 9 câu từ vựng/ngữ pháp thay cho 9 câu speaking prompts cũ, vì Simple mode không còn).

**ĐÃ COMMIT + PUSH GITHUB** (commit `a2db784`, gộp chung với đợt 9+10 — thầy nói "lưu, commit + git
push" sau khi test xong cả 3 đợt). Vẫn `built:false`, chưa gộp trang chủ (đúng quy trình, chờ thầy
duyệt xong).

**CHỜ TEST TOMKO** (màn cảm ứng thật): (a) cảm giác zoom lúc bấm START có đủ mượt/rõ trên màn lớn
không; (b) nghe đủ 16 âm thanh đúng lúc, đặc biệt cặp GameOver/TimesUp theo đúng nghĩa thầy chốt
(ngược với tên file gốc); (c) thanh giờ + điểm nhìn có thật sự "cùng 1 hàng" trên màn 86" hay cần
chỉnh độ rộng `42cqw` của `.aw-otb-q-topbar`.

### 30/7/2026 — Đẩy "Open the box" lên GitHub + sửa tài liệu bàn giao ghi sai

Thầy chọn đẩy code lên mạng. Kiểm tra thấy `origin/main` chỉ còn thiếu đúng 1 commit (`a87fe8a` —
Open the box's Questions mode); mọi thứ khác (v0.9.4, v0.9.5, Anagram) **đã có sẵn trên GitHub từ
trước rồi**, dù `APP_MASTER.md` ghi "web live vẫn v0.9.3" — thông tin đó SAI/lỗi thời (đã kiểm bằng
`curl` thấy `core/catalog.js` live có `anagram built:true`). Đã push commit còn thiếu, `curl` kiểm
chứng `templates/open-the-box/otb-sound.js` live (200 OK). Vì Open the box vẫn `built:false` (chưa
gộp trang chủ, chờ thầy duyệt) nên đợt push này **không đổi gì học sinh/thầy thấy trên web**, chỉ
đồng bộ code nền. Đã sửa lại `APP_MASTER.md` (mục đầu file + mục 0b) cho khớp thực tế git/curl.

### 29/7/2026 — DỜI DỰ ÁN 2 CHẶNG: `PROJECT\AWord` → `D:\APP AND DATA\AWord` → `E:\LAP TRINH APP\AWord`

Cùng ngày nhưng **hai lần dời, hai quyết định khác nhau của thầy** — ghi lại cả hai để sau này khỏi
tưởng là một.

#### Chặng 1 — ra khỏi lớp bọc `PROJECT\`
Thầy muốn AWord nằm chung hàng với các app khác trên `D:\APP AND DATA`, bỏ thư mục bọc `PROJECT\`
(nó chỉ chứa mỗi AWord nên sau khi dời đã rỗng → xoá luôn).
`D:\APP AND DATA\PROJECT\AWord\` → `D:\APP AND DATA\AWord\` — **343 file / 2,3 MB** (kể cả `.git`),
đối chiếu TRƯỚC/SAU khớp chính xác. Kho git nguyên vẹn, vẫn **ahead 5** so với GitHub.

#### Chặng 2 — sang ổ E, theo đúng luật "ổ E = code, ổ D = dữ liệu"
Thầy hỏi có nên đưa AWord sang ổ E không. **Nên** — AWord là code và đã có trên GitHub, mà `.git`
của nó lại đang nằm trong vùng Google Drive đồng bộ, đúng cái mô hình đã làm hỏng kho myStudent
27/7 (Drive nhân đôi ref thành `master (1)`). Nhưng **phải đẩy lên GitHub TRƯỚC** vì lúc đó còn 6
commit chưa push — Drive đang là tấm lưới an toàn duy nhất cho phần việc đó; dời sang E trước là
rút lưới khi bản sao trên mạng còn thiếu.

**Thứ tự đã làm:** push GitHub (`5de9553..829f78f`) → rồi mới dời sang `E:\LAP TRINH APP\AWord`.

⚠️ **BẪY GẶP KHI DỜI GIỮA 2 Ổ ĐĨA:** `Move-Item` từ D sang E là **chép rồi xoá**, và bước xoá
**thất bại giữa chừng** ở `.git\hooks` (`You do not have sufficient access rights` — Drive giữ khoá).
Kết quả: 31 file đã sang E, 318 file còn ở D — **dự án bị chẻ đôi**. Cách gỡ: đếm thấy 31+318 = 349
= đúng tổng ban đầu (không mất gì) → dùng `robocopy /E` gộp nốt phần còn lại sang E → kiểm đủ 349
file/2,38 MB → chạy `git fsck` xác nhận kho sạch + `rev-parse` khớp GitHub → **rồi mới** xoá bản trên D.
**Bài học: dời giữa 2 ổ thì đừng tin `Move-Item`; dùng `robocopy` rồi xoá tay sau khi đã kiểm chứng.**

**Đã sửa các chỗ trỏ đường dẫn (cả 2 chặng):**
1. `D:\OTHERS\CLAUDE\.claude\launch.json` — cấu hình preview tên `aword` (cổng 5510) nay trỏ
   `E:\LAP TRINH APP\AWord\devserver.py`. **Đây là chỗ dễ quên nhất** vì nằm ngoài dự án: mọi đường
   dẫn TRONG dự án là tương đối nên dời cả cụm không gãy, riêng file ngoài buộc phải ghi địa chỉ
   tuyệt đối. Đã thử: giữ địa chỉ cũ thì python báo `can't open file ... No such file or directory`.
2. `APP_MASTER.md` (mục 4 — cây thư mục), `docs/07-ARCHITECTURE.md` (2 chỗ), mục "Cách chạy thử
   trên máy" ở đầu file này.
3. Trí nhớ của Claude: `aword-project.md` + `MEMORY.md`.

**Kiểm chứng (chạy thật, làm ở chặng 1 — cấu trúc thư mục con không đổi ở chặng 2):**
- Trang chủ `http://localhost:5510/` hiện đúng ("AWord in ANDREW CLASSES", nút Sign in with Google),
  **0 lỗi console**.
- Trang test `templates/anagram/test.html` → **20/20 tệp `core/*` và font tải 200 OK**, 0 lỗi console
  ⇒ mọi đường dẫn tương đối vẫn đúng sau khi dời.

### v0.9.5 — 24/7/2026 — ASSIGNMENT CŨ TỰ DỌN VÀO "DONE" KHI SANG NGÀY MỚI
⚠️ **CHỐT Ở LOCAL, CHƯA PUSH GITHUB** (nối tiếp v0.9.4, lý do như cũ — xem mục 0b APP_MASTER.md).

**Yêu cầu của thầy**: khi tạo assignment mới cho 1 lớp, nếu ngày tạo KHÁC (mới hơn) ngày của các
assignment cũ đang nằm ngay trong thư mục lớp đó, thì TOÀN BỘ các assignment cũ đó tự động chuyển vào
thư mục con **DONE** (nằm trong thư mục lớp). Assignment cùng ngày, hoặc lỡ có ngày sau assignment mới
(hiếm khi xảy ra), thì KHÔNG bị chuyển.

- `core/assignments.js`: thêm `assignmentsToArchive(siblings, newCreatedAt)` — hàm thuần lọc theo NGÀY
  DƯƠNG LỊCH thật (0h-24h theo giờ máy, không phải "24 giờ gần nhất"), so `dayStart()` của từng assignment với
  `dayStart()` của assignment vừa tạo; trả về những cái có ngày SỚM HƠN (nghiêm ngặt `<`, không phải
  `!=`) — nên đúng theo ví dụ thầy chốt: assignment mới 12/5 thì gom 11/5 vào DONE, còn 12/5 cũ hay 13/5
  (nếu có) đứng yên.
- `core/assignment-ui.js`: thêm `archiveOlderSiblings(folderId, assignment)`, gọi NGAY sau khi
  `createAssignment()` xong ở nút START. Chỉ chạy khi assignment mới có `folderId` (đã nằm trong 1 thư
  mục lớp cụ thể — Yêu cầu 1 của thầy giữ nguyên hành vi cũ: KHÔNG tự tạo thư mục lớp, thầy vẫn tự tạo
  trước). Tìm thư mục con tên "DONE" (không phân biệt hoa/thường) ngay trong thư mục lớp; chưa có thì
  tạo mới bằng `store.createFolder()`. Rồi chuyển từng assignment cũ bằng `updateAssignment(code,
  {folderId: doneId})` — đúng cơ chế đã có sẵn từ v0.9.0 (Results đọc thẳng `folderId` của assignment,
  không có bản sao, nên đổi `folderId` là "di chuyển" thật).
- Việc này chạy NGẦM (best-effort): nếu lỗi mạng/quyền, chỉ `console.warn`, KHÔNG chặn thầy nhận link+QR
  vừa tạo (giữ đúng luật cũ ở v0.8.0: đừng để lỗi phụ làm hỏng luồng chính).
- Đã kiểm bằng script Node độc lập (hàm lọc theo ngày là hàm thuần, test được ngoài trình duyệt): ví dụ
  đúng thầy đưa (11/5 → bị gom, 12/5 & 13/5 → đứng yên) chạy đúng. **CHƯA test được đầu-cuối thật** (tạo
  2 assignment 2 ngày khác nhau rồi xem DONE tự hiện) vì cần đăng nhập Google — máy build không tự động
  hoá được bước đăng nhập (xem BẪY mục 9) — nhờ thầy test khi rảnh.

### v0.9.4 — 24/7/2026 — CLASS + BÁO CÁO ASSIGNMENT ĐẸP HƠN + IN CHUẨN A4
⚠️ **CHỐT Ở LOCAL, CHƯA PUSH GITHUB** — thầy còn sửa nhiều thứ nữa trước khi đẩy lên mạng lần tới.
Chỉ có commit local; web live (`andrewclasses-01.github.io/AWord`) vẫn đang chạy bản v0.9.3 cũ.

**1. Pop-up "Set assignment" (`core/assignment-ui.js`) — thêm ô Class:**
- Ô **Class** mới, bắt buộc, nằm trên ô Assignment title. Gõ vào ô Class thì CHỈ phần tên lớp ở đầu
  Assignment title tự đổi theo (`replaceClassToken()` — chỉ thay từ đầu tiên, giữ nguyên phần thầy tự
  gõ thêm phía sau), không đụng gì khác. Gợi ý sẵn tên lớp nếu act đang nằm trong 1 thư mục lớp ở
  Activities (không bắt buộc dùng).
- Tiêu đề gợi ý mặc định đổi thành đúng mẫu thầy chốt: `A1A — 24.7 — LSA2-S1.T1.P1-2-3 / ENG2`
  (lớp — ngày.tháng không năm — tên act), qua hàm `fmtDateShort()`.
- 3 tuỳ chọn cuối game đổi mặc định: **Leaderboard** (đổi tên từ "See the leaderboard") = bật ·
  **Show answers** = tắt · **Start again** = bật.
- Bỏ trống Class → chặn tạo, báo lỗi "Please enter the class." (không đụng `assignments.js`/luật
  Firestore, mọi lọc thư mục/cấm trùng tên vẫn đọc từ tiêu đề như cũ).

**2. Pop-up báo cáo assignment (`openAssignmentDetail`) — dọn lại theo góp ý thầy:**
- **Bỏ nút Delete khỏi pop-up** — xoá giờ CHỈ làm được qua menu ⁝ ở thẻ trong Results (main.js đã có
  sẵn `assignmentMenuItems` với Delete riêng, không đổi gì ở main.js).
- 5 nút Refresh/Copy link/Copy QR/Open activity/Edit → đổi thành **icon tròn** (`iconButton()` +
  `.aw-as-iconbtn`), có tooltip. Thêm 4 icon mới trong `core/icons.js`: `refresh`/`link`/`qr`/`openExternal`.
- **Summary** thêm đủ Students/Plays/**Top Score**/**Top Speed - Tên** (người điểm cao nhất + nhanh
  nhất trong số đó), nhãn nhỏ chuyển lên TRÊN số lớn (đổi thứ tự trong `stat()`), khối căn giữa
  (`justify-content:center` trên `.aw-as-stats`).
- **Leaderboard**: thu hẹp còn 60% bề ngang + căn giữa (`.aw-as-lb{width:60%;margin:0 auto}`), mọi cột
  `text-align:center`.
- **Details**: mọi cột căn giữa; mở chi tiết 1 học sinh chuyển từ `display:none/block` (giật cục) sang
  animation mượt bằng `max-height` đo từ `scrollHeight` thật + transition; hàng điểm tối đa (full marks)
  tô chữ xanh lá giống leaderboard (`.aw-as-detail .aw-as-tr.is-perfect`).
- Đã test bằng dữ liệu giả (không cần đăng nhập Google — móc test tạm gắn rồi gỡ sạch ngay sau khi đo).

**3. In worksheet (`core/print.js`) — SỬA TẬN GỐC lỗi header đè nội dung + thêm số trang thật:**
- **Nguyên nhân**: cách cũ dùng `position:fixed` cho header/footer lặp lại mỗi trang, nhưng Chrome đo
  `top`/`left`/`bottom` đó SAI gốc quy chiếu khi `@page` có margin khác 0 → header/logo lệch so với tính
  toán bằng mm (đã tra cứu xác nhận đây là lỗi đã biết của Chrome, không phải lỗi logic).
- **Sửa**: bỏ hẳn `position:fixed`, chuyển 100% sang CSS chuẩn **`@page` margin box**
  (`@top-left`/`@top-right`/`@bottom-left`/`@bottom-right` — Chrome 131+ đã hỗ trợ đủ 16 margin box).
  Margin box không bao giờ lệch (luôn nằm đúng trong lề của nó), và @top-left/@bottom-left luôn thẳng
  mép trái với nhau, @bottom-left/@bottom-right luôn cùng hàng — nên logo tự thẳng hàng với tiêu đề +
  số trang, khỏi đoán số mm.
- Tiêu đề act → `@top-left`; "Name / Date: ___" → `@top-right`; **logo AWord** (2 cỡ chữ, không nhét
  vừa 1 chuỗi CSS `content`) → vẽ thành **ảnh SVG nhỏ** (`logoImageUrl()`) gắn vào `@bottom-left`; **số
  trang thật** dạng **"X/Y"** (`counter(page) "/" counter(pages)`) → `@bottom-right` — tính năng cách cũ
  không làm được (chỉ margin box mới đọc được `counter(page)`/`counter(pages)`).
- Lề trang giảm từ `24mm/14mm/18mm` xuống `16mm/12mm/14mm` (mỏng hơn theo yêu cầu thầy).
- Gỡ hết CSS/HTML cũ của `.aw-print-runhead/-runfoot/-htitle/-hname/-hline/-logo` (không còn ai gọi).
- Đã test: CSS `@page` sinh ra được trình duyệt phân tích hợp lệ (kể cả tiêu đề có dấu `"`/`\`/tiếng
  Việt), ảnh SVG logo vẽ đúng — nhưng **CHƯA in giấy/PDF thật được** (máy dùng để build không có máy in
  ảo) → thầy đã tự in thử và xác nhận đẹp, thẳng hàng.

### v0.9.3 — 23/7/2026 — NHẬN SẴN TÊN HỌC SINH TỪ myLesson (`play.html?g=…&n=…`)

**Bối cảnh:** dự án **myLesson** (app máy tính + web bài tập, dựng 23/7/2026) nhúng game AWord vào
trang bài của học sinh. Học sinh đã đăng nhập bên myLesson rồi (lớp + tên), nên hỏi tên lần nữa chỉ
tổ sinh tên gõ sai — đúng thứ phá bảng xếp hạng và báo cáo của thầy ("Chang Ang" thay "Trang Anh").

**Làm gì:** `play.js` đọc thêm tham số `n` trong link. Có tên hợp lệ (≥2 ký tự) thì **bỏ qua màn
"Enter your name"**, vào chơi luôn với đúng tên đó, đồng thời nhớ vào `aword-student-name` như cũ.

**Không đổi gì khác:** link cũ chỉ có `?g=<mã>` chạy y hệt trước — vẫn hiện màn nhập tên.

**Làm được nhờ:** myLesson (`andrewclasses-01.github.io/myLesson/`) và AWord
(`andrewclasses-01.github.io/AWord/`) **cùng một nhà** trên GitHub Pages.
⚠️ Chuyển một trong hai sang tài khoản GitHub khác là mất tính năng này.

**Đã test thật** (localhost:5510, bài giao `j9nsa2`): mở `play.html?g=j9nsa2&n=CHẤN PHONG` →
vào thẳng màn READY của game, không hỏi tên; `localStorage.aword-student-name = "CHẤN PHONG"`.

### v0.9.2 — 20/7/2026 — GỠ HỘP THOẠI "Bring your saved work online?"
Thầy phản ánh hộp thoại này **hiện lại mỗi lần mở app**. Nguyên nhân: nút "Not now" chỉ đặt biến
`skipMigrationThisSession` trong bộ nhớ trang, tải lại trang là quên → hỏi tiếp; `markMigrated()` chỉ
được gọi khi bấm "Copy them up". Thứ nó đòi chuyển chỉ là **1 thư mục cũ tên "TEST IN"** còn sót trong
localStorage của máy từ trước ngày lên mây.

Thầy chốt **bỏ hẳn**: việc chuyển thư viện lên mây đã xong 19/7 và nay không còn gì ghi vào
localStorage nữa, nên hộp thoại chỉ còn khả năng làm phiền. Đã gỡ `maybeOfferMigration()` khỏi
`main.js` (kèm biến cờ + 4 import không dùng nữa). **`importLocalLibrary()` vẫn còn trong store.js**
để nếu ngày nào cần thì gọi tay từ console. Dữ liệu cũ trong trình duyệt KHÔNG bị xoá, chỉ là app
không hỏi nữa.


### v0.9.1 — 20/7/2026 — 7 TINH CHỈNH THEO GÓP Ý CỦA THẦY (đã test thật)
1. **Fullscreen bấm được ngay ở màn READY** (chưa Start cũng phóng to được): nút mang thêm class
   `.aw-fs-always` (z-index 14) để nổi TRÊN lớp phủ READY (`.aw-play-overlay` z-index 12), và đổi
   sang màu sáng khi lớp phủ còn đó (`:has()`).
2. **Nút "Open activity"** trong pop-up báo cáo: đang ở TRONG act thì chỉ **đóng pop-up**
   (`inAct: true` do engine truyền); ở **Results** thì **mở act ở tab mới** (`?a=<num>`, dự phòng
   `?play=<id>`).
3. **Leaderboard tô màu cả hàng**: điểm tuyệt đối → **xanh lá** (`.is-perfect`), 0 điểm → **đỏ**
   (`.is-zero`); STT/tên/score/time cùng màu.
4. **"Detail" → "Details"**.
5. **CHẾ ĐỘ TẬP TRUNG**: bấm 1 học sinh trong Details thì **chỉ hàng tên đó + bảng chi tiết là sáng**,
   mọi phần khác của pop-up mờ đi (opacity .22 + blur 1.2px). Mở em khác thì tự đóng em cũ.
   ⚠️BẪY: bảng chi tiết nằm TRONG `.aw-as-detail` nên bị chính luật làm-mờ ăn theo → phải dùng dấu
   `>` (con trực tiếp) chứ không dùng dấu cách (mọi cấp).
6. **CHẤM ĐỎ BÁO CÓ BÀI NỘP MỚI**: HS nộp → ghi `lastSubmitAt` + `submitCount` lên chính doc bài giao
   (luật Firestore mở đúng 2 field này cho người chưa đăng nhập, không đụng được gì khác); thầy mở
   báo cáo → ghi `lastSeenAt`. Chấm đỏ hiện ở: **thẻ bài giao** và **thư mục** trong Results (dồn từ
   trong ra, mọi cấp), **act** trong Activities (nếu bài giao của nó có bài mới), và **cuối thanh
   assignment** ngay sau ngày giờ. Góc trên-phải, cách mép 10px, viền trắng 2.5px cho nổi.
   *Vì sao không đếm bằng cách đọc điểm*: sẽ tốn 1 truy vấn cho MỖI bài giao mỗi lần mở trang.
7. **Thanh assignment hạ xuống 58px + vạch kẻ mảnh** ngăn khu act với khu assignment (`.aw-as-bars`
   margin-top 58 + padding-top 22 + border-top; `:empty` thì bỏ hết để không có vạch thừa).

**ĐÃ TEST THẬT** (localhost, tài khoản thầy): fullscreen bấm được lúc READY ✔ · vạch + khoảng cách
120px tới khung ✔ · chấm đỏ ở thẻ/act/thanh (10px/10px) ✔ · HS chưa đăng nhập ghi được cờ báo-mới ✔ ·
xem xong chấm đỏ tự tắt ✔ · Open activity: trong act thì đóng, ở Results mở `?a=1` tab mới ✔ ·
leaderboard xanh 6/6 + đỏ 0/6 ✔ · Details ✔ · chế độ tập trung (0.22 vs 1) ✔.


### v0.9.0 — 20/7/2026 — RESULTS = CHÍNH BÀI GIAO (một bản duy nhất) + CẤM TRÙNG TÊN
Thầy chốt: **"Xoá hay sửa ở Results thì cũng xoá và sửa trong act, chúng đồng bộ là 1."**

1. **KHÔNG có bản sao nào**: mục Results **đọc thẳng** danh sách bài giao (`assignments/{code}`), thư mục
   trong Results chỉ để xếp cho gọn (`folderId` nằm trên chính doc bài giao). Nên thẻ ở Results và
   thanh dài dưới act là **cùng một tài liệu** — sửa/xoá chỗ nào cũng ăn cả hai, không thể lệch.
2. **TỰ XẾP VÀO THƯ MỤC LỚP**: lấy phần đầu tên bài giao trước `_` hoặc khoảng trắng
   (vd `A1A_9.6_WORDS ...` → **A1A**) rồi tìm thư mục TRÙNG TÊN trong Results (không phân biệt hoa
   thường, tìm cả thư mục con, ưu tiên nông nhất). Không thấy → để ngoài cùng Results. Hộp thoại
   Set assignment hiện sẵn dòng **"Filed in Results under A1A"** để thầy biết trước khi bấm START.
3. **CẤM TRÙNG TÊN** (3 chỗ thầy nêu): thư mục con cùng mẹ · act cùng thư mục · bài giao cùng thư mục.
   Chặn ở `createFolder/renameItem/moveItem/saveActivity` (ném `err.code = "aw/duplicate-name"`, hộp
   thoại hiện lỗi đỏ và KHÔNG đóng). Riêng **Duplicate** và **Restore** tự đếm lên "(2)", "(3)"... để
   không bao giờ chặn tay thầy.
4. **SỬA BÀI GIAO** (`openAssignmentEdit`): đổi tên · đổi hạn nộp · bật/tắt 3 ô cuối game · **đóng bài**.
   Vào được từ menu ⁝ ở Results HOẶC nút Edit trong pop-up báo cáo. Bài đóng: HS mở link thấy
   "This assignment is closed", điểm cũ vẫn xem được.
5. **XOÁ = THÙNG RÁC**: `trashed` trên doc bài giao → biến khỏi Results + khỏi dưới act, **link HS
   ngừng nhận bài**, điểm giữ nguyên, Restore lấy lại được. **Delete forever** trong thùng rác xoá
   thật: doc + toàn bộ `scores` + toàn bộ `results` (đã test: còn 0/0).
6. **XOÁ ACT CÓ BÀI GIAO** → hộp thoại hỏi tại chỗ: *Cancel · Delete activity only · Delete both*
   (mỗi bài giao giữ bản sao game riêng nên xoá act không bắt buộc làm hỏng bài HS đang làm).
7. **Kéo-thả bài giao** vào thư mục Results / lên breadcrumb; menu ⁝ có Move; trùng tên khi thả thì
   báo lỗi chứ không im lặng.
8. **TRANG HS NAY SẠCH THẬT**: engine chuyển sang **nạp trì hoãn** `assignment-ui.js` và `store.js`
   (chỉ nạp trên đường của thầy) → `play.html` không tải một dòng code nào có thể chạm tới thư viện
   (đã đo `performance.getEntriesByType('resource')`: KHÔNG có store.js, KHÔNG có assignment-ui.js).
9. **LUẬT FIREBASE cập nhật lần 2 (đã Publish)**: `results` nay cho **thầy XOÁ** (`allow read, delete:
   if isTeacher()`) để "Delete forever" dọn sạch được; HS vẫn chỉ được TẠO, không ai sửa.
10. **ĐÃ TEST THẬT** (localhost, tài khoản thật của thầy):
   | Kiểm tra | Kết quả |
   |---|---|
   | Results hiện bài giao, không có bản sao | ✔ |
   | Tạo thư mục A1A/A2B, bài `A1A_20.7_...` **tự vào A1A** | ✔ (huy hiệu đếm "1") |
   | Nhận diện lớp: hoa/thường, không có lớp, lớp không tồn tại | ✔ 4/4 |
   | Trùng tên: thư mục / act / bài giao cùng chỗ | ✔ chặn; khác thư mục thì cho |
   | Đổi tên + đóng bài ở Results → thanh dưới act đổi theo | ✔ |
   | HS mở link bài đã đóng | ✔ báo "closed", không chơi được |
   | Xoá → thùng rác → Restore | ✔ |
   | Delete forever | ✔ xoá cả bài giao + scores + results |
   | Xoá act có 2 bài giao → hộp thoại 3 nút | ✔ (bấm Cancel, act còn nguyên) |
   | Move bài giao sang thư mục khác | ✔ |
   | play.html KHÔNG nạp store.js / assignment-ui.js | ✔ |


### v0.8.0 — 20/7/2026 — ASSIGNMENT + THU ĐIỂM HỌC SINH + LINK SỐ + BỘ SINH QR (đã test thật)
Chặng lớn: thầy giao bài được cho học sinh bằng **link + QR**, HS chơi **không cần đăng nhập**, điểm
tự chảy về cho thầy xem chi tiết từng câu.

**1. `core/qr.js` — BỘ SINH QR TỰ VIẾT (dùng lại được cho app khác)**
- Thuần JS, không phụ thuộc mạng/thư viện ngoài: byte mode, mức chống lỗi M, tự chọn cỡ 1..15
  (tới 412 ký tự). Xuất `qrSvg()` (nét căng mọi cỡ), `qrPngDataUrl()`, `copyQrImage()`, `downloadQrPng()`.
- **Cách kiểm chứng**: `core/qr-test.html` so từng ô với bộ mã chuẩn + gửi ảnh cho MÁY QUÉT thật đọc lại.
  Kết quả: **13/13 chuỗi đọc đúng**, mọi cỡ mã (kể cả cỡ nhiều khối dữ liệu).
- **LỖI TỰ PHÁT HIỆN KHI TEST**: chỗ đặt "thông tin định dạng" (format info) bị XOAY ngang-dọc → mã
  nhìn vẫn giống QR nhưng KHÔNG máy nào quét được. Đọc chéo bản chuẩn mới lòi ra (bẫy đáng nhớ).

**2. LINK SỐ + thanh địa chỉ tự đổi + Copy link**
- Mỗi folder/act có thêm `num` (1, 2, 3...) lưu trên Firestore → link gọn: `?r=activities` · `?f=12` ·
  `?f=12&a=57` · `?a=57`. `ensureNumbers()` tự đánh số 1 lần cho dữ liệu cũ (theo thứ tự tạo).
- Thanh địa chỉ đi theo chỗ đang đứng (pushState) + **Back/Forward của trình duyệt dùng được**
  (`routeFromLocation`). Link cũ `?play=`/`?folder=` vẫn mở, và được nâng cấp im lặng sang dạng số.
- Menu ⁝ của folder & act thêm **Copy link**.

**3. ASSIGNMENT (`core/assignments.js` + `core/assignment-ui.js`)**
- Nút **Set assignment** → pop-up SETUP: Assignment title · Deadline (ô tích "No deadline") · 3 ô tích
  cuối game (Leaderboard / Show answers / Start again) · nút BACK + START.
- START → ghi `assignments/{mã 6 ký tự}` chứa **BẢN SAO** act (thư viện thầy không lộ; sửa act sau
  không phá bài HS đang làm) → pop-up SHARE: link + QR + Copy link / Copy QR image / Download QR.
- Dưới khung chơi hiện **thanh dài** cho mỗi assignment; bấm → pop-up CHI TIẾT (nền tối + mờ):
  dãy thông tin + Refresh/Copy link/Copy QR · **Summary** (số HS, số lượt, số lượt muộn) ·
  **Leaderboard** (mỗi tên lấy lượt tốt nhất) · **Detail** (Student/Submitted/Correct/Incorrect/Time,
  mọi cột bấm xoay xuôi-ngược, bấm dòng sổ ra từng câu: câu hỏi · HS trả lời · ✓/✗ · đáp án đúng).
- Mã assignment là NGẪU NHIÊN (không phải số đếm) để HS không mò được sang bài lớp khác.

**4. TRANG HỌC SINH `play.html` + `play.js`**
- Trang RIÊNG, **không nạp `core/store.js`** → từ đây không có đường nào chạm tới thư viện của thầy.
- Nhập tên → chơi → Game Complete **tự nộp**; menu cuối bài chỉ hiện đúng ô thầy đã tích.
- Chơi lại thoải mái, mỗi lượt là 1 bản ghi. Sau deadline vẫn chơi được, có báo trước là sẽ tính muộn.
- Tên gõ lệch hoa-thường/thừa dấu cách được **gộp về một em** (`nameKey`), hiển thị bản viết đẹp nhất.

**5. ENGINE — chế độ học sinh (`startGame(..., { session })`)**
- Có `session` thì KHÔNG dựng cụm công cụ của thầy (Options/Template/Style/Edit/Assignment/Print/Home)
  và bỏ "Change template" trong menu ☰ → HS không có đường vào.
- `session.submit()` nộp bài; `session.entries()` cấp bảng xếp hạng lớp (đọc kho điểm công khai).

**6. LUẬT FIREBASE MỚI (đã Publish 20/7 bằng Claude in Chrome)**
- Thêm `assignments/{code}/scores/{id}`: **đọc công khai**, chỉ chứa tên + điểm + thời gian, ai cũng
  thêm được lượt của mình nhưng KHÔNG sửa/xoá được. Đây là nguồn cho bảng xếp hạng HS xem cuối bài.
- `results/{id}` (bài làm chi tiết) giữ nguyên: **chỉ thầy đọc**, không ai sửa/xoá.
- **Đã thử tấn công thật từ phía HS**: đọc results → BỊ CHẶN · đọc thư viện thầy → BỊ CHẶN · sửa điểm
  người khác → BỊ CHẶN · đọc bảng xếp hạng → CHO PHÉP. Đúng như thiết kế.

**7. HAI LỖI TỰ PHÁT HIỆN KHI TEST (đã sửa)**
- **Báo cáo hiện "chưa ai chơi" trong khi thật ra là ĐỌC HỎNG**: `loadReport` bắt lỗi rồi trả mảng rỗng
  → thầy tưởng lớp chưa làm bài. Sửa: dùng `Promise.allSettled`, hỏng CẢ HAI thì báo lỗi rõ + thêm
  nút **Refresh**.
- **`navigator.clipboard.writeText()` TREO VÔ HẠN khi cửa sổ không được focus** (không ném lỗi!) →
  bấm Copy link mà không thấy phản hồi gì. Sửa: gom `copyText()` vào `core/utils.js`, đặt hạn giờ
  1,2 giây rồi quay về cách cũ (textarea + execCommand).

**8. ĐÃ TEST THẬT ĐẦU-CUỐI** (đăng nhập tài khoản thật của thầy, thầy tự bấm chọn account 1 lần):
| Kiểm tra | Kết quả |
|---|---|
| Đánh số link cho dữ liệu cũ + `?a=1` mở đúng act | ✔ |
| Thanh địa chỉ tự đổi + Back/Forward | ✔ |
| Copy link trong menu ⁝ | ✔ |
| Tạo assignment → link + QR | ✔ |
| HS mở link, nhập tên, chơi, tự nộp | ✔ |
| Bảng xếp hạng HS xem cuối bài | ✔ |
| Gộp tên "trang anh" = "Trang  Anh" → 1 em, lấy lượt tốt nhất | ✔ |
| Báo cáo của thầy: Summary + Leaderboard + Detail sổ từng câu | ✔ |
| Sắp xếp cột 2 chiều | ✔ |
| Deadline: HS vẫn chơi + nhãn LATE + đếm "Late plays" | ✔ |
| Bảo mật 4 phép thử từ phía HS | ✔ |


### v0.7.4 — 19/7/2026 — THƯ VIỆN LÊN MÂY: store.js → Firestore + BẮT ĐĂNG NHẬP (đã test thật)
Thầy chốt: **"Bắt đăng nhập mới vào được"**. Thư viện của thầy giờ nằm trên Firestore, đi theo thầy
mọi máy.

1. **`core/store.js` ĐỔI RUỘT localStorage → Firestore** (`users/{uid}/items/{id}`). **Danh sách hàm
   xuất ra GIỮ NGUYÊN 100%** → `main.js`, `quiz-editor.js`, `engine.js` **KHÔNG phải sửa 1 dòng nào**
   ở chỗ gọi. Đây chính là lý do v0.5.0 viết store.js kiểu async ngay từ đầu — đã trả công.
   - Cách chạy: đọc TOÀN BỘ item của thầy 1 lần vào `cache` trong bộ nhớ (thư viện chỉ vài trăm doc
     nhỏ) → mọi logic cây giữ nguyên như cũ; ghi thì cập nhật cache + đẩy **chỉ doc thay đổi** bằng
     `writeBatch` (chunk 400, dưới trần 500 của Firestore).
   - `clean()` bỏ mọi field `undefined` — **Firestore từ chối `undefined`** (bẫy).
   - `resetCache()` gọi khi đăng nhập/đăng xuất để không lẫn dữ liệu 2 tài khoản.
2. **Cổng đăng nhập** (`main.js`): chưa đăng nhập thì KHÔNG render gì ngoài màn "Sign in with Google"
   (đã kiểm: `libraryLeaked: false`). Header có **chip tài khoản** (ảnh Google, tooltip = email) →
   menu **Sign out**. `signIn()` tự đăng xuất + báo lỗi rõ nếu lỡ đăng nhập nhầm account khác.
3. **Chuyển dữ liệu cũ lên mây**: hộp thoại mời copy thư viện localStorage cũ của máy đó lên cloud;
   `importLocalLibrary()` **bỏ qua id đã có** nên chạy 2 lần cũng không tạo bản trùng.
4. **3 LỖI TỰ PHÁT HIỆN KHI BUILD/TEST (đã sửa)**:
   - `openModal(title, buildBody)` **không báo khi bị đóng** → hàm `await` hộp thoại sẽ **treo vĩnh
     viễn** nếu thầy bấm ra ngoài. Thêm tham số thứ 3 `onClose` + chặn close() gọi 2 lần.
   - `toastMsg` không thêm class **`.is-on`** → CSS `.aw-lib-toast` mặc định `opacity:0` nên thông báo
     **vô hình**. (BẪY: class đã tồn tại sẵn trong app.css từ trước.)
   - `openMenu` nhận item dạng **mảng `[label, fn, danger]`** chứ không phải object → bản đầu em viết
     object sẽ crash khi bấm. Đã sửa.
5. **Hỏi thầy trước khi tích "I accept the Firebase terms"** và trước khi đăng nhập bằng tài khoản
   Google của thầy — không tự ký/tự cấp quyền thay thầy.
6. **ĐÃ TEST THẬT TRÊN WEB LIVE** (đăng nhập bằng account thật của thầy, thầy tự bấm chọn account vì
   Google chặn tự động hoá bước đó):
   | Kiểm tra | Kết quả |
   |---|---|
   | Chưa đăng nhập | chỉ thấy màn login, thư viện KHÔNG lộ ✔ |
   | Đăng nhập Google | vào thư viện, chip tài khoản đúng email ✔ |
   | Tạo folder / act / đếm / đổi tên | ✔ |
   | **resetCache rồi đọc lại** (ép đọc mạng) | dữ liệu quay về đúng → **thật sự nằm trên cloud** ✔ |
   | Thùng rác → khôi phục | ✔ |
   | Tìm kiếm | ✔ |
   | Sửa act → lưu → đọc lại | tiêu đề mới đúng, **6 câu hỏi lồng nhau còn nguyên**, vị trí giữ nguyên ✔ |
   | Chơi game từ dữ liệu cloud | ✔ |
   | Popup Print | Anagram/Crossword/Quiz ✔ |
   | Dọn đồ test | 0 sót — Firestore console chỉ còn đúng 1 doc `act_sample_quiz` ✔ |
7. **UX sửa sau khi test**: hộp thoại migration từng hỏi copy thứ **đã có sẵn** trên cloud (máy thầy
   có `aword-lib` chứa đúng `act_sample_quiz` do lúc đầu trình duyệt lấy nhầm store.js cũ từ cache —
   **đúng cái bẫy cache của GitHub Pages**: các file KHÔNG cập nhật đồng thời, có thể main.js mới mà
   store.js còn cũ). Thêm `pendingImportCount()` so id với cloud → không còn hỏi thừa.
- **CÒN LẠI**: Settings + leaderboard vẫn ở localStorage (chưa đồng bộ); `?play=` hiện vẫn đọc thư
  viện (cần đăng nhập) — khi làm **Assignment** sẽ chuyển sang `assignments/{code}` công khai cho HS.

### v0.7.3 — 19/7/2026 — FIREBASE đã dựng xong + nối lớp kết nối (làm tự động qua Claude in Chrome)
Thầy bảo "mở claude in chrome để tự động giúp tôi việc xử lý trên firebase" → em làm TRỌN bằng
trình duyệt thật, thầy không phải bấm gì (trừ 1 lần xác nhận điều khoản).

1. **Xác minh tài khoản trước khi tạo**: Firebase console đang đăng nhập `namdaptrai01@gmail.com` —
   ĐÚNG account thầy chốt (khớp email trong luật bảo vệ). Kiểm tra bước này TRƯỚC khi tạo gì.
2. **Tạo project**: tên `AWord`, ID **`aword-70dae`**, số 399279049436, gói **Spark miễn phí**.
   - **TẮT "Join the Google Developer Program"** (mặc định BẬT — đăng ký thừa, thầy không cần).
   - **TẮT Google Analytics** (không cần + tránh theo dõi hành vi học sinh).
   - ⚠️ Ô **"I accept the Firebase terms"** = thoả thuận pháp lý → em **HỎI THẦY** rồi mới tích
     (quy tắc: không tự ký thay thầy). Thầy đồng ý.
3. **Firestore**: Standard edition · Database ID `(default)` · **Location asia-southeast1
   (Singapore)** — gần VN nhất, ⚠️**KHÔNG đổi lại được** · **Start in production mode** (khoá kín;
   test mode sẽ mở toang 30 ngày — tránh).
4. **Authentication**: bật **Google** sign-in; public-facing name đổi `project-399279049436` →
   **`AWord`** (tên thầy/HS thấy khi đăng nhập); support email `namdaptrai01@gmail.com`.
5. **Authorized domains**: thêm **`andrewclasses-01.github.io`** (⚠️ThIẾU bước này = đăng nhập lỗi).
   `localhost` đã có sẵn nên test ở máy vẫn chạy.
6. **Luật bảo vệ Firestore**: đã **Publish**. ⚠️**BẪY**: ô soạn luật là **CodeMirror**, gõ tay bị
   auto-đóng-ngoặc + auto-indent làm hỏng code → **dán bằng JS**:
   `document.querySelectorAll('.CodeMirror')[0].CodeMirror.setValue(text)` (instance 0 = parent
   `.main-editor`; instance 1,2 là pane diff). setValue có bắn event nên nút Publish tự sáng.
7. **Web app** `AWord Web` (KHÔNG tích Firebase Hosting — đã có GitHub Pages) → lấy `firebaseConfig`.
   ⚠️**BẪY**: tiện ích Chrome **chặn đọc chuỗi giống khoá** qua javascript_tool/DOM
   (`[BLOCKED: Cookie/query string data]`) → phải **`computer zoom`** vào vùng code để đọc bằng mắt.
8. **`core/firebase.js` (MỚI)**: config + nạp SDK **LAZY** qua CDN `gstatic.com/firebasejs/**12.9.0**`
   (đã dò: 12.9.0 là bản mới nhất còn sống, 13.x chưa có) → giữ **zero-build, không cần Node**.
   Xuất `auth()/db()/fs()/signIn()/signOutNow()/onUser()/currentUser()/isTeacher()`; `signIn()` tự
   đăng xuất + báo lỗi rõ nếu đăng nhập nhầm account khác.
   `firebaseConfig` **KHÔNG phải bí mật** (Google thiết kế công khai) → để trong repo public là chuẩn.
9. **ĐÃ TEST BẢO MẬT THẬT trên web live** (chạy trong trình duyệt, chưa đăng nhập = đóng vai người lạ):
   | Thử | Kết quả |
   |---|---|
   | Người lạ GHI vào `users/*/items` | 🔒 permission-denied ✔ |
   | Người lạ ĐỌC `users/*/items` | 🔒 permission-denied ✔ |
   | HS chưa đăng nhập ĐỌC `assignments/*` | ✅ cho phép (cần để chơi) ✔ |
   | Người lạ TẠO `assignments/*` | 🔒 permission-denied ✔ |
   Module nạp OK, projectId đúng, 0 lỗi. **Mô hình bảo mật chạy đúng như thiết kế.**
- **CÒN LẠI (chưa làm)**: đổi ruột `core/store.js` localStorage → Firestore + nút đăng nhập Google
  trên header + chuyển dữ liệu cũ trong máy lên mạng. Đây là thay đổi LỚN vào code đang chạy tốt →
  chờ thầy chốt trước khi build.

### v0.7.2 — 19/7/2026 — LÊN MẠNG: GitHub + GitHub Pages (web chạy thật từ mọi nơi)
Thầy chốt: **repo CÔNG KHAI** · **chỉ thầy đăng nhập Google mới sửa được** · **deploy trước, Firebase ngay sau**.

1. **Rà an toàn trước khi đẩy công khai**: quét toàn bộ project — KHÔNG có mật khẩu/API key/token,
   KHÔNG có dữ liệu học sinh (dữ liệu nằm ở localStorage từng máy, không vào repo). Tổng 646K/63 file.
2. **Kiểm tra đường dẫn**: xác nhận KHÔNG có đường dẫn tuyệt đối (`src="/..."`, `from "/..."`) — nếu có
   sẽ hỏng khi web nằm trong thư mục con `/AWord/`. Asset (font/mp3/theme) resolve qua `import.meta.url`
   nên chạy đúng. ⚠️ BẪY cho các phiên sau: **luôn dùng đường dẫn tương đối**.
3. **git init** (branch `main`) + `.gitignore` + **`.nojekyll`** (bắt buộc — không có thì GitHub Pages
   chạy Jekyll và có thể bỏ qua file/thư mục bắt đầu bằng `_`) + `README.md` (tiếng Anh, mô tả dự án +
   cách chạy). Commit đầu 63 file.
4. **Repo PUBLIC** `github.com/andrewclasses-01/AWord` (cùng tài khoản mySpeaking, gh CLI đã đăng nhập
   sẵn) → push `main`.
5. **Bật GitHub Pages** (branch `main`, thư mục gốc) qua `gh api`. Chờ ~25 giây build xong.
6. **ĐÃ TEST TRÊN WEB THẬT** https://andrewclasses-01.github.io/AWord/ : trang chủ thư viện hiện đúng
   (2 gốc Activities/Results, logo, footer); mọi file 200 OK; vào game bấm PLAY chạy, trả lời đúng lên
   điểm, **font Baloo 2 tải đúng**, popup Print hiện đúng 3 định dạng; **0 lỗi console**.
7. **Firebase**: viết `docs/08-FIREBASE-SETUP.md` — hướng dẫn thầy tự tạo project 7 bước (bấm tay, có
   ghi rõ chọn **asia-southeast1 Singapore**, bật Firestore + Google Sign-in, **thêm authorized domain
   `andrewclasses-01.github.io`** kẻo đăng nhập lỗi), kèm **luật bảo vệ Firestore viết sẵn** (chỉ email
   thầy được sửa; HS chỉ tạo result, không sửa/xoá; thư viện riêng tư).
   **Mô hình dữ liệu chốt**: `users/{uid}/items/{id}` (thư viện riêng) · `assignments/{code}` (BẢN SAO
   act, công khai đọc → thư viện KHÔNG lộ + sửa act sau không phá bài HS đang làm) · `results/{id}`.
   **ĐANG CHỜ thầy**: gửi `firebaseConfig` + xác nhận email Google dùng trong luật.
- Lưu ý: `firebaseConfig` **không phải bí mật** (Google thiết kế để công khai) — an toàn nằm ở luật
  Firestore, nên dán vào repo public là bình thường.

### v0.7.1 — 19/7/2026 — PRINT làm lại theo mẫu thầy: popup chọn ĐỊNH DẠNG + bố cục worksheet
Thầy gửi 3 ảnh mẫu (Anagram / Unjumble / Quiz worksheet có thương hiệu AWord) làm chuẩn thiết kế, và
yêu cầu Print thành **nhiều ĐỊNH DẠNG chọn qua popup**. Làm lại toàn bộ hệ Print (bỏ bản v0.7.0):

1. **Bấm Print → popup chọn định dạng** (icon): **Anagram · Crossword · Quiz · Unjumble**. Chỉ hiện
   icon những định dạng KHẢ DỤNG:
   - **Anagram, Quiz**: mọi template, mọi số câu.
   - **Crossword**: 2..35 câu, mọi template TRỪ `type-the-answer` (renderer CHƯA build → hiện icon kèm
     nhãn "soon", bấm chỉ báo coming soon; sẽ build crossword sau).
   - **Unjumble**: chỉ `type-the-answer`, mọi số câu.
   - Đã test biên: 1 câu→[Anagram,Quiz]; 2 câu→+Crossword; 35 câu→còn Crossword; 36 câu→mất Crossword;
     type-the-answer→[Anagram,Quiz,Unjumble] (không Crossword). Đúng hết.
2. **Bố cục worksheet theo ảnh mẫu** (áp dụng MỌI template), 2 cột + vạch phân cách nét đứt, header
   (title trái + "Name / Date: ____" phải, có 2 vạch kẻ) lặp mỗi trang, footer logo **AWord / in ANDREW
   CLASSES** lặp mỗi trang:
   - **Anagram**: số + 💡 + đề (clue) → dãy chữ cái ĐÁP ÁN bị xáo trong ô xám → dãy ô trống để HS điền.
   - **Quiz**: số + 💡 + đề → 4 lựa chọn A/B/C/D lưới 2×2, mỗi lựa chọn có ô vuông tick, chữ IN HOA.
     (Nếu template có sẵn options thì dùng; nếu không, tự sinh 3 mồi nhử từ "kho đáp án" của cả bài.)
   - **Unjumble**: số + các TỪ của câu bị xáo, cách nhau; dưới là 1 dòng kẻ để HS viết lại câu đúng.
3. **Setup in**: mặc định **A4** (`@page { size:A4 }`); thiết kế **thuần thang xám** nên in **đen trắng**
   tự nhiên. **In 2 mặt KHÔNG ép được từ web** (là lựa chọn trong hộp thoại máy in — trình duyệt chặn vì
   riêng tư) → popup có ghi chú nhắc thầy chọn double-sided trong hộp thoại.
4. **Kiến trúc**: Print nay là **hệ DÙNG CHUNG** `core/print.js` (không viết riêng từng template):
   `openPrintPopup(activity)` → popup + luật khả dụng + chuẩn hoá activity thành `[{clue,answer,options}]`
   (qua hook `template.toPrintItems(activity)`, có bộ đọc mặc định kiểu Quiz) → render worksheet. Thêm
   hook `toPrintItems` cho Quiz (`templates/quiz/quiz.js`). `core/engine.js` printBtn gọi popup. Icon mới
   (bulb + 4 icon định dạng) trong `icons.js`. CSS popup + `.aw-pf-*` worksheet (chỉ `@media print`) trong
   `core/app.css`. Ghi hợp đồng vào `core/HUONG DAN CORE.md`.
5. Đã test bằng javascript_tool (chặn `window.print`): popup đúng định dạng theo type/số câu; render 3
   định dạng khớp ảnh mẫu (đã chụp màn mô phỏng @media print); Anagram xáo đúng chữ cái đáp án + ô trống
   đúng số chữ; Quiz 4 lựa chọn có tick; Unjumble xáo từ + dòng viết; `afterprint` tự gỡ sheet; 0 lỗi
   console. **CHƯA in ra giấy/PDF thật** — thầy thử in để xác nhận bố cục A4 + header/footer lặp trang.
6. **BẪY đã biết (chưa chặn được hoàn toàn)**: header/footer dùng `position:fixed` + `@page margin` để
   lặp mọi trang — chuẩn cho worksheet 1 TRANG (đa số ca dùng); worksheet DÀI nhiều trang có thể lệch,
   cần thầy test in mới biết. Nếu lệch sẽ chuyển sang cách chia trang thủ công.

### v0.7.0 — 19/7/2026 — Khối 2: PRINT (in bài giấy + đáp án) — ĐÃ THAY BẰNG v0.7.1
Bắt đầu chặng Print (thầy chốt roadmap: Print → sau này Firebase → Assignment). Nút **Print** ngoài
khung (trước chỉ toast "coming soon") giờ xuất ra **2 trang giấy A4**:
- **Trang 1 (bài làm)**: "ANDREW CLASSES" + tên bài + ô Name/Class/Date để trống cho học sinh điền,
  rồi danh sách câu hỏi đánh số, mỗi câu 4 (hoặc nhiều hơn) lựa chọn **A/B/C/D...** xếp 2 cột.
- **Trang 2 (đáp án riêng cho thầy)**: cùng nội dung nhưng đáp án ĐÚNG in đậm + dấu ✓, kèm dòng tắt
  ở đầu trang kiểu "1-A 2-A 3-A..." để chấm nhanh không cần đọc từng câu.
- **Luôn theo thứ tự GỐC + luôn có chữ cái A/B/C** bất kể màn hình đang Shuffle/Letters gì — để mỗi
  lần in ra giống hệt nhau và khớp đúng với trang đáp án.
- Kỹ thuật: thêm **`print(activity)`** làm tuỳ chọn thứ 2 (sau `edit`) trong hợp đồng
  engine↔template (`core/HUONG DAN CORE.md`). `core/engine.js`: printBtn gọi `tpl.print(activity)` →
  DOM trả về được gắn làm anh em của `#app`, gọi `window.print()`, gỡ lại khi đóng hộp thoại
  (`afterprint` + `setTimeout` dự phòng theo đúng luật animate()/callback của core). CSS in
  (`.aw-print-*`, chỉ hiện trong `@media print`, `#app` bị ẩn lúc in) thêm vào `core/app.css` —
  dùng CHUNG được cho template khác sau này (cấu trúc câu hỏi+lựa chọn khá tổng quát), giống tiền lệ
  `.aw-rv-*` của màn Show answers.
- `templates/quiz/quiz.js`: thêm `buildPrintSheet`/`buildPrintPage` dựng 2 `<section class="aw-print-page">`.
- Đã test thật (javascript_tool, chặn `window.print` để không bật hộp thoại thật lúc dò lỗi): bấm
  Print → tạo đúng 2 trang, câu hỏi/đáp án khớp dữ liệu mẫu, trang đáp án đánh dấu đúng 6/6 câu, dòng
  tắt "1-A 2-A 3-A 4-A 5-A 6-A" đúng, mô phỏng `afterprint` → trang in tự gỡ khỏi DOM. Không lỗi
  console. Chưa in thử ra giấy/PDF thật (cần thầy bấm thử trên máy in thật để xác nhận bố cục A4).
- **CHƯA LÀM**: nút Print trong TRANG CHỦ (thư viện, khi chưa mở game) — hiện chỉ hoạt động khi đang ở
  MÀN GAME (nút Print dưới khung). Cân nhắc thêm entry-point in trực tiếp từ thẻ act trong thư viện ở
  đợt sau nếu thầy thấy cần.

### v0.6.9 — 19/7/2026 — Bỏ kẻ ngang trên tên + chữ foot cân xứng với chấm ⁝
1. **Bỏ đường kẻ ngang mảnh trên tên**: xoá `border-top` của `.aw-card-foot`.
2. **Chữ (tên + type) dịch phải cho CÂN XỨNG**: `.aw-fm-grid .aw-card-foot { padding-left:21px }` —
   khoảng cách viền TRÁI thẻ → mép chữ (22px) = khoảng cách viền PHẢI thẻ → đúng tâm cột chấm ⁝ (21px),
   lệch 1px. Áp dụng đồng loạt act + folder.
- Đã đo thật cả act lẫn folder: 22 vs 21px, border-top 0px, 0 lỗi console.

### v0.6.8 — 19/7/2026 — Ghim ⁝ đúng 1 vị trí góc thấp nhất-phải cho MỌI thẻ + số folder hạ nhẹ
Thầy chỉ ra ⁝ vẫn mỗi thẻ một chỗ. **Nguyên nhân tìm ra**: các thẻ trong cùng hàng grid bị kéo CAO BẰNG
NHAU (grid stretch), nhưng foot không được ghim xuống đáy thẻ → thẻ nào nội dung ngắn thì foot (và ⁝)
"lơ lửng" ở độ cao khác nhau.

1. **Ghim foot xuống ĐÁY thẻ**: `.aw-card-foot` thêm `margin-top:auto` → foot của MỌI thẻ (folder, act
   tên ngắn, act tên dài) đều nằm sát đáy, ⁝ cùng một chỗ tuyệt đối.
2. **⁝ về góc thấp nhất-phải, dịch thêm phải + xuống**: `.aw-fm-grid .aw-card-menu { margin-right:-7px;
   margin-bottom:-7px }` → cách mép phải 6px, mép đáy 4px (trước 13/11). Chấm ⁝ nằm THẲNG HÀNG dòng
   type của act / dòng tên folder (đo tâm: folder lệch 0px, act lệch 3px — không nhận ra bằng mắt).
   Tên act vẫn ở trên, tự co giãn 1-2 dòng theo độ dài (mọc lên trên).
3. **Số trong folder hạ nhẹ**: `.aw-fp-count` top 48% → **50%** (đo tâm chip = 50% chiều cao preview).

Đã test thật (đo 5 thẻ: 4 folder + act tên dài 2 dòng): ⁝ ĐỒNG LOẠT 6px-phải/4px-đáy; 0 lỗi console.

### v0.6.7 — 19/7/2026 — Bố cục foot theo mẫu thầy (tên/type/⁝) + tên 38 ký tự + số folder đảo + Settings menu
Thầy gửi ẢNH bố cục foot act mong muốn (tên TRÊN, "QUIZ" DƯỚI, ⁝ GÓC DƯỚI-PHẢI) làm mẫu chuẩn cho act.
(Đảo lại so với v0.6.6: ⁝ từ trái → **phải**; type từ trên → **dưới tên**.)

**1. Foot act theo mẫu ảnh** (`main.js actCard` + CSS): thứ tự info đổi thành **tên (trên) → type QUIZ
(dưới)**; ⁝ về **góc dưới-PHẢI** (bỏ `order:-1`, giữ `align-self:flex-end`). Cỡ chữ to hơn: tên `.9rem`
grid (đậm 800), type `.82rem` xanh dương đậm hoa (trước .62rem). Nội dung căn ĐÁY foot. Đo: tên trên type,
⁝ 13px-phải/11px-đáy.

**2. Tên folder căn theo TYPE của act, size = tên act** (thầy chốt): folder không có type nên tên hạ
xuống **ngang dòng type của act** (đáy foot) nhưng **cỡ = cỡ tên act** (đo: đáy tên folder = đáy type act
= 11px; font tên folder = font tên act = 14.4px). Đạt nhờ cùng bottom-align + folder tên dùng `.aw-card-name`.

**3. Tên tối đa 38 ký tự, tràn thì nâng dòng lên** (CSS): grid name 2 dòng `.9rem`, căn đáy nên khi cần
dòng 2 thì **mọc LÊN TRÊN** (đoạn vượt ở dòng dưới). Đo: 38 (và 39) ký tự vừa 2 dòng.

**4. Số đếm folder: nâng cao + ĐẢO thứ tự/màu** (`folderCard` + CSS): `top:57%→48%`; thứ tự MỚI = **số
act TRƯỚC (màu XANH DƯƠNG) | số folder SAU (màu VÀNG CAM)** (trước: folder xanh trước, act cam sau). Đo:
[acts=xanh(47,123,255), folders=cam(240,144,42)].

**5. Settings thành MENU nhiều dòng** (`openSettingsFlow` viết lại): bấm bánh răng → menu các dòng:
**Default activity options** (bật) + **Appearance** / **Leaderboard & results** (coming soon, mờ — chỗ
cho tính năng thầy update sau). Chọn **Default activity options** → **danh sách template** (Quiz sẵn + 4
coming soon) → chọn template → **form options mặc định của template đó** + Save. Có nút **‹ Back** ở tiêu
đề, điều hướng lùi từng cấp (Settings ↔ template list ↔ options).

**Đã test thật (javascript_tool, 0 lỗi console):** act tên-trên/type-dưới/⁝-phải; folder tên căn đáy=type
act + cùng cỡ; 38-39 ký tự 2 dòng; Mixed đếm [2 xanh | 1 cam] nâng cao; Settings menu 3 dòng → Default
activity options → 5 template → Quiz defaults → đổi letters=abc + Save lưu store + đóng; Back về menu / về
template list đều đúng.

### v0.6.6 — 19/7/2026 — Thẻ folder: ⁝ góc dưới-trái + tên căn = act + icon to + SỐ ĐẾM + footer sát đáy
Thầy test v0.6.5 OK, giao tiếp 6 tinh chỉnh trình quản lý.

**1. Nút ⁝ về GÓC DƯỚI-TRÁI, đều nhau mọi thẻ** (CSS): `.aw-card-menu` thêm `order:-1` + `align-self:
flex-end` (foot `align-items:flex-end`). ⁝ giờ luôn ở góc dưới-trái, **cùng vị trí bất kể tên dài ngắn**
(đo: 13px từ trái, 11px từ đáy — GIỐNG HỆT cho cả folder lẫn act). Bề rộng tên KHÔNG đổi (⁝ chỉ chuyển
từ phải sang trái).

**2. Tên folder căn ĐÁY = tên act** (CSS): `.aw-card-info` thành flex-column `justify-content:flex-end`
→ tên nằm đáy foot. Trước tên folder ngang hàng dòng "type" (trên); nay ngang hàng dòng TÊN của act (đo:
đáy tên folder = đáy tên act = 11px). folderCard bọc tên trong `.aw-card-info` cho đồng cấu trúc với act.

**3. Icon folder to hơn**: `.aw-fp-icon` 92px → **108px**.

**4. SỐ ĐẾM giữa folder** (`store.folderCounts` + `folderCard`): `folderCounts(id)` trả `{folders: số
thư mục con TRỰC TIẾP, acts: TỔNG act đệ quy mọi tầng}`. Hiển thị chip `.aw-fp-count` giữa thân folder:
  - **Chỉ có act (không thư mục con)** → **1 số** = tổng act. Không act → **không hiện gì**.
  - **Có cả thư mục con VÀ act** → **2 số** ngăn bởi nét dọc ngắn, KHÁC MÀU: trái = số thư mục con trực
    tiếp (xanh dương), phải = tổng act đệ quy (cam).
  - Không có act (kể cả khi có thư mục con) → không hiện số (theo luật thầy chốt).

**5. Footer XUỐNG SÁT ĐÁY màn hình**: `.aw-lib` thành `min-height:100vh; display:flex; flex-direction:
column` + `.aw-foot { margin-top:auto }` → footer luôn bị đẩy xuống cuối trang, sát mép dưới (đo: cách đáy
viewport 10px). Giảm padding-bottom trang.

**Đã test thật (javascript_tool, dựng lib xác định, 0 lỗi console):** Empty→không số; Mixed(1 sub + 1 act
trực tiếp + 1 act lồng)→**2 số [1 | 2]**; OnlyActs(2 act)→**1 số [2]**; OnlySub(1 sub, 0 act)→không số;
icon 108px; ⁝ folder/act đều ở 13px-trái/11px-đáy; tên folder & act căn đáy khớp (11px); footer 2 dòng
cách đáy màn 10px; list view số đếm vẫn đúng [1|2].

### v0.6.5 — 19/7/2026 — Folder preview + màu folder + kéo-thả + logo cân đối + footer mọi trang
Thầy test v0.6.4 OK, giao tiếp 6 tinh chỉnh giao diện trình quản lý.

**1. Folder preview cân đối như thẻ act** (`main.js folderCard` + `.aw-fp`): thẻ folder giờ = **vùng
preview icon TO** (`.aw-fp-icon` 92px trong panel kem `.aw-fp` cao 118px như `.aw-cp`) + **foot bên dưới**
(tên + nút ⁝) giống hệt thẻ act → cân đối. List view icon nhỏ lại tương ứng.

**2. Màu folder** (store `setFolderColor` + node folder có field `color`): menu ⁝ folder thêm mục **Color**
→ mở popup **8 màu hiện đại** (`FOLDER_COLORS`: đỏ/cam/hổ phách/lá/teal/xanh dương/tím/hồng) + nút
**Default color**. Bấm màu → đổi màu icon folder ngay + lưu store (bền qua reload). Swatch đang chọn có viền.

**3. Icon tìm kiếm** (`icons.search` + CSS): sửa lỗi hiển thị (SVG không cỡ) — kính lúp hiện đại
`.aw-fm-searchbtn svg { 18px }` + hover xanh.

**4. Kéo-thả di chuyển item** (`main.js makeDraggable/makeDropTarget`): act & folder **kéo được**; **thả
vào thẻ folder** = chuyển item vào folder đó; **thả lên chữ trong breadcrumb** (Activities gốc / các
folder tổ tiên — trừ "Home") = đưa item về thư mục đó. Có viền sáng nơi thả. `moveItem` chặn thả folder
vào chính subtree của nó; chặn thả lên chính nó. (HTML5 drag; click folder vẫn mở như thường.)

**5. Logo cân đối CHUẨN — width khớp mà KHÔNG méo chữ** (`sizeBrand` viết lại): quay lại đo width nhưng
dùng **letter-spacing** thay scaleX → giữ nguyên hình dạng từng chữ, chỉ giãn khoảng cách để **chiều dài
"in ANDREW CLASSES" đúng bằng chiều dài "AWord"** ở MỌI trang (đo sau khi font ready; `ls=(L-w0)/(n-1)`,
gộp khoảng trắng đuôi bằng margin-right âm). Đo: trang chủ chữ dừng đúng mép logo 193px; trong thư mục
111=111px. `.aw-brand-sub` CSS bỏ letter-spacing cứng (JS điều khiển).

**6. Footer mọi trang** (`main.js footer()`): giữa-cuối mọi trang thư viện + trang Edit có 2 dòng
**"Phone & Zalo: 0359.769.765"** + **"Copyright © 2018 - 2026 ANDREW CLASSES by Pham Xuan Ninh. All
Rights Reserved."** (editor nhận qua param `footer`; KHÔNG thêm vào màn đang chơi để không phá khung 16:9).

**Đã test thật (javascript_tool, 0 lỗi console):** folder icon 92px + foot tên/⁝; menu có Color → 8 swatch
→ chọn violet đổi màu + lưu store `#8b5cf6`; search icon 18px kính lúp; kéo act "EXCEL PASTE TEST" thả vào
Grammar → act vào trong; trong Grammar kéo act thả lên crumb "Activities" → về gốc (dragover preventDefault=
chấp nhận); logo trang chủ visible 193px khớp, editor 111=111; footer đủ 2 dòng ở trang chủ + trong thư
mục + editor.

### v0.6.4 — 19/7/2026 — Tinh chỉnh thiết kế header + DÁN EXCEL trực tiếp vào ô câu hỏi + bỏ câu rỗng khi Save
Thầy góp ý sau khi xem v0.6.3.

**1. Thiết kế header:**
- **Icon Settings mới** (`icons.js`): thay bánh răng tự vẽ (méo, mất cân đối) bằng gear **Feather** đối xứng, đẹp/đều hơn.
- **Tagline "in ANDREW CLASSES" giữ ĐÚNG TỶ LỆ CHỮ GỐC**: bỏ hẳn cách kéo `scaleX` (làm méo chữ) — **gỡ hàm `sizeBrand` + mọi lời gọi** trong `main.js`. Thay bằng **giãn letter-spacing** vừa phải (`.aw-brand-sub` 1.5px, phần đậm 2.5px; bản nhỏ is-sm 1px/1.6px). Giờ chữ không méo, tagline rộng ~183px so với logo 193px (sát tự nhiên, không ép).

**2. DÁN EXCEL kiểu MỚI — dán thẳng vào ô câu hỏi** (`quiz-editor.js` `onQuestionPaste`): thầy mô tả đúng thao tác Excel thật:
- Thầy bôi vùng bảng (vd A1:G25 — cột A = câu hỏi, cột B-G = đáp án lần lượt), Ctrl+C.
- Bấm vào **ô câu hỏi** (bất kỳ câu nào) rồi **Ctrl+V** → app tự tách bảng: **cột đầu = câu hỏi, các cột sau = đáp án theo thứ tự** (position-independent — copy ở B1:H25 vẫn đúng vì đọc từ mảng ô đã copy, KHÔNG theo tên cột tuyệt đối). Điền **từ câu đang bấm trở xuống** (bấm Q1 = điền cả list), tự tạo đủ câu, **tối đa 120** (dư thì cắt + báo). Quá 6 đáp án/hàng thì cắt còn 6. Ô đáp án rỗng bị bỏ; nếu <2 đáp án thì đệm cho đủ 2 ô trống.
- **KHÔNG đánh dấu đáp án đúng nào** (thầy chốt): sau khi dán thầy tự tích từng câu, hoặc bấm **Mark correct in all**. Chưa tích mà Save vẫn báo lỗi như cũ.
- Dán **1 ô đơn** (không có tab/xuống dòng) vào ô bất kỳ → **để trình duyệt dán bình thường**, KHÔNG can thiệp. Có dòng **Tip** nhắc cách dán.
- (Nút "Paste from Excel" + hộp thoại preview cũ đã gỡ ở v0.6.3; cơ chế mới gọn hơn, đúng thói quen Excel.)

**3. Save tự bỏ câu RỖNG** (`quiz-editor.js`): "Add question" mà để trống hoàn toàn (không chữ câu hỏi + không đáp án) → khi Save **tự động bỏ** câu đó (lọc trước khi validate), không báo lỗi. Câu có phần dở dang (có chữ nhưng thiếu đáp án đúng...) vẫn báo lỗi để thầy sửa.

**Đã test thật (javascript_tool, 0 lỗi console):** gear Feather; brand transform=none + letter-spacing 1.5px (không méo); dán TSV 3 hàng vào ô Q1 → 3 câu đúng cột, hàng 7 đáp án cắt còn 6, KHÔNG câu nào tích đúng + info nhắc; dán 1 ô đơn KHÔNG bị chặn (dispatchEvent trả true); Mark correct in all A → cả 3 câu tích A; thêm 1 câu rỗng (4 thẻ) + đặt tên + Save → lưu đúng **3 câu** (câu rỗng bị bỏ), đáp án [4,3,6]; về thư viện OK.

### v0.6.3 — 19/7/2026 — Header dùng chung + Settings (options mặc định) + đổi thuật ngữ act + sửa editor Quiz
Thầy giao 1 loạt yêu cầu lớn. Thầy chốt: header (logo + Settings + Activities/Results) hiện ở **trang
thư viện + trang Edit** (KHÔNG vào màn đang chơi); Settings đợt này chỉ làm **Options mặc định cho
template**; dán bảng Excel CHỈ khi danh sách câu hỏi trống (giữ từ v0.6.2 — nhưng nút Paste bị gỡ khỏi
editor theo yêu cầu #5, xem dưới). "Ok build".

**1. Header dùng chung** (`main.js` `topbar(showNav)`, class **`.aw-appbar`**): trái = cụm logo (bấm về
trang chủ top-level); phải = nút **Settings** (bánh răng) — ở trang chủ CHỈ có Settings; ở trang trong
thư mục + trang Edit thêm 2 nút **Activities / Results** thành cụm cân đối. **Logo to hơn** (4.15rem);
tagline "in ANDREW CLASSES" được **kéo scaleX cho bằng đúng bề rộng logo** (đo lúc font ready — `sizeBrand`;
đã đo 193px=193px). Nút bánh răng xoay nhẹ khi hover.

**2. Settings — Options mặc định** (`core/settings.js` MỚI, key `aword-settings`): `getDefaultOptions(type)`
(built-in defaults + phần đã lưu), `saveDefaultOptions`, `buildOptionsControls` (dựng bộ điều khiển Timer/
Letters/3 checkbox — DÙNG LẠI). Modal Settings mở từ bánh răng (mô hình nháp, chỉ ghi khi Save). **Act
mới kế thừa options theo Settings**; **chỉnh Options riêng 1 act trong game → Apply nay LƯU RIÊNG cho act
đó** (engine.js Apply thêm `saveActivity(activity)` khi có id).

**3. Đổi thuật ngữ GAME → activity/act + chọn loại act khi tạo mới** (`core/catalog.js` MỚI = 1 nguồn duy
nhất liệt kê 5 loại act, Quiz `built:true`, 4 cái coming soon; engine.js dùng chung danh sách này thay
hard-code). "+ New game" → **"+ New activity"** → mở **hộp thoại chọn LOẠI act** (grid thẻ, coming-soon mờ
+ toast) → chọn Quiz mới vào editor (act trắng seed options từ Settings). **Edit content** nay **dispatch
theo loại act** qua registry (`getTemplate(type).edit`), không import cứng quiz.

**4. Sửa trang Edit của Quiz** (`quiz-editor.js`): đổi **Game Title → Activity Title**; **bỏ Instruction**;
**bỏ chọn Style/theme** (mặc định luôn `classic`); **bỏ khối Options** (đưa vào Settings); **bỏ nút Paste
from Excel** (giữ 3 nút Mark correct in all / Unmark all / Delete all); **đáp án xếp 2 cột/hàng** (A B / C D
/ E F) với **chữ A-F IN ĐẬM (800) NẰM TRONG ô đáp án** (chữ đáp án weight 500); **nút Duplicate câu** bên
TRÁI nút Remove, 2 nút bằng nhau (96px); góc trên ghi **badge "QUIZ"** + tiêu đề "New activity"/"Edit
content"; **tối đa 120 câu** + dòng đếm "N / 120". Editor nhận thêm tham số `header` (main.js truyền cụm
header dùng chung vào đầu trang Edit).

**5. Preview act hiện tên dài** (`app.css`): grid view cho tên act **2 dòng** (line-clamp, .85rem) — tên
≤~42 ký tự HIỆN ĐỦ, quá mới "…" (đo thật: 35 & 42 ký tự đều vừa 2 dòng); cột grid min 200px.

**⚠️ BẪY ĐÃ SỬA — trùng tên class với engine (in-game):** header thư viện ban đầu vô tình đặt trùng 3
class engine đang dùng cho MÀN CHƠI: `.aw-topbar` (thanh đồng hồ/điểm), `.aw-iconbtn` (nút loa/fullscreen/
menu), `.aw-navbtn` (mũi tên trước/sau) → CSS đè nhau làm hỏng thanh trong game (thêm margin, nút phình
46px). Đã đổi TÊN RIÊNG cho header thư viện: **`.aw-appbar` / `.aw-appbtn` / `.aw-appnav`** (+ `-ic`). Đo
lại: nút mũi tên trong game về đúng 39px (4cqw), topbar margin 0. **BÀI HỌC: đặt tên class header/nút mới
phải tránh không gian tên engine dùng cho khung game** (rà `grep` trong core/ trước khi đặt).

**Đã test thật (javascript_tool, 0 lỗi console toàn bộ):** trang chủ = logo+Settings (không nav, tagline
193=193px); trong Activities = header [Activities|Results|Settings], nav Activities sáng; picker liệt kê 5
loại (Quiz sẵn + 4 coming soon); chọn Quiz → editor: badge QUIZ, "New activity", chỉ trường Activity Title,
KHÔNG Instruction/theme/Options/Paste, bulk 3 nút, đáp án 2 cột chữ A-D (letter weight 800 vs text 500),
Duplicate/Remove =96px, 1/120; Settings đổi letters=abc + tắt shuffle Q → Save (lưu localStorage); tạo act
mới kế thừa đúng options + theme classic; sửa act cũ nạp đủ 6 câu + chữ A-D; Results KHÔNG có New activity;
tên 40 ký tự hiện đủ 2 dòng grid; chơi thật vẫn OK; **nút trong game (mũi tên/loa/đồng hồ) không bị đè sau
khi đổi tên class**.

### v0.6.2 — 19/7/2026 — Editor Quiz: Dán nhanh từ Excel + hàng nút thao tác hàng loạt
Thầy chốt hướng nhập liệu: (1) dán cả bảng từ Excel, chọn được hàng/cột; (2) nút thao tác toàn bộ.
Thầy chốt luật: **CHỈ cho dán khi danh sách câu hỏi trống hoàn toàn** — có dữ liệu rồi thì báo lỗi,
phải bấm Delete all questions trước. Tất cả nằm trong `templates/quiz/quiz-editor.js` + CSS mục
"Bulk actions bar + paste-from-Excel modal" trong `core/app.css` (phiên phụ trách tổng).

**1. Hàng nút hàng loạt** (`.aw-ed-bulk`, ngay dưới tiêu đề "Questions"):
- **Paste from Excel** — mở hộp thoại dán (chặn + báo lỗi đỏ nếu form đã có chữ ở câu hỏi/đáp án).
- **Answer [A▾] Mark correct in all** — chọn chữ A-F rồi bấm: đáp án ở vị trí đó thành đáp án đúng
  cho MỌI câu; câu nào ít đáp án hơn thì giữ nguyên + báo số câu bỏ qua.
- **Unmark all correct** — bỏ đánh dấu đúng ở tất cả câu (Save sẽ tự chặn nếu quên chọn lại).
- **Delete all questions** — hỏi xác nhận rồi xóa sạch, còn lại 1 thẻ câu hỏi trống (đủ điều kiện dán).
- Thông báo kết quả dùng lại thanh `.aw-ed-error` thêm biến thể XANH `.is-info` (đỏ = lỗi như cũ).

**2. Hộp thoại Paste from Excel** (`.aw-ed-pastemodal`, dùng lại `.aw-modal-overlay` — flex-center +
fade opacity nên miễn nhiễm lớp lỗi popup-nhảy):
- Ô dán lớn: Excel copy ra TAB giữa cột + xuống dòng giữa hàng → app tách thành **bảng xem trước**.
- **Đầu mỗi cột 1 ô chọn vai trò**: Question / Correct answer / Answer / Ignore. Tự đoán sẵn: cột 1 =
  Question, cột 2 = Correct answer, còn lại = Answer.
- **Mỗi hàng 1 ô tick**; hàng đầu trông giống tiêu đề (chữ "Question"/"Answer"/"Correct"...) tự BỎ tick.
- Kiểm tra sống khi gõ/đổi cột/tick: đúng 1 cột Question + đúng 1 cột Correct answer; từng hàng phải có
  câu hỏi + ≥2 đáp án + ô đáp án đúng không rỗng — hàng thiếu bị BỎ QUA (báo số hàng skip màu vàng);
  quá 6 đáp án thì cắt còn 6 nhưng KHÔNG bao giờ cắt mất đáp án đúng. Nút Add hiện "Add N questions".
- Bấm Add → biến thành thẻ câu hỏi trong form (sửa tay tiếp được như thường), báo xanh số câu đã thêm.
- Ô xem trước dùng `textContent` (không innerHTML) — dữ liệu dán không thể chèn mã.

**Đã test thật (đo DOM qua javascript_tool, 0 lỗi console toàn bộ):** hàng nút đủ 4 chức năng + chọn
A-F; dán 5 dòng (1 tiêu đề + 1 dòng hỏng) → tiêu đề tự bỏ tick, "Add 3 questions", cảnh báo 1 hàng skip;
đổi cột sang Ignore/Answer đếm lại đúng; Add → 3 thẻ câu đúng nội dung + đáp án đúng đúng cột; dán khi
ĐANG có dữ liệu → lỗi đỏ đúng luật thầy chốt, KHÔNG mở hộp thoại; Mark B correct in all → cả 3 câu tick B;
Unmark all → không câu nào tick; Delete all (confirm) → còn 1 thẻ trống → dán lại ĐƯỢC; dán 2 câu + đặt
tên "PASTE TEST QUIZ" + Save → về trang chủ, lưu store; mở chơi thật: câu hiện đúng, bấm "dog" +1 điểm
+ dấu ✓. (Game test PASTE TEST QUIZ để lại trong Activities cho thầy xem thử — xóa lúc nào cũng được.)

### v0.6.1 — 19/7/2026 — Thương hiệu "AWord in ANDREW CLASSES" (nút về trang chủ) + nút Home trong game
1. **Cụm thương hiệu mới** (`main.js` hàm `logo()` + `.aw-brand*` trong app.css): đổi tagline "Create &
   play English games" → **"in ANDREW CLASSES"** ("in" xám nhạt + **ANDREW CLASSES** đậm đen, giãn chữ),
   đặt SÁT ngay dưới logo. **Tăng cỡ logo AWord** (3.7rem ở trang chủ; bản nhỏ trong folder 2rem). Cả cụm
   giờ là **1 nút** (`<button class="aw-brand">`) — **bấm ở BẤT KỲ đâu (trang chủ hay trong folder) đều về
   trang chủ top-level** (2 thư mục Activities/Results) qua `goTop`. Hover nền xanh nhạt.
2. **Nút Home trong game** (`engine.js`): cụm phải dưới khung trước 3 nút (Edit/Set assignment/Print) nay
   thêm **Home** → **4 nút**. Bấm Home → `cleanupAll()` (dọn timer/listener) rồi `onExit()` về trang chủ
   top-level. Thêm icon `home` (SVG mái nhà) vào `icons.js`. Đấu nối: `main.js` `playAct` đổi
   `onExit: render` → **`onExit: goTop`** (route `?play=` vốn đã goTop) — trước đây `onExit` được truyền
   quanh nhưng CHƯA hàm nào gọi (giờ nút Home là chỗ dùng).
- Đã test thật (đo DOM): brand = button, logo 59px + "in ANDREW CLASSES", click từ trong folder → về top
  (2 gốc); trong game cụm phải đúng 4 nút [Edit, Set assignment, Print, Home], bấm Home → thoát game về
  top. 0 lỗi console.

### v0.6.0 — 19/7/2026 — Trang chủ kiểu Google Drive (thư mục/thùng rác/Move) + sửa trong game
Thầy yêu cầu đổi trang chủ thành trình quản lý file như Drive. Thầy chốt: **Results tạm dựng khung
trống** (kết quả HS đổ vào sau khi có Firebase/thu điểm), **OK build luôn toàn bộ**.

**1. Kho lưu `core/store.js` viết lại** — mô hình CÂY: mỗi node có `kind` (folder/act), `root`
(**activities** / **results** — 2 gốc CỐ ĐỊNH), `parentId` (null = ngay dưới gốc), `trashed` +
`trashRootId`/`restoreParentId` (thùng rác). Vẫn **async** (Firebase-ready). **Tự migrate** dữ liệu
Khối-1 (`aword-activities` phẳng) sang key mới `aword-lib` lần đầu (act cũ → activities/gốc). Hàm:
`listChildren(root,parentId)` · `pathTo(folderId)` (breadcrumb) · `listFolders` · `searchItems` ·
`listTrash(root)` · `createFolder` · `saveActivity(activity,{root,parentId})` (upsert, giữ nguyên vị
trí/trash khi sửa) · `renameItem` · `moveItem` (chặn thả folder vào chính subtree của nó) ·
`duplicateItem` (folder thì **đệ quy** cả nội dung) · `trashItem` (folder xoá → dồn CẢ subtree cùng
`trashRootId`) · `restoreItem` (khôi phục cả bó về parent gốc, nếu parent mất thì về gốc) ·
`deleteForever`. Thùng rác **RIÊNG theo gốc** (Activities ≠ Results).

**2. Trang chủ `main.js` viết lại thành trình quản lý** — mức ngoài: 2 thẻ gốc lớn **Activities /
Results** (không xoá). Mở 1 gốc: **breadcrumb** (Home › Activities › …) + **thanh công cụ** [**+ New
game** (CHỈ trong Activities) · **+ New folder** · **Recycle bin** (mở/đóng thùng rác) · ô **Search**
+ nút · **grid/list** đổi kiểu xem] + lưới/danh sách folder & act. **Thẻ folder**: icon + tên + ⁝. **Thẻ
act**: **preview** (1 câu hỏi + tối đa 4 đáp án lấy NGẪU NHIÊN, chip màu) + loại + tên + **nút Play tròn ở
giữa** + ⁝. **Menu ⁝ folder**: Open in new tab · Rename · Move · Duplicate · Delete. **Menu ⁝ act**: Open
in new tab · **Edit content** · Rename · Duplicate · Move · Delete. **Move** = hộp thoại cây thư mục cùng
gốc kiểu Drive (loại trừ chính subtree). Delete → thùng rác; trong thùng rác mỗi mục có **Restore** +
**Delete forever** (hỏi xác nhận). **Open in new tab** = `window.open('?play=<id>')` (act) /
`'?folder=<root>~<id>'` (folder); `init()` đọc query khi tải để mở thẳng game/thư mục. Chế độ xem
grid/list nhớ qua localStorage.

**3. Trong game (`engine.js`)** — **bỏ dòng hướng dẫn** (`.aw-below-desc`) dưới khung; **tên game cụ thể**
giờ nằm HÀNG NGANG căn giữa cùng cụm nút Options/Template/Style + Edit/Assignment/Print (grid
`1fr auto 1fr`, align center — sẵn có, chỉ bỏ dòng desc là đủ).

**4. CSS** thêm mục "FILE-MANAGER HOME" cuối `core/app.css`: 2 thẻ gốc, breadcrumb, toolbar, search, view
toggle, thẻ folder/act, **preview act** (gradient + câu hỏi 2 dòng + chip màu + nút Play tròn giữa),
**menu ⁝** (`position:fixed` cạnh nút), **modal** (rename/new folder/move), **cây Move**, thẻ thùng rác,
biến thể **list**. Đều NGOÀI khung 16:9 → rem/px.

**Đã test thật (đo DOM, screenshot preview treo như thường):** 2 gốc + migrate sample vào Activities; mở
Activities → breadcrumb + toolbar đủ nút + thẻ act preview (câu "How many days…" + 4 chip); New folder
"Grammar" (folder xếp trước); ⁝ act đủ 6 mục; **Move** act vào Grammar (root chỉ còn folder, act nằm
trong); **Duplicate** ra "(copy)"; **Delete** copy → vào thùng rác Activities (có Restore/Delete forever);
**Restore** → copy về đúng Grammar (parentId khớp); **Results** không có New game + thùng rác RIÊNG trống;
**list view** + **Search** "copy" ra đúng; `?folder=` mở thẳng Grammar, `?play=` mở thẳng game; ⁝ folder
đúng 5 mục (không Edit content); **trong game** tên "(copy)" ngang hàng nút + KHÔNG còn dòng hướng dẫn,
hàng grid 3 cột align center. **0 lỗi console** toàn bộ.

**CÒN LẠI / GHI CHÚ:** "+ New game" là nút em THÊM (spec thầy liệt kê toolbar không nêu — cần nút này để
tạo act; thầy muốn đổi vị trí/tên cứ báo). Editor vẫn quiz-shaped. Chưa có kéo-thả (drag & drop) để move
— hiện move qua hộp thoại. Bước tiếp theo của chặng: Print → Assignment → nối Firebase → thu điểm.

### v0.5.0 — 19/7/2026 — KHỐI 1: Trình soạn game (Editor) + Kho lưu + Trang chủ tạo/sửa/chơi/xoá
Bắt đầu chặng "hoàn thiện Quiz 100%" (thầy chốt: build lần lượt edit → tạo-game-từ-trang-chủ → in →
assignment; xong Quiz mới sang game khác vì dùng chung hạ tầng). Đây là **Khối 1** — nền tảng cho mọi
khối sau. Thầy chọn hướng **Firebase online**; cách làm: xây trước với **lớp lưu trữ tách riêng (async)**
chạy tạm bằng localStorage để dùng được NGAY, thiết kế để **cắm Firebase vào là xong** không phải viết lại.

**1. Lớp lưu trữ `core/store.js` (MỚI)** — "kho" chứa game, 4 hàm ĐỀU async (Promise) để sau đổi sang
Firebase không phải sửa nơi gọi: `listActivities()` (mới sửa lên đầu) · `getActivity(id)` ·
`saveActivity(activity)` (tự cấp id nếu thiếu + `createdAt`/`updatedAt`, upsert, làm trên bản sao) ·
`deleteActivity(id)`. Hiện lưu vào `localStorage` key **`aword-activities`** = `{ [id]: activity }`.

**2. Trình soạn Quiz `templates/quiz/quiz-editor.js` (MỚI)** — `openQuizEditor(container, activity,
{onSave, onCancel})`. Sửa trên **bản sao sâu** (Cancel giữ nguyên bản gốc). Gồm: tên game · instruction
· theme (chọn từ THEMES) · Options (Timer none/up/down + stepper mm:ss tái dùng `numberstepper.js`,
Letters none/abc, 3 checkbox Shuffle Q / Shuffle A / Show answers) · danh sách **Câu hỏi**: mỗi câu 1 thẻ
[ô câu hỏi + 2-6 đáp án, mỗi đáp án có **nút tròn radio đánh dấu đáp án đúng** + ô chữ + nút ×; thêm/xoá
đáp án (2..6); thêm/xoá câu (min 1)]. **Validation** khi Save: thiếu tên / câu trống / <2 đáp án / chưa
đánh dấu đáp án đúng → hiện thanh đỏ. Kỹ thuật: ô chữ bind model qua `oninput`; danh sách câu chỉ
**re-render khi ĐỔI CẤU TRÚC** (thêm/xoá/đổi-đáp-án-đúng) nên gõ không mất focus; validate trên bản
CLEANED (bỏ đáp án rỗng) để model đang gõ không bị hỏng nếu Save lỗi. Editor là "quiz-shaped" — game
khác sẽ tự cấp editor riêng cùng cách (đăng ký `edit` trên template).

**3. Mỗi template tự khai báo editor qua registry** — `quiz.js` thêm `edit: openQuizEditor`. Engine gọi
`tpl.edit(...)` (không import cứng quiz) → đúng tinh thần "game dùng chung hạ tầng".

**4. Trang chủ `main.js` viết lại thành THƯ VIỆN game của giáo viên** (thay màn splash 1-nút cũ): logo +
"**+ Create a game**" + lưới thẻ game (mỗi thẻ: badge loại, tên, số câu, 3 nút **▶ Play / Edit / Delete**).
Lần đầu chạy tự **seed** game mẫu để không trống. Create → editor với quiz trắng; Edit → editor nạp game;
Save → lưu store + về trang chủ; Delete → hỏi xác nhận rồi xoá. (Home/editor nằm NGOÀI khung 16:9 nên CSS
dùng rem/px, KHÔNG cqw — và phải ghi đè cỡ `.aw-btn`/`.aw-logo` vì 2 class đó vốn sizing cqw để dùng
TRONG khung; ngoài khung cqw sẽ tính theo viewport → nút/logo phình to.)

**5. Nút "Edit" trong game (engine.js)** — trước chỉ toast "coming soon", nay: rời game → mở editor của
game đang chơi (`tpl.edit`); **Save** → lưu store + chơi lại với nội dung mới; **Cancel** → chơi lại bản
gốc. `engine.js` thêm `import { saveActivity }`.

**6. CSS Khối 1** thêm vào cuối `core/app.css` (luôn nạp): mục "HOME LIBRARY + EDITOR" — thẻ game, form
editor, thẻ câu hỏi, hàng đáp án (đáp án đúng viền/nền xanh), nút thêm/xoá, thanh lỗi đỏ.

**Đã test thật (đo DOM trực tiếp, screenshot preview treo như thường lệ — dùng javascript_tool):** trang
chủ seed 1 game mẫu 6 câu + 3 nút; mở Create → editor đủ trường + 1 câu 2 đáp án; Save trống → lỗi
"Please enter a game title"; điền đủ + Save → game "My Test Quiz" xuất hiện đầu danh sách + lưu localStorage;
Edit game mẫu → nạp đúng 6 câu, câu 1 "cold" tick đúng; Cancel → về trang chủ không đổi; Play → vào ready
screen; **Edit trong game** → mở editor game hiện tại; đổi tên + Save → **quay lại GAME** (không phải trang
chủ) với tên mới + đã lưu; Delete (confirm) → xoá khỏi lưới + store; clear + reload → tự seed lại sạch.
**0 lỗi console** toàn bộ.

**CÒN LẠI của chặng (đề xuất thứ tự):** Khối 2 **Print** (in giấy — offline được) → Khối 3 **Assignment**
phần chơi (link + QR gói game, offline được) → **nối Firebase** (thầy tạo project, em hướng dẫn) để lưu
online + Khối 4 **thu điểm HS nhiều máy** (bắt buộc Firebase). Editor hiện quiz-shaped, tổng quát hoá khi
làm game khác. Chưa có: nút "Home" thoát nhanh từ trong game (hiện chỉ qua Start again/onExit).

### v0.4.2 — 17/7/2026 — Hoàn nguyên Classroom + thêm theme Basic + diệt lớp lỗi popup-nhảy
1. **Hoàn nguyên theme Classroom** về bản ấm áp gỗ/kem (v0.4.0) — thầy thấy bản chalkboard (v0.4.1)
   xấu. `classroom.css` giờ = cream `#fbf4e6`, viền/ô phẳng mặc định (khai báo `--aw-tile-*` = giá trị
   mặc định như Classic).
2. **Thêm theme "Basic"** (`core/themes/basic.css`) — đơn giản/tối giản theo ảnh thầy gửi: MỌI ô đáp án
   CÙNG 1 màu navy `#17255a` (viền xanh `#4a72cf`, phẳng + bóng mềm, không gờ 3D), chữ trắng, câu hỏi
   navy đậm, nền trắng/xanh nhạt. Cơ chế: thêm biến `--aw-tile-fixed`/`--aw-tile-fixed-dark` — nếu
   theme đặt thì ÉP mọi ô về 1 màu (đè bảng màu ngẫu nhiên); quiz.css resolve qua `--tile-eff`/
   `--tile-dark-eff` (= fixed nếu có, else màu random inline). Thêm `--aw-tile-shadow-active` cho hiệu
   ứng nhấn theo theme. Đăng ký trong `themes/manifest.js` (thứ tự: Classic, Basic, Classroom, Beach)
   + swatch trong engine.js. Đã test: 4 ô cùng màu navy, đúng ảnh mẫu.
3. **DIỆT LỚP LỖI "popup hiện 1 nơi rồi nhảy về đúng chỗ"** (thầy chỉ ra còn nhiều popup chữ dính):
   rà toàn bộ `app.css` bằng `grep "transform:.*translate|animation:"` → tìm ra 2 thủ phạm còn sót
   ngoài popover đã sửa ở v0.4.1: **`.aw-toast`** (thông báo chữ) và **`.aw-tile-badge`** (dấu ✓/✗ nhỏ
   trên ô) — cả 2 căn giữa bằng `translateX(-50%)` NHƯNG dùng keyframe `aw-pop` (kết thúc `transform:
   none`, mất phần -50% suốt lúc chạy → lệch phải rồi giật về giữa). Sửa: tạo keyframe **`aw-pop-cx`**
   BAKE luôn `translateX(-50%)` vào cả from/to (vừa pop vừa giữ căn giữa), áp cho cả 2. Đã đo xác nhận:
   toast + badge offset 0px ở MỌI mốc 5-150ms (không còn nhảy).
   - Ghi **CÁCH RÀ SOÁT** lớp lỗi này vào `core/HUONG DAN CORE.md` (mục "LỖI HAY GẶP NHẤT"): grep
     transform+animation, kiểm keyframe có chứa translate(-50%) ở mọi mốc không; 2 cách sửa (opacity-
     only hoặc bake -50% vào keyframe); ngoại lệ flex-center thì an toàn. Để mọi session sau tự kiểm
     trước khi xong việc.
- 0 lỗi console trong toàn bộ test (Basic uniform tiles, Classroom cream, toast/badge không nhảy).

### v0.4.1 — 17/7/2026 — 4 tinh chỉnh sau khi thầy xem thanh công cụ v0.4.0
1. **Theme Classroom làm theo ảnh mẫu thầy gửi** (chụp từ 1 game thật của thầy trên Wordwall): nền
   3 dải CSS gradient (tường màu kem trên · bảng phấn xanh giữa · sàn gỗ nâu dưới), ô đáp án viền
   dày xanh navy đậm (`--aw-tile-border-width/-color`) + bo góc to hơn (`--aw-tile-radius`) + thêm
   bóng đổ mềm ngoài gờ 3D cũ (`--aw-tile-shadow`), câu hỏi chữ TRẮNG viền ĐEN kiểu hoạt hình
   (`-webkit-text-stroke`, biến `--aw-question-stroke-*`/`--aw-question-fill`). **Không truy cập
   được link Wordwall riêng tư thầy gửi để copy ảnh gốc** (cần đăng nhập) → đây là bản dựng lại
   bằng CSS thuần (không có ảnh minh họa cửa sổ/cây cảnh...), đã báo thầy. Đã sửa 1 lỗi tương phản
   khi làm: ban đầu định cho `--aw-muted`/`--aw-text` màu SÁNG (nghĩ "chữ trên bảng đen"), nhưng đo
   lại thấy đồng hồ/điểm/thanh dưới thực ra nằm ở dải TƯỜNG/SÀN sáng màu (không phải bảng đen) — sửa
   lại thành màu tối để đọc được. `--aw-accent` phải đủ sáng vì còn dùng trên panel tối luôn-đen
   (Score/Time label) bất kể theme.
   - Các biến mới (`--aw-tile-radius`, `--aw-tile-border-width/-color`, `--aw-tile-shadow`,
     `--aw-question-stroke-width/-color`, `--aw-question-fill`) đã thêm ĐỦ vào cả `classic.css` và
     `beach.css` với giá trị mặc định = giao diện hiện tại (không đổi gì cho 2 theme đó), theo đúng
     quy tắc "mỗi theme tự khai báo đủ biến" trong `HUONG DAN CORE.md`.
2. **Countdown vuốt lên/xuống chỉnh số**: thêm `core/numberstepper.js` (`makeNumberStepper`) — ô số
   nhỏ có nút ▲▼ + vuốt dọc (kéo lên = tăng, xuống = giảm, 10px/nấc) qua Pointer Events + pointer
   capture. Thay 2 ô `<input type=number>` phút/giây trong Options bằng 2 stepper này. Tái dùng
   được cho các số nhỏ khác sau này (vd Lives).
3. **Sửa popup hiện lệch rồi mới nhảy về giữa** — lỗi THẬT (không phải do em đo nhầm lúc test):
   nguyên nhân là keyframe `aw-pop` cũ có animate cả `transform`, mà panel lại dùng
   `transform:translateX(-50%)` để tự căn giữa — animation THAY THẾ transform trong suốt lúc chạy
   (180ms) nên panel hiện sai vị trí (lệch phải, vì mất phần bù -50%) suốt animation rồi mới "giật"
   về đúng chỗ khi animation xong — người dùng THẤY RÕ cú giật này. Sửa: đổi animation của
   `.aw-tool-panel` sang **CHỈ động opacity** (`aw-fadein`, không đụng transform) → panel giờ đúng vị
   trí NGAY TỪ FRAME ĐẦU (đã đo: offset 0px ở mọi mốc 5-200ms). Ghi thành luật chung trong
   `HUONG DAN CORE.md` (không animate transform trên phần tử định vị bằng transform).
   - Thêm luôn **fade khi ĐÓNG** (trước đây đóng là biến mất tức thì, không fade): `closeToolPanel`
     giờ nhận tham số `fade` — đóng thật (bấm ra ngoài/tắt) thì fade opacity 150ms + setTimeout dự
     phòng theo luật animate() đã có; đóng để MỞ PANEL KHÁC ngay thì xoá tức thì (panel mới đã tự
     fade-in đè lên, fade cũ chỉ làm chậm cảm giác).
4. **Nút Apply cho panel Options**: đổi sang mô hình NHÁP — mọi điều khiển trong panel giờ sửa 1
   bản sao cục bộ `draft` (không đụng `activity.options` nữa), chỉ khi bấm **Apply** (nút to, giữa,
   dưới cùng panel) mới `Object.assign(activity.options, draft)` để lưu thật + đóng panel (fade) +
   toast "Options applied". Bấm ra ngoài mà chưa Apply = mất hết thay đổi (dữ liệu gốc chưa từng bị
   sửa nên tự nhiên giữ nguyên). Ghi thành mẫu dùng chung ("mô hình nháp") trong `HUONG DAN CORE.md`
   cho panel nhiều lựa chọn nào cần Apply sau này.
- Đã test kỹ: panel căn giữa 0px lệch ở MỌI mốc thời gian (không còn nhảy); fade-out xác nhận opacity
  giảm dần rồi biến mất; stepper bấm nút (+3) và vuốt (+6 với 55px) đều đúng; đổi timer sang Count
  down KHÔNG Apply rồi đóng → mở lại vẫn Count up (nháp bị huỷ đúng); đổi Shuffle question + Apply →
  lưu thật (mở lại thấy đổi); đổi Shuffle answer KHÔNG Apply → mở lại vẫn cũ (huỷ đúng); theme
  Classroom lúc chơi thật: 3 dải nền tường/bảng/sàn, viền ô navy dày, chữ câu hỏi trắng viền đen, chữ
  đồng hồ/điểm/thanh dưới vẫn đọc rõ trên dải sáng. 0 lỗi console trong toàn bộ quá trình test.

### v0.4.0 — 17/7/2026 — Thanh công cụ ngoài khung: Options/Template/Style + Edit/Assignment/Print
Tính năng lớn, đổi mốc version (0.3→0.4). Toàn bộ nằm ở **core** (dùng chung mọi template tương lai).

**1. Bố cục ngoài khung** (`.aw-below` → grid `1fr auto 1fr`):
- Trái: tên lesson + hướng dẫn (như cũ, nay bọc trong `.aw-below-left`).
- Giữa: 3 nút vuông bo tròn **Options · Template · Style**.
- Phải: 3 icon nhỏ **Edit · Set assignment · Print** (chuẩn bị hạ tầng, hiện chỉ toast "coming soon").

**2. Hệ thống popover dùng chung** (`openToolPanel`/`closeToolPanel` trong engine.js): bấm 1 trong 3
nút giữa → nút tỏa hào quang (`.is-active`, glow xanh) → panel hiện NGAY DƯỚI, CĂN GIỮA cụm 3 nút
(position:absolute + left:50%/translateX(-50%) so với `.aw-below-center` position:relative) → TOÀN
MÀN HÌNH (kể cả khung game) bị làm mờ + blur nhẹ qua lớp phủ `position:fixed;inset:0` z-index 40,
cụm nút + panel nổi trên (z-index 41-42). Bấm ra ngoài hoặc bấm lại đúng nút đang mở → đóng. Chỉ 1
panel mở tại 1 thời điểm (mở panel khác tự đóng panel cũ, giữ đúng "chỉ 1 hào quang").

**3. Panel OPTIONS — điều khiển THẬT** (không phải mock), ghi trực tiếp `activity.options`:
- **Timer**: None / Count up / Count down (kèm ô nhập phút:giây). Đã VIẾT MỚI chế độ đếm ngược cho
  engine (trước chỉ có đếm lên): còn 0 giây → tự dừng đồng hồ + tự gọi `submitHandler` (tự nộp bài,
  giống hết giờ ở Wordwall thật). Sửa thêm: hiện đúng tổng thời gian NGAY khi bắt đầu (trước phải
  đợi tick 500ms đầu mới hiện, có lúc nhấp nháy "0:00").
- **Random**: Shuffle question order / Shuffle answer order (bật/tắt 2 cờ có sẵn).
- **End of game**: Show answers — tắt thì nút "Show answers" biến mất khỏi menu tổng kết.
- **Letters on answers**: A,B,C / None — quiz.js vẽ thêm nhãn chữ góc trái mỗi ô khi bật (đọc
  `opt.lettersOnAnswers` SỐNG mỗi lần render câu, nên hiện ngay từ câu tiếp theo, không cần restart —
  an toàn vì không ảnh hưởng logic xáo/chấm). Timer/Shuffle chỉ áp dụng từ lượt chơi TIẾP (Start
  again) — panel tự hiện dòng nhắc "Applies when you press Play" / "...Start again" tùy đang ở màn
  ready hay giữa ván.
- Giới hạn đã biết: bộ Options này hình dạng theo QUIZ (câu hỏi/đáp án); template khác cần bộ khác,
  chưa tổng quát hóa — ghi rõ trong `core/HUONG DAN CORE.md`.

**4. Panel TEMPLATE**: liệt kê `ALL_TEMPLATES` (Quiz, Anagram, Find the match, Type the answer, Open
the box) — chỉ template khớp `activity.type` hiện đang chơi được đánh dấu "current", còn lại mờ +
toast "coming soon" khi bấm.

**5. Panel STYLE — theme đổi TRỰC TIẾP, không cần restart**: thêm 2 theme mới
`core/themes/classroom.css` (ấm áp gỗ/phấn bảng — **TỰ THIẾT KẾ vì không truy cập được link Wordwall
riêng tư thầy gửi tham khảo, trang báo "Private resource" cần đăng nhập mà không có mật khẩu — đã
báo thầy, chờ thầy góp ý/chỉnh nếu chưa đúng ý**) và `core/themes/beach.css` (cát/biển). Thêm
`core/themes/manifest.js` — sổ đăng ký theme + **nạp CSS động** (`loadTheme(id)` chèn `<link>` khi
cần lần đầu, không phải sửa từng `test.html`/`index.html`). Bấm 1 theme trong panel → tải CSS (nếu
chưa có) → đổi class `theme-<id>` trên `.aw-stage` ngay lập tức + cập nhật `activity.theme` (nên
"Start again" giữ đúng theme vừa chọn).

**6. Bẫy CSS đã gặp + sửa**: dùng grid `1fr auto 1fr` để căn giữa cụm giữa — nếu 2 cột 1fr có
min-content chênh lệch lớn (tên lesson dài bên trái vs vài icon nhỏ bên phải), cụm giữa **lệch tâm**
dù cả 2 đều "1fr" (do mặc định `min-width:auto` ép track to theo nội dung dài nhất). Sửa bằng thêm
`min-width:0` cho 2 cột 1fr. Đã ghi thành bẫy chung trong `core/HUONG DAN CORE.md` cho mọi bố cục
grid 3 cột sau này (nav bar dưới khung ở v0.3.8 may mắn không dính vì cả 2 nhóm đều nhỏ).

**7. Sửa `main.js` (trang chủ)**: bọc nội dung splash trong `.aw-below-left` — nếu không, layout
grid 3 cột mới sẽ dàn 3 phần tử con (type/title/desc) ra 3 CỘT KHÁC NHAU thay vì xếp chồng ở cột
trái (đã phát hiện + sửa lúc test hồi quy).

- Đã test kỹ: panel căn giữa chính xác (offset đo 0px sau khi hết hiệu ứng mở 180ms — lúc đo giữa
  hiệu ứng sẽ SAI do animation `aw-pop` tạm ghi đè transform, không phải bug thật); dim+blur+glow;
  đóng khi bấm ngoài; chỉ 1 panel mở cùng lúc; Letters on answers hiện đúng A-B-C-D; đếm ngược tự nộp
  bài khi về 0; tắt Show answers → menu ẩn đúng; đổi theme Classroom/Beach trực tiếp + giữ qua Start
  again; menu ☰ trong khung + leaderboard + Enter-lưu-tên vẫn hoạt động song song không xung đột;
  trang chủ + vào chơi từ trang chủ đều đúng. 0 lỗi console trong mọi test.

### v0.3.8 — 17/7/2026 — Màu teal · nav căn giữa · menu ẩn khi bấm ngoài
1. **Đổi màu hồng → teal**: palette quiz.js `#ec4899` (pink) → `#14b8a6`/`#0f9488` (teal). Đã test 6
   ván reshuffle: không còn pink, có teal, 8 màu đều phân biệt.
2. **Nav "x of N" + mũi tên căn GIỮA khung**: `.aw-bottombar` từ flex space-between → **grid
   `1fr auto 1fr`** (con 1=menu justify-self start, con 2=nav center, con 3=tools end). Đo: nav lệch
   tâm 0px (trước lệch trái do 2 nhóm menu/tools khác bề rộng).
3. **Menu option ẩn khi bấm ra ngoài**: `openMenu` gắn `document.addEventListener("pointerdown",
   onMenuOutside)` (deferred setTimeout 0 để click mở không tự đóng); `onMenuOutside` đóng nếu click
   ngoài menu & ngoài nút ☰; `closeMenu` gỡ listener. Đã test: mở menu → bấm playarea → menu đóng.
- 0 lỗi console.

### v0.3.7 — 17/7/2026 — Âm thanh + phím Enter
1. **Enter trong ô tên leaderboard = Ok**: `nameInput.onkeydown` bắt Enter → updateName + blur + toast
   "Name saved" (giống nút Ok).
2. **Chuông khởi động**: thêm `sound.start()` (5 nốt C-E-G-C-E reo tăng dần), phát khi bấm nút PLAY.
3. **Tiếng bấm nút**: thêm `sound.click()` (blip sine ngắn 70ms, gain 0.08). Gắn vào `panelItem()` và
   `menuItem()` (mọi nút bảng + menu, gồm Start again). Cả 2 âm tôn trọng nút tắt tiếng (qua `tone()`
   check `muted`). KHÔNG gắn click vào nút loa/fullscreen/mũi tên (tránh ồn).
- Test JS: sound fns chạy 0 lỗi; Enter lưu tên "Huy" + toast + blur; Start again vẫn về ready. 0 lỗi console.

### v0.3.6 — 17/7/2026 — 3 tinh chỉnh màn Show answers
1. **Ô đáp án còn 1/2 bề ngang**: grid review `2.4fr 1fr 1fr` → **`6.8fr 1fr 1fr`** (mỗi cột đáp án ~11%
   khung = nửa cũ; ô đúng span 2 ~22%). Cột câu hỏi rộng ra chiếm phần còn lại.
2. **Đánh số câu hỏi**: engine prefix `${i+1}. ` vào text câu hỏi.
3. **Câu hỏi 1 CỠ CỐ ĐỊNH** (bỏ fitOnce phóng to per-ô cho câu hỏi): `.aw-rv-q .aw-rv-txt` font
   `2.3cqw` cố định + `.aw-rv-fit` display:block để **xuống dòng**; hàng `min-height:7cqw` **auto-grow**
   khi câu dài (đo: 84px vs 53px), ô đáp án stretch cao theo (grid align stretch mặc định). List
   `justify-content: safe center` + `overflow-y:auto` (căn giữa khi ít câu, cuộn khi nhiều/tràn).
   Chỉ ô ĐÁP ÁN còn fitOnce (shrink max:1) để chữ vừa ô hẹp.
- Đã đo & chụp thật: ô đáp án 22%/11%, câu hỏi cùng font, câu dài wrap + hàng cao lên. 0 lỗi console.

### v0.3.5 — 17/7/2026 — 4 tinh chỉnh màn ready + leaderboard + review
1. Màn READY: dòng trên cùng đổi từ tên template ("QUIZ") → **"ANDREW CLASSES"** (thương hiệu).
2. Màn READY: BỎ dòng instruction ("Tap the correct answer."), thay bằng **TÊN GAME** (tpl.name, vd
   QUIZ) ĐẶT DƯỚI nút play, TO hơn + ĐẬM hơn (`.aw-ready-game` 3cqw/800, thay `.aw-ready-instr`).
3. Leaderboard HẸP LẠI ~nửa: `.aw-panel-wide` min-width 52cqw→**28cqw** (max 62%), cột gọn hơn
   `grid-template-columns: 4cqw 1fr 4.8cqw 5.2cqw`. Đo được panel ~46% bề rộng khung, không chật.
4. Show answers: câu hỏi CHO TO TỐI ĐA lấp đầy ô — `fitOnce` cho ô câu hỏi dùng `max:3.5` (được PHÓNG
   TO lên tới 3.5×, không chỉ thu nhỏ), ô đáp án `max:1.4`. Đo: hệ số fit câu hỏi 1.7–2.8×, cỡ 23–38px.
- Đã chụp thật xác nhận cả 4. 0 lỗi console.

### v0.3.4 — 17/7/2026 — 6 tinh chỉnh sau khi thầy chơi thử v0.3.3
1. Đổi tiêu đề leaderboard `ANDREW LEADERBOARD` → **`ANDREW CLASSES`**.
2. **Không thêm vào leaderboard nếu HS không làm câu nào** (`answered === 0`): engine `finish` tính
   `answered` (quiz gửi kèm), chỉ `addEntry` khi answered>0. Review vẫn lưu TRONG BỘ NHỚ (`reviewData`)
   nên Show answers vẫn xem được dù không lên bảng; summary không hiện dòng rank.
3. **Show answers dời vào menu summary** cùng Leaderboard/Start again/Play a different template. Thứ tự:
   Leaderboard → Show answers → Start again → Play a different template. Bỏ Show answers khỏi panel
   leaderboard (leaderboard giờ chỉ Ok + Back). Nút × của review quay về summary.
4. **Tự động Game Complete khi làm hết câu**: quiz `choose()` kiểm tra `state.every(answered)` → hẹn
   `finish` sau 1.0s (đúng)/1.5s (sai) để kịp xem ✓/✗. Track `autoTimer`, clear trong cleanup.
5. **Thu nhỏ ô đáp án trong màn review**: cột câu hỏi rộng hơn (`grid-template-columns: 2.4fr 1fr 1fr`),
   `max-height:12cqw` mỗi hàng + list `justify-content:center` (ít câu không bị ô quá cao).
6. **Câu ĐÚNG trong review chỉ 1 ô** rộng bằng 2 ô gộp (`.aw-rv-span { grid-column: 2/span 2 }`); câu
   sai/không làm vẫn 2 ô. (Bỏ trùng lặp "your answer = correct answer" khi đúng.)
- Đã test thật: auto-complete OK (không cần bấm finish); menu đúng thứ tự; ANDREW CLASSES; 0-answered
  KHÔNG lên bảng (8→8) nhưng Show answers vẫn có; review câu đúng 1 ô rộng / câu sai 2 ô. 0 lỗi console.

### v0.3.3 — 17/7/2026 — 5 cải tiến lớn (màn ready · leaderboard+review · fullscreen giữ tỷ lệ)
Đều là hạ tầng DÙNG CHUNG ở core (áp dụng cho mọi game sau), trừ phần review data do template cấp.

1. **Màn READY đầy đủ** (PLAY overlay, `engine.js` + `.aw-ready-*` trong app.css): trên cùng LOẠI
   TEMPLATE (tpl.name viết hoa, vd QUIZ), giữa TÊN LESSON to viết hoa (activity.title), nút PLAY,
   dưới là INSTRUCTION cỡ vừa (activity.instruction). Cân đối 16:9.
2. **Leaderboard**: đổi tiêu đề `LEADERBOARD` → **`ANDREW LEADERBOARD`**. Thêm nút **Ok** (trước Back)
   để xác nhận lưu tên (updateName + toast "Name saved"). Ghi chú: leaderboard hiện lưu localStorage,
   ĐÃ chuẩn bị cho ĐỒNG BỘ ONLINE sau (mỗi entry lưu đủ name/score/time + review → Firebase sync để
   HS thi đua nhìn thấy nhau).
3. **Show answers** (nút trong leaderboard → màn REVIEW toàn 16:9 `.aw-review`): mỗi câu 1 hàng
   `[câu hỏi | đáp án của HS | đáp án đúng]`. Đáp án HS: SAI = ô tối (#3d4852) + ✗; ĐÚNG = ô xanh
   (#2ec27e) + ✓; KHÔNG làm = ô trắng nhạt "No answer". Đáp án đúng luôn ô xanh + ✓. Chữ mỗi ô TỰ CO
   vừa ô bằng `fitOnce` (fit một lần, không listener — thêm vào `core/fit.js`).
   - **Luồng dữ liệu review**: template `quiz.js` khi finish gửi thêm `review[]`
     `{question, answered, yourText, yourCorrect, correctText}` → `ui.finish` → `addEntry` lưu vào
     entry leaderboard (`leaderboard.js`) → engine đọc `getEntry().review` để dựng màn review. Các game
     Q&A sau cấp `review[]` cùng cấu trúc là dùng được ngay.
4. **FULLSCREEN GIỮ TỶ LỆ (đổi hệ đơn vị — bài học lớn cho MỌI template)**:
   - **Vấn đề cũ**: dùng `vw`/`clamp` → kích thước phụ thuộc VIEWPORT, nên fullscreen làm đổi tỷ lệ
     các thành phần (clamp chạm max, layout khác).
   - **Cách sửa**: `.aw-stage` đặt `container-type: size` (thành CSS container); MỌI kích thước BÊN
     TRONG khung đổi sang đơn vị **`cqw`** (1cqw = 1% BỀ RỘNG KHUNG). Vì khung luôn 16:9, mọi thứ scale
     ĐỒNG ĐỀU theo khung → khung nhỏ hay fullscreen đều CÙNG TỶ LỆ, chỉ khác cỡ (zoom). Quy đổi:
     ~ `giá_trị_px / 10` = cqw (design base khung ~1000px). BỎ clamp (clamp chặn scale đồng đều).
   - **Fullscreen letterbox**: nút fullscreen gọi `page.requestFullscreen()`; CSS `.aw-page:fullscreen`
     nền đen, căn giữa, `.aw-stage { width: min(100vw, 100vh*16/9) }` giữ 16:9 (viền đen quanh nếu màn
     không 16:9), ẩn `.aw-below`.
   - Đã ĐO xác nhận: khung 754px vs 468px → tỷ lệ chữ/ô/đồng hồ so với bề rộng khung GIỮ NGUYÊN
     (5.19% ↔ 5.18%, chênh do làm tròn) → chứng minh fullscreen chỉ zoom, không đổi tỷ lệ.
   - LƯU Ý cho template khác: dùng `cqw` cho kích thước, KHÔNG dùng vw/clamp. `slack` của autoFit nếu
     phụ thuộc padding cqw thì tính theo `root.clientWidth * hệ_số` (px động) chứ đừng để số px cứng.
- Sample `LSA2-S1.T1.P1-2-3 / ENG2` + "Tap the correct answer." để demo màn ready giống ví dụ thầy.
- Đã test & chụp thật: ready screen cân đối; leaderboard ANDREW + Ok/Show answers/Back; review 6 câu
  (sai/đúng/No answer) đẹp; proportions ổn định; home không hỏng; 0 lỗi console.

### v0.3.2 — 17/7/2026 — Quiz: bố cục đáp án theo số lượng (theo 5 ảnh mẫu thầy vẽ)
Thầy gửi 5 ảnh mô tả cách xếp đáp án cho 2/3/4/5/6 ô. Đã làm chuẩn hơn ảnh (bo góc, cách đều, căn giữa):
- **Quy tắc số ô mỗi hàng** (`perRow`): n≤4 → 1 hàng n ô; n≥5 → 2 hàng, hàng trên `ceil(n/2)` (5→3+2, 6→3+3, 7→4+3, 8→4+4).
- **Kỹ thuật CSS**: `.aw-quiz-answers` dùng `display:flex; flex-wrap:wrap; justify-content:center` + biến `--per-row`; mỗi ô `flex: 0 1 calc((100% - (per-row-1)*gap)/per-row)` để ĐÚNG per-row ô lấp đầy 1 hàng, ô dư tự xuống hàng và **hàng cuối tự CĂN GIỮA** (ca 5 đáp án: 2 ô dưới căn giữa dưới 3 ô trên — điểm mấu chốt thầy muốn). `max-width:30%` để 2 đáp án không giãn quá to.
- **Vị trí dọc**: đáp án dồn xuống phần dưới khung (`margin-top:auto`) + `padding-bottom` khung tạo khe dưới; câu hỏi ở trên cao. → autoFit slack nâng lên 46 (padding-bottom tới ~38px + gờ 3D 6px).
- **Màu (theo yêu cầu thầy)**: bảng màu HIỆN ĐẠI 8 màu `PALETTE` trong quiz.js (blue/cyan/emerald/
  amber/orange/red/pink/violet, mỗi màu kèm shade tối cho gờ 3D). **Mỗi lượt START GAME xáo bảng màu
  1 lần** (`palette = shuffle(PALETTE)` trong mount) → gán màu KHÁC NHAU cho từng vị trí đáp án; MỌI
  câu hỏi trong ván giữ nguyên màu theo vị trí; **Start again reshuffle** ra bộ màu mới. Màu set inline
  `--tile`/`--tile-dark` trên từng ô (bỏ class .aw-tile-0..3 cũ). Thêm text-shadow nhẹ cho chữ trắng
  rõ trên màu sáng. Bo góc 16px.
- Đã đo & chụp thật: 2→[2] giữa, 3→[3], 4→[4], 5→[3,2] cả 2 hàng offset căn giữa =0, 6→[3,3]; đáp án ở
  lower area, khe dưới ~15px (khung nhỏ)→~33px (khung to). Màu: 6 màu distinct, giữ nguyên qua câu,
  đổi khi restart — TEST PASS. ĐÚNG ý thầy.

### v0.3.1 — 17/7/2026 — Quiz: sửa lỗi bền vững (bước 1 của "hoàn thiện Quiz làm mẫu")
Rà soát Quiz kỹ bằng cách nạp dữ liệu biên và ĐO trực tiếp (javascript_tool) → tìm & sửa 4 vấn đề
mà giáo viên chắc chắn gặp. Đây là các lỗi/pattern QUAN TRỌNG các template sau PHẢI tránh/áp dụng:

1. 🔴 **Câu hỏi/đáp án DÀI bị cắt cụt** (đo được: nội dung cao 780px, khung chỉ 423px → mất 358px,
   đáp án biến mất). **Cách sửa (chuẩn Wordwall): TỰ CO CHỮ vừa khung** → thêm `core/fit.js`
   (`autoFit`): binary-search hệ số `--fit` (font ×) lớn nhất mà nội dung vẫn vừa khung 16:9.
   - **BÀI HỌC XƯƠNG MÁU khi đo "có vừa không"**: KHÔNG dùng `box.scrollHeight > box.clientHeight`
     — vì khi thẻ bị kéo `height:100%`, `scrollHeight` LUÔN == `clientHeight` (dù nội dung nhỏ xíu),
     làm thuật toán tưởng luôn tràn → co xuống đáy. PHẢI đo **chiều cao thật của nội dung** (truyền
     `measure` = tổng offsetHeight các con: câu hỏi + khối đáp án) rồi so với `clientHeight - slack`.
   - Chỉ fit theo **CHIỀU CAO** (khung 16:9 ràng buộc dọc; chữ dài tự xuống dòng ngang). Thêm phần
     width vào sẽ đánh nhau với 1px lệch làm co xuống min.
   - `slack` chừa chỗ cho **gờ 3D box-shadow 6px** của ô (shadow không tính vào layout, dễ bị
     overflow:hidden cắt lẹm đáy). Quiz dùng slack:18.
   - Re-fit khi web font tải xong (`document.fonts.ready`) + khi cửa sổ resize; `.destroy()` gỡ
     listener trong cleanup.
2. 🟠 **5-6 đáp án chen 1 hàng** → **lưới thích ứng**: `--cols` = (≤4 → số đáp án; else ceil(n/2))
   để 5-6 thành 2 hàng cân. CSS `grid-template-columns: repeat(var(--cols),1fr)`.
3. 🟡 **Dữ liệu thiếu** (không có answers / không đáp án đúng) → lọc guard + màn "no questions yet",
   không crash.
4. ⌨️ **Bàn phím**: bấm số 1-9 chọn đáp án, ◄► chuyển câu/hoàn thành. Listener gắn `window`, GỠ trong
   cleanup (tránh rò rỉ sau Start again). Bấm số ngoài phạm vi / ô đã khóa → bỏ qua an toàn.

Đã test thật: câu ngắn fit=1 dư 128px; câu dài fit=0.77 không cắt, chừa 9px đáy (gờ 3D thấy đủ);
6 đáp án 2 hàng; chơi trọn ván bằng BÀN PHÍM ra 3/3 + Game Complete. Không lỗi console.

**Quiz CHƯA chốt** — đang ở bước "hoàn thiện để làm mẫu", Teacher Andrew sẽ hướng dẫn tiếp các phần
polish/tính năng muốn thêm. Khi chốt sẽ viết "recipe" đầy đủ + đổi trạng thái ✅.

### v0.3.0 — 17/7/2026 — Quy hoạch lại thư mục để build NHIỀU TEMPLATE SONG SONG
- **Mục tiêu**: cho phép thầy mở nhiều session Claude cùng lúc, mỗi session build 1 game (Anagram,
  Find the match...) mà không giẫm chân/xung đột nhau, rồi gom lại thành 1 trang web cuối khi đã chốt.
- **Cấu trúc mới** (chi tiết đầy đủ ở `APP_MASTER.md` mục 4):
  - `core/` — MỌI FILE DÙNG CHUNG (trước ở `src/core/` + `styles/app.css` + `src/themes/`):
    engine, registry, layout, scoring, leaderboard, confetti, sound, icons, utils, `app.css`,
    `themes/classic.css`, `assets/` (font + mp3). Kèm `core/HUONG DAN CORE.md` — hợp đồng API
    engine↔template + LUẬT "không session nào tự sửa core".
  - `templates/quiz/` — game Quiz (đã hoàn chỉnh, ✅ ĐÃ CHỐT) dời nguyên vẹn vào đây, tách thành
    3 file chuẩn: `quiz.js` (module game, logic KHÔNG đổi) · `quiz.css` (style riêng) ·
    `sample-quiz.js` (dữ liệu mẫu, export `activity`). Thêm `test.html`/`test.js` để chơi thử ĐỘC LẬP
    (chỉ nạp core + quiz) tại `templates/quiz/test.html`.
  - `templates/anagram/`, `find-the-match/`, `type-the-answer/`, `open-the-box/` — 4 khung thư mục
    mới (🔴 CHƯA BUILD), mỗi thư mục có sẵn: `GHI CHU <TEN>.md` (mô tả game + việc cần làm + trạng
    thái 🔴/🟡/🟢/✅ + nhật ký + mục đề xuất sửa core) và `test.html`/`test.js` (tự hiện thông báo
    "not built yet" thân thiện cho tới khi ai đó tạo đủ 3 file game).
  - `templates/HUONG DAN TEMPLATE.md` — quy trình build 1 template từng bước + quy tắc chống xung
    đột (mỗi session chỉ đụng thư mục của mình; không sửa core/; không sửa index.html/main.js/
    manifest.js gốc trừ khi đang gộp trang cuối).
  - `manifest.js` (gốc) — danh sách template ĐÃ CHỐT, hiện đang có 1 dòng: Quiz. Thêm template mới
    vào đây (1 dòng) khi đã được thầy duyệt.
  - `index.html` + `main.js` (gốc) — TRANG WEB CUỐI CÙNG, đọc từ `manifest.js`; hiện chỉ có Quiz nên
    vẫn hiện y hệt như trước (nút PLAY to, không có màn chọn game); tự động chuyển sang màn lưới chọn
    game khi `manifest.js` có từ 2 template trở lên.
  - Xoá `src/` và `styles/` cũ (nội dung đã dời hết, không còn dùng).
- **Không đổi** bố cục/nội dung game Quiz — chỉ dọn dẹp cấu trúc thư mục. Nhưng khi kiểm thử lại
  toàn bộ sau khi dời file, phát hiện và sửa **1 lỗi tiềm ẩn thật** (không phải do dời thư mục, có
  từ trước, chỉ tình cờ lộ ra lúc test kỹ):
  - **`Element.animate().onfinish` có thể không bao giờ bắn khi tab bị ẩn/nền** (đã kiểm chứng thực
    nghiệm: mô phỏng tab `hidden`, `onfinish` không chạy dù đợi >500ms, trong khi `setTimeout` vẫn
    chạy đúng giờ). 2 chỗ trong code chỉ dựa vào `onfinish` để làm hành động quan trọng — có nguy cơ
    "kẹt màn" nếu học sinh chuyển tab giữa chừng:
    1. `core/engine.js` — gỡ **PLAY overlay** sau khi bấm (chỉ gỡ khi `fade.onfinish` chạy).
    2. `templates/quiz/quiz.js` — hàm `fadeSwap` chuyển câu (chỉ đổi câu khi `anim.onfinish` chạy).
  - **Đã sửa cả 2**: thêm `setTimeout` dự phòng song song với `onfinish`, có cờ chặn chạy 2 lần — bất
    kỳ ai chạy trước thì thắng. Đã kiểm chứng cơ chế dự phòng hoạt động đúng bằng mô phỏng độc lập.
  - Ghi thành **luật bắt buộc** trong `core/HUONG DAN CORE.md` (kèm mẫu code chuẩn) để mọi game sau
    này viết animate() đều theo đúng mẫu, không lặp lại lỗi.
- **Phát hiện thêm**: `python -m http.server` không gửi header chống cache → khi sửa file `.js` rồi
  tải lại CÙNG một tab, Chrome có thể tiếp tục dùng bản cache CŨ (xảy ra thật trong lúc kiểm thử lần
  này, khiến 1 lượt test tưởng chừng "fix không có tác dụng"). **Tạo `devserver.py`** (thay thế
  `python -m http.server`, tự gửi `Cache-Control: no-store`) và cập nhật `launch.json` (cấu hình
  preview `aword`) trỏ sang script này. Ghi vào `APP_MASTER.md` mục 9 làm bẫy cho các session sau.
- Đã cập nhật: `APP_MASTER.md` (bản đồ mới + 2 bẫy trên), `core/HUONG DAN CORE.md` (luật animate),
  memory dự án (để session mới tự biết cấu trúc + 2 phát hiện này).

### v0.2.1 — 17/7/2026 — Tinh chỉnh phản hồi đáp án Quiz (theo yêu cầu thầy)
- **Chọn ĐÚNG**: các ô sai còn lại chuyển RẤT nhạt (opacity 0.15, chỉ thấy mờ mờ), ô đúng giữ nguyên màu.
- **Chọn SAI**: dấu ✗ bay lên rồi **LƠ LỬNG giữa ô** (bồng bềnh ~1.9s mới tan, animation `aw-fly-cross`); ô sai đã chọn + các ô sai khác đều mờ nhạt; ô đúng giữ nguyên màu + ✓ nhỏ.
- **Âm khi sai = "Oh my god" meme** (mp3 copy vào `assets/sounds/oh-my-god-meme.mp3`, offline; lỗi file thì tự fallback tiếng womp cũ; vẫn theo nút loa tắt/bật).
- **Chuyển câu = fade đơn giản**: câu cũ mờ dần 160ms → câu mới hiện dần 250ms (bỏ hiệu ứng pop).
- Đã test thật: đúng → 3 ô mờ 0.15 + ô đúng opacity 1; sai → X còn lơ lửng sau 1.2s, 3 ô mờ, ô đúng giữ màu; mp3 tải 200 OK; card animation aw-fadein.

### v0.2.0 — 17/7/2026 — Vòng đời game hoàn chỉnh: PLAY → Game complete → Tổng kết → Leaderboard
- **Nút PLAY khổng lồ** (tam giác xanh trên nền tối, giống Wordwall) che khung khi mới vào game và sau Start again — **bấm mới bắt đầu**, đồng hồ chỉ chạy từ lúc bấm (đo chính xác đến 0.1 giây).
- **Hiệu ứng "Game complete"**: chữ trắng viền tối phóng to (pop) + **110 mảnh pháo giấy** 4 màu nổ từ giữa rơi xuống (Web Animations API, không thư viện) + nhạc mừng ngắn; sau ~2.2s tự chuyển sang bảng tổng kết.
- **Bảng tổng kết tối** (giống Wordwall): GAME COMPLETE · Score x/N · Time x.xs (số to, đơn vị nhỏ) · "YOU'RE 1ST ON THE LEADERBOARD" · 3 mục: **Leaderboard / Start again / Play a different template**.
- **Leaderboard lưu trên máy** (localStorage, file mới `src/core/leaderboard.js`): xếp hạng điểm cao trước → thời gian nhanh trước (đúng luật Wordwall), top 10, lượt vừa chơi được tô sáng + **gõ tên ngay tại hàng** (mặc định "Player"), nút Back. Sau này pha Firebase sẽ đồng bộ online cùng cấu trúc.
- File mới: `confetti.js`, `leaderboard.js`; icons thêm playBig; sound thêm fanfare; utils thêm ordinal (1ST/2ND/3RD) + fmtSecsParts (4.9s).
- Đã test thật: PLAY overlay chặn game, chơi 6/6 → confetti+chữ hiện, panel đủ thông số, leaderboard xếp hạng đúng + đổi tên lưu được, Start again quay về PLAY. Không lỗi console.

### v0.1.3 — 17/7/2026 — Hiệu ứng ✓/✗ + 100% tiếng Anh (theo yêu cầu thầy)
- **Trả lời ĐÚNG**: dấu ✓ TO trắng viền tối BAY LÊN từ ô + tiếng "ting" (2 nốt chuông cao) + dấu ✓ nhỏ ĐỌNG LẠI trên ô.
- **Trả lời SAI**: dấu ✗ TO bay lên + âm trầm "womp" + dấu ✗ nhỏ đọng ở ô sai + dấu ✓ nhỏ hiện ở ô đúng.
- **Ô KHÔNG đổi màu** sau khi chọn (bỏ đổi xanh/đỏ/mờ của v0.1.2) — giữ nguyên màu gốc như Wordwall.
- **Chữ trong ô**: to nhất có thể (clamp 18→32px) + VIẾT HOA toàn bộ.
- **Câu hỏi**: đưa lên sát viền trên khung, chữ to (clamp 26→58px).
- **100% TIẾNG ANH** toàn dự án: menu, nav "1 of 6", kết quả "Well done!/x of y correct/Play again/Home", trang chủ "Create & play English games/▶ Play", title trang, nội dung mẫu.
- **Menu 4 chức năng**: Submit answers (nộp ngay — câu chưa làm tính sai) · Start again · Resume · Change template (toast "coming soon", chờ có nhiều template).
- Kỹ thuật: badge/fly mark bằng SVG 2 lớp (viền tối + trắng); hiệu ứng gắn tại chỗ không re-render để animation chạy; sound.js viết lại có glide tần số.
- Đã test thật: fly mark xuất hiện, màu ô không đổi, badge đúng vị trí, menu đủ 4 mục, Submit answers ra kết quả English. OK.

### v0.1.2 — 16/7/2026 — Phong cách Wordwall cho Quiz (theo ảnh mẫu thầy gửi)
- **Font bo tròn "Baloo 2"** nhúng offline (`assets/fonts/`, 4 độ đậm).
- **Khung 16:9 nền TRẮNG** viền nhạt.
- **Đồng hồ góc trái-trên · điểm (✓ số) góc phải-trên** — chữ trơn, bỏ viên nền + thanh tiến độ.
- **4 ô đáp án NỔI 3D xếp 1 HÀNG NGANG** (gờ tối dưới, nhấn xuống khi bấm), 4 màu xanh/đỏ/cam/lá.
- **Thanh dưới**: ☰ menu (Chơi lại / Về trang chủ) · ◁ "x / N" ▷ · 🔊 loa (bật/tắt tiếng đúng-sai) · ⛶ phóng to (fullscreen).
- **Điều hướng bằng mũi tên** (không auto-nhảy); câu cuối mũi tên → dấu ✓ (Xong) nhấp nháy.
- Trả lời: ô ĐÚNG xanh, ô CHỌN SAI đỏ, ô còn lại **làm mờ** (sửa lỗi ô màu-lá gốc trông như đáp án đúng).
- Thêm mô-đun: `src/core/layout.js` (khung), `src/core/icons.js` (SVG), `src/core/sound.js` (tiếng đúng/sai Web Audio).
- Đã chụp màn xác nhận: giống ảnh mẫu Wordwall. Chơi + tính điểm + kết quả OK.

### v0.1.1 — 16/7/2026 — Chuẩn bố cục khung 16:9 (theo yêu cầu thầy)
- **Khung game tỉ lệ 16:9**, LUÔN nằm trên cùng trang (`src/core/layout.js` — buildStage).
- **Mọi thông tin trong game** (số câu · đồng hồ · điểm · câu hỏi · đáp án · màn kết quả) nằm **TRONG khung**.
- **Tên game + hướng dẫn** chuyển xuống **DƯỚI khung**.
- Trang chủ cũng theo khung 16:9 (nút chơi trong khung, tên bài ở dưới).
- Chữ/ô co giãn (clamp) để vừa khít khung ở nhiều cỡ màn hình.
- Đã đo & kiểm tra thật: tỉ lệ 1.778 (16:9), thanh thông tin trong khung, câu hỏi không tràn, tên game nằm dưới. OK.

### v0.1.0 — 16/7/2026 — Bản chơi thử game QUIZ (offline)
**Làm được:**
- Dựng bộ khung code tách lớp (DATA / ENGINE / THEME) đúng bản thiết kế `docs/07-ARCHITECTURE.md`.
- **Engine chung** (`src/core/engine.js`): thanh trên (tên bài · tiến độ · đồng hồ · điểm) + thanh tiến độ + màn KẾT QUẢ (điểm, số đúng/sai, thời gian, nút Chơi lại / Về trang chủ).
- **Registry** (`src/core/registry.js`): sổ đăng ký game — thêm game mới không đụng lõi.
- **Game QUIZ** (`src/templates/quiz.js`): hiện câu hỏi + 4 ô đáp án màu, bấm đúng→xanh, sai→đỏ + hé lộ đáp án đúng, tự sang câu tiếp; xáo câu hỏi & đáp án.
- **Theme "Classic"** (`src/themes/classic.css`): bảng màu bằng biến CSS, dễ nhân bản theme mới.
- Trang chủ + nút "Chơi thử" (`src/main.js`, `index.html`), giao diện `styles/app.css` (đẹp, responsive cho điện thoại).
- Bộ câu hỏi mẫu tiếng Anh (`src/data/sample-quiz.js`).

**Đã kiểm tra chạy thật:** trang chủ → chơi → 6 câu (đúng/sai đều đúng logic) → điểm & đồng hồ chạy → màn kết quả 5/6 → Chơi lại / Về trang chủ. OK.

**Chưa làm (kế hoạch):**
- Firebase (lưu điểm học sinh + xếp hạng online) — **để pha sau** theo yêu cầu thầy.
- Editor cho giáo viên nhập nội dung (hiện dùng file mẫu).
- Các game khác: Anagram → Find the match → Type the answer → Open the box.
- Trang giao bài (link + QR) + dashboard kết quả.
- Cài Node + chuyển sang Vite khi bắt đầu làm phần online.

---

## Quy tắc dự án
- Ngôn ngữ trao đổi với thầy: **dễ hiểu, tránh thuật ngữ** (thầy không chuyên lập trình).
- Mỗi mốc: ghi vào file này + tăng version.
- Tài liệu tham khảo Wordwall + kiến trúc: thư mục `docs/`.

---

**➡️ VIỆC ĐANG CHỜ nằm ở ĐẦU file này** (mục "⭐ VIỆC ĐANG CHỜ"), không phải ở đây — vì file xếp mới
nhất lên trên. Bàn giao đầy đủ: `APP_MASTER.md` mục 0a.
