// =============================================================
// main.js — AWord HOME, a Google-Drive-style library.
//
//   Top level: two FIXED folders — Activities (games) and Results (kept for
//   student results, filled in the Firebase phase). Neither can be deleted.
//
//   Inside a root: a toolbar [New game* · New folder · Recycle bin · Search ·
//   grid/list view], a breadcrumb, then the sub-folders and acts.
//     * "New game" shows only inside Activities.
//
//   Folder ⁝ menu:  Open in new tab · Copy link · Rename · Move · Duplicate · Delete
//   Act ⁝ menu:     Open in new tab · Copy link · Edit content · Rename · ...
//   Delete -> Recycle bin (per root). Permanent delete happens in the bin.
//
//   LINKS (v0.8.0): every folder/act carries a short NUMBER, so its address is
//   ?r=activities · ?f=12 · ?f=12&a=57 · ?a=57. The address bar follows wherever
//   the teacher is (Back/Forward work), and the same link opens the same item on
//   any computer signed into the teacher's account. Old ?play=/?folder= links
//   still open, and are quietly upgraded to the short form.
// =============================================================

import { startGame } from "./core/engine.js";
import { el, copyText } from "./core/utils.js";
import { icons } from "./core/icons.js";
import { getTemplate } from "./core/registry.js";
import { TEMPLATES, templateLabel } from "./core/catalog.js";
import { getDefaultOptions, saveDefaultOptions, buildOptionsControls } from "./core/settings.js";
import {
  ROOTS, itemName, getItem, getByNum, ensureNumbers, listChildren, pathTo, listFolders, searchItems, listTrash,
  createFolder, saveActivity, renameItem, moveItem, duplicateItem, trashItem, restoreItem, deleteForever,
  setFolderColor, folderCounts,
  resetCache, pendingImportCount, importLocalLibrary, markMigrated, wasMigrated
} from "./core/store.js";
import { currentUser, signIn, signOutNow, TEACHER_EMAIL } from "./core/firebase.js";
import {
  listAllAssignments, listAssignmentsForAct, updateAssignment, trashAssignment,
  restoreAssignment, deleteAssignmentForever, assignmentNameTaken, hasNewResults
} from "./core/assignments.js";
import {
  openAssignmentDetail, openAssignmentEdit, confirmTrashAssignment,
  copyAssignmentLink, copyAssignmentQr
} from "./core/assignment-ui.js";
import "./templates/quiz/quiz.js";   // registers the quiz template (+ its editor)

const app = document.getElementById("app");

const ROOT_LABEL = { activities: "Activities", results: "Results" };
const FOLDER_SVG = '<svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor"><path d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2Z"/></svg>';
const DOTS = '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>';
const PREVIEW_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
const FOLDER_DEFAULT_COLOR = "#f5b13b";
// Modern 8-color set for the folder-color picker.
const FOLDER_COLORS = ["#ef4444", "#f97316", "#f5b13b", "#22c55e", "#14b8a6", "#3b82f6", "#8b5cf6", "#ec4899"];

const state = {
  view: "top",          // "top" | "folder" | "search" | "trash"
  root: null,           // "activities" | "results"
  folderId: null,       // current folder (null = root of the tree)
  mode: localStorage.getItem("aword-view") || "grid",   // "grid" | "list"
  query: "",
  user: null            // the signed-in teacher (null = signed out)
};

let skipMigrationThisSession = false;

init();

// The library lives in the cloud and is private, so nothing renders until the
// teacher is signed in (the teacher chose "require sign-in", 19/7/2026).
async function init() {
  let user = null;
  try {
    user = await currentUser();
  } catch (e) {
    renderLogin("Could not reach Firebase. Check your internet connection.");
    return;
  }
  if (!user) { renderLogin(); return; }
  state.user = user;

  try {
    await maybeOfferMigration();
    await maybeSeed();
    await ensureNumbers();      // one-time: give older items their link numbers
  } catch (e) {
    renderLogin("Could not load your library: " + e.message);
    return;
  }

  window.addEventListener("popstate", () => routeFromLocation());
  await routeFromLocation();
}

// ---------------- shareable links & the address bar (v0.8.0) ----------------
// Folders and acts are addressed by their SHORT NUMBER, so a link can be copied
// between the teacher's computers (same Google account) and land in the same
// place:  ?r=activities  ·  ?f=12  ·  ?f=12&a=57  ·  ?a=57 (act outside folders)
// The old ?play=<id> / ?folder=<root>~<id> links still work.
function baseUrl() { return location.origin + location.pathname; }

async function linkFor(node) {
  const p = new URLSearchParams();
  if (node.kind === "folder") {
    p.set("f", node.num);
  } else {
    if (node.parentId) {
      const parent = await getItem(node.parentId);
      if (parent && typeof parent.num === "number") p.set("f", parent.num);
    }
    p.set("a", node.num);
  }
  return `${baseUrl()}?${p.toString()}`;
}

function setUrl(url, replace) {
  if (url === location.href) return;
  history[replace ? "replaceState" : "pushState"]({}, "", url);
}

// Read the address bar and show whatever it points at (also used by Back/Forward).
// `fromUrl: true` stops the navigation helpers from pushing the address again —
// we are following the address bar, not driving it.
async function routeFromLocation() {
  const p = new URLSearchParams(location.search);
  const opts = { fromUrl: true };

  const actKey = p.get("a") || p.get("play");
  if (actKey) {
    const node = p.get("a") ? await getByNum(p.get("a")) : await getItem(p.get("play"));
    if (node && node.kind === "act") {
      state.view = "play";
      if (!p.get("a")) setUrl(await linkFor(node), true);   // upgrade an old link in place
      startGame(app, node, { onExit: goTop });
      return;
    }
  }
  if (p.get("f")) {
    const node = await getByNum(p.get("f"));
    if (node && node.kind === "folder") return enterFolder(node.root, node.id, opts);
  }
  if (p.get("r") && ROOTS.includes(p.get("r"))) return openRoot(p.get("r"), opts);
  if (p.get("folder")) {                                    // legacy link
    const [root, fid] = p.get("folder").split("~");
    if (ROOTS.includes(root)) {
      const node = fid ? await getItem(fid) : null;
      setUrl(node ? await linkFor(node) : `${baseUrl()}?r=${root}`, true);
      return enterFolder(root, fid || null, opts);
    }
  }
  goTop(opts);
}

// Point the address bar at wherever the library currently is.
async function syncUrl(replace) {
  if (state.view === "top") return setUrl(baseUrl(), replace);
  if (state.folderId) {
    const node = await getItem(state.folderId);
    if (node) return setUrl(await linkFor(node), replace);
  }
  if (state.root) setUrl(`${baseUrl()}?r=${state.root}`, replace);
}

