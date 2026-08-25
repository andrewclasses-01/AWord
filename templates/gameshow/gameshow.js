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
import { press } from "../../core/press.js";
import { icons } from "../../core/icons.js";
import { autoFit } from "../../core/fit.js";
import { makeHStepper } from "../../core/numberstepper.js";
import { createVoicePlayer, voiceView } from "../../core/voice-playback.js";
import { openGameshowEditor } from "./gameshow-editor.js";
import { gsSound } from "./gs-sound.js";

function imgUrl(name) { return new URL(`./img/${name}`, import.meta.url).href; }

// Points config
const BASE_POINTS = 100;   // for any correct answer
const SPEED_BONUS = 100;   // extra, scaled by how much time was left (timed only)
const BONUS_CARD_VALUES = [50, 100, 150, 200, 250];

// Menu pause (Đợt 91, 8/8/2026) — bridges the CURRENT mount's pause/resume
// pair out to the template-level `onPause` hook engine.js calls. Module-level
// single, same pattern as running-word's `rwEndData`: AWord only ever mounts
// one activity at a time.
let gsPauseHandlers = null;

const gameshowTemplate = {
  type: "gameshow",
  scorable: true,
  // "Start with mistakes" (Đợt 84): which array in activity.content holds the
  // playable items. Core filters THAT array by the `src` refs the review rows
  // carry, so a replay keeps the originals untouched. See core/mistakes.js.
  itemsKey: "questions",
  // ⭐ Đợt 178 — SHOWDOWN. `index` advances in one place only (`advance()`), the
  // bonus round never touches it and never adds a review row, and `review` is
  // `questions.map((q, i) => …)` on that index. See `nextGetReady()` for why the
  // name is handed over on the "Get ready!" screen rather than at the question.
  showdownMode: true,
  // ⭐ Đợt 261 — mở dải QUESTIONS EACH (Normal · Free · Count) cho game này. Một dòng cờ,
  // đúng đường fightTurns của Đợt 202 và sdDeal của Đợt 220 đã đi. Thầy chốt 25/8/2026 khi
  // bỏ hẳn Balance questions: Count là cơ chế công bằng DUY NHẤT còn lại, nên nó phải có mặt
  // ở mọi game Showdown chịu được việc NỐI DÀI mảng câu.
  // ⛔ Ba game bàn-chơi (Crossword · Open the box · Find the match) KHÔNG được mở: mảng câu
  // của chúng CHÍNH LÀ cái bàn, nối dài là ô chữ có một từ hai lần.
  sdDeal: true,
  hidePointsOff: true,   // speed-based scoring, never a flat per-wrong penalty (teacher, 3/8/2026)
  // ⭐⭐ Đợt 213b (thầy, 20/8/2026) — THỨ TỰ Ô TÍCH, theo CỘT.
  // Thầy đọc từng cột: "cột 1 <trên>/<dưới>, cột 2 …". Khối đổ theo CỘT (đầy cột 1
  // từ trên xuống rồi mới sang cột 2 — xem `.aw-checks` trong core/app.css), nên
  // danh sách này đọc thẳng thành bố cục: 2 mã đầu = cột 1, 2 mã kế = cột 2, …
  // ⛔ Là MÃ ĐỊNH DANH, không phải chữ hiện ra (chữ có thể đổi — chính đợt này đã
  // đổi "Show answer when wrong" thành "Show corrects").
  // ⚠️ Mã không có trong danh sách (Fight "In turns", Showdown "Balance questions")
  // tự xuống cuối — hai mode đó thầy chưa xếp.
  checkOrder: ["shuffle", "shuffleAnswers", "showAnswers", "ll5050", "llX2", "llTime", "llCheat"],
  name: "Gameshow quiz",
  // Đợt 122 — ảnh template tự dựng bằng JS (đèn sân khấu, khán giả, 2 cánh cửa
  // vòng bonus). Phần nền/khung màn hình khai trong gameshow.css thì engine tự
  // quét, không kê lại ở đây.
  preloadImages: ["stagelight-left.webp", "stagelight-right.webp", "audience.webp",
                  "bonusdoor-left.png", "bonusdoor-right.png"].map(imgUrl),

  edit: openGameshowEditor,

  usesShuffleAnswers: true,   // Đợt 143 (opt-in) — this game really does read options.shuffleAnswers

  // The whole-game Timer control is hidden — Gameshow runs its OWN per-question
  // countdown (see core/options-panel.js). Letters A/B/C/D are permanent here,
  // and since Đợt 143 there is no "Letters on answers" option anywhere at all.
  hideTimerOption: true,
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
  // Đợt 140 — shared panel builders. The three ▲/▼ steppers became one
  // horizontal stepper (seconds need an exact number) and two sliders, so this
  // game's four groups collapse into two rows of the panel grid.
  buildExtraOptions({ panel, draft, mkCell, mkSliderCell, addCheck }) {
    // Time per question (0 = no time pressure)
    const cTime = mkCell({ label: "Question time", sub: "0 = off" });
    const stT = makeHStepper(typeof draft.gsSeconds === "number" ? draft.gsSeconds : 20,
      0, 120, v => { draft.gsSeconds = v; }, { format: v => (v === 0 ? "Off" : v + "s") });
    cTime.ctl.append(stT.el);

    panel.append(
      cTime.cell,
      // Lives (0 = Unlimited)
      mkSliderCell({
        label: "Lives", min: 0, max: 9, step: 1,
        value: typeof draft.lives === "number" ? draft.lives : 0, tone: "green", offAt: 0,
        fmt: v => (v === 0 ? "∞" : String(v)),
        onInput: v => { draft.lives = v; }
      }).cell,
      // Questions before a bonus round (0 = no bonus round)
      mkSliderCell({
        label: "Bonus round", sub: "every N", min: 0, max: 20, step: 1,
        value: typeof draft.bonusEvery === "number" ? draft.bonusEvery : 3, tone: "amber", offAt: 0,
        fmt: v => (v === 0 ? "Off" : String(v)),
        onInput: v => { draft.bonusEvery = v; }
      }).cell
    );

    // Lifelines — four switches, so they join the shared checkbox block
    const ll = draft.lifelines || (draft.lifelines = { fifty: true, x2: true, time: true, cheat: true });
    addCheck("50:50", ll.fifty !== false, v => ll.fifty = v, { key: "ll5050", title: "Lifeline: 50:50" });
    addCheck("x2 Score", ll.x2 !== false, v => ll.x2 = v, { key: "llX2", title: "Lifeline: double score" });
    addCheck("Extra Time", ll.time !== false, v => ll.time = v, { key: "llTime", title: "Lifeline: extra time" });
    addCheck("Cheat", ll.cheat !== false, v => ll.cheat = v, { key: "llCheat", title: "Lifeline: cheat" });
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
      answers: (opt.shuffleAnswers !== false ? shuffle(q.answers) : [...q.answers]).filter(a => a && a.text != null),
      src: q   // the ORIGINAL content object — "Start with mistakes" filters by it
    }));
    const total = questions.length;

    // Pronunciation playback (10/8/2026) — optional per-question, carried
    // through Change Template from an Anagram source (core/convert.js).
    // No extra "wait for the intro chime" delay is needed here (unlike
    // simpler templates) — showQuestion() only ever runs after the TV-doors
    // intro AND the ~1.65s "Get ready!" screen, both already well past any
    // startup chime by the time the first question actually appears.
    const voicePlayer = createVoicePlayer();

    // ----- scene -----
    root.innerHTML = "";

    // Full-bleed background across the WHOLE 16:9 stage (behind the engine's top
    // & bottom bars too). Three layers are added on `.aw-stage` itself:
    //   • a light-blue "harlequin studio" base (painted by .aw-gs-full)
    //   • .aw-gs-decor — spotlights + audience silhouettes (the studio)
    //   • .aw-gs-screen — the blue-starburst question backdrop with a pink edge
    //     border, faded IN during a question and OUT during the "Get ready" frame
    // Everything here is template-scoped and undone in cleanup() — no core file
    // is touched. `stageEl`/`innerEl` come from walking up out of the play area.
    const stageEl = root.closest(".aw-stage");
    const innerEl = root.closest(".aw-stage-inner");
    if (stageEl) stageEl.classList.add("aw-gs-full");
    if (innerEl) innerEl.classList.add("aw-gs-inner");

    const decor = el("div", "aw-gs-decor");
    decor.append(Object.assign(el("img", "aw-gs-light aw-gs-light-l"), { src: imgUrl("stagelight-left.webp"), alt: "" }));
    decor.append(Object.assign(el("img", "aw-gs-light aw-gs-light-r"), { src: imgUrl("stagelight-right.webp"), alt: "" }));
    decor.append(Object.assign(el("img", "aw-gs-audience"), { src: imgUrl("audience.webp"), alt: "" }));

    const screen = el("div", "aw-gs-screen");   // blue-starburst question backdrop (toggled .is-on)
    if (stageEl) { stageEl.prepend(screen); stageEl.prepend(decor); }

    const stage = el("div", "aw-gs-stage");

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
    let tickId = null, qDeadline = 0, warned = false, pausedQAt = 0;
    // pending timeouts to clear on cleanup/restart
    const pending = new Set();
    function later(fn, ms) { const id = setTimeout(() => { pending.delete(id); fn(); }, ms); pending.add(id); return id; }

    ui.onSubmit(() => finishGame(true, true), () => state.filter(s => s.chosen !== null).length);   // block "Submit answers" at 0 answered
    /**
     * ⭐⭐⭐ TIME EACH ROUND — OUT OF TIME (Đợt 265, thầy 26/8/2026).
     * "Time each round" is offered for EVERY Showdown game (core/options-panel.js builds
     * the row on `showdown`, not on a template flag), but until this đợt only Quiz,
     * Anagram and Type the answer answered the buzzer — everywhere else the bar simply
     * emptied and the tiles stayed live. See true-false.js's roundTimeUp() for the
     * teacher's report in full.
     *
     * ⭐ This game needed no new rule: `resolveQuestion(null, true)` IS its out-of-time
     * path — its OWN per-question clock has called it since day one (tickCountdown), and
     * it already does everything the teacher asked for: no tile marked as the pupil's,
     * the correct one revealed, the "time's up" cue, a lost heart, and the move on to the
     * next question. Writing a second version of that would be two rules for one event.
     * ⚠️ SAFE ALONGSIDE THE GAME'S OWN CLOCK. Both can be running (Options ▸ Time per
     * question AND Showdown ▸ Time each round); whichever buzzes first resolves, and
     * `st.resolved` makes the second call a no-op — the guard is already the first line.
     */
    ui.setRoundTimeout?.(() => resolveQuestion(null, true));
    ui.setScore(0);
    ui.setNav({ index: 1, total, onPrev: null, onNext: null });
    window.addEventListener("keydown", onKey);

    renderLives();
    renderLifelines();
    introShow(() => nextGetReady());

    // ============================================================= INTRO (≈6s — matches intro.mp3)
    // Big "ANDREW CLASSES / QUIZ SHOW" marquee sign bounces onto the harlequin
    // studio (spotlights + APPLAUSE + audience from .aw-gs-decor), holds while its
    // bulbs twinkle, then the TV "opens" (zooms toward you) into Question 1.
    function introShow(done) {
      gsSound.musicStart();
      stage.style.visibility = "hidden";   // hide the play-area HUD/lifelines behind the sign
      const ov = el("div", "aw-gs-intro");
      ov.append(el("div", "aw-gs-applause", "APPLAUSE"));
      const sign = el("div", "aw-gs-sign");
      const scr = el("div", "aw-gs-scr aw-gs-scr-intro");
      const big = el("div", "aw-gs-sign-big");
      big.append(el("span", "aw-gs-sign-line", "QUIZ"), el("span", "aw-gs-sign-line", "SHOW"));
      scr.append(el("div", "aw-gs-sign-top", "ANDREW CLASSES"), big);
      sign.append(scr, el("div", "aw-gs-frame-img"));
      ov.append(sign);
      (stageEl || stage).append(ov);   // stage-level so the sign is big like the original
      later(() => { gsSound.openDoor(); ov.classList.add("is-open"); }, 5200);
      later(() => { ov.remove(); done(); }, 6000);
    }

    // ============================================================= GET READY (before EVERY question)
    // The green marquee TV frame drops onto the studio; its screen shows the blue
    // starburst + a yellow dashed box "Question N / Get ready!". After a beat the
    // frame "opens" (zooms away) and the full-bleed question screen fades in.
    function nextGetReady() {
      if (finished) return;
      // ⭐ Đợt 178 — SHOWDOWN: hand the name over ON THE "GET READY" SCREEN, not
      // 1.65s later when the question appears. `setNav` further down already
      // carries the right index, so this is not needed for correctness — it is
      // needed for the CLASSROOM: this interstitial is the whole window the next
      // pupil has to walk to the board, and it is useless if it does not yet say
      // whose turn it is. The two numbers are the TV frame's own open/fade.
      ui.itemChanging?.(index, { outMs: 200, inMs: 300 });
      screen.classList.remove("is-on");            // studio (harlequin) shows behind the frame
      stage.style.visibility = "hidden";           // hide HUD/lifelines during Get ready
      play.innerHTML = "";
      const frame = el("div", "aw-gs-frame");
      const body = el("div", "aw-gs-frame-body");
      const scr = el("div", "aw-gs-scr aw-gs-scr-gr");
      const box = el("div", "aw-gs-gr-box");
      box.append(el("div", "aw-gs-gr-q", `Question ${index + 1}`),
                 el("div", "aw-gs-gr-txt", "Get ready!"));
      scr.append(box);
      body.append(scr, el("div", "aw-gs-frame-img"));
      frame.append(body);
      (stageEl || stage).append(frame);   // stage-level so it spans the whole studio
      gsSound.getReady();
      later(() => { frame.classList.add("is-open"); screen.classList.add("is-on"); }, 1200);
      later(() => { frame.remove(); showQuestion(); }, 1650);
    }

    // ============================================================= QUESTION
    function showQuestion() {
      if (finished) return;
      stage.style.visibility = "visible";          // bring the HUD/lifelines back for play
      if (fitter) { fitter.destroy(); fitter = null; }
      const q = questions[index];
      const st = state[index];

      voicePlayer.stop();   // silence the PREVIOUS question's clip, if any
      play.innerHTML = "";
      const card = el("div", "aw-gs-card");
      const vv = voiceView(activity, q.src);   // Options > Content decides text/voice
      const hasVoice = vv.hasVoice, hideText = vv.hideText;
      const qEl0 = hideText
        ? el("div", "aw-gs-question aw-clue-voiceonly")
        : el("div", "aw-gs-question", escapeHtml(q.question));
      card.append(qEl0);
      if (hasVoice) {
        const vBtn = el("button", "aw-voicebtn" + (hideText ? " aw-voicebtn-lg" : ""), icons.soundOn);
        vBtn.type = "button";
        vBtn.setAttribute("aria-label", "Listen to pronunciation");
        press(vBtn, e => { e.stopPropagation(); voicePlayer.toggle(q.src.voice, vBtn); });
        qEl0.append(vBtn);
        if (vv.autoPlay) voicePlayer.play(q.src.voice, vBtn);
      }

      const answers = el("div", "aw-gs-answers");
      const n = q.answers.length;
      answers.style.setProperty("--per-row", n <= 4 ? n : Math.ceil(n / 2));
      q.answers.forEach((ans, i) => {
        const tile = el("button", "aw-gs-tile");
        tile.append(el("span", "aw-gs-letter", String.fromCharCode(65 + i)));
        tile.append(el("span", "aw-gs-tiletext", escapeHtml(ans.text)));
        tile.dataset.i = i;
        press(tile, () => resolveQuestion(i));   // instant on touch-down — core/press.js
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
    // `tickCountdown` is split out so Menu-pause (below) can restart the exact
    // same interval after shifting `qDeadline`, without duplicating it.
    function tickCountdown() {
      updateBar();
      const left = qDeadline - performance.now();
      if (left <= 5000 && left > 0 && !warned) { warned = true; gsSound.clockTick(); }
      if (left <= 0) { stopTimer(); resolveQuestion(null, true); }
    }
    function startTimer() {
      stopTimer();
      if (!timed) { timerWrap.style.visibility = "hidden"; return; }
      timerWrap.style.visibility = "visible";
      qDeadline = performance.now() + secondsPerQ * 1000;
      warned = false;
      updateBar();
      tickId = setInterval(tickCountdown, 100);
    }
    function stopTimer() { if (tickId) { clearInterval(tickId); tickId = null; } }

    // ----- Menu pause (Đợt 91) -----
    // Without this, a question's per-Q countdown keeps running behind the
    // dimmed Menu popup and can auto-timeout (mark it wrong) while the
    // teacher isn't even looking at the game. Shifts `qDeadline` forward by
    // the paused duration on resume, same trick as the core clock.
    function pauseGame() {
      if (tickId) { clearInterval(tickId); tickId = null; pausedQAt = performance.now(); }
      gsSound.musicPause();
    }
    function resumeGame() {
      if (pausedQAt) {
        qDeadline += performance.now() - pausedQAt;
        pausedQAt = 0;
        if (timed && !finished) tickId = setInterval(tickCountdown, 100);
      }
      gsSound.musicResume();
    }
    gsPauseHandlers = { pause: pauseGame, resume: resumeGame };
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
      // ⭐⭐ Đợt 265 — TIME EACH ROUND: this pupil's turn is over the moment the question
      // resolves, so their clock stops here (Quiz/Anagram/Type the answer have done this
      // since Đợt 174). Without it the count down went on through the 1-1.6s mark-and-hold,
      // any bonus round, and the "get ready" card for the NEXT question — all charged to
      // whoever had just answered.
      ui.roundDone?.();
      const q = questions[index];
      const correct = chosen !== null && !!q.answers[chosen].correct;
      st.correct = correct;
      stopTimer();
      timerWrap.style.visibility = "hidden";

      const ts = tiles();
      ts.forEach(t => { t.disabled = true; });   // press() honours `disabled` — no handler to null out

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
        press(b, () => useLifeline(d.key));   // instant on touch-down — core/press.js
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
          if (t) { t.classList.add("is-removed"); t.disabled = true; }   // press() honours `disabled`
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
          press(c, () => {
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
          });
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
          correctText: correctAns ? correctAns.text : "",
          src: q.src
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
      gsPauseHandlers = null;
      window.removeEventListener("keydown", onKey);
      stopTimer();
      pending.forEach(clearTimeout); pending.clear();
      gsSound.musicStop();
      voicePlayer.stop();
      if (fitter) fitter.destroy();
      // undo the full-bleed background so other templates / re-mounts start clean
      if (stageEl) {
        stageEl.classList.remove("aw-gs-full");
        stageEl.querySelectorAll(".aw-gs-intro, .aw-gs-frame").forEach(e => e.remove());
      }
      if (innerEl) innerEl.classList.remove("aw-gs-inner");
      decor.remove(); screen.remove();
    };
  },

  // Menu pause hook (Đợt 91) — engine.js calls this on ☰ Menu open(true)/
  // close(false). See `gsPauseHandlers` above for why it's a module bridge.
  onPause(paused) {
    if (!gsPauseHandlers) return;
    if (paused) gsPauseHandlers.pause(); else gsPauseHandlers.resume();
  }
};

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

registerTemplate(gameshowTemplate);
export default gameshowTemplate;
