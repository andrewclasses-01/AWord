// =============================================================
// UNJUMBLE EDITOR — the form a teacher uses to create or edit an Unjumble
// activity. Same contract as the Anagram editor:
//   openUnjumbleEditor(container, activity, { onSave, onCancel, header, footer })
// Reuses core/app.css's .aw-ed-* page chrome; the per-row Sentence | Clue
// table is Unjumble-specific CSS in unjumble.css (.aw-unj-ed-*).
//
// The teacher types the CORRECT SENTENCE in each row; the game splits it into
// words and scrambles the WORD order. An optional Clue shows above the words
// during play. Theme is always Classic (the Whiteboard look); per-act options
// (marking mode / alignment / timer) live in the in-game Options panel.
// Mic/image buttons are placeholders ("coming soon"), same as Anagram.
// =============================================================

import { el } from "../../core/utils.js";
import { icons } from "../../core/icons.js";

const MAX_ITEMS = 100;

export function openUnjumbleEditor(container, activity, { onSave, onCancel, header, footer } = {}) {
  const isNew = !(activity && activity.id);
  const data = normalize(activity);
  let draggingIndex = null;

  container.innerHTML = "";
  const page = el("div", "aw-ed");
  if (header) page.append(header);

  const head = el("div", "aw-ed-head");
  const headL = el("div", "aw-ed-headleft");
  headL.append(el("span", "aw-ed-typebadge", "UNJUMBLE"));
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

  // ===== META: activity title only =====
  const meta = el("div", "aw-ed-meta");
  const titleInput = el("input", "aw-ed-input");
  titleInput.value = data.title;
  titleInput.placeholder = "e.g. Future with WILL — Unjumble";
  titleInput.oninput = () => { data.title = titleInput.value; clearError(); };
  meta.append(field("Activity Title", titleInput));
  body.append(meta);

  // ===== SENTENCES =====
  body.append(el("div", "aw-ed-sectionhead", "Sentences"));
  body.append(buildBulkBar());

  const headRow = el("div", "aw-unj-ed-headrow");
  const headCols = el("div", "aw-unj-ed-headcols");
  headCols.append(
    el("span", "aw-unj-ed-headcol", "Sentence"),
    el("span", "aw-unj-ed-headcol is-clue", "Clue")
  );
  const swapBtn = el("button", "aw-btn", "Swap Columns");
  swapBtn.type = "button";
  swapBtn.title = "Swap the Sentence and Clue value in every row";
  swapBtn.onclick = () => {
    data.content.items.forEach(it => { const tmp = it.sentence; it.sentence = it.clue; it.clue = tmp; });
    renderItems();
    showInfo("Sentence and Clue swapped in every row.");
  };
  headRow.append(headCols, swapBtn);
  body.append(headRow);

  const iWrap = el("div", "aw-ed-questions");
  body.append(iWrap);
  renderItems();

  if (footer) page.append(footer);
  container.append(page);
  titleInput.focus();

  // ---------- sentence-list rendering ----------
  function renderItems() {
    iWrap.innerHTML = "";
    data.content.items.forEach((it, ii) => iWrap.append(itemRow(it, ii)));
    const addI = el("button", "aw-unj-ed-addrow", "+ Add a new sentence");
    addI.type = "button";
    addI.disabled = data.content.items.length >= MAX_ITEMS;
    addI.onclick = () => {
      if (data.content.items.length < MAX_ITEMS) { data.content.items.push(blankItem()); renderItems(); }
    };
    iWrap.append(addI);
    iWrap.append(el("div", "aw-ed-qcount", `${data.content.items.length} / ${MAX_ITEMS} sentences`));
  }

  // Paste a copied Excel RANGE: first column -> sentence, second -> clue.
  function onRowPaste(e, ii) {
    const text = (e.clipboardData || window.clipboardData)?.getData("text/plain") || "";
    if (!/[\t\n]/.test(text)) return;   // single cell -> normal paste
    e.preventDefault();
    const rows = text.replace(/\r/g, "").split("\n");
    while (rows.length && rows[rows.length - 1].trim() === "") rows.pop();
    const parsed = [];
    rows.forEach(line => {
      const cells = line.split("\t").map(c => c.trim());
      const sentence = cells[0] || "";
      const clue = cells[1] || "";
      if (sentence === "" && clue === "") return;
      parsed.push({ sentence, clue });
    });
    if (!parsed.length) return;
    let next = data.content.items.slice(0, ii).concat(parsed);
    let dropped = 0;
    if (next.length > MAX_ITEMS) { dropped = next.length - MAX_ITEMS; next = next.slice(0, MAX_ITEMS); }
    data.content.items = next;
    renderItems();
    const filled = parsed.length - dropped;
    showInfo(`Pasted ${filled} sentence(s) from Excel${dropped ? ` (${dropped} skipped — ${MAX_ITEMS} max)` : ""}.`);
  }

  function itemRow(it, ii) {
    const row = el("div", "aw-unj-ed-row");
    row.append(el("div", "aw-unj-ed-num", String(ii + 1) + "."));

    const box = el("div", "aw-unj-ed-box");
    const sentInput = el("input", "aw-unj-ed-sentence");
    sentInput.value = it.sentence;
    sentInput.placeholder = "Type the correct sentence";
    sentInput.oninput = () => { it.sentence = sentInput.value; clearError(); };
    sentInput.addEventListener("paste", e => onRowPaste(e, ii));
    const clueInput = el("input", "aw-unj-ed-clue");
    clueInput.value = it.clue;
    clueInput.placeholder = "Optional clue";
    clueInput.oninput = () => { it.clue = clueInput.value; clearError(); };
    clueInput.addEventListener("paste", e => onRowPaste(e, ii));
    box.append(sentInput, clueInput);
    row.append(box);

    const iconsWrap = el("div", "aw-unj-ed-icons");
    const micBtn = iconBtn(icons.mic, "Add voice (coming soon)");
    micBtn.onclick = () => showInfo("Voice recordings — coming soon.");
    const imgBtn = iconBtn(icons.image, "Add image (coming soon)");
    imgBtn.onclick = () => showInfo("Images — coming soon.");
    iconsWrap.append(micBtn, imgBtn, el("span", "aw-unj-ed-gap"));

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
    const b = el("button", "aw-unj-ed-iconbtn" + (extraClass ? " " + extraClass : ""), svg);
    b.type = "button";
    b.title = title;
    b.setAttribute("aria-label", title);
    return b;
  }

  // ---------- drag-to-reorder rows (native HTML5 DnD, same idiom as main.js) ----------
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
      iWrap.querySelectorAll(".aw-unj-ed-row").forEach(r => r.classList.remove("is-dropbefore", "is-dropafter"));
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
      const to = getIndex() + (before ? 0 : 1);
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
      .map(it => ({ sentence: (it.sentence || "").trim().replace(/\s+/g, " "), clue: (it.clue || "").trim() }))
      .filter(it => it.sentence !== "");

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
    const clearBtn = el("button", "aw-btn aw-ed-bulkdanger", "Delete all sentences");
    clearBtn.type = "button";
    clearBtn.onclick = () => {
      if (!confirm("Delete ALL sentences?")) return;
      data.content.items = [blankItem()];
      renderItems();
      showInfo("All sentences deleted.");
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
  a.type = "unjumble";
  a.schemaVersion = a.schemaVersion || 1;
  a.title = a.title || "";
  a.instruction = a.instruction || "";
  a.theme = "classic";
  a.options = a.options || {};
  a.content = a.content || {};
  let items = Array.isArray(a.content.items) ? a.content.items : [];
  if (items.length === 0) items = [blankItem()];
  // accept legacy keys word/text as the sentence
  a.content.items = items.map(it => ({
    sentence: it.sentence ?? it.text ?? it.word ?? "",
    clue: it.clue || ""
  }));
  return a;
}
function blankItem() { return { sentence: "", clue: "" }; }

function validate(d) {
  if (!d.title) return "Please enter an activity title.";
  if (!d.content.items.length) return "Add at least one sentence.";
  return null;
}
