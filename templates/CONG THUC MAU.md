# CÔNG THỨC MẪU — rút từ Quiz (game đầu tiên đã chốt)

> Thầy đã duyệt Quiz xong (17/7 test OK nhiều vòng). File này đúc kết THÀNH CÔNG THỨC để build 4 game
> còn lại (Anagram, Find the match, Type the answer, Open the box) nhanh và đồng bộ phong cách, KHÔNG
> phải đọc lại toàn bộ `quiz.js` mỗi lần. Đọc cùng `HUONG DAN TEMPLATE.md` + `../core/HUONG DAN CORE.md`.

## 1. Bộ 3 file bắt buộc, luôn cùng khuôn

```
templates/<ten>/
├─ <ten>.js          registerTemplate({ type, scorable, name, mount, toPrintItems, edit? })
├─ <ten>.css         class tiền tố .aw-<viet-tat>-  (KHÔNG đụng .aw-topbar/.aw-iconbtn/.aw-navbtn của engine)
└─ sample-<ten>.js   export const activity = {...}  (id, type, title, instruction, theme, options, content)
```
`test.html`/`test.js` engine đã tạo sẵn — không sửa.

## 2. Khung `mount(root, activity, ui)` — bộ khung Quiz dùng, copy cấu trúc này

```js
mount(root, activity, ui) {
  const opt = activity.options || {};
  let items = [...(activity.content?.XXX || [])].filter(isValidItem);
  if (opt.shuffleQuestions) items = shuffle(items);
  const total = items.length;
  if (total === 0) { root.innerHTML = ""; root.append(el("div","aw-xxx-empty","No content yet.")); return () => {}; }

  const state = items.map(() => ({ /* per-item progress */ }));
  let index = 0, finished = false, fitter = null, autoTimer = null;

  ui.onSubmit(finish);
  window.addEventListener("keydown", onKey);
  render();

  function render() { /* xoá root, vẽ item hiện tại, gọi ui.setScore/ui.setNav, gắn autoFit nếu cần */ }
  function updateNav() { ui.setNav({ index: index+1, total, onPrev, onNext, nextLabel }); }
  function fadeSwap(change) { /* animate opacity 1->0 160ms + setTimeout 220ms dự phòng rồi change() */ }
  function goPrev()/goNext() { fadeSwap(...); }
  function onKey(e) { /* ArrowLeft/Right = prev/next; phím riêng game = chọn/điền */ }
  function finish() {
    if (finished) return; finished = true;
    const perQuestion = state.map((s,i) => ({ q:i, correct: s.correct === true }));
    const correct = perQuestion.filter(p=>p.correct).length;
    const review = items.map((it,i) => ({ question, answered, yourText, yourCorrect, correctText }));
    ui.finish({ correct, incorrect: total-correct, total, perQuestion, review, answered: state.filter(...).length });
  }
  return function cleanup() {
    window.removeEventListener("keydown", onKey);
    if (fitter) fitter.destroy();
    if (autoTimer) clearTimeout(autoTimer);
  };
}
```

**Vì sao theo đúng khuôn này**: `ui.finish()` cần đúng 6 trường (`correct/incorrect/total/perQuestion/review/
answered`) để engine tính điểm + dựng panel tổng kết + màn "Show answers" — sai hình dạng là panel vỡ.
`review[].question/answered/yourText/yourCorrect/correctText` PHẢI có đủ dù game không phải trắc nghiệm
(vd Anagram: `question`=clue, `yourText`=chữ HS ghép được, `correctText`=từ đúng).

## 3. Quy tắc BẮT BUỘC (đã trả giá bằng lỗi thật, đừng lặp lại)

1. **Sizing dùng `cqw`, KHÔNG `vw`/`clamp`** cho mọi phần tử TRONG khung 16:9 (để fullscreen giữ đúng
   tỷ lệ). Nhân thêm `var(--fit,1)` cho font-size nếu dùng `autoFit`.
2. **`autoFit(root, card, s => card.style.setProperty("--fit", s), { slack, measure })`** — dùng cho
   khối chữ có thể tràn (câu hỏi/clue dài). `slack` nên tính theo `root.clientWidth * hệ_số` (không px
   cứng). Huỷ fitter cũ (`fitter.destroy()`) TRƯỚC khi render lại, huỷ lần cuối trong `cleanup()`.
3. **`escapeHtml()`** MỌI chữ đến từ dữ liệu người dùng nhập trước khi nhét vào `innerHTML`/`textContent`
   qua `el()`. Copy hàm `escapeHtml` cuối file (giống quiz.js) — chưa có sẵn trong `core/utils.js`.
4. **`element.animate()` PHẢI có `setTimeout` dự phòng** cùng hành động, có cờ `done` chặn gọi 2 lần
   (tab ẩn → `onfinish` có thể không bao giờ bắn). Xem mẫu `fadeSwap` trong quiz.js.
5. **Phần tử định vị bằng `transform` (vd `left:50%;transform:translateX(-50%)`) chỉ được animate
   `opacity`** — nếu muốn hiệu ứng "pop" thì bake luôn phần định vị vào MỌI keyframe (dùng lại
   `aw-pop-cx`/`aw-fly`/`aw-fly-cross` có sẵn, đừng tự tạo keyframe mới động `transform`).
