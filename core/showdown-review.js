// =============================================================
// SHOWDOWN — THE "SHOW ANSWERS" SCREEN (Đợt 177, 17/8/2026)
//
// Split out of core/showdown.js, which had grown a whole screen inside a file
// whose job is the mode's RULES. That file stays pure data-in/data-out and is
// imported statically by the engine; this one owns DOM only, and is imported
// statically too — it must therefore stay just as clean of Firestore and of the
// library layer (core/HUONG DAN CORE.md, luật 2 of v0.9.0). Everything that
// touches the network arrives as the `loadTeams` callback the engine hands in.
//
// ---------------------------------------------------------------------------
// THE TITLE IS THE WHOLE CONTROL PANEL (teacher's design, 17/8/2026)
// ---------------------------------------------------------------------------
//   SHOWDOWN  A1C • TEAM 3            <- black · class · bullet · scope
//   └ the word SHOWDOWN is a button carrying TWO gestures:
//       tap        swap between THIS TEAM and THE WHOLE CLASS. "TEAM 3" folds
//                  back into "A1C" and the class's pupil count grows out of it
//                  ("A1C • 16 STS"), both halves turning green — green is
//                  always "this is what you are looking at".
//       double tap re-read the other teams from the shared table: a spinner
//                  beside the title, then "UPDATED" for a moment, then gone.
//   Which BOARD is showing (Table / Podium / List) is now three icon buttons
//   next to the title (⭐ Đợt 235, teacher: "đồng nhất thao tác" with Recent
//   Results' own trophy button) — a press-and-hold used to do this; a reading
//   screen with a hidden gesture on it is a gesture nobody ever finds.
//
// ⚠️ WHY A HAND-WRITTEN GESTURE RECOGNISER AND NOT `press()` / `onclick`
//   core/press.js fires at pointerDOWN, which is right for a game surface and
//   wrong here: a tap must not commit until we know it is not the first half of
//   a double tap, and a hold must not commit as a tap at all. And plain
//   `onclick`/`ondblclick` is what core/press.js's own header explains cannot be
//   trusted on the TOMKO infrared screen (a non-primary pointer never produces
//   `click`). So this listens to the pointer stream directly, captures the
//   pointer so a finger that slides off still reports its lift, and swallows the
//   compatibility `click` that follows.
//
// ⚠️ EVERY `element.animate()` NEEDS A TIMEOUT FALLBACK — the same rule as
//   core/showdown-setup.js. A backgrounded myActivity column freezes rAF, so
//   `onfinish` may never fire, and the scope word would be left collapsed at
//   `scaleX(0)`: an invisible title with no way back.
//
// ⚠️ `el(tag, cls, html)` sets **innerHTML** (core/utils.js). Pupil names, team
//   names, questions and answers are the teacher's/pupils' own words and go in
//   through `.textContent` ONLY; the html argument is used for icon markup and
//   for fmtRoundMs's digits, nothing else.
// =============================================================

import { el } from "./utils.js";
import { icons } from "./icons.js";
import { sound } from "./sound.js";
import { avatarNode } from "./avatar.js";
import {
  fmtRoundMs, pctBand, pctOf, shortenName, assignShortLabels, groupByMember, rankBlocks,
  mergeClassBlocks, buildAnalysisRows
} from "./showdown.js";

// Long enough that an ordinary tap never reaches it, short enough that the
// teacher does not think the screen has died. Measured against the same
// press-and-hold most phone keyboards use.
const HOLD_MS = 520;
// How long a first tap waits to see whether a second one is coming. Chromium's
// own dblclick window is ~500ms; that is far too long to leave a tap hanging on
// a projector, and nobody double-taps this slowly on purpose.
const TAP_MS = 250;
// A finger that travels this far was scrolling or missing, not pressing.
const MOVE_TOL = 14;
// How long "UPDATED" stays before it fades.
const DONE_MS = 1600;

// The funnel's ends, in % of the list's width (teacher: top box 80%, each one
// after it a little narrower). The bottom is a FLOOR, not a step size: with a
// step, a class of 20 would taper to nothing while a team of 4 would barely
// taper at all — the shape has to read the same either way.
// ⚠️ Đợt 197 — EXPORTED, because the Recent results miniature in
// core/showdown-setup.js draws the same taper at a tenth of the size. Two
// copies of these two numbers is two funnels of different shapes a month later.
export const POD_MAX_W = 80;
// ⭐ Đợt 217 — đáy phễu nới từ 46 lên 52 (thầy: *"giãn rộng hơn các ô ra một chút"*).
// Hàng cuối là hàng chật nhất mà vẫn phải đủ chỗ cho tên + huy hiệu đội + bốn con số;
// 6 điểm phần trăm ở đáy đủ để một tên dài thôi phải viết tắt, mà vẫn còn thấy rõ độ thuôn.
export const POD_MIN_W = 52;

// ⭐ Đợt 207 — HOW FAR A NAME MAY SHRINK before it is abbreviated instead
// (thầy: "không bao giờ để khuyết hiển thị thông tin, nếu tên quá dài và ô quá
// nhỏ, hãy linh hoạt chỉnh size tên nhỏ hơn"). A share of the size the row would
// otherwise use, not a fixed px: the whole board is drawn in `cqw`, so a floor in
// pixels would mean one thing in a myActivity column and another on the 86-inch
// board. Below this a name stops being readable from the back of the room, and
// abbreviating ("N.B.Anh") is the better trade — see shortenName in
// core/showdown.js.
const NAME_MIN_RATIO = 0.62;
// Each step of the shrink. 6% is small enough that the result never looks a size
// too small, and with the floor above it bottoms out in about eight passes.
const NAME_STEP = 0.94;
// ⭐⭐ Đợt 217 — SÀN CUỐI CÙNG, chỉ dùng SAU khi đã viết tắt mà vẫn không vừa.
// Thầy: *"để không bao giờ bị thiếu tên nữa"* — nên `NAME_MIN_RATIO` thôi làm hàng rào
// tuyệt đối: nó vẫn là mức đổi sang viết tắt, nhưng khi cả bản viết tắt cũng tràn thì
// **chữ nhỏ xíu vẫn hơn chữ bị cắt** — cắt là mất hẳn thông tin, nhỏ là vẫn đọc được khi
// lại gần. Thực tế đo ở đợt này chưa ca nào chạm tới đây; nó là lưới cuối.
const NAME_HARD_MIN_RATIO = 0.40;

/** Run `anim`, and guarantee `after()` happens even if onfinish never fires. */
function whenDone(anim, after, ms) {
  let done = false;
  const settle = () => {
    if (done) return;
    done = true;
    try { anim.cancel(); } catch { /* already gone */ }
    after();
  };
  anim.onfinish = settle;
  setTimeout(settle, ms);
}

/**
 * tap / double-tap / (optional) press-and-hold on one element. See the header
 * for why this is written by hand.
 * ⭐ Đợt 235 — `onHold` is now OPTIONAL: the title's third gesture (list ↔
 * podium) moved to the two icon buttons next to it (teacher's own call, for
 * the same vocabulary Recent Results' trophy button already used), so the
 * hold-timer simply never starts when a caller has nothing left for it to do.
 */
function gestures(node, { onTap, onDouble, onHold }) {
  if (!window.PointerEvent) {          // very old browser: one gesture is better than none
    node.addEventListener("click", () => onTap());
    return;
  }
  let holdTimer = null, tapTimer = null, held = false, downId = null, sx = 0, sy = 0;
  const clearHold = () => { if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; } };
  const clearTap = () => { if (tapTimer) { clearTimeout(tapTimer); tapTimer = null; } };

  node.addEventListener("pointerdown", e => {
    if (e.button !== 0) return;                     // right/middle is not a press
    downId = e.pointerId;
    held = false; sx = e.clientX; sy = e.clientY;
    // Capture, so a finger that slides off the word still reports its lift here.
    // Without it `pointerup` never arrives and the next tap is read as a double.
    try { node.setPointerCapture(e.pointerId); } catch { /* not capturable */ }
    clearHold();
    if (onHold) {
      holdTimer = setTimeout(() => {
        holdTimer = null; held = true;
        clearTap();                                 // a hold is never also a tap
        onHold();
      }, HOLD_MS);
    }
  });

  node.addEventListener("pointermove", e => {
    if (downId == null || e.pointerId !== downId) return;
    if (Math.abs(e.clientX - sx) > MOVE_TOL || Math.abs(e.clientY - sy) > MOVE_TOL) clearHold();
  });

  node.addEventListener("pointerup", e => {
    if (downId == null || e.pointerId !== downId) return;
    downId = null;
    clearHold();
    if (held) { held = false; return; }             // the hold already fired; the lift means nothing
    if (tapTimer) { clearTap(); onDouble(); return; }
    tapTimer = setTimeout(() => { tapTimer = null; onTap(); }, TAP_MS);
  });

  const cancel = () => { downId = null; held = false; clearHold(); };
  node.addEventListener("pointercancel", cancel);
  node.addEventListener("lostpointercapture", () => { downId = null; });

  // Hold-to-select would otherwise pop the touch context menu over the title.
  node.addEventListener("contextmenu", e => e.preventDefault());

  node.addEventListener("click", e => {
    // A trusted click with a detail count came from the pointer stream above,
    // which has already decided what the gesture was — swallow it.
    if (e.isTrusted && e.detail >= 1) { e.preventDefault(); e.stopPropagation(); return; }
    onTap();                                        // keyboard Enter/Space · programmatic .click()
  });
}

/**
 * Fill the Showdown "Show answers" screen and wire its title.
 *
 * @param {object} ctx
 *   head       the `.aw-rv-head` row (the title is inserted into it)
 *   before     insert the title nodes before this child (the close button)
 *   host       the `.aw-review` node the list/podium is drawn into
 *   pick       this browser's Showdown pick (team, class, members)
 *   review     this play's review rows, already stamped by core/showdown.js
 *   loadTeams  async () => { teams:[{teamId,teamName,at,students:[block]}],
 *                            otherActs:[{teamName,actName}] }
 *              every team that has SYNCED a result for this same act, this one
 *              included, plus the rows that were DROPPED because they belong to
 *              a different act (Đợt 196 — those used to vanish in silence).
 *              Supplied by the engine so this file never imports Firestore.
 *              May reject; the screen then SAYS so instead of pretending.
 *   watchTeams (optional) (onChange, onError) => unsubscribe — the same shape,
 *              pushed every time the shared row changes. This is what makes the
 *              four columns agree on their own; without it the screen falls back
 *              to the one-shot `loadTeams` and the double tap.
 *   flushPending (optional) async () => boolean — try again to share THIS
 *              column's own result if the whistle-time write did not land.
 *   isPending  (optional) () => boolean — true while this column still owes the
 *              shared row its result.
 *   actName    (optional, ⭐⭐ Đợt 244) the name of the act that was just played,
 *              already formatted by the engine's sdBoardName() — the SAME string
 *              the class ledger shows for this play ("LSA2-S2.T1.P3-4-5 / ENG1
 *              QUIZ"). It REPLACES the literal word "SHOWDOWN" in the title, and
 *              keeps every gesture that word carries. "" (the default) keeps the
 *              old word, so an act with no title never blanks the title.
 *   toast      the engine's toast
 *   savePicks  (optional, ⭐⭐⭐ Đợt 319) async (picks: Object<string,"l"|"r">)
 *              => boolean — write the Podium's team-split ticks to this play's
 *              own row in the class ledger. Handed in for the same reason
 *              loadTeams/watchTeams are: this file must stay free of
 *              Firestore. Omitted (the default) means the ticks stay exactly
 *              what they always were — "đánh dấu tạm", gone the moment the
 *              screen closes.
 *
 * Returns `dispose()` — MUST be called when the review leaves the screen, or the
 * Firestore listener outlives the panel (the same class of leak as the
 * ghost-clock of Đợt 131).
 */
