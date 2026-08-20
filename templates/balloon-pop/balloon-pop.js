// =============================================================
// TEMPLATE: BALLOON POP — Wordwall style, English UI. Wild West look
// (theme id `western2` on Wordwall) is baked in as the AWord "Classic"
// look for this game (teacher's call, 1/8/2026).
//
// HOW IT PLAYS (captured from the real Wordwall act 116864480):
//   A steam TRAIN car at the bottom shows one DEFINITION. Silver BLIMPS
//   drift across the desert sky, each carrying a KEYWORD. Tap the blimp
//   whose keyword matches the definition -> the keyword drops as a wooden
//   CARGO crate onto the train (correct -> car loaded, train chugs on to the
//   next definition; wrong -> crate breaks). Score = keywords matched.
//   A countdown runs the whole round; matching every level before it hits 0
//   wins ("Game complete"), otherwise the clock ending is "Time's up".
//   Options: Timer / Speed (blimp drift) / Levels / Bonuses / Show answers.
//
// Real-time model: ONE requestAnimationFrame loop drives blimp drift, the
// countdown and cargo physics off a clamped delta (so a backgrounded tab
// simply PAUSES everything instead of ending the round while hidden — the
// clock is decremented in the same loop, never on a wall-clock timer).
// element.animate() calls that must settle (the crate fall) carry a
// setTimeout fallback + done-guard per CONG THUC MAU §3.4 / HUONG DAN CORE.
// =============================================================

import { registerTemplate } from "../../core/registry.js";
import { shuffle, el } from "../../core/utils.js";
import { press } from "../../core/press.js";
import { icons } from "../../core/icons.js";
import { makeHStepper } from "../../core/numberstepper.js";
import { autoFit } from "../../core/fit.js";
import { createVoicePlayer, voiceView, DEFAULT_INTRO_DELAY_MS } from "../../core/voice-playback.js";
import { bpSound } from "./balloon-pop-sound.js";
import { openBalloonPopEditor } from "./balloon-pop-editor.js";

const MAX_BLIMPS = 4;            // how many balloons drift at once
const LANES = [10, 22, 34];     // vertical bands (% of scene height) blimps drift along
const BASE_CROSS_MS = 15000;    // time for a blimp to cross at speed 5 (higher speed = faster)
const SPAWN_GAP_MS = 900;       // min gap between new blimp spawns
const CRATE_FALL_MS = 620;      // keyword crate fall to the train
const WARNING_SECONDS = 10;     // clock turns red + train "time" sound under this

// ---------- inline art (self-contained, no external images) ----------
// A silver Wild-West blimp/zeppelin. The keyword banner is a separate DOM
// layer on top so its text auto-fits independently.
const BLIMP_SVG = `<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="bpBlimpG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f4f6fb"/><stop offset=".45" stop-color="#c7ccd8"/>
      <stop offset="1" stop-color="#9aa1b2"/>
    </linearGradient>
  </defs>
  <ellipse cx="96" cy="52" rx="92" ry="46" fill="url(#bpBlimpG)" stroke="#7f8698" stroke-width="2"/>
  <path d="M20 52 H172" stroke="#aab0c0" stroke-width="2" opacity=".6"/>
  <path d="M176 40 l20 -12 v48 l-20 -12 z" fill="#b9c0cf" stroke="#7f8698" stroke-width="2"/>
  <rect x="70" y="92" width="52" height="16" rx="7" fill="#6b4a2f" stroke="#4a3220" stroke-width="2"/>
  <path d="M78 92 v-8 M114 92 v-8" stroke="#7f8698" stroke-width="2"/>
</svg>`;

// Golden bonus balloon (Extra time / Points / x2), icon set per bonus type.
function bonusBalloonSvg(mark) {
  return `<svg viewBox="0 0 120 150" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs><radialGradient id="bpGold" cx=".4" cy=".35" r=".8">
      <stop offset="0" stop-color="#ffe9a8"/><stop offset="1" stop-color="#e6a92e"/></radialGradient></defs>
    <ellipse cx="60" cy="58" rx="46" ry="54" fill="url(#bpGold)" stroke="#c9962a" stroke-width="3"/>
    <ellipse cx="44" cy="40" rx="12" ry="16" fill="#fff1c0" opacity=".7"/>
    <path d="M54 110 l6 10 l6 -10 z" fill="#c9962a"/>
    <text x="60" y="76" font-size="40" font-weight="800" text-anchor="middle" fill="#8a5a10" font-family="'Baloo 2',sans-serif">${mark}</text>
  </svg>`;
}

