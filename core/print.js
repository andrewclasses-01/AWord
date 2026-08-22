// =============================================================
// PRINT — paper worksheets (100% English product). GENERIC across templates.
//
// Clicking the Print button opens a small popup to pick a print FORMAT:
//   Anagram · Crossword · Quiz · Unjumble
// Which formats are offered depends on the activity type + question count:
//   • Anagram  — every template, any number of questions
//   • Quiz     — every template, any number of questions
//   • Crossword— 2..35 questions, every template EXCEPT "type-the-answer"
//   • Unjumble — only "type-the-answer", any number of questions
// Formats that don't apply simply don't show an icon.
//
// A format renders a printable sheet from a NORMALISED item list
// ({clue, answer, options}) that each template can provide via
// `template.toPrintItems(activity)` (falls back to quiz-shaped content).
// Output is pure grayscale (prints fine in black & white) and defaults to
// A4 via @page (see core/app.css). Double-sided is a printer-dialog choice
// the browser can't set from a web page — the popup notes this.
//
// CROSSWORD builds its OWN interlocking grid from the item answers
// (buildCrosswordGrid below) — deliberately a SEPARATE, smaller copy of
// templates/crossword/crossword.js's builder, not an import from it. This
// file is core (every template's Print button reaches it), and the crossword
// TEMPLATE module drags in its own editor/keyboard/voice/sound modules that
// no other template needs — importing from it here would pull all of that
// into core for every act, not just ones the teacher opens as Crossword. The
// print version also drops what only the live game needs: `src` identity
// (for "Start with mistakes" filtering) and the random shuffle/tie-break that
// varies the on-screen puzzle across "Start again" — a worksheet should print
// the SAME puzzle every time it's generated, so placement here is a stable
// longest-word-first sort with no randomness at all.
// =============================================================

import { getTemplate } from "./registry.js";
import { shuffle, el } from "./utils.js";
import { icons } from "./icons.js";
import { sound } from "./sound.js";

const FORMAT_META = {
  anagram:   { label: "Anagram",   icon: icons.fmtAnagram },
  crossword: { label: "Crossword", icon: icons.fmtCrossword },
  quiz:      { label: "Quiz",      icon: icons.fmtQuiz },
  unjumble:  { label: "Unjumble",  icon: icons.fmtUnjumble }
};
// Order shown in the popup (teacher's order): Anagram, Crossword, Quiz, Unjumble.
const FORMAT_ORDER = ["anagram", "crossword", "quiz", "unjumble"];

// ---------- public entry (called by core/engine.js Print button) ----------
export function openPrintPopup(activity) {
  const formats = eligibleFormats(activity);

  const overlay = el("div", "aw-print-pop-overlay");
  const box = el("div", "aw-print-pop");
  box.append(el("div", "aw-print-pop-head", "Print"));

  if (formats.length === 0) {
    box.append(el("div", "aw-print-pop-empty", "Add some questions first, then you can print."));
  } else {
    const row = el("div", "aw-print-pop-row");
    const note = el("div", "aw-print-pop-note",
      "Paper A4 &middot; black &amp; white. Pick <b>double-sided</b> in your printer dialog.");
    formats.forEach(f => {
      const meta = FORMAT_META[f];
      const btn = el("button", "aw-print-pop-btn" + (meta.comingSoon ? " is-soon" : ""));
      btn.type = "button";
      btn.append(el("span", "aw-print-pop-icon", meta.icon), el("span", "aw-print-pop-label", meta.label));
      if (meta.comingSoon) btn.append(el("span", "aw-print-pop-soon", "soon"));
      btn.onclick = () => {
        sound.click();
        if (meta.comingSoon) { note.innerHTML = `<b>${meta.label}</b> — coming soon.`; return; }
        close();
        runPrint(activity, f);
      };
      row.append(btn);
    });
    box.append(row, note);
  }

  overlay.append(box);
  overlay.onclick = ev => { if (ev.target === overlay) close(); };
  document.body.append(overlay);
  document.addEventListener("keydown", onEsc);

  function onEsc(ev) { if (ev.key === "Escape") close(); }
  function close() { overlay.remove(); document.removeEventListener("keydown", onEsc); }
}

