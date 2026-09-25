// =============================================================
// MY BEAT — fixed game of the GAMES tree (Đợt 385, 25/9/2026).
//
// Listen to a song on YouTube and fill the missing words of the lyrics,
// played in class on the teacher's AWord account (thầy chốt v3):
//   Home (song lists) → Song (mode Choice/Type × 4 levels + leaderboard)
//   → Play → Result (save a score for a class + name/team) ; Song editor.
// Rules live in mb-core.js, the player in mb-player.js, storage in
// mb-store.js. Design: D:\OTHERS\CLAUDE\AWord - thiet ke My Beat\mybeat-v3.html
//
// mountMyBeat(root, ctx) -> dispose()
//   ctx.store   (optional) songs/lists/scores API — default: Firestore
//   ctx.classes (optional) { "<class name>": [{ id, name }] } from Settings ▸ Classes
//   ctx.onExit  (optional) back to the GAMES tree
// =============================================================

import { LEVELS, MODES, RULES, flatten, pickGaps, suggestLevel, youtubeId, fmtTime, fromPackage,
         retimeLine, shiftLine, moveLineTo, Round, boardKey, norm } from "./mb-core.js";
import { createPlayer, createFakePlayer, videoInfo, thumbUrl } from "./mb-player.js";

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const svg = (inner, cls = "i") => `<svg class="${cls}" viewBox="0 0 24 24">${inner}</svg>`;
const I = {
  logo: svg('<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>'),
  back: svg('<path d="m15 18-6-6 6-6"/>'),
  search: svg('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  grid: svg('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'),
  kb: svg('<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>'),
  edit: svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'),
  list: svg('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'),
  trash: svg('<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>'),
  heart: svg('<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/>'),
  pause: svg('<path d="M9 5v14M15 5v14"/>'),
  x: svg('<path d="M18 6 6 18M6 6l12 12"/>'),
  check: svg('<path d="M20 6 9 17l-5-5"/>'),
  replay: svg('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>'),
  file: svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>'),
  copy: svg('<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'),
  play: '<svg viewBox="0 0 24 24"><path d="M6 4l14 8-14 8z"/></svg>',
  playI: svg('<path d="M6 4l14 8-14 8z" fill="currentColor"/>')
};
const star = on => `<svg viewBox="0 0 24 24"><defs><linearGradient id="mbhalf"><stop offset="50%" stop-color="#FFC53D"/><stop offset="50%" stop-color="#DCE2EE"/></linearGradient></defs><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" fill="${on === 1 ? "#FFC53D" : on === .5 ? "url(#mbhalf)" : "#DCE2EE"}"/></svg>`;
const nSongs = n => `${n} song${n === 1 ? "" : "s"}`;
const starsTxt = n => "★".repeat(Math.floor(n)) + (n % 1 ? "½" : "");
const LV_COLOR = { Easy: "var(--good)", Medium: "var(--late)", Hard: "var(--bad)" };
const LICENCES = ["CC BY 4.0", "CC BY 3.0", "CC BY-SA 4.0", "CC BY-SA 3.0", "Free with credit (channel terms)"];
const NEW_DAYS = 14;

// ---------------------------------------------------------------- demo song
// Lyrics written for My Beat (no third-party text). No video: plays on the
// clock-only player, so the teacher can show the class how the game works.
function makeDemo() {
  const parts = [
    ["Verse 1", ["I wake up early every day,", "I pack my bag and walk away.", "The rain is falling on the road,", "but I keep singing as I go."]],
    ["Chorus", ["Hey, hey, we learn and play,", "new words are coming every day.", "Sing it loud and sing it clear,", "English music everywhere!"]],
    ["Verse 2", ["My teacher smiles and opens the door,", "we find a word we never saw.", "We write it down, we say it twice,", "and every sentence sounds so nice."]],
    ["Chorus", ["Hey, hey, we learn and play,", "new words are coming every day.", "Sing it loud and sing it clear,", "English music everywhere!"]]
  ];
  let t = 2.2; const lines = [], sections = [];
  parts.forEach(([name, ls]) => {
    sections.push({ name, from: lines.length, guess: false });
    ls.forEach(x => {
      const toks = x.split(" "), dur = 3.1, step = dur / toks.length;
      lines.push({ x, s: toks.map((_, k) => +(t + k * step).toFixed(2)), e: +(t + dur).toFixed(2), c: [], n: [] });
      t += dur + 0.55;
    });
  });
  return { id: "demo", title: "Rainy Day at School", artist: "Andrew Classes", channel: "", youtube: "", source: "own",
           licence: "", credit: "", level: "Easy", lists: [], draft: false, duration: t + 1, sections, lines, board: {}, demo: true };
}
const DEMO = makeDemo();

// ================================================================= mount
export function mountMyBeat(root, ctx = {}) {
  root.classList.add("mb");
  document.body.classList.add("mb-open");
  root.innerHTML = `<div class="top" data-r="top"></div><div data-r="view"></div><div class="toast" data-r="toast"></div>`;
  const $ = s => root.querySelector(s);
  const topEl = $('[data-r="top"]'), viewEl = $('[data-r="view"]'), toastEl = $('[data-r="toast"]');
  const classes = ctx.classes || {};
  let store = ctx.store || null;
  let dead = false;

  const S = {
    view: "home", songs: [], lists: [], loading: true, error: "",
    q: "", lvFilter: "all", song: null, mode: "choice", level: "intermediate",
    lbClass: "", listEdit: null, newList: false, pop: "", result: null
  };
  const cleanups = new Set();     // intervals / players / listeners of the current view
  function clearView() { cleanups.forEach(f => { try { f(); } catch { /* ignore */ } }); cleanups.clear(); }

  let toastT = 0;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add("on");
    clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove("on"), 2600);
  }

  // -------------------------------------------------------------- data
  async function load() {
    S.loading = true; S.error = ""; paint();
    try {
      if (!store) store = (await import("./mb-store.js")).firestoreStore;
      const [songs, lists] = await Promise.all([store.listSongs(), store.getLists()]);
      if (dead) return;
      S.songs = songs; S.lists = lists;
    } catch (e) { S.error = e.message || "Could not load the songs."; }
    S.loading = false;
    // only the home page waits on this; never repaint (and reset) an open editor or a round
    if (!dead && S.view === "home") paint();
  }
  const songById = id => id === "demo" ? DEMO : S.songs.find(s => s.id === id);
  const replaceSong = s => { const i = S.songs.findIndex(x => x.id === s.id); if (i >= 0) S.songs[i] = s; else S.songs.push(s); };

  // -------------------------------------------------------------- router
  function go(view, patch = {}) {
    clearView();
    Object.assign(S, patch, { view, pop: "" });
    root.scrollTop = 0;
    paint();
  }
  function paint() {
    if (dead) return;
    topEl.hidden = S.view === "play";
    if (S.view !== "play") paintTop();
    if (S.view === "home") viewEl.innerHTML = homeHtml();
    else if (S.view === "song") viewEl.innerHTML = songHtml();
    else if (S.view === "result") viewEl.innerHTML = resultHtml();
    else if (S.view === "play") startPlay();
    else if (S.view === "edit") startEditor();
  }
  function paintTop() {
    topEl.innerHTML = `
      ${ctx.onExit ? `<button class="back" data-a="exit" title="Back to Games">${I.back}Games</button>` : ""}
      <div class="logo" data-a="home"><div class="mark">${I.logo}</div><div><b>My Beat</b><small>Andrew Classes songs</small></div></div>
      ${S.view === "home" ? `<label class="search">${I.search}<input data-r="q" placeholder="Search songs or words…" value="${esc(S.q)}"></label>` : ""}
      <span class="sp"></span>
      ${S.view !== "edit" ? `<button class="btn btn-b" data-a="new">${I.plus} New song</button>` : ""}
      <span class="who" title="Played in class on the teacher's account"><span class="av">A</span>Andrew Classes <em>· in class</em></span>`;
  }

  // -------------------------------------------------------------- home
  const words = s => (s.lines || []).reduce((n, l) => n + String(l.x || "").split(" ").filter(Boolean).length, 0);
  const durTxt = s => { const d = s.duration || 0; return d ? `${Math.floor(d / 60)}:${String(Math.round(d % 60)).padStart(2, "0")}` : ""; };
  const srcChip = s => s.source === "own" ? `<span class="src own">Andrew Classes</span>` : s.licence ? `<span class="src cc">${esc(s.licence)}</span>` : "";
  function cardHtml(s) {
    const isNew = !s.demo && s.createdAt && Date.now() - s.createdAt < NEW_DAYS * 864e5;
    const badge = s.draft ? '<span class="badge draft">DRAFT</span>' : s.demo ? '<span class="badge">DEMO</span>' : isNew ? '<span class="badge">NEW</span>' : "";
    const img = s.youtube ? `<img src="${thumbUrl(s.youtube)}" alt="" loading="lazy">` : `<span class="t">${esc(s.title)}</span>`;
    return `<button class="card" data-a="open" data-id="${esc(s.id)}"><div class="thumb">${img}${badge}${durTxt(s) ? `<span class="dur">${durTxt(s)}</span>` : ""}</div>
      <div class="meta"><b>${esc(s.title || "Untitled")}</b><span><span class="lvl"><i style="background:${LV_COLOR[s.level] || "var(--muted)"}"></i>${esc(s.level || "—")}</span>· ${words(s)} words ${srcChip(s)}</span></div></button>`;
  }
  function matches(s) {
    if (!S.q.trim()) return true;
    const q = S.q.toLowerCase();
    return [s.title, s.artist, s.channel].some(v => String(v || "").toLowerCase().includes(q))
      || (s.lines || []).some(l => String(l.x).toLowerCase().includes(q));
  }
  function homeHtml() {
    if (S.loading) return `<div class="body"><p class="muted">Loading your songs…</p></div>`;
    if (S.error) return `<div class="body"><div class="empty"><h2>Could not load My Beat</h2><p class="muted">${esc(S.error)}</p><button class="btn btn-p" data-a="reload">Try again</button></div></div>`;
    const songs = S.songs.filter(matches);
    const byTitle = (a, b) => String(a.title).localeCompare(String(b.title));
    let h = `<div class="body">`;
    if (!S.songs.length) {
      h += `<div class="empty"><h2>Add your first song</h2><ol>
        <li>Run <b>My Beat Prep</b> on your computer with the song file (works offline).</li>
        <li>Press <b>New song</b>, paste the YouTube link, drop in the <b>.beat.json</b> file.</li>
        <li>Check the lyrics, then <b>Publish</b>.</li></ol>
        <div class="chips"><button class="btn btn-b" data-a="new">${I.plus} New song</button><button class="btn btn-g" data-a="open" data-id="demo">Try the demo song</button></div></div>`;
    }
    const fresh = songs.filter(s => s.createdAt && Date.now() - s.createdAt < NEW_DAYS * 864e5).sort((a, b) => b.createdAt - a.createdAt).slice(0, 12);
    if (fresh.length) h += `<section><div class="row-h"><h2>New songs</h2><span class="n">added in the last ${NEW_DAYS} days</span></div><div class="strip">${fresh.map(cardHtml).join("")}</div></section>`;
    S.lists.forEach(l => {
      const items = songs.filter(s => (s.lists || []).includes(l.id)).sort(byTitle);
      const editing = S.listEdit === l.id;
      h += `<section><div class="row-h">${editing
        ? `<input data-r="listname" value="${esc(l.name)}" aria-label="List name"><button class="lk" data-a="list-save" data-id="${l.id}">Save</button><button class="lk bad" data-a="list-del" data-id="${l.id}">Delete list</button><button class="lk" data-a="list-cancel">Cancel</button>`
        : `<h2>${esc(l.name)}</h2><span class="n">${nSongs(items.length)}</span><button class="lk" data-a="list-edit" data-id="${l.id}">${I.edit} Edit</button>`}</div>
        ${items.length ? `<div class="strip">${items.map(cardHtml).join("")}</div>` : `<p class="muted" style="margin:0">No songs yet — open a song and press <b>Lists</b> to add it here.</p>`}</section>`;
    });
    h += S.newList
      ? `<div class="row-h"><input data-r="newlist" placeholder="List name, e.g. Grammar songs" aria-label="New list name"><button class="btn btn-p btn-sm" data-a="list-add">Add list</button><button class="btn btn-g btn-sm" data-a="list-new-cancel">Cancel</button></div>`
      : `<div><button class="btn btn-g" data-a="list-new">${I.plus} New list</button></div>`;
    if (S.songs.length) {
      const all = songs.filter(s => S.lvFilter === "all" || s.level === S.lvFilter).sort(byTitle);
      h += `<section><div class="row-h"><h2>All songs</h2><span class="n">${nSongs(all.length)}</span></div>
        <div class="chips" style="margin-bottom:10px">${["all", "Easy", "Medium", "Hard"].map(v => `<button class="chip${S.lvFilter === v ? " on" : ""}" data-a="lv" data-v="${v}">${v === "all" ? "All levels" : v}</button>`).join("")}</div>
        ${all.length ? `<div class="grid">${all.map(cardHtml).join("")}</div>` : `<p class="muted">No songs match.</p>`}</section>
        <section><div class="row-h"><h2>Demo</h2><span class="n">show the class how to play (no sound)</span></div><div class="strip">${cardHtml(DEMO)}</div></section>`;
    }
    return h + `</div>`;
  }

  // -------------------------------------------------------------- song page
  function bestOf(song, mode, lv) { const b = (song.board || {})[boardKey(mode, lv)] || []; return b[0] || null; }
  function songHtml() {
    const s = S.song; if (!s) return "";
    const flat = flatten(s), total = flat.words.length;
    const lvRows = LEVELS.map((l, k) => {
      const n = pickGaps(s, l.id, flat).length;
      const sig = [0, 1, 2, 3].map(j => `<i class="${j <= k ? "f" : ""}" style="height:${7 + j * 5}px"></i>`).join("");
      const b = bestOf(s, S.mode, l.id);
      return `<button class="level${l.id === S.level ? " on" : ""}" data-a="level" data-v="${l.id}" style="--lc:${l.color}"><span class="sig">${sig}</span>
        <span><b>${l.label}</b><span>Fill ${n} of ${total} words · ${Math.round(l.pct * 100)}%</span></span>
        <span class="best">${b ? `<div class="st">${starsTxt(b.stars)}</div>best ${b.score.toLocaleString("en")}` : "not played"}</span></button>`;
    }).join("");
    const board = (s.board || {})[boardKey(S.mode, S.level)] || [];
    const clsIn = [...new Set(board.map(e => e.cls).filter(Boolean))];
    const shown = board.filter(e => !S.lbClass || e.cls === S.lbClass).slice(0, 12);
    const lv = LEVELS.find(l => l.id === S.level);
    const credit = s.source === "own"
      ? `<div class="credit"><span class="ic own">AC</span><span><b>Andrew Classes original</b></span></div>`
      : s.credit ? `<div class="credit"><span class="ic">cc</span><span><b>Music credit</b><br>${esc(s.credit)}</span></div>` : "";
    const listPop = S.pop === "lists" ? `<div class="popbox"><span class="pt" style="margin:0">Add to lists</span>
        ${S.lists.length ? `<div class="chips">${S.lists.map(l => `<button class="chip${(s.lists || []).includes(l.id) ? " on" : ""}" data-a="toggle-list" data-id="${l.id}">${esc(l.name)}</button>`).join("")}</div>` : `<span class="muted">No lists yet — make one on the home page.</span>`}</div>` : "";
    const delPop = S.pop === "delete" ? `<div class="popbox"><b>Delete “${esc(s.title)}”?</b><span class="muted">The song and all its scores are removed. The YouTube video is not touched.</span>
        <div class="chips"><button class="btn btn-d btn-sm" data-a="delete-yes">Delete</button><button class="btn btn-g btn-sm" data-a="pop-close">Cancel</button></div></div>` : "";
    return `<div class="hero">${s.youtube ? `<div class="bgimg" style="background-image:url('${thumbUrl(s.youtube)}')"></div>` : ""}
      <button class="back" data-a="home" style="color:#fff">${I.back}Songs</button>
      ${s.youtube ? `<img class="art" src="${thumbUrl(s.youtube)}" alt="">` : `<div class="art"></div>`}
      <div><h2>${esc(s.title)}</h2><div class="by">${esc(s.artist || (s.source === "own" ? "Andrew Classes" : ""))}${s.channel ? ` · YouTube: ${esc(s.channel)}` : ""}</div>
        <div class="facts">${durTxt(s) ? `<span>${durTxt(s)}</span>` : ""}<span>${total} words</span><span>${esc(s.level || "")}</span>${s.draft ? "<span>DRAFT — only you see it</span>" : ""}</div></div>
      ${s.demo ? "" : `<div class="act"><button class="btn" data-a="edit">${I.edit} Edit song</button>
        <span class="pop"><button class="btn" data-a="pop" data-v="lists">${I.list} Lists</button>${listPop}</span>
        <span class="pop"><button class="btn" data-a="pop" data-v="delete">${I.trash}</button>${delPop}</span></div>`}
    </div>
    ${credit}
    <div class="cols">
      <div>
        <p class="pt">Game mode</p>
        <div class="modes">${MODES.map(m => `<button class="mode${S.mode === m.id ? " on" : ""}" data-a="mode" data-v="${m.id}"><span class="ic">${m.id === "choice" ? I.grid : I.kb}</span><span><b>${m.label}</b><span>${m.hint}</span></span></button>`).join("")}</div>
        <p class="pt">Level</p>
        <div class="levels">${lvRows}</div>
        <div class="startbar"><button class="btn btn-b btn-lg" data-a="start">${I.playI} Start</button><span class="muted">${MODES.find(m => m.id === S.mode).label} · ${lv.label}</span></div>
      </div>
      <div>
        <p class="pt">Leaderboard</p>
        <div class="lb"><div class="lb-h"><b>${MODES.find(m => m.id === S.mode).label} · ${lv.label}</b><span class="sp"></span>
          ${clsIn.length ? `<div class="chips"><button class="chip${!S.lbClass ? " on" : ""}" data-a="lbclass" data-v="">All</button>${clsIn.map(c => `<button class="chip${S.lbClass === c ? " on" : ""}" data-a="lbclass" data-v="${esc(c)}">${esc(c)}</button>`).join("")}</div>` : ""}</div>
          ${shown.length ? shown.map((e, i) => `<div class="lb-row"><span class="rk">${i + 1}</span><span class="nm">${esc(e.name)}<small>${esc(e.cls || "")}${e.at ? " · " + new Date(e.at).toLocaleDateString("en-GB") : ""}</small></span><span class="sc">${e.score.toLocaleString("en")}<small>${starsTxt(e.stars)}</small></span></div>`).join("")
            : `<div class="lb-empty">${s.demo ? "The demo song does not keep scores." : "No scores yet. Finish a round and save it."}</div>`}</div>
      </div>
    </div>`;
  }

  // -------------------------------------------------------------- play
  let game = null;   // { round, player, ... } of the running play screen
  function startPlay() {
    const s = S.song;
    viewEl.innerHTML = `<div class="stage">
      <div class="hud">
        <div class="odo" data-r="odo">00000</div>
        <div class="cnt"><span>GAPS <b data-r="left">0</b></span><span class="ok">✓ <b data-r="okn">0</b></span><span class="no">✗ <b data-r="non">0</b></span></div>
        <div class="hp" data-r="hp">${I.heart}<div class="bar"><i data-r="hpbar"></i></div></div>
        <span class="pbadge" data-r="pbadge" hidden>PRACTICE · NO SCORE</span>
        <div class="mult" data-r="mult">×1</div>
        <button class="hbtn" data-a="pause" title="Pause (Esc)">${I.pause}</button>
      </div>
      <div class="stage-main">
        <div class="video" data-r="video"><div data-r="vhost"></div><div class="shield"></div><div class="waittag" data-r="waittag" hidden>Waiting for the missing word</div></div>
        <div class="stage-credit">${s.source === "cc" && s.credit ? `♪ <b>${esc(s.credit)}</b>` : `♪ <b>${esc(s.title)}</b>${s.source === "own" ? " · Andrew Classes original" : ""}`}</div>
        <div class="lyrics" data-r="lyrics"></div>
        ${S.mode === "choice"
          ? `<div class="opts">${[1, 2, 3, 4].map(k => `<button class="opt" data-a="opt" data-k="${k - 1}" style="--oc:var(--c${k})"><kbd>${k}</kbd><span></span></button>`).join("")}</div>`
          : `<div class="typearea">Type the missing word — every letter is checked. ${RULES.typeRevealAfter} wrong letters in a row show the next letter.<input class="typein" data-r="typein" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" inputmode="text"></div>`}
      </div>
      <div class="ovl" data-r="ovl"><div class="box"><p>Loading the video…</p></div></div>
    </div>`;
    const round = new Round(s, S.mode, S.level);
    game = { round, player: null, running: false, userPaused: false, shown: 0, last: performance.now(), hold: 0, lyricsHtml: "" };
    const g = game;
    const vhost = $('[data-r="vhost"]');
    const onErr = msg => { if (game === g) overlay(`<span class="tag">Video problem</span><h3>Cannot play</h3><p>${esc(msg)}</p><button class="btn btn-g" data-a="song">Back to the song</button>`); };
    (s.youtube ? createPlayer(vhost, s.youtube, { onError: onErr }) : Promise.resolve(createFakePlayer(vhost, { duration: s.duration || 60 })))
      .then(p => {
        if (game !== g) { p.destroy(); return; }
        g.player = p;
        cleanups.add(() => p.destroy());
        overlay(`<span class="tag">${MODES.find(m => m.id === S.mode).label} · ${LEVELS.find(l => l.id === S.level).label} · ${round.gaps.length} gaps</span>
          <button class="bigplay" data-a="go" aria-label="Start">${I.play}</button><p>${esc(s.title)}</p>`);
      })
      .catch(e => onErr(e.message));
    const iv = setInterval(() => tick(g), 50);
    cleanups.add(() => { clearInterval(iv); if (game === g) game = null; });
    const onKey = e => keyPlay(g, e);
    document.addEventListener("keydown", onKey);
    cleanups.add(() => document.removeEventListener("keydown", onKey));
    const ti = $('[data-r="typein"]');
    if (ti) {
      ti.addEventListener("input", () => { const v = ti.value; ti.value = ""; for (const ch of v) if (/[a-z0-9]/i.test(ch)) typeLetter(g, ch); });
      const focus = () => { if (g.running) ti.focus({ preventScroll: true }); };
      viewEl.addEventListener("pointerup", focus);
      cleanups.add(() => viewEl.removeEventListener("pointerup", focus));
    }
    renderPlay(g);
  }
  function overlay(html) { const o = $('[data-r="ovl"]'); if (!o) return; o.innerHTML = html ? `<div class="box">${html}</div>` : ""; o.hidden = !html; }
  function begin(g) {
    overlay("");
    g.running = true; g.userPaused = false; g.last = performance.now();
    g.player.play();
    const ti = $('[data-r="typein"]'); if (ti) ti.focus({ preventScroll: true });
  }
  function tick(g) {
    const now = performance.now(), dt = Math.min(0.2, (now - g.last) / 1000); g.last = now;
    if (!g.player) return;
    if (g.running && !g.userPaused) {
      const t = g.player.time();
      if (now >= g.hold) {
        const act = g.round.tick(t, dt, g.player.ended());
        if (act === "pause") g.player.pause();
        else if (act === "gameover") gameOver(g);
        else if (act === "finish") finish(g);
      }
    }
    renderPlay(g);
  }
  function applyResult(g, res) {
    if (!res) return;
    if (res.gain) fly(res.gap, "+" + res.gain);
    if (res.replay != null) { g.player.seek(res.replay); g.player.play(); g.hold = performance.now() + 450; }
    if (res.gameover) gameOver(g);
    if (res.ok === false && !res.revealed) shake(res.gap);
    if (g.round.mult > (g.lastMult || 1)) { const m = $('[data-r="mult"]'); if (m) { m.classList.remove("pop"); void m.offsetWidth; m.classList.add("pop"); } }
    g.lastMult = g.round.mult;
    if (g.round.current() == null && g.round.waiting === false && !g.round.done) { /* last gap filled — the clock finishes the round */ }
    renderPlay(g);
  }
  function pickOpt(g, k) {
    if (!g.running || g.userPaused || g.round.over) return;
    const res = g.round.pick(k);
    if (res && res.ok) { const b = root.querySelector(`.opt[data-k="${k}"]`); if (b) { b.classList.remove("swap"); void b.offsetWidth; b.classList.add("swap"); } }
    applyResult(g, res);
  }
  function typeLetter(g, ch) {
    if (!g.running || g.userPaused || g.round.over) return;
    applyResult(g, g.round.letter(ch));
  }
  function keyPlay(g, e) {
    if (S.view !== "play" || game !== g) return;
    if (e.key === "Escape") { e.preventDefault(); if (g.running && !g.userPaused) pauseMenu(g); return; }
    if (!g.running || g.userPaused || e.ctrlKey || e.metaKey || e.altKey) return;
    if (S.mode === "choice" && /^[1-4]$/.test(e.key)) { e.preventDefault(); pickOpt(g, +e.key - 1); }
    else if (S.mode === "type" && /^[a-z0-9]$/i.test(e.key) && !e.target.closest?.("input:not(.typein)")) {
      e.preventDefault(); typeLetter(g, e.key);
      const ti = $('[data-r="typein"]'); if (ti) ti.value = "";
    }
  }
  function pauseMenu(g) {
    g.userPaused = true; g.player && g.player.pause();
    overlay(`<span class="tag">Paused</span><h3>Take a breath</h3><button class="btn btn-b" data-a="resume">${I.playI} Resume</button><button class="btn btn-p" data-a="restart">${I.replay} Start again</button><button class="btn btn-g" data-a="song">Quit</button>`);
  }
  function gameOver(g) {
    g.running = false; g.player && g.player.pause();
    overlay(`<span class="tag">Game over</span><h3>Out of beats!</h3><p>The music waited too long, or too many mistakes.</p>
      <button class="btn btn-b" data-a="restart">${I.replay} Try again</button><button class="btn btn-p" data-a="keep">Keep practising (no score)</button><button class="btn btn-g" data-a="song">Quit</button>`);
  }
  function finish(g) {
    g.running = false;
    try { g.player.pause(); } catch { /* ignore */ }
    S.result = { ...g.round.result(), songId: S.song.id, saved: false };
    setTimeout(() => { if (game === g) go("result"); }, 700);
  }
  function fly(gapIdx, txt) {
    const gEl = root.querySelector(`[data-gap="${gapIdx}"]`), host = $('[data-r="lyrics"]');
    if (!gEl || !host) return;
    const a = gEl.getBoundingClientRect(), b = host.getBoundingClientRect();
    const f = document.createElement("span"); f.className = "fly"; f.textContent = txt;
    f.style.left = (a.left - b.left + a.width / 2 - 14) + "px"; f.style.top = (a.top - b.top - 18) + "px";
    host.append(f); setTimeout(() => f.remove(), 950);
  }
  function shake(gapIdx) { const gEl = root.querySelector(`[data-gap="${gapIdx}"]`); if (gEl) { gEl.classList.remove("shake"); void gEl.offsetWidth; gEl.classList.add("shake"); } }
  function focusLine(g, t) {
    const r = g.round, c = r.current();
    if (r.waiting && c != null) return r.word(c).line;
    const L = r.flat.lines;
    const cur = L.find(l => t >= l.start - 0.3 && t < l.end + 0.5);
    if (cur) return cur.i;
    const nxt = L.find(l => l.start > t);
    return nxt ? nxt.i : L.length - 1;
  }
  function renderPlay(g) {
    if (S.view !== "play" || game !== g) return;
    const r = g.round, t = g.player ? g.player.time() : 0;
    if (g.shown < r.score) g.shown = Math.min(r.score, g.shown + Math.max(1, Math.ceil((r.score - g.shown) / 5)));
    const sTxt = String(Math.floor(g.shown)).padStart(5, "0"), lead = Math.min(sTxt.match(/^0*/)[0].length, 4);
    const set = (k, v) => { const e = $(`[data-r="${k}"]`); if (e && e.textContent !== String(v)) e.textContent = v; };
    const odo = $('[data-r="odo"]'); if (odo) odo.innerHTML = `<span class="z">${sTxt.slice(0, lead)}</span>${sTxt.slice(lead)}`;
    set("left", r.gaps.filter(i => r.st[i].s === "open").length); set("okn", r.ok + r.late); set("non", r.fails);
    const hb = $('[data-r="hpbar"]'); if (hb) hb.style.width = Math.max(0, r.health) + "%";
    const hp = $('[data-r="hp"]'); if (hp) { hp.classList.toggle("low", r.health < 30 && !r.practice); hp.classList.toggle("off", r.practice); }
    const pb = $('[data-r="pbadge"]'); if (pb) pb.hidden = !r.practice;
    const m = $('[data-r="mult"]'); if (m) { if (m.textContent !== "×" + r.mult) m.textContent = "×" + r.mult; m.style.setProperty("--p", (r.mult >= RULES.maxMult ? 100 : (r.streak % RULES.streakStep) * (100 / RULES.streakStep)) + "%"); }
    const wt = $('[data-r="waittag"]'); if (wt) wt.hidden = !r.waiting || !g.running;
    // lyrics: 1 line before the focus line, the focus line, 3 after
    const f = focusLine(g, t), c = r.current(), L = r.flat.lines;
    let h = r.waiting && g.running ? `<span class="waitpill">Waiting for the missing word</span>` : "";
    for (let i = Math.max(0, f - 1); i <= Math.min(L.length - 1, f + 3); i++) {
      const l = L[i];
      const ws = l.words.map(w => {
        if (!r.gapSet.has(w.i)) return `<span class="w${t >= w.start - 0.05 ? " sung" : ""}">${esc(w.raw)}</span>`;
        const st = r.st[w.i];
        let gap;
        if (st.s !== "open") gap = `<span class="gap ${st.s}" data-gap="${w.i}">${esc(w.core)}</span>`;
        else if (S.mode === "type") { const shown = r.typedShown(w.i); gap = `<span class="gap type${w.i === c ? " act" : ""}" data-gap="${w.i}">${esc(shown)}<span class="rest">${esc(w.core.slice(shown.length)) || "&nbsp;"}</span></span>`; }
        else gap = `<span class="gap${w.i === c ? " act" : ""}" data-gap="${w.i}">${esc(w.core)}</span>`;
        return esc(w.pre) + gap + esc(w.post);
      }).join(" ");
      h += `<div class="ln${i === f ? " cur" : ""}">${l.section ? `<span class="sec">${esc(l.section.name)}</span>` : ""}${ws}</div>`;
    }
    const ly = $('[data-r="lyrics"]');
    if (ly && g.lyricsHtml !== h) { const flies = [...ly.querySelectorAll(".fly")]; ly.innerHTML = h; flies.forEach(x => ly.append(x)); g.lyricsHtml = h; }
    if (S.mode === "choice") root.querySelectorAll(".opt").forEach((b, k) => {
      const sp = b.querySelector("span"), txt = r.slots[k] || "";
      if (sp.textContent !== txt) sp.textContent = txt;
      b.classList.toggle("dead", r.dead.has(k));
    });
  }

  // -------------------------------------------------------------- result
  function resultHtml() {
    const r = S.result, s = S.song;
    if (!r || !s) return "";
    const st = [0, 1, 2, 3, 4].map(i => star(r.stars >= i + 1 ? 1 : r.stars >= i + .5 ? .5 : 0)).join("");
    const acc = r.gaps ? Math.round(r.ok / r.gaps * 100) : 100;
    const board = (s.board || {})[boardKey(r.mode, r.level)] || [];
    const rank = board.filter(e => e.score > r.score).length + 1;
    const clsNames = Object.keys(classes).sort();
    const recent = [...new Set(board.map(e => e.name))].slice(0, 5);
    const cls = S.saveCls || clsNames[0] || "";
    const lvIdx = LEVELS.findIndex(l => l.id === r.level);
    const canSave = !r.practice && !s.demo;
    return `<div class="res">
      <div class="res-l">
        <span class="tag">${esc(s.title)} · ${MODES.find(m => m.id === r.mode).label} · ${LEVELS[lvIdx].label}</span>
        <div class="stars">${st}</div>
        <div class="big">${r.practice ? "—" : r.score.toLocaleString("en")} <small>${r.practice ? "practice" : "pts"}</small></div>
        ${canSave && board.length ? `<span class="chip on" style="background:var(--beat);border-color:var(--beat)">${rank === 1 ? "Top score!" : `Would be #${rank}`}</span>` : ""}
        <div class="tiles">
          <div class="tile"><b style="color:var(--good)">${r.ok}</b><span>first try</span></div>
          <div class="tile"><b style="color:var(--late)">${r.late}</b><span>after a mistake</span></div>
          <div class="tile"><b style="color:var(--bad)">${r.fails}</b><span>mistakes</span></div>
          <div class="tile"><b>${acc}%</b><span>accuracy</span></div>
        </div>
        <div class="res-act"><button class="btn btn-b" data-a="start">${I.replay} Play again</button>${lvIdx < 3 ? `<button class="btn btn-p" data-a="next-level">Next level</button>` : ""}<button class="btn btn-g" data-a="song">Song</button></div>
      </div>
      <div style="display:flex;flex-direction:column;gap:14px">
        ${canSave ? `<div class="panel save"><p class="pt">Save to leaderboard</p>
          ${r.saved ? `<div class="msg ok">Saved for <b>${esc(r.savedAs)}</b>.</div>` : `
          <div class="field"><select class="narrow" data-r="savecls" aria-label="Class">${clsNames.map(c => `<option${c === cls ? " selected" : ""}>${esc(c)}</option>`).join("")}<option value=""${!cls ? " selected" : ""}>No class</option></select>
            <input data-r="savename" list="mb-names" placeholder="Student, team or class name" aria-label="Name"><button class="btn btn-p" data-a="save-score">Save</button></div>
          <datalist id="mb-names">${(classes[cls] || []).map(p => `<option value="${esc(p.name)}">`).join("")}</datalist>
          <div class="chips" style="margin-top:8px">${[...(cls ? [`Whole class ${cls}`] : []), "Team 1", "Team 2", "Team 3", "Team 4", ...recent].filter((v, i, a) => a.indexOf(v) === i).map(n => `<button class="chip" data-a="quickname" data-v="${esc(n)}">${esc(n)}</button>`).join("")}</div>
          <p class="note">Optional. Each name keeps its best score for this song, mode and level.</p>`}</div>`
          : `<div class="panel"><p class="muted" style="margin:0">${s.demo ? "The demo song does not keep scores." : "Practice run — the score is not saved."}</p></div>`}
        <div class="panel"><p class="pt">Words to practise</p>${r.words.length ? r.words.map(w => `<span class="w">${esc(w)}</span>`).join("") : `<span class="muted">No mistakes — perfect run!</span>`}</div>
        ${board.length ? `<div class="lb"><div class="lb-h"><b>Leaderboard</b></div>${board.slice(0, 8).map((e, i) => `<div class="lb-row${r.saved && e.name === r.savedAs && e.cls === r.savedCls ? " me" : ""}"><span class="rk">${i + 1}</span><span class="nm">${esc(e.name)}<small>${esc(e.cls || "")}</small></span><span class="sc">${e.score.toLocaleString("en")}<small>${starsTxt(e.stars)}</small></span></div>`).join("")}</div>` : ""}
      </div></div>`;
  }
  async function saveScore(btn) {
    const r = S.result, s = S.song;
    const name = ($('[data-r="savename"]')?.value || "").trim();
    const cls = $('[data-r="savecls"]')?.value || "";
    if (!name) { toast("Type a name (a student, a team or the class)."); $('[data-r="savename"]')?.focus(); return; }
    btn.disabled = true;
    try {
      const entry = { name, cls, score: r.score, stars: r.stars, at: Date.now() };
      const list = await store.saveScore(s.id, r.mode, r.level, entry);
      s.board = { ...(s.board || {}), [boardKey(r.mode, r.level)]: list };
      replaceSong(s);
      Object.assign(r, { saved: true, savedAs: name, savedCls: cls });
      S.saveCls = cls;
      toast("Saved to the leaderboard");
      if (S.view === "result") viewEl.innerHTML = resultHtml();
    } catch (e) { btn.disabled = false; toast("Could not save — " + (e.message || "check the connection")); }
  }

  // ============================================================ editor
  let ed = null;   // editor state while view === "edit"
  function startEditor() {
    const src = S.editId ? songById(S.editId) : null;
    const draft = src ? JSON.parse(JSON.stringify(src)) : { title: "", artist: "", channel: "", youtube: "", link: "", source: "own", licence: "", credit: "",
      level: "", lists: [], draft: true, duration: 0, sections: [], lines: [] };
    delete draft.board;
    if (draft.source !== "cc") draft.source = "own";   // all songs are Andrew Classes' own — no need to ask
    ed = { d: draft, isNew: !src, sel: 0, info: null, msg: "", importMsg: "", player: null, playerId: "", stopAt: 0, tap: false, split: false, editLine: -1, dirty: false };
    viewEl.innerHTML = `<div class="ed">
      <div class="ed-h"><button class="back" data-a="ed-cancel">${I.back}${src ? "Song" : "Songs"}</button><h2>${src ? "Edit song" : "New song"}</h2></div>
      <div class="sec" data-r="s1"></div>
      <div class="sec" data-r="s2"></div>
      <div class="sec" data-r="s3"><h3><span class="n">STEP 3</span> Check &amp; fix</h3>
        <div class="legend"><span><i style="background:#FFF7E0;border:1px solid #EEDFB0"></i>line to check</span><span><i style="background:#FFE6A8"></i>word heard differently twice</span><span><i style="border:1px solid var(--line)"></i>click a word = never hide it (names, “ooh”…)</span></div>
        <div class="tl"><div class="tl-list" data-r="tl"></div>
          <div class="tl-side"><div class="prev" data-r="prev"></div><div class="tools" data-r="tools"></div><p class="note" data-r="toolnote"></p></div></div></div>
      <div class="savebar" data-r="save"></div></div>`;
    ed.onKey = e => edKey(e);
    document.addEventListener("keydown", ed.onKey);
    const iv = setInterval(edTick, 100);
    cleanups.add(() => { clearInterval(iv); document.removeEventListener("keydown", ed.onKey); if (ed && ed.player) ed.player.destroy(); ed = null; });
    edPaintAll();
    if (draft.youtube) edEnsurePlayer();
  }
  const edPaintAll = () => { edPaint1(); edPaint2(); edPaintTl(); edPaintSave(); };
  function edPaint1() {
    const d = ed.d, box = $('[data-r="s1"]'); if (!box) return;
    const lic = ed.otherLic || (d.licence && !LICENCES.includes(d.licence)) ? "__other" : d.licence;
    const nc = /\bNC\b/i.test(d.licence);
    box.innerHTML = `<h3><span class="n">STEP 1</span> YouTube link ${d.youtube ? `<span class="ok">${I.check}</span>` : ""}</h3>
      <div class="field"><input data-r="link" placeholder="Paste the YouTube link of the song" value="${esc(d.link || (d.youtube ? "https://youtu.be/" + d.youtube : ""))}"><button class="btn btn-p" data-a="ed-check">Check</button></div>
      ${ed.info ? `<div class="vid"><img src="${thumbUrl(d.youtube)}" alt=""><div><b>${esc(ed.info.title)}</b><span class="muted">YouTube: ${esc(ed.info.channel)}</span></div></div>` : ""}
      ${ed.msg ? `<div class="msg ${ed.msgKind || "bad"}">${ed.msg}</div>` : ""}
      <div class="two">
        <label class="lab">Song title<input data-f="title" value="${esc(d.title)}"></label>
        <label class="lab">Artist<input data-f="artist" value="${esc(d.artist)}" placeholder="Andrew Classes"></label>
      </div>
      ${d.source === "cc" ? `<div class="two">
        <label class="lab${!d.licence ? " bad" : ""}">Licence<select data-f="licpick"><option value=""${!d.licence ? " selected" : ""}>Choose…</option>${LICENCES.map(l => `<option${l === lic ? " selected" : ""}>${esc(l)}</option>`).join("")}<option value="__other"${lic === "__other" ? " selected" : ""}>Other…</option></select></label>
        ${lic === "__other" ? `<label class="lab">Licence (as written by the channel)<input data-f="licence" value="${esc(d.licence)}"></label>` : "<span></span>"}
      </div>
        <label class="lab${!d.credit ? " bad" : ""}">Credit — shown on the song page and under the video<input data-f="credit" value="${esc(d.credit)}" placeholder="Copy the credit lines from the video description"></label>
        ${nc ? `<div class="msg bad">“NC” means non-commercial use only. Paid classes may not be allowed — check with the artist first.</div>` : ""}` : ""}`;
  }
  function edPaint2() {
    const d = ed.d, box = $('[data-r="s2"]'); if (!box) return;
    const link = d.youtube ? `https://youtu.be/${d.youtube}` : "<YouTube link>";
    const slug = (d.title || "song").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "song";
    const cmd = `py tools\\mybeat-prepare.py --audio "${slug}.mp3" --link "${link}" --desc "${slug}.txt" --lyrics "${slug}-lyrics.txt"`;
    box.innerHTML = `<h3><span class="n">STEP 2</span> Lyrics &amp; timing ${d.lines.length ? `<span class="ok">${I.check}</span>` : ""}</h3>
      <div class="two">
        <label class="drop" data-r="drop"><span class="btn btn-g">${I.file} Choose .beat.json</span><span>${d.lines.length ? `<b>${d.lines.length} lines</b> · ${d.sections.length} sections · ${words(d)} words${ed.importMsg ? " · " + esc(ed.importMsg) : ""}` : "or drop the file from <b>My Beat Prep</b> here"}</span>
          <input type="file" accept=".json,application/json" data-r="pkg" hidden></label>
        <div><p class="note" style="margin:0 0 6px">No file yet? Run this in a command window on your computer (works offline, about 1 minute per song). <code>--desc</code> = the video description saved as .txt; <code>--lyrics</code> = the lyrics if you have them.</p>
          <div class="cmd" data-r="cmd">${esc(cmd)}</div>
          <button class="btn btn-g btn-sm" style="margin-top:6px" data-a="ed-copy">${I.copy} Copy command</button></div>
      </div>`;
    const drop = box.querySelector('[data-r="drop"]'), inp = box.querySelector('[data-r="pkg"]');
    inp.onchange = () => inp.files[0] && edImport(inp.files[0]);
    drop.ondragover = e => { e.preventDefault(); drop.classList.add("over"); };
    drop.ondragleave = () => drop.classList.remove("over");
    drop.ondrop = e => { e.preventDefault(); drop.classList.remove("over"); const f = e.dataTransfer.files[0]; if (f) edImport(f); };
  }
  async function edImport(file) {
    try {
      const pkg = JSON.parse(await file.text());
      const song = fromPackage(pkg), d = ed.d;
      if (d.lines.length && !(await confirmInline("Replace the lyrics you have now with this file?"))) return;
      d.lines = song.lines; d.sections = song.sections; d.duration = song.duration || d.duration;
      ["title", "artist", "channel", "licence", "credit", "source"].forEach(k => { if (!d[k] && song[k]) d[k] = song[k]; });
      if (!d.youtube && song.youtube) { d.youtube = song.youtube; d.link = song.link || ""; }
      const checks = d.lines.reduce((n, l) => n + (l.c || []).length, 0);
      ed.importMsg = checks ? `${checks} words to check` : "all words heard the same twice";
      ed.sel = 0; ed.dirty = true;
      edPaintAll(); edEnsurePlayer();
      toast(`Imported ${d.lines.length} lines`);
    } catch (e) { toast(e.message || "This file could not be read."); }
  }
  // tiny in-page confirm (the page must not use window.confirm)
  function confirmInline(text) {
    return new Promise(resolve => {
      const bar = $('[data-r="save"]');
      const old = bar.innerHTML;
      bar.innerHTML = `<b>${esc(text)}</b><span class="sp"></span><button class="btn btn-d" data-r="cy">Yes</button><button class="btn btn-g" data-r="cn">No</button>`;
      bar.querySelector('[data-r="cy"]').onclick = () => { bar.innerHTML = old; resolve(true); edPaintSave(); };
      bar.querySelector('[data-r="cn"]').onclick = () => { bar.innerHTML = old; resolve(false); edPaintSave(); };
    });
  }
  function edEnsurePlayer() {
    const d = ed.d, host = $('[data-r="prev"]');
    if (!host || ed.playerId === d.youtube) return;
    if (ed.player) { ed.player.destroy(); ed.player = null; }
    ed.playerId = d.youtube;
    host.innerHTML = "";
    if (!d.youtube) { host.innerHTML = `<div class="mb-fakevid"><span>Add the YouTube link to listen</span></div>`; return; }
    const want = d.youtube;
    createPlayer(host, d.youtube, { onError: msg => { ed && (ed.msg = esc(msg), ed.msgKind = "bad", edPaint1()); } })
      .then(p => { if (!ed || ed.playerId !== want) { p.destroy(); return; } ed.player = p; })
      .catch(() => {});
  }
  function edPaintTl() {
    const d = ed.d, box = $('[data-r="tl"]'); if (!box) return;
    if (!d.lines.length) { box.innerHTML = `<p class="muted">Import the .beat.json file first (step 2).</p>`; edPaintTools(); return; }
    const secAt = new Map(d.sections.map((s, i) => [s.from, i]));
    let h = "";
    d.lines.forEach((l, i) => {
      if (secAt.has(i)) { const si = secAt.get(i), s = d.sections[si]; h += `<div class="tl-sec"><input data-sec="${si}" value="${esc(s.name)}" aria-label="Section name"><hr>${s.guess ? '<span class="guess">guessed — check the name</span>' : ""}</div>`; }
      const toks = String(l.x).split(" "), chk = new Set(l.c || []), nev = new Set(l.n || []);
      const weak = chk.size > 0;
      h += `<div class="tl-line${i === ed.sel ? " sel" : ""}${weak ? " weak" : ""}" data-line="${i}">
        <button class="pl" data-a="ed-playline" data-i="${i}" title="Play this line">${I.play}</button>
        <span class="tc">${fmtTime(l.s[0])}</span>
        ${ed.editLine === i ? `<input class="ed-in" data-r="lineedit" value="${esc(l.x)}" aria-label="Line text">`
          : `<span class="ws">${toks.map((w, k) => `<button class="tok${nev.has(k) ? " never" : ""}${chk.has(k) ? " chk" : ""}${ed.split && i === ed.sel && k > 0 ? " splitmode" : ""}" data-a="ed-tok" data-i="${i}" data-k="${k}">${esc(w)}</button>`).join("")}</span>
          <span class="rowact">${weak ? `<button data-a="ed-okline" data-i="${i}" title="Words are right">${I.check}</button>` : ""}<button data-a="ed-editline" data-i="${i}" title="Edit the words">${I.edit}</button></span>`}
      </div>`;
    });
    box.innerHTML = h;
    const inp = box.querySelector('[data-r="lineedit"]');
    if (inp) {
      inp.focus(); inp.select();
      inp.onkeydown = e => {
        if (e.key === "Enter") { e.preventDefault(); d.lines[ed.editLine] = retimeLine(d.lines[ed.editLine], inp.value); ed.editLine = -1; ed.dirty = true; edPaintTl(); edPaintSave(); }
        if (e.key === "Escape") { e.preventDefault(); ed.editLine = -1; edPaintTl(); }
        e.stopPropagation();
      };
    }
    box.querySelectorAll("[data-sec]").forEach(inpS => inpS.onchange = () => { const s = d.sections[+inpS.dataset.sec]; s.name = inpS.value.trim() || "Verse"; s.guess = false; ed.dirty = true; edPaintTl(); });
    edPaintTools();
  }
  function edPaintTools() {
    const tb = $('[data-r="tools"]'), note = $('[data-r="toolnote"]'); if (!tb) return;
    const has = ed.d.lines.length > 0, isSec = ed.d.sections.some(s => s.from === ed.sel);
    tb.innerHTML = has ? `
      <button class="btn btn-g btn-sm${ed.tap ? " tap-on" : ""}" data-a="ed-tap">${ed.tap ? "Stop tapping" : "Tap to sync"}</button>
      <button class="btn btn-g btn-sm" data-a="ed-nudge" data-v="-0.1">−0.1 s</button><button class="btn btn-g btn-sm" data-a="ed-nudge" data-v="0.1">+0.1 s</button>
      <button class="btn btn-g btn-sm${ed.split ? " tap-on" : ""}" data-a="ed-split">${ed.split ? "Click a word…" : "Split line"}</button>
      <button class="btn btn-g btn-sm" data-a="ed-join">Join with next</button>
      <button class="btn btn-g btn-sm" data-a="ed-section">${isSec && ed.sel > 0 ? "Remove section start" : "New section here"}</button>
      <button class="btn btn-d btn-sm" data-a="ed-delline">Delete line</button>` : "";
    note.innerHTML = !has ? "" : ed.tap
      ? `<b>Tapping:</b> press <b>Space</b> the moment each line starts. <b>Esc</b> stops.`
      : ed.split ? `Click the word the new line should start with.` : `Line ${ed.sel + 1} selected · ▶ plays one line · <b>Tap to sync</b> fixes a whole part that is early/late.`;
  }
  function edTick() {
    if (!ed || !ed.player) return;
    const t = ed.player.time();
    if (ed.stopAt && t >= ed.stopAt) { ed.player.pause(); ed.stopAt = 0; }
    const box = $('[data-r="tl"]'); if (!box) return;
    const playing = ed.player.playing();
    const i = playing ? ed.d.lines.findIndex(l => t >= l.s[0] - 0.05 && t < l.e + 0.2) : -1;
    if (i !== ed.nowLine) {
      box.querySelectorAll(".tl-line.now").forEach(x => x.classList.remove("now"));
      if (i >= 0) box.querySelector(`[data-line="${i}"]`)?.classList.add("now");
      ed.nowLine = i;
    }
  }
  function edSelect(i) {
    ed.sel = Math.max(0, Math.min(ed.d.lines.length - 1, i));
    const box = $('[data-r="tl"]');
    box.querySelectorAll(".tl-line.sel").forEach(x => x.classList.remove("sel"));
    const row = box.querySelector(`[data-line="${ed.sel}"]`);
    if (row) { row.classList.add("sel"); row.scrollIntoView({ block: "nearest" }); }
    edPaintTools();
  }
  function edKey(e) {
    if (!ed || S.view !== "edit") return;
    if (e.target.closest?.("input,select,textarea")) return;
    if (ed.tap && (e.code === "Space" || e.key === " ")) {
      e.preventDefault();
      if (!ed.player) return;
      const t = Math.max(0, ed.player.time() - 0.12);   // ~reaction time
      ed.d.lines[ed.sel] = moveLineTo(ed.d.lines[ed.sel], t);
      ed.dirty = true;
      const row = $(`[data-line="${ed.sel}"] .tc`); if (row) row.textContent = fmtTime(t);
      if (ed.sel < ed.d.lines.length - 1) edSelect(ed.sel + 1); else edStopTap();
      return;
    }
    if (e.key === "Escape" && (ed.tap || ed.split)) { e.preventDefault(); ed.split = false; edStopTap(); edPaintTl(); }
  }
  function edStopTap() { ed.tap = false; if (ed.player) ed.player.pause(); edPaintTools(); }
  function edPaintSave() {
    const d = ed.d, bar = $('[data-r="save"]'); if (!bar) return;
    if (!d.level && d.lines.length) d.level = suggestLevel(d);
    const problems = validate(d, true);
    bar.innerHTML = `<div class="chips">${S.lists.map(l => `<button class="chip${(d.lists || []).includes(l.id) ? " on" : ""}" data-a="ed-list" data-id="${l.id}">${esc(l.name)}</button>`).join("")}</div>
      <label class="lab" style="flex-direction:row;align-items:center;gap:6px">Level<select data-f="level">${["Easy", "Medium", "Hard"].map(v => `<option${d.level === v ? " selected" : ""}>${v}</option>`).join("")}</select></label>
      <span class="sp"></span>
      ${problems.length ? `<span class="muted" style="font-size:13px">To publish: ${problems.map(esc).join(" · ")}</span>` : ""}
      <button class="btn btn-g" data-a="ed-cancel">Cancel</button>
      <button class="btn btn-g" data-a="ed-save" data-v="draft">Save draft</button>
      <button class="btn btn-b" data-a="ed-save" data-v="publish"${problems.length ? " disabled" : ""}>Publish</button>`;
  }
  function validate(d, forPublish) {
    const p = [];
    if (!d.title.trim()) p.push("song title");
    if (!forPublish) return p;
    if (!d.youtube) p.push("YouTube link");
    if (d.source === "cc" && !d.licence.trim()) p.push("licence");
    if (d.source === "cc" && !d.credit.trim()) p.push("credit");
    if (!d.lines.length) p.push("lyrics (.beat.json)");
    return p;
  }
  async function edSave(mode, btn) {
    const d = ed.d, publish = mode === "publish";
    const problems = validate(d, publish);
    if (problems.length) { toast("Missing: " + problems.join(", ")); return; }
    if (d.source === "own" && !d.artist) d.artist = "Andrew Classes";
    d.draft = !publish;
    if (!d.duration && d.lines.length) d.duration = d.lines[d.lines.length - 1].e + 2;
    if (!d.level) d.level = suggestLevel(d);
    btn.disabled = true;
    try {
      const id = await store.saveSong(d);
      const old = songById(id);
      const saved = { ...(old || {}), ...JSON.parse(JSON.stringify(d)), id, board: old?.board || {}, createdAt: old?.createdAt || Date.now(), updatedAt: Date.now() };
      replaceSong(saved);
      ed.dirty = false;
      toast(publish ? "Published — students can play it now" : "Draft saved");
      go("song", { song: saved });
    } catch (e) { btn.disabled = false; toast("Could not save — " + (e.message || "check the connection")); }
  }
  async function edCheck() {
    const d = ed.d, raw = $('[data-r="link"]').value.trim();
    const id = youtubeId(raw);
    ed.msg = ""; ed.info = null;
    if (!id) { ed.msg = "That does not look like a YouTube link."; ed.msgKind = "bad"; edPaint1(); return; }
    d.youtube = id; d.link = raw; ed.dirty = true;
    edPaint1();
    const info = await videoInfo(id);
    if (!ed) return;
    if (!info) { ed.msg = "Could not read this video (wrong link, private video, or no internet)."; ed.msgKind = "bad"; }
    else {
      ed.info = info; d.channel = info.channel;
      if (!d.title) d.title = info.title.replace(/\s*[\(\[][^)\]]*(lyrics|official|no copyright|audio|video)[^)\]]*[\)\]]\s*/gi, " ").replace(/\s*[–-]\s*[^–-]+$/, "").trim() || info.title;
      ed.msg = `Found: <b>${esc(info.title)}</b>`; ed.msgKind = "ok";
    }
    edPaint1(); edPaint2(); edPaintSave(); edEnsurePlayer();
  }
  // <select data-f> changes (text inputs are handled live by the "input" listener)
  function edField(el) {
    const d = ed.d, f = el.dataset.f;
    if (f === "licpick") {
      ed.otherLic = el.value === "__other";
      if (ed.otherLic) { if (LICENCES.includes(d.licence)) d.licence = ""; }
      else d.licence = el.value;
    } else d[f] = el.value;
    ed.dirty = true;
    if (f === "source" || f === "licpick") edPaint1();
    edPaintSave();
  }

  // -------------------------------------------------------------- events
  root.addEventListener("click", e => {
    const b = e.target.closest("[data-a]"); if (!b || !root.contains(b)) return;
    const a = b.dataset.a, id = b.dataset.id, v = b.dataset.v;
    const g = game;
    switch (a) {
      case "exit": if (ctx.onExit) ctx.onExit(); return;
      case "home": return go("home");
      case "reload": return load();
      case "new": S.editId = null; return go("edit");
      case "open": { const s = songById(id); if (s) go("song", { song: s, lbClass: "" }); return; }
      case "lv": S.lvFilter = v; viewEl.innerHTML = homeHtml(); return;
      case "list-new": S.newList = true; viewEl.innerHTML = homeHtml(); $('[data-r="newlist"]')?.focus(); return;
      case "list-new-cancel": S.newList = false; viewEl.innerHTML = homeHtml(); return;
      case "list-add": return addList();
      case "list-edit": S.listEdit = id; viewEl.innerHTML = homeHtml(); $('[data-r="listname"]')?.focus(); return;
      case "list-cancel": S.listEdit = null; viewEl.innerHTML = homeHtml(); return;
      case "list-save": return renameList(id);
      case "list-del": return deleteList(id);
      case "mode": S.mode = v; viewEl.innerHTML = songHtml(); return;
      case "level": S.level = v; viewEl.innerHTML = songHtml(); return;
      case "lbclass": S.lbClass = v; viewEl.innerHTML = songHtml(); return;
      case "pop": S.pop = S.pop === v ? "" : v; viewEl.innerHTML = songHtml(); return;
      case "pop-close": S.pop = ""; viewEl.innerHTML = songHtml(); return;
      case "toggle-list": return toggleSongList(id);
      case "delete-yes": return deleteSong();
      case "edit": S.editId = S.song.id; return go("edit");
      case "start": return go("play", { result: null });
      case "song": return go("song");
      case "next-level": { const i = LEVELS.findIndex(l => l.id === (S.result?.level || S.level)); S.level = LEVELS[Math.min(3, i + 1)].id; return go("play", { result: null }); }
      case "go": if (g && g.player) begin(g); return;
      case "opt": if (g) pickOpt(g, +b.dataset.k); return;
      case "pause": if (g && g.running && !g.userPaused) pauseMenu(g); return;
      case "resume": if (g) { g.userPaused = false; overlay(""); if (!g.round.waiting) g.player.play(); g.last = performance.now(); $('[data-r="typein"]')?.focus({ preventScroll: true }); } return;
      case "restart": return go("play", { result: null });
      case "keep": if (g) { g.round.keepPractising(); overlay(""); g.running = true; g.userPaused = false; const c = g.round.current(); if (c != null) { g.player.seek(Math.max(0, g.round.lineOf(c).start - RULES.replayLead)); g.hold = performance.now() + 450; } g.player.play(); } return;
      case "save-score": return saveScore(b);
      case "quickname": { const inp = $('[data-r="savename"]'); if (inp) inp.value = v; return; }
      // editor
      case "ed-cancel": {
        if (ed && ed.dirty) { confirmInline("Leave without saving your changes?").then(y => { if (y) { ed.dirty = false; S.editId ? go("song") : go("home"); } }); return; }
        return S.editId ? go("song") : go("home");
      }
      case "ed-check": return edCheck();
      case "ed-copy": {
        const txt = $('[data-r="cmd"]').textContent;
        (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => toast("Command copied")).catch(() => {
          const r = document.createRange(); r.selectNodeContents($('[data-r="cmd"]')); getSelection().removeAllRanges(); getSelection().addRange(r); toast("Press Ctrl+C to copy");
        });
        return;
      }
      case "ed-playline": {
        const i = +b.dataset.i; edSelect(i);
        if (!ed.player) { toast("Add the YouTube link (step 1) to listen."); return; }
        const l = ed.d.lines[i]; ed.player.seek(Math.max(0, l.s[0] - 0.3)); ed.player.play(); ed.stopAt = l.e + 0.35; return;
      }
      case "ed-tok": {
        const i = +b.dataset.i, k = +b.dataset.k, l = ed.d.lines[i];
        if (ed.split && i === ed.sel && k > 0) return edSplit(i, k);
        if (i !== ed.sel) edSelect(i);
        const n = new Set(l.n || []); n.has(k) ? n.delete(k) : n.add(k); l.n = [...n].sort((x, y) => x - y);
        b.classList.toggle("never", n.has(k)); ed.dirty = true; return;
      }
      case "ed-okline": { const l = ed.d.lines[+b.dataset.i]; l.c = []; ed.dirty = true; edPaintTl(); return; }
      case "ed-editline": ed.editLine = +b.dataset.i; ed.sel = ed.editLine; edPaintTl(); return;
      case "ed-tap": {
        if (ed.tap) return edStopTap();
        if (!ed.player) { toast("Add the YouTube link (step 1) to tap along."); return; }
        ed.tap = true; ed.split = false; ed.stopAt = 0;
        const l = ed.d.lines[ed.sel]; ed.player.seek(Math.max(0, l.s[0] - 3)); ed.player.play(); edPaintTools(); return;
      }
      case "ed-nudge": { const dt = +v; ed.d.lines[ed.sel] = shiftLine(ed.d.lines[ed.sel], dt); ed.dirty = true; edPaintTl(); return; }
      case "ed-split": ed.split = !ed.split; ed.tap = false; edPaintTl(); return;
      case "ed-join": return edJoin();
      case "ed-section": return edToggleSection();
      case "ed-delline": return edDeleteLine();
      case "ed-list": { const d = ed.d, set = new Set(d.lists || []); set.has(id) ? set.delete(id) : set.add(id); d.lists = [...set]; ed.dirty = true; edPaintSave(); return; }
      case "ed-save": return edSave(v, b);
    }
    // a click on a line row (not on its buttons) selects it
  });
  root.addEventListener("click", e => {
    if (S.view !== "edit" || !ed) return;
    const row = e.target.closest(".tl-line");
    if (row && !e.target.closest("button,input")) edSelect(+row.dataset.line);
  });
  root.addEventListener("input", e => {
    if (e.target.matches('[data-r="q"]')) { S.q = e.target.value; viewEl.innerHTML = homeHtml(); }
    if (S.view === "edit" && ed && e.target.matches("[data-f]") && e.target.tagName === "INPUT") { ed.d[e.target.dataset.f] = e.target.value; ed.dirty = true; if (e.target.dataset.f === "title") { edPaint2(); } edPaintSave(); }
  });
  root.addEventListener("change", e => {
    if (e.target.matches('[data-r="savecls"]')) { S.saveCls = e.target.value; const name = $('[data-r="savename"]')?.value || ""; viewEl.innerHTML = resultHtml(); const n = $('[data-r="savename"]'); if (n) n.value = name; return; }
    if (S.view === "edit" && ed && e.target.matches("select[data-f]")) edField(e.target);
  });
  root.addEventListener("keydown", e => {
    if (e.key === "Enter" && e.target.matches('[data-r="newlist"]')) { e.preventDefault(); addList(); }
    if (e.key === "Enter" && e.target.matches('[data-r="listname"]')) { e.preventDefault(); renameList(S.listEdit); }
    if (e.key === "Enter" && e.target.matches('[data-r="savename"]')) { e.preventDefault(); const b = root.querySelector('[data-a="save-score"]'); if (b) saveScore(b); }
    if (e.key === "Enter" && e.target.matches('[data-r="link"]')) { e.preventDefault(); edCheck(); }
  });

  // -------------------------------------------------------------- lists / songs
  async function addList() {
    const name = ($('[data-r="newlist"]')?.value || "").trim();
    if (!name) return;
    const lists = [...S.lists, { id: "l_" + Date.now().toString(36), name }];
    try { await store.saveLists(lists); S.lists = lists; S.newList = false; viewEl.innerHTML = homeHtml(); toast(`List “${name}” added`); }
    catch (e) { toast("Could not save — " + e.message); }
  }
  async function renameList(id) {
    const name = ($('[data-r="listname"]')?.value || "").trim(); if (!name) return;
    const lists = S.lists.map(l => l.id === id ? { ...l, name } : l);
    try { await store.saveLists(lists); S.lists = lists; S.listEdit = null; viewEl.innerHTML = homeHtml(); }
    catch (e) { toast("Could not save — " + e.message); }
  }
  async function deleteList(id) {
    const lists = S.lists.filter(l => l.id !== id);
    try {
      await store.saveLists(lists);
      // songs keep working; the stale list id is removed the next time each song is saved
      S.lists = lists; S.listEdit = null; viewEl.innerHTML = homeHtml(); toast("List deleted (the songs are kept)");
    } catch (e) { toast("Could not save — " + e.message); }
  }
  async function toggleSongList(listId) {
    const s = S.song, set = new Set((s.lists || []).filter(id => S.lists.some(l => l.id === id)));
    set.has(listId) ? set.delete(listId) : set.add(listId);
    const lists = [...set];
    try { await store.saveSong({ id: s.id, lists }); s.lists = lists; replaceSong(s); viewEl.innerHTML = songHtml(); }
    catch (e) { toast("Could not save — " + e.message); }
  }
  async function deleteSong() {
    const s = S.song;
    try { await store.deleteSong(s.id); S.songs = S.songs.filter(x => x.id !== s.id); toast(`“${s.title}” deleted`); go("home"); }
    catch (e) { toast("Could not delete — " + e.message); }
  }

  // -------------------------------------------------------------- editor line tools
  function edSplit(i, k) {
    const d = ed.d, l = d.lines[i], toks = l.x.split(" ");
    const pick = (arr, lo, hi) => (arr || []).filter(x => x >= lo && x < hi).map(x => x - lo);
    const a = { x: toks.slice(0, k).join(" "), s: l.s.slice(0, k), e: l.s[k], c: pick(l.c, 0, k), n: pick(l.n, 0, k) };
    const b = { x: toks.slice(k).join(" "), s: l.s.slice(k), e: l.e, c: pick(l.c, k, toks.length), n: pick(l.n, k, toks.length) };
    d.lines.splice(i, 1, a, b);
    d.sections.forEach(s => { if (s.from > i) s.from++; });
    ed.split = false; ed.dirty = true; edPaintTl(); edPaintSave();
  }
  function edJoin() {
    const d = ed.d, i = ed.sel; if (i >= d.lines.length - 1) return;
    const a = d.lines[i], b = d.lines[i + 1], off = a.x.split(" ").length;
    d.lines.splice(i, 2, { x: a.x + " " + b.x, s: [...a.s, ...b.s], e: b.e, c: [...(a.c || []), ...(b.c || []).map(x => x + off)], n: [...(a.n || []), ...(b.n || []).map(x => x + off)] });
    d.sections = d.sections.filter(s => s.from !== i + 1).map(s => s.from > i + 1 ? { ...s, from: s.from - 1 } : s);
    ed.dirty = true; edPaintTl(); edPaintSave();
  }
  function edToggleSection() {
    const d = ed.d, i = ed.sel; if (i === 0) return;
    const at = d.sections.findIndex(s => s.from === i);
    if (at >= 0) d.sections.splice(at, 1);
    else { d.sections.push({ name: "Chorus", from: i, guess: false }); d.sections.sort((x, y) => x.from - y.from); }
    ed.dirty = true; edPaintTl();
  }
  function edDeleteLine() {
    const d = ed.d, i = ed.sel; if (!d.lines.length) return;
    d.lines.splice(i, 1);
    d.sections = d.sections.filter(s => s.from !== i || i === 0).map(s => s.from > i ? { ...s, from: s.from - 1 } : s).filter(s => s.from < d.lines.length);
    if (d.lines.length && !d.sections.some(s => s.from === 0)) d.sections.unshift({ name: "Verse 1", from: 0, guess: true });
    ed.sel = Math.min(i, d.lines.length - 1); ed.dirty = true; edPaintTl(); edPaintSave();
  }

  load();
  return function dispose() {
    dead = true;
    clearView();
    document.body.classList.remove("mb-open");
    root.classList.remove("mb");
    root.innerHTML = "";
  };
}
