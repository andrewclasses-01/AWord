// =============================================================
// RUNNING WORD EDITOR — the form a teacher uses to create or edit the word pool.
//
//   openRunningWordEditor(container, activity, { onSave, onCancel, header, footer })
//     • same contract as every other AWord editor (quiz / anagram / type-the-answer)
//     • edits a DEEP CLONE, so Cancel leaves the original untouched
//
// ⭐ RE-BUILT 11/8/2026 (teacher's request) — one Word PER ROW with its own IPA
// box next to it, same shape as Anagram's Word|Clue table: paste a 2-column
// Excel range (WORD in the first column, IPA in the second) in one go, or drag
// the ⇕ handle to reorder. The single big textarea this used to be (one word
// per line, no IPA) is gone — see GHI CHU RUNNING-WORD.md for why the pool used
// to be "just paste the column" and what changed when IPA needed its own field.
//
// Each row is `{ word, ipa }`. `ipa` is optional (printed sheets and the
// in-game reveal just skip a word with none) — see rw-sets.js's ipaFrom() for
// where it is read back out. The two teams' printed lists are NOT edited here:
// they are generated (and optionally saved) from the game's own setup screen.
// =============================================================

import { el } from "../../core/utils.js";
import { icons } from "../../core/icons.js";
import { cleanWord, readSets, MAX_SETS } from "./rw-sets.js";

const MAX_WORDS = 200;      // far above a real lesson pool (~100); a guard, not a target
const MIN_WORDS = 2;

