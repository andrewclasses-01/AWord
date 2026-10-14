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
// ⭐ Đợt 511 (thầy 13/10/2026) — ROCKET RACE "GAME CONTROLLER": máy chiếu bật nút iPad ▸ Game controller ⇒ `ipad_now` {game:"rocketrace", ctl:true}
//   ⇒ iPad này mở BẢNG TÊN LỬA của đội đã nhớ (cùng khoá đội với STAR LOOT — aw.ipadTeam) = chính bảng 3D của game (rr-padui.js / rr-padscene.js),
//   nối WebRTC qua kênh templates/rocket-race/rr-pad-signal.js. Chưa chọn đội ⇒ màn chọn đội của Rocket Race (ghi "iPad already connected"
//   dưới đội đã có iPad). Đợt 514: đội đã có iPad ⇒ iPad khác KHÔNG giành được (màn chọn đội chặn + máy chủ từ chối ⇒ "<ĐỘI> ALREADY HAS AN iPAD", iPad kia rời là tự vào).
//   Không QR (thầy): iPad đã đăng nhập cùng tài khoản AWord, bấm nút iPad trên trang chủ là vào đây.
// ⭐ Đợt 515 (thầy 14/10/2026) — TRAIN RUSH FIGHT 1 MÀN: máy chiếu mở Train rush ▸ Fight (nút iPad không Off) ⇒ `ipad_now` {game:"trainrush"}
//   ⇒ iPad này mở CẢNH 2D của đội đã nhớ (aw.ipadTeam — chung với STAR LOOT / Rocket Race): tàu + khinh khí cầu của RIÊNG đội, khớp màn lớn,
//   chạm quả = quả đó nổ trên màn lớn (templates/balloon-pop/3d/tr-padui-1ap.js, chép myGame). Bắt tay: templates/balloon-pop/tr-pad-signal.js.
//   Chưa chọn đội ⇒ màn chọn đội chung. Đội đã có iPad ⇒ iPad sau báo "TEAM x already has an iPad" (như Rocket Race Đợt 514).
// ⭐ Đợt 517 (thầy 14/10/2026) — màn iPad TRAIN RUSH vẽ lại kiểu A "Miền Tây hoàng hôn" (thầy chọn từ bản phác myGame thiet-ke-ipad-1aq.html):
//   3d/tr-padui-1aq.js — mountTrainPad (tàu hơi nước chi tiết, bánh quay đúng chiều, khinh khí cầu màu đội, thanh gỗ LEVEL k/n + giờ + điểm 2 đội,
//   thẻ bảng truy nã) + mountTrainChooser (màn chọn đội cùng kiểu, thay khung HTML Đợt 515).
// ⭐ Đợt 523 — 3d/tr-padui-1av.js: GIẢM TẢI (iPad nóng) — 25 khung/giây (8 khi màn đứng), độ nét ≤ 1,5. Bảng Rocket Race cùng đợt: rr-padscene.js.
// ⭐ Đợt 522 — 3d/tr-padui-1au.js: thu nhỏ (thấy ~40 đơn vị), toa mở đầu ở 46 % từ trái, bảng định nghĩa phủ kín hông toa, không khung vàng ▼.
// ⭐ Đợt 519 — 3d/tr-padui-1as.js: 30 tin/giây, bù lệch tan dần, đoán tiếp 0,6 s khi Wi-Fi khựng.
// ⭐ Đợt 518 — iPad hết giật (3d/tr-padui-1ar.js): thùng đẩy tiếp theo vận tốc, vị trí tính theo giờ game; chạm 3 lần góc phải dưới = bảng đo.
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
let tr = null;                                   // Đợt 515: cảnh 2D Train Rush
let rr = null, rrBusyOff = null;                 // Đợt 511: { client, ui } bảng tên lửa Rocket Race · huỷ nghe "đội đã có iPad"
function stopPad() {
  if (client) { client.destroy(); client = null; }
  if (rr) { try { rr.client.destroy(); rr.ui.destroy(); } catch (e) { /* */ } rr = null; }
  if (rrBusyOff) { rrBusyOff(); rrBusyOff = null; }
  if (tr) { try { tr.destroy(); } catch (e) { /* */ } tr = null; }
  ui = null; curTeam = -1;
}
const rrCtl = () => !!(now && now.game === "rocketrace" && now.ctl);
const rrMods = () => Promise.all([import("./templates/rocket-race/rr-padlink.js"), import("./templates/rocket-race/rr-padui.js"),
  import("./templates/rocket-race/rr-pad-signal.js")]);
