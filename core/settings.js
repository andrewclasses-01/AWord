// =============================================================
// SETTINGS — app-wide DEFAULTS, stored on the machine (localStorage
// "aword-settings"). Right now it holds the DEFAULT OPTIONS a NEW act is
// created with (per act type). Later this file will grow other settings.
//
//   • getDefaultOptions(type)  -> the options a new act of `type` should start
//                                 with (stored defaults, else built-ins).
//   • saveDefaultOptions(type, options)
//   • buildOptionsControls(options, onChange) -> a DOM node with the option
//     controls (Timer / Letters / shuffle / show answers). Reused by the
//     Settings dialog. It edits the `options` object in place and calls
//     onChange() after each change.
//
// The option SHAPE matches Quiz today (the reference template). When another
// template needs a different shape we can branch here by type.
// =============================================================

import { el } from "./utils.js";
import { makeNumberStepper } from "./numberstepper.js";

const KEY = "aword-settings";

// The factory defaults every brand-new act inherits until the teacher changes
// them in Settings. Same values the old editor used to seed a blank quiz.
export const BUILTIN_DEFAULTS = {
  timer: "countUp",
  timerTotalSeconds: 120,
  shuffleQuestions: true,
  shuffleAnswers: true,
  showAnswers: true,
  lettersOnAnswers: "none"
};

function readAll() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && typeof s === "object") return s;
  } catch { /* ignore */ }
  return {};
}
function writeAll(s) { localStorage.setItem(KEY, JSON.stringify(s)); }

// The stored default options for a type, merged over the built-ins so a missing
// field always has a sane value. Returns a fresh copy (safe to mutate).
export function getDefaultOptions(type = "quiz") {
  const s = readAll();
  const saved = (s.optionsByType && s.optionsByType[type]) || {};
  return { ...BUILTIN_DEFAULTS, ...saved };
}

export function saveDefaultOptions(type, options) {
  const s = readAll();
  s.optionsByType = s.optionsByType || {};
  s.optionsByType[type] = { ...options };
  writeAll(s);
}

// ---- reusable options-controls builder (quiz-shaped) ----
export function buildOptionsControls(options, onChange = () => {}) {
  const wrap = el("div", "aw-optform");

  // Timer  (None / Count up / Count down + mm:ss)
  const timerField = el("div", "aw-optform-field");
  timerField.append(el("label", "aw-optform-label", "Timer"));
  const timerRow = el("div", "aw-optform-row");
  const timerSel = el("select", "aw-ed-input aw-ed-select");
  [["none", "No timer"], ["countUp", "Count up"], ["countDown", "Count down"]].forEach(([v, l]) => {
    const o = el("option", null, l); o.value = v;
    if ((options.timer || "countUp") === v) o.selected = true;
    timerSel.append(o);
  });
  const timeFields = el("span", "aw-ed-time");
  const total = options.timerTotalSeconds ?? 120;
  const mm = makeNumberStepper(Math.floor(total / 60), 0, 59, v => { options.timerTotalSeconds = v * 60 + ss.get(); onChange(); });
  const ss = makeNumberStepper(total % 60, 0, 59, v => { options.timerTotalSeconds = mm.get() * 60 + v; onChange(); });
  timeFields.append(mm.el, document.createTextNode("m"), ss.el, document.createTextNode("s"));
  timeFields.style.display = (options.timer || "countUp") === "countDown" ? "inline-flex" : "none";
  timerSel.onchange = () => {
    options.timer = timerSel.value;
    timeFields.style.display = timerSel.value === "countDown" ? "inline-flex" : "none";
    onChange();
  };
  timerRow.append(timerSel, timeFields);
  timerField.append(timerRow);
  wrap.append(timerField);

  // Letters on answers
  const letField = el("div", "aw-optform-field");
  letField.append(el("label", "aw-optform-label", "Letters on answers"));
  const letSel = el("select", "aw-ed-input aw-ed-select");
  [["none", "None"], ["abc", "A, B, C"]].forEach(([v, l]) => {
    const o = el("option", null, l); o.value = v;
    if ((options.lettersOnAnswers || "none") === v) o.selected = true;
    letSel.append(o);
  });
  letSel.onchange = () => { options.lettersOnAnswers = letSel.value; onChange(); };
  letField.append(letSel);
  wrap.append(letField);

  // Checkboxes
  const checks = el("div", "aw-optform-checks");
  checks.append(
    checkbox("Shuffle question order", options.shuffleQuestions !== false, v => { options.shuffleQuestions = v; onChange(); }),
    checkbox("Shuffle answer order", options.shuffleAnswers !== false, v => { options.shuffleAnswers = v; onChange(); }),
    checkbox("Show answers at the end", options.showAnswers !== false, v => { options.showAnswers = v; onChange(); })
  );
  wrap.append(checks);
  return wrap;
}

function checkbox(label, checked, onChange) {
  const wrap = el("label", "aw-ed-check");
  const c = el("input"); c.type = "checkbox"; c.checked = checked;
  c.onchange = () => onChange(c.checked);
  wrap.append(c, document.createTextNode(label));
  return wrap;
}
