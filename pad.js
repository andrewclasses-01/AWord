// =============================================================
// pad.js — CỔNG iPAD CỦA AWORD: TỰ ĐỔI MÀN THEO GAME ĐANG MỞ TRÊN MÁY CHIẾU.
// Đợt 480 (thầy 05/10/2026): iPAD LÀM D-PAD CHO STAR LOOT — quét QR trên màn lớn (nút Tablet của STAR LOOT) ⇒ `pad.html?t=0|1` ⇒
//   chỉ có D-pad + bom, KHÔNG câu hỏi. Phím đi thẳng iPad → máy chiếu bằng WebRTC (templates/maze-chase/3d/mc3d-padlink-2q.js,
//   chép từ myGame — đừng sửa tay). Bắt tay qua Firestore tài khoản thầy (templates/maze-chase/sl-pad-signal.js) ⇒ iPad phải
//   đăng nhập CÙNG tài khoản Google với máy chiếu (như iPad câu hỏi Rocket Race, source.html).
// ⭐ Đợt 508 (thầy 12/10/2026: "khi chọn game bất kỳ và bật game đó, thì ipad … tự động đổi màn hình phù hợp với game đang được
//   chọn") — trang này nghe `ipad_now` (core/ipad-now.js, máy chiếu ghi) và TỰ đổi:
//     starloot   ⇒ D-pad. Single ⇒ TEAM A. Fight ⇒ đội iPad này đã chọn (nhớ trong máy; quét QR đội nào = chọn đội đó); chưa chọn
//                  bao giờ ⇒ màn chọn đội một lần.
//     rocketrace ⇒ sang source.html (màn câu hỏi; trang đó tự quay về đây khi đổi game).
//     "" / chưa có tài liệu ⇒ màn CHỜ chung. (Chưa có tài liệu = máy chiếu còn bản cũ: có ?t thì vẫn mở D-pad như Đợt 480.)
//   Nút ‹ trên D-pad ⇒ màn chọn đội (đứng yên ở đó tới khi chọn — không bị kéo về D-pad giữa chừng).
//   Đọc `ipad_now` hỏng ⇒ chạy như Đợt 480 (có ?t ⇒ D-pad, không ⇒ chọn đội).
// =============================================================

import { onUser, signIn } from "./core/firebase.js";
import { createPadClient } from "./templates/maze-chase/3d/mc3d-padlink-2q.js";
import { mountPadUI, mountPadChooser } from "./templates/maze-chase/3d/mc3d-padui-2q.js";
import { firestoreSignal, PAD_LOCAL } from "./templates/maze-chase/sl-pad-signal.js";
import { watchIpadNow, savedTeam, saveTeam } from "./core/ipad-now.js";

const q = new URLSearchParams(location.search);
const urlTeam = q.has("t") ? (q.get("t") === "1" ? 1 : 0) : null;
if (urlTeam !== null) saveTeam(urlTeam);   // quét QR đội nào = iPad này thuộc đội đó (dùng cho Fight)
const padEl = document.getElementById("pad");
const note = document.getElementById("note"), noteB = note.querySelector("b"), noteP = note.querySelector("p"), noteBtn = note.querySelector("button");
function showNote(title, text, { bad = false, button = false } = {}) {
  note.hidden = false; note.classList.toggle("is-bad", bad);
  noteB.textContent = title; noteP.textContent = text || ""; noteBtn.hidden = !button;
}
// giữ ?padsig=… / ?padorigin=… (bàn thử) khi đổi trang hay đổi đội
function urlWith(page, t) {
  const p = new URLSearchParams(location.search);
  if (t === null || t === undefined) p.delete("t"); else p.set("t", t);
  return page + (p.toString() ? "?" + p : "");
}

