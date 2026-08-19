// =============================================================
// OPTIONS PANEL — the BODY of the Options panel, in one place (Đợt 143).
//
// WHY THIS FILE EXISTS
// Until Đợt 143 this lived inside core/engine.js's buildOptionsPanel(), and
// Settings > "Default activity options" had a SECOND, hand-written, quiz-shaped
// form of its own (core/settings.js: a <select> for Timer, a <select> for
// Letters, three checkboxes — that was ALL of it, for every one of the 17
// games). So the teacher set a default in one UI and met a completely different
// UI, with different controls, when playing. The teacher's ask (Đợt 143 mục 4):
// "đưa toàn bộ các tính năng đầy đủ của options (cả thiết kế) của tất cả các
// act vào trong phần cài đặt". Two UIs cannot stay identical by discipline —
// they drift the moment anyone adds an option. So there is now ONE builder and
// both callers use it:
//
//   core/engine.js   → in-game Options panel  (draft + Apply + persist to act)
//   core/settings.js → Default activity options  (draft + Save to localStorage)
//
// Everything about SHAPE lives here. Everything about what happens to the
// values afterwards stays with the caller — this file never saves anything and
// never touches an activity.
//
// LAYOUT CONTRACT (unchanged from Đợt 140, still the whole point):
//   one option = one CELL of a two-column grid = a label line + a control line.
//   Alignment comes from the grid, never from controls agreeing by accident.
//
// ⚠️ LUẬT (Đợt 140, still in force): a TEMPLATE NEVER TOUCHES THIS PANEL'S DOM.
//   It declares what it wants with a flag and the panel builds it. Two templates
//   used to cut rows out by hand (whack-a-mole, speaking-cards) and both broke
//   silently the moment the markup changed.
//
// TEMPLATE FLAGS THIS FILE READS
//   hideTimerOption   — game runs its own clock (Gameshow's per-question one)
//   hideTimerNone     — game must always be on a clock (Whack-a-mole)
//   hideTimerCountUp  — game already shows elapsed time itself, so the shared
//                        whole-game clock only ever makes sense as a hard
//                        Count down limit, never a redundant Count up
//                        (Đợt 92, 14/8/2026 — Open the box: its own per-box
//                        clock/bar already fills that role, see open-the-box.js)
//   hidePointsOff     — game ships its own Points off control (Anagram, ...)
//   hideShowAnswers   — open-ended game, no answers to show (Speaking cards)
//   shuffleLabel      — game deals CARDS, not questions (Speaking cards)
//   scorable          — false = no score at all, so no penalty options
//   timeCost          — opt in to the Time cost slider
//   usesShuffleAnswers (Đợt 143, OPT-IN) — game really reads options.shuffleAnswers
//   usesAutoSwitch     (Đợt 143, OPT-IN) — game really reads options.autoSwitch
//
// ⭐ WHY THOSE LAST TWO ARE OPT-IN AND NOT hideXxx (Đợt 143)
// The old flags were opt-OUT: the panel showed the control to everyone and a
// template had to remember to hide it. Measured before this đợt, that had
// rotted exactly the way opt-out always rots:
//   · "Auto next question"  — shown in 13 of 17 games, read by NOT ONE of them.
//     Two `autoSwitch` mentions existed in the whole repo and both were the
//     lines building the checkbox.
//   · "Shuffle answers"     — shown in 12, honoured by 3.
//   · "Letters on answers"  — shown in 7, honoured by 2. (Removed outright this
//     đợt, teacher's call — see the note where Points off is built.)
// A forgotten opt-OUT flag ships a control that does nothing and says nothing:
// the teacher ticks it, nothing happens, and there is no way to tell from the
// screen. A forgotten opt-IN flag ships a MISSING control, which the teacher
// sees immediately. Fail towards the visible mistake.
// =============================================================

import { el } from "./utils.js";
import { makeHStepper, makeTimeStepper } from "./numberstepper.js";
import { sound } from "./sound.js";

// ---- POINTS OFF / TIME COST: ONE scale for the whole app (Đợt 143) ----
// Teacher: "đưa về 1 thang chung là 0-100, nấc 1 điểm". Before this, the same
// words "Points off" meant three different scales — 0..5 in the shared control
// (15 games), 0..10 for Anagram's "On submit", 0..100 step 5 for Anagram's
// "Bonus and minus" — so the number on screen told you nothing unless you also
// remembered which game and which mode you were in.
// Acts saved under the OLD scales are converted once, on load, by
// core/options-migrate.js. Never scale a value here: this file draws controls,
// it does not know whether what it was handed has been migrated yet.
export const POINTS_MAX = 100;
export const POINTS_STEP = 1;

// one option = one cell: a label line and a control line, nothing else
export function mkCell({ label, sub, wide } = {}) {
  const cell = el("div", "aw-optc" + (wide ? " aw-optc-wide" : ""));
  const lab = el("div", "aw-optc-lab", label || "");
  if (sub) lab.append(el("span", "aw-optc-sub", sub));
  const ctl = el("div", "aw-optc-ctl");
  cell.append(lab, ctl);
  return { cell, lab, ctl };
}

