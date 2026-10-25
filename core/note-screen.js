// =============================================================
// core/note-screen.js — NÚT NOTE: màn chiếu ghi chú viết tay từ iPad (app myNote, note.andrewclasses.com).
// ⭐ Đợt 583 (thầy 25/10/2026): "một nút note mới hoàn toàn, được thiết kế đẹp với nhiều tính năng (nâng cấp sau) đặt ở vị trí
//   tương ứng với nút ipad, nút showdown" · "đưa luôn vào AWord". Mẫu thầy xem: myNote aword-note.html (v0.1.x, đã gỡ).
//
// iPad mở myNote ▸ ghi chú ▸ LIVE ⇒ nét đi THẲNG iPad → máy chiếu bằng WebRTC (cùng Wi-Fi), bắt tay qua Firestore tài khoản
//   thầy (users/{uid}/items: note_host = máy chiếu ghi, note_pad = iPad ghi) — ./note-link.js (CHÉP NGUYÊN VĂN từ myNote).
//   Wi-Fi chặn nối thẳng ⇒ iPad ghi bản trang vào note_pad.fb, màn này vẫn vẽ (chậm hơn, không ảnh nền).
// Vẽ bằng ./note-ink.js (chép từ myNote) ⇒ y hệt iPad. Toạ độ trang rộng 1000 đơn vị ⇒ vẽ lại vector, sắc ở mọi độ phóng.
// Ba chế độ: FOLLOW iPAD (chiếu đúng khung thầy đang nhìn trên iPad, trượt mềm) · WHOLE PAGE · FIT WIDTH.
// ⚠️ kind "note-link" PHẢI có trong APP_DATA_KINDS (core/store.js).
// Bàn thử `?padsig=local` (trang này + myNote cùng ?padsig=local, 2 tab cùng trình duyệt) ⇒ không cần đăng nhập.
// Nạp LƯỜI (main.js chỉ import khi bấm nút / khi đã đăng nhập để vẽ chấm LIVE) — giữ trang chủ nhẹ (Đợt 536).
// =============================================================

import { db, fs, currentUser } from "./firebase.js";
import { createNoteHost, watchPadLive, localSignal } from "./note-link.js";
import { PAGE_W, drawPaper, drawStroke } from "./note-ink.js";

export const NOTE_LOCAL = new URLSearchParams(location.search).get("padsig") === "local";
export const NOTE_KIND = "note-link";
export const MYNOTE_URL = "https://note.andrewclasses.com/";
const DOC = { host: "note_host", pad: "note_pad" };
const envelope = id => ({ id, kind: NOTE_KIND, root: "showdown", parentId: null, trashed: false });

function noteSignal() {
  if (NOTE_LOCAL) return localSignal("note");
  const uid = async () => {
    const u = await currentUser();
    if (!u) { const e = new Error("Sign in to AWord to show iPad notes."); e.code = "aw/signed-out"; throw e; }
    return u.uid;
  };
  return {
    async write(name, patch) {
      const id = DOC[name];
      const [u, d, { doc, setDoc }] = await Promise.all([uid(), db(), fs()]);
      await setDoc(doc(d, `users/${u}/items`, id), { ...envelope(id), ...patch }, { merge: true });
    },
    listen(name, cb) {
      let stop = null, dead = false;
      (async () => {
        try {
          const [u, d, { doc, onSnapshot }] = await Promise.all([uid(), db(), fs()]);
          if (dead) return;
          stop = onSnapshot(doc(d, `users/${u}/items`, DOC[name]),
            s => { if (!dead) cb(s.exists() ? s.data() : null); },
            err => { console.warn("NOTE signal", err); if (!dead) cb(null); });
        } catch (e) { console.warn("NOTE signal", e); if (!dead) cb(null); }
      })();
      return () => { dead = true; if (stop) try { stop(); } catch (e) { /* đã gỡ */ } };
    },
  };
}

// ---- chấm LIVE trên nút NOTE (trang chủ): iPad đang phát ⇒ nút có nhãn LIVE nhấp nháy
let badgeOff = null;
export function watchNoteBadge(btn) {
  if (badgeOff) badgeOff();
  badgeOff = watchPadLive(noteSignal(), on => { if (btn.isConnected) btn.classList.toggle("is-live", on); else if (badgeOff) { badgeOff(); badgeOff = null; } });
}

