// =============================================================
// run.js — MÀN iPAD CỦA RUNNING WORD / RUNNING TEAM (Đợt 575, thầy 23/10/2026).
//
// Mẫu thầy duyệt: D:\OTHERS\CLAUDE\AWord - thiet ke Running setup iPad\mau-1.html (tab ③ ④).
//   RUNNING WORD — mỗi đội một iPad, cầm ở người GIẢI THÍCH (quay lưng với người gõ): dải màu đội + đồng hồ của đội,
//     TỪ ĐANG CHƠI to trong ô trắng viền màu đội, 4 từ kế nhỏ + mờ dần; từ đã xong không hiện. Không phải lượt mình ⇒
//     màn tối + ô WAITING (vẫn thấy từ sắp tới để chuẩn bị).
//   RUNNING TEAM — MỘT iPad chuyền tay: READY/3-2-1 = tên em to + số đếm (chưa hiện từ) · 6 ô hiện trên màn chiếu = tên em,
//     số thứ tự và TỪ thật to · dải dưới "NEXT: <em kế tiếp>" · đồng hồ tổng về 0 ⇒ đỏ nháy + LAST WORD.
// iPad chỉ VẼ (core/run-link.js): máy chiếu quyết mọi thứ, iPad báo danh để máy chiếu biết "đội A đã có iPad".
// Vào trang: pad.html (cổng iPad chung) tự chuyển sang đây khi máy chiếu mở Running word / team với nút iPad bật,
//   và trang này tự quay về pad.html khi máy chiếu mở game khác (giống source.html của Rocket Race).
// Bàn thử: ?padsig=local (kèm trang game ?padsig=local cùng trình duyệt) — không đăng nhập.
// =============================================================

import { onUser, signIn } from "./core/firebase.js";
import { watchIpadNow, savedTeam, saveTeam } from "./core/ipad-now.js";
import { joinRunSlot, watchRunLink, myDev, RUN_LOCAL } from "./core/run-link.js";

