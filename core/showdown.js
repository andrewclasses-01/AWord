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
      //   `maxTeam`  the biggest team's size. ⚠️ Đợt 261 — Balance questions (thứ duy
      //              nhất từng chia act cho con số này) đã gỡ; trường này còn đó nhưng
      //              không còn dòng nào trong app đọc nó.
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
// ⭐⭐⭐ Đợt 220 — THE DEALER: Free / Count chia bài cho từng học sinh
// ---------------------------------------------------------------
// Thầy (21/8/2026): ngoài lối chơi gốc (mỗi câu xuất hiện đúng một lần), Options
// có thêm dải `Normal · Free · Count`. Free = chơi tự do tới khi bấm Submit
// answers (trần SD_FREE_CAP câu mỗi em); Count = mỗi em đúng N câu. Cả hai đều
// hoạt động bằng MỘT cách: NỐI DÀI mảng câu của act trước khi template nhìn thấy
// nó (core/engine.js applySdDeal), vì luật chia lượt
// `memberAt` là `index % số em` nên slot s của mảng đã thuộc sẵn về em s % M —
// không sửa một dòng nào của luật chia lượt.
//
// HAI RÀNG BUỘC (thầy chốt qua AskUserQuestion):
//   🔒 CỨNG — một em KHÔNG BAO GIỜ gặp lại đúng câu chính mình đã làm
//             (chừng nào còn câu khác; Free chơi quá K câu thì buộc phải lặp,
//             khi đó mở vòng mới nhưng vẫn cấm lặp NGAY câu vừa làm).
//   🔓 MỀM — một câu không rơi vào hai em khác nhau chừng nào bộ câu CHƯA dùng
//             hết; hết bộ mới được lặp (deck: mỗi cửa sổ K slot dùng mỗi câu
//             đúng một lần).
//
// ⛔⛔ VÌ SAO KHÔNG PHẢI `shuffle()` RỒI CẦU MAY: có ca shuffle KHÔNG BAO GIỜ
// thoả — 10 câu · 5 em · quay vòng đều thì em nào cũng chỉ gặp đi gặp lại đúng
// 2 câu (gcd(5,10)=5), chính cái bẫy tính năng này sinh ra để tránh. Nên mỗi
// deck là một phép GHÉP CẶP ĐÔI (Kuhn) giữa slot và câu-còn-được-phép, kèm hai
// nấc lùi khi Hall không thoả: (A) chấp nhận vỡ ràng buộc MỀM (câu dùng lần hai
// trong deck) nhưng giữ CỨNG; (B) em đã thấy đủ K câu thì mở vòng mới, gieo lại
// `seen` bằng đúng câu vừa làm để không lặp ngay tức khắc.
//
// ⚠️ THUẦN + XUẤT RA ĐƯỢC, đúng cách planDeal của Đợt 198: `rand` tiêm từ ngoài
// để lưới thử gieo hạt tái lập được. File này engine nhập TĨNH — cấm import.

// Trần của Free: 100 câu mỗi em (thầy chốt). Mảng dài nhất = 100 × 10 em = 1000
// slot — template dựng DOM một lần rồi thay nội dung nên chỉ tốn một mảng state.
export const SD_FREE_CAP = 100;

/**
 * Chia bài: trả về mảng L = perPupil × members CHỈ SỐ CÂU (0..count-1);
 * slot s thuộc về em `s % members` — đúng hợp đồng memberAt.
 */
