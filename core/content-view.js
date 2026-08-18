// =============================================================
// CONTENT VIEW — ONE act carrying SEVERAL interchangeable clue sets
// ("variants"), and the single place that decides which one is being played
// (Đợt 145, 14/8/2026).
//
// WHY THIS EXISTS
// A lesson spreadsheet's WORDTABLE holds the SAME 100 words four times over —
// columns D/H/L/P are byte-identical (measured on every row of every lesson
// file) and only the CLUE differs: an English definition (ENG1), an easier
// English one (ENG2), a Vietnamese meaning (VI1), a Vietnamese example
// sentence (VI2). Until now the importer made FOUR acts out of that, plus two
// more once voice clips were generated. The teacher's call (14/8/2026): one
// act, and the class picks the clue set in Options.
//
// THE SHAPE (only acts built this way are affected; every other act is
// untouched, byte for byte — see resolveActivity's first line)
//
//   content.variants       ["eng1","eng2","vi1","vi2"]  order shown in Options
//   content.voiceVariants  ["eng1","eng2"]              the ones that may hold clips
//   content.variantLabels  optional {key: "ENG1"} override for the buttons
//   content.items[i].clues  { eng1: "...", eng2: "...", vi1: "...", vi2: "..." }
//   content.items[i].voices { eng1: {voice, voiceId}, eng2: {voice, voiceId} }
//   content.items[i].clue   MIRRORS the default variant, so anything that reads
//                           `.clue` off the stored act (library previews, the
//                           print sheet, an editor not yet variant-aware) still
//                           shows something real instead of blank.
//
//   options.contentVariant  which clue set TEXT mode plays   ("eng1")
//   options.voiceVariant    which clue set VOICE mode plays  ("eng1")
//   options.contentMode     "text" | "voice" — unchanged, core/voice-playback.js
//
// The two variant keys are SEPARATE on purpose: the Options row shows the
// children of whichever half is active and hides the other's, so each half has
// to remember its own choice (teacher's design, 14/8/2026).
//
// ⭐⭐ TWO PROPERTIES THE REST OF THE APP LEANS ON — do not break either:
//
//   1. NO VARIANTS → IDENTITY. resolveActivity() hands back the very object it
//      was given (not a copy) for every act that has no `variants`. That is
//      what makes this đợt a zero-diff change for the whole existing library.
//
//   2. IDEMPOTENT. The resolved copy has `variants` STRIPPED, so resolving it
//      again is case 1 and returns the same object. core/fight.js relies on
//      this: it splits ONE act into two boards that must share the same item
//      OBJECTS ("same letters" hands the scramble from one board to the other
//      through `it._fightOrder`), then calls startGame() on each — which
//      resolves again. Without idempotence each board would resolve its own
//      fresh copy and the two would silently drift apart.
//
// ⚠️ The resolved copy SHARES `options` by reference with the stored act, so
// Options → Apply (which does Object.assign(activity.options, draft)) still
// reaches the real act. It must never be the object that gets SAVED, though —
// its content has the other variants stripped out. core/engine.js keeps the
// library object in `libAct` for exactly that reason.
// =============================================================

// `el` is the app's one-line DOM helper (a leaf module — no cycle). It is used
// by exactly ONE thing in this file, makeSetTabs() at the bottom: the editors'
// PRACTICE|HOMEWORK tabs, which need both the DOM and the fold/load rules and
// would otherwise be copied into three editor files.
import { el } from "./utils.js";

// ⭐ Đợt 190 (18/8/2026) — `pron` is the FIFTH clue set: the word's IPA
// transcription, which until now left the act altogether as two standalone acts
// (PRONUNCIATION + IPA). It is a clue set like any other — Edit gets a tab for
// it, Options a button, and Anagram plays "unscramble the word, the clue is
// /ˈtraʊzə/" — with one rule of its own: it is never offered a spoken clip,
// because an English voice reads IPA symbols as nonsense. That rule needs no
// code here: `voiceVariantsOf` below already answers from `content.voiceVariants`,
// which the importer fills with the English sets only.
export const VARIANT_LABEL = { eng1: "ENG1", eng2: "ENG2", vi1: "VI1", vi2: "VI2", pron: "PRONUNCIATION" };

