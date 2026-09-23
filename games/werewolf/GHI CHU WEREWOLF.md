# GHI CHÚ WEREWOLF (ma sói) — game cố định đầu tiên của gốc GAMES

TRẠNG THÁI: ✅ **Đợt 373 (23/9/2026) — thầy duyệt thiết kế v5 + "ok build, commit + push"**. ⬜ Thầy chưa bấm tay trên iPad thật.

## 1. Nó là gì
Màn hình **quản trò** cho trò Ma sói chơi TRỰC TIẾP trong lớp. Thầy chia bài thật, cầm iPad nằm ngang,
phát nhạc qua loa bluetooth để át tiếng động ban đêm, và chạy phần vote ngay trên màn này.
Màn chỉ quản trò nhìn (hiện tên + vai của mọi em). Toàn bộ chữ tiếng Anh (thầy chốt).

## 2. Luật thầy chốt (23/9/2026)
- Thứ tự đêm: Werewolves → Witch → Seer → Bodyguard → Hunter → Dawn.
- **Đêm 1 ghi vai ngay khi vai đó mở mắt** (chạm thẻ các em đang thức). Ai không dậy ⇒ Villager.
- Vai đã chết vẫn được **gọi giả** ("fake call").
- Wolves / Bodyguard chỉ có nút *Done · sleep*; chưa chọn ai mà bấm Done ⇒ **hỏi lại 1 lần**.
- Witch: màn **SAVE / DON'T SAVE** trước (chỉ khi Sói có cắn và bình cứu còn) → màn **Poison**: chạm 1 thẻ là chọn,
  chạm thẻ khác là thay, không chọn là không độc. **Được tự cứu. Được cứu + độc cùng một đêm.** Mỗi bình 1 lần/ván.
- Seer: chỉ nút Done; chạm thẻ ⇒ thẻ to + sáng lên (KHÔNG pop-up). Thẻ đã soi mang chấm con mắt suốt ván.
- Bodyguard: không che 1 người 2 đêm liền. Người được che **không chết kiểu nào trong đêm đó** (cả độc, cả thợ săn kéo).
- Hunter: đêm 1 chỉ; đêm 2 giữ hoặc đổi 1 lần rồi khoá; người đó chết thì chỉ lại. Chọn xong hiện **đường nét đứt cam**.
  Thợ săn chết BAN ĐÊM ⇒ kéo người bị chỉ; bị VOTE ra ⇒ chết một mình.
- Sáng: màn DAY X hiện SỐ người chết + thẻ người chết kèm lý do (cho quản trò); *Start the day* ⇒ thẻ bay vào OUT.
- Ngày: đồng hồ thảo luận TO ở giữa (chỉ lúc Discussion) → Open vote: vuốt thẻ A→B = phiếu, luôn hiện đường;
  thẻ nhiều phiếu nhất to + phập phồng; **đủ người vote** ⇒ nền xanh lá nhạt + nút Confirm mới bật ⇒ thẻ bị loại bay ra giữa
  ⇒ *Sleep → Night N* ⇒ bay vào OUT rồi vào đêm. Hoà phiếu: không ai bị loại.
- Thắng: Sói = Dân ⇒ WEREWOLVES WIN · hết Sói ⇒ VILLAGERS WIN.
- Tối đa **20 em**. Thẻ luôn **chia đều quanh vòng**, ai OUT thì cả vòng giãn lại; cỡ thẻ cố định theo sĩ số lúc READY.

## 3. File
| File | Việc |
|---|---|
| `games/games.js` | Danh sách game cố định (`FIXED_GAMES`) + nạp CSS. **Thêm game = 1 mục ở đây.** Không đi qua `core/catalog.js` ⇒ không hiện ở New activity / Template / Set assignment. |
| `games/werewolf/werewolf.js` | `mountWerewolf(root, ctx) → dispose()`. Mọi truy vấn DOM đều trong `root`. |
| `games/werewolf/werewolf.css` | Mọi luật dưới `.ww`, keyframes tiền tố `ww-`. |
| `games/werewolf/ww-store.js` | Chỗ ngồi theo lớp (Firestore `users/{uid}/items/aw-werewolf`, kind `werewolf`) + nhạc (IndexedDB trên máy). |
| `games/werewolf/test.html` | Trang thử không cần đăng nhập, lớp mẫu. `http://localhost:5591/games/werewolf/test.html` |
| `main.js` | thẻ game ở đầu gốc GAMES · view `"game"` · link `?g=werewolf` · `renderFixedGame()` · dispose khi rời trang. |
| `core/store.js` | thêm `"werewolf"` vào `APP_DATA_KINDS` (tài liệu chỗ ngồi không được ăn số link). |

## 4. Dữ liệu
- **Lớp**: đọc từ Settings ▸ Classes (`listClasses()`). Thêm/bỏ tên ở màn chuẩn bị chỉ cho ván đó.
- **Chỗ ngồi**: lưu theo TÊN LỚP mỗi lần kéo đổi chỗ + lúc READY ⇒ máy nào mở cũng thấy.
- **Nhạc**: 2 bài mẫu tạo bằng WebAudio (không file). Nút *+ Add mp3* lưu file vào **IndexedDB của máy đó**
  (Firestore giới hạn 1 MB/tài liệu, AWord chưa có Storage) ⇒ iPad nào phát nhạc thì thêm nhạc trên iPad đó.
- **Ván đang chơi** tự lưu vào `localStorage["aword-werewolf-game"]`; mở lại ⇒ hỏi *Continue the game in progress?*

## 5. Thiết kế gốc
5 vòng mẫu thầy duyệt: `D:\OTHERS\CLAUDE\AWord - thiet ke Werewolf\werewolf-v1…v5.html`.
`werewolf.js`/`.css` được SINH từ v5 (script `mk_game.py` + `mk_game2.py` ở scratchpad phiên 23/9) rồi vá tay;
từ nay sửa THẲNG file trong repo, đừng sinh lại từ mẫu.

## 6. Bẫy đã gặp
- `"Hunter's"` trong chuỗi nháy đơn JS ⇒ SyntaxError cả trang. Dùng dấu `’`.
- Thẻ đang nhấc che ô OUT ⇒ `elementFromPoint` trúng chính thẻ ⇒ `.card.lift{pointer-events:none}`.
- Thiếu `box-sizing:border-box` ⇒ thẻ cao hơn ô, chồng nhau.
- Ảnh chụp Browser pane chỉ vẽ một phần lớp `position:fixed` — đo `getBoundingClientRect` trước khi tin ảnh.

## 7. Việc chờ
- ⬜ Thầy bấm tay trên iPad thật: kéo xếp chỗ, âm lượng qua bluetooth, thêm mp3.
- ⬜ Nếu thầy gửi mp3 muốn có sẵn trên mọi máy: bỏ vào `games/werewolf/music/` + thêm vào danh sách bài trong `werewolf.js`.
