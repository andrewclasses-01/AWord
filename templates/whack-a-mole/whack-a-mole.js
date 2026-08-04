// =============================================================
// TEMPLATE: WHACK-A-MOLE — Wordwall style, English UI, Wild West art.
//
//  • A wooden SIGN at the top tells you what to hit. Moles pop up from a grid
//    of desert holes, each carrying a speech bubble with a piece of content.
//    Whack the moles that MATCH the sign; avoid the wrong ones.
//  • TWO content modes (options.mode, chosen in the editor):
//      "trueFalse" — sign says "Hit moles that are: TRUE" (or FALSE when the
//                    "Switch correct/incorrect" option is on). Hitting a needed
//                    mole clears it for good; the round is COMPLETE once every
//                    needed answer is hit. The other side are distractors that
//                    keep coming. A missed (ducked) needed mole can come back.
//      "quiz"      — sign shows ONE question. Moles carry its options; hit the
//                    CORRECT one to advance. After the last question -> COMPLETE.
//  • Real-time: moles are scheduled with setTimeout (never rAF — a hidden tab
//    would freeze rAF and the game would stall; core rule). Every mole has an
//    absolute setTimeout that ducks/frees it, independent of any animation
//    callback, so nothing gets stuck.
//  • TIMER comes from the engine's option (options.timer): "countDown" draws our
//    own bar + clock (manualTimerStart, so bonus "time" can extend it) and ends
//    at 0; "countUp" shows no bar and ends only on the objective. Either way,
//    clearing every needed answer ends the round early.
//  • Extras: Lives (hearts), a wrong-hit points penalty, a wrong-hit "Punishment"
//    freeze (0-10s, Options), combo streak bonus, and three independently-toggled
//    bonus CRATES (time / loot / power).
//  • The wooden SIGN doubles as the scoreboard: when the round ends the question
//    clears off the plank and the final score counts up there.
//
//  Wild West art + sounds are ripped from Wordwall's own theme (teacher's call)
//  and live self-contained under ./img and ./sounds. This game keeps a FIXED
//  desert look — it does NOT recolour per theme like the other templates.
// =============================================================

import { registerTemplate } from "../../core/registry.js";
import { shuffle, el, formatTime } from "../../core/utils.js";
import { autoFit } from "../../core/fit.js";
import { wamSound } from "./wam-sound.js";
import { openWamEditor } from "./whack-a-mole-editor.js";

function imgUrl(name) { return new URL(`./img/${name}`, import.meta.url).href; }

// Fixed 10-hole desert layout (3 / 4 / 3), positions as % of the scene with a
// gentle perspective (farther rows sit higher and a touch smaller). Tuned by eye
// against bg2. Moles spawn into these regardless of how much content there is.
const HOLE_LAYOUT = [
  { x: 27, y: 40, s: 10 }, { x: 50, y: 38, s: 10 }, { x: 73, y: 40, s: 10 },
  { x: 14, y: 55, s: 11.5 }, { x: 38, y: 54, s: 11.5 }, { x: 62, y: 54, s: 11.5 }, { x: 86, y: 55, s: 11.5 },
  { x: 27, y: 73, s: 13 }, { x: 50, y: 74, s: 13 }, { x: 73, y: 73, s: 13 }
];

const MOLE_VARIANTS = ["mole01", "mole02", "mole03"];

// Bonus crates — each one has its OWN on/off toggle in Options (time / loot /
// power). No hazard crate anymore. `time` only makes sense when counting down.
const CRATE_TYPES = [
  { key: "time",  img: "crate-time.webp",  weight: 3 },
  { key: "loot",  img: "crate-loot.webp",  weight: 3 },
  { key: "power", img: "crate-power.webp", weight: 2 }
];

const COMBO_THRESHOLD = 3;     // consecutive correct hits before a combo bonus kicks in
const POWER_MS = 6000;         // how long a power crate doubles points
const CRATE_CHANCE = 0.16;     // chance a spawn is a crate instead of a mole (when enabled)
const PUNISH_DEFAULT = 4;      // wrong hit: seconds the dizzy mole stays up + everything else pauses.
                               // Teacher-adjustable since 4/8/2026 ("Punishment" slider, 0..10s);
                               // 4 = the value this was hard-coded to before, so old acts play the same.
const MAX_PUNISH = 10;
const MAX_LIVES = 10;
// Below this the freeze is too short to read as a punishment, so we skip the
// "WAIT…" note and the dizzy wobble and just let the mole duck.
const PUNISH_MIN_WOBBLE_MS = 400;
const PLANK_RATIO = 150 / 474;   // the sign board's painted aspect (must match the CSS aspect-ratio)
const TARGET_RATIO = 0.55;     // trueFalse: chance a fresh mole carries a still-needed answer (vs a distractor)

// lives: 0 / null / undefined -> unlimited (never game-over); 1..10 -> that many hearts
function normLives(v) {
  if (v == null || v === 0) return null;
  return Math.min(MAX_LIVES, Math.max(1, Math.round(v)));
}

// Intro camera: hold the wide "far mesa" shot briefly, then zoom in to the play
// framing. INTRO_ZOOM must match the CSS transition on .aw-wam-world.
const INTRO_HOLD = 400;
const INTRO_ZOOM = 2200;

