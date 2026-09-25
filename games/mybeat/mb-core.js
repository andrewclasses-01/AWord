// =============================================================
// MY BEAT — rules of the game, no DOM and no player (Đợt 385).
//
// Everything here is plain data in / plain data out so it can be tested
// without a browser (node --input-type=module) and so the play screen, the
// editor and the offline tool all agree on ONE song format.
//
// SONG (Firestore doc users/{uid}/items/<id>, kind "mybeat-song"):
//   { id, kind:"mybeat-song", title, artist, channel, youtube, link,
//     source:"own"|"cc", licence, credit, level:"Easy"|"Medium"|"Hard",
//     lists:[listId], draft:bool, duration,
//     sections:[{ name, from, guess }],          // from = first line index
//     lines:[{ x, s:[start…], e, c:[i…], n:[i…] }],
//     board:{ "<mode>-<level>": [{ name, cls, score, stars, at }] } }
//   x = the line's text, words split on single spaces; s[i] = start second of
//   word i; e = end of the line; c = word indexes to CHECK (the tool heard them
//   differently twice); n = word indexes that must NEVER be a gap.
//   ⛔ Firestore refuses an array directly inside an array — that is why a line
//   is a map holding flat number arrays, not [[word,start,end],…].
// =============================================================

export const LEVELS = [
  { id: "beginner",     label: "Beginner",     pct: 0.15, color: "#1F9D55" },
  { id: "intermediate", label: "Intermediate", pct: 0.30, color: "#E0A23A" },
  { id: "advanced",     label: "Advanced",     pct: 0.55, color: "#E8702E" },
  { id: "expert",       label: "Expert",       pct: 1.00, color: "#D64545" }
];
export const MODES = [
  { id: "choice", label: "Choice", hint: "Pick the word from 4 buttons" },
  { id: "type",   label: "Type",   hint: "Type the word you hear" }
];

// Scoring + health — thầy chốt v3 (25/9/2026). Change here, nowhere else.
export const RULES = {
  firstTry: 10, afterMistake: 5,
  streakStep: 5, maxMult: 4,
  hpMax: 100, hpWaitPerSec: 7, hpWrong: 6, hpRight: 2,
  typeRevealAfter: 3,          // wrong letters in a row before the next letter shows itself
  lineTail: 0.15,              // seconds after a line's end before the music stops for a gap
  replayLead: 0.35             // a line replays from this many seconds before its start
};

export const norm = s => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
// letters the player must type for a word: apostrophes/hyphens fill in by themselves
export const typeTarget = core => String(core || "").toLowerCase().replace(/[^a-z0-9]/g, "");

// "Hello," -> { pre:"", core:"Hello", post:"," }
export function splitToken(raw) {
  const m = String(raw).match(/^([^A-Za-z0-9']*)([A-Za-z0-9'’-]*[A-Za-z0-9])?([^A-Za-z0-9]*)$/);
  if (!m || !m[2]) return { pre: "", core: "", post: String(raw) };
  return { pre: m[1] || "", core: m[2], post: m[3] || "" };
}

// Flatten a song into lines + words with absolute indexes the game can use.
export function flatten(song) {
  const lines = [], words = [];
  const secStarts = new Map((song.sections || []).map(s => [s.from, s]));
  (song.lines || []).forEach((ln, li) => {
    const toks = String(ln.x || "").split(" ").filter(Boolean);
    const s = Array.isArray(ln.s) ? ln.s : [];
    const end = Number(ln.e) || (s.length ? s[s.length - 1] + 0.6 : 0);
    const check = new Set(ln.c || []), never = new Set(ln.n || []);
    const line = { i: li, start: Number(s[0]) || 0, end, words: [], section: secStarts.get(li) || null };
    toks.forEach((raw, k) => {
      const t = splitToken(raw);
      const start = Number(s[k]);
      const w = {
        i: words.length, line: li, k, raw, ...t,
        start: Number.isFinite(start) ? start : line.start,
        end: k + 1 < toks.length && Number.isFinite(Number(s[k + 1])) ? Number(s[k + 1]) : end,
        check: check.has(k), never: never.has(k) || !t.core
      };
      words.push(w); line.words.push(w);
    });
    lines.push(line);
  });
  return { lines, words };
}

