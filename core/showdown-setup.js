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
import { MIN_TEAMS, MAX_TEAMS, browserId, writePick, clearPick } from "./showdown.js";

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

/** Teams this browser may see: unclaimed, expired, or claimed by us. */
export function visibleTeams(setup, me, now = Date.now()) {
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
 *   isOn      is Showdown already running in this browser (→ screen C)
 *   onApply   (pick) => void  — engine restarts the play; pick already stored
 *   onTurnOff () => void
 *   toast     the engine's toast
 */
export function buildShowdownPanel(panel, ctx) {
  const { isOn, onApply, onTurnOff, toast } = ctx;
  const me = browserId();

  // One fixed-size body for EVERY screen (see the header note) plus a footer.
  // Nothing below ever replaces `body` or `foot` themselves — screens render
  // into a LAYER inside them, which is what makes the cross-fade possible.
  const body = el("div", "aw-sd-body");
  const foot = el("div", "aw-sd-foot");
  panel.append(body, foot);

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
  let teamCount = MIN_TEAMS;
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
  function hintEl(text) {
    const h = el("div", "aw-sd-hint");
    h.textContent = text;
    return h;
  }

  // ---------------------------------------------------------------
  // SCREEN C — already running
  // ---------------------------------------------------------------
  function renderRunning(host, ft) {
    stopWatch();
    body.classList.add("is-mini");
    const t = ctx.currentTeam;
    const box = el("div", "aw-sd-running");
    const nm = el("div", "aw-sd-running-team");
    nm.textContent = t ? t.teamName : "Showdown";
    const who = el("div", "aw-sd-running-who");
    who.textContent = t ? t.members.map(m => m.name).join(" · ") : "";
    box.append(nm, who);
    host.append(box);

    ft.append(
      btn("Single mode", "aw-sd-ghost", () => { sfx.back(); clearPick(); releaseMine(); onTurnOff(); }),
      btn("Reset team", "aw-btn-primary", async () => {
        sfx.forward();
        clearPick();
        await releaseMine();
        body.classList.remove("is-mini");
        await boot({ rebuild: true });
      })
    );
  }

  async function releaseMine() {
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
  // SCREEN A — class + team count + the roster
  // ---------------------------------------------------------------
  function renderSetup(host, ft) {
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
      const canNext = !!setup.classId && roster.length >= teamCount;
      ft.append(
        hintEl(!setup.classId
          ? "Pick a class first."
          : roster.length < teamCount
            ? `${roster.length} pupil${roster.length === 1 ? "" : "s"} for ${teamCount} teams — add more, or use fewer teams.`
            : `${roster.length} pupils · ${teamCount} teams`),
        btn("Next", "aw-btn-primary" + (canNext ? "" : " is-dim"), () => {
          if (!canNext) {
            sfx.remove();
            toast(setup.classId ? "Not enough pupils for that many teams" : "Choose a class first");
            return;
          }
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

  // ---------------------------------------------------------------
  // SCREEN B — build the teams
  // ---------------------------------------------------------------
  function renderBuild(host, ft) {
    const poolBox = el("div", "aw-sd-pool");
    const colsBox = el("div", "aw-sd-cols");
    host.append(poolBox, colsBox);

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
      // Only the teams this browser may touch: one claimed elsewhere is not
      // shown at all (the teacher's rule), so it can neither be edited nor taken.
      const mine = visibleTeams(setup, me);
      if (!mine.length) {
        colsBox.append(el("div", "aw-sd-empty-note", "Every team is already taken on another screen."));
        return;
      }
      mine.forEach(t => {
        const col = el("div", "aw-sd-col" + (t.id === selectedTeam ? " is-sel" : "") + (t.id === claimedTeam ? " is-claimed" : ""));
        col.dataset.tid = t.id;

        const head = el("div", "aw-sd-colhead");
        const nameBtn = el("button", "aw-sd-colname");
        nameBtn.type = "button";
        nameBtn.textContent = t.name;
        nameBtn.title = "Tap to send pupils here";
        nameBtn.onclick = () => { selectedTeam = t.id; sfx.tap(); paintCols(); };

        const tick = el("button", "aw-sd-tick" + (t.id === claimedTeam ? " is-on" : ""), icons.check);
        tick.type = "button";
        tick.title = "This screen plays this team";
        tick.onclick = () => {
          const taking = claimedTeam !== t.id;
          claimedTeam = taking ? t.id : null;
          selectedTeam = t.id;
          taking ? sfx.claim() : sfx.lift();
          paintCols(); paintFoot();
          if (taking) {
            const c = colsBox.querySelector(`[data-tid="${CSS.escape(t.id)}"]`);
            c?.animate([{ transform: "scale(1)" }, { transform: "scale(1.035)" }, { transform: "scale(1)" }],
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
          chip.title = "Tap to send back";
          chip.onclick = () => backToPool(t, m, chip);
          list.append(chip);
        });
        col.append(list);
        colsBox.append(col);
      });
    }

    function paintFoot() {
      ft.innerHTML = "";
      const ready = !pool.length && !!claimedTeam;
      ft.append(
        hintEl(pool.length
          ? `${pool.length} pupil${pool.length === 1 ? "" : "s"} left — tap a team name, then tap a pupil.`
          : !claimedTeam
            ? "Tick the team THIS screen plays."
            : `This screen plays ${(setup.teams.find(t => t.id === claimedTeam) || {}).name}.`),
        btn("Back", "aw-sd-ghost", () => { sfx.back(); goto(renderSetup, -1); }),
        btn("Ready", "aw-btn-primary" + (ready ? "" : " is-dim"), () => {
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

    // ---- the flying chip ----
    // FLIP: measure where the chip is now, rebuild the lists, measure where its
    // replacement landed, then animate a CLONE across the gap. Animating the
    // real node is impossible — it is destroyed by the repaint.
    function fly(fromRect, toRect, label) {
      if (!fromRect || !toRect) return;
      const ghost = mkChip(label);
      ghost.classList.add("aw-sd-ghost-chip");
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
      if (!team) { sfx.remove(); toast("Tap a team name first"); return; }
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
    if (isOn && !rebuild) { goto(renderRunning, +1); return; }

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
      teamCount = Math.max(MIN_TEAMS, Math.min(MAX_TEAMS, loaded.teams.length || MIN_TEAMS));
      const c = (classes || []).find(x => x.id === loaded.classId);
      if (c) roster = c.students.map(s => ({ id: s.id, name: s.name }));
      // A table built earlier already knows its people; prefer THOSE (the
      // teacher may have deleted or hand-added some) over the raw register.
      const saved = loaded.teams.flatMap(t => t.members);
      if (saved.length) roster = saved.map(m => ({ id: m.id, name: m.name }));
    }
    repaint();

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
