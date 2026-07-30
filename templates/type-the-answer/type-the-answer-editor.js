// =============================================================
// TYPE THE ANSWER EDITOR — the form a teacher uses to create or edit a
// Type the answer activity.
//
//   openTypeTheAnswerEditor(container, activity, { onSave, onCancel, header, footer })
//     • same contract as templates/quiz/quiz-editor.js / templates/anagram/anagram-editor.js
//     • onSave(updatedActivity) -> called when the teacher presses Save
//       (already validated); may return a Promise.
//     • onCancel() -> called when the teacher presses Cancel.
//
// It edits a DEEP CLONE of `activity`, so Cancel leaves the original untouched.
//
// SCOPE (matches the other 2 editors): this page edits ONLY the title + the
// questions (prompt + accepted answers). Theme is always Classic; default
// options live in Settings; per-act options are tweaked from the in-game
// Options panel. Mode is fixed to "qa" (Spelling test is a separate, bigger
// feature — not built yet, see GHI CHU TYPE-THE-ANSWER.md).
//
// LAYOUT (30/7/2026, per Teacher Andrew's screenshot): each question is a row
// with the QUESTION box on the LEFT and its ANSWERS stacked on the RIGHT (one
// question -> many accepted answers). "+ Add alternative answer" sits right
// under the last answer box of that same question. Reuses the shared
// `.aw-ed-*` editor classes from core/app.css (same ones Quiz/Anagram use);
// the 2-column layout itself is a few new rules in this template's own
// `type-the-answer.css`, under `.aw-tta-ed-*` — core/ untouched.
// =============================================================

import { el } from "../../core/utils.js";

const MAX_ITEMS = 50;          // Wordwall's real cap for this template (per Teacher Andrew, 30/7)
const MAX_ALTERNATES = 5;      // alternate accepted answers per question, on top of the main one