// ---------- eligibility ----------
function eligibleFormats(activity) {
  const n = extractItems(activity).length;
  const type = activity.type;
  const out = [];
  if (n >= 1) out.push("anagram");
  if (n >= 2 && n <= 35 && type !== "type-the-answer") out.push("crossword");
  if (n >= 1) out.push("quiz");
  if (type === "type-the-answer" && n >= 1) out.push("unjumble");
  // keep the fixed display order
  return FORMAT_ORDER.filter(f => out.includes(f));
}

// ---------- normalise activity -> [{clue, answer, options}] ----------
function extractItems(activity) {
  let tpl = null;
  try { tpl = getTemplate(activity.type); } catch { tpl = null; }
  if (tpl && typeof tpl.toPrintItems === "function") {
    return (tpl.toPrintItems(activity) || []).filter(it => it && (it.clue || it.answer));
  }
  // default: quiz-shaped content (question + answers[] with one correct)
  const qs = activity.content?.questions || [];
  return qs
    .filter(q => q && Array.isArray(q.answers) && q.answers.length > 0)
    .map(q => ({
      clue: q.question || "",
      answer: (q.answers.find(a => a.correct) || q.answers[0] || {}).text || "",
      options: q.answers.map(a => ({ text: a.text, correct: !!a.correct }))
    }));
}

// ---------- run one format ----------
function runPrint(activity, format) {
  const items = extractItems(activity);
  const pool = items.map(i => i.answer).filter(Boolean);
  let body;
  if (format === "anagram") body = renderAnagram(items);
  else if (format === "quiz") body = renderQuiz(items, pool);
  else if (format === "unjumble") body = renderUnjumble(items);
  else if (format === "crossword") body = renderCrossword(items);
  else return;

  const sheet = buildSheet(activity, body, format);
  document.body.append(sheet);

  // Remove the sheet once the print dialog closes (whether printed or
  // cancelled). afterprint + a long fallback per the core animate/callback rule.
  let done = false;
  const cleanup = () => { if (done) return; done = true; sheet.remove(); window.removeEventListener("afterprint", cleanup); };
  window.addEventListener("afterprint", cleanup);
  setTimeout(() => window.print(), 40);   // let the sheet paint first
  setTimeout(cleanup, 120000);            // fallback (afterprint occasionally doesn't fire)
}

// ---------- shared page chrome ----------
// The running TITLE + "Name/Date" + logo + page number are ALL native CSS
// "@page margin box" content (@top-left/@top-right/@bottom-left/@bottom-right
// — Chrome 131+), never position:fixed HTML. A fixed element's offsets are
// measured from the wrong reference box once @page has a non-zero margin, so
// mm values that look right on screen land somewhere else on paper — that's
// what pushed the header into the body content, and then left the logo
// "khá lệch" versus the title/page-count despite matching mm values (both
// caught 24/7/2026). Margin boxes have neither failure: @top-left/@bottom-left always
// share the page's left margin edge with each other, and @bottom-left/
// @bottom-right always share the same row — so the logo lines up with the
// title and the page count for free, no mm-guessing needed. They are also the
// only way to get a REAL page number: counter(page)/counter(pages) only
// resolve inside a margin box's `content`.
//
// The logo's two type sizes ("AWord" big+bold, "in ANDREW CLASSES" tiny+
// spaced) can't live in one CSS `content` string, so it's a small drawn SVG
// used as the box's image content instead — still a margin box, just an image
// one rather than a text one.
function buildSheet(activity, body, format) {
  const sheet = el("div", "aw-print-sheet aw-print-" + format);
  sheet.append(pageChromeStyle(activity.title || "Worksheet"), body);
  return sheet;
}

function pageChromeStyle(title) {
  const style = document.createElement("style");
  const font = `font-family: "Baloo 2", "Segoe UI", Arial, sans-serif;`;
  style.textContent = `
    @page {
      size: A4;
      margin: 16mm 12mm 14mm;
      @top-left {
        content: ${cssString(title)};
        ${font} font-weight: 800; font-size: 12.5pt; color: #1c2733;
      }
      @top-right {
        content: "Name / Date: ________________________";
        ${font} font-size: 9.5pt; color: #3a4653;
      }
      @bottom-left {
        content: ${logoImageUrl()};
      }
      @bottom-right {
        content: counter(page) "/" counter(pages);
        ${font} font-weight: 700; font-size: 10pt; color: #8a97a8;
      }
    }
  `;
  return style;
}

