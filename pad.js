// =============================================================
// pad.js — iPAD LÀM D-PAD CHO STAR LOOT (Đợt 480, thầy 05/10/2026).
// iPad quét QR trên màn lớn (nút Tablet của STAR LOOT) ⇒ mở trang này `pad.html?t=0|1` ⇒ chỉ có D-pad + bom, KHÔNG câu hỏi.
// Phím đi thẳng iPad → máy chiếu bằng WebRTC (templates/maze-chase/3d/mc3d-padlink-2q.js, chép từ myGame — đừng sửa tay).
// Bắt tay qua Firestore tài khoản thầy (templates/maze-chase/sl-pad-signal.js) ⇒ iPad phải đăng nhập CÙNG tài khoản Google
// với máy chiếu (như iPad câu hỏi Rocket Race, source.html). Game mở lại / đổi act ⇒ trang này tự nối lại, không quét lại QR.
// Không có ?t (nút iPad trên thanh AWord mở thẳng pad.html — thầy 05/10: "iPad bấm vào thì mở ra trang và chọn 1 trong 2 đội") ⇒
// màn CHỌN ĐỘI, kèm link sang màn câu hỏi Rocket Race (source.html — nút này trước Đợt 480 mở thẳng trang đó).
// =============================================================

import { onUser, signIn } from "./core/firebase.js";
import { createPadClient } from "./templates/maze-chase/3d/mc3d-padlink-2q.js";
import { mountPadUI, mountPadChooser } from "./templates/maze-chase/3d/mc3d-padui-2q.js";
import { firestoreSignal, PAD_LOCAL } from "./templates/maze-chase/sl-pad-signal.js";

const q = new URLSearchParams(location.search);
const team = q.get("t") === "1" ? 1 : 0;
const goTo = t => { if (t === null) q.delete("t"); else q.set("t", t); location.href = "pad.html" + (q.toString() ? "?" + q : ""); };
const note = document.getElementById("note"), noteB = note.querySelector("b"), noteP = note.querySelector("p"), noteBtn = note.querySelector("button");
function showNote(title, text, { bad = false, button = false } = {}) {
  note.hidden = false; note.classList.toggle("is-bad", bad);
  noteB.textContent = title; noteP.textContent = text || ""; noteBtn.hidden = !button;
}

let client = null, ui = null;
function start() {
  note.hidden = true;
  if (client) return;
  client = createPadClient({ signal: firestoreSignal(), team, onState: s => ui && ui.setState(s) });
  ui = mountPadUI(document.getElementById("pad"), { team, send: k => client.send(k), onBack: () => { stop(); goTo(null); } });
  ui.setState(client.state);
  window.__padc = client;   // bàn thử
}
function stop() {
  if (client) { client.destroy(); client = null; }
  ui = null; document.getElementById("pad").innerHTML = "";
}

noteBtn.addEventListener("click", async () => {
  noteBtn.disabled = true;
  try { await signIn(); } catch (e) { showNote("Could not sign in", e?.message || "Please try again.", { bad: true, button: true }); }
  finally { noteBtn.disabled = false; }
});

if (!q.has("t")) {
  note.hidden = true;
  mountPadChooser(document.getElementById("pad"), { onPick: t => goTo(t),
    extra: `Rocket Race question screen: <a href="source.html">open</a>.` });
} else if (PAD_LOCAL) start();   // bàn thử ?padsig=local — không đăng nhập
else onUser(user => {
  if (user) { start(); return; }
  stop();
  showNote("Sign in to use this iPad as a D-pad", "Use the same Google account as the classroom computer.", { button: true });
}).catch(() => showNote("Cannot reach Google", "This iPad is offline, or the sign-in service is blocked here.", { bad: true }));
