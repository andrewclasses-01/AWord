// =============================================================
// OPEN THE BOX EDITOR — the form a teacher uses to create or edit an Open
// the box activity. Same contract as templates/quiz/quiz-editor.js:
//   openOtbEditor(container, activity, { onSave, onCancel, header, footer })
//
// Content shape is IDENTICAL to Quiz's (`{question, answers:[{text,correct}]}`
// per item) — Open the box's "Questions" mode has always been a quiz-in-a-box
// (see GHI CHU OPEN-THE-BOX.md), so this editor is a close copy of
// quiz-editor.js with the field renamed `content.items` (one item = one box)
// and the box-count limits from Wordwall's own "min 2 – max 100 boxes" rule
// (docs/04-OPEN-THE-BOX.md), instead of Quiz's question limits.
//
// It edits a DEEP CLONE of `activity`, so pressing Cancel leaves the original
// untouched. Text inputs bind to the model on every keystroke; the box list
// only re-renders when the STRUCTURE changes (add/remove/duplicate/
// mark-correct), so typing never loses focus.
//
// SCOPE (same simplification as Quiz/Anagram, per Teacher Andrew): this page
// edits ONLY the title + the boxes. Theme is always Classic; default options
// live in Settings; per-act options (incl. "Question time") are tweaked from
// the in-game Options panel. Class prefix: .aw-ed-* (shared editor chrome —
// see core/app.css, same classes Quiz/Anagram already use).
// =============================================================

import { el } from "../../core/utils.js";

const MIN_ANSWERS = 2;
const MAX_ANSWERS = 6;
const MIN_ITEMS = 2;      // Wordwall's own "Open the box" rule: min 2 boxes
const MAX_ITEMS = 120;    // teacher's request (1/8/2026): raised from Wordwall's 100 to 120 boxes