export function mountShowdownReview({
  head, before, host, pick, review, loadTeams,
  watchTeams = null, flushPending = null, isPending = () => false, actName = "", toast = () => {},
  savePicks = null
}) {
  // THIS team, from memory. Authoritative: it is the play that just happened on
  // this screen, and it is what the class board shows for us even if the write
  // to the shared table failed.
  const teamBlocks = groupByMember(review, pick.members);

  // ⭐ Đợt 235 (teacher, 22/8/2026: "mặc định mở showdown ở sau game là hiện
  // cả lớp trước, bấm vào tên mới hiện 1 đội") — REVERSED from every earlier
  // đợt, which opened on this team and needed a tap to reach the class.
  let scope = "class";       // "team" | "class"
  // ⭐ Đợt 235 — three views now, not a boolean: "table" (the new per-question
  // column chart, teacher's own default), "podium" (the funnel), "list"
  // (every pupil's own answers). Set by the three icon buttons below, never
  // by the title's gestures any more.
  let view = "table";        // "table" | "podium" | "list"
  // ⚠️ Đợt 196 — `classBlocks` is set ONLY from a read that WORKED. It used to
  // be filled from the error path too ("give the class scope something to stand
  // on"), which meant one stumble pinned the class board to this team's own five
  // pupils for the rest of the review, with every later tap replaying the same
  // wrong answer and nothing on screen to say it was wrong. A screen that does
  // not know must say it does not know.
  let classBlocks = null;
  let classTeams = 0;        // how many TEAMS the board is standing on
  let otherActs = [];        // teams whose row belongs to a DIFFERENT act
  let classErr = "";         // why the class board is not there, in the teacher's words
  let busy = false;
  let doneTimer = null;
  let stopWatch = null;      // the live listener's unsubscribe

  // ---------------------------------------------------------------
  // TITLE
  // ---------------------------------------------------------------
  const title = el("div", "aw-rv-title is-sd");
  // ⭐⭐ Đợt 244 (thầy: "hiện tên act ngay cả trong bảng showdown khi bấm show
  // answers ở cuối game") — the act's own name stands where the literal word
  // "SHOWDOWN" used to, and keeps BOTH of that word's gestures. `.textContent`,
  // never innerHTML: this is the teacher's own text (`el()`'s 3rd argument sets
  // innerHTML — see this file's header).
  // ⚠️ The literal is still the fallback, on purpose: an act with no title at
  // all would otherwise leave a nameless button nobody can see to press.
  const boardName = String(actName || "").trim();
  const word = el("button", "aw-sd-ttl-word");
  word.type = "button";
  word.textContent = boardName || "SHOWDOWN";
  if (boardName) word.classList.add("is-act");
  word.title = (boardName ? boardName + " · " : "")
    + "Tap: this team / the whole class · Double tap: refresh";
  const clsEl = el("span", "aw-sd-ttl-class");
  clsEl.textContent = pick.className || "";         // teacher's own text
  const dot = el("span", "aw-sd-ttl-dot", "•");
  const scopeEl = el("span", "aw-sd-ttl-scope");
  const status = el("span", "aw-sd-ttl-status");
  // ⭐⭐ Đợt 196 — HOW MANY TEAMS THIS BOARD IS STANDING ON. The teacher read a
  // class board of 13 as "the class" because nothing on it could say a fourth
  // team was missing. A chip that reads "4 TEAMS" (green) or "3 TEAMS" (amber,
  // because a team is owed) turns an invisible bug into a number anybody can
  // check against the number of columns on the wall.
  const teamsEl = el("span", "aw-sd-ttl-teams");
  title.append(word);
  if (pick.className) title.append(clsEl);
  title.append(dot, scopeEl, teamsEl, status);

  const total = el("div", "aw-rv-sdtotal");
  head.insertBefore(title, before);
  head.insertBefore(total, before);

  // ⭐ Đợt 235 — Table / Podium / List, in that order (teacher's own call),
  // next to the title — the SAME three-icon vocabulary Recent Results'
  // openDetail now uses (core/showdown-setup.js), so a teacher who has
  // learned one screen already knows the other.
  const viewBtns = el("div", "aw-rv-viewbtns");
  const tableBtn = el("button", "aw-iconbtn aw-rv-viewbtn", icons.barChart);
  tableBtn.type = "button"; tableBtn.title = "Table";
  const podiumBtn = el("button", "aw-iconbtn aw-rv-viewbtn", icons.trophy);
  podiumBtn.type = "button"; podiumBtn.title = "Podium";
  const listBtn = el("button", "aw-iconbtn aw-rv-viewbtn", icons.assignment);
  listBtn.type = "button"; listBtn.title = "List";
  viewBtns.append(tableBtn, podiumBtn, listBtn);
  head.insertBefore(viewBtns, before);

  // ⭐ Đợt 235 (teacher: "thêm dòng ANDREW CLASSES mỏng, mờ... ở bên trên
  // cùng, căn giữa") — a sibling BEFORE the head row, not a child of it: `head`
  // is the title's own flex row (title left, buttons right), and a line meant
  // to sit ABOVE everything has no business sharing that row.
  const brand = el("div", "aw-rv-brand");
  brand.textContent = "ANDREW CLASSES";
  head.before(brand);

  function scopeText() {
    if (scope === "team") return String(pick.teamName || "Team");
    // ⚠️ Đợt 196 — a class board with no data is NOT "0 STS" and is certainly
    // not this team's own five: it is a board that has not arrived. Saying so is
    // the difference between the teacher waiting a second and the teacher
    // reading five pupils as the whole of A1B.
    if (!classBlocks) return classErr ? "NOT SYNCED" : "LOADING…";
    // The count is of pupils WITH A RESULT, not of the class register: teams
    // still playing simply are not on the board yet (teacher: "tổng số học
    // sinh là số hs đã có dữ liệu vì có thể có đội chưa xong").
    return `${classBlocks.length} STS`;
  }

  /** The little chip after the scope word: how many teams are on this board. */
  function paintTeamsChip() {
    const owed = !!isPending();
    if (scope !== "class" || !classBlocks) {
      // In team scope the only thing worth saying is "your own result has not
      // reached the others yet" — that is this column's problem to know about.
      teamsEl.textContent = owed ? "NOT SHARED" : "";
      teamsEl.className = "aw-sd-ttl-teams" + (owed ? " is-warn" : "");
      return;
    }
    teamsEl.textContent = `${classTeams} TEAM${classTeams === 1 ? "" : "S"}`;
    // Amber whenever the board is knowingly short: a team played a different
    // act, or this column has not managed to publish its own row.
    const short = owed || otherActs.length > 0;
    teamsEl.className = "aw-sd-ttl-teams" + (short ? " is-warn" : " is-on");
  }

  function paintTitle() {
    const txt = scopeText();
    // ⭐ Đợt 180 (teacher, 17/8/2026: "GAMESHOW A1A • A1A ⇒ GAMESHOW A1A") — say
    // the class's name ONCE. One-team mode names its team after the class
    // (applySolo in core/showdown-setup.js: with everybody in one team, "Team 1"
    // would tell nobody anything), so its team scope read "A1A • A1A" — a bullet
    // separating a word from itself.
    // ⚠️ Collapse on what is WRITTEN, not on `teamId === SOLO_TEAM_ID`: a
    // teacher who names a real team after the class deserves the same tidying,
    // and this file is deliberately free of the mode's ids.
    const norm = s => String(s || "").trim().toLowerCase();
    const twice = !!pick.className && norm(txt) === norm(pick.className);
    scopeEl.textContent = twice ? "" : txt;
    // `display` rather than removing the nodes: `swapScope()` animates `scopeEl`
    // by reference and clearStatus/paintTitle both keep writing to it, so it has
    // to stay in the tree. A `display:none` element simply animates nothing.
    dot.style.display = twice ? "none" : "";
    scopeEl.style.display = twice ? "none" : "";
    // Green marks WHAT IS ON SCREEN: the team in team scope, the class (name and
    // count together) in class scope — and, when the two have been folded into
    // one word, that word, whichever scope it is standing for.
    clsEl.classList.toggle("is-on", scope === "class" || twice);
    scopeEl.classList.toggle("is-on", true);
    // ⭐ Đợt 235 — the title's gold/sparkle only ever meant "the podium is up",
    // and stays tied to exactly that view now that it is a button, not a hold.
    title.classList.toggle("is-pod", view === "podium");
    paintTeamsChip();
    const b = blocks();
    const right = b.reduce((a, x) => a + x.right, 0);
    const asked = b.reduce((a, x) => a + x.total, 0);
    total.textContent = `${right}/${asked}`;
    // Đợt 244 — LAST: everything above can change how much room the row has
    // left for the act name (see fitTitleWord's own note).
    fitTitleWord();
  }

  /**
   * ⭐⭐ Đợt 244 (thầy: "cần hiển thị đầy đủ và không cắt và chỉ hiển thị 1 dòng")
   * — SHRINK THE ACT NAME UNTIL THE WHOLE OF IT FITS ONE LINE.
   *
   * An act name is as long as the teacher made it ("LSA2-S2.T1.P3-4-5 / ENG1
   * QUIZ") and shares its row with the class, the pupil count, the TEAMS chip,
   * three view buttons, the score and the close button. Three ways out of that
   * and only one is acceptable here: wrap (two lines — thầy said one), cut with
   * an ellipsis (loses the clue set and the template, the very thing Đợt 242 put
   * there), or shrink. Shrink.
   *
   * HOW, IN TWO STEPS — and BOTH numbers are measured by the browser, never
   * added up by hand:
   *   1. THE ROOM: pin the word to `flex: 1 1 0` for one synchronous moment. A
   *      zero-basis item that may grow takes exactly the space its siblings do
   *      not, so its own box IS the leftover — whatever siblings happen to exist
   *      at that instant (the loading spinner comes and goes; the TEAMS chip and
   *      the scope word change width every time the teacher taps the title).
   *      ⛔ An earlier cut summed the siblings and the gaps by hand and fitted
   *      against a room measured BEFORE the spinner appeared — 4px of the name
   *      hung off the end for the whole of the first three seconds.
   *   2. THE WANT: pin it to `flex: 0 0 auto`, so its box IS the width the text
   *      wants at that scale. Binary-search `--aw-ttl-fit` for the largest scale
   *      whose want still fits the room.
   *
   * ⛔⛔ DO NOT "SIMPLIFY" THIS BACK TO `scrollWidth > clientWidth`. That was the
   * first cut of this function and it converged on a size that was still 20px
   * too wide, at random. Two reasons, both measured:
   *   • while the word overflows, flexbox pins its `clientWidth` to the room, so
   *     the comparison is "want vs room" only by accident — and the instant it
   *     fits, `clientWidth` starts FOLLOWING the text instead, so the two sides
   *     of the test stop meaning two different things;
   *   • `letter-spacing` on this row is `0.2cqw` — a FIXED length, not `em`. The
   *     wanted width is therefore `glyphs × scale + 122px of spacing`, not a
   *     straight multiple of the scale, so a search that mis-measures once
   *     cannot correct itself on the next step.
   *
   * ⚠️ Only for `is-act`. The literal "SHOWDOWN" always fitted and must not
   * start moving about.
   * ⚠️ Runs at the END of paintTitle(): the scope word, the pupil count and the
   * TEAMS chip all change width as the teacher taps around, and each of those
   * changes how much room is left.
   * ⚠️ `busyFit` guards re-entry. Shrinking the word cannot change the title's
   * own width (`.aw-rv-title` is `flex: 1 1 auto` in a fixed row, so it always
   * takes exactly what the row does not), but a guard costs nothing and an
   * observer feeding itself costs a frozen column.
   */
  const FIT_MIN = 0.3;
  let busyFit = false;
  function fitTitleWord() {
    if (!boardName || busyFit) return;
    busyFit = true;
    const put = v => word.style.setProperty("--aw-ttl-fit", String(v));
    try {
      // --- 1. the room: let flexbox hand us the leftover and read it off ---
      put(FIT_MIN);
      word.style.flex = "1 1 0";
      const room = word.getBoundingClientRect().width;
      if (!(room > 1)) { put(1); return; }     // not laid out yet — leave it alone

      // --- 2. the want, with the word free of the row's squeeze ---
      word.style.flex = "0 0 auto";
      const wants = f => { put(f); return word.getBoundingClientRect().width; };
      let best = FIT_MIN;
      if (wants(1) <= room) best = 1;
      else {
        let lo = FIT_MIN, hi = 1;
        for (let i = 0; i < 14; i++) {
          const mid = (lo + hi) / 2;
          if (wants(mid) > room) hi = mid; else { best = mid; lo = mid; }
        }
      }
      word.style.flex = "";
      put(best);
    } finally {
      word.style.flex = "";
      busyFit = false;
    }
  }

  /**
   * ⭐ Đợt 244 — re-fit when the BOARD changes size: entering/leaving fullscreen,
   * a myActivity column being resized, the window itself.
   * ⚠️ Guarded on the measured width the same way the review grid's own observer
   * is (see `watchFit` further down, and the ghost-clock lesson of Đợt 112/131):
   * observe once, ignore a callback that reports the same width, and hand the
   * handle to dispose() so the review never leaves one running.
   */
  function watchTitleFit() {
    if (!boardName) return null;
    try {
      let lastW = 0;
      const ro = new ResizeObserver(() => {
        const w = Math.round(title.clientWidth || 0);
        if (!w || w === lastW) return;
        lastW = w;
        fitTitleWord();
      });
      ro.observe(title);
      return ro;
    } catch { return null; }   // không có ResizeObserver: lần fit đầu vẫn đứng
  }

  function paintViewBtns() {
    tableBtn.classList.toggle("is-on", view === "table");
    podiumBtn.classList.toggle("is-on", view === "podium");
    listBtn.classList.toggle("is-on", view === "list");
  }

  /**
   * The scope word folding into the class name and the new one growing back out
   * of it (teacher: "animation chạy thu gọn vào chữ A1C, tổng số học sinh được
   * đẩy ra từ chữ A1C"). `transform-origin:left` in app.css is what aims both
   * halves at the class name — the element sits immediately to its right.
   * ⚠️ It is a pure `scaleX`, so nothing around it moves and the row's layout is
   * the same before and after; only the ink shrinks.
   */
  function swapScope() {
    const outA = scopeEl.animate(
      [{ transform: "scaleX(1)", opacity: 1 }, { transform: "scaleX(0)", opacity: 0 }],
      { duration: 160, easing: "cubic-bezier(.4,0,1,1)", fill: "forwards" });
    whenDone(outA, () => {
      paintTitle();
      const inA = scopeEl.animate(
        [{ transform: "scaleX(0)", opacity: 0 }, { transform: "scaleX(1)", opacity: 1 }],
        { duration: 230, easing: "cubic-bezier(.22,.9,.3,1)", fill: "forwards" });
      whenDone(inA, () => { scopeEl.style.transform = ""; scopeEl.style.opacity = ""; }, 340);
    }, 260);
  }

  // ⚠️ Đợt 244 — ALL THREE REFIT THE ACT NAME. The status chip is the ONE thing
  // on this row that changes width without going through paintTitle(): the
  // spinner appears the instant the screen opens, "UPDATED" replaces it, then
  // both go. Each of those steals or returns ~28px from the name beside it, and
  // a name fitted to the room BEFORE the spinner arrived hangs 4px off the end
  // for the whole of the three-second load. Measured, not imagined.
  function showSpinner() {
    if (doneTimer) { clearTimeout(doneTimer); doneTimer = null; }
    status.className = "aw-sd-ttl-status is-spin";
    status.innerHTML = icons.spinner;               // trusted markup from core/icons.js
    fitTitleWord();
  }
  function showUpdated() {
    status.className = "aw-sd-ttl-status is-done";
    status.textContent = "UPDATED";
    fitTitleWord();
    doneTimer = setTimeout(() => {
      const a = status.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 420, fill: "forwards" });
      whenDone(a, clearStatus, 560);
    }, DONE_MS);
  }
  function clearStatus() {
    if (doneTimer) { clearTimeout(doneTimer); doneTimer = null; }
    status.className = "aw-sd-ttl-status";
    status.textContent = "";
    status.style.opacity = "";
    fitTitleWord();
  }

  // ---------------------------------------------------------------
  // THE DATA ON SCREEN
  // ---------------------------------------------------------------
  function blocks() {
    if (scope === "team") return teamBlocks;
    // ⚠️ Đợt 196 — `|| teamBlocks` used to live here, and it is the quietest of
    // the three bugs this đợt is about: with the read still in flight (or
    // skipped because `busy`), the class board drew this team's own pupils under
    // the class's name and its own title counted them as the class. The class
    // scope now shows the class or nothing at all; `paintBody` puts a line on
    // screen saying which.
    return classBlocks || [];
  }

  /**
   * Merge what the other teams synced with what this browser has in memory.
   * ⚠️ OUR OWN team always comes from memory, never from the table, even though
   * we wrote it there a moment ago: the write is fire-and-forget and may have
   * failed (signed out, offline, slow), and a screen must never show a team a
   * worse result than the one it just watched happen.
   */
  function buildClass(entries) {
    // ⭐ Đợt 197 — the dedupe itself moved to core/showdown.js's mergeClassBlocks
    // so the durable Recently results board can obey the SAME rule (see its
    // header for what the rule is and why). This function's job is now only to
    // say WHICH groups go in, and which one of them is authoritative.
    const groups = [{ teamName: pick.teamName || "", at: undefined, blocks: teamBlocks }];
    (entries || []).forEach(entry => {
      if (!entry || entry.teamId === pick.teamId) return;
      groups.push({ teamName: entry.teamName || "", at: Number(entry.at) || 0, blocks: entry.students || [] });
    });
    return mergeClassBlocks(groups);
  }


  /**
   * Take one reading of the shared row — from the one-shot read OR from the live
   * listener; both hand over the same shape, and there is deliberately only one
   * place that turns it into what is on screen.
   * Returns true when the team COUNT changed, which is what "UPDATED" is for.
   */
  function applyData(data) {
    const entries = (data && data.teams) || [];
    otherActs = (data && data.otherActs) || [];
    classErr = "";
    classBlocks = buildClass(entries);
    // Our own team is always on the board (from memory), whether or not our row
    // ever reached the shared table — so count it once and the others by id.
    const before = classTeams;
    classTeams = 1 + entries.filter(t => t && t.teamId !== pick.teamId).length;
    return classTeams !== before;
  }

  /** Re-read the shared table. Returns true if the class list was rebuilt. */
  async function refresh() {
    if (busy) return false;
    busy = true;
    showSpinner();
    try {
      applyData(await loadTeams());
      return true;
    } catch (e) {
      console.warn("AWord: could not read the other teams", e);
      // ⚠️ Đợt 196 — the class list is deliberately LEFT ALONE (null on the first
      // failure, and the last good one on a later failure). Filling it with our
      // own team here is what made a broken board look like a finished one.
      classErr = e?.code === "aw/signed-out"
        ? "Sign in to see the other teams."
        : "Could not reach the other teams.";
      toast(classErr);
      return false;
    } finally {
      busy = false;
    }
  }

  /**
   * ⭐⭐⭐ Đợt 196 — WATCH, don't ask once.
   * The listener runs for as long as the review is open, whichever scope is
   * showing: a teacher looking at the team board when the last column finishes
   * should find the class board already complete when they tap across.
   * The one-shot `loadTeams` is still there as the fallback for a browser where
   * the listener cannot start.
   */
  function startWatching() {
    if (!watchTeams) return;
    stopWatch = watchTeams(
      data => {
        const changed = applyData(data);
        // Only shout when something actually arrived — a snapshot echo of our
        // own write must not flash "UPDATED" in the teacher's face.
        if (changed && !busy) showUpdated();
        retryOwnPublish();          // the network is clearly alive again
        paintTitle();
        paintBody();
      },
      e => {
        console.warn("AWord: lost sight of the other teams", e);
        // A listener that dies leaves whatever it last delivered on screen; the
        // double tap (and the retry below) are still there.
        if (!classBlocks) classErr = "Could not reach the other teams.";
        paintTitle();
        paintBody();
      }
    );
  }

  /**
   * Try again to hand over THIS column's own result. Runs when the review opens
   * and on every change the listener brings, so a write that failed at the
   * whistle lands the moment anything works again — the teacher does nothing.
   */
  function retryOwnPublish() {
    if (!flushPending || !isPending()) return;
    Promise.resolve(flushPending())
      .then(() => { paintTitle(); paintBody(); })
      .catch(() => { /* still owed; the next change will try again */ });
  }

  // ---------------------------------------------------------------
  // THE TWO GESTURES + THE THREE VIEW BUTTONS
  // ---------------------------------------------------------------
  gestures(word, {
    onTap: async () => {
      sound.click();
      if (scope === "team") {
        // First trip to the class board has to fetch it. The spinner is the same
        // one the double tap shows, for the same reason: the teacher must see
        // that something is happening before the numbers change.
        if (!classBlocks) { await refresh(); clearStatus(); }
        scope = "class";
      } else {
        scope = "team";
      }
      swapScope();
      paintBody();
    },
    onDouble: async () => {
      sound.tick();
      const ok = await refresh();
      if (ok) showUpdated(); else clearStatus();
      paintTitle();
      paintBody();
    }
  });

  function setView(v) {
    if (view === v) return;
    // A rising two-note lift for going UP onto the podium, the reverse coming
    // back DOWN off it — the same vocabulary core/showdown-setup.js uses;
    // switching between the other two views just gets the plain tick every
    // other button on this screen uses.
    if (v === "podium") {
      sound.glide({ freq: 660, freqEnd: 1180, dur: 240, gain: 0.08, type: "triangle" });
    } else if (view === "podium") {
      sound.glide({ freq: 1000, freqEnd: 620, dur: 200, gain: 0.06, type: "triangle" });
      // ⭐⭐⭐ Đợt 319 — LEAVING the podium is one of the teacher's three named
      // checkpoints ("chuyển sang nút hiển thị khác").
      commitPicks();
    } else {
      sound.tick();
    }
    view = v;
    paintViewBtns();
    paintTitle();
    paintBody();
  }
  tableBtn.onclick = () => setView("table");
  podiumBtn.onclick = () => setView("podium");
  listBtn.onclick = () => setView("list");

  // ---------------------------------------------------------------
  // THE LIST — every pupil, their questions under their name
  // ---------------------------------------------------------------
  const renderList = ranked => renderReviewList(ranked, { showTeam: scope === "class" });

  // ---------------------------------------------------------------
  // THE PODIUM — the ranking as a funnel (teacher's design, 17/8/2026)
  // ---------------------------------------------------------------
  // One column, every box the same HEIGHT and each a little narrower than the
  // one above, so the board tapers to a point: first place is the widest thing
  // on screen and the eye runs straight down the taper. The rank number sits
  // OUTSIDE each box on its left, which is what turns the narrowing edges into a
  // visible diagonal instead of a ragged stack.
  // ⭐ Đợt 207 — the tick marks live HERE, in the review's own closure, not
  // inside the render. The board is rebuilt on every scope switch and on every
  // arrival from the live listener, so a Map owned by the renderer would throw
  // the teacher's team-split away the moment another column finished.
  // ⭐⭐⭐ Đợt 319 — no longer only "đánh dấu tạm": `commitPicks()` below can now
  // write it out, but ONLY at a handful of checkpoints (see its own note), so
  // the Map staying right here — surviving a scope switch, a listener arrival,
  // every repaint — is still exactly what makes that possible.
  const picks = new Map();
  let picksDirty = false;      // something changed since the last save
  const renderPodium = ranked => renderReviewPodium(ranked, {
    showTeam: scope === "class", picks, onChange: () => { picksDirty = true; },
    className: pick.className || ""          // ⭐ Đợt 448 — tìm ảnh avatar theo lớp
  });

  /**
   * ⭐⭐⭐ Đợt 319 (thầy: "bắt đầu lưu khi đóng bảng podium, bấm esc hoặc chuyển
   * sang nút hiển thị khác... nếu đang trong quá trình tích chọn thì chưa lưu
   * vội") — WRITE THE TICKS OUT, but only when THIS is called: a checkpoint, not
   * every tap. Called from setView() (leaving "podium"), from the fullscreen
   * Esc handler, and from dispose() — never from inside renderReviewPodium's
   * own tick handler, which only ever flips `picksDirty` (see `onChange` above).
   * ⚠️ `picksDirty` guards against writing on EVERY checkpoint regardless of
   * whether anything happened — a teacher who only ever looked at Podium and
   * ticked nothing must not spend a write clearing a row that was already
   * empty.
   */
  function commitPicks() {
    if (!picksDirty || !savePicks) return;
    picksDirty = false;
    const obj = {};
    picks.forEach((v, k) => { obj[k] = v; });
    try { Promise.resolve(savePicks(obj)).catch(() => { /* best-effort, see savePicks' own note */ }); }
    catch { /* synchronous throw from a hand-rolled savePicks — still best-effort */ }
  }

  // ---------------------------------------------------------------
  // ⭐⭐ Đợt 207 — FULLSCREEN (thầy: "nút fullscreen ở góc dưới bên trái hộp
  // hiển thị này… để tôi có không gian phân tích cho học sinh")
  // ---------------------------------------------------------------
  // ⚠️ THE TARGET IS THE REVIEW BOX, not `root` — which is the opposite of the
  // app's own fullscreen rule (Đợt 12: "nhắm vào root, KHÔNG phải page"). That
  // rule exists so a game keeps its toolbar and its chrome; here the whole point
  // is to be rid of them and leave one board on the wall.
  // ⚠️ app.css puts `container-type` ON `.aw-review` because of this: every size
  // on this screen is `cqw`, i.e. a share of the nearest container, and that
  // container used to be `.aw-stage` — which does NOT grow when a descendant
  // goes fullscreen. Without that line the board would fill the wall and keep
  // drawing itself at 900px-wide sizes.
  // ⚠️ In myActivity's multi-column view a fullscreen request fills THAT COLUMN
  // and nothing more (a WebContentsView cannot take over the screen). Said to
  // thầy before building; nothing here can change it.
  // ⭐ Đợt 208 (thầy) — "nút này sẽ giống hệt nút fullscreen trong một act ở chế
  // độ đơn": it now wears the app's own `.aw-iconbtn` (4cqw, 2.4cqw icon, no
  // plate, no border), and `.aw-sd-fsbtn` is left holding NOTHING but the corner
  // it stands in. Two buttons that do the same job should not look like two
  // different buttons.
  const fsBtn = el("button", "aw-iconbtn aw-sd-fsbtn", icons.fullscreen);   // trusted markup
  fsBtn.type = "button";
  fsBtn.title = "Fullscreen";
  fsBtn.onclick = async () => {
    sound.click();
    try {
      if (document.fullscreenElement === host) await document.exitFullscreen();
      else await host.requestFullscreen();
    } catch (e) {
      console.warn("AWord: fullscreen refused", e);
      toast("Fullscreen is not available here.");
    }
  };
  host.append(fsBtn);
  // ⚠️ Listen to the EVENT, never assume the click worked: Esc, the browser's
  // own chrome and myActivity can all drop out of fullscreen without us. And
  // re-fit the names on every change — the box just changed width, which is the
  // one thing the name sizes are measured against.
  const onFsChange = () => {
    const on = document.fullscreenElement === host;
    host.classList.toggle("is-fs", on);
    fsBtn.classList.toggle("is-on", on);
    fsBtn.title = on ? "Leave fullscreen" : "Fullscreen";
    // ⭐⭐⭐ Đợt 319 — LEAVING fullscreen is how "bấm esc" actually reaches this
    // screen (there is no Escape listener of this file's own — the browser's
    // native "Esc exits fullscreen" is what fires this event). Whichever view
    // was up when that happened, commit it: a teacher who ticks names on the
    // funnel and then hits Esc must not lose the split just because the
    // podium never technically "closed".
    if (!on) commitPicks();
    fitPodiumNames(host);
  };
  document.addEventListener("fullscreenchange", onFsChange);

  // ---------------------------------------------------------------
  // ⭐⭐ Đợt 196 — THE BOARD SAYS WHAT IT IS MISSING
  // ---------------------------------------------------------------
  // Every silent drop this đợt found now has a line of its own. One sentence
  // each, in the plainest words: the teacher must be able to read it from the
  // back of the room and know whether the board in front of them is the class.
  function warnings() {
    const lines = [];
    if (isPending()) {
      lines.push("This team's result has not reached the other boards yet — still trying.");
    }
    if (scope === "class") {
      if (!classBlocks) {
        lines.push(classErr
          ? `${classErr} Tap twice on SHOWDOWN to try again.`
          : "Reading the other teams…");
      } else if (otherActs.length) {
        // THE two-way disappearance the whole đợt started from: a column on a
        // different act (a duplicate act, a column opened by hand) used to be
        // invisible to the others and blind to them, with no symptom at all.
        const who = otherActs.map(o => o.teamName).filter(Boolean).join(", ");
        lines.push(`${otherActs.length} team${otherActs.length === 1 ? "" : "s"} played a DIFFERENT act`
          + `${who ? ` (${who})` : ""} — not counted on this board.`);
      }
    }
    return lines;
  }

  function paintBody() {
    // ⚠️ Đợt 207 — `.aw-sd-podwrap` joined this list. The podium's root is now a
    // wrapper holding the scroller AND the two tick counters; removing only
    // `.aw-sd-pod` would leave an empty wrapper (and a pair of stale counts)
    // behind on every repaint. ⭐ Đợt 235 — `.aw-rv-tablewrap` joined it too.
    // ⭐ Đợt 448 (thầy: "cột thẻ tên vẫn giữ ở vị trí đó") — bảng này được DỰNG LẠI mỗi khi một đội
    // gửi kết quả về (listener) ⇒ cột thẻ từng nhảy về đầu giữa lúc thầy đang chia đội. Nhớ vị trí
    // cuộn của cột cũ, trả lại cho cột mới ngay sau khi gắn.
    const oldPod = host.querySelector(".aw-sd-pod");
    const keepTop = oldPod ? oldPod.scrollTop : 0;
    host.querySelectorAll(".aw-sd-rv, .aw-sd-podwrap, .aw-sd-warn, .aw-rv-tablewrap").forEach(n => n.remove());
    const lines = warnings();
    if (lines.length) {
      const box = el("div", "aw-sd-warn");
      lines.forEach(t => {
        const row = el("div", "aw-sd-warn-line");
        row.append(el("span", "aw-sd-warn-icon", icons.alert || "!"));
        const txt = el("span", "aw-sd-warn-text");
        txt.textContent = t;                      // may carry the teacher's team names
        row.append(txt);
        box.append(row);
      });
      host.append(box);
    }
    const ranked = rankBlocks(blocks());
    if (view === "table") {
      host.append(renderReviewTable(ranked, pick.className || "Showdown"));
    } else if (view === "podium") {
      host.append(renderPodium(ranked));
      const newPod = host.querySelector(".aw-sd-pod");
      if (newPod && keepTop) newPod.scrollTop = keepTop;
      // ⚠️ AFTER the append, never before: fitPodiumNames measures, and a board
      // that is not in the document has no width to measure against.
      fitPodiumNames(host);
    } else {
      host.append(renderList(ranked));
    }
  }

  let disposed = false;

  /**
   * ⭐ Đợt 235 — the default scope is CLASS now (see `scope` above), so the
   * very first thing on screen has always needed the shared table. That used
   * to be deferred until the teacher's first tap into class; now it runs at
   * mount instead, behind a floor of at least 3s (teacher's own words: "tránh
   * thiếu dữ liệu") — a Firestore write from a browser that finished a beat
   * late can still be in flight the instant this screen opens, and a board
   * that stops "loading" the moment ITS OWN read lands can show a class as
   * complete a half-second before the last column's row actually arrives.
   * `startWatching()`'s listener may well deliver a snapshot and repaint
   * everything DURING this floor — that is fine, this promise only decides
   * when the spinner goes away, never what gets drawn.
   */
  async function initialLoad() {
    const floor = new Promise(r => setTimeout(r, 3000));
    await Promise.all([refresh(), floor]);
    if (disposed) return;
    clearStatus();
    paintTitle();
    paintBody();
  }

  paintViewBtns();
  paintTitle();
  paintBody();
  // Đợt 244 — after the first paintTitle(), so the word already carries its text.
  const titleRO = watchTitleFit();
  startWatching();
  retryOwnPublish();
  initialLoad();

  /**
   * ⚠️ MUST be called when the review closes. A Firestore listener left running
   * behind a screen that is gone is the same bug as Đợt 131's ghost clock: it
   * costs nothing visible and keeps costing it for the rest of the lesson.
   */
  return function dispose() {
    disposed = true;
    // ⭐⭐⭐ Đợt 319 — CLOSING THE WHOLE SCREEN is the third named checkpoint
    // ("đóng bảng podium"). `onFsChange` will not fire in time for this (the
    // listener is removed below, before exitFullscreen() runs), so this is the
    // one place that has to call it directly.
    commitPicks();
    if (stopWatch) { try { stopWatch(); } catch { /* already gone */ } stopWatch = null; }
    if (doneTimer) { clearTimeout(doneTimer); doneTimer = null; }
    // ⭐ Đợt 207 — the same rule as the listener above, applied to the two things
    // fullscreen leaves behind: a document-level listener outliving the screen
    // that made it (ghost-clock, Đợt 131), and a browser still in fullscreen on
    // a board that no longer exists — which would leave the teacher looking at
    // an empty white wall with no way back but Esc.
    document.removeEventListener("fullscreenchange", onFsChange);
    // Đợt 244 — and the title's own resize observer, same rule again.
    if (titleRO) { try { titleRO.disconnect(); } catch { /* already gone */ } }
    if (document.fullscreenElement === host) {
      try { document.exitFullscreen(); } catch { /* the browser will drop it with the node */ }
    }
  };
}


