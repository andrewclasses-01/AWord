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
  assignmentsToArchive, hasNewResults, markAssignmentSeen,
  nameKey, prettiestName, rankCompare
} from "./assignments.js";
import { listFolders, pathTo, createFolder } from "./store.js";
import { ensureTemplate } from "./registry.js";
import { getDefaultOptions, buildOptionsControls } from "./settings.js";
// Đợt 211 — splits an options object into the keys that say WHICH CONTENT is
// played (contentMode / contentVariant / voiceVariant / contentSet, plus the
// optVer stamp) and the rest. Already the app's own name for that category —
// see VIEW_SELECTOR_KEYS in core/content-view.js.
import { splitViewOptions } from "./content-view.js";

// =============================================================
// HOMEWORK OPTIONS (Đợt C, 15/8/2026) — the bảng Options shown on both the
// "Set assignment" and "Edit assignment" forms. `draft` is edited IN PLACE
// (same contract as core/settings.js's buildOptionsControls); the caller
// reads it back when the form is submitted. Deliberately its OWN block, apart
// from the act's own PRACTICE/HOMEWORK content switch — the teacher's rule
// (APP_MASTER mục 0a, Đợt C): "HAI CÔNG TẮC RỜI NHAU".
function buildHomeworkOptionsField(body, activityType, draft) {
  body.append(el("label", "aw-as-label", "Options"));
  const host = el("div", "aw-as-optshost");
  host.append(el("div", "aw-as-note", "Loading options…"));
  body.append(host);
  ensureTemplate(activityType).then(tpl => {
    if (!host.isConnected) return;   // the form was closed while this loaded
    host.innerHTML = "";
    host.append(buildOptionsControls(tpl, draft));
  }).catch(() => {
    if (!host.isConnected) return;
    host.innerHTML = "";
    host.append(el("div", "aw-as-note", "This game's options could not be loaded."));
  });
}

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

// "24.7" — day.month, no year, no leading zeros (used in the suggested title).
function fmtDateShort(ms) {
  const d = new Date(ms);
  return `${d.getDate()}.${d.getMonth() + 1}`;
}

// Swap out just the CLASS token at the very start of a title, keeping
// whatever comes after it untouched — so editing the Class field updates
// the title live without disturbing anything the teacher typed by hand.
// classTokenOf() in assignments.js reads titles the same way (first run of
// non-space/underscore characters), so the two stay in agreement.
function replaceClassToken(title, newClass) {
  const m = String(title || "").match(/^([^\s_]*)([\s_]*)([\s\S]*)$/);
  if (!m) return newClass;
  return newClass + m[2] + m[3];
}

// A <input type="datetime-local"> wants "YYYY-MM-DDTHH:MM" in LOCAL time —
// toISOString() would shift it by the timezone, so build the string by hand.
function toLocalInput(ms) {
  const d = new Date(ms);
  const p = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}


