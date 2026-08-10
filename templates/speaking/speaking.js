// =============================================================
// TEMPLATE: SPEAKING — new game type, no Wordwall equivalent
// (Teacher Andrew's own idea, 10/8/2026). One word at a time: the student
// taps the mic, says the word out loud, and an AI (core/speech-score.js)
// grades how close it sounded to the target pronunciation. A score at or
// above `options.passThreshold` counts the word as correct.
//
//  • Each item needs `word` + `phonemes` (the target IPA string, generated
//    ONCE in the editor via core/phonemize.js — see speaking-editor.js).
//    An item with no `phonemes` yet is unplayable and filtered out, same as
//    other templates filter out incomplete items.
//  • Optional `voice` (a voiceClips/{id}, generated in the editor via the
//    SAME Kokoro TTS pipeline Anagram/Type the answer already use) lets the
//    student hear the correct pronunciation before recording — reuses
//    core/voice-playback.js + the shared `.aw-voicebtn` styling as-is.
//  • Recording uses the browser's own mic (MediaRecorder) — no upload, the
//    audio never leaves the device except into the in-browser AI model.
//  • A PASS (score >= passThreshold) auto-advances to the next word after a
//    short pause. A FAIL does NOT auto-advance — the student can either tap
//    the mic again to retry (if options.allowRetry) or press Next to move
//    on anyway; only the LAST attempt's score counts.
//  • First recording of a session downloads the ~240MB scoring model — the
//    mic status text shows a live download percentage during that wait.
// =============================================================

import { registerTemplate } from "../../core/registry.js";
import { shuffle, el } from "../../core/utils.js";
import { icons } from "../../core/icons.js";
import { autoFit } from "../../core/fit.js";
import { createVoicePlayer, DEFAULT_INTRO_DELAY_MS } from "../../core/voice-playback.js";
import { recognizePhonemes, scorePronunciation } from "../../core/speech-score.js";
import { openSpeakingEditor } from "./speaking-editor.js";
import { spkSound } from "./speaking-sound.js";

