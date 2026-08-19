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

// ⚠️ NO IMPORTS AT ALL, and keep it that way. Đợt 177 moved the review's DOM
// out to core/showdown-review.js, which took `el`/`icons` with it — what is left
// here is the mode's RULES (who plays which question, how a play is tallied, how
// pupils rank), all of it pure data-in/data-out. That is what makes this file
// safe for core/engine.js to import statically on the student page.

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
      members,
      // ⭐ Đợt 197 — two fields the setup panel now stamps on, because only IT can
      // see the whole table and the engine must not import the file that can.
      //   `maxTeam`  the biggest team's size — Balance questions divides by it.
      //   `tableId`  which division of the class this is — the durable result
      //              history groups one match by it.
      // ⚠️ Both fall back rather than invalidating the pick: a pick written
      // before this đợt is still a perfectly good pick, and a Showdown that
      // refused to start because of a missing optional field would be a far
      // worse bug than the two features quietly standing down.
      maxTeam: Math.max(1, Number(p.maxTeam) || members.length),
      tableId: String(p.tableId || "")
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
// ⭐⭐ Đợt 196 — THE OUTBOX: the result this column still owes the shared board
// ---------------------------------------------------------------
// A finished play used to be published ONCE, fire-and-forget: a failure was a
// console warning nobody reads, and that team was then missing from every other
// column for the rest of the lesson with no symptom anywhere (the teacher's A1B
// report, 19/8/2026 — three boards agreed on 13 of 18 pupils and the fourth sat
// alone with 5, blind in both directions). What cannot be sent now waits HERE
// until core/showdown-setup.js's flushPendingResult() can get it out.
//
// ⚠️ `sessionStorage`, for exactly the reason the pick is there (see the header):
// four myActivity columns share one localStorage, and column 2's unsent result
// must never be re-sent by column 3 wearing column 3's name.
// ⚠️ It lives in THIS file — the pure one core/engine.js imports statically — so
// the engine can ask "do I still owe a row?" and paint the warning on the first
// frame, without dragging the Firestore layer on to the student page.
const PENDING_KEY = "aword-showdown-pending";

/** The finished-but-not-yet-shared result, or null. */
export function readPendingResult() {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const e = JSON.parse(raw);
    return e && e.teamId ? e : null;
  } catch { return null; }        // private mode / storage disabled / bad JSON
}

export function writePendingResult(entry) {
  try { sessionStorage.setItem(PENDING_KEY, JSON.stringify(entry)); } catch { /* storage disabled */ }
}