// =============================================================
// ⭐⭐ Đợt 197 — THE TWO BOARDS, LIFTED OUT OF THE CLOSURE.
//
// They were written inside mountShowdownReview() and read its `scope` variable
// directly. There is now a SECOND screen that has to draw the very same two
// boards — Recently results, in core/showdown-setup.js's panel — and drawing a
// class board two different ways is how two screens start disagreeing about
// what a class board is.
//
// So the only thing they took from the closure, `scope === "class"`, is now the
// stated `showTeam` option: whether each row carries its team's name. On a team
// board every line would carry the same word and the title already says it.
//
// ⚠️ Still DOM-only and still free of Firestore and of the library layer — this
// file is imported statically by the engine (see the header, luật 2 of v0.9.0),
// and the history screen imports it, never the other way round.
// =============================================================

/**
 * ⭐ Đợt 235 — THE TABLE: the single-match twin of core/showdown-export.js's
 * multi-match ANALYSIS chart (teacher: "thêm 1 dạng show/file xuất nữa là
 * dạng bảng có các cột như trong ANALYSIS png... vào trong các bảng đơn nữa
 * của 1 buổi"), now the DEFAULT view both here and in Recent Results'
 * `openDetail` (core/showdown-setup.js).
 *
 * Returns its wrapper SYNCHRONOUSLY, like `renderReviewList`/
 * `renderReviewPodium` — `paintBody()` just appends whatever this returns and
 * never awaits it — then fills the wrapper in once the drawing code (lazy,
 * dynamic-imported the same way `openDetail`'s own DOWNLOAD button already
 * loads that module) has actually run. `buildAnalysisRows` itself is pure and
 * already imported from core/showdown.js — only the CANVAS PAINTING lives in
 * the lazy-loaded sibling, so that is the only part fetched on demand.
 */
