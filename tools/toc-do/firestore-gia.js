// FIRESTORE GIẢ trong bộ nhớ cho bàn thử Đợt 484 (chỉ những gì store.js / assignments.js dùng).
export const KHO = new Map();           // "users/U1/items/<id>" -> data
export const DEM = { getDocs: 0, getDoc: 0, set: 0, del: 0, docsDoc: 0 };
const sao = o => JSON.parse(JSON.stringify(o));
export const firebaseConfig = { projectId: "gia" };
export const TEACHER_EMAIL = "thay@gia";
export function isTeacher() { return true; }
export async function auth() { return { currentUser: { uid: "U1", email: TEACHER_EMAIL, getIdToken: async () => "tk" } }; }
export async function currentUser() { return { uid: "U1", email: TEACHER_EMAIL }; }
export async function db() { return { gia: true }; }
const SDK = {
  collection: (d, path) => ({ path }),
  where: (f, op, v) => ({ f, op, v }),
  query: (c, ...cons) => ({ path: c.path, cons }),
  doc: (d, path, id) => ({ path: path + "/" + id, id }),
  async getDocs(q) {
    DEM.getDocs++;
    const pre = q.path + "/"; const out = [];
    for (const [k, v] of KHO) {
      if (!k.startsWith(pre) || k.slice(pre.length).includes("/")) continue;
      const ok = (q.cons || []).every(c => {
        const x = v[c.f];
        if (c.op === "!=") return x !== undefined && x !== c.v;
        if (c.op === "not-in") return x !== undefined && !c.v.includes(x);
        if (c.op === "==") return x === c.v;
        throw new Error("op chua ho tro " + c.op);
      });
      if (ok) out.push({ id: k.slice(pre.length), data: () => sao(v) });
    }
    DEM.docsDoc += out.length;
    return { forEach: f => out.forEach(f), docs: out, size: out.length };
  },
  async getDoc(ref) { DEM.getDoc++; const v = KHO.get(ref.path); return { id: ref.id, exists: () => v !== undefined, data: () => v === undefined ? undefined : sao(v) }; },
  async setDoc(ref, data) { DEM.set++; KHO.set(ref.path, sao(data)); },
  writeBatch() {
    const ops = [];
    return { set: (ref, data) => ops.push(["s", ref, sao(data)]), delete: ref => ops.push(["d", ref]),
      async commit() { for (const [t, ref, data] of ops) { if (t === "s") { DEM.set++; KHO.set(ref.path, data); } else { DEM.del++; KHO.delete(ref.path); } } } };
  },
  serverTimestamp: () => Date.now(),
};
export async function fs() { return SDK; }
export async function signIn() {}
export async function signOutNow() {}
export async function onUser(cb) { cb(await currentUser()); return () => {}; }
