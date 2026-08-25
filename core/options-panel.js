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
//   checkOrder        (Đợt 213b) — the order of the switch block, as a list of
//                        switch KEYS. The block is filled by COLUMN, so the list
//                        reads straight off as a layout. See orderChecks().
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
//
// ⭐ Đợt 213 — `noLabel`. Exactly ONE cell in the app uses it: the Timer, which
// thầy asked to strip of its title so it reads as part of the Text/Voice group
// above it rather than as the first of the settings below ("Bỏ title timer đi,
// đưa cụm timer lại gần cụm TEXT-VOICE và coi như chúng là 1 cụm tính năng mặc
// định và không cần title").
// ⚠️ The label ELEMENT is still created and still returned as `.lab` — it is
// simply not put in the cell. Callers that decorate the label line (Time cost
// hangs its grace stepper there) therefore keep working whatever they are
// handed, instead of throwing on a null.
export function mkCell({ label, sub, wide, noLabel } = {}) {
  const cell = el("div", "aw-optc" + (wide ? " aw-optc-wide" : "") + (noLabel ? " aw-optc-nolab" : ""));
  const lab = el("div", "aw-optc-lab", label || "");
  if (sub) lab.append(el("span", "aw-optc-sub", sub));
  const ctl = el("div", "aw-optc-ctl");
  if (noLabel) cell.append(ctl); else cell.append(lab, ctl);
  return { cell, lab, ctl };
}

