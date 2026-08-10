// =============================================================
// SPEAKING EDITOR — the form a teacher uses to create or edit a
// Speaking activity.
//
//   openSpeakingEditor(container, activity, { onSave, onCancel, header, footer })
//     • same contract as templates/type-the-answer/type-the-answer-editor.js
//     • onSave(updatedActivity) -> called when the teacher presses Save
//       (already validated); may return a Promise.
//     • onCancel() -> called when the teacher presses Cancel.
//
// Edits a DEEP CLONE of `activity`, so Cancel leaves the original untouched.
//
// Each word needs its TARGET phonemes generated before it can be played
// (core/phonemize.js, eSpeak-NG — runs 100% client-side, no sign-in needed,
// so "Generate phonemes" works even in templates/*/test.html). A word with
// no phonemes yet shows "Not generated" and is silently skipped by the game
// (see speaking.js's item filter) rather than blocking Save —
// same "incomplete rows just don't count" spirit as Anagram's optional
// voice clips.
//
// Reference voice (the "🔊 Listen" a student can play before recording) is
// OPTIONAL, generated via the SAME Kokoro TTS pipeline + Firestore voiceClips
// collection Anagram already uses (core/tts.js + core/voice-clips.js) — that
// DOES require the teacher to be signed in (Firestore write), unlike
// phonemes. A simplified single-voice "Generate voice" button (no picker) —
// Anagram's own editor has a fuller voice-choice popover; this can grow the
// same way later if Teacher Andrew wants it.
// =============================================================

import { el } from "../../core/utils.js";
import { icons } from "../../core/icons.js";
import { phonemizeWord } from "../../core/phonemize.js";
import { generateSpeechDataUrl, DEFAULT_VOICE } from "../../core/tts.js";
import { saveVoiceClip, deleteVoiceClip } from "../../core/voice-clips.js";

const MAX_ITEMS = 50;

