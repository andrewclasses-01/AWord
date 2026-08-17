// =============================================================
// SHOWDOWN SETUP — the shared team table, and the panel that builds it
// (Đợt 155, rebuilt in Đợt 156 to the teacher's own three-screen design).
// Read core/showdown.js's header first: it explains what the mode is and why
// the CHOICE of team is per-browser while this TABLE is not.
//
// ⚠️ DYNAMIC-IMPORT ONLY, from the teacher's SHOWDOWN button. This file reaches
// Firestore and core/classes.js, and the core contract (HUONG DAN CORE.md, luật
// 2 of v0.9.0) is that the student page must never download code that can reach
// the library layer.
//
// ---------------------------------------------------------------------------
// THE THREE SCREENS (teacher's design, 14/8/2026)
// ---------------------------------------------------------------------------
//   A. SETUP   class + number of teams, both big. Once a class is picked its
//              pupils appear below and can be removed, or added by hand.
//              → NEXT
//   B. BUILD   every pupil as a chip in a pool along the top; the teams as
//              vertical columns below. Tap a team's name to select it, then tap
//              a chip and it FLIES into that column. Tick the team this browser
//              plays. → READY
//   C. RUNNING once set up, the button opens a short panel instead: RESET TEAM
//              (build again) or SINGLE MODE (leave Showdown).
//
// ⚠️ All three keep the SAME panel footprint (teacher: "size của các bảng đều to
// bằng nhau, dù nội dung có ít hơn"). That is `.aw-sd-body`'s fixed min-height /
// width in core/app.css — NOT something to "tidy up" later: a popover that
// resizes under the teacher's finger between steps is what it exists to avoid.
//
// ---------------------------------------------------------------------------
// WHERE THE TABLE IS STORED, AND WHAT A CLAIM IS
// ---------------------------------------------------------------------------
// One document, `users/{uid}/items/sd_main`, kind "showdown" — the same
// collection the class rolls live in, for the reason core/classes.js gives at
// length: the Firestore rules open exactly one path for the teacher's own data,
// so a new top-level collection would be DENIED until somebody edited the rules
// in the Firebase console by hand.
//
//   { classId, className, teams:[{id,name,members:[{id,name}]}],
//     claims: { [teamId]: { by: <browserId>, at: <ms> } } }
//
// A CLAIM is what makes "one team per browser" real: a team ticked here vanishes
// from every other browser's table (teacher, 14/8/2026). Claims are read fresh
// whenever the panel opens AND watched live while it is open, so a column that
// claims a team makes it disappear under the other columns' noses.
//
// ⚠️ CLAIMS MUST EXPIRE. The claimant id lives in `sessionStorage`, so a browser
// that is simply CLOSED can never release what it held — without a TTL the team
// would be unusable forever and the only way out would be rebuilding the table.
// =============================================================

import { el } from "./utils.js";
import { sound } from "./sound.js";
import { icons } from "./icons.js";
import { db, fs, currentUser } from "./firebase.js";
import { makeHStepper } from "./numberstepper.js";
import { MIN_TEAMS, MAX_TEAMS, MAX_PER_TEAM, SOLO_TEAM_ID, browserId, writePick, clearPick } from "./showdown.js";

const DOC_ID = "sd_main";
// A claim older than this is treated as abandoned. Long enough to cover a whole
// teaching day (a match left running through a break must not be stolen), short
// enough that yesterday's claims never block this morning's lesson.
const CLAIM_TTL_MS = 12 * 60 * 60 * 1000;

// ---------------------------------------------------------------
// SIZING (Đợt 166, 15/8/2026) — the panel's width and the columns screen's
// font/spacing both now adapt to whatever room is REAL, instead of the fixed
// per-team-count tiers Đợt 159/159b tried. Two complaints drove this, from the
// same teacher's-eye test in myActivity's multi-column view:
//   • 1-2 teams, one column (or the plain single-window case): the panel used
//     to claim the whole frame width, so a column with one flex share of it
//     became a long, mostly-empty rectangle around a short name.
//   • 4-5 teams inside a narrow myActivity column: BOTH the frame's width AND
//     the real room above the toolbar shrink together, and the flat chip size
//     tuned for a normal window no longer fit ten rows — the panel scrolled
//     and, because Đợt 159b moved Ready/Reset/Random off a sticky header, that
//     scroll could hide the only way out of the popover.
// `SD_COL_MAXW` doubles as the ceiling in `.aw-sd-col`'s CSS (keep the two in
// sync) and the unit `updatePanelWidth` multiplies by team count.
const SD_COL_MAXW = 200;
const SD_COL_GAP = 10;
const SD_PANEL_PAD = 40;    // `.aw-tool-panel`'s own left+right padding (20+20)
const SD_PANEL_MIN = 460;   // screen A's class/Teams row needs at least this
// The is-side layout's pool (app.css, ≤3 teams): a FIXED 2-column grid, sized
// at Đợt 159b for the longest test name. `SD_SIDE_GAP` is the row gap between
// it and the columns (`.aw-sd-layer.aw-sd-build.is-side`'s own `gap:12px`).
const SD_SIDE_POOL_W = 360;
const SD_SIDE_GAP = 12;
// Below this, even the pool alone (its CSS is a flat 360px, not something this
// file may shrink without reopening the Đợt 159b "longest name" math) will not
// fit next to any column at all — fitBuildScreen() switches the pool to a
// PROPORTIONAL width instead of the fixed 360 once the frame is this tight.
const SD_SIDE_POOL_MIN = 170;
// How far `fitBuildScreen()` may shrink the columns screen before giving up
// and letting `.aw-tool-panel`'s own `overflow-y:auto` take over (which, per
// the note above, would rather never happen). 1 = the Đợt 159 comfortable
// sizes below; every ordinary desktop window still resolves to 1 unchanged.
const SD_FIT_MIN = 0.6;
// The Đợt 159 numbers, now the t=1 END of the fit range rather than the only
// values that exist.
const SD_FIT_MAX = {
  chipFs: 14.5, chipFsWide: 13,       // 14.5 at ≤3 teams, 13 at 4-5 (Đợt 159)
  colGap: 3, colchipPadV: 5, colchipPadH: 10, colheadMb: 8, colPad: 8,
  // is-top's pool (see app.css) — at the comfortable default it can claim the
  // WHOLE height budget in a cramped column on its own, leaving nothing for
  // the columns underneath no matter how far everything else shrinks.
  poolMaxh: 170
};
const SD_FIT_MIN_PX = {
  // Floors, not zero: below these the chip stops being tappable/readable, and
  // that is the point where a name should abbreviate instead of the whole
  // column keep shrinking (see shrinkOverflowingNames()).
  chipFs: 10.5, colGap: 1, colchipPadV: 2, colchipPadH: 5, colheadMb: 3, colPad: 4,
  poolMaxh: 60   // enough for ~2 rows of the smallest chip — still a usable staging area
};

// ---- Firestore plumbing (mirrors core/classes.js; same collection, own cache)
let cache = null;
let cacheUid = null;

export function resetShowdownCache() { cache = null; cacheUid = null; }

async function requireUid() {
  const user = await currentUser();
  if (!user) {
    const err = new Error("Please sign in to use Showdown.");
    err.code = "aw/signed-out";
    throw err;
  }
  return user.uid;
}

// Firestore rejects `undefined`, so drop those keys before writing.
function clean(value) {
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) if (v !== undefined) out[k] = clean(v);
    return out;
  }
  return value;
}

// Tolerant on read — a table written by an older build, or half-written, must
// never break the panel.
function normalize(raw) {
  const teams = Array.isArray(raw?.teams) ? raw.teams : [];
  const claims = {};
  const rawClaims = (raw && typeof raw.claims === "object" && raw.claims) || {};
  for (const [teamId, c] of Object.entries(rawClaims)) {
    const at = Number(c?.at) || 0;
    const by = String(c?.by || "");
    if (by && at) claims[teamId] = { by, at };
  }
  return {
    id: DOC_ID, kind: "showdown", root: "showdown", parentId: null, trashed: false,
    classId: String(raw?.classId || ""),
    className: String(raw?.className || "").trim(),
    teams: teams.slice(0, MAX_TEAMS).map((t, i) => ({
      id: String(t?.id || `sdt_${i + 1}`),
      name: String(t?.name || "").trim() || `Team ${i + 1}`,
      members: (Array.isArray(t?.members) ? t.members : [])
        .map(m => ({ id: String(m?.id || ""), name: String(m?.name || "").trim() }))
        .filter(m => m.name)
    })),
    claims,
    updatedAt: Number(raw?.updatedAt) || 0
  };
}

/** Is this claim still binding on OTHER browsers? */
export function claimIsLive(claim, now = Date.now()) {
  return !!claim && now - claim.at < CLAIM_TTL_MS;
}

/**
 * Teams this browser may TAKE: unclaimed, expired, or already ours.
 * ⚠️ Đợt 159 — this no longer decides what is DRAWN. Teams held elsewhere used
 * to be filtered out of the table entirely; the teacher's new rule is that every
 * team stays on screen and the taken ones are dimmed and inert, so the panel
 * asks `claimIsLive()` per column and this helper is only about permission.
 */
export function takeableTeams(setup, me, now = Date.now()) {
  return setup.teams.filter(t => {
    const c = setup.claims[t.id];
    return !claimIsLive(c, now) || c.by === me;
  });
}

export async function loadSetup({ fresh = false } = {}) {
  const uid = await requireUid();
  if (!fresh && cache && cacheUid === uid) return cache;
  const [d, { doc, getDoc }] = await Promise.all([db(), fs()]);
  const snap = await getDoc(doc(d, `users/${uid}/items`, DOC_ID));
  cache = snap.exists() ? normalize(snap.data()) : normalize({});
  cacheUid = uid;
  return cache;
}

export async function saveSetup(setup) {
  const uid = await requireUid();
  const node = normalize({ ...setup, updatedAt: Date.now() });
  const [d, { doc, setDoc }] = await Promise.all([db(), fs()]);
  await setDoc(doc(d, `users/${uid}/items`, DOC_ID), clean(node));
  cache = node; cacheUid = uid;
  return node;
}

/**
 * Watch the table while the panel is open, so a team claimed by another column
 * disappears here without the teacher having to close and reopen.
 * Returns an unsubscribe function (a no-op if the listener could not start —
 * the panel then simply keeps the snapshot it loaded, which is still correct at
 * the moment it opened).
 */
export function subscribeSetup(onChange) {
  let stop = null, dead = false;
  (async () => {
    try {
      const uid = await requireUid();
      const [d, { doc, onSnapshot }] = await Promise.all([db(), fs()]);
      if (dead) return;
      stop = onSnapshot(doc(d, `users/${uid}/items`, DOC_ID), snap => {
        const next = normalize(snap.exists() ? snap.data() : {});
        cache = next; cacheUid = uid;
        onChange(next);
      }, () => { /* permission/network — keep what we have */ });
    } catch { /* signed out: nothing to watch */ }
  })();
  return () => { dead = true; if (stop) { try { stop(); } catch { /* already gone */ } } };
}

/**
 * Give back every team THIS browser is holding (Đợt 158).
 *
 * ⚠️ This used to exist only as a closure inside the panel, which meant the two
 * ways of leaving Showdown that do NOT go through the panel — the mode picker's
 * "Single mode", and entering Fight — dropped the local pick and left the CLAIM
 * standing on Firestore. Nothing looked wrong on this screen; the damage was on
 * the OTHER screens, where that team stayed invisible for the rest of the 12h
 * TTL. Anything that ends Showdown must call this.
 *
 * Never throws: signed out or offline, the TTL is still the backstop, and a
 * failure here must not stop the teacher from leaving the mode.
 */
export async function releaseMyClaim() {
  const me = browserId();
  try {
    const fresh = await loadSetup({ fresh: true });
    let touched = false;
    Object.entries(fresh.claims).forEach(([tid, c]) => {
      if (c.by === me) { delete fresh.claims[tid]; touched = true; }
    });
    if (touched) await saveSetup(fresh);
  } catch { /* signed out or offline — the TTL will clear it */ }
}

/**
 * Đợt 168 — wipe the ENTIRE shared table: every team, every claim, the class
 * itself. "Reset teams" calls this instead of `releaseMyClaim()` — the
 * teacher's own words: "reset mọi thứ liên quan tới bảng showdown luôn...
 * mọi trình duyệt đều được xóa, không bị vướng vào việc đang mắc ở 1 đội nào
 * đó" (reset everything about the table right away; no browser stays stuck
 * holding a team). `releaseMyClaim()` only ever touched rows where
 * `c.by === me`; this touches the whole document, so it is not "release mine,
 * then also clear the rest" — it is the one write that replaces it.
 *
 * ⚠️ Reach: a browser with the SETUP PANEL open right now sees this live —
 * `boot()`'s `subscribeSetup` callback now syncs `setup.teams` too (not just
 * `claims`), and bounces itself back to screen A when the table it was
 * looking at is suddenly empty. A browser that is mid-GAME (panel closed, its
 * pick sitting only in its own `sessionStorage`) has no channel this can
 * reach — cross-tab `sessionStorage` writes do not exist — so that play just
 * finishes normally; the shared team it would have returned a claim to is
 * simply gone by then, the same outcome as any claim that outlived its TTL.
 *
 * Never throws, same reason as releaseMyClaim(): signed out or offline must
 * not stop the teacher from leaving the reset confirm.
 */
export async function wipeSetup() {
  try { await saveSetup({ classId: "", className: "", teams: [], claims: {} }); }
  catch { /* signed out or offline — nothing was shared yet, nothing to wipe */ }
  // ⭐ Đợt 177 — the RESULT board goes with the team table. Leaving it would let
  // a freshly rebuilt set of teams open a class board still holding yesterday's
  // line-up: the same team ids (`sdt_1`…) are handed out again by
  // splitIntoTeams(), so the stale rows would not even look foreign.
  try { await wipeResults(); } catch { /* same reason as above */ }
}

// ---------------------------------------------------------------
// THE SHARED RESULT BOARD (Đợt 177, 17/8/2026)
// ---------------------------------------------------------------
// Teacher: "khi hoàn thành game của 1 đội, kết quả đội đó tự đồng bộ vào kết quả
// các đội và sẵn sàng cho các đội khác đọc." So a finished play PUSHES its team's
// tally here, and any screen's Show answers can PULL the whole class back.
//
// Its own document — `users/{uid}/items/sd_results`, beside `sd_main` for the
// same rules reason (see this file's header). Keeping it out of `sd_main` is
// deliberate: the team table is read on every panel open and is edited by hand,
// while this can carry every question of every pupil of five teams. One does not
// belong inside the other.
//
//   { teams: { [teamId]: { teamId, teamName, roundKey, actName, classId,
//                          className, at, students: [ <block> ] } } }
//
// ⚠️ WHY `roundKey` AND NOT `activity.id`
//   core/convert.js gives a "Change template" play a RANDOM id, so two columns
//   that both switched to Quiz would each invent their own — the boards would
//   never find each other. The engine therefore keys on the ORIGIN act (the
//   library act every column opened), which is the one id they all share.
//   Reading filters on it, so a team still playing last lesson's act is simply
//   not on this board rather than silently added to its totals.
//
// ⚠️ WHY THE WRITE IS A `merge`, NOT read-modify-write
//   Two columns finishing seconds apart would both read the document, both add
//   their own team, and the second write would drop the first team's row —
//   invisibly, because each screen would still show its own result correctly.
//   A merged write of ONE map key is settled by the server per field, so no
//   round trip of ours can lose another's. (Arrays are replaced wholesale by
//   merge, which is exactly right for `students`: a replay must not leave a
//   longer previous line-up half-standing underneath.)
const RESULTS_DOC = "sd_results";
// Questions and answers are the teacher's own text and can be a whole sentence;
// five teams of ten pupils would still sit far inside Firestore's 1MB document
// limit, but the cap keeps one pathological act from ever reaching it.
const TEXT_CAP = 180;

const cut = s => String(s || "").slice(0, TEXT_CAP);

function normalizeResults(raw) {
  const teams = {};
  const rawTeams = (raw && typeof raw.teams === "object" && raw.teams) || {};
  for (const [teamId, t] of Object.entries(rawTeams)) {
    if (!t || typeof t !== "object") continue;
    teams[teamId] = {
      teamId: String(t.teamId || teamId),
      teamName: String(t.teamName || "").trim() || "Team",
      roundKey: String(t.roundKey || ""),
      actName: String(t.actName || ""),
      classId: String(t.classId || ""),
      className: String(t.className || "").trim(),
      at: Number(t.at) || 0,
      students: (Array.isArray(t.students) ? t.students : []).map(s => ({
        key: String(s?.key || ""),
        name: String(s?.name || "").trim(),
        ord: Number(s?.ord) || 0,
        teamName: String(s?.teamName || ""),
        total: Number(s?.total) || 0,
        attempted: Number(s?.attempted) || 0,
        right: Number(s?.right) || 0,
        wrong: Number(s?.wrong) || 0,
        hasTime: !!s?.hasTime,
        ms: Number(s?.ms) || 0,
        rows: (Array.isArray(s?.rows) ? s.rows : []).map(r => ({
          n: Number(r?.n) || 0,
          question: String(r?.question || ""),
          yourText: String(r?.yourText || ""),
          correctText: String(r?.correctText || ""),
          answered: !!r?.answered,
          correct: !!r?.correct,
          roundMs: typeof r?.roundMs === "number" ? r.roundMs : null
        }))
      })).filter(s => s.name)
    };
  }
  return teams;
}

/**
 * Publish THIS browser's team result. Called by core/engine.js the moment a
 * Showdown play finishes.
 *
 * ⚠️ Throws when signed out — the caller (engine.js's finish) treats that as a
 * warning in the console and nothing more. A teacher playing offline still sees
 * their own team's Show answers in full; only the class board is short.
 */
export async function saveTeamResult({ pick, roundKey, actName = "", students }) {
  if (!pick?.teamId) return null;
  // ⭐⭐ Đợt 180 — A SOLO PICK NEVER PUBLISHES. One-team mode is the whole class
  // in ONE browser and is documented at SOLO_TEAM_ID / applySolo() as never
  // touching Firestore at all — but core/engine.js's finish() only ever asked
  // "is there a pick?", so it published `sd_solo` like any other team.
  //
  // What that cost (measured 17/8/2026, teacher's own class of 15):
  // a solo play earlier in the day left a `sd_solo` row holding ALL FIFTEEN
  // pupils. Later the same act was played properly as 3 teams of 5, and the
  // class board added that row to the three real ones — 5 (ours, from memory)
  // + 5 + 5 + 15 = **30 pupils, every child listed exactly twice**. Nothing on
  // screen could explain it: each team's own board was right, and the stale row
  // wore the class's own name.
  //
  // Guarded BEFORE `requireUid()` on purpose: solo is the one mode that is
  // meant to work signed out, and it must not throw on its way to doing nothing.
  if (pick.teamId === SOLO_TEAM_ID) return null;
  const uid = await requireUid();
  const entry = {
    teamId: String(pick.teamId),
    teamName: String(pick.teamName || "Team"),
    roundKey: String(roundKey || ""),
    actName: cut(actName),
    classId: String(pick.classId || ""),
    className: String(pick.className || ""),
    at: Date.now(),
    students: (students || []).map(s => ({
      key: String(s.key || ""), name: String(s.name || ""), ord: Number(s.ord) || 0,
      total: Number(s.total) || 0, attempted: Number(s.attempted) || 0,
      right: Number(s.right) || 0, wrong: Number(s.wrong) || 0,
      hasTime: !!s.hasTime, ms: Math.round(Number(s.ms) || 0),
      rows: (s.rows || []).map(r => ({
        n: Number(r.n) || 0,
        question: cut(r.question), yourText: cut(r.yourText), correctText: cut(r.correctText),
        answered: !!r.answered, correct: !!r.correct,
        roundMs: typeof r.roundMs === "number" ? Math.round(r.roundMs) : null
      }))
    }))
  };
  const [d, { doc, setDoc }] = await Promise.all([db(), fs()]);
  await setDoc(
    doc(d, `users/${uid}/items`, RESULTS_DOC),
    clean({
      kind: "showdown-results", root: "showdown", parentId: null, trashed: false,
      teams: { [entry.teamId]: entry },
      updatedAt: entry.at
    }),
    { merge: true }
  );
  return entry;
}

/**
 * Every team that has published a result for THIS act — the caller's own team
 * included (core/showdown-review.js drops it and uses its live copy instead).
 * Always read FRESH: the whole point of the button that calls this is that
 * another team has just finished, so a cache would be answering the wrong
 * question.
 */
export async function loadTeamResults(roundKey) {
  const uid = await requireUid();
  const [d, { doc, getDoc }] = await Promise.all([db(), fs()]);
  const snap = await getDoc(doc(d, `users/${uid}/items`, RESULTS_DOC));
  const teams = normalizeResults(snap.exists() ? snap.data() : {});
  const key = String(roundKey || "");
  return Object.values(teams)
    // ⭐ Đợt 180 — and never a SOLO row. saveTeamResult() no longer writes one,
    // but every document written before today may still hold one, and it is the
    // whole class on its own: left in, it doubles every pupil on the board (see
    // that function's own note). Dropped on READ as well as on write so the bad
    // row disappears from the teacher's screen immediately, with no Reset teams
    // and no trip to the Firebase console.
    .filter(t => t.teamId !== SOLO_TEAM_ID)
    // An entry with no key at all is from a build older than this one; it is
    // still this teacher's own class, so let it through rather than hide a
    // result the teacher can see was recorded.
    .filter(t => !key || !t.roundKey || t.roundKey === key)
    .sort((a, b) => a.teamName.localeCompare(b.teamName));
}

/** Drop every published result (Reset teams — see wipeSetup). */
export async function wipeResults() {
  const uid = await requireUid();
  const [d, { doc, setDoc }] = await Promise.all([db(), fs()]);
  await setDoc(doc(d, `users/${uid}/items`, RESULTS_DOC), {
    kind: "showdown-results", root: "showdown", parentId: null, trashed: false,
    teams: {}, updatedAt: Date.now()
  });
}

// ---------------------------------------------------------------
// SPLITTING A ROLL INTO TEAMS
// ---------------------------------------------------------------
// Deal round-robin, not in blocks: with 10 pupils over 3 teams, blocks give
// 4/3/3 with the register's first four all together, while dealing gives the
// same 4/3/3 with the class spread across the teams.
export function splitIntoTeams(students, count, existing = []) {
  const n = Math.max(MIN_TEAMS, Math.min(MAX_TEAMS, Math.round(count) || MIN_TEAMS));
  const teams = Array.from({ length: n }, (_, i) => ({
    // Keep a team's identity across a re-split: a claim in another browser
    // names its team BY ID, and regenerating ids would silently orphan it.
    id: existing[i]?.id || `sdt_${i + 1}`,
    name: existing[i]?.name || `Team ${i + 1}`,
    members: []
  }));
  students.forEach((s, i) => teams[i % n].members.push({ id: String(s.id || ""), name: String(s.name || "") }));
  return teams;
}

let seq = 0;
function localId(prefix) { return `${prefix}_${Date.now().toString(36)}_${(seq++).toString(36)}`; }

