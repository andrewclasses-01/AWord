// =============================================================
// FIND THE GAP EDITOR — same page chrome + contract as the other editors:
//   openFtgEditor(container, activity, { onSave, onCancel, header, footer })
//
// What the teacher does here:
//   • Title · Audio code (checked against the myLesson-audio store: ✓ + length)
//   • One row per spoken line: speaker · the line as WORD CHIPS (tap a word =
//     gap on/off) · start → end seconds · ▶ (plays exactly that slice) · a
//     switch "in the game or not"
//   • Per gap: extra accepted spellings (comma-separated)
//   • Paste a transcript ("Male: I've got the passports here." per line) to
//     add lines in bulk; "Suggest gaps" marks every word found in a pasted
//     vocabulary list (the lesson's WORDS sheet) — the tool
//     tools/ftg-prepare.py fills timecodes + suggestions automatically, this
//     screen is where they get reviewed.
// Saves `content.audio` + `content.items[{speaker,text,gaps,start,end,enabled}]`.
// =============================================================

import { el } from "../../core/utils.js";
import { icons } from "../../core/icons.js";
import { loadAudio, createSegmentPlayer } from "./ftg-audio.js";
import { tokenize, gappable, audioUrlOf, normalize, fmtTime, escapeHtml, MAX_ITEMS } from "./ftg-shared.js";

// gaps in the editor: Map<startWord, { span, answers[] }> — span > 1 = a phrase gap

