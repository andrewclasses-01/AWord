// =============================================================
// INSTANT PRESS — kích hoạt NGAY LÚC CHẠM cho mọi bề mặt chơi (Đợt 175, 17/8/2026).
//
// VÌ SAO PHẢI CÓ FILE NÀY (đừng quay lại `.onclick` cho bề mặt chơi):
// AWord chạy trên màn cảm ứng HỒNG NGOẠI đa điểm (TOMKO TK-TT86). Sự kiện `click`
// có 2 tính chất chết người ở đó:
//   1. `click` CHỈ được sinh ra từ "con trỏ CHÍNH" (primary pointer). Khi 2 học
//      sinh chạm gần như cùng lúc (Fight mode), ngón chạm SAU là con trỏ phụ —
//      trình duyệt KHÔNG BAO GIỜ sinh `click` cho nó. Cú bấm mất trắng, đội kia
//      phải bấm liên tục tới khi ngón mình "được làm" con trỏ chính. Đây chính là
//      lỗi "A bấm trước không nhận, B bấm sau lại nhận trước" thầy báo 17/8/2026.
//   2. `click` chỉ bắn khi NHẤC TAY. Màn hồng ngoại nhận ra nhấc tay chậm hơn
//      chạm xuống (lưới tia phải thông trở lại), học sinh lại hay đè giữ — mỗi cú
//      bấm cộng thêm cả trăm ms vô ích, và đội đè tay lâu hơn bị thiệt dù chạm trước.
//
// `press(el, handler)` thay cho `el.onclick = handler` ở MỌI bề mặt chơi:
//   - Bắn handler NGAY tại `pointerdown` (thời điểm chạm). Mỗi ngón tay là một
//     pointer độc lập ⇒ đa điểm công bằng: THỨ TỰ CHẠM = THỨ TỰ KÍCH HOẠT.
//   - NUỐT sự kiện `click` sinh kèm theo sau (nếu không sẽ kích hoạt ĐÚP).
//     Cách nhận diện KHÔNG dùng đồng hồ (màn hồng ngoại nhả tay trễ vô chừng):
//     `click` tin cậy (isTrusted) với `detail >= 1` chắc chắn là click do con trỏ
//     sinh ra — mà mọi cú chạm/bấm chuột trong `el` đều ĐÃ qua pointerdown của el
//     (pointerdown nổi bọt) ⇒ nuốt là an toàn tuyệt đối.
//   - VẪN CHẠY với 2 đường kích hoạt không-con-trỏ (bắt buộc phải giữ):
//       • `el.click()` lập trình — isTrusted=false (fight.js bấm hộ nút PLAY của
//         bàn kia; myActivity/test-bench bấm hộ đủ thứ).
//       • Enter/Space trên bàn phím cứng — click tin cậy nhưng `detail === 0`.
//   - Tự chặn: nút `disabled` (Chromium có thể vẫn phát pointerdown trên nút
//     disabled — đừng tin, tự kiểm), chuột phải/giữa (button !== 0), và CHẠM DỘI
//     (bounce): màn hồng ngoại thi thoảng báo 1 cú chạm thành 2 pointerdown cách
//     nhau vài chục ms với pointerId khác nhau — cú thứ 2 trong vòng BOUNCE_MS
//     trên CÙNG phần tử bị bỏ (không ai bấm chủ ý 2 lần dưới 90ms trên 1 nút).
//
// LUẬT DÙNG:
//   - handler nhận sự kiện (PointerEvent lúc chạm, MouseEvent ở 2 đường fallback).
//     `e.stopPropagation()` trong handler hoạt động đúng ở tầng pointerdown — nút
//     loa nằm TRONG ô đáp án phải gọi nó, y như thời còn `click` (nếu không, chạm
//     nút loa là chọn luôn đáp án).
//   - KHÔNG preventDefault pointerdown ở đây: làm vậy Chromium bỏ luôn `:active`
//     (mất phản hồi nhấn của nút) và bỏ chuỗi mouse-compat mà keyboard.js đang
//     dùng để giữ focus (`onmousedown preventDefault`).
//   - Phần tử cần PHÂN BIỆT chạm với kéo/vuốt (Unjumble kéo thẻ, Maze chase vuốt,
//     ô điểm tay Fight vuốt ±1) thì KHÔNG dùng press() — chúng tự lo pointer.
//   - Gỡ kích hoạt = đặt `el.disabled = true` (press tự tôn trọng). KHÔNG có cơ
//     chế "gỡ listener" — phần tử chơi vốn bị vứt/dựng lại theo vòng đời game.
// =============================================================

const BOUNCE_MS = 90;

export function press(el, handler) {
  // Trình duyệt không có Pointer Events (rất cũ): về nếp click thuần, còn hơn chết hẳn.
  if (!window.PointerEvent) {
    el.addEventListener("click", e => handler(e));
    return el;
  }

  let lastDown = 0;

  el.addEventListener("pointerdown", e => {
    if (el.disabled) return;
    if (e.button !== 0) return;               // chuột phải/giữa không phải "bấm"
    const now = performance.now();
    if (now - lastDown < BOUNCE_MS) return;   // chạm dội của màn hồng ngoại
    lastDown = now;
    handler(e);
  });

  el.addEventListener("click", e => {
    if (!e.isTrusted || e.detail === 0) {     // .click() lập trình · Enter/Space
      if (el.disabled) return;
      handler(e);
      return;
    }
    // Click tin cậy do con trỏ sinh ra — pointerdown đã xử rồi. Nuốt để khỏi đúp,
    // và chặn nó nổi bọt lên tổ tiên (giữ đúng ranh giới stopPropagation cũ).
    e.preventDefault();
    e.stopImmediatePropagation();
  });

  return el;
}
