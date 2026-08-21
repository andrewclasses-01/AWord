// =============================================================
// TEMPLATE: FIND THE MATCH — Wordwall style, English UI.
//  • Grid: 5 fixed ROWS, centred on screen. Each keyword tile gets an EXPLICIT
//    grid-row/grid-column by its position within the page — matching a tile
//    leaves a hole, the others never reflow (teacher's spec, 31/7/2026).
//  • PAGINATION (teacher 3/8/2026): more than 35 tiles splits the board into
//    pages (divided evenly), each a self-contained round whose prompts only
//    reference that page's tiles (so the answer is always on screen). Pages
//    auto-advance as cleared. There are NO page arrows and no "x of N" progress
//    (teacher 4/8/2026): the shared nav row under the stage shows only
//    "Page X / Y" — a position indicator, not a control — via ui.setNav's
//    `label`, which also keeps that row's height OUT of the board area.
//  • TEXT FIT (teacher 3/8/2026): every tile flex-centres its keyword and, via
//    a per-tile --tfit shrink (fitTiles), scales the font down until the word
//    fits inside the tile both ways — it never spills outside its box.
//  • Prompt ("conveyor belt"): the DEFINITION slides in from the left edge
//    of the stage, arrives at the centre, then (if Speed > 0) keeps
//    drifting slowly to the right edge — the whole journey is ONE
//    continuous slow glide, not a quick fade. Speed 0 = arrives at centre
//    and just waits there (no drift) until answered. A CORRECT tap makes the
//    prompt lift off and FLY into the score (bursting into little stars, like
//    True/false); a WRONG tap makes it glide on to the right edge from wherever
//    it is. Either way the answer TILES stay fixed and the tapped tile is never
//    removed; tiles are locked until the next prompt is ~50% in (1/8/2026).
//  • A pair that wasn't matched (wrong tap OR the glide reached the right
//    edge unanswered) follows `options.repeatUntilCorrect`: false = marked
//    skipped, tile removed; true = re-queued at a RANDOM position (not
//    just appended to the back) so it comes back later, order unpredictable.
//  • `options.removeCorrects`: whether a correct tile disappears or stays
//    locked with a small permanent checkmark.
//  • Timer/sound choreography (31/7/2026): Count-up mode gets a 3-2-1
//    prep countdown (big numbers in the question area + a "ting" per
//    second) BEFORE the first prompt ever appears — the engine's own
//    visible clock unavoidably keeps running through this (no core hook
//    exists to pause it yet; flagged in GHI CHU as a proposed core add,
//    so the recorded time ends up ~3s higher than "real" play time).
//    Count-down mode ticks once/sec from 10s remaining, doubling to twice/
//    sec from 5s remaining — computed from this template's OWN clock
//    (independent of the engine's private timer internals).
//  • Sounds: real Wordwall "Find the match" effects via ftm-sound.js — see
//    that file + GHI CHU FIND-THE-MATCH.md for the full mapping.
//  • Score = number of pairs matched by the end. ui.finish()/review follow
//    the same shape as every other template.
// =============================================================

import { registerTemplate } from "../../core/registry.js";
import { shuffle, el } from "../../core/utils.js";
import { press } from "../../core/press.js";
import { icons } from "../../core/icons.js";
import { autoFit } from "../../core/fit.js";
import { createVoicePlayer, voiceView, DEFAULT_INTRO_DELAY_MS } from "../../core/voice-playback.js";
import { openFtmEditor } from "./find-the-match-editor.js";
import { ftmSound } from "./ftm-sound.js";

// Same 8-colour palette as quiz.js's/open-the-box.js's answer-tile PALETTE.
// Colour is assigned once per pair (by its fixed slot) and stays stable.
const PALETTE = [
  { c: "#3b82f6", d: "#2563eb" }, // blue
  { c: "#06b6d4", d: "#0e93ad" }, // cyan
  { c: "#10b981", d: "#059669" }, // emerald
  { c: "#f59e0b", d: "#d97706" }, // amber
  { c: "#f97316", d: "#ea580c" }, // orange
  { c: "#ef4444", d: "#dc2626" }, // red
  { c: "#14b8a6", d: "#0f9488" }, // teal
  { c: "#8b5cf6", d: "#7c3aed" }  // violet
];

const ROWS = 5;
const MAX_TILES_PER_PAGE = 35;   // more than this and the board splits into pages (teacher 3/8/2026)
const ENTER_MS = 900;   // left edge -> centre, always this pace regardless of Speed
const EXIT_MS = 550;    // wherever it is -> fully off the right edge, once a tile is tapped
const DEFAULT_LIVES = 5;
const MAX_LIVES = 10;

// Options store lives as: 0 = unlimited (slider's left end), 1..10 = that many
// hearts, null = unlimited (legacy), undefined = default 5 — same shape as
// True/false so Settings/Options behave consistently across templates.
function normLives(v) {
  if (v === 0 || v === null) return null;                 // unlimited
  if (typeof v === "number") return Math.min(MAX_LIVES, Math.max(1, Math.round(v)));
  return DEFAULT_LIVES;                                   // undefined -> default 5
}

// Speed 0-10 -> how long the CENTRE-to-right-edge drift takes. 0 = no
// drift at all (frozen at centre, "wait for answer"). Chosen for feel —
// not measured against real Wordwall timing, revisit if the teacher wants
// a different pace after trying it on TOMKO.
function crawlMsFor(speed) {
  if (!speed) return null;
  const t = (speed - 1) / 9;
  return Math.round(5000 - t * (5000 - 900));
}

