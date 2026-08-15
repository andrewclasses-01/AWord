// =============================================================
// ANAGRAM EDITOR — the form a teacher uses to create or edit an Anagram
// activity. Same contract as templates/quiz/quiz-editor.js:
//   openAnagramEditor(container, activity, { onSave, onCancel, header, footer })
// Reuses the SHARED editor page chrome from core/app.css (.aw-ed-* header/
// title field/bulk bar/count). The per-row layout (Word | Clue table,
// icon buttons, drag-to-reorder) is Anagram-specific CSS in anagram.css
// (.aw-anagram-ed-*), styled after Wordwall's real "Edit Content" table.
//
// SCOPE (same simplification as Quiz, per Teacher Andrew): this page edits
// ONLY the title + the word list (word + optional clue). Theme is always
// Classic; default options (timer/mode/allCaps/...) live in Settings;
// per-act options are tweaked from the in-game Options panel. The image
// button is still a placeholder (teacher said "we'll discuss it later") —
// it just shows an info banner, no upload wired up yet. The mic button
// (10/8/2026, revised 10/8/2026) is real: it opens a small popover to
// generate a Kokoro TTS clip, stored via core/voice-clips.js and played
// back in-game by anagram.js's "listen" button next to the clue. The clip
// reads the row's CLUE (or the generic "Unscramble the word" fallback if
// the Clue is blank) -- NOT the Word -- because the Word is exactly what
// the student is trying to solve for; speaking it aloud would give the
// answer away.
//
// Row reordering uses the SAME native HTML5 drag-and-drop idiom as
// main.js's folder/act drag-drop (draggable + dragstart/dragover/drop), so
// it stays consistent with the rest of the app instead of inventing a new
// pattern. Only the drag-HANDLE icon is draggable (not the whole row) so
// clicking/selecting text in the Word/Clue inputs is unaffected.
// =============================================================

import { el, formatTime } from "../../core/utils.js";
import { icons } from "../../core/icons.js";
import { VOICES, DEFAULT_VOICE, generateSpeechDataUrl } from "../../core/tts.js";
import { saveVoiceClip, getVoiceClip, deleteVoiceClip } from "../../core/voice-clips.js";
// The mix RULES (gender balance, no-voice-used-twice-as-often, the shared 4
// defaults, the option-list format) live in core since Đợt 142 — the Excel
// import panel needs the exact same rules and can't import from a template.
// This file keeps its own MARKUP (a popover anchored under the button);
// only the decisions are shared.
import { MIX_DEFAULTS, fillVoiceOptions, planFor } from "../../core/voice-mix.js";
import { activeVariant, variantsOf, voiceVariantsOf, clueOf, voiceOf, variantLabel } from "../../core/content-view.js";

const MAX_ITEMS = 100;

// Must match the literal fallback string anagram.js shows in-game (its
// clueEl) when a row has no Clue -- so the voice clip says the same thing
// the student reads on screen.
const GENERIC_CLUE_TEXT = "Unscramble the word";

