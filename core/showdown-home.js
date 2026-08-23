// =============================================================
// SHOWDOWN HOME — the full-page durable ledger (Đợt 236, 23/8/2026).
//
// A page of its own (reached from a button on the app's home page, core/main.js
// — see topbar() there), not a popover over a game frame the way Recent
// results/Analyse are. Thầy's own framing: this is where the teacher goes
// AFTER a lesson, or at the end of a term, to browse and compare every
// Showdown match a class has ever played — the in-game popup
// (core/showdown-setup.js's openRecent, opened by tapping "SHOWDOWN IN ANDREW
// CLASSES" mid-lesson) is UNCHANGED and stays the quick 10-match glance it
// always was (thầy's own instruction, 22/8/2026).
//
// ⚠️ NOTHING HERE OWNS A LIVE FIRESTORE LISTENER. Every read is a plain
// one-shot fetch (loadMonthIndex/loadMonth from core/showdown-history.js) —
// this is a browse-and-analyse screen, not a live board, so there is nothing
// to watch. That sidesteps the one class of leak every other Showdown screen
// has to guard against with care (onSnapshot torn down on close): the ONLY
// long-lived things this file ever attaches are a `document` click listener
// (the class picker) and, transiently, `fullscreenchange`/ResizeObserver
// while a detail view or the analysis chart is open — both already close
// themselves on their own ✕ (copied from core/showdown-setup.js's openDetail/
// openAnalysis, a proven shape), and `watchForClose()` below is the same
// belt-and-braces teardown that file uses for the case the teacher leaves the
// page a different way (the browser's Home/logo, not any ✕ in here).
//
// ---------------------------------------------------------------------------
// REUSE, NOT A SECOND COPY — read this before "simplifying" anything
// ---------------------------------------------------------------------------
// A day's tile is built exactly like a Recent-results column
// (core/showdown-setup.js's paintCols): `.aw-sd-rec-col` > `.aw-sd-rec-colhead`
// (name/rename) + renderMini(ranked) + the same delete "–" and, in CHOOSING,
// the same round pick-tick. A tile's detail view reuses renderReviewTable/
// Podium/List + fitPodiumNames + core/showdown-export.js's openExportDialog,
// mounted into the SAME `.aw-sd-rec-detail` shape. The ANALYSE screen reuses
// renderChart/renderLegend/fitChartTierLabels/watchChartResize +
// openAnalysisExportDialog, mounted into `.aw-sd-rec-chart`. None of those
// classes/functions were written for THIS file — they were lifted to module
// scope in core/showdown-setup.js (Đợt 236) for exactly this reason: one
// board, drawn identically wherever the teacher opens it.
// =============================================================

import { el } from "./utils.js";
import { icons } from "./icons.js";
import { listClasses } from "./classes.js";
import {
  sfx, whenDone, when, matchBlocks, displayName, renderMini,
  renderChart, fitChartTierLabels, watchChartResize
} from "./showdown-setup.js";
import { renderReviewTable, renderReviewPodium, renderReviewList, fitPodiumNames } from "./showdown-review.js";
import { buildAnalysisRows } from "./showdown.js";

const WEEKDAY = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTH_NAME = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];

/** "202608" -> "AUGUST 2026" — the rail's month-row label. */
function monthLabel(yyyymm) {
  const y = yyyymm.slice(0, 4), m = Number(yyyymm.slice(4, 6)) - 1;
  return `${MONTH_NAME[m] || "?"} ${y}`;
}
/** ms -> "20260822" — one calendar day, the rail's day key (core/showdown-history.js's own). */
function dayKeyOf(ms) {
  const d = new Date(Number(ms) || 0);
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}
/** "20260822" -> { wd:"SAT", dt:"22/8/2026" } — thầy's own split (green weekday, black date). */
function dayParts(dayKey) {
  const y = Number(dayKey.slice(0, 4)), m = Number(dayKey.slice(4, 6)) - 1, d = Number(dayKey.slice(6, 8));
  const date = new Date(y, m, d);
  return { wd: WEEKDAY[date.getDay()], dt: `${d}/${m + 1}/${y}` };
}

/**
 * @param {Element} host   an empty element to fill (main.js clears `app` itself)
 * @param {object} opts
 *   classId     the class to open on, or "" for the empty "CLASSES" state
 *   onClassChange(classId, className)  called whenever the teacher picks a
 *               class, so main.js can keep the address bar in step
 *   toast       the app's own toast() — a floating confirmation, not an error dialog
 */
