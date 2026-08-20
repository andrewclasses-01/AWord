// =============================================================
// TEMPLATE: SPEAKING — new game type, no Wordwall equivalent
// (Teacher Andrew's own idea, 10/8/2026). One word at a time: the student
// taps the mic, says the word out loud, and an AI (core/speech-score.js)
// grades how close it sounded to the target pronunciation. The score is
// shown as 0-5 STARS (half-star steps) and a word counts as correct when it
// reaches `options.passStars`.
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
//  • A PASS auto-advances to the next word after a short pause. A FAIL does
//    NOT auto-advance — the student can tap the mic again to retry (if
//    options.allowRetry) or press Next to move on; only the LAST attempt of
//    each word counts.
//
// Đợt 108 (11/8/2026) — six changes asked for by the teacher:
//  (1) The ~240MB scoring model now downloads while the READY screen is up,
//      via the new `prepare` engine hook — PLAY only appears once it's armed,
//      so a student never meets a mic that can't grade yet.
//  (2) "SPEAKING IN ANDREW CLASSES" slogan across the top bar.
//  (3) Recording STOPS ITSELF once the student stops talking (~0.8s of
//      quiet) — no second tap needed.
//  (4) The target IPA is shown under the word.
//  (5) All "Tap the microphone…"-style coaching text removed; only real
//      status (listening / checking / mic blocked) survives.
//  (6) 0-5 stars in half-star steps (score ÷ 20), and the pass threshold in
//      Options is now expressed in STARS instead of a percentage.
// =============================================================

import { registerTemplate } from "../../core/registry.js";
import { shuffle, el } from "../../core/utils.js";
import { press } from "../../core/press.js";
import { icons } from "../../core/icons.js";
import { autoFit } from "../../core/fit.js";
import { createVoicePlayer, DEFAULT_INTRO_DELAY_MS } from "../../core/voice-playback.js";
import { recognizePhonemes, scorePronunciation, warmup } from "../../core/speech-score.js";
import { openSpeakingEditor } from "./speaking-editor.js";
import { spkSound } from "./speaking-sound.js";

const MIN_RECORD_MS = 350;     // shorter than this is almost certainly an accidental tap
const MAX_RECORD_MS = 6000;    // words are short — hard cap so a forgotten mic doesn't run forever
const MAX_STARS = 5;
const DEFAULT_PASS_STARS = 3.5;   // exactly the old 70% default, expressed in stars

// ---- auto-stop tuning (see startLevelWatch) ----
const CALIBRATE_MS = 250;      // listen to the room's own noise this long before judging anything
const SILENCE_HOLD_MS = 800;   // this much quiet AFTER speech = "they've finished the word"
const LEVEL_POLL_MS = 50;

// Star drawn locally rather than added to core/icons.js — it's this
// template's own decoration, and core/icons.js is shared by all 17 games
// (core rule: don't grow the shared surface for one template's ornament).
const STAR_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.4l2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.42 6.12 20.51l1.12-6.55L2.48 9.32l6.58-.96z"/></svg>';

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// score (0-100) -> stars, in HALF-star steps. The teacher's own formula:
// "% ÷ 20" — 100%=5★, 90%=4.5★, 80%=4★, 70%=3.5★ … rounded to the nearest
// half star in between.
function starsForScore(score) {
  const s = Math.round(Number(score) / 10) / 2;
  return Math.max(0, Math.min(MAX_STARS, s));
}

function clampStars(v) {
  return Math.max(0.5, Math.min(MAX_STARS, Math.round(Number(v) * 2) / 2));
}

// The pass bar, in stars. Activities saved BEFORE Đợt 108 stored a 0-100
// percentage in `passThreshold` instead — those keep working: the old
// percentage is converted with the same ÷20 rule, so a 70% activity becomes
// a 3.5★ activity and grades identically.
function passStarsOf(opt) {
  if (Number.isFinite(Number(opt?.passStars))) return clampStars(opt.passStars);
  if (Number.isFinite(Number(opt?.passThreshold))) return clampStars(starsForScore(opt.passThreshold));
  return DEFAULT_PASS_STARS;
}