// ---------------------------------------------------------------
// CONTENT SETS — the SECOND axis (Đợt 146, 14/8/2026)
//
// The same lesson file also ships every comprehension exercise TWICE: `QUIZ1`
// and `QUIZ2` are 30 paraphrased pairs of one another, and so are `READINGACT1`
// and `READINGACT2`. Those used to import as separate acts (the second lot
// wearing an " HW" suffix in a separate ACT/HOMEWORK folder). They are now ONE
// act holding both halves, and Options picks the half being played:
//
//   content.contentSets  ["practice","homework"]   order shown in Options
//   content.itemsKey     "questions" | "statements" | "pairs"  which array holds them
//   content.sets         { practice:[...], homework:[...] }
//   content[itemsKey]    MIRRORS the first set, so every reader that predates
//                        this (library card preview, print, fight's itemsKey
//                        lookup on a stored act) still finds real content
//   options.contentSet   which half plays
//
// ⚠️ This is a SEPARATE AXIS from the clue sets above, and deliberately so
// (teacher, 14/8/2026: "rời nhau — HAI công tắc"). PRACTICE/HOMEWORK here means
// only WHICH CONTENT is played; the homework OPTIONS a class gets when the act
// is assigned are a different thing entirely, decided at assignment time. One
// act never has both axes in practice (vocabulary acts have clue sets,
// comprehension acts have content sets) but resolveActivity() handles each
// independently, so an act carrying both would still resolve correctly.
// ---------------------------------------------------------------
export const SET_LABEL = { practice: "PRACTICE", homework: "HOMEWORK" };

export function contentSetsOf(content) {
  const s = content && content.contentSets;
  if (!Array.isArray(s) || !s.length) return null;
  return content.sets && content.itemsKey ? s : null;
}

export function setLabel(content, key) {
  const custom = content && content.setLabels;
  if (custom && custom[key]) return custom[key];
  return SET_LABEL[key] || String(key || "").toUpperCase();
}

// Which half this act plays right now — a legal key for an act with sets
// (an unknown stored value falls back to the first), null for anything else.
export function activeContentSet(activity) {
  const content = activity && activity.content;
  const sets = contentSetsOf(content);
  if (!sets) return null;
  const chosen = (activity.options || {}).contentSet;
  return sets.includes(chosen) ? chosen : sets[0];
}

// The items of one half. Returns the STORED array, not a copy — the same thing
// `content.questions` is for an ordinary act, so callers (and core/fight.js's
// item-identity rule) see exactly what they always have.
//
// ⭐ THE FIRST HALF IS THE MIRROR — it is NOT duplicated into `sets`. Storing it
// in both places would write those 30 questions to Firestore twice (JSON has no
// notion of "the same array"), and the two copies would then have to be kept in
// step by hand for ever. So `sets` holds only the halves after the first, and
// this fallback is what makes the first one readable through the same call.
export function itemsOfSet(content, key) {
  const sets = content && content.sets;
  const list = sets && sets[key];
  if (Array.isArray(list)) return list;
  return (content && content.itemsKey && content[content.itemsKey]) || [];
}

// ---- editing form vs STORAGE form ----------------------------------------
// STORAGE form (what is saved, and what everything else reads): the first half
// lives in `content[itemsKey]`, the rest in `sets`.
// EDITING form (only ever inside an open editor): `sets` holds EVERY half, and
// `content[itemsKey]` is the scratch copy of whichever tab is on screen. That
// makes the editor's switching logic one line per direction instead of a
// special case for the first half — and, more importantly, it means editing the
// HOMEWORK tab cannot overwrite the practice half by simply being written to
// the array everything else reads.
// expandSetsForEditing() goes one way, foldEditedSet() the other; an editor
// must call the second one before saving or it saves the editing form.

export function expandSetsForEditing(content) {
  const sets = contentSetsOf(content);
  if (!sets) return content;
  const map = content.sets || (content.sets = {});
  sets.forEach(k => { map[k] = itemsOfSet(content, k); });
  return content;
}