// After a new assignment lands in a class folder, tuck any sibling made on an
// earlier day into that class's "DONE" subfolder (finding it by name, or
// creating it, only once it is actually needed). Best-effort: a failure here
// must never stop the assignment the teacher just created from opening.
async function archiveOlderSiblings(folderId, assignment) {
  if (!folderId) return;   // no class folder chosen -> nothing to file away
  const siblings = (await listAllAssignments())
    .filter(a => (a.folderId ?? null) === folderId && a.code !== assignment.code);
  const stale = assignmentsToArchive(siblings, assignment.createdAt);
  if (!stale.length) return;
  const folders = await listFolders("results");
  let done = folders.find(f => f.parentId === folderId &&
    String(f.name || "").trim().toLowerCase() === "done");
  if (!done) done = await createFolder("results", folderId, "DONE");
  await Promise.all(stale.map(a => updateAssignment(a.code, { folderId: done.id })));
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

// A round icon-only button (toolbar of the report popup) — same idea as the
// close (x) button, just with any icon and a tooltip for its label.
function iconButton(icon, title, onClick) {
  const b = el("button", "aw-as-iconbtn", icon);
  b.type = "button"; b.title = title; b.setAttribute("aria-label", title);
  b.onclick = onClick;
  return b;
}

// =============================================================
// 1. SET ASSIGNMENT — the setup form
// =============================================================
export function openAssignmentSetup(act, { onCreated } = {}) {
  openModal("optswide", (modal, close) => {
    modal.append(headRow("Set assignment", close));
    const body = el("div", "aw-as-body");
    const err = el("div", "aw-as-err", "");

    // --- class (required — this is what files the assignment under a class
    // folder in Results, and it doubles as the first word of the title)
    body.append(el("label", "aw-as-label", "Class"));
    const classInput = el("input", "aw-as-input");
    classInput.type = "text";
    classInput.maxLength = 20;
    classInput.placeholder = "e.g. A1A";
    body.append(classInput);

    // --- title — starts as "<Class> — <today, d.m> — <act title>"; typing in
    // the Class field above keeps just that leading word in step, live.
    body.append(el("label", "aw-as-label", "Assignment title"));
    const titleInput = el("input", "aw-as-input");
    titleInput.type = "text";
    titleInput.maxLength = 80;
    titleInput.value = `${classInput.value} — ${fmtDateShort(Date.now())} — ${act.title || "Untitled"}`;
    body.append(titleInput);

    let classTouched = false;
    classInput.oninput = () => {
      classTouched = true;
      titleInput.value = replaceClassToken(titleInput.value, classInput.value);
      err.textContent = "";
      showFiling();
    };

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
    const cbLeader = mk("Leaderboard", true);
    const cbAnswers = mk("Show answers", false);
    const cbAgain = mk("Start again", true);
    body.append(opts);

    // --- homework options (Đợt C) — starts from the teacher's own "Default
    // homework options" (Settings), editable just for this one assignment.
    //
    // ⭐⭐ Đợt 211 (20/8/2026, thầy) — ...AND THE ACT'S OWN CHOICE OF WHAT TO
    // PLAY IS LAID OVER THE TOP. Thầy: "trong options chọn text nhưng act vẫn
    // phát âm thanh và có nút loa để bấm nghe voice ở phía sau."
    //
    // Đợt C started this draft from the Settings defaults ALONE, and those hold
    // five general fields only (BUILTIN_DEFAULTS in core/settings.js) — no
    // `contentMode` among them. The Text/Voice row then "writes nothing until
    // the teacher actually taps" (buildContentSwitchRow, core/options-panel.js),
    // and TEXT is lit from the start, so an untouched form stored NOTHING. The
    // assignment reached the pupil with `contentMode` unset, which is the AUTO
    // branch of voiceView() — speaker button AND autoplay, the exact thing Text
    // mode exists to remove.
    //
    // Two more went the same way, silently: the clue set (act on `vi1` was
    // given out as `eng1`, activeVariant() falling back to the first) and the
    // PRACTICE/HOMEWORK half (always `practice`, activeContentSet() likewise).
    // Neither has a control on this form at all, so there was no way to correct
    // them by hand.
    //
    // ⚠️ THIS DOES NOT BREAK "HAI CÔNG TẮC RỜI NHAU" (thầy, Đợt C). That rule
    // is about the OPTIONS BUNDLE — timer, shuffling, show-answers — which
    // still starts from the homework bucket and is still decided per
    // assignment. The four keys taken from the act are the SELECTORS: not
    // settings at all, but the name of the content being assigned. Handing a
    // class a different clue set than the one on screen was never a choice
    // anyone made; it was the absence of one.
    // ⚠️ Laid OVER the defaults, so the row still shows the truth and the
    // teacher can still change Text/Voice for this one assignment afterwards.
    const hwDraft = { ...getDefaultOptions(act.type, "homework"),
                      ...splitViewOptions(act.options).selectors };
    buildHomeworkOptionsField(body, act.type, hwDraft);

    // --- where it will be filed in Results (worked out from the title)
    const filed = el("div", "aw-as-note", "");
    body.append(filed);
    let folders = [], allAssignments = [];
    Promise.all([listFolders("results"), listAllAssignments()])
      .then(([f, a]) => { folders = f; allAssignments = a; showFiling(); })
      .catch(() => { /* offline: it just files at the top of Results */ });
    // Best-effort guess for the Class field: the name of the folder this act
    // already sits in (Activities), when the teacher hasn't typed one yet.
    if (act.parentId) {
      pathTo(act.parentId).then(chain => {
        if (classTouched || classInput.value || !chain.length) return;
        classInput.value = chain[chain.length - 1].name || "";
        titleInput.value = replaceClassToken(titleInput.value, classInput.value);
        showFiling();
      }).catch(() => { /* no guess, teacher types it */ });
    }
    const showFiling = async () => {
      const folderId = classFolderFor(titleInput.value, folders);
      const where = folderId ? (await pathTo(folderId)).map(f => f.name).join(" / ") : "Results";
      filed.innerHTML = `Filed in Results under <b>${escapeText(where)}</b>`;
    };
    titleInput.oninput = () => { showFiling(); err.textContent = ""; };

    body.append(err);
    modal.append(body);

    const actions = el("div", "aw-as-actions");
    const back = button("BACK", "", close);
    const start = button("START", "aw-as-primary", async () => {
      if (!classInput.value.trim()) {
        err.textContent = "Please enter the class.";
        classInput.focus();
        return;
      }
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
          },
          options: hwDraft
        });
        try { await archiveOlderSiblings(folderId, assignment); }
        catch (e) { console.warn("AWord: could not move older assignments into DONE:", e.message); }
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
    setTimeout(() => classInput.focus(), 30);
  });
}