// The red steam engine (drawn to the RIGHT of the definition car).
const ENGINE_SVG = `<svg viewBox="0 0 260 170" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs><linearGradient id="bpEngG" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#c94c3c"/><stop offset="1" stop-color="#8f2f24"/></linearGradient></defs>
  <rect x="8" y="126" width="244" height="16" rx="4" fill="#5a3d24"/>
  <rect x="70" y="52" width="150" height="74" rx="8" fill="url(#bpEngG)" stroke="#6e241b" stroke-width="3"/>
  <rect x="24" y="66" width="52" height="60" rx="8" fill="url(#bpEngG)" stroke="#6e241b" stroke-width="3"/>
  <rect x="30" y="72" width="40" height="26" rx="4" fill="#f2d38a" stroke="#6e241b" stroke-width="2"/>
  <circle cx="196" cy="90" r="30" fill="#3a2a1e" stroke="#d9a441" stroke-width="4"/>
  <circle cx="196" cy="90" r="11" fill="#d9a441"/>
  <rect x="150" y="34" width="20" height="26" rx="3" fill="#3a2a1e"/>
  <rect x="188" y="26" width="26" height="34" rx="4" fill="#3a2a1e"/>
  <ellipse cx="201" cy="24" rx="20" ry="8" fill="#3a2a1e"/>
  <circle cx="96" cy="140" r="20" fill="#2c2018" stroke="#d9a441" stroke-width="3"/>
  <circle cx="150" cy="140" r="20" fill="#2c2018" stroke="#d9a441" stroke-width="3"/>
  <circle cx="210" cy="140" r="14" fill="#2c2018" stroke="#d9a441" stroke-width="3"/>
</svg>`;

const balloonPopTemplate = {
  type: "balloon_pop",
  scorable: true,
  // TIME COST (Dot 143) - opt in to the shared "-N per idle second" option.
  timeCost: true,
  // "Start with mistakes" (Đợt 84): which array in activity.content holds the
  // playable items. Core filters THAT array by the `src` refs the review rows
  // carry, so a replay keeps the originals untouched. See core/mistakes.js.
  itemsKey: "items",
  // ⭐ Đợt 178 — SHOWDOWN, and this one line is genuinely all of it: the level IS
  // the item (`loadLevel(i)` is the only mover), `updateProgress()` already
  // reports it as `setNav({index: levelIndex + 1})`, and `review` is built as
  // `levelItems.map((it, i) => …)` on that very index — so the name over the
  // frame and the row in Show answers cannot come apart.
  showdownMode: true,
  // ⭐⭐ Đợt 213b (thầy, 20/8/2026) — THỨ TỰ Ô TÍCH, theo CỘT.
  // Thầy đọc từng cột: "cột 1 <trên>/<dưới>, cột 2 …". Khối đổ theo CỘT (đầy cột 1
  // từ trên xuống rồi mới sang cột 2 — xem `.aw-checks` trong core/app.css), nên
  // danh sách này đọc thẳng thành bố cục: 2 mã đầu = cột 1, 2 mã kế = cột 2, …
  // ⛔ Là MÃ ĐỊNH DANH, không phải chữ hiện ra (chữ có thể đổi — chính đợt này đã
  // đổi "Show answer when wrong" thành "Show corrects").
  // ⚠️ Mã không có trong danh sách (Fight "In turns", Showdown "Balance questions")
  // tự xuống cuối — hai mode đó thầy chưa xếp.
  checkOrder: ["shuffle", "showAnswers", "bpTime", "bpPoints", "bpX2"],
  name: "Balloon pop",
  inlineTimerBar: true,   // gives us ui.topbarMid for the countdown clock + level progress bar

  sounds: {
    play: bpSound.intro,
    restart: bpSound.restart
  },

  edit: openBalloonPopEditor,

  toPrintItems(activity) {
    return (activity.content?.items || [])
      .filter(it => it && it.keyword && it.definition)
      .map(it => ({ clue: it.definition, answer: it.keyword }));
  },

  // Đợt 140 — shared panel builders. Three ▲/▼ steppers (69px each) become
  // three one-line cells; the bonus checkboxes join the shared switch block.
  buildExtraOptions({ panel, draft, mkCell, mkSliderCell, addCheck }) {
    // Round time keeps a stepper: 15..300s is too fine a range for a slider.
    // Đợt 164 (teacher): every time-related field steps 1 second at a time —
    // step went 5s -> 1s (hold-to-repeat still ramps up for a fast change).
    const cTime = mkCell({ label: "Round time" });
    const stTime = makeHStepper(typeof draft.bpTimerSeconds === "number" ? draft.bpTimerSeconds : 60,
      15, 300, v => { draft.bpTimerSeconds = v; }, { step: 1, format: v => v + "s" });
    cTime.ctl.append(stTime.el);

    const cLevels = mkCell({ label: "Levels" });
    const stLevels = makeHStepper(typeof draft.bpLevels === "number" ? draft.bpLevels : 10,
      1, 100, v => { draft.bpLevels = v; }, { format: v => String(v) });
    cLevels.ctl.append(stLevels.el);

    panel.append(
      cTime.cell,
      mkSliderCell({
        label: "Balloon speed", min: 1, max: 10, step: 1,
        value: typeof draft.bpSpeed === "number" ? draft.bpSpeed : 5, tone: "blue",
        onInput: v => { draft.bpSpeed = v; }
      }).cell,
      cLevels.cell
    );

    addCheck("Bonus: extra time", draft.bpBonusTime === true, v => draft.bpBonusTime = v, { key: "bpTime" });
    addCheck("Bonus: points", draft.bpBonusPoints === true, v => draft.bpBonusPoints = v, { key: "bpPoints" });
    addCheck("Bonus: x2 score", draft.bpBonusX2 === true, v => draft.bpBonusX2 = v, { key: "bpX2" });
  },

  mount(root, activity, ui) {
    return mountBalloonPop(root, activity, ui);
  }
};

