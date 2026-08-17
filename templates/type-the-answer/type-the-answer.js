// =============================================================
// TEMPLATE: TYPE THE ANSWER — Wordwall style, English UI.
//  • One prompt at a time. The whole play area is built ONCE and reused:
//      - a FIXED-height question area at the top (2 lines tall; a longer
//        question shrinks its own font to fit — never pushes anything down),
//      - the answer block (reveal + input + Submit) centred in the space below,
//        at a POSITION THAT NEVER MOVES (question length / 1-2-3 lines / keyboard
//        shown-or-hidden all leave it put),
//      - the on-screen keyboard pinned at the bottom, always occupying its space
//        so hiding it (a smooth fade+slide) doesn't shift the block.
//  • Only the QUESTION text crossfades on navigation; the answer block updates
//    in place, so the Submit button never flickers.
//  • Matching ignores case + accents. Any of item.acceptedAnswers[] is correct.
//  • Correct -> green check flies to the score (+1). Wrong -> the "Points off per
//    wrong" slider (Options, 0..5) decides: >0 flies a red "−N" and subtracts N;
//    0 (default) just fades a red cross in place. Wrong also reveals the correct
//    answer (options.showAnswerWhenWrong).
//  • Lives (Options, 0..10, 0 = Unlimited): a wrong answer also costs a heart
//    (ui.livesSlot, top bar) when lives are on; hitting 0 ends the game right
//    away ("gameover"), same pattern as True/false.
//  • Every graded question auto-advances to the next one shortly after (Allow
//    skip only controls whether Next is manually clickable BEFORE answering —
//    once answered, the game moves on either way); Back always stays available
//    to review a previous question. No "finish/✓" button on the last question —
//    the game completes automatically once every question has an answer (or via
//    Menu -> Submit answers).
// =============================================================

import { registerTemplate } from "../../core/registry.js";
// Dot 143 - every penalty in the app is on ONE scale now (0..100, step 1).
// Importing the numbers rather than repeating them is what stops this
// game's slider and its mount() clamp drifting apart again.
import { POINTS_MAX, POINTS_STEP } from "../../core/options-panel.js";
import { shuffle, el } from "../../core/utils.js";
import { icons } from "../../core/icons.js";
import { createKeyboard } from "../../core/keyboard.js";
import { createVoicePlayer, voiceView, DEFAULT_INTRO_DELAY_MS } from "../../core/voice-playback.js";
import { openTypeTheAnswerEditor } from "./type-the-answer-editor.js";
import { ttaSound } from "./type-the-answer-sound.js";

function normalize(str) {
  let s = String(str ?? "").trim().replace(/\s+/g, " ");
  s = s.normalize("NFD").replace(new RegExp("[\\u0300-\\u036f]", "g"), "");   // always ignore accents
  return s.toLowerCase();                                                     // always ignore case
}

const MAX_LIVES = 10;
// Lives are opt-in (3/8/2026): 0, null or undefined -> unlimited. Every activity
// saved before this feature has no `lives` field at all, so undefined must mean
// unlimited (not a default life count) or old content would suddenly risk a
// Game Over nobody asked for.
function normLives(v) {
  if (v == null || v === 0) return null;
  return Math.min(MAX_LIVES, Math.max(1, Math.round(v)));
}

