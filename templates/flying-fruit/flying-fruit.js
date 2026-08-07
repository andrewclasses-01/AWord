// =============================================================
// TEMPLATE: FLYING FRUIT — Wordwall style, English UI, JUNGLE art.
//
//  • A QUESTION (a definition/clue) is shown at the top of the frame. Answer
//    WORDS fly across the jungle-night scene, each riding a thrown fruit
//    (kivano / mango / papaya). Tap the fruit carrying the CORRECT word.
//      - correct  -> the fruit bursts into juice (8-frame sprite) + spark +
//                    green tick, +1 point, and the game moves on to the next clue.
//      - wrong    -> a red cross, a wrong buzz, and you lose one LIFE (heart).
//                    When lives hit 0 the game is over.
//  • Distractor fruits carry RANDOM words taken from the OTHER items (the
//    teacher only types a word + clue per item, exactly like Anagram — the
//    wrong answers are generated automatically from the rest of the list).
//  • Real-time: fruit spawning + removal is driven by setTimeout, NEVER rAF
//    (a hidden tab freezes rAF and the game would stall — core rule). The flight
//    itself is a CSS animation, but an absolute setTimeout always removes/frees
//    each fruit so nothing gets stuck.
//  • Options: Timer (engine: none/up/down) · Lives · Speed · Retry after a wrong
//    answer · Shuffle · Show answers.
//
//  Jungle art + sounds are ripped from Wordwall's own theme (teacher's call) and
//  live self-contained under ./img and ./sounds. Like Whack-a-mole, this game
//  keeps a FIXED jungle look — it does NOT recolour per theme.
// =============================================================

import { registerTemplate } from "../../core/registry.js";
import { shuffle, el } from "../../core/utils.js";
import { autoFit } from "../../core/fit.js";
import { ffSound } from "./ff-sound.js";
import { openFlyingFruitEditor } from "./flying-fruit-editor.js";

function imgUrl(name) { return new URL(`./img/${name}`, import.meta.url).href; }

const FRUITS = ["kivano", "mango", "papaya"];
const EXPLO = { kivano: "explosion-green", mango: "explosion-yellow", papaya: "explosion-orange" };

function randi(n) { return Math.floor(Math.random() * n); }
function isValidItem(it) { return it && typeof it.word === "string" && it.word.trim() !== ""; }

