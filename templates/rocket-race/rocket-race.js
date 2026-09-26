// =============================================================
// TEMPLATE: ROCKET RACE — a space race you win by answering English questions.
//
//  • SOLO (default, and the only mode a pupil gets on a homework link): your
//    rocket races 3–5 computer rockets to the chequered finish line. A question
//    sits under the track with 2–6 answer tiles.
//      – Right tile → your rocket FIRES one segment forward (whoosh, ✓ flies).
//      – Wrong tile → the engine STALLS (shake + smoke), you lose a heart (if
//                     lives are on), "−N" flies to the score (if Points off is
//                     on), and the question goes to the back of the queue — you
//                     keep going until you get it right (Maze chase's rule).
//      – 3 right in a row → TURBO: double flame, "TURBO!" banner, rivals lose
//                     speed for a few seconds. Progress itself never changes:
//                     ONE right answer = ONE segment, always (teacher's rule A,
//                     20/9/2026 — the score stays "questions right").
//      – Power-ups (Options): a crate drifts into your lane every few right
//        answers; the next right answer collects it — 🛡 shield (absorbs the
//        next stall: no heart, no shake), 🚀 turbo, ☄ meteor (the leading
//        rival is knocked back). Never a segment, so never a point.
//      – Rivals move on their own clock (Rival speed) with a light rubber band
//        so the race stays close; whoever crosses first is 1st. Your PLACE is
//        the headline of the end panel; your SCORE is still right / total.
//  • TEAMS (teacher's screen only): the rockets are teams of the class. Turns
//    go round the teams (and, if a class is picked, round its pupils); a right
//    answer moves that team's rocket, a wrong one stalls it and the question
//    is spent. The race ends when every team's questions are used up.
//  • FIGHT (MODE button, Đợt 351 — thầy 20/9/2026): the core referee runs the
//    match exactly as it does for Quiz (same question on both boards, first
//    right answer wins the round, Time delay / Speed bonus / In turns from the
//    match Options), but the frame is `tpl.fightLayout: "shared-top"`: ONE
//    race across the top (both teams' rockets on one track, drawn by this
//    module into `ctl.sharedRoot()`) and each board below is that team's
//    question panel. A right answer fires that team's rocket one segment; a
//    wrong one stalls it and the question is spent (no retry). Lives, crates
//    and rivals are off in a match.
//  • Real-time WITHOUT requestAnimationFrame (a hidden tab freezes rAF — core
//    rule): one setInterval tick with a delta clamp drives rivals, the question
//    clock and the crate. CSS transitions do the smoothing.
//  • Fixed SPACE look (does not recolour per theme) — same call as Maze chase.
//    Art is inline SVG + emoji; the three planets are copies of Maze chase's
//    (templates never import across folders, copying files is the convention).
//
//  Data model "A" (like Quiz): activity.content.questions[] =
//     { question, answers:[ { text, correct? } ] }  (exactly one correct).
// =============================================================

import { registerTemplate } from "../../core/registry.js";
import { shuffle, el } from "../../core/utils.js";
import { press } from "../../core/press.js";
import { icons } from "../../core/icons.js";
import { fitOnce } from "../../core/fit.js";
import { createVoicePlayer, voiceView, DEFAULT_INTRO_DELAY_MS } from "../../core/voice-playback.js";
import { rrSound } from "./rr-sound.js";
import { openRocketRaceEditor } from "./rocket-race-editor.js";
import { publishStage, clearStage, subscribeViewer, mintMatchId, VIEWER_STALE_MS } from "./rr-link.js";

function imgUrl(name) { return new URL(`./img/${name}`, import.meta.url).href; }

function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// ---- tuning ----
const TICK_MS = 50;                  // one physics step
const MAX_LIVES = 10;
const MAX_ROCKETS = 6;               // lanes on the track (1 player + up to 5 rivals, or up to 6 teams)
const STALL_MS = 1100;               // engine sputter after a wrong answer
// ⭐ Đợt 370 (thầy, 22/9/2026) — "sau khi xong 1 câu trước, phải có 1 khoảng delay
// nhỏ để khi double tab, không bị nhảy quá nhanh để chọn cả câu trước và câu sau".
// A tile sits under the finger; the next question rebuilds tiles in the SAME
// place, so the second tap of a double-tap lands on a brand-new question the
// class has not even read. Same idea as the engine's own START_GUARD_MS.
const TAP_GUARD_MS = 400;
const ANSWER_HOLD_MS = 800;          // pause on a resolved question before the next one
const TURBO_MS = 4500;               // afterburner window
const TURBO_STREAK = 3;              // right answers in a row that light the afterburner
const CRATE_EVERY = 4;               // a crate every N right answers (first one after 3)
const RIVAL_SLOW_TURBO = 0.72;       // rivals' speed while the player is in turbo
const FINISH_BANNER_MS = 1700;       // "1ST PLACE!" on screen before the end panel
// ⭐ Đợt 382 — FIGHT: winner over the line → the other rocket blows up → the
// referee's result panel. The hold covers the flight + the explosion (.9 s).
const RACE_END_HOLD_MS = 2800;
const RACE_BLOWUP_DELAY_MS = 650;
// ⭐ Đợt 368e (thầy, 22/9/2026) — "đưa con tàu về sát mép màn hình hơn, chỉ đủ
// nhìn thấy đuôi lửa và một chút xíu khói". These two are the rocket's LEFT edge
// as a % of the lane; the flame reaches ~0.25 rocket-widths further left and the
// exhaust ~0.34, so 3 leaves the flame just inside the frame and lets the smoke
// trail off the edge — which is the "chút xíu" asked for.
const TRACK_START = 3;
// ⭐ …and "chỉ cần mũi tàu chạm vạch là thắng luôn": this is still the rocket's
// LEFT edge, so the finish line is drawn at TRACK_END + one rocket width (see
// `--track-end` / `--rw` in rocket-race.css). 82 + 11 = 93 % in a match, 82 + 13
// = 95 % solo — both land the flag clear of the right edge.
const TRACK_END = 82;
// Seconds a rival "needs" per segment — what Rival speed means in plain terms.
const RIVAL_SECS = { slow: 10, normal: 7, fast: 5 };

// Answer tiles: the Quiz palette, shuffled per game so each answer position
// keeps one colour for the whole race.
const PALETTE = [
  { c: "#3b82f6", d: "#2563eb" }, { c: "#06b6d4", d: "#0e93ad" },
  { c: "#10b981", d: "#059669" }, { c: "#f59e0b", d: "#d97706" },
  { c: "#f97316", d: "#ea580c" }, { c: "#ef4444", d: "#dc2626" },
  { c: "#14b8a6", d: "#0f9488" }, { c: "#8b5cf6", d: "#7c3aed" }
];
// Rocket hulls — the player's is always the first (gold); rivals / teams take
// the rest in order so a team keeps its colour from setup to podium.
const HULLS = [
  { c: "#ffd54a", d: "#c9950a", n: "gold" },
  { c: "#ff6b81", d: "#b8233a", n: "red" },
  { c: "#4fc3f7", d: "#0d78b4", n: "blue" },
  { c: "#7ee787", d: "#1f8f3a", n: "green" },
  { c: "#c77dff", d: "#7b2fc4", n: "purple" },
  { c: "#ffa552", d: "#c25e0a", n: "orange" }
];
const PILOTS = ["🐱", "🐶", "🦊", "🐼", "🐸", "🐧", "🐨", "🐯"];
const RIVAL_NAMES = ["Mia", "Leo", "Zoe", "Noah", "Aria", "Liam", "Kai", "Ella"];
// FIGHT — the two boards' rockets: left board = blue cat, right board = red fox.
const FIGHT_TEAMS = [
  { name: "TEAM 1", pilot: "🐱", hull: HULLS[2] },
  { name: "TEAM 2", pilot: "🦊", hull: HULLS[1] }
];

const ROCKET_SVG = `<svg viewBox="0 0 160 70" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path class="aw-rr-fin" d="M34 16 L10 4 L26 30 Z"/>
  <path class="aw-rr-fin" d="M34 54 L10 66 L26 40 Z"/>
  <path class="aw-rr-hull" d="M22 35 C22 14 46 8 92 8 C126 8 148 24 158 35 C148 46 126 62 92 62 C46 62 22 56 22 35 Z"/>
  <path class="aw-rr-hull-hi" d="M40 22 C58 15 90 14 118 17 C100 12 60 12 40 22 Z"/>
  <path class="aw-rr-nose" d="M128 14 C142 20 152 28 158 35 C152 42 142 50 128 56 Z"/>
  <ellipse class="aw-rr-tail" cx="26" cy="35" rx="7" ry="13"/>
  <circle class="aw-rr-port" cx="82" cy="35" r="16"/>
  <path class="aw-rr-crack is-c1" d="M52 16 l5 9 l-4 5 l7 10 l-3 6" fill="none"/>
  <path class="aw-rr-crack is-c2" d="M118 52 l-6 -8 l5 -6 l-7 -9" fill="none"/>
  <path class="aw-rr-crack is-c3" d="M40 40 l8 -6 l3 8 l7 -4" fill="none"/>
</svg>`;
const FLAME_SVG = `<svg viewBox="0 0 90 50" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path class="aw-rr-flame-out" d="M88 25 C70 4 30 4 2 25 C30 46 70 46 88 25 Z"/>
  <path class="aw-rr-flame-in" d="M88 25 C74 14 46 14 26 25 C46 36 74 36 88 25 Z"/>
</svg>`;
const CRATE_ICON = { shield: "🛡", turbo: "🚀", meteor: "☄" };
const MEDAL = ["🥇", "🥈", "🥉"];

function placeWord(n) {
  const m100 = n % 100, m = n % 10;
  const suf = (m100 >= 11 && m100 <= 13) ? "th" : m === 1 ? "st" : m === 2 ? "nd" : m === 3 ? "rd" : "th";
  return n + suf;
}
function clampInt(v, lo, hi, dflt) {
  const n = Number(v);
  if (!Number.isFinite(n)) return dflt;
  return Math.max(lo, Math.min(hi, Math.round(n)));
}
// Lives are opt-in: 0 / null / undefined → unlimited (same rule as Quiz).
function normLives(v) {
  if (v == null || v === 0) return null;
  return Math.min(MAX_LIVES, Math.max(1, Math.round(v)));
}
function fitText(box, txt) {
  const apply = s => txt.style.setProperty("--fit", s);
  fitOnce(box, txt, apply, { slack: 1 });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => fitOnce(box, txt, apply, { slack: 1 })).catch(() => {});
}
// Width-only shrink for a single-line label (see Maze chase for why fitOnce
// can't be reused here: Baloo's tall metrics false-trigger its height check).
function fitLabelWidth(node, min = 0.4) {
  const run = () => {
    node.style.setProperty("--tw", "1");
    if (node.scrollWidth <= node.clientWidth) return;
    let lo = min, hi = 1, best = min;
    for (let i = 0; i < 12; i++) {
      const mid = (lo + hi) / 2;
      node.style.setProperty("--tw", mid);
      if (node.scrollWidth > node.clientWidth) hi = mid; else { best = mid; lo = mid; }
    }
    node.style.setProperty("--tw", best);
  };
  run();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(run).catch(() => {});
}

// ---- the scene: sky + minimap + track + fx + banner, built into any host ----
// In SOLO / TEAMS the host is this play's own `.aw-rr-stage`; in FIGHT it is
// the match's shared area above the two boards (`ctl.sharedRoot()`), where the
// ONE scene holds both teams' rockets.
function buildScene(host) {
  const sky = el("div", "aw-rr-sky");
  sky.append(el("div", "aw-rr-stars is-far"), el("div", "aw-rr-stars is-near"),
    Object.assign(el("img", "aw-rr-planet is-sun"), { src: imgUrl("sun.webp"), alt: "" }),
    Object.assign(el("img", "aw-rr-planet is-big"), { src: imgUrl("bigplanet.webp"), alt: "" }),
    Object.assign(el("img", "aw-rr-planet is-green"), { src: imgUrl("greenplanet.webp"), alt: "" }));
  const minimap = el("div", "aw-rr-minimap");
  const track = el("div", "aw-rr-track");
  const lanesEl = el("div", "aw-rr-lanes");
  const finishEl = el("div", "aw-rr-finish");
  // Đợt 368e — the flag's position is DERIVED, not typed twice: CSS puts it at
  // `--track-end + --rw` (one rocket width past the rocket's left edge), which
  // is exactly where the nose lands. Hard-coding it here as `TRACK_END + 7` is
  // what had the nose overshooting the flag by 3.8u — measured.
  track.style.setProperty("--track-end", String(TRACK_END));
  track.append(finishEl, lanesEl);
  const fxLayer = el("div", "aw-rr-fx");
  const banner = el("div", "aw-rr-banner");
  host.append(sky, minimap, track, fxLayer, banner);
  return { host, sky, minimap, track, lanesEl, fxLayer, banner };
}
// One rocket's DOM (craft = flame · hull · pilot, then the name tag) + its minimap dot.
// ⭐ Đợt 353 — `.aw-rr-craft` WRAPS flame + hull + pilot and is what bobs, shakes
// and lunges (rocket-race.css). Before, those keyframes sat on `.aw-rr-body`
// alone: the hull moved while the flame — a SIBLING — stood still (thầy: "phần
// đuôi lửa đang đứng yên"), and the pilot's own copy of the bob animation
// REPLACED its `translate(-50%,-50%)` centring transform, so the emoji sat half
// a glyph down-right of the porthole (measured: +13px, +10px on a 128px rocket
// — thầy: "icon cần được đưa vào trong cửa sổ"). One moving box, no per-child
// transform fights.
function buildRocketEl(scene, r, laneIdx, laneCount) {
  const lane = el("div", "aw-rr-lane");
  lane.style.setProperty("--lane", laneIdx);
  const rk = el("div", "aw-rr-rocket" + (r.isPlayer ? " is-player" : ""));
  rk.dataset.side = String(r.id);
  rk.style.setProperty("--rc", r.hull.c);
  rk.style.setProperty("--rd", r.hull.d);
  rk.style.setProperty("--x", TRACK_START);
  rk.style.setProperty("--wob", r.wobble.toFixed(2) + "s");
  const flame = el("div", "aw-rr-flame", FLAME_SVG);
  const body = el("div", "aw-rr-body", ROCKET_SVG);
  const pilot = el("div", "aw-rr-pilot", "");   // Đợt 358: a clipped porthole circle…
  const face = el("span", "aw-rr-face", ""); face.textContent = r.pilot; pilot.append(face);   // …with the jiggling face inside
  const tag = el("div", "aw-rr-tag", "");
  tag.textContent = r.name;
  const craft = el("div", "aw-rr-craft");
  // Đợt 359 — faint white exhaust behind the flame (3 staggered puffs, CSS-driven)
  const exhaust = el("div", "aw-rr-exhaust");
  for (let i = 0; i < 3; i++) exhaust.append(el("span", "aw-rr-exhaust-puff"));
  craft.append(exhaust, flame, body, pilot);
  rk.append(craft, tag);
  lane.append(rk);
  scene.lanesEl.append(lane);
  const dot = el("div", "aw-rr-dot" + (r.isPlayer ? " is-player" : ""));
  dot.style.setProperty("--rc", r.hull.c);
  dot.style.setProperty("--x", TRACK_START);
  scene.minimap.append(dot);
  r.el = rk; r.tag = tag; r.dot = dot;
  void laneCount;
}

