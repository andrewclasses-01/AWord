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
//   └ the word SHOWDOWN is a button carrying THREE gestures:
//       tap        swap between THIS TEAM and THE WHOLE CLASS. "TEAM 3" folds
//                  back into "A1C" and the class's pupil count grows out of it
//                  ("A1C • 16 STS"), both halves turning green — green is
//                  always "this is what you are looking at".
//       double tap re-read the other teams from the shared table: a spinner
//                  beside the title, then "UPDATED" for a moment, then gone.
//       press+hold the RANKING BOARD — one column of boxes narrowing downwards
//                  into a funnel, gold/silver/bronze cups for the top three,
//                  and the title itself goes gold and sparkles.
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
import { fmtRoundMs, pctBand, groupByMember, rankBlocks, mergeClassBlocks } from "./showdown.js";

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
export const POD_MIN_W = 46;

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
 * tap / double-tap / press-and-hold on one element. See the header for why this
 * is written by hand. The three callbacks are mutually exclusive: a gesture
 * fires exactly one of them.
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
    holdTimer = setTimeout(() => {
      holdTimer = null; held = true;
      clearTap();                                   // a hold is never also a tap
      onHold();
    }, HOLD_MS);
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

  let scope = "team";        // "team" | "class"
  let podium = false;
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
  word.title = "Tap: this team / the whole class · Double tap: refresh · Hold: ranking";
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
    title.classList.toggle("is-pod", podium);
    paintTeamsChip();
    const b = blocks();
    const right = b.reduce((a, x) => a + x.right, 0);
    const asked = b.reduce((a, x) => a + x.total, 0);
    total.textContent = `${right}/${asked}`;
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
  // THE THREE GESTURES
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
    },
    onHold: () => {
      podium = !podium;
      // A rising two-note lift for going up onto the podium, the reverse coming
      // back down — the same vocabulary core/showdown-setup.js uses.
      sound.glide(podium
        ? { freq: 660, freqEnd: 1180, dur: 240, gain: 0.08, type: "triangle" }
        : { freq: 1000, freqEnd: 620, dur: 200, gain: 0.06, type: "triangle" });
      paintTitle();
      paintBody();
    }
  });

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
  const renderPodium = ranked => renderReviewPodium(ranked, { showTeam: scope === "class" });

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
    host.querySelectorAll(".aw-sd-rv, .aw-sd-pod, .aw-sd-warn").forEach(n => n.remove());
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
    host.append(podium ? renderPodium(ranked) : renderList(ranked));
  }

  paintTitle();
  paintBody();
  startWatching();
  retryOwnPublish();

  /**
   * ⚠️ MUST be called when the review closes. A Firestore listener left running
   * behind a screen that is gone is the same bug as Đợt 131's ghost clock: it
   * costs nothing visible and keeps costing it for the rest of the lesson.
   */
  return function dispose() {
    if (stopWatch) { try { stopWatch(); } catch { /* already gone */ } stopWatch = null; }
    if (doneTimer) { clearTimeout(doneTimer); doneTimer = null; }
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
    // ⭐ Đợt 176 — "1:00 - 50%": time in blue (CSS), then % correct of the
    // questions this pupil ACTUALLY answered, banded red→…→green (pctBand).
    // The two halves are independent: time only exists with the round clock
    // on, the percentage only with at least one attempted question — the "-"
    // joins them only when both are there.
    if (b.hasTime) tally.append(el("span", "aw-sd-rv-time", fmtRoundMs(b.ms)));
    if (b.attempted) {
      const pct = Math.round((b.right / b.attempted) * 100);
      if (b.hasTime) tally.append(el("span", "aw-sd-rv-sep", "-"));
      tally.append(el("span", "aw-sd-rv-pct " + pctBand(pct), pct + "%"));
    }
    tally.append(
      el("span", "is-ok", `${icons.check} ${b.right}`),
      el("span", "is-bad", `${icons.cross} ${b.wrong}`)
    );
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
 * screen and the eye runs straight down the taper. The rank number sits OUTSIDE
 * each box on its left, which is what turns the narrowing edges into a visible
 * diagonal instead of a ragged stack.
 */
export function renderReviewPodium(ranked, { showTeam = false } = {}) {
  const box = el("div", "aw-sd-pod");
  const n = ranked.length;
  ranked.forEach((b, i) => {
    // Linear from POD_MAX_W down to POD_MIN_W across however many pupils there
    // are — see the constants' own note for why this is not a fixed step.
    const w = n > 1 ? POD_MAX_W - (POD_MAX_W - POD_MIN_W) * (i / (n - 1)) : POD_MAX_W;
    const row = el("div", "aw-sd-pod-row");
    row.style.setProperty("--w", w.toFixed(2) + "%");

    const rank = el("span", "aw-sd-pod-rank");
    rank.textContent = String(i + 1);

    const card = el("div", "aw-sd-pod-box" + (i < 3 ? ` is-m${i + 1}` : ""));

    const left = el("div", "aw-sd-pod-who");
    const nm = el("span", "aw-sd-pod-name");
    nm.textContent = b.name;
    left.append(nm);
    // Gold, silver and bronze cups for the first three, to the RIGHT of the
    // name and inside the box (teacher: "bên cạnh phải tên (vẫn trong ô)").
    if (i < 3) left.append(el("span", "aw-sd-pod-cup", icons.trophy));
    if (showTeam && b.teamName) {
      const tag = el("span", "aw-sd-pod-team");
      tag.textContent = b.teamName;
      left.append(tag);
    }

    const stats = el("div", "aw-sd-pod-stats");
    stats.append(
      el("span", "aw-sd-pod-ok", `${icons.check} ${b.right}`),
      el("span", "aw-sd-pod-bad", `${icons.cross} ${b.wrong}`)
    );
    // ⭐ Đợt 180 (teacher, 17/8/2026: "% tỷ lệ đúng trong ô rank") — the same
    // number, the same bands and the same denominator as the list view: OF THE
    // QUESTIONS ACTUALLY ATTEMPTED, never of the ones the pupil never reached.
    // Asking pctBand() rather than re-picking colours here is what stops the
    // funnel and the list ever disagreeing about what "green" means.
    // ⚠️ Omitted entirely when nothing was attempted — a pupil the game never
    // reached shows no percentage rather than a red 0%.
    if (b.attempted) {
      const pct = Math.round((b.right / b.attempted) * 100);
      stats.append(el("span", "aw-sd-pod-pct " + pctBand(pct), pct + "%"));
    }
    // Only when the round clock was on — a Showdown played without it shows
    // the two tallies alone rather than a column of dashes.
    if (b.hasTime) stats.append(el("span", "aw-sd-pod-time", fmtRoundMs(b.ms)));

    card.append(left, stats);
    row.append(rank, card);
    box.append(row);
  });
  return box;
}

function mark(cls, glyph, text) {
  const box = el("div", "aw-sd-rv-mk " + cls);
  const txt = el("span", "aw-sd-rv-mktxt");
  txt.textContent = String(text || "");
  box.append(el("span", "aw-sd-rv-mkicon", glyph), txt);
  return box;
}
