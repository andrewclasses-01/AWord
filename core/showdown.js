// =============================================================
// SHOWDOWN — one team per browser, one pupil per question (Đợt 155, 14/8/2026).
// The teacher's own idea, and NOT a variant of Fight mode.
//
// WHAT IT IS
//   The SHOWDOWN button under the frame (between Style and MODE) opens a table
//   where the teacher picks a CLASS, splits it into TEAMS, orders each team's
//   members, and — the part that makes the whole thing work — ticks WHICH ONE
//   TEAM this browser is going to play. Apply fixes that team here.
//
//     ┌───────────────────────────────┐
//     │  ANAGRAM        ‹ An ›        │   <- the slogan row now says whose turn it is
//     │  ...                          │
//     └───────────────────────────────┘
//
//   From then on the game deals its questions round-robin through that team's
//   members in the saved order: question 1 → member 1, question 2 → member 2,
//   … past the end it wraps back to member 1. Every question's result is
//   recorded against the pupil who owned it and shown, grouped by pupil, in a
//   redesigned "Show answers".
//
// WHY ONE TEAM PER BROWSER (teacher, 14/8/2026)
//   This is built for myActivity's multi-column view: 2-4 columns, each one a
//   WebContentsView running its own clone of the same act. Column 1 plays team
//   1, column 2 plays team 2, and so on — several teams racing the same act at
//   once, each with its own pupil rotation. The team TABLE is shared (Firestore,
//   see showdown-setup.js) so every machine and every column sees the same
//   line-up; only the CHOICE of which team to be is local.
//
// ⚠️⚠️ WHY THE CHOICE LIVES IN `sessionStorage` AND NOWHERE ELSE
//   Two obvious homes are both WRONG, and both fail silently:
//     • `localStorage` — myActivity's columns are the SAME origin in the SAME
//       partition, so all four share one localStorage. Every column would read
//       the same team, which is the exact opposite of the point.
//     • `activity.options` — `window.__awordBridge` deliberately MIRRORS an
//       applyOptions() from column 0 out to the other columns (see the bridge in
//       core/engine.js). Picking a team in column 0 would drag the other three
//       onto it.
//   `sessionStorage` is scoped to the top-level browsing context, so each tab
//   and each WebContentsView gets its own — the one store that is per-column.
//   The accepted cost: closing the browser loses the choice (the team TABLE is
//   safe on Firestore; only "which team am I" has to be re-ticked).
//
// ⚠️ THIS FILE IS PURE — no Firestore, no library. core/engine.js imports it
//   STATICALLY, so it must stay clean enough for the student page to load
//   (core/HUONG DAN CORE.md, luật 2 of v0.9.0). Everything that talks to
//   Firestore lives in core/showdown-setup.js, which is dynamic-imported from
//   the teacher's SHOWDOWN button only.
// =============================================================

import { el } from "./utils.js";
import { icons } from "./icons.js";

// Per-tab / per-WebContentsView. See the header note above for why this is not
// localStorage — it is the whole reason several teams can play at once.
const PICK_KEY = "aword-showdown-pick";
const BID_KEY = "aword-showdown-bid";

// ⭐ Đợt 159 (teacher, 15/8/2026): 1..5, was 2..8.
// **1 is a real mode, not a degenerate one**: it means THE WHOLE CLASS is one
// team — no dividing step, no shared table, no claims (see SOLO_TEAM_ID).
// **5 is a hard ceiling that the LAYOUT depends on**: five columns of ten names
// is the widest the panel can be and still fit a myActivity column without
// scrolling sideways, and the chip sizes in app.css are measured against it.
// Raising it means re-measuring that, not just editing this number.
// ⚠️ `normalize()` SLICES to MAX_TEAMS, so a table saved earlier with 6-8 teams
// loses the extras on the next read. Nobody had one when this changed.
export const MIN_TEAMS = 1;
export const MAX_TEAMS = 5;

// ⭐ Đợt 159 — at most ten pupils in a team (teacher: "nếu 2 team trở lên thì
// tối đa 10 người 1 team"). This is the number `.aw-sd-body`'s height is
// measured against: ten chips is the tallest a column can get, and the panel is
// built so that case never scrolls. It does NOT apply to one-team mode, which
// is the whole class by definition.
export const MAX_PER_TEAM = 10;

