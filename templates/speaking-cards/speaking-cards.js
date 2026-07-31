// =============================================================
// TEMPLATE: SPEAKING CARDS — Wordwall style, English UI. BOARD GAMES look
// (the "Board Games" visual style on Wordwall) is baked in as the AWord
// "Classic" look for this game (teacher's call, 1/8/2026).
//
// HOW IT PLAYS (captured from the real Wordwall act 116796629):
//   A face-down DECK of ornate playing cards sits on the left over a blue
//   board-game table. Press the deck (or the Deal button) -> the top card
//   flies onto a deal place and FLIPS open to reveal a speaking prompt for a
//   student to talk about. Shuffle re-shuffles the deck, Undo takes back the
//   last deal. "Number of deal places" (1..10) lays out several cards at once.
//   It is OPEN-ENDED: no right/wrong, no score, no leaderboard. An optional
//   countdown can be set; when it hits 0 the round simply ends ("Time's up").
//
// This template is `scorable: false` — it never calls ui.finish(), so the
// engine's Game-complete / summary / leaderboard flow is never triggered.
// The engine still builds a score chip + prev/next nav that mean nothing here,
// so mount() hides them (see hideScoreAndNav). The only per-round options that
// apply are Timer, Shuffle item order and Number of deal places — see
// buildExtraOptions (which also prunes the Quiz-only controls from the panel).
//
// All art is self-contained inline SVG (no external images), same as
// balloon-pop.js. element.animate() calls that must settle (the deal fly + the
// flip) carry a setTimeout fallback + done-guard per HUONG DAN CORE / CONG
// THUC MAU §3.4.
// =============================================================

import { registerTemplate } from "../../core/registry.js";
import { shuffle, el } from "../../core/utils.js";
import { autoFit } from "../../core/fit.js";
import { makeNumberStepper } from "../../core/numberstepper.js";
import { scSound } from "./speaking-cards-sound.js";

// How many deal places fit per row for a given count (kept tidy by hand).
const COLS_FOR = { 1:1, 2:2, 3:3, 4:2, 5:3, 6:3, 7:4, 8:4, 9:3, 10:5 };

// ---------- inline art (self-contained) ----------
// The ornate gold BACK of a card (fills the white card body). Corner "plus"
// ornaments + a dotted board-game track + a central diamond with a disc,
// echoing the Board Games deck on Wordwall.
const CARD_BACK_SVG = `<svg class="aw-sc-cardart" viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" preserveAspectRatio="none">
  <rect x="10" y="10" width="180" height="260" rx="14" fill="#e9b949"/>
  <rect x="20" y="20" width="160" height="240" rx="10" fill="#d79a2b"/>
  <rect x="30" y="30" width="140" height="220" rx="8" fill="none" stroke="#b9791a" stroke-width="3" stroke-dasharray="4 5"/>
  <g fill="#f3d789">
    <path d="M100 74 L150 140 L100 206 L50 140 Z"/>
  </g>
  <circle cx="100" cy="140" r="26" fill="#e9b949" stroke="#b9791a" stroke-width="3"/>
  ${cornerPlus(30, 30)}${cornerPlus(170, 30)}${cornerPlus(30, 250)}${cornerPlus(170, 250)}
</svg>`;

function cornerPlus(cx, cy) {
  return `<g fill="#b9791a"><rect x="${cx-9}" y="${cy-2.5}" width="18" height="5" rx="2"/><rect x="${cx-2.5}" y="${cy-9}" width="5" height="18" rx="2"/></g>`;
}

// Four small gold corner ornaments that sit ON TOP of the white FRONT of a
// card (the content bubble sits inside them).
const CARD_FRONT_ORN = `<svg class="aw-sc-frontorn" viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" preserveAspectRatio="none">
  ${cornerPlus(26, 26)}${cornerPlus(174, 26)}${cornerPlus(26, 254)}${cornerPlus(174, 254)}
</svg>`;