// ---- FIGHT: the one shared scene both boards draw into (module-level; AWord
// runs one match at a time). Rebuilt whenever the match hands us a new root.
let rrFightScene = null;
function ensureFightScene(ctl) {
  // Đợt 392 — trận 3D: cảnh 2D cũ vẽ vào ổ ẨN (mọi logic cũ chạy y nguyên, cảnh 3D phản chiếu)
  const host = (rr3d && rr3d.ctl === ctl) ? rr3d.host2d : (ctl.sharedRoot && ctl.sharedRoot());
  if (!host) return null;
  if (rrFightScene && rrFightScene.host === host) return rrFightScene;
  if (rrFightScene && rrFightScene.ro) { try { rrFightScene.ro.disconnect(); } catch { /* ignore */ } }
  host.innerHTML = "";
  host.classList.add("aw-rr-shared");
  const scene = buildScene(host);
  // Đợt 355 — ONE question line across the top of the shared area (thầy: "để câu
  // hỏi thành 1 hàng ở trên cùng, vừa đúng 1 hàng thôi"). Each board moves its own
  // `.aw-rr-q` box into its half; `syncQbar` collapses the two halves into one
  // centred line whenever both boards show the same text (Fight content = Same).
  const qbar = el("div", "aw-rr-qbar");
  scene.qhalves = [el("div", "aw-rr-qhalf"), el("div", "aw-rr-qhalf")];
  qbar.append(scene.qhalves[0], scene.qhalves[1]);
  host.append(qbar);
  scene.qbar = qbar;
  // Đợt 368e — `--lanes` now sits on the TRACK, not on the lane box: the finish
  // flag is a SIBLING of the lanes and needs it too (it derives `--rw` from it).
  scene.track.style.setProperty("--lanes", 2);
  scene.rockets = FIGHT_TEAMS.map((t, i) => {
    const r = { id: i, name: t.name, pilot: t.pilot, hull: t.hull, isPlayer: false, p: 0, L: 1,
                el: null, tag: null, dot: null, done: false, place: 0, wobble: i * 1.3 };
    buildRocketEl(scene, r, i, 2);
    // Đợt 354 — no "TEAM n" tag in a match (CSS hides it): a big 1 / 2 sits on the
    // nose instead, and a smoke node waits for the first lost life (see paintDamage).
    const craft = r.el.querySelector(".aw-rr-craft");
    craft.append(el("div", "aw-rr-num", String(i + 1)), el("div", "aw-rr-dmgsmoke"));   // Đợt 355: smaller number (CSS)
    return r;
  });
  const flag = el("div", "aw-rr-dot is-flag", "🏁");
  flag.style.setProperty("--x", TRACK_END);
  scene.minimap.append(flag);
  scene.finishedCount = 0;
  // `--aw-u` (1% of the width) is what every size in this scene is written in.
  // core/unit.js only sets it on `.aw-stage`; the shared area is not one, so
  // this module measures it itself. ⚠️ CONTENT width, same as core/unit.js.
  const setUnit = () => { host.style.setProperty("--aw-u", (host.clientWidth / 100).toFixed(3) + "px"); };
  setUnit();
  if (window.ResizeObserver) { scene.ro = new ResizeObserver(setUnit); scene.ro.observe(host); }
  else window.addEventListener("resize", setUnit);
  rrFightScene = scene;
  return scene;
}

// Đợt 355 — same text on both halves ⇒ one full-width line (the second half hides).
function syncQbar(scene) {
  if (!scene || !scene.qbar) return;
  const t = scene.qhalves.map(h => (h.textContent || "").trim());
  scene.qbar.classList.toggle("is-same", !!t[0] && t[0] === t[1]);
}
// ⭐⭐ Đợt 382 (thầy, 24/9/2026) — THE MATCH IS WON AT THE FLAG, AND THE TRACK IS
// FIXED: HALF the questions (rounded up). "Ngay khi 1 tàu chạm vào vạch đích thì
// dừng game ngay và đội đó thắng" + "game này thắng thua bằng về đích".
// ⛔ This REPLACES the elastic track of Đợt 355 (flag = leader + questions still
// open). That track made "touching the flag" happen only on the very last
// question, and it hid Points off on the leader: backing the leader up pulled
// the flag back with it, so it barely moved on screen while the OTHER rocket
// seemed to jump forward. Đợt 355's own rule ("never end with a rocket in the
// middle") still holds by another road: when the questions or the clock run out
// the closer rocket FLIES to the flag and the other blows up (settleByPosition);
// a tie plays random already-played questions (ctl.suddenDeath) until one leads.
function fightTrackLength(n) { return Math.max(1, Math.ceil(n / 2)); }

// Menu pause (Đợt 91) bridge — one handler per live mount (a match has TWO).
const rrPauseHandlers = new Set();

// ⭐⭐ Đợt 392 (thầy, 26/9/2026) — FIGHT 3D. Trận dựng `fightFrame.fullscene` ⇒ core/fight.js
// gọi `tpl.fightScene()` ngay khi khung dựng xong (trước READY): ở đây ta dựng một cảnh
// WebGL (rr3d-view.js, import ĐỘNG) phủ CẢ khung + một ổ 2D ẨN mà toàn bộ code Fight 2D cũ
// vẫn vẽ vào như trước. Luật chơi, trọng tài, Lives, Points off, Different, iPad, Sudden
// death… GIỮ NGUYÊN 100%; mỗi sự kiện chỉ được PHẢN CHIẾU sang cảnh 3D qua `v3(fn)`.
// WebGL hỏng / import lỗi ⇒ tự lùi về Fight 2D (bỏ `is-fullscene`, hiện ổ 2D).
let rr3d = null;   // { root, host2d, ctl, view, sfx, boards:[..], q:["",""], pending:[], dead }
function v3(fn) {
  const st = rr3d;
  if (!st || st.dead || st.failed) return;
  if (st.view) { try { fn(st.view); } catch (e) { console.warn("[rocket-race 3D]", e); } }
  else st.pending.push(fn);
}
function rr3dProgressLabel() {
  if (!rr3d) return "";
  const [a, b] = rr3d.prog;
  const tot = (a.total || 0) + (b.total || 0);
  return tot ? Math.round(100 * Math.min(1, ((a.done || 0) + (b.done || 0)) / tot)) + "%" : "0%";
}
// Nhãn ở hàng nút là của bàn 0 — bàn 1 (Different / In turns) sang câu thì tự sửa nhãn ở đây.
function rr3dPaintProgress() {
  if (!rr3d) return;
  const wrap = rr3d.root.closest(".aw-fight");
  const lab = wrap && wrap.querySelector(".aw-fight-boardtools .aw-nav-label");
  if (lab) lab.textContent = rr3dProgressLabel();
}
function rr3dFallback(st, err) {
  console.warn("[rocket-race] 3D scene failed — back to 2D", err);
  st.failed = true;
  rrSound.quiet = false;
  const wrap = st.root.closest(".aw-fight");
  if (wrap) { wrap.classList.remove("is-fullscene", "is-skin-rr3d"); wrap.style.setProperty("--aw-fsh", "5.75"); }
  st.root.classList.remove("aw-rr3d-root");
  st.host2d.classList.remove("aw-rr3d-hidden2d");
}
function rr3dScene({ root, ctl, title, play }) {
  root.innerHTML = "";
  root.classList.add("aw-rr3d-root");
  const host3d = el("div", "aw-rr3d-canvas");
  const host2d = el("div", "aw-rr3d-hidden2d");
  root.append(host3d, host2d);
  const st = { root, host2d, ctl, view: null, sfx: null, boards: [null, null], q: ["", ""], pending: [], dead: false, failed: false,
               prog: [{ done: 0, total: 0 }, { done: 0, total: 0 }], twoDevice: false, offs: [] };
  rr3d = st;
  rrSound.quiet = true;                       // tiếng tổng hợp cũ im — bộ tiếng 3D thay
  const wrap = root.closest(".aw-fight");
  if (wrap) { rr3dSoundMenu(st, wrap); rr3dMenuHost(st, wrap); }
  Promise.all([import("./rr3d-view.js"), import("./rr3d-sfx.js")]).then(([V, S]) => {
    if (st.dead) return null;
    st.sfx = S.createRr3dSound();
    return V.createView({ ...RR3D_CFG(V), container: host3d, title: title || "ROCKET RACE",
      teams: V.DEFAULT_TEAMS,
      onStart: () => { play(); },
      onTap: (side, k) => { const b = st.boards[side]; if (b) b.choose(k); },
      sfx: (n, v) => st.sfx && st.sfx.play(n, v),
      loop: (n, on, v, f) => st.sfx && st.sfx.loop(n, on, v, f),
      swell: (n, a, b, u, d) => st.sfx && st.sfx.swell(n, a, b, u, d) });
  }).then(view => {
    if (!view) return;
    if (st.dead) { view.destroy(); return; }
    st.view = view;
    window.__rr3d = st;                       // bàn thử: __rr3d.view.step()/snap() khi khung xem trước bị ẩn
    const q = st.pending.splice(0);
    q.forEach(fn => { try { fn(view); } catch (e) { console.warn("[rocket-race 3D]", e); } });
    rr3dLaunch(st, play);                     // ⭐ Đợt 398: cảnh phóng từ mặt đất phủ lên, hoà cảnh xong mới vào trận
  }).catch(e => { if (!st.dead) rr3dFallback(st, e); });
  return {
    // ⭐ Đợt 393 — core/fight.js hỏi template vẽ bảng kết quả RIÊNG (nổi trên cảnh 3D còn đang chạy)
    showResult(info) { if (st.dead || st.failed || !st.view) return false; rr3dResult(st, info); return true; },
    destroy() {
      st.dead = true;
      st.offs.forEach(f => { try { f(); } catch { /* ignore */ } });
      try { st.launch && st.launch.destroy(); } catch { /* ignore */ }      // Đợt 398: rời trận giữa cảnh phóng
      try { st.isnd && st.isnd.end(); } catch { /* ignore */ }
      try { st.view && st.view.destroy(); } catch { /* ignore */ }
      try { st.sfx && st.sfx.stopAll(); } catch { /* ignore */ }
      if (rr3d === st) { rr3d = null; rrSound.quiet = false; }
    }
  };
}

// =========================================================
// ⭐ Đợt 398 (thầy 26/9/2026 duyệt MẪU 5b ở myGame: "ghép bản 5b vào AWord thay cho bản cũ") — CẢNH PHÓNG TỪ MẶT ĐẤT
// phủ lên cảnh đua ở MỌI ván (thầy chọn: Start again / Apply cũng chạy lại). Màn chờ ROCKET RACE + START → tiếng nổ,
// máy quay bay tới bệ, 3-2-1 (chữ + "túc"), phóng, vút qua, nhảy tốc độ → ĐÚNG đỉnh chớp sáng: cắt tức thì sang cảnh đua
// (cùng con tàu, cùng chỗ, cùng góc nhìn), gọi play() với `skipCount` ⇒ trận vào THẲNG GO (không đếm lại).
// Cảnh phóng/tiếng hỏng ⇒ lùi về nút START 3D cũ của cảnh đua (đếm 3-2-1 như trước).
// =========================================================
function rr3dLaunch(st, play) {
  const root = st.root;
  if (!document.getElementById("aw-rr3d-exo2")) {             // chữ ANDREW STUDIO / ROCKET RACE (mất mạng ⇒ Bahnschrift)
    const lk = document.createElement("link"); lk.id = "aw-rr3d-exo2"; lk.rel = "stylesheet";
    lk.href = "https://fonts.googleapis.com/css2?family=Exo+2:ital,wght@0,800;0,900;1,900&display=swap"; document.head.append(lk);
  }
  const layer = el("div", "aw-rr3d-launch"), hud = el("div", "aw-rr3d-lhud"), flash = el("div", "aw-rr3d-flash");
  const ttl = el("div", "aw-rr3d-ltitle"); ttl.textContent = "ROCKET RACE";
  const go = el("button", "aw-rr3d-lstart"); go.type = "button"; go.innerHTML = "&#9654;&nbsp; START";
  const count = el("div", "aw-rr3d-lcount");
  hud.append(ttl, go, count);
  root.append(layer, hud, flash);
  const timers = [];
  const after = (fn, ms) => timers.push(setTimeout(() => { if (!st.dead) fn(); }, ms));
  st.offs.push(() => { timers.forEach(clearTimeout); layer.remove(); hud.remove(); flash.remove(); });
  try { st.view.step(1); } catch { /* ignore */ }             // đóng băng cảnh đua (nằm dưới) tới lúc hoà cảnh
  const fallback = err => {                                   // không dựng được cảnh phóng ⇒ về START 3D cũ
    if (st.dead) return;
    console.warn("[rocket-race] launch scene failed — plain 3D start", err);
    try { st.launch && st.launch.destroy(); } catch { /* ignore */ }
    st.launch = null; layer.remove(); hud.remove();
    try { st.view.resume(); st.view.showStart(); } catch { /* ignore */ }
  };
  Promise.all([import("./rr3d-launch.js"), import("./rr3d-intro-sound.js")]).then(async ([L, S]) => {
    if (st.dead) return;
    st.isnd = S.createIntroSound(undefined, { prefs: () => (st.sfx ? st.sfx.prefs : { fx: true, bg: true }) });
    const launch = await L.createLaunch({ container: layer, hull: RR3D_HULL, rocketScale: 1.1, fov: 38,
      onHandoff: handoff, onTick: s => { if (st.isnd) st.isnd.update(s); } });
    if (st.dead) { launch.destroy(); return; }
    st.launch = launch;
    after(() => ttl.classList.add("on"), 700);
    after(() => go.classList.add("on"), 1800);
  }).catch(fallback);
  const pop = txt => { count.textContent = txt; count.classList.remove("pop"); void count.offsetWidth; count.classList.add("pop"); };
  press(go, () => {
    if (!st.launch || !st.launch.start()) return;
    if (st.isnd) st.isnd.fx("startboom", 0.9);                // bấm START: tiếng nổ tăng tốc
    hud.classList.add("is-launch");
    const Lf = st.launch.T.lift;
    [["3", Lf - 2.7], ["2", Lf - 1.8], ["1", Lf - 0.9], ["LIFTOFF!", Lf]].forEach(([t, at]) => after(() => pop(t), Math.max(0, at) * 1000));
  });
  function handoff() {
    if (st.dead) return;
    if (st.isnd) st.isnd.end();
    st.skipCount = true;
    try { st.view.resume(); } catch { /* ignore */ }
    const ok = play();                                        // bấm hộ Play bàn 0 ⇒ trận vào thẳng GO
    if (!ok) { st.skipCount = false; try { st.view.showStart(); } catch { /* ignore */ } }
    // cắt ngay ĐỈNH chớp sáng: lớp trắng che chỗ nối rồi tan ⇒ tàu cảnh phóng và tàu cảnh đua là MỘT
    flash.className = "aw-rr3d-flash on"; void flash.offsetWidth; flash.className = "aw-rr3d-flash off";
    layer.style.display = "none"; hud.remove();
    after(() => { try { st.launch && st.launch.destroy(); } catch { /* ignore */ } st.launch = null; layer.remove(); }, 300);
  }
}

