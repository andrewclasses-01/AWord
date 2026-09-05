// =============================================================
// TEMPLATE: TRUE FALSE — Wordwall style ("boolean" game), English UI.
//  • A STATEMENT rides in on a "conveyor belt": it slides in from the left
//    edge of the stage, arrives at the centre, then (if Speed > 0) keeps
//    drifting slowly to the right edge — one continuous slow glide. Speed 0
//    = arrives at centre and waits there until answered (this is how the
//    real act plays by default). Same motion engine as Find the match. The
//    slide-in pace was slowed a touch (teacher, 1/8/2026).
//  • Below a dashed divider sit TWO fixed buttons: TRUE (green) and FALSE
//    (red), sized at 80% (teacher, 1/8). The colours come from the theme's
//    own --aw-ok / --aw-no variables, so each theme gets its matching tone —
//    nothing is hard-coded here. The buttons never disappear.
//  • Answer CORRECT: the whole statement lifts off toward the score, bursting
//    into little stars that stream into it, and the score ticks up with a
//    pulse (teacher, 1/8). Answer WRONG: a ✗ + the wrong sound, and — if
//    lives are on — the LEFTMOST heart pops out and vanishes; the statement
//    then glides off to the right and the next one enters.
//  • Lives live in the TOP BAR, just left of the score (via ui.livesSlot).
//    `options.lives` is a slider 0..10: 0 (or null) = unlimited (no hearts
//    shown); 1..5 = that many separate hearts; 6..10 = a compact "N♥". Losing
//    the last heart ends the game (Game Over). (teacher's spec, 1/8/2026.)
//  • A statement that wasn't answered in time (Speed > 0, glide reached the
//    right edge) follows `options.repeatUntilCorrect`: false = marked
//    skipped; true = re-queued at a RANDOM position. A time-out never costs a
//    life (only wrong taps do) — same as FTM.
//  • Timer/sound: count-up mode gets a 3-2-1 prep countdown before the first
//    statement, and — via the engine's opt-in `manualTimerStart` hook — the
//    visible clock now stays at 0:00 during that countdown and only starts
//    ticking once it ends (teacher, 1/8). Count-down mode ticks once/sec from
//    10s, doubling from 5s.
//  • Score = number of statements answered correctly. ui.finish()/review
//    follow the same shape as every other template.
// =============================================================

import { registerTemplate } from "../../core/registry.js";
import { shuffle, el } from "../../core/utils.js";
import { press } from "../../core/press.js";
import { icons } from "../../core/icons.js";
import { autoFit } from "../../core/fit.js";
import { createVoicePlayer, voiceView, DEFAULT_INTRO_DELAY_MS } from "../../core/voice-playback.js";
import { openTfEditor } from "./true-false-editor.js";
import { tfSound } from "./tf-sound.js";

const DEFAULT_LIVES = 5;
const MAX_LIVES = 10;
const ENTER_MS = 1300;  // left edge -> centre (slowed from 900, teacher 1/8)
const EXIT_MS = 550;    // wherever it is -> fully off the right edge, once answered
// ⭐⭐ Đợt 265 (thầy, 26/8/2026: *"hiệu ứng trượt chuyển tên giữa những người khác nhau
// cực kỳ chậm, cần bình thường như với quiz"*) — THE NAME HAS ITS OWN PACE.
// ⛔ It used to be handed `{ outMs: EXIT_MS, inMs: ENTER_MS }` — this game's CONVEYOR
// timings — so the pupil's name took 550 + 1300 = **1.85 seconds** to change, against
// Quiz's 130 + 190 = 0.32s. The statement is a long line of text that is SUPPOSED to
// glide; the name is one short word the class reads to know whose turn it is, and it must
// simply be there. Same split Anagram made at Đợt 178 (`NAME_MOVE`), for the same reason.
// ⚠️ Deliberately NOT Quiz's exact numbers: a hair slower, because this game's statement
// does not fade — it slides — and a name that snaps before the statement has left reads
// as a glitch. Measured against Quiz on the same frame.
const NAME_MOVE = { outMs: 150, inMs: 200 };

// Speed 0-10 -> how long the CENTRE-to-right-edge drift takes. 0 = no drift
// at all (frozen at centre, "wait for answer"). Slightly slower curve than
// before (teacher wanted the glide eased down, 1/8).
function crawlMsFor(speed) {
  if (!speed) return null;
  const t = (speed - 1) / 9;
  return Math.round(5600 - t * (5600 - 1100));
}

// Options store lives as: 0 = unlimited (slider's left end), 1..10 = that many
// hearts, null = unlimited (legacy), undefined = default 5.
function normLives(v) {
  if (v === 0 || v === null) return null;                 // unlimited
  if (typeof v === "number") return Math.min(MAX_LIVES, Math.max(1, Math.round(v)));
  return DEFAULT_LIVES;                                   // undefined -> default 5
}