// Board-game props scattered on the table (behind the cards). Kept subtle.
const PROP_CHECKERS = `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  ${(() => { let s=""; for (let r=0;r<8;r++) for (let c=0;c<8;c++){ if((r+c)%2===0) s+=`<rect x="${c*15}" y="${r*15}" width="15" height="15" fill="#3a6ea5"/>`; } return s; })()}
  <circle cx="22" cy="97" r="8" fill="#e23c3c"/><circle cx="52" cy="97" r="8" fill="#e23c3c"/>
  <circle cx="67" cy="22" r="8" fill="#1f2a44"/><circle cx="97" cy="52" r="8" fill="#1f2a44"/>
</svg>`;
const PROP_DOMINO = `<svg viewBox="0 0 60 110" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <rect x="4" y="4" width="52" height="102" rx="8" fill="#f6f1e3" stroke="#cbb994" stroke-width="3"/>
  <line x1="8" y1="55" x2="52" y2="55" stroke="#cbb994" stroke-width="3"/>
  <g fill="#2b2b2b"><circle cx="20" cy="22" r="4"/><circle cx="40" cy="22" r="4"/><circle cx="20" cy="40" r="4"/><circle cx="40" cy="40" r="4"/>
  <circle cx="30" cy="80" r="4"/></g>
</svg>`;
const PROP_DICE = `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <rect x="10" y="10" width="60" height="60" rx="12" fill="#fbfbfb" stroke="#d4d4d4" stroke-width="3"/>
  <g fill="#e23c3c"><circle cx="27" cy="27" r="6"/><circle cx="53" cy="53" r="6"/></g>
  <g fill="#2b2b2b"><circle cx="53" cy="27" r="6"/><circle cx="27" cy="53" r="6"/><circle cx="40" cy="40" r="6"/></g>
</svg>`;