// Segmented control — replaces a row of radios. `choices` = [{value,label,title}]
//
// Đợt 143: the selected state used to be painted straight onto the button
// (white pill appears instantly on the new one, vanishes off the old one). It
// is now a SLIDING THUMB behind the buttons — the same physical idea as the
// Text/Voice switch above it, so the panel has one motion language instead of
// two. `--n` / `--i` (count and active index) are what CSS animates; nothing
// here measures pixels, so it stays correct while the panel is still hidden,
// mid-resize, or scaled by .is-compact-opts.
export function mkSeg(choices, current, onPick) {
  const seg = el("div", "aw-seg");
  seg.style.setProperty("--n", String(choices.length));
  const startIdx = Math.max(0, choices.findIndex(c => c.value === current));
  seg.style.setProperty("--i", String(startIdx));
  seg.append(el("div", "aw-seg-thumb"));
  const btns = choices.map((c, i) => {
    const b = el("button", "aw-seg-btn" + (i === startIdx ? " is-on" : ""), c.label);
    b.type = "button";
    if (c.title) b.title = c.title;
    b.onclick = () => {
      if (b.classList.contains("is-on")) return;
      btns.forEach(x => x.classList.remove("is-on"));
      b.classList.add("is-on");
      seg.style.setProperty("--i", String(i));
      sound.click();
      onPick(c.value);
    };
    return b;
  });
  seg.append(...btns);
  return seg;
}

// Slider + value chip. `offAt` = the value that means "switched off" (its chip
// greys out instead of shouting in red). `fmt` prints the number.
export function mkSliderCell({ label, sub, min, max, step, value, tone, fmt, offAt, onInput, wide }) {
  const c = mkCell({ label, sub, wide });
  // Number, not `v | 0`: Speaking's "stars to pass" moves in 0.5 steps and a
  // bitwise clamp would silently floor every half star away.
  const clamp = v => Math.max(min, Math.min(max, Number(v)));
  const cur = clamp(Number(value) || 0);
  const s = el("input", "aw-optc-slider" + (tone ? " is-" + tone : ""));
  s.type = "range"; s.min = String(min); s.max = String(max); s.step = String(step || 1);
  s.value = String(cur);
  const print = v => (fmt ? fmt(v) : String(v));
  const chip = el("span", "aw-optc-chip" + (tone ? " is-" + tone : ""), print(cur));
  const paint = v => {
    chip.textContent = print(v);
    chip.classList.toggle("is-off", offAt != null && v === offAt);
    // Đợt 143b — how much of the bar is coloured in. The browser used to draw
    // this itself from `accent-color`, but Chrome DERIVES the unfilled track's
    // colour from the accent by a rule of its own: measured on the real panel,
    // red gave a light grey track while amber and green gave a near-BLACK one.
    // The bar is painted in app.css now, and this is the one number it needs.
    // Guard the divide: a slider whose min equals its max (a range that happens
    // to have one legal value) would otherwise set the fill to NaN% and the bar
    // would lose its colour entirely.
    const span = max - min;
    s.style.setProperty("--aw-slider-fill",
      (span > 0 ? Math.max(0, Math.min(100, ((v - min) / span) * 100)) : 0) + "%");
  };
  paint(cur);
  s.oninput = () => { const v = clamp(s.value); paint(v); onInput(v); };

  // ⭐⭐ Đợt 188 (teacher, 18/8/2026) — TAP THE TRACK = ONE NOTCH, DOUBLE TAP = ONE
  // NOTCH BACK. The browser's own behaviour is "press anywhere and the thumb JUMPS
  // to that point", which on an 86" touch screen means a stray brush sets a 0..100
  // slider to whatever the finger landed on. The teacher's rule:
  //   "tăng giảm thông thường thì trỏ vào điểm kéo như bình thường. Còn 1 chạm thì
  //    tăng 1 nấc, chạm đúp thì giảm 1 nấc. Kịch trên và kịch dưới thì đứng lại.
  //    Muốn kéo nhiều thì chạm vào nút vị trí và kéo như thông thường"
  // This is the same idiom the app's number steppers already use (makeHStepper:
  // tap = ±1, drag = many), so the panel now has ONE way of nudging a number.
  //
  // ⚠️ ONE PLACE ONLY, ON PURPOSE. This is the single slider builder in the whole
  // app (`grep '"range"'` returns exactly this line), so every slider in Options,
  // in Settings and in all 17 templates changes together — there is no second
  // implementation to keep in step, and no template needs a line changed.
  const stepN = Number(step) || 1;
  // How many decimals the step implies — 0.1 must not drift to 0.30000000000000004
  // after a few taps, which is exactly what plain repeated addition does.
  const DEC = (String(stepN).split(".")[1] || "").length;
  const snap = v => Number((clamp(Math.round((v - min) / stepN) * stepN + min)).toFixed(DEC));
  function setValue(v) {
    const nv = snap(v);
    if (String(nv) === s.value) return;      // already at the end stop — "kịch thì đứng lại"
    s.value = String(nv);
    paint(nv);
    onInput(nv);
  }
  // Where the thumb is right now, in page px. 16px wide + a 2px white ring on
  // each side (see .aw-optc-slider::-webkit-slider-thumb), and the browser insets
  // the travel by half a thumb at each end so the thumb never overhangs the track.
  const THUMB = 20;
  function thumbCentreX() {
    const r = s.getBoundingClientRect();
    const span = max - min;
    const frac = span > 0 ? (Number(s.value) - min) / span : 0;
    return r.left + THUMB / 2 + frac * (r.width - THUMB);
  }
  const TAP_SLOP_PX = 6;        // more than this and the finger was dragging, not tapping
  const DOUBLE_TAP_MS = 320;
  let downAt = null, onThumb = false, dragged = false;
  let lastTapMs = 0, beforeTap = null;
  s.addEventListener("pointerdown", ev => {
    if (ev.pointerType === "mouse" && ev.button !== 0) return;
    downAt = ev.clientX;
    dragged = false;
    // A press that lands ON the thumb is a real drag — hand it straight to the
    // browser, untouched, so "chạm vào nút vị trí và kéo như thông thường" keeps
    // working exactly as it always has (including the live oninput above).
    onThumb = Math.abs(ev.clientX - thumbCentreX()) <= THUMB / 2 + 4;
    if (onThumb) return;
    // Anywhere else: kill the default jump-to-position BEFORE it happens. The
    // value must not move at all until pointerup tells us tap or drag.
    ev.preventDefault();
    s.focus({ preventScroll: true });         // preventDefault also swallows focus
  });
  s.addEventListener("pointermove", ev => {
    if (downAt === null || dragged) return;
    if (Math.abs(ev.clientX - downAt) > TAP_SLOP_PX) dragged = true;
  });
  const endPress = ev => {
    if (downAt === null) return;
    const wasThumb = onThumb, wasDrag = dragged;
    downAt = null; onThumb = false; dragged = false;
    // Thumb drag: the browser already moved it. Track drag: deliberately does
    // nothing (the teacher's way to move a lot is to grab the thumb).
    if (wasThumb || wasDrag) return;
    const now = ev.timeStamp || performance.now();
    if (beforeTap !== null && now - lastTapMs <= DOUBLE_TAP_MS) {
      // Second tap of a double: land one notch BELOW where the pair started.
      lastTapMs = 0;
      const back = beforeTap; beforeTap = null;
      setValue(back - stepN);
      return;
    }
    // ⚠️ The first tap moves the number IMMEDIATELY rather than waiting out the
    // double-tap window. Waiting would make every ordinary single tap feel 320ms
    // late — the far more common gesture paying for the rarer one. A double tap
    // therefore reads as +1 then −1, which is also an honest picture of what the
    // two taps did.
    beforeTap = Number(s.value);
    lastTapMs = now;
    setValue(beforeTap + stepN);
  };
  s.addEventListener("pointerup", endPress);
  s.addEventListener("pointercancel", () => { downAt = null; onThumb = false; dragged = false; });

  c.ctl.append(s, chip);
  return { ...c, slider: s, chip, paint };
}

