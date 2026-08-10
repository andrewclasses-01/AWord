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
import { shuffle, el } from "../../core/utils.js";
import { icons } from "../../core/icons.js";
import { createKeyboard } from "../../core/keyboard.js";
import { createVoicePlayer, DEFAULT_INTRO_DELAY_MS } from "../../core/voice-playback.js";
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
  // "Start with mistakes" (Đợt 84): which array in activity.content holds the
  // playable items. Core filters THAT array by the `src` refs the review rows
  // carry, so a replay keeps the originals untouched. See core/mistakes.js.
  itemsKey: "items",
  hidePointsOff: true,   // ships its own "Minus points" control -> hide the central Points off
  name: "Type the answer",
  edit: openTypeTheAnswerEditor,
  hideLettersOption: true,     // no lettered answer boxes here — hide that Options group entirely
  hideShuffleAnswers: true,    // no answer choices to shuffle — hide "Shuffle answer order"
  hasKeyboardToggle: true,     // ask engine.js for a slot next to Menu for our keyboard show/hide button
  hasLivesSlot: true,          // hearts render in the top bar, left of the score (same slot as True/false)
  hideAutoSwitch: true,        // always auto-advances a graded question itself now — the checkbox would be dead
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
  buildExtraOptions({ panel, draft, el, mkCheck }) {
    const g = el("div", "aw-opt-group");
    g.append(el("div", "aw-opt-label", "Type the answer"));
    const row = el("div", "aw-opt-row");

    // Slider (0..5): how many points a wrong answer deducts. 0 = off — the
    // slider alone decides now, no separate "Minus points" checkbox (teacher,
    // 3/8/2026: fewer controls to keep in sync).
    if (draft.minusAmount == null) draft.minusAmount = 0;
    const sliderWrap = el("div", "aw-tta-opt-minus");
    sliderWrap.append(el("span", "aw-tta-opt-minus-cap", "Points off per wrong"));
    const slider = el("input", "aw-tta-opt-slider");
    slider.type = "range"; slider.min = "0"; slider.max = "5"; slider.step = "1";
    slider.value = String(draft.minusAmount);
    const sliderVal = el("span", "aw-tta-opt-minus-val", slider.value === "0" ? "Off" : `−${slider.value}`);
    slider.oninput = () => {
      draft.minusAmount = +slider.value;
      sliderVal.textContent = slider.value === "0" ? "Off" : `−${slider.value}`;
    };
    sliderWrap.append(slider, sliderVal);

    row.append(
      mkCheck(draft.showAnswerWhenWrong !== false, "Show answer when wrong",
        v => draft.showAnswerWhenWrong = v),
      // Default OFF -> Next stays disabled (until answered) instead of letting the
      // student jump ahead without answering. Once answered, the game auto-advances
      // regardless of this box (see submitAnswer) — this only gates the MANUAL skip.
      mkCheck(draft.allowSkip === true, "Allow skip (move on without answering)",
        v => draft.allowSkip = v)
    );
    g.append(row);
    g.append(sliderWrap);
    panel.append(g);

    // Lives — a slider 0..10 (0 = Unlimited). New, 3/8/2026: a wrong answer costs
    // a heart (top bar, left of the score); hitting 0 ends the game right away.
    // Same control/rendering pattern as True/false's hearts (ui.livesSlot).
    const gLives = el("div", "aw-opt-group");
    gLives.append(el("div", "aw-opt-label", "Lives"));
    const rowLives = el("div", "aw-opt-row aw-tta-livesrow");
    const curLives = Number.isInteger(draft.lives) ? Math.min(MAX_LIVES, Math.max(0, draft.lives)) : 0;
    const livesVal = el("span", "aw-tta-livesval", curLives === 0 ? "Unlimited" : String(curLives));
    const livesInput = el("input", "aw-tta-livesslider");
    livesInput.type = "range"; livesInput.min = "0"; livesInput.max = String(MAX_LIVES); livesInput.step = "1";
    livesInput.value = String(curLives);
    livesInput.oninput = () => {
      const v = parseInt(livesInput.value, 10);
      draft.lives = v;   // 0 stored = unlimited
      livesVal.textContent = v === 0 ? "Unlimited" : String(v);
    };
    rowLives.append(livesInput, livesVal);
    gLives.append(rowLives);
    panel.append(gLives);
  },

  mount(root, activity, ui) {
    const opt = activity.options || {};
    const allowSkip = opt.allowSkip === true;   // move on without answering (default off)

    let items = [...(activity.content?.items || [])]
      .filter(it => it && it.prompt && Array.isArray(it.acceptedAnswers) && it.acceptedAnswers.length);
    if (opt.shuffleQuestions) items = shuffle(items);

    const total = items.length;
    if (total === 0) {
      root.innerHTML = "";
      root.append(el("div", "aw-tta-empty", "This activity has no questions yet."));
      return () => {};
    }

    const state = items.map(() => ({ typed: null, graded: false, correct: null }));
    let index = 0;
    let finished = false;
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
        isDisabled: () => state[index].graded || !input.value.trim()
      },
      extraKey: {
        label: "Andrew",
        className: "aw-tta-key-andrew",
        getState: () => !andrewUsed ? "ready" : (andrewGlowing ? "glowing" : "used"),
        isDisabled: () => andrewUsed || state[index].graded,
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
    showScore(livePoints);
    renderLives();

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
    // disabled while the box is empty or the question is already graded.
    function syncSubmitEnabled() {
      const st = state[index];
      submitBtn.disabled = st.graded || !input.value.trim();
      kbd.refresh();   // re-syncs the keyboard's own Submit key + the Andrew key
    }

    // ===== load a question into the persistent DOM (no rebuild) =====
    // The answer block + keyboard update INSTANTLY in place (so Submit never
    // flickers); only the question text crossfades when navigating.
    function loadQuestion(i, withFade) {
      index = i;
      const it = items[index];
      const st = state[index];

      // --- answer block, in place ---
      input.value = st.typed || "";
      input.disabled = st.graded;
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

      // --- question text ---
      const setPrompt = () => {
        voicePlayer.stop();   // silence the PREVIOUS question's clip, if any
        const oldBtn = qArea.querySelector(".aw-tta-listenbtn");
        if (oldBtn) oldBtn.remove();
        const hasVoice = !!it.voice;
        const hideText = hasVoice && !!it.hideText;
        promptEl.innerHTML = hideText ? "" : escapeHtml(it.prompt);
        if (hasVoice) {
          const vBtn = el("button", "aw-tta-listenbtn" + (hideText ? " is-lg" : ""), icons.soundOn);
          vBtn.type = "button";
          vBtn.setAttribute("aria-label", "Listen to pronunciation");
          vBtn.onclick = e => { e.stopPropagation(); voicePlayer.toggle(it.voice, vBtn); };
          qArea.append(vBtn);
          voicePlayer.playDelayed(it.voice, vBtn, firstQuestionSpoken ? 0 : DEFAULT_INTRO_DELAY_MS);
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
      if (st.graded || finished) return;
      if (!String(typed).trim()) return;   // can't submit an empty box
      st.typed = typed;
      st.graded = true;
      st.correct = it.acceptedAnswers.some(a => normalize(a) === normalize(typed));

      input.disabled = true;
      input.classList.add(st.correct ? "is-correct" : "is-wrong");
      syncSubmitEnabled();   // graded -> Submit off (outside + keyboard)
      updateNav();   // re-sync Next NOW (with Allow skip off, Next was disabled until this
                      // question was graded — without this it stayed stuck disabled until
                      // some unrelated Prev/Next call happened to refresh it)

      const revealShown = !st.correct && opt.showAnswerWhenWrong !== false;
      if (revealShown) {
        revealText.textContent = it.acceptedAnswers[0];
        revealWrap.classList.add("is-open");
        scheduleRevealRefit();
      }

      if (andrewGlowing) {
        andrewGlowing = false;
        revealWrap.classList.remove("is-andrew");   // the hint reveal turns into the normal green one
        kbd.refresh();   // Andrew key -> "used" now that glowing has ended
      }

      if (st.correct) ttaSound.correct(); else ttaSound.wrong();   // real Wordwall TTA pack
      flyMark(st.correct, input);
      const outOfLives = st.correct ? false : loseLife();

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

    // The mark (big, thick ✓ / ✗ / "−N") is born ON the input's row (an absolute
    // child of the input row, so it always stays aligned with the box even after
    // the reveal opens), SHAKES a little, THEN flies to the score. Correct -> +1;
    // wrong with Minus -> −N flies and subtracts (the score may go negative);
    // wrong without Minus -> a cross that just fades in place.
    function flyMark(correct, inputEl) {
      if (!inputEl) return;
      const scoreEl = document.querySelector(".aw-top-score");
      const size = Math.max(34, inputEl.getBoundingClientRect().height * 0.72);   // bigger than before

      const penalty = Math.max(0, Math.min(5, Number(opt.minusAmount) || 0));
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
          if (done) return;
          cleanupMark();
          const oldPts = livePoints;
          livePoints = correct ? livePoints + 1 : livePoints - penalty;   // may go negative
          pulseScoreTo(oldPts, livePoints);
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

    // Score reads "correct/max" (e.g. ✓ 1/6). The running number is GREEN when
    // ≥0 and RED when negative (no minus sign — red itself means below zero); the
    // slash and the TOTAL are always the normal dark text colour. Numerator,
    // slash and total are separate flex items, so `.aw-top-score`'s own `gap`
    // spaces them evenly (numerator↔slash == slash↔total).
    function scoreHTML(v) {
      const cls = v < 0 ? "aw-tta-score-neg" : "aw-tta-score-pos";
      return `${icons.check}`
        + `<span class="aw-tta-score-num ${cls}">${Math.abs(v)}</span>`
        + `<span class="aw-tta-score-sep">/</span>`
        + `<span class="aw-tta-score-total">${total}</span>`;
    }
    function showScore(n) {
      const scoreEl = document.querySelector(".aw-top-score");
      if (scoreEl) scoreEl.innerHTML = scoreHTML(n);
    }

    // Animate `.aw-top-score` from oldValue to newValue with a small bounce.
    function pulseScoreTo(oldValue, newValue) {
      const scoreEl = document.querySelector(".aw-top-score");
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
      if (andrewUsed || st.graded) return;
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
          answered: s.graded,
          yourText: s.graded ? s.typed : null,
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
      const penalty = Math.max(0, Math.min(5, Number(opt.minusAmount) || 0));
      ui.finish({
        correct, incorrect: total - correct, total, perQuestion, review, answered,
        score: correct - penalty * wrongGraded
      });
    }

    return function cleanup() {
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