async function copyLinkFlow(node) {
  const url = await linkFor(node);
  const ok = await copyText(url);
  toastMsg(ok ? "Link copied" : url);
}


// ---------------- sign-in screen ----------------
function renderLogin(errorMsg) {
  app.innerHTML = "";
  const wrap = el("div", "aw-lib");
  const bar = el("div", "aw-appbar");
  bar.append(logo(false));
  wrap.append(bar);

  const card = el("div", "aw-login");
  card.append(el("div", "aw-login-title", "Your games, on any computer"));
  card.append(el("div", "aw-login-sub",
    "Sign in to open your library of folders and activities."));

  const btn = el("button", "aw-login-btn");
  btn.type = "button";
  btn.append(el("span", "aw-login-g", GOOGLE_G), el("span", null, "Sign in with Google"));
  btn.onclick = async () => {
    btn.disabled = true;
    err.textContent = "";
    try {
      await signIn();
      resetCache();
      await init();
    } catch (e) {
      btn.disabled = false;
      if (e.code === "auth/popup-closed-by-user" || e.code === "auth/cancelled-popup-request") return;
      err.textContent = e.code === "aw/not-teacher" ? e.message : (e.message || "Sign-in failed.");
    }
  };
  card.append(btn);

  const err = el("div", "aw-login-err", errorMsg ? escapeHtml(errorMsg) : "");
  card.append(err);
  card.append(el("div", "aw-login-note", `Only ${escapeHtml(TEACHER_EMAIL)} can open this library.`));

  wrap.append(card);
  wrap.append(footer());
  app.append(wrap);
  requestAnimationFrame(() => sizeBrand(wrap));
}

const GOOGLE_G = `<svg viewBox="0 0 48 48" width="20" height="20"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>`;

// Offer to lift a library that was saved in THIS browser before we went online.
async function maybeOfferMigration() {
  if (skipMigrationThisSession || wasMigrated()) return;
  // Only prompt for items the cloud does NOT already have — otherwise the
  // teacher gets asked to "copy up" work that is demonstrably already there.
  const n = await pendingImportCount();
  if (n === 0) { markMigrated(); return; }
  await new Promise(resolve => {
    openModal("Bring your saved work online?", (body, close) => {
      body.append(el("div", "aw-modal-text",
        `This computer has <b>${n}</b> item${n === 1 ? "" : "s"} saved from before AWord went online. ` +
        `Copy them into your cloud library so they show up on every computer?`));
      const actions = el("div", "aw-modal-actions");
      const later = el("button", "aw-btn", "Not now");
      later.type = "button";
      later.onclick = () => { skipMigrationThisSession = true; close(); resolve(); };
      const go = el("button", "aw-btn aw-btn-primary", "Copy them up");
      go.type = "button";
      go.onclick = async () => {
        go.disabled = true; later.disabled = true; go.textContent = "Copying...";
        try {
          const added = await importLocalLibrary();
          markMigrated();
          close();
          toastMsg(`${added} item${added === 1 ? "" : "s"} copied to your cloud library.`);
        } catch (e) {
          go.disabled = false; later.disabled = false; go.textContent = "Copy them up";
          body.append(el("div", "aw-ed-error", escapeHtml(e.message || "Copy failed.")));
          return;
        }
        resolve();
      };
      actions.append(later, go);
      body.append(actions);
    }, () => { skipMigrationThisSession = true; resolve(); });
  });
}

// Small floating confirmation used by the library pages.
// `.aw-lib-toast` starts at opacity 0 — it only shows once `.is-on` is added.
function toastMsg(msg) {
  const t = el("div", "aw-lib-toast", escapeHtml(msg));
  document.body.append(t);
  requestAnimationFrame(() => t.classList.add("is-on"));
  setTimeout(() => { t.classList.remove("is-on"); setTimeout(() => t.remove(), 250); }, 3000);
}