// ⭐ Đợt 511 — bảng tên lửa Rocket Race (Game controller) cho đội `team`
async function showRR(team) {
  note.hidden = true;
  if (view === "rr" + team) return;
  stopPad(); view = "rr" + team; curTeam = team;
  history.replaceState(null, "", urlWith("pad.html", null));
  padEl.innerHTML = "";
  let mods;
  try { mods = await rrMods(); } catch (e) { console.warn("Rocket Race pad", e); showNote("Could not load", "Check the network and reload this page.", { bad: true }); return; }
  if (view !== "rr" + team) return;                    // đã đổi màn trong lúc nạp
  const [L, U, S] = mods;
  let rui = null;
  const c = L.createPadClient({ signal: S.rrPadSignal(), team,
    onState: x => rui && rui.setState(x), onInfo: i => rui && rui.setInfo(i), onEvent: e => rui && rui.event(e) });
  rui = U.mountMissilePad(padEl, { team, client: c, onBack: () => { manual = true; showChooser(); } });
  rui.setState(c.state);
  rr = { client: c, ui: rui };
  window.__padc = c; window.__padui = rui;   // bàn thử
}
// màn chọn đội của Rocket Race: ghi chú đội đang có iPad (máy chiếu ghi c0/c1 vào rrpad_host)
async function showRRChooser() {
  note.hidden = true;
  stopPad(); view = "chooser";
  history.replaceState(null, "", urlWith("pad.html", null));
  let mods; try { mods = await rrMods(); } catch (e) { showNote("Could not load", "Check the network and reload this page.", { bad: true }); return; }
  if (view !== "chooser") return;
  const [, U, S] = mods;
  const ch = U.mountPadChooser(padEl, { current: savedTeam(), onPick: t => { saveTeam(t); manual = false; apply(true); } });
  rrBusyOff = S.rrPadSignal().listen("host", d => ch.setBusy([d && d.sid ? +d.c0 || 0 : 0, d && d.sid ? +d.c1 || 0 : 0]));
}
// ⭐ Đợt 515 — cảnh 2D TRAIN RUSH (Fight 1 màn) cho đội `team`
const trMods = () => Promise.all([import("./templates/balloon-pop/3d/tr-padui-1av.js"), import("./templates/balloon-pop/tr-pad-signal.js")]);   // Đợt 517: kiểu A
async function showTR(team) {
  note.hidden = true;
  if (view === "tr" + team) return;
  stopPad(); view = "tr" + team; curTeam = team;
  history.replaceState(null, "", urlWith("pad.html", null));
  padEl.innerHTML = "";
  let mods;
  try { mods = await trMods(); } catch (e) { console.warn("Train Rush pad", e); showNote("Could not load", "Check the network and reload this page.", { bad: true }); return; }
  if (view !== "tr" + team) return;                    // đã đổi màn trong lúc nạp
  const [U, S] = mods;
  tr = U.mountTrainPad(padEl, { signal: S.trPadSignal(), team, onBack: () => { manual = true; showChooser(); } });
  window.__padtr = tr;   // bàn thử
  keepAwake();
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
// ⭐ Đợt 515 — màn chọn đội của TRAIN RUSH (đỏ / xanh); đội đang có iPad (trpad_host c0/c1) ⇒ chạm chỉ báo, không giành (như RR Đợt 514)
async function showTRChooser() {
  note.hidden = true;
  stopPad(); view = "chooser";
  history.replaceState(null, "", urlWith("pad.html", null));
  let U, S; try { [U, S] = await trMods(); } catch (e) { showNote("Could not load", "Check the network and reload this page.", { bad: true }); return; }
  if (view !== "chooser") return;
  if (U.mountTrainChooser) {   // Đợt 517: màn chọn đội vẽ kiểu A (canvas); `tr` giữ nó ⇒ stopPad dỡ
    tr = U.mountTrainChooser(padEl, { cur: savedTeam(), onPick: t => { saveTeam(t); manual = false; apply(true); } });
    rrBusyOff = S.trPadSignal().listen("host", d => tr && tr.setBusy && tr.setBusy([d && d.sid ? +d.c0 || 0 : 0, d && d.sid ? +d.c1 || 0 : 0]));
    window.__padtr = tr;   // bàn thử
    return;
  }
  const cur = savedTeam(), T = [["TEAM 1", "#e2402f"], ["TEAM 2", "#2f7fe2"]];
  padEl.innerHTML = `<div style="position:fixed;inset:0;display:grid;place-content:center;gap:22px;text-align:center;background:#120c07;color:#f6e6c4;font-family:'Baloo 2',system-ui,sans-serif">
    <h2 style="margin:0;font:400 clamp(24px,4.4vw,40px) Rye,serif;color:#ffd98a">TRAIN RUSH · CHOOSE YOUR TEAM</h2>
    <div style="display:flex;gap:24px;justify-content:center">${T.map(([n, c], t) => `<button data-t="${t}" style="font:400 clamp(26px,4.6vw,40px) Rye,serif;color:#fff;padding:26px 44px;border-radius:18px;cursor:pointer;background:${c};border:4px solid ${t === cur ? "#ffd98a" : "rgba(255,255,255,.35)"}">${n}<small style="display:block;font:600 16px 'Baloo 2',sans-serif"></small></button>`).join("")}</div>
    <p class="trc-x" style="margin:0;font:600 17px 'Baloo 2',sans-serif;opacity:.85">This iPad remembers its team. Change it any time with ‹ on the train screen.</p></div>`;
  const btns = [...padEl.querySelectorAll("button[data-t]")], noteEl = padEl.querySelector(".trc-x");
  let busy = [0, 0];
  btns.forEach(b => b.addEventListener("click", () => {
    const t = +b.dataset.t;
    if (busy[t] && t !== cur) { noteEl.textContent = T[t][0] + " already has an iPad connected. Choose the other team."; noteEl.style.color = "#fcd34d"; return; }
    saveTeam(t); manual = false; apply(true);
  }));
  rrBusyOff = S.trPadSignal().listen("host", d => { busy = [d && d.sid ? +d.c0 || 0 : 0, d && d.sid ? +d.c1 || 0 : 0]; btns.forEach((b, t) => { b.querySelector("small").textContent = busy[t] ? "iPad already connected" : ""; }); });
}
function showChooser() {
  if (rrCtl()) { showRRChooser(); return; }
  if (now && now.game === "trainrush") { showTRChooser(); return; }   // Đợt 515           // Đợt 511: đang Rocket Race Game controller ⇒ màn chọn đội của RR
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
    <p>Open <span>STAR LOOT</span>, <span>Train rush</span> Fight — or <span>Rocket race</span> with the iPad button on (Question screen or Game controller) — on the classroom screen.<br>This iPad switches by itself.</p>
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
  if (g === "rocketrace" && !now.ctl) { location.replace(urlWith("source.html", null)); return; }
  if (manual && !force) { if (view !== "chooser") showChooser(); return; }
  if (g === "rocketrace") {                              // Đợt 511: Game controller ⇒ bảng tên lửa của đội đã nhớ
    const t = savedTeam();
    if (t === null) { if (view !== "chooser") showChooser(); } else showRR(t);
    return;
  }
  if (g === "trainrush") {                              // Đợt 515: Train Rush Fight 1 màn ⇒ cảnh 2D của đội đã nhớ
    const t = savedTeam();
    if (t === null) { if (view !== "chooser") showChooser(); } else showTR(t);
    return;
  }
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
    // ⭐ Đợt 513: đang làm tay cầm mà tài liệu báo game KHÁC ⇒ chờ 1,5 s — nếu đó chỉ là AWord mở ở nơi khác, máy chiếu (claim hold,
    //   core/ipad-now.js) ghi lại ngay và lượt đọc kế tiếp huỷ hẹn này ⇒ bảng tên lửa / D-pad không bị gỡ, không phải nối lại
    clearTimeout(applyT);
    const busy = view.startsWith("rr") || view.startsWith("tr") || view === "dpad";
    const same = s && s.game && (view.startsWith("rr") ? s.game === "rocketrace" && s.ctl : view.startsWith("tr") ? s.game === "trainrush" : view === "dpad" ? s.game === "starloot" : false);
    if (first) apply(); else applyT = setTimeout(apply, !(s && s.game) ? 2500 : busy && !same ? 1500 : 500);
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
