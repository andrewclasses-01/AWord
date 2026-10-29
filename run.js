// =============================================================
// run.js — MÀN iPAD CỦA RUNNING WORD / RUNNING TEAM (Đợt 575, thầy 23/10/2026).
//
// Mẫu thầy duyệt: D:\OTHERS\CLAUDE\AWord - thiet ke Running setup iPad\mau-1.html (tab ③ ④).
//   RUNNING WORD — mỗi đội một iPad, cầm ở người GIẢI THÍCH (quay lưng với người gõ): dải màu đội + đồng hồ của đội,
//     TỪ ĐANG CHƠI to trong ô trắng viền màu đội, 4 từ kế nhỏ + mờ dần; từ đã xong không hiện. Không phải lượt mình ⇒
//     màn tối + ô WAITING (vẫn thấy từ sắp tới để chuẩn bị).
//   RUNNING TEAM — MỘT iPad chuyền tay: READY/3-2-1 = tên em to + số đếm (chưa hiện từ) · 6 ô hiện trên màn chiếu = tên em,
//     số thứ tự và TỪ thật to · dải dưới "NEXT: <em kế tiếp>" · đồng hồ tổng về 0 ⇒ đỏ nháy + LAST WORD.
// ⭐ Đợt 576 (thầy: "tôi luôn sử dụng ipad nằm ngang") — mọi màn vẽ lại cho iPad NẰM NGANG (khung 4:3; cầm dọc thì khung ngang
//   thu nhỏ giữa màn), mẫu D:\OTHERS\CLAUDE\AWord - thiet ke Running setup iPad\mau-3-ipad-ngang.html:
//   RW đang chơi = từ đang chơi to bên TRÁI (60%), 4 từ kế bên PHẢI · đầu là thẻ BO TRÒN (‹, tên đội, viên PART, viên đồng hồ) ·
//   đội chờ: từ sắp đến vẫn SÁNG (nền trắng xám, viền màu đội, nhãn NEXT UP), viên "TEAM A is playing" trên đầu ·
//   HẾT TRẬN = ÔN TỪ: lưới 4 cột chữ đậm (xanh lá đúng · vàng PASS · trắng chưa chơi · viền vàng = từ làm dở), chạm ⇒ thẻ to + IPA.
//   RT: READY = tên to trái + số đếm phải · câu hỏi = tên + "pass the iPad to" trái, thẻ TỪ phải.
// ⭐ Đợt 594 (thầy 29/10/2026) — thêm iPad GIÁO VIÊN: "quan sát lớp đang đến từ gì và ai đang làm … có định nghĩa Anh, Việt".
//   Mở iPad ⇒ MÀN CHỌN THIẾT BỊ (mẫu B thầy chọn, D:\OTHERS\CLAUDE\AWord - thiet ke Running iPad Giao vien\mau-1.html):
//   RT = thẻ STUDENTS to + dải TEACHER dưới · RW = TEAM A | TEAM B to + dải TEACHER dưới. Vai trò nhớ theo máy (ROLE_KEY).
//   GV RT = em đang đọc + từ (thấy trước từ lúc READY) + IPA + EN/VI/EX, bên phải 3 em kế + từ vừa chơi; hết trận = lưới từ đã chơi.
//   GV RW = HAI NỬA song song (đội đang chơi sáng, đội chờ dịu): đồng hồ, tiến độ, từ đang chơi + nghĩa, 4 từ kế; hết trận = lưới ôn.
//   iPad GV chỉ XEM: báo danh vào chỗ "t" (không ai giữ chỗ, máy chiếu chỉ vẽ chấm tím, không chặn START).
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

// ---- `--u` = 1% bề ngang KHUNG. Khung luôn NGANG 4:3 (Đợt 576); iPad cầm dọc thì khung nằm giữa màn. ----
const col = document.createElement("div");
col.className = "col";
runEl.append(col);
function setUnit() {
  const w = Math.min(window.innerWidth, window.innerHeight * 4 / 3);
  col.style.width = w + "px";
  col.style.height = (w * 3 / 4) + "px";
  col.style.setProperty("--u", (w / 100).toFixed(3) + "px");
  fitAll();
}
window.addEventListener("resize", setUnit);