// ⭐ Đợt 394 (thầy): "bấm nút MENU không hiển thị gì" — ☰ Menu của engine được dựng TRONG bàn 0,
// mà trong trận 3D bàn 0 là `visibility:hidden` nằm DƯỚI canvas (cả CSS `position:fixed` cũ cũng không
// cứu được: bị canvas che, hoạt ảnh aw-pop đứng ở khung 0 ⇒ opacity 0). Cách chữa không đụng core:
// menu vừa xuất hiện trong bàn ẩn ⇒ BÊ nguyên phần tử (nút + onclick của engine giữ nguyên) sang một
// lớp phủ riêng nổi trên cảnh, căn GIỮA màn như Options, khoác áo kính tối viền xanh của trận 3D.
// Engine vẫn tự đóng (Resume / bấm ra ngoài / closeMenu gọi .remove()) ⇒ lớp phủ tự gỡ theo.
function rr3dMenuHost(st, wrap) {
  let host = null, hostObs = null;
  const drop = () => { if (hostObs) { hostObs.disconnect(); hostObs = null; } if (host) { host.remove(); host = null; } };
  const adopt = menu => {
    if (st.failed || menu.closest(".aw-rr3d-menuhost")) return;
    drop();
    host = el("div", "aw-rr3d-menuhost");
    const head = el("div", "aw-rr3d-menutitle"); head.textContent = "MENU";
    menu.classList.add("aw-rr3d-menu");
    menu.prepend(head);
    menu.querySelectorAll(".aw-menu-item").forEach(b => { if (/^resume$/i.test(b.textContent.trim())) b.classList.add("is-resume"); });
    host.append(menu);
    wrap.append(host);
    // menu bị engine gỡ (đóng) ⇒ gỡ lớp phủ; đợi hết hoạt ảnh đóng của engine (~140 ms) là chuyện của nó
    hostObs = new MutationObserver(() => { if (host && !host.contains(menu)) drop(); });
    hostObs.observe(host, { childList: true });
  };
  const boards = wrap.querySelector(".aw-fight-boards") || wrap;
  const obs = new MutationObserver(recs => {
    for (const r of recs) for (const n of r.addedNodes) {
      if (n.nodeType === 1 && n.classList.contains("aw-menu")) adopt(n);
    }
  });
  obs.observe(boards, { childList: true, subtree: true });
  st.offs.push(() => { obs.disconnect(); drop(); });
}

// ⭐ Đợt 393 (thầy): "bấm vào nút loa sẽ hiện lên 2 menu để bật tắt gồm Effect và Background".
// Nút 🔊 của hàng nút trận vẫn là nút của engine — trong trận 3D ta chặn cú bấm (bắt ở pha CAPTURE
// trên khung trận, chạy trước onclick của nút) và mở bảng nhỏ ngay trên nút. Lựa chọn nhớ theo máy.
function rr3dSoundMenu(st, wrap) {
  let pop = null;
  const findBtn = () => wrap.querySelector('.aw-fight-boardtools button[aria-label="Sound"]');
  const prefs = () => (st.sfx ? st.sfx.prefs : { fx: true, bg: true });
  const paintBtn = () => {
    const b = findBtn(); if (!b) return;
    const p = prefs(), off = !p.fx && !p.bg;
    b.innerHTML = off ? icons.soundOff : icons.soundOn;
    b.classList.toggle("is-off", off);
    b.classList.toggle("is-half", !off && (!p.fx || !p.bg));
  };
  const close = () => { if (pop) { pop.remove(); pop = null; } };
  const open = btn => {
    close();
    pop = el("div", "aw-rr3d-sndmenu");
    [["fx", "EFFECTS"], ["bg", "BACKGROUND"]].forEach(([k, label]) => {
      const row = el("button", "aw-rr3d-sndrow");
      row.type = "button";
      const sw = el("span", "aw-rr3d-switch");
      const txt = el("span", "aw-rr3d-sndlabel"); txt.textContent = label;
      row.append(txt, sw);
      const paint = () => row.classList.toggle("is-on", !!prefs()[k]);
      paint();
      press(row, e => { e.stopPropagation(); if (st.sfx) st.sfx.setPrefs({ [k]: !prefs()[k] }); paint(); paintBtn(); });
      pop.append(row);
    });
    wrap.append(pop);
    const wr = wrap.getBoundingClientRect(), br = btn.getBoundingClientRect();
    const pw = pop.offsetWidth, ph = pop.offsetHeight;
    pop.style.left = Math.max(8, Math.min(wr.width - pw - 8, br.left - wr.left + br.width / 2 - pw / 2)) + "px";
    pop.style.top = Math.max(8, br.top - wr.top - ph - 10) + "px";
  };
  const onClick = e => {
    const b = e.target.closest && e.target.closest('.aw-fight-boardtools button[aria-label="Sound"]');
    if (b && wrap.contains(b) && !st.failed) {
      e.stopPropagation(); e.preventDefault();
      if (pop) close(); else open(b);
      return;
    }
    if (pop && !pop.contains(e.target)) close();
  };
  // pointerdown của core/press.js có thể kích nút trước click — chặn cả hai
  const onDown = e => {
    const b = e.target.closest && e.target.closest('.aw-fight-boardtools button[aria-label="Sound"]');
    if (b && wrap.contains(b) && !st.failed) { e.stopPropagation(); }
  };
  wrap.addEventListener("click", onClick, true);
  wrap.addEventListener("pointerdown", onDown, true);
  st.offs.push(() => { wrap.removeEventListener("click", onClick, true); wrap.removeEventListener("pointerdown", onDown, true); close(); });
  // icon theo lựa chọn đã nhớ (nút có thể được engine dựng sau một nhịp)
  const t = setTimeout(paintBtn, 300); st.offs.push(() => clearTimeout(t));
  st.paintSoundBtn = paintBtn;
}

// ⭐ Đợt 393 (thầy): "thiết kế màn TEAM X WIN, SHOW ANSWERS và START AGAIN riêng (khác Fight thông
// thường) và hiển thị trong khi vẫn còn nền là tàu vỡ và vũ trụ bao la của lượt game vừa rồi".
// Một lớp HUD kính mỏng nổi TRÊN canvas (cảnh 3D vẫn chạy phía sau: mảnh vỡ trôi, sao, tinh vân).
function rr3dResult(st, { winner, scores, reviews, again }) {
  const old = st.root.querySelector(".aw-rr3d-result"); if (old) old.remove();
  if (st.view) { try { st.view.resultView(); } catch { /* ignore */ } }
  const TEAM = ["TEAM LEFT", "TEAM RIGHT"];
  const COL = ["#3b8cff", "#ffc21a"];   // Đợt 398: đội 2 VÀNG (đỏ dễ nhầm với ô sai)
  const hud = el("div", "aw-rr3d-result");
  const card = el("div", "aw-rr3d-rescard");
  const title = el("div", "aw-rr3d-restitle");
  title.textContent = winner === 0 || winner === 1 ? TEAM[winner] + " WINS" : "IT'S A DRAW";
  if (winner === 0 || winner === 1) card.style.setProperty("--tc", COL[winner]);
  const sub = el("div", "aw-rr3d-ressub");
  const L = Math.max(1, st.trackLen || 1);
  [0, 1].forEach(i => {
    const lane = el("div", "aw-rr3d-reslane" + (i === winner ? " is-win" : ""));
    lane.style.setProperty("--tc", COL[i]);
    const name = el("span", "aw-rr3d-resname"); name.textContent = TEAM[i];
    const bar = el("span", "aw-rr3d-resbar");
    const fill = el("i"); fill.style.width = Math.round(100 * Math.min(1, (scores[i] || 0) / L)) + "%";
    bar.append(fill);
    const num = el("span", "aw-rr3d-resnum"); num.textContent = (scores[i] || 0) + " / " + L;
    lane.append(name, bar, num);
    sub.append(lane);
  });
  const btns = el("div", "aw-rr3d-resbtns");
  const hasRv = (reviews[0] && reviews[0].length) || (reviews[1] && reviews[1].length);
  if (hasRv) {
    const show = el("button", "aw-rr3d-btn"); show.type = "button"; show.textContent = "SHOW ANSWERS";
    press(show, () => { if (st.sfx) st.sfx.play("tap"); openAnswers(); });
    btns.append(show);
  }
  const ag = el("button", "aw-rr3d-btn is-primary"); ag.type = "button"; ag.textContent = "START AGAIN";
  press(ag, () => { if (st.sfx) st.sfx.play("tap"); again(); });
  btns.append(ag);
  card.append(title, sub, btns);
  hud.append(card);
  st.root.append(hud);
  requestAnimationFrame(() => hud.classList.add("is-in"));

  function openAnswers() {
    card.classList.add("is-away");
    const rv = el("div", "aw-rr3d-review");
    const head = el("div", "aw-rr3d-rvhead");
    const t = el("div", "aw-rr3d-rvtitle"); t.textContent = "ANSWERS";
    const x = el("button", "aw-rr3d-rvclose", icons.close); x.type = "button"; x.setAttribute("aria-label", "Close");
    press(x, () => { if (st.sfx) st.sfx.play("tap"); rv.remove(); card.classList.remove("is-away"); });
    head.append(t, x);
    const cols = el("div", "aw-rr3d-rvcols");
    [0, 1].forEach(i => {
      const col = el("div", "aw-rr3d-rvcol"); col.style.setProperty("--tc", COL[i]);
      const ct = el("div", "aw-rr3d-rvcoltitle"); ct.textContent = TEAM[i]; col.append(ct);
      const list = el("div", "aw-rr3d-rvlist");
      const rows = (reviews[i] || []).filter(r => r.answered);
      if (!rows.length) { const e0 = el("div", "aw-rr3d-rvempty"); e0.textContent = "No answers yet"; list.append(e0); }
      rows.forEach((r, k) => {
        const row = el("div", "aw-rr3d-rvrow");
        const q = el("div", "aw-rr3d-rvq"); q.textContent = (k + 1) + ". " + (r.question || "");
        row.append(q);
        const a = el("div", "aw-rr3d-rva " + (r.yourCorrect ? "is-ok" : "is-bad")); a.textContent = r.yourCorrect ? r.correctText : (r.yourText || "—");
        row.append(a);
        if (!r.yourCorrect) { const c = el("div", "aw-rr3d-rva is-ok"); c.textContent = r.correctText; row.append(c); }
        list.append(row);
      });
      col.append(list);
      cols.append(col);
    });
    rv.append(head, cols);
    hud.append(rv);
  }
}
// Cấu hình cảnh = MẪU 2i thầy duyệt ở myGame (mau-2i-duoi-theo-tomko.html). Cm = cỡ THẬT trên TOMKO 86".
const RR3D_HULL = { color: "#a9b1bd", roughness: 0.48, clearcoat: 0.35, env: 0.55 };   // chung cho cảnh đua + cảnh phóng (cùng một con tàu)
function RR3D_CFG(V) {
  const THREE = V.THREE;
  const P = (x, y, z) => new THREE.Vector3(x, y, z);
  const lerp = (a, b, t) => a + (b - a) * t;
  const Z0 = 0, Z1 = -64, NOSE = 2.9, GAP_HIGH = 3, LAST_STEPS = 3, CAM_SECS = 3.2;
  const EDGE = 0.3, CON_W = 17.5, CON_H = 33;
  let camK = 0, camLastT = 0;
  return {
    quality: "high", maxFps: 60, fov: 38, steps: 5, lives: 0, uiDepth: 9, rocketScale: 1.1, bannerY: 0.35, startY: 0.5, startCm: [22, 7],
    maxTiles: 6,
    // Đợt 397 (thầy): toàn cảnh ⇒ tàu lượn né đá vụn trôi ngược dọc làn (rr3d-view.js applyDodge)
    dodge: { every: [0.8, 1.7], speed: [9, 13], maxIn: 0.8, maxOut: 1.4, rocks: false },   // Đợt 398: bỏ đá, tàu vẫn lượn né
    portalVanish: true,                       // Đợt 398: tàu thắng biến mất trong cổng đích + loé sáng
    // Đợt 393 (thầy): chữ mở màn "bị to và lố quá" ⇒ nhỏ lại còn ~½ (0.55/0.7 → 0.26/0.34)
    // Đợt 398: mở màn là CẢNH PHÓNG (rr3d-launch.js) ⇒ cảnh đua vào thẳng pha "wait", không chữ, không START thứ hai,
    // và đứng sẵn ĐÚNG góc đuổi sau đuôi (introCamera null — góc bay vòng cũ đứng TRƯỚC mũi tàu làm 2 đội đảo trái/phải lúc nối)
    introTitles: [], startAt: 0, startHidden: true, introCamera: null,
    questionMaxCm: 176,                       // Đợt 393: thanh câu hỏi dãn tới đây khi câu dài
    shatter: { pieces: 44 }, flyOut: true, skySpin: 0.006, turboLabel: "small",
    winBanner: { size: 0.3, y: -1.05, ms: 7000 },
    finale: { gateAfter: 1200, hits: 3, hitGap: 320, burnMs: 550, hitsAfter: 1300, strike: "streak" },   // Đợt 398: đánh + nổ nhanh (~3 s)
    fovKick: 0, steadyUI: true,
    exhaust: { fire: 0.3, smoke: 0.9, flame: 0.45, smokeBack: 3.4, smokeLife: 0.75, smokeSize: 0.55, smokeSizeEnd: 2.4, smokeAlpha: 0.16 },
    nearFade: [7, 13], bloom: 0.6, ca: 0.0012,
    hull: RR3D_HULL, engineLight: 0.3,
    sunPos: P(-260, 150, -1300), sunScale: 300, rimPos: P(60, 40, 60),
    nebula: { c1: "#1d0d4a", c2: "#0d3e73", c3: "#4f7dd6", bright: 0.9 },
    planets: [
      { type: "ice", radius: 330, pos: P(40, -372, -520), a: "#08214d", b: "#1c6aa6", c: "#3f7a45", atmo: "#62b4ff", atmoPow: 2.2, tilt: 0.2 },
      { type: "gas", radius: 22, pos: P(170, 90, -700), a: "#b98a6a", b: "#e8d2b8", c: "#7a4a3a", atmo: "#ffd0a0", rings: true, ringColor: "#dcc8a8", tilt: 0.4 },
      { type: "gas", radius: 14, pos: P(-340, 120, -1150), a: "#a2452e", b: "#d9825a", c: "#5c1f14", atmo: "#ff9a6a", tilt: 0.2 },
      { type: "ice", radius: 9, pos: P(330, 210, -1250), a: "#6f93c9", b: "#cfe2f7", c: "#ffffff", atmo: "#a8d6ff", tilt: 0.1 },
      { type: "gas", radius: 30, pos: P(-620, 260, -1500), a: "#5b4a8f", b: "#b7a3dd", c: "#2e2152", atmo: "#c4a8ff", rings: true, ringColor: "#b9a8e0", tilt: 0.55, ringTilt: 0.6 },
      { type: "ice", radius: 5, pos: P(120, 150, -820), a: "#8a8a8a", b: "#c9c9c9", c: "#eeeeee", atmo: "#dddddd", tilt: 0.1 }
    ],
    gate: { pos: P(0, 0.2, Z1 - NOSE), normal: P(0, 0, 1), radius: 5.6, lamps: false },
    travelDir: P(0, 0, -1),
    dustBox: { c: P(0, 0, 0), s: P(56, 26, 90), follow: true },
    track(i, t, time) {
      const x = i === 0 ? -2.3 : 2.3;
      return { pos: P(x + Math.sin(time * 0.6 + i * 2) * 0.25, Math.sin(time * 0.9 + i) * 0.15, lerp(Z0, Z1, t)), dir: P(Math.cos(time * 0.6 + i * 2) * 0.03, 0, -1) };
    },
    camera({ t, trail, rockets, L }) {
      const dt = Math.max(0, Math.min(0.1, t - camLastT)); camLastT = t;
      const zc = lerp(Z0, Z1, Math.min(1, trail));
      const p0 = rockets[0].p, p1 = rockets[1].p;
      const want = (Math.abs(p0 - p1) >= GAP_HIGH || Math.max(p0, p1) >= L - LAST_STEPS) ? 1 : 0;
      camK += Math.max(-dt / CAM_SECS, Math.min(dt / CAM_SECS, want - camK));
      const k = camK * camK * (3 - 2 * camK);
      const chase = { pos: P(Math.sin(t * 0.21) * 0.6, 3.3 + Math.sin(t * 0.33) * 0.2, zc + 16.5), look: P(0, 0.1, zc - 14) };
      const zA = zc + 5, zB = Z1 - 8, zMid = (zA + zB) / 2, D = (zA - zB) * 1.05 + 8;
      const high = { pos: P(D * 0.8 + Math.sin(t * 0.15) * 1.2, D * 0.5, zMid), look: P(0, -1, zMid) };
      return { pos: chase.pos.lerp(high.pos, k), look: chase.look.lerp(high.look, k), mode: camK < 0.02 ? "chase" : "high" };
    },
    layout(_s, _z, _a, U) {
      const qW = 90, qH = 7, M = 2;
      return {
        question: { x: 0.5 - U.cw(qW) / 2, y: U.ch(M), w: U.cw(qW), h: U.ch(qH) },
        consoles: [
          { x: U.cw(EDGE), y: 0.5 - U.ch(CON_H) / 2, w: U.cw(CON_W), h: U.ch(CON_H), cols: 1, rows: 4, headerFrac: 0.11, rotY: 0.3, pivot: "outer", noPanel: true },
          { x: 1 - U.cw(EDGE + CON_W), y: 0.5 - U.ch(CON_H) / 2, w: U.cw(CON_W), h: U.ch(CON_H), cols: 1, rows: 4, headerFrac: 0.11, rotY: -0.3, pivot: "outer", noPanel: true }
        ]
      };
    }
  };
}

