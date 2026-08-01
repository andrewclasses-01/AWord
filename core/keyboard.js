// =============================================================
// STANDARD ON-SCREEN KEYBOARD — shared by every AWord template that needs
// typed input. Extracted from Type the answer (31/7–1/8/2026, many
// teacher-approved tuning passes) so any template can reuse the SAME
// keyboard instead of writing its own. Dark, phone-style, 4 full-width rows
// — the look is FIXED regardless of theme (Classic/Beach/...).
//
//   Row 1: '  q…p  ⌫(red)
//   Row 2: caps  a…l  ?
//   Row 3: numbers  z…m  .  ,
//   Row 4: [extraKey?]  Space  [Submit?]
//
// `numbers` swaps rows 1–3 for a numbers/symbols layout. `caps` uppercases
// the NEXT letter typed then auto-releases (phone-shift style) — every
// template's grading ignores case, so this is cosmetic only. Numbers /
// punctuation / Space are always offered (a consistent keyboard everywhere);
// a template whose answers are letters-only (e.g. Crossword) simply ignores
// characters it doesn't want in its own `onChar`.
//
// createKeyboard({
//   sound,             // ui.sound — the per-key "tock" (respects mute)
//   onChar(ch),         // called with the literal character to insert
//                        // (already upper/lower per the caps state)
//   onBackspace(),
//   submit,             // optional { onClick(), isDisabled() } — omit for
//                        // no Submit key (a template that grades some other
//                        // way, e.g. Crossword grades per-word as you type)
//   extraKey            // optional { label, className, getState(), isDisabled(),
//                        //   onClick(), silent } — a template-specific 5th
//                        //   key (e.g. Type the answer's "Andrew help").
//                        //   getState() -> "ready" | "glowing" | "used" | null.
//                        //   `className` lets the template keep its OWN
//                        //   colours/animation in its own CSS file, keyed off
//                        //   that class + the is-ready/is-glowing/is-used
//                        //   state classes this module applies.
// })
//   -> { el, setHidden(bool), isHidden(), refresh() }
//   `el` is a PERSISTENT node — toggling numbers mode rebuilds only the rows
//   inside it, never `el` itself, so callers can hold one reference for the
//   life of the game (position/fit math, is-hidden toggling, etc).
//   `refresh()` re-syncs the Submit-disabled state and the extra key's state
//   IN PLACE (no rebuild) — call it whenever grading / question changes.
// =============================================================
import { el } from "./utils.js";

const L1 = ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"];
const L2 = ["a", "s", "d", "f", "g", "h", "j", "k", "l"];
const L3 = ["z", "x", "c", "v", "b", "n", "m"];
const N1 = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
const N2 = ["-", "/", ":", ";", "(", ")", "$", "&", "@"];
const N3 = ["!", "+", "=", "*", "%", "#", "_"];

