// =============================================================
// TEMPLATE: CROSSWORD — Wordwall style, English UI.  (Classic look)
//  • Content = a list of { answer, clue } pairs. The interlocking GRID is
//    generated automatically from the answers (crossword builder below), just
//    like Wordwall — the teacher only types answer + clue.
//  • Tap a word (or its clue) -> the word highlights, the clue shows big above
//    the grid, the cursor lands on the first empty cell. Type letters (physical
//    keyboard OR the on-screen keyboard). Typing a letter fills the current cell
//    and advances. Filling every cell does NOT auto-grade (teacher's call,
//    1/8/2026): the student confirms with the keyboard's Submit key (or Enter
//    on a physical keyboard) — Submit stays disabled until the word is full.
//  • "Andrew help" (5th key of the standard keyboard, ONE use per game): shows
//    the current word's answer in gold on the clue bar; the student still types
//    it in themselves (copying it correctly still scores, same as Type the
//    answer). Leaving the word or grading it ends the glow; the key then goes
//    dark ("used") for the rest of the game.
//  • Correct  -> the word's cells turn the accent colour (white letters), a
//                point is scored, the "correct" sound plays.
//    Wrong    -> the "wrong" sound plays; if options.showAnswerWhenWrong is on,
//                the correct letters are revealed and the word locks (answered,
//                not scored). If off, the wrong letters flash red then clear so
//                the student can try again.
//  • Auto-finishes when every word is solved (or revealed). Menu "Submit
//    answers" / a count-down timer can end it early; unanswered = incorrect.
//  • Options: Timer (engine), Show answers (engine review), and this template's
//    own "Show answer when wrong". No Shuffle / Letters-on-answers (a crossword
//    grid is fixed) — the Letters group is hidden via hideLettersOption.
// =============================================================

import { registerTemplate } from "../../core/registry.js";
import { el } from "../../core/utils.js";
import { icons } from "../../core/icons.js";
import { autoFit } from "../../core/fit.js";
import { createKeyboard } from "../../core/keyboard.js";
import { openCrosswordEditor } from "./crossword-editor.js";
import { crosswordSound } from "./crossword-sound.js";

// Letters-only, UPPERCASE key for the grid (spaces / punctuation stripped, like
// Wordwall). Keeps the original answer for the review screen.
function gridKey(str) {
  return String(str ?? "").toUpperCase().replace(/[^A-Z]/g, "");
}

