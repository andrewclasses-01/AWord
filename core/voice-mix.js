// =============================================================
// VOICE MIX — the RULES behind "which voice reads which row" in every bulk
// TTS flow: the Anagram editor's "Generate all voices" popover AND the
// Excel-import voice panel (main.js).
//
// WHY THIS FILE EXISTS (13/8/2026, Đợt 142): the mix rules were written for
// the editor (Đợt 132) and lived INSIDE templates/anagram/anagram-editor.js.
// The import dialog can't import from a template (wrong direction, and
// templates are lazy-loaded), so bringing "Mix voice" to Import meant either
// a second copy of the rules or lifting them here. A second copy is exactly
// how the import mapping silently drifted from the taoact skill for six
// đợt (Đợt 118) — so: ONE home for the rules, each surface keeps only its
// own markup (a popover anchored under a button vs a panel inside a modal).
//
// This module owns no DOM of its own except `fillVoiceOptions`, which fills
// a <select> the CALLER created and styled.
// =============================================================

import { shuffle } from "./utils.js";
import { VOICES } from "./tts.js";

// The teacher's own four picks for manual mix — all en-gb, matching the UK
// default of Random mix. Shared so the two surfaces can never open with
// different defaults.
export const MIX_DEFAULTS = ["bf_isabella", "bm_george", "bf_alice", "bm_fable"];

// Real name FIRST, then gender+grade in parens — never the other way round:
// "Female C" alone collides between several voices in this catalog (bm_fable
// and bm_george are BOTH "Male, C"). `excludeIds` is how the manual mix
// pickers stop each other from offering a voice one of them already holds.
export function fillVoiceOptions(sel, excludeIds) {
  const usGroup = document.createElement("optgroup"); usGroup.label = "American English";
  const gbGroup = document.createElement("optgroup"); gbGroup.label = "British English";
  VOICES.forEach(v => {
    if (excludeIds && excludeIds.includes(v.id)) return;
    const o = document.createElement("option");
    o.value = v.id;
    o.textContent = `${v.name} (${v.gender}, ${v.grade})`;
    (v.lang === "en-gb" ? gbGroup : usGroup).append(o);
  });
  sel.innerHTML = "";
  sel.append(gbGroup, usGroup);
}

// ----- the assignment plan (moved verbatim from anagram-editor.js, Đợt 132) -----
// Builds ONE voiceId per target row, from a small pool of candidate voices,
// following the teacher's two rules: (1) as many Male rows as Female rows,
// never off by more than 1; (2) genuinely random, no single voice used
// noticeably more than the others. Computed ONCE, up front, as a plain
// array — NOT a "pick one at random per row" closure — because rule (1) is
// a property of the WHOLE batch, not any one row; a per-row coin flip can't
// guarantee the totals land within 1 of each other.
//
// `pool` is whatever the teacher is mixing FROM: the 4 hand-picked voices
// (manual mix), or every catalog voice of one accent (Random mix). If the
// pool happens to be all-one-gender (e.g. all 4 manual boxes set to Female
// voices), rule (1) is simply unsatisfiable — every row falls back to that
// one gender rather than silently generating fewer rows than asked.
export function buildVoicePlan(count, pool) {
  const males = pool.filter(v => v.gender === "Male");
  const females = pool.filter(v => v.gender === "Female");
  let nMale, nFemale;
  if (!males.length) { nMale = 0; nFemale = count; }
  else if (!females.length) { nMale = count; nFemale = 0; }
  else {
    const half = Math.floor(count / 2), extra = count - half * 2;   // extra is 0 or 1
    // Which side gets the odd one out is random too — always favouring the
    // same gender on every odd-length batch would itself be a small but
    // real bias, exactly the kind rule (2) is there to avoid.
    const extraToMale = Math.random() < 0.5;
    nMale = half + (extra && extraToMale ? 1 : 0);
    nFemale = half + (extra && !extraToMale ? 1 : 0);
  }
  // Round-robin through a FRESH shuffle of the gender's own voices every
  // time it runs out, rather than one shuffle repeated in the same order
  // — otherwise voice #1 of the pool would always land on rows 1, N+1,
  // 2N+1… a visible pattern, not the "genuinely random" the teacher asked
  // for, even though the raw per-voice COUNT would still come out even.
  function fill(n, voices) {
    const out = [];
    let round = [];
    while (out.length < n) {
      if (!round.length) round = shuffle([...voices]);
      out.push(round.pop());
    }
    return out;
  }
  const plan = shuffle([...fill(nMale, males), ...fill(nFemale, females)]);
  return plan.map(v => v.id);
}

