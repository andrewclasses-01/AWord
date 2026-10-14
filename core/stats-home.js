// =============================================================
// ⭐⭐⭐ Đợt 374 (23/9/2026, thầy) — STATS: class score statistics, kept for good.
// =============================================================
// A full page (opened from the chart icon on the home top bar, main.js
// openStatsHome) that replaces thầy's hand-kept Excel sheets (e.g. B1A.xlsx:
// one row per pupil, one column per test, the cell = number of MISTAKES, plus
// a CHART sheet). Approved mockup: D:\OTHERS\CLAUDE\AWord - thiet ke Stats\
// stats-v3.html. What thầy chose (23/9/2026, AskUserQuestion, in order):
//
//   • Two sources in one table: AWord assignments (cell = the SCORE of the
//     pupil's BEST submitted attempt) + hand-marked paper tests (cell = the
//     number of MISTAKES thầy taps in). Both are coloured by % so they compare.
//   • AWord scores count only from 22/9/2026 — the first day scores carry the
//     myStudent code `ma` (Đợt 367); older plays have no reliable pupil key.
//   • ONE COLUMN PER TEST, columns grouped under their DAY. A day may hold
//     AWord tests and hand tests side by side.
//   • The main view is the last 30 days only; everything older lives in a tree
//     Year → Month → Day on the left.
//   • Rows = the class roster from myStudent, BY CODE (so a rename or a class
//     move never loses a score). Read from `lessonWeb/lop` — the public copy
//     myLesson already publishes (same content as andrewclasses.com/data/lop.json).
//     ⛔ NEVER read `mystudentRosterStudents` (thầy forbids opening its rule).
//   • Hand entry by tapping: tap +1 · swipe up +5 · swipe down −5, plus
//     temporary people ("Thêm người") who only count in the tests they are in.
//   • 📊 per test (evaluation popup) and ANALYSE over several days — the SAME
//     stacked chart + PNG download as Showdown's Analyse (reused, not copied).
//
// ⭐⭐ Đợt 520 (14/10/2026, thầy "ok build" — mockups stats-v5.html (entry) +
// stats-v7.html (page), same folder):
//   • PAGE: no AWord logo / footer. A left rail in the Quick-access "B" look
//     (light, frameless, hairline) carries a HOME button with an "A" in it +
//     XEM NHANH / LƯU TRỮ; ONE top row holds class · Số gốc/% · Excel ·
//     ANALYSE · Chấm tay + the app's own right-hand buttons (main.js hands
//     them over as opts.rightCluster). Four summary tiles, then the table:
//     avatar + sparkline + average per pupil, compact column heads with a
//     class-average bar, sortable A→Z / by average. Clicking a pupil slides a
//     300px detail panel in on the right (replaces the old progress popup).
//   • HAND ENTRY: no more tap/swipe — a FIXED HORIZONTAL NUMPAD (+ the
//     keyboard). Cells start EMPTY; a value that cannot take another digit
//     moves on by itself. Saving with an empty cell is REFUSED (thầy).
//     Title comes from the class's lesson cards on the dashboard
//     (lessonWeb/bai_<CLASS>): "<lesson code> / <type>", a LISTENING lesson
//     (code LS…) marked by hand is a dictation ⇒ "/ DICTS". Editable.
//     TOTAL is never pre-filled; left empty (total 0) the test keeps only the
//     mistake counts — no %, no colour, footer "TB x lỗi".
//
// STORAGE — one doc per class per month, teacher-only:
//   users/{uid}/items/st_<CLASS>_<YYYYMM>   kind "stats-month" (store.js
//   APP_DATA_KINDS lists it so it never eats a ?a= link number)
//     { kind, root:"stats", parentId:null, trashed:false, classId, ym,
//       tests: { <id>: TEST }, guests: { <gid>: {name, note} }, updatedAt }
//   TEST = { id, kind:"aw"|"hand", date:"YYYY-MM-DD", title, sub, total,
//            values: { <pupilKey>: {k:"n",v} | {k:"abs"} | {k:"none"} }, ... }
//   pupilKey = "m:<CODE>" for a roster pupil, "g:<gid>" for a temporary one.
//
// ⭐ The AWord columns are a SNAPSHOT ("chốt sổ"): every time the page opens,
// assignments whose `submitCount` moved are re-read and their best scores are
// copied into the month doc. Deleting an assignment forever (which wipes its
// scores) therefore never empties a column that was already counted.
// Nothing here changes what pupils write — no Firestore rule change needed.
// =============================================================

import { icons } from "./icons.js";
import { db, fs, currentUser } from "./firebase.js";
import { listAllAssignments, listScores, MAX_SCORES_THAY, classTokenOf, readResultReview } from "./assignments.js";
import { templateLabel } from "./catalog.js";
import { buildAnalysisRows, DEFAULT_CLASSIFY } from "./showdown.js";
import {
  renderChart, fitChartTierLabels, watchChartResize, applyClassifyToChart, buildClassifyBar, whenDone
} from "./showdown-setup.js";
import { fitPodiumNames } from "./showdown-review.js";

const KIND = "stats-month";
const AW_FROM = new Date(2026, 8, 22).getTime();     // 22/9/2026 00:00 local — thầy's cut-off
const RECENT_DAYS = 30;
const MAX_ANALYSE_DAYS = 10;
const WD = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const BANDS = [
  ["Giỏi", "≥ 85%", "var(--st-b-great)", "var(--st-h-great)"],
  ["Khá", "70–84%", "var(--st-b-good)", "var(--st-h-good)"],
  ["Trung bình", "50–69%", "var(--st-b-mid)", "var(--st-h-mid)"],
  ["Yếu", "< 50%", "var(--st-b-low)", "var(--st-h-low)"]
];

// ---------------------------------------------------------------- small helpers
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const p2 = n => String(n).padStart(2, "0");
const P = p => Math.round(p * 100) + "%";
export const chuanMa = s => String(s || "").replace(/\s+/g, "").toUpperCase();
export const lopKey = s => String(s || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
export function foldName(s) {
  return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d")
    .toLowerCase().replace(/\s+/g, " ").trim();
}
export const ymdOf = ms => { const x = new Date(ms); return `${x.getFullYear()}-${p2(x.getMonth() + 1)}-${p2(x.getDate())}`; };
function dparts(d) { const [y, m, dd] = String(d).split("-").map(Number); return { y, m, d: dd }; }
function wdOf(d) { const { y, m, d: dd } = dparts(d); const x = new Date(y, m - 1, dd); return x.getMonth() === m - 1 ? WD[x.getDay()] : "?"; }
const dshort = d => { const q = dparts(d); return q.d + "/" + q.m; };
const dlong = d => { const q = dparts(d); return p2(q.d) + "/" + p2(q.m) + "/" + q.y; };
const dayMs = d => { const q = dparts(d); return new Date(q.y, q.m - 1, q.d, 12).getTime(); };
export function parseDMY(s) {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(s || "").trim());
  if (!m) return null;
  const d = +m[1], mo = +m[2], y = +m[3], x = new Date(y, mo - 1, d);
  if (x.getFullYear() !== y || x.getMonth() !== mo - 1 || x.getDate() !== d) return null;
  return `${y}-${p2(mo)}-${p2(d)}`;
}

// The DAY an AWord assignment belongs to = the date written in its title
// ("B1A_23.9_WORDS …" → 23/9), because that is the lesson day thầy files it
// under and the day a paper test of the same lesson would carry. The year
// comes from createdAt (nearest year, so a December title made in January
// still lands right). No date in the title → the day it was created.
export function dateOfAssignment(a) {
  const base = new Date(a.createdAt || Date.now());
  const tok = String(a.title || "").trim().split(/[\s_]+/)[1] || "";
  const m = /^(\d{1,2})\.(\d{1,2})$/.exec(tok);
  if (m) {
    const d = +m[1], mo = +m[2];
    let y = base.getFullYear();
    const at = yy => new Date(yy, mo - 1, d);
    const ok = x => x.getMonth() === mo - 1 && x.getDate() === d;
    if (ok(at(y))) {
      const diff = at(y).getTime() - base.getTime();
      if (diff > 183 * 864e5) y--; else if (diff < -183 * 864e5) y++;
      return ymdOf(at(y).getTime());
    }
  }
  return ymdOf(base.getTime());
}
// "B1A_23.9_WORDS LSB1-S3.T2" → "WORDS LSB1-S3.T2" (the class + day are the column group already).
export function shortTitle(title) {
  let t = String(title || "").trim().replace(/^[^\s_]+[\s_]+/, "");
  t = t.replace(/^\d{1,2}\.\d{1,2}[\s_]+/, "");
  return t || String(title || "");
}

// Best attempt per pupil, the Report popup's own rule (assignment-ui.js
// leaderboardBlock + assignments.js rankCompare): higher score, then faster.
function better(a, b) { if (!b) return true; if (a.score !== b.score) return a.score > b.score; return (a.timeMs || 0) < (b.timeMs || 0); }

// Match one score row to a roster pupil: code first; a row without a code
// falls back to the name (current or any old name, accents ignored) ONLY when
// that name belongs to exactly one pupil — a shared name is left unmatched
// rather than guessed (same posture as myLesson's datBangEm).
export function makeMatcher(students) {
  const byMa = new Map(), byName = new Map(), clash = new Set();
  students.forEach(s => {
    if (s.ma) byMa.set(s.ma, s);
    [s.name, ...(s.tenCu || [])].forEach(n => {
      const k = foldName(n); if (!k) return;
      if (byName.has(k) && byName.get(k) !== s) clash.add(k); else byName.set(k, s);
    });
  });
  return row => {
    const ma = chuanMa(row.ma);
    if (ma) return byMa.get(ma) || { key: "m:" + ma, ma, name: row.name || ma, outside: true };
    const k = foldName(row.name);
    if (k && !clash.has(k) && byName.has(k)) return byName.get(k);
    return null;
  };
}

export function bestByPupil(rows, match) {
  const best = new Map(); let unmatched = 0;
  rows.forEach(r => {
    const s = match(r);
    if (!s) { unmatched++; return; }
    const cur = best.get(s.key);
    const cand = { score: Number(r.score) || 0, total: Number(r.total) || 0, timeMs: Number(r.timeMs) || 0, id: r.id, name: s.name, outside: !!s.outside,
                   doDang: r.doDang === true };   // Đợt 383 — lượt DỞ: mẫu số không chắc, không góp vào mẫu số chung (xem syncAw)
    if (better(cand, cur)) best.set(s.key, cand);
  });
  return { best, unmatched };
}

// ---------------------------------------------------------------- roster
let rosterPromise = null;
async function loadRoster() {
  if (!rosterPromise) rosterPromise = (async () => {
    const [d, { doc, getDoc }] = await Promise.all([db(), fs()]);
    const snap = await getDoc(doc(d, "lessonWeb", "lop"));
    const j = snap.exists() ? JSON.parse(snap.data().json || "null") : null;
    if (!j) throw new Error("Không đọc được danh sách lớp (lessonWeb/lop).");
    const seen = new Set();
    return [...(j.lop || []), ...(j.khoa || [])].map(c => ({
      id: lopKey(c.maLop), name: c.tenGoc || c.maLop, isCourse: (j.khoa || []).includes(c),
      students: (c.hocSinh || []).map(h => {
        const ma = chuanMa(h.ma);
        return { key: ma ? "m:" + ma : "i:" + h.id, ma, name: String(h.ten || "").trim(), vao: h.vao || "", tenCu: Array.isArray(h.tenCu) ? h.tenCu : [] };
      })
    })).filter(c => c.id && !seen.has(c.id) && seen.add(c.id));
  })();
  try { return await rosterPromise; } catch (e) { rosterPromise = null; throw e; }
}

