// =============================================================
// core/time-limit.js — ⭐⭐ TIME LIMIT DÙNG CHUNG (Đợt 494, thầy 08/10/2026)
//
// Đồng hồ MỖI CÂU vốn là của riêng Quiz (Đợt 363/364), nay tách ra đây để
// Quiz · Type the answer · Unjumble · Find the gap · Anagram cùng dùng MỘT bộ:
//   • Options: thanh trượt "Time limit" 1..30s, NẤC CUỐI = ∞ (không giới hạn).
//     Lưu `options.timeLimit` = 1..30; 0 / null / undefined = ∞ ⇒ mọi act cũ
//     không có khoá này chơi y như xưa. (Quiz cũ lưu 1..20 — vẫn đọc đúng.)
//   • Trong sân: hàng [số giây "7,45"][thanh xanh→cam→đỏ]; 5 giây cuối tích
//     dồn dập, cao dần.
//   • Đồng hồ kiểu DELTA: mỗi nhịp 50ms cộng `now - last` vào giờ ĐÃ TIÊU của
//     câu đang đứng — CHỈ khi `isBusy()` trả false (em thật sự làm được bài).
//     Menu ☰ mở, câu đang trượt, clip đang đọc, câu đã chấm… ⇒ quãng đó không
//     tính. Quay lại câu chưa làm thì chạy tiếp từ chỗ còn lại.
//   • Hết giờ ⇒ gọi `onTimeUp()` của template — template tự đi ĐÚNG con đường
//     "hết giờ = sai" của nó (Đợt 174: chấm sai, hiện đáp án, mất tim, Points off,
//     Fight báo trọng tài). Hàm đó phải tự chặn lần gọi thừa (câu đã chấm ⇒ bỏ).
//
// ⛔ LUẬT THẦY (08/10/2026): template nào ĐÃ CÓ "Speed" (tốc độ câu) trong
// Options thì KHÔNG thêm Time limit (True or false, Find the match…).
//
// Cách dùng (xem quiz.js làm mẫu):
//   buildExtraOptions: panel.append(timeLimitCell(mkSliderCell, draft));
//   tpl.onPause(p)   : pauseTimeLimits(p);
//   mount            : const tl = createTimeLimit({ seconds: opt.timeLimit, count,
//                        used: kp?.tl, getIndex: () => index, isBusy, onTimeUp });
//                      if (tl.on) đặt tl.row vào sân; tl.start();
//                      sang câu: tl.enterItem();  lưu làm tiếp: tl.used();
//                      cleanup: tl.destroy();
// =============================================================

import { el } from "./utils.js";
import { sound as coreSound } from "./sound.js";

export const TL_MAX_S = 30;

export function normTimeLimit(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.min(TL_MAX_S, Math.max(1, Math.round(n)));
}

// Ô "Time limit" trong Options (lưới chung của engine). Thanh đi 1..31, nấc 31
// hiện "∞" và lưu 0. Tone "blue" = đại lượng thuần (luật 3 màu Đợt 143).
export function timeLimitCell(mkSliderCell, draft, title) {
  const cur = normTimeLimit(draft.timeLimit);
  const tl = mkSliderCell({
    label: "Time limit", min: 1, max: TL_MAX_S + 1, step: 1,
    value: cur == null ? TL_MAX_S + 1 : cur, tone: "blue", offAt: TL_MAX_S + 1,
    fmt: v => (v > TL_MAX_S ? "∞" : v + "s"),
    onInput: v => { draft.timeLimit = v > TL_MAX_S ? 0 : v; }   // 0 stored = unlimited
  });
  tl.cell.title = title || "Seconds to answer each question (∞ = no limit). Out of time = wrong.";
  return tl.cell;
}

// ☰ Menu pause (hợp đồng `tpl.onPause`, core/HUONG DAN CORE.md mục 3). Là SET:
// Fight mount HAI bàn cùng lúc (luật Đợt 351) — mỗi đồng hồ tự vào/ra tập này.
const live = new Set();
export function pauseTimeLimits(paused) {
  live.forEach(c => { try { c.setPaused(!!paused); } catch { /* đã dọn */ } });
}

// Tích 5 giây cuối (Đợt 364). Dấu thời gian cấp MODULE: hai bàn Fight cùng một
// trang tích cùng mốc thì chỉ một tiếng kêu.
const BEEP_FROM_MS = 5000;
let beepStamp = 0;
function tickSound(urgency) {
  const u = Math.max(0, Math.min(1, urgency));
  const f = 880 + 520 * u;
  coreSound.glide({ freq: f, freqEnd: f * 0.9, dur: 55, gain: 0.10 + 0.06 * u, type: "square" });
}

const INERT = Object.freeze({
  on: false, seconds: null, row: null,
  start() {}, stop() {}, paint() {}, enterItem() {}, fitNum() {}, destroy() {},
  used: () => undefined, leftMs: () => Infinity
});

/**
 * @param {object} o
 * @param {*}        o.seconds   options.timeLimit (∞ ⇒ trả về đồng hồ "trơ", `.on === false`)
 * @param {number}   o.count     số câu
 * @param {number[]} [o.used]    ms đã tiêu của từng câu (làm tiếp lượt dở)
 * @param {() => number}  o.getIndex  câu đang đứng
 * @param {() => boolean} o.isBusy    true ⇒ quãng này KHÔNG tính giờ
 * @param {() => void}    o.onTimeUp  hết giờ câu đang đứng
 * @param {string} [o.className]  class thêm cho hàng (bố cục riêng của template)
 */