export function openRunningWordEditor(container, activity, { onSave, onCancel, header, footer } = {}) {
  const isNew = !(activity && activity.id);
  const data = normalize(activity);
  let draggingIndex = null;   // module-scoped to this editor instance's drag session

  container.innerHTML = "";
  const page = el("div", "aw-ed");
  if (header) page.append(header);

  // ---- sticky action bar ----
  const head = el("div", "aw-ed-head");
  const headL = el("div", "aw-ed-headleft");
  headL.append(el("span", "aw-ed-typebadge", "RUNNING WORD"));
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

  // ===== title =====
  const meta = el("div", "aw-ed-meta");
  const titleInput = el("input", "aw-ed-input");
  titleInput.value = data.title;
  titleInput.placeholder = "e.g. IEL-S15.T3.P4 — Running word";
  titleInput.oninput = () => { data.title = titleInput.value; clearError(); };
  meta.append(field("Activity Title", titleInput));
  body.append(meta);

  // ===== word pool =====
  body.append(el("div", "aw-ed-sectionhead", "Word pool"));
  body.append(buildBulkBar());
  body.append(el("div", "aw-ed-tip",
    "In Excel, copy a block of cells (WORD in the first column, an optional IPA in the second), " +
    "then click a Word or IPA box and paste (Ctrl+V) to fill the whole list at once. IPA is optional — " +
    "leave it blank and the printed sheets and in-game reveal just skip it. Drag the ⇕ handle to reorder " +
    "(both teams' lists are drawn from this pool when you start the game, so put EVERY word either team " +
    "should get in here)."));

  const headRow = el("div", "aw-rw-ed-headrow");
  const headCols = el("div", "aw-rw-ed-headcols");
  headCols.append(el("span", "aw-rw-ed-headcol", "Word"), el("span", "aw-rw-ed-headcol", "IPA"));
  headRow.append(headCols);
  body.append(headRow);

  const iWrap = el("div", "aw-ed-questions");
  body.append(iWrap);
  renderItems();

  // ===== saved print sets =====
  // Editing the pool can leave a saved split pointing at words that no longer
  // exist, so the teacher is told what is stored and given a way to drop it.
  // readSets() is POSITIONAL — index i is always SET i+1, and a hole is `null`,
  // so this has to check for ANY saved slot and skip the holes rather than
  // trusting .length (which is always up to MAX_SETS).
  const saved = readSets(data);
  const savedCount = saved.filter(Boolean).length;
  if (savedCount) {
    body.append(el("div", "aw-ed-sectionhead", "Saved print sets"));
    const box = el("div", "aw-rw-ed-sets");
    saved.forEach((s, i) => {
      if (!s) return;
      box.append(el("div", "aw-rw-ed-set",
        `SET ${i + 1} — ${s.a.length} + ${s.b.length} words`));
    });
    const dropBtn = el("button", "aw-btn aw-ed-bulkdanger", `Delete ${savedCount} saved set(s)`);
    dropBtn.type = "button";
    dropBtn.onclick = () => {
      if (!confirm("Delete the saved splits? The printed sheets you already handed out will no longer match a set in the game.")) return;
      data.content.printSets = [];
      box.remove(); dropBtn.remove();
      showInfo("Saved sets deleted — the game will shuffle a fresh split.");
    };
    body.append(box, dropBtn);
    body.append(el("div", "aw-ed-tip",
      `A set is one A / B split of this pool, kept so the game can be replayed against sheets ` +
      `you already printed (up to ${MAX_SETS}). Sets are created from the game's setup screen, not here. ` +
      `If you change the word list above, delete these — a split that names a deleted word can no longer be dealt.`));
  }

  if (footer) page.append(footer);
  container.append(page);
  titleInput.focus();

  // ---------- bulk bar ----------
  function buildBulkBar() {
    const bulk = el("div", "aw-ed-bulk");
    const dedupeBtn = el("button", "aw-btn", "Remove duplicates");
    const upperBtn = el("button", "aw-btn", "UPPERCASE");
    const sortBtn = el("button", "aw-btn", "Sort A-Z");
    const clearBtn = el("button", "aw-btn aw-ed-bulkdanger", "Delete all words");
    [dedupeBtn, upperBtn, sortBtn, clearBtn].forEach(b => { b.type = "button"; bulk.append(b); });

    dedupeBtn.onclick = () => {
      const before = data.content.words.length;
      data.content.words = dedupeRows(data.content.words);
      renderItems();
      showInfo(`Removed ${before - data.content.words.length} duplicate word(s).`);
    };
    // IPA is left exactly as typed -- only the WORD is case-normalised.
    upperBtn.onclick = () => {
      data.content.words.forEach(w => { w.word = w.word.toUpperCase(); });
      renderItems();
      clearError();
    };
    sortBtn.onclick = () => {
      data.content.words.sort((a, b) => a.word.localeCompare(b.word, "en", { sensitivity: "base" }));
      renderItems();
      clearError();
    };
    clearBtn.onclick = () => {
      if (!confirm("Delete ALL words?")) return;
      data.content.words = [blankItem()];
      renderItems();
      showInfo("All words deleted.");
    };
    return bulk;
  }

  // ---------- word-list rendering ----------
  function renderItems() {
    iWrap.innerHTML = "";
    data.content.words.forEach((it, ii) => iWrap.append(itemRow(it, ii)));
    const addI = el("button", "aw-rw-ed-addrow", "+ Add a new word");
    addI.type = "button";
    addI.disabled = data.content.words.length >= MAX_WORDS;
    addI.onclick = () => {
      if (data.content.words.length < MAX_WORDS) { data.content.words.push(blankItem()); renderItems(); }
    };
    iWrap.append(addI);

    const nonBlank = data.content.words.filter(w => w.word.trim());
    const dupes = nonBlank.length - dedupeRows(nonBlank).length;
    const perTeam = Math.floor(nonBlank.length / 2);
    iWrap.append(el("div", "aw-ed-qcount",
      `${nonBlank.length} / ${MAX_WORDS} words`
      + (dupes ? `  ·  ${dupes} duplicate(s)` : "")
      + (nonBlank.length >= MIN_WORDS ? `  ·  enough for ${perTeam} + ${perTeam} per team` : "")));
  }

  // Paste a copied Excel RANGE: first column -> word, second column
  // (optional) -> IPA. Works from EITHER the Word or the IPA box (a teacher
  // pasting a 2-column range doesn't need to remember which box to click); a
  // paste with no tabs (just the WORD column, many lines) still fills every
  // row down from here with a blank IPA -- the same "paste the whole column"
  // workflow the old textarea offered. Fills from THIS row downward.
  function onRowPaste(e, ii) {
    const text = (e.clipboardData || window.clipboardData)?.getData("text/plain") || "";
    if (!/[\t\n]/.test(text)) return;    // a single cell -> let the normal paste happen
    e.preventDefault();

    const rows = text.replace(/\r/g, "").split("\n");
    while (rows.length && rows[rows.length - 1].trim() === "") rows.pop();   // drop trailing blank line

    const parsed = [];
    rows.forEach(line => {
      const cells = line.split("\t");
      const word = cleanWord(cells[0] || "");
      const ipa = (cells[1] || "").trim();
      if (!word && !ipa) return;   // skip blank rows
      parsed.push({ word, ipa });
    });
    if (!parsed.length) return;

    // fill from this row down (keep rows before it), cap at the max
    let next = data.content.words.slice(0, ii).concat(parsed);
    let dropped = 0;
    if (next.length > MAX_WORDS) { dropped = next.length - MAX_WORDS; next = next.slice(0, MAX_WORDS); }
    data.content.words = next;
    renderItems();
    const filled = parsed.length - dropped;
    showInfo(`Pasted ${filled} word(s) from Excel${dropped ? ` (${dropped} skipped — ${MAX_WORDS} max)` : ""}.`);
  }

  function itemRow(it, ii) {
    const row = el("div", "aw-rw-ed-row");
    row.append(el("div", "aw-rw-ed-num", String(ii + 1) + "."));

    const box = el("div", "aw-rw-ed-box");
    const wordInput = el("input", "aw-rw-ed-word");
    wordInput.value = it.word;
    wordInput.placeholder = "Word";
    wordInput.spellcheck = false;
    wordInput.oninput = () => { it.word = wordInput.value; clearError(); };
    wordInput.addEventListener("paste", e => onRowPaste(e, ii));
    const ipaInput = el("input", "aw-rw-ed-ipa");
    ipaInput.value = it.ipa;
    ipaInput.placeholder = "IPA (optional)";
    ipaInput.spellcheck = false;
    ipaInput.oninput = () => { it.ipa = ipaInput.value; clearError(); };
    ipaInput.addEventListener("paste", e => onRowPaste(e, ii));
    box.append(wordInput, ipaInput);
    row.append(box);

    const iconsWrap = el("div", "aw-rw-ed-icons");
    const dragBtn = iconBtn(icons.dragHandle, "Drag to reorder", "is-drag");
    const delBtn = iconBtn(icons.trash, "Remove", "is-danger");
    delBtn.disabled = data.content.words.length <= 1;
    delBtn.onclick = () => { data.content.words.splice(ii, 1); renderItems(); };
    iconsWrap.append(dragBtn, delBtn);
    row.append(iconsWrap);

    wireRowDrag(dragBtn, row, () => data.content.words.indexOf(it));
    wireRowDropTarget(row, () => data.content.words.indexOf(it));

    return row;
  }

  function iconBtn(svg, title, extraClass) {
    const b = el("button", "aw-rw-ed-iconbtn" + (extraClass ? " " + extraClass : ""), svg);
    b.type = "button";
    b.title = title;
    b.setAttribute("aria-label", title);
    return b;
  }

  // ---------- drag-to-reorder (native HTML5 DnD, same idiom as Anagram / main.js) ----------
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
      iWrap.querySelectorAll(".aw-rw-ed-row").forEach(r => r.classList.remove("is-dropbefore", "is-dropafter"));
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
      const [item] = data.content.words.splice(from, 1);
      data.content.words.splice(to > from ? to - 1 : to, 0, item);
      renderItems();
    });
  }

  // ---------- save / cancel ----------
  cancelBtn.onclick = () => onCancel?.();

  saveBtn.onclick = async () => {
    const clean = JSON.parse(JSON.stringify(data));
    clean.title = (clean.title || "").trim();
    clean.instruction = (clean.instruction || "").trim();
    clean.theme = "classic";
    clean.content.words = dedupeRows(
      clean.content.words.map(w => ({ word: cleanWord(w.word), ipa: String(w.ipa || "").trim() }))
        .filter(w => w.word)
    );

    // A saved split naming a word that is no longer in the pool can't be dealt,
    // so drop any set that no longer fits rather than letting the game fail on it.
    const poolKeys = new Set(clean.content.words.map(w => w.word.toUpperCase()));
    clean.content.printSets = (clean.content.printSets || []).filter(s =>
      Array.isArray(s?.a) && Array.isArray(s?.b) &&
      s.a.every(w => poolKeys.has(String(w).toUpperCase())) &&
      s.b.every(w => poolKeys.has(String(w).toUpperCase()))
    );

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
  }
  function clearError() { if (errBar.style.display !== "none") errBar.style.display = "none"; }

  function field(labelText, control) {
    const f = el("div", "aw-ed-field");
    f.append(el("label", "aw-ed-label", labelText), control);
    return f;
  }
}

