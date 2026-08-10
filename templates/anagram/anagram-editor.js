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

const MAX_ITEMS = 100;

// Must match the literal fallback string anagram.js shows in-game (its
// clueEl) when a row has no Clue -- so the voice clip says the same thing
// the student reads on screen.
const GENERIC_CLUE_TEXT = "Unscramble the word";

export function openAnagramEditor(container, activity, { onSave, onCancel, header, footer } = {}) {
  const isNew = !(activity && activity.id);
  const data = normalize(activity);
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
    // Swapping changes what Clue IS, so any voice clip (generated for the
    // pre-swap clue) is now stale -- same reasoning as the clueInput.oninput
    // guard in itemRow() below, just applied to every row at once here.
    data.content.items.forEach(it => {
      const tmp = it.word; it.word = it.clue; it.clue = tmp;
      it.voice = ""; it.voiceId = ""; it.hideText = false;
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
    wordInput.oninput = () => { it.word = wordInput.value; clearError(); };
    wordInput.addEventListener("paste", e => onRowPaste(e, ii));
    const clueInput = el("input", "aw-anagram-ed-clue");
    clueInput.value = it.clue;
    clueInput.placeholder = "Optional clue / definition";
    clueInput.oninput = () => {
      it.clue = clueInput.value;
      clearError();
      // The voice clip reads the Clue, so editing it invalidates any clip
      // already generated for the OLD text -- clear the reference (the
      // orphaned Firestore doc, if any, is not deleted here; see
      // core/voice-clips.js's file comment).
      if (it.voice) {
        it.voice = ""; it.voiceId = ""; it.hideText = false;
        setMicState(micBtn, false); setHideTextState(hideTextBtn, it); closeVoicePopover();
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
    const micBtn = iconBtn(it.voice ? icons.soundOn : icons.mic,
      it.voice ? "Clue voice added — click to preview, change or remove" : "Add a spoken clue");
    if (it.voice) micBtn.classList.add("is-active");
    micBtn.onclick = () => toggleVoicePopover(micBtn, hideTextBtn, it);
    // Hide text (10/8/2026) — needs a voice to mean anything (disabled
    // without one, see setHideTextState); ON hides the Clue text in-game and
    // relies on the voice alone (anagram.js shows "Listen for the clue"
    // instead). Defaults ON the moment a voice is generated (single row or
    // Generate all) — see genBtn.onclick/buildGenerateAllPopover — and
    // forced back OFF whenever the voice goes away (Remove voice, Clue
    // edited, Swap Columns, Delete all voices) so text is never hidden with
    // nothing spoken to replace it.
    const hideTextBtn = iconBtn(icons.eye, "");
    setHideTextState(hideTextBtn, it);
    hideTextBtn.onclick = () => {
      if (!it.voice) return;
      it.hideText = !it.hideText;
      setHideTextState(hideTextBtn, it);
    };
    const imgBtn = iconBtn(icons.image, "Add image (coming soon)");
    imgBtn.onclick = () => showInfo("Images — coming soon.");
    iconsWrap.append(micBtn, hideTextBtn, imgBtn, el("span", "aw-anagram-ed-gap"));

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

  // Hide-text toggle icon state — disabled (and forced off) without a
  // voice, since "hide the clue, play voice only" makes no sense with
  // nothing to play. `it` is read fresh each call rather than passing
  // separate booleans so every call site (row build, Generate/Regenerate,
  // Remove voice, bulk Generate/Delete all) stays a one-liner.
  function setHideTextState(btn, it) {
    const hidden = !!(it.voice && it.hideText);
    if (!it.voice) it.hideText = false;   // enforce the invariant even if a caller forgot to
    btn.innerHTML = hidden ? icons.eyeOff : icons.eye;
    btn.classList.toggle("is-active", hidden);
    btn.disabled = !it.voice;
    const title = !it.voice
      ? "Hide clue text (needs a voice first)"
      : hidden ? "Clue text hidden in-game — voice only (click to show text)"
               : "Clue text visible in-game (click to hide — voice only)";
    btn.title = title;
    btn.setAttribute("aria-label", title);
  }

  // What Generate/Regenerate will actually say for this row RIGHT NOW —
  // shared by the popover's live hint line and the genBtn click handler
  // itself, so the two can never drift apart.
  function speakTextFor(it) {
    return (it.clue || "").trim() || GENERIC_CLUE_TEXT;
  }

  function toggleVoicePopover(micBtn, hideTextBtn, it) {
    if (voicePopEl && voicePopEl._forItem === it) { closeVoicePopover(); return; }
    buildVoicePopover(micBtn, hideTextBtn, it);
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

  function buildVoicePopover(micBtn, hideTextBtn, it) {
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
        it.voice = ""; it.voiceId = ""; it.hideText = false;
        setMicState(micBtn, false); setHideTextState(hideTextBtn, it);
        buildVoicePopover(micBtn, hideTextBtn, it);
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
        it.hideText = true;   // default ON the moment a voice exists (teacher's request, 10/8/2026)
        setMicState(micBtn, true); setHideTextState(hideTextBtn, it);
        buildVoicePopover(micBtn, hideTextBtn, it);
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
    select.value = DEFAULT_VOICE;
    selectField.append(select);
    pop.append(selectField);

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
      const voiceId = select.value;
      const skipExisting = skipChk.checked;
      const targets = data.content.items.filter(it => !skipExisting || !it.voice);
      if (!targets.length) { status.textContent = "Nothing to generate — every row already has a voice."; return; }

      let cancelled = false;
      runCancelBtn.onclick = () => {
        cancelled = true;
        runCancelBtn.disabled = true;
        runCancelBtn.textContent = "Cancelling…";
      };

      pop._running = true;
      select.disabled = true; skipChk.disabled = true;
      cancelBtn2.style.display = "none"; goBtn.style.display = "none";
      runCancelBtn.style.display = "inline-flex"; runCancelBtn.disabled = false; runCancelBtn.textContent = "Cancel";
      progressWrap.style.display = "block";
      progressFill.style.width = "0%";

      let done = 0, failed = 0, signedOut = false;
      for (const it of targets) {
        if (cancelled) break;
        status.textContent = `Generating ${done + failed + 1} / ${targets.length}…`;
        const text = speakTextFor(it);
        try {
          const dataUrl = await generateSpeechDataUrl(text, voiceId, () => {});
          const id = await saveVoiceClip({ id: it.voice || undefined, text, voiceId, audioDataUrl: dataUrl });
          it.voice = id; it.voiceId = voiceId;
          it.hideText = true;   // default ON, same as the single-row Generate (teacher's request, 10/8/2026)
          done++;
        } catch (e) {
          if (e && e.code === "aw/signed-out") { signedOut = true; break; }
          failed++;
        }
        progressFill.style.width = `${Math.round(((done + failed) / targets.length) * 100)}%`;
      }
      pop._running = false;

      if (cancelled) {
        renderItems();
        showInfo(`Cancelled — generated voice for ${done} row(s) before stopping.`);
        return;
      }
      if (signedOut) {
        status.textContent = "Please sign in first.";
        select.disabled = false; skipChk.disabled = false;
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
      data.content.items = [blankItem()];
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
    // validate on a CLEANED copy (drop fully-blank rows) so the live model
    // the teacher is editing is never mutated by a failed save attempt.
    const clean = JSON.parse(JSON.stringify(data));
    clean.title = clean.title.trim();
    clean.instruction = (clean.instruction || "").trim();
    clean.theme = "classic";
    clean.content.items = clean.content.items
      .map(it => ({
        word: (it.word || "").trim(), clue: (it.clue || "").trim(),
        voice: it.voice || "", voiceId: it.voiceId || "",
        hideText: !!(it.voice && it.hideText)
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
    clearBtn.onclick = () => toggleBulkPopover(clearBtn, "deleteWords");
    bar.append(clearBtn);

    const genAllBtn = el("button", "aw-btn aw-btn-primary", "Generate all voices");
    genAllBtn.type = "button";
    genAllBtn.onclick = () => toggleBulkPopover(genAllBtn, "generate");
    bar.append(genAllBtn);

    const delAllVoicesBtn = el("button", "aw-btn aw-ed-bulkdanger", "Delete all voices");
    delAllVoicesBtn.type = "button";
    delAllVoicesBtn.onclick = () => toggleBulkPopover(delAllVoicesBtn, "delete");
    bar.append(delAllVoicesBtn);

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
    word: it.word || "", clue: it.clue || "", voice: it.voice || "", voiceId: it.voiceId || "",
    hideText: !!(it.voice && it.hideText)   // hideText only ever means anything alongside a voice
  }));
  return a;
}
function blankItem() { return { word: "", clue: "", voice: "", voiceId: "", hideText: false }; }

function validate(d) {
  if (!d.title) return "Please enter an activity title.";
  if (!d.content.items.length) return "Add at least one word.";
  return null;
}
