// =============================================================
// RUNNING WORD — the three paper sheets, printed in ONE run.
//
//   Page 1  PART A   — team A's 50 words in ONE column: №  ·  WORD  ·  TURN box
//   Page 2  PART B   — team B's list, same shape
//   Page 3  CHECK    — the referee's sheet, the only two-column one:
//                      №  ·  TEAM A's list   beside   №  ·  TEAM B's list
//
// This is a rebuild of the three sheets Teacher Andrew used to print out of the
// `RunningW` spreadsheet tab, so the paper the class holds matches the game on
// screen row for row.
//
// WHY THIS DOESN'T LIVE IN core/print.js: that module is the shared 4-format
// worksheet printer (Anagram / Crossword / Quiz / Unjumble) driven by the Print
// button under the frame, and it normalises every activity down to
// {clue, answer, options} — a shape this game has no use for. Adding a fifth
// format there would mean editing a core file every template shares, which the
// core contract forbids. Instead the sheets are built here and printed from the
// game's own setup screen. It reuses core's print PLUMBING for free, though:
// appending a `.aw-print-sheet` next to #app is exactly what core/app.css
// already hides on screen and reveals inside @media print (with #app hidden).
//
// EVERYTHING IS SIZED IN mm, not cqw: a printed page has no container-query
// ancestor, and mm is the only unit that means the same thing on paper as it
// does in the layout maths below. Row height is computed from the word count so
// 20 words fill the page comfortably and 60 still fit on ONE page.
// =============================================================

import { el } from "../../core/utils.js";

// A4 minus the @page margins declared below — the height the rows may occupy
// once the sheet's own heading block is taken off.
const PAGE_BODY_MM = 297 - 15 - 13;     // 269mm between the top and bottom margins
// Heading block shrunk to a minimum (teacher's request, 5/8/2026 — every mm
// not spent on the heading goes to the words): small tag + subtitle (≈11mm)
// plus the table's head row (≈3mm) plus ~2mm of slack so a rounded border or
// font metric never pushes the last row onto a second sheet — the earlier
// design (25mm) learned that lesson the hard way at exactly 0 slack.
const HEADING_MM = 16;
const ROWS_MM = PAGE_BODY_MM - HEADING_MM;
// ⭐ ONE COLUMN, ALWAYS (teacher's request, 5/8/2026). PART A and PART B are a
// single running list down the page — 50 words means 50 rows in one column, and
// the row height simply divides the page between them. The earlier version
// flowed the list into TWO CSS columns once the rows got shorter than ~5.2mm
// (which a full 50-word list always did) to keep the type big; the teacher
// reads these lists top-to-bottom against the on-screen numbering and wants the
// straight single column instead. Two columns now appear on the CHECK sheet
// only, where they mean something different: TEAM A's list beside TEAM B's.
//
// ⚠️ Removing the 2-column branch also fixes a real bug it was hiding: the
// CHECK page called this same helper and got back the row height computed for
// TWO columns (10.12mm for 50 words) while rendering ONE — so a 50-word CHECK
// sheet was 506mm of rows on a 253mm page and silently spilled onto a fourth
// piece of paper.
//
// The floor below never bites at the 50-word-per-team cap (a full sheet lands
// at 5.06mm ≈ 9pt); it is there so an oversized hand-made pool degrades into a
// second page rather than into type nobody can read. There is NO upper cap
// (teacher's request, 5/8/2026): a short list fills the whole page with the
// biggest type that fits instead of stopping at a fixed size.
const ROW_MIN_MM = 4.2;

// Row height + font size for `count` rows in one column on ONE page.
function metrics(count) {
  const rowH = Math.max(ROW_MIN_MM, ROWS_MM / Math.max(1, count));
  // The word takes up more of the row (was 0.50): "minimal gap from the word
  // to the divider line" (teacher's request, 5/8/2026).
  return { rowH, fs: +(rowH * 0.62).toFixed(2) };
}

