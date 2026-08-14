// =============================================================
// LESSON IMPORT — read a lesson .xlsm/.xlsx/.xls (ArrayBuffer) straight into an
// AWord import bundle { folder, activities:[...] }, in the BROWSER, so the
// teacher can pick a spreadsheet in the Import dialog and get acts immediately —
// no JSON middle-step, no Python skill.
//
// This mirrors the `taoactaw` skill's mapping exactly (same columns/sections,
// same "few canonical acts" philosophy — each act morphs into other games in
// class via Change Template). If one side changes, keep the other in sync.
//
// The SheetJS parser (~1 MB) is DYNAMIC-imported the first time a spreadsheet is
// read, so it never loads on student pages or during normal library use — only
// when the teacher actually imports a lesson file.
// =============================================================

let _xlsx = null;
async function xlsx() {
  if (!_xlsx) _xlsx = await import("./vendor/xlsx.mjs");
  return _xlsx;
}

// Option presets — mirror each template's sample-*.js so imported acts play
// with sensible defaults (kept identical to the taoactaw skill).
const OPT_FTM  = { timer: "countUp", shuffleQuestions: true, lives: 5, showAnswers: true, speed: 0, repeatUntilCorrect: false, removeCorrects: true };
const OPT_SC   = { timer: "none", timerTotalSeconds: 120, shuffleQuestions: true, dealPlaces: 1 };
const OPT_TF   = { timer: "countUp", shuffleQuestions: true, lives: 5, showAnswers: true, speed: 0, repeatUntilCorrect: false };
const OPT_QUIZ = { timer: "countUp", shuffleQuestions: true, shuffleAnswers: true, lives: null };
// contentMode "text" (12/8/2026): an imported act may be given voice clips right
// here in the Import dialog, but it still OPENS as an ordinary written-clue act —
// the teacher flips it to Voice in Options when the lesson calls for listening.
// This is what makes one act able to replace the old ENG1 / ENG1 VOICE pair.
const OPT_ANA  = { timer: "countUp", shuffleQuestions: true, anagramMode: "bonus", allCaps: true, allowSkip: true, showAnswers: true, contentMode: "text" };
// Which clue set a freshly imported vocabulary act opens on, and the one whose
// text is mirrored into each item's plain `.clue` (see core/content-view.js).
const DEFAULT_VARIANT = "eng1";
// Running word runs its OWN two clocks, so the engine's whole-game timer is off.
// wordsPerTeam 0 = "give each team the whole pool"; the teacher normally drops it
// to ~50 in the Options panel, which is what makes the two lists overlap.
const OPT_RW   = { timer: "none", teamAName: "TEAM A", teamBName: "TEAM B", clockSeconds: 300,
                   incrementSeconds: 0, wordsPerTeam: 0, allowPass: true, passPenaltySeconds: 10,
                   andrewUses: 1, warnSeconds: 15 };
// Running team also runs its own clocks: one countdown for the whole round and a
// short one per question. `lives: 0` would mean unlimited; 3 is the default.
const OPT_RT   = { timer: "none", mainSeconds: 600, questionSeconds: 15, lives: 3 };

