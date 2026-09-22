// =============================================================
// ROCKET RACE — "MÁY NGUỒN" QUESTION SCREEN (Đợt 368, thầy 22/9/2026).
//
// The second half of the two-device Fight (see templates/rocket-race/rr-link.js
// for the wire and the why). This page is a SCREEN, not a player:
//   · it never plays, scores, or decides anything;
//   · it holds no copy of the act — the questions arrive as plain text, so it
//     cannot drift out of step with the match by loading the wrong version;
//   · it only ever WRITES its own heartbeat, so MÁY CHƠI can tell whether the
//     question is really on a screen somewhere before it hides its own.
//
// Open it on the iPad, sign in as the teacher, leave it. Nothing to configure:
// the moment a Rocket race match starts with "Question screen" ticked, the
// questions appear here.
// =============================================================

import { onUser, signIn } from "./core/firebase.js";
import { subscribeStage, touchViewer, VIEWER_BEAT_MS } from "./templates/rocket-race/rr-link.js";

const $ = id => document.getElementById(id);
const rrs = $("rrs");
const note = $("rrs-note");
const els = {
  act: $("rrs-act"), clock: $("rrs-clock"),
  q: [$("rrs-q0"), $("rrs-q1")], box: [$("rrs-box0"), $("rrs-box1")],
  num: [$("rrs-num0"), $("rrs-num1")],
  name: [$("rrs-name0"), $("rrs-name1")], dot: [$("rrs-dot0"), $("rrs-dot1")],
  noteIc: $("rrs-note-ic"), noteTitle: $("rrs-note-title"),
  noteSub: $("rrs-note-sub"), noteBtn: $("rrs-note-btn")
};

// ---- `--u` = 1% of the width, measured, never `cqw` (see source.html) ----
function setUnit() {
  rrs.style.setProperty("--u", (rrs.clientWidth / 100).toFixed(3) + "px");
}
setUnit();
if (window.ResizeObserver) new ResizeObserver(setUnit).observe(rrs);
else window.addEventListener("resize", setUnit);

// ---- state ----
let stage = null;          // the last packet drawn
let lastAt = 0;            // newest `at` seen — older packets are dropped
let beatTimer = null;
let online = true;
let clockBase = 0, clockFrom = 0, clockRunning = false;

function showNote(icon, title, sub, { bad = false, button = null } = {}) {
  els.noteIc.textContent = icon;
  els.noteTitle.textContent = title;
  els.noteSub.textContent = sub || "";
  note.classList.toggle("is-bad", !!bad);
  els.noteBtn.hidden = !button;
  if (button) els.noteBtn.textContent = button;
  note.hidden = false;
}
function hideNote() { note.hidden = true; }

// ---- the match clock: set from each packet, counted locally in between ----
// No per-second writes and no dependence on the two devices' wall clocks
// agreeing — only on elapsed time, which both measure identically.
function paintClock() {
  if (!clockRunning) return;
  const ms = clockBase + (Date.now() - clockFrom);
  const s = Math.max(0, Math.floor(ms / 1000));
  els.clock.textContent = String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
}
setInterval(paintClock, 500);

function setOnline(on) {
  if (on === online) return;
  online = on;
  els.clock.classList.toggle("is-bad", !on);
  if (!on) { els.clock.textContent = "⚠ OFFLINE"; clockRunning = false; }
  else if (stage) { clockRunning = true; paintClock(); }
}

// ---- fitting the word (Đợt 371) -------------------------------------------
// ⛔ `fitOnce` is NOT used here any more, and the reason matters. It asks
// `content.scrollWidth`, and scrollWidth only counts overflow past the END edge.
// This text is CENTRED, so a word too wide for its box spills equally off BOTH
// sides and scrollWidth under-reports it — the same lie this project already
// documented for a centred flex box in Find the match, where the answer was to
// measure with `Range.getClientRects()` instead. Anything that measures the text
// honestly has to look at the line boxes themselves.
//
// ⭐ And the fit no longer GROWS the text (max is 1). Thầy, 22/9/2026: *"chữ trên
// ipad quá to (một cách không cần thiết vì màn hình ipad 12.9 và hs đứng gần)"* —
// the words are short now (Đợt 370 put the ANSWER there, not the clue), so there
// is nothing to fill the screen with and no reason to try.

