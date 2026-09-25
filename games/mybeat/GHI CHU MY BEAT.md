# GHI CHÚ MY BEAT — game cố định thứ 2 của gốc GAMES

TRẠNG THÁI: ✅ **Đợt 385 (25/9/2026) — thầy "ok build" thiết kế v3**. ⬜ Thầy chưa bấm tay trang thật.

## 1. Nó là gì
Nghe một bài hát trên YouTube, điền những chữ còn thiếu trong lời. Chơi **trên lớp bằng tài khoản AWord của thầy**
(màn chiếu / TOMKO), chưa có đường cho học sinh ở nhà. Lấy ý từ game LingoClip nhưng bỏ hết phần râu ria
(cấp người chơi, huy hiệu, chuỗi ngày, karaoke). Toàn bộ chữ tiếng Anh.

## 2. Luật thầy chốt (25/9/2026)
- **Bản quyền**: nhạc luôn phát qua trình phát YouTube chính thức (host `youtube-nocookie`). Bài của thầy
  (`source:"own"`) hoặc nhạc miễn phí bản quyền của kênh khác (`source:"cc"`) — loại 2 **bắt buộc** giấy phép +
  dòng ghi công, hiện ở trang bài và dưới video. Thiếu thì nút Publish khoá. Giấy phép có "NC" ⇒ cảnh báo (lớp thu phí).
- 2 chế độ: **Choice** (4 nút, phím 1–4) · **Type** (gõ chữ, soát từng chữ cái; sai 3 chữ cái liền ⇒ chữ cái kế tự hiện;
  không phân biệt hoa/thường; `'` và `-` tự điền).
- 4 cấp theo % chữ phải điền: Beginner 15 · Intermediate 30 · Advanced 55 · Expert 100. Chỗ trống **cố định theo
  bài + cấp** (bảng xếp hạng mới công bằng), mỗi câu ≥ 1 chỗ, ưu tiên chữ dài, bỏ chữ đệm (a/the/oh/yeah…) ở cấp thấp,
  không bao giờ khoét chữ thầy đánh dấu "never".
- Điểm: +10 đúng ngay · +5 sau khi sai · 5 đúng liền ⇒ ×2, ×3, tối đa ×4 · sai ⇒ về ×1.
- **Hết câu mà còn chỗ trống ⇒ nhạc DỪNG**, máu −7/giây (~14 s hết); điền xong cả câu ⇒ câu hát lại từ đầu (lùi 0,35 s).
  Sai −6 · đúng +2. Hết máu ⇒ *Out of beats!*: Try again · Keep practising (chơi tiếp, không tính điểm) · Quit.
- **Không có nút Replay / Skip** (thầy bỏ ở v3). Có nút ‖ (Pause: Resume · Start again · Quit), phím Esc.
- Kết quả: sao 0–5 theo % đúng ngay · 4 ô (đúng ngay / đúng sau khi sai / số lần sai / %) · **Words to practise** ·
  **Save to leaderboard**: chọn lớp + gõ tên (em / đội / cả lớp), không bắt buộc, mỗi tên giữ điểm cao nhất.

## 3. File
| File | Việc |
|---|---|
| `games/games.js` | mục `mybeat` (+ `card` = nền/icon thẻ ở gốc GAMES). Link `?g=mybeat`. |
| `games/mybeat/mb-core.js` | luật chơi thuần, không DOM: `flatten`, `pickGaps`, `Round`, `mergeBoard`, `fromPackage`, sửa câu. Thử được bằng Node. |
| `games/mybeat/mb-player.js` | YouTube IFrame API + `createFakePlayer` (bài Demo) + `videoInfo` (oEmbed, không cần khoá API). |
| `games/mybeat/mb-store.js` | Firestore (`firestoreStore`) + `makeMemoryStore` (trang thử). |
| `games/mybeat/mybeat.js` | `mountMyBeat(root, ctx) → dispose()`: Home · Song · Play · Result · Editor. |
| `games/mybeat/mybeat.css` | mọi luật dưới `.mb`, keyframes `mb-`. |
| `games/mybeat/test.html` | thử không đăng nhập: `http://localhost:5510/games/mybeat/test.html` (`?seed=<url .beat.json>` thêm 1 bài). |
| `tools/mybeat-prepare.py` | **My Beat Prep** — file nhạc → `.beat.json`, chạy **hoàn toàn offline**. |
| `main.js` | thẻ game đọc `g.card`; chỉ Werewolf nạp `loadGameData()`. |
| `core/store.js` | `mybeat`, `mybeat-song` trong `APP_DATA_KINDS`. |

