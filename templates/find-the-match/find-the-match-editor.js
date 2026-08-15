// =============================================================
// FIND THE MATCH EDITOR — the form a teacher uses to create or edit a Find
// the match activity. Same contract as templates/quiz/quiz-editor.js:
//   openFtmEditor(container, activity, { onSave, onCancel, header, footer })
// Reuses the SHARED editor page chrome from core/app.css (.aw-ed-* header/
// title field/tip/bulk bar/count). The per-row layout (Keyword | Definition
// table, icon buttons, drag-to-reorder) is Find-the-match-specific CSS in
// find-the-match.css (.aw-ftm-ed-*), a close copy of Anagram's Word|Clue
// table (templates/anagram/anagram-editor.js) since the data shape is the
// same 2-field-per-row list.
//
// SCOPE (same simplification as Anagram/Open the box, per Teacher Andrew):
// this page edits ONLY the title + the pair list. Theme is always Classic;
// default options (speed/lives/removeCorrects/...) live in Settings;
// per-act options are tweaked from the in-game Options panel. Teacher's own
// limit for this template: max 40 pairs (docs/05-FIND-THE-MATCH.md
// suggested 3-30; the teacher raised the ceiling to 40 when briefing this
// build — min 3 kept so there's always at least 2 "noise" tiles alongside
// the correct one).
// =============================================================

import { el } from "../../core/utils.js";
import { icons } from "../../core/icons.js";
// Đợt 146 — a reading act holds BOTH halves of the same exercise (READINGACT1 =
// practice, READINGACT2 = homework). No-ops for an act without halves.
import { makeSetTabs, foldEditedSet, expandSetsForEditing, activeContentSet } from "../../core/content-view.js";

const MIN_ITEMS = 3;
const MAX_ITEMS = 40;