const ftmTemplate = {
  type: "find_the_match",
  scorable: true,
  // TIME COST (Dot 143) - opt in to the shared "-N per idle second" option.
  // Everything visible belongs to the engine; this template's whole share is
  // subtracting ui.timeCostTotal() in scoreNow() plus the wiring in mount().
  timeCost: true,
  // "Start with mistakes" (Đợt 84): which array in activity.content holds the
  // playable items. Core filters THAT array by the `src` refs the review rows
  // carry, so a replay keeps the originals untouched. See core/mistakes.js.
  itemsKey: "pairs",
  // ⭐⭐ Đợt 184 — FIGHT MODE, in the ORDINARY round model (`fightMode` alone, no
  // `fightPick`). The teacher's "each team picks a box in turn" rules were
  // written for a game whose questions sit in boxes waiting to be opened. Here
  // the definition COMES TO YOU on the conveyor belt and the tiles are the
  // ANSWERS — there is no set of questions to choose between, so a pick turn
  // would have to invent a screen this game does not have. Both boards therefore
  // run the SAME prompt at the same time and the first team to tap the right
  // tile wins the round, exactly like True/false and Quiz.
  fightMode: true,
  // ⭐⭐ Đợt 186 — SHOWDOWN. Left out in Đợt 178 because `review` came out in the
  // fixed pair order while the prompts are played in a shuffled, per-page queue
  // (and, with "repeat until answered", not even once each) — so pupil `n`
  // would have been named against a definition they never saw. `playOrder` +
  // `setNav({index: row})` fix exactly that.
  showdownMode: true,
  // ⭐⭐ Đợt 213b (thầy, 20/8/2026) — THỨ TỰ Ô TÍCH, theo CỘT.
  // Thầy đọc từng cột: "cột 1 <trên>/<dưới>, cột 2 …". Khối đổ theo CỘT (đầy cột 1
  // từ trên xuống rồi mới sang cột 2 — xem `.aw-checks` trong core/app.css), nên
  // danh sách này đọc thẳng thành bố cục: 2 mã đầu = cột 1, 2 mã kế = cột 2, …
  // ⛔ Là MÃ ĐỊNH DANH, không phải chữ hiện ra (chữ có thể đổi — chính đợt này đã
  // đổi "Show answer when wrong" thành "Show corrects").
  // ⚠️ Mã không có trong danh sách (Fight "In turns", Showdown "Balance questions")
  // tự xuống cuối — hai mode đó thầy chưa xếp.
  checkOrder: ["shuffle", "shuffleAnswers", "removeCorrects", "showAnswers"],
  // ⭐ Đợt 213b — mở ô "Shuffle answers" (thầy giao). Bảng chữ ở game này VỐN ĐÃ
  // trộn vô điều kiện, nên cờ này chỉ cho thầy đường TẮT nó; mặc định vẫn bật.
  // Chỗ đọc: `choiceOrder` trong mount() — và luật Fight không trộn vẫn đứng trên.
  usesShuffleAnswers: true,
  name: "Find the match",
  hasLivesSlot: true,       // hearts render in the top bar, left of the score (like True/false)
  manualTimerStart: true,   // the visible clock starts only after our 3-2-1 prep (count-up), so the prep isn't counted

  toPrintItems(activity) {
    return (activity.content?.pairs || [])
      .filter(p => p && p.keyword && p.definition)
      .map(p => ({ clue: p.definition, answer: p.keyword }));
  },

  edit: openFtmEditor,

  sounds: {
    play: ftmSound.intro,
    restart: ftmSound.restart,
    complete: () => {}   // silenced: find-the-match.js picks ONE of Completed/GameOver/TimesUp itself
  },

  // Options panel extra controls (engine.js calls this — see core/HUONG DAN CORE.md).
  // Đợt 140 — rebuilt on the shared panel builders (mkSliderCell/mkSeg/
  // addCheck): same options, same draft fields, now cells of the panel's grid
  // so they line up with the engine's own instead of being four more
  // full-width groups. "∞"/"Off" keep the value chip inside its fixed 52px —
  // that fixed width is what makes the chips form a column.
  buildExtraOptions({ panel, draft, mkSliderCell, mkSeg, mkCell, addCheck }) {
    // LIVES — a slider 0..10 (0 = Unlimited), hearts shown next to the score
    // (same as True/false — teacher's request, 1/8).
    const curLives = (draft.lives === 0 || draft.lives === null) ? 0
      : (Number.isInteger(draft.lives) ? Math.min(MAX_LIVES, Math.max(1, draft.lives)) : DEFAULT_LIVES);
    const lives = mkSliderCell({
      label: "Lives", min: 0, max: MAX_LIVES, step: 1, value: curLives, tone: "green", offAt: 0,
      fmt: v => (v === 0 ? "∞" : String(v)),
      onInput: v => { draft.lives = v; }   // 0 stored = unlimited
    });
    lives.cell.title = "0 = unlimited lives";

    // SPEED — a real slider (teacher's explicit request), not a dropdown.
    const speed = mkSliderCell({
      label: "Speed", sub: "0 = wait", min: 0, max: 10, step: 1,
      value: Number.isInteger(draft.speed) ? draft.speed : 0, tone: "blue", offAt: 0,
      fmt: v => (v === 0 ? "Off" : String(v)),
      onInput: v => { draft.speed = v; }
    });
    speed.cell.title = "0 = wait for the answer, no time limit per question";

    // What happens to a pair that wasn't matched in time (only matters
    // when Speed > 0, or when it was tapped wrong).
    const repeat = mkCell({ label: "Unanswered" });
    repeat.ctl.append(mkSeg([
      { value: "once", label: "Ask once", title: "Show each question once" },
      { value: "repeat", label: "Repeat", title: "Repeat questions until correct" }
    ], draft.repeatUntilCorrect === true ? "repeat" : "once",
      v => { draft.repeatUntilCorrect = v === "repeat"; }));

    panel.append(lives.cell, speed.cell, repeat.cell);

    // Whether a correctly-matched tile disappears or stays (locked).
    addCheck("Remove corrects", draft.removeCorrects !== false, v => { draft.removeCorrects = v; },
      { key: "removeCorrects" });
  },

  mount(root, activity, ui) {
    const opt = activity.options || {};
    const removeCorrects = opt.removeCorrects !== false;
    const repeatUntilCorrect = opt.repeatUntilCorrect === true;
    const speed = Number.isInteger(opt.speed) ? Math.max(0, Math.min(10, opt.speed)) : 0;
    const crawlMs = crawlMsFor(speed);
    // Penalty subtracted from the live score on each WRONG tap (0..100, 0 = off).
    // When 0, the whole feature is inert and play is byte-identical to before.
    const pointsOff = Math.max(0, Math.min(100, Number(activity.options && activity.options.pointsOff) || 0));
    const timerMode = opt.timer ?? "countUp";
    const timerTotal = opt.timerTotalSeconds ?? 120;

    const pairs = [...(activity.content?.pairs || [])].filter(p => p && p.keyword && p.definition);
    const total = pairs.length;
    if (total < 2) {
      root.innerHTML = "";
      root.append(el("div", "aw-ftm-empty", "This activity needs at least 2 pairs."));
      return () => {};
    }

    // ----- FIGHT MODE (Đợt 184) — `_fight` is put here by core/fight.js.
    const fight = activity._fight || null;
    const fightSide = fight ? fight.side : 0;
    const fightCtl = fight ? fight.ctl : null;
    let fightBoardLock = false;
    const fightLocked = () => fightBoardLock || !!(fightCtl && fightCtl.isLocked(fightSide));
    let fightPendingReveal = null;   // { idx, tile, correct } — held back while the other team plays
    // ⭐ SHOWDOWN (Đợt 186) — the order the prompts were actually SHOWN in. See
    // updateNav / finish: it is what makes "this definition belongs to pupil N"
    // and the end-of-game review agree with each other.
    const playOrder = [];
    // The row of the prompt ON SCREEN. A repeated pair (Repeat until answered)
    // keeps the row it already had, so it comes back to the SAME pupil and
    // still lines up with its one row in Show answers — the rule Đợt 178 wrote
    // down for True/false, and the only mapping that can stay consistent.
    let curRow = 0;

    // `order` = the fixed sequence used for scoring/review (never mutated).
    let order = pairs.map((_, i) => i);
    if (opt.shuffleQuestions) order = shuffle(order);

    // PAGINATION (teacher 3/8/2026): a big set is split across PAGES of at most
    // MAX_TILES_PER_PAGE keyword tiles, divided as evenly as possible (e.g. 40 ->
    // 20+20, not 35+5). Each page is a SELF-CONTAINED round — its prompts are
    // only the pairs whose keyword tile sits on that page, so the matching word
    // is ALWAYS visible on the current page. Pages auto-advance as they're
    // cleared; a ‹ Page X/Y › pager also lets you move manually. `choiceOrder`
    // (shuffled) is the tile layout order; chunking it forms the pages.
    // ⚠️ FIGHT (Đợt 184): NOT shuffled. This is the tile LAYOUT — in a match each
    // board would otherwise lay its tiles out differently AND (through the page
    // chunks below) end up with a different prompt behind the same round number.
    // Both boards must be the same board; the match already fixed the pair order.
    // ⭐ Đợt 213b (thầy, 20/8/2026) — "SHUFFLE ANSWERS" NOW HAS A SWITCH. The tile
    // layout was already shuffled UNCONDITIONALLY in single play, so this adds no
    // new behaviour: it only lets thầy turn the shuffling OFF and read the tiles
    // in the order the act was written. Default ON = byte-for-byte what every act
    // in the library already does today.
    // ⛔⛔ THE FIGHT RULE OUTRANKS THE SWITCH. `fightCtl` is tested FIRST and on
    // its own, so with the switch ON a match still hands both boards the same
    // layout. Never fold the two into one condition in which the option could
    // re-enable shuffling inside a match.
    // ⭐⭐ ĐỌC TIẾP KHỐI "Đợt 222" NGAY DƯỚI TRƯỚC KHI TIN DÒNG NÀY: từ Đợt 222 hai
    // bàn CÓ xáo chỗ ngồi khác nhau — nhưng vẫn qua đúng cửa này, tức thứ tự gốc
    // (và do đó PHÉP CHIA TRANG) vẫn chung cho hai bàn. Đây vẫn là chỗ duy nhất
    // được phép quyết định "cả bộ xếp theo thứ tự nào".
    const choiceOrder = (fightCtl || opt.shuffleAnswers === false)
      ? pairs.map((_, i) => i)
      : shuffle(pairs.map((_, i) => i));
    const PAGE_COUNT = Math.max(1, Math.ceil(total / MAX_TILES_PER_PAGE));
    const perPage = Math.ceil(total / PAGE_COUNT);
    const pages = [];
    for (let p = 0; p < PAGE_COUNT; p++) pages.push(choiceOrder.slice(p * perPage, (p + 1) * perPage));
    // Per-page prompt queues — front = current prompt for that page; shuffled
    // within the page (when shuffleQuestions is on) for variety.
    // ⚠️⚠️ Đợt 222 — DỰNG TRƯỚC CÚ XÁO BỐ CỤC NGAY DƯỚI, và thứ tự hai khối này là
    // cả phần an toàn của tính năng: hàng chờ lời nhắc phải sinh ra từ thứ tự
    // CHUNG, không phải từ mảng đã xáo riêng cho bàn này.
    const pageQueues = pages.map(arr => ((opt.shuffleQuestions && !fightCtl) ? shuffle([...arr]) : [...arr]));

    // ⭐⭐⭐ Đợt 222 (thầy, 21/8/2026) — TRONG TRẬN, HAI BÀN PHẢI XẾP Ô KHÁC NHAU.
    // Thầy: *"vị trí các ô trả lời chưa được xáo trộn (kể cả khi đã tích Shuffle cả
    // questions và answers), các đáp án được xếp theo thứ tự lần lượt từ trái sang
    // phải, từ trên xuống dưới nên có thể chọn lần lượt mà không cần đọc câu hỏi"*.
    // ⛔ ĐO ĐƯỢC (scratch/dot222-ftm.html, 24 ô): hai bàn giống hệt nhau 24/24 ô, và
    // vì lời nhắc cũng chạy đúng thứ tự bộ câu nên ô thứ k CHÍNH LÀ đáp án của vòng
    // thứ k. Cả trận đọc được bằng cách bấm từ trái sang phải.
    // ⭐ VÌ SAO XÁO TRONG TỪNG TRANG chứ không xáo cả bộ: `fightGoTo()` tìm trang
    // bằng `pages.findIndex(arr => arr.includes(i))`, nên PHÉP CHIA TRANG phải giống
    // hệt nhau ở hai bàn — khác đi là hai bàn đứng ở hai trang khác nhau giữa cùng
    // một vòng. Xáo TRONG trang giữ nguyên "trang nào chứa từ nào", chỉ đổi CHỖ ĐỨNG.
    // ⚠️ Luật Đợt 184 *"cả hai bàn phải là cùng một bàn"* vẫn còn nguyên phần lõi của
    // nó: thứ tự VÒNG ĐẤU chung, phép chia trang chung. Cái được thả ra chỉ là chỗ
    // ngồi của các ô — thứ mà Đợt 184 khoá kèm chỉ vì hồi đó nó dính chung một mảng.
    // ⚠️ `revealFightMarks()` tra ô đúng bằng `pages[curPage].indexOf(target)` nên nó
    // tự đi theo bố cục mới, không phải sửa gì.
    // ⚠️ Xáo hai lần cho tới khi KHÁC nhau là việc của xác suất, không làm được ở đây
    // (mỗi bàn là một lần `mount` riêng, không bàn nào thấy bàn kia). Trang 5 ô thì
    // xác suất trùng là 1/120 — chấp nhận được; trang 20 ô thì coi như không bao giờ.
    if (fightCtl && opt.shuffleAnswers !== false) {
      for (let p = 0; p < pages.length; p++) pages[p] = shuffle(pages[p]);
    }

    // Grid geometry sized to the LARGEST page so every page lines up identically
    // (5 fixed rows, columns from the tile count). A tile's cell never changes as
    // siblings around it are matched — removing one leaves a hole (teacher's spec).
    const maxPageSize = Math.max(...pages.map(a => a.length));
    const cols = Math.max(1, Math.ceil(maxPageSize / ROWS));
    const colW = Math.min(15, 90 / cols);

    const state = pairs.map(() => ({ solved: false, skipped: false }));
    let finished = false;
    let curPage = 0;                 // page currently on screen / being played
    let queue = pageQueues[curPage]; // LIVE working sequence for the current page — front = current prompt
    let penalty = 0;          // total points docked by wrong taps (pointsOff); stays 0 when the feature is off
    let livesLeft = normLives(opt.lives);
    let fitter = null;
    let tileFitRaf = 0;       // rAF handle coalescing per-tile font fitting after --fit settles
    let promptAnim = null;    // the currently-running Animation on .aw-ftm-prompt (enter or crawl)
    let fallbackTimer = null; // setTimeout backup for whichever animation is running (rule: .animate() needs one)
    let prepTimer = null;     // the 3-2-1 prep sequence (count-up mode only)
    let gateTimer = null;     // unlocks the tiles once a new prompt is ~50% in (like True/false)
    const tickTimers = [];    // discrete count-down "ting" timeouts (count-down mode only)
    const pendingMarks = [];  // setTimeouts for fly marks / heart-pop cleanup

    // Pronunciation playback (10/8/2026) — optional per-pair, carried
    // through Change Template from an Anagram source (core/convert.js).
    // `pairs[i]` IS the raw content object (line 191 is a shallow filter
    // copy only), so `.voice`/`.hideText` read straight off it.
    const voicePlayer = createVoicePlayer();
    let firstPromptSpoken = false;

    ui.onSubmit(() => finish("timesup"), () => state.filter(s => s.solved || s.skipped).length);   // block "Submit answers" at 0 answered
    window.addEventListener("keydown", onKey);
    renderShell();

    // ----- TIME COST wiring (Dot 143) - see core/engine.js's ui.setIdleGuard.
    // The guard answers ONE question: "could the student act right now?" If not,
    // the idle clock must not charge them. Here that is: the game finished, the
    // 3-2-1 prep before the first prompt, the gap while one prompt flies off and
    // the next slides in, and a clip still speaking - nobody can match a prompt
    // they are still being read.
    // The gap is read off the TILES' own disabled state rather than a flag of our
    // own: lockTiles()/unlockTiles() already are the single source of truth for
    // "can this be answered", and a parallel flag is the kind of thing that
    // drifts out of step with them later.
    ui.setScoreProvider?.(scoreNow);
    ui.setIdleGuard?.(() => {
      if (finished || prepTimer || voicePlayer.isPlaying()) return true;
      const tile = root.querySelector(".aw-ftm-tile");
      return !!(tile && tile.disabled);
    });

    if (timerMode === "countUp") {
      runPrepCountdown();          // starts the clock (ui.startTimer) only after the 3-2-1
    } else {
      ui.startTimer();             // count-down / none: clock starts right away
      if (timerMode !== "none") ftmSound.go();
      if (timerMode === "countDown") armCountdownTicks();
      startCycle();
    }

    // Live score = pairs matched minus points docked for wrong taps. Negatives
    // are allowed (the top-bar renders them red without a minus). With the
    // feature off (penalty always 0) this equals the plain matched-count.
    // TIME COST (Dot 143): the idle clock's running total comes off HERE, the
    // one place this game decides what the score is - every ui.setScore() in
    // this file already goes through scoreNow(), so an ordinary score update
    // can never repaint the deduction away.
    function scoreNow() {
      return state.filter(s => s.solved).length - penalty - (ui.timeCostTotal ? ui.timeCostTotal() : 0);
    }

    function armFallback(fn, ms) {
      if (fallbackTimer) clearTimeout(fallbackTimer);
      fallbackTimer = setTimeout(fn, ms);
    }

    // Count-up mode only: 3 big numbers (one per second) in the question
    // area + a "ting" each second, THEN the real first prompt starts. The
    // engine's own visible clock/recorded time has no hook to pause during
    // this — see the header comment + GHI CHU for the proposed core add.
    function runPrepCountdown() {
      const promptEl = root.querySelector(".aw-ftm-prompt");
      if (!promptEl) { ui.startTimer(); ftmSound.go(); startCycle(); return; }
      promptEl.classList.add("is-countdown");
      let n = 3;
      const tick = () => {
        if (finished) return;
        promptEl.textContent = String(n);
        ftmSound.clockTick();
        n--;
        if (n > 0) { prepTimer = setTimeout(tick, 1000); return; }
        prepTimer = setTimeout(() => {
          promptEl.classList.remove("is-countdown");
          promptEl.textContent = "";
          ui.startTimer();     // the visible clock begins only NOW — the 3-2-1 prep isn't counted
          ftmSound.go();
          startCycle();
        }, 1000);
      };
      tick();
    }

    // Count-down mode only: schedule a "ting" once/sec while 10-6s remain,
    // then twice/sec (every 0.5s) from 5s remaining down to 0.5s. Computed
    // from THIS template's own start reference (mount() runs right as the
    // engine's own countdown begins too, for count-down mode — no prep
    // delay applies here), independent of engine.js's private timer state.
    function armCountdownTicks() {
      const at = [];
      for (let r = 10; r >= 6; r--) at.push(timerTotal - r);
      for (let r = 5; r >= 1; r -= 0.5) at.push(timerTotal - r);
      at.forEach(sec => {
        if (sec < 0) return;
        tickTimers.push(setTimeout(() => { if (!finished) ftmSound.clockTick(); }, sec * 1000));
      });
    }

    function renderShell() {
      // renderShell now runs once per page (mount + every page change), so tear
      // down the PREVIOUS page's autoFit (its resize listener) / pending tile fit
      // before building the new one — otherwise they'd pile up.
      if (fitter) { fitter.destroy(); fitter = null; }
      if (tileFitRaf) { cancelAnimationFrame(tileFitRaf); tileFitRaf = 0; }
      root.innerHTML = "";
      const card = el("div", "aw-ftm-card");

      const track = el("div", "aw-ftm-track");
      track.append(el("div", "aw-ftm-prompt"));
      card.append(track);

      card.append(el("div", "aw-ftm-divider"));

      const grid = el("div", "aw-ftm-grid");
      grid.style.gridTemplateColumns = `repeat(${cols}, ${colW}cqw)`;
      grid.style.gridTemplateRows = `repeat(${ROWS}, min-content)`;
      // Only THIS page's tiles. Cell = position within the page (explicit
      // grid-row/column) so matched tiles leave a fixed hole, never reflowing.
      pages[curPage].forEach((idx, i) => {
        const st = state[idx];
        // A matched-and-removed tile (removeCorrects) leaves an empty cell.
        if (st.solved && removeCorrects) return;
        const tile = el("button", "aw-ftm-tile", escapeHtml(pairs[idx].keyword));
        tile.dataset.idx = String(idx);
        tile.style.gridRow = String(Math.floor(i / cols) + 1);
        tile.style.gridColumn = String((i % cols) + 1);
        const col = PALETTE[i % PALETTE.length];
        tile.style.setProperty("--ftm-c", col.c);
        tile.style.setProperty("--ftm-d", col.d);
        // Every rendered tile is a normal, full-colour, clickable tile — whether
        // it's unmatched OR already matched-but-kept (removeCorrects:false). A
        // kept match is deliberately INDISTINGUISHABLE from an unmatched
        // distractor (teacher 6/8/2026: no dim, no permanent badge) so the player
        // can't tell which words are "used up". Tapping a solved tile for a later
        // prompt just counts as a wrong tap (its pair is no longer in the queue).
        press(tile, () => choose(idx, tile));   // instant on touch-down — core/press.js
        grid.append(tile);
      });
      card.append(grid);

      // ⭐⭐⭐ Đợt 222 (thầy, 21/8/2026) — LỚP RIÊNG CHO DẤU ✓/✗ BAY.
      // Thầy: *"dấu X và V bay ra khi có 1 câu đúng cần ở layer trên cùng, nếu có bay
      // vào phạm vi ô khác thì phải ở layer trên chứ không được bị các ô khác đè lên"*.
      // ⛔⛔ GỐC RỄ: dấu được `append` vào CHÍNH Ô, mà ô có `overflow: hidden` (và
      // `.aw-ftm-grid` cũng vậy). `z-index: 6` của `.aw-mark-fly` KHÔNG cứu được —
      // overflow cắt theo HỘP, không theo lớp. Mà keyframe `aw-fly` bay tới
      // `translateY(-170%)`, tức phần lớn quãng đường nằm NGOÀI ô ⇒ bị xén sạch.
      // ⭐ Cách sửa: một lớp phủ trống nằm ĐÈ LÊN lưới, dấu vẽ vào đó theo toạ độ
      // pixel của ô vừa bấm (flyMarkOnTile). Nó là ANH EM của lưới nên không bị
      // `overflow` nào của lưới/ô chạm tới, và nằm sau lưới trong DOM nên đè lên mọi ô.
      // ⚠️ KHÔNG gỡ `overflow: hidden` của ô để chữa việc này: chữ dài cần nó (xem
      // khối Đợt 222 trong find-the-match.css) — hai việc khác nhau, hai chỗ khác nhau.
      card.append(el("div", "aw-ftm-marks"));

      // The page indicator lives DOWN in the shared nav row under the stage (see
      // updateNav) — no in-board pager any more, so every bit of the board's
      // height goes to the tiles themselves (teacher 4/8/2026).

      root.append(card);

      // The height the tile grid actually NEEDS. Not grid.scrollHeight: the grid
      // is a stretched flex child, so its scrollHeight collapses to its stretched
      // height (fit.js warns about exactly this) and real overflow stayed
      // invisible until it exceeded the whole slack — which is why the bottom row
      // was being clipped (measured 4/8/2026: 12 tiles cut, 11px over).
      const gridNeedH = () => {
        const tile = grid.querySelector(".aw-ftm-tile");
        if (!tile) return 0;
        const rowsUsed = Math.max(1, Math.min(ROWS, Math.ceil(pages[curPage].length / cols)));
        const gap = parseFloat(getComputedStyle(grid).rowGap) || 0;
        return rowsUsed * tile.offsetHeight + (rowsUsed - 1) * gap;
      };
      // offsetHeight ignores margins, and this card's fixed chrome (the track's
      // bottom margin, the divider's margin, the card's own padding) adds up to
      // ~3cqw — leaving it out made autoFit think the board was shorter than it is.
      const outerH = node => {
        if (!node) return 0;
        const cs = getComputedStyle(node);
        return node.offsetHeight + (parseFloat(cs.marginTop) || 0) + (parseFloat(cs.marginBottom) || 0);
      };
      fitter = autoFit(root, card, s => { card.style.setProperty("--fit", s); scheduleTileFit(); }, {
        // slack ~1.5cqw: the tiles' 3D shadow lip (0.5cqw) sits below their layout
        // box and would otherwise be shaved off by the grid's overflow:hidden.
        slack: root.clientWidth * 0.015,
        measure: () => {
          const cs = getComputedStyle(card);
          return (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0)
            + outerH(track) + outerH(card.querySelector(".aw-ftm-divider")) + gridNeedH();
        }
      });
      // Fit the tiles NOW, synchronously (once --fit is set) — don't wait on the
      // rAF path, which is frozen while the tab isn't compositing. Re-fit once
      // the web font swaps in (its metrics differ) and, via scheduleTileFit, on
      // every later resize.
      fitTiles();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!finished) fitTiles(); }).catch(() => {});

      ui.setScore(scoreNow());
      updateNav();
      renderLives();
      lockTiles();   // stay locked until the first prompt is ~50% in (startCycle re-arms the unlock)
    }

    // Per-tile text fit: after the whole-stage --fit settles, shrink each tile's
    // font (via its own --tfit) until the keyword fits INSIDE the tile both ways,
    // so a long word never spills outside its box and always stays centred
    // (teacher 3/8/2026). Coalesced through one rAF so the burst of --fit writes
    // during autoFit's binary search only triggers a single pass.
    function scheduleTileFit() {
      if (tileFitRaf) cancelAnimationFrame(tileFitRaf);
      tileFitRaf = requestAnimationFrame(() => { tileFitRaf = 0; fitTiles(); });
    }
    /**
     * ⭐⭐ Đợt 222 — CÁCH ĐO BỀ NGANG ĐỔI, VÌ `scrollWidth` NÓI DỐI Ở ĐÂY.
     * Ô là hộp flex `justify-content: center`, mà phần chữ thò ra BÊN TRÁI của một
     * hộp căn giữa thì `scrollWidth` KHÔNG tính vào (luật cuộn: chỉ đo phía cuối).
     * Đo được ở Đợt 222: `congratulations` rộng 132px trong lòng ô 131px mà
     * `scrollWidth === clientWidth`, nên vòng lặp cũ nghĩ là vừa và để nguyên `1`.
     * Nay đo BỀ RỘNG DÒNG CHỮ THẬT bằng Range — đúng thứ mắt thầy nhìn thấy.
     * ⚠️ Lấy `getClientRects()` rồi max từng DÒNG, không lấy `getBoundingClientRect()`:
     * với cụm nhiều từ đã xuống dòng thì hộp bao là hợp của các dòng, tức luôn bằng
     * bề ngang lòng ô ⇒ đo kiểu đó là không bao giờ thấy tràn.
     * ⚠️ Chiều cao vẫn đo bằng `scrollHeight` — chiều dọc không có bẫy căn giữa
     * tương ứng (`align-items:center` cũng cắt hai đầu, nhưng chữ chỉ tràn dọc khi
     * xuống dòng, và lúc đó `scrollHeight` báo đúng).
     */
    function textOverflows(t) {
      if (t.scrollHeight > t.clientHeight + 1) return true;
      const node = [...t.childNodes].find(n => n.nodeType === 3 && n.textContent.trim());
      if (!node) return false;
      const r = document.createRange();
      r.selectNodeContents(node);
      const rects = [...r.getClientRects()];
      if (!rects.length) return false;
      const widest = Math.max(...rects.map(x => x.width));
      const cs = getComputedStyle(t);
      const inner = t.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
      return widest > inner + 0.5;
    }
    function fitTiles() {
      root.querySelectorAll(".aw-ftm-tile").forEach(t => {
        t.style.setProperty("--tfit", "1");
        let scale = 1, guard = 0;
        // Nấc 0,06 và sàn 0,34 (cũ: 0,08 / 0,40): từ khoá một-từ nay phải nằm TRỌN
        // trên một dòng nên nó cần đi xuống sâu hơn cái cũ — đo thật:
        // `antidisestablishmentarianism` (28 chữ cái) dừng ở 0,52.
        while (guard++ < 14 && textOverflows(t) && scale > 0.34) {
          scale -= 0.06;
          t.style.setProperty("--tfit", scale.toFixed(3));
        }
      });
    }

    // The next page (wrapping) that still has unsolved prompts, or -1 if the
    // whole activity is done.
    function nextNonEmptyPage(from) {
      for (let k = 1; k <= PAGE_COUNT; k++) {
        const p = (from + k) % PAGE_COUNT;
        if (pageQueues[p].length) return p;
      }
      return -1;
    }

    // (Pages are never flipped by hand — the game moves on by itself once the
    // current page is cleared; the nav row only REPORTS which page you're on.)

    // Hearts live in the top bar (ui.livesSlot), just left of the score — same
    // as True/false. 1..5 lives show that many separate hearts; 6..10 show a
    // compact "N♥"; unlimited shows nothing. A lost life pops the LEFTMOST heart.
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

    // Drops one life, popping the leftmost heart (when 1..5 are shown
    // individually) then re-rendering. Returns true if that was the last life.
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

    // Long definitions can overflow the fixed-height, overflow:hidden track (the
    // whole-stage autoFit only watches the answer grid, not the prompt). Shrink
    // THIS prompt's font via --pfit until it fits both ways, so nothing is
    // clipped. The fly-to-score clone reads the resulting computed size, so it
    // lifts off from exactly the size shown here.
    function fitPrompt(promptEl) {
      const track = promptEl.parentElement;   // .aw-ftm-track
      if (!track) return;
      promptEl.style.setProperty("--pfit", "1");
      let scale = 1, guard = 0;
      while (guard++ < 14 &&
             (promptEl.scrollHeight > track.clientHeight + 1 || promptEl.scrollWidth > track.clientWidth + 1) &&
             scale > 0.45) {
        scale -= 0.07;
        promptEl.style.setProperty("--pfit", scale.toFixed(3));
      }
    }

    // Tiles are LOCKED while a prompt is entering, and only unlock once it's
    // ~50% across — so you can't answer two prompts back-to-back "blind"
    // (teacher 1/8, same gate as True/false). Solved / locked tiles stay
    // disabled regardless.
    function lockTiles() { root.querySelectorAll(".aw-ftm-tile").forEach(t => { t.disabled = true; }); }
    function unlockTiles() {
      root.querySelectorAll(".aw-ftm-tile").forEach(t => {
        if (!t.classList.contains("is-solved") && !t.classList.contains("is-locked")) t.disabled = false;
      });
    }

    // Starts (or restarts) the current queue-front's journey from the LEFT
    // edge. Only called once the PREVIOUS prompt is fully gone.
    function startCycle() {
      if (finished) return;
      // Current page cleared? Move to the next page that still has prompts (and
      // re-render for it), or finish once every page is done (teacher 3/8/2026).
      if (!queue.length) {
        const np = nextNonEmptyPage(curPage);
        if (np < 0) { armFallback(() => finish("complete"), 400); return; }
        curPage = np;
        queue = pageQueues[curPage];
        renderShell();
      }
      const promptEl = root.querySelector(".aw-ftm-prompt");
      if (!promptEl) return;
      promptEl.style.visibility = "";           // a correct-answer fly may have hidden it
      voicePlayer.stop();                       // silence the PREVIOUS pair's clip, if any
      promptEl.className = "aw-ftm-prompt";      // drop any stale voiceonly class from the last pair
      // ⭐ SHOWDOWN (Đợt 186) — the prompt on screen, and with it whose turn this
      // is. Reported here, the one funnel every prompt passes through, with this
      // game's own slide-out/slide-in times so the name leaves with the old
      // definition and arrives with the new one.
      const idx0 = queue[0];
      if (!playOrder.includes(idx0)) playOrder.push(idx0);
      curRow = playOrder.indexOf(idx0);
      ui.itemChanging?.(curRow, { outMs: EXIT_MS, inMs: ENTER_MS });
      updateNav();

      const pr = pairs[queue[0]];
      const vv = voiceView(activity, pr);   // Options > Content decides text/voice
      const hasVoice = vv.hasVoice, hideText = vv.hideText;
      if (hideText) {
        promptEl.textContent = "";
        promptEl.classList.add("aw-clue-voiceonly");
      } else {
        promptEl.textContent = escapeHtml(pr.definition);
      }
      if (hasVoice) {
        const vBtn = el("button", "aw-voicebtn" + (hideText ? " aw-voicebtn-lg" : ""), icons.soundOn);
        vBtn.type = "button";
        vBtn.setAttribute("aria-label", "Listen to pronunciation");
        press(vBtn, e => { e.stopPropagation(); voicePlayer.toggle(pr.voice, vBtn); });
        promptEl.append(vBtn);
        if (vv.autoPlay) voicePlayer.playDelayed(pr.voice, vBtn, firstPromptSpoken ? 0 : DEFAULT_INTRO_DELAY_MS);
      }
      firstPromptSpoken = true;
      fitPrompt(promptEl);                       // shrink long definitions so nothing is clipped
      const off = offscreenPx();
      promptEl.style.transform = `translateX(${-off}px)`;
      void promptEl.offsetWidth; // reflow so the browser commits the start position before animating from it
      ftmSound.conveyorAppear();
      const enter = promptEl.animate(
        [{ transform: `translateX(${-off}px)` }, { transform: "translateX(0px)" }],
        { duration: ENTER_MS, easing: "ease-out", fill: "forwards" }
      );
      promptAnim = enter;
      // Lock the tiles now, unlock at ~50% of the slide-in (teacher 1/8).
      lockTiles();
      if (gateTimer) clearTimeout(gateTimer);
      gateTimer = setTimeout(() => { if (!finished && queue.length) unlockTiles(); }, Math.round(ENTER_MS * 0.5));
      let done = false;
      const onEntered = () => {
        if (done) return; done = true;
        promptAnim = null;
        if (finished) return;
        ftmSound.conveyorCentred();
        armCrawl();
      };
      enter.onfinish = onEntered;
      armFallback(onEntered, ENTER_MS + 100);
    }

    // After arriving at centre: if Speed > 0, keep drifting to the right
    // edge (unanswered by the time it fully exits = a timeout). Speed 0 =
    // stays frozen at centre — no crawl armed at all.
    function armCrawl() {
      if (finished || !queue.length || !crawlMs) return;
      const promptEl = root.querySelector(".aw-ftm-prompt");
      if (!promptEl) return;
      const off = offscreenPx();
      ftmSound.conveyorLeave();
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

    // Freezes whatever position the prompt is CURRENTLY at (mid-entrance or
    // mid-crawl) into a real inline style, so a follow-up .animate() call
    // with only a "to" keyframe continues smoothly from there (implicit
    // from-keyframe = current computed style).
    function haltPromptAnim() {
      if (promptAnim) {
        try { promptAnim.commitStyles(); } catch (e) { /* ignore */ }
        try { promptAnim.cancel(); } catch (e) { /* ignore */ }
        promptAnim = null;
      }
    }

    // Puts a pair back in the running for later — at a RANDOM spot in the
    // queue (not just appended at the back), per the teacher's spec, so a
    // missed question doesn't come back in a predictable rhythm.
    function requeueRandom(idx) {
      queue.shift();
      if (!queue.length) { queue.push(idx); return; }
      const pos = 1 + Math.floor(Math.random() * queue.length);
      queue.splice(pos, 0, idx);
    }

    // A pair that just failed this round (wrong tap OR the glide timed
    // out unanswered) — shared by onTimeUp() and choose()'s wrong branch.
    function dropOrRequeue(idx) {
      if (repeatUntilCorrect) {
        requeueRandom(idx);
      } else {
        queue.shift();
        state[idx].skipped = true;
        // Tile is NOT removed (teacher's spec 1/8: answers stay fixed) — it
        // simply lingers as an unmatched distractor for the rest of the game.
      }
    }

    function onTimeUp() {
      if (finished || !queue.length) return;
      // FIGHT: a prompt that glided off unanswered ends THIS board's go — a
      // wrong finish, which leaves the round open for the other team instead of
      // taking it away (the Đợt 128 rule). The match decides what comes next.
      if (fightCtl) {
        const target = queue[0];
        state[target].skipped = true;
        fightPendingReveal = fightPendingReveal || { idx: null, tile: null, correct: false };
        lockTiles();
        syncFightLock();
        fightCtl.wordDone(fightSide, { index: target, correct: false });
        return;
      }
      dropOrRequeue(queue[0]);
      startCycle();
    }

    /**
     * ⭐⭐⭐ Đợt 222 — DẤU ✓/✗ BAY, VẼ TRÊN LỚP PHỦ CHỨ KHÔNG VẼ TRONG Ô.
     * Xem khối chú thích ở `renderShell()` để biết vì sao (ô `overflow: hidden` xén
     * mất gần hết quãng bay `translateY(-170%)` của keyframe `aw-fly`).
     * ⚠️ ĐO BẰNG PIXEL, KHÔNG DÙNG `%`: lớp phủ trùm cả thẻ bài, còn `.aw-mark-fly`
     * của core được viết để nằm TRONG ô (`left:50% top:50% width:52%` là 52% của Ô).
     * Đặt nguyên nó lên lớp phủ là dấu to bằng nửa màn hình, nằm giữa thẻ bài. Nên
     * ba giá trị đó bị ghi đè bằng px lấy từ chính ô vừa bấm.
     * ⚠️ `transform: translate(-50%,-50%)` của core GIỮ NGUYÊN (mọi keyframe của
     * `aw-fly`/`aw-fly-cross` đều mở đầu bằng đúng nó) nên toạ độ trên là TÂM ô —
     * đây đúng là luật số 12 của dự án: phần tử định vị bằng transform thì chỉ được
     * đụng vào thứ khác, đừng đụng vào transform.
     * ⚠️ Dự phòng: không thấy lớp phủ thì vẽ vào ô như cũ, còn hơn mất hẳn dấu.
     */
    function flyMarkOnTile(tile, ok) {
      const fly = el("span", "aw-mark-fly" + (ok ? "" : " is-cross"),
                     ok ? icons.markCheck : icons.markCross);
      const layer = root.querySelector(".aw-ftm-marks");
      if (!layer || !tile) {
        (tile || root).append(fly);
      } else {
        const lr = layer.getBoundingClientRect();
        const tr = tile.getBoundingClientRect();
        fly.style.left = (tr.left - lr.left + tr.width / 2) + "px";
        fly.style.top = (tr.top - lr.top + tr.height / 2) + "px";
        fly.style.width = (tr.width * 0.52) + "px";
        layer.append(fly);
      }
      pendingMarks.push(setTimeout(() => fly.remove(), 900));
    }

    function removeTile(tile) {
      if (!tile) return;
      // Teacher's spec (1/8): tiles must NEVER change position. A matched tile
      // fades out (opacity:0 via .is-solved) but STAYS in the DOM — its grid
      // cell is kept reserved so no other tile ever reflows.
      tile.classList.add("is-solved");
      tile.disabled = true;
    }

    // Slides the prompt from wherever it currently is to fully off the
    // right edge, THEN calls `cb` (next cycle, or finish). Shared by a
    // correct tap, a wrong tap, and running out of lives.
    function exitPromptThenCall(cb) {
      const promptEl = root.querySelector(".aw-ftm-prompt");
      haltPromptAnim();
      if (!promptEl) { cb(); return; }
      ftmSound.conveyorLeave();
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

    // A correct answer gets a two-beat celebration (teacher 6/8/2026): a big
    // green ✓ pops in the CENTRE of the question band with a "ting" and is held
    // briefly, THEN the prompt itself flies to the score with its star burst.
    // The check is a plain overlay inside the track (NOT a child of the prompt),
    // so flyPromptToScore's clone — which copies only the prompt's text — never
    // drags it along.
    function bigCheckThenFly(promptEl, cb) {
      const track = promptEl && promptEl.parentElement;   // .aw-ftm-track
      if (!track) { flyPromptToScore(promptEl, cb); return; }
      ftmSound.clockTick();                                // the "ting"
      const big = el("div", "aw-ftm-bigcheck", icons.markCheck);
      track.append(big);
      try {
        big.animate([
          { transform: "translate(-50%,-50%) scale(.2)", opacity: 0 },
          { transform: "translate(-50%,-50%) scale(1.12)", opacity: 1, offset: .65 },
          { transform: "translate(-50%,-50%) scale(1)", opacity: 1 }
        ], { duration: 240, easing: "cubic-bezier(.3,1.5,.5,1)", fill: "forwards" });
      } catch (e) { /* ignore */ }
      const flyOff = () => {
        // fade the check out just as the prompt lifts off
        try {
          big.animate(
            [{ opacity: 1 }, { opacity: 0, transform: "translate(-50%,-50%) scale(.65)" }],
            { duration: 200, easing: "ease-in", fill: "forwards" }
          ).onfinish = () => big.remove();
        } catch (e) { big.remove(); }
        pendingMarks.push(setTimeout(() => big.remove(), 260));
        ftmSound.correct();                                // the match chime, on the fly
        flyPromptToScore(promptEl, cb);
      };
      pendingMarks.push(setTimeout(() => { if (finished) { big.remove(); return; } flyOff(); }, 560));
    }

    // A CORRECT answer: the whole prompt lifts off toward the score, bursting
    // into little stars that stream into it; the score then ticks up with a
    // pulse. THEN `cb` runs (start next / finish). Overlay nodes are appended to
    // the fullscreen host (or <body>) so they show over the stage and in
    // fullscreen; they use px/viewport coords (NOT cqw, which wouldn't resolve
    // outside the stage). Mirrors True/false's flyStatementToScore.
    function flyPromptToScore(promptEl, cb) {
      const scoreEl = ui.scoreEl || document.querySelector(".aw-top-score");
      const host = document.fullscreenElement || document.body;
      let called = false;
      const done = () => { if (called) return; called = true; if (!finished) cb(); };
      if (!promptEl || !scoreEl) { done(); return; }

      const from = promptEl.getBoundingClientRect();
      const to = scoreEl.getBoundingClientRect();
      const cs = getComputedStyle(promptEl);

      const clone = el("div", "aw-ftm-flyclone");
      clone.textContent = promptEl.textContent;
      clone.style.left = from.left + "px";
      clone.style.top = from.top + "px";
      clone.style.width = from.width + "px";
      clone.style.height = from.height + "px";
      clone.style.font = cs.font;
      clone.style.fontSize = cs.fontSize;   // carry the fitted (possibly shrunk) size exactly
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

      // score ticks up mid-flight, with a little pulse
      pendingMarks.push(setTimeout(() => {
        if (finished) return;
        ui.setScore(scoreNow());
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
        const s = el("span", "aw-ftm-star", "&#9733;");
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

    function choose(idx, tile) {
      if (finished || !queue.length) return;
      if (fightLocked()) return;   // the other team took this round, or the match is over
      const target = queue[0];

      // ⭐⭐ FIGHT (Đợt 184) — this board's go is over, and nothing on this screen
      // may name the answer while the other team is still looking: no ✓ over the
      // tapped tile, no big centre check, no prompt flying off (a prompt that
      // leaves says "that tile was right" as loudly as a tick). The board goes
      // neutral grey instead, and everything held back goes up on reveal().
      if (fightCtl) {
        ui.noteActivity?.();
        lockTiles();
        const correct = idx === target;
        fightPendingReveal = { idx, tile, correct };
        if (correct) {
          state[target].solved = true;
          ftmSound.correct();
        } else {
          ftmSound.wrong();
          if (pointsOff) penalty += pointsOff;
          loseLife();
        }
        ui.setScore(scoreNow());
        updateNav();
        root.querySelector(".aw-ftm-card")?.classList.add("is-fightlost");
        // `index` is the ROW in `review` — `order` is identity in a match, so
        // the prompt's own pair index IS that row (same contract as True/false).
        fightCtl.wordDone(fightSide, { index: target, correct });
        return;   // the MATCH decides what happens next
      }
      // TIME COST (Dot 143): tapping a tile IS the progress this game measures,
      // so it resets the idle clock whether the tap was right or wrong - charging
      // a class for honest wrong guesses would measure luck, not attention.
      ui.noteActivity?.();
      // Lock all tiles right away so the NEXT prompt can't be answered "blind"
      // while this one is still flying off / sliding out — startCycle re-arms
      // the 50%-in unlock for the incoming prompt (teacher 1/8, like True/false).
      lockTiles();
      if (idx === target) {
        queue.shift();
        state[target].solved = true;

        flyMarkOnTile(tile, true);   // Đợt 222 — vẽ trên lớp phủ, xem hàm đó
        if (removeCorrects) {
          removeTile(tile);
        }
        // removeCorrects:false (teacher 6/8/2026): the matched tile is left
        // exactly as it was — full colour, still clickable, NO permanent dim and
        // NO permanent badge — so it stays indistinguishable from an unmatched
        // distractor and the player can't tell which words are used up. Its only
        // "correct" cue is the ✓ that flew up above, which fades on its own;
        // startCycle's unlock re-enables it (it carries no is-solved/is-locked).

        // The current PROMPT gets a two-beat celebration (teacher 6/8/2026): a
        // big ✓ pops in the centre of the question with a "ting", is held ~0.56s,
        // THEN the whole prompt lifts off toward the score bursting into stars
        // (flyPromptToScore ticks the score up mid-flight with a pulse).
        const promptEl = root.querySelector(".aw-ftm-prompt");
        haltPromptAnim();
        // startCycle() auto-advances to the next page (or finishes) when this
        // page's queue is now empty — see its top-of-function guard.
        bigCheckThenFly(promptEl, () => startCycle());
      } else {
        // Wrong tap (teacher's spec, 1/8): the TAPPED tile stays exactly where
        // it is — a ✗ flies up then fades, but the tile never moves or vanishes
        // (it may be the right answer for a LATER prompt; answers are fixed).
        // The current PROMPT, however, moves on to the next one: its pair is
        // dropped (Show once) or re-queued at a RANDOM later spot (Repeat until
        // correct), and the prompt glides off to the right just like a correct
        // tap. Lose a life if lives are enabled — running out ends the game.
        ftmSound.wrong();
        flyMarkOnTile(tile, false);   // Đợt 222 — vẽ trên lớp phủ, xem hàm đó

        // Dock points for the wrong tap (no clamp — the score may go negative).
        // Guarded by pointsOff so play is byte-identical when the feature is off.
        if (pointsOff) {
          penalty += pointsOff;
          ui.setScore(scoreNow());
          updateNav();
        }

        const outOfLives = loseLife();
        dropOrRequeue(target);
        exitPromptThenCall(() => {
          if (outOfLives) finish("gameover");
          else startCycle();   // auto-advances to the next page or finishes when the page is cleared
        });
      }
    }

    // The row under the stage (teacher 4/8/2026): NO "x of N" progress and NO
    // arrows — this game never goes back, and the score is already top-right.
    // It shows only WHICH PAGE of tiles is on screen, and nothing at all when
    // the whole set fits on one page. (`label` is core's opt-in nav text.)
    function updateNav() {
      // ⭐⭐ Đợt 186 — `index` is the ROW IN `review` (the engine reads it to pick
      // the Showdown pupil and to open each round's clock), NOT the page number
      // it used to carry. The page still reads exactly as before through
      // `label`, which the engine prefers when it is given — the same trick
      // True/false used in Đợt 178 to keep its score visible.
      ui.setNav({
        index: curRow + 1, total,
        onPrev: null, onNext: null,
        label: PAGE_COUNT > 1 ? `Page ${curPage + 1} / ${PAGE_COUNT}` : ""
      });
    }

    // ================= FIGHT MODE (Đợt 184) =========================
    // All dead code outside a match (`fightCtl` is null).

    // The match puts BOTH boards on pair `i`. `order` is identity in a match, so
    // the round number IS the pair index; the page it lives on comes from the
    // same chunking both boards built, so the two land on the same page too.
    function fightGoTo(i) {
      if (finished) return;
      if (!pairs[i]) return;
      fightPendingReveal = null;
      const page = pages.findIndex(arr => arr.includes(i));
      if (page >= 0 && page !== curPage) { curPage = page; renderShell(); }
      queue = pageQueues[curPage];
      queue.length = 0;
      queue.push(i);
      haltPromptAnim();
      root.querySelector(".aw-ftm-card")?.classList.remove("is-fightlost");
      root.querySelectorAll(".aw-ftm-fightmark").forEach(n => n.remove());
      startCycle();
    }

    // The round is settled for both teams: show what was withheld. The correct
    // tile is marked on BOTH boards (the board that never answered needs to see
    // it too), and a board that tapped the wrong tile gets its ✗ there.
    function revealFightMarks() {
      if (!fightCtl) return;
      const held = fightPendingReveal;
      fightPendingReveal = null;
      const target = queue.length ? queue[0] : null;
      const tiles = [...root.querySelectorAll(".aw-ftm-tile")];
      const pageArr = pages[curPage] || [];
      if (target !== null) {
        const pos = pageArr.indexOf(target);
        const rightTile = pos >= 0 ? tiles[pos] : null;
        if (rightTile && !rightTile.querySelector(".aw-ftm-fightmark")) {
          rightTile.append(el("span", "aw-ftm-fightmark", icons.markCheck));
        }
      }
      if (held && !held.correct && held.tile && !held.tile.querySelector(".aw-ftm-fightmark")) {
        held.tile.append(el("span", "aw-ftm-fightmark is-cross", icons.markCross));
      }
      root.querySelector(".aw-ftm-card")?.classList.remove("is-fightlost");
    }

    // Apply a lock WITHOUT rebuilding anything (the no-flash rule).
    function syncFightLock() {
      if (!fightCtl) return;
      const locked = fightLocked();
      if (locked) lockTiles();
      root.querySelector(".aw-ftm-card")?.classList.toggle("is-fightlost",
        locked || !!fightPendingReveal);
    }

    if (fightCtl) {
      fightCtl.attach(fightSide, {
        total,
        goToIndex: fightGoTo,
        lock(on) { fightBoardLock = !!on; syncFightLock(); },
        reveal: revealFightMarks,
        // ⭐⭐ Đợt 222 (thầy, 21/8/2026) — CỬA SỔ TIME DELAY CẠN MÀ BÀN NÀY CHƯA
        // CHẠM Ô NÀO: *"báo hiệu giống hệt như chọn sai (âm thanh, trừ điểm như chọn
        // sai)"*. Đúng nhánh sai của `choose()`, BỎ hai thứ: `fightCtl.wordDone()`
        // (trọng tài đã đặt `roundDone` trước khi gọi xuống đây) và mọi lệnh sang câu.
        // ⚠️ KHÔNG gộp vào `onTimeUp()` — ca "lời nhắc trôi hết băng chuyền" tới nay
        // KHÔNG trừ điểm, gộp vào là lặng lẽ đổi luật của một tính năng khác.
        // ⚠️ Không có ô nào để đính dấu ✗ (đội này chưa chạm gì), nên dấu duy nhất
        // là dấu ✓ mà `revealFightMarks()` đặt lên ô ĐÚNG ngay sau đó — cùng cách
        // Quiz xử ca hết giờ không chọn ô nào (Đợt 174).
        timeUp() {
          if (finished || !queue.length) return;
          const target = queue[0];
          if (state[target].solved || state[target].skipped) return;
          state[target].skipped = true;
          ftmSound.wrong();
          if (pointsOff) {
            penalty += pointsOff;
            ui.setScore(scoreNow());
          }
          loseLife();
          updateNav();
          fightPendingReveal = fightPendingReveal || { idx: null, tile: null, correct: false };
          lockTiles();
          syncFightLock();
        }
      });
    }

    function onKey(e) {
      if (finished) return;
      const n = parseInt(e.key, 10);
      if (Number.isInteger(n) && n >= 1) {
        const tiles = [...root.querySelectorAll(".aw-ftm-tile")].filter(t => !t.disabled);
        const tile = tiles[n - 1];
        if (tile) tile.click();
      }
    }

    function finish(reason) {
      if (finished) return;
      finished = true;
      haltPromptAnim();
      if (fallbackTimer) { clearTimeout(fallbackTimer); fallbackTimer = null; }
      if (prepTimer) { clearTimeout(prepTimer); prepTimer = null; }
      tickTimers.forEach(clearTimeout);
      if (reason === "gameover") ftmSound.gameOver();
      else if (reason === "timesup") ftmSound.timesUp();
      else ftmSound.gameCompleted();

      // ⭐⭐ Đợt 186 — IN PLAY ORDER (see `playOrder`): the prompts arrive in a
      // shuffled per-page queue, so `order` is not the order the class saw them
      // in — and Showdown hands row `n` to pupil `n`. Pairs that never came up
      // are appended in their own order, so nothing is lost from the review.
      const rows = [...playOrder, ...order.filter(i => !playOrder.includes(i))];
      const perQuestion = rows.map((idx, i) => ({ q: i, correct: state[idx].solved === true }));
      const correct = perQuestion.filter(p => p.correct).length;
      const review = rows.map(idx => {
        const p = pairs[idx];
        const s = state[idx];
        return {
          question: p.definition,
          answered: s.solved,
          yourText: s.solved ? p.keyword : null,
          yourCorrect: s.solved,
          correctText: p.keyword,
          src: p   // `pairs` is a shallow copy, so `p` IS the content object
        };
      });
      // Out of lives shows "GAME OVER" (celebration cover + menu panel both
      // read this title); everything else keeps the default "Game complete".
      // Report the SAME live value shown top-right (matched minus points off).
      // With the feature off, penalty is 0 so this equals `correct` — the exact
      // number ui.finish would default to anyway (byte-identical).
      ui.finish({ correct, incorrect: total - correct, total, perQuestion, review, answered: correct,
        score: scoreNow(),
        title: reason === "gameover" ? "Game over" : undefined });
    }

    return function cleanup() {
      window.removeEventListener("keydown", onKey);
      if (fitter) fitter.destroy();
      if (tileFitRaf) cancelAnimationFrame(tileFitRaf);
      if (fallbackTimer) clearTimeout(fallbackTimer);
      if (prepTimer) clearTimeout(prepTimer);
      if (gateTimer) clearTimeout(gateTimer);
      tickTimers.forEach(clearTimeout);
      pendingMarks.forEach(clearTimeout);
      voicePlayer.stop();
      haltPromptAnim();
      if (ui.livesSlot) ui.livesSlot.innerHTML = "";
      document.querySelectorAll(".aw-ftm-flyclone, .aw-ftm-star, .aw-ftm-bigcheck").forEach(n => n.remove());
    };
  }
};

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

registerTemplate(ftmTemplate);
export default ftmTemplate;
