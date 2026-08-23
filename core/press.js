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

// =============================================================
// TAP HOẶC NHẤN GIỮ — một nút mang HAI việc (Đợt 192, 18/8/2026).
//
// Thầy gộp nút Style vào nút Template: chạm = Template, nhấn giữ = Style.
// VÌ SAO KHÔNG DÙNG `press()` Ở ĐÂY: press() bắn NGAY lúc chạm — đúng cho bề
// mặt CHƠI (thi đấu đa điểm, ai chạm trước ăn trước), nhưng một nút mang hai
// việc thì KHÔNG THỂ quyết định lúc chạm: phải đợi xem ngón tay có ở lại
// đủ lâu không. Đây là thanh công cụ của THẦY, không phải bề mặt đua của học
// sinh, nên vài trăm ms không ai mất gì.
//
// CÙNG MỘT KHUÔN với `gestures()` trong core/showdown-review.js (title Show
// answers 3 cử chỉ) — hai nơi viết tay vì cả hai đều phải chạy trên màn hồng
// ngoại TOMKO. Những thứ KHÔNG ĐƯỢC BỎ:
//   - `setPointerCapture`: ngón tay trượt ra khỏi nút vẫn phải báo `pointerup`
//     về đây, không thì cử chỉ sau bị hiểu sai.
//   - dung sai di chuyển: ngón đi xa hơn MOVE_TOL là đang cuộn/trượt, KHÔNG
//     phải đang nhấn giữ — huỷ đồng hồ giữ.
//   - `contextmenu` phải chặn: nhấn giữ trên cảm ứng là bật menu chuột phải
//     đè lên đúng cái panel vừa mở.
//   - `click` tin cậy có `detail >= 1` đã đi qua chuỗi pointer ở trên ⇒ NUỐT.
//     Còn `detail === 0` (Enter/Space) và `.click()` lập trình thì KHÔNG có
//     pointer nào cả ⇒ phải chạy onTap, không thì bàn phím và test-bench chết.
// =============================================================

const HOLD_MS = 420;      // giữ quá ngần này là "nhấn giữ"
const MOVE_TOL = 14;      // đi xa hơn ngần này là cuộn/trượt, không phải bấm

/**
 * `holdClass` (⭐ Đợt 243, tuỳ chọn) — tên class đeo lên phần tử TRONG SUỐT cú
 * nhấn giữ, gỡ ra ngay khi cú giữ kết thúc dù kết thúc kiểu gì (đủ giờ · nhấc
 * tay sớm · trượt ngón · huỷ). Để CSS vẽ được "máy đang nhận, giữ tiếp đi" —
 * trên màn hồng ngoại TOMKO không có con trỏ chuột nào báo điều đó cả.
 * ⚠️ OPT-IN: không truyền thì không một dòng nào ở dưới đổi hành vi, nên mọi
 * chỗ đang gọi tapOrHold (Options · Mode · Change template · bảng cuối game)
 * chạy y hệt như trước.
 * ⚠️ Phải gỡ ở CẢ BỐN đường ra. Bỏ sót `lostpointercapture` là nút kẹt vĩnh
 * viễn trong trạng thái "đang giữ" khi ngón tay trượt khỏi màn hình.
 */
export function tapOrHold(el, { onTap, onHold, holdClass = "" }) {
  if (!window.PointerEvent) {                 // trình duyệt rất cũ: còn một cử chỉ hơn là không có gì
    el.addEventListener("click", () => onTap());
    return el;
  }
  let holdTimer = null, held = false, downId = null, sx = 0, sy = 0;
  const mark = on => { if (holdClass) el.classList.toggle(holdClass, on); };
  const clearHold = () => { if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; } mark(false); };

  el.addEventListener("pointerdown", e => {
    if (el.disabled || e.button !== 0) return;
    downId = e.pointerId; held = false; sx = e.clientX; sy = e.clientY;
    try { el.setPointerCapture(e.pointerId); } catch { /* not capturable */ }
    clearHold();
    mark(true);
    holdTimer = setTimeout(() => { holdTimer = null; held = true; mark(false); onHold(); }, HOLD_MS);
  });

  el.addEventListener("pointermove", e => {
    if (downId == null || e.pointerId !== downId) return;
    if (Math.abs(e.clientX - sx) > MOVE_TOL || Math.abs(e.clientY - sy) > MOVE_TOL) clearHold();
  });

  el.addEventListener("pointerup", e => {
    if (downId == null || e.pointerId !== downId) return;
    downId = null;
    clearHold();
    if (held) { held = false; return; }       // cú giữ đã chạy rồi, nhấc tay không còn nghĩa gì
    onTap();
  });

  const cancel = () => { downId = null; held = false; clearHold(); };
  el.addEventListener("pointercancel", cancel);
  el.addEventListener("lostpointercapture", () => { downId = null; clearHold(); });
  el.addEventListener("contextmenu", e => e.preventDefault());

  el.addEventListener("click", e => {
    if (e.isTrusted && e.detail >= 1) { e.preventDefault(); e.stopPropagation(); return; }
    if (!el.disabled) onTap();                // Enter/Space · .click() lập trình
  });

  return el;
}
