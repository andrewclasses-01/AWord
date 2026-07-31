// =============================================================
// TEMPLATE: MAZE CHASE — Wordwall style, English UI, fixed SPACE art.
//
//  • A question shows at the top. Its answer options sit on glowing pads
//    scattered through a space maze. STEER the little astronaut robot along the
//    corridors and reach the pad you think is CORRECT — while dodging the enemy
//    robots that chase you around the maze.
//      – Right pad  → +1, the pad flashes green ✓, on to the next question.
//      – Wrong pad  → the pad flashes red ✗ and is removed, you lose a life,
//                     keep hunting for the correct one.
//      – Enemy hit  → you lose a life and warp back to the start (brief shield).
//      – 0 lives    → game over (we finish with whatever you scored).
//  • Controls: arrow keys / WASD, the on-screen D-pad (touch/TOMKO), or swipe
//    on the maze. Pac-Man style — you keep gliding in a direction, turns are
//    buffered until a corridor opens.
//  • Real-time WITHOUT requestAnimationFrame (a hidden tab freezes rAF and the
//    game would stall — core rule): one setInterval "tick" glides the player,
//    a second interval steps the enemies. CSS transitions do the smoothing.
//  • This game keeps a FIXED space look (it does NOT recolour per theme) — that
//    Space style IS Maze chase's "Classic" (teacher's call). Art + sounds are
//    Wordwall's own Space theme, self-contained under ./img and ./sounds.
//
//  Data model "A" (like Quiz): activity.content.questions[] =
//     { question, answers:[ { text, correct? } ] }  (exactly one correct).
// =============================================================

import { registerTemplate } from "../../core/registry.js";
import { shuffle, el, formatTime } from "../../core/utils.js";
import { fitOnce } from "../../core/fit.js";
import { makeNumberStepper } from "../../core/numberstepper.js";
import { mcSound } from "./mc-sound.js";
import { openMazeChaseEditor } from "./maze-chase-editor.js";

function imgUrl(name) { return new URL(`./img/${name}`, import.meta.url).href; }

// Shrink `txt` so it fits inside `box` on BOTH width and height. One-shot is
// enough: everything is sized in cqw, so the whole stage scales uniformly and
// the chosen ratio stays valid at any size / in fullscreen. Re-run once the web
// font is ready (its metrics differ from the fallback).
function fitText(box, txt) {
  const apply = s => txt.style.setProperty("--fit", s);
  fitOnce(box, txt, apply, { slack: 1 });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => fitOnce(box, txt, apply, { slack: 1 })).catch(() => {});
}

// Width-only shrink for a single-line (nowrap) label. We can't reuse fitOnce
// here: its height check false-triggers on Baloo's tall metrics (scrollHeight is
// ~1px over clientHeight at every size), which would always shrink to the floor.
function fitLabelWidth(el, min = 0.4) {
  const run = () => {
    el.style.setProperty("--fit", "1");
    if (el.scrollWidth <= el.clientWidth) return;
    let lo = min, hi = 1, best = min;
    for (let i = 0; i < 12; i++) {
      const mid = (lo + hi) / 2;
      el.style.setProperty("--fit", mid);
      if (el.scrollWidth > el.clientWidth) hi = mid; else { best = mid; lo = mid; }
    }
    el.style.setProperty("--fit", best);
  };
  run();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(run).catch(() => {});
}

// ---- maze grid: wide enough for a real maze, cells stay ~square in 16:9 ----
const COLS = 15, ROWS = 7;
const STEP_MS = 160;          // player glides one cell this often
const INVULN_MS = 1400;       // shield time after a hit
const ANSWER_HOLD_MS = 900;   // pause on a resolved pad before the next question

const DIRS = {
  u: { dr: -1, dc: 0, opp: "d", row: 3 },   // player sprite rows: 2=down 3=up 4=right 5=left
  d: { dr: 1,  dc: 0, opp: "u", row: 2 },
  l: { dr: 0,  dc: -1, opp: "r", row: 5 },
  r: { dr: 0,  dc: 1,  opp: "l", row: 4 }
};
const DIR_KEYS = ["u", "d", "l", "r"];

function randi(n) { return Math.floor(Math.random() * n); }
function key(r, c) { return r + "," + c; }