// ---- TWO-DEVICE LINK (Đợt 368, thầy 22/9/2026) ----------------------------
// "Máy chơi" keeps the race + both answer boards; an iPad ("máy nguồn") shows
// the questions. See rr-link.js for the wire itself and why it is one-way.
//
// ⚠️ BOARD 0 OWNS THE LINK. A match is TWO mounts in ONE page, and both call
// showQuestion() for the same round — two independent writers of one Firestore
// document is exactly what the core rule says needs a transaction. So board 1
// only drops its question text into the module slot below and board 0 does all
// the writing, one packet per round, after a short coalesce window that lets
// BOTH boards land first (advanceRound loops the boards synchronously, so the
// two calls are the same tick apart — 80 ms is many times over).
// ⭐ Đợt 370 (thầy, 22/9/2026) — "phần text ở trên ipad được chuyển thành TỪ,
// chỉ cần từ thôi": the second screen shows the ANSWER WORD, not the clue.
// ⚠️ That means the iPad is showing the answer, which thầy chose knowingly after
// being told — so it is a screen for reading the word aloud, NOT something to
// point at the class while they are still choosing.
const rrLinkWord = ["", ""];        // the correct answer's text, per side
const rrLinkVoiceOnly = [false, false];   // no usable text at all (word missing)
// Đợt 368d — each side's OWN question number / total (In turns can deal 41 vs 40,
// so a single shared count was never quite honest). 0 = that board has not
// reported yet, and the screen shows nothing rather than "1 / 0".
const rrLinkNum = [0, 0];
const rrLinkTotal = [0, 0];
let rrLinkOwner = null;             // board 0's controller while the link is on

function rrLinkStart(meta) {
  rrLinkStop();                      // a rebuilt match (Start again / Apply) starts a new one
  const own = {
    matchId: mintMatchId(),
    meta,                            // { actTitle, teams:[{name,color},…] }
    round: 0, same: true, goAt: 0, over: false,
    viewerAt: 0, alive: false,
    writeTimer: null, poll: null, unsub: null,
    onAlive: null                    // set by the mount: repaint when the iPad comes/goes
  };
  own.unsub = subscribeViewer(at => {
    if (rrLinkOwner !== own) return;
    own.viewerAt = at;
    rrLinkSyncAlive(own);
  });
  // The beat can only go STALE with time passing, never with an event, so it
  // needs its own slow clock. 5 s is far finer than VIEWER_STALE_MS needs.
  own.poll = setInterval(() => { if (rrLinkOwner === own) rrLinkSyncAlive(own); }, 5000);
  rrLinkOwner = own;
  return own;
}

function rrLinkSyncAlive(own) {
  const alive = own.viewerAt > 0 && (Date.now() - own.viewerAt) < VIEWER_STALE_MS;
  if (alive === own.alive) return;
  own.alive = alive;
  if (own.onAlive) { try { own.onAlive(alive); } catch { /* mount gone */ } }
}

// Coalesce: both boards report in the same tick, one packet goes out.
function rrLinkQueueWrite(own) {
  if (!own || own.over) return;
  if (own.writeTimer) return;
  own.writeTimer = setTimeout(() => {
    own.writeTimer = null;
    if (rrLinkOwner !== own || own.over) return;
    const t = own.meta.teams || [];
    publishStage({
      matchId: own.matchId, actTitle: own.meta.actTitle || "", phase: "playing",
      round: own.round, same: rrLinkWord[0] === rrLinkWord[1],
      clockMs: own.goAt ? Date.now() - own.goAt : 0,
      q0: rrLinkWord[0], q1: rrLinkWord[1],
      vo0: rrLinkVoiceOnly[0], vo1: rrLinkVoiceOnly[1],
      qn0: rrLinkNum[0], qt0: rrLinkTotal[0],
      qn1: rrLinkNum[1], qt1: rrLinkTotal[1],
      t0name: t[0]?.name || "TEAM 1", t0color: t[0]?.color || "",
      t1name: t[1]?.name || "TEAM 2", t1color: t[1]?.color || ""
    }).catch(() => { /* offline / signed out — the guard puts the question back */ });
  }, 80);
}

function rrLinkStop() {
  const own = rrLinkOwner;
  if (!own) return;
  rrLinkOwner = null;
  own.over = true;
  if (own.writeTimer) { clearTimeout(own.writeTimer); own.writeTimer = null; }
  if (own.poll) { clearInterval(own.poll); own.poll = null; }
  if (own.unsub) { try { own.unsub(); } catch { /* already gone */ } }
  rrLinkWord[0] = rrLinkWord[1] = "";
  rrLinkVoiceOnly[0] = rrLinkVoiceOnly[1] = false;
  rrLinkNum[0] = rrLinkNum[1] = 0;
  rrLinkTotal[0] = rrLinkTotal[1] = 0;
  // Drop the document so an iPad opened tomorrow never reads today's match.
  clearStage().catch(() => { /* offline — it carries `matchId`, so it is ignorable anyway */ });
}