// =============================================================
// 2. SHARE — the link + QR handed to students
// =============================================================
export function openAssignmentShare(assignment) {
  openModal("", (modal, close) => {
    modal.append(headRow("Assignment created", close));
    const body = el("div", "aw-as-body");
    const url = assignmentLink(assignment.code, assignment.title);

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
  openModal("optswide", (modal, close) => {
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
    const cbLeader = mk("Leaderboard", end.leaderboard !== false);
    const cbAnswers = mk("Show answers", end.showAnswers !== false);
    const cbAgain = mk("Start again", end.startAgain !== false);
    body.append(opts);

    // --- homework options (Đợt C) — starts from what THIS assignment already
    // carries (never the Settings default: an assignment already out to
    // students keeps its own choice until the teacher changes it here).
    const hwDraft = { ...(assignment.activity?.options || {}) };
    buildHomeworkOptionsField(body, assignment.activityType, hwDraft);

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
          closed: cbClosed.checked,
          // Dot-path (Đợt C): rewrites ONLY `activity.options`, leaving the rest
          // of the frozen snapshot (content, theme, ...) untouched. Confirmed
          // against the published rules: `allow update: if isTeacher()` covers
          // any field — see docs/08-FIREBASE-SETUP.md.
          "activity.options": hwDraft
        };
        await updateAssignment(assignment.code, patch);
        // keep the open popups in step — `Object.assign` cannot resolve the
        // dot-path key above onto the nested `assignment.activity` itself.
        Object.assign(assignment, { title: patch.title, deadline: patch.deadline,
          endOptions: patch.endOptions, closed: patch.closed });
        assignment.activity = { ...(assignment.activity || {}), options: hwDraft };
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
  const url = assignmentLink(assignment.code, assignment.title);
  flash(await copyText(url) ? "Link copied" : url);
}
export async function copyAssignmentQr(assignment) {
  const url = assignmentLink(assignment.code, assignment.title);
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
  // a dot right after the date = students have handed in since you last looked
  if (hasNewResults(assignment)) {
    const dot = el("span", "aw-newdot aw-newdot-bar");
    dot.title = "New results";
    bar.append(dot);
  }
  bar.onclick = () => onOpen(assignment);
  return bar;
}

// =============================================================
// 4. DETAIL — the big report popup
// =============================================================
// `inAct: true` means the teacher is already looking at the activity this
// assignment came from — then "Open activity" simply closes the popup instead
// of opening a second copy of the same thing.
export function openAssignmentDetail(assignment, { onChanged, inAct = false } = {}) {
  // Opening the report IS seeing it: the red dot goes away from here on.
  const hadNews = hasNewResults(assignment);
  if (hadNews) {
    assignment.lastSeenAt = Date.now();
    markAssignmentSeen(assignment.code).then(() => onChanged?.());
  }

  openModal("wide", (modal, close) => {
    const url = assignmentLink(assignment.code, assignment.title);

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

    // Delete is deliberately NOT here — from the report the only way to remove
    // an assignment is the ⁝ menu on its card in Results (main.js), so a stray
    // click in the report never destroys it by accident.
    const tools = el("div", "aw-as-toptools");
    tools.append(
      iconButton(icons.refresh, "Refresh", () => refresh()),
      iconButton(icons.link, "Copy link", async () => flash(await copyText(url) ? "Link copied" : url)),
      iconButton(icons.qr, "Copy QR", async () => {
        try { await copyQrImage(url, 700); flash("QR image copied"); }
        catch (e) { downloadQrPng(url, `QR ${assignment.code}.png`); flash("QR saved to your Downloads"); }
      }),
      iconButton(icons.openExternal, "Open activity", () => {
        if (inAct) return close();              // already there — just get out of the way
        const num = assignment.activityNum;
        const dir = location.pathname.replace(/[^/]*$/, "");
        const target = num != null ? `?a=${encodeURIComponent(num)}`
                                   : `?play=${encodeURIComponent(assignment.activityId || "")}`;
        window.open(`${location.origin}${dir}${target}`, "_blank");
      }),
      iconButton(icons.edit, "Edit", () => openAssignmentEdit(assignment, {
        onSaved: () => { drawHead(); onChanged?.(); }
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
  // small label ON TOP, big number below — same tile for every stat here.
  const stat = (label, value) => {
    const s = el("div", "aw-as-stat");
    s.append(el("div", "aw-as-statl", label), el("div", "aw-as-statv", String(value)));
    return s;
  };
  stats.append(stat("Students", students), stat("Plays", rows.length));
  if (assignment.deadline) stats.append(stat("Late plays", rows.filter(r => r.late).length));
  if (rows.length) {
    const topScore = Math.max(...rows.map(r => r.score));
    const topRows = rows.filter(r => r.score === topScore);
    stats.append(stat("Top Score", `${topScore}/${topRows[0].total}`));

    // Fastest among those who got the top score — that IS "top speed".
    const fastest = topRows.reduce((best, r) => (!best || r.timeMs < best.timeMs) ? r : best, null);
    stats.append(stat(`Top Speed - ${escapeText(fastest.name)}`, fmtDuration(fastest.timeMs)));
  }
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
    // full marks -> the whole row is green; nothing right -> the whole row is red
    const mark = r.total > 0 && r.score === r.total ? " is-perfect"
               : r.score === 0 ? " is-zero" : "";
    table.append(row([
      String(i + 1),
      prettiestName(names.get(r.key) || [r.name]),
      `${r.score}/${r.total}`,
      fmtDuration(r.timeMs)
    ], false, mark));
  });
  wrap.append(table);
  return wrap;

  function row(cells, head, extra = "") {
    const tr = el("div", "aw-as-tr" + (head ? " is-head" : "") + extra);
    cells.forEach(c => tr.append(el("div", "aw-as-td", escapeText(c))));
    return tr;
  }
}

// Every attempt, sortable, and each row opens to show the answers given.
function detailBlock(assignment, rows) {
  const wrap = el("div", "aw-as-block aw-as-block-details");
  wrap.append(el("div", "aw-as-blockhead", "Details"));
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
      // full marks -> the whole row reads in green, same idea as the leaderboard
      const perfect = r.total > 0 && r.score === r.total;
      const tr = el("div", "aw-as-tr aw-as-clickable" + (perfect ? " is-perfect" : ""));
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

      // Collapsed by default; opening animates height+opacity smoothly instead
      // of an instant display:none/block jump cut.
      const detail = el("div", "aw-as-answers");
      detail.append(answersTable(r));
      table.append(detail);

      // Opening one student puts the popup in FOCUS MODE: that row and the
      // answers below it stay bright, everything else dims away so the teacher
      // reads one child's work without the rest of the page competing.
      tr.onclick = () => {
        const open = tr.classList.contains("is-open");
        closeAllRows();
        if (!open) {
          tr.classList.add("is-open");
          tr.querySelector(".aw-as-caret").textContent = "▾";
          detail.style.maxHeight = detail.scrollHeight + "px";
          detail.classList.add("is-open");
          setFocusMode(true, [tr, detail]);
        }
      };
    });

    function closeAllRows() {
      table.querySelectorAll(".aw-as-answers").forEach(d => { d.style.maxHeight = "0px"; d.classList.remove("is-open"); });
      table.querySelectorAll(".aw-as-tr.is-open").forEach(r => {
        r.classList.remove("is-open");
        const c = r.querySelector(".aw-as-caret");
        if (c) c.textContent = "▸";
      });
      setFocusMode(false);
    }

    // Dim everything except the pieces passed in.
    function setFocusMode(on, keep = []) {
      const modal = wrap.closest(".aw-as-modal");
      if (!modal) return;
      modal.classList.toggle("is-focus", on);
      modal.querySelectorAll(".aw-as-lit").forEach(x => x.classList.remove("aw-as-lit"));
      if (on) keep.forEach(x => x.classList.add("aw-as-lit"));
    }
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