// Chữ to nhất mà vẫn vừa hộp: đo ở cỡ gốc rồi nhân --f (cỡ chữ tỉ lệ thẳng với --f).
// ⛔ Hộp CĂN GIỮA (cột flex / khối): chữ tràn ra CẢ HAI bên ⇒ đo theo bề rộng ruột hộp, không theo mép trái của chữ
//    (cùng lời nói dối của scrollWidth trong hộp căn giữa — bẫy Đợt 222 / 371).
function fitAll(root = col) {
  root.querySelectorAll(".fit").forEach(t => {
    t.style.setProperty("--f", "1");
    const box = t.parentElement, cs = getComputedStyle(box);
    const r = t.getBoundingClientRect();
    if (!r.width) return;
    const padL = parseFloat(cs.paddingLeft) || 0, padR = parseFloat(cs.paddingRight) || 0;
    const centred = cs.flexDirection === "column" || cs.display === "block";
    const avail = centred ? box.clientWidth - padL - padR - 1 : box.getBoundingClientRect().right - padR - r.left - 1;
    if (r.width > avail && avail > 0) t.style.setProperty("--f", (avail / r.width).toFixed(3));
  });
}
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => fitAll());

// ---------------------------------------------------------------- trạng thái
let link = null;           // tài liệu run_link mới nhất
let linkAt = 0;            // performance.now() lúc nhận nó (đếm lùi tại chỗ từ đây — KHÔNG so đồng hồ hai máy)
let game = "";             // "runningword" | "runningteam" (theo ipad_now / run_link)
let view = "";             // "chooser" | "rw" | "rt" | "wait"
let slot = -1, seat = null, offLink = null;
let manualChoose = false;

// Đợt 594 — vai trò của iPad này: "teacher" | "student" (null = chưa chọn ⇒ màn chọn). Bàn thử ?padsig=local: mỗi tab một vai.
const ROLE_KEY = "aw.runRole";
const roleStore = () => (RUN_LOCAL ? sessionStorage : localStorage);
function savedRole() { try { const v = roleStore().getItem(ROLE_KEY); return v === "teacher" || v === "student" ? v : null; } catch (e) { return null; } }
function saveRole(r) { try { roleStore().setItem(ROLE_KEY, r); } catch (e) { /* chế độ riêng tư */ } }

function stopSeat() { if (seat) { seat.stop(); seat = null; } slot = -1; }
// giữ chỗ s (0 | 1 | "t" = giáo viên); đổi chỗ thì trả chỗ cũ trước
function joinAs(s) {
  if (slot === s) return;
  stopSeat(); slot = s;
  seat = joinRunSlot(s, d => { link = d; linkAt = performance.now(); route(); });
}
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
    const role = manualChoose ? null : savedRole();
    if (!role) { stopSeat(); drawPickRT(); return; }
    if (role === "teacher") { joinAs("t"); drawRTT(); return; }
    joinAs(0);
    if (link && ownedByOther(link, 0)) { showTaken("Another iPad is already the STUDENTS iPad.", true); return; }
    drawRT();
    return;
  }
  if (g === "runningword") {
    // iPad đội từ trước Đợt 594 (đã nhớ đội, chưa có vai) ⇒ vẫn là iPad đội, không bắt chọn lại
    let role = manualChoose ? null : savedRole();
    const t = manualChoose ? null : savedTeam();
    if (!role && t !== null) role = "student";
    if (!role || (role === "student" && t === null)) { stopSeat(); drawPickRW(); return; }
    if (role === "teacher") { joinAs("t"); drawRWT(); return; }
    joinAs(t);
    if (link && ownedByOther(link, t)) { showTaken(`TEAM ${t ? "B" : "A"} already has an iPad.`, true); return; }
    drawRW(TEAMS[t]);
    return;
  }
  stopSeat();
  drawWait();
}

function showTaken(text, canChoose) {
  view = "taken"; col.dataset.sig = ""; col.className = "col";
  col.innerHTML = `<div class="msg"><b>iPad not needed</b><span>${esc(text)}</span>${canChoose ? `<button class="pickother">Choose again</button>` : ""}</div>`;
  const b = col.querySelector(".pickother");
  if (b) b.onclick = () => { stopSeat(); manualChoose = true; route(); };
}