// Small seeded random so the SAME song + level always gives the SAME gaps
// (a leaderboard is only fair when everyone fills the same words).
function seeded(seedText) {
  let h = 2166136261;
  for (const ch of String(seedText)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; };
}

const EASY_SKIP = new Set(["a", "an", "the", "oh", "ooh", "ah", "yeah", "hey", "la", "na", "mm", "uh"]);

// Word indexes to hide for a level, sorted. Expert = every word that may be
// hidden. Lower levels: one word per line first (the "best" one), then the
// best words left, "best" = longer, not a filler, with a little seeded noise.
export function pickGaps(song, levelId, flat = flatten(song)) {
  const lvl = LEVELS.find(l => l.id === levelId) || LEVELS[1];
  const pool = flat.words.filter(w => !w.never && typeTarget(w.core).length > 0);
  if (lvl.pct >= 1) return pool.map(w => w.i);
  const rnd = seeded((song.id || song.title || "song") + "|" + lvl.id);
  const scoreOf = w => {
    const n = typeTarget(w.core);
    if (EASY_SKIP.has(n) || n.length < 2) return -1;
    return Math.min(n.length, 9) * 10 + rnd() * 12;
  };
  const scored = pool.map(w => ({ w, s: scoreOf(w) })).filter(x => x.s >= 0).sort((a, b) => b.s - a.s);
  const want = Math.max(1, Math.round(flat.words.length * lvl.pct));
  const out = new Set();
  for (const line of flat.lines) {
    if (out.size >= want) break;
    const best = scored.find(x => x.w.line === line.i);
    if (best) out.add(best.w.i);
  }
  for (const x of scored) { if (out.size >= want) break; out.add(x.w.i); }
  return [...out].sort((a, b) => a - b);
}

// Level suggestion from singing speed (words per minute of sung time).
export function suggestLevel(song, flat = flatten(song)) {
  if (!flat.lines.length) return "Easy";
  const sung = flat.lines.reduce((t, l) => t + Math.max(0.5, l.end - l.start), 0);
  const wpm = flat.words.length / (sung / 60);
  return wpm < 110 ? "Easy" : wpm < 150 ? "Medium" : "Hard";
}

export const starsFor = (firstTry, gaps) => gaps ? Math.min(5, Math.round((firstTry / gaps) * 10) / 2) : 5;

// "https://youtu.be/ID", "…watch?v=ID&list=…", "…/embed/ID", "…/shorts/ID" or a bare id
export function youtubeId(text) {
  const s = String(text || "").trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  const m = s.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/live\/)([\w-]{11})/);
  return m ? m[1] : "";
}

export const fmtTime = t => {
  t = Math.max(0, Number(t) || 0);
  return `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, "0")}`;
};

// ---------------------------------------------------------------- import
// A .beat.json from tools/mybeat-prepare.py -> the fields a song keeps.
export function fromPackage(pkg) {
  if (!pkg || typeof pkg !== "object") throw new Error("This file is not a My Beat package.");
  if (!Array.isArray(pkg.lines) || !pkg.lines.length) throw new Error("The package has no lyrics lines.");
  const lines = pkg.lines.map(l => ({
    x: String(l.x || "").replace(/\s+/g, " ").trim(),
    s: (l.s || []).map(Number),
    e: Number(l.e) || 0,
    c: (l.c || []).map(Number),
    n: (l.n || []).map(Number)
  })).filter(l => l.x);
  const sections = (pkg.sections || []).map(s => ({ name: String(s.name || "Verse"), from: Number(s.from) || 0, guess: !!s.guess }))
    .filter(s => s.from < lines.length);
  if (!sections.length || sections[0].from !== 0) sections.unshift({ name: "Verse 1", from: 0, guess: true });
  const song = {
    title: String(pkg.title || "").trim(), artist: String(pkg.artist || "").trim(),
    channel: String(pkg.channel || "").trim(), youtube: youtubeId(pkg.youtube || pkg.link || ""),
    link: String(pkg.link || ""), source: pkg.source === "own" ? "own" : (pkg.source === "cc" ? "cc" : ""),
    licence: String(pkg.licence || ""), credit: String(pkg.credit || ""),
    duration: Number(pkg.duration) || 0, sections, lines
  };
  return song;
}