const rocketRaceTemplate = {
  type: "rocket_race",
  scorable: true,
  name: "Rocket race",
  // "Start with mistakes": which array in activity.content holds the items.
  itemsKey: "questions",
  // Hearts in the top bar, left of the score (same slot as Quiz / True-false).
  hasLivesSlot: true,
  // The clock waits for the 3-2-1 — the template calls ui.startTimer() at GO.
  manualTimerStart: true,
  // The two shared switches this game genuinely obeys (Đợt 143: declare, don't assume).
  usesShuffleAnswers: true,
  // Thứ tự ô tích theo CỘT (Đợt 213b) — mã định danh, không phải chữ hiện ra.
  checkOrder: ["shuffle", "shuffleAnswers", "showAnswers"],
  // Planets are dropped in by JS (not CSS) so the engine's CSS scan can't see them.
  preloadImages: ["bigplanet.webp", "greenplanet.webp", "sun.webp"].map(imgUrl),
  // FIGHT (Đợt 351): the MODE button offers a match; core/fight.js builds the
  // frame with a shared area on top (`fightLayout`) that this module draws the
  // race into. See the `_fight` branches in mount().
  fightMode: true,
  fightByDefault: true,   // Đợt 394 (thầy): chọn/mở Rocket race ⇒ vào thẳng Fight (core/engine.js)
  // ⭐ Đợt 370 — "this template can put its questions on a SECOND SCREEN". Two
  // things read it: core/engine.js draws the Question screen button on the match
  // toolbar, and core/fight.js uses `options.fightScreen` as one of the two gates
  // for independent boards (see `soloBoards` there). Opt-in exactly like
  // `fightTurns`/`fightPick`, so no other template changes behaviour.
  fightScreen: true,
  fightLayout: "shared-top",
  // ⭐ Đợt 353 (thầy chốt 20/9/2026) — the match picture is 32:14, not 32:21:
  //   sharedH 7 → the race strip is 32:7 (2 lanes need no more; the old 32:10.5
  //                was two-thirds empty sky and height-capped the whole match in
  //                fullscreen — 1432px wide with black bars on a 1920 screen);
  //   boardH 7  → each question board is 16:7 (two-thirds of the normal frame:
  //                chip · question · ONE row of tiles · Time delay bar);
  //   boardTools "shared" → ☰ / ‹ › / 🔊 live on the shared toolbar next to
  //                Options / Mode instead of a bottom row inside each board
  //                (which this template's full-frame stage covered anyway).
  // Read by core/fight.js; every number falls back to the Đợt 351 frame.
  //   noScore → the strip's two big numbers are hidden (Đợt 354, thầy: "không tính
  //                điểm nữa vì đã tính vị trí của tàu rồi"); the referee still counts
  //                points underneath (winner, end panel), the rockets show them.
  //   Đợt 355 (thầy, 20/9/2026 tối): shared = ONE question line (4u) + a shorter race
  //   (no minimap) = 32:5.75; boards 16:5 hold only the tiles + the team chip; the
  //   score/clock strip goes below the boards and the clock into the toolbar.
  //   Đợt 356: the READY cover no longer fits a 16:5 board — act info goes to the
  //   shared area, each board keeps icon + team name + Play (core draws it).
  // ⭐⭐ Đợt 392 — FIGHT 3D: `fullscene` ⇒ vùng chung là CẢ khung (cao = nửa bề rộng, sharedH 16 / 32,
  // hoặc chiều cao màn trừ dải nút), hai bàn ẩn; core gọi `fightScene` (dưới) để dựng cảnh WebGL.
  // `skin: "rr3d"` ⇒ hàng nút trận theo style game (rocket-race.css). readyShared tắt: màn mở đầu +
  // nút START nằm TRONG cảnh 3D. WebGL hỏng ⇒ rr3dFallback() gỡ `is-fullscene` và vẽ lại 2D như cũ.
  fightFrame: {
    sharedH: 16, boardH: 5, boardTools: "shared", noScore: true, topStrip: "below",
    fullscene: true, skin: "rr3d"
  },
  fightScene(opts) { return rr3dScene(opts); },

  edit: openRocketRaceEditor,

  sounds: {
    play: () => {},          // the 3-2-1 has its own sound; a jingle here would collide
    restart: () => {}
    // no `complete` → engine's own fanfare plays over the end panel
  },

  toPrintItems(activity) {
    return (activity.content?.questions || [])
      .filter(q => q && Array.isArray(q.answers) && q.answers.length)
      .map(q => ({
        clue: q.question || "",
        answer: (q.answers.find(a => a.correct) || q.answers[0] || {}).text || "",
        options: q.answers.filter(a => a && a.text != null).map(a => ({ text: a.text, correct: !!a.correct }))
      }));
  },

  // Options panel extras (engine calls this — CONG THUC MAU §5).
  // ⚠️ `inFight` (Đợt 259b): inside a match every control below is overridden
  // by the referee (no rivals, no teams, no lives, the match's own Time delay in
  // place of Question time, no crates) — so the cells are simply not built,
  // which is the rule against dead switches. `draft` is left untouched.
  buildExtraOptions({ panel, draft, mkCell, mkSeg, mkSliderCell, addCheck, inFight }) {
    const cur = Number.isInteger(draft.lives) ? Math.min(MAX_LIVES, Math.max(0, draft.lives)) : 0;
    const lives = mkSliderCell({
      label: "Lives", min: 0, max: MAX_LIVES, step: 1, value: cur, tone: "green", offAt: 0,
      fmt: v => (v === 0 ? "∞" : String(v)),
      onInput: v => { draft.lives = v; }        // 0 stored = unlimited
    });
    lives.cell.title = "0 = unlimited lives";
    // Đợt 354 — a match keeps ONLY Lives (thầy: each lost life wrecks the rocket a
    // little, the last one blows it up); rivals/teams/question time stay solo-only.
    // ⛔ Đợt 370 — the QUESTION SCREEN switch is NOT in this panel any more. It
    // was a tick-box (368), then a full-width cell (368c), and thầy still had to
    // go looking for it. It is now its OWN button on the toolbar row between
    // Options and Mode (declared by `fightScreen` below, drawn by core/engine.js),
    // where a lit button says "on" without anyone opening a panel at all.
    if (inFight) { panel.append(lives.cell); return; }

    const mode = mkCell({ label: "Mode" });
    mode.ctl.append(mkSeg(
      [{ value: "solo", label: "Solo", title: "One player races the computer rockets" },
       { value: "teams", label: "Teams", title: "The rockets are teams of the class (teacher's screen)" }],
      draft.rrMode === "teams" ? "teams" : "solo",
      v => { draft.rrMode = v; }));

    const speed = mkCell({ label: "Rival speed" });
    speed.ctl.append(mkSeg(
      [{ value: "slow", label: "Slow" }, { value: "normal", label: "Normal" }, { value: "fast", label: "Fast" }],
      RIVAL_SECS[draft.rrSpeed] ? draft.rrSpeed : "normal",
      v => { draft.rrSpeed = v; }));

    panel.append(
      lives.cell,
      mode.cell,
      mkSliderCell({
        label: "Rivals", sub: "solo", min: 3, max: 5, step: 1,
        value: clampInt(draft.rrRivals, 3, 5, 4), tone: "blue",
        onInput: v => { draft.rrRivals = v; }
      }).cell,
      mkSliderCell({
        label: "Teams", sub: "teams mode", min: 2, max: MAX_ROCKETS, step: 1,
        value: clampInt(draft.rrTeams, 2, MAX_ROCKETS, 2), tone: "blue",
        onInput: v => { draft.rrTeams = v; }
      }).cell,
      speed.cell,
      mkSliderCell({
        label: "Question time", min: 0, max: 60, step: 1,
        value: clampInt(draft.rrQuestionSeconds, 0, 60, 0), tone: "amber", offAt: 0,
        fmt: v => (v === 0 ? "∞" : v + "s"),
        onInput: v => { draft.rrQuestionSeconds = v; }
      }).cell
    );

    addCheck("Power-ups", draft.rrPowerups !== false, v => draft.rrPowerups = v,
      { key: "rrPowerups", title: "Crates on the track: shield, turbo, meteor (solo mode)" });
  },

  mount(root, activity, ui) {
    const opt = activity.options || {};
    const pointsOff = Math.max(0, Math.min(100, Number(opt.pointsOff) || 0));

    // ----- FIGHT MODE — this play is one of two boards of a match. `_fight` is
    // put here by core/fight.js; everything below falls back to ordinary
    // single-board behaviour when it is absent (same pattern as Quiz).
    const fight = activity._fight || null;
    const fightSide = fight ? fight.side : 0;
    const fightCtl = fight ? fight.ctl : null;
    let fightBoardLock = false;            // set by the referee between rounds
    const fightLocked = () => fightBoardLock || !!(fightCtl && fightCtl.isLocked(fightSide));
    let fightPendingReveal = false;        // answered, ✓/✗ withheld until the round settles
    const speaks = () => !fightCtl || fightCtl.speaks(fightSide);   // banners / shared sounds: board 0 only

    let items = (activity.content?.questions || [])
      .filter(q => q && Array.isArray(q.answers) && q.answers.some(a => a && a.correct) && q.answers.length >= 2);
    // ⚠️ In a match the referee owns the order (both boards must hold the same
    // question at the same index) — the match act already has shuffle forced off.
    if (opt.shuffleQuestions && !fightCtl) items = shuffle(items);
    const N = items.length;

    // Teacher vs pupil device: the engine strips its toolbar under the frame in
    // student mode (same signal Running team relies on). Teams mode is a
    // classroom thing — a homework link always races solo.
    const isTeacher = !!document.querySelector(".aw-below-right");
    const teamsMode = !fightCtl && opt.rrMode === "teams" && isTeacher;
    const rivalCount = clampInt(opt.rrRivals, 3, 5, 4);
    const teamCount = clampInt(opt.rrTeams, 2, MAX_ROCKETS, 2);
    const rivalSecs = RIVAL_SECS[opt.rrSpeed] || RIVAL_SECS.normal;
    const powerups = opt.rrPowerups !== false && !teamsMode && !fightCtl;
    const questionMs = fightCtl ? 0 : clampInt(opt.rrQuestionSeconds, 0, 60, 0) * 1000;   // 0 = untimed
    // ⭐ Đợt 368 — the questions live on a second device. A match only; see the
    // link manager above for why board 0 alone owns the writing.
    // Đợt 370 — the flag is now a CORE option (`fightScreen`), set by the toolbar
    // button, not a Rocket-race-only one. Read once per mount, which is why
    // flipping it restarts the match.
    const twoDevice = !!fightCtl && opt.fightScreen === true;

    // ---- scene ----
    root.innerHTML = "";
    const stage = el("div", "aw-rr-stage" + (teamsMode ? " is-teams" : "") + (fightCtl ? " is-fightboard" : ""));
    // The race scene: inside this stage, or — in a match — the ONE shared area.
    const scene = fightCtl ? ensureFightScene(fightCtl) : buildScene(stage);
    const sceneRoot = fightCtl ? (scene ? scene.host : stage) : stage;
    const panel = el("div", "aw-rr-panel");
    const turnChip = el("div", "aw-rr-turn");
    const qBox = el("div", "aw-rr-q");
    const qText = el("div", "aw-rr-qtext");
    qBox.append(qText);
    const qTimer = el("div", "aw-rr-qtimer");
    const qTimerBar = el("div", "aw-rr-qtimer-bar");
    qTimer.append(qTimerBar);
    const answersEl = el("div", "aw-rr-answers");
    // Đợt 355 — a FIGHT board is tiles first, the team chip UNDER them, and the
    // question is not in the board at all: it lives on the shared question line.
    if (fightCtl && scene && scene.qhalves) { panel.append(answersEl, turnChip); scene.qhalves[fightSide].replaceChildren(qBox); }
    else panel.append(turnChip, qBox, qTimer, answersEl);
    // ⭐ Đợt 353 — FIGHT: the referee's TIME DELAY bar moves INTO this panel.
    // This stage covers the whole frame (`inset:0`), so the engine's bottom row —
    // where that bar normally lives — was hidden under it and a match showed no
    // wait bar at all. The engine keeps driving the very same node; only its home
    // changes (`ui.hostFightWaitBar`, core/engine.js Đợt 353). The slot is built
    // even if the call is refused (older core) — an empty 1.2u strip costs nothing.
    if (fightCtl) {
      const waitSlot = el("div", "aw-rr-waitslot");
      panel.append(waitSlot);
      if (typeof ui.hostFightWaitBar === "function") ui.hostFightWaitBar(waitSlot);
    }
    stage.append(panel);
    root.append(stage);

    if (N === 0) {
      qText.textContent = "No questions yet.";
      return () => {};
    }

    // ---- state ----
    const state = items.map(() => ({ correct: false, wrong: [], attempts: 0, answeredWith: null }));
    let dead = false;                      // mount torn down (cleanup) — the only brake for bare callbacks
    let finished = false;                  // the race has ended (finish() ran)
    let running = false;                   // physics on (between GO and the finish)
    let locked = true;                     // tiles ignore taps (countdown / hold / stall)
    let penalty = 0;
    let streak = 0;
    let turnNo = 0;                        // questions asked so far (turns)
    let endTitle = null;
    let tickTimer = null, last = 0;
    const timers = new Set();
    const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); if (!dead) fn(); }, ms); timers.add(id); return id; };
    let livesLeft = normLives(opt.lives);   // Đợt 354: a match has lives too (rocket damage)
    const livesStart = livesLeft;
    let exploded = false;                   // fight: this team's rocket is gone — board is dead
    const tilePalette = shuffle(PALETTE);
    const voicePlayer = createVoicePlayer({
      // FIGHT voice contract: the speaking board mirrors its glow to the other one.
      onGlow(on) { if (fightCtl && fightCtl.speaks(fightSide)) fightCtl.reportVoiceState(fightSide, { playing: on }); }
    });
    let curVoiceBtn = null;
    let firstQuestionSpoken = false;
    let qDeadline = 0, qTickAt = 0;        // question clock (absolute deadline, shifted on pause)
    let turboUntil = 0;
    let shield = false;
    let crate = null;                      // { kind, el } — a power-up waiting in the player's lane
    let finishedCount = 0;                 // rockets over the line (rank = finishedCount + 1)
    let curItem = -1;                      // index into items of the question on screen
    let tiles = [];
    let started = false;                   // GO has happened (fight: questions may be shown)
    let fightIndex = 0;                    // fight: the index the referee last asked for

    // ---- rockets ----
    // Each rocket: { id, name, pilot, hull, p (segments), L (segments to finish),
    //   rate (segments/s, rivals only), el, tag, dot, done, place, stunUntil,
    //   queue (teams: item indices), pupils (teams: names), pupilPtr }
    let rockets = [];
    let player = null;                     // solo / fight: this board's rocket
    let queue = shuffle(items.map((_, i) => i));   // solo question order (wrong → back of the queue)
    let teamPtr = 0;                       // teams: whose turn
    // ⚠️ TDZ: declared HERE, above the first call into renderSetup() — a `let`
    // written next to the function that uses it is a ReferenceError at mount.
    let setupEl = null, classes = null, classError = "", pickedClassId = "";

    if (fightCtl) buildFight(); else if (teamsMode) buildTeams(); else buildSolo();
    // ⭐ Đợt 392 — trận 3D: bàn này nhận cú chạm ô từ cảnh 3D (raycast) qua đúng choose() cũ
    const on3d = !!(fightCtl && rr3d && rr3d.ctl === fightCtl);
    if (on3d) {
      rr3d.boards[fightSide] = { choose: k => choose(k), stopClock: () => ui.stopTimer?.() };
      rr3d.trackLen = scene ? scene.L : fightTrackLength(N);
      rr3d.twoDevice = twoDevice;
      rr3d.prog[fightSide] = { done: 0, total: N };
      v3(v => { v.setTrack(scene ? scene.L : fightTrackLength(N)); v.setLivesMax(livesStart || 0); });
    }
    if (!fightCtl) renderRockets();
    // ⭐ Đợt 368 — board 0 opens the link for the whole match. Board 1 mounts
    // later and only feeds its own question text into the module slot.
    // ⚠️ `paintLink(false)` runs FIRST and on purpose: until an iPad actually
    // checks in, this screen keeps showing the question exactly as it does
    // today. Hiding it on hope would leave the class with the question on NO
    // screen (see rr-link.js, the "cả lớp đứng hình" guard).
    if (twoDevice && fightSide === 0) {
      const own = rrLinkStart({
        actTitle: activity.title || "",
        teams: FIGHT_TEAMS.map(t => ({ name: t.name, color: t.hull.c }))
      });
      own.onAlive = paintLink;
    }
    if (twoDevice) paintLink(false);
    renderLives();
    ui.setScore(0);
    ui.onSubmit(finish, () => state.filter(s => s.attempts > 0).length);
    window.addEventListener("keydown", onKey);

    // ----- Menu pause (Đợt 91) — delta loop: stop / start again is enough,
    // but the question clock is an absolute deadline, so shift it.
    let pausedAt = 0, wasRunning = false;
    function pauseGame() {
      wasRunning = !!tickTimer;
      if (tickTimer) { clearInterval(tickTimer); tickTimer = null; }
      pausedAt = performance.now();
      if (speaks()) rrSound.music.stop();
    }
    function resumeGame() {
      if (finished || dead) return;
      if (pausedAt) {
        const gap = performance.now() - pausedAt;
        if (qDeadline) qDeadline += gap;
        if (turboUntil) turboUntil += gap;
        rockets.forEach(r => { if (r.stunUntil) r.stunUntil += gap; });
        pausedAt = 0;
      }
      if (wasRunning) { last = performance.now(); tickTimer = setInterval(tick, TICK_MS); if (running && speaks()) rrSound.music.start(); }
      wasRunning = false;
    }
    const pauseHandler = { pause: pauseGame, resume: resumeGame };
    rrPauseHandlers.add(pauseHandler);

    // ----- FIGHT: the referee drives this board through here (registered after
    // the functions it calls exist; board 1 mounts later and is moved at once).
    if (fightCtl) {
      fightCtl.attach(fightSide, {
        total: N,
        goToIndex(i, info) {
          fightIndex = i;
          // Đợt 382 — a sudden-death question was played before: clear the
          // "answered" mark or the new tiles would come up as already done.
          if (info && info.replay && state[i]) { state[i].attempts = 0; state[i].answeredWith = null; }
          fightRepaint(false);
          if (started) showQuestion(i);
        },
        // Đợt 382 — the questions ran out (or a sudden-death round settled):
        // the rockets decide, not the points. See settleByPosition.
        roundsOver(side) { return settleByPosition(side); },
        // Đợt 391 — Different: a team out of questions with nobody over the line
        // plays its old questions again (reshuffled) — the race ends only at the
        // flag, or when a Count down runs out (then the closer rocket flies home).
        recycleWhenOut: true,
        // …and the result panel prints how far each rocket got, not points.
        resultScore() { return player ? Math.min(player.p, player.L) : 0; },
        lock(on) { fightBoardLock = !!on; syncFightLock(); },
        reveal: revealFightMarks,
        review: buildReview,
        toggleVoiceRemote(clipId) {
          if (!fightCtl.speaks(fightSide)) return;
          voicePlayer.toggle(clipId, curVoiceBtn);
        },
        syncVoice(st) {
          if (!st || st.playing === undefined) return;
          curVoiceBtn?.classList.toggle("is-playing", !!st.playing);
        }
      });
    }

    if (teamsMode) renderSetup(); else startCountdown();

    // =========================================================
    // building the grid of rockets
    // =========================================================
    function mkRocket(i, name, pilot, hull, isPlayer) {
      return { id: i, name, pilot, hull, isPlayer, p: 0, L: N, rate: 0, el: null, tag: null, dot: null,
               done: false, place: 0, stunUntil: 0, queue: [], pupils: [], pupilPtr: 0, wobble: Math.random() * 6.28 };
    }
    function buildSolo() {
      const names = shuffle(RIVAL_NAMES).slice(0, rivalCount);
      const pilots = shuffle(PILOTS);
      rockets = [];
      for (let i = 0; i < rivalCount; i++) {
        const r = mkRocket(i + 1, names[i], pilots[i], HULLS[(i + 1) % HULLS.length], false);
        // personalities: spread 0.86 … 1.14 so one rival is quick and one is lazy
        const spread = rivalCount > 1 ? (i / (rivalCount - 1)) * 0.28 - 0.14 : 0;
        r.rate = (1 / rivalSecs) * (1 + spread);
        rockets.push(r);
      }
      player = mkRocket(0, "YOU", "😎", HULLS[0], true);
      rockets = shuffle(rockets);
      // the player rides the middle lane
      rockets.splice(Math.floor(rockets.length / 2), 0, player);
    }
    function buildTeams() {
      rockets = [];
      const pilots = shuffle(PILOTS);
      for (let i = 0; i < teamCount; i++) {
        const r = mkRocket(i, "Team " + (i + 1), pilots[i], HULLS[i % HULLS.length], false);
        rockets.push(r);
      }
      dealTeams();
    }
    // FIGHT: this board's rocket is the one the shared scene already holds for
    // its side; the other team's rocket is that board's business.
    function buildFight() {
      rockets = scene ? scene.rockets : FIGHT_TEAMS.map((t, i) => mkRocket(i, t.name, t.pilot, t.hull, false));
      player = rockets[fightSide];
      player.p = 0; player.L = N; player.done = false; player.place = 0;
      // Đợt 382 — one fixed track for the match. The two boards can hold a
      // different count (In turns deals 81 as 41/40), so the longer one wins.
      if (scene) scene.L = Math.max(scene.L || 0, fightTrackLength(N));
      fightRepaint(false);
      const t = FIGHT_TEAMS[fightSide];
      turnChip.textContent = "";
      const b = el("span", "aw-rr-turnbadge", t.pilot);
      b.style.setProperty("--rc", t.hull.c);
      turnChip.append(b, document.createTextNode(t.name));
      turnChip.classList.add("is-on");
      stage.style.setProperty("--rc", t.hull.c);
      renderChipLives();   // Đợt 354
    }
    // ⭐ Đợt 368 — the second screen came or went. `is-remote` hides the shared
    // question line here; `is-noq` lets the race take the room it leaves behind
    // (rocket-race.css). Called with `false` at mount, then by the link's own
    // beat watcher, so the question line is only ever hidden while an iPad is
    // provably showing it.
    function paintLink(alive) {
      if (dead || !scene) return;
      // ⭐ Đợt 393 (thầy): "trong mọi tình huống, bật ipad thì sẽ không hiển thị text trên màn hình nữa
      // mà chỉ hiện ở ipad … ẩn luôn khung hiển thị text". Thầy chọn điều này — kể cả khi iPad chưa
      // báo có mặt (thay luật "chỉ ẩn khi iPad chắc chắn đang hiện" của Đợt 368).
      if (twoDevice) alive = true;
      if (scene.qbar) scene.qbar.classList.toggle("is-remote", !!alive);
      if (on3d) v3(v => v.setQuestionHidden(!!alive));
      if (scene.host) scene.host.classList.toggle("is-noq", !!alive);
    }
    // Hand this board's WORD to the link. Both boards call it; only board 0
    // actually writes (rrLinkQueueWrite coalesces the two into one packet).
    function reportLink(idx, q) {
      if (!twoDevice || !rrLinkOwner) return;
      // Đợt 370 — the WORD (the correct answer), not the clue. A voice-only act
      // still has a written answer, so `hideText` no longer matters here; the
      // only fallback left is an act whose right answer carries no text at all.
      const right = (q.answers || []).find(a => a && a.correct);
      const word = (right && right.text) || "";
      rrLinkWord[fightSide] = word;
      rrLinkVoiceOnly[fightSide] = !word;
      // This board's OWN place in its OWN pile (Đợt 368d) — `N` is this board's
      // question count, which In turns can make differ from the other board's.
      rrLinkNum[fightSide] = Math.min(idx + 1, N);
      rrLinkTotal[fightSide] = N;
      rrLinkOwner.round = idx;
      rrLinkQueueWrite(rrLinkOwner);
    }

    // Deal the (already shuffled) questions round-robin — every team gets the
    // same number ±1, and a team's track is exactly as long as its hand.
    function dealTeams() {
      rockets.forEach(r => { r.queue = []; });
      items.forEach((_, i) => rockets[i % rockets.length].queue.push(i));
      rockets.forEach(r => { r.L = Math.max(1, r.queue.length); });
    }

    function renderRockets() {
      scene.lanesEl.innerHTML = ""; scene.minimap.innerHTML = "";
      scene.track.style.setProperty("--lanes", rockets.length);   // Đợt 368e — see ensureFightScene
      rockets.forEach((r, laneIdx) => buildRocketEl(scene, r, laneIdx, rockets.length));
      const flag = el("div", "aw-rr-dot is-flag", "🏁");
      flag.style.setProperty("--x", TRACK_END);
      scene.minimap.append(flag);
    }
    function xOf(r) { return TRACK_START + (Math.min(r.p, r.L) / r.L) * (TRACK_END - TRACK_START); }
    function paintRocket(r) {
      if (!r.el) return;
      const x = xOf(r).toFixed(2);
      r.el.style.setProperty("--x", x);
      r.dot.style.setProperty("--x", x);
    }

    // =========================================================
    // TEAMS — setup screen (names, optional class) then START
    // =========================================================
    function renderSetup() {
      if (setupEl) setupEl.remove();
      setupEl = el("div", "aw-rr-setup");
      setupEl.append(el("div", "aw-rr-setup-title", "TEAMS"));
      const list = el("div", "aw-rr-teamlist");
      rockets.forEach((r, i) => {
        const row = el("div", "aw-rr-teamrow");
        row.style.setProperty("--rc", r.hull.c);
        row.style.setProperty("--rd", r.hull.d);
        const badge = el("div", "aw-rr-teambadge", r.pilot);
        const name = el("input", "aw-rr-teamname");
        name.type = "text"; name.maxLength = 18; name.value = r.name; name.spellcheck = false;
        name.setAttribute("aria-label", "Team " + (i + 1) + " name");
        name.oninput = () => { r.name = name.value.trim() || ("Team " + (i + 1)); r.tag.textContent = r.name; };
        row.append(badge, name);
        if (r.pupils.length) {
          const chips = el("div", "aw-rr-pupils");
          r.pupils.forEach(p => chips.append(el("span", "aw-rr-pupil", escapeHtml(p))));
          row.append(chips);
        }
        row.append(el("div", "aw-rr-teamq", r.queue.length + " questions"));
        list.append(row);
      });
      setupEl.append(list);

      // class picker (teacher only — this screen only exists on the teacher's side)
      const cls = el("div", "aw-rr-classrow");
      cls.append(el("span", "aw-rr-classlab", "CLASS"));
      const sel = el("select", "aw-rr-classsel");
      if (classes === null) { const o = el("option", null, "Loading…"); o.value = ""; sel.append(o); sel.disabled = true; loadClasses(); }
      else if (!classes.length) { const o = el("option", null, classError || "No classes — add one in Settings"); o.value = ""; sel.append(o); sel.disabled = true; }
      else {
        const blank = el("option", null, "— no class: teams only —"); blank.value = ""; sel.append(blank);
        classes.forEach(c => { const o = el("option", null, escapeHtml(c.name)); o.value = c.id; if (c.id === pickedClassId) o.selected = true; sel.append(o); });
      }
      sel.onchange = () => {
        pickedClassId = sel.value;
        const c = (classes || []).find(x => x.id === pickedClassId);
        const names = c ? shuffle(c.students.map(s => s.name).filter(Boolean)) : [];
        rockets.forEach(r => { r.pupils = []; r.pupilPtr = 0; });
        names.forEach((n, i) => rockets[i % rockets.length].pupils.push(n));
        renderSetup();
      };
      cls.append(sel);
      setupEl.append(cls);

      const start = el("button", "aw-rr-start", "START RACE");
      start.type = "button";
      press(start, () => { setupEl.remove(); setupEl = null; startCountdown(); });
      setupEl.append(start);
      stage.append(setupEl);
    }
    // Classes live behind the teacher's sign-in; dynamic import on purpose so
    // the student page never pulls the library layer in (core rule).
    async function loadClasses() {
      try {
        const { listClasses } = await import("../../core/classes.js");
        const list = await listClasses();
        if (dead) return;
        classes = list;
      } catch (e) {
        if (dead) return;
        classes = [];
        classError = e?.code === "aw/signed-out" ? "Sign in to use your classes" : "Could not load your classes";
      }
      if (setupEl) renderSetup();
    }

    // =========================================================
    // 3 · 2 · 1 · GO
    // =========================================================
    function startCountdown() {
      locked = true;
      let n = 3;
      // ⭐ Đợt 398: trận 3D vào từ CẢNH PHÓNG — 3-2-1 đã đếm lúc tàu trên bệ, play() được gọi đúng lúc nhảy tốc độ xong
      // ⇒ vào THẲNG GO (đồng hồ trận + câu hỏi bắt đầu ngay khi cảnh đua hiện ra), không đếm lại.
      const fromLaunch = on3d && rr3d && rr3d.skipCount;
      if (fromLaunch) n = 0;
      const step = () => {
        if (n > 0) {
          if (speaks()) { showBanner(String(n), "is-count"); rrSound.count(n); if (on3d) { const lab = String(n); v3(v => v.countStep(lab)); } }
          n--;
          later(step, 800);
        } else {
          if (speaks()) {
            if (fromLaunch) { rrSound.music.start(); v3(v => v.go()); }
            else { showBanner("GO!", "is-go"); rrSound.go(); rrSound.music.start(); if (on3d) v3(v => { v.countStep("GO!"); v.go(); }); }
          }
          ui.startTimer?.();
          // Đợt 368 — the match clock's zero. The packet carries "how long the
          // match has been running", and the iPad counts on from it by itself:
          // no per-second writes, and no dependence on the two devices' clocks
          // agreeing (only on the elapsed time, which both measure the same).
          if (twoDevice && fightSide === 0 && rrLinkOwner) rrLinkOwner.goAt = Date.now();
          running = true;
          started = true;
          last = performance.now();
          tickTimer = setInterval(tick, TICK_MS);
          rockets.forEach(r => r.el && r.el.classList.add("is-flying"));
          later(() => { if (fightCtl) showQuestion(fightIndex); else nextQuestion(); }, fromLaunch ? 0 : 500);
        }
      };
      if (fromLaunch) step(); else later(step, 300);
    }

    function showBanner(text, cls, ms = 700) {
      if (on3d) {
        if (/is-count|is-go|is-turbo/.test(cls || "") && !/SUDDEN/.test(text)) return;   // 3-2-1 & TURBO có đường riêng
        if (/WINS!/.test(text)) return;                                                 // cảnh kết trận tự ghi
        const kind = /is-stall/.test(cls || "") ? "red" : /is-win/.test(cls || "") ? "gold" : "cyan";
        v3(v => v.banner(text, kind, Math.max(ms, 1200), 0.34, 0.9));
        return;
      }
      if (!scene) return;
      const b = el("div", "aw-rr-bannertxt " + (cls || ""), "");
      b.textContent = text;
      scene.banner.innerHTML = "";
      scene.banner.append(b);
      later(() => { if (b.parentNode) b.remove(); }, ms);
    }

    // =========================================================
    // questions
    // =========================================================
    function currentTeam() { return teamsMode ? rockets[teamPtr] : null; }

    function nextQuestion() {
      if (finished || dead) return;
      if (teamsMode) {
        // skip teams whose hand is empty; none left → the race is over
        let tries = 0;
        while (tries < rockets.length && !rockets[teamPtr].queue.length) { teamPtr = (teamPtr + 1) % rockets.length; tries++; }
        if (!rockets[teamPtr].queue.length) { endTeams(); return; }
        showQuestion(rockets[teamPtr].queue[0]);
      } else {
        if (!queue.length) { finish(); return; }
        showQuestion(queue[0]);
      }
    }

    // Put question `idx` on the panel. Solo/Teams reach it through
    // nextQuestion(); a match reaches it through the referee's goToIndex.
    function showQuestion(idx) {
      if (finished || dead) return;
      curItem = idx;
      turnNo++;
      const q = items[curItem];
      if (!fightCtl) paintTurnChip();
      rockets.forEach(r => r.el && r.el.classList.toggle("is-turn", teamsMode && r === currentTeam()));

      // question text (+ optional voice)
      voicePlayer.stop();
      curVoiceBtn = null;
      qBox.innerHTML = ""; qBox.className = "aw-rr-q";
      const vv = voiceView(activity, q);
      const t = el("div", "aw-rr-qtext", "");
      if (vv.hideText) qBox.classList.add("aw-clue-voiceonly"); else t.textContent = q.question || "";
      qBox.append(t);
      if (vv.hasVoice) {
        const vBtn = el("button", "aw-voicebtn" + (vv.hideText ? " aw-voicebtn-lg" : ""), icons.soundOn);
        vBtn.type = "button"; vBtn.setAttribute("aria-label", "Listen");
        curVoiceBtn = vBtn;
        press(vBtn, e => {
          e.stopPropagation();
          // FIGHT: only board 0 owns real playback; the other board asks the referee.
          if (fightCtl && !fightCtl.speaks(fightSide)) { fightCtl.requestVoiceToggle(q.voice); return; }
          voicePlayer.toggle(q.voice, vBtn);
        });
        t.append(vBtn);
        if (vv.autoPlay && speaks()) voicePlayer.playDelayed(q.voice, vBtn, firstQuestionSpoken ? 0 : DEFAULT_INTRO_DELAY_MS);
        else if (fightCtl) { const st = fightCtl.voiceState && fightCtl.voiceState(); if (st && st.playing) vBtn.classList.add("is-playing"); }
      }
      firstQuestionSpoken = true;
      fitText(qBox, t);
      if (fightCtl) syncQbar(scene);
      reportLink(idx, q);   // Đợt 368/370 — send this board's WORD to the second screen

      // answer tiles
      const answers = (opt.shuffleAnswers ? shuffle(q.answers) : [...q.answers]).filter(a => a && a.text != null);
      answersEl.innerHTML = "";
      answersEl.classList.remove("is-fightlost");
      fightPendingReveal = false;
      // Đợt 353 — a 16:7 FIGHT board is too short for a 2×2 block: up to four
      // answers sit in ONE row (thầy: "các ô câu trả lời có thể xếp theo 1 hàng 4
      // ô"), five or six fall back to rows of three. Solo / Teams keep 2×2.
      answersEl.style.setProperty("--per-row",
        answers.length <= 3 ? answers.length
        : answers.length === 4 ? (fightCtl ? 4 : 2)
        : 3);
      tiles = answers.map((a, i) => {
        const tile = el("button", "aw-rr-tile");
        tile.type = "button";
        const pal = tilePalette[i % tilePalette.length];
        tile.style.setProperty("--tile", pal.c);
        tile.style.setProperty("--tile-dark", pal.d);
        const txt = el("span", "aw-rr-tiletext", "");
        txt.textContent = a.text;
        tile.append(txt);
        press(tile, () => choose(i));
        answersEl.append(tile);
        tile.animate([{ opacity: 0, transform: "translateY(12%)" }, { opacity: 1, transform: "none" }],
          { duration: 260, delay: 50 * i, easing: "cubic-bezier(.22,.9,.3,1)", fill: "backwards" });
        return { tile, txt, ans: a };
      });
      tiles.forEach(t2 => fitLabelWidth(t2.txt));
      if (on3d) {
        rr3d.q[fightSide] = vv.hideText ? "🔊" : (q.question || "");
        const qs = rr3d.q.slice(), side = fightSide, texts = answers.map(a => String(a.text));
        v3(v => { v.setQuestion(qs[0], qs[1]); v.setAnswers(side, texts); });
      }

      // question clock
      if (questionMs > 0) {
        qDeadline = performance.now() + questionMs;
        qTickAt = Math.ceil(questionMs / 1000);
        qTimer.classList.add("is-on");
        qTimerBar.style.transform = "scaleX(1)";
        qTimerBar.classList.remove("is-low");
      } else { qDeadline = 0; qTimer.classList.remove("is-on"); }

      const mover = teamsMode ? currentTeam() : player;
      // Đợt 392: hàng nút game = "câu / tổng" → ⭐ Đợt 393 (thầy): "% câu hỏi tổng thể mà 2 bên đã vượt
      // qua (để biết sắp hết chặng chưa)" — số câu ĐÃ QUA của cả hai bàn ÷ tổng câu của cả hai bàn.
      if (on3d) rr3d.prog[fightSide] = { done: Math.min(N, Math.max(rr3d.prog[fightSide].done, turnNo - 1)), total: N };
      ui.setNav({ index: fightCtl ? idx + 1 : Math.min(mover.p + 1, mover.L), total: fightCtl ? N : mover.L,
                  label: on3d ? rr3dProgressLabel() : null });
      if (on3d) rr3dPaintProgress();
      // ⭐ Đợt 370 — the new question's tiles are DEAD for a moment. Without this
      // the second tap of a double-tap answers a question nobody has read: the
      // tiles are rebuilt under the finger in the same spot. Re-check `curItem`
      // on the way out — a nav jump or a new round may have moved on already.
      locked = true;
      if (fightCtl) syncFightLock();
      later(() => {
        if (dead || finished || curItem !== idx) return;
        locked = false;
        if (fightCtl) syncFightLock();
      }, TAP_GUARD_MS);
    }

    function paintTurnChip() {
      if (!teamsMode) { turnChip.textContent = ""; turnChip.classList.remove("is-on"); return; }
      const r = currentTeam();
      let who = r.name;
      if (r.pupils.length) { who += " · " + r.pupils[r.pupilPtr % r.pupils.length]; }
      turnChip.textContent = "";
      const b = el("span", "aw-rr-turnbadge", r.pilot);
      b.style.setProperty("--rc", r.hull.c);
      turnChip.append(b, document.createTextNode(who));
      turnChip.classList.add("is-on");
    }

    // ----- FIGHT: lock / reveal bookkeeping (mirrors Quiz) -----
    function currentAnswered() { return curItem >= 0 && state[curItem].attempts > 0; }
    function syncFightLock() {
      if (!fightCtl) return;
      const l = fightLocked();
      const answered = currentAnswered();
      if (!answered) tiles.forEach(t => { t.tile.disabled = l || locked; });
      // grey while this board's go is over but its result is withheld (or it
      // never got to play — "too slow")
      answersEl.classList.toggle("is-fightlost", l && (!answered || fightPendingReveal));
      paint3dTiles();
    }
    // ⭐ Đợt 392 — màu ô trong cảnh 3D (thầy, mẫu 2i): ô đúng được chọn chỉ XANH (không dấu tích);
    // đội kia thua lượt ⇒ cả bàn MẤT MÀU tới câu mới; chọn sai ⇒ ô đó đỏ ✗, còn lại mất màu.
    // KHÔNG bao giờ lộ ô đúng cho bàn không chọn được nó.
    function paint3dTiles() {
      if (!on3d || curItem < 0) return;
      const st = state[curItem];
      const pick = st && st.attempts > 0 ? st.chosenTile : -1;
      let arr;
      if (pick >= 0) arr = tiles.map((t, k) => k !== pick ? "dim" : fightPendingReveal ? "picked" : (t.ans.correct ? "correct" : "wrong"));
      else if (exploded || fightLocked()) arr = tiles.map(() => "dim");
      else arr = tiles.map(() => "idle");
      const side = fightSide;
      v3(v => v.tileStates(side, arr));
    }
    function addBadges(t, k, st) {
      // ⭐ Đợt 383 — BÀI GIAO (`opt.anDapAn`): em chọn SAI thì chỉ ✗ ô em chọn, mọi ô khác mờ như nhau — ô đúng
      // không lộ (câu sai còn được HỎI LẠI sau, lộ đáp án là cho không điểm lần sau).
      if (opt.anDapAn && !(st.chosenTile === k && t.ans.correct)) {
        if (k === st.chosenTile) t.tile.append(el("span", "aw-tile-badge", icons.markCross));
        t.tile.classList.add("is-dimmed");
        return;
      }
      if (t.ans.correct) t.tile.append(el("span", "aw-tile-badge", icons.markCheck));
      else {
        if (st.answeredWith === t.ans.text && k === st.chosenTile) t.tile.append(el("span", "aw-tile-badge", icons.markCross));
        t.tile.classList.add("is-dimmed");
      }
    }
    function revealFightMarks() {
      if (curItem < 0) return;
      const st = state[curItem];
      fightPendingReveal = false;
      tiles.forEach((t, k) => {
        if (t.tile.querySelector(".aw-tile-badge")) return;
        addBadges(t, k, st);
      });
      syncFightLock();
      paint3dTiles();
    }

    function choose(i) {
      if (locked || finished || dead || exploded || fightLocked()) return;
      const q = items[curItem];
      const st = state[curItem];
      const a = tiles[i].ans;
      locked = true;
      qDeadline = 0; qTimer.classList.remove("is-on");
      st.attempts++;
      st.answeredWith = a.text;
      st.chosenTile = i;
      ui.noteActivity?.();
      ui.roundDone?.();
      tiles.forEach(t => (t.tile.disabled = true));
      const tile = tiles[i].tile;
      if (on3d) { const side = fightSide; v3(v => v.pick(side, i)); }
      if (fightCtl) {
        // FIGHT: every visual that says WHICH answer was right is withheld until
        // the referee says the round is settled (the rocket moving says only
        // "we were right", like the sound does — not which tile).
        fightPendingReveal = true;
        syncFightLock();
      } else {
        const fly = el("span", "aw-mark-fly" + (a.correct ? "" : " is-cross"), a.correct ? icons.markCheck : icons.markCross);
        tile.append(fly);
        later(() => fly.remove(), a.correct ? 900 : 2000);
        tiles.forEach((t, k) => addBadges(t, k, st));
      }

      if (a.correct) onCorrect(q, st); else onWrong(q, st, tile);
      // report to the referee AFTER our own bookkeeping — `correct` decides the round
      if (fightCtl) fightCtl.wordDone(fightSide, { index: curItem, correct: !!a.correct });
    }

    function onTimeout() {
      if (locked || finished || dead) return;
      const q = items[curItem], st = state[curItem];
      locked = true;
      qDeadline = 0; qTimer.classList.remove("is-on");
      st.attempts++;
      st.answeredWith = "";
      ui.roundDone?.();
      // ⭐ Đợt 383 — bài giao: hết giờ thì chỉ khoá + mờ, KHÔNG đánh dấu ô đúng.
      tiles.forEach(t => { t.tile.disabled = true; if (t.ans.correct && !opt.anDapAn) t.tile.append(el("span", "aw-tile-badge", icons.markCheck)); else t.tile.classList.add("is-dimmed"); });
      showBanner("TIME'S UP", "is-stall", 900);
      onWrong(q, st, null);
    }

    function onCorrect(q, st) {
      st.correct = true;
      streak++;
      rrSound.correct();
      const mover = teamsMode ? currentTeam() : player;
      if (teamsMode) mover.queue.shift(); else if (!fightCtl) queue.shift();
      if (fightCtl) { mover.p += 1; fightRepaint(true); if (on3d) { const side = mover.id, p = mover.p; v3(v => v.move(side, p, "up")); } }
      else mover.p = Math.min(mover.L, mover.p + 1);
      fireRocket(mover);
      ui.setScore(scoreNow());
      if (fightCtl) {
        if (mover.done) return;   // Đợt 382 — over the line: raceWon owns the screen now
        // the referee turns the round over; turbo is the one flourish kept
        if (streak >= TURBO_STREAK && performance.now() >= turboUntil) { startTurbo("TURBO!"); if (on3d) { const side = fightSide; v3(v => v.turbo(side)); } }
        return;
      }
      if (teamsMode) {
        mover.pupilPtr++;
        teamPtr = (teamPtr + 1) % rockets.length;
        if (!running) return;   // every team is over the line — crossedLine → endTeams ran
        later(nextQuestion, ANSWER_HOLD_MS);
        return;
      }
      if (mover.done) return;   // crossed the line — fireRocket → crossedLine runs the ending; no turbo/crate after that
      // turbo streak
      if (streak >= TURBO_STREAK && performance.now() >= turboUntil) startTurbo("TURBO!");
      // crate: collected by this very answer if one was waiting, else maybe spawn one
      if (crate) collectCrate();
      else if (powerups && correctCount() >= 3 && (correctCount() - 3) % CRATE_EVERY === 0) spawnCrate();
      later(nextQuestion, ANSWER_HOLD_MS);
    }

    function onWrong(q, st, tileEl) {
      st.wrong.push(st.answeredWith || "");
      streak = 0;
      rrSound.wrong();
      const mover = teamsMode ? currentTeam() : player;
      if (teamsMode) { mover.queue.shift(); mover.pupilPtr++; teamPtr = (teamPtr + 1) % rockets.length; }
      else if (!fightCtl) { queue.push(queue.shift()); }      // ask it again later
      if (pointsOff && fightCtl) {
        // Đợt 354 — in a match the rocket IS the score: the penalty is applied at
        // once (no flight to a hidden number) and the rocket backs up N segments,
        // never past the start line. The referee's points may go negative; the
        // track cannot — the track is the class's reading, the points are the
        // referee's (winner, end panel). "−N" floats up from the rocket itself.
        penalty += pointsOff;
        ui.setScore(scoreNow());
        retreatRocket(mover, pointsOff);
        if (on3d) { const side = mover.id, p = mover.p, n = pointsOff; v3(v => v.move(side, p, "back", n)); }
      } else if (pointsOff) ui.flyPenalty?.(tileEl, pointsOff, () => { penalty += pointsOff; return scoreNow(); });

      if (shield && !teamsMode && !fightCtl) {
        shield = false;
        player.el.classList.remove("has-shield");
        rrSound.shield();
        showBanner("SHIELD!", "is-shield", 900);
        later(nextQuestion, ANSWER_HOLD_MS);
        return;
      }
      stallRocket(mover);
      if (on3d) { const side = mover.id; v3(v => v.stall(side)); }
      if (fightCtl) { fightRepaint(true); fightLoseLife(); return; }     // the referee decides what happens next
      if (loseLife()) return;   // game over ends everything
      later(nextQuestion, STALL_MS + 200);
    }

    function correctCount() { return state.filter(s => s.correct).length; }
    function scoreNow() { return correctCount() - penalty; }

    // =========================================================
    // rockets in motion
    // =========================================================
    function fireRocket(r) {
      rrSound.boost();
      if (!r.el) return;
      r.el.classList.remove("is-stall");
      r.el.classList.add("is-boost");
      later(() => r.el.classList.remove("is-boost"), 700);
      paintRocket(r);
      spawnPuff(r);
      if (r.p >= r.L) crossedLine(r);
    }
    // Repaint BOTH rockets on the match's one fixed track (Đợt 382 — see
    // fightTrackLength; the flag is reached through fireRocket → crossedLine).
    function fightRepaint() {
      if (!fightCtl || !scene || !scene.rockets) return;
      const len = scene.L || fightTrackLength(N);
      scene.rockets.forEach(r => { r.L = len; paintRocket(r); });
    }
    // Đợt 354 — FIGHT + Points off: back up `n` segments (floor: the start line).
    function retreatRocket(r, n) {
      if (!r.el) return;
      r.p = Math.max(0, r.p - n);
      paintRocket(r);
      if (scene) {
        const rect = relRect(r.el, scene.fxLayer);
        const neg = el("div", "aw-rr-neg", "−" + n);
        neg.style.left = (rect.x + rect.w * 0.5) + "px"; neg.style.top = rect.y + "px";
        scene.fxLayer.append(neg);
        later(() => neg.remove(), 1100);
      }
    }
    function stallRocket(r) {
      rrSound.stall();
      if (!r.el) return;
      r.el.classList.add("is-stall");
      later(() => r.el.classList.remove("is-stall"), STALL_MS);
      for (let i = 0; i < 3; i++) later(() => spawnSmoke(r), i * 220);
    }
    function spawnPuff(r) {
      if (!scene) return;
      const rect = relRect(r.el, scene.fxLayer);
      const p = el("div", "aw-rr-puff");
      p.style.left = rect.x + "px"; p.style.top = (rect.y + rect.h * 0.5) + "px";
      scene.fxLayer.append(p);
      later(() => p.remove(), 700);
    }
    function spawnSmoke(r) {
      if (!scene) return;
      const rect = relRect(r.el, scene.fxLayer);
      const s = el("div", "aw-rr-smoke");
      s.style.left = (rect.x + rect.w * 0.15) + "px"; s.style.top = (rect.y + rect.h * 0.45) + "px";
      scene.fxLayer.append(s);
      later(() => s.remove(), 900);
    }
    function relRect(node, within) {
      const a = node.getBoundingClientRect(), b = within.getBoundingClientRect();
      return { x: a.left - b.left, y: a.top - b.top, w: a.width, h: a.height };
    }

    function startTurbo(label) {
      turboUntil = performance.now() + TURBO_MS;
      player.el && player.el.classList.add("is-turbo");
      sceneRoot.classList.add("is-turbo");
      rrSound.turbo(); if (speaks()) rrSound.music.rev(true);
      showBanner(label, "is-turbo", 1000);
    }
    function endTurbo() {
      turboUntil = 0;
      player.el && player.el.classList.remove("is-turbo");
      // FIGHT: the shared scene's star-speed belongs to whichever board is in turbo
      if (!fightCtl || !rockets.some(r => r !== player && r.el && r.el.classList.contains("is-turbo"))) sceneRoot.classList.remove("is-turbo");
      if (speaks()) rrSound.music.rev(false);
    }

    function spawnCrate() {
      const kinds = ["shield", "turbo", "meteor"];
      const kind = kinds[Math.floor(Math.random() * kinds.length)];
      const c = el("div", "aw-rr-crate", CRATE_ICON[kind]);
      c.style.setProperty("--x", Math.min(TRACK_END, xOf(player) + 12).toFixed(2));
      player.el.parentNode.append(c);
      crate = { kind, el: c };
      rrSound.pickup();
    }
    function collectCrate() {
      const c = crate; crate = null;
      c.el.classList.add("is-taken");
      later(() => c.el.remove(), 500);
      rrSound.pickup();
      if (c.kind === "shield") { shield = true; player.el.classList.add("has-shield"); showBanner("🛡 SHIELD", "is-shield", 900); }
      else if (c.kind === "turbo") { startTurbo("🚀 TURBO!"); }
      else {
        // meteor: the leading rival that hasn't finished gets knocked back + stunned
        const lead = rockets.filter(r => !r.isPlayer && !r.done).sort((a, b) => b.p - a.p)[0];
        showBanner("☄ METEOR!", "is-meteor", 900);
        rrSound.meteor();
        if (lead) {
          lead.p = Math.max(0, lead.p - 0.6);
          lead.stunUntil = performance.now() + 1600;
          lead.el.classList.add("is-hit");
          later(() => lead.el.classList.remove("is-hit"), 1600);
          paintRocket(lead);
          throwMeteor(lead);
        }
      }
    }
    function throwMeteor(target) {
      const m = el("div", "aw-rr-meteor", "☄");
      const tr = relRect(target.el, scene.fxLayer);
      m.style.left = (tr.x + tr.w * 0.6) + "px"; m.style.top = (tr.y + tr.h * 0.5) + "px";
      scene.fxLayer.append(m);
      later(() => m.remove(), 900);
    }

    // one physics step (delta-clamped; a hidden tab merely slows the race)
    function tick() {
      if (dead || finished) return;
      const now = performance.now();
      let dt = now - last; last = now;
      if (dt > 100) dt = 100;
      if (!running) return;

      // question clock
      if (qDeadline) {
        const left = qDeadline - now;
        const frac = Math.max(0, Math.min(1, left / questionMs));
        qTimerBar.style.transform = "scaleX(" + frac.toFixed(3) + ")";
        qTimerBar.classList.toggle("is-low", left <= 3000);
        const secs = Math.ceil(left / 1000);
        if (secs < qTickAt) { qTickAt = secs; if (secs <= 5 && secs > 0) rrSound.tick(secs); }
        if (left <= 0) onTimeout();
      }
      // turbo window
      if (turboUntil && now >= turboUntil) endTurbo();

      // rivals fly on their own clock (solo only)
      if (!teamsMode && !fightCtl) {
        const turbo = turboUntil > 0;
        for (const r of rockets) {
          if (r.isPlayer || r.done) continue;
          if (now < r.stunUntil) continue;
          // rubber band: the further the pupil is ahead, the harder the rival tries (and vice versa)
          const gap = (player.p - r.p) / r.L;
          let mult = 1 + Math.max(-0.45, Math.min(0.45, gap * 0.9));
          if (turbo) mult *= RIVAL_SLOW_TURBO;
          r.p += r.rate * mult * (dt / 1000);
          if (r.p >= r.L) { r.p = r.L; paintRocket(r); crossedLine(r); continue; }
          paintRocket(r);
        }
      }
    }

    function crossedLine(r) {
      if (r.done) return;
      r.done = true;
      if (fightCtl && scene) {
        // both boards share one scene, so the finish order lives on it
        scene.finishedCount = (scene.finishedCount || 0) + 1;
        r.place = scene.finishedCount;
      } else {
        finishedCount++;
        r.place = finishedCount;
      }
      r.el.classList.add("is-done");
      r.el.classList.remove("is-turn");
      const medal = el("div", "aw-rr-medal", MEDAL[r.place - 1] || placeWord(r.place));
      r.el.append(medal);
      if (fightCtl) { raceWon(r); return; }   // Đợt 382 — first over the line wins, at once
      if (r.isPlayer) endSolo(r.place);
      else if (!teamsMode) { rrSound.rivalFinish(); }
      else if (rockets.every(x => x.done)) endTeams();
    }

    // =========================================================
    // endings
    // =========================================================
    function endSolo(place) {
      running = false;
      rrSound.music.stop();
      endTurbo();
      if (place === 1) rrSound.win(); else rrSound.correct();
      endTitle = (MEDAL[place - 1] ? MEDAL[place - 1] + " " : "") + placeWord(place) + " place!";
      showBanner(placeWord(place).toUpperCase() + " PLACE!", place === 1 ? "is-win" : "is-place", FINISH_BANNER_MS);
      later(finish, FINISH_BANNER_MS);
    }
    function endTeams() {
      if (finished) return;
      running = false;
      rrSound.music.stop();
      // rank: over the line first, then furthest along
      const order = rockets.slice().sort((a, b) => (a.done && b.done) ? a.place - b.place : a.done ? -1 : b.done ? 1 : (b.p / b.L) - (a.p / a.L));
      order.forEach((r, i) => { if (!r.done) { r.place = i + 1; const m = el("div", "aw-rr-medal", MEDAL[i] || placeWord(i + 1)); r.el.append(m); } });
      const win = order[0];
      rrSound.win();
      endTitle = "🏆 " + win.name + " wins!";
      showBanner(win.name.toUpperCase() + " WINS!", "is-win", FINISH_BANNER_MS);
      later(finish, FINISH_BANNER_MS);
    }

    function loseLife() {
      if (livesLeft == null) return false;
      const slot = ui.livesSlot;
      const gone = (livesLeft <= 5 && slot) ? slot.firstChild : null;
      livesLeft = Math.max(0, livesLeft - 1);
      rrSound.lifeLost();
      if (gone) {
        let done = false;
        const finishPop = () => { if (done) return; done = true; renderLives(); };
        try {
          const a = gone.animate([{ transform: "scale(1)", opacity: 1 }, { transform: "scale(1.7)", opacity: 0 }],
            { duration: 320, easing: "ease-in", fill: "forwards" });
          a.onfinish = finishPop;
        } catch (e) { finishPop(); }
        later(finishPop, 360);
      } else renderLives();
      if (livesLeft <= 0) {
        running = false;
        rrSound.music.stop();
        endTurbo();
        rrSound.lose();
        endTitle = "Game over";
        showBanner("GAME OVER", "is-stall", 1300);
        later(finish, 1300);
        return true;
      }
      return false;
    }
    // ---- Đợt 354: FIGHT lives = rocket damage; the last one is an explosion ----
    // Damage has 3 looks (cracks · smoke · darkening, rocket-race.css `.is-dmg-N`),
    // spread over however many lives the match has: 1 life = straight to the boom,
    // 3 lives = one look per life, 10 lives = a look every 3–4.
    function paintDamage(r) {
      if (!r.el || livesStart == null) return;
      const lost = livesStart - livesLeft;
      const stage = Math.min(3, Math.ceil(3 * lost / livesStart));
      r.el.classList.remove("is-dmg-1", "is-dmg-2", "is-dmg-3");
      if (stage > 0 && livesLeft > 0) r.el.classList.add("is-dmg-" + stage);
    }
    function renderChipLives() {
      let s = turnChip.querySelector(".aw-rr-turnlives");
      if (livesLeft == null) { if (s) s.remove(); return; }
      if (!s) { s = el("span", "aw-rr-turnlives"); turnChip.append(s); }
      s.textContent = livesLeft <= 5 ? "♥".repeat(livesLeft) : livesLeft + "♥";
    }
    function fightLoseLife() {
      if (livesLeft == null || exploded) return;
      livesLeft = Math.max(0, livesLeft - 1);
      rrSound.lifeLost();
      renderChipLives();
      if (on3d) {
        const side = fightSide, n = livesLeft, lvl = livesLeft > 0 ? Math.min(3, Math.ceil(3 * (livesStart - livesLeft) / livesStart)) : 3;
        v3(v => { v.setLives(side, n); v.damage(side, lvl); });
      }
      if (livesLeft > 0) { paintDamage(player); return; }
      explodeRocket(player);
    }
    function explodeRocket(r) {
      exploded = true;
      locked = true;
      tiles.forEach(t => (t.tile.disabled = true));
      answersEl.classList.add("is-fightlost");
      // ⭐ Đợt 393 (thầy): "khi kết thúc game trong mọi tình huống đều chạy tàu thắng qua đích và tàu thua
      // bị ánh sáng va chạm và phát nổ như bình thường" — trận 3D: hết mạng KHÔNG nổ ngay; tàu này chỉ
      // tàn tạ (khói, lửa yếu) còn cảnh kết trận (win) lo phần vệt sáng đánh + cháy + nổ.
      if (on3d) paint3dTiles();
      else blowUp(r);
      // Đợt 382 — out of lives = the OTHER rocket wins, and wins the same way as
      // at the flag: it flies home while this one burns (raceWon freezes the
      // referee at once — the old forfeit() let the next round slip in first).
      const other = fightCtl && scene && scene.rockets ? scene.rockets.find(x => x !== r) : null;
      if (other && typeof fightCtl.finishRace === "function") { raceWon(other, !on3d); return; }
      if (on3d) { const side = r.id; v3(v => v.explode(side)); blowUp(r); }
      showBanner(r.name + " IS DOWN!", "is-stall", 1300);
      // older core: the referee ends the match after its hold — the OTHER team wins
      if (fightCtl && typeof fightCtl.forfeit === "function") fightCtl.forfeit(fightSide);
    }
    // The explosion itself (💥 + smoke, then a grey wreck) — lives run out, or
    // (Đợt 382) the rocket that LOST the race.
    function blowUp(r) {
      rrSound.lose();
      if (!r || !r.el) return;
      r.el.classList.remove("is-dmg-1", "is-dmg-2", "is-dmg-3", "is-boost", "is-stall", "is-turbo");
      r.el.classList.add("is-exploding");
      if (scene) {
        const rect = relRect(r.el, scene.fxLayer);
        const boom = el("div", "aw-rr-boom", "💥");
        boom.style.left = (rect.x + rect.w * 0.5) + "px"; boom.style.top = (rect.y + rect.h * 0.5) + "px";
        scene.fxLayer.append(boom);
        later(() => boom.remove(), 1400);
        for (let i = 0; i < 6; i++) later(() => spawnSmoke(r), i * 120);
      }
      later(() => { r.el.classList.remove("is-exploding"); r.el.classList.add("is-wreck"); }, 900);
    }

    // ---- Đợt 382: FIGHT is won at the flag (thầy, 24/9/2026) ----
    // `w` is over the line (or is sent there by settleByPosition): the referee
    // freezes NOW, `w` gets its medal and the WINS banner, the other rocket blows
    // up a beat later, and the result panel follows after RACE_END_HOLD_MS.
    // Both boards share the scene, so `scene.decided` makes it happen once.
    function raceWon(w, loserAlreadyDown) {
      if (!fightCtl || !scene || !scene.rockets || scene.decided || dead) return;
      scene.decided = true;
      const loser = scene.rockets.find(r => r !== w);
      // Đợt 392 — trận 3D: tàu thắng bay khỏi màn → cổng co lại → vệt sáng đánh tàu thua → cháy → nổ
      // (~9 s); bảng kết quả của trọng tài chờ đúng hết cảnh đó.
      let holdMs = RACE_END_HOLD_MS;
      if (on3d && rr3d.view) { try { holdMs = Math.max(RACE_END_HOLD_MS, rr3d.view.win(w.id, { loserDown: !!loserAlreadyDown }) + 300); } catch (e) { console.warn(e); } }
      // Đợt 393 — trận đã phân thắng thua: đồng hồ trận dừng (trước đây vẫn chạy trên bảng kết quả)
      if (on3d) rr3d.boards.forEach(b => { try { b && b.stopClock && b.stopClock(); } catch { /* ignore */ } });
      if (typeof fightCtl.finishRace === "function") fightCtl.finishRace(w.id, holdMs);
      else if (loser && typeof fightCtl.forfeit === "function") fightCtl.forfeit(loser.id);
      locked = true;
      qDeadline = 0;
      let homeRun = false;
      if (w.p < w.L) {
        // "tàu gần hơn sẽ chạy về đích" — the flight home
        homeRun = true;
        w.p = w.L;
        if (w.el) { w.el.classList.remove("is-stall"); w.el.classList.add("is-boost", "is-homerun"); }
        rrSound.boost();
        paintRocket(w);
        later(() => { if (w.el) w.el.classList.remove("is-boost"); }, 700);
      }
      if (!w.done) crossedLine(w);   // medal; re-enters here and returns (decided)
      rrSound.win();
      showBanner(w.name + " WINS!", "is-win", RACE_END_HOLD_MS);
      // the loser goes up as the winner arrives (a home run takes 1.1 s — CSS)
      if (loser && !loserAlreadyDown) later(() => blowUp(loser), homeRun ? 1100 : RACE_BLOWUP_DELAY_MS);
    }
    // Out of questions / out of time: the rocket CLOSER to the flag flies home and
    // wins. Level ⇒ sudden death — one random question already played, again and
    // again, until one rocket leads (thầy: "tiếp tục 1 câu random trong các câu đã
    // chơi trước đó"). `side` = the board whose sudden-death question just ended
    // (independent boards), null = both. Returns true = "handled, referee stand by".
    function settleByPosition(side) {
      if (!fightCtl || !scene || !scene.rockets || scene.rockets.length < 2) return false;
      if (scene.decided) return true;
      const [a, b] = scene.rockets;
      if (a.p !== b.p) { raceWon(a.p > b.p ? a : b); return true; }
      if (typeof fightCtl.suddenDeath !== "function") return false;
      if (!scene.sudden || side == null) showBanner("SUDDEN DEATH!", "is-turbo", 1300);
      scene.sudden = true;
      return fightCtl.suddenDeath(side == null ? [0, 1] : [side]) !== false;
    }
    function renderLives() {
      const slot = ui.livesSlot;
      if (!slot) return;
      slot.innerHTML = "";
      if (livesLeft == null) return;
      if (livesLeft <= 5) { for (let i = 0; i < livesLeft; i++) slot.append(el("span", "aw-top-heart", "&#9829;")); }
      else { slot.append(el("span", "aw-top-heartcount", String(livesLeft))); slot.append(el("span", "aw-top-heart", "&#9829;")); }
    }

    function onKey(e) {
      if (locked || finished) return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= tiles.length) { e.preventDefault(); choose(n - 1); }
    }

    // per-question detail for Show answers (also read by the Fight end panel)
    function buildReview() {
      return items.map((q, i) => {
        const s = state[i];
        const correctText = (q.answers.find(a => a.correct) || {}).text || "";
        return {
          question: q.question || "",
          answered: s.attempts > 0,
          yourText: s.correct ? correctText : (s.wrong[s.wrong.length - 1] || ""),
          yourCorrect: s.correct === true,
          correctText,
          src: q   // `items` is a shallow copy, so `q` IS the content object
        };
      });
    }

    function finish() {
      if (finished || dead) return;
      // ⭐ Đợt 382 — FIGHT: the only way here is the engine's submit (Timer = Count
      // down reaching 0, or Menu ▸ Submit answers). A match is not ended on
      // points any more: the rockets settle it (both boards' clocks fire —
      // `scene.timeUp` lets the first one through).
      if (fightCtl) {
        if (scene && !scene.decided && !scene.timeUp) { scene.timeUp = true; settleByPosition(null); }
        return;
      }
      finished = true;
      // Chốt sổ TRƯỚC khi đọc điểm: một "−N" đang bay là một phép trừ chưa áp (Đợt 256).
      ui.flushPenalties?.();
      running = false;
      if (tickTimer) { clearInterval(tickTimer); tickTimer = null; }
      if (speaks()) rrSound.music.stop();
      voicePlayer.stop();
      locked = true;
      const perQuestion = state.map((s, i) => ({ q: i, correct: s.correct === true }));
      const correct = perQuestion.filter(p => p.correct).length;
      const wrongTurns = state.reduce((n, s) => n + s.wrong.length, 0);
      const never = state.filter(s => s.attempts === 0).length;
      const review = buildReview();
      const answered = state.filter(s => s.attempts > 0).length;
      // `total` counts TURNS (a re-asked question is another row) + questions
      // never reached; `items` is the size of the paper, for the assignment's
      // "perfect?" check (Đợt 294).
      ui.finish({ correct, incorrect: wrongTurns + never, total: correct + wrongTurns + never, items: N,
                  perQuestion, review, answered,
                  score: correct - penalty,
                  title: endTitle || undefined });
    }

    return function cleanup() {
      dead = true;            // MUST come first — the only brake on bare callbacks
      finished = true;
      rrPauseHandlers.delete(pauseHandler);
      // Đợt 368 — board 0 opened the link, board 0 closes it (and drops the
      // document, so tomorrow's iPad never reads today's match).
      if (twoDevice && fightSide === 0) rrLinkStop();
      window.removeEventListener("keydown", onKey);
      if (tickTimer) { clearInterval(tickTimer); tickTimer = null; }
      timers.forEach(id => clearTimeout(id)); timers.clear();
      if (speaks()) rrSound.music.stop();
      voicePlayer.stop();
      if (ui.livesSlot) ui.livesSlot.innerHTML = "";
    };
  },

  // Menu pause hook (Đợt 91) — engine calls this on ☰ Menu open(true)/close(false).
  // A match has two live mounts; each registered its own pair.
  onPause(paused) {
    rrPauseHandlers.forEach(h => { if (paused) h.pause(); else h.resume(); });
    if (rr3d && rr3d.view) { rr3d.view.pause(!!paused); if (rr3d.sfx) rr3d.sfx.pause(!!paused); }
  }
};

registerTemplate(rocketRaceTemplate);
export default rocketRaceTemplate;