// Backdrop uses the REAL Wordwall Wild-West art, layered exactly like the live
// original act (observed in Chrome): a sky, then ONE painted hill image that
// already bakes in the pink mesas + prickly-pear cacti + grassy base
// (mound02.webp), a couple of real cactus props in the foreground, and two
// blurred copies of the plain hill (mound01.webp) as soft depth-of-field rises.
// No hand-drawn SVG scenery — the library images ARE the scene.
const HILL_IMG = "mound02.webp";        // hill + mesas + prickly-pear, one painted image
const FRONT_HILL_IMG = "mound01.webp";  // plain dome, blurred, for the foreground corners

function randi(n) { return Math.floor(Math.random() * n); }
function pickWeighted(list) {
  const total = list.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * total;
  for (const x of list) { if ((r -= x.weight) < 0) return x; }
  return list[list.length - 1];
}

const wamTemplate = {
  type: "whack_a_mole",
  scorable: true,
  hidePointsOff: true,   // ships its own "Points off per wrong hit" control
  name: "Whack-a-mole",
  inlineTimerBar: true,    // our own timer bar + hearts sit on the score row (ui.topbarMid)
  hideLettersOption: true, // no lettered answer boxes here
  manualTimerStart: true,  // we drive our OWN countdown (bonus time can extend it) — the engine
                           // timer must NOT run, or it would auto-submit at the original length

  edit: openWamEditor,

  sounds: {
    play: wamSound.intro,
    restart: wamSound.restart,
    complete: wamSound.complete
  },

  toPrintItems(activity) {
    const opt = activity.options || {};
    if (opt.mode === "quiz") {
      return (activity.content?.questions || [])
        .filter(q => q && Array.isArray(q.answers) && q.answers.length)
        .map(q => ({
          clue: q.question || "",
          answer: (q.answers.find(a => a.correct) || q.answers[0] || {}).text || "",
          options: q.answers.filter(a => a && a.text != null).map(a => ({ text: a.text, correct: !!a.correct }))
        }));
    }
    return (activity.content?.statements || [])
      .filter(s => s && s.text)
      .map(s => ({ clue: s.text, answer: s.answer ? "True" : "False" }));
  },

  // Options panel extras (engine calls this — see CONG THUC MAU §5).
  // The game MODE (True/False vs Quiz) is chosen in the editor now (with a lock),
  // NOT here — so we don't offer a mode radio in-game.
  buildExtraOptions({ panel, draft, el, mkCheck }) {
    const group = (label) => { const g = el("div", "aw-opt-group"); g.append(el("div", "aw-opt-label", label)); panel.append(g); return g; };
    const slider = (g, cls, min, max, get, set, fmt) => {
      const row = el("div", "aw-opt-row aw-wam-sliderrow");
      const val = el("span", "aw-wam-sliderval " + cls, fmt(get()));
      const inp = el("input", "aw-wam-slider " + cls);
      inp.type = "range"; inp.min = String(min); inp.max = String(max); inp.step = "1"; inp.value = String(get());
      inp.oninput = () => { const v = parseInt(inp.value, 10); set(v); val.textContent = fmt(v); };
      row.append(inp, val); g.append(row);
    };

    // SWITCH correct / incorrect — flips the sign to "Hit moles that are: FALSE"
    const gSwitch = group("Answers");
    gSwitch.append(mkCheck(draft.switchAnswers === true, "Switch correct and incorrect",
      v => draft.switchAnswers = v));

    // SPEED 1..10
    const gSpeed = group("Speed");
    slider(gSpeed, "is-speed", 1, 10, () => Number.isInteger(draft.speed) ? draft.speed : 5,
      v => draft.speed = v, v => String(v));

    // LIVES 0..10 (0 = Unlimited)
    const gLives = group("Lives");
    const curLives = (draft.lives == null) ? 0 : Math.min(MAX_LIVES, Math.max(0, draft.lives));
    slider(gLives, "is-lives", 0, MAX_LIVES, () => curLives,
      v => draft.lives = v, v => v === 0 ? "Unlimited" : String(v));

    // PENALTY 0..5 (0 = off) — points lost per wrong hit
    const gPen = group("Points off per wrong hit");
    slider(gPen, "is-pen", 0, 5, () => (typeof draft.minusAmount === "number" ? Math.max(0, Math.min(5, draft.minusAmount)) : 1),
      v => draft.minusAmount = v, v => v === 0 ? "Off" : "−" + v);

    // PUNISHMENT 0..10s (0 = off) — how long the game freezes after a wrong hit
    const gPunish = group("Punishment (pause after a wrong hit)");
    slider(gPunish, "is-punish", 0, MAX_PUNISH,
      () => (typeof draft.punishSeconds === "number" ? Math.max(0, Math.min(MAX_PUNISH, draft.punishSeconds)) : PUNISH_DEFAULT),
      v => draft.punishSeconds = v, v => v === 0 ? "Off" : v + "s");

    // BONUS crates — a separate checkbox for each of the three
    const gBonus = group("Bonus crates");
    gBonus.append(
      mkCheck(draft.bonusTime !== false, "Extra time", v => draft.bonusTime = v),
      mkCheck(draft.bonusLoot !== false, "Loot", v => draft.bonusLoot = v),
      mkCheck(draft.bonusPower !== false, "Power Up", v => draft.bonusPower = v)
    );

    // ---- prune two standard groups the teacher doesn't want here ----
    // 1) "Auto switch / Move to the next question automatically" — not used.
    [...panel.querySelectorAll(".aw-opt-group")].forEach(g => {
      const lbl = g.querySelector(".aw-opt-label");
      if (lbl && /auto\s*switch/i.test(lbl.textContent || "")) g.remove();
    });
    // 2) The Timer "None" radio — only Count up / Count down are allowed. If the
    //    activity was on "none" (old ones were), snap it to Count down.
    const timerRadios = [...panel.querySelectorAll('input[name="aw-timer"]')];
    const noneR = timerRadios.find(r => r.value === "none");
    if (noneR) { const w = noneR.closest("label") || noneR.parentElement; if (w) w.remove(); }
    if (!draft.timer || draft.timer === "none") {
      const cdR = timerRadios.find(r => r.value === "countDown");
      draft.timer = "countDown";
      if (cdR) { cdR.checked = true; cdR.dispatchEvent(new Event("change")); }
    }
  },

  // Any Options change restarts (everything is read fresh at mount()).
  optionsNeedRestart() { return true; },

  mount(root, activity, ui) {
    const opt = activity.options || {};
    const mode = opt.mode === "quiz" ? "quiz" : "trueFalse";
    const target = !opt.switchAnswers;                  // trueFalse: hit TRUE (or FALSE when switched)
    const speed = Number.isInteger(opt.speed) ? Math.max(1, Math.min(10, opt.speed)) : 5;

    // timer comes from the engine's Timer option now (count up / count down)
    const timerMode = opt.timer === "countUp" ? "countUp" : "countDown";   // default: count down
    const totalSeconds = (typeof opt.timerTotalSeconds === "number" && opt.timerTotalSeconds > 0) ? opt.timerTotalSeconds : 60;

    // lives + penalty
    const startLives = normLives(opt.lives);
    let livesLeft = startLives;
    const penalty = (typeof opt.minusAmount === "number") ? Math.max(0, Math.min(5, opt.minusAmount)) : 1;
    // Punishment = the freeze after a wrong hit, in seconds (Options slider, 0 = none)
    const freezeMs = Math.round(1000 * ((typeof opt.punishSeconds === "number")
      ? Math.max(0, Math.min(MAX_PUNISH, opt.punishSeconds)) : PUNISH_DEFAULT));

    // bonus crates — each independent; "time" only helps a count-down game
    const bonusTime = opt.bonusTime !== false && timerMode === "countDown";
    const bonusLoot = opt.bonusLoot !== false;
    const bonusPower = opt.bonusPower !== false;
    const enabledCrates = CRATE_TYPES.filter(c =>
      (c.key === "time" && bonusTime) || (c.key === "loot" && bonusLoot) || (c.key === "power" && bonusPower));
    const cratesOn = enabledCrates.length > 0;

    // ---------- content ----------
    const statements = [...(activity.content?.statements || [])].filter(s => s && typeof s.text === "string" && s.text.trim());
    const questions = [...(activity.content?.questions || [])]
      .filter(q => q && Array.isArray(q.answers) && q.answers.some(a => a && a.correct) && q.answers.length >= 2);

    const usable = mode === "quiz" ? questions.length > 0 : statements.length > 0;
    if (!usable) {
      root.innerHTML = "";
      root.append(el("div", "aw-wam-empty",
        mode === "quiz" ? "This activity has no quiz questions yet." : "This activity has no statements yet."));
      return () => {};
    }

    // ---------- pacing from speed ----------
    // The 1..10 slider is spread EVENLY between the two real extremes (teacher,
    // 4/8/2026): 1 = very slow (one mole at a time, up for ages), 10 = frantic.
    // The old formula only reached 1260ms/2535ms/2 moles at speed 1, which the
    // teacher still found too fast — so speed 1 now starts from a much slower
    // pace and every step is one equal slice of the way to speed 10.
    const pace = (speed - 1) / 9;                                            // 0 at speed 1 … 1 at speed 10
    const spawnBase = Math.round(2400 + pace * (340 - 2400));                // gap between spawns (ms)
    const upDuration = Math.round(4200 + pace * (900 - 4200));               // how long a mole stays up (ms)
    const maxConcurrent = Math.min(HOLE_LAYOUT.length, Math.round(1 + pace * 7));

    // ---------- state ----------
    let score = 0, wrongCount = 0, whacks = 0;
    let combo = 0, bestCombo = 0;
    let ended = false;
    let powerUntil = 0;                 // performance.now() ms while a power crate is active
    let spawnTimer = null;
    let clockTimer = null;
    let clockEl = null, fillEl = null, heartsEl = null;  // own topbar UI (built in ensureTimerUI)
    let endAt = 0;                      // performance.now() ms when the countdown hits 0
    const timers = new Set();           // every pending setTimeout (swept on cleanup)
    let fitter = null;                  // autoFit for the quiz sign question

    // ---------- OBJECTIVE model ----------
    // trueFalse: the "needed" answers are the ones the sign points at (TRUE, or
    // FALSE when switched). Hitting one clears it for good; missing it (it ducks)
    // keeps it in play. The other side are distractors that keep coming forever.
    // The round is COMPLETE once every needed answer has been hit.
    const targetItems = statements.filter(s => (s.answer === true) === target);   // needed
    const distractorItems = statements.filter(s => (s.answer === true) !== target); // avoid
    const remainingTargets = new Set(targetItems.map((_, i) => i));   // indices not yet hit
    let targetQueue = [];               // shuffled bag of still-needed target indices
    let distractorQueue = [];           // shuffled bag of distractor items

    // quiz mode level bookkeeping — one pass through all questions, then COMPLETE
    let qOrder = mode === "quiz" ? shuffle(questions.map((_, i) => i)) : [];
    let qPos = 0;
    let levelIndex = mode === "quiz" ? qOrder[0] : -1;
    let answerQueue = [];               // shuffled cycling answers of the current question
    let rotating = false;
    let frozen = false;                 // wrong-hit penalty: everything paused, the dizzy mole held up
    let answeredCount = 0;              // questions cleared so far

    function later(fn, ms) { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; }
    function clearTimer(t) { if (t) { clearTimeout(t); timers.delete(t); } }

    // ---------- scene ----------
    root.innerHTML = "";
    // FULL-BLEED: our absolute scene covers the whole 16:9 stage (it already
    // does, since root/playArea is static so `inset:0` resolves to the stage).
    // We keep it that way and instead FLOAT the engine chrome — the timer bar +
    // score row and the bottom buttons — ON TOP of the desert (like the original
    // Wordwall act), by lifting those two bars above the scene's stacking context.
    const stageInner = root.parentElement;   // .aw-stage-inner (topbar · playArea · bottombar)
    const chrome = stageInner ? [...stageInner.querySelectorAll(".aw-topbar, .aw-bottombar")] : [];
    chrome.forEach(e => { e.style.position = "relative"; e.style.zIndex = "5"; });
    // We drive our OWN clock/bar in ui.topbarMid, so hide the engine's timer text
    // (with manualTimerStart it just sits frozen at 0:00 in the top-left corner).
    // Use visibility (NOT display:none) so its 0-width grid column stays in place —
    // removing it would collapse the has-inline grid and shove everything left.
    const engTimer = stageInner && stageInner.querySelector(".aw-top-timer");
    if (engTimer) engTimer.style.visibility = "hidden";
    const scene = el("div", "aw-wam-scene");
    const world = el("div", "aw-wam-world");   // holds the whole picture; zooms as one unit for the intro
    const bg = el("div", "aw-wam-bg");          // sky (bg2.webp, via CSS)
    world.append(bg);

    // the hill itself is the real painted Wordwall image — mesas + prickly-pear
    // cacti + grassy base are all baked into it, so the holes sit on it directly
    const hill = el("img", "aw-wam-hill"); hill.src = imgUrl(HILL_IMG); hill.alt = "";
    world.append(hill);

    // sign
    const sign = el("div", "aw-wam-sign");
    const post = el("div", "aw-wam-post");
    const board = el("div", "aw-wam-board");
    sign.append(post, board);
    world.append(sign);

    // real cactus props at the edges (crisp foreground). The paddle cacti on the
    // ridge come baked into the hill image; these are the sharp near ones, like
    // the live original: a tall saguaro standing on the right slope + one left.
    const DECOR = [
      { img: "cactus.webp",  css: "right:-11%; bottom:8%; width:18cqw;" },   // tall saguaro — bigger + lowered so its rocky base tucks behind the front-right hill; pushed right so holes clear it
      { img: "cactus2.webp", css: "left:-10%; bottom:12%; width:17cqw;" }      // left cactus — bigger + higher, pushed further left so its right edge still clears the holes
    ];
    DECOR.forEach(d => {
      const im = el("img", "aw-wam-decor"); im.src = imgUrl(d.img); im.alt = "";
      im.style.cssText += d.css;
      world.append(im);
    });

    // holes
    const holes = HOLE_LAYOUT.map((pos, i) => {
      const hole = el("div", "aw-wam-hole");
      hole.style.left = pos.x + "%";
      hole.style.top = pos.y + "%";
      hole.style.width = pos.s + "cqw";
      hole.style.height = (pos.s * 1.35) + "cqw";   // holes are absolute-only inside; give a real box so the mole clip has height

      const holeback = el("img", "aw-wam-holeback"); holeback.src = imgUrl("holeback.webp"); holeback.alt = "";
      const molewrap = el("div", "aw-wam-molewrap");
      const mole = el("img", "aw-wam-mole"); mole.alt = "";
      const crate = el("img", "aw-wam-crate-img"); crate.alt = "";
      molewrap.append(mole, crate);
      const holefront = el("img", "aw-wam-holefront"); holefront.src = imgUrl("holefront.webp"); holefront.alt = "";
      const bubble = el("div", "aw-wam-bubble");
      const bubbleText = el("div", "aw-wam-bubble-text");
      bubble.append(bubbleText);
      const zap = el("img", "aw-wam-zap"); zap.src = imgUrl(i % 2 ? "whackzaps2.png" : "whackzaps1.png"); zap.alt = "";

      hole.append(holeback, molewrap, holefront, bubble, zap);
      molewrap.addEventListener("pointerdown", () => onWhack(state));

      const state = {
        pos, hole, mole, crate, bubble, bubbleText, zap,
        status: "empty",          // empty | rising | up | hit | ducking
        item: null, isCorrect: false, isCrate: false, crateType: null,
        duckT: null, freeT: null
      };
      return state;
    });
    holes.forEach(h => world.append(h.hole));

    // blurred foreground hills (two copies of the plain hill image) sitting in
    // front of the holes for depth of field — geometry keeps them clear of holes
    const fghills = el("div", "aw-wam-fghills");
    const fgL = el("img", "aw-wam-fghill aw-wam-fghill-l"); fgL.src = imgUrl(FRONT_HILL_IMG); fgL.alt = "";
    const fgR = el("img", "aw-wam-fghill aw-wam-fghill-r"); fgR.src = imgUrl(FRONT_HILL_IMG); fgR.alt = "";
    fghills.append(fgL, fgR);
    world.append(fghills);

    scene.append(world);
    root.append(scene);

    updateSign(false);
    ensureTimerUI();

    // ---------- sign rendering ----------
    // The question is fitted against the plank's DESIGNED height (its width ÷ the
    // painted image's aspect ratio, minus the board's padding) — not against the
    // board's own height, which grows with the text and would make the search
    // circular. The old code fitted against `root` (the WHOLE play area), so
    // `--fit` never once fired: a long question just stretched the plank to 3-4x
    // its height and hung far below the post. Measured 4/8/2026: a 47-word
    // question made the board 376px tall instead of 103px.
    // NOTE: built INSIDE updateSign, not as a `const` next to it — `updateSign()`
    // is called further up in mount(), so a const here would still be in its
    // temporal dead zone at that point (caught by the browser test, 4/8/2026).
    function plankFitBox() {
      return {
        get clientHeight() {
          const cs = getComputedStyle(board);
          const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
          return board.offsetWidth * PLANK_RATIO - padY;
        }
      };
    }
    function updateSign(animate) {
      if (animate) {
        board.classList.remove("is-rotating"); void board.offsetWidth; board.classList.add("is-rotating");
      }
      if (fitter) { fitter.destroy(); fitter = null; }
      board.innerHTML = "";
      if (mode === "quiz") {
        const q = questions[levelIndex];
        const qEl = el("div", "aw-wam-sign-question", escapeHtml(q ? q.question : ""));
        board.append(qEl);
        fitter = autoFit(plankFitBox(), board, s => board.style.setProperty("--fit", s), {
          slack: 2,
          measure: () => qEl.offsetHeight
        });
      } else {
        board.append(
          el("div", "aw-wam-sign-lead", "Hit moles that are:"),
          el("div", "aw-wam-sign-target", target ? "True" : "False")
        );
      }
    }

    // ---------- own timer row + hearts (topbarMid) ----------
    // Count down -> a clock + shrinking bar. Count up -> no bar (the round ends
    // on the objective instead). Hearts (if Lives is set) sit at the right end.
    function ensureTimerUI() {
      if (!ui.topbarMid) return;
      ui.topbarMid.innerHTML = "";
      const row = el("div", "aw-wam-topbar");
      if (timerMode === "countDown") {
        clockEl = el("div", "aw-wam-clock", formatTime(totalSeconds));
        const bar = el("div", "aw-wam-timerbar");   // flex:1 -> stretches from the clock up to the hearts
        fillEl = el("div", "aw-wam-timerbar-fill");
        bar.append(fillEl);
        row.append(clockEl, bar);
      } else {
        row.append(el("div", "aw-wam-topbar-spacer"));   // no bar in count-up -> spacer pushes hearts right
      }
      if (startLives != null) {
        heartsEl = el("div", "aw-wam-hearts");
        // reserve a FIXED width (for the full set of hearts) so the timer bar's
        // right edge stays put as hearts are lost; hearts pack to the right.
        const w = startLives <= 5 ? (startLives * 2.8 - 0.5) : 5.5;   // 2.3cqw heart + 0.5cqw gap pitch
        heartsEl.style.width = w + "cqw";
        row.append(heartsEl);
      }
      ui.topbarMid.append(row);
      renderLives();
    }
    function startClock() {
      endAt = performance.now() + totalSeconds * 1000;
      let lastTickSlot = Math.ceil(totalSeconds);
      clockTimer = setInterval(() => {
        if (ended) return;
        const remaining = Math.max(0, (endAt - performance.now()) / 1000);
        if (clockEl) clockEl.textContent = formatTime(Math.ceil(remaining));
        if (fillEl) {
          fillEl.style.width = Math.max(0, Math.min(100, (remaining / totalSeconds) * 100)) + "%";
          fillEl.classList.toggle("is-orange", remaining <= 30 && remaining > 10);   // 30s left -> orange
          fillEl.classList.toggle("is-red", remaining <= 10);                          // 10s left -> red
        }
        // tick sound: once/sec in the last 10s, twice/sec in the last 5s
        const slot = remaining > 5 ? Math.ceil(remaining) : Math.ceil(remaining * 2) / 2;
        if (remaining <= 10 && slot < lastTickSlot && remaining > 0) { lastTickSlot = slot; wamSound.clockTick(); }
        if (remaining <= 0) endGame("time");
      }, 200);
    }
    function addTime(sec) {
      endAt += sec * 1000;
      const remaining = Math.max(0, (endAt - performance.now()) / 1000);
      if (clockEl) clockEl.textContent = formatTime(Math.ceil(remaining));
    }

    // ---------- lives ----------
    function renderLives() {
      if (!heartsEl) return;
      heartsEl.innerHTML = "";
      if (livesLeft == null) return;
      if (livesLeft <= 5) {
        for (let i = 0; i < livesLeft; i++) heartsEl.append(el("span", "aw-wam-heart", "&#9829;"));
      } else {
        heartsEl.append(el("span", "aw-wam-heartcount", String(livesLeft)));
        heartsEl.append(el("span", "aw-wam-heart", "&#9829;"));
      }
    }
    // returns true when THAT was the last life (caller should game-over)
    function loseLife() {
      if (livesLeft == null) return false;
      const gone = (livesLeft <= 5 && heartsEl) ? heartsEl.firstChild : null;
      livesLeft = Math.max(0, livesLeft - 1);
      if (gone) {
        let done = false;
        const fin = () => { if (done) return; done = true; renderLives(); };
        try {
          const a = gone.animate([{ transform: "scale(1)", opacity: 1 }, { transform: "scale(1.7)", opacity: 0 }],
            { duration: 320, easing: "ease-in", fill: "forwards" });
          a.onfinish = fin;
        } catch (e) { fin(); }
        later(fin, 360);
      } else { renderLives(); }
      return livesLeft <= 0;
    }

    // ---------- content pickers ----------
    function nextAnswer() {
      if (!answerQueue.length) answerQueue = shuffle(questions[levelIndex].answers.slice());
      return answerQueue.pop();
    }
    function nextTargetIdx() {              // a still-needed target index (skips ones hit since shuffling)
      if (!targetQueue.length) targetQueue = shuffle([...remainingTargets]);
      while (targetQueue.length) { const idx = targetQueue.pop(); if (remainingTargets.has(idx)) return idx; }
      return -1;
    }
    function nextDistractor() {
      if (!distractorQueue.length) distractorQueue = shuffle(distractorItems.slice());
      return distractorQueue.pop();
    }
    // Pick content for a fresh mole, avoiding a bubble identical to one already up.
    function pickItem() {
      const activeTexts = new Set(holes.filter(h => h.status !== "empty" && h.item).map(h => h.item.text));
      if (mode === "quiz") {
        for (let tries = 0; tries < 6; tries++) {
          const a = nextAnswer();
          if (!activeTexts.has(a.text) || tries === 5) return { text: a.text, isCorrect: !!a.correct };
        }
        return { text: "", isCorrect: false };
      }
      // trueFalse: mix still-needed targets with distractors
      for (let tries = 0; tries < 8; tries++) {
        const wantTarget = remainingTargets.size > 0 && (distractorItems.length === 0 || Math.random() < TARGET_RATIO);
        if (wantTarget) {
          const idx = nextTargetIdx();
          if (idx >= 0) { const it = targetItems[idx]; if (!activeTexts.has(it.text) || tries === 7) return { text: it.text, isCorrect: true, targetIdx: idx }; }
        } else if (distractorItems.length) {
          const d = nextDistractor();
          if (!activeTexts.has(d.text) || tries === 7) return { text: d.text, isCorrect: false, targetIdx: -1 };
        }
      }
      if (remainingTargets.size > 0) { const idx = nextTargetIdx(); if (idx >= 0) return { text: targetItems[idx].text, isCorrect: true, targetIdx: idx }; }
      const d = distractorItems.length ? nextDistractor() : { text: "" };
      return { text: d.text || "", isCorrect: false, targetIdx: -1 };
    }

    // ---------- spawning ----------
    function spawnInterval() { return spawnBase + randi(400) - 100; }
    function scheduleSpawn() { spawnTimer = later(spawnTick, spawnInterval()); }
    function spawnTick() {
      if (ended) return;
      if (!rotating && !frozen) {
        const empty = holes.filter(h => h.status === "empty");
        const active = holes.length - empty.length;
        if (empty.length && active < maxConcurrent) {
          const h = empty[randi(empty.length)];
          if (cratesOn && Math.random() < CRATE_CHANCE) spawnCrate(h);
          else spawnMole(h);
        }
      }
      scheduleSpawn();
    }

    function spawnMole(h) {
      const item = pickItem();
      h.item = item; h.isCorrect = item.isCorrect; h.targetIdx = item.targetIdx; h.isCrate = false; h.crateType = null; h.status = "rising";
      const variant = MOLE_VARIANTS[randi(MOLE_VARIANTS.length)];
      h.mole.src = imgUrl(variant + "ready.webp");
      h.mole.dataset.variant = variant;
      h.crate.style.display = "none";
      h.mole.style.display = "";
      h.bubble.className = "aw-wam-bubble" + (Math.random() < 0.5 ? " aw-wam-bubble-b" : "");
      h.bubbleText.innerHTML = escapeHtml(item.text);
      h.hole.classList.remove("is-hit", "is-crate");
      h.hole.classList.add("is-up");
      wamSound.mole();
      later(() => { if (h.status === "rising") h.status = "up"; }, 260);
      h.duckT = later(() => duck(h, true), upDuration);
    }

    function spawnCrate(h) {
      const type = pickWeighted(enabledCrates);
      h.item = null; h.isCrate = true; h.crateType = type.key; h.isCorrect = false; h.targetIdx = -1; h.status = "rising";
      h.mole.style.display = "none";
      h.crate.style.display = "";
      h.crate.src = imgUrl(type.img);
      h.bubble.className = "aw-wam-bubble";
      h.bubbleText.textContent = "";
      h.hole.classList.remove("is-hit");
      h.hole.classList.add("is-crate");
      wamSound.crate();
      later(() => { if (h.status === "rising") h.status = "up"; }, 260);
      h.duckT = later(() => duck(h, false), Math.round(upDuration * 1.15));
    }

    // duck back down (missed). `wasMole` -> play the disappear sound.
    function duck(h, wasMole) {
      if (h.status === "empty" || h.status === "ducking") return;
      clearTimer(h.duckT); h.duckT = null;
      h.status = "ducking";
      h.hole.classList.remove("is-up", "is-crate", "is-dizzy");
      if (wasMole && !h.isCrate) { wamSound.disappear(); combo = 0; }
      h.freeT = later(() => freeHole(h), 300);
    }
    function freeHole(h) {
      clearTimer(h.freeT); h.freeT = null;
      h.status = "empty"; h.item = null; h.isCrate = false; h.isCorrect = false;
      h.hole.classList.remove("is-up", "is-hit", "is-crate", "is-dizzy");
      h.bubbleText.textContent = "";
    }

    // ---------- whacking ----------
    function onWhack(h) {
      if (ended || (h.status !== "up" && h.status !== "rising")) return;
      clearTimer(h.duckT); h.duckT = null;
      h.status = "hit";
      h.hole.classList.add("is-hit");
      whacks++;

      if (h.isCrate) { hitCrate(h); return; }

      // swap to tapped, then dizzy, sprite
      const v = h.mole.dataset.variant || "mole01";
      h.mole.src = imgUrl(v + "tapped.webp");
      later(() => { if (h.mole) h.mole.src = imgUrl(v + "dizzy.webp"); }, 150);

      if (h.isCorrect) {
        popZap(h);
        popMark(h, true);
        wamSound.correct();
        combo++; bestCombo = Math.max(bestCombo, combo);
        const power = performance.now() < powerUntil;
        let pts = power ? 2 : 1;
        let comboBonus = 0;
        if (combo >= COMBO_THRESHOLD) { comboBonus = Math.min(5, combo - COMBO_THRESHOLD + 1); wamSound.combo(); floatText(h, "COMBO x" + combo, "is-combo"); }
        pts += comboBonus;
        score += pts;
        ui.setScore(score);
        floatText(h, "+" + pts, "is-plus");
        if (mode === "quiz") { onQuizCorrect(); }
        else {
          // this needed answer is cleared (won't reappear this wave)
          if (h.targetIdx >= 0) remainingTargets.delete(h.targetIdx);
          if (remainingTargets.size === 0) {
            if (timerMode === "countUp") later(() => endGame("complete"), 650);   // objective mode -> WIN
            else { targetItems.forEach((_, i) => remainingTargets.add(i)); targetQueue = []; }  // countdown -> new wave, keep going till time's up
          }
        }
        h.freeT = later(() => { h.hole.classList.remove("is-up"); later(() => freeHole(h), 300); }, 520);
      } else {
        // WRONG -> a time penalty: keep THIS dizzy mole on the ground, duck every
        // other mole and pause all spawning for a few seconds, then resume.
        popMark(h, false);
        wamSound.wrong();
        combo = 0;
        wrongCount++;
        if (penalty > 0) { score = Math.max(0, score - penalty); ui.setScore(score); floatText(h, "–" + penalty, "is-minus"); }
        const outOfLives = loseLife();
        if (outOfLives) {
          later(() => endGame("gameover"), 600);
          h.freeT = later(() => { h.hole.classList.remove("is-up"); later(() => freeHole(h), 300); }, 520);
        } else {
          // The freeze lasts as long as the "Punishment" option says (0 = none:
          // the mole just ducks and play carries straight on).
          frozen = true;
          const wobble = freezeMs >= PUNISH_MIN_WOBBLE_MS;
          if (wobble) floatText(h, "WAIT…", "is-minus");
          holes.forEach(o => { if (o !== h && (o.status === "up" || o.status === "rising")) duck(o, false); });
          // ...and the mole itself staggers about, dizzy, for the whole penalty —
          // it only ducks once the freeze is over. Starts with the dizzy sprite
          // (swapped 150ms after the hit) so the wobble matches the picture.
          if (wobble) later(() => { if (h.status === "hit") h.hole.classList.add("is-dizzy"); }, 150);
          h.freeT = later(() => {
            h.hole.classList.remove("is-dizzy", "is-up");
            later(() => freeHole(h), 300);
            frozen = false;
          }, freezeMs);
        }
      }
    }

    function hitCrate(h) {
      popZap(h);
      const t = h.crateType;
      if (t === "time") { addTime(5); wamSound.crateTime(); floatText(h, "+5s", "is-combo"); }
      else if (t === "loot") { score += 5; ui.setScore(score); wamSound.crateLoot(); floatText(h, "+5", "is-plus"); }
      else if (t === "power") { powerUntil = performance.now() + POWER_MS; wamSound.cratePower(); floatText(h, "POWER!", "is-combo"); scene.classList.add("is-power"); later(() => { if (performance.now() >= powerUntil) scene.classList.remove("is-power"); }, POWER_MS + 60); }
      h.freeT = later(() => { h.hole.classList.remove("is-crate"); later(() => freeHole(h), 300); }, 520);
    }

    // quiz: a correct answer clears the level. After the LAST question the round
    // is complete (one pass through all questions — no endless looping).
    function onQuizCorrect() {
      if (rotating) return;
      rotating = true;
      answeredCount++;
      wamSound.levelComplete();
      // duck any moles still carrying the old question's answers
      holes.forEach(h => { if (h.status === "up" || h.status === "rising") duck(h, false); });
      const allDone = answeredCount >= questions.length;
      if (allDone && timerMode === "countUp") { later(() => endGame("complete"), 650); return; }  // objective mode -> WIN
      if (allDone) { answeredCount = 0; qOrder = shuffle(questions.map((_, i) => i)); qPos = -1; }  // countdown -> loop, keep going till time's up
      later(() => {
        qPos = qPos + 1;
        levelIndex = qOrder[qPos];
        answerQueue = [];
        wamSound.tableRotation();
        updateSign(true);
        later(() => { wamSound.nextLevel(); rotating = false; }, 260);
      }, 620);
    }

    // ---------- effects ----------
    function popZap(h) {
      h.zap.classList.remove("is-on"); void h.zap.offsetWidth; h.zap.classList.add("is-on");
      later(() => h.zap.classList.remove("is-on"), 460);
    }
    // a plain green ✓ (right mole) or red ✗ (wrong mole) that pops over the mole —
    // white outline (wider stroke underneath) so it reads on the sandy hill
    const MARK_OK = '<svg viewBox="0 0 24 24">'
      + '<path d="M4.5 12.5l4.5 4.5 10.5-11.5" fill="none" stroke="#fff" stroke-width="7.5" stroke-linecap="round" stroke-linejoin="round"/>'
      + '<path d="M4.5 12.5l4.5 4.5 10.5-11.5" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const MARK_NO = '<svg viewBox="0 0 24 24">'
      + '<path d="M6 6l12 12M18 6L6 18" fill="none" stroke="#fff" stroke-width="7.5" stroke-linecap="round"/>'
      + '<path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>';
    function popMark(h, ok) {
      const m = el("div", "aw-wam-mark " + (ok ? "is-ok" : "is-no"));
      m.innerHTML = ok ? MARK_OK : MARK_NO;
      m.style.left = h.pos.x + "%";
      m.style.top = (h.pos.y - h.pos.s * 0.28) + "%";
      world.append(m);
      void m.offsetWidth; m.classList.add("is-on");
      later(() => m.remove(), 720);
    }
    function floatText(h, text, cls) {
      const f = el("div", "aw-wam-float " + cls, text);
      f.style.left = h.pos.x + "%";
      f.style.top = (h.pos.y - h.pos.s * 0.5) + "%";
      world.append(f);
      void f.offsetWidth; f.classList.add("is-fly");
      later(() => f.remove(), 850);
    }

    // ---------- end of game ----------
    let endReason = "time";
    ui.onSubmit(() => endGame("submit"));   // menu "Submit answers" ends early too
    function endGame(reason) {
      if (ended) return;
      endReason = reason || "time";
      ended = true;
      if (spawnTimer) clearTimer(spawnTimer);
      if (clockTimer) { clearInterval(clockTimer); clockTimer = null; }
      timers.forEach(t => clearTimeout(t)); timers.clear();
      holes.forEach(h => { h.hole.classList.remove("is-up", "is-crate", "is-dizzy"); });

      // Brief score tally, then hand off to the engine's celebration/summary.
      // The tally takes over the SIGN (teacher, 4/8/2026): the question / "Hit
      // moles that are: TRUE" clears out and the number counts up on the plank,
      // post still standing behind it, like a real scoreboard. (It used to be a
      // huge number floating over the middle of the desert, which then had to be
      // removed again so it wouldn't sit on top of "TIME'S UP".)
      if (fitter) { fitter.destroy(); fitter = null; }
      board.classList.remove("is-rotating");
      board.classList.add("is-score");
      board.innerHTML = "";
      const tally = el("div", "aw-wam-sign-score", "0");
      board.append(el("div", "aw-wam-sign-lead", "SCORE"), tally);
      wamSound.pointsCounting();
      const startT = performance.now(); const DUR = 900;
      let done = false;
      const finishTally = () => {
        if (done) return; done = true;
        tally.textContent = String(score);
        wamSound.pointsCounted();
        setTimeout(reallyFinish, 500);   // the score STAYS on the sign behind the summary
      };
      const step = () => {
        if (done) return;
        const t = Math.min(1, (performance.now() - startT) / DUR);
        tally.textContent = String(Math.round(score * (1 - Math.pow(1 - t, 3))));
        if (t < 1) requestAnimationFrame(step); else finishTally();
      };
      requestAnimationFrame(step);
      setTimeout(finishTally, DUR + 200);   // absolute fallback (rAF can stall in a hidden tab)
    }

    function reallyFinish() {
      const review = mode === "quiz"
        ? questions.map(q => ({ question: q.question, answered: false, yourText: null, yourCorrect: false, correctText: (q.answers.find(a => a.correct) || {}).text || "" }))
        : statements.map(s => ({ question: s.text, answered: false, yourText: null, yourCorrect: false, correctText: s.answer ? "True" : "False" }));
      const total = score + wrongCount;
      const perQuestion = [];
      for (let i = 0; i < score; i++) perQuestion.push({ q: i, correct: true });
      for (let i = 0; i < wrongCount; i++) perQuestion.push({ q: score + i, correct: false });
      const title = endReason === "gameover" ? "Game over" : endReason === "complete" ? "Complete!" : "Time's up";
      ui.finish({ correct: score, incorrect: wrongCount, total, perQuestion, review, answered: whacks, title });
    }

    // ---------- go (intro camera, then play) ----------
    // Start pulled back so the far mesas read big, hold a beat, then zoom the
    // whole world in to the play framing. Clock + spawns wait until we've
    // settled so no seconds are lost during the fly-in. (is-intro is set before
    // the first paint, so there's no flash — only the zoom-IN animates.)
    wamSound.go();
    world.classList.add("is-intro");
    void world.offsetWidth;                                    // lock the wide state as the starting frame
    later(() => world.classList.remove("is-intro"), INTRO_HOLD);
    later(() => {
      if (ended) return;
      if (timerMode === "countDown") startClock();             // count up has no bar; ends on the objective
      scheduleSpawn();
    }, INTRO_HOLD + INTRO_ZOOM);

    // ---------- cleanup ----------
    return function cleanup() {
      ended = true;
      if (spawnTimer) clearTimeout(spawnTimer);
      if (clockTimer) clearInterval(clockTimer);
      timers.forEach(t => clearTimeout(t)); timers.clear();
      if (fitter) fitter.destroy();
      if (ui.topbarMid) ui.topbarMid.innerHTML = "";
      chrome.forEach(e => { e.style.position = ""; e.style.zIndex = ""; });   // drop the chrome back to normal flow
      if (engTimer) engTimer.style.visibility = "";
    };
  }
};

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

registerTemplate(wamTemplate);
export default wamTemplate;
