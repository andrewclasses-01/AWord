// =============================================================
// WHACK-A-MOLE EDITOR — the form a teacher uses to create or edit a
// whack-a-mole activity. Same contract as the other templates:
//   openWamEditor(container, activity, { onSave, onCancel, header, footer })
//
// Whack-a-mole has TWO content modes, chosen by a segmented toggle at the top:
//   • True / False — a list of statements, each marked True or False
//                    (like templates/true-false).
//   • Quiz         — a list of questions, each with answer options and one
//                    marked correct (like templates/quiz).
// Both lists live in the working model at once, so switching the toggle never
// loses what you typed; Save keeps both arrays and records `options.mode`.
//
// Reuses the SHARED editor chrome + quiz-style question cards from
// core/app.css (.aw-ed-*). The True/False row layout is a few whack-specific
// classes in whack-a-mole.css (.aw-wam-ed-*). Excel paste works in both modes.
// Speed / game-time / crates are NOT here — they live in the in-game Options
// panel (buildExtraOptions), same split as every other template.
// =============================================================

import { el } from "../../core/utils.js";
import { icons } from "../../core/icons.js";

const MIN_STATEMENTS = 3;
const MAX_STATEMENTS = 40;
const MIN_ANSWERS = 2;
const MAX_ANSWERS = 4;
const MAX_QUESTIONS = 60;

function parseAnswer(cell) {
  const t = String(cell || "").trim().toLowerCase();
  if (["true", "t", "1", "yes", "y", "correct", "right", "đúng", "dung"].includes(t)) return true;
  if (["false", "f", "0", "no", "n", "wrong", "incorrect", "sai"].includes(t)) return false;
  return null;
}

