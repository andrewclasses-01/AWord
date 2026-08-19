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
// There is NO table head row any more (teacher's request, 7/8/2026 — reclaim
// its ~3mm for the words) and no "Explainer" line, so the heading block is just
// the small tag + subtitle plus a little slack against a rounded border pushing
// the last row onto a second sheet.
const HEADING_MM = 12;
// ⭐ 18/8/2026 — SLACK, measured rather than guessed. The budget above is a round
// number for a block that really measures 12.09mm on PART A/B and 12.75mm on
// CHECK (its extra line), so "rows = 269 − 12" filled the sheet to 269.07mm /
// 269.73mm — past the 269mm A4 body by a hair, and a hair is all Chromium needs
// to open a new page. 2.5mm off the rows costs 0.06mm of row height on a 40-word
// sheet (invisible) and buys a margin no font metric can eat. The other half of
// that blank-page bug was the row's line box overhanging the row itself — see
// `line-height` in running-word.css @media print.
const SAFETY_MM = 2.5;
const ROWS_MM = PAGE_BODY_MM - HEADING_MM - SAFETY_MM;
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

// ⭐ 19/8/2026 — ROOM FOR THE GLYPHS THAT HANG OUT OF THE LINE BOX. Đợt 193 stopped
// the blank pages for a FULL list but not for a SHORT one: 8..16 words per team
// still printed 4 pages, the 4th carrying nothing but the running head and foot
// (measured through Chromium's own print engine: 8/10/12/14/16 words -> 4 pages,
// 18/20/30/40/50 -> 3).
//
// WHY, measured rather than guessed (19/8/2026, myActivity's print preview + CDP):
// with the SAME row height but the type shrunk to 60%, the 4th page disappears —
// so it is the LETTERS that spill, not the row boxes (every box measures exactly
// `--rw-rowh`, and the sheet block measures 266.6mm inside a 269mm page body).
// Đợt 193 tied `line-height` to the row height, which fixes the box; it cannot fix
// the em box. This font's content area is ~1.58em while the line box is only
// `rowH` = 1/0.78 = 1.282em of type, so the glyphs stand (1.58-1.282)/2 = 0.149em
// PROUD of the line box, top and bottom. Fewer words -> taller rows -> bigger type
// -> a bigger overhang, and the last row's overhang is what pokes through the
// bottom of the sheet and buys a whole extra sheet of paper:
//   16 words: type 12.28mm -> overhang ~1.83mm vs 1.75mm of slack -> SPILLS
//   18 words: type 11.03mm -> overhang ~1.64mm vs 1.75mm of slack -> fits
// So the reserve cannot be a fixed number of mm the way `SAFETY_MM` is; it has to
// scale with the row. 0.149em of type is 0.116 of a row (0.149 x 0.78), and the
// value below is that with a third to spare. Cost at the 50-word cap: row 5.09mm
// -> 5.07mm, i.e. 0.02mm — nothing an eye can find.
// ⚠️ Do NOT "fix" this by shrinking the type ratio (0.78) instead: the teacher
// asked for the biggest words that fit (7/8/2026), and 1.58em of type would need
// a ratio of 0.63 — visibly smaller words on every sheet, to cure a fault that
// only ever shows on the last row.
const OVERHANG_ROWS = 0.16;

// Row height + font size for `count` rows in one column on ONE page.
function metrics(count) {
  const rowH = Math.max(ROW_MIN_MM, ROWS_MM / (Math.max(1, count) + OVERHANG_ROWS));
  // Bigger type filling the row (teacher's request, 7/8/2026 — was 0.62): the
  // words sit as large as possible with a minimal gap down to the divider line.
  return { rowH, fs: +(rowH * 0.78).toFixed(2) };
}

// A word's IPA, rendered next to it as "WORD • /ipa/" — the dot separator and
// the smaller/lighter/thinner IPA styling are declared once in running-word.css
// (`.aw-rw-ps-ipa`, @media print) and shared by every sheet below. A word with
// no IPA in the pool (or no `ipaMap` passed at all — every caller now passes
// one, but this keeps an old call site from throwing) just prints bare, same
// as before IPA existed.
function wordCellHtml(word, ipaMap) {
  const base = escapeHtml(String(word).toUpperCase());
  const ipa = ipaMap?.get ? ipaMap.get(String(word).toUpperCase()) : null;
  if (!ipa) return base;
  return `${base} <span class="aw-rw-ps-ipa">• ${escapeHtml(ipa)}</span>`;
}

// ---------- public entry ----------
// `set` = { a:[...], b:[...] }, `names` = { a:"TEAM A", b:"TEAM B" },
// `ipaMap` = Map<UPPER_WORD, ipa> from rw-sets.js's ipaFrom() (11/8/2026).
export function printRunningSheets(activity, set, names = {}, setNo = 1, ipaMap = new Map()) {
  const title = activity?.title || "Running word";
  // The team name is gone from the sheets (teacher's request, 7/8/2026); every
  // sheet is tagged with its SET number instead so a printout can be traced
  // back to the split it belongs to.
  const setTag = `SET ${setNo}`;

  const sheet = el("div", "aw-print-sheet aw-rw-print");
  sheet.append(pageStyle());
  sheet.append(listPage(title, "PART A", setTag, set.a, ipaMap));
  sheet.append(listPage(title, "PART B", setTag, set.b, ipaMap));
  sheet.append(checkPage(title, setTag, set, ipaMap));

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
// as each word is typed correctly (teacher's confirmation, 4/8/2026). No header
// row and no "Explainer" line any more (teacher's request, 7/8/2026) — every mm
// goes to bigger words; the columns are the same, just unlabelled.
function listPage(title, tag, subtitle, words, ipaMap) {
  const { rowH, fs } = metrics(words.length);
  const page = el("div", "aw-rw-ps-page");
  page.append(heading(title, tag, subtitle, null));

  const body = el("div", "aw-rw-ps-body");
  body.style.setProperty("--rw-rowh", rowH + "mm");
  body.style.setProperty("--rw-fs", fs + "mm");

  const table = el("div", "aw-rw-ps-table");
  words.forEach((w, i) => {
    const row = el("div", "aw-rw-ps-row");
    row.append(el("span", "aw-rw-ps-c-no", String(i + 1)),
               el("span", "aw-rw-ps-c-word", wordCellHtml(w, ipaMap)),
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
function checkPage(title, subtitle, set, ipaMap) {
  const n = Math.max(set.a.length, set.b.length);
  const { rowH, fs } = metrics(n);
  const page = el("div", "aw-rw-ps-page is-last");
  page.append(heading(title, "CHECK", subtitle, "Date: ______________"));

  const body = el("div", "aw-rw-ps-body");
  body.style.setProperty("--rw-rowh", rowH + "mm");
  body.style.setProperty("--rw-fs", fs + "mm");

  // No header row (teacher, 7/8/2026). Still two columns — PART A's list beside
  // PART B's — each with its own № column.
  const table = el("div", "aw-rw-ps-table is-check");
  for (let i = 0; i < n; i++) {
    const row = el("div", "aw-rw-ps-row");
    row.append(el("span", "aw-rw-ps-c-no", set.a[i] != null ? String(i + 1) : ""),
               el("span", "aw-rw-ps-c-team", set.a[i] != null ? wordCellHtml(set.a[i], ipaMap) : ""),
               el("span", "aw-rw-ps-c-no", set.b[i] != null ? String(i + 1) : ""),
               el("span", "aw-rw-ps-c-team", set.b[i] != null ? wordCellHtml(set.b[i], ipaMap) : ""));
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
