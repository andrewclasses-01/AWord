// =============================================================
// ANAGRAM EDITOR — the form a teacher uses to create or edit an Anagram
// activity. Same contract as templates/quiz/quiz-editor.js:
//   openAnagramEditor(container, activity, { onSave, onCancel, header, footer })
// Reuses the SHARED editor page chrome from core/app.css (.aw-ed-* header/
// title field/tip/bulk bar/count). The per-row layout (Word | Clue table,
// icon buttons, drag-to-reorder) is Anagram-specific CSS in anagram.css
// (.aw-anagram-ed-*), styled after Wordwall's real "Edit Content" table.
//
// SCOPE (same simplification as Quiz, per Teacher Andrew): this page edits
// ONLY the title + the word list (word + optional clue). Theme is always
// Classic; default options (timer/mode/allCaps/...) live in Settings;
// per-act options are tweaked from the in-game Options panel. The mic/image
// buttons are placeholders for now (teacher said "we'll discuss them
// later") — they just show an info banner, no upload wired up yet.
//
// Row reordering uses the SAME native HTML5 drag-and-drop idiom as
// main.js's folder/act drag-drop (draggable + dragstart/dragover/drop), so
// it stays consistent with the rest of the app instead of inventing a new
// pattern. Only the drag-HANDLE icon is draggable (not the whole row) so
// clicking/selecting text in the Word/Clue inputs is unaffected.
// =============================================================

import { el } from "../../core/utils.js";
import { icons } from "../../core/icons.js";

const MAX_ITEMS = 100;