// ---- WHAT A SLIDER IS FOR, in one word (Đợt 213) --------------------------
// thầy, 20/8/2026: "các thanh mạng/thưởng thì ưu tiên bên trái, các thanh trừ
// điểm thì ưu tiên bên phải".
//
// ⭐⭐ THE ROLE IS READ OFF `tone`, NOT DECLARED A SECOND TIME. Every slider in
// the app already states its role by colour — thầy's own three-colour law
// (Đợt 143, restated 20/8/2026): green = a resource the class still has, amber
// = a reward, red = a punishment, blue = a plain quantity that is neither.
// Asking a template to ALSO pass a `role` would be a second list to keep in step
// with the first, and the day they disagree the panel sorts by one and paints by
// the other. One source, two uses.
// ⛔ So a slider whose COLOUR is wrong now sits in the wrong PLACE too — which
// is exactly why the three mismatched tones were fixed in this same đợt
// (fight.js's Speed bonus + Time delay, speaking.js's Stars to pass).
const ROLE_RANK = { green: 0, amber: 0, blue: 1 };   // anything else (red / no tone) = 2
function rankOfTone(tone) {
  const r = ROLE_RANK[tone];
  return r === undefined ? 2 : r;
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
  // Đợt 213 — what this slider is FOR, so orderSliderCells() below can put
  // resources and rewards to the left and punishments to the right without
  // asking a single template to say anything new. See rankOfTone().
  c.cell.dataset.awRank = String(rankOfTone(tone));
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
  s.oninput = () => {
    // ⭐⭐ Đợt 216 (thầy, 20/8/2026) — THE TOUCH-PANEL LEAK, PLUGGED HERE.
    // "chạm vào vị trí nào thì thanh trượt về ngay chỗ đó chứ không nhảy 1 nấc
    // như khi click chuột". Đợt 213's whole gesture (tap right = +1, tap left =
    // −1) was being bypassed by every finger on the TOMKO panel, and only by
    // fingers — with a mouse it has always worked.
    // ⛔⛔ WHY THE `preventDefault` BELOW WAS NEVER ENOUGH: per the Pointer Events
    // spec, cancelling `pointerdown` suppresses the compatibility MOUSE events
    // and nothing else — a touch's own default action is not cancellable there
    // (that is what `touch-action` and `touchstart` are for). Chromium drives a
    // range input's touch dragging through that other path, so it kept jumping
    // the thumb to the finger. Nobody caught it in three đợt because no build
    // machine here has a touchscreen and a mouse takes the cancellable path.
    // ⭐ SO THE GUARD IS ON THE VALUE, NOT ON THE EVENT. While an off-thumb press
    // is in flight, `guardValue` holds what the slider read when the finger
    // landed, and any move the browser makes by itself is put straight back —
    // synchronously, inside the same event, so no intermediate frame is ever
    // painted and there is nothing to see. It cannot be outflanked by whatever a
    // future engine decides `preventDefault` means, and unlike cancelling
    // `touchstart` it does not take the panel's own scrolling away with it.
    // ⚠️ A TRACK DRAG STILL DOES NOTHING, which is Đợt 213's rule unchanged: the
    // guard simply keeps undoing the native move for as long as the finger is
    // down, and endPress() below declines to add a notch once it has seen a drag.
    if (guardValue !== null) { s.value = guardValue; return; }
    const v = clamp(s.value); paint(v); onInput(v);
  };

  // ⭐⭐ Đợt 213 (thầy, 20/8/2026) — WHICH SIDE OF THE THUMB YOU TAP IS THE SIGN.
  //   "trong các thanh trượt: chạm vào khoảng trống bên phải (nút chưa tới) để
  //    tăng 1 nấc, chạm vào khoảng đã qua (nút đã chạy qua) thì giảm 1 nấc"
  // Tap right of the thumb = +1, tap left of it = −1, grab the thumb and drag =
  // move a lot. The browser's own behaviour — press anywhere and the thumb JUMPS
  // there — is still what is being prevented; that part is Đợt 188's and unchanged.
  //
  // ⛔⛔ THIS REPLACES Đợt 188's DOUBLE TAP, it does not sit beside it (thầy chose
  // "bỏ hẳn" when asked). Đợt 188 read every tap as +1 and used a 320ms double-tap
  // window for −1, which cost two things now gone for good:
  //   · a timer to tune — "chạm chậm quá thành 2 lần +1" was an open ⬜ on thầy's
  //     TOMKO checklist, and it can no longer happen because nothing is timed;
  //   · honesty — a double tap had to show +1 and then −1, because the first tap
  //     could not wait to find out whether a second was coming.
  // Position carries the sign now, so a tap means one thing the instant it lands.
  // ⛔ Do NOT reintroduce a double-tap rule on top of this: on the right-hand side
  // two taps would read +1 then +1, and there is no gesture left for it to mean.
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
  let downAt = null, onThumb = false, dragged = false;
  // ⚠️ WHICH SIDE, MEASURED AT POINTERDOWN — never at pointerup. `setValue` can
  // move the thumb between the two events (a fast repeat tap), and asking again
  // at the end would then compare the finger against a thumb that has already
  // walked past it: hold your finger still on the right and the slider would
  // count up to the finger, then start counting back down. The side is a fact
  // about where the press LANDED, so it is read once, when it lands.
  let downSign = 0;
  // Đợt 216 — the value the slider held when an OFF-THUMB press landed, or null
  // when no such press is in flight. Read by s.oninput above; see its note.
  let guardValue = null;
  s.addEventListener("pointerdown", ev => {
    if (ev.pointerType === "mouse" && ev.button !== 0) return;
    downAt = ev.clientX;
    dragged = false;
    // ONE layout read for both questions below — getBoundingClientRect inside
    // thumbCentreX() forces a reflow, and asking twice per press is asking for
    // two different answers if anything around the panel is mid-transition.
    const dx = ev.clientX - thumbCentreX();
    downSign = dx >= 0 ? +1 : -1;
    // A press that lands ON the thumb is a real drag — hand it straight to the
    // browser, untouched, so "chạm vào nút vị trí và kéo như thông thường" keeps
    // working exactly as it always has (including the live oninput above).
    onThumb = Math.abs(dx) <= THUMB / 2 + 4;
    if (onThumb) { guardValue = null; return; }
    // Anywhere else: kill the default jump-to-position BEFORE it happens. The
    // value must not move at all until pointerup tells us tap or drag.
    // ⚠️ Đợt 216 — `preventDefault` is kept because it is the CLEAN stop on a
    // mouse (no value change happens at all, so nothing has to be undone). It is
    // simply not the whole answer on a touchscreen — `guardValue` is. Removing
    // either one leaves half the input devices behaving differently from the
    // other half, which is exactly the bug this pair closes.
    guardValue = s.value;
    ev.preventDefault();
    s.focus({ preventScroll: true });         // preventDefault also swallows focus
    // ⚠️⚠️ CAPTURE, OR THE GUARD CAN GET STUCK ON. `guardValue` is cleared by
    // pointerup/pointercancel — and without capture neither has to arrive at this
    // element: lift the finger a few pixels off the slider and the events go to
    // whatever is under it instead, leaving the guard latched and the slider dead
    // to every later touch until the panel is rebuilt. Capture makes the whole
    // press come back here whatever it wanders over. `lostpointercapture` is the
    // last-resort release for the cases the browser takes the pointer away.
    try { s.setPointerCapture(ev.pointerId); } catch { /* nothing captured; the handlers below still run */ }
  });
  s.addEventListener("pointermove", ev => {
    if (downAt === null || dragged) return;
    if (Math.abs(ev.clientX - downAt) > TAP_SLOP_PX) dragged = true;
  });
  const endPress = () => {
    if (downAt === null) return;
    const wasThumb = onThumb, wasDrag = dragged, sign = downSign;
    downAt = null; onThumb = false; dragged = false; downSign = 0;
    // Đợt 216 — released BEFORE setValue() below, which writes the new value
    // through paint()/onInput() by hand: leave the guard latched and s.oninput
    // would still be armed to undo whatever the notch just did.
    guardValue = null;
    // Thumb drag: the browser already moved it. Track drag: deliberately does
    // nothing (thầy's way to move a lot is to grab the thumb).
    if (wasThumb || wasDrag) return;
    // One notch, in the direction the finger was standing. At either end stop
    // setValue() is a no-op — "kịch trên và kịch dưới thì đứng lại" (Đợt 188,
    // still in force). Note that at max there is no track LEFT of the thumb to
    // tap for +1 anyway, and at min none to its right for −1, so the gesture and
    // the clamp agree instead of merely not contradicting each other.
    setValue(Number(s.value) + sign * stepN);
  };
  s.addEventListener("pointerup", endPress);
  const abortPress = () => {
    downAt = null; onThumb = false; dragged = false; downSign = 0; guardValue = null;
  };
  s.addEventListener("pointercancel", abortPress);
  s.addEventListener("lostpointercapture", abortPress);

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
  showdown = false,
  // ⭐ Đợt 220 — tổng số câu của act đang chơi: trần cứng của ô số Count (thầy
  // chốt "chặn ô số ở mức tối đa"). Chỉ engine biết con số này; Settings không
  // truyền (nó cũng không truyền `showdown` nên dải không được dựng ở đó).
  sdItemCount = 0,
  // ⭐ Đợt 245 — bỏ ô tích "Show answers at end" cho form BÀI GIAO, nơi nó là
  // một công tắc CHẾT (trang HS chỉ nghe `session.endOptions`). Xem khối chú
  // thích dài ở chỗ ô đó được dựng, cuối hàm này.
  hideEndShowAnswers = false,
  // ⭐⭐ Đợt 250 — WHICH GAME this content is being handed out as. ONLY the Set
  // assignment form passes it; every other caller (the in-game Options panel,
  // Settings, Showdown) leaves it null and gets byte-for-byte the old row.
  // Shape is documented on buildContentSwitchRow at the bottom of this file.
  templatePicker = null
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
  //
  // ⭐ Đợt 213b — `opts.key`. A STABLE name for the switch, independent of the
  // words printed on it, so `tpl.checkOrder` can lay the block out (see
  // orderChecks below) without breaking the day a label is reworded. Renaming
  // "Show answer when wrong" to "Show corrects" in this very đợt is exactly the
  // event an order-by-label list would not have survived — and `shuffleLabel`
  // already renames "Shuffle questions" per template, so labels were never
  // unique names to begin with.
  function addCheck(label, checked, onChange, opts = {}) {
    const wrap = mkCheck(checked, label, onChange);
    if (opts.title) wrap.title = opts.title;
    if (opts.key) wrap.dataset.awCheck = opts.key;
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
  // ⭐ Đợt 213 — IS THERE ANYTHING ABOVE THE DASHED LINE? The line divides the
  // top group ("what this act plays, and for how long") from the settings below,
  // so it must not be drawn when the group is empty — a rule at the very top of
  // the panel with nothing over it reads as a mistake. Counted, not assumed:
  // `contentSwitch` is null for an act with neither clue sets nor clips and in
  // both play modes (see makeContentSwitch in core/engine.js), and the Timer is
  // gone entirely for a template running its own clock (Gameshow).
  // ⚠️ `renderSwitches` is false on a RE-RENDER, when the rows are still on
  // screen — they live in `swHost`, which is built once and never torn down
  // (Đợt 149). So the question is "does this panel HAVE these rows", never "is
  // this pass the one that built them".
  let topGroup = !!contentSwitch || !!(contentSetSwitch && (contentSetSwitch.sets || []).length > 1);
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
  if (renderSwitches && contentSwitch) buildContentSwitchRow(swHost, { contentSwitch, sel, onViewChange, templatePicker });

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
    // ⭐⭐ Đợt 213 (thầy, 20/8/2026) — NO TITLE, AND IT JOINS THE GROUP ABOVE.
    //   "Bỏ title timer đi, đưa cụm timer lại gần cụm TEXT-VOICE và coi như
    //    chúng là 1 cụm tính năng mặc định và không cần title."
    // `aw-opt-top` is what paints it in the group's green (core/app.css); the
    // title line is dropped by `noLabel` (see mkCell). `title` on the cell keeps
    // the word "Timer" reachable on hover now that it is not written anywhere.
    //
    // ⛔⛔ THE TIMER STAYS IN `grid`, i.e. in the part that IS rebuilt — it only
    // LOOKS like it moved up into `swHost`. Moving it there for real would be
    // the obvious reading of thầy's sentence and it would break Đợt 147: every
    // clue set keeps its own Timer (ENG1 on 2 minutes, VI1 on 5), and `swHost`
    // is built once and never rebuilt (Đợt 149), so the panel would go on
    // showing the previous set's clock after every switch — wrong, and silently
    // so. The seam between the two hosts is invisible, so nothing is lost by
    // drawing the group across it.
    const c = mkCell({ wide: true, noLabel: true });
    c.cell.classList.add("aw-opt-top");
    c.cell.title = "Timer";
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
    topGroup = true;
  }

  // ⭐ Đợt 213 — THE DASHED RULE, and everything above it is one group.
  // thầy: "Giữa cụm timer/text-voice và các khu vực bên dưới có 1 dòng kẻ đứt
  // mảnh để phân cách." Dashed, not the solid `.aw-optc-sep` used at the foot of
  // the panel: two identical rules would say "three equal sections" when what
  // this one means is "above = what is played, below = how it is scored".
  // ⚠️ Appended HERE, not at the top of the builder — the Timer is the last
  // member of the group, and the grid flows in append order.
  if (topGroup) grid.append(el("div", "aw-optc-dash"));

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

  // ⭐⭐⭐ QUESTIONS EACH — NORMAL · FREE · COUNT (Đợt 220, thầy 21/8/2026) —
  // SHOWDOWN ONLY, và chỉ template khai `tpl.sdDeal` (Quiz · Type the answer,
  // thầy chốt thử hai game trước — đúng đường fightTurns của Đợt 202 đã đi).
  // Cùng hình dạng "Time each round" ngay trên: dải 3 nút + ô số, ô số làm NHẠT
  // chứ không ẩn khi không ở Count (luật chống reflow của Đợt 132).
  //   Normal  chơi như gốc — mỗi câu một lần, hết là hết.
  //   Free    chơi tự do tới khi Submit answers (trần 100 câu/em); % lùi về vòng
  //           trọn vẹn cuối để mọi em cùng mẫu số.
  //   Count   mỗi em đúng N câu; ô số chặn cứng ở tổng số câu của bài.
  // Chia bài: core/showdown.js dealQuestions() — engine nối dài mảng lúc mount
  // (applySdDeal), nên như Time each round, chọn xong phải Apply mới ăn.
  //
  // ⭐ KHOÁ CHÉO (thầy chốt "loại trừ nhau"): Free/Count ⇒ khoá "Balance
  // questions" (nó chia theo đội đông nhất — Count làm việc đó tốt hơn và cho
  // MỌI đội) và khoá "Shuffle questions" (việc xáo nay là của bộ chia bài; để
  // template tự xáo là phá tan bài đã chia — engine chặn qua ui.keepItemOrder()).
  // Ngược lại Balance đang bật thì cả dải này nằm nhạt. Nhạt, KHÔNG ẩn — Đợt 188.
  let syncSdDealLocks = () => {};
  if (showdown && tpl.sdDeal) {
    const DEALS = ["normal", "free", "count"];
    const cur = DEALS.includes(draft.sdDeal) ? draft.sdDeal : "normal";
    const maxN = Math.max(1, Math.round(Number(sdItemCount)) || 1);
    const curN = Math.max(1, Math.min(maxN, Math.round(Number(draft.sdDealCount)) || 1));
    const stepper = makeHStepper(curN, 1, maxN, v => { draft.sdDealCount = v; },
      { format: v => String(v), holdMax: 5 });
    stepper.el.classList.toggle("is-dim", cur !== "count");
    stepper.el.title = "How many questions each pupil gets (Count)";
    const c = mkCell({ label: "Questions each", sub: "per pupil", wide: true });
    c.cell.title = "Normal: every question once · Free: play until Submit answers · Count: exactly N questions per pupil";
    c.ctl.append(
      mkSeg([
        { value: "normal", label: "Normal" },
        { value: "free", label: "Free" },
        { value: "count", label: "Count" }
      ], cur, v => {
        draft.sdDeal = v;
        stepper.el.classList.toggle("is-dim", v !== "count");
        syncSdDealLocks();
      }),
      stepper.el
    );
    grid.append(c.cell);
    // ⚠️ Hai ô tích bị khoá được TÌM LÚC GỌI, không giữ ref: chúng dựng SAU dải
    // này (khu ô tích nằm cuối builder), giữ ref lúc này chỉ tóm được null.
    // ⛔⛔ KHOÁ MỘT CHIỀU, KHÔNG PHẢI HAI CHIỀU (vá 22/8/2026 — thầy báo *"tôi đã
    // setup như thế này rồi nhưng QUESTIONS EACH vẫn không mở khoá là sao"*).
    // Bản đầu Đợt 220 còn một dòng nữa: Balance đang tích thì khoá luôn CẢ DẢI này.
    // Nghe thì "loại trừ nhau", nhưng hậu quả là **điều khiển MỚI bị điều khiển CŨ
    // chặn đường** — mà Balance thì đã tích sẵn trong hàng loạt act cũ, nên với thầy
    // dải này trông như hỏng: nằm mờ vĩnh viễn, không cách nào chạm tới, và **không
    // có gì trên màn nói vì sao**.
    // ⭐ Luật đúng: dải này LUÔN chạm được. Chọn Free/Count thì Shuffle mờ đi — thầy
    // NHÌN THẤY ô vừa tắt nên hiểu ngay quan hệ, đúng idiom In turns của Đợt 202.
    // ⚠️ CHỈ CHẠM KHOÁ, KHÔNG BAO GIỜ CHẠM GIÁ TRỊ (luật Đợt 202): dấu tích Shuffle giữ
    // nguyên, quay về Normal là nó sống lại y như cũ.
    // ⚠️ Đợt 261 — ô "Balance questions" đã gỡ hẳn nên chỉ còn MỘT ô bị khoá. Việc xáo
    // nay là của bộ chia bài (`dealQuestions`); để template tự xáo là phá tan bài đã
    // chia — engine chặn qua `ui.keepItemOrder()`.
    syncSdDealLocks = () => {
      const dealOn = draft.sdDeal === "free" || draft.sdDeal === "count";
      host.querySelector('[data-aw-check="shuffle"]')?.classList.toggle("is-locked", dealOn);
    };
  }

  // SHUFFLE / AUTO SWITCH — the same KIND of control, so they live together in
  // the checkbox block at the bottom (Đợt 140). Labels shortened to fit two per
  // row; the full sentence survives as the tooltip.
  // `tpl.shuffleLabel` (Đợt 140) — a game whose items aren't "questions"
  // (Speaking cards deals CARDS) renames this one switch.
  addCheck(tpl.shuffleLabel || "Shuffle questions", draft.shuffleQuestions !== false,
    v => draft.shuffleQuestions = v,
    { key: "shuffle", title: tpl.shuffleLabel || "Shuffle question order" });
  // ⛔⛔⛔ Đợt 261 — "BALANCE QUESTIONS" ĐÃ BỊ GỠ HẲN (thầy, 25/8/2026: *"bỏ hẳn luôn
  // nút tích Balance questions ở options, khi đã chọn count và số rồi thì buộc phải
  // cân bằng số câu hỏi cho mỗi bạn"*).
  //
  // ⚠️ VÌ SAO GỠ CHỨ KHÔNG GIỮ CẢ HAI: hai cơ chế cùng hứa "mọi em bằng nhau" mà một
  // cái GIỮ ĐƯỢC LỜI HỨA MỘT MÌNH (Count: mỗi em đúng N câu, N là số thầy gõ) còn cái
  // kia thì KHÔNG (Balance chia cho `maxTeam` — một con số phải khớp giữa mọi bảng,
  // và đúng chỗ đó đã vỡ ở Đợt 260, đẻ ra ca "cùng số người mà bảng 50 câu bảng 100
  // câu"). Để cả hai là để thầy chọn nhầm cái yếu hơn.
  // ⚠️ `Count` nay mở cho 10/12 template có Showdown (`tpl.sdDeal`); ba game bàn-chơi
  // (Crossword · Open the box · Find the match) CẤM vĩnh viễn vì mảng câu của chúng
  // CHÍNH LÀ cái bàn — xem ghi chú ở dải "Questions each" phía trên.
  // ⚠️ Act cũ còn lưu `balanceQuestions` thì key đó nay là RÁC VÔ HẠI: không còn ai
  // đọc nó (`applyBalance` đã gỡ khỏi core/engine.js cùng đợt).
  // OPT-IN (Đợt 143 — see this file's header for why): only a game that really
  // reads options.shuffleAnswers offers the switch. Quiz, Open the box, Gameshow.
  if (tpl.usesShuffleAnswers) {
    addCheck("Shuffle answers", draft.shuffleAnswers !== false, v => draft.shuffleAnswers = v,
      { key: "shuffleAnswers", title: "Shuffle answer order" });
  }
  // AUTO SWITCH — advance to the next question automatically once the current
  // one has an answer. OFF by default.
  // Đợt 143: the teacher asked to KEEP this option ("tôi vẫn cần tới nó trong
  // một số tình huống trong tương lai"), so rather than delete a control that
  // no template had ever read, it was WIRED UP for real in the four games with
  // a manual next step (Quiz, Anagram, Unjumble, Crossword) and made opt-in.
  if (tpl.usesAutoSwitch) {
    addCheck("Auto next question", draft.autoSwitch === true, v => draft.autoSwitch = v,
      { key: "autoNext", title: "Move to the next question automatically" });
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
      timeCostCell: tpl.timeCost ? buildTimeCostCell : null,
      // ⭐ Đợt 259b — IS THIS PANEL OPEN INSIDE A RUNNING MATCH? The panel itself
      // has known since Đợt 133 (the `fight` argument, used a few lines below to
      // add the match's own controls), but the TEMPLATE was never told — so a
      // control that a match OVERRIDES had no way to take itself off the panel.
      // That is exactly the dead-control trap of Đợt 143 (a switch on screen
      // claiming to decide something the code has already settled), and
      // Crossword's "Change the crossword" fell into it the moment Đợt 259 forced
      // that option off inside a match.
      // ⚠️ A BOOLEAN, not the `fight` object: a template has no business reaching
      // into the referee from a builder, and handing it the object would invite
      // exactly that.
      inFight: !!fight
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
  //
  // ⭐⭐ Đợt 245 (23/8/2026) — `hideEndShowAnswers`, THE CALLER'S opt-out, and it
  // exists because on a HOMEWORK form this switch was a LIE, not a duplicate.
  // The "Set assignment" form already carries a tick-box called "Show answers"
  // in its own `At the end of the game, students can` row, and THAT is the one
  // the pupil's machine obeys: core/engine.js's student branch reads
  // `session.endOptions.showAnswers` and never once looks at
  // `activity.options.showAnswers`. So the panel's switch sat on the same form,
  // said the same words, and did nothing — the teacher could untick it and the
  // class would still be shown the answers.
  // ⚠️ Measured before the fix (Đợt 245's bench): the two even DISAGREED by
  // default — the tick-box starts UNTICKED, this switch starts TICKED
  // (BUILTIN_DEFAULTS.showAnswers = true), so a form straight out of the box
  // showed one setting as both on and off at the same time.
  // ⛔ A CALLER flag, deliberately NOT a template flag: whether this switch
  // means anything depends on WHO IS ASKING (homework form vs the act's own
  // Options), never on which of the 17 games it is. `tpl.hideShowAnswers` right
  // above is the TEMPLATE's own opt-out and is untouched — the two answer
  // different questions and both still have to pass.
  // ⚠️ Settings ▸ Default ACTIVITY options must KEEP the switch: an act played
  // in class really does read `activity.options.showAnswers` (the `else` branch
  // of showSummary in core/engine.js). Only the homework bucket opts out.
  if (!tpl.hideShowAnswers && !hideEndShowAnswers) {
    addCheck("Show answers at end", draft.showAnswers !== false, v => draft.showAnswers = v,
      { key: "showAnswers", title: "Show answers when the game ends" });
  }

  // ⭐⭐ Đợt 213 — RESOURCES AND REWARDS LEFT, PUNISHMENTS RIGHT. Run LAST, once
  // every source has put its cells in: this file's, the template's, and the
  // match's. See orderSliderCells() for why it is done here and not by asking
  // seventeen templates to append in a different order.
  orderSliderCells(grid);
  // ⭐⭐ Đợt 215 — and now the COLUMN each one lands in. Sorting alone could not
  // do it: the grid flows row-first, so an odd number of cells drops the last
  // punishment into the LEFT column with a hole beside it (thầy's own example:
  // Quiz, Time cost bên trái, ô phải trống). See seatCellsByColumn().
  seatCellsByColumn(grid);

  // the gathered checkboxes, with a hairline above them so the block reads as
  // "and these switches" rather than as another option cell
  // ⚠️ Appended AFTER the sort on purpose — the separator and the checkbox block
  // are the foot of the panel and must stay there whatever the sort does.
  if (checksBox.children.length) {
    orderChecks(checksBox, tpl.checkOrder);
    layoutChecks(checksBox);
    syncSdDealLocks();   // Đợt 220 — hai ô tích giờ mới tồn tại để mà khoá
    grid.append(el("div", "aw-optc-sep"), checksHost);
  }

  return { grid };
}

/**
 * ⭐⭐ Đợt 213b (thầy, 20/8/2026) — THE SWITCH BLOCK, LAID OUT IN COLUMNS.
 *
 * thầy went through the block template by template, naming what each COLUMN
 * holds top and bottom ("cột 1 shuffle questions/shuffle answers, cột 2 auto
 * next question/allow skip, cột 3 show answers at end"). Two things had to change
 * for that to be sayable at all:
 *
 * 1. ORDER. The block used to be whatever order the three sources happened to
 *    append in — this file's own switches, then the template's, then the match's.
 *    A template now declares `checkOrder`, a list of KEYS (see addCheck's
 *    `opts.key`), and the block is sorted by it. ⛔ Keys, never labels: this same
 *    đợt renames "Show answer when wrong" to "Show corrects", and `shuffleLabel`
 *    already renames "Shuffle questions" for Speaking cards, so labels were never
 *    stable names.
 *    ⚠️ A switch whose key is NOT in the list keeps its relative order and goes
 *    to the END. That is where "In turns" (Fight) — và trước Đợt 261 là cả "Balance
 *    questions", nay đã gỡ —
 *    (Showdown) land — modes thầy has not laid out, so they are appended visibly
 *    rather than guessed at.
 *    ⚠️ A template with no `checkOrder` is untouched, so nothing here can break a
 *    template that has not been laid out yet.
 *
 * 2. FLOW. `layoutChecks` fixes the ROW COUNT, and the CSS flows the block by
 *    COLUMN (`grid-auto-flow: column`) — fill column 1 top to bottom, then start
 *    column 2. The old `repeat(auto-fill, …)` filled by ROW into as many columns
 *    as fitted, which is why a 4-switch block sat as 3-then-1 hugging the left.
 *
 * ⚠️ ROWS = 2, EXCEPT WHEN THAT WOULD NEED A 4th COLUMN. The panel is capped at
 * 580px and a column needs ~168px, so three columns is the most that fits with
 * the labels still readable; a 4th would ellipsis every one of them. Gameshow (7
 * switches) is the only template over the line today and goes to 3 rows. ⛔ Do not
 * "simplify" this to a constant 2 — measure the type, not the markup (Đợt 212).
 */
function orderChecks(box, order) {
  if (!Array.isArray(order) || !order.length) return;
  const kids = Array.from(box.children);
  const rank = c => {
    const i = order.indexOf(c.dataset.awCheck);
    return i === -1 ? order.length : i;      // unlisted (Fight / Showdown) → the end
  };
  const sorted = kids
    .map((c, i) => ({ c, i, r: rank(c) }))
    .sort((a, b) => (a.r - b.r) || (a.i - b.i))   // stable: ties keep append order
    .map(x => x.c);
  if (sorted.every((c, i) => c === kids[i])) return;
  box.append(...sorted);        // re-appending a child MOVES it; no clone, no lost listener
}

function layoutChecks(box) {
  const n = box.children.length;
  box.style.setProperty("--aw-check-rows", String(n > 6 ? 3 : 2));
}

/**
 * ⭐⭐ Đợt 213 — put the slider cells in thầy's order without moving anything else.
 *
 * thầy, 20/8/2026: "các thanh mạng/thưởng thì ưu tiên bên trái, các thanh trừ
 * điểm thì ưu tiên bên phải". Measured before this đợt, four templates read
 * backwards: Type the answer and Unjumble put Points off on the LEFT with Lives
 * beside it, and Whack-a-mole and True/false pushed Lives out to the right.
 *
 * ⭐ WHY IT LIVES HERE AND NOT IN THE TEMPLATES. `.aw-opt-grid` is two columns
 * flowing row-first, so "left" is nothing but "appended earlier" — the order is
 * a property of the PANEL, not of any one template. Fixing it template by
 * template would mean editing seventeen files to state one rule seventeen times,
 * and the eighteenth template would be written without it. It also would have
 * broken the law this file opens with: A TEMPLATE NEVER TOUCHES THIS PANEL'S DOM.
 *
 * ⭐ "ƯU TIÊN", NOT "LUÔN LUÔN" — thầy's word, and his explicit choice when asked
 * (the alternative offered was pinning every red slider to column 2 and living
 * with the holes). Cells are SORTED, then dropped back into the same slots they
 * already occupied, so the panel can never grow an empty cell: on Whack-a-mole
 * (1 green + 1 blue + 3 red) a hard rule would have punched two holes in the
 * left column. Sorting gives Lives · Speed / Points off · Punishment / Time cost.
 *
 * ⚠️⚠️ THREE KINDS OF CELL ARE DELIBERATELY LEFT WHERE THEY ARE, and each one is
 * load-bearing:
 *   · anything without `data-aw-rank` — segmented controls, text boxes, the
 *     Anagram mode row. They keep their slots and only the sliders move around
 *     them, so a template's own reading order survives.
 *   · `.aw-optc-wide` — a full-width cell is not IN a column, and shuffling one
 *     into the sequence would drag every cell after it onto a different row.
 *   · `.aw-optc-stack` — core/fight.js's Time delay + Speed bonus, which thầy
 *     fixed into one column in Đợt 188 ("time delay và speed bonus luôn cùng 1
 *     cột") because the first decides whether the second does anything. Its two
 *     sliders are nested inside it, so they are not direct children here and are
 *     never seen by this function at all — the pair travels as one, unsorted.
 *
 * A STABLE sort: two sliders of the same rank keep the order their template
 * chose (Whack-a-mole's Points off before Punishment, both red).
 */
function orderSliderCells(grid) {
  const cells = Array.from(grid.children).filter(node =>
    node.dataset && node.dataset.awRank !== undefined && !node.classList.contains("aw-optc-wide"));
  if (cells.length < 2) return;
  const sorted = cells
    .map((cell, i) => ({ cell, i, rank: Number(cell.dataset.awRank) }))
    .sort((a, b) => (a.rank - b.rank) || (a.i - b.i))   // `|| a.i - b.i` = the stable tiebreak
    .map(x => x.cell);
  if (sorted.every((cell, i) => cell === cells[i])) return;   // already right — touch nothing
  // ⚠️⚠️ RE-SEAT AGAINST ANCHORS, NEVER AGAINST INDEXES. The obvious version —
  // remember each cell's index, then `insertBefore(sorted[n], children[idx+1])`
  // — is wrong the moment two cells swap: the first move shifts every later
  // index, and worse, the node an index points at may itself be one of the cells
  // still waiting to be moved. A comment node holds each seat instead, so every
  // destination is a real node that is guaranteed to stay put.
  // Comments are invisible to `grid.children` and to CSS grid, which lays out
  // ELEMENT children only, so the seats cost nothing while they exist.
  const seats = cells.map(cell => grid.insertBefore(document.createComment("aw-slot"), cell));
  cells.forEach(cell => cell.remove());
  seats.forEach((seat, n) => { grid.insertBefore(sorted[n], seat); seat.remove(); });
}


/**
 * ⭐⭐⭐ Đợt 215 (thầy, 20/8/2026) — THE TWO COLUMNS MEAN SOMETHING.
 *
 * thầy: *"Ưu tiên các thanh trượt thưởng hoặc cộng điểm về bên trái, các thanh
 * trượt phạt và trừ điểm về bên phải. Ví dụ: options của quiz hiện đang thanh
 * time cost … ở bên trái cùng thanh Lives, trong khi đó ngay bên phải … lại là
 * khoảng trống."*
 *
 * ⭐ WHY Đợt 213's SORT WAS NOT ENOUGH, measured before this đợt across all 17
 * templates × 3 modes (35 panels): 28 of the 35 read backwards. Sorting puts the
 * cells in the right ORDER, but the grid flows row-first, so the column a cell
 * lands in is decided by how many cells happen to come before it — and the odd
 * one out falls into the left column with a hole beside it. Order and COLUMN are
 * two different questions; Đợt 213 only answered the first.
 *
 * THE THREE RULES, all LOCAL to one row (thầy approved each one, 20/8):
 *   1. a punishment beside a non-punishment → the punishment takes the RIGHT seat.
 *   2. a reward on the right beside a plain settings cell → the reward takes the
 *      LEFT seat (Gameshow's Lives, Running word's Bonus — the two panels where a
 *      non-slider cell had pushed a reward across).
 *   3. a punishment alone on a row → it MOVES RIGHT and leaves the left seat
 *      EMPTY. thầy asked for this knowing it makes a hole (8 templates get one);
 *      the panel does not grow taller, because the row already existed.
 *
 * ⛔⛔ LOCAL SWAPS, NEVER A GLOBAL RE-PAIR. Dealing the cells into two columns
 * from scratch reads well on paper and wrecks two panels in practice: Running
 * word's "Pass penalty" is its ONLY punishment, so a column-pairing pass hauls it
 * up to row 1 beside "Team A" and sinks both name boxes to the bottom. A row-local
 * swap cannot do that — nothing ever crosses a row boundary.
 *
 * ⭐⭐ THE STACK COUNTS AS A REWARD (thầy, asked directly). core/fight.js's Time
 * delay + Speed bonus pair (`.aw-optc-stack`, Đợt 188) was exempt from every sort,
 * and in 6 Fight panels it sat in the right column — pushing Points off AND Time
 * cost into the left one. It holds Speed bonus, a reward, so it belongs on the
 * left, and moving it there hands the right column back to the two penalties.
 * ⚠️ It is ONE cell standing TWO rows tall, so its column is decided in its HEAD
 * row and the row below follows. That is why swapRow() also swaps the row beneath
 * a stack, and why a row holding a stack's lower half is never judged on its own.
 *
 * ⭐ HOW THE LAYOUT IS KNOWN WITHOUT MEASURING IT. `getBoundingClientRect` is no
 * use here: the panel is built while still off-screen, so every rect is 0 (and
 * Đợt 156 already caught `isConnected` lying about this very panel). The row grid
 * is SIMULATED instead — plain CSS auto-placement, two columns, sparse — and the
 * simulation is checked against the real rendered panel by
 * scratch/opts215-measure.html before it is trusted. ⛔ Do not "simplify" this
 * into a rect read.
 *
 * ⚠️ A hole is made with `grid-column: 2` on the cell, NOT with an empty filler
 * div: `.aw-opt-grid > * { margin-bottom: 9px }` would give a filler a margin of
 * its own, and an invisible cell is one more thing every later pass must know to
 * skip.
 */
const isFullRowCell = c => c.classList.contains("aw-optc-wide") || c.classList.contains("aw-optc-dash");
const isStackCell   = c => c.classList.contains("aw-optc-stack");
const isPunishCell  = c => c.dataset.awRank === "2";
// green/amber, plus the Fight stack — see the header note. Blue (a plain
// quantity) deliberately does NOT count: it has no claim on a seat a settings
// cell is already sitting in, and counting it only churned Balloon pop's
// "Round time" for no gain.
const isRewardCell  = c => c.dataset.awRank === "0" || isStackCell(c);

function seatCellsByColumn(grid) {
  const kids = Array.from(grid.children);
  if (!kids.length) return;

  // ---- 1. simulate CSS grid auto-placement (2 columns, sparse) ----
  const rows = [];                       // rows[r] = [cell|null, cell|null]
  const ghost = [];                      // ghost[r][c] = this slot is a stack's lower half
  const at = r => {
    while (rows.length <= r) { rows.push([null, null]); ghost.push([false, false]); }
    return rows[r];
  };
  let cr = 0, cc = 0;                    // the placement cursor
  for (const cell of kids) {
    if (isFullRowCell(cell)) {
      let r = cc > 0 ? cr + 1 : cr;
      while (at(r)[0] || at(r)[1]) r++;
      at(r)[0] = at(r)[1] = cell;
      rows[r].full = true;
      cr = r; cc = 1;
      continue;
    }
    const tall = isStackCell(cell);
    let r = cr, c = cc;
    for (;;) {
      if (c > 1) { r++; c = 0; continue; }
      at(r); at(r + 1);
      if (!rows[r][c] && !(tall && rows[r + 1][c])) break;
      c++;
    }
    rows[r][c] = cell;
    if (tall) { rows[r + 1][c] = cell; ghost[r + 1][c] = true; }
    cr = r; cc = c;
  }

  // ---- 2. the three rules, one row at a time ----
  const swapRow = r => {
    [rows[r][0], rows[r][1]] = [rows[r][1], rows[r][0]];
    if (rows[r + 1] && (ghost[r + 1][0] || ghost[r + 1][1])) {
      [rows[r + 1][0], rows[r + 1][1]] = [rows[r + 1][1], rows[r + 1][0]];
      [ghost[r + 1][0], ghost[r + 1][1]] = [ghost[r + 1][1], ghost[r + 1][0]];
    }
  };
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (row.full) continue;
    const [a, b] = row;
    const ghostRow = ghost[r][0] || ghost[r][1];
    if (a && b) {
      if (ghostRow) continue;                                     // decided by the head row
      if (isPunishCell(a) && !isPunishCell(b)) swapRow(r);         // rule 1
      else if (isRewardCell(b) && !isRewardCell(a)) swapRow(r);    // rule 2
    } else if (a && !b && !ghostRow && isPunishCell(a)) {
      row[0] = null; row[1] = a;                                   // rule 3 — this is the hole
    } else if (!a && b && !ghostRow && !isPunishCell(b)) {
      row[0] = b; row[1] = null;                                   // never strand a non-punishment
    }
  }

  // ---- 3. write the plan back: DOM order, plus the one forced column ----
  const seen = new Set();
  const order = [];
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let c = 0; c < 2; c++) {
      const cell = row[c];
      if (!cell || seen.has(cell)) continue;                       // full rows and stacks appear twice
      seen.add(cell);
      // Only a cell that has to skip an EMPTY left seat needs telling; everything
      // else is placed correctly just by flowing in this order, and a stale inline
      // column would outlive the reason for it.
      cell.style.gridColumn = (c === 1 && !row[0] && !isFullRowCell(cell)) ? "2" : "";
      order.push(cell);
    }
  }
  // `append` MOVES nodes that are already children — no clone, no lost listener
  // (the same property orderChecks() leans on).
  if (order.length === kids.length) grid.append(...order);
}


