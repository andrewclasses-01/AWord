// =============================================================
// core/run-link.js — iPAD CHO RUNNING WORD / RUNNING TEAM (Đợt 575, thầy 23/10/2026).
//
// Thầy: "Thêm 1 nút kết nối ipad. Với running team, chỉ cần 1 ipad … hiển thị các thông tin phù hợp lần lượt theo từng
//   ván (từng người, từng từ). Running word thì chờ kết nối 2 ipad cho 2 đội, show trước khoảng 5 từ. Đang chơi với từ nào
//   thì từ đó sẽ sáng nổi bật trên ipad." Mẫu thầy duyệt: D:\OTHERS\CLAUDE\AWord - thiet ke Running setup iPad\mau-1.html
//
// ⭐ iPad là MÀN HÌNH, không phải người chơi (cùng lý do rr-link.js của Rocket Race): máy chiếu quyết mọi thứ, iPad chỉ vẽ.
//   ⇒ đi Firestore một chiều (≈ 1 lượt ghi mỗi nước đi), không cần WebRTC. Trễ 0,2–0,5 s là thừa cho một màn để NHÌN.
// ⭐⭐ MỖI TÀI LIỆU MỘT NGƯỜI GHI (luật core: nhiều bên ghi 1 tài liệu ⇒ transaction — né bằng cách tách tài liệu):
//     run_link        — MÁY CHIẾU ghi: trận đang ở đâu + `own` (iPad nào đang giữ chỗ nào) + `hp` (gõ cửa: "iPad nào đang mở thì
//                       báo danh ngay", để chấm nối hiện tức thì chứ không đợi nhịp 8 s)
//     run_pad0/1      — iPAD ghi nhịp { dev, n } mỗi BEAT_MS (chỗ 0 = TEAM A / iPad duy nhất của Running Team, chỗ 1 = TEAM B)
//   ⚠️ Hai iPad cùng chọn một chỗ thì cùng ghi run_padN — không sao: tài liệu đó chỉ là NHỊP, MÁY CHIẾU là trọng tài duy nhất
//   (`own`: iPad đến TRƯỚC giữ chỗ tới khi nó im quá STALE_MS), iPad đọc `own` để tự biết mình bị từ chối.
// ⛔ KHÔNG so đồng hồ hai máy: "còn sống" = máy chiếu THẤY nhịp đổi trong STALE_MS gần nhất, đo bằng đồng hồ của chính nó.
// Nơi ở: users/{uid}/items — đường duy nhất luật Firestore đã mở cho dữ liệu riêng của thầy (không phải đăng luật mới).
//   ⚠️ Hai kind dưới đây PHẢI có trong APP_DATA_KINDS (core/store.js), không thì ăn mất số link ?a=.
// Bàn thử: `?padsig=local` (cả trang game lẫn run.html) ⇒ localStorage + BroadcastChannel, không đăng nhập — như core/ipad-now.js.
// =============================================================

import { db, fs, currentUser } from "./firebase.js";

export const RUN_LOCAL = new URLSearchParams(location.search).get("padsig") === "local";
// Bàn thử: `?padkeep` ⇒ tab nền vẫn báo danh (thật: iPad tắt màn / chuyển app = hidden ⇒ báo "đã rời" ngay — đúng sự thật)
const KEEP = new URLSearchParams(location.search).has("padkeep");
export const LINK_KIND = "running-link";
export const PAD_KIND = "running-pad";
const LINK = "run_link";
const PAD = s => "run_pad" + s;
export const BEAT_MS = 8000;      // iPad báo danh
export const STALE_MS = 22000;    // máy chiếu coi là mất iPad (gần 3 nhịp: lỡ MỘT nhịp vì mạng chậm chưa phải là đi rồi)

const envelope = (id, kind) => ({ id, kind, root: "showdown", parentId: null, trashed: false });

// Firestore từ chối `undefined`
function clean(v) {
  if (Array.isArray(v)) return v.map(clean);
  if (v && typeof v === "object") { const o = {}; for (const [k, x] of Object.entries(v)) if (x !== undefined) o[k] = clean(x); return o; }
  return v;
}
async function uid() {
  const u = await currentUser();
  if (!u) { const e = new Error("Please sign in to link an iPad."); e.code = "aw/signed-out"; throw e; }
  return u.uid;
}

