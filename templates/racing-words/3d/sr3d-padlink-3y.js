// RACING WORDS mẫu 3y (16/10/2026) — ĐƯỜNG NỐI iPAD ⇄ MÀN CHƠI = padlink-3e + 2 khoá mới (thầy "ok build" lái nghiêng iPad):
//   game → iPad:  "c:<json>"  KIỂU LÁI { mode: "touch"|"tilt", max: góc lái hết cỡ °, smooth: độ mượt % } — chọn ở nút iPad của game, gửi cả 2 iPad
//                 "r:<số tên lửa>,<pha>"  — bản RÚT GỌN của "i:" ghi vào kho khi ĐỔI: lúc Wi-Fi chặn nối thẳng ("Connected (slow)") iPad vẫn biết
//                 còn tên lửa (3m: nút bắn tự khoá vì "i:" chỉ đi kênh thẳng)
//   Cả "c" lẫn "r" như "m"/"q": kênh thẳng + ghi tài liệu "host" (c0/c1, r0/r1) + gửi lại khi iPad vừa nối.
// ---- gốc 3e ----
// SPEED RUN mẫu 3e (chép 3d/3c/3b, giao thức không đổi) — ĐƯỜNG NỐI iPAD ⇄ MÀN CHƠI (15/10/2026) = sr3d-padlink-2.js + 3 CHẾ ĐỘ iPad (thầy 15/10):
//   game → iPad:  "m:<0|1|2>"  chế độ (0 tắt · 1 trả lời trên iPad · 2 đua trên iPad)
//                 "Q:<json>"   câu hỏi đang hỏi đội đó { n: số câu, ph: pha, q, a: [đáp án], lock, pick, ok, rev: [đáp án đúng khi chọn sai] }
//                 — 2 thứ này ngoài kênh thẳng còn GHI vào tài liệu "host" (m0/m1, q0/q1) ⇒ Wi-Fi chặn nối thẳng iPad vẫn nhận được
//                 "i:" thêm trường thứ 6 = Nitro 0..1
//   iPad → game:  "a:<đáp án>:<số câu>"  trả lời (lệnh rời; game bỏ nếu số câu đã cũ)
// ---- gốc mẫu 2 ----
// SPEED RUN mẫu 2 — ĐƯỜNG NỐI iPAD ⇄ MÀN CHƠI (11/10/2026). Gốc = STAR LOOT `maze-chase/core/mc3d-padlink-2q.js` (thầy đã thử iPad thật 05/10 OK),
// MỞ RỘNG GIAO THỨC cho LÁI XE LIÊN TỤC (thầy 11/10: "điều khiển trái phải, tăng tốc phanh tương tự như các game Asphalt"):
//
//   iPad → game:  "s:<steer −100..100>,<boost 0|1>,<brake 0|1>"  — TRẠNG THÁI tay lái, gửi khi đổi + nhắc lại mỗi 120 ms khi đang giữ;
//                                                                 game tự NHẢ (về 0) nếu im > 450 ms (rớt mạng / iPad ngủ ⇒ xe không lái mãi một phía)
//                 "fire"                                         — lệnh RỜI: bắn tên lửa
//                 "p:<n>"                                        — nhịp tim (game trả "q:<n>" để iPad đo độ trễ)
//   game → iPad:  "i:<km/h>,<năng lượng theo ô, 1 số lẻ>,<số tên lửa>,<báo động 0|1|2>,<pha menu|count|race|end>"  — 4 lần/giây, iPad hiện lên đồng hồ
//
// Bắt tay y như 2q: kho `signal` 3 tài liệu MỖI TÀI LIỆU 1 NGƯỜI GHI ("host" / "pad0" / "pad1"), sid phiên + nonce iPad, nudge 4 s × 8.
// Đường DỰ PHÒNG qua kho (Wi-Fi chặn nối thẳng): iPad ghi `rs`/`rq` (đuôi ≤ 4 lệnh rời) + `sn`/`st` (TRẠNG THÁI lái MỚI NHẤT, ≤ 5 lần/giây —
// trạng thái không cần hàng đợi, chỉ cần cái mới nhất). ⛔ Không so đồng hồ 2 máy — chỉ so sid/nonce/số đếm.

import { qrSvg } from "./mc3d-qr.js";

