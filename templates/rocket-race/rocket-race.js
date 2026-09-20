// =============================================================
// TEMPLATE: ROCKET RACE — a space race you win by answering English questions.
//
//  • SOLO (default, and the only mode a pupil gets on a homework link): your
//    rocket races 3–5 computer rockets to the chequered finish line. A question
//    sits under the track with 2–6 answer tiles.
//      – Right tile → your rocket FIRES one segment forward (whoosh, ✓ flies).
//      – Wrong tile → the engine STALLS (shake + smoke), you lose a heart (if
//                     lives are on), "−N" flies to the score (if Points off is
//                     on), and the question goes to the back of the queue — you
//                     keep going until you get it right (Maze chase's rule).
//      – 3 right in a row → TURBO: double flame, "TURBO!" banner, rivals lose
//                     speed for a few seconds. Progress itself never changes:
//                     ONE right answer = ONE segment, always (teacher's rule A,
//                     20/9/2026 — the score stays "questions right").
//      – Power-ups (Options): a crate drifts into your lane every few right
//        answers; the next right answer collects it — 🛡 shield (absorbs the
//        next stall: no heart, no shake), 🚀 turbo, ☄ meteor (the leading
//        rival is knocked back). Never a segment, so never a point.
//      – Rivals move on their own clock (Rival speed) with a light rubber band
//        so the race stays close; whoever crosses first is 1st. Your PLACE is
//        the headline of the end panel; your SCORE is still right / total.
//  • TEAMS (teacher's screen only): the rockets are teams of the class. Turns
//    go round the teams (and, if a class is picked, round its pupils); a right
//    answer moves that team's rocket, a wrong one stalls it and the question
//    is spent. The race ends when every team's questions are used up.
//  • Real-time WITHOUT requestAnimationFrame (a hidden tab freezes rAF — core
//    rule): one setInterval tick with a delta clamp drives rivals, the question
//    clock and the crate. CSS transitions do the smoothing.
//  • Fixed SPACE look (does not recolour per theme) — same call as Maze chase.
//    Art is inline SVG + emoji; the three planets are copies of Maze chase's
//    (templates never import across folders, copying files is the convention).
//
//  Data model "A" (like Quiz): activity.content.questions[] =
//     { question, answers:[ { text, correct? } ] }  (exactly one correct).
// =============================================================

import { registerTemplate } from "../../core/registry.js";
import { shuffle, el } from "../../core/utils.js";
import { press } from "../../core/press.js";
import { icons } from "../../core/icons.js";
import { fitOnce } from "../../core/fit.js";
import { createVoicePlayer, voiceView, DEFAULT_INTRO_DELAY_MS } from "../../core/voice-playback.js";
import { rrSound } from "./rr-sound.js";
import { openRocketRaceEditor } from "./rocket-race-editor.js";

function imgUrl(name) { return new URL(`./img/${name}`, import.meta.url).href; }

function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// ---- tuning ----
const TICK_MS = 50;                  // one physics step
const MAX_LIVES = 10;
const MAX_ROCKETS = 6;               // lanes on the track (1 player + up to 5 rivals, or up to 6 teams)
const STALL_MS = 1100;               // engine sputter after a wrong answer
const ANSWER_HOLD_MS = 800;          // pause on a resolved question before the next one
const TURBO_MS = 4500;               // afterburner window
const TURBO_STREAK = 3;              // right answers in a row that light the afterburner
const CRATE_EVERY = 4;               // a crate every N right answers (first one after 3)
const RIVAL_SLOW_TURBO = 0.72;       // rivals' speed while the player is in turbo
const FINISH_BANNER_MS = 1700;       // "1ST PLACE!" on screen before the end panel
const TRACK_START = 5;               // rocket x (% of track width) at the start line
const TRACK_END = 86;                // rocket x at the finish line
// Seconds a rival "needs" per segment — what Rival speed means in plain terms.
const RIVAL_SECS = { slow: 10, normal: 7, fast: 5 };

// Answer tiles: the Quiz palette, shuffled per game so each answer position
// keeps one colour for the whole race.
const PALETTE = [
  { c: "#3b82f6", d: "#2563eb" }, { c: "#06b6d4", d: "#0e93ad" },
  { c: "#10b981", d: "#059669" }, { c: "#f59e0b", d: "#d97706" },
  { c: "#f97316", d: "#ea580c" }, { c: "#ef4444", d: "#dc2626" },
  { c: "#14b8a6", d: "#0f9488" }, { c: "#8b5cf6", d: "#7c3aed" }
];
// Rocket hulls — the player's is always the first (gold); rivals / teams take
// the rest in order so a team keeps its colour from setup to podium.
const HULLS = [
  { c: "#ffd54a", d: "#c9950a", n: "gold" },
  { c: "#ff6b81", d: "#b8233a", n: "red" },
  { c: "#4fc3f7", d: "#0d78b4", n: "blue" },
  { c: "#7ee787", d: "#1f8f3a", n: "green" },
  { c: "#c77dff", d: "#7b2fc4", n: "purple" },
  { c: "#ffa552", d: "#c25e0a", n: "orange" }
];
const PILOTS = ["🐱", "🐶", "🦊", "🐼", "🐸", "🐧", "🐨", "🐯"];
const RIVAL_NAMES = ["Mia", "Leo", "Zoe", "Noah", "Aria", "Liam", "Kai", "Ella"];