const spkTemplate = {
  type: "speaking",
  scorable: true,
  // TIME COST (Đợt 143) — opt in to the shared "-N per idle second" option.
  timeCost: true,
  itemsKey: "items",          // "Start with mistakes" support (see core/HUONG DAN CORE.md)
  // ⭐ Đợt 178 — SHOWDOWN. `loadQuestion(i)` is the single funnel for every entry
  // (mount · goPrev · goNext), so walking back with ‹ › repaints the right pupil
  // too; `review` is `items.map((it, i) => …)` on the same index. A retry
  // (`allowRetry`) stays on the SAME index, which is what keeps one question
  // belonging to one pupil however many attempts it takes.
  showdownMode: true,
  // ⭐⭐ Đợt 213b (thầy, 20/8/2026) — THỨ TỰ Ô TÍCH, theo CỘT.
  // Thầy đọc từng cột: "cột 1 <trên>/<dưới>, cột 2 …". Khối đổ theo CỘT (đầy cột 1
  // từ trên xuống rồi mới sang cột 2 — xem `.aw-checks` trong core/app.css), nên
  // danh sách này đọc thẳng thành bố cục: 2 mã đầu = cột 1, 2 mã kế = cột 2, …
  // ⛔ Là MÃ ĐỊNH DANH, không phải chữ hiện ra (chữ có thể đổi — chính đợt này đã
  // đổi "Show answer when wrong" thành "Show corrects").
  // ⚠️ Mã không có trong danh sách (Fight "In turns", Showdown "Balance questions")
  // tự xuống cuối — hai mode đó thầy chưa xếp.
  checkOrder: ["shuffle", "showAnswers", "playExample", "tryAgain"],
  name: "Speaking",
  edit: openSpeakingEditor,
  hidePointsOff: true,        // scoring is a star rating, not a per-wrong-answer penalty
  // Classic Wordwall pack (see speaking-sound.js) — replaces the engine
  // defaults, including the "Oh my god" wrong sound (teacher, 11/8/2026).
  sounds: {
    play: spkSound.intro,
    restart: spkSound.restart,
    complete: spkSound.complete
  },

  // ----- (1) download the scoring model BEFORE the game can start -----
  // The engine calls this as soon as the activity opens (READY screen), hides
  // PLAY, and shows a progress bar until the returned promise settles — see
  // `tpl.prepare` in core/engine.js. Progress from transformers.js arrives
  // per FILE, so add the files up into one overall percentage; a rejection is
  // deliberately NOT rethrown as a dead end (the engine reveals PLAY anyway
  // and the model gets one more chance on the first recording).
  prepare(activity, onProgress) {
    const files = new Map();
    return warmup(p => {
      if (!p || !p.file) return;
      if (p.status === "progress") {
        files.set(p.file, { loaded: Number(p.loaded) || 0, total: Number(p.total) || 0 });
      } else if (p.status === "done") {
        const f = files.get(p.file);
        if (f && f.total) f.loaded = f.total;
      }
      let loaded = 0, total = 0;
      for (const f of files.values()) { loaded += f.loaded; total += f.total; }
      const percent = total ? (loaded / total) * 100 : null;
      onProgress({
        percent,
        text: total
          ? `Downloading the pronunciation checker… ${Math.round(percent)}% (first time only)`
          : "Getting the pronunciation checker ready…"
      });
    });
  },

  toPrintItems(activity) {
    return (activity.content?.items || [])
      .filter(it => it && it.word)
      .map(it => ({ clue: it.clue || "Say this word out loud:", answer: it.word }));
  },

  // Đợt 140 — shared panel builders. Note the 0.5 step: the shared slider
  // builder clamps with Number(), not a bitwise op, precisely so half stars
  // survive.
  buildExtraOptions({ panel, draft, mkSliderCell, addCheck }) {
    // Pass bar in STARS (half-star steps), teacher 11/8/2026 — replaces the
    // old percentage slider. `passStarsOf` seeds it from an old percentage if
    // this activity was made before Đợt 108.
    if (draft.passStars == null) draft.passStars = passStarsOf(draft);
    panel.append(mkSliderCell({
      label: "Stars to pass", min: 1, max: MAX_STARS, step: 0.5,
      // ⭐ Đợt 213 — BLUE, not amber. Amber means REWARD under thầy's law
      // (restated 20/8/2026); this is the PASS THRESHOLD, a plain quantity like
      // Speed or Difficulty, and it hands out nothing. core/options-panel.js
      // also seats sliders by tone now, so the colour decides the position too.
      value: draft.passStars, tone: "blue",
      fmt: v => v + " ★",
      onInput: v => { draft.passStars = v; }
    }).cell);

    addCheck("Play example first", draft.playReference !== false,
      v => draft.playReference = v, { key: "playExample", title: "Play correct pronunciation first" });
    addCheck("Allow trying again", draft.allowRetry !== false,
      v => draft.allowRetry = v, { key: "tryAgain", title: "Allow trying again after a low score" });
  },

  mount(root, activity, ui) {
    const opt = activity.options || {};
    const passStars = passStarsOf(opt);
    const playReference = opt.playReference !== false;
    const allowRetry = opt.allowRetry !== false;

    let items = [...(activity.content?.items || [])]
      .filter(it => it && it.word && it.phonemes);
    if (opt.shuffleQuestions) items = shuffle(items);

    const total = items.length;
    if (total === 0) {
      root.innerHTML = "";
      root.append(el("div", "aw-spk-empty",
        "This activity has no ready words yet — hold the Options button, choose Edit content, and generate pronunciations first."));
      return () => {};
    }

    const state = items.map(() => ({ graded: false, correct: null, score: null, stars: null }));
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
    // TIME COST (Đợt 143): one place decides what the score is, so an ordinary
    // score update can never repaint the idle clock's deduction away.
    function scoreNow() {
      return state.filter(s => s.correct).length - (ui.timeCostTotal ? ui.timeCostTotal() : 0);
    }
    let mediaStream = null, mediaRecorder = null, chunks = [], recordStartedAt = 0, autoStopTimer = null;
    let audioCtx = null, levelTimer = null;

    // ===== persistent shell =====
    const card = el("div", "aw-spk-card");

    const wordArea = el("div", "aw-spk-wordarea");
    const wordEl = el("div", "aw-spk-word");
    const ipaEl = el("div", "aw-spk-ipa");       // (4) target pronunciation, under the word
    const clueEl = el("div", "aw-spk-clue");
    wordArea.append(wordEl, ipaEl, clueEl);

    const micWrap = el("div", "aw-spk-micwrap");
    const micBtn = el("button", "aw-spk-micbtn", icons.mic);
    micBtn.type = "button";
    micBtn.setAttribute("aria-label", "Record your pronunciation");
    press(micBtn, onMicClick);   // instant on touch-down — core/press.js

    // (6) star row + the raw percentage beside it
    const starsRow = el("div", "aw-spk-stars");
    const starEls = [];
    for (let i = 0; i < MAX_STARS; i++) {
      const star = el("span", "aw-spk-star");
      star.style.setProperty("--i", String(i));
      const bg = el("span", "aw-spk-star-bg", STAR_SVG);
      const fill = el("span", "aw-spk-star-fill", STAR_SVG);
      star.append(bg, fill);
      starsRow.append(star);
      starEls.push(fill);
    }
    const pctEl = el("span", "aw-spk-pct");
    starsRow.append(pctEl);

    // (5) status line: real status ONLY (listening / checking / something went
    // wrong). No coaching sentences — the teacher removed them.
    const statusEl = el("div", "aw-spk-status", "");
    micWrap.append(micBtn, starsRow, statusEl);

    card.append(wordArea, micWrap);
    root.append(card);

    // ----- (2) slogan on the SAME row as the clock + score -----
    // Same technique as anagram.js/crossword.js: absolutely centred over the
    // top bar so it never depends on the clock/score widths, set up ONCE (the
    // top bar outlives every word).
    const topbar = root.parentElement && root.parentElement.querySelector(".aw-topbar");
    let sloganEl = null;
    if (topbar) {
      topbar.style.position = "relative";
      sloganEl = el("div", "aw-spk-slogan", "SPEAKING IN ANDREW CLASSES");
      topbar.append(sloganEl);
    }

    ui.onSubmit(finish, () => state.filter(s => s.graded).length);
    loadQuestion(0, false);
    fitter = autoFit(root, wordArea, s => card.style.setProperty("--fit", s), { slack: root.clientWidth * 0.02 });

    // ===== load a question =====
    function loadQuestion(i, withFade) {
      resetMicForNewQuestion();
      index = i;
      const it = items[index];
      wordEl.innerHTML = escapeHtml(it.word);
      ipaEl.textContent = it.phonemes ? `/${it.phonemes}/` : "";
      ipaEl.style.display = it.phonemes ? "" : "none";
      clueEl.innerHTML = it.clue ? escapeHtml(it.clue) : "";
      clueEl.style.display = it.clue ? "" : "none";
      updateNav();
      updateMicUI();
      showResult(state[index]);
      setStatus("");

      voicePlayer.stop();
      if (playReference && it.voice) {
        const vBtn = el("button", "aw-voicebtn", icons.soundOn);
        vBtn.type = "button";
        vBtn.setAttribute("aria-label", "Listen to the correct pronunciation");
        press(vBtn, e => { e.stopPropagation(); voicePlayer.toggle(it.voice, vBtn); });
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
      // TIME COST (Đợt 143): touching the mic IS this game's progress — both
      // starting an attempt and stopping one.
      ui.noteActivity?.();
      if (micState === "recording") { stopRecording(); return; }   // manual stop still works
      if (micState !== "idle") return;   // busy processing, or already passed
      startRecording();
    }

    // ----- TIME COST wiring (Đợt 143) — see core/engine.js's ui.setIdleGuard.
    // The guard answers ONE question: "could the student act right now?" This
    // game is the one where that matters most: while a student is RECORDING they
    // are doing the single most active thing the app asks of anyone — and the
    // engine cannot see it, because speaking makes no taps. Charging through a
    // recording, and through the scoring that follows it, would punish exactly
    // the class doing the work. `micState !== "idle"` covers recording,
    // processing and the passed-and-moving-on hold in one honest test.
    ui.setScoreProvider?.(scoreNow);
    ui.setIdleGuard?.(() => finished || micState !== "idle");

    async function startRecording() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setStatus("This browser can't record audio.");
        return;
      }
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (e) {
        setStatus("Microphone access was blocked — allow it in the browser to play this game.");
        return;
      }
      // ⚠️ Đợt 114 — the await above can take a LONG time: the very first take on
      // a machine parks here until someone answers Chrome's permission prompt.
      // Leave the game meanwhile (Home / Start again / Change template) and
      // cleanup() has already run and found nothing to stop — `mediaStream` was
      // still null. Without this check the microphone then switched ON with no
      // game on screen: recording light lit, 6 seconds captured, and the take
      // graded into a dead play. Hand the tracks straight back instead.
      if (finished) { stream.getTracks().forEach(t => t.stop()); return; }
      mediaStream = stream;
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
      hideResult();
      setStatus("Listening…");
      autoStopTimer = setTimeout(stopRecording, MAX_RECORD_MS);
      startLevelWatch();
    }

    // ----- (3) stop by itself when the student stops talking -----
    // Watches the live mic level and ends the take after SILENCE_HOLD_MS of
    // quiet that FOLLOWS actual speech, so the student never taps twice.
    //
    // • The room's own noise is measured for the first CALIBRATE_MS and the
    //   two thresholds are derived from it — a noisy classroom would trip a
    //   fixed threshold instantly and cut the recording off before the word.
    // • setInterval, NOT requestAnimationFrame: rAF is frozen solid in a
    //   hidden tab / preview pane (core/HUONG DAN CORE.md) and this loop MUST
    //   keep running or a recording could never auto-stop.
    // • Any failure here is non-fatal — the MAX_RECORD_MS cap and a second tap
    //   both still stop the recording.
    function startLevelWatch() {
      stopLevelWatch();
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx || !mediaStream) return;
        audioCtx = new Ctx();
        const src = audioCtx.createMediaStreamSource(mediaStream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 1024;
        src.connect(analyser);
        const buf = new Uint8Array(analyser.fftSize);

        const watchStartedAt = performance.now();
        let noiseSum = 0, noiseN = 0, floor = 0;
        let speechSeen = false, quietSince = 0;

        levelTimer = setInterval(() => {
          analyser.getByteTimeDomainData(buf);
          let sum = 0;
          for (let i = 0; i < buf.length; i++) {
            const v = (buf[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / buf.length);
          const now = performance.now();

          if (now - watchStartedAt < CALIBRATE_MS) { noiseSum += rms; noiseN++; return; }
          if (!floor) floor = noiseN ? Math.max(0.004, noiseSum / noiseN) : 0.01;

          const onLevel = Math.max(0.035, floor * 3.2);    // "they've started"
          const offLevel = Math.max(0.018, floor * 1.8);   // "they've stopped"

          if (!speechSeen) {
            if (rms >= onLevel) speechSeen = true;
            return;
          }
          if (rms >= offLevel) { quietSince = 0; return; }
          if (!quietSince) quietSince = now;
          else if (now - quietSince >= SILENCE_HOLD_MS) stopRecording();
        }, LEVEL_POLL_MS);
      } catch (e) {
        stopLevelWatch();
      }
    }

    function stopLevelWatch() {
      if (levelTimer) { clearInterval(levelTimer); levelTimer = null; }
      if (audioCtx) {
        const ctx = audioCtx;
        audioCtx = null;
        try { ctx.close(); } catch (e) { /* already closed */ }
      }
    }

    function stopRecording() {
      if (micState !== "recording") return;
      stopLevelWatch();
      if (autoStopTimer) { clearTimeout(autoStopTimer); autoStopTimer = null; }
      try { mediaRecorder.stop(); } catch (e) { /* already inactive */ }
      micState = "processing";
      updateMicUI();
      updateNav();   // locks Prev/Next while the AI grades this take
      setStatus("Checking…");
    }

    function stopStream() {
      if (mediaStream) { mediaStream.getTracks().forEach(t => t.stop()); mediaStream = null; }
    }

    function cancelAnyRecording() {
      stopLevelWatch();
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
        setStatus("That was too short.");
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
        setStatus("Could not check that recording.");
      }
    }

    // Only ever seen if `prepare` failed and the model is being fetched late.
    function onModelProgress(p) {
      if (!p) return;
      if (p.status === "progress" && typeof p.progress === "number") {
        setStatus(`Downloading the pronunciation checker… ${Math.round(p.progress)}%`);
      } else if (p.status === "ready" || p.status === "done") {
        setStatus("Checking…");
      }
    }

    function gradeAttempt(score) {
      const st = state[index];
      st.graded = true;
      st.score = score;
      st.stars = starsForScore(score);
      st.correct = st.stars >= passStars;
      micState = "done";
      updateMicUI();
      setStatus("");
      showResult(st, true);
      if (st.correct) spkSound.correct(); else spkSound.wrong();   // classic pack — NOT ui.sound.wrong() ("Oh my god")
      ui.setScore(scoreNow());
      updateNav();
      clearAutoTimer();
      if (st.correct) {
        autoTimer = setTimeout(() => {
          if (finished) return;
          if (index < total - 1) goNext(); else finish("complete");
        }, 1400);   // long enough to actually read the stars before it moves on
      } else if (allowRetry) {
        micState = "idle";   // mic ready again for another attempt
        updateMicUI();
      }
    }

    // ----- (6) star display -----
    function showResult(st, animate) {
      if (!st || !st.graded) { hideResult(); return; }
      starsRow.classList.add("is-shown");
      starsRow.classList.toggle("is-pass", st.correct === true);
      starsRow.classList.remove("is-pop");
      if (animate) {
        // Re-adding the class on the next frame restarts the pop; a plain
        // remove+add in the same tick would be collapsed by the style engine.
        void starsRow.offsetWidth;
        starsRow.classList.add("is-pop");
      }
      starEls.forEach((fill, i) => {
        const pct = Math.max(0, Math.min(1, st.stars - i)) * 100;
        fill.style.width = `${pct}%`;
      });
      pctEl.textContent = `${st.score}%`;
    }

    function hideResult() {
      starsRow.classList.remove("is-shown", "is-pass", "is-pop");
      starEls.forEach(fill => { fill.style.width = "0%"; });
      pctEl.textContent = "";
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
          yourText: s.graded ? `${s.stars}★ (${s.score}%)` : null,
          yourCorrect: s.correct === true,
          correctText: it.word,
          src: it
        };
      });
      ui.finish({ correct, incorrect: total - correct, total, perQuestion, review, answered });
    }

    return function cleanup() {
      // Đợt 114 — MUST be first. `finished` is the brake onRecordingStopped()
      // already documents ("in case cleanup() ran mid-recognize") and the one
      // startRecording() needs after its getUserMedia await — but nothing ever
      // engaged it here, so recognizePhonemes() (seconds of WASM inference, not
      // cancellable) went on to grade a thrown-away play: pass/fail cue over the
      // next game, then a fresh autoTimer that finished it into the leaderboard.
      finished = true;
      clearAutoTimer();
      cancelAnyRecording();
      voicePlayer.stop();
      if (fitter) fitter.destroy();
      if (sloganEl) sloganEl.remove();
    };
  }
};

registerTemplate(spkTemplate);
export default spkTemplate;
