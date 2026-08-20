// =============================================================
// TEMPLATE: SPEAKING CARDS — Wordwall style, English UI. BOARD GAMES look
// (the "Board Games" visual style on Wordwall) is baked in as the AWord
// "Classic" look for this game (teacher's call, 1/8/2026).
//
// HOW IT PLAYS (captured from the real Wordwall act 116796629):
//   A face-down DECK of ornate playing cards sits over a blue board-game table.
//   Press the deck (or the Deal button) -> the top card flies onto a deal place
//   and FLIPS open to reveal a speaking prompt for a student to talk about.
//   Shuffle re-shuffles the deck, Undo takes back the last deal. "Number of
//   deal places" (1..10) lays out several cards at once. It is OPEN-ENDED: no
//   right/wrong, no score, no leaderboard. An optional countdown can be set;
//   when it hits 0 the round simply ends ("Time's up").
//
// INTRO (added by teacher request, 2/8/2026): pressing PLAY starts a little
// cinematic — the "camera" opens on a board-games table (chess + go, drawn in
// SVG) then PANS right to reveal the deck + deal area. The pan lasts exactly as
// long as the intro sound; only when it ends can cards be dealt. See runIntro().
//
// Cards are LANDSCAPE (7:5) with an ornate gold Board-Games face (teacher
// request 2/8/2026, matching the real act). The deck + deal area are centred so
// the table isn't left-heavy.
//
// This template is `scorable: false` — it never calls ui.finish(), so the
// engine's Game-complete / summary / leaderboard flow is never triggered. It
// also hides the engine chrome that is meaningless here (score chip, prev/next
// nav, the whole bottom bar) and puts its OWN Menu / Sound / Fullscreen buttons
// in the scene's bottom corners (matching the real act) — these just FORWARD to
// the engine's real (hidden) buttons, so the engine stays the single source of
// truth and core is never edited. See hideEngineChrome + buildSceneBar.
//
// All art is self-contained inline SVG (no external images), same as
// balloon-pop.js. element.animate() calls that must settle (the deal fly, the
// flip, the intro pan) carry a setTimeout fallback + done-guard per HUONG DAN
// CORE / CONG THUC MAU §3.4.
// =============================================================

import { registerTemplate } from "../../core/registry.js";
import { shuffle, el } from "../../core/utils.js";
import { press } from "../../core/press.js";
import { icons } from "../../core/icons.js";
import { sound as coreSound } from "../../core/sound.js";
import { createVoicePlayer, voiceView } from "../../core/voice-playback.js";
import { scSound, soundDurationMs, stopSound } from "./speaking-cards-sound.js";

// How many deal places fit per row for a given count (kept tidy by hand).
const COLS_FOR = { 1:1, 2:2, 3:3, 4:2, 5:3, 6:3, 7:4, 8:4, 9:3, 10:5 };

// Work out the deck + card sizes (in cqw = % of the 16:9 stage width) so the
// table uses the maximum space for the given deal-place count. Numbers are the
// CSS vars --deck-w / --card-w / --cols (see the .aw-sc-deck / .aw-sc-places CSS).
//   • 1 place  -> deck and card the SAME (large) size, side by side.
//   • >1 place -> a compact deck + a grid of cards sized to fill what's left,
//     capped by BOTH the remaining width and the table height (so rows never
//     overflow). Teacher's spec 2/8/2026.
function computeLayout(n) {
  const cols = COLS_FOR[n] || 3;
  const rows = Math.ceil(n / cols);
  const gap = 2, tableGap = 4, padX = 4;
  const tableW = 100 - padX * 2;      // ~92cqw usable width
  const tableH = 40;                  // ~cqw available height for the table row
  let deckW = n === 1 ? 42 : 16;
  const placesW = tableW - deckW - tableGap;
  const byW = (placesW - (cols - 1) * gap) / cols;
  const byH = ((tableH - (rows - 1) * gap) / rows) * (7 / 5);
  let cardW = Math.min(byW, byH);
  if (n === 1) { cardW = Math.min(cardW, 42); deckW = cardW; }   // deck == card
  cardW = Math.max(7, cardW);
  return { cols, deckW: Math.round(deckW * 10) / 10, cardW: Math.round(cardW * 10) / 10 };
}