const speakingCardsTemplate = {
  type: "speaking_cards",
  scorable: false,
  name: "Speaking cards",
  hideLettersOption: true,   // no lettered answers here — engine skips that Options group



  // Engine hooks it auto-calls: restart sound on "Start again", a warning as
  // the countdown runs low.
  sounds: {
    restart: scSound.restart,
    timeWarning: scSound.timesUp
  },

  mount(root, activity, ui) {
    const opt = activity.options || {};
    const cards = (activity.content?.cards || []).filter(c => c && (String(c.text || "").trim() !== "" || c.image));
    const dealPlaces = Math.max(1, Math.min(10, Number(opt.dealPlaces) || 1));

    // The engine builds a score chip + prev/next nav that are meaningless for
    // an open-ended game — hide them (they live outside `root`, up in the stage).
    const restoreChrome = hideScoreAndNav(root);

    if (cards.length === 0) {
      root.innerHTML = "";
      root.append(el("div", "aw-sc-empty", "No cards yet — add some in Edit."));
      return () => { restoreChrome(); };
    }

    // ----- deck / table state -----
    const order = () => (opt.shuffleQuestions !== false)
      ? shuffle(cards.map((_, i) => i))
      : cards.map((_, i) => i);
    let pile = order();                       // indices still in the draw pile
    let discard = [];                          // indices that left a deal place
    let slots = new Array(dealPlaces).fill(null); // cardIndex currently on each place (or null)
    let history = [];                          // deal history for Undo
    let rr = 0;                                // round-robin: which place gets the next deal
    let roundOver = false;
    let busy = false;                          // guards against double-deal mid-animation

    // ----- scene -----
    root.innerHTML = "";
    const scene = el("div", "aw-sc-scene");

    const propsLayer = el("div", "aw-sc-props");
    propsLayer.innerHTML =
      `<span class="aw-sc-prop aw-sc-prop-checkers">${PROP_CHECKERS}</span>` +
      `<span class="aw-sc-prop aw-sc-prop-domino">${PROP_DOMINO}</span>` +
      `<span class="aw-sc-prop aw-sc-prop-dice">${PROP_DICE}</span>`;
    scene.append(propsLayer);

    const table = el("div", "aw-sc-table");
    const deckWrap = el("div", "aw-sc-deckwrap");
    const deck = el("button", "aw-sc-deck");
    deck.type = "button";
    deck.setAttribute("aria-label", "Deal a card");
    deck.innerHTML =
      `<span class="aw-sc-deckcard aw-sc-deckcard-3"></span>` +
      `<span class="aw-sc-deckcard aw-sc-deckcard-2"></span>` +
      `<span class="aw-sc-deckcard aw-sc-deckcard-1">${CARD_BACK_SVG}</span>`;
    const deckCount = el("span", "aw-sc-deckcount", "");
    deckWrap.append(deck, deckCount);

    const places = el("div", "aw-sc-places");
    places.style.setProperty("--cols", COLS_FOR[dealPlaces] || 3);
    for (let i = 0; i < dealPlaces; i++) {
      const place = el("div", "aw-sc-place");
      place.dataset.slot = String(i);
      places.append(place);
    }

    table.append(deckWrap, places);
    scene.append(table);

    // ----- controls (Shuffle · Undo · Deal), like Wordwall's in-scene bar -----
    const controls = el("div", "aw-sc-controls");
    const shuffleBtn = ctrlBtn("Shuffle");
    const undoBtn = ctrlBtn("Undo");
    const dealBtn = ctrlBtn("Deal", "aw-sc-ctrl-primary");
    controls.append(shuffleBtn, undoBtn, dealBtn);
    scene.append(controls);

    const banner = el("div", "aw-sc-banner");    // "Time's up" overlay (hidden until needed)
    banner.style.display = "none";
    scene.append(banner);

    root.append(scene);

    // ----- wire up -----
    deck.onclick = () => deal();
    dealBtn.onclick = () => deal();
    shuffleBtn.onclick = () => doShuffle();
    undoBtn.onclick = () => undo();
    ui.onSubmit(endRound);                        // countdown hitting 0 (or menu "Submit") ends the round
    window.addEventListener("keydown", onKey);

    scSound.intro();
    renderStatic();
    updateControls();

    // ---------- actions ----------
    function deal() {
      if (busy || roundOver) return;
      if (pile.length === 0) { ui.toast("Deck's empty — press Shuffle."); return; }
      busy = true;
      const slot = rr;
      const prev = slots[slot];
      const card = pile.shift();
      if (prev != null) discard.push(prev);
      slots[slot] = card;
      history.push({ slot, prev, card });
      rr = (rr + 1) % dealPlaces;
      animateDeal(slot, card, () => { busy = false; updateControls(); });
      updateControls();
    }

    function undo() {
      if (busy || roundOver || history.length === 0) return;
      const { slot, prev, card } = history.pop();
      pile.unshift(card);
      if (prev != null) { discard.pop(); slots[slot] = prev; }
      else slots[slot] = null;
      rr = slot;
      scSound.menuSubtle();
      renderStatic();
      updateControls();
    }

    function doShuffle() {
      if (busy) return;
      pile = shuffle(pile.concat(discard));
      discard = [];
      history = [];
      scSound.shuffle();
      deck.classList.remove("is-shuffling");
      // reflow so the animation restarts even on consecutive shuffles
      void deck.offsetWidth;
      deck.classList.add("is-shuffling");
      updateControls();
    }

    function endRound() {
      if (roundOver) return;
      roundOver = true;
      scSound.timesUp();
      banner.textContent = "Time's up!";
      banner.style.display = "";
      banner.animate([{ opacity: 0, transform: "scale(.8)" }, { opacity: 1, transform: "scale(1)" }],
        { duration: 260, fill: "forwards" });
      updateControls();
    }

    function onKey(e) {
      if (e.key === "Enter" || e.key === " " || e.key === "d" || e.key === "D") { e.preventDefault(); deal(); }
      else if (e.key === "s" || e.key === "S") { e.preventDefault(); doShuffle(); }
      else if (e.key === "u" || e.key === "U" || e.key === "Backspace") { e.preventDefault(); undo(); }
    }

    // ---------- rendering ----------
    // Draw every deal place in its resting state (no fly animation). Used on
    // first mount, after Undo and after Shuffle.
    function renderStatic() {
      clearFitters();
      places.querySelectorAll(".aw-sc-place").forEach(place => {
        const slot = Number(place.dataset.slot);
        place.innerHTML = "";
        const idx = slots[slot];
        if (idx == null) { place.classList.remove("has-card"); return; }
        place.classList.add("has-card");
        const cardEl = buildFront(cards[idx]);
        place.append(cardEl);
        fitCard(place, cardEl);
      });
      updateDeckCount();
    }

    // Deal one card into a slot: a back-faced card flies from the deck to the
    // place, then flips to its front. Both steps are guarded so a hidden tab
    // can't strand the card mid-motion.
    function animateDeal(slot, idx, done) {
      const place = places.querySelector(`.aw-sc-place[data-slot="${slot}"]`);
      if (!place) { done(); return; }
      destroyFitter(place);
      place.innerHTML = "";
      place.classList.add("has-card");

      const cardEl = el("div", "aw-sc-card aw-sc-card-back");
      cardEl.innerHTML = CARD_BACK_SVG;
      place.append(cardEl);
      updateDeckCount();

      // measure deck -> place offset for the fly
      const from = deck.getBoundingClientRect();
      const to = place.getBoundingClientRect();
      const dx = (from.left + from.width / 2) - (to.left + to.width / 2);
      const dy = (from.top + from.height / 2) - (to.top + to.height / 2);

      scSound.tileAppear();
      let flew = false;
      const fly = cardEl.animate(
        [{ transform: `translate(${dx}px, ${dy}px) scale(.62)`, opacity: .85 },
         { transform: "translate(0, 0) scale(1)", opacity: 1 }],
        { duration: 340, easing: "cubic-bezier(.22,.9,.3,1)", fill: "forwards" });
      // Terminal step (per HUONG DAN CORE §animate): a hidden tab can strand an
      // animation "running", so the resting look must NOT depend on its forwards
      // fill — cancel it and clear the inline transform so the card rests at its
      // base position no matter what.
      const doFlip = () => {
        if (flew) return; flew = true;
        try { fly.cancel(); } catch { /* ignore */ }
        cardEl.style.transform = "";
        flip(place, cardEl, idx, done);
      };
      fly.onfinish = doFlip;
      setTimeout(doFlip, 400);
    }

    // Flip a back-faced card to its front by squashing on X, swapping the face
    // at the midpoint, then un-squashing. Each phase is guarded + falls back on
    // a setTimeout, and the final step cancels the flip animations so a hidden
    // tab can never leave the card stuck collapsed (scaleX 0).
    function flip(place, cardEl, idx, done) {
      scSound.tileFlip();
      const half1 = cardEl.animate([{ transform: "scaleX(1)" }, { transform: "scaleX(0)" }],
        { duration: 130, easing: "ease-in", fill: "forwards" });
      let swapped = false, half2 = null;
      const finishFlip = () => {
        if (swapped) return; swapped = true;
        const front = buildFront(cards[idx]);
        cardEl.className = "aw-sc-card";
        cardEl.innerHTML = front.innerHTML;
        fitCard(place, cardEl);
        half2 = cardEl.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }],
          { duration: 130, easing: "ease-out", fill: "forwards" });
        let ended = false;
        const end = () => {
          if (ended) return; ended = true;
          try { half1.cancel(); } catch { /* ignore */ }
          try { half2.cancel(); } catch { /* ignore */ }
          cardEl.style.transform = "";
          done();
        };
        half2.onfinish = end;
        setTimeout(end, 200);
      };
      half1.onfinish = finishFlip;
      setTimeout(finishFlip, 190);
    }

    // Build the white FRONT of a card: optional image on top, prompt text below.
    function buildFront(card) {
      const cardEl = el("div", "aw-sc-card");
      cardEl.innerHTML = CARD_FRONT_ORN;
      const body = el("div", "aw-sc-cardbody");
      if (card.image) {
        const img = el("div", "aw-sc-cardimg");
        img.style.backgroundImage = `url("${cssUrl(card.image)}")`;
        body.append(img);
        body.classList.add("has-img");
      }
      const txtWrap = el("div", "aw-sc-cardtextwrap");
      const txt = el("div", "aw-sc-cardtext", escapeHtml(card.text || ""));
      txtWrap.append(txt);
      body.append(txtWrap);
      cardEl.append(body);
      return cardEl;
    }

    // One autoFit controller per PLACE (stored on the place node) so replacing a
    // card destroys its predecessor's resize listener instead of leaking it.
    function fitCard(place, cardEl) {
      destroyFitter(place);
      const wrap = cardEl.querySelector(".aw-sc-cardtextwrap");
      const txt = cardEl.querySelector(".aw-sc-cardtext");
      if (!wrap || !txt) return;
      place._fitter = autoFit(wrap, txt, s => txt.style.setProperty("--fit", s), { min: .4, max: 1, slack: 4 });
    }
    function destroyFitter(place) { if (place._fitter) { try { place._fitter.destroy(); } catch { /* ignore */ } place._fitter = null; } }
    function clearFitters() { places.querySelectorAll(".aw-sc-place").forEach(destroyFitter); }

    function updateDeckCount() {
      deckCount.textContent = pile.length ? `${pile.length} left` : "empty";
      deck.classList.toggle("is-empty", pile.length === 0);
    }

    function updateControls() {
      dealBtn.disabled = roundOver || pile.length === 0;
      deck.disabled = roundOver || pile.length === 0;
      undoBtn.disabled = roundOver || history.length === 0 || busy;
      shuffleBtn.disabled = roundOver || busy || (pile.length + discard.length === 0);
    }

    function ctrlBtn(label, extra) {
      const b = el("button", "aw-sc-ctrl" + (extra ? " " + extra : ""), escapeHtml(label));
      b.type = "button";
      return b;
    }

    return function cleanup() {
      window.removeEventListener("keydown", onKey);
      clearFitters();
      restoreChrome();
    };
  },

  // ---- Options panel: prune the Quiz-only controls, add Number of deal places ----
  buildExtraOptions({ panel, draft, el: makeEl }) {
    try {
      panel.querySelectorAll(".aw-opt-group").forEach(g => {
        const label = g.querySelector(".aw-opt-label")?.textContent?.trim();
        if (label === "End of game") { g.remove(); return; }   // "Show answers" — no answers here
        if (label === "Random") {
          g.querySelectorAll(".aw-opt-choice").forEach(ch => {
            const t = ch.textContent.trim().toLowerCase();
            if (t.includes("answer")) ch.remove();               // drop "Shuffle answer order"
            else if (t.includes("question")) {                   // rename to "Shuffle item order"
              ch.childNodes.forEach(n => { if (n.nodeType === 3 && /question/i.test(n.textContent)) n.textContent = "Shuffle item order"; });
            }
          });
        }
      });
    } catch { /* pruning is cosmetic — never let it break the panel */ }

    const g = makeEl("div", "aw-opt-group");
    g.append(makeEl("div", "aw-opt-label", "Number of deal places"));
    const row = makeEl("div", "aw-opt-row aw-sc-opt-deal");
    const stepper = makeNumberStepper(Math.max(1, Math.min(10, Number(draft.dealPlaces) || 1)), 1, 10,
      v => { draft.dealPlaces = v; });
    row.append(stepper.el);
    g.append(row);
    panel.append(g);
  },

  // Changing how many cards are on the table (or the timer) has to rebuild the
  // current play to take effect.
  optionsNeedRestart(before, after) {
    return (before.dealPlaces || 1) !== (after.dealPlaces || 1);
  },

  // Print: each card is a prompt to speak about (no answer column).
  toPrintItems(activity) {
    return (activity.content?.cards || [])
      .map(c => ({ clue: String(c.text || "").trim(), answer: "", options: undefined }))
      .filter(it => it.clue !== "");
  },

  // Wire the shared editor.
  edit(root, activity, hooks) {
    return import("./speaking-cards-editor.js").then(m => m.openSpeakingCardsEditor(root, activity, hooks));
  }
};

// The engine builds a score chip + prev/next nav that are meaningless for an
// open-ended game. Hide them while this template is mounted; restore on cleanup
// (harmless either way, since leaving the game rebuilds the whole stage).
function hideScoreAndNav(root) {
  const stage = root.closest(".aw-stage");
  const score = stage?.querySelector(".aw-top-score");
  const nav = stage?.querySelector(".aw-nav");
  const prevScore = score?.style.visibility;
  const prevNav = nav?.style.visibility;
  if (score) score.style.visibility = "hidden";
  if (nav) nav.style.visibility = "hidden";
  return function restore() {
    if (score) score.style.visibility = prevScore || "";
    if (nav) nav.style.visibility = prevNav || "";
  };
}

// Escape a URL for safe use inside a CSS url("...") — kill quotes/parens/newlines.
function cssUrl(u) { return String(u).replace(/["'()\\\n\r]/g, ""); }

// Escape user text before it goes into innerHTML (el()'s 3rd arg is innerHTML).
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

registerTemplate(speakingCardsTemplate);
