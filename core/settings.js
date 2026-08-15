// =============================================================
// SETTINGS — app-wide DEFAULTS, stored on the machine (localStorage
// "aword-settings"). Right now it holds the DEFAULT OPTIONS a NEW act is
// created with (per act type). Later this file will grow other settings.
//
//   • getDefaultOptions(type)  -> the options a new act of `type` should start
//                                 with (stored defaults, else built-ins).
//   • saveDefaultOptions(type, options)
//   • buildOptionsControls(tpl, options) -> a DOM node with the FULL options
//     UI for that template. Edits `options` in place; the caller saves.
//
// ⭐ Đợt 143 — WHAT CHANGED AND WHY
// This file used to build its own options form, and it was quiz-shaped: a
// <select> for Timer, a <select> for Letters on answers, and three checkboxes.
// That was the whole of "Default activity options" — for all 17 games. So the
// teacher set a default in one UI and then met a completely different UI, with
// different controls and different values, the moment they opened Options in a
// game. Anything template-specific (Anagram's mode, Lives, Bonus x, Speed,
// Punishment, Time cost, ...) simply could not be defaulted at all.
//
// The teacher's ask: "đưa toàn bộ các tính năng đầy đủ của options (cả thiết
// kế) của tất cả các act vào trong phần cài đặt/default activity options".
// So this file no longer builds anything of its own — it calls the SAME
// builder the in-game panel calls (core/options-panel.js). Two UIs cannot be
// kept identical by discipline; they drift the moment anyone adds an option.
//
// ⚠️ SCOPE OF A DEFAULT (teacher's explicit choice, Đợt 143): defaults apply to
// acts created FROM NOW ON. An act already in the library keeps the options
// saved on it — changing a default here never reaches back and rewrites acts
// the teacher has already tuned by hand.
// =============================================================

import { el } from "./utils.js";
import { buildOptionsBody } from "./options-panel.js";

const KEY = "aword-settings";

// The factory defaults every brand-new act inherits until the teacher changes
// them in Settings. Deliberately SMALL: these are only the fields that mean the
// same thing in every game. Anything template-specific is left unset here and
// falls through to that template's own default inside its buildExtraOptions —
// listing them all here would be a second place to keep in step with 17 files.
// `lettersOnAnswers` was dropped in Đợt 143 along with the option itself.
export const BUILTIN_DEFAULTS = {
  timer: "countUp",
  timerTotalSeconds: 120,
  shuffleQuestions: true,
  shuffleAnswers: true,
  showAnswers: true
};

function readAll() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && typeof s === "object") return s;
  } catch { /* ignore */ }
  return {};
}
function writeAll(s) { localStorage.setItem(KEY, JSON.stringify(s)); }

// ⭐ Đợt C (15/8/2026) — a SECOND bucket of defaults, for the options a
// "Set assignment" form starts with, kept apart from "Default activity
// options" above. `kind` picks which bucket: "activity" (default, unchanged
// behaviour for every existing caller) or "homework". The two never mix — a
// teacher may want a strict countdown for homework but not for classwork.
function bucketKey(kind) { return kind === "homework" ? "homeworkOptionsByType" : "optionsByType"; }

// The stored default options for a type, merged over the built-ins so a missing
// field always has a sane value. Returns a fresh copy (safe to mutate).
export function getDefaultOptions(type = "quiz", kind = "activity") {
  const s = readAll();
  const bucket = s[bucketKey(kind)] || {};
  const saved = bucket[type] || {};
  return { ...BUILTIN_DEFAULTS, ...saved };
}

export function saveDefaultOptions(type, options, kind = "activity") {
  const s = readAll();
  const key = bucketKey(kind);
  s[key] = s[key] || {};
  s[key][type] = { ...options };
  writeAll(s);
}

/**
 * The full options UI for one template, for the Settings dialog.
 *
 * @param {object} tpl      the registered template (caller must ensureTemplate first —
 *                          its buildExtraOptions is where most of the controls come from)
 * @param {object} options  edited IN PLACE; the caller decides when to save
 * @returns {Element}
 */
export function buildOptionsControls(tpl, options) {
  const wrap = el("div", "aw-set-opts");
  if (!tpl) {
    // A template that failed to load would otherwise throw here and take the
    // whole Settings dialog with it. Say so instead.
    wrap.append(el("div", "aw-set-hint", "This game's options could not be loaded."));
    return wrap;
  }
  // `fight: null` — a match only exists mid-game, so its options are not
  // defaultable. `contentSwitch` is shown ALWAYS here, unlike in a game: in a
  // game it depends on whether THAT act carries spoken clips, but a default has
  // no act yet, so the teacher must be able to say which way new ones start.
  buildOptionsBody(wrap, {
    tpl,
    draft: options,
    contentSwitch: { shown: options.contentMode === "voice" ? "voice" : "text" },
    fight: null
  });
  return wrap;
}
