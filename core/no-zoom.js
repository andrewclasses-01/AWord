// =============================================================
// ⭐ Đợt 377 (23/9/2026) — KHÔNG ZOOM TRONG MỌI TÌNH HUỐNG (thầy chốt).
//
// Script THƯỜNG (không phải module), nạp trong <head> của index.html /
// play.html / source.html để chạy trước mọi thứ khác. Chia việc với 2 chỗ:
//   • thẻ viewport `maximum-scale=1, user-scalable=no` — Android Chrome nghe
//     nó; iOS thì chỉ nghe phần "không tự phóng khi bấm vào ô gõ chữ".
//   • `core/app.css` đặt `touch-action: manipulation` cho MỌI phần tử — giết
//     zoom CHẠM ĐÚP ở mọi engine (trước đợt này chỉ có trong khung game).
//     ⛔ Đừng đổi thành `pan-x pan-y` ở `html` rồi để con là `manipulation`:
//     WebKit giao hai tập đó ra RỖNG ⇒ `none` ⇒ iPad hết cuộn trang.
// File này lo phần còn lại — zoom HAI NGÓN và zoom của máy tính:
//   1. gesturestart/change/end — cử chỉ chụm riêng của Safari iOS/iPadOS
//      (iOS bỏ qua `user-scalable=no` từ iOS 10, đây mới là cái chặn thật).
//   2. touchmove ≥ 2 ngón — chụm trên Chrome màn cảm ứng TOMKO/Android.
//      Chỉ chặn MẶC ĐỊNH của trình duyệt (cuộn/zoom); pointer event của game
//      vẫn đi bình thường ⇒ hai em cùng chạm trong Fight không bị ảnh hưởng.
//   3. Ctrl/⌘ + lăn chuột — cũng là cử chỉ chụm touchpad trên máy tính.
//   4. Ctrl/⌘ + phím + − 0 (cả bàn số) — thầy chốt chặn luôn; muốn to thì
//      dùng nút Zoom của chính AWord.
// ⚠️ Menu zoom trong thanh công cụ trình duyệt thì trang web KHÔNG chặn được.
// =============================================================
(function () {
  var stop = function (e) { if (e.cancelable) e.preventDefault(); };
  var opt = { passive: false };

  ["gesturestart", "gesturechange", "gestureend"].forEach(function (t) {
    document.addEventListener(t, stop, opt);
  });

  document.addEventListener("touchmove", function (e) {
    if (e.touches && e.touches.length > 1) stop(e);
  }, opt);

  window.addEventListener("wheel", function (e) {
    if (e.ctrlKey || e.metaKey) stop(e);
  }, opt);

  var ZOOM_KEYS = { "+": 1, "=": 1, "-": 1, "_": 1, "0": 1 };
  var ZOOM_CODES = { NumpadAdd: 1, NumpadSubtract: 1, Numpad0: 1, Equal: 1, Minus: 1, Digit0: 1 };
  window.addEventListener("keydown", function (e) {
    if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
    if (ZOOM_KEYS[e.key] || ZOOM_CODES[e.code]) stop(e);
  }, true);
})();
