# GHI CHÚ TOURNAMENT — template #22 (Đợt 548, 17/10/2026)

**TRẠNG THÁI: 🟢 CHỜ THẦY DUYỆT** (đã vào catalog theo lệnh "ok build" của thầy; chưa bấm tay trên TOMKO / đường giao bài thật).

## Tournament là gì
KHÔNG phải trò chơi. Là **bộ cấu hình GIẢI ĐẤU A SHOW SPEED** cho một lớp. Trận đấu thật chạy trên web `andrewclasses.com` (`nw/tran.html`), không chạy trong AWord.
Thầy dán mã bài WORDS ở myLesson ⇒ ô Set Tournament mở form giao bài AWord (`?giao=<số act>`) ⇒ chọn template **Tournament** ⇒ chỉnh options ⇒ START ⇒ ra assignment. App myLesson đọc assignment đó rồi dựng `giaiDau/{id}`.
Hợp đồng dữ liệu: `D:\OTHERS\CLAUDE\GIAI DAU THE - thiet ke\HOP DONG DU LIEU - 3 kho.md` mục 2.

## Khoá options (CHỐT — không đổi tên)
| Khoá | Giá trị | Ghi chú |
|---|---|---|
| `tnGame` | `'aShowSpeed'` | duy nhất; ô "Trò khác" mờ "Sắp có" |
| `tnHinh` | `'cap'` | Đấu cặp; "Đấu đội", "Hai đội đấu chéo" mờ "Sắp có" |
| `wsMode` | `'one'|'list'|'free'` | đúng khoá wordshake (dùng lại `buildExtraOptions` của wordshake) |
| `wsTiles` | `8|12|16` | idem |
| `wsOnlyList` | bool (mặc định true) | idem |
| `tnPhut` | `2|3|5` (mặc định 3) | phút mỗi trận |
| `tnLv` | `'easy'|'medium'|'hard'` (mặc định easy) | độ khó |
| `tnGoiY` | bool (mặc định true) | gợi ý lật chữ |
| `tnGiong` | bool (mặc định false) | giọng đọc gợi ý |
| `tnBien` | `'eng1'|'eng2'|'vi1'|'vi2'|''` | bộ gợi ý; mặc định = bộ đang chọn ở hàng ENG1/ENG2/VI1/VI2 của form |

Form tự điền mặc định vào `draft` (đúng object được ghi vào `activity.options`) nên assignment luôn đủ khoá. Ô "Score tank" của wordshake bị ẩn (không dùng cho giải).

## Nội dung
`activity.content.items[{word, clue, clues?, voice?, voices?}]` — copy từ act WORDS nguồn:
- `clue` = bộ gợi ý đang chọn lúc đổi; `clues{eng1,eng2,vi1,vi2}` = CẢ BỐN bộ; `voices{eng1,eng2}` = `{voice, voiceId}` từng bộ (core/convert.js lấy lại từ act gốc vì `toRecords` trải phẳng về một bộ).
- `activity.sourceActId` = id act WORDS nguồn (top-level của snapshot: cần dòng `sourceActId` trong `snapshotOf`, core/assignments.js). `assignments/{mã}.activityId` cũng là id act nguồn.
- **App chọn nghĩa**: `m = items[i].clues?.[tnBien] || items[i].clue`; giọng: `voices?.[tnBien]`. Bộ chữ ENG1/ENG2/VI1/VI2 giải qua `core/content-view.js` (cùng tên khoá `clues`/`voices`).

## Cách myLesson lấy mã assignment
Không đổi: form `?giao=<số act>&lop=…&td=…` (embed `moModalAw`) khi bấm START in console `MYACT:AW:ASSIGN:{code,title,bo,boTen,mauType,mauTen,che}` — marker/khoá GIỮ NGUYÊN, chỉ `mauType:'tournament'`, `mauTen:'Tournament'`. Lấy `code` rồi đọc `assignments/{code}` (đọc công khai).
**Cặp app:** vì KHÔNG đổi marker hay `?giao=` nên myLesson/myActivity KHÔNG cần bump cùng lúc. Nếu sau này đổi marker/`?giao=` thì phải bump cả ba bên.

## Màn học sinh (mở link assignment)
Thẻ giải: tên · phút/trận · độ khó · cách chơi · hình thức · số từ; dòng "Giải đấu diễn ra trên andrewclasses.com"; nút **Mở trang Giải đấu** (`https://andrewclasses.com/nw/giaidau.html`, tab mới); nút **Luyện với máy** = `startGame` của engine với một act `wordshake` dựng từ cấu hình (`practiceActivity`: wsMode/wsTiles/wsOnlyList, bộ gợi ý `tnBien`, giọng nếu `tnGiong` và bộ đó có clip, đồng hồ = `tnPhut`).
⛔ Tournament KHÔNG BAO GIỜ gọi `ui.finish`/`ui.onSubmit` và "Luyện với máy" mở KHÔNG có `session` ⇒ không ghi `results`/`scores`.
Luyện với máy: `tnLv` và `tnGoiY` chưa tác dụng (wordshake template chưa có độ khó; gợi ý lật chữ 15 s luôn bật). Nó cũng đặt `localStorage aword-showspeed-act-time` = số phút của giải (nhớ theo máy).

## File
| File | Việc |
|---|---|
| `tournament.js` | template: `cfgOf`, `practiceActivity`, `buildExtraOptions`, thẻ giải |
| `tournament.css` | tiền tố `.aw-tn-` + nút mờ "sắp có" |
| `sample-tournament.js` | mẫu 8 từ thời tiết, đủ 4 bộ gợi ý |
| `tournament-editor.js` | dùng lại editor Anagram, đóng `type:"tournament"` |
| `test.html` / `test.js` | bàn thử: `?phut=2|3|5&lv=…&mode=one|list|free&bien=…&giong=1&trong=1` |

## Core đã thêm dòng khai báo (thầy duyệt build — không đụng engine/fight/showdown)
`core/catalog.js` (TEMPLATES + TEMPLATE_ICON `fmtRace`) · `core/convert.js` (QA_TARGETS, toRecords, buildContent, nhét `clues`/`voices`/`sourceActId`/`tnBien`) · `core/assignment-ui.js` (`TPL_SHORT.tournament = "TOURNAMENT"` ⇒ đuôi tiêu đề `…/TOURNAMENT`) · `core/assignments.js` (`snapshotOf` thêm `sourceActId`) · `core/words-picker.js` + `words-picker-art.js` + `.css` (ô thứ 12 "Tournament", hàng dưới đủ 6 ô; sửa luôn phím ↑↓ lệch từ Đợt 527) · `core/tpl-files.js` sinh lại.

## ĐỀ XUẤT SỬA CORE
- Chip "✓ 0", đồng hồ và hàng ‹ › của khung được ẩn bằng CSS theo `.aw-stage.act-tournament` (không cần sửa core; nếu muốn gọn hơn thì thêm cờ `tpl.noNav`).
- Độ khó `tnLv` chưa có ở wordshake template (chỉ GAME có Options LEVEL) — luyện với máy chưa theo độ khó.

## Nhật ký
- Đợt 548: dựng template, khai core, đo bàn thử `templates/tournament/test.html` (thẻ giải, Luyện với máy mở được A Show Speed 3 phút + ra câu, Options đủ ô, `convertActivity` giữ `clues/voices/sourceActId/tnBien`). ⬜ Thầy chưa thử đường giao bài thật (myLesson → form → học sinh mở link) trên TOMKO.
