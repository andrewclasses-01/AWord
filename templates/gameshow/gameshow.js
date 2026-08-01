// =============================================================
// TEMPLATE: GAMESHOW QUIZ — Wordwall "TV game show" style (= Classic in AWord).
// A multiple-choice quiz with TIME PRESSURE, POINTS, LIVES, a BONUS ROUND every
// few questions, and up to 4 LIFELINES. Data model is IDENTICAL to Quiz
// (content.questions[].answers[{text,correct}]) so it reuses the Quiz editor shape.
//
//   FLOW:  intro (TV doors slide apart) → per question: "Get ready!" → question
//          + 2–6 answer tiles → tap → correct (points by SPEED) / wrong (lose a
//          life if limited) → after every N questions a BONUS ROUND (pick 1 of 5
//          mystery cards for points) → last question → results (ranked by POINTS).
//
//   SCORE:  points = base + speed bonus (+ x2 lifeline). Reported to the engine
//           via ui.finish({ score, scoreText }) — core ranks & shows by points
//           (backward-compatible core change, see core/scoring.js).
//
//   Sounds: real Wordwall gameshow .mp3 (see gs-sound.js + Source GHI CHU).
//   Class prefix: .aw-gs-*   ·   Fixed TV-game-show art (not theme-driven).
// =============================================================

import { registerTemplate } from "../../core/registry.js";
import { shuffle, el } from "../../core/utils.js";
import { icons } from "../../core/icons.js";
import { autoFit } from "../../core/fit.js";
import { makeNumberStepper } from "../../core/numberstepper.js";
import { openGameshowEditor } from "./gameshow-editor.js";
import { gsSound } from "./gs-sound.js";

function imgUrl(name) { return new URL(`./img/${name}`, import.meta.url).href; }

// Points config
const BASE_POINTS = 100;   // for any correct answer
const SPEED_BONUS = 100;   // extra, scaled by how much time was left (timed only)
const BONUS_CARD_VALUES = [50, 100, 150, 200, 250];