// The AWord logo as a small vector image (data URI) — "AWord" big+bold above
// "in ANDREW CLASSES" tiny+spaced, exactly the on-screen lockup, just drawn
// once instead of styled with two font sizes (which a margin box can't do).
function logoImageUrl() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="132" height="26" viewBox="0 0 132 26">` +
    `<text x="0" y="15" font-family="Segoe UI, Arial, sans-serif" font-weight="800" font-size="15" fill="#566472">AWord</text>` +
    `<text x="0" y="24" font-family="Segoe UI, Arial, sans-serif" font-weight="700" font-size="6.5" letter-spacing="1" fill="#9aa4af">in ANDREW CLASSES</text>` +
    `</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

// A CSS *string* literal — different escaping from escapeHtml() above (no
// entities; just backslash/quote per the CSS spec), and margin-box content
// can't hold a real newline, so any line break in a title is flattened.
function cssString(s) {
  return '"' + String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/[\r\n]+/g, " ") + '"';
}

function clueLine(i, it, withBulb) {
  const c = el("div", "aw-pf-clue");
  c.append(el("span", "aw-pf-num", `${i + 1}.`));
  if (withBulb) c.append(el("span", "aw-pf-bulb", icons.bulb));
  c.append(el("span", "aw-pf-cluetext", escapeHtml(it.clue || "")));
  return c;
}

// ---------- ANAGRAM: clue + scrambled letters + empty boxes ----------
function renderAnagram(items) {
  const body = el("div", "aw-print-body");
  items.forEach((it, i) => {
    const item = el("div", "aw-print-item aw-pf-anagram");
    item.append(clueLine(i, it, true));

    const letters = String(it.answer || "").toUpperCase().replace(/[^A-Z0-9]/g, "").split("");
    const scr = el("div", "aw-pf-scramble");
    scrambled(letters).forEach(ch => scr.append(el("span", "aw-pf-sbox", escapeHtml(ch))));
    item.append(scr);

    const blanks = el("div", "aw-pf-blanks");
    letters.forEach(() => blanks.append(el("span", "aw-pf-blank")));
    item.append(blanks);

    body.append(item);
  });
  return body;
}

// ---------- QUIZ: clue + A/B/C/D options with checkboxes ----------
function renderQuiz(items, pool) {
  const body = el("div", "aw-print-body");
  items.forEach((it, i) => {
    const item = el("div", "aw-print-item aw-pf-quiz");
    item.append(clueLine(i, it, true));

    // Use the source's own options when available (a real Quiz); otherwise
    // build 4 choices from the answer pool (works for any template).
    let opts;
    if (it.options && it.options.length) opts = shuffle(it.options.map(o => o.text));
    else opts = buildFromPool(it.answer, pool, 4);

    const grid = el("div", "aw-pf-options");
    opts.forEach((txt, k) => {
      const opt = el("div", "aw-pf-opt");
      opt.append(
        el("span", "aw-pf-letter", String.fromCharCode(65 + k)),
        el("span", "aw-pf-check"),
        el("span", "aw-pf-opttext", escapeHtml(String(txt).toUpperCase()))
      );
      grid.append(opt);
    });
    item.append(grid);
    body.append(item);
  });
  return body;
}

// ---------- UNJUMBLE: scrambled sentence words + a write-on line ----------
function renderUnjumble(items) {
  const body = el("div", "aw-print-body");
  items.forEach((it, i) => {
    const item = el("div", "aw-print-item aw-pf-unjumble");

    const line = el("div", "aw-pf-jumble");
    line.append(el("span", "aw-pf-num", `${i + 1}.`));
    const words = String(it.answer || "").trim().split(/\s+/).filter(Boolean);
    scrambled(words).forEach(w => line.append(el("span", "aw-pf-word", escapeHtml(w))));
    item.append(line);

    item.append(el("div", "aw-pf-writeline"));
    body.append(item);
  });
  return body;
}