// ---- Maze generation: randomized-DFS spanning tree, then fully "braided"
// (every dead-end gets an extra opening) so it loops nicely — better for a
// chase and it sidesteps vertical dead-ends (the art has no vertical end-caps).
function genMaze() {
  const cell = (r, c) => grid[r][c];
  const grid = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({ u: false, d: false, l: false, r: false, seen: false })));
  const inb = (r, c) => r >= 0 && r < ROWS && c >= 0 && c < COLS;

  const stack = [[randi(ROWS), randi(COLS)]];
  cell(stack[0][0], stack[0][1]).seen = true;
  while (stack.length) {
    const [r, c] = stack[stack.length - 1];
    const opts = DIR_KEYS.filter(k => {
      const nr = r + DIRS[k].dr, nc = c + DIRS[k].dc;
      return inb(nr, nc) && !cell(nr, nc).seen;
    });
    if (!opts.length) { stack.pop(); continue; }
    const k = opts[randi(opts.length)];
    const nr = r + DIRS[k].dr, nc = c + DIRS[k].dc;
    cell(r, c)[k] = true;
    cell(nr, nc)[DIRS[k].opp] = true;
    cell(nr, nc).seen = true;
    stack.push([nr, nc]);
  }
  // Braid: open one extra wall on every dead-end (prefer a horizontal neighbour).
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const cl = cell(r, c);
    if (DIR_KEYS.filter(k => cl[k]).length > 1) continue;
    const cand = shuffle(["l", "r", "u", "d"].filter(k => {
      const nr = r + DIRS[k].dr, nc = c + DIRS[k].dc;
      return inb(nr, nc) && !cl[k];
    }));
    if (cand.length) {
      const k = cand[0], nr = r + DIRS[k].dr, nc = c + DIRS[k].dc;
      cl[k] = true; cell(nr, nc)[DIRS[k].opp] = true;
    }
  }
  return grid;
}

// openings -> which maze-piece image to draw
function pieceFor(cl) {
  const o = { u: cl.u, d: cl.d, l: cl.l, r: cl.r };
  const n = (o.u ? 1 : 0) + (o.d ? 1 : 0) + (o.l ? 1 : 0) + (o.r ? 1 : 0);
  if (n === 4) return "cross";
  if (n === 3) {
    if (!o.r) return "tjunction-udl";
    if (!o.l) return "tjunction-udr";
    if (!o.d) return "tjunction-ulr";
    return "tjunction-dlr"; // !o.u
  }
  if (n === 2) {
    if (o.u && o.d) return "path-ud";
    if (o.l && o.r) return "path-lr";
    if (o.u && o.l) return "corner-ul";
    if (o.u && o.r) return "corner-ur";
    if (o.d && o.l) return "corner-dl";
    return "corner-dr"; // d & r
  }
  if (n === 1) return (o.u || o.d) ? "path-ud" : "path-lr"; // rare after braiding
  return "closed";
}

// BFS next step from (sr,sc) toward (tr,tc), respecting walls. Returns a dir key or null.
function bfsStep(grid, sr, sc, tr, tc) {
  if (sr === tr && sc === tc) return null;
  const prev = new Map(); const seen = new Set([key(sr, sc)]);
  const q = [[sr, sc]];
  while (q.length) {
    const [r, c] = q.shift();
    for (const k of DIR_KEYS) {
      if (!grid[r][c][k]) continue;
      const nr = r + DIRS[k].dr, nc = c + DIRS[k].dc;
      const kk = key(nr, nc);
      if (seen.has(kk)) continue;
      seen.add(kk); prev.set(kk, key(r, c));
      if (nr === tr && nc === tc) {
        // walk back to find the first step from the source
        let cur = kk, parent = prev.get(cur);
        while (parent !== key(sr, sc)) { cur = parent; parent = prev.get(cur); }
        const [fr, fc] = cur.split(",").map(Number);
        return DIR_KEYS.find(d => sr + DIRS[d].dr === fr && sc + DIRS[d].dc === fc) || null;
      }
      q.push([nr, nc]);
    }
  }
  return null;
}