6. **Tile/ô đáp án KHÔNG đổi màu khi chọn** — phản hồi bằng `.aw-mark-fly` (dấu ✓/✗ to bay lên, class
   thêm `.is-cross` cho sai) + `.aw-tile-badge` (dấu nhỏ đọng lại) + làm mờ phần sai
   (`opacity:.15` qua class `is-dimmed`, TỰ ĐẶT trong CSS riêng của template, quiz gọi nó `is-dimmed`).
7. **Class CSS riêng LUÔN có tiền tố `.aw-<viet-tat>-`**; trước khi đặt tên mới, grep trong `core/`
   (nhất là `engine.js`/`app.css`) để chắc không trùng `.aw-topbar/.aw-iconbtn/.aw-navbtn`.
8. **KHÔNG hard-code màu** — luôn `var(--aw-*)` (theme quyết định). Nếu game cần biến theme mới (vd
   Crossword cần màu ô đen), đừng tự thêm vào `core/themes/*` — ghi "ĐỀ XUẤT SỬA CORE" vào GHI CHU của
   template rồi dùng tạm giá trị mặc định hợp lý.
9. **KHÔNG sửa `core/`.** Cần API mới ở `ui` hay hiệu ứng mới ở `core/app.css` → ghi đề xuất, KHÔNG tự
   thêm.
10. **`scorable: true/false`** — game "mở" không điểm (vd Open the box) đặt `false`, `ui.finish()` khi
    đó không cần `correct/incorrect` (xem hướng dẫn riêng trong GHI CHU OPEN-THE-BOX.md).
11. Bàn phím: Quiz dùng phím số 1-9 = chọn đáp án theo thứ tự + `←/→` chuyển câu. Game khác nên giữ
    `←/→` cho chuyển câu (nhất quán), còn phím "hành động" tùy game (Anagram: gõ chữ cái để đặt ô).

## 4. Print (`toPrintItems`) — chỉ cần khi dữ liệu KHÔNG giống Quiz

`core/print.js` đọc mặc định kiểu Quiz (`content.questions[].answers[]`). Nếu dữ liệu game khác hình
dạng, thêm hook:
```js
toPrintItems(activity) {
  return items.map(it => ({ clue: it.clue||it.prompt||"", answer: it.word||it.answer||"", options: undefined }));
}
```
`options` chỉ cần khi game có sẵn danh sách lựa chọn (kiểu Quiz). Không có hook → Print coi dữ liệu như
Quiz, thường ra sai/rỗng cho Anagram/Type-the-answer/Open-the-box.

## 5. Options — 4 mục chung của Quiz + cửa mở rộng riêng cho từng template (từ 24/7/2026)

Panel Options (ngoài khung, do engine dựng) LUÔN có 4 mục chung: Timer, Shuffle Q/A, Show answers,
Letters on answers — thiết kế THEO Quiz. Game khác đọc option nào ÁP DỤNG ĐƯỢC (vd `timer`,
`shuffleQuestions`, `showAnswers`) và bỏ qua option không liên quan (vd `lettersOnAnswers` với Anagram).

**Cần thêm option riêng cho game của bạn (vd Anagram có "Anagram mode"/"All caps"/"Allow skip")?** Từ
đợt Anagram viết lại (24/7/2026) `core/engine.js` đã có sẵn 1 cửa mở rộng: khai báo trong template
```js
buildExtraOptions({ panel, draft, mkCheck, mkRadioChoice }) {
  const g = el("div", "aw-opt-group");
  g.append(el("div", "aw-opt-label", "Tên nhóm"));
  const row = el("div", "aw-opt-row");
  row.append(mkCheck(draft.myFlag === true, "Nhãn", v => draft.myFlag = v));
  // hoặc: mkRadioChoice("aw-radio-name-rieng", "value", "Nhãn", draft.myField === "value", v => draft.myField = v)
  g.append(row); panel.append(g);
}
```
Engine tự gọi hàm này (nếu có) ngay sau nhóm "Letters on answers", TRƯỚC nút Apply — `draft` là đúng
object Apply sẽ ghi ngược vào `activity.options`, cứ sửa field trên đó là đủ, không cần tự lưu.
KHÔNG cần sửa `engine.js` thêm lần nữa cho việc này — đây KHÔNG còn là giới hạn, xem
`templates/anagram/anagram.js` (`buildExtraOptions`) làm ví dụ mẫu. Chỉ ghi "ĐỀ XUẤT SỬA CORE" nếu cần
một API hoàn toàn khác (vd hiệu ứng mới, cấu trúc panel khác hẳn).

## 6. Checklist trước khi báo "xong 1 game"

- [ ] Test qua `test.html` của đúng template — chơi hết 1 lượt, xem cả đúng/sai.
- [ ] Đổi theme (Style panel) — chữ/ô không vỡ ở cả 4 theme.
- [ ] Fullscreen — tỷ lệ giữ nguyên, không vỡ layout.
- [ ] Nội dung dài (câu/từ dài) — không tràn khung, `autoFit` chạy đúng.
- [ ] Chuyển tab giữa chừng lúc có animation đang chạy — không kẹt màn hình.
- [ ] `grep -nE "transform:.*translate|animation:"` trong file CSS riêng — không dính bẫy mục 3.5.
- [ ] Cập nhật `GHI CHU <TEN>.md`: nhật ký + đổi trạng thái 🔴→🟡→🟢 (chờ thầy duyệt để lên ✅).