function escapeHtml(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function maybeSeed() {
  // seed the sample quiz the first time the library is ever empty
  const anyActivities = await listChildren("activities", null);
  const anyFolders = (await listFolders("activities")).length;
  if (anyActivities.length === 0 && anyFolders === 0) {
    const { activity } = await import("./templates/quiz/sample-quiz.js");
    await saveActivity(activity, { root: "activities", parentId: null });
  }
}

// ---------------- render dispatch ----------------
async function render() {
  closeMenu();
  app.innerHTML = "";
  if (state.view === "top") return renderTop();
  return renderInside();
}
function goTop(opts = {}) {
  state.view = "top"; state.root = null; state.folderId = null; state.query = "";
  if (!opts.fromUrl) syncUrl();
  render();
}

// ---------------- top level: two fixed roots ----------------
function renderTop() {
  const wrap = el("div", "aw-lib");
  wrap.append(topbar(false));   // home: logo + settings only (no Activities/Results nav)

  const grid = el("div", "aw-roots");
  ROOTS.forEach(root => {
    const card = el("button", "aw-root-card");
    card.type = "button";
    card.onclick = () => openRoot(root);
    const ic = el("div", "aw-root-icon", FOLDER_SVG);
    card.append(ic, el("div", "aw-root-name", ROOT_LABEL[root]));
    grid.append(card);
  });
  wrap.append(grid);
  wrap.append(footer());
  app.append(wrap);
}
function openRoot(root, opts = {}) {
  state.view = "folder"; state.root = root; state.folderId = null; state.query = "";
  if (!opts.fromUrl) syncUrl();
  render();
}

// ---------------- inside a root (folder / search / trash) ----------------
async function renderInside() {
  const wrap = el("div", "aw-lib");

  // header: logo (left) + settings/Activities/Results cluster (right)
  wrap.append(topbar(true));

  wrap.append(await breadcrumb());
  wrap.append(toolbar());

  const body = el("div", "aw-fm-body");
  wrap.append(body);
  wrap.append(footer());
  app.append(wrap);

  let items;
  if (state.view === "trash") items = await listTrash(state.root);
  else if (state.view === "search") items = await searchItems(state.root, state.query);
  else items = await listChildren(state.root, state.folderId);

  // RESULTS shows the assignments themselves — there is no copy of them in the
  // library, so what you see here IS the strip under the act (v0.9.0).
  const assignments = state.root === "results" ? await assignmentsForView() : await loadAssignmentsForDots();

  if (!items.length && !assignments.length) {
    body.append(el("div", "aw-fm-empty",
      state.view === "trash" ? "Recycle bin is empty."
      : state.view === "search" ? `No results for “${escapeText(state.query)}”.`
      : state.root === "results" ? "No assignments here yet. Give one out from an activity."
      : "This folder is empty."));
    return;
  }

  // needed to roll the "new results" dot up from an assignment to its folders
  const resultFolders = state.root === "results" ? await listFolders("results") : [];

  const list = el("div", state.mode === "grid" ? "aw-fm-grid" : "aw-fm-list");
  for (const node of items) {
    let card;
    if (state.view === "trash") card = trashCard(node);
    else if (node.kind === "folder") {
      card = folderCard(node, await folderCounts(node.id), assignmentCountIn(node.id),
                        state.root === "results" && folderHasNews(node.id, resultFolders));
    } else card = actCard(node);
    list.append(card);
  }
  if (state.root === "results") {
    assignments.forEach(a => list.append(state.view === "trash" ? trashAssignmentCard(a) : assignmentCard(a)));
  }
  body.append(list);
}

// In ACTIVITIES we do not show assignments, but we still want the "new results"
// dot on the acts that have some, so the list is fetched (one query) anyway.
async function loadAssignmentsForDots() {
  try { assignmentCache = await listAllAssignments({ includeTrashed: true }); }
  catch (e) { assignmentCache = []; }
  return [];
}

// A small red dot in the top-right corner of a card, like a phone notification.
function newDot(title) {
  const dot = el("span", "aw-newdot");
  dot.title = title || "New results";
  return dot;
}

// Does anything inside this folder (at any depth) have new results?
function folderHasNews(folderId, allFolders) {
  const inside = new Set([folderId]);
  let grew = true;
  while (grew) {
    grew = false;
    allFolders.forEach(f => {
      if (!inside.has(f.id) && inside.has(f.parentId ?? null)) { inside.add(f.id); grew = true; }
    });
  }
  return assignmentCache.some(a => !a.trashed && inside.has(a.folderId ?? null) && hasNewResults(a));
}

function actHasNews(actId) {
  return assignmentCache.some(a => !a.trashed && a.activityId === actId && hasNewResults(a));
}

// ---------------- assignments inside Results ----------------
// One fetch per render, cached for the counting helpers below.
let assignmentCache = [];

async function assignmentsForView() {
  try {
    assignmentCache = await listAllAssignments({ includeTrashed: true });
  } catch (e) {
    assignmentCache = [];
    return [];
  }
  const byName = (a, b) => String(a.title || "").toLowerCase().localeCompare(String(b.title || "").toLowerCase());
  if (state.view === "trash") return assignmentCache.filter(a => a.trashed).sort((a, b) => (b.trashedAt || 0) - (a.trashedAt || 0));
  if (state.view === "search") {
    const q = state.query.trim().toLowerCase();
    return assignmentCache.filter(a => !a.trashed && String(a.title || "").toLowerCase().includes(q)).sort(byName);
  }
  return assignmentCache.filter(a => !a.trashed && (a.folderId ?? null) === (state.folderId ?? null)).sort(byName);
}

// How many assignments sit anywhere inside this Results folder (for the badge).
function assignmentCountIn(folderId) {
  if (state.root !== "results") return 0;
  return assignmentCache.filter(a => !a.trashed && (a.folderId ?? null) === folderId).length;
}

async function breadcrumb() {
  const bc = el("div", "aw-fm-crumbs");
  const home = el("button", "aw-crumb", "Home"); home.onclick = goTop;
  bc.append(home, sep());
  const rootBtn = el("button", "aw-crumb", ROOT_LABEL[state.root]);
  rootBtn.onclick = () => openRoot(state.root);
  makeDropTarget(rootBtn, () => null);   // drop here -> move to the root of this tree
  bc.append(rootBtn);
  if (state.view === "trash") { bc.append(sep(), el("span", "aw-crumb is-current", "Recycle bin")); return bc; }
  if (state.view === "search") { bc.append(sep(), el("span", "aw-crumb is-current", "Search")); return bc; }
  const chain = await pathTo(state.folderId);
  chain.forEach((f, i) => {
    bc.append(sep());
    const isCurrent = i === chain.length - 1;
    const b = el(isCurrent ? "span" : "button", "aw-crumb" + (isCurrent ? " is-current" : ""), escapeText(itemName(f)));
    if (!isCurrent) b.onclick = () => enterFolder(state.root, f.id);
    makeDropTarget(b, () => f.id, f);    // drop an item onto an ancestor folder crumb
    bc.append(b);
  });
  return bc;
  function sep() { return el("span", "aw-crumb-sep", "›"); }
}

function toolbar() {
  const bar = el("div", "aw-fm-toolbar");
  const left = el("div", "aw-fm-tools");

  if (state.view !== "trash" && state.root === "activities") {
    const newAct = el("button", "aw-btn aw-btn-primary aw-fm-newbtn", "+ New activity");
    newAct.type = "button"; newAct.onclick = newActivityFlow;
    left.append(newAct);
  }
  if (state.view !== "trash") {
    const newFolder = el("button", "aw-btn aw-fm-newbtn", "+ New folder");
    newFolder.type = "button"; newFolder.onclick = newFolderFlow;
    left.append(newFolder);
  }
  const bin = el("button", "aw-btn aw-fm-newbtn" + (state.view === "trash" ? " is-on" : ""),
    state.view === "trash" ? "← Back" : "Recycle bin");
  bin.type = "button";
  bin.onclick = () => { if (state.view === "trash") enterFolder(state.root, null); else { state.view = "trash"; render(); } };
  left.append(bin);
  bar.append(left);

  const right = el("div", "aw-fm-tools");
  if (state.view !== "trash") {
    const form = el("form", "aw-fm-search");
    const inp = el("input", "aw-fm-searchinput"); inp.type = "search"; inp.placeholder = "Search…"; inp.value = state.query;
    const btn = el("button", "aw-fm-searchbtn", icons.search || "🔍"); btn.type = "submit"; btn.title = "Search";
    form.onsubmit = e => { e.preventDefault(); const q = inp.value.trim(); state.query = q; state.view = q ? "search" : "folder"; render(); };
    form.append(inp, btn);
    right.append(form);

    const grp = el("div", "aw-fm-viewtoggle");
    const g = viewBtn("grid", GRID_SVG, "Grid view");
    const l = viewBtn("list", LIST_SVG, "List view");
    grp.append(g, l);
    right.append(grp);
  }
  bar.append(right);
  return bar;

  function viewBtn(mode, svg, title) {
    const b = el("button", "aw-fm-vbtn" + (state.mode === mode ? " is-on" : ""), svg);
    b.type = "button"; b.title = title;
    b.onclick = () => { state.mode = mode; localStorage.setItem("aword-view", mode); render(); };
    return b;
  }
}

// ---------------- cards ----------------
// Folder card mirrors the act card: a big icon in a preview area on top, then a
// foot with the name + ⁝ menu (⁝ pinned bottom-left). A count sits on the icon:
//   • only acts inside            -> one number (total acts, recursive)
//   • both subfolders AND acts    -> [direct subfolders] | [total acts], 2 colors
//   • no acts at all              -> nothing
// Also a drag-drop target.
// A card for one assignment inside Results. Clicking opens the same report the
// strip under the act opens — same document, same everything.
function assignmentCard(a) {
  const card = el("div", "aw-card aw-card-asg");
  card.onclick = () => openAssignmentDetail(a, { onChanged: render });

  const preview = el("div", "aw-fp");
  const ic = el("div", "aw-fp-icon aw-fp-asg", icons.assignment);
  preview.append(ic);
  if (a.closed) preview.append(el("div", "aw-asg-flag", "CLOSED"));
  else if (a.deadline && Date.now() > a.deadline) preview.append(el("div", "aw-asg-flag aw-asg-flag-due", "PAST DUE"));
  card.append(preview);
  if (hasNewResults(a)) card.append(newDot("New results"));

  const foot = el("div", "aw-card-foot");
  const info = el("div", "aw-card-info");
  info.append(el("div", "aw-card-name", escapeText(a.title || a.code)),
              el("span", "aw-card-type", "ASSIGNMENT"));
  foot.append(info, menuButton(a, assignmentMenuItems));
  card.append(foot);

  makeAssignmentDraggable(card, a);   // drag into a Results folder / breadcrumb
  return card;
}

function trashAssignmentCard(a) {
  const card = el("div", "aw-card aw-card-trash");
  card.append(el("div", "aw-folder-icon", icons.assignment));
  const foot = el("div", "aw-card-foot aw-card-foot-trash");
  foot.append(el("div", "aw-card-name", escapeText(a.title || a.code)));
  const acts = el("div", "aw-trash-actions");
  const restore = el("button", "aw-btn", "Restore"); restore.type = "button";
  restore.onclick = async () => { await restoreAssignment(a.code); toastMsg("Assignment restored"); render(); };
  const del = el("button", "aw-btn aw-lib-del", "Delete forever"); del.type = "button";
  del.onclick = async () => {
    if (!window.confirm(`Permanently delete “${a.title || a.code}” AND every score collected for it? This cannot be undone.`)) return;
    del.disabled = restore.disabled = true; del.textContent = "Deleting...";
    try { await deleteAssignmentForever(a.code); toastMsg("Assignment deleted"); }
    catch (e) { toastMsg(e.message || "Could not delete"); }
    render();
  };
  acts.append(restore, del);
  foot.append(acts);
  card.append(foot);
  return card;
}

function folderCard(node, counts, assignmentCount = 0, hasNews = false) {
  const card = el("div", "aw-card aw-card-folder");
  card.onclick = () => enterFolder(node.root, node.id);

  const preview = el("div", "aw-fp");
  const ic = el("div", "aw-fp-icon", FOLDER_SVG);
  ic.style.color = node.color || FOLDER_DEFAULT_COLOR;
  preview.append(ic);

  // In Results the number that matters is how many assignments are inside.
  const { folders = 0, acts = assignmentCount } = state.root === "results" ? { folders: 0 } : (counts || {});
  if (acts > 0) {
    const badge = el("div", "aw-fp-count");
    if (folders > 0) {
      // acts first (blue), then folders (amber-orange), split by a short divider
      badge.classList.add("aw-fp-count-two");
      badge.append(el("span", "aw-fp-n aw-fp-n-acts", String(acts)));
      badge.append(el("span", "aw-fp-div"));
      badge.append(el("span", "aw-fp-n aw-fp-n-folders", String(folders)));
    } else {
      badge.append(el("span", "aw-fp-n aw-fp-n-acts", String(acts)));
    }
    preview.append(badge);
  }
  card.append(preview);
  if (hasNews) card.append(newDot("New results inside"));

  const foot = el("div", "aw-card-foot");
  const info = el("div", "aw-card-info");
  info.append(el("div", "aw-card-name", escapeText(itemName(node))));
  foot.append(info, menuButton(node, folderMenuItems));
  card.append(foot);

  makeDraggable(card, node);
  makeDropTarget(card, () => node.id, node);   // drop another item INTO this folder
  return card;
}

function actCard(node) {
  const card = el("div", "aw-card aw-card-act");

  const preview = el("div", "aw-cp");
  const qs = node.content?.questions || [];
  const q = qs.length ? qs[Math.floor(Math.random() * qs.length)] : null;
  if (q) {
    preview.append(el("div", "aw-cp-q", escapeText(q.question || "")));
    const chips = el("div", "aw-cp-answers");
    (q.answers || []).slice(0, 4).forEach((a, i) => {
      const chip = el("div", "aw-cp-chip", escapeText(a.text || ""));
      chip.style.background = PREVIEW_COLORS[i % PREVIEW_COLORS.length];
      chips.append(chip);
    });
    preview.append(chips);
  } else {
    preview.append(el("div", "aw-cp-empty", "No questions yet"));
  }
  const playBtn = el("button", "aw-cp-play", icons.playBig);
  playBtn.type = "button"; playBtn.title = "Play";
  playBtn.onclick = e => { e.stopPropagation(); playAct(node.id); };
  preview.append(playBtn);
  card.append(preview);
  // an act wears the dot when one of ITS assignments has new results
  if (actHasNews(node.id)) card.append(newDot("New results in an assignment"));

  const foot = el("div", "aw-card-foot");
  const info = el("div", "aw-card-info");
  // name on TOP, template type BELOW it (matches the agreed card layout)
  info.append(el("div", "aw-card-name", escapeText(itemName(node))), el("span", "aw-card-type", escapeText(node.type || "quiz")));
  foot.append(info, menuButton(node, actMenuItems));
  card.append(foot);

  makeDraggable(card, node);   // an act can be dragged into a folder / breadcrumb
  return card;
}

// ---------------- drag & drop (move into folders / breadcrumb) ----------------
let draggingId = null;
function makeDraggable(card, node) {
  card.draggable = true;
  card.addEventListener("dragstart", e => {
    draggingId = node.id;
    e.dataTransfer.effectAllowed = "move";
    try { e.dataTransfer.setData("text/plain", node.id); } catch { /* ignore */ }
    card.classList.add("is-dragging");
  });
  card.addEventListener("dragend", () => {
    draggingId = null;
    card.classList.remove("is-dragging");
    document.querySelectorAll(".is-dropok").forEach(x => x.classList.remove("is-dropok"));
  });
}
// `target` (optional) = the node this element represents, so we never drop an
// item onto itself. `getParentId()` returns the destination folder id (or null).
// Assignments are dragged the same way; they carry an "asg:" prefix because
// they live in a different collection from the library items.
function makeAssignmentDraggable(card, a) {
  card.draggable = true;
  card.addEventListener("dragstart", e => {
    draggingId = "asg:" + a.code;
    e.dataTransfer.effectAllowed = "move";
    try { e.dataTransfer.setData("text/plain", a.code); } catch { /* ignore */ }
    card.classList.add("is-dragging");
  });
  card.addEventListener("dragend", () => {
    draggingId = null;
    card.classList.remove("is-dragging");
    document.querySelectorAll(".is-dropok").forEach(x => x.classList.remove("is-dropok"));
  });
}

function makeDropTarget(elm, getParentId, target) {
  elm.addEventListener("dragover", e => {
    if (draggingId == null || (target && draggingId === target.id)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    elm.classList.add("is-dropok");
  });
  elm.addEventListener("dragleave", () => elm.classList.remove("is-dropok"));
  elm.addEventListener("drop", async e => {
    e.preventDefault();
    elm.classList.remove("is-dropok");
    const id = draggingId; draggingId = null;
    if (id == null || (target && id === target.id)) return;
    try {
      if (String(id).startsWith("asg:")) await moveAssignmentTo(String(id).slice(4), getParentId());
      else await moveItem(id, getParentId());   // guards against folder-into-own-subtree
    } catch (err) {
      toastMsg(err.message || "Could not move that here.");
    }
    render();
  });
}

// Move one assignment into a Results folder (null = top level), refusing a
// name that is already used there.
async function moveAssignmentTo(code, folderId) {
  const all = await listAllAssignments({ includeTrashed: true });
  const a = all.find(x => x.code === code);
  if (!a) return;
  if (assignmentNameTaken(all, { folderId, title: a.title, exceptCode: code })) {
    throw new Error(`“${a.title}” already exists in that folder.`);
  }
  await updateAssignment(code, { folderId: folderId ?? null });
}

// ⁝ Move for an assignment — the same folder-tree picker the library uses.
async function moveAssignmentFlow(a) {
  const folders = await listFolders("results");
  openModal("Move to", (body, close) => {
    const tree = el("div", "aw-move-tree");
    let chosen = null;                       // null = top level of Results
    tree.append(pickRow(ROOT_LABEL.results, 0, null));
    renderChildren(null, 1);
    body.append(tree);

    const err = el("div", "aw-ed-error", "");
    err.style.display = "none";
    body.append(err);

    const actions = el("div", "aw-modal-actions");
    const cancel = el("button", "aw-btn", "Cancel"); cancel.type = "button"; cancel.onclick = close;
    const ok = el("button", "aw-btn aw-btn-primary", "Move here"); ok.type = "button";
    ok.onclick = async () => {
      try { await moveAssignmentTo(a.code, chosen); close(); render(); }
      catch (e) { err.style.display = ""; err.textContent = e.message; }
    };
    actions.append(cancel, ok);
    body.append(actions);

    function renderChildren(parentId, depth) {
      folders.filter(f => (f.parentId ?? null) === (parentId ?? null))
        .sort((x, y) => itemName(x).localeCompare(itemName(y)))
        .forEach(f => { tree.append(pickRow(itemName(f), depth, f.id)); renderChildren(f.id, depth + 1); });
    }
    function pickRow(label, depth, id) {
      const row = el("button", "aw-move-row");
      row.type = "button"; row.style.paddingLeft = (10 + depth * 18) + "px";
      row.append(el("span", "aw-move-ic", FOLDER_SVG), el("span", null, escapeText(label)));
      row.onclick = () => { chosen = id; tree.querySelectorAll(".aw-move-row").forEach(r => r.classList.remove("is-sel")); row.classList.add("is-sel"); };
      return row;
    }
  });
}

function trashCard(node) {
  const card = el("div", "aw-card aw-card-trash");
  card.append(el("div", "aw-folder-icon", node.kind === "folder" ? FOLDER_SVG : (icons.template || FOLDER_SVG)));
  const foot = el("div", "aw-card-foot aw-card-foot-trash");
  foot.append(el("div", "aw-card-name", escapeText(itemName(node))));
  const acts = el("div", "aw-trash-actions");
  const restore = el("button", "aw-btn", "Restore"); restore.type = "button";
  restore.onclick = async () => { await restoreItem(node.id); render(); };
  const del = el("button", "aw-btn aw-lib-del", "Delete forever"); del.type = "button";
  del.onclick = async () => { if (window.confirm(`Permanently delete “${itemName(node)}”? This cannot be undone.`)) { await deleteForever(node.id); render(); } };
  acts.append(restore, del);
  foot.append(acts);
  card.append(foot);
  return card;
}

function menuButton(node, itemsFn) {
  const b = el("button", "aw-card-menu", DOTS);
  b.type = "button"; b.title = "Options"; b.setAttribute("aria-label", "Options");
  b.onclick = e => { e.stopPropagation(); openMenu(b, itemsFn(node)); };
  return b;
}

// ---------------- ⁝ menu contents ----------------
function folderMenuItems(node) {
  return [
    ["Open in new tab", () => openInNewTab(node)],
    ["Copy link", () => copyLinkFlow(node)],
    ["Rename", () => renameFlow(node)],
    ["Color", () => colorFlow(node)],
    ["Move", () => moveFlow(node)],
    ["Duplicate", () => duplicateFlow(node)],
    ["Delete", () => deleteFlow(node), true]
  ];
}
function assignmentMenuItems(a) {
  return [
    ["Open report", () => openAssignmentDetail(a, { onChanged: render })],
    ["Copy student link", () => copyAssignmentLink(a)],
    ["Copy QR image", () => copyAssignmentQr(a)],
    ["Edit", () => openAssignmentEdit(a, { onSaved: render })],
    ["Move", () => moveAssignmentFlow(a)],
    ["Delete", () => confirmTrashAssignment(a, { onDone: render }), true]
  ];
}
function actMenuItems(node) {
  return [
    ["Open in new tab", () => openInNewTab(node)],
    ["Copy link", () => copyLinkFlow(node)],
    ["Edit content", () => editAct(node.id)],
    ["Rename", () => renameFlow(node)],
    ["Duplicate", () => duplicateFlow(node)],
    ["Move", () => moveFlow(node)],
    ["Delete", () => deleteFlow(node), true]
  ];
}

// ---------------- actions ----------------
async function playAct(id) {
  const node = await getItem(id);
  if (!node) return render();
  state.view = "play";
  setUrl(await linkFor(node));               // the address bar now points at this act
  startGame(app, node, { onExit: goTop });   // the in-game Home button returns here
}
// Edit content -> open the editor for THIS act's type (each template registers
// its own `edit`). Falls back gracefully if a type has no editor yet.
async function editAct(id) {
  const node = await getItem(id);
  if (!node) return render();
  const tpl = getTemplate(node.type);
  if (!tpl || !tpl.edit) { toast(`${templateLabel(node.type)} — editor coming soon`); return; }
  tpl.edit(app, node, {
    header: topbar(true),
    footer: footer(),
    onSave: async updated => { await saveActivity(updated); render(); },
    onCancel: render
  });
}

// "+ New activity" -> pick an act TYPE first (each type has its own edit page),
// then open that type's editor on a blank act seeded with the Settings defaults.
function newActivityFlow() {
  openModal("New activity", (body, close) => {
    body.append(el("div", "aw-pick-hint", "Choose an activity type to create."));
    const grid = el("div", "aw-pick-grid");
    TEMPLATES.forEach(t => {
      const cardCls = "aw-pick-card" + (t.built ? "" : " is-soon");
      const card = el("button", cardCls);
      card.type = "button";
      card.append(el("div", "aw-pick-name", t.label));
      card.append(el("div", "aw-pick-blurb", t.blurb || ""));
      if (!t.built) card.append(el("span", "aw-pick-soon", "Coming soon"));
      card.onclick = () => {
        if (!t.built) { toast(`${t.label} — coming soon`); return; }
        close();
        createBlankAct(t.type);
      };
      grid.append(card);
    });
    body.append(grid);
    const actions = el("div", "aw-modal-actions");
    const cancel = el("button", "aw-btn", "Cancel"); cancel.type = "button"; cancel.onclick = close;
    actions.append(cancel);
    body.append(actions);
  });
}

function createBlankAct(type) {
  const tpl = getTemplate(type);
  if (!tpl || !tpl.edit) { toast(`${templateLabel(type)} — editor coming soon`); return; }
  const blank = {
    type, schemaVersion: 1, title: "", instruction: "", theme: "classic",
    options: getDefaultOptions(type),   // inherit the teacher's Settings defaults
    content: { questions: [] }
  };
  const root = state.root, parentId = state.folderId;
  tpl.edit(app, blank, {
    header: topbar(true),
    footer: footer(),
    onSave: async updated => { await saveActivity(updated, { root, parentId }); enterFolder(root, parentId); },
    onCancel: () => enterFolder(root, parentId)
  });
}
function newFolderFlow() {
  openTextModal("New folder", "Folder name", "", async name => {
    if (name.trim()) { await createFolder(state.root, state.folderId, name.trim()); render(); }
  });
}
function renameFlow(node) {
  openTextModal("Rename", "New name", itemName(node), async name => {
    if (name.trim()) { await renameItem(node.id, name.trim()); render(); }
  });
}
function colorFlow(node) {
  openModal("Folder color", (body, close) => {
    const grid = el("div", "aw-colorgrid");
    const current = node.color || FOLDER_DEFAULT_COLOR;
    FOLDER_COLORS.forEach(c => {
      const sw = el("button", "aw-swatch" + (c.toLowerCase() === current.toLowerCase() ? " is-sel" : ""));
      sw.type = "button"; sw.title = c; sw.style.background = c;
      sw.onclick = async () => { await setFolderColor(node.id, c); close(); render(); };
      grid.append(sw);
    });
    body.append(grid);
    const actions = el("div", "aw-modal-actions");
    const reset = el("button", "aw-btn", "Default color"); reset.type = "button";
    reset.onclick = async () => { await setFolderColor(node.id, null); close(); render(); };
    const cancel = el("button", "aw-btn", "Cancel"); cancel.type = "button"; cancel.onclick = close;
    actions.append(reset, cancel);
    body.append(actions);
  });
}
async function duplicateFlow(node) {
  // duplicateItem counts the name up ("... (2)") rather than refusing.
  try { await duplicateItem(node.id); } catch (e) { toastMsg(e.message || "Could not duplicate."); }
  render();
}
async function deleteFlow(node) {
  // An act may have assignments already out with students. Deleting the act
  // does NOT have to take them down (each holds its own copy of the game), so
  // ask rather than decide for the teacher.
  if (node.kind === "act") {
    let given = [];
    try { given = await listAssignmentsForAct(node.id); } catch (e) { /* offline: just delete the act */ }
    if (given.length) return deleteActWithAssignments(node, given);
  }
  await trashItem(node.id);
  render();
}

function deleteActWithAssignments(node, given) {
  openModal("Delete activity", (body, close) => {
    body.append(el("div", "aw-modal-text",
      `<b>${escapeText(itemName(node))}</b> has <b>${given.length}</b> assignment${given.length === 1 ? "" : "s"} ` +
      `given to students. Each assignment keeps its own copy of the game, so it can keep working ` +
      `and you keep the scores.`));
    const actions = el("div", "aw-modal-actions");
    const cancel = el("button", "aw-btn", "Cancel"); cancel.type = "button"; cancel.onclick = close;
    const keep = el("button", "aw-btn", "Delete activity only"); keep.type = "button";
    keep.onclick = async () => { close(); await trashItem(node.id); toastMsg("Activity deleted, assignments kept"); render(); };
    const both = el("button", "aw-btn aw-btn-primary", "Delete both"); both.type = "button";
    both.onclick = async () => {
      close();
      await trashItem(node.id);
      for (const a of given) { try { await trashAssignment(a.code); } catch (e) { /* keep going */ } }
      toastMsg("Activity and its assignments moved to the recycle bins");
      render();
    };
    actions.append(cancel, keep, both);
    body.append(actions);
  });
}
async function openInNewTab(node) {
  window.open(await linkFor(node), "_blank");
}

function enterFolder(root, folderId, opts = {}) {
  state.view = "folder"; state.root = root; state.folderId = folderId ?? null; state.query = "";
  if (!opts.fromUrl) syncUrl();
  render();
}

// ---------------- Move dialog (folder tree, same root) ----------------
async function moveFlow(node) {
  const folders = await listFolders(node.root);
  // build parent->children map for the tree; exclude the moving item's own subtree
  const forbidden = new Set([node.id]);
  if (node.kind === "folder") collectSubtree(folders, node.id, forbidden);

  openModal("Move to", (body, close) => {
    const tree = el("div", "aw-move-tree");
    let chosen = null;   // null = root
    const rootRow = pickRow(ROOT_LABEL[node.root], 0, null);
    tree.append(rootRow);
    renderChildren(null, 1);
    body.append(tree);

    const moveErr = el("div", "aw-ed-error", "");
    moveErr.style.display = "none";
    body.append(moveErr);

    const actions = el("div", "aw-modal-actions");
    const cancel = el("button", "aw-btn", "Cancel"); cancel.onclick = close;
    const ok = el("button", "aw-btn aw-btn-primary", "Move here"); ok.type = "button";
    ok.onclick = async () => {
      try { await moveItem(node.id, chosen); close(); render(); }
      catch (e) { moveErr.style.display = ""; moveErr.textContent = e.message || "Could not move it there."; }
    };
    actions.append(cancel, ok);
    body.append(actions);

    function renderChildren(parentId, depth) {
      folders.filter(f => (f.parentId ?? null) === (parentId ?? null) && !forbidden.has(f.id))
        .sort((a, b) => itemName(a).localeCompare(itemName(b)))
        .forEach(f => { tree.append(pickRow(itemName(f), depth, f.id)); renderChildren(f.id, depth + 1); });
    }
    function pickRow(label, depth, id) {
      const row = el("button", "aw-move-row");
      row.type = "button"; row.style.paddingLeft = (10 + depth * 18) + "px";
      row.append(el("span", "aw-move-ic", FOLDER_SVG), el("span", null, escapeText(label)));
      row.onclick = () => { chosen = id; tree.querySelectorAll(".aw-move-row").forEach(r => r.classList.remove("is-sel")); row.classList.add("is-sel"); };
      return row;
    }
  });
}
function collectSubtree(folders, id, set) {
  folders.filter(f => f.parentId === id).forEach(f => { set.add(f.id); collectSubtree(folders, f.id, set); });
}

// ---------------- small UI helpers: menu + modals ----------------
let openMenuEl = null;
function openMenu(anchor, items) {
  closeMenu();
  const menu = el("div", "aw-ctx");
  items.forEach(([label, fn, danger]) => {
    const b = el("button", "aw-ctx-item" + (danger ? " is-danger" : ""), escapeText(label));
    b.type = "button";
    b.onclick = () => { closeMenu(); fn(); };
    menu.append(b);
  });
  document.body.append(menu);
  const r = anchor.getBoundingClientRect();
  const mw = 190;
  let left = r.right - mw; if (left < 8) left = 8;
  menu.style.left = left + "px";
  menu.style.top = (r.bottom + 4) + "px";
  openMenuEl = menu;
  setTimeout(() => document.addEventListener("pointerdown", onMenuOutside), 0);
}
function onMenuOutside(e) { if (openMenuEl && !openMenuEl.contains(e.target)) closeMenu(); }
function closeMenu() { if (openMenuEl) { openMenuEl.remove(); openMenuEl = null; document.removeEventListener("pointerdown", onMenuOutside); } }

// `onClose` (optional) fires whenever the modal goes away — including when the
// user dismisses it by clicking the backdrop. Callers that await a modal MUST
// use it, otherwise a backdrop click leaves them waiting forever.
function openModal(title, buildBody, onClose) {
  const overlay = el("div", "aw-modal-overlay");
  const modal = el("div", "aw-modal");
  modal.append(el("div", "aw-modal-title", escapeText(title)));
  const body = el("div", "aw-modal-body");
  modal.append(body);
  overlay.append(modal);
  overlay.onclick = e => { if (e.target === overlay) close(); };
  document.body.append(overlay);
  buildBody(body, close);
  return { close };
  function close() {
    if (!overlay.isConnected) return;   // guard: close() may be called twice
    overlay.remove();
    onClose?.();
  }
}
// `onOk` may be async and may THROW — a duplicate name, for example. The dialog
// then stays open and shows the reason instead of silently doing nothing.
function openTextModal(title, placeholder, value, onOk) {
  openModal(title, (body, close) => {
    const inp = el("input", "aw-ed-input"); inp.placeholder = placeholder; inp.value = value || "";
    body.append(inp);
    const err = el("div", "aw-ed-error", "");
    err.style.display = "none";
    body.append(err);
    const actions = el("div", "aw-modal-actions");
    const cancel = el("button", "aw-btn", "Cancel"); cancel.type = "button"; cancel.onclick = close;
    const ok = el("button", "aw-btn aw-btn-primary", "OK"); ok.type = "button";
    const submit = async () => {
      ok.disabled = true;
      err.style.display = "none";
      try {
        await onOk(inp.value);
        close();
      } catch (e) {
        ok.disabled = false;
        err.style.display = "";
        err.textContent = e.message || "That did not work.";
        inp.focus(); inp.select();
      }
    };
    ok.onclick = submit;
    inp.onkeydown = e => { if (e.key === "Enter") submit(); if (e.key === "Escape") close(); };
    actions.append(cancel, ok);
    body.append(actions);
    setTimeout(() => { inp.focus(); inp.select(); }, 0);
  });
}

// ---------------- header (brand + right-side button cluster) ----------------
// Shown on every library page and every edit page. Left = brand cluster.
// Right = Settings gear; on non-home pages ALSO Activities + Results quick-nav,
// forming a balanced cluster opposite the brand.
function topbar(showNav) {
  const bar = el("div", "aw-appbar");
  bar.append(logo(showNav));

  const right = el("div", "aw-appbar-right");
  if (showNav) {
    right.append(navBtn("Activities", "activities"));
    right.append(navBtn("Results", "results"));
  }
  const gear = el("button", "aw-appbtn aw-settings-btn", icons.settings);
  gear.type = "button"; gear.title = "Settings"; gear.setAttribute("aria-label", "Settings");
  gear.onclick = openSettingsFlow;
  right.append(gear);
  if (state.user) right.append(accountBtn());
  bar.append(right);

  // make "in ANDREW CLASSES" exactly as wide as the "AWord" logo (by spacing
  // out its letters — keeps each glyph's natural shape, no stretching)
  requestAnimationFrame(() => sizeBrand(bar));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => sizeBrand(bar));
  return bar;
}

// Centered footer shown at the bottom of every library/editor page.
function footer() {
  const f = el("div", "aw-foot");
  f.append(el("div", "aw-foot-line", "Phone &amp; Zalo: 0359.769.765"));
  f.append(el("div", "aw-foot-line aw-foot-copy",
    "Copyright © 2018 - 2026 ANDREW CLASSES by Pham Xuan Ninh. All Rights Reserved."));
  return f;
}

// Signed-in account chip: the teacher's Google photo (or initial), opening a
// small menu with Sign out.
function accountBtn() {
  const b = el("button", "aw-appbtn aw-account-btn");
  b.type = "button";
  b.title = state.user.email || "Account";
  b.setAttribute("aria-label", "Account");
  if (state.user.photoURL) {
    const img = el("img", "aw-account-img");
    img.src = state.user.photoURL;
    img.alt = "";
    img.referrerPolicy = "no-referrer";   // Google blocks hot-linking with a referrer
    b.append(img);
  } else {
    b.append(el("span", "aw-account-ini", escapeHtml((state.user.email || "?")[0].toUpperCase())));
  }
  // openMenu takes [label, fn, danger] tuples. The account email is already the
  // button's tooltip, so the menu only needs the one real action.
  b.onclick = () => openMenu(b, [["Sign out", doSignOut]]);
  return b;
}

async function doSignOut() {
  try { await signOutNow(); } catch { /* ignore */ }
  resetCache();
  state.user = null;
  state.view = "top"; state.root = null; state.folderId = null; state.query = "";
  renderLogin();
}

function navBtn(label, root) {
  const b = el("button", "aw-appnav" + (state.view !== "top" && state.root === root ? " is-on" : ""));
  b.type = "button";
  b.append(el("span", "aw-appnav-ic", icons.folder), el("span", null, label));
  b.onclick = () => openRoot(root);
  return b;
}

// Space out the tagline so its total width equals the logo's width — WITHOUT
// distorting the letters (only letter-spacing changes, glyph shapes are kept).
function sizeBrand(scope) {
  (scope || document).querySelectorAll(".aw-brand").forEach(brand => {
    const logoEl = brand.querySelector(".aw-brand-logo");
    const subEl = brand.querySelector(".aw-brand-sub");
    if (!logoEl || !subEl) return;
    subEl.style.letterSpacing = "0px";
    const L = logoEl.getBoundingClientRect().width;
    const w0 = subEl.getBoundingClientRect().width;   // natural width, no spacing
    const n = (subEl.textContent || "").length;
    if (n > 1 && L > w0) {
      // extra width shared across the gaps AFTER each character; subtract the
      // trailing gap so the last glyph lands on the logo's right edge.
      const ls = (L - w0) / (n - 1);
      subEl.style.letterSpacing = ls.toFixed(3) + "px";
      subEl.style.marginRight = (-ls).toFixed(3) + "px";
    }
  });
}

// The brand cluster (AWord + "in ANDREW CLASSES"). Clickable EVERYWHERE it
// appears -> back to the top-level home (the two main folders).
function logo(small) {
  const w = el("button", "aw-brand" + (small ? " is-sm" : ""));
  w.type = "button";
  w.title = "Home";
  w.onclick = goTop;
  w.append(
    el("div", "aw-brand-logo", 'A<span>Word</span>'),
    el("div", "aw-brand-sub", 'in <b>ANDREW CLASSES</b>')
  );
  return w;
}

// ---------------- Settings (multi-row menu) ----------------
// Settings menu -> "Default activity options" -> pick a template -> its options.
// (More rows will be added here in the future.)
function openSettingsFlow() {
  closeMenu();
  openModal("Settings", (body, close) => {
    const titleEl = body.parentElement.querySelector(".aw-modal-title");
    const setTitle = (text, onBack) => {
      titleEl.innerHTML = "";
      if (onBack) {
        const back = el("button", "aw-set-back", "‹"); back.type = "button";
        back.title = "Back"; back.onclick = onBack;
        titleEl.append(back);
      }
      titleEl.append(document.createTextNode(text));
    };

    showMenu();

    function showMenu() {
      setTitle("Settings", null);
      body.innerHTML = "";
      const list = el("div", "aw-set-menu");
      list.append(menuRow("Default activity options",
        "Set the options new activities start with", showTemplates));
      // placeholder rows for features coming later
      list.append(menuRow("Appearance", "Coming soon", null));
      list.append(menuRow("Leaderboard & results", "Coming soon", null));
      body.append(list);
    }

    function showTemplates() {
      setTitle("Default activity options", showMenu);
      body.innerHTML = "";
      body.append(el("div", "aw-set-hint", "Choose a template to set its default options."));
      const grid = el("div", "aw-pick-grid");
      TEMPLATES.forEach(t => {
        const card = el("button", "aw-pick-card" + (t.built ? "" : " is-soon"));
        card.type = "button";
        card.append(el("div", "aw-pick-name", t.label), el("div", "aw-pick-blurb", t.blurb || ""));
        if (!t.built) card.append(el("span", "aw-pick-soon", "Coming soon"));
        card.onclick = () => { if (!t.built) { toast(`${t.label} — coming soon`); return; } showOptions(t); };
        grid.append(card);
      });
      body.append(grid);
    }

    function showOptions(t) {
      setTitle(`${t.label} defaults`, showTemplates);
      body.innerHTML = "";
      body.append(el("div", "aw-set-hint",
        `New ${t.label} activities will start with these options.`));
      const draft = getDefaultOptions(t.type);   // working copy; saved only on Save
      body.append(buildOptionsControls(draft, () => {}));
      const actions = el("div", "aw-modal-actions");
      const cancel = el("button", "aw-btn", "Cancel"); cancel.type = "button"; cancel.onclick = close;
      const save = el("button", "aw-btn aw-btn-primary", "Save"); save.type = "button";
      save.onclick = () => { saveDefaultOptions(t.type, draft); close(); toast("Settings saved"); };
      actions.append(cancel, save);
      body.append(actions);
    }

    function menuRow(title, sub, onClick) {
      const row = el("button", "aw-set-row" + (onClick ? "" : " is-disabled"));
      row.type = "button";
      const txt = el("div", "aw-set-rowtext");
      txt.append(el("div", "aw-set-rowtitle", title), el("div", "aw-set-rowsub", sub));
      row.append(txt);
      if (onClick) { row.append(el("span", "aw-set-chev", "›")); row.onclick = onClick; }
      else row.disabled = true;
      return row;
    }
  });
}

// small floating toast (library pages have no engine toast of their own)
let toastTimer = null;
function toast(msg) {
  let t = document.querySelector(".aw-lib-toast");
  if (!t) { t = el("div", "aw-lib-toast"); document.body.append(t); }
  t.textContent = msg;
  t.classList.add("is-on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("is-on"), 2200);
}
function escapeText(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const GRID_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>';
const LIST_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><rect x="3" y="4" width="18" height="3" rx="1.5"/><rect x="3" y="10.5" width="18" height="3" rx="1.5"/><rect x="3" y="17" width="18" height="3" rx="1.5"/></svg>';