// Fold back to STORAGE form: whatever is on screen belongs to `key`, the mirror
// goes back to the FIRST half. So a saved act always opens on its practice
// content, whichever tab the teacher happened to be standing on.
export function foldEditedSet(content, key) {
  const sets = contentSetsOf(content);
  if (!sets || !key) return;
  const itemsKey = content.itemsKey, first = sets[0];
  if (!content.sets) content.sets = {};
  content.sets[key] = content[itemsKey];
  content[itemsKey] = content.sets[first] || content[itemsKey];
  delete content.sets[first];
}

// The clue sets this act carries, or null for an ordinary act.
export function variantsOf(content) {
  const v = content && content.variants;
  return Array.isArray(v) && v.length ? v : null;
}

// The subset that may carry spoken clips. Vietnamese clues and raw IPA are
// deliberately NOT in it — an English Kokoro voice misreads both (teacher,
// 10/8/2026), so VOICE mode only ever offers the English sets.
export function voiceVariantsOf(content) {
  const all = variantsOf(content);
  if (!all) return null;
  const raw = content.voiceVariants;
  const list = Array.isArray(raw) ? raw.filter(k => all.includes(k)) : [];
  return list.length ? list : null;
}

export function variantLabel(content, key) {
  const custom = content && content.variantLabels;
  if (custom && custom[key]) return custom[key];
  return VARIANT_LABEL[key] || String(key || "").toUpperCase();
}

// Which clue set this act plays RIGHT NOW. Always returns a legal key for a
// variant act (a stored value naming a variant that no longer exists falls
// back to the first one) and null for every other act.
export function activeVariant(activity) {
  const content = activity && activity.content;
  const all = variantsOf(content);
  if (!all) return null;
  const o = (activity && activity.options) || {};
  if (o.contentMode === "voice") {
    const vv = voiceVariantsOf(content) || all;
    return vv.includes(o.voiceVariant) ? o.voiceVariant : vv[0];
  }
  return all.includes(o.contentVariant) ? o.contentVariant : all[0];
}

// This item's clue in one variant (falls back to the mirrored `.clue`).
export function clueOf(item, key) {
  if (!item) return "";
  const c = item.clues;
  if (c && c[key] != null) return c[key];
  return item.clue || "";
}

// This item's clip for one variant: { voice, voiceId } — always an object, so
// callers never have to guard two levels deep.
export function voiceOf(item, key) {
  const v = item && item.voices && item.voices[key];
  return { voice: (v && v.voice) || "", voiceId: (v && v.voiceId) || "" };
}

// Write a clue back into a variant act (used by the editor). Mutates in place
// and keeps the mirrored `.clue` in step when the DEFAULT variant is edited.
export function setClueOf(item, key, text, defaultKey) {
  if (!item) return;
  if (!item.clues) item.clues = {};
  item.clues[key] = text;
  if (key === defaultKey) item.clue = text;
}

// Write a generated clip into a variant act — or CLEAR one, when `voice` is
// empty. Clearing deletes the key rather than storing a blank pair, so a set
// that has never been voiced adds nothing at all to the stored document (the
// editor saves every row, voiced or not: 100 words × 4 sets of empty pairs is
// pure noise in Firestore).
export function setVoiceOf(item, key, { voice, voiceId }) {
  if (!item) return;
  if (!voice) { if (item.voices) delete item.voices[key]; return; }
  if (!item.voices) item.voices = {};
  item.voices[key] = { voice, voiceId: voiceId || "" };
}

// Does every item of this variant have a clip? (library badge, main.js)
export function variantFullyVoiced(content, key) {
  const items = (content && content.items) || [];
  return items.length > 0 && items.every(it => voiceOf(it, key).voice);
}