// ---- icon (Lucide, nhúng sẵn)
const I = {
  pen: '<path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/>',
  eye: '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
  page: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',
  width: '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
  full: '<path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
};
const ic = (n, s = 20) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${I[n]}</svg>`;
export const NOTE_ICON = ic("pen", 22);

const CSS = `
.awn-stage{position:fixed;inset:0;z-index:2147483000;background:radial-gradient(1200px 700px at 50% 0%,#2b3550,#161b28 70%);font-family:inherit;color:#e8edf6;animation:awn-in .25s both;user-select:none}
@keyframes awn-in{from{opacity:0}}
.awn-stage canvas{position:absolute;inset:0;width:100%;height:100%}
.awn-bar{position:absolute;z-index:2;left:18px;right:18px;top:16px;display:flex;align-items:center;gap:12px;pointer-events:none}
.awn-bar>*{pointer-events:auto}
.awn-glass{background:rgba(15,20,32,.55);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.1);border-radius:14px}
.awn-title{display:flex;align-items:center;gap:12px;padding:8px 16px 8px 10px;min-width:0}
.awn-lg{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;background:linear-gradient(135deg,#ff8a4c,#e8506a);color:#fff;flex:none}
.awn-title b{display:block;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:38vw}
.awn-title small{display:block;font-size:12px;color:#9fb0c8;font-weight:600}
.awn-st{display:flex;align-items:center;gap:8px;padding:0 14px;height:52px;font-weight:700;font-size:13px}
.awn-st i{width:9px;height:9px;border-radius:50%;background:#f59e0b;box-shadow:0 0 0 4px rgba(245,158,11,.2)}
.awn-st.on i{background:#22c55e;box-shadow:0 0 0 4px rgba(34,197,94,.22);animation:awn-blink 1.4s infinite}
.awn-st.relay i{background:#38bdf8}
@keyframes awn-blink{50%{opacity:.3}}
.awn-sp{flex:1}
.awn-seg{display:flex;padding:4px;gap:2px}
.awn-seg button,.awn-ib{font:inherit;border:0;background:none;color:#b8c5d8;cursor:pointer}
.awn-seg button{height:42px;padding:0 14px;border-radius:10px;font-size:13.5px;font-weight:700;display:flex;align-items:center;gap:7px}
.awn-seg button.on{background:rgba(255,255,255,.14);color:#fff}
.awn-ib{width:52px;height:52px;display:grid;place-items:center;color:#e8edf6;border-radius:14px}
.awn-ib:hover{background:rgba(255,255,255,.12)}
.awn-wait{position:absolute;inset:0;display:grid;place-items:center;z-index:1;pointer-events:none;transition:opacity .3s}
.awn-wait.hide{opacity:0}
.awn-card{text-align:center;color:#dfe7f3;max-width:600px;padding:0 20px}
.awn-ipad{width:210px;height:150px;margin:0 auto 26px;border-radius:18px;border:6px solid #3b465f;background:#fff;position:relative;box-shadow:0 20px 50px rgba(0,0,0,.35);overflow:hidden}
.awn-ipad svg{position:absolute;inset:0;width:100%;height:100%}
.awn-ipad path{stroke-dasharray:260;stroke-dashoffset:260;animation:awn-draw 2.6s ease-in-out infinite}
@keyframes awn-draw{60%,100%{stroke-dashoffset:0}}
.awn-card h2{font-size:28px;margin:0 0 10px;color:#fff}
.awn-card ol{text-align:left;display:inline-block;margin:6px 0 0;padding-left:20px;line-height:1.9;font-size:15.5px;color:#c4d0e2}
.awn-card b{color:#fff}
.awn-card .awn-err{color:#fda4af;font-weight:700;margin-top:14px}
.awn-pg{position:absolute;z-index:2;right:20px;bottom:18px;padding:8px 14px;font-weight:800;font-size:14px}
`;

let openEl = null;
export function openNoteScreen() {
  if (openEl) return;
  if (!document.getElementById("awn-css")) { const st = document.createElement("style"); st.id = "awn-css"; st.textContent = CSS; document.head.append(st); }
  const stage = document.createElement("div");
  stage.className = "awn-stage";
  stage.innerHTML = `
    <canvas></canvas>
    <div class="awn-wait"><div class="awn-card">
      <div class="awn-ipad"><svg viewBox="0 0 200 140"><path d="M30 90 C 55 40, 80 120, 105 70 S 150 50, 172 84" fill="none" stroke="#2563eb" stroke-width="5" stroke-linecap="round"/></svg></div>
      <h2>Waiting for the iPad</h2>
      <ol><li>On the iPad open <b>myNote</b> (note.andrewclasses.com) and open a note</li>
          <li>Tap <b>LIVE</b> (top right)</li>
          <li>Everything written on the iPad appears here</li></ol>
      <div class="awn-err" hidden></div>
    </div></div>
    <div class="awn-bar">
      <div class="awn-title awn-glass"><span class="awn-lg">${ic("pen")}</span><div><b class="awn-t">NOTE</b><small class="awn-sub">iPad notes</small></div></div>
      <div class="awn-st awn-glass"><i></i><span>No iPad yet</span></div>
      <div class="awn-sp"></div>
      <div class="awn-seg awn-glass"></div>
      <div class="awn-glass" style="display:flex"><button class="awn-ib" data-fs title="Full screen">${ic("full")}</button><button class="awn-ib" data-x title="Close">${ic("x")}</button></div>
    </div>
    <div class="awn-pg awn-glass" hidden></div>`;
  document.body.append(stage);
  openEl = stage;
  const q = s => stage.querySelector(s);
  const cv = q("canvas"), ctx = cv.getContext("2d"), wait = q(".awn-wait"), st = q(".awn-st"), pgEl = q(".awn-pg"), errEl = q(".awn-err");

  const MODES = [["follow", "eye", "Follow iPad"], ["page", "page", "Whole page"], ["width", "width", "Fit width"]];
  let mode = "follow";
  try { mode = localStorage.getItem("aw.noteMode") || mode; } catch (e) { /* */ }
  const seg = q(".awn-seg");
  const paintSeg = () => {
    seg.innerHTML = MODES.map(([k, i, l]) => `<button data-m="${k}" class="${mode === k ? "on" : ""}">${ic(i, 18)}${l}</button>`).join("");
    seg.querySelectorAll("[data-m]").forEach(b => (b.onclick = () => { mode = b.dataset.m; try { localStorage.setItem("aw.noteMode", mode); } catch (e) { /* */ } paintSeg(); kick(); }));
  };
  paintSeg();

  const S = { title: "", n: 0, pi: 0, pages: new Map(), imgs: new Map(), pend: new Map(), view: null, laser: [], state: "wait" };
  let cam = null, raf = 0;   // ⚠️ khai TRƯỚC host.start() — onState gọi kick() ngay lúc start

  function onMessage(m) {
    switch (m.k) {
      case "doc": S.title = m.title; S.n = m.n; if (m.pi !== S.pi) { S.pi = m.pi; S.view = null; } break;
      case "page": S.pages.set(m.pi, m.page); break;
      case "img": { const im = new Image(); im.onload = kick; im.src = m.data; S.imgs.set(m.id, im); break; }
      case "s0": S.pend.set(m.s.id, { ...m.s, p: [], pi: m.pi }); if (m.pi !== S.pi && S.pages.has(m.pi)) S.pi = m.pi; break;
      case "s+": { const s = S.pend.get(m.id); if (s) s.p.push(...m.p); break; }
      case "s1": { const s = S.pend.get(m.id); S.pend.delete(m.id); const pg = s && S.pages.get(s.pi); if (pg) pg.strokes.push(m.s); break; }
      case "laser": S.laser.push({ pi: m.pi, x: m.x, y: m.y, t: performance.now() }); break;
      case "view": S.view = m; break;
    }
    paintInfo(); kick();
  }
  const LABEL = { wait: "No iPad yet", connecting: "Connecting…", on: "iPad LIVE", relay: "iPad LIVE · slow link" };
  function paintInfo() {
    const live = S.state === "on" || S.state === "relay";
    const has = live && S.pages.has(S.pi);
    wait.classList.toggle("hide", has);
    q(".awn-t").textContent = S.title || "NOTE";
    q(".awn-sub").textContent = live ? "writing live from the iPad" : "iPad notes";
    st.className = "awn-st awn-glass" + (S.state === "on" ? " on" : S.state === "relay" ? " on relay" : "");
    st.querySelector("span").textContent = LABEL[S.state] || LABEL.wait;
    pgEl.hidden = !has;
    pgEl.textContent = `Page ${S.pi + 1} / ${S.n}`;
  }

  const host = createNoteHost({
    signal: noteSignal(),
    onMessage,
    onState: s => { S.state = s; if (s === "wait") { S.pages.clear(); S.pend.clear(); cam = null; } paintInfo(); kick(); },
  });
  if (NOTE_LOCAL) host.start();
  else currentUser().then(u => {
    if (!openEl) return;
    if (!u) { errEl.hidden = false; errEl.textContent = "Sign in to AWord first (same Google account as myNote)."; return; }
    host.start();
  });

  function targetRect(pg) {
    const W = cv.clientWidth, H = cv.clientHeight, asp = W / H;
    const v = S.view && S.view.pi === S.pi ? S.view : null;
    if (mode === "page" || (!v && mode === "follow")) return { x: 0, y: 0, w: PAGE_W, h: pg.h };
    if (mode === "width") {
      const h = PAGE_W / asp, cy = v ? (v.y0 + v.y1) / 2 : h / 2;
      return { x: 0, y: Math.max(0, Math.min(pg.h - h, cy - h / 2)), w: PAGE_W, h };
    }
    const pad = 20;
    return { x: v.x0 - pad, y: v.y0 - pad, w: v.x1 - v.x0 + pad * 2, h: v.y1 - v.y0 + pad * 2 };
  }

  function kick() { if (!raf && openEl) raf = requestAnimationFrame(frame); }
  function frame() {
    raf = 0;
    if (!openEl) return;
    const dpr = devicePixelRatio || 1, W = cv.clientWidth, H = cv.clientHeight;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    const pg = S.pages.get(S.pi);
    if (!pg || !(S.state === "on" || S.state === "relay")) return;
    const tg = targetRect(pg);
    let moving = false;
    if (!cam) cam = { ...tg };
    else for (const k of ["x", "y", "w", "h"]) { const d = tg[k] - cam[k]; if (Math.abs(d) > 0.3) { cam[k] += d * 0.16; moving = true; } else cam[k] = tg[k]; }
    const top = 84, padX = 30, padB = 24;
    const k = Math.min((W - padX * 2) / cam.w, (H - top - padB) / cam.h);
    const ox = (W - cam.w * k) / 2 - cam.x * k, oy = top + (H - top - padB - cam.h * k) / 2 - cam.y * k;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,.45)"; ctx.shadowBlur = 40; ctx.shadowOffsetY = 12;
    ctx.fillStyle = "#fff"; ctx.fillRect(ox, oy, PAGE_W * k, pg.h * k);
    ctx.restore();
    ctx.save();
    ctx.beginPath(); ctx.rect(ox, oy, PAGE_W * k, pg.h * k); ctx.clip();
    ctx.setTransform(dpr, 0, 0, dpr, ox * dpr, oy * dpr);
    const im = pg.img && S.imgs.get(pg.img);
    drawPaper(ctx, pg, k, im && im.complete && im.naturalWidth ? im : null);
    for (const s of pg.strokes) drawStroke(ctx, s, k);
    for (const s of S.pend.values()) if (s.pi === S.pi && s.p.length) drawStroke(ctx, s, k);
    const now = performance.now();
    while (S.laser.length && now - S.laser[0].t > 900) S.laser.shift();
    ctx.lineCap = ctx.lineJoin = "round";
    for (let i = 1; i < S.laser.length; i++) {
      const a = S.laser[i - 1], b = S.laser[i];
      if (a.pi !== S.pi || b.pi !== S.pi || b.t - a.t > 80) continue;
      const al = Math.max(0, 1 - (now - b.t) / 900);
      for (const [c, w, f] of [["#ff2d55", 18, 0.3], ["#ff2d55", 7, 1], ["#fff", 2, 0.9]]) {
        ctx.globalAlpha = al * f; ctx.strokeStyle = c; ctx.lineWidth = w;
        ctx.beginPath(); ctx.moveTo(a.x * k, a.y * k); ctx.lineTo(b.x * k, b.y * k); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    if (moving || S.laser.length) kick();
  }

  const close = () => {
    host.stop();
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    removeEventListener("resize", kick);
    removeEventListener("keydown", onKey, true);
    stage.remove(); openEl = null;
  };
  const onKey = e => { if (e.key === "Escape" && !document.fullscreenElement) { e.stopPropagation(); close(); } };
  q("[data-x]").onclick = close;
  q("[data-fs]").onclick = () => (document.fullscreenElement ? document.exitFullscreen() : stage.requestFullscreen()).catch(() => {});
  addEventListener("resize", kick);
  addEventListener("keydown", onKey, true);
  paintInfo();
}