// ---------------------------------------------------------------- kho (Firestore | cục bộ)
const LKEY = id => "awrun:" + id;
let postBc = null;
function post(id) {
  try { (postBc || (postBc = new BroadcastChannel("awrun"))).postMessage(id); } catch (e) { /* trình duyệt cũ */ }
}
function readLocal(id) { try { return JSON.parse(localStorage.getItem(LKEY(id)) || "null"); } catch (e) { return null; } }

async function write(id, kind, data) {
  if (RUN_LOCAL) {
    localStorage.setItem(LKEY(id), JSON.stringify({ ...(readLocal(id) || {}), ...clean(data) }));
    post(id);
    return;
  }
  const u = await uid();
  const [d, { doc, setDoc }] = await Promise.all([db(), fs()]);
  await setDoc(doc(d, `users/${u}/items`, id), clean({ ...envelope(id, kind), ...data }), { merge: true });
}

function watch(id, cb, onError) {
  let dead = false, stop = null;
  if (RUN_LOCAL) {
    let bc = null;
    try { bc = new BroadcastChannel("awrun"); bc.onmessage = e => { if (!dead && e.data === id) cb(readLocal(id)); }; } catch (e) { /* */ }
    setTimeout(() => { if (!dead) cb(readLocal(id)); });
    return () => { dead = true; try { bc && bc.close(); } catch (e) { /* */ } };
  }
  (async () => {
    try {
      const u = await uid();
      const [d, { doc, onSnapshot }] = await Promise.all([db(), fs()]);
      if (dead) return;
      stop = onSnapshot(doc(d, `users/${u}/items`, id),
        snap => { if (!dead) cb(snap.exists() ? snap.data() : null); },
        err => { if (!dead && onError) onError(err); });
    } catch (e) { if (!dead && onError) onError(e); }
  })();
  return () => { dead = true; if (stop) { try { stop(); } catch (e) { /* đã gỡ */ } } };
}

const rid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

// ---------------------------------------------------------------- MÁY CHIẾU
/**
 * game: "runningword" | "runningteam" · slots: số iPad (2 | 1).
 * onPads([bool…]) — chỗ nào đang có iPad (gọi mỗi khi đổi).
 * Trả { publish(patch), pads(), stop() }. publish gộp các patch trong 80 ms thành MỘT lượt ghi.
 */