export function renderReviewTable(ranked, titleText, opts = {}) {
  const wrap = el("div", "aw-rv-tablewrap");
  const note = el("div", "aw-sd-rec-note", "Building the table…");
  wrap.append(note);
  const entries = [{ matchId: "current", label: titleText, at: Date.now(), blocks: ranked }];
  const { full, partial } = buildAnalysisRows(entries);
  import("./showdown-export.js").then(mod => {
    if (!wrap.isConnected) return;             // the teacher already left/switched view
    // Đợt 237 (thầy: "bảng Table 1 lớp mờ") — this canvas is then stretched to
    // `width:100%` of whatever container holds it, which for a small team (a
    // narrow, naturally-sized board) can be several times its own pixel width
    // once the detail view goes fullscreen: `scale=1` drew it at exactly its
    // CSS size with nothing to spare, so that stretch upscaled a low-res
    // bitmap. A higher floor (the multi-match PNG download already uses 2,
    // see analysisPngBlob below) plus the screen's own devicePixelRatio keeps
    // it crisp through that stretch without a second render pass.
    const tableScale = Math.max(2, window.devicePixelRatio || 1);
    // ⭐ Đợt 238 (thầy) — `variant:"view"` strips the top brand/RESULTS label/
    // title and the bottom legend (all redundant with this screen's own header
    // and single-act nature), draws a small "ANDREW CLASSES" at the bottom
    // instead — see drawAnalysisCanvas's own note in core/showdown-export.js.
    // ⭐ Đợt 240 — `opts.classify` (the classify bar's last-Applied/saved
    // `{hi,lo}`, or null) recolours the columns; the caller (openTileDetail,
    // core/showdown-home.js) just calls this again on every Apply — a full
    // repaint is cheap enough here that a second, targeted recolour path
    // was not worth building for the single-match case.
    const { canvas } = mod.drawAnalysisCanvas(full, partial, entries, titleText, tableScale, { variant: "view", classify: opts.classify || null });
    wrap.innerHTML = "";
    canvas.style.cssText = "width:100%;height:auto;display:block;";
    wrap.append(canvas);
  }).catch(e => {
    console.warn("AWord: could not build the table view", e);
    note.textContent = "Could not build the table.";
  });
  return wrap;
}

