# AWord — Tổng quan dự án & Dữ liệu tham khảo Wordwall

> Tài liệu nghiên cứu cơ chế wordwall.net để xây **AWord**: web game tiếng Anh của Teacher Andrew.
> Nguồn khảo sát: tài khoản Pro `andrewclasses`, thư mục *Example Activities*.
> Ngày lập: 2026-07-16.

---

## 1. Đích của dự án AWord

- **Sản phẩm**: một **web app tạo + chơi game tiếng Anh** giống Wordwall, **đẩy lên GitHub** (GitHub Pages / static hosting).
- **Yêu cầu lõi**: có **cơ chế nhận dữ liệu chơi từ học sinh** (điểm, thời gian, số câu đúng) để **đánh giá + xếp hạng** (leaderboard).
- **Bối cảnh**: nằm trong hệ sinh thái Andrew Classes (myActivity, myLink, myBoard đã tích hợp Wordwall). AWord sẽ là "Wordwall của riêng thầy".

### Hệ quả kiến trúc cần lưu ý ngay
1. **Web tĩnh trên GitHub Pages KHÔNG có backend** → phần "thu dữ liệu học sinh để xếp hạng" cần một dịch vụ lưu trữ ngoài:
   - Phương án A: Firebase (Firestore/Realtime DB) — miễn phí, realtime leaderboard, dễ nhúng vào web tĩnh.
   - Phương án B: Google Sheets qua Apps Script Web App (hợp gu hệ sinh thái thầy đang dùng Excel/Sheets).
   - Phương án C: Supabase / một API nhỏ tự host.
2. **Tách 2 vai trò** như Wordwall: **người tạo (giáo viên)** dùng editor; **người chơi (học sinh)** mở link, nhập tên, chơi, gửi điểm.
3. **Nội dung game nên tách khỏi engine**: mỗi activity = một khối JSON dữ liệu; nhiều "template" cùng đọc một cấu trúc dữ liệu (xem mục 3 — đây là bí quyết của Wordwall).

---

## 2. Danh mục 33 template của Wordwall (catalog gốc)

Lấy từ trang `Create → Pick a template`. Mỗi ô = 1 template kèm mô tả cách chơi.

| # | Template | Mô tả cách chơi (nguyên gốc dịch) |
|---|---|---|
| 1 | **Wordsearch** | Từ giấu trong lưới chữ, tìm càng nhanh càng tốt |
| 2 | **Hangman** | Đoán chữ cái để hoàn thành từ |
| 3 | **Spell the word** | Kéo/gõ chữ cái vào đúng vị trí để đánh vần |
| 4 | **Crossword** | Ô chữ: bấm vào từ và gõ đáp án theo gợi ý |
| 5 | **Flip tiles** | Thẻ 2 mặt, chạm để phóng to, vuốt để lật |
| 6 | **Type the answer** | Gõ đáp án đúng cho mỗi prompt/câu hỏi |
| 7 | **Rank order** | Kéo-thả các mục vào đúng thứ tự |
| 8 | **Flash cards** | Thẻ: mặt trước prompt, mặt sau đáp án |
| 9 | **Match up** | Kéo-thả mỗi từ khóa cạnh định nghĩa của nó |
| 10 | **Labelled diagram** | Kéo ghim vào đúng vị trí trên ảnh |
| 11 | **Gameshow quiz** | Trắc nghiệm có áp lực thời gian, lifeline, vòng bonus |
| 12 | **Speaking cards** | Chia thẻ ngẫu nhiên từ bộ bài xáo trộn |
| 13 | **Maze chase** | Chạy tới vùng đáp án đúng, né kẻ địch |
| 14 | **Pair or No Pair** | Quyết định 2 thẻ có thuộc về nhau không |
| 15 | **True or false** | Mục bay qua nhanh, chọn đúng trước khi hết giờ |
| 16 | **Unjumble** | Kéo-thả từ để sắp lại câu đúng thứ tự |
| 17 | **Anagram** | Kéo chữ cái về đúng vị trí để giải đảo chữ |
| 18 | **Flying fruit** | Đáp án bay ngang màn hình, chạm đáp án đúng |
| 19 | **Airplane** | Dùng chạm/bàn phím lái vào đáp án đúng, né sai |
| 20 | **Watch and memorize** | Xem & nhớ các mục, cuối bài chạm những mục đã thấy |
| 21 | **Quiz** | Chuỗi câu trắc nghiệm, chạm đáp án đúng để tiếp |
| 22 | **Balloon pop** | Nổ bóng để thả từ khóa vào định nghĩa khớp |
| 23 | **Spin the wheel** | Quay bánh xe xem mục nào hiện ra |
| 24 | **Image quiz** | Ảnh hiện dần, bấm chuông khi trả lời được |
| 25 | **Group sort** | Kéo-thả mỗi mục vào đúng nhóm |
| 26 | **Open the box** | Chạm từng hộp để mở, hiện mục bên trong |
| 27 | **Complete the sentence** | Cloze: kéo-thả từ vào chỗ trống trong đoạn |
| 28 | **Win or lose quiz** | Trắc nghiệm tự chọn điểm cho mỗi câu |
| 29 | **Whack-a-mole** | Chuột chũi hiện lần lượt, chỉ đập con đúng |
| 30 | **Matching pairs** | Chạm 2 thẻ mỗi lượt xem có khớp không |
| 31 | **Speed sorting** | Kéo-thả mỗi mục vào đúng hộp |
| 32 | **Find the match** | Chạm đáp án khớp để loại, lặp đến hết |
| 33 | **Word magnets** | Kéo-thả từ/chữ để xếp thành câu |
| — | ~~Maths generator~~ | ĐÃ NGỪNG (DISCONTINUED) |

