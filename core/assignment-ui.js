// =============================================================
// ASSIGNMENT UI — everything the TEACHER sees around assignments:
//
//   openAssignmentSetup(act)   the "Set assignment" form  (title/deadline/end-of-game)
//   openAssignmentShare(a)     the link + QR to hand out
//   assignmentBar(a, onOpen)   the long strip shown under the stage, one per assignment
//   openAssignmentDetail(a)    the big report: summary · leaderboard · per-student detail
//
// All popups share one dim+blur backdrop (`.aw-as-dim`). Class names are
// prefixed `.aw-as-` so they can never collide with the in-game frame classes
// (.aw-topbar / .aw-iconbtn / .aw-navbtn) — see APP_MASTER mục 9.
// =============================================================

import { el, copyText } from "./utils.js";
import { icons } from "./icons.js";
import { qrSvg, copyQrImage, downloadQrPng } from "./qr.js";
import {
  createAssignment, updateAssignment, trashAssignment, listResults, listScores,
  listAllAssignments, assignmentLink, classFolderFor, assignmentNameTaken,
  nameKey, prettiestName, rankCompare
} from "./assignments.js";
import { listFolders, pathTo } from "./store.js";

// ---- tiny shared helpers ---------------------------------------------------
function escapeText(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function fmtDate(ms) {
  if (!ms) return "";
  const d = new Date(ms);
  const p = n => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function fmtDuration(ms) {
  const s = Math.round((ms || 0) / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// A <input type="datetime-local"> wants "YYYY-MM-DDTHH:MM" in LOCAL time —
// toISOString() would shift it by the timezone, so build the string by hand.
function toLocalInput(ms) {
  const d = new Date(ms);
  const p = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}


function flash(msg) {
  const t = el("div", "aw-as-flash", escapeText(msg));
  document.body.append(t);
  requestAnimationFrame(() => t.classList.add("is-on"));
  setTimeout(() => { t.classList.remove("is-on"); setTimeout(() => t.remove(), 250); }, 2200);
}

// One modal at a time. `size` = "" | "wide".
function openModal(size, build) {
  const dim = el("div", "aw-as-dim");
  const modal = el("div", "aw-as-modal" + (size ? " aw-as-" + size : ""));
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    document.removeEventListener("keydown", onKey);
    dim.classList.remove("is-on");
    setTimeout(() => dim.remove(), 200);     // fade out; opacity only (see rule 12)
  };
  const onKey = e => { if (e.key === "Escape") close(); };
  dim.onclick = e => { if (e.target === dim) close(); };
  document.addEventListener("keydown", onKey);
  build(modal, close);
  dim.append(modal);
  document.body.append(dim);
  requestAnimationFrame(() => dim.classList.add("is-on"));
  return close;
}

function headRow(title, close) {
  const head = el("div", "aw-as-head");
  head.append(el("div", "aw-as-title", escapeText(title)));
  const x = el("button", "aw-as-x", icons.close);
  x.type = "button"; x.title = "Close"; x.onclick = close;
  head.append(x);
  return head;
}

function button(label, cls, onClick) {
  const b = el("button", "aw-as-btn" + (cls ? " " + cls : ""), label);
  b.type = "button";
  b.onclick = onClick;
  return b;
}

// =============================================================
// 1. SET ASSIGNMENT — the setup form
// =============================================================
export function openAssignmentSetup(act, { onCreated } = {}) {
  openModal("", (modal, close) => {
    modal.append(headRow("Set assignment", close));
    const body = el("div", "aw-as-body");

    // --- title
    body.append(el("label", "aw-as-label", "Assignment title"));
    const titleInput = el("input", "aw-as-input");
    titleInput.type = "text";
    titleInput.maxLength = 80;
    titleInput.value = `${act.title || "Untitled"} — ${fmtDate(Date.now()).slice(0, 10)}`;
    body.append(titleInput);

    // --- deadline
    body.append(el("label", "aw-as-label", "Deadline"));
    const dl = el("div", "aw-as-deadline");
    const dlInput = el("input", "aw-as-input aw-as-date");
    dlInput.type = "datetime-local";
    dlInput.disabled = true;
    const noDl = el("label", "aw-as-check");
    const noDlBox = el("input"); noDlBox.type = "checkbox"; noDlBox.checked = true;
    noDlBox.onchange = () => {
      dlInput.disabled = noDlBox.checked;
      if (!noDlBox.checked && !dlInput.value) {
        dlInput.value = toLocalInput(Date.now() + 7 * 24 * 3600 * 1000);   // a week from now
      }
    };
    noDl.append(noDlBox, document.createTextNode("No deadline"));
    dl.append(noDl, dlInput);
    body.append(dl);
    body.append(el("div", "aw-as-note",
      "After the deadline students can still play — their attempts are marked LATE for you."));

    // --- end of game
    body.append(el("label", "aw-as-label", "At the end of the game, students can"));
    const opts = el("div", "aw-as-optrow");
    const mk = (label, checked) => {
      const wrap = el("label", "aw-as-check");
      const c = el("input"); c.type = "checkbox"; c.checked = checked;
      wrap.append(c, document.createTextNode(label));
      opts.append(wrap);
      return c;
    };
    const cbLeader = mk("See the leaderboard", true);
    const cbAnswers = mk("Show answers", true);
    const cbAgain = mk("Start again", true);
    body.append(opts);

    // --- where it will be filed in Results (worked out from the title)
    const filed = el("div", "aw-as-note", "");
    body.append(filed);
    let folders = [], allAssignments = [];
    Promise.all([listFolders("results"), listAllAssignments()])
      .then(([f, a]) => { folders = f; allAssignments = a; showFiling(); })
      .catch(() => { /* offline: it just files at the top of Results */ });
    const showFiling = async () => {
      const folderId = classFolderFor(titleInput.value, folders);
      const where = folderId ? (await pathTo(folderId)).map(f => f.name).join(" / ") : "Results";
      filed.innerHTML = `Filed in Results under <b>${escapeText(where)}</b>`;
    };
    titleInput.oninput = () => { showFiling(); err.textContent = ""; };

    const err = el("div", "aw-as-err", "");
    body.append(err);
    modal.append(body);

    const actions = el("div", "aw-as-actions");
    const back = button("BACK", "", close);
    const start = button("START", "aw-as-primary", async () => {
      const folderId = classFolderFor(titleInput.value, folders);
      if (assignmentNameTaken(allAssignments, { folderId, title: titleInput.value })) {
        err.textContent = "An assignment with this name is already filed there. Please change the name.";
        return;
      }
      start.disabled = back.disabled = true;
      start.textContent = "Creating...";
      err.textContent = "";
      try {
        const deadline = noDlBox.checked || !dlInput.value ? null : new Date(dlInput.value).getTime();
        const assignment = await createAssignment(act, {
          title: titleInput.value,
          deadline,
          folderId,
          endOptions: {
            leaderboard: cbLeader.checked,
            showAnswers: cbAnswers.checked,
            startAgain: cbAgain.checked
          }
        });
        close();
        openAssignmentShare(assignment);
        onCreated?.(assignment);
      } catch (e) {
        start.disabled = back.disabled = false;
        start.textContent = "START";
        err.textContent = e.message || "Could not create the assignment.";
      }
    });
    actions.append(back, start);
    modal.append(actions);
    setTimeout(() => { titleInput.focus(); titleInput.select(); }, 30);
  });
}

// =============================================================
// 2. SHARE — the link + QR handed to students
// =============================================================
export function openAssignmentShare(assignment) {
  openModal("", (modal, close) => {
    modal.append(headRow("Assignment created", close));
    const body = el("div", "aw-as-body");
    const url = assignmentLink(assignment.code);

    body.append(el("div", "aw-as-sub", escapeText(assignment.title)));
    body.append(el("label", "aw-as-label", "Student link"));

    const linkRow = el("div", "aw-as-linkrow");
    const linkInput = el("input", "aw-as-input");
    linkInput.type = "text"; linkInput.readOnly = true; linkInput.value = url;
    linkInput.onclick = () => linkInput.select();
    linkRow.append(linkInput, button("Copy link", "aw-as-primary", async () => {
      flash(await copyText(url) ? "Link copied" : "Press Ctrl+C to copy");
      linkInput.select();
    }));
    body.append(linkRow);

    body.append(el("label", "aw-as-label", "QR code"));
    const qrWrap = el("div", "aw-as-qrwrap");
    const qrBox = el("div", "aw-as-qr");
    qrBox.innerHTML = qrSvg(url);
    const qrBtns = el("div", "aw-as-qrbtns");
    qrBtns.append(
      button("Copy QR image", "", async () => {
        try { await copyQrImage(url, 700); flash("QR image copied"); }
        catch (e) { flash("This browser cannot copy images — use Download"); }
      }),
      button("Download QR", "", () => {
        downloadQrPng(url, `QR ${assignment.title || assignment.code}.png`.replace(/[\\/:*?"<>|]/g, "-"));
        flash("QR saved to your Downloads");
      })
    );
    qrWrap.append(qrBox, qrBtns);
    body.append(qrWrap);
    body.append(el("div", "aw-as-note",
      "Students open this link, type their name and play. No sign-in needed."));
    modal.append(body);

    const actions = el("div", "aw-as-actions");
    actions.append(button("DONE", "aw-as-primary", close));
    modal.append(actions);
  });
}

// =============================================================
// 2b. EDIT an assignment that is already out there
// Reachable from BOTH the Results card and the strip under the act, because
// there is only ONE assignment document behind them.
// =============================================================
export function openAssignmentEdit(assignment, { onSaved } = {}) {
  openModal("", (modal, close) => {
    modal.append(headRow("Edit assignment", close));
    const body = el("div", "aw-as-body");

    body.append(el("label", "aw-as-label", "Assignment title"));
    const titleInput = el("input", "aw-as-input");
    titleInput.type = "text"; titleInput.maxLength = 80;
    titleInput.value = assignment.title || "";
    body.append(titleInput);

    body.append(el("label", "aw-as-label", "Deadline"));
    const dl = el("div", "aw-as-deadline");
    const dlInput = el("input", "aw-as-input aw-as-date");
    dlInput.type = "datetime-local";
    const noDl = el("label", "aw-as-check");
    const noDlBox = el("input"); noDlBox.type = "checkbox";
    noDlBox.checked = !assignment.deadline;
    dlInput.disabled = noDlBox.checked;
    if (assignment.deadline) dlInput.value = toLocalInput(assignment.deadline);
    noDlBox.onchange = () => {
      dlInput.disabled = noDlBox.checked;
      if (!noDlBox.checked && !dlInput.value) dlInput.value = toLocalInput(Date.now() + 7 * 24 * 3600 * 1000);
    };
    noDl.append(noDlBox, document.createTextNode("No deadline"));
    dl.append(noDl, dlInput);
    body.append(dl);

    body.append(el("label", "aw-as-label", "At the end of the game, students can"));
    const opts = el("div", "aw-as-optrow");
    const end = assignment.endOptions || {};
    const mk = (label, checked) => {
      const wrap = el("label", "aw-as-check");
      const c = el("input"); c.type = "checkbox"; c.checked = checked;
      wrap.append(c, document.createTextNode(label));
      opts.append(wrap);
      return c;
    };
    const cbLeader = mk("See the leaderboard", end.leaderboard !== false);
    const cbAnswers = mk("Show answers", end.showAnswers !== false);
    const cbAgain = mk("Start again", end.startAgain !== false);
    body.append(opts);

    body.append(el("label", "aw-as-label", "Status"));
    const closedWrap = el("label", "aw-as-check");
    const cbClosed = el("input"); cbClosed.type = "checkbox"; cbClosed.checked = !!assignment.closed;
    closedWrap.append(cbClosed, document.createTextNode("Closed — students can open the link but not play"));
    body.append(closedWrap);
    body.append(el("div", "aw-as-note", "Closing keeps every score you have already collected."));

    const err = el("div", "aw-as-err", "");
    body.append(err);
    modal.append(body);

    const actions = el("div", "aw-as-actions");
    const back = button("BACK", "", close);
    const save = button("SAVE", "aw-as-primary", async () => {
      const title = titleInput.value.trim();
      if (!title) { err.textContent = "Please give the assignment a name."; return; }
      save.disabled = back.disabled = true;
      save.textContent = "Saving...";
      err.textContent = "";
      try {
        const all = await listAllAssignments();
        if (assignmentNameTaken(all, { folderId: assignment.folderId ?? null, title, exceptCode: assignment.code })) {
          throw new Error("An assignment with this name is already in the same folder.");
        }
        const patch = {
          title,
          deadline: noDlBox.checked || !dlInput.value ? null : new Date(dlInput.value).getTime(),
          endOptions: { leaderboard: cbLeader.checked, showAnswers: cbAnswers.checked, startAgain: cbAgain.checked },
          closed: cbClosed.checked
        };
        await updateAssignment(assignment.code, patch);
        Object.assign(assignment, patch);      // keep the open popups in step
        close();
        flash("Assignment updated");
        onSaved?.(assignment);
      } catch (e) {
        save.disabled = back.disabled = false;
        save.textContent = "SAVE";
        err.textContent = e.message || "Could not save.";
      }
    });
    actions.append(back, save);
    modal.append(actions);
  });
}

// Send an assignment to the Results recycle bin, after asking.
export function confirmTrashAssignment(assignment, { onDone } = {}) {
  openModal("", (modal, close) => {
    modal.append(headRow("Delete assignment", close));
    const body = el("div", "aw-as-body");
    body.append(el("div", "aw-as-note",
      `“${escapeText(assignment.title || assignment.code)}” moves to the Results recycle bin. ` +
      `The student link stops working, but every score is kept — you can restore it at any time.`));
    const err = el("div", "aw-as-err", "");
    body.append(err);
    modal.append(body);
    const actions = el("div", "aw-as-actions");
    const cancel = button("CANCEL", "", close);
    const del = button("DELETE", "aw-as-primary", async () => {
      del.disabled = cancel.disabled = true;
      del.textContent = "Deleting...";
      try {
        await trashAssignment(assignment.code);
        close();
        flash("Moved to the recycle bin");
        onDone?.();
      } catch (e) {
        del.disabled = cancel.disabled = false;
        del.textContent = "DELETE";
        err.textContent = e.message || "Could not delete.";
      }
    });
    actions.append(cancel, del);
    modal.append(actions);
  });
}

// Shared little actions so the Results cards and the strips behave identically.
export async function copyAssignmentLink(assignment) {
  flash(await copyText(assignmentLink(assignment.code)) ? "Link copied" : assignmentLink(assignment.code));
}
export async function copyAssignmentQr(assignment) {
  const url = assignmentLink(assignment.code);
  try { await copyQrImage(url, 700); flash("QR image copied"); }
  catch (e) { downloadQrPng(url, `QR ${assignment.code}.png`); flash("QR saved to your Downloads"); }
}
export { openAssignmentShare as openAssignmentShareAgain };

// =============================================================
// 3. The long strip under the stage — one per assignment
// =============================================================
export function assignmentBar(assignment, onOpen) {
  const bar = el("button", "aw-as-bar");
  bar.type = "button";
  bar.append(el("span", "aw-as-bar-ic", icons.assignment));
  bar.append(el("span", "aw-as-bar-name", escapeText(assignment.title || assignment.code)));
  const meta = el("span", "aw-as-bar-meta", escapeText(fmtDate(assignment.createdAt)));
  bar.append(meta);
  bar.onclick = () => onOpen(assignment);
  return bar;
}

// =============================================================
// 4. DETAIL — the big report popup
// =============================================================
export function openAssignmentDetail(assignment, { onChanged } = {}) {
  openModal("wide", (modal, close) => {
    const url = assignmentLink(assignment.code);

    // ---- top strip: what this assignment is, plus the share buttons
    const top = el("div", "aw-as-top");
    const info = el("div", "aw-as-info");
    const titleEl = el("div", "aw-as-title", "");
    const metaEl = el("div", "aw-as-meta", "");
    info.append(titleEl, metaEl);
    drawHead();
    top.append(info);

    function drawHead() {
      titleEl.innerHTML = escapeText(assignment.title || assignment.code) +
        (assignment.closed ? ' <span class="aw-as-closed">CLOSED</span>' : "");
      const bits = [
        (assignment.activityType || "").toUpperCase(),
        "Given " + fmtDate(assignment.createdAt),
        assignment.deadline ? "Due " + fmtDate(assignment.deadline) : "No deadline"
      ];
      metaEl.textContent = bits.join("  ·  ");
    }

    const tools = el("div", "aw-as-toptools");
    tools.append(
      button("Refresh", "", () => refresh()),
      button("Copy link", "", async () => flash(await copyText(url) ? "Link copied" : url)),
      button("Copy QR", "", async () => {
        try { await copyQrImage(url, 700); flash("QR image copied"); }
        catch (e) { downloadQrPng(url, `QR ${assignment.code}.png`); flash("QR saved to your Downloads"); }
      }),
      button("Edit", "", () => openAssignmentEdit(assignment, {
        onSaved: () => { drawHead(); onChanged?.(); }
      })),
      button("Delete", "aw-as-danger", () => confirmTrashAssignment(assignment, {
        onDone: () => { close(); onChanged?.(); }
      }))
    );
    const x = el("button", "aw-as-x", icons.close);
    x.type = "button"; x.title = "Close"; x.onclick = close;
    tools.append(x);
    top.append(tools);
    modal.append(top);

    const body = el("div", "aw-as-body aw-as-report");
    modal.append(body);
    refresh();

    function refresh() {
      body.innerHTML = "";
      body.append(el("div", "aw-as-loading", "Loading results..."));
      loadReport(assignment).then(rows => {
        body.innerHTML = "";
        body.append(summaryBlock(assignment, rows));
        body.append(leaderboardBlock(rows));
        body.append(detailBlock(assignment, rows));
      }).catch(e => {
        // Never show "nobody has played" when the truth is "we could not ask" —
        // an empty report and a failed read look identical to the teacher otherwise.
        body.innerHTML = "";
        body.append(el("div", "aw-as-err", escapeText(e.message || "Could not load the results.")));
        body.append(el("div", "aw-as-note", "Check your internet connection, then press Refresh."));
      });
    }
  });
}

// Merge the two collections: the teacher's full copies plus any public score row
// whose detailed copy did not make it (both are written with the same
// `createdAt`, which makes a reliable de-duplication key).
async function loadReport(assignment) {
  const [r1, r2] = await Promise.allSettled([
    listResults(assignment.code),
    listScores(assignment.code)
  ]);
  // If BOTH reads failed, say so loudly instead of reporting an empty class.
  if (r1.status === "rejected" && r2.status === "rejected") {
    throw new Error(r1.reason?.message || "Could not read the results.");
  }
  const results = r1.status === "fulfilled" ? r1.value : [];
  const scores = r2.status === "fulfilled" ? r2.value : [];
  const seen = new Set(results.map(r => `${nameKey(r.studentName)}|${r.createdAt}`));
  const extra = scores
    .filter(s => !seen.has(`${nameKey(s.name)}|${s.createdAt}`))
    .map(s => ({ studentName: s.name, score: s.score, total: s.total, timeMs: s.timeMs,
                 createdAt: s.createdAt, review: null }));

  return [...results, ...extra].map(r => ({
    name: r.studentName || "Player",
    key: nameKey(r.studentName),
    score: r.score || 0,
    total: r.total || 0,
    incorrect: Math.max(0, (r.total || 0) - (r.score || 0)),
    timeMs: r.timeMs || 0,
    createdAt: r.createdAt || 0,
    late: !!(assignment.deadline && r.createdAt > assignment.deadline),
    review: Array.isArray(r.review) ? r.review : null
  })).sort((a, b) => b.createdAt - a.createdAt);
}

function summaryBlock(assignment, rows) {
  const wrap = el("div", "aw-as-block");
  wrap.append(el("div", "aw-as-blockhead", "Summary"));
  const students = new Set(rows.map(r => r.key)).size;
  const stats = el("div", "aw-as-stats");
  const stat = (label, value) => {
    const s = el("div", "aw-as-stat");
    s.append(el("div", "aw-as-statv", String(value)), el("div", "aw-as-statl", label));
    return s;
  };
  stats.append(stat("Students", students), stat("Plays", rows.length));
  if (assignment.deadline) stats.append(stat("Late plays", rows.filter(r => r.late).length));
  wrap.append(stats);
  if (!rows.length) wrap.append(el("div", "aw-as-note", "No student has played this assignment yet."));
  return wrap;
}

// Best attempt per student, ranked: more correct first, then faster.
function leaderboardBlock(rows) {
  const wrap = el("div", "aw-as-block");
  wrap.append(el("div", "aw-as-blockhead", "Leaderboard"));
  if (!rows.length) return wrap;

  const best = new Map();
  rows.forEach(r => {
    const cur = best.get(r.key);
    if (!cur || rankCompare(r, cur) < 0) best.set(r.key, r);
  });
  const names = new Map();
  rows.forEach(r => { names.set(r.key, [...(names.get(r.key) || []), r.name]); });

  const table = el("div", "aw-as-table aw-as-lb");
  table.append(row(["Rank", "Name", "Score", "Time"], true));
  [...best.values()].sort(rankCompare).forEach((r, i) => {
    table.append(row([
      String(i + 1),
      prettiestName(names.get(r.key) || [r.name]),
      `${r.score}/${r.total}`,
      fmtDuration(r.timeMs)
    ]));
  });
  wrap.append(table);
  return wrap;

  function row(cells, head) {
    const tr = el("div", "aw-as-tr" + (head ? " is-head" : ""));
    cells.forEach(c => tr.append(el("div", "aw-as-td", escapeText(c))));
    return tr;
  }
}

// Every attempt, sortable, and each row opens to show the answers given.
function detailBlock(assignment, rows) {
  const wrap = el("div", "aw-as-block");
  wrap.append(el("div", "aw-as-blockhead", "Detail"));
  if (!rows.length) return wrap;

  const COLS = [
    { key: "name", label: "Student", get: r => r.name.toLowerCase() },
    { key: "createdAt", label: "Submitted", get: r => r.createdAt },
    { key: "score", label: "Correct", get: r => r.score },
    { key: "incorrect", label: "Incorrect", get: r => r.incorrect },
    { key: "timeMs", label: "Time", get: r => r.timeMs }
  ];
  let sortKey = "createdAt", asc = false;

  const table = el("div", "aw-as-table aw-as-detail");
  wrap.append(table);
  draw();
  return wrap;

  function draw() {
    table.innerHTML = "";
    const head = el("div", "aw-as-tr is-head");
    COLS.forEach(c => {
      const cell = el("div", "aw-as-td aw-as-sortable");
      cell.append(el("span", null, c.label));
      if (sortKey === c.key) cell.append(el("span", "aw-as-arrow", asc ? "▲" : "▼"));
      cell.onclick = () => {
        if (sortKey === c.key) asc = !asc; else { sortKey = c.key; asc = c.key === "name"; }
        draw();
      };
      head.append(cell);
    });
    table.append(head);

    const col = COLS.find(c => c.key === sortKey);
    const sorted = rows.slice().sort((a, b) => {
      const va = col.get(a), vb = col.get(b);
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return asc ? cmp : -cmp;
    });

    sorted.forEach(r => {
      const tr = el("div", "aw-as-tr aw-as-clickable");
      const nameCell = el("div", "aw-as-td");
      nameCell.append(el("span", "aw-as-caret", "▸"), el("span", null, escapeText(r.name)));
      if (r.late) nameCell.append(el("span", "aw-as-late", "LATE"));
      tr.append(nameCell);
      tr.append(
        el("div", "aw-as-td", escapeText(fmtDate(r.createdAt))),
        el("div", "aw-as-td", String(r.score)),
        el("div", "aw-as-td", String(r.incorrect)),
        el("div", "aw-as-td", fmtDuration(r.timeMs))
      );
      table.append(tr);

      const detail = el("div", "aw-as-answers");
      detail.style.display = "none";
      detail.append(answersTable(r));
      table.append(detail);

      tr.onclick = () => {
        const open = detail.style.display !== "none";
        detail.style.display = open ? "none" : "block";
        tr.classList.toggle("is-open", !open);
        tr.querySelector(".aw-as-caret").textContent = open ? "▸" : "▾";
      };
    });
  }
}

// One student's play, question by question.
function answersTable(r) {
  if (!r.review || !r.review.length) {
    return el("div", "aw-as-note", "No answer detail was saved for this play.");
  }
  const t = el("div", "aw-as-table aw-as-qa");
  const head = el("div", "aw-as-tr is-head");
  ["#", "Question", "Their answer", "Mark", "Answer"].forEach(h => head.append(el("div", "aw-as-td", h)));
  t.append(head);

  r.review.forEach((q, i) => {
    const right = q.answered && q.yourCorrect;
    const tr = el("div", "aw-as-tr");
    tr.append(
      el("div", "aw-as-td", String(i + 1)),
      el("div", "aw-as-td", escapeText(q.question || "")),
      el("div", "aw-as-td", escapeText(q.answered ? (q.yourText || "") : "No answer"))
    );
    const mark = el("div", "aw-as-td aw-as-mark" + (right ? " is-right" : " is-wrong"));
    mark.innerHTML = right ? icons.check : icons.cross;
    tr.append(mark);
    // the right answer is only worth showing when they did not get it
    tr.append(el("div", "aw-as-td", escapeText(right ? "" : (q.correctText || ""))));
    t.append(tr);
  });
  return t;
}