const flyingFruitTemplate = {
  type: "flying_fruit",
  scorable: true,
  // "Start with mistakes" (Đợt 84): which array in activity.content holds the
  // playable items. Core filters THAT array by the `src` refs the review rows
  // carry, so a replay keeps the originals untouched. See core/mistakes.js.
  itemsKey: "items",
  name: "Flying fruit",
  inlineTimerBar: true,     // gives us ui.topbarMid — we draw the LIVES (hearts) there
  hideLettersOption: true,  // no lettered answer boxes here

  edit: openFlyingFruitEditor,

  sounds: {
    play: ffSound.intro,
    restart: ffSound.restart,
    complete: ffSound.complete   // no-op: the template plays its own win/lose/time sound
  },

  toPrintItems(activity) {
    return (activity.content?.items || [])
      .filter(isValidItem)
      .map(it => ({ clue: (it.clue || "").trim() || it.word, answer: it.word }));
  },

  // Options panel extras (engine calls this — see CONG THUC MAU §5).
  buildExtraOptions({ panel, draft, el, mkCheck }) {
    // LIVES
    const gLives = el("div", "aw-opt-group");
    gLives.append(el("div", "aw-opt-label", "Lives"));
    const rowLives = el("div", "aw-opt-row aw-ff-optrow");
    const livesInit = Number.isInteger(draft.lives) ? draft.lives : 6;
    const livesVal = el("span", "aw-ff-optval", String(livesInit));
    const livesInput = el("input", "aw-ff-slider");
    livesInput.type = "range"; livesInput.min = "1"; livesInput.max = "10"; livesInput.step = "1";
    livesInput.value = String(livesInit);
    livesInput.oninput = () => { const v = parseInt(livesInput.value, 10); draft.lives = v; livesVal.textContent = String(v); };
    rowLives.append(livesInput, livesVal);
    gLives.append(rowLives);
    panel.append(gLives);

    // SPEED
    const gSpeed = el("div", "aw-opt-group");
    gSpeed.append(el("div", "aw-opt-label", "Speed"));
    const rowSpeed = el("div", "aw-opt-row aw-ff-optrow");
    const speedInit = Number.isInteger(draft.speed) ? draft.speed : 7;
    const speedVal = el("span", "aw-ff-optval", String(speedInit));
    const speedInput = el("input", "aw-ff-slider");
    speedInput.type = "range"; speedInput.min = "1"; speedInput.max = "10"; speedInput.step = "1";
    speedInput.value = String(speedInit);
    speedInput.oninput = () => { const v = parseInt(speedInput.value, 10); draft.speed = v; speedVal.textContent = String(v); };
    rowSpeed.append(speedInput, speedVal);
    gSpeed.append(rowSpeed);
    panel.append(gSpeed);

    // RETRY
    const gRetry = el("div", "aw-opt-group");
    gRetry.append(el("div", "aw-opt-label", "Answering"));
    const rowRetry = el("div", "aw-opt-row");
    rowRetry.append(mkCheck(draft.retry === true, "Retry after incorrect answer", v => draft.retry = v));
    gRetry.append(rowRetry);
    panel.append(gRetry);
  },

  // Lives/speed/retry/shuffle are all read once at mount() -> restart to apply.
  optionsNeedRestart() { return true; },

  mount(root, activity, ui) {
    const opt = activity.options || {};
    const maxLives = Number.isInteger(opt.lives) ? Math.max(1, Math.min(10, opt.lives)) : 6;
    const speed = Number.isInteger(opt.speed) ? Math.max(1, Math.min(10, opt.speed)) : 7;
    const retry = opt.retry === true;
    const pointsOff = Math.max(0, Math.min(5, Number(activity.options && activity.options.pointsOff) || 0));
    const timerMode = opt.timer ?? "countUp";

    // ---------- content ----------
    let items = [...(activity.content?.items || [])].filter(isValidItem)
      .map(it => ({ word: it.word.trim(), clue: (it.clue || "").trim() }));
    if (opt.shuffleQuestions) items = shuffle(items);
    const total = items.length;
    if (total === 0) {
      root.innerHTML = "";
      root.append(el("div", "aw-ff-empty", "This activity has no words yet."));
      return () => {};
    }

    // ---------- pacing from speed ----------
    const flyDuration = Math.round(5200 - speed * 380);       // ms for a fruit to cross the scene
    const spawnGapBase = Math.round(1500 - speed * 95);        // ms between spawns
    const maxConcurrent = Math.min(5, 2 + Math.round(speed / 3));
    const DISTRACTORS = 5;

    // ---------- state ----------
    let index = 0, score = 0, wrong = 0, lives = maxLives;
    let ended = false;
    let current = items[0];
    let otherWords = [];
    let queue = [];
    let fruitTypeCounter = 0;
    let spawnTimer = null, ambientTimer = null;
    let fitter = null;
    const timers = new Set();
    const activeFruits = new Set();
    // per-item outcome: "correct" | "failed" | undefined (never reached)
    const results = new Array(total);

    function later(fn, ms) { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; }
    function clearTimer(t) { if (t) { clearTimeout(t); timers.delete(t); } }

    // ---------- scene ----------
    root.innerHTML = "";
    const scene = el("div", "aw-ff-scene");

    // decorations (behind the fruit lane)
    const palms = el("img", "aw-ff-palms"); palms.src = imgUrl("palmtrees.png"); palms.alt = "";
    const toucan = el("img", "aw-ff-toucan"); toucan.src = imgUrl("toucan.png"); toucan.alt = "";
    const butterfly = el("img", "aw-ff-butterfly"); butterfly.src = imgUrl("butterfly.png"); butterfly.alt = "";
    const frog = el("img", "aw-ff-frog"); frog.src = imgUrl("frog.png"); frog.alt = "";
    const frogThroat = el("img", "aw-ff-frogthroat"); frogThroat.src = imgUrl("frogthroat.png"); frogThroat.alt = "";
    scene.append(palms, toucan, butterfly, frog, frogThroat);

    // clue banner
    const clueWrap = el("div", "aw-ff-cluewrap");
    const clue = el("div", "aw-ff-clue");
    clueWrap.append(clue);
    scene.append(clueWrap);

    // fruit lane (fruits get appended here)
    const lane = el("div", "aw-ff-lane");
    scene.append(lane);

    root.append(scene);

    // ---------- lives (hearts) in ui.topbarMid ----------
    let heartEls = [];
    function buildHearts() {
      if (!ui.topbarMid) return;
      ui.topbarMid.innerHTML = "";
      const row = el("div", "aw-ff-hearts");
      heartEls = [];
      for (let i = 0; i < maxLives; i++) {
        const h = el("span", "aw-ff-heart", "♥");
        heartEls.push(h);
        row.append(h);
      }
      ui.topbarMid.append(row);
      updateHearts();
    }
    function updateHearts() {
      heartEls.forEach((h, i) => h.classList.toggle("is-lost", i >= lives));
    }
    buildHearts();

    // ---------- clue / item ----------
    function startItem(i) {
      current = items[i];
      otherWords = items.filter((_, j) => j !== i).map(x => x.word).filter(Boolean);
      queue = [];
      if (fitter) { fitter.destroy(); fitter = null; }
      clue.textContent = current.clue || "Tap the correct answer.";
      fitter = autoFit(root, clueWrap, s => clueWrap.style.setProperty("--fit", s), {
        slack: root.clientWidth * 0.02,
        measure: () => clue.offsetHeight
      });
      ui.setNav({ index: i + 1, total, onPrev: null, onNext: null });
    }

    // spawn queue: correct word + random distractors, cycling (correct shows once per cycle)
    function buildQueue() {
      const distractors = shuffle(otherWords.slice()).slice(0, DISTRACTORS);
      queue = shuffle([{ word: current.word, correct: true }, ...distractors.map(w => ({ word: w, correct: false }))]);
    }
    function nextEntry() {
      if (!queue.length) buildQueue();
      return queue.pop();
    }

    // ---------- spawning ----------
    function spawnGap() { return spawnGapBase + randi(500) - 150; }
    function scheduleSpawn() { spawnTimer = later(spawnTick, Math.max(220, spawnGap())); }
    function spawnTick() {
      if (ended) return;
      if (activeFruits.size < maxConcurrent) spawnFruit();
      scheduleSpawn();
    }

    function spawnFruit() {
      const entry = nextEntry();
      const type = FRUITS[fruitTypeCounter % FRUITS.length];
      fruitTypeCounter++;

      const fly = el("div", "aw-ff-fly");
      const arc = el("div", "aw-ff-arc");
      const fruit = el("div", "aw-ff-fruit is-" + type);
      const im = el("img", "aw-ff-fruit-img"); im.src = imgUrl(type + ".png"); im.alt = "";
      const label = el("div", "aw-ff-word", entry.word);
      label.style.fontSize = wordFontCqw(entry.word) + "cqw";
      fruit.append(im, label);
      arc.append(fruit);
      fly.append(arc);

      // trajectory
      const leftToRight = Math.random() < 0.5;
      const x0 = leftToRight ? -16 : 116;
      const x1 = leftToRight ? 116 : -16;
      const baseY = 30 + randi(24);              // 30%..53% down
      const peak = 9 + randi(7);                 // cqw peak height
      const spin = (Math.random() < 0.5 ? -1 : 1) * (5 + randi(8));
      fly.style.top = baseY + "%";
      fly.style.setProperty("--x0", x0 + "%");
      fly.style.setProperty("--x1", x1 + "%");
      fly.style.setProperty("--dur", flyDuration + "ms");
      arc.style.setProperty("--dur", flyDuration + "ms");
      arc.style.setProperty("--peak", peak + "cqw");
      fruit.style.setProperty("--spin", spin + "deg");
      fruit.style.setProperty("--dur", flyDuration + "ms");

      const f = { el: fly, fruitEl: fruit, word: entry.word, correct: entry.correct, type, gone: false, removeT: null };
      fruit.addEventListener("pointerdown", () => onTap(f));
      lane.append(fly);
      activeFruits.add(f);

      // absolute removal (independent of animationend — core rule)
      f.removeT = later(() => removeFruit(f), flyDuration + 80);
    }

    function removeFruit(f) {
      if (f.removeT) { clearTimer(f.removeT); f.removeT = null; }
      if (f.el && f.el.parentNode) f.el.remove();
      activeFruits.delete(f);
    }
    function clearFruits() {
      activeFruits.forEach(f => { if (f.removeT) clearTimer(f.removeT); if (f.el && f.el.parentNode) f.el.remove(); });
      activeFruits.clear();
    }

    // ---------- tapping ----------
    function onTap(f) {
      if (ended || f.gone) return;
      f.gone = true;
      const { cx, cy } = scenePct(f.fruitEl);

      if (f.correct) {
        boom(cx, cy, f.type);
        spark(cx, cy);
        floatMark(cx, cy, true);
        ffSound.correct();
        removeFruit(f);
        score++; ui.setScore(score);
        results[index] = "correct";
        advance();
      } else {
        floatMark(cx, cy, false);
        ffSound.wrong();
        f.fruitEl.classList.add("is-wrong");
        if (f.removeT) clearTimer(f.removeT);
        later(() => removeFruit(f), 320);
        lives = Math.max(0, lives - 1); wrong++; updateHearts();
        if (pointsOff) { score -= pointsOff; ui.setScore(score); }   // penalty (negative allowed, not clamped)
        if (lives <= 0) { if (!results[index]) results[index] = "failed"; endGame("gameover"); return; }
        if (!retry) { results[index] = "failed"; advance(); }
      }
    }

    function advance() {
      index++;
      clearFruits();
      queue = [];
      if (index >= total) { endGame("won"); return; }
      startItem(index);
    }

    // ---------- effects ----------
    function scenePct(node) {
      const r = node.getBoundingClientRect();
      const s = scene.getBoundingClientRect();
      return {
        cx: ((r.left + r.width / 2) - s.left) / s.width * 100,
        cy: ((r.top + r.height / 2) - s.top) / s.height * 100
      };
    }
    function placeAt(node, cx, cy) { node.style.left = cx + "%"; node.style.top = cy + "%"; }
    function boom(cx, cy, type) {
      const b = el("div", "aw-ff-boom");
      const strip = el("img", "aw-ff-boom-strip"); strip.src = imgUrl(EXPLO[type] + ".png"); strip.alt = "";
      b.append(strip);
      placeAt(b, cx, cy);
      scene.append(b);
      later(() => b.remove(), 620);
    }
    function spark(cx, cy) {
      const sp = el("img", "aw-ff-spark"); sp.src = imgUrl("spark.png"); sp.alt = "";
      placeAt(sp, cx, cy);
      scene.append(sp);
      later(() => sp.remove(), 480);
    }
    function floatMark(cx, cy, ok) {
      const m = el("img", "aw-ff-flymark" + (ok ? " is-ok" : " is-no"));
      m.src = imgUrl(ok ? "tick.png" : "cross.png"); m.alt = "";
      placeAt(m, cx, cy);
      scene.append(m);
      later(() => m.remove(), 780);
    }

    // ---------- ambient jungle creatures ----------
    function scheduleAmbient() {
      ambientTimer = later(() => {
        if (ended) return;
        const pick = randi(3);
        if (pick === 0) { ffSound.frog(); pulse(frogThroat); }
        else if (pick === 1) { ffSound.toucan(); pulse(toucan); }
        else { ffSound.monkey(); pulse(butterfly); }
        scheduleAmbient();
      }, 5000 + randi(6000));
    }
    function pulse(node) {
      node.classList.remove("is-pulse"); void node.offsetWidth; node.classList.add("is-pulse");
      later(() => node.classList.remove("is-pulse"), 700);
    }

    // ---------- end of game ----------
    ui.onSubmit(() => endGame(timerMode === "countDown" ? "time" : "submit"));
    function endGame(reason) {
      if (ended) return;
      ended = true;
      if (spawnTimer) clearTimer(spawnTimer);
      if (ambientTimer) clearTimer(ambientTimer);
      clearFruits();
      if (fitter) { fitter.destroy(); fitter = null; }

      if (reason === "won") ffSound.won();
      else if (reason === "gameover") ffSound.gameOver();
      else if (reason === "time") ffSound.timesUp();

      const title = reason === "won" ? "Well done!"
        : reason === "gameover" ? "Game over"
        : reason === "time" ? "Time's up"
        : "Game complete";

      // let the outcome sound breathe, then hand over to the engine celebration
      later(reallyFinish.bind(null, title), 420);
    }
    function reallyFinish(title) {
      const correctCount = results.filter(r => r === "correct").length;
      const review = items.map((it, i) => ({
        question: it.clue || it.word,
        answered: results[i] != null,
        yourText: results[i] === "correct" ? it.word : (results[i] === "failed" ? "—" : null),
        yourCorrect: results[i] === "correct",
        correctText: it.word,
        src: it   // `items` is a shallow copy, so `it` IS the content object
      }));
      ui.finish({
        correct: correctCount,
        incorrect: total - correctCount,
        total,
        score,   // penalized live score (pointsOff subtracted on wrong taps); === correctCount when pointsOff===0
        perQuestion: items.map((_, i) => ({ q: i, correct: results[i] === "correct" })),
        review,
        answered: results.filter(r => r != null).length,
        title
      });
    }

    // ---------- go ----------
    startItem(0);
    scheduleSpawn();
    scheduleAmbient();

    // ---------- cleanup ----------
    return function cleanup() {
      ended = true;
      if (spawnTimer) clearTimeout(spawnTimer);
      if (ambientTimer) clearTimeout(ambientTimer);
      timers.forEach(t => clearTimeout(t)); timers.clear();
      if (fitter) fitter.destroy();
      if (ui.topbarMid) ui.topbarMid.innerHTML = "";
    };
  }
};

// fruit word size (cqw) shrinks for longer words so it fits the fruit face
function wordFontCqw(w) {
  const n = (w || "").length;
  if (n <= 5) return 2.5;
  if (n <= 8) return 2.05;
  if (n <= 11) return 1.65;
  return 1.35;
}

registerTemplate(flyingFruitTemplate);
export default flyingFruitTemplate;