export function openFtmEditor(container, activity, { onSave, onCancel, header, footer } = {}) {
  const isNew = !(activity && activity.id);
  const data = normalize(activity);
  let draggingIndex = null;   // module-scoped to this editor instance's drag session

  container.innerHTML = "";
  const page = el("div", "aw-ed");
  if (header) page.append(header);

  // ---- Sticky action bar: act-type badge + heading  |  Cancel / Save ----
  const head = el("div", "aw-ed-head");
  const headL = el("div", "aw-ed-headleft");
  headL.append(el("span", "aw-ed-typebadge", "FIND THE MATCH"));
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
  titleInput.placeholder = "e.g. Food groups — Find the match";
  titleInput.oninput = () => { data.title = titleInput.value; clearError(); };
  meta.append(field("Activity Title", titleInput));
  body.append(meta);

  // ===== PAIRS =====
  body.append(el("div", "aw-ed-sectionhead", "Pairs"));
  // PRACTICE | HOMEWORK tabs (Đợt 146) — above the bulk bar, because they
  // change WHICH list the bulk buttons act on.
  const setTabs = makeSetTabs(data.content, {
    current: activeContentSet(data),
    read: () => data.content.pairs,
    load: items => { data.content.pairs = items; renderItems(); }
  });
  if (setTabs.el) body.append(setTabs.el);
  body.append(buildBulkBar());

  const headRow = el("div", "aw-ftm-ed-headrow");
  const headCols = el("div", "aw-ftm-ed-headcols");
  headCols.append(el("span", "aw-ftm-ed-headcol", "Keyword"), el("span", "aw-ftm-ed-headcol", "Definition"));
  headRow.append(headCols);
  body.append(headRow);

  const iWrap = el("div", "aw-ed-questions");
  body.append(iWrap);
  renderItems();

  if (footer) page.append(footer);

  container.append(page);
  titleInput.focus();

  // ---------- pair-list rendering ----------
  function renderItems() {
    iWrap.innerHTML = "";
    data.content.pairs.forEach((it, ii) => iWrap.append(itemRow(it, ii)));
    const addI = el("button", "aw-ftm-ed-addrow", "+ Add a new pair");
    addI.type = "button";
    addI.disabled = data.content.pairs.length >= MAX_ITEMS;
    addI.onclick = () => {
      if (data.content.pairs.length < MAX_ITEMS) { data.content.pairs.push(blankItem()); renderItems(); }
    };
    iWrap.append(addI);
    const count = el("div", "aw-ed-qcount", `${data.content.pairs.length} / ${MAX_ITEMS} pairs`);
    iWrap.append(count);
  }

  // Paste a copied Excel RANGE: first column -> keyword, second column ->
  // definition. Works from EITHER box (a teacher pasting a 2-column range
  // doesn't need to remember which box to click). Fills from THIS row
  // downward, same convention as Anagram/Quiz's paste.
  function onRowPaste(e, ii) {
    const text = (e.clipboardData || window.clipboardData)?.getData("text/plain") || "";
    if (!/[\t\n]/.test(text)) return;    // a single cell -> let the normal paste happen
    e.preventDefault();

    const rows = text.replace(/\r/g, "").split("\n");
    while (rows.length && rows[rows.length - 1].trim() === "") rows.pop();   // drop trailing blank line

    const parsed = [];
    rows.forEach(line => {
      const cells = line.split("\t").map(c => c.trim());
      const keyword = cells[0] || "";
      const definition = cells[1] || "";
      if (keyword === "" && definition === "") return;   // skip blank rows
      parsed.push({ keyword, definition });
    });
    if (!parsed.length) return;

    // fill from this row down (keep rows before it), cap at the max
    let next = data.content.pairs.slice(0, ii).concat(parsed);
    let dropped = 0;
    if (next.length > MAX_ITEMS) { dropped = next.length - MAX_ITEMS; next = next.slice(0, MAX_ITEMS); }
    data.content.pairs = next;
    renderItems();
    const filled = parsed.length - dropped;
    showInfo(`Pasted ${filled} pair(s) from Excel${dropped ? ` (${dropped} skipped — ${MAX_ITEMS} max)` : ""}.`);
  }

  function itemRow(it, ii) {
    const row = el("div", "aw-ftm-ed-row");

    row.append(el("div", "aw-ftm-ed-num", String(ii + 1) + "."));

    const box = el("div", "aw-ftm-ed-box");
    const kwInput = el("input", "aw-ftm-ed-keyword");
    kwInput.value = it.keyword;
    kwInput.placeholder = "Word to guess";
    kwInput.oninput = () => { it.keyword = kwInput.value; clearError(); };
    kwInput.addEventListener("paste", e => onRowPaste(e, ii));
    const defInput = el("input", "aw-ftm-ed-definition");
    defInput.value = it.definition;
    defInput.placeholder = "Matching definition";
    defInput.oninput = () => { it.definition = defInput.value; clearError(); };
    defInput.addEventListener("paste", e => onRowPaste(e, ii));
    box.append(kwInput, defInput);
    row.append(box);

    const iconsWrap = el("div", "aw-ftm-ed-icons");
    const dragBtn = iconBtn(icons.dragHandle, "Drag to reorder", "is-drag");
    const dupBtn = iconBtn(icons.duplicate, "Duplicate");
    dupBtn.disabled = data.content.pairs.length >= MAX_ITEMS;
    dupBtn.onclick = () => {
      if (data.content.pairs.length >= MAX_ITEMS) return;
      const copy = JSON.parse(JSON.stringify(it));
      data.content.pairs.splice(ii + 1, 0, copy);
      renderItems();
    };
    const delBtn = iconBtn(icons.trash, "Remove", "is-danger");
    delBtn.disabled = data.content.pairs.length <= 1;
    delBtn.onclick = () => { data.content.pairs.splice(ii, 1); renderItems(); };
    iconsWrap.append(dragBtn, dupBtn, delBtn);
    row.append(iconsWrap);

    wireRowDrag(dragBtn, row, () => data.content.pairs.indexOf(it));
    wireRowDropTarget(row, () => data.content.pairs.indexOf(it));

    return row;
  }

  function iconBtn(svg, title, extraClass) {
    const b = el("button", "aw-ftm-ed-iconbtn" + (extraClass ? " " + extraClass : ""), svg);
    b.type = "button";
    b.title = title;
    b.setAttribute("aria-label", title);
    return b;
  }

  // ---------- drag-to-reorder (native HTML5 DnD, same idiom as main.js/Anagram) ----------
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
      iWrap.querySelectorAll(".aw-ftm-ed-row").forEach(r => r.classList.remove("is-dropbefore", "is-dropafter"));
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
      const [item] = data.content.pairs.splice(from, 1);
      data.content.pairs.splice(to > from ? to - 1 : to, 0, item);
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
    clean.content.pairs = clean.content.pairs
      .map(it => ({ keyword: (it.keyword || "").trim(), definition: (it.definition || "").trim() }))
      .filter(it => it.keyword !== "" || it.definition !== "");

    // Validate what is ON SCREEN first, so an error points at rows the teacher
    // can actually see — then fold that half back into storage form.
    const err = validate(clean);
    if (err) { showError(err); return; }
    foldEditedSet(clean.content, setTabs.currentKey());

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

  // ---------- bulk actions bar (above the pair table) ----------
  function buildBulkBar() {
    const bar = el("div", "aw-ed-bulk");
    const clearBtn = el("button", "aw-btn aw-ed-bulkdanger", "Delete all pairs");
    clearBtn.type = "button";
    clearBtn.onclick = () => {
      if (!confirm("Delete ALL pairs?")) return;
      data.content.pairs = [blankItem(), blankItem(), blankItem()];
      renderItems();
      showInfo("All pairs deleted.");
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
  a.type = "find_the_match";
  a.schemaVersion = a.schemaVersion || 1;
  a.title = a.title || "";
  a.instruction = a.instruction || "";
  a.theme = "classic";                 // theme is always Classic now
  a.options = a.options || {};
  a.content = a.content || {};
  const shape = list => {
    const pairs = Array.isArray(list) ? [...list] : [];
    while (pairs.length < MIN_ITEMS) pairs.push(blankItem());
    return pairs.map(it => ({ keyword: it.keyword || "", definition: it.definition || "" }));
  };
  // Đợt 146 — open on the half the act is set to play, in EDITING form so
  // switching tabs cannot overwrite the other half. EVERY half is shaped, not
  // just the one on screen, so the other tab is ready to render when picked.
  const setKey = activeContentSet(a);
  if (setKey) {
    expandSetsForEditing(a.content);
    Object.keys(a.content.sets).forEach(k => { a.content.sets[k] = shape(a.content.sets[k]); });
    a.content.pairs = a.content.sets[setKey];   // ONE array, so edits land in both
  } else {
    a.content.pairs = shape(a.content.pairs);
  }
  return a;
}
function blankItem() { return { keyword: "", definition: "" }; }

function validate(d) {
  if (!d.title) return "Please enter an activity title.";
  if (d.content.pairs.length < MIN_ITEMS) return `Add at least ${MIN_ITEMS} pairs.`;
  for (let i = 0; i < d.content.pairs.length; i++) {
    const it = d.content.pairs[i];
    if (!it.keyword) return `Pair ${i + 1} is missing its Keyword.`;
    if (!it.definition) return `Pair ${i + 1} is missing its Definition.`;
  }
  return null;
}
