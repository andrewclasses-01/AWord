// =============================================================
// TRUE FALSE EDITOR — the form a teacher uses to create or edit a True/false
// activity. Same contract as templates/quiz/quiz-editor.js:
//   openTfEditor(container, activity, { onSave, onCancel, header, footer })
// Reuses the SHARED editor page chrome from core/app.css (.aw-ed-* header/
// title field/tip/bulk bar/count). The per-row layout (Statement | True/False
// table, icon buttons, drag-to-reorder) is True-false-specific CSS in
// true-false.css (.aw-tf-ed-*), a close copy of Find the match's Keyword|
// Definition table — but the second column is a True/False pill toggle
// instead of a text field.
//
// SCOPE (same simplification as the other templates, per Teacher Andrew):
// this page edits ONLY the title + the statement list. Theme is always
// Classic; default options (speed/lives/repeat/...) live in Settings; per-act
// options are tweaked from the in-game Options panel. Limit: max 40
// statements (min 3 kept so a game is worth playing).
// =============================================================

import { el } from "../../core/utils.js";
import { icons } from "../../core/icons.js";

const MIN_ITEMS = 3;
const MAX_ITEMS = 40;

// How a pasted Excel cell in the answer column is read as True/False.
function parseAnswer(cell) {
  const t = String(cell || "").trim().toLowerCase();
  if (["true", "t", "1", "yes", "y", "correct", "right", "đúng", "dung"].includes(t)) return true;
  if (["false", "f", "0", "no", "n", "wrong", "incorrect", "sai"].includes(t)) return false;
  return null;   // unrecognised -> leave as-is (default True)
}

