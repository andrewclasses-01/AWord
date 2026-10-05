// ⭐ Đợt 464 (05/10/2026) — CHẶN COPY + DÁN TRONG GAME GÕ CHỮ (thầy chốt).
//
// Học sinh từng dán đáp án (tra ở chỗ khác) thẳng vào ô gõ. Gắn hàm này lên `root`
// của template (playArea engine đưa cho mount()) để chặn, CHỈ bên trong root đó:
//   · dán: Ctrl+V, chuột phải → Paste, giữ lâu trên điện thoại → Dán
//     (sự kiện `paste` + lưới thứ hai `beforeinput` insertFromPaste/…Drop/…Yank)
//   · kéo thả chữ vào ô gõ (`drop`) và kéo chữ ra (`dragstart`)
//   · copy / cut (kể cả copy chữ học sinh vừa gõ, copy câu hỏi đem đi dịch máy)
//   · menu chuột phải / menu giữ lâu (`contextmenu`) + bóng chọn chữ iOS (CSS
//     `.aw-nocopy` trong core/app.css)
// Gõ phím thật, bàn phím trên màn hình, UniKey (core/vn-guard.js) không đi qua các
// sự kiện trên nên KHÔNG bị ảnh hưởng. Màn soạn bài của thầy (dán từ Excel) nằm
// ngoài root của game ⇒ cũng không bị ảnh hưởng.
// ⛔ Web chỉ chặn được trong chính trang này — tra bằng máy khác rồi tự gõ lại thì chịu.
//
// Dùng: const noCopy = guardNoCopy(root);   …cleanup: noCopy.dispose();

const BLOCK = ["paste", "copy", "cut", "drop", "dragstart", "contextmenu"];
const PASTE_TYPES = /^insertFrom(Paste|Drop|Yank)/;

export function guardNoCopy(root) {
  if (!root) return { dispose() {} };
  const stop = e => { e.preventDefault(); };
  const beforeInput = e => { if (PASTE_TYPES.test(e.inputType || "")) e.preventDefault(); };
  root.classList.add("aw-nocopy");
  // capture: chặn trước mọi handler của template, kể cả khi ô gõ dừng nổi bọt.
  BLOCK.forEach(t => root.addEventListener(t, stop, true));
  root.addEventListener("beforeinput", beforeInput, true);
  return {
    dispose() {
      root.classList.remove("aw-nocopy");
      BLOCK.forEach(t => root.removeEventListener(t, stop, true));
      root.removeEventListener("beforeinput", beforeInput, true);
    }
  };
}
