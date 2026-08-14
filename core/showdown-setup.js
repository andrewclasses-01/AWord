// =============================================================
// SHOWDOWN SETUP — the shared team table, and the panel that builds it
// (Đợt 155, rebuilt in Đợt 156 to the teacher's own three-screen design).
// Read core/showdown.js's header first: it explains what the mode is and why
// the CHOICE of team is per-browser while this TABLE is not.
//
// ⚠️ DYNAMIC-IMPORT ONLY, from the teacher's SHOWDOWN button. This file reaches
// Firestore and core/classes.js, and the core contract (HUONG DAN CORE.md, luật
// 2 of v0.9.0) is that the student page must never download code that can reach
// the library layer.
//
// ---------------------------------------------------------------------------
// THE THREE SCREENS (teacher's design, 14/8/2026)
// ---------------------------------------------------------------------------
//   A. SETUP   class + number of teams, both big. Once a class is picked its
//              pupils appear below and can be removed, or added by hand.
//              → NEXT
//   B. BUILD   every pupil as a chip in a pool along the top; the teams as
//              vertical columns below. Tap a team's name to select it, then tap
//              a chip and it FLIES into that column. Tick the team this browser
//              plays. → READY
//   C. RUNNING once set up, the button opens a short panel instead: RESET TEAM
//              (build again) or SINGLE MODE (leave Showdown).
//
// ⚠️ All three keep the SAME panel footprint (teacher: "size của các bảng đều to
// bằng nhau, dù nội dung có ít hơn"). That is `.aw-sd-body`'s fixed min-height /
// width in core/app.css — NOT something to "tidy up" later: a popover that
// resizes under the teacher's finger between steps is what it exists to avoid.
//
// ---------------------------------------------------------------------------
// WHERE THE TABLE IS STORED, AND WHAT A CLAIM IS
// ---------------------------------------------------------------------------
// One document, `users/{uid}/items/sd_main`, kind "showdown" — the same
// collection the class rolls live in, for the reason core/classes.js gives at
// length: the Firestore rules open exactly one path for the teacher's own data,
// so a new top-level collection would be DENIED until somebody edited the rules
// in the Firebase console by hand.
//
//   { classId, className, teams:[{id,name,members:[{id,name}]}],
//     claims: { [teamId]: { by: <browserId>, at: <ms> } } }
//
// A CLAIM is what makes "one team per browser" real: a team ticked here vanishes
// from every other browser's table (teacher, 14/8/2026). Claims are read fresh
// whenever the panel opens AND watched live while it is open, so a column that
// claims a team makes it disappear under the other columns' noses.
//
// ⚠️ CLAIMS MUST EXPIRE. The claimant id lives in `sessionStorage`, so a browser
// that is simply CLOSED can never release what it held — without a TTL the team
// would be unusable forever and the only way out would be rebuilding the table.
// =============================================================

import { el } from "./utils.js";
import { sound } from "./sound.js";
import { icons } from "./icons.js";
import { db, fs, currentUser } from "./firebase.js";
import { makeHStepper } from "./numberstepper.js";
import { MIN_TEAMS, MAX_TEAMS, MAX_PER_TEAM, SOLO_TEAM_ID, browserId, writePick, clearPick } from "./showdown.js";

const DOC_ID = "sd_main";
// A claim older than this is treated as abandoned. Long enough to cover a whole
// teaching day (a match left running through a break must not be stolen), short
// enough that yesterday's claims never block this morning's lesson.
const CLAIM_TTL_MS = 12 * 60 * 60 * 1000;

// ---- Firestore plumbing (mirrors core/classes.js; same collection, own cache)
let cache = null;
let cacheUid = null;

export function resetShowdownCache() { cache = null; cacheUid = null; }

async function requireUid() {
  const user = await currentUser();
  if (!user) {
    const err = new Error("Please sign in to use Showdown.");
    err.code = "aw/signed-out";
    throw err;
  }
  return user.uid;
}

// Firestore rejects `undefined`, so drop those keys before writing.
function clean(value) {
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) if (v !== undefined) out[k] = clean(v);
    return out;
  }
  return value;
}

// Tolerant on read — a table written by an older build, or half-written, must
// never break the panel.
function normalize(raw) {
  const teams = Array.isArray(raw?.teams) ? raw.teams : [];
  const claims = {};
  const rawClaims = (raw && typeof raw.claims === "object" && raw.claims) || {};
  for (const [teamId, c] of Object.entries(rawClaims)) {
    const at = Number(c?.at) || 0;
    const by = String(c?.by || "");
    if (by && at) claims[teamId] = { by, at };
  }
  return {
    id: DOC_ID, kind: "showdown", root: "showdown", parentId: null, trashed: false,
    classId: String(raw?.classId || ""),
    className: String(raw?.className || "").trim(),
    teams: teams.slice(0, MAX_TEAMS).map((t, i) => ({
      id: String(t?.id || `sdt_${i + 1}`),
      name: String(t?.name || "").trim() || `Team ${i + 1}`,
      members: (Array.isArray(t?.members) ? t.members : [])
        .map(m => ({ id: String(m?.id || ""), name: String(m?.name || "").trim() }))
        .filter(m => m.name)
    })),
    claims,
    updatedAt: Number(raw?.updatedAt) || 0
  };
}

/** Is this claim still binding on OTHER browsers? */
export function claimIsLive(claim, now = Date.now()) {
  return !!claim && now - claim.at < CLAIM_TTL_MS;
}

/**
 * Teams this browser may TAKE: unclaimed, expired, or already ours.
 * ⚠️ Đợt 159 — this no longer decides what is DRAWN. Teams held elsewhere used
 * to be filtered out of the table entirely; the teacher's new rule is that every
 * team stays on screen and the taken ones are dimmed and inert, so the panel
 * asks `claimIsLive()` per column and this helper is only about permission.
 */
export function takeableTeams(setup, me, now = Date.now()) {
  return setup.teams.filter(t => {
    const c = setup.claims[t.id];
    return !claimIsLive(c, now) || c.by === me;
  });
}

export async function loadSetup({ fresh = false } = {}) {
  const uid = await requireUid();
  if (!fresh && cache && cacheUid === uid) return cache;
  const [d, { doc, getDoc }] = await Promise.all([db(), fs()]);
  const snap = await getDoc(doc(d, `users/${uid}/items`, DOC_ID));
  cache = snap.exists() ? normalize(snap.data()) : normalize({});
  cacheUid = uid;
  return cache;
}

