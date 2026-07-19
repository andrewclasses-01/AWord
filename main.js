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
//   Folder ⁝ menu:  Open in new tab · Rename · Move · Duplicate · Delete
//   Act ⁝ menu:     Open in new tab · Edit content · Rename · Duplicate · Move · Delete
//   Delete -> Recycle bin (per root). Permanent delete happens in the bin.
//
//   Open in new tab uses ?play=<id> (an act) or ?folder=<root>~<id> (a folder).
// =============================================================

import { startGame } from "./core/engine.js";
import { el } from "./core/utils.js";
import { icons } from "./core/icons.js";
import { getTemplate } from "./core/registry.js";
import { TEMPLATES, templateLabel } from "./core/catalog.js";
import { getDefaultOptions, saveDefaultOptions, buildOptionsControls } from "./core/settings.js";
import {
  ROOTS, itemName, getItem, listChildren, pathTo, listFolders, searchItems, listTrash,
  createFolder, saveActivity, renameItem, moveItem, duplicateItem, trashItem, restoreItem, deleteForever,
  setFolderColor, folderCounts
} from "./core/store.js";
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
  query: ""
};

init();

async function init() {
  await maybeSeed();
  const p = new URLSearchParams(location.search);
  if (p.get("play")) {
    const node = await getItem(p.get("play"));
    if (node && node.kind === "act") { startGame(app, node, { onExit: goTop }); return; }
  }
  if (p.get("folder")) {
    const [root, fid] = p.get("folder").split("~");
    if (ROOTS.includes(root)) { state.view = "folder"; state.root = root; state.folderId = fid || null; render(); return; }
  }
  render();
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
function goTop() { state.view = "top"; state.root = null; state.folderId = null; state.query = ""; render(); }

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
function openRoot(root) { state.view = "folder"; state.root = root; state.folderId = null; state.query = ""; render(); }

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

  if (!items.length) {
    body.append(el("div", "aw-fm-empty",
      state.view === "trash" ? "Recycle bin is empty."
      : state.view === "search" ? `No results for “${escapeText(state.query)}”.`
      : "This folder is empty."));
    return;
  }

  const list = el("div", state.mode === "grid" ? "aw-fm-grid" : "aw-fm-list");
  for (const node of items) {
    let card;
    if (state.view === "trash") card = trashCard(node);
    else if (node.kind === "folder") card = folderCard(node, await folderCounts(node.id));
    else card = actCard(node);
    list.append(card);
  }
  body.append(list);
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
function folderCard(node, counts) {
  const card = el("div", "aw-card aw-card-folder");
  card.onclick = () => enterFolder(node.root, node.id);

  const preview = el("div", "aw-fp");
  const ic = el("div", "aw-fp-icon", FOLDER_SVG);
  ic.style.color = node.color || FOLDER_DEFAULT_COLOR;
  preview.append(ic);

  const { folders = 0, acts = 0 } = counts || {};
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
    await moveItem(id, getParentId());   // moveItem guards against folder-into-own-subtree
    render();
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
    ["Rename", () => renameFlow(node)],
    ["Color", () => colorFlow(node)],
    ["Move", () => moveFlow(node)],
    ["Duplicate", () => duplicateFlow(node)],
    ["Delete", () => deleteFlow(node), true]
  ];
}
function actMenuItems(node) {
  return [
    ["Open in new tab", () => openInNewTab(node)],
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
async function duplicateFlow(node) { await duplicateItem(node.id); render(); }
async function deleteFlow(node) { await trashItem(node.id); render(); }
function openInNewTab(node) {
  const base = location.origin + location.pathname;
  const url = node.kind === "act" ? `${base}?play=${encodeURIComponent(node.id)}`
                                   : `${base}?folder=${encodeURIComponent(node.root)}~${encodeURIComponent(node.id)}`;
  window.open(url, "_blank");
}

function enterFolder(root, folderId) { state.view = "folder"; state.root = root; state.folderId = folderId ?? null; state.query = ""; render(); }

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

    const actions = el("div", "aw-modal-actions");
    const cancel = el("button", "aw-btn", "Cancel"); cancel.onclick = close;
    const ok = el("button", "aw-btn aw-btn-primary", "Move here"); ok.type = "button";
    ok.onclick = async () => { await moveItem(node.id, chosen); close(); render(); };
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

function openModal(title, buildBody) {
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
  function close() { overlay.remove(); }
}
function openTextModal(title, placeholder, value, onOk) {
  openModal(title, (body, close) => {
    const inp = el("input", "aw-ed-input"); inp.placeholder = placeholder; inp.value = value || "";
    body.append(inp);
    const actions = el("div", "aw-modal-actions");
    const cancel = el("button", "aw-btn", "Cancel"); cancel.type = "button"; cancel.onclick = close;
    const ok = el("button", "aw-btn aw-btn-primary", "OK"); ok.type = "button";
    ok.onclick = () => { close(); onOk(inp.value); };
    inp.onkeydown = e => { if (e.key === "Enter") { close(); onOk(inp.value); } if (e.key === "Escape") close(); };
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