// ---------- inline art: the ornate LANDSCAPE cards (self-contained) ----------
// A small "fleuron" corner ornament — a plus made of 5 dots, echoing the
// Board Games deck on Wordwall.
function fleuron(cx, cy, fill = "#b9791a", arm = 9) {
  return `<g fill="${fill}">` +
    `<circle cx="${cx}" cy="${cy}" r="3.4"/>` +
    `<circle cx="${cx-arm}" cy="${cy}" r="2.4"/><circle cx="${cx+arm}" cy="${cy}" r="2.4"/>` +
    `<circle cx="${cx}" cy="${cy-arm}" r="2.4"/><circle cx="${cx}" cy="${cy+arm}" r="2.4"/>` +
    `</g>`;
}

// The ornate gold BACK of a card (fills the white card body), 7:5 landscape.
const CARD_BACK_SVG = `<svg class="aw-sc-cardart" viewBox="0 0 280 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" preserveAspectRatio="none">
  <rect x="8" y="8" width="264" height="184" rx="16" fill="#e9b949"/>
  <rect x="16" y="16" width="248" height="168" rx="12" fill="#d79a2b"/>
  <rect x="26" y="26" width="228" height="148" rx="9" fill="none" stroke="#b9791a" stroke-width="3" stroke-dasharray="4 5"/>
  <path d="M140 52 L214 100 L140 148 L66 100 Z" fill="#f3d789"/>
  <circle cx="140" cy="100" r="24" fill="#e9b949" stroke="#b9791a" stroke-width="3"/>
  ${fleuron(38, 38)}${fleuron(242, 38)}${fleuron(38, 162)}${fleuron(242, 162)}
</svg>`;

// The white FRONT of a card: a soft gold cartouche frame + four corner
// fleurons; the prompt bubble sits inside them.
const CARD_FRONT_ORN = `<svg class="aw-sc-frontorn" viewBox="0 0 280 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" preserveAspectRatio="none">
  <rect x="16" y="14" width="248" height="172" rx="16" fill="none" stroke="#e6c667" stroke-width="2.4"/>
  ${fleuron(32, 30, "#d9a83a", 8)}${fleuron(248, 30, "#d9a83a", 8)}${fleuron(32, 170, "#d9a83a", 8)}${fleuron(248, 170, "#d9a83a", 8)}
</svg>`;

// ---------- background: the REAL Wordwall "Board Games" table photo ----------
// The intro/background is the original act's own graphic (playingcards theme
// background.jpg, saved under ./assets/ — sourced from the act the teacher uses,
// see D:\APP AND DATA\AWord-data\Source\Graphic\SPEAKING CARDS). It is a WIDE
// panorama (~3.33:1): chess/scrabble/backgammon on the right, an empty felt with
// a gold corner frame on the left where the cards are dealt. The intro "camera"
// pans across it from the boards to the card felt; see runIntro().
const BG_URL = new URL("./assets/background.jpg", import.meta.url).href;
const BG_RATIO = 7386 / 2217;   // native px ratio of background.jpg (~3.332)