function drawWait() {
  view = "wait"; col.dataset.sig = ""; col.className = "col";
  col.innerHTML = `<div class="msg"><b>RUNNING</b><span>Waiting for the game on the classroom screen…</span></div>`;
}

// ---------------------------------------------------------------- MÀN CHỌN THIẾT BỊ (Đợt 594, mẫu B)
const IC_EYE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>`;
const IC_CLASS = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="7" r="3.2"/><circle cx="17" cy="8.5" r="2.5"/><path d="M3 20c0-3.6 2.7-6 6-6s6 2.4 6 6"/><path d="M15.5 14.2c2.9-.4 5.5 1.6 5.5 5"/></svg>`;
const teacherCard = d => `<button class="card te slim" data-role="teacher"><div class="i">${IC_EYE}</div><div><div class="n">TEACHER</div><div class="d">${d}</div></div></button>`;

function wirePick(busyText) {
  col.querySelectorAll("button[data-role]").forEach(b => b.onclick = () => {
    if (b.classList.contains("taken")) { col.querySelector(".warn").textContent = busyText(b); return; }
    if (b.dataset.role === "teacher") saveRole("teacher");
    else { saveRole("student"); if (b.dataset.t != null) saveTeam(+b.dataset.t); }
    manualChoose = false; col.dataset.sig = ""; route();
  });
}

function drawPickRT() {
  const busy = ownedByOther(link, 0);
  const sig = "pickrt|" + busy;
  if (view === "pickrt" && col.dataset.sig === sig) return;
  view = "pickrt"; col.dataset.sig = sig; col.className = "col";
  col.innerHTML = `<div class="pk"><div class="pk-h"><div class="g">RUNNING TEAM</div><b>Who is this iPad for?</b></div>
    <button class="card st${busy ? " taken" : ""}" data-role="student" style="flex:1.7">${busy ? `<span class="chip">✓ HAS AN iPAD</span>` : ""}
      <div class="i">${IC_CLASS}</div><div class="n">STUDENTS</div><div class="d">Pass it around the class — shows the word to read out.</div></button>
    ${teacherCard("Watch the game · meanings EN + VI · who is reading")}
    <p class="warn"></p></div>`;
  wirePick(() => "Another iPad is already the STUDENTS iPad. Choose TEACHER.");
}

function drawPickRW() {
  const names = (link && link.names) || { a: "TEAM A", b: "TEAM B" };
  const parts = (link && link.parts) || {};
  const busy = TEAMS.map((t, i) => ownedByOther(link, i));
  const sig = "pickrw|" + names.a + names.b + busy.join();
  if (view === "pickrw" && col.dataset.sig === sig) return;
  view = "pickrw"; col.dataset.sig = sig; col.className = "col";
  col.innerHTML = `<div class="pk"><div class="pk-h"><div class="g">RUNNING WORD</div><b>Who is this iPad for?</b></div>
    <div class="pk-row">${TEAMS.map((t, i) => `<button class="card t${t}${busy[i] ? " taken" : ""}" data-role="student" data-t="${i}">${busy[i] ? `<span class="chip">✓ HAS AN iPAD</span>` : ""}<div class="n">${esc(names[t])}</div><div class="d">${esc(parts[t] || "PART " + t.toUpperCase())} · explainer</div></button>`).join("")}</div>
    ${teacherCard("Watch both teams side by side · meanings EN + VI")}
    <p class="warn"></p></div>`;
  wirePick(b => `${names[TEAMS[+b.dataset.t]]} already has an iPad. Choose the other team.`);
}

