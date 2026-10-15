// =============================================================
// ipad-now.js — iPAD TỰ ĐỔI MÀN THEO GAME ĐANG MỞ (Đợt 508, thầy 12/10/2026).
//
// Thầy: "khi chọn game bất kỳ và bật game đó, thì ipad chọn vào có tự động đổi màn hình phù hợp với game đang được chọn".
// Trước đợt này iPad có HAI trang riêng không biết nhau: pad.html (D-pad STAR LOOT) và source.html (màn câu hỏi Rocket
// Race) — đổi game trên máy chiếu thì iPad đứng "Waiting for the game", phải cầm lên bấm Back chọn lại.
//
// MỘT tài liệu `users/{uid}/items/ipad_now` = "lúc này iPad nên hiện gì":
//     { game: "starloot" | "rocketrace" | "", fight, ctl, at }
//   ⭐ Đợt 511 — `ctl`: Rocket Race đang ở chế độ iPad GAME CONTROLLER (iPad = bảng tên lửa của đội, templates/rocket-race/rr-padui.js)
//     thay vì Question screen (source.html). pad.html rẽ theo trường này.
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
// ⭐ Đợt 513 (thầy 14/10/2026: Rocket Race Controller chơi được ~3 phút thì 2 iPad về "iPad ready" — thầy "thường chạy nhiều AWord
//   ở nhiều nơi … không thể để việc này gây ảnh hưởng tới game đang chơi"): mọi game AWord mở ở tab/máy/myActivity/myLesson KHÁC đều
//   ghi game:"" ⇒ đè claim của trận đang chơi; máy chiếu chỉ ghi khi CHÍNH nó đổi (lastSent) nên không bao giờ ghi lại ⇒ iPad kẹt
//   màn chờ tới khi thầy tắt/bật iPad. Nay claim có `hold` = "trận này đang dùng iPad thật" (Rocket Race: bật Questions/Controller là
//   hold ngay · STAR LOOT: từ lúc có iPad nối lần đầu). Tab đang giữ claim hold thì NGHE tài liệu: ai khác ghi mà không hold
//   (game "" hay một STAR LOOT chỉ đang mở) ⇒ ghi lại NGAY. Hai tab cùng hold ⇒ tab ghi sau thắng, không giành qua lại.
//   Tài liệu có thêm `hold` + `src` (mã tab ghi — để tab tự nhận ra lượt ghi của chính mình).
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
const claims = new Map();       // token → { game, fight, ctl, hold }
let seq = 0, timer = null, lastSent = "";
const TAB = Math.random().toString(36).slice(2, 10);   // Đợt 513 — mã tab này (trường `src`)
let guardOff = null;            // Đợt 513 — huỷ nghe tài liệu (chỉ nghe khi claim hiện hành đang hold)

function current() {
  let best = null, bt = 0;
  for (const [t, c] of claims) if (t > bt) { bt = t; best = c; }
  return best;
}
function schedule(ms) {
  syncGuard();
  if (!surface) return;
  clearTimeout(timer);
  timer = setTimeout(flush, ms != null ? ms : current() ? 250 : 1500);
}
// ⭐ Đợt 513 — trận đang dùng iPad thật: tab khác ghi đè mà không hold ⇒ ghi lại ngay (iPad chờ 2,5 s mới về màn chờ ⇒ không kịp nháy)
function syncGuard() {
  const cur = current(), want = !!(surface && cur && cur.hold);
  if (want && !guardOff) {
    guardOff = watchIpadNow(r => {
      const c = current();
      if (!r || !c || !c.hold || r.src === TAB || r.hold) return;
      if (r.game === c.game && r.fight === !!c.fight && r.ctl === !!c.ctl) return;
      lastSent = ""; schedule(0);
    }, e => console.warn("iPad guard", e));
  } else if (!want && guardOff) { guardOff(); guardOff = null; }
}
async function flush() {
  timer = null;
  if (!surface) return;
  const cur = current();
  const payload = cur ? { game: cur.game, fight: !!cur.fight, ctl: !!cur.ctl, hold: !!cur.hold } : { game: "", fight: false, ctl: false, hold: false };
  const key = JSON.stringify(payload);
  if (key === lastSent) return;
  try {
    if (LOCAL) {
      localStorage.setItem(LKEY, JSON.stringify({ ...payload, src: TAB, at: Date.now() }));
      try { new BroadcastChannel("awipad").postMessage("now"); } catch (e) { /* trình duyệt cũ */ }
    } else {
      const user = await currentUser();
      if (!user) return;                          // chưa đăng nhập: không có kho để ghi, iPad cũng không nghe được
      const [d, { doc, setDoc }] = await Promise.all([db(), fs()]);
      await setDoc(doc(d, `users/${user.uid}/items`, DOC), { ...envelope(), ...payload, src: TAB, at: Date.now() });
    }
    lastSent = key;
  } catch (e) { console.warn("iPad follow", e); }
}

/** Engine, mỗi lần dựng game: `on` = trang thầy (không phải bài giao). Cũng là nhịp "có game mới mở" ⇒ ghi lại trạng thái. */
export function ipadSurface(on) {
  surface = !!on;
  if (surface) schedule(); else { clearTimeout(timer); syncGuard(); }
}

/** Template cần iPad: giữ claim suốt lúc sống. Trả { update(patch), release() }. `hold` (Đợt 513) = trận đang dùng iPad thật. */
export function claimIpad(info) {
  const token = ++seq;
  claims.set(token, { game: String(info.game || ""), fight: !!info.fight, ctl: !!info.ctl, hold: !!info.hold });
  schedule();
  return {
    update(patch) {
      const c = claims.get(token); if (!c) return;
      if ("fight" in patch) c.fight = !!patch.fight;
      if ("ctl" in patch) c.ctl = !!patch.ctl;
      if ("hold" in patch) c.hold = !!patch.hold;
      schedule();
    },
    release() { if (claims.delete(token)) schedule(); },
  };
}

// ---------------------------------------------------------------- iPAD
function norm(raw) {
  if (!raw) return null;
  const g = raw.game === "starloot" || raw.game === "rocketrace" || raw.game === "trainrush" || raw.game === "racingwords" ? raw.game : "";   // Đợt 527: + racingwords   // Đợt 515: + trainrush (Fight 1 màn, iPad cảnh 2D)
  return { game: g, fight: !!raw.fight, ctl: !!raw.ctl, hold: !!raw.hold, src: String(raw.src || ""), at: Number(raw.at) || 0 };
}

/** cb({game, fight, ctl, at} | null — null = chưa từng có tài liệu, vd. máy chiếu còn bản cũ). onError(e) khi ĐỌC hỏng. */
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
// Đợt 511: bàn thử ?padsig=local ⇒ 2 tab "iPad" cùng trình duyệt chung localStorage ⇒ đội lưu sessionStorage (mỗi tab một iPad). iPad thật: localStorage.
const teamStore = () => (LOCAL ? sessionStorage : localStorage);
export function savedTeam() { try { const v = teamStore().getItem(TEAM_KEY); return v === "0" || v === "1" ? +v : null; } catch (e) { return null; } }
export function saveTeam(t) { try { teamStore().setItem(TEAM_KEY, t ? "1" : "0"); } catch (e) { /* chế độ riêng tư */ } }
