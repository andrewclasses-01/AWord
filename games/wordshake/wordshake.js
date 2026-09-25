// =============================================================
// A SHOW SPEED (was "Wordshake", renamed Đợt 387 — the code keeps the id
// `wordshake` so old links/acts still open) — FIXED GAME of AWord's GAMES tree (Đợt 386, 25/9/2026).
// Not a template (see games/games.js): opened with ?g=wordshake, always a
// two-team FIGHT on the classroom touch screen.
//
// Rules (thầy, 25/9/2026, design v1…v4 in D:\OTHERS\CLAUDE\AWord - thiet ke Wordshake\):
//   • both teams get the SAME 16 letters, each board shuffled differently;
//   • any tile, any order (no adjacency), each tile once per word, 3–7 letters;
//   • 3→1 · 4→2 · 5→3 · 6→4 · 7→5 points;
//   • a word one team has found is TAKEN — the other team cannot score it;
//   • the centre board shows the word just found, big, with its Vietnamese
//     meaning, and both teams' words in two columns (left team left);
//   • time's up → winner + the everyday words both teams missed.
// Dictionary + dice + sound live in templates/wordshake/ws-lib.js (shared
// with the activity template's Mode 3).
//
//   mountWordshake(root, ctx) -> dispose()      ctx.onExit()
// Home (Đợt 387): while playing → "End this game?" → this game's start screen;
// on the result screen → start screen; on the start screen → ctx.onExit (GAMES).
// =============================================================

import { loadDict, lookup, points, rollBoard, wordsOn, shuffle, createSfx, escapeHtml as esc } from "../../templates/wordshake/ws-lib.js";

// Đợt 387 (thầy, 25/9/2026): the score strip was too tall and pushed the boards
// down, out of the children's reach — strip boxes 62 → 40px, boards row up from
// y 89 to 56, tool buttons 44 → 29px (2/3), so the drawing is 566 → 508 tall.
const W = 1280, H = 508;                        // AWord fight geometry at 1280px
const Y = 56, BH = 408;                          // boards row
const L = { x: 12, w: 392 }, C = { x: 420, w: 440 }, R = { x: 876, w: 392 };
const TIMES = [120, 180, 300];
const PREF = "aword-wordshake-time";
const FLICKER = "ABCDEEFGHIKLMNOOPRSTUWY";
const ICON = {
  home: '<svg class="i" viewBox="0 0 24 24"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .7-1.53l7-6a2 2 0 0 1 2.6 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/></svg>',
  vol: '<svg class="i" viewBox="0 0 24 24"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/></svg>',
  mute: '<svg class="i" viewBox="0 0 24 24"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="m22 9-6 6"/><path d="m16 9 6 6"/></svg>'
};