/** Every pupil, their questions under their name. */
export function renderReviewList(ranked, { showTeam = false } = {}) {
  const list = el("div", "aw-sd-rv");
  ranked.forEach(b => {
    const block = el("div", "aw-sd-rv-block");

    const who = el("span", "aw-sd-rv-who");
    who.textContent = b.name;
    const bhead = el("div", "aw-sd-rv-name");
    bhead.append(who);
    // Whose team, on the class board only — on a team board every line would
    // carry the same word and it is already in the title.
    if (showTeam && b.teamName) {
      const tag = el("span", "aw-sd-rv-team");
      tag.textContent = b.teamName;
      bhead.append(tag);
    }

    const tally = el("span", "aw-sd-rv-tally");
    // ⭐ Đợt 174 — this pupil's TOTAL time, when the round clock was running.
    // ⭐⭐ Đợt 207 — the reading order is now the one thầy wrote out: "5 ✓ 5 ✗
    // 50%". The percentage moved to the END, AFTER the two tallies it is the sum
    // of, and it is drawn for EVERY pupil (see pctOf in core/showdown.js — it is
    // out of every question dealt now, so a pupil who never answered reads a
    // plain red 0% instead of showing nothing at all).
    // ⚠️ The time is the only optional half left, so the "-" that used to join it
    // to the percentage went with it: the two are no longer neighbours.
    if (b.hasTime) tally.append(el("span", "aw-sd-rv-time", fmtRoundMs(b.ms)));
    tally.append(
      el("span", "is-ok", `${icons.check} ${b.right}`),
      el("span", "is-bad", `${icons.cross} ${b.wrong}`)
    );
    const pct = pctOf(b);
    if (pct !== null) tally.append(el("span", "aw-sd-rv-pct " + pctBand(pct), pct + "%"));
    bhead.append(tally);
    block.append(bhead);

    b.rows.forEach(r => {
      const line = el("div", "aw-sd-rv-q");
      line.append(el("span", "aw-sd-rv-num", String(r.n)));
      const body = el("div", "aw-sd-rv-body");
      const clue = el("div", "aw-sd-rv-clue");
      clue.textContent = r.question;
      body.append(clue);
      const ans = el("div", "aw-sd-rv-ans");
      if (r.correct) {
        ans.append(mark("is-ok", icons.check, r.correctText));
      } else {
        // Wrong (or never attempted) shows BOTH lines: what the pupil put,
        // then what it should have been — same reading order as the normal
        // review.
        ans.append(mark("is-bad", icons.cross, r.answered ? r.yourText : "No answer"));
        ans.append(mark("is-ok", icons.check, r.correctText));
      }
      body.append(ans);
      line.append(body);
      // ⭐ Đợt 174c — how long THIS question took, at the FAR RIGHT of the row,
      // past the answer blocks. A third flex child of the row, NOT a third grid
      // track of `.aw-sd-rv-body`: that 1.4fr/1fr split is measured for
      // clue-vs-answers and must not move, and a row with no time simply
      // leaves this column empty.
      line.append(el("span", "aw-sd-rv-qtime", r.roundMs != null ? fmtRoundMs(r.roundMs) : ""));
      block.append(line);
    });

    list.append(block);
  });
  return list;
}

/**
 * THE PODIUM — the ranking as a funnel (teacher's design, 17/8/2026).
 * One column, every box the same HEIGHT and each a little narrower than the one
 * above, so the board tapers to a point.
 *
 * ⭐⭐⭐⭐ Đợt 448 (3/10/2026) — "BÓNG AVATAR", dựng lại theo mẫu thầy chốt
 * (`D:\OTHERS\CLAUDE\AWord - thiet ke Showdown Podium\podium-v2.html`). THAY HẲN cách chia
 * đội của Đợt 319/323/324 (cột TÊN hai bên + hàng đã tích trượt xuống dưới vạch đứt, nền xanh):
 *   • Mỗi thẻ có AVATAR TRÒN (core/avatar.js — kho ảnh myLesson, thiếu ảnh thì chữ tắt).
 *   • Tích một bên ⇒ cả dải thẻ CO TRÒN vào quả avatar (clip-path) ⇒ quả bóng nảy + bắn
 *     sparkle vàng ⇒ bay vòng cung về cột bóng bên đó. Hàng khép lại TẠI CHỖ — không dồn
 *     xuống cuối, không dải xanh, cột thẻ KHÔNG chạy về đầu.
 *   • Cột bóng: dọc, cả cụm căn giữa theo chiều cao, so le trái/phải, bóng chọn SAU nằm TRÊN
 *     và ĐÈ lên bóng chọn trước; mỗi bóng lơ lửng nhịp riêng (CSS thuần — cột nền đóng băng rAF).
 *   • Kéo bóng: thả vào vùng thẻ ⇒ bỏ chọn (bóng bay về đúng hạng, nở lại thành thẻ) · thả
 *     trong cột ⇒ đổi chỗ · thả sang cột kia ⇒ chuyển đội (cột kia LUÔN nhận, không xét luật
 *     chênh 1 — thầy: "cột bóng đội bên kia vẫn nhận"), bóng GIỮ MÀU đội đã chọn em lần đầu.
 *   • Chọn quá người (cú TÍCH làm hai bên chênh > 1) ⇒ chỉ thẻ lắc + buzz.
 *   • Mũi tên nhấp nháy trên/dưới cột thẻ khi còn thẻ khuất ở phía đó.
 *
 * `picks` (Map key → "l"|"r") GIỮ NGUYÊN hình dạng — setMatchPicks/commitPicks của người gọi không
 * đổi một dòng. Thứ tự bóng trong cột + màu đội gốc sống ở `podState` (WeakMap theo chính Map
 * `picks` của người gọi), nên sống qua mọi lần vẽ lại bảng (đổi scope, listener về) mà không ai
 * phải truyền thêm gì. ⚠️ Hai thứ này KHÔNG được lưu Firestore: mở lại trận cũ thì bóng xếp theo
 * thứ tự khoá và màu = cột đang đứng (đã nói với thầy).
 *
 * @param {object} opts
 *   picks     Map của NGƯỜI GỌI (bỏ trống ⇒ không có chấm tích, không cột bóng — bản thu nhỏ/xem trước).
 *   onChange  gọi sau mỗi lần Map đổi thật (tích, bỏ chọn, chuyển đội) — người gọi tự quyết khi nào lưu.
 *   className mã lớp ("NNTNG4") — để tìm ảnh avatar; "" ⇒ chỉ chữ tắt.
 */
// ⭐ Đợt 448b — `pop` nay chỉ là độ dài chùm sparkle (bóng không còn chờ nó mới bay).
const PT = { shrink: 230, pop: 340, flyOut: 640, collapse: 280, flyBack: 480, rowOpen: 240, grow: 200 };
const podState = new WeakMap();

/** Thứ tự cột bóng + màu gốc của một Map `picks`, khớp lại với nội dung Map hiện tại. */
function podStateFor(picks) {
  let st = podState.get(picks);
  if (!st) { st = { cols: { l: [], r: [] }, origin: new Map() }; podState.set(picks, st); }
  ["l", "r"].forEach(s => { st.cols[s] = st.cols[s].filter(k => picks.get(k) === s); });
  picks.forEach((side, k) => {
    if (side !== "l" && side !== "r") return;
    if (!st.cols[side].includes(k)) st.cols[side].push(k);
    if (!st.origin.has(k)) st.origin.set(k, side);
  });
  [...st.origin.keys()].forEach(k => { if (!picks.has(k)) st.origin.delete(k); });
  return st;
}

// ⭐ Đợt 219 — KHOÁ CỦA MỘT LẦN TÍCH, và nó KHÔNG được là `b.key` trần: Recent results đọc
// `key` ra khỏi SỔ CÁI, nơi trận cũ thiếu trường đó cho ra chuỗi RỖNG cho MỌI em. Bậc lùi lấy
// đúng luật `mergeClassBlocks` (core/showdown.js) — tên viết thường.
function podKey(b, i) {
  return String(b.key || "").trim() || String(b.name || "").trim().toLowerCase() || `#${i}`;
}

/** Cột số liệu của một trận: đúng/tổng · % · thời gian (Đợt 323/324, giữ nguyên). */
function singleStats(b) {
  const stats = el("div", "aw-sd-pod-stats");
  const pct = pctOf(b);
  const band = pct !== null ? pctBand(pct) : "";
  stats.append(el("span", "aw-sd-pod-score",
    `<span class="is-right ${band}">${b.right}</span><span class="is-total">/${b.total}</span>`));
  if (pct !== null) stats.append(el("span", "aw-sd-pod-pct " + band, pct + "%"));
  if (b.hasTime) stats.append(el("span", "aw-sd-pod-time", fmtRoundMs(b.ms)));
  return stats;
}

/** Cột số liệu của Analysis: một viên % mỗi trận (vắng = viên gạch đứt) + % trung bình. */
function analysisStats(r, entries) {
  const stats = el("div", "aw-sd-pod-stats");
  const chips = el("span", "aw-sd-pod-chips");
  (r.segments || []).forEach((s, i) => {
    const c = s.pct == null
      ? el("span", "aw-sd-pod-chip is-miss", "–")
      : el("span", "aw-sd-pod-chip " + pctBand(s.pct), String(s.pct));
    const e = entries[i];
    if (e && e.label) c.title = String(e.label);          // teacher's own text — title attr, never markup
    chips.append(c);
  });
  const avg = Math.round(Number(r.total) || 0);
  stats.append(chips, el("span", "aw-sd-pod-pct " + pctBand(avg), avg + "%"));
  return stats;
}

export function renderReviewPodium(ranked, { picks = null, onChange = null, className = "" } = {}) {
  const items = (ranked || []).map((b, i) => ({ key: podKey(b, i), name: b.name, stats: () => singleStats(b) }));
  return buildPodium(items, { picks, onChange, className });
}

