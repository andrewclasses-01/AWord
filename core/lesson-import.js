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
const OPT_ANA  = { timer: "countUp", shuffleQuestions: true, anagramMode: "bonus", allCaps: true, allowSkip: false, showAnswers: true, contentMode: "text" };
// Which clue set a freshly imported vocabulary act opens on, and the one whose
// text is mirrored into each item's plain `.clue` (see core/content-view.js).
const DEFAULT_VARIANT = "eng1";
const ftm = (title, pairs) => ({
  type: "find_the_match", title, theme: "classic", options: OPT_FTM,
  content: { pairs: pairs.filter(p => p[0]).map(([a, b]) => ({ keyword: a, definition: b })) }
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

// The "source" code that PREFIXES ACT TITLES (same rule as taoact). Deliberately
// the bare code with the lesson's name cut off — `DS-S4.I1.W1 / WORDS` is what
// fits on a card, and the name is already spelled out by the folder the act
// sits in (see lessonFolderPath below).
function sourceStem(fileName) {
  let stem = (fileName || "").replace(/\.(xlsm|xlsx|xls)$/i, "").trim();
  const m = stem.match(/^([A-Za-z0-9]+-S\d+(?:\.[A-Za-z0-9+\-]+)+)/);
  return m ? m[1] : stem;
}

// =============================================================
// THE FOLDER PATH A LESSON FILE BELONGS IN (Đợt 221, 21/8/2026 — thầy)
//
// Measured over all 137 real lesson workbooks in D:\4. LISTENING + D:\5. READING
// (21/8/2026), the teacher's file names carry the whole tree inside them, and
// ONE rule reads it: EVERY DOT IN THE CODE IS A FOLDER LEVEL, and each level is
// named by the code SO FAR.
//
//   LSA2-S2.T1.P1-2   ->  LSA2-S2 / LSA2-S2.T1 / LSA2-S2.T1.P1-2
//   DS-S4.I1.W1       ->  DS-S4   / DS-S4.I1   / DS-S4.I1.W1
//   DW-S2.W1          ->  DW-S2   / DW-S2.W1
//
// which is, level for level, the tree on the teacher's own disk. Above that sit
// two more folders read off the letters BEFORE `-S`: the subject (LISTENING /
// READING) and the numbered category the teacher files that series under.
//
// ⚠️ THE PREFIX IS AN EXACT KEY, NOT A "starts-with" TEST — and that is the
// whole reason `-S` is the split point. `IE` is a leading substring of `IEL`, so
// a starts-with scan would file `IEL-S15` (IELTS listening) under whichever of
// the two it happened to try first. Cutting at `-S` yields `IEL` or `IE`
// exactly, and the table below is looked up, never searched.
//
// ⚠️ NO ALIAS TABLE, ON PURPOSE (thầy chốt 21/8/2026: *"theo mã, tự động"*).
// Two places on disk disagree with their own file names — `LSFLY-S2` holds files
// called `FLY-S2.T…`, and `DORAEMON 1` holds `DR-S1.EP…` — so AWord will build
// `FLY-S2` and `DR-S1` instead. That is deliberate: a new season then needs no
// code change, and the confirm screen shows the path before anything is made.
//
// ⚠️ A prefix that is NOT in this table gets NO tree at all (one folder, named
// after the file — exactly what import did before this đợt). Inventing a tree
// out of an unrecognised code would file a lesson somewhere the teacher would
// have to go hunting for. Teaching AWord a new series is one line here.
// =============================================================
const LESSON_TREE = {
  LSFLY: ["LISTENING", "1. LISTENING FOR FLYER"],
  FLY:   ["LISTENING", "1. LISTENING FOR FLYER"],
  LSA2:  ["LISTENING", "2. LISTENING FOR A2"],
  LSB1:  ["LISTENING", "3. LISTENING FOR B1"],
  IEL:   ["LISTENING", "4. LISTENING FOR IELTS"],
  IE:    ["LISTENING", "4. LISTENING FOR IELTS"],
  DR:    ["READING", "1. DORAEMON"],
  DW:    ["READING", "2. DAILY WARM-UP"],
  DS:    ["READING", "3. DAILY SCIENCE"],
  IER:   ["READING", "4. READING FOR IELTS"]
};
// `LSA2` · `-S` · `2` · `.T1.P1-2`. The prefix cannot contain `-`, so it always
// stops right before `-S`; the tail takes as many `.PART` groups as it can, and
// stops on its own at `. ` (a dot followed by a SPACE), which is how the
// Doraemon and Daily warm-up files separate their code from the episode name.
const RE_LESSON_CODE = /^([A-Za-z0-9]+)-S(\d+)((?:\.[A-Za-z0-9+\-]+)*)/;
// ⛔ MEASURED, NOT IMAGINED (scratch/dot221-path.mjs over all 137 files):
// Google Drive resolves a sync conflict by inserting " (1)" INTO THE MIDDLE of
// the name — `LSB1-S2 (1).T3.P2`, `IEL-S15 (1) (1).T3.P1`. That space stops the
// code dead at `LSB1-S2`, so 6 real files came out with their `.T3` level
// missing: one folder instead of three, filed at the wrong depth and nothing on
// screen to say so. Stripping the marker BEFORE reading the code puts them back
// in the right place. ⚠️ Only the tree levels are cleaned — the deepest folder
// keeps the file's own name, `(1)` and all, so a Drive duplicate is still
// visibly a duplicate instead of quietly merging with the real lesson.
const RE_DRIVE_DUP = /\s*\((\d+)\)/g;
// And a plain typo, also measured: `IER-S15..T1.P2_DRIVERLESS CAR.xlsm` has TWO
// dots. A doubled dot stops the code just as dead as the Drive marker does — one
// folder instead of three — for something no one would ever call a different
// lesson. Same treatment: repaired for reading the tree, left alone in the
// deepest folder's name so the typo is still visible where it can be fixed.
const RE_DOUBLE_DOT = /\.{2,}/g;
// A folder name may not carry a path separator: `importBundle()` keys its cache
// on segments joined with "/", so a name containing one would collide with a
// real two-level path. Windows file names cannot contain either character, so
// this only ever fires on a hand-typed name.
const cleanSeg = s => String(s || "").replace(/[/\\]/g, " ").trim();

// -> { segments: [...], leaf, known }.  `known` false means "no tree was
// recognised" — the caller says so on screen rather than pretending.
export function lessonFolderPath(fileName) {
  const stem = (fileName || "").replace(/\.(xlsm|xlsx|xls)$/i, "").trim();
  const m = stem.replace(RE_DRIVE_DUP, "").replace(RE_DOUBLE_DOT, ".").match(RE_LESSON_CODE);
  const place = m ? LESSON_TREE[m[1].toUpperCase()] : null;
  if (!m || !place) return { segments: [cleanSeg(stem)].filter(Boolean), leaf: stem, known: false };

  // The code's own levels, each named by everything up to that dot.
  const parts = `${m[1]}-S${m[2]}${m[3]}`.split(".");
  const chain = parts.map((_, i) => parts.slice(0, i + 1).join("."));
  // ⭐ THE DEEPEST LEVEL KEEPS THE LESSON'S NAME (thầy chốt 21/8/2026). It is the
  // whole file stem, not code + " " + name, so whatever the file used to join
  // them survives byte for byte: `DR-S1.EP1. All The Way…` keeps its ". ".
  // ⭐ This also fixes a collision that has been silent since Đợt 190:
  // `DS-S4.I1.W1 BEAVERS AND DAMS.xlsm` and `DS-S4.I1.W1 SLIDE INSTRUCTION.xlsm`
  // used to import into ONE folder called `DS-S4.I1.W1` and overwrite each other.
  chain[chain.length - 1] = stem;
  const segments = [...place, ...chain].map(cleanSeg).filter(Boolean);
  return { segments, leaf: stem, known: true };
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
  // ⭐⭐ 19/8/2026 (Đợt 204) — A SECOND VOCABULARY TABLE, `WORDTABLE2` (the
  // teacher also writes it `WORDTABLE 2`, which normalizes to the same key).
  // A lesson can carry two word sets; until now the scan kept exactly ONE
  // table — the sheet with the most blocks — and the other one was dropped
  // WITHOUT A WORD ON SCREEN. Measured on the teacher's 138 real lesson files
  // (19/8/2026, `scratch/wt2-scan.mjs`): 13 files hold two vocabulary tables,
  // and in `DS-S4.I1.W1 BEAVERS AND DAMS` the dropped `WORDTABLE 2` is 95
  // words that appear NOWHERE ELSE (numbers 96..190, against 1..95 in the
  // first table) — which is why that lesson has had to keep a second workbook,
  // `..._WORD 2.xlsm`, beside it.
  //
  // ⚠️ WHY BY NAME, when Đợt 190 went to such lengths to stop trusting names.
  // Đợt 190's rule answers "WHICH SHEET IS A VOCABULARY TABLE" — that must stay
  // shape-based (65 of the files call it `CROSSWORD`). This asks a different
  // question: "WHICH OF THE TWO IS THE SECOND ONE", and shape cannot answer it —
  // both tables are the same shape by construction. Taking "the runner-up of the
  // scan" instead would be actively wrong: of those 13 files, 12 have a runner-up
  // that is NOT a second word set (`WORDADVANCE`, `CROSSWORDADVANCED`,
  // `CROSSWORD(2)`, `CROSSWORD4+5`…), so every one of them would sprout a junk
  // "WORDS 2" act. Only the sheet the teacher deliberately named `2` counts.
  // ⚠️ A file whose ONLY vocabulary table happens to be called `WORDTABLE2`
  // still imports as plain `/ WORDS` (see the promotion below) — the Đợt 190
  // notes record such files, so the guard is cheap insurance against a rename.
  // ⚠️ Other "second-ish" sheets stay dropped ON PURPOSE (`CROSSWORD2`,
  // `WORDADVANCE`, `CROSSWORDADVANCED`, `TABLEMIX2`): nobody has said they are
  // word sets. Adding one later is one alternative in RE_TABLE2 and nothing else.
  const NOT_VOCAB = /^(QUIZ|READINGACT|RUNNING|PARAGRAPH|CUT|FILL|SLIDE|VIDEO|CHART|LOGIC|TRANSLATION)/;
  const RE_TABLE2 = /^WORDTABLE2$/;   // names are already UPPER + space-stripped
  // Every sheet that reads as a vocabulary table, in one pass. `find` is the
  // block finder to use — the IPA triple first, and only if NO sheet in the
  // whole workbook yields one, the bare `WORD · clue` fallback (a table that
  // never had a transcription still imports its clue sets).
  const scanVocab = find => {
    const out = [];
    for (const norm of Object.keys(names)) {
      if (NOT_VOCAB.test(norm)) continue;
      const grid = gridOf(wb.Sheets[names[norm]]);
      if (grid.length < 3) continue;
      const blocks = labelBlocks(find(grid));
      if (blocks.length) out.push({ norm, grid, blocks });
    }
    return out;
  };
  let cands = scanVocab(findVocabBlocks);
  if (!cands.length) cands = scanVocab(findVocabPairs);
  // The winner of each side, by block count — `>` so a tie keeps the sheet the
  // workbook lists first, exactly as the single-winner loop did before.
  const best = list => list.reduce((w, c) => (!w || c.blocks.length > w.blocks.length ? c : w), null);
  let table1 = best(cands.filter(c => !RE_TABLE2.test(c.norm)));
  let table2 = best(cands.filter(c => RE_TABLE2.test(c.norm)));
  // Only-table promotion: `WORDTABLE2` alone is this lesson's word set, not its
  // second one, and must import under the plain title.
  if (!table1 && table2) { table1 = table2; table2 = null; }
  // Read ONE table into its list of {word, clue, clues}. Đợt 204 lifted this out
  // of the top level so the second table goes through byte-for-byte the same
  // reader — a second copy of these rules would drift the first time one of them
  // is corrected.
  const readVocab = (vocabGrid, vocabBlocks) => {
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
      // The transcription, taken from the block's own /ipa/ column rather than by
      // splitting the old "WORD /ipa/" summary column: that column is missing from
      // 9 files and sits one place further right in another, while the per-block
      // column is on every row of every table in the corpus.
      //
      // ⛔⛔ Đợt 212 (20/8/2026, thầy) — IT IS A FIELD OF THE WORD, NOT A CLUE SET.
      // Đợt 190 wrote it to `clues.pron`, which made it the fifth clue set: an
      // Edit tab and an Options button inside the combined act. Thầy: *"Khi import
      // cũng không import dữ liệu này vào act tích hợp chung này nữa"* — a
      // PRONUNCIATION act of its own is coming.
      // ⭐ Written to `ipa` instead of dropped, because two things that are NOT
      // the retired clue set live off it and thầy kept both: MODE › IPA (through
      // resolveItem's `rest.ipa`, core/content-view.js) and RUNNING WORD, which
      // has printed the transcription beside each word since long before Đợt 190.
      // ⚠️ So the column is still READ — only its destination moved. Stop reading
      // it and two features die quietly, neither of them the one being retired.
      const ipa = vocabBlocks.map(b => at(b.ipa)).find(s => RE_IPA.test(s)) || "";
      WORDS.push({ word, clue: clues[DEFAULT_VARIANT] || "", clues, ipa });
    });
    return WORDS;
  };

  // Build one table's WORDS act. `suffix` is "" for the lesson's word set and
  // " 2" for the second one (`WORDTABLE2`), so the title reads `xxx / WORDS 2`.
  // ⚠️ Every act here carries the SAME options preset and the SAME shape as the
  // first table's — a second word set is an ordinary word set, not a variant of
  // the first, and nothing downstream is allowed to tell them apart.
  const pushVocabActs = (WORDS, suffix) => {
    // Only offer a variant BUTTON for a clue set this file actually filled in —
    // the OPT-IN rule from Đợt 143: a control that is there but does nothing is
    // worse than a missing one, because nothing on screen says so.
    // ⛔ Đợt 212 — "pron" is off this list: it is no longer a clue set at all
    // (see readVocab above). `variantsOf()` would filter it out anyway, but a
    // file that never writes it is one fewer thing relying on that filter.
    const presentVariants = ["eng1", "eng2", "vi1", "vi2"]
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
        type: "anagram", title: `${source} / WORDS${suffix}`, theme: "classic",
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
    // Nine acts per lesson file becomes seven — then five from Đợt 268, when
    // RUNNING WORD and RUNNING TEAM stopped being separate acts too.
    // ⚠️ Đợt 212 RETIRED THE CLUE SET BUT DID NOT BRING THESE BACK — thầy is
    // building one PRONUNCIATION act with more in it than either of them had.
    // Of the two ways in that Đợt 190 offered, MODE › IPA is the one still
    // standing; picking the clue set is not.
    // ⚠️ Acts already imported under the old rule are untouched: they are ordinary
    // saved acts, and nothing here reaches into the teacher's library.

    // ⭐ Đợt 268 — RUNNING WORD and RUNNING TEAM are no longer generated here
    // (thầy, 26/8/2026): both racing modes already live INSIDE the WORDS act
    // itself via Change Template (core/engine.js runTargets(), RUN_ORDER —
    // uses the same word pool through core/convert.js's switchTargets()), so a
    // separate standalone act was pure duplication.
  };

  // The lesson's word set, then the second one if the file carries a filled-in
  // `WORDTABLE2`. An EMPTY `WORDTABLE2` (a blank template — 2 of the teacher's
  // 138 files ship one) yields no blocks, so `table2` is null and not one extra
  // act appears: the acts a file produces never change until it gains real rows.
  pushVocabActs(readVocab(table1 ? table1.grid : [], table1 ? table1.blocks : []), "");
  if (table2) pushVocabActs(readVocab(table2.grid, table2.blocks), " 2");

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
  if (quizAct) acts.push(quizAct);

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
    if (act) acts.push(act);
  }

  // ⭐ Đợt 221 — the bundle now carries a PATH, not a folder name. `folder` is
  // kept beside it (the deepest segment) because a hand-written .json bundle
  // still only has that, and `importBundle()` falls back to it.
  const path = lessonFolderPath(fileName);
  return {
    folder: folder || path.leaf || source,
    folderPath: folder ? [folder] : path.segments,
    folderPathKnown: folder ? false : path.known,
    activities: acts
  };
}

// Is this a spreadsheet we can read directly (vs a .json bundle)?
export function isSpreadsheet(fileName) {
  return /\.(xlsm|xlsx|xls)$/i.test(fileName || "");
}
