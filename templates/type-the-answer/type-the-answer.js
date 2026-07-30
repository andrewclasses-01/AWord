// =============================================================
// TEMPLATE: TYPE THE ANSWER — Wordwall style, English UI.
//  • One prompt at a time (same pagination model as Quiz): question near
//    the top, a big text input close under it, a smaller "Submit Answer"
//    button right below the input, and an on-screen QWERTY keyboard filling
//    the rest of the frame (30/7/2026 redesign, per Teacher Andrew).
//  • Matching ignores case (always) and accents (always) — no "strict" toggle.
//    Any of item.acceptedAnswers[] counts as correct.
//  • Correct -> a green check appears just outside the input (right side) and
//    flies to the score, incrementing it. Wrong -> a red cross appears the
//    same way; it flies to the score and DECREMENTS it only when
//    options.minusPoints is on, otherwise it just fades in place and the
//    score is untouched. Wrong also shows the correct answer in green ABOVE
//    the input (options.showAnswerWhenWrong) — the whole input+submit block
//    glides smoothly down to make room (CSS grid-rows trick, not transform).
// =============================================================

import { registerTemplate } from "../../core/registry.js";
import { shuffle, el } from "../../core/utils.js";
import { icons } from "../../core/icons.js";
import { autoFit } from "../../core/fit.js";
import { openTypeTheAnswerEditor } from "./type-the-answer-editor.js";

function normalize(str) {
  let s = String(str ?? "").trim().replace(/\s+/g, " ");
  s = s.normalize("NFD").replace(new RegExp("[\\u0300-\\u036f]", "g"), "");   // always ignore accents
  return s.toLowerCase();                                                     // always ignore case
}

const KBD_ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m"]
];
const KBD_NUMS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
const KBD_PUNCT = [",", ".", "'", "-", "?", "!"];

