// =============================================================
// SPEAKING CARDS EDITOR — the form a teacher uses to create/edit a Speaking
// cards activity. Same contract as balloon-pop-editor.js / quiz-editor.js:
//   openSpeakingCardsEditor(container, activity, { onSave, onCancel, header, footer })
// Reuses the SHARED editor chrome (.aw-ed-*); the per-row layout (card text +
// optional image) is styled with .aw-sc-ed-* in speaking-cards.css.
//
// Data model: content.cards = [{ text, image? }]  (min 1 / max 100).
// image is a data: URL (uploaded pictures are downscaled to keep the saved
// activity small enough for Firestore). Theme is always Classic (Board Games);
// per-round options (timer / deal places / shuffle) live in the in-game
// Options panel, not here.
// =============================================================

import { el } from "../../core/utils.js";
import { icons } from "../../core/icons.js";

const MAX_ITEMS = 100;
const MIN_ITEMS = 1;
const IMG_MAX_DIM = 480;   // downscale uploaded pictures to this max side

export function openSpeakingCardsEditor(container, activity, { onSave, onCancel, header, footer } = {}) {
  const isNew = !(activity && activity.id);
  const data = normalize(activity);
  let draggingIndex = null;

  container.innerHTML = "";
  const page = el("div", "aw-ed");
  if (header) page.append(header);

  const head = el("div", "aw-ed-head");
  const headL = el("div", "aw-ed-headleft");
  headL.append(el("span", "aw-ed-typebadge", "SPEAKING CARDS"));
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
  titleInput.placeholder = "e.g. Speaking prompts — Unit 3";
  titleInput.oninput = () => { data.title = titleInput.value; clearError(); };
  meta.append(field("Activity Title", titleInput));
  body.append(meta);

  // ===== CARDS =====
  body.append(el("div", "aw-ed-sectionhead", "Cards"));
  body.append(buildBulkBar());
  body.append(el("div", "aw-ed-tip",
    "Each card shows one prompt for a student to talk about. Add a picture with the image button if you like. " +
    "Tip: copy a column of prompts from Excel, click a card box and paste (Ctrl+V) to fill the whole list at once. " +
    "Drag the ⇕ handle to reorder. At least " + MIN_ITEMS + " card is needed."));

  const iWrap = el("div", "aw-ed-questions");
  body.append(iWrap);
  renderItems();

  if (footer) page.append(footer);
  container.append(page);
  titleInput.focus();

  // ---------- rendering ----------
  function renderItems() {
    iWrap.innerHTML = "";
    data.content.cards.forEach((it, ii) => iWrap.append(itemRow(it, ii)));
    const addI = el("button", "aw-sc-ed-addrow", "+ Add a card");
    addI.type = "button";
    addI.disabled = data.content.cards.length >= MAX_ITEMS;
    addI.onclick = () => {
      if (data.content.cards.length < MAX_ITEMS) { data.content.cards.push(blankItem()); renderItems(); }
    };
    iWrap.append(addI);
    iWrap.append(el("div", "aw-ed-qcount", `${data.content.cards.length} / ${MAX_ITEMS} cards (min ${MIN_ITEMS})`));
  }

  function onRowPaste(e, ii) {
    const text = (e.clipboardData || window.clipboardData)?.getData("text/plain") || "";
    if (!/\n/.test(text)) return;             // single line -> let the field handle it normally
    e.preventDefault();
    const rows = text.replace(/\r/g, "").split("\n").map(s => s.replace(/\t/g, " ").trim());
    while (rows.length && rows[rows.length - 1] === "") rows.pop();
    const parsed = rows.filter(s => s !== "").map(s => ({ text: s, image: "" }));
    if (!parsed.length) return;
    let next = data.content.cards.slice(0, ii).concat(parsed);
    let dropped = 0;
    if (next.length > MAX_ITEMS) { dropped = next.length - MAX_ITEMS; next = next.slice(0, MAX_ITEMS); }
    data.content.cards = next;
    renderItems();
    showInfo(`Pasted ${parsed.length - dropped} card(s) from Excel${dropped ? ` (${dropped} skipped — ${MAX_ITEMS} max)` : ""}.`);
  }

  function itemRow(it, ii) {
    const row = el("div", "aw-sc-ed-row");
    row.append(el("div", "aw-sc-ed-num", String(ii + 1) + "."));

    const box = el("div", "aw-sc-ed-box");
    const txtInput = el("textarea", "aw-sc-ed-text");
    txtInput.rows = 2;
    txtInput.value = it.text;
    txtInput.placeholder = "What should the student talk about?";
    txtInput.oninput = () => { it.text = txtInput.value; clearError(); };
    txtInput.addEventListener("paste", e => onRowPaste(e, ii));
    box.append(txtInput);

    // image thumb (only when set)
    const thumbWrap = el("div", "aw-sc-ed-thumbwrap");
    if (it.image) thumbWrap.append(buildThumb(it, ii));
    box.append(thumbWrap);
    row.append(box);

    const iconsWrap = el("div", "aw-sc-ed-icons");
    const imgBtn = iconBtn(icons.image, it.image ? "Change image" : "Add image");
    if (it.image) imgBtn.classList.add("is-on");
    imgBtn.onclick = () => pickImage(it, ii);
    iconsWrap.append(imgBtn, el("span", "aw-sc-ed-gap"));

    const dragBtn = iconBtn(icons.dragHandle, "Drag to reorder", "is-drag");
    const dupBtn = iconBtn(icons.duplicate, "Duplicate");
    dupBtn.disabled = data.content.cards.length >= MAX_ITEMS;
    dupBtn.onclick = () => {
      if (data.content.cards.length >= MAX_ITEMS) return;
      data.content.cards.splice(ii + 1, 0, JSON.parse(JSON.stringify(it)));
      renderItems();
    };
    const delBtn = iconBtn(icons.trash, "Remove", "is-danger");
    delBtn.disabled = data.content.cards.length <= 1;
    delBtn.onclick = () => { data.content.cards.splice(ii, 1); renderItems(); };
    iconsWrap.append(dragBtn, dupBtn, delBtn);
    row.append(iconsWrap);

    wireRowDrag(dragBtn, row, () => data.content.cards.indexOf(it));
    wireRowDropTarget(row, () => data.content.cards.indexOf(it));
    return row;
  }

  function buildThumb(it, ii) {
    const thumb = el("div", "aw-sc-ed-thumb");
    thumb.style.backgroundImage = `url("${String(it.image).replace(/["\\]/g, "")}")`;
    const rm = el("button", "aw-sc-ed-thumbx", "×");
    rm.type = "button"; rm.title = "Remove image";
    rm.onclick = () => { it.image = ""; renderItems(); };
    thumb.append(rm);
    return thumb;
  }

  function pickImage(it, ii) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files && input.files[0];
      if (!file) return;
      try {
        it.image = await fileToDataUrl(file, IMG_MAX_DIM);
        renderItems();
      } catch (e) {
        showError("Could not read that image — try a different file.");
      }
    };
    input.click();
  }

  function iconBtn(svg, title, extraClass) {
    const b = el("button", "aw-sc-ed-iconbtn" + (extraClass ? " " + extraClass : ""), svg);
    b.type = "button"; b.title = title; b.setAttribute("aria-label", title);
    return b;
  }

  // ---------- drag-to-reorder (same idiom as balloon-pop-editor.js) ----------
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
      iWrap.querySelectorAll(".aw-sc-ed-row").forEach(r => r.classList.remove("is-dropbefore", "is-dropafter"));
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
      const [item] = data.content.cards.splice(from, 1);
      data.content.cards.splice(to > from ? to - 1 : to, 0, item);
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
    clean.content.cards = clean.content.cards
      .map(it => ({ text: (it.text || "").trim(), image: it.image || "" }))
      .filter(it => it.text !== "" || it.image !== "");
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
    const clearBtn = el("button", "aw-btn aw-ed-bulkdanger", "Delete all cards");
    clearBtn.type = "button";
    clearBtn.onclick = () => {
      if (!confirm("Delete ALL cards?")) return;
      data.content.cards = [blankItem()];
      renderItems();
      showInfo("All cards deleted.");
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

// ===== image helper: read + downscale to a data URL =====
function fileToDataUrl(file, maxDim) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode failed"));
      img.onload = () => {
        let { width, height } = img;
        const scale = Math.min(1, maxDim / Math.max(width, height));
        width = Math.round(width * scale); height = Math.round(height * scale);
        try {
          const canvas = document.createElement("canvas");
          canvas.width = width; canvas.height = height;
          canvas.getContext("2d").drawImage(img, 0, 0, width, height);
          // PNG keeps transparency; everything else -> JPEG (smaller).
          const isPng = /image\/png/i.test(file.type);
          resolve(canvas.toDataURL(isPng ? "image/png" : "image/jpeg", 0.82));
        } catch (e) { resolve(reader.result); }   // canvas tainted? fall back to raw
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// ===== data helpers =====
function normalize(activity) {
  const a = activity ? JSON.parse(JSON.stringify(activity)) : {};
  a.type = "speaking_cards";
  a.schemaVersion = a.schemaVersion || 1;
  a.title = a.title || "";
  a.instruction = a.instruction || "";
  a.theme = "classic";
  a.options = a.options || {};
  a.content = a.content || {};
  let cards = Array.isArray(a.content.cards) ? a.content.cards : [];
  if (cards.length === 0) cards = [blankItem()];
  a.content.cards = cards.map(it => ({ text: it.text || "", image: it.image || "" }));
  return a;
}
function blankItem() { return { text: "", image: "" }; }

function validate(d) {
  if (!d.title) return "Please enter an activity title.";
  if (d.content.cards.length < MIN_ITEMS) return `Add at least ${MIN_ITEMS} card.`;
  return null;
}