// ---------- CROSSWORD: an interlocking grid + numbered ACROSS/DOWN clues ----------
// Letters-only key for the grid (spaces/punctuation stripped, like Wordwall) —
// same rule templates/crossword/crossword.js uses, kept in step deliberately:
// a multi-word answer like "polar bear" still fills one continuous run of boxes.
function gridKeyOf(str) {
  return String(str ?? "").toUpperCase().replace(/[^A-Z]/g, "");
}

// Greedy interlock: longest word first at the origin, then each next word
// takes its best-scoring valid crossing over any word already placed. A word
// that can't cross anything is simply left off the grid (and so off the clue
// list too) — the same trade-off the live game already makes silently; there
// is no "no answer" placeholder to give it on paper.
// ⚠️ Deliberately NO randomness (unlike crossword.js's `fixed:false` default):
// this only ever runs once, right when the teacher presses Print, and two
// prints of the same act should hand back the same puzzle, not a shuffled one.
function buildCrosswordGrid(items) {
  const usable = items
    .map(it => ({ key: gridKeyOf(it.answer), clue: it.clue || "", answer: it.answer || "" }))
    .filter(w => w.key.length >= 2);

  const seen = new Set();
  const list = [];
  for (const w of usable) { if (!seen.has(w.key)) { seen.add(w.key); list.push(w); } }
  list.sort((a, b) => b.key.length - a.key.length);

  const cells = new Map();
  const placed = [];
  const at = (r, c) => cells.get(r + "," + c);

  function fitScore(key, row, col, dir) {
    const dr = dir === "D" ? 1 : 0, dc = dir === "A" ? 1 : 0;
    let crossings = 0;
    if (at(row - dr, col - dc) != null) return -1;
    if (at(row + dr * key.length, col + dc * key.length) != null) return -1;
    for (let i = 0; i < key.length; i++) {
      const r = row + dr * i, c = col + dc * i;
      const cur = at(r, c);
      if (cur != null) {
        if (cur !== key[i]) return -1;
        crossings++;
        continue;
      }
      if (dir === "A") {
        if (at(r - 1, c) != null || at(r + 1, c) != null) return -1;
      } else {
        if (at(r, c - 1) != null || at(r, c + 1) != null) return -1;
      }
    }
    return crossings;
  }

  function stamp(w, row, col, dir) {
    const dr = dir === "D" ? 1 : 0, dc = dir === "A" ? 1 : 0;
    for (let i = 0; i < w.key.length; i++) cells.set((row + dr * i) + "," + (col + dc * i), w.key[i]);
    placed.push({ ...w, row, col, dir });
  }

  list.forEach((w, wi) => {
    if (wi === 0) { stamp(w, 0, 0, "A"); return; }
    let best = null;
    for (const p of placed) {
      const pdr = p.dir === "D" ? 1 : 0, pdc = p.dir === "A" ? 1 : 0;
      for (let j = 0; j < p.key.length; j++) {
        const pr = p.row + pdr * j, pc = p.col + pdc * j;
        const letter = p.key[j];
        for (let i = 0; i < w.key.length; i++) {
          if (w.key[i] !== letter) continue;
          const dir = p.dir === "A" ? "D" : "A";
          const row = dir === "D" ? pr - i : pr;
          const col = dir === "A" ? pc - i : pc;
          const score = fitScore(w.key, row, col, dir);
          if (score > 0 && (!best || score > best.score)) best = { row, col, dir, score };
        }
      }
    }
    if (best) stamp(w, best.row, best.col, best.dir);
  });

  if (!placed.length) return { grid: null, clues: [], rows: 0, cols: 0 };

  let minR = Infinity, minC = Infinity, maxR = -Infinity, maxC = -Infinity;
  for (const key of cells.keys()) {
    const [r, c] = key.split(",").map(Number);
    minR = Math.min(minR, r); maxR = Math.max(maxR, r);
    minC = Math.min(minC, c); maxC = Math.max(maxC, c);
  }
  const rows = maxR - minR + 1, cols = maxC - minC + 1;

  const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => null));
  for (const [k] of cells) {
    const [r, c] = k.split(",").map(Number);
    grid[r - minR][c - minC] = { num: 0 };
  }
  placed.forEach(p => { p.row -= minR; p.col -= minC; });

  let n = 0;
  const numAt = new Map();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!grid[r][c]) continue;
      const startsAcross = (c === 0 || !grid[r][c - 1]) && (c + 1 < cols && grid[r][c + 1]);
      const startsDown = (r === 0 || !grid[r - 1][c]) && (r + 1 < rows && grid[r + 1][c]);
      if (startsAcross || startsDown) { n++; grid[r][c].num = n; numAt.set(r + "," + c, n); }
    }
  }

  const clues = placed.map(p => ({
    clue: p.clue, dir: p.dir, number: numAt.get(p.row + "," + p.col) || 0
  }));
  clues.sort((a, b) => a.number - b.number || (a.dir === b.dir ? 0 : a.dir === "A" ? -1 : 1));

  return { grid, clues, rows, cols };
}