// Re-time one line after its text was edited: keep the times of words that
// stayed, spread new words evenly over the line.
export function retimeLine(line, newText) {
  const toks = String(newText).replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const start = line.s[0] ?? 0, end = line.e || start + 2;
  const old = String(line.x).split(" ");
  const s = toks.length === old.length ? line.s.slice()
    : toks.map((_, k) => +(start + (end - start) * k / Math.max(1, toks.length)).toFixed(2));
  return { ...line, x: toks.join(" "), s, c: toks.length === old.length ? (line.c || []) : [], n: toks.length === old.length ? (line.n || []) : [] };
}
export function shiftLine(line, dt) {
  return { ...line, s: line.s.map(v => +(v + dt).toFixed(2)), e: +(line.e + dt).toFixed(2) };
}
// Tap to sync: the line now starts at `t`; keep its inner rhythm.
export function moveLineTo(line, t) { return shiftLine(line, t - (line.s[0] ?? 0)); }

// ---------------------------------------------------------------- one round
// The play screen feeds this the player's clock; it answers what to do.
// No timers of its own — the caller ticks it (setInterval, not rAF).
export class Round {
  constructor(song, mode, levelId, opts = {}) {
    this.song = song; this.mode = mode; this.level = levelId;
    this.flat = flatten(song);
    this.gaps = pickGaps(song, levelId, this.flat);
    this.gapSet = new Set(this.gaps);
    this.st = {}; this.gaps.forEach(i => { this.st[i] = { s: "open", tries: 0, typed: "", miss: 0 }; });
    this.health = RULES.hpMax; this.score = 0; this.streak = 0; this.mult = 1;
    this.ok = 0; this.late = 0; this.fails = 0;
    this.waiting = false; this.practice = false; this.over = false; this.done = false;
    this.rnd = opts.random || Math.random;
    this.pool = [...new Set(this.flat.words.map(w => w.core).filter(c => typeTarget(c).length > 2))];
    this.slots = []; this.dead = new Set();
    if (mode === "choice") this.fillSlots();
  }
  current() { return this.gaps.find(i => this.st[i].s === "open"); }
  word(i) { return this.flat.words[i]; }
  lineOf(i) { return this.flat.lines[this.flat.words[i].line]; }

  // ---- clock: returns "pause" | "replay:<sec>" | "finish" | null
  // `ended` = the player reached the end of the video.
  tick(t, dt, ended) {
    if (this.over || this.done) return null;
    const c = this.current();
    if (this.waiting) {
      if (!this.practice) {
        this.health -= RULES.hpWaitPerSec * dt;
        if (this.health <= 0) { this.health = 0; this.over = true; return "gameover"; }
      }
      return null;
    }
    if (c != null) {
      const line = this.lineOf(c);
      if (t >= line.end + RULES.lineTail) { this.waiting = true; return "pause"; }
    } else if (!this.done) {
      const last = this.flat.lines[this.flat.lines.length - 1];
      if (!last || t >= last.end + 0.6 || ended) { this.done = true; return "finish"; }
    }
    return null;
  }

  // ---- answers
  correct(i) {
    const st = this.st[i];
    st.s = st.tries ? "late" : "ok";
    if (st.tries) this.late++; else this.ok++;
    let gain = 0;
    if (!this.practice) {
      gain = (st.tries ? RULES.afterMistake : RULES.firstTry) * this.mult;
      this.score += gain;
      this.streak++;
      if (this.streak % RULES.streakStep === 0 && this.mult < RULES.maxMult) this.mult++;
      this.health = Math.min(RULES.hpMax, this.health + RULES.hpRight);
    }
    return { gain, ...this.afterFill(i) };
  }
  wrong(i) {
    this.st[i].tries++; this.fails++;
    this.streak = 0; this.mult = 1;
    if (!this.practice) {
      this.health -= RULES.hpWrong;
      if (this.health <= 0) { this.health = 0; this.over = true; return { gameover: true }; }
    }
    return {};
  }
  // after a gap is filled while the music waits: replay the line once all its gaps are done
  afterFill(i) {
    const next = this.current();
    if (!this.waiting) return {};
    const wl = this.word(i).line;
    if (next == null || this.word(next).line !== wl) {
      this.waiting = false;
      return { replay: Math.max(0, this.flat.lines[wl].start - RULES.replayLead) };
    }
    return {};
  }