function mountBalloonPop(root, activity, ui) {
  const opt = activity.options || {};
  // Penalty: points removed on each wrong pop (0..100 since Dot 143; 0 = off).
  const pointsOff = Math.max(0, Math.min(100, Number(activity.options && activity.options.pointsOff) || 0));

  // ---- content ----
  let pool = [...(activity.content?.items || [])]
    .filter(it => it && it.keyword != null && it.definition != null
      && String(it.keyword).trim() && String(it.definition).trim())
    // `src` = the ORIGINAL content object, carried through so "Start with
    // mistakes" can filter activity.content.items by identity (core/mistakes.js).
    .map(it => ({ keyword: String(it.keyword).trim(), definition: String(it.definition).trim(), src: it }));

  if (pool.length === 0) {
    root.innerHTML = "";
    root.append(el("div", "aw-bp-empty", "This activity has no keywords yet."));
    return () => {};
  }

  // levels actually played = min(option, pool length). Each level is one definition.
  const askedLevels = typeof opt.bpLevels === "number" && opt.bpLevels > 0 ? opt.bpLevels : pool.length;
  const levelItems = (opt.shuffleQuestions === false ? [...pool] : shuffle(pool)).slice(0, Math.min(askedLevels, pool.length));
  const totalLevels = levelItems.length;

  const speed = clamp(typeof opt.bpSpeed === "number" ? opt.bpSpeed : 5, 1, 10);
  const roundSeconds = typeof opt.bpTimerSeconds === "number" && opt.bpTimerSeconds > 0 ? opt.bpTimerSeconds : 60;
  const bonusTypes = [];
  if (opt.bpBonusTime) bonusTypes.push("time");
  if (opt.bpBonusPoints) bonusTypes.push("points");
  if (opt.bpBonusX2) bonusTypes.push("x2");

  // pool of DISTRACTOR keywords (everything the teacher wrote) for the blimps
  const allKeywords = [...new Set(pool.map(it => it.keyword))];

  // ---- state ----
  let levelIndex = 0;
  let score = 0;
  let timeLeft = roundSeconds;
  let x2Turns = 0;             // remaining pops scored double (from an x2 bonus)
  let ended = false;
  // Đợt 114 — "this mount was thrown away", set ONLY by cleanup(). Deliberately
  // separate from `ended` ("the round is over"), which endRound() sets before it
  // schedules finishRound — testing that one here would break every normal end.
  // Needed because EVERY setTimeout in this file is bare (no timer helper), so a
  // flag is the only brake available.
  let dead = false;
  let rafId = null;
  let lastTs = 0;
  let sinceSpawn = SPAWN_GAP_MS;
  let deck = [];              // keyword deck for the current level (guarantees the correct one recurs)
  let warnedTime = false;
  let ambientTimer = 0;      // occasional plane fly-by
  const blimps = [];         // {el, bannerFit, x, y, vx, keyword, correct, bonus, popped}
  let fitter = null;         // definition-card auto-fit

  // ---- scene DOM ----
  root.innerHTML = "";
  const scene = el("div", "aw-bp-scene");
  scene.innerHTML = SCENE_HTML;
  root.append(scene);
  const skyLayer = scene.querySelector(".aw-bp-blimps");
  const fxLayer = scene.querySelector(".aw-bp-fx");
  const cartCard = scene.querySelector(".aw-bp-cart-card");
  const cartText = scene.querySelector(".aw-bp-cart-text");
  const levelSign = scene.querySelector(".aw-bp-levelsign");
  scene.querySelector(".aw-bp-engine").innerHTML = ENGINE_SVG;

  // ---- topbar: countdown clock + level progress bar (ui.topbarMid) ----
  let clockEl = null, progFillEl = null;
  if (ui.topbarMid) {
    ui.topbarMid.innerHTML = "";
    const row = el("div", "aw-bp-topbar");
    clockEl = el("div", "aw-bp-clock", formatClock(timeLeft));
    const bar = el("div", "aw-bp-progbar");
    progFillEl = el("div", "aw-bp-progbar-fill");
    bar.append(progFillEl);
    row.append(clockEl, bar);
    ui.topbarMid.append(row);
  }

  // Pronunciation playback (10/8/2026) — optional per-level, carried
  // through Change Template from an Anagram source (core/convert.js).
  // `it.src` is the ORIGINAL content object (see the `pool` map above), so
  // `.voice`/`.hideText` live at `it.src.voice`/`it.src.hideText`.
  const voicePlayer = createVoicePlayer();
  let firstLevelSpoken = false;

  loadLevel(0);
  updateScore();
  rafId = requestAnimationFrame(tick);

  // ----- TIME COST wiring (Đợt 143) — see core/engine.js's ui.setIdleGuard.
  // The guard answers ONE question: "could the student act right now?" If not,
  // the idle clock must not charge them. Here that is: the round already over,
  // the mount thrown away (`dead`), and a clip still speaking — nobody can pick
  // the right balloon for a word they are still being read.
  // Deliberately NO "no balloons on screen" case: blimps drift in continuously,
  // so a gap with nothing poppable lasts a fraction of a second — it is not a
  // state, and guarding it would only add a flag that can go stale.
  ui.setScoreProvider?.(scoreNow);
  ui.setIdleGuard?.(() => ended || dead || voicePlayer.isPlaying());

  // =========================================================
  // level / definition handling
  // =========================================================
  function loadLevel(i) {
    if (dead) return;   // Đợt 114 — reached late via landCrate/trainAdvance; see landCrate
    levelIndex = i;
    const it = levelItems[i];
    if (levelSign) levelSign.textContent = "Level " + (i + 1);
    voicePlayer.stop();   // silence the PREVIOUS level's clip, if any
    if (cartText) {
      cartText.className = "aw-bp-cart-text";
      const vv = voiceView(activity, it.src);   // Options > Content decides text/voice
      const hasVoice = vv.hasVoice, hideText = vv.hideText;
      if (hideText) {
        cartText.textContent = "";
        cartText.classList.add("aw-clue-voiceonly");
      } else {
        cartText.textContent = it.definition;
      }
      if (hasVoice) {
        const vBtn = el("button", "aw-voicebtn" + (hideText ? " aw-voicebtn-lg" : ""), icons.soundOn);
        vBtn.type = "button";
        vBtn.setAttribute("aria-label", "Listen to pronunciation");
        press(vBtn, e => { e.stopPropagation(); voicePlayer.toggle(it.src.voice, vBtn); });
        cartText.append(vBtn);
        if (vv.autoPlay) voicePlayer.playDelayed(it.src.voice, vBtn, firstLevelSpoken ? 0 : DEFAULT_INTRO_DELAY_MS);
      }
      firstLevelSpoken = true;
      setupCartFit();
    }
    buildDeck();
    updateProgress();
  }

  function setupCartFit() {
    if (fitter) { fitter.destroy(); fitter = null; }
    fitter = autoFit(root, cartCard, s => cartCard.style.setProperty("--fit", s), {
      slack: root.clientWidth * 0.015,
      measure: () => cartText.scrollHeight
    });
  }

  // Deck for the current level: the correct keyword + up to 3 distinct
  // distractors, shuffled. Blimps draw from it; when empty it rebuilds, so
  // the correct keyword keeps reappearing without being the only balloon.
  function buildDeck() {
    const correct = levelItems[levelIndex].keyword;
    const distract = shuffle(allKeywords.filter(k => k !== correct)).slice(0, 3);
    deck = shuffle([correct, correct, ...distract]);   // weight correct a touch higher
  }

  function nextKeyword() {
    if (deck.length === 0) buildDeck();
    return deck.pop();
  }

  // =========================================================
  // main loop
  // =========================================================
  function tick(ts) {
    if (ended) return;
    if (!lastTs) lastTs = ts;
    let dt = ts - lastTs;
    lastTs = ts;
    if (dt > 100) dt = 100;   // clamp (tab was backgrounded / long frame) so nothing jumps

    // countdown
    timeLeft -= dt / 1000;
    if (timeLeft <= 0) { timeLeft = 0; updateClock(); return endRound(false); }
    updateClock();
    if (!warnedTime && timeLeft <= WARNING_SECONDS) { warnedTime = true; clockEl?.classList.add("is-warning"); bpSound.trainTime(); }

    // ambient plane fly-by every ~14s
    ambientTimer -= dt;
    if (ambientTimer <= 0) { ambientTimer = 12000 + Math.random() * 8000; planeFlyBy(); }

    // spawn blimps
    sinceSpawn += dt;
    if (blimps.length < MAX_BLIMPS && sinceSpawn >= SPAWN_GAP_MS) { sinceSpawn = 0; spawnBlimp(); }

    // move blimps (right -> left)
    const crossMs = BASE_CROSS_MS * (5 / speed);   // higher speed = shorter crossing
    for (let i = blimps.length - 1; i >= 0; i--) {
      const b = blimps[i];
      if (b.popped) continue;
      b.x += (b.vx * dt) / crossMs;                // vx is in % of scene width per full-cross
      b.el.style.left = b.x + "%";                 // left/top are % of the SCENE (containing block)
      if (b.x < -26) { b.el.remove(); blimps.splice(i, 1); }
    }

    rafId = requestAnimationFrame(tick);
  }

  // =========================================================
  // blimps
  // =========================================================
  function spawnBlimp() {
    const lane = LANES[Math.floor(Math.random() * LANES.length)] + (Math.random() * 6 - 3);
    // occasional bonus balloon if any bonus type is enabled (~1 in 7 spawns)
    const bonus = bonusTypes.length && Math.random() < 0.14 ? bonusTypes[Math.floor(Math.random() * bonusTypes.length)] : null;
    const keyword = bonus ? null : nextKeyword();
    const correct = !bonus && keyword === levelItems[levelIndex].keyword;

    const wrap = el("button", "aw-bp-blimp" + (bonus ? " is-bonus" : ""));
    wrap.type = "button";
    wrap.setAttribute("aria-label", bonus ? "Bonus balloon" : keyword);
    if (bonus) {
      const mark = bonus === "time" ? "+" : bonus === "points" ? "$" : "×2";
      wrap.innerHTML = bonusBalloonSvg(mark);
    } else {
      wrap.innerHTML = BLIMP_SVG;
      const banner = el("div", "aw-bp-banner");
      const txt = el("div", "aw-bp-banner-text", escapeHtml(keyword));
      banner.append(txt);
      wrap.append(banner);
    }
    const b = { el: wrap, x: 104, y: lane, vx: -130, keyword, correct, bonus, popped: false };
    wrap.style.left = b.x + "%";                   // % of the SCENE width/height (containing block)
    wrap.style.top = b.y + "%";
    press(wrap, (e) => { e.preventDefault(); popBlimp(b); });   // instant on touch-down — core/press.js
    skyLayer.append(wrap);
    blimps.push(b);
    // shrink the banner text to fit the blimp width
    if (!bonus) fitBanner(wrap.querySelector(".aw-bp-banner-text"));
  }

  function fitBanner(txt) {
    if (!txt) return;
    let size = 1;
    txt.style.setProperty("--bp-banner-fit", size);
    // one-shot shrink: reduce until it fits the banner box width
    requestAnimationFrame(() => {
      const box = txt.parentElement;
      let guard = 12;
      while (box && txt.scrollWidth > box.clientWidth + 1 && size > 0.4 && guard-- > 0) {
        size -= 0.08;
        txt.style.setProperty("--bp-banner-fit", size);
      }
    });
  }

  function popBlimp(b) {
    if (ended || b.popped) return;
    // TIME COST (Dot 143): popping a balloon IS the progress this game measures,
    // right or wrong - a class hunting the correct balloon is not idle.
    ui.noteActivity?.();
    b.popped = true;
    b.el.disabled = true;
    bpSound.pop();
    const rect = relRect(b.el, scene);
    popSplash(rect);
    b.el.classList.add("is-popped");
    setTimeout(() => b.el.remove(), 260);
    const idx = blimps.indexOf(b);
    if (idx >= 0) blimps.splice(idx, 1);

    if (b.bonus) { applyBonus(b.bonus, rect); return; }

    // drop the keyword crate from the blimp toward the train car
    dropCrate(rect, b.keyword, b.correct);
  }

  // =========================================================
  // cargo crate: falls from the popped blimp to the train car
  // =========================================================
  function dropCrate(fromRect, keyword, correct) {
    const crate = el("div", "aw-bp-crate", `<span>${escapeHtml(keyword)}</span>`);
    const startX = fromRect.x + fromRect.w / 2;
    const startY = fromRect.y + fromRect.h / 2;
    crate.style.left = startX + "px";
    crate.style.top = startY + "px";
    fxLayer.append(crate);

    const cartRect = relRect(cartCard, scene);
    const targetX = cartRect.x + cartRect.w / 2;
    const targetY = cartRect.y + cartRect.h * 0.28;
    const dx = targetX - startX, dy = targetY - startY;

    let done = false;
    const settle = () => {
      if (done) return; done = true;
      if (correct) landCrate(crate); else breakCrate(crate);
    };
    const anim = crate.animate(
      [
        { transform: "translate(-50%,-50%) translate(0px,0px) rotate(0deg)", opacity: 1 },
        { transform: `translate(-50%,-50%) translate(${dx}px, ${dy}px) rotate(${correct ? 6 : -14}deg)`, opacity: 1 }
      ],
      { duration: CRATE_FALL_MS, easing: "cubic-bezier(.5,.05,.75,.6)", fill: "forwards" }
    );
    anim.onfinish = settle;
    setTimeout(settle, CRATE_FALL_MS + 80);   // fallback per CONG THUC MAU §3.4 (tab hidden -> onfinish may never fire)
  }

  function landCrate(crate) {
    // Đợt 114 — reached from dropCrate's 700ms bare fallback timer. Left running
    // after teardown it played the cargo/ting/train cues over the next game and,
    // worse, ran on into loadLevel -> setupCartFit -> autoFit(), which registers
    // a NEW window resize listener that cleanup() can no longer destroy.
    if (dead) return;
    bpSound.cargoCorrect(); bpSound.ting();
    crate.classList.add("is-landed");
    setTimeout(() => crate.remove(), 500);
    // score + advance
    const gain = x2Turns > 0 ? 2 : 1;
    if (x2Turns > 0) x2Turns--;
    score += gain;
    updateScore();
    flyMark(true);
    // train chugs to the next definition
    const next = levelIndex + 1;
    if (next >= totalLevels) { endRound(true); return; }
    trainAdvance(() => loadLevel(next));
  }

  function breakCrate(crate) {
    bpSound.cargoWrong();
    // Wrong-answer penalty: subtract pointsOff (negative allowed, no clamp). pointsOff===0 → no change.
    if (pointsOff > 0) { score -= pointsOff; updateScore(); }
    crate.classList.add("is-broken");
    setTimeout(() => crate.remove(), 500);
    flyMark(false);
    scene.classList.add("is-shake");
    setTimeout(() => scene.classList.remove("is-shake"), 360);
  }

  // slide the whole train left a touch and back (a "chug") between levels
  function trainAdvance(after) {
    if (dead) return;   // Đợt 114 — same chain as landCrate, second entry point
    bpSound.trainChug();
    const train = scene.querySelector(".aw-bp-train");
    let done = false;
    const run = () => { if (done) return; done = true; after && after(); };
    if (!train) { run(); return; }
    train.animate(
      [
        { transform: "translateX(0)" },
        { transform: "translateX(-4%)" },
        { transform: "translateX(0)" }
      ],
      { duration: 560, easing: "ease-in-out" }
    ).onfinish = run;
    setTimeout(run, 640);
    if (Math.random() < 0.5) bpSound.trainToot();
  }

  function applyBonus(type, rect) {
    if (type === "time") { timeLeft += 10; warnedTime = false; clockEl?.classList.remove("is-warning"); bpSound.balloonTime(); toastAt(rect, "+10s"); }
    else if (type === "points") { score += 1; updateScore(); bpSound.balloonLoot(); flyMark(true); toastAt(rect, "+1"); }
    else if (type === "x2") { x2Turns += 3; bpSound.balloonCombo(); toastAt(rect, "×2!"); }
  }

  // =========================================================
  // fx helpers
  // =========================================================
  function popSplash(rect) {
    const s = el("div", "aw-bp-splash", "POP");
    s.style.left = (rect.x + rect.w / 2) + "px";
    s.style.top = (rect.y + rect.h / 2) + "px";
    fxLayer.append(s);
    setTimeout(() => s.remove(), 620);
  }

  function toastAt(rect, text) {
    const t = el("div", "aw-bp-float", escapeHtml(text));
    t.style.left = (rect.x + rect.w / 2) + "px";
    t.style.top = (rect.y + rect.h / 2) + "px";
    fxLayer.append(t);
    setTimeout(() => t.remove(), 900);
  }

  function flyMark(correct) {
    const m = el("div", "aw-bp-mark" + (correct ? " is-ok" : " is-no"), correct ? "&#10003;" : "&#10007;");
    const cr = relRect(cartCard, scene);
    m.style.left = (cr.x + cr.w / 2) + "px";
    m.style.top = (cr.y) + "px";
    fxLayer.append(m);
    setTimeout(() => m.remove(), 950);
  }

  function planeFlyBy() {
    bpSound.planeFlyBy();
    const p = el("div", "aw-bp-plane", `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="6" y="16" width="86" height="9" rx="4" fill="#c94c3c"/>
      <path d="M92 20 l22 -6 v12 z" fill="#8f2f24"/>
      <rect x="30" y="7" width="34" height="6" rx="3" fill="#b23a2e"/>
      <rect x="18" y="26" width="10" height="3" fill="#6b4a2f"/></svg>`);
    fxLayer.append(p);
    p.animate([{ transform: "translateX(0)" }, { transform: "translateX(-125vw)" }],
      { duration: 5200, easing: "linear" }).onfinish = () => p.remove();
    setTimeout(() => p.remove(), 5600);
  }

  // =========================================================
  // topbar / score / progress
  // =========================================================
  function updateClock() { if (clockEl) clockEl.textContent = formatClock(timeLeft); }
  // TIME COST (Dot 143): the idle clock's running total is subtracted HERE, at
  // the single place this game paints its score. `score` itself stays the game's
  // own tally (bonuses read and add to it), so the deduction is applied on the
  // way OUT and can never be double-counted into the running total.
  function scoreNow() { return score - (ui.timeCostTotal ? ui.timeCostTotal() : 0); }
  function updateScore() { ui.setScore(scoreNow()); }
  function updateProgress() {
    if (progFillEl) progFillEl.style.width = Math.round((levelIndex / totalLevels) * 100) + "%";
    ui.setNav({ index: Math.min(levelIndex + 1, totalLevels), total: totalLevels, onPrev: null, onNext: null });
  }

  // =========================================================
  // end of round
  // =========================================================
  function endRound(win) {
    if (ended) return;
    ended = true;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    if (win) { if (progFillEl) progFillEl.style.width = "100%"; bpSound.complete(); }
    else { bpSound.timesUp(); setTimeout(() => { if (!dead) bpSound.gameOver(); }, 260); }
    // freeze remaining blimps
    blimps.forEach(b => { b.popped = true; b.el.disabled = true; });
    setTimeout(() => finishRound(win ? "Game complete" : "Time's up"), win ? 300 : 500);
  }

  function finishRound(title) {
    if (dead) return;   // Đợt 114 — the 300/500ms timer above outlived the play; never hand in
    // review + perQuestion over the LEVELS played (each level = one definition)
    const perQuestion = levelItems.map((it, i) => ({ q: i, correct: i < levelIndex }));
    const review = levelItems.map((it, i) => ({
      question: it.definition,
      answered: i < levelIndex,
      yourText: i < levelIndex ? it.keyword : null,
      yourCorrect: i < levelIndex,
      correctText: it.keyword,
      src: it.src
    }));
    const correctCount = levelItems.filter((it, i) => i < levelIndex).length;
    ui.finish({
      correct: correctCount,
      incorrect: totalLevels - correctCount,
      total: totalLevels,
      perQuestion, review,
      answered: correctCount,
      // Only report the live (penalized) score when the penalty is on; otherwise
      // omit it so score defaults to correctCount — byte-identical to old behavior.
      ...(pointsOff > 0 ? { score } : {}),
      title
    });
  }

  // =========================================================
  return function cleanup() {
    dead = true;      // Đợt 114 — the only brake on this file's 11 bare setTimeouts
    ended = true;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    if (fitter) { fitter.destroy(); fitter = null; }
    voicePlayer.stop();
    blimps.length = 0;
    if (ui.topbarMid) ui.topbarMid.innerHTML = "";
  };
}