// A `choice` is the plain state both UIs collect:
//   { mix:boolean, random:boolean, accent:"en-gb"|"en-us", mixIds:string[], singleId:string }
// `planFor` turns it into what core/voice-batch.js wants for `voiceId`:
// either the single id string (unchanged original path) or a function
// (item, index) => id reading a pre-computed plan array. The `plan` array
// comes back too, because the import panel generates ONE plan for a whole
// batch and then feeds it act by act, indexing with a running offset
// (teacher's choice 13/8/2026: balance the WHOLE import, not each act).
export function planFor(choice, count) {
  if (!choice.mix) return { kind: "single", voiceId: choice.singleId, plan: null };
  const pool = choice.random
    ? VOICES.filter(v => v.lang === choice.accent)
    : (choice.mixIds || []).map(id => VOICES.find(v => v.id === id)).filter(Boolean);
  // A mix of nothing is not a mix — fall back to the single voice rather
  // than handing voice-batch a plan full of `undefined` voice ids.
  if (!pool.length) return { kind: "single", voiceId: choice.singleId, plan: null };
  const plan = buildVoicePlan(count, pool);
  return { kind: choice.random ? "random" : "mix", voiceId: (it, i) => plan[i], plan };
}

// One human sentence naming what is about to happen, for a confirmation
// dialog ("… using Bella (Female, A)" / "… mixing 4 voices: …").
export function describeChoice(choice) {
  const nameOf = id => {
    const v = VOICES.find(x => x.id === id);
    return v ? v.name : id;
  };
  if (!choice.mix) {
    const v = VOICES.find(x => x.id === choice.singleId);
    return v ? `${v.name} (${v.gender}, ${v.grade})` : choice.singleId;
  }
  if (choice.random) {
    const n = VOICES.filter(v => v.lang === choice.accent).length;
    return `a random mix of all ${n} ${choice.accent === "en-gb" ? "British" : "American"} English voices`;
  }
  const names = (choice.mixIds || []).map(nameOf);
  return `a mix of ${names.length} voices: ${names.join(", ")}`;
}

// ----- remembering the last mix setup (import panel) -----
// Same spirit as core/tts.js's getLastVoice: the teacher usually imports
// several lesson files in a row and wants the same voice setup each time.
// Stored separately from the single-voice key so turning Mix off still
// brings back the single voice they last used.
const LAST_MIX_KEY = "aword.lastVoiceMix";
export function getLastMix() {
  try {
    const raw = JSON.parse(localStorage.getItem(LAST_MIX_KEY) || "null");
    if (!raw || typeof raw !== "object") return null;
    const ids = Array.isArray(raw.mixIds) ? raw.mixIds.filter(id => VOICES.some(v => v.id === id)) : [];
    return {
      mix: !!raw.mix,
      random: !!raw.random,
      accent: raw.accent === "en-us" ? "en-us" : "en-gb",
      // A stored setup whose voices no longer exist in the catalog falls
      // back to the shared defaults instead of opening with empty pickers.
      mixIds: ids.length === MIX_DEFAULTS.length ? ids : [...MIX_DEFAULTS]
    };
  } catch { return null; }
}
export function setLastMix(choice) {
  try {
    localStorage.setItem(LAST_MIX_KEY, JSON.stringify({
      mix: !!choice.mix, random: !!choice.random,
      accent: choice.accent, mixIds: choice.mixIds
    }));
  } catch { /* private mode / storage full — remembering is a nicety, never a blocker */ }
}