// Cell size shrinks to fit the page width for a wide grid (long words / many
// crossings) but never grows past a comfortable writing size for a small one.
// mm, not cqw: this sheet has no container-query ancestor once it's on paper.
const CW_PAGE_WIDTH_MM = 176;   // A4 minus this sheet's own left/right @page margin
const CW_CELL_MAX_MM = 9;
const CW_CELL_MIN_MM = 5;

function renderCrossword(items) {
  const built = buildCrosswordGrid(items);
  const wrap = el("div", "aw-pf-cw-wrap");
  if (!built.grid) {
    wrap.append(el("div", "aw-pf-cw-empty",
      "These answers don't share enough letters to interlock into a crossword."));
    return wrap;
  }
  const { grid, clues, rows, cols } = built;
  const cellMm = Math.max(CW_CELL_MIN_MM, Math.min(CW_CELL_MAX_MM, CW_PAGE_WIDTH_MM / cols));

  const gridEl = el("div", "aw-pf-cw-grid");
  gridEl.style.setProperty("--cw-cols", String(cols));
  gridEl.style.setProperty("--cw-cell", cellMm + "mm");
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c];
      const box = el("div", "aw-pf-cw-cell" + (cell ? "" : " is-blank"));
      if (cell && cell.num) box.append(el("span", "aw-pf-cw-num", String(cell.num)));
      gridEl.append(box);
    }
  }
  wrap.append(gridEl);

  const clueBox = el("div", "aw-pf-cw-clues");
  clueBox.append(
    crosswordClueColumn("ACROSS", clues.filter(c => c.dir === "A")),
    crosswordClueColumn("DOWN", clues.filter(c => c.dir === "D"))
  );
  wrap.append(clueBox);
  return wrap;
}

function crosswordClueColumn(label, list) {
  const col = el("div", "aw-pf-cw-col");
  col.append(el("div", "aw-pf-cw-collabel", label));
  list.forEach(c => {
    const line = el("div", "aw-pf-cw-clueline");
    line.append(el("span", "aw-pf-cw-cluenum", `${c.number}.`), el("span", "aw-pf-cw-cluetext", escapeHtml(c.clue)));
    col.append(line);
  });
  return col;
}

// ---------- helpers ----------
// Shuffle a copy; try a few times so the result differs from the original
// order (best effort — impossible for arrays with all-identical items).
function scrambled(arr) {
  if (arr.length < 2) return arr.slice();
  const orig = arr.join("");
  let out = arr.slice();
  for (let t = 0; t < 15; t++) { out = shuffle(arr); if (out.join("") !== orig) break; }
  return out;
}

// Build `n` multiple-choice options: the correct answer + distinct distractors
// drawn from the pool of every answer in the activity, then shuffled.
function buildFromPool(correct, pool, n) {
  const others = [...new Set(pool.map(x => String(x)))]
    .filter(x => x && x.toUpperCase() !== String(correct).toUpperCase());
  const distract = shuffle(others).slice(0, Math.max(0, n - 1));
  return shuffle([correct, ...distract]);
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