// The id a one-team (whole class) pick carries. It is deliberately NOT one of
// the `sdt_N` ids the shared table uses: a solo pick never goes to Firestore and
// must never be mistaken for a claim on a real team.
export const SOLO_TEAM_ID = "sd_solo";

// ---------------------------------------------------------------
// WHO THIS BROWSER IS
// ---------------------------------------------------------------
// A team, once ticked here, disappears from every OTHER browser's table
// (teacher, 14/8/2026: "khi đội được tích thì các trình duyệt khác không hiện
// đội đó nữa"), so the shared table has to record WHO holds each team. That
// needs an id per browser — and it must live in the SAME store as the pick, for
// the same reason (see the header): `sessionStorage` is the only thing that
// differs between myActivity's columns.
//
// ⚠️ Consequence worth knowing: closing the browser loses this id, so a claim
// left behind can never be released by its owner. That is why claims carry a
// timestamp and expire — see CLAIM_TTL_MS in core/showdown-setup.js.
export function browserId() {
  try {
    let id = sessionStorage.getItem(BID_KEY);
    if (!id) {
      id = "bw_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
      sessionStorage.setItem(BID_KEY, id);
    }
    return id;
  } catch {
    // Storage disabled: fall back to a per-page id. Claiming still works for
    // this session; it just cannot survive a reload.
    if (!globalThis.__awSdBid) globalThis.__awSdBid = "bw_mem_" + Math.random().toString(36).slice(2, 8);
    return globalThis.__awSdBid;
  }
}

// ---------------------------------------------------------------
// THIS BROWSER'S TEAM
// ---------------------------------------------------------------
// A pick is a SNAPSHOT of the chosen team, not just its id. Two reasons:
//   • the engine can paint the first pupil's name on the very first frame,
//     with no await and no network — a name that arrives a beat late reads as
//     a bug on a classroom projector;
//   • a page reload inside one session (Start again, Change template) never has
//     to reach Firestore at all.
// The setup panel refreshes the snapshot every time it saves, so a team edited
// on another machine lands here the next time this browser opens the panel.
//
// Shape: { teamId, teamName, classId, className, members: [{id, name}] }