const speakingCardsTemplate = {
  type: "speaking_cards",
  scorable: false,
  // ⭐⭐ Đợt 213b (thầy, 20/8/2026) — THỨ TỰ Ô TÍCH, theo CỘT.
  // Thầy đọc từng cột: "cột 1 <trên>/<dưới>, cột 2 …". Khối đổ theo CỘT (đầy cột 1
  // từ trên xuống rồi mới sang cột 2 — xem `.aw-checks` trong core/app.css), nên
  // danh sách này đọc thẳng thành bố cục: 2 mã đầu = cột 1, 2 mã kế = cột 2, …
  // ⛔ Là MÃ ĐỊNH DANH, không phải chữ hiện ra (chữ có thể đổi — chính đợt này đã
  // đổi "Show answer when wrong" thành "Show corrects").
  // ⚠️ Mã không có trong danh sách (Fight "In turns", Showdown "Balance questions")
  // tự xuống cuối — hai mode đó thầy chưa xếp.
  checkOrder: ["shuffle"],
  name: "Speaking cards",
  // Đợt 122 — ảnh nền gán bằng JS (`bg.style.backgroundImage`), lại nằm trong
  // ./assets/ chứ không phải ./img/ nên engine quét CSS không thấy.
  preloadImages: [BG_URL],
  // Đợt 140 — the three things buildExtraOptions used to achieve by deleting
  // nodes out of the finished panel (see its comment below), declared instead:
  hideShowAnswers: true,     // open-ended game: there are no answers to show
  shuffleLabel: "Shuffle item order",   // it deals CARDS, not questions

  // Engine hooks it auto-calls: `play` on the PLAY button (the intro sound — the
  // camera pan is timed to it), restart on "Start again", a warning as the
  // countdown runs low.
  sounds: {
    play: scSound.intro,
    restart: scSound.restart,
    timeWarning: scSound.timesUp
  },

  mount(root, activity, ui) {
    const opt = activity.options || {};
    const cards = (activity.content?.cards || []).filter(c => c && String(c.text || "").trim() !== "");
    const dealPlaces = Math.max(1, Math.min(10, Number(opt.dealPlaces) || 1));

    // Hide the engine chrome that means nothing for an open-ended game (score
    // chip, prev/next nav, the whole bottom bar) — restored on cleanup.
    const restoreChrome = hideEngineChrome(root);

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
    // Pronunciation playback (10/8/2026) — optional per-card, carried
    // through Change Template from an Anagram source (core/convert.js).
    // `cards[idx]` IS the raw content object (line 125 only filters), so
    // `.voice`/`.hideText` read straight off it. See buildFront()/
    // finishFlip() for where the button/auto-play actually hook in.
    const voicePlayer = createVoicePlayer();
    let panning = true;                        // true during the intro camera pan (no dealing yet)
    let shuffleTimer = null;
    let dead = false;   // "this mount was thrown away" — set ONLY by cleanup() (Đợt 114)

    // ----- scene = a camera viewport over the real board-games table photo -----
    // `bg` is the wide background image the "camera" pans across; `play` is the
    // deck/cards/controls overlay that fades in once the pan settles.
    root.innerHTML = "";
    const scene = el("div", "aw-sc-scene");
    const bg = el("div", "aw-sc-bg");
    bg.style.backgroundImage = `url("${BG_URL}")`;
    scene.append(bg);

    const play = el("div", "aw-sc-play");   // holds the table + controls (fades in after the pan)

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

    // Size the deck + cards to fill the space for this deal-place count.
    const layout = computeLayout(dealPlaces);
    table.style.setProperty("--cols", layout.cols);
    table.style.setProperty("--card-w", layout.cardW);
    table.style.setProperty("--deck-w", layout.deckW);

    const places = el("div", "aw-sc-places");
    for (let i = 0; i < dealPlaces; i++) {
      const place = el("div", "aw-sc-place");
      place.dataset.slot = String(i);
      places.append(place);
    }

    table.append(deckWrap, places);
    play.append(table);

    // ----- controls (Shuffle · Undo · Deal), like Wordwall's in-scene bar -----
    const controls = el("div", "aw-sc-controls");
    const shuffleBtn = ctrlBtn("Shuffle");
    const undoBtn = ctrlBtn("Undo");
    const dealBtn = ctrlBtn("Deal", "aw-sc-ctrl-primary");
    controls.append(shuffleBtn, undoBtn, dealBtn);
    play.append(controls);

    scene.append(play);

    // ----- our own Menu / Sound / Fullscreen buttons in the scene corners -----
    const sceneBar = buildSceneBar(root);
    scene.append(sceneBar.el);

    const banner = el("div", "aw-sc-banner");    // "Time's up" overlay (hidden until needed)
    banner.style.display = "none";
    scene.append(banner);

    // Slogan (same look as Crossword): small, thin, spaced grey caps — pinned
    // top-centre over the scene (the engine top bar is covered by the photo here).
    // Hidden at first; it fades in over the LAST 30% of the intro pan (see runIntro).
    const slogan = el("div", "aw-sc-slogan", "SPEAKING CARDS IN ANDREW CLASSES");
    slogan.style.opacity = "0";
    scene.append(slogan);

    root.append(scene);

    // ----- wire up -----
    press(deck, () => deal());          // instant on touch-down — core/press.js
    press(dealBtn, () => deal());
    press(shuffleBtn, () => doShuffle());
    press(undoBtn, () => undo());
    ui.onSubmit(endRound);                        // countdown hitting 0 (or menu "Submit") ends the round
    window.addEventListener("keydown", onKey);

    renderStatic();
    updateControls();
    const stopIntro = runIntro();                 // pan the camera; unlocks dealing when done

    // ---------- the intro camera pan ----------
    // The "camera" opens on the boards (right of the photo) and glides across the
    // table to the card felt (left, where the deck sits), over exactly the intro
    // sound's length; then the deck/controls fade in and dealing unlocks. Guarded
    // so a hidden tab can't strand the pan (the bg just rests on the play felt).
    function runIntro() {
      const sceneW = scene.clientWidth || 1;
      const bgW = bg.clientWidth || sceneW;      // width comes from CSS aspect-ratio
      const startX = Math.min(0, -(bgW - sceneW));  // shift left to show the RIGHT (boards)
      bg.style.transform = `translateX(${startX}px)`;

      const ms = Math.max(1200, soundDurationMs("intro-01", 2600) - 150);
      let done = false;
      const finish = () => {
        if (done) return; done = true;
        try { anim?.cancel(); } catch { /* ignore */ }
        try { sloganAnim?.cancel(); } catch { /* ignore */ }
        bg.style.transform = "translateX(0px)";   // rest on the LEFT card felt
        slogan.style.opacity = "1";               // slogan ends fully visible
        play.classList.add("is-in");              // fade the deck + controls in
        panning = false;
        updateControls();
      };
      const anim = bg.animate(
        [{ transform: `translateX(${startX}px)` }, { transform: "translateX(0px)" }],
        { duration: ms, easing: "cubic-bezier(.5,.02,.35,1)", fill: "forwards" });
      // Slogan stays hidden for the first 70% of the pan, then fades in over the
      // last 30% (offset .7 → 1) so it appears only as the card felt settles.
      const sloganAnim = slogan.animate(
        [{ opacity: 0, offset: 0 }, { opacity: 0, offset: 0.7 }, { opacity: 1, offset: 1 }],
        { duration: ms, easing: "linear", fill: "forwards" });
      anim.onfinish = finish;
      const t = setTimeout(finish, ms + 120);
      return () => { clearTimeout(t); finish(); };
    }

    // ---------- actions ----------
    function deal() {
      if (busy || roundOver || panning) return;
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
      if (busy || roundOver || panning || history.length === 0) return;
      const { slot, prev, card } = history.pop();
      pile.unshift(card);
      if (prev != null) { discard.pop(); slots[slot] = prev; }
      else slots[slot] = null;
      rr = slot;
      scSound.menuSubtle();
      renderStatic();
      updateControls();
    }

    // Shuffle: gather the discard back in, reshuffle, and riffle the deck for as
    // long as the shuffle SOUND lasts (teacher request — the sound is long, so a
    // fixed 0.5s riffle looked wrong). Dealing is locked while it riffles.
    function doShuffle() {
      if (busy || panning) return;
      if (pile.length + discard.length === 0) return;
      pile = shuffle(pile.concat(discard));
      discard = [];
      history = [];
      scSound.shuffle();
      // Keep only HALF the time for the shuffle (sound + riffle) — the full clip
      // felt too long (teacher, 2/8/2026). Cut the audio at the midpoint too.
      const ms = Math.max(400, Math.round(soundDurationMs("shuffle-01", 1600) / 2));
      const iter = Math.max(1, Math.round(ms / 520));
      deck.style.setProperty("--sc-shuffle-iter", iter);
      deck.classList.remove("is-shuffling");
      void deck.offsetWidth;                       // reflow so it restarts on consecutive shuffles
      deck.classList.add("is-shuffling");
      busy = true;
      updateDeckCount();
      updateControls();
      clearTimeout(shuffleTimer);
      shuffleTimer = setTimeout(() => {
        deck.classList.remove("is-shuffling");
        stopSound("shuffle-01");                    // cut the long clip at its halfway point
        busy = false;
        updateControls();
      }, ms);
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
      if (panning) return;
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
      // Đợt 114 — reached from animateDeal's untracked 400ms fallback. On a
      // thrown-away play this used to play the flip cue and the card's voice clip
      // over the next game, and its fitCard() call registered a window resize
      // listener that clearFitters() (already run) could never destroy.
      if (dead) return;
      scSound.tileFlip();
      const half1 = cardEl.animate([{ transform: "scaleX(1)" }, { transform: "scaleX(0)" }],
        { duration: 130, easing: "ease-in", fill: "forwards" });
      let swapped = false, half2 = null;
      const finishFlip = () => {
        if (swapped) return; swapped = true;
        const front = buildFront(cards[idx]);
        cardEl.className = "aw-sc-card";
        // MOVE front's children in (not `innerHTML = front.innerHTML`, a
        // string round-trip that would silently drop the listen button's
        // onclick — replaceChildren() relocates the actual node objects,
        // listeners intact, since `front` itself was never inserted anywhere).
        cardEl.replaceChildren(...front.childNodes);
        fitCard(place, cardEl);
        // Freshly DEALT card only (not a resting one from renderStatic, e.g.
        // after Undo/Shuffle/initial mount) auto-plays its pronunciation —
        // avoids several cards' clips firing/overlapping when more than one
        // deal place is already occupied at once.
        const card = cards[idx];
        if (voiceView(activity, card).autoPlay) voicePlayer.play(card.voice, cardEl.querySelector(".aw-sc-listenbtn"));
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

    // Build the white FRONT of a card: the prompt text, centred. A phonetic entry
    // ("TROUSER /ˈtraʊzə/") is split so the WORD sits on its own line and the
    // /transcription/ sits under it (smaller, muted). See splitPhonetic.
    function buildFront(card) {
      const cardEl = el("div", "aw-sc-card");
      cardEl.innerHTML = CARD_FRONT_ORN;
      const body = el("div", "aw-sc-cardbody");
      const txtWrap = el("div", "aw-sc-cardtextwrap");
      const txt = el("div", "aw-sc-cardtext");
      const vv = voiceView(activity, card);   // Options > Content decides text/voice
      const hasVoice = vv.hasVoice;
      // Hide text (10/8/2026) is only offered with exactly ONE deal place —
      // with several cards dealt at once there's no room for a giant
      // centered button per card, and the prompt reads better always-shown
      // in that layout (teacher's scope call for this template). A small
      // listen icon is still offered on every card, any deal-place count.
      const hideText = vv.hideText && dealPlaces === 1;
      if (hideText) {
        txtWrap.classList.add("aw-clue-voiceonly");
      } else {
        const ph = splitPhonetic(card.text);
        if (ph) {
          txt.innerHTML =
            `<span class="aw-sc-word">${escapeHtml(ph.word)}</span>` +
            `<span class="aw-sc-cardipa">${escapeHtml(ph.ipa)}</span>`;
        } else {
          txt.textContent = card.text || "";   // textContent → wraps at spaces, never mid-word
        }
      }
      txtWrap.append(txt);
      body.append(txtWrap);
      cardEl.append(body);
      if (hasVoice) {
        // Small variant sits OUTSIDE txtWrap (absolute corner on .aw-sc-card,
        // which is already position:absolute — a containing block for free)
        // so it never participates in fitCard()'s wrap/txt measurements. The
        // large hideText variant is txtWrap's own sole child instead, using
        // the same .aw-clue-voiceonly centering every other template uses.
        const vBtn = el("button", "aw-sc-listenbtn" + (hideText ? " is-lg" : ""), icons.soundOn);
        vBtn.type = "button";
        vBtn.setAttribute("aria-label", "Listen to pronunciation");
        press(vBtn, e => { e.stopPropagation(); voicePlayer.toggle(card.voice, vBtn); });
        (hideText ? txtWrap : cardEl).append(vBtn);
      }
      return cardEl;
    }

    // One fit controller per PLACE (stored on the place node) so replacing a card
    // destroys its predecessor's resize listener instead of leaking it.
    //
    // The text block is width:100% so a long prompt WRAPS to several lines. We
    // grow the font (binary search on --fit) until the wrapped block just fills
    // the card HEIGHT — as large as possible. A separate WIDTH guard only trips
    // when a single un-wrappable word pokes past the box (scrollWidth exceeds the
    // box), so long words shrink to stay whole but sentences still maximise. (We
    // can't use core fitOnce here: its width test subtracts slack, which a
    // width:100% element always fails, collapsing every card to the min size.)
    function fitCard(place, cardEl) {
      destroyFitter(place);
      const wrap = cardEl.querySelector(".aw-sc-cardtextwrap");
      const txt = cardEl.querySelector(".aw-sc-cardtext");
      if (!wrap || !txt) return;
      const apply = s => txt.style.setProperty("--fit", s);
      const over = () => (txt.scrollHeight > wrap.clientHeight - 2) || (txt.scrollWidth > wrap.clientWidth + 1);
      const run = () => {
        const min = .25, max = 5;
        apply(max);
        if (!over()) return;                 // even the biggest fits — keep it
        let lo = min, hi = max, best = min;
        for (let i = 0; i < 18; i++) {
          const mid = (lo + hi) / 2;
          apply(mid);
          if (over()) hi = mid; else { best = mid; lo = mid; }
        }
        apply(best);
      };
      run();
      if (document.fonts?.ready) document.fonts.ready.then(run).catch(() => {});
      let raf = 0;
      const onResize = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(run); };
      window.addEventListener("resize", onResize);
      place._fitter = { destroy() { window.removeEventListener("resize", onResize); cancelAnimationFrame(raf); } };
    }
    function destroyFitter(place) { if (place._fitter) { try { place._fitter.destroy(); } catch { /* ignore */ } place._fitter = null; } }
    function clearFitters() { places.querySelectorAll(".aw-sc-place").forEach(destroyFitter); }

    function updateDeckCount() {
      deckCount.textContent = pile.length ? `${pile.length} left` : "empty";
      deck.classList.toggle("is-empty", pile.length === 0);
    }

    function updateControls() {
      const lock = roundOver || panning;
      dealBtn.disabled = lock || busy || pile.length === 0;
      deck.disabled = lock || busy || pile.length === 0;
      undoBtn.disabled = lock || busy || history.length === 0;
      shuffleBtn.disabled = lock || busy || (pile.length + discard.length === 0);
    }

    function ctrlBtn(label, extra) {
      const b = el("button", "aw-sc-ctrl" + (extra ? " " + extra : ""), escapeHtml(label));
      b.type = "button";
      return b;
    }

    return function cleanup() {
      dead = true;   // Đợt 114 — MUST be first; see flip()
      window.removeEventListener("keydown", onKey);
      clearTimeout(shuffleTimer);
      stopIntro();
      voicePlayer.stop();
      sceneBar.destroy();
      clearFitters();
      restoreChrome();
    };
  },

  // ---- Options panel: prune the Quiz-only controls, add Number of deal places ----
  // Đợt 140 — shared panel builders.
  // ⚠️ The `prune()` block that used to open this function is GONE. It reached
  // into the built panel to delete the "End of game" group and the "Shuffle
  // answer order" choice, and to rewrite a text node — twice, because the
  // engine appends "End of game" AFTER this hook runs, so it also had to fire
  // again inside a requestAnimationFrame. All three intents are declared now
  // (hideShowAnswers · shuffleLabel in the header above, and since Đợt 143
  // "Shuffle answers" is opt-in, so simply not declaring it is enough): the
  // panel never builds what this game doesn't want.
  buildExtraOptions({ panel, draft, mkSliderCell }) {
    // Number of deal places — a real 1..10 slider (matches True/false's controls).
    panel.append(mkSliderCell({
      label: "Deal places", min: 1, max: 10, step: 1,
      value: Math.max(1, Math.min(10, Number(draft.dealPlaces) || 1)), tone: "blue",
      onInput: v => { draft.dealPlaces = v; }
    }).cell);
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

// A phonetic entry is a word (or short phrase) followed by an IPA transcription
// wrapped in slashes, e.g. "TROUSER /ˈtraʊzə/". Only matched when the /.../ is at
// the very end and the word part is short — a normal sentence is left untouched.
function splitPhonetic(text) {
  const s = String(text || "").trim();
  const m = s.match(/^([\s\S]*\S)\s*(\/[^/]+\/)\s*$/);
  if (m && m[1].trim() && m[1].trim().length <= 40) return { word: m[1].trim(), ipa: m[2].trim() };
  return null;
}

// The engine builds a score chip, prev/next nav and a bottom bar that are
// meaningless for an open-ended game. Hide them while this template is mounted;
// restore on cleanup (harmless either way, since leaving the game rebuilds the
// whole stage). We DON'T remove them — the scene's own corner buttons forward
// clicks to the real (hidden) Menu / Sound / Fullscreen buttons.
function hideEngineChrome(root) {
  const stage = root.closest(".aw-stage");
  const targets = [
    stage?.querySelector(".aw-top-score"),
    stage?.querySelector(".aw-nav"),
    stage?.querySelector(".aw-bottombar")
  ].filter(Boolean);
  const prev = targets.map(t => t.style.visibility);
  targets.forEach(t => { t.style.visibility = "hidden"; });
  return function restore() { targets.forEach((t, i) => { t.style.visibility = prev[i] || ""; }); };
}

// Build the in-scene bottom bar (Menu left · Sound + Fullscreen right), matching
// the real act. Each button FORWARDS to the engine's hidden button, so all the
// real logic (menu popup, mute state, fullscreen) stays in core — untouched.
function buildSceneBar(root) {
  const stage = root.closest(".aw-stage");
  const engMenu  = stage?.querySelector(".aw-bottombar-left .aw-iconbtn");
  const engSound = stage?.querySelector(".aw-tools .aw-iconbtn:not(.aw-fs-always)");
  const engFs    = stage?.querySelector(".aw-tools .aw-fs-always");

  const bar = el("div", "aw-sc-bar");
  const menuBtn = sbBtn(icons.menu, "Menu");
  const soundBtn = sbBtn(coreSound.isMuted() ? icons.soundOff : icons.soundOn, "Sound");
  soundBtn.classList.toggle("is-off", coreSound.isMuted());
  const fsBtn = sbBtn(icons.fullscreen, "Fullscreen");

  const left = el("div", "aw-sc-bar-left");
  const right = el("div", "aw-sc-bar-right");
  left.append(menuBtn);
  right.append(soundBtn, fsBtn);
  bar.append(left, right);

  menuBtn.onclick = () => { scSound.menu(); engMenu?.click(); };
  fsBtn.onclick = () => engFs?.click();
  soundBtn.onclick = () => {
    engSound?.click();                                  // let the engine flip + persist the mute state
    const m = coreSound.isMuted();
    soundBtn.innerHTML = m ? icons.soundOff : icons.soundOn;
    soundBtn.classList.toggle("is-off", m);
  };

  function sbBtn(svg, title) {
    const b = el("button", "aw-sc-barbtn", svg);
    b.type = "button"; b.title = title; b.setAttribute("aria-label", title);
    return b;
  }
  return { el: bar, destroy() { /* buttons live inside the scene, removed with it */ } };
}

// Escape user text before it goes into innerHTML (el()'s 3rd arg is innerHTML).
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

registerTemplate(speakingCardsTemplate);