// Widest LINE and total height of the text — measured off the real line boxes,
// so a centred overflow cannot hide from it.
function measureText(q) {
  const r = document.createRange();
  r.selectNodeContents(q);
  const rects = Array.from(r.getClientRects());
  if (!rects.length) return { w: 0, h: 0 };
  let w = 0, top = Infinity, bottom = -Infinity;
  for (const x of rects) {
    if (x.width > w) w = x.width;
    if (x.top < top) top = x.top;
    if (x.bottom > bottom) bottom = x.bottom;
  }
  return { w, h: bottom - top };
}

// Largest `--fit` (≤ 1) at which this half's text fits its box. Returns it
// WITHOUT committing, so the caller can make both halves agree first.
function fitOne(box, q) {
  const cs = getComputedStyle(box);
  const availW = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const availH = box.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  const set = v => q.style.setProperty("--fit", v);
  const fits = () => { const m = measureText(q); return m.w <= availW && m.h <= availH; };
  set(1);
  if (fits()) return 1;
  let lo = 0.2, hi = 1, best = 0.2;
  for (let i = 0; i < 14; i++) {
    const mid = (lo + hi) / 2;
    set(mid);
    if (fits()) { best = mid; lo = mid; } else hi = mid;
  }
  return best;
}

// ⭐ BOTH HALVES END UP THE SAME SIZE, at whichever half needed to be smaller
// (thầy: *"2 bên phải có size bằng nhau"* + *"lấy size của cỡ chữ bé hơn"*).
// Two different sizes side by side read as one team's word mattering more.
function layoutText(sides) {
  const active = sides.length > 1 && !rrs.classList.contains("is-same") ? [0, 1] : [0];
  const vals = active.map(i => (sides[i] && sides[i].voiceOnly) ? 1 : fitOne(els.box[i], els.q[i]));
  const one = Math.min(1, ...vals);
  active.forEach(i => els.q[i].style.setProperty("--fit", one));
  return one;
}

// ---- drawing a question ----
// ⚠️ `textContent`, never innerHTML: this text came off the network, and the
// only reason it is safe to put on screen at all is that it is never parsed.
function paintStage(s) {
  stage = s;
  rrs.classList.toggle("is-same", !!s.same);
  els.act.textContent = s.actTitle || "";
  clockBase = s.clockMs; clockFrom = Date.now();
  clockRunning = s.phase !== "over" && online;
  paintClock();

  s.sides.forEach((side, i) => {
    els.name[i].textContent = side.team.name;
    els.dot[i].style.setProperty("--rc", side.team.color || "#4fc3f7");
    // Each team's own place in its own pile. Blank until that board reports, so
    // a half that has not started yet says nothing instead of "1 / 0".
    els.num[i].textContent = (side.num && side.total) ? (side.num + " / " + side.total) : "";
    const q = els.q[i];
    // Đợt 370 — `side.text` is now the answer WORD. `voiceOnly` no longer means
    // "a listening question": it means this act's right answer carries no text
    // at all, so there is simply nothing to put up.
    q.classList.toggle("is-voice", side.voiceOnly);
    q.textContent = side.voiceOnly ? "—" : side.text;
    q.style.setProperty("--fit", "1");
  });
  // A word too wide for its half shrinks rather than being cut or split; both
  // halves then settle on the smaller of the two sizes.
  layoutText(s.sides);
  hideNote();
}

function refit() {
  if (!stage) return;
  stage.sides.forEach((side, i) => { if (!side.voiceOnly) els.q[i].style.setProperty("--fit", "1"); });
  layoutText(stage.sides);
}
window.addEventListener("resize", () => setTimeout(refit, 150));
window.addEventListener("orientationchange", () => setTimeout(refit, 300));