const ROCKET_SVG = `<svg viewBox="0 0 160 70" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path class="aw-rr-fin" d="M34 16 L10 4 L26 30 Z"/>
  <path class="aw-rr-fin" d="M34 54 L10 66 L26 40 Z"/>
  <path class="aw-rr-hull" d="M22 35 C22 14 46 8 92 8 C126 8 148 24 158 35 C148 46 126 62 92 62 C46 62 22 56 22 35 Z"/>
  <path class="aw-rr-hull-hi" d="M40 22 C58 15 90 14 118 17 C100 12 60 12 40 22 Z"/>
  <path class="aw-rr-nose" d="M128 14 C142 20 152 28 158 35 C152 42 142 50 128 56 Z"/>
  <ellipse class="aw-rr-tail" cx="26" cy="35" rx="7" ry="13"/>
  <circle class="aw-rr-port" cx="82" cy="35" r="16"/>
</svg>`;
const FLAME_SVG = `<svg viewBox="0 0 90 50" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path class="aw-rr-flame-out" d="M88 25 C70 4 30 4 2 25 C30 46 70 46 88 25 Z"/>
  <path class="aw-rr-flame-in" d="M88 25 C74 14 46 14 26 25 C46 36 74 36 88 25 Z"/>
</svg>`;
const CRATE_ICON = { shield: "🛡", turbo: "🚀", meteor: "☄" };
const CRATE_NAME = { shield: "SHIELD", turbo: "TURBO", meteor: "METEOR" };
const MEDAL = ["🥇", "🥈", "🥉"];

function placeWord(n) {
  const m100 = n % 100, m = n % 10;
  const suf = (m100 >= 11 && m100 <= 13) ? "th" : m === 1 ? "st" : m === 2 ? "nd" : m === 3 ? "rd" : "th";
  return n + suf;
}
function clampInt(v, lo, hi, dflt) {
  const n = Number(v);
  if (!Number.isFinite(n)) return dflt;
  return Math.max(lo, Math.min(hi, Math.round(n)));
}
// Lives are opt-in: 0 / null / undefined → unlimited (same rule as Quiz).
function normLives(v) {
  if (v == null || v === 0) return null;
  return Math.min(MAX_LIVES, Math.max(1, Math.round(v)));
}
function fitText(box, txt) {
  const apply = s => txt.style.setProperty("--fit", s);
  fitOnce(box, txt, apply, { slack: 1 });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => fitOnce(box, txt, apply, { slack: 1 })).catch(() => {});
}
// Width-only shrink for a single-line label (see Maze chase for why fitOnce
// can't be reused here: Baloo's tall metrics false-trigger its height check).
function fitLabelWidth(node, min = 0.4) {
  const run = () => {
    node.style.setProperty("--tw", "1");
    if (node.scrollWidth <= node.clientWidth) return;
    let lo = min, hi = 1, best = min;
    for (let i = 0; i < 12; i++) {
      const mid = (lo + hi) / 2;
      node.style.setProperty("--tw", mid);
      if (node.scrollWidth > node.clientWidth) hi = mid; else { best = mid; lo = mid; }
    }
    node.style.setProperty("--tw", best);
  };
  run();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(run).catch(() => {});
}

// Menu pause (Đợt 91) bridge — module-level, AWord mounts one activity at a time.
let rrPauseHandlers = null;

