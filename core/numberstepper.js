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
    const was = current;
    current = clamp(Math.round(v / step) * step);
    valEl.textContent = format(current);
    // ⭐ Đợt 198 — a small bump when the number ACTUALLY changes, so a tap is
    // visibly answered. Skipped when the value is already at its limit, or the
    // control would keep flashing under a held finger that is achieving nothing.
    // ⚠️ The class has to come OFF and be forced to reflow before it goes back
    // on, or a second change inside the animation's own 220ms simply does not
    // restart it — the CSS engine sees the same class it already has.
    if (current !== was) {
      valEl.classList.remove("is-bump");
      void valEl.offsetWidth;
      valEl.classList.add("is-bump");
    }
    if (fire) onChange(current);
  }

  // ⭐ Đợt 197 (thầy: "icon -, + của bảng chọn lớp đang lệch và không được đẹp")
  // — GEOMETRY, NOT TYPOGRAPHY. The two used to be the characters "−" (U+2212)
  // and "+", and no amount of centring can make a font's minus and its plus the
  // same optical weight, width or height: they are two different glyphs drawn by
  // a type designer for running text, and side by side at 21px on a projector
  // the difference is exactly what the teacher was looking at.
  // Two SVGs on ONE 24-box, same stroke, same length, same centre, make them a
  // matched pair at every size the panel uses — and they scale with the button
  // instead of with the font (see `.aw-hstep-btn svg` in core/app.css).
  const MINUS = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 12h12"/></svg>`;
  const PLUS = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 12h12"/><path d="M12 6v12"/></svg>`;
  const wrap = el("div", "aw-hstep");
  const downBtn = el("button", "aw-hstep-btn", MINUS);
  downBtn.type = "button"; downBtn.setAttribute("aria-label", "Decrease");
  const valEl = el("div", "aw-hstep-val", format(current));
  valEl.title = "Drag left or right to change";
  const upBtn = el("button", "aw-hstep-btn", PLUS);
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