// ---- heartbeat: "the question really is on a screen" ----
// MÁY CHƠI puts its own question line back if this stops arriving, so a failure
// here is not silent — it fixes itself on the other device. A failed write is
// also this page's most honest test of the network, which is what drives the
// OFFLINE flag (navigator.onLine lies on captive/again-half-up wifi).
async function beat() {
  if (!stage) return;
  try {
    await touchViewer({ matchId: stage.matchId, round: stage.round });
    setOnline(true);
  } catch {
    setOnline(false);
  }
}
function startBeating() {
  if (beatTimer) return;
  beat();
  beatTimer = setInterval(beat, VIEWER_BEAT_MS);
}

// ---- keep the iPad awake ----
// ⚠️ An iPad locks itself after a couple of minutes. This screen is furniture:
// nobody touches it for the whole match, so without this it goes black in the
// middle of a question and a pupil has to walk over and wake it. Screen Wake
// Lock is supported on iPadOS 16.4+ (an M1 iPad is well past that).
// ⚠️ The lock is DROPPED whenever the page is hidden (app switched, screen
// manually locked), so it has to be re-taken on the way back — that is the
// documented behaviour, not a failure.
let wakeLock = null;
async function keepAwake() {
  if (wakeLock || !("wakeLock" in navigator) || document.visibilityState !== "visible") return;
  try {
    wakeLock = await navigator.wakeLock.request("screen");
    wakeLock.addEventListener("release", () => { wakeLock = null; });
  } catch { /* refused (low battery) or unsupported — the screen just dims as usual */ }
}
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") { keepAwake(); refit(); }
});

// ---- wiring ----
function waitingForGame() {
  stage = null; lastAt = 0; clockRunning = false;
  els.clock.textContent = ""; els.act.textContent = "";
  els.num.forEach(n => { n.textContent = ""; });
  showNote("🚀", "Waiting for the game",
    "Start a Rocket race match on the classroom screen with “Question screen” ticked in Options, and the questions will appear here.");
}

let unsubStage = null;

function startListening() {
  if (unsubStage) return;
  waitingForGame();
  unsubStage = subscribeStage(s => {
    if (!s) { waitingForGame(); return; }
    // Drop anything not newer than what is already drawn: Firestore can replay
    // a cached document after a reconnect, and redrawing an older round on a
    // classroom screen is worse than drawing nothing.
    if (s.at && s.at <= lastAt) return;
    lastAt = s.at;
    setOnline(true);
    paintStage(s);
    startBeating();
    keepAwake();
  }, () => {
    // The read itself failed (permissions, network). Never keep showing a
    // question as if it were current — say so. (Core rule: CẤM nhớ lại một lần
    // đọc THẤT BẠI … phải NÓI RA trên màn hình.)
    setOnline(false);
    showNote("📡", "Connection lost", "This screen cannot reach the game right now. Check the wifi — it will come back on its own.", { bad: true });
  });
}

els.noteBtn.addEventListener("click", async () => {
  els.noteBtn.disabled = true;
  try {
    await signIn();
  } catch (e) {
    showNote("🔒", "Could not sign in", e?.message || "Please try again.", { bad: true, button: "Sign in" });
  } finally {
    els.noteBtn.disabled = false;
  }
});

showNote("🚀", "Loading…", "");
onUser(user => {
  if (user) { startListening(); return; }
  if (unsubStage) { unsubStage(); unsubStage = null; }
  if (beatTimer) { clearInterval(beatTimer); beatTimer = null; }
  stage = null;
  showNote("🔒", "Sign in to link this screen",
    "Use the same Google account as the classroom computer. This screen only shows the questions — it never scores anything.",
    { button: "Sign in" });
}).catch(() => {
  showNote("⚠️", "Cannot reach Google", "This device is offline, or the sign-in service is blocked here.", { bad: true });
});