// ---------------------------------------------------------------- RUNNING WORD
function rwClock(t) {
  const l = link || {}, c = (l.clock && Number(l.clock[t])) || 0;
  if (l.ticking && l.turn === t) return Math.max(0, c - (performance.now() - linkAt));
  return c;
}
const fitSpan = (txt, cls = "t") => `<span class="${cls} fit">${esc(txt)}</span>`;
function drawRW(t) {
  const l = link || {};
  const i = TEAMS.indexOf(t);
  const names = l.names || {}, parts = l.parts || {};
  const list = (l.lists && Array.isArray(l.lists[t])) ? l.lists[t] : [];
  const ipa = (l.ipa && Array.isArray(l.ipa[t])) ? l.ipa[t] : [];
  const rowStr = (l.rows && typeof l.rows[t] === "string") ? l.rows[t] : "";
  const idx = (l.idx && Number(l.idx[t])) || 0;
  const total = (l.total && Number(l.total[t])) || list.length;
  const phase = l.phase || "setup";
  const other = TEAMS[1 - i];
  const waiting = (phase === "play" || phase === "prep") && !!l.turn && l.turn !== t;
  const paused = phase === "play" && !!l.paused;
  const over = phase === "over" && list.length > 0;

  const sig = JSON.stringify([t, phase, waiting, paused, idx, list.length, list[idx], rowStr, names[t], parts[t], names[other]]);
  if (view === "rw" && col.dataset.sig === sig) { paintRWClock(t); return; }
  view = "rw"; col.dataset.sig = sig;
  col.className = "col rw is-" + t + (waiting ? " is-waiting" : "");

  const teamName = esc(names[t] || "TEAM " + t.toUpperCase()), partName = esc(parts[t] || "PART " + t.toUpperCase());
  const head = (mid, right, back = true) => `<div class="top">${back ? '<button class="back" title="Choose team">‹</button>' : ""}<span class="team">${teamName}</span><span class="part">${partName}</span><span class="sp"></span>${mid}${right}</div>`;

  if (over) {
    // ⭐ Đợt 576 — ÔN TỪ sau trận: cả danh sách của đội, chạm từ nào phóng to từ đó
    const okN = [...rowStr].filter(c => c === "o").length;
    const cells = list.map((w, k) => {
      const c = rowStr[k];
      const cls = c === "o" ? " ok" : c === "p" ? " pass" : "";
      const cut = k === idx && c !== "o" && c !== "p" && idx < list.length ? " cut" : "";
      return `<button class="rv${cls}${cut}" data-k="${k}"><span class="no">${k + 1}</span>${fitSpan(String(w).toUpperCase())}</button>`;
    }).join("");
    col.innerHTML = head(`<span class="prog">time left ${fmtClock(rwClock(t))}</span>`, `<span class="score">✓ ${okN} / ${total}</span>`, false) +
      `<div class="legend"><span><i style="background:#22c55e"></i>correct</span><span><i style="background:#fde68a"></i>passed</span><span><i style="background:#fff"></i>not played</span><span style="opacity:.75">· tap a word to see it big</span></div>` +
      `<div class="grid">${cells}</div>` +
      `<div class="zoom"><div class="zcard"><div class="zn"></div><span class="zw fit"></span><div class="zi"></div><span class="zs"></span><div class="zx">tap anywhere to close</div></div></div>`;
    const zoom = col.querySelector(".zoom");
    col.querySelectorAll(".rv").forEach(b => b.onclick = () => {
      const k = +b.dataset.k, c = rowStr[k];
      zoom.querySelector(".zn").textContent = "№ " + (k + 1);
      zoom.querySelector(".zw").textContent = String(list[k]).toUpperCase();
      zoom.querySelector(".zi").textContent = ipa[k] || "";
      const lab = c === "o" ? ["CORRECT", "#22c55e"] : c === "p" ? ["PASSED", "#f59e0b"] : ["NOT PLAYED", "#94a3b8"];
      zoom.querySelector(".zs").textContent = lab[0];
      zoom.querySelector(".zcard").style.setProperty("--zc", lab[1]);
      zoom.classList.add("on");
      fitAll(zoom);
    });
    zoom.onclick = () => zoom.classList.remove("on");
    fitAll();
    return;
  }

  let mid = list.length && idx < total ? `<span class="prog">word ${idx + 1} / ${total}</span>` : "";
  if (waiting) mid = `<span class="waitpill">⏳ <b>${esc(names[other] || "")}</b> is playing</span>`;
  if (paused) mid = `<span class="pausepill">PAUSED</span>`;
  let body;
  if (phase === "setup" || phase === "off" || !list.length) {
    body = `<div class="msg"><b>GET READY</b><span>Waiting for START MATCH on the classroom screen…</span></div>`;
  } else if (phase === "over") {
    body = `<div class="msg"><b>MATCH OVER</b><span>Look at the classroom screen.</span></div>`;
  } else if (idx >= list.length) {
    body = `<div class="msg"><b>ALL DONE!</b><span>Your team finished its list.</span></div>`;
  } else {
    let nx = "";
    for (let k = 1; k <= 4; k++) {
      const w = list[idx + k];
      nx += w == null ? `<div class="nx is-empty"></div>` : `<div class="nx n${k}"><span class="no">${idx + k + 1}</span>${fitSpan(String(w).toUpperCase())}</div>`;
    }
    body = `<div class="body"><div class="cur"><div class="no">№ ${idx + 1}</div>${fitSpan(String(list[idx]).toUpperCase())}</div><div class="nexts"><div class="lab">NEXT</div>${nx}</div></div>`;
  }
  col.innerHTML = head(mid, `<span class="clock">${fmtClock(rwClock(t))}</span>`) + body;
  col.querySelector(".back").onclick = backToPick;
  fitAll();
}
function paintRWClock(t) {
  const c = col.querySelector(".clock"); if (c) c.textContent = fmtClock(rwClock(t));
}

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
  const top = `<div class="rt-top"><button class="back" title="Choose again">‹</button><span class="rt-clock${l.last ? " is-last" : ""}">${fmtClock(rtMain())}</span><span class="last-tag">LAST WORD</span><span class="sp"></span><span class="hearts">${heartsHtml(l)}</span></div>`;
  let body;
  if (phase === "ready") {
    body = `<div class="rt-ready"><div class="rt-left"><div class="rt-k">GET READY</div><div class="rt-nm">${fitSpan(l.name || "", "x")}</div>${l.next ? `<div class="rt-nx">next: <b>${esc(l.next)}</b></div>` : ""}</div><div class="rt-cnt${count === "READY" ? " is-word" : ""}">${count}</div></div>`;
  } else if (phase === "question") {
    const cls = l.result === "ok" ? " is-ok" : l.result === "miss" ? " is-miss" : "";
    body = `<div class="rt-body"><div class="rt-left"><div class="rt-k">NOW READING</div><div class="rt-nm">${fitSpan(l.name || "", "x")}</div>${l.next ? `<div class="rt-pass">then pass the iPad to<b>${esc(l.next)} ➜</b></div>` : ""}</div>
      <div class="rt-card${cls}"><div class="num">№ ${esc(l.num || "")}</div>${fitSpan(String(l.word || "").toUpperCase(), "w")}<div class="say">READ IT OUT LOUD</div></div></div>`;
  } else if (phase === "over") {
    body = `<div class="msg"><b>${l.won ? "CLASS WINS" : "GAME OVER"}</b><span>Look at the classroom screen.</span></div>`;
  } else {
    body = `<div class="msg"><b>RUNNING TEAM</b><span>Waiting for START RUNNING…</span></div>`;
  }
  col.innerHTML = top + body;
  col.querySelector(".back").onclick = backToPick;
  fitAll();
}
function backToPick() { stopSeat(); manualChoose = true; col.dataset.sig = ""; route(); }
function paintRTClock() { const c = col.querySelector(".rt-clock"); if (c && !(link && link.last)) c.textContent = fmtClock(rtMain()); }

