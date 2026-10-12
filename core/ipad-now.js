// =============================================================
// ipad-now.js — iPAD TỰ ĐỔI MÀN THEO GAME ĐANG MỞ (Đợt 508, thầy 12/10/2026).
//
// Thầy: "khi chọn game bất kỳ và bật game đó, thì ipad chọn vào có tự động đổi màn hình phù hợp với game đang được chọn".
// Trước đợt này iPad có HAI trang riêng không biết nhau: pad.html (D-pad STAR LOOT) và source.html (màn câu hỏi Rocket
// Race) — đổi game trên máy chiếu thì iPad đứng "Waiting for the game", phải cầm lên bấm Back chọn lại.
//
// MỘT tài liệu `users/{uid}/items/ipad_now` = "lúc này iPad nên hiện gì":
//     { game: "starloot" | "rocketrace" | "", fight, at }
//   • MÁY CHIẾU ghi (trang thầy, KHÔNG BAO GIỜ trang bài giao của em — engine chỉ gọi ipadSurface(true) khi !session).
//     - Template cần iPad giữ một "claim" suốt lúc nó sống: STAR LOOT (mọi lúc mở) · Rocket Race (chỉ trận Fight bật
//       Question screen — rrLinkStart/rrLinkStop). Claim MỚI NHẤT còn sống thắng.
//     - Mở game KHÁC (không claim) ⇒ engine vẫn gọi ipadSurface ⇒ ghi game:"" ⇒ iPad về màn chờ chung. Đúng ý "game bất kỳ".
//     - Gộp ghi: claim ⇒ 250 ms, về "" ⇒ 1,5 s (đổi act = gỡ game cũ rồi dựng game mới — không cho iPad nháy về màn chờ).
//       Chỉ ghi khi KHÁC lần ghi trước của tab này ⇒ mở game ≈ 0–1 lượt ghi.
//   • iPAD nghe (pad.html là cổng chung, source.html cũng nghe để rời đi khi đổi game).
//   Một người ghi về mặt thiết kế (máy chiếu); hai tab máy chiếu cùng mở thì tab ghi SAU thắng — chính là "game đang được chọn".
//   ⚠️ Đóng tab máy chiếu không kịp gỡ claim ⇒ iPad còn đứng ở màn game đó (tự báo "Waiting for the game") cho tới lần mở
//   game kế tiếp — y như trước đợt này, không tệ hơn.
// ⚠️ kind "ipad-now" PHẢI có trong APP_DATA_KINDS (core/store.js), không thì ăn mất số link ?a=.
// Bàn thử: `?padsig=local` (cả trang game lẫn pad.html/source.html) ⇒ kênh cục bộ 2 tab cùng trình duyệt, không đăng nhập.
// =============================================================

import { db, fs, currentUser } from "./firebase.js";

const LOCAL = new URLSearchParams(location.search).get("padsig") === "local";
const DOC = "ipad_now";
export const IPAD_NOW_KIND = "ipad-now";
const envelope = () => ({ id: DOC, kind: IPAD_NOW_KIND, root: "showdown", parentId: null, trashed: false });
const LKEY = "awipad:now";

// ---------------------------------------------------------------- MÁY CHIẾU
let surface = false;            // trang thầy đang trình chiếu (engine đặt mỗi lần dựng game)
const claims = new Map();       // token → { game, fight }
let seq = 0, timer = null, lastSent = "";

function current() {
  let best = null, bt = 0;
  for (const [t, c] of claims) if (t > bt) { bt = t; best = c; }
  return best;
}
function schedule() {
  if (!surface) return;
  clearTimeout(timer);
  timer = setTimeout(flush, current() ? 250 : 1500);
}
async function flush() {
  timer = null;
  if (!surface) return;
  const cur = current();
  const payload = cur ? { game: cur.game, fight: !!cur.fight } : { game: "", fight: false };
  const key = JSON.stringify(payload);
  if (key === lastSent) return;
  try {
    if (LOCAL) {
      localStorage.setItem(LKEY, JSON.stringify({ ...payload, at: Date.now() }));
      try { new BroadcastChannel("awipad").postMessage("now"); } catch (e) { /* trình duyệt cũ */ }
    } else {
      const user = await currentUser();
      if (!user) return;                          // chưa đăng nhập: không có kho để ghi, iPad cũng không nghe được
      const [d, { doc, setDoc }] = await Promise.all([db(), fs()]);
      await setDoc(doc(d, `users/${user.uid}/items`, DOC), { ...envelope(), ...payload, at: Date.now() });
    }
    lastSent = key;
  } catch (e) { console.warn("iPad follow", e); }
}

/** Engine, mỗi lần dựng game: `on` = trang thầy (không phải bài giao). Cũng là nhịp "có game mới mở" ⇒ ghi lại trạng thái. */
export function ipadSurface(on) {
  surface = !!on;
  if (surface) schedule(); else clearTimeout(timer);
}

/** Template cần iPad: giữ claim suốt lúc sống. Trả { update(patch), release() }. */
export function claimIpad(info) {
  const token = ++seq;
  claims.set(token, { game: String(info.game || ""), fight: !!info.fight });
  schedule();
  return {
    update(patch) {
      const c = claims.get(token); if (!c) return;
      if ("fight" in patch) c.fight = !!patch.fight;
      schedule();
    },
    release() { if (claims.delete(token)) schedule(); },
  };
}

// ---------------------------------------------------------------- iPAD
function norm(raw) {
  if (!raw) return null;
  const g = raw.game === "starloot" || raw.game === "rocketrace" ? raw.game : "";
  return { game: g, fight: !!raw.fight, at: Number(raw.at) || 0 };
}

/** cb({game, fight, at} | null — null = chưa từng có tài liệu, vd. máy chiếu còn bản cũ). onError(e) khi ĐỌC hỏng. */
export function watchIpadNow(cb, onError) {
  let stop = null, dead = false;
  if (LOCAL) {
    const read = () => { try { return norm(JSON.parse(localStorage.getItem(LKEY) || "null")); } catch (e) { return null; } };
    let bc = null;
    try { bc = new BroadcastChannel("awipad"); bc.onmessage = () => { if (!dead) cb(read()); }; } catch (e) { /* */ }
    setTimeout(() => { if (!dead) cb(read()); });
    return () => { dead = true; try { bc && bc.close(); } catch (e) { /* */ } };
  }
  (async () => {
    try {
      const user = await currentUser();
      if (!user) { const e = new Error("signed out"); e.code = "aw/signed-out"; throw e; }
      const [d, { doc, onSnapshot }] = await Promise.all([db(), fs()]);
      if (dead) return;
      stop = onSnapshot(doc(d, `users/${user.uid}/items`, DOC),
        snap => { if (!dead) cb(snap.exists() ? norm(snap.data()) : null); },
        err => { if (!dead && onError) onError(err); });
    } catch (e) { if (!dead && onError) onError(e); }
  })();
  return () => { dead = true; if (stop) { try { stop(); } catch (e) { /* đã gỡ */ } } };
}

// Đội iPad này chọn cho Fight (mỗi iPad nhớ đội của chính nó). Single luôn TEAM A.
const TEAM_KEY = "aw.ipadTeam";
export function savedTeam() { try { const v = localStorage.getItem(TEAM_KEY); return v === "0" || v === "1" ? +v : null; } catch (e) { return null; } }
export function saveTeam(t) { try { localStorage.setItem(TEAM_KEY, t ? "1" : "0"); } catch (e) { /* chế độ riêng tư */ } }