export async function saveSetup(setup) {
  const uid = await requireUid();
  const node = normalize({ ...setup, updatedAt: Date.now() });
  const [d, { doc, setDoc }] = await Promise.all([db(), fs()]);
  await setDoc(doc(d, `users/${uid}/items`, DOC_ID), clean(node));
  cache = node; cacheUid = uid;
  return node;
}

/**
 * Watch the table while the panel is open, so a team claimed by another column
 * disappears here without the teacher having to close and reopen.
 * Returns an unsubscribe function (a no-op if the listener could not start —
 * the panel then simply keeps the snapshot it loaded, which is still correct at
 * the moment it opened).
 */
export function subscribeSetup(onChange) {
  let stop = null, dead = false;
  (async () => {
    try {
      const uid = await requireUid();
      const [d, { doc, onSnapshot }] = await Promise.all([db(), fs()]);
      if (dead) return;
      stop = onSnapshot(doc(d, `users/${uid}/items`, DOC_ID), snap => {
        const next = normalize(snap.exists() ? snap.data() : {});
        cache = next; cacheUid = uid;
        onChange(next);
      }, () => { /* permission/network — keep what we have */ });
    } catch { /* signed out: nothing to watch */ }
  })();
  return () => { dead = true; if (stop) { try { stop(); } catch { /* already gone */ } } };
}

/**
 * Give back every team THIS browser is holding (Đợt 158).
 *
 * ⚠️ This used to exist only as a closure inside the panel, which meant the two
 * ways of leaving Showdown that do NOT go through the panel — the mode picker's
 * "Single mode", and entering Fight — dropped the local pick and left the CLAIM
 * standing on Firestore. Nothing looked wrong on this screen; the damage was on
 * the OTHER screens, where that team stayed invisible for the rest of the 12h
 * TTL. Anything that ends Showdown must call this.
 *
 * Never throws: signed out or offline, the TTL is still the backstop, and a
 * failure here must not stop the teacher from leaving the mode.
 */
export async function releaseMyClaim() {
  const me = browserId();
  try {
    const fresh = await loadSetup({ fresh: true });
    let touched = false;
    Object.entries(fresh.claims).forEach(([tid, c]) => {
      if (c.by === me) { delete fresh.claims[tid]; touched = true; }
    });
    if (touched) await saveSetup(fresh);
  } catch { /* signed out or offline — the TTL will clear it */ }
}

// ---------------------------------------------------------------
// SPLITTING A ROLL INTO TEAMS
// ---------------------------------------------------------------
// Deal round-robin, not in blocks: with 10 pupils over 3 teams, blocks give
// 4/3/3 with the register's first four all together, while dealing gives the
// same 4/3/3 with the class spread across the teams.
export function splitIntoTeams(students, count, existing = []) {
  const n = Math.max(MIN_TEAMS, Math.min(MAX_TEAMS, Math.round(count) || MIN_TEAMS));
  const teams = Array.from({ length: n }, (_, i) => ({
    // Keep a team's identity across a re-split: a claim in another browser
    // names its team BY ID, and regenerating ids would silently orphan it.
    id: existing[i]?.id || `sdt_${i + 1}`,
    name: existing[i]?.name || `Team ${i + 1}`,
    members: []
  }));
  students.forEach((s, i) => teams[i % n].members.push({ id: String(s.id || ""), name: String(s.name || "") }));
  return teams;
}

let seq = 0;
function localId(prefix) { return `${prefix}_${Date.now().toString(36)}_${(seq++).toString(36)}`; }

// ---------------------------------------------------------------
// THE PANEL
// ---------------------------------------------------------------
// Đợt 157 — the teacher's third pass: bigger name chips (a class is at most 20
// pupils, so there is room to make them properly tappable), a balanced layout on
// every step, and "mỗi bước chuyển, mỗi thao tác… đều phải có animation mượt"
// plus a sound for each.
//
// ⚠️ Two rules this file must keep, both learned the hard way elsewhere:
//   • EVERY `element.animate()` needs a `setTimeout` fallback — a hidden or
//     backgrounded tab freezes rAF and `onfinish` never fires, which would leave
//     a half-faded layer (or a flying ghost) parked over the panel for good.
//   • Do NOT put `transform`/`filter`/`opacity`<1 on `.aw-below-center` or any
//     ANCESTOR of it (the stacking-context contract in this file's sibling doc).
//     Everything animated below lives INSIDE `.aw-tool-panel`, which is safe.
//
// SOUND — Showdown's own little vocabulary, composed from the shared primitives
// in core/sound.js rather than added to it: these are this panel's idiom, and
// core/sound.js is used by all 17 games, so growing it for one caller would make
// every other game's sound list longer for nothing. `sound.glide` already
// respects the global mute, so nothing here has to check it.
const sfx = {
  tap:     () => sound.click(),
  forward: () => sound.glide({ freq: 620, freqEnd: 960, dur: 130, gain: 0.075, type: "sine" }),
  back:    () => sound.glide({ freq: 900, freqEnd: 560, dur: 130, gain: 0.06, type: "sine" }),
  land:    () => sound.glide({ freq: 780, freqEnd: 1180, dur: 90, gain: 0.07, type: "triangle" }),
  lift:    () => sound.glide({ freq: 1000, freqEnd: 700, dur: 90, gain: 0.055, type: "triangle" }),
  remove:  () => sound.glide({ freq: 520, freqEnd: 300, dur: 110, gain: 0.06, type: "triangle" }),
  add:     () => sound.glide({ freq: 700, freqEnd: 1050, dur: 110, gain: 0.07, type: "triangle" }),
  claim:   () => sound.tick(),
  ready:   () => { sound.tick(); sound.glide({ freq: 880, freqEnd: 1320, dur: 220, gain: 0.09, type: "triangle" }); }
};

/** Run `anim`, and guarantee `after()` happens even if onfinish never fires. */
function whenDone(anim, after, ms) {
  let done = false;
  const settle = () => {
    if (done) return;
    done = true;
    // `fill:"forwards"` holds the last keyframe; releasing it before the node is
    // touched is what stops elements ending up visually stuck mid-flight.
    try { anim.cancel(); } catch { /* already gone */ }
    after();
  };
  anim.onfinish = settle;
  setTimeout(settle, ms);
  return settle;
}