// ---------------------------------------------------------------
// ONE SET OF OPTIONS PER VIEW (Đợt 147, 14/8/2026)
//
// Teacher: "Options của mỗi act đều độc lập với nhau — TEXT ENG1 khác TEXT ENG2
// khác TEXT VI1 khác TEXT VI2, VOICE ENG1 khác VOICE ENG2. Chọn cái nào thì
// options nhảy theo cái đó và lưu độc lập." Confirmed to cover BOTH axes, so a
// WORDS act has six independent option sets and a QUIZ act has two.
//
// It is the same idea as the content itself: picking a view picks everything
// about it. Reading the Vietnamese clues is a different exercise from
// listening to the English ones, and wants a different clock, different lives,
// a different penalty.
//
//   act.options            the EFFECTIVE options — what is playing right now.
//                          Nothing outside this file changes: engine, every
//                          template, Change Template and the assignment
//                          snapshot all keep reading exactly this.
//   act.viewOptions[key]   the stored set for each view, WITHOUT the selectors.
//
// `key` is what identifies a view: "practice", "text:eng1", "voice:eng2", or
// both joined ("practice|text:eng1") for an act that carries both axes. Null
// for an act with neither — i.e. the whole library before Đợt 145, which
// therefore keeps a single set of options exactly as it always had.
// ---------------------------------------------------------------

// The options that CHOOSE a view. They identify the view itself, so they
// belong to the act, never to one view's stored set.
export const VIEW_SELECTOR_KEYS = ["contentMode", "contentVariant", "voiceVariant", "contentSet"];

// Also never per-view, and never dropped when a view starts from the Settings
// defaults: `optVer` is the Đợt 143 migration stamp. Lose it and the next load
// re-scales values that are already on the new scale (-5 → -100 → -2000).
export const VIEW_ACT_KEYS = ["optVer"];

export function viewKeyOf(activity) {
  const parts = [];
  const set = activeContentSet(activity);
  if (set) parts.push(set);
  const variant = activeVariant(activity);
  if (variant) {
    const mode = (activity.options || {}).contentMode === "voice" ? "voice" : "text";
    parts.push(`${mode}:${variant}`);
  }
  return parts.length ? parts.join("|") : null;
}

// Split an options object into the part that names the view and the part that
// IS the view's settings.
export function splitViewOptions(options) {
  const selectors = {}, view = {};
  Object.entries(options || {}).forEach(([k, v]) => {
    const isAct = VIEW_SELECTOR_KEYS.includes(k) || VIEW_ACT_KEYS.includes(k);
    (isAct ? selectors : view)[k] = v;
  });
  return { selectors, view };
}

// The stored settings for one view, or null if that view has never been
// visited (the caller then seeds it — from the Settings defaults, teacher's
// choice 14/8/2026).
export function optionsForView(activity, key) {
  const stored = activity && activity.viewOptions && activity.viewOptions[key];
  return stored ? { ...stored } : null;
}

export function storeViewOptions(activity, key, options) {
  if (!activity || !key) return;
  if (!activity.viewOptions) activity.viewOptions = {};
  activity.viewOptions[key] = splitViewOptions(options).view;
}

// ---------------------------------------------------------------
// EDITOR TABS — "PRACTICE | HOMEWORK" above the rows, so both halves are
// editable in one sitting (teacher, 14/8/2026: "trong edit cũng phải có cùng
// edit tương ứng cho 2 nửa"). The three comprehension editors (quiz, true/false,
// find the match) each mount this and re-render their rows in `onSwitch`.
//
// Switching tabs does NOT change which half the act PLAYS: `options.contentSet`
// is left alone on purpose. Editing the homework half must not silently hand
// the homework questions to the next class that opens the act.
//
// Always returns an object, so callers need no branch: `.el` is null when there
// is nothing to switch between, and `.currentKey()` still names the half being
// edited (which the save path needs either way).
// ---------------------------------------------------------------
// `read()`  — the rows currently on screen, in STORED item form.
// `load(items)` — put these rows on screen and re-render.
// The two callbacks are what let the same tabs serve editors whose on-screen
// model is not the stored one: quiz and find-the-match hand back their arrays
// unchanged, while true/false keeps two columns of plain strings and converts
// in both directions.
export function makeSetTabs(content, { current, read, load } = {}) {
  const sets = contentSetsOf(content);
  let key = sets && sets.includes(current) ? current : (sets ? sets[0] : null);
  const api = { el: null, currentKey: () => key };
  if (!sets || sets.length < 2) return api;

  const wrap = el("div", "aw-ed-settabs");
  wrap.style.setProperty("--n", String(sets.length));
  wrap.style.setProperty("--i", String(Math.max(0, sets.indexOf(key))));
  wrap.append(el("div", "aw-ed-settabs-thumb"));
  const btns = sets.map((k, i) => {
    const b = el("button", "aw-ed-settab" + (k === key ? " is-active" : ""), setLabel(content, k));
    b.type = "button";
    b.onclick = () => {
      if (k === key) return;
      // Editing form (see expandSetsForEditing): `sets` holds every half, so
      // parking the screen's rows and picking up the other half is one line
      // each way — no special case for the first half.
      content.sets[key] = read();
      key = k;
      load(content.sets[k] || []);
      btns.forEach(x => x.classList.remove("is-active"));
      b.classList.add("is-active");
      wrap.style.setProperty("--i", String(i));
    };
    return b;
  });
  wrap.append(...btns);
  api.el = wrap;
  return api;
}