// Đợt 140 — same contract (returns an element, caller decides where it goes),
// new markup: the native box is kept in the DOM for keyboard and :checked but
// drawn by CSS instead, so every checkbox in every template matches the rest of
// the panel without any template being touched.
// NEVER display:none the input — that drops it out of the tab order.
export function mkCheck(checked, label, onChange) {
  const wrap = el("label", "aw-check");
  const c = el("input", "aw-check-in"); c.type = "checkbox"; c.checked = checked;
  c.onchange = () => onChange(c.checked);
  // the text is its own element (not a bare text node) so it can ellipsis
  // instead of widening its column — the block auto-fits 2 or 3 columns
  wrap.append(c, el("span", "aw-check-box"), el("span", "aw-check-t", label));
  return wrap;
}

// Shared radio-choice builder still handed to templates via buildExtraOptions.
// Nothing in the app builds radios any more (they all became segmented controls
// in Đợt 140) — it stays exported so a template that still calls it keeps
// working rather than throwing.
export function mkRadioChoice(name, value, label, checked, onChange) {
  const wrap = el("label", "aw-opt-choice");
  const r = el("input"); r.type = "radio"; r.name = name; r.value = value;
  r.checked = checked;
  r.onchange = () => onChange(value);
  wrap.append(r, document.createTextNode(label));
  return wrap;
}

/**
 * Build the whole body of an Options panel into `host`.
 *
 * @param {Element} host      where the content goes (the panel, or the Settings dialog body)
 * @param {object}  tpl       the template object (its flags + buildExtraOptions)
 * @param {object}  draft     the options object every control MUTATES IN PLACE.
 *                            The caller owns what happens to it afterwards.
 * @param {object|null} contentSwitch  `{ shown: "text"|"voice" }` to show the
 *                            Text/Voice switch, or null to leave it out. The
 *                            engine passes null for an act with no spoken clips;
 *                            Settings always shows it (it is a default like any
 *                            other). ⚠️ Not writing draft.contentMode until the
 *                            teacher actually picks keeps the per-item AUTO
 *                            behaviour of old acts byte-for-byte — so this only
 *                            says which button to LIGHT UP.
 * @param {object|null} fight the running match, if the panel was opened mid-fight
 * @returns {{grid: Element}}
 */
/**
 * ⭐ Đợt 149 — `switchHost` / `renderSwitches`.
 * The Content rows (PRACTICE|HOMEWORK, TEXT|VOICE + clue sets) must NOT be
 * inside the part that gets rebuilt when the teacher picks a different view:
 * measured, they were, so the very button under their finger faded out and came
 * back as a new element with its thumb reset — "rất giật". They now live in
 * their own host that is built ONCE and stays put, while only the grid below is
 * swapped. Settings passes neither and keeps building everything into `host`.
 * @param {Element|null} switchHost  where the Content rows go (null = `host`)
 * @param {boolean} renderSwitches   false on a re-render: the rows already exist
 * @param {object|null} selectors    stable object the Content rows write their
 *                                   choice into. It has to be separate from
 *                                   `draft`, because a re-render hands the
 *                                   panel a NEW draft while these rows — which
 *                                   are never rebuilt — still hold the old one.
 */
