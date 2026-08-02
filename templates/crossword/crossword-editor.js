// =============================================================
// CROSSWORD EDITOR — the form a teacher uses to create or edit a Crossword.
//
//   openCrosswordEditor(container, activity, { onSave, onCancel, header, footer })
//     • same contract as the other editors (quiz/anagram/type-the-answer).
//     • onSave(updatedActivity) — teacher pressed Save (already validated);
//       may return a Promise. onCancel() — teacher pressed Cancel.
//   Edits a DEEP CLONE, so Cancel leaves the original untouched.
//
// SCOPE (matches Wordwall's Crossword editor): two columns — ANSWER (the word
// that goes in the grid) and CLUE (the definition shown when the word is
// picked). The interlocking grid is generated automatically at play time from
// the answers, so the teacher never lays out a grid by hand. Theme is always
// Classic; default options live in Settings; per-act options come from the
// in-game Options panel. Reuses the shared .aw-ed-* editor classes; the
// 2-column rows are a few .aw-cw-ed-* rules in crossword.css (core/ untouched).
// =============================================================

import { el } from "../../core/utils.js";
import { icons } from "../../core/icons.js";

const MAX_WORDS = 100;   // generous cap; Wordwall's crossword takes many words

// Grow a <textarea> to fit its content (so a clue shows in full from the start).
function autoGrow(ta) { ta.style.height = "auto"; ta.style.height = (ta.scrollHeight + 2) + "px"; }