const runEl = document.getElementById("run");
const note = document.getElementById("note"), noteB = note.querySelector("b"), noteP = note.querySelector("p"), noteBtn = note.querySelector("button");
function showNote(title, text, { bad = false, button = false } = {}) {
  note.hidden = false; note.classList.toggle("is-bad", bad);
  noteB.textContent = title; noteP.textContent = text || ""; noteBtn.hidden = !button;
}
const esc = s => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const fmtClock = ms => { const t = Math.max(0, Math.ceil(ms / 1000)); return Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0"); };
const TEAMS = ["a", "b"];

// ---- `--u` = 1% bề ngang của CỘT. Cột giữ tỉ lệ dọc 3:4 (iPad xoay ngang thì cột hẹp lại ở giữa màn). ----
const col = document.createElement("div");
col.className = "col";
runEl.append(col);
function setUnit() {
  const w = Math.min(window.innerWidth, window.innerHeight * 0.78);
  col.style.width = w + "px";
  col.style.setProperty("--u", (w / 100).toFixed(3) + "px");
  fitAll();
}
window.addEventListener("resize", setUnit);

// Chữ không bao giờ tràn: đo một lần ở cỡ gốc rồi nhân --fit (cỡ chữ tỉ lệ thẳng với --fit).
function fitAll() {
  col.querySelectorAll("[data-fit]").forEach(w => {
    w.style.setProperty("--fit", "1");
    const box = w.parentElement, cs = getComputedStyle(box);
    const right = box.getBoundingClientRect().right - parseFloat(cs.paddingRight || 0);
    const r = w.getBoundingClientRect();
    const avail = right - r.left - 2;
    if (r.width > avail && avail > 0) w.style.setProperty("--fit", (avail / r.width).toFixed(3));
  });
}

// ---------------------------------------------------------------- trạng thái
let link = null;           // tài liệu run_link mới nhất
let linkAt = 0;            // performance.now() lúc nhận nó (đếm lùi tại chỗ từ đây — KHÔNG so đồng hồ hai máy)
let game = "";             // "runningword" | "runningteam" (theo ipad_now / run_link)
let view = "";             // "chooser" | "rw" | "rt" | "wait"
let slot = -1, seat = null, offLink = null;
let manualChoose = false;

function stopSeat() { if (seat) { seat.stop(); seat = null; } slot = -1; }
function ownedByOther(l, s) { const o = l && l.own ? String(l.own[String(s)] || "") : ""; return !!o && o !== myDev; }

// iPad chưa giữ chỗ nào vẫn phải nghe trận (màn chọn đội cần biết đội nào đã có iPad)
function listen() {
  if (offLink) return;
  offLink = watchRunLink(d => { link = d; linkAt = performance.now(); route(); }, e => {
    console.warn("AWord/run: read", e);
    showNote("Lost the link", "This iPad cannot read the game right now. Check the Wi-Fi.", { bad: true });
  });
}

function route() {
  note.hidden = true;
  const g = (link && link.game) || game;
  if (link && link.game) game = link.game;
  if (g === "runningteam") {
    if (slot !== 0) { stopSeat(); slot = 0; seat = joinRunSlot(0, d => { link = d; linkAt = performance.now(); route(); }); }
    if (link && ownedByOther(link, 0)) { showTaken("Another iPad is already showing Running team.", false); return; }
    drawRT();
    return;
  }
  if (g === "runningword") {
    const t = manualChoose ? null : savedTeam();
    if (t === null) { stopSeat(); drawChooser(); return; }
    if (slot !== t) { stopSeat(); slot = t; seat = joinRunSlot(t, d => { link = d; linkAt = performance.now(); route(); }); }
    if (link && ownedByOther(link, t)) { showTaken(`TEAM ${t ? "B" : "A"} already has an iPad.`, true); return; }
    drawRW(TEAMS[t]);
    return;
  }
  stopSeat();
  drawWait();
}

function showTaken(text, canChoose) {
  view = "taken";
  col.innerHTML = `<div class="rw-msg"><b>iPad not needed</b><span>${esc(text)}</span>${canChoose ? `<button class="pickother" style="margin-top:4vw;padding:2.4vw 6vw;border-radius:3vw;border:0;font-weight:800;font-size:4vw;cursor:pointer">Choose the other team</button>` : ""}</div>`;
  const b = col.querySelector(".pickother");
  if (b) b.onclick = () => { stopSeat(); manualChoose = true; route(); };
}

function drawWait() {
  view = "wait";
  col.innerHTML = `<div class="rw-msg"><b>RUNNING</b><span>Waiting for the game on the classroom screen…</span></div>`;
}

// ---------------------------------------------------------------- màn chọn đội (Running word)
function drawChooser() {
  const names = (link && link.names) || { a: "TEAM A", b: "TEAM B" };
  const busy = TEAMS.map((t, i) => ownedByOther(link, i));
  const sig = "chooser|" + names.a + names.b + busy.join();
  if (view === "chooser" && col.dataset.sig === sig) return;
  view = "chooser"; col.dataset.sig = sig;
  col.innerHTML = `<div class="pick"><h2>RUNNING WORD</h2><p>Which team holds this iPad?</p>
    ${TEAMS.map((t, i) => `<button data-t="${i}" class="${busy[i] ? "is-taken" : ""}" style="background:${i ? "#f59e0b" : "#3b82f6"}">${esc(names[t])}<small>${busy[i] ? "✓ ALREADY HAS AN iPAD" : "PART " + t.toUpperCase()}</small></button>`).join("")}
    <p class="msg"></p></div>`;
  col.querySelectorAll("button[data-t]").forEach(b => b.onclick = () => {
    const i = +b.dataset.t;
    if (busy[i]) { col.querySelector(".msg").textContent = `${names[TEAMS[i]]} already has an iPad. Choose the other team.`; return; }
    saveTeam(i); manualChoose = false; col.dataset.sig = ""; route();
  });
}

// ---------------------------------------------------------------- RUNNING WORD
function rwClock(t) {
  const l = link || {}, c = (l.clock && Number(l.clock[t])) || 0;
  if (l.ticking && l.turn === t) return Math.max(0, c - (performance.now() - linkAt));
  return c;
}
function drawRW(t) {
  const l = link || {};
  const i = TEAMS.indexOf(t);
  const names = l.names || {}, parts = l.parts || {};
  const list = (l.lists && Array.isArray(l.lists[t])) ? l.lists[t] : [];
  const idx = (l.idx && Number(l.idx[t])) || 0;
  const total = (l.total && Number(l.total[t])) || list.length;
  const phase = l.phase || "setup";
  const waiting = (phase === "play" || phase === "prep") && !!l.turn && l.turn !== t;
  const other = TEAMS[1 - i];

  let body;
  if (phase === "setup" || phase === "off" || !list.length) {
    body = `<div class="rw-msg"><b>GET READY</b><span>Waiting for START MATCH on the classroom screen…</span></div>`;
  } else if (phase === "over") {
    body = `<div class="rw-msg"><b>MATCH OVER</b><span>Look at the classroom screen.</span></div>`;
  } else if (idx >= list.length) {
    body = `<div class="rw-msg"><b>ALL DONE!</b><span>Your team finished its list.</span></div>`;
  } else {
    let rows = "";
    for (let k = 0; k < 5; k++) {
      const w = list[idx + k]; if (w == null) break;
      rows += `<div class="rw-word ${k === 0 ? "is-cur" : "n" + k}"><span class="no">${idx + k + 1}</span><span class="w" data-fit>${esc(String(w).toUpperCase())}</span></div>`;
    }
    body = `<div class="rw-list">${rows}</div>`;
  }
  const sig = JSON.stringify([t, phase, waiting, l.paused, idx, list[idx], list.length, names[t], parts[t], names[other]]);
  if (view === "rw" && col.dataset.sig === sig) { paintRWClock(t); return; }
  view = "rw"; col.dataset.sig = sig;
  col.className = "col rw is-" + t + (waiting ? " is-waiting" : "") + (l.paused && phase === "play" ? " is-paused" : "");
  col.innerHTML = `<button class="back" title="Choose team">‹</button>
    <div class="rw-top"><div class="rw-team">${esc(names[t] || "TEAM " + t.toUpperCase())}<small>${esc(parts[t] || "PART " + t.toUpperCase())}</small></div><div class="rw-clock">${fmtClock(rwClock(t))}</div></div>
    ${body}
    <div class="rw-foot"><span>${list.length && idx < total ? `word ${idx + 1} / ${total}` : ""}</span><span>${list.length ? Math.max(0, total - idx) + " left" : ""}</span></div>
    <div class="wait-badge"><b>WAITING</b><span>${esc(names[other] || "")} is playing</span></div>
    <div class="paused">PAUSED</div>`;
  col.querySelector(".back").onclick = () => { stopSeat(); manualChoose = true; col.dataset.sig = ""; route(); };
  fitAll();
}
function paintRWClock(t) { const c = col.querySelector(".rw-clock"); if (c) c.textContent = fmtClock(rwClock(t)); }

// ---------------------------------------------------------------- RUNNING TEAM
function rtMain() {
  const l = link || {}, m = Number(l.mainLeft) || 0;
  return l.ticking ? Math.max(0, m - (performance.now() - linkAt)) : m;
}
function heartsHtml(l) {
  if (l.livesTotal == null) return "∞";
  const tot = Number(l.livesTotal) || 0, left = Number(l.lives) || 0;
  if (tot > 5) return `♥ ×${left}`;
  let h = ""; for (let k = 0; k < tot; k++) h += `<span style="opacity:${k < left ? 1 : .25}">♥</span>`; return h;
}
let rtCountT = 0;
function drawRT() {
  const l = link || {};
  const phase = l.phase || "setup";
  // READY → 3 → 2 → 1 đếm TẠI CHỖ từ lúc nhận (máy chiếu không ghi từng nhịp đếm)
  let count = "";
  if (phase === "ready") {
    const el = performance.now() - linkAt, hold = Number(l.readyMs) || 1300, step = Number(l.stepMs) || 1000;
    count = el < hold ? "READY" : String(Math.max(1, 3 - Math.floor((el - hold) / step)));
  }
  const sig = JSON.stringify([phase, l.q, count, l.name, l.next, l.num, l.word, l.result, l.last, l.lives, l.livesTotal]);
  if (view === "rt" && col.dataset.sig === sig) { paintRTClock(); return; }
  view = "rt"; col.dataset.sig = sig;
  col.className = "col rt" + (l.last ? " is-last" : "");
  let mid, foot = "";
  if (phase === "ready") {
    mid = `<div class="rt-sub">GET READY</div><div class="rt-name" data-fit>${esc(l.name || "")}</div><div class="rt-count${count === "READY" ? " is-word" : ""}">${count}</div>`;
    foot = l.next ? `<div class="rt-next">NEXT: <b>${esc(l.next)}</b></div>` : "";
  } else if (phase === "question") {
    const cls = l.result === "ok" ? " is-ok" : l.result === "miss" ? " is-miss" : "";
    mid = `<div class="rt-small-name" data-fit>${esc(l.name || "")}</div><div class="rt-card${cls}"><div class="num">№ ${esc(l.num || "")}</div><div class="w" data-fit>${esc(String(l.word || "").toUpperCase())}</div></div><div class="rt-sub">READ IT OUT LOUD</div>`;
    foot = l.next ? `<div class="rt-next">Then pass the iPad to <b>${esc(l.next)}</b> ➜</div>` : "";
  } else if (phase === "over") {
    mid = `<div class="rt-name">${l.won ? "CLASS WINS" : "GAME OVER"}</div><div class="rt-sub">Look at the classroom screen</div>`;
  } else {
    mid = `<div class="rt-name">RUNNING TEAM</div><div class="rt-sub">Waiting for START RUNNING…</div>`;
  }
  col.innerHTML = `<div class="rt-top"><span class="rt-clock${l.last ? " is-last" : ""}">${fmtClock(rtMain())}</span><span class="lastword">LAST WORD</span><span class="rt-hearts">${heartsHtml(l)}</span></div>
    <div class="rt-mid">${mid}</div>${foot}`;
  fitAll();
}
function paintRTClock() { const c = col.querySelector(".rt-clock"); if (c && !(link && link.last)) c.textContent = fmtClock(rtMain()); }

// nhịp vẽ: đồng hồ đếm tại chỗ + bước đếm READY/3-2-1
setInterval(() => {
  if (view === "rw" && slot >= 0) paintRWClock(TEAMS[slot]);
  else if (view === "rt") drawRT();
}, 200);

// ---------------------------------------------------------------- giữ iPad sáng
let lock = null;
async function keepAwake() {
  if (lock || !("wakeLock" in navigator) || document.visibilityState !== "visible") return;
  try { lock = await navigator.wakeLock.request("screen"); lock.addEventListener("release", () => { lock = null; }); } catch (e) { /* */ }
}
document.addEventListener("visibilitychange", keepAwake);

// ---------------------------------------------------------------- đi theo máy chiếu
// Máy chiếu mở game khác ⇒ về pad.html (cổng chung). Chỉ rời khi trang này ĐÃ thấy một Running (mở tay thì đứng yên).
let unwatchNow = null, leaveT = 0, sawRun = false;
function follow() {
  if (unwatchNow) return;
  unwatchNow = watchIpadNow(s => {
    clearTimeout(leaveT);
    if (!s) return;
    if (s.game === "runningword" || s.game === "runningteam") { sawRun = true; if (s.game !== game) { game = s.game; route(); } return; }
    if (s.game === "" && !sawRun) return;
    leaveT = setTimeout(() => { stopSeat(); location.replace("pad.html" + location.search); }, s.game ? 1500 : 2500);
  }, () => { /* đọc hỏng — ở lại, ghi chú của trang tự nói */ });
}

noteBtn.addEventListener("click", async () => {
  noteBtn.disabled = true;
  try { await signIn(); } catch (e) { showNote("Could not sign in", e?.message || "Please try again.", { bad: true, button: true }); }
  finally { noteBtn.disabled = false; }
});

function begin() { setUnit(); keepAwake(); drawWait(); listen(); follow(); }
if (RUN_LOCAL) begin();
else onUser(user => {
  if (user) { begin(); return; }
  stopSeat();
  showNote("Sign in to use this iPad", "Use the same Google account as the classroom computer.", { button: true });
}).catch(() => showNote("Cannot reach Google", "This iPad is offline, or the sign-in service is blocked here.", { bad: true }));
window.__run = { get link() { return link; }, get view() { return view; }, myDev };   // bàn thử