export function dealQuestions({ count, members, perPupil, rand = Math.random }) {
  const K = Math.max(1, Math.floor(Number(count) || 0));
  const M = Math.max(1, Math.floor(Number(members) || 0));
  const N = Math.max(1, Math.floor(Number(perPupil) || 0));
  const L = N * M;
  const seen = Array.from({ length: M }, () => new Set());
  const lastQ = new Array(M).fill(-1);
  // Số lần mỗi câu đã được phát TOÀN VÁN — hai nấc lùi chọn câu ít dùng nhất
  // theo bảng này, kẻo `order.find(...)` thiên vị hệ thống về câu đứng đầu danh
  // sách (đo được: Free K=5 M=3 lệch tới 8 lần giữa câu nhiều nhất và ít nhất).
  const used = new Array(K).fill(0);
  const out = [];

  const shuffledQs = () => {
    const a = Array.from({ length: K }, (_, i) => i);
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  for (let start = 0; start < L; start += K) {
    const slots = [];
    for (let s = start; s < Math.min(start + K, L); s++) slots.push(s % M);
    // Em đã thấy đủ bộ (chỉ xảy ra ở Free khi N > K): mở vòng mới. Gieo lại
    // bằng câu vừa làm — đó là cách rẻ nhất để "không lặp ngay tức khắc" mà
    // không cần một nhánh riêng nào trong phép ghép. K = 1 thì không gieo được
    // (sẽ rỗng allowed vĩnh viễn) — em đó buộc lặp câu duy nhất, chấp nhận.
    for (const m of new Set(slots)) {
      if (seen[m].size >= K) {
        seen[m].clear();
        if (K > 1 && lastQ[m] >= 0) seen[m].add(lastQ[m]);
      }
    }
    // Xáo rồi SẮP ỔN ĐỊNH theo số lần đã dùng: deck trọn vẹn thì mọi câu dùng
    // đều nhau nên phép sắp là vô hại, còn khi nấc lùi B đã làm lệch (Free, K
    // bé) thì câu ít dùng được thử trước — kéo phân phối về đều (đo được:
    // Free K=3 M=10 lệch 4 → hết lệch). Hoà nhau thì thứ tự xáo giữ nguyên.
    const order = shuffledQs().sort((a, b) => used[a] - used[b]);
    // Kuhn: slot -> câu, mỗi câu tối đa một lần trong deck.
    const qOwner = new Array(K).fill(-1);
    const assign = new Array(slots.length).fill(-1);
    const tryMatch = (si, visited) => {
      const m = slots[si];
      for (const q of order) {
        if (visited[q] || seen[m].has(q)) continue;
        visited[q] = true;
        if (qOwner[q] < 0 || tryMatch(qOwner[q], visited)) {
          qOwner[q] = si;
          assign[si] = q;
          return true;
        }
      }
      return false;
    };
    for (let si = 0; si < slots.length; si++) {
      if (assign[si] < 0) tryMatch(si, new Array(K).fill(false));
    }
    // Nấc lùi cho slot chưa ghép được. `deckMine` = câu các slot CÙNG EM đã nhận
    // trong deck này — ràng buộc cứng phải nhìn cả phần chưa commit.
    const deckMine = Array.from({ length: M }, () => new Set());
    assign.forEach((q, si) => { if (q >= 0) deckMine[slots[si]].add(q); });
    for (let si = 0; si < slots.length; si++) {
      if (assign[si] >= 0) continue;
      const m = slots[si];
      // Ít dùng nhất thắng; hoà thì theo `order` (đã xáo) — không thiên vị.
      const leastUsed = pool => {
        let best;
        for (const x of pool) if (best === undefined || used[x] < used[best]) best = x;
        return best;
      };
      // (A) vỡ MỀM, giữ CỨNG: câu chưa qua tay em này (kể cả phần deck).
      let q = leastUsed(order.filter(x => !seen[m].has(x) && !deckMine[m].has(x)));
      if (q === undefined) {
        // (B) em này hết sạch: mở vòng mới tại chỗ, vẫn tránh lặp tức khắc.
        seen[m].clear();
        q = leastUsed(order.filter(x => !deckMine[m].has(x) && x !== lastQ[m]));
        if (q === undefined) q = leastUsed(order.filter(x => !deckMine[m].has(x)));
        if (q === undefined) q = order[0];   // K = 1: không còn gì để tránh
      }
      assign[si] = q;
      deckMine[m].add(q);
    }
    // Commit theo đúng thứ tự slot — thứ tự chơi thật.
    for (let si = 0; si < slots.length; si++) {
      const m = slots[si];
      out.push(assign[si]);
      seen[m].add(assign[si]);
      lastQ[m] = assign[si];
      used[assign[si]]++;
    }
  }
  return out;
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
/**
 * ⭐ Đợt 224 — lifted out of mergeClassBlocks() so buildAnalysisRows() below can
 * ask "who is this?" the SAME way. Two copies of a dedupe rule is two rules the
 * day after (mergeClassBlocks' own note, one đợt later than it expected to be
 * proven right).
 */
export function blockKey(b) {
  return String(b?.key || "").trim() || String(b?.name || "").trim().toLowerCase();
}

export function mergeClassBlocks(groups) {
  const out = [];
  (groups || []).forEach(g => {
    (g?.blocks || []).forEach(b => out.push({ ...b, teamName: g.teamName || "", _at: g.at }));
  });
  const byPupil = new Map();
  out.forEach(b => {
    const key = blockKey(b);
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

// ---------------------------------------------------------------
// ⭐⭐⭐ Đợt 224 (22/8/2026, thầy) — ANALYSE: STACK SEVERAL MATCHES' % PER PUPIL
// ---------------------------------------------------------------
// Recent results' new ANALYSE → tick 2+ columns → BEGIN turns several matches
// into one stacked bar per pupil (one tier per match, height = that match's %).
// The DOM lives in core/showdown-setup.js (openAnalysis); this is only the
// arithmetic — pure data-in/data-out, same reason as everything else in this
// file, and testable without a browser or a Firestore mock.
//
// ⚠️ STACK ORDER IS THE CALLER'S DECISION, NOT THIS FUNCTION'S. `entries` is
// consumed in the order given — core/showdown-setup.js sorts by match time
// ascending before calling, so the oldest match ends up at the BOTTOM of the
// stack (read the finished bar bottom-to-top like a timeline). Deciding that
// here would make this function secretly know it draws upward, which is a DOM
// fact wearing a rules file's clothes.
//
// WHO COUNTS AS "FULL": thầy's own split (22/8/2026) — a pupil dealt a hand in
// EVERY selected match is `full`; missing from even one match makes them
// `partial`. Both groups sort by their OWN total descending; `partial` is not
// interleaved with `full` at all — it is a second, shorter list appended after
// the first (core/showdown-setup.js draws the seam as a narrow gap, "chỉ một
// chút xíu", between the two — thầy explicitly did not want the size of the gap
// to depend on how much any one pupil is missing).
export function buildAnalysisRows(entries) {
  const list = entries || [];
  // key -> { name, values: Map(matchId -> pct) }
  const byPupil = new Map();
  list.forEach(e => {
    (e?.blocks || []).forEach(b => {
      const key = blockKey(b);
      if (!key) return;
      let s = byPupil.get(key);
      if (!s) { s = { key, name: String(b.name || ""), values: new Map() }; byPupil.set(key, s); }
      // A pupil who was dealt no question in this match (pctOf → null) still
      // COUNTS as present — they were on the team, the board just never asked
      // them anything. A tier of 0% says that; a missing tier would say "did
      // not play this match at all", which is a different, false claim.
      const pct = pctOf(b);
      s.values.set(e.matchId, pct == null ? 0 : pct);
    });
  });
  const rows = [...byPupil.values()].map(s => {
    const full = list.every(e => s.values.has(e.matchId));
    const segments = list.map(e => ({
      matchId: e.matchId,
      pct: s.values.has(e.matchId) ? s.values.get(e.matchId) : null
    }));
    // ⭐⭐ Đợt 230 (thầy chốt qua AskUserQuestion) — `total` is now the AVERAGE %
    // across the matches this pupil was PRESENT for (not their sum), so it stays
    // 0-100 whether 2 or 5 matches are stacked and the y-axis can sit at a fixed
    // 100% instead of stretching per selection. `count` is what the caller (the
    // chart's addBar in core/showdown-setup.js) divides each RAW segment.pct by
    // to make the drawn tier heights sum back to this same average — the number
    // PRINTED inside a tier stays the match's real, un-divided %.
    const present = segments.filter(x => x.pct != null);
    const count = present.length;
    const total = count ? present.reduce((a, x) => a + x.pct, 0) / count : 0;
    return { key: s.key, name: s.name, full, total, count, segments };
  });
  const byTotalDesc = (a, b) => b.total - a.total;
  return {
    full: rows.filter(r => r.full).sort(byTotalDesc),
    partial: rows.filter(r => !r.full).sort(byTotalDesc)
  };
}

// ---------------------------------------------------------------
// Đợt 230 (22/8/2026) — LEDGER DISPLAY NAME: "WORDS" → "ENG1 QUIZ" etc.
// ---------------------------------------------------------------
// A vocabulary act carries ONE library name for all four clue sets (Đợt 145,
// core/content-view.js — "BODY PARTS / WORDS" plays ENG1/ENG2/VI1/VI2 depending
// on `options.contentVariant`), so the ledger row for a Showdown match said only
// "BODY PARTS / WORDS" no matter which set the class actually played, or which
// of the 17 templates the class played it as (Change template can turn any
// vocab act into a Quiz, an Anagram, a Type the answer…).
//
// ⭐⭐ Đợt 242 (23/8/2026, thầy) — ADDS THE TEMPLATE: "BODY PARTS / WORDS" now
// becomes "BODY PARTS / ENG1 QUIZ" — the clue set AND the template that were
// live when the result was saved, both in one word each. REVERSES Đợt 230's own
// choice of writing the clue set out in full ("ENGLISH 1"): with a template name
// now sitting right next to it, the short code already used on the Options
// buttons reads cleaner and keeps the whole row to two short words.
//
// ⚠️ A SMALL, LOCAL MAP ON PURPOSE, not an import of content-view.js's own
// VARIANT_LABEL ("ENG1"/"VI2"): this file stays free of every other module in
// core/ (its header's whole point — pure data-in/data-out, testable with no
// browser). The VALUES are the same short codes now, on purpose — two labels
// answering the same question ("which clue set?") had already drifted once
// (ENGLISH 1 here, ENG1 there) and were never meant to say different things.
const DISPLAY_VARIANT_WORDS = { eng1: "ENG1", eng2: "ENG2", vi1: "VI1", vi2: "VI2" };

// ⚠️ ONLY the literal "WORDS" suffix (nothing after it) is swapped. An act
// whose name ends "WORDS 2" (Đợt 204's second word-table suffix) is a DIFFERENT
// naming meaning — deliberately left untouched rather than guessed at.
const WORDS_SUFFIX_RE = /^(.*\/\s*)WORDS\s*$/i;

/**
 * The name to show for one ledger row. `contentVariant`/`templateType` are
 * whatever core/engine.js recorded at the moment the result was saved (Đợt 230
 * for the first, Đợt 242 for the second) — a match filed before the field it
 * needs existed simply does not get that part of the swap:
 *   • neither field    → the raw `actName`, unchanged (always true before Đợt 230)
 *   • variant only     → "BODY PARTS / ENG1" (a match saved between Đợt 230 and
 *                        242, or a build that never learned the template)
 *   • both fields      → "BODY PARTS / ENG1 QUIZ" (Đợt 242's own shape)
 * Never a HALF template name on its own — "QUIZ" beside no clue set would say
 * nothing about which words were on screen, which is the one thing this whole
 * function exists to preserve.
 */
export function formatActDisplayName(actName, contentVariant, templateType) {
  const name = String(actName || "").trim();
  if (!name) return "";
  const word = DISPLAY_VARIANT_WORDS[String(contentVariant || "").toLowerCase()];
  if (!word) return name;
  const m = WORDS_SUFFIX_RE.exec(name);
  if (!m) return name;
  const tpl = String(templateType || "").trim();
  return `${m[1]}${word}${tpl ? " " + tpl.toUpperCase() : ""}`;
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
// ⭐⭐⭐ Đợt 240 (23/8/2026, thầy) — THE CLASSIFY BAR: 3-zone colour threshold
// ---------------------------------------------------------------
// The new draggable bar on the Table view (both single-match and Analyse) —
// thầy's own axis, chốt qua AskUserQuestion: the bar reads LEFT-TO-RIGHT as
// 100%→0% (best on the left, same "best first" convention every ranked list
// in this app already uses), so `hi` (the left handle, closer to 100%) marks
// where GREEN starts and `lo` (the right handle, closer to 0%) marks where
// RED starts — a pct at or above `hi` is green, below `lo` is red, the middle
// band is blue. ONE tiny pure function, imported by both the DOM chart
// (core/showdown-setup.js) and the canvas exporter (core/showdown-export.js)
// so the two never drift into two different colour reads of the same %,
// the exact bug the ANALYSE_COLORS/ANALYSE_PNG_COLORS duplication risked.
export const CLASSIFY_COLORS = { hi: "#16a34a", mid: "#2563eb", lo: "#dc2626" };
// A reasonable starting split, not thầy's own numbers — roughly the
// green/blue boundary of pctBand() above (85) and its red ceiling (60),
// simplified from 5 bands down to 3. Whatever the teacher drags to sticks via
// Apply; this is only ever the FIRST time a board is opened.
export const DEFAULT_CLASSIFY = { hi: 85, lo: 60 };

/** `classify` is `{hi, lo}` (hi > lo) or null/undefined — no classification
 *  applied yet, so the caller should fall back to its own default colour. */
export function classifyColor(pct, classify) {
  if (!classify) return null;
  const hi = Number(classify.hi), lo = Number(classify.lo);
  if (!Number.isFinite(hi) || !Number.isFinite(lo)) return null;
  if (pct >= hi) return CLASSIFY_COLORS.hi;
  if (pct < lo) return CLASSIFY_COLORS.lo;
  return CLASSIFY_COLORS.mid;
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

// ---------------------------------------------------------------
// ⭐⭐⭐ Đợt 260 (25/8/2026, thầy) — KẾ HOẠCH SỐ CÂU: CÁI GÌ PHẢI KHỚP GIỮA CÁC BẢNG
// ---------------------------------------------------------------
// Thầy báo: *"cùng số người, nhưng bảng 1 có 50 câu, bảng 2 có 100 câu, khi đưa
// vào dữ liệu phân tích thì sai lệch hết vì số câu của các em không công bằng"*.
//
// ⛔⛔ CÁI PHẢI KHỚP LÀ **SỐ CÂU MỖI EM**, KHÔNG PHẢI TỔNG SỐ CÂU CỦA BẢNG.
// Đây là chỗ dễ sai nhất trong cả đợt này, và sai kiểu nào cũng ra một tính năng
// tệ hơn không có: so TỔNG thì ở chế độ Count một đội 5 em (50 slot) và một đội
// 6 em (60 slot) sẽ bị tố là "lệch" trong khi chúng công bằng hoàn hảo — mỗi em
// vẫn đúng 10 câu. Cảnh báo giả trên màn lớp học là thứ thầy sẽ tắt đi sau hai
// buổi, và khi đó cái lệch THẬT cũng đi theo.
//
// BA CHẾ ĐỘ, VÀ CHỈ HAI CÁI TỰ HỨA ĐƯỢC ĐIỀU GÌ (đo từ dealQuestions —
// `tổng slot = perPupil × số em`):
//   count    mỗi em đúng N câu. N là con số thầy gõ ⇒ giống nhau ở mọi bảng
//            MÀ KHÔNG CẦN BẢNG NÀO THOẢ THUẬN VỚI BẢNG NÀO. Chế độ an toàn nhất
//            cho bất cứ thứ gì đổ vào bảng phân tích.
//   free     trần SD_FREE_CAP câu mỗi em ⇒ khớp, nhưng thầy bấm Submit lúc nào
//            thì dừng lúc đó, nên con số cuối vẫn do tay người quyết.
//   normal   mỗi em = tổng ÷ số em ĐỘI MÌNH ⇒ đội nhỏ được nhiều câu hơn đội to,
//            KHÔNG hứa gì cả. Không có gì để so, và cũng không nên báo động: đây
//            là lựa chọn hợp lệ của thầy, chỉ là nó không dành cho phân tích.
// ⛔ Đợt 261 — CHẾ ĐỘ THỨ TƯ `balance` ĐÃ BỊ GỠ KHỎI APP (thầy chốt). Nó chia
//   `floor(tổng ÷ đội đông nhất)`, tức là phải khớp `maxTeam` giữa mọi bảng — mà
//   `maxTeam` là ảnh chụp đông cứng trong pick của từng cột, và đúng chỗ đó vỡ ở
//   Đợt 260. `Count` làm được đúng việc đó mà không cần bảng nào đồng ý với bảng nào.
//
// ⚠️ FILE NÀY THUẦN — engine nhập TĨNH nên trang học sinh cũng tải nó (luật 2 của
// v0.9.0). Không import, không DOM, không Firestore: vào dữ liệu, ra dữ liệu.

/**
 * Năm tuỳ chọn CHỈ tồn tại trong Showdown.
 *
 * ⛔⛔ VÌ SAO DANH SÁCH NÀY PHẢI CÓ MẶT: chúng là key options bình thường, tức là
 * **per-view** (core/content-view.js — chúng không nằm trong VIEW_SELECTOR_KEYS
 * hay VIEW_ACT_KEYS). Mà `Settings ▸ Default activity options` **không bao giờ**
 * dựng chúng: core/options-panel.js chỉ dựng khi caller truyền `showdown: true`,
 * và Settings cố ý không truyền. Nên một view chưa từng ghé (ENG1 → VI1 lần đầu)
 * được gieo từ Settings defaults là gieo ra một bộ **KHÔNG CÓ** năm key này —
 * Balance/Count biến mất, và vì `__awordBridge.applyOptions` là THAY THẾ chứ
 * không trộn, mọi cột myActivity khác mất theo trong im lặng.
 * ⇒ core/engine.js's onViewChange() mang chúng sang khi view mới chưa có.
 */
export const SD_PLAN_KEYS = [
  "sdDeal", "sdDealCount", "roundTimer", "roundSeconds"
];

/**
 * Bốn chế độ hợp lệ, và KHÔNG có cái thứ năm.
 * ⚠️ Là DANH SÁCH TRẮNG, không phải tài liệu: core/showdown-setup.js lọc `md` đọc
 * từ Firestore qua đây. Bàn thử Đợt 260 bắt được ca `md: 7` (một số) đi lọt thành
 * chuỗi "7" — vô hại về mặt sập, nhưng nó sẽ không khớp chế độ nào nên mọi bảng
 * đứng cạnh nó bị tố "khác chế độ" vì một giá trị chẳng có nghĩa gì.
 * ⛔ Đợt 261 — `balance` ĐÃ BỊ GỠ KHỎI APP. Một act cũ còn lưu `balanceQuestions`
 * thì key đó nay là rác vô hại (không ai đọc); còn `md: "balance"` từ một bảng
 * chạy bản AWord CŨ hơn Đợt 261 sẽ rơi ra khỏi danh sách trắng này ⇒ bảng đó bị
 * coi là "chưa khai", tức KHÔNG đoán hộ — đúng thứ ta muốn khi hai bên khác bản.
 */
export const SD_MODES = ["normal", "free", "count"];

/** Chế độ nào TỰ HỨA "mọi em bằng nhau" — `normal` không nằm trong đó. */
export function sdPlanPromises(mode) {
  return mode === "count" || mode === "free";
}

/**
 * Bảng nào đó đang chơi khác mình? Đọc thẳng `claims` của bảng đội chung — nơi
 * mỗi bảng đã tự khai kế hoạch của nó (core/showdown-setup.js publishMyPlan).
 *
 * @param setup     bản chuẩn hoá của bảng đội (subscribeSetup trả về)
 * @param myTeamId  đội của bảng này
 * @param mine      { md, n } — chế độ + số câu mỗi em của bảng này
 * @returns {{teamName, md, n, why}|null}  `why`: "mode" (khác chế độ) | "each" (khác số câu/em)
 *
 * ⚠️ CHẾ ĐỘ ĐƯỢC SO TRƯỚC, VÀ SO CHO CẢ `normal`. Hai bảng cùng `normal` thì im
 * lặng (thầy chọn thế, không có gì hứa để mà vỡ), nhưng một bảng `count` đứng
 * cạnh một bảng `normal` là lệch THẬT và phải nói ra — đó chính là ca "một cột
 * nhận OPT hụt" mà dấu ✗ 2,6 giây rất dễ trôi qua mắt.
 * ⚠️ Bảng nào CHƯA khai (`md` rỗng) thì bỏ qua, không đoán: nó có thể đang tải,
 * có thể là bản AWord cũ hơn đợt này. Im lặng ở đây là đúng — cảnh báo dựa trên
 * "chưa biết" là cảnh báo giả.
 */
export function findPlanClash(setup, myTeamId, mine) {
  if (!setup || !mine || !mine.md) return null;
  const teams = Array.isArray(setup.teams) ? setup.teams : [];
  const claims = (setup.claims && typeof setup.claims === "object") ? setup.claims : {};
  for (const [teamId, c] of Object.entries(claims)) {
    if (!c || teamId === myTeamId) continue;
    const md = String(c.md || "");
    if (!md) continue;                                   // chưa khai — không đoán hộ
    const n = Number(c.n) || 0;
    const nameOf = () => (teams.find(t => t.id === teamId) || {}).name || "Another team";
    if (md !== mine.md) return { teamName: nameOf(), md, n, why: "mode" };
    if (sdPlanPromises(md) && n > 0 && mine.n > 0 && n !== mine.n) {
      return { teamName: nameOf(), md, n, why: "each" };
    }
  }
  return null;
}

// ---------------------------------------------------------------
// ⭐⭐⭐ Đợt 261 (25/8/2026, thầy) — PHÒNG CHỜ: CẢ LỚP CÙNG BẮT ĐẦU MỘT LƯỢT
// ---------------------------------------------------------------
// Thầy: *"khi tất cả đã sẵn sàng, đội bấm nút start trước sẽ ko vào game ngay mà sẽ ở
// trạng thái READY… khi nhóm cuối cùng trong tất cả các nhóm bấm start thì mới bắt đầu…
// Nếu 1 đội lệch templates, lệch options so với các đội còn lại và so với dữ liệu chuẩn
// thì chưa bắt đầu được ngay mà hiện LOADING DATA…"*
//
// ⚠️ ĐI QUA FIRESTORE, KHÔNG QUA myActivity (thầy chốt): *"ưu tiên firebase để nhiều
// thiết bị khác nhau cùng tham gia được, không chỉ các bảng trên myActivity"*. Cầu
// `window.__awordBridge` chỉ nối được các CỘT trong một cửa sổ myActivity; Firestore nối
// được mọi máy trong lớp, kể cả máy tính bảng của học sinh.
//
// ⚠️ FILE NÀY THUẦN — engine nhập TĨNH nên trang học sinh cũng tải nó (luật 2 của
// v0.9.0). Mọi thứ chạm Firestore nằm ở core/showdown-setup.js.

/**
 * CHỮ KÝ CỦA DỮ LIỆU CHUẨN — hai bàn khớp nhau khi hai chuỗi này bằng nhau.
 *
 * ⛔⛔ PHẢI ỔN ĐỊNH THEO THỨ TỰ KHOÁ. `JSON.stringify` giữ nguyên thứ tự chèn, mà thứ tự
 * chèn của `activity.options` phụ thuộc vào đường nào đã ghi vào nó (Apply · bridge ·
 * migrate · bản lưu trong thư viện). Hai bàn có ĐÚNG cùng giá trị vẫn ra hai chuỗi khác
 * nhau ⇒ vòng "LOADING DATA…" quay mãi không bao giờ khớp. Sắp khoá là thứ duy nhất
 * chặn được, và nó phải nằm ở ĐÂY chứ không ở chỗ gọi — hai chỗ gọi tự sắp là hai cách
 * sắp.
 * ⚠️ Bỏ `undefined`/`null`: "không có khoá" và "khoá bằng null" là CÙNG một trạng thái
 * chơi, nhưng khác nhau khi so chuỗi. Đây đúng là ca sinh ra vòng lặp không hồi kết.
 */
export function stdSignature(type, options) {
  const o = options || {};
  const parts = Object.keys(o)
    .filter(k => o[k] !== undefined && o[k] !== null)
    .sort()
    .map(k => k + "=" + JSON.stringify(o[k]));
  return String(type || "") + "|" + parts.join("&");
}

/**
 * ⏳ MỘT LƯỢT SỐNG ĐƯỢC BAO LÂU. Đủ dài để trùm một buổi dạy (một lượt có thể ngồi chờ
 * trong lúc thầy giảng), đủ ngắn để lượt hôm qua không bao giờ đứng chắn buổi sáng nay.
 * ⚠️ Ở ĐÂY chứ không ở core/showdown-setup.js (nơi nó ra đời, Đợt 261): từ Đợt 263 CẢ
 * MÀN READY cũng phải trả lời "lượt này còn sống không" để vẽ hàng ô tích, mà màn READY
 * chạy trong engine — file thuần. Hai bản sao của một con số là hai con số.
 */
export const ROUND_TTL_MS = 3 * 60 * 60 * 1000;

/**
 * ⭐⭐⭐ Đợt 263 (thầy, 25/8/2026) — ĐỘI NÀO ĐÃ SẴN SÀNG, ĐỌC TỪ TÀI LIỆU LƯỢT.
 * Thầy: *"mỗi đội bấm start thì đều có dữ liệu đã READY gửi sang các bảng team khác…
 * hàng ô tròn xanh lá để tích khi đội đó sẵn sàng rồi"*.
 *
 * Trả về `Set` các teamId đang báo sẵn sàng trong lượt NÀY.
 *
 * ⛔⛔ BA CỬA LỌC, VÀ CẢ BA ĐỀU BẮT BUỘC — thiếu một cái là hàng ô tích **nói dối**:
 *   • khác `actId`  ⇒ đó là lượt của một BÀI KHÁC (thầy vừa đổi act, tài liệu lượt cũ
 *     vẫn nằm nguyên đó vì lượt cũ không bao giờ bị xoá — xem sd_round);
 *   • khác `tableId` ⇒ bảng đội khác;
 *   • quá hạn TTL   ⇒ lượt của buổi trước.
 * Một ô tích xanh SAI còn tệ hơn không có ô nào: thầy sẽ đứng đợi một đội đã sẵn sàng
 * từ hôm qua.
 * ⚠️ ĐẾM THEO ĐỘI, KHÔNG THEO BÀN — cùng lý do đã viết ở roundMissingTeams(): một đội
 * mở trên hai máy vẫn là MỘT đội.
 */
export function roundReadyTeamIds(node, { actId = "", tableId = "", now = Date.now() } = {}) {
  const out = new Set();
  if (!node || !node.roundId) return out;
  if (String(node.actId || "") !== String(actId || "")) return out;
  if (String(node.tableId || "") !== String(tableId || "")) return out;
  if (now - (Number(node.at) || 0) >= ROUND_TTL_MS) return out;
  Object.values(node.boards || {}).forEach(b => {
    if (b && b.ready && b.teamId) out.add(String(b.teamId));
  });
  return out;
}

/**
 * Đội nào CÒN THIẾU — có gạch sống trong bảng đội nhưng chưa có bàn nào báo sẵn sàng.
 *
 * @param liveTeamIds  id các đội đang được giữ gạch (chỗ gọi tự lọc theo TTL)
 * @param boards       `boards` của tài liệu lượt: { [browserId]: { teamId, ready } }
 *
 * ⚠️ ĐẾM THEO ĐỘI, KHÔNG THEO BÀN. Một đội có thể được mở trên hai máy (thầy mở lại tab);
 * đội đó vẫn là MỘT đội và chỉ cần một bàn báo sẵn sàng. Đếm theo bàn thì con số "3/4"
 * hiện ra sẽ nhảy lung tung mà không ai hiểu vì sao.
 */
export function roundMissingTeams(liveTeamIds, boards) {
  const ready = new Set();
  Object.values(boards || {}).forEach(b => {
    if (b && b.ready && b.teamId) ready.add(String(b.teamId));
  });
  return (liveTeamIds || []).filter(t => !ready.has(String(t)));
}