// ---------------------------------------------------------------- các màn
let view = "", curTeam = -1, client = null, ui = null, manual = false;
function stopPad() {
  if (client) { client.destroy(); client = null; }
  ui = null; curTeam = -1;
}
function showDpad(team) {
  note.hidden = true;
  if (view === "dpad" && curTeam === team) return;
  stopPad(); view = "dpad"; curTeam = team;
  // ⚠️ KHÔNG ghi ?t vào URL: Single tự hiện TEAM A ⇒ URL ?t=0 ⇒ tải lại trang là saveTeam(0) đè mất đội Fight iPad này đã chọn
  history.replaceState(null, "", urlWith("pad.html", null));
  client = createPadClient({ signal: firestoreSignal(), team, onState: s => ui && ui.setState(s) });
  ui = mountPadUI(padEl, { team, send: k => client.send(k), onBack: () => { manual = true; showChooser(); } });
  ui.setState(client.state);
  window.__padc = client;   // bàn thử
}
function showChooser() {
  note.hidden = true;
  stopPad(); view = "chooser";
  history.replaceState(null, "", urlWith("pad.html", null));
  mountPadChooser(padEl, { onPick: t => { saveTeam(t); manual = false; apply(true); },
    extra: `Rocket Race question screen: <a href="${urlWith("source.html", null)}">open</a>.` });
}
function showHub() {
  note.hidden = true;
  if (view === "hub") return;
  stopPad(); view = "hub";
  history.replaceState(null, "", urlWith("pad.html", null));
  padEl.innerHTML = `<div class="pad-hub"><b>iPad ready</b>
    <p>Open <span>STAR LOOT</span> — or <span>Rocket race</span> with Question screen on — on the classroom screen.<br>This iPad switches by itself.</p>
    <p class="pad-hub-x"><a href="#" data-k="team">Choose team</a> · <a href="${urlWith("source.html", null)}">Rocket Race question screen</a></p></div>`;
  padEl.querySelector('[data-k="team"]').addEventListener("click", e => { e.preventDefault(); manual = true; showChooser(); });
  keepAwake();
}

// màn chờ cũng giữ iPad sáng: ngủ thì lúc thầy mở game, iPad không đổi được (JS dừng khi màn tắt)
let lock = null;
async function keepAwake() {
  if (lock || !("wakeLock" in navigator) || document.visibilityState !== "visible") return;
  try { lock = await navigator.wakeLock.request("screen"); lock.addEventListener("release", () => { lock = null; }); } catch (e) { /* pin yếu / không hỗ trợ */ }
}
document.addEventListener("visibilitychange", () => { if (view === "hub") keepAwake(); });

// ---------------------------------------------------------------- đi theo máy chiếu
let now, followBroken = false, applyT = 0, unwatch = null;   // now: undefined = chưa đọc · null = chưa có tài liệu
function apply(force) {
  clearTimeout(applyT);
  if (followBroken) { if (manual || urlTeam === null) showChooser(); else showDpad(urlTeam); return; }
  if (now === undefined) return;
  const g = now ? now.game : "";
  if (g === "rocketrace") { location.replace(urlWith("source.html", null)); return; }
  if (manual && !force) { if (view !== "chooser") showChooser(); return; }
  if (g === "starloot") {
    const t = now.fight ? savedTeam() : 0;
    if (t === null) showChooser(); else showDpad(t);
    return;
  }
  if (now === null && urlTeam !== null) { showDpad(urlTeam); return; }   // máy chiếu bản cũ (chưa ghi ipad_now) ⇒ như Đợt 480
  showHub();
}
function startFollow() {
  if (unwatch) return;
  showNote("Loading…", "");
  unwatch = watchIpadNow(s => {
    const first = now === undefined;
    now = s; followBroken = false;
    // vào màn game nhanh (0,5 s); về màn chờ chậm (2,5 s) — đổi act = gỡ game cũ rồi dựng game mới, không cho iPad nháy
    clearTimeout(applyT);
    if (first) apply(); else applyT = setTimeout(apply, s && s.game ? 500 : 2500);
  }, e => {
    console.warn("iPad follow", e);
    followBroken = true; apply();
  });
}
function stopFollow() {
  if (unwatch) { unwatch(); unwatch = null; }
  clearTimeout(applyT); now = undefined;
  stopPad(); view = ""; padEl.innerHTML = "";
}

noteBtn.addEventListener("click", async () => {
  noteBtn.disabled = true;
  try { await signIn(); } catch (e) { showNote("Could not sign in", e?.message || "Please try again.", { bad: true, button: true }); }
  finally { noteBtn.disabled = false; }
});

if (PAD_LOCAL) startFollow();   // bàn thử ?padsig=local — không đăng nhập
else onUser(user => {
  if (user) { startFollow(); return; }
  stopFollow();
  showNote("Sign in to use this iPad", "Use the same Google account as the classroom computer.", { button: true });
}).catch(() => showNote("Cannot reach Google", "This iPad is offline, or the sign-in service is blocked here.", { bad: true }));
