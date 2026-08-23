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
import {
  fmtRoundMs, pctBand, pctOf, shortenName, groupByMember, rankBlocks, mergeClassBlocks,
  buildAnalysisRows
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
 *   toast      the engine's toast
 *
 * Returns `dispose()` — MUST be called when the review leaves the screen, or the
 * Firestore listener outlives the panel (the same class of leak as the
 * ghost-clock of Đợt 131).
 */
export function mountShowdownReview({
  head, before, host, pick, review, loadTeams,
  watchTeams = null, flushPending = null, isPending = () => false, toast = () => {}
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
  const word = el("button", "aw-sd-ttl-word", "SHOWDOWN");
  word.type = "button";
  word.title = "Tap: this team / the whole class · Double tap: refresh";
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

  function showSpinner() {
    if (doneTimer) { clearTimeout(doneTimer); doneTimer = null; }
    status.className = "aw-sd-ttl-status is-spin";
    status.innerHTML = icons.spinner;               // trusted markup from core/icons.js
  }
  function showUpdated() {
    status.className = "aw-sd-ttl-status is-done";
    status.textContent = "UPDATED";
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
  // the teacher's team-split away the moment another column finished. Owned by
  // the screen, it also dies with the screen — which is what "đánh dấu tạm"
  // means and why nothing here goes near Firestore.
  const picks = new Map();
  const renderPodium = ranked => renderReviewPodium(ranked, { showTeam: scope === "class", picks });

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
    if (stopWatch) { try { stopWatch(); } catch { /* already gone */ } stopWatch = null; }
    if (doneTimer) { clearTimeout(doneTimer); doneTimer = null; }
    // ⭐ Đợt 207 — the same rule as the listener above, applied to the two things
    // fullscreen leaves behind: a document-level listener outliving the screen
    // that made it (ghost-clock, Đợt 131), and a browser still in fullscreen on
    // a board that no longer exists — which would leave the teacher looking at
    // an empty white wall with no way back but Esc.
    document.removeEventListener("fullscreenchange", onFsChange);
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
 * above, so the board tapers to a point: first place is the widest thing on
 * screen and the eye runs straight down the taper.
 *
 * ⭐⭐ Đợt 207 — FOUR changes thầy asked for, and one of them is a trade he was
 * warned about and chose anyway:
 *   • THE PLACE MOVED INSIDE THE BOX ("Đưa số thứ tự vào trong khung tên"), as
 *     a medal with 1/2/3 on it for the top three and a plain numeral after that.
 *     ⚠️ THE TRADE: the numeral used to hang OUTSIDE each box, tracking the
 *     narrowing left edge, and that diagonal line of numbers is what made the
 *     taper read as a funnel rather than as a ragged stack. Inside the boxes
 *     they line up straight and the funnel leans on its own edges alone. This
 *     was said out loud before building; it is not an oversight to "fix".
 *   • A NAME IS NEVER CUT — see fitPodiumNames below, which the caller must run
 *     once the board is on screen.
 *   • SPARKLES around the top three (thầy: "sparkle và sao nhỏ lấp lánh ẩn hiện
 *     xung quanh"), pure CSS — see the note on the spark layer below.
 *   • TWO TICK BOXES per row, for splitting the class into two teams straight
 *     off the results (see `picks`).
 *
 * @param {object}  opts.picks  the caller's OWN Map of `block.key → "l" | "r"`.
 *   Passed in rather than kept here because this board is re-rendered on every
 *   scope switch and on every arrival from the live listener; a Map owned by the
 *   render would drop the teacher's ticks the moment another team finished. The
 *   caller creating it per screen is also what makes the marks temporary, which
 *   is what thầy asked for (20/8/2026: "đánh dấu tạm").
 *   Omit it and the tick boxes are not built at all — that is how the
 *   miniature/preview callers stay untouched.
 */
export function renderReviewPodium(ranked, { showTeam = false, picks = null } = {}) {
  // ⚠️ Đợt 207 — the returned root is now a WRAPPER, not `.aw-sd-pod` itself.
  // The two counters have to stay put while the list scrolls under them, so they
  // are siblings of the scroller rather than children of it. Anything that
  // removes this board by selector must know both names — see paintBody().
  const wrap = el("div", "aw-sd-podwrap");
  const box = el("div", "aw-sd-pod");
  wrap.append(box);
  const n = ranked.length;
  // The two faint tallies of how many pupils have been ticked to each side.
  // Built even when nothing is ticked yet (CSS hides them at 0/0), so the count
  // can fade in rather than appear from nowhere on the first tick.
  // ⭐ Đợt 209 — each counter carries its OWN sparkle layer and its own digit
  // node, because the "everybody is placed" state lights the number and sets
  // sparkles off around it (see paintCounts). The digit lives in a child rather
  // than in the counter's textContent so the sparkles are siblings of it and can
  // sit outside the glyph without being written over on the next repaint.
  const mkCount = side => {
    const c = el("div", "aw-sd-podcount is-" + side);
    c.append(el("span", "aw-sd-podcount-n"));
    const spark = el("span", "aw-sd-podcount-spark");
    spark.setAttribute("aria-hidden", "true");
    for (let s = 0; s < 6; s++) spark.append(el("i", "aw-sd-pod-star s" + s));
    c.append(spark);
    return c;
  };
  const counts = picks ? { l: mkCount("l"), r: mkCount("r") } : null;
  if (counts) wrap.append(counts.l, counts.r);

  // ⭐⭐ Đợt 219 — MỖI HÀNG ĐỂ LẠI ĐÂY CÁCH TỰ VẼ CỦA NÓ, và một cú tích vẽ LẠI CẢ
  // BẢNG chứ không chỉ hàng vừa bấm.
  // ⚠️ VÌ SAO KHÔNG PHẢI LÀ THỪA: `picks` được đánh theo KHOÁ HỌC SINH, nên hai hàng
  // dùng chung một khoá là hai hàng dùng chung một ô nhớ. Chỉ vẽ hàng vừa bấm thì
  // hàng KIA giữ nguyên dấu tích cũ của mình — trên màn là "tích bên này mà bên kia
  // vẫn còn chấm", đúng thứ thầy tả, mà bộ đếm lại nói khác. Vẽ cả bảng thì dù khoá
  // có đụng nhau, cái nhìn thấy vẫn luôn khớp với cái được ghi.
  // ⚠️ Rẻ: một lớp phễu là 6–20 hàng, mỗi hàng ba lần `classList.toggle` không đổi
  // bố cục ⇒ trình duyệt không phải tính lại layout.
  const rowPaints = [];
  const paintAll = () => rowPaints.forEach(fn => fn());

  /** Both counters, from the one Map. Thầy: one side showing means both show. */
  function paintCounts() {
    if (!counts) return;
    let l = 0, r = 0;
    picks.forEach(v => { if (v === "l") l++; else if (v === "r") r++; });
    counts.l.querySelector(".aw-sd-podcount-n").textContent = String(l);
    counts.r.querySelector(".aw-sd-podcount-n").textContent = String(r);
    // ⚠️ ONE class on the WRAPPER, not one per counter: "khi 1 bên hiện 1 thì
    // bên còn lại cũng hiện đồng thời (hiện 0)" — they are a pair, and a pair
    // that could half-appear would read as a bug.
    wrap.classList.toggle("has-picks", l + r > 0);
    // Two digits need more room than one, and the room is only the sliver
    // outside the widest row (see `.aw-sd-podcount` in app.css).
    wrap.classList.toggle("is-wide-count", String(Math.max(l, r)).length > 1);
    // ⭐⭐ Đợt 209 (thầy) — "khi 2 bên đã tích toàn bộ học sinh rồi (không còn dư
    // ai), thì 2 số tổng ô tích 2 bên sẽ chuyển thành màu xanh lá rõ nét và có
    // sparkle vàng lấp lánh xung quanh số đó."
    // ⚠️ The test is against the number of pupils ON THIS BOARD (`n`), not the
    // class register: a team scope shows one team, the class scope shows whoever
    // has finished. "Nobody left over" has to mean nobody left over on the board
    // in front of the teacher, or the light would never come on in team scope.
    wrap.classList.toggle("is-all", n > 0 && l + r === n);
  }

  ranked.forEach((b, i) => {
    // Linear from POD_MAX_W down to POD_MIN_W across however many pupils there
    // are — see the constants' own note for why this is not a fixed step.
    const w = n > 1 ? POD_MAX_W - (POD_MAX_W - POD_MIN_W) * (i / (n - 1)) : POD_MAX_W;
    const row = el("div", "aw-sd-pod-row");
    row.style.setProperty("--w", w.toFixed(2) + "%");
    // ⭐ Đợt 219 — KHOÁ CỦA MỘT LẦN TÍCH, và nó KHÔNG được là `b.key` trần.
    // `b.key` tới từ hai đường khác nhau: bảng Show answers dựng nó từ `m.id` (luôn
    // có), còn Recent results đọc nó ra khỏi SỔ CÁI, nơi `normStudent` viết
    // `String(s?.key || "")` — một trận cũ thiếu trường đó cho ra chuỗi RỖNG cho
    // MỌI em, tức cả lớp dùng chung một ô nhớ. Đây đúng là bậc thang duy nhất em tìm
    // được giữa hai bảng, và cũng là lý do lỗi chỉ xuất hiện ở một bên.
    // ⚠️ Bậc lùi lấy đúng luật `mergeClassBlocks` (core/showdown.js) đã dùng để gộp
    // lớp — tên viết thường. Hai chỗ hỏi "ai là ai" phải hỏi cùng một câu.
    const pk = String(b.key || "").trim()
      || String(b.name || "").trim().toLowerCase()
      || `#${i}`;

    const card = el("div", "aw-sd-pod-box" + (i < 3 ? ` is-m${i + 1}` : ""));

    const left = el("div", "aw-sd-pod-who");
    // ⭐ Đợt 207 — the place, INSIDE the box and BEFORE the name. A medal for the
    // first three (the digit is drawn into the icon itself — see core/icons.js
    // for why it is not a separate span), a numeral for everybody else.
    const badge = el("span", "aw-sd-pod-badge" + (i < 3 ? " is-medal" : ""));
    if (i < 3) badge.innerHTML = icons[`medal${i + 1}`];   // trusted markup, core/icons.js
    else badge.textContent = String(i + 1);
    left.append(badge);
    // ⭐ Đợt 208 — the name sits in a WRAPPER, and the wrapper is what the
    // sparkles are anchored to (thầy: "sparkle lấp lánh xuất hiện liên tục xung
    // quanh chính TÊN của các bạn này" — Đợt 207 put them round the whole box).
    // ⚠️ The wrapper is not decoration: `.aw-sd-pod-name` carries `overflow:hidden`
    // (that is what makes a too-long name measurable), so a sparkle placed INSIDE
    // it would be clipped away at exactly the edges it is meant to sit on.
    const nmWrap = el("span", "aw-sd-pod-nm");
    const nm = el("span", "aw-sd-pod-name" + (i < 3 ? " is-top" : ""));
    nm.textContent = b.name;                                // pupil's own name: textContent only
    nm.dataset.full = b.name;                               // fitPodiumNames needs the original back
    nm.title = b.name;
    nmWrap.append(nm);
    // ⭐ Đợt 208 — SPARKLES ON THE NAME. A layer of its own, `pointer-events:none`
    // so it can never eat a tap, and animated ENTIRELY in CSS: a backgrounded
    // myActivity column freezes requestAnimationFrame (bẫy #11 in myActivity's
    // BAN GIAO.md), and a JS-driven twinkle would simply stop dead there while
    // everything else kept working.
    if (i < 3) {
      const spark = el("span", "aw-sd-pod-spark");
      spark.setAttribute("aria-hidden", "true");
      for (let s = 0; s < 6; s++) spark.append(el("i", "aw-sd-pod-star s" + s));
      nmWrap.append(spark);
    }
    left.append(nmWrap);
    if (showTeam && b.teamName) {
      const tag = el("span", "aw-sd-pod-team");
      tag.textContent = b.teamName;
      left.append(tag);
    }

    const stats = el("div", "aw-sd-pod-stats");
    // ⭐ Đợt 180 (teacher: "% tỷ lệ đúng trong ô rank"), reshaped in Đợt 207 to
    // thầy's own reading order — "5 ✓ 5 ✗ 50%" — with the percentage last,
    // after the two numbers it is the sum of. One rule for the figure (pctOf)
    // and one for its colour (pctBand), both in core/showdown.js, so this board
    // and the list can never disagree about what a pupil scored or what green
    // means.
    stats.append(
      el("span", "aw-sd-pod-ok", `${icons.check} ${b.right}`),
      el("span", "aw-sd-pod-bad", `${icons.cross} ${b.wrong}`)
    );
    const pct = pctOf(b);
    if (pct !== null) stats.append(el("span", "aw-sd-pod-pct " + pctBand(pct), pct + "%"));
    // Only when the round clock was on — a Showdown played without it shows
    // the two tallies alone rather than a column of dashes.
    if (b.hasTime) stats.append(el("span", "aw-sd-pod-time", fmtRoundMs(b.ms)));

    card.append(left, stats);
    // ⚠️ Đợt 208 — the sparkle layer moved OUT of the card and onto the name
    // (see `nmWrap` above). Do not put a second one back here.

    if (picks) {
      // ⭐⭐ Đợt 207 — SPLITTING THE CLASS OFF THE RESULTS (thầy, 20/8/2026):
      // "chia đội dựa theo danh sách kết quả, đội nào chọn ai thì tích vào người
      // đó, tích bên trái thì về bên trái, tích bên phải thì về bên phải."
      // ⚠️ THE BOXES HUG THE ROW, so they narrow with the funnel and do NOT line
      // up in two straight columns (thầy asked for exactly this: "các ô tích sẽ
      // bám sát theo chiều dài ngang của ô, vì vậy các ô tích không thẳng hàng").
      // ⭐ Đợt 208 — A DOT, NOT A BOX (thầy): "thay các ô vuông để tích bằng chấm
      // tròn đặc nhỏ hơn (nhưng vẫn khá to)… Khi bấm vào sẽ biến thành dấu tích ✓
      // to, dày màu xanh dương… dấu tích chỉ đứng một mình, không cần nằm trong
      // khung hay ô gì cả."
      // ⚠️ THE BUTTON KEEPS ITS FULL SIZE, only its skin went away: the dot is a
      // child, the button around it stays 4.8cqw of invisible hit area. Shrinking
      // the button to the dot would make a target the size of a fingernail on a
      // board people tap from arm's length.
      const tick = side => {
        const t = el("button", "aw-sd-pod-tick is-" + side);
        t.type = "button";
        t.title = side === "l" ? "Left team" : "Right team";
        t.append(el("i", "aw-sd-pod-dot"));
        t.insertAdjacentHTML("beforeend", icons.check);     // trusted markup
        // ⭐⭐ Đợt 219 — BA CÁI CHỐT PHÒNG THỦ, viết vào đây sau khi thầy báo
        // "tích một bên thì chấm bên kia chưa ẩn" ở Recent results (20/8/2026).
        // Lỗi KHÔNG tái hiện được trên lưới chạy (18/18 phép đo đều ẩn đúng, đúng
        // đường thật: bảng Showdown ▸ Recent results ▸ bấm cột ▸ nút cúp), nên ba
        // chốt này bịt ba đường mà nó CÓ THỂ đi, chứ không phải vá một chỗ đã bắt
        // được quả tang. Cả ba đều rẻ và không đổi hình bảng một pixel nào.
        //
        // ⚠️ 1. VẼ TRƯỚC, KÊU SAU. `sound.tick()` đứng TRƯỚC hai lời gọi vẽ thì một
        //    cú ném từ tầng âm thanh (AudioContext bị treo, thiết bị ra rồi vào) sẽ
        //    nuốt luôn cả việc vẽ lại — dấu tích không hiện, chấm bên kia không ẩn,
        //    và không có gì trên màn nói vì sao. Tiếng động là trang trí; nó phải
        //    đứng sau, và trong `try`.
        // ⚠️ 2. VẼ CẢ BẢNG, KHÔNG VẼ MỘT HÀNG. Xem `paintAll` bên dưới.
        t.onclick = e => {
          e.stopPropagation();
          const cur = picks.get(pk);
          if (cur === side) picks.delete(pk); else picks.set(pk, side);
          paintAll();
          paintCounts();
          try { sound.tick(); } catch { /* âm thanh là trang trí, không được chặn việc vẽ */ }
        };
        return t;
      };
      const tl = tick("l"), tr = tick("r");
      // ⚠️ The unchosen box is hidden with `visibility`, never `display:none`
      // and never removed: it still holds its width, so the box between them
      // does not jump sideways the moment a tick lands. A funnel that shuffles
      // under the teacher's finger is the thing this whole screen is for.
      const paintRow = () => {
        const cur = picks.get(pk) || "";
        row.classList.toggle("is-picked", !!cur);
        tl.classList.toggle("is-on", cur === "l");
        tr.classList.toggle("is-on", cur === "r");
        tl.classList.toggle("is-off", cur === "r");
        tr.classList.toggle("is-off", cur === "l");
      };
      rowPaints.push(paintRow);
      row.append(tl, card, tr);
      paintRow();
    } else {
      row.append(card);
    }
    box.append(row);
  });
  paintCounts();
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
 * @param {string} sel  which names to fit. Defaults to the real board's; the
 *   Recently-results columns in core/showdown-setup.js pass `.aw-sd-mini-name`,
 *   because the rule ("shrink, then abbreviate, never cut") is the same one and
 *   two copies of it would drift the first time either board was touched.
 */
export function fitPodiumNames(root, sel = ".aw-sd-pod-name") {
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
  const both = () => { pass(); placePodiumCounts(root); return measured; };
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

/**
 * ⭐⭐ Đợt 208 — WHERE THE TWO TICK COUNTS SIT (thầy, 20/8/2026):
 * *"vị trí số người đã được tích sẽ nằm cao lên một chút, ở mức chính giữa tâm
 * của ô học sinh thứ 4 khi chưa cuộn. Số 2 bên cũng được đẩy về giữa một chút để
 * nằm chính giữa mép màn hình và vị trí dấu tích của ô tên học sinh thứ 4 (do
 * thanh scroll đang đè lên số bên phải, đẩy vào thì ko bị đè nữa)."*
 *
 * Đợt 207 pinned them to the middle of the whole board with a fixed CSS offset.
 * That is why the right-hand one ended up under the scrollbar — a fixed offset
 * cannot know the funnel's shape, and the funnel is the thing it has to avoid.
 * So this MEASURES: fourth row for the height, that row's own tick for the width.
 *
 * ⚠️ THE ANCHOR IS READ UNSCROLLED, ON PURPOSE. `offsetTop` does not move when
 * the list scrolls, which is exactly thầy's "khi chưa cuộn" — the counters are
 * outside the scroller and must not drift when the list is dragged.
 * ⚠️ THE RIGHT-HAND EDGE EXCLUDES THE SCROLLBAR (`offsetWidth − clientWidth`).
 * That is the whole reason the right number was being sat on.
 * ⚠️ A class of fewer than four falls back to its last row — there is no fourth
 * row to aim at, and aiming at nothing would leave the counters at 0,0.
 * ⛔ No requestAnimationFrame: a backgrounded myActivity column freezes it, and
 * counters left unplaced would sit in the corner for the rest of the lesson.
 */
export function placePodiumCounts(root) {
  const wrap = root?.querySelector?.(".aw-sd-podwrap");
  if (!wrap) return;
  const cl = wrap.querySelector(".aw-sd-podcount.is-l");
  const cr = wrap.querySelector(".aw-sd-podcount.is-r");
  const pod = wrap.querySelector(".aw-sd-pod");
  const rows = wrap.querySelectorAll(".aw-sd-pod-row");
  if (!cl || !cr || !pod || !rows.length) return;
  const anchor = rows[Math.min(3, rows.length - 1)];
  const ticks = anchor.querySelectorAll(".aw-sd-pod-tick");
  if (ticks.length < 2) return;

  // ---- height: the middle of the fourth row, measured unscrolled ----
  const top = anchor.offsetTop + anchor.offsetHeight / 2;
  cl.style.top = cr.style.top = `${Math.round(top)}px`;

  // ---- width: halfway between the frame's inner edge and that row's tick ----
  const wr = wrap.getBoundingClientRect();
  const lt = ticks[0].getBoundingClientRect();
  const rt = ticks[1].getBoundingClientRect();
  const sb = Math.max(0, pod.offsetWidth - pod.clientWidth);   // the scrollbar, if any
  // ⚠️ `left`/`right` are offsets FROM THE WRAP'S EDGES, and the transform then
  // pulls each number onto that point by half its own width. So the sum to solve
  // is "wrap edge → wanted centre", nothing more. Getting this wrong by exactly
  // `sb` is what put the right-hand number back under the scrollbar on the first
  // build of this đợt — the grid caught it at 4px of overlap.
  const lWant = (wr.left + lt.left) / 2;                       // midway: frame edge ↔ row-4 tick
  const rWant = (wr.right - sb + rt.right) / 2;                // …and the same on the right
  const lx = lWant - wr.left;
  const rx = wr.right - rWant;
  cl.style.left = `${Math.round(lx)}px`;
  cl.style.right = "auto";
  cr.style.right = `${Math.round(rx)}px`;
  cr.style.left = "auto";
}

function mark(cls, glyph, text) {
  const box = el("div", "aw-sd-rv-mk " + cls);
  const txt = el("span", "aw-sd-rv-mktxt");
  txt.textContent = String(text || "");
  box.append(el("span", "aw-sd-rv-mkicon", glyph), txt);
  return box;
}