---

## 3. Bí quyết vận hành: 6 "mô hình dữ liệu" dùng chung

**Phát hiện quan trọng nhất**: 33 template chỉ dựng trên ~6 cấu trúc nội dung. Một bộ nội dung có thể **"Switch template"** nhảy sang mọi game cùng nhóm mà không nhập lại dữ liệu. Đây là điều AWord PHẢI học theo.

| Mô hình | Cấu trúc 1 mục (item) | Template dùng chung |
|---|---|---|
| **A. Quiz / Trắc nghiệm** | `{ question, answers[], correctIndex(es) }` | Quiz, Gameshow quiz, Maze chase, Airplane, Flying fruit, Whack-a-mole, Win or lose, Image quiz, Open the box, Spin the wheel, True or false |
| **B. Match / Ghép cặp** | `{ keyword, definition }` (hoặc `{prompt, answer}`) | Match up, Matching pairs, Find the match, Balloon pop, Flash cards, Flip tiles, Pair or No Pair |
| **C. Word / Từ đơn** | `{ word, hint? }` | Wordsearch, Hangman, Spell the word, Anagram, Crossword |
| **D. Sentence / Câu** | `{ sentence, blanks[]? }` | Unjumble, Word magnets, Complete the sentence |
| **E. Sort / Phân loại** | `{ item, group }` | Group sort, Speed sorting, Rank order |
| **F. Label / Nhãn ảnh** | `{ image, pins[]{x,y,label} }` | Labelled diagram |
| **(Prompt đơn)** | `{ text }` | Speaking cards, Type the answer*, Watch and memorize |

\* *Type the answer* dùng mô hình gần với Quiz nhưng đáp án là **gõ chữ** thay vì chọn — cần xác nhận khi mổ xẻ.

> **Kết luận thiết kế AWord**: xây engine quanh các "mô hình dữ liệu" này, mỗi template chỉ là một **bộ render + luật chơi** đọc cùng một JSON. Bắt đầu với mô hình A (Quiz) và B (Match) vì phủ nhiều game nhất.

---

## 4. Quy trình tạo & vận hành một activity (khung chung Wordwall)

Thanh tiến trình khi tạo: **Pick a template → Enter content → Play**

Sau khi tạo, mỗi activity có các thao tác (sẽ xác nhận chi tiết từng game):
- **Play** — chơi thử.
- **Edit content** — sửa nội dung.
- **Switch template** — đổi sang game khác cùng mô hình dữ liệu.
- **Theme / Options** — đổi giao diện, bật/tắt timer, đếm giờ, xáo đáp án, số câu...
- **Share** — công khai / lấy link / nhúng.
- **Set assignment** — giao bài, thu kết quả học sinh (mấu chốt cho AWord).
- **Print** — xuất bản in (một số game).
- **My Results** — xem điểm/bảng xếp hạng.

---

## 5. 5 game trọng tâm nghiên cứu (thầy hay dùng)

| Game | Mô hình | File tài liệu |
|---|---|---|
| ANAGRAM | C (Word) | `01-ANAGRAM.md` |
| QUIZ | A (Quiz) | `02-QUIZ.md` |
| TYPE THE ANSWER | A/prompt | `03-TYPE-THE-ANSWER.md` |
| OPEN THE BOX | A (Quiz) render hộp | `04-OPEN-THE-BOX.md` |
| FIND THE MATCH | B (Match) | `05-FIND-THE-MATCH.md` |
| *(cơ chế chung)* | — | `06-RESULTS-AND-RANKING.md` |

---

## 6. Trạng thái nghiên cứu — HOÀN TẤT giai đoạn tham khảo

- [x] Catalog 33 template + 6 mô hình dữ liệu
- [x] ANAGRAM → `01-ANAGRAM.md`
- [x] QUIZ → `02-QUIZ.md`
- [x] TYPE THE ANSWER → `03-TYPE-THE-ANSWER.md`
- [x] OPEN THE BOX → `04-OPEN-THE-BOX.md`
- [x] FIND THE MATCH → `05-FIND-THE-MATCH.md`
- [x] Cơ chế Kết quả + Xếp hạng → `06-RESULTS-AND-RANKING.md`

### Activity demo đã tạo trên Wordwall (tài khoản andrewclasses)
| Game | Resource ID |
|---|---|
| ANAGRAM (mẫu sẵn) | 116282109 |
| AWORD QUIZ DEMO | 116282831 |
| Type the answer (Untitled2305) | 116282921 |
| Open the box (Untitled2306) | 116283011 |
| Find the match (Untitled2307) | 116283114 |
> Các demo này nằm ở gốc My Activities (chưa vào thư mục Example Activities). Có thể xóa/di chuyển tùy ý.

## 7. Bước tiếp theo (chờ thầy chốt)
1. Chọn **backend lưu kết quả**: Firebase / Google Apps Script + Sheets / Supabase.
2. Chốt **chuẩn JSON** cho activity + result.
3. Dựng **kiến trúc dự án** (engine tách theme + luật chơi; teacher editor; student player; dashboard).
4. Thứ tự template làm trước: Quiz → Anagram → Find the match → Type the answer → Open the box.