// -------------------------------------------------------------------------
// TIME stepper — [−] MM : SS [+], where MM and SS are each their own
// tap/swipe zone (Đợt 163, 15/8/2026, teacher's design). ONLY the shared
// Timer option's countdown field uses this — every other seconds field in
// the app (Question time, Round time, Time each team, Time cost's grace...)
// keeps the plain makeHStepper above; splitting minutes/seconds only makes
// sense for a control that actually SHOWS minutes.
//
// Interaction per zone (teacher's spec, refined Đợt 164):
//   · minutes zone: a tap, OR a swipe UP → +1 min; a swipe DOWN → −1 min.
//   · seconds zone: a tap, OR a swipe UP → snaps UP to the next multiple of
//     10 (11 → 20, 20 → 30 — a round value still moves a full 10, no dead
//     zone); a swipe DOWN → snaps DOWN the same way (11 → 10, 20 → 10).
// A tap has no direction, so it reads as "not a down-swipe" → same branch as
// swipe-up. One gesture (pointerdown→pointerup) moves the value by exactly
// one step — this is a wheel-pick gesture, not a continuous drag.
// The flanking [−]/[+] buttons are untouched from makeHStepper: click = ±1s
// flat (no rounding), hold ramps up to `holdMax` per tick, same acceleration
// curve. ⭐ Đợt 164: only the zone whose DIGITS actually changed slides —
// nudging seconds no longer replays the minutes animation, and vice versa.
export function makeTimeStepper(value, min, max, onChange, opts = {}) {
  const holdMax = Math.max(1, opts.holdMax || 15);
  const SWIPE_DOWN_PX = 10;   // how far a downward drag must go to count as "down", not a tap
  // Đợt 143's reduced-motion rule (app.css) only reaches CSS `transition`s; the
  // digit slide runs on WAAPI instead, so it needs its own check to honour the
  // same OS setting.
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const SLIDE_MS = reduceMotion ? 1 : 180;
  let current = clamp(value);
  function clamp(v) { return Math.max(min, Math.min(max, Math.round(v))); }
  function mm() { return Math.floor(current / 60); }
  function ss() { return current % 60; }

  const wrap = el("div", "aw-tstep");
  const downBtn = el("button", "aw-tstep-btn", "−");
  downBtn.type = "button"; downBtn.setAttribute("aria-label", "Decrease");
  const mid = el("div", "aw-tstep-mid");
  const minZone = el("div", "aw-tstep-zone");
  minZone.title = "Tap or swipe up: +1 min · swipe down: -1 min";
  let minDigit = el("span", "aw-tstep-digit", String(mm()).padStart(2, "0"));
  minZone.append(minDigit);
  const colon = el("span", "aw-tstep-colon", ":");
  const secZone = el("div", "aw-tstep-zone");
  secZone.title = "Tap or swipe up: round up to next :10 · swipe down: round down to previous :10";
  let secDigit = el("span", "aw-tstep-digit", String(ss()).padStart(2, "0"));
  secZone.append(secDigit);
  mid.append(minZone, colon, secZone);
  const upBtn = el("button", "aw-tstep-btn", "+");
  upBtn.type = "button"; upBtn.setAttribute("aria-label", "Increase");

  // Slide the OLD digit out and the NEW one in, in the direction of change —
  // the "odometer wipe". `dir` is +1 (value went up, digits scroll upward,
  // i.e. old leaves toward the top) or -1 (value went down, old leaves toward
  // the bottom). Runs on WAAPI so it never fights layout mid-drag.
  //
  // ⚠️ `onfinish` alone is not enough to trust: measured while building this,
  // a WAAPI animation's `finish` event can simply never fire while the
  // document is hidden/backgrounded (tab switched away, minimized) mid-slide
  // — the animation itself still completes (fill:"forwards" holds correctly),
  // but the cleanup callback that removes the OLD span is skipped, so a stale
  // digit is left stacked underneath forever. A `setTimeout` safety net
  // guarantees the removal runs regardless of whether the event ever lands;
  // `cleaned` stops it from double-firing on top of a normal `onfinish`.
  function slideZone(zoneEl, digitEl, text, dir) {
    const fresh = el("span", "aw-tstep-digit", text);
    fresh.style.transform = `translateY(${dir > 0 ? 100 : -100}%)`;
    zoneEl.append(fresh);
    let cleaned = false;
    const cleanup = () => { if (cleaned) return; cleaned = true; digitEl.remove(); };
    const outAnim = digitEl.animate(
      [{ transform: "translateY(0%)" }, { transform: `translateY(${dir > 0 ? -100 : 100}%)` }],
      { duration: SLIDE_MS, easing: "cubic-bezier(.22,.9,.3,1)", fill: "forwards" }
    );
    const inAnim = fresh.animate(
      [{ transform: `translateY(${dir > 0 ? 100 : -100}%)` }, { transform: "translateY(0%)" }],
      { duration: SLIDE_MS, easing: "cubic-bezier(.22,.9,.3,1)", fill: "forwards" }
    );
    outAnim.onfinish = cleanup;
    outAnim.oncancel = cleanup;
    inAnim.onfinish = () => fresh.style.transform = "";
    setTimeout(cleanup, SLIDE_MS + 300);
    return fresh;
  }

  // Đợt 164 (teacher, 15/8/2026): "tăng/giảm cái nào thì trượt cái đó thôi" —
  // slide ONLY the zone whose DISPLAYED digits actually changed, not both.
  // A flanking ±1s button crossing a minute boundary (e.g. 1:00 → 0:59)
  // legitimately changes both, so this compares old vs new rather than
  // hard-coding "the zone that was touched".
  function applyDelta(delta, dir, fire) {
    const next = clamp(current + delta);
    if (next === current) return;   // at the min/max edge — nothing to animate
    const oldMM = mm(), oldSS = ss();
    current = next;
    const newMM = mm(), newSS = ss();
    if (newMM !== oldMM) minDigit = slideZone(minZone, minDigit, String(newMM).padStart(2, "0"), dir);
    if (newSS !== oldSS) secDigit = slideZone(secZone, secDigit, String(newSS).padStart(2, "0"), dir);
    if (fire) onChange(current);
  }

  // Đợt 164: the SECONDS zone no longer moves by a flat ±10 — it snaps to the
  // nearest ROUND multiple of 10 in the gesture's direction (teacher: "số giây
  // đang là 11, bấm 1 cái sẽ thành 20 chứ không phải 21"). A value already ON
  // a multiple of 10 still moves a full 10 (no dead zone): 20 → 30 going up,
  // 20 → 10 going down.
  function secondsSnapDelta(dir) {
    const s = ss();
    const target = dir > 0 ? (Math.floor(s / 10) + 1) * 10 : (Math.ceil(s / 10) - 1) * 10;
    return target - s;
  }

  // MINUTE / SECOND zones: one pointerdown→pointerup gesture = one step.
  // "not a clear downward drag" (a tap, a swipe up, or noise) counts as +1;
  // only a real downward drag counts as −1. See header comment for why.
  function zoneGesture(zoneEl, deltaFor) {
    let startY = 0, active = false;
    zoneEl.addEventListener("pointerdown", ev => {
      active = true; startY = ev.clientY;
      try { zoneEl.setPointerCapture(ev.pointerId); } catch {}
      zoneEl.classList.add("is-active");
    });
    zoneEl.addEventListener("pointerup", ev => {
      if (!active) return;
      active = false;
      zoneEl.classList.remove("is-active");
      const dy = ev.clientY - startY;   // positive = dragged DOWN
      const dir = dy > SWIPE_DOWN_PX ? -1 : +1;
      applyDelta(deltaFor(dir), dir, true);
    });
    zoneEl.addEventListener("pointercancel", () => { active = false; zoneEl.classList.remove("is-active"); });
    zoneEl.addEventListener("keydown", ev => {
      if (ev.key === "ArrowUp" || ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); applyDelta(deltaFor(+1), +1, true); }
      else if (ev.key === "ArrowDown") { ev.preventDefault(); applyDelta(deltaFor(-1), -1, true); }
    });
    zoneEl.tabIndex = 0;
  }
  zoneGesture(minZone, dir => dir * 60);
  zoneGesture(secZone, secondsSnapDelta);

  // flanking buttons: identical shape to makeHStepper's ±1, hold-ramp-to-holdMax.
  // Always a flat ±1 second per tick — no rounding, unaffected by the seconds
  // zone's snap-to-10 above.
  function holdRepeat(btn, dir) {
    let delayT = null, repT = null, tick = 0;
    const stop = () => { clearTimeout(delayT); clearInterval(repT); delayT = repT = null; tick = 0; };
    btn.addEventListener("pointerdown", ev => {
      ev.preventDefault();
      try { btn.setPointerCapture(ev.pointerId); } catch {}
      applyDelta(dir, dir, true);
      delayT = setTimeout(() => {
        repT = setInterval(() => {
          tick++;
          const mult = tick > 22 ? holdMax : tick > 10 ? Math.max(1, Math.ceil(holdMax / 2)) : 1;
          applyDelta(dir * mult, dir, true);
        }, 55);
      }, 320);
    });
    btn.addEventListener("pointerup", stop);
    btn.addEventListener("pointerleave", stop);
    btn.addEventListener("pointercancel", stop);
    btn.addEventListener("keydown", ev => {
      if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); applyDelta(dir, dir, true); }
    });
  }
  holdRepeat(downBtn, -1);
  holdRepeat(upBtn, +1);

  wrap.append(downBtn, mid, upBtn);
  return {
    el: wrap,
    get: () => current,
    set: v => { current = clamp(v); minDigit.textContent = String(mm()).padStart(2, "0"); secDigit.textContent = String(ss()).padStart(2, "0"); }
  };
}