export function openWamEditor(container, activity, { onSave, onCancel, header, footer } = {}) {
  const isNew = !(activity && activity.id);
  const data = normalize(activity);
  let mode = data.options.mode === "quiz" ? "quiz" : "trueFalse";
  let draggingIndex = null;

  container.innerHTML = "";
  const page = el("div", "aw-ed");
  if (header) page.append(header);

  // ---- Sticky action bar ----
  const head = el("div", "aw-ed-head");
  const headL = el("div", "aw-ed-headleft");
  headL.append(el("span", "aw-ed-typebadge", "WHACK-A-MOLE"));
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

  // ===== META: title =====
  const meta = el("div", "aw-ed-meta");
  const titleInput = el("input", "aw-ed-input");
  titleInput.value = data.title;
  titleInput.placeholder = "e.g. Plant life cycle — Whack-a-mole";
  titleInput.oninput = () => { data.title = titleInput.value; clearError(); };
  meta.append(field("Activity Title", titleInput));
  body.append(meta);

  // ===== MODE toggle =====
  const modeField = el("div", "aw-ed-field");
  modeField.append(el("label", "aw-ed-label", "Game mode"));
  const seg = el("div", "aw-wam-ed-modeseg");
  const segTf = el("button", "aw-wam-ed-modebtn", "True / False");
  const segQz = el("button", "aw-wam-ed-modebtn", "Quiz");
  segTf.type = "button"; segQz.type = "button";
  const paintMode = () => {
    segTf.classList.toggle("is-on", mode === "trueFalse");
    segQz.classList.toggle("is-on", mode === "quiz");
  };
  segTf.onclick = () => { mode = "trueFalse"; paintMode(); renderSection(); clearError(); };
  segQz.onclick = () => { mode = "quiz"; paintMode(); renderSection(); clearError(); };
  paintMode();
  seg.append(segTf, segQz);
  modeField.append(seg);
  meta.append(modeField);

  // ===== CONTENT SECTION (swaps with mode) =====
  const section = el("div", "aw-wam-ed-section");
  body.append(section);
  renderSection();

  if (footer) page.append(footer);
  container.append(page);
  titleInput.focus();

  // ---------- section router ----------
  function renderSection() {
    section.innerHTML = "";
    if (mode === "trueFalse") renderStatements(); else renderQuestions();
  }

  // =========================================================
  // TRUE / FALSE — statement list
  // =========================================================
  function renderStatements() {
    section.append(el("div", "aw-ed-sectionhead", "Statements"));
    const bar = el("div", "aw-ed-bulk");
    const clearBtn = el("button", "aw-btn aw-ed-bulkdanger", "Delete all statements");
    clearBtn.type = "button";
    clearBtn.onclick = () => {
      if (!confirm("Delete ALL statements?")) return;
      data.content.statements = [blankStatement(), blankStatement(), blankStatement()];
      renderStatements(); showInfo("All statements deleted.");
    };
    bar.append(clearBtn);
    section.append(bar);
    section.append(el("div", "aw-ed-tip",
      "The sign tells players to hit the TRUE moles. Write a statement, then mark it True or False. " +
      "Tip: copy a block from Excel (statement in column 1, True/False in column 2), click a statement box and paste."));

    const wrap = el("div", "aw-ed-questions");
    section.append(wrap);
    drawStatements(wrap);
  }

  function drawStatements(wrap) {
    wrap.innerHTML = "";
    data.content.statements.forEach((it, ii) => wrap.append(statementRow(it, ii, wrap)));
    const add = el("button", "aw-tf-ed-addrow aw-wam-ed-addrow", "+ Add a new statement");
    add.type = "button";
    add.disabled = data.content.statements.length >= MAX_STATEMENTS;
    add.onclick = () => { if (data.content.statements.length < MAX_STATEMENTS) { data.content.statements.push(blankStatement()); drawStatements(wrap); } };
    wrap.append(add);
    wrap.append(el("div", "aw-ed-qcount", `${data.content.statements.length} / ${MAX_STATEMENTS} statements`));
  }

  function statementRow(it, ii, wrap) {
    const row = el("div", "aw-wam-ed-row");
    row.append(el("div", "aw-wam-ed-num", (ii + 1) + "."));

    const box = el("div", "aw-wam-ed-box");
    const stInput = el("input", "aw-wam-ed-statement");
    stInput.value = it.text;
    stInput.placeholder = "Type a statement";
    stInput.oninput = () => { it.text = stInput.value; clearError(); };
    stInput.addEventListener("paste", e => onStatementPaste(e, ii, wrap));
    box.append(stInput);

    const ans = el("div", "aw-wam-ed-answer");
    const bTrue = el("button", "aw-wam-ed-seg is-true", "True");
    const bFalse = el("button", "aw-wam-ed-seg is-false", "False");
    bTrue.type = "button"; bFalse.type = "button";
    const paint = () => { bTrue.classList.toggle("is-on", it.answer === true); bFalse.classList.toggle("is-on", it.answer === false); };
    bTrue.onclick = () => { it.answer = true; paint(); clearError(); };
    bFalse.onclick = () => { it.answer = false; paint(); clearError(); };
    paint();
    ans.append(bTrue, bFalse);
    box.append(ans);
    row.append(box);

    const iconsWrap = el("div", "aw-wam-ed-icons");
    const dragBtn = smallIcon(icons.dragHandle, "Drag to reorder", "is-drag");
    const dupBtn = smallIcon(icons.duplicate, "Duplicate");
    dupBtn.disabled = data.content.statements.length >= MAX_STATEMENTS;
    dupBtn.onclick = () => { if (data.content.statements.length < MAX_STATEMENTS) { data.content.statements.splice(ii + 1, 0, JSON.parse(JSON.stringify(it))); drawStatements(wrap); } };
    const delBtn = smallIcon(icons.trash, "Remove", "is-danger");
    delBtn.disabled = data.content.statements.length <= 1;
    delBtn.onclick = () => { data.content.statements.splice(ii, 1); drawStatements(wrap); };
    iconsWrap.append(dragBtn, dupBtn, delBtn);
    row.append(iconsWrap);

    wireDrag(dragBtn, row, () => data.content.statements.indexOf(it));
    wireDrop(row, () => data.content.statements.indexOf(it), data.content.statements, () => drawStatements(wrap));
    return row;
  }

  function onStatementPaste(e, ii, wrap) {
    const text = (e.clipboardData || window.clipboardData)?.getData("text/plain") || "";
    if (!/[\t\n]/.test(text)) return;
    e.preventDefault();
    const rows = text.replace(/\r/g, "").split("\n");
    while (rows.length && rows[rows.length - 1].trim() === "") rows.pop();
    const parsed = [];
    rows.forEach(line => {
      const cells = line.split("\t").map(c => c.trim());
      if (!cells[0]) return;
      const a = parseAnswer(cells[1]);
      parsed.push({ text: cells[0], answer: a == null ? true : a });
    });
    if (!parsed.length) return;
    let next = data.content.statements.slice(0, ii).concat(parsed);
    let dropped = 0;
    if (next.length > MAX_STATEMENTS) { dropped = next.length - MAX_STATEMENTS; next = next.slice(0, MAX_STATEMENTS); }
    data.content.statements = next;
    drawStatements(wrap);
    showInfo(`Pasted ${parsed.length - dropped} statement(s)${dropped ? ` (${dropped} skipped — ${MAX_STATEMENTS} max)` : ""}.`);
  }

  // =========================================================
  // QUIZ — question cards (reuses core .aw-ed-* like quiz-editor)
  // =========================================================
  function renderQuestions() {
    section.append(el("div", "aw-ed-sectionhead", "Questions"));
    const bar = el("div", "aw-ed-bulk");
    const clearBtn = el("button", "aw-btn aw-ed-bulkdanger", "Delete all questions");
    clearBtn.type = "button";
    clearBtn.onclick = () => {
      if (!confirm("Delete ALL questions?")) return;
      data.content.questions = [blankQuestion()];
      renderQuestions(); showInfo("All questions deleted.");
    };
    bar.append(clearBtn);
    section.append(bar);
    section.append(el("div", "aw-ed-tip",
      "The sign shows one question at a time; moles carry the answers. Players hit the CORRECT one to move on. " +
      "Tip: copy from Excel (question in column 1, answers in the next columns), click a question box and paste."));

    const wrap = el("div", "aw-ed-questions");
    section.append(wrap);
    drawQuestions(wrap);
  }

  function drawQuestions(wrap) {
    wrap.innerHTML = "";
    data.content.questions.forEach((q, qi) => wrap.append(questionCard(q, qi, wrap)));
    const addQ = el("button", "aw-ed-addq", "+ Add question");
    addQ.type = "button";
    addQ.disabled = data.content.questions.length >= MAX_QUESTIONS;
    addQ.onclick = () => { if (data.content.questions.length < MAX_QUESTIONS) { data.content.questions.push(blankQuestion()); drawQuestions(wrap); } };
    wrap.append(addQ);
    wrap.append(el("div", "aw-ed-qcount", `${data.content.questions.length} / ${MAX_QUESTIONS} questions`));
  }

  function questionCard(q, qi, wrap) {
    const card = el("div", "aw-ed-qcard");
    const top = el("div", "aw-ed-qtop");
    top.append(el("span", "aw-ed-qnum", `Question ${qi + 1}`));
    const topActions = el("div", "aw-ed-qactions");
    const dupQ = el("button", "aw-ed-del aw-ed-dup", "Duplicate");
    dupQ.type = "button";
    dupQ.disabled = data.content.questions.length >= MAX_QUESTIONS;
    dupQ.onclick = () => { if (data.content.questions.length < MAX_QUESTIONS) { data.content.questions.splice(qi + 1, 0, JSON.parse(JSON.stringify(q))); drawQuestions(wrap); } };
    const delQ = el("button", "aw-ed-del", "Remove");
    delQ.type = "button";
    delQ.disabled = data.content.questions.length <= 1;
    delQ.onclick = () => { data.content.questions.splice(qi, 1); drawQuestions(wrap); };
    topActions.append(dupQ, delQ);
    top.append(topActions);
    card.append(top);

    const qInput = el("input", "aw-ed-input aw-ed-qtext");
    qInput.value = q.question;
    qInput.placeholder = "Type the question…";
    qInput.oninput = () => { q.question = qInput.value; clearError(); };
    qInput.addEventListener("paste", e => onQuestionPaste(e, qi, wrap));
    card.append(qInput);

    card.append(el("div", "aw-ed-ahint", "Tick the circle to mark the correct answer."));

    const ansWrap = el("div", "aw-ed-answers");
    q.answers.forEach((ans, ai) => ansWrap.append(answerRow(q, ans, ai, qi, wrap)));
    card.append(ansWrap);

    const addA = el("button", "aw-ed-adda", "+ Add answer");
    addA.type = "button";
    addA.disabled = q.answers.length >= MAX_ANSWERS;
    addA.onclick = () => { if (q.answers.length < MAX_ANSWERS) { q.answers.push({ text: "", correct: false }); drawQuestions(wrap); } };
    card.append(addA);
    return card;
  }

  function answerRow(q, ans, ai, qi, wrap) {
    const row = el("div", "aw-ed-arow" + (ans.correct ? " is-correct" : ""));
    const radio = el("input");
    radio.type = "radio"; radio.name = `aw-wam-ed-correct-${qi}`;
    radio.checked = ans.correct; radio.title = "Mark as the correct answer";
    radio.onchange = () => { q.answers.forEach((x, k) => x.correct = (k === ai)); drawQuestions(wrap); };
    const box = el("div", "aw-ed-abox");
    box.append(el("span", "aw-ed-aletter", String.fromCharCode(65 + ai)));
    const txt = el("input", "aw-ed-atext");
    txt.value = ans.text; txt.placeholder = `Answer ${String.fromCharCode(65 + ai)}`;
    txt.oninput = () => { ans.text = txt.value; clearError(); };
    box.append(txt);
    const del = el("button", "aw-ed-del aw-ed-del-a", "×");
    del.type = "button"; del.title = "Remove this answer";
    del.disabled = q.answers.length <= MIN_ANSWERS;
    del.onclick = () => { q.answers.splice(ai, 1); if (!q.answers.some(a => a.correct)) q.answers[0].correct = true; drawQuestions(wrap); };
    row.append(radio, box, del);
    return row;
  }

  function onQuestionPaste(e, qi, wrap) {
    const text = (e.clipboardData || window.clipboardData)?.getData("text/plain") || "";
    if (!/[\t\n]/.test(text)) return;
    e.preventDefault();
    const rows = text.replace(/\r/g, "").split("\n");
    while (rows.length && rows[rows.length - 1].trim() === "") rows.pop();
    const parsed = [];
    rows.forEach(line => {
      const cells = line.split("\t").map(c => c.trim());
      const question = cells[0] || "";
      let answers = cells.slice(1).filter(c => c !== "").slice(0, MAX_ANSWERS).map(t => ({ text: t, correct: false }));
      if (question === "" && answers.length === 0) return;
      while (answers.length < MIN_ANSWERS) answers.push({ text: "", correct: false });
      parsed.push({ question, answers });
    });
    if (!parsed.length) return;
    let next = data.content.questions.slice(0, qi).concat(parsed);
    let dropped = 0;
    if (next.length > MAX_QUESTIONS) { dropped = next.length - MAX_QUESTIONS; next = next.slice(0, MAX_QUESTIONS); }
    data.content.questions = next;
    drawQuestions(wrap);
    showInfo(`Pasted ${parsed.length - dropped} question(s)${dropped ? ` (${dropped} skipped)` : ""}. Now mark the correct answer in each.`);
  }

  // ---------- drag-to-reorder (shared) ----------
  function wireDrag(handle, row, getIndex) {
    handle.draggable = true;
    handle.addEventListener("dragstart", e => {
      draggingIndex = getIndex();
      e.dataTransfer.effectAllowed = "move";
      try { e.dataTransfer.setData("text/plain", String(draggingIndex)); } catch { /* ignore */ }
      try { e.dataTransfer.setDragImage(row, 24, 24); } catch { /* ignore */ }
      row.classList.add("is-dragging");
    });
    handle.addEventListener("dragend", () => {
      draggingIndex = null; row.classList.remove("is-dragging");
      section.querySelectorAll(".aw-wam-ed-row").forEach(r => r.classList.remove("is-dropbefore", "is-dropafter"));
    });
  }
  function wireDrop(row, getIndex, arr, redraw) {
    row.addEventListener("dragover", e => {
      if (draggingIndex == null) return;
      e.preventDefault(); e.dataTransfer.dropEffect = "move";
      const rect = row.getBoundingClientRect();
      const before = (e.clientY - rect.top) < rect.height / 2;
      row.classList.toggle("is-dropbefore", before);
      row.classList.toggle("is-dropafter", !before);
    });
    row.addEventListener("dragleave", () => row.classList.remove("is-dropbefore", "is-dropafter"));
    row.addEventListener("drop", e => {
      e.preventDefault();
      const before = row.classList.contains("is-dropbefore");
      row.classList.remove("is-dropbefore", "is-dropafter");
      const from = draggingIndex; draggingIndex = null;
      if (from == null) return;
      let to = getIndex() + (before ? 0 : 1);
      if (to === from || to === from + 1) return;
      const [item] = arr.splice(from, 1);
      arr.splice(to > from ? to - 1 : to, 0, item);
      redraw();
    });
  }

  // ---------- save / cancel ----------
  cancelBtn.onclick = () => onCancel?.();
  saveBtn.onclick = async () => {
    const clean = JSON.parse(JSON.stringify(data));
    clean.title = (clean.title || "").trim();
    clean.instruction = (clean.instruction || "").trim();
    clean.theme = "classic";
    clean.options = clean.options || {};
    clean.options.mode = mode;
    clean.options.timer = "none";
    clean.content.statements = (clean.content.statements || [])
      .map(it => ({ text: (it.text || "").trim(), answer: it.answer === true }))
      .filter(it => it.text !== "");
    clean.content.questions = (clean.content.questions || []).map(q => ({
      question: (q.question || "").trim(),
      answers: (q.answers || []).filter(a => (a.text || "").trim() !== "").map(a => ({ text: a.text.trim(), correct: !!a.correct }))
    })).filter(q => !(q.question === "" && q.answers.length === 0));

    const err = validate(clean, mode);
    if (err) { showError(err); return; }

    saveBtn.disabled = true;
    const label = saveBtn.textContent;
    saveBtn.textContent = "Saving…";
    try { await onSave?.(clean); }
    catch (e) { saveBtn.disabled = false; saveBtn.textContent = label; showError("Could not save — please try again."); }
  };

  function showError(msg) { errBar.classList.remove("is-info"); errBar.textContent = msg; errBar.style.display = "block"; body.scrollTop = 0; }
  function showInfo(msg) { errBar.classList.add("is-info"); errBar.textContent = msg; errBar.style.display = "block"; body.scrollTop = 0; }
  function clearError() { if (errBar.style.display !== "none") errBar.style.display = "none"; }

  function smallIcon(svg, title, extraClass) {
    const b = el("button", "aw-wam-ed-iconbtn" + (extraClass ? " " + extraClass : ""), svg);
    b.type = "button"; b.title = title; b.setAttribute("aria-label", title);
    return b;
  }
  function field(labelText, control) {
    const f = el("div", "aw-ed-field");
    f.append(el("label", "aw-ed-label", labelText), control);
    return f;
  }
}

