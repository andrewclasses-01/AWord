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
// WHY TWO COLUMNS ABOVE 28 WORDS (and why Running word's sheets are not):
// Running word's PART A/B are read top-to-bottom against the on-screen order,
// so a straight single column is right there. Here nobody ever reads downwards
// — they jump to one number. Two columns buys roughly double the type size on a
// 50-100 word pool, which is exactly what a fast lookup needs.
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
// The heading block measures ~12mm (5mm tag + 3mm subtitle + 1.4mm padding +
// 2.4mm margin). The rest is DELIBERATE SLACK. The row maths below divides the
// remaining height EXACTLY between the rows, so with a tight budget any small
// real-world excess — a rounded border, a font metric, a printer driver that
// rounds a margin up — lands the final row on a second sheet. Running word's
// sheets learned this at 0mm slack (rw-print.js). Nothing here can measure the
// printed page from JS: these rules live inside `@media print`, so on screen
// they simply do not apply and any DOM measurement of them is measuring the
// wrong layout. Slack is the only defence, and 9mm costs ~0.36mm per row on a
// full 25-row column — invisible on paper.
const HEADING_MM = 21;
const ROWS_MM = PAGE_BODY_MM - HEADING_MM;
const ROW_MIN_MM = 4.2;                   // ~7.5pt — below this nobody can scan it standing up
const TWO_COL_FROM = 29;                  // 28 words still look better as one tall column

// Row height + font size for `count` rows laid out in `cols` columns on ONE page.
// `cols` is a PARAMETER, never assumed — see the trap in the file header.
function metrics(count, cols) {
  const perCol = Math.ceil(Math.max(1, count) / cols);
  const rowH = Math.max(ROW_MIN_MM, ROWS_MM / perCol);
  return { rowH, fs: +(rowH * 0.58).toFixed(2), perCol };
}

// ---------- public entry ----------
// `order` = the printed numbering (index 0 is №1), `info` = { title, className }.
export function printRunningTeamSheet(order, info = {}) {
  const words = (order || []).map(w => String(w));
  const title = info.title || "Running team";
  const className = info.className || "";
  const cols = words.length >= TWO_COL_FROM ? 2 : 1;
  const { rowH, fs } = metrics(words.length, cols);

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
  right.append(el("div", "aw-rt-ps-extra", `${words.length} words · Date: ______________`));
  head.append(right);
  page.append(head);

  // -- rows --
  const body = el("div", "aw-rt-ps-body");
  body.style.setProperty("--rt-rowh", rowH + "mm");
  body.style.setProperty("--rt-fs", fs + "mm");

  const table = el("div", "aw-rt-ps-table" + (cols === 2 ? " is-two" : ""));
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