export function createTimeLimit(o) {
  const seconds = normTimeLimit(o.seconds);
  if (seconds == null) return INERT;
  const totalMs = seconds * 1000;
  const count = Math.max(0, o.count | 0);
  const usedArr = Array.from({ length: count }, (_, i) =>
    (Array.isArray(o.used) ? Math.max(0, Math.min(totalMs, Number(o.used[i]) || 0)) : 0));

  const row = el("div", "aw-tl" + (o.className ? " " + o.className : ""));
  const num = el("span", "aw-tl-num");
  const bar = el("div", "aw-tl-bar");
  const fill = el("div", "aw-tl-fill");
  bar.append(fill);
  // Ô số rộng ĐÚNG bằng số dài nhất của giới hạn này ("88,88" / "8,88") — đo bản
  // nháp ẩn cùng font (Đợt 364: bề rộng cố định + căn phải để lại khoảng trống
  // vô hình bên trái, mắt thấy lệch). Đo lại ở fitNum() vì cỡ chữ theo --aw-u.
  const probe = el("span", "aw-tl-num aw-tl-probe", seconds >= 10 ? "88" : "8");
  probe.append(el("span", "aw-tl-dec", ",88"));
  probe.setAttribute("aria-hidden", "true");
  row.append(num, bar, probe);

  let id = null, last = 0, paused = false, beepAt = Infinity;
  const idx = () => { const i = o.getIndex(); return i >= 0 && i < count ? i : -1; };

  function paint() {
    const i = idx();
    const leftMs = i < 0 ? totalMs : Math.max(0, totalMs - usedArr[i]);
    const pct = (leftMs / totalMs) * 100;
    fill.style.width = pct + "%";
    row.classList.toggle("is-orange", pct <= 50 && pct > 20);
    row.classList.toggle("is-red", pct <= 20);
    // Tính từ ms NGUYÊN, không từ float giây (bẫy `,39` trong HUONG DAN CORE).
    const ms = Math.round(leftMs);
    num.textContent = String(Math.floor(ms / 1000));
    num.append(el("span", "aw-tl-dec", "," + String(Math.floor((ms % 1000) / 10)).padStart(2, "0")));
  }
  // Bề rộng ô số theo bản nháp, ghi bằng `em` (TỈ LỆ với cỡ chữ) chứ không px: đo lúc
  // khung chưa đủ cỡ (Unjumble/Anagram dựng thẻ trước khi --aw-u chốt) thì số px chốt
  // sai và thanh đè lên phần lẻ — tỉ lệ em thì đúng ở MỌI cỡ. Tự đo lại khi font web
  // tải xong (bẫy "đo layout quá sớm"). Template vẫn gọi trong hàm fit của nó.
  function fitNum() {
    const w = probe.offsetWidth, fs = parseFloat(getComputedStyle(probe).fontSize);
    if (w > 0 && fs > 0) num.style.width = (Math.ceil(w * 100 / fs) / 100 + 0.02) + "em";
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => fitNum()).catch(() => {});
  function beep(leftMs) {
    if (leftMs > BEEP_FROM_MS) return;
    const step = leftMs > 1000 ? 500 : 250;
    if (beepAt - leftMs < step) return;          // ∞ − x là ∞ ⇒ lần đầu luôn qua
    beepAt = Math.ceil(leftMs / step) * step;    // mốc lượng tử hoá: hai bàn Fight ra CÙNG mốc
    const now = performance.now();
    if (now - beepStamp < 120) return;
    beepStamp = now;
    tickSound(1 - leftMs / BEEP_FROM_MS);
  }
  function tick() {
    const now = performance.now();
    const dt = now - last;
    last = now;
    const i = idx();
    if (i < 0 || paused) return;
    let busy = true;
    try { busy = !!o.isBusy(); } catch { busy = true; }
    if (busy) return;                             // quãng này không tính, số đứng yên
    usedArr[i] = Math.min(totalMs, usedArr[i] + dt);
    paint();
    if (usedArr[i] >= totalMs) { o.onTimeUp(); return; }
    beep(totalMs - usedArr[i]);
  }

  const ctl = {
    on: true, seconds, row,
    setPaused(p) { paused = p; },
    start() {
      if (id) return;
      last = performance.now();
      paint();
      fitNum();
      id = setInterval(tick, 50);                // 20Hz: số phần trăm không giật (Đợt 176)
    },
    stop() { if (id) clearInterval(id); id = null; },
    paint,
    // Sang câu (kể cả quay lại câu cũ): vẽ ngay số của CÂU NÀY + tích lại từ chỗ còn lại.
    enterItem() { beepAt = Infinity; paint(); },
    fitNum,
    used: () => usedArr.map(x => Math.round(x)),
    leftMs: () => { const i = idx(); return i < 0 ? totalMs : totalMs - usedArr[i]; },
    // Không ticker nào được sống lâu hơn ván của nó (bài học đồng hồ ma Đợt 112/131).
    destroy() { ctl.stop(); live.delete(ctl); }
  };
  live.add(ctl);
  return ctl;
}