  // ---- Choice
  fillSlots() {
    const c = this.current();
    const picks = [];
    if (c != null) picks.push(this.word(c).core);
    let guard = 0;
    while (picks.length < 4 && guard++ < 200) {
      const w = this.pool[Math.floor(this.rnd() * this.pool.length)];
      if (w && !picks.some(p => norm(p) === norm(w))) picks.push(w);
    }
    while (picks.length < 4) picks.push("—");
    this.slots = picks.sort(() => this.rnd() - 0.5);
    this.dead.clear();
  }
  distractor() {
    for (let k = 0; k < 60; k++) {
      const w = this.pool[Math.floor(this.rnd() * this.pool.length)];
      if (w && !this.slots.some(s => norm(s) === norm(w))) return w;
    }
    return "—";
  }
  pick(k) {
    const c = this.current();
    if (c == null || this.dead.has(k) || this.over) return null;
    if (norm(this.slots[k]) === norm(this.word(c).core)) {
      const res = this.correct(c);
      // the used button takes the NEXT gap's word (if no other button has it); the other 3 stay
      const n = this.current();
      const ans = n != null ? this.word(n).core : null;
      this.slots[k] = ans && !this.slots.some((s, j) => j !== k && norm(s) === norm(ans)) ? ans : this.distractor();
      this.dead.clear();
      return { ok: true, gap: c, slot: k, ...res };
    }
    this.dead.add(k);
    return { ok: false, gap: c, slot: k, ...this.wrong(c) };
  }

  // ---- Type: one letter; 3 wrong in a row => the next letter shows itself
  letter(ch) {
    const c = this.current();
    if (c == null || this.over) return null;
    const st = this.st[c], target = typeTarget(this.word(c).core);
    ch = String(ch).toLowerCase();
    if (target[st.typed.length] === ch) {
      st.typed += ch; st.miss = 0;
      if (st.typed.length === target.length) return { ok: true, done: true, gap: c, ...this.correct(c) };
      return { ok: true, gap: c };
    }
    const res = this.wrong(c);
    st.miss++;
    if (st.miss >= RULES.typeRevealAfter && !res.gameover) {
      st.miss = 0;
      st.typed += target[st.typed.length];
      if (st.typed.length === target.length) return { ok: false, revealed: true, done: true, gap: c, ...this.correct(c) };
      return { ok: false, revealed: true, gap: c };
    }
    return { ok: false, gap: c, ...res };
  }
  // what a Type gap shows now: the letters typed so far, with ' and - filled in
  typedShown(i) {
    const w = this.word(i), st = this.st[i];
    if (!st || st.s !== "open") return w.core;
    let out = "", n = 0;
    for (const ch of w.core) {
      if (/[a-z0-9]/i.test(ch)) { if (n >= st.typed.length) break; out += ch; n++; }
      else if (n > 0) out += ch;
    }
    return out;
  }

  keepPractising() { this.practice = true; this.over = false; this.waiting = false; }

  result() {
    const words = this.gaps.filter(i => this.st[i].tries > 0).map(i => this.word(i).core);
    return {
      score: this.score, ok: this.ok, late: this.late, fails: this.fails, gaps: this.gaps.length,
      stars: starsFor(this.ok, this.gaps.length), practice: this.practice,
      words: [...new Set(words)].slice(0, 16), mode: this.mode, level: this.level
    };
  }
}

// ---------------------------------------------------------------- leaderboard
export const boardKey = (mode, level) => `${mode}-${level}`;
// keep the best entry per (name, class), best first, at most 50
export function mergeBoard(list, entry) {
  const same = e => norm(e.name) === norm(entry.name) && e.cls === entry.cls;
  const old = (list || []).find(same);
  const rest = (list || []).filter(e => !same(e));
  const keep = !old || entry.score > old.score ? entry : old;
  return [...rest, keep].sort((a, b) => b.score - a.score || (a.at || 0) - (b.at || 0)).slice(0, 50);
}
