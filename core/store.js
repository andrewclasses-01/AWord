// =============================================================
// STORE — the library: a Google-Drive-style tree of FOLDERS and ACTS,
// split into two FIXED roots: "activities" (games) and "results". Plus a
// per-root RECYCLE BIN (trash).
//
// BACKED BY FIRESTORE (v0.7.4) — the teacher's library lives at
//     users/{uid}/items/{itemId}
// so it follows them to any computer. It is PRIVATE: the published security
// rules only let the one teacher account read/write it (docs/08-FIREBASE-SETUP.md).
//
// The public API here did NOT change when we moved off localStorage — every
// function was already async, which is exactly why the swap touched no callers
// (main.js / the editors / engine.js are untouched).
//
// HOW IT WORKS: all of the teacher's items are read ONCE into an in-memory
// `cache` (a library is at most a few hundred small docs), so every tree
// operation below stays the same plain-object logic as before. Writes update
// the cache AND push only the changed docs to Firestore in a batch.
//
// Node shapes (unchanged):
//   folder: { id, kind:'folder', root, parentId, name, trashed, trashedAt,
//             trashRootId, restoreParentId, createdAt, updatedAt }
//   act:    { id, kind:'act', root:'activities', parentId, trashed, trashedAt,
//             trashRootId, restoreParentId,
//             ...activity payload (schemaVersion,type,title,instruction,theme,
//                options,content), createdAt, updatedAt }
//
// parentId === null  ->  directly under the root.
// Deleting sends a node (and, for a folder, its whole subtree) to the trash:
// they get trashed=true and share trashRootId = the id the user deleted, so the
// trash view shows only that top node and Restore / Delete-forever act on the
// whole bundle.
// =============================================================

import { db, fs, currentUser } from "./firebase.js";

export const ROOTS = ["activities", "results"];

// localStorage keys of the OLD offline library — kept only so the one-time
// "upload my old library" migration can still find it. Nothing writes them now.
const LOCAL_KEY = "aword-lib";
const LOCAL_OLD_KEY = "aword-activities";

function now() { return Date.now(); }
function newId(prefix) {
  return (prefix || "id") + "_" + now().toString(36) + "_" + Math.random().toString(36).slice(2, 7);
}

// ---- Firestore plumbing ----------------------------------------------------
let cache = null;       // { [id]: node }
let cacheUid = null;    // which account the cache belongs to

// Drop the cache (called on sign-in / sign-out so accounts never mix).
export function resetCache() { cache = null; cacheUid = null; }

async function requireUid() {
  const user = await currentUser();
  if (!user) {
    const err = new Error("Please sign in to use your AWord library.");
    err.code = "aw/signed-out";
    throw err;
  }
  return user.uid;
}

function itemsPath(uid) { return `users/${uid}/items`; }

// Firestore rejects `undefined`, so drop those keys before writing.
function clean(value) {
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (v !== undefined) out[k] = clean(v);
    }
    return out;
  }
  return value;
}

async function readAll() {
  const uid = await requireUid();
  if (cache && cacheUid === uid) return cache;
  const [d, { collection, getDocs }] = await Promise.all([db(), fs()]);
  const snap = await getDocs(collection(d, itemsPath(uid)));
  const map = {};
  snap.forEach(s => { map[s.id] = { ...s.data(), id: s.id }; });
  cache = map; cacheUid = uid;
  return cache;
}

// Upsert the given nodes (they are already in `cache`). Batched, chunked well
// under Firestore's 500-writes-per-batch limit.
async function persist(nodes) {
  if (!nodes.length) return;
  const uid = await requireUid();
  const [d, sdk] = await Promise.all([db(), fs()]);
  const { doc, writeBatch } = sdk;
  for (let i = 0; i < nodes.length; i += 400) {
    const batch = writeBatch(d);
    nodes.slice(i, i + 400).forEach(n => batch.set(doc(d, itemsPath(uid), n.id), clean(n)));
    await batch.commit();
  }
}

async function persistDelete(ids) {
  if (!ids.length) return;
  const uid = await requireUid();
  const [d, sdk] = await Promise.all([db(), fs()]);
  const { doc, writeBatch } = sdk;
  for (let i = 0; i < ids.length; i += 400) {
    const batch = writeBatch(d);
    ids.slice(i, i + 400).forEach(id => batch.delete(doc(d, itemsPath(uid), id)));
    await batch.commit();
  }
}

// ---- SHORT NUMBERS for shareable links (v0.8.0) ----------------------------
// Every folder and act also carries a small counting number (`num`: 1, 2, 3...)
// so links can read ?f=12&a=57 instead of a long internal id. The number lives
// in Firestore next to the item, so every computer signed into the teacher's
// account resolves the same link to the same item.
function nextNum(map) {
  let max = 0;
  for (const n of Object.values(map)) if (typeof n.num === "number" && n.num > max) max = n.num;
  return max + 1;
}

// One-time backfill: hand numbers to items created before v0.8.0, oldest first
// so the numbering matches the order the teacher made them in.
export async function ensureNumbers() {
  const map = await readAll();
  const missing = Object.values(map).filter(n => typeof n.num !== "number");
  if (!missing.length) return 0;
  let next = nextNum(map);
  missing.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  missing.forEach(n => { n.num = next++; });
  await persist(missing);
  return missing.length;
}

// Resolve a link number back to an item. Live items win over trashed ones.
export async function getByNum(num) {
  const n = Number(num);
  if (!Number.isFinite(n)) return null;
  const hits = Object.values(await readAll()).filter(x => x.num === n);
  return hits.find(x => !x.trashed) || hits[0] || null;
}

// ---- helpers (unchanged logic) ---------------------------------------------
export function itemName(node) {
  if (!node) return "";
  return node.kind === "folder" ? (node.name || "Untitled folder") : (node.title || "Untitled");
}
function byName(a, b) {
  // folders first, then by name (case-insensitive)
  if (a.kind !== b.kind) return a.kind === "folder" ? -1 : 1;
  return itemName(a).toLowerCase().localeCompare(itemName(b).toLowerCase());
}
function descendantsOf(map, id) {
  // all folders/acts anywhere under folder `id`
  const out = [];
  const kids = Object.values(map).filter(n => n.parentId === id);
  kids.forEach(k => { out.push(k); if (k.kind === "folder") out.push(...descendantsOf(map, k.id)); });
  return out;
}
function isDescendant(map, id, maybeAncestorId) {
  // is `id` inside the subtree of `maybeAncestorId`?
  let n = map[id];
  while (n && n.parentId != null) {
    if (n.parentId === maybeAncestorId) return true;
    n = map[n.parentId];
  }
  return false;
}

// ---- reads ----
export async function getItem(id) { return (await readAll())[id] || null; }

// Live (non-trashed) children directly under (root, parentId). Folders first.
export async function listChildren(root, parentId = null) {
  const map = await readAll();
  return Object.values(map)
    .filter(n => n.root === root && !n.trashed && (n.parentId ?? null) === (parentId ?? null))
    .sort(byName);
}

// The breadcrumb chain from the root down to `folderId` (inclusive). [] at root.
export async function pathTo(folderId) {
  const map = await readAll();
  const chain = [];
  let n = folderId ? map[folderId] : null;
  while (n) { chain.unshift(n); n = n.parentId ? map[n.parentId] : null; }
  return chain;
}

// All live folders of a root (for the Move dialog tree).
export async function listFolders(root) {
  const map = await readAll();
  return Object.values(map).filter(n => n.root === root && n.kind === "folder" && !n.trashed);
}

// Search live items in a root by name (any depth).
export async function searchItems(root, query) {
  const q = (query || "").trim().toLowerCase();
  if (!q) return [];
  const map = await readAll();
  return Object.values(map)
    .filter(n => n.root === root && !n.trashed && itemName(n).toLowerCase().includes(q))
    .sort(byName);
}

// Top-level trashed items (the ones actually deleted) for a root.
export async function listTrash(root) {
  const map = await readAll();
  return Object.values(map)
    .filter(n => n.root === root && n.trashed && n.trashRootId === n.id)
    .sort((a, b) => (b.trashedAt || 0) - (a.trashedAt || 0));
}

// ---- writes ----
export async function createFolder(root, parentId, name) {
  const map = await readAll();
  const id = newId("fld");
  map[id] = { id, kind: "folder", root, parentId: parentId ?? null,
    num: nextNum(map),
    name: (name || "New folder").trim() || "New folder",
    trashed: false, trashedAt: null, trashRootId: null, restoreParentId: null,
    createdAt: now(), updatedAt: now() };
  await persist([map[id]]);
  return map[id];
}

// Upsert an ACT. On update, the existing node's location (root/parentId) and
// trash state are PRESERVED — only the activity payload changes.
export async function saveActivity(activity, opts = {}) {
  const map = await readAll();
  const payload = JSON.parse(JSON.stringify(activity));
  let id = payload.id;
  const existing = id ? map[id] : null;
  if (!id) id = newId("act");

  const node = {
    ...(existing || {}),
    ...payload,
    id,
    kind: "act",
    // keep the act's link number for its whole life; only a brand-new act gets one
    num: existing?.num ?? (typeof payload.num === "number" ? payload.num : nextNum(map)),
    root: existing?.root || opts.root || "activities",
    parentId: existing ? (existing.parentId ?? null) : (opts.parentId ?? null),
    trashed: existing?.trashed || false,
    trashedAt: existing?.trashedAt || null,
    trashRootId: existing?.trashRootId || null,
    restoreParentId: existing?.restoreParentId || null,
    createdAt: existing?.createdAt || now(),
    updatedAt: now()
  };
  map[id] = node;
  await persist([node]);
  return node;
}
// Back-compat alias used by Khối 1 callers.
export async function getActivity(id) { return (await readAll())[id] || null; }

// Counts shown on a folder card:
//   folders = number of DIRECT child folders (immediate only)
//   acts    = TOTAL activities anywhere inside (recursive, all depths)
export async function folderCounts(id) {
  const map = await readAll();
  const childrenOf = pid => Object.values(map).filter(n => !n.trashed && (n.parentId ?? null) === (pid ?? null));
  const folders = childrenOf(id).filter(n => n.kind === "folder").length;
  let acts = 0;
  const stack = [id], seen = new Set();
  while (stack.length) {
    const pid = stack.pop();
    childrenOf(pid).forEach(n => {
      if (n.kind === "act") acts++;
      else if (n.kind === "folder" && !seen.has(n.id)) { seen.add(n.id); stack.push(n.id); }
    });
  }
  return { folders, acts };
}

// Set (or clear, with null) the icon color of a FOLDER.
export async function setFolderColor(id, color) {
  const map = await readAll();
  const n = map[id]; if (!n || n.kind !== "folder") return null;
  n.color = color || null;
  n.updatedAt = now();
  await persist([n]);
  return n;
}

export async function renameItem(id, newName) {
  const map = await readAll();
  const n = map[id]; if (!n) return null;
  const name = (newName || "").trim();
  if (name) {
    if (n.kind === "folder") n.name = name; else n.title = name;
    n.updatedAt = now();
    await persist([n]);
  }
  return n;
}

export async function moveItem(id, newParentId) {
  const map = await readAll();
  const n = map[id]; if (!n) return null;
  newParentId = newParentId ?? null;
  // guard: can't drop a folder into itself or its own subtree
  if (n.kind === "folder" && newParentId != null) {
    if (newParentId === id || isDescendant(map, newParentId, id)) return n;
  }
  n.parentId = newParentId;
  n.updatedAt = now();
  await persist([n]);
  return n;
}

export async function duplicateItem(id) {
  const map = await readAll();
  const src = map[id]; if (!src) return null;
  const made = [];

  // clone one node under `parentId`. Safe against cloning-the-clones: a clone's
  // parentId is always a NEW id, so filtering originals by their original id
  // never picks up freshly-added clones.
  function cloneOne(node, parentId, nameOverride) {
    const copyId = newId(node.kind === "folder" ? "fld" : "act");
    const c = { ...JSON.parse(JSON.stringify(node)), id: copyId, parentId,
      trashed: false, trashedAt: null, trashRootId: null, restoreParentId: null,
      createdAt: now(), updatedAt: now() };
    c.num = nextNum(map);   // a copy is a NEW item, so it needs its own link number
    if (nameOverride != null) { if (c.kind === "folder") c.name = nameOverride; else c.title = nameOverride; }
    map[copyId] = c;
    made.push(c);
    return c;
  }
  function cloneSubtree(orig, parentId, nameOverride) {
    const copy = cloneOne(orig, parentId, nameOverride);
    if (orig.kind === "folder") {
      Object.values(map)
        .filter(n => n.parentId === orig.id && !n.trashed)
        .forEach(child => cloneSubtree(child, copy.id));
    }
    return copy;
  }

  const top = cloneSubtree(src, src.parentId ?? null, itemName(src) + " (copy)");
  await persist(made);
  return top;
}

export async function trashItem(id) {
  const map = await readAll();
  const n = map[id]; if (!n) return;
  const bundle = [n, ...(n.kind === "folder" ? descendantsOf(map, id) : [])];
  bundle.forEach(node => {
    node.trashed = true;
    node.trashedAt = now();
    node.trashRootId = id;
    if (node.restoreParentId == null) node.restoreParentId = node.parentId ?? null;
  });
  await persist(bundle);
}

export async function restoreItem(id) {
  const map = await readAll();
  const bundle = Object.values(map).filter(n => n.trashRootId === id);
  bundle.forEach(node => {
    node.trashed = false;
    node.trashedAt = null;
    node.trashRootId = null;
  });
  const top = map[id];
  if (top) {
    // restore to original parent if it still exists and is live, else to root
    const p = top.restoreParentId ? map[top.restoreParentId] : null;
    top.parentId = (p && !p.trashed) ? top.restoreParentId : null;
  }
  bundle.forEach(node => { node.restoreParentId = null; node.updatedAt = now(); });
  await persist(bundle);
}

export async function deleteForever(id) {
  const map = await readAll();
  const gone = Object.values(map).filter(n => n.id === id || n.trashRootId === id);
  gone.forEach(n => delete map[n.id]);
  await persistDelete(gone.map(n => n.id));
}

// =============================================================
// ONE-TIME MIGRATION — lift a library that was saved in THIS browser
// (the pre-Firebase localStorage store) up into the teacher's cloud library.
// =============================================================

// How many items are sitting in this browser's old offline library?
// Returns 0 when there is nothing to migrate.
export function localLibrarySize() {
  return Object.keys(readLocalMap()).length;
}

// How many of those are actually NEW to the cloud library? Items keep their id
// when they move up, so anything already in the cloud (e.g. the sample quiz,
// which has a fixed id) is not worth offering. Use this — not
// localLibrarySize() — to decide whether to prompt the teacher at all.
export async function pendingImportCount() {
  const localIds = Object.keys(readLocalMap());
  if (localIds.length === 0) return 0;
  const map = await readAll();
  return localIds.filter(id => !map[id]).length;
}

function readLocalMap() {
  let map = null;
  try { map = JSON.parse(localStorage.getItem(LOCAL_KEY)); } catch { map = null; }
  if (map && typeof map === "object") return map;
  // even older flat format (Khối 1)
  const out = {};
  try {
    const old = JSON.parse(localStorage.getItem(LOCAL_OLD_KEY) || "{}");
    Object.values(old).forEach(a => {
      if (!a || !a.id) return;
      out[a.id] = { ...a, kind: "act", root: "activities", parentId: null,
        trashed: false, trashedAt: null, trashRootId: null, restoreParentId: null };
    });
  } catch { /* ignore */ }
  return out;
}

// Copy this browser's old library into the cloud. Existing cloud items with the
// same id are NOT overwritten (import is additive and safe to run twice).
// Returns the number of items added.
export async function importLocalLibrary() {
  const map = await readAll();
  const local = readLocalMap();
  const add = Object.values(local)
    .filter(n => n && n.id && !map[n.id])
    .map(n => ({
      ...n,
      trashed: !!n.trashed, trashedAt: n.trashedAt ?? null,
      trashRootId: n.trashRootId ?? null, restoreParentId: n.restoreParentId ?? null,
      createdAt: n.createdAt || now(), updatedAt: now()
    }));
  add.forEach(n => { map[n.id] = n; });
  // old offline items predate link numbers — give them one as they arrive
  add.forEach(n => { if (typeof n.num !== "number") n.num = nextNum(map); });
  await persist(add);
  return add.length;
}

// Mark this browser's old library as already lifted, so we stop offering it.
const MIGRATED_FLAG = "aword-migrated-to-cloud";
export function markMigrated() { try { localStorage.setItem(MIGRATED_FLAG, "1"); } catch { /* ignore */ } }
export function wasMigrated() { try { return localStorage.getItem(MIGRATED_FLAG) === "1"; } catch { return false; } }