const ttaTemplate = {
  type: "type_the_answer",
  scorable: true,
  // TIME COST (Đợt 143) — opt in to the shared "-N per idle second" option.
  timeCost: true,
  // "Start with mistakes" (Đợt 84): which array in activity.content holds the
  // playable items. Core filters THAT array by the `src` refs the review rows
  // carry, so a replay keeps the originals untouched. See core/mistakes.js.
  itemsKey: "items",
  hidePointsOff: true,   // ships its own "Minus points" control -> hide the central Points off
  name: "Type the answer",
  // FIGHT MODE (Đợt 170, 15/8/2026) — mirrors templates/quiz/quiz.js's pattern;
  // see core/HUONG DAN CORE.md's Fight contract. The one thing this template
  // does that Quiz doesn't: it draws its OWN score chip (`showScore`/
  // `pulseScoreTo` below) instead of calling `ui.setScore()`, so it has to
  // forward to `fightCtl.onScore()` itself — see showScore's own note.
  fightMode: true,
  // SHOWDOWN (Đợt 170) — nothing else needed: the turn rotation keys off the
  // `index` already sent through ui.setNav (updateNav, below) and the
  // per-pupil results off the `review` array finish() already builds. See
  // core/showdown.js.
  showdownMode: true,
  edit: openTypeTheAnswerEditor,
  hasKeyboardToggle: true,     // ask engine.js for a slot next to Menu for our keyboard show/hide button
  hasLivesSlot: true,          // hearts render in the top bar, left of the score (same slot as True/false)
  // Real Wordwall "Type the answer" (Classic) mp3 pack — the engine plays these
  // at Play / Start again / game complete. Per-key typing "tock" is separate
  // (synthesized ui.sound.keyClick()); correct/wrong are called inline.
  sounds: {
    play: ttaSound.intro,
    restart: ttaSound.restart,
    complete: () => {}   // silenced: finish() itself picks Completed or GameOver (out of lives)
  },

  toPrintItems(activity) {
    return (activity.content?.items || [])
      .filter(it => it && it.prompt && Array.isArray(it.acceptedAnswers) && it.acceptedAnswers.length)
      .map(it => ({ clue: it.prompt, answer: it.acceptedAnswers[0] }));
  },

  // Extra Options group (engine's generic "cửa mở rộng" — see CONG THUC MAU.md §5).
  // Đợt 140 — shared panel builders.
  buildExtraOptions({ panel, draft, mkSliderCell, addCheck }) {
    // Slider (0..5): how many points a wrong answer deducts. 0 = off — the
    // slider alone decides now, no separate "Minus points" checkbox (teacher,
    // 3/8/2026: fewer controls to keep in sync).
    if (draft.minusAmount == null) draft.minusAmount = 0;
    panel.append(
      mkSliderCell({
        label: "Points off", sub: "per wrong", min: 0, max: POINTS_MAX, step: POINTS_STEP,
        value: draft.minusAmount, offAt: 0,
        fmt: v => (v === 0 ? "Off" : "-" + v),
        onInput: v => { draft.minusAmount = v; }
      }).cell,
      // Lives — 0..10 (0 = Unlimited). New, 3/8/2026: a wrong answer costs a
      // heart (top bar, left of the score); hitting 0 ends the game right away.
      mkSliderCell({
        label: "Lives", min: 0, max: MAX_LIVES, step: 1,
        value: Number.isInteger(draft.lives) ? Math.min(MAX_LIVES, Math.max(0, draft.lives)) : 0,
        tone: "green", offAt: 0,
        fmt: v => (v === 0 ? "∞" : String(v)),
        onInput: v => { draft.lives = v; }   // 0 stored = unlimited
      }).cell
    );

    addCheck("Show answer when wrong", draft.showAnswerWhenWrong !== false,
      v => draft.showAnswerWhenWrong = v);
    // Default OFF -> Next stays disabled (until answered) instead of letting the
    // student jump ahead without answering. Once answered, the game auto-advances
    // regardless of this box (see submitAnswer) — this only gates the MANUAL skip.
    addCheck("Allow skip", draft.allowSkip === true, v => draft.allowSkip = v,
      { title: "Allow skip (move on without answering)" });
  },

  mount(root, activity, ui) {
    const opt = activity.options || {};
    const allowSkip = opt.allowSkip === true;   // move on without answering (default off)

    // ----- FIGHT MODE (Đợt 170) — this play may be one of two boards racing.
    // `_fight` is put here by core/fight.js; everything below falls back to
    // ordinary single-board behaviour when it is absent. Mirrors
    // templates/quiz/quiz.js's own `_fight` branches.
    const fight = activity._fight || null;
    const fightSide = fight ? fight.side : 0;
    const fightCtl = fight ? fight.ctl : null;
    let fightBoardLock = false;   // set by the match controller between rounds
    const fightLocked = () => fightBoardLock || !!(fightCtl && fightCtl.isLocked(fightSide));
    // FIGHT MODE — this board has answered but its verdict (is-correct/is-wrong
    // + the answer-key reveal text) is still WITHHELD because the other team is
    // still typing: printing the correct spelling right next to their board
    // would hand it straight over. The word the STUDENT typed is unavoidably
    // visible the moment they type it — this game has no "tiles" to keep
    // blank — but the ANSWER KEY is extra information Fight's "no leak while
    // the round is open" rule can and must still hold back. Cleared by
    // reveal(), which the match calls once the round is settled for both.
    let fightPendingReveal = false;
    // Where a flying mark should travel to: this board's own chip normally,
    // or (fighting) the shared team chip above both boards — same pattern as
    // anagram.js's scoreTargetEl().
    const scoreTargetEl = () => (fightCtl ? fightCtl.scoreTarget(fightSide) : ui.scoreEl);

    let items = [...(activity.content?.items || [])]
      .filter(it => it && it.prompt && Array.isArray(it.acceptedAnswers) && it.acceptedAnswers.length);
    if (opt.shuffleQuestions) items = shuffle(items);

    const total = items.length;
    if (total === 0) {
      root.innerHTML = "";
      root.append(el("div", "aw-tta-empty", "This activity has no questions yet."));
      return () => {};
    }

    // `timedOut` (Đợt 174): graded WRONG because the per-round clock ran out, not
    // because the pupil typed something wrong. It scores exactly like any other
    // wrong answer; the flag exists so the review can print "No answer" instead
    // of the empty box the pupil left behind.
    const state = items.map(() => ({ typed: null, graded: false, correct: null, timedOut: false }));
    let index = 0;
    let finished = false;
    let dead = false;   // "this mount was thrown away" — set ONLY by cleanup() (Đợt 114)
    let autoTimer = null;
    let livePoints = 0;                 // running score shown live (can be reduced by Minus mode)
    let livesLeft = normLives(opt.lives);   // null = unlimited (see normLives)
    let keyboardVisible = true;         // ON by default every time the act is opened
    let andrewUsed = false;             // "Andrew help" — ONE use for the WHOLE game (all questions share it)
    let andrewGlowing = false;          // true from the press until that question is submitted (bright + halo)
    const activeFlyNodes = new Set();   // stray document.body clones — swept on cleanup

    // Pronunciation playback (10/8/2026) — optional per-question, carried
    // through Change Template from an Anagram source (core/convert.js).
    // `items[i]` IS the raw content object directly (no `.src` wrapper in
    // this template), so `.voice`/`.hideText` read straight off it.
    const voicePlayer = createVoicePlayer();
    let firstQuestionSpoken = false;

    // ===== persistent shell — built ONCE, updated in place per question =====
    const card = el("div", "aw-tta-card");

    // fixed-height question area (2 lines); a longer question shrinks --qfit.
    const qArea = el("div", "aw-tta-qarea");
    const promptEl = el("div", "aw-tta-prompt");
    qArea.append(promptEl);

    // answer block, centred in the slot below the question (fixed position).
    const slot = el("div", "aw-tta-answer-slot");
    const answerBlock = el("div", "aw-tta-answer-area");

    const revealWrap = el("div", "aw-tta-revealwrap");
    const revealInner = el("div", "aw-tta-reveal-inner");
    const revealText = el("div", "aw-tta-reveal-text");
    revealInner.append(revealText);
    revealWrap.append(revealInner);
    answerBlock.append(revealWrap);

    const row = el("div", "aw-tta-inputrow");
    const input = el("textarea", "aw-tta-input");
    input.rows = 1;
    input.autocomplete = "off";
    input.spellcheck = false;
    input.placeholder = "";   // no placeholder text — just the blinking caret
    // AWord shows its OWN on-screen keyboard, so keep the OS soft keyboard OFF while
    // that keyboard is up (Windows/Android/iOS). inputMode="none" hides the native
    // virtual keyboard without blocking a physical keyboard or the blinking caret.
    // If the student HIDES AWord's keyboard (kbd button), we flip it back to "text"
    // so the OS keyboard can appear again. keyboardVisible is ON by default.
    input.inputMode = keyboardVisible ? "none" : "text";
    input.addEventListener("keydown", e => {
      if (e.key === "Enter") { e.preventDefault(); submitAnswer(input.value); }   // never insert a newline
    });
    input.addEventListener("input", () => {
      filterEnglish();      // English only — drop any non-ASCII (Vietnamese etc.)
      autoGrow(input);
      fitLayout();
      syncSubmitEnabled();  // Submit off while the box is empty
    });
    // Also strip on the OS keyboard's compose end (Vietnamese Telex/VNI etc.).
    input.addEventListener("compositionend", () => { filterEnglish(); syncSubmitEnabled(); });
    row.append(input);
    answerBlock.append(row);

    const submitBtn = el("button", "aw-tta-submit", "Submit Answer");
    submitBtn.type = "button";
    submitBtn.onclick = () => submitAnswer(input.value);
    answerBlock.append(submitBtn);

    slot.append(answerBlock);

    // ----- the STANDARD on-screen keyboard (core/keyboard.js) -----
    const kbd = createKeyboard({
      sound: ui.sound,
      onChar: ch => insertChar(input, ch),
      onBackspace: () => backspace(input),
      submit: {
        onClick: () => submitAnswer(input.value),
        isDisabled: () => state[index].graded || !input.value.trim() || fightLocked()
      },
      extraKey: {
        label: "Andrew",
        className: "aw-tta-key-andrew",
        getState: () => !andrewUsed ? "ready" : (andrewGlowing ? "glowing" : "used"),
        // FIGHT MODE (Đợt 170): disabled for the WHOLE match, not just while
        // locked — "Andrew help" prints the correct spelling straight into
        // this board's input for the student to copy, and the two boards sit
        // side by side on one screen, so an early hint here is an early leak
        // to the other team too.
        isDisabled: () => andrewUsed || state[index].graded || !!fightCtl,
        onClick: useAndrew
      }
    });
    if (!keyboardVisible) kbd.setHidden(true);

    card.append(qArea, slot, kbd.el);
    const curInput = input;   // single persistent textarea (for autoGrow)

    // ----- keyboard show/hide button, next to Menu (engine's opt-in slot) -----
    let kbdBtn = null;
    if (ui.kbdSlot) {
      ui.kbdSlot.innerHTML = "";
      kbdBtn = el("button", "aw-iconbtn", icons.keyboard);
      kbdBtn.type = "button";
      updateKbdBtn();
      kbdBtn.onclick = () => {
        keyboardVisible = !keyboardVisible;
        kbd.setHidden(!keyboardVisible);   // animates (CSS transition)
        input.inputMode = keyboardVisible ? "none" : "text";   // OS keyboard off while AWord's is up
        syncSubmitVisibility();   // outside "Submit Answer" only shows when kbd hidden
        updateKbdBtn();
        fitLayout();   // block height (outside Submit) + keyboard-top changed -> re-fit & re-centre
      };
      ui.kbdSlot.append(kbdBtn);
    }
    function updateKbdBtn() {
      if (!kbdBtn) return;
      kbdBtn.title = keyboardVisible ? "Hide keyboard" : "Show keyboard";
      kbdBtn.setAttribute("aria-label", kbdBtn.title);
      kbdBtn.classList.toggle("is-off", !keyboardVisible);
    }
    // The outside "Submit Answer" button is only shown when the keyboard is
    // hidden (the keyboard has its own Submit key otherwise). It is REMOVED from
    // layout (display:none) when hidden — not just made invisible — so it doesn't
    // reserve ~44px below the answer, which used to force the question to shrink
    // for nothing. The reference-centering keeps the input/reveal in place across
    // the toggle regardless, so the block position stays stable.
    function syncSubmitVisibility() {
      submitBtn.style.display = keyboardVisible ? "none" : "";
    }

    ui.onSubmit(finish, () => state.filter(s => s.graded).length);   // block "Submit answers" at 0 answered
    root.append(card);
    loadQuestion(0, false);
    showScore(scoreNow());
    renderLives();

    // ----- TIME COST wiring (Đợt 143) — see core/engine.js's ui.setIdleGuard.
    // The guard answers ONE question: "could the student act right now?" Here
    // that is: the game over, the mount thrown away, the input disabled while a
    // graded answer plays out its mark/fly animation, and a clip still speaking
    // — nobody can type a word they are still being read.
    // ⚠️ setScorePainter, not just setScoreProvider: this game draws its own
    // "7 / 20" chip straight into .aw-top-score, so the engine's count-down
    // would otherwise overwrite that whole chip with a bare number.
    ui.setScoreProvider?.(scoreNow);
    ui.setScorePainter?.(v => showScore(v));
    ui.setIdleGuard?.(() => {
      if (finished || dead || voicePlayer.isPlaying()) return true;
      const inp = root.querySelector(".aw-tta-input");
      return !!(inp && inp.disabled);
    });
    // ⭐ TIME EACH ROUND (Đợt 174) — what "out of time" costs, the one thing the
    // engine cannot decide for this game. See roundTimeUp() below.
    ui.setRoundTimeout?.(roundTimeUp);

    // Fit on first layout, when the web font is ready, and on resize.
    let rafFit = 0;
    const onResize = () => { cancelAnimationFrame(rafFit); rafFit = requestAnimationFrame(fitLayout); };
    window.addEventListener("resize", onResize);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitLayout).catch(() => {});

    // The VISIBLE extent of the answer cluster — what must sit centred between
    // the question and the keyboard (per the teacher's reference screenshot,
    // 1/8/2026: the WHOLE cluster is centred, not just the reveal): from the top
    // of the reveal (when open) or the input, down to the bottom of the outside
    // Submit (when the keyboard is hidden) or the input.
    function blockEdges() {
      const iR = input.getBoundingClientRect();
      const top = revealWrap.classList.contains("is-open")
        ? revealWrap.getBoundingClientRect().top : iR.top;
      const bottom = keyboardVisible ? iR.bottom : submitBtn.getBoundingClientRect().bottom;
      return { top, bottom };
    }
    // The keyboard's layout TOP edge. When hidden it's slid down 14% (translateY),
    // so add that back to get where it actually sits in the layout.
    function keyboardTopLayout() {
      const kR = kbd.el.getBoundingClientRect();
      return kR.top + (kbd.isHidden() ? -kR.height * 0.14 : 0);
    }
    // The vertical space available to hold the answer, centred: from the QUESTION's
    // bottom edge to the KEYBOARD's top edge.
    function regionHeight() {
      return keyboardTopLayout() - promptEl.getBoundingClientRect().bottom;
    }
    // Height the region must have to hold the centred cluster: simply the
    // cluster's visible height. Invariant under the block's translate.
    function neededHeight() {
      const e = blockEdges();
      return e.bottom - e.top;
    }
    // The ANSWER BLOCK keeps a FIXED size (input / reveal / Andrew hint are all
    // one size and never shrink). Only when the block genuinely can't be centred
    // in the available region does the QUESTION give way: shrinking --qfit makes
    // the (content-sized) question area shorter, growing the region.
    function fitLayout() {
      autoGrow(curInput);
      card.style.setProperty("--qfit", "1");
      if (neededHeight() > regionHeight() - 2) {
        let lo = 0.4, hi = 1, best = 0.4;
        for (let i = 0; i < 14; i++) {
          const mid = (lo + hi) / 2;
          card.style.setProperty("--qfit", mid.toFixed(3));   // smaller question -> taller region
          if (neededHeight() <= regionHeight() - 2) { best = mid; lo = mid; } else { hi = mid; }
        }
        card.style.setProperty("--qfit", best.toFixed(3));
      }
      centerBlock();
    }
    // Re-fit around the reveal's opening transition (0.32s). The reveal's height
    // is mid-animation for a while, so any single early measurement can be wrong
    // — which used to leave the block overlapping the keyboard and the reveal
    // off-centre (the one refit fired early via a bubbled transitionend and the
    // once-flag blocked the correction). Fit NOW for a close first guess, again
    // on transitionend/400ms, and one FINAL unconditional pass at 750ms when the
    // transition is certainly finished.
    function scheduleRevealRefit() {
      fitLayout();
      let early = false;
      const earlyRefit = () => { if (early) return; early = true; fitLayout(); };
      revealWrap.addEventListener("transitionend", earlyRefit, { once: true });
      setTimeout(earlyRefit, 400);   // hidden/backgrounded tabs can skip transitionend
      setTimeout(fitLayout, 750);    // final settle — always runs, transition done
      // Re-centre EVERY FRAME while the reveal's height transition runs — the
      // cluster grows downward mid-transition, and with only the discrete passes
      // above, 1–2 frames could spill onto the keyboard before snapping back
      // (teacher saw it on long 2–3-line questions). centerBlock is cheap (one
      // clamped transform), so tracking each frame keeps every frame clean.
      const t0 = performance.now();
      const track = () => {
        centerBlock();
        if (performance.now() - t0 < 800) requestAnimationFrame(track);
      };
      requestAnimationFrame(track);
    }
    // Slide the block so the CLUSTER's centre (reveal top → input/Submit bottom)
    // lands exactly midway between the question's bottom edge and the keyboard's
    // top edge — gap above the cluster == gap below it, matching the teacher's
    // reference screenshot. HARD LIMIT: whatever the measurements say (e.g. taken
    // mid-transition while the reveal is still opening), the cluster must NEVER
    // overlap the keyboard or the question — the shift is clamped inside the
    // region. If the cluster is genuinely taller than the region (question
    // already at min size), it hugs the keyboard's top edge rather than covering
    // the keys.
    function centerBlock() {
      answerBlock.style.transform = "none";
      const qBottom = promptEl.getBoundingClientRect().bottom;
      const kbdTop = keyboardTopLayout();
      const e = blockEdges();
      let shift = (qBottom + kbdTop) / 2 - (e.top + e.bottom) / 2;
      const PAD = 3;
      const maxShift = (kbdTop - PAD) - e.bottom;   // furthest DOWN without touching the keyboard
      const minShift = (qBottom + PAD) - e.top;     // furthest UP without covering the question
      if (shift > maxShift) shift = maxShift;
      if (shift < Math.min(minShift, maxShift)) shift = Math.min(minShift, maxShift);
      answerBlock.style.transform = `translateY(${shift.toFixed(1)}px)`;
    }
    function autoGrow(ta) {
      if (!ta) return;
      ta.style.height = "auto";
      ta.style.height = ta.scrollHeight + "px";
    }
    // Keep ONLY basic ASCII (English letters/digits/space/punctuation). Anything
    // else — Vietnamese accented letters, đ, etc., however they were typed — is
    // dropped, so the box never accepts Vietnamese even with a VN keyboard on.
    function filterEnglish() {
      const before = input.value;
      const cleaned = before.replace(/[^\x20-\x7E]/g, "");
      if (cleaned !== before) {
        const delta = before.length - cleaned.length;
        const caret = Math.max(0, (input.selectionStart ?? cleaned.length) - delta);
        input.value = cleaned;
        input.setSelectionRange(caret, caret);
      }
    }
    // The Submit controls (outside button + the keyboard's blue Submit key) are
    // disabled while the box is empty, the question is already graded, or (Đợt
    // 170) this board has been locked out of the current fight round.
    function syncSubmitEnabled() {
      const st = state[index];
      submitBtn.disabled = st.graded || !input.value.trim() || fightLocked();
      kbd.refresh();   // re-syncs the keyboard's own Submit key + the Andrew key
    }

    // ===== load a question into the persistent DOM (no rebuild) =====
    // The answer block + keyboard update INSTANTLY in place (so Submit never
    // flickers); only the question text crossfades when navigating.
    function loadQuestion(i, withFade) {
      // ⚠️ FIGHT MODE (Đợt 170): tell the match BEFORE anything else runs, not
      // after — reporting late leaves the other board starting its own slide
      // a beat behind (measured 130-160ms on quiz.js, the same trap). The
      // controller echoes this back to the OTHER board via its own goToIndex,
      // which lands here too; fight.js's own `index === roundIndex` guard
      // absorbs that echo, so this is safe to call unconditionally.
      // `withFade` is exactly "this is a navigation, not the first paint" —
      // the same flag Quiz's `ui.itemChanging` call keys off.
      if (withFade && fightCtl) fightCtl.boardMoved(fightSide, i);
      // SHOWDOWN (Đợt 170) — the pupil-name swap rides on this same moment,
      // for the same reason. Optional; a template that never calls it just
      // gets the name change instantly at setNav instead.
      if (withFade) ui.itemChanging?.(i, { outMs: 120, inMs: 160 });

      index = i;
      const it = items[index];
      const st = state[index];
      // A withheld reveal belongs to the question that was on screen; moving
      // to another one clears it (same reset point as quiz.js's applyQuestion).
      fightPendingReveal = false;

      // --- answer block, in place ---
      input.value = st.typed || "";
      input.disabled = st.graded || fightLocked();
      input.classList.remove("is-correct", "is-wrong");
      if (st.graded) input.classList.add(st.correct ? "is-correct" : "is-wrong");
      const wrongShown = st.graded && !st.correct && opt.showAnswerWhenWrong !== false;
      revealText.textContent = wrongShown ? it.acceptedAnswers[0] : "";
      revealWrap.classList.toggle("is-open", wrongShown);
      revealWrap.classList.remove("is-andrew");
      autoGrow(input);
      syncSubmitVisibility();
      syncSubmitEnabled();   // Submit off if this question's box is empty (also refreshes the keyboard)
      updateNav();
      fitLayout();
      // The card's grey "lost the round" wash (see syncFightLock) has to be
      // re-evaluated on every question too, same reasoning as quiz.js's own
      // syncFightLock call here — otherwise a lost round could leave the NEXT
      // question's answer block wrongly greyed (or wrongly not).
      if (fightCtl) syncFightLock();

      // --- question text ---
      const setPrompt = () => {
        voicePlayer.stop();   // silence the PREVIOUS question's clip, if any
        const oldBtn = qArea.querySelector(".aw-tta-listenbtn");
        if (oldBtn) oldBtn.remove();
        const vv = voiceView(activity, it);   // Options > Content decides text/voice
        const hasVoice = vv.hasVoice, hideText = vv.hideText;
        promptEl.innerHTML = hideText ? "" : escapeHtml(it.prompt);
        if (hasVoice) {
          const vBtn = el("button", "aw-tta-listenbtn" + (hideText ? " is-lg" : ""), icons.soundOn);
          vBtn.type = "button";
          vBtn.setAttribute("aria-label", "Listen to pronunciation");
          vBtn.onclick = e => { e.stopPropagation(); voicePlayer.toggle(it.voice, vBtn); };
          qArea.append(vBtn);
          if (vv.autoPlay) voicePlayer.playDelayed(it.voice, vBtn, firstQuestionSpoken ? 0 : DEFAULT_INTRO_DELAY_MS);
        }
        firstQuestionSpoken = true;
        fitLayout();
      };
      if (withFade) {
        const out = promptEl.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, easing: "ease" });
        const swap = () => {
          promptEl.style.opacity = "0";
          setPrompt();
          const inn = promptEl.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, easing: "ease" });
          inn.onfinish = () => { promptEl.style.opacity = ""; };
          setTimeout(() => { promptEl.style.opacity = ""; }, 220);
        };
        out.onfinish = swap;
        setTimeout(() => { if (promptEl.textContent !== it.prompt) swap(); }, 200);   // hidden-tab fallback
      } else {
        setPrompt();
      }

      if (!st.graded) input.focus();
    }

    function submitAnswer(typed) {
      const it = items[index];
      const st = state[index];
      if (st.graded || finished || fightLocked()) return;
      if (!String(typed).trim()) return;   // can't submit an empty box
      st.typed = typed;
      st.graded = true;
      st.correct = it.acceptedAnswers.some(a => normalize(a) === normalize(typed));
      // TIME EACH ROUND (Đợt 174): this pupil's turn ends here, so their clock
      // freezes at this reading — which is both what Show answers prints for the
      // question and what stops a Count down firing over an answer already in.
      ui.roundDone?.();

      input.disabled = true;
      syncSubmitEnabled();   // graded -> Submit off (outside + keyboard)
      updateNav();   // re-sync Next NOW (with Allow skip off, Next was disabled until this
                      // question was graded — without this it stayed stuck disabled until
                      // some unrelated Prev/Next call happened to refresh it)

      if (andrewGlowing) {
        andrewGlowing = false;
        revealWrap.classList.remove("is-andrew");   // the hint reveal turns into the normal green one
        kbd.refresh();   // Andrew key -> "used" now that glowing has ended
      }

      const revealShown = !st.correct && opt.showAnswerWhenWrong !== false;

      // FIGHT MODE (Đợt 170): withhold the is-correct/is-wrong verdict, the
      // answer-key reveal, and the flying mark — everything that says HOW
      // this board did — until the match calls reveal() once both boards are
      // settled (core/HUONG DAN CORE.md, "GIẤU ĐÁP ÁN KHI VÒNG CÒN MỞ"). The
      // board still visibly stops right now (grey, via syncFightLock below),
      // and the referee hears the verdict immediately (wordDone, below) —
      // only what's drawn on screen waits.
      if (fightCtl) {
        fightPendingReveal = true;
        syncFightLock();
      } else {
        applyGradeVisuals(st, it, revealShown);
      }

      const outOfLives = st.correct ? false : loseLife();

      if (fightCtl) {
        // The referee needs the verdict NOW, not once the visuals catch up —
        // it decides who won the round. `correct:false` only ends THIS
        // board's go; the round stays open for the other team (core/HUONG DAN
        // CORE.md, "XONG TRƯỚC ≠ THẮNG").
        fightCtl.wordDone(fightSide, { index, correct: st.correct === true });
        if (outOfLives) autoTimer = setTimeout(() => finish("gameover"), 1500);
        // No auto-advance here: the match controller moves BOTH boards
        // together once the round settles (advanceRound()/jumpTo) — a board
        // walking off on its own would desynchronise the two frames, same
        // reasoning as quiz.js's own fight branch.
        return;
      }

      // Every graded question moves the game on shortly after, regardless of
      // Allow skip (that option only gates the MANUAL Next before answering) —
      // teacher's spec, 3/8/2026. Any timer left over from a PREVIOUS question is
      // cleared first: two stacked timers used to be able to fire out of order
      // (a stale one calling finish()/goNext() after the student had already
      // navigated elsewhere) — that was the source of the nav bar sometimes going
      // invisible mid-review and Next sometimes appearing to do nothing.
      clearAutoTimer();
      // Wrong answers that reveal the correct one get more time before the
      // auto-advance/auto-finish fires — the teacher found 1.4s too fast to
      // actually read the reveal. When the reveal is off (showAnswerWhenWrong
      // false) there's nothing extra to read, so keep the original brisk pace.
      const delay = st.correct ? 1000 : (revealShown ? 2600 : (outOfLives ? 1500 : 1400));
      if (outOfLives) {
        autoTimer = setTimeout(() => finish("gameover"), delay);
      } else if (state.every(s => s.graded)) {
        autoTimer = setTimeout(() => finish("complete"), delay);
      } else if (index < total - 1) {
        autoTimer = setTimeout(() => { if (!finished) goNext(); }, delay);
      }
    }
    function clearAutoTimer() { if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; } }

    // The visuals a graded question earns: is-correct/is-wrong on the input,
    // the answer-key reveal (if wrong and the option allows it), the sound,
    // and the flying mark. Pulled out of submitAnswer() so FIGHT MODE can
    // defer this whole bundle to revealFightMarks() instead of running it
    // immediately — see submitAnswer's own note on why.
    function applyGradeVisuals(st, it, revealShown) {
      input.classList.add(st.correct ? "is-correct" : "is-wrong");
      if (revealShown) {
        revealText.textContent = it.acceptedAnswers[0];
        revealWrap.classList.add("is-open");
        scheduleRevealRefit();
      }
      if (st.correct) ttaSound.correct(); else ttaSound.wrong();   // real Wordwall TTA pack
      flyMark(st.correct, input);
    }

    /**
     * ⭐⭐ TIME EACH ROUND — OUT OF TIME (Đợt 174, teacher 17/8/2026).
     * Registered with ui.setRoundTimeout(); the engine calls it when the
     * per-round count down reaches 0 with the question still open.
     *
     * The teacher's rule is "coi như sai" — count it wrong — so this walks the
     * SAME path submitAnswer() walks for a wrong answer: graded, input locked,
     * the ✗ + answer-key reveal, the wrong sound, a life, the minus points, and
     * the same auto-advance afterwards. Two deliberate differences:
     *   · `typed` stays empty and `timedOut` is set, so the review prints
     *     "No answer" instead of an empty box (see finish());
     *   · the reveal is shown whenever the option allows it, without
     *     submitAnswer's `!st.correct` half of the test — a timed-out question
     *     is never correct, and the class still needs to see the answer.
     *
     * ⚠️ NO "wait for the teacher to press ▷" here, unlike Quiz. This game has
     * always moved on by itself the moment a question is graded (teacher's spec,
     * 3/8/2026 — it has no "Auto next question" option at all), and a timeout is
     * a grade. Making this one case sit still would be the inconsistency, not
     * the rule.
     */
    function roundTimeUp() {
      const it = items[index];
      const st = state[index];
      if (!it || st.graded || finished || dead || fightLocked()) return;
      st.typed = "";
      st.graded = true;
      st.timedOut = true;
      st.correct = false;
      input.disabled = true;
      syncSubmitEnabled();
      updateNav();
      if (andrewGlowing) {
        andrewGlowing = false;
        revealWrap.classList.remove("is-andrew");
        kbd.refresh();
      }
      const revealShown = opt.showAnswerWhenWrong !== false;
      applyGradeVisuals(st, it, revealShown);
      const outOfLives = loseLife();
      clearAutoTimer();
      const delay = revealShown ? 2600 : (outOfLives ? 1500 : 1400);
      if (outOfLives) {
        autoTimer = setTimeout(() => finish("gameover"), delay);
      } else if (state.every(s => s.graded)) {
        autoTimer = setTimeout(() => finish("complete"), delay);
      } else if (index < total - 1) {
        autoTimer = setTimeout(() => { if (!finished) goNext(); }, delay);
      }
    }

    // FIGHT MODE — the match says the round is settled for both teams, so the
    // verdict withheld above can finally go up. Also runs on a board that
    // never got to answer (the other team took the word first), so IT is
    // shown the correct answer too — same pattern as quiz.js's
    // revealFightMarks / anagram.js's revealFightResult.
    function revealFightMarks() {
      const st = state[index], it = items[index];
      if (!it) { syncFightLock(); return; }
      if (fightPendingReveal) {
        fightPendingReveal = false;
        const revealShown = !st.correct && opt.showAnswerWhenWrong !== false;
        applyGradeVisuals(st, it, revealShown);
      } else if (!st.graded) {
        revealText.textContent = it.acceptedAnswers[0];
        revealWrap.classList.add("is-open");
      }
      syncFightLock();
    }

    // Apply a lock change WITHOUT rebuilding anything — the fight controller
    // calls lock(on) at the exact moment the OTHER board just finished, and a
    // rebuild right then (loadQuestion) would restart this question's voice
    // clip and replay its entrance animation: a flash on the board that just
    // lost (core/HUONG DAN CORE.md's "BẪY THỨ 5", the same trap quiz.js's own
    // syncFightLock exists to avoid).
    function syncFightLock() {
      const locked = fightLocked();
      const st = state[index];
      // An already-graded question keeps the input disabled regardless — it
      // was disabled the instant it was graded, and the lock must not hand it
      // back once the round moves on.
      if (!st.graded) input.disabled = locked;
      syncSubmitEnabled();   // folds fightLocked() in too — see its own definition
      // Grey while this board's go is over but its result isn't on show yet:
      // either it never got to play ("too slow" — the other team took the
      // question) or it HAS answered but the verdict is still withheld while
      // the other team finishes. Once revealed, an answered board drops the
      // grey so its own verdict reads in full colour.
      answerBlock.classList.toggle("is-fightlost", locked && (!st.graded || fightPendingReveal));
    }

    // The mark (big, thick ✓ / ✗ / "−N") is born ON the input's row (an absolute
    // child of the input row, so it always stays aligned with the box even after
    // the reveal opens), SHAKES a little, THEN flies to the score. Correct -> +1;
    // wrong with Minus -> −N flies and subtracts (the score may go negative);
    // wrong without Minus -> a cross that just fades in place.
    function flyMark(correct, inputEl) {
      if (!inputEl) return;
      // ⚠️ Đợt 170 — was `document.querySelector(".aw-top-score")`, forbidden by
      // the Fight contract (core/HUONG DAN CORE.md): that scans the WHOLE page,
      // so in a match it would fly this board's mark into whichever board's
      // score chip happens to sit first in the DOM, regardless of which one
      // actually answered. `scoreTargetEl()` reads THIS board's own chip, or
      // (fighting) the shared team chip this board owns.
      const scoreEl = scoreTargetEl();
      const size = Math.max(34, inputEl.getBoundingClientRect().height * 0.72);   // bigger than before

      const penalty = Math.max(0, Math.min(POINTS_MAX, Number(opt.minusAmount) || 0));
      const wrongMinus = !correct && penalty > 0;
      const mark = el("div", "aw-tta-flymark" + (correct ? "" : " is-cross") + (wrongMinus ? " is-penalty" : ""),
        correct ? icons.check : (wrongMinus ? `−${penalty}` : icons.cross));
      mark.style.width = size + "px";
      mark.style.height = size + "px";
      if (wrongMinus) mark.style.fontSize = Math.round(size * 0.86) + "px";
      // sit just outside the RIGHT edge of the input row, vertically centred on it
      row.style.position = "relative";
      mark.style.position = "absolute";
      mark.style.right = `-${Math.round(size + 22)}px`;   // a bit further out from the input row (was +6)
      mark.style.top = "50%";
      mark.style.marginTop = `-${Math.round(size / 2)}px`;
      row.append(mark);
      activeFlyNodes.add(mark);

      let done = false;
      const cleanupMark = () => { if (done) return; done = true; mark.remove(); activeFlyNodes.delete(mark); };
      const shouldFly = correct || wrongMinus;

      // 1) a little shake in place (grows, wobbles) — draws the eye before it flies.
      const shake = mark.animate([
        { transform: "scale(.6) rotate(0deg)", opacity: 0, offset: 0 },
        { transform: "scale(1.18) rotate(0deg)", opacity: 1, offset: 0.28 },
        { transform: "scale(1.05) rotate(-9deg)", offset: 0.5 },
        { transform: "scale(1.1) rotate(8deg)", offset: 0.7 },
        { transform: "scale(1.05) rotate(-4deg)", offset: 0.85 },
        { transform: "scale(1) rotate(0deg)", offset: 1 }
      ], { duration: 430, easing: "ease-in-out", fill: "forwards" });

      const afterShake = () => {
        if (!shouldFly || !scoreEl) {
          // fade in place (wrong, no Minus)
          const fade = mark.animate([{ opacity: 1 }, { opacity: 1, offset: 0.5 }, { opacity: 0 }],
            { duration: 620, easing: "ease", fill: "forwards" });
          fade.onfinish = cleanupMark;
          setTimeout(cleanupMark, 700);
          return;
        }
        // 2) re-parent to <body> at its current spot and fly to the score.
        const rect = mark.getBoundingClientRect();
        document.body.append(mark);
        mark.style.position = "fixed";
        mark.style.left = rect.left + "px";
        mark.style.top = rect.top + "px";
        mark.style.right = "";
        mark.style.marginTop = "";
        const end = scoreEl.getBoundingClientRect();
        const dx = (end.left + end.width / 2) - (rect.left + rect.width / 2);
        const dy = (end.top + end.height / 2) - (rect.top + rect.height / 2);
        const dur = 480;
        const fly = mark.animate([
          { transform: "translate(0,0) scale(1)", opacity: 1, offset: 0 },
          { transform: `translate(${dx}px, ${dy}px) scale(.4)`, opacity: 0, offset: 1 }
        ], { duration: dur, easing: "cubic-bezier(.3,.6,.3,1)", fill: "forwards" });
        const land = () => {
          // Đợt 114 — `done` alone was not enough: cleanup() removes the flying
          // node but never sets it, so this landed ~1s after the play was thrown
          // away and pushed the dead game's points onto the NEXT game's score
          // badge (showScore/pulseScoreTo look `.aw-top-score` up live).
          if (done || dead) return;
          cleanupMark();
          const oldPts = livePoints;
          livePoints = correct ? livePoints + 1 : livePoints - penalty;   // may go negative
          // Both ends of the pulse are SHOWN values (tally minus the idle clock),
          // not raw tallies — otherwise every gained point would repaint the chip
          // without the Time cost deduction and quietly undo it.
          pulseScoreTo(oldPts - timeCostSoFar(), scoreNow());
        };
        fly.onfinish = land;
        setTimeout(land, dur + 150);
      };
      shake.onfinish = afterShake;
      setTimeout(() => { if (!done && mark.isConnected && mark.parentElement === row) afterShake(); }, 500);
    }

    // ===== LIVES (opt-in via Options; ui.livesSlot is a span left of the score,
    // reserved by tpl.hasLivesSlot) — same rendering pattern as True/false. =====
    function renderLives() {
      const slot = ui.livesSlot;
      if (!slot) return;
      slot.innerHTML = "";
      if (livesLeft == null) return;                 // unlimited -> no hearts shown
      if (livesLeft <= 5) {
        for (let i = 0; i < livesLeft; i++) slot.append(el("span", "aw-top-heart", "&#9829;"));
      } else {
        slot.append(el("span", "aw-top-heartcount", String(livesLeft)));
        slot.append(el("span", "aw-top-heart", "&#9829;"));
      }
    }
    // Costs one life on a wrong answer; pops the LEFTMOST heart out, then
    // re-renders. Returns true once that was the last life (the game ends
    // immediately — see submitAnswer/finish("gameover")).
    function loseLife() {
      if (livesLeft == null) return false;            // unlimited -> can't lose
      const slot = ui.livesSlot;
      const gone = (livesLeft <= 5 && slot) ? slot.firstChild : null;
      livesLeft = Math.max(0, livesLeft - 1);
      if (gone) {
        let done = false;
        const finishPop = () => { if (done) return; done = true; renderLives(); };
        try {
          const a = gone.animate(
            [{ transform: "scale(1)", opacity: 1 }, { transform: "scale(1.7)", opacity: 0 }],
            { duration: 320, easing: "ease-in", fill: "forwards" });
          a.onfinish = finishPop;
        } catch (e) { finishPop(); }
        setTimeout(finishPop, 360);
      } else {
        renderLives();
      }
      return livesLeft <= 0;
    }

    // Score reads "correct/max" (e.g. ✓ 1/6, or ✓ -3/6). The running number is
    // GREEN when ≥0 and RED WITH a leading "-" when negative (teacher,
    // 11/8/2026 — previously dropped the sign and relied on colour alone,
    // same change as core's ui.setScore()); the slash and the TOTAL are always
    // the normal dark text colour. Numerator, slash and total are separate
    // flex items, so `.aw-top-score`'s own `gap` spaces them evenly
    // (numerator↔slash == slash↔total).
    // TIME COST (Đợt 143): `livePoints` stays this game's own tally (the fly/
    // pulse animations read and write it); the idle clock's total comes off on
    // the way to the SCREEN so it can never be folded into that tally twice.
    function timeCostSoFar() { return ui.timeCostTotal ? ui.timeCostTotal() : 0; }
    function scoreNow() { return livePoints - timeCostSoFar(); }

    function scoreHTML(v) {
      const cls = v < 0 ? "aw-tta-score-neg" : "aw-tta-score-pos";
      return `${icons.check}`
        + `<span class="aw-tta-score-num ${cls}">${v}</span>`
        + `<span class="aw-tta-score-sep">/</span>`
        + `<span class="aw-tta-score-total">${total}</span>`;
    }
    function showScore(n) {
      if (dead) return;   // Đợt 114 — live lookup; on a dead play this is the NEXT game's badge
      // ⚠️ Đợt 170 — was `document.querySelector(".aw-top-score")`, forbidden
      // by the Fight contract for the same reason as flyMark above. `ui.scoreEl`
      // is THIS board's own chip specifically.
      const scoreEl = ui.scoreEl;
      if (scoreEl) scoreEl.innerHTML = scoreHTML(n);
      // This template draws its own chip instead of calling ui.setScore(), so
      // it never gets that function's automatic `fight.ctl.onScore()` forward
      // (core/engine.js's own note on setScorePainter explains why) — done by
      // hand here instead. The shared team chip is what actually shows during
      // a match (this board's in-frame chip is visibility:hidden then).
      if (fightCtl) fightCtl.onScore(fightSide, n);
    }

    // Animate `.aw-top-score` from oldValue to newValue with a small bounce.
    function pulseScoreTo(oldValue, newValue) {
      if (dead) return;   // Đợt 114 — see showScore
      const scoreEl = ui.scoreEl;   // Đợt 170 — was document.querySelector(".aw-top-score")
      if (!scoreEl) return;
      if (oldValue === newValue) { showScore(newValue); return; }
      scoreEl.classList.remove("aw-score-pulse"); void scoreEl.offsetWidth;
      scoreEl.classList.add("aw-score-pulse");
      const start = performance.now();
      const PULSE_MS = 380;
      let done = false;
      const finishPulse = () => {
        if (done) return; done = true;
        showScore(newValue);
        setTimeout(() => scoreEl.classList.remove("aw-score-pulse"), 200);
      };
      const step = now => {
        if (done) return;
        const t = Math.min(1, (now - start) / PULSE_MS);
        const eased = 1 - Math.pow(1 - t, 3);
        const val = Math.round(oldValue + (newValue - oldValue) * eased);
        scoreEl.innerHTML = scoreHTML(val);
        if (t < 1) requestAnimationFrame(step);
        else finishPulse();
      };
      requestAnimationFrame(step);
      setTimeout(finishPulse, PULSE_MS + 150);   // fallback if rAF never fires
    }

    // "Andrew help" — reveal the correct answer so the student can copy it, and
    // light the Andrew key up. Consumes the one game-wide use immediately.
    function useAndrew() {
      const st = state[index];
      // Đợt 170 — belt and braces: the keyboard's own key is already disabled
      // for the whole match (see createKeyboard's extraKey.isDisabled above),
      // this just makes sure nothing else can reach it either.
      if (andrewUsed || st.graded || fightCtl) return;
      andrewUsed = true;
      andrewGlowing = true;
      const it = items[index];
      revealText.textContent = it.acceptedAnswers[0];
      revealWrap.classList.add("is-open", "is-andrew");
      scheduleRevealRefit();
      kbd.refresh();   // Andrew key -> "glowing"
      if (!input.disabled) input.focus();
    }
    function insertChar(inp, ch) {
      if (!inp || inp.disabled) return;
      // TIME COST (Đợt 143): typing IS this game's progress. Grading only
      // happens on Submit, so waiting for that would charge a class for the
      // whole time they spend spelling the answer out — which is the work.
      ui.noteActivity?.();
      const start = inp.selectionStart ?? inp.value.length;
      const end = inp.selectionEnd ?? inp.value.length;
      inp.value = inp.value.slice(0, start) + ch + inp.value.slice(end);
      const pos = start + ch.length;
      inp.setSelectionRange(pos, pos);
      autoGrow(inp);
      syncSubmitEnabled();
      inp.focus();
    }
    function backspace(inp) {
      if (!inp || inp.disabled) return;
      ui.noteActivity?.();   // TIME COST (Đợt 143): correcting a letter is progress too
      const start = inp.selectionStart ?? inp.value.length;
      const end = inp.selectionEnd ?? inp.value.length;
      if (start === end) {
        if (start === 0) return;
        inp.value = inp.value.slice(0, start - 1) + inp.value.slice(end);
        inp.setSelectionRange(start - 1, start - 1);
      } else {
        inp.value = inp.value.slice(0, start) + inp.value.slice(end);
        inp.setSelectionRange(start, start);
      }
      autoGrow(inp);
      syncSubmitEnabled();
      inp.focus();
    }

    // Next is blocked until the current question is answered, unless Allow skip is on.
    function canAdvance() { return allowSkip || state[index].graded; }

    function updateNav() {
      const isLast = index === total - 1;
      // No "finish/✓" button on the last question — the game auto-completes once
      // every question is answered (or via Menu -> Submit answers).
      ui.setNav({
        index: index + 1,
        total,
        onPrev: index > 0 ? goPrev : null,
        onNext: (isLast || !canAdvance()) ? null : goNext,
        nextLabel: null
      });
    }

    // Navigation uses the SAME "tock" as the letter keys (teacher's call). Only
    // the question text crossfades; the answer block stays put (no flicker).
    // Manual navigation always cancels any pending auto-advance/auto-finish left
    // over from the question just graded — otherwise that stale timer could fire
    // later (after the student has already moved elsewhere), yanking them forward
    // or ending the game while they're mid-review. See submitAnswer.
    function goPrev() { if (index > 0) { clearAutoTimer(); ui.sound.keyClick?.(); andrewGlowing = false; loadQuestion(index - 1, true); } }
    function goNext() { if (!canAdvance()) return; if (index < total - 1) { clearAutoTimer(); ui.sound.keyClick?.(); andrewGlowing = false; loadQuestion(index + 1, true); } }

    // FIGHT MODE — the match controller moving THIS board, because the OTHER
    // one navigated or the round advanced. Runs the same loadQuestion the
    // initiating board ran, so the two frames stay visually identical (same
    // pattern as quiz.js's jumpTo). No canAdvance()/gating here on purpose —
    // the controller is authoritative.
    function jumpTo(i) {
      const target = Math.max(0, Math.min(total - 1, i | 0));
      if (target === index) return;
      clearAutoTimer();
      andrewGlowing = false;
      loadQuestion(target, true);
    }

    // ----- FIGHT MODE: the match controller drives this board through here.
    // Registered after everything it references exists (jumpTo, syncFightLock,
    // revealFightMarks) — same placement reasoning as quiz.js.
    if (fightCtl) {
      fightCtl.attach(fightSide, {
        total,
        goToIndex: jumpTo,
        lock(on) {
          fightBoardLock = !!on;
          syncFightLock();
        },
        reveal: revealFightMarks
      });
    }

    function finish(reason = "complete") {
      if (finished) return;
      const answeredNow = state.filter(s => s.graded).length;
      if (answeredNow === 0) { ui.toast?.("Answer at least one question first."); return; }   // don't latch finished
      finished = true;
      clearAutoTimer();
      if (reason === "gameover") ttaSound.gameOver(); else ttaSound.complete();
      const perQuestion = state.map((s, i) => ({ q: i, correct: s.correct === true }));
      const correct = perQuestion.filter(p => p.correct).length;
      const review = items.map((it, i) => {
        const s = state[i];
        return {
          question: it.prompt,
          // Đợt 174 — a question the clock took is NOT "answered": it still
          // scores as wrong (see `wrongGraded` below, which asks `s.graded`),
          // but the review has to read "No answer" rather than show the empty
          // box the pupil left.
          answered: s.graded && !s.timedOut,
          yourText: (s.graded && !s.timedOut) ? s.typed : null,
          yourCorrect: s.correct === true,
          correctText: it.acceptedAnswers[0],
          src: it   // `items` is a shallow copy, so `it` IS the content object
        };
      });
      const answered = state.filter(s => s.graded).length;
      // Deducted score for ranking/summary: +1 per correct, −minusAmount per
      // wrong-and-graded question. Computed HERE from `state` (set synchronously
      // in submitAnswer) rather than read off `livePoints` — that variable is only
      // incremented inside the fly-to-score animation's `land()` callback, ~0.9–1.1s
      // after submit, which can still be pending when the LAST question's 1000ms
      // auto-finish timer fires (observed: last correct answer's +1 missing from
      // the final score even though the live badge already showed it seconds
      // later). Without any of this, the score silently defaulted to `correct`
      // and "Points off per wrong" had zero effect on the final result.
      const wrongGraded = state.filter(s => s.graded && s.correct === false).length;
      const penalty = Math.max(0, Math.min(POINTS_MAX, Number(opt.minusAmount) || 0));
      ui.finish({
        correct, incorrect: total - correct, total, perQuestion, review, answered,
        score: correct - penalty * wrongGraded
      });
    }

    return function cleanup() {
      dead = true;   // Đợt 114 — MUST be first; see land() / showScore / pulseScoreTo
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(rafFit);
      clearAutoTimer();
      activeFlyNodes.forEach(n => n.remove());
      activeFlyNodes.clear();
      voicePlayer.stop();
      if (ui.livesSlot) ui.livesSlot.innerHTML = "";
    };
  }
};

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

registerTemplate(ttaTemplate);
export default ttaTemplate;