export function openSpeakingEditor(container, activity, { onSave, onCancel, header, footer } = {}) {
  const isNew = !(activity && activity.id);
  const data = normalize(activity);

  container.innerHTML = "";
  const page = el("div", "aw-ed");
  if (header) page.append(header);

  const head = el("div", "aw-ed-head");
  const headL = el("div", "aw-ed-headleft");
  headL.append(el("span", "aw-ed-typebadge", "SPEAKING"));
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

  // ===== META =====
  const meta = el("div", "aw-ed-meta");
  const titleInput = el("input", "aw-ed-input");
  titleInput.value = data.title;
  titleInput.placeholder = "e.g. Say It Right — Animals";
  titleInput.oninput = () => { data.title = titleInput.value; clearError(); };
  meta.append(field("Activity Title", titleInput));
  body.append(meta);

  // ===== WORDS =====
  body.append(el("div", "aw-ed-sectionhead", "Words"));
  body.append(buildBulkBar());
  body.append(el("div", "aw-ed-tip",
    "Every word needs its pronunciation generated before students can play it — use “Generate phonemes” " +
    "below (one click does the whole list). “Generate voice” is optional — it lets a student hear the " +
    "correct pronunciation before recording their own."));
  const wWrap = el("div", "aw-ed-questions");
  body.append(wWrap);
  renderWords();

  if (footer) page.append(footer);
  container.append(page);
  titleInput.focus();

  // ---------- rendering ----------
  function renderWords() {
    wWrap.innerHTML = "";
    data.content.items.forEach((it, i) => wWrap.append(wordCard(it, i)));
    const addW = el("button", "aw-ed-addq", "+ Add word");
    addW.type = "button";
    addW.disabled = data.content.items.length >= MAX_ITEMS;
    addW.onclick = () => {
      if (data.content.items.length < MAX_ITEMS) { data.content.items.push(blankItem()); renderWords(); }
    };
    wWrap.append(addW);
    wWrap.append(el("div", "aw-ed-qcount", `${data.content.items.length} / ${MAX_ITEMS} words`));
  }

  function wordCard(it, i) {
    const card = el("div", "aw-ed-qcard");

    const top = el("div", "aw-ed-qtop");
    top.append(el("span", "aw-ed-qnum", `Word ${i + 1}`));
    const topActions = el("div", "aw-ed-qactions");
    const dupW = el("button", "aw-ed-del aw-ed-dup", "Duplicate");
    dupW.type = "button";
    dupW.disabled = data.content.items.length >= MAX_ITEMS;
    dupW.onclick = () => {
      if (data.content.items.length >= MAX_ITEMS) return;
      const copy = JSON.parse(JSON.stringify(it));
      delete copy.voice;   // don't share one voice clip id between two rows
      data.content.items.splice(i + 1, 0, copy);
      renderWords();
    };
    const delW = el("button", "aw-ed-del", "Remove");
    delW.type = "button";
    delW.disabled = data.content.items.length <= 1;
    delW.onclick = () => {
      const clip = it.voice;
      data.content.items.splice(i, 1);
      renderWords();
      if (clip) deleteVoiceClip(clip).catch(() => {});
    };
    topActions.append(dupW, delW);
    top.append(topActions);
    card.append(top);

    const row = el("div", "aw-spk-ed-row");

    const wordInput = el("input", "aw-ed-input");
    wordInput.value = it.word;
    wordInput.placeholder = "Word (e.g. elephant)";
    wordInput.oninput = () => {
      it.word = wordInput.value;
      it.phonemes = "";   // stale the moment the word text changes — must be regenerated
      if (it.voice) { deleteVoiceClip(it.voice).catch(() => {}); it.voice = undefined; }
      phWrap.className = "aw-spk-ed-phstatus";
      phWrap.textContent = "Not generated";
      voiceBtn.textContent = "🔊 Generate voice";
      clearError();
    };
    row.append(field("Word", wordInput));

    const clueInput = el("input", "aw-ed-input");
    clueInput.value = it.clue || "";
    clueInput.placeholder = "Optional hint shown to the student";
    clueInput.oninput = () => { it.clue = clueInput.value; clearError(); };
    row.append(field("Clue (optional)", clueInput));

    card.append(row);

    // ---- phonemes (target pronunciation) ----
    const phRow = el("div", "aw-spk-ed-phrow");
    const phWrap = el("div", it.phonemes ? "aw-spk-ed-phstatus is-ready" : "aw-spk-ed-phstatus",
      it.phonemes ? `/${it.phonemes}/` : "Not generated");
    const phBtn = el("button", "aw-btn aw-spk-ed-genbtn", it.phonemes ? "Regenerate" : "Generate phonemes");
    phBtn.type = "button";
    phBtn.onclick = () => generateOnePhoneme(it, phBtn, phWrap);
    phRow.append(phWrap, phBtn);
    card.append(phRow);

    // ---- optional reference voice ----
    const voiceBtn = el("button", "aw-btn aw-spk-ed-genbtn",
      it.voice ? "🔊 Regenerate voice" : "🔊 Generate voice");
    voiceBtn.type = "button";
    voiceBtn.onclick = () => generateOneVoice(it, voiceBtn);
    card.append(voiceBtn);

    return card;
  }

  async function generateOnePhoneme(it, btn, statusEl) {
    if (!it.word.trim()) { showError("Type the word first."); return; }
    btn.disabled = true;
    const label = btn.textContent;
    btn.textContent = "Working…";
    try {
      it.phonemes = await phonemizeWord(it.word.trim());
      statusEl.className = "aw-spk-ed-phstatus is-ready";
      statusEl.textContent = it.phonemes ? `/${it.phonemes}/` : "Not generated";
    } catch (e) {
      showError("Could not generate phonemes — try again.");
    } finally {
      btn.disabled = false;
      btn.textContent = it.phonemes ? "Regenerate" : label;
    }
  }

  async function generateOneVoice(it, btn) {
    if (!it.word.trim()) { showError("Type the word first."); return; }
    btn.disabled = true;
    const label = btn.textContent;
    btn.textContent = "Generating…";
    try {
      const dataUrl = await generateSpeechDataUrl(it.word.trim(), DEFAULT_VOICE);
      it.voice = await saveVoiceClip({ id: it.voice || undefined, text: it.word.trim(), voiceId: DEFAULT_VOICE, audioDataUrl: dataUrl });
      btn.textContent = "🔊 Regenerate voice";
    } catch (e) {
      showError(e && e.code === "aw/signed-out"
        ? "Sign in first to generate a reference voice (phonemes don't need this)."
        : "Could not generate voice — try again.");
      btn.textContent = label;
    } finally {
      btn.disabled = false;
    }
  }

  async function generateAllPhonemes(bar) {
    const todo = data.content.items.filter(it => it.word.trim() && !it.phonemes);
    if (!todo.length) { showInfo("Every word already has its pronunciation generated."); return; }
    bar.disabled = true;
    const label = bar.textContent;
    for (let i = 0; i < todo.length; i++) {
      bar.textContent = `Generating… ${i + 1}/${todo.length}`;
      try { todo[i].phonemes = await phonemizeWord(todo[i].word.trim()); } catch (e) { /* leave this one blank, move on */ }
    }
    bar.disabled = false;
    bar.textContent = label;
    renderWords();
    showInfo(`Generated pronunciation for ${todo.length} word(s).`);
  }

  // ---------- save / cancel ----------
  cancelBtn.onclick = () => onCancel?.();

  saveBtn.onclick = async () => {
    const clean = JSON.parse(JSON.stringify(data));
    clean.title = clean.title.trim();
    clean.instruction = (clean.instruction || "").trim();
    clean.theme = "classic";
    clean.content.items.forEach(it => { it.word = it.word.trim(); it.clue = (it.clue || "").trim(); });
    clean.content.items = clean.content.items.filter(it => it.word !== "");

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

  function buildBulkBar() {
    const bar = el("div", "aw-ed-bulk");
    const genAllBtn = el("button", "aw-btn aw-btn-primary", "Generate phonemes for all words");
    genAllBtn.type = "button";
    genAllBtn.onclick = () => generateAllPhonemes(genAllBtn);
    const clearBtn = el("button", "aw-btn aw-ed-bulkdanger", "Delete all words");
    clearBtn.type = "button";
    clearBtn.onclick = () => {
      if (!confirm("Delete ALL words?")) return;
      const clips = data.content.items.map(it => it.voice).filter(Boolean);
      data.content.items = [blankItem()];
      renderWords();
      showInfo("All words deleted.");
      clips.forEach(id => deleteVoiceClip(id).catch(() => {}));
    };
    bar.append(genAllBtn, clearBtn);
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
  a.type = "speaking";
  a.schemaVersion = a.schemaVersion || 1;
  a.title = a.title || "";
  a.instruction = a.instruction || "";
  a.theme = "classic";
  a.options = a.options || {};
  a.content = a.content || {};
  let items = Array.isArray(a.content.items) ? a.content.items : [];
  if (items.length === 0) items = [blankItem()];
  a.content.items = items.map(it => ({
    word: it.word || "",
    clue: it.clue || "",
    phonemes: it.phonemes || "",
    voice: it.voice || undefined
  }));
  return a;
}
function blankItem() { return { word: "", clue: "", phonemes: "" }; }

function validate(d) {
  if (!d.title) return "Please enter an activity title.";
  if (!d.content.items.length) return "Add at least one word.";
  const withPhonemes = d.content.items.filter(it => it.phonemes);
  if (!withPhonemes.length) return "Generate phonemes for at least one word before saving.";
  return null;
}