export function mountWordshake(root, ctx = {}) {
  root.classList.add("wsg");
  root.innerHTML = `<div class="wsg-vp"><div class="wsg-cv"></div></div>`;
  const vp = root.querySelector(".wsg-vp"), cv = root.querySelector(".wsg-cv");
  const sfx = createSfx();
  let dead = false, dict = null, dictErr = false;
  let dur = readTime();
  // Đợt 387 — double-tap a time chip: only that chip, in the centre; swipe up
  // +1 min, down −1 min (1…10), mouse wheel too. Double-tap again: the three
  // usual chips, with the chip first double-tapped chosen (`soloBase`).
  let solo = false, soloBase = dur, lastTap = { t: 0, at: 0 };
  const T_MIN = 60, T_MAX = 600, DOUBLE_MS = 380, SWIPE_PX = 26;
  // phase: "ready" | "play" | "over"
  // ask: the "End this game?" box is open (the clock stands still under it)
  const G = { phase: "ready", letters: [], sides: [], found: new Map(), log: [], last: null, left: dur, prev: [0, 0], ask: false };
  let clock = null, shakeIv = null;

  function readTime() { try { const v = +localStorage.getItem(PREF); return TIMES.includes(v) ? v : 180; } catch (e) { return 180; } }
  function saveTime(v) { try { localStorage.setItem(PREF, String(v)); } catch (e) {} }

  // ---------- fit the 1280x566 drawing into the page ----------
  function fit() {
    if (dead) return;
    const top = vp.getBoundingClientRect().top;
    const availH = Math.max(240, window.innerHeight - Math.max(0, top) - 8);
    const availW = Math.max(240, root.clientWidth - 24);
    const s = Math.min(availW / W, availH / H);
    vp.style.width = W * s + "px"; vp.style.height = H * s + "px";
    cv.style.transform = `scale(${s})`;
  }
  const ro = new ResizeObserver(fit); ro.observe(root);
  window.addEventListener("resize", fit);

  // ---------- game flow ----------
  function newBoard() {
    G.letters = rollBoard(dict, { easy: true });
    G.sides = [0, 1].map(() => ({ order: shuffle([...Array(16).keys()]), sel: [], score: 0 }));
    G.found = new Map(); G.log = []; G.last = null; G.left = dur; G.prev = [0, 0];
  }
  function start() {
    if (!dict) return;
    sfx.unlock();
    newBoard(); G.phase = "play";
    render(); shake();
    clearInterval(clock); clock = setInterval(tick, 1000);
  }
  function shake() {
    const tiles = [...cv.querySelectorAll(".wsg-t")], real = tiles.map(t => t.textContent);
    let n = 0; root.classList.add("shaking"); sfx.shake();
    clearInterval(shakeIv);
    shakeIv = setInterval(() => {
      tiles.forEach(t => { if (t.isConnected) t.textContent = FLICKER[Math.random() * FLICKER.length | 0]; });
      if (++n >= 14) { clearInterval(shakeIv); root.classList.remove("shaking"); tiles.forEach((t, i) => { if (t.isConnected) t.textContent = real[i]; }); }
    }, 50);
  }
  function tick() {
    if (G.phase !== "play" || G.ask) return;
    G.left--;
    if (G.left <= 0) { G.left = 0; return finish(); }
    const c = cv.querySelector(".wsg-clock");
    if (c) { c.querySelector("span").textContent = fmt(G.left); if (G.left <= 10) c.classList.add("warn"); }
    sfx.countdown(G.left);   // bell, last 10 s only
  }
  // Home (Đợt 387): back to this game's own start screen, not to the GAMES tree.
  function toReady() {
    clearInterval(clock); clearInterval(shakeIv); root.classList.remove("shaking");
    G.phase = "ready"; G.sides = []; G.left = dur; G.ask = false;
    render();
  }
  function finish() {
    clearInterval(clock); G.phase = "over";
    G.sides.forEach(s => s.sel = []);
    render();
    const [a, b] = G.sides.map(s => s.score);
    sfx.timeup(); if (a !== b) sfx.win(b > a ? .65 : -.65);
  }
  const fmt = s => String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
  const pan = side => side ? .65 : -.65;

  function submit(side) {
    const s = G.sides[side];
    const w = s.sel.map(k => G.letters[s.order[k]]).join("").toLowerCase();
    if (!w) return;
    s.sel = [];
    const hit = lookup(dict, w);
    // Đợt 387 — a wrong / already-found word touches ONLY this team's board (its
    // "?" / Taken bubble): redrawing everything replayed the centre word's pop.
    if (!hit) { sfx.bad(pan(side)); renderSide(side); return bubble(side, "bad", "?"); }
    if (G.found.has(w)) { sfx.dup(pan(side)); renderSide(side); return bubble(side, "dup", G.found.get(w) === side ? "Found" : "Taken"); }
    const p = points(w.length);
    G.found.set(w, side); s.score += p;
    // The word on show stays OUT of the lists while it is big in the centre; the
    // next word found sends it flying to the top of its team's column.
    const prev = G.last, from = prev ? flyStart() : null;
    if (prev) G.log.unshift(prev);
    G.last = { w, side, m: hit.m, base: hit.base, p };
    G.pop = true;
    sfx.ok(pan(side), p);
    render(); bubble(side, "ok", "+" + p);
    if (prev) flyToList(prev, from);
  }

  // ---------- Đợt 387: the old centre word flies into its team's column ----------
  // Positions in the 1280-wide drawing (cv is scaled by fit()).
  function cvRect(elm) {
    const c = cv.getBoundingClientRect(), r = elm.getBoundingClientRect(), s = c.width / W || 1;
    return { x: (r.left - c.left) / s, y: (r.top - c.top) / s, w: r.width / s, h: r.height / s };
  }
  // Taken BEFORE the redraw: where the big word is, and where every listed word sits.
  function flyStart() {
    const big = cv.querySelector(".wsg-last .wt");
    const tops = new Map();
    cv.querySelectorAll(".wsg-cols li[data-w]").forEach(li => tops.set(li.dataset.w, cvRect(li).y));
    return { big: big ? cvRect(big) : null, fs: big ? parseFloat(getComputedStyle(big).fontSize) : 52, tops };
  }
  function flyToList(f, from) {
    const li = cv.querySelector(`.wsg-cols .c${f.side} li[data-w="${f.w}"]`);
    if (!li || !from || !from.big) return;
    // the words already listed slide down to make room
    cv.querySelectorAll(`.wsg-cols .c${f.side} li[data-w]`).forEach(o => {
      if (o === li || !from.tops.has(o.dataset.w)) return;
      const dy = from.tops.get(o.dataset.w) - cvRect(o).y;
      if (dy) o.animate([{ transform: `translateY(${dy}px)` }, { transform: "none" }], { duration: 420, easing: "cubic-bezier(.22,.9,.3,1)" });
    });
    // the word itself: a copy flies from the centre down onto its row, then the row shows
    // Both ends measured as glyph boxes (line-height 1): the big word is drawn
    // with line-height 1, the row's word is centred in its taller line.
    const b = li.querySelector("b"), to = cvRect(b), a = from.big;
    const fsTo = parseFloat(getComputedStyle(b).fontSize), k = fsTo / from.fs;
    const ty = to.y + (to.h - fsTo) / 2;
    const fly = document.createElement("div");
    fly.className = "wsg-fly sd" + f.side; fly.textContent = f.w.toUpperCase();
    fly.style.cssText = `left:${a.x}px;top:${a.y + (a.h - from.fs) / 2}px;font-size:${from.fs}px`;
    cv.append(fly);
    li.classList.add("landing");
    const anim = fly.animate([
      { transform: "none" },
      { transform: `translate(${to.x - a.x}px,${ty - (a.y + (a.h - from.fs) / 2)}px) scale(${k})` }
    ], { duration: 520, easing: "cubic-bezier(.5,0,.3,1)", fill: "forwards" });
    anim.onfinish = () => { fly.remove(); li.classList.remove("landing"); };
  }

  // ---------- drawing ----------
  function render() {
    if (dead) return;
    const [a, b] = G.sides.length ? G.sides.map(s => s.score) : [0, 0];
    const bump = [a > G.prev[0], b > G.prev[1]]; G.prev = [a, b];
    const warn = G.phase === "play" && G.left <= 10;
    root.classList.toggle("asking", G.ask);
    cv.innerHTML =
      `<div class="wsg-hudline"></div>` +
      `<div class="wsg-score ${a > b ? "lead" : ""} ${bump[0] ? "bump" : ""}" style="left:${L.x + L.w / 2}px"><b>${a}</b></div>` +
      `<div class="wsg-clock ${warn ? "warn" : ""}"><span>${fmt(G.phase === "ready" ? dur : G.left)}</span></div>` +
      `<div class="wsg-score s1 ${b > a ? "lead" : ""} ${bump[1] ? "bump" : ""}" style="left:${R.x + R.w / 2}px"><b>${b}</b></div>` +
      stage(L, sideHtml(0), 0) + stage(C, centreHtml(), null) + stage(R, sideHtml(1), 1) +
      `<div class="wsg-tools" style="top:${Y + BH + 10}px">` +
        `<button class="wsg-tool" data-do="home" title="${G.phase === "ready" ? "Back to Games" : "Start screen"}" aria-label="${G.phase === "ready" ? "Back to Games" : "Start screen"}"><span>${ICON.home}</span></button>` +
        `<button class="wsg-tool ${sfx.on ? "" : "off"}" data-do="sound" title="Sound" aria-label="Sound"><span>${sfx.on ? ICON.vol : ICON.mute}</span></button>` +
      `</div>` +
      (G.ask ? `<div class="wsg-ask"><div class="wsg-askbox"><div class="q">End this game?</div>` +
        `<div class="a"><button class="wsg-b clr" data-do="no"><span>No</span></button>` +
        `<button class="wsg-b ent" data-do="yes"><span>Yes</span></button></div></div></div>` : "");
  }
  const stage = (g, inner, side) =>
    `<div class="wsg-stage" ${side != null ? `data-side="${side}"` : ""} style="left:${g.x}px;top:${Y}px;width:${g.w}px;height:${BH}px">${inner}</div>`;

  function sideHtml(side) {
    const live = G.phase === "play";
    const s = G.sides[side];
    const T = 58, gap = 8, gw = T * 4 + gap * 3;
    const tiles = [...Array(16).keys()].map(k => {
      const ch = s ? G.letters[s.order[k]] : "?";
      const on = s && s.sel.includes(k);
      return `<button class="wsg-t ${on ? "on" : ""} ${s ? "" : "idle"}" data-do="t" data-k="${k}" style="width:${T}px;height:${T}px;font-size:30px" ${live ? "" : "disabled"}>${ch}</button>`;
    }).join("");
    const word = s ? s.sel.map(k => G.letters[s.order[k]]).join("") : "";
    return `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;height:100%;padding-bottom:4px">
      <div class="wsg-pv" style="width:${gw}px;height:44px;font-size:30px">${esc(word)}</div>
      <div style="display:grid;grid-template-columns:repeat(4,${T}px);gap:${gap}px">${tiles}</div>
      <div class="wsg-btn2" style="grid-template-columns:1fr 2fr;width:${gw}px">
        <button class="wsg-b clr" data-do="clr" style="height:42px" ${live ? "" : "disabled"}><span>Clear</span></button>
        <button class="wsg-b ent" data-do="ent" style="height:42px" ${live ? "" : "disabled"}><span>Enter</span></button>
      </div></div><div class="wsg-bubs"></div>`;
  }
  const arrow = side => `<span class="wsg-arr ${side ? "r" : "l"}"></span>`;
  // Đợt 387 — the WORD is centred; its arrow hangs outside it on the scoring
  // team's side (absolute), so it never pushes the word off centre.
  const centred = (txt, side) => `<span class="wt">${side === 0 ? arrow(0) : ""}${txt}${side === 1 ? arrow(1) : ""}</span>`;
  function rows(side) {
    return G.log.filter(f => f.side === side).map(f =>
      `<li data-w="${f.w}"><b>${f.w.toUpperCase()}</b>${f.m ? `<span>${esc(f.m)}</span>` : ""}</li>`).join("");
  }
  function centreHtml() {
    if (G.phase === "ready") {
      // Đợt 387: no rules line any more — only a status line while it matters.
      const note = dictErr ? "Could not load the dictionary. Check the connection and reload."
        : dict ? "" : "Loading the dictionary…";
      return `<div class="wsg-mid">
        <div class="wsg-logo">A SHOW <span>SPEED</span></div>
        ${solo
          ? `<div class="wsg-times solo"><div class="wsg-tsolo"><i class="up"></i><button data-do="time" data-t="${dur}" class="on"><span>${dur / 60} min</span></button><i class="dn"></i></div></div>`
          : `<div class="wsg-times">${TIMES.map(t => `<button data-do="time" data-t="${t}" class="${t === dur ? "on" : ""}"><span>${t / 60} min</span></button>`).join("")}</div>`}
        <button class="wsg-play" data-do="play" ${dict ? "" : "disabled"}><span>Play</span></button>
        ${note ? `<div class="wsg-note">${note}</div>` : ""}</div>`;
    }
    if (G.phase === "over") {
      const [a, b] = G.sides.map(s => s.score);
      const head = a === b ? "DRAW" : centred("WINS", a > b ? 0 : 1);
      const missed = wordsOn(dict, G.letters, 4).filter(w => !G.found.has(w) && !dict.get(w).base)
        .sort((x, y) => y.length - x.length || dict.get(x).lv - dict.get(y).lv).slice(0, 10);
      return `<div class="wsg-mid wsg-res"><h2>${head}</h2>
        ${missed.length ? `<div class="wsg-lab">MISSED</div><div class="wsg-miss">${missed.map(w => `<div><b>${w.toUpperCase()}</b> <span>${esc(lookup(dict, w)?.m || "")}</span></div>`).join("")}</div>` : ""}
        <button class="wsg-play" data-do="play"><span>Play again</span></button></div>`;
    }
    const f = G.last;
    // `wsg-pop` only on the redraw that brought this word in — a later redraw
    // (Sound, Home box) must not pop it again.
    const pop = G.pop ? "wsg-pop" : ""; G.pop = false;
    const last = f
      ? `<div class="wsg-last ${pop} sd${f.side}"><div class="w">${centred(f.w.toUpperCase(), f.side)}</div>${f.m ? `<div class="m">${esc(f.m)}</div>` : ""}${f.base ? `<div class="nt">form of ${esc(f.base.toUpperCase())}</div>` : ""}</div>`
      : `<div class="wsg-last idle"><div class="w">· · ·</div></div>`;
    return `<div class="wsg-cen">${last}<div class="wsg-cols"><ol class="c0">${rows(0)}</ol><ol class="c1">${rows(1)}</ol></div></div>`;
  }
  function renderSide(side) {
    const el = cv.querySelector(`[data-side="${side}"]`); if (!el) return render();
    const keep = el.querySelector(".wsg-bubs");
    el.innerHTML = sideHtml(side);
    if (keep) el.querySelector(".wsg-bubs").replaceWith(keep);
  }
  function bubble(side, kind, sym) {
    const host = cv.querySelector(`[data-side="${side}"] .wsg-bubs`); if (!host) return;
    const b = document.createElement("div"); b.className = "wsg-bub " + kind; b.innerHTML = `<i>${esc(sym)}</i>`;
    host.append(b); setTimeout(() => b.remove(), 1300);
  }

  // ---------- input: pointerdown, so a redraw between down and up never eats a tap ----------
  function onDown(e) {
    const b = e.target.closest("[data-do]"); if (!b || b.disabled) return;
    const d = b.dataset.do;
    // Home asks first while a game is running (the clock waits); after the
    // result screen there is nothing to lose, so it goes straight back.
    // On the start screen itself Home leaves for the GAMES tree — the game page
    // has no AWord top bar, so this is the only way out besides browser Back.
    if (d === "home") {
      e.preventDefault();
      if (G.phase === "play") { G.ask = true; return render(); }
      if (G.phase === "ready") return ctx.onExit && ctx.onExit();
      return toReady();
    }
    if (d === "yes") { e.preventDefault(); return toReady(); }
    if (d === "no") { e.preventDefault(); G.ask = false; return render(); }
    if (d === "sound") { sfx.on = !sfx.on; if (sfx.on) sfx.next(); return render(); }
    if (d === "time") return timeDown(e, b);
    if (d === "play") return start();
    if (G.phase !== "play" || G.ask) return;
    const sideEl = b.closest("[data-side]"); if (!sideEl) return;
    const side = +sideEl.dataset.side, s = G.sides[side];
    if (d === "t") {
      const k = +b.dataset.k, i = s.sel.indexOf(k);
      if (i >= 0) { s.sel.splice(i, 1); sfx.untap(pan(side)); } else { s.sel.push(k); sfx.tap(pan(side)); }
      renderSide(side);
    } else if (d === "clr") { if (s.sel.length) sfx.clear(pan(side)); s.sel = []; renderSide(side); }
    else if (d === "ent") submit(side);
  }
  cv.addEventListener("pointerdown", onDown);

  // ---------- time chips (Đợt 387) ----------
  function timeDown(e, b) {
    const t = +b.dataset.t, now = performance.now();
    const dbl = now - lastTap.at < DOUBLE_MS && (solo || lastTap.t === t);
    lastTap = dbl ? { t: 0, at: 0 } : { t, at: now };
    if (dbl) {
      const before = cvRect(b);
      if (solo) { solo = false; dur = soloBase; }
      else { solo = true; soloBase = dur = t; saveTime(t); }
      sfx.next(); render();
      // the chip glides from where it was to where it now is
      const now2 = cv.querySelector(`.wsg-times button[data-t="${dur}"]`);
      if (now2) { const r = cvRect(now2); now2.animate([{ translate: `${before.x - r.x}px ${before.y - r.y}px` }, { translate: "0 0" }], { duration: 320, easing: "cubic-bezier(.22,.9,.3,1)" }); }
      return;
    }
    if (!solo) { dur = t; saveTime(dur); sfx.tap(0); return render(); }
    // solo: follow the finger for swipes
    e.preventDefault();
    let y0 = e.clientY;
    const move = ev => {
      const s = cv.getBoundingClientRect().width / W || 1, dy = (ev.clientY - y0) / s;
      if (Math.abs(dy) < SWIPE_PX) return;
      y0 = ev.clientY; lastTap = { t: 0, at: 0 };   // a swipe is not half of a double-tap
      stepTime(dy < 0 ? 1 : -1);
    };
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up);
  }
  function stepTime(n) {
    const v = Math.max(T_MIN, Math.min(T_MAX, dur + n * 60));
    const box = cv.querySelector(".wsg-tsolo");
    if (v === dur) { if (box) box.animate([{ translate: "0 0" }, { translate: `0 ${n > 0 ? -5 : 5}px` }, { translate: "0 0" }], { duration: 180 }); return; }
    dur = v; sfx.tap(0);
    // update in place (no redraw: the finger is still on the chip)
    const btn = box && box.querySelector("button");
    if (btn) {
      btn.dataset.t = dur; btn.querySelector("span").textContent = `${dur / 60} min`;
      btn.animate([{ translate: `0 ${n > 0 ? 10 : -10}px`, opacity: .3 }, { translate: "0 0", opacity: 1 }], { duration: 200, easing: "ease-out" });
    }
    const c = cv.querySelector(".wsg-clock span"); if (c) c.textContent = fmt(dur);
    G.left = dur;
  }
  function onWheel(e) {
    if (!solo || G.phase !== "ready" || !e.target.closest(".wsg-tsolo")) return;
    e.preventDefault(); stepTime(e.deltaY < 0 ? 1 : -1);
  }
  cv.addEventListener("wheel", onWheel, { passive: false });

  // ---------- boot ----------
  render(); fit();
  requestAnimationFrame(fit);
  loadDict().then(d => { if (dead) return; dict = d; render(); })
    .catch(() => { if (dead) return; dictErr = true; render(); });

  return function dispose() {
    dead = true;
    clearInterval(clock); clearInterval(shakeIv);
    ro.disconnect(); window.removeEventListener("resize", fit);
    cv.removeEventListener("pointerdown", onDown);
    cv.removeEventListener("wheel", onWheel);
    sfx.dispose();
    root.classList.remove("wsg", "shaking"); root.innerHTML = "";
  };
}