export function openTypeTheAnswerEditor(container, activity, { onSave, onCancel, header, footer } = {}) {
  const isNew = !(activity && activity.id);
  const data = normalize(activity);

  container.innerHTML = "";
  const page = el("div", "aw-ed");
  if (header) page.append(header);

  // ---- Sticky action bar: act-type badge + heading | Cancel / Save ----
  const head = el("div", "aw-ed-head");
  const headL = el("div", "aw-ed-headleft");
  headL.append(el("span", "aw-ed-typebadge", "TYPE THE ANSWER"));
  headL.append(el("div", "aw-ed-heading", isNew ? "New activity" : "Edit content"));
  head.append(headL);
  const actions = el("div", "aw-ed-headactions");
  const cancelBtn = el("button", "aw-btn", "Cancel");
  const saveBtn = el("button", "aw-btn aw-btn-primary", "Save");
  cancelBtn.type = "button"; saveBtn.type = "button";
  actions.append(cancelBtn, saveBtn);
  head.append(actions);
  page.append(head);

  // ---- Error / info banner ----
  const errBar = el("div", "aw-ed-error");
  errBar.style.display = "none";
  page.append(errBar);

  // ---- Scrolling body ----
  const body = el("div", "aw-ed-body");
  page.append(body);

  // ===== META: activity title only =====
  const meta = el("div", "aw-ed-meta");
  const titleInput = el("input", "aw-ed-input");
  titleInput.value = data.title;
  titleInput.placeholder = "e.g. Unit 3 — Vocabulary";
  titleInput.oninput = () => { data.title = titleInput.value; clearError(); };
  meta.append(field("Activity Title", titleInput));
  body.append(meta);

  // ===== QUESTIONS =====
  body.append(el("div", "aw-ed-sectionhead", "Questions"));
  body.append(buildBulkBar());
  body.append(el("div", "aw-ed-tip",
    "Tip: in Excel, copy a block of cells — question in the left column, one accepted answer per row " +
    "in the right column (leave the left cell blank on extra-answer rows), then click a question or " +
    "answer box and paste (Ctrl+V) to fill the whole list at once."));
  const qWrap = el("div", "aw-ed-questions");
  body.append(qWrap);
  renderQuestions();

  if (footer) page.append(footer);

  container.append(page);
  titleInput.focus();

  // ---------- questions rendering ----------
  function renderQuestions() {
    qWrap.innerHTML = "";
    data.content.items.forEach((it, qi) => qWrap.append(questionCard(it, qi)));
    const addQ = el("button", "aw-ed-addq", "+ Add question");
    addQ.type = "button";
    addQ.disabled = data.content.items.length >= MAX_ITEMS;
    addQ.onclick = () => {
      if (data.content.items.length < MAX_ITEMS) { data.content.items.push(blankItem()); renderQuestions(); }
    };
    qWrap.append(addQ);
    const count = el("div", "aw-ed-qcount", `${data.content.items.length} / ${MAX_ITEMS} questions`);
    qWrap.append(count);
  }

  // Parse a pasted Excel block: LEFT column = question, RIGHT column = one
  // accepted answer per row. A row whose left cell is blank continues the
  // answer list of the question above it (matches the teacher's screenshot:
  // "Spring/Winter/Autumn/Fall/Summer" all under "What is one of the seasons?").
  function parseExcelBlock(text) {
    const rows = text.replace(/\r/g, "").split("\n");
    while (rows.length && rows[rows.length - 1].trim() === "") rows.pop();

    const items = [];
    let current = null;
    rows.forEach(line => {
      const cells = line.split("\t").map(c => c.trim());
      const q = cells[0] || "";
      const answersInRow = cells.slice(1).filter(c => c !== "");
      if (q === "" && answersInRow.length === 0) return;   // fully blank row
      if (q !== "") {
        current = { prompt: q, acceptedAnswers: answersInRow.length ? [...answersInRow] : [""] };
        items.push(current);
      } else {
        // blank question cell -> extra answer(s) for the question right above
        if (!current) { current = { prompt: "", acceptedAnswers: [] }; items.push(current); }
        current.acceptedAnswers.push(...answersInRow);
      }
    });
    items.forEach(it => {
      if (!it.acceptedAnswers.length) it.acceptedAnswers = [""];
      it.acceptedAnswers = it.acceptedAnswers.slice(0, 1 + MAX_ALTERNATES);
    });
    return items;
  }

  // Works whether the teacher clicks the question box or an answer box first
  // — fills from THIS question downward, same convention as Quiz/Anagram.
  function onBlockPaste(e, qi) {
    const text = (e.clipboardData || window.clipboardData)?.getData("text/plain") || "";
    if (!/[\t\n]/.test(text)) return;    // a single cell -> let the normal paste happen
    e.preventDefault();

    const parsed = parseExcelBlock(text);
    if (!parsed.length) return;

    let next = data.content.items.slice(0, qi).concat(parsed);
    let dropped = 0;
    if (next.length > MAX_ITEMS) { dropped = next.length - MAX_ITEMS; next = next.slice(0, MAX_ITEMS); }
    data.content.items = next;
    renderQuestions();
    const filled = parsed.length - dropped;
    showInfo(`Pasted ${filled} question(s) from Excel${dropped ? ` (${dropped} skipped — ${MAX_ITEMS} max)` : ""}.`);
  }

  function questionCard(it, qi) {
    const card = el("div", "aw-ed-qcard");

    const top = el("div", "aw-ed-qtop");
    top.append(el("span", "aw-ed-qnum", `Question ${qi + 1}`));
    const topActions = el("div", "aw-ed-qactions");
    const dupQ = el("button", "aw-ed-del aw-ed-dup", "Duplicate");
    dupQ.type = "button";
    dupQ.disabled = data.content.items.length >= MAX_ITEMS;
    dupQ.onclick = () => {
      if (data.content.items.length >= MAX_ITEMS) return;
      const copy = JSON.parse(JSON.stringify(it));
      data.content.items.splice(qi + 1, 0, copy);
      renderQuestions();
    };
    const delQ = el("button", "aw-ed-del", "Remove");
    delQ.type = "button";
    delQ.disabled = data.content.items.length <= 1;
    delQ.onclick = () => { data.content.items.splice(qi, 1); renderQuestions(); };
    topActions.append(dupQ, delQ);
    top.append(topActions);
    card.append(top);

    // ---- LEFT = question, RIGHT = stacked answers (per teacher's layout) ----
    const blockEl = el("div", "aw-tta-ed-block");

    const qInput = el("textarea", "aw-ed-input aw-tta-ed-qtext");
    qInput.rows = 1;
    qInput.value = it.prompt;
    qInput.placeholder = "Type the question…";
    qInput.oninput = () => { it.prompt = qInput.value; clearError(); };
    qInput.addEventListener("paste", e => onBlockPaste(e, qi));
    blockEl.append(qInput);

    const acol = el("div", "aw-tta-ed-acol");
    it.acceptedAnswers.forEach((ans, ai) => acol.append(answerRow(it, ai, qi)));
    const addA = el("button", "aw-ed-adda", "+ Add alternative answer");
    addA.type = "button";
    addA.disabled = it.acceptedAnswers.length >= 1 + MAX_ALTERNATES;
    addA.onclick = () => {
      if (it.acceptedAnswers.length < 1 + MAX_ALTERNATES) { it.acceptedAnswers.push(""); renderQuestions(); }
    };
    acol.append(addA);
    blockEl.append(acol);

    card.append(blockEl);
    return card;
  }

  function answerRow(it, ai, qi) {
    const row = el("div", "aw-tta-ed-arow");
    const txt = el("input", "aw-ed-input aw-tta-ed-atext");
    txt.value = it.acceptedAnswers[ai];
    txt.placeholder = ai === 0 ? "Answer" : "Alternative answer";
    txt.oninput = () => { it.acceptedAnswers[ai] = txt.value; clearError(); };
    txt.addEventListener("paste", e => onBlockPaste(e, qi));

    const del = el("button", "aw-ed-del aw-ed-del-a", "×");
    del.type = "button";
    del.title = "Remove this answer";
    del.disabled = it.acceptedAnswers.length <= 1;
    del.onclick = () => { it.acceptedAnswers.splice(ai, 1); renderQuestions(); };

    row.append(txt, del);
    return row;
  }

  // ---------- save / cancel ----------
  cancelBtn.onclick = () => onCancel?.();

  saveBtn.onclick = async () => {
    const clean = JSON.parse(JSON.stringify(data));
    clean.title = clean.title.trim();
    clean.instruction = (clean.instruction || "").trim();
    clean.theme = "classic";
    clean.content.items.forEach(it => {
      it.prompt = it.prompt.trim();
      it.acceptedAnswers = it.acceptedAnswers.map(a => a.trim()).filter(a => a !== "");
    });
    // Drop rows that were added but left completely empty.
    clean.content.items = clean.content.items.filter(it => !(it.prompt === "" && it.acceptedAnswers.length === 0));

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

  function showError(msg) {
    errBar.classList.remove("is-info");
    errBar.textContent = msg;
    errBar.style.display = "block";
    body.scrollTop = 0;
  }
  function showInfo(msg) {
    errBar.classList.add("is-info");
    errBar.textContent = msg;
    errBar.style.display = "block";
    body.scrollTop = 0;
  }
  function clearError() {
    if (errBar.style.display !== "none") errBar.style.display = "none";
  }

  // ---------- bulk actions bar ----------
  function buildBulkBar() {
    const bar = el("div", "aw-ed-bulk");
    const clearBtn = el("button", "aw-btn aw-ed-bulkdanger", "Delete all questions");
    clearBtn.type = "button";
    clearBtn.onclick = () => {
      if (!confirm("Delete ALL questions?")) return;
      data.content.items = [blankItem()];
      renderQuestions();
      showInfo("All questions deleted.");
    };
    bar.append(clearBtn);
    return bar;
  }

  // ---------- small helpers ----------
  function field(labelText, control) {
    const f = el("div", "aw-ed-field");
    f.append(el("label", "aw-ed-label", labelText), control);
    return f;
  }
}

// ===== data helpers =====
function normalize(activity) {
  const a = activity ? JSON.parse(JSON.stringify(activity)) : {};
  a.type = "type_the_answer";
  a.schemaVersion = a.schemaVersion || 1;
  a.title = a.title || "";
  a.instruction = a.instruction || "";
  a.theme = "classic";
  a.options = a.options || {};
  a.content = a.content || {};
  a.content.mode = "qa";     // Spelling test is a separate mode, not built yet
  let items = Array.isArray(a.content.items) ? a.content.items : [];
  if (items.length === 0) items = [blankItem()];
  a.content.items = items.map(it => {
    let acceptedAnswers = Array.isArray(it.acceptedAnswers) && it.acceptedAnswers.length ? it.acceptedAnswers : [""];
    acceptedAnswers = acceptedAnswers.slice(0, 1 + MAX_ALTERNATES).map(x => x || "");
    return { prompt: it.prompt || "", acceptedAnswers };
  });
  return a;
}
function blankItem() { return { prompt: "", acceptedAnswers: [""] }; }

function validate(d) {
  if (!d.title) return "Please enter an activity title.";
  if (!d.content.items.length) return "Add at least one question.";
  for (let i = 0; i < d.content.items.length; i++) {
    const it = d.content.items[i];
    if (!it.prompt) return `Question ${i + 1} has no text.`;
    if (!it.acceptedAnswers.length) return `Question ${i + 1} needs an answer.`;
  }
  return null;
}
