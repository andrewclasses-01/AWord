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

const ftm = (title, pairs) => ({
  type: "find_the_match", title, theme: "classic", options: OPT_FTM,
  content: { pairs: pairs.filter(p => p[0]).map(([a, b]) => ({ keyword: a, definition: b })) }
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

// =============================================================
// SHEET SCANNER (Đợt 190, 18/8/2026) — FIND THE DATA BY ITS SHAPE, NOT BY THE
// SHEET'S NAME OR BY HARD-CODED COLUMN LETTERS.
//
// WHY. Measured over the teacher's 121 real lesson workbooks on 18/8/2026 (the
// whole of D:\4. LISTENING + D:\5. READING), the fixed names and columns this
// file used to trust are the MINORITY case:
//   • the four-clue vocabulary table lives on a sheet called `WORDTABLE` in only
//     53 files. 65 more carry the SAME table under the name `CROSSWORD`, and a
//     handful use `CROSSWORD ADVANCED` / `VOCABTABLE1` / `WORDTABLE2` / `TABLE1`.
//     Those 65 files imported NO vocabulary at all.
//   • of 200 quiz sheets, only 80 are in the `question | correct | wrong…`
//     shape the old reader assumed. 76 are `No. | (blank) | question | correct |
//     wrong…` (imported nothing) and 16 are `No. | question | correct | wrong…`
//     (imported the row NUMBER as the question — junk, silently).
//   • the three Reading-act sections are NOT at fixed rows. A file whose True/
//     false block runs long pushes the reading-quiz down, and the old fixed band
//     41..70 then read fill-in-the-blank rows as quiz questions.
// Every one of those failures was silent: the act simply came out empty or
// wrong, and nothing on screen said which sheet had been missed.
//
// WHAT REPLACES IT. Each block of the vocabulary table is a run of three
// columns — /ipa/ · WORD · clue — so the table is found by looking for that
// TRIPLE anywhere in the sheet. That one rule covers both column layouts seen in
// the corpus (the common one starting at C/D/E, and the variant that repeats the
// word in F and pushes everything one to the right), and it labels the blocks by
// reading them: an English clue makes ENG1/ENG2, a Vietnamese one VI1/VI2.
// Quiz columns are found as "the text columns, in order" — leading numbering and
// blank spacer columns drop out on their own. Reading-act sections are cut at
// their HEADER rows (`No.` / `STT`) instead of at fixed row numbers.
// =============================================================

// A cell is one of: an IPA transcription, a number, or text (Vietnamese or not).
const RE_IPA = /^\/[^/]*\/$/;
const RE_NUM = /^\d+([.,]\d+)?$/;
const RE_VI = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
// A clue is a sentence; a word (or short phrase like "SKIN-SCRAPER", "WASH
// DOWN") is not. 25 characters separates them on every row of the corpus.
const LONG_AT = 25;

// Column statistics over the non-empty cells of one 0-indexed column.
function colStats(grid, c) {
  const s = { n: 0, ipa: 0, num: 0, long: 0, short: 0, vi: 0 };
  for (const row of grid) {
    const v = row[c] || "";
    if (!v) continue;
    s.n++;
    if (RE_IPA.test(v)) s.ipa++;
    else if (RE_NUM.test(v)) s.num++;
    else if (v.length >= LONG_AT) { s.long++; if (RE_VI.test(v)) s.vi++; }
    else s.short++;
  }
  return s;
}

// The `/ipa/ · WORD · clue` runs in this sheet, left to right, non-overlapping.
// Returns 1-indexed column numbers so they read like the spreadsheet does.
function findVocabBlocks(grid) {
  const width = grid.reduce((w, r) => Math.max(w, r.length), 0);
  const out = [];
  for (let c = 0; c + 2 < width; c++) {
    const ipa = colStats(grid, c), word = colStats(grid, c + 1), clue = colStats(grid, c + 2);
    if (ipa.n < 3 || word.n < 3 || clue.n < 3) continue;
    if (ipa.ipa / ipa.n < 0.6) continue;
    if (word.short / word.n < 0.6) continue;
    if (clue.long / clue.n < 0.5) continue;
    // A clue set is Vietnamese if its sentences carry Vietnamese letters. Read
    // rather than assumed, so a file that ever ships three English sets or one
    // Vietnamese one still lands on the right buttons.
    out.push({ ipa: c + 1, word: c + 2, clue: c + 3, vi: clue.vi / clue.long >= 0.4 });
    c += 2;                       // a column belongs to at most one block
  }
  return out;
}

// Fallback for a table with no IPA column at all: adjacent `WORD · clue` pairs.
function findVocabPairs(grid) {
  const width = grid.reduce((w, r) => Math.max(w, r.length), 0);
  const out = [];
  for (let c = 0; c + 1 < width; c++) {
    const word = colStats(grid, c), clue = colStats(grid, c + 1);
    if (word.n < 3 || clue.n < 3) continue;
    if (word.short / word.n < 0.6) continue;
    if (clue.long / clue.n < 0.5) continue;
    out.push({ ipa: 0, word: c + 1, clue: c + 2, vi: clue.vi / clue.long >= 0.4 });
    c += 1;
  }
  return out;
}

// Name the blocks in the order they appear: English ones become ENG1/ENG2,
// Vietnamese ones VI1/VI2. Extra blocks beyond four are dropped rather than
// invented into new keys — nothing downstream knows what a fifth set would be.
function labelBlocks(blocks) {
  const en = ["eng1", "eng2"], vi = ["vi1", "vi2"];
  return blocks.map(b => ({ ...b, key: (b.vi ? vi : en).shift() || "" })).filter(b => b.key);
}

// The columns of a block that actually carry FIELDS, in order. A numbering
// column (all digits) and a blank spacer column are not fields, so they drop out
// on their own — which is the whole reason the reader no longer needs to know
// whether a sheet starts at column A, B or C.
function textCols(grid) {
  const width = grid.reduce((w, r) => Math.max(w, r.length), 0);
  const cols = [];
  for (let c = 0; c < width; c++) {
    const s = colStats(grid, c);
    if (s.n < 2) continue;
    if ((s.num + s.ipa) / s.n >= 0.5) continue;
    cols.push(c + 1);
  }
  return cols;
}

// [question, correct, …wrong] for a quiz-shaped sheet.
function findQuizCols(grid) {
  const cols = textCols(grid);
  return cols.length >= 2 ? { q: cols[0], correct: cols[1], wrong: cols.slice(2, 8) } : null;
}

// Cut a sheet into blocks at its BLANK ROWS. Header rows were the obvious
// divider and they are the WRONG one: measured on the corpus, 2 of the 13 real
// Reading-act sheets carry no header at all, and in one of them every row of the
// fill-in section begins with a WORD in the first column — which reads exactly
// like a header and produced 30 "headers" in a row.
function splitBlocks(grid) {
  const out = [];
  let cur = [];
  for (const row of grid) {
    if (row.some(Boolean)) cur.push(row);
    else { if (cur.length >= 2) out.push(cur); cur = []; }
  }
  if (cur.length >= 2) out.push(cur);
  return out;
}

// Drop a block's header row, when it has one. Two independent tells, because
// neither covers the corpus alone: the rows below a header are NUMBERED while
// the header is not, and a header is all SHORT labels above rows that carry
// sentences.
function stripHeader(rows) {
  if (rows.length < 3) return rows;
  const first = rows[0], rest = rows.slice(1);
  const firstField = first.find(Boolean) || "";
  if (RE_NUM.test(firstField)) return rows;                 // the first row is data
  const numbered = rest.filter(r => RE_NUM.test(r.find(Boolean) || "")).length;
  if (numbered / rest.length >= 0.6) return rest;
  const firstIsShort = first.every(v => !v || v.length < LONG_AT);
  const restIsLong = rest.filter(r => r.some(v => v && v.length >= LONG_AT)).length;
  if (firstIsShort && restIsLong / rest.length >= 0.6) return rest;
  return rows;
}

// Which of the three Reading-act exercises this block is — read off its SHAPE,
// not its position, so a file that ships them in another order (or ships a
// fourth block, as two files do) still lands each one in the right act:
//   four fields or more            -> the reading quiz (question + 3-4 answers)
//   two fields, first one a SENTENCE -> True/false (a true and a false version)
//   two fields, first one a WORD      -> fill in the blank (answer + sentence)
function sectionKind(rows) {
  const cols = textCols(rows);
  if (cols.length >= 4) return "rq";
  if (cols.length < 2) return null;
  const s = colStats(rows, cols[0] - 1);
  return s.long / s.n >= 0.5 ? "tf" : "fill";
}

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

  // A sheet read out as a plain array of rows of strings, for the scanners at
  // the top of this file. Capped so a sheet with a stray cell far down (these
  // generated workbooks have plenty) can't turn into a million-cell read.
  // ⚠️ BLANK ROWS ARE KEPT. It is tempting to drop them — the scanners ignore
  // empty cells anyway — but `grid[i]` IS sheet row `i+1`, and the Reading-act
  // reader below depends on that in two places at once: findSections() reports
  // header rows by position, and the fallback bands (2-16 / 19-38 / 41-70) are
  // written in real spreadsheet rows. Compacting silently slides one against
  // the other, which reads the wrong section and still produces a full-looking
  // act.
  const SCAN_ROWS = 500, SCAN_COLS = 26;
  const gridOf = (ws, cols = SCAN_COLS) => {
    if (!ws) return [];
    const rows = Math.min(maxRow(ws), SCAN_ROWS);
    const g = [];
    for (let r = 1; r <= rows; r++) {
      const row = [];
      for (let c = 1; c <= cols; c++) row.push(cell(ws, r, c));
      g.push(row);
    }
    return g;
  };

  const source = sourceStem(fileName);
  const acts = [];

  // ---- the vocabulary table ----
  // ⭐ 14/8/2026 (Đợt 145) — ONE act, FOUR clue sets. Each block of the table
  // repeats the SAME word — measured across the teacher's lesson files, 100 rows
  // out of 100 identical — and only the CLUE differs: an English definition
  // (ENG1), an easier English one (ENG2), a Vietnamese meaning (VI1), a
  // Vietnamese example sentence (VI2). So one ROW of the sheet is one word
  // wearing four clues, and it imports as ONE act whose Options row picks the
  // set being played (core/content-view.js).
  // ⭐ 18/8/2026 (Đợt 190) — the sheet and the columns are now FOUND, not
  // assumed: `WORDTABLE` was the right name in only 53 of the teacher's 121
  // lesson files (65 keep the identical table on a sheet called `CROSSWORD`),
  // and one layout repeats the word in an extra column, shifting every block one
  // to the right. See the SHEET SCANNER block at the top of this file.
  // Sheets that are known to hold something else are skipped outright: they can
  // never win the scan, and reading them is wasted work on every import.
  const NOT_VOCAB = /^(QUIZ|READINGACT|RUNNING|PARAGRAPH|CUT|FILL|SLIDE|VIDEO|CHART|LOGIC|TRANSLATION)/;
  let vocabGrid = [], vocabBlocks = [];
  for (const norm of Object.keys(names)) {
    if (NOT_VOCAB.test(norm)) continue;
    const grid = gridOf(wb.Sheets[names[norm]]);
    if (grid.length < 3) continue;
    const found = labelBlocks(findVocabBlocks(grid));
    if (found.length > vocabBlocks.length) { vocabGrid = grid; vocabBlocks = found; }
  }
  // No IPA column anywhere: fall back to bare `WORD · clue` pairs, so a table
  // that never had a transcription still imports its clue sets.
  if (!vocabBlocks.length) {
    for (const norm of Object.keys(names)) {
      if (NOT_VOCAB.test(norm)) continue;
      const grid = gridOf(wb.Sheets[names[norm]]);
      if (grid.length < 3) continue;
      const found = labelBlocks(findVocabPairs(grid));
      if (found.length > vocabBlocks.length) { vocabGrid = grid; vocabBlocks = found; }
    }
  }
  const WORDS = [];
  vocabGrid.forEach(row => {
    const at = c => (c ? row[c - 1] || "" : "");
    // Read the row across all blocks. The word is taken from the first block
    // that has one, so a lesson file that fills only some of them still imports
    // every word it does have.
    const clues = {};
    let word = "";
    for (const b of vocabBlocks) {
      const w = at(b.word);
      if (!w) continue;
      if (!word) word = w;
      clues[b.key] = at(b.clue);
    }
    if (!word) return;
    // ⭐ Đợt 190 (teacher, 18/8/2026) — THE TRANSCRIPTION IS A CLUE SET OF ITS
    // OWN. It used to leave the act altogether, as two standalone acts
    // (PRONUNCIATION + IPA); it is now a fifth set inside WORDS, which is what
    // lets Edit correct it on its own tab and what feeds the new IPA mode.
    // Taken from the block's own /ipa/ column rather than by splitting the old
    // "WORD /ipa/" summary column: that column is missing from 9 files and sits
    // one place further right in another, while the per-block column is on every
    // row of every table in the corpus.
    const ipa = vocabBlocks.map(b => at(b.ipa)).find(s => RE_IPA.test(s)) || "";
    if (ipa) clues.pron = ipa;
    WORDS.push({ word, clue: clues[DEFAULT_VARIANT] || "", clues });
  });
  // Only offer a variant BUTTON for a clue set this file actually filled in —
  // the OPT-IN rule from Đợt 143: a control that is there but does nothing is
  // worse than a missing one, because nothing on screen says so.
  const presentVariants = ["eng1", "eng2", "vi1", "vi2", "pron"]
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
  // ⛔ Đợt 190 — the two standalone acts this file used to build out of the
  // transcription column are GONE (teacher, 18/8/2026): `PRONUNCIATION` (an
  // Anagram clued by /ipa/) and `IPA` (Speaking cards showing "WORD /ipa/").
  // Both said exactly what the WORDS act now says on its own PRONUNCIATION tab,
  // and both are reachable from it — the first by picking that clue set, the
  // second through MODE › IPA. Nine acts per lesson file becomes seven.
  // ⚠️ Acts already imported under the old rule are untouched: they are ordinary
  // saved acts, and nothing here reaches into the teacher's library.

  // The bare word list the two racing games need.
  const WORDLIST = WORDS.map(it => it.word);
  // RUNNING WORD — the two-team chess-clock race. It needs nothing but the bare
  // word list (the same pool the teacher's hand-made `RunningW` sheet drew its
  // two 50-word lists from). No clues, no answers: the explainer supplies the
  // meaning out loud. The transcription rides along when the row has one — it is
  // read off the item's own PRONUNCIATION clue now, so it can never fall out of
  // step with the word beside it.
  if (WORDLIST.length >= 2) {
    acts.push(runningWord(`${source} / RUNNING WORD`,
      WORDS.map(it => ({ word: it.word, ipa: it.clues.pron || "" }))));
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
  // ⭐ Đợt 190 — the COLUMNS are found, not assumed. Of 200 quiz sheets in the
  // teacher's 121 lesson files only 80 start at column A: 76 begin with a
  // numbering column and a blank spacer (those imported nothing at all), and 16
  // with a numbering column alone (those imported the row NUMBER as the
  // question). findQuizCols() takes the text columns in order, so the numbering
  // and the spacer drop out by themselves. The practice half is `QUIZ1` where
  // the file has one and plain `QUIZ` where it does not — 53 files name it that.
  const readQuizSheet = (...tags) => {
    const wq = sheet(...tags);
    const grid = gridOf(wq, 12);
    const cols = grid.length ? findQuizCols(grid) : null;
    if (!cols) return [];
    const rows = [];
    grid.forEach(row => {
      const at = c => row[c - 1] || "";
      const q = at(cols.q);
      if (q) rows.push([q, at(cols.correct), cols.wrong.map(at).filter(Boolean)]);
    });
    return rows;
  };
  const quizAct = twoSetAct(quiz, `${source} / QUIZ`, "questions", [
    { key: "practice", rows: readQuizSheet("QUIZ1", "QUIZ") },
    { key: "homework", rows: readQuizSheet("QUIZ2") }
  ]);
  if (quizAct) acts.push({ ...quizAct, subfolder: "ACT" });

  // ---- reading acts READINGACT1 (v1) / READINGACT2 (v2) ----
  // ⭐ Đợt 190 — the three sections are cut at their HEADER rows ("No." / "STT"),
  // not at fixed row numbers. The bands 2-16 / 19-38 / 41-70 this used to assume
  // are only true while every section is exactly full: a True/false block that
  // runs long pushes the reading quiz down, and the old third band then read
  // fill-in-the-blank rows as quiz questions — a silently wrong act, measured on
  // DW-S2.W1 (its quiz starts at row 50, not 41).
  // The row shape itself is unchanged and is the same in all three sections:
  // column B is the first field, C the second, D-F the extra quiz answers.
  const readRa = ws => {
    const out = { TF: [], FILL: [], RQ: [] };
    const grid = gridOf(ws, 8);
    if (!grid.length) return out;
    for (const raw of splitBlocks(grid)) {
      const rows = stripHeader(raw);
      const cols = textCols(rows);
      const kind = sectionKind(rows);
      if (!kind || cols.length < 2) continue;
      const at = (r, c) => r[c - 1] || "";
      // FIRST block of each kind wins. Two files in the corpus carry a FOURTH
      // block (a second question/answer list) that reads as True/false on
      // shape alone; without this it would replace the real one.
      if (kind === "rq" && !out.RQ.length) {
        out.RQ = rows
          .map(r => [at(r, cols[0]), at(r, cols[1]), cols.slice(2, 5).map(c => at(r, c)).filter(Boolean)])
          .filter(x => x[0]);
      } else if (kind === "tf" && !out.TF.length) {
        out.TF = rows.map(r => [at(r, cols[0]), at(r, cols[1])]).filter(x => x[0]);
      } else if (kind === "fill" && !out.FILL.length) {
        out.FILL = rows.map(r => [at(r, cols[0]), at(r, cols[1])]).filter(x => x[0]);
      }
    }
    return out;
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
