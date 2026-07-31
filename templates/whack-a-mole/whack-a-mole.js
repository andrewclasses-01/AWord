// =============================================================
// TEMPLATE: WHACK-A-MOLE — Wordwall style, English UI, Wild West art.
//
//  • A wooden SIGN at the top tells you what to hit. Moles pop up from a grid
//    of desert holes, each carrying a speech bubble with a piece of content.
//    Whack the moles that MATCH the sign; avoid the wrong ones.
//  • TWO content modes (options.mode):
//      "trueFalse" — sign shows a fixed target ("Hit moles that are: TRUE").
//                    Each mole carries a statement; whack it if its answer
//                    equals the target.
//      "quiz"      — sign shows ONE question (a "level"). Moles carry that
//                    question's answer options; whack the CORRECT one to make
//                    the sign rotate on to the next question.
//  • Real-time: moles are scheduled with setTimeout (never rAF — a hidden tab
//    would freeze rAF and the game would stall; core rule). Every mole has an
//    absolute setTimeout that ducks/frees it, independent of any animation
//    callback, so nothing gets stuck.
//  • Own COUNTDOWN (engine timer set to "none"; inlineTimerBar draws our bar in
//    ui.topbarMid — same approach as Open the box) so bonus "time" crates can
//    actually add seconds. When it reaches 0 we tally the score and ui.finish().
//  • Full extras: combo streak bonus, and bonus CRATES (time / loot / power).
//
//  Wild West art + sounds are ripped from Wordwall's own theme (teacher's call)
//  and live self-contained under ./img and ./sounds. This game keeps a FIXED
//  desert look — it does NOT recolour per theme like the other templates.
// =============================================================

import { registerTemplate } from "../../core/registry.js";
import { shuffle, el, formatTime } from "../../core/utils.js";
import { autoFit } from "../../core/fit.js";
import { makeNumberStepper } from "../../core/numberstepper.js";
import { wamSound } from "./wam-sound.js";
import { openWamEditor } from "./whack-a-mole-editor.js";

function imgUrl(name) { return new URL(`./img/${name}`, import.meta.url).href; }

// Fixed 10-hole desert layout (3 / 4 / 3), positions as % of the scene with a
// gentle perspective (farther rows sit higher and a touch smaller). Tuned by eye
// against bg2. Moles spawn into these regardless of how much content there is.
const HOLE_LAYOUT = [
  { x: 34, y: 45, s: 13 }, { x: 50, y: 43, s: 13 }, { x: 66, y: 45, s: 13 },
  { x: 21, y: 61, s: 16 }, { x: 40.7, y: 60, s: 16 }, { x: 59.3, y: 60, s: 16 }, { x: 79, y: 61, s: 16 },
  { x: 30, y: 78, s: 19 }, { x: 50, y: 79, s: 19 }, { x: 70, y: 78, s: 19 }
];

const MOLE_VARIANTS = ["mole01", "mole02", "mole03"];
const MOUND_VARIANTS = ["mound01.webp", "mound02.webp", "mound03.webp"];

// Bonus crates (full-feature). "dizzy" is the hazard one.
const CRATE_TYPES = [
  { key: "time",  img: "crate-time.webp",  weight: 3 },
  { key: "loot",  img: "crate-loot.webp",  weight: 3 },
  { key: "power", img: "crate-power.webp", weight: 2 },
  { key: "dizzy", img: "crate-dizzy.webp", weight: 2 }
];