// ---------------------------------------------------------------
// THE RESOLVER — turn a stored variant act into the plain, single-clue act
// that all 17 templates already know how to play. Called by core/engine.js
// just before the voice preload, tpl.prepare and tpl.mount; nothing in
// templates/ knows variants exist.
// ---------------------------------------------------------------
export function resolveActivity(activity) {
  const content = activity && activity.content;
  // The two axes are independent; an act may carry either, both or neither.
  if (contentSetsOf(content)) return resolveSets(activity);
  if (!variantsOf(content)) return activity;          // property 1: identity
  const key = activeVariant(activity);
  const items = (content.items || []).map(it => resolveItem(it, key));
  // Strip the variant keys — that is property 2 (idempotence), and it also
  // keeps collectVoiceIds() in core/voice-clips.js from preloading the OTHER
  // variant's clips: it walks `content` recursively looking for `voice`
  // strings, so leaving `voices` on the items would download both sets
  // (~1.2MB each for a 100-word act) every time a class pressed Play.
  const { variants, voiceVariants, variantLabels, ...rest } = content;
  return { ...activity, content: { ...rest, items } };
}

// Flatten the chosen half down onto the array the template already reads, and
// strip the set keys — same two properties as above, so resolving twice is a
// no-op and core/fight.js's two boards keep sharing one set of item objects
// (this path hands over the STORED array, so they are literally the same
// objects the library holds). If the act also carries clue sets, resolve those
// on the way out.
function resolveSets(activity) {
  const content = activity.content;
  const key = activeContentSet(activity);
  const { contentSets, sets, itemsKey, setLabels, ...rest } = content;
  const flattened = {
    ...activity,
    content: { ...rest, [itemsKey]: itemsOfSet(content, key) }
  };
  return variantsOf(flattened.content) ? resolveActivity(flattened) : flattened;
}

function resolveItem(it, key) {
  if (!it || typeof it !== "object") return it;
  if (!it.clues && !it.voices) return it;             // a row nothing was ever filled in for
  const { clues, voices, ...rest } = it;
  const clip = voiceOf(it, key);
  return {
    ...rest,
    clue: clues && clues[key] != null ? clues[key] : (rest.clue || ""),
    // ⭐ Đợt 190 — the transcription survives the flattening as a field of the
    // WORD, not of the clue set being played. It has to: Running word prints it
    // beside each word and IPA mode is built entirely out of it, and both of
    // them are reached through core/convert.js, which only ever sees the
    // RESOLVED act (`clues` is gone by then). Whichever clue set is on screen,
    // `ipa` says the same thing — which is exactly what makes it safe to carry.
    ipa: (clues && clues.pron) || rest.ipa || "",
    voice: clip.voice,
    voiceId: clip.voiceId,
    // NEVER the per-item flag here. Whether the clue is hidden is decided by
    // options.contentMode inside voiceView() (core/voice-playback.js); a
    // variant act always states its mode, so the AUTO branch that reads this
    // flag can't be reached from one.
    hideText: false
  };
}
