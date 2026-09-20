// =============================================================
// FIND THE GAP — a TWO-THUMB slider cell for the Options panel (Đợt 365,
// thầy 20/9/2026: "thanh MIN GAPS đổi thành GAPS và có 2 điểm kéo trên thanh
// để kéo số min và max; 2 điểm này có thể cùng 1 chỗ để thể hiện 1 số chính
// xác").
//
// core/options-panel.js deliberately has ONE slider builder (mkSliderCell, a
// native <input type=range>) and a native range cannot carry two thumbs, so
// this is the template's own control, drawn to the same drawing: 6px neutral
// track, the coloured part between the thumbs, 16px thumbs with a 2px white
// ring (20px in all), the value chip on the right (.aw-optc-chip). It lives
// inside a plain mkCell() so the panel's grid, label and compact mode treat it
// like every other cell. ⛔ core/ is not touched.
//
// GESTURES — the same rules as core's slider (Đợt 213/216), extended to two
// thumbs:
//   • grab a thumb and drag: that thumb moves; the two never cross (dragging
//     one into the other parks them together = one exact number);
//   • both thumbs on one spot: the FIRST movement of the drag says which one
//     you took — right = the upper one, left = the lower one;
//   • tap left of the lower thumb = lower −1; right of the upper = upper +1;
//     between them = the NEARER thumb takes one notch towards the finger
//     (a tap never jumps a thumb to the finger);
//   • keyboard: focus a thumb, ← → move it one notch.
//
// mkRangeCell({ mkCell, label, sub, min, max, lo, hi, tone, onInput })
//   -> { cell, set(lo, hi) }   onInput(lo, hi) fires on every change.
// =============================================================

import { el } from "../../core/utils.js";

const THUMB = 20;         // 16px + a 2px ring each side — core's thumb (see app.css)
const TAP_SLOP_PX = 6;    // more than this and the finger was dragging, not tapping