export function buildOptionsBody(host, {
  tpl, draft, contentSwitch = null, contentSetSwitch = null, fight = null,
  onViewChange = null, switchHost = null, renderSwitches = true, selectors = null,
  showdown = false
}) {
  const swHost = switchHost || host;
  const sel = selectors || draft;   // Settings has no separate selector state
  const grid = el("div", "aw-opt-grid");
  // Every loose checkbox in the panel — this file's AND (via addCheck) the
  // template's — collects HERE and renders as one block near the bottom. The
  // pre-Đợt-140 panel gave four single-checkbox groups their own uppercase
  // heading; this is what removes them.
  const checksBox = el("div", "aw-checks");
  const checksHost = el("div", "aw-optc aw-optc-wide");
  checksHost.append(checksBox);

  // add a checkbox to the shared block at the bottom (panel + templates)
  function addCheck(label, checked, onChange, opts = {}) {
    const wrap = mkCheck(checked, label, onChange);
    if (opts.title) wrap.title = opts.title;
    checksBox.append(wrap);
    return wrap;
  }

  // TIME COST cell (Đợt 139) — declared up here, before buildExtraOptions()
  // runs, because a template may CLAIM it (place it itself). `let` in a closure
  // read by a function called earlier in the same body is exactly the TDZ trap
  // that silently broke startFight() in Đợt 134 — so both live at the very top.
  let timeCostUsed = false;
  const buildTimeCostCell = () => {
    timeCostUsed = true;
    const clampIdle = v => Math.max(1, Math.min(5, Math.round(v) || 1));
    const cur = Math.max(0, Math.min(POINTS_MAX, (draft.timeCost || 0) | 0));
    // The grace stepper rides on the LABEL line, not the control line. Measured
    // while drafting Đợt 140: standing it beside the slider squeezed that
    // slider to 78px (the others were 176) and pushed its value chip 160px out
    // of the column — i.e. it would have rebuilt the exact raggedness that
    // redesign existed to remove.
    // ⭐ Đợt 187 — the stepper is the whole PERIOD now (see chargeIdlePeriod in
    // core/engine.js), so the caption under the label has to say which period:
    // "per idle 3s", not the old fixed "per idle second". It is repainted every
    // time the stepper moves, which is why `cell` is declared before the stepper
    // gets its callback (the caption node only exists once mkSliderCell has run).
    let idleSecs = clampIdle(draft.timeCostIdle ?? 1);
    const idleCaption = v => (v === 1 ? "per idle second" : "per idle " + v + "s");
    const cell = mkSliderCell({
      label: "Time cost", sub: idleCaption(idleSecs),
      min: 0, max: POINTS_MAX, step: POINTS_STEP, value: cur, offAt: 0,
      fmt: v => (v === 0 ? "Off" : "-" + v),
      onInput: v => { draft.timeCost = v; idleStep.el.classList.toggle("is-dim", v === 0); }
    });
    const idleStep = makeHStepper(idleSecs, 1, 5,
      v => {
        draft.timeCostIdle = v;
        idleSecs = v;
        const capEl = cell.lab.querySelector(".aw-optc-sub");
        if (capEl) capEl.textContent = idleCaption(v);
      }, { format: v => v + "s" });
    idleStep.el.classList.add("is-sm");
    idleStep.el.classList.toggle("is-dim", cur === 0);
    idleStep.el.title = "Seconds of doing nothing between charges (the first one included)";
    cell.lab.append(idleStep.el);
    return cell.cell;
  };

  // Đợt 132 (teacher): the "OPTIONS" heading is gone — for EVERY template, not
  // just acts with a Content switch (below) to replace it — the panel now just
  // starts with its first real group.

  // CONTENT (teacher, 12/8/2026, redesigned Đợt 132) — TOPMOST control. One act
  // now holds the written clue AND the spoken one (the old "ENG1" + "ENG1
  // VOICE" pair merged into a single act), so this is where the class picks
  // which one it plays with today. The meaning of each value, and the
  // untouched-old-act AUTO case, live in ONE place: voiceView() in
  // core/voice-playback.js. Nothing here is template-specific — all 14 games
  // with a listen button obey it.
  // ⭐ Đợt 145 — the row is now TWO HALVES (teacher's design, 14/8/2026):
  //   left   TEXT | VOICE, exactly the switch that has been here since Đợt 123
  //   right  the CLUE SETS of whichever half is active — ENG1/ENG2/VI1/VI2 under
  //          TEXT, ENG1/ENG2 under VOICE — with the other half's list hidden.
  // Each side remembers its OWN choice (`contentVariant` / `voiceVariant`), so
  // flipping TEXT→VOICE→TEXT comes back to the set the teacher was reading.
  // An act with no clue sets (every act in the library before this đợt, and
  // Settings, which has no act at all) gets the bare switch, full width, byte
  // for byte as before.
  // ⭐ Đợt 146 — PRACTICE | HOMEWORK, the TOP row, above Text/Voice (teacher's
  // design, 14/8/2026). It chooses WHICH HALF of a comprehension act is played
  // — QUIZ1 vs QUIZ2, reading act v1 vs v2 — and nothing else. Same visual
  // language as the Text/Voice switch below it so the panel keeps one motion
  // idiom, but positioned from `--i`/`--n` like mkSeg so it is not stuck at two
  // choices for ever.
  // Hidden when the act has fewer than two halves: a lone button that cannot be
  // turned off is the dead control the OPT-IN rule of Đợt 143 exists to prevent.
  if (renderSwitches && contentSetSwitch && (contentSetSwitch.sets || []).length > 1) {
    const sets = contentSetSwitch.sets;
    const labelOf = contentSetSwitch.labelOf || (k => String(k || "").toUpperCase());
    const startIdx = Math.max(0, sets.indexOf(contentSetSwitch.current));
    const sw = el("div", "aw-opt-setswitch");
    sw.style.setProperty("--n", String(sets.length));
    sw.style.setProperty("--i", String(startIdx));
    sw.append(el("div", "aw-opt-switch-thumb"));
    const btns = sets.map((key, i) => {
      const b = el("button", "aw-opt-switch-btn" + (i === startIdx ? " is-active" : ""), labelOf(key));
      b.type = "button";
      b.onclick = () => {
        if (b.classList.contains("is-active")) return;
        btns.forEach(x => x.classList.remove("is-active"));
        b.classList.add("is-active");
        sw.style.setProperty("--i", String(i));
        sel.contentSet = key;
        sound.click();
        // Đợt 147 — each view keeps its OWN options, so the caller reloads the
        // rest of the panel with this half's settings. Called LAST, after the
        // selector is written, because the caller works out the new view key
        // from the draft.
        onViewChange?.();
      };
      return b;
    });
    sw.append(...btns);
    swHost.append(sw);
  }

  // The row itself lives in buildContentSwitchRow() at the bottom of this file.
  // (Split out in Đợt 155 so the Showdown table could show the same control;
  // Đợt 156 took it back out of Showdown at the teacher's request, so this is
  // once again the only caller. Left split: ~90 lines of one self-contained idea.)
  if (renderSwitches && contentSwitch) buildContentSwitchRow(swHost, { contentSwitch, sel, onViewChange });

  host.append(grid);

  // TIMER — a template can hide this whole group (tpl.hideTimerOption) when it
  // runs its OWN timer (e.g. Gameshow's per-QUESTION countdown, which the
  // shared whole-game timer would fight).
  if (!tpl.hideTimerOption) {
    // `tpl.hideTimerNone` (Đợt 140) — a game that must always be on a clock
    // (Whack-a-mole) drops the "None" choice and snaps a legacy act that was
    // saved with timer:"none" onto Count down.
    if (tpl.hideTimerNone && (!draft.timer || draft.timer === "none")) draft.timer = "countDown";
    // `tpl.hideTimerCountUp` (Đợt 92) — mirror image: a game that already
    // shows its own elapsed/remaining time drops "Count up" (it would just be
    // a second, redundant, always-running clock) and snaps a legacy act that
    // was saved with timer:"countUp" onto "None" instead.
    if (tpl.hideTimerCountUp && draft.timer === "countUp") draft.timer = "none";
    const cur = draft.timer ?? (tpl.hideTimerCountUp ? "none" : "countUp");
    const total = Math.max(5, Math.min(3599, draft.timerTotalSeconds ?? 120));
    // Đợt 143 (teacher: "nấc thời gian countdown chỉnh thành 1 giây"). Step 5
    // became step 1 — but a 1-second step over a 5..3599 range would make the
    // control unusable for anything but a nudge, so a HELD button ramps to 15s
    // a tick. Đợt 163 (teacher, 15/8/2026) replaced the single draggable M:SS
    // box with two tap/swipe zones — minutes and seconds — each its own
    // gesture (see makeTimeStepper's header comment); the flanking [−]/[+]
    // buttons still move exactly 1 second per tap, unchanged.
    const stepper = makeTimeStepper(total, 5, 3599, v => { draft.timerTotalSeconds = v; },
      { holdMax: 15 });
    // Đợt 132 (teacher): the countdown field stays VISIBLE at all times —
    // dimmed + non-interactive when another timer mode is picked, never
    // display:none (a field popping in and out used to reflow the row).
    stepper.el.classList.toggle("is-dim", cur !== "countDown");
    stepper.el.title = "Countdown length";
    const c = mkCell({ label: "Timer", wide: true });
    const timerChoices = [
      { value: "none", label: "None" },
      { value: "countUp", label: "Count up" },
      { value: "countDown", label: "Count down" }
    ].filter(x => !(tpl.hideTimerNone && x.value === "none"))
     .filter(x => !(tpl.hideTimerCountUp && x.value === "countUp"));
    c.ctl.append(
      mkSeg(timerChoices, cur,
        v => { draft.timer = v; stepper.el.classList.toggle("is-dim", v !== "countDown"); }),
      stepper.el
    );
    grid.append(c.cell);
  }

  // ⭐⭐ TIME EACH ROUND (Đợt 174, teacher 17/8/2026) — SHOWDOWN ONLY.
  // The whole-game Timer above says how long the GAME has; this one says how
  // long each PUPIL has for the question that fell to them. Same shape on
  // purpose (teacher: "bố trí tương tự thanh Timer, None - Count up - Count
  // down + ô chỉnh thời gian"), so the two read as one family — and the length
  // field is dimmed rather than hidden outside Count down, exactly like the
  // Timer row's, for the same anti-reflow reason (Đợt 132).
  //
  // ⚠️ Built ONLY when the caller says a Showdown is running (`showdown`), not
  // behind a template flag. Which templates can do this is already decided by
  // `tpl.showdownMode`; asking a second time here would be a second list to
  // keep in sync. Settings ▸ Default activity options never passes it: a
  // default for a mode that has to be set up per lesson would be a control the
  // teacher meets in one place and cannot see the effect of in the other.
  //
  // ⚠️ The ENGINE reads `roundTimer`/`roundSeconds` at MOUNT (structural: it
  // decides where the name, the whole-game clock and the bar live), so unlike
  // most options this one only takes effect on the play that Apply restarts.
  if (showdown) {
    const cur = ["countUp", "countDown"].includes(draft.roundTimer) ? draft.roundTimer : "none";
    const secs = Math.max(3, Math.min(599, Math.round(Number(draft.roundSeconds)) || 20));
    const stepper = makeTimeStepper(secs, 3, 599, v => { draft.roundSeconds = v; }, { holdMax: 10 });
    stepper.el.classList.toggle("is-dim", cur !== "countDown");
    stepper.el.title = "How long each pupil has";
    const c = mkCell({ label: "Time each round", sub: "per pupil", wide: true });
    c.ctl.append(
      mkSeg([
        { value: "none", label: "None" },
        { value: "countUp", label: "Count up" },
        { value: "countDown", label: "Count down" }
      ], cur, v => { draft.roundTimer = v; stepper.el.classList.toggle("is-dim", v !== "countDown"); }),
      stepper.el
    );
    grid.append(c.cell);
  }

  // SHUFFLE / AUTO SWITCH — the same KIND of control, so they live together in
  // the checkbox block at the bottom (Đợt 140). Labels shortened to fit two per
  // row; the full sentence survives as the tooltip.
  // `tpl.shuffleLabel` (Đợt 140) — a game whose items aren't "questions"
  // (Speaking cards deals CARDS) renames this one switch.
  addCheck(tpl.shuffleLabel || "Shuffle questions", draft.shuffleQuestions !== false,
    v => draft.shuffleQuestions = v, { title: tpl.shuffleLabel || "Shuffle question order" });
  // ⭐⭐⭐ BALANCE QUESTIONS (Đợt 197, thầy 19/8/2026) — SHOWDOWN ONLY. It lives
  // among the SWITCHES rather than in a cell of its own because it is one yes/no
  // with no setting hanging off it (thầy: "ở khu vực các nút tích").
  // What it does: every child in the CLASS answers the same number of questions,
  // by shortening each board's act to `(questions ÷ biggest team) × this team`.
  // The arithmetic is core/engine.js's `applyBalance`; the Showdown class screen
  // shows the answer in its QUESTIONS box before the teacher picks a team count.
  // ⚠️ Like "Time each round" above, this is STRUCTURAL — the engine trims the
  // act at mount, so it takes effect on the play Apply restarts, not on the one
  // already on screen.
  if (showdown) {
    addCheck("Balance questions", draft.balanceQuestions === true,
      v => draft.balanceQuestions = v,
      { title: "Every pupil in the class answers the same number of questions" });
  }
  // OPT-IN (Đợt 143 — see this file's header for why): only a game that really
  // reads options.shuffleAnswers offers the switch. Quiz, Open the box, Gameshow.
  if (tpl.usesShuffleAnswers) {
    addCheck("Shuffle answers", draft.shuffleAnswers !== false, v => draft.shuffleAnswers = v,
      { title: "Shuffle answer order" });
  }
  // AUTO SWITCH — advance to the next question automatically once the current
  // one has an answer. OFF by default.
  // Đợt 143: the teacher asked to KEEP this option ("tôi vẫn cần tới nó trong
  // một số tình huống trong tương lai"), so rather than delete a control that
  // no template had ever read, it was WIRED UP for real in the four games with
  // a manual next step (Quiz, Anagram, Unjumble, Crossword) and made opt-in.
  if (tpl.usesAutoSwitch) {
    addCheck("Auto next question", draft.autoSwitch === true, v => draft.autoSwitch = v,
      { title: "Move to the next question automatically" });
  }

  // TEMPLATE-SPECIFIC EXTRA OPTIONS (optional hook) — a template appends its own
  // cells here (e.g. Anagram's mode/skip/all-caps). `draft` is the SAME object
  // the caller reads afterwards, so template controls just mutate fields on it.
  if (typeof tpl.buildExtraOptions === "function") {
    // `timeCostCell` (Đợt 139) is null for a template that hasn't opted into
    // Time cost. A template that DOES opt in may either call it — and own where
    // the cell sits — or ignore it, in which case the block further down places
    // the cell itself (that is Quiz's path).
    tpl.buildExtraOptions({
      panel: grid, draft, el, mkCheck, mkRadioChoice,
      mkCell, mkSeg, mkSliderCell, addCheck,
      timeCostCell: tpl.timeCost ? buildTimeCostCell : null
    });
  }

  // FIGHT MODE settings (content of the two boards, who scores a word, speed
  // bonus) go in the SAME panel rather than a second one — only while a match is
  // actually running, since they mean nothing to a single board.
  if (fight && typeof fight.ctl.buildOptions === "function") {
    fight.ctl.buildOptions({ panel: grid, draft, el, mkCheck, mkRadioChoice, mkCell, mkSeg, mkSliderCell, addCheck });
  }

  // ⛔ "LETTERS ON ANSWERS" WAS HERE — REMOVED IN Đợt 143 (teacher: "bỏ hẳn
  // Letters On Answer cho mọi options của các template"). It offered A,B,C vs
  // None on the answer boxes; measured before removal, it was BUILT for 7 games
  // and READ by 2 (Quiz, Open the box), so five of the seven were a dead
  // control. Those two now behave as if it were permanently "None" — the
  // teacher's explicit choice, made with that consequence stated. The saved
  // `lettersOnAnswers` field on old acts is simply ignored from now on; nothing
  // reads it, so nothing needs migrating. Its slot in the grid is why Points off
  // now pairs with Lives instead of with an empty half-row.

  // POINTS OFF — deduct this many points for a WRONG answer (0 = off). Central
  // option (teacher, 3/8/2026): shown for every SCORABLE template EXCEPT those
  // that already ship their OWN points-off control (tpl.hidePointsOff — Anagram,
  // Type the answer, Unjumble, Crossword, Whack-a-mole) and Gameshow
  // (speed-based scoring). A template honours it by reading
  // activity.options.pointsOff in mount() and subtracting on a wrong answer
  // (score may go negative -> shown red, no minus).
  if (tpl.scorable !== false && !tpl.hidePointsOff) {
    grid.append(mkSliderCell({
      label: "Points off", sub: "wrong answer",
      min: 0, max: POINTS_MAX, step: POINTS_STEP, value: draft.pointsOff || 0, offAt: 0,
      fmt: v => (v === 0 ? "Off" : "-" + v),
      onInput: v => { draft.pointsOff = v; }
    }).cell);
  }
  // Only if the template didn't already place the cell itself.
  if (tpl.timeCost && !timeCostUsed) grid.append(buildTimeCostCell());

  // END OF GAME — "Show answers" stays LAST, per the teacher's request
  // (1/8/2026), which it still is: it is the last item of the checkbox block,
  // and that block is the last thing above Apply.
  // `tpl.hideShowAnswers` (Đợt 140): an open-ended game with no answers to show
  // (Speaking cards) opts out.
  if (!tpl.hideShowAnswers) {
    addCheck("Show answers at end", draft.showAnswers !== false, v => draft.showAnswers = v,
      { title: "Show answers when the game ends" });
  }

  // the gathered checkboxes, with a hairline above them so the block reads as
  // "and these switches" rather than as another option cell
  if (checksBox.children.length) {
    grid.append(el("div", "aw-optc-sep"), checksHost);
  }

  return { grid };
}