const MIN_RECORD_MS = 350;     // shorter than this is almost certainly an accidental tap
const MAX_RECORD_MS = 6000;    // words are short — auto-stop so a forgotten mic doesn't run forever
const DEFAULT_PASS_THRESHOLD = 70;

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const spkTemplate = {
  type: "speaking",
  scorable: true,
  itemsKey: "items",          // "Start with mistakes" support (see core/HUONG DAN CORE.md)
  name: "Speaking",
  edit: openSpeakingEditor,
  hideLettersOption: true,    // no lettered answer choices here
  hideShuffleAnswers: true,   // no answer options to shuffle, only question order
  hidePointsOff: true,        // scoring is a 0-100 match %, not a per-wrong-answer penalty
  // Classic Wordwall pack (see speaking-sound.js) — replaces the engine
  // defaults, including the "Oh my god" wrong sound (teacher, 11/8/2026).
  sounds: {
    play: spkSound.intro,
    restart: spkSound.restart,
    complete: spkSound.complete
  },

  toPrintItems(activity) {
    return (activity.content?.items || [])
      .filter(it => it && it.word)
      .map(it => ({ clue: it.clue || "Say this word out loud:", answer: it.word }));
  },

  buildExtraOptions({ panel, draft, el: mkEl, mkCheck }) {
    const g = mkEl("div", "aw-opt-group");
    g.append(mkEl("div", "aw-opt-label", "Speaking"));

    if (draft.passThreshold == null) draft.passThreshold = DEFAULT_PASS_THRESHOLD;
    const sliderWrap = mkEl("div", "aw-spk-opt-slider");
    sliderWrap.append(mkEl("span", "aw-spk-opt-slidercap", "Pass threshold"));
    const slider = mkEl("input");
    slider.type = "range"; slider.min = "30"; slider.max = "100"; slider.step = "5";
    slider.value = String(draft.passThreshold);
    const sliderVal = mkEl("span", "aw-spk-opt-sliderval", `${draft.passThreshold}%`);
    slider.oninput = () => { draft.passThreshold = +slider.value; sliderVal.textContent = `${slider.value}%`; };
    sliderWrap.append(slider, sliderVal);
    g.append(sliderWrap);

    const row = mkEl("div", "aw-opt-row");
    row.append(
      mkCheck(draft.playReference !== false, "Play correct pronunciation first",
        v => draft.playReference = v),
      mkCheck(draft.allowRetry !== false, "Allow trying again after a low score",
        v => draft.allowRetry = v)
    );
    g.append(row);
    panel.append(g);
  },

  mount(root, activity, ui) {
    const opt = activity.options || {};
    const passThreshold = Math.max(30, Math.min(100, Number(opt.passThreshold) || DEFAULT_PASS_THRESHOLD));
    const playReference = opt.playReference !== false;
    const allowRetry = opt.allowRetry !== false;

    let items = [...(activity.content?.items || [])]
      .filter(it => it && it.word && it.phonemes);
    if (opt.shuffleQuestions) items = shuffle(items);

    const total = items.length;
    if (total === 0) {
      root.innerHTML = "";
      root.append(el("div", "aw-spk-empty",
        "This activity has no ready words yet — open Edit content and generate pronunciations first."));
      return () => {};
    }

    const state = items.map(() => ({ graded: false, correct: null, score: null }));
    let index = 0;
    let finished = false;
    let autoTimer = null;
    let fitter = null;
    const voicePlayer = createVoicePlayer();
    let firstQuestionSpoken = false;

    // ----- mic/recording state machine -----
    // "idle" -> "recording" -> "processing" -> "done"; "done" on a FAIL with
    // allowRetry goes back to "idle" so the mic button works again.
    let micState = "idle";
    let mediaStream = null, mediaRecorder = null, chunks = [], recordStartedAt = 0, autoStopTimer = null;

    // ===== persistent shell =====
    const card = el("div", "aw-spk-card");

    const wordArea = el("div", "aw-spk-wordarea");
    const wordEl = el("div", "aw-spk-word");
    const clueEl = el("div", "aw-spk-clue");
    wordArea.append(wordEl, clueEl);

    const micWrap = el("div", "aw-spk-micwrap");
    const micBtn = el("button", "aw-spk-micbtn", icons.mic);
    micBtn.type = "button";
    micBtn.setAttribute("aria-label", "Record your pronunciation");
    micBtn.onclick = onMicClick;
    const statusEl = el("div", "aw-spk-status", "Tap the microphone and say the word.");
    micWrap.append(micBtn, statusEl);

    card.append(wordArea, micWrap);
    root.append(card);

    ui.onSubmit(finish, () => state.filter(s => s.graded).length);
    loadQuestion(0, false);
    fitter = autoFit(root, wordArea, s => card.style.setProperty("--fit", s), { slack: root.clientWidth * 0.02 });

    // ===== load a question =====
    function loadQuestion(i, withFade) {
      resetMicForNewQuestion();
      index = i;
      const it = items[index];
      wordEl.innerHTML = escapeHtml(it.word);
      clueEl.innerHTML = it.clue ? escapeHtml(it.clue) : "";
      clueEl.style.display = it.clue ? "" : "none";
      updateNav();
      updateMicUI();
      setStatus(state[index].graded
        ? resultText(state[index])
        : "Tap the microphone and say the word.");

      voicePlayer.stop();
      if (playReference && it.voice) {
        const vBtn = el("button", "aw-voicebtn", icons.soundOn);
        vBtn.type = "button";
        vBtn.setAttribute("aria-label", "Listen to the correct pronunciation");
        vBtn.onclick = e => { e.stopPropagation(); voicePlayer.toggle(it.voice, vBtn); };
        wordEl.append(vBtn);   // trailing icon INSIDE the word text — inherits its font-size (em-sized)
        if (!state[index].graded) {
          voicePlayer.playDelayed(it.voice, vBtn, firstQuestionSpoken ? 0 : DEFAULT_INTRO_DELAY_MS);
        }
      }
      firstQuestionSpoken = true;
      if (fitter) fitter.refit();

      if (withFade) {
        card.animate([{ opacity: 0.3 }, { opacity: 1 }], { duration: 180, easing: "ease" });
      }
    }

    function resetMicForNewQuestion() {
      cancelAnyRecording();
      micState = "idle";
    }

    // ===== recording =====
    function onMicClick() {
      if (micState === "recording") { stopRecording(); return; }
      if (micState !== "idle") return;   // busy processing, or already passed
      startRecording();
    }

    async function startRecording() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setStatus("This browser can't record audio.");
        return;
      }
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (e) {
        setStatus("Microphone access was blocked — allow it in the browser to play this game.");
        return;
      }
      chunks = [];
      try {
        mediaRecorder = new MediaRecorder(mediaStream);
      } catch (e) {
        setStatus("This browser can't record audio.");
        stopStream();
        return;
      }
      mediaRecorder.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
      mediaRecorder.onstop = onRecordingStopped;
      mediaRecorder.start();
      recordStartedAt = performance.now();
      micState = "recording";
      updateMicUI();
      setStatus("Recording… tap again to stop.");
      autoStopTimer = setTimeout(stopRecording, MAX_RECORD_MS);
    }

    function stopRecording() {
      if (micState !== "recording") return;
      if (autoStopTimer) { clearTimeout(autoStopTimer); autoStopTimer = null; }
      try { mediaRecorder.stop(); } catch (e) { /* already inactive */ }
      micState = "processing";
      updateMicUI();
      updateNav();   // locks Prev/Next while the AI grades this take
      setStatus("Checking your pronunciation…");
    }

    function stopStream() {
      if (mediaStream) { mediaStream.getTracks().forEach(t => t.stop()); mediaStream = null; }
    }

    function cancelAnyRecording() {
      if (autoStopTimer) { clearTimeout(autoStopTimer); autoStopTimer = null; }
      if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.onstop = null;   // don't grade a cancelled recording
        try { mediaRecorder.stop(); } catch (e) { /* ignore */ }
      }
      stopStream();
    }

    async function onRecordingStopped() {
      stopStream();
      const mimeType = (mediaRecorder && mediaRecorder.mimeType) || "audio/webm";
      const blob = new Blob(chunks, { type: mimeType });
      const durMs = performance.now() - recordStartedAt;
      if (durMs < MIN_RECORD_MS || blob.size === 0) {
        micState = "idle";
        updateMicUI();
        updateNav();
        setStatus("Too short — tap and hold a moment longer.");
        return;
      }
      // Nav is disabled while micState === "processing" (see updateNav), so
      // `index` genuinely cannot change while this await is in flight — this
      // is still checked defensively in case cleanup() ran mid-recognize
      // (tab closed / template switched) so a stray late result never grades
      // a torn-down mount.
      const qIndexAtRecord = index;
      try {
        const heard = await recognizePhonemes(blob, onModelProgress);
        if (finished || index !== qIndexAtRecord) return;
        const { score } = scorePronunciation(heard, items[index].phonemes);
        gradeAttempt(score);
      } catch (e) {
        if (finished || index !== qIndexAtRecord) return;
        micState = "idle";
        updateMicUI();
        updateNav();
        setStatus("Could not check that recording — tap the microphone to try again.");
      }
    }

    function onModelProgress(p) {
      if (!p) return;
      if (p.status === "progress" && typeof p.progress === "number") {
        setStatus(`Downloading the pronunciation checker (first time only)… ${Math.round(p.progress)}%`);
      } else if (p.status === "ready" || p.status === "done") {
        setStatus("Checking your pronunciation…");
      }
    }

    function gradeAttempt(score) {
      const st = state[index];
      st.graded = true;
      st.score = score;
      st.correct = score >= passThreshold;
      micState = "done";
      updateMicUI();
      setStatus(resultText(st));
      if (st.correct) spkSound.correct(); else spkSound.wrong();   // classic pack — NOT ui.sound.wrong() ("Oh my god")
      ui.setScore(state.filter(s => s.correct).length);
      updateNav();
      clearAutoTimer();
      if (st.correct) {
        autoTimer = setTimeout(() => {
          if (finished) return;
          if (index < total - 1) goNext(); else finish("complete");
        }, 1100);
      } else if (allowRetry) {
        micState = "idle";   // mic ready again for another attempt
        updateMicUI();
      }
    }

    function resultText(st) {
      return st.correct
        ? `${st.score}% — nice pronunciation!`
        : `${st.score}% — not quite.` + (allowRetry ? " Tap the mic to try again, or press Next." : " Press Next to continue.");
    }

    function updateMicUI() {
      micBtn.classList.toggle("is-recording", micState === "recording");
      micBtn.classList.toggle("is-processing", micState === "processing");
      micBtn.classList.toggle("is-pass", micState === "done" && state[index].correct === true);
      micBtn.classList.toggle("is-fail", micState === "done" && state[index].correct === false);
      micBtn.disabled = micState === "processing"
        || (micState === "done" && (state[index].correct === true || !allowRetry));
      micBtn.innerHTML = micState === "processing" ? icons.refresh : icons.mic;
    }

    function setStatus(text) { statusEl.textContent = text; }

    function clearAutoTimer() { if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; } }

    function canAdvance() { return state[index].graded; }

    function updateNav() {
      const isLast = index === total - 1;
      // Nav is fully locked while a recording is being sent to the AI to
      // grade (micState === "processing") — the async result in
      // onRecordingStopped keys off `index` staying put until it resolves.
      const locked = micState === "processing";
      ui.setNav({
        index: index + 1,
        total,
        onPrev: (!locked && index > 0) ? goPrev : null,
        onNext: (locked || !canAdvance()) ? null : (isLast ? () => finish("complete") : goNext),
        nextLabel: isLast && canAdvance() ? icons.check : null
      });
    }

    function goPrev() { if (index > 0) { clearAutoTimer(); loadQuestion(index - 1, true); } }
    function goNext() { if (canAdvance() && index < total - 1) { clearAutoTimer(); loadQuestion(index + 1, true); } }

    function finish(reason = "complete") {
      if (finished) return;
      const answered = state.filter(s => s.graded).length;
      if (answered === 0) { ui.toast?.("Record at least one word first."); return; }
      finished = true;
      clearAutoTimer();
      cancelAnyRecording();
      const perQuestion = state.map((s, i) => ({ q: i, correct: s.correct === true }));
      const correct = perQuestion.filter(p => p.correct).length;
      const review = items.map((it, i) => {
        const s = state[i];
        return {
          question: it.clue || `Say: ${it.word}`,
          answered: s.graded,
          yourText: s.graded ? `${s.score}%` : null,
          yourCorrect: s.correct === true,
          correctText: it.word,
          src: it
        };
      });
      ui.finish({ correct, incorrect: total - correct, total, perQuestion, review, answered });
    }

    return function cleanup() {
      clearAutoTimer();
      cancelAnyRecording();
      voicePlayer.stop();
      if (fitter) fitter.destroy();
    };
  }
};

registerTemplate(spkTemplate);
export default spkTemplate;