const anagram = (title, pairs) => ({
  type: "anagram", title, theme: "classic", options: OPT_ANA,
  content: { withClues: pairs.some(p => p[1]), items: pairs.filter(p => p[0]).map(([w, c]) => ({ word: w, clue: c })) }
});
const ftm = (title, pairs) => ({
  type: "find_the_match", title, theme: "classic", options: OPT_FTM,
  content: { pairs: pairs.filter(p => p[0]).map(([a, b]) => ({ keyword: a, definition: b })) }
});
const speaking = (title, cards) => ({
  type: "speaking_cards", title, theme: "classic", options: OPT_SC,
  content: { cards: cards.filter(Boolean).map(t => ({ text: t })) }
});
// `words` is an array of {word, ipa} (11/8/2026 — was a plain string array
// before Running word's editor grew an IPA column; see running-word-editor.js).
const runningWord = (title, words) => ({
  type: "running_word", title, theme: "classic", options: { ...OPT_RW },
  content: { words: words.filter(w => w.word) }
});
// No `gameSets` here on purpose: a set pairs a printed numbering with the class
// roll it was played with, so it can only be made in the game's setup screen
// once a real class has been picked.
const runningTeam = (title, words) => ({
  type: "running_team", title, theme: "classic", options: { ...OPT_RT },
  content: { words: words.filter(Boolean), gameSets: [] }
});
const trueFalse = (title, rows) => {
  const statements = [];
  rows.forEach(([t, f]) => {
    if (t) statements.push({ text: t, answer: true });
    if (f) statements.push({ text: f, answer: false });
  });
  return { type: "true_false", title, theme: "classic", options: OPT_TF, content: { statements } };
};
const quiz = (title, rows) => {
  const questions = [];
  rows.forEach(([q, correct, wrong]) => {
    if (!q || !correct) return;
    const answers = [{ text: correct, correct: true }, ...wrong.filter(Boolean).map(w => ({ text: w, correct: false }))];
    questions.push({ question: q, answers });
  });
  return { type: "quiz", title, theme: "classic", options: OPT_QUIZ, content: { questions } };
};

// ⭐ Đợt 146 — TWO HALVES, ONE ACT. Every comprehension exercise ships twice in
// the lesson file: QUIZ1/QUIZ2 are 30 paraphrased pairs of each other, and so
// are READINGACT1/READINGACT2. They used to import as separate acts (the second
// lot wearing an " HW" suffix in an ACT/HOMEWORK folder); now one act holds
// both and Options picks the half. `make(title, rows)` is the ordinary
// single-set builder — reused as-is so the option presets and per-item shaping
// stay in ONE place — and this only lifts what it built into `content.sets`.
// A file that fills in only one half simply gets a one-half act, whose Options
// row then hides itself (one choice is not a choice).
const twoSetAct = (make, title, itemsKey, halves) => {
  const built = halves
    .filter(h => h.rows.length)
    .map(h => ({ key: h.key, act: make(title, h.rows) }))
    .filter(h => (h.act.content[itemsKey] || []).length);
  if (!built.length) return null;
  const base = built[0].act;
  // Only the halves AFTER the first go into `sets` — the first one IS
  // `content[itemsKey]`, which is both the mirror every older reader uses and
  // the only copy of it (see itemsOfSet in core/content-view.js: storing it
  // twice would write those questions to Firestore twice over).
  const sets = {};
  built.slice(1).forEach(h => { sets[h.key] = h.act.content[itemsKey]; });
  return {
    ...base,
    options: { ...base.options, contentSet: built[0].key },
    content: {
      ...base.content,
      contentSets: built.map(h => h.key),
      itemsKey,
      sets,
      [itemsKey]: built[0].act.content[itemsKey]
    }
  };
};

// The "source" code that names the folder + prefixes titles (same rule as taoact).
function sourceStem(fileName) {
  let stem = (fileName || "").replace(/\.(xlsm|xlsx|xls)$/i, "").trim();
  const m = stem.match(/^([A-Za-z0-9]+-S\d+(?:\.[A-Za-z0-9+\-]+)+)/);
  return m ? m[1] : stem;
}

