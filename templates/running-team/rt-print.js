// =============================================================
// RUNNING TEAM — the one paper sheet the class passes around.
//
//   №  ·  WORD          numbered exactly as the game numbers them
//
// The screen calls "MINH ANH — 23"; whoever is holding this sheet finds row 23
// and reads that word out. So this is a LOOKUP sheet, not a reading list: it is
// scanned at speed, under pressure, standing up, by a child. Legibility of a
// single row beats everything else about its design.
//
// WHY ALWAYS 3 COLUMNS (Đợt 109, teacher's call — was 1 or 2 depending on pool
// size until then): nobody ever reads this sheet top-to-bottom — they jump
// straight to one number — so there is no reason to keep a column tall and
// narrow. Three columns means fewer rows per column for the same pool, which
// buys a bigger row (and so a bigger word) than two columns did, at the cost
// of a narrower column — see the WIDTH GUARD below for why that cost is
// bounded rather than left to silently ellipsis a word.
//
// ⚠️ THE MATHS TRAP RUNNING WORD ALREADY PAID FOR ONCE (rw-print.js, 5/8/2026):
// its CHECK page asked a helper for a row height that had been computed for TWO
// columns, then rendered ONE — 50 words became 506mm of rows on a 253mm page and
// silently spilled onto a fourth sheet. Nobody noticed for days, because the
// only symptom is on paper. So here `metrics()` TAKES the column count and the
// single caller passes the same value it renders with. If you ever add a second
// layout, pass its real column count too.
//
// WHY THIS DOESN'T LIVE IN core/print.js: that module is the shared four-format
// worksheet printer, and it normalises every activity down to {clue, answer,
// options} — a shape this sheet has no use for. Adding a fifth format there
// means editing a core file every template shares, which the core contract
// forbids. The sheet is built here and printed from the game's own setup screen,
// but it still reuses core's print PLUMBING for free: appending a
// `.aw-print-sheet` next to #app is exactly what core/app.css already hides on
// screen and reveals inside @media print (with #app hidden).
//
// EVERYTHING IS SIZED IN mm. A printed page has no container-query ancestor, so
// cqw means nothing here; mm is the only unit that means the same thing on paper
// as it does in the maths below.
// =============================================================

import { el } from "../../core/utils.js";

// A4 minus the @page margins declared below.
const PAGE_BODY_MM = 297 - 15 - 13;      // 269mm between the top and bottom margins
// The heading block measures ~10.6mm (5mm tag + 3mm subtitle + 1mm padding +
// 1.6mm margin — both trimmed from Đợt 109's 1.4/2.4mm, Đợt 117: "less
// spacing, more space for the words"). The rest is DELIBERATE SLACK against
// the HEADING only (a 2-line title, a rounded border) — it does NOT cover the
// row maths below. Nothing here can measure the printed page from JS: these
// rules live inside `@media print`, so on screen they simply do not apply and
// any DOM measurement of them is measuring the wrong layout.
const HEADING_MM = 17;
// ⭐ 14/9/2026 — real A4 print (Teacher Andrew's first, mục 11 "VIỆC ĐANG
// CHỜ" of GHI CHU RUNNING-TEAM.md): an 85-word pool printed with the LAST row
// of both full 29-row columns sliced off at the page's bottom edge, while the
// short 27-row third column printed whole. Cause is the same one rw-print.js
// paid for on 19/8/2026 and this file's own header (mục 19-25) only quoted
// the FIRST half of: `rowH = ROWS_MM / perCol` divides the page's height
// EXACTLY (zero slack) across the rows, but a text line's rendered glyphs
// stand proud of its own CSS line box (a font metric, not a bug) even though
// `.aw-rt-ps-c-word` clips it visually with `overflow: hidden` — Chromium's
// page-break maths still reserves the taller, unclipped box, so the ONE exact
// division above leaves nowhere for that overhang to go: the last row of a
// FULL column lands right on the page's bottom edge and gets sliced off
// there instead of flowing onto a second sheet (this sheet has no page-2
// fallback). Reserving a fraction of a row below fixes it without shrinking
// the type anyone can see; the heading's own slack above is a different
// budget and was never enough for this on its own (it protects the heading
// block, not the 29th row of a column nowhere near the heading).
// Derived the same way rw-print.js measured for this same font ("Baloo 2"
// bold, content area ≈1.58em vs a line-height of 1/FS_HEIGHT_RATIO em): at
// FS_HEIGHT_RATIO 0.8 that's (1.58 - 1/0.8)/2 = 0.165em of overhang, i.e.
// 0.165/1.25 ≈ 0.132 of a row — rounded up with the same "third to spare"
// margin rw-print.js used (0.132 × 4/3 ≈ 0.18).
const OVERHANG_ROWS = 0.18;
const ROWS_MM = PAGE_BODY_MM - HEADING_MM;
const ROW_MIN_MM = 4.2;                   // ~7.5pt — below this nobody can scan it standing up
const COLS = 3;                           // always 3 (Đợt 109) — see file header

// Font size as a fraction of the row's height. 0.58 -> 0.74 at Đợt 109,
// -> 0.8 at Đợt 117 (teacher's repeat request: "max size, don't need much
// spacing") — the ruled line sits at the BOTTOM of a row whose height is
// `line-height`, so a bigger fraction is simultaneously a bigger word and a
// smaller gap above that line. The WIDTH GUARD below still wins whenever a
// pool's longest word would otherwise get ellipsised, so this only makes
// text bigger in the (common) case where height, not width, is the limit.
const FS_HEIGHT_RATIO = 0.8;

