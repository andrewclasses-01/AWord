// =============================================================
// TEMPLATE: RUNNING TEAM (RUNNINGT) — a whole-class relay against the clock,
// played off ONE sheet of paper that travels around the room.
//
// HOW IT IS PLAYED
//   The screen calls a pupil and a number — "MINH ANH — 23". Minh Anh is
//   holding the printed word list; she finds row 23 and reads that word out
//   loud. Six words are on screen and five of them LOOK like the answer, so
//   somebody else has to listen properly and pick the right one. Tap it and the
//   board clears: READY, 3, 2, 1, and the next name is called. The paper is
//   passed to whoever is named next — that is the "running" in Running team.
//
// WHAT MAKES IT A GAME
//   Two clocks and a row of hearts. Every question has its own short countdown;
//   letting it run out, or tapping the wrong word, costs a heart. Lose the last
//   heart and the class loses. But there is also a MAIN clock counting down over
//   the whole round: survive to zero and the CLASS WINS. Clear the whole word
//   list first and they win too.
//
// WHAT THIS TEMPLATE NEEDS THAT NO OTHER ONE DOES
//   Real pupils' names. They come from Settings > Classes (core/classes.js) —
//   app-wide data, not activity content, because the same roll is wanted by
//   every future activity that calls children by name. The setup screen picks a
//   class and lets the teacher untick whoever is away today.
//
// A "GAME SET" = one printed numbering + the roll it was played with, saved
// together on the activity. Both have to persist as a pair: a teacher who closes
// the app mid-lesson must be able to reprint the exact sheet the class is
// holding. See rt-sets.js.
//
// CORE IS UNTOUCHED. Everything this game needs already existed:
//   • the 4:3 frame + the CSS-zoom fullscreen  -> `useZoomFullscreen` + the
//     `act-running_team` class the engine stamps on every stage (Running word
//     opened both doors on 5/8/2026)
//   • no whole-game engine clock               -> `hideTimerOption` +
//     options.timer:"none"; this game owns both of its clocks
//   • a different end-of-game panel            -> the `renderSummary` hook
//
//   ⚠️ It does NOT use `inlineTimerBar` or `hasLivesSlot`, even though it wants
//   exactly what they provide. Those two flags are MUTUALLY EXCLUSIVE in
//   core/engine.js: the topbar builder checks `if (topbarMid) ... else if
//   (livesSlot)`, so a template setting both gets its hearts element created and
//   then never appended — invisible, with no error anywhere. This game needs a
//   question bar AND hearts AND a main clock, so it hides the engine topbar
//   outright (running-team.css) and draws its own row, exactly as Running word
//   does. No core change, no silent trap.
// =============================================================

import { registerTemplate } from "../../core/registry.js";
import { el, shuffle } from "../../core/utils.js";
import { press } from "../../core/press.js";
import { icons } from "../../core/icons.js";
import { fitOnce } from "../../core/fit.js";
import { openRunningTeamEditor } from "./running-team-editor.js";
import { rtSound } from "./rt-sound.js";
import { printRunningTeamSheet } from "./rt-print.js";
import {
  poolFrom, buildOrder, buildTiles, readSets, makeSet, rosterOf,
  setFitsPool, MIN_POOL, MAX_SETS, TILES
} from "./rt-sets.js";

const SLOGAN = "RUNNING TEAM IN ANDREW CLASSES";

// Modern answer-tile palette — a COPY of Quiz's (templates are self-contained
// by contract, same reasoning rt-sound.js gives for copying rather than
// importing across template folders). Six of these eight get shuffled onto
// the six tile POSITIONS once per round (startRunning()) and stay put for
// every question in that round, exactly like Quiz assigns colour per answer
// position for the whole game rather than reshuffling every question.
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

// Lives are stored as 0 = UNLIMITED, 1..10 = that many hearts — the same
// convention (and the same slider) as Find the match, so the two games behave
// identically for the teacher. `null` internally means unlimited.
const MAX_LIVES = 10;
const DEFAULT_LIVES = 3;

// READY -> 3 -> 2 -> 1 timing (Đợt 117, teacher's request: "hơi nhanh" -> slower).
// Was 850/680 — both bumped by roughly half so the pupil's name has time to
// register before the numbers start, and each digit gets a beat to read.
const READY_HOLD_MS = 1300;
const COUNT_STEP_MS = 1000;
// How long the READY/3-2-1 overlay's own opacity transition takes — hideOverlay()
// waits this long before setting display:none, so the fade-out actually plays
// instead of being cut off mid-transition. Must match running-team.css's
// `.aw-rt-overlay { transition: opacity ... }` duration.
const OVERLAY_FADE_MS = 380;
function normLives(v) {
  if (v === 0 || v === null || v === undefined) return v === 0 ? null : DEFAULT_LIVES;
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return DEFAULT_LIVES;
  if (n <= 0) return null;
  return Math.min(MAX_LIVES, n);
}

// The data the end-of-round panel needs, stashed just before ui.finish() runs.
// core/engine.js calls rtTemplate.renderSummary() AFTER the confetti — a method
// on the template object, with no access to mount()'s closure — so it reads
// this instead. Safe as a module-level single because AWord only ever mounts one
// activity at a time (the same reasoning Running word's rwEndData relies on).
let rtEndData = null;

// Đợt 575 — the three settings, normalised from `activity.options` (same
// fields, ranges and defaults the old Options panel wrote) and back again.
function readCfg(opt) {
  return {
    mainMs: Math.round(clampInt(opt.mainSeconds, 30, 600, 600) / 5) * 5 * 1000,
    questionMs: clampInt(opt.questionSeconds, 0, 30, 15) * 1000,   // 0 = untimed
    lives: normLives(opt.lives)               // null = unlimited
  };
}
function optsFromCfg(cfg) {
  return { mainSeconds: Math.round(cfg.mainMs / 1000), questionSeconds: Math.round(cfg.questionMs / 1000), lives: cfg.lives === null ? 0 : cfg.lives };
}

