// =============================================================
// PRINT — paper worksheets (100% English product). GENERIC across templates.
//
// Clicking the Print button opens a small popup to pick a print FORMAT:
//   Anagram · Crossword · Quiz · Unjumble
// Which formats are offered depends on the activity type + question count:
//   • Anagram  — every template, any number of questions
//   • Quiz     — every template, any number of questions
//   • Crossword— 2..35 questions, every template EXCEPT "type-the-answer"
//                (renderer not built yet -> shown as "coming soon")
//   • Unjumble — only "type-the-answer", any number of questions
// Formats that don't apply simply don't show an icon.
//
// A format renders a printable sheet from a NORMALISED item list
// ({clue, answer, options}) that each template can provide via
// `template.toPrintItems(activity)` (falls back to quiz-shaped content).
// Output is pure grayscale (prints fine in black & white) and defaults to
// A4 via @page (see core/app.css). Double-sided is a printer-dialog choice
// the browser can't set from a web page — the popup notes this.
// =============================================================

import { getTemplate } from "./registry.js";
import { shuffle, el } from "./utils.js";
import { icons } from "./icons.js";
import { sound } from "./sound.js";

const FORMAT_META = {
  anagram:   { label: "Anagram",   icon: icons.fmtAnagram },
  crossword: { label: "Crossword", icon: icons.fmtCrossword, comingSoon: true },
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
function buildSheet(activity, body, format) {
  const sheet = el("div", "aw-print-sheet aw-print-" + format);

  const head = el("div", "aw-print-runhead");
  head.append(el("div", "aw-print-htitle", escapeHtml(activity.title || "Worksheet")));
  head.append(el("div", "aw-print-hname", 'Name / Date: <span class="aw-print-hline"></span>'));

  const foot = el("div", "aw-print-runfoot");
  foot.append(el("div", "aw-print-logo", 'AWord<span>in ANDREW CLASSES</span>'));

  sheet.append(head, foot, body);
  return sheet;
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