export function openFtgEditor(container, activity, { onSave, onCancel, header, footer } = {}) {
  const isNew = !(activity && activity.id);
  const data = normalizeAct(activity);   // { title, instruction, options, content, audio, items:[{speaker,text,gaps:Map(word->answers[]),start,end,enabled}] }
  let player = null, playerUrl = "";
  let rowsEl = null;

  container.innerHTML = "";
  const page = el("div", "aw-ed aw-ftg-ed");
  if (header) page.append(header);

  const head = el("div", "aw-ed-head");
  const headL = el("div", "aw-ed-headleft");
  headL.append(el("span", "aw-ed-typebadge", "FIND THE GAP"));
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

  // ----- title + audio -----
  const meta = el("div", "aw-ed-meta aw-ftg-ed-meta");
  const titleInput = el("input", "aw-ed-input");
  titleInput.value = data.title;
  titleInput.placeholder = "e.g. LSA2-S1.T1.P1-2-3 — Find the gap";
  titleInput.oninput = () => { data.title = titleInput.value; clearError(); };
  meta.append(field("Activity Title", titleInput));

  const audioWrap = el("div", "aw-ftg-ed-audio");
  const audioInput = el("input", "aw-ed-input");
  audioInput.value = data.audio;
  audioInput.placeholder = "Lesson code in the audio store (LSA2-S1.T1.P1-2-3) or an mp3 URL";
  const audioStatus = el("span", "aw-ftg-ed-audiostatus", "");
  const audioCheck = el("button", "aw-btn aw-ftg-ed-check", "Check");
  audioCheck.type = "button";
  audioInput.oninput = () => { data.audio = audioInput.value.trim(); audioStatus.textContent = ""; audioStatus.className = "aw-ftg-ed-audiostatus"; clearError(); };
  audioCheck.onclick = () => checkAudio();
  audioWrap.append(audioInput, audioCheck, audioStatus);
  meta.append(field("Audio", audioWrap));
  body.append(meta);

  // ----- bulk tools -----
  body.append(el("div", "aw-ed-sectionhead", "Lines and gaps"));
  body.append(el("div", "aw-ftg-ed-hint",
    "Tap a word to make it a gap (tap again to undo). Gaps are filled in order ₁ ₂ ₃. " +
    "▶ plays exactly that line's slice of the audio — fix the start / end seconds until it sounds right."));
  body.append(buildBulkBar());

  // ----- rows -----
  rowsEl = el("div", "aw-ed-questions aw-ftg-ed-rows");
  body.append(rowsEl);
  const addBtn = el("button", "aw-ed-addq", "+ Add a line");
  addBtn.type = "button";
  addBtn.onclick = () => {
    if (data.items.length >= MAX_ITEMS) { showError(`At most ${MAX_ITEMS} lines.`); return; }
    const last = data.items[data.items.length - 1];
    data.items.push({ speaker: "", text: "", gaps: new Map(), start: last ? last.end : 0, end: last ? last.end + 3 : 3, enabled: true });
    renderRows();
    rowsEl.lastElementChild?.querySelector(".aw-ftg-ed-text")?.focus();
  };
  const countEl = el("div", "aw-ed-qcount", "");
  body.append(addBtn, countEl);
  if (footer) page.append(footer);
  container.append(page);

  renderRows();
  if (data.audio) checkAudio(true);

  // =================================================================
  function renderRows() {
    rowsEl.innerHTML = "";
    data.items.forEach((it, i) => rowsEl.append(buildRow(it, i)));
    const gaps = data.items.reduce((n, it) => n + it.gaps.size, 0);
    const off = data.items.filter(it => !it.enabled).length;
    countEl.textContent = `${data.items.length} line${data.items.length === 1 ? "" : "s"} · ${gaps} gap${gaps === 1 ? "" : "s"}` + (off ? ` · ${off} switched off` : "");
  }

  function buildRow(it, i) {
    const card = el("div", "aw-ed-qcard aw-ftg-ed-row" + (it.enabled ? "" : " is-off"));

    const topRow = el("div", "aw-ed-qtop");
    topRow.append(el("div", "aw-ed-qnum", String(i + 1)));
    const speaker = el("input", "aw-ed-input aw-ftg-ed-speaker");
    speaker.value = it.speaker; speaker.placeholder = "Speaker";
    speaker.oninput = () => { it.speaker = speaker.value; };
    topRow.append(speaker);

    const times = el("div", "aw-ftg-ed-times");
    const startIn = el("input", "aw-ed-input aw-ftg-ed-time"); startIn.type = "number"; startIn.step = "0.05"; startIn.min = "0"; startIn.value = String(it.start);
    const endIn = el("input", "aw-ed-input aw-ftg-ed-time"); endIn.type = "number"; endIn.step = "0.05"; endIn.min = "0"; endIn.value = String(it.end);
    startIn.oninput = () => { it.start = Number(startIn.value) || 0; };
    endIn.oninput = () => { it.end = Number(endIn.value) || 0; };
    const playBtn = el("button", "aw-iconbtn aw-ftg-ed-play", icons.playBig || icons.soundOn);
    playBtn.type = "button"; playBtn.title = "Play this line";
    playBtn.onclick = () => playSlice(it, playBtn);
    times.append(startIn, el("span", "aw-ftg-ed-arrow", "→"), endIn, playBtn);
    topRow.append(times);

    const qa = el("div", "aw-ed-qactions");
    const onOff = el("button", "aw-btn aw-ftg-ed-onoff", it.enabled ? "In game" : "Off");
    onOff.type = "button"; onOff.title = it.enabled ? "This line is played — tap to leave it out" : "Left out — tap to play it";
    onOff.onclick = () => { it.enabled = !it.enabled; renderRows(); };
    const del = el("button", "aw-ed-del", "Remove");
    del.type = "button"; del.title = "Delete this line";
    del.onclick = () => { data.items.splice(i, 1); renderRows(); };
    qa.append(onOff, del);
    topRow.append(qa);
    card.append(topRow);

    // the line: editable text + word chips
    const text = el("textarea", "aw-ed-input aw-ed-qtext aw-ftg-ed-text");
    text.rows = 1; text.value = it.text; text.placeholder = "The spoken line";
    text.oninput = () => { it.text = text.value; retargetGaps(it); paintChips(); };
    card.append(text);
    const chips = el("div", "aw-ftg-ed-chips");
    card.append(chips);
    const gapBox = el("div", "aw-ftg-ed-gaps");
    card.append(gapBox);

    const gapSpan = w => Math.max(1, Number(it.gaps.get(w)?.span) || 1);
    const gapAnswers = w => (it.gaps.get(w)?.answers) || [];
    const inGap = w => [...it.gaps.keys()].find(s => w >= s && w < s + gapSpan(s));
    function paintChips() {
      chips.innerHTML = "";
      const toks = tokenize(it.text);
      for (let w = 0; w < toks.length; w++) {
        const t = toks[w];
        const start = inGap(w);
        if (start !== undefined) {
          // one merged chip for the whole phrase gap
          const n = gapSpan(start);
          const chip = el("button", "aw-ftg-ed-chip is-gap", escapeHtml(toks.slice(start, start + n).map(x => x.raw).join(" ")));
          chip.type = "button";
          chip.title = n > 1 ? "Phrase gap — tap to remove" : "Gap — tap to remove";
          chip.onclick = () => { it.gaps.delete(start); paintChips(); renderCount(); };
          chips.append(chip);
          w = start + n - 1;
          continue;
        }
        const chip = el("button", "aw-ftg-ed-chip" + (gappable(t) ? "" : " is-dead"), escapeHtml(t.raw));
        chip.type = "button";
        chip.disabled = !gappable(t);
        chip.onclick = () => { it.gaps.set(w, { span: 1, answers: [] }); paintChips(); renderCount(); };
        chips.append(chip);
      }
      // per-gap row: label · phrase width (+ / −) · extra answers
      gapBox.innerHTML = "";
      [...it.gaps.keys()].sort((a, b) => a - b).forEach((w, k) => {
        const n = gapSpan(w);
        if (!toks[w]) return;
        const row = el("div", "aw-ftg-ed-gaprow");
        row.append(el("span", "aw-ftg-ed-gaplabel", `${k + 1} · ${escapeHtml(toks.slice(w, w + n).map(x => x.core).join(" "))}`));
        const minus = el("button", "aw-btn aw-ftg-ed-spanbtn", "−"); minus.type = "button"; minus.title = "One word fewer";
        const plus = el("button", "aw-btn aw-ftg-ed-spanbtn", "+ word"); plus.type = "button"; plus.title = "Extend the gap by the next word (a phrase)";
        const nextFree = w + n < toks.length && inGap(w + n) === undefined && gappable(toks[w + n]);
        minus.disabled = n <= 1; plus.disabled = !nextFree;
        minus.onclick = () => { it.gaps.get(w).span = n - 1; paintChips(); };
        plus.onclick = () => { it.gaps.get(w).span = n + 1; paintChips(); };
        row.append(minus, plus);
        const extra = el("input", "aw-ed-input aw-ftg-ed-extra");
        extra.placeholder = "other accepted spellings, comma-separated (e.g. 15, fifteen)";
        extra.value = gapAnswers(w).join(", ");
        extra.oninput = () => { it.gaps.get(w).answers = extra.value.split(",").map(s => s.trim()).filter(Boolean); };
        row.append(extra);
        gapBox.append(row);
      });
    }
    paintChips();
    return card;
  }
  function renderCount() {
    const gaps = data.items.reduce((n, it) => n + it.gaps.size, 0);
    const off = data.items.filter(it => !it.enabled).length;
    countEl.textContent = `${data.items.length} lines · ${gaps} gaps` + (off ? ` · ${off} switched off` : "");
  }

  // The text changed: keep every gap that still points at the same word (by
  // its core), drop the rest — an edit must not silently shift a gap onto a
  // different word.
  function retargetGaps(it) {
    const toks = tokenize(it.text);
    const next = new Map();
    it.gaps.forEach((g, w) => {
      const old = it._cores ? it._cores[w] : null;
      const fit = start => ({ span: Math.max(1, Math.min(g.span || 1, toks.length - start)), answers: g.answers || [] });
      if (toks[w] && (!old || normalize(toks[w].core) === normalize(old))) { next.set(w, fit(w)); return; }
      if (old) { const j = toks.findIndex((t, idx) => !next.has(idx) && normalize(t.core) === normalize(old)); if (j >= 0) next.set(j, fit(j)); }
    });
    it.gaps = next;
    it._cores = toks.map(t => t.core);
  }

  // ----- audio helpers -----
  async function checkAudio(silent) {
    const url = audioUrlOf(data.audio);
    if (!url) { if (!silent) showError("Enter the audio code first."); return; }
    audioStatus.textContent = "Checking…"; audioStatus.className = "aw-ftg-ed-audiostatus";
    audioCheck.disabled = true;
    try {
      const bu = await loadAudio(url);
      const dur = await new Promise((res, rej) => {
        const a = new Audio(); a.preload = "metadata";
        a.onloadedmetadata = () => res(a.duration);
        a.onerror = () => rej(new Error("bad audio"));
        a.src = bu;
      });
      audioStatus.textContent = "✓ " + fmtTime(dur);
      audioStatus.className = "aw-ftg-ed-audiostatus is-ok";
      if (player && playerUrl !== url) { player.destroy(); player = null; }
      if (!player) { player = createSegmentPlayer(bu); playerUrl = url; }
    } catch (e) {
      audioStatus.textContent = "✗ not found";
      audioStatus.className = "aw-ftg-ed-audiostatus is-bad";
    }
    audioCheck.disabled = false;
  }
  async function playSlice(it, btn) {
    if (!player) { await checkAudio(); if (!player) return; }
    if (player.isPlaying()) { player.stop(); return; }
    rowsEl.querySelectorAll(".aw-ftg-ed-play.is-playing").forEach(b => b.classList.remove("is-playing"));
    btn.classList.add("is-playing");
    const off = player.onState(on => { if (!on) { btn.classList.remove("is-playing"); off(); } });
    await player.play(it.start, it.end);
  }

  // ----- bulk bar: paste transcript · suggest gaps · clear gaps · delete all -----
  function buildBulkBar() {
    const bar = el("div", "aw-ed-bulk");
    const pasteBtn = el("button", "aw-btn", "Paste transcript");
    pasteBtn.type = "button";
    pasteBtn.onclick = () => openPasteModal({
      title: "Paste the transcript",
      hint: "One spoken line per row, optionally with the speaker in front: \"Male: I've got the passports here.\" " +
            "Lines are added after the ones you have; set their start / end seconds afterwards (or let tools/ftg-prepare.py do it).",
      onApply(txt) {
        let added = 0;
        txt.split(/\r?\n/).map(s => s.trim()).filter(Boolean).forEach(line => {
          if (data.items.length >= MAX_ITEMS) return;
          const m = line.match(/^([A-Za-z][\w .'-]{0,24}):\s*(.+)$/);
          const speaker = m ? m[1].trim() : "", text = m ? m[2].trim() : line;
          const last = data.items[data.items.length - 1];
          data.items.push({ speaker, text, gaps: new Map(), start: last ? last.end : 0, end: (last ? last.end : 0) + 3, enabled: true });
          added++;
        });
        renderRows();
        showInfo(`Added ${added} line${added === 1 ? "" : "s"}.`);
      }
    });
    const suggestBtn = el("button", "aw-btn", "Suggest gaps from word list");
    suggestBtn.type = "button";
    suggestBtn.onclick = () => openPasteModal({
      title: "Word list",
      hint: "Paste the lesson's vocabulary (one word or phrase per line, or comma-separated). Every line whose text contains one of them gets that word marked as a gap — you can still tap any chip to change it.",
      onApply(txt) {
        const words = txt.split(/[\n,;]+/).map(s => normalize(s)).filter(Boolean);
        if (!words.length) return;
        let marked = 0;
        data.items.forEach(it => {
          const toks = tokenize(it.text);
          toks.forEach((t, w) => {
            if (!gappable(t) || it.gaps.has(w)) return;
            const core = normalize(t.core);
            if (words.some(v => v === core || (v.length > 3 && core.startsWith(v)))) { it.gaps.set(w, { span: 1, answers: [] }); marked++; }
          });
        });
        renderRows();
        showInfo(`Marked ${marked} gap${marked === 1 ? "" : "s"}.`);
      }
    });
    const clearGaps = el("button", "aw-btn", "Clear all gaps");
    clearGaps.type = "button";
    clearGaps.onclick = () => { data.items.forEach(it => { it.gaps = new Map(); }); renderRows(); };
    const clearBtn = el("button", "aw-btn aw-ed-bulkdanger", "Delete all lines");
    clearBtn.type = "button";
    clearBtn.onclick = () => { if (!confirm("Delete ALL lines?")) return; data.items = []; renderRows(); };
    bar.append(pasteBtn, suggestBtn, clearGaps, clearBtn);
    return bar;
  }

  function openPasteModal({ title, hint, onApply }) {
    const bd = el("div", "aw-modal-overlay aw-ftg-ed-modalbd");
    const box = el("div", "aw-modal aw-ed-pastemodal");
    box.append(el("div", "aw-modal-title", title));
    box.append(el("div", "aw-ed-pastehint", hint));
    const ta = el("textarea", "aw-ed-pastebox");
    ta.rows = 10;
    box.append(ta);
    const row = el("div", "aw-modal-actions");
    const cancel = el("button", "aw-btn", "Cancel"); cancel.type = "button";
    const ok = el("button", "aw-btn aw-btn-primary", "Apply"); ok.type = "button";
    cancel.onclick = () => bd.remove();
    ok.onclick = () => { const v = ta.value; bd.remove(); onApply(v); };
    row.append(cancel, ok);
    box.append(row);
    bd.append(box);
    bd.addEventListener("click", e => { if (e.target === bd) bd.remove(); });
    document.body.append(bd);
    setTimeout(() => ta.focus(), 0);
  }

  // ----- save -----
  cancelBtn.onclick = () => { if (player) { player.destroy(); player = null; } onCancel?.(); };
  saveBtn.onclick = async () => {
    const items = data.items.map(it => {
      const toks = tokenize(it.text);
      return {
        speaker: (it.speaker || "").trim(),
        text: (it.text || "").trim(),
        gaps: [...it.gaps.entries()].filter(([w]) => toks[w] && gappable(toks[w])).sort((a, b) => a[0] - b[0])
          .map(([w, g]) => { const o = { word: w }; if ((g.span || 1) > 1) o.span = g.span; if (g.answers && g.answers.length) o.answers = g.answers; return o; }),
        start: Math.max(0, Number(it.start) || 0),
        end: Math.max(0, Number(it.end) || 0),
        enabled: it.enabled !== false
      };
    }).filter(it => it.text);
    const err = validate(data.title, data.audio, items);
    if (err) { showError(err); return; }
    const clean = {
      id: activity && activity.id ? activity.id : undefined,
      type: "find_the_gap",
      schemaVersion: 1,
      title: (data.title || "").trim(),
      instruction: (data.instruction || "").trim(),
      theme: "classic",
      options: data.options || {},
      content: { ...JSON.parse(JSON.stringify(data.content || {})), audio: (data.audio || "").trim(), items }
    };
    if (clean.id === undefined) delete clean.id;
    saveBtn.disabled = true;
    const label = saveBtn.textContent;
    saveBtn.textContent = "Saving…";
    try { await onSave?.(clean); if (player) { player.destroy(); player = null; } }
    catch (e) { saveBtn.disabled = false; saveBtn.textContent = label; showError("Could not save — please try again."); }
  };

  function showError(msg) { errBar.classList.remove("is-info"); errBar.textContent = msg; errBar.style.display = "block"; body.scrollTop = 0; }
  function showInfo(msg) { errBar.classList.add("is-info"); errBar.textContent = msg; errBar.style.display = "block"; body.scrollTop = 0; }
  function clearError() { if (errBar.style.display !== "none") errBar.style.display = "none"; }
  function field(labelText, control) {
    const f = el("div", "aw-ed-field");
    f.append(el("label", "aw-ed-label", labelText), control);
    return f;
  }
}

// ===== data helpers =====
function normalizeAct(activity) {
  const a = activity ? JSON.parse(JSON.stringify(activity)) : {};
  const content = a.content && typeof a.content === "object" ? a.content : {};
  const items = (Array.isArray(content.items) ? content.items : []).filter(it => it && typeof it.text === "string").map(it => {
    const toks = tokenize(it.text);
    const gaps = new Map();
    (Array.isArray(it.gaps) ? it.gaps : []).forEach(g => {
      const w = Number(g && g.word);
      if (Number.isInteger(w) && toks[w] && gappable(toks[w])) gaps.set(w, { span: Math.max(1, Math.min(Number(g.span) || 1, toks.length - w)), answers: Array.isArray(g.answers) ? g.answers.map(String) : [] });
    });
    return { speaker: String(it.speaker || ""), text: it.text, gaps, start: Number(it.start) || 0, end: Number(it.end) || 0, enabled: it.enabled !== false, _cores: toks.map(t => t.core) };
  });
  return { title: a.title || "", instruction: a.instruction || "", options: a.options || {}, content, audio: String(content.audio || ""), items };
}

function validate(title, audio, items) {
  if (!String(title || "").trim()) return "Give the activity a title.";
  if (!String(audio || "").trim()) return "Enter the audio code (or an mp3 URL).";
  const live = items.filter(it => it.enabled && it.gaps.length);
  if (!live.length) return "Add at least one line that is in the game and has a gap.";
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (!it.enabled) continue;
    if (!(it.end > it.start)) return `Line ${i + 1}: the end time must be after the start time.`;
  }
  return "";
}
