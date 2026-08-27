// =============================================================
// core/unit.js — ĐƠN VỊ ĐO CỦA KHUNG (`--aw-u`), THAY CHO `cqw`  (Đợt 273)
//
// ⛔⛔ VÌ SAO CÓ FILE NÀY — LỖI THẬT, ĐO ĐƯỢC, THẦY BÁO TỪ iPAD ĐỜI CŨ:
//   Cả app trước đây đo mọi cỡ chữ/khoảng cách bằng `cqw` (container query),
//   thứ Safari CHỈ hiểu từ bản 16 (9/2022). iPad cũ kẹt ở Safari 15 trở xuống
//   ⇒ trình duyệt VỨT SẠCH các khai báo đó, và vứt theo HAI kiểu khác nhau:
//     · `font-size: 5.2cqw`            -> hỏng lúc PHÂN TÍCH  -> mất luôn
//     · `font-size: calc(5.2cqw * var(--fit))` -> hỏng lúc TÍNH GIÁ TRỊ
//       -> `unset` -> font-size là thuộc tính DI TRUYỀN nên rơi về ~16px
//   Kết quả đúng như ảnh thầy chụp: chữ bé tí (rơi về 16px), thẻ mất sạch đệm
//   (padding về 0), các thẻ dính nhau (gap về 0), 6 thẻ dồn một hàng (flex-basis
//   hỏng), và `margin-top:auto` thì KHÔNG dùng cqw nên vẫn chạy — đẩy cả cụm
//   xuống đáy khung. Không một dòng lỗi nào trong console.
//
// CÁCH VÁ: JS tự đo bề ngang khung rồi đặt biến `--aw-u` = 1% bề ngang đó.
//   `5.2cqw`  ->  `calc(5.2 * var(--aw-u))`
// Biến CSS chạy được từ Safari 9.1, nên bản vá này sống trên MỌI máy.
//
// ⭐ MẤU CHỐT — VÌ SAO CHỈ CẦN ĐẶT BIẾN Ở ĐÚNG 4 CHỖ:
//   Biến CSS DI TRUYỀN xuống con cháu, mà container query cũng phân giải theo
//   "container gần nhất phía trên". Hai cơ chế trùng khớp nhau. Nên chỉ cần đặt
//   `--aw-u` lên đúng những phần tử TRƯỚC ĐÂY mang `container-type`, mọi phần tử
//   bên trong tự lấy đúng con số y như cũ, không phải sửa gì thêm.
//
//   1. `.aw-stage`          — khung act (trước: container-type:size, tên `stage`)
//   2. `.aw-review.is-fs`   — bảng Show answers khi phóng to (CÓ ĐIỀU KIỆN:
//        thường thì KHÔNG đặt, để nó thừa hưởng của `.aw-stage` — đúng y hành vi
//        cũ, xem chú thích dài ở app.css `.aw-review.is-fs`)
//   3. `.aw-opt-switch`     — máng 3 nút trong pop-up Options (Đợt 205)
//   4. `.aw-sd-rec-dbody`   — bảng kết quả chi tiết Showdown (Đợt 207)
//
// ⛔ BỀ NGANG PHẢI LÀ **CONTENT BOX**, KHÔNG PHẢI `offsetWidth`.
//   Container query đo content box. `.aw-review.is-fs` có đệm `2.2vw` mỗi bên —
//   lấy nhầm border-box là mọi cỡ chữ trong bảng đó phình lên vài phần trăm.
//   (Chính app.css đã ghi lại phép đo này: 968px so với 920px.)
//
// ⛔ `--ar-buoc` LÀ THAY THẾ CHO 4 KHỐI `@container stage (aspect-ratio > …)`
//   của Running word. Xem chú thích ở cuối running-word.css.
// =============================================================

/* Bốn phần tử từng mang `container-type`. Thứ tự không quan trọng. */
const CHON = ".aw-stage, .aw-review, .aw-opt-switch, .aw-sd-rec-dbody";

/* Các mốc tỉ lệ của Running word, hẹp -> rộng. Trước đây là 4 khối
   `@container stage (aspect-ratio > …)` xếp chồng, khối khớp CUỐI CÙNG thắng
   ⇒ nay quy về MỘT con số bậc (0 = chưa qua mốc nào, 4 = qua hết).
   ⚠️ Mốc 1 cố ý là 16/10.4 chứ KHÔNG phải 16/10.5 — khung nghỉ đúng bằng
   16:10.5, đo ra thường nhỉnh hơn phân số một chút nên `>` sẽ khớp nhầm ngay ở
   trạng thái nghỉ. Đừng đặt mốc trùng tỉ lệ mà bố cục đang đứng yên ở đó. */
const MOC_AR = [16 / 10.4, 16 / 10, 16 / 9.5, 16 / 9.2];

/* Đọc bề ngang CONTENT BOX. `clientWidth` = content + padding (đã trừ viền),
   nên trừ nốt đệm hai bên là ra đúng con số container query từng dùng. */
function beNgangRuot(el) {
  const cs = getComputedStyle(el);
  const dem = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
  return Math.max(0, el.clientWidth - dem);
}