export function openOtbEditor(container, activity, { onSave, onCancel, header, footer } = {}) {
  const isNew = !(activity && activity.id);
  const data = normalize(activity);

  container.innerHTML = "";
  const page = el("div", "aw-ed");
  if (header) page.append(header);

  // ---- Sticky action bar: act-type badge + heading  |  Cancel / Save ----
  const head = el("div", "aw-ed-head");
  const headL = el("div", "aw-ed-headleft");
  headL.append(el("span", "aw-ed-typebadge", "OPEN THE BOX"));
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
  titleInput.placeholder = "e.g. Speaking prompts";
  titleInput.oninput = () => { data.title = titleInput.value; clearError(); };
  meta.append(field("Activity Title", titleInput));
  body.append(meta);

  // ===== BOXES =====
  body.append(el("div", "aw-ed-sectionhead", "Boxes"));
  body.append(buildBulkBar());
  const qWrap = el("div", "aw-ed-questions");
  body.append(qWrap);
  renderItems();

  if (footer) page.append(footer);

  container.append(page);
  titleInput.focus();

  // ---------- box list rendering ----------
  function renderItems() {
    qWrap.innerHTML = "";
    data.content.items.forEach((it, ii) => qWrap.append(itemCard(it, ii)));
    const addQ = el("button", "aw-ed-addq", "+ Add box");
    addQ.type = "button";
    addQ.disabled = data.content.items.length >= MAX_ITEMS;
    addQ.onclick = () => {
      if (data.content.items.length < MAX_ITEMS) { data.content.items.push(blankItem()); renderItems(); }
    };
    qWrap.append(addQ);
    const count = el("div", "aw-ed-qcount", `${data.content.items.length} / ${MAX_ITEMS} boxes`);
    qWrap.append(count);
  }

  // Paste a copied Excel RANGE into a box. The first column of each pasted
  // row becomes the question; the remaining columns become its answers (in
  // order). It fills from THIS box downward. No answer is pre-marked
  // correct — the teacher marks them (or uses "Mark correct in all").
  function onItemPaste(e, ii) {
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

    // fill from this box down (keep boxes before it), cap at the max
    let next = data.content.items.slice(0, ii).concat(parsed);
    let dropped = 0;
    if (next.length > MAX_ITEMS) { dropped = next.length - MAX_ITEMS; next = next.slice(0, MAX_ITEMS); }
    data.content.items = next;
    renderItems();
    const filled = parsed.length - dropped;
    showInfo(`Pasted ${filled} box(es) from Excel${dropped ? ` (${dropped} skipped — ${MAX_ITEMS} max)` : ""}. `
      + "Now mark the correct answer in each box, or use “Mark correct in all”.");
  }

  function itemCard(it, ii) {
    const card = el("div", "aw-ed-qcard");

    const top = el("div", "aw-ed-qtop");
    top.append(el("span", "aw-ed-qnum", `Box ${ii + 1}`));
    const topActions = el("div", "aw-ed-qactions");
    const dupQ = el("button", "aw-ed-del aw-ed-dup", "Duplicate");
    dupQ.type = "button";
    dupQ.disabled = data.content.items.length >= MAX_ITEMS;
    dupQ.onclick = () => {
      if (data.content.items.length >= MAX_ITEMS) return;
      const copy = JSON.parse(JSON.stringify(it));
      data.content.items.splice(ii + 1, 0, copy);
      renderItems();
    };
    const delQ = el("button", "aw-ed-del", "Remove");
    delQ.type = "button";
    delQ.disabled = data.content.items.length <= MIN_ITEMS;
    delQ.title = delQ.disabled ? `At least ${MIN_ITEMS} boxes are required` : "";
    delQ.onclick = () => { data.content.items.splice(ii, 1); renderItems(); };
    topActions.append(dupQ, delQ);
    top.append(topActions);
    card.append(top);

    const qInput = el("input", "aw-ed-input aw-ed-qtext");
    qInput.value = it.question;
    qInput.placeholder = "Type the question…";
    qInput.oninput = () => { it.question = qInput.value; clearError(); };
    qInput.addEventListener("paste", e => onItemPaste(e, ii));
    card.append(qInput);

    const hint = el("div", "aw-ed-ahint", "Tick the circle to mark the correct answer.");
    card.append(hint);

    // answers laid out two per row (A B / C D / E F)
    const ansWrap = el("div", "aw-ed-answers");
    it.answers.forEach((ans, ai) => ansWrap.append(answerRow(it, ans, ai, ii)));
    card.append(ansWrap);

    const addA = el("button", "aw-ed-adda", "+ Add answer");
    addA.type = "button";
    addA.disabled = it.answers.length >= MAX_ANSWERS;
    addA.onclick = () => {
      if (it.answers.length < MAX_ANSWERS) { it.answers.push({ text: "", correct: false }); renderItems(); }
    };
    card.append(addA);
    return card;
  }

  function answerRow(it, ans, ai, ii) {
    const row = el("div", "aw-ed-arow" + (ans.correct ? " is-correct" : ""));

    const radio = el("input");
    radio.type = "radio";
    radio.name = `aw-ed-correct-${ii}`;
    radio.checked = ans.correct;
    radio.title = "Mark as the correct answer";
    radio.onchange = () => { it.answers.forEach((x, k) => x.correct = (k === ai)); renderItems(); };

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
    del.disabled = it.answers.length <= MIN_ANSWERS;
    del.onclick = () => {
      it.answers.splice(ai, 1);
      if (!it.answers.some(a => a.correct)) it.answers[0].correct = true;
      renderItems();
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
    clean.content.items.forEach(it => {
      it.question = it.question.trim();
      it.answers = it.answers.filter(a => a.text.trim() !== "").map(a => ({ text: a.text.trim(), correct: !!a.correct }));
    });
    // Silently drop boxes that were added but left completely empty (no
    // question text AND no answers) — e.g. a stray "+ Add box".
    clean.content.items = clean.content.items.filter(it => !(it.question === "" && it.answers.length === 0));

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

  // ---------- bulk actions bar (above the box list) ----------
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
      // teacher's request (1/8/2026): confirm this bulk change — it overwrites
      // the correct answer in EVERY box at once.
      if (!confirm(`Mark answer ${letter} as the correct answer in ALL boxes? This overwrites the current correct answer in every box.`)) return;
      let skipped = 0;
      data.content.items.forEach(it => {
        if (ai < it.answers.length) it.answers.forEach((a, k) => a.correct = (k === ai));
        else skipped++;
      });
      renderItems();
      showInfo(skipped
        ? `Answer ${letter} marked correct where it exists — ${skipped} box(es) with fewer answers were left unchanged.`
        : `Answer ${letter} is now the correct answer in every box.`);
    };
    markWrap.append(el("span", "aw-ed-bulklabel", "Answer"), letterSel, markBtn);

    const unmarkBtn = el("button", "aw-btn", "Unmark all correct");
    unmarkBtn.type = "button";
    unmarkBtn.onclick = () => {
      // teacher's request (1/8/2026): confirm — this clears the correct mark
      // in every box, so all of them must be re-ticked before saving.
      if (!confirm("Remove the correct-answer mark from ALL boxes? You'll need to tick the correct answer in each box again before saving.")) return;
      data.content.items.forEach(it => it.answers.forEach(a => a.correct = false));
      renderItems();
      showInfo("All correct marks removed — tick the circle in each box before saving.");
    };

    const clearBtn = el("button", "aw-btn aw-ed-bulkdanger", "Delete all boxes");
    clearBtn.type = "button";
    clearBtn.onclick = () => {
      if (!confirm("Delete ALL boxes and answers?")) return;
      data.content.items = [blankItem(), blankItem()];
      renderItems();
      showInfo("All boxes deleted.");
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
  a.type = "open_the_box";
  a.schemaVersion = a.schemaVersion || 1;
  a.title = a.title || "";
  a.instruction = a.instruction || "";
  a.theme = "classic";                 // theme is always Classic now
  a.options = a.options || {};
  a.content = a.content || {};
  let items = Array.isArray(a.content.items) ? a.content.items : [];
  if (items.length < MIN_ITEMS) {
    while (items.length < MIN_ITEMS) items.push(blankItem());
  }
  a.content.items = items.map(it => {
    let answers = (Array.isArray(it.answers) && it.answers.length ? it.answers : blankAnswers())
      .map(ans => ({ text: ans.text || "", correct: !!ans.correct }));
    if (!answers.some(a => a.correct)) answers[0].correct = true;   // always exactly-one default
    return { question: it.question || "", answers };
  });
  return a;
}
function blankItem() { return { question: "", answers: blankAnswers() }; }
function blankAnswers() { return [{ text: "", correct: true }, { text: "", correct: false }]; }

function validate(d) {
  if (!d.title) return "Please enter an activity title.";
  if (d.content.items.length < MIN_ITEMS) return `Add at least ${MIN_ITEMS} boxes.`;
  for (let i = 0; i < d.content.items.length; i++) {
    const it = d.content.items[i];
    if (!it.question) return `Box ${i + 1} has no question text.`;
    if (it.answers.length < MIN_ANSWERS) return `Box ${i + 1} needs at least ${MIN_ANSWERS} answers.`;
    if (!it.answers.some(a => a.correct)) return `Box ${i + 1}: mark the correct answer.`;
  }
  return null;
}
