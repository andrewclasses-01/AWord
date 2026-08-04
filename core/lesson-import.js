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
const OPT_ANA  = { timer: "countUp", shuffleQuestions: true, anagramMode: "bonus", allCaps: true, allowSkip: true, showAnswers: true };
// Running word runs its OWN two clocks, so the engine's whole-game timer is off.
// wordsPerTeam 0 = "give each team the whole pool"; the teacher normally drops it
// to ~50 in the Options panel, which is what makes the two lists overlap.
const OPT_RW   = { timer: "none", teamAName: "TEAM A", teamBName: "TEAM B", clockSeconds: 300,
                   incrementSeconds: 0, wordsPerTeam: 0, allowPass: true, passPenaltySeconds: 10,
                   andrewUses: 1, warnSeconds: 15 };

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
const runningWord = (title, words) => ({
  type: "running_word", title, theme: "classic", options: { ...OPT_RW },
  content: { words: words.filter(Boolean) }
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
  const cell = (ws, row1, col1) => {
    if (!ws) return "";
    const c = ws[XLSX.utils.encode_cell({ r: row1 - 1, c: col1 - 1 })];
    if (!c) return "";
    const v = c.v != null ? c.v : c.w;
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
  const wt = sheet("WORDTABLE");
  const ENG1 = [], ENG2 = [], VI1 = [], VI2 = [], IPA = [];
  if (wt) {
    const rows = maxRow(wt);
    for (let r = 1; r <= rows; r++) {
      const d = cell(wt, r, 4); if (d) ENG1.push([d, cell(wt, r, 5)]);
      const h = cell(wt, r, 8); if (h) ENG2.push([h, cell(wt, r, 9)]);
      const l = cell(wt, r, 12); if (l) VI1.push([l, cell(wt, r, 13)]);
      const p = cell(wt, r, 16); if (p) VI2.push([p, cell(wt, r, 17)]);
      const s = cell(wt, r, 19); if (s) IPA.push(s);
    }
  }
  if (ENG1.length) acts.push(anagram(`${source} / ENG1`, ENG1));
  if (ENG2.length) acts.push(anagram(`${source} / ENG2`, ENG2));
  if (VI1.length)  acts.push(anagram(`${source} / VI1`, VI1));
  if (VI2.length)  acts.push(anagram(`${source} / VI2`, VI2));
  // PRONUNCIATION: unscramble the word with its IPA as the clue — split the IPA
  // column's "WORD /ipa/" into word + pronunciation.
  const PRON = [];
  IPA.forEach(t => { const m = t.match(/^(.+?)\s+(\/[^/]*\/)\s*$/); if (m) PRON.push([m[1].trim(), m[2].trim()]); });
  if (PRON.length) acts.push(anagram(`${source} / PRONUNCIATION`, PRON));
  if (IPA.length)  acts.push(speaking(`${source} / IPA`, IPA));
  // RUNNING WORD — the two-team chess-clock race. It needs nothing but the bare
  // word list, so it reuses ENG1's words (column D = the same pool the teacher's
  // hand-made `RunningW` sheet drew its two 50-word lists from). No clues, no
  // answers: the explainer supplies the meaning out loud.
  if (ENG1.length >= 2) acts.push(runningWord(`${source} / RUNNING WORD`, ENG1.map(([w]) => w)));

  // ---- comprehension Quiz1 / Quiz2 (listening files) ----
  for (const tag of ["QUIZ1", "QUIZ2"]) {
    const wq = sheet(tag);
    const rows = [];
    if (wq) {
      const rmax = maxRow(wq);
      for (let r = 1; r <= rmax; r++) {
        const q = cell(wq, r, 1);
        if (q) rows.push([q, cell(wq, r, 2), [3, 4, 5, 6, 7].map(c => cell(wq, r, c)).filter(Boolean)]);
      }
    }
    if (rows.length) acts.push({ ...quiz(`${source} / ${tag}`, rows), subfolder: "ACT" });
  }

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
  const versions = [
    { cands: ["READINGACT1", "READINGACTS", "READINGACT"], suffix: "", sub: "ACT" },
    { cands: ["READINGACT2"], suffix: " HW", sub: "ACT/HOMEWORK" }
  ];
  for (const { cands, suffix, sub } of versions) {
    const { TF, FILL, RQ } = readRa(sheet(...cands));
    if (TF.length)   acts.push({ ...trueFalse(`${source}${suffix} / 1. TRUE FALSE`, TF), subfolder: sub });
    if (FILL.length) acts.push({ ...ftm(`${source}${suffix} / 2. FILLING`, FILL), subfolder: sub });
    if (RQ.length)   acts.push({ ...quiz(`${source}${suffix} / 3. READING QUIZ`, RQ), subfolder: sub });
  }

  return { folder: folder || source, activities: acts };
}

// Is this a spreadsheet we can read directly (vs a .json bundle)?
export function isSpreadsheet(fileName) {
  return /\.(xlsm|xlsx|xls)$/i.test(fileName || "");
}