/**
 * The CONTENT row — TEXT | VOICE on the left, the clue sets of whichever half
 * is active on the right (Đợt 145's design, extracted here in Đợt 155).
 *
 * ⛔⛔ Đợt 212 (20/8/2026, thầy) — PRONUNCIATION IS GONE FROM THIS ROW.
 * Đợt 190 imported the IPA column as a fifth clue set; Đợt 205 promoted it to a
 * third button here. Thầy: *"bỏ hẳn phần pronunciation trong options đi và không
 * tích hợp phần pronunciation vào trong act tích hợp nữa… Đưa nút TEXT-VOICE và
 * các act con về dạng như cũ, không có lựa chọn pronunciation nữa"* — an act of
 * its own, with more in it, is coming later.
 *
 * ⚠️ NOTHING WAS DELETED FROM ANY ACT. `pron` is filtered out at ONE choke
 * point — `variantsOf()` in core/content-view.js — so acts imported under Đợt
 * 190 keep their transcription in the database and merely stop offering it
 * here. That is what lets the separate act pick it straight back up.
 * ⭐ MODE › IPA is deliberately UNTOUCHED (thầy chose to keep it): it reads the
 * transcription off the resolved item's `ipa` field, never off this row — see
 * resolveItem() in core/content-view.js.
 * ⛔ Do NOT re-add a third button here on the grounds that "the data is still
 * there". The data staying put is what makes the separate act possible; it is
 * not a hint that this row should go on offering it.
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
export function buildContentSwitchRow(swHost, { contentSwitch, sel, onViewChange = null, templatePicker = null }) {
  const shown = contentSwitch.shown === "voice" ? "voice" : "text";
  const variants = contentSwitch.variants || null;
  const voiceVariants = contentSwitch.voiceVariants || variants;
  const labelOf = contentSwitch.labelOf || (k => String(k || "").toUpperCase());
  let mode = shown;
  const firstText = variants && variants.length ? variants[0] : null;
  let pickedText = contentSwitch.variant || firstText;
  let pickedVoice = contentSwitch.voiceVariant || (voiceVariants ? voiceVariants[0] : null);

  // ⭐⭐ Đợt 250 (thầy) — THE CLUE-SET BOX GREW A TOP FLOOR.
  // "tăng chiều cao của ô chọn các act con lên để bằng đúng ô TEXT-VOICE, kẻ
  //  chia đôi ô act con ra… nửa dưới để chọn các act con như cũ, nửa trên là
  //  chọn template."
  // Only the Set assignment form asks for this (`templatePicker` non-null). In
  // a GAME the row is untouched: there the template is changed from the footer
  // button of the Options panel, and a second door into the same room would be
  // two switches for one thing.
  //
  // `templatePicker` = { label(), icon(), onPick() } — the CALLER owns the
  // popup and the state; this row only draws the button and reports the tap.
  //
  // ⚠️ `has-variants` is forced ON when a picker is present even for an act
  // with NO clue sets: that class is what gives the row its SECOND COLUMN, and
  // without the column there is nowhere for the template button to live. The
  // cell then carries `is-tplonly` and holds just the one floor.
  const hasTpl = !!templatePicker;
  const row = el("div", "aw-opt-content"
    + (variants || hasTpl ? " has-variants" : "")
    + (hasTpl ? " has-tpl" : ""));
  const switchEl = el("div", "aw-opt-switch");
  switchEl.append(el("div", "aw-opt-switch-thumb"));
  const MODES = [["text", "Text"], ["voice", "Voice"]];
  const modeBtns = new Map();
  MODES.forEach(([key, label]) => {
    const b = el("button", "aw-opt-switch-btn" + (mode === key ? " is-active" : ""), label);
    b.type = "button";
    modeBtns.set(key, b);
    switchEl.append(b);
  });

  const half = el("div", "aw-opt-variants");
  // The two-floor cell (Đợt 250). Built HERE rather than further down because
  // `half` has to be appended INTO it, and the seg below is appended into
  // `half` — an ordering constraint, not a preference.
  let tplCell = null;
  if (hasTpl) {
    tplCell = el("div", "aw-opt-tplcell" + (variants ? "" : " is-tplonly"));
    const tplBtn = el("button", "aw-opt-tplpick");
    tplBtn.type = "button";
    tplBtn.title = "Choose which game this class plays";
    tplBtn.append(
      el("span", "aw-opt-tplpick-ic", templatePicker.icon()),
      el("span", "aw-opt-tplpick-name", String(templatePicker.label() || "").toUpperCase())
    );
    tplBtn.onclick = () => { sound.click(); templatePicker.onPick(); };
    tplCell.append(tplBtn);
    if (variants) tplCell.append(half);
  }
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
  // The switch's own thumb rides on `--n`/`--i` the way `.aw-seg` does (Đợt
  // 205). Before that the travel was a fixed `.is-voice { translateX(100%) }`
  // rule in app.css. Kept now that the row is back to two buttons — one less
  // hard-coded count is one less thing to remember.
  const paintSwitch = () => {
    switchEl.style.setProperty("--n", String(MODES.length));
    switchEl.style.setProperty("--i", String(Math.max(0, MODES.findIndex(([k]) => k === mode))));
    modeBtns.forEach((b, k) => b.classList.toggle("is-active", k === mode));
  };
  const paintHalf = () => {
    if (!seg) return;
    const list = (mode === "voice" ? voiceVariants : variants) || [];
    // One choice is not a choice (the Đợt 143 OPT-IN rule): under 2 sets the
    // whole half fades out instead of showing a lone dead button.
    half.classList.toggle("is-empty", list.length < 2);
    // ⭐ Đợt 250 — an empty lower floor inside a bordered cell is dead space, so
    // the cell drops to ONE floor instead of keeping a faded-out half. Same
    // OPT-IN reasoning as the line above, applied to the box rather than the
    // chips.
    if (tplCell) tplCell.classList.toggle("is-tplonly", list.length < 2);
    // ⭐ Đợt 205 — and when the half has nothing to say, it gives its width
    // BACK: the row goes to one track and the mode buttons stretch across it
    // (`.is-wide` animates `grid-template-columns`, app.css). Deliberate for an
    // act with exactly ONE written clue set — dead space that never fills is
    // the same problem the OPT-IN rule is about.
    // ⛔ Đợt 250 — `is-wide` collapses the SECOND COLUMN to nothing. With the
    // template button living in that column, collapsing it would hide the one
    // control the teacher opened this form for. The lone-clue-set fade above
    // still applies (the chips half bows out); only the column stays put.
    row.classList.toggle("is-wide", list.length < 2 && !hasTpl);
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
    sel.contentMode = value;
    mode = value;
    paintSwitch();
    // ⚠️ Picking VOICE must also STATE which set it plays. Leaving
    // `voiceVariant` unwritten would let a stored value from another act's
    // shape (or none at all) decide, and the teacher would hear a clue set
    // that is not the one lit up in front of them.
    if (variants) {
      if (value === "voice" && pickedVoice) sel.voiceVariant = pickedVoice;
      if (value === "text" && pickedText) sel.contentVariant = pickedText;
    }
    paintHalf();
    sound.click();
    onViewChange?.();   // Đợt 147 — TEXT and VOICE are separate views
  };
  modeBtns.forEach((b, k) => { b.onclick = () => pick(k); });

  paintSwitch();
  paintHalf();
  row.append(switchEl, tplCell || half);
  swHost.append(row);
}