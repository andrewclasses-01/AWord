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
// ⭐ Đợt 197 — the Recent results screen draws the SAME two boards the live
// Show answers does. Both come from core/showdown-review.js, which is DOM-only
// and free of Firestore, so importing it here does not breach the rule that
// keeps THIS file behind a dynamic import (see the header).
import {
  renderReviewList, renderReviewPodium, renderReviewTable, fitPodiumNames, POD_MAX_W, POD_MIN_W
} from "./showdown-review.js";
import {
  MIN_TEAMS, MAX_TEAMS, MAX_PER_TEAM, SOLO_TEAM_ID, browserId, writePick, clearPick,
  readPendingResult, writePendingResult, clearPendingResult,
  mergeClassBlocks, rankBlocks, shortenName, buildAnalysisRows, formatActDisplayName,
  classifyColor, DEFAULT_CLASSIFY
} from "./showdown.js";

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
    // ⭐⭐ Đợt 197 — WHICH DIVISION OF THE CLASS THIS IS. Minted once, by the
    // browser that presses Next, and carried by every board that plays off this
    // table. Two jobs, both new this đợt:
    //   • the durable result history groups a class's boards into ONE match by
    //     (tableId + act + play number) — see core/showdown-history.js;
    //   • `publishTable` uses it to tell "I am replacing the table" apart from
    //     "I am writing a stale copy of the table somebody else just edited".
    tableId: String(raw?.tableId || ""),
    // ⭐⭐ Đợt 191 — WHO IS PLAYING TODAY (teacher, 18/8/2026: deleting a pupil on
    // the class screen must survive). The register in Settings › Classes is the
    // permanent roll and is never edited from here; THIS is the shorter list the
    // teacher trimmed for this lesson — absentees taken out, a visitor typed in.
    // Kept beside the teams rather than inside them because it has to outlive
    // them: "Reset teams" throws the table away and must NOT bring the absentees
    // back (see wipeSetup), and only the Reset button on the class screen itself
    // clears this.
    // `rosterClass` remembers which class the list belongs to, so switching to a
    // different class cannot inherit the previous one's absentees.
    rosterClass: String(raw?.rosterClass || ""),
    roster: (Array.isArray(raw?.roster) ? raw.roster : [])
      .map(m => ({ id: String(m?.id || ""), name: String(m?.name || "").trim() }))
      .filter(m => m.name),
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
 * ⭐⭐⭐ Đợt 197 (19/8/2026) — TÍCH MỘT ĐỘI KHÔNG ĐƯỢC GHI ĐÈ CẢ BẢNG.
 *
 * Pressing READY only ever wanted to add ONE key to `claims`. It did it by
 * writing the WHOLE document from this browser's own snapshot — so a second
 * machine that had edited the teams a second earlier had its edit silently
 * replaced by whatever this browser happened to be holding. Nothing on either
 * screen said a word; the losing machine simply found its line-up changed back.
 * (Found while investigating the A1B result split — same family: a write that
 * carries more than it means to, and loses somebody else's work in silence.)
 *
 * This writes ONLY the claims map, inside a TRANSACTION, so:
 *   • the teams, roster, class and tableId in the document are untouched — they
 *     stay whatever the server has, which is by definition the newest;
 *   • claims are re-derived from the SERVER's copy, so two machines pressing
 *     Ready in the same second both end up holding their own team instead of
 *     one of them quietly losing it.
 *
 * `mine` is the team this browser is taking, or null to just let go of whatever
 * it holds (Single mode / release / leaving Showdown).
 * Returns the claims map as it now stands on the server.
 */
/**
 * ⭐⭐⭐ Đợt 197 — PUBLISH THIS SCREEN'S TABLE **AND** ITS CLAIM, IN ONE
 * TRANSACTION, WITHOUT EVER DELETING ANOTHER SCREEN'S WORK.
 *
 * Pressing READY is the only moment a built table reaches Firestore, so it has
 * to write the teams — but it must not do what it used to, which was to stamp
 * this panel's whole snapshot over whatever was there. Three cases, decided on
 * the SERVER's copy inside the transaction:
 *
 *   1. we minted a different `tableId`  → we are DELIBERATELY replacing the
 *      table (the teacher pressed Next and divided the class again). Ours wins.
 *   2. same table, and the server has moved on since we loaded → another screen
 *      edited these very teams while this panel was open. The SERVER's teams
 *      win, we contribute only our claim, and the caller is told so it can say
 *      so out loud. Losing a chip-drag is annoying; losing it silently is the
 *      bug this đợt exists to close.
 *   3. otherwise → ours, which is the ordinary single-screen case.
 *
 * Claims are ALWAYS merged from the server (ours dropped everywhere, then set
 * on `claimTeamId`), so two machines pressing Ready in the same second both
 * keep their team.
 *
 * @returns {{ node: object, superseded: boolean }}
 */
export async function publishTable(setup, { claimTeamId = null, baseAt = 0 } = {}) {
  const uid = await requireUid();
  const me = browserId();
  const [d, { doc, runTransaction }] = await Promise.all([db(), fs()]);
  const ref = doc(d, `users/${uid}/items`, DOC_ID);
  let superseded = false;
  const node = await runTransaction(d, async tx => {
    const snap = await tx.get(ref);
    const server = normalize(snap.exists() ? snap.data() : {});
    const ours = normalize(setup);
    const replacing = !!ours.tableId && ours.tableId !== server.tableId;
    superseded = !replacing && server.teams.length > 0 && (server.updatedAt || 0) > (baseAt || 0);
    const base = superseded ? server : ours;
    const claims = {};
    Object.entries(server.claims).forEach(([tid, c]) => { if (c.by !== me) claims[tid] = c; });
    if (claimTeamId) claims[claimTeamId] = { by: me, at: Date.now() };
    const next = normalize({
      ...base,
      claims,
      tableId: base.tableId || ours.tableId || server.tableId,
      updatedAt: Date.now()
    });
    tx.set(ref, clean(next));
    return next;
  });
  cache = node; cacheUid = uid;
  return { node, superseded };
}

/**
 * ⭐⭐ Đợt 217 (thầy, 20/8/2026) — XOÁ CLAIM CỦA **MỘT ĐỘI**, BẤT KỂ AI ĐANG GIỮ.
 *
 * *"cho phép các máy bất kỳ có thể xóa lưu team của đội khác"*. Đây là hàm ghi duy
 * nhất trong file này đụng tới hàng của trình duyệt KHÁC — mọi hàm còn lại
 * (`writeMyClaim`, `releaseMyClaim`) đều chỉ dám sửa hàng `c.by === me`.
 *
 * ⛔⛔ VÌ SAO VIỆC NÀY AN TOÀN, DÙ NGHE NHƯ KHÔNG: cái nó xoá không phải dữ liệu, mà
 * là một chỗ ĐẶT GẠCH. Trước đợt này chỗ đặt gạch chỉ mất theo TTL 12 giờ, nên một
 * máy bị tắt giữa buổi khoá cứng đội đó cho tới sáng hôm sau và không màn nào trong
 * lớp gỡ ra được. Người bấm là chính thầy, đứng trước bảng, sau một câu hỏi xác nhận.
 *
 * ⚠️ TRONG MỘT GIAO DỊCH và chỉ chạm `claims`, cùng lý do `writeMyClaim` đã ghi: đọc
 * cả bảng rồi ghi cả bảng là có ngày đóng dấu một bản sao cũ đè lên đội hình máy khác
 * vừa dựng.
 * ⚠️ KHÔNG động tới claim của chính mình — nhả đội người khác không có nghĩa là bỏ
 * đội của mình.
 */
export async function releaseTeamClaim(teamId) {
  if (!teamId) return {};
  const uid = await requireUid();
  const [d, { doc, runTransaction }] = await Promise.all([db(), fs()]);
  const ref = doc(d, `users/${uid}/items`, DOC_ID);
  const claims = await runTransaction(d, async tx => {
    const snap = await tx.get(ref);
    const server = normalize(snap.exists() ? snap.data() : {});
    const next = { ...server.claims };
    delete next[teamId];
    if (snap.exists()) tx.update(ref, { claims: clean(next), updatedAt: Date.now() });
    return next;
  });
  if (cache && cacheUid === uid) cache = { ...cache, claims };
  return claims;
}

export async function writeMyClaim(mine) {
  const uid = await requireUid();
  const me = browserId();
  const [d, { doc, runTransaction }] = await Promise.all([db(), fs()]);
  const ref = doc(d, `users/${uid}/items`, DOC_ID);
  const claims = await runTransaction(d, async tx => {
    const snap = await tx.get(ref);
    const server = normalize(snap.exists() ? snap.data() : {});
    const next = { ...server.claims };
    // One browser holds at most one team, so drop ours everywhere first — a
    // stale self-claim would hide a team from every other screen until the TTL.
    Object.entries(next).forEach(([tid, c]) => { if (c.by === me) delete next[tid]; });
    if (mine) next[mine] = { by: me, at: Date.now() };
    // ⚠️ `update`, not `set`: a `set` — even a merged one — would let this
    // function reintroduce fields from a stale snapshot, which is the very bug
    // it exists to close. If the document does not exist yet there is no table
    // to claim a team in, so there is nothing to write either.
    if (snap.exists()) tx.update(ref, { claims: clean(next), updatedAt: Date.now() });
    return next;
  });
  // Keep the local copy in step so the panel does not have to wait for the
  // listener to come back round before it can repaint.
  if (cache && cacheUid === uid) cache = { ...cache, claims };
  return claims;
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
  // ⭐ Đợt 197 — was read-the-whole-table / edit / write-the-whole-table, which
  // meant simply LEAVING Showdown could stamp a stale copy of the teams over a
  // line-up another machine had just built. Now it touches `claims` and nothing
  // else, inside a transaction. See writeMyClaim's own note.
  try { await writeMyClaim(null); }
  catch { /* signed out or offline — the TTL will clear it */ }
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
export async function wipeSetup({ keepRoster = null, rosterClass = "" } = {}) {
  // ⭐⭐ Đợt 191 — "Reset teams" KEEPS TODAY'S CLASS LIST (teacher, 18/8/2026:
  // "nếu reset team ở màn sau… thì khi chọn lại lớp vẫn chỉ hiện những người
  // không bị xóa"). Deleting absentees is a decision about the LESSON; throwing
  // away the team table is a decision about the TEAMS, and making the second undo
  // the first is what sent the teacher back to re-deleting the same pupils.
  // The only thing that restores everybody is the Reset button on the class
  // screen itself, which calls this with no `keepRoster`.
  // ⚠️ `classId`/`className` are still cleared — the table is genuinely gone —
  // so the surviving list carries its own `rosterClass` to say whose it is.
  const keep = Array.isArray(keepRoster) ? keepRoster : [];
  try {
    await saveSetup({
      classId: "", className: "", teams: [], claims: {},
      roster: keep.map(m => ({ id: m.id, name: m.name })),
      rosterClass: keep.length ? String(rosterClass || "") : ""
    });
  } catch { /* signed out or offline — nothing was shared yet, nothing to wipe */ }
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

// ---------------------------------------------------------------
// ⭐⭐⭐ Đợt 196 (19/8/2026) — THE BOARD MUST CONVERGE BY ITSELF
// ---------------------------------------------------------------
// The teacher's report: four columns, four teams, class A1B (18 pupils). Teams
// 1/3/4 all agreed on the same 13 pupils; team 2's column showed 5 and nothing
// else, in BOTH directions — it could not see them and they could not see it.
//
// Everything about the old design made that possible and then hid it:
//   • ONE fire-and-forget write at the end of the play. A failure was a
//     `console.warn` on a screen nobody reads, never retried — that team is then
//     missing from every other board for the rest of the lesson.
//   • ONE read, on the FIRST tap of the title. A board that peeked before the
//     others finished kept its answer; a plain tap never re-read (only the
//     double tap did, and nothing on screen says so).
//   • The `roundKey` filter dropped rows in SILENCE. Two columns on two acts
//     that look identical (a duplicate act, a column opened by hand) are
//     invisible to each other with no symptom at all — exactly the two-way
//     isolation the teacher photographed.
//
// So the three parts below, and they are the whole fix:
//   1. `subscribeResults` — the board WATCHES the shared row instead of asking
//      once. A team that finishes appears on every other screen by itself.
//   2. `saveTeamResult` retries, and what it could not send is kept in
//      `sessionStorage` (the same per-column store the pick lives in) so
//      `flushPendingResult()` can send it later — after the network came back,
//      or after that column was reloaded.
//   3. `splitResults` hands back the rows it DROPPED as well as the ones it
//      kept, so core/showdown-review.js can say "2 teams played a different
//      act" instead of quietly showing a short class.
// ⚠️ None of it may live in core/showdown-review.js: that file is imported
// statically by the engine and must stay clear of Firestore (see its header).

/**
 * Sort the published rows into the ones this play may show and the ones it may
 * not. `teamsMap` is normalizeResults()'s output.
 *
 *   { teams: [entry…], otherActs: [{ teamName, actName }…] }
 *
 * `otherActs` is the half that used to disappear without trace.
 */
export function splitResults(teamsMap, roundKey) {
  const key = String(roundKey || "");
  const teams = [];
  const otherActs = [];
  Object.values(teamsMap || {}).forEach(t => {
    // ⭐ Đợt 180 — never a SOLO row. saveTeamResult() no longer writes one, but
    // every document written before that đợt may still hold one, and it is the
    // whole class on its own: left in, it doubles every pupil on the board (see
    // that function's own note). Dropped on READ as well as on write so the bad
    // row disappears from the teacher's screen immediately, with no Reset teams
    // and no trip to the Firebase console.
    if (t.teamId === SOLO_TEAM_ID) return;
    // An entry with no key at all is from a build older than this one; it is
    // still this teacher's own class, so let it through rather than hide a
    // result the teacher can see was recorded.
    if (!key || !t.roundKey || t.roundKey === key) { teams.push(t); return; }
    otherActs.push({ teamName: t.teamName, actName: t.actName || "" });
  });
  teams.sort((a, b) => a.teamName.localeCompare(b.teamName));
  return { teams, otherActs };
}

// ---- the outbox: what this column owes the shared row ----------------------
// The store itself lives in core/showdown.js (`readPendingResult` and friends),
// beside the pick and the browser id, because the ENGINE has to be able to ask
// "do I still owe a row?" without importing this file — see that block's note.
// Three goes, spread far enough apart to outlive a classroom wifi stumble but
// not so far that the teacher has closed the summary before the last one.
const SEND_TRIES = 3;
const SEND_BACKOFF = [400, 1400, 3600];

const wait = ms => new Promise(r => setTimeout(r, ms));

/** One attempt at the merged write. Throws exactly what Firestore throws. */
async function writeEntry(entry) {
  const uid = await requireUid();
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
}

/**
 * Send `entry`, retrying, and keep it in the outbox until it lands.
 * Resolves true when the shared row has it, false when it is still owed — it
 * NEVER throws, because every caller is somewhere the teacher is looking at a
 * game and must not be interrupted.
 */
async function sendEntry(entry) {
  writePendingResult(entry);          // written BEFORE the first try: a column that
                                   // is reloaded mid-write still owes the row
  let last = null;
  for (let i = 0; i < SEND_TRIES; i++) {
    if (i) await wait(SEND_BACKOFF[i - 1]);
    try {
      await writeEntry(entry);
      clearPendingResult();
      return true;
    } catch (e) { last = e; }
  }
  console.warn("AWord: this team's result is still not shared", last);
  return false;
}

/**
 * Try again to send whatever this column still owes. Called by the engine when
 * the Showdown review opens and every time the shared row changes, so a result
 * that failed at the whistle lands as soon as anything at all is working again.
 * Resolves true if there was nothing owed or it went through.
 */
export async function flushPendingResult() {
  const entry = readPendingResult();
  if (!entry) return true;
  return sendEntry(entry);
}

/**
 * Publish THIS browser's team result. Called by core/engine.js the moment a
 * Showdown play finishes.
 *
 * ⚠️ Never throws (Đợt 196). It used to throw when signed out and the caller
 * turned that into a console warning — which is how a whole team went missing
 * from the class board with nothing on any screen to say so. What cannot be
 * sent now stays in the outbox above and is retried; `readPendingResult()` (core/showdown.js) is what
 * the review screen reads to put a warning in front of the teacher.
 */
export async function saveTeamResult({ pick, roundKey, actName = "", students }) {
  if (!pick?.teamId) return null;
  // ⭐⭐ Đợt 180 (LEGACY GUARD ONLY since Đợt 242) — A SOLO PICK NEVER PUBLISHES.
  // One-team mode used to be the whole class in ONE browser, documented at
  // SOLO_TEAM_ID / applySolo() as never touching Firestore at all — but
  // core/engine.js's finish() only ever asked "is there a pick?", so it
  // published `sd_solo` like any other team.
  //
  // What that cost (measured 17/8/2026, teacher's own class of 15):
  // a solo play earlier in the day left a `sd_solo` row holding ALL FIFTEEN
  // pupils. Later the same act was played properly as 3 teams of 5, and the
  // class board added that row to the three real ones — 5 (ours, from memory)
  // + 5 + 5 + 15 = **30 pupils, every child listed exactly twice**. Nothing on
  // screen could explain it: each team's own board was right, and the stale row
  // wore the class's own name.
  //
  // ⭐ Đợt 242 (thầy) — one-team mode now IS a real team (`sdt_1`, applySolo's
  // own note) and publishes here same as any other, on purpose: it removes the
  // separate write path that made the bug above possible in the first place,
  // rather than patching around it. This check is kept only because a browser
  // that had a solo game running the moment this update deployed still carries
  // the OLD `sd_solo` id in its sessionStorage pick until it starts a new one —
  // that stale id must still refuse to publish, for exactly the reason above.
  //
  // Guarded BEFORE `requireUid()` on purpose: a pick this old is also from
  // before Firestore was ever touched, and this must not throw on its way to
  // doing nothing.
  if (pick.teamId === SOLO_TEAM_ID) return null;
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
  await sendEntry(entry);
  return entry;
}

/**
 * Every team that has published a result for THIS act — the caller's own team
 * included (core/showdown-review.js drops it and uses its live copy instead) —
 * PLUS the rows this play may not show (Đợt 196; see splitResults).
 *
 *   { teams: [entry…], otherActs: [{teamName, actName}…] }
 *
 * Always read FRESH: the whole point of the button that calls this is that
 * another team has just finished, so a cache would be answering the wrong
 * question.
 */
export async function loadTeamResults(roundKey) {
  const uid = await requireUid();
  const [d, { doc, getDoc }] = await Promise.all([db(), fs()]);
  const snap = await getDoc(doc(d, `users/${uid}/items`, RESULTS_DOC));
  return splitResults(normalizeResults(snap.exists() ? snap.data() : {}), roundKey);
}

/**
 * ⭐⭐⭐ Đợt 196 — WATCH the shared row for as long as the review is on screen.
 * This is the part that makes four boards agree without anybody being told to
 * chạm đúp: the moment another team's game ends, its row lands here and every
 * other column repaints itself.
 *
 * `onChange({ teams, otherActs })` — the same shape loadTeamResults() returns.
 * Returns an unsubscribe function (a no-op if the listener could not start, in
 * which case the one-shot read the review already did is still what is shown).
 *
 * ⚠️ Errors are handed to `onError` rather than swallowed: a review that cannot
 * watch must SAY it is not live, which is the whole lesson of this đợt.
 */
export function subscribeResults(roundKey, onChange, onError = () => {}) {
  let stop = null, dead = false;
  (async () => {
    try {
      const uid = await requireUid();
      const [d, { doc, onSnapshot }] = await Promise.all([db(), fs()]);
      if (dead) return;
      stop = onSnapshot(
        doc(d, `users/${uid}/items`, RESULTS_DOC),
        snap => {
          if (dead) return;
          onChange(splitResults(normalizeResults(snap.exists() ? snap.data() : {}), roundKey));
        },
        err => { if (!dead) onError(err); }
      );
    } catch (e) { if (!dead) onError(e); }
  })();
  return () => { dead = true; if (stop) { try { stop(); } catch { /* already gone */ } } };
}

/** Drop every published result (Reset teams — see wipeSetup). */
export async function wipeResults() {
  // ⚠️ Đợt 196 — and drop what this column still OWES, or the retry would put
  // yesterday's team straight back into the row the teacher has just emptied.
  clearPendingResult();
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

// ---------------------------------------------------------------
// ⭐⭐⭐ Đợt 198 — HOW A RANDOM DEAL DIVIDES THE CLASS
// ---------------------------------------------------------------
// Two rules, both the teacher's, both new this đợt:
//
//   1. THE ODD ONES OUT GO TO THE EDGES. "Khi số học sinh không chia hết…, ưu
//      tiên các cột team nhỏ nhất hoặc lớn nhất nhận nhiều hơn, các team ở giữa
//      nhận ít hơn. Ví dụ có 4 team và có 18 học sinh thì Team 1 = Team 4 = 5
//      học sinh, Team 2 = Team 3 = 4 học sinh."
//      The old rule simply topped up whichever team was emptiest, which put
//      every spare pupil in the LEFTMOST columns — 5/5/4/4 — and a board where
//      the left half is visibly bigger reads as a mistake from the back of the
//      room. Spreading the extras to the two ENDS makes the shape symmetrical.
//
//   2. BOYS AND GIRLS AS EVEN AS THE NUMBERS ALLOW. "tránh việc một đội có quá
//      nhiều nam và đội khác thì có quá nhiều nữ."
//      Đợt 191 already interleaved the three lanes before dealing, which spread
//      them WELL but not evenly: an interleave is a good shuffle, not a
//      constraint, and it could still hand one team four boys and another one.
//      This deals each gender to whichever team currently holds the FEWEST of
//      it, which is a constraint and cannot drift.
//
// ⚠️ PURE, AND EXPORTED, SO IT CAN BE MEASURED. A dealing rule is exactly the
// kind of thing that looks right in the code and comes out lopsided on a real
// class of 23; `scratch/sd198-deal.mjs` runs it over every class size from 2 to
// 40 against every team count. Nothing in here touches the DOM or Firestore.

/** [0, T-1, 1, T-2, …] — the ends first, working inwards. Rule 1's whole shape. */
export function outwardIn(count) {
  const out = [];
  let lo = 0, hi = count - 1;
  while (lo <= hi) {
    out.push(lo);
    if (hi !== lo) out.push(hi);
    lo++; hi--;
  }
  return out;
}

/**
 * How many pupils each team should END UP with.
 * @param {number} total  everybody who will be placed (already-seated + waiting)
 * @param {number} count  how many teams may be filled
 * @param {number} cap    MAX_PER_TEAM
 */
export function targetSizes(total, count, cap = MAX_PER_TEAM) {
  const n = Math.max(1, count | 0);
  const base = Math.floor(total / n);
  const extra = total % n;
  const sizes = new Array(n).fill(base);
  outwardIn(n).slice(0, extra).forEach(i => { sizes[i]++; });
  return sizes.map(s => Math.min(s, cap));
}

/**
 * Work out who goes where. Returns one array of members PER TEAM — the people to
 * ADD, not the finished team, so a half-built table keeps whoever is already in it.
 *
 * @param {object[]} teams     the teams that may be filled, IN BOARD ORDER
 *                             (index 0 is the leftmost column — rule 1 depends
 *                             on it, so a caller that filters out claimed teams
 *                             must not also reorder them)
 * @param {object[]} pool      the pupils still waiting
 * @param {function} genderOf  id => "m" | "f" | ""
 * @param {number}   cap       MAX_PER_TEAM
 */
export function planDeal(teams, pool, genderOf = () => "", cap = MAX_PER_TEAM) {
  const T = (teams || []).length;
  const waiting = (pool || []).slice();
  if (!T || !waiting.length) return new Array(Math.max(0, T)).fill(null).map(() => []);

  const seated = teams.map(t => (t.members || []).length);
  const sizes = targetSizes(seated.reduce((a, b) => a + b, 0) + waiting.length, T, cap);
  // A team that is ALREADY over its share keeps everybody — this function adds,
  // it never evicts. The people it therefore cannot place are handed out below.
  const need = sizes.map((s, i) => Math.max(0, s - seated[i]));

  let short = waiting.length - need.reduce((a, b) => a + b, 0);
  // ⚠️ `while`, not one pass: a team can reach `cap` while we are still spreading
  // the remainder, and the pupils it turned away have to go somewhere else.
  const rank = outwardIn(T);
  while (short > 0) {
    const took = rank.find(i => seated[i] + need[i] < cap);
    if (took === undefined) break;                 // every team full — see randomDeal's toast
    need[took]++;
    short--;
  }

  // Count what each team already holds, per gender, so a partly-built table is
  // balanced from where it actually is rather than from zero.
  const have = teams.map(t => {
    const c = { m: 0, f: 0, "": 0 };
    (t.members || []).forEach(x => { c[genderOf(x.id) || ""]++; });
    return c;
  });
  const added = new Array(T).fill(0);
  const out = teams.map(() => []);

  // Biggest group first: it has the least freedom left once the others are down.
  const groups = [
    waiting.filter(m => genderOf(m.id) === "m"),
    waiting.filter(m => genderOf(m.id) === "f"),
    waiting.filter(m => !genderOf(m.id))
  ].filter(g => g.length).sort((a, b) => b.length - a.length);

  groups.forEach(group => {
    const key = genderOf(group[0].id) || "";
    group.forEach(m => {
      let best = -1;
      for (const i of rank) {
        if (added[i] >= need[i]) continue;                       // this team is done
        if (best < 0) { best = i; continue; }
        // Fewest of THIS gender wins; then the team with fewest people overall,
        // so the sizes stay on target; `rank` order is the final tie-break, which
        // is what keeps rule 1's symmetry when everything else is level.
        const a = have[i], b = have[best];
        if (a[key] !== b[key]) { if (a[key] < b[key]) best = i; continue; }
        if (seated[i] + added[i] < seated[best] + added[best]) best = i;
      }
      if (best < 0) return;                                      // nowhere left
      out[best].push(m);
      have[best][key]++;
      added[best]++;
    });
  });
  return out;
}

let seq = 0;
function localId(prefix) { return `${prefix}_${Date.now().toString(36)}_${(seq++).toString(36)}`; }

// ---------------------------------------------------------------
// NAME ABBREVIATION (Đợt 166) — the LAST resort for a chip that still does not
// fit its column after fitBuildScreen() has shrunk the whole screen as far as
// it goes (see SD_FIT_MIN).
// ⭐ Đợt 207 — THE RULE ITSELF NOW LIVES IN core/showdown.js (read its note
// there). It moved because the result boards in core/showdown-review.js need the
// same last-resort abbreviation, and that file may not import THIS one: it is
// loaded statically by the engine and must stay clear of Firestore and of the
// library layer. Re-exported here under its old name so every caller — inside
// this file and anywhere else — kept working untouched.
export { shortenName };

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
// ⭐ Đợt 236 — exported too: the new SHOWDOWN home page (core/showdown-home.js)
// plays the same little clicks/glides for the same gestures (tap a folder,
// open a tile, begin an analysis) and must not invent a second copy of this
// vocabulary — see this const's own header just above for why it exists at all.
export const sfx = {
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

// ⭐ Đợt 224 — ONE categorical palette, ANALYSE's stacked chart and its legend
// share it by INDEX INTO `entries` (oldest match = colour 0), so a tier and its
// legend swatch can never drift apart. Deliberately avoids red/green: those
// already mean "wrong"/"right" everywhere else in Showdown (`.is-ok`/`.is-bad`,
// the pctBand colours in core/showdown.js) and a stacked-match colour wearing
// one of them would read as a score, not as "which match is this".
// ⭐⭐ Đợt 230 (thầy: "màu sắc các cột tươi sáng và dễ nhìn hơn, nhưng vẫn là màu
// hiện đại") — brighter/more saturated than the Đợt 224 set, same eight hues'
// worth of distinctness and the same red/green exclusion above.
// ⚠️ core/showdown-export.js's ANALYSE PNG keeps its OWN copy of these same
// eight colours, same reason this file's own POD_MAX_W/POD_MIN_W are copied
// rather than imported from core/showdown-review.js: neither of these two
// dynamic-import-only files should gain a static import of the other just for
// one small shared constant. Change a colour here, change it there too.
export const ANALYSE_COLORS = ["#2f7dfd", "#9061f9", "#f5a623", "#14b8a6", "#ec4899", "#06b6d4", "#fb923c", "#64748b"];

/** Run `anim`, and guarantee `after()` happens even if onfinish never fires. */
export function whenDone(anim, after, ms) {
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

// ⭐⭐ Đợt 236 — lifted to module scope (from inside buildShowdownPanel, where
// they lived since Đợt 197/207/224) and exported: the new SHOWDOWN home page
// (core/showdown-home.js) draws the exact same match tiles, chart and legend
// the in-game Recent results/Analyse screens do, and a second copy of any one
// of these is a second copy of a rule that WILL drift (this file's own
// recurring lesson — see mergeClassBlocks' note in core/showdown.js). None of
// them ever referenced the panel's own closure state (`setup`/`classes`/
// `roster`/...) — only their own arguments plus module-level `el`/`icons`/
// `ANALYSE_COLORS`/`POD_MAX_W`/`POD_MIN_W` — so the move changes no behaviour.

/** "14:32 · 22/8" — a match's timestamp, formatted the same everywhere it appears. */
export const when = ms => {
  const d = new Date(Number(ms) || 0);
  const p = x => String(x).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())} · ${d.getDate()}/${d.getMonth() + 1}`;
};

/**
 * ⭐ Đợt 224 — six scattered CSS-only sparkles, trusted markup. Exactly the
 * `.aw-sd-pod-star` idiom (core/showdown-review.js's renderReviewPodium) —
 * `clip-path` stars, staggered `animation-delay`, animated ENTIRELY in CSS so
 * a backgrounded myActivity column does not need requestAnimationFrame to keep
 * them twinkling (the same rAF trap core/HUONG DAN CORE.md already warns
 * about). Its own function rather than folded into a caller: `.aw-sd-recent`
 * and the SHOWDOWN home page are both plain px surfaces (not `cqw`, unlike the
 * real board's own `.aw-sd-pod-star`), so this one small markup shape is what
 * both share instead of each inventing it.
 */
export function spark6() {
  let s = `<span class="aw-sd-rec-analyse-spark" aria-hidden="true">`;
  for (let i = 0; i < 6; i++) s += `<i class="aw-sd-rec-star s${i}"></i>`;
  return s + `</span>`;
}

/** One match's whole class, deduped and ranked — the ONE rule, from showdown.js. */
export function matchBlocks(match) {
  const groups = Object.values(match?.teams || {})
    .map(t => ({ teamName: t.teamName || "", at: Number(t.at) || 0, blocks: t.students || [] }));
  return rankBlocks(mergeClassBlocks(groups));
}

/**
 * ⭐⭐ Đợt 230 — ONE PLACE that decides what a match's name reads as, so the
 * mini card, the expanded detail, the download popup and the ANALYSE legend
 * can never show four different things for the same row.
 *   1. the teacher's own rename (`customName`) — ALWAYS wins, verbatim, once set
 *   2. the formatted name ("BODY PARTS / ENG1 QUIZ", Đợt 242 — clue set AND
 *      template) when this match recorded a clue set (core/showdown.js's
 *      formatActDisplayName — a no-op for a match filed before Đợt 230, or for
 *      a non-variant act; the template half alone is a no-op for a match filed
 *      before Đợt 242, and still reads as just "BODY PARTS / ENG1")
 *   3. the raw `actName`, then the literal fallback, same as always
 */
export function displayName(m) {
  if (m.customName) return m.customName;
  return formatActDisplayName(m.actName, m.contentVariant, m.templateType) || m.actName || "Showdown";
}

/**
 * The miniature funnel — one match, tiny. See its call sites' own notes for why
 * it is not just a small `renderReviewPodium`: the real boards are sized in
 * `cqw` (a percentage of the 16:9 stage) and render unreadably small inside a
 * ~200px column or tile; this is the same SHAPE at its own fixed px sizes.
 *
 * ⭐⭐ Đợt 207 — reads like the real board: the place is INSIDE the box (a medal
 * for the top three, a numeral after that) and the name is given IN FULL,
 * shrunk to fit rather than abbreviated on sight or cut off with an ellipsis.
 */
export function renderMini(ranked) {
  const box = el("div", "aw-sd-mini");
  const n = ranked.length;
  if (!n) { box.append(el("div", "aw-sd-rec-note", "No pupils")); return box; }
  ranked.forEach((b, i) => {
    // The same linear taper as the real podium, off the same two constants, so
    // the shape the teacher recognises really is the same shape.
    const w = n > 1 ? POD_MAX_W - (POD_MAX_W - POD_MIN_W) * (i / (n - 1)) : POD_MAX_W;
    const row = el("div", "aw-sd-mini-row");
    row.style.setProperty("--w", w.toFixed(2) + "%");
    const card = el("div", "aw-sd-mini-box" + (i < 3 ? ` is-m${i + 1}` : ""));
    const badge = el("span", "aw-sd-mini-badge" + (i < 3 ? " is-medal" : ""));
    if (i < 3) badge.innerHTML = icons[`medal${i + 1}`];    // trusted markup, core/icons.js
    else badge.textContent = String(i + 1);
    const nm = el("span", "aw-sd-mini-name");
    // ⚠️ The FULL name goes in, and `fitPodiumNames` decides afterwards whether
    // it has to shrink or, in the last resort, abbreviate.
    nm.textContent = b.name;                                // never innerHTML
    nm.dataset.full = b.name;
    nm.title = b.name;
    card.append(badge, nm, el("span", "aw-sd-mini-score", String(b.right)));
    row.append(card);
    box.append(row);
  });
  return box;
}

/** One swatch + act name + time per selected match, same colour rule as the tiers. */
export function renderLegend(entries) {
  const leg = el("div", "aw-sd-rec-legend");
  entries.forEach((e, i) => {
    const item = el("div", "aw-sd-rec-legend-item");
    const sw = el("span", "aw-sd-rec-legend-sw");
    sw.style.background = ANALYSE_COLORS[i % ANALYSE_COLORS.length];
    const tx = el("span", "aw-sd-rec-legend-txt");
    tx.textContent = `${e.label} · ${when(e.at)}`;      // teacher's own text + a formatted time
    item.append(sw, tx);
    leg.append(item);
  });
  return leg;
}

/**
 * The bar chart itself — plain DOM/CSS, no canvas/SVG/library, same idiom as
 * every other board in this file.
 *
 * ⚠️ EVERY TIER'S HEIGHT IS A % OF THE SAME `yMax` — never of its own bar's
 * total. That is what makes two pupils' bars comparable at a glance (a 40%
 * tier is the same height wherever it appears); computing it against each
 * bar's own total would make every bar read as "100% of itself" and the whole
 * point of stacking would be gone.
 *
 * ⭐⭐ Đợt 230 (thầy chốt qua AskUserQuestion) — `yMax` is a FIXED 100, not a
 * dynamic ceiling: `r.total` is an AVERAGE across the matches a pupil was
 * present for (core/showdown.js's buildAnalysisRows), so it can never exceed
 * 100 and the axis never needs to stretch for it. Each drawn TIER divides its
 * match's raw `seg.pct` by `r.count` (how many matches this pupil was present
 * for) — that is what makes the visible stack's total height land exactly on
 * the average, while the NUMBER printed inside a tier stays that match's real,
 * un-divided score.
 *
 * `full`/`partial` — Đợt 224 (thầy chốt): full first, each group sorted by its
 * own total, `partial` drawn as a second short row after a narrow gap — NOT
 * interleaved with `full` and NOT split further by how much any one pupil is
 * missing.
 */
export function renderChart(full, partial, entries) {
  const wrap = el("div", "aw-sd-rec-chartwrap");
  const rows = [...full, ...partial];
  if (!rows.length) {
    wrap.append(el("div", "aw-sd-rec-note", "No pupils in common between these matches."));
    return wrap;
  }
  const yMax = 100;

  const plot = el("div", "aw-sd-rec-plotarea");
  const track = el("div", "aw-sd-rec-track");
  const grid = el("div", "aw-sd-rec-grid");
  for (let v = 0; v <= yMax; v += 20) {
    const line = el("div", "aw-sd-rec-gridline");
    line.style.bottom = `${(v / yMax) * 100}%`;
    line.append(el("span", "aw-sd-rec-gridlabel", v + "%"));
    grid.append(line);
  }
  track.append(grid);
  const names = el("div", "aw-sd-rec-names");

  const addSpacer = () => {
    track.append(el("div", "aw-sd-rec-bargap"));
    names.append(el("div", "aw-sd-rec-bargap"));
  };
  const addBar = r => {
    const bar = el("div", "aw-sd-rec-bar");
    r.segments.forEach((seg, i) => {
      if (seg.pct == null) return;          // did not play this match — no tier at all
      const tier = el("div", "aw-sd-rec-tier");
      const scaledPct = r.count ? seg.pct / r.count : 0;
      tier.style.height = `${(scaledPct / yMax) * 100}%`;
      tier.style.background = ANALYSE_COLORS[i % ANALYSE_COLORS.length];
      tier.dataset.pct = String(Math.round(seg.pct));
      bar.append(tier);
    });
    // ⭐⭐ Đợt 230 — the big average, ON TOP of the stack. `bar` is
    // `column-reverse` (see app.css's own note on the DOM-order rule this
    // relies on): the FIRST-appended child sits at the bottom and each one
    // after it stacks visually HIGHER, so appending this LAST — after every
    // tier — is what puts it above the tallest one, no bottom/translate maths
    // needed at all.
    const total = el("span", "aw-sd-rec-bartotal", `${Math.round(r.total)}%`);
    // ⭐ Đợt 240 — the pupil's raw (un-rounded) total, so a later classify-bar
    // Apply (applyClassifyToChart below) can re-derive the SAME colour band
    // `drawAnalysisCanvas` would pick for the exact same %, without having to
    // re-parse it back out of this span's own rounded display text.
    total.dataset.total = String(r.total);
    bar.append(total);
    track.append(bar);
    const nm = el("span", "aw-sd-rec-barname");
    nm.textContent = r.name;                  // pupil's own name: never innerHTML
    nm.dataset.full = r.name;
    nm.title = r.name;
    const nmHost = el("div", "aw-sd-rec-namehost");
    nmHost.append(nm);
    names.append(nmHost);
  };

  full.forEach(addBar);
  if (full.length && partial.length) addSpacer();
  partial.forEach(addBar);

  plot.append(track, names);
  // ⭐ Đợt 238 (thầy) — a small "ANDREW CLASSES" footer under the legend, the
  // on-screen twin of the same line core/showdown-export.js's drawAnalysisCanvas
  // draws at the bottom of an exported/Table board — see `.aw-sd-rec-plotarea`'s
  // own note (app.css) on the ~80% height cap that makes room for it.
  wrap.append(plot, renderLegend(entries), el("div", "aw-sd-rec-brand", "ANDREW CLASSES"));
  return wrap;
}

/**
 * ⭐⭐ Đợt 240 (thầy) — re-colours the ANALYSE chart's big total-% numbers by
 * the classify bar, WITHOUT rebuilding the chart (no flicker, no lost scroll
 * position) — a targeted repaint, the DOM twin of `drawAnalysisCanvas`'s own
 * `totalColor` for a multi-match board (core/showdown-export.js). Reads each
 * `.aw-sd-rec-bartotal`'s own `data-total` (set by `addBar()` above) rather
 * than re-deriving it from `rows`, so the caller never has to keep that array
 * around just for this.
 * @param {Element} root       the chart node (or any ancestor of its bars)
 * @param {{hi:number, lo:number}|null} classify  null clears back to default
 */
export function applyClassifyToChart(root, classify) {
  root.querySelectorAll(".aw-sd-rec-bartotal").forEach(el2 => {
    const total = Number(el2.dataset.total);
    el2.style.color = classifyColor(total, classify) || "";
  });
}

/**
 * ⭐⭐⭐ Đợt 240 (thầy) — THE CLASSIFY BAR: a draggable 2-handle range, VIEW-ONLY
 * (never drawn into an exported file — core/showdown-export.js's `opts.classify`
 * carries the RESULT of a press instead, see that file's own note). Mounted
 * once per board — the Table tab's own header (core/showdown-home.js's
 * openTileDetail) and the ANALYSE chart's own header (openAnalysisChart) —
 * built here, once, so the two never drift into two different drag physics
 * for what is visually the same control.
 *
 * ⚠️ THE AXIS READS RIGHT-TO-LEFT, ON PURPOSE (thầy, chốt qua AskUserQuestion):
 * left edge = 100%, right edge = 0% — "best on the left", the same reading
 * direction every ranked list in this app already uses. `hi` (green, left) is
 * therefore always the LARGER number, `lo` (red, right) the smaller one; a
 * handle can never cross the other (`CLASSIFY_MIN_GAP` below).
 *
 * @param {object} opts
 *   initial   {hi, lo} to start the handles at — the caller passes the
 *             match's own saved `classify` if it has one, else
 *             core/showdown.js's DEFAULT_CLASSIFY.
 *   onApply   ({hi, lo}) => void — fired ONLY on the Apply button (dragging
 *             alone never calls it — thầy: "chỉnh xong bấm nút apply là áp
 *             dụng"), with a fresh, already-clamped object.
 *
 * ⭐⭐ Đợt 241 (thầy: "sau khi tích apply thì thanh này sẽ gần như ẩn đi... bấm
 * 1 lần vào thanh sẽ hiện lại bình thường") — a small state machine on top of
 * the drag physics:
 *   `settled`  true right after Apply — the bar fades near-invisible and the
 *              Apply button itself disappears (nothing left to press: the
 *              board already reflects it). ANY touch on the bar wakes it
 *              back to full opacity (`wake()` below), but that touch ALONE
 *              does not bring the Apply button back.
 *   `dirty`    true only once a drag genuinely MOVES a handle (not merely
 *              touched) since the last Apply/wake — this is what actually
 *              shows the Apply button again (thầy: "khi có điều chỉnh thì
 *              nút Apply mới hiện lại"). Starts `true` so a fresh bar (never
 *              Applied yet) shows Apply from the first paint, same as before.
 *
 * ⭐⭐⭐ Đợt 244 (thầy: "bấm vào thanh phân loại và sáng lên nhưng nếu không
 * điều chỉnh gì mà bấm vào chỗ trống khác thì thanh đó lại tắt sáng") — A WAKE
 * WITH NOTHING DONE TO IT GOES BACK TO SLEEP. Đợt 241 gave the bar a way to wake
 * but no way back: one stray touch and it stayed bright over the board for the
 * rest of the lesson. Third flag:
 *   `awoke`    true from the moment a touch cleared `settled` until either a
 *              real drag (which sets `dirty`, and a bar the teacher is actually
 *              using must NOT dim under their hand) or a pointerdown ANYWHERE
 *              ELSE on the page — which re-settles it.
 *
 * ⚠️ The outside listener is on `document` in the CAPTURE phase, so it still
 * hears the press when the board sits inside a fullscreen element (the Table
 * view requests fullscreen on itself — core/showdown-home.js) and whatever it
 * lands on calls stopPropagation.
 * ⚠️ It UNREGISTERS ITSELF the first time it fires with the bar no longer in the
 * document. buildClassifyBar returns only the node — there is no dispose() for a
 * caller to forget — and a document listener outliving its screen is the
 * ghost-clock of Đợt 131 all over again.
 */
const CLASSIFY_MIN_GAP = 2;
export function buildClassifyBar({ initial, onApply } = {}) {
  let hi = Math.max(0, Math.min(100, Number(initial?.hi ?? DEFAULT_CLASSIFY.hi)));
  let lo = Math.max(0, Math.min(100, Number(initial?.lo ?? DEFAULT_CLASSIFY.lo)));
  if (!(hi - lo >= CLASSIFY_MIN_GAP)) { hi = DEFAULT_CLASSIFY.hi; lo = DEFAULT_CLASSIFY.lo; }
  let settled = false;
  let dirty = true;
  let awoke = false;          // Đợt 244 — woken by a touch, nothing done to it yet

  const wrap = el("div", "aw-sd-classify");
  const capHi = el("span", "aw-sd-classify-cap is-hi", "100%");
  const track = el("div", "aw-sd-classify-track");
  const segHi = el("div", "aw-sd-classify-seg is-hi");
  const segMid = el("div", "aw-sd-classify-seg is-mid");
  const segLo = el("div", "aw-sd-classify-seg is-lo");
  const handleHi = el("button", "aw-sd-classify-handle is-hi");
  handleHi.type = "button"; handleHi.title = "Drag";
  const labelHi = el("span", "aw-sd-classify-handle-label");
  handleHi.append(labelHi);
  const handleLo = el("button", "aw-sd-classify-handle is-lo");
  handleLo.type = "button"; handleLo.title = "Drag";
  const labelLo = el("span", "aw-sd-classify-handle-label");
  handleLo.append(labelLo);
  track.append(segHi, segMid, segLo, handleHi, handleLo);
  const capLo = el("span", "aw-sd-classify-cap is-lo", "0%");
  const applyBtn = el("button", "aw-sd-classify-apply", icons.check);
  applyBtn.type = "button"; applyBtn.title = "Apply";
  wrap.append(capHi, track, capLo, applyBtn);

  // Left offset of a VALUE (0-100) is `100 - value`, since the track's own
  // axis runs 100%→0% left-to-right (see this function's own header note).
  function paint() {
    segHi.style.width = (100 - hi) + "%";
    segMid.style.width = (hi - lo) + "%";
    segLo.style.width = lo + "%";
    handleHi.style.left = (100 - hi) + "%";
    handleLo.style.left = (100 - lo) + "%";
    labelHi.textContent = Math.round(hi) + "%";
    labelLo.textContent = Math.round(lo) + "%";
    wrap.classList.toggle("is-settled", settled);
    applyBtn.style.display = dirty ? "" : "none";
  }
  paint();

  // ⭐ Đợt 241 — any touch anywhere on the bar wakes it from `settled`; relies
  // on pointerdown BUBBLING from a handle up to `wrap` (nothing below calls
  // stopPropagation), so this fires before that handle's own drag starts.
  // ⭐ Đợt 244 — and remembers that the wake has not been USED yet.
  wrap.addEventListener("pointerdown", () => { if (settled) { settled = false; awoke = true; paint(); } });

  // ⭐⭐⭐ Đợt 244 — press anywhere else and an unused wake goes back to sleep.
  // See this function's header for why capture, and why it removes itself.
  const onOutside = e => {
    if (!wrap.isConnected) { document.removeEventListener("pointerdown", onOutside, true); return; }
    if (!awoke || dirty) return;          // never touched, or genuinely being used — leave it alone
    if (wrap.contains(e.target)) return;  // still on the bar
    awoke = false;
    settled = true;
    paint();
  };
  document.addEventListener("pointerdown", onOutside, true);

  function wireDrag(handle, which) {
    let active = false;
    const move = e => {
      if (!active) return;
      const r = track.getBoundingClientRect();
      const frac = r.width ? Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) : 0;
      let v = Math.round(100 - frac * 100);
      if (which === "hi") v = Math.max(lo + CLASSIFY_MIN_GAP, Math.min(100, v));
      else v = Math.max(0, Math.min(hi - CLASSIFY_MIN_GAP, v));
      const changed = which === "hi" ? v !== hi : v !== lo;
      if (which === "hi") hi = v; else lo = v;
      // Đợt 241 — a REAL move brings Apply back, a mere touch does not.
      // Đợt 244 — and it also cancels the pending "go back to sleep": the teacher
      // is using the bar, so a press somewhere else must not dim it under them.
      if (changed) { dirty = true; awoke = false; }
      paint();
    };
    handle.addEventListener("pointerdown", e => {
      if (e.button !== 0) return;
      e.preventDefault();
      active = true;
      handle.classList.add("is-dragging");
      try { handle.setPointerCapture(e.pointerId); } catch { /* not capturable */ }
    });
    handle.addEventListener("pointermove", move);
    const stop = () => { active = false; handle.classList.remove("is-dragging"); };
    handle.addEventListener("pointerup", stop);
    handle.addEventListener("pointercancel", stop);
  }
  wireDrag(handleHi, "hi");
  wireDrag(handleLo, "lo");

  applyBtn.onclick = () => {
    sfx.tap();
    onApply?.({ hi, lo });
    // Đợt 241 (thầy: "sau khi tích apply... nút Apply sẽ mất") — settle right
    // after firing, so the board already reflects the change by the time the
    // bar fades — no flash of a still-visible Apply button for values just applied.
    settled = true;
    dirty = false;
    awoke = false;              // Đợt 244 — a fresh sleep, not a wake waiting to expire
    paint();
  };

  return wrap;
}

/**
 * A tier's "%" only when the tier is tall enough to read — a 4px sliver with
 * "3%" jammed into it is less legible than no text at all. Cheap enough (no
 * font measuring, just `clientHeight`) to re-run on every resize rather than
 * needing fitPodiumNames' retry ladder.
 * ⚠️ PAINT ONLY — no observer in here. Called both directly (right after a
 * chart is built) and from the ResizeObserver below; an observer that re-armed
 * ITSELF on every one of its own callbacks would tear down and rebuild on
 * every fire for no reason (the `root.__awFitRO` lesson from
 * core/showdown-review.js, one step further).
 */
export function fitChartTierLabels(root) {
  root.querySelectorAll(".aw-sd-rec-tier").forEach(t => {
    t.textContent = t.clientHeight >= 16 ? `${t.dataset.pct}%` : "";
  });
}

/** Set up ONCE per chart, so fullscreen/window resizes keep the labels honest. */
export function watchChartResize(root) {
  try {
    const ro = new ResizeObserver(() => fitChartTierLabels(root));
    ro.observe(root);
    root.__awChartRO = ro;
  } catch { /* no ResizeObserver: a direct call to fitChartTierLabels still stands */ }
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
  // Đợt 217 — tới mốc này thì một bảng RỖNG bay về là tiếng vọng của cú reset do
  // chính màn này vừa thực hiện, không phải người khác reset. Xem toBuild().
  let justWipedUntil = 0;
  // ⭐ Đợt 197 — the `updatedAt` of the table snapshot this panel is working
  // from. `publishTable` compares it against the server's to tell "nobody has
  // touched this since I loaded it" from "another screen edited it while I was
  // dragging chips". Kept in step by boot() and by the live listener.
  let baseAt = 0;
  // ⭐ Đợt 197 — which class the CURRENT table belongs to. `setup.classId` cannot
  // answer that: the class <select> writes straight into it, so the moment the
  // teacher picks a different class the table's own class is gone. This is what
  // lets Next ask "there is a table for 5A — throw it away?" instead of either
  // asking every time or silently overwriting.
  let tableClassId = "";
  let tableClassName = "";
  // ⭐ Đợt 198 — the Recent results sheet, held at panel scope because the
  // CAPTION now toggles it (thầy: "bấm lại 1 lần nữa sẽ trở về trang chọn
  // lớp/team") and the caption is rebuilt by every footer repaint.
  let recentLayer = null;
  // ⭐⭐ Đợt 224 — ANALYSE's own state, at the SAME scope as `recentLayer` so
  // `closeRecent()` (the ✕, and the second tap on the footer caption) can drop
  // it too: leaving Recent results entirely must not leave a half-finished
  // selection waiting for the next time it opens.
  let analysing = false;
  const picked = new Set();          // matchId → picked, temporary, never written down
  // Which class the register on screen A was last DEALT IN for — see renderSetup.
  let rosterPaintedFor = null;
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
    // ⭐⭐ Đợt 230 — MOUNT INSIDE WHATEVER IS ACTUALLY FULLSCREEN RIGHT NOW.
    // Bug thầy reported: "Back to the matches" while the ANALYSE chart is
    // fullscreen looked dead — nothing happened until the browser's own
    // fullscreen was closed by hand. Root cause: this popup always mounted
    // into `body` (the panel's own container), and `body` is an ANCESTOR of
    // whatever element the Fullscreen API promoted (`chart`/`det`) — the
    // Fullscreen spec only paints the promoted element's OWN subtree, so an
    // ancestor's content (this confirm box, included) goes invisible the
    // instant fullscreen starts. The tap was landing on a real, working, but
    // completely unseen "Leave the analysis and go back?" dialog every time.
    // `document.fullscreenElement` is exactly "what is promoted right now, if
    // anything" — mounting there when it exists (and falling back to `body`
    // otherwise, unchanged from before) fixes every caller of this function at
    // once, not just the one thầy happened to hit.
    const mountTo = document.fullscreenElement || body;
    if (mountTo.querySelector(".aw-sd-confirm")) return;    // one at a time
    const layer = el("div", "aw-sd-confirm");
    const box = el("div", "aw-sd-confirmbox");
    const msg = el("div", "aw-sd-confirmtext");
    msg.textContent = text;
    const row = el("div", "aw-sd-confirmrow");
    const close = () => {
      const a = layer.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, easing: "ease-in", fill: "forwards" });
      whenDone(a, () => layer.remove(), 240);
    };
    // ⚠️⚠️ Đợt 191 — BOTH buttons must carry `aw-sd-confirmbtn` (thầy: "nút cancel
    // và reset quá to và không cân đối"). Cancel had its own px size while the OK
    // button carried none, so it fell through to plain `.aw-btn` — which is sized
    // in **cqw**, for use INSIDE the 16:9 stage. Out here in a below-stage popover
    // that renders enormous, and beside a correctly sized Cancel it also renders
    // LOPSIDED. Exactly the trap `.aw-opt-apply` and `.aw-mode-confirm-btn` each
    // already carry a warning about — this is the third place it has bitten.
    row.append(
      btn("Cancel", "aw-sd-ghost aw-sd-confirmbtn", () => { sfx.back(); close(); }),
      btn(okLabel, "aw-btn-primary aw-sd-confirmbtn", () => { close(); onOk(); })
    );
    box.append(msg, row);
    layer.append(box);
    mountTo.append(layer);
    layer.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, easing: "ease-out" });
    box.animate([{ transform: "scale(.94)" }, { transform: "scale(1)" }], { duration: 200, easing: "cubic-bezier(.22,.9,.3,1)" });
  }
  function hintEl(text) {
    const h = el("div", "aw-sd-hint");
    h.textContent = text;
    return h;
  }

  /**
   * ⭐ Đợt 191 (thầy) — the branding line that fills the gap in the middle of the
   * bottom row, on BOTH screens: dead centre between Next and Reset on the class
   * screen, and between the icon row and Ready on the dividing screen.
   *
   * ⚠️ It REPLACES the old hint element, so anything the hint used to say has to
   * come through here or it is simply lost. `warn` is that channel: a real
   * problem ("Pick a class first") outranks the branding, because a caption is
   * decoration and a blocked button needs a reason.
   * ⚠️ `absolutely centred`, not a flex child — the two sides have different
   * widths (an icon row against one button), so centring by flex would put this
   * off-centre by exactly their difference. See `.aw-sd-footcap` in app.css.
   */
  function footCaption(n, warn) {
    if (warn) return hintEl(warn);
    // ⭐⭐⭐ Đợt 197 (thầy) — THIS LINE IS NOW THE DOOR TO **RECENT RESULTS**.
    // "Gán tính năng recently results vào chữ SHOWDOWN IN ANDREW CLASSES… Khi
    // đang chọn 1 lớp, bấm 1 lần vào chữ này sẽ hiện pop-up Recently result của
    // lớp đang được chọn."
    // ⚠️ A <button> only when there IS a class. A caption that is sometimes a
    // control has to LOOK like one exactly when it is one, or the teacher taps it
    // once on the wrong screen, nothing happens, and they never try again.
    const live = !!setup.classId;
    const cap = el(live ? "button" : "div", "aw-sd-footcap" + (live ? " is-btn" : ""));
    if (live) {
      cap.type = "button";
      // ⭐⭐ Đợt 198 (thầy) — ONE WORD, TWO DIRECTIONS: "bấm lại 1 lần nữa sẽ trở
      // về trang chọn lớp/team". So this is a TOGGLE, not an opener; a control
      // that only ever opens leaves the teacher hunting for the way back on a
      // screen whose ✕ is at the far corner of a 86-inch board.
      cap.onclick = () => {
        if (recentLayer) { sfx.back(); closeRecent(); return; }
        sfx.tap();
        openRecent(setup.classId, setup.className);
      };
    }
    cap.append(el("span", "aw-sd-capmain", "SHOWDOWN IN ANDREW CLASSES"));
    // ⭐ Đợt 198 — the count is hidden while Recent results is open ("chỉ hiện
    // showdown in andrew classes"). It is COLLAPSED, not removed: the two spans
    // stay in the tree so the width can animate shut and open again, and so the
    // caption never jumps as the pupil count changes underneath.
    cap.append(el("span", "aw-sd-capdot", "•"));
    cap.append(el("span", "aw-sd-capnum", `${n} STUDENT${n === 1 ? "" : "S"}`));
    capEl = cap;
    paintCapState();
    return cap;
  }

  /**
   * ⭐ Đợt 198 — the caption's two states, in one place because both the footer's
   * own repaint and openRecent/closeRecent have to be able to reach it.
   * `is-on` lights the glow and folds the "• N STUDENTS" half away; the fold is a
   * CSS transition on max-width/opacity (see `.aw-sd-capnum` in app.css), so it
   * reads as the line gathering itself up rather than text vanishing.
   */
  let capEl = null;
  function paintCapState() {
    if (!capEl) return;
    capEl.classList.toggle("is-on", !!recentLayer);
    capEl.title = recentLayer
      ? "Back to the class"
      : `Recent results — ${setup.className || "this class"}`;
  }

  // ---------------------------------------------------------------
  // ⭐⭐⭐ RECENT RESULTS (Đợt 197) — the class's last five matches
  // ---------------------------------------------------------------
  // Five columns, newest on the left, each the WHOLE CLASS of that match drawn
  // as the inverted funnel. Tapping one opens it OVER the other four (thầy: "mở
  // rộng pop-up trùm lên các cột khác… để xem chi tiết nhất và ưu tiên xem").
  //
  // ⚠️ TWO DIFFERENT BOARDS, ON PURPOSE — the one design decision here worth
  // knowing. The real boards (core/showdown-review.js) are sized in `cqw`, i.e.
  // percentages of their container: right inside the 16:9 stage, useless in a
  // 200px column, where that same stylesheet renders a pupil's name at about
  // 5px. So a COLUMN draws a purpose-built miniature in px (`.aw-sd-mini-*`),
  // and the EXPANDED view — which fills the whole panel and is therefore a
  // container of stage-like width — reuses the real renderers unchanged.
  // One board to read, one board to glance at.

  /**
   * ⭐ Đợt 198 — closing lives OUT here because two things now close this screen:
   * its own ✕ and a second tap on the caption. One exit, one animation, one
   * place that puts the caption's glow out.
   */
  function closeRecent() {
    const layer = recentLayer;
    if (!layer) return;
    recentLayer = null;
    analysing = false;
    picked.clear();
    paintCapState();
    const a = layer.animate(
      [{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(.985)" }],
      { duration: 170, easing: "cubic-bezier(.4,0,1,1)", fill: "forwards" });
    whenDone(a, () => layer.remove(), 280);
  }

  function openRecent(classId, className) {
    if (recentLayer) return;                                  // one at a time
    const layer = el("div", "aw-sd-recent");
    recentLayer = layer;
    paintCapState();
    // ⭐ Đợt 224 — the matches on screen right now, read by analyseBtn's onclick
    // below (built before the network read resolves) and by paintCols(). One
    // array both close over, so a delete or a re-load never has two copies
    // disagreeing about what is actually on screen.
    let matches = [];
    const head = el("div", "aw-sd-rec-head");
    const title = el("div", "aw-sd-rec-title");
    title.append(el("span", "aw-sd-rec-word", "RECENT RESULTS"));
    const clsEl = el("span", "aw-sd-rec-class");
    clsEl.textContent = className || "";                       // teacher's own text
    title.append(clsEl);
    const closeBtn = el("button", "aw-sd-rec-close", icons.close);
    closeBtn.type = "button"; closeBtn.title = "Close";
    closeBtn.onclick = () => { sfx.back(); closeRecent(); };
    // ⭐⭐ Đợt 224 — ANALYSE / BEGIN, to the right of ✕ (thầy: "bên cạnh phải nút
    // đóng pop-up"). ONE button, ONE size, throughout: only its word changes —
    // see paintCols() for the rule that decides which word is on it right now.
    const analyseBtn = el("button", "aw-sd-rec-analyse", spark6() + `<span class="aw-sd-rec-analyse-word">ANALYSE</span>`);
    analyseBtn.type = "button";
    analyseBtn.onclick = () => {
      // ⭐ Đợt 224 (thầy chốt qua AskUserQuestion) — the button always DOES what
      // its own word says: showing ANALYSE (fewer than 2 ticked, 0 or 1) means a
      // tap CANCELS the selection, whatever is half-ticked; showing BEGIN (2+)
      // means a tap RUNS the analysis. So the branch is not "toggle vs begin", it
      // is just "read the count, same rule paintCols used to choose the word".
      if (picked.size >= 2) {
        sfx.forward();
        const chosen = matches.filter(m => picked.has(m.matchId));
        openAnalysis(chosen);
        return;
      }
      sfx.tap();
      analysing = !analysing;
      if (!analysing) picked.clear();
      paintCols();
    };
    // ⭐ Đợt 230 (thầy: "Đổi nút X sang bên phải, nút ANALYZE sang bên trái") —
    // ANALYSE now sits right after the title, ✕ at the far right (was the
    // reverse since Đợt 224).
    head.append(title, analyseBtn, closeBtn);
    const cols = el("div", "aw-sd-rec-cols");
    layer.append(head, cols);
    body.append(layer);
    // ⭐ Đợt 198 — comes in from very slightly BEHIND the panel rather than just
    // fading: a plain dissolve between two full screens reads as a flicker, the
    // same reason `goto()` slides instead of cross-fading (see its own note).
    layer.animate(
      [{ opacity: 0, transform: "scale(.985)" }, { opacity: 1, transform: "scale(1)" }],
      { duration: 210, easing: "cubic-bezier(.22,.9,.3,1)" });
    head.animate(
      [{ opacity: 0, transform: "translateY(-6px)" }, { opacity: 1, transform: "translateY(0)" }],
      { duration: 260, easing: "cubic-bezier(.22,.9,.3,1)" });

    cols.append(el("div", "aw-sd-rec-note", "Loading…"));
    import("./showdown-history.js")
      .then(h => h.loadMatches(classId))
      .then(list => { if (layer.isConnected) { matches = list; paintCols(); } })
      .catch(e => {
        if (!layer.isConnected) return;                        // closed while we waited
        cols.innerHTML = "";
        cols.append(el("div", "aw-sd-rec-note",
          e?.code === "aw/signed-out" ? "Sign in to see past results." : "Could not read past results."));
      });

    /**
     * ⭐⭐ Đợt 224 — repaints from the OUTER `matches`, never a parameter, so a
     * delete (which edits `matches` locally) and the ANALYSE toggle (which only
     * changes `analysing`/`picked`) can both just call `paintCols()` with
     * nothing to pass and nothing to get out of step.
     */
    function paintCols() {
      cols.innerHTML = "";
      // ⚠️ Đợt 224 — a delete can bring `matches.length` below 2 WHILE picking is
      // on (the delbtn and the pickbtn are independent controls, nothing stops
      // both being used in the same visit). Without this, ANALYSE hides (next
      // line) but `analysing` stays true and every column keeps drawing its
      // tick — a selection screen with no way to leave it except reloading.
      if (analysing && matches.length < 2) { analysing = false; picked.clear(); }
      analyseBtn.classList.toggle("is-on", analysing);
      // ⚠️ Đợt 224 — under 2 matches there is nothing TO analyse (BEGIN needs a
      // second column to stack against), same reason Reset/Next hide rather than
      // disable elsewhere in this panel: a control with nothing to do should not
      // be sitting there daring the teacher to find out why it does nothing.
      analyseBtn.classList.toggle("is-hidden", matches.length < 2);
      const word = picked.size >= 2 ? "BEGIN" : "ANALYSE";
      const wordEl = analyseBtn.querySelector(".aw-sd-rec-analyse-word");
      if (wordEl) wordEl.textContent = word;
      if (!matches.length) {
        cols.append(el("div", "aw-sd-rec-note", "No results kept for this class yet."));
        return;
      }
      // ⭐⭐ Đợt 207 (thầy, 20/8/2026: "Ô nào cũ nhất thì xếp về bên trái, càng
      // mới càng xếp về bên phải") — the REVERSE of Đợt 197's order.
      // ⚠️ REVERSED HERE, ON SCREEN, AND NOWHERE ELSE. `loadMatches` still hands
      // back newest-first because it also does the `slice(0, MAX_MATCHES)` — and
      // that slice has to keep the ten NEWEST matches, not the ten oldest. Turn
      // the sort round in that file instead and the ledger quietly starts showing
      // last month's games. The tie-break for two matches sharing a millisecond
      // (Đợt 197's own bug, caught by the grid) rides along with it untouched.
      // ⭐ Đợt 224 — still just ONE row of CSS grid cells; `.aw-sd-rec-cols` now
      // wraps at 5 into a SECOND tier by itself (`grid-template-columns:
      // repeat(5,1fr)` + `grid-template-rows:repeat(2,1fr)`, row-major fill),
      // so the oldest-left/newest-right order from Đợt 207 still reads correctly
      // tier by tier — nothing here has to know there are two rows now.
      matches.slice().reverse().forEach(m => {
        const ranked = matchBlocks(m);
        // ⭐⭐ Đợt 224 — a DIV now, not a BUTTON: the delete "–" is a real <button>
        // of its own sitting inside it, and a <button> may not nest inside
        // another <button> (invalid HTML — the outer would simply never receive
        // the inner's clicks in some browsers). `cursor:pointer` + onclick below
        // keep it working exactly like a button for the open-detail tap.
        const col = el("div", "aw-sd-rec-col");
        const ch = el("div", "aw-sd-rec-colhead");
        const act = el("div", "aw-sd-rec-act");
        act.textContent = displayName(m);                       // teacher's own text (or a formatted one)
        const sub = el("div", "aw-sd-rec-sub");
        // How many teams filed a row, so a match one board missed reads AS that
        // rather than as a short class — Đợt 196's lesson, applied to the ledger.
        const teams = Object.keys(m.teams || {}).length;
        sub.textContent = `${when(m.at)} · ${ranked.length} sts · ${teams} team${teams === 1 ? "" : "s"}`;
        ch.append(act, sub);
        col.append(ch, renderMini(ranked));

        // ---- ⭐⭐ Đợt 230 — RENAME THIS MATCH: double-tap the name row ----
        // A literal `dblclick` is what core/press.js's own header (and the
        // Show answers title just above it) warn never fires reliably from a
        // non-primary touch on the TOMKO board's infrared screen — but that
        // problem is specifically about TWO FINGERS racing each other on a
        // game surface. This is a single-teacher management screen (delBtn/
        // pickBtn/col all already use plain `.onclick` above), so a plain
        // two-`click`-within-a-window read off `ch` alone is the right amount
        // of machinery, not core/press.js's raw-pointer recognizer built for
        // a different problem.
        // ⚠️ `stopPropagation` here is what makes hovering/tapping the name row
        // behave differently from the rest of the card (thầy's own request):
        // elsewhere a tap opens the detail (`col.onclick` below); here it never
        // does, because the click never reaches `col` at all.
        const RENAME_TAP_MS = 320;
        let renaming = false;
        let lastNameTapAt = 0;
        ch.title = "Double-tap to rename";
        ch.addEventListener("click", e => {
          e.stopPropagation();
          if (renaming) return;
          const now = Date.now();
          if (now - lastNameTapAt < RENAME_TAP_MS) { lastNameTapAt = 0; startRename(); }
          else { lastNameTapAt = now; }
        });
        function startRename() {
          sfx.tap();
          renaming = true;
          col.classList.add("is-renaming");
          const current = displayName(m);
          ch.innerHTML = "";
          const input = document.createElement("input");
          input.type = "text";
          input.className = "aw-sd-rec-renameinput";
          input.maxLength = 60;
          input.value = current;
          ch.append(input);
          input.focus();
          input.select();
          input.addEventListener("click", ev => ev.stopPropagation());
          input.addEventListener("pointerdown", ev => ev.stopPropagation());
          let settled = false;
          const commit = async () => {
            if (settled) return;
            settled = true;
            const v = input.value.trim();
            renaming = false;
            if (v && v !== current) {
              try {
                const h = await import("./showdown-history.js");
                const ok = await h.renameMatch(classId, m._yyyymm, m.matchId, v);
                if (ok) m.customName = v; else toast("Could not rename this match.");
              } catch (err) {
                console.warn("AWord: could not rename this match", err);
                toast(err?.code === "aw/signed-out" ? "Sign in first." : "Could not rename this match.");
              }
            }
            if (layer.isConnected) paintCols();
          };
          input.addEventListener("keydown", ev => {
            ev.stopPropagation();
            if (ev.key === "Enter") { input.blur(); }
            else if (ev.key === "Escape") { settled = true; renaming = false; if (layer.isConnected) paintCols(); }
          });
          input.addEventListener("blur", commit);
        }

        // ---- the "–" : delete THIS match alone (Đợt 224) ----
        const delBtn = el("button", "aw-sd-rec-delbtn", icons.minus);
        delBtn.type = "button";
        delBtn.title = "Delete this match";
        delBtn.onclick = e => {
          e.stopPropagation();               // never also open the detail behind it
          sfx.tap();
          askConfirm(
            `Delete this match (${act.textContent} · ${when(m.at)})? This cannot be undone.`,
            "Delete", async () => {
              sfx.forward();
              try {
                const h = await import("./showdown-history.js");
                await h.deleteMatch(classId, m._yyyymm, m.matchId);
                matches = matches.filter(x => x.matchId !== m.matchId);
                picked.delete(m.matchId);
                if (layer.isConnected) paintCols();
                toast("Match deleted");
              } catch (err) {
                console.warn("AWord: could not delete this match", err);
                toast(err?.code === "aw/signed-out" ? "Sign in first." : "Could not delete this match.");
              }
            });
        };
        col.append(delBtn);

        // ---- the big round tick : ANALYSE selection (Đợt 224) ----
        // ⚠️ Built EVERY paint, shown/hidden by CSS off `analysing` on the column
        // itself (see `.is-analysing` below) — same reason the podium's own ticks
        // (core/showdown-review.js) stay in the tree rather than being added and
        // removed: a control that pops in and out under the teacher's finger the
        // moment they cross the threshold is worse than one that is merely faint.
        const pickBtn = el("button", "aw-sd-rec-pickbtn");
        pickBtn.type = "button";
        pickBtn.title = "Pick for ANALYSE";
        pickBtn.append(el("i", "aw-sd-rec-pickdot"));
        pickBtn.insertAdjacentHTML("beforeend", icons.check);     // trusted markup
        const paintPick = () => {
          const on = picked.has(m.matchId);
          pickBtn.classList.toggle("is-on", on);
          col.classList.toggle("is-picked", on);
        };
        const togglePick = () => {
          if (picked.has(m.matchId)) picked.delete(m.matchId); else picked.add(m.matchId);
          sound.tick();
          paintPick();
          const w = picked.size >= 2 ? "BEGIN" : "ANALYSE";
          const wordEl = analyseBtn.querySelector(".aw-sd-rec-analyse-word");
          if (wordEl) wordEl.textContent = w;
        };
        pickBtn.onclick = e => { e.stopPropagation(); togglePick(); };
        col.append(pickBtn);
        paintPick();

        col.classList.toggle("is-analysing", analysing);
        col.onclick = () => {
          // ⭐ Đợt 230 — the name row is mid-rename (its own click already never
          // reaches here — see `stopPropagation` above — but a tap elsewhere on
          // the card while the input still has focus should not also fly off
          // to the detail view).
          if (renaming) return;
          // ⭐ Đợt 224 — while picking, ANY tap on the column (not only the round
          // button) toggles it: a class of 20 gives a 200px-wide target either
          // way, and a big invisible tap area beats making the teacher land on
          // an icon the size of a fingertip.
          if (analysing) { togglePick(); return; }
          sfx.forward();
          openDetail(m, ranked);
        };
        cols.append(col);
      });
      // ⭐ Đợt 198 — the columns DEAL IN, left to right, instead of all
      // appearing at once. They arrive after a network read, so a hard cut is
      // the one moment on this screen where the teacher can see the machinery.
      cols.querySelectorAll(".aw-sd-rec-col").forEach((c, i) => {
        c.animate(
          [{ opacity: 0, transform: "translateY(14px) scale(.97)" },
           { opacity: 1, transform: "translateY(0) scale(1)" }],
          { duration: 300, delay: i * 55, easing: "cubic-bezier(.22,.9,.3,1)", fill: "backwards" });
      });
      // ⭐ Đợt 207 — names last, AFTER the columns are in the document: the fit
      // is a measurement, and a column that is not laid out yet measures zero.
      // ⚠️ The entrance animation above is `transform` only, so it does not touch
      // the widths this reads — a scale animation would have to be waited out.
      fitPodiumNames(cols, ".aw-sd-mini-name");
    }

    // ⭐ Đợt 236 — renderMini() moved to module scope (exported, see its own
    // note up there) so the new SHOWDOWN home page can draw the same tiles.

    /**
     * The expanded match. This box uses the REAL renderers.
     *
     * ⭐⭐ Đợt 207 (thầy, 20/8/2026) — it now asks for FULLSCREEN as it opens:
     * "bấm vào 1 cột preview sẽ hiện bảng kết quả cụ thể fullscreen luôn (lấp
     * đầy toàn màn hình) để rộng rãi xem và phân tích. Bấm vào dấu x góc trên
     * bên phải để đóng." Before this it merely covered the five columns inside a
     * pop-up that is itself only part of the frame (Đợt 197: "trùm lên các cột
     * khác") — enough to glance at, too small to teach from.
     *
     * ⚠️ THE REQUEST IS ALLOWED TO FAIL, and nothing depends on it succeeding.
     * A browser can refuse (no user gesture it trusts, a policy, an iframe), and
     * when it does the box simply stays what it has always been: an overlay over
     * the five columns, fully usable. No error, no empty screen.
     *
     * ⚠️ In myActivity's multi-column view fullscreen fills THAT COLUMN only — a
     * WebContentsView cannot take the screen. Thầy was told before this was
     * built; open AWord in its own tab for the 86-inch board.
     *
     * ⚠️ `.aw-sd-rec-dbody`'s `container-type: inline-size` (app.css) is what
     * makes this work at all: the real boards measure themselves in `cqw`, and in
     * fullscreen that container is now the width of the screen instead of the
     * width of a pop-up. Take that line out and this view explodes — see its own
     * warning in the stylesheet.
     */
    function openDetail(m, ranked) {
      if (layer.querySelector(".aw-sd-rec-detail")) return;
      const det = el("div", "aw-sd-rec-detail");
      // ⭐ Đợt 235 (teacher: "thêm dòng ANDREW CLASSES mỏng, mờ... ở bên trên
      // cùng") — a sibling BEFORE the head row, same placement as the live
      // Show answers screen (core/showdown-review.js's own `.aw-rv-brand`).
      const brand = el("div", "aw-sd-rec-brand");
      brand.textContent = "ANDREW CLASSES";
      const dh = el("div", "aw-sd-rec-head");
      const dt = el("div", "aw-sd-rec-title");
      const dact = el("span", "aw-sd-rec-word");
      dact.textContent = displayName(m);
      const dsub = el("span", "aw-sd-rec-class");
      dsub.textContent = `${className || ""} · ${when(m.at)}`;
      dt.append(dact, dsub);
      // A match whose per-question detail was dropped to keep the document under
      // Firestore's limit (fitToBudget) has nothing to put in the list, and an
      // empty list would read as "nobody answered anything". `let`, not `const`
      // — Đợt 235's refresh below may hand back a match whose rows differ.
      let hasRows = ranked.some(b => (b.rows || []).length);
      // ⭐ Đợt 235 — Table / Podium / List, three icon buttons instead of one
      // trophy toggle (teacher: "đồng nhất thao tác" with the live Show
      // answers screen, which dropped its press-and-hold for the very same
      // three buttons — see core/showdown-review.js's own note). Reading
      // screens, not game surfaces, so plain clicks, same as before.
      let view = "table";        // "table" | "podium" | "list"
      const tableBtn = el("button", "aw-sd-rec-close is-toggle", icons.barChart);
      tableBtn.type = "button"; tableBtn.title = "Table";
      const podiumBtn = el("button", "aw-sd-rec-close is-toggle", icons.trophy);
      podiumBtn.type = "button"; podiumBtn.title = "Podium";
      const listBtn = el("button", "aw-sd-rec-close is-toggle", icons.assignment);
      listBtn.type = "button"; listBtn.title = "List";
      // ⭐⭐ Đợt 225 (thầy) — DOWNLOAD, between the view buttons and Back. Opens a
      // small popup (core/showdown-export.js) to pick TABLE/RANKING/DETAILS,
      // name the title, preview it, and export a PNG or a printed A4 PDF.
      const dlBtn = el("button", "aw-sd-rec-close", icons.download);
      dlBtn.type = "button"; dlBtn.title = "Download";
      dlBtn.onclick = () => {
        sfx.tap();
        import("./showdown-export.js").then(mod => mod.openExportDialog({
          mount: det, ranked, className, actName: displayName(m), at: m.at,
          defaultType: view, hasRows, toast
        }));
      };
      const back = el("button", "aw-sd-rec-close", icons.close);
      back.type = "button"; back.title = "Back to the five matches";
      // ⭐ Đợt 198 — shrinks back towards the column it came from instead of
      // blinking out. `whenDone`'s timeout is the usual belt-and-braces: a
      // backgrounded myActivity column freezes rAF, and a detail view stuck at
      // opacity 0 would leave the five columns unreachable behind an invisible
      // sheet that still swallows every tap.
      // ⚠️ Đợt 207 — the fullscreen bookkeeping lives in ONE place, `closeDetail`,
      // and every way out goes through it: the ✕, Esc (which the browser turns
      // into a `fullscreenchange`, not into a click), and the panel closing under
      // it. Two of those three are not clicks, so a teardown written only into
      // `back.onclick` would leave a document-level listener behind — the
      // ghost-clock of Đợt 131 wearing a different hat.
      let closing = false;
      const onFsChange = () => {
        // Left fullscreen by any route other than our own ✕: close the detail,
        // because the teacher's way back to the five columns is the ✕ that has
        // just gone off screen with it.
        if (document.fullscreenElement !== det && !closing) closeDetail();
      };
      function closeDetail() {
        if (closing) return;
        closing = true;
        document.removeEventListener("fullscreenchange", onFsChange);
        if (document.fullscreenElement === det) {
          try { document.exitFullscreen(); } catch { /* the node going will do it */ }
        }
        const a = det.animate(
          [{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(.97)" }],
          { duration: 150, easing: "cubic-bezier(.4,0,1,1)", fill: "forwards" });
        whenDone(a, () => det.remove(), 260);
      }
      back.onclick = () => { sfx.back(); closeDetail(); };
      dh.append(dt, tableBtn, podiumBtn, listBtn, dlBtn, back);
      const dbody = el("div", "aw-sd-rec-dbody");
      det.append(brand, dh, dbody);
      // ⭐ Đợt 207 — this board gets tick boxes too: a match out of the ledger is
      // just as good a list to split a class off as the one that has only just
      // finished, and the marks are the same temporary thing (this Map dies with
      // the detail view, and nothing about it is ever written down).
      const picks = new Map();
      // ⭐ Đợt 235 — true until the fresh-data floor below settles (see
      // `refreshThisMatch`): `paint()` shows a plain loading line while it
      // waits, the same idea as core/showdown-review.js's own spinner, just
      // without a title bar to hang a spinner icon off here.
      let refreshing = true;
      function paintViewBtns() {
        tableBtn.classList.toggle("is-on", view === "table");
        podiumBtn.classList.toggle("is-on", view === "podium");
        listBtn.classList.toggle("is-on", view === "list");
        listBtn.disabled = !hasRows;
        listBtn.title = hasRows ? "List" : "The answers for this match were not kept.";
      }
      const paint = () => {
        dbody.innerHTML = "";
        if (refreshing) {
          dbody.append(el("div", "aw-sd-rec-note", "Loading the latest results…"));
          return;
        }
        if (!hasRows && view === "list") view = "table";   // rows vanished under a stale "List" pick
        if (!hasRows && view !== "podium") {
          dbody.append(el("div", "aw-sd-rec-note",
            "The answers for this match were not kept — here is the ranking."));
          dbody.append(renderReviewPodium(ranked, { showTeam: true, picks }));
        } else if (view === "table") {
          dbody.append(renderReviewTable(ranked, [className, displayName(m)].filter(Boolean).join(" • ")));
        } else if (view === "podium") {
          dbody.append(renderReviewPodium(ranked, { showTeam: true, picks }));
        } else {
          dbody.append(renderReviewList(ranked, { showTeam: true }));
        }
        // AFTER the append — see fitPodiumNames' own note. Harmless on the
        // table/list views, which have no `.aw-sd-pod-name` in them at all.
        fitPodiumNames(dbody);
      };
      const setView = v => { if (view === v || refreshing) return; view = v; sfx.tap(); paintViewBtns(); paint(); };
      tableBtn.onclick = () => setView("table");
      podiumBtn.onclick = () => setView("podium");
      listBtn.onclick = () => setView("list");
      paintViewBtns();
      paint();
      layer.append(det);
      // ⚠️ The request goes out AFTER the node is in the document — an element
      // outside it cannot be made fullscreen — and it is deliberately not
      // awaited: the entrance animation below must run either way.
      document.addEventListener("fullscreenchange", onFsChange);
      Promise.resolve()
        .then(() => det.requestFullscreen?.())
        .then(() => fitPodiumNames(dbody))     // the box just changed width
        .catch(e => console.warn("AWord: fullscreen refused, showing the detail in the panel", e));

      /**
       * ⭐ Đợt 235 (teacher: "load tối thiểu khoảng 3s để cập nhật dữ liệu mới
       * nhất từ các trình duyệt khác cho chắc") — `ranked` up to this point is
       * whatever `paintCols()` computed WHEN RECENT RESULTS WAS OPENED
       * (matchBlocks() called once, no refresh since — see this file's own
       * header note on that). Re-reads this ONE match fresh from Firestore
       * (`loadMatches`, the exact read Recent Results itself uses to fill in
       * the first place) behind a floor of at least 3s, so a row another
       * browser is still writing has time to land before the teacher ever
       * sees a number. A match that vanished from the ledger in the meantime
       * (deleted from another tab) just keeps the data already in hand.
       */
      async function refreshThisMatch() {
        try {
          const h = await import("./showdown-history.js");
          const fresh = await h.loadMatches(classId);
          const found = fresh.find(x => x.matchId === m.matchId);
          if (found) {
            m = found;
            ranked = matchBlocks(found);
            hasRows = ranked.some(b => (b.rows || []).length);
            dact.textContent = displayName(m);
            dsub.textContent = `${className || ""} · ${when(m.at)}`;
          }
        } catch (e) {
          console.warn("AWord: could not refresh this match", e);
        }
      }
      (async () => {
        const floor = new Promise(r => setTimeout(r, 3000));
        await Promise.all([refreshThisMatch(), floor]);
        if (closing) return;              // the teacher already backed out
        refreshing = false;
        paintViewBtns();
        paint();
      })();
      det.animate([{ opacity: 0, transform: "scale(.97)" }, { opacity: 1, transform: "scale(1)" }],
        { duration: 180, easing: "cubic-bezier(.22,.9,.3,1)" });
    }

    /**
     * ⭐⭐⭐ Đợt 224 — ANALYSE → BEGIN: 2+ matches stacked into one bar per pupil,
     * fullscreen (thầy: "để tôi phân tích cho cả lớp"). Same fullscreen dance as
     * `openDetail()` above (request on the node once it is in the document,
     * listen for `fullscreenchange` so Esc or the browser leaving it any other
     * way still closes this cleanly, tear the listener down on every exit) — a
     * proven shape, copied on purpose rather than invented again.
     *
     * ⚠️ THE BACK BUTTON ASKS FIRST — unlike `openDetail`'s ✕. Thầy's own choice
     * (AskUserQuestion): BEGIN is a deliberate act on 2+ matches picked by hand,
     * and losing that setup by one stray tap should cost a confirm, not be free.
     */
    function openAnalysis(chosen) {
      if (layer.querySelector(".aw-sd-rec-chart")) return;
      // Oldest first — the stack reads bottom (oldest) to top (newest); ordering
      // is a DOM decision made HERE, on purpose (see buildAnalysisRows' own
      // header in core/showdown.js for why the pure function does not choose it).
      const entries = chosen.slice().sort((a, b) => (a.at || 0) - (b.at || 0)).map(m => ({
        matchId: m.matchId, label: displayName(m), at: m.at, blocks: matchBlocks(m)
      }));
      const { full, partial } = buildAnalysisRows(entries);

      const chart = el("div", "aw-sd-rec-chart");
      const ch = el("div", "aw-sd-rec-head");
      const ct = el("div", "aw-sd-rec-title");
      ct.append(el("span", "aw-sd-rec-word", "ANALYSIS"));
      if (className) ct.append(el("span", "aw-sd-rec-class", className));
      let closing = false;
      const onFsChange = () => {
        if (document.fullscreenElement !== chart && !closing) closeChart();
      };
      function closeChart() {
        if (closing) return;
        closing = true;
        document.removeEventListener("fullscreenchange", onFsChange);
        if (document.fullscreenElement === chart) {
          try { document.exitFullscreen(); } catch { /* the node going will do it */ }
        }
        const a = chart.animate(
          [{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(.97)" }],
          { duration: 150, easing: "cubic-bezier(.4,0,1,1)", fill: "forwards" });
        whenDone(a, () => chart.remove(), 260);
      }
      // ⭐⭐ Đợt 230 — DOWNLOAD, same spot/idiom as the detail view's own (between
      // the title and the way out). Opens core/showdown-export.js's ANALYSIS
      // popup to name the title and export both boards as ONE PNG.
      const dlBtn = el("button", "aw-sd-rec-close", icons.download);
      dlBtn.type = "button"; dlBtn.title = "Download";
      dlBtn.onclick = () => {
        sfx.tap();
        import("./showdown-export.js").then(mod => mod.openAnalysisExportDialog({
          mount: chart, className, at: Date.now(), full, partial, entries, toast
        }));
      };
      const backBtn = el("button", "aw-sd-rec-close", icons.back);
      backBtn.type = "button"; backBtn.title = "Back to the matches";
      backBtn.onclick = () => {
        sfx.tap();
        // ⭐ Đợt 224 (thầy) — the one exit on this whole screen that ASKS first.
        askConfirm("Leave the analysis and go back?", "Back", () => {
          sfx.back();
          analysing = false;
          picked.clear();
          closeChart();
          if (layer.isConnected) paintCols();
        });
      };
      ch.append(ct, dlBtn, backBtn);

      const cbody = el("div", "aw-sd-rec-cbody");
      chart.append(ch, cbody);
      cbody.append(renderChart(full, partial, entries));

      layer.append(chart);
      // AFTER the append — same rule as fitPodiumNames/openDetail: a detached
      // tree has no width or height to measure, and both refits below measure.
      fitPodiumNames(chart, ".aw-sd-rec-barname");
      fitChartTierLabels(chart);
      watchChartResize(chart);
      document.addEventListener("fullscreenchange", onFsChange);
      Promise.resolve()
        .then(() => chart.requestFullscreen?.())
        .then(() => { fitPodiumNames(chart, ".aw-sd-rec-barname"); fitChartTierLabels(chart); })
        .catch(e => console.warn("AWord: fullscreen refused, showing the analysis in the panel", e));
      chart.animate([{ opacity: 0, transform: "scale(.97)" }, { opacity: 1, transform: "scale(1)" }],
        { duration: 180, easing: "cubic-bezier(.22,.9,.3,1)" });
    }

    // ⭐ Đợt 236 — renderChart()/renderLegend()/fitChartTierLabels()/
    // watchChartResize() moved to module scope (exported, see their own notes
    // up there) so the new SHOWDOWN home page's own ANALYSE screen draws the
    // identical chart instead of a second copy that could drift from this one.
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

  /**
   * ⭐⭐ Đợt 191 — TODAY'S LIST for a class: the trimmed one if this class has
   * one saved, otherwise the full register from Settings › Classes.
   *
   * The saved list is only ever honoured for the class it was saved AGAINST
   * (`rosterClass`). Without that guard, picking class B would inherit class A's
   * absentees — names that were never in B at all — and nothing on screen would
   * explain where they came from.
   */
  function rosterFor(cls) {
    if (!cls) return [];
    if (setup.rosterClass === cls.id && setup.roster?.length) {
      return setup.roster.map(m => ({ id: m.id, name: m.name }));
    }
    return cls.students.map(s => ({ id: s.id, name: s.name }));
  }

  /** Everyone on the register for the class on screen — what Reset restores. */
  function fullRegister() {
    const c = (classes || []).find(x => x.id === setup.classId);
    return c ? c.students.map(s => ({ id: s.id, name: s.name })) : [];
  }

  /**
   * ⭐ Đợt 192 — the equal-width cells of the class list (app.css's
   * `.aw-sd-roster` grid) are narrower than the widest Vietnamese names, and the
   * teacher's standing rule is that A NAME IS NEVER CUT. Same answer the columns
   * screen already gives (shrinkOverflowingNames): swap the long ones for their
   * abbreviated form and keep the full name one hover away — an ellipsis would
   * silently eat the part that tells two pupils apart.
   * ⚠️ `scrollWidth`/`clientWidth`, not `getBoundingClientRect()`: this runs
   * while the popover's own scale-in may still be resolving, and rect reports
   * the partway-scaled visual size (the trap documented on measurePoolH).
   * ⚠️ Only ever SHRINKS, and always re-derives from `dataset.fullName` — every
   * row here was just built fresh by renderSetup, so there is no stale
   * abbreviation to undo.
   */
  function shrinkRosterNames(wrap) {
    wrap.querySelectorAll(".aw-sd-rname").forEach(nm => {
      const full = nm.dataset.fullName;
      if (!full || nm.scrollWidth <= nm.clientWidth + 1) return;
      nm.textContent = shortenName(full);
      nm.classList.add("is-short");
      nm.title = full;
    });
  }

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
      // ⭐ Đợt 191 — …unless TODAY'S LIST for this very class was saved earlier
      // (absentees taken out, then Reset teams pressed). Then that is the list
      // the teacher means, and re-reading the register would hand back exactly
      // the pupils they had just removed. Guarded on `rosterClass`, so it can
      // only ever restore the list belonging to the class being chosen.
      roster = c ? rosterFor(c) : [];
      sfx.add();
      repaint();
    };
    cClass.append(sel);

    const cCount = el("div", "aw-sd-field is-teams");
    cCount.append(el("div", "aw-sd-flab", "Teams"));
    const stepper = makeHStepper(teamCount, MIN_TEAMS, MAX_TEAMS,
      // ⛔ Đợt 166's live `updatePanelWidth(v)` call here is gone (Đợt 171) —
      // it was the resize-while-tapping bug itself; the panel's width is fixed
      // once at boot now and this handler only ever touches `teamCount`.
      v => { teamCount = v; sfx.tap(); paintQuest(); paintFoot(); }, { format: v => String(v) });
    stepper.el.classList.add("is-big");
    cCount.append(stepper.el);

    /**
     * ⭐ Đợt 208 (thầy) — "dựa vào số thành viên và số team thì ô TEAMS cũng sáng
     * lên màu xanh lá… khi số TEAMS chia hết được cho các thành viên. Ví dụ 9 học
     * sinh thì khi bấm thành 3 teams, số teams sẽ sáng xanh lá."
     *
     * ⚠️ ASK THE REAL DEALER, same as the QUESTIONS box does (Đợt 207): "chia hết"
     * is decided by whether `targetSizes()` comes back with every team the SAME
     * SIZE, not by `n % teams === 0`. The two only agree while nothing is capped —
     * a class bigger than MAX_PER_TEAM × teams divides evenly on paper and does
     * not divide evenly on the board.
     * ⛔ FROM 2 TEAMS UP. With one team the whole class is that team, so it is
     * always "even" — a light that is always on says nothing.
     */
    function paintTeamsBest() {
      const n = roster.length;
      let even = false;
      if (setup.classId && n && teamCount >= 2) {
        const sizes = targetSizes(n, teamCount).filter(s => s > 0);
        even = sizes.length === teamCount && Math.min(...sizes) === Math.max(...sizes);
      }
      stepper.el.classList.toggle("is-best", even);
      cCount.title = even
        ? `${n} pupils divide evenly into ${teamCount} teams`
        : "";
    }

    // ⭐⭐ Đợt 197 (thầy) — QUESTIONS: how many questions each pupil will actually
    // get, worked out HERE, while the number of teams is still being chosen —
    // "để biết mỗi người sẽ được bao nhiêu câu khi chọn balance questions".
    const cQuest = el("div", "aw-sd-field is-quest");
    cQuest.append(el("div", "aw-sd-flab", "Questions"));
    const questEl = el("div", "aw-sd-readout is-big");
    questEl.title = "Questions each pupil gets with Balance questions on";
    cQuest.append(questEl);

    row.append(cClass, cCount, cQuest);
    host.append(row);
    paintQuest();

    /**
     * The same arithmetic core/engine.js runs when Balance questions is ON, done
     * a step earlier — before the teams exist — so the teacher can see what a
     * team count will cost before committing to it.
     *
     * ⚠️ THE DIVISOR IS THE BIGGEST TEAM, not the class. Every board plays the
     * same act of Q questions, so a team of 6 can only go round `Q / 6` times,
     * and the whole point of balancing is that the team of 5 goes round exactly
     * as often. The teacher's own worked example (50 questions, 17 pupils, 3
     * teams) comes out at 8 each, which is what he asked for.
     *
     * ⭐⭐ Đợt 207 — TWO fixes, both of them the same idea: ASK THE REAL DEALER.
     *
     * 1. The sizes now come from `targetSizes()` — the function that actually
     *    divides the class (Đợt 198) — instead of `ceil(n / teams)`, which is
     *    only its answer when nothing is capped. A class bigger than
     *    MAX_PER_TEAM × teams (25 pupils over 2 teams) really deals 10 and 10,
     *    not 13, so the old line printed an EACH the class would never see.
     *    ⚠️ ONE TEAM IS THE EXCEPTION: solo mode is the whole class by
     *    definition and MAX_PER_TEAM does not apply to it (see core/showdown.js),
     *    so it is answered here rather than through targetSizes' cap.
     *
     * 2. LEFT IS NOW MEASURED AT THE SMALLEST TEAM (thầy, 20/8/2026: "số câu hỏi
     *    tối đa bị bỏ lại"). It used to be measured at the biggest — i.e. it
     *    answered "how many questions will NOBODY touch?", which is `q mod
     *    biggest` and therefore always a small number. With 18 pupils, 95
     *    questions and 4 teams that read "0 left" while the two teams of four
     *    were each throwing away 19 questions, and the box could not have said
     *    19 even in principle. It now answers the question thầy actually asks of
     *    it: how much does the WORST-OFF board lose?
     *    ⚠️ Empty teams are left out of "smallest": with fewer pupils than teams
     *    `targetSizes` returns some zeroes, and a team with nobody in it is not a
     *    board that loses questions — it is a board that does not exist.
     */
    function teamSizesFor(n, count) {
      // ⚠️ See point 1 above — one team means the whole class, uncapped.
      if (count <= 1) return [Math.max(0, n)];
      return targetSizes(n, count);
    }
    function questionsFor(q, n, count) {
      const sizes = teamSizesFor(n, count).filter(s => s > 0);
      if (!sizes.length) return { each: 0, left: 0 };
      const biggest = Math.max(...sizes);
      const smallest = Math.min(...sizes);
      const each = Math.floor(q / biggest);
      return { each, left: Math.max(0, q - each * smallest) };
    }
    function questionsEach() {
      const q = Math.max(0, Number(ctx.questionCount) || 0);
      const n = roster.length;
      if (!setup.classId || !q || !n) return { each: 0, left: 0, best: false };
      const mine = questionsFor(q, n, teamCount);
      // ⭐⭐ Đợt 207 (thầy) — "trường hợp nào có số câu tối đa bị bỏ lại ít nhất
      // thì ô QUESTION sáng nhẹ màu xanh lá để tôi biết phương án nào đang tối
      // ưu nhất". The box only ever shows ONE team count, so the glow is the only
      // way it can say "and this one is the best of them".
      // ⚠️ FROM 2 TEAMS UP (thầy: "Trừ khi TEAMS là 1 đội"). One team is not one
      // of the options being compared — it is a different mode, and it would
      // usually win this comparison and drown the signal.
      // ⚠️ A TIE LIGHTS BOTH. Two counts really can waste the same amount (18
      // pupils / 95 questions: 2 and 3 teams both waste 5), and telling the
      // teacher only one of them is optimal would be a lie about the other.
      let best = false;
      if (teamCount >= 2) {
        let low = Infinity;
        for (let t = 2; t <= MAX_TEAMS; t++) low = Math.min(low, questionsFor(q, n, t).left);
        best = mine.each > 0 && mine.left === low;
      }
      return { ...mine, best };
    }
    function paintQuest() {
      // ⭐ Đợt 208 — the TEAMS box lights on the same beat as this one. Called from
      // in here rather than added beside every `paintQuest()` call site: the two
      // readouts answer the same question ("is this a good number of teams?") and
      // one of them lighting a beat late would read as a bug.
      // ⚠️ `paintTeamsBest` is a hoisted `function`, declared below — do not turn
      // either of them into a `const` arrow (Đợt 192 lost a session to exactly
      // that: `const` is not hoisted, and `node --check` reports it clean).
      paintTeamsBest();
      const { each, left, best } = questionsEach();
      // ⚠️ `best` joins the change test: without it, stepping between two counts
      // that happen to waste the same amount would light the glow with no
      // animation to draw the eye to it.
      const same = questEl.dataset.each === String(each)
        && questEl.dataset.left === String(left)
        && questEl.dataset.best === String(!!best);
      questEl.dataset.best = String(!!best);
      questEl.classList.toggle("is-best", !!best);
      questEl.title = best
        ? "Questions each pupil gets with Balance questions on — fewest questions wasted at this number of teams"
        : "Questions each pupil gets with Balance questions on";
      questEl.dataset.each = String(each);
      questEl.dataset.left = String(left);
      questEl.innerHTML = "";
      questEl.classList.toggle("is-none", !each);
      const pair = (num, label, cls) => {
        const box = el("span", "aw-sd-ropair" + (cls ? " " + cls : ""));
        box.append(el("span", "aw-sd-ronum", num));
        box.append(el("span", "aw-sd-rosub", label));
        return box;
      };
      questEl.append(pair(each ? String(each) : "—", "each"));
      // The leftover only earns its space when there IS one: a permanent
      // "0 LEFT" beside a perfect split is noise, and this box is 152px wide.
      if (each && left) questEl.append(pair(String(left), "left", "is-left"));
      // ⭐ Đợt 198 — the numbers arrive with a small rise rather than snapping,
      // so a change made on the Teams stepper is visible even while the eye is
      // on the stepper. Skipped when nothing actually changed, or every
      // unrelated repaint (adding a pupil, deleting one) would flicker it.
      if (!same) {
        questEl.querySelectorAll(".aw-sd-ropair").forEach((n, i) => {
          n.animate(
            [{ opacity: 0, transform: "translateY(5px)" }, { opacity: 1, transform: "translateY(0)" }],
            { duration: 220, delay: i * 60, easing: "cubic-bezier(.22,.9,.3,1)", fill: "backwards" });
        });
      }
    }

    const listWrap = el("div", "aw-sd-roster" + (setup.classId ? "" : " is-empty"));
    if (!setup.classId) {
      listWrap.append(el("div", "aw-sd-empty-note", "Choose a class to see its pupils."));
    } else {
      roster.forEach((s, i) => {
        const r = el("div", "aw-sd-rmember");
        const nm = el("span", "aw-sd-rname");
        nm.textContent = s.name;
        nm.dataset.fullName = s.name;     // shrinkRosterNames() re-derives from this, never from the visible text
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
    shrinkRosterNames(listWrap);
    // ⭐ Đợt 198 (thầy: "mọi điều chỉnh, thao tác… đều cần hiệu ứng animation
    // chuyển động mượt") — a NEW CLASS deals its register in rather than
    // replacing one block of names with another in a single frame.
    // ⚠️ Only when the class actually CHANGED. `repaint()` also runs after every
    // pupil added or deleted, and re-dealing twenty-five names each time would
    // turn a small edit into a performance.
    // ⚠️ The stagger is CAPPED, not per-chip: a class of 25 at 26ms each would
    // take two thirds of a second to finish arriving.
    if (rosterPaintedFor !== setup.classId) {
      rosterPaintedFor = setup.classId;
      const rows = [...listWrap.querySelectorAll(".aw-sd-rmember")];
      const step = rows.length ? Math.min(26, 420 / rows.length) : 0;
      rows.forEach((r, i) => {
        r.animate(
          [{ opacity: 0, transform: "translateY(7px) scale(.96)" },
           { opacity: 1, transform: "translateY(0) scale(1)" }],
          { duration: 240, delay: Math.round(i * step), easing: "cubic-bezier(.22,.9,.3,1)", fill: "backwards" });
      });
    }
    paintFoot();

    /**
     * ⭐⭐ Đợt 197 — GO TO THE COLUMNS SCREEN.
     *
     * `fresh` = the teacher confirmed throwing the previous class's table away.
     *
     * ⚠️ THE HARD PART IS **NOT** RE-DEALING. Before this đợt, Next always ran
     * `splitIntoTeams` — which empties every team back into the pool. That was
     * harmless while the only way here was from a standing start, but the new
     * Back arrow means the teacher can step back to look at the class and come
     * forward again, and re-dealing there would destroy the very line-up they
     * stepped back to check ("back về chọn lớp nhưng dữ liệu vẫn còn"). So a
     * table that is already built, for this same class, with this same number of
     * teams, is walked back INTO rather than rebuilt.
     */
    async function toBuild(fresh) {
      if (fresh) {
        // ⭐⭐⭐ Đợt 217 — ĐÁNH DẤU "CHÍNH TA VỪA XOÁ BẢNG" TRƯỚC KHI XOÁ.
        // `wipeSetup()` ghi một bảng RỖNG lên Firestore, và `subscribeSetup` của
        // CHÍNH màn này nghe thấy nó vài trăm mili giây sau — lúc đó ta đã dựng xong
        // bộ cột mới ở dưới. Bộ nghe cũ không phân biệt được "người khác reset" với
        // "tiếng vọng của chính mình", nên nó **đè `setup.teams` về rỗng** rồi bắn
        // ta ngược về màn chọn lớp với hồ bơi trống — đúng cái thầy tả là *"reset rồi
        // vẫn không build team được"*. Nó lúc được lúc không vì phụ thuộc cú snapshot
        // về trước hay sau lúc dựng cột: một cuộc đua, nên chỉ thỉnh thoảng cắn.
        // ⚠️ Cửa sổ có HẠN (8 giây) chứ không phải một cờ bật mãi: nếu để cờ thì một
        // cú reset THẬT từ máy khác ngay sau đó sẽ bị nuốt mất.
        justWipedUntil = Date.now() + 8000;
        // The previous class's table and its published results go together —
        // leaving the results behind would let the new teams (which are handed
        // the same `sdt_1…` ids) open a class board holding another class's rows.
        clearPick();
        claimedTeam = null;
        try {
          await wipeSetup({ keepRoster: roster.map(m => ({ id: m.id, name: m.name })), rosterClass: setup.classId });
        } catch { /* signed out or offline — the local rebuild below is still right */ }
        setup.claims = {};
        setup.teams = [];
        setup.tableId = "";
        baseAt = 0;
      }
      const built = setup.teams.length > 0 && setup.teams.some(t => t.members.length);
      const keepIt = !fresh && built
        && tableClassId === setup.classId
        && setup.teams.length === teamCount;
      if (keepIt) {
        // Whoever is not in a team is still waiting — recomputed rather than
        // remembered, because the roster may have been edited while we were away.
        const placed = new Set(setup.teams.flatMap(t => t.members.map(m => m.id)));
        pool = roster.filter(m => !placed.has(m.id));
        selectedTeam = selectedTeam || setup.teams[0]?.id || null;
      } else {
        // A new division of the class deserves a new `tableId`: it is what the
        // durable history groups a match by, so yesterday's teams and today's
        // must not share one. Kept when merely walking back in (above).
        setup.tableId = localId("tbl");
        setup.teams = splitIntoTeams([], teamCount, fresh ? [] : setup.teams);
        pool = roster.slice();
        selectedTeam = setup.teams[0]?.id || null;
      }
      // ⭐ Đợt 191 — REMEMBER TODAY'S LIST as we leave (teacher: "việc xóa học
      // sinh… cũng được lưu khi bấm next"). Written on to `setup` so the save
      // that follows carries it.
      setup.roster = roster.map(m => ({ id: m.id, name: m.name }));
      setup.rosterClass = setup.classId;
      tableClassId = setup.classId;
      tableClassName = setup.className;
      goto(renderBuild, +1);
    }

    function paintFoot() {
      ft.innerHTML = "";
      // ⭐ Đợt 159 — ONE TEAM IS THE WHOLE CLASS, so there is nothing to divide:
      // the button says READY and starts the mode from this screen (teacher:
      // "nếu chọn 1 team thì không next nữa mà hiện READY luôn"). Everything
      // about the dividing screen — the pool, the columns, the claim — belongs
      // to the 2+ case only.
      const solo = teamCount === 1;
      const canGo = !!setup.classId && roster.length >= teamCount;
      // ⭐ Đợt 191 (thầy) — RESET sits opposite Next, and it is the ONE control
      // that brings deleted pupils back. Everything else in the panel now
      // preserves today's list: Next saves it, "Reset teams" on the dividing
      // screen keeps it. Without a control that says otherwise, a pupil deleted
      // by mistake could never be recovered except by editing the class in
      // Settings.
      const resetBtn = btn("Reset", "aw-sd-ghost aw-sd-footbtn", () => {
        if (!setup.classId) { sfx.remove(); toast("Choose a class first"); return; }
        sfx.tap();
        // ⭐⭐ Đợt 208 (thầy) — "khi ở chế độ hiện RECENT RESULTS, bấm nút RESET
        // lúc này sẽ thành reset dữ liệu kết quả 5 bản ghi gần nhất của lớp đó,
        // chứ không phải reset của màn chọn lớp nữa."
        // The footer stays on screen underneath the Recent results sheet, so this
        // one button reads as belonging to whatever is being LOOKED AT. What it
        // resets therefore has to follow the eye.
        // ⚠️ THIS ONE IS NOT UNDOABLE. The class register can always be brought
        // back from Settings; the ledger is the only copy of five matches that
        // have already been played, so the question says so in as many words.
        // ⚠️ `wipeMatches()` has existed unused since Đợt 197 ("viết nhưng chưa
        // gắn nút — chờ thầy có cần không"). This is the button.
        if (recentLayer) {
          askConfirm(
            `Delete the last matches kept for ${setup.className || "this class"}? This cannot be undone.`,
            "Delete", async () => {
              sfx.forward();
              try {
                const h = await import("./showdown-history.js");
                await h.wipeMatches(setup.classId);
                closeRecent();
                toast("Past results deleted");
              } catch (e) {
                console.warn("AWord: could not delete the past results", e);
                toast(e?.code === "aw/signed-out" ? "Sign in first." : "Could not delete the past results.");
              }
            });
          return;
        }
        askConfirm("Bring every pupil back from the class register?", "Reset", async () => {
          sfx.forward();
          roster = fullRegister();
          setup.roster = [];
          setup.rosterClass = "";
          try { await saveSetup({ ...setup, roster: [], rosterClass: "" }); }
          catch { /* signed out or offline — the screen is still right */ }
          repaint();
        });
      });
      ft.append(
        resetBtn,
        footCaption(roster.length, !setup.classId
          ? "Pick a class first."
          : roster.length < teamCount
            ? `${roster.length} pupil${roster.length === 1 ? "" : "s"} for ${teamCount} teams — add more, or use fewer teams.`
            : ""),
        btn(solo ? "Ready" : "Next", "aw-btn-primary aw-sd-footbtn" + (canGo ? "" : " is-dim"), () => {
          if (!canGo) {
            sfx.remove();
            toast(setup.classId ? "Not enough pupils for that many teams" : "Choose a class first");
            return;
          }
          // ⭐⭐⭐ Đợt 197 (thầy) — THE DESTRUCTIVE QUESTION LIVES HERE NOW.
          // "Chỉ khi chọn 1 lớp khác, bấm next thì mới hỏi là có dữ liệu lớp
          // trước, có muốn xóa không. Ok thì mới sang trang cột build team."
          // Same class → straight through, table untouched (this is also what
          // the new Back arrow relies on: step back, look, step forward again,
          // and nothing has happened).
          // ⭐ Đợt 242 — SOLO NOW ASKS TOO. It writes to the same shared table as
          // 2-5 teams do (applySolo's own note), so an un-checked Ready could
          // just as easily wipe another class's live board as an un-checked Next
          // always could — the clash check can no longer be skipped for it.
          const clash = setup.teams.length > 0 && !!tableClassId && tableClassId !== setup.classId;
          if (solo) {
            if (!clash) { sfx.ready(); applySolo(false); return; }
            sfx.tap();
            askConfirm(
              `${tableClassName || "Another class"} already has a team table and its results. `
              + `Delete it and divide ${setup.className}?`,
              "Delete", () => { sfx.ready(); applySolo(true); });
            return;
          }
          if (!clash) { sfx.forward(); toBuild(false); return; }
          sfx.tap();
          askConfirm(
            `${tableClassName || "Another class"} already has a team table and its results. `
            + `Delete it and divide ${setup.className}?`,
            "Delete", () => { sfx.forward(); toBuild(true); });
        })
      );
    }
  }

  /**
   * ⭐⭐⭐ Đợt 242 (23/8/2026, thầy) — ONE TEAM = THE WHOLE CLASS, NOW A TEAM LIKE
   * ANY OTHER. Thầy: "chọn cả lớp thì vẫn lưu đội và ghi dữ liệu bình thường
   * giống hệt như các số lượng team khác... cũng có mọi cơ chế như cách set
   * team và lưu dữ liệu như bình thường."
   *
   * REVERSES Đợt 159's rule on purpose. Before this đợt, one-team mode never
   * touched Firestore at all (see the SOLO_TEAM_ID note in core/showdown.js for
   * why that id exists) — no `saveSetup`, no claim, no team table, so it was
   * invisible to every other screen/column and never showed up on the live
   * "Recent results" board mid-lesson. That was the bug Đợt 180 had to work
   * around (a stale `sd_solo` row double-counting a class once it was properly
   * split into teams) — the fix here is not a patch on top of that bug, it
   * REMOVES the separate write path that caused it: one team is now team
   * `sdt_1`, dealt with `splitIntoTeams`/`publishTable` exactly like 2-5 teams,
   * just skipping the manual pool→column step because there is only one column
   * to fill (the fill itself is not a judgement call worth a screen).
   *
   * ⚠️ The button still says READY and this still fires from screen A — thầy
   * chose to KEEP the one-tap feel (AskUserQuestion, 23/8/2026), not add the
   * columns screen for a team count where there is nothing to choose.
   *
   * `fresh` mirrors toBuild()'s own flag: true only when the teacher confirmed
   * replacing ANOTHER class's still-standing table (the same clash check the
   * multi-team Next button already runs) — solo used to skip that check
   * entirely because it never touched the shared table; now that it does, an
   * un-checked Ready could silently wipe a different class's live board the
   * same way an un-checked Next always could have.
   */
  async function applySolo(fresh) {
    if (fresh) {
      // Same four lines toBuild(true) runs, and for the same reason: mark this
      // screen as the one that JUST wiped the table before wipeSetup's own echo
      // (subscribeSetup, a few hundred ms later) can mistake itself for a reset
      // from elsewhere and bounce this panel back to screen A. See toBuild()'s
      // own note on justWipedUntil.
      justWipedUntil = Date.now() + 8000;
      clearPick();
      claimedTeam = null;
      try {
        await wipeSetup({ keepRoster: roster.map(m => ({ id: m.id, name: m.name })), rosterClass: setup.classId });
      } catch { /* signed out or offline — the local rebuild below is still right */ }
      setup.claims = {};
      setup.teams = [];
      setup.tableId = "";
      baseAt = 0;
    }
    const team = {
      id: "sdt_1",
      // "Team 1", not the class's own name: a real team's default name never
      // repeats the class, and giving this one the same courtesy is what lets
      // core/showdown-review.js's existing "say the class name once" collapse
      // (paintTitle) go on working with no id-specific case at all.
      name: "Team 1",
      members: roster.map(m => ({ id: m.id, name: m.name }))
    };
    setup.tableId = setup.tableId || localId("tbl");
    setup.teams = [team];
    // ⭐ Đợt 191's own rule, unchanged: the trimmed roster (absentees removed)
    // is remembered on the way out, same as the multi-team Next button does.
    setup.roster = roster.map(m => ({ id: m.id, name: m.name }));
    setup.rosterClass = setup.classId;
    tableClassId = setup.classId;
    tableClassName = setup.className;
    const pick = {
      teamId: team.id, teamName: team.name,
      classId: setup.classId, className: setup.className,
      members: team.members,
      // One team IS the biggest team, so Balance questions is a no-op here —
      // stated rather than left to the fallback so the field always means the
      // same thing wherever a pick comes from.
      maxTeam: Math.max(1, team.members.length),
      tableId: setup.tableId
    };
    // Store the pick FIRST, same reason applyReady() does: the lesson has to
    // start even if the network is having a bad day.
    writePick(pick);
    try {
      const { node, superseded } = await publishTable(setup, { claimTeamId: team.id, baseAt });
      setup.claims = node.claims;
      setup.teams = node.teams;
      setup.tableId = node.tableId;
      baseAt = node.updatedAt;
      if (superseded) toast("Another screen had changed the teams — kept theirs");
    } catch (e) {
      toast(e?.code === "aw/signed-out" ? "Signed out — table not shared" : "Could not share the table");
    }
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

    /**
     * ⭐ Đợt 198 — move the HIGHLIGHTS without rebuilding the columns, so the
     * transition stated on `.aw-sd-col` can run. Used by every state change that
     * does not alter the column's CONTENTS; a claim still goes through
     * `paintCols()`, because that swaps the tick's icon as well as its colour.
     */
    function paintColStates() {
      colsBox.querySelectorAll(".aw-sd-col").forEach(col => {
        const tid = col.dataset.tid;
        const c = setup.claims[tid];
        const taken = claimIsLive(c) && c.by !== me;
        col.classList.toggle("is-sel", tid === selectedTeam && !taken);
        col.classList.toggle("is-claimed", tid === claimedTeam);
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
        // ⚠⚠ Đợt 198 — `paintColStates()`, KHÔNG phải `paintCols()`. Selecting a
        // column is the most-used gesture on this screen, and rebuilding every
        // column to move one highlight meant `.aw-sd-col`'s own stated `transition`
        // COULD NEVER RUN: a brand-new element starts life at its final colours, so
        // there is nothing for it to travel from. Toggling the class on the node
        // that is already there is what turns that transition from a line of CSS
        // nobody had ever seen into something the teacher can actually watch.
        if (!taken) col.onclick = () => { if (selectedTeam !== t.id) { selectedTeam = t.id; sfx.tap(); paintColStates(); } };

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
        // ⭐⭐⭐ Đợt 217 (thầy, 20/8/2026) — ĐỘI CỦA MÁY KHÁC NAY GIÀNH LẠI ĐƯỢC.
        // *"cho phép các máy bất kỳ có thể xóa lưu team của đội khác… vẫn có thể xóa
        // đội đó đi bằng nút X và chọn team đó"*. Trước đợt này ✗ của cột bị người
        // khác giữ là một hình vẽ chết (`disabled`), và đường ra duy nhất là ngồi đợi
        // hết TTL 12 giờ — thứ đã khoá cứng cả một buổi dạy khi một máy bị tắt đi mà
        // chưa kịp nhả đội.
        // ⛔ HAI BƯỚC, KHÔNG PHẢI MỘT: ✗ chỉ **nhả** đội ra (cột trở thành trống),
        // rồi thầy bấm dấu tích như mọi cột trống khác mới **lấy**. Đúng câu thầy
        // viết ("xóa đội đó đi… VÀ chọn team đó"), và quan trọng hơn: một cú chạm
        // nhầm chỉ nhả ra chứ không kéo luôn cả máy này sang một đội khác.
        tick.disabled = false;
        if (taken) {
          tick.title = `Take ${t.name} from the screen that has it`;
          tick.classList.add("is-steal");
        }
        tick.onclick = ev => {
          ev.stopPropagation();                 // not "select the column" as well
          if (taken) {
            sfx.tap();
            askConfirm(
              `Take ${t.name} from the screen that has it? That screen has to choose a team again.`,
              "Take", () => stealTeam(t));
            return;
          }
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
        // ⭐⭐ Đợt 217 (thầy) — *"cần có thêm chữ 'Picked ✓' màu xanh ở giữa cột, nằm
        // bên dưới đáy cột team để dễ dàng nhận dạng"*. Trước đây "đã có người lấy"
        // chỉ được nói bằng ĐỘ MỜ của cả cột — mà mờ cũng là cách nói của "chưa chọn
        // được", nên hai trạng thái khác hẳn nhau trông giống nhau từ xa.
        // ⚠️ Nằm TRONG cột, ghim xuống đáy, chứ không phải lơ lửng dưới mép ngoài:
        // `.aw-sd-cols` cao đúng bằng chỗ còn lại của bảng, nên chữ đặt ở `top:100%`
        // sẽ bị cắt cụt hoặc đè lên hàng nút chân bảng. Vẫn đúng ý "ở đáy cột".
        // ⚠️ Chữ này KHÔNG bị làm mờ theo cột (xem `.aw-sd-col.is-taken` trong
        // core/app.css: độ mờ nay đắp lên tên + danh sách chip, không đắp lên cả cột)
        // — nhãn phải xanh rõ, và dấu ✗ giành đội phải bấm được.
        if (taken) {
          const pick = el("div", "aw-sd-colpicked");
          pick.append(el("span", "aw-sd-colpicked-t", "Picked"));
          pick.insertAdjacentHTML("beforeend", icons.check);   // trusted markup
          col.append(pick);
        }
        colsBox.append(col);
      });
    }

    /**
     * ⭐⭐ Đợt 217 — GIÀNH LẠI MỘT ĐỘI ĐANG BỊ MÁY KHÁC GIỮ.
     *
     * ⭐ KHÔNG CẦN HÀM GHI MỚI: `writeMyClaim(teamId)` vốn đã ghi
     * `next[teamId] = { by: me }` — tức nó ĐÈ lên chủ cũ. Trước đợt này giao diện
     * không bao giờ cho gọi nó trên một đội đã có chủ, nên đường ghi đó chưa từng
     * chạy; nay nó chính là cú giành, không thêm một dòng nào ở tầng dữ liệu.
     * ⚠️ GHI NGAY, không đợi Ready (khác với cú tích một đội trống, vốn chỉ ghi lúc
     * bấm Ready): máy bị giành phải biết NGAY để dừng ván đang chơi — đợi tới Ready
     * là lớp bên kia chơi tiếp một đội không còn là của mình.
     * ⚠️ Xoá ở bản sao TẠI CHỖ trước, đúng lý do `cancelMyTeam` đã ghi: đợi
     * Firestore vọng về là dấu ✗ còn nằm trên một cột thầy vừa giành xong.
     */
    function stealTeam(t) {
      delete setup.claims[t.id];
      claimedTeam = null;               // nhả ra, chưa lấy — thầy bấm dấu tích mới lấy
      selectedTeam = t.id;
      sfx.lift();
      paintCols(); paintFoot();
      releaseTeamClaim(t.id).catch(() => { /* signed out or offline — TTL is the backstop */ });
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
      // ⭐ Đợt 191 (thầy) — READY NO LONGER WAITS FOR AN EMPTY POOL. A pupil left
      // on the class list is now a deliberate choice ("coi như bạn đó bị phạt
      // không được tham gia"), not an unfinished job. The only thing still
      // required is a TICKED team: without one this screen has nothing to play as,
      // and Ready would restart the game into no mode at all.
      // ⚠️ Whoever stays in the pool is simply not in `applyReady`'s members — so
      // they never come up in the turn order and never appear on the result board,
      // which is exactly what "sat this one out" should look like.
      const ready = !!claimedTeam;
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
      // ⭐⭐⭐ Đợt 197 (thầy, 19/8/2026) — THIS ARROW IS NOW **BACK**, NOT RESET.
      // "Khi bấm nút Reset teams sẽ không RESET ngay nữa, đổi thành chức năng
      // back… lúc này back về chọn lớp nhưng dữ liệu vẫn còn."
      //
      // So it destroys NOTHING: no wipeSetup, no confirm, no lost claims, no
      // lost pick. It is a step backwards through the panel, which is what the
      // arrow has looked like since Đợt 191 and never actually did.
      // The destructive question moved to where it belongs — Next, and only when
      // the teacher has actually chosen a DIFFERENT class (see renderSetup).
      // ⚠️ `goto`, not `boot({rebuild:true})`: booting re-reads the table from
      // Firestore and would throw away exactly the unsaved chip-dragging the
      // teacher is stepping back to reconsider.
      mk(icons.back, "Back to the class", () => {
        sfx.back();
        goto(renderSetup, -1);
      });
      // ONE seat, TWO jobs (teacher): deal the class out while anybody is still
      // waiting, call everybody back once nobody is. The two can never both apply,
      // so they share a button rather than one of them sitting dead.
      if (pool.length) {
        // ⭐ Đợt 191 (thầy) — SHUFFLE, not a magic wand: two crossing paths say
        // what actually happens to the names, and it is the symbol every music
        // player has already taught the room.
        mk(icons.shuffle, "Random teams", () => { sfx.forward(); randomDeal(); });
      } else {
        mk(icons.duplicate, "Send everyone back", () => {
          sfx.tap();
          askConfirm("Send every pupil back to the class list?", "Send back", () => { sfx.back(); flyBackAll(); });
        });
      }
      // ⭐ Đợt 191 — the same branding line the class screen carries, in place of
      // the bare word "Showdown" that used to sit here. Counts the pupils PLAYING
      // (the teams plus anyone still waiting), so it reads the same on both
      // screens and does not jump about while chips are dragged.
      const title = footCaption(setup.teams.reduce((n, t) => n + t.members.length, 0) + pool.length);
      ft.append(tools, title,
        // ⚠️ NO "Back" (teacher, Đợt 159): once the class has been divided, the
        // way to the first screen is RESET — because going back silently was a
        // one-tap route to re-dealing a line-up the other screens had already
        // claimed teams from.
        btn("Ready", "aw-sd-ready aw-sd-footbtn aw-btn-primary" + (ready ? "" : " is-dim"), () => {
          if (!ready) {
            sfx.remove();
            toast("Tick the team this screen plays");
            return;
          }
          sfx.ready();
          applyReady();
        })
      );
    }

    /**
     * Everyone still waiting, dealt out evenly and in a random order.
     *
     * ⭐⭐ Đợt 191 (thầy) — BOYS AND GIRLS SPREAD EVENLY, and a little jumble of
     * the names before they fly.
     *
     * The balancing is a plain interleave, not a solver: shuffle the boys, the
     * girls and the unmarked separately, then take from whichever of the three
     * still has the most left. Dealt round-robin into the emptiest team (the
     * existing rule, untouched), that hands each team an alternating run —
     * boy, girl, boy, girl — so 12 boys and 8 girls across 4 teams comes out
     * 3♂2♀ per team instead of one team of boys and one of girls.
     * A class with no genders set has one non-empty list, so this is exactly the
     * old shuffle. That is the point: nothing has to be filled in for it to work.
     */
    async function randomDeal() {
      const cap = capPerTeam();
      // Fisher-Yates on a copy: `pool` itself is rebuilt below, and shuffling in
      // place while reading it is how a "random" deal quietly stops being one.
      const shuffled = list => {
        const a = list.slice();
        for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
      };
      const byId = new Map();
      (classes || []).forEach(c => c.students.forEach(s => { if (s.gender) byId.set(s.id, s.gender); }));
      const genderOf = id => byId.get(id) || "";

      // ⚠️ BOARD ORDER, NOT SORTED. `planDeal`'s first rule is about WHICH COLUMN
      // a spare pupil lands in, so the array handed to it must be the columns as
      // the class sees them, left to right. The old code sorted by size here,
      // which is exactly the behaviour being replaced.
      const fillable = setup.teams.filter(t => !isTaken(t));
      if (!fillable.length) { toast("Every team is taken"); return; }
      const plan = planDeal(fillable, shuffled(pool), genderOf, cap);
      const placed = plan.reduce((n, g) => n + g.length, 0);
      if (!placed) { sfx.remove(); toast("Every team is full"); return; }

      // ⭐⭐ Đợt 198 (thầy) — OUT OF THE POPUP FIRST, THEN BACK IN.
      // "hiệu ứng là các tên bay từ từ ra ngoài pop-up rồi sau đó mới bay vào
      // loạn xạ và từ từ sắp xếp vào các cột."
      await flyOutAndBack(() => {
        const taken = new Set();
        plan.forEach((group, i) => group.forEach(m => { fillable[i].members.push(m); taken.add(m); }));
        pool = pool.filter(m => !taken.has(m));
      });
    }

    /**
     * ⭐⭐⭐ Đợt 198 (thầy) — THE RANDOM DEAL'S TWO-LEGGED FLIGHT.
     *
     * "hiệu ứng là các tên bay từ từ ra ngoài pop-up rồi sau đó mới bay vào loạn
     * xạ và từ từ sắp xếp vào các cột."
     *
     *   LEG 1  every waiting name lifts off and sails OUT past the edge of the
     *          popover, each on its own bearing, tumbling as it goes.
     *   LEG 2  from out there it comes back IN along a bowed path, arriving in a
     *          scattered order, and settles into its column.
     *
     * ⛔ THIS REPLACES `scrambleChips()` + `bulkMove(..., {cascade:true})` for the
     * random deal — the little in-place jostle of Đợt 191 is gone with it, and so
     * is the trap its header warned about (measuring a chip mid-jostle and taking
     * that as its home): here nothing is measured after an animation has started
     * on the thing being measured.
     *
     * ⚠️ ONE GHOST FLIES BOTH LEGS. It is created at the chip's real position and
     * everything after that is a `transform`, so leg 2 simply continues from
     * where leg 1 stopped — no second element, no repositioning, and no seam at
     * the join. That is also why leg 1 uses `fill: "forwards"`: the ghost has to
     * STAY out there while the board is rebuilt underneath it.
     *
     * ⚠️ THE BOARD IS REBUILT WHILE EVERYTHING IS OUT OF SIGHT. `mutate()` and
     * `repaintAll()` run in the gap between the legs, so the columns the names
     * fly back into already exist and can be measured — the FLIP idea `bulkMove`
     * uses, stretched around a round trip.
     *
     * ⚠️ EVERY STAGE HAS A TIMEOUT AS WELL AS AN `onfinish`. A backgrounded
     * myActivity column freezes rAF, so `onfinish` may never come — and the
     * failure mode here is not a missing flourish but a class list left
     * `visibility: hidden` with every name invisible. `whenDone` is what makes
     * the board arrive either way.
     */
    function flyOutAndBack(mutate) {
      const chips = [...host.querySelectorAll(".aw-sd-pool .aw-sd-chip[data-mid]")];
      if (!chips.length) { mutate(); repaintAll(); return Promise.resolve(); }

      const panelBox = (body.closest(".aw-tool-panel") || body).getBoundingClientRect();
      const cx = panelBox.left + panelBox.width / 2;
      const cy = panelBox.top + panelBox.height / 2;
      // Far enough that the name is genuinely OUTSIDE the popover whichever
      // corner it started from — half the diagonal, plus a chip's own length.
      const radius = Math.hypot(panelBox.width, panelBox.height) / 2 + 130;

      const OUT_MS = 560, HANG_MS = 90, IN_MS = 620;
      const outSpread = 200;                       // stagger of the departures
      // The whole return has to be over in about the time a teacher will stand
      // and watch, so the run of arrivals shrinks as the class grows.
      const inSpread = Math.min(900, Math.max(260, chips.length * 55));

      const fs = getComputedStyle(host).getPropertyValue("--sd-chip-fs") || "";
      const flights = chips.map(c => {
        const from = c.getBoundingClientRect();
        const ghost = mkChip(c.textContent);
        ghost.classList.add("aw-sd-ghost-chip");
        // Same reason as `fly()`: the ghost lives on <body>, outside the layer
        // that defines `--sd-chip-fs`, so it would leave at the 15px default.
        ghost.style.fontSize = fs;
        ghost.style.left = from.left + "px";
        ghost.style.top = from.top + "px";
        ghost.style.width = from.width + "px";
        ghost.style.height = from.height + "px";
        document.body.append(ghost);
        // Outward along its OWN bearing from the middle of the panel, jittered,
        // so the names scatter like a handful thrown up rather than a starburst.
        const ang = Math.atan2((from.top + from.height / 2) - cy, (from.left + from.width / 2) - cx)
          + (Math.random() * 0.9 - 0.45);
        const ox = Math.cos(ang) * radius;
        const oy = Math.sin(ang) * radius;
        const spin = (Math.random() * 2 - 1) * 42;
        const delay = Math.round(Math.random() * outSpread);
        ghost.animate([
          { transform: "translate(0,0) rotate(0deg) scale(1)", opacity: 1 },
          { transform: `translate(${ox * 0.35}px, ${oy * 0.35}px) rotate(${spin * 0.3}deg) scale(1.06)`, offset: 0.35, opacity: 1 },
          { transform: `translate(${ox}px, ${oy}px) rotate(${spin}deg) scale(.82)`, opacity: 0.28 }
        ], { duration: OUT_MS, delay, easing: "cubic-bezier(.35,0,.7,1)", fill: "forwards" });
        c.style.visibility = "hidden";
        return { ghost, mid: c.dataset.mid, from, ox, oy, spin };
      });
      sfx.lift();

      return new Promise(resolve => {
        setTimeout(() => {
          // ---- the board changes while nobody can see it ----
          mutate();
          repaintAll();

          const order = shuffledIdx(flights.length);   // "loạn xạ" — arrivals scattered
          const step = inSpread / Math.max(1, flights.length);
          let last = 0;
          order.forEach((fi, slot) => {
            const f = flights[fi];
            const target = host.querySelector(`[data-mid="${CSS.escape(f.mid)}"]`);
            if (!target) {                            // pupil no longer on this screen
              f.ghost.remove();
              return;
            }
            const to = target.getBoundingClientRect();
            target.style.visibility = "hidden";
            const dx = to.left - f.from.left;
            const dy = to.top - f.from.top;
            // Bowed PERPENDICULAR to the travel, exactly like `fly()`'s cascade,
            // so the bend is the same size whichever way the name is heading.
            const len = Math.hypot(dx - f.ox, dy - f.oy) || 1;
            const bow = (Math.random() * 26 + 14) * (Math.random() < 0.5 ? -1 : 1);
            const bx = (-(dy - f.oy) / len) * bow;
            const by = ((dx - f.ox) / len) * bow;
            const delay = Math.round(slot * step * (0.7 + Math.random() * 0.6));
            last = Math.max(last, delay);
            const anim = f.ghost.animate([
              { transform: `translate(${f.ox}px, ${f.oy}px) rotate(${f.spin}deg) scale(.82)`, opacity: 0.28 },
              { transform: `translate(${(f.ox + dx) / 2 + bx}px, ${(f.oy + dy) / 2 + by}px) rotate(${f.spin * 0.35}deg) scale(1.06)`, offset: 0.45, opacity: 1 },
              { transform: `translate(${dx}px, ${dy}px) rotate(0deg) scale(1)`, opacity: 1 }
            ], { duration: IN_MS, delay, easing: "cubic-bezier(.25,.8,.3,1)", fill: "both" });
            whenDone(anim, () => {
              f.ghost.remove();
              target.style.visibility = "";
              sfx.land();
            }, delay + IN_MS + 200);
          });
          // Belt and braces for the whole flock: whatever happened to the
          // individual animations, nothing may stay invisible.
          setTimeout(() => {
            host.querySelectorAll("[data-mid]").forEach(n => { n.style.visibility = ""; });
            document.querySelectorAll(".aw-sd-ghost-chip").forEach(n => n.remove());
            resolve();
          }, last + IN_MS + 320);
        }, OUT_MS + outSpread + HANG_MS);
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
    /**
     * `cascade` (⭐ Đợt 192, thầy: "khi shuffle thì các ô tên bay LẦN LƯỢT vào
     * từng ô tên vào các cột chứ không bay đồng loạt, hiệu ứng loạn xạ một chút
     * để có cảm giác xáo trộn random thực sự").
     *
     * The ordinary move keeps its 16ms stagger — that one is a flock, and it is
     * right for "everybody out" (flyBackAll) and for a single chip. The DEAL is
     * a different event: it is the moment the teams are decided, and it should
     * look like cards being dealt, one name at a time into the columns.
     *
     * Three things make it read as a real shuffle rather than a queue:
     *   - the departure ORDER is randomised, so the chips do not leave in the
     *     tidy top-to-bottom order they happen to sit in. This is the "loạn xạ";
     *     a sequential deal off an ordered list still looks sorted.
     *   - the step between them is jittered, so the rhythm is not a metronome.
     *   - each ghost flies a curved, tilted path (see `fly`'s `wobble`).
     * `sfx.land()` fires PER CHIP here (the ordinary move plays it once): the
     * sound is what carries "one at a time" when the teacher is looking at the
     * class rather than at the screen.
     */
    function bulkMove(mutate, { cascade = false } = {}) {
      const before = new Map();
      // ⭐ Đợt 208 — the CLASSES are recorded alongside the rect, because they are
      // the chip's colour and they are gone the moment `repaintAll()` rebuilds the
      // lists. See `fly()`: the clone must fly wearing what it took off in.
      host.querySelectorAll("[data-mid]").forEach(c =>
        before.set(c.dataset.mid, { rect: c.getBoundingClientRect(), cls: c.className }));
      mutate();
      repaintAll();
      const moved = [];
      host.querySelectorAll("[data-mid]").forEach(c => {
        const was = before.get(c.dataset.mid);
        if (!was) return;
        const from = was.rect;
        const to = c.getBoundingClientRect();
        if (Math.abs(from.left - to.left) < 2 && Math.abs(from.top - to.top) < 2) return;
        moved.push({ c, from, to, cls: was.cls });
      });
      if (!moved.length) return;
      // The whole cascade must still be over in about the time a teacher is
      // willing to stand and watch, so the step shrinks as the class grows:
      // 8 chips step 90ms, 20 chips step 60ms, 30 chips step 40ms — the run of
      // departures never stretches much past ~1.2s however big the class is.
      const step = cascade ? Math.max(40, Math.min(90, Math.round(1200 / moved.length))) : 16;
      const order = cascade ? shuffledIdx(moved.length) : moved.map((_, i) => i);
      order.forEach((mi, slot) => {
        const { c, from, to, cls } = moved[mi];
        c.style.visibility = "hidden";
        // Ordinary move: a small stagger so twenty chips read as a flock, not a
        // jump cut, capped so a big class never turns it into a slow parade.
        const delay = cascade
          ? Math.round(slot * step * (0.65 + Math.random() * 0.7))
          : Math.min(slot * step, 260);
        setTimeout(() => {
          fly(from, to, c.textContent, cascade, cls);
          if (cascade) sfx.land();
          // Reveal exactly when the ghost arrives (fly's own duration), with the
          // usual belt-and-braces timeout — a hidden tab must not leave the board
          // half invisible.
          setTimeout(() => { c.style.visibility = ""; }, cascade ? 340 : 280);
        }, delay);
      });
      if (!cascade) sfx.land();
    }

    /** 0..n-1 in a random order (Fisher-Yates) — the cascade's departure order. */
    function shuffledIdx(n) {
      const a = Array.from({ length: n }, (_, i) => i);
      for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    // ---- the flying chip ----
    // FLIP: measure where the chip is now, rebuild the lists, measure where its
    // replacement landed, then animate a CLONE across the gap. Animating the
    // real node is impossible — it is destroyed by the repaint.
    function fly(fromRect, toRect, label, wobble = false, fromCls = "") {
      if (!fromRect || !toRect) return;
      const ghost = mkChip(label);
      // ⭐ Đợt 208 (thầy: "giữ nguyên màu các ô tên khi bay từ khung học sinh cả
      // lớp sang khung team") — the flying clone now wears the classes the chip
      // had WHERE IT TOOK OFF, so the colour it leaves with is the colour it
      // flies in. Before this it was always a bare `.aw-sd-chip` (white), while a
      // chip sitting in a column wears `.is-in` (a blue tint) — so a name flying
      // OUT of a team went white the instant it left, and one flying in changed
      // colour only on landing.
      // ⚠️ Thầy chose "the colour of where it STARTED" out of three options, so
      // the landing keeps its own colour change. Do not "finish the job" by
      // switching this to the destination — that was option 2 and he passed on it.
      if (fromCls) ghost.className = fromCls;
      // ⚠️ `is-pop` is a one-shot landing animation. Copied onto the ghost it
      // would replay the pop mid-flight, on a node that is already moving.
      ghost.classList.remove("is-pop");
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
      const dx = toRect.left - fromRect.left;
      const dy = toRect.top - fromRect.top;
      // ⭐ Đợt 192 — the cascade's flight is CURVED and TILTED. A straight line
      // is what made twenty simultaneous chips read as a machine; one at a time,
      // along a bowed path with a couple of degrees of tip, reads as thrown.
      // The bow is PERPENDICULAR to the travel (a normalised normal times a
      // random 12-30px), so it bends the same amount whichever way the chip is
      // going — a fixed x/y offset would vanish on a horizontal move and
      // exaggerate a vertical one.
      const len = Math.hypot(dx, dy) || 1;
      const bow = wobble ? (Math.random() * 18 + 12) * (Math.random() < 0.5 ? -1 : 1) : 0;
      const bx = (-dy / len) * bow;
      const by = (dx / len) * bow;
      const tilt = wobble ? (Math.random() * 2 - 1) * 9 : 0;
      const dur = wobble ? 340 : 280;
      const anim = ghost.animate([
        { transform: "translate(0,0) scale(1) rotate(0deg)" },
        { transform: `translate(${dx * 0.5 + bx}px, ${dy * 0.5 + by}px) scale(1.07) rotate(${tilt}deg)`, offset: 0.5 },
        { transform: `translate(${dx}px, ${dy}px) scale(1) rotate(0deg)` }
      ], { duration: dur, easing: "cubic-bezier(.22,.75,.3,1)", fill: "forwards" });
      // A hidden/backgrounded tab never fires `onfinish` (Chromium freezes rAF),
      // and a ghost left on top of the page would swallow every later tap.
      whenDone(anim, () => ghost.remove(), dur + 160);
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
      const fromCls = chipEl.className;      // Đợt 208 — fly in the colour it left in
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
      fly(from, landed?.getBoundingClientRect(), m.name, false, fromCls);
    }

    function backToPool(team, m, chipEl) {
      const from = chipEl.getBoundingClientRect();
      const fromCls = chipEl.className;      // Đợt 208 — fly in the colour it left in
      team.members = team.members.filter(x => x !== m);
      pool.push(m);
      sfx.lift();
      repaintAll();
      const landed = findChip(poolBox, m.id);
      fly(from, landed?.getBoundingClientRect(), m.name, false, fromCls);
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
      members: team.members.map(m => ({ id: m.id, name: m.name })),
      // ⭐⭐ Đợt 197 — THE BIGGEST TEAM IN THE WHOLE TABLE, carried in the pick.
      // Balance questions divides the act by it (core/engine.js's applyBalance),
      // and the ENGINE cannot see the table: it is behind the dynamic-import wall
      // this panel lives on. This screen is the one place that holds every team
      // at once, so it is the one place the number can be read.
      // ⚠️ A SNAPSHOT, like the members beside it. A table edited on another
      // machine after this Ready lands here on the next open of the panel — the
      // same contract every other field of the pick already has.
      maxTeam: Math.max(1, ...setup.teams.map(t => t.members.length || 0)),
      tableId: setup.tableId || ""
    };
    // Store the pick FIRST: it is what the restart reads, and the lesson has to
    // start even if the network is having a bad day.
    writePick(pick);
    try {
      // ⭐ Đợt 197 — was a plain whole-document `saveSetup`, which meant pressing
      // Ready stamped this panel's snapshot over any edit another machine had
      // made in the meantime, silently. `publishTable` decides on the SERVER's
      // copy which teams win and always merges the claims — see its own note.
      const { node, superseded } = await publishTable(setup, { claimTeamId: team.id, baseAt });
      setup.claims = node.claims;
      setup.teams = node.teams;
      setup.tableId = node.tableId;
      baseAt = node.updatedAt;
      if (superseded) toast("Another screen had changed the teams — kept theirs");
    } catch (e) {
      toast(e?.code === "aw/signed-out" ? "Signed out — table not shared" : "Could not share the table");
    }
    stopWatch();
    onApply(pick);
  }

  // ---------------------------------------------------------------
  // BOOT
  // ---------------------------------------------------------------
  async function boot() {
    // Đợt 168 — tear the live-table listener down before starting another.
    // ⚠️ Đợt 197: nothing calls boot() twice any more (Reset teams became Back),
    // so this is belt and braces rather than a live path — kept because the cost
    // is one line and the failure mode it guards is a listener that repaints a
    // detached DOM for the rest of the page's life.
    if (unsub) { unsub(); unsub = null; }
    goto(renderSetup, +1);                  // draws the "Loading…" state at once

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
      baseAt = loaded.updatedAt || 0;
      if (loaded.teams.length) { tableClassId = loaded.classId; tableClassName = loaded.className; }
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
      // ⭐⭐⭐ Đợt 217 — GỘP, KHÔNG THAY (thầy: *"reset rồi vẫn không build team được
      // vì một số bạn bị lưu giữ trong đội khác mà không thể xếp đội mới được"*).
      // ⛔⛔ ĐÂY LÀ GỐC RỄ, và nó nằm ở một dòng trông rất vô hại: `roster = saved`
      // đặt danh sách lớp thành ĐÚNG những người đang nằm trong một cột nào đó. Hệ
      // quả là ai KHÔNG ở cột nào thì **không còn tồn tại trên màn hình đó nữa** —
      // không có trong hồ bơi để kéo vào đội, không có trong cột nào để nhấc ra. Với
      // thầy nó hiện ra đúng như câu thầy tả: mở bảng lên, thiếu người, và không có
      // thao tác nào lôi họ về được.
      // ⚠️ Ba đường sinh ra ca này, không đường nào hiếm: (1) thầy nhấc một bạn khỏi
      // cột rồi đóng bảng; (2) lớp được thêm học sinh sau khi đã chia đội; (3) bảng
      // cũ dựng lúc lớp còn thiếu người.
      // ⚠️ `saved` ĐI TRƯỚC: thứ tự trong cột là thứ tự thầy đã sắp, và nó phải thắng.
      // ⚠️ Danh sách hôm nay chỉ được gộp vào khi nó là danh sách của ĐÚNG lớp này —
      // cùng cái chốt mà `rosterFor()` đã dùng, nếu không thì lớp B thừa hưởng người
      // vắng của lớp A.
      const saved = loaded.teams.flatMap(t => t.members);
      if (saved.length) {
        const seen = new Set();
        const merged = [];
        const push = m => {
          const id = m && m.id;
          if (!id || seen.has(id)) return;
          seen.add(id);
          merged.push({ id, name: m.name });
        };
        saved.forEach(push);
        if (loaded.rosterClass && loaded.rosterClass === loaded.classId) (loaded.roster || []).forEach(push);
        roster = merged;
      }
    }

    // ⭐ Đợt 159 — WHERE THIS PANEL LANDS.
    // Once a table has been built, the COLUMNS are the home screen — for the
    // browser that built it and, just as importantly, for every other one
    // (teacher: "khi các tab khác mở ra sẽ hiển thị luôn các cột đội"). The
    // first screen is reached again only through RESET, which asks first.
    // ⛔ Đợt 197 — the `rebuild` exception is GONE with the button that used it:
    // "Reset teams" is now a plain Back arrow that calls `goto()` directly and
    // never re-boots, precisely so the unsaved line-up survives the trip. One
    // exception is left:
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
    if (built && !solo) {
      // ⭐⭐⭐ Đợt 217 (thầy: *"reset rồi vẫn không build team được vì một số bạn bị
      // lưu giữ trong đội khác"*) — HỒ BƠI ĐƯỢC TÍNH LẠI, KHÔNG ĐƯỢC GIẢ ĐỊNH LÀ RỖNG.
      // ⛔⛔ Dòng cũ là `pool = []` với lời giải thích "ai cũng đã được xếp rồi" — một
      // giả định, và nó SAI ở đúng những ca thầy gặp: bảng cũ dựng khi lớp còn thiếu
      // người · một bạn được thêm vào lớp sau khi chia đội · một bạn bị nhấc khỏi cột
      // rồi panel bị đóng · bảng của lớp KHÁC còn sót lại. Ở mọi ca đó những bạn không
      // nằm trong cột nào **biến mất khỏi màn hình**: không có trong hồ bơi để kéo,
      // không có trong cột nào để nhấc ra ⇒ không cách nào xếp được nữa.
      // ⭐ `toBuild()` (nhánh `keepIt`) đã tính đúng theo cách này từ lâu; chỗ này chỉ
      // là bản sao thứ hai của cùng một câu hỏi mà trả lời khác đi. Nay cùng một phép.
      const placedIds = new Set(setup.teams.flatMap(t => (t.members || []).map(m => m.id)));
      pool = roster.filter(m => !placedIds.has(m.id));
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
      // ⭐⭐ Đợt 217 — TIẾNG VỌNG CỦA CHÍNH CÚ RESET VỪA RỒI: nhận `claims` (đúng là
      // đã sạch) nhưng KHÔNG đụng tới `setup.teams` mà ta vừa dựng lại tại chỗ, và
      // KHÔNG bắn ta về màn chọn lớp. Xem `justWipedUntil` trong toBuild().
      if (!next.teams.length && Date.now() < justWipedUntil) {
        setup.claims = next.claims;
        baseAt = next.updatedAt || baseAt;
        return;
      }
      // ⭐ Đợt 168 — `teams`/`classId`/`className` now sync too, not just
      // `claims`. Reset teams (wipeSetup) empties the WHOLE table from
      // wherever it is pressed; a screen sitting on renderBuild elsewhere
      // needs to find out its own columns are gone, not just that nobody
      // claims them — syncing only `claims` (the old behaviour) left it
      // repainting a columns screen for a team table that no longer existed.
      const hadTeams = setup.teams.length > 0;
      setup.claims = next.claims;
      setup.teams = next.teams;
      setup.tableId = next.tableId;
      baseAt = next.updatedAt || baseAt;
      if (next.teams.length) { tableClassId = next.classId; tableClassName = next.className; }
      else { tableClassId = ""; tableClassName = ""; }
      // ⚠️ Đợt 197 — the class the TEACHER is choosing on screen A is no longer
      // overwritten from the table while they are choosing it. `setup.classId` is
      // now two things at once (the table's class, and the one being picked), and
      // the listener must only ever own the first — see `tableClassId`. On the
      // columns screen there is no picker, so the table's class is the truth.
      if (current !== renderSetup) {
        setup.classId = next.classId;
        setup.className = next.className;
      }
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
