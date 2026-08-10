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
// per-act options are tweaked from the in-game Options panel. The image
// button is still a placeholder (teacher said "we'll discuss it later") —
// it just shows an info banner, no upload wired up yet. The mic button
// (10/8/2026) is real: it opens a small popover to generate a Kokoro TTS
// pronunciation clip for that row's Word, stored via core/voice-clips.js
// and played back in-game by anagram.js's "listen" button next to the clue.
//
// Row reordering uses the SAME native HTML5 drag-and-drop idiom as
// main.js's folder/act drag-drop (draggable + dragstart/dragover/drop), so
// it stays consistent with the rest of the app instead of inventing a new
// pattern. Only the drag-HANDLE icon is draggable (not the whole row) so
// clicking/selecting text in the Word/Clue inputs is unaffected.
// =============================================================

import { el } from "../../core/utils.js";
import { icons } from "../../core/icons.js";
import { VOICES, DEFAULT_VOICE, generateSpeechDataUrl } from "../../core/tts.js";
import { saveVoiceClip, getVoiceClip, deleteVoiceClip } from "../../core/voice-clips.js";

const MAX_ITEMS = 100;

export function openAnagramEditor(container, activity, { onSave, onCancel, header, footer } = {}) {
  const isNew = !(activity && activity.id);
  const data = normalize(activity);
  let draggingIndex = null;   // module-scoped to this editor instance's drag session
  // Voice popover state — declared up here (not next to the functions that
  // use it, further down) because renderItems() calls closeVoicePopover()
  // and renderItems() runs during initial setup, BEFORE execution would
  // otherwise reach a `let` placed near the popover functions (TDZ error).
  let voicePopEl = null;
  let voicePreviewAudio = null;   // currently-playing preview, so a second Play doesn't overlap the first

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
    // Swapping changes what Word IS, so any voice clip (generated for the
    // pre-swap word) is now stale — same reasoning as the wordInput.oninput
    // guard in itemRow() below, just applied to every row at once here.
    data.content.items.forEach(it => {
      const tmp = it.word; it.word = it.clue; it.clue = tmp;
      it.voice = ""; it.voiceId = "";
    });
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
    closeVoicePopover();   // any full re-render replaces row DOM, invalidating the popover's anchor button
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
    wordInput.oninput = () => {
      it.word = wordInput.value;
      clearError();
      // Editing the word invalidates any voice clip already generated for the
      // OLD spelling — clear the reference (the orphaned Firestore doc, if
      // any, is not deleted here; see core/voice-clips.js's file comment).
      if (it.voice) { it.voice = ""; it.voiceId = ""; setMicState(micBtn, false); closeVoicePopover(); }
    };
    wordInput.addEventListener("paste", e => onRowPaste(e, ii));
    const clueInput = el("input", "aw-anagram-ed-clue");
    clueInput.value = it.clue;
    clueInput.placeholder = "Optional clue / definition";
    clueInput.oninput = () => { it.clue = clueInput.value; clearError(); };
    clueInput.addEventListener("paste", e => onRowPaste(e, ii));
    box.append(wordInput, clueInput);
    row.append(box);

    const iconsWrap = el("div", "aw-anagram-ed-icons");
    const micBtn = iconBtn(it.voice ? icons.soundOn : icons.mic,
      it.voice ? "Voice added — click to preview, change or remove" : "Add a pronunciation voice");
    if (it.voice) micBtn.classList.add("is-active");
    micBtn.onclick = () => toggleVoicePopover(micBtn, it);
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

  // ---------- voice popover (mic icon — generate/preview/remove a Kokoro
  // TTS pronunciation clip for one row's Word). A single shared popover
  // element (not one per row) toggled open/closed, positioned under
  // whichever mic button was clicked. Success/failure update the SAME
  // mic button in place (icon + title) instead of calling renderItems() —
  // a full re-render would replace every row's DOM, including the very
  // button this popover is anchored to, breaking its position. (voicePopEl/
  // voicePreviewAudio are declared near the top of openAnagramEditor, not
  // here — see the comment there.)
  function closeVoicePopover() {
    if (voicePopEl) { voicePopEl.remove(); voicePopEl = null; }
    document.removeEventListener("pointerdown", onVoicePopOutside, true);
  }
  function onVoicePopOutside(e) {
    if (voicePopEl && !voicePopEl.contains(e.target)) closeVoicePopover();
  }
  function stopVoicePreview() {
    if (voicePreviewAudio) { voicePreviewAudio.pause(); voicePreviewAudio = null; }
  }
  function setMicState(micBtn, hasVoice) {
    micBtn.innerHTML = hasVoice ? icons.soundOn : icons.mic;
    micBtn.classList.toggle("is-active", hasVoice);
    const title = hasVoice ? "Voice added — click to preview, change or remove" : "Add a pronunciation voice";
    micBtn.title = title;
    micBtn.setAttribute("aria-label", title);
  }

  function toggleVoicePopover(micBtn, it) {
    if (voicePopEl && voicePopEl._forItem === it) { closeVoicePopover(); return; }
    buildVoicePopover(micBtn, it);
  }

  function buildVoicePopover(micBtn, it) {
    closeVoicePopover();
    stopVoicePreview();

    const pop = el("div", "aw-anagram-ed-voicepop");
    pop._forItem = it;

    pop.append(el("div", "aw-anagram-ed-voicetitle", "Pronunciation voice"));

    const selectField = el("div", "aw-anagram-ed-voicefield");
    selectField.append(el("label", "aw-anagram-ed-voicelabel", "Voice"));
    const select = el("select", "aw-anagram-ed-voiceselect");
    const usGroup = document.createElement("optgroup"); usGroup.label = "American English";
    const gbGroup = document.createElement("optgroup"); gbGroup.label = "British English";
    VOICES.forEach(v => {
      const o = document.createElement("option");
      o.value = v.id;
      o.textContent = `${v.name} (${v.gender}, ${v.grade})`;
      (v.lang === "en-gb" ? gbGroup : usGroup).append(o);
    });
    select.append(gbGroup, usGroup);
    select.value = it.voiceId || DEFAULT_VOICE;
    selectField.append(select);
    pop.append(selectField);

    const status = el("div", "aw-anagram-ed-voicestatus");
    pop.append(status);

    const btnRow = el("div", "aw-anagram-ed-voicebtns");
    const genBtn = el("button", "aw-btn aw-btn-primary", it.voice ? "Regenerate" : "Generate voice");
    genBtn.type = "button";
    btnRow.append(genBtn);

    let playBtn = null, delBtn = null;
    if (it.voice) {
      playBtn = el("button", "aw-btn", "▶ Play");
      playBtn.type = "button";
      playBtn.onclick = async () => {
        playBtn.disabled = true;
        try {
          const clip = await getVoiceClip(it.voice);
          if (clip && clip.audio) {
            stopVoicePreview();
            voicePreviewAudio = new Audio(clip.audio);
            voicePreviewAudio.play().catch(() => {});
          } else {
            status.textContent = "Could not load the saved clip.";
          }
        } catch {
          status.textContent = "Could not load the saved clip.";
        } finally {
          playBtn.disabled = false;
        }
      };
      btnRow.append(playBtn);

      delBtn = iconBtn(icons.trash, "Remove voice", "is-danger");
      delBtn.onclick = async () => {
        genBtn.disabled = true; playBtn.disabled = true; delBtn.disabled = true;
        try { await deleteVoiceClip(it.voice); } catch { /* ignore — clip may already be gone */ }
        it.voice = ""; it.voiceId = "";
        setMicState(micBtn, false);
        buildVoicePopover(micBtn, it);
      };
      btnRow.append(delBtn);
    }
    pop.append(btnRow);

    genBtn.onclick = async () => {
      const word = (it.word || "").trim();
      if (!word) { status.textContent = "Enter a word first."; return; }
      genBtn.disabled = true; select.disabled = true;
      if (playBtn) playBtn.disabled = true;
      if (delBtn) delBtn.disabled = true;
      status.textContent = "Loading voice model… (first time only, ~86MB)";
      try {
        const dataUrl = await generateSpeechDataUrl(word, select.value, p => {
          if (p && /\.onnx$/.test(p.file || "") && p.progress != null) {
            status.textContent = `Loading voice model… ${Math.round(p.progress)}%`;
          } else if (p && p.status === "done") {
            status.textContent = "Generating…";
          }
        });
        status.textContent = "Saving…";
        const id = await saveVoiceClip({ id: it.voice || undefined, text: word, voiceId: select.value, audioDataUrl: dataUrl });
        it.voice = id;
        it.voiceId = select.value;
        setMicState(micBtn, true);
        buildVoicePopover(micBtn, it);
      } catch (e) {
        status.textContent = e && e.code === "aw/signed-out"
          ? "Please sign in first."
          : "Could not generate voice — please try again.";
        genBtn.disabled = false; select.disabled = false;
        if (playBtn) playBtn.disabled = false;
        if (delBtn) delBtn.disabled = false;
      }
    };

    document.body.append(pop);
    const r = micBtn.getBoundingClientRect();
    pop.style.top = Math.min(r.bottom + 6, window.innerHeight - 40) + "px";
    pop.style.left = Math.max(8, Math.min(r.left, window.innerWidth - 272)) + "px";
    voicePopEl = pop;
    setTimeout(() => document.addEventListener("pointerdown", onVoicePopOutside, true), 0);
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
  cancelBtn.onclick = () => { closeVoicePopover(); stopVoicePreview(); onCancel?.(); };

  saveBtn.onclick = async () => {
    closeVoicePopover(); stopVoicePreview();
    // validate on a CLEANED copy (drop fully-blank rows) so the live model
    // the teacher is editing is never mutated by a failed save attempt.
    const clean = JSON.parse(JSON.stringify(data));
    clean.title = clean.title.trim();
    clean.instruction = (clean.instruction || "").trim();
    clean.theme = "classic";
    clean.content.items = clean.content.items
      .map(it => ({
        word: (it.word || "").trim(), clue: (it.clue || "").trim(),
        voice: it.voice || "", voiceId: it.voiceId || ""
      }))
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
  a.content.items = items.map(it => ({
    word: it.word || "", clue: it.clue || "", voice: it.voice || "", voiceId: it.voiceId || ""
  }));
  return a;
}
function blankItem() { return { word: "", clue: "", voice: "", voiceId: "" }; }

function validate(d) {
  if (!d.title) return "Please enter an activity title.";
  if (!d.content.items.length) return "Add at least one word.";
  return null;
}