const ICE = [{ urls: "stun:stun.l.google.com:19302" }];
const KEYS = new Set(["fire"]);
const isKey = k => KEYS.has(k) || /^a:\d+:\d+$/.test(k);
const rid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
function gather(pc, ms) {
  return new Promise(res => {
    if (pc.iceGatheringState === "complete") return res();
    const t = setTimeout(res, ms);
    pc.addEventListener("icegatheringstatechange", () => { if (pc.iceGatheringState === "complete") { clearTimeout(t); res(); } });
  });
}
const sdpOf = pc => JSON.stringify({ type: pc.localDescription.type, sdp: pc.localDescription.sdp });
export const TEAM_META = [{ name: "TEAM 1", color: "#3b8cff" }, { name: "TEAM 2", color: "#ff7a00" }];
export function parseDrive(m) {                     // "s:-100,1,0" ⇒ { steer: −1, boost: 1, brake: 0 }
  const [a, b, c] = String(m).slice(2).split(",").map(Number);
  return { steer: Math.max(-1, Math.min(1, (a || 0) / 100)), boost: b ? 1 : 0, brake: c ? 1 : 0 };
}

// =================================================================== MÁY CHIẾU
// ctl = { press(team, "fire"), drive(team, {steer, boost, brake}), status(team, "on"|"relay"|"wait"|""), answer(team, k, n) }
export function createPadHost({ signal, padUrl }) {
  let ctl = null, sid = "", unsubs = [], tick = 0, panelEl = null, failMsg = "", note = "";
  const cache = [{}, {}];                                     // chế độ + câu hỏi mới nhất mỗi đội (gửi lại khi iPad vừa nối)
  const st = [0, 1].map(() => ({ pc: null, dc: null, served: "", offered: "", hc: 0, last: 0, rs: 0, sn: 0, s: "" }));
  const setS = (t, s) => { if (st[t].s === s) return; st[t].s = s; ctl && ctl.status(t, s); paintPanel(); };
  const press = (t, k) => {
    st[t].last = performance.now(); if (!ctl) return;
    if (KEYS.has(k)) ctl.press(t, k);
    else if (/^a:\d+:\d+$/.test(k) && ctl.answer) { const [, a, n] = k.split(":"); ctl.answer(t, +a, +n); }
  };
  const WIRE = { m: "m:", q: "Q:", c: "c:", r: "r:" };
  const wire = (key, v) => (WIRE[key] || "Q:") + v;
  const resend = t => { const x = st[t]; if (!(x.dc && x.dc.readyState === "open")) return; for (const k of ["m", "q", "c", "r"]) if (cache[t][k] != null) { try { x.dc.send(wire(k, cache[t][k])); } catch (e) { /* */ } } };
  function closePc(t) { const x = st[t]; try { x.dc && x.dc.close(); } catch (e) { /* */ } try { x.pc && x.pc.close(); } catch (e) { /* */ } x.pc = x.dc = null; }

  async function offerTo(t, nonce) {
    const x = st[t]; closePc(t);
    x.served = nonce; x.offered = ""; x.hc = 0; x.rs = 0; x.sn = 0; setS(t, "wait");
    const pc = new RTCPeerConnection({ iceServers: ICE }); x.pc = pc;
    const dc = pc.createDataChannel("pad", { ordered: true }); x.dc = dc;
    dc.onopen = () => { if (x.dc === dc) { x.last = performance.now(); setS(t, "on"); resend(t); } };
    dc.onclose = () => { if (x.dc === dc) setS(t, "wait"); };
    dc.onmessage = e => {
      if (x.dc !== dc) return;
      const m = String(e.data);
      x.last = performance.now(); if (x.s !== "on") setS(t, "on");
      if (m.startsWith("p:")) { try { dc.send("q:" + m.slice(2)); } catch (er) { /* */ } return; }
      if (m.startsWith("s:")) { ctl && ctl.drive(t, parseDrive(m)); return; }
      press(t, m);
    };
    await pc.setLocalDescription(await pc.createOffer());
    await gather(pc, 2500);
    if (x.pc !== pc || !sid) return;
    x.offered = sdpOf(pc);
    await signal.write("host", { sid, ["n" + t]: nonce, ["o" + t]: x.offered });
  }
  async function onPad(t, d) {
    const x = st[t];
    if (!d || !sid || d.sid !== sid || !d.nonce) return;
    if (d.nonce !== x.served) { offerTo(t, d.nonce).catch(e => console.warn("iPad offer", e)); return; }
    if (!d.answer && x.offered && (+d.hc || 0) > x.hc) { x.hc = +d.hc; signal.write("host", { sid, ["n" + t]: x.served, ["o" + t]: x.offered, ["h" + t]: x.hc }).catch(() => {}); }
    if (d.answer && x.pc && !x.pc.remoteDescription) {
      try { await x.pc.setRemoteDescription(JSON.parse(d.answer)); } catch (e) { console.warn("iPad answer", e); }
    }
    const direct = x.dc && x.dc.readyState === "open";
    const rs = +d.rs || 0;
    if (rs > x.rs) {
      const q = String(d.rq || "").split(",").filter(Boolean), n = Math.min(rs - x.rs, q.length);
      x.rs = rs; q.slice(q.length - n).forEach(k => press(t, k));
      if (!direct) setS(t, "relay");
    }
    const sn = +d.sn || 0;
    if (sn > x.sn) { x.sn = sn; x.last = performance.now(); if (ctl && d.st) ctl.drive(t, parseDrive(d.st)); if (!direct) setS(t, "relay"); }
  }

  function paintPanel() {
    if (!panelEl) return;
    panelEl.querySelectorAll(".sr-ipad-st").forEach(el => {
      const t = +el.dataset.t, s = st[t].s;
      el.dataset.s = s;
      el.querySelector("span").textContent = s === "on" ? "Connected" : s === "relay" ? "Connected (slow — no direct link)" : s === "wait" ? "Connecting…" : "Scan with the iPad camera";
    });
  }

  return {
    attach(c) {
      ctl = c; sid = rid();
      signal.write("host", { sid, n0: "", o0: "", n1: "", o1: "", m0: cache[0].m ?? "", m1: cache[1].m ?? "", q0: cache[0].q ?? "", q1: cache[1].q ?? "" }).catch(e => { failMsg = (e && e.message) || "iPad link unavailable"; paintPanel(); console.warn("iPad link", e); });
      [0, 1].forEach(t => unsubs.push(signal.listen("pad" + t, d => onPad(t, d))));
      tick = setInterval(() => {                                    // im quá 4 s (iPad ngủ / rớt Wi-Fi) ⇒ "đang nối"
        st.forEach((x, t) => { if ((x.s === "on" || x.s === "relay") && performance.now() - x.last > 4000) setS(t, "wait"); });
      }, 1000);
    },
    detach() {
      if (!ctl) return; ctl = null; clearInterval(tick);
      unsubs.splice(0).forEach(f => { try { f(); } catch (e) { /* */ } });
      [0, 1].forEach(closePc);
      const old = sid; sid = "";
      if (old) signal.write("host", { sid: "", n0: "", o0: "", n1: "", o1: "" }).catch(() => {});
    },
    /** game → iPad (chỉ qua kênh thẳng; đường kho không gửi ngược) */
    send(t, m) { const x = st[t]; if (x.dc && x.dc.readyState === "open") { try { x.dc.send(m); } catch (e) { /* */ } } },
    /** chế độ ("m") / câu hỏi ("q") cho đội t: kênh thẳng + ghi kho (dự phòng) — chỉ khi ĐỔI */
    share(t, key, v) {
      if (cache[t][key] === v) return; cache[t][key] = v;
      this.send(t, wire(key, v));
      if (sid) signal.write("host", { sid, [key + t]: v }).catch(() => {});
    },
    panel(el, txt) {
      panelEl = el; if (txt != null) note = txt;
      el.innerHTML = `<div class="sr-ipad">${[0, 1].map(t => {
        const url = padUrl(t), m = TEAM_META[t];
        return `<div class="sr-ipad-card" style="--tc:${m.color}"><h3>${m.name}</h3>
          <div class="sr-ipad-qr">${qrSvg(url, { quiet: 1 })}</div>
          <div class="sr-ipad-st" data-t="${t}"><i></i><span></span></div>
          <div class="sr-ipad-url">${url.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</div></div>`;
      }).join("")}</div>
      <p class="sr-pn-note">Scan with the iPad camera. ${note}${failMsg ? `<br><b class="sr-ipad-err">${failMsg}</b>` : ""}</p>`;
      paintPanel();
    },
    panelClosed() { panelEl = null; },
    get state() { return st.map(x => ({ s: x.s, served: x.served, dc: x.dc ? x.dc.readyState : "", ice: x.pc ? x.pc.iceConnectionState : "" })); },
  };
}

// =================================================================== iPAD
// onState({ s: "nogame" | "connecting" | "on" | "relay", rtt }) · onInfo({ kmh, cells, ms, alarm, phase, nitro }) · onMode(0|1|2) · onQ({ n, ph, q, a, lock, pick, ok, rev })
// 3y: onSteer({ mode, max, smooth }) — kiểu lái do màn lớn chọn
export function createPadClient({ signal, team, onState, onInfo, onMode, onQ, onSteer }) {
  const me = "pad" + (team ? 1 : 0), t = team ? 1 : 0;
  let sid = "", nonce = "", pc = null, dc = null, answered = false, rs = 0, rq = [], sn = 0, s = "", rtt = 0, ping = 0, pingAt = new Map(), relayT = 0, dead = false, tries = 0;
  let cur = "s:0,0,0", lastSent = "", sentAt = 0, relayAt = 0, relayPend = 0, mode = null, qRaw = "";
  const gotMode = v => { const m = +v || 0; if (v === "" || v == null || m === mode) return; mode = m; onMode && onMode(m); };
  const gotQ = v => { if (!v || v === qRaw) return; qRaw = v; try { onQ && onQ(JSON.parse(v)); } catch (e) { /* */ } };
  // 3y: kiểu lái + số tên lửa qua kho (khi không nối thẳng)
  let cRaw = "", lastInfo = { kmh: 0, cells: 0, ms: 0, alarm: 0, phase: "", nitro: 0 };
  const gotSteer = v => { if (!v || v === cRaw) return; cRaw = v; try { onSteer && onSteer(JSON.parse(v)); } catch (e) { /* */ } };
  const gotRelay = v => {
    if (!v || (dc && dc.readyState === "open")) return;                  // nối thẳng ⇒ đã có "i:" 4 lần/giây
    const [ms, ph] = String(v).split(","); lastInfo = { ...lastInfo, ms: +ms || 0, phase: ph || lastInfo.phase }; onInfo && onInfo(lastInfo);
  };
  const set = v => { if (v === s) return; s = v; onState && onState({ s, rtt }); };
  function closePc() { try { dc && dc.close(); } catch (e) { /* */ } try { pc && pc.close(); } catch (e) { /* */ } pc = dc = null; }
  function hello() {
    if (!sid || dead) return;
    closePc(); nonce = rid(); answered = false; rs = 0; rq = []; sn = 0; tries = 0; clearTimeout(relayT);
    set("connecting");
    signal.write(me, { sid, nonce, answer: "", rs: 0, rq: "", sn: 0, st: "" }).catch(e => console.warn("pad hello", e));
  }
  async function answer(offer) {
    answered = true;
    const my = nonce;
    pc = new RTCPeerConnection({ iceServers: ICE });
    const mine = pc;
    pc.ondatachannel = e => {
      dc = e.channel;
      dc.onopen = () => { if (pc === mine) { clearTimeout(relayT); set("on"); } };
      dc.onclose = () => { if (pc === mine && !dead) { set("connecting"); setTimeout(() => { if (pc === mine) hello(); }, 800); } };
      dc.onmessage = ev => {
        const m = String(ev.data);
        if (m.startsWith("q:")) { const t0 = pingAt.get(m.slice(2)); if (t0) { rtt = Math.round(performance.now() - t0); pingAt.delete(m.slice(2)); onState && onState({ s, rtt }); } return; }
        if (m.startsWith("i:") && onInfo) { const [kmh, cells, ms, alarm, phase, nitro] = m.slice(2).split(","); lastInfo = { kmh: +kmh || 0, cells: +cells || 0, ms: +ms || 0, alarm: +alarm || 0, phase: phase || "", nitro: +nitro || 0 }; onInfo(lastInfo); return; }
        if (m.startsWith("c:")) { gotSteer(m.slice(2)); return; }
        if (m.startsWith("r:")) return;
        if (m.startsWith("m:")) { gotMode(m.slice(2)); return; }
        if (m.startsWith("Q:")) { gotQ(m.slice(2)); return; }
      };
    };
    await pc.setRemoteDescription(JSON.parse(offer));
    await pc.setLocalDescription(await pc.createAnswer());
    await gather(pc, 2500);
    if (pc !== mine || nonce !== my) return;
    await signal.write(me, { sid, nonce, answer: sdpOf(pc) });
    relayT = setTimeout(() => { if (pc === mine && !(dc && dc.readyState === "open")) set("relay"); }, 7000);
  }
  const unsub = signal.listen("host", d => {
    if (dead) return;
    if (!d || !d.sid) { sid = ""; closePc(); set("nogame"); return; }
    if (d["m" + t] != null) gotMode(d["m" + t]);
    if (d["q" + t]) gotQ(d["q" + t]);
    if (d["c" + t]) gotSteer(d["c" + t]);
    if (d["r" + t]) gotRelay(d["r" + t]);
    if (d.sid !== sid) { sid = d.sid; hello(); return; }
    if (!answered && nonce && d["n" + t] === nonce && d["o" + t]) answer(d["o" + t]).catch(e => { console.warn("pad answer", e); set("relay"); });
  });
  const beat = setInterval(() => {
    if (dc && dc.readyState === "open") { const n = String(++ping); pingAt.set(n, performance.now()); if (pingAt.size > 20) pingAt.delete(pingAt.keys().next().value); try { dc.send("p:" + n); } catch (e) { /* */ } }
  }, 1000);
  const nudge = setInterval(() => {
    if (dead || !sid || !nonce || s === "on" || tries >= 8) return;
    tries++; signal.write(me, { sid, nonce, hc: tries }).catch(() => {});
  }, 4000);
  // nhắc lại trạng thái lái khi ĐANG GIỮ (game nhả nếu im > 450 ms) · đường kho: ≤ 5 lần/giây, chỉ ghi khi đổi
  function pushState(force) {
    const now = performance.now(), idle = cur === "s:0,0,0";
    if (dc && dc.readyState === "open") {
      if (force || cur !== lastSent || (!idle && now - sentAt > 120)) { try { dc.send(cur); lastSent = cur; sentAt = now; } catch (e) { /* */ } }
      return;
    }
    if (!sid || !nonce || s === "connecting" && !answered) return;
    if (cur === lastSent && !force) return;
    if (now - relayAt < 200) { relayPend = 1; return; }
    relayAt = now; relayPend = 0; lastSent = cur; sn++;
    signal.write(me, { sid, nonce, sn, st: cur }).catch(e => console.warn("pad relay", e));
  }
  const rep = setInterval(() => pushState(!!relayPend), 60);
  const onVis = () => { if (document.visibilityState === "visible" && sid && !(dc && dc.readyState === "open")) hello(); };
  document.addEventListener("visibilitychange", onVis);
  return {
    /** tay lái: steer −1..1, boost/brake 0|1 */
    drive(steer, boost, brake) { cur = "s:" + Math.round(Math.max(-1, Math.min(1, steer)) * 100) + "," + (boost ? 1 : 0) + "," + (brake ? 1 : 0); pushState(false); },
    /** trả lời câu số n bằng đáp án k (chế độ 1) */
    answer(k, n) { return this.send("a:" + k + ":" + n); },
    get mode() { return mode; },
    send(k) {
      if (!isKey(k)) return false;
      if (dc && dc.readyState === "open") { dc.send(k); return true; }
      if (!sid || !nonce) return false;
      rs++; rq.push(k); if (rq.length > 4) rq.shift();
      signal.write(me, { sid, nonce, rs, rq: rq.join(",") }).catch(e => console.warn("pad relay", e));
      return true;
    },
    get state() { return { s, rtt, dc: dc ? dc.readyState : "", ice: pc ? pc.iceConnectionState : "" }; },
    reconnect: hello,
    destroy() { dead = true; clearInterval(beat); clearInterval(nudge); clearInterval(rep); clearTimeout(relayT); document.removeEventListener("visibilitychange", onVis); try { unsub(); } catch (e) { /* */ } closePc(); },
  };
}

// =================================================================== KHO BẮT TAY CỤC BỘ (bàn thử myGame: 2 tab cùng trình duyệt)
export function localSignal(room = "srpad") {
  const bc = new BroadcastChannel(room), subs = new Map();
  const key = n => room + ":" + n;
  const read = n => { try { return JSON.parse(localStorage.getItem(key(n)) || "null"); } catch (e) { return null; } };
  const fire = n => (subs.get(n) || []).forEach(cb => cb(read(n)));
  bc.onmessage = e => fire(e.data);
  return {
    write(n, patch) { localStorage.setItem(key(n), JSON.stringify({ ...(read(n) || {}), ...patch })); bc.postMessage(n); setTimeout(() => fire(n)); return Promise.resolve(); },
    listen(n, cb) { if (!subs.has(n)) subs.set(n, []); subs.get(n).push(cb); setTimeout(() => cb(read(n))); return () => { const a = subs.get(n); a.splice(a.indexOf(cb), 1); }; },
  };
}