/**
 * ⭐⭐⭐⭐ Đợt 448 — PODIUM CHO ANALYSIS (thầy: "Phần analyzing cũng có phần cột và chọn thành viên
 * như thế"). Xếp theo % TRUNG BÌNH trên các trận em có mặt (buildAnalysisRows' `total`), em vắng
 * vài trận (`partial`) đứng chung bảng, viên trận vắng vẽ gạch đứt.
 */
export function renderAnalysisPodium({ full = [], partial = [], entries = [] } = {}, { picks = null, onChange = null, className = "" } = {}) {
  const rows = full.concat(partial).sort((a, b) => b.total - a.total);
  const items = rows.map((r, i) => ({ key: podKey(r, i), name: r.name, stats: () => analysisStats(r, entries) }));
  return buildPodium(items, { picks, onChange, className });
}

function buildPodium(items, { picks, onChange, className }) {
  const wrap = el("div", "aw-sd-podwrap");
  const podcol = el("div", "aw-sd-podcol");
  const box = el("div", "aw-sd-pod");
  const arrUp = el("button", "aw-sd-pod-arrow is-up", `<span>${icons.chevronUp || "▲"}</span>`);
  const arrDn = el("button", "aw-sd-pod-arrow is-down", `<span>${icons.chevronDown || "▼"}</span>`);
  arrUp.type = arrDn.type = "button";
  arrUp.title = "More above"; arrDn.title = "More below";
  podcol.append(box, el("i", "aw-sd-pod-fade is-up"), el("i", "aw-sd-pod-fade is-down"), arrUp, arrDn);
  const sides = picks ? { l: el("div", "aw-sd-pod-side is-l"), r: el("div", "aw-sd-pod-side is-r") } : null;
  const fly = el("div", "aw-sd-pod-fly");
  if (sides) wrap.append(sides.l);
  wrap.append(podcol);
  if (sides) wrap.append(sides.r);
  wrap.append(fly);

  const st = picks ? podStateFor(picks) : null;
  const labels = assignShortLabels(items.map(x => x.name));
  const rows = new Map();          // key → { row, card, av, it, label, i }
  const balls = new Map();         // key → ball node
  const alive = () => wrap.isConnected;

  // ---------------- thẻ ----------------
  items.forEach((it, i) => {
    const row = el("div", "aw-sd-pod-row");
    const card = el("div", "aw-sd-pod-box" + (i < 3 ? ` is-m${i + 1}` : ""));
    const left = el("div", "aw-sd-pod-who");
    const badge = el("span", "aw-sd-pod-badge" + (i < 3 ? " is-medal" : ""));
    if (i < 3) badge.innerHTML = icons[`medal${i + 1}`];   // trusted markup, core/icons.js
    else badge.textContent = String(i + 1);
    const av = avatarNode(className, it.name, "aw-av aw-sd-pod-av");
    const nmWrap = el("span", "aw-sd-pod-nm");
    const nm = el("span", "aw-sd-pod-name" + (i < 3 ? " is-top" : ""));
    nm.textContent = labels[i];                             // pupil's own name: textContent only
    nm.dataset.full = labels[i];                            // fitPodiumNames needs the original back
    nm.title = it.name;
    nmWrap.append(nm);
    if (i < 3) {
      // ⭐ Đợt 208 — sparkles on the NAME, CSS only (a backgrounded column freezes rAF).
      const spark = el("span", "aw-sd-pod-spark");
      spark.setAttribute("aria-hidden", "true");
      for (let s = 0; s < 6; s++) spark.append(el("i", "aw-sd-pod-star s" + s));
      nmWrap.append(spark);
    }
    left.append(badge, av, nmWrap);
    card.append(left, it.stats());
    const dup = rows.has(it.key);   // hai hàng chung khoá (Đợt 219) — hàng sau không cho tích
    if (picks && !dup) {
      // ⭐ Đợt 208 — A DOT, NOT A BOX; the button keeps its full 4.8cqw hit area.
      const tick = side => {
        const t = el("button", "aw-sd-pod-tick is-" + side);
        t.type = "button";
        t.title = side === "l" ? "Left team" : "Right team";
        t.append(el("i", "aw-sd-pod-dot"));
        t.onclick = e => { e.stopPropagation(); pickFromRow(it.key, side); };
        return t;
      };
      row.append(tick("l"), card, tick("r"));
    } else {
      row.append(card);
    }
    box.append(row);
    if (!dup) rows.set(it.key, { row, card, av, it, label: labels[i], i });
  });

  // ---------------- độ thuôn phễu: tính trên các thẻ CÒN trong cột ----------------
  function retaper(instant) {
    const list = [...rows.values()].filter(r => !(picks && picks.has(r.it.key))).sort((a, b) => a.i - b.i);
    const m = list.length;
    list.forEach((r, j) => {
      const w = m > 1 ? POD_MAX_W - (POD_MAX_W - POD_MIN_W) * (j / (m - 1)) : POD_MAX_W;
      if (instant) r.card.classList.add("no-tr");
      r.row.style.setProperty("--w", w.toFixed(2) + "%");
      // ⭐⭐⭐ Đợt 323 — the stats shrink with the box so a narrow row never clips them.
      r.row.style.setProperty("--sc", (w / POD_MAX_W).toFixed(3));
      if (instant) { void r.card.offsetWidth; r.card.classList.remove("no-tr"); }
    });
  }

  // ---------------- mũi tên "còn người ở trên/dưới" ----------------
  function paintArrows() {
    if (!alive()) return;
    const max = box.scrollHeight - box.clientHeight;
    podcol.classList.toggle("more-up", box.scrollTop > 4);
    podcol.classList.toggle("more-down", box.scrollTop < max - 4);
  }
  box.addEventListener("scroll", paintArrows, { passive: true });
  arrUp.onclick = () => box.scrollBy({ top: -box.clientHeight * .6, behavior: "smooth" });
  arrDn.onclick = () => box.scrollBy({ top: box.clientHeight * .6, behavior: "smooth" });

  // Đặt lại khi khung đổi cỡ (fullscreen, cột myActivity kéo hẹp) — và tự tắt khi bảng bị thay.
  let ro = null;
  try {
    ro = new ResizeObserver(() => {
      if (!alive()) { ro.disconnect(); return; }
      layoutSides(true);
      paintArrows();
    });
    ro.observe(wrap);
  } catch { /* không có ResizeObserver: lượt đặt đầu tiên vẫn đứng */ }
  // Lần đầu: chờ bảng vào trang (người gọi append SAU khi hàm này trả về).
  setTimeout(() => { if (alive()) { layoutSides(true); paintArrows(); } }, 0);

  retaper(true);
  if (!picks) return wrap;

  // ================= phần CHIA ĐỘI (chỉ khi có `picks`) =================
  const teamCls = side => side === "l" ? "is-tl" : "is-tr";

  function addBall(key, side, hidden) {
    const r = rows.get(key);
    const ball = el("div", "aw-sd-ball no-tr " + teamCls(st.origin.get(key) || side) + (hidden ? " is-hidden" : ""));
    const inner = el("div", "aw-sd-ball-in");
    // Mỗi bóng lơ lửng theo nhịp riêng ⇒ cả cột không bao giờ nhún cùng lúc.
    const rnd = (a, b) => a + Math.random() * (b - a);
    inner.style.setProperty("--bd", rnd(3.6, 5.6).toFixed(2) + "s");
    inner.style.setProperty("--bdl", (-rnd(0, 5)).toFixed(2) + "s");
    ["--x1", "--x2", "--x3"].forEach(k => inner.style.setProperty(k, rnd(-6, 6).toFixed(1) + "%"));
    ["--y1", "--y2", "--y3"].forEach(k => inner.style.setProperty(k, rnd(-7, 7).toFixed(1) + "%"));
    inner.style.setProperty("--r1", rnd(-6, 6).toFixed(1) + "deg");
    inner.style.setProperty("--r3", rnd(-6, 6).toFixed(1) + "deg");
    inner.append(avatarNode(className, r.it.name, "aw-av"));
    const cap = el("span", "aw-sd-ball-cap");
    cap.textContent = r.label;                              // pupil's own name: textContent only
    inner.append(cap);
    ball.append(inner);
    ball.title = r.it.name;
    sides[side].append(ball);
    balls.set(key, ball);
    wireDrag(ball, key);
    return ball;
  }

  /** Hình học một cột n bóng: cỡ tự co cho vừa, bước = 80% cỡ (bóng đè nhau), căn giữa, so le. */
  function colGeom(side, n) {
    const col = sides[side];
    const W = col.clientWidth, H = col.clientHeight;
    const maxS = W * .5;
    const K = .8;
    const size = Math.max(8, n > 1 ? Math.min(maxS, (H * .92) / (1 + (n - 1) * K)) : maxS);
    const step = size * K;
    const y0 = (H - (size + step * (n - 1))) / 2;
    const zig = size * .2 * (side === "l" ? 1 : -1);
    return { size, step, y0, x: i => (W - size) / 2 + (n > 1 ? (i % 2 ? zig : -zig) : 0), y: i => y0 + step * i };
  }

  /**
   * Đặt bóng vào cột. `preview` = { side, key, index } khi đang kéo: bóng `key` rút khỏi mọi
   * cột, cột `side` chừa ô trống ở `index`. Bóng TRÊN đè bóng DƯỚI (z-index giảm dần).
   */
  function layoutSides(instant, preview) {
    if (!alive()) return;
    ["l", "r"].forEach(side => {
      let keys = st.cols[side].filter(k => rows.has(k));
      if (preview) {
        keys = keys.filter(k => k !== preview.key);
        if (preview.side === side) keys.splice(preview.index, 0, null);
      }
      const n = keys.length;
      if (!n) return;
      const g = colGeom(side, n);
      keys.forEach((k, i) => {
        if (k == null) return;
        const b = balls.get(k);
        if (!b || b.classList.contains("is-drag")) return;
        if (instant) b.classList.add("no-tr");
        b.style.width = b.style.height = g.size + "px";
        b.style.setProperty("--bs", g.size + "px");
        b.style.left = g.x(i) + "px";
        b.style.top = g.y(i) + "px";
        b.style.zIndex = String(10 + n - i);
        if (instant) void b.offsetWidth;
      });
    });
    setTimeout(() => balls.forEach(b => b.classList.remove("no-tr")), 40);
  }

  /** Ô đích tính từ style — bóng có thể đang trượt dở, getBoundingClientRect sẽ nói dối. */
  function ballTarget(ball) {
    const s = ball.parentElement.getBoundingClientRect();
    const w = parseFloat(ball.style.width) || 40;
    return { left: s.left + (parseFloat(ball.style.left) || 0), top: s.top + (parseFloat(ball.style.top) || 0), width: w, height: w };
  }
  function slotAt(side, key, clientY) {
    const m = st.cols[side].filter(k => k !== key && rows.has(k)).length;
    const g = colGeom(side, m + 1);
    const i = Math.round((clientY - sides[side].getBoundingClientRect().top - g.y0 - g.size / 2) / g.step);
    return Math.max(0, Math.min(m, i));
  }

  // ---------------- lớp phủ: bóng bay + sparkle ----------------
  function relRect(r) { const w = wrap.getBoundingClientRect(); return { x: r.left - w.left, y: r.top - w.top, w: r.width, h: r.height }; }
  function makeFlyBall(key, teamSide, rect) {
    const f = relRect(rect);
    const node = el("div", "aw-sd-flyball " + teamCls(teamSide));
    node.style.width = f.w + "px"; node.style.height = f.h + "px";
    node.style.setProperty("--bs", f.w + "px");
    node.style.transform = `translate(${f.x}px,${f.y}px)`;
    node.append(avatarNode(className, rows.get(key).it.name, "aw-av"));
    fly.append(node);
    return { node, f };
  }
  function flyTo(fb, toR, ms, done) {
    const { node, f } = fb;
    const t = relRect(toR);
    const sx = f.x, sy = f.y, ex = t.x + (t.w - f.w) / 2, ey = t.y + (t.h - f.h) / 2;
    const sEnd = t.w / f.w;
    const midX = sx + (ex - sx) * .5, midY = Math.min(sy, ey) - Math.max(f.w * .8, Math.abs(ex - sx) * .18);
    let a;
    try {
      a = node.animate([
        { transform: `translate(${sx}px,${sy}px) scale(1)` },
        { transform: `translate(${midX}px,${midY}px) scale(${(1 + sEnd) / 2 * 1.15})`, offset: .5 },
        { transform: `translate(${ex}px,${ey}px) scale(${sEnd})` }
      ], { duration: ms, easing: "cubic-bezier(.45,.05,.35,1)", fill: "forwards" });
    } catch { done(); node.remove(); return; }
    whenDone(a, () => { done(); node.remove(); }, ms + 200);
  }
  /**
   * Vòng sáng + chùm sao vàng toả ra NGAY CHỖ quả bóng vừa bật khỏi thẻ (thầy: "bắn ra một chút
   * sparkle vàng"). ⭐ Đợt 448b — không còn nhịp "bóng nảy tại chỗ" trước khi bay: bóng bay luôn,
   * sparkle ở lại chỗ cũ toả ra sau lưng nó.
   */
  function popSparkle(fb, ms) {
    const { f } = fb;
    const cx = f.x + f.w / 2, cy = f.y + f.h / 2, R = f.w / 2;
    const ring = el("i", "aw-sd-burst-ring");
    ring.style.left = cx + "px"; ring.style.top = cy + "px";
    ring.style.width = ring.style.height = f.w + "px";
    fly.append(ring);
    try {
      const ra = ring.animate([
        { transform: "translate(-50%,-50%) scale(.9)", opacity: .9 },
        { transform: "translate(-50%,-50%) scale(1.9)", opacity: 0 }
      ], { duration: ms + 80, easing: "cubic-bezier(.2,.7,.3,1)", fill: "forwards" });
      whenDone(ra, () => ring.remove(), ms + 300);
    } catch { ring.remove(); }
    const N = 12;
    for (let i = 0; i < N; i++) {
      const s = el("i", "aw-sd-burst-star" + (i % 3 === 0 ? " is-dot" : i % 2 ? " is-pale" : ""));
      const ang = (i / N) * Math.PI * 2 + (Math.random() - .5) * .5;
      const d0 = R * .85, d1 = R * (1.45 + Math.random() * .6);
      const sz = R * (i % 3 === 0 ? .16 : .3 + Math.random() * .12);
      s.style.width = s.style.height = sz + "px";
      s.style.left = cx + "px"; s.style.top = cy + "px";
      fly.append(s);
      const rot = (Math.random() - .5) * 160;
      const p = d => `translate(-50%,-50%) translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d}px)`;
      try {
        const sa = s.animate([
          { transform: p(d0) + " scale(.2) rotate(0deg)", opacity: 0 },
          { transform: p((d0 + d1) / 2) + ` scale(1) rotate(${rot / 2}deg)`, opacity: 1, offset: .35 },
          { transform: p(d1) + ` scale(.3) rotate(${rot}deg)`, opacity: 0 }
        ], { duration: ms + 160 + Math.random() * 120, easing: "cubic-bezier(.15,.7,.3,1)", fill: "forwards" });
        whenDone(sa, () => s.remove(), ms + 500);
      } catch { s.remove(); }
    }
    try { [0, 60, 120].forEach((d, i) => setTimeout(() => sound.glide({ freq: 1800 + i * 500, freqEnd: 2600 + i * 500, dur: .12, gain: .05 }), d)); }
    catch { /* âm thanh là trang trí */ }
  }

  function clipCircle(card, av) {
    const br = card.getBoundingClientRect(), ar = av.getBoundingClientRect();
    const cx = ar.left + ar.width / 2 - br.left, cy = ar.top + ar.height / 2 - br.top;
    const R = Math.hypot(Math.max(cx, br.width - cx), Math.max(cy, br.height - cy));
    return { big: `circle(${R}px at ${cx}px ${cy}px)`, small: `circle(${ar.width / 2 + 1}px at ${cx}px ${cy}px)` };
  }

  function counts() { const c = { l: 0, r: 0 }; picks.forEach(v => { if (c[v] != null) c[v]++; }); return c; }
  function shake(node) {
    try { sound.buzz(); } catch { /* âm thanh là trang trí */ }
    try {
      node.animate([{ transform: "translateX(0)" }, { transform: "translateX(-3%)" }, { transform: "translateX(3%)" },
        { transform: "translateX(-2%)" }, { transform: "translateX(1%)" }, { transform: "translateX(0)" }],
      { duration: 300, easing: "ease-in-out" });
    } catch { /* không có WAAPI: không lắc, vẫn chặn */ }
  }

  // ---------------- CHỌN: bóng bật ra bay sang cột + thẻ co lại — CÙNG LÚC ----------------
  // ⭐ Đợt 448b (thầy: "thẻ tên vừa co và quả bóng cũng đồng thời nhảy ra đội luôn, không trễ một
  // nhịp chờ") — trước: co thẻ 230 ms ⇒ nảy + sparkle 340 ms ⇒ mới bay. Nay ngay cú tích: quả avatar
  // trong thẻ ẩn đi, bản sao của nó bay luôn về cột (sparkle toả ở chỗ nó vừa rời), còn dải thẻ co
  // tròn về đúng chỗ trống đó rồi hàng khép lại.
  function pickFromRow(key, side) {
    const r = rows.get(key);
    if (!r || picks.has(key) || r.row.dataset.busy) return;
    // ⭐⭐⭐ Đợt 319 — hai bên không chênh quá 1 (chỉ cú TÍCH). ⭐ Đợt 448 — chỉ thẻ lắc, không toast.
    const c = counts(); c[side]++;
    if (Math.abs(c.l - c.r) > 1) { shake(r.card); return; }
    picks.set(key, side);
    st.origin.set(key, side);
    st.cols[side].unshift(key);             // bóng mới lên ĐẦU cột, đè lên bóng chọn trước
    onChange?.();
    try { sound.tick(); } catch { /* âm thanh là trang trí */ }
    r.row.dataset.busy = "1";
    r.row.classList.add("is-leaving");
    const from = r.av.getBoundingClientRect();
    const clip = clipCircle(r.card, r.av);
    // 1) bóng bật ra, bay về cột ngay
    r.av.style.visibility = "hidden";
    const fb = makeFlyBall(key, side, from);
    popSparkle(fb, PT.pop);
    const ball = addBall(key, side, true);
    layoutSides(false);
    flyTo(fb, ballTarget(ball), PT.flyOut, () => ball.classList.remove("is-hidden"));
    // 2) cùng lúc: dải thẻ co tròn về chỗ quả bóng vừa rời, xong thì hàng khép lại tại chỗ
    const afterShrink = () => {
      const restore = () => { r.card.style.visibility = ""; r.av.style.visibility = ""; delete r.row.dataset.busy; paintArrows(); };
      if (!alive()) return restore();
      r.card.style.visibility = "hidden";
      collapseRow(r, restore);
      retaper(false);
    };
    try {
      const shrink = r.card.animate([{ clipPath: clip.big }, { clipPath: clip.small }],
        { duration: PT.shrink, easing: "cubic-bezier(.6,0,.8,.4)", fill: "forwards" });
      whenDone(shrink, afterShrink, PT.shrink + 150);
    } catch { afterShrink(); }
  }

  function collapseRow(r, after) {
    const h = r.row.offsetHeight;
    const gap = parseFloat(getComputedStyle(box).rowGap) || 0;
    const end = () => { r.row.classList.add("is-gone"); r.row.classList.remove("is-leaving"); after && after(); };
    try {
      const a = r.row.animate([
        { height: h + "px", marginBottom: "0px", opacity: 1 },
        { height: "0px", marginBottom: -gap + "px", opacity: 0 }
      ], { duration: PT.collapse, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" });
      whenDone(a, end, PT.collapse + 150);
    } catch { end(); }
  }

  // ---------------- BỎ CHỌN: bóng bay về đúng hạng, thẻ nở ra ----------------
  function unpick(key, fromR) {
    const r = rows.get(key);
    const side = picks.get(key);
    const teamSide = st.origin.get(key) || side;
    picks.delete(key);
    st.origin.delete(key);
    if (st.cols[side]) st.cols[side] = st.cols[side].filter(k => k !== key);
    const ball = balls.get(key);
    if (ball) { ball.remove(); balls.delete(key); }
    onChange?.();
    try { sound.tick(); } catch { /* âm thanh là trang trí */ }
    layoutSides(false);
    retaper(false);
    if (!r) return;
    r.row.classList.remove("is-gone");
    r.row.classList.add("is-leaving");
    r.row.dataset.busy = "1";
    r.card.classList.add("no-tr");          // thẻ này vào thẳng bề ngang mới, không trượt
    r.card.style.visibility = "hidden";
    void r.card.offsetWidth;
    // Hàng nằm ngoài khung cuộn thì kéo vừa đủ cho thấy — chỉ khi cần.
    const pr = box.getBoundingClientRect(), rr = r.row.getBoundingClientRect();
    if (rr.top < pr.top) box.scrollTop -= (pr.top - rr.top) + 10;
    else if (rr.bottom > pr.bottom) box.scrollTop += (rr.bottom - pr.bottom) + 10;
    const to = r.av.getBoundingClientRect();
    const h = r.row.offsetHeight;
    const gap = parseFloat(getComputedStyle(box).rowGap) || 0;
    r.card.classList.remove("no-tr");
    try {
      r.row.animate([{ height: "0px", marginBottom: -gap + "px" }, { height: h + "px", marginBottom: "0px" }],
        { duration: PT.rowOpen, easing: "cubic-bezier(.22,.61,.22,1)" });
    } catch { /* không có WAAPI: hàng mở thẳng */ }
    const fb = makeFlyBall(key, teamSide, fromR);
    flyTo(fb, to, PT.flyBack, () => {
      r.card.style.visibility = "";
      const done = () => { r.row.classList.remove("is-leaving"); delete r.row.dataset.busy; paintArrows(); };
      if (!alive()) return done();
      const clip = clipCircle(r.card, r.av);
      try {
        const g = r.card.animate([{ clipPath: clip.small }, { clipPath: clip.big }],
          { duration: PT.grow, easing: "cubic-bezier(.2,.8,.3,1)" });
        whenDone(g, done, PT.grow + 150);
      } catch { done(); }
    });
  }

  // ---------------- kéo bóng ----------------
  function wireDrag(ball, key) {
    let id = null, sx = 0, sy = 0, ox = 0, oy = 0, dragging = false, last = "";
    const inR = (n, x, y) => { const r = n.getBoundingClientRect(); return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom; };
    const hot = (x, y) => inR(podcol, x, y) ? "pod" : inR(sides.l, x, y) ? "l" : inR(sides.r, x, y) ? "r" : null;
    const paintHot = h => {
      podcol.classList.toggle("is-hot", h === "pod");
      sides.l.classList.toggle("is-hot", h === "l");
      sides.r.classList.toggle("is-hot", h === "r");
    };
    ball.addEventListener("pointerdown", e => {
      if (e.button !== 0) return;
      id = e.pointerId; sx = e.clientX; sy = e.clientY;
      ox = parseFloat(ball.style.left) || 0; oy = parseFloat(ball.style.top) || 0;
      dragging = false; last = "";
      try { ball.setPointerCapture(id); } catch { /* not capturable */ }
    });
    ball.addEventListener("pointermove", e => {
      if (e.pointerId !== id) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (!dragging && Math.hypot(dx, dy) < 8) return;
      if (!dragging) { dragging = true; ball.classList.add("is-drag"); wrap.classList.add("is-dragging"); }
      ball.style.left = (ox + dx) + "px";
      ball.style.top = (oy + dy) + "px";
      const h = hot(e.clientX, e.clientY);
      paintHot(h);
      // Trên một cột bóng ⇒ các bóng khác dạt ra chừa đúng ô sẽ thả vào.
      const prev = (h === "l" || h === "r") ? { side: h, key, index: slotAt(h, key, e.clientY) } : null;
      const sig = prev ? prev.side + prev.index : "";
      if (sig !== last) { last = sig; layoutSides(false, prev); }
    });
    const end = e => {
      if (e.pointerId !== id) return;
      id = null;
      wrap.classList.remove("is-dragging");
      paintHot(null);
      if (!dragging) {                       // chạm nhẹ ⇒ hé tên em trong giây lát
        ball.classList.add("is-peek");
        setTimeout(() => ball.classList.remove("is-peek"), 1500);
        return;
      }
      dragging = false;
      const h = e.type === "pointerup" ? hot(e.clientX, e.clientY) : null;
      const cur = picks.get(key);
      if (h === "pod") { ball.classList.remove("is-drag"); unpick(key, ball.getBoundingClientRect()); return; }
      if ((h === "l" || h === "r") && cur) {
        const idx = slotAt(h, key, e.clientY);
        st.cols[cur] = st.cols[cur].filter(k => k !== key);
        st.cols[h].splice(idx, 0, key);
        if (h !== cur) {
          picks.set(key, h);                  // màu bóng vẫn theo st.origin — không đổi
          const a = sides[cur].getBoundingClientRect(), b = sides[h].getBoundingClientRect();
          ball.classList.add("no-tr");
          sides[h].append(ball);
          ball.style.left = (parseFloat(ball.style.left) + a.left - b.left) + "px";
          ball.style.top = (parseFloat(ball.style.top) + a.top - b.top) + "px";
          void ball.offsetWidth;
          onChange?.();
        }
        try { sound.tick(); } catch { /* âm thanh là trang trí */ }
      }
      ball.classList.remove("is-drag", "no-tr");
      layoutSides(false);                    // trượt vào ô mới (hoặc về chỗ cũ nếu thả ra ngoài)
    };
    ball.addEventListener("pointerup", end);
    ball.addEventListener("pointercancel", end);
    ball.addEventListener("contextmenu", e => e.preventDefault());
  }

  // Bóng của những em đã chọn từ trước (vẽ lại bảng / mở lại trận) — đặt thẳng, không bay.
  ["l", "r"].forEach(side => st.cols[side].forEach(key => {
    const r = rows.get(key);
    if (!r) return;
    r.row.classList.add("is-gone");
    addBall(key, side, false);
  }));
  retaper(true);
  return wrap;
}

/**
 * ⭐⭐ Đợt 207 — A NAME IS NEVER CUT (thầy: "không bao giờ để khuyết hiển thị
 * thông tin, nếu tên quá dài và ô quá nhỏ, hãy linh hoạt chỉnh size tên nhỏ
 * hơn"). Shrink first, abbreviate only when shrinking has run out of room.
 *
 * ⚠️ MUST BE CALLED AFTER THE BOARD IS IN THE DOCUMENT. It measures, and a
 * detached tree has no width to measure — every caller therefore appends first
 * and calls this second.
 *
 * ⚠️ MEASURE AT REST, AND MEASURE TWICE. Widths depend on the font actually
 * being loaded (Đợt 153 lost a day to a 7px difference between weight 400
 * loaded and not), so this re-runs itself once `document.fonts` reports ready.
 * A second pass on a board that already fits changes nothing.
 *
 * ⚠️ NO requestAnimationFrame anywhere in here: in a backgrounded myActivity
 * column rAF never fires, and a name left at its unshrunk size — or worse, left
 * mid-shrink — would be the one thing this function exists to prevent.
 *
 * @param {string} sel  which names to fit. Defaults to the real board's — BOTH
 *   the funnel names AND the two side-column names (Đợt 324, thầy: "font chữ
 *   to tối đa" for the chosen column — a comma-joined selector so every
 *   existing caller that omits `sel` picks up the side list for free, no
 *   second call to remember at each of the 6 sites that already call this).
 *   The Recently-results columns in core/showdown-setup.js pass
 *   `.aw-sd-mini-name` explicitly, because the rule ("shrink, then abbreviate,
 *   never cut") is the same one and two copies of it would drift the first
 *   time either board was touched.
 */
export function fitPodiumNames(root, sel = ".aw-sd-pod-name, .aw-sd-pod-side-item") {
  if (!root || !root.querySelectorAll) return;
  const fits = nm => nm.scrollWidth <= nm.clientWidth + 0.5;
  // ⭐ Đợt 217 — `pass()` nay TRẢ LỜI "có đo được không", chứ không chỉ làm rồi thôi.
  // Cả bảng vẽ bằng `cqw`, nên khi vùng chứa chưa có bề ngang thì cỡ chữ tính ra 0 và
  // hàm này không thể quyết được gì. Trước đợt này nó lặng lẽ trả về và tên ở nguyên
  // cỡ với dấu "…" — người gọi không có cách nào biết là mình vừa bị bỏ qua.
  let measured = false;
  const pass = () => {
    measured = true;
    root.querySelectorAll(sel).forEach(nm => {
      const full = nm.dataset.full || nm.textContent || "";
      // Always start from the top: this may be a second pass, or a re-fit after
      // the box changed size (fullscreen), and shrinking a name that has already
      // been shrunk would ratchet it down a little further every time.
      nm.style.fontSize = "";
      nm.textContent = full;
      if (!nm.clientWidth) { measured = false; return; }   // Đợt 217 — chưa có gì để đo
      if (fits(nm)) return;
      const base = parseFloat(getComputedStyle(nm).fontSize) || 0;
      if (!base) { measured = false; return; }
      const floor = base * NAME_MIN_RATIO;
      const shrink = () => {
        let size = base;
        while (size > floor && !fits(nm)) {
          size *= NAME_STEP;
          nm.style.fontSize = size.toFixed(2) + "px";
        }
      };
      shrink();
      if (fits(nm)) return;
      // Out of room at the floor — abbreviate, and let the abbreviation have the
      // full size back before shrinking it in its turn. "N.B.Anh" at full size
      // reads better across a room than the whole name at 62%.
      nm.textContent = shortenName(full);
      nm.style.fontSize = "";
      shrink();
      if (fits(nm)) return;
      // ⭐⭐ Đợt 217 — LƯỚI CUỐI: viết tắt rồi mà vẫn tràn thì đi tiếp xuống dưới sàn.
      // `NAME_MIN_RATIO` là mức "thà viết tắt còn hơn nhỏ thêm", KHÔNG phải mức "thà
      // cắt còn hơn nhỏ thêm" — mà trước đợt này nó bị dùng như cả hai. Chữ nhỏ vẫn
      // đọc được khi lại gần; chữ bị cắt thì mất hẳn thông tin, và đó đúng là thứ
      // thầy bảo "không bao giờ" được xảy ra nữa.
      let size = floor;
      const hard = base * NAME_HARD_MIN_RATIO;
      while (size > hard && !fits(nm)) {
        size *= NAME_STEP;
        nm.style.fontSize = size.toFixed(2) + "px";
      }
    });
  };
  const both = () => { pass(); return measured; };
  both();
  // The re-run is scheduled, never awaited: a browser without `document.fonts`
  // (or one where the promise never settles) still gets the first pass.
  try { document.fonts?.ready?.then(both); } catch { /* first pass stands */ }

  // ⭐⭐ Đợt 217 — THỬ LẠI KHI CHƯA ĐO ĐƯỢC, bằng đồng hồ chứ không bằng khung hình.
  // ⛔⛔ Vì sao không giao hết cho `ResizeObserver` ở dưới: RO được giao TRONG vòng
  // dựng khung hình, mà một cột myActivity bị che (hoặc pane trình duyệt bị ẩn) thì
  // vòng đó ĐỨNG HẲN — đo tại chỗ: **0 lần bắn, kể cả lần bắn đầu lúc bắt đầu quan
  // sát**. `setTimeout` thì vẫn chạy đúng nhịp ở chính hoàn cảnh đó (đo: mốc 20ms ra
  // 20/41/61/82…), nên nó là thứ duy nhất với tới được ca "bảng dựng lúc còn ẩn".
  // ⚠️ CÓ ĐÁY, và TỰ TẮT: bốn lần, dừng ngay khi đo được hoặc khi bảng rời khỏi
  // trang. Một vòng thử vô hạn ở đây chính là đồng hồ ma của Đợt 112/131.
  if (!measured) {
    const RETRY_MS = [60, 180, 500, 1200];
    let n = 0;
    const again = () => {
      if (!root.isConnected) return;      // bảng đã bị thay — thôi
      if (both()) return;                 // đo được rồi
      if (n < RETRY_MS.length) setTimeout(again, RETRY_MS[n++]);
    };
    setTimeout(again, RETRY_MS[n++]);
  }

  // ⭐⭐⭐ Đợt 217 — ĐO LẠI MỖI KHI CÓ THỨ MỚI ĐỂ ĐO (thầy: tên vẫn bị "…").
  // ⛔⛔ HAI CA LÀM HỎNG, CẢ HAI ĐÃ ĐO ĐƯỢC, và không ca nào là lỗi thuật toán —
  // thuật toán chạy đúng 0/12 tên bị cắt ở cả ba bề ngang khi được gọi lúc bảng
  // ĐANG hiện:
  //   1. **Gọi lúc bảng chưa có bề ngang** (panel còn ẩn, cột myActivity chưa dựng
  //      xong). Cả bảng vẽ bằng `cqw`, nên container rộng 0 ⇒ cỡ chữ tính ra 0 ⇒
  //      `if (!base) return` bỏ cuộc TRONG IM LẶNG, và tên nằm nguyên cỡ với dấu "…"
  //      — đúng cái ảnh thầy gửi (đo lại: 3/12 tên bị cắt, font vẫn 14.04px).
  //   2. **Fit lúc rộng rồi khung hẹp lại** (toàn màn hình tắt đi, cột myActivity bị
  //      kéo hẹp, xoay màn). Không ai đo lại ⇒ tên tràn (đo: 1/12).
  // Một `ResizeObserver` đóng cả hai cửa bằng một cơ chế: nó bắn NGAY khi bắt đầu
  // quan sát (nên ca 1 tự chữa lúc bảng hiện ra) và bắn lại mỗi lần bề ngang đổi.
  // ⚠️ CHỈ PHẢN ỨNG VỚI BỀ NGANG. `pass()` đổi cỡ chữ ⇒ đổi CHIỀU CAO bảng ⇒ RO bắn
  // lại: nghe cả hai chiều là một vòng lặp tự nuôi. Thêm cờ `busy` chặn tái nhập.
  // ⚠️ Gọi lại `fitPodiumNames` trên cùng một gốc thì phải NGẮT cái cũ, không thì
  // mỗi lần vẽ lại bảng là chồng thêm một observer sống mãi (bài học đồng-hồ-ma của
  // Đợt 112/131, đúng họ với nó).
  try {
    if (root.__awFitRO) root.__awFitRO.disconnect();
    let lastW = 0, busy = false;
    const ro = new ResizeObserver(() => {
      if (busy) return;
      const w = Math.round(root.clientWidth || 0);
      if (!w || w === lastW) return;
      lastW = w;
      busy = true;
      try { both(); } finally { busy = false; }
    });
    ro.observe(root);
    root.__awFitRO = ro;
  } catch { /* không có ResizeObserver: hai lượt ở trên vẫn đứng */ }
}

// ⭐⭐⭐ Đợt 319 — `placePodiumCounts()` (Đợt 208's measured position for the two
// floating tick-counts) is GONE along with the counts themselves: the two name
// columns are ordinary flex children laid out by CSS alone (`.aw-sd-pod-side`
// in app.css), nothing left to measure and place by hand.

function mark(cls, glyph, text) {
  const box = el("div", "aw-sd-rv-mk " + cls);
  const txt = el("span", "aw-sd-rv-mktxt");
  txt.textContent = String(text || "");
  box.append(el("span", "aw-sd-rv-mkicon", glyph), txt);
  return box;
}