// ⭐ Đợt 520 — the class's LESSON CARDS on the dashboard, to name a hand test.
// lessonWeb/bai_<CLASS> = { json: '{"lop","capNhat","bai":[{ngay:"4.9", dang:"WORDS",
// maLesson:"LSA2-S2.T2.P4-5", tenHien:"A1C_4.9_WORDS LSA2-…", taoLuc, giaoLuc, han}]}' }
// — public, the same document andrewclasses.com reads (js/chung.js docKhoWeb).
// The card's day "d.m" takes its year from when it was made (nearest year).
const cardCache = new Map();
export function lessonCardTitle(c) {
  const dang = /^LS/i.test(c.ma) ? "DICTS" : (c.dang || "");     // a LISTENING lesson marked by hand = dictation (thầy)
  return dang ? `${c.ma} / ${dang}` : c.ma;
}
export function cardsFromBai(bai) {
  return (Array.isArray(bai) ? bai : []).map(b => {
    const ma = String(b.maLesson || String(b.tenHien || b.tieuDe || "").trim().split(/\s+/)[1] || "").trim();
    const m = /^(\d{1,2})\.(\d{1,2})$/.exec(String(b.ngay || "").trim());
    if (!ma || !m) return null;
    const base = new Date(String(b.giaoLuc || b.taoLuc || b.han || "").slice(0, 10) || Date.now());
    const d = +m[1], mo = +m[2];
    let y = isNaN(base) ? new Date().getFullYear() : base.getFullYear();
    const at = new Date(y, mo - 1, d);
    if (at.getMonth() !== mo - 1) return null;
    if (!isNaN(base)) { const diff = at - base; if (diff > 183 * 864e5) y--; else if (diff < -183 * 864e5) y++; }
    return { date: ymdOf(new Date(y, mo - 1, d).getTime()), ma, dang: String(b.dang || "").toUpperCase() };
  }).filter(Boolean);
}
async function loadLessonCards(classId) {
  if (!cardCache.has(classId)) cardCache.set(classId, (async () => {
    const [d, { doc, getDoc }] = await Promise.all([db(), fs()]);
    const snap = await getDoc(doc(d, "lessonWeb", "bai_" + classId));
    const j = snap.exists() ? JSON.parse(snap.data().json || "null") : null;
    return cardsFromBai(j && j.bai);
  })().catch(e => { console.warn("AWord STATS: lesson cards", classId, e); cardCache.delete(classId); return []; }));
  return cardCache.get(classId);
}
// Cards to offer for a day: that day's (one button per distinct title); none ⇒
// the three nearest days' cards. Returns { same, list }.
export function cardsForDay(cards, date) {
  const uniq = a => a.filter((c, i) => a.findIndex(x => lessonCardTitle(x) === lessonCardTitle(c)) === i);
  const same = uniq(cards.filter(c => c.date === date));
  if (same.length) return { same: true, list: same };
  const t = dayMs(date);
  const near = uniq(cards.slice().sort((a, b) => Math.abs(dayMs(a.date) - t) - Math.abs(dayMs(b.date) - t) || b.date.localeCompare(a.date)));
  return { same: false, list: near.slice(0, 3) };
}
// "12/10.22:01_LSB1-S1.T2.P1-2" / "12.10_…" → "LSB1-S1.T2.P1-2": the day is the column group already.
export function dispTitle(t) {
  return String(t || "").replace(/^\d{1,2}[./]\d{1,2}(?:\.\d{1,2}:\d{2})?[\s_]+/, "") || String(t || "");
}

// ---------------------------------------------------------------- Firestore (month docs)
async function requireUid() {
  const u = await currentUser();
  if (!u) { const e = new Error("Hãy đăng nhập trước."); e.code = "aw/signed-out"; throw e; }
  return u.uid;
}
const docIdFor = (classId, ym) => `st_${lopKey(classId)}_${String(ym).replace("-", "")}`;

async function loadMonthDocs(classId) {
  const uid = await requireUid();
  const [d, { collection, query, where, getDocs }] = await Promise.all([db(), fs()]);
  const snap = await getDocs(query(collection(d, "users", uid, "items"), where("kind", "==", KIND)));
  return snap.docs.map(s => ({ id: s.id, ...s.data() })).filter(x => x.classId === classId);
}
async function writeTest(classId, test, guests = {}) {
  const uid = await requireUid();
  const [d, { doc, setDoc, updateDoc }] = await Promise.all([db(), fs()]);
  const ym = test.date.slice(0, 7);
  const ref = doc(d, "users", uid, "items", docIdFor(classId, ym));
  await setDoc(ref, { kind: KIND, root: "stats", parentId: null, trashed: false, classId, ym }, { merge: true });
  const patch = { ["tests." + test.id]: test, updatedAt: Date.now() };
  Object.entries(guests).forEach(([gid, g]) => { patch["guests." + gid] = g; });
  await updateDoc(ref, patch);
}
async function removeTest(classId, ym, id) {
  const uid = await requireUid();
  const [d, { doc, updateDoc, deleteField }] = await Promise.all([db(), fs()]);
  await updateDoc(doc(d, "users", uid, "items", docIdFor(classId, ym)), { ["tests." + id]: deleteField(), updatedAt: Date.now() });
}