// ===== data helpers =====
// Case-insensitive by WORD, same tie-break as the old textarea version: the
// FIRST occurrence wins (keeps its IPA), later duplicates are dropped.
function dedupeRows(list) {
  const seen = new Set();
  return list.filter(w => {
    const k = w.word.toUpperCase();
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function normalize(activity) {
  const a = activity ? JSON.parse(JSON.stringify(activity)) : {};
  a.type = "running_word";
  a.schemaVersion = a.schemaVersion || 1;
  a.title = a.title || "";
  a.instruction = a.instruction || "";
  a.theme = "classic";
  a.options = a.options || {};
  a.content = a.content || {};
  const raw = Array.isArray(a.content.words) ? a.content.words : [];
  a.content.words = raw
    .map(w => typeof w === "string"
      ? { word: cleanWord(w), ipa: "" }
      : { word: cleanWord(w?.word), ipa: String(w?.ipa ?? "").trim() })
    .filter(w => w.word);
  if (!a.content.words.length) a.content.words = [blankItem()];
  if (!Array.isArray(a.content.printSets)) a.content.printSets = [];
  return a;
}
function blankItem() { return { word: "", ipa: "" }; }

function validate(d) {
  if (!d.title) return "Please enter an activity title.";
  if (d.content.words.length < MIN_WORDS) return `Add at least ${MIN_WORDS} words.`;
  return null;
}