// -------------------------------------------------------------------
// CROSSWORD BUILDER — place words on a grid so they interlock at shared
// letters. Greedy: longest word first at the origin, then each next word takes
// its best-scoring valid crossing; a word that can't cross anything is dropped
// (kept out of the grid but still listed as a clue with "No answer" possible).
// Deterministic-ish given the same list (only the light tie-break shuffles).
// -------------------------------------------------------------------
function buildCrossword(words) {
  // words: [{ answer(raw), clue }]  ->  usable: [{ key, clue, answer }]
  const usable = words
    .map(w => ({ key: gridKey(w.answer), clue: w.clue || "", answer: w.answer || "" }))
    .filter(w => w.key.length >= 2);

  // De-dup identical grid words (keep the first clue).
  const seen = new Set();
  const list = [];
  for (const w of usable) { if (!seen.has(w.key)) { seen.add(w.key); list.push(w); } }
  // Longest first — long words give more crossing chances for the rest.
  list.sort((a, b) => b.key.length - a.key.length);

  const cells = new Map();              // "r,c" -> letter
  const placed = [];                    // { key, clue, answer, row, col, dir }
  const at = (r, c) => cells.get(r + "," + c);

  // Can `key` sit at (row,col) going dir ('A' across | 'D' down)?
  // Returns the number of crossings (>=0) or -1 if it doesn't fit.
  function fitScore(key, row, col, dir) {
    const dr = dir === "D" ? 1 : 0, dc = dir === "A" ? 1 : 0;
    let crossings = 0;
    // the cell just before the start and just after the end must be empty,
    // otherwise this word would extend/merge into an existing one.
    if (at(row - dr, col - dc) != null) return -1;
    if (at(row + dr * key.length, col + dc * key.length) != null) return -1;
    for (let i = 0; i < key.length; i++) {
      const r = row + dr * i, c = col + dc * i;
      const cur = at(r, c);
      if (cur != null) {
        if (cur !== key[i]) return -1;   // conflicting letter
        crossings++;
        continue;                        // a real crossing — perpendicular neighbours are allowed
      }
      // empty cell: its perpendicular neighbours must be empty too (no two
      // parallel words running side by side by accident).
      if (dir === "A") {
        if (at(r - 1, c) != null || at(r + 1, c) != null) return -1;
      } else {
        if (at(r, c - 1) != null || at(r, c + 1) != null) return -1;
      }
    }
    return crossings;
  }

  function stamp(w, row, col, dir) {
    const dr = dir === "D" ? 1 : 0, dc = dir === "A" ? 1 : 0;
    for (let i = 0; i < w.key.length; i++) cells.set((row + dr * i) + "," + (col + dc * i), w.key[i]);
    placed.push({ ...w, row, col, dir });
  }

  const skipped = [];
  list.forEach((w, wi) => {
    if (wi === 0) { stamp(w, 0, 0, "A"); return; }
    let best = null;   // { row, col, dir, score }
    for (const p of placed) {
      const pdr = p.dir === "D" ? 1 : 0, pdc = p.dir === "A" ? 1 : 0;
      for (let j = 0; j < p.key.length; j++) {
        const pr = p.row + pdr * j, pc = p.col + pdc * j;
        const letter = p.key[j];
        for (let i = 0; i < w.key.length; i++) {
          if (w.key[i] !== letter) continue;
          // cross perpendicular to p, lining up letter i of w onto (pr,pc)
          const dir = p.dir === "A" ? "D" : "A";
          const row = dir === "D" ? pr - i : pr;
          const col = dir === "A" ? pc - i : pc;
          const score = fitScore(w.key, row, col, dir);
          if (score > 0 && (!best || score > best.score)) best = { row, col, dir, score };
        }
      }
    }
    if (best) stamp(w, best.row, best.col, best.dir);
    else skipped.push(w);   // couldn't interlock — leave it out of the grid
  });

  if (!placed.length) return { grid: null, clues: [], rows: 0, cols: 0, skipped };

  // Normalise coordinates to a 0-based bounding box.
  let minR = Infinity, minC = Infinity, maxR = -Infinity, maxC = -Infinity;
  for (const key of cells.keys()) {
    const [r, c] = key.split(",").map(Number);
    minR = Math.min(minR, r); maxR = Math.max(maxR, r);
    minC = Math.min(minC, c); maxC = Math.max(maxC, c);
  }
  const rows = maxR - minR + 1, cols = maxC - minC + 1;

  // grid[r][c] = { sol } for playable cells, null for blank.
  const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => null));
  for (const [k, letter] of cells) {
    const [r, c] = k.split(",").map(Number);
    grid[r - minR][c - minC] = { sol: letter, num: 0 };
  }
  placed.forEach(p => { p.row -= minR; p.col -= minC; });

  // Number the START cells (row-major). A cell starts an Across word if it has
  // no left neighbour but a right one; starts a Down word if no top but a bottom.
  let n = 0;
  const numAt = new Map();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!grid[r][c]) continue;
      const startsAcross = (c === 0 || !grid[r][c - 1]) && (c + 1 < cols && grid[r][c + 1]);
      const startsDown = (r === 0 || !grid[r - 1][c]) && (r + 1 < rows && grid[r + 1][c]);
      if (startsAcross || startsDown) { n++; grid[r][c].num = n; numAt.set(r + "," + c, n); }
    }
  }

  // Build the ordered clue list: each placed word -> its cells + number.
  const clues = placed.map(p => {
    const dr = p.dir === "D" ? 1 : 0, dc = p.dir === "A" ? 1 : 0;
    const cellsOf = [];
    for (let i = 0; i < p.key.length; i++) cellsOf.push([p.row + dr * i, p.col + dc * i]);
    return {
      key: p.key, answer: p.answer, clue: p.clue,
      dir: p.dir, row: p.row, col: p.col,
      number: numAt.get(p.row + "," + p.col) || 0,
      cells: cellsOf
    };
  });
  // Sort clues for navigation: by number, Across before Down.
  clues.sort((a, b) => a.number - b.number || (a.dir === b.dir ? 0 : a.dir === "A" ? -1 : 1));

  return { grid, clues, rows, cols, skipped };
}