function clampInt(v, lo, hi, dflt) {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return dflt;
  return Math.max(lo, Math.min(hi, n));
}
function fmtClock(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Menu pause (Đợt 91, 8/8/2026) — bridges the CURRENT mount's pause/resume
// pair out to the template-level `onPause` hook engine.js calls. Module-level
// single, same pattern as `rtEndData` below: AWord only ever mounts one
// activity at a time.
let rtPauseHandlers = null;

const rtTemplate = {
  type: "running_team",
  scorable: true,
  // ⭐⭐⭐ Đợt 245 (23/8/2026, thầy chốt "CHẶN hẳn") — CANNOT BE SET AS HOMEWORK.
  // Same pair of reasons as Running word (see the note on `noAssignment` in
  // templates/running-word/running-word.js): a two-team game on one keyboard has
  // no single pupil to report on, and `renderSummary` below replaces the whole
  // end panel without reading `session`, so the teacher's three end-of-game
  // tick-boxes would silently do nothing.
  // ⛔ TO LIFT THIS: delete this line AND teach renderSummary to honour `session`.
  noAssignment: "Running team is a two-team classroom game — it has no single student to report on.",
  // ⭐⭐ Đợt 213b (thầy, 20/8/2026) — THỨ TỰ Ô TÍCH, theo CỘT.
  // Thầy đọc từng cột: "cột 1 <trên>/<dưới>, cột 2 …". Khối đổ theo CỘT (đầy cột 1
  // từ trên xuống rồi mới sang cột 2 — xem `.aw-checks` trong core/app.css), nên
  // danh sách này đọc thẳng thành bố cục: 2 mã đầu = cột 1, 2 mã kế = cột 2, …
  // ⛔ Là MÃ ĐỊNH DANH, không phải chữ hiện ra (chữ có thể đổi — chính đợt này đã
  // đổi "Show answer when wrong" thành "Show corrects").
  // ⚠️ Mã không có trong danh sách (Fight "In turns", Showdown "Balance questions")
  // tự xuống cuối — hai mode đó thầy chưa xếp.
  checkOrder: ["shuffle", "showAnswers"],
  name: "Running team",
  edit: openRunningTeamEditor,

  hideTimerOption: true,     // the game owns two clocks; a whole-game clock would fight them
  hidePointsOff: true,       // a wrong answer costs a HEART here, not points
  manualTimerStart: true,    // nothing starts until START RUNNING is pressed
  // Real Fullscreen API measured unusable on iPad Chrome for this shape of game
  // (Running word, 5/8/2026, live device): a downward swipe near the top edge
  // silently drops fullscreen mid-round and Chrome throws a "stay fullscreen?"
  // banner over the board. The engine reads this flag and swaps the Fullscreen
  // button to a CSS-only zoom (`.aw-zoomed` on root). CSS for it lives in
  // running-team.css — core has no shared rule for that class.
  useZoomFullscreen: true,
  // ⭐ Đợt 575 (thầy, 23/10/2026) — mở game là vào THẲNG màn setup, 3 thanh tuỳ chọn + APPLY nằm ngay trên màn đó ⇒ không
  // còn nút Options, màn READY của engine bị bỏ (startScreen bấm Play hộ). Cùng khuôn Running word — xem chú thích ở đó.
  noOptionsButton: true,
  startScreen({ play, ready, preflight }) {
    if (preflight) return { dispose() {} };   // màn chọn WORDS đang dựng NHẸ (Đợt 549) — chưa Play
    let gone = false;
    ready().then(() => { if (!gone) play(); });
    return { dispose() { gone = true; } };
  },

  sounds: {
    play: () => {},          // the READY / 3-2-1 has its own sound; a jingle here would collide
    restart: () => {},
    complete: () => {}       // endGame() already played the win / lose bells
  },

  // The shared Print button (Anagram/Quiz worksheet formats) still works — it
  // just sees a plain word list with no clues. The sheet that matters for this
  // game is the numbered one printed from the setup screen.
  toPrintItems(activity) {
    return poolFrom(activity).map(w => ({ clue: "", answer: w }));
  },

  // ===== END-OF-ROUND PANEL =================================================
  // Replaces the engine's default summary body via the `tpl.renderSummary` hook.
  // The verdict is the point here, not the arithmetic: WIN or GAME OVER huge,
  // the score and the time left small underneath, and one Start again.
  renderSummary(panel, { restart, panelItem }) {
    const d = rtEndData || { won: false, correct: 0, asked: 0, total: 0, mainLeft: 0, reason: "", className: "" };
    const board = el("div", "aw-rt-sum" + (d.won ? " is-win" : " is-lose"));

    board.append(el("div", "aw-rt-sum-verdict", d.won ? "CLASS WINS" : "GAME OVER"));
    board.append(el("div", "aw-rt-sum-why", escapeHtml(reasonText(d))));

    const stats = el("div", "aw-rt-sum-stats");
    stats.append(stat(`${d.correct}/${d.asked}`, "words won"));
    stats.append(stat(fmtClock(d.mainLeft), "time left"));
    stats.append(stat(String(d.total), "words on the sheet"));
    board.append(stats);

    if (d.className) board.append(el("div", "aw-rt-sum-class", escapeHtml(d.className.toUpperCase())));
    panel.append(board);

    const row = el("div", "aw-rt-sum-acts");
    row.append(panelItem("Start again", restart));
    panel.append(row);

    function stat(big, small) {
      const s = el("div", "aw-rt-sum-stat");
      s.append(el("div", "aw-rt-sum-big", escapeHtml(big)), el("div", "aw-rt-sum-small", escapeHtml(small)));
      return s;
    }
  },

  // ===== OPTIONS ============================================================
  // All three controls below are the SAME slider shape (touch-friendly, one
  // glance to read) so the panel feels like one family rather than three
  // different widgets glued together.
  // Đợt 140 — shared panel builders. The two explanatory notes under the
  // sliders became tooltips on their cells: a paragraph of prose inside a
  // grid cell is what made this panel's rows uneven.
  buildExtraOptions({ panel, draft, mkSliderCell }) {
    // -- main clock: 0:30 to 10:00, snapped to whole 5s steps --
    const mainSecs = Math.round(clampInt(draft.mainSeconds, 30, 600, 600) / 5) * 5;
    const cMain = mkSliderCell({
      label: "Round time", sub: "whole game", min: 30, max: 600, step: 5, value: mainSecs, tone: "blue",
      fmt: v => fmtClock(v * 1000),
      onInput: v => { draft.mainSeconds = v; }
    });

    // -- per-question clock: 0 (untimed) to 30s --
    const cQ = mkSliderCell({
      label: "Question time", min: 0, max: 30, step: 1,
      value: clampInt(draft.questionSeconds, 0, 30, 15), tone: "blue", offAt: 0,
      fmt: v => (v === 0 ? "Off" : v + "s"),
      onInput: v => { draft.questionSeconds = v; }
    });
    cQ.cell.title = "At 0s a question never runs out on its own — a wrong tap still costs a life, "
      + "there is just no clock pushing the class along.";

    // -- lives (0 = unlimited, exactly like Find the match) --
    const cur = normLives(draft.lives);
    const cL = mkSliderCell({
      label: "Lives", min: 0, max: MAX_LIVES, step: 1, value: cur === null ? 0 : cur,
      tone: "green", offAt: 0,
      fmt: v => (v === 0 ? "∞" : String(v)),
      onInput: v => { draft.lives = v; }      // 0 stored = unlimited
    });
    cL.cell.title = "At ∞ nobody is ever knocked out — a wrong tap just lets the class try again.";

    panel.append(cMain.cell, cQ.cell, cL.cell);
  },

  // =============================================================
  mount(root, activity, ui) {
    const pool = poolFrom(activity);
    // Đợt 594 — nghĩa EN/VI (+ IPA) do core/convert.js mang theo khi mở từ act WORDS; act đứng riêng: rỗng
    const defsMap = (activity.content && activity.content.defs && typeof activity.content.defs === "object") ? activity.content.defs : {};
    const defOf = w => { const d = defsMap[String(w || "").toUpperCase()] || {}; return { en: String(d.en || ""), vi: String(d.vi || ""), ex: String(d.ex || ""), ipa: String(d.ipa || "") }; };

    root.innerHTML = "";
    if (pool.length < MIN_POOL) {
      root.append(el("div", "aw-rt-empty", `This activity needs at least ${MIN_POOL} words — every round shows six.`));
      return () => {};
    }

    // Teacher vs student device. The engine strips its toolbar under the frame
    // in student mode, so its absence is a reliable signal without asking core
    // for anything new. Printing, picking a class and saving a set are all
    // teacher-only actions.
    const isTeacher = !!document.querySelector(".aw-below-right");

    // ⭐ Đợt 575 — `let`: APPLY trên màn setup đọc lại (applyOptions bên dưới).
    let cfg = readCfg(activity.options || {});

    // ---------- setup state ----------
    let sets = readSets(activity);
    let setIndex = 0;
    let current = sets.find(Boolean) ? sets[sets.findIndex(Boolean)] : null;
    if (current) setIndex = sets.findIndex(Boolean);
    let dirty = false;                          // `current` isn't one of the saved slots

    let classes = null;                         // null = not loaded yet, [] = none/unavailable
    let classError = "";
    let pickedClassId = current?.classId || "";
    let rosterDraft = current ? rosterOf(current).map(s => ({ ...s, present: true })) : [];

    // ---------- match state ----------
    let phase = "setup";                        // setup | ready | question | over
    let order = [];                             // the printed numbering
    let roster = [];                            // pupils actually present
    let queue = [];                             // indices of `order` still to ask
    let qWordIndex = -1;                        // index into `order` of the live question
    let turnPtr = 0;                            // round-robin pointer into `roster`
    let livesLeft = null;
    let mainLeft = 0, qLeft = 0;
    let correctCount = 0, askedCount = 0;
    let locked = true;                          // tiles ignore taps between questions
    let finished = false;
    let lastQTick = null;                       // last whole second announced on the question bar
    // ⭐ Đợt 575 (thầy: "dù có hết giờ vẫn phải nốt từ đang làm chứ không dừng ngay khi hết giờ") — đồng hồ tổng về 0
    // ⇒ LAST WORD: từ đang làm (kể cả đang READY/3-2-1 — đã gọi tên là tính) chơi nốt, goReady() kế tiếp mới kết thúc.
    let lastWord = false;
    const perQuestion = [];                     // [{q, correct}] for the engine's scoring
    const review = [];                          // [{question, answered, yourText, yourCorrect, correctText}]
    let tileColors = [];                        // 6 {c,d} entries, one per tile POSITION, set in startRunning()

    let mainTimer = null, qTimer = null;
    const timers = new Set();
    const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); return id; };

    // ---------- shell ----------
    const card = el("div", "aw-rt-card");
    root.append(card);

    const setup = el("div", "aw-rt-setup");
    card.append(setup);

    const match = el("div", "aw-rt-match");
    match.style.display = "none";
    card.append(match);

    // ===== MATCH CHROME (built once) ========================================
    // The engine's own topbar is hidden for this game (see the file header for
    // why), so this row is the whole status display: main clock · hearts ·
    // question bar · score.
    const top = el("div", "aw-rt-top");
    const mainClockEl = el("div", "aw-rt-mainclock", fmtClock(cfg.mainMs));
    const lastTagEl = el("div", "aw-rt-lasttag", "LAST WORD");   // Đợt 575
    const heartsEl = el("div", "aw-rt-hearts");
    const qbar = el("div", "aw-rt-qbar");
    const qfill = el("div", "aw-rt-qbar-fill");
    qbar.append(qfill);
    const scoreEl = el("div", "aw-rt-score", `${icons.check}<span>0</span>`);
    top.append(mainClockEl, lastTagEl, heartsEl, qbar, scoreEl);
    match.append(top);

    const board = el("div", "aw-rt-board");
    const prompt = el("div", "aw-rt-prompt");
    const promptName = el("div", "aw-rt-prompt-name");
    const promptNum = el("div", "aw-rt-prompt-num");
    prompt.append(promptName, promptNum);
    const tilesEl = el("div", "aw-rt-tiles");
    board.append(prompt, tilesEl);
    match.append(board);

    // The READY / 3-2-1 card. It sits OVER the board rather than replacing it so
    // the board never has to be rebuilt between questions. Đợt 117 (teacher's
    // request): the pupil's NAME is shown here too — top, big — with the
    // READY/3-2-1 status below it, so the class already knows who's up before
    // the number ever appears.
    const overlay = el("div", "aw-rt-overlay");
    const overlayName = el("div", "aw-rt-overlay-name");
    const overlayCount = el("div", "aw-rt-overlay-count");
    overlay.append(overlayName, overlayCount);
    overlay.style.display = "none";
    match.append(overlay);

    // ===== DELETE SET — anchored popover ====================================
    // Đợt 117 (11/8/2026, teacher's redesign, mirrors Running word's own
    // 11/8/2026 change): replaces the old full-width "DELETE SET" text button
    // + native confirm() with a small round icon pinned to the slot's own
    // top-right corner, opening a compact popover anchored under it (same
    // `positionPopover` shape Anagram's editor popovers use). isTempAct() is
    // still checked BEFORE the popover opens — a temporary `conv_` act gets a
    // toast instead, never a popover asking to confirm something that would
    // just fail after saveActivity is called.
    let delPopEl = null;
    function closeDeletePopover() {
      if (delPopEl) { delPopEl.remove(); delPopEl = null; }
      document.removeEventListener("pointerdown", onDeletePopOutside, true);
    }
    function onDeletePopOutside(e) {
      if (!delPopEl || delPopEl.contains(e.target)) return;
      closeDeletePopover();
    }
    function openDeletePopover(anchorBtn, i) {
      closeDeletePopover();
      const pop = el("div", "aw-rt-delpop");
      pop.append(el("div", "aw-rt-delpop-title", `Delete SET ${i + 1}?`));
      pop.append(el("div", "aw-rt-delpop-status",
        "The printed sheet for it will no longer match anything saved here."));
      const btnRow = el("div", "aw-rt-delpop-btns");
      const cancelBtn = el("button", "aw-btn", "Cancel");
      cancelBtn.type = "button";
      cancelBtn.onclick = () => closeDeletePopover();
      const goBtn = el("button", "aw-btn aw-ed-bulkdanger", "Delete");
      goBtn.type = "button";
      goBtn.onclick = () => { closeDeletePopover(); deleteSetNow(i); };
      btnRow.append(cancelBtn, goBtn);
      pop.append(btnRow);

      document.body.append(pop);
      const r = anchorBtn.getBoundingClientRect();
      pop.style.top = Math.min(r.bottom + 6, window.innerHeight - 40) + "px";
      pop.style.left = Math.max(8, Math.min(r.right - 210, window.innerWidth - 218)) + "px";
      delPopEl = pop;
      setTimeout(() => document.addEventListener("pointerdown", onDeletePopOutside, true), 0);
    }

    // ===== SETUP SCREEN =====================================================
    // ⭐⭐ Đợt 575 (thầy, 23/10/2026) — MÀN SETUP GỘP OPTIONS, cùng khuôn Running word (mẫu thầy duyệt:
    // D:\OTHERS\CLAUDE\AWord - thiet ke Running setup iPad\mau-1.html, tab ②):
    //   [✎] RUNNING TEAM [● iPad][iPad] · ô SET · LỚP + chip tên · 3 thanh (một hàng) · số liệu · lý do khoá · [APPLY] [START RUNNING]
    // Dải số liệu bỏ 3 ô lặp lại thanh kéo (round time / per question / lives).
    let draft = optsFromCfg(cfg);
    const optsDirty = () => JSON.stringify(optsFromCfg(readCfg(draft))) !== JSON.stringify(optsFromCfg(cfg));
    function applyOptions() {
      if (!optsDirty()) return;
      ui.sound.click?.();
      const patch = optsFromCfg(readCfg(draft));
      if (ui.host && ui.host.saveOptions) ui.host.saveOptions(patch);
      else { activity.options = activity.options || {}; Object.assign(activity.options, patch); }
      cfg = readCfg(activity.options || patch);
      draft = optsFromCfg(cfg);
      mainClockEl.textContent = fmtClock(cfg.mainMs);
      ui.toast?.("Options applied.");
      renderSetup();
    }

    // ----- iPad (Đợt 575): MỘT iPad chuyền tay — tên em được gọi + từ em đọc to -----
    const IPAD_KEY = "aw.runIpad.rt";
    let ipadOn = false;
    try { ipadOn = isTeacher && localStorage.getItem(IPAD_KEY) === "1"; } catch (e) { /* chế độ riêng tư */ }
    let padLive = false;
    let padT = false;   // Đợt 594 — có iPad GIÁO VIÊN đang xem (chấm tím, không chặn START)
    let hist = [];      // Đợt 594 — các từ đã chơi cho iPad giáo viên: { w, n (em), r: "o"|"x", vi }
    let link = null, ipadClaim = null, linkBusy = null, disposed = false, qSeq = 0;
    function startLink() {
      if (link || linkBusy) return linkBusy;
      linkBusy = (async () => {
        try {
          const [{ createRunHost }, { claimIpad }] = await Promise.all([import("../../core/run-link.js"), import("../../core/ipad-now.js")]);
          if (!ipadOn || disposed || link) return;
          link = createRunHost({ game: "runningteam", slots: 1, onPads: p => { padLive = !!p[0]; paintSetupGate(); }, onTeacher: v => { padT = v; paintSetupGate(); } });
          ipadClaim = claimIpad({ game: "runningteam", hold: true });
          publishLink(phase === "setup" ? { phase: "setup" } : {});
        } catch (e) {
          console.warn("AWord/running-team: iPad link", e);
          ui.toast?.("Could not link an iPad — are you signed in?");
        } finally { linkBusy = null; }
      })();
      return linkBusy;
    }
    function stopLink() {
      if (link) { link.stop(); link = null; }
      if (ipadClaim) { ipadClaim.release(); ipadClaim = null; }
      padLive = false;
      padT = false;
    }
    if (ipadOn) startLink();
    const nameAt = k => (roster.length ? roster[((k % roster.length) + roster.length) % roster.length].name || "" : "");
    // Đồng hồ tổng gửi kèm mỗi lượt + `ticking`; iPad tự đếm giữa hai lượt và tự đếm READY/3-2-1 (readyMs/stepMs).
    function publishLink(patch) {
      if (!link) return;
      const done = review.length;
      link.publish({
        mainLeft: Math.round(mainLeft), ticking: !!mainTimer, last: lastWord,
        lives: livesLeft === null ? null : livesLeft, livesTotal: cfg.lives === null ? null : cfg.lives,
        // Đợt 594 — cho iPad GIÁO VIÊN: điểm, bao nhiêu từ, 3 em kế tiếp, các từ đã chơi
        okN: correctCount, missN: Math.max(0, done - correctCount), done, total: order ? order.length : 0,
        nexts: roster.length ? [1, 2, 3].map(k => nameAt(turnPtr + k)) : [],
        cls: (current && current.className) || "",
        hist,
        ...patch
      });
    }

    function optSlider(label, sub, key, min, max, step, fmt, tone, offAt) {
      const cell = el("div", "aw-rt-oc");
      const lab = el("div", "aw-rt-oc-lab", escapeHtml(label));
      if (sub) lab.append(el("small", null, escapeHtml(sub)));
      cell.append(lab);
      const wrap = el("div", "aw-rt-oc-sl");
      wrap.style.setProperty("--tone", tone);
      const r = el("input");
      r.type = "range"; r.min = String(min); r.max = String(max); r.step = String(step);
      r.value = String(clampInt(draft[key], min, max, min));
      const out = el("output", "aw-rt-oc-val");
      const show = () => {
        const v = Number(r.value);
        out.textContent = fmt(v);
        out.classList.toggle("is-off", offAt !== undefined && v === offAt);
        wrap.style.setProperty("--p", ((v - min) / (max - min) * 100).toFixed(2) + "%");
      };
      r.oninput = () => { draft[key] = Number(r.value); show(); paintSetupGate(); };
      show();
      wrap.append(r, out);
      cell.append(wrap);
      return cell;
    }

    let setupGate = null;    // { apply, start, why, ipad } — repainted without rebuilding the screen
    function paintSetupGate() {
      if (!setupGate) return;
      const dirtyOpts = optsDirty();
      setupGate.apply.classList.toggle("is-dirty", dirtyOpts);
      setupGate.apply.disabled = !dirtyOpts;
      setupGate.apply.innerHTML = dirtyOpts ? "APPLY" : `${icons.check}<span>APPLIED</span>`;
      // ⭐ START RUNNING requires a picked class AND a saved SET (Đợt 117), the
      // options APPLIED and — iPad on — the iPad connected (Đợt 575).
      const reasons = [];
      if (!readyToStart()) reasons.push("Pick a class and deal a numbering first");
      else if (isTeacher && dirty) reasons.push("Save this SET first");
      if (dirtyOpts) reasons.push("Apply the options first");
      if (ipadOn && !padLive) reasons.push("Waiting for the iPad — or switch iPad off");
      setupGate.start.disabled = reasons.length > 0;
      setupGate.why.textContent = reasons.join(" · ");
      if (setupGate.ipad) {
        setupGate.ipad.box.classList.toggle("is-on", ipadOn);
        setupGate.ipad.btn.classList.toggle("is-on", ipadOn);
        setupGate.ipad.dot.classList.toggle("is-ok", padLive);
        setupGate.ipad.dot.classList.toggle("is-wait", !padLive);
        setupGate.ipad.dotT.classList.toggle("is-ok", padT);
      }
    }

    function renderSetup() {
      closeDeletePopover();   // a re-render replaces the anchor button under it
      setup.innerHTML = "";

      // -- header: [✎ edit] · title · [iPad] --
      const head = el("div", "aw-rt-setup-head");
      const left = el("div", "aw-rt-setup-left");
      if (ui.host && ui.host.canEdit && ui.host.canEdit()) {
        // Đợt 575 — không còn nút Options ⇒ mất cử chỉ nhấn giữ Options = Edit content (single mode) ⇒ nút sửa riêng.
        const ed = el("button", "aw-rt-editbtn", SVG_EDIT);
        ed.type = "button"; ed.title = "Edit content";
        ed.onclick = () => { ui.sound.click?.(); ui.host.edit(); };
        left.append(ed);
      }
      head.append(left, el("div", "aw-rt-setup-title", "RUNNING TEAM"));
      const ipadBox = el("div", "aw-rt-ipad");
      let ipadUI = null;
      if (isTeacher) {
        const dot = el("span", "aw-rt-ipad-dot", "<i></i>iPad");
        const btn = el("button", "aw-rt-ipad-btn", `${SVG_IPAD}<span>iPad</span>`);
        btn.type = "button";
        btn.title = "Show the pupil's name and word on one iPad passed around the class";
        btn.onclick = () => {
          ui.sound.click?.();
          ipadOn = !ipadOn;
          try { localStorage.setItem(IPAD_KEY, ipadOn ? "1" : "0"); } catch (e) { /* */ }
          if (ipadOn) startLink(); else stopLink();
          paintSetupGate();
        };
        // Đợt 594 — chấm iPad GIÁO VIÊN: không bắt buộc ⇒ chưa có thì xám, không nhấp nháy
        const dotT = el("span", "aw-rt-ipad-dot is-t", "<i></i>TEACHER");
        dotT.title = "Teacher iPad (optional)";
        ipadBox.append(dot, dotT, btn);
        ipadUI = { box: ipadBox, btn, dot, dotT };
      }
      head.append(ipadBox);
      setup.append(head);

      // -- saved set slots --
      // Đợt 117: Shuffle / Save / Print moved OFF the shared row below the
      // slots and INTO the slot they act on (icon-only, drawn only on the
      // slot that's actually `current` — mirrors Running word's 11/8/2026
      // redesign so both games read as one family). `isSel` alone (not
      // `isSel && !dirty` as before) decides which slot gets the action row —
      // an EMPTY slot that a fresh, unsaved deal is about to land in still
      // needs Shuffle/Save on it, not just a saved one.
      const slots = el("div", "aw-rt-slots");
      for (let i = 0; i < MAX_SETS; i++) {
        const saved = sets[i];
        const isSel = i === setIndex;
        const slot = el("div", "aw-rt-slot" + (isSel ? " is-sel" : "") + (saved ? "" : " is-empty"));
        slot.setAttribute("role", "button"); slot.tabIndex = 0;
        slot.append(el("div", "aw-rt-slot-num", `SET ${i + 1}`));
        if (saved) {
          const fits = setFitsPool(saved, pool);
          slot.append(el("div", "aw-rt-slot-main", escapeHtml(saved.className || "—")));
          slot.append(el("div", "aw-rt-slot-meta",
            fits ? `${saved.order.length} words · ${saved.studentNames.length} pupils`
                 : "word list changed"));
          if (!fits) slot.classList.add("is-stale");
        } else {
          slot.append(el("div", "aw-rt-slot-main", "—"));
          slot.append(el("div", "aw-rt-slot-meta", "empty"));
        }
        slot.onclick = () => {
          if (!sets[i]) return;                 // an empty slot is only a save target
          if (!setFitsPool(sets[i], pool)) return;
          ui.sound.click?.();
          setIndex = i;
          current = sets[i];
          rosterDraft = rosterOf(current).map(s => ({ ...s, present: true }));
          pickedClassId = current.classId || "";
          dirty = false;
          renderSetup();
        };

        // A saved slot can't be re-dealt until it is deleted — the sheets the
        // class is holding must never silently stop matching the game (the
        // same rule Running word settled on, 5/8/2026).
        if (saved && isTeacher) {
          const delBtn = el("button", "aw-rt-slot-delcorner", icons.trash);
          delBtn.type = "button";
          delBtn.title = `Delete SET ${i + 1}`;
          delBtn.onclick = e => {
            e.stopPropagation();
            if (isTempAct()) {
              ui.toast?.("This is a temporary activity — open the real one to edit its sets");
              return;
            }
            openDeletePopover(delBtn, i);
          };
          slot.append(delBtn);
        }

        if (isSel && isTeacher) {
          const acts = el("div", "aw-rt-slot-acts");

          const shuffleBtn = el("button", "aw-rt-slot-actbtn", SVG_SHUFFLE);
          shuffleBtn.type = "button";
          shuffleBtn.disabled = !canDeal() || (!!current && !dirty);
          shuffleBtn.title = (!!current && !dirty)
            ? "Delete this SET first to deal a new numbering."
            : "Shuffle a new numbering";
          shuffleBtn.onclick = () => {
            if (shuffleBtn.disabled) return;
            ui.sound.click?.();
            dealCurrent();
            renderSetup();
          };
          acts.append(shuffleBtn);

          // ⭐ Save gates BOTH Print and Start Running (teacher's request,
          // Đợt 117 — same reasoning Running word settled on the same day):
          // the printed sheet and the numbering the game actually deals can
          // now never drift apart, because both actions refuse to run on a
          // `dirty` (unsaved) split.
          const saveBtn = el("button", "aw-rt-slot-actbtn" + (dirty ? " is-dirty" : ""),
            dirty ? SVG_SAVE : icons.check);
          saveBtn.type = "button";
          saveBtn.disabled = !dirty || !current;
          saveBtn.title = dirty ? `Save as SET ${firstFreeSlot() + 1}` : (current ? `SET ${setIndex + 1} saved` : "Nothing to save");
          saveBtn.onclick = () => saveCurrentSet(saveBtn);
          acts.append(saveBtn);

          const printBtn = el("button", "aw-rt-slot-actbtn", icons.print);
          printBtn.type = "button";
          printBtn.disabled = !current || dirty;
          printBtn.title = dirty ? "Save this SET first to print it." : "Print word list";
          printBtn.onclick = () => {
            if (!current || dirty) return;
            ui.sound.click?.();
            printRunningTeamSheet(current.order, {
              title: activity.title || "Running team",
              className: current.className
            });
          };
          acts.append(printBtn);

          slot.append(acts);
        }

        slots.append(slot);
      }
      setup.append(slots);

      // -- class picker + roll review --
      if (isTeacher) setup.append(classBlock());

      // -- the three options, one row (Đợt 575) --
      const opts = el("div", "aw-rt-opts");
      opts.append(
        optSlider("Round time", "whole game", "mainSeconds", 30, 600, 5, v => fmtClock(v * 1000), "#3b82f6"),
        optSlider("Question time", "each word", "questionSeconds", 0, 30, 1, v => (v === 0 ? "Off" : v + "s"), "#3b82f6", 0),
        optSlider("Lives", "whole class", "lives", 0, MAX_LIVES, 1, v => (v === 0 ? "∞" : String(v)), "#16a34a", 0)
      );
      opts.children[1].title = "At Off a question never runs out on its own — a wrong tap still costs a life.";
      opts.children[2].title = "At ∞ nobody is ever knocked out — a wrong tap just lets the class try again.";
      setup.append(opts);

      // -- what is about to be played, in numbers --
      const present = rosterDraft.filter(s => s.present);
      const facts = el("div", "aw-rt-facts");
      facts.append(fact(String(pool.length), "words in pool"), fact(String(present.length), "pupils playing"));
      setup.append(facts);

      const why = el("div", "aw-rt-why");
      const acts = el("div", "aw-rt-acts");
      const apply = el("button", "aw-rt-apply");
      apply.type = "button";
      apply.onclick = applyOptions;
      const start = el("button", "aw-rt-start", "START RUNNING");
      start.type = "button";
      start.onclick = () => { if (!start.disabled) { ui.sound.click?.(); startRunning(); } };
      acts.append(apply, start);
      setup.append(why, acts);

      setupGate = { apply, start, why, ipad: ipadUI };
      paintSetupGate();
      publishLink({ phase: "setup" });

      function fact(big, small) {
        const f = el("div", "aw-rt-fact");
        f.append(el("div", "aw-rt-fact-big", escapeHtml(big)), el("div", "aw-rt-fact-small", escapeHtml(small)));
        return f;
      }
    }

    // The class chooser and the "who is here today" review, in one block.
    function classBlock() {
      const wrap = el("div", "aw-rt-classblock");
      const head = el("div", "aw-rt-classhead");
      head.append(el("div", "aw-rt-classlabel", "CLASS"));

      const sel = el("select", "aw-rt-classsel");
      if (classes === null) {
        const o = el("option", null, "Loading…"); o.value = ""; sel.append(o);
        sel.disabled = true;
      } else if (!classes.length) {
        const o = el("option", null, classError || "No classes — add one in Settings"); o.value = "";
        sel.append(o);
        sel.disabled = true;
      } else {
        const blank = el("option", null, "— pick a class —"); blank.value = "";
        sel.append(blank);
        classes.forEach(c => {
          const o = el("option", null, escapeHtml(c.name));
          o.value = c.id;
          if (c.id === pickedClassId) o.selected = true;
          sel.append(o);
        });
      }
      sel.onchange = () => {
        pickedClassId = sel.value;
        const c = (classes || []).find(x => x.id === pickedClassId);
        rosterDraft = c ? c.students.map(s => ({ ...s, present: true })) : [];
        // Picking a class always deals a fresh numbering: a set is a numbering
        // AND a roll, so a new roll is a new set.
        if (rosterDraft.length) dealCurrent();
        else { current = null; dirty = false; }
        renderSetup();
      };
      head.append(sel);
      wrap.append(head);

      if (rosterDraft.length) {
        const chips = el("div", "aw-rt-chips");
        rosterDraft.forEach(s => {
          const chip = el("button", "aw-rt-chip" + (s.present ? "" : " is-out"), escapeHtml(s.name));
          chip.type = "button";
          chip.onclick = () => {
            s.present = !s.present;
            chip.classList.toggle("is-out", !s.present);
            // The roll changed, so the saved pairing no longer describes this
            // round — mark it dirty so it can be saved (and re-printed) afresh.
            if (current) { current = makeSet(current.order, currentClassName(), pickedClassId, rosterDraft.filter(x => x.present)); dirty = true; }
            renderSetup();
          };
          chips.append(chip);
        });
        wrap.append(chips);
      }
      return wrap;
    }

    function currentClassName() {
      const c = (classes || []).find(x => x.id === pickedClassId);
      return c ? c.name : (current?.className || "");
    }
    function canDeal() { return rosterDraft.some(s => s.present); }
    function readyToStart() {
      return !!current && current.order.length >= MIN_POOL && current.studentNames.length > 0;
    }
    function firstFreeSlot() {
      const free = sets.findIndex(s => !s);
      return free === -1 ? setIndex : free;
    }
    function dealCurrent() {
      const present = rosterDraft.filter(s => s.present);
      current = makeSet(buildOrder(pool), currentClassName(), pickedClassId, present);
      setIndex = firstFreeSlot();
      dirty = true;
    }

    // Classes live in Firestore behind the teacher's sign-in. Loaded with a
    // DYNAMIC import on purpose: core/classes.js reaches the library layer, and
    // the core contract says the student page must never pull that in. A static
    // import here would drag it into play.html for every pupil.
    async function loadClasses() {
      if (!isTeacher) { classes = []; return; }
      try {
        const { listClasses } = await import("../../core/classes.js");
        classes = await listClasses();
      } catch (e) {
        classes = [];
        classError = e?.code === "aw/signed-out"
          ? "Sign in to use your classes"
          : "Could not load your classes";
      }
      if (phase === "setup") renderSetup();
    }

    // ⚠️ A TEMPORARY act (id "conv_...", `_converted:true`) must NEVER reach
    // saveActivity: core's rule is absolute, because saving one litters the
    // library with a phantom activity that has no home folder and no way back.
    // ⭐ Đợt 190 — but a conversion is now the NORMAL way into this game (MODE ›
    // RUNNING off a vocabulary act), so refusing outright would mean the printed
    // numbering could never be saved. `ui.saveTarget()` hands back the LIBRARY
    // act behind the play — itself when nothing was converted — so the set lands
    // on a real activity either way, and the check below still catches the case
    // where even that has never been saved.
    const saveHost = () => (ui.saveTarget && ui.saveTarget()) || activity;
    function isTempAct() {
      const h = saveHost();
      return h?._converted === true || String(h?.id || "").startsWith("conv_") || !h?.id;
    }
    // ⚠️ Written to BOTH objects: the host is what reaches Firestore, the copy on
    // screen is what `readSets(activity)` reads back to repaint the setup screen.
    async function persistSets(next) {
      const { saveActivity } = await import("../../core/store.js");
      const host = saveHost();
      host.content = host.content || {};
      host.content.gameSets = next;
      if (host !== activity) {
        activity.content = activity.content || {};
        activity.content.gameSets = next;
      }
      await saveActivity(host);
    }

    async function saveCurrentSet(btn) {
      if (!current) return;
      if (isTempAct()) {
        ui.toast?.("This is a temporary activity — save it to your library first");
        return;
      }
      btn.disabled = true;
      const label = btn.textContent;
      btn.textContent = "Saving…";
      try {
        const slot = firstFreeSlot();
        const next = new Array(MAX_SETS).fill(null);
        for (let i = 0; i < MAX_SETS; i++) next[i] = sets[i] || null;
        next[slot] = current;

        await persistSets(next);

        sets = readSets(activity);
        setIndex = slot;
        current = sets[slot];
        dirty = false;
        ui.toast?.(`Saved as SET ${slot + 1}`);
        renderSetup();
      } catch (e) {
        btn.disabled = false;
        btn.textContent = label;
        ui.toast?.(e?.code === "aw/signed-out" ? "Sign in to save a set" : "Could not save the set");
      }
    }

    // The confirmation itself now happens in the popover BEFORE this is ever
    // called (openDeletePopover, which also runs the isTempAct() check before
    // opening) — this function no longer asks anything, it just deletes.
    async function deleteSetNow(i) {
      try {
        const next = new Array(MAX_SETS).fill(null);
        for (let k = 0; k < MAX_SETS; k++) next[k] = sets[k] || null;
        next[i] = null;

        await persistSets(next);

        sets = readSets(activity);
        if (setIndex === i) {
          current = null; dirty = false;
          rosterDraft = rosterDraft.map(s => ({ ...s, present: true }));
        }
        ui.toast?.(`SET ${i + 1} deleted`);
        renderSetup();
      } catch (e) {
        ui.toast?.("Could not delete the set");
      }
    }

    // ===== THE ROUND ========================================================
    function startRunning() {
      order = current.order.slice();
      roster = shuffle(rosterOf(current));
      queue = shuffle(order.map((_, i) => i));
      livesLeft = cfg.lives;
      mainLeft = cfg.mainMs;
      correctCount = 0; askedCount = 0; turnPtr = 0;
      perQuestion.length = 0; review.length = 0; hist = [];
      tileColors = shuffle(PALETTE.slice()).slice(0, TILES);
      finished = false;
      lastWord = false;
      lastTagEl.classList.remove("is-on");
      mainClockEl.classList.remove("is-last");

      setup.style.display = "none";
      match.style.display = "";
      paintHearts();
      paintScore();
      paintMainClock();

      phase = "ready";
      startMainClock();
      goReady();   // publishes the first READY (with ticking:true) to the iPad
    }

    // The main clock runs from START RUNNING to the final whistle — it does NOT
    // pause for the READY card or the 3-2-1 (teacher's rule: it is the limit on
    // the whole round, not on the questions).
    function startMainClock() {
      stopMainClock();
      let last = performance.now();
      mainTimer = setInterval(() => {
        const now = performance.now();
        mainLeft -= (now - last);
        last = now;
        if (mainLeft <= 0) {
          mainLeft = 0;
          paintMainClock();
          onMainTimeUp();
          return;
        }
        paintMainClock();
      }, 200);
    }
    function stopMainClock() { if (mainTimer) { clearInterval(mainTimer); mainTimer = null; } }
    // ⭐ Đợt 575 — đồng hồ tổng về 0: không kết thúc NGAY nữa. Đang ở giữa một từ (READY/3-2-1 hoặc 6 ô đang hiện) ⇒ từ đó
    // chơi nốt; từ đã xong mà chưa sang em kế (khoảng nghỉ 0,9–1,4 s) ⇒ goReady() kế tiếp kết thúc luôn. Cả hai đường
    // đều đi qua goReady(), nên chỉ cần dựng cờ ở đây.
    function onMainTimeUp() {
      stopMainClock();
      if (lastWord || finished) return;
      lastWord = true;
      mainClockEl.classList.add("is-last");
      lastTagEl.classList.add("is-on");
      publishLink({});
    }

    // READY -> 3 -> 2 -> 1 -> the tiles. Every step is a plain timeout, and the
    // whole chain is registered in `timers` so cleanup() can cancel it mid-flight.
    // ⭐ Đợt 117: `turnPtr` already points at the NEXT pupil the instant this
    // runs (it's bumped right after the previous question resolves, before
    // goReady() is ever called — see onTile()/loseLife() below), so the name
    // shown through the whole READY/3-2-1 sequence is computed ONCE here and
    // is exactly who openQuestion() will call a moment later. No new state.
    function goReady() {
      if (finished) return;
      if (lastWord) { endGame(true, "timeup"); return; }   // Đợt 575 — từ cuối đã chơi xong
      if (!queue.length) { endGame(true, "cleared"); return; }
      phase = "ready";
      locked = true;
      stopQuestionClock();
      resetQBar();
      const who = roster.length ? roster[turnPtr % roster.length] : { name: "" };
      showOverlay(who.name || "", "READY", "is-ready");
      rtSound.ready();
      // Đợt 594 — `word`/`num`/`def` đã gửi từ lúc READY cho iPad GIÁO VIÊN thấy trước (từ kế = queue cuối, openQuestion pop ra);
      // iPad học sinh không vẽ `word` ở màn READY.
      const peekI = queue[queue.length - 1], peekW = order[peekI];
      publishLink({ phase: "ready", q: ++qSeq, name: who.name || "", next: nameAt(turnPtr + 1), readyMs: READY_HOLD_MS, stepMs: COUNT_STEP_MS, word: String(peekW), num: String(peekI + 1), def: defOf(peekW), result: "" });
      later(() => step(3), READY_HOLD_MS);

      function step(n) {
        if (finished) return;
        if (n === 0) { hideOverlay(); openQuestion(); return; }
        updateCount(String(n), "is-count");
        rtSound.count(n);
        later(() => step(n - 1), COUNT_STEP_MS);
      }
    }

    function openQuestion() {
      if (finished) return;
      phase = "question";
      qWordIndex = queue.pop();
      const word = order[qWordIndex];
      const who = roster.length ? roster[turnPtr % roster.length] : { name: "" };

      promptName.textContent = "";
      promptName.append(document.createTextNode(who.name || ""));
      promptNum.textContent = String(qWordIndex + 1);

      // Six tiles: the answer plus the five words in the pool that look most
      // like it (rt-sets.js), already shuffled.
      const tiles = buildTiles(word, pool);
      tilesEl.innerHTML = "";
      tiles.forEach((t, i) => {
        const b = el("button", "aw-rt-tile");
        b.type = "button";
        const col = tileColors[i % tileColors.length];
        b.style.setProperty("--tile", col.c);
        b.style.setProperty("--tile-dark", col.d);
        const span = el("span", "aw-rt-tile-text", escapeHtml(String(t).toUpperCase()));
        b.append(span);
        press(b, () => onTile(b, t, word));   // instant on touch-down — core/press.js
        tilesEl.append(b);
      });
      // Long entries (SKIN-SCRAPER, CIVILISATION) must not spill out of a tile.
      requestAnimationFrame(() => {
        tilesEl.querySelectorAll(".aw-rt-tile").forEach(b => {
          const span = b.querySelector(".aw-rt-tile-text");
          span.style.removeProperty("--rt-fit");
          fitOnce(b, span, s => span.style.setProperty("--rt-fit", s), { min: 0.42, contentBox: true });
        });
      });

      // ⭐ Đợt 117: the question fades/rises in rather than snapping into place
      // the instant the 3-2-1 overlay clears — restart the keyframe every
      // question the same way the overlay's own count does (remove, force a
      // reflow, re-add), since the class is `both`-filled and won't replay on
      // its own if just left on the element.
      board.classList.remove("is-entering");
      void board.offsetWidth;
      board.classList.add("is-entering");

      publishLink({ phase: "question", q: qSeq, name: who.name || "", next: nameAt(turnPtr + 1), num: String(qWordIndex + 1), word: String(word), def: defOf(word), result: "" });
      askedCount++;
      locked = false;
      lastQTick = null;
      qLeft = cfg.questionMs;
      startQuestionClock();
      rtSound.reveal();
    }

    function startQuestionClock() {
      stopQuestionClock();
      // Untimed (Question time = 0s, Đợt 109): no interval at all — the bar
      // stays exactly where resetQBar() left it (full) and onTimeUp() can never
      // fire. A wrong tap still costs a life; there is just no clock for it.
      if (cfg.questionMs <= 0) return;
      let last = performance.now();
      qTimer = setInterval(() => {
        const now = performance.now();
        qLeft -= (now - last);
        last = now;
        if (qLeft <= 0) { qLeft = 0; paintQBar(); onTimeUp(); return; }
        paintQBar();
        const whole = Math.ceil(qLeft / 1000);
        if (whole <= 5 && whole !== lastQTick) { lastQTick = whole; rtSound.tick(whole); }
      }, 100);
    }
    function stopQuestionClock() { if (qTimer) { clearInterval(qTimer); qTimer = null; } }

    // ----- Menu pause (Đợt 91, 8/8/2026) -----
    // Both clocks tick by DELTA (`now - last`, `last` reset every tick) rather
    // than counting down to an absolute deadline, so pausing is simply
    // stopping now / calling the same start*Clock() again on resume — a fresh
    // `last` is captured internally, so the paused duration is never
    // subtracted. Only restart whichever was ACTUALLY running (the question
    // clock is intentionally stopped during the READY/3-2-1 countdown; don't
    // resurrect it early).
    let pausedMainRunning = false, pausedQRunning = false;
    function pauseGame() {
      pausedMainRunning = !!mainTimer;
      pausedQRunning = !!qTimer;
      stopMainClock();
      stopQuestionClock();
      publishLink({});
    }
    function resumeGame() {
      if (finished) return;
      if (pausedMainRunning) startMainClock();
      if (pausedQRunning) startQuestionClock();
      pausedMainRunning = pausedQRunning = false;
      publishLink({});
    }
    rtPauseHandlers = { pause: pauseGame, resume: resumeGame };

    function onTile(btn, picked, answer) {
      if (locked || phase !== "question") return;
      if (String(picked).toUpperCase() === String(answer).toUpperCase()) {
        locked = true;
        stopQuestionClock();
        btn.classList.add("is-right");
        flyMark(btn, true);
        rtSound.correct();
        correctCount++;
        recordAnswer(true, picked, answer);
        publishLink({ result: "ok" });
        turnPtr++;                                   // the paper moves on
        paintScore();
        later(() => goReady(), 900);
        return;
      }

      // Wrong. With lives switched OFF (Unlimited) the class simply tries again:
      // the tile dims, the clock keeps running, nobody is knocked out.
      btn.classList.add("is-wrong");
      btn.disabled = true;
      flyMark(btn, false);
      rtSound.wrong();
      if (livesLeft === null) return;

      locked = true;
      stopQuestionClock();
      loseLife(picked, answer);
    }

    function onTimeUp() {
      if (phase !== "question" || locked) return;
      locked = true;
      stopQuestionClock();
      // Unlimited lives still has to move the lesson along, or an unanswered
      // question would sit there for ever.
      loseLife(null, order[qWordIndex]);
    }

    // A heart goes out (or, on Unlimited, just the question is lost). Either way
    // the correct tile is shown for a beat — that beat is the only chance the
    // class gets to LEARN the word they missed — and then the round moves on.
    function loseLife(picked, answer) {
      recordAnswer(false, picked, answer);
      if (livesLeft !== null) {
        livesLeft = Math.max(0, livesLeft - 1);
        paintHearts();
        rtSound.lifeLost();
      }
      publishLink({ result: "miss" });
      revealAnswer(answer);
      const dead = livesLeft === 0;
      later(() => {
        if (dead) endGame(false, "nolives");
        else { turnPtr++; goReady(); }
      }, dead ? 900 : 1400);
    }

    function revealAnswer(answer) {
      tilesEl.querySelectorAll(".aw-rt-tile").forEach(b => {
        const txt = b.querySelector(".aw-rt-tile-text")?.textContent || "";
        if (txt.toUpperCase() === String(answer).toUpperCase()) b.classList.add("is-answer");
        else b.classList.add("is-dimmed");
      });
    }

    function recordAnswer(correct, picked, answer) {
      perQuestion.push({ q: perQuestion.length, correct });
      const who = roster.length ? roster[turnPtr % roster.length].name : "";
      hist = hist.concat([{ w: String(answer).toUpperCase(), n: who || "", r: correct ? "o" : "x", vi: defOf(answer).vi }]);
      review.push({
        question: `${who} — ${qWordIndex + 1}`,
        answered: picked != null,
        yourText: picked == null ? "(time up)" : String(picked).toUpperCase(),
        yourCorrect: correct,
        correctText: String(answer).toUpperCase()
      });
    }

    // ===== END ==============================================================
    function endGame(won, reason) {
      if (finished) return;
      finished = true;
      phase = "over";
      locked = true;
      stopMainClock();
      stopQuestionClock();
      hideOverlay();

      rtEndData = {
        won, reason,
        correct: correctCount,
        asked: askedCount,
        total: order.length,
        mainLeft,
        className: current?.className || ""
      };
      if (won) rtSound.win(); else rtSound.lose();
      publishLink({ phase: "over", won: !!won });

      // `total` is what was actually ASKED, not the length of the sheet: a class
      // that wins on the final whistle after 14 questions scored 12/14, not
      // 12/85. The sheet length is reported separately in the panel.
      ui.finish({
        correct: correctCount,
        incorrect: Math.max(0, askedCount - correctCount),
        total: Math.max(1, askedCount),
        answered: askedCount,
        perQuestion: perQuestion.slice(),
        review: review.slice(),
        score: correctCount
      });
    }

    // ===== PAINTING =========================================================
    function paintMainClock() {
      mainClockEl.textContent = fmtClock(mainLeft);
      mainClockEl.classList.toggle("is-low", mainLeft <= 30000);
    }
    function paintQBar() {
      const frac = cfg.questionMs > 0 ? Math.max(0, Math.min(1, qLeft / cfg.questionMs)) : 0;
      qfill.style.width = (frac * 100).toFixed(2) + "%";
      qfill.classList.toggle("is-warning", frac <= 0.34);
    }
    function resetQBar() {
      qfill.style.width = "100%";
      qfill.classList.remove("is-warning");
    }
    function paintScore() {
      scoreEl.innerHTML = "";
      scoreEl.insertAdjacentHTML("beforeend", icons.check);
      scoreEl.append(el("span", null, String(correctCount)));
    }
    // 1..5 lives draw that many hearts; 6..10 collapse to "♥ xN" so the row
    // never overruns the clock (the same shape Find the match settled on).
    function paintHearts() {
      heartsEl.innerHTML = "";
      if (livesLeft === null) {
        heartsEl.append(el("span", "aw-rt-heart is-inf", "∞"));
        return;
      }
      const total = cfg.lives || 0;
      if (total > 5) {
        heartsEl.append(el("span", "aw-rt-heart", "♥"));
        heartsEl.append(el("span", "aw-rt-heartx", `×${livesLeft}`));
        return;
      }
      for (let i = 0; i < total; i++) {
        heartsEl.append(el("span", "aw-rt-heart" + (i < livesLeft ? "" : " is-out"), "♥"));
      }
    }

    // Đợt 117: split in two on purpose. showOverlay() runs ONCE per
    // ready-cycle (at READY) and is what fades the whole card in — calling it
    // again for every 3-2-1 tick would re-fade the backdrop each time and read
    // as four separate flashes instead of one held card. updateCount() moves
    // the countdown along underneath that same fade, touching only the number.
    function showOverlay(name, sub, cls) {
      overlay.className = "aw-rt-overlay " + (cls || "");
      overlay.style.display = "flex";
      overlayName.textContent = name;
      overlayCount.textContent = sub;
      void overlay.offsetWidth;                    // force layout before the class below can transition
      overlay.classList.add("is-visible");
    }
    function updateCount(sub, cls) {
      overlay.classList.remove("is-ready", "is-count");
      if (cls) overlay.classList.add(cls);
      overlayCount.textContent = sub;
      // Only the count pops — the text is centred by FLEX, not a transform, so
      // scaling it here is safe (the classic AWord trap is animating
      // `transform` on something POSITIONED by `transform:translate(-50%)`;
      // that isn't the case here).
      overlayCount.style.animation = "none";
      void overlayCount.offsetWidth;                // restart the keyframe
      overlayCount.style.animation = "";
    }
    // Fades OUT rather than vanishing (Đợt 117, "always use slow, smooth
    // animation for every transition") — `later()` stands in for a
    // `transitionend` listener because CSS transitions carry the exact same
    // hidden-tab risk the rest of this file already times out for.
    function hideOverlay() {
      overlay.classList.remove("is-visible");
      later(() => { overlay.style.display = "none"; }, OVERLAY_FADE_MS);
    }

    // A big ✓ / ✗ floating up off the tile. Reuses core's `.aw-mark-fly`, whose
    // keyframes already bake the -50% centring into every step.
    //
    // ⭐ Đợt 117: appended to `tilesEl`, NOT to `host` (the tile itself) — the
    // old version appended it as a child of the tile, but `.aw-rt-tile` sets
    // `overflow:hidden` (needed so a long word never spills past its own tile),
    // which was silently CLIPPING the mark the instant `aw-fly`'s keyframe
    // (translateY up to -170%) carried it past the tile's own edge — exactly
    // what read as the mark going "behind" the neighbouring tiles instead of
    // flying in front of them. Positioning it in pixels against `tilesEl`
    // (never clipped, `.aw-rt-tiles` is `position:relative` for this) and
    // appending it LAST — after all six tile buttons — also guarantees normal
    // paint order puts it on top of every one of them; the explicit z-index is
    // just insurance on top of that.
    function flyMark(host, ok) {
      const mark = el("div", "aw-mark-fly" + (ok ? "" : " is-cross"), ok ? icons.markCheck : icons.markCross);
      const hostRect = host.getBoundingClientRect();
      const parentRect = tilesEl.getBoundingClientRect();
      mark.style.left = (hostRect.left - parentRect.left + hostRect.width / 2) + "px";
      mark.style.top = (hostRect.top - parentRect.top + hostRect.height / 2) + "px";
      mark.style.width = (hostRect.width * 0.52) + "px";
      mark.style.zIndex = "5";
      tilesEl.append(mark);
      let done = false;
      const kill = () => { if (done) return; done = true; mark.remove(); };
      // `.is-cross` runs a longer 1.9s keyframe (see core/app.css) than the
      // plain 0.85s check — the old flat 1000ms timeout was cutting the cross
      // mark's own fade-out off mid-flight on every wrong answer.
      later(kill, ok ? 1000 : 2000);
    }

    // ===== WIRING ===========================================================
    // Number keys 1-6 pick a tile — the teacher usually has a keyboard within
    // reach and it is faster than crossing the room to the board.
    function onKey(e) {
      if (phase !== "question" || locked) return;
      const n = parseInt(e.key, 10);
      if (!Number.isFinite(n) || n < 1 || n > TILES) return;
      const btn = tilesEl.querySelectorAll(".aw-rt-tile")[n - 1];
      if (btn && !btn.disabled) btn.click();
    }
    window.addEventListener("keydown", onKey);

    ui.onSubmit?.(() => { if (!finished && phase !== "setup") endGame(false, "submitted"); });

    // The slogan rides the CENTRE of the bottom bar, on the Menu button's row,
    // in place of the engine's "x of N" label — the same placement Running word
    // settled on. Set once and never changed: questions advance on an answer, so
    // there is no counter to show and the arrows either side are hidden in CSS.
    ui.setNav?.({ index: 0, total: 0, onPrev: null, onNext: null, label: SLOGAN });

    renderSetup();
    loadClasses();

    return function cleanup() {
      disposed = true;
      stopLink();
      rtPauseHandlers = null;
      rtEndData = null;   // Đợt 114 — see running-word.js; module-level bridge must not outlive the mount
      window.removeEventListener("keydown", onKey);
      stopMainClock();
      stopQuestionClock();
      timers.forEach(clearTimeout);
      timers.clear();
      finished = true;
    };
  },

  // Menu pause hook (Đợt 91) — engine.js calls this on ☰ Menu open(true)/
  // close(false). See `rtPauseHandlers` above for why it's a module bridge.
  onPause(paused) {
    if (!rtPauseHandlers) return;
    if (paused) rtPauseHandlers.pause(); else rtPauseHandlers.resume();
  }
};

function reasonText(d) {
  if (d.reason === "timeup") return "The round timer ran out with hearts to spare.";
  if (d.reason === "cleared") return "Every word on the sheet was won.";
  if (d.reason === "nolives") return "The last life was lost.";
  if (d.reason === "submitted") return "The round was ended early.";
  return "";
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Copied — not imported — from running-word.js (Đợt 116's SET-slot redesign),
// same self-contained-template convention rt-sound.js already documents for
// copying rw-sound.js. Kept as raw SVG strings, exactly like core/icons.js.
// Đợt 575 — the setup screen's iPad and Edit buttons (same glyphs as running-word.js).
const SVG_IPAD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><rect x="5" y="2.5" width="14" height="19" rx="2.5"/><path d="M11 18.5h2"/></svg>';
const SVG_EDIT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
const SVG_SHUFFLE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>';
const SVG_SAVE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/></svg>';

registerTemplate(rtTemplate);