const tfTemplate = {
  type: "true_false",
  scorable: true,
  // TIME COST (Đợt 143) — opt in to the shared "-N per idle second" option.
  // Everything visible (the slider, the flying number, the count-down) belongs
  // to the engine; this template's whole share is subtracting ui.timeCostTotal()
  // in liveScore() plus the wiring in mount(). See core/engine.js.
  timeCost: true,
  // "Start with mistakes" (Đợt 84): which array in activity.content holds the
  // playable items. Core filters THAT array by the `src` refs the review rows
  // carry, so a replay keeps the originals untouched. See core/mistakes.js.
  itemsKey: "statements",
  // ⭐ Đợt 178 — SHOWDOWN. This one needed real work, not just the flag: its
  // `setNav` index was the SCORE (see updateNav), so the name would have followed
  // points instead of questions. It now carries the statement's row in `review`,
  // reported from `startCycle()` — the single funnel every statement passes
  // through. See `rowOf` for why a ROW and not a turn count.
  showdownMode: true,
  // ⭐ Đợt 261 — mở dải QUESTIONS EACH (Normal · Free · Count) cho game này. Một dòng cờ,
  // đúng đường fightTurns của Đợt 202 và sdDeal của Đợt 220 đã đi. Thầy chốt 25/8/2026 khi
  // bỏ hẳn Balance questions: Count là cơ chế công bằng DUY NHẤT còn lại, nên nó phải có mặt
  // ở mọi game Showdown chịu được việc NỐI DÀI mảng câu.
  // ⛔ Ba game bàn-chơi (Crossword · Open the box · Find the match) KHÔNG được mở: mảng câu
  // của chúng CHÍNH LÀ cái bàn, nối dài là ô chữ có một từ hai lần.
  sdDeal: true,
  // ⭐⭐ Đợt 182 — FIGHT MODE (teacher, 17/8/2026). Contract: core/fight.js's
  // header; this file's half is every `fightCtl` branch in mount(). Two things
  // had to change beyond plain wiring, and both fail SILENTLY if missed:
  //  • `order` is normally shuffled on EVERY play — in a match that puts a
  //    different statement behind the same round number on the two boards, so a
  //    fight uses the order core/fight.js already fixed for both;
  //  • the ✗ on a tapped button is a total giveaway in a TWO-choice game (it
  //    names the other button as the right one), so every mark is withheld until
  //    the match says the round is settled — see revealFightMarks().
  fightMode: true,
  // ⭐⭐ Đợt 213b (thầy, 20/8/2026) — THỨ TỰ Ô TÍCH, theo CỘT.
  // Thầy đọc từng cột: "cột 1 <trên>/<dưới>, cột 2 …". Khối đổ theo CỘT (đầy cột 1
  // từ trên xuống rồi mới sang cột 2 — xem `.aw-checks` trong core/app.css), nên
  // danh sách này đọc thẳng thành bố cục: 2 mã đầu = cột 1, 2 mã kế = cột 2, …
  // ⛔ Là MÃ ĐỊNH DANH, không phải chữ hiện ra (chữ có thể đổi — chính đợt này đã
  // đổi "Show answer when wrong" thành "Show corrects").
  // ⚠️ Mã không có trong danh sách (Fight "In turns", Showdown "Balance questions")
  // tự xuống cuối — hai mode đó thầy chưa xếp.
  checkOrder: ["shuffle", "showAnswers"],
  name: "True or false",
  hasLivesSlot: true,       // hearts render in the top bar, left of the score
  manualTimerStart: true,   // the clock starts only after our 3-2-1 prep countdown

  toPrintItems(activity) {
    return (activity.content?.statements || [])
      .filter(s => s && typeof s.text === "string" && s.text.trim())
      .map(s => ({ clue: s.text, answer: s.answer ? "True" : "False" }));
  },

  edit: openTfEditor,

  sounds: {
    play: tfSound.intro,
    restart: tfSound.restart,
    complete: () => {}   // silenced: true-false.js picks ONE of Completed/GameOver/TimesUp itself
  },

  // Options panel extra controls (engine.js calls this — see core/HUONG DAN CORE.md).
  // Đợt 140 — rebuilt on the shared panel builders; same options, same draft
  // fields, now grid cells instead of three full-width groups.
  buildExtraOptions({ panel, draft, mkSliderCell, mkSeg, mkCell }) {
    // SPEED — a real slider (matches Find the match's control).
    const speed = mkSliderCell({
      label: "Speed", sub: "0 = wait", min: 0, max: 10, step: 1,
      value: Number.isInteger(draft.speed) ? draft.speed : 0, tone: "blue", offAt: 0,
      fmt: v => (v === 0 ? "Off" : String(v)),
      onInput: v => { draft.speed = v; }
    });
    speed.cell.title = "0 = wait for the answer, no time limit per statement";

    // LIVES — a slider 0..10 (0 = Unlimited). Teacher's spec (1/8/2026):
    // adjustable number of hearts, shown next to the score.
    const curLives = (draft.lives === 0 || draft.lives === null) ? 0
      : (Number.isInteger(draft.lives) ? Math.min(MAX_LIVES, Math.max(1, draft.lives)) : DEFAULT_LIVES);
    const lives = mkSliderCell({
      label: "Lives", min: 0, max: MAX_LIVES, step: 1, value: curLives, tone: "green", offAt: 0,
      fmt: v => (v === 0 ? "∞" : String(v)),
      onInput: v => { draft.lives = v; }   // 0 stored = unlimited
    });
    lives.cell.title = "0 = unlimited lives";

    // What happens to a statement that wasn't answered in time (only matters
    // when Speed > 0).
    const repeat = mkCell({ label: "Unanswered" });
    repeat.ctl.append(mkSeg([
      { value: "once", label: "Ask once", title: "Show each statement once" },
      { value: "repeat", label: "Repeat", title: "Repeat until answered" }
    ], draft.repeatUntilCorrect === true ? "repeat" : "once",
      v => { draft.repeatUntilCorrect = v === "repeat"; }));

    panel.append(speed.cell, lives.cell, repeat.cell);
  },

  mount(root, activity, ui) {
    const opt = activity.options || {};
    const repeatUntilCorrect = opt.repeatUntilCorrect === true;
    // Points deducted per WRONG answer (0..100 since Dot 143). 0 = no penalty.
    const pointsOff = Math.max(0, Math.min(100, Number(activity.options && activity.options.pointsOff) || 0));
    const speed = Number.isInteger(opt.speed) ? Math.max(0, Math.min(10, opt.speed)) : 0;
    const crawlMs = crawlMsFor(speed);
    const timerMode = opt.timer ?? "countUp";
    const timerTotal = opt.timerTotalSeconds ?? 120;
    const startLives = normLives(opt.lives);

    const statements = [...(activity.content?.statements || [])]
      .filter(s => s && typeof s.text === "string" && s.text.trim());
    const total = statements.length;
    if (total < 1) {
      root.innerHTML = "";
      root.append(el("div", "aw-tf-empty", "This activity needs at least 1 statement."));
      return () => {};
    }

    // ----- FIGHT MODE (Đợt 182) — `_fight` is put here by core/fight.js.
    // Everything below degrades to normal single play when it is absent, which
    // is what keeps this template byte-identical outside a match.
    const fight = activity._fight || null;
    const fightSide = fight ? fight.side : 0;
    const fightCtl = fight ? fight.ctl : null;
    let fightBoardLock = false;                  // set by the match between rounds
    const fightLocked = () => fightBoardLock || !!(fightCtl && fightCtl.isLocked(fightSide));
    // TRUE while this board owes the class a ✓/✗ it is holding back because the
    // other team is still choosing. Cleared by revealFightMarks(), and by
    // startCycle() when a new statement arrives wearing no debt.
    let fightPendingReveal = false;

    // `order` = the fixed sequence used for scoring/review (never mutated).
    // `queue` = the LIVE working sequence — front = current statement. Always
    // shuffled: the two-column editor no longer carries a play order, so every
    // play mixes the True/False statements (teacher's spec, 1/8/2026).
    // ⚠️ EXCEPT IN A FIGHT (Đợt 182): core/fight.js hands both boards the SAME
    // pre-shuffled `statements` array precisely so round 3 is the same statement
    // on both screens. Shuffling again here — once per board, independently —
    // would put two different statements behind one round number, and nothing on
    // screen would say so: each board looks perfectly normal on its own.
    let order = fightCtl ? statements.map((_, i) => i) : shuffle(statements.map((_, i) => i));
    const queue = [...order];
    // ⭐⭐ Đợt 178 — SHOWDOWN needs "which ROW of `review` is on screen".
    // `review` is built as `order.map(idx => …)` (see finish), so row j holds
    // statement `order[j]`; this is that lookup the other way round.
    // ⚠️ It is the ROW, deliberately NOT a count of turns taken. With
    // `repeatUntilCorrect` a statement comes back later, and the row is what
    // keeps it coming back TO THE SAME PUPIL — which is also the only mapping
    // that can still agree with Show answers, since one statement has exactly
    // one row however many times it is asked.
    const rowOf = [];
    order.forEach((idx, j) => { rowOf[idx] = j; });
    // ⭐⭐⭐ Đợt 265b (thầy, 26/8/2026: *"Showdown luôn xoay vòng đều đi, sửa luôn cái Repeat
    // đó"*) — **MỘT HÀNG MỖI LƯỢT, KHÔNG PHẢI MỘT HÀNG MỖI CÂU.**
    //
    // ⛔⛔ Vì sao `rowOf` một mình là SAI trong Showdown: tên học sinh do `memberAt(members,
    // row)` quyết, mà `rowOf` là CHỖ CỐ ĐỊNH của câu trong `order`. Bật "Unanswered =
    // Repeat" thì một câu sai quay lại **mang theo đúng cái row cũ** ⇒ đúng em ấy bị gọi
    // lần nữa, và vòng xoay lệch hẳn. Đo được (3 em, `scratch/dot265-tf.html` mục C):
    //     AAA-1 · BBB-2 · CCC-3 · AAA-1 · **AAA-1** · BBB-2 …
    // Đợt 178 cố ý làm vậy ("câu quay lại phải về đúng em cũ") — nhưng cái giá là vòng xoay,
    // mà vòng xoay mới là lý do Showdown tồn tại. Thầy chốt: xoay vòng đều thắng.
    //
    // ⭐ Cách chữa KHÔNG phải là bịa thêm một con số riêng cho cái tên — làm thế là tên trên
    // khung và hàng trong Show answers nói khác nhau, đúng thứ hợp đồng Đợt 178 bảo vệ. Nó
    // là: **row = SỐ THỨ TỰ LƯỢT**, và `review` cũng một hàng mỗi lượt. Câu hỏi hai lần thì
    // có hai hàng — mỗi hàng ghi đúng em đã đối mặt với nó và em ấy trả lời gì. Không lượt
    // nào bị nhập nhèm, `roundMs[i]` của engine (cũng đánh theo số vòng) vẫn khớp từng hàng.
    // ⚠️ KHÔNG ÁP CHO FIGHT: ở đó TRỌNG TÀI ra lệnh nhảy tới vòng `i` bất kỳ (`fightGoTo`),
    // nên row phải đúng bằng `i` — tức là `rowOf`. Fight và Showdown không bao giờ cùng bật,
    // nên hai đường này không thể va nhau.
    // ⚠️ Khi KHÔNG có câu nào lặp lại thì `turnLog` ra đúng `order` ⇒ mọi con số của bảng
    // kết quả y hệt trước đợt này. Chỉ ca "Repeat" mới khác — và khác theo hướng thật hơn:
    // một câu phải hỏi hai lần thì đội ấy đã tiêu hai lượt.
    const turnLog = [];   // [{ idx, answered, correct, chosen, timedOut }] — một phần tử MỖI LƯỢT
    // The row on SCREEN. Not read off `queue[0]`: `choose()` shifts the queue the
    // instant a button is tapped, while the statement it belongs to is still
    // flying off — reading the queue there would hand the next pupil their name
    // half a second early, in the middle of the previous pupil's answer.
    let curRow = 0;

    const state = statements.map(() => ({ answered: false, correct: false, chosen: null }));
    let finished = false;
    let livesLeft = startLives;
    let penalty = 0;          // accumulated points-off from wrong answers (pointsOff each)
    let fitter = null;
    let promptAnim = null;    // the currently-running Animation on .aw-tf-prompt (enter/crawl/exit)
    let fallbackTimer = null; // setTimeout backup for whichever animation is running
    let prepTimer = null;     // the 3-2-1 prep sequence (count-up mode only)
    let balanceTimer = null;  // debounce for the divider/nav spacing balance (item 5)
    let gateTimer = null;     // unlocks the buttons once a new statement is ~50% in (item, 1/8)
    const tickTimers = [];    // discrete count-down "ting" timeouts (count-down mode only)
    const pendingMarks = [];

    // Pronunciation playback (10/8/2026) — optional per-statement, carried
    // through Change Template from an Anagram source (core/convert.js).
    // `statements[i]` IS the raw content object (line 154 is a shallow
    // array copy only), so `.voice`/`.hideText` read straight off it.
    const voicePlayer = createVoicePlayer();
    let firstStatementSpoken = false;

    ui.onSubmit(() => finish("timesup"));
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", rebalance);
    renderShell();

    // ----- TIME COST wiring (Đợt 143) — see core/engine.js's ui.setIdleGuard.
    // The guard answers ONE question: "could the student act right now?" If not,
    // the idle clock must not charge them. For True/false that is: the game
    // finished, the 3-2-1 prep before the first statement, the gap while one
    // statement flies off and the next slides in, and a clip still speaking —
    // nobody can judge a statement they are still being read.
    // The gap is read off the BUTTONS' own disabled state rather than a second
    // flag of our own: lockButtons()/unlockButtons() already are the single
    // source of truth for "can this be answered", and a parallel flag is exactly
    // the kind of thing that drifts out of step with them later.
    ui.setScoreProvider?.(liveScore);
    // ⭐⭐⭐ Đợt 265 — the per-round count down now has somebody to call. See roundTimeUp().
    ui.setRoundTimeout?.(roundTimeUp);
    // ⭐⭐⭐ Đợt 266 — vế "clip còn đang đọc" ĐI RIÊNG qua ui.setVoiceGuard, không
    // nằm trong idleGuard nữa: trong Fight chỉ bàn 0 có <audio> thật (core/fight.js
    // `ctl.speaks`), nên để nguyên chỗ cũ là bàn PHẢI bị Time cost trừ suốt quãng cả
    // lớp đang nghe. Engine hỏi vế này qua trọng tài — xem core/engine.js voiceBusy().
    ui.setVoiceGuard?.(() => voicePlayer.isPlaying());
    ui.setIdleGuard?.(() => {
      if (finished || prepTimer) return true;
      const btn = root.querySelector(".aw-tf-btn");
      return !!(btn && btn.disabled);
    });

    if (timerMode === "countUp") {
      runPrepCountdown();          // starts the clock (ui.startTimer) after 3-2-1
    } else {
      ui.startTimer();             // count-down / none: clock starts right away
      if (timerMode !== "none") tfSound.go();
      if (timerMode === "countDown") armCountdownTicks();
      startCycle();
    }

    function scoreNow() { return state.filter(s => s.correct).length; }
    // The value actually shown/ranked: correct count minus wrong-answer penalty
    // (negatives allowed, never clamped). When pointsOff===0, penalty stays 0 so
    // liveScore() === scoreNow() and everything is byte-identical to before.
    // TIME COST (Đợt 143) — the idle clock's running total comes off HERE, at the
    // one place this game decides what the score is. That is what makes it safe:
    // every ui.setScore() in this file already goes through liveScore(), so an
    // ordinary score update can never repaint the deduction away.
    function liveScore() { return scoreNow() - penalty - (ui.timeCostTotal ? ui.timeCostTotal() : 0); }

    function armFallback(fn, ms) {
      if (fallbackTimer) clearTimeout(fallbackTimer);
      fallbackTimer = setTimeout(fn, ms);
    }

    // Count-up mode only: 3 big numbers (one/sec) in the statement area + a
    // "ting" each second, THEN the first statement starts. The engine's visible
    // clock is deferred (manualTimerStart) and only begins via ui.startTimer()
    // once these three numbers are done — so the clock reads 0:00 throughout.
    function runPrepCountdown() {
      const promptEl = root.querySelector(".aw-tf-prompt");
      if (!promptEl) { ui.startTimer(); tfSound.go(); startCycle(); return; }
      promptEl.classList.add("is-countdown");
      let n = 3;
      const tick = () => {
        if (finished) return;
        promptEl.textContent = String(n);
        tfSound.clockTick();
        n--;
        if (n > 0) { prepTimer = setTimeout(tick, 1000); return; }
        prepTimer = setTimeout(() => {
          promptEl.classList.remove("is-countdown");
          promptEl.textContent = "";
          ui.startTimer();     // the clock begins only NOW, after the 3-2-1 prep
          tfSound.go();
          startCycle();
        }, 1000);
      };
      tick();
    }

    // Count-down mode only: a "ting" once/sec while 10-6s remain, then twice/
    // sec from 5s remaining to 0.5s. Computed from this template's own start
    // reference (mount runs as the engine's countdown begins for this mode).
    function armCountdownTicks() {
      const at = [];
      for (let r = 10; r >= 6; r--) at.push(timerTotal - r);
      for (let r = 5; r >= 1; r -= 0.5) at.push(timerTotal - r);
      at.forEach(sec => {
        if (sec < 0) return;
        tickTimers.push(setTimeout(() => { if (!finished) tfSound.clockTick(); }, sec * 1000));
      });
    }

    function renderShell() {
      root.innerHTML = "";
      const card = el("div", "aw-tf-card");

      const track = el("div", "aw-tf-track");
      track.append(el("div", "aw-tf-prompt"));
      card.append(track);

      card.append(el("div", "aw-tf-divider"));

      const btnRow = el("div", "aw-tf-buttons");
      const btnTrue = el("button", "aw-tf-btn is-true", "True");
      const btnFalse = el("button", "aw-tf-btn is-false", "False");
      press(btnTrue, () => choose(true, btnTrue));    // instant on touch-down — core/press.js
      press(btnFalse, () => choose(false, btnFalse));
      // Locked until a statement has slid in >=50% (item, 1/8) — this also keeps
      // taps during the 3-2-1 countdown from answering the first statement early.
      btnTrue.disabled = true; btnFalse.disabled = true;
      btnRow.append(btnTrue, btnFalse);
      card.append(btnRow);
      root.append(card);

      fitter = autoFit(root, card, s => card.style.setProperty("--fit", s), {
        slack: root.clientWidth * 0.03,
        measure: () => track.offsetHeight + btnRow.scrollHeight
      });

      ui.setScore(liveScore());
      updateNav();
      renderLives();
      scheduleBalance();
    }

    // Hearts live in the top bar (ui.livesSlot), just left of the score. 1..5
    // lives show that many separate hearts; 6..10 show a compact "N♥";
    // unlimited shows nothing. A lost life removes the LEFTMOST heart.
    function renderLives() {
      const slot = ui.livesSlot;
      if (!slot) return;
      slot.innerHTML = "";
      if (livesLeft == null) return;                 // unlimited
      if (livesLeft <= 5) {
        for (let i = 0; i < livesLeft; i++) slot.append(el("span", "aw-top-heart", "&#9829;"));
      } else {
        slot.append(el("span", "aw-top-heartcount", String(livesLeft)));
        slot.append(el("span", "aw-top-heart", "&#9829;"));
      }
    }

    // Costs one life; pops the LEFTMOST heart out (when hearts are shown
    // individually) then re-renders. Returns true if that was the last life.
    function loseLife() {
      if (livesLeft == null) return false;           // unlimited -> can't lose
      const slot = ui.livesSlot;
      const gone = (livesLeft <= 5 && slot) ? slot.firstChild : null;   // leftmost heart
      livesLeft = Math.max(0, livesLeft - 1);
      if (gone) {
        let done = false;
        const finishPop = () => { if (done) return; done = true; renderLives(); };
        try {
          const a = gone.animate(
            [{ transform: "scale(1)", opacity: 1 }, { transform: "scale(1.7)", opacity: 0 }],
            { duration: 320, easing: "ease-in", fill: "forwards" });
          a.onfinish = finishPop;
        } catch (e) { finishPop(); }
        pendingMarks.push(setTimeout(finishPop, 360));
      } else {
        renderLives();
      }
      return livesLeft <= 0;
    }

    function offscreenPx() { return Math.round((root.clientWidth || 1) * 1.15); }

    // Item (1/8): the True/False buttons are LOCKED while a new statement is
    // sliding in, and only unlock once it's ~50% across — so two answers can't
    // land right on top of each other.
    function lockButtons() { root.querySelectorAll(".aw-tf-btn").forEach(b => { b.disabled = true; }); }
    function unlockButtons() { root.querySelectorAll(".aw-tf-btn").forEach(b => { b.disabled = false; }); }

    // Starts the current queue-front's journey from the LEFT edge. Only
    // called once the PREVIOUS statement is fully gone.
    function startCycle() {
      if (finished) return;
      if (!queue.length) { armFallback(() => finish("complete"), 400); return; }
      const promptEl = root.querySelector(".aw-tf-prompt");
      if (!promptEl) return;
      promptEl.style.visibility = "";           // a correct-answer fly may have hidden it
      voicePlayer.stop();                       // silence the PREVIOUS statement's clip, if any
      promptEl.className = "aw-tf-prompt";       // drop any stale voiceonly class from the last statement
      // FIGHT MODE: a withheld ✓/✗ belongs to the statement that was on screen —
      // the new one must not arrive wearing the last round's grey or its marks.
      if (fightCtl) { fightPendingReveal = false; clearFightMarks(); }
      const st = statements[queue[0]];
      // ⭐ Đợt 178 — the statement on screen, and with it whose turn this is. The
      // two numbers are this game's own slide-out / slide-in, so the name leaves
      // with the old statement and arrives with the new one.
      // ⭐⭐⭐ Đợt 265b — MỘT LƯỢT MỚI = MỘT ROW MỚI (xem ghi chú dài ở chỗ khai `turnLog`).
      // Trong trận thì trọng tài mới là người chọn vòng, nên ở đó vẫn là `rowOf`.
      curRow = fightCtl
        ? rowOf[queue[0]]
        : (turnLog.push({ idx: queue[0], answered: false, correct: false, chosen: null, timedOut: false }) - 1);
      ui.itemChanging?.(curRow, NAME_MOVE);
      const vv = voiceView(activity, st);   // Options > Content decides text/voice
      const hasVoice = vv.hasVoice, hideText = vv.hideText;
      if (hideText) {
        promptEl.textContent = "";
        promptEl.classList.add("aw-clue-voiceonly");
      } else {
        promptEl.textContent = st.text;
      }
      if (hasVoice) {
        const vBtn = el("button", "aw-voicebtn" + (hideText ? " aw-voicebtn-lg" : ""), icons.soundOn);
        vBtn.type = "button";
        vBtn.setAttribute("aria-label", "Listen to pronunciation");
        press(vBtn, e => { e.stopPropagation(); voicePlayer.toggle(st.voice, vBtn); });
        promptEl.append(vBtn);
        // FIGHT MODE: both boards show the same statement, so only board 0 reads
        // it out — two copies of one clip a few ms apart is an echo, not a
        // reading (`ctl.speaks`, same guard quiz.js uses).
        if (vv.autoPlay && (!fightCtl || fightCtl.speaks(fightSide))) {
          voicePlayer.playDelayed(st.voice, vBtn, firstStatementSpoken ? 0 : DEFAULT_INTRO_DELAY_MS);
        }
      }
      firstStatementSpoken = true;
      const off = offscreenPx();
      promptEl.style.transform = `translateX(${-off}px)`;
      void promptEl.offsetWidth; // reflow so the start position is committed before animating from it
      tfSound.conveyorAppear();
      const enter = promptEl.animate(
        [{ transform: `translateX(${-off}px)` }, { transform: "translateX(0px)" }],
        { duration: ENTER_MS, easing: "ease-out", fill: "forwards" }
      );
      promptAnim = enter;
      // Lock now, unlock at ~50% of the slide-in (item, 1/8).
      lockButtons();
      if (gateTimer) clearTimeout(gateTimer);
      gateTimer = setTimeout(() => {
        if (finished || !queue.length) return;
        unlockButtons();
        // ⭐⭐⭐ Đợt 265 — THIS IS WHERE THE PER-ROUND CLOCK OPENS FOR THE NEW STATEMENT.
        // ⛔⛔ It never used to open at all. `roundBegin()` fires from `ui.setNav`, and
        // this game only calls `updateNav()` when the SCORE moves — from the fly-to-score
        // 380ms into the previous answer, and from the penalty callback. Measured (30s
        // count down, `scratch/dot265-round.html`): statement 1 answered → clock 25,69 →
        // statement 2 on screen and the clock STILL running down statement 1's round; it
        // only reset one answer later. So every pupil after the first inherited a clock
        // already part-spent, and with a short round it had reached 0 before their
        // statement even arrived — the teacher's *"thời gian lùi rồi dừng ở 0 nhưng không
        // chuyển câu"*, because a round that is over stays over until something reopens it.
        // ⚠️ AT THE GATE, NOT AT `startCycle()`. The statement takes ENTER_MS to slide in
        // and the buttons are locked for the first half of it — starting the clock at the
        // swap would charge the pupil ~650ms of conveyor they cannot answer during. This
        // is the same instant `ui.setIdleGuard` already treats as "they can act now".
        // ⚠️ The NAME does not wait for this: `ui.itemChanging` claimed it back at the
        // swap, so `paintShowdownName` sees the index already taken and this call is a
        // no-op for it — exactly the two-callers contract in core/engine.js.
        updateNav();
      }, Math.round(ENTER_MS * 0.5));
      let done = false;
      const onEntered = () => {
        if (done) return; done = true;
        promptAnim = null;
        if (finished) return;
        tfSound.conveyorCentred();
        armCrawl();
      };
      enter.onfinish = onEntered;
      armFallback(onEntered, ENTER_MS + 100);
    }

    // After arriving at centre: if Speed > 0, keep drifting to the right edge
    // (unanswered by the time it fully exits = a timeout). Speed 0 = frozen.
    function armCrawl() {
      if (finished || !queue.length || !crawlMs) return;
      const promptEl = root.querySelector(".aw-tf-prompt");
      if (!promptEl) return;
      const off = offscreenPx();
      tfSound.conveyorLeave();
      const crawl = promptEl.animate(
        [{ transform: "translateX(0px)" }, { transform: `translateX(${off}px)` }],
        { duration: crawlMs, easing: "linear", fill: "forwards" }
      );
      promptAnim = crawl;
      let done = false;
      const onCrawlDone = () => {
        if (done) return; done = true;
        promptAnim = null;
        if (!finished) onTimeUp();
      };
      crawl.onfinish = onCrawlDone;
      armFallback(onCrawlDone, crawlMs + 120);
    }

    // Freezes whatever position the prompt is CURRENTLY at into a real inline
    // style, so a follow-up .animate() with only a "to" keyframe continues
    // smoothly from there.
    function haltPromptAnim() {
      if (promptAnim) {
        try { promptAnim.commitStyles(); } catch (e) { /* ignore */ }
        try { promptAnim.cancel(); } catch (e) { /* ignore */ }
        promptAnim = null;
      }
    }

    // Puts a statement back in the running — at a RANDOM spot in the queue
    // (not just at the back), so a missed one doesn't return predictably.
    //
    // ⚠️⚠️ THIS ONLY PUTS BACK. TAKING OFF THE FRONT IS THE CALLER'S JOB (Đợt 179).
    // It used to `queue.shift()` here as well, which was right for one of its two
    // callers and quietly wrong for the other:
    //   · `dropOrRequeue()` (time-out) had not removed anything yet — correct;
    //   · `choose()` (wrong tap) shifts the moment the button is tapped, so the
    //     second shift in here threw away the statement that was NEXT IN LINE.
    // Net effect with "Repeat until answered" on: ONE STATEMENT VANISHED FROM THE
    // ROUND PER WRONG ANSWER. Silently — its `state` row stays
    // `{answered:false, correct:false}`, so Show answers just lists it as
    // unanswered and nothing says the class was never shown it.
    // Splitting the two jobs is what makes that impossible to get wrong again:
    // one function removes, the other returns.
    function requeueRandom(idx) {
      if (!queue.length) { queue.push(idx); return; }
      // `1 +` keeps it out of slot 0, so a missed statement never comes straight
      // back as the very next one.
      const pos = 1 + Math.floor(Math.random() * queue.length);
      queue.splice(pos, 0, idx);
    }

    // A statement that timed out unanswered. Nothing has been taken off the front
    // yet on this path (unlike `choose()`), so that happens here.
    function dropOrRequeue(idx) {
      queue.shift();
      if (repeatUntilCorrect) requeueRandom(idx);
      else { state[idx].answered = true; state[idx].correct = false; }
    }

    function onTimeUp() {
      if (finished || !queue.length) return;
      // FIGHT MODE: a statement that glided off unanswered ends THIS board's go
      // — reported honestly as a wrong finish, which (teacher's rule, Đợt 128)
      // leaves the round open for the other team instead of taking it away. No
      // re-queueing and no advancing: the match decides what comes next.
      if (fightCtl) {
        const idx = queue[0];
        if (!state[idx].answered) { state[idx].answered = true; state[idx].correct = false; }
        fightPendingReveal = true;
        lockButtons();
        syncFightLock();
        fightCtl.wordDone(fightSide, { index: curRow, correct: false });
        return;
      }
      dropOrRequeue(queue[0]);
      startCycle();
    }

    function flyMark(btn, ok) {
      const fly = el("span", "aw-mark-fly" + (ok ? "" : " is-cross"), ok ? icons.markCheck : icons.markCross);
      btn.append(fly);
      pendingMarks.push(setTimeout(() => fly.remove(), 900));
    }

    // Slides the prompt from wherever it is to fully off the right edge, THEN
    // calls `cb`. Used by a WRONG answer and by running out of lives.
    function exitPromptThenCall(cb) {
      const promptEl = root.querySelector(".aw-tf-prompt");
      haltPromptAnim();
      if (!promptEl) { cb(); return; }
      tfSound.conveyorLeave();
      const off = offscreenPx();
      const exit = promptEl.animate(
        [{ transform: `translateX(${off}px)` }],
        { duration: EXIT_MS, easing: "ease-in", fill: "forwards" }
      );
      promptAnim = exit;
      let done = false;
      const run = () => {
        if (done) return; done = true;
        promptAnim = null;
        if (!finished) cb();
      };
      exit.onfinish = run;
      armFallback(run, EXIT_MS + 100);
    }

    // A CORRECT answer: the whole statement lifts off toward the score,
    // bursting into little stars that stream into it; the score then ticks up
    // with a pulse. THEN `cb` runs (start next / finish). Overlay nodes are
    // appended to the fullscreen host (or body) so they show over the stage and
    // in fullscreen; they use px/viewport coords (NOT cqw, which wouldn't
    // resolve outside the stage container).
    function flyStatementToScore(promptEl, cb) {
      // ⚠️ Đợt 182 — was `ui.scoreEl || document.querySelector(".aw-top-score")`.
      // A page-wide query is forbidden by core/fight.js's header (in a match it
      // finds the LEFT board's chip from the right board). This path is single
      // mode only now — a fight never flies the statement, see choose() — but
      // the query had to go all the same: it is the exact shape of that bug.
      const scoreEl = ui.scoreEl;
      const host = document.fullscreenElement || document.body;
      let called = false;
      const done = () => { if (called) return; called = true; if (!finished) cb(); };
      if (!promptEl || !scoreEl) { done(); return; }

      const from = promptEl.getBoundingClientRect();
      const to = scoreEl.getBoundingClientRect();
      const cs = getComputedStyle(promptEl);

      const clone = el("div", "aw-tf-flyclone");
      clone.textContent = promptEl.textContent;
      clone.style.left = from.left + "px";
      clone.style.top = from.top + "px";
      clone.style.width = from.width + "px";
      clone.style.height = from.height + "px";
      clone.style.font = cs.font;
      clone.style.color = cs.color;
      host.appendChild(clone);
      promptEl.style.visibility = "hidden";

      const dx = (to.left + to.width / 2) - (from.left + from.width / 2);
      const dy = (to.top + to.height / 2) - (from.top + from.height / 2);
      try {
        clone.animate([
          { transform: "translate(0,0) scale(1)", opacity: 1 },
          { transform: `translate(${dx * 0.55}px, ${dy * 0.55}px) scale(0.5)`, opacity: 0.7, offset: 0.55 },
          { transform: `translate(${dx}px, ${dy}px) scale(0.08)`, opacity: 0 }
        ], { duration: 620, easing: "cubic-bezier(.5,0,.3,1)", fill: "forwards" }).onfinish = () => clone.remove();
      } catch (e) { /* ignore */ }
      pendingMarks.push(setTimeout(() => clone.remove(), 950));

      spawnStars(from, to, host);

      // score updates mid-flight, with a little pulse
      pendingMarks.push(setTimeout(() => {
        if (finished) return;
        ui.setScore(liveScore());
        updateNav();
        try {
          scoreEl.animate([{ transform: "scale(1)" }, { transform: "scale(1.35)" }, { transform: "scale(1)" }],
            { duration: 340, easing: "ease-out" });
        } catch (e) { /* ignore */ }
      }, 380));

      pendingMarks.push(setTimeout(done, 640));
    }

    function spawnStars(from, to, host) {
      const cx = from.left + from.width / 2, cy = from.top + from.height / 2;
      const tx = to.left + to.width / 2, ty = to.top + to.height / 2;
      const N = 11;
      for (let i = 0; i < N; i++) {
        const s = el("span", "aw-tf-star", "&#9733;");
        host.appendChild(s);
        const jx = cx + (Math.random() - 0.5) * from.width * 0.9;
        const jy = cy + (Math.random() - 0.5) * from.height * 0.9;
        const delay = i * 26;
        try {
          s.animate([
            { transform: `translate(${jx}px, ${jy}px) scale(.2)`, opacity: 0 },
            { transform: `translate(${jx}px, ${jy}px) scale(1)`, opacity: 1, offset: .18 },
            { transform: `translate(${tx}px, ${ty}px) scale(.35)`, opacity: 0 }
          ], { duration: 680, delay, easing: "cubic-bezier(.4,.1,.3,1)", fill: "forwards" }).onfinish = () => s.remove();
        } catch (e) { s.remove(); }
        pendingMarks.push(setTimeout(() => s.remove(), 950 + delay));
      }
    }

    function choose(value, btn) {
      if (finished || !queue.length) return;
      if (fightLocked()) return;    // the other team took this round, or the match is over
      const idx = queue[0];
      const st = statements[idx];
      const isRight = value === !!st.answer;
      // TIME COST (Đợt 143): judging a statement IS the progress this game
      // measures, so it resets the idle clock — right or wrong. A WRONG answer
      // has to count too: if only correct ones reset it, a class could be charged
      // for a run of honest wrong guesses, and the option would be measuring luck
      // instead of attention (the Đợt 139 rule, applied here).
      ui.noteActivity?.();

      queue.shift();
      state[idx].answered = true;
      state[idx].chosen = value;
      // ⚠️ Đợt 265 — clears an EARLIER buzzer on this same statement. With "Repeat until
      // answered" on, a timed-out statement comes back; once somebody actually taps it,
      // the row is answered again and `timedOut` must not go on saying otherwise in Show
      // answers (see the review's own `answered` line).
      state[idx].timedOut = false;
      // ⭐⭐⭐ Đợt 265b — và GHI VÀO LƯỢT NÀY nữa. `state[]` vẫn là "câu này rốt cuộc thế
      // nào" (điểm đọc từ đó), còn `turnLog[curRow]` là "lượt này em ấy làm gì" — hai câu
      // hỏi khác nhau, và chỉ cái thứ hai mới trả lời đúng cho Show answers khi một câu
      // được hỏi hai lần bởi hai em khác nhau.
      const turn = turnLog[curRow];
      if (turn) { turn.answered = true; turn.chosen = value; turn.correct = isRight; turn.timedOut = false; }
      // ⭐⭐ Đợt 265 — TIME EACH ROUND: this pupil's turn ends the instant they tap, so
      // their clock stops here (Quiz/Anagram/Type the answer have done this since Đợt
      // 174). Without it the count down went on running through the fly-to-score, the
      // slide-off and the next statement's whole 1.3s entrance — a second and a half of
      // somebody else's time charged to whoever had just answered. The next pupil's clock
      // opens at the gate in startCycle(), where the buttons come alive.
      ui.roundDone?.();
      // Lock right away so the NEXT statement can't be answered "blind" while the
      // current one is still flying off / sliding out — startCycle re-arms the
      // 50%-in unlock for the incoming statement (item, 1/8).
      lockButtons();

      // ⭐⭐ FIGHT MODE (Đợt 182) — this board's go is over, and that is ALL the
      // other team may learn from this screen.
      //  • no ✗ on the tapped button, no ✓, no statement flying to the score:
      //    with only two buttons, marking one is naming the other;
      //  • the board still visibly changes — it goes neutral grey through
      //    syncFightLock, which is the "your go is over" cue the teacher asked
      //    for so a team knows why tapping stopped working;
      //  • SOUND is not withheld (says how THIS team did, points at no button),
      //    and neither is a lost heart (same reason) — both match quiz.js;
      //  • nothing advances here: the MATCH owns the sequence and moves both
      //    boards together through goToIndex (see fightGoTo).
      if (fightCtl) {
        state[idx].correct = isRight;
        if (isRight) tfSound.correct();
        else tfSound.wrong();
        const outOfLives = isRight ? false : loseLife();
        ui.setScore(liveScore());   // engine forwards this to the match scoreboard
        // ⭐⭐⭐ Đợt 256 (thầy, 24/8/2026) — "−N" BAY VÀO Ô ĐIỂM RỒI MỚI TRỪ.
        // `penalty += pointsOff` đã RỜI khỏi nhánh sai ở trên và vào callback này:
        // cả yêu cầu của thầy là tổng điểm đứng yên cho tới lúc con số hạ cánh.
        // ⛔⛔ ĐỪNG đưa `btn` (nút vừa bấm) vào đây dù chơi đơn có làm thế: game này
        // chỉ có HAI nút, nên một con số bay ra từ đúng nút vừa bấm là NÓI TRỌN ĐÁP
        // ÁN cho đội còn đang làm — đúng thứ luật "GIẤU ĐÁP ÁN KHI VÒNG CÒN MỞ"
        // (Đợt 129) cấm, và cũng là lý do cả nhánh fight này không vẽ ✓/✗ nào.
        // ⚠️ Thật ra core/engine.js đã ép chỗ bay ra về giữa khung trong mọi trận rồi
        // (xem ui.flyPenalty), nên `null` ở đây chỉ là nói cùng một điều hai lần —
        // cố ý, vì đây là template dễ hở nhất trong bảy game Fight.
        if (!isRight && pointsOff) {
          ui.flyPenalty?.(null, pointsOff, () => { penalty += pointsOff; return liveScore(); });
        }
        updateNav();
        fightPendingReveal = true;
        syncFightLock();
        // `curRow` is the row this statement occupies in `review`, i.e. exactly
        // the round number the match is on — the same number goToIndex is given.
        fightCtl.wordDone(fightSide, { index: curRow, correct: isRight });
        if (outOfLives) armFallback(() => finish("gameover"), 1200);
        return;
      }

      if (isRight) {
        state[idx].correct = true;
        tfSound.correct();
        const promptEl = root.querySelector(".aw-tf-prompt");
        haltPromptAnim();
        flyStatementToScore(promptEl, () => { if (!queue.length) finish("complete"); else startCycle(); });
      } else {
        state[idx].correct = false;
        tfSound.wrong();
        flyMark(btn, false);

        // Points-off penalty: subtract pointsOff (negatives allowed, no clamp) and
        // refresh BOTH the top score and the nav counter so they stay in sync. The
        // whole block is skipped when pointsOff===0 -> byte-identical to before.
        // ⭐⭐⭐ Đợt 256 — phép trừ nay nằm TRONG callback của ui.flyPenalty: con số
        // "−N" bay ra từ ĐÚNG NÚT VỪA BẤM (chơi đơn thì không có ai để giấu bài) vào
        // ô điểm, tới nơi mới trừ. `updateNav()` cũng phải chạy lại lúc đó vì nó in
        // cùng con số ấy ở thanh dưới.
        if (pointsOff) {
          ui.flyPenalty?.(btn, pointsOff, () => {
            penalty += pointsOff;
            const v = liveScore();
            updateNav();
            return v;
          });
        }

        const outOfLives = loseLife();
        // A wrong tap: if "repeat until answered" is on, the statement comes
        // back later (it wasn't answered correctly); otherwise it's done.
        if (repeatUntilCorrect) requeueRandom(idx);

        exitPromptThenCall(() => {
          if (outOfLives) finish("gameover");
          else if (!queue.length) finish("complete");
          else startCycle();
        });
      }
    }

    // ================= FIGHT MODE (Đợt 182) =========================
    // Everything below is dead code outside a match (`fightCtl` is null).

    function tfButtons() {
      return {
        yes: root.querySelector(".aw-tf-btn.is-true"),
        no: root.querySelector(".aw-tf-btn.is-false")
      };
    }
    function clearFightMarks() {
      root.querySelectorAll(".aw-tf-fightmark").forEach(n => n.remove());
    }

    // Apply a lock change WITHOUT rebuilding anything (the ⚠️ rule in
    // core/HUONG DAN CORE.md: a re-render at this exact moment replays the
    // statement's slide-in and reads as a flash on the losing board). Only the
    // buttons' `disabled` and one class move here; the colours are CSS.
    function syncFightLock() {
      if (!fightCtl) return;
      const locked = fightLocked();
      const answered = !!state[order[curRow]]?.answered;
      // An answered statement keeps its buttons dead either way — choose()
      // locked them and a lock release must not hand them back.
      if (!answered) { if (locked) lockButtons(); else unlockButtons(); }
      const card = root.querySelector(".aw-tf-card");
      // Grey while this board's go is over but its result is still withheld:
      // either it never got to answer ("too slow" — the other team took the
      // round) or it HAS answered and the marks are still being held back.
      card?.classList.toggle("is-fightlost", locked && (!answered || fightPendingReveal));
    }

    // The match says the round is settled for BOTH teams, so the ✓/✗ held back
    // in choose() can finally go up. Also runs on the board that never got to
    // answer — it needs to be shown the right answer too.
    function revealFightMarks() {
      if (!fightCtl) return;
      fightPendingReveal = false;
      const idx = order[curRow];
      const st = statements[idx], s = state[idx];
      if (!st) return;
      clearFightMarks();
      const { yes, no } = tfButtons();
      const rightBtn = st.answer ? yes : no;
      if (rightBtn) rightBtn.append(el("span", "aw-tf-fightmark", icons.markCheck));
      // Only a board that actually answered WRONG gets a cross, and only on the
      // button it pressed. A board that never answered is shown the right one
      // and nothing else — it has nothing to be marked wrong for.
      if (s && s.answered && s.correct === false && s.chosen != null) {
        const wrongBtn = s.chosen ? yes : no;
        if (wrongBtn && wrongBtn !== rightBtn) wrongBtn.append(el("span", "aw-tf-fightmark is-cross", icons.markCross));
      }
      syncFightLock();
    }

    // The match moves BOTH boards to round `i` — the row in `review`, which is
    // also this game's own `order` index (see `rowOf`). The queue is reduced to
    // that one statement: in a fight the MATCH owns the sequence, so this
    // game's queue, its shuffle and its "repeat until answered" re-queueing all
    // stand down — two boards must never disagree about what round 3 is.
    function fightGoTo(i) {
      if (finished) return;
      const idx = order[i];
      if (idx === undefined) return;
      queue.length = 0;
      queue.push(idx);
      haltPromptAnim();
      startCycle();          // sets curRow = rowOf[idx] = i, and clears the marks
    }

    /**
     * ⭐⭐⭐ TIME EACH ROUND — OUT OF TIME (Đợt 265, thầy 26/8/2026).
     * Registered with `ui.setRoundTimeout()`; the engine calls it the moment the per-round
     * count down reaches 0 with the statement still unanswered.
     *
     * ⛔⛔ THIS FILE HAD NO SUCH HANDLER AT ALL. "Time each round" is offered for EVERY
     * Showdown game (core/options-panel.js builds the row on `showdown`, not on a template
     * flag), but only Quiz, Anagram and Type the answer ever answered the buzzer — so in
     * this game the bar simply emptied and nothing happened: no ✗, no penalty, no lost
     * heart, and both buttons still live. The teacher's report, word for word: *"đội hết
     * thời gian mà không bị báo sai, thời gian lùi rồi dừng ở 0 nhưng ko chuyển câu, không
     * báo sai, vẫn chọn được tiếp"*.
     *
     * The rule is the teacher's own from Đợt 174: out of time = WRONG. So this walks the
     * SAME path `choose()` walks for a wrong tap — score, sound, points-off, a heart, the
     * re-queue when "Repeat until answered" is on, the slide-off and the next statement —
     * with one difference: no ✗ is drawn on a button, because the pupil never chose one
     * and in a TWO-BUTTON game marking one button names the other as the answer.
     * ⚠️ FIGHT MODE NEVER CALLS THIS (same as Quiz/Anagram/TTA): in a match the referee
     * owns the sequence and locks a board silently. `fightCtl` guard, first line.
     */
    function roundTimeUp() {
      if (finished || fightCtl || !queue.length) return;
      const idx = queue[0];
      const st = state[idx];
      if (!st) return;
      // ⛔⛔ Đợt 265b — CHỐT LƯỢT, KHÔNG CHỐT CÂU. Dòng này từng là `if (st.answered) return`
      // và nó SAI ngay ở ca "Repeat": một câu trả lời sai rồi quay lại vẫn mang
      // `state[idx].answered === true`, nên tiếng chuông ở lượt sau bị nuốt sạch — đúng cái
      // lỗi cả đợt này sinh ra để vá, chỉ khác là nó chỉ cắn khi bật Repeat.
      // `turnLog[curRow]` mới là "lượt này đã ngã ngũ chưa".
      const turn = turnLog[curRow];
      if (turn && turn.answered) return;
      // Take it off the front FIRST — same split as Đợt 179 drew between "removing" and
      // "putting back": requeueRandom() only ever puts back.
      queue.shift();
      st.answered = true;
      st.correct = false;
      st.chosen = null;
      st.timedOut = true;
      // Đợt 265b — cùng lý do như trong choose(): lượt này là của em đang hiện tên.
      if (turn) { turn.answered = true; turn.correct = false; turn.chosen = null; turn.timedOut = true; }
      lockButtons();
      tfSound.wrong();
      // The class still has to SEE that it was marked wrong. The ✗ rides on the statement
      // itself, which is the one thing on screen that belongs to nobody's answer.
      const promptEl = root.querySelector(".aw-tf-prompt");
      if (promptEl) flyMark(promptEl, false);
      if (pointsOff) {
        ui.flyPenalty?.(null, pointsOff, () => {
          penalty += pointsOff;
          const v = liveScore();
          updateNav();
          return v;
        });
      }
      const outOfLives = loseLife();
      if (repeatUntilCorrect) requeueRandom(idx);
      exitPromptThenCall(() => {
        if (outOfLives) finish("gameover");
        else if (!queue.length) finish("complete");
        else startCycle();
      });
    }

    function updateNav() {
      // ⭐⭐ Đợt 178 — `index` USED TO BE `liveScore()`, and that was fine only
      // while nothing read it as a position. The engine does: it drives the
      // Showdown name (`paintShowdownName(index - 1)`) AND the per-round clock
      // (`roundBegin(index - 1)`). Left as the score, the pupil's name would have
      // changed when somebody scored rather than when the question changed —
      // and gone BACKWARDS on a points-off penalty.
      // So `index` now carries the row, and `label` carries the score, which is
      // what the bar has always displayed (the engine prefers `label` when it is
      // given, so this row reads exactly as it did before).
      ui.setNav({
        index: curRow + 1, total,
        label: `${liveScore()} of ${total}`,
        onPrev: null, onNext: null
      });
    }

    // Item 5 (teacher 1/8): keep the gap divider->buttons equal to the gap
    // buttons->"x of y" nav. The buttons sit at the card's bottom and the
    // flex:1 track above them absorbs any size change, so growing the divider's
    // bottom margin lengthens ONLY the top gap (the bottom gap doesn't move) —
    // one full-difference nudge lines them up. Reset to the CSS value before
    // each measure so repeated resizes don't accumulate.
    function scheduleBalance() {
      if (balanceTimer) clearTimeout(balanceTimer);
      balanceTimer = setTimeout(balanceSpacing, 70);
    }
    function rebalance() {
      const divider = root.querySelector(".aw-tf-divider");
      if (divider) divider.style.marginBottom = "";   // back to the CSS cqw value
      scheduleBalance();
    }
    function balanceSpacing() {
      if (finished) return;
      const divider = root.querySelector(".aw-tf-divider");
      const btnRow = root.querySelector(".aw-tf-buttons");
      const navLabel = document.querySelector(".aw-nav-label");
      if (!divider || !btnRow || !navLabel) return;
      const dR = divider.getBoundingClientRect();
      const bR = btnRow.getBoundingClientRect();
      const nR = navLabel.getBoundingClientRect();
      const gapTop = bR.top - dR.bottom;
      const gapBottom = nR.top - bR.bottom;
      if (gapBottom <= 0 || gapTop < 0) return;
      const delta = gapBottom - gapTop;
      if (Math.abs(delta) < 0.5) return;
      const cur = parseFloat(getComputedStyle(divider).marginBottom) || 0;
      divider.style.marginBottom = Math.max(0, cur + delta) + "px";
    }

    // ----- FIGHT MODE: the match controller drives this board through here.
    // Registered after everything it reaches for exists (fightGoTo, syncFightLock,
    // revealFightMarks) — same placement reasoning as quiz.js. Board 1 mounts
    // later than board 0, so `attach` may immediately jump it to the round the
    // match is already on.
    if (fightCtl) {
      fightCtl.attach(fightSide, {
        total,
        goToIndex: fightGoTo,
        lock(on) {
          fightBoardLock = !!on;
          syncFightLock();
        },
        reveal: revealFightMarks,
        // ⚠️ FIGHT MODE NEVER CALLS A "TIME'S UP" HOOK. Đợt 222 briefly gave
        // this board a `timeUp()` here so the referee could route "Time delay
        // window shut" into a treat-as-wrong reaction; Đợt 223 removed "Round
        // rule" from Options and with it the only case that lock needed one —
        // the referee now locks that board silently (see core/fight.js's
        // finalizeSingleWinner/silentLose).
        // Đợt 223 — "Show answers" ở bảng cuối trận Fight đọc bàn này qua đây,
        // bất cứ lúc nào (không cần đợi `finished`) — cùng mảng `buildReview()`
        // dựng cho single mode, chỉ gọi sớm hơn.
        review: buildReview
      });
    }

    // Keyboard: T / ArrowLeft = True, F / ArrowRight = False (statements only
    // ever move forward, so the arrows aren't needed for navigation here).
    function onKey(e) {
      if (finished) return;
      const k = e.key.toLowerCase();
      if (k === "t" || e.key === "ArrowLeft") {
        e.preventDefault();
        root.querySelector(".aw-tf-btn.is-true")?.click();
      } else if (k === "f" || e.key === "ArrowRight") {
        e.preventDefault();
        root.querySelector(".aw-tf-btn.is-false")?.click();
      }
    }

    // Đợt 223 — per-statement detail for the "Show answers" review screen,
    // pulled out of finish() so fightCtl.attach's `review` can hand the SAME
    // array to the Fight end panel mid-match (before `finished` is ever true).
    /** One review row from a statement + whatever answer record describes it. */
    function reviewRow(idx, rec) {
      const st = statements[idx];
      const correctText = st.answer ? "True" : "False";
      return {
        question: st.text,
        // ⭐ Đợt 265 — a statement the buzzer took is NOT "answered": nobody tapped
        // anything. Same reading Quiz (`chosen !== null`) and Type the answer
        // (`graded && !timedOut`) already give, so the three games agree in Show answers.
        answered: !!rec && rec.answered === true && rec.timedOut !== true,
        yourText: (!rec || rec.chosen == null) ? null : (rec.chosen ? "True" : "False"),
        yourCorrect: !!rec && rec.correct === true,
        correctText,
        src: st   // `statements` is a shallow copy, so `st` IS the content object
      };
    }

    /**
     * ⭐⭐⭐ Đợt 265b — REVIEW LÀ MỘT HÀNG MỖI LƯỢT (xem ghi chú ở chỗ khai `turnLog`).
     * Hàng `i` ở đây và vòng `i` của engine là CÙNG MỘT SỐ, nên `stampReview()` gắn tên
     * đúng em đã đối mặt với câu ấy, và `roundMs[i]` gắn đúng thời gian của lượt ấy.
     * Câu chưa bao giờ được phát thì xuống cuối, đúng nết Open the box đã đi từ Đợt 186.
     * ⚠️ FIGHT vẫn là một hàng mỗi CÂU: ở đó vòng `i` do trọng tài đánh số và cả hai bàn
     * phải hiểu `i` giống hệt nhau.
     */
    function buildReview() {
      if (fightCtl) return order.map(idx => reviewRow(idx, state[idx]));
      const seen = new Set(turnLog.map(t => t.idx));
      return [
        ...turnLog.map(t => reviewRow(t.idx, t)),
        ...order.filter(idx => !seen.has(idx)).map(idx => reviewRow(idx, state[idx]))
      ];
    }

    function finish(reason) {
      if (finished) return;
      finished = true;
      // ⚠️⚠️ Đợt 256 — CHỐT SỔ TRƯỚC KHI ĐỌC ĐIỂM. Một con số "−N" còn đang bay là
      // một phép trừ CHƯA áp; đọc điểm lúc này là ghi vào kết quả (và vào điểm nộp
      // của bài giao) một số CAO HƠN thật đúng bằng câu sai cuối cùng. Cú bay mất
      // 920ms, mà đường từ câu sai tới đây chỉ 500-700ms — cửa này mở thật, không
      // phải lo xa. `flushPenalties()` hạ cánh hết ngay lập tức.
      ui.flushPenalties?.();
      haltPromptAnim();
      if (fallbackTimer) { clearTimeout(fallbackTimer); fallbackTimer = null; }
      if (prepTimer) { clearTimeout(prepTimer); prepTimer = null; }
      if (balanceTimer) { clearTimeout(balanceTimer); balanceTimer = null; }
      if (gateTimer) { clearTimeout(gateTimer); gateTimer = null; }
      tickTimers.forEach(clearTimeout);
      // "timesup" (Submit pressed, or the clock hit 0) plays NO template sound
      // now — the summary screen's own fanfare already covers it, and the old
      // ~6-7s timesUp clip just overlapped it (teacher, 1/8/2026).
      if (reason === "gameover") tfSound.gameOver();
      else if (reason === "complete") tfSound.gameCompleted();

      // ⭐⭐⭐ Đợt 265b — BỐN CON SỐ ĐỀU ĐẾM TỪ CHÍNH CÁC HÀNG, không đếm từ `state[]` nữa.
      // `review` nay là một hàng mỗi LƯỢT, và engine cắt `review`/`perQuestion` theo cặp ở
      // chế độ Free (`raw.perQuestion.slice(0, keep)`) — hai mảng lệch độ dài là cắt lệch.
      // ⚠️ Không có câu nào lặp thì `turnLog` ra đúng `order` ⇒ cả bốn con số Y HỆT nết cũ.
      // Chỉ khi "Repeat" bắt hỏi lại một câu thì mẫu số mới lớn hơn — và đó là con số thật:
      // đội ấy đã tiêu thêm một lượt cho câu đó.
      const review = buildReview();
      const perQuestion = review.map((r, i) => ({ q: i, correct: r.yourCorrect === true }));
      const correct = perQuestion.filter(p => p.correct).length;
      const rowTotal = review.length;
      // Ranking score = correct count minus wrong-answer penalty. When pointsOff===0
      // penalty is 0, so score === correct, which equals the engine's default.
      // ⭐⭐ Đợt 294 — `items` = SỐ CÂU CỦA ĐỀ (`order`), đứng CẠNH `total` (= số LƯỢT, đã
      // cộng cả các câu bị "Repeat" hỏi lại) chứ không thay nó. Màn tổng kết vẫn đọc
      // `total` như Đợt 265b; chỉ con số NỘP LÊN BÀI GIAO mới lấy `items` — xem ghi chú
      // dài ở core/scoring.js.
      ui.finish({ score: correct - penalty, correct, incorrect: rowTotal - correct, total: rowTotal, items: order.length, perQuestion, review, answered: review.filter(r => r.answered).length });
    }

    return function cleanup() {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", rebalance);
      if (fitter) fitter.destroy();
      if (fallbackTimer) clearTimeout(fallbackTimer);
      if (prepTimer) clearTimeout(prepTimer);
      if (balanceTimer) clearTimeout(balanceTimer);
      if (gateTimer) clearTimeout(gateTimer);
      tickTimers.forEach(clearTimeout);
      voicePlayer.stop();
      haltPromptAnim();
      pendingMarks.forEach(clearTimeout);
      if (ui.livesSlot) ui.livesSlot.innerHTML = "";
      document.querySelectorAll(".aw-tf-flyclone, .aw-tf-star").forEach(n => n.remove());
    };
  }
};

registerTemplate(tfTemplate);
export default tfTemplate;
