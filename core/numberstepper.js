// =============================================================
// NUMBER STEPPER — a compact 2-digit numeric control with ▲/▼ buttons
// AND vertical swipe/drag-to-adjust (like a wheel picker) — used by the
// Options panel's countdown minutes/seconds fields. Reusable anywhere a
// touch-friendly small-range number input helps (e.g. a future "Lives" count).
//
// TWO SHAPES, same interaction (Đợt 140):
//   makeNumberStepper — the original ▲/▼ TALL one (69px). Still used by any
//                       template that builds its own fields.
//   makeHStepper      — [−][value][+] on ONE line (30px). The Options panel
//                       redesign uses this: the tall shape was measured at
//                       69px inside a 12px row, which is where two of the
//                       panel's empty bands came from.
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

  // Press-and-hold to run the number up/down smoothly and continuously (tap =
  // one step). A short delay before the repeat kicks in keeps single taps clean,
  // then it accelerates a little so long holds cover the range quickly.
  function holdRepeat(btn, dir) {
    let delayT = null, repT = null, tick = 0;
    const stop = () => { clearTimeout(delayT); clearInterval(repT); delayT = repT = null; tick = 0; };
    btn.addEventListener("pointerdown", ev => {
      ev.preventDefault();
      try { btn.setPointerCapture(ev.pointerId); } catch {}
      apply(current + dir, true);                        // immediate first step
      delayT = setTimeout(() => {
        repT = setInterval(() => {
          tick++;
          const step = tick > 22 ? 3 : tick > 10 ? 2 : 1;   // gentle acceleration
          apply(current + dir * step, true);
        }, 55);
      }, 320);
    });
    btn.addEventListener("pointerup", stop);
    btn.addEventListener("pointerleave", stop);
    btn.addEventListener("pointercancel", stop);
    // keyboard accessibility (pointer events don't fire for Enter/Space)
    btn.addEventListener("keydown", ev => {
      if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); apply(current + dir, true); }
    });
  }
  holdRepeat(upBtn, +1);
  holdRepeat(downBtn, -1);

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

// -------------------------------------------------------------------------
// HORIZONTAL stepper — [−][value][+] on one 30px line (Đợt 140).
// Same press-and-hold acceleration and drag-to-adjust as the tall one above,
// only the axis and the DOM order differ. Extra options over the tall shape:
//   step   — how much one press moves (the countdown uses 5 seconds)
//   format — how the number is PRINTED (the countdown prints 125 as "2:05");
//            the value itself always stays a plain number.
// Returns { el, get, set } — the same handle, so callers are interchangeable.
// -------------------------------------------------------------------------
export function makeHStepper(value, min, max, onChange, opts = {}) {
  const step = opts.step || 1;
  const format = opts.format || (v => String(v).padStart(2, "0"));
  // Đợt 143 — the countdown's step went 5s -> 1s (teacher: "nấc thời gian
  // countdown chỉnh thành 1 giây"). A single tap must move exactly one second,
  // but the SAME control also has to cross a 5..3599 range, and at 1 step per
  // press-tick that is unusable: measured on the old numbers, going 2:00 -> 5:00
  // took a 2160px drag. So the two COARSE gestures are sized independently of
  // the fine one — the hold ramps to `holdMax` per tick, and the drag covers one
  // step every `dragPxPerStep` pixels. Callers that don't pass them get exactly
  // the old behaviour (max ×3 on hold, 12px per step).
  const holdMax = Math.max(1, opts.holdMax || 3);
  const PX_PER_STEP = Math.max(1, opts.dragPxPerStep || 12);
  let current = clamp(value);
  function clamp(v) { return Math.max(min, Math.min(max, v)); }
  function apply(v, fire) {
    // Snap to the step GRID rather than to "current ± step", so a value that
    // arrived off-grid (an old act saved with timerTotalSeconds: 137) tidies
    // itself up on the first press instead of staying off-grid forever.
    current = clamp(Math.round(v / step) * step);
    valEl.textContent = format(current);
    if (fire) onChange(current);
  }

  const wrap = el("div", "aw-hstep");
  const downBtn = el("button", "aw-hstep-btn", "−");
  downBtn.type = "button"; downBtn.setAttribute("aria-label", "Decrease");
  const valEl = el("div", "aw-hstep-val", format(current));
  valEl.title = "Drag left or right to change";
  const upBtn = el("button", "aw-hstep-btn", "+");
  upBtn.type = "button"; upBtn.setAttribute("aria-label", "Increase");

  function holdRepeat(btn, dir) {
    let delayT = null, repT = null, tick = 0;
    const stop = () => { clearTimeout(delayT); clearInterval(repT); delayT = repT = null; tick = 0; };
    btn.addEventListener("pointerdown", ev => {
      ev.preventDefault();
      try { btn.setPointerCapture(ev.pointerId); } catch {}
      apply(current + dir * step, true);
      delayT = setTimeout(() => {
        repT = setInterval(() => {
          tick++;
          // same three-stage ramp as before, but the top of it is now the
          // caller's `holdMax` instead of a hard-coded 3
          const mult = tick > 22 ? holdMax : tick > 10 ? Math.max(1, Math.ceil(holdMax / 2)) : 1;
          apply(current + dir * step * mult, true);
        }, 55);
      }, 320);
    });
    btn.addEventListener("pointerup", stop);
    btn.addEventListener("pointerleave", stop);
    btn.addEventListener("pointercancel", stop);
    btn.addEventListener("keydown", ev => {
      if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); apply(current + dir * step, true); }
    });
  }
  holdRepeat(downBtn, -1);
  holdRepeat(upBtn, +1);

  // drag straight on the number — HORIZONTAL here (right = up), matching the
  // control's own axis so the gesture reads the same way it looks.
  let dragging = false, startX = 0, startVal = 0;
  valEl.addEventListener("pointerdown", ev => {
    dragging = true; startX = ev.clientX; startVal = current;
    try { valEl.setPointerCapture(ev.pointerId); } catch {}
    valEl.classList.add("is-dragging");
  });
  valEl.addEventListener("pointermove", ev => {
    if (!dragging) return;
    apply(startVal + Math.round((ev.clientX - startX) / PX_PER_STEP) * step, true);
  });
  const endDrag = () => { dragging = false; valEl.classList.remove("is-dragging"); };
  valEl.addEventListener("pointerup", endDrag);
  valEl.addEventListener("pointercancel", endDrag);

  wrap.append(downBtn, valEl, upBtn);
  return { el: wrap, get: () => current, set: v => apply(v, false) };
}