/**
 * The CONTENT row — TEXT | VOICE | PRONUNCIATION on the left, the clue sets of
 * whichever half is active on the right (Đợt 145's design, extracted here in
 * Đợt 155, third button added in Đợt 205).
 *
 * ⭐⭐ Đợt 205 (19/8/2026, teacher) — PRONUNCIATION MOVED UP TO THE PARENT ROW.
 * It used to be the fifth CHIP under Text (Đợt 190 imported the IPA column as a
 * clue set); it is now a button beside Text and Voice, because it is not "one
 * more written clue to choose from" — it is a different way to play the act, the
 * way Voice is. Picking it makes the three buttons STRETCH across the whole row
 * (there are no sub-sets to show under it); Text or Voice makes them contract
 * again to give the clue-set chips their half back.
 *
 * ⭐ WHAT IS STORED DID NOT CHANGE ONE BYTE, and that is the point.
 * PRONUNCIATION is still `contentMode:"text"` + `contentVariant:"pron"` — the
 * exact pair the fifth chip wrote. So:
 *   • `activeVariant()`, `viewKeyOf()`, `voiceView()`, the voice preload gate,
 *     Anagram's Text-mode rule and convert.js all keep working UNTOUCHED — a
 *     third value of `contentMode` would have had to be taught to six readers,
 *     each of which tests `=== "text"` or `=== "voice"` today;
 *   • acts SAVED BEFORE this đợt with the pron chip picked simply light the new
 *     button up. No migration, nothing to go stale (`core/options-migrate.js`
 *     is not involved);
 *   • `text:pron` was already its own view key, so the per-view options of
 *     Đợt 147 carry over as they are.
 * ⛔ Do NOT "tidy this up" into `contentMode:"pron"`. The gain would be cosmetic
 * and the cost is six readers plus every act already in the library.
 *
 * @param {Element} swHost  where the row is appended
 * @param {object}  contentSwitch  { shown, variants, voiceVariants, labelOf,
 *                  variant, voiceVariant } — exactly what core/engine.js already
 *                  assembles for the Options panel.
 * @param {object}  sel     the STABLE selector object the row writes into
 *                  (`contentMode` / `contentVariant` / `voiceVariant`). Never the
 *                  draft: this row is built once and outlives any re-render, so
 *                  it would otherwise keep writing into a draft that has been
 *                  replaced (Đợt 149).
 * @param {Function|null} onViewChange  called after every pick.
 *
 * ⚠️ Writes nothing until the teacher actually taps. An old act with no
 * `contentMode` keeps its per-item AUTO behaviour byte-for-byte — the row only
 * says which button to LIGHT UP.
 */