const ttaTemplate = {
  type: "type_the_answer",
  scorable: true,
  name: "Type the answer",
  edit: openTypeTheAnswerEditor,
  hideLettersOption: true,   // no lettered answer boxes here — hide that Options group entirely
  hasKeyboardToggle: true,   // ask engine.js for a slot next to Menu for our keyboard show/hide button

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
    row.append(
      mkCheck(draft.showAnswerWhenWrong !== false, "Show answer when wrong",
        v => draft.showAnswerWhenWrong = v),
      mkCheck(draft.minusPoints === true, "Minus points for wrong answers",
        v => draft.minusPoints = v)
    );
    g.append(row);
    panel.append(g);
  },

  mount(root, activity, ui) {
    const opt = activity.options || {};

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
    let fitter = null;
    let autoTimer = null;
    let livePoints = 0;                 // running score shown live (can be reduced by Minus mode)
    let keyboardVisible = true;         // ON by default every time the act is opened
    let keyboardEl = null;              // current keyboard node (rebuilt each render())
    const activeFlyNodes = new Set();   // stray document.body clones — swept on cleanup

    // ----- keyboard show/hide button, next to Menu (engine's opt-in slot) -----
    let kbdBtn = null;
    if (ui.kbdSlot) {
      ui.kbdSlot.innerHTML = "";
      kbdBtn = el("button", "aw-iconbtn", icons.keyboard);
      kbdBtn.type = "button";
      updateKbdBtn();
      kbdBtn.onclick = () => {
        keyboardVisible = !keyboardVisible;
        if (keyboardEl) keyboardEl.classList.toggle("is-hidden", !keyboardVisible);
        updateKbdBtn();
        fitter?.refit();
      };
      ui.kbdSlot.append(kbdBtn);
    }
    function updateKbdBtn() {
      if (!kbdBtn) return;
      kbdBtn.title = keyboardVisible ? "Hide keyboard" : "Show keyboard";
      kbdBtn.setAttribute("aria-label", kbdBtn.title);
      kbdBtn.classList.toggle("is-off", !keyboardVisible);
    }

    ui.onSubmit(finish);
    render();

    function render() {
      if (fitter) { fitter.destroy(); fitter = null; }
      root.innerHTML = "";
      const it = items[index];
      const st = state[index];

      const card = el("div", "aw-tta-card");
      const promptEl = el("div", "aw-tta-prompt", escapeHtml(it.prompt));
      card.append(promptEl);

      const area = el("div", "aw-tta-answer-area");

      const alreadyWrongShown = st.graded && !st.correct && opt.showAnswerWhenWrong !== false;
      const revealWrap = el("div", "aw-tta-revealwrap" + (alreadyWrongShown ? " is-open" : ""));
      const revealInner = el("div", "aw-tta-reveal-inner");
      revealInner.append(el("div", "aw-tta-reveal-text", alreadyWrongShown ? escapeHtml(it.acceptedAnswers[0]) : ""));
      revealWrap.append(revealInner);
      area.append(revealWrap);

      const row = el("div", "aw-tta-inputrow");
      const input = el("input", "aw-tta-input");
      input.type = "text";
      input.autocomplete = "off";
      input.spellcheck = false;
      input.placeholder = "Type your answer...";
      input.value = st.typed || "";
      if (st.graded) {
        input.disabled = true;
        input.classList.add(st.correct ? "is-correct" : "is-wrong");
      } else {
        input.addEventListener("keydown", e => { if (e.key === "Enter") submitAnswer(input.value); });
      }
      row.append(input);
      area.append(row);

      const submitBtn = el("button", "aw-tta-submit", "Submit Answer");
      submitBtn.type = "button";
      submitBtn.disabled = st.graded;
      submitBtn.onclick = () => submitAnswer(input.value);
      area.append(submitBtn);

      card.append(area);

      const kbd = buildKeyboard(() => root.querySelector(".aw-tta-input"));
      if (!keyboardVisible) kbd.classList.add("is-hidden");
      card.append(kbd);
      keyboardEl = kbd;

      root.append(card);

      fitter = autoFit(root, card, s => card.style.setProperty("--fit", s), {
        slack: root.clientWidth * 0.08,
        measure: () => promptEl.offsetHeight + area.offsetHeight + (keyboardVisible ? kbd.offsetHeight : 0)
      });

      updateNav();
      if (!st.graded) input.focus();
    }

    function submitAnswer(typed) {
      const it = items[index];
      const st = state[index];
      if (st.graded || finished) return;
      st.typed = typed;
      st.graded = true;
      st.correct = it.acceptedAnswers.some(a => normalize(a) === normalize(typed));

      // Patch the EXISTING DOM in place (don't call render()) so the reveal's
      // CSS transition actually plays — a full rebuild would create the
      // revealed state already "open", and nothing animates on first paint.
      const card = root.querySelector(".aw-tta-card");
      const inputEl = card.querySelector(".aw-tta-input");
      const submitBtn = card.querySelector(".aw-tta-submit");
      const revealWrap = card.querySelector(".aw-tta-revealwrap");
      const revealText = card.querySelector(".aw-tta-reveal-text");

      inputEl.disabled = true;
      inputEl.classList.add(st.correct ? "is-correct" : "is-wrong");
      submitBtn.disabled = true;

      if (!st.correct && opt.showAnswerWhenWrong !== false) {
        // revealWrap already exists (painted closed from this question's own
        // render() call, not created just now), so no rAF double-buffering
        // trick is needed here — adding the class straight away still lets
        // the browser see a real "closed -> open" state change to transition.
        revealText.textContent = it.acceptedAnswers[0];
        revealWrap.classList.add("is-open");
        let refitDone = false;
        const doRefit = () => { if (refitDone) return; refitDone = true; fitter?.refit(); };
        revealWrap.addEventListener("transitionend", doRefit, { once: true });
        setTimeout(doRefit, 400);   // fallback — a hidden/backgrounded tab can skip transitionend
      }

      if (st.correct) ui.sound.correct(); else ui.sound.wrong();
      flyMark(st.correct, inputEl);

      if (state.every(s => s.graded)) {
        autoTimer = setTimeout(finish, st.correct ? 1000 : 1500);
      }
    }

    // Big check/cross appears just OUTSIDE the input (right side). Correct
    // always flies to the score and adds a point. Wrong flies and SUBTRACTS a
    // point only when options.minusPoints is on; otherwise it just fades in
    // place and the score is left untouched.
    function flyMark(correct, inputEl) {
      if (!inputEl) return;
      const scoreEl = document.querySelector(".aw-top-score");
      const startRect = inputEl.getBoundingClientRect();
      const cx = startRect.right + 14;
      const cy = startRect.top + startRect.height / 2;
      const size = Math.max(28, startRect.height * 0.55);

      const wrap = el("div", "aw-tta-flymark" + (correct ? "" : " is-cross"), correct ? icons.check : icons.cross);
      wrap.style.width = size + "px";
      wrap.style.height = size + "px";
      wrap.style.left = cx + "px";
      wrap.style.top = cy + "px";
      document.body.append(wrap);
      activeFlyNodes.add(wrap);

      const shouldFly = correct || opt.minusPoints === true;
      let done = false;

      if (!shouldFly || !scoreEl) {
        const anim = wrap.animate([
          { opacity: 1, transform: "translateY(-50%) scale(1)", offset: 0 },
          { opacity: 1, transform: "translateY(-50%) scale(1)", offset: 0.55 },
          { opacity: 0, transform: "translateY(-50%) scale(.85)", offset: 1 }
        ], { duration: 900, easing: "ease", fill: "forwards" });
        const complete = () => { if (done) return; done = true; wrap.remove(); activeFlyNodes.delete(wrap); };
        anim.onfinish = complete;
        setTimeout(complete, 1000);
        return;
      }

      const endRect = scoreEl.getBoundingClientRect();
      const dx = (endRect.left + endRect.width / 2) - cx;
      const dy = (endRect.top + endRect.height / 2) - cy;
      const HOLD = 380, FLIGHT = 480, total = HOLD + FLIGHT;
      const holdFrac = HOLD / total;

      const anim = wrap.animate([
        { transform: "translateY(-50%) scale(1)", offset: 0 },
        { transform: "translateY(-50%) scale(1.15)", offset: holdFrac },
        { transform: `translate(${dx}px, calc(-50% + ${dy}px)) scale(.4)`, offset: 1 }
      ], { duration: total, easing: "cubic-bezier(.3,.6,.3,1)", fill: "forwards" });
      wrap.animate([
        { opacity: 1, offset: 0 },
        { opacity: 1, offset: Math.min(1, (HOLD + FLIGHT * 0.6) / total) },
        { opacity: 0, offset: 1 }
      ], { duration: total, easing: "linear", fill: "forwards" });

      const complete = () => {
        if (done) return; done = true;
        wrap.remove(); activeFlyNodes.delete(wrap);
        livePoints = correct ? livePoints + 1 : Math.max(0, livePoints - 1);
        pulseScoreTo(livePoints);
      };
      anim.onfinish = complete;
      setTimeout(complete, total + 150);
    }

    // Animates `.aw-top-score` from whatever it currently shows up to
    // `newValue`, with a little bounce (same technique as Anagram's
    // flyScoreGain/pulseScoreTo) — reaches directly into engine.js's element
    // since ui.setScore() itself has no animated form.
    function pulseScoreTo(newValue) {
      const scoreEl = document.querySelector(".aw-top-score");
      if (!scoreEl) return;
      const match = /(-?\d+)/.exec(scoreEl.textContent || "");
      const oldValue = match ? parseInt(match[1], 10) : 0;
      if (oldValue === newValue) { scoreEl.innerHTML = `${icons.check} ${newValue}`; return; }
      scoreEl.classList.remove("aw-score-pulse"); void scoreEl.offsetWidth;
      scoreEl.classList.add("aw-score-pulse");
      const start = performance.now();
      const PULSE_MS = 380;
      let done = false;
      const finishPulse = () => {
        if (done) return; done = true;
        scoreEl.innerHTML = `${icons.check} ${newValue}`;
        setTimeout(() => scoreEl.classList.remove("aw-score-pulse"), 200);
      };
      const step = now => {
        if (done) return;
        const t = Math.min(1, (now - start) / PULSE_MS);
        const eased = 1 - Math.pow(1 - t, 3);
        const val = Math.round(oldValue + (newValue - oldValue) * eased);
        scoreEl.innerHTML = `${icons.check} ${val}`;
        if (t < 1) requestAnimationFrame(step);
        else finishPulse();
      };
      requestAnimationFrame(step);
      // Fallback in case rAF never fires (e.g. a hidden/backgrounded tab) —
      // same reasoning as the setTimeout backstop every element.animate() in
      // this app already has (see APP_MASTER.md bẫy list).
      setTimeout(finishPulse, PULSE_MS + 150);
    }

    // ----- on-screen QWERTY keyboard: QWERTY in the middle, numbers on the
    // left, punctuation on the right — `getInput()` fetches the CURRENT input
    // element fresh (it's rebuilt on every render()). -----
    function buildKeyboard(getInput) {
      const wrap = el("div", "aw-tta-kbd");

      const nums = el("div", "aw-tta-kbd-side aw-tta-kbd-nums");
      KBD_NUMS.forEach(ch => nums.append(makeKey(ch, () => insertChar(getInput(), ch))));

      const main = el("div", "aw-tta-kbd-main");
      KBD_ROWS.forEach((letters, ri) => {
        const rowEl = el("div", "aw-tta-kbd-row");
        letters.forEach(ch => rowEl.append(makeKey(ch.toUpperCase(), () => insertChar(getInput(), ch))));
        if (ri === 0) {
          const bk = makeKey("⌫", () => backspace(getInput()));
          bk.classList.add("is-wide");
          rowEl.append(bk);
        }
        main.append(rowEl);
      });
      const spaceRow = el("div", "aw-tta-kbd-row");
      const spaceKey = makeKey("Space", () => insertChar(getInput(), " "));
      spaceKey.classList.add("aw-tta-kbd-space");
      spaceRow.append(spaceKey);
      main.append(spaceRow);

      const punct = el("div", "aw-tta-kbd-side aw-tta-kbd-punct");
      KBD_PUNCT.forEach(ch => punct.append(makeKey(ch, () => insertChar(getInput(), ch))));

      wrap.append(nums, main, punct);
      return wrap;
    }
    function makeKey(label, onClick) {
      const b = el("button", "aw-tta-key", escapeHtml(label));
      b.type = "button";
      b.tabIndex = -1;                 // don't steal focus from the text input
      b.onmousedown = e => e.preventDefault();   // keep the input's caret/focus on click
      b.onclick = onClick;
      return b;
    }
    function insertChar(input, ch) {
      if (!input || input.disabled) return;
      const start = input.selectionStart ?? input.value.length;
      const end = input.selectionEnd ?? input.value.length;
      input.value = input.value.slice(0, start) + ch + input.value.slice(end);
      const pos = start + ch.length;
      input.setSelectionRange(pos, pos);
      input.focus();
    }
    function backspace(input) {
      if (!input || input.disabled) return;
      const start = input.selectionStart ?? input.value.length;
      const end = input.selectionEnd ?? input.value.length;
      if (start === end) {
        if (start === 0) return;
        input.value = input.value.slice(0, start - 1) + input.value.slice(end);
        input.setSelectionRange(start - 1, start - 1);
      } else {
        input.value = input.value.slice(0, start) + input.value.slice(end);
        input.setSelectionRange(start, start);
      }
      input.focus();
    }

    function updateNav() {
      const isLast = index === total - 1;
      ui.setNav({
        index: index + 1,
        total,
        onPrev: index > 0 ? goPrev : null,
        onNext: isLast ? finish : goNext,
        nextLabel: isLast ? icons.check : null
      });
    }

    function fadeSwap(change) {
      const card = root.querySelector(".aw-tta-card");
      if (!card) { change(); return; }
      let done = false;
      const run = () => { if (done) return; done = true; change(); };
      const anim = card.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: "ease", fill: "forwards" });
      anim.onfinish = run;
      setTimeout(run, 220);
    }
    function goPrev() { if (index > 0) fadeSwap(() => { index--; render(); }); }
    function goNext() { if (index < total - 1) fadeSwap(() => { index++; render(); }); }

    function finish() {
      if (finished) return;
      finished = true;
      const perQuestion = state.map((s, i) => ({ q: i, correct: s.correct === true }));
      const correct = perQuestion.filter(p => p.correct).length;
      const review = items.map((it, i) => {
        const s = state[i];
        return {
          question: it.prompt,
          answered: s.graded,
          yourText: s.graded ? s.typed : null,
          yourCorrect: s.correct === true,
          correctText: it.acceptedAnswers[0]
        };
      });
      const answered = state.filter(s => s.graded).length;
      ui.finish({ correct, incorrect: total - correct, total, perQuestion, review, answered });
    }

    return function cleanup() {
      if (fitter) fitter.destroy();
      if (autoTimer) clearTimeout(autoTimer);
      activeFlyNodes.forEach(n => n.remove());
      activeFlyNodes.clear();
    };
  }
};

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

registerTemplate(ttaTemplate);
export default ttaTemplate;