// ---------------------------------------------------------------- Đợt 594 — MÀN GIÁO VIÊN
function defsHtml(d, ipa) {
  d = d || {};
  let h = ipa ? `<div class="ipa">${esc(ipa)}</div>` : "";
  if (d.en) h += `<div class="def en"><span class="l">EN</span><span class="x">${esc(d.en)}</span></div>`;
  if (d.vi) h += `<div class="def vi"><span class="l">VI</span><span class="x">${esc(d.vi)}</span></div>`;
  if (d.ex) h += `<div class="def ex"><span class="l">EX</span><span class="x">${esc(d.ex)}</span></div>`;
  if (!d.en && !d.vi && !d.ex) h += `<div class="nodef">No meaning saved for this word.</div>`;
  return h;
}
const tbar = (title, right) => `<div class="tbar"><button class="back" title="Choose again">‹</button><span class="who">TEACHER</span><span class="tt">${title}</span><span class="sp"></span>${right}</div>`;

// ---- GV RUNNING TEAM: em đang đọc + từ + nghĩa (trái) · 3 em kế + từ vừa chơi (phải)
function drawRTT() {
  const l = link || {};
  const phase = l.phase || "setup";
  let count = "";
  if (phase === "ready") {
    const el = performance.now() - linkAt, hold = Number(l.readyMs) || 1300, step = Number(l.stepMs) || 1000;
    count = el < hold ? "" : String(Math.max(1, 3 - Math.floor((el - hold) / step)));
  }
  const hist = Array.isArray(l.hist) ? l.hist : [];
  const nexts = Array.isArray(l.nexts) ? l.nexts.filter(Boolean) : [];
  const d = l.def || {};
  const sig = JSON.stringify(["rtt", phase, l.q, count, l.name, l.word, l.num, l.result, l.last, l.lives, l.livesTotal, l.okN, l.missN, l.done, l.total, nexts, hist.length, l.cls, d.en, d.vi, l.won]);
  if (view === "rtt" && col.dataset.sig === sig) { paintRTTClock(); return; }
  view = "rtt"; col.dataset.sig = sig;
  col.className = "col tv" + (l.last ? " is-last" : "");
  const right = `<span class="pill ok">✓ ${Number(l.okN) || 0}</span><span class="pill miss">✗ ${Number(l.missN) || 0}</span>` +
    `<span class="hearts">${heartsHtml(l)}</span><span class="pill">${Number(l.done) || 0} / ${Number(l.total) || 0}</span>` +
    `<span class="last-tag">LAST WORD</span><span class="pill clock">${fmtClock(rtMain())}</span>`;
  const head = tbar("RUNNING TEAM" + (l.cls ? " · " + esc(l.cls) : ""), phase === "setup" || phase === "off" ? "" : right);
  let body;
  if (phase === "ready" || phase === "question") {
    const ring = phase === "ready" ? " is-ready" : l.result === "ok" ? " is-ok" : l.result === "miss" ? " is-miss" : "";
    const k = phase === "ready" ? "GET READY" + (count ? " · " + count : "") : "NOW READING";
    const res = phase === "question" && l.result ? `<div class="res">${l.result === "ok" ? "✓ CORRECT" : "✗ MISSED"}</div>` : "";
    const word = String(l.word || "").toUpperCase();
    const recent = hist.slice(-5).reverse().map(h => `<div class="hi ${h.r === "o" ? "o" : "x"}"><span class="r">${h.r === "o" ? "✓" : "✗"}</span><span class="wd">${esc(h.w)}</span><span class="nm">${esc(h.n)}</span></div>`).join("");
    body = `<div class="rtg"><div class="now${ring}">
        <div class="who2"><span class="k">${k}</span><b>${esc(l.name || "")}</b>${l.num ? `<span class="num">№ ${esc(l.num)} on the sheet</span>` : ""}</div>
        ${word ? `<span class="w fit">${esc(word)}</span>` : ""}${defsHtml(d, d.ipa)}${res}</div>
      <div class="side"><div class="box"><div class="h">NEXT UP</div>${nexts.length ? nexts.map((n, i) => `<div class="q n${i + 1}"><span class="o">${i + 1}</span>${esc(n)}</div>`).join("") : `<div class="q">—</div>`}</div>
        <div class="box" style="flex:1"><div class="h">JUST PLAYED</div>${recent || `<div class="hi"><span class="nm" style="margin:0">nothing yet</span></div>`}</div></div></div>`;
  } else if (phase === "over") {
    const cells = hist.map(h => `<div class="hv ${h.r === "o" ? "o" : "x"}"><b>${h.r === "o" ? "✓" : "✗"} ${esc(h.w)}</b><small>${esc(h.vi || "")}${h.vi && h.n ? " · " : ""}${esc(h.n || "")}</small></div>`).join("");
    body = `<div class="tsum"><b>${l.won ? "CLASS WINS" : "GAME OVER"}</b><span class="pill ok">✓ ${Number(l.okN) || 0}</span><span class="pill miss">✗ ${Number(l.missN) || 0}</span></div><div class="tgrid">${cells}</div>`;
  } else {
    body = `<div class="tmsg"><b>RUNNING TEAM</b><span>Waiting for START RUNNING on the classroom screen…</span></div>`;
  }
  col.innerHTML = head + body;
  col.querySelector(".back").onclick = backToPick;
  fitAll();
}
function paintRTTClock() { const c = col.querySelector(".tbar .clock"); if (c && !(link && link.last)) c.textContent = fmtClock(rtMain()); }

