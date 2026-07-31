// =============================================================
// FLYING FRUIT EDITOR — the form a teacher uses to create or edit a Flying
// Fruit activity. Same contract as templates/anagram/anagram-editor.js:
//   openFlyingFruitEditor(container, activity, { onSave, onCancel, header, footer })
//
// Teacher Andrew's call: Flying Fruit is edited EXACTLY like Anagram — a simple
// list of (Word + Clue). The WORD is the correct answer that rides the right
// fruit; the CLUE is the question shown at the top. The wrong fruits carry
// RANDOM words taken from the OTHER rows, so the teacher never types
// distractors — every other answer in the list becomes a possible distractor.
//
// Reuses the SHARED editor chrome from core/app.css (.aw-ed-*). The per-row
// table (Word | Clue, icon buttons, drag-to-reorder, Excel paste) is
// flying-fruit CSS in flying-fruit.css (.aw-ff-ed-*), styled after Wordwall's
// real "Edit Content". Mic/image buttons are placeholders for now (teacher
// said "we'll discuss them later").
// =============================================================

import { el } from "../../core/utils.js";
import { icons } from "../../core/icons.js";

const MAX_ITEMS = 120;

export function openFlyingFruitEditor(container, activity, { onSave, onCancel, header, footer } = {}) {
  const isNew = !(activity && activity.id);
  const data = normalize(activity);
  let draggingIndex = null;

  container.innerHTML = "";
  const page = el("div", "aw-ed");
  if (header) page.append(header);

  // ---- Sticky action bar ----
  const head = el("div", "aw-ed-head");
  const headL = el("div", "aw-ed-headleft");
  headL.append(el("span", "aw-ed-typebadge", "FLYING FRUIT"));
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

  // ===== META: title only (theme = Classic, options in Settings) =====
  const meta = el("div", "aw-ed-meta");
  const titleInput = el("input", "aw-ed-input");
  titleInput.value = data.title;
  titleInput.placeholder = "e.g. Unit 3 vocabulary — Flying fruit";
  titleInput.oninput = () => { data.title = titleInput.value; clearError(); };
  meta.append(field("Activity Title", titleInput));
  body.append(meta);

  // ===== ANSWERS =====
  body.append(el("div", "aw-ed-sectionhead", "Answers"));
  body.append(buildBulkBar());
  body.append(el("div", "aw-ed-tip",
    "Each row is one answer: the WORD flies on a fruit and the CLUE is the question shown at the top. " +
    "The wrong fruits are filled in automatically with random words from the other rows, so you don't type " +
    "distractors. Tip: in Excel, copy a block (Word in the first column, Clue in the second), then click a " +
    "box and paste (Ctrl+V) to fill the whole list. Drag the ⇕ handle to reorder."));

  const headRow = el("div", "aw-ff-ed-headrow");
  const headCols = el("div", "aw-ff-ed-headcols");
  headCols.append(el("span", "aw-ff-ed-headcol", "Word (answer)"), el("span", "aw-ff-ed-headcol", "Clue (question)"));
  const swapBtn = el("button", "aw-btn", "Swap Columns");
  swapBtn.type = "button";
  swapBtn.title = "Swap the Word and Clue value in every row (fixes a list pasted in the wrong order)";
  swapBtn.onclick = () => {
    data.content.items.forEach(it => { const tmp = it.word; it.word = it.clue; it.clue = tmp; });
    renderItems();
    showInfo("Word and Clue swapped in every row.");
  };
  headRow.append(headCols, swapBtn);
  body.append(headRow);

  const iWrap = el("div", "aw-ed-questions");
  body.append(iWrap);
  renderItems();

  if (footer) page.append(footer);

  container.append(page);
  titleInput.focus();

  // ---------- list rendering ----------
  function renderItems() {
    iWrap.innerHTML = "";
    data.content.items.forEach((it, ii) => iWrap.append(itemRow(it, ii)));
    const addI = el("button", "aw-ff-ed-addrow", null);
    addI.type = "button";
    addI.innerHTML = "+ Add a new answer";
    addI.disabled = data.content.items.length >= MAX_ITEMS;
    addI.onclick = () => {
      if (data.content.items.length < MAX_ITEMS) { data.content.items.push(blankItem()); renderItems(); }
    };
    iWrap.append(addI);
    iWrap.append(el("div", "aw-ed-qcount", `${data.content.items.length} / ${MAX_ITEMS} answers`));
  }

  // Paste a copied Excel RANGE: first column -> word, second column -> clue.
  function onRowPaste(e, ii) {
    const text = (e.clipboardData || window.clipboardData)?.getData("text/plain") || "";
    if (!/[\t\n]/.test(text)) return;   // single cell -> normal paste
    e.preventDefault();

    const rows = text.replace(/\r/g, "").split("\n");
    while (rows.length && rows[rows.length - 1].trim() === "") rows.pop();

    const parsed = [];
    rows.forEach(line => {
      const cells = line.split("\t").map(c => c.trim());
      const word = cells[0] || "";
      const clue = cells[1] || "";
      if (word === "" && clue === "") return;
      parsed.push({ word, clue });
    });
    if (!parsed.length) return;

    let next = data.content.items.slice(0, ii).concat(parsed);
    let dropped = 0;
    if (next.length > MAX_ITEMS) { dropped = next.length - MAX_ITEMS; next = next.slice(0, MAX_ITEMS); }
    data.content.items = next;
    renderItems();
    const filled = parsed.length - dropped;
    showInfo(`Pasted ${filled} answer(s) from Excel${dropped ? ` (${dropped} skipped — ${MAX_ITEMS} max)` : ""}.`);
  }

  function itemRow(it, ii) {
    const row = el("div", "aw-ff-ed-row");
    row.append(el("div", "aw-ff-ed-num", String(ii + 1) + "."));

    const box = el("div", "aw-ff-ed-box");
    const wordInput = el("input", "aw-ff-ed-word");
    wordInput.value = it.word;
    wordInput.placeholder = "Answer word";
    wordInput.oninput = () => { it.word = wordInput.value; clearError(); };
    wordInput.addEventListener("paste", e => onRowPaste(e, ii));
    const clueInput = el("input", "aw-ff-ed-clue");
    clueInput.value = it.clue;
    clueInput.placeholder = "Question / definition shown at the top";
    clueInput.oninput = () => { it.clue = clueInput.value; clearError(); };
    clueInput.addEventListener("paste", e => onRowPaste(e, ii));
    box.append(wordInput, clueInput);
    row.append(box);

    const iconsWrap = el("div", "aw-ff-ed-icons");
    const micBtn = iconBtn(icons.mic, "Add voice (coming soon)");
    micBtn.onclick = () => showInfo("Voice recordings — coming soon.");
    const imgBtn = iconBtn(icons.image, "Add image (coming soon)");
    imgBtn.onclick = () => showInfo("Images — coming soon.");
    iconsWrap.append(micBtn, imgBtn, el("span", "aw-ff-ed-gap"));

    const dragBtn = iconBtn(icons.dragHandle, "Drag to reorder", "is-drag");
    const dupBtn = iconBtn(icons.duplicate, "Duplicate");
    dupBtn.disabled = data.content.items.length >= MAX_ITEMS;
    dupBtn.onclick = () => {
      if (data.content.items.length >= MAX_ITEMS) return;
      data.content.items.splice(ii + 1, 0, JSON.parse(JSON.stringify(it)));
      renderItems();
    };
    const delBtn = iconBtn(icons.trash, "Remove", "is-danger");
    delBtn.disabled = data.content.items.length <= 1;
    delBtn.onclick = () => { data.content.items.splice(ii, 1); renderItems(); };
    iconsWrap.append(dragBtn, dupBtn, delBtn);
    row.append(iconsWrap);

    wireRowDrag(dragBtn, row, () => data.content.items.indexOf(it));
    wireRowDropTarget(row, () => data.content.items.indexOf(it));
    return row;
  }

  function iconBtn(svg, title, extraClass) {
    const b = el("button", "aw-ff-ed-iconbtn" + (extraClass ? " " + extraClass : ""), svg);
    b.type = "button";
    b.title = title;
    b.setAttribute("aria-label", title);
    return b;
  }

  // ---------- drag-to-reorder (native HTML5 DnD, same idiom as main.js) ----------
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
      iWrap.querySelectorAll(".aw-ff-ed-row").forEach(r => r.classList.remove("is-dropbefore", "is-dropafter"));
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
      const [item] = data.content.items.splice(from, 1);
      data.content.items.splice(to > from ? to - 1 : to, 0, item);
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
    clean.content.items = clean.content.items
      .map(it => ({ word: (it.word || "").trim(), clue: (it.clue || "").trim() }))
      .filter(it => it.word !== "");

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

  function showError(msg) { errBar.classList.remove("is-info"); errBar.textContent = msg; errBar.style.display = "block"; body.scrollTop = 0; }
  function showInfo(msg) { errBar.classList.add("is-info"); errBar.textContent = msg; errBar.style.display = "block"; body.scrollTop = 0; }
  function clearError() { if (errBar.style.display !== "none") errBar.style.display = "none"; }

  function buildBulkBar() {
    const bar = el("div", "aw-ed-bulk");
    const clearBtn = el("button", "aw-btn aw-ed-bulkdanger", "Delete all answers");
    clearBtn.type = "button";
    clearBtn.onclick = () => {
      if (!confirm("Delete ALL answers?")) return;
      data.content.items = [blankItem()];
      renderItems();
      showInfo("All answers deleted.");
    };
    bar.append(clearBtn);
    return bar;
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
  a.type = "flying_fruit";
  a.schemaVersion = a.schemaVersion || 1;
  a.title = a.title || "";
  a.instruction = a.instruction || "";
  a.theme = "classic";
  a.options = a.options || {};
  a.content = a.content || {};
  let items = Array.isArray(a.content.items) ? a.content.items : [];
  if (items.length === 0) items = [blankItem(), blankItem()];
  a.content.items = items.map(it => ({ word: it.word || "", clue: it.clue || "" }));
  return a;
}
function blankItem() { return { word: "", clue: "" }; }

function validate(d) {
  if (!d.title) return "Please enter an activity title.";
  if (d.content.items.length < 2) return "Add at least two answers (the wrong fruits are picked from the other answers).";
  return null;
}