const crosswordTemplate = {
  type: "crossword",
  scorable: true,
  name: "Crossword",
  edit: openCrosswordEditor,
  hideLettersOption: true,     // a crossword has no lettered answer boxes
  hasKeyboardToggle: true,     // engine gives us a slot next to Menu for the keyboard show/hide button

  sounds: {
    play: crosswordSound.play,
    restart: crosswordSound.restart,
    timeWarning: crosswordSound.timeWarning,
    complete: crosswordSound.complete
  },

  // Print worksheet: one row per word -> clue + answer (core/print.js).
  toPrintItems(activity) {
    return (activity.content?.words || [])
      .filter(w => w && gridKey(w.answer).length >= 2)
      .map(w => ({ clue: w.clue || "", answer: w.answer || "" }));
  },

  // "Show answer when wrong" — this template's one extra option.
  buildExtraOptions({ panel, draft, el, mkCheck }) {
    const g = el("div", "aw-opt-group");
    g.append(el("div", "aw-opt-label", "Crossword"));
    const row = el("div", "aw-opt-row");
    row.append(mkCheck(draft.showAnswerWhenWrong !== false, "Show answer when wrong",
      v => draft.showAnswerWhenWrong = v));
    g.append(row);
    panel.append(g);
  },

  mount(root, activity, ui) {
    const opt = activity.options || {};
    const words = [...(activity.content?.words || [])];

    const built = buildCrossword(words);
    const total = built.clues.length;

    if (total === 0) {
      root.innerHTML = "";
      root.append(el("div", "aw-cw-empty", "This crossword has no words yet."));
      return () => {};
    }

    const { grid, clues, rows, cols } = built;
    // user letters keyed "r,c"; a solved/revealed word locks its cells.
    const userGrid = new Map();
    const cellStatus = new Map();   // "r,c" -> "solved" | "revealed" (locked cells)
    // per-word state
    const wordState = clues.map(() => ({ done: false, correct: false, revealed: false }));

    let curWord = 0;                // index into clues
    let curCell = 0;                // index into clues[curWord].cells
    let finished = false;
    // Keyboard OFF by default — like Wordwall, the full grid is shown and a real
    // keyboard is used; the toggle (next to Menu) brings up an on-screen keyboard
    // for touch panels (the grid then shares the height with it).
    let keyboardVisible = false;
    let clueFitter = null;
    let autoTimer = null;
    let ro = null;                  // ResizeObserver for cell sizing
    let andrewUsed = false;         // "Andrew help" — ONE use for the WHOLE game
    let andrewGlowing = false;      // from the press until this word is graded / left

    // ----- keyboard show/hide button next to Menu (engine's opt-in slot) -----
    let kbdBtn = null;
    if (ui.kbdSlot) {
      ui.kbdSlot.innerHTML = "";
      kbdBtn = el("button", "aw-iconbtn", icons.keyboard);
      kbdBtn.type = "button";
      updateKbdBtn();
      kbdBtn.onclick = () => {
        keyboardVisible = !keyboardVisible;
        kbd.setHidden(!keyboardVisible);
        updateKbdBtn();
        resizeGrid();
      };
      ui.kbdSlot.append(kbdBtn);
    }
    function updateKbdBtn() {
      if (!kbdBtn) return;
      kbdBtn.title = keyboardVisible ? "Hide keyboard" : "Show keyboard";
      kbdBtn.setAttribute("aria-label", kbdBtn.title);
      kbdBtn.classList.toggle("is-off", !keyboardVisible);
    }

    ui.onSubmit(finish, () => wordState.filter(s => s.done).length);   // block "Submit answers" at 0 answered
    window.addEventListener("keydown", onKey);

    // ----- build the static shell once (grid + clue bar + keyboard) -----
    root.innerHTML = "";
    const wrap = el("div", "aw-cw-wrap");

    const clueBar = el("div", "aw-cw-cluebar");
    const clueNum = el("span", "aw-cw-clue-num", "");
    const clueText = el("span", "aw-cw-clue-text", "");
    // gold answer shown at the end of the clue bar while "Andrew help" glows
    const clueAns = el("span", "aw-cw-clue-answer", "");
    clueBar.append(clueNum, clueText, clueAns);
    wrap.append(clueBar);

    const gridWrap = el("div", "aw-cw-gridwrap");
    const gridEl = el("div", "aw-cw-grid");
    gridEl.style.setProperty("--cols", cols);
    gridEl.style.setProperty("--rows", rows);
    const cellEls = new Map();      // "r,c" -> element
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const g = grid[r][c];
        const cell = el("div", "aw-cw-cell" + (g ? "" : " is-blank"));
        if (g) {
          if (g.num) cell.append(el("span", "aw-cw-cellnum", String(g.num)));
          cell.append(el("span", "aw-cw-letter", ""));
          cell.dataset.rc = r + "," + c;
          cell.onclick = () => onCellClick(r, c);
          cellEls.set(r + "," + c, cell);
        }
        gridEl.append(cell);
      }
    }
    gridWrap.append(gridEl);
    wrap.append(gridWrap);

    // The STANDARD on-screen keyboard (core/keyboard.js) — the FULL standard
    // set, identical to Type the answer (teacher's call, 1/8/2026): letters,
    // caps, numbers, backspace, Space, the blue Submit key AND the "Andrew
    // help" key. A crossword cell only ever wants a single A-Z letter, so
    // onChar silently drops anything else (Space/numbers/punctuation) — those
    // keys stay on screen for a CONSISTENT keyboard across the app, they just
    // do nothing here (same as the physical handler, which only takes [a-zA-Z]).
    const kbd = createKeyboard({
      sound: ui.sound,
      onChar: ch => { if (/^[a-zA-Z]$/.test(ch)) typeLetter(ch.toUpperCase()); },
      onBackspace: () => { backspace(); kbd.refresh(); },
      submit: {
        onClick: submitCurrentWord,
        isDisabled: () => finished || wordState[curWord].done || !wordFilled(clues[curWord])
      },
      extraKey: {
        label: "Andrew",
        className: "aw-cw-key-andrew",
        getState: () => !andrewUsed ? "ready" : (andrewGlowing ? "glowing" : "used"),
        isDisabled: () => andrewUsed || finished || wordState[curWord].done,
        onClick: useAndrew
      }
    });
    if (!keyboardVisible) kbd.setHidden(true);
    wrap.append(kbd.el);

    root.append(wrap);

    // keep the grid sized to whatever space is left between clue bar & keyboard.
    // Observe the gridWrap itself (its box is flex-driven and stable no matter
    // how big the grid inside it gets — overflow is hidden — so there is no
    // resize loop), and settle the first measurement across two frames so the
    // flex column has finished distributing height before we read it.
    resizeGrid();
    requestAnimationFrame(() => requestAnimationFrame(resizeGrid));
    // a couple of settle passes: the 16:9 stage + flex column can finish
    // distributing height a frame or two after mount, and the first read can
    // otherwise catch a too-tall gridWrap (grid then overflows by a row).
    const settleTimers = [setTimeout(resizeGrid, 60), setTimeout(resizeGrid, 200)];
    if (window.ResizeObserver) { ro = new ResizeObserver(resizeGrid); ro.observe(gridWrap); }
    window.addEventListener("resize", resizeGrid);

    selectWord(0, true);
    ui.setScore(0);

    // -------------------------------------------------------------------
    // sizing: cell = min(space by width, space by height), computed in px so it
    // fits BOTH the available width and height (fullscreen fires resize -> refit).
    // -------------------------------------------------------------------
    function resizeGrid() {
      const box = gridWrap.getBoundingClientRect();
      if (!box.width || !box.height) return;
      const pad = 8;
      const cell = Math.max(11, Math.floor(Math.min(
        (box.width - pad) / cols,
        (box.height - pad) / rows
      )));
      gridEl.style.setProperty("--cell", cell + "px");
    }

    // -------------------------------------------------------------------
    // selection + rendering of highlights
    // -------------------------------------------------------------------
    function selectWord(i, resetCell) {
      const target = ((i % total) + total) % total;
      if (target !== curWord) consumeAndrewGlow();   // leaving the word spends the hint
      curWord = target;
      if (resetCell) {
        // land on the first still-empty cell of the word (or the first cell)
        const w = clues[curWord];
        let idx = w.cells.findIndex(([r, c]) => !userGrid.get(r + "," + c) && !cellStatus.get(r + "," + c));
        curCell = idx === -1 ? 0 : idx;
      }
      paint();
      updateClueBar();
      updateNav();
      kbd.refresh();   // Submit/Andrew follow the newly selected word
    }

    function onCellClick(r, c) {
      // which placed words pass through this cell?
      const through = clues.filter(w => w.cells.some(([cr, cc]) => cr === r && cc === c));
      if (!through.length) return;
      const curIsHere = through.some(w => clues[curWord] && w === clues[curWord]);
      let target;
      if (curIsHere && through.length > 1) {
        // toggle to the OTHER direction through this cell
        target = through.find(w => w !== clues[curWord]) || through[0];
      } else {
        target = through[0];
      }
      const ti = clues.indexOf(target);
      if (ti !== curWord) consumeAndrewGlow();   // leaving the word spends the hint
      curWord = ti;
      curCell = target.cells.findIndex(([cr, cc]) => cr === r && cc === c);
      if (curCell < 0) curCell = 0;
      paint();
      updateClueBar();
      updateNav();
      kbd.refresh();   // Submit/Andrew follow the newly selected word
    }

    function paint() {
      const w = clues[curWord];
      const inWord = new Set(w.cells.map(([r, c]) => r + "," + c));
      const [cr, cc] = w.cells[curCell] || w.cells[0];
      cellEls.forEach((cell, rc) => {
        cell.classList.toggle("is-inword", inWord.has(rc));
        cell.classList.toggle("is-cursor", rc === (cr + "," + cc));
      });
    }

    function setLetter(rc, ch) {
      const cell = cellEls.get(rc);
      if (!cell) return;
      const span = cell.querySelector(".aw-cw-letter");
      if (span) span.textContent = ch || "";
    }

    function refreshWordCells(w, statusClass) {
      w.cells.forEach(([r, c]) => {
        const rc = r + "," + c;
        const cell = cellEls.get(rc);
        if (!cell) return;
        cell.classList.remove("is-solved", "is-revealed", "is-flash-wrong");
        const st = statusClass || cellStatus.get(rc);
        if (st === "solved") cell.classList.add("is-solved");
        else if (st === "revealed") cell.classList.add("is-revealed");
      });
    }

    function updateClueBar() {
      const w = clues[curWord];
      clueNum.textContent = `${w.number} ${w.dir === "A" ? "Across" : "Down"}`;
      clueText.textContent = w.clue || "(no clue)";
      if (clueFitter) { clueFitter.destroy(); clueFitter = null; }
      clueFitter = autoFit(clueBar, clueText, s => clueText.style.setProperty("--fit", s),
        { slack: clueBar.clientWidth * 0.04, measure: () => clueText.scrollHeight });
    }

    function updateNav() {
      ui.setNav({
        index: curWord + 1,
        total,
        onPrev: () => selectWord(curWord - 1, true),
        onNext: () => selectWord(curWord + 1, true)
      });
    }

    // -------------------------------------------------------------------
    // typing
    // -------------------------------------------------------------------
    function typeLetter(ch) {
      if (finished) return;
      const w = clues[curWord];
      if (wordState[curWord].done) return;    // locked word
      const [r, c] = w.cells[curCell] || w.cells[0];
      const rc = r + "," + c;
      if (cellStatus.get(rc) === "solved" || cellStatus.get(rc) === "revealed") {
        // this shared cell is already locked by a crossing word — skip over it
        advanceCursor();
        return;
      }
      userGrid.set(rc, ch);
      setLetter(rc, ch);
      advanceCursor();
      // NO auto-grade on the last letter (teacher's call, 1/8/2026): the student
      // confirms with the Submit key / Enter. Just light Submit up when full.
      kbd.refresh();
    }

    // Submit is only possible when the current word is completely filled in.
    function wordFilled(w) {
      return w.cells.every(([r, c]) => userGrid.get(r + "," + c));
    }
    // The keyboard's Submit key (or Enter on a physical keyboard) — the
    // student's explicit "lock my answer in" for the current word.
    function submitCurrentWord() {
      if (finished || wordState[curWord].done) return;
      if (!wordFilled(clues[curWord])) return;
      gradeWord();
    }

    // "Andrew help" — show the current word's answer in gold on the clue bar so
    // the student can copy it in (typing it correctly still scores, exactly like
    // Type the answer). Consumes the one game-wide use immediately; the glow
    // ends when this word is graded or the student moves to another word.
    function useAndrew() {
      if (andrewUsed || finished || wordState[curWord].done) return;
      andrewUsed = true;
      andrewGlowing = true;
      const w = clues[curWord];
      clueAns.textContent = w.answer || w.key;
      clueAns.classList.add("is-on");
      kbd.refresh();   // Andrew key -> "glowing"
    }
    function consumeAndrewGlow() {
      if (!andrewGlowing) return;
      andrewGlowing = false;
      clueAns.classList.remove("is-on");
      clueAns.textContent = "";
      kbd.refresh();   // Andrew key -> "used" (dark, locked for the game)
    }

    function advanceCursor() {
      const w = clues[curWord];
      // move to the next cell of the word that isn't locked, if any
      for (let k = curCell + 1; k < w.cells.length; k++) {
        curCell = k;
        paint();
        return;
      }
      curCell = Math.min(curCell, w.cells.length - 1);
      paint();
    }

    function backspace() {
      if (finished) return;
      const w = clues[curWord];
      if (wordState[curWord].done) return;
      let [r, c] = w.cells[curCell] || w.cells[0];
      let rc = r + "," + c;
      if (userGrid.get(rc) && cellStatus.get(rc) == null) {
        userGrid.delete(rc); setLetter(rc, "");
        return;
      }
      // else step back to the previous editable cell and clear it
      for (let k = curCell - 1; k >= 0; k--) {
        [r, c] = w.cells[k]; rc = r + "," + c;
        curCell = k;
        if (cellStatus.get(rc) == null) { userGrid.delete(rc); setLetter(rc, ""); }
        paint();
        return;
      }
      paint();
    }

    function gradeWord() {
      const w = clues[curWord];
      const stt = wordState[curWord];
      if (stt.done) return;
      consumeAndrewGlow();   // grading this word ends the hint glow (key goes dark)
      const typed = w.cells.map(([r, c]) => userGrid.get(r + "," + c) || "").join("");
      const ok = typed === w.key;
      if (ok) {
        stt.done = true; stt.correct = true;
        w.cells.forEach(([r, c]) => cellStatus.set(r + "," + c, "solved"));
        refreshWordCells(w, "solved");
        crosswordSound.correct();
        ui.setScore(scoreNow());
        afterGrade(true);
      } else {
        crosswordSound.wrong();
        if (opt.showAnswerWhenWrong !== false) {
          // reveal correct letters, lock the word (answered, not scored)
          stt.done = true; stt.revealed = true;
          w.cells.forEach(([r, c], i) => {
            const rc = r + "," + c;
            userGrid.set(rc, w.key[i]);
            setLetter(rc, w.key[i]);
            if (cellStatus.get(rc) !== "solved") cellStatus.set(rc, "revealed");
          });
          refreshWordCells(w);
          afterGrade(false);
        } else {
          // flash red, then clear this word's own (non-locked) letters to retry
          flashWrong(w);
          w.cells.forEach(([r, c]) => {
            const rc = r + "," + c;
            if (cellStatus.get(rc) == null) { userGrid.delete(rc); setLetter(rc, ""); }
          });
          // move cursor back to the first editable cell
          const idx = w.cells.findIndex(([r, c]) => cellStatus.get(r + "," + c) == null);
          curCell = idx === -1 ? 0 : idx;
          paint();
        }
      }
      kbd.refresh();   // Submit re-disables (word done, or cleared for retry)
    }

    function afterGrade(wasCorrect) {
      // jump to the next unsolved word, if any; otherwise finish shortly.
      if (wordState.every(s => s.done)) {
        autoTimer = setTimeout(finish, wasCorrect ? 900 : 1200);
        return;
      }
      let next = -1;
      for (let k = 1; k <= total; k++) {
        const j = (curWord + k) % total;
        if (!wordState[j].done) { next = j; break; }
      }
      if (next !== -1) setTimeout(() => selectWord(next, true), wasCorrect ? 350 : 500);
    }

    function flashWrong(w) {
      w.cells.forEach(([r, c]) => {
        const cell = cellEls.get(r + "," + c);
        if (!cell) return;
        cell.classList.add("is-flash-wrong");
        setTimeout(() => cell.classList.remove("is-flash-wrong"), 600);
      });
    }

    function scoreNow() { return wordState.filter(s => s.correct).length; }

    // -------------------------------------------------------------------
    // physical keyboard
    // -------------------------------------------------------------------
    function onKey(e) {
      if (finished) return;
      const k = e.key;
      if (k === "ArrowLeft") { e.preventDefault(); return moveCursor(0, -1); }
      if (k === "ArrowRight") { e.preventDefault(); return moveCursor(0, 1); }
      if (k === "ArrowUp") { e.preventDefault(); return moveCursor(-1, 0); }
      if (k === "ArrowDown") { e.preventDefault(); return moveCursor(1, 0); }
      if (k === "Backspace") { e.preventDefault(); backspace(); kbd.refresh(); return; }
      if (k === "Tab") { e.preventDefault(); return selectWord(curWord + (e.shiftKey ? -1 : 1), true); }
      if (k === "Enter") { e.preventDefault(); return submitCurrentWord(); }   // = the Submit key
      if (/^[a-zA-Z]$/.test(k)) { e.preventDefault(); typeLetter(k.toUpperCase()); }
    }

    // Arrow keys: within the current word step the cursor; perpendicular arrows
    // hop to a crossing word if one exists at the current cell.
    function moveCursor(dr, dc) {
      const w = clues[curWord];
      const [r, c] = w.cells[curCell] || w.cells[0];
      const wantAcross = dc !== 0;
      const wordIsAcross = w.dir === "A";
      if (wantAcross === wordIsAcross) {
        // moving along the current word
        const nc = curCell + (dc || dr > 0 ? 1 : -1) * ((wantAcross ? dc : dr) > 0 ? 1 : -1);
        if (nc >= 0 && nc < w.cells.length) { curCell = nc; paint(); }
        return;
      }
      // perpendicular: is there a crossing word through this cell?
      const cross = clues.find(x => x !== w && x.cells.some(([cr, cc]) => cr === r && cc === c));
      if (cross) {
        consumeAndrewGlow();   // leaving the word spends the hint
        curWord = clues.indexOf(cross);
        curCell = cross.cells.findIndex(([cr, cc]) => cr === r && cc === c);
        paint(); updateClueBar(); updateNav();
        kbd.refresh();   // Submit/Andrew follow the newly selected word
      }
    }

    // -------------------------------------------------------------------
    function finish() {
      if (finished) return;
      finished = true;
      consumeAndrewGlow();
      kbd.refresh();   // lock Submit/Andrew behind the results overlay
      const review = clues.map((w, i) => {
        const s = wordState[i];
        const typed = w.cells.map(([r, c]) => userGrid.get(r + "," + c) || "·").join("");
        return {
          question: `${w.number} ${w.dir === "A" ? "Across" : "Down"} — ${w.clue}`,
          answered: s.done,
          yourText: s.done ? typed : null,
          yourCorrect: s.correct === true,
          correctText: w.answer || w.key
        };
      });
      const correct = wordState.filter(s => s.correct).length;
      const answered = wordState.filter(s => s.done).length;
      const perQuestion = wordState.map((s, i) => ({ q: i, correct: s.correct === true }));
      ui.finish({ correct, incorrect: total - correct, total, perQuestion, review, answered });
    }

    return function cleanup() {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", resizeGrid);
      if (ro) ro.disconnect();
      if (clueFitter) clueFitter.destroy();
      if (autoTimer) clearTimeout(autoTimer);
      settleTimers.forEach(clearTimeout);
    };
  }
};

registerTemplate(crosswordTemplate);
export default crosswordTemplate;