function datMot(el) {
  /* `.aw-review` chỉ là container khi đang phóng to. Lúc thường phải GỠ HẲN
     biến để nó thừa hưởng `--aw-u` của `.aw-stage` — đặt bừa là bảng Show answers
     đổi cỡ chữ ở màn thường, đúng cái lỗi app.css đã cảnh báo. */
  if (el.classList.contains("aw-review") && !el.classList.contains("is-fs")) {
    el.style.removeProperty("--aw-u");
    return;
  }

  const w = beNgangRuot(el);
  /* Bề ngang 0 (phần tử đang ẩn / chưa gắn vào trang) thì ĐỪNG ghi 0 —
     ghi 0 là mọi cỡ chữ bên trong thành 0, đúng cái bẫy showdown-review.js đã
     ghi lại. Giữ nguyên giá trị cũ, đợi lần đo sau. */
  if (w <= 0) return;
  el.style.setProperty("--aw-u", (w / 100) + "px");

  if (el.classList.contains("aw-stage")) {
    const h = el.clientHeight;
    let buoc = 0;
    if (h > 0) {
      const ar = w / h;
      for (let i = 0; i < MOC_AR.length; i++) if (ar > MOC_AR[i]) buoc = i + 1;
    }
    if (el.dataset.arBuoc !== String(buoc)) el.dataset.arBuoc = String(buoc);
  }
}

let ro = null;
const dangTheoDoi = new WeakSet();

function theoDoi(el) {
  datMot(el);
  if (ro && !dangTheoDoi.has(el)) { ro.observe(el); dangTheoDoi.add(el); }
}

/* Quét lại cả trang — gọi được nhiều lần, không tốn kém (WeakSet chặn trùng). */
export function quetLai(goc) {
  const root = goc || document;
  if (root.querySelectorAll) root.querySelectorAll(CHON).forEach(theoDoi);
  if (root.matches && root.matches(CHON)) theoDoi(root);
}

function khoiDong() {
  if (typeof ResizeObserver === "function" && !ro) {
    ro = new ResizeObserver((ds) => { for (const d of ds) datMot(d.target); });
  }
  quetLai(document);

  /* Khung act được dựng/thay liên tục (đổi template, vào-ra fullscreen, mở
     bảng kết quả…), nên phải nghe thêm chứ không quét một lần rồi thôi.
     `.is-fs` bật/tắt bằng class ⇒ phải nghe CẢ `attributes`, không chỉ con cái. */
  if (typeof MutationObserver === "function") {
    new MutationObserver((ds) => {
      for (const d of ds) {
        if (d.type === "attributes") {
          const t = d.target;
          /* ⭐⭐ CÔNG TẮC TOÀN TRANG (`html.aw-zoomed` lúc bấm phóng to,
             `html.aw-nhung` lúc myLesson nhúng) ĐỔI CỠ KHUNG mà KHÔNG thêm bớt
             phần tử nào và KHÔNG đổi cỡ cửa sổ. Chỉ trông vào ResizeObserver là
             mạo hiểm: nó bám vòng vẽ của trình duyệt, nên ở tab bị dừng vẽ
             (đã đo thật: `requestAnimationFrame` cũng không chạy) thì nó câm
             luôn ⇒ mọi cỡ chữ trong game giữ nguyên số cũ, tức nhỏ hơn khung
             thật cả chục phần trăm khi phóng to. Đo LẠI TAY ở đây cho chắc —
             hai công tắc này hiếm khi đổi nên không tốn gì. */
          if (t === document.documentElement || t === document.body) { quetLai(document); continue; }
          /* ⛔⛔ BẮT BUỘC LỌC LẠI `matches(CHON)`. Bỏ dòng này là mọi phần tử
             ĐỔI CLASS đều bị gán `--aw-u` của CHÍNH NÓ — mà thẻ đáp án Quiz đổi
             class liên tục (đúng/sai/chọn) ⇒ mỗi thẻ tự thành "khung" rộng
             164px ⇒ chữ và đệm trong thẻ tính theo 1,64px thay vì 7,25px ⇒ thẻ
             dẹp lép y hệt cái lỗi iPad mà đợt này đang đi chữa. Đã cắn thật lúc
             chạy thử lần đầu (27/8/2026). */
          if (t.matches && t.matches(CHON)) datMot(t);
          continue;
        }
        for (const n of d.addedNodes) if (n.nodeType === 1) quetLai(n);
      }
    }).observe(document.documentElement, {
      childList: true, subtree: true, attributes: true, attributeFilter: ["class"]
    });
  }

  /* Nghe `resize` **LUÔN LUÔN**, không chỉ khi thiếu ResizeObserver.
     Hai lý do, cả hai đều là ca thật:
       · Safari < 13.1 không có ResizeObserver — đây là đường DUY NHẤT, mà máy
         cũ mới chính là thứ đợt này phải cứu.
       · ResizeObserver bám vòng vẽ; tab bị dừng vẽ là nó câm (đo thật:
         `requestAnimationFrame` cũng không chạy). `resize` đi theo hàng đợi sự
         kiện nên bền hơn.
     Đo lại cả trang chỉ tốn vài phép `getComputedStyle`, và người dùng không
     kéo cỡ cửa sổ liên tục — rẻ hơn nhiều so với rủi ro chữ sai cỡ. */
  window.addEventListener("resize", () => quetLai(document));
  window.addEventListener("orientationchange", () => quetLai(document));
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", khoiDong);
} else {
  khoiDong();
}
