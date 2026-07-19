// =============================================================
// QUIZ EDITOR — the form a teacher uses to create or edit a Quiz.
//
//   openQuizEditor(container, activity, { onSave, onCancel, header })
//     • container = the DOM node to render into (usually #app).
//     • activity  = an existing quiz activity to edit, or a blank one to create.
//     • onSave(updatedActivity)  -> called when the teacher presses Save
//                                   (already validated); may return a Promise.
//     • onCancel()               -> called when the teacher presses Cancel.
//     • header (optional)        -> a DOM node (the shared brand+nav header)
//                                   placed at the very top of the page.
//
// It edits a DEEP CLONE of `activity`, so pressing Cancel leaves the original
// untouched. Text inputs bind to the model on every keystroke; the questions
// list only re-renders when the STRUCTURE changes (add/remove/duplicate/
// mark-correct), so typing never loses focus.
//
// SCOPE (per Teacher Andrew): this page edits ONLY the title + the questions.
// Theme is always Classic; default options live in Settings; per-act options
// are tweaked from the in-game Options panel. Class prefix: .aw-ed-*.
// =============================================================

import { el } from "../../core/utils.js";

const MIN_ANSWERS = 2;
const MAX_ANSWERS = 6;
const MAX_QUESTIONS = 120;

export function openQuizEditor(container, activity, { onSave, onCancel, header, footer } = {}) {
  const isNew = !(activity && activity.id);
  const data = normalize(activity);

  container.innerHTML = "";
  const page = el("div", "aw-ed");
  if (header) page.append(header);

  // ---- Sticky action bar: act-type badge + heading  |  Cancel / Save ----
  const head = el("div", "aw-ed-head");
  const headL = el("div", "aw-ed-headleft");
  headL.append(el("span", "aw-ed-typebadge", "QUIZ"));
  headL.append(el("div", "aw-ed-heading", isNew ? "New activity" : "Edit content"));
  head.append(headL);
  const actions = el("div", "aw-ed-headactions");
  const cancelBtn = el("button", "aw-btn", "Cancel");
  const saveBtn = el("button", "aw-btn aw-btn-primary", "Save");
  cancelBtn.type = "button"; saveBtn.type = "button";
  actions.append(cancelBtn, saveBtn);
  head.append(actions);
  page.append(head);

  // ---- Error / info banner (hidden until needed) ----
  const errBar = el("div", "aw-ed-error");
  errBar.style.display = "none";
  page.append(errBar);

  // ---- Scrolling body ----
  const body = el("div", "aw-ed-body");
  page.append(body);

  // ===== META: activity title only (theme = Classic, options in Settings) =====
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
    "Tip: in Excel, copy a block of cells (the question in the first column, its answers in the next columns), " +
    "then click a question box and paste (Ctrl+V) to fill the whole list at once."));
  const qWrap = el("div", "aw-ed-questions");
  body.append(qWrap);
  renderQuestions();

  if (footer) page.append(footer);

  container.append(page);
  titleInput.focus();

  // ---------- questions rendering ----------
  function renderQuestions() {
    qWrap.innerHTML = "";
    data.content.questions.forEach((q, qi) => qWrap.append(questionCard(q, qi)));
    const addQ = el("button", "aw-ed-addq", "+ Add question");
    addQ.type = "button";
    addQ.disabled = data.content.questions.length >= MAX_QUESTIONS;
    addQ.onclick = () => {
      if (data.content.questions.length < MAX_QUESTIONS) { data.content.questions.push(blankQuestion()); renderQuestions(); }
    };
    qWrap.append(addQ);
    const count = el("div", "aw-ed-qcount", `${data.content.questions.length} / ${MAX_QUESTIONS} questions`);
    qWrap.append(count);
  }

  // Paste a copied Excel RANGE into a question box. The first column of each
  // pasted row becomes the question; the remaining columns become its answers
  // (in order). It fills from THIS question downward. No answer is pre-marked
  // correct — the teacher marks them (or uses "Mark correct in all").
  function onQuestionPaste(e, qi) {
    const text = (e.clipboardData || window.clipboardData)?.getData("text/plain") || "";
    if (!/[\t\n]/.test(text)) return;    // a single cell -> let the normal paste happen
    e.preventDefault();

    const rows = text.replace(/\r/g, "").split("\n");
    while (rows.length && rows[rows.length - 1].trim() === "") rows.pop();   // drop trailing blank line

    const parsed = [];
    rows.forEach(line => {
      const cells = line.split("\t").map(c => c.trim());
      const question = cells[0] || "";
      let answers = cells.slice(1).filter(c => c !== "").slice(0, MAX_ANSWERS).map(t => ({ text: t, correct: false }));
      if (question === "" && answers.length === 0) return;     // skip blank rows
      while (answers.length < MIN_ANSWERS) answers.push({ text: "", correct: false });
      parsed.push({ question, answers });
    });
    if (!parsed.length) return;

    // fill from this question down (keep questions before it), cap at the max
    let next = data.content.questions.slice(0, qi).concat(parsed);
    let dropped = 0;
    if (next.length > MAX_QUESTIONS) { dropped = next.length - MAX_QUESTIONS; next = next.slice(0, MAX_QUESTIONS); }
    data.content.questions = next;
    renderQuestions();
    const filled = parsed.length - dropped;
    showInfo(`Pasted ${filled} question(s) from Excel${dropped ? ` (${dropped} skipped — ${MAX_QUESTIONS} max)` : ""}. `
      + "Now mark the correct answer in each question, or use “Mark correct in all”.");
  }

  function questionCard(q, qi) {
    const card = el("div", "aw-ed-qcard");

    const top = el("div", "aw-ed-qtop");
    top.append(el("span", "aw-ed-qnum", `Question ${qi + 1}`));
    const topActions = el("div", "aw-ed-qactions");
    const dupQ = el("button", "aw-ed-del aw-ed-dup", "Duplicate");
    dupQ.type = "button";
    dupQ.disabled = data.content.questions.length >= MAX_QUESTIONS;
    dupQ.onclick = () => {
      if (data.content.questions.length >= MAX_QUESTIONS) return;
      const copy = JSON.parse(JSON.stringify(q));
      data.content.questions.splice(qi + 1, 0, copy);
      renderQuestions();
    };
    const delQ = el("button", "aw-ed-del", "Remove");
    delQ.type = "button";
    delQ.disabled = data.content.questions.length <= 1;
    delQ.onclick = () => { data.content.questions.splice(qi, 1); renderQuestions(); };
    topActions.append(dupQ, delQ);
    top.append(topActions);
    card.append(top);

    const qInput = el("input", "aw-ed-input aw-ed-qtext");
    qInput.value = q.question;
    qInput.placeholder = "Type the question…";
    qInput.oninput = () => { q.question = qInput.value; clearError(); };
    qInput.addEventListener("paste", e => onQuestionPaste(e, qi));
    card.append(qInput);

    const hint = el("div", "aw-ed-ahint", "Tick the circle to mark the correct answer.");
    card.append(hint);

    // answers laid out two per row (A B / C D / E F)
    const ansWrap = el("div", "aw-ed-answers");
    q.answers.forEach((ans, ai) => ansWrap.append(answerRow(q, ans, ai, qi)));
    card.append(ansWrap);

    const addA = el("button", "aw-ed-adda", "+ Add answer");
    addA.type = "button";
    addA.disabled = q.answers.length >= MAX_ANSWERS;
    addA.onclick = () => {
      if (q.answers.length < MAX_ANSWERS) { q.answers.push({ text: "", correct: false }); renderQuestions(); }
    };
    card.append(addA);
    return card;
  }

  function answerRow(q, ans, ai, qi) {
    const row = el("div", "aw-ed-arow" + (ans.correct ? " is-correct" : ""));

    const radio = el("input");
    radio.type = "radio";
    radio.name = `aw-ed-correct-${qi}`;
    radio.checked = ans.correct;
    radio.title = "Mark as the correct answer";
    radio.onchange = () => { q.answers.forEach((x, k) => x.correct = (k === ai)); renderQuestions(); };

    // the answer BOX: a bold uppercase letter (A, B, …) sits INSIDE the field,
    // then the borderless text input.
    const box = el("div", "aw-ed-abox");
    box.append(el("span", "aw-ed-aletter", String.fromCharCode(65 + ai)));
    const txt = el("input", "aw-ed-atext");
    txt.value = ans.text;
    txt.placeholder = `Answer ${String.fromCharCode(65 + ai)}`;
    txt.oninput = () => { ans.text = txt.value; clearError(); };
    box.append(txt);

    const del = el("button", "aw-ed-del aw-ed-del-a", "×");
    del.type = "button";
    del.title = "Remove this answer";
    del.disabled = q.answers.length <= MIN_ANSWERS;
    del.onclick = () => {
      q.answers.splice(ai, 1);
      if (!q.answers.some(a => a.correct)) q.answers[0].correct = true;
      renderQuestions();
    };

    row.append(radio, box, del);
    return row;
  }

  // ---------- save / cancel ----------
  cancelBtn.onclick = () => onCancel?.();

  saveBtn.onclick = async () => {
    // validate on a CLEANED copy (drop blank answer rows) so the live model
    // the teacher is editing is never mutated by a failed save attempt.
    const clean = JSON.parse(JSON.stringify(data));
    clean.title = clean.title.trim();
    clean.instruction = (clean.instruction || "").trim();
    clean.theme = "classic";
    clean.content.questions.forEach(q => {
      q.question = q.question.trim();
      q.answers = q.answers.filter(a => a.text.trim() !== "").map(a => ({ text: a.text.trim(), correct: !!a.correct }));
    });
    // Silently drop questions that were added but left completely empty
    // (no question text AND no answers) — e.g. a stray "+ Add question".
    clean.content.questions = clean.content.questions.filter(q => !(q.question === "" && q.answers.length === 0));

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
  // Same banner, green — used for bulk-action feedback (not a problem, just news).
  function showInfo(msg) {
    errBar.classList.add("is-info");
    errBar.textContent = msg;
    errBar.style.display = "block";
    body.scrollTop = 0;
  }
  function clearError() {
    if (errBar.style.display !== "none") errBar.style.display = "none";
  }

  // ---------- bulk actions bar (above the questions list) ----------
  function buildBulkBar() {
    const bar = el("div", "aw-ed-bulk");

    // "Answer [A] – Mark correct in all"
    const markWrap = el("span", "aw-ed-bulkgroup");
    const letterSel = el("select", "aw-ed-input aw-ed-select aw-ed-lettersel");
    for (let i = 0; i < MAX_ANSWERS; i++) {
      const o = el("option", null, String.fromCharCode(65 + i));
      o.value = i;
      letterSel.append(o);
    }
    const markBtn = el("button", "aw-btn", "Mark correct in all");
    markBtn.type = "button";
    markBtn.onclick = () => {
      const ai = parseInt(letterSel.value, 10);
      const letter = String.fromCharCode(65 + ai);
      let skipped = 0;
      data.content.questions.forEach(q => {
        if (ai < q.answers.length) q.answers.forEach((a, k) => a.correct = (k === ai));
        else skipped++;
      });
      renderQuestions();
      showInfo(skipped
        ? `Answer ${letter} marked correct where it exists — ${skipped} question(s) with fewer answers were left unchanged.`
        : `Answer ${letter} is now the correct answer in every question.`);
    };
    markWrap.append(el("span", "aw-ed-bulklabel", "Answer"), letterSel, markBtn);

    const unmarkBtn = el("button", "aw-btn", "Unmark all correct");
    unmarkBtn.type = "button";
    unmarkBtn.onclick = () => {
      data.content.questions.forEach(q => q.answers.forEach(a => a.correct = false));
      renderQuestions();
      showInfo("All correct marks removed — tick the circle in each question before saving.");
    };

    const clearBtn = el("button", "aw-btn aw-ed-bulkdanger", "Delete all questions");
    clearBtn.type = "button";
    clearBtn.onclick = () => {
      if (!confirm("Delete ALL questions and answers?")) return;
      data.content.questions = [blankQuestion()];
      renderQuestions();
      showInfo("All questions deleted.");
    };

    bar.append(markWrap, unmarkBtn, clearBtn);
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
  a.type = "quiz";
  a.schemaVersion = a.schemaVersion || 1;
  a.title = a.title || "";
  a.instruction = a.instruction || "";
  a.theme = "classic";                 // theme is always Classic now
  a.options = a.options || {};
  a.content = a.content || {};
  let qs = Array.isArray(a.content.questions) ? a.content.questions : [];
  if (qs.length === 0) qs = [blankQuestion()];
  a.content.questions = qs.map(q => {
    let answers = (Array.isArray(q.answers) && q.answers.length ? q.answers : blankAnswers())
      .map(ans => ({ text: ans.text || "", correct: !!ans.correct }));
    if (!answers.some(a => a.correct)) answers[0].correct = true;   // always exactly-one default
    return { question: q.question || "", answers };
  });
  return a;
}
function blankQuestion() { return { question: "", answers: blankAnswers() }; }
function blankAnswers() { return [{ text: "", correct: true }, { text: "", correct: false }]; }

function validate(d) {
  if (!d.title) return "Please enter an activity title.";
  if (!d.content.questions.length) return "Add at least one question.";
  for (let i = 0; i < d.content.questions.length; i++) {
    const q = d.content.questions[i];
    if (!q.question) return `Question ${i + 1} has no text.`;
    if (q.answers.length < MIN_ANSWERS) return `Question ${i + 1} needs at least ${MIN_ANSWERS} answers.`;
    if (!q.answers.some(a => a.correct)) return `Question ${i + 1}: mark the correct answer.`;
  }
  return null;
}