// ===== data helpers =====
function normalize(activity) {
  const a = activity ? JSON.parse(JSON.stringify(activity)) : {};
  a.type = "whack_a_mole";
  a.schemaVersion = a.schemaVersion || 1;
  a.title = a.title || "";
  a.instruction = a.instruction || "";
  a.theme = "classic";
  a.options = a.options || {};
  if (a.options.mode !== "quiz") a.options.mode = a.options.mode || "trueFalse";
  a.content = a.content || {};

  let statements = Array.isArray(a.content.statements) ? a.content.statements : [];
  if (statements.length < MIN_STATEMENTS) while (statements.length < MIN_STATEMENTS) statements.push(blankStatement());
  a.content.statements = statements.map(it => ({ text: it.text || "", answer: it.answer === true }));

  let qs = Array.isArray(a.content.questions) ? a.content.questions : [];
  if (qs.length === 0) qs = [blankQuestion()];
  a.content.questions = qs.map(q => {
    let answers = (Array.isArray(q.answers) && q.answers.length ? q.answers : blankAnswers())
      .map(ans => ({ text: ans.text || "", correct: !!ans.correct }));
    if (!answers.some(x => x.correct)) answers[0].correct = true;
    return { question: q.question || "", answers };
  });
  return a;
}
function blankStatement() { return { text: "", answer: true }; }
function blankQuestion() { return { question: "", answers: blankAnswers() }; }
function blankAnswers() { return [{ text: "", correct: true }, { text: "", correct: false }]; }

function validate(d, mode) {
  if (!d.title) return "Please enter an activity title.";
  if (mode === "trueFalse") {
    if (d.content.statements.length < MIN_STATEMENTS) return `Add at least ${MIN_STATEMENTS} statements.`;
    if (!d.content.statements.some(s => s.answer === true)) return "At least one statement must be True (the sign tells players to hit True moles).";
  } else {
    if (!d.content.questions.length) return "Add at least one question.";
    for (let i = 0; i < d.content.questions.length; i++) {
      const q = d.content.questions[i];
      if (!q.question) return `Question ${i + 1} has no text.`;
      if (q.answers.length < MIN_ANSWERS) return `Question ${i + 1} needs at least ${MIN_ANSWERS} answers.`;
      if (!q.answers.some(a => a.correct)) return `Question ${i + 1}: mark the correct answer.`;
    }
  }
  return null;
}
