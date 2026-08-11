// =============================================================
// play.js — THE STUDENT PAGE (play.html?g=<assignment code>)
//
// Deliberately a separate page from the teacher's app:
//   * it never imports core/store.js, so the teacher's library cannot even be
//     reached from here — a student only ever sees the one assigned act;
//   * it never asks anyone to sign in. Open the link, type a name, play.
//
// Flow:  link -> "Enter your name" -> the game -> Game complete -> the result is
// sent automatically -> the end-of-game menu shows only what the teacher ticked.
// Students may play as many times as they like; every attempt is recorded.
// =============================================================

import { startGame } from "./core/engine.js";
import { el } from "./core/utils.js";
import {
  getAssignment, submitResult, listScores, isLate, nameKey, prettiestName, rankCompare
} from "./core/assignments.js";
import { ensureTemplate } from "./core/registry.js";
// No template is imported here on purpose. ensureTemplate() fetches the ONE
// game this assignment uses, right before it starts — so a student on a phone
// downloads one game, not the whole catalogue.

const app = document.getElementById("app");
const REMEMBER_KEY = "aword-student-name";

start();

async function start() {
  const code = new URLSearchParams(location.search).get("g");
  if (!code) return showMessage("This link is incomplete", "Ask your teacher for the full link.");

  showMessage("Loading...", "");
  let assignment = null;
  try {
    assignment = await getAssignment(code);
  } catch (e) {
    return showMessage("No internet connection", "Check your connection and open the link again.");
  }
  if (!assignment || !assignment.activity) {
    return showMessage("Assignment not found", "This link may be old. Ask your teacher for a new one.");
  }
  // So a link-naming tool (myLink) reading this page's <title> gets the actual
  // assignment name instead of the same generic title on every play link.
  document.title = `${assignment.title || assignment.activityTitle || "AWord"} — AWord`;
  // The teacher can close an assignment, or move it to the recycle bin. Either
  // way the link still opens — it just explains itself instead of playing.
  if (assignment.trashed) {
    return showMessage("This assignment is no longer available",
      "Your teacher has removed it. Ask them for the new link.");
  }
  if (assignment.closed) {
    return showMessage("This assignment is closed",
      "Your teacher is no longer accepting answers for it.");
  }
  // A name handed over by myLesson (`play.html?g=<code>&n=<name>`). The student
  // signed in there already, so asking again would only invite typos — and typos
  // are exactly what wrecks a leaderboard. Links without `n` behave as before.
  const handed = (new URLSearchParams(location.search).get("n") || "").trim().replace(/\s+/g, " ");
  if (handed.length >= 2) {
    try { localStorage.setItem(REMEMBER_KEY, handed); } catch (e) { /* private mode: fine */ }
    return play(assignment, handed.slice(0, 40));
  }
  showNameScreen(assignment);
}

// ---------------- screens ----------------
function shell() {
  app.innerHTML = "";
  const wrap = el("div", "aw-lib aw-stu");
  const bar = el("div", "aw-appbar");
  bar.append(brand());
  wrap.append(bar);
  app.append(wrap);
  return wrap;
}

// Same mark as the teacher's app (main.js `logo`), minus the click-to-go-home —
// a student has no home to go to.
function brand() {
  const b = el("div", "aw-brand");
  b.append(
    el("div", "aw-brand-logo", 'A<span>Word</span>'),
    el("div", "aw-brand-sub", 'in <b>ANDREW CLASSES</b>')
  );
  return b;
}

function footer() {
  const f = el("div", "aw-foot");
  f.append(el("div", "aw-foot-line", "Phone &amp; Zalo: 0359.769.765"));
  f.append(el("div", "aw-foot-line aw-foot-copy",
    "Copyright © 2018 - 2026 ANDREW CLASSES by Pham Xuan Ninh. All Rights Reserved."));
  return f;
}

function showMessage(title, sub) {
  const wrap = shell();
  const card = el("div", "aw-login");
  card.append(el("div", "aw-login-title", title));
  if (sub) card.append(el("div", "aw-login-sub", sub));
  wrap.append(card, footer());
}

function showNameScreen(assignment) {
  const wrap = shell();
  const card = el("div", "aw-login");
  card.append(el("div", "aw-login-title", assignment.activityTitle || assignment.title || "Ready to play"));
  card.append(el("div", "aw-login-sub", "Type your name, then press Start."));

  const form = el("form", "aw-stu-form");
  const input = el("input", "aw-as-input aw-stu-name");
  input.type = "text";
  input.maxLength = 40;
  input.placeholder = "Your name";
  input.autocomplete = "name";
  input.value = localStorage.getItem(REMEMBER_KEY) || "";
  const go = el("button", "aw-as-btn aw-as-primary aw-stu-go", "START");
  go.type = "submit";
  form.append(input, go);
  card.append(form);

  const err = el("div", "aw-as-err", "");
  card.append(err);

  if (isLate(assignment)) {
    card.append(el("div", "aw-stu-late",
      "The deadline has passed — you can still play, and your teacher will see it as late."));
  }

  form.onsubmit = e => {
    e.preventDefault();
    const name = input.value.trim().replace(/\s+/g, " ");
    if (name.length < 2) { err.textContent = "Please type your name."; input.focus(); return; }
    try { localStorage.setItem(REMEMBER_KEY, name); } catch (e2) { /* private mode: fine */ }
    play(assignment, name);
  };

  wrap.append(card, footer());
  setTimeout(() => input.focus(), 30);
}

// ---------------- the game ----------------
async function play(assignment, studentName) {
  // A fresh copy each time so a replay never inherits the previous play's state.
  const activity = JSON.parse(JSON.stringify(assignment.activity));

  // Fetch this one game before wiping the screen, so a slow classroom
  // connection shows "Loading..." instead of a blank page. Every act type in
  // core/catalog.js works here — the student page is no longer quiz-only.
  showMessage("Loading...", "");
  try {
    await ensureTemplate(activity.type);
  } catch (e) {
    return showMessage("This game could not be opened",
      "Check your connection and open the link again.");
  }

  app.innerHTML = "";
  startGame(app, activity, {
    session: {
      playerName: studentName,
      endOptions: assignment.endOptions || {},

      submit: ({ score, total, timeMs, review }) =>
        submitResult({ code: assignment.code, studentName, score, total, timeMs, review }),

      // The class ranking: each student's BEST attempt, best score first and,
      // on a tie, the faster time (the teacher's rule).
      entries: async () => {
        const rows = await listScores(assignment.code);
        const best = new Map(), names = new Map();
        rows.forEach(r => {
          const key = nameKey(r.name);
          names.set(key, [...(names.get(key) || []), r.name]);
          const cur = best.get(key);
          if (!cur || rankCompare(r, cur) < 0) best.set(key, r);
        });
        const mineKey = nameKey(studentName);
        return [...best.entries()]
          .map(([key, r]) => ({
            name: prettiestName(names.get(key) || [r.name]),
            score: r.score, total: r.total, timeMs: r.timeMs,
            mine: key === mineKey
          }))
          .sort(rankCompare);
      }
    }
  });
}