export function mkRangeCell({ mkCell, label, sub, min, max, lo, hi, tone = "blue", onInput }) {
  const c = mkCell({ label, sub });
  c.cell.dataset.awRank = "1";   // blue = a setting, not a resource/penalty (core's rankOfTone)
  const wrap = el("div", "aw-ftg-range is-" + tone);
  const track = el("div", "aw-ftg-range-track");
  const fill = el("div", "aw-ftg-range-fill");
  const thumbs = [el("div", "aw-ftg-range-thumb is-lo"), el("div", "aw-ftg-range-thumb is-hi")];
  thumbs.forEach((t, i) => { t.tabIndex = 0; t.setAttribute("role", "slider"); t.setAttribute("aria-label", i ? "Maximum" : "Minimum"); });
  wrap.append(track, fill, thumbs[0], thumbs[1]);
  const chip = el("span", "aw-optc-chip is-" + tone);
  c.ctl.append(wrap, chip);

  const clamp = v => Math.max(min, Math.min(max, Math.round(Number(v) || 0)));
  let vLo = clamp(lo), vHi = clamp(hi);
  if (vHi < vLo) vHi = vLo;
  const span = Math.max(1, max - min);
  const frac = v => (v - min) / span;

  function paint() {
    wrap.style.setProperty("--lo", frac(vLo).toFixed(4));
    wrap.style.setProperty("--hi", frac(vHi).toFixed(4));
    thumbs[0].style.setProperty("--f", frac(vLo).toFixed(4));
    thumbs[1].style.setProperty("--f", frac(vHi).toFixed(4));
    // the upper thumb is drawn on top when they coincide, so a grab lands on it
    // — but the FIRST MOVE still decides which one goes (see pointermove)
    thumbs.forEach((t, i) => { t.setAttribute("aria-valuemin", String(min)); t.setAttribute("aria-valuemax", String(max)); t.setAttribute("aria-valuenow", String(i ? vHi : vLo)); });
    chip.textContent = vLo === vHi ? String(vLo) : vLo + "–" + vHi;
  }
  function commit(nLo, nHi) {
    nLo = clamp(nLo); nHi = clamp(nHi);
    if (nHi < nLo) nHi = nLo;
    if (nLo === vLo && nHi === vHi) return;
    vLo = nLo; vHi = nHi;
    paint();
    onInput && onInput(vLo, vHi);
  }
  // a thumb never crosses the other: pushed into it, they park together
  const moveLo = v => commit(Math.min(clamp(v), vHi), vHi);
  const moveHi = v => commit(vLo, Math.max(clamp(v), vLo));
  paint();

  // ----- geometry -----
  function thumbX(v) {
    const r = wrap.getBoundingClientRect();
    return r.left + THUMB / 2 + frac(v) * (r.width - THUMB);
  }
  function valueAt(clientX) {
    const r = wrap.getBoundingClientRect();
    const travel = Math.max(1, r.width - THUMB);
    const f = Math.max(0, Math.min(1, (clientX - r.left - THUMB / 2) / travel));
    return clamp(min + f * span);
  }

  // ----- pointer -----
  let downAt = null, which = null, dragged = false, grabbed = false;
  wrap.addEventListener("pointerdown", ev => {
    if (ev.pointerType === "mouse" && ev.button !== 0) return;
    ev.preventDefault();
    downAt = ev.clientX; dragged = false; which = null; grabbed = false;
    const xLo = thumbX(vLo), xHi = thumbX(vHi);
    const dLo = Math.abs(ev.clientX - xLo), dHi = Math.abs(ev.clientX - xHi);
    const onLo = dLo <= THUMB / 2 + 4, onHi = dHi <= THUMB / 2 + 4;
    if (onLo || onHi) {
      grabbed = true;
      // both under the finger (they coincide, or nearly): wait for the first move
      which = (onLo && onHi && vLo === vHi) ? null : (dLo <= dHi ? 0 : 1);
    }
    try { wrap.setPointerCapture(ev.pointerId); } catch { /* still works without capture */ }
  });
  wrap.addEventListener("pointermove", ev => {
    if (downAt === null) return;
    const dx = ev.clientX - downAt;
    if (!dragged && Math.abs(dx) > TAP_SLOP_PX) dragged = true;
    if (!grabbed || !dragged) return;
    if (which === null) which = dx >= 0 ? 1 : 0;   // coincident thumbs: right = upper, left = lower
    const v = valueAt(ev.clientX);
    if (which === 0) commit(Math.min(v, vHi), vHi); else commit(vLo, Math.max(v, vLo));
  });
  const endPress = ev => {
    if (downAt === null) return;
    const x = ev && ev.clientX != null ? ev.clientX : downAt;
    const wasDrag = dragged, wasGrab = grabbed;
    downAt = null; dragged = false; grabbed = false; which = null;
    if (wasDrag || wasGrab) return;   // a drag already moved it; a grab without movement changes nothing
    // a TAP beside the thumbs = one notch (core's Đợt 213 rule, per thumb)
    const xLo = thumbX(vLo), xHi = thumbX(vHi);
    if (x < xLo) moveLo(vLo - 1);
    else if (x > xHi) moveHi(vHi + 1);
    else if (x - xLo <= xHi - x) moveLo(vLo + 1);
    else moveHi(vHi - 1);
  };
  wrap.addEventListener("pointerup", endPress);
  wrap.addEventListener("pointercancel", () => { downAt = null; dragged = false; grabbed = false; which = null; });
  wrap.addEventListener("lostpointercapture", () => { if (downAt !== null) endPress(null); });

  // ----- keyboard -----
  thumbs.forEach((t, i) => t.addEventListener("keydown", ev => {
    const d = ev.key === "ArrowRight" || ev.key === "ArrowUp" ? 1 : ev.key === "ArrowLeft" || ev.key === "ArrowDown" ? -1 : 0;
    if (!d) return;
    ev.preventDefault();
    if (i === 0) moveLo(vLo + d); else moveHi(vHi + d);
  }));

  return { cell: c.cell, set(nLo, nHi) { commit(nLo, nHi); }, get() { return { lo: vLo, hi: vHi }; } };
}
