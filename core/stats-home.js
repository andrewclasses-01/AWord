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
import { listAllAssignments, listScores, classTokenOf, readResultReview } from "./assignments.js";
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

  // ---------------------------------------------------------------- skeleton
  root.innerHTML = `
    <div class="aw-st-bar">
      <div class="aw-st-title">${icons.barChart || ""}STATS</div>
      <div class="aw-st-pick"><select aria-label="Chọn lớp" data-st="class"><option>…</option></select></div>
      <div class="aw-st-seg" role="group" aria-label="Cách hiện ô">
        <button type="button" data-st="raw" aria-pressed="true">Số gốc</button><button type="button" data-st="pct" aria-pressed="false">%</button>
      </div>
      <button type="button" class="aw-st-btn" data-st="xls">${icons.download || ""}Xuất Excel</button>
    </div>
    <div class="aw-st-layout">
      <nav class="aw-st-panel aw-st-tree" aria-label="Các buổi theo ngày"></nav>
      <section class="aw-st-panel aw-st-main"><div class="aw-st-loading">Đang tải danh sách lớp…</div></section>
    </div>`;
  const $tree = root.querySelector(".aw-st-tree"), $main = root.querySelector(".aw-st-main"), $sel = root.querySelector('[data-st="class"]');

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
    tests = []; guests = {};
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
      try { rows = await listScores(a.code); } catch (e) { console.warn("AWord STATS: scores", a.code, e); continue; }
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

  // ---------------------------------------------------------------- tree
  function paintTree() {
    const days = allDays(); const Y = {};
    days.forEach(d => { const y = d.slice(0, 4), ym = d.slice(0, 7); (Y[y] = Y[y] || {}); (Y[y][ym] = Y[y][ym] || []).push(d); });
    const nRecent = new Set(testsIn({ type: "recent" }).map(t => t.date)).size;
    let h = `<button type="button" class="aw-st-node is-recent ${view.type === "recent" ? "is-sel" : ""}" data-view="recent">${I.clock}30 ngày gần nhất<span class="aw-st-cnt">${nRecent} ngày</span></button><div class="aw-st-sep"></div><h3>LƯU TRỮ</h3>`;
    if (!days.length) h += `<div class="aw-st-treeempty">Chưa có bài nào.</div>`;
    Object.keys(Y).sort().reverse().forEach(y => {
      const n = Object.values(Y[y]).reduce((a, b) => a + b.length, 0);
      h += `<div class="${openY[y] ? "aw-st-open" : ""}"><button type="button" class="aw-st-node" data-year="${y}" aria-expanded="${!!openY[y]}">${I.car}${I.folder}${y}<span class="aw-st-cnt">${n}</span></button><div class="aw-st-kids">`;
      Object.keys(Y[y]).sort().reverse().forEach(ym => {
        h += `<div class="${openM[ym] ? "aw-st-open" : ""}"><button type="button" class="aw-st-node ${view.type === "month" && view.ym === ym ? "is-sel" : ""}" data-ym="${ym}" aria-expanded="${!!openM[ym]}">${I.car}${I.cal}Tháng ${+ym.slice(5)}<span class="aw-st-cnt">${Y[y][ym].length}</span></button><div class="aw-st-kids">`;
        Y[y][ym].forEach(d => {
          const its = tests.filter(t => t.date === d);
          h += `<button type="button" class="aw-st-node is-day ${view.type === "day" && view.date === d ? "is-sel" : ""}" data-day="${d}"><span class="aw-st-wd">${wdOf(d)}</span>${dshort(d)}<span class="aw-st-dots">${its.map(t => `<i class="aw-st-dot is-${t.kind}"></i>`).join("")}</span></button>`;
        });
        h += `</div></div>`;
      });
      h += `</div></div>`;
    });
    $tree.innerHTML = h;
  }

  // ---------------------------------------------------------------- main table
  function paintMain() {
    const list = testsIn(view);
    const title = view.type === "recent" ? "30 ngày gần nhất" : view.type === "month" ? `Tháng ${+view.ym.slice(5)} / ${view.ym.slice(0, 4)}` : `${wdOf(view.date)} · ${dlong(view.date)}`;
    const days = [...new Set(list.map(t => t.date))];
    const who = peopleFor(list);
    const nAw = list.filter(t => t.kind === "aw").length;
    let h = `<div class="aw-st-mhead"><h2>${title}</h2>
      <button type="button" class="aw-st-btn is-analyse" data-st="analyse">${I.an}ANALYSE</button>
      <button type="button" class="aw-st-btn is-hand" data-st="add">${I.plus}Thêm bài chấm tay</button></div>
      <div class="aw-st-msub"><span>Lớp <b>${esc(cls.name)}</b> · <b>${cls.students.length}</b> học sinh</span><span><b>${days.length}</b> ngày · <b>${list.length}</b> bài (${nAw} AWord · ${list.length - nAw} chấm tay)</span></div>
      <div class="aw-st-legend"><span class="aw-st-chip is-aw">AWord · điểm</span><span class="aw-st-chip is-hand">✎ Chấm tay · số lỗi</span>
      <span><i class="aw-st-sw" style="background:var(--st-h-great)"></i>≥ 85%</span><span><i class="aw-st-sw" style="background:var(--st-h-good)"></i>70–84%</span><span><i class="aw-st-sw" style="background:var(--st-h-mid)"></i>50–69%</span><span><i class="aw-st-sw" style="background:var(--st-h-low)"></i>&lt; 50%</span><span>— chưa làm · <b style="color:var(--st-bad)">V</b> vắng</span></div>`;
    if (!list.length) {
      $main.innerHTML = h + `<div class="aw-st-empty">Chưa có bài nào trong khoảng này.<br>Bài giao AWord của lớp (tên bắt đầu bằng <b>${esc(cls.id)}_</b>, từ 22/9/2026) sẽ tự hiện ở đây.</div>`;
      return;
    }
    h += `<div class="aw-st-tablewrap"><table><thead><tr><th class="aw-st-namecol" rowspan="2">HỌC SINH</th>`;
    days.forEach(d => { const n = list.filter(t => t.date === d).length;
      h += `<th class="aw-st-dayh aw-st-g0" colspan="${n}"><span class="aw-st-dd">${dshort(d)}<span class="aw-st-yy">/${d.slice(0, 4)}</span></span><span class="aw-st-wd2">${wdOf(d)}</span><span class="aw-st-nb">${n} bài</span></th>`; });
    h += `</tr><tr>`;
    list.forEach((t, i) => { const g0 = i === 0 || list[i - 1].date !== t.date;
      h += `<th class="aw-st-bh ${g0 ? "aw-st-g0" : ""}"><div class="aw-st-colhead is-${t.kind}"><span class="aw-st-k">${t.kind === "aw" ? "AWORD" : "CHẤM TAY"}</span>
        <span class="aw-st-t" title="${esc(t.fullTitle || t.title)}">${esc(t.title)}</span>${t.sub ? `<span class="aw-st-t2">${esc(t.sub)}</span>` : ""}
        <span class="aw-st-n">${t.kind === "aw" ? "/" + t.total + " điểm" : t.total + " câu"}</span>
        <div class="aw-st-hbtns"><button type="button" class="aw-st-ibtn is-chart" data-chart="${esc(t.id)}" title="Đánh giá bài này">${I.chart}Đánh giá</button>${t.kind === "hand" ? `<button type="button" class="aw-st-ibtn" data-edit="${esc(t.id)}" title="Sửa bài" aria-label="Sửa bài">${I.pen}</button>` : ""}</div></div></th>`; });
    h += `</tr></thead><tbody>`;
    who.forEach(s => {
      const tag = s.guest ? `<small class="is-guest">tạm${s.note ? " · " + esc(s.note) : ""}</small>` : s.left ? `<small>không còn trong lớp</small>` : s.vao && s.vao >= (list[list.length - 1]?.date || "") ? `<small>vào lớp ${dlong(s.vao)}</small>` : "";
      h += `<tr class="${s.guest ? "is-guest" : s.left ? "is-left" : ""}"><th class="aw-st-namecol"><button type="button" class="aw-st-rowbtn" data-row="${esc(s.key)}">${esc(s.name)}${tag}</button></th>`;
      list.forEach((t, i) => { const g0 = i === 0 || list[i - 1].date !== t.date; const c = cellOf(t, s), p = pct(t, c);
        const inner = c.k === "n" ? `<span style="background:${heat(p)}">${mode === "raw" ? c.v : P(p)}</span>`
          : c.k === "abs" ? `<span class="is-abs" style="background:var(--st-h-none)">V</span>`
          : c.k === "pre" ? `<span class="is-pre" title="Chưa vào lớp">·</span>`
          : c.k === "na" ? `<span class="is-na">·</span>`
          : `<span class="is-none" style="background:var(--st-h-none)">—</span>`;
        h += `<td class="aw-st-v ${g0 ? "aw-st-g0" : ""}">${inner}</td>`; });
      h += `</tr>`;
    });
    h += `</tbody><tfoot><tr><td class="aw-st-namecol">TB LỚP</td>${list.map((t, i) => { const a = avgTest(t); return `<td class="${i === 0 || list[i - 1].date !== t.date ? "aw-st-g0" : ""}">${a == null ? "—" : P(a)}</td>`; }).join("")}</tr></tfoot></table></div>`;
    $main.innerHTML = h;
  }
  function paint() { if (!alive) return; paintTree(); paintMain(); }

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
      <div class="aw-st-shead"><span class="aw-st-chip is-${t.kind}">${t.kind === "aw" ? "AWord · điểm" : "✎ Chấm tay · số lỗi"}</span><h3>${esc(t.title)}${t.sub ? " · " + esc(t.sub) : ""}</h3><button type="button" class="aw-st-x" data-close aria-label="Đóng">${I.x}</button></div>
      <div class="aw-st-ssub">${wdOf(t.date)} ${dlong(t.date)} · ${t.kind === "aw" ? `lượt SUBMIT tốt nhất của mỗi em${t.penal ? " · bài có trừ điểm: ô là tổng điểm" : ""}${t.code ? ` · mã bài ${esc(t.code)}` : ""}` : `tổng ${T} câu, đúng = tổng − số lỗi`}</div>
      <div class="aw-st-kpis">
        <div class="aw-st-kpi"><small>ĐÃ LÀM</small><b>${done.length}/${rows.length - preN}</b><em>${absN} vắng · ${noneN} chưa làm</em></div>
        <div class="aw-st-kpi"><small>TRUNG BÌNH</small><b>${a == null ? "—" : P(a)}</b><em>trung vị ${med == null ? "—" : P(med)}</em></div>
        <div class="aw-st-kpi"><small>CAO NHẤT</small><b>${done[0] ? P(done[0].p) : "—"}</b><em>${done[0] ? esc(done[0].s.name) : ""}</em></div>
        <div class="aw-st-kpi"><small>THẤP NHẤT</small><b>${done.length ? P(done[done.length - 1].p) : "—"}</b><em>${done.length ? esc(done[done.length - 1].s.name) : ""}</em></div>
        <div class="aw-st-kpi"><small>SO VỚI BÀI TRƯỚC</small><b style="color:${diff == null ? "var(--st-ink)" : diff >= 0 ? "var(--st-good)" : "var(--st-bad)"}">${diff == null ? "—" : (diff >= 0 ? "▲ " : "▼ ") + Math.abs(Math.round(diff * 100))}</b><em>${prev ? esc(prev.title) + " · " + dshort(prev.date) : ""}</em></div></div>
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

  // ---- progress of one pupil
  function openRow(key) {
    const s = allPeople().find(x => x.key === key); if (!s) return;
    const pts = allDays().slice().reverse().map(d => ({ d, p: dayPct(d, s), abs: tests.some(t => t.date === d && cellOf(t, s).k === "abs") })).filter(r => r.p != null || r.abs);
    const W = 900, H = 300, L = 44, R = 16, T = 16, B = 58, n = pts.length;
    const x = i => L + (n < 2 ? (W - L - R) / 2 : i * (W - L - R) / (n - 1)), y = p => T + (1 - p) * (H - T - B);
    let g = ""; [0, .25, .5, .75, 1].forEach(v => { g += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="#e3e9f1"/><text x="${L - 8}" y="${y(v) + 4}" text-anchor="end" font-size="12" fill="#8b93a1">${v * 100}%</text>`; });
    let ap = ""; pts.forEach((r, i) => { const a = avgDay(r.d); if (a != null) ap += (ap ? "L" : "M") + x(i) + " " + y(a); });
    if (ap) g += `<path d="${ap}" fill="none" stroke="#8b93a1" stroke-width="1.5" stroke-dasharray="5 5"/>`;
    let path = "", f = null, l = null; pts.forEach((r, i) => { if (r.p == null) return; path += (path ? "L" : "M") + x(i) + " " + y(r.p); if (f == null) f = i; l = i; });
    if (path) g += `<path d="${path}L${x(l)} ${y(0)}L${x(f)} ${y(0)}Z" fill="#2f7bff" opacity=".08"/><path d="${path}" fill="none" stroke="#2f7bff" stroke-width="2.5" stroke-linejoin="round"/>`;
    const every = Math.max(1, Math.ceil(n / 24));
    pts.forEach((r, i) => { const lx = x(i);
      if (i % every === 0 || i === n - 1) g += `<text x="${lx}" y="${H - B + 18}" text-anchor="middle" font-size="11" fill="#55657a">${dshort(r.d)}</text>`;
      if (i === 0 || r.d.slice(0, 4) !== pts[i - 1].d.slice(0, 4)) g += `<text x="${lx}" y="${H - B + 32}" text-anchor="middle" font-size="10" fill="#8b93a1">${r.d.slice(0, 4)}</text>`;
      if (r.p == null) { g += `<text x="${lx}" y="${y(0) - 6}" text-anchor="middle" font-size="11" font-weight="700" fill="#dc2626">V</text>`; return; }
      g += `<circle cx="${lx}" cy="${y(r.p)}" r="5.5" fill="#2f7bff" stroke="#fff" stroke-width="2"><title>${dshort(r.d)} · ${P(r.p)}</title></circle>`; });
    const got = pts.filter(r => r.p != null), mean = got.length ? got.reduce((a, r) => a + r.p, 0) / got.length : null;
    openLayer(`<div class="aw-st-sheet" role="dialog" aria-modal="true"><div class="aw-st-shead"><h3>${esc(s.name)} · đường tiến bộ</h3><button type="button" class="aw-st-x" data-close aria-label="Đóng">${I.x}</button></div>
      <div class="aw-st-ssub">${got.length} ngày có điểm · TB <b>${mean == null ? "—" : P(mean)}</b> · mỗi chấm = % trung bình các bài trong ngày · vạch đứt = TB lớp</div>
      ${n ? `<svg class="aw-st-line" viewBox="0 0 ${W} ${H}" role="img" aria-label="Đường tiến bộ">${g}</svg>` : `<div class="aw-st-empty">Chưa có điểm nào.</div>`}</div>`);
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
  function openPads(editId, presetDate) {
    const ed = editId ? tests.find(t => t.id === editId) : null;
    let total = ed ? ed.total : 20;
    const roster = cls.students;
    const st = {};
    roster.forEach(s => { const c = ed && ed.values[s.key]; st[s.key] = c && (c.k === "n" || c.k === "abs" || c.k === "none") ? { k: c.k, v: c.v } : { k: "n", v: 0 }; });
    // temporary people already in this test
    let tmp = ed ? Object.keys(ed.values).filter(k => k.startsWith("g:")).map(k => ({ key: k, gid: k.slice(2), name: guests[k.slice(2)]?.name || ed.values[k].name || "?", note: guests[k.slice(2)]?.note || "" })) : [];
    tmp.forEach(g => { const c = ed.values[g.key]; st[g.key] = { k: c.k, v: c.v }; });
    const d0 = ed ? ed.date : (presetDate || today());
    const { layer, close } = openLayer(`<form class="aw-st-sheet" novalidate role="dialog" aria-modal="true">
      <div class="aw-st-shead"><span class="aw-st-chip is-hand">✎ Chấm tay</span><h3>${ed ? "Sửa bài " + esc(ed.title) : "Thêm bài chấm tay"} · ${esc(cls.name)}</h3><button type="button" class="aw-st-x" data-close aria-label="Đóng">${I.x}</button></div>
      <div class="aw-st-frow"><label>NGÀY (ngày/tháng/năm)<span class="aw-st-dateline"><input type="text" data-f="date" inputmode="numeric" value="${dlong(d0)}" placeholder="21/12/2026" maxlength="10"><button type="button" class="aw-st-btn is-sm" data-f="today">Hôm nay</button></span></label>
        <label>TÊN BÀI<input type="text" data-f="title" value="${ed ? esc(ed.title) : ""}" placeholder="LSB1, FINAL, Dictation…"></label>
        <label>TỔNG SỐ CÂU<input type="number" data-f="total" min="1" inputmode="numeric" value="${total}"></label></div>
      <div class="aw-st-hint"><span>Nhập <b>số lỗi</b>:</span><span>${I.tap} Chạm = +1</span><span>${I.up} Vuốt lên = +5</span><span>${I.down} Vuốt xuống = −5</span></div>
      <div class="aw-st-pads"></div>
      <div class="aw-st-mfoot"><span class="aw-st-err"></span>${ed ? `<button type="button" class="aw-st-btn is-danger" data-f="del">Xoá bài</button>` : ""}<button type="button" class="aw-st-btn" data-close>Huỷ</button><button type="submit" class="aw-st-btn is-primary" data-f="save">Lưu</button></div></form>`, { keepOnBackdrop: true });
    const form = layer.querySelector("form"), pads = form.querySelector(".aw-st-pads"), err = form.querySelector(".aw-st-err");
    const f = k => form.querySelector(`[data-f="${k}"]`);
    const cardHTML = s => `<div class="aw-st-card ${s.guest ? "is-guest" : ""}"><div class="aw-st-who">${esc(s.name)}${s.guest ? '<span class="aw-st-chip is-guest">tạm</span>' : ""}</div>${s.guest ? `<button type="button" class="aw-st-rm" data-rm="${esc(s.key)}" aria-label="Bỏ ${esc(s.name)}">×</button>` : ""}
      <div class="aw-st-pad" data-pad="${esc(s.key)}" tabindex="0" role="spinbutton" aria-label="Số lỗi của ${esc(s.name)}"></div>
      <div class="aw-st-cardbtns"><button type="button" data-m="${esc(s.key)}">−1</button><button type="button" data-v="${esc(s.key)}" aria-pressed="false">Vắng</button><button type="button" data-n="${esc(s.key)}" aria-pressed="false">—</button></div></div>`;
    const known = () => Object.entries(guests).filter(([gid]) => !tmp.some(g => g.gid === gid));
    const addHTML = () => `<div class="aw-st-addcard" data-add><button type="button" class="aw-st-btn" data-addg style="border-color:#c9b3f7;color:var(--st-guest)">${I.person}Thêm người</button>
      ${known().length ? `<small>hoặc chọn lại:</small><div style="display:flex;flex-wrap:wrap;gap:4px;justify-content:center">${known().map(([gid, g]) => `<button type="button" class="aw-st-btn is-sm" data-reg="${esc(gid)}" style="color:var(--st-guest)">${esc(g.name)}</button>`).join("")}</div>` : ""}
      <small>người học thử, học bù… chỉ tính trong bài này</small></div>`;
    const sel = k => pads.querySelector(`[data-pad="${CSS.escape(k)}"]`);
    const draw = key => {
      const c = st[key], el = sel(key); if (!el) return;
      const p = c.k === "n" ? Math.max(0, (total - c.v) / total) : null;
      el.className = "aw-st-pad " + (c.k === "abs" ? "is-abs" : c.k === "none" ? "is-none" : ""); el.style.background = heat(p);
      el.innerHTML = c.k === "n" ? `<span class="aw-st-num">${c.v}</span><span class="aw-st-sub">lỗi · đúng ${Math.max(0, total - c.v)}/${total}</span>` : `<span class="aw-st-num">${c.k === "abs" ? "VẮNG" : "CHƯA LÀM"}</span><span class="aw-st-sub">chạm để nhập lại</span>`;
      pads.querySelector(`[data-v="${CSS.escape(key)}"]`)?.setAttribute("aria-pressed", c.k === "abs");
      pads.querySelector(`[data-n="${CSS.escape(key)}"]`)?.setAttribute("aria-pressed", c.k === "none");
    };
    const everyone = () => roster.map(s => ({ key: s.key, name: s.name })).concat(tmp.map(g => ({ ...g, guest: true })));
    const drawAll = () => { pads.innerHTML = everyone().map(cardHTML).join("") + addHTML(); everyone().forEach(s => draw(s.key)); };
    const bump = (key, dl) => {
      const c = st[key];
      if (c.k !== "n") { st[key] = { k: "n", v: 0 }; draw(key); return; }
      const nv = Math.max(0, Math.min(total, c.v + dl)), real = nv - c.v; c.v = nv; draw(key);
      const fl = document.createElement("span"); fl.className = "aw-st-fly"; fl.textContent = (real >= 0 ? "+" : "") + real;
      fl.style.color = real >= 0 ? "var(--st-bad)" : "var(--st-good)";
      sel(key)?.append(fl); setTimeout(() => fl.remove(), 650);
    };
    drawAll();
    pads.addEventListener("pointerdown", e => {
      const pad = e.target.closest(".aw-st-pad"); if (!pad || e.button > 0) return;
      const y0 = e.clientY, key = pad.dataset.pad;
      try { pad.setPointerCapture(e.pointerId); } catch { /* old browser */ }
      pad.classList.add("is-drag");
      const up = ev => {
        pad.removeEventListener("pointerup", up); pad.removeEventListener("pointercancel", up); pad.classList.remove("is-drag");
        if (ev.type === "pointercancel") return;
        const dy = ev.clientY - y0; bump(key, dy < -28 ? 5 : dy > 28 ? -5 : 1);
      };
      pad.addEventListener("pointerup", up); pad.addEventListener("pointercancel", up);
    });
    pads.addEventListener("keydown", e => {
      const pad = e.target.closest(".aw-st-pad"); if (!pad) return; const key = pad.dataset.pad;
      if (e.key === "ArrowUp") { e.preventDefault(); bump(key, 5); } else if (e.key === "ArrowDown") { e.preventDefault(); bump(key, -5); }
      else if (e.key === " " || e.key === "Enter") { e.preventDefault(); bump(key, 1); } else if (e.key === "Backspace") { e.preventDefault(); bump(key, -1); }
    });
    pads.addEventListener("click", e => {
      const m = e.target.closest("[data-m]"), v = e.target.closest("[data-v]"), n = e.target.closest("[data-n]"), rm = e.target.closest("[data-rm]"),
        addg = e.target.closest("[data-addg]"), reg = e.target.closest("[data-reg]"), gok = e.target.closest("[data-gok]"), gno = e.target.closest("[data-gno]");
      if (m) bump(m.dataset.m, -1);
      else if (v) { const k = v.dataset.v; st[k] = st[k].k === "abs" ? { k: "n", v: 0 } : { k: "abs" }; draw(k); }
      else if (n) { const k = n.dataset.n; st[k] = st[k].k === "none" ? { k: "n", v: 0 } : { k: "none" }; draw(k); }
      else if (rm) { tmp = tmp.filter(g => g.key !== rm.dataset.rm); delete st[rm.dataset.rm]; drawAll(); }
      else if (reg) { const gid = reg.dataset.reg, g = guests[gid]; tmp.push({ key: "g:" + gid, gid, name: g.name, note: g.note || "" }); st["g:" + gid] = { k: "n", v: 0 }; drawAll(); }
      else if (addg) {
        const box = pads.querySelector("[data-add]");
        box.innerHTML = `<b>Tên người tạm</b><input type="text" data-gname placeholder="VD: BẢO"><input type="text" data-gnote placeholder="Ghi chú: học thử, lớp khác…"><span style="display:flex;gap:6px;margin-top:6px"><button type="button" class="aw-st-btn is-sm" data-gno>Huỷ</button><button type="button" class="aw-st-btn is-sm is-primary" data-gok>Thêm</button></span>`;
        box.querySelector("[data-gname]").focus();
      } else if (gno) drawAll();
      else if (gok) addGuest();
    });
    pads.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.matches("[data-gname],[data-gnote]")) { e.preventDefault(); addGuest(); } });
    function addGuest() {
      const box = pads.querySelector("[data-add]"), ni = box.querySelector("[data-gname]");
      const name = ni.value.trim().toUpperCase(); if (!name) { ni.classList.add("is-bad"); return; }
      const gid = "g" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
      tmp.push({ key: "g:" + gid, gid, name, note: box.querySelector("[data-gnote]").value.trim(), fresh: true });
      st["g:" + gid] = { k: "n", v: 0 }; drawAll();
    }
    const fd = f("date");
    // Keep what thầy types (digits + "/"), so "22/9/2026" works as typed; only
    // ADD the slash after a full 2-digit day / month (never re-slice the digits —
    // a 1-digit month would be torn apart: "2292026" → "22/92/026").
    fd.addEventListener("input", e => {
      let v = fd.value.replace(/[^\d/]/g, "").replace(/\/{2,}/g, "/");
      if (e.inputType === "insertText" && (/^\d{2}$/.test(v) || /^\d{1,2}\/\d{2}$/.test(v))) v += "/";
      fd.value = v.slice(0, 10); fd.classList.remove("is-bad");
    });
    f("today").onclick = () => { fd.value = dlong(today()); fd.classList.remove("is-bad"); };
    f("total").addEventListener("input", () => { const tt = +f("total").value; if (tt > 0) { total = tt; everyone().forEach(s => { if (st[s.key].k === "n" && st[s.key].v > tt) st[s.key].v = tt; draw(s.key); }); } });
    if (ed) f("del").onclick = async () => {
      if (f("del").dataset.sure !== "1") { f("del").dataset.sure = "1"; f("del").textContent = "Bấm lần nữa để xoá"; return; }
      try { await removeTest(cls.id, ed.date.slice(0, 7), ed.id); tests = tests.filter(t => t.id !== ed.id); close(); paint(); toast("Đã xoá bài " + ed.title + "."); }
      catch (e2) { err.textContent = "Chưa xoá được: " + (e2.message || e2); }
    };
    form.addEventListener("submit", async ev => {
      ev.preventDefault();
      const date = parseDMY(fd.value);
      if (!date) { fd.classList.add("is-bad"); err.textContent = "Ngày chưa đúng. Gõ theo dạng 21/12/2026."; return; }
      if (!(total > 0)) { err.textContent = "Nhập tổng số câu."; return; }
      const title = f("title").value.trim() || "(chưa ghi tên bài)";
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
        ["", ...list.map(t => (t.kind === "aw" ? "AWord · " : "Chấm tay · ") + t.title)],
        ["HỌC SINH", ...list.map(t => t.kind === "aw" ? `điểm /${t.total}` : `số lỗi / ${t.total} câu`)]
      ];
      people.forEach(s => aoa.push([s.name + (s.guest ? " (tạm)" : s.left ? " (đã rời lớp)" : ""), ...list.map(t => cellTxt(cellOf(t, s)))]));
      aoa.push(["TB LỚP (%)", ...list.map(t => { const a = avgTest(t); return a == null ? "" : Math.round(a * 100); })]);
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
    const aoa = [["% ĐÚNG", ...all.map(t => `${dshort(t.date)}/${t.date.slice(0, 4)} ${t.title}`)]];
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
    if (b("xls")) { exportXlsx(); return; }
    if (!cls) return;
    if (b("analyse")) { if (!tests.length) toast("Chưa có bài nào để phân tích."); else openAnalysePicker(); return; }
    if (b("add")) { openPads(null, view.type === "day" ? view.date : null); return; }
    const vr = t.closest("[data-view]"), yr = t.closest("[data-year]"), ym = t.closest("[data-ym]"), dy = t.closest("[data-day]"),
      ch = t.closest("[data-chart]"), ed = t.closest("[data-edit]"), row = t.closest("[data-row]");
    if (vr) { view = { type: "recent" }; paint(); }
    else if (yr) { const y = yr.dataset.year; openY[y] = !openY[y]; paintTree(); }
    else if (ym) { const k = ym.dataset.ym; const isSel = view.type === "month" && view.ym === k; openM[k] = isSel ? !openM[k] : true; view = { type: "month", ym: k }; paint(); }
    else if (dy) { view = { type: "day", date: dy.dataset.day }; paint(); }
    else if (ch) openEval(ch.dataset.chart);
    else if (ed) openPads(ed.dataset.edit);
    else if (row) openRow(row.dataset.row);
  });
  $sel.addEventListener("change", () => {
    cls = classes.find(c => c.id === $sel.value) || cls;
    view = { type: "recent" }; openY = {}; openM = {};
    loadClass();
  });

  start();

  function dispose() {
    alive = false;
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
  tap: sv('<circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="8.5" opacity=".45"/>'),
  up: sv('<path d="M12 19V5m0 0-5 5m5-5 5 5"/>'),
  down: sv('<path d="M12 5v14m0 0-5-5m5 5 5-5"/>'),
  an: sv('<path d="M4 20V10M9 20V4M14 20v-7M19 20V8"/>')
};