export function openTfEditor(container, activity, { onSave, onCancel, header, footer } = {}) {
  const isNew = !(activity && activity.id);
  const data = normalize(activity);
  let draggingIndex = null;

  container.innerHTML = "";
  const page = el("div", "aw-ed");
  if (header) page.append(header);

  // ---- Sticky action bar: act-type badge + heading  |  Cancel / Save ----
  const head = el("div", "aw-ed-head");
  const headL = el("div", "aw-ed-headleft");
  headL.append(el("span", "aw-ed-typebadge", "TRUE OR FALSE"));
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

  // ===== META: activity title only =====
  const meta = el("div", "aw-ed-meta");
  const titleInput = el("input", "aw-ed-input");
  titleInput.value = data.title;
  titleInput.placeholder = "e.g. Plant life cycle — True or false";
  titleInput.oninput = () => { data.title = titleInput.value; clearError(); };
  meta.append(field("Activity Title", titleInput));
  body.append(meta);

  // ===== STATEMENTS =====
  body.append(el("div", "aw-ed-sectionhead", "Statements"));
  body.append(buildBulkBar());
  body.append(el("div", "aw-ed-tip",
    "Write a statement, then mark whether it is True or False. " +
    "Tip: in Excel, copy a block of cells (the Statement in the first column, and True or False in the second), " +
    "then click a Statement box and paste (Ctrl+V) to fill the whole list at once. Drag the ⇕ handle to reorder."));

  const headRow = el("div", "aw-tf-ed-headrow");
  const headCols = el("div", "aw-tf-ed-headcols");
  headCols.append(
    el("span", "aw-tf-ed-headcol is-statement", "Statement"),
    el("span", "aw-tf-ed-headcol is-answer", "Answer")
  );
  headRow.append(headCols);
  body.append(headRow);

  const iWrap = el("div", "aw-ed-questions");
  body.append(iWrap);
  renderItems();

  if (footer) page.append(footer);

  container.append(page);
  titleInput.focus();

  // ---------- statement-list rendering ----------
  function renderItems() {
    iWrap.innerHTML = "";
    data.content.statements.forEach((it, ii) => iWrap.append(itemRow(it, ii)));
    const addI = el("button", "aw-tf-ed-addrow", "+ Add a new statement");
    addI.type = "button";
    addI.disabled = data.content.statements.length >= MAX_ITEMS;
    addI.onclick = () => {
      if (data.content.statements.length < MAX_ITEMS) { data.content.statements.push(blankItem()); renderItems(); }
    };
    iWrap.append(addI);
    const count = el("div", "aw-ed-qcount", `${data.content.statements.length} / ${MAX_ITEMS} statements`);
    iWrap.append(count);
  }

  // Paste a copied Excel RANGE: first column -> statement text, second column
  // -> True/False. Fills from THIS row downward, same convention as the other
  // editors' paste.
  function onRowPaste(e, ii) {
    const text = (e.clipboardData || window.clipboardData)?.getData("text/plain") || "";
    if (!/[\t\n]/.test(text)) return;    // a single cell -> let the normal paste happen
    e.preventDefault();

    const rows = text.replace(/\r/g, "").split("\n");
    while (rows.length && rows[rows.length - 1].trim() === "") rows.pop();

    const parsed = [];
    rows.forEach(line => {
      const cells = line.split("\t").map(c => c.trim());
      const textCell = cells[0] || "";
      if (textCell === "") return;
      const ans = parseAnswer(cells[1]);
      parsed.push({ text: textCell, answer: ans == null ? true : ans });
    });
    if (!parsed.length) return;

    let next = data.content.statements.slice(0, ii).concat(parsed);
    let dropped = 0;
    if (next.length > MAX_ITEMS) { dropped = next.length - MAX_ITEMS; next = next.slice(0, MAX_ITEMS); }
    data.content.statements = next;
    renderItems();
    const filled = parsed.length - dropped;
    showInfo(`Pasted ${filled} statement(s) from Excel${dropped ? ` (${dropped} skipped — ${MAX_ITEMS} max)` : ""}.`);
  }

  function itemRow(it, ii) {
    const row = el("div", "aw-tf-ed-row");

    row.append(el("div", "aw-tf-ed-num", String(ii + 1) + "."));

    const box = el("div", "aw-tf-ed-box");
    const stInput = el("input", "aw-tf-ed-statement");
    stInput.value = it.text;
    stInput.placeholder = "Type a statement";
    stInput.oninput = () => { it.text = stInput.value; clearError(); };
    stInput.addEventListener("paste", e => onRowPaste(e, ii));
    box.append(stInput);

    // True / False pill toggle
    const ans = el("div", "aw-tf-ed-answer");
    const segTrue = el("button", "aw-tf-ed-seg is-true", "True");
    const segFalse = el("button", "aw-tf-ed-seg is-false", "False");
    segTrue.type = "button"; segFalse.type = "button";
    const paint = () => {
      segTrue.classList.toggle("is-on", it.answer === true);
      segFalse.classList.toggle("is-on", it.answer === false);
    };
    segTrue.onclick = () => { it.answer = true; paint(); clearError(); };
    segFalse.onclick = () => { it.answer = false; paint(); clearError(); };
    paint();
    ans.append(segTrue, segFalse);
    box.append(ans);
    row.append(box);

    const iconsWrap = el("div", "aw-tf-ed-icons");
    const dragBtn = iconBtn(icons.dragHandle, "Drag to reorder", "is-drag");
    const dupBtn = iconBtn(icons.duplicate, "Duplicate");
    dupBtn.disabled = data.content.statements.length >= MAX_ITEMS;
    dupBtn.onclick = () => {
      if (data.content.statements.length >= MAX_ITEMS) return;
      const copy = JSON.parse(JSON.stringify(it));
      data.content.statements.splice(ii + 1, 0, copy);
      renderItems();
    };
    const delBtn = iconBtn(icons.trash, "Remove", "is-danger");
    delBtn.disabled = data.content.statements.length <= 1;
    delBtn.onclick = () => { data.content.statements.splice(ii, 1); renderItems(); };
    iconsWrap.append(dragBtn, dupBtn, delBtn);
    row.append(iconsWrap);

    wireRowDrag(dragBtn, row, () => data.content.statements.indexOf(it));
    wireRowDropTarget(row, () => data.content.statements.indexOf(it));

    return row;
  }

  function iconBtn(svg, title, extraClass) {
    const b = el("button", "aw-tf-ed-iconbtn" + (extraClass ? " " + extraClass : ""), svg);
    b.type = "button";
    b.title = title;
    b.setAttribute("aria-label", title);
    return b;
  }

  // ---------- drag-to-reorder (native HTML5 DnD, same idiom as Find the match) ----------
  function wireRowDrag(handle, row, getIndex) {
    handle.draggable = true;
    handle.addEventListener("dragstart", e => {
      draggingIndex = getIndex();
      e.dataTransfer.effectAllowed = "move";
      try { e.dataTransfer.setData("text/plain", String(draggingIndex)); } catch { /* ignore */ }
      try { e.dataTransfer.setDragImage(row, 24, 24); } catch { /* ignore */ }
      row.classList.add("is-dragging");
    });
    handle.addEventListener("dragend", () => {
      draggingIndex = null;
      row.classList.remove("is-dragging");
      iWrap.querySelectorAll(".aw-tf-ed-row").forEach(r => r.classList.remove("is-dropbefore", "is-dropafter"));
    });
  }
  function wireRowDropTarget(row, getIndex) {
    row.addEventListener("dragover", e => {
      if (draggingIndex == null) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
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
      const from = draggingIndex;
      draggingIndex = null;
      if (from == null) return;
      let to = getIndex() + (before ? 0 : 1);
      if (to === from || to === from + 1) return;
      const [item] = data.content.statements.splice(from, 1);
      data.content.statements.splice(to > from ? to - 1 : to, 0, item);
      renderItems();
    });
  }

  // ---------- save / cancel ----------
  cancelBtn.onclick = () => onCancel?.();

  saveBtn.onclick = async () => {
    const clean = JSON.parse(JSON.stringify(data));
    clean.title = clean.title.trim();
    clean.instruction = (clean.instruction || "").trim();
    clean.theme = "classic";
    clean.content.statements = clean.content.statements
      .map(it => ({ text: (it.text || "").trim(), answer: it.answer === true }))
      .filter(it => it.text !== "");

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
    const clearBtn = el("button", "aw-btn aw-ed-bulkdanger", "Delete all statements");
    clearBtn.type = "button";
    clearBtn.onclick = () => {
      if (!confirm("Delete ALL statements?")) return;
      data.content.statements = [blankItem(), blankItem(), blankItem()];
      renderItems();
      showInfo("All statements deleted.");
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
  a.type = "true_false";
  a.schemaVersion = a.schemaVersion || 1;
  a.title = a.title || "";
  a.instruction = a.instruction || "";
  a.theme = "classic";
  a.options = a.options || {};
  a.content = a.content || {};
  let statements = Array.isArray(a.content.statements) ? a.content.statements : [];
  if (statements.length < MIN_ITEMS) {
    while (statements.length < MIN_ITEMS) statements.push(blankItem());
  }
  a.content.statements = statements.map(it => ({ text: it.text || "", answer: it.answer === true }));
  return a;
}
function blankItem() { return { text: "", answer: true }; }

function validate(d) {
  if (!d.title) return "Please enter an activity title.";
  if (d.content.statements.length < MIN_ITEMS) return `Add at least ${MIN_ITEMS} statements.`;
  for (let i = 0; i < d.content.statements.length; i++) {
    if (!d.content.statements[i].text) return `Statement ${i + 1} is empty.`;
  }
  return null;
}