// ---------------------------------------------------------------- the page
export function mountStatsHome(mount, opts = {}) {
  ensureCss();
  const toastOut = opts.toast || (() => {});
  const root = document.createElement("div");
  root.className = "aw-st";
  mount.append(root);

  let alive = true;
  let classes = [], cls = null, tests = [], guests = {}, allAssignments = null;
  let mode = "raw", view = { type: "recent" }, openY = {}, openM = {};
  let loadSeq = 0;
  const layers = new Set();

  const today = () => ymdOf(Date.now());
  const cutoff = () => ymdOf(Date.now() - RECENT_DAYS * 864e5);

  // ---- people shown as rows: the roster, plus anyone else who has a value in
  //      the tests on screen (a temporary person, or a pupil who has since
  //      left / moved class — their scores stay visible, marked).
  function peopleFor(list) {
    const out = cls ? cls.students.map(s => ({ ...s })) : [];
    const known = new Set(out.map(s => s.key));
    list.forEach(t => Object.entries(t.values || {}).forEach(([k, v]) => {
      if (known.has(k)) return;
      known.add(k);
      if (k.startsWith("g:")) { const g = guests[k.slice(2)] || {}; out.push({ key: k, name: g.name || v.name || "?", note: g.note || "", guest: true }); }
      else out.push({ key: k, name: v.name || k.slice(2), left: true });
    }));
    return out;
  }
  const cellOf = (t, s) => {
    if (s.vao && t.date < s.vao) return { k: "pre" };
    const v = t.values && t.values[s.key];
    if (v) return v;
    return (s.guest || s.left) ? { k: "na" } : { k: "none" };
  };
  function pct(t, c) {
    if (!c || c.k !== "n" || !(t.total > 0)) return null;
    const p = t.kind === "aw" ? c.v / t.total : (t.total - c.v) / t.total;
    return Math.max(0, Math.min(1, p));
  }
  const allPeople = () => peopleFor(tests);
  function avgTest(t) { const ps = peopleFor([t]).map(s => pct(t, cellOf(t, s))).filter(p => p != null); return ps.length ? ps.reduce((a, b) => a + b, 0) / ps.length : null; }
  function dayPct(date, s) { const ps = tests.filter(t => t.date === date).map(t => pct(t, cellOf(t, s))).filter(p => p != null); return ps.length ? ps.reduce((a, b) => a + b, 0) / ps.length : null; }
  function avgDay(date) { const ps = allPeople().map(s => dayPct(date, s)).filter(p => p != null); return ps.length ? ps.reduce((a, b) => a + b, 0) / ps.length : null; }
  const heat = p => p == null ? "var(--st-h-none)" : p >= .85 ? "var(--st-h-great)" : p >= .7 ? "var(--st-h-good)" : p >= .5 ? "var(--st-h-mid)" : "var(--st-h-low)";
  const band = p => p >= .85 ? 0 : p >= .7 ? 1 : p >= .5 ? 2 : 3;
  const allDays = () => [...new Set(tests.map(t => t.date))].sort().reverse();
  function testsIn(v) {
    const f = v.type === "recent" ? t => t.date >= cutoff() : v.type === "month" ? t => t.date.slice(0, 7) === v.ym : t => t.date === v.date;
    return tests.filter(f).sort((a, b) => b.date.localeCompare(a.date) || (a.kind === b.kind ? (a.createdAt || 0) - (b.createdAt || 0) : a.kind === "aw" ? -1 : 1));
  }

  // ⭐ Đợt 520 — a hand test WITHOUT a total keeps only the mistake counts.
  const noTotal = t => t.kind === "hand" && !(t.total > 0);
  function errAvg(t) {
    const vs = peopleFor([t]).map(s => cellOf(t, s)).filter(c => c.k === "n").map(c => c.v);
    return vs.length ? vs.reduce((a, b) => a + b, 0) / vs.length : null;
  }
  const fmt1 = x => (Math.round(x * 10) / 10).toString().replace(".", ",");
  const mean = a => { a = a.filter(x => x != null); return a.length ? a.reduce((x, y) => x + y, 0) / a.length : null; };
  // one pupil over a list of tests: average % (tests that have a %), done / due
  function personStat(s, list) {
    let done = 0, due = 0, abs = 0; const ps = [];
    list.forEach(t => { const c = cellOf(t, s); if (c.k === "pre" || c.k === "na") return; due++;
      if (c.k === "n") { done++; const p = pct(t, c); if (p != null) ps.push(p); } else if (c.k === "abs") abs++; });
    return { avg: mean(ps), done, due, abs };
  }
  const pcol = p => p == null ? "var(--st-faint)" : p >= .85 ? "var(--st-g1t)" : p >= .7 ? "var(--st-g2t)" : p >= .5 ? "var(--st-g3t)" : "var(--st-g4t)";
  const AV = ["#6366f1", "#0ea5e9", "#14b8a6", "#f59e0b", "#ec4899", "#8b5cf6", "#22c55e", "#ef4444", "#06b6d4", "#f97316"];
  const avColor = k => { let h = 0; for (const ch of String(k)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return AV[h % AV.length]; };
  const initials = n => String(n || "?").trim().split(/\s+/).map(w => w[0] || "").slice(-2).join("").toUpperCase();
  const avatar = (s, cls_ = "") => `<span class="aw-st-av ${cls_}" style="background:${s.guest ? "var(--st-guest)" : avColor(s.key)}">${esc(initials(s.name))}</span>`;
  function spark(vals, w, h, col) {
    const n = vals.length, pts = vals.map((v, i) => v == null ? null : [n < 2 ? w / 2 : 2 + i * (w - 4) / (n - 1), h - 3 - v * (h - 6)]).filter(Boolean);
    if (!pts.length) return `<svg class="aw-st-sk" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"></svg>`;
    const last = pts[pts.length - 1];
    return `<svg class="aw-st-sk" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true">${pts.length > 1 ? `<polyline points="${pts.map(p => p.join(",")).join(" ")}" fill="none" stroke="${col}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>` : ""}<circle cx="${last[0]}" cy="${last[1]}" r="2.4" fill="${col}"/></svg>`;
  }
  let sortBy = "name", selKey = null;

  // ---------------------------------------------------------------- skeleton
  root.innerHTML = `
    <aside class="aw-st-rail"><div class="aw-st-railin">
      <div class="aw-st-home"><button type="button" class="aw-st-abtn" data-st="home" title="Về trang chủ AWord" aria-label="Trang chủ AWord">A</button><span class="aw-st-hometxt">STATS</span></div>
      <nav class="aw-st-tree" aria-label="Các buổi theo ngày"></nav>
    </div></aside>
    <div class="aw-st-body">
      <div class="aw-st-top">
        <label class="aw-st-cls" title="Đổi lớp"><span class="aw-st-clsname">…</span>${I.chev}<select aria-label="Chọn lớp" data-st="class"><option>…</option></select></label>
        <span class="aw-st-csub"></span>
        <span class="aw-st-sp"></span>
        <div class="aw-st-seg" role="group" aria-label="Cách hiện ô">
          <button type="button" data-st="raw" aria-pressed="true">Số gốc</button><button type="button" data-st="pct" aria-pressed="false">%</button>
        </div>
        <button type="button" class="aw-st-btn" data-st="xls" title="Xuất Excel">${icons.download || ""}Excel</button>
        <button type="button" class="aw-st-btn is-analyse" data-st="analyse">${I.an}ANALYSE</button>
        <button type="button" class="aw-st-btn is-hand" data-st="add">${I.plus}Chấm tay</button>
        <span class="aw-st-vsep"></span>
      </div>
      <div class="aw-st-kpis"></div>
      <div class="aw-st-wrap">
        <section class="aw-st-card aw-st-main"><div class="aw-st-loading">Đang tải danh sách lớp…</div></section>
        <aside class="aw-st-drawer" aria-label="Chi tiết học sinh"></aside>
      </div>
    </div>`;
  if (opts.rightCluster) root.querySelector(".aw-st-top").append(opts.rightCluster);
  else root.querySelector(".aw-st-vsep").remove();
  const $tree = root.querySelector(".aw-st-tree"), $main = root.querySelector(".aw-st-main"), $sel = root.querySelector('[data-st="class"]');
  const $kpis = root.querySelector(".aw-st-kpis"), $drawer = root.querySelector(".aw-st-drawer"), $csub = root.querySelector(".aw-st-csub"), $cname = root.querySelector(".aw-st-clsname");

  // ---------------------------------------------------------------- loading
  async function start() {
    try { classes = await loadRoster(); }
    catch (e) { $main.innerHTML = `<div class="aw-st-empty">${esc(e.message || e)}</div>`; return; }
    if (!alive) return;
    let want = lopKey(opts.classId || "");
    if (!want) { try { want = localStorage.getItem("aword-stats-class") || ""; } catch { /* private window */ } }
    cls = classes.find(c => c.id === want) || classes[0] || null;
    $sel.innerHTML = classes.map(c => `<option value="${esc(c.id)}">${esc(c.name)}${c.isCourse ? " (khoá)" : ""}</option>`).join("");
    if (cls) $sel.value = cls.id;
    await loadClass();
  }
  async function loadClass() {
    if (!cls) { $main.innerHTML = `<div class="aw-st-empty">Chưa có lớp nào.</div>`; return; }
    const seq = ++loadSeq;
    try { localStorage.setItem("aword-stats-class", cls.id); } catch { /* ignore */ }
    opts.onClassChange?.(cls.id);
    tests = []; guests = {}; selKey = null;
    $cname.textContent = cls.name; $csub.textContent = ""; $kpis.innerHTML = ""; root.classList.remove("has-sel");
    $tree.innerHTML = ""; $main.innerHTML = `<div class="aw-st-loading">Đang tải điểm lớp ${esc(cls.name)}…</div>`;
    try {
      const docs = await loadMonthDocs(cls.id);
      if (seq !== loadSeq || !alive) return;
      absorb(docs);
      paint();
      const changed = await syncAw(seq);
      if (seq !== loadSeq || !alive) return;
      if (changed) {
        // the newest day may be a freshly snapshotted AWord one — open its folder
        const d0 = allDays()[0];
        if (d0) { openY[d0.slice(0, 4)] = true; openM[d0.slice(0, 7)] = true; }
        paint();
      }
    } catch (e) {
      if (seq !== loadSeq || !alive) return;
      console.warn("AWord STATS: load failed", e);
      $main.innerHTML = `<div class="aw-st-empty">Không tải được dữ liệu: ${esc(e.message || e)}</div>`;
    }
  }
  function absorb(docs) {
    tests = []; guests = {};
    docs.forEach(dc => {
      Object.assign(guests, dc.guests || {});
      Object.values(dc.tests || {}).forEach(t => { if (t && t.id && t.date) tests.push({ ...t }); });
    });
    const d0 = allDays()[0];
    if (d0) { openY[d0.slice(0, 4)] = true; openM[d0.slice(0, 7)] = true; }
  }

  // Snapshot the class's AWord assignments (since 22/9/2026) into the month
  // docs. Only assignments whose submitCount moved since the last snapshot are
  // re-read (one read per score row), so opening the page again is cheap.
  async function syncAw(seq) {
    if (!allAssignments) allAssignments = await listAllAssignments({ includeTrashed: true });
    const mine = allAssignments.filter(a => (a.createdAt || 0) >= AW_FROM && lopKey(classTokenOf(a.title)) === cls.id);
    const match = makeMatcher(cls.students);
    let changed = false;
    for (const a of mine) {
      if (seq !== loadSeq || !alive) return false;
      const id = "aw_" + a.code;
      const old = tests.find(t => t.id === id);
      const sc = Number(a.submitCount) || 0;
      const date = dateOfAssignment(a);
      if (old && old.submitCount === sc && old.fullTitle === a.title && old.date === date) continue;
      let rows;
      try { rows = await listScores(a.code, MAX_SCORES_THAY); } catch (e) { console.warn("AWord STATS: scores", a.code, e); continue; }
      const { best, unmatched } = bestByPupil(rows, match);
      const values = {};
      const totals = [];
      best.forEach((b, key) => { values[key] = { k: "n", v: b.score, id: b.id || "", name: b.name, t: b.timeMs }; if (b.total && !b.doDang) totals.push(b.total); });
      const total = totals.length ? mode_(totals) : (old ? old.total : 0);
      const test = {
        id, kind: "aw", code: a.code, date, fullTitle: a.title, title: shortTitle(a.title),
        sub: templateLabel(a.activityType) || "", total, penal: isPenalised(a),
        values: { ...(old ? old.values : {}), ...values }, unmatched, submitCount: sc, createdAt: a.createdAt || 0, syncedAt: Date.now()
      };
      try {
        if (old && old.date.slice(0, 7) !== date.slice(0, 7)) await removeTest(cls.id, old.date.slice(0, 7), id);
        await writeTest(cls.id, test);
      } catch (e) { console.warn("AWord STATS: snapshot write failed", e); }
      tests = tests.filter(t => t.id !== id).concat(test);
      changed = true;
    }
    return changed;
  }
  function mode_(arr) { const c = new Map(); arr.forEach(x => c.set(x, (c.get(x) || 0) + 1)); return [...c.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0]; }
  function isPenalised(a) {
    if (a.activityType === "gameshow") return true;
    const o = a.activity?.options || {};
    return ["pointsOff", "minusAmount", "letterPenalty", "timeCost"].some(k => Number(o[k]) > 0);
  }

  // ---------------------------------------------------------------- left rail (Quick-access look, Đợt 520)
  function paintTree() {
    const days = allDays(); const Y = {};
    days.forEach(d => { const y = d.slice(0, 4), ym = d.slice(0, 7); (Y[y] = Y[y] || {}); (Y[y][ym] = Y[y][ym] || []).push(d); });
    const nRecent = new Set(testsIn({ type: "recent" }).map(t => t.date)).size;
    const FOLDER = opts.folderSvg || I.folder;
    let h = `<div class="aw-st-qdau">Xem nhanh</div>
      <button type="button" class="aw-st-qh ${view.type === "recent" ? "is-on" : ""}" data-view="recent"><span class="aw-st-mui"></span><span class="aw-st-fi is-clock">${I.clock}</span><span class="aw-st-qt">30 ngày gần nhất</span><span class="aw-st-qn">${nRecent}</span></button>
      <div class="aw-st-qdau">Lưu trữ</div>`;
    if (!days.length) h += `<div class="aw-st-treeempty">Chưa có bài nào.</div>`;
    Object.keys(Y).sort().reverse().forEach(y => {
      const n = Object.values(Y[y]).reduce((a, b) => a + b.length, 0);
      h += `<button type="button" class="aw-st-qh ${openY[y] ? "is-open" : ""}" data-year="${y}" aria-expanded="${!!openY[y]}"><span class="aw-st-mui">${I.car}</span><span class="aw-st-fi">${FOLDER}</span><span class="aw-st-qt">${y}</span><span class="aw-st-qn">${n}</span></button><div class="aw-st-qkids ${openY[y] ? "is-open" : ""}">`;
      Object.keys(Y[y]).sort().reverse().forEach(ym => {
        const on = view.type === "month" && view.ym === ym;
        h += `<button type="button" class="aw-st-qh is-l2 ${openM[ym] ? "is-open" : ""} ${on ? "is-on" : ""}" data-ym="${ym}" aria-expanded="${!!openM[ym]}"><span class="aw-st-mui">${I.car}</span><span class="aw-st-fi">${FOLDER}</span><span class="aw-st-qt">Tháng ${+ym.slice(5)}</span><span class="aw-st-qn">${Y[y][ym].length}</span></button><div class="aw-st-qkids ${openM[ym] ? "is-open" : ""}">`;
        Y[y][ym].forEach(d => {
          const its = tests.filter(t => t.date === d);
          const bars = its.map(t => { const a = avgTest(t); return `<i class="${t.kind === "hand" ? "is-hand" : ""}" style="height:${a == null ? 7 : 4 + Math.round(a * 10)}px"></i>`; }).join("");
          h += `<button type="button" class="aw-st-qh is-day ${view.type === "day" && view.date === d ? "is-on" : ""}" data-day="${d}"><span class="aw-st-wd">${wdOf(d)}</span><span class="aw-st-qt">${dshort(d)}</span><span class="aw-st-mini" title="${its.length} bài">${bars}</span></button>`;
        });
        h += `</div>`;
      });
      h += `</div>`;
    });
    $tree.innerHTML = h;
  }

  // ---------------------------------------------------------------- summary tiles
  function paintKpis(list) {
    if (!list.length) { $kpis.innerHTML = ""; return; }
    const roster = cls.students;
    const stats = roster.map(s => ({ s, ...personStat(s, list) }));
    const days = [...new Set(list.map(t => t.date))].sort();
    const dayAvg = days.map(d => mean(roster.map(s => mean(list.filter(t => t.date === d).map(t => pct(t, cellOf(t, s)))))));
    const avg = mean(stats.map(x => x.avg));
    const lastTwo = dayAvg.filter(x => x != null).slice(-2);
    const diff = lastTwo.length === 2 ? Math.round((lastTwo[1] - lastTwo[0]) * 100) : null;
    const done = stats.reduce((a, x) => a + x.done, 0), due = stats.reduce((a, x) => a + x.due, 0);
    const rate = due ? done / due : null;
    const nAw = list.filter(t => t.kind === "aw").length;
    const low = stats.filter(x => (x.avg != null && x.avg < .6) || (x.due >= 2 && x.done / x.due < .6))
      .sort((a, b) => (a.avg ?? 0) - (b.avg ?? 0)).slice(0, 5);
    const r = 24, C = 2 * Math.PI * r;
    $kpis.innerHTML = `
      <div class="aw-st-kpi"><span class="aw-st-kl">Điểm TB lớp</span><div class="aw-st-krow"><div><div class="aw-st-kv">${avg == null ? "—" : P(avg)}${diff == null ? "" : `<small class="${diff >= 0 ? "is-up" : "is-down"}">${diff >= 0 ? "▲" : "▼"} ${Math.abs(diff)}%</small>`}</div><span class="aw-st-ks">${diff == null ? "trung bình các bài có %" : "so với buổi trước"}</span></div>${spark(dayAvg, 110, 40, "#2f7bff")}</div></div>
      <div class="aw-st-kpi"><span class="aw-st-kl">Tỉ lệ làm bài</span><div class="aw-st-krow"><div><div class="aw-st-kv">${rate == null ? "—" : P(rate)}</div><span class="aw-st-ks">${done}/${due} lượt</span></div>
        <svg class="aw-st-ring" viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="${r}" fill="none" stroke="#eef2f7" stroke-width="7"/><circle cx="30" cy="30" r="${r}" fill="none" stroke="#2f7bff" stroke-width="7" stroke-linecap="round" stroke-dasharray="${C * (rate || 0)} ${C}" transform="rotate(-90 30 30)"/></svg></div></div>
      <div class="aw-st-kpi"><span class="aw-st-kl">Bài đã chấm</span><div class="aw-st-kv">${list.length}</div><span class="aw-st-ks">${nAw} AWord · ${list.length - nAw} chấm tay · ${days.length} buổi</span></div>
      <div class="aw-st-kpi"><span class="aw-st-kl">Cần kèm thêm</span>${low.length
        ? `<div class="aw-st-who">${low.map(x => `<button type="button" data-row="${esc(x.s.key)}">${avatar(x.s, "is-xs")}${esc(x.s.name)} · ${x.avg == null ? x.done + "/" + x.due + " bài" : P(x.avg)}</button>`).join("")}</div><span class="aw-st-ks">TB dưới 60% hoặc bỏ nhiều bài</span>`
        : `<div class="aw-st-kv is-ok">Không em nào 🎉</div><span class="aw-st-ks">mọi em TB ≥ 60% và làm đủ bài</span>`}</div>`;
  }

  // ---------------------------------------------------------------- main table
  // plain colours for the little SVG lines (an SVG stroke cannot read a CSS var from here)
  const pHex = p => p == null ? "#c3ccd8" : p >= .85 ? "#137a43" : p >= .7 ? "#4f7a12" : p >= .5 ? "#9a6200" : "#b42318";
  function paintMain() {
    const list = testsIn(view);
    const title = view.type === "recent" ? "30 ngày gần nhất" : view.type === "month" ? `Tháng ${+view.ym.slice(5)} / ${view.ym.slice(0, 4)}` : `${wdOf(view.date)} · ${dlong(view.date)}`;
    const days = [...new Set(list.map(t => t.date))];
    const nAw = list.filter(t => t.kind === "aw").length;
    $csub.innerHTML = `${title} · <b>${cls.students.length}</b> học sinh`;
    paintKpis(list);
    let h = `<div class="aw-st-chead"><h2>${title}</h2><span class="aw-st-cmeta"><b>${days.length}</b> ngày · <b>${list.length}</b> bài (${nAw} AWord · ${list.length - nAw} chấm tay)</span><span class="aw-st-sp"></span>
      <div class="aw-st-legend"><span><i class="aw-st-sw b1"></i>≥ 85%</span><span><i class="aw-st-sw b2"></i>70–84</span><span><i class="aw-st-sw b3"></i>50–69</span><span><i class="aw-st-sw b4"></i>&lt; 50</span><span><i class="aw-st-sw is-err"></i>chấm tay · số lỗi</span><span><b style="color:var(--st-bad)">V</b> vắng · — chưa làm</span></div></div>`;
    if (!list.length) {
      $main.innerHTML = h + `<div class="aw-st-empty">Chưa có bài nào trong khoảng này.<br>Bài giao AWord của lớp (tên bắt đầu bằng <b>${esc(cls.id)}_</b>, từ 22/9/2026) sẽ tự hiện ở đây.</div>`;
      if (selKey) paintDrawer();
      return;
    }
    const who = peopleFor(list).map((s, i) => ({ s, i, ...personStat(s, list) }));
    if (sortBy === "avg") who.sort((a, b) => (b.avg ?? -1) - (a.avg ?? -1) || a.i - b.i);
    const asc = days.slice().sort();
    h += `<div class="aw-st-tablewrap"><table><thead><tr><th class="aw-st-namecol aw-st-nameh" rowspan="2"><span>HỌC SINH</span><button type="button" class="aw-st-sort" data-st="sort" title="Đổi cách xếp">${sortBy === "avg" ? "↓ điểm TB" : "A→Z"}</button></th>`;
    days.forEach(d => { const n = list.filter(t => t.date === d).length;
      h += `<th class="aw-st-dayh aw-st-g0" colspan="${n}"><span class="aw-st-wdc">${wdOf(d)}</span>${dshort(d)}<span class="aw-st-yy">/${d.slice(0, 4)}</span><span class="aw-st-nb">${n} bài</span></th>`; });
    h += `</tr><tr>`;
    list.forEach((t, i) => { const g0 = i === 0 || list[i - 1].date !== t.date; const a = avgTest(t);
      const sub = t.kind === "aw" ? `${t.sub ? esc(t.sub) + " · " : ""}/${t.total}` : noTotal(t) ? "số lỗi" : `lỗi / ${t.total} câu`;
      const bar = a == null ? (noTotal(t) ? `width:100%;background:#f5dca6` : `width:0`) : `width:${Math.round(a * 100)}%;background:${pHex(a)}`;
      h += `<th class="aw-st-bh ${g0 ? "aw-st-g0" : ""}" title="${esc(t.fullTitle || t.title)}"><div class="aw-st-colhead">
        <span class="aw-st-k ${t.kind === "hand" ? "is-hand" : ""}">${t.kind === "aw" ? "AWORD" : "✎ TAY"}</span>
        <span class="aw-st-t">${esc(dispTitle(t.title))}</span><span class="aw-st-n">${sub}</span>
        <span class="aw-st-hbar"><i style="${bar}"></i></span>
        <span class="aw-st-hic"><button type="button" class="aw-st-ibtn" data-chart="${esc(t.id)}" title="Đánh giá bài này" aria-label="Đánh giá">${I.chart}</button>${t.kind === "hand" ? `<button type="button" class="aw-st-ibtn" data-edit="${esc(t.id)}" title="Sửa bài" aria-label="Sửa bài">${I.pen}</button>` : ""}</span></div></th>`; });
    h += `</tr></thead><tbody>`;
    who.forEach(({ s, avg, done, due }) => {
      const tag = s.guest ? `<small class="is-guest">tạm${s.note ? " · " + esc(s.note) : ""}</small>` : s.left ? `<small>không còn trong lớp</small>` : s.vao && s.vao >= (list[list.length - 1]?.date || "") ? `<small>vào lớp ${dlong(s.vao)}</small>` : `<small>${done}/${due} bài</small>`;
      const tr = asc.map(d => mean(list.filter(t => t.date === d).map(t => pct(t, cellOf(t, s)))));
      h += `<tr class="${s.guest ? "is-guest" : s.left ? "is-left" : ""} ${selKey === s.key ? "is-sel" : ""}" data-row="${esc(s.key)}"><th class="aw-st-namecol"><div class="aw-st-nmw">${avatar(s)}<span class="aw-st-nmt"><b>${esc(s.name)}</b>${tag}</span>${spark(tr, 44, 20, pHex(avg))}<span class="aw-st-pc" style="color:${pcol(avg)}">${avg == null ? "—" : P(avg)}</span></div></th>`;
      list.forEach((t, i) => { const g0 = i === 0 || list[i - 1].date !== t.date; const c = cellOf(t, s), p = pct(t, c);
        const inner = c.k === "n" ? (p == null ? `<span class="is-err">${c.v}</span>` : `<span class="b${band(p) + 1}">${mode === "raw" ? c.v : P(p)}</span>`)
          : c.k === "abs" ? `<span class="is-abs">V</span>`
          : c.k === "pre" ? `<span class="is-pre" title="Chưa vào lớp">·</span>`
          : c.k === "na" ? `<span class="is-na">·</span>`
          : `<span class="is-none">—</span>`;
        h += `<td class="aw-st-v ${g0 ? "aw-st-g0" : ""}">${inner}</td>`; });
      h += `</tr>`;
    });
    h += `</tbody><tfoot><tr><td class="aw-st-namecol">TRUNG BÌNH LỚP</td>${list.map((t, i) => { const g0 = i === 0 || list[i - 1].date !== t.date;
      if (noTotal(t)) { const e = errAvg(t); return `<td class="${g0 ? "aw-st-g0" : ""}" style="color:var(--st-hand-ink)">${e == null ? "—" : "TB " + fmt1(e) + " lỗi"}</td>`; }
      const a = avgTest(t); return `<td class="${g0 ? "aw-st-g0" : ""}" style="color:${pcol(a)}">${a == null ? "—" : P(a)}</td>`; }).join("")}</tr></tfoot></table></div>`;
    $main.innerHTML = h;
    if (selKey) paintDrawer();
  }
  function paint() { if (!alive) return; paintTree(); paintMain(); }

  // ---------------------------------------------------------------- pupil detail panel (Đợt 520, replaces the old progress popup)
  function openRow(key) {
    selKey = selKey === key ? null : key;
    root.classList.toggle("has-sel", !!selKey);
    $main.querySelectorAll("tbody tr").forEach(r => r.classList.toggle("is-sel", r.dataset.row === selKey));
    if (selKey) paintDrawer();
  }
  function closeRow() { if (selKey) openRow(selKey); }
  function paintDrawer() {
    const s = allPeople().find(x => x.key === selKey);
    if (!s) { selKey = null; root.classList.remove("has-sel"); return; }
    const list = testsIn(view);
    const me = personStat(s, list);
    const ranked = cls.students.map(x => ({ x, a: personStat(x, list).avg })).filter(r => r.a != null).sort((a, b) => b.a - a.a);
    const rank = ranked.findIndex(r => r.x.key === s.key) + 1;
    // the line: the pupil's last 12 lesson days that have a % (all time), against the class
    const pts = allDays().slice().reverse().map(d => ({ d, p: dayPct(d, s), a: avgDay(d) })).filter(r => r.p != null).slice(-12);
    const W = 268, H = 124, L = 12, R = 12, T = 10, B = 20, n = pts.length;
    const x = i => L + (n < 2 ? (W - L - R) / 2 : i * (W - L - R) / (n - 1)), y = p => T + (1 - p) * (H - T - B);
    const col = s.guest ? "#7c3aed" : avColor(s.key);
    let g = [0, .5, 1].map(v => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="#eef2f7"/>`).join("");
    if (n) {
      const cl = pts.map((r, i) => r.a == null ? null : `${x(i)},${y(r.a)}`).filter(Boolean).join(" ");
      if (cl) g += `<polyline points="${cl}" fill="none" stroke="#c3ccd8" stroke-width="2" stroke-dasharray="4 4"/>`;
      g += `<polyline points="${pts.map((r, i) => `${x(i)},${y(r.p)}`).join(" ")}" fill="none" stroke="${col}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`;
      g += pts.map((r, i) => `<circle cx="${x(i)}" cy="${y(r.p)}" r="3.6" fill="#fff" stroke="${col}" stroke-width="2.2"><title>${dshort(r.d)} · ${P(r.p)}</title></circle>`).join("");
      const every = Math.max(1, Math.ceil(n / 6));
      g += pts.map((r, i) => (i % every === 0 || i === n - 1) ? `<text x="${x(i)}" y="${H - 4}" font-size="10" fill="#97a3b4" text-anchor="middle" font-weight="700">${dshort(r.d)}</text>` : "").join("");
    }
    const tag = s.guest ? "Người tạm" + (s.note ? " · " + esc(s.note) : "") : s.left ? "Không còn trong lớp" : rank ? `Hạng ${rank}/${ranked.length} trong lớp` : "Chưa có điểm %";
    const span = view.type === "recent" ? "30 ngày" : view.type === "month" ? "tháng " + (+view.ym.slice(5)) : dshort(view.date);
    $drawer.innerHTML = `
      <div class="aw-st-dhead">${avatar(s, "is-lg")}<div class="aw-st-dname"><h3>${esc(s.name)}</h3><small>${tag}</small></div><button type="button" class="aw-st-x" data-st="dclose" title="Đóng (Esc)" aria-label="Đóng">${I.x}</button></div>
      <div class="aw-st-dstat"><div><b style="color:${pcol(me.avg)}">${me.avg == null ? "—" : P(me.avg)}</b><span>ĐIỂM TB</span></div><div><b>${me.done}/${me.due}</b><span>ĐÃ LÀM</span></div><div><b>${me.abs}</b><span>VẮNG</span></div></div>
      ${n ? `<svg class="aw-st-dchart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Điểm theo buổi">${g}</svg><div class="aw-st-dleg"><i style="background:${col}"></i>em · <i class="is-dash"></i>cả lớp · ${n} buổi gần nhất có điểm</div>` : `<div class="aw-st-note" style="margin:0">Chưa có buổi nào có điểm %.</div>`}
      <div class="aw-st-dsec">TỪNG BÀI · ${esc(span)}</div>
      <ul class="aw-st-dlist">${list.map(t => { const c = cellOf(t, s), p = pct(t, c);
        const v = c.k === "n" ? (p == null ? `<span class="is-err">${c.v}</span>` : `<span class="b${band(p) + 1}">${mode === "raw" ? c.v : P(p)}</span>`) : c.k === "abs" ? `<span class="is-abs">V</span>` : c.k === "pre" || c.k === "na" ? `<span class="is-na">·</span>` : `<span class="is-none">—</span>`;
        return `<li><span class="aw-st-dl">${dshort(t.date)} · ${esc(dispTitle(t.title))}${t.sub ? " · " + esc(t.sub) : ""}</span><span class="aw-st-dv">${v}</span></li>`; }).join("")}</ul>`;
  }

  // ---------------------------------------------------------------- overlays
  // `keepOnBackdrop` — the hand-entry sheet holds unsaved taps, so a stray
  // click on the dim must not throw them away (only ✕ / Huỷ / Esc close it).
  function openLayer(html, { onClose, keepOnBackdrop = false } = {}) {
    closeLayers();
    const layer = document.createElement("div");
    layer.className = "aw-st-layer";
    layer.innerHTML = html;
    document.body.append(layer);
    const close = () => { if (!layer.isConnected) return; layer.remove(); layers.delete(close); document.removeEventListener("keydown", onKey); onClose?.(); };
    const onKey = e => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    layer.addEventListener("click", e => { if ((e.target === layer && !keepOnBackdrop) || e.target.closest("[data-close]")) close(); });
    layers.add(close);
    return { layer, close };
  }
  function closeLayers() { [...layers].forEach(f => f()); }
  let toastTimer = null;
  function toast(msg) {
    document.querySelectorAll(".aw-st-toast").forEach(n => n.remove());
    const t = document.createElement("div"); t.className = "aw-st-toast"; t.setAttribute("role", "status"); t.textContent = msg;
    document.body.append(t); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.remove(), 3600);
  }

  // ---- 📊 one test
  function openEval(id) {
    const t = tests.find(x => x.id === id); if (!t) return;
    if (noTotal(t)) { openEvalErrors(t); return; }
    const T = t.total;
    const rows = peopleFor([t]).map(s => { const c = cellOf(t, s); return { s, c, p: pct(t, c) }; }).filter(r => r.c.k !== "na");
    const done = rows.filter(r => r.p != null).sort((a, b) => b.p - a.p);
    const a = avgTest(t);
    const med = done.length ? (done.length % 2 ? done[(done.length - 1) / 2].p : (done[done.length / 2 - 1].p + done[done.length / 2].p) / 2) : null;
    const prev = tests.filter(x => x.kind === t.kind && x.id !== t.id && (x.date < t.date || (x.date === t.date && (x.createdAt || 0) < (t.createdAt || 0)))).sort((x, y) => y.date.localeCompare(x.date))[0];
    const diff = prev && a != null && avgTest(prev) != null ? a - avgTest(prev) : null;
    const absN = rows.filter(r => r.c.k === "abs").length, noneN = rows.filter(r => r.c.k === "none").length, preN = rows.filter(r => r.c.k === "pre").length;
    const groups = [[], [], [], []]; done.forEach(r => groups[band(r.p)].push(r));
    const lab = r => t.kind === "aw" ? `${r.c.v}/${T} · ${P(r.p)}` : `đúng ${T - r.c.v}/${T} · ${P(r.p)} · ${r.c.v} lỗi`;
    let h = `<div class="aw-st-sheet" role="dialog" aria-modal="true" aria-label="Đánh giá bài">
      <div class="aw-st-shead"><span class="aw-st-chip is-${t.kind}">${t.kind === "aw" ? "AWord · điểm" : "✎ Chấm tay · số lỗi"}</span><h3>${esc(dispTitle(t.title))}${t.sub ? " · " + esc(t.sub) : ""}</h3><button type="button" class="aw-st-x" data-close aria-label="Đóng">${I.x}</button></div>
      <div class="aw-st-ssub">${wdOf(t.date)} ${dlong(t.date)} · ${t.kind === "aw" ? `lượt SUBMIT tốt nhất của mỗi em${t.penal ? " · bài có trừ điểm: ô là tổng điểm" : ""}${t.code ? ` · mã bài ${esc(t.code)}` : ""}` : `tổng ${T} câu, đúng = tổng − số lỗi`}</div>
      <div class="aw-st-kpis2">
        <div class="aw-st-kpi2"><small>ĐÃ LÀM</small><b>${done.length}/${rows.length - preN}</b><em>${absN} vắng · ${noneN} chưa làm</em></div>
        <div class="aw-st-kpi2"><small>TRUNG BÌNH</small><b>${a == null ? "—" : P(a)}</b><em>trung vị ${med == null ? "—" : P(med)}</em></div>
        <div class="aw-st-kpi2"><small>CAO NHẤT</small><b>${done[0] ? P(done[0].p) : "—"}</b><em>${done[0] ? esc(done[0].s.name) : ""}</em></div>
        <div class="aw-st-kpi2"><small>THẤP NHẤT</small><b>${done.length ? P(done[done.length - 1].p) : "—"}</b><em>${done.length ? esc(done[done.length - 1].s.name) : ""}</em></div>
        <div class="aw-st-kpi2"><small>SO VỚI BÀI TRƯỚC</small><b style="color:${diff == null ? "var(--st-ink)" : diff >= 0 ? "var(--st-good)" : "var(--st-bad)"}">${diff == null ? "—" : (diff >= 0 ? "▲ " : "▼ ") + Math.abs(Math.round(diff * 100))}</b><em>${prev ? esc(dispTitle(prev.title)) + " · " + dshort(prev.date) : ""}</em></div></div>
      <div class="aw-st-sec">PHÂN LOẠI</div><div class="aw-st-stack">${groups.map((g, i) => g.length ? `<div style="flex:${g.length};background:${BANDS[i][2]}">${g.length}</div>` : "").join("")}</div>
      <div class="aw-st-groups">${groups.map((g, i) => `<div class="aw-st-grp" style="background:${BANDS[i][3]}"><b>${BANDS[i][0]} · ${BANDS[i][1]} · ${g.length} em</b>${g.length ? g.map(r => esc(r.s.name)).join(", ") : "—"}</div>`).join("")}</div>
      <div class="aw-st-sec">TỪNG EM · CAO → THẤP</div><div class="aw-st-bars">`;
    done.concat(rows.filter(r => r.p == null)).forEach(r => {
      const l = r.p != null ? lab(r) : r.c.k === "abs" ? "vắng" : r.c.k === "pre" ? "chưa vào lớp" : "chưa làm";
      h += `<div class="aw-st-nm">${esc(r.s.name)}${r.s.guest ? ' <span class="aw-st-chip is-guest">tạm</span>' : ""}</div><div class="aw-st-track">${r.p != null ? `<div class="aw-st-fill" style="width:${r.p * 100}%;background:${BANDS[band(r.p)][2]}"></div>` : ""}${a != null ? `<div class="aw-st-avgline" style="left:${a * 100}%"></div>` : ""}<span class="aw-st-lab" style="${r.p == null ? "color:var(--st-faint);font-weight:600" : ""}">${l}</span></div>`;
    });
    h += `</div><div class="aw-st-note">Vạch đứt = trung bình lớp.${t.unmatched ? ` · ${t.unmatched} lượt nộp không nhận ra em nào trong lớp (không có mã, tên không khớp) — không tính.` : ""}</div>`;
    if (t.kind === "aw") h += `<div class="aw-st-sec">CÂU NHIỀU EM SAI NHẤT</div><div class="aw-st-qs" data-qs><div class="aw-st-note" style="margin:0">Đang đọc bài làm từng câu…</div></div>`;
    h += `</div>`;
    const { layer } = openLayer(h);
    if (t.kind === "aw") loadWrongQuestions(t, layer.querySelector("[data-qs]"));
  }
  // ⭐ Đợt 520 — a hand test with no total: only mistake counts, fewest first.
  function openEvalErrors(t) {
    const rows = peopleFor([t]).map(s => ({ s, c: cellOf(t, s) })).filter(r => r.c.k !== "na");
    const done = rows.filter(r => r.c.k === "n").sort((a, b) => a.c.v - b.c.v);
    const max = Math.max(1, ...done.map(r => r.c.v));
    const e = errAvg(t);
    const absN = rows.filter(r => r.c.k === "abs").length, noneN = rows.filter(r => r.c.k === "none").length, preN = rows.filter(r => r.c.k === "pre").length;
    let h = `<div class="aw-st-sheet" role="dialog" aria-modal="true" aria-label="Đánh giá bài">
      <div class="aw-st-shead"><span class="aw-st-chip is-hand">✎ Chấm tay · số lỗi</span><h3>${esc(dispTitle(t.title))}</h3><button type="button" class="aw-st-x" data-close aria-label="Đóng">${I.x}</button></div>
      <div class="aw-st-ssub">${wdOf(t.date)} ${dlong(t.date)} · bài không ghi tổng số câu ⇒ chỉ so số lỗi, không tính %</div>
      <div class="aw-st-kpis2">
        <div class="aw-st-kpi2"><small>ĐÃ LÀM</small><b>${done.length}/${rows.length - preN}</b><em>${absN} vắng · ${noneN} chưa làm</em></div>
        <div class="aw-st-kpi2"><small>TRUNG BÌNH</small><b>${e == null ? "—" : fmt1(e)}</b><em>lỗi mỗi em</em></div>
        <div class="aw-st-kpi2"><small>ÍT LỖI NHẤT</small><b>${done[0] ? done[0].c.v : "—"}</b><em>${done[0] ? esc(done[0].s.name) : ""}</em></div>
        <div class="aw-st-kpi2"><small>NHIỀU LỖI NHẤT</small><b>${done.length ? done[done.length - 1].c.v : "—"}</b><em>${done.length ? esc(done[done.length - 1].s.name) : ""}</em></div></div>
      <div class="aw-st-sec">TỪNG EM · ÍT LỖI → NHIỀU LỖI</div><div class="aw-st-bars">`;
    done.concat(rows.filter(r => r.c.k !== "n")).forEach(r => {
      const l = r.c.k === "n" ? `${r.c.v} lỗi` : r.c.k === "abs" ? "vắng" : r.c.k === "pre" ? "chưa vào lớp" : "chưa làm";
      h += `<div class="aw-st-nm">${esc(r.s.name)}${r.s.guest ? ' <span class="aw-st-chip is-guest">tạm</span>' : ""}</div><div class="aw-st-track">${r.c.k === "n" ? `<div class="aw-st-fill" style="width:${Math.max(2, r.c.v / max * 100)}%;background:#f5c56a"></div>` : ""}<span class="aw-st-lab" style="${r.c.k !== "n" ? "color:var(--st-faint);font-weight:600" : ""}">${l}</span></div>`;
    });
    h += `</div></div>`;
    openLayer(h);
  }
  async function loadWrongQuestions(t, box) {
    const ids = Object.values(t.values || {}).filter(v => v.k === "n" && v.id).map(v => v.id);
    if (!ids.length) { box.innerHTML = `<div class="aw-st-note" style="margin:0">Chưa có bài làm chi tiết.</div>`; return; }
    const stat = new Map(); let got = 0;
    await Promise.all(ids.map(async id => {
      try {
        const rev = await readResultReview(id);
        if (!rev) return; got++;
        rev.forEach(q => {
          const k = String(q.question || "").trim() || "(không có đề)";
          const s = stat.get(k) || { q: k, answer: q.correctText || "", wrong: 0, n: 0 };
          s.n++; if (!(q.answered && q.yourCorrect)) s.wrong++;
          stat.set(k, s);
        });
      } catch { /* one missing copy never blocks the rest */ }
    }));
    if (!box.isConnected) return;
    const top = [...stat.values()].filter(s => s.wrong > 0).sort((a, b) => b.wrong / b.n - a.wrong / a.n || b.wrong - a.wrong).slice(0, 8);
    box.innerHTML = top.length
      ? top.map((s, i) => `<div class="aw-st-q"><i>${i + 1}</i><span>${esc(s.q)}${s.answer ? ` <span style="color:var(--st-muted)">→ ${esc(s.answer)}</span>` : ""}</span><b>${s.wrong}/${s.n} em sai</b></div>`).join("") + `<div class="aw-st-note">Tính trên lượt tốt nhất của ${got} em.</div>`
      : `<div class="aw-st-note" style="margin:0">${got ? "Không câu nào có em sai. 🎉" : "Không đọc được bài làm chi tiết."}</div>`;
  }

  // ---- ANALYSE: pick days, then Showdown's own stacked chart
  let anSel = [];
  function openAnalysePicker() {
    anSel = [...new Set(testsIn(view).map(t => t.date))].sort().slice(-6);
    const { layer } = openLayer(`<div class="aw-st-sheet is-wide" role="dialog" aria-modal="true" aria-label="Analyse"></div>`);
    const sheet = layer.firstElementChild;
    const draw = () => {
      const days = allDays(); const byM = {};
      days.forEach(d => { (byM[d.slice(0, 7)] = byM[d.slice(0, 7)] || []).push(d); });
      let pick = `<div class="aw-st-quick"><button type="button" class="aw-st-btn is-sm" data-q="recent">30 ngày</button><button type="button" class="aw-st-btn is-sm" data-q="month">Tháng này</button><button type="button" class="aw-st-btn is-sm" data-q="none">Bỏ chọn</button></div>`;
      Object.keys(byM).sort().reverse().forEach(ym => {
        pick += `<h4>THÁNG ${+ym.slice(5)} / ${ym.slice(0, 4)}</h4>`;
        byM[ym].forEach(d => { const a = avgDay(d), nn = tests.filter(t => t.date === d).length;
          pick += `<label class="aw-st-dayrow"><input type="checkbox" data-anday="${d}" ${anSel.includes(d) ? "checked" : ""}><span>${wdOf(d)} ${dshort(d)}</span><span style="color:var(--st-faint);font-size:12px">${nn} bài</span><span class="aw-st-avg">${a == null ? "" : P(a)}</span></label>`; });
      });
      const chips = anSel.length ? anSel.map(d => `<span class="aw-st-selchip">${wdOf(d)} ${dshort(d)}/${d.slice(2, 4)}<button type="button" data-unsel="${d}" aria-label="Bỏ ngày ${dshort(d)}">×</button></span>`).join("") : `<span style="color:var(--st-faint)">Chọn ngày ở cột trái (tối đa ${MAX_ANALYSE_DAYS}).</span>`;
      sheet.innerHTML = `<div class="aw-st-shead"><h3>ANALYSE</h3><span class="aw-st-chip is-aw">${esc(cls.name)}</span><button type="button" class="aw-st-x" data-close aria-label="Đóng">${I.x}</button></div>
        <div class="aw-st-ssub">Chọn các ngày muốn so. Mỗi em là một cột, mỗi ngày là một khúc màu; chiều cao = % trung bình các ngày em có mặt (điểm một ngày = trung bình các bài trong ngày). Em thiếu ngày xếp sau vạch ngăn.</div>
        <div class="aw-st-an"><div class="aw-st-anpick">${pick}</div>
        <div class="aw-st-anright"><div class="aw-st-selchips">${chips}</div>
        <div><button type="button" class="aw-st-btn is-analyse" data-begin ${anSel.length ? "" : "disabled"}>${I.an}XEM BIỂU ĐỒ (${anSel.length} ngày)</button></div>
        <div class="aw-st-anhint">Biểu đồ mở toàn màn hình, có nút tải ảnh PNG như Analyse của Showdown.</div></div></div>`;
    };
    draw();
    sheet.addEventListener("change", e => {
      const cb = e.target.closest("[data-anday]"); if (!cb) return;
      const d = cb.dataset.anday;
      if (cb.checked) { if (anSel.length >= MAX_ANALYSE_DAYS) { cb.checked = false; toast(`Chọn tối đa ${MAX_ANALYSE_DAYS} ngày.`); return; } anSel.push(d); anSel.sort(); }
      else anSel = anSel.filter(x => x !== d);
      draw();
    });
    sheet.addEventListener("click", e => {
      const un = e.target.closest("[data-unsel]"), q = e.target.closest("[data-q]"), go = e.target.closest("[data-begin]");
      if (un) { anSel = anSel.filter(x => x !== un.dataset.unsel); draw(); }
      else if (q) {
        const k = q.dataset.q, days = allDays().slice().sort();
        anSel = k === "none" ? [] : k === "recent" ? days.filter(d => d >= cutoff()).slice(-MAX_ANALYSE_DAYS) : days.filter(d => d.startsWith(today().slice(0, 7))).slice(-MAX_ANALYSE_DAYS);
        draw();
      } else if (go && anSel.length) { closeLayers(); openAnalysisChart(anSel.slice()); }
    });
  }
  // Showdown's analysis data shape: entries = [{matchId,label,at,blocks:[{key,name,right,total}]}]
  // → buildAnalysisRows → the very same renderChart / PNG export. A day's % is
  // passed as right/total out of 1000 so pctOf() rounds it exactly like a match.
  function analysisEntries(days) {
    const people = allPeople();
    return days.slice().sort().map(d => ({
      // label = weekday + that day's tests; both the on-screen legend (dayOnly)
      // and the PNG legend append the date themselves.
      matchId: "d" + d, dayOnly: true, at: dayMs(d),
      label: (() => { const names = tests.filter(t => t.date === d).map(t => t.title).join(" + "); return `${wdOf(d)} · ${names.length > 42 ? names.slice(0, 41) + "…" : names}`; })(),
      blocks: people.map(s => ({ s, p: dayPct(d, s) })).filter(x => x.p != null)
        .map(x => ({ key: x.s.key, name: x.s.name, right: Math.round(x.p * 1000), total: 1000 }))
    }));
  }
  function openAnalysisChart(days) {
    const entries = analysisEntries(days);
    const { full, partial } = buildAnalysisRows(entries);
    const chart = document.createElement("div");
    chart.className = "aw-sd-rec-chart";
    const head = document.createElement("div"); head.className = "aw-sd-rec-head";
    const ttl = document.createElement("div"); ttl.className = "aw-sd-rec-title";
    const w = document.createElement("span"); w.className = "aw-sd-rec-word"; w.textContent = "ANALYSIS";
    const c = document.createElement("span"); c.className = "aw-sd-rec-class";
    const lo = days[0], hi = days[days.length - 1];
    c.textContent = `${cls.name} (${lo === hi ? dlong(lo) : dlong(lo) + " - " + dlong(hi)})`;
    ttl.append(w, c);
    let currentClassify = null;
    const classifyRow = document.createElement("div"); classifyRow.className = "aw-sd-rec-classifyrow";
    classifyRow.append(buildClassifyBar({ initial: DEFAULT_CLASSIFY, onApply: cf => { currentClassify = cf; applyClassifyToChart(chart, cf); } }));
    let closing = false;
    const onFs = () => { if (document.fullscreenElement !== chart && !closing) closeChart(); };
    function closeChart() {
      if (closing) return; closing = true;
      document.removeEventListener("fullscreenchange", onFs);
      chartClosers.delete(closeChart);
      if (document.fullscreenElement === chart) { try { document.exitFullscreen(); } catch { /* going anyway */ } }
      const an = chart.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, fill: "forwards" });
      whenDone(an, () => chart.remove(), 260);
    }
    chartClosers.add(closeChart);
    const dl = document.createElement("button"); dl.type = "button"; dl.className = "aw-sd-rec-close"; dl.title = "Download"; dl.innerHTML = icons.download;
    dl.onclick = () => import("./showdown-export.js").then(mod => mod.openAnalysisExportDialog({
      mount: chart, className: cls.name, at: dayMs(hi), full, partial, entries, classify: currentClassify, toast: toastOut
    }));
    const back = document.createElement("button"); back.type = "button"; back.className = "aw-sd-rec-close"; back.title = "Close"; back.innerHTML = icons.close;
    back.onclick = closeChart;
    head.append(ttl, dl, back);
    const body = document.createElement("div"); body.className = "aw-sd-rec-cbody";
    body.append(renderChart(full, partial, entries));
    chart.append(head, body, classifyRow);
    root.append(chart);
    fitPodiumNames(chart, ".aw-sd-rec-barname");
    fitChartTierLabels(chart);
    watchChartResize(chart);
    document.addEventListener("fullscreenchange", onFs);
    Promise.resolve().then(() => chart.requestFullscreen?.())
      .then(() => { fitPodiumNames(chart, ".aw-sd-rec-barname"); fitChartTierLabels(chart); })
      .catch(e => console.warn("AWord STATS: fullscreen refused, showing the analysis inline", e));
  }
  const chartClosers = new Set();

  // ---- ✎ hand-marked test: add / edit / delete
  // ⭐ Đợt 520 (mockup stats-v5.html) — a FIXED HORIZONTAL NUMPAD instead of
  // tap/swipe pads. Each pupil's cell starts EMPTY ("" = not entered yet); the
  // highlighted pupil takes the digits; a value that cannot take one more digit
  // (total 20: "3" → 30 > 20) moves to the next pupil by itself, otherwise
  // TIẾP / Enter. With no total the cap is 99 (2 digits). Save is REFUSED while
  // any cell is empty (thầy). Keyboard: 0–9 ⌫ V (vắng) C (chưa làm) Enter
  // ←/→ ↑/↓ — ignored while typing in a text box.
  function openPads(editId, presetDate) {
    const ed = editId ? tests.find(t => t.id === editId) : null;
    let total = ed && ed.total > 0 ? ed.total : 0;
    const roster = cls.students;
    const st = {};
    roster.forEach(s => { const c = ed && ed.values[s.key]; st[s.key] = c && (c.k === "n" || c.k === "abs" || c.k === "none") ? { k: c.k, v: c.v } : { k: ed ? "none" : "" }; });
    let tmp = ed ? Object.keys(ed.values).filter(k => k.startsWith("g:")).map(k => ({ key: k, gid: k.slice(2), name: guests[k.slice(2)]?.name || ed.values[k].name || "?", note: guests[k.slice(2)]?.note || "" })) : [];
    tmp.forEach(g => { const c = ed.values[g.key]; st[g.key] = { k: c.k, v: c.v }; });
    const d0 = ed ? ed.date : (presetDate || today());
    let cur = 0, buf = "", typing = false, titleTouched = !!ed, addOpen = false;
    const miss = new Set();
    const KEYS = `${[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(n => `<button type="button" class="aw-st-key" data-k="${n}">${n}</button>`).join("")}
      <button type="button" class="aw-st-key" data-k="bs" title="Xoá số" aria-label="Xoá số">${I.bs}</button><span class="aw-st-kgap"></span>
      <button type="button" class="aw-st-key is-t is-abs" data-k="abs">VẮNG</button><button type="button" class="aw-st-key is-t" data-k="none">CHƯA LÀM</button><span class="aw-st-kgap"></span>
      <button type="button" class="aw-st-key" data-k="prev" title="Em trước" aria-label="Em trước">${I.left}</button><button type="button" class="aw-st-key is-go" data-k="next">TIẾP${I.right}</button>`;
    const { layer, close } = openLayer(`<form class="aw-st-sheet aw-st-entry" novalidate role="dialog" aria-modal="true">
      <div class="aw-st-shead"><span class="aw-st-chip is-hand">✎ Chấm tay</span><h3>${ed ? "Sửa bài " + esc(dispTitle(ed.title)) : "Thêm bài chấm tay"} · ${esc(cls.name)}</h3><button type="button" class="aw-st-x" data-close aria-label="Đóng">${I.x}</button></div>
      <div class="aw-st-frow">
        <label>NGÀY<span class="aw-st-dateline"><input type="text" data-f="date" inputmode="numeric" value="${dlong(d0)}" placeholder="21/12/2026" maxlength="10"><button type="button" class="aw-st-btn is-sm" data-f="today">Hôm nay</button></span></label>
        <label>TÊN BÀI <span class="aw-st-lhint">— lấy từ thẻ bài của lớp trên dashboard, sửa được</span>
          <span class="aw-st-cards" data-f="cards"><span class="aw-st-lcnone">Đang đọc thẻ bài…</span></span>
          <span class="aw-st-titlein"><input type="text" data-f="title" value="${ed ? esc(ed.title) : ""}" placeholder="Gõ tên bài…"><span class="aw-st-ttag" data-f="tag" hidden></span></span></label>
        <label>TỔNG SỐ CÂU <span class="aw-st-lhint">(không bắt buộc)</span><input type="number" data-f="total" min="1" inputmode="numeric" value="${total || ""}" placeholder="để trống"><span class="aw-st-nopct" data-f="nopct">Không có tổng ⇒ chỉ ghi số lỗi, không tính %</span></label>
      </div>
      <div class="aw-st-prog"><span><b data-f="done">0</b>/<span data-f="all">0</span> đã nhập</span><span class="aw-st-pbar"><i data-f="pbar"></i></span><span class="aw-st-pnow" data-f="now"></span><span class="aw-st-sp"></span><button type="button" class="aw-st-btn is-sm" data-f="fill0">Ô còn trống = 0 lỗi</button></div>
      <div class="aw-st-egrid" data-f="grid"></div>
      <div class="aw-st-pad">
        <div class="aw-st-keys" data-f="keys">${KEYS}</div>
        <div class="aw-st-pfoot"><span class="aw-st-khelp">Bàn phím máy: <kbd>0–9</kbd> <kbd>⌫</kbd> <kbd>V</kbd> vắng <kbd>C</kbd> chưa làm <kbd>Enter</kbd> tiếp <kbd>←↑↓→</kbd> đổi em</span><span class="aw-st-sp"></span><span class="aw-st-err"></span>
          ${ed ? `<button type="button" class="aw-st-btn is-danger" data-f="del">Xoá bài</button>` : ""}<button type="button" class="aw-st-btn" data-close>Huỷ</button><button type="submit" class="aw-st-btn is-primary" data-f="save">Lưu</button></div>
      </div></form>`, { keepOnBackdrop: true, onClose: () => document.removeEventListener("keydown", onKey, true) });
    const form = layer.querySelector("form"), err = form.querySelector(".aw-st-err");
    const f = k => form.querySelector(`[data-f="${k}"]`);
    const grid = f("grid");
    const everyone = () => roster.map(s => ({ key: s.key, name: s.name })).concat(tmp.map(g => ({ ...g, guest: true })));
    const cap = () => total || 99;

    // ---- the grid
    function valOf(p, i) {
      const c = st[p.key], on = i === cur;
      if (on && typing) return { cls: "is-typing", txt: esc(buf), bg: "#fff" };
      if (c.k === "n") { const pp = total ? Math.max(0, (total - c.v) / total) : null; return { cls: pp == null ? "is-err" : "b" + (band(pp) + 1), txt: c.v }; }
      if (c.k === "abs") return { cls: "is-abs", txt: "VẮNG" };
      if (c.k === "none") return { cls: "is-none", txt: "CHƯA<br>LÀM" };
      return { cls: on ? "is-typing" : "is-empty", txt: on ? "" : "·" };
    }
    function drawGrid() {
      const ps = everyone();
      if (cur > ps.length - 1) cur = Math.max(0, ps.length - 1);
      grid.innerHTML = ps.map((p, i) => { const v = valOf(p, i), c = st[p.key];
        const small = p.guest ? `<small class="is-guest">tạm${p.note ? " · " + esc(p.note) : ""}</small>` : c.k === "n" ? `<small>${total ? `đúng ${Math.max(0, total - c.v)}/${total}` : `${c.v} lỗi`}</small>` : "";
        return `<div class="aw-st-ec ${i === cur ? "is-on" : ""} ${p.guest ? "is-guest" : ""} ${miss.has(p.key) && !c.k ? "is-miss" : ""}" data-i="${i}">
          <span class="aw-st-ecn"><b>${esc(p.name)}</b>${small}</span><span class="aw-st-ecv ${v.cls}">${v.txt}</span>
          ${p.guest ? `<button type="button" class="aw-st-ecrm" data-rm="${esc(p.key)}" aria-label="Bỏ ${esc(p.name)}">×</button>` : ""}</div>`; }).join("") + addHTML();
      const done = ps.filter(p => st[p.key].k).length;
      f("done").textContent = done; f("all").textContent = ps.length; f("pbar").style.width = (ps.length ? done / ps.length * 100 : 0) + "%";
      f("now").innerHTML = ps[cur] ? `Đang nhập: <b>${esc(ps[cur].name)}</b>` : "";
      f("nopct").hidden = !!total;
      grid.querySelector(".aw-st-ec.is-on")?.scrollIntoView({ block: "nearest" });
      if (addOpen) grid.querySelector("[data-gname]")?.focus();
    }
    const known = () => Object.entries(guests).filter(([gid]) => !tmp.some(g => g.gid === gid));
    const addHTML = () => addOpen
      ? `<div class="aw-st-eadd is-open"><input type="text" data-gname placeholder="Tên người tạm"><input type="text" data-gnote placeholder="Ghi chú: học thử, lớp khác…"><span class="aw-st-eaddb"><button type="button" class="aw-st-btn is-sm" data-gno>Huỷ</button><button type="button" class="aw-st-btn is-sm is-primary" data-gok>Thêm</button></span></div>`
      : `<div class="aw-st-eadd"><button type="button" class="aw-st-eaddbtn" data-addg>${I.person}Thêm người</button>${known().length ? `<span class="aw-st-eaddre">${known().map(([gid, g]) => `<button type="button" data-reg="${esc(gid)}">${esc(g.name)}</button>`).join("")}</span>` : `<small>học thử, học bù… chỉ tính trong bài này</small>`}</div>`;

    // ---- typing
    function commit() {
      const p = everyone()[cur];
      if (typing && buf !== "" && p) { st[p.key] = { k: "n", v: Math.min(cap(), +buf) }; miss.delete(p.key); }
      typing = false; buf = "";
    }
    function go(d) { commit(); cur = Math.max(0, Math.min(everyone().length - 1, cur + d)); err.textContent = ""; drawGrid(); }
    function press(k) {
      const ps = everyone(), p = ps[cur]; if (!p) return;
      if (/^\d$/.test(k)) {
        if (!typing) { typing = true; buf = ""; }
        buf = (buf === "0" ? "" : buf) + k;
        if (+buf > cap()) buf = k;                        // over the total ⇒ start again with this digit
        if (+buf * 10 > cap()) { commit(); cur = Math.min(ps.length - 1, cur + 1); }
      } else if (k === "bs") {
        if (typing && buf) buf = buf.slice(0, -1);
        else { st[p.key] = { k: "" }; typing = true; buf = ""; }
      } else if (k === "abs" || k === "none") {
        typing = false; buf = ""; st[p.key] = { k }; miss.delete(p.key); cur = Math.min(ps.length - 1, cur + 1);
      } else if (k === "next") { go(1); return; }
      else if (k === "prev") { go(-1); return; }
      err.textContent = "";
      drawGrid();
    }
    const flash = k => { const b = form.querySelector(`.aw-st-key[data-k="${k}"]`); if (b) { b.classList.add("is-hit"); setTimeout(() => b.classList.remove("is-hit"), 110); } };
    // pointerdown (not click): the key must never steal focus from nothing / fire twice on touch
    f("keys").addEventListener("pointerdown", e => { const b = e.target.closest("[data-k]"); if (!b || e.button > 0) return; e.preventDefault(); press(b.dataset.k); });
    function onKey(e) {
      if (!layer.isConnected || e.isComposing) return;
      if (e.target.matches?.("input, textarea, select")) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const cols = Math.max(1, getComputedStyle(grid).gridTemplateColumns.split(" ").length);
      const map = { Backspace: "bs", Enter: "next", ArrowRight: "next", ArrowLeft: "prev", v: "abs", V: "abs", c: "none", C: "none" };
      if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); go(e.key === "ArrowDown" ? cols : -cols); return; }
      const k = /^\d$/.test(e.key) ? e.key : map[e.key];
      if (!k) return;
      e.preventDefault(); flash(k); press(k);
    }
    document.addEventListener("keydown", onKey, true);

    grid.addEventListener("click", e => {
      const rm = e.target.closest("[data-rm]"), addg = e.target.closest("[data-addg]"), reg = e.target.closest("[data-reg]"),
        gok = e.target.closest("[data-gok]"), gno = e.target.closest("[data-gno]"), cell = e.target.closest(".aw-st-ec");
      if (rm) { commit(); tmp = tmp.filter(g => g.key !== rm.dataset.rm); delete st[rm.dataset.rm]; drawGrid(); }
      else if (addg) { commit(); addOpen = true; drawGrid(); }
      else if (gno) { addOpen = false; drawGrid(); }
      else if (gok) addGuest();
      else if (reg) { commit(); const gid = reg.dataset.reg, g = guests[gid]; tmp.push({ key: "g:" + gid, gid, name: g.name, note: g.note || "" }); st["g:" + gid] = { k: "" }; cur = everyone().length - 1; drawGrid(); }
      else if (cell) { commit(); cur = +cell.dataset.i; drawGrid(); }
    });
    grid.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.matches("[data-gname],[data-gnote]")) { e.preventDefault(); addGuest(); } });
    function addGuest() {
      const ni = grid.querySelector("[data-gname]");
      const name = ni.value.trim().toUpperCase(); if (!name) { ni.classList.add("is-bad"); ni.focus(); return; }
      const gid = "g" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
      tmp.push({ key: "g:" + gid, gid, name, note: grid.querySelector("[data-gnote]").value.trim(), fresh: true });
      st["g:" + gid] = { k: "" }; addOpen = false; cur = everyone().length - 1; drawGrid();
    }
    f("fill0").onclick = () => { commit(); everyone().forEach(p => { if (!st[p.key].k) { st[p.key] = { k: "n", v: 0 }; miss.delete(p.key); } }); err.textContent = ""; drawGrid(); };

    // ---- lesson cards → title
    const fd = f("date"), ft = f("title"), tag = f("tag"), cardsBox = f("cards");
    let cards = [];
    const setTag = (txt, sua) => { tag.hidden = !txt; tag.textContent = txt || ""; tag.classList.toggle("is-sua", !!sua); };
    function drawCards() {
      const date = parseDMY(fd.value);
      if (!date) { cardsBox.innerHTML = `<span class="aw-st-lcnone">Gõ ngày để xem thẻ bài.</span>`; return; }
      const { same, list } = cardsForDay(cards, date);
      if (!list.length) { cardsBox.innerHTML = `<span class="aw-st-lcnone">Lớp này chưa có thẻ bài trên dashboard — gõ tên bài.</span>`; return; }
      cardsBox.innerHTML = (same ? "" : `<span class="aw-st-lcnone">Ngày ${dshort(date)} chưa có thẻ bài — gần nhất:</span>`) +
        list.map((c, i) => { const ttl = lessonCardTitle(c), dang = ttl.split(" / ")[1] || "";
          return `<button type="button" class="aw-st-lc ${ft.value.trim() === ttl ? "is-on" : ""}" data-card="${esc(ttl)}"><span class="aw-st-lcd is-${esc(dang)}">${esc(dang || "—")}</span>${esc(c.ma)}${same ? "" : `<span class="aw-st-lcday">${dshort(c.date)}</span>`}</button>`; }).join("");
      if (same && !titleTouched) { ft.value = lessonCardTitle(list[0]); setTag("TỪ THẺ BÀI"); cardsBox.querySelector(".aw-st-lc")?.classList.add("is-on"); }
    }
    cardsBox.addEventListener("click", e => { const b = e.target.closest("[data-card]"); if (!b) return;
      ft.value = b.dataset.card; titleTouched = false; setTag("TỪ THẺ BÀI");
      cardsBox.querySelectorAll(".aw-st-lc").forEach(x => x.classList.toggle("is-on", x === b)); });
    ft.addEventListener("input", () => { titleTouched = true; setTag(ft.value.trim() ? "ĐÃ SỬA" : "", true); cardsBox.querySelectorAll(".aw-st-lc").forEach(x => x.classList.remove("is-on")); });
    loadLessonCards(cls.id).then(c => { cards = c; if (layer.isConnected) drawCards(); });

    // ---- date / total
    // Keep what thầy types (digits + "/"), so "22/9/2026" works as typed; only
    // ADD the slash after a full 2-digit day / month (never re-slice the digits —
    // a 1-digit month would be torn apart: "2292026" → "22/92/026").
    fd.addEventListener("input", e => {
      let v = fd.value.replace(/[^\d/]/g, "").replace(/\/{2,}/g, "/");
      if (e.inputType === "insertText" && (/^\d{2}$/.test(v) || /^\d{1,2}\/\d{2}$/.test(v))) v += "/";
      fd.value = v.slice(0, 10); fd.classList.remove("is-bad");
      if (parseDMY(fd.value)) drawCards();
    });
    f("today").onclick = () => { fd.value = dlong(today()); fd.classList.remove("is-bad"); drawCards(); };
    f("total").addEventListener("input", () => {
      const tt = Math.floor(+f("total").value);
      total = tt > 0 ? tt : 0;
      if (total) everyone().forEach(p => { if (st[p.key].k === "n" && st[p.key].v > total) st[p.key].v = total; });
      drawGrid();
    });
    if (ed) f("del").onclick = async () => {
      if (f("del").dataset.sure !== "1") { f("del").dataset.sure = "1"; f("del").textContent = "Bấm lần nữa để xoá"; return; }
      try { await removeTest(cls.id, ed.date.slice(0, 7), ed.id); tests = tests.filter(t => t.id !== ed.id); close(); paint(); toast("Đã xoá bài " + dispTitle(ed.title) + "."); }
      catch (e2) { err.textContent = "Chưa xoá được: " + (e2.message || e2); }
    };
    form.addEventListener("submit", async ev => {
      ev.preventDefault();
      commit();
      const date = parseDMY(fd.value);
      if (!date) { fd.classList.add("is-bad"); err.textContent = "Ngày chưa đúng. Gõ theo dạng 21/12/2026."; drawGrid(); return; }
      const empty = everyone().filter(p => !st[p.key].k);
      if (empty.length) {     // thầy: còn ô trống thì KHÔNG cho lưu
        empty.forEach(p => miss.add(p.key));
        cur = everyone().findIndex(p => p.key === empty[0].key);
        drawGrid(); err.textContent = `Chưa lưu: còn ${empty.length} em chưa nhập (viền đỏ).`; return;
      }
      const title = ft.value.trim() || "(chưa ghi tên bài)";
      const values = {};
      roster.forEach(s => { values[s.key] = { ...st[s.key], name: s.name }; if (values[s.key].v == null) delete values[s.key].v; });
      const newGuests = {};
      tmp.forEach(g => { values[g.key] = { ...st[g.key], name: g.name }; if (values[g.key].v == null) delete values[g.key].v; newGuests[g.gid] = { name: g.name, note: g.note || "" }; });
      const test = { id: ed ? ed.id : "h" + Date.now().toString(36), kind: "hand", date, title, sub: "", total, values, createdAt: ed ? (ed.createdAt || Date.now()) : Date.now(), updatedAt: Date.now() };
      f("save").disabled = true; err.textContent = "Đang lưu…";
      try {
        if (ed && ed.date.slice(0, 7) !== date.slice(0, 7)) await removeTest(cls.id, ed.date.slice(0, 7), ed.id);
        await writeTest(cls.id, test, newGuests);
      } catch (e2) { f("save").disabled = false; err.textContent = "Chưa lưu được: " + (e2.message || e2); return; }
      Object.assign(guests, newGuests);
      tests = tests.filter(t => t.id !== test.id).concat(test);
      openY[date.slice(0, 4)] = true; openM[date.slice(0, 7)] = true;
      view = date >= cutoff() && view.type === "recent" ? view : { type: "day", date };
      close(); paint(); toast((ed ? "Đã sửa bài ngày " : "Đã lưu bài ngày ") + dlong(date) + ".");
    });
    if (ed) setTag("ĐÃ SỬA", true);
    drawGrid();
  }

  // ---- Excel: one sheet per month (raw cells, like thầy's own files) + one % sheet
  async function exportXlsx() {
    if (!tests.length) { toast("Lớp này chưa có bài nào để xuất."); return; }
    let XLSX;
    try { XLSX = await import("./vendor/xlsx.mjs"); } catch (e) { toast("Không tải được bộ xuất Excel."); return; }
    const wb = XLSX.utils.book_new();
    const cellTxt = c => c.k === "n" ? c.v : c.k === "abs" ? "V" : c.k === "pre" ? "" : c.k === "na" ? "" : "—";
    const sheetFor = list => {
      const people = peopleFor(list);
      const aoa = [
        [cls.name, ...list.map(t => `${dshort(t.date)}/${t.date.slice(0, 4)}`)],
        ["", ...list.map(t => (t.kind === "aw" ? "AWord · " : "Chấm tay · ") + dispTitle(t.title))],
        ["HỌC SINH", ...list.map(t => t.kind === "aw" ? `điểm /${t.total}` : noTotal(t) ? "số lỗi" : `số lỗi / ${t.total} câu`)]
      ];
      people.forEach(s => aoa.push([s.name + (s.guest ? " (tạm)" : s.left ? " (đã rời lớp)" : ""), ...list.map(t => cellTxt(cellOf(t, s)))]));
      aoa.push(["TB LỚP (%)", ...list.map(t => { if (noTotal(t)) { const e = errAvg(t); return e == null ? "" : "TB " + fmt1(e) + " lỗi"; } const a = avgTest(t); return a == null ? "" : Math.round(a * 100); })]);
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      ws["!cols"] = [{ wch: 22 }, ...list.map(() => ({ wch: 14 }))];
      return ws;
    };
    const months = [...new Set(tests.map(t => t.date.slice(0, 7)))].sort().reverse();
    months.forEach(ym => {
      const list = tests.filter(t => t.date.slice(0, 7) === ym).sort((a, b) => b.date.localeCompare(a.date) || (a.createdAt || 0) - (b.createdAt || 0));
      XLSX.utils.book_append_sheet(wb, sheetFor(list), `${+ym.slice(5)}-${ym.slice(0, 4)}`);
    });
    const all = tests.slice().sort((a, b) => b.date.localeCompare(a.date));
    const people = peopleFor(all);
    const aoa = [["% ĐÚNG", ...all.map(t => `${dshort(t.date)}/${t.date.slice(0, 4)} ${dispTitle(t.title)}`)]];
    people.forEach(s => aoa.push([s.name, ...all.map(t => { const p = pct(t, cellOf(t, s)); return p == null ? "" : Math.round(p * 100); })]));
    const ws = XLSX.utils.aoa_to_sheet(aoa); ws["!cols"] = [{ wch: 22 }, ...all.map(() => ({ wch: 14 }))];
    XLSX.utils.book_append_sheet(wb, ws, "TONG HOP %");
    XLSX.writeFile(wb, `STATS ${cls.id} ${dlong(today()).replace(/\//g, "-")}.xlsx`);
  }

  // ---------------------------------------------------------------- events
  root.addEventListener("click", e => {
    const t = e.target;
    const b = k => t.closest(`[data-st="${k}"]`);
    if (b("raw") || b("pct")) {
      mode = b("raw") ? "raw" : "pct";
      root.querySelector('[data-st="raw"]').setAttribute("aria-pressed", mode === "raw");
      root.querySelector('[data-st="pct"]').setAttribute("aria-pressed", mode === "pct");
      if (cls) paintMain(); return;
    }
    if (b("home")) { opts.onHome?.(); return; }
    if (b("xls")) { exportXlsx(); return; }
    if (!cls) return;
    if (b("analyse")) { if (!tests.length) toast("Chưa có bài nào để phân tích."); else openAnalysePicker(); return; }
    if (b("add")) { openPads(null, view.type === "day" ? view.date : null); return; }
    if (b("sort")) { sortBy = sortBy === "avg" ? "name" : "avg"; paintMain(); return; }
    if (b("dclose")) { closeRow(); return; }
    const vr = t.closest("[data-view]"), yr = t.closest("[data-year]"), ym = t.closest("[data-ym]"), dy = t.closest("[data-day]"),
      ch = t.closest("[data-chart]"), ed = t.closest("[data-edit]"), row = t.closest("[data-row]");
    if (vr) { view = { type: "recent" }; paint(); }
    else if (ch) openEval(ch.dataset.chart);
    else if (ed) openPads(ed.dataset.edit);
    else if (yr) { const y = yr.dataset.year; openY[y] = !openY[y]; paintTree(); }
    else if (ym) { const k = ym.dataset.ym; const isSel = view.type === "month" && view.ym === k; openM[k] = isSel ? !openM[k] : true; view = { type: "month", ym: k }; paint(); }
    else if (dy) { view = { type: "day", date: dy.dataset.day }; paint(); }
    else if (row) openRow(row.dataset.row);
  });
  // Esc closes the pupil panel (only when no popup is open — the popups own Esc then)
  const onPageKey = e => { if (e.key === "Escape" && selKey && !layers.size && !document.querySelector(".aw-modal, .aw-sd-rec-chart")) closeRow(); };
  document.addEventListener("keydown", onPageKey);
  $sel.addEventListener("change", () => {
    cls = classes.find(c => c.id === $sel.value) || cls;
    view = { type: "recent" }; openY = {}; openM = {};
    loadClass();
  });

  start();

  function dispose() {
    alive = false;
    document.removeEventListener("keydown", onPageKey);
    closeLayers();
    [...chartClosers].forEach(f => f());
    document.querySelectorAll(".aw-st-toast").forEach(n => n.remove());
  }
  return { dispose };
}