export function createKeyboard({ sound, onChar, onBackspace, submit, extraKey }) {
  let capsOn = false;
  let numbersMode = false;

  const wrap = el("div", "aw-kbd");
  const main = el("div", "aw-kbd-main");
  wrap.append(main);
  renderRows();

  function renderRows() {
    main.innerHTML = "";
    const mkRow = () => el("div", "aw-kbd-row");

    if (!numbersMode) {
      const r1 = mkRow();
      r1.append(charKey("'"));
      L1.forEach(ch => r1.append(letterKey(ch)));
      r1.append(backspaceKey());
      main.append(r1);

      const r2 = mkRow();
      r2.append(capsKeyEl());
      L2.forEach(ch => r2.append(letterKey(ch)));
      r2.append(charKey("?"));
      main.append(r2);

      const r3 = mkRow();
      r3.append(numbersKeyEl());
      L3.forEach(ch => r3.append(letterKey(ch)));
      r3.append(charKey("."));
      r3.append(charKey(","));
      main.append(r3);
    } else {
      const r1 = mkRow();
      r1.append(charKey("'"));
      N1.forEach(ch => r1.append(charKey(ch)));
      r1.append(backspaceKey());
      main.append(r1);

      const r2 = mkRow();
      r2.append(capsKeyEl());   // inert while in numbers mode, shown disabled
      N2.forEach(ch => r2.append(charKey(ch)));
      r2.append(charKey("\""));
      main.append(r2);

      const r3 = mkRow();
      r3.append(numbersKeyEl());
      N3.forEach(ch => r3.append(charKey(ch)));
      r3.append(charKey("."));
      r3.append(charKey(","));
      main.append(r3);
    }

    const r4 = el("div", "aw-kbd-row aw-kbd-spacerow");
    if (extraKey) r4.append(extraKeyEl());
    const spaceKey = makeKey("Space", () => onChar?.(" "));
    spaceKey.classList.add("aw-kbd-space");
    r4.append(spaceKey);
    if (submit) {
      const submitKey = makeKey("Submit", () => submit.onClick?.(), true);   // silent — correct/wrong sound plays instead
      submitKey.classList.add("aw-kbd-submit");
      submitKey.disabled = !!submit.isDisabled?.();
      r4.append(submitKey);
    }
    main.append(r4);
  }

  function makeKey(label, onClick, silent) {
    const b = el("button", "aw-kbd-key", escapeHtml(label));
    b.type = "button";
    b.tabIndex = -1;                          // don't steal focus from the answer field
    b.onmousedown = e => e.preventDefault();  // keep the caller's caret/focus on click
    b.onclick = e => { if (!silent) sound?.keyClick?.(); onClick?.(e); };
    return b;
  }
  function charKey(ch) { return makeKey(ch, () => onChar?.(ch)); }
  // Glyph always uppercase; inserts uppercase only while caps is on. Caps
  // AUTO-OFF after one letter (phone-shift style).
  function letterKey(ch) {
    const b = makeKey(ch.toUpperCase(), () => {
      const upper = capsOn && !numbersMode;
      onChar?.(upper ? ch.toUpperCase() : ch);
      if (upper) setCaps(false);
    });
    b.classList.add("aw-kbd-key-letter");
    return b;
  }
  function backspaceKey() {
    const b = makeKey("⌫", () => onBackspace?.());
    b.classList.add("aw-kbd-key-back");   // red
    return b;
  }
  function fnKey(labelText, extraClass, onClick, disabled) {
    const b = el("button", "aw-kbd-key aw-kbd-key-fn " + extraClass);
    b.type = "button";
    b.tabIndex = -1;
    b.onmousedown = e => e.preventDefault();
    b.append(el("span", "aw-kbd-key-dot"), el("span", "aw-kbd-key-fnlabel", escapeHtml(labelText)));
    if (disabled) b.disabled = true;
    else if (onClick) b.onclick = () => { sound?.keyClick?.(); onClick(); };
    return b;
  }
  function capsKeyEl() {
    const cls = "aw-kbd-key-caps" + (capsOn && !numbersMode ? " is-active" : "");
    return fnKey("caps", cls, () => setCaps(!capsOn), numbersMode);
  }
  function numbersKeyEl() {
    const cls = "aw-kbd-key-numbers" + (numbersMode ? " is-active" : "");
    return fnKey("numbers", cls,
      () => { numbersMode = !numbersMode; if (numbersMode) capsOn = false; renderRows(); }, false);
  }
  function extraKeyEl() {
    const state = extraKey.getState?.();
    const disabled = !!extraKey.isDisabled?.();
    let cls = "aw-kbd-key-extra " + (extraKey.className || "");
    if (state === "ready") cls += " is-ready";
    else if (state === "glowing") cls += " is-glowing";
    else if (state === "used") cls += " is-used";
    return fnKey(extraKey.label || "", cls, disabled ? null : () => extraKey.onClick?.(), disabled);
  }
  function setCaps(on) {
    capsOn = on;
    const k = main.querySelector(".aw-kbd-key-caps");
    if (k) k.classList.toggle("is-active", capsOn && !numbersMode);
  }

  // Re-sync Submit-disabled + the extra key's state WITHOUT tearing down the
  // rows (numbers-mode toggling already rebuilds via renderRows above).
  function refresh() {
    const submitKeyEl = main.querySelector(".aw-kbd-submit");
    if (submitKeyEl && submit) submitKeyEl.disabled = !!submit.isDisabled?.();
    const extraKeyNode = main.querySelector(".aw-kbd-key-extra");
    if (extraKeyNode && extraKey) {
      const state = extraKey.getState?.();
      extraKeyNode.classList.remove("is-ready", "is-glowing", "is-used");
      if (state) extraKeyNode.classList.add("is-" + state);
      extraKeyNode.disabled = !!extraKey.isDisabled?.();
    }
  }

  return {
    el: wrap,
    setHidden(hidden) { wrap.classList.toggle("is-hidden", hidden); },
    isHidden() { return wrap.classList.contains("is-hidden"); },
    refresh
  };
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
