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
import { fmtRoundMs, pctBand, groupByMember, rankBlocks } from "./showdown.js";

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
const POD_MAX_W = 80;
const POD_MIN_W = 46;

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
 *   loadTeams  async () => [{ teamId, teamName, at, students:[block] }] — every
 *              team that has SYNCED a result for this same act, this one
 *              included. Supplied by the engine so this file never imports
 *              Firestore. May reject; the screen keeps what it has.
 *   toast      the engine's toast
 */
export function mountShowdownReview({ head, before, host, pick, review, loadTeams, toast = () => {} }) {
  // THIS team, from memory. Authoritative: it is the play that just happened on
  // this screen, and it is what the class board shows for us even if the write
  // to the shared table failed.
  const teamBlocks = groupByMember(review, pick.members);

  let scope = "team";        // "team" | "class"
  let podium = false;
  let classBlocks = null;    // built on the first successful load
  let busy = false;
  let doneTimer = null;

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
  title.append(word);
  if (pick.className) title.append(clsEl);
  title.append(dot, scopeEl, status);

  const total = el("div", "aw-rv-sdtotal");
  head.insertBefore(title, before);
  head.insertBefore(total, before);

  function scopeText() {
    return scope === "team"
      ? String(pick.teamName || "Team")
      // The count is of pupils WITH A RESULT, not of the class register: teams
      // still playing simply are not on the board yet (teacher: "tổng số học
      // sinh là số hs đã có dữ liệu vì có thể có đội chưa xong").
      : `${blocks().length} STS`;
  }

  function paintTitle() {
    scopeEl.textContent = scopeText();
    // Green marks WHAT IS ON SCREEN: the team in team scope, the class (name and
    // count together) in class scope.
    clsEl.classList.toggle("is-on", scope === "class");
    scopeEl.classList.toggle("is-on", true);
    title.classList.toggle("is-pod", podium);
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
    return classBlocks || teamBlocks;
  }

  /**
   * Merge what the other teams synced with what this browser has in memory.
   * ⚠️ OUR OWN team always comes from memory, never from the table, even though
   * we wrote it there a moment ago: the write is fire-and-forget and may have
   * failed (signed out, offline, slow), and a screen must never show a team a
   * worse result than the one it just watched happen.
   */
  function buildClass(entries) {
    const out = teamBlocks.map(b => ({ ...b, teamName: pick.teamName || "" }));
    (entries || []).forEach(entry => {
      if (!entry || entry.teamId === pick.teamId) return;
      (entry.students || []).forEach(s => out.push({ ...s, teamName: entry.teamName || "" }));
    });
    // `ord` is the tie-breaker of last resort (core/showdown.js's rankBlocks) and
    // has to be unique across the merged list, not per team — two pupils tied on
    // everything must still have a stable order.
    out.forEach((b, i) => { b.ord = i; });
    return out;
  }

  /** Re-read the shared table. Returns true if the class list was rebuilt. */
  async function refresh() {
    if (busy) return false;
    busy = true;
    showSpinner();
    try {
      const entries = await loadTeams();
      classBlocks = buildClass(entries);
      return true;
    } catch (e) {
      console.warn("AWord: could not read the other teams", e);
      // Still give the class scope something to stand on — our own team — so a
      // teacher with no signal can still switch and see a board.
      if (!classBlocks) classBlocks = buildClass([]);
      toast(e?.code === "aw/signed-out" ? "Sign in to see the other teams" : "Could not reach the other teams");
      return false;
    } finally {
      busy = false;
    }
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
  function renderList(ranked) {
    const list = el("div", "aw-sd-rv");
    ranked.forEach(b => {
      const block = el("div", "aw-sd-rv-block");

      const who = el("span", "aw-sd-rv-who");
      who.textContent = b.name;
      const bhead = el("div", "aw-sd-rv-name");
      bhead.append(who);
      // Whose team, on the class board only — on a team board every line would
      // carry the same word and it is already in the title.
      if (scope === "class" && b.teamName) {
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

  // ---------------------------------------------------------------
  // THE PODIUM — the ranking as a funnel (teacher's design, 17/8/2026)
  // ---------------------------------------------------------------
  // One column, every box the same HEIGHT and each a little narrower than the
  // one above, so the board tapers to a point: first place is the widest thing
  // on screen and the eye runs straight down the taper. The rank number sits
  // OUTSIDE each box on its left, which is what turns the narrowing edges into a
  // visible diagonal instead of a ragged stack.
  function renderPodium(ranked) {
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
      if (scope === "class" && b.teamName) {
        const tag = el("span", "aw-sd-pod-team");
        tag.textContent = b.teamName;
        left.append(tag);
      }

      const stats = el("div", "aw-sd-pod-stats");
      stats.append(
        el("span", "aw-sd-pod-ok", `${icons.check} ${b.right}`),
        el("span", "aw-sd-pod-bad", `${icons.cross} ${b.wrong}`)
      );
      // Only when the round clock was on — a Showdown played without it shows
      // the two tallies alone rather than a column of dashes.
      if (b.hasTime) stats.append(el("span", "aw-sd-pod-time", fmtRoundMs(b.ms)));

      card.append(left, stats);
      row.append(rank, card);
      box.append(row);
    });
    return box;
  }

  function paintBody() {
    host.querySelectorAll(".aw-sd-rv, .aw-sd-pod").forEach(n => n.remove());
    const ranked = rankBlocks(blocks());
    host.append(podium ? renderPodium(ranked) : renderList(ranked));
  }

  paintTitle();
  paintBody();
}

function mark(cls, glyph, text) {
  const box = el("div", "aw-sd-rv-mk " + cls);
  const txt = el("span", "aw-sd-rv-mktxt");
  txt.textContent = String(text || "");
  box.append(el("span", "aw-sd-rv-mkicon", glyph), txt);
  return box;
}