export function openAnagramEditor(container, activity, { onSave, onCancel, header, footer } = {}) {
  const isNew = !(activity && activity.id);
  // Which CLUE SETS this act carries (Đợt 145/165). `variantKeys` null =
  // an ordinary act — every act this editor opened before Đợt 165, and it
  // takes exactly the same path it always did (no tabs, single Clue column).
  // `currentKey` is which set the table is showing RIGHT NOW — starts on
  // whichever one the act is currently set to play, but (unlike before)
  // the teacher can now switch it with the tabs in the bulk bar; see
  // switchTab()/commitCurrentTab()/loadCurrentTab() below. `defaultKey` never
  // changes — it is always the FIRST set, the one the flat `.clue` mirror
  // (library card, print sheet, any not-yet-variant-aware reader) shows.
  const variantKeys = variantsOf(activity && activity.content);
  const defaultKey = variantKeys ? variantKeys[0] : null;
  let currentKey = variantKeys ? (activeVariant(activity) || variantKeys[0]) : null;
  const data = normalize(activity, variantKeys, currentKey);
  let draggingIndex = null;   // module-scoped to this editor instance's drag session
  // Voice popover state — declared up here (not next to the functions that
  // use it, further down) because renderItems() calls closeVoicePopover()
  // and renderItems() runs during initial setup, BEFORE execution would
  // otherwise reach a `let` placed near the popover functions (TDZ error).
  let voicePopEl = null;
  let voiceBackdropEl = null;     // dim+blur overlay behind the Generate-all popover, if open (see buildGenerateAllPopover)
  let voicePreviewAudio = null;   // currently-playing preview, so a second Play doesn't overlap the first
  // Item -> its Clue <input>, so onVoicePopOutside (below) can tell "clicked
  // into the very Clue box this popover's hint is tracking" apart from
  // "clicked away" — the popover must NOT close in the first case, or the
  // live-updating hint (voicePopEl._updateHint) could never actually be
  // seen updating while the teacher types.
  const clueInputByItem = new WeakMap();

  // Waveform visualizer state (10/8/2026) -- `waveAudioCtx` is a lazy
  // singleton used ONLY for offline decodeAudioData calls (see
  // loadWaveform below), never connected to playback. `waveRafId`/
  // `waveCanvasEl`/`waveTimeEl` track the CURRENTLY animating playhead (at
  // most one preview plays at a time). Declared here for the same TDZ
  // reason as voicePopEl above: closeVoicePopover()/stopVoicePreview()
  // reference these and can run before execution would otherwise reach a
  // `let` placed near the waveform helper functions further down.
  let waveAudioCtx = null;
  let waveRafId = null;
  let waveCanvasEl = null; // the <canvas> whose playhead is currently animating, if any
  let waveTimeEl = null;   // its time label, ditto

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
  // The bulk bar is rebuilt (not just re-rendered in place) every time the
  // active clue-set tab changes — see switchTab() — because which buttons it
  // shows (Generate/Delete all voices) and which tab is highlighted both
  // depend on `currentKey`. `bulkBar` always points at whichever bar element
  // is currently in the DOM, so switchTab() can swap it out with replaceWith.
  let bulkBar = buildBulkBar();
  body.append(bulkBar);

  const headRow = el("div", "aw-anagram-ed-headrow");
  const headCols = el("div", "aw-anagram-ed-headcols");
  headCols.append(el("span", "aw-anagram-ed-headcol", "Word"), el("span", "aw-anagram-ed-headcol", "Clue"));
  headRow.append(headCols);
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
    const voiceOk = tabHasVoice();
    data.content.items.forEach((it, ii) => iWrap.append(itemRow(it, ii, voiceOk)));
    const addI = el("button", "aw-anagram-ed-addrow", null);
    addI.type = "button";
    addI.innerHTML = "+ Add a new word";
    addI.disabled = data.content.items.length >= MAX_ITEMS;
    addI.onclick = () => {
      if (data.content.items.length < MAX_ITEMS) { data.content.items.push(blankItem(!!variantKeys)); renderItems(); }
    };
    iWrap.append(addI);
    const count = el("div", "aw-ed-qcount", `${data.content.items.length} / ${MAX_ITEMS} words`);
    iWrap.append(count);
  }

  // Does the ACTIVE tab support a spoken clip? Ordinary (non-variant) acts
  // always did; a variant act only offers voice on the sets in
  // `content.voiceVariants` (ENG1/ENG2 — Vietnamese/IPA clues are excluded,
  // see core/content-view.js) — so VI1/VI2 tabs show no mic, no Generate/
  // Delete-all-voices buttons.
  function tabHasVoice() {
    return !variantKeys || (voiceVariantsOf(data.content) || []).includes(currentKey);
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

  function itemRow(it, ii, voiceOk) {
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
    clueInput.placeholder = variantKeys
      ? `${variantLabel(data.content, currentKey)} clue / definition`
      : "Optional clue / definition";
    clueInput.oninput = () => {
      it.clue = clueInput.value;
      clearError();
      // The voice clip reads the Clue, so editing it invalidates any clip
      // already generated for the OLD text -- clear the reference (the
      // orphaned Firestore doc, if any, is not deleted here; see
      // core/voice-clips.js's file comment).
      if (it.voice) {
        it.voice = ""; it.voiceId = "";
        if (micBtn) setMicState(micBtn, false);
        closeVoicePopover();
      } else if (voicePopEl && voicePopEl._forItem === it && voicePopEl._updateHint) {
        // Popover already open for THIS row (no voice yet) -- keep its
        // "Will speak" preview line live instead of making the teacher
        // close/reopen it to see the updated text.
        voicePopEl._updateHint();
      }
    };
    clueInput.addEventListener("paste", e => onRowPaste(e, ii));
    clueInputByItem.set(it, clueInput);
    box.append(wordInput, clueInput);
    row.append(box);

    const iconsWrap = el("div", "aw-anagram-ed-icons");
    // Vietnamese clue sets (VI1/VI2) carry no spoken clip — an English Kokoro
    // voice misreads them (see core/content-view.js's voiceVariantsOf) — so
    // there is nothing for a mic button to do on those tabs.
    let micBtn = null;
    if (voiceOk) {
      micBtn = iconBtn(it.voice ? icons.soundOn : icons.mic,
        it.voice ? "Clue voice added — click to preview, change or remove" : "Add a spoken clue");
      if (it.voice) micBtn.classList.add("is-active");
      micBtn.onclick = () => toggleVoicePopover(micBtn, it);
      iconsWrap.append(micBtn);
    }
    const imgBtn = iconBtn(icons.image, "Add image (coming soon)");
    imgBtn.onclick = () => showInfo("Images — coming soon.");
    iconsWrap.append(imgBtn, el("span", "aw-anagram-ed-gap"));

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
  // TTS clip that reads a row's Clue). A single shared popover element (not
  // one per row) toggled open/closed, positioned under whichever mic button
  // (or bulk-action button, see buildGenerateAllPopover/buildDeleteAllPopover
  // below) was clicked. Success/failure update the SAME mic button in place
  // (icon + title) instead of calling renderItems() — a full re-render would
  // replace every row's DOM, including the very button this popover is
  // anchored to, breaking its position. (voicePopEl/voicePreviewAudio/the
  // wave* variables are declared near the top of openAnagramEditor, not
  // here — see the comment there.)
  function closeVoicePopover() {
    if (voicePopEl) { voicePopEl.remove(); voicePopEl = null; }
    if (voiceBackdropEl) { voiceBackdropEl.remove(); voiceBackdropEl = null; }
    document.removeEventListener("pointerdown", onVoicePopOutside, true);
    stopPlayhead();
  }
  function onVoicePopOutside(e) {
    if (!voicePopEl || voicePopEl.contains(e.target)) return;
    // While "Generate all voices" is actively running, outside clicks must
    // NOT close it — the only way to stop mid-run is the small red Cancel
    // button inside the popover itself (see buildGenerateAllPopover).
    if (voicePopEl._running) return;
    // Exception: clicking into the very Clue box this popover's hint is
    // tracking should focus it for typing, not close the popover out from
    // under the teacher (see clueInputByItem's comment above).
    const liveClueInput = voicePopEl._forItem && clueInputByItem.get(voicePopEl._forItem);
    if (liveClueInput && e.target === liveClueInput) return;
    closeVoicePopover();
  }
  function stopVoicePreview() {
    if (voicePreviewAudio) { voicePreviewAudio.pause(); voicePreviewAudio = null; }
    stopPlayhead();
  }
  function setMicState(micBtn, hasVoice) {
    micBtn.innerHTML = hasVoice ? icons.soundOn : icons.mic;
    micBtn.classList.toggle("is-active", hasVoice);
    const title = hasVoice ? "Clue voice added — click to preview, change or remove" : "Add a spoken clue";
    micBtn.title = title;
    micBtn.setAttribute("aria-label", title);
  }

  // What Generate/Regenerate will actually say for this row RIGHT NOW —
  // shared by the popover's live hint line and the genBtn click handler
  // itself, so the two can never drift apart.
  function speakTextFor(it) {
    return (it.clue || "").trim() || GENERIC_CLUE_TEXT;
  }

  function toggleVoicePopover(micBtn, it) {
    if (voicePopEl && voicePopEl._forItem === it) { closeVoicePopover(); return; }
    buildVoicePopover(micBtn, it);
  }

  // ---------- waveform visualizer (10/8/2026, redrawn as a FIXED picture of
  // the whole clip — Adobe-Audition style, not a live frequency readout) —
  // decodes the clip's raw PCM ONCE via decodeAudioData into a per-pixel
  // peak-amplitude profile, drawn as a static bar chart the instant the
  // popover opens (whether or not Play has been pressed yet), with a moving
  // playhead line + time label layered on top DURING actual playback. The
  // AudioContext here is used ONLY for offline decoding — it is never
  // connected to anything audible, so it can't affect or be affected by the
  // real playback (`new Audio(...)` + `.play()`), which is untouched.
  // Cosmetic only throughout: any failure here just leaves the canvas blank
  // — real playback (already started by the caller) is unaffected.
  function ensureWaveAudioCtx() {
    if (!waveAudioCtx) waveAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return waveAudioCtx;
  }
  function paintWaveform(canvas, cols, playedFrac) {
    const cctx = canvas.getContext("2d");
    const w = canvas.width, h = canvas.height, mid = h / 2;
    cctx.clearRect(0, 0, w, h);
    const playedX = playedFrac * w;
    for (let x = 0; x < cols.length; x++) {
      const barH = Math.max(1, cols[x] * (h - 4));
      cctx.fillStyle = x <= playedX ? "#2f6fed" : "#c3d2e8";
      cctx.fillRect(x, mid - barH / 2, 1, barH);
    }
    cctx.fillStyle = "#1c3d8f";
    cctx.fillRect(Math.min(w - 1.5, Math.max(0, playedX)), 0, 1.5, h);
  }
  async function loadWaveform(canvas, timeEl, voiceId) {
    try {
      const clip = await getVoiceClip(voiceId);
      if (!clip || !clip.audio) return;
      const arrBuf = await (await fetch(clip.audio)).arrayBuffer();
      const audioBuf = await ensureWaveAudioCtx().decodeAudioData(arrBuf);
      const raw = audioBuf.getChannelData(0);
      const w = canvas.width;
      const cols = new Float32Array(w);
      const step = Math.max(1, Math.floor(raw.length / w));
      for (let x = 0; x < w; x++) {
        let peak = 0;
        const start = x * step, end = Math.min(raw.length, start + step);
        for (let j = start; j < end; j++) { const v = Math.abs(raw[j]); if (v > peak) peak = v; }
        cols[x] = peak;
      }
      canvas._cols = cols;
      canvas._duration = audioBuf.duration;
      paintWaveform(canvas, cols, 0);
      if (timeEl) timeEl.textContent = `0:00 / ${formatTime(Math.round(audioBuf.duration))}`;
    } catch { /* leave the canvas blank — cosmetic only */ }
  }
  function stopPlayhead() {
    if (waveRafId) { cancelAnimationFrame(waveRafId); waveRafId = null; }
    if (waveCanvasEl && waveCanvasEl._cols) paintWaveform(waveCanvasEl, waveCanvasEl._cols, 0);
    if (waveTimeEl && waveCanvasEl && waveCanvasEl._duration != null) {
      waveTimeEl.textContent = `0:00 / ${formatTime(Math.round(waveCanvasEl._duration))}`;
    }
    waveCanvasEl = null; waveTimeEl = null;
  }
  function startPlayhead(audioEl, canvas, timeEl) {
    stopPlayhead();
    if (!canvas._cols) return;   // picture not decoded yet — playback still works, just no moving cursor this time
    waveCanvasEl = canvas; waveTimeEl = timeEl;
    const draw = () => {
      if (audioEl.paused || audioEl.ended) { stopPlayhead(); return; }
      const frac = audioEl.duration ? audioEl.currentTime / audioEl.duration : 0;
      paintWaveform(canvas, canvas._cols, frac);
      if (timeEl) {
        timeEl.textContent =
          `${formatTime(Math.round(audioEl.currentTime))} / ${formatTime(Math.round(audioEl.duration || canvas._duration || 0))}`;
      }
      waveRafId = requestAnimationFrame(draw);
    };
    draw();
  }

  function buildVoicePopover(micBtn, it) {
    closeVoicePopover();
    stopVoicePreview();

    const pop = el("div", "aw-anagram-ed-voicepop");
    pop._forItem = it;

    pop.append(el("div", "aw-anagram-ed-voicetitle", "Clue voice"));

    // Live preview of exactly what Generate will speak — updates as the
    // teacher types in the Clue box (see clueInput.oninput's call to
    // voicePopEl._updateHint above), so there's never a surprise between
    // what this line says and what the clip actually says.
    const hint = el("div", "aw-anagram-ed-voicehint");
    pop._updateHint = () => { hint.textContent = `Will speak: "${speakTextFor(it)}"`; };
    pop._updateHint();
    pop.append(hint);

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

    let waveCanvas = null, waveTimeLabel = null;
    if (it.voice) {
      // The static waveform picture loads immediately (doesn't wait for
      // Play) so the teacher sees it the instant the popover opens.
      waveCanvas = el("canvas", "aw-anagram-ed-wave");
      waveCanvas.width = 228; waveCanvas.height = 40;
      pop.append(waveCanvas);
      waveTimeLabel = el("div", "aw-anagram-ed-wavetime", "Loading…");
      pop.append(waveTimeLabel);
      loadWaveform(waveCanvas, waveTimeLabel, it.voice);
    }

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
            if (waveCanvas) startPlayhead(voicePreviewAudio, waveCanvas, waveTimeLabel);
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
      const text = speakTextFor(it);
      genBtn.disabled = true; select.disabled = true;
      if (playBtn) playBtn.disabled = true;
      if (delBtn) delBtn.disabled = true;
      status.textContent = "Loading voice model… (first time only, ~86MB)";
      try {
        const dataUrl = await generateSpeechDataUrl(text, select.value, p => {
          if (p && /\.onnx$/.test(p.file || "") && p.progress != null) {
            status.textContent = `Loading voice model… ${Math.round(p.progress)}%`;
          } else if (p && p.status === "done") {
            status.textContent = "Generating…";
          }
        });
        status.textContent = "Saving…";
        const id = await saveVoiceClip({ id: it.voice || undefined, text, voiceId: select.value, audioDataUrl: dataUrl });
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

    positionPopover(pop, micBtn);
  }

  // Shared by buildVoicePopover above and the two bulk popovers below —
  // fixed-position under whichever button opened it, clamped to the
  // viewport, closes on an outside click.
  function positionPopover(pop, anchorBtn) {
    document.body.append(pop);
    const r = anchorBtn.getBoundingClientRect();
    pop.style.top = Math.min(r.bottom + 6, window.innerHeight - 40) + "px";
    pop.style.left = Math.max(8, Math.min(r.left, window.innerWidth - 272)) + "px";
    voicePopEl = pop;
    setTimeout(() => document.addEventListener("pointerdown", onVoicePopOutside, true), 0);
  }

  function toggleBulkPopover(anchorBtn, kind) {
    if (voicePopEl && voicePopEl._bulkKind === kind) { closeVoicePopover(); return; }
    if (kind === "deleteWords") buildDeleteAllWordsPopover(anchorBtn);
    else if (kind === "delete") buildDeleteAllPopover(anchorBtn);
    else buildGenerateAllPopover(anchorBtn);
  }

  // ----- MIX VOICE — the assignment plan (Đợt 132, teacher) -----
  // `buildVoicePlan` + the 4 shared defaults now live in core/voice-mix.js
  // (Đợt 142) so the Excel-import panel obeys byte-for-byte the same rules:
  // as many Male rows as Female (off by at most 1), and no voice used
  // noticeably more than the others. This popover just collects the state
  // and hands it to `planFor()` below.

  // "Generate all voices" — one popover for the whole list (not anchored to
  // a row), same visual language as the per-row voice popover. Runs
  // sequentially (the Kokoro model is a lazy singleton anyway — see
  // core/tts.js — so back-to-back generateSpeechDataUrl calls only pay the
  // ~86MB load once) with a live "Generating X / Y…" status. Stops on the
  // FIRST sign-out error (every subsequent save would fail identically —
  // no point burning WASM time generating audio that can't be saved) but
  // otherwise keeps going past a single row's failure so one bad row can't
  // block the rest of a 100-word list.
  function buildGenerateAllPopover(anchorBtn) {
    closeVoicePopover();
    stopVoicePreview();

    // Dim + blur the rest of the page behind this ONE popover — teacher's
    // request (10/8/2026): this is the only bulk action that runs a
    // possibly-long batch job, so it gets the "you're in a modal now" cue
    // the others don't. `positionPopover()` (below) still anchors the
    // popover box itself under the button; the backdrop is a separate
    // full-viewport layer BEHIND it, removed together in closeVoicePopover().
    voiceBackdropEl = el("div", "aw-anagram-ed-backdrop");
    document.body.append(voiceBackdropEl);

    const pop = el("div", "aw-anagram-ed-voicepop");
    pop._bulkKind = "generate";

    pop.append(el("div", "aw-anagram-ed-voicetitle", "Generate all voices"));

    const total = data.content.items.length;
    const already = data.content.items.filter(it => it.voice).length;
    pop.append(el("div", "aw-anagram-ed-voicehint",
      `${total} row(s) total${already ? `, ${already} already have a voice` : ""}. Reads each row's Clue ` +
      `(or "${GENERIC_CLUE_TEXT}" if the Clue is blank).`));

    const skipLabel = el("label", "aw-anagram-ed-voicecheck");
    const skipChk = document.createElement("input");
    skipChk.type = "checkbox";
    skipChk.checked = true;
    skipLabel.append(skipChk, document.createTextNode(" Skip rows that already have a voice"));
    pop.append(skipLabel);

    // The option-list builder (real name first, then gender+grade in parens)
    // is core/voice-mix.js's `fillVoiceOptions` — the single dropdown below,
    // the 4 mix pickers here, and the import panel all render identically.

    const selectField = el("div", "aw-anagram-ed-voicefield");
    selectField.append(el("label", "aw-anagram-ed-voicelabel", "Voice"));
    const select = el("select", "aw-anagram-ed-voiceselect");
    fillVoiceOptions(select, null);
    select.value = DEFAULT_VOICE;
    selectField.append(select);
    pop.append(selectField);

    // ----- MIX VOICE (Đợt 132, teacher) -----
    const mixLabel = el("label", "aw-anagram-ed-voicecheck");
    const mixChk = document.createElement("input");
    mixChk.type = "checkbox";
    mixLabel.append(mixChk, document.createTextNode(" Mix voice — take turns through a few voices"));
    pop.append(mixLabel);

    // ⚠️ Plain wrapper class, deliberately NOT "aw-anagram-ed-voicefield" —
    // that class is shared by every leaf row inside it (the 4 pickers,
    // accentField), and re-using it here too made a `querySelectorAll` over
    // that class match this wrapper as an extra, mislabelled "field" (caught
    // while testing, Đợt 132). No dedicated CSS needed: a plain block is
    // exactly what a column of already block/flex children wants.
    const mixField = el("div", "aw-anagram-ed-mixwrap");
    mixField.style.display = "none";

    // 4 manual pickers, defaults per the teacher's own pick (Isabella /
    // George / Alice / Fable — all en-gb, matching Random's own UK default
    // below; the list itself is MIX_DEFAULTS in core/voice-mix.js so the
    // import panel opens with the same four). Each excludes whatever the
    // OTHER 3 currently hold, refreshed on every change so there is never a
    // way to pick the same voice twice.
    const mixRows = MIX_DEFAULTS.map((defId, i) => {
      const row = el("div", "aw-anagram-ed-voicefield");
      row.style.marginBottom = ".4rem";
      row.append(el("label", "aw-anagram-ed-voicelabel", `Voice ${i + 1}`));
      const sel = el("select", "aw-anagram-ed-voiceselect");
      fillVoiceOptions(sel, null);
      sel.value = defId;
      row.append(sel);
      mixField.append(row);
      return { row, select: sel };
    });
    function refreshMixSelects() {
      const chosen = mixRows.map(r => r.select.value);
      mixRows.forEach((r, i) => {
        const keep = r.select.value;
        fillVoiceOptions(r.select, chosen.filter((_, j) => j !== i));
        r.select.value = keep;   // its own id was never in its own exclude list, so this always sticks
      });
    }
    mixRows.forEach(r => { r.select.onchange = refreshMixSelects; });
    refreshMixSelects();

    // Random — replaces the 4 boxes with a single UK/US pick, mixing every
    // catalog voice of that accent instead of just 4 chosen ones.
    const randomLabel = el("label", "aw-anagram-ed-voicecheck");
    const randomChk = document.createElement("input");
    randomChk.type = "checkbox";
    randomLabel.append(randomChk, document.createTextNode(" Random — mix ALL voices of an accent"));
    mixField.append(randomLabel);

    const accentField = el("div", "aw-anagram-ed-voicefield");
    accentField.style.display = "none";
    let mixAccent = "en-gb";   // UK default (teacher) — matches the 4 manual defaults above
    const ukLabel = el("label", "aw-anagram-ed-voicecheck");
    const ukRadio = document.createElement("input");
    ukRadio.type = "radio"; ukRadio.name = "aw-mix-accent"; ukRadio.checked = true;
    ukLabel.append(ukRadio, document.createTextNode(" UK accents"));
    const usLabel = el("label", "aw-anagram-ed-voicecheck");
    const usRadio = document.createElement("input");
    usRadio.type = "radio"; usRadio.name = "aw-mix-accent";
    usLabel.append(usRadio, document.createTextNode(" US accents"));
    ukRadio.onchange = () => { if (ukRadio.checked) mixAccent = "en-gb"; };
    usRadio.onchange = () => { if (usRadio.checked) mixAccent = "en-us"; };
    accentField.append(ukLabel, usLabel);
    mixField.append(accentField);
    pop.append(mixField);

    mixChk.onchange = () => {
      const on = mixChk.checked;
      selectField.style.display = on ? "none" : "";
      mixField.style.display = on ? "" : "none";
    };
    randomChk.onchange = () => {
      const on = randomChk.checked;
      mixRows.forEach(r => { r.row.style.display = on ? "none" : ""; });
      accentField.style.display = on ? "" : "none";
    };

    const status = el("div", "aw-anagram-ed-voicestatus");
    pop.append(status);

    // Progress bar — hidden until Generate is pressed, shows % of the
    // TARGET list (not the whole activity) converted so far.
    const progressWrap = el("div", "aw-anagram-ed-voiceprogress");
    const progressFill = el("div", "aw-anagram-ed-voiceprogressfill");
    progressWrap.append(progressFill);
    progressWrap.style.display = "none";
    pop.append(progressWrap);

    const btnRow = el("div", "aw-anagram-ed-voicebtns");
    const cancelBtn2 = el("button", "aw-btn", "Cancel");
    cancelBtn2.type = "button";
    cancelBtn2.onclick = () => closeVoicePopover();
    const goBtn = el("button", "aw-btn aw-btn-primary", "Generate");
    goBtn.type = "button";
    btnRow.append(cancelBtn2, goBtn);
    // Small red Cancel — the ONLY control left active once a run is under
    // way (teacher's request): everything else disables and outside clicks
    // are ignored (see onVoicePopOutside's `_running` check) so the batch
    // can't be dismissed by accident, but a deliberate stop is still one
    // click away. Soft-cancel: can't abort a generateSpeechDataUrl call
    // that's already in flight (no cancellation hook in kokoro-js), so it
    // sets a flag the loop checks BETWEEN words and stops before starting
    // the next one — the current word always finishes first.
    const runCancelBtn = el("button", "aw-anagram-ed-runcancel", "Cancel");
    runCancelBtn.type = "button";
    runCancelBtn.style.display = "none";
    btnRow.append(runCancelBtn);
    pop.append(btnRow);

    goBtn.onclick = async () => {
      const skipExisting = skipChk.checked;
      const targets = data.content.items.filter(it => !skipExisting || !it.voice);
      if (!targets.length) { status.textContent = "Nothing to generate — every row already has a voice."; return; }

      // Đợt 132 — resolve to either a single string (unchanged path) or a
      // pre-computed per-row plan, indexed by this row's position in
      // `targets` (matches how generateVoicesBatch's `index` argument is
      // defined — see its own comment). The plan is built ONCE here, before
      // the run starts, precisely so the Male/Female balance is a property
      // of the whole batch rather than something re-decided row by row.
      // (Đợt 142: the same `planFor` the import panel calls.)
      const { voiceId } = planFor({
        mix: mixChk.checked, random: randomChk.checked, accent: mixAccent,
        mixIds: mixRows.map(r => r.select.value), singleId: select.value
      }, targets.length);

      let cancelled = false;
      runCancelBtn.onclick = () => {
        cancelled = true;
        runCancelBtn.disabled = true;
        runCancelBtn.textContent = "Cancelling…";
      };

      pop._running = true;
      select.disabled = true; skipChk.disabled = true;
      mixChk.disabled = true; randomChk.disabled = true;
      mixRows.forEach(r => { r.select.disabled = true; });
      ukRadio.disabled = true; usRadio.disabled = true;
      cancelBtn2.style.display = "none"; goBtn.style.display = "none";
      runCancelBtn.style.display = "inline-flex"; runCancelBtn.disabled = false; runCancelBtn.textContent = "Cancel";
      progressWrap.style.display = "block";
      progressFill.style.width = "0%";

      // core/voice-batch.js runs this on a pooled set of Workers (webgpu-
      // first per Worker, see core/tts.js) instead of one call at a time on
      // this thread — a real speedup on a large word list, not just a
      // DRY-up (10/8/2026, teacher asked for parallel generation here too).
      const { generateVoicesBatch } = await import("../../core/voice-batch.js");
      const { done, failed, signedOut } = await generateVoicesBatch(targets, voiceId, {
        textFor: speakTextFor,
        isCancelled: () => cancelled,
        onProgress: (d, f, total) => {
          status.textContent = `Generating ${d + f} / ${total}…`;
          progressFill.style.width = `${Math.round(((d + f) / total) * 100)}%`;
        }
      });
      pop._running = false;

      if (cancelled) {
        renderItems();
        showInfo(`Cancelled — generated voice for ${done} row(s) before stopping.`);
        return;
      }
      if (signedOut) {
        status.textContent = "Please sign in first.";
        select.disabled = false; skipChk.disabled = false;
        mixChk.disabled = false; randomChk.disabled = false;
        mixRows.forEach(r => { r.select.disabled = false; });
        ukRadio.disabled = false; usRadio.disabled = false;
        cancelBtn2.style.display = ""; goBtn.style.display = "";
        runCancelBtn.style.display = "none";
        progressWrap.style.display = "none";
        return;
      }
      renderItems();
      showInfo(`Generated voice for ${done} row(s)${failed ? `, ${failed} failed — please try again` : ""}.`);
    };

    positionPopover(pop, anchorBtn);
  }

  // "Delete all voices" — small confirm popover (same idiom as the native
  // confirm() used by "Delete all words", but this one needs to show a
  // live count first, which confirm() can't do). Stops on the first
  // sign-out error WITHOUT clearing any `it.voice` from that point on, so a
  // signed-out attempt can't desync the UI from what's actually still in
  // Firestore.
  function buildDeleteAllPopover(anchorBtn) {
    closeVoicePopover();
    stopVoicePreview();

    const pop = el("div", "aw-anagram-ed-voicepop");
    pop._bulkKind = "delete";

    pop.append(el("div", "aw-anagram-ed-voicetitle", "Remove all voices?"));
    const withVoice = data.content.items.filter(it => it.voice).length;
    const status = el("div", "aw-anagram-ed-voicestatus",
      withVoice ? `This removes the generated voice from ${withVoice} row(s). This cannot be undone.`
                 : "No rows currently have a voice.");
    pop.append(status);

    const btnRow = el("div", "aw-anagram-ed-voicebtns");
    const cancelBtn2 = el("button", "aw-btn", "Cancel");
    cancelBtn2.type = "button";
    cancelBtn2.onclick = () => closeVoicePopover();
    btnRow.append(cancelBtn2);

    if (withVoice) {
      const delAllGo = el("button", "aw-btn aw-ed-bulkdanger", "Delete all");
      delAllGo.type = "button";
      delAllGo.onclick = async () => {
        delAllGo.disabled = true; cancelBtn2.disabled = true;
        const targets = data.content.items.filter(it => it.voice);
        let signedOut = false;
        for (const it of targets) {
          try {
            await deleteVoiceClip(it.voice);
          } catch (e) {
            if (e && e.code === "aw/signed-out") { signedOut = true; break; }
            // otherwise ignore — clip may already be gone (same tolerance as the per-row Remove voice)
          }
          it.voice = ""; it.voiceId = ""; it.hideText = false;
        }
        if (signedOut) {
          status.textContent = "Please sign in first.";
          delAllGo.disabled = false; cancelBtn2.disabled = false;
          return;
        }
        renderItems();
        showInfo(`Removed voice from ${targets.length} row(s).`);
      };
      btnRow.append(delAllGo);
    }
    pop.append(btnRow);

    positionPopover(pop, anchorBtn);
  }

  // "Delete all words" — same confirm-popover idiom as "Delete all voices"
  // above (replaces the old native confirm(), teacher's request 10/8/2026),
  // shown when the "Delete all words" button in the bulk bar is clicked.
  // Purely local (no Firestore calls — words/clues never lived server-side
  // outside a Save), so there's no sign-out branch to handle.
  function buildDeleteAllWordsPopover(anchorBtn) {
    closeVoicePopover();
    stopVoicePreview();

    const pop = el("div", "aw-anagram-ed-voicepop");
    pop._bulkKind = "deleteWords";

    pop.append(el("div", "aw-anagram-ed-voicetitle", "Delete all words?"));
    const n = data.content.items.length;
    pop.append(el("div", "aw-anagram-ed-voicestatus",
      `This removes all ${n} word(s) (and any voice generated for them) and starts over with a single ` +
      `blank row. This cannot be undone.`));

    const btnRow = el("div", "aw-anagram-ed-voicebtns");
    const cancelBtn2 = el("button", "aw-btn", "Cancel");
    cancelBtn2.type = "button";
    cancelBtn2.onclick = () => closeVoicePopover();
    btnRow.append(cancelBtn2);

    const delAllGo = el("button", "aw-btn aw-ed-bulkdanger", "Delete all");
    delAllGo.type = "button";
    delAllGo.onclick = () => {
      data.content.items = [blankItem(!!variantKeys)];
      renderItems();
      showInfo("All words deleted.");
    };
    btnRow.append(delAllGo);
    pop.append(btnRow);

    positionPopover(pop, anchorBtn);
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
    // Fold the tab currently on screen back into its own set BEFORE cloning —
    // otherwise only the last-viewed tab's edits would be in `it.clue`/
    // `it.voice`, and every OTHER tab would save whatever it held before this
    // session opened (see commitCurrentTab()/switchTab() below).
    commitCurrentTab();
    // validate on a CLEANED copy (drop fully-blank rows) so the live model
    // the teacher is editing is never mutated by a failed save attempt.
    const clean = JSON.parse(JSON.stringify(data));
    clean.title = clean.title.trim();
    clean.instruction = (clean.instruction || "").trim();
    clean.theme = "classic";
    clean.content.items = clean.content.items
      .map(it => {
        const word = (it.word || "").trim();
        // Ordinary act — unchanged since the editor was written.
        if (!variantKeys) {
          const clue = (it.clue || "").trim();
          return { word, clue, voice: it.voice || "", voiceId: it.voiceId || "", hideText: !!(it.voice && it.hideText) };
        }
        // Đợt 165 — every set this row carries rides along together
        // (`clues`/`voices`, kept in step by commitCurrentTab() on every tab
        // switch and again here). `clue` stays on the row as the MIRROR of the
        // DEFAULT set (what the library card, the print sheet and any
        // not-yet-variant-aware reader show).
        const clues = {};
        Object.keys(it.clues || {}).forEach(k => { clues[k] = String(it.clues[k] || "").trim(); });
        return { word, clue: clues[defaultKey] || "", clues, voices: { ...(it.voices || {}) } };
      })
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
  // Icon-only (no text) per the teacher's request, 10/8/2026 — the tooltip/
  // aria-label still carries the full label for hover/screen readers.
  // Order left-to-right: Generate all voices - Delete all voices - Delete
  // all words - (right-aligned) the clue-set tabs, when this act has more
  // than one (Đợt 165).
  function buildBulkBar() {
    const bar = el("div", "aw-ed-bulk");
    const voiceOk = tabHasVoice();

    if (voiceOk) {
      const genAllBtn = bulkIconBtn(icons.wand, "Generate all voices", "is-primary");
      genAllBtn.onclick = () => toggleBulkPopover(genAllBtn, "generate");
      bar.append(genAllBtn);

      const delAllVoicesBtn = bulkIconBtn(icons.micOff, "Delete all voices", "is-danger");
      delAllVoicesBtn.onclick = () => toggleBulkPopover(delAllVoicesBtn, "delete");
      bar.append(delAllVoicesBtn);
    }

    const clearBtn = bulkIconBtn(icons.trash, "Delete all words", "is-danger");
    clearBtn.onclick = () => toggleBulkPopover(clearBtn, "deleteWords");
    bar.append(clearBtn);

    // Đợt 165 — one tab per clue set this act carries (ENG1/ENG2/VI1/VI2 —
    // only whichever the act actually has, see variantsOf()). Clicking a tab
    // switches the whole Word/Clue table to that set; the mic column comes
    // and goes with it (tabHasVoice()). Word add/remove/reorder always act on
    // the ONE shared `data.content.items` array, so every set stays lined up
    // row-for-row no matter which tab a change was made from.
    if (variantKeys) {
      const tabs = el("div", "aw-anagram-ed-tabs");
      variantKeys.forEach(k => {
        const tab = el("button", "aw-anagram-ed-tab" + (k === currentKey ? " is-active" : ""),
          variantLabel(data.content, k));
        tab.type = "button";
        tab.onclick = () => switchTab(k);
        tabs.append(tab);
      });
      bar.append(tabs);
    }

    return bar;
  }
  function bulkIconBtn(svg, title, extraClass) {
    const b = el("button", "aw-anagram-ed-bulkicon" + (extraClass ? " " + extraClass : ""), svg);
    b.type = "button";
    b.title = title;
    b.setAttribute("aria-label", title);
    return b;
  }

  // ---------- clue-set tabs (Đợt 165) ----------
  // `it.clue`/`it.voice`/`it.voiceId` are always the WORKING fields for
  // whichever tab is active — itemRow()/the voice popovers read and write
  // them exactly as they did before this act ever had more than one set.
  // `it.clues`/`it.voices` are the side-band holding every set at once;
  // commitCurrentTab() is what folds the working fields into it, and
  // loadCurrentTab() is what pulls the NEW tab's values back out. Both walk
  // the SAME `data.content.items` array in place — nothing is ever copied
  // into a second array — so adding, removing or dragging a row (which all
  // operate on that one array) automatically carries every set along
  // together, and editing Word (never part of `clues`) is already shared.
  function commitCurrentTab() {
    if (!variantKeys) return;
    data.content.items.forEach(it => {
      if (!it.clues) it.clues = {};
      it.clues[currentKey] = it.clue || "";
      if (it.voice) {
        if (!it.voices) it.voices = {};
        it.voices[currentKey] = { voice: it.voice, voiceId: it.voiceId || "" };
      } else if (it.voices) {
        delete it.voices[currentKey];
      }
    });
  }
  function loadCurrentTab() {
    if (!variantKeys) return;
    data.content.items.forEach(it => {
      // NOT clueOf() here — its fallback to `it.clue` when a set is missing
      // is meant for the ONE-TIME read off freshly-loaded storage (see
      // normalize() below), where `.clue` is a stable mirror of the default
      // set. Mid-session `it.clue` is a SCRATCH field that changes on every
      // tab switch, so reusing that fallback here would leak the tab just
      // left into a set that was never actually filled in (caught by testing
      // a fresh row: filled on VI1, switched to ENG1, saw the VI1 text).
      it.clue = (it.clues && it.clues[currentKey] != null) ? it.clues[currentKey] : "";
      const clip = voiceOf(it, currentKey);
      it.voice = clip.voice;
      it.voiceId = clip.voiceId;
    });
  }
  // Slide the table over to another clue set: fold the outgoing tab's edits
  // in, swap `currentKey`, pull the incoming tab's values out, then rebuild
  // the bar (tab highlight + mic column) and the rows. The fade+slide follows
  // the project's animate()-with-setTimeout-fallback rule (HUONG DAN CORE) —
  // `swap` is guarded so a hidden tab losing the `finish` event can't leave
  // the table stuck mid-swap.
  function switchTab(newKey) {
    if (!variantKeys || newKey === currentKey) return;
    closeVoicePopover(); stopVoicePreview();
    const dir = variantKeys.indexOf(newKey) > variantKeys.indexOf(currentKey) ? 1 : -1;
    const dx = 16 * dir;
    let done = false;
    const swap = () => {
      if (done) return; done = true;
      commitCurrentTab();
      currentKey = newKey;
      loadCurrentTab();
      const newBar = buildBulkBar();
      bulkBar.replaceWith(newBar);
      bulkBar = newBar;
      renderItems();
      iWrap.animate(
        [{ opacity: 0, transform: `translateX(${-dx}px)` }, { opacity: 1, transform: "translateX(0)" }],
        { duration: 180, easing: "cubic-bezier(.22,.9,.3,1)" });
    };
    const out = iWrap.animate(
      [{ opacity: 1, transform: "translateX(0)" }, { opacity: 0, transform: `translateX(${dx}px)` }],
      { duration: 130, easing: "ease-in", fill: "forwards" });
    out.onfinish = swap;
    setTimeout(swap, 160);
  }

  // ---------- small helpers ----------
  function field(labelText, control) {
    const f = el("div", "aw-ed-field");
    f.append(el("label", "aw-ed-label", labelText), control);
    return f;
  }
}

// ===== data helpers =====
// ⭐ Đợt 145/165 — a vocabulary act carries several CLUE SETS
// (core/content-view.js). `variantKeys` says which ones this act has;
// `currentKey` is which one the table is showing right now (switchable via
// the tabs — see switchTab() above). Every row keeps ALL its sets on
// `clues`/`voices` regardless of which tab is active, so adding, deleting,
// sorting and drag-reordering rows always carry every set together. Before
// Đợt 145, normalize() rebuilt every row from five fixed keys — which, on a
// merged act, would have thrown three quarters of its content away the first
// time anyone pressed Save.
function normalize(activity, variantKeys, currentKey) {
  const a = activity ? JSON.parse(JSON.stringify(activity)) : {};
  a.type = "anagram";
  a.schemaVersion = a.schemaVersion || 1;
  a.title = a.title || "";
  a.instruction = a.instruction || "";
  a.theme = "classic";                 // theme is always Classic now
  a.options = a.options || {};
  a.content = a.content || {};
  let items = Array.isArray(a.content.items) ? a.content.items : [];
  if (items.length === 0) items = [blankItem(!!variantKeys)];
  a.content.items = items.map(it => {
    if (!variantKeys) {
      return {
        word: it.word || "", clue: it.clue || "",
        voice: it.voice || "", voiceId: it.voiceId || "",
        hideText: !!(it.voice && it.hideText)   // hideText only ever means anything alongside a voice
      };
    }
    const clip = voiceOf(it, currentKey);
    return {
      word: it.word || "",
      clue: clueOf(it, currentKey),
      voice: clip.voice, voiceId: clip.voiceId,
      clues: { ...(it.clues || {}) }, voices: { ...(it.voices || {}) }
    };
  });
  return a;
}
function blankItem(withVariants) {
  return withVariants
    ? { word: "", clue: "", voice: "", voiceId: "", clues: {}, voices: {} }
    : { word: "", clue: "", voice: "", voiceId: "", hideText: false };
}

function validate(d) {
  if (!d.title) return "Please enter an activity title.";
  if (!d.content.items.length) return "Add at least one word.";
  return null;
}