export function readPick() {
  try {
    const raw = sessionStorage.getItem(PICK_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    const members = Array.isArray(p?.members)
      ? p.members.map(m => ({ id: String(m?.id || ""), name: String(m?.name || "").trim() })).filter(m => m.name)
      : [];
    // A team with nobody in it cannot deal turns, so it is not a usable pick.
    if (!p?.teamId || !members.length) return null;
    return {
      teamId: String(p.teamId),
      teamName: String(p.teamName || "").trim() || "Team",
      classId: String(p.classId || ""),
      className: String(p.className || "").trim(),
      members
    };
  } catch { return null; }        // private mode / storage disabled / bad JSON
}

export function writePick(pick) {
  try { sessionStorage.setItem(PICK_KEY, JSON.stringify(pick)); } catch { /* storage disabled */ }
}

export function clearPick() {
  try { sessionStorage.removeItem(PICK_KEY); } catch { /* storage disabled */ }
}

// ---------------------------------------------------------------
// THE TURN RULE — the one place that decides whose question this is
// ---------------------------------------------------------------
// Round-robin over the saved member order, wrapping past the end. `index0` is
// the item's ZERO-BASED position in the play order, which is exactly what the
// engine derives from `ui.setNav({index})` (every template sends `index + 1`)
// and exactly the index each template's own `review` array is built on — so the
// name on screen during the question and the name in Show answers can never
// disagree without both being wrong together.
export function memberAt(members, index0) {
  if (!members || !members.length) return null;
  const i = Math.max(0, Math.floor(Number(index0) || 0));
  return members[i % members.length];
}

// Tag every review row with the pupil whose turn that question was. Mutates in
// place and returns the same array: `reviewData` is handed straight to
// core/mistakes.js as well, which reads only the fields it knows, so an extra
// key is free.
export function stampReview(review, members) {
  (review || []).forEach((r, i) => {
    const m = memberAt(members, i);
    if (m) { r.studentId = m.id; r.studentName = m.name; }
  });
  return review;
}

// ---------------------------------------------------------------
// SHOW ANSWERS, SHOWDOWN EDITION
// ---------------------------------------------------------------
// The standard review is a flat list of questions, which says nothing about who
// answered what — the one thing this mode exists to record. This groups the
// same rows by pupil, in the team's own order, and gives each pupil their own
// tally. Only the team this browser played is here; there is nothing else in
// memory, because no other team was ever on this screen.
//
// `host` is the same `.aw-review` node the normal review fills, so the close
// button and the 16:9 overlay behave identically.
// ⚠️ `el(tag, cls, html)` sets **innerHTML** (core/utils.js) — every call site in
// this app that prints the teacher's or a pupil's own words wraps them in
// engine.js's `escapeText` first. That helper is not exported, so everything
// below writes text through `.textContent` instead and passes only trusted icon
// markup as HTML. A pupil named `<b>An` must never be able to reshape the page.
export function buildShowdownReview(host, { members, teamName, review }) {
  const list = el("div", "aw-sd-rv");
  const rows = review || [];

  // ⭐ Đợt 174c (teacher, 17/8/2026) — the team's own header line is GONE from
  // here: the class and the team now ride on the panel's SHOWDOWN title
  // ("SHOWDOWN - B2A / TEAM 1", built in core/engine.js's showReview), and the
  // team total sits beside it. Two headers, one under the other, said the same
  // thing twice and ate the height the bigger text below needs.

  // ⭐ Đợt 174c — RANKED, not in team order (teacher: "có tổng số câu đúng nhiều
  // hơn đứng trên, có tổng số câu đúng bằng nhau thì thời gian làm ngắn hơn
  // đứng trên"). Everything each pupil owns is gathered FIRST, then sorted, then
  // drawn — so the ✓ count and the time the sort reads are the very numbers
  // printed on that pupil's line and cannot disagree with the order.
  // ⚠️ A pupil with no timed rounds sorts as if they took no time at all, which
  // would put them above a faster-but-timed pupil on a tie. `hasTime` keeps them
  // BELOW instead: no measurement is not a good measurement.
  const blocks = members.map(m => {
    // Every question that fell to this member — decided by `memberAt`, the SAME
    // call the engine used to put a name over the frame during the game. Asking
    // one rule twice is what keeps the review from ever disagreeing with what
    // the class actually saw; re-deriving `i % members.length` here would be a
    // second copy of the turn rule, free to drift.
    const mine = [];
    rows.forEach((r, i) => { if (memberAt(members, i) === m) mine.push({ r, n: i + 1 }); });
    const timed = mine.filter(x => typeof x.r.roundMs === "number");
    return {
      m, mine,
      right: mine.filter(x => x.r.answered && x.r.yourCorrect).length,
      hasTime: timed.length > 0,
      ms: timed.reduce((a, x) => a + x.r.roundMs, 0)
    };
  }).filter(b => b.mine.length);

  blocks.sort((a, b) => {
    if (b.right !== a.right) return b.right - a.right;          // more correct first
    if (a.hasTime !== b.hasTime) return a.hasTime ? -1 : 1;      // a measured time beats none
    if (a.hasTime && a.ms !== b.ms) return a.ms - b.ms;          // then the quicker of the two
    return members.indexOf(a.m) - members.indexOf(b.m);          // still tied: the team's own order
  });

  blocks.forEach(({ m, mine, right, hasTime, ms }) => {
    const block = el("div", "aw-sd-rv-block");

    const who = el("span", "aw-sd-rv-who");
    who.textContent = m.name;
    const tally = el("span", "aw-sd-rv-tally");
    // ⭐ Đợt 174 — this pupil's TOTAL time, when the round clock was running
    // (core/engine.js stamps `roundMs` per row, exactly the way the names above
    // are stamped). It is the same number the ranking above sorted on — one
    // measurement, printed and sorted from the same place. Absent when the option
    // was off, so a Showdown played without it looks as it did before.
    // ⭐ Đợt 176 — "1:00 - 50%": time in blue (CSS), then % correct of the
    // questions this pupil ACTUALLY answered, banded red→…→green (see pctBand).
    // The two halves are independent: time only exists with the round clock on,
    // the percentage only with at least one attempted question — the "-" joins
    // them only when both are there.
    const attempted = mine.filter(x => x.r.answered).length;
    if (hasTime) tally.append(el("span", "aw-sd-rv-time", fmtRoundMs(ms)));
    if (attempted) {
      const pct = Math.round((right / attempted) * 100);
      if (hasTime) tally.append(el("span", "aw-sd-rv-sep", "-"));
      tally.append(el("span", "aw-sd-rv-pct " + pctBand(pct), pct + "%"));
    }
    tally.append(
      el("span", "is-ok", `${icons.check} ${right}`),
      el("span", "is-bad", `${icons.cross} ${mine.length - right}`)
    );
    const bhead = el("div", "aw-sd-rv-name");
    bhead.append(who, tally);
    block.append(bhead);

    mine.forEach(({ r, n }) => {
      const line = el("div", "aw-sd-rv-q");
      line.append(el("span", "aw-sd-rv-num", String(n)));
      const body = el("div", "aw-sd-rv-body");
      const clue = el("div", "aw-sd-rv-clue");
      clue.textContent = r.question || "";
      body.append(clue);
      const ans = el("div", "aw-sd-rv-ans");
      if (r.answered && r.yourCorrect) {
        ans.append(mark("is-ok", icons.check, r.correctText));
      } else {
        // Wrong (or never attempted) shows BOTH lines: what the pupil put, then
        // what it should have been — same reading order as the normal review.
        ans.append(mark("is-bad", icons.cross, r.answered ? r.yourText : "No answer"));
        ans.append(mark("is-ok", icons.check, r.correctText));
      }
      body.append(ans);
      line.append(body);
      // ⭐ Đợt 174c — how long THIS question took, at the FAR RIGHT of the row,
      // just past the answer blocks (teacher: "chuyển thời gian làm của câu ra
      // đứng ngay bên cạnh phải của cụm ô kết quả"). It was riding on the clue
      // before, where it read as part of the question. A third flex child of the
      // row, NOT a third grid track of `.aw-sd-rv-body`: the body's 1.4fr/1fr
      // split is measured for clue-vs-answers and must not move, and a row with
      // no time simply leaves this column empty.
      line.append(el("span", "aw-sd-rv-qtime",
        typeof r.roundMs === "number" ? fmtRoundMs(r.roundMs) : ""));
      block.append(line);
    });

    list.append(block);
  });

  host.append(list);
}

/**
 * ⭐ Đợt 174 — a round's duration, for the review only.
 * ⭐ Đợt 176 — reshaped to MATCH THE LIVE ROUND CLOCK (teacher: "Thời gian trong
 * show answers cũng hiển thị dạng tương tự"): bare seconds under a minute, m:ss
 * past it, plus HUNDREDTHS after a comma in smaller type — "30,18" / "1:02,40".
 * Returns markup (the small-type span), so the ONLY safe sinks are `el()`'s
 * html argument / innerHTML on nodes that never carry user text — every
 * character here comes from Number() and padStart, nothing else.
 */
export function fmtRoundMs(ms) {
  // Integer maths on the ms, not float seconds: 62400/1000 − 62 is 0.39999…,
  // which floors a clean 400ms into ",39".
  const m = Math.round(Math.max(0, Number(ms) || 0));
  const whole = Math.floor(m / 1000);
  const cents = Math.floor((m % 1000) / 10);
  const main = whole < 60 ? String(whole) : `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
  return `${main}<span class="aw-sd-rv-dec">,${String(cents).padStart(2, "0")}</span>`;
}

/**
 * ⭐ Đợt 176 — % correct OF THE QUESTIONS ACTUALLY ATTEMPTED (teacher: "không
 * tính % cho các câu chưa làm"), banded into the classroom's colour read:
 * ≤60 đỏ · 61-72 vàng · 73-84 cam · 85-94 xanh dương · ≥95 xanh lá (the two
 * endpoints are the teacher's own numbers, the middle split is ours).
 * Returns the band class for CSS; null when nothing was attempted — a pupil
 * who never got a turn shows no percentage at all rather than a red 0%.
 */
export function pctBand(pct) {
  if (pct <= 60) return "is-p0";
  if (pct <= 72) return "is-p1";
  if (pct <= 84) return "is-p2";
  if (pct < 95) return "is-p3";
  return "is-p4";
}

function mark(cls, glyph, text) {
  const box = el("div", "aw-sd-rv-mk " + cls);
  const txt = el("span", "aw-sd-rv-mktxt");
  txt.textContent = String(text || "");
  box.append(el("span", "aw-sd-rv-mkicon", glyph), txt);
  return box;
}
