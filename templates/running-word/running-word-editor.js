// =============================================================
// RUNNING WORD EDITOR — the form a teacher uses to create or edit the word pool.
//
//   openRunningWordEditor(container, activity, { onSave, onCancel, header, footer })
//     • same contract as every other AWord editor (quiz / anagram / type-the-answer)
//     • edits a DEEP CLONE, so Cancel leaves the original untouched
//
// WHY ONE TEXTAREA INSTEAD OF A LIST OF BOXES: this activity is a flat pool of
// 80-100 single words with no clues, no answers, no alternates. The other
// editors give each item its own row because each item has several fields; here
// that would mean scrolling through a hundred one-field boxes. A single
// one-word-per-line box is also exactly the shape of the source data — the
// teacher selects the WORD column in the lesson .xlsm and pastes it straight in.
//
// The two teams' printed lists are NOT edited here. They are generated (and
// optionally saved) from the game's own setup screen, where the teacher can see
// the split's numbers and print the sheets in the same breath.
// =============================================================

import { el } from "../../core/utils.js";
import { cleanWord, readSets, MAX_SETS } from "./rw-sets.js";

const MAX_WORDS = 200;      // far above a real lesson pool (~100); a guard, not a target
const MIN_WORDS = 2;

export function openRunningWordEditor(container, activity, { onSave, onCancel, header, footer } = {}) {
  const isNew = !(activity && activity.id);
  const data = normalize(activity);

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
  body.append(el("div", "aw-ed-tip",
    "One word per line. In Excel, select the WORD column and paste (Ctrl+V) straight into the box — " +
    "the whole column lands as separate words. Both teams' lists are drawn from this pool when you " +
    "start the game, so put EVERY word you want either team to get in here."));

  const bulk = el("div", "aw-ed-bulk");
  const dedupeBtn = el("button", "aw-btn", "Remove duplicates");
  const upperBtn = el("button", "aw-btn", "UPPERCASE");
  const sortBtn = el("button", "aw-btn", "Sort A-Z");
  const clearBtn = el("button", "aw-btn aw-ed-bulkdanger", "Delete all words");
  [dedupeBtn, upperBtn, sortBtn, clearBtn].forEach(b => { b.type = "button"; bulk.append(b); });
  body.append(bulk);

  const area = el("textarea", "aw-ed-input aw-rw-ed-area");
  area.rows = 18;
  area.spellcheck = false;
  area.placeholder = "CYLINDER\nLUXURIOUS\nNECESSITY\n…";
  area.value = data.content.words.join("\n");
  area.oninput = () => { updateCount(); clearError(); };
  body.append(area);

  const count = el("div", "aw-ed-qcount");
  body.append(count);
  updateCount();

  dedupeBtn.onclick = () => {
    const before = readWords().length;
    setWords(dedupe(readWords()));
    showInfo(`Removed ${before - readWords().length} duplicate word(s).`);
  };
  upperBtn.onclick = () => { setWords(readWords().map(w => w.toUpperCase())); clearError(); };
  sortBtn.onclick = () => {
    setWords(readWords().sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" })));
    clearError();
  };
  clearBtn.onclick = () => {
    if (!confirm("Delete ALL words?")) return;
    setWords([]);
    showInfo("All words deleted.");
  };

  // ===== saved print sets =====
  // Editing the pool can leave a saved split pointing at words that no longer
  // exist, so the teacher is told what is stored and given a way to drop it.
  const saved = readSets(data);
  if (saved.length) {
    body.append(el("div", "aw-ed-sectionhead", "Saved print sets"));
    const box = el("div", "aw-rw-ed-sets");
    saved.forEach((s, i) => {
      box.append(el("div", "aw-rw-ed-set",
        `SET ${i + 1} — ${s.a.length} + ${s.b.length} words`));
    });
    const dropBtn = el("button", "aw-btn aw-ed-bulkdanger", `Delete ${saved.length} saved set(s)`);
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

  // ---------- helpers ----------
  // Accepts a pasted Excel column (newlines), a pasted row (tabs), or commas —
  // whatever the teacher happens to have copied.
  function readWords() {
    return area.value
      .split(/[\r\n\t]+|,(?=\s)/)
      .map(cleanWord)
      .filter(Boolean)
      .slice(0, MAX_WORDS);
  }
  function setWords(list) { area.value = list.join("\n"); updateCount(); }
  function dedupe(list) {
    const seen = new Set();
    return list.filter(w => {
      const k = w.toUpperCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }
  function updateCount() {
    const words = readWords();
    const dupes = words.length - dedupe(words).length;
    count.textContent = `${words.length} / ${MAX_WORDS} words`
      + (dupes ? `  ·  ${dupes} duplicate(s)` : "")
      + (words.length >= MIN_WORDS ? `  ·  enough for ${Math.floor(words.length / 2)} + ${Math.floor(words.length / 2)} per team` : "");
  }

  // ---------- save / cancel ----------
  cancelBtn.onclick = () => onCancel?.();

  saveBtn.onclick = async () => {
    const clean = JSON.parse(JSON.stringify(data));
    clean.title = (clean.title || "").trim();
    clean.instruction = (clean.instruction || "").trim();
    clean.theme = "classic";
    clean.content.words = dedupe(readWords());

    // A saved split naming a word that is no longer in the pool can't be dealt,
    // so drop any set that no longer fits rather than letting the game fail on it.
    const poolKeys = new Set(clean.content.words.map(w => w.toUpperCase()));
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
  a.content.words = raw.map(w => cleanWord(typeof w === "string" ? w : w?.word)).filter(Boolean);
  if (!Array.isArray(a.content.printSets)) a.content.printSets = [];
  return a;
}

function validate(d) {
  if (!d.title) return "Please enter an activity title.";
  if (d.content.words.length < MIN_WORDS) return `Add at least ${MIN_WORDS} words.`;
  return null;
}