export function createRunHost({ game, slots, onPads }) {
  // mỗi chỗ: dev → { first, last } (performance.now của MÁY CHIẾU) — first giữ thứ tự đến, last nói còn sống
  const seen = Array.from({ length: slots }, () => new Map());
  const lastKey = Array.from({ length: slots }, () => null);
  const own = Array.from({ length: slots }, () => "");
  let live = own.map(() => false);
  // ⚠️ `own` luôn ghi ĐỦ mọi chỗ ("" = trống): setDoc merge trộn sâu map ⇒ ghi `{}` KHÔNG xoá được khoá cũ
  const ownMap = () => Object.fromEntries(own.map((d, i) => [String(i), d]));
  let pending = { game, mid: rid(), hp: rid(), phase: "setup", own: ownMap() };
  let flushT = 0, dead = false;

  function flush() {
    flushT = 0;
    if (dead) return;
    const patch = pending; pending = {};
    write(LINK, LINK_KIND, { ...patch, at: Date.now() }).catch(e => console.warn("AWord/run-link: write", e));
  }
  function publish(patch) {
    if (dead) return;
    Object.assign(pending, patch);
    if (!flushT) flushT = setTimeout(flush, 80);
  }
  function judge() {
    if (dead) return;
    const t = performance.now();
    let changed = false;
    seen.forEach((m, i) => {
      for (const [dev, x] of m) if (t - x.last > STALE_MS) m.delete(dev);
      if (own[i] && !m.has(own[i])) { own[i] = ""; changed = true; }
      if (!own[i] && m.size) {                         // iPad đến TRƯỚC giữ chỗ
        let best = "", bt = Infinity;
        for (const [dev, x] of m) if (x.first < bt) { bt = x.first; best = dev; }
        own[i] = best; changed = true;
      }
    });
    if (changed) publish({ own: ownMap() });
    const now = own.map(Boolean);
    if (now.some((v, i) => v !== live[i])) { live = now; onPads && onPads(live.slice()); }
  }
  const offs = [];
  for (let i = 0; i < slots; i++) {
    offs.push(watch(PAD(i), d => {
      if (dead) return;
      // chưa có tài liệu = mốc "trống" (lastKey ""), để nhịp ĐẦU TIÊN của iPad đã được tính là đổi
      if (!d || !d.dev) { if (lastKey[i] === null) lastKey[i] = ""; return; }
      const key = String(d.n || "");
      const m = seen[i];
      if (d.gone) m.delete(d.dev);
      else if (lastKey[i] !== null && key !== lastKey[i]) {
        // lần đọc ĐẦU chỉ ghi nhận (tài liệu có thể là của sáng nay); `hp` làm iPad đang mở báo danh lại ngay
        const t = performance.now(), x = m.get(d.dev);
        if (x) x.last = t; else m.set(d.dev, { first: t, last: t });
      }
      lastKey[i] = key;
      judge();
    }, e => console.warn("AWord/run-link: watch pad", e)));
  }
  const judgeTimer = setInterval(judge, 2000);
  flush();
  // gõ cửa LẦN HAI khi chắc chắn đã nghe xong: lượt báo danh trả lời lần gõ đầu có thể tới TRƯỚC lần đọc đầu của
  // máy chiếu ⇒ bị lấy làm mốc (không tính) ⇒ chấm nối phải đợi tới nhịp 8 s kế tiếp
  const knockT = setTimeout(() => publish({ hp: rid() }), 1500);

  return {
    publish,
    pads: () => live.slice(),
    stop() {
      if (dead) return;
      dead = true;
      clearInterval(judgeTimer);
      clearTimeout(knockT);
      clearTimeout(flushT);
      offs.forEach(f => f());
      own.fill("");
      write(LINK, LINK_KIND, { game, phase: "off", own: ownMap(), at: Date.now() }).catch(() => {});
    }
  };
}

// ---------------------------------------------------------------- iPAD
const DEV_KEY = "aw.runDev";
function devId() {
  // bàn thử ?padsig=local: 2 tab "iPad" cùng trình duyệt ⇒ mỗi tab một dev (sessionStorage); iPad thật: localStorage
  const st = RUN_LOCAL ? sessionStorage : localStorage;
  try { let v = st.getItem(DEV_KEY); if (!v) { v = rid(); st.setItem(DEV_KEY, v); } return v; } catch (e) { return rid(); }
}
export const myDev = devId();

/** iPad nghe trận (không báo danh) — màn chọn đội dùng để biết đội nào đã có iPad. Trả hàm huỷ. */
export function watchRunLink(cb, onError) { return watch(LINK, cb, onError); }

/**
 * iPad giữ chỗ `slot`: báo danh mỗi BEAT_MS (và ngay khi máy chiếu gõ cửa `hp`), nghe trận.
 * onLink(link | null) mỗi lần trận đổi. Trả { stop() }.
 */
export function joinRunSlot(slot, onLink, onError) {
  let n = 0, lastHp = null, dead = false;
  const beat = (gone = false) => write(PAD(slot), PAD_KIND, { dev: myDev, slot, n: myDev + ":" + (++n), gone }).catch(e => onError && onError(e));
  const off = watch(LINK, d => {
    if (dead) return;
    if (d && d.hp && d.hp !== lastHp) { if (lastHp !== null) beat(); lastHp = d.hp; }
    onLink(d);
  }, onError);
  beat();
  const timer = setInterval(() => { if (KEEP || document.visibilityState === "visible") beat(); }, BEAT_MS);
  const onVis = () => { if (KEEP || document.visibilityState === "visible") beat(); else beat(true); };
  const onHide = () => beat(true);
  document.addEventListener("visibilitychange", onVis);
  window.addEventListener("pagehide", onHide);
  return {
    stop() {
      if (dead) return;
      dead = true;
      clearInterval(timer); off();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", onHide);
      beat(true);
    }
  };
}
