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
// Đợt 245 — reading (never writing) the act's clue sets and halves, so the two
// assignment forms can NAME the content they are handing out. Same functions the
// in-game Options panel asks, so the two panels cannot describe one act two
// different ways — the trap Đợt 155 called out when Showdown grew its own copy.
import {
  variantsOf, voiceVariantsOf, variantLabel, activeVariant,
  contentSetsOf, setLabel, activeContentSet
} from "./content-view.js";
// Vấn đề 4 (thầy chốt) — the REAL "does this content have a spoken clip at
// all" test, so the Text/Voice row can hide the Voice button entirely for an
// act with no voice (quiz's clue sets are text only). Same function the game
// engine already uses (core/engine.js's makeContentSwitch); see the note where
// `hasVoice` is added to `contentSwitch` below.
import { hasAnyVoice } from "./voice-playback.js";

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
 * The full options UI for one template — used by the Settings dialog AND by the
 * "Set assignment" / "Edit assignment" forms (core/assignment-ui.js).
 *
 * @param {object} tpl      the registered template (caller must ensureTemplate first —
 *                          its buildExtraOptions is where most of the controls come from)
 * @param {object} options  edited IN PLACE; the caller decides when to save
 * @param {object} [extra]
 * @param {"activity"|"homework"} [extra.kind]  which bucket this form belongs to.
 *        "homework" (both assignment forms) drops the dead "Show answers at end"
 *        switch — see the long note in core/options-panel.js where it is built.
 * @param {object} [extra.act]  the ACT being assigned (or an assignment's frozen
 *        `activity` snapshot). Only its `content` is read, and only to describe
 *        WHICH content is being handed out. See the Đợt 245 note below.
 * @returns {Element}
 */
export function buildOptionsControls(tpl, options, { kind = "activity", act = null, templatePicker = null } = {}) {
  const wrap = el("div", "aw-set-opts");
  if (!tpl) {
    // A template that failed to load would otherwise throw here and take the
    // whole Settings dialog with it. Say so instead.
    wrap.append(el("div", "aw-set-hint", "This game's options could not be loaded."));
    return wrap;
  }
  const isHw = kind === "homework";

  // ⭐⭐⭐ Đợt 245 (23/8/2026, thầy) — THE TWO ROWS THAT NAME THE CONTENT.
  //
  // Measured across all 17 templates on the Đợt 245 bench: the act's own Options
  // panel and this one were IDENTICAL — every slider, every template-specific
  // cell, every switch — with exactly two rows missing here, in 17 of 17:
  //   · PRACTICE | HOMEWORK  (which half of a comprehension act is played)
  //   · the clue-set half of the Text/Voice row  (ENG1 | ENG2 | VI1 | VI2)
  //
  // Đợt 211 already made the assignment CARRY the act's four selector keys, so
  // a class had been getting the right content since then — but the teacher
  // could not SEE which, and could not change it without going back to the act,
  // retuning its Options and giving the work out again.
  //
  // ⚠️ THIS DOES NOT BREAK "HAI CÔNG TẮC RỜI NHAU" (thầy, Đợt C), for exactly
  // the reason Đợt 211 set out: that rule governs the OPTIONS BUNDLE — timer,
  // shuffling, penalties — which still comes from the homework bucket and is
  // still decided per assignment. These four keys are SELECTORS: not a setting,
  // but the NAME of the content being handed out.
  //
  // ⛔⛔ NO `onViewChange`, AND THAT IS THE WHOLE POINT OF THE OMISSION.
  // In a game, picking a clue set RELOADS that view's own stored options (Đợt
  // 147: "TEXT ENG1 khác TEXT ENG2 khác TEXT VI1"). Wiring that up here would
  // be the obvious reading and it would be wrong twice over: a homework form's
  // options come from the homework bucket, which has no per-view anything, so
  // there is nothing to reload; and doing it anyway would let a tap on ENG2
  // silently throw away the timer and penalties the teacher had just set for
  // THIS assignment. The row moves, the settings below it stay put — deliberate.
  //
  // ⚠️ Settings passes no `act` at all and therefore still gets the bare
  // Text/Voice switch it has always had: there is no act yet when you are
  // setting a DEFAULT, so there are no clue sets to name.
  const content = (act && act.content) || null;
  const variants = content ? variantsOf(content) : null;
  const sets = content ? contentSetsOf(content) : null;

  // `fight: null` — a match only exists mid-game, so its options are not
  // defaultable. `contentSwitch` is shown ALWAYS here when there is no act
  // (Settings' own "Default activity options" screen, `act === null`): there
  // is nothing yet to judge voice-eligibility from, so the teacher must be
  // able to say which way new ones start.
  // ⭐ Vấn đề 4 (thầy chốt, ~5/9/2026) — when an act IS bound (both assignment
  // forms), the Voice button is no longer a given: a quiz's clue sets are
  // text only, yet the switch always drew BOTH Text and Voice, so tapping
  // Voice on a quiz landed on a dead half with nothing to play. `hasVoice`
  // carries the real answer — omitted only when there is no act to ask.
  buildOptionsBody(wrap, {
    tpl,
    draft: options,
    contentSwitch: {
      shown: options.contentMode === "voice" ? "voice" : "text",
      ...(content ? { hasVoice: hasAnyVoice(content) } : {}),
      // Spread, not four `undefined`s: buildContentSwitchRow reads `variants`
      // as its "does this act have clue sets at all" test, and an explicit
      // `variants: null` from Settings must stay indistinguishable from the
      // pre-Đợt-245 call that never mentioned the key.
      ...(variants ? {
        variants,
        voiceVariants: voiceVariantsOf(content),
        labelOf: k => variantLabel(content, k),
        // `activeVariant` is what the GAME will obey, so the button that lights
        // up is worked out by the same function rather than by reading the raw
        // stored key — a stored set that no longer exists falls back to the
        // first one there, and this row must fall back with it.
        variant: activeVariant({ content, options: { ...options, contentMode: "text" } }),
        voiceVariant: activeVariant({ content, options: { ...options, contentMode: "voice" } })
      } : {})
    },
    contentSetSwitch: sets && sets.length > 1
      ? { sets, labelOf: k => setLabel(content, k), current: activeContentSet({ content, options }) }
      : null,
    fight: null,
    hideEndShowAnswers: isHw,
    // ⭐ Đợt 250 — only the Set assignment form sends one (see
    // buildContentSwitchRow in core/options-panel.js). Settings never does:
    // a DEFAULT has no act, so there is no content to hand out as another game.
    templatePicker
  });
  return wrap;
}