## 4. Dữ liệu (Firestore `users/{uid}/items`, không cần luật mới)
- `aw-mybeat` — kind `mybeat`: `{ lists:[{id,name}] }`.
- `mb_<…>` — kind `mybeat-song`, một bài:
  `{ title, artist, channel, youtube, link, source, licence, credit, level, lists[], draft, duration,
     sections:[{name, from, guess}], lines:[{x, s:[giây bắt đầu từng chữ], e, c:[chữ cần soát], n:[chữ không khoét]}],
     board:{ "<mode>-<level>": [{name, cls, score, stars, at}] }, createdAt, updatedAt }`.
  ⛔ Firestore cấm mảng trong mảng ⇒ mỗi câu là một map chứa mảng số.
  ⛔ `board` chỉ ghi bằng `saveScore` (transaction). `saveSong` không bao giờ gửi `board` ⇒ sửa bài không mất điểm.
- Không có `root` ⇒ không bao giờ hiện trong thư viện; có trong `APP_DATA_KINDS` ⇒ không ăn số link.

## 5. Công cụ My Beat Prep (offline)
```
py tools\mybeat-prepare.py --audio "song.mp3" --link "https://youtu.be/XXXXXXXXXXX" --desc "song.txt" --lyrics "song-lyrics.txt"
```
- `--audio` file nhạc có sẵn trên máy (nhạc miễn phí: file từ **link tải chính thức** của kênh; nhiều kênh cấm tải bằng phần mềm khác).
- `--link` chỉ GHI vào gói, công cụ không mở. `--desc` = mô tả video lưu .txt ⇒ tự lấy giấy phép + dòng ghi công.
- `--lyrics` = lời thật (mỗi dòng 1 câu hát, dòng trống giữa các đoạn, được ghi `[Chorus]`) ⇒ giữ chữ của thầy, chỉ mượn mốc giờ. **Nên có** — máy nghe bài hát không chắc bằng nghe nói.
- `--own` bài của thầy · `--no-check` bỏ lần nghe thứ 2 (nhanh gấp đôi, không có chữ vàng).
- Số đo 25/9 ("Lie 2 You" 4:03, 5060 Ti, **chặn mạng**): 53 s đủ bước; 22 s với `--lyrics --no-check`; 351/352 chữ lời khớp giọng hát.
- Mô hình: Parakeet `E:\LAP TRINH APP\MODEL\_cache\hub\models--nvidia--parakeet-tdt-0.6b-v2`, Demucs
  `…\_cache\hub\models--adefossez--HTDemucs` (⛔ Demucs 4.1 đọc từ **HuggingFace hub**, KHÔNG phải `TORCH_HOME`).
  Máy mới: chép cả thư mục `_cache\hub` sang, hoặc chạy 1 lần khi có mạng.

## 6. Thiết kế gốc
`D:\OTHERS\CLAUDE\AWord - thiet ke My Beat\mybeat-v1…v3.html` (+ trang nghe thử `thu-cong-cu-lie2you\`). Sửa thẳng file repo, đừng sinh lại từ mẫu.

## 7. Bẫy đã gặp
- Demucs tách giọng làm Parakeet **mất nguyên 1 câu** ⇒ bản trộn gốc là chính, bản tách giọng chỉ để đánh dấu chữ cần soát.
- Cùng bài, 2 file mã hoá khác nhau có thể nghe ra chữ khác nhau ⇒ đưa `--lyrics`.
- Sau khi seek để hát lại câu, `getCurrentTime` có thể còn số cũ vài chục ms ⇒ `g.hold` 450 ms không xét dừng.
- Trình duyệt chỉ cho phát tiếng sau một cú bấm của người dùng ⇒ luôn có nút ▶ to trước khi chơi.

## 8. Việc chờ
- ⬜ Thầy bấm tay trang thật: New song với bài thật → Publish → chơi Choice + Type trên màn lớp → lưu điểm.
- ⬜ Chạy `py tools\mybeat-prepare.py` trên máy thầy với 1 bài của thầy + lời.
- ⬜ (sau) Đường cho HS chơi ở nhà: link công khai + luật Firestore đọc bài / ghi điểm.
