// =============================================================
// NUMBER STEPPER — a compact 2-digit numeric control with ▲/▼ buttons
// AND vertical swipe/drag-to-adjust (like a wheel picker) — used by the
// Options panel's countdown minutes/seconds fields. Reusable anywhere a
// touch-friendly small-range number input helps (e.g. a future "Lives" count).
// =============================================================

import { el } from "./utils.js";

// value: starting number. min/max: inclusive range. onChange(newValue) fires
// on every change (button, swipe, or programmatic set). Returns { el, get, set }.
export function makeNumberStepper(value, min, max, onChange) {
  let current = clamp(value);
  function clamp(v) { return Math.max(min, Math.min(max, v)); }
  function apply(v, fire) {
    current = clamp(Math.round(v));
    valEl.textContent = String(current).padStart(2, "0");
    if (fire) onChange(current);
  }

  const wrap = el("div", "aw-stepper");
  const upBtn = el("button", "aw-stepper-btn", "▲");
  upBtn.type = "button"; upBtn.setAttribute("aria-label", "Increase");
  const valEl = el("div", "aw-stepper-val", String(current).padStart(2, "0"));
  valEl.title = "Drag up or down to change";
  const downBtn = el("button", "aw-stepper-btn", "▼");
  downBtn.type = "button"; downBtn.setAttribute("aria-label", "Decrease");

  upBtn.onclick = () => apply(current + 1, true);
  downBtn.onclick = () => apply(current - 1, true);

  // vertical swipe/drag directly on the number
  const PX_PER_STEP = 10;   // px of vertical drag per +/-1
  let dragging = false, startY = 0, startVal = 0;
  valEl.addEventListener("pointerdown", ev => {
    dragging = true; startY = ev.clientY; startVal = current;
    valEl.setPointerCapture(ev.pointerId);
    valEl.classList.add("is-dragging");
  });
  valEl.addEventListener("pointermove", ev => {
    if (!dragging) return;
    const dy = startY - ev.clientY;   // dragging UP increases the value
    apply(startVal + Math.round(dy / PX_PER_STEP), true);
  });
  const endDrag = () => { dragging = false; valEl.classList.remove("is-dragging"); };
  valEl.addEventListener("pointerup", endDrag);
  valEl.addEventListener("pointercancel", endDrag);

  wrap.append(upBtn, valEl, downBtn);
  return { el: wrap, get: () => current, set: v => apply(v, false) };
}