// ---------- WIDTH GUARD ----------
// The height-only maths above has no idea how WIDE a column is — fine when
// there were 1-2 fat columns, but always-3-columns (Đợt 109) makes each one
// roughly a third of the page, and `.aw-rt-ps-c-word` truncates with an
// ellipsis on overflow. An ellipsised word on a sheet whose entire point is
// "read this exact spelling out loud" is a wrong answer on paper, not a
// cosmetic clip — so the font size actually used is capped to whatever the
// LONGEST word in this pool can still fit on one line, and the height-driven
// size only wins when it is the smaller (i.e. tighter) of the two.
const PAGE_WIDTH_MM = 210;                // A4 portrait
const PAGE_MARGIN_LR_MM = 12;             // matches the @page rule below
// Đợt 117: the three gaps below are trimmed (7/9/2.4 -> 5/7.5/1.8mm) to hand
// more of each column's width back to the word itself — CHAR_WIDTH_EM and
// WORD_SAFETY_MM are left untouched, so the guarantee that a word never gets
// ellipsised doesn't get any looser, it just has a wider column to work with.
const COL_GAP_MM = 5;                     // matches .aw-rt-ps-table column-gap
const NO_COL_MM = 7.5;                    // matches .aw-rt-ps-c-no flex-basis
const NO_GAP_MM = 1.8;                    // matches .aw-rt-ps-row gap
const WORD_SAFETY_MM = 2;                 // rounding/margin-of-error buffer — unchanged
// Rough average glyph advance for BOLD UPPERCASE "Baloo 2" as a fraction of
// its own font-size — an estimate, not a measured metric (no canvas access
// from inside @media print), deliberately generous enough that the real
// worst case still clears it comfortably.
const CHAR_WIDTH_EM = 0.62;

function wordColumnWidthMm(cols) {
  const usable = PAGE_WIDTH_MM - PAGE_MARGIN_LR_MM * 2 - COL_GAP_MM * (cols - 1);
  return Math.max(10, usable / cols - NO_COL_MM - NO_GAP_MM - WORD_SAFETY_MM);
}

// Row height + font size for `count` rows of `cols` columns on ONE page.
// `cols` is a PARAMETER, never assumed — see the trap in the file header.
// `longestWord` is the pool's longest entry, used only to keep that one word
// (and so every shorter one) from being ellipsised.
function metrics(count, cols, longestWord) {
  const perCol = Math.ceil(Math.max(1, count) / cols);
  // + OVERHANG_ROWS reserves a fraction of a row so the LAST row of a full
  // column never touches the page's true bottom edge — see the const above.
  const rowH = Math.max(ROW_MIN_MM, ROWS_MM / (perCol + OVERHANG_ROWS));
  const fsByHeight = rowH * FS_HEIGHT_RATIO;
  const chars = Math.max(1, String(longestWord || "").length);
  const fsByWidth = wordColumnWidthMm(cols) / (chars * CHAR_WIDTH_EM);
  const fs = Math.max(ROW_MIN_MM * 0.5, Math.min(fsByHeight, fsByWidth));
  return { rowH, fs: +fs.toFixed(2), perCol };
}

function fmtPrintDate(d) {
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

// ---------- public entry ----------
// `order` = the printed numbering (index 0 is №1), `info` = { title, className }.
export function printRunningTeamSheet(order, info = {}) {
  const words = (order || []).map(w => String(w));
  const title = info.title || "Running team";
  const className = info.className || "";
  const cols = COLS;
  const longestWord = words.reduce((best, w) => w.length > best.length ? w : best, "");
  const { rowH, fs } = metrics(words.length, cols, longestWord);

  const sheet = el("div", "aw-print-sheet aw-rt-print");
  sheet.append(pageStyle());

  const page = el("div", "aw-rt-ps-page");

  // -- heading --
  const head = el("div", "aw-rt-ps-head");
  const left = el("div", "aw-rt-ps-headleft");
  left.append(el("div", "aw-rt-ps-tag", "WORD LIST"));
  left.append(el("div", "aw-rt-ps-sub",
    escapeHtml(className ? `CLASS ${className.toUpperCase()}` : "PASS THIS SHEET AROUND")));
  head.append(left);
  const right = el("div", "aw-rt-ps-headright");
  right.append(el("div", "aw-rt-ps-title", escapeHtml(title)));
  right.append(el("div", "aw-rt-ps-extra", `${words.length} words · Date: ${fmtPrintDate(new Date())}`));
  head.append(right);
  page.append(head);

  // -- rows --
  const body = el("div", "aw-rt-ps-body");
  body.style.setProperty("--rt-rowh", rowH + "mm");
  body.style.setProperty("--rt-fs", fs + "mm");

  const table = el("div", "aw-rt-ps-table");
  words.forEach((w, i) => {
    const row = el("div", "aw-rt-ps-row");
    row.append(el("span", "aw-rt-ps-c-no", String(i + 1)),
               el("span", "aw-rt-ps-c-word", escapeHtml(w.toUpperCase())));
    table.append(row);
  });
  body.append(table);
  page.append(body);
  sheet.append(page);

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
  setTimeout(() => window.print(), 60);      // let the sheet lay out first
  setTimeout(cleanup, 120000);
  return cleanup;
}

// @page owns the paper size, the margins and the page counter. Injected per
// print run (same trick as core/print.js) rather than living in the stylesheet,
// because these values only make sense while this sheet exists.
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
        content: "AWord · Running team";
        font-family: "Baloo 2", "Segoe UI", Arial, sans-serif;
        font-weight: 700; font-size: 8pt; color: #9aa4af;
      }
    }
  `;
  return style;
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
