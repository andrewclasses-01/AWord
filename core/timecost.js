// =============================================================
// TIME COST — "mỗi giây TRỐNG trôi qua, tổng điểm bị trừ N" (Đợt 139, 13/8/2026)
//
// Teacher's spec (revised the same day, BEFORE any of this shipped — the first
// wording was "every second that passes", which he replaced with): a slider
// (0..100, step 1) in Options; every second the student sits there DOING
// NOTHING takes that many points off, and a red "-N" flies OUT of the score,
// INTO the clock, and vanishes there — with the score visibly counting down to
// its new value at the same time. Any real progress (a letter placed, an answer
// chosen, a new word/question) resets the idle clock, so "tap, 0.9s, tap" never
// costs a thing. The idle bookkeeping itself lives in core/engine.js
// (chargeIdle/noteActivity); this file is only the EFFECT.
//
// WHY THIS LIVES IN CORE (and not in a template, the way Anagram's own
// "+N"/"-N" effects do): the clock, the score chip and the fight scoreboard
// are all core-owned, and the teacher wants this on more templates over time.
// Anagram happens to own a rich fly/pulse toolkit already; Quiz owns NOTHING
// (it just calls ui.setScore) — putting the effect here is what lets Quiz, and
// every template added later, get the whole thing for one line of opt-in.
//
// ⚠️ NO SOUND, on purpose (teacher chose "im lặng hoàn toàn"): a class that
// stalls fires this once a second for as long as the stall lasts. Anagram's
// count-up pulse plays a glide tone
// (see pulseScoreTo) — do NOT copy that here, it would drone through a whole
// 45-minute lesson.
//
// ⚠️ EVERY frame of the count-down goes through the caller's `paint` (which is
// always ui.setScore) — never a direct innerHTML write. That is the documented
// "số đổi mà màu không đổi" trap in core/HUONG DAN CORE.md: the sign colour
// (.is-pos/.is-neg) is painted by ui.setScore itself, so a hand-rolled write
// leaves a negative total sitting there in GREEN.
// =============================================================

import { el } from "./utils.js";

// Total flight is deliberately WELL under 1000ms: a new one starts every
// second, so a longer flight would leave two or three "-20"s in the air at
// once and the screen would read as noise rather than a cost.
const HOLD_MS = 130;      // sits on the score chip first, so the class sees WHERE it came from
const FLIGHT_MS = 600;    // then travels into the clock
const COUNT_MS = 380;     // score counts down while it travels (starts together with the flight)

function centerOf(node) {
  const r = node.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
}

/**
 * One second's worth of time cost: the flying "-N" plus the count-down.
 *
 * @param {Element}  fromEl   where the number flies OUT of — the score chip, or in
 *                            fight mode this team's number on the strip.
 * @param {Element}  toEl     where it flies INTO — the clock (fight: the shared one).
 * @param {Element}  readEl   the element whose text carries the number to count DOWN
 *                            from. ⚠️ In fight mode this must stay the board's own
 *                            (hidden) chip, never the scoreboard: that one also carries
 *                            the teacher's hand points and speed bonuses, so counting
 *                            from it would jump by whatever those add.
 * @param {number}   points   how many points this second costs (> 0).
 * @param {Function} target   () => authoritative new total (the template's own
 *                            scoreNow(), which already subtracts the accumulator).
 *                            Falls back to "shown - points" when absent.
 * @param {Function} paint    v => ui.setScore(v).
 * @param {Function} alive    () => this play is still running (torndown guard).
 * @param {Set}      nodes    live DOM nodes, so a teardown mid-flight can bin them.
 */
export function flyTimeCost({ fromEl, toEl, readEl, points, target, paint, alive, nodes }) {
  if (!alive || !alive()) return;
  const shownEl = readEl || fromEl;
  const match = /(-?\d+)/.exec((shownEl && shownEl.textContent) || "");
  const from = match ? parseInt(match[1], 10) : 0;
  const to = typeof target === "function" ? Number(target()) : from - points;

  // The number itself. Even with no room to fly (a template that hides the
  // clock, a zero-size element) the SCORE must still move — the deduction is
  // the feature, the flight is the explanation of it.
  if (fromEl && toEl) {
    const a = centerOf(fromEl), b = centerOf(toEl);
    if (a.w > 0 && b.w > 0) {
      // Sized off the score's OWN font-size (read live, so it is right at any
      // fit/zoom level and in fight mode, where the strip's digits are much
      // bigger than a single-mode chip's).
      const srcFont = parseFloat(getComputedStyle(fromEl).fontSize) || 22;
      const size = Math.max(26, srcFont * 1.5);
      const node = el("div", "aw-timecost-fly", "-" + points);
      node.style.left = a.x + "px";
      node.style.top = a.y + "px";
      node.style.fontSize = size + "px";
      document.body.append(node);
      nodes?.add(node);

      const dx = b.x - a.x, dy = b.y - a.y;
      // Shrink to roughly the clock's own digit size on arrival, same rule the
      // template fly effects use (end scale = destination font / start font).
      const dstFont = parseFloat(getComputedStyle(toEl).fontSize) || size * 0.5;
      const endScale = Math.max(0.12, Math.min(1, dstFont / size));
      const total = HOLD_MS + FLIGHT_MS;
      const holdFrac = HOLD_MS / total;
      const anim = node.animate([
        { transform: "translate(-50%,-50%) scale(.55)", opacity: 0, offset: 0 },
        { transform: "translate(-50%,-50%) scale(1)", opacity: 1, offset: holdFrac * 0.6 },
        { transform: "translate(-50%,-50%) scale(1)", opacity: 1, offset: holdFrac },
        { transform: `translate(calc(-50% + ${dx * 0.55}px), calc(-50% + ${dy * 0.55}px)) scale(${(1 + endScale) / 2})`, opacity: .95, offset: holdFrac + (1 - holdFrac) * 0.55 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(${endScale})`, opacity: 0, offset: 1 }
      ], { duration: total, easing: "cubic-bezier(.3,.5,.35,1)", fill: "forwards" });

      // ⚠️ onfinish can NEVER fire in a hidden/backgrounded tab (documented trap
      // in core/HUONG DAN CORE.md) — the timeout is what actually guarantees
      // these nodes stop piling up, one per second, on a pane nobody is looking at.
      let done = false;
      const settle = () => { if (done) return; done = true; node.remove(); nodes?.delete(node); };
      anim.onfinish = settle;
      setTimeout(settle, total + 150);
    }
  }

  // The count-down itself. Runs alongside the flight (the points are LEAVING
  // the score, so the number must fall as they go, not after they land — the
  // opposite convention to a gain, which only counts up once it arrives).
  if (from === to) { paint(to); return; }
  const start = performance.now();
  const step = now => {
    if (!alive()) return;                    // play was thrown away mid-count
    const t = Math.min(1, (now - start) / COUNT_MS);
    const eased = 1 - Math.pow(1 - t, 3);
    paint(Math.round(from + (to - from) * eased));
    if (t < 1) requestAnimationFrame(step);
    else paint(to);
  };
  requestAnimationFrame(step);
}