// ---- GV RUNNING WORD: hai nửa song song
function drawRWT() {
  const l = link || {};
  const phase = l.phase || "setup";
  const names = l.names || {};
  const lists = l.lists || {};
  const has = TEAMS.some(t => Array.isArray(lists[t]) && lists[t].length);
  const playing = phase === "play" || phase === "prep";
  const sig = JSON.stringify(["rwt", phase, l.turn, !!l.paused, l.idx, l.rows, l.total, names, l.parts, TEAMS.map(t => (lists[t] || []).length + ":" + (lists[t] || [])[0]), !!l.defs]);
  if (view === "rwt" && col.dataset.sig === sig) { paintRWTClocks(); return; }
  view = "rwt"; col.dataset.sig = sig;
  col.className = "col tv";
  let pill = "";
  if (phase === "over") pill = `<span class="pill">MATCH OVER</span>`;
  else if (playing && l.paused) pill = `<span class="pill pause">PAUSED</span>`;
  else if (playing && l.turn) pill = `<span class="pill">${esc(names[l.turn] || "")} is playing</span>`;
  const head = tbar("RUNNING WORD", pill);
  if (!has || phase === "setup" || phase === "off") {
    col.innerHTML = head + `<div class="tmsg"><b>GET READY</b><span>Waiting for START MATCH on the classroom screen…</span></div>`;
    col.querySelector(".back").onclick = backToPick;
    return;
  }
  col.innerHTML = head + `<div class="halves">${TEAMS.map(t => rwHalf(l, t, phase, playing)).join("")}</div>` +
    `<div class="zoom"><div class="zcard"><div class="zn"></div><span class="zw fit"></span><div class="zi"></div><div class="zd"></div><span class="zs"></span><div class="zx">tap anywhere to close</div></div></div>`;
  col.querySelector(".back").onclick = backToPick;
  if (phase === "over") {
    const zoom = col.querySelector(".zoom");
    col.querySelectorAll(".hgrid .rv").forEach(b => b.onclick = () => {
      const t = b.dataset.t, k = +b.dataset.k, c = String((l.rows || {})[t] || "")[k];
      const list = lists[t] || [], ipa = (l.ipa && l.ipa[t]) || [], defs = (l.defs && l.defs[t]) || [];
      zoom.querySelector(".zn").textContent = (names[t] || "") + " · № " + (k + 1);
      zoom.querySelector(".zw").textContent = String(list[k]).toUpperCase();
      zoom.querySelector(".zi").textContent = ipa[k] || "";
      zoom.querySelector(".zd").innerHTML = defsHtml(defs[k], "");
      const lab = c === "o" ? ["CORRECT", "#22c55e"] : c === "p" ? ["PASSED", "#f59e0b"] : ["NOT PLAYED", "#94a3b8"];
      zoom.querySelector(".zs").textContent = lab[0];
      zoom.querySelector(".zcard").style.setProperty("--zc", lab[1]);
      zoom.classList.add("on");
      fitAll(zoom);
    });
    zoom.onclick = () => zoom.classList.remove("on");
  }
  fitAll();
}
function rwHalf(l, t, phase, playing) {
  const names = l.names || {}, parts = l.parts || {};
  const list = (l.lists && Array.isArray(l.lists[t])) ? l.lists[t] : [];
  const ipa = (l.ipa && Array.isArray(l.ipa[t])) ? l.ipa[t] : [];
  const defs = (l.defs && Array.isArray(l.defs[t])) ? l.defs[t] : [];
  const rowStr = (l.rows && typeof l.rows[t] === "string") ? l.rows[t] : "";
  const idx = (l.idx && Number(l.idx[t])) || 0;
  const total = list.length || 1;
  const okN = [...rowStr].filter(c => c === "o").length, passN = [...rowStr].filter(c => c === "p").length;
  const on = playing && l.turn === t, off = playing && !!l.turn && l.turn !== t;
  const cls = "hf is-" + t + (on ? " on" + (l.paused ? " paused" : "") : "") + (off ? " off" : "");
  const okPct = (okN / total * 100).toFixed(1), passPct = (passN / total * 100).toFixed(1);
  const head = `<div class="hh"><span class="tn">${esc(names[t] || "TEAM " + t.toUpperCase())}</span><span class="pt">${esc(parts[t] || "PART " + t.toUpperCase())}</span><span class="sp"></span><span class="ck" data-t="${t}">${fmtClock(rwClock(t))}</span></div>` +
    `<div class="bar"><i style="width:${okPct}%"></i><s style="left:${okPct}%;width:${passPct}%"></s></div>` +
    `<div class="meta"><span class="g">✓ ${okN}</span><span class="p">PASS ${passN}</span><span class="sp"></span><span>${phase === "over" ? `${okN} / ${list.length}` : idx < list.length ? `word ${idx + 1} / ${list.length}` : "all done"}</span></div>`;
  if (phase === "over") {
    const cells = list.map((w, k) => {
      const c = rowStr[k];
      const cut = k === idx && c !== "o" && c !== "p" && idx < list.length ? " cut" : "";
      return `<button class="rv${c === "o" ? " ok" : c === "p" ? " pass" : ""}${cut}" data-t="${t}" data-k="${k}"><b>${esc(String(w).toUpperCase())}</b><small>${esc((defs[k] && defs[k].vi) || "")}</small></button>`;
    }).join("");
    return `<div class="${cls}">${head}<div class="hgrid">${cells}</div></div>`;
  }
  let main;
  if (idx >= list.length) main = `<div class="done">ALL DONE ✓</div>`;
  else {
    const flag = on ? (l.paused ? "PAUSED" : "PLAYING") : off ? "WAITING" : "";
    main = `<div class="cw">${flag ? `<span class="flag">${flag}</span>` : ""}<div class="top2"><span class="no">№ ${idx + 1}</span></div>` +
      `<span class="w fit">${esc(String(list[idx]).toUpperCase())}</span>${defsHtml(defs[idx], ipa[idx])}</div>`;
    let nx = "";
    for (let k = 1; k <= 4; k++) {
      const w = list[idx + k];
      if (w == null) break;
      const vi = (defs[idx + k] && defs[idx + k].vi) || "";
      nx += `<div class="it n${k}"><span class="k">${idx + k + 1}</span>${esc(String(w).toUpperCase())} <span class="vi">${esc(vi)}</span></div>`;
    }
    if (nx) main += `<div class="tnx"><div class="h">NEXT</div>${nx}</div>`;
  }
  // 3 từ vừa xong (đúng / PASS), mới nhất trước
  let last = "";
  for (let k = Math.min(idx, list.length) - 1, n = 0; k >= 0 && n < 3; k--) {
    const c = rowStr[k];
    if (c === "o") { last += `<span class="o">✓ ${esc(String(list[k]).toUpperCase())}</span>`; n++; }
    else if (c === "p") { last += `<span class="p">PASS ${esc(String(list[k]).toUpperCase())}</span>`; n++; }
  }
  return `<div class="${cls}">${head}${main}${last ? `<div class="lastx">${last}</div>` : ""}</div>`;
}
function paintRWTClocks() { col.querySelectorAll(".hh .ck[data-t]").forEach(c => { c.textContent = fmtClock(rwClock(c.dataset.t)); }); }

// nhịp vẽ: đồng hồ đếm tại chỗ + bước đếm READY/3-2-1
setInterval(() => {
  if (view === "rw" && slot >= 0 && !(link && link.phase === "over")) paintRWClock(TEAMS[slot]);
  else if (view === "rt") drawRT();
  else if (view === "rtt") drawRTT();
  else if (view === "rwt" && !(link && link.phase === "over")) paintRWTClocks();
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