export function buildContentSwitchRow(swHost, { contentSwitch, sel, onViewChange = null }) {
  const shown = contentSwitch.shown === "voice" ? "voice" : "text";
  const allVariants = contentSwitch.variants || null;
  // PRONUNCIATION is a PARENT button now, so it must not also stand in the chip
  // row underneath — it would be the same choice offered twice, one of them
  // silently re-lighting the other. `variants` from here on is the TEXT half's
  // chips only; the stored value "pron" is still a perfectly legal
  // `contentVariant` and `activeVariant()` still returns it (it reads
  // `content.variants`, which this does not touch).
  // ⚠️ ...and only when there is something LEFT under Text once `pron` moves
  // out. An act whose ONLY clue set is the transcription would otherwise get a
  // TEXT button standing over an empty list — tapping it could not name a set
  // to play, so it would light up while the game kept showing IPA. The
  // importer cannot build such an act (a vocabulary block is found BY its clue
  // column, so a written set always exists), but a hand-edited one could.
  const hasPron = !!(allVariants && allVariants.includes("pron") && allVariants.some(k => k !== "pron"));
  const variants = hasPron ? allVariants.filter(k => k !== "pron") : allVariants;
  const voiceVariants = contentSwitch.voiceVariants || variants;
  const labelOf = contentSwitch.labelOf || (k => String(k || "").toUpperCase());
  // Which of the three is lit: VOICE wins on contentMode, PRONUNCIATION on the
  // resolved clue set being `pron`, TEXT otherwise.
  let mode = shown === "voice" ? "voice" : (hasPron && contentSwitch.variant === "pron" ? "pron" : "text");
  // The TEXT half never remembers `pron` as "the set I was reading" — coming
  // back from PRONUNCIATION must land on a real written set, not bounce
  // straight back to where it came from.
  const firstText = variants && variants.length ? variants[0] : null;
  let pickedText = (contentSwitch.variant && contentSwitch.variant !== "pron") ? contentSwitch.variant : firstText;
  let pickedVoice = contentSwitch.voiceVariant || (voiceVariants ? voiceVariants[0] : null);

  // `is-3mode` — three mode buttons need more of the row than two do, or the
  // long label is squeezed down to ~8px (measured, Đợt 205). The split lives in
  // app.css; this only says which shape the row is.
  const row = el("div", "aw-opt-content" + (allVariants ? " has-variants" : "") + (hasPron ? " is-3mode" : ""));
  const switchEl = el("div", "aw-opt-switch");
  switchEl.append(el("div", "aw-opt-switch-thumb"));
  const MODES = hasPron
    ? [["text", "Text"], ["voice", "Voice"], ["pron", "Pronunciation"]]
    : [["text", "Text"], ["voice", "Voice"]];
  const modeBtns = new Map();
  MODES.forEach(([key, label]) => {
    const b = el("button", "aw-opt-switch-btn" + (mode === key ? " is-active" : ""), label);
    b.type = "button";
    modeBtns.set(key, b);
    switchEl.append(b);
  });

  const half = el("div", "aw-opt-variants");
  // ⭐ Đợt 150 — ONE seg holding EVERY clue set, built once and never torn
  // down. Đợt 149's version emptied `half` and built a fresh mkSeg on every
  // TEXT↔VOICE flip — 4 buttons replaced by 2 in a single frame, no
  // transition possible (teacher: "việc chuyển qua lại giữa 2 trạng thái này
  // cũng cần hiệu ứng gom vào dãn ra mượt mà"). Now the buttons that don't
  // belong to the active half collapse to zero width (flex-grow 0, see
  // .aw-seg-anim in app.css) while the rest widen to fill the track — the
  // row BREATHES between its two shapes. The thumb's `--n`/`--i` are the
  // VISIBLE count/index, so its width and travel animate on the same curve.
  let seg = null;
  const segBtns = new Map();
  if (variants) {
    const union = [...variants];
    (voiceVariants || []).forEach(k => { if (!union.includes(k)) union.push(k); });
    seg = el("div", "aw-seg aw-seg-anim");
    seg.append(el("div", "aw-seg-thumb"));
    union.forEach(k => {
      const b = el("button", "aw-seg-btn", labelOf(k));
      b.type = "button";
      b.onclick = () => {
        if (b.classList.contains("is-gone") || b.classList.contains("is-on")) return;
        if (mode === "voice") { pickedVoice = k; sel.voiceVariant = k; }
        else { pickedText = k; sel.contentVariant = k; }
        sound.click();
        paintHalf();
        onViewChange?.();   // Đợt 147 — each clue set keeps its own options
      };
      seg.append(b);
      segBtns.set(k, b);
    });
    half.append(seg);
  }
  // The switch's own thumb rides on `--n`/`--i` the way `.aw-seg` does, so it
  // is not welded to exactly two buttons any more (Đợt 205). Before this the
  // travel was a fixed `.is-voice { translateX(100%) }` rule in app.css.
  const paintSwitch = () => {
    switchEl.style.setProperty("--n", String(MODES.length));
    switchEl.style.setProperty("--i", String(Math.max(0, MODES.findIndex(([k]) => k === mode))));
    modeBtns.forEach((b, k) => b.classList.toggle("is-active", k === mode));
  };
  const paintHalf = () => {
    if (!seg) return;
    // PRONUNCIATION has no sub-sets: the IPA transcription is ONE string per
    // word, so under that button there is nothing to choose. Hence the empty
    // list — which is also what makes the row stretch (see below).
    const list = (mode === "voice" ? voiceVariants : mode === "pron" ? [] : variants) || [];
    // One choice is not a choice (the Đợt 143 OPT-IN rule): under 2 sets the
    // whole half fades out instead of showing a lone dead button.
    half.classList.toggle("is-empty", list.length < 2);
    // ⭐ Đợt 205 — and when the half has nothing to say, it gives its width
    // BACK: the row goes to one track and the three mode buttons stretch
    // across it (`.is-wide` animates `grid-template-columns`, app.css).
    // ⚠️ This also fires for an act with exactly ONE written clue set, which
    // used to sit beside a permanently blank half — deliberate: dead space
    // that never fills is the same problem the OPT-IN rule is about.
    row.classList.toggle("is-wide", list.length < 2);
    const picked = mode === "voice" ? pickedVoice : pickedText;
    const current = list.includes(picked) ? picked : list[0];
    seg.style.setProperty("--n", String(Math.max(1, list.length)));
    seg.style.setProperty("--i", String(Math.max(0, list.indexOf(current))));
    segBtns.forEach((b, k) => {
      b.classList.toggle("is-gone", !list.includes(k));
      b.classList.toggle("is-on", k === current);
    });
  };

  const pick = value => {
    // ⭐ PRONUNCIATION IS STILL TEXT MODE — see the header note. The act plays
    // its written `pron` clue set; nothing downstream learns a third mode.
    sel.contentMode = value === "pron" ? "text" : value;
    mode = value;
    paintSwitch();
    // ⚠️ Picking VOICE must also STATE which set it plays. Leaving
    // `voiceVariant` unwritten would let a stored value from another act's
    // shape (or none at all) decide, and the teacher would hear a clue set
    // that isn't the one lit up in front of them.
    if (allVariants) {
      if (value === "voice" && pickedVoice) sel.voiceVariant = pickedVoice;
      if (value === "text" && pickedText) sel.contentVariant = pickedText;
      if (value === "pron") sel.contentVariant = "pron";
    }
    paintHalf();
    sound.click();
    onViewChange?.();   // Đợt 147 — TEXT, VOICE and PRONUNCIATION are separate views
  };
  modeBtns.forEach((b, k) => { b.onclick = () => pick(k); });

  paintSwitch();
  paintHalf();
  row.append(switchEl, half);
  swHost.append(row);
}