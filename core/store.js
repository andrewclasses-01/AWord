// =============================================================
// STORE — the library: a Google-Drive-style tree of FOLDERS and ACTS,
// split into two FIXED roots: "activities" (games) and "results" (kept for
// student results — populated later, in the Firebase phase). Plus a per-root
// RECYCLE BIN (trash).
//
// Still an ABSTRACTION LAYER: everything is ASYNC (Promise) so we can swap the
// insides for Firebase/Firestore later WITHOUT touching the callers.
//
// One flat map is stored in localStorage (key "aword-lib"): { [id]: node }.
// The tree is DERIVED from each node's (root, parentId). Nodes:
//
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

const KEY = "aword-lib";
const OLD_KEY = "aword-activities";   // Khối-1 flat format (migrated once)
export const ROOTS = ["activities", "results"];

function now() { return Date.now(); }
function newId(prefix) {
  return (prefix || "id") + "_" + now().toString(36) + "_" + Math.random().toString(36).slice(2, 7);
}

// ---- raw read/write + one-time migration from the Khối-1 flat store ----
function readAll() {
  let map = null;
  try { map = JSON.parse(localStorage.getItem(KEY)); } catch { map = null; }
  if (map && typeof map === "object") return map;

  // migrate old flat activities (if any) into activities-root acts
  map = {};
  try {
    const old = JSON.parse(localStorage.getItem(OLD_KEY) || "{}");
    Object.values(old).forEach(a => {
      if (!a || !a.id) return;
      map[a.id] = { ...a, kind: "act", root: "activities", parentId: null,
        trashed: false, trashedAt: null, trashRootId: null, restoreParentId: null };
    });
  } catch { /* ignore */ }
  writeAll(map);
  return map;
}
function writeAll(map) { localStorage.setItem(KEY, JSON.stringify(map)); }

// ---- helpers ----
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
export async function getItem(id) { return readAll()[id] || null; }

// Live (non-trashed) children directly under (root, parentId). Folders first.
export async function listChildren(root, parentId = null) {
  const map = readAll();
  return Object.values(map)
    .filter(n => n.root === root && !n.trashed && (n.parentId ?? null) === (parentId ?? null))
    .sort(byName);
}

// The breadcrumb chain from the root down to `folderId` (inclusive). [] at root.
export async function pathTo(folderId) {
  const map = readAll();
  const chain = [];
  let n = folderId ? map[folderId] : null;
  while (n) { chain.unshift(n); n = n.parentId ? map[n.parentId] : null; }
  return chain;
}

// All live folders of a root (for the Move dialog tree).
export async function listFolders(root) {
  return Object.values(readAll()).filter(n => n.root === root && n.kind === "folder" && !n.trashed);
}

// Search live items in a root by name (any depth).
export async function searchItems(root, query) {
  const q = (query || "").trim().toLowerCase();
  if (!q) return [];
  return Object.values(readAll())
    .filter(n => n.root === root && !n.trashed && itemName(n).toLowerCase().includes(q))
    .sort(byName);
}

// Top-level trashed items (the ones actually deleted) for a root.
export async function listTrash(root) {
  return Object.values(readAll())
    .filter(n => n.root === root && n.trashed && n.trashRootId === n.id)
    .sort((a, b) => (b.trashedAt || 0) - (a.trashedAt || 0));
}

// ---- writes ----
export async function createFolder(root, parentId, name) {
  const map = readAll();
  const id = newId("fld");
  map[id] = { id, kind: "folder", root, parentId: parentId ?? null,
    name: (name || "New folder").trim() || "New folder",
    trashed: false, trashedAt: null, trashRootId: null, restoreParentId: null,
    createdAt: now(), updatedAt: now() };
  writeAll(map);
  return map[id];
}

// Upsert an ACT. On update, the existing node's location (root/parentId) and
// trash state are PRESERVED — only the activity payload changes.
export async function saveActivity(activity, opts = {}) {
  const map = readAll();
  const payload = JSON.parse(JSON.stringify(activity));
  let id = payload.id;
  const existing = id ? map[id] : null;
  if (!id) id = newId("act");

  const node = {
    ...(existing || {}),
    ...payload,
    id,
    kind: "act",
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
  writeAll(map);
  return node;
}
// Back-compat alias used by Khối 1 callers.
export async function getActivity(id) { return readAll()[id] || null; }

// Counts shown on a folder card:
//   folders = number of DIRECT child folders (immediate only)
//   acts    = TOTAL activities anywhere inside (recursive, all depths)
export async function folderCounts(id) {
  const map = readAll();
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
  const map = readAll();
  const n = map[id]; if (!n || n.kind !== "folder") return null;
  n.color = color || null;
  n.updatedAt = now();
  writeAll(map);
  return n;
}

export async function renameItem(id, newName) {
  const map = readAll();
  const n = map[id]; if (!n) return null;
  const name = (newName || "").trim();
  if (name) {
    if (n.kind === "folder") n.name = name; else n.title = name;
    n.updatedAt = now();
    writeAll(map);
  }
  return n;
}

export async function moveItem(id, newParentId) {
  const map = readAll();
  const n = map[id]; if (!n) return null;
  newParentId = newParentId ?? null;
  // guard: can't drop a folder into itself or its own subtree
  if (n.kind === "folder" && newParentId != null) {
    if (newParentId === id || isDescendant(map, newParentId, id)) return n;
  }
  n.parentId = newParentId;
  n.updatedAt = now();
  writeAll(map);
  return n;
}

export async function duplicateItem(id) {
  const map = readAll();
  const src = map[id]; if (!src) return null;

  // clone one node under `parentId`. Safe against cloning-the-clones: a clone's
  // parentId is always a NEW id, so filtering originals by their original id
  // never picks up freshly-added clones.
  function cloneOne(node, parentId, nameOverride) {
    const copyId = newId(node.kind === "folder" ? "fld" : "act");
    const c = { ...JSON.parse(JSON.stringify(node)), id: copyId, parentId,
      trashed: false, trashedAt: null, trashRootId: null, restoreParentId: null,
      createdAt: now(), updatedAt: now() };
    if (nameOverride != null) { if (c.kind === "folder") c.name = nameOverride; else c.title = nameOverride; }
    map[copyId] = c;
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
  writeAll(map);
  return top;
}

export async function trashItem(id) {
  const map = readAll();
  const n = map[id]; if (!n) return;
  const bundle = [n, ...(n.kind === "folder" ? descendantsOf(map, id) : [])];
  bundle.forEach(node => {
    node.trashed = true;
    node.trashedAt = now();
    node.trashRootId = id;
    if (node.restoreParentId == null) node.restoreParentId = node.parentId ?? null;
  });
  writeAll(map);
}

export async function restoreItem(id) {
  const map = readAll();
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
  writeAll(map);
}

export async function deleteForever(id) {
  const map = readAll();
  Object.values(map).filter(n => n.id === id || n.trashRootId === id).forEach(n => delete map[n.id]);
  writeAll(map);
}