const gameshowTemplate = {
  type: "gameshow",
  scorable: true,
  name: "Gameshow quiz",

  edit: openGameshowEditor,

  // The whole-game Timer control is hidden — Gameshow runs its OWN per-question
  // countdown (see core/engine.js buildOptionsPanel). Letters always show on the
  // answer tiles (A/B/C/D), so that option is hidden too.
  hideTimerOption: true,
  hideLettersOption: true,
  // Put the per-question countdown bar on the same top row as the score.
  inlineTimerBar: true,

  // Reuse the shared Print (Quiz format): each question -> {clue, answer, options}.
  toPrintItems(activity) {
    return (activity.content?.questions || [])
      .filter(q => q && Array.isArray(q.answers) && q.answers.length > 0)
      .map(q => ({
        clue: q.question || "",
        answer: (q.answers.find(a => a.correct) || q.answers[0] || {}).text || "",
        options: q.answers.filter(a => a && a.text != null).map(a => ({ text: a.text, correct: !!a.correct }))
      }));
  },

  // Engine lifecycle sounds. `complete` is a no-op so the engine's celebrate()
  // doesn't add its own fanfare — the template plays win/lose cues itself.
  sounds: {
    play: gsSound.play,
    restart: gsSound.restart,
    complete: gsSound.complete
  },

  // ----- Options panel extras: Time per question · Lives · Questions before a
  // bonus round · Lifelines (see CONG THUC MAU §5). `draft` is what Apply writes
  // back into activity.options, so we mutate fields on it directly. -----
  buildExtraOptions({ panel, draft, el, mkCheck }) {
    // Time per question (0 = no time pressure)
    const gT = el("div", "aw-opt-group");
    gT.append(el("div", "aw-opt-label", "Time per question"));
    const rowT = el("div", "aw-opt-row");
    const secs = typeof draft.gsSeconds === "number" ? draft.gsSeconds : 20;
    const stT = makeNumberStepper(secs, 0, 120, v => draft.gsSeconds = v);
    rowT.append(stT.el, document.createTextNode(" seconds  (0 = no timer)"));
    gT.append(rowT); panel.append(gT);

    // Lives (0 = Unlimited)
    const gL = el("div", "aw-opt-group");
    gL.append(el("div", "aw-opt-label", "Lives"));
    const rowL = el("div", "aw-opt-row");
    const lv = typeof draft.lives === "number" ? draft.lives : 0;
    const note = document.createTextNode(lv === 0 ? " (0 = Unlimited)" : " lives");
    const stL = makeNumberStepper(lv, 0, 9, v => { draft.lives = v; note.textContent = v === 0 ? " (0 = Unlimited)" : " lives"; });
    rowL.append(stL.el, note);
    gL.append(rowL); panel.append(gL);

    // Questions before a bonus round (0 = no bonus round)
    const gB = el("div", "aw-opt-group");
    gB.append(el("div", "aw-opt-label", "Questions before a bonus round"));
    const rowB = el("div", "aw-opt-row");
    const be = typeof draft.bonusEvery === "number" ? draft.bonusEvery : 3;
    const stB = makeNumberStepper(be, 0, 20, v => draft.bonusEvery = v);
    rowB.append(stB.el, document.createTextNode("  (0 = off)"));
    gB.append(rowB); panel.append(gB);

    // Lifelines
    const gLL = el("div", "aw-opt-group");
    gLL.append(el("div", "aw-opt-label", "Lifelines"));
    const rowLL = el("div", "aw-opt-row");
    const ll = draft.lifelines || (draft.lifelines = { fifty: true, x2: true, time: true, cheat: true });
    rowLL.append(
      mkCheck(ll.fifty !== false, "50:50", v => ll.fifty = v),
      mkCheck(ll.x2 !== false, "x2 Score", v => ll.x2 = v),
      mkCheck(ll.time !== false, "Extra Time", v => ll.time = v),
      mkCheck(ll.cheat !== false, "Cheat", v => ll.cheat = v)
    );
    gLL.append(rowLL); panel.append(gLL);
  },
  // Changing any of the above makes the CURRENT play meaningless -> restart.
  optionsNeedRestart() { return true; },

  mount(root, activity, ui) {
    const opt = activity.options || {};

    // ----- config -----
    const secondsPerQ = typeof opt.gsSeconds === "number" ? opt.gsSeconds : 20;
    const timed = secondsPerQ > 0;
    const livesMax = typeof opt.lives === "number" ? opt.lives : 0;   // 0 = unlimited
    const limitedLives = livesMax > 0;
    const bonusEvery = typeof opt.bonusEvery === "number" ? opt.bonusEvery : 3;
    const LL = Object.assign({ fifty: true, x2: true, time: true, cheat: true }, opt.lifelines || {});

    // ----- questions (shuffle once so it's stable) -----
    let questions = [...(activity.content?.questions || [])]
      .filter(q => q && Array.isArray(q.answers) && q.answers.some(a => a && a.correct) && q.answers.length >= 2);
    if (opt.shuffleQuestions !== false) questions = shuffle(questions);
    questions = questions.map(q => ({
      question: q.question || "",
      answers: (opt.shuffleAnswers !== false ? shuffle(q.answers) : [...q.answers]).filter(a => a && a.text != null)
    }));
    const total = questions.length;

    // ----- scene -----
    root.innerHTML = "";
    const stage = el("div", "aw-gs-stage");
    stage.append(Object.assign(el("img", "aw-gs-audience"), { src: imgUrl("audience.webp"), alt: "" }));
    stage.append(Object.assign(el("img", "aw-gs-light aw-gs-light-l"), { src: imgUrl("stagelight-left.webp"), alt: "" }));
    stage.append(Object.assign(el("img", "aw-gs-light aw-gs-light-r"), { src: imgUrl("stagelight-right.webp"), alt: "" }));

    // HUD (points left · lives right)
    const hud = el("div", "aw-gs-hud");
    const pointsSign = el("div", "aw-gs-points");
    pointsSign.append(el("span", "aw-gs-points-num", "0"), el("span", "aw-gs-points-lbl", "PTS"));
    const livesBox = el("div", "aw-gs-lives");
    hud.append(pointsSign, livesBox);

    // Question board (marquee frame + starburst)
    const board = el("div", "aw-gs-board");
    const play = el("div", "aw-gs-play");
    board.append(play);

    // Lifelines strip
    const llBar = el("div", "aw-gs-llbar");

    stage.append(hud, board, llBar);
    root.append(stage);

    // Per-question countdown bar in the top row (engine topbarMid)
    const timerWrap = el("div", "aw-gs-timerwrap");
    const timerSec = el("span", "aw-gs-timersec", "");
    const timerBar = el("div", "aw-gs-timerbar");
    const timerFill = el("div", "aw-gs-timerfill");
    timerBar.append(timerFill);
    timerWrap.append(timerSec, timerBar);
    if (ui.topbarMid) ui.topbarMid.append(timerWrap);
    if (!timed) timerWrap.style.visibility = "hidden";
    // Belt-and-braces: Gameshow never uses the whole-game timer — hide the
    // engine's top-left clock if some default left it on (we run our own).
    const topClock = ui.topbarMid?.parentElement?.querySelector(".aw-top-timer");
    if (topClock) topClock.style.display = "none";

    if (total === 0) {
      play.append(el("div", "aw-gs-empty", "This game has no questions yet."));
      return () => {};
    }

    // ----- state -----
    const state = questions.map(() => ({ resolved: false, chosen: null, correct: false, timedOut: false }));
    let index = 0;
    let finished = false;
    let points = 0;
    let streak = 0;
    let livesLeft = limitedLives ? livesMax : Infinity;
    let fitter = null;
    const used = { fifty: false, x2: false, time: false, cheat: false };
    let doubleArmed = false;
    // timer
    let tickId = null, qDeadline = 0, warned = false;
    // pending timeouts to clear on cleanup/restart
    const pending = new Set();
    function later(fn, ms) { const id = setTimeout(() => { pending.delete(id); fn(); }, ms); pending.add(id); return id; }

    ui.onSubmit(() => finishGame(true, true), () => state.filter(s => s.chosen !== null).length);   // block "Submit answers" at 0 answered
    ui.setScore(0);
    ui.setNav({ index: 1, total, onPrev: null, onNext: null });
    window.addEventListener("keydown", onKey);

    renderLives();
    renderLifelines();
    introDoors(() => nextGetReady());

    // ============================================================= INTRO
    function introDoors(done) {
      const doors = el("div", "aw-gs-doors");
      const dl = Object.assign(el("div", "aw-gs-door aw-gs-door-l"), {});
      const dr = Object.assign(el("div", "aw-gs-door aw-gs-door-r"), {});
      dl.style.backgroundImage = `url(${imgUrl("introdoor-left.webp")})`;
      dr.style.backgroundImage = `url(${imgUrl("introdoor-right.webp")})`;
      doors.append(dl, dr);
      stage.append(doors);
      gsSound.openDoor();
      gsSound.musicStart();
      // slide apart
      later(() => { dl.classList.add("is-open"); dr.classList.add("is-open"); }, 380);
      let gone = false;
      const remove = () => { if (gone) return; gone = true; doors.remove(); done(); };
      later(remove, 1500);
    }

    // ============================================================= GET READY
    function nextGetReady() {
      if (finished) return;
      const gr = el("div", "aw-gs-getready");
      gr.append(el("div", "aw-gs-gr-q", `Question ${index + 1}`),
                el("div", "aw-gs-gr-txt", "Get ready!"));
      play.innerHTML = ""; play.append(gr);
      gsSound.getReady();
      later(showQuestion, 1150);
    }

    // ============================================================= QUESTION
    function showQuestion() {
      if (finished) return;
      if (fitter) { fitter.destroy(); fitter = null; }
      const q = questions[index];
      const st = state[index];

      play.innerHTML = "";
      const card = el("div", "aw-gs-card");
      card.append(el("div", "aw-gs-question", escapeHtml(q.question)));

      const answers = el("div", "aw-gs-answers");
      const n = q.answers.length;
      answers.style.setProperty("--per-row", n <= 4 ? n : Math.ceil(n / 2));
      q.answers.forEach((ans, i) => {
        const tile = el("button", "aw-gs-tile");
        tile.append(el("span", "aw-gs-letter", String.fromCharCode(65 + i)));
        tile.append(el("span", "aw-gs-tiletext", escapeHtml(ans.text)));
        tile.dataset.i = i;
        tile.onclick = () => resolveQuestion(i);
        answers.append(tile);
      });
      card.append(answers);
      play.append(card);

      const qEl = card.querySelector(".aw-gs-question");
      const aEl = card.querySelector(".aw-gs-answers");
      fitter = autoFit(root, card, s => card.style.setProperty("--fit", s), {
        slack: root.clientWidth * 0.05,
        measure: () => qEl.offsetHeight + aEl.offsetHeight
      });

      ui.setNav({ index: index + 1, total, onPrev: null, onNext: st.resolved ? null : () => resolveQuestion(null) });
      gsSound.questionAppear();
      startTimer();
      renderLifelines();
    }

    function tiles() { return [...play.querySelectorAll(".aw-gs-tile")]; }

    // ============================================================= TIMER
    function startTimer() {
      stopTimer();
      if (!timed) { timerWrap.style.visibility = "hidden"; return; }
      timerWrap.style.visibility = "visible";
      qDeadline = performance.now() + secondsPerQ * 1000;
      warned = false;
      updateBar();
      tickId = setInterval(() => {
        updateBar();
        const left = qDeadline - performance.now();
        if (left <= 5000 && left > 0 && !warned) { warned = true; gsSound.clockTick(); }
        if (left <= 0) { stopTimer(); resolveQuestion(null, true); }
      }, 100);
    }
    function stopTimer() { if (tickId) { clearInterval(tickId); tickId = null; } }
    function updateBar() {
      const totalMs = secondsPerQ * 1000;
      const left = Math.max(0, qDeadline - performance.now());
      const frac = Math.max(0, Math.min(1, left / totalMs));
      timerFill.style.width = (frac * 100) + "%";
      timerFill.classList.toggle("is-low", frac <= 0.25);
      timerSec.textContent = Math.ceil(left / 1000) + "s";
    }
    function timeFrac() {
      if (!timed) return 1;
      return Math.max(0, Math.min(1, (qDeadline - performance.now()) / (secondsPerQ * 1000)));
    }

    // ============================================================= RESOLVE
    function resolveQuestion(chosen, byTimeout = false) {
      const st = state[index];
      if (st.resolved || finished) return;
      st.resolved = true;
      st.chosen = chosen;
      st.timedOut = !!byTimeout;
      const q = questions[index];
      const correct = chosen !== null && !!q.answers[chosen].correct;
      st.correct = correct;
      stopTimer();
      timerWrap.style.visibility = "hidden";

      const ts = tiles();
      ts.forEach(t => { t.disabled = true; t.onclick = null; });

      // mark tiles: correct tile always shows ✓; chosen-wrong shows ✗; others dim
      const correctIdx = q.answers.findIndex(a => a.correct);
      ts.forEach((t, i) => {
        if (i === correctIdx) { t.classList.add("is-right"); t.append(badge(icons.markCheck)); }
        else { t.classList.add("is-dim"); if (i === chosen) { t.classList.add("is-wrong"); t.append(badge(icons.markCross)); } }
      });

      if (correct) {
        const chosenTile = ts[chosen];
        flyMark(chosenTile, true);
        // points: base + speed bonus (timed), doubled if x2 armed
        let gained = BASE_POINTS + (timed ? Math.round(SPEED_BONUS * timeFrac()) : 0);
        const fast = timed && timeFrac() >= 0.6;
        streak++;
        if (doubleArmed) { gained *= 2; doubleArmed = false; pointsSign.classList.remove("is-x2"); }
        addPoints(gained);
        (fast || streak >= 3) ? gsSound.perfect() : gsSound.correct();
        gsSound.plusScore();
      } else {
        if (chosen !== null) { flyMark(ts[chosen], false); }
        streak = 0;
        if (doubleArmed) { doubleArmed = false; pointsSign.classList.remove("is-x2"); }
        byTimeout ? gsSound.timesUp() : gsSound.wrong();
        loseLife();
      }
      ui.setScore(state.filter(s => s.correct).length);
      ui.setNav({ index: index + 1, total, onPrev: null, onNext: null });

      if (finished) return;   // ran out of lives
      later(afterResolve, correct ? 1050 : 1650);
    }

    function afterResolve() {
      if (finished) return;
      const resolvedCount = index + 1;
      const isLast = index >= total - 1;
      const wantBonus = bonusEvery > 0 && resolvedCount % bonusEvery === 0 && !isLast;
      if (wantBonus) { bonusRound(() => advance()); }
      else advance();
    }
    function advance() {
      if (finished) return;
      if (index >= total - 1) { finishGame(true); return; }
      index++;
      gsSound.chipDisappear();
      nextGetReady();
    }

    // ============================================================= POINTS / LIVES
    function addPoints(n) {
      points += n;
      const numEl = pointsSign.querySelector(".aw-gs-points-num");
      numEl.textContent = String(points);
      pointsSign.classList.remove("is-bump"); void pointsSign.offsetWidth; pointsSign.classList.add("is-bump");
      // little "+N" popping off the score sign
      const pop = el("div", "aw-gs-plus", "+" + n);
      pointsSign.append(pop);
      later(() => pop.remove(), 900);
    }
    function loseLife() {
      if (!limitedLives) return;
      livesLeft = Math.max(0, livesLeft - 1);
      renderLives();
      if (livesLeft <= 0) { finishGame(false); }
    }
    function renderLives() {
      livesBox.innerHTML = "";
      if (!limitedLives) return;
      for (let i = 0; i < livesMax; i++) {
        livesBox.append(el("span", "aw-gs-heart" + (i < livesLeft ? "" : " is-empty"), "♥"));
      }
    }

    // ============================================================= LIFELINES
    function renderLifelines() {
      llBar.innerHTML = "";
      const defs = [
        { key: "fifty", label: "50:50", on: LL.fifty },
        { key: "x2", label: "×2", on: LL.x2 },
        { key: "time", label: "+TIME", on: LL.time && timed },
        { key: "cheat", label: "REVEAL", on: LL.cheat }
      ];
      const st = state[index];
      defs.forEach(d => {
        if (!d.on) return;
        const b = el("button", "aw-gs-ll" + (used[d.key] ? " is-used" : ""), d.label);
        b.type = "button";
        b.disabled = used[d.key] || !st || st.resolved;
        b.onclick = () => useLifeline(d.key);
        llBar.append(b);
      });
    }
    function useLifeline(key) {
      const st = state[index];
      if (!st || st.resolved || used[key] || finished) return;
      const q = questions[index];
      if (key === "fifty") {
        const wrongIdx = q.answers.map((a, i) => (!a.correct ? i : -1)).filter(i => i >= 0);
        if (wrongIdx.length < 2) return;
        shuffle(wrongIdx).slice(0, 2).forEach(i => {
          const t = tiles()[i];
          if (t) { t.classList.add("is-removed"); t.disabled = true; t.onclick = null; }
        });
        used.fifty = true; gsSound.useLifeline(); gsSound.lifeline5050();
      } else if (key === "x2") {
        doubleArmed = true; pointsSign.classList.add("is-x2");
        used.x2 = true; gsSound.useLifeline(); gsSound.lifelineX2();
      } else if (key === "time") {
        if (!timed) return;
        qDeadline += 10000; warned = false; updateBar();
        used.time = true; gsSound.useLifeline(); gsSound.lifelineTime();
      } else if (key === "cheat") {
        const ci = q.answers.findIndex(a => a.correct);
        const t = tiles()[ci];
        if (t) { t.classList.add("is-cheat"); later(() => t.classList.remove("is-cheat"), 1400); }
        used.cheat = true; gsSound.useLifeline(); gsSound.lifelineCheat();
      }
      renderLifelines();
    }

    // ============================================================= BONUS ROUND
    function bonusRound(done) {
      if (finished) { done(); return; }
      const ov = el("div", "aw-gs-bonus");
      const book = el("div", "aw-gs-book");
      book.append(Object.assign(el("div", "aw-gs-bookhalf aw-gs-book-l"), { style: `background-image:url(${imgUrl("bonusdoor-left.png")})` }));
      book.append(Object.assign(el("div", "aw-gs-bookhalf aw-gs-book-r"), { style: `background-image:url(${imgUrl("bonusdoor-right.png")})` }));
      const title = el("div", "aw-gs-bonus-title", "BONUS ROUND");
      const cardsWrap = el("div", "aw-gs-cards");
      ov.append(book, title, cardsWrap);
      stage.append(ov);
      gsSound.bonusStart();

      const values = shuffle(BONUS_CARD_VALUES);
      let picked = false;
      later(() => {
        gsSound.tileAppear();
        values.forEach((val, i) => {
          const c = el("button", "aw-gs-bcard");
          c.type = "button";
          c.style.setProperty("--i", i);
          c.append(el("span", "aw-gs-card-face aw-gs-card-back", "?"));
          const front = el("span", "aw-gs-card-face aw-gs-card-front");
          front.append(el("span", "aw-gs-card-plus", "+" + val), el("span", "aw-gs-card-lbl", "Points"));
          c.append(front);
          c.onclick = () => {
            if (picked) return; picked = true;
            gsSound.bonusPick();
            [...cardsWrap.children].forEach(x => { if (x !== c) x.classList.add("is-fade"); });
            gsSound.bonusFlip();
            c.classList.add("is-flip");
            later(() => {
              gsSound.bonusReveal();
              addPoints(val);
              ui.setScore(state.filter(s => s.correct).length);
            }, 480);
            let closed = false;
            const close = () => { if (closed) return; closed = true; ov.remove(); done(); };
            later(close, 1900);
          };
          cardsWrap.append(c);
        });
        // reveal-appear stagger handled by CSS var --i
        requestAnimationFrame(() => cardsWrap.classList.add("is-in"));
      }, 700);
    }

    // ============================================================= HELPERS
    function badge(svg) { return el("span", "aw-tile-badge", svg); }
    function flyMark(tile, ok) {
      if (!tile) return;
      const f = el("span", "aw-mark-fly" + (ok ? "" : " is-cross"), ok ? icons.markCheck : icons.markCross);
      tile.append(f);
      later(() => f.remove(), ok ? 900 : 2000);
    }

    function onKey(e) {
      if (finished) return;
      const st = state[index];
      if (!st || st.resolved) return;
      const num = parseInt(e.key, 10);
      if (Number.isInteger(num) && num >= 1) {
        const t = tiles()[num - 1];
        if (t && !t.disabled) t.click();
      }
    }

    // ============================================================= FINISH
    function finishGame(win, submitted = false) {
      if (finished) return;
      finished = true;
      stopTimer();
      pending.forEach(clearTimeout); pending.clear();
      gsSound.musicStop();
      win ? gsSound.gameComplete() : gsSound.gameOver();

      const perQuestion = state.map((s, i) => ({ q: i, correct: s.correct === true }));
      const correct = perQuestion.filter(p => p.correct).length;
      const review = questions.map((q, i) => {
        const s = state[i];
        const correctAns = q.answers.find(a => a.correct);
        return {
          question: q.question,
          answered: s.chosen !== null,
          yourText: s.chosen !== null ? q.answers[s.chosen].text : null,
          yourCorrect: s.correct === true,
          correctText: correctAns ? correctAns.text : ""
        };
      });
      const answered = state.filter(s => s.chosen !== null).length;
      ui.finish({
        correct, incorrect: total - correct, total, perQuestion, review, answered,
        score: points, scoreText: String(points),
        title: win ? "Game complete" : "Game over"
      });
    }

    // ----- cleanup -----
    return function cleanup() {
      window.removeEventListener("keydown", onKey);
      stopTimer();
      pending.forEach(clearTimeout); pending.clear();
      gsSound.musicStop();
      if (fitter) fitter.destroy();
    };
  }
};

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

registerTemplate(gameshowTemplate);
export default gameshowTemplate;
