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
// Đợt 143 — old penalty scales are converted on the way OUT of the library, at
// the single point every reader goes through (readAll). Leaf module: it only
// touches the plain object it is handed.
import { migrateActivityOptions } from "./options-migrate.js";

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
  // Đợt 143 — every act the library hands out arrives on the CURRENT option
  // scales. Doing it at this one choke point (rather than in each of the ~10
  // exported readers) is what guarantees no path can serve an un-migrated act;
  // and because the converted value sits in `cache`, the very next save of that
  // act — for ANY reason — persists it. Folders have no `options` and are
  // skipped. Idempotent: `optVer` lets a value convert once and once only.
  for (const node of Object.values(map)) {
    if (node && node.kind === "act") migrateActivityOptions(node);
  }
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
// ---- APP DATA THAT SHARES THIS COLLECTION BUT IS NOT LIBRARY CONTENT --------
// Class rolls (kind "class", core/classes.js), the Showdown team table (kind
// "showdown") and the Showdown result board (kind "showdown-results", both in
// core/showdown-setup.js) are stored in `users/{uid}/items` because the Firestore
// rules open exactly ONE path for the teacher's own data — a new top-level
// collection would be denied until somebody edited the rules in the Firebase
// console by hand. Those files explain that at length.
// None of them is a LINKABLE thing, so all must stay clear of the ?f= / ?a= link
// numbers. They are already invisible to every listing (those filter on
// `n.root === root`, and ROOTS is only activities/results); these two functions
// are the pair that would otherwise still reach them.
// ⚠️ ADD ANY FUTURE `kind` OF APP DATA HERE. Forgetting costs a silently eaten
// link number and, worse, a ?a=57 that resolves to a settings document.
// (Đợt 177 nearly paid exactly that: "showdown-results" was added to Firestore
// before this line was, and only the warning above caught it.)
const APP_DATA_KINDS = new Set(["class", "showdown", "showdown-results"]);
function isAppData(n) { return APP_DATA_KINDS.has(n.kind); }

export async function ensureNumbers() {
  const map = await readAll();
  const missing = Object.values(map).filter(n => !isAppData(n) && typeof n.num !== "number");
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
  // `isAppData` for the same reason as in ensureNumbers(): a class roll or the
  // Showdown table is not something a ?f= / ?a= link may ever resolve to.
  const hits = Object.values(await readAll()).filter(x => !isAppData(x) && x.num === n);
  return hits.find(x => !x.trashed) || hits[0] || null;
}

// ---- NO TWO THINGS MAY SHARE A NAME (v0.9.0) -------------------------------
// The teacher's rule: sub-folders inside one folder must have different names,
// and acts inside one folder must have different names. (Assignments follow the
// same rule inside a Results folder — enforced in core/assignments.js.)
// Folders and acts do NOT clash with each other; only like with like.
export function sameName(a, b) {
  return String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();
}

function duplicateNameError(name) {
  const err = new Error(`“${name}” already exists here. Please choose another name.`);
  err.code = "aw/duplicate-name";
  return err;
}

// Is `name` already used by a sibling of the same kind? `exceptId` skips the
// item being renamed/moved (so re-saving with its own name is fine).
function nameTaken(map, { root, parentId, kind, name, exceptId }) {
  return Object.values(map).some(n =>
    n.root === root && n.kind === kind && !n.trashed &&
    (n.parentId ?? null) === (parentId ?? null) &&
    n.id !== exceptId && sameName(itemName(n), name));
}