// Parse a workbook ArrayBuffer -> bundle. `fileName` gives the source code;
// `folder` overrides the folder name if provided.
export async function parseLessonToBundle(arrayBuffer, { fileName = "", folder = null } = {}) {
  const XLSX = await xlsx();
  const wb = XLSX.read(arrayBuffer, { type: "array" });

  // normalized (UPPER, no spaces) sheet name -> real name
  const names = {};
  wb.SheetNames.forEach(n => { names[n.toUpperCase().replace(/\s+/g, "")] = n; });
  const sheet = (...cands) => {
    for (const c of cands) {
      const key = c.toUpperCase().replace(/\s+/g, "");
      if (names[key]) return wb.Sheets[names[key]];
    }
    return null;
  };
  // 1-indexed row & col (openpyxl-style) -> trimmed cell string ("" if empty).
  // These generated sheets fill unused rows with a formula that evaluates to 0,
  // so a lone "0" (SheetJS may hand it back as the number 0 or the text "0 ")
  // means "no data" — treat it the same as blank. Without this, empty rows were
  // imported as junk acts full of "0" (teacher hit this: 100 real words became
  // 150, Speaking cards dealt blank "0" cards).
  // ⭐ 13/8/2026 — READ WHAT EXCEL SHOWS, NOT WHAT IT STORES. SheetJS gives every
  // cell two faces: `v` = the raw stored value, `w` = the exact text Excel paints
  // on screen after its number format. A quiz answer typed as "8:30" is NOT text
  // in Excel — it's the number 0.3541666666666667 wearing an `h:mm` format, so
  // reading `v` imported "0.3541666666666667" as the answer (teacher hit this in
  // LSA2-S2.T4.P3-4-5.xlsm, Quiz1/Quiz2 row 27). Taking `w` first makes the rule
  // hold for EVERY format — times, dates, percentages, currency, rounded numbers:
  // whatever the teacher sees in the cell is what lands in the act. `v` stays as
  // the fallback for the rare cell SheetJS hands over without formatted text.
  // Error cells (`#VALUE!`, `#N/A`…) are not content at all — their `v` is an
  // internal error CODE (15 for #VALUE!), which used to import as a one-word act
  // literally called "15", so they now read as blank.
  const cell = (ws, row1, col1) => {
    if (!ws) return "";
    const c = ws[XLSX.utils.encode_cell({ r: row1 - 1, c: col1 - 1 })];
    if (!c) return "";
    if (c.t === "e") return "";
    const v = c.w != null ? c.w : c.v;
    const s = v == null ? "" : String(v).trim();
    return s === "0" ? "" : s;
  };
  const maxRow = ws => {
    if (!ws || !ws["!ref"]) return 0;
    return XLSX.utils.decode_range(ws["!ref"]).e.r + 1;   // 1-indexed
  };

  const source = sourceStem(fileName);
  const acts = [];

  // ---- WORDTABLE vocab (cols D/E, H/I, L/M, P/Q, S) ----
  // ⭐ 14/8/2026 (Đợt 145) — ONE act, FOUR clue sets. Columns D/H/L/P hold the
  // SAME word — measured across the teacher's lesson files, 100 rows out of 100
  // identical — and only the CLUE differs: an English definition (E), an easier
  // English one (I), a Vietnamese meaning (M), a Vietnamese example sentence
  // (Q). So one ROW of the sheet is one word wearing four clues, and it now
  // imports as ONE act whose Options row picks the set being played
  // (core/content-view.js). Before this it was four near-identical acts, and
  // six once voices were generated.
  const VARIANT_COLS = [
    { key: "eng1", word: 4,  clue: 5  },
    { key: "eng2", word: 8,  clue: 9  },
    { key: "vi1",  word: 12, clue: 13 },
    { key: "vi2",  word: 16, clue: 17 }
  ];
  const wt = sheet("WORDTABLE");
  const WORDS = [], IPA = [];
  if (wt) {
    const rows = maxRow(wt);
    for (let r = 1; r <= rows; r++) {
      // Read the row across all four blocks. The word is taken from the first
      // block that has one, so a lesson file that fills only some of the four
      // still imports every word it does have.
      const clues = {};
      let word = "";
      for (const v of VARIANT_COLS) {
        const w = cell(wt, r, v.word);
        if (!w) continue;
        if (!word) word = w;
        clues[v.key] = cell(wt, r, v.clue);
      }
      if (word) WORDS.push({ word, clue: clues[DEFAULT_VARIANT] || "", clues });
      const s = cell(wt, r, 19); if (s) IPA.push(s);
    }
  }
  // Only offer a variant BUTTON for a clue set this file actually filled in —
  // the OPT-IN rule from Đợt 143: a control that is there but does nothing is
  // worse than a missing one, because nothing on screen says so.
  const presentVariants = VARIANT_COLS.map(v => v.key)
    .filter(k => WORDS.some(it => (it.clues[k] || "").trim()));
  // ENG1/ENG2 clues are English, so they're the only two sets offered for
  // auto-TTS in the Import dialog's voice panel (teacher confirmed 10/8/2026).
  // VI1/VI2 clues are Vietnamese and PRONUNCIATION's clue is a raw IPA symbol —
  // an English Kokoro voice would misread both, so they stay text-only.
  // ⭐ 12/8/2026 — text and voice already share ONE act: the "ENG1" + "ENG1
  // VOICE" pair held byte-identical words and differed only by the clips
  // hanging off the second, so `options.contentMode` picks the side instead
  // (voiceView() in core/voice-playback.js). Đợt 145 extends that same idea
  // sideways: contentMode picks TEXT vs VOICE, contentVariant/voiceVariant pick
  // WHICH clue set within the chosen side.
  const voiceVariants = presentVariants.filter(k => k === "eng1" || k === "eng2");
  if (WORDS.length) {
    acts.push({
      type: "anagram", title: `${source} / WORDS`, theme: "classic",
      options: {
        ...OPT_ANA,
        contentVariant: presentVariants[0] || DEFAULT_VARIANT,
        voiceVariant: voiceVariants[0] || DEFAULT_VARIANT
      },
      content: {
        withClues: WORDS.some(it => it.clue),
        variants: presentVariants,
        voiceVariants,
        items: WORDS
      },
      // Import-only flags, stripped before the act is saved (see main.js).
      ttsEligible: voiceVariants.length > 0,
      ttsVariants: voiceVariants
    });
  }
  // PRONUNCIATION: unscramble the word with its IPA as the clue — split the IPA
  // column's "WORD /ipa/" into word + pronunciation.
  const PRON = [];
  IPA.forEach(t => { const m = t.match(/^(.+?)\s+(\/[^/]*\/)\s*$/); if (m) PRON.push([m[1].trim(), m[2].trim()]); });
  if (PRON.length) acts.push(anagram(`${source} / PRONUNCIATION`, PRON));
  if (IPA.length)  acts.push(speaking(`${source} / IPA`, IPA));
  // word -> IPA lookup for RUNNING WORD below (11/8/2026) — the same
  // "WORD /ipa/" pairs PRONUNCIATION just parsed out of the IPA column,
  // keyed upper-case so it matches ENG1's words regardless of case.
  const ipaByWord = new Map();
  PRON.forEach(([w, ipa]) => ipaByWord.set(w.toUpperCase(), ipa));
  // The bare word list the two racing games need — column D's words, which is
  // what `WORDS` was built from (Đợt 145 merged the four columns, so this is
  // where the old `ENG1` array now comes from).
  const WORDLIST = WORDS.map(it => it.word);
  // RUNNING WORD — the two-team chess-clock race. It needs nothing but the bare
  // word list, so it reuses ENG1's words (column D = the same pool the teacher's
  // hand-made `RunningW` sheet drew its two 50-word lists from). No clues, no
  // answers: the explainer supplies the meaning out loud. IPA is matched in
  // from ipaByWord above when the sheet has one for that word; a word with
  // none just imports with a blank IPA, same as before this existed.
  if (WORDLIST.length >= 2) {
    acts.push(runningWord(`${source} / RUNNING WORD`,
      WORDLIST.map(w => ({ word: w, ipa: ipaByWord.get(w.toUpperCase()) || "" }))));
  }
  // RUNNING TEAM — same bare word list, same reasoning: the five wrong tiles are
  // picked out of the pool itself by look-alike score, so no clues are needed.
  // Six is the floor because every round puts six words on screen.
  if (WORDLIST.length >= 6) acts.push(runningTeam(`${source} / RUNNING TEAM`, WORDLIST));

  // ---- comprehension Quiz1 / Quiz2 (listening files) ----
  // ⭐ Đợt 146 — ONE act named "QUIZ" holding both: QUIZ1 is the PRACTICE half,
  // QUIZ2 the HOMEWORK half. The sheet names keep their numbers (that is the
  // teacher's spreadsheet, not ours); everything the teacher sees inside AWord
  // says PRACTICE / HOMEWORK.
  const readQuizSheet = tag => {
    const wq = sheet(tag);
    const rows = [];
    if (!wq) return rows;
    const rmax = maxRow(wq);
    for (let r = 1; r <= rmax; r++) {
      const q = cell(wq, r, 1);
      if (q) rows.push([q, cell(wq, r, 2), [3, 4, 5, 6, 7].map(c => cell(wq, r, c)).filter(Boolean)]);
    }
    return rows;
  };
  const quizAct = twoSetAct(quiz, `${source} / QUIZ`, "questions", [
    { key: "practice", rows: readQuizSheet("QUIZ1") },
    { key: "homework", rows: readQuizSheet("QUIZ2") }
  ]);
  if (quizAct) acts.push({ ...quizAct, subfolder: "ACT" });

  // ---- reading acts READINGACT1 (v1) / READINGACT2 (v2) ----
  const readRa = ws => {
    const TF = [], FILL = [], RQ = [];
    if (!ws) return { TF, FILL, RQ };
    for (let r = 2; r <= 16; r++) { const b = cell(ws, r, 2); if (b) TF.push([b, cell(ws, r, 3)]); }
    for (let r = 19; r <= 38; r++) { const b = cell(ws, r, 2); if (b) FILL.push([b, cell(ws, r, 3)]); }
    for (let r = 41; r <= 70; r++) {
      const b = cell(ws, r, 2);
      if (b) RQ.push([b, cell(ws, r, 3), [4, 5, 6].map(c => cell(ws, r, c)).filter(Boolean)]);
    }
    return { TF, FILL, RQ };
  };
  // ⭐ Đợt 146 — THREE acts, each holding BOTH halves. READINGACT1 is the
  // PRACTICE half and READINGACT2 the HOMEWORK half of the same three
  // exercises, so the old " HW" titles and the whole `ACT/HOMEWORK` subfolder
  // are gone: one "1. TRUE FALSE" that can be played either way beats two acts
  // the teacher has to find separately.
  const P = readRa(sheet("READINGACT1", "READINGACTS", "READINGACT"));
  const H = readRa(sheet("READINGACT2"));
  const readingActs = [
    { make: trueFalse, title: "1. TRUE FALSE",  itemsKey: "statements", p: P.TF,   h: H.TF },
    { make: ftm,       title: "2. FILLING",     itemsKey: "pairs",      p: P.FILL, h: H.FILL },
    { make: quiz,      title: "3. READING QUIZ", itemsKey: "questions", p: P.RQ,   h: H.RQ }
  ];
  for (const ra of readingActs) {
    const act = twoSetAct(ra.make, `${source} / ${ra.title}`, ra.itemsKey, [
      { key: "practice", rows: ra.p },
      { key: "homework", rows: ra.h }
    ]);
    if (act) acts.push({ ...act, subfolder: "ACT" });
  }

  return { folder: folder || source, activities: acts };
}

// Is this a spreadsheet we can read directly (vs a .json bundle)?
export function isSpreadsheet(fileName) {
  return /\.(xlsm|xlsx|xls)$/i.test(fileName || "");
}