// ---------- public entry ----------
// `set` = { a:[...], b:[...] }, `names` = { a:"TEAM A", b:"TEAM B" }.
export function printRunningSheets(activity, set, names = {}) {
  const teamA = (names.a || "TEAM A").toUpperCase();
  const teamB = (names.b || "TEAM B").toUpperCase();
  const title = activity?.title || "Running word";

  const sheet = el("div", "aw-print-sheet aw-rw-print");
  sheet.append(pageStyle());
  sheet.append(listPage(title, "PART A", teamA, set.a));
  sheet.append(listPage(title, "PART B", teamB, set.b));
  sheet.append(checkPage(title, teamA, teamB, set));

  document.body.append(sheet);

  // Same teardown contract as core/print.js: afterprint, plus a long fallback
  // because afterprint occasionally never fires (and a stuck sheet would sit
  // invisibly in the DOM for the rest of the session).
  let done = false;
  const cleanup = () => {
    if (done) return;
    done = true;
    sheet.remove();
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
  setTimeout(() => window.print(), 60);    // let the sheet lay out first
  setTimeout(cleanup, 120000);
  return cleanup;
}

// @page owns the paper size, the margins and the page counter. Injected per
// print run (same trick as core/print.js) rather than living in the stylesheet,
// because these values only make sense while these sheets exist.
function pageStyle() {
  const style = document.createElement("style");
  style.textContent = `
    @page {
      size: A4;
      margin: 15mm 12mm 13mm;
      @bottom-right {
        content: counter(page) "/" counter(pages);
        font-family: "Baloo 2", "Segoe UI", Arial, sans-serif;
        font-weight: 700; font-size: 9pt; color: #8a97a8;
      }
      @bottom-left {
        content: "AWord · Running word";
        font-family: "Baloo 2", "Segoe UI", Arial, sans-serif;
        font-weight: 700; font-size: 8pt; color: #9aa4af;
      }
    }
  `;
  return style;
}

function heading(title, tag, subtitle, extra) {
  const head = el("div", "aw-rw-ps-head");
  const left = el("div", "aw-rw-ps-headleft");
  left.append(el("div", "aw-rw-ps-tag", escapeHtml(tag)));
  left.append(el("div", "aw-rw-ps-sub", escapeHtml(subtitle)));
  head.append(left);
  const right = el("div", "aw-rw-ps-headright");
  right.append(el("div", "aw-rw-ps-title", escapeHtml(title)));
  if (extra) right.append(el("div", "aw-rw-ps-extra", extra));
  head.append(right);
  return head;
}

// One team's sheet: № · WORD · TURN. TURN is an empty box the explainer ticks
// as each word is typed correctly (teacher's confirmation, 4/8/2026).
function listPage(title, tag, teamName, words) {
  const { rowH, fs } = metrics(words.length);
  const page = el("div", "aw-rw-ps-page");
  page.append(heading(title, tag, teamName, "Explainer: ______________"));

  const body = el("div", "aw-rw-ps-body");
  body.style.setProperty("--rw-rowh", rowH + "mm");
  body.style.setProperty("--rw-fs", fs + "mm");

  const table = el("div", "aw-rw-ps-table");
  const th = el("div", "aw-rw-ps-row is-head");
  th.append(el("span", "aw-rw-ps-c-no", "№"),
            el("span", "aw-rw-ps-c-word", "WORD"),
            el("span", "aw-rw-ps-c-turn", "TURN"));
  table.append(th);
  words.forEach((w, i) => {
    const row = el("div", "aw-rw-ps-row");
    row.append(el("span", "aw-rw-ps-c-no", String(i + 1)),
               el("span", "aw-rw-ps-c-word", escapeHtml(String(w).toUpperCase())),
               el("span", "aw-rw-ps-c-turn", '<span class="aw-rw-ps-box"></span>'));
    table.append(row);
  });
  body.append(table);
  page.append(body);
  return page;
}

// The referee's sheet — both lists row by row, so the teacher can check either
// team's current word without shuffling papers. Each team gets its OWN №
// column (5/8/2026, teacher's request): the two lists just happen to share a
// row index from how buildSets() laid them out, they aren't a matched pair,
// so reading down either team's column needs its own numbering.
function checkPage(title, teamA, teamB, set) {
  const n = Math.max(set.a.length, set.b.length);
  const { rowH, fs } = metrics(n);
  const page = el("div", "aw-rw-ps-page is-last");
  page.append(heading(title, "CHECK", "TEACHER / REFEREE", "Date: ______________"));

  const body = el("div", "aw-rw-ps-body");
  body.style.setProperty("--rw-rowh", rowH + "mm");
  body.style.setProperty("--rw-fs", fs + "mm");

  const table = el("div", "aw-rw-ps-table is-check");
  const th = el("div", "aw-rw-ps-row is-head");
  th.append(el("span", "aw-rw-ps-c-no", "№"),
            el("span", "aw-rw-ps-c-team", escapeHtml(teamA)),
            el("span", "aw-rw-ps-c-no", "№"),
            el("span", "aw-rw-ps-c-team", escapeHtml(teamB)));
  table.append(th);
  for (let i = 0; i < n; i++) {
    const row = el("div", "aw-rw-ps-row");
    row.append(el("span", "aw-rw-ps-c-no", set.a[i] != null ? String(i + 1) : ""),
               el("span", "aw-rw-ps-c-team", escapeHtml(String(set.a[i] || "").toUpperCase())),
               el("span", "aw-rw-ps-c-no", set.b[i] != null ? String(i + 1) : ""),
               el("span", "aw-rw-ps-c-team", escapeHtml(String(set.b[i] || "").toUpperCase())));
    table.append(row);
  }
  body.append(table);
  page.append(body);
  return page;
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
