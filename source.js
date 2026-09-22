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
import { fitOnce } from "./core/fit.js";
import { subscribeStage, touchViewer, VIEWER_BEAT_MS } from "./templates/rocket-race/rr-link.js";

const $ = id => document.getElementById(id);
const rrs = $("rrs");
const note = $("rrs-note");
const els = {
  act: $("rrs-act"), count: $("rrs-count"), clock: $("rrs-clock"),
  q: [$("rrs-q0"), $("rrs-q1")], box: [$("rrs-box0"), $("rrs-box1")],
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

// ⭐ The fit is allowed to GROW the text, not only shrink it (Đợt 368b, thầy
// dùng iPad Pro 12.9" nằm ngang = 1366×1024). `fitOnce`'s default ceiling of 1
// meant a short answer-question like "Mars" sat at its base 96px and used 15 %
// of an 824px-tall box — tiny, on the largest screen in the room. Measured at
// 1366×1024: a long question and a Vietnamese one are capped by HEIGHT long
// before this ceiling (63px / 88px whatever the ceiling is), so raising it
// changes nothing for them and only lets the short ones fill the space:
// "Mars" 96 → 210px, and a shared single-line question 172 → 211px.
// ⚠️ `slack` SCALES WITH THE SCREEN, and `contentBox` must stay OFF (both
// measured, both wrong on the first try):
//   · a FIXED slack cannot work — the Vietnamese marks that spill past the line
//     box grow with the type, so 10px cleared them at 66px type and clipped them
//     at 88px. 2u ≈ 27px on this iPad, ~20px on a smaller one.
//   · `contentBox:true` looks like the tidy fix and silently breaks everything:
//     it subtracts the box's padding from the width it compares against, but the
//     text block is `width:100%` of that same content box — so the two cancel and
//     EVERY question reads as overflowing. Measured: all five test questions
//     collapsed to the 0.25 floor (24px).
function fitOpts() {
  const u = parseFloat(getComputedStyle(rrs).getPropertyValue("--u")) || 10;
  return { min: 0.25, max: 2.2, slack: Math.round(u * 2) };
}

// ---- drawing a question ----
// ⚠️ `textContent`, never innerHTML: this text came off the network, and the
// only reason it is safe to put on screen at all is that it is never parsed.
function paintStage(s) {
  stage = s;
  rrs.classList.toggle("is-same", !!s.same);
  els.act.textContent = s.actTitle || "";
  els.count.textContent = s.total ? (Math.min(s.round + 1, s.total) + " / " + s.total) : "";
  clockBase = s.clockMs; clockFrom = Date.now();
  clockRunning = s.phase !== "over" && online;
  paintClock();

  s.sides.forEach((side, i) => {
    els.name[i].textContent = side.team.name;
    els.dot[i].style.setProperty("--rc", side.team.color || "#4fc3f7");
    const q = els.q[i];
    q.classList.toggle("is-voice", side.voiceOnly);
    q.textContent = side.voiceOnly ? "🔊" : side.text;
    // Long questions shrink to fit rather than being cut off. One-shot per
    // question: the box only changes size when the iPad is rotated, and that
    // fires the refit below.
    q.style.setProperty("--fit", "1");
    if (!side.voiceOnly) fitOnce(els.box[i], q, v => q.style.setProperty("--fit", v), fitOpts());
  });
  hideNote();
}

function refit() {
  if (!stage) return;
  stage.sides.forEach((side, i) => {
    if (side.voiceOnly) return;
    const q = els.q[i];
    q.style.setProperty("--fit", "1");
    fitOnce(els.box[i], q, v => q.style.setProperty("--fit", v), fitOpts());
  });
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
  els.clock.textContent = ""; els.count.textContent = ""; els.act.textContent = "";
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