export function clearPendingResult() {
  try { sessionStorage.removeItem(PENDING_KEY); } catch { /* storage disabled */ }
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
// ONE PUPIL'S PLAY — the shape everything downstream reads
// ---------------------------------------------------------------
// ⭐ Đợt 177 (17/8/2026) — this used to be an anonymous `.map()` inside the
// review renderer. It is now a named, exported shape because THREE different
// consumers must agree on it to the last digit:
//   1. Show answers, team scope   (core/showdown-review.js, from memory)
//   2. Show answers, class scope  (the same, from what other teams SYNCED)
//   3. the payload this browser WRITES to Firestore when its game ends
//      (core/engine.js → core/showdown-setup.js's saveTeamResult)
// If (3) were computed anywhere else, one team's row on the class board could
// count differently from the same team's own screen — a disagreement nobody
// would spot until a pupil argued with the projector.
//
// A block is deliberately PLAIN DATA (no DOM nodes, no member object): it is
// JSON-serialisable exactly as it stands, which is what lets the same object be
// rendered locally and shipped to the other screens without a second mapper.
//
//   { key, name, ord, teamName, total, attempted, right, wrong, hasTime, ms,
//     rows: [{ n, question, yourText, correctText, answered, correct, roundMs }] }
//
// ⚠️ `wrong` counts NEVER-ANSWERED questions too (`total - right`), which is
// what the ✗ tally has always shown. `attempted` is the separate, smaller
// number the percentage is taken of — see pctBand's own note.
export function groupByMember(review, members) {
  const rows = review || [];
  const list = members || [];
  return list.map((m, mi) => {
    // Every question that fell to this member — decided by `memberAt`, the SAME
    // call the engine used to put a name over the frame during the game. Asking
    // one rule twice is what keeps the review from ever disagreeing with what
    // the class actually saw; re-deriving `i % members.length` here would be a
    // second copy of the turn rule, free to drift.
    const mine = [];
    rows.forEach((r, i) => {
      if (memberAt(list, i) !== m) return;
      mine.push({
        n: i + 1,
        question: String(r.question || ""),
        yourText: String(r.yourText || ""),
        correctText: String(r.correctText || ""),
        answered: !!r.answered,
        correct: !!(r.answered && r.yourCorrect),
        roundMs: typeof r.roundMs === "number" ? Math.round(r.roundMs) : null
      });
    });
    const timed = mine.filter(x => x.roundMs != null);
    const right = mine.filter(x => x.correct).length;
    return {
      key: String(m.id || m.name || mi), name: String(m.name || ""), ord: mi, teamName: "",
      rows: mine,
      total: mine.length,
      attempted: mine.filter(x => x.answered).length,
      right,
      wrong: mine.length - right,
      hasTime: timed.length > 0,
      ms: timed.reduce((a, x) => a + x.roundMs, 0)
    };
  }).filter(b => b.total);
}

/**
 * ⭐⭐ Đợt 197 — ONE ROW PER CHILD, out of several teams' worth of blocks.
 *
 * Lifted here (from an anonymous body inside core/showdown-review.js's
 * `buildClass`) because there are now TWO screens that have to answer "who is in
 * this class board" and they must answer it identically to the last pupil: the
 * live Show answers, and the durable Recently results of the setup panel. Two
 * copies of a dedupe rule is two rules the day after.
 *
 * `groups` — one per team: `{ teamName, at, blocks }`.
 *   `at === undefined` marks an AUTHORITATIVE group: the play this very screen
 *   just watched, held in memory. It always wins, even against a newer published
 *   row, because a screen must never show a team a worse result than the one the
 *   class saw happen. Every other group carries the ms it was published at.
 *
 * WHY DEDUPE AT ALL: the published rows are a map keyed by TEAM, so nothing in
 * the storage layer can stop one pupil arriving from two of them — a pupil MOVED
 * between teams leaves a row behind that keeps their name for as long as it
 * lives, and both rows are honest records of a game that really was played.
 *
 * ⚠️ IDENTITY IS THE PUPIL'S ID, the name only as a fallback. Two different
 * children in one class really can share a full name (Vietnamese classes
 * regularly do) and merging THEM would hide a pupil — the same bug pointed the
 * other way. Every id comes from the one shared team table, so the same child
 * carries the same id on every screen.
 *
 * `ord` is reassigned AFTER the dedupe: it is rankBlocks' tie-breaker of last
 * resort and has to be unique across the merged list, not per team.
 */
export function mergeClassBlocks(groups) {
  const out = [];
  (groups || []).forEach(g => {
    (g?.blocks || []).forEach(b => out.push({ ...b, teamName: g.teamName || "", _at: g.at }));
  });
  const byPupil = new Map();
  out.forEach(b => {
    const key = String(b.key || "").trim() || String(b.name || "").trim().toLowerCase();
    const prev = byPupil.get(key);
    if (!prev) { byPupil.set(key, b); return; }
    const prevIsOurs = prev._at === undefined;
    if (prevIsOurs) return;                            // ours always wins
    if (b._at === undefined || (b._at || 0) > (prev._at || 0)) byPupil.set(key, b);
  });
  const merged = [...byPupil.values()];
  merged.forEach((b, i) => { b.ord = i; });
  return merged;
}

// ---------------------------------------------------------------
// THE RANKING — one comparator, every screen
// ---------------------------------------------------------------
// ⭐ Đợt 174c (teacher: "có tổng số câu đúng nhiều hơn đứng trên, có tổng số câu
// đúng bằng nhau thì thời gian làm ngắn hơn đứng trên").
// ⚠️ A pupil with no timed rounds sorts as if they took no time at all, which
// would put them above a faster-but-timed pupil on a tie. `hasTime` keeps them
// BELOW instead: no measurement is not a good measurement.
// Sorts a COPY: the class board holds one array that both the list and the
// podium read, and a comparator that reordered it in place would silently
// change what "the team's own order" means on the next tie.
export function rankBlocks(blocks) {
  return (blocks || []).slice().sort((a, b) => {
    if (b.right !== a.right) return b.right - a.right;          // more correct first
    if (a.hasTime !== b.hasTime) return a.hasTime ? -1 : 1;      // a measured time beats none
    if (a.hasTime && a.ms !== b.ms) return a.ms - b.ms;          // then the quicker of the two
    return (a.ord || 0) - (b.ord || 0);                          // still tied: the team's own order
  });
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
 * ⭐⭐ Đợt 207 (thầy, 20/8/2026) — ONE PERCENTAGE, OUT OF EVERY QUESTION THE
 * PUPIL WAS DEALT: *"Mọi tên đều được tính %, kể cả 0% hoặc không làm đúng câu
 * nào… Các câu không làm hoặc không làm kịp vẫn được tính vào % đầy đủ."*
 *
 * ⛔⛔ THIS REVERSES ĐỢT 176 ON PURPOSE. That đợt divided by `attempted` (thầy
 * then: "không tính % cho các câu chưa làm") and HID the figure entirely when a
 * pupil had attempted nothing, so a child the game never reached showed no
 * percentage rather than a red 0%. Thầy has now asked for the opposite reading:
 * a question left undone is a question got wrong, and EVERY name carries a
 * number. Do not "restore" the old denominator — it is not a bug.
 *
 * ⚠️ ONE function, THREE screens (the funnel, the per-question list, and the
 * Recently results ledger drawn by core/showdown-setup.js). Đợt 176 wrote this
 * arithmetic out twice and the copies stayed in step only because nothing
 * underneath them ever changed; a third copy in the history screen is exactly
 * what this exists to prevent.
 *
 * ⚠️ Worth saying out loud: `right + wrong === total` already (see
 * groupByMember — `wrong` has always counted never-answered rows), so this is
 * exactly `✓ / (✓ + ✗)`, the two numbers printed beside it. Consequence: OLD
 * matches in the durable ledger now read a different % than they did before this
 * đợt. Their stored counts are untouched; only the sum on screen changed, and it
 * changed on every screen at once.
 *
 * Returns null ONLY when the pupil was dealt no question at all — there is no
 * percentage of nothing, and 0% there would be a lie about a child who never
 * had a turn.
 */
export function pctOf(b) {
  const total = Math.max(0, Number(b?.total) || 0);
  if (!total) return null;
  const right = Math.max(0, Number(b?.right) || 0);
  return Math.round((right / total) * 100);
}

/**
 * ⭐ Đợt 176 — the colour band of a percentage, for the classroom's colour read:
 * ≤60 đỏ · 61-72 vàng · 73-84 cam · 85-94 xanh dương · ≥95 xanh lá (the two
 * endpoints are the teacher's own numbers, the middle split is ours).
 * ⚠️ Đợt 207 — the NUMBER being banded now comes from `pctOf` above (out of
 * every question dealt). The bands themselves are untouched, so "green" still
 * means to the class what it has always meant.
 */
export function pctBand(pct) {
  if (pct <= 60) return "is-p0";
  if (pct <= 72) return "is-p1";
  if (pct <= 84) return "is-p2";
  if (pct < 95) return "is-p3";
  return "is-p4";
}

// ---------------------------------------------------------------
// NAME ABBREVIATION (Đợt 166, moved here in Đợt 207)
// ---------------------------------------------------------------
// The LAST resort for a name that still does not fit after the size it is drawn
// at has been shrunk as far as it may go. Teacher, 15/8/2026: "có thể sử dụng
// tên viết tắt để đều hơn bố cục bảng, ví dụ Nguyễn Bảo Anh có thể thành
// N.B.Anh". Keeps the LAST word — the part a Vietnamese name is actually called
// by — in full, and reduces every word before it to an initial. A one-word name
// (a roll typed by hand, a foreign pupil) comes back unchanged: there is nothing
// to abbreviate, and initials alone would be unreadable.
//
// ⚠️ A DISPLAY TRANSFORM ONLY — every id/name a claim, a review row or Firestore
// ever sees is still the pupil's real name; only `.textContent` is swapped, and
// only when it does not fit, with the full name kept as the `title` tooltip.
//
// ⚠️ Đợt 207 — lifted out of core/showdown-setup.js (where it has lived since
// Đợt 166) into this pure file, because the RESULT BOARDS now need it too and
// core/showdown-review.js may not import the setup panel: that file reaches
// Firestore and the library, and the review is imported STATICALLY by the engine
// (see this file's header, luật 2 of v0.9.0). showdown-setup.js re-exports it
// under its old name, so nothing that used to import it from there had to change.
export function shortenName(full) {
  const parts = String(full || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return full;
  const last = parts[parts.length - 1];
  const initials = parts.slice(0, -1).map(w => w[0]).join(".");
  return `${initials}.${last}`;
}