export function openAnagramEditor(container, activity, { onSave, onCancel, header, footer } = {}) {
  const isNew = !(activity && activity.id);
  const data = normalize(activity);
  let draggingIndex = null;   // module-scoped to this editor instance's drag session

  container.innerHTML = "";
  const page = el("div", "aw-ed");
  if (header) page.append(header);

  // ---- Sticky action bar: act-type badge + heading  |  Cancel / Save ----
  const head = el("div", "aw-ed-head");
  const headL = el("div", "aw-ed-headleft");
  headL.append(el("span", "aw-ed-typebadge", "ANAGRAM"));
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
  titleInput.placeholder = "e.g. Animals — Unscramble";
  titleInput.oninput = () => { data.title = titleInput.value; clearError(); };
  meta.append(field("Activity Title", titleInput));
  body.append(meta);

  // ===== WORDS =====
  body.append(el("div", "aw-ed-sectionhead", "Words"));
  body.append(buildBulkBar());
  body.append(el("div", "aw-ed-tip",
    "Tip: in Excel, copy a block of cells (Word in the first column, an optional Clue in the second), " +
    "then click a Word or Clue box and paste (Ctrl+V) to fill the whole list at once. Leave a clue blank " +
    'to show the generic "Unscramble the word" prompt. Drag the ⇕ handle to reorder.'));

  const headRow = el("div", "aw-anagram-ed-headrow");
  const headCols = el("div", "aw-anagram-ed-headcols");
  headCols.append(el("span", "aw-anagram-ed-headcol", "Word"), el("span", "aw-anagram-ed-headcol", "Clue"));
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

  // ---------- word-list rendering ----------
  function renderItems() {
    iWrap.innerHTML = "";
    data.content.items.forEach((it, ii) => iWrap.append(itemRow(it, ii)));
    const addI = el("button", "aw-anagram-ed-addrow", null);
    addI.type = "button";
    addI.innerHTML = "+ Add a new word";
    addI.disabled = data.content.items.length >= MAX_ITEMS;
    addI.onclick = () => {
      if (data.content.items.length < MAX_ITEMS) { data.content.items.push(blankItem()); renderItems(); }
    };
    iWrap.append(addI);
    const count = el("div", "aw-ed-qcount", `${data.content.items.length} / ${MAX_ITEMS} words`);
    iWrap.append(count);
  }

  // Paste a copied Excel RANGE: first column -> word, second column
  // (optional) -> clue. Works from EITHER the Word or the Clue box (a
  // teacher pasting a 2-column range doesn't need to remember which box to
  // click). Fills from THIS row downward, same convention as Quiz's paste.
  function onRowPaste(e, ii) {
    const text = (e.clipboardData || window.clipboardData)?.getData("text/plain") || "";
    if (!/[\t\n]/.test(text)) return;    // a single cell -> let the normal paste happen
    e.preventDefault();

    const rows = text.replace(/\r/g, "").split("\n");
    while (rows.length && rows[rows.length - 1].trim() === "") rows.pop();   // drop trailing blank line

    const parsed = [];
    rows.forEach(line => {
      const cells = line.split("\t").map(c => c.trim());
      const word = cells[0] || "";
      const clue = cells[1] || "";
      if (word === "" && clue === "") return;   // skip blank rows
      parsed.push({ word, clue });
    });
    if (!parsed.length) return;

    // fill from this word down (keep words before it), cap at the max
    let next = data.content.items.slice(0, ii).concat(parsed);
    let dropped = 0;
    if (next.length > MAX_ITEMS) { dropped = next.length - MAX_ITEMS; next = next.slice(0, MAX_ITEMS); }
    data.content.items = next;
    renderItems();
    const filled = parsed.length - dropped;
    showInfo(`Pasted ${filled} word(s) from Excel${dropped ? ` (${dropped} skipped — ${MAX_ITEMS} max)` : ""}.`);
  }

  function itemRow(it, ii) {
    const row = el("div", "aw-anagram-ed-row");

    row.append(el("div", "aw-anagram-ed-num", String(ii + 1) + "."));

    const box = el("div", "aw-anagram-ed-box");
    const wordInput = el("input", "aw-anagram-ed-word");
    wordInput.value = it.word;
    wordInput.placeholder = "Word or phrase to unscramble";
    wordInput.oninput = () => { it.word = wordInput.value; clearError(); };
    wordInput.addEventListener("paste", e => onRowPaste(e, ii));
    const clueInput = el("input", "aw-anagram-ed-clue");
    clueInput.value = it.clue;
    clueInput.placeholder = "Optional clue / definition";
    clueInput.oninput = () => { it.clue = clueInput.value; clearError(); };
    clueInput.addEventListener("paste", e => onRowPaste(e, ii));
    box.append(wordInput, clueInput);
    row.append(box);

    const iconsWrap = el("div", "aw-anagram-ed-icons");
    const micBtn = iconBtn(icons.mic, "Add voice (coming soon)");
    micBtn.onclick = () => showInfo("Voice recordings — coming soon.");
    const imgBtn = iconBtn(icons.image, "Add image (coming soon)");
    imgBtn.onclick = () => showInfo("Images — coming soon.");
    iconsWrap.append(micBtn, imgBtn, el("span", "aw-anagram-ed-gap"));

    const dragBtn = iconBtn(icons.dragHandle, "Drag to reorder", "is-drag");
    const dupBtn = iconBtn(icons.duplicate, "Duplicate");
    dupBtn.disabled = data.content.items.length >= MAX_ITEMS;
    dupBtn.onclick = () => {
      if (data.content.items.length >= MAX_ITEMS) return;
      const copy = JSON.parse(JSON.stringify(it));
      data.content.items.splice(ii + 1, 0, copy);
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
    const b = el("button", "aw-anagram-ed-iconbtn" + (extraClass ? " " + extraClass : ""), svg);
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
      iWrap.querySelectorAll(".aw-anagram-ed-row").forEach(r => r.classList.remove("is-dropbefore", "is-dropafter"));
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
      if (to === from || to === from + 1) return;   // dropped on itself / right after itself -> no-op
      const [item] = data.content.items.splice(from, 1);
      data.content.items.splice(to > from ? to - 1 : to, 0, item);
      renderItems();
    });
  }

  // ---------- save / cancel ----------
  cancelBtn.onclick = () => onCancel?.();

  saveBtn.onclick = async () => {
    // validate on a CLEANED copy (drop fully-blank rows) so the live model
    // the teacher is editing is never mutated by a failed save attempt.
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

  function showError(msg) {
    errBar.classList.remove("is-info");
    errBar.textContent = msg;
    errBar.style.display = "block";
    body.scrollTop = 0;
  }
  // Same banner, green — used for bulk-action / info feedback (not a problem, just news).
  function showInfo(msg) {
    errBar.classList.add("is-info");
    errBar.textContent = msg;
    errBar.style.display = "block";
    body.scrollTop = 0;
  }
  function clearError() {
    if (errBar.style.display !== "none") errBar.style.display = "none";
  }

  // ---------- bulk actions bar (above the word table) ----------
  function buildBulkBar() {
    const bar = el("div", "aw-ed-bulk");
    const clearBtn = el("button", "aw-btn aw-ed-bulkdanger", "Delete all words");
    clearBtn.type = "button";
    clearBtn.onclick = () => {
      if (!confirm("Delete ALL words?")) return;
      data.content.items = [blankItem()];
      renderItems();
      showInfo("All words deleted.");
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
  a.type = "anagram";
  a.schemaVersion = a.schemaVersion || 1;
  a.title = a.title || "";
  a.instruction = a.instruction || "";
  a.theme = "classic";                 // theme is always Classic now
  a.options = a.options || {};
  a.content = a.content || {};
  let items = Array.isArray(a.content.items) ? a.content.items : [];
  if (items.length === 0) items = [blankItem()];
  a.content.items = items.map(it => ({ word: it.word || "", clue: it.clue || "" }));
  return a;
}
function blankItem() { return { word: "", clue: "" }; }

function validate(d) {
  if (!d.title) return "Please enter an activity title.";
  if (!d.content.items.length) return "Add at least one word.";
  return null;
}
