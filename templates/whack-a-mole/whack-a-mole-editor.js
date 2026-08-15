// =============================================================
// WHACK-A-MOLE EDITOR — the form a teacher uses to create or edit a
// whack-a-mole activity. Same contract as the other templates:
//   openWamEditor(container, activity, { onSave, onCancel, header, footer })
//
// Whack-a-mole has TWO content modes, chosen by a segmented toggle at the top:
//   • True / False — TWO columns (TRUE statements | FALSE statements), exactly
//                    like templates/true-false. The column a row lives in IS its
//                    answer; the game always shuffles, so there's no reordering.
//   • Quiz         — a list of question cards, each with answer options and one
//                    marked correct (like templates/quiz).
// Both datasets live in the working model at once, so switching the toggle never
// loses what you typed; Save merges the columns into content.statements and keeps
// content.questions, recording options.mode.
//
// MODE LOCK: the mode can only be changed while the current mode has NO real
// content (new activity, or after "Delete all"). Once statements/questions carry
// text, the other mode button is disabled — the teacher must clear first. This
// stops accidental data loss / shape mismatch.
//
// Reuses the SHARED editor chrome from core/app.css (.aw-ed-*). The 2-column
// True/False look uses .aw-wam-tf-* classes defined in whack-a-mole.css (a copy
// of true-false's column layout — true-false.css isn't loaded for this game).
// Quiz cards reuse quiz's .aw-ed-* classes. Excel paste works in both.
// Speed / lives / penalty / bonuses / timer are NOT here — they live in the
// in-game Options panel (buildExtraOptions), same split as every other template.
// =============================================================

import { el } from "../../core/utils.js";
import { icons } from "../../core/icons.js";

