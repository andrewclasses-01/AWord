// =============================================================
// BALLOON POP EDITOR — the form a teacher uses to create/edit a Balloon pop
// activity. Same contract as templates/quiz/quiz-editor.js and
// anagram-editor.js:
//   openBalloonPopEditor(container, activity, { onSave, onCancel, header, footer })
// Reuses the SHARED editor chrome (.aw-ed-*). The per-row layout
// (Keyword | Matching definition, Swap Columns, drag-to-reorder) mirrors
// Wordwall's real Balloon pop "Edit Content" table; styling is in
// balloon-pop.css (.aw-bp-ed-*).
//
// Data model: content.items = [{ keyword, definition }]  (min 5 / max 100 —
// Wordwall's own limits). Theme is always Classic; per-round options
// (timer/speed/levels/bonuses) live in the in-game Options panel. The image
// button is a placeholder for now (mirrors anagram's "coming soon").
// =============================================================

import { el } from "../../core/utils.js";
import { icons } from "../../core/icons.js";

const MAX_ITEMS = 100;
const MIN_ITEMS = 5;

export function openBalloonPopEditor(container, activity, { onSave, onCancel, header, footer } = {}) {
  const isNew = !(activity && activity.id);
  const data = normalize(activity);
  let draggingIndex = null;

  container.innerHTML = "";
  const page = el("div", "aw-ed");
  if (header) page.append(header);

  const head = el("div", "aw-ed-head");
  const headL = el("div", "aw-ed-headleft");
  headL.append(el("span", "aw-ed-typebadge", "BALLOON POP"));
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
  titleInput.placeholder = "e.g. Vocabulary — Balloon pop";
  titleInput.oninput = () => { data.title = titleInput.value; clearError(); };
  meta.append(field("Activity Title", titleInput));
  body.append(meta);

  // ===== ITEMS =====
  body.append(el("div", "aw-ed-sectionhead", "Keywords & definitions"));
  body.append(buildBulkBar());
  body.append(el("div", "aw-ed-tip",
    "Tip: in Excel, copy a block of cells (Keyword in the first column, its definition in the second), " +
    "then click a Keyword or Definition box and paste (Ctrl+V) to fill the whole list at once. " +
    "Drag the ⇕ handle to reorder. At least " + MIN_ITEMS + " items are needed."));

  const headRow = el("div", "aw-bp-ed-headrow");
  const headCols = el("div", "aw-bp-ed-headcols");
  const kc = el("div", "aw-bp-ed-headcol");
  kc.append(el("div", "aw-bp-ed-headtitle", "Keyword"), el("div", "aw-bp-ed-headsub", "These hang from the balloons"));
  const dc = el("div", "aw-bp-ed-headcol");
  dc.append(el("div", "aw-bp-ed-headtitle", "Matching definition"), el("div", "aw-bp-ed-headsub", "These appear on the train"));
  headCols.append(kc, dc);
  const swapBtn = el("button", "aw-btn", "Swap Columns");
  swapBtn.type = "button";
  swapBtn.title = "Swap the Keyword and Definition value in every row";
  swapBtn.onclick = () => {
    data.content.items.forEach(it => { const t = it.keyword; it.keyword = it.definition; it.definition = t; });
    renderItems();
    showInfo("Keyword and Definition swapped in every row.");
  };
  headRow.append(headCols, swapBtn);
  body.append(headRow);

  const iWrap = el("div", "aw-ed-questions");
  body.append(iWrap);
  renderItems();

  if (footer) page.append(footer);
  container.append(page);
  titleInput.focus();

  // ---------- rendering ----------
  function renderItems() {
    iWrap.innerHTML = "";
    data.content.items.forEach((it, ii) => iWrap.append(itemRow(it, ii)));
    const addI = el("button", "aw-bp-ed-addrow", "+ Add an item");
    addI.type = "button";
    addI.disabled = data.content.items.length >= MAX_ITEMS;
    addI.onclick = () => {
      if (data.content.items.length < MAX_ITEMS) { data.content.items.push(blankItem()); renderItems(); }
    };
    iWrap.append(addI);
    iWrap.append(el("div", "aw-ed-qcount", `${data.content.items.length} / ${MAX_ITEMS} items (min ${MIN_ITEMS})`));
  }

  function onRowPaste(e, ii) {
    const text = (e.clipboardData || window.clipboardData)?.getData("text/plain") || "";
    if (!/[\t\n]/.test(text)) return;
    e.preventDefault();
    const rows = text.replace(/\r/g, "").split("\n");
    while (rows.length && rows[rows.length - 1].trim() === "") rows.pop();
    const parsed = [];
    rows.forEach(line => {
      const cells = line.split("\t").map(c => c.trim());
      const keyword = cells[0] || "", definition = cells[1] || "";
      if (keyword === "" && definition === "") return;
      parsed.push({ keyword, definition });
    });
    if (!parsed.length) return;
    let next = data.content.items.slice(0, ii).concat(parsed);
    let dropped = 0;
    if (next.length > MAX_ITEMS) { dropped = next.length - MAX_ITEMS; next = next.slice(0, MAX_ITEMS); }
    data.content.items = next;
    renderItems();
    showInfo(`Pasted ${parsed.length - dropped} item(s) from Excel${dropped ? ` (${dropped} skipped — ${MAX_ITEMS} max)` : ""}.`);
  }

  function itemRow(it, ii) {
    const row = el("div", "aw-bp-ed-row");
    row.append(el("div", "aw-bp-ed-num", String(ii + 1) + "."));

    const box = el("div", "aw-bp-ed-box");
    const kwInput = el("input", "aw-bp-ed-keyword");
    kwInput.value = it.keyword;
    kwInput.placeholder = "Keyword";
    kwInput.oninput = () => { it.keyword = kwInput.value; clearError(); };
    kwInput.addEventListener("paste", e => onRowPaste(e, ii));
    const defInput = el("input", "aw-bp-ed-def");
    defInput.value = it.definition;
    defInput.placeholder = "Matching definition";
    defInput.oninput = () => { it.definition = defInput.value; clearError(); };
    defInput.addEventListener("paste", e => onRowPaste(e, ii));
    box.append(kwInput, defInput);
    row.append(box);

    const iconsWrap = el("div", "aw-bp-ed-icons");
    const imgBtn = iconBtn(icons.image, "Add image (coming soon)");
    imgBtn.onclick = () => showInfo("Images — coming soon.");
    iconsWrap.append(imgBtn, el("span", "aw-bp-ed-gap"));

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
    const b = el("button", "aw-bp-ed-iconbtn" + (extraClass ? " " + extraClass : ""), svg);
    b.type = "button"; b.title = title; b.setAttribute("aria-label", title);
    return b;
  }

  // ---------- drag-to-reorder (same idiom as anagram/main.js) ----------
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
      iWrap.querySelectorAll(".aw-bp-ed-row").forEach(r => r.classList.remove("is-dropbefore", "is-dropafter"));
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
      .map(it => ({ keyword: (it.keyword || "").trim(), definition: (it.definition || "").trim() }))
      .filter(it => it.keyword !== "" && it.definition !== "");
    const err = validate(clean);
    if (err) { showError(err); return; }
    saveBtn.disabled = true;
    const label = saveBtn.textContent;
    saveBtn.textContent = "Saving…";
    try {
      await onSave?.(clean);
    } catch (e) {
      saveBtn.disabled = false; saveBtn.textContent = label;
      showError("Could not save — please try again.");
    }
  };

  function showError(msg) { errBar.classList.remove("is-info"); errBar.textContent = msg; errBar.style.display = "block"; body.scrollTop = 0; }
  function showInfo(msg) { errBar.classList.add("is-info"); errBar.textContent = msg; errBar.style.display = "block"; body.scrollTop = 0; }
  function clearError() { if (errBar.style.display !== "none") errBar.style.display = "none"; }

  function buildBulkBar() {
    const bar = el("div", "aw-ed-bulk");
    const clearBtn = el("button", "aw-btn aw-ed-bulkdanger", "Delete all items");
    clearBtn.type = "button";
    clearBtn.onclick = () => {
      if (!confirm("Delete ALL items?")) return;
      data.content.items = [blankItem()];
      renderItems();
      showInfo("All items deleted.");
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
  a.type = "balloon_pop";
  a.schemaVersion = a.schemaVersion || 1;
  a.title = a.title || "";
  a.instruction = a.instruction || "";
  a.theme = "classic";
  a.options = a.options || {};
  a.content = a.content || {};
  let items = Array.isArray(a.content.items) ? a.content.items : [];
  if (items.length === 0) items = [blankItem()];
  a.content.items = items.map(it => ({ keyword: it.keyword || "", definition: it.definition || "" }));
  return a;
}
function blankItem() { return { keyword: "", definition: "" }; }

function validate(d) {
  if (!d.title) return "Please enter an activity title.";
  if (d.content.items.length < MIN_ITEMS) return `Add at least ${MIN_ITEMS} items (keyword + definition).`;
  return null;
}
