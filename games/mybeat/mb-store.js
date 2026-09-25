// =============================================================
// MY BEAT — where songs, lists and leaderboards live (Đợt 385).
//
// Same path pattern as games/werewolf/ww-store.js and core/settings.js: docs
// in users/{uid}/items (the only path the published rules open), each with a
// `kind` and NO `root`, so a My Beat doc never shows in a library listing.
// Both kinds are in core/store.js APP_DATA_KINDS, so they never take a link
// number. No new Firestore rules were needed.
//
//   users/{uid}/items/aw-mybeat      kind "mybeat"       { lists:[{id,name}] }
//   users/{uid}/items/mb_<…>         kind "mybeat-song"  one song (see mb-core.js)
//
// A song's `board` (leaderboards) is written ONLY by saveScore(), in a
// transaction, and saveSong() never sends `board` — saving the song from the
// editor can never wipe the scores.
//
// makeMemoryStore() = the same surface kept in memory, for test.html.
// =============================================================

import { db, fs, currentUser } from "../../core/firebase.js";
import { boardKey, mergeBoard } from "./mb-core.js";

const LISTS_DOC = "aw-mybeat";

async function col() {
  const user = await currentUser();
  if (!user) { const e = new Error("Please sign in to AWord first."); e.code = "aw/signed-out"; throw e; }
  const [d, F] = await Promise.all([db(), fs()]);
  return { d, F, path: `users/${user.uid}/items` };
}
const newId = () => "mb_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// Firestore refuses `undefined`
function clean(v) {
  if (Array.isArray(v)) return v.map(clean);
  if (v && typeof v === "object") { const o = {}; for (const [k, x] of Object.entries(v)) if (x !== undefined) o[k] = clean(x); return o; }
  return v;
}
const SONG_FIELDS = ["title", "artist", "channel", "youtube", "link", "source", "licence", "credit", "level",
                     "lists", "draft", "duration", "sections", "lines"];

export const firestoreStore = {
  async listSongs() {
    const { d, F, path } = await col();
    const snap = await F.getDocs(F.query(F.collection(d, path), F.where("kind", "==", "mybeat-song")));
    const out = [];
    snap.forEach(s => out.push({ ...s.data(), id: s.id }));
    return out;
  },
  async saveSong(song) {
    const { d, F, path } = await col();
    const id = song.id || newId();
    const data = { id, kind: "mybeat-song", updatedAt: Date.now() };
    SONG_FIELDS.forEach(k => { if (song[k] !== undefined) data[k] = song[k]; });
    if (!song.id) data.createdAt = Date.now();
    await F.setDoc(F.doc(d, path, id), clean(data), { merge: true });
    return id;
  },
  async deleteSong(id) {
    const { d, F, path } = await col();
    await F.deleteDoc(F.doc(d, path, id));
  },
  async getLists() {
    try {
      const { d, F, path } = await col();
      const snap = await F.getDoc(F.doc(d, path, LISTS_DOC));
      const lists = snap.exists() ? snap.data().lists : null;
      return Array.isArray(lists) ? lists : [];
    } catch { return []; }
  },
  async saveLists(lists) {
    const { d, F, path } = await col();
    await F.setDoc(F.doc(d, path, LISTS_DOC), { id: LISTS_DOC, kind: "mybeat", lists: clean(lists) }, { merge: true });
  },
  // -> the new board list for that mode+level
  async saveScore(songId, mode, level, entry) {
    const { d, F, path } = await col();
    const ref = F.doc(d, path, songId), key = boardKey(mode, level);
    return F.runTransaction(d, async tx => {
      const snap = await tx.get(ref);
      if (!snap.exists()) throw new Error("This song was deleted.");
      const board = { ...(snap.data().board || {}) };
      board[key] = mergeBoard(board[key], entry);
      tx.update(ref, { board: clean(board) });
      return board[key];
    });
  }
};

export function makeMemoryStore(songs = [], lists = []) {
  const S = new Map(songs.map(s => [s.id, JSON.parse(JSON.stringify(s))]));
  let L = JSON.parse(JSON.stringify(lists));
  return {
    async listSongs() { return [...S.values()].map(s => JSON.parse(JSON.stringify(s))); },
    async saveSong(song) {
      const id = song.id || newId();
      const old = S.get(id) || { board: {} };
      const next = { ...old, id, kind: "mybeat-song", updatedAt: Date.now() };
      SONG_FIELDS.forEach(k => { if (song[k] !== undefined) next[k] = JSON.parse(JSON.stringify(song[k])); });
      S.set(id, next); return id;
    },
    async deleteSong(id) { S.delete(id); },
    async getLists() { return JSON.parse(JSON.stringify(L)); },
    async saveLists(lists) { L = JSON.parse(JSON.stringify(lists)); },
    async saveScore(songId, mode, level, entry) {
      const s = S.get(songId); if (!s) throw new Error("This song was deleted.");
      s.board = s.board || {};
      const key = boardKey(mode, level);
      s.board[key] = mergeBoard(s.board[key], entry);
      return s.board[key];
    }
  };
}