// ---------------------------------------------------------------
// NAME ABBREVIATION (Đợt 166) — the LAST resort for a chip that still does not
// fit its column after fitBuildScreen() has shrunk the whole screen as far as
// it goes (see SD_FIT_MIN). Teacher, 15/8/2026: "có thể sử dụng tên viết tắt
// để đều hơn bố cục bảng, ví dụ Nguyễn Bảo Anh có thể thành N.B.Anh".
// Keeps the LAST word — the part a Vietnamese name is actually called by —
// in full, and reduces every word before it to an initial. A one-word name
// (roll added by hand, or a foreign pupil's name) is returned unchanged: there
// is nothing to abbreviate, and initials-only would make it unreadable.
// ⚠️ This is a display transform ONLY — every id/name a claim, a review row,
// or Firestore ever sees is still the pupil's real name from `roster`/`setup`;
// only the chip's `.textContent` (and only when it does not fit) is swapped,
// with the full name kept as its `title` tooltip.
export function shortenName(full) {
  const parts = String(full || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return full;
  const last = parts[parts.length - 1];
  const initials = parts.slice(0, -1).map(w => w[0]).join(".");
  return `${initials}.${last}`;
}

// ---------------------------------------------------------------
// THE PANEL
// ---------------------------------------------------------------
// Đợt 157 — the teacher's third pass: bigger name chips (a class is at most 20
// pupils, so there is room to make them properly tappable), a balanced layout on
// every step, and "mỗi bước chuyển, mỗi thao tác… đều phải có animation mượt"
// plus a sound for each.
//
// ⚠️ Two rules this file must keep, both learned the hard way elsewhere:
//   • EVERY `element.animate()` needs a `setTimeout` fallback — a hidden or
//     backgrounded tab freezes rAF and `onfinish` never fires, which would leave
//     a half-faded layer (or a flying ghost) parked over the panel for good.
//   • Do NOT put `transform`/`filter`/`opacity`<1 on `.aw-below-center` or any
//     ANCESTOR of it (the stacking-context contract in this file's sibling doc).
//     Everything animated below lives INSIDE `.aw-tool-panel`, which is safe.
//
// SOUND — Showdown's own little vocabulary, composed from the shared primitives
// in core/sound.js rather than added to it: these are this panel's idiom, and
// core/sound.js is used by all 17 games, so growing it for one caller would make
// every other game's sound list longer for nothing. `sound.glide` already
// respects the global mute, so nothing here has to check it.
const sfx = {
  tap:     () => sound.click(),
  forward: () => sound.glide({ freq: 620, freqEnd: 960, dur: 130, gain: 0.075, type: "sine" }),
  back:    () => sound.glide({ freq: 900, freqEnd: 560, dur: 130, gain: 0.06, type: "sine" }),
  land:    () => sound.glide({ freq: 780, freqEnd: 1180, dur: 90, gain: 0.07, type: "triangle" }),
  lift:    () => sound.glide({ freq: 1000, freqEnd: 700, dur: 90, gain: 0.055, type: "triangle" }),
  remove:  () => sound.glide({ freq: 520, freqEnd: 300, dur: 110, gain: 0.06, type: "triangle" }),
  add:     () => sound.glide({ freq: 700, freqEnd: 1050, dur: 110, gain: 0.07, type: "triangle" }),
  claim:   () => sound.tick(),
  ready:   () => { sound.tick(); sound.glide({ freq: 880, freqEnd: 1320, dur: 220, gain: 0.09, type: "triangle" }); }
};

/** Run `anim`, and guarantee `after()` happens even if onfinish never fires. */
function whenDone(anim, after, ms) {
  let done = false;
  const settle = () => {
    if (done) return;
    done = true;
    // `fill:"forwards"` holds the last keyframe; releasing it before the node is
    // touched is what stops elements ending up visually stuck mid-flight.
    try { anim.cancel(); } catch { /* already gone */ }
    after();
  };
  anim.onfinish = settle;
  setTimeout(settle, ms);
  return settle;
}

/**
 * @param {Element} panel  the tool popover to fill
 * @param {object} ctx
 *   currentTeam  the pick this browser is playing, or null (decides where the
 *                panel lands and which team starts out ticked)
 *   onApply   (pick) => void  — engine restarts the play; pick already stored
 *   onTurnOff () => void
 *   toast     the engine's toast
 */
export function buildShowdownPanel(panel, ctx) {
  const { onApply, onTurnOff, toast } = ctx;
  const me = browserId();

  // One fixed-size body for EVERY screen (see the header note) plus a footer.
  // Nothing below ever replaces `body` or `foot` themselves — screens render
  // into a LAYER inside them, which is what makes the cross-fade possible.
  // ⚠️ Đợt 159b — THERE IS NO HEAD ROW. It briefly carried the title and the two
  // mode icons; the teacher then asked for that whole strip back as table height
  // ("bỏ hẳn không gian cho khu vực chữ showdown ở góc trên"), with the title and
  // the icons moving into the bottom row. Everything this panel is, is now the
  // body plus that one row.
  const body = el("div", "aw-sd-body");
  const foot = el("div", "aw-sd-foot");
  panel.append(body, foot);

  // ⭐ Đợt 159b — AT MOST AS WIDE AS THE APP FRAME (teacher: "dãn chiều ngang lớn
  // hết cỡ bằng khung app để không phải scroll ngang"). A stated 860 was wider
  // than the frame on the teacher's own screen, which is exactly where the
  // sideways scrollbar came from.
  // ⭐ Đợt 166, ⛔ reverted Đợt 171 — briefly targeted a width for the CURRENT
  // team count (n × the column's own max-width, plus gaps/padding), retargeted
  // live on every Teams-stepper tap. That let 3→4 visibly resize the popover
  // mid-tap and, on the teacher's run, leave it looking closed and
  // unresponsive — see `updatePanelWidth`'s own comment below. It is now ONE
  // width, sized for MAX_TEAMS and never touched again after boot. Never below
  // `SD_PANEL_MIN`: screen A's class/Teams row needs that much regardless.
  // ⚠️ Measured from `.aw-below` in the DOCUMENT, not from the panel: during a
  // cold open the panel has not been appended yet (core/engine.js builds its
  // contents first), so `panel.closest(...)` would be null. Showdown never runs
  // inside a fight, so there is only ever one of these.
  // ⚠️⚠️ A CUSTOM PROPERTY, not `style.width`. core/engine.js's swapContents
  // measures the panel's natural size by CLEARING `style.width` mid-swap and
  // clears it again when it unwraps — an inline width set here would simply
  // vanish the first time the teacher opened this panel over another one.
  // `--sd-panel-w` is not touched by any of that; `.aw-tool-panel.is-sd` reads it
  // and falls back to the stated width when it is absent.
  const frame = document.querySelector(".aw-below");
  const frameW = frame?.clientWidth || 0;
  const panelEl = panel.closest(".aw-tool-panel") || panel;
  // ⛔ Đợt 171 — NO LONGER LIVE PER TEAM COUNT. Đợt 166 retargeted this to the
  // CURRENT team count on every stepper tap ("kích thước pop-up linh hoạt ...
  // theo số team được chọn"), but that is what let 3→4 visibly resize the
  // popover mid-tap and, on the teacher's own run, leave it looking closed and
  // unresponsive (teacher, 15/8/2026: "bấm đến số 3 thì nó giãn pop-up ra, bấm
  // + cho ra số 4 thì đóng mất pop-up ko làm được gì nữa"). That is exactly the
  // class of bug `.aw-tool-panel.is-sd`'s own comment in app.css already warns
  // about (a `--sd-panel-w` write mid-interaction "getting stuck"), and the
  // fix is the same one applied there and to `--sd-body-h` at Đợt 167: stop
  // writing the variable on every intermediate step.
  // The teacher's own original rule — "size các bảng đều to bằng nhau, dù nội
  // dung có ít hơn" (Đợt 157, see `.aw-tool-panel.is-sd`'s block comment) — is
  // restored: ONE width, sized for the WORST case (MAX_TEAMS, which is also
  // the numeric maximum of `ideal` across every team count — 1080 vs 1032 at 3
  // teams, the next highest), capped only by the app frame. `.aw-sd-col`'s own
  // `max-width:200px` already stops a 1-2 team table from stretching its
  // columns too wide, so nothing is lost by never shrinking for a smaller
  // count — only the resize-while-choosing bug is.
  function updatePanelWidth() {
    if (!frameW) return;
    const ideal = SD_PANEL_PAD + MAX_TEAMS * SD_COL_MAXW + (MAX_TEAMS - 1) * SD_COL_GAP;
    const w = Math.min(frameW, Math.max(SD_PANEL_MIN, ideal));
    panelEl.style.setProperty("--sd-panel-w", Math.round(w) + "px");
  }

  // ⚠️⚠️ LIVENESS IS `body.isConnected`, NEVER `panel.isConnected`.
  // core/engine.js opens a tool panel two different ways. Opened cold, `panel`
  // IS `.aw-tool-panel`. But opened while ANOTHER tool panel is up, the engine
  // cross-fades (swapContents): `panel` is then a temporary `.aw-swap-in` layer
  // that is REMOVED at SWAP_MS + 40 = 300ms, after its children have been moved
  // into the real box. So `panel` goes stale while the UI it built is alive and
  // on screen — and any `await` here that outlasts 300ms would come back, see a
  // disconnected `panel`, and bail out leaving "Loading…" on screen for good.
  // 300ms is nothing for a real Firestore round trip on a classroom network;
  // it never fires against a local test double, which is exactly why this is
  // written down rather than left to be discovered.
  // `body` is one of the children the swap MOVES, so it stays connected either
  // way and is the honest test.
  const alive = () => body.isConnected;

  let setup = { classId: "", className: "", teams: [], claims: {} };
  let classes = null;
  let classErr = "";
  let roster = [];          // pupils on screen A (editable: delete / add by hand)
  // Opens on TWO, not on MIN_TEAMS: 1 is now legal (the whole class as one team)
  // but it is the special case, and a stepper that starts there would make the
  // ordinary Showdown — several teams racing — the one you have to go looking
  // for. A saved table overrides this in boot().
  let teamCount = Math.min(MAX_TEAMS, 2);
  let selectedTeam = null;  // which column receives the next tapped chip
  let claimedTeam = null;   // which team THIS browser will play
  // Đợt 174 — the team this browser is playing RIGHT NOW (the live pick the
  // engine handed in), as opposed to the one merely ticked in the table above.
  // Only cancelMyTeam() reads it, and only to decide whether releasing the team
  // also has to drop the pick. Held here rather than read off `ctx` each time so
  // nothing has to mutate the caller's object.
  let playingTeamId = ctx.currentTeam?.teamId || null;
  let pool = [];            // pupils not yet in a team (screen B)
  let unsub = null;
  updatePanelWidth();   // the one and only width — fixed at boot, see the function's own note

  // ⚠️ The teacher can dismiss this popover by tapping anywhere outside it, and
  // that path runs entirely inside core/engine.js — nothing calls back here. A
  // Firestore onSnapshot left running would then stay open for the rest of the
  // page's life, repainting a detached DOM, one more per open-and-dismiss.
  // Measured: `subsAfterClose` was 1 after a single dismissal.
  // The snapshot callback's own `alive()` guard is not enough on its own — it
  // only runs when a snapshot ARRIVES, which may be never. So watch the DOM the
  // panel lives in and tear down the moment `body` leaves it.
  let gone = null;
  const stopWatch = () => {
    if (unsub) { unsub(); unsub = null; }
    if (gone) { gone.disconnect(); gone = null; }
  };
  function watchForClose() {
    if (gone) return;
    const host = body.closest(".aw-below-center") || body.parentElement || document.body;
    gone = new MutationObserver(() => { if (!alive()) stopWatch(); });
    gone.observe(host, { childList: true, subtree: true });
  }

  // ---------------------------------------------------------------
  // SCREEN PLUMBING — one place that owns "what is on screen", so every step
  // change animates the same way instead of each caller inventing its own.
  // ---------------------------------------------------------------
  const SCREEN_MS = 240;
  let current = null;       // the render function on screen right now
  let screenHost = null;    // the layer it rendered into
  let footHost = null;

  /** Re-render the CURRENT screen in place — no slide, this is an edit. */
  function repaint() {
    if (!current || !screenHost) return;
    screenHost.innerHTML = "";
    footHost.innerHTML = "";
    current(screenHost, footHost);
  }

  /**
   * Move to another screen. `dir` +1 goes forward (new content slides in from
   * the right), -1 goes back. The old layer fades out UNDER the new one rather
   * than both cross-fading: the body is a fixed size, so a plain dissolve
   * between two full layouts reads as a flicker, while one sliding over the
   * other reads as a step. (Same reasoning as core/engine.js's own panel swap.)
   */
  function goto(render, dir = 1) {
    if (!alive()) return;
    const oldLayer = screenHost, oldFoot = footHost;
    screenHost = el("div", "aw-sd-layer");
    footHost = el("div", "aw-sd-footlayer");
    body.append(screenHost);
    foot.append(footHost);
    current = render;
    render(screenHost, footHost);

    if (!oldLayer) return;   // first paint — nothing to animate away from
    const dx = dir >= 0 ? 34 : -34;
    const outAnim = oldLayer.animate(
      [{ opacity: 1, transform: "translateX(0)" }, { opacity: 0, transform: `translateX(${-dx}px)` }],
      { duration: SCREEN_MS, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" });
    const inAnim = screenHost.animate(
      [{ opacity: 0, transform: `translateX(${dx}px)` }, { opacity: 1, transform: "translateX(0)" }],
      { duration: SCREEN_MS, easing: "cubic-bezier(.22,.75,.3,1)", fill: "forwards" });
    oldFoot?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: SCREEN_MS / 2, fill: "forwards" });
    footHost.animate([{ opacity: 0 }, { opacity: 1 }], { duration: SCREEN_MS, fill: "forwards" });
    whenDone(outAnim, () => { oldLayer.remove(); oldFoot?.remove(); }, SCREEN_MS + 120);
    whenDone(inAnim, () => { screenHost.style.transform = ""; screenHost.style.opacity = ""; }, SCREEN_MS + 120);
  }

  function btn(label, cls, onClick) {
    const b = el("button", "aw-btn " + cls, label);
    b.type = "button";
    b.onclick = () => onClick();
    return b;
  }

  /**
   * A question laid OVER the current screen — not a screen of its own, so the
   * popover never changes size to ask something, and the teacher can still see
   * what they are about to throw away behind it.
   */
  function askConfirm(text, okLabel, onOk) {
    if (body.querySelector(".aw-sd-confirm")) return;      // one at a time
    const layer = el("div", "aw-sd-confirm");
    const box = el("div", "aw-sd-confirmbox");
    const msg = el("div", "aw-sd-confirmtext");
    msg.textContent = text;
    const row = el("div", "aw-sd-confirmrow");
    const close = () => {
      const a = layer.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, easing: "ease-in", fill: "forwards" });
      whenDone(a, () => layer.remove(), 240);
    };
    row.append(
      btn("Cancel", "aw-sd-ghost", () => { sfx.back(); close(); }),
      btn(okLabel, "aw-btn-primary", () => { close(); onOk(); })
    );
    box.append(msg, row);
    layer.append(box);
    body.append(layer);
    layer.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, easing: "ease-out" });
    box.animate([{ transform: "scale(.94)" }, { transform: "scale(1)" }], { duration: 200, easing: "cubic-bezier(.22,.9,.3,1)" });
  }
  function hintEl(text) {
    const h = el("div", "aw-sd-hint");
    h.textContent = text;
    return h;
  }

  /** Held by ANOTHER screen — drawn, but dimmed and untouchable (Đợt 159). */
  function isTaken(t) {
    const c = setup.claims[t.id];
    return claimIsLive(c) && c.by !== me;
  }

  /**
   * How many pupils a team may hold — an EVEN SPLIT of the class, which is what
   * the teacher's own numbers work out to (Đợt 159b): a class of 20 gives
   * 2 teams → 10, 3 → 7, 4 → 5, 5 → 4. Derived rather than tabulated, so a class
   * of 12 or 30 gets the same fair division without another table to maintain.
   * It is also what the panel's HEIGHT is measured against, per layout.
   */
  function capPerTeam() {
    const n = setup.teams.length || 1;
    return Math.max(1, Math.ceil((roster.length || n) / n));
  }

  // ⛔ SCREEN C IS GONE (Đợt 159). A running Showdown used to open onto a little
  // "Single mode / Reset team" card of its own; the teacher asked for those two
  // as icons on the columns screen instead ("không cần bảng riêng"), so the
  // columns are now the home screen in every state. See paintHeadTools().

  // One implementation, two callers (Đợt 158): the panel's own buttons and the
  // mode picker in core/engine.js. `me` here IS browserId(), the same id the
  // exported function reads, so this is a rename and not a second rule.
  // (A function declaration, not `const releaseMine = releaseMyClaim`: the
  // screens above are defined before this point and a const would sit in the
  // temporal dead zone for anything that ran early.)
  function releaseMine() { return releaseMyClaim(); }

  // ---------------------------------------------------------------
  // SCREEN A — class + team count + the roster
  // ---------------------------------------------------------------
  function renderSetup(host, ft) {
    // The class list needs the full height back after a trip to the (shorter)
    // dividing screen — Reset comes back here.
    body.style.setProperty("--sd-body-h", "470px");
    const row = el("div", "aw-sd-pickrow");

    const cClass = el("div", "aw-sd-field");
    cClass.append(el("div", "aw-sd-flab", "Class"));
    const sel = el("select", "aw-sd-select is-big");
    if (!classes) {
      const o = el("option"); o.textContent = "Loading…"; sel.append(o); sel.disabled = true;
    } else if (!classes.length) {
      const o = el("option"); o.textContent = classErr || "No classes — add one in Settings"; sel.append(o); sel.disabled = true;
    } else {
      const ph = el("option"); ph.value = ""; ph.textContent = "— choose a class —"; sel.append(ph);
      classes.forEach(c => {
        const o = el("option");
        o.value = c.id;
        o.textContent = c.name;             // teacher's own text — never innerHTML
        sel.append(o);
      });
      sel.value = setup.classId || "";
    }
    sel.onchange = () => {
      const c = (classes || []).find(x => x.id === sel.value);
      setup.classId = c ? c.id : "";
      setup.className = c ? c.name : "";
      // A different class means a different set of people; anything typed in by
      // hand for the previous one goes with it, which is the only thing that is
      // not quietly wrong.
      roster = c ? c.students.map(s => ({ id: s.id, name: s.name })) : [];
      sfx.add();
      repaint();
    };
    cClass.append(sel);

    const cCount = el("div", "aw-sd-field is-narrow");
    cCount.append(el("div", "aw-sd-flab", "Teams"));
    const stepper = makeHStepper(teamCount, MIN_TEAMS, MAX_TEAMS,
      // ⛔ Đợt 166's live `updatePanelWidth(v)` call here is gone (Đợt 171) —
      // it was the resize-while-tapping bug itself; the panel's width is fixed
      // once at boot now and this handler only ever touches `teamCount`.
      v => { teamCount = v; sfx.tap(); paintFoot(); }, { format: v => String(v) });
    stepper.el.classList.add("is-big");
    cCount.append(stepper.el);

    row.append(cClass, cCount);
    host.append(row);

    const listWrap = el("div", "aw-sd-roster" + (setup.classId ? "" : " is-empty"));
    if (!setup.classId) {
      listWrap.append(el("div", "aw-sd-empty-note", "Choose a class to see its pupils."));
    } else {
      roster.forEach((s, i) => {
        const r = el("div", "aw-sd-rmember");
        const nm = el("span", "aw-sd-rname");
        nm.textContent = s.name;
        const del = el("button", "aw-sd-x", icons.close);
        del.type = "button"; del.title = "Remove";
        del.onclick = () => {
          sfx.remove();
          // Animate the chip away BEFORE the list is rebuilt — otherwise the row
          // simply blinks out of existence and the teacher cannot tell which one
          // went.
          const a = r.animate(
            [{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(.7)" }],
            { duration: 160, easing: "ease-in", fill: "forwards" });
          whenDone(a, () => { roster.splice(i, 1); repaint(); }, 260);
        };
        r.append(nm, del);
        listWrap.append(r);
      });
      const add = el("button", "aw-sd-add", "+ Add member");
      add.type = "button";
      add.onclick = () => {
        sfx.tap();
        // An inline row rather than prompt(): prompt() is blocked in some
        // embedded views (myActivity's WebContentsView among them) and would
        // fail silently exactly where the teacher works.
        const r = el("div", "aw-sd-rmember is-new");
        const inp = el("input", "aw-sd-rinput");
        inp.placeholder = "Name";
        inp.maxLength = 40;
        let closed = false;
        const ok = () => {
          if (closed) return;
          closed = true;
          const v = inp.value.trim().replace(/\s+/g, " ");
          if (!v) { r.remove(); return; }
          roster.push({ id: localId("st"), name: v });
          sfx.add();
          repaint();
          // Make the newcomer announce itself — with 20 chips on screen, a
          // silently appended one is easy to miss.
          const chips = screenHost.querySelectorAll(".aw-sd-rmember");
          const last = chips[chips.length - 1];
          if (last) last.classList.add("is-pop");
        };
        inp.onkeydown = ev => { if (ev.key === "Enter") { ev.preventDefault(); ok(); } };
        inp.onblur = ok;
        r.append(inp);
        listWrap.insertBefore(r, add);
        r.animate([{ opacity: 0, transform: "scale(.8)" }, { opacity: 1, transform: "scale(1)" }],
          { duration: 160, easing: "ease-out" });
        inp.focus();
      };
      listWrap.append(add);
    }
    host.append(listWrap);
    paintFoot();

    function paintFoot() {
      ft.innerHTML = "";
      // ⭐ Đợt 159 — ONE TEAM IS THE WHOLE CLASS, so there is nothing to divide:
      // the button says READY and starts the mode from this screen (teacher:
      // "nếu chọn 1 team thì không next nữa mà hiện READY luôn"). Everything
      // about the dividing screen — the pool, the columns, the claim — belongs
      // to the 2+ case only.
      const solo = teamCount === 1;
      const canGo = !!setup.classId && roster.length >= teamCount;
      ft.append(
        hintEl(!setup.classId
          ? "Pick a class first."
          : roster.length < teamCount
            ? `${roster.length} pupil${roster.length === 1 ? "" : "s"} for ${teamCount} teams — add more, or use fewer teams.`
            : solo
              // Said plainly, because it is the one mode that behaves differently
              // from every other screen in this panel.
              ? `${roster.length} pupils · one team · this screen only`
              : `${roster.length} pupils · ${teamCount} teams`),
        btn(solo ? "Ready" : "Next", "aw-btn-primary" + (canGo ? "" : " is-dim"), () => {
          if (!canGo) {
            sfx.remove();
            toast(setup.classId ? "Not enough pupils for that many teams" : "Choose a class first");
            return;
          }
          if (solo) { sfx.ready(); applySolo(); return; }
          sfx.forward();
          // Keep any team the table already had (ids + names), only re-deal.
          setup.teams = splitIntoTeams([], teamCount, setup.teams);
          pool = roster.slice();
          selectedTeam = setup.teams[0]?.id || null;
          goto(renderBuild, +1);
        })
      );
    }
  }

  /**
   * ONE TEAM = the whole class, on THIS screen only (Đợt 159, teacher's rule:
   * "nếu chỉ có 1 team thì không lưu firebase nữa mà chỉ dùng ở trình duyệt
   * hiện tại thôi, không đồng bộ cho trình duyệt khác").
   *
   * So: no `saveSetup`, no claim, no team table. The pick alone — which lives in
   * sessionStorage — is the entire state of this mode.
   * ⚠️ It DOES release a claim this browser was holding: leaving a real team
   * behind without handing it back would hide it from the other screens for the
   * full 12h TTL. That write is cleanup of the PREVIOUS mode, not a sync of this
   * one.
   */
  function applySolo() {
    const pick = {
      teamId: SOLO_TEAM_ID,
      // The class's own name (teacher chose this over "Team 1"): with everyone
      // in one team, a team name that is not the class's tells nobody anything.
      teamName: setup.className || "Class",
      classId: setup.classId, className: setup.className,
      members: roster.map(m => ({ id: m.id, name: m.name }))
    };
    writePick(pick);
    releaseMine();               // fire-and-forget; see the note above
    stopWatch();
    onApply(pick);
  }

  // ---------------------------------------------------------------
  // SCREEN B — build the teams
  // ---------------------------------------------------------------
  function renderBuild(host, ft) {
    // ⭐⭐ Đợt 159b — TWO LAYOUTS, chosen by how many pupils a column can hold.
    // (Teacher, 15/8/2026, after seeing the first build scroll sideways.)
    //   2-3 teams → the pool stands on the RIGHT and the columns run tall down
    //               the left: a team of 10 (20 ÷ 2) or 7 (20 ÷ 3) needs height,
    //               and there is width to spare with so few columns.
    //   4-5 teams → the pool lies along the TOP, columns are short: 20 ÷ 4 = 5
    //               and 20 ÷ 5 = 4 per team, so height is cheap and width is not.
    // The columns SHARE whatever width the panel has (`flex: 1 1 0`), so no team
    // count can push the table sideways — the horizontal scrollbar the teacher
    // photographed came from columns with a stated px width.
    const n = setup.teams.length || MIN_TEAMS;
    const sideBySide = n <= 3;
    host.classList.add("aw-sd-build", sideBySide ? "is-side" : "is-top");
    // ⛔ Đợt 171 — no more `updatePanelWidth(n)` here: the panel's width is set
    // once at boot and fixed (see that function's own note) so entering this
    // screen never resizes it.
    // Each layout's COMFORTABLE height — measured, see app.css — is now a
    // ceiling, not a fixed value: fitBuildScreen() below clamps it to whatever
    // room is actually real (Đợt 166) before shrinking anything else.
    const idealBodyH = sideBySide ? 470 : 400;
    // Chip text's own comfortable ceiling (Đợt 159: 14.5 at ≤3 teams, 13 at
    // 4-5) — also now the t=1 end of fitBuildScreen()'s range rather than the
    // only two values that exist.
    const chipFsMax = n >= 4 ? SD_FIT_MAX.chipFsWide : SD_FIT_MAX.chipFs;

    const poolBox = el("div", "aw-sd-pool");
    const colsBox = el("div", "aw-sd-cols");
    // DOM order follows the layout: pool first when it is on top, columns first
    // when it stands to the right (so tab order matches what the eye reads).
    host.append(...(sideBySide ? [colsBox, poolBox] : [poolBox, colsBox]));

    repaintAll();

    /** paint everything, THEN fit it to the real room, THEN abbreviate
     * whatever still does not fit. Every mutator below (sendToTeam, drag a
     * chip back, Random, Send everyone back) goes through this — not the
     * three paints alone — so a chip move that makes some OTHER column the
     * tallest one re-measures instead of trusting a fit computed for the
     * shape the screen had a moment ago. */
    function repaintAll() {
      paintPool();
      paintCols();
      paintFoot();
      fitBuildScreen();
      shrinkOverflowingNames();
    }

    /**
     * Đợt 166 — clamp `--sd-body-h` to the REAL room above the toolbar (not
     * just the layout's comfortable ideal), then binary-search ONE scale
     * across chip font/padding/gaps (`applyFit`) until the tallest column
     * actually fits inside whatever that comes out to. Same technique as
     * core/fit.js's autoFit — measured DOM, not arithmetic — because the room
     * here is no longer one fixed number the way it was at Đợt 159: it is
     * different on every myActivity column split.
     */
    function fitBuildScreen() {
      // Đợt 166 — the is-side pool's width, BEFORE anything below: everything
      // else here fits HEIGHT into a budget, but a myActivity column can also
      // be too NARROW for the pool's usual fixed 360 (see app.css's own note
      // on `--sd-side-pool-w`). `host.clientWidth` is the real inner width
      // pool+gap+columns must share — measured, not the panel's stated width,
      // since border/padding already came out of it by the time it reaches here.
      if (sideBySide) {
        const avail = host.clientWidth;
        // Leave at least 40px per column — a sliver, but enough for a couple
        // of abbreviated characters plus the ellipsis rather than nothing.
        const poolW = Math.max(SD_SIDE_POOL_MIN, Math.min(SD_SIDE_POOL_W, avail - SD_SIDE_GAP - n * 40));
        host.style.setProperty("--sd-side-pool-w", Math.round(poolW) + "px");
      }
      // capPanelHeight (core/engine.js) already wrote the real budget onto
      // the panel element before this ever runs — see updatePanelWidth's own
      // header note for why that ordering is safe to rely on. Reading it back
      // rather than re-deriving it means this can never disagree with what
      // the panel is actually capped to.
      const maxH = parseFloat(panelEl.style.maxHeight) || Infinity;
      // `.aw-tool-panel`'s own padding (14+16=30) plus `.aw-sd-foot`'s
      // footprint (46 min-height + 14 margin-top = 60) — see app.css. What is
      // left is what `.aw-sd-body` may use before the PANEL ITSELF has to
      // scroll, which is the failure this whole function exists to prevent
      // (Đợt 159b moved Ready/Reset/Random off a sticky header, so a panel
      // scroll can hide the only way out of the popover).
      // ⚠️ The floor here is a sanity minimum ONLY (never literally 0/negative
      // if `maxH` came back tiny or unset) — it must NOT be a "comfortable"
      // number. Measured the bug a too-generous floor causes: at a real
      // myActivity-column budget of ~122px, a floor of 180 forced `bodyH` to
      // 180 anyway, guaranteeing the exact ~58px panel overflow this function
      // exists to prevent. Below this floor there is genuinely no room left to
      // negotiate — `.aw-tool-panel`'s own `overflow-y:auto` is the honest
      // fallback for a column split too narrow for any 16:9 game frame to be
      // worth showing in the first place, not a case to keep chasing.
      const budget = Math.max(60, maxH - 30 - 60);
      const bodyH = Math.min(idealBodyH, budget);
      body.style.setProperty("--sd-body-h", bodyH + "px");

      const need = () => sideBySide
        ? Math.max(measurePoolH(), measureColH())
        // Not side-by-side: the pool sits ABOVE the columns inside the same
        // body, so its footprint plus the layer's own 14px gap (app.css) eats
        // into what the columns have.
        : measurePoolH() + 14 + measureColH();

      applyFit(1);
      if (need() <= bodyH + 1) return;        // the common case: nothing to shrink
      let lo = SD_FIT_MIN, hi = 1, best = SD_FIT_MIN;
      for (let i = 0; i < 10; i++) {
        const mid = (lo + hi) / 2;
        applyFit(mid);
        if (need() > bodyH + 1) hi = mid; else { best = mid; lo = mid; }
      }
      applyFit(best);
    }

    /** t=1 is the Đợt 159 comfortable size, t=SD_FIT_MIN the tightest this
     * screen will ever get before a name abbreviates instead (see
     * shrinkOverflowingNames). Six properties move together so the column
     * shrinks as ONE proportional thing rather than font and spacing
     * disagreeing with each other. */
    function applyFit(t) {
      const lerp = (min, max) => (min + (max - min) * t).toFixed(2);
      host.style.setProperty("--sd-chip-fs", lerp(SD_FIT_MIN_PX.chipFs, chipFsMax) + "px");
      host.style.setProperty("--sd-col-gap", lerp(SD_FIT_MIN_PX.colGap, SD_FIT_MAX.colGap) + "px");
      host.style.setProperty("--sd-colchip-pad-v", lerp(SD_FIT_MIN_PX.colchipPadV, SD_FIT_MAX.colchipPadV) + "px");
      host.style.setProperty("--sd-colchip-pad-h", lerp(SD_FIT_MIN_PX.colchipPadH, SD_FIT_MAX.colchipPadH) + "px");
      host.style.setProperty("--sd-colhead-mb", lerp(SD_FIT_MIN_PX.colheadMb, SD_FIT_MAX.colheadMb) + "px");
      host.style.setProperty("--sd-col-pad", lerp(SD_FIT_MIN_PX.colPad, SD_FIT_MAX.colPad) + "px");
      host.style.setProperty("--sd-pool-maxh", lerp(SD_FIT_MIN_PX.poolMaxh, SD_FIT_MAX.poolMaxh) + "px");
    }

    // Natural (unstretched) height of the BUSIEST column. `.aw-sd-col` itself
    // IS stretched (`align-items:stretch` against its siblings/container —
    // the same stretched-ancestor trap core/fit.js's header warns about, so
    // `col.scrollHeight` cannot be trusted), but its two children — the head
    // row and the member list — carry no `height:100%`/`flex-grow` of their
    // own, so their `offsetHeight` is real, content-driven size.
    function measureColH() {
      let max = 0;
      colsBox.querySelectorAll(".aw-sd-col").forEach(col => {
        const head = col.querySelector(".aw-sd-colhead");
        const list = col.querySelector(".aw-sd-colmembers");
        const cs = getComputedStyle(col);
        const h = (head?.offsetHeight || 0) + (list?.offsetHeight || 0)
          + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom)
          + parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);
        if (h > max) max = h;
      });
      return max;
    }

    // The pool is NOT stretched in either layout (`flex:0 0 auto` / `0 0
    // var(--sd-side-pool-w)`), so its own rendered height already IS the real
    // number — capped by its own `max-height` in the is-top layout, which is
    // fine: that cap is a deliberate internal scroll for a staging area, not
    // part of the "never scroll" promise this function exists to keep (see
    // .aw-sd-pool's own comment in app.css).
    // ⚠️ `offsetHeight`, NOT `getBoundingClientRect()` — measured the two
    // disagree by as much as 10% while the popover's own OPEN animation
    // (`.aw-tool-panel`'s `aw-pop-cx`, a scale-in) is still resolving: `rect`
    // reports the partway-scaled visual size, `offsetHeight` the real layout
    // box the fit search needs. `measureColH()` was never at risk of this (it
    // was always offsetHeight-based); this is the same fix applied here too.
    function measurePoolH() { return poolBox.offsetHeight; }

    /**
     * Đợt 166 — LAST resort, run after fitBuildScreen() has already shrunk
     * the whole screen as far as it goes (SD_FIT_MIN): a name that STILL does
     * not fit its chip's rendered width gets swapped to its abbreviated form
     * (core/showdown-setup.js's shortenName) instead of being left to
     * `.aw-sd-chip`'s ellipsis, which was silently cutting names — the
     * teacher's own rule is that a name is never cut.
     * ⚠️ Always re-derives from `dataset.fullName` and only ever SHRINKS from
     * there: every chip here was just created fresh by paintPool()/paintCols()
     * this same repaint (mkChip sets `.textContent` to the full name), so
     * there is no stale abbreviation to undo — a column that regained room
     * simply never gets touched.
     */
    function shrinkOverflowingNames() {
      host.querySelectorAll(".aw-sd-chip[data-mid]").forEach(chip => {
        const full = chip.dataset.fullName;
        if (!full || chip.scrollWidth <= chip.clientWidth + 1) return;   // fits as-is
        chip.textContent = shortenName(full);
        chip.classList.add("is-short");
        chip.title = full;   // the visible text is compressed; the full name is one hover away
      });
    }

    function paintPool() {
      poolBox.innerHTML = "";
      poolBox.classList.toggle("is-empty", !pool.length);
      if (!pool.length) {
        poolBox.append(el("div", "aw-sd-empty-note", "Everyone is in a team."));
        return;
      }
      pool.forEach(m => {
        const chip = mkChip(m.name);
        chip.dataset.mid = m.id;
        chip.onclick = () => sendToTeam(m, chip);
        poolBox.append(chip);
      });
    }

    function paintCols() {
      colsBox.innerHTML = "";
      // ⭐ Đợt 159 — EVERY team is drawn, including the ones another screen has
      // taken; those are DIMMED and inert (teacher: "đội đã được chọn và Ready
      // rồi sẽ có màu nhạt để thể hiện không chọn được nữa"). This REVERSES the
      // Đợt 156 rule that hid them: a second screen opening the panel now sees
      // the whole line-up and simply cannot touch what is spoken for — which is
      // also the only way it can see WHICH teams are left without guessing.
      setup.teams.forEach(t => {
        const c = setup.claims[t.id];
        const taken = claimIsLive(c) && c.by !== me;
        const col = el("div", "aw-sd-col"
          + (t.id === selectedTeam && !taken ? " is-sel" : "")
          + (t.id === claimedTeam ? " is-claimed" : "")
          + (taken ? " is-taken" : ""));
        col.dataset.tid = t.id;
        // Tapping ANYWHERE in the column selects it (teacher: "bấm vào vùng
        // trống bất kỳ trong cột team cũng cho phép chọn cột team"). The tick
        // and the name chips stop the click before it gets here.
        if (!taken) col.onclick = () => { if (selectedTeam !== t.id) { selectedTeam = t.id; sfx.tap(); paintCols(); } };

        const head = el("div", "aw-sd-colhead");
        const nameBtn = el("button", "aw-sd-colname");
        nameBtn.type = "button";
        nameBtn.textContent = t.name;
        nameBtn.title = taken ? "Taken on another screen" : "Tap to send pupils here";
        nameBtn.disabled = taken;

        // ⭐ Đợt 174 (teacher, 17/8/2026) — THE SEAT AT THE TOP-RIGHT OF A COLUMN
        // now says three different things, and only one of them is a tick:
        //   · free team        → an empty tick, "this screen plays this team"
        //   · held ELSEWHERE   → a dimmed ✗, inert (unchanged since Đợt 159)
        //   · held by THIS one → a RED ✗ that HANDS THE TEAM BACK, behind a
        //     confirm (teacher: "bấm vào dấu X đỏ ở góc trên bên phải cột đội
        //     của máy đã chọn để hủy đội… sau đó đội đó sẽ hiển thị dạng chưa
        //     có ai chọn và có thể chọn lại được").
        // Before this đợt the ONLY way out of a claim was tapping the tick
        // again: silent, instant, and purely local — a team this browser had
        // already pressed Ready on stayed claimed on Firestore, i.e. invisible
        // to every other screen for the full 12h TTL, with nothing on any
        // screen saying so. Cancelling now WRITES (see cancelMyTeam).
        const mine = t.id === claimedTeam;
        const tick = el("button", "aw-sd-tick" + (mine ? " is-cancel" : ""), (taken || mine) ? icons.close : icons.check);
        tick.type = "button";
        tick.title = taken ? "Taken on another screen"
          : mine ? "Release this team so another screen can take it"
          : "This screen plays this team";
        tick.disabled = taken;
        tick.onclick = ev => {
          ev.stopPropagation();                 // not "select the column" as well
          if (mine) {
            sfx.tap();
            // Asked, never instant: releasing is visible on every OTHER screen
            // within one snapshot, so a stray tap would hand a running team
            // away mid-lesson.
            askConfirm(`Release ${t.name}? Another screen can take it.`, "Release", () => cancelMyTeam(t));
            return;
          }
          claimedTeam = t.id;
          selectedTeam = t.id;
          sfx.claim();
          paintCols(); paintFoot();
          const c2 = colsBox.querySelector(`[data-tid="${CSS.escape(t.id)}"]`);
          c2?.animate([{ transform: "scale(1)" }, { transform: "scale(1.035)" }, { transform: "scale(1)" }],
            { duration: 260, easing: "ease-out" });
        };
        head.append(nameBtn, tick);
        col.append(head);

        const list = el("div", "aw-sd-colmembers");
        t.members.forEach(m => {
          const chip = mkChip(m.name);
          chip.dataset.mid = m.id;
          chip.classList.add("is-in");
          chip.title = taken ? "" : "Tap to send back";
          chip.disabled = taken;
          chip.onclick = ev => { ev.stopPropagation(); backToPool(t, m, chip); };
          list.append(chip);
        });
        col.append(list);
        colsBox.append(col);
      });
    }

    /**
     * ⭐ Đợt 174 — HAND THIS SCREEN'S TEAM BACK (the red ✗ above).
     *
     * Three things happen, and the order matters:
     *   1. the column repaints as FREE here at once — `setup.claims` is the
     *      panel's own copy of the table, and waiting for the Firestore write to
     *      come back round through onSnapshot would leave the ✗ sitting on a
     *      team the teacher has just released;
     *   2. the PICK goes too, but only if this browser is actually playing that
     *      team. Leaving it in sessionStorage would let the next "Start again"
     *      re-enter Showdown on a team already handed back — the game would deal
     *      turns to a line-up another screen now owns;
     *   3. the write itself, fire-and-forget (`releaseMine`), exactly like every
     *      other claim release in this file: signed out or offline, the 12h TTL
     *      is still the backstop and the teacher must never be blocked by it.
     *
     * ⚠️ A team merely TICKED here (not yet Ready) has no row on Firestore, so
     * there is nothing to write — `held` is what tells the two cases apart.
     * ⚠️ The play on screen is NOT restarted: the teacher is standing in the
     * table, one tap away from ticking another team and pressing Ready (which
     * restarts anyway). Closing the panel instead leaves the current game
     * running to its end with the names it started with, which is the harmless
     * half of the choice.
     */
    function cancelMyTeam(t) {
      const held = setup.claims[t.id]?.by === me;
      claimedTeam = null;
      selectedTeam = t.id;
      if (held) delete setup.claims[t.id];
      if (playingTeamId === t.id) { clearPick(); playingTeamId = null; }
      sfx.lift();
      paintCols(); paintFoot();
      if (held) releaseMine();
    }

    // ⭐ Đợt 159b — THE BOTTOM ROW IS THE WHOLE CHROME NOW (teacher): the tools on
    // the left, the title in the middle, Ready on the right, and NO instruction
    // line ("bỏ mấy câu hướng dẫn đi"). The head row above the table is gone with
    // it, which is where the height for a taller table came from.
    function paintFoot() {
      ft.innerHTML = "";
      const ready = !pool.length && !!claimedTeam;
      const tools = el("div", "aw-sd-foottools");
      const mk = (svg, title, onClick) => {
        const b = el("button", "aw-sd-htool", svg);
        b.type = "button"; b.title = title; b.setAttribute("aria-label", title);
        b.onclick = onClick;
        tools.append(b);
        return b;
      };
      mk(icons.single, "Single mode", () => {
        sfx.tap();
        askConfirm("Leave Showdown? This screen's team goes back to the others.", "Single mode", () => {
          sfx.back();
          clearPick();
          releaseMine();          // fire-and-forget: the play restarts either way
          onTurnOff();
        });
      });
      mk(icons.refresh, "Reset teams", () => {
        sfx.tap();
        // ⭐ Đợt 168 (teacher, 15/8/2026) — this used to be "give back only MY
        // claim" (releaseMine): the shared table itself, and every OTHER
        // browser's claim on it, survived untouched. Reset now wipes the
        // WHOLE table (wipeSetup) — the teacher's own words: "reset mọi thứ
        // liên quan tới bảng showdown luôn... không bị vướng vào việc đang
        // mắc ở 1 đội nào đó". See wipeSetup()'s own header for what this
        // does and does not reach.
        askConfirm("Reset the whole team table? Every screen loses its team, right away.", "Reset", async () => {
          sfx.forward();
          clearPick();
          await wipeSetup();
          await boot({ rebuild: true });
        });
      });
      // ONE seat, TWO jobs (teacher): deal the class out while anybody is still
      // waiting, call everybody back once nobody is. The two can never both apply,
      // so they share a button rather than one of them sitting dead.
      if (pool.length) {
        mk(icons.wand, "Random teams", () => { sfx.forward(); randomDeal(); });
      } else {
        mk(icons.duplicate, "Send everyone back", () => {
          sfx.tap();
          askConfirm("Send every pupil back to the class list?", "Send back", () => { sfx.back(); flyBackAll(); });
        });
      }
      const title = el("div", "aw-sd-foottitle", "Showdown");
      ft.append(tools, title,
        // ⚠️ NO "Back" (teacher, Đợt 159): once the class has been divided, the
        // way to the first screen is RESET — because going back silently was a
        // one-tap route to re-dealing a line-up the other screens had already
        // claimed teams from.
        btn("Ready", "aw-sd-ready aw-btn-primary" + (ready ? "" : " is-dim"), () => {
          if (!ready) {
            sfx.remove();
            toast(pool.length ? "Put every pupil in a team" : "Tick the team this screen plays");
            return;
          }
          sfx.ready();
          applyReady();
        })
      );
    }

    /** Everyone still waiting, dealt out evenly and in a random order. */
    function randomDeal() {
      const cap = capPerTeam();
      // Fisher-Yates on a copy: `pool` itself is spliced below, and shuffling in
      // place while reading it is how a "random" deal quietly stops being one.
      const bag = pool.slice();
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
      bulkMove(() => {
        // Deal round-robin starting from the emptiest team, so a half-built
        // table is levelled up rather than having the rest piled on the end.
        const order = setup.teams.filter(t => !isTaken(t)).sort((a, b) => a.members.length - b.members.length);
        if (!order.length) return;
        let placed = 0;
        for (const m of bag) {
          const target = order.filter(t => t.members.length < cap).sort((a, b) => a.members.length - b.members.length)[0];
          if (!target) break;                     // every team full — leave the rest waiting
          target.members.push(m);
          pool = pool.filter(x => x !== m);
          placed++;
        }
        if (!placed) toast("Every team is full");
      });
    }

    /** Everybody out of the columns and back into the class list. */
    function flyBackAll() {
      bulkMove(() => {
        setup.teams.forEach(t => {
          if (isTaken(t)) return;                 // not ours to empty
          pool.push(...t.members);
          t.members = [];
        });
      });
    }

    /**
     * Move a lot of chips at once and let the eye follow them.
     * FLIP again (same idea as `fly`), but for the whole board: measure every
     * chip, mutate, repaint, then fly a ghost per chip that actually moved.
     * ⚠️ The real chip is HIDDEN until its ghost lands — with one chip the
     * duplicate is unnoticeable, with twenty it reads as the board doubling.
     */
    function bulkMove(mutate) {
      const before = new Map();
      host.querySelectorAll("[data-mid]").forEach(c => before.set(c.dataset.mid, c.getBoundingClientRect()));
      mutate();
      repaintAll();
      const moved = [];
      host.querySelectorAll("[data-mid]").forEach(c => {
        const from = before.get(c.dataset.mid);
        if (!from) return;
        const to = c.getBoundingClientRect();
        if (Math.abs(from.left - to.left) < 2 && Math.abs(from.top - to.top) < 2) return;
        moved.push({ c, from, to });
      });
      if (!moved.length) return;
      moved.forEach(({ c, from, to }, i) => {
        c.style.visibility = "hidden";
        // A small stagger so twenty chips read as a flock, not a jump cut. Capped
        // so a big class never turns it into a slow parade.
        const delay = Math.min(i * 16, 260);
        setTimeout(() => {
          fly(from, to, c.textContent);
          // Reveal exactly when the ghost arrives (fly's own duration), with the
          // usual belt-and-braces timeout — a hidden tab must not leave the board
          // half invisible.
          setTimeout(() => { c.style.visibility = ""; }, 280);
        }, delay);
      });
      sfx.land();
    }

    // ---- the flying chip ----
    // FLIP: measure where the chip is now, rebuild the lists, measure where its
    // replacement landed, then animate a CLONE across the gap. Animating the
    // real node is impossible — it is destroyed by the repaint.
    function fly(fromRect, toRect, label) {
      if (!fromRect || !toRect) return;
      const ghost = mkChip(label);
      ghost.classList.add("aw-sd-ghost-chip");
      // ⚠️ The ghost is appended to <body>, OUTSIDE the layer that defines
      // `--sd-chip-fs`, so it would fly at the 15px default while the chips it
      // is standing in for are smaller. Carry the size across by hand.
      ghost.style.fontSize = getComputedStyle(host).getPropertyValue("--sd-chip-fs") || "";
      ghost.style.left = fromRect.left + "px";
      ghost.style.top = fromRect.top + "px";
      ghost.style.width = fromRect.width + "px";
      ghost.style.height = fromRect.height + "px";
      document.body.append(ghost);
      const anim = ghost.animate([
        { transform: "translate(0,0) scale(1)" },
        { transform: `translate(${(toRect.left - fromRect.left) * 0.5}px, ${(toRect.top - fromRect.top) * 0.5}px) scale(1.07)`, offset: 0.5 },
        { transform: `translate(${toRect.left - fromRect.left}px, ${toRect.top - fromRect.top}px) scale(1)` }
      ], { duration: 280, easing: "cubic-bezier(.22,.75,.3,1)", fill: "forwards" });
      // A hidden/backgrounded tab never fires `onfinish` (Chromium freezes rAF),
      // and a ghost left on top of the page would swallow every later tap.
      whenDone(anim, () => ghost.remove(), 440);
    }

    function findChip(box, mid) { return box.querySelector(`[data-mid="${CSS.escape(mid)}"]`); }

    function sendToTeam(m, chipEl) {
      const team = setup.teams.find(t => t.id === selectedTeam);
      if (!team) { sfx.remove(); toast("Tap a team first"); return; }
      // The cap is not decoration: each layout's height is measured for exactly
      // an even split of the class, so letting one more in is what would put a
      // scrollbar back (Đợt 159b — see capPerTeam).
      const cap = capPerTeam();
      if (team.members.length >= cap) {
        sfx.remove();
        toast(`A team holds at most ${cap} pupils`);
        return;
      }
      const from = chipEl.getBoundingClientRect();
      pool = pool.filter(x => x !== m);
      team.members.push(m);
      sfx.land();
      // ⚠️ paintFoot() TOO, not just the two lists. Measured without it: every
      // pupil could be placed and the footer still read "9 pupils left" with
      // READY greyed out — the mode was unreachable and nothing said why. The
      // footer is derived state; anything that changes `pool` or the claim has
      // to repaint it.
      repaintAll();
      const landed = findChip(colsBox, m.id);
      fly(from, landed?.getBoundingClientRect(), m.name);
    }

    function backToPool(team, m, chipEl) {
      const from = chipEl.getBoundingClientRect();
      team.members = team.members.filter(x => x !== m);
      pool.push(m);
      sfx.lift();
      repaintAll();
      const landed = findChip(poolBox, m.id);
      fly(from, landed?.getBoundingClientRect(), m.name);
    }
  }

  function mkChip(label) {
    const c = el("button", "aw-sd-chip");
    c.type = "button";
    c.textContent = label;          // pupil name — never innerHTML
    // Đợt 166 — the TRUE name, kept regardless of what shrinkOverflowingNames()
    // later does to .textContent, so a re-check always starts from the full
    // name rather than compounding an old abbreviation onto a new one.
    c.dataset.fullName = label;
    return c;
  }

  async function applyReady() {
    const team = setup.teams.find(t => t.id === claimedTeam);
    if (!team) return;
    const pick = {
      teamId: team.id, teamName: team.name,
      classId: setup.classId, className: setup.className,
      members: team.members.map(m => ({ id: m.id, name: m.name }))
    };
    // Store the pick FIRST: it is what the restart reads, and the lesson has to
    // start even if the network is having a bad day.
    writePick(pick);
    try {
      const next = { ...setup, claims: { ...setup.claims } };
      // Drop any claim of ours elsewhere before taking this one — a browser
      // holds at most one team, and a stale self-claim would hide a team from
      // everybody until the TTL ran out.
      Object.entries(next.claims).forEach(([tid, c]) => { if (c.by === me) delete next.claims[tid]; });
      next.claims[team.id] = { by: me, at: Date.now() };
      await saveSetup(next);
    } catch (e) {
      toast(e?.code === "aw/signed-out" ? "Signed out — table not shared" : "Could not share the table");
    }
    stopWatch();
    onApply(pick);
  }

  // ---------------------------------------------------------------
  // BOOT
  // ---------------------------------------------------------------
  async function boot({ rebuild = false } = {}) {
    // Đợt 168 — `boot()` can now run a SECOND time on the same panel (Reset
    // teams calls it again after wipeSetup()); the live-table listener from
    // the FIRST run was never torn down before, just silently overwritten by
    // `unsub = subscribeSetup(...)` at the bottom — a leaked listener for the
    // rest of the panel's life. Harmless before (nothing ever called boot()
    // twice), worth closing now that Reset does.
    if (unsub) { unsub(); unsub = null; }
    goto(renderSetup, rebuild ? -1 : +1);   // draws the "Loading…" state at once

    let loaded = null;
    try { loaded = await loadSetup({ fresh: true }); } catch { /* reported via the class list */ }
    try {
      const { listClasses } = await import("./classes.js");
      classes = await listClasses();
    } catch (e) {
      classes = [];
      classErr = e?.code === "aw/signed-out" ? "Sign in to use your classes" : "Could not load your classes";
    }
    if (!alive()) return;                   // dismissed while we waited

    if (loaded) {
      setup = loaded;
      // ⚠️ Only a table that ACTUALLY HAS teams overrides the opening default.
      // `loadSetup()` answers with a normalized EMPTY table when the document
      // does not exist, so `loaded.teams.length || MIN_TEAMS` used to hand back
      // MIN_TEAMS for a brand-new teacher — harmless while that was 2, and from
      // Đợt 159 it silently opened every fresh setup on one-team mode.
      if (loaded.teams.length) teamCount = Math.max(MIN_TEAMS, Math.min(MAX_TEAMS, loaded.teams.length));
      const c = (classes || []).find(x => x.id === loaded.classId);
      if (c) roster = c.students.map(s => ({ id: s.id, name: s.name }));
      // A table built earlier already knows its people; prefer THOSE (the
      // teacher may have deleted or hand-added some) over the raw register.
      const saved = loaded.teams.flatMap(t => t.members);
      if (saved.length) roster = saved.map(m => ({ id: m.id, name: m.name }));
    }

    // ⭐ Đợt 159 — WHERE THIS PANEL LANDS.
    // Once a table has been built, the COLUMNS are the home screen — for the
    // browser that built it and, just as importantly, for every other one
    // (teacher: "khi các tab khác mở ra sẽ hiển thị luôn các cột đội"). The
    // first screen is reached again only through RESET, which asks first.
    // Two exceptions land on the first screen instead:
    //   · `rebuild` — Reset itself, which is a deliberate trip back;
    //   · a SOLO pick — one-team mode never built a table, and its own screen
    //     (class + a Teams stepper reading 1) is where it is changed.
    const solo = ctx.currentTeam?.teamId === SOLO_TEAM_ID;
    if (solo) {
      // One-team mode never writes to Firestore, so `loaded` knows nothing about
      // it — the PICK is the only record of which class is playing. Reopening
      // the panel without this showed "— choose a class —" and an empty roster
      // over a mode that was very much running (measured, Đợt 159).
      teamCount = 1;
      if (ctx.currentTeam.classId) {
        setup.classId = ctx.currentTeam.classId;
        setup.className = ctx.currentTeam.className || setup.className;
      }
      if (ctx.currentTeam.members?.length) {
        roster = ctx.currentTeam.members.map(m => ({ id: m.id, name: m.name }));
      }
    }
    const built = setup.teams.length > 0 && setup.teams.some(t => t.members.length);
    if (!rebuild && built && !solo) {
      // Everyone is already placed, so there is no pool to rebuild; the claim is
      // whichever team this browser holds — from the live pick if it has one,
      // otherwise from the shared table (a browser can hold a team it has not
      // pressed Ready on yet).
      pool = [];
      claimedTeam = (ctx.currentTeam && setup.teams.some(t => t.id === ctx.currentTeam.teamId))
        ? ctx.currentTeam.teamId
        : (Object.entries(setup.claims).find(([, c]) => c.by === me && claimIsLive(c)) || [null])[0];
      selectedTeam = null;
      goto(renderBuild, +1);
    } else {
      // ⛔ Đợt 171 — no `updatePanelWidth(teamCount)` here any more: the width
      // is fixed once at this function's top and no longer depends on team
      // count, so landing back on renderSetup (solo, or Reset) needs nothing.
      repaint();
    }

    // Watch for claims made on other screens while this panel is open.
    watchForClose();
    unsub = subscribeSetup(next => {
      if (!alive()) { stopWatch(); return; }
      // ⭐ Đợt 168 — `teams`/`classId`/`className` now sync too, not just
      // `claims`. Reset teams (wipeSetup) empties the WHOLE table from
      // wherever it is pressed; a screen sitting on renderBuild elsewhere
      // needs to find out its own columns are gone, not just that nobody
      // claims them — syncing only `claims` (the old behaviour) left it
      // repainting a columns screen for a team table that no longer existed.
      const hadTeams = setup.teams.length > 0;
      setup.claims = next.claims;
      setup.teams = next.teams;
      setup.classId = next.classId;
      setup.className = next.className;
      // Someone else took the team we had selected/ticked — drop it rather than
      // let the teacher press Ready on a team that is no longer theirs.
      const taken = id => { const c = setup.claims[id]; return claimIsLive(c) && c.by !== me; };
      if (selectedTeam && taken(selectedTeam)) selectedTeam = null;
      if (claimedTeam && taken(claimedTeam)) { claimedTeam = null; toast("That team was taken on another screen"); }
      if (current === renderBuild) {
        if (hadTeams && !setup.teams.length) {
          // The table was reset on another screen — bounce back to the class
          // picker rather than repaint a columns screen for a team table that
          // no longer exists (teacher: "build lại các đội từ đầu luôn").
          pool = []; claimedTeam = null; selectedTeam = null;
          toast("The team table was reset on another screen");
          goto(renderSetup, -1);
        } else {
          repaint();
        }
      }
    });
  }

  boot();
}