const COMBO_THRESHOLD = 3;     // consecutive correct hits before a combo bonus kicks in
const POWER_MS = 6000;         // how long a power crate doubles points
const CRATE_CHANCE = 0.16;     // chance a spawn is a crate instead of a mole (when enabled)

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
  name: "Whack-a-mole",
  inlineTimerBar: true,   // our own countdown bar sits on the score row (ui.topbarMid)
  hideLettersOption: true, // no lettered answer boxes here

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
  buildExtraOptions({ panel, draft, el, mkRadioChoice }) {
    // MODE
    const gMode = el("div", "aw-opt-group");
    gMode.append(el("div", "aw-opt-label", "Whack-a-mole mode"));
    const rowMode = el("div", "aw-opt-row");
    const isQuiz = draft.mode === "quiz";
    rowMode.append(
      mkRadioChoice("aw-wam-mode", "trueFalse", "True / False", !isQuiz, v => draft.mode = v),
      mkRadioChoice("aw-wam-mode", "quiz", "Quiz", isQuiz, v => draft.mode = v)
    );
    gMode.append(rowMode);
    panel.append(gMode);

    // GAME TIME (our own countdown length, seconds)
    const gTime = el("div", "aw-opt-group");
    gTime.append(el("div", "aw-opt-label", "Game time"));
    const rowTime = el("div", "aw-opt-row");
    const secs = el("span", "aw-opt-time");
    const total = typeof draft.gameSeconds === "number" ? draft.gameSeconds : 60;
    const mm = makeNumberStepper(Math.floor(total / 60), 0, 9, v => draft.gameSeconds = v * 60 + (draft.gameSeconds % 60));
    const ss = makeNumberStepper(total % 60, 0, 59, v => draft.gameSeconds = Math.floor((draft.gameSeconds || 60) / 60) * 60 + v);
    secs.append(mm.el, document.createTextNode("m "), ss.el, document.createTextNode("s"));
    rowTime.append(secs);
    gTime.append(rowTime);
    panel.append(gTime);

    // SPEED slider + bonus crates toggle
    const gSpeed = el("div", "aw-opt-group");
    gSpeed.append(el("div", "aw-opt-label", "Speed"));
    const rowSpeed = el("div", "aw-opt-row aw-wam-speedrow");
    const initSpeed = Number.isInteger(draft.speed) ? draft.speed : 5;
    const speedVal = el("span", "aw-wam-speedval", String(initSpeed));
    const speedInput = el("input", "aw-wam-speedslider");
    speedInput.type = "range"; speedInput.min = "1"; speedInput.max = "10"; speedInput.step = "1";
    speedInput.value = String(initSpeed);
    speedInput.oninput = () => { const v = parseInt(speedInput.value, 10); draft.speed = v; speedVal.textContent = String(v); };
    rowSpeed.append(speedInput, speedVal);
    gSpeed.append(rowSpeed);
    panel.append(gSpeed);

    const gCrate = el("div", "aw-opt-group");
    gCrate.append(el("div", "aw-opt-label", "Bonus crates"));
    const rowCrate = el("div", "aw-opt-row");
    rowCrate.append(
      mkRadioChoice("aw-wam-crate", "on", "On (time / loot / power)", draft.crates !== false, () => draft.crates = true),
      mkRadioChoice("aw-wam-crate", "off", "Off", draft.crates === false, () => draft.crates = false)
    );
    gCrate.append(rowCrate);
    panel.append(gCrate);
  },

  // Any Options change restarts (mode/speed/time/crates all read at mount()).
  optionsNeedRestart() { return true; },

  mount(root, activity, ui) {
    const opt = activity.options || {};
    const mode = opt.mode === "quiz" ? "quiz" : "trueFalse";
    const target = opt.target !== false;               // trueFalse: hit TRUE by default
    const speed = Number.isInteger(opt.speed) ? Math.max(1, Math.min(10, opt.speed)) : 5;
    const cratesOn = opt.crates !== false;
    const gameSeconds = (typeof opt.gameSeconds === "number" && opt.gameSeconds > 0) ? opt.gameSeconds : 60;

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
    const spawnBase = Math.round(1350 - speed * 90);        // gap between spawns (ms)
    const upDuration = Math.round(2700 - speed * 165);       // how long a mole stays up (ms)
    const maxConcurrent = Math.min(HOLE_LAYOUT.length, 2 + Math.round(speed / 2.2));

    // ---------- state ----------
    let score = 0, wrongCount = 0, whacks = 0;
    let combo = 0, bestCombo = 0;
    let ended = false;
    let powerUntil = 0;                 // performance.now() ms while a power crate is active
    let spawnTimer = null;
    let clockTimer = null;
    let clockEl = null, fillEl = null;  // own countdown UI (built in ensureTimerUI) — declared here to avoid a TDZ
    let endAt = 0;                      // performance.now() ms when the countdown hits 0
    let timeLeftFrozen = gameSeconds;   // used to compute the bar width vs the ORIGINAL length
    const timers = new Set();           // every pending setTimeout (swept on cleanup)
    let fitter = null;                  // autoFit for the quiz sign question

    // quiz mode level bookkeeping
    let qOrder = mode === "quiz" ? shuffle(questions.map((_, i) => i)) : [];
    let qPos = 0;
    let levelIndex = mode === "quiz" ? qOrder[0] : -1;
    let answerQueue = [];               // shuffled cycling answers of the current question
    let rotating = false;

    // trueFalse cycling statement queue
    let stmtQueue = [];

    function later(fn, ms) { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; }
    function clearTimer(t) { if (t) { clearTimeout(t); timers.delete(t); } }

    // ---------- scene ----------
    root.innerHTML = "";
    const scene = el("div", "aw-wam-scene");

    // sign
    const sign = el("div", "aw-wam-sign");
    const post = el("div", "aw-wam-post");
    const board = el("div", "aw-wam-board");
    sign.append(post, board);
    scene.append(sign);

    // desert decoration (cacti) at the edges — crisp foreground props that give
    // the Wild West feel (the mesa itself is baked soft into bg2). Behind the
    // holes in paint order; placed where no hole sits so nothing is covered.
    const DECOR = [
      { img: "cactus2.webp", css: "left:2.5%; bottom:4%; width:14cqw;" },
      { img: "cactus.webp",  css: "right:2%; bottom:5%; width:13cqw;" },
      { img: "cactus3.webp", css: "left:11.5%; bottom:0.5%; width:8.5cqw;" }
    ];
    DECOR.forEach(d => {
      const im = el("img", "aw-wam-decor"); im.src = imgUrl(d.img); im.alt = "";
      im.style.cssText += d.css;
      scene.append(im);
    });

    // holes
    const holes = HOLE_LAYOUT.map((pos, i) => {
      const hole = el("div", "aw-wam-hole");
      hole.style.left = pos.x + "%";
      hole.style.top = pos.y + "%";
      hole.style.width = pos.s + "cqw";
      hole.style.height = (pos.s * 1.35) + "cqw";   // holes are absolute-only inside; give a real box so the mole clip has height

      const mound = el("img", "aw-wam-mound"); mound.src = imgUrl(MOUND_VARIANTS[i % MOUND_VARIANTS.length]); mound.alt = "";
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

      hole.append(mound, holeback, molewrap, holefront, bubble, zap);
      molewrap.addEventListener("pointerdown", () => onWhack(state));

      const state = {
        pos, hole, mole, crate, bubble, bubbleText, zap,
        status: "empty",          // empty | rising | up | hit | ducking
        item: null, isCorrect: false, isCrate: false, crateType: null,
        duckT: null, freeT: null
      };
      return state;
    });
    holes.forEach(h => scene.append(h.hole));
    root.append(scene);

    updateSign(false);
    ensureTimerUI();

    // ---------- sign rendering ----------
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
        fitter = autoFit(root, board, s => board.style.setProperty("--fit", s), {
          slack: root.clientWidth * 0.02,
          measure: () => qEl.offsetHeight
        });
      } else {
        board.append(
          el("div", "aw-wam-sign-lead", "Hit moles that are:"),
          el("div", "aw-wam-sign-target", target ? "True" : "False")
        );
      }
    }

    // ---------- own countdown (topbarMid) ----------
    function ensureTimerUI() {
      if (!ui.topbarMid) return;
      ui.topbarMid.innerHTML = "";
      const row = el("div", "aw-wam-topbar");
      clockEl = el("div", "aw-wam-clock", formatTime(gameSeconds));
      const bar = el("div", "aw-wam-timerbar");
      fillEl = el("div", "aw-wam-timerbar-fill");
      bar.append(fillEl);
      row.append(clockEl, bar);
      ui.topbarMid.append(row);
    }
    function startClock() {
      endAt = performance.now() + gameSeconds * 1000;
      let lastTickSlot = Math.ceil(gameSeconds);
      clockTimer = setInterval(() => {
        if (ended) return;
        const remaining = Math.max(0, (endAt - performance.now()) / 1000);
        if (clockEl) clockEl.textContent = formatTime(Math.ceil(remaining));
        if (fillEl) {
          fillEl.style.width = Math.max(0, Math.min(100, (remaining / gameSeconds) * 100)) + "%";
          fillEl.classList.toggle("is-warning", remaining <= 5);
        }
        // tick sound: once/sec in the last 10s, twice/sec in the last 5s
        const slot = remaining > 5 ? Math.ceil(remaining) : Math.ceil(remaining * 2) / 2;
        if (remaining <= 10 && slot < lastTickSlot && remaining > 0) { lastTickSlot = slot; wamSound.clockTick(); }
        if (remaining <= 0) endGame();
      }, 200);
    }
    function addTime(sec) {
      endAt += sec * 1000;
      const remaining = Math.max(0, (endAt - performance.now()) / 1000);
      if (clockEl) clockEl.textContent = formatTime(Math.ceil(remaining));
    }

    // ---------- content pickers ----------
    function nextStatement() {
      if (!stmtQueue.length) stmtQueue = shuffle(statements.slice());
      return stmtQueue.pop();
    }
    function nextAnswer() {
      if (!answerQueue.length) answerQueue = shuffle(questions[levelIndex].answers.slice());
      return answerQueue.pop();
    }
    // Pick content for a fresh mole, avoiding a bubble identical to one already up.
    function pickItem() {
      const activeTexts = new Set(holes.filter(h => h.status !== "empty" && h.item).map(h => h.item.text));
      for (let tries = 0; tries < 6; tries++) {
        if (mode === "quiz") {
          const a = nextAnswer();
          if (!activeTexts.has(a.text) || tries === 5) return { text: a.text, isCorrect: !!a.correct };
        } else {
          const s = nextStatement();
          if (!activeTexts.has(s.text) || tries === 5) return { text: s.text, isCorrect: s.answer === target };
        }
      }
      return mode === "quiz" ? { text: "", isCorrect: false } : { text: "", isCorrect: false };
    }

    // ---------- spawning ----------
    function spawnInterval() { return spawnBase + randi(400) - 100; }
    function scheduleSpawn() { spawnTimer = later(spawnTick, spawnInterval()); }
    function spawnTick() {
      if (ended) return;
      if (!rotating) {
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
      h.item = item; h.isCorrect = item.isCorrect; h.isCrate = false; h.crateType = null; h.status = "rising";
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
      const type = pickWeighted(CRATE_TYPES);
      h.item = null; h.isCrate = true; h.crateType = type.key; h.isCorrect = false; h.status = "rising";
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
      h.hole.classList.remove("is-up", "is-crate");
      if (wasMole && !h.isCrate) { wamSound.disappear(); combo = 0; }
      h.freeT = later(() => freeHole(h), 300);
    }
    function freeHole(h) {
      clearTimer(h.freeT); h.freeT = null;
      h.status = "empty"; h.item = null; h.isCrate = false; h.isCorrect = false;
      h.hole.classList.remove("is-up", "is-hit", "is-crate");
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
        if (mode === "quiz") onQuizCorrect();
      } else {
        wamSound.wrong();
        combo = 0;
        wrongCount++;
        score = Math.max(0, score - 1);
        ui.setScore(score);
        floatText(h, "–" + 1, "is-minus");
      }
      h.freeT = later(() => { h.hole.classList.remove("is-up"); later(() => freeHole(h), 300); }, 520);
    }

    function hitCrate(h) {
      popZap(h);
      const t = h.crateType;
      if (t === "time") { addTime(5); wamSound.crateTime(); floatText(h, "+5s", "is-combo"); }
      else if (t === "loot") { score += 5; ui.setScore(score); wamSound.crateLoot(); floatText(h, "+5", "is-plus"); }
      else if (t === "power") { powerUntil = performance.now() + POWER_MS; wamSound.cratePower(); floatText(h, "POWER!", "is-combo"); scene.classList.add("is-power"); later(() => { if (performance.now() >= powerUntil) scene.classList.remove("is-power"); }, POWER_MS + 60); }
      else { wamSound.wrong(); combo = 0; score = Math.max(0, score - 2); ui.setScore(score); floatText(h, "–2", "is-minus"); }
      h.freeT = later(() => { h.hole.classList.remove("is-crate"); later(() => freeHole(h), 300); }, 520);
    }

    // quiz: a correct answer clears the level -> rotate the sign to the next question
    function onQuizCorrect() {
      if (rotating) return;
      rotating = true;
      wamSound.levelComplete();
      // duck any moles still carrying the old question's answers
      holes.forEach(h => { if (h.status === "up" || h.status === "rising") duck(h, false); });
      later(() => {
        qPos = (qPos + 1) % qOrder.length;
        if (qPos === 0) qOrder = shuffle(questions.map((_, i) => i));
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
    function floatText(h, text, cls) {
      const f = el("div", "aw-wam-float " + cls, text);
      f.style.left = h.pos.x + "%";
      f.style.top = (h.pos.y - h.pos.s * 0.5) + "%";
      scene.append(f);
      void f.offsetWidth; f.classList.add("is-fly");
      later(() => f.remove(), 850);
    }

    // ---------- end of game ----------
    ui.onSubmit(endGame);   // menu "Submit answers" ends early too
    function endGame() {
      if (ended) return;
      ended = true;
      if (spawnTimer) clearTimer(spawnTimer);
      if (clockTimer) { clearInterval(clockTimer); clockTimer = null; }
      timers.forEach(t => clearTimeout(t)); timers.clear();
      holes.forEach(h => { h.hole.classList.remove("is-up", "is-crate"); });

      // brief score tally, then hand off to the engine's celebration/summary
      const tally = el("div", "aw-wam-tally", "0");
      scene.append(tally);
      void tally.offsetWidth; tally.classList.add("is-on");
      wamSound.pointsCounting();
      const startT = performance.now(); const DUR = 900;
      let done = false;
      const finishTally = () => {
        if (done) return; done = true;
        tally.textContent = String(score);
        wamSound.pointsCounted();
        setTimeout(reallyFinish, 500);
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
      ui.finish({ correct: score, incorrect: wrongCount, total, perQuestion, review, answered: whacks, title: "Time's up" });
    }

    // ---------- go ----------
    wamSound.go();
    startClock();
    scheduleSpawn();

    // ---------- cleanup ----------
    return function cleanup() {
      ended = true;
      if (spawnTimer) clearTimeout(spawnTimer);
      if (clockTimer) clearInterval(clockTimer);
      timers.forEach(t => clearTimeout(t)); timers.clear();
      if (fitter) fitter.destroy();
      if (ui.topbarMid) ui.topbarMid.innerHTML = "";
    };
  }
};

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

registerTemplate(wamTemplate);
export default wamTemplate;