const rocketRaceTemplate = {
  type: "rocket_race",
  scorable: true,
  name: "Rocket race",
  // "Start with mistakes": which array in activity.content holds the items.
  itemsKey: "questions",
  // Hearts in the top bar, left of the score (same slot as Quiz / True-false).
  hasLivesSlot: true,
  // The clock waits for the 3-2-1 — the template calls ui.startTimer() at GO.
  manualTimerStart: true,
  // The two shared switches this game genuinely obeys (Đợt 143: declare, don't assume).
  usesShuffleAnswers: true,
  // Thứ tự ô tích theo CỘT (Đợt 213b) — mã định danh, không phải chữ hiện ra.
  checkOrder: ["shuffle", "shuffleAnswers", "showAnswers"],
  // Planets are dropped in by JS (not CSS) so the engine's CSS scan can't see them.
  preloadImages: ["bigplanet.webp", "greenplanet.webp", "sun.webp"].map(imgUrl),

  edit: openRocketRaceEditor,

  sounds: {
    play: () => {},          // the 3-2-1 has its own sound; a jingle here would collide
    restart: () => {}
    // no `complete` → engine's own fanfare plays over the end panel
  },

  toPrintItems(activity) {
    return (activity.content?.questions || [])
      .filter(q => q && Array.isArray(q.answers) && q.answers.length)
      .map(q => ({
        clue: q.question || "",
        answer: (q.answers.find(a => a.correct) || q.answers[0] || {}).text || "",
        options: q.answers.filter(a => a && a.text != null).map(a => ({ text: a.text, correct: !!a.correct }))
      }));
  },

  // Options panel extras (engine calls this — CONG THUC MAU §5).
  buildExtraOptions({ panel, draft, mkCell, mkSeg, mkSliderCell, addCheck }) {
    const cur = Number.isInteger(draft.lives) ? Math.min(MAX_LIVES, Math.max(0, draft.lives)) : 0;
    const lives = mkSliderCell({
      label: "Lives", min: 0, max: MAX_LIVES, step: 1, value: cur, tone: "green", offAt: 0,
      fmt: v => (v === 0 ? "∞" : String(v)),
      onInput: v => { draft.lives = v; }        // 0 stored = unlimited
    });
    lives.cell.title = "0 = unlimited lives";

    const mode = mkCell({ label: "Mode" });
    mode.ctl.append(mkSeg(
      [{ value: "solo", label: "Solo", title: "One player races the computer rockets" },
       { value: "teams", label: "Teams", title: "The rockets are teams of the class (teacher's screen)" }],
      draft.rrMode === "teams" ? "teams" : "solo",
      v => { draft.rrMode = v; }));

    const speed = mkCell({ label: "Rival speed" });
    speed.ctl.append(mkSeg(
      [{ value: "slow", label: "Slow" }, { value: "normal", label: "Normal" }, { value: "fast", label: "Fast" }],
      RIVAL_SECS[draft.rrSpeed] ? draft.rrSpeed : "normal",
      v => { draft.rrSpeed = v; }));

    panel.append(
      lives.cell,
      mode.cell,
      mkSliderCell({
        label: "Rivals", sub: "solo", min: 3, max: 5, step: 1,
        value: clampInt(draft.rrRivals, 3, 5, 4), tone: "blue",
        onInput: v => { draft.rrRivals = v; }
      }).cell,
      mkSliderCell({
        label: "Teams", sub: "teams mode", min: 2, max: MAX_ROCKETS, step: 1,
        value: clampInt(draft.rrTeams, 2, MAX_ROCKETS, 2), tone: "blue",
        onInput: v => { draft.rrTeams = v; }
      }).cell,
      speed.cell,
      mkSliderCell({
        label: "Question time", min: 0, max: 60, step: 1,
        value: clampInt(draft.rrQuestionSeconds, 0, 60, 0), tone: "amber", offAt: 0,
        fmt: v => (v === 0 ? "∞" : v + "s"),
        onInput: v => { draft.rrQuestionSeconds = v; }
      }).cell
    );

    addCheck("Power-ups", draft.rrPowerups !== false, v => draft.rrPowerups = v,
      { key: "rrPowerups", title: "Crates on the track: shield, turbo, meteor (solo mode)" });
  },

  mount(root, activity, ui) {
    const opt = activity.options || {};
    const pointsOff = Math.max(0, Math.min(100, Number(opt.pointsOff) || 0));
    let items = (activity.content?.questions || [])
      .filter(q => q && Array.isArray(q.answers) && q.answers.some(a => a && a.correct) && q.answers.length >= 2);
    if (opt.shuffleQuestions) items = shuffle(items);
    const N = items.length;

    // Teacher vs pupil device: the engine strips its toolbar under the frame in
    // student mode (same signal Running team relies on). Teams mode is a
    // classroom thing — a homework link always races solo.
    const isTeacher = !!document.querySelector(".aw-below-right");
    const teamsMode = opt.rrMode === "teams" && isTeacher;
    const rivalCount = clampInt(opt.rrRivals, 3, 5, 4);
    const teamCount = clampInt(opt.rrTeams, 2, MAX_ROCKETS, 2);
    const rivalSecs = RIVAL_SECS[opt.rrSpeed] || RIVAL_SECS.normal;
    const powerups = opt.rrPowerups !== false && !teamsMode;
    const questionMs = clampInt(opt.rrQuestionSeconds, 0, 60, 0) * 1000;   // 0 = untimed

    // ---- scene ----
    root.innerHTML = "";
    const stage = el("div", "aw-rr-stage" + (teamsMode ? " is-teams" : ""));
    const sky = el("div", "aw-rr-sky");
    sky.append(el("div", "aw-rr-stars is-far"), el("div", "aw-rr-stars is-near"),
      Object.assign(el("img", "aw-rr-planet is-sun"), { src: imgUrl("sun.webp"), alt: "" }),
      Object.assign(el("img", "aw-rr-planet is-big"), { src: imgUrl("bigplanet.webp"), alt: "" }),
      Object.assign(el("img", "aw-rr-planet is-green"), { src: imgUrl("greenplanet.webp"), alt: "" }));
    const minimap = el("div", "aw-rr-minimap");
    const track = el("div", "aw-rr-track");
    const lanesEl = el("div", "aw-rr-lanes");
    const finishEl = el("div", "aw-rr-finish");
    finishEl.style.left = (TRACK_END + 7) + "%";
    track.append(finishEl, lanesEl);
    const fxLayer = el("div", "aw-rr-fx");
    const banner = el("div", "aw-rr-banner");
    const panel = el("div", "aw-rr-panel");
    const turnChip = el("div", "aw-rr-turn");
    const qBox = el("div", "aw-rr-q");
    const qText = el("div", "aw-rr-qtext");
    qBox.append(qText);
    const qTimer = el("div", "aw-rr-qtimer");
    const qTimerBar = el("div", "aw-rr-qtimer-bar");
    qTimer.append(qTimerBar);
    const answersEl = el("div", "aw-rr-answers");
    panel.append(turnChip, qBox, qTimer, answersEl);
    stage.append(sky, minimap, track, fxLayer, panel, banner);
    root.append(stage);

    if (N === 0) {
      qText.textContent = "No questions yet.";
      return () => {};
    }

    // ---- state ----
    const state = items.map(() => ({ correct: false, wrong: [], attempts: 0, answeredWith: null }));
    let dead = false;                      // mount torn down (cleanup) — the only brake for bare callbacks
    let finished = false;                  // the race has ended (finish() ran)
    let running = false;                   // physics on (between GO and the finish)
    let locked = true;                     // tiles ignore taps (countdown / hold / stall)
    let penalty = 0;
    let streak = 0;
    let turnNo = 0;                        // questions asked so far (turns)
    let endTitle = null;
    let tickTimer = null, last = 0;
    const timers = new Set();
    const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); if (!dead) fn(); }, ms); timers.add(id); return id; };
    const clearLater = id => { clearTimeout(id); timers.delete(id); };
    let livesLeft = normLives(opt.lives);
    const tilePalette = shuffle(PALETTE);
    const voicePlayer = createVoicePlayer();
    let firstQuestionSpoken = false;
    let qDeadline = 0, qTickAt = 0;        // question clock (absolute deadline, shifted on pause)
    let turboUntil = 0;
    let shield = false;
    let crate = null;                      // { kind, el } — a power-up waiting in the player's lane
    let cratesEarned = 0;
    let finishedCount = 0;                 // rockets over the line (rank = finishedCount + 1)
    let curItem = -1;                      // index into items of the question on screen
    let tiles = [];

    // ---- rockets ----
    // Each rocket: { id, name, pilot, hull, p (segments), L (segments to finish),
    //   rate (segments/s, rivals only), el, tag, dot, done, place, stunUntil,
    //   queue (teams: item indices), pupils (teams: names), pupilPtr }
    let rockets = [];
    let player = null;                     // solo: the pupil's rocket
    let queue = shuffle(items.map((_, i) => i));   // solo question order (wrong → back of the queue)
    let teamPtr = 0;                       // teams: whose turn
    // ⚠️ TDZ: declared HERE, above the first call into renderSetup() — a `let`
    // written next to the function that uses it is a ReferenceError at mount.
    let setupEl = null, classes = null, classError = "", pickedClassId = "";

    if (teamsMode) buildTeams(); else buildSolo();
    renderRockets();
    renderLives();
    ui.setScore(0);
    ui.onSubmit(finish, () => state.filter(s => s.attempts > 0).length);
    window.addEventListener("keydown", onKey);

    // ----- Menu pause (Đợt 91) — delta loop: stop / start again is enough,
    // but the question clock is an absolute deadline, so shift it.
    let pausedAt = 0, wasRunning = false;
    function pauseGame() {
      wasRunning = !!tickTimer;
      if (tickTimer) { clearInterval(tickTimer); tickTimer = null; }
      pausedAt = performance.now();
      rrSound.hum.stop();
    }
    function resumeGame() {
      if (finished || dead) return;
      if (pausedAt) {
        const gap = performance.now() - pausedAt;
        if (qDeadline) qDeadline += gap;
        if (turboUntil) turboUntil += gap;
        rockets.forEach(r => { if (r.stunUntil) r.stunUntil += gap; });
        pausedAt = 0;
      }
      if (wasRunning) { last = performance.now(); tickTimer = setInterval(tick, TICK_MS); if (running) rrSound.hum.start(); }
      wasRunning = false;
    }
    rrPauseHandlers = { pause: pauseGame, resume: resumeGame };

    if (teamsMode) renderSetup(); else startCountdown();

    // =========================================================
    // building the grid of rockets
    // =========================================================
    function mkRocket(i, name, pilot, hull, isPlayer) {
      return { id: i, name, pilot, hull, isPlayer, p: 0, L: N, rate: 0, el: null, tag: null, dot: null,
               done: false, place: 0, stunUntil: 0, queue: [], pupils: [], pupilPtr: 0, wobble: Math.random() * 6.28 };
    }
    function buildSolo() {
      const names = shuffle(RIVAL_NAMES).slice(0, rivalCount);
      const pilots = shuffle(PILOTS);
      rockets = [];
      for (let i = 0; i < rivalCount; i++) {
        const r = mkRocket(i + 1, names[i], pilots[i], HULLS[(i + 1) % HULLS.length], false);
        // personalities: spread 0.86 … 1.14 so one rival is quick and one is lazy
        const spread = rivalCount > 1 ? (i / (rivalCount - 1)) * 0.28 - 0.14 : 0;
        r.rate = (1 / rivalSecs) * (1 + spread);
        rockets.push(r);
      }
      player = mkRocket(0, "YOU", "😎", HULLS[0], true);
      // the player rides the middle lane
      rockets.splice(Math.floor(rockets.length / 2), 0, player);
      rockets = shuffle(rockets.filter(r => !r.isPlayer)).slice();
      rockets.splice(Math.floor(rockets.length / 2), 0, player);
    }
    function buildTeams() {
      rockets = [];
      const pilots = shuffle(PILOTS);
      for (let i = 0; i < teamCount; i++) {
        const r = mkRocket(i, "Team " + (i + 1), pilots[i], HULLS[i % HULLS.length], false);
        rockets.push(r);
      }
      dealTeams();
    }
    // Deal the (already shuffled) questions round-robin — every team gets the
    // same number ±1, and a team's track is exactly as long as its hand.
    function dealTeams() {
      rockets.forEach(r => { r.queue = []; });
      items.forEach((_, i) => rockets[i % rockets.length].queue.push(i));
      rockets.forEach(r => { r.L = Math.max(1, r.queue.length); });
    }

    function renderRockets() {
      lanesEl.innerHTML = ""; minimap.innerHTML = "";
      lanesEl.style.setProperty("--lanes", rockets.length);
      rockets.forEach((r, laneIdx) => {
        const lane = el("div", "aw-rr-lane");
        lane.style.setProperty("--lane", laneIdx);
        const rk = el("div", "aw-rr-rocket" + (r.isPlayer ? " is-player" : ""));
        rk.style.setProperty("--rc", r.hull.c);
        rk.style.setProperty("--rd", r.hull.d);
        rk.style.setProperty("--x", TRACK_START);
        rk.style.setProperty("--wob", r.wobble.toFixed(2) + "s");
        const flame = el("div", "aw-rr-flame", FLAME_SVG);
        const body = el("div", "aw-rr-body", ROCKET_SVG);
        const pilot = el("div", "aw-rr-pilot", r.pilot);
        const tag = el("div", "aw-rr-tag", "");
        tag.textContent = r.name;
        rk.append(flame, body, pilot, tag);
        lane.append(rk);
        lanesEl.append(lane);
        const dot = el("div", "aw-rr-dot" + (r.isPlayer ? " is-player" : ""));
        dot.style.setProperty("--rc", r.hull.c);
        dot.style.setProperty("--x", TRACK_START);
        minimap.append(dot);
        r.el = rk; r.tag = tag; r.dot = dot;
      });
      const flag = el("div", "aw-rr-dot is-flag", "🏁");
      flag.style.setProperty("--x", TRACK_END);
      minimap.append(flag);
    }
    function xOf(r) { return TRACK_START + (Math.min(r.p, r.L) / r.L) * (TRACK_END - TRACK_START); }
    function paintRocket(r) {
      const x = xOf(r).toFixed(2);
      r.el.style.setProperty("--x", x);
      r.dot.style.setProperty("--x", x);
    }

    // =========================================================
    // TEAMS — setup screen (names, optional class) then START
    // =========================================================
    function renderSetup() {
      if (setupEl) setupEl.remove();
      setupEl = el("div", "aw-rr-setup");
      setupEl.append(el("div", "aw-rr-setup-title", "TEAMS"));
      const list = el("div", "aw-rr-teamlist");
      rockets.forEach((r, i) => {
        const row = el("div", "aw-rr-teamrow");
        row.style.setProperty("--rc", r.hull.c);
        row.style.setProperty("--rd", r.hull.d);
        const badge = el("div", "aw-rr-teambadge", r.pilot);
        const name = el("input", "aw-rr-teamname");
        name.type = "text"; name.maxLength = 18; name.value = r.name; name.spellcheck = false;
        name.setAttribute("aria-label", "Team " + (i + 1) + " name");
        name.oninput = () => { r.name = name.value.trim() || ("Team " + (i + 1)); r.tag.textContent = r.name; };
        row.append(badge, name);
        if (r.pupils.length) {
          const chips = el("div", "aw-rr-pupils");
          r.pupils.forEach(p => chips.append(el("span", "aw-rr-pupil", escapeHtml(p))));
          row.append(chips);
        }
        row.append(el("div", "aw-rr-teamq", r.queue.length + " questions"));
        list.append(row);
      });
      setupEl.append(list);

      // class picker (teacher only — this screen only exists on the teacher's side)
      const cls = el("div", "aw-rr-classrow");
      cls.append(el("span", "aw-rr-classlab", "CLASS"));
      const sel = el("select", "aw-rr-classsel");
      if (classes === null) { const o = el("option", null, "Loading…"); o.value = ""; sel.append(o); sel.disabled = true; loadClasses(); }
      else if (!classes.length) { const o = el("option", null, classError || "No classes — add one in Settings"); o.value = ""; sel.append(o); sel.disabled = true; }
      else {
        const blank = el("option", null, "— no class: teams only —"); blank.value = ""; sel.append(blank);
        classes.forEach(c => { const o = el("option", null, escapeHtml(c.name)); o.value = c.id; if (c.id === pickedClassId) o.selected = true; sel.append(o); });
      }
      sel.onchange = () => {
        pickedClassId = sel.value;
        const c = (classes || []).find(x => x.id === pickedClassId);
        const names = c ? shuffle(c.students.map(s => s.name).filter(Boolean)) : [];
        rockets.forEach(r => { r.pupils = []; r.pupilPtr = 0; });
        names.forEach((n, i) => rockets[i % rockets.length].pupils.push(n));
        renderSetup();
      };
      cls.append(sel);
      setupEl.append(cls);

      const start = el("button", "aw-rr-start", "START RACE");
      start.type = "button";
      press(start, () => { setupEl.remove(); setupEl = null; startCountdown(); });
      setupEl.append(start);
      stage.append(setupEl);
    }
    // Classes live behind the teacher's sign-in; dynamic import on purpose so
    // the student page never pulls the library layer in (core rule).
    async function loadClasses() {
      try {
        const { listClasses } = await import("../../core/classes.js");
        const list = await listClasses();
        if (dead) return;
        classes = list;
      } catch (e) {
        if (dead) return;
        classes = [];
        classError = e?.code === "aw/signed-out" ? "Sign in to use your classes" : "Could not load your classes";
      }
      if (setupEl) renderSetup();
    }

    // =========================================================
    // 3 · 2 · 1 · GO
    // =========================================================
    function startCountdown() {
      locked = true;
      let n = 3;
      const step = () => {
        if (n > 0) {
          showBanner(String(n), "is-count");
          rrSound.count(n);
          n--;
          later(step, 800);
        } else {
          showBanner("GO!", "is-go");
          rrSound.go();
          ui.startTimer?.();
          running = true;
          last = performance.now();
          tickTimer = setInterval(tick, TICK_MS);
          rrSound.hum.start();
          rockets.forEach(r => r.el.classList.add("is-flying"));
          later(nextQuestion, 500);
        }
      };
      later(step, 300);
    }

    function showBanner(text, cls, ms = 700) {
      const b = el("div", "aw-rr-bannertxt " + (cls || ""), "");
      b.textContent = text;
      banner.innerHTML = "";
      banner.append(b);
      later(() => { if (b.parentNode) b.remove(); }, ms);
    }

    // =========================================================
    // questions
    // =========================================================
    function currentTeam() { return teamsMode ? rockets[teamPtr] : null; }

    function nextQuestion() {
      if (finished || dead) return;
      if (teamsMode) {
        // skip teams whose hand is empty; none left → the race is over
        let tries = 0;
        while (tries < rockets.length && !rockets[teamPtr].queue.length) { teamPtr = (teamPtr + 1) % rockets.length; tries++; }
        if (!rockets[teamPtr].queue.length) { endTeams(); return; }
        curItem = rockets[teamPtr].queue[0];
      } else {
        if (!queue.length) { finish(); return; }
        curItem = queue[0];
      }
      turnNo++;
      const q = items[curItem];
      paintTurnChip();
      rockets.forEach(r => r.el.classList.toggle("is-turn", teamsMode && r === currentTeam()));

      // question text (+ optional voice)
      voicePlayer.stop();
      qBox.innerHTML = ""; qBox.className = "aw-rr-q";
      const vv = voiceView(activity, q);
      const t = el("div", "aw-rr-qtext", "");
      if (vv.hideText) qBox.classList.add("aw-clue-voiceonly"); else t.textContent = q.question || "";
      qBox.append(t);
      if (vv.hasVoice) {
        const vBtn = el("button", "aw-voicebtn" + (vv.hideText ? " aw-voicebtn-lg" : ""), icons.soundOn);
        vBtn.type = "button"; vBtn.setAttribute("aria-label", "Listen");
        press(vBtn, e => { e.stopPropagation(); voicePlayer.toggle(q.voice, vBtn); });
        t.append(vBtn);
        if (vv.autoPlay) voicePlayer.playDelayed(q.voice, vBtn, firstQuestionSpoken ? 0 : DEFAULT_INTRO_DELAY_MS);
      }
      firstQuestionSpoken = true;
      fitText(qBox, t);

      // answer tiles
      const answers = (opt.shuffleAnswers ? shuffle(q.answers) : [...q.answers]).filter(a => a && a.text != null);
      answersEl.innerHTML = "";
      answersEl.style.setProperty("--per-row", answers.length <= 3 ? answers.length : answers.length === 4 ? 2 : 3);
      tiles = answers.map((a, i) => {
        const tile = el("button", "aw-rr-tile");
        tile.type = "button";
        const pal = tilePalette[i % tilePalette.length];
        tile.style.setProperty("--tile", pal.c);
        tile.style.setProperty("--tile-dark", pal.d);
        const txt = el("span", "aw-rr-tiletext", "");
        txt.textContent = a.text;
        tile.append(txt);
        press(tile, () => choose(i));
        answersEl.append(tile);
        tile.animate([{ opacity: 0, transform: "translateY(12%)" }, { opacity: 1, transform: "none" }],
          { duration: 260, delay: 50 * i, easing: "cubic-bezier(.22,.9,.3,1)", fill: "backwards" });
        return { tile, txt, ans: a };
      });
      tiles.forEach(t2 => fitLabelWidth(t2.txt));

      // question clock
      if (questionMs > 0) {
        qDeadline = performance.now() + questionMs;
        qTickAt = Math.ceil(questionMs / 1000);
        qTimer.classList.add("is-on");
        qTimerBar.style.transform = "scaleX(1)";
        qTimerBar.classList.remove("is-low");
      } else { qDeadline = 0; qTimer.classList.remove("is-on"); }

      const mover = teamsMode ? currentTeam() : player;
      ui.setNav({ index: Math.min(mover.p + 1, mover.L), total: mover.L });
      locked = false;
    }

    function paintTurnChip() {
      if (!teamsMode) { turnChip.textContent = ""; turnChip.classList.remove("is-on"); return; }
      const r = currentTeam();
      let who = r.name;
      if (r.pupils.length) { who += " · " + r.pupils[r.pupilPtr % r.pupils.length]; }
      turnChip.textContent = "";
      const b = el("span", "aw-rr-turnbadge", r.pilot);
      b.style.setProperty("--rc", r.hull.c);
      turnChip.append(b, document.createTextNode(who));
      turnChip.classList.add("is-on");
    }

    function choose(i) {
      if (locked || finished || dead) return;
      const q = items[curItem];
      const st = state[curItem];
      const a = tiles[i].ans;
      locked = true;
      qDeadline = 0; qTimer.classList.remove("is-on");
      st.attempts++;
      st.answeredWith = a.text;
      ui.noteActivity?.();
      ui.roundDone?.();
      tiles.forEach(t => (t.tile.disabled = true));
      const tile = tiles[i].tile;
      const fly = el("span", "aw-mark-fly" + (a.correct ? "" : " is-cross"), a.correct ? icons.markCheck : icons.markCross);
      tile.append(fly);
      later(() => fly.remove(), a.correct ? 900 : 2000);
      tiles.forEach((t, k) => {
        if (t.ans.correct) t.tile.append(el("span", "aw-tile-badge", icons.markCheck));
        else { if (k === i) t.tile.append(el("span", "aw-tile-badge", icons.markCross)); t.tile.classList.add("is-dimmed"); }
      });

      if (a.correct) onCorrect(q, st); else onWrong(q, st, tile);
    }

    function onTimeout() {
      if (locked || finished || dead) return;
      const q = items[curItem], st = state[curItem];
      locked = true;
      qDeadline = 0; qTimer.classList.remove("is-on");
      st.attempts++;
      st.answeredWith = "";
      ui.roundDone?.();
      tiles.forEach(t => { t.tile.disabled = true; if (t.ans.correct) t.tile.append(el("span", "aw-tile-badge", icons.markCheck)); else t.tile.classList.add("is-dimmed"); });
      showBanner("TIME'S UP", "is-stall", 900);
      onWrong(q, st, null);
    }

    function onCorrect(q, st) {
      st.correct = true;
      st.wrong = st.wrong;   // (kept — a later wrong pass never happens once correct)
      streak++;
      rrSound.correct();
      const mover = teamsMode ? currentTeam() : player;
      if (teamsMode) mover.queue.shift(); else queue.shift();
      mover.p = Math.min(mover.L, mover.p + 1);
      fireRocket(mover);
      ui.setScore(scoreNow());
      if (teamsMode) {
        mover.pupilPtr++;
        teamPtr = (teamPtr + 1) % rockets.length;
        if (!running) return;   // every team is over the line — crossedLine → endTeams ran
        later(nextQuestion, ANSWER_HOLD_MS);
        return;
      }
      if (mover.done) return;   // crossed the line — fireRocket → crossedLine runs the ending; no turbo/crate after that
      // turbo streak
      if (streak >= TURBO_STREAK && performance.now() >= turboUntil) startTurbo("TURBO!");
      // crate: collected by this very answer if one was waiting, else maybe spawn one
      if (crate) collectCrate();
      else if (powerups && correctCount() >= 3 && (correctCount() - 3) % CRATE_EVERY === 0) spawnCrate();
      later(nextQuestion, ANSWER_HOLD_MS);
    }

    function onWrong(q, st, tileEl) {
      st.wrong.push(st.answeredWith || "");
      streak = 0;
      rrSound.wrong();
      const mover = teamsMode ? currentTeam() : player;
      if (teamsMode) { mover.queue.shift(); mover.pupilPtr++; teamPtr = (teamPtr + 1) % rockets.length; }
      else { queue.push(queue.shift()); }      // ask it again later
      if (pointsOff) ui.flyPenalty?.(tileEl, pointsOff, () => { penalty += pointsOff; return scoreNow(); });

      if (shield && !teamsMode) {
        shield = false;
        player.el.classList.remove("has-shield");
        rrSound.shield();
        showBanner("SHIELD!", "is-shield", 900);
        later(nextQuestion, ANSWER_HOLD_MS);
        return;
      }
      stallRocket(mover);
      if (loseLife()) return;   // game over ends everything
      later(nextQuestion, STALL_MS + 200);
    }

    function correctCount() { return state.filter(s => s.correct).length; }
    function scoreNow() { return correctCount() - penalty; }

    // =========================================================
    // rockets in motion
    // =========================================================
    function fireRocket(r) {
      rrSound.boost();
      r.el.classList.remove("is-stall");
      r.el.classList.add("is-boost");
      later(() => r.el.classList.remove("is-boost"), 700);
      paintRocket(r);
      spawnPuff(r);
      if (r.p >= r.L) crossedLine(r);
    }
    function stallRocket(r) {
      rrSound.stall();
      r.el.classList.add("is-stall");
      later(() => r.el.classList.remove("is-stall"), STALL_MS);
      for (let i = 0; i < 3; i++) later(() => spawnSmoke(r), i * 220);
    }
    function spawnPuff(r) {
      const rect = relRect(r.el, fxLayer);
      const p = el("div", "aw-rr-puff");
      p.style.left = rect.x + "px"; p.style.top = (rect.y + rect.h * 0.5) + "px";
      fxLayer.append(p);
      later(() => p.remove(), 700);
    }
    function spawnSmoke(r) {
      const rect = relRect(r.el, fxLayer);
      const s = el("div", "aw-rr-smoke");
      s.style.left = (rect.x + rect.w * 0.15) + "px"; s.style.top = (rect.y + rect.h * 0.45) + "px";
      fxLayer.append(s);
      later(() => s.remove(), 900);
    }
    function relRect(node, within) {
      const a = node.getBoundingClientRect(), b = within.getBoundingClientRect();
      return { x: a.left - b.left, y: a.top - b.top, w: a.width, h: a.height };
    }

    function startTurbo(label) {
      turboUntil = performance.now() + TURBO_MS;
      player.el.classList.add("is-turbo");
      stage.classList.add("is-turbo");
      rrSound.turbo(); rrSound.hum.rev(true);
      showBanner(label, "is-turbo", 1000);
    }
    function endTurbo() {
      turboUntil = 0;
      player.el.classList.remove("is-turbo");
      stage.classList.remove("is-turbo");
      rrSound.hum.rev(false);
    }

    function spawnCrate() {
      const kinds = ["shield", "turbo", "meteor"];
      const kind = kinds[Math.floor(Math.random() * kinds.length)];
      const c = el("div", "aw-rr-crate", CRATE_ICON[kind]);
      c.style.setProperty("--x", Math.min(TRACK_END, xOf(player) + 12).toFixed(2));
      player.el.parentNode.append(c);
      crate = { kind, el: c };
      rrSound.pickup();
    }
    function collectCrate() {
      const c = crate; crate = null;
      c.el.classList.add("is-taken");
      later(() => c.el.remove(), 500);
      cratesEarned++;
      rrSound.pickup();
      if (c.kind === "shield") { shield = true; player.el.classList.add("has-shield"); showBanner("🛡 SHIELD", "is-shield", 900); }
      else if (c.kind === "turbo") { startTurbo("🚀 TURBO!"); }
      else {
        // meteor: the leading rival that hasn't finished gets knocked back + stunned
        const lead = rockets.filter(r => !r.isPlayer && !r.done).sort((a, b) => b.p - a.p)[0];
        showBanner("☄ METEOR!", "is-meteor", 900);
        rrSound.meteor();
        if (lead) {
          lead.p = Math.max(0, lead.p - 0.6);
          lead.stunUntil = performance.now() + 1600;
          lead.el.classList.add("is-hit");
          later(() => lead.el.classList.remove("is-hit"), 1600);
          paintRocket(lead);
          throwMeteor(lead);
        }
      }
    }
    function throwMeteor(target) {
      const m = el("div", "aw-rr-meteor", "☄");
      const tr = relRect(target.el, fxLayer);
      m.style.left = (tr.x + tr.w * 0.6) + "px"; m.style.top = (tr.y + tr.h * 0.5) + "px";
      fxLayer.append(m);
      later(() => m.remove(), 900);
    }

    // one physics step (delta-clamped; a hidden tab merely slows the race)
    function tick() {
      if (dead || finished) return;
      const now = performance.now();
      let dt = now - last; last = now;
      if (dt > 100) dt = 100;
      if (!running) return;

      // question clock
      if (qDeadline) {
        const left = qDeadline - now;
        const frac = Math.max(0, Math.min(1, left / questionMs));
        qTimerBar.style.transform = "scaleX(" + frac.toFixed(3) + ")";
        qTimerBar.classList.toggle("is-low", left <= 3000);
        const secs = Math.ceil(left / 1000);
        if (secs < qTickAt) { qTickAt = secs; if (secs <= 5 && secs > 0) rrSound.tick(secs); }
        if (left <= 0) onTimeout();
      }
      // turbo window
      if (turboUntil && now >= turboUntil) endTurbo();

      // rivals fly on their own clock
      if (!teamsMode) {
        const turbo = turboUntil > 0;
        for (const r of rockets) {
          if (r.isPlayer || r.done) continue;
          if (now < r.stunUntil) continue;
          // rubber band: the further the pupil is ahead, the harder the rival tries (and vice versa)
          const gap = (player.p - r.p) / r.L;
          let mult = 1 + Math.max(-0.45, Math.min(0.45, gap * 0.9));
          if (turbo) mult *= RIVAL_SLOW_TURBO;
          r.p += r.rate * mult * (dt / 1000);
          if (r.p >= r.L) { r.p = r.L; paintRocket(r); crossedLine(r); continue; }
          paintRocket(r);
        }
      }
    }

    function crossedLine(r) {
      if (r.done) return;
      r.done = true;
      finishedCount++;
      r.place = finishedCount;
      r.el.classList.add("is-done");
      r.el.classList.remove("is-turn");
      const medal = el("div", "aw-rr-medal", MEDAL[r.place - 1] || placeWord(r.place));
      r.el.append(medal);
      if (r.isPlayer) endSolo(r.place);
      else if (!teamsMode) { rrSound.rivalFinish(); }
      else if (rockets.every(x => x.done)) endTeams();
    }

    // =========================================================
    // endings
    // =========================================================
    function endSolo(place) {
      running = false;
      rrSound.hum.stop();
      endTurbo();
      if (place === 1) rrSound.win(); else rrSound.correct();
      endTitle = (MEDAL[place - 1] ? MEDAL[place - 1] + " " : "") + placeWord(place) + " place!";
      showBanner(placeWord(place).toUpperCase() + " PLACE!", place === 1 ? "is-win" : "is-place", FINISH_BANNER_MS);
      later(finish, FINISH_BANNER_MS);
    }
    function endTeams() {
      if (finished) return;
      running = false;
      rrSound.hum.stop();
      // rank: over the line first, then furthest along
      const order = rockets.slice().sort((a, b) => (a.done && b.done) ? a.place - b.place : a.done ? -1 : b.done ? 1 : (b.p / b.L) - (a.p / a.L));
      order.forEach((r, i) => { if (!r.done) { r.place = i + 1; const m = el("div", "aw-rr-medal", MEDAL[i] || placeWord(i + 1)); r.el.append(m); } });
      const win = order[0];
      rrSound.win();
      endTitle = "🏆 " + win.name + " wins!";
      showBanner(win.name.toUpperCase() + " WINS!", "is-win", FINISH_BANNER_MS);
      later(finish, FINISH_BANNER_MS);
    }

    function loseLife() {
      if (livesLeft == null) return false;
      const slot = ui.livesSlot;
      const gone = (livesLeft <= 5 && slot) ? slot.firstChild : null;
      livesLeft = Math.max(0, livesLeft - 1);
      rrSound.lifeLost();
      if (gone) {
        let done = false;
        const finishPop = () => { if (done) return; done = true; renderLives(); };
        try {
          const a = gone.animate([{ transform: "scale(1)", opacity: 1 }, { transform: "scale(1.7)", opacity: 0 }],
            { duration: 320, easing: "ease-in", fill: "forwards" });
          a.onfinish = finishPop;
        } catch (e) { finishPop(); }
        later(finishPop, 360);
      } else renderLives();
      if (livesLeft <= 0) {
        running = false;
        rrSound.hum.stop();
        endTurbo();
        rrSound.lose();
        endTitle = "Game over";
        showBanner("GAME OVER", "is-stall", 1300);
        later(finish, 1300);
        return true;
      }
      return false;
    }
    function renderLives() {
      const slot = ui.livesSlot;
      if (!slot) return;
      slot.innerHTML = "";
      if (livesLeft == null) return;
      if (livesLeft <= 5) { for (let i = 0; i < livesLeft; i++) slot.append(el("span", "aw-top-heart", "&#9829;")); }
      else { slot.append(el("span", "aw-top-heartcount", String(livesLeft))); slot.append(el("span", "aw-top-heart", "&#9829;")); }
    }

    function onKey(e) {
      if (locked || finished) return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= tiles.length) { e.preventDefault(); choose(n - 1); }
    }

    function finish() {
      if (finished || dead) return;
      finished = true;
      // Chốt sổ TRƯỚC khi đọc điểm: một "−N" đang bay là một phép trừ chưa áp (Đợt 256).
      ui.flushPenalties?.();
      running = false;
      if (tickTimer) { clearInterval(tickTimer); tickTimer = null; }
      rrSound.hum.stop();
      voicePlayer.stop();
      locked = true;
      const perQuestion = state.map((s, i) => ({ q: i, correct: s.correct === true }));
      const correct = perQuestion.filter(p => p.correct).length;
      const wrongTurns = state.reduce((n, s) => n + s.wrong.length, 0);
      const never = state.filter(s => s.attempts === 0).length;
      const review = items.map((q, i) => {
        const s = state[i];
        const correctText = (q.answers.find(a => a.correct) || {}).text || "";
        return {
          question: q.question || "",
          answered: s.attempts > 0,
          yourText: s.correct ? correctText : (s.wrong[s.wrong.length - 1] || ""),
          yourCorrect: s.correct === true,
          correctText,
          src: q   // `items` is a shallow copy, so `q` IS the content object
        };
      });
      const answered = state.filter(s => s.attempts > 0).length;
      // `total` counts TURNS (a re-asked question is another row) + questions
      // never reached; `items` is the size of the paper, for the assignment's
      // "perfect?" check (Đợt 294).
      ui.finish({ correct, incorrect: wrongTurns + never, total: correct + wrongTurns + never, items: N,
                  perQuestion, review, answered,
                  score: correct - penalty,
                  title: endTitle || undefined });
    }

    return function cleanup() {
      dead = true;            // MUST come first — the only brake on bare callbacks
      finished = true;
      rrPauseHandlers = null;
      window.removeEventListener("keydown", onKey);
      if (tickTimer) { clearInterval(tickTimer); tickTimer = null; }
      timers.forEach(id => clearTimeout(id)); timers.clear();
      rrSound.hum.stop();
      voicePlayer.stop();
      if (ui.livesSlot) ui.livesSlot.innerHTML = "";
    };
  },

  // Menu pause hook (Đợt 91) — engine calls this on ☰ Menu open(true)/close(false).
  onPause(paused) {
    if (!rrPauseHandlers) return;
    if (paused) rrPauseHandlers.pause(); else rrPauseHandlers.resume();
  }
};

registerTemplate(rocketRaceTemplate);
export default rocketRaceTemplate;