const MIN_ITEMS = 3;
const MAX_ITEMS = 40;
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

  // ===== MODE toggle (locked once the current mode has content) =====
  const modeField = el("div", "aw-ed-field");
  modeField.append(el("label", "aw-ed-label", "Game mode"));
  const seg = el("div", "aw-wam-ed-modeseg");
  const segTf = el("button", "aw-wam-ed-modebtn", "True / False");
  const segQz = el("button", "aw-wam-ed-modebtn", "Quiz");
  segTf.type = "button"; segQz.type = "button";
  segTf.onclick = () => switchMode("trueFalse");
  segQz.onclick = () => switchMode("quiz");
  seg.append(segTf, segQz);
  modeField.append(seg);
  const lockHint = el("div", "aw-wam-ed-lockhint",
    "Mode is locked while there's content. Use “Delete all” below to clear it first, then you can switch.");
  lockHint.style.display = "none";
  modeField.append(lockHint);
  meta.append(modeField);
  body.append(meta);

  // ===== CONTENT SECTION (swaps with mode) =====
  const section = el("div", "aw-wam-ed-section");
  body.append(section);
  renderSection();
  paintMode();

  if (footer) page.append(footer);
  container.append(page);
  titleInput.focus();

  // ---------- mode handling ----------
  function switchMode(next) {
    if (next === mode) return;
    if (currentHasContent()) return;         // locked
    mode = next;
    renderSection();
    paintMode();
    clearError();
  }
  function paintMode() {
    segTf.classList.toggle("is-on", mode === "trueFalse");
    segQz.classList.toggle("is-on", mode === "quiz");
    updateModeLock();
  }
  function hasTfContent() { return data.trueTexts.concat(data.falseTexts).some(t => (t || "").trim() !== ""); }
  function hasQuizContent() {
    return data.content.questions.some(q => (q.question || "").trim() !== "" || (q.answers || []).some(a => (a.text || "").trim() !== ""));
  }
  function currentHasContent() { return mode === "trueFalse" ? hasTfContent() : hasQuizContent(); }
  function updateModeLock() {
    const locked = currentHasContent();
    segTf.disabled = locked && mode !== "trueFalse";
    segQz.disabled = locked && mode !== "quiz";
    lockHint.style.display = locked ? "block" : "none";
  }

  // ---------- section router ----------
  function renderSection() {
    section.innerHTML = "";
    if (mode === "trueFalse") renderCols(); else renderQuestions();
  }

  // =========================================================
  // TRUE / FALSE — two columns (TRUE | FALSE)
  // =========================================================
  function renderCols() {
    section.append(el("div", "aw-ed-sectionhead", "Statements"));
    const bar = el("div", "aw-ed-bulk");
    const clearBtn = el("button", "aw-btn aw-ed-bulkdanger", "Delete all statements");
    clearBtn.type = "button";
    clearBtn.onclick = () => {
      if (!confirm("Delete ALL statements?")) return;
      data.trueTexts = ["", ""];
      data.falseTexts = ["", ""];
      renderCols(); updateModeLock(); showInfo("All statements deleted — you can switch mode now if you want.");
    };
    bar.append(clearBtn);
    section.append(bar);

    const cols = el("div", "aw-wam-tf-cols");
    const trueCol = el("div", "aw-wam-tf-col is-true");
    const falseCol = el("div", "aw-wam-tf-col is-false");
    cols.append(trueCol, falseCol);
    section.append(cols);

    renderOneCol(trueCol, true);
    renderOneCol(falseCol, false);
  }

  function renderOneCol(colEl, isTrue) {
    const list = isTrue ? data.trueTexts : data.falseTexts;
    colEl.innerHTML = "";
    colEl.append(el("div", "aw-wam-tf-coltitle " + (isTrue ? "is-true" : "is-false"),
      isTrue ? "&#10003; TRUE statements" : "&#10007; FALSE statements"));

    const listWrap = el("div", "aw-wam-tf-list");
    list.forEach((text, ii) => listWrap.append(colRow(list, text, ii, isTrue)));
    colEl.append(listWrap);

    const addBtn = el("button", "aw-wam-tf-addrow", isTrue ? "+ Add a TRUE statement" : "+ Add a FALSE statement");
    addBtn.type = "button";
    addBtn.disabled = totalCount() >= MAX_ITEMS;
    addBtn.onclick = () => { if (totalCount() < MAX_ITEMS) { list.push(""); renderOneCol(colEl, isTrue); } };
    colEl.append(addBtn);
  }

  function colRow(list, text, ii, isTrue) {
    const row = el("div", "aw-wam-tf-row");
    row.append(el("div", "aw-wam-tf-num", String(ii + 1) + "."));

    const box = el("div", "aw-wam-tf-box");
    const inp = el("input", "aw-wam-tf-statement");
    inp.value = text;
    inp.placeholder = isTrue ? "A statement that is TRUE" : "A statement that is FALSE";
    inp.oninput = () => { list[ii] = inp.value; clearError(); updateModeLock(); };
    inp.addEventListener("paste", e => onColPaste(e, list, ii, isTrue));
    box.append(inp);
    row.append(box);

    const iconsWrap = el("div", "aw-wam-tf-icons");
    const dupBtn = iconBtn(icons.duplicate, "Duplicate");
    dupBtn.disabled = totalCount() >= MAX_ITEMS;
    dupBtn.onclick = () => { if (totalCount() < MAX_ITEMS) { list.splice(ii + 1, 0, list[ii]); renderCols(); updateModeLock(); } };
    const delBtn = iconBtn(icons.trash, "Remove", "is-danger");
    delBtn.disabled = totalCount() <= 1;
    delBtn.onclick = () => { list.splice(ii, 1); renderCols(); updateModeLock(); };
    iconsWrap.append(dupBtn, delBtn);
    row.append(iconsWrap);
    return row;
  }

  function totalCount() { return data.trueTexts.length + data.falseTexts.length; }
  function enforceMax() {
    let dropped = 0;
    while (totalCount() > MAX_ITEMS) { (data.falseTexts.length ? data.falseTexts : data.trueTexts).pop(); dropped++; }
    return dropped;
  }

  function onColPaste(e, list, ii, isTrue) {
    const text = (e.clipboardData || window.clipboardData)?.getData("text/plain") || "";
    if (!/[\t\n]/.test(text)) return;    // single cell -> normal paste
    e.preventDefault();
    const rows = text.replace(/\r/g, "").split("\n");
    while (rows.length && rows[rows.length - 1].trim() === "") rows.pop();

    const hasTF = rows.some(l => parseAnswer(l.split("\t")[1]) !== null);
    let added = 0;
    if (hasTF) {
      rows.forEach(line => {
        const cells = line.split("\t").map(c => c.trim());
        const t = cells[0];
        if (!t) return;
        const ans = parseAnswer(cells[1]);
        if (ans === false) data.falseTexts.push(t); else data.trueTexts.push(t);
        added++;
      });
    } else {
      const parsed = rows.map(l => l.split("\t")[0].trim()).filter(Boolean);
      const next = list.slice(0, ii).concat(parsed);
      if (isTrue) data.trueTexts = next; else data.falseTexts = next;
      added = parsed.length;
    }
    const dropped = enforceMax();
    renderCols(); updateModeLock();
    showInfo(`Pasted ${added - dropped} statement(s) from Excel${dropped ? ` (${dropped} skipped — ${MAX_ITEMS} max)` : ""}.`);
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
      renderQuestions(); updateModeLock(); showInfo("All questions deleted — you can switch mode now if you want.");
    };
    bar.append(clearBtn);
    section.append(bar);

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
    addQ.onclick = () => { if (data.content.questions.length < MAX_QUESTIONS) { data.content.questions.push(blankQuestion()); drawQuestions(wrap); updateModeLock(); } };
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
    delQ.onclick = () => { data.content.questions.splice(qi, 1); drawQuestions(wrap); updateModeLock(); };
    topActions.append(dupQ, delQ);
    top.append(topActions);
    card.append(top);

    const qInput = el("input", "aw-ed-input aw-ed-qtext");
    qInput.value = q.question;
    qInput.placeholder = "Type the question…";
    qInput.oninput = () => { q.question = qInput.value; clearError(); updateModeLock(); };
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
    txt.oninput = () => { ans.text = txt.value; clearError(); updateModeLock(); };
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
    drawQuestions(wrap); updateModeLock();
    showInfo(`Pasted ${parsed.length - dropped} question(s)${dropped ? ` (${dropped} skipped)` : ""}. Now mark the correct answer in each.`);
  }

  // ---------- save / cancel ----------
  cancelBtn.onclick = () => onCancel?.();
  saveBtn.onclick = async () => {
    const trueTexts = data.trueTexts.map(t => (t || "").trim()).filter(Boolean);
    const falseTexts = data.falseTexts.map(t => (t || "").trim()).filter(Boolean);

    const clean = JSON.parse(JSON.stringify({
      id: activity && activity.id ? activity.id : undefined,
      type: "whack_a_mole",
      schemaVersion: 1,
      title: (data.title || "").trim(),
      instruction: (data.instruction || "").trim(),
      theme: "classic",
      options: data.options || {}
    }));
    if (clean.id === undefined) delete clean.id;
    clean.options.mode = mode;
    // NOTE: we no longer force options.timer here — the teacher's Timer choice
    // (Count up / Count down) in the in-game Options panel is respected.

    clean.content = {
      statements: [
        ...trueTexts.map(text => ({ text, answer: true })),
        ...falseTexts.map(text => ({ text, answer: false }))
      ],
      questions: (data.content.questions || []).map(q => ({
        question: (q.question || "").trim(),
        answers: (q.answers || []).filter(a => (a.text || "").trim() !== "").map(a => ({ text: a.text.trim(), correct: !!a.correct }))
      })).filter(q => !(q.question === "" && q.answers.length === 0))
    };

    const err = validate(clean, mode, trueTexts.length, falseTexts.length);
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

  function iconBtn(svg, title, extraClass) {
    const b = el("button", "aw-wam-tf-iconbtn" + (extraClass ? " " + extraClass : ""), svg);
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

  // split stored statements into the two editing columns
  const stmts = Array.isArray(a.content.statements) ? a.content.statements : [];
  a.trueTexts = stmts.filter(s => s && s.answer === true).map(s => s.text || "");
  a.falseTexts = stmts.filter(s => s && s.answer !== true).map(s => s.text || "");
  const isNew = !(activity && activity.id);
  if (isNew) {
    while (a.trueTexts.length < 2) a.trueTexts.push("");
    while (a.falseTexts.length < 2) a.falseTexts.push("");
  } else {
    if (!a.trueTexts.length) a.trueTexts.push("");
    if (!a.falseTexts.length) a.falseTexts.push("");
  }

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
function blankQuestion() { return { question: "", answers: blankAnswers() }; }
function blankAnswers() { return [{ text: "", correct: true }, { text: "", correct: false }]; }

function validate(d, mode, trueCount, falseCount) {
  if (!d.title) return "Please enter an activity title.";
  if (mode === "trueFalse") {
    const total = d.content.statements.length;
    if (total < MIN_ITEMS) return `Add at least ${MIN_ITEMS} statements in total.`;
    if (trueCount < 1) return "Add at least one TRUE statement (left column).";
    if (falseCount < 1) return "Add at least one FALSE statement (right column).";
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