// ---------------------------------------------------------------- css + icons
function ensureCss() {
  if (document.querySelector("link[data-aw-stats-css]")) return;
  const l = document.createElement("link");
  l.rel = "stylesheet"; l.href = new URL("./stats.css", import.meta.url).href; l.dataset.awStatsCss = "1";
  document.head.append(l);
}
const sv = (d, extra = "") => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;
const I = {
  folder: sv('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'),
  cal: sv('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
  clock: sv('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  car: sv('<path d="m9 6 6 6-6 6"/>', 'class="aw-st-car"'),
  chart: sv('<path d="M4 20h16M7 16v-5M12 16V6M17 16v-8"/>'),
  pen: sv('<path d="M4 20h4L19 9l-4-4L4 16z"/>'),
  plus: sv('<path d="M12 5v14M5 12h14"/>'),
  person: sv('<circle cx="10" cy="8" r="4"/><path d="M3 21c0-4 3-6 7-6s7 2 7 6M19 8v6M16 11h6"/>'),
  x: sv('<path d="M6 6l12 12M18 6 6 18"/>'),
  an: sv('<path d="M4 20V10M9 20V4M14 20v-7M19 20V8"/>'),
  chev: sv('<path d="m6 9 6 6 6-6"/>', 'class="aw-st-chev"'),
  bs: sv('<path d="M9 5h11v14H9l-6-7z"/><path d="m12.5 9.5 5 5m0-5-5 5"/>'),
  left: sv('<path d="m15 6-6 6 6 6"/>'),
  right: sv('<path d="m9 6 6 6-6 6"/>')
};