const mazeChaseTemplate = {
  type: "maze_chase",
  scorable: true,
  name: "Maze chase",
  hideLettersOption: true,   // answers ride on maze pads, not lettered boxes

  edit: openMazeChaseEditor,

  sounds: {
    play: mcSound.play,
    restart: mcSound.restart,
    timeWarning: mcSound.timeWarning
    // no `complete` → engine's own fanfare plays for "Game complete"
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

  // Options panel extras (engine calls this — see CONG THUC MAU §5): Lives + Difficulty.
  buildExtraOptions({ panel, draft, el, mkRadioChoice }) {
    const gL = el("div", "aw-opt-group");
    gL.append(el("div", "aw-opt-label", "Lives"));
    const rowL = el("div", "aw-opt-row");
    const lv = typeof draft.lives === "number" ? draft.lives : 5;
    const box = el("span", "aw-opt-time");
    const st = makeNumberStepper(lv, 1, 9, v => draft.lives = v);
    box.append(st.el, document.createTextNode(" lives"));
    rowL.append(box); gL.append(rowL); panel.append(gL);

    const gD = el("div", "aw-opt-group");
    gD.append(el("div", "aw-opt-label", "Difficulty (enemies)"));
    const rowD = el("div", "aw-opt-row");
    const dv = typeof draft.difficulty === "number" ? draft.difficulty : 6;
    const boxD = el("span", "aw-opt-time");
    const stD = makeNumberStepper(dv, 1, 10, v => draft.difficulty = v);
    boxD.append(stD.el, document.createTextNode(" / 10"));
    rowD.append(boxD); gD.append(rowD); panel.append(gD);
  },

  mount(root, activity, ui) {
    const opt = activity.options || {};
    let items = (activity.content?.questions || [])
      .filter(q => q && Array.isArray(q.answers) && q.answers.some(a => a && a.correct) && q.answers.length >= 2);
    if (opt.shuffleQuestions) items = shuffle(items);
    const total = items.length;

    // ---- scene ----
    root.innerHTML = "";
    const stage = el("div", "aw-mc-stage");
    const bg = el("div", "aw-mc-bg");
    bg.append(
      Object.assign(el("img", "aw-mc-planet aw-mc-planet-big"), { src: imgUrl("bigplanet.webp"), alt: "" }),
      Object.assign(el("img", "aw-mc-planet aw-mc-planet-green"), { src: imgUrl("greenplanet.webp"), alt: "" }),
      Object.assign(el("img", "aw-mc-planet aw-mc-sun"), { src: imgUrl("sun.webp"), alt: "" })
    );
    const hud = el("div", "aw-mc-hud");
    const qBanner = el("div", "aw-mc-question");
    const lives = el("div", "aw-mc-lives");
    hud.append(qBanner, lives);
    const field = el("div", "aw-mc-field");
    const gridLayer = el("div", "aw-mc-grid");
    const answersLayer = el("div", "aw-mc-answers");
    const actorsLayer = el("div", "aw-mc-actors");
    field.append(gridLayer, answersLayer, actorsLayer);
    stage.append(bg, hud, field);

    // on-screen D-pad (touch / TOMKO)
    const dpad = el("div", "aw-mc-dpad");
    const mkPad = (k, glyph, cls) => {
      const b = el("button", "aw-mc-dbtn " + cls, glyph); b.type = "button";
      b.addEventListener("pointerdown", e => { e.preventDefault(); setDir(k); });
      return b;
    };
    dpad.append(
      mkPad("u", "▲", "is-u"), mkPad("l", "◀", "is-l"),
      mkPad("d", "▼", "is-d"), mkPad("r", "▶", "is-r")
    );
    stage.append(dpad);
    root.append(stage);

    if (total === 0) {
      qBanner.textContent = "No questions yet.";
      return () => {};
    }

    // ---- state ----
    const state = items.map(() => ({ done: false, correct: false, wrong: [], answeredWith: null }));
    let index = 0, finished = false, livesLeft = Math.max(1, opt.lives || 5);
    let grid = null, cells = [];          // gridLayer cell DOM
    let pads = [];                        // {r,c,el,ans,resolved}
    let player = { r: 0, c: 0, el: null, dir: "d", frame: 0, moving: false, invuln: false };
    let enemies = [];                     // {r,c,el,color,frame}
    let queuedDir = null, moveTimer = null, enemyTimer = null, invulnTimer = null;
    let stepCount = 0, questionLock = false;

    const difficulty = Math.min(10, Math.max(1, opt.difficulty || 6));
    const enemyCount = difficulty <= 3 ? 1 : difficulty <= 6 ? 2 : difficulty <= 8 ? 3 : 4;
    const enemyStepMs = Math.max(230, 400 - difficulty * 14);
    const GRACE_MS = 1900;         // no enemy damage for a moment after (re)spawn
    let graceUntil = 0, enemySpots = [];

    ui.onSubmit(finish);
    ui.setScore(0);
    window.addEventListener("keydown", onKey);
    // swipe on the field
    let sx = 0, sy = 0, sTracking = false;
    field.addEventListener("pointerdown", e => { sx = e.clientX; sy = e.clientY; sTracking = true; });
    field.addEventListener("pointerup", e => {
      if (!sTracking) return; sTracking = false;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return;
      if (Math.abs(dx) > Math.abs(dy)) setDir(dx > 0 ? "r" : "l");
      else setDir(dy > 0 ? "d" : "u");
    });

    renderLives();
    startQuestion();

    // =========================================================
    function startQuestion() {
      questionLock = false;
      queuedDir = null;
      grid = genMaze();
      // draw maze pieces
      gridLayer.style.setProperty("--cols", COLS);
      gridLayer.style.setProperty("--rows", ROWS);
      gridLayer.innerHTML = "";
      cells = [];
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const cd = el("div", "aw-mc-cell");
        cd.style.backgroundImage = `url(${imgUrl("maze-" + pieceFor(grid[r][c]) + ".webp")})`;
        gridLayer.append(cd); cells.push(cd);
      }
      mcSound.mapAppear();

      // question + answers
      const q = items[index];
      qBanner.innerHTML = "";
      const qText = el("div", "aw-mc-qtext", "");
      qText.textContent = q.question || "";
      qBanner.append(qText);
      fitText(qBanner, qText);

      // player start = a cell in the left third; enemies far on the right
      const startR = Math.floor(ROWS / 2), startC = 1;
      player.r = startR; player.c = startC; player.dir = "d"; player.frame = 0; player.invuln = false;

      // place answer pads on spread-out cells away from the start
      const answers = shuffle(q.answers.filter(a => a && a.text != null));
      const spots = pickSpots(answers.length, startR, startC);
      answersLayer.innerHTML = "";
      pads = answers.map((a, i) => {
        const p = el("div", "aw-mc-pad");
        const [r, c] = spots[i];
        placeAt(p, r, c);
        const txt = el("div", "aw-mc-pad-txt", "");
        txt.textContent = a.text;
        const mark = el("div", "aw-mc-pad-mark", "");
        p.append(txt, mark);
        answersLayer.append(p);
        fitLabelWidth(txt);   // single-line label: shrink on WIDTH only
        // pop-in
        p.animate([{ transform: "translate(-50%,-50%) scale(.2)", opacity: 0 },
                   { transform: "translate(-50%,-50%) scale(1)", opacity: 1 }],
                  { duration: 300, delay: 40 * i, easing: "cubic-bezier(.22,.9,.3,1)", fill: "backwards" });
        return { r, c, el: p, correct: !!a.correct, text: a.text, resolved: false };
      });
      mcSound.tileAppear();

      // player sprite
      actorsLayer.innerHTML = "";
      const pl = el("div", "aw-mc-player");
      placeAt(pl, player.r, player.c);
      setSprite(pl, player.frame, DIRS[player.dir].row);
      actorsLayer.append(pl); player.el = pl;
      pl.animate([{ opacity: 0, transform: "translate(-50%,-50%) scale(.3)" },
                  { opacity: 1, transform: "translate(-50%,-50%) scale(1)" }],
                 { duration: 320, easing: "cubic-bezier(.22,.9,.3,1)" });
      mcSound.playerAppear();

      // enemies — spawn on the far (right) side, away from the player start
      enemies = [];
      enemySpots = [[0, COLS - 1], [ROWS - 1, COLS - 1], [0, COLS - 3], [ROWS - 1, COLS - 3]];
      graceUntil = performance.now() + GRACE_MS;
      for (let i = 0; i < enemyCount; i++) {
        const [r, c] = enemySpots[i % enemySpots.length];
        const en = el("div", "aw-mc-enemy " + (i % 2 ? "is-green" : "is-red"));
        placeAt(en, r, c);
        actorsLayer.append(en);
        enemies.push({ r, c, el: en, frame: 0 });
        en.animate([{ opacity: 0, transform: "translate(-50%,-50%) scale(.3)" },
                    { opacity: 1, transform: "translate(-50%,-50%) scale(1)" }],
                   { duration: 320, delay: 120 + i * 80, easing: "cubic-bezier(.22,.9,.3,1)" });
      }
      mcSound.enemyAppear();

      ui.setNav({ index: index + 1, total });

      // start loops
      clearInterval(moveTimer); clearInterval(enemyTimer);
      moveTimer = setInterval(tickPlayer, STEP_MS);
      enemyTimer = setInterval(tickEnemies, enemyStepMs);
    }

    // spread N answer cells, away from the player start
    function pickSpots(n, sr, sc) {
      const all = [];
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const d = Math.abs(r - sr) + Math.abs(c - sc);
        if (d >= 3) all.push([r, c, d]);
      }
      shuffle(all);
      // greedily keep spots that aren't adjacent to an already chosen one
      const chosen = [];
      for (const s of all) {
        if (chosen.length >= n) break;
        if (chosen.every(k => Math.abs(k[0] - s[0]) + Math.abs(k[1] - s[1]) >= 4)) chosen.push(s);
      }
      for (const s of all) { // second pass with a looser gap if we came up short
        if (chosen.length >= n) break;
        if (!chosen.includes(s) && chosen.every(k => Math.abs(k[0] - s[0]) + Math.abs(k[1] - s[1]) >= 2)) chosen.push(s);
      }
      while (chosen.length < n && all.length) chosen.push(all[chosen.length]); // fallback
      return chosen.map(s => [s[0], s[1]]);
    }

    // =========================================================
    function tickPlayer() {
      if (questionLock || finished) return;
      // buffered turn (Pac-Man): take the queued dir if the corridor is open
      if (queuedDir && grid[player.r][player.c][queuedDir]) player.dir = queuedDir;
      const d = DIRS[player.dir];
      if (grid[player.r][player.c][player.dir]) {
        player.r += d.dr; player.c += d.dc;
        player.frame = (player.frame + 1) % 4;
        setSprite(player.el, player.frame, d.row);
        placeAt(player.el, player.r, player.c);
        if (++stepCount % 2 === 0) mcSound.footstep();
        checkPad();
        checkEnemyCollision();
      } else {
        // stopped at a wall: rest on idle frame but keep facing
        setSprite(player.el, 0, d.row);
      }
    }

    function tickEnemies() {
      if (questionLock || finished) return;
      for (const en of enemies) {
        let dir;
        if (Math.random() < 0.22) {
          const opts = DIR_KEYS.filter(k => grid[en.r][en.c][k]);
          dir = opts.length ? opts[randi(opts.length)] : null;
        } else {
          dir = bfsStep(grid, en.r, en.c, player.r, player.c);
        }
        if (dir) {
          en.r += DIRS[dir].dr; en.c += DIRS[dir].dc;
          en.el.classList.toggle("is-flip", dir === "l");
          en.frame = (en.frame + 1) % 4;
          en.el.style.setProperty("--f", en.frame);
          placeAt(en.el, en.r, en.c);
        }
      }
      checkEnemyCollision();
    }

    function checkPad() {
      const pad = pads.find(p => !p.resolved && p.r === player.r && p.c === player.c);
      if (!pad) return;
      pad.resolved = true;
      mcSound.answer();
      const st = state[index];
      if (pad.correct) {
        pad.el.classList.add("is-correct");
        pad.el.style.backgroundImage = `url(${imgUrl("floor-correct.png")})`;
        pad.el.querySelector(".aw-mc-pad-mark").textContent = "✓";
        st.correct = true; st.done = true; st.answeredWith = pad.text;
        const gained = state.filter(s => s.correct).length;
        ui.setScore(gained);
        mcSound.correct();
        lockAndNext(true);
      } else {
        pad.el.classList.add("is-wrong");
        pad.el.style.backgroundImage = `url(${imgUrl("floor-incorrect.png")})`;
        pad.el.querySelector(".aw-mc-pad-mark").textContent = "✗";
        st.wrong.push(pad.text); st.answeredWith = pad.text;
        mcSound.wrong();
        loseLife("wrong");
        // eliminate the wrong pad after a beat
        setTimeout(() => {
          if (finished) return;
          mcSound.tileEliminate();
          pad.el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, fill: "forwards" })
            .finished.then(() => { pad.el.style.visibility = "hidden"; }).catch(() => { pad.el.style.visibility = "hidden"; });
        }, 260);
      }
    }

    function checkEnemyCollision() {
      if (player.invuln || questionLock || finished) return;
      if (performance.now() < graceUntil) return;   // start-of-question grace
      if (enemies.some(en => en.r === player.r && en.c === player.c)) hitByEnemy();
    }

    function hitByEnemy() {
      mcSound.enemyAttack();
      mcSound.playerDamage();
      loseLife("enemy");
      if (finished) return;
      // eject + shield, warp back to start
      player.invuln = true;
      player.el.classList.add("is-hit");
      setSprite(player.el, 0, 1);   // "damage" row
      mcSound.playerEject();
      setTimeout(() => {
        if (finished) return;
        player.r = Math.floor(ROWS / 2); player.c = 1; player.dir = "d"; queuedDir = null;
        placeAt(player.el, player.r, player.c);
        setSprite(player.el, 0, DIRS.d.row);
        // shove the enemies back to their far corners so they can't instantly re-hit
        enemies.forEach((en, i) => {
          const [r, c] = enemySpots[i % enemySpots.length];
          en.r = r; en.c = c; placeAt(en.el, r, c);
        });
        graceUntil = performance.now() + GRACE_MS;
        mcSound.teleport();
      }, 260);
      clearTimeout(invulnTimer);
      invulnTimer = setTimeout(() => {
        player.invuln = false; player.el.classList.remove("is-hit");
      }, INVULN_MS);
    }

    function loseLife(reason) {
      livesLeft = Math.max(0, livesLeft - 1);
      renderLives();
      if (livesLeft <= 0) {
        mcSound.playerDeath();
        endTitle = "Game over";
        finish();
      }
    }

    function lockAndNext(good) {
      questionLock = true;
      clearInterval(enemyTimer);
      setTimeout(() => {
        if (finished) return;
        if (index < total - 1) { index++; startQuestion(); }
        else finish();
      }, ANSWER_HOLD_MS);
    }

    // =========================================================
    function placeAt(node, r, c) {
      node.style.setProperty("--c", c);
      node.style.setProperty("--r", r);
    }
    function setSprite(node, frame, row) {
      node.style.setProperty("--f", frame);
      node.style.setProperty("--row", row);
    }
    function setDir(k) {
      if (!DIRS[k] || finished) return;
      queuedDir = k;
      // let a standing player set off immediately if that way is open
      if (!questionLock && grid && grid[player.r][player.c][k]) player.dir = k;
    }
    function onKey(e) {
      const map = { ArrowUp: "u", ArrowDown: "d", ArrowLeft: "l", ArrowRight: "r",
                    w: "u", s: "d", a: "l", d: "r", W: "u", S: "d", A: "l", D: "r" };
      const k = map[e.key];
      if (k) { e.preventDefault(); setDir(k); }
    }
    function renderLives() {
      lives.innerHTML = "";
      const max = Math.max(livesLeft, opt.lives || 5);
      for (let i = 0; i < max; i++) {
        const h = el("span", "aw-mc-heart" + (i < livesLeft ? "" : " is-empty"), "♥");
        lives.append(h);
      }
    }

    let endTitle = null;
    function finish() {
      if (finished) return;
      finished = true;
      clearInterval(moveTimer); clearInterval(enemyTimer); clearTimeout(invulnTimer);
      const perQuestion = state.map((s, i) => ({ q: i, correct: s.correct === true }));
      const correct = perQuestion.filter(p => p.correct).length;
      const review = items.map((q, i) => {
        const s = state[i];
        const correctText = (q.answers.find(a => a.correct) || {}).text || "";
        const answered = s.correct || s.wrong.length > 0;
        return {
          question: q.question || "",
          answered,
          yourText: s.correct ? correctText : (s.wrong[s.wrong.length - 1] || ""),
          yourCorrect: s.correct === true,
          correctText
        };
      });
      const answered = state.filter(s => s.correct || s.wrong.length > 0).length;
      ui.finish({ correct, incorrect: total - correct, total, perQuestion, review, answered,
                  title: endTitle || undefined });
    }

    return function cleanup() {
      window.removeEventListener("keydown", onKey);
      clearInterval(moveTimer); clearInterval(enemyTimer);
      clearTimeout(invulnTimer);
    };
  }
};

registerTemplate(mazeChaseTemplate);
export default mazeChaseTemplate;