export function mountShowdownHome(host, opts = {}) {
  const toast = opts.toast || (() => {});
  const root = el("div", "aw-sdh");
  host.append(root);

  // ⚠️ Same liveness test as core/showdown-setup.js's `alive()`: main.js clears
  // `app.innerHTML` on every navigation, which detaches `root` without calling
  // anything here — a MutationObserver on the ancestor that stays around
  // (`document.body`) is what notices and lets every open overlay tear its own
  // listeners down instead of leaking them for the rest of the page's life.
  const isAlive = () => root.isConnected;
  let bodyWatcher = null;
  function watchForClose() {
    if (bodyWatcher) return;
    bodyWatcher = new MutationObserver(() => { if (!isAlive()) teardownAll(); });
    bodyWatcher.observe(document.body, { childList: true, subtree: true });
  }
  watchForClose();

  // ---- state --------------------------------------------------------------
  let curClassId = opts.classId || "";
  let curClassName = "";
  let classesCache = null;                 // [{id,name,students}] — fetched once, on first picker open
  const monthCache = new Map();             // yyyymm -> matches[] (this class only; cleared on class switch)
  let monthIndex = [];                      // [{key,count,lastAt}], newest first
  const openMonths = new Set();
  let curMonthKey = "", curDayKey = "";
  let choosing = false;
  let allMode = false;
  const picked = new Map();                 // "<yyyymm>|<matchId>" -> match, INSERTION ORDER = chip order
  let closePicker = null;                   // the open class-popover's own close(), or null

  const teardownFns = new Set();
  function teardownAll() {
    if (bodyWatcher) { bodyWatcher.disconnect(); bodyWatcher = null; }
    teardownFns.forEach(fn => { try { fn(); } catch { /* already gone */ } });
    teardownFns.clear();
  }

  // ---- shell ----------------------------------------------------------------
  const titleRow = el("div", "aw-sdh-titlerow");
  const titleBtn = el("button", "aw-sdh-titlebtn");
  titleBtn.type = "button";
  const titleWord = el("span", "aw-sdh-title-word", "SHOWDOWN");
  // ⭐ Đợt 237 — the class name now stands as tall as "SHOWDOWN" and carries
  // the same gold glow as a podium's top-3 names, PLUS a few stars that
  // actually drift (the podium's own sparkle only twinkles in place — thầy
  // asked for movement here specifically). Both sit in their own wrapper
  // (never inside titleBtn's own stacking — a nested <button> would be
  // invalid HTML) so the class-picker popover below can anchor to exactly
  // this box and nothing wider.
  const titleClassWrap = el("span", "aw-sdh-title-classwrap");
  const titleClass = el("span", "aw-sdh-title-class");
  titleClassWrap.append(titleClass, sparkStatic(), sparkFly());
  const titleChevron = document.createElement("span");
  titleChevron.innerHTML = icons.next;                         // trusted markup, core/icons.js
  titleBtn.append(titleWord, titleClassWrap, titleChevron);
  titleBtn.onclick = () => { sfx.tap(); toggleClassPicker(); };
  titleRow.append(titleBtn);

  /** The podium's own static twinkle (core/showdown-review.js), reused as-is —
   *  6 stars, opacity/scale only, never translate. */
  function sparkStatic() {
    const s = el("span", "aw-sd-pod-spark");
    s.setAttribute("aria-hidden", "true");
    for (let i = 0; i < 6; i++) s.append(el("i", "aw-sd-pod-star s" + i));
    return s;
  }
  /** NEW — a few stars that actually drift around the class name (thầy's
   *  "sao nhỏ bay xung quanh ẩn hiện"), plain CSS keyframes (translate +
   *  opacity), no rAF — see core/app.css's aw-sdh-flystar warning. */
  function sparkFly() {
    const s = el("span", "aw-sdh-flystars");
    s.setAttribute("aria-hidden", "true");
    for (let i = 0; i < 4; i++) s.append(el("i", "aw-sdh-flystar f" + i));
    return s;
  }

  const main = el("div", "aw-sdh-main");
  root.append(titleRow, main);

  // ---- CLASS PICKER -----------------------------------------------------
  async function toggleClassPicker() {
    if (closePicker) { closePicker(); return; }
    if (!classesCache) {
      try { classesCache = await listClasses(); }
      catch (e) { classesCache = []; toast(e?.code === "aw/signed-out" ? "Sign in first." : "Could not load classes."); }
    }
    if (!isAlive()) return;
    const pop = el("div", "aw-sdh-classpop");
    if (!classesCache.length) {
      pop.append(el("div", "aw-sdh-classpop-empty", "No classes yet — add one in Settings › Classes."));
    } else {
      classesCache.forEach(c => {
        const b = el("button", "aw-sdh-classopt" + (c.id === curClassId ? " is-cur" : ""));
        b.type = "button";
        b.textContent = c.name;                                 // the teacher's own text — never innerHTML
        b.onclick = () => { sfx.tap(); close(); selectClass(c.id, c.name); };
        pop.append(b);
      });
    }
    titleRow.append(pop);
    // ⭐ Đợt 237 — anchor to the class-name box itself, not the whole title
    // row: thầy's complaint was the popover landing at the bottom of the
    // page (it was centred under the ENTIRE titleRow, which can be much
    // taller than the button once the rail/tiles below grow). titleRow is
    // the positioned ancestor (see core/app.css), so plain px offsets from
    // titleClassWrap's own rect land it right beside the class name. Width is
    // only known once `pop` is actually in the DOM, so measure it there and
    // flip to the left side if it would run off the right edge.
    const wrapRect = titleClassWrap.getBoundingClientRect();
    const rowRect = titleRow.getBoundingClientRect();
    const popW = pop.getBoundingClientRect().width || 220;
    let left = wrapRect.right - rowRect.left + 10;
    if (rowRect.left + left + popW > window.innerWidth - 8) {
      left = wrapRect.left - rowRect.left - popW - 10;             // flip to the left of the class name
    }
    pop.style.left = Math.max(-rowRect.left + 8, left) + "px";
    // ⭐ Đợt 238 (thầy: "hạ thấp pop-up... vị trí cao nhất bằng vị trí dòng
    // SHOWDOWN TÊN LỚP") — top-aligned to the class-name row's own top edge,
    // not vertically centred on it (the old `+ wrapRect.height / 2` pushed the
    // popover's own top half ABOVE the row, which read as "too tall / too
    // high"). See the matching CSS change dropping `.aw-sdh-classpop`'s own
    // `transform: translateY(-50%)`.
    pop.style.top = (wrapRect.top - rowRect.top) + "px";
    titleBtn.classList.add("is-open");
    const onDocClick = e => { if (!pop.contains(e.target) && e.target !== titleBtn && !titleBtn.contains(e.target)) close(); };
    // A frame later: the very click that opened this must not also close it.
    setTimeout(() => document.addEventListener("click", onDocClick), 0);
    function close() {
      document.removeEventListener("click", onDocClick);
      pop.remove();
      titleBtn.classList.remove("is-open");
      closePicker = null;
      teardownFns.delete(close);
    }
    closePicker = close;
    teardownFns.add(close);
  }

  function selectClass(id, name) {
    if (id === curClassId) return;
    curClassId = id; curClassName = name || "";
    monthCache.clear(); openMonths.clear();
    curMonthKey = ""; curDayKey = "";
    const wasChoosing = choosing;
    choosing = false; allMode = false; picked.clear();
    paintTitle();
    opts.onClassChange?.(curClassId, curClassName);
    if (wasChoosing) opts.onChoosingChange?.(false);
    loadClass();
  }

  function paintTitle() {
    titleClass.textContent = curClassId ? (curClassName || "Class") : "CLASSES";
  }

  // ---- LOAD ---------------------------------------------------------------
  async function loadClass() {
    const requestedClassId = curClassId;    // stale-response guard — see below
    main.innerHTML = "";
    if (!curClassId) {
      main.append(el("div", "aw-sdh-empty",
        "Pick a class above to see everything it has ever played."));
      return;
    }
    main.append(el("div", "aw-sdh-empty", "Loading…"));
    let idx;
    try {
      const h = await import("./showdown-history.js");
      idx = await h.loadMonthIndex(curClassId);
    } catch (e) {
      // ⚠️ The teacher may have picked ANOTHER class while this was in flight —
      // do not paint an error over a class they are no longer looking at.
      if (!isAlive() || curClassId !== requestedClassId) return;
      main.innerHTML = "";
      main.append(el("div", "aw-sdh-empty",
        e?.code === "aw/signed-out" ? "Sign in to see past results." : "Could not read past results."));
      return;
    }
    if (!isAlive() || curClassId !== requestedClassId) return;
    monthIndex = idx.months;
    if (idx.className && !curClassName) curClassName = idx.className;
    paintTitle();
    // ⭐ A fresh class opens on its own newest day, so the page never greets
    // the teacher with an empty middle column when there is plainly something
    // to show — the same ergonomics the old Recent results gave for free by
    // simply always being full.
    if (monthIndex.length) {
      openMonths.add(monthIndex[0].key);
      await ensureMonthLoaded(monthIndex[0].key);
      if (!isAlive() || curClassId !== requestedClassId) return;
      const days = daysOf(monthIndex[0].key);
      if (days.length) { curMonthKey = monthIndex[0].key; curDayKey = days[0].key; }
    }
    paintAll();
  }

  async function ensureMonthLoaded(yyyymm) {
    if (monthCache.has(yyyymm)) return monthCache.get(yyyymm);
    const requestedClassId = curClassId;
    const h = await import("./showdown-history.js");
    const matches = await h.loadMonth(requestedClassId, yyyymm);
    // ⚠️ The teacher may have switched to another class while this was in
    // flight — `monthCache` was cleared for the new one, and writing a stale
    // class's matches back into it under the same month KEY (two classes can
    // both have a "202608") would show the wrong class's results.
    if (curClassId === requestedClassId) monthCache.set(yyyymm, matches);
    return matches;
  }

  /** This month's matches, grouped into days, newest day first. */
  function daysOf(yyyymm) {
    const matches = monthCache.get(yyyymm) || [];
    const byDay = new Map();
    matches.forEach(m => {
      const k = dayKeyOf(m.at);
      if (!byDay.has(k)) byDay.set(k, []);
      byDay.get(k).push(m);
    });
    return [...byDay.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, ms]) => ({ key, matches: ms }));
  }

  // ---- PAINT: the whole body, rail + tiles + (choosing) analyse column ----
  function paintAll() {
    main.innerHTML = "";
    if (!curClassId) return;
    // ⭐ Đợt 238 (thầy: "cột Analyse... luôn cố định") — the ANALYSE column is
    // now always in the DOM regardless of `choosing`; buildChooseWrap() itself
    // decides whether it reads dimmed/inert (see its own `is-inactive`).
    main.append(buildRail(), el("div", "aw-sdh-vrule"), buildTilesWrap(), buildChooseWrap());
  }

  // ---- RAIL: month -> day folders ------------------------------------------
  function buildRail() {
    const rail = el("div", "aw-sdh-rail");
    const head = el("div", "aw-sdh-rail-head");
    head.textContent = curClassName || "Class";                 // the teacher's own text — never innerHTML
    rail.append(head);
    const list = el("div", "aw-sdh-rail-list" + (allMode ? " is-locked" : ""));
    if (!monthIndex.length) {
      list.append(el("div", "aw-sdh-rail-empty", "No Showdown results kept for this class yet."));
    } else {
      monthIndex.forEach(mm => list.append(buildMonthRow(mm)));
    }
    rail.append(list);
    if (choosing && monthIndex.length) {
      const allBtn = el("button", "aw-sdh-all-btn" + (allMode ? " is-on" : ""), "ALL");
      allBtn.type = "button";
      allBtn.onclick = () => { sfx.tap(); toggleAll(); };
      rail.append(allBtn);
    }
    return rail;
  }

  function buildMonthRow(mm) {
    const wrap = el("div", "aw-sdh-month" + (openMonths.has(mm.key) ? " is-open" : ""));
    const row = el("button", "aw-sdh-month-row" + (openMonths.has(mm.key) ? " is-open" : "") + (allMode ? " is-locked" : ""));
    row.type = "button";
    row.insertAdjacentHTML("beforeend", icons.next);             // trusted markup
    row.append(el("span", "aw-sdh-month-name", monthLabel(mm.key)));
    row.append(el("span", "aw-sdh-month-count", String(mm.count)));
    row.onclick = () => { sfx.tap(); toggleMonth(mm.key, wrap, row); };
    const days = el("div", "aw-sdh-days");
    const inner = el("div", "aw-sdh-days-inner");
    days.append(inner);
    if (openMonths.has(mm.key)) fillDays(inner, mm.key);
    wrap.append(row, days);
    return wrap;
  }

  async function toggleMonth(key, wrap, row) {
    if (openMonths.has(key)) { openMonths.delete(key); wrap.classList.remove("is-open"); row.classList.remove("is-open"); return; }
    openMonths.add(key);
    wrap.classList.add("is-open"); row.classList.add("is-open");
    const inner = wrap.querySelector(".aw-sdh-days-inner");
    inner.innerHTML = "";
    inner.append(el("div", "aw-sdh-rail-empty", "Loading…"));
    await ensureMonthLoaded(key);
    if (!isAlive() || !openMonths.has(key)) return;
    fillDays(inner, key);
  }

  function fillDays(inner, key) {
    inner.innerHTML = "";
    const days = daysOf(key);
    if (!days.length) { inner.append(el("div", "aw-sdh-rail-empty", "Nothing this month.")); return; }
    days.forEach(d => inner.append(buildDayRow(key, d)));
  }

  function buildDayRow(monthKey, day) {
    const { wd, dt } = dayParts(day.key);
    const cur = monthKey === curMonthKey && day.key === curDayKey;
    const btn = el("button", "aw-sdh-day" + (cur ? " is-cur" : ""));
    btn.type = "button";
    btn.insertAdjacentHTML("afterbegin", icons.folder);          // trusted markup
    const label = el("span", "aw-sdh-day-label");
    // The " • " separator is its OWN text node, not part of the green weekday
    // span — thầy's split is "the weekday itself is green", not the bullet.
    label.append(el("span", "aw-sdh-day-wd", wd), document.createTextNode(" • " + dt));
    btn.append(label, el("span", "aw-sdh-day-count", String(day.matches.length)));
    btn.onclick = () => { sfx.tap(); selectDay(monthKey, day.key); };
    return btn;
  }

  function selectDay(monthKey, dayKey) {
    curMonthKey = monthKey; curDayKey = dayKey;
    paintAll();
  }

  // ---- TILES ----------------------------------------------------------------
  function buildTilesWrap() {
    const wrap = el("div", "aw-sdh-tiles-wrap");
    if (allMode) {
      wrap.append(el("div", "aw-sdh-tiles-head", "Every result, newest first"));
      const scroll = el("div", "aw-sdh-tiles-scroll");
      const allDays = allDaysAcrossMonths();
      if (!allDays.length) scroll.append(el("div", "aw-sd-rec-note", "No results kept for this class yet."));
      allDays.forEach((d, i) => {
        if (i) scroll.append(el("hr", "aw-sdh-dayrule"));
        const group = el("div", "aw-sdh-daygroup");
        const { wd, dt } = dayParts(d.key);
        const glabel = el("div", "aw-sdh-daygroup-label");
        glabel.append(el("span", "aw-sdh-day-wd", wd), document.createTextNode(" • " + dt));
        group.append(glabel);
        const grid = el("div", "aw-sdh-tiles");
        d.matches.forEach(m => grid.append(buildTile(m)));
        group.append(grid);
        scroll.append(group);
      });
      wrap.append(scroll);
    } else if (curMonthKey && curDayKey) {
      const { wd, dt } = dayParts(curDayKey);
      const head = el("div", "aw-sdh-tiles-head");
      head.append(el("span", "aw-sdh-day-wd", wd), document.createTextNode(" • " + dt));
      wrap.append(head);
      const scroll = el("div", "aw-sdh-tiles-scroll");
      const matches = (monthCache.get(curMonthKey) || []).filter(m => dayKeyOf(m.at) === curDayKey);
      if (!matches.length) {
        scroll.append(el("div", "aw-sd-rec-note", "Nothing left this day."));
      } else {
        const grid = el("div", "aw-sdh-tiles");
        matches.forEach(m => grid.append(buildTile(m)));
        scroll.append(grid);
      }
      wrap.append(scroll);
    } else {
      wrap.append(el("div", "aw-sdh-empty", "Pick a day on the left."));
    }
    return wrap;
  }

  /** Every month already fetched, flattened into day-groups, newest day first. */
  function allDaysAcrossMonths() {
    const byDay = new Map();
    monthIndex.forEach(mm => {
      (monthCache.get(mm.key) || []).forEach(m => {
        const k = dayKeyOf(m.at);
        if (!byDay.has(k)) byDay.set(k, []);
        byDay.get(k).push(m);
      });
    });
    return [...byDay.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([key, ms]) => ({ key, matches: ms }));
  }

  /**
   * One tile — the same shape as a Recent-results column
   * (core/showdown-setup.js's paintCols): head (name, double-tap to rename) +
   * renderMini + delete "–" + (in CHOOSING) the round pick-tick.
   */
  function buildTile(m) {
    const ranked = matchBlocks(m);
    const col = el("div", "aw-sd-rec-col" + (choosing ? " is-analysing" : ""));
    const ch = el("div", "aw-sd-rec-colhead");
    const act = el("div", "aw-sd-rec-act");
    act.textContent = displayName(m);
    const sub = el("div", "aw-sd-rec-sub");
    const teams = Object.keys(m.teams || {}).length;
    sub.textContent = `${when(m.at)} · ${ranked.length} sts · ${teams} team${teams === 1 ? "" : "s"}`;
    ch.append(act, sub);
    col.append(ch, renderMini(ranked));

    const tileKey = `${m._yyyymm}|${m.matchId}`;

    // rename by double-tap — same 320ms window as Recent results' own gesture.
    const RENAME_MS = 320;
    let renaming = false, lastTap = 0;
    ch.title = "Double-tap to rename";
    ch.addEventListener("click", e => {
      e.stopPropagation();
      if (renaming) return;
      const now = Date.now();
      if (now - lastTap < RENAME_MS) { lastTap = 0; startRename(); } else { lastTap = now; }
    });
    function startRename() {
      sfx.tap();
      renaming = true;
      col.classList.add("is-renaming");
      const current = displayName(m);
      ch.innerHTML = "";
      const input = document.createElement("input");
      input.type = "text"; input.className = "aw-sd-rec-renameinput"; input.maxLength = 60; input.value = current;
      ch.append(input);
      input.focus(); input.select();
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
            const ok = await h.renameMatch(curClassId, m._yyyymm, m.matchId, v);
            if (ok) m.customName = v; else toast("Could not rename this match.");
          } catch (err) {
            console.warn("AWord: could not rename this match", err);
            toast(err?.code === "aw/signed-out" ? "Sign in first." : "Could not rename this match.");
          }
        }
        if (isAlive()) paintAll();
      };
      input.addEventListener("keydown", ev => {
        ev.stopPropagation();
        if (ev.key === "Enter") input.blur();
        else if (ev.key === "Escape") { settled = true; renaming = false; if (isAlive()) paintAll(); }
      });
      input.addEventListener("blur", commit);
    }

    const delBtn = el("button", "aw-sd-rec-delbtn", icons.minus);
    delBtn.type = "button"; delBtn.title = "Delete this match";
    delBtn.onclick = e => {
      e.stopPropagation();
      sfx.tap();
      confirmDialog(`Delete this match (${act.textContent} · ${when(m.at)})? This cannot be undone.`, "Delete", async () => {
        sfx.forward();
        try {
          const h = await import("./showdown-history.js");
          await h.deleteMatch(curClassId, m._yyyymm, m.matchId);
          const arr = monthCache.get(m._yyyymm);
          if (arr) monthCache.set(m._yyyymm, arr.filter(x => x.matchId !== m.matchId));
          picked.delete(tileKey);
          // The month's own count in the index is now stale by one — cheap to
          // just re-derive it from what is still in the cache rather than a
          // second network read for a number the rail repaint needs regardless.
          const idxRow = monthIndex.find(x => x.key === m._yyyymm);
          if (idxRow) idxRow.count = (monthCache.get(m._yyyymm) || []).length;
          if (idxRow && idxRow.count === 0) { openMonths.delete(m._yyyymm); monthIndex = monthIndex.filter(x => x !== idxRow); }
          // ⚠️ If that was the last tile of the day on screen, its folder just
          // vanished from the rail (days are derived, never stored — see the
          // file header) — land on whatever day is now newest instead of
          // showing an empty grid under a folder that no longer exists.
          if (dayKeyOf(m.at) === curDayKey && m._yyyymm === curMonthKey) {
            const stillThere = (monthCache.get(curMonthKey) || []).some(x => dayKeyOf(x.at) === curDayKey);
            if (!stillThere) {
              curMonthKey = ""; curDayKey = "";
              const firstOpen = monthIndex.find(x => openMonths.has(x.key)) || monthIndex[0];
              if (firstOpen) {
                await ensureMonthLoaded(firstOpen.key);
                const days = daysOf(firstOpen.key);
                if (days.length) { curMonthKey = firstOpen.key; curDayKey = days[0].key; }
              }
            }
          }
          if (isAlive()) paintAll();
          toast("Match deleted");
        } catch (err) {
          console.warn("AWord: could not delete this match", err);
          toast(err?.code === "aw/signed-out" ? "Sign in first." : "Could not delete this match.");
        }
      });
    };
    col.append(delBtn);

    if (choosing) {
      const pickBtn = el("button", "aw-sd-rec-pickbtn");
      pickBtn.type = "button"; pickBtn.title = "Pick for ANALYSE";
      pickBtn.append(el("i", "aw-sd-rec-pickdot"));
      pickBtn.insertAdjacentHTML("beforeend", icons.check);       // trusted markup
      const paint = () => {
        const on = picked.has(tileKey);
        pickBtn.classList.toggle("is-on", on);
        col.classList.toggle("is-picked", on);
      };
      pickBtn.onclick = e => {
        e.stopPropagation();
        if (picked.has(tileKey)) picked.delete(tileKey); else picked.set(tileKey, m);
        sfx.claim();                          // same little "tick" as the in-game pick-tick (sound.tick())
        paint();
        paintChoose();
      };
      col.append(pickBtn);
      paint();
    }

    col.onclick = () => {
      if (renaming) return;
      if (choosing) { col.querySelector(".aw-sd-rec-pickbtn")?.click(); return; }
      sfx.forward();
      openTileDetail(m, ranked);
    };
    return col;
  }

  // ---- CHOOSING: toggle + the right-hand ANALYSE column --------------------
  function toggleChoosing() {
    if (!monthIndex.length) return;
    choosing = !choosing;
    if (!choosing) { allMode = false; picked.clear(); }
    paintAll();
    opts.onChoosingChange?.(choosing);
  }

  function toggleAll() {
    allMode = !allMode;
    if (allMode) {
      // Fetch every month not already cached — an explicit, occasional action,
      // not something any other screen pays for.
      main.innerHTML = "";
      main.append(el("div", "aw-sdh-empty", "Loading every result…"));
      Promise.all(monthIndex.map(mm => ensureMonthLoaded(mm.key)))
        .then(() => { if (isAlive()) paintAll(); })
        .catch(e => { if (isAlive()) { allMode = false; paintAll(); toast("Could not load every result."); console.warn(e); } });
    } else {
      paintAll();
    }
  }

  function buildChooseWrap() {
    // ⭐ Đợt 238 — `is-inactive` is the only thing that changes when `choosing`
    // is off: the column stays mounted (see paintAll()) but reads dimmed/inert
    // (app.css) instead of being removed from the DOM outright.
    // ⚠️ Đợt 239 (thầy: "thiếu thanh kẻ mảnh giữa cột ANALYSE và vùng giữa") —
    // `is-inactive` goes on `col` alone now, NOT on `wrap`: the divider `rule`
    // is a structural separator between panes (same as the rail↔tiles one),
    // not "content" that should fade with the rest — it always stays at full
    // opacity, mirroring that other one.
    const wrap = el("div", "aw-sdh-choosewrap");
    const rule = el("div", "aw-sdh-vrule");
    const col = el("div", "aw-sdh-choosecol" + (choosing ? "" : " is-inactive"));
    col.id = "aw-sdh-choosecol";
    wrap.append(rule, col);
    paintChooseInto(col);
    return wrap;
  }
  function paintChoose() {
    const col = main.querySelector("#aw-sdh-choosecol");
    if (col) paintChooseInto(col);
  }
  function paintChooseInto(col) {
    col.innerHTML = "";
    // ⭐ Đợt 237 — SELECTED now sits where the old ANALYSE/CHOOSING button
    // used to (thầy: it is what a teacher scanning this column actually
    // wants first), and START (only live at 2+) takes the button's old spot
    // at the bottom instead — the ANALYSE pill that used to live here moved
    // out to core/main.js's topbar icon, see toggleChoosing().
    const count = el("div", "aw-sdh-choosecount");
    count.append(el("span", "aw-sdh-choosecount-label", "SELECTED"), document.createTextNode(String(picked.size)));
    col.append(count);

    // ⭐ Đợt 238 (thầy: "bỏ dòng Tick 2 or...") — an empty chip list is now just
    // an empty list; the column being dimmed while OFF (see buildChooseWrap's
    // `is-inactive`) already says "nothing picked / not active" on its own.
    const chips = el("div", "aw-sdh-chips");
    [...picked.entries()].forEach(([key, m], idx) => {
      const ranked = matchBlocks(m);
      const chip = el("div", "aw-sdh-chip");
      chip.dataset.idx = String(idx);
      const handle = el("button", "aw-sdh-chip-drag", icons.dragHandle);
      handle.type = "button"; handle.title = "Drag to reorder";
      const txt = el("div", "aw-sdh-chip-txt");
      const nameEl = el("div", "aw-sdh-chip-name");
      nameEl.textContent = displayName(m);                     // the teacher's own text — never innerHTML
      const subEl = el("div", "aw-sdh-chip-sub");
      subEl.textContent = `${when(m.at)} · ${ranked.length} sts`;
      txt.append(nameEl, subEl);
      const x = el("button", "aw-sdh-chip-x", icons.close);
      x.type = "button"; x.title = "Remove from ANALYSE";
      x.onclick = () => { sfx.tap(); picked.delete(key); paintAll(); };
      chip.append(handle, txt, x);
      chips.append(chip);
      wireChipReorder(chips, handle, chip, idx);
    });
    col.append(chips);

    const startBtn = el("button", "aw-sdh-startbtn" + (picked.size >= 2 ? "" : " is-disabled"));
    startBtn.type = "button";
    startBtn.textContent = "START ANALYSING";
    startBtn.disabled = picked.size < 2;
    startBtn.onclick = () => {
      if (picked.size < 2) return;
      sfx.forward(); runAnalysis([...picked.values()]);
    };
    col.append(startBtn);
  }

  /**
   * Vertical drag-to-reorder for the ANALYSE chip list — same shape as
   * core/main.js's own wireReorder() for the class roster (elementFromPoint +
   * a data-idx per row + splice-and-repaint), copied rather than imported
   * since main.js's copy is a closure over its own `rows` array.
   */
  function wireChipReorder(chips, handle, chip, from) {
    let active = false;
    const clear = () => chips.querySelectorAll(".aw-sdh-chip").forEach(c => c.classList.remove("is-droptarget"));
    const chipUnder = (x, y) => { const hit = document.elementFromPoint(x, y); return hit ? hit.closest(".aw-sdh-chip") : null; };
    handle.addEventListener("pointerdown", e => {
      if (e.button !== 0) return;
      e.preventDefault();
      active = true;
      chip.classList.add("is-dragging");
      try { handle.setPointerCapture(e.pointerId); } catch { /* not capturable */ }
    });
    handle.addEventListener("pointermove", e => {
      if (!active) return;
      clear();
      const over = chipUnder(e.clientX, e.clientY);
      if (over && over !== chip) over.classList.add("is-droptarget");
    });
    const finish = e => {
      if (!active) return;
      active = false;
      chip.classList.remove("is-dragging");
      const over = chipUnder(e.clientX, e.clientY);
      clear();
      if (!over || over === chip) return;
      const to = Number(over.dataset.idx);
      if (!Number.isInteger(to) || to === from) return;
      const entries = [...picked.entries()];
      const [moved] = entries.splice(from, 1);
      entries.splice(to, 0, moved);
      picked.clear();
      entries.forEach(([k, v]) => picked.set(k, v));
      paintChoose();
    };
    handle.addEventListener("pointerup", finish);
    handle.addEventListener("pointercancel", () => { active = false; chip.classList.remove("is-dragging"); clear(); });
  }

  // ---- ANALYSING overlay + the chart ---------------------------------------
  function runAnalysis(matches) {
    // ⭐ Đợt 237 — no dark scrim/box any more (thầy: "không có nền"), just the
    // bare word, bigger, fixed centre-screen, with ANDREW CLASSES underneath
    // stepping up-and-down letter by letter as the only "still working" cue.
    const overlay = el("div", "aw-sdh-loading");
    overlay.append(el("div", "aw-sdh-loading-box", "ANALYSING"));
    const brand = el("div", "aw-sdh-loading-brand");
    brand.setAttribute("aria-hidden", "true");
    "ANDREW CLASSES".split("").forEach((ch, i) => {
      const letter = el("i", "aw-sdh-loading-letter");
      letter.textContent = ch === " " ? " " : ch;
      letter.style.animationDelay = (i * 0.05) + "s";
      brand.append(letter);
    });
    overlay.append(brand);
    root.append(overlay);
    const t0 = Date.now();
    const entries = matches.slice().sort((a, b) => (a.at || 0) - (b.at || 0)).map(m => ({
      matchId: m.matchId, label: displayName(m), at: m.at, blocks: matchBlocks(m)
    }));
    const { full, partial } = buildAnalysisRows(entries);
    // A floor, not a real wait — there is no network round trip left to hide
    // (every match is already in `monthCache`), but a computation that
    // finishes in the same frame it started reads as if nothing happened at
    // all on a screen that just promised "ANALYSING".
    const floor = new Promise(r => setTimeout(r, Math.max(0, 550 - (Date.now() - t0))));
    floor.then(() => {
      overlay.remove();
      if (!isAlive()) return;
      openAnalysisChart(full, partial, entries);
    });
  }

  function openAnalysisChart(full, partial, entries) {
    const chart = el("div", "aw-sd-rec-chart");
    const ch = el("div", "aw-sd-rec-head");
    const ct = el("div", "aw-sd-rec-title");
    ct.append(el("span", "aw-sd-rec-word", "ANALYSIS"));
    if (curClassName) {
      const classEl = el("span", "aw-sd-rec-class");
      classEl.textContent = curClassName;                       // the teacher's own text — never innerHTML
      ct.append(classEl);
    }
    let closing = false;
    const onFsChange = () => { if (document.fullscreenElement !== chart && !closing) closeChart(); };
    function closeChart() {
      if (closing) return;
      closing = true;
      document.removeEventListener("fullscreenchange", onFsChange);
      teardownFns.delete(closeChart);
      if (document.fullscreenElement === chart) { try { document.exitFullscreen(); } catch { /* going anyway */ } }
      const a = chart.animate([{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(.97)" }],
        { duration: 150, easing: "cubic-bezier(.4,0,1,1)", fill: "forwards" });
      whenDone(a, () => chart.remove(), 260);
    }
    teardownFns.add(closeChart);
    const dlBtn = el("button", "aw-sd-rec-close", icons.download);
    dlBtn.type = "button"; dlBtn.title = "Download";
    dlBtn.onclick = () => {
      sfx.tap();
      import("./showdown-export.js").then(mod => mod.openAnalysisExportDialog({
        mount: chart, className: curClassName, at: Date.now(), full, partial, entries, toast
      }));
    };
    const backBtn = el("button", "aw-sd-rec-close", icons.close);
    backBtn.type = "button"; backBtn.title = "Close";
    backBtn.onclick = () => { sfx.back(); closeChart(); };
    ch.append(ct, dlBtn, backBtn);
    const cbody = el("div", "aw-sd-rec-cbody");
    chart.append(ch, cbody);
    cbody.append(renderChart(full, partial, entries));
    root.append(chart);
    fitPodiumNames(chart, ".aw-sd-rec-barname");
    fitChartTierLabels(chart);
    watchChartResize(chart);
    document.addEventListener("fullscreenchange", onFsChange);
    Promise.resolve().then(() => chart.requestFullscreen?.())
      .then(() => { fitPodiumNames(chart, ".aw-sd-rec-barname"); fitChartTierLabels(chart); })
      .catch(e => console.warn("AWord: fullscreen refused, showing the analysis inline", e));
    chart.animate([{ opacity: 0, transform: "scale(.97)" }, { opacity: 1, transform: "scale(1)" }],
      { duration: 180, easing: "cubic-bezier(.22,.9,.3,1)" });
  }

  // ---- one tile's detail view (Table/Podium/List + Download) ---------------
  function openTileDetail(m, ranked) {
    if (root.querySelector(".aw-sd-rec-detail")) return;
    // ⭐ Đợt 238 (thầy) — no more standalone "ANDREW CLASSES" line above the
    // header: the Table tab already draws its own (now at the BOTTOM of the
    // board — core/showdown-export.js's drawAnalysisCanvas `variant:"view"`),
    // and Podium/List never needed a second one either.
    const det = el("div", "aw-sd-rec-detail");
    const dh = el("div", "aw-sd-rec-head");
    const dt = el("div", "aw-sd-rec-title");
    const dact = el("span", "aw-sd-rec-word");
    dact.textContent = displayName(m);                          // the teacher's own text — never innerHTML
    const dsub = el("span", "aw-sd-rec-class");
    dsub.textContent = `${curClassName || ""} · ${when(m.at)}`;  // ditto
    dt.append(dact, dsub);
    let view = "table";
    const hasRows = ranked.some(b => (b.rows || []).length);
    const tableBtn = el("button", "aw-sd-rec-close is-toggle", icons.barChart);
    tableBtn.type = "button"; tableBtn.title = "Table";
    const podiumBtn = el("button", "aw-sd-rec-close is-toggle", icons.trophy);
    podiumBtn.type = "button"; podiumBtn.title = "Podium";
    const listBtn = el("button", "aw-sd-rec-close is-toggle", icons.assignment);
    listBtn.type = "button"; listBtn.title = "List"; listBtn.disabled = !hasRows;
    const dlBtn = el("button", "aw-sd-rec-close", icons.download);
    dlBtn.type = "button"; dlBtn.title = "Download";
    dlBtn.onclick = () => {
      sfx.tap();
      import("./showdown-export.js").then(mod => mod.openExportDialog({
        mount: det, ranked, className: curClassName, actName: displayName(m), at: m.at,
        defaultType: view, hasRows, toast
      }));
    };
    const back = el("button", "aw-sd-rec-close", icons.close);
    back.type = "button"; back.title = "Close";
    let closing = false;
    const onFsChange = () => { if (document.fullscreenElement !== det && !closing) closeDetail(); };
    function closeDetail() {
      if (closing) return;
      closing = true;
      document.removeEventListener("fullscreenchange", onFsChange);
      teardownFns.delete(closeDetail);
      if (document.fullscreenElement === det) { try { document.exitFullscreen(); } catch { /* going anyway */ } }
      const a = det.animate([{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(.97)" }],
        { duration: 150, easing: "cubic-bezier(.4,0,1,1)", fill: "forwards" });
      whenDone(a, () => det.remove(), 260);
    }
    teardownFns.add(closeDetail);
    back.onclick = () => { sfx.back(); closeDetail(); };
    dh.append(dt, tableBtn, podiumBtn, listBtn, dlBtn, back);
    const dbody = el("div", "aw-sd-rec-dbody");
    det.append(dh, dbody);
    const picks = new Map();
    function paintViewBtns() {
      tableBtn.classList.toggle("is-on", view === "table");
      podiumBtn.classList.toggle("is-on", view === "podium");
      listBtn.classList.toggle("is-on", view === "list");
    }
    function paint() {
      dbody.innerHTML = "";
      if (!hasRows && view === "list") view = "table";
      if (!hasRows && view !== "podium") {
        dbody.append(el("div", "aw-sd-rec-note", "The answers for this match were not kept — here is the ranking."));
        dbody.append(renderReviewPodium(ranked, { showTeam: true, picks }));
      } else if (view === "table") {
        dbody.append(renderReviewTable(ranked, [curClassName, displayName(m)].filter(Boolean).join(" • ")));
      } else if (view === "podium") {
        dbody.append(renderReviewPodium(ranked, { showTeam: true, picks }));
      } else {
        dbody.append(renderReviewList(ranked, { showTeam: true }));
      }
      fitPodiumNames(dbody);
    }
    const setView = v => { if (view === v) return; view = v; sfx.tap(); paintViewBtns(); paint(); };
    tableBtn.onclick = () => setView("table");
    podiumBtn.onclick = () => setView("podium");
    listBtn.onclick = () => setView("list");
    paintViewBtns(); paint();
    root.append(det);
    document.addEventListener("fullscreenchange", onFsChange);
    Promise.resolve().then(() => det.requestFullscreen?.())
      .then(() => fitPodiumNames(dbody))
      .catch(e => console.warn("AWord: fullscreen refused, showing the detail inline", e));
    det.animate([{ opacity: 0, transform: "scale(.97)" }, { opacity: 1, transform: "scale(1)" }],
      { duration: 180, easing: "cubic-bezier(.22,.9,.3,1)" });
  }

  // ---- a small confirm popover, same shape as core/showdown-setup.js's askConfirm ----
  function confirmDialog(text, okLabel, onOk) {
    const mountTo = document.fullscreenElement || root;
    if (mountTo.querySelector(".aw-sd-confirm")) return;
    const layer = el("div", "aw-sd-confirm");
    const box = el("div", "aw-sd-confirmbox");
    const msg = el("div", "aw-sd-confirmtext");
    msg.textContent = text;                                     // may embed a renamed match's own text — never innerHTML
    box.append(msg);
    const row = el("div", "aw-sd-confirmrow");
    const close = () => {
      const a = layer.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, easing: "ease-in", fill: "forwards" });
      whenDone(a, () => layer.remove(), 240);
    };
    const cancel = el("button", "aw-sd-ghost aw-sd-confirmbtn", "Cancel");
    cancel.type = "button"; cancel.onclick = () => { sfx.back(); close(); };
    const ok = el("button", "aw-btn-primary aw-sd-confirmbtn", okLabel);
    ok.type = "button"; ok.onclick = () => { close(); onOk(); };
    row.append(cancel, ok);
    box.append(row);
    layer.append(box);
    mountTo.append(layer);
    layer.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, easing: "ease-out" });
    box.animate([{ transform: "scale(.94)" }, { transform: "scale(1)" }], { duration: 200, easing: "cubic-bezier(.22,.9,.3,1)" });
  }

  // ---- boot -----------------------------------------------------------------
  paintTitle();
  loadClass();

  return {
    dispose: teardownAll,
    setClass(id, name) { selectClass(id, name); },
    // ⭐ Đợt 237 — called by core/main.js's topbar icon (the same gold button
    // that opened this page) on a second tap, so ANALYSE has no button of its
    // own on this page's toolbar any more.
    toggleChoosing() { toggleChoosing(); }
  };
}