// ---------- small helpers ----------
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function formatClock(sec) {
  const s = Math.max(0, Math.ceil(sec));
  return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
}
function relRect(node, container) {
  const a = node.getBoundingClientRect(), b = container.getBoundingClientRect();
  return { x: a.left - b.left, y: a.top - b.top, w: a.width, h: a.height };
}
function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Static scene skeleton (parallax desert + rails + train). Blimps + fx are
// added into their layers at runtime; the engine SVG is injected in mount().
const SCENE_HTML = `
  <div class="aw-bp-sky"></div>
  <div class="aw-bp-mountains">
    <svg viewBox="0 0 1200 300" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M0 300 V150 l60 -40 l30 60 l50 -110 l40 90 l70 -70 l60 120 l90 -150 l50 130 l80 -60 l70 90 l90 -120 l60 80 l70 -40 l80 70 l70 -50 V300 Z" fill="#b7b0c9"/>
      <path d="M0 300 V210 l120 -50 l90 60 l110 -80 l120 70 l130 -60 l120 80 l150 -70 l130 70 l110 -40 V300 Z" fill="#a59ec0" opacity=".8"/>
    </svg>
  </div>
  <div class="aw-bp-cloud aw-bp-cloud-a"></div>
  <div class="aw-bp-cloud aw-bp-cloud-b"></div>
  <div class="aw-bp-ground"></div>
  <div class="aw-bp-cactus aw-bp-cactus-a"></div>
  <div class="aw-bp-cactus aw-bp-cactus-b"></div>
  <div class="aw-bp-rail"></div>
  <div class="aw-bp-blimps"></div>
  <div class="aw-bp-train">
    <div class="aw-bp-cart">
      <div class="aw-bp-cart-card"><div class="aw-bp-cart-text"></div></div>
    </div>
    <div class="aw-bp-engine"></div>
  </div>
  <div class="aw-bp-levelsign">Level 1</div>
  <div class="aw-bp-fx"></div>
`;

registerTemplate(balloonPopTemplate);
export default balloonPopTemplate;