export function openCrosswordEditor(container, activity, { onSave, onCancel, header, footer } = {}) {
  const isNew = !(activity && activity.id);
  const data = normalize(activity);

  container.innerHTML = "";
  const page = el("div", "aw-ed");
  if (header) page.append(header);

  // ---- Sticky action bar ----
  const head = el("div", "aw-ed-head");
  const headL = el("div", "aw-ed-headleft");
  headL.append(el("span", "aw-ed-typebadge", "CROSSWORD"));
  headL.append(el("div", "aw-ed-heading", isNew ? "New activity" : "Edit content"));
  head.append(headL);
  const actions = el("div", "aw-ed-headactions");
  const cancelBtn = el("button", "aw-btn", "Cancel");
  const saveBtn = el("button", "aw-btn aw-btn-primary", "Save");
  cancelBtn.type = "button"; saveBtn.type = "button";
  actions.append(cancelBtn, saveBtn);
  head.append(actions);
  page.append(head);

  const errBar = el("div", "aw-ed-error");
  errBar.style.display = "none";
  page.append(errBar);

  const body = el("div", "aw-ed-body");
  page.append(body);

  // ===== META: title only =====
  const meta = el("div", "aw-ed-meta");
  const titleInput = el("input", "aw-ed-input");
  titleInput.value = data.title;
  titleInput.placeholder = "e.g. Unit 3 — Vocabulary";
  titleInput.oninput = () => { data.title = titleInput.value; clearError(); };
  meta.append(field("Activity Title", titleInput));
  body.append(meta);

  // ===== WORDS =====
  body.append(el("div", "aw-ed-sectionhead", "Words"));
  body.append(buildBulkBar());
  body.append(el("div", "aw-ed-tip",
    "Each row is one word in the puzzle: the ANSWER (letters only — spaces and " +
    "punctuation are ignored in the grid) and its CLUE. The grid is built " +
    "automatically so the words cross each other. Tip: in Excel, copy two " +
    "columns (answer | clue), click a box and paste (Ctrl+V) to fill the list."));
  const wWrap = el("div", "aw-ed-questions");
  body.append(wWrap);
  renderWords();

  if (footer) page.append(footer);
  container.append(page);
  titleInput.focus();

  // ---------- rendering ----------
  function renderWords() {
    wWrap.innerHTML = "";
    // column header row
    const hdr = el("div", "aw-cw-ed-hdr");
    hdr.append(el("span", "aw-cw-ed-hnum", "#"),
               el("span", "aw-cw-ed-hans", "Answer"),
               el("span", "aw-cw-ed-hclue", "Clue"),
               el("span", "aw-cw-ed-hact", ""));
    wWrap.append(hdr);

    data.content.words.forEach((w, i) => wWrap.append(wordRow(w, i)));

    const addW = el("button", "aw-ed-addq", "+ Add word");
    addW.type = "button";
    addW.disabled = data.content.words.length >= MAX_WORDS;
    addW.onclick = () => {
      if (data.content.words.length < MAX_WORDS) { data.content.words.push(blankWord()); renderWords(); }
    };
    wWrap.append(addW);
    wWrap.append(el("div", "aw-ed-qcount", `${data.content.words.length} / ${MAX_WORDS} words`));
  }

  function wordRow(w, i) {
    const row = el("div", "aw-cw-ed-row");
    row.append(el("span", "aw-cw-ed-num", String(i + 1)));

    const ans = el("input", "aw-ed-input aw-cw-ed-ans");
    ans.value = w.answer;
    ans.placeholder = "ANSWER";
    ans.oninput = () => { w.answer = ans.value; clearError(); };
    ans.addEventListener("paste", e => onBlockPaste(e, i));
    row.append(ans);

    const clue = el("textarea", "aw-ed-input aw-cw-ed-clue");
    clue.rows = 1;
    clue.value = w.clue;
    clue.placeholder = "Clue for this word…";
    clue.oninput = () => { w.clue = clue.value; autoGrow(clue); clearError(); };
    clue.addEventListener("paste", e => onBlockPaste(e, i));
    row.append(clue);
    // size it to its content now (deferred so it measures after layout)
    requestAnimationFrame(() => autoGrow(clue));

    const act = el("div", "aw-cw-ed-act");
    const dup = el("button", "aw-cw-ed-iconbtn", icons.duplicate);
    dup.type = "button";
    dup.title = "Duplicate"; dup.setAttribute("aria-label", "Duplicate");
    dup.disabled = data.content.words.length >= MAX_WORDS;
    dup.onclick = () => {
      if (data.content.words.length >= MAX_WORDS) return;
      data.content.words.splice(i + 1, 0, JSON.parse(JSON.stringify(w)));
      renderWords();
    };
    const del = el("button", "aw-cw-ed-iconbtn aw-cw-ed-iconbtn-danger", icons.trash);
    del.type = "button";
    del.title = "Remove"; del.setAttribute("aria-label", "Remove");
    del.disabled = data.content.words.length <= 1;
    del.onclick = () => { data.content.words.splice(i, 1); renderWords(); };
    act.append(dup, del);
    row.append(act);
    return row;
  }

  // Paste a 2-column Excel block: answer | clue, filling from THIS row down.
  function parseExcelBlock(text) {
    const rows = text.replace(/\r/g, "").split("\n");
    while (rows.length && rows[rows.length - 1].trim() === "") rows.pop();
    return rows.map(line => {
      const cells = line.split("\t");
      return { answer: (cells[0] || "").trim(), clue: (cells[1] || "").trim() };
    }).filter(w => w.answer !== "" || w.clue !== "");
  }
  function onBlockPaste(e, i) {
    const text = (e.clipboardData || window.clipboardData)?.getData("text/plain") || "";
    if (!/[\t\n]/.test(text)) return;   // single cell -> normal paste
    e.preventDefault();
    const parsed = parseExcelBlock(text);
    if (!parsed.length) return;
    let next = data.content.words.slice(0, i).concat(parsed);
    let dropped = 0;
    if (next.length > MAX_WORDS) { dropped = next.length - MAX_WORDS; next = next.slice(0, MAX_WORDS); }
    data.content.words = next;
    renderWords();
    showInfo(`Pasted ${parsed.length - dropped} word(s) from Excel${dropped ? ` (${dropped} skipped — ${MAX_WORDS} max)` : ""}.`);
  }

  // ---------- save / cancel ----------
  cancelBtn.onclick = () => onCancel?.();
  saveBtn.onclick = async () => {
    const clean = JSON.parse(JSON.stringify(data));
    clean.title = clean.title.trim();
    clean.instruction = (clean.instruction || "").trim();
    clean.theme = "classic";
    clean.content.words = clean.content.words
      .map(w => ({ answer: (w.answer || "").trim(), clue: (w.clue || "").trim() }))
      .filter(w => w.answer !== "" || w.clue !== "");

    const err = validate(clean);
    if (err) { showError(err); return; }

    saveBtn.disabled = true;
    const label = saveBtn.textContent;
    saveBtn.textContent = "Saving…";
    try {
      await onSave?.(clean);
    } catch (e) {
      saveBtn.disabled = false;
      saveBtn.textContent = label;
      showError("Could not save — please try again.");
    }
  };

  function buildBulkBar() {
    const bar = el("div", "aw-ed-bulk");
    const clearBtn = el("button", "aw-btn aw-ed-bulkdanger", "Delete all words");
    clearBtn.type = "button";
    clearBtn.onclick = () => {
      if (!confirm("Delete ALL words?")) return;
      data.content.words = [blankWord()];
      renderWords();
      showInfo("All words deleted.");
    };
    bar.append(clearBtn);
    return bar;
  }

  function showError(msg) { errBar.classList.remove("is-info"); errBar.textContent = msg; errBar.style.display = "block"; body.scrollTop = 0; }
  function showInfo(msg) { errBar.classList.add("is-info"); errBar.textContent = msg; errBar.style.display = "block"; body.scrollTop = 0; }
  function clearError() { if (errBar.style.display !== "none") errBar.style.display = "none"; }
  function field(labelText, control) { const f = el("div", "aw-ed-field"); f.append(el("label", "aw-ed-label", labelText), control); return f; }
}

// ===== data helpers =====
function normalize(activity) {
  const a = activity ? JSON.parse(JSON.stringify(activity)) : {};
  a.type = "crossword";
  a.schemaVersion = a.schemaVersion || 1;
  a.title = a.title || "";
  a.instruction = a.instruction || "";
  a.theme = "classic";
  a.options = a.options || {};
  a.content = a.content || {};
  let words = Array.isArray(a.content.words) ? a.content.words : [];
  if (words.length === 0) words = [blankWord()];
  a.content.words = words.map(w => ({ answer: w.answer || "", clue: w.clue || "" }));
  return a;
}
function blankWord() { return { answer: "", clue: "" }; }

function validate(d) {
  if (!d.title) return "Please enter an activity title.";
  const words = d.content.words;
  if (!words.length) return "Add at least one word.";
  let usable = 0;
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (!w.answer) return `Word ${i + 1} has no answer.`;
    const letters = w.answer.toUpperCase().replace(/[^A-Z]/g, "");
    if (letters.length < 2) return `Word ${i + 1} needs at least 2 letters.`;
    if (!w.clue) return `Word ${i + 1} has no clue.`;
    usable++;
  }
  if (usable < 2) return "A crossword needs at least 2 words so they can cross.";
  return null;
}