/**
 * @param {Element} panel  the tool popover to fill
 * @param {object} ctx
 *   currentTeam  the pick this browser is playing, or null (decides where the
 *                panel lands and which team starts out ticked)
 *   onApply   (pick) => void  — engine restarts the play; pick already stored
 *   onTurnOff () => void
 *   toast     the engine's toast
 */
export function buildShowdownPanel(panel, ctx) {
  const { onApply, onTurnOff, toast } = ctx;
  const me = browserId();

  // One fixed-size body for EVERY screen (see the header note) plus a footer.
  // Nothing below ever replaces `body` or `foot` themselves — screens render
  // into a LAYER inside them, which is what makes the cross-fade possible.
  // ⚠️ Đợt 159b — THERE IS NO HEAD ROW. It briefly carried the title and the two
  // mode icons; the teacher then asked for that whole strip back as table height
  // ("bỏ hẳn không gian cho khu vực chữ showdown ở góc trên"), with the title and
  // the icons moving into the bottom row. Everything this panel is, is now the
  // body plus that one row.
  const body = el("div", "aw-sd-body");
  const foot = el("div", "aw-sd-foot");
  panel.append(body, foot);

  // ⭐ Đợt 159b — AS WIDE AS THE APP FRAME (teacher: "dãn chiều ngang lớn hết cỡ
  // bằng khung app để không phải scroll ngang"). A stated 860 was wider than the
  // frame on the teacher's own screen, which is exactly where the sideways
  // scrollbar came from.
  // ⚠️ Measured from `.aw-below` in the DOCUMENT, not from the panel: during a
  // cold open the panel has not been appended yet (core/engine.js builds its
  // contents first), so `panel.closest(...)` would be null. Showdown never runs
  // inside a fight, so there is only ever one of these.
  // ⚠️⚠️ A CUSTOM PROPERTY, not `style.width`. core/engine.js's swapContents
  // measures the panel's natural size by CLEARING `style.width` mid-swap and
  // clears it again when it unwraps — an inline width set here would simply
  // vanish the first time the teacher opened this panel over another one.
  // `--sd-panel-w` is not touched by any of that; `.aw-tool-panel.is-sd` reads it
  // and falls back to the stated width when it is absent.
  const frame = document.querySelector(".aw-below");
  if (frame?.clientWidth) {
    const panelEl = panel.closest(".aw-tool-panel") || panel;
    panelEl.style.setProperty("--sd-panel-w", Math.round(frame.clientWidth) + "px");
  }

  // ⚠️⚠️ LIVENESS IS `body.isConnected`, NEVER `panel.isConnected`.
  // core/engine.js opens a tool panel two different ways. Opened cold, `panel`
  // IS `.aw-tool-panel`. But opened while ANOTHER tool panel is up, the engine
  // cross-fades (swapContents): `panel` is then a temporary `.aw-swap-in` layer
  // that is REMOVED at SWAP_MS + 40 = 300ms, after its children have been moved
  // into the real box. So `panel` goes stale while the UI it built is alive and
  // on screen — and any `await` here that outlasts 300ms would come back, see a
  // disconnected `panel`, and bail out leaving "Loading…" on screen for good.
  // 300ms is nothing for a real Firestore round trip on a classroom network;
  // it never fires against a local test double, which is exactly why this is
  // written down rather than left to be discovered.
  // `body` is one of the children the swap MOVES, so it stays connected either
  // way and is the honest test.
  const alive = () => body.isConnected;

  let setup = { classId: "", className: "", teams: [], claims: {} };
  let classes = null;
  let classErr = "";
  let roster = [];          // pupils on screen A (editable: delete / add by hand)
  // Opens on TWO, not on MIN_TEAMS: 1 is now legal (the whole class as one team)
  // but it is the special case, and a stepper that starts there would make the
  // ordinary Showdown — several teams racing — the one you have to go looking
  // for. A saved table overrides this in boot().
  let teamCount = Math.min(MAX_TEAMS, 2);
  let selectedTeam = null;  // which column receives the next tapped chip
  let claimedTeam = null;   // which team THIS browser will play
  let pool = [];            // pupils not yet in a team (screen B)
  let unsub = null;

  // ⚠️ The teacher can dismiss this popover by tapping anywhere outside it, and
  // that path runs entirely inside core/engine.js — nothing calls back here. A
  // Firestore onSnapshot left running would then stay open for the rest of the
  // page's life, repainting a detached DOM, one more per open-and-dismiss.
  // Measured: `subsAfterClose` was 1 after a single dismissal.
  // The snapshot callback's own `alive()` guard is not enough on its own — it
  // only runs when a snapshot ARRIVES, which may be never. So watch the DOM the
  // panel lives in and tear down the moment `body` leaves it.
  let gone = null;
  const stopWatch = () => {
    if (unsub) { unsub(); unsub = null; }
    if (gone) { gone.disconnect(); gone = null; }
  };
  function watchForClose() {
    if (gone) return;
    const host = body.closest(".aw-below-center") || body.parentElement || document.body;
    gone = new MutationObserver(() => { if (!alive()) stopWatch(); });
    gone.observe(host, { childList: true, subtree: true });
  }

  // ---------------------------------------------------------------
  // SCREEN PLUMBING — one place that owns "what is on screen", so every step
  // change animates the same way instead of each caller inventing its own.
  // ---------------------------------------------------------------
  const SCREEN_MS = 240;
  let current = null;       // the render function on screen right now
  let screenHost = null;    // the layer it rendered into
  let footHost = null;

  /** Re-render the CURRENT screen in place — no slide, this is an edit. */
  function repaint() {
    if (!current || !screenHost) return;
    screenHost.innerHTML = "";
    footHost.innerHTML = "";
    current(screenHost, footHost);
  }

  /**
   * Move to another screen. `dir` +1 goes forward (new content slides in from
   * the right), -1 goes back. The old layer fades out UNDER the new one rather
   * than both cross-fading: the body is a fixed size, so a plain dissolve
   * between two full layouts reads as a flicker, while one sliding over the
   * other reads as a step. (Same reasoning as core/engine.js's own panel swap.)
   */
  function goto(render, dir = 1) {
    if (!alive()) return;
    const oldLayer = screenHost, oldFoot = footHost;
    screenHost = el("div", "aw-sd-layer");
    footHost = el("div", "aw-sd-footlayer");
    body.append(screenHost);
    foot.append(footHost);
    current = render;
    render(screenHost, footHost);

    if (!oldLayer) return;   // first paint — nothing to animate away from
    const dx = dir >= 0 ? 34 : -34;
    const outAnim = oldLayer.animate(
      [{ opacity: 1, transform: "translateX(0)" }, { opacity: 0, transform: `translateX(${-dx}px)` }],
      { duration: SCREEN_MS, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" });
    const inAnim = screenHost.animate(
      [{ opacity: 0, transform: `translateX(${dx}px)` }, { opacity: 1, transform: "translateX(0)" }],
      { duration: SCREEN_MS, easing: "cubic-bezier(.22,.75,.3,1)", fill: "forwards" });
    oldFoot?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: SCREEN_MS / 2, fill: "forwards" });
    footHost.animate([{ opacity: 0 }, { opacity: 1 }], { duration: SCREEN_MS, fill: "forwards" });
    whenDone(outAnim, () => { oldLayer.remove(); oldFoot?.remove(); }, SCREEN_MS + 120);
    whenDone(inAnim, () => { screenHost.style.transform = ""; screenHost.style.opacity = ""; }, SCREEN_MS + 120);
  }

  function btn(label, cls, onClick) {
    const b = el("button", "aw-btn " + cls, label);
    b.type = "button";
    b.onclick = () => onClick();
    return b;
  }

  /**
   * A question laid OVER the current screen — not a screen of its own, so the
   * popover never changes size to ask something, and the teacher can still see
   * what they are about to throw away behind it.
   */
  function askConfirm(text, okLabel, onOk) {
    if (body.querySelector(".aw-sd-confirm")) return;      // one at a time
    const layer = el("div", "aw-sd-confirm");
    const box = el("div", "aw-sd-confirmbox");
    const msg = el("div", "aw-sd-confirmtext");
    msg.textContent = text;
    const row = el("div", "aw-sd-confirmrow");
    const close = () => {
      const a = layer.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, easing: "ease-in", fill: "forwards" });
      whenDone(a, () => layer.remove(), 240);
    };
    row.append(
      btn("Cancel", "aw-sd-ghost", () => { sfx.back(); close(); }),
      btn(okLabel, "aw-btn-primary", () => { close(); onOk(); })
    );
    box.append(msg, row);
    layer.append(box);
    body.append(layer);
    layer.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, easing: "ease-out" });
    box.animate([{ transform: "scale(.94)" }, { transform: "scale(1)" }], { duration: 200, easing: "cubic-bezier(.22,.9,.3,1)" });
  }
  function hintEl(text) {
    const h = el("div", "aw-sd-hint");
    h.textContent = text;
    return h;
  }

  /** Held by ANOTHER screen — drawn, but dimmed and untouchable (Đợt 159). */
  function isTaken(t) {
    const c = setup.claims[t.id];
    return claimIsLive(c) && c.by !== me;
  }

  /**
   * How many pupils a team may hold — an EVEN SPLIT of the class, which is what
   * the teacher's own numbers work out to (Đợt 159b): a class of 20 gives
   * 2 teams → 10, 3 → 7, 4 → 5, 5 → 4. Derived rather than tabulated, so a class
   * of 12 or 30 gets the same fair division without another table to maintain.
   * It is also what the panel's HEIGHT is measured against, per layout.
   */
  function capPerTeam() {
    const n = setup.teams.length || 1;
    return Math.max(1, Math.ceil((roster.length || n) / n));
  }

  // ⛔ SCREEN C IS GONE (Đợt 159). A running Showdown used to open onto a little
  // "Single mode / Reset team" card of its own; the teacher asked for those two
  // as icons on the columns screen instead ("không cần bảng riêng"), so the
  // columns are now the home screen in every state. See paintHeadTools().

  // One implementation, two callers (Đợt 158): the panel's own buttons and the
  // mode picker in core/engine.js. `me` here IS browserId(), the same id the
  // exported function reads, so this is a rename and not a second rule.
  // (A function declaration, not `const releaseMine = releaseMyClaim`: the
  // screens above are defined before this point and a const would sit in the
  // temporal dead zone for anything that ran early.)
  function releaseMine() { return releaseMyClaim(); }

  // ---------------------------------------------------------------
  // SCREEN A — class + team count + the roster
  // ---------------------------------------------------------------
  function renderSetup(host, ft) {
    // The class list needs the full height back after a trip to the (shorter)
    // dividing screen — Reset comes back here.
    body.style.setProperty("--sd-body-h", "470px");
    const row = el("div", "aw-sd-pickrow");

    const cClass = el("div", "aw-sd-field");
    cClass.append(el("div", "aw-sd-flab", "Class"));
    const sel = el("select", "aw-sd-select is-big");
    if (!classes) {
      const o = el("option"); o.textContent = "Loading…"; sel.append(o); sel.disabled = true;
    } else if (!classes.length) {
      const o = el("option"); o.textContent = classErr || "No classes — add one in Settings"; sel.append(o); sel.disabled = true;
    } else {
      const ph = el("option"); ph.value = ""; ph.textContent = "— choose a class —"; sel.append(ph);
      classes.forEach(c => {
        const o = el("option");
        o.value = c.id;
        o.textContent = c.name;             // teacher's own text — never innerHTML
        sel.append(o);
      });
      sel.value = setup.classId || "";
    }
    sel.onchange = () => {
      const c = (classes || []).find(x => x.id === sel.value);
      setup.classId = c ? c.id : "";
      setup.className = c ? c.name : "";
      // A different class means a different set of people; anything typed in by
      // hand for the previous one goes with it, which is the only thing that is
      // not quietly wrong.
      roster = c ? c.students.map(s => ({ id: s.id, name: s.name })) : [];
      sfx.add();
      repaint();
    };
    cClass.append(sel);

    const cCount = el("div", "aw-sd-field is-narrow");
    cCount.append(el("div", "aw-sd-flab", "Teams"));
    const stepper = makeHStepper(teamCount, MIN_TEAMS, MAX_TEAMS,
      v => { teamCount = v; sfx.tap(); paintFoot(); }, { format: v => String(v) });
    stepper.el.classList.add("is-big");
    cCount.append(stepper.el);

    row.append(cClass, cCount);
    host.append(row);

    const listWrap = el("div", "aw-sd-roster" + (setup.classId ? "" : " is-empty"));
    if (!setup.classId) {
      listWrap.append(el("div", "aw-sd-empty-note", "Choose a class to see its pupils."));
    } else {
      roster.forEach((s, i) => {
        const r = el("div", "aw-sd-rmember");
        const nm = el("span", "aw-sd-rname");
        nm.textContent = s.name;
        const del = el("button", "aw-sd-x", icons.close);
        del.type = "button"; del.title = "Remove";
        del.onclick = () => {
          sfx.remove();
          // Animate the chip away BEFORE the list is rebuilt — otherwise the row
          // simply blinks out of existence and the teacher cannot tell which one
          // went.
          const a = r.animate(
            [{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(.7)" }],
            { duration: 160, easing: "ease-in", fill: "forwards" });
          whenDone(a, () => { roster.splice(i, 1); repaint(); }, 260);
        };
        r.append(nm, del);
        listWrap.append(r);
      });
      const add = el("button", "aw-sd-add", "+ Add member");
      add.type = "button";
      add.onclick = () => {
        sfx.tap();
        // An inline row rather than prompt(): prompt() is blocked in some
        // embedded views (myActivity's WebContentsView among them) and would
        // fail silently exactly where the teacher works.
        const r = el("div", "aw-sd-rmember is-new");
        const inp = el("input", "aw-sd-rinput");
        inp.placeholder = "Name";
        inp.maxLength = 40;
        let closed = false;
        const ok = () => {
          if (closed) return;
          closed = true;
          const v = inp.value.trim().replace(/\s+/g, " ");
          if (!v) { r.remove(); return; }
          roster.push({ id: localId("st"), name: v });
          sfx.add();
          repaint();
          // Make the newcomer announce itself — with 20 chips on screen, a
          // silently appended one is easy to miss.
          const chips = screenHost.querySelectorAll(".aw-sd-rmember");
          const last = chips[chips.length - 1];
          if (last) last.classList.add("is-pop");
        };
        inp.onkeydown = ev => { if (ev.key === "Enter") { ev.preventDefault(); ok(); } };
        inp.onblur = ok;
        r.append(inp);
        listWrap.insertBefore(r, add);
        r.animate([{ opacity: 0, transform: "scale(.8)" }, { opacity: 1, transform: "scale(1)" }],
          { duration: 160, easing: "ease-out" });
        inp.focus();
      };
      listWrap.append(add);
    }
    host.append(listWrap);
    paintFoot();

    function paintFoot() {
      ft.innerHTML = "";
      // ⭐ Đợt 159 — ONE TEAM IS THE WHOLE CLASS, so there is nothing to divide:
      // the button says READY and starts the mode from this screen (teacher:
      // "nếu chọn 1 team thì không next nữa mà hiện READY luôn"). Everything
      // about the dividing screen — the pool, the columns, the claim — belongs
      // to the 2+ case only.
      const solo = teamCount === 1;
      const canGo = !!setup.classId && roster.length >= teamCount;
      ft.append(
        hintEl(!setup.classId
          ? "Pick a class first."
          : roster.length < teamCount
            ? `${roster.length} pupil${roster.length === 1 ? "" : "s"} for ${teamCount} teams — add more, or use fewer teams.`
            : solo
              // Said plainly, because it is the one mode that behaves differently
              // from every other screen in this panel.
              ? `${roster.length} pupils · one team · this screen only`
              : `${roster.length} pupils · ${teamCount} teams`),
        btn(solo ? "Ready" : "Next", "aw-btn-primary" + (canGo ? "" : " is-dim"), () => {
          if (!canGo) {
            sfx.remove();
            toast(setup.classId ? "Not enough pupils for that many teams" : "Choose a class first");
            return;
          }
          if (solo) { sfx.ready(); applySolo(); return; }
          sfx.forward();
          // Keep any team the table already had (ids + names), only re-deal.
          setup.teams = splitIntoTeams([], teamCount, setup.teams);
          pool = roster.slice();
          selectedTeam = setup.teams[0]?.id || null;
          goto(renderBuild, +1);
        })
      );
    }
  }

  /**
   * ONE TEAM = the whole class, on THIS screen only (Đợt 159, teacher's rule:
   * "nếu chỉ có 1 team thì không lưu firebase nữa mà chỉ dùng ở trình duyệt
   * hiện tại thôi, không đồng bộ cho trình duyệt khác").
   *
   * So: no `saveSetup`, no claim, no team table. The pick alone — which lives in
   * sessionStorage — is the entire state of this mode.
   * ⚠️ It DOES release a claim this browser was holding: leaving a real team
   * behind without handing it back would hide it from the other screens for the
   * full 12h TTL. That write is cleanup of the PREVIOUS mode, not a sync of this
   * one.
   */
  function applySolo() {
    const pick = {
      teamId: SOLO_TEAM_ID,
      // The class's own name (teacher chose this over "Team 1"): with everyone
      // in one team, a team name that is not the class's tells nobody anything.
      teamName: setup.className || "Class",
      classId: setup.classId, className: setup.className,
      members: roster.map(m => ({ id: m.id, name: m.name }))
    };
    writePick(pick);
    releaseMine();               // fire-and-forget; see the note above
    stopWatch();
    onApply(pick);
  }

  // ---------------------------------------------------------------
  // SCREEN B — build the teams
  // ---------------------------------------------------------------
  function renderBuild(host, ft) {
    // ⭐⭐ Đợt 159b — TWO LAYOUTS, chosen by how many pupils a column can hold.
    // (Teacher, 15/8/2026, after seeing the first build scroll sideways.)
    //   2-3 teams → the pool stands on the RIGHT and the columns run tall down
    //               the left: a team of 10 (20 ÷ 2) or 7 (20 ÷ 3) needs height,
    //               and there is width to spare with so few columns.
    //   4-5 teams → the pool lies along the TOP, columns are short: 20 ÷ 4 = 5
    //               and 20 ÷ 5 = 4 per team, so height is cheap and width is not.
    // The columns SHARE whatever width the panel has (`flex: 1 1 0`), so no team
    // count can push the table sideways — the horizontal scrollbar the teacher
    // photographed came from columns with a stated px width.
    const n = setup.teams.length || MIN_TEAMS;
    const sideBySide = n <= 3;
    host.classList.add("aw-sd-build", sideBySide ? "is-side" : "is-top");
    // Each layout is only as tall as its own worst case — measured, see app.css.
    // ⚠️ On the BODY, not the layer: the layer is `inset: 0` inside it, so it is
    // the body that decides how tall the popover is. renderSetup puts it back.
    body.style.setProperty("--sd-body-h", sideBySide ? "470px" : "400px");
    // Chip text shrinks a little as the columns multiply so a full Vietnamese
    // name always fits — the teacher's rule is that a name is never cut.
    host.style.setProperty("--sd-chip-fs", (n >= 4 ? 13 : 14.5) + "px");

    const poolBox = el("div", "aw-sd-pool");
    const colsBox = el("div", "aw-sd-cols");
    // DOM order follows the layout: pool first when it is on top, columns first
    // when it stands to the right (so tab order matches what the eye reads).
    host.append(...(sideBySide ? [colsBox, poolBox] : [poolBox, colsBox]));

    paintPool();
    paintCols();
    paintFoot();

    function paintPool() {
      poolBox.innerHTML = "";
      poolBox.classList.toggle("is-empty", !pool.length);
      if (!pool.length) {
        poolBox.append(el("div", "aw-sd-empty-note", "Everyone is in a team."));
        return;
      }
      pool.forEach(m => {
        const chip = mkChip(m.name);
        chip.dataset.mid = m.id;
        chip.onclick = () => sendToTeam(m, chip);
        poolBox.append(chip);
      });
    }

    function paintCols() {
      colsBox.innerHTML = "";
      // ⭐ Đợt 159 — EVERY team is drawn, including the ones another screen has
      // taken; those are DIMMED and inert (teacher: "đội đã được chọn và Ready
      // rồi sẽ có màu nhạt để thể hiện không chọn được nữa"). This REVERSES the
      // Đợt 156 rule that hid them: a second screen opening the panel now sees
      // the whole line-up and simply cannot touch what is spoken for — which is
      // also the only way it can see WHICH teams are left without guessing.
      setup.teams.forEach(t => {
        const c = setup.claims[t.id];
        const taken = claimIsLive(c) && c.by !== me;
        const col = el("div", "aw-sd-col"
          + (t.id === selectedTeam && !taken ? " is-sel" : "")
          + (t.id === claimedTeam ? " is-claimed" : "")
          + (taken ? " is-taken" : ""));
        col.dataset.tid = t.id;
        // Tapping ANYWHERE in the column selects it (teacher: "bấm vào vùng
        // trống bất kỳ trong cột team cũng cho phép chọn cột team"). The tick
        // and the name chips stop the click before it gets here.
        if (!taken) col.onclick = () => { if (selectedTeam !== t.id) { selectedTeam = t.id; sfx.tap(); paintCols(); } };

        const head = el("div", "aw-sd-colhead");
        const nameBtn = el("button", "aw-sd-colname");
        nameBtn.type = "button";
        nameBtn.textContent = t.name;
        nameBtn.title = taken ? "Taken on another screen" : "Tap to send pupils here";
        nameBtn.disabled = taken;

        const tick = el("button", "aw-sd-tick" + (t.id === claimedTeam ? " is-on" : ""), taken ? icons.close : icons.check);
        tick.type = "button";
        tick.title = taken ? "Taken on another screen" : "This screen plays this team";
        tick.disabled = taken;
        tick.onclick = ev => {
          ev.stopPropagation();                 // not "select the column" as well
          const taking = claimedTeam !== t.id;
          claimedTeam = taking ? t.id : null;
          selectedTeam = t.id;
          taking ? sfx.claim() : sfx.lift();
          paintCols(); paintFoot();
          if (taking) {
            const c2 = colsBox.querySelector(`[data-tid="${CSS.escape(t.id)}"]`);
            c2?.animate([{ transform: "scale(1)" }, { transform: "scale(1.035)" }, { transform: "scale(1)" }],
              { duration: 260, easing: "ease-out" });
          }
        };
        head.append(nameBtn, tick);
        col.append(head);

        const list = el("div", "aw-sd-colmembers");
        t.members.forEach(m => {
          const chip = mkChip(m.name);
          chip.dataset.mid = m.id;
          chip.classList.add("is-in");
          chip.title = taken ? "" : "Tap to send back";
          chip.disabled = taken;
          chip.onclick = ev => { ev.stopPropagation(); backToPool(t, m, chip); };
          list.append(chip);
        });
        col.append(list);
        colsBox.append(col);
      });
    }

    // ⭐ Đợt 159b — THE BOTTOM ROW IS THE WHOLE CHROME NOW (teacher): the tools on
    // the left, the title in the middle, Ready on the right, and NO instruction
    // line ("bỏ mấy câu hướng dẫn đi"). The head row above the table is gone with
    // it, which is where the height for a taller table came from.
    function paintFoot() {
      ft.innerHTML = "";
      const ready = !pool.length && !!claimedTeam;
      const tools = el("div", "aw-sd-foottools");
      const mk = (svg, title, onClick) => {
        const b = el("button", "aw-sd-htool", svg);
        b.type = "button"; b.title = title; b.setAttribute("aria-label", title);
        b.onclick = onClick;
        tools.append(b);
        return b;
      };
      mk(icons.single, "Single mode", () => {
        sfx.tap();
        askConfirm("Leave Showdown? This screen's team goes back to the others.", "Single mode", () => {
          sfx.back();
          clearPick();
          releaseMine();          // fire-and-forget: the play restarts either way
          onTurnOff();
        });
      });
      mk(icons.refresh, "Reset teams", () => {
        sfx.tap();
        askConfirm("Divide the class again? The teams built here are dropped.", "Reset", async () => {
          sfx.forward();
          clearPick();
          await releaseMine();
          await boot({ rebuild: true });
        });
      });
      // ONE seat, TWO jobs (teacher): deal the class out while anybody is still
      // waiting, call everybody back once nobody is. The two can never both apply,
      // so they share a button rather than one of them sitting dead.
      if (pool.length) {
        mk(icons.wand, "Random teams", () => { sfx.forward(); randomDeal(); });
      } else {
        mk(icons.duplicate, "Send everyone back", () => {
          sfx.tap();
          askConfirm("Send every pupil back to the class list?", "Send back", () => { sfx.back(); flyBackAll(); });
        });
      }
      const title = el("div", "aw-sd-foottitle", "Showdown");
      ft.append(tools, title,
        // ⚠️ NO "Back" (teacher, Đợt 159): once the class has been divided, the
        // way to the first screen is RESET — because going back silently was a
        // one-tap route to re-dealing a line-up the other screens had already
        // claimed teams from.
        btn("Ready", "aw-sd-ready aw-btn-primary" + (ready ? "" : " is-dim"), () => {
          if (!ready) {
            sfx.remove();
            toast(pool.length ? "Put every pupil in a team" : "Tick the team this screen plays");
            return;
          }
          sfx.ready();
          applyReady();
        })
      );
    }

    /** Everyone still waiting, dealt out evenly and in a random order. */
    function randomDeal() {
      const cap = capPerTeam();
      // Fisher-Yates on a copy: `pool` itself is spliced below, and shuffling in
      // place while reading it is how a "random" deal quietly stops being one.
      const bag = pool.slice();
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
      bulkMove(() => {
        // Deal round-robin starting from the emptiest team, so a half-built
        // table is levelled up rather than having the rest piled on the end.
        const order = setup.teams.filter(t => !isTaken(t)).sort((a, b) => a.members.length - b.members.length);
        if (!order.length) return;
        let placed = 0;
        for (const m of bag) {
          const target = order.filter(t => t.members.length < cap).sort((a, b) => a.members.length - b.members.length)[0];
          if (!target) break;                     // every team full — leave the rest waiting
          target.members.push(m);
          pool = pool.filter(x => x !== m);
          placed++;
        }
        if (!placed) toast("Every team is full");
      });
    }

    /** Everybody out of the columns and back into the class list. */
    function flyBackAll() {
      bulkMove(() => {
        setup.teams.forEach(t => {
          if (isTaken(t)) return;                 // not ours to empty
          pool.push(...t.members);
          t.members = [];
        });
      });
    }

    /**
     * Move a lot of chips at once and let the eye follow them.
     * FLIP again (same idea as `fly`), but for the whole board: measure every
     * chip, mutate, repaint, then fly a ghost per chip that actually moved.
     * ⚠️ The real chip is HIDDEN until its ghost lands — with one chip the
     * duplicate is unnoticeable, with twenty it reads as the board doubling.
     */
    function bulkMove(mutate) {
      const before = new Map();
      host.querySelectorAll("[data-mid]").forEach(c => before.set(c.dataset.mid, c.getBoundingClientRect()));
      mutate();
      paintPool(); paintCols(); paintFoot();
      const moved = [];
      host.querySelectorAll("[data-mid]").forEach(c => {
        const from = before.get(c.dataset.mid);
        if (!from) return;
        const to = c.getBoundingClientRect();
        if (Math.abs(from.left - to.left) < 2 && Math.abs(from.top - to.top) < 2) return;
        moved.push({ c, from, to });
      });
      if (!moved.length) return;
      moved.forEach(({ c, from, to }, i) => {
        c.style.visibility = "hidden";
        // A small stagger so twenty chips read as a flock, not a jump cut. Capped
        // so a big class never turns it into a slow parade.
        const delay = Math.min(i * 16, 260);
        setTimeout(() => {
          fly(from, to, c.textContent);
          // Reveal exactly when the ghost arrives (fly's own duration), with the
          // usual belt-and-braces timeout — a hidden tab must not leave the board
          // half invisible.
          setTimeout(() => { c.style.visibility = ""; }, 280);
        }, delay);
      });
      sfx.land();
    }

    // ---- the flying chip ----
    // FLIP: measure where the chip is now, rebuild the lists, measure where its
    // replacement landed, then animate a CLONE across the gap. Animating the
    // real node is impossible — it is destroyed by the repaint.
    function fly(fromRect, toRect, label) {
      if (!fromRect || !toRect) return;
      const ghost = mkChip(label);
      ghost.classList.add("aw-sd-ghost-chip");
      // ⚠️ The ghost is appended to <body>, OUTSIDE the layer that defines
      // `--sd-chip-fs`, so it would fly at the 15px default while the chips it
      // is standing in for are smaller. Carry the size across by hand.
      ghost.style.fontSize = getComputedStyle(host).getPropertyValue("--sd-chip-fs") || "";
      ghost.style.left = fromRect.left + "px";
      ghost.style.top = fromRect.top + "px";
      ghost.style.width = fromRect.width + "px";
      ghost.style.height = fromRect.height + "px";
      document.body.append(ghost);
      const anim = ghost.animate([
        { transform: "translate(0,0) scale(1)" },
        { transform: `translate(${(toRect.left - fromRect.left) * 0.5}px, ${(toRect.top - fromRect.top) * 0.5}px) scale(1.07)`, offset: 0.5 },
        { transform: `translate(${toRect.left - fromRect.left}px, ${toRect.top - fromRect.top}px) scale(1)` }
      ], { duration: 280, easing: "cubic-bezier(.22,.75,.3,1)", fill: "forwards" });
      // A hidden/backgrounded tab never fires `onfinish` (Chromium freezes rAF),
      // and a ghost left on top of the page would swallow every later tap.
      whenDone(anim, () => ghost.remove(), 440);
    }

    function findChip(box, mid) { return box.querySelector(`[data-mid="${CSS.escape(mid)}"]`); }

    function sendToTeam(m, chipEl) {
      const team = setup.teams.find(t => t.id === selectedTeam);
      if (!team) { sfx.remove(); toast("Tap a team first"); return; }
      // The cap is not decoration: each layout's height is measured for exactly
      // an even split of the class, so letting one more in is what would put a
      // scrollbar back (Đợt 159b — see capPerTeam).
      const cap = capPerTeam();
      if (team.members.length >= cap) {
        sfx.remove();
        toast(`A team holds at most ${cap} pupils`);
        return;
      }
      const from = chipEl.getBoundingClientRect();
      pool = pool.filter(x => x !== m);
      team.members.push(m);
      sfx.land();
      // ⚠️ paintFoot() TOO, not just the two lists. Measured without it: every
      // pupil could be placed and the footer still read "9 pupils left" with
      // READY greyed out — the mode was unreachable and nothing said why. The
      // footer is derived state; anything that changes `pool` or the claim has
      // to repaint it.
      paintPool(); paintCols(); paintFoot();
      const landed = findChip(colsBox, m.id);
      fly(from, landed?.getBoundingClientRect(), m.name);
    }

    function backToPool(team, m, chipEl) {
      const from = chipEl.getBoundingClientRect();
      team.members = team.members.filter(x => x !== m);
      pool.push(m);
      sfx.lift();
      paintPool(); paintCols(); paintFoot();
      const landed = findChip(poolBox, m.id);
      fly(from, landed?.getBoundingClientRect(), m.name);
    }
  }

  function mkChip(label) {
    const c = el("button", "aw-sd-chip");
    c.type = "button";
    c.textContent = label;          // pupil name — never innerHTML
    return c;
  }

  async function applyReady() {
    const team = setup.teams.find(t => t.id === claimedTeam);
    if (!team) return;
    const pick = {
      teamId: team.id, teamName: team.name,
      classId: setup.classId, className: setup.className,
      members: team.members.map(m => ({ id: m.id, name: m.name }))
    };
    // Store the pick FIRST: it is what the restart reads, and the lesson has to
    // start even if the network is having a bad day.
    writePick(pick);
    try {
      const next = { ...setup, claims: { ...setup.claims } };
      // Drop any claim of ours elsewhere before taking this one — a browser
      // holds at most one team, and a stale self-claim would hide a team from
      // everybody until the TTL ran out.
      Object.entries(next.claims).forEach(([tid, c]) => { if (c.by === me) delete next.claims[tid]; });
      next.claims[team.id] = { by: me, at: Date.now() };
      await saveSetup(next);
    } catch (e) {
      toast(e?.code === "aw/signed-out" ? "Signed out — table not shared" : "Could not share the table");
    }
    stopWatch();
    onApply(pick);
  }

  // ---------------------------------------------------------------
  // BOOT
  // ---------------------------------------------------------------
  async function boot({ rebuild = false } = {}) {
    goto(renderSetup, rebuild ? -1 : +1);   // draws the "Loading…" state at once

    let loaded = null;
    try { loaded = await loadSetup({ fresh: true }); } catch { /* reported via the class list */ }
    try {
      const { listClasses } = await import("./classes.js");
      classes = await listClasses();
    } catch (e) {
      classes = [];
      classErr = e?.code === "aw/signed-out" ? "Sign in to use your classes" : "Could not load your classes";
    }
    if (!alive()) return;                   // dismissed while we waited

    if (loaded) {
      setup = loaded;
      // ⚠️ Only a table that ACTUALLY HAS teams overrides the opening default.
      // `loadSetup()` answers with a normalized EMPTY table when the document
      // does not exist, so `loaded.teams.length || MIN_TEAMS` used to hand back
      // MIN_TEAMS for a brand-new teacher — harmless while that was 2, and from
      // Đợt 159 it silently opened every fresh setup on one-team mode.
      if (loaded.teams.length) teamCount = Math.max(MIN_TEAMS, Math.min(MAX_TEAMS, loaded.teams.length));
      const c = (classes || []).find(x => x.id === loaded.classId);
      if (c) roster = c.students.map(s => ({ id: s.id, name: s.name }));
      // A table built earlier already knows its people; prefer THOSE (the
      // teacher may have deleted or hand-added some) over the raw register.
      const saved = loaded.teams.flatMap(t => t.members);
      if (saved.length) roster = saved.map(m => ({ id: m.id, name: m.name }));
    }

    // ⭐ Đợt 159 — WHERE THIS PANEL LANDS.
    // Once a table has been built, the COLUMNS are the home screen — for the
    // browser that built it and, just as importantly, for every other one
    // (teacher: "khi các tab khác mở ra sẽ hiển thị luôn các cột đội"). The
    // first screen is reached again only through RESET, which asks first.
    // Two exceptions land on the first screen instead:
    //   · `rebuild` — Reset itself, which is a deliberate trip back;
    //   · a SOLO pick — one-team mode never built a table, and its own screen
    //     (class + a Teams stepper reading 1) is where it is changed.
    const solo = ctx.currentTeam?.teamId === SOLO_TEAM_ID;
    if (solo) {
      // One-team mode never writes to Firestore, so `loaded` knows nothing about
      // it — the PICK is the only record of which class is playing. Reopening
      // the panel without this showed "— choose a class —" and an empty roster
      // over a mode that was very much running (measured, Đợt 159).
      teamCount = 1;
      if (ctx.currentTeam.classId) {
        setup.classId = ctx.currentTeam.classId;
        setup.className = ctx.currentTeam.className || setup.className;
      }
      if (ctx.currentTeam.members?.length) {
        roster = ctx.currentTeam.members.map(m => ({ id: m.id, name: m.name }));
      }
    }
    const built = setup.teams.length > 0 && setup.teams.some(t => t.members.length);
    if (!rebuild && built && !solo) {
      // Everyone is already placed, so there is no pool to rebuild; the claim is
      // whichever team this browser holds — from the live pick if it has one,
      // otherwise from the shared table (a browser can hold a team it has not
      // pressed Ready on yet).
      pool = [];
      claimedTeam = (ctx.currentTeam && setup.teams.some(t => t.id === ctx.currentTeam.teamId))
        ? ctx.currentTeam.teamId
        : (Object.entries(setup.claims).find(([, c]) => c.by === me && claimIsLive(c)) || [null])[0];
      selectedTeam = null;
      goto(renderBuild, +1);
    } else {
      repaint();
    }

    // Watch for claims made on other screens while this panel is open.
    watchForClose();
    unsub = subscribeSetup(next => {
      if (!alive()) { stopWatch(); return; }
      setup.claims = next.claims;
      // Someone else took the team we had selected/ticked — drop it rather than
      // let the teacher press Ready on a team that is no longer theirs.
      const taken = id => { const c = setup.claims[id]; return claimIsLive(c) && c.by !== me; };
      if (selectedTeam && taken(selectedTeam)) selectedTeam = null;
      if (claimedTeam && taken(claimedTeam)) { claimedTeam = null; toast("That team was taken on another screen"); }
      if (current === renderBuild) repaint();
    });
  }

  boot();
}