// "Unit 3" -> "Unit 3 (2)" -> "Unit 3 (3)"... used by Duplicate, which should
// never stop the teacher with an error.
function freeName(map, spec) {
  if (!nameTaken(map, spec)) return spec.name;
  const base = String(spec.name).replace(/\s*\(\d+\)$/, "");
  for (let i = 2; i < 500; i++) {
    const candidate = `${base} (${i})`;
    if (!nameTaken(map, { ...spec, name: candidate })) return candidate;
  }
  return `${base} (${Date.now()})`;
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
  const wanted = (name || "New folder").trim() || "New folder";
  if (nameTaken(map, { root, parentId, kind: "folder", name: wanted })) throw duplicateNameError(wanted);
  const id = newId("fld");
  map[id] = { id, kind: "folder", root, parentId: parentId ?? null,
    num: nextNum(map),
    name: wanted,
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

  // two acts in one folder may not share a title
  const where = {
    root: existing?.root || opts.root || "activities",
    parentId: existing ? (existing.parentId ?? null) : (opts.parentId ?? null),
    kind: "act",
    name: payload.title || "Untitled",
    exceptId: id
  };
  if (nameTaken(map, where)) throw duplicateNameError(where.name);

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

// ---- BULK IMPORT ----
// Create many acts at once from a "bundle" produced by a generator (e.g. the
// taoactaw skill / the in-app Import reading a lesson .xlsm). Shape:
//   { folder?: "Base folder",
//     activities: [ {type,title,theme?,instruction?,options?,content, subfolder?}, ... ] }
// The acts land under `opts.parentId` (the folder the teacher is in). If `folder`
// is given, a subfolder of that name is created/REUSED as the BASE. Each activity
// may also carry a `subfolder` PATH (e.g. "ACT" or "ACT/HOMEWORK") that nests it
// further under the base — folders are created/reused as needed. Acts whose title
// already exists in their target folder are SKIPPED (re-import is safe, no dupes).
// Returns { folderId, folderName, created, skipped, errors, createdActs }.
// `createdActs` carries the full saved node (with its real `.id`) for every
// act actually created, plus whatever `ttsEligible` flag the bundle entry
// arrived with — the Import dialog's voice panel uses that to know which
// freshly-created acts to run bulk TTS against afterward.
export async function importBundle(bundle, opts = {}) {
  const root = "activities";
  const activities = Array.isArray(bundle?.activities) ? bundle.activities : [];
  const baseParent = opts.parentId ?? null;

  // Resolve (creating/reusing as needed) a folder from path SEGMENTS under the
  // base parent, caching by full path so we don't re-create shared folders.
  const cache = new Map();   // "ACT/HOMEWORK" -> folderId
  async function resolveFolder(segments) {
    let parentId = baseParent, pathKey = "";
    for (const raw of segments) {
      const name = (raw || "").toString().trim();
      if (!name) continue;
      pathKey = pathKey ? pathKey + "/" + name : name;
      if (cache.has(pathKey)) { parentId = cache.get(pathKey); continue; }
      const map = await readAll();
      const existing = Object.values(map).find(n =>
        n.kind === "folder" && !n.trashed && n.root === root &&
        (n.parentId ?? null) === (parentId ?? null) && sameName(n.name, name));
      parentId = existing ? existing.id : (await createFolder(root, parentId, name)).id;
      cache.set(pathKey, parentId);
    }
    return parentId;
  }

  // ⭐ Đợt 221 — a bundle may name a whole PATH (`folderPath: ["LISTENING",
  // "2. LISTENING FOR A2", …]`), which the lesson importer reads off the file
  // name. Every segment is resolved by the same reuse-or-create loop above, so
  // an import lands in the teacher's existing tree instead of beside it.
  // ⚠️ `folder` (one name) is still honoured on its own — hand-written .json
  // bundles have only that, and so does an import whose folder the teacher
  // retyped in the confirm screen.
  const wanted = (bundle?.folder || "").toString().trim();
  const baseSegs = (Array.isArray(bundle?.folderPath) ? bundle.folderPath : [wanted])
    .map(s => (s || "").toString().trim())
    .filter(Boolean);

  const result = { folderId: baseParent, folderName: baseSegs[baseSegs.length - 1] || null,
                   created: 0, skipped: 0, errors: [], createdActs: [] };
  for (const raw of activities) {
    if (!raw || typeof raw.type !== "string" || !raw.content || typeof raw.content !== "object") {
      result.skipped++; result.errors.push("An entry with no type/content was skipped."); continue;
    }
    const subSegs = (raw.subfolder || "").toString().split("/");
    let parentId;
    try { parentId = await resolveFolder([...baseSegs, ...subSegs]); }
    catch (e) { result.errors.push(`Folder for “${raw.title || raw.type}”: ${e?.message || e}`); continue; }

    const activity = {
      schemaVersion: 1,
      type: raw.type,
      title: (raw.title || "Untitled").toString(),
      instruction: raw.instruction || "",
      theme: raw.theme || "classic",
      options: (raw.options && typeof raw.options === "object") ? raw.options : {},
      content: raw.content
    };
    try {
      const node = await saveActivity(activity, { root, parentId });
      result.created++;
      // `ttsEligible` / `ttsVariants` (Đợt 145) ride along on the RETURNED act
      // only — they tell the Import dialog what to generate voices for. Neither
      // can leak into Firestore: `activity` above is built key by key.
      result.createdActs.push({ ...node, ttsEligible: !!raw.ttsEligible, ttsVariants: raw.ttsVariants || null });
    } catch (e) {
      if (e && e.code === "aw/duplicate-name") result.skipped++;
      else result.errors.push(`${activity.title}: ${e?.message || e}`);
    }
  }
  // The folder the dialog opens afterwards is the DEEPEST one made, so its cache
  // key is the whole path — not the first segment. ⚠️ Đợt 221 bug avoided: with
  // a multi-segment path, `cache.get(baseSegs[0])` would open `LISTENING` and
  // leave the teacher four levels above the acts just imported.
  const deepest = baseSegs.join("/");
  if (baseSegs.length && cache.has(deepest)) result.folderId = cache.get(deepest);
  return result;
}

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

// ---- QUICK ACCESS (Đợt 218) ------------------------------------------------
// Pinning a folder to the home page's left-hand panel is stored AS A FIELD ON
// THE FOLDER ITSELF, which looks odd until you read the security rules: the
// published ones open exactly ONE path for the teacher's own data,
// `users/{uid}/items/{itemId}` (docs/08-FIREBASE-SETUP.md). A pin list kept in
// any other collection — `users/{uid}/prefs/...` being the obvious shape —
// would be REFUSED by Firestore until the teacher opens the console and pastes
// a new rule, and nothing on screen would say why the pin did not stick.
//
// Riding on the node buys two more things for free:
//   • the pin follows the ACCOUNT, so ghim ở máy nhà là có luôn ở lớp và trên
//     bảng TOMKO — the teacher never sets the same panel up three times;
//   • it costs no extra read. readAll() already holds every folder in memory,
//     so the whole panel is built from the cache the home page just used.
// ⚠️ A trashed folder must not sit in the panel — listPinned() filters on
// `!trashed`, so Delete removes it from the panel without a second write, and
// Restore brings it back still pinned. Do not "helpfully" clear the flag in
// trashItem(): that would lose the pin on every accidental delete.
export async function setFolderPinned(id, on) {
  const map = await readAll();
  const n = map[id]; if (!n || n.kind !== "folder") return null;
  if (on) {
    n.pinned = true;
    // A new pin goes to the BOTTOM of the panel, never into the middle of an
    // order the teacher arranged by hand (Đợt 218b — the rows are draggable).
    const top = Object.values(map)
      .filter(x => x.root === n.root && x.kind === "folder" && !x.trashed && x.pinned && x.id !== id)
      .reduce((m, x) => Math.max(m, Number.isFinite(x.pinOrder) ? x.pinOrder : -1), -1);
    n.pinOrder = top + 1;
  } else {
    delete n.pinned;
    // ⚠️ pinOrder is deliberately LEFT BEHIND. Re-pinning appends (above), so a
    // stale number changes nothing; wiping it would be one more write for no
    // visible effect, on a path the teacher may hit by mistake.
  }
  n.updatedAt = now();
  await persist([n]);
  return n;
}

// The pinned folders of one root, in the order the teacher dragged them into.
// `pinOrder` first; anything without one (pinned before Đợt 218b, or written by
// an older build) falls in behind, by name — never dropped, never shuffled.
export async function listPinned(root) {
  const map = await readAll();
  const rank = n => (Number.isFinite(n.pinOrder) ? n.pinOrder : Number.MAX_SAFE_INTEGER);
  return Object.values(map)
    .filter(n => n.root === root && n.kind === "folder" && !n.trashed && n.pinned)
    .sort((a, b) => rank(a) - rank(b) || byName(a, b));
}

// Write a whole new order in one batch — `ids` is the panel top to bottom.
// ⚠️ Renumbers from 0 EVERY time rather than patching the moved row: two rows
// that ever end up sharing a number would flip places on the next read, and the
// teacher would have no way to tell which of the two arrangements is saved.
export async function setPinnedOrder(root, ids) {
  const map = await readAll();
  const touched = [];
  ids.forEach((id, i) => {
    const n = map[id];
    if (!n || n.kind !== "folder" || n.root !== root || !n.pinned) return;
    if (n.pinOrder === i) return;      // already right — do not write it again
    n.pinOrder = i;
    n.updatedAt = now();
    touched.push(n);
  });
  if (touched.length) await persist(touched);
  return touched.length;
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
    if (nameTaken(map, { root: n.root, parentId: n.parentId ?? null, kind: n.kind, name, exceptId: n.id })) {
      throw duplicateNameError(name);
    }
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
  // the destination may already hold something of the same kind and name
  if (nameTaken(map, { root: n.root, parentId: newParentId, kind: n.kind, name: itemName(n), exceptId: n.id })) {
    throw duplicateNameError(itemName(n));
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

  // A copy must not collide with a name already in use — Duplicate should just
  // work, so it counts up ("Unit 3 (2)", "Unit 3 (3)"...) instead of erroring.
  const copyName = freeName(map, {
    root: src.root, parentId: src.parentId ?? null, kind: src.kind, name: itemName(src)
  });
  const top = cloneSubtree(src, src.parentId ?? null, copyName);
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
    // Something may have taken the name while this was in the bin. Restoring
    // must never fail on the teacher, so the restored copy counts up instead.
    const spec = { root: top.root, parentId: top.parentId, kind: top.kind, name: itemName(top), exceptId: top.id };
    const free = freeName(map, spec);
    if (!sameName(free, itemName(top))) { if (top.kind === "folder") top.name = free; else top.title = free; }
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

// Permanently delete EVERYTHING in a root's recycle bin (every trashed node —
// bin entries and their descendants). Returns how many bin ENTRIES (the items
// the teacher sees in the bin) were removed. Same finality as Delete forever,
// just in bulk.
export async function emptyTrash(root) {
  const map = await readAll();
  const gone = Object.values(map).filter(n => n.root === root && n.trashed);
  if (!gone.length) return 0;
  const entries = gone.filter(n => n.trashRootId === n.id).length;
  gone.forEach(n => delete map[n.id]);
  await persistDelete(gone.map(n => n.id));
  return entries;
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
