// STAR LOOT 2q — ĐƯỜNG NỐI iPAD ⇄ MÀN CHƠI (05/10/2026, thầy: "điều khiển bằng iPad… tín hiệu 1 chiều lên game"; chốt WebRTC).
//
// HAI PHÍA, MỘT GIAO THỨC (cùng file để không bao giờ lệch nhau):
//   • createPadHost({ signal, padUrl })  — chạy cùng game trên màn lớn. Trả về `remote` đưa thẳng cho createMazeChase({ remote }).
//   • createPadClient({ signal, team, onState }) — chạy trên iPad (trang pad). send("u"|"d"|"l"|"r"|"bomb").
//
// TÍN HIỆU ĐI THẲNG iPad → máy chiếu qua WebRTC DataChannel (cùng Wi-Fi ≈ 10–30 ms). Kho `signal` CHỈ dùng để bắt tay lúc nối
// (đổi offer/answer, mỗi lần nối 2–3 lượt ghi) — và làm ĐƯỜNG DỰ PHÒNG khi nối thẳng thất bại (Wi-Fi chặn): iPad ghi phím vào kho,
// game nghe kho (chậm hơn, nhãn "iPad · slow").
//
// `signal` = { write(name, flatPatch) → Promise, listen(name, cb(data|null)) → unsub }   — mỗi tài liệu ĐÚNG MỘT người ghi:
//     "host"  — game ghi:  sid (phiên game) · n0/o0 · n1/o1 (offer gửi cho iPad có nonce n_t) · h0/h1 (gửi lại offer khi iPad đá lại)
//     "pad0", "pad1" — iPad đội đó ghi: sid · nonce · answer · rs (số phím dự phòng đã gửi) + rq (≤ 4 phím GẦN NHẤT, "l,d,bomb")
//       — kho gộp nhiều lượt ghi sát nhau thành một lần báo, nên phải mang cả đuôi phím chứ không chỉ phím cuối (bấm l rồi d nhanh: mất l).
//   ⛔ KHÔNG so đồng hồ giữa hai máy (đồng hồ máy em không tin được) — chỉ so sid/nonce/số đếm.
//   Game mở lại / đổi act ⇒ sid mới ⇒ iPad đang mở tự chào lại ⇒ tự nối lại, không phải quét QR lần nữa.
//
// Kênh DataChannel: iPad gửi chuỗi phím; "p:<n>" = nhịp tim (game trả "q:<n>" để iPad đo độ trễ khứ hồi — chỉ để hiện số, không điều khiển gì).

import { qrSvg } from "./mc3d-qr.js";

const ICE = [{ urls: "stun:stun.l.google.com:19302" }];
const KEYS = new Set(["u", "d", "l", "r", "bomb"]);
const rid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
function gather(pc, ms) {
  return new Promise(res => {
    if (pc.iceGatheringState === "complete") return res();
    const t = setTimeout(res, ms);
    pc.addEventListener("icegatheringstatechange", () => { if (pc.iceGatheringState === "complete") { clearTimeout(t); res(); } });
  });
}
const sdpOf = pc => JSON.stringify({ type: pc.localDescription.type, sdp: pc.localDescription.sdp });
export const TEAM_META = [{ name: "TEAM A", solo: "PLAYER", color: "#38bdf8" }, { name: "TEAM B", solo: "", color: "#fb923c" }];

// =================================================================== MÁY CHIẾU
export function createPadHost({ signal, padUrl }) {
  let ctl = null, sid = "", unsubs = [], tick = 0, panelEl = null, panelFight = false, failMsg = "";
  const st = [0, 1].map(() => ({ pc: null, dc: null, served: "", offered: "", hc: 0, last: 0, rs: 0, s: "" }));
  const setS = (t, s) => { if (st[t].s === s) return; st[t].s = s; ctl && ctl.status(t, s); paintPanel(); };
  const press = (t, k) => { st[t].last = performance.now(); if (KEYS.has(k) && ctl) ctl.press(t, k); };
  function closePc(t) { const x = st[t]; try { x.dc && x.dc.close(); } catch (e) { /* */ } try { x.pc && x.pc.close(); } catch (e) { /* */ } x.pc = x.dc = null; }

  async function offerTo(t, nonce) {
    const x = st[t]; closePc(t);
    x.served = nonce; x.offered = ""; x.hc = 0; x.rs = 0; setS(t, "wait");
    const pc = new RTCPeerConnection({ iceServers: ICE }); x.pc = pc;
    const dc = pc.createDataChannel("pad", { ordered: true }); x.dc = dc;
    dc.onopen = () => { if (x.dc === dc) { x.last = performance.now(); setS(t, "on"); } };
    dc.onclose = () => { if (x.dc === dc) setS(t, "wait"); };
    dc.onmessage = e => {
      if (x.dc !== dc) return;
      const m = String(e.data);
      if (m.startsWith("p:")) { x.last = performance.now(); if (x.s !== "on") setS(t, "on"); try { dc.send("q:" + m.slice(2)); } catch (er) { /* */ } return; }
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
    if (!d || !sid || d.sid !== sid || !d.nonce) return;               // chào của phiên game cũ ⇒ bỏ
    if (d.nonce !== x.served) { offerTo(t, d.nonce).catch(e => console.warn("iPad offer", e)); return; }
    // iPad "đá lại" (hc tăng) mà chưa có answer ⇒ nó chưa thấy offer (lần báo bị rơi) ⇒ ghi lại offer + h_t mới để chắc chắn có thay đổi mà báo
    if (!d.answer && x.offered && (+d.hc || 0) > x.hc) { x.hc = +d.hc; signal.write("host", { sid, ["n" + t]: x.served, ["o" + t]: x.offered, ["h" + t]: x.hc }).catch(() => {}); }
    if (d.answer && x.pc && !x.pc.remoteDescription) {
      try { await x.pc.setRemoteDescription(JSON.parse(d.answer)); } catch (e) { console.warn("iPad answer", e); }
    }
    // đường dự phòng: iPad ghi phím vào kho khi kênh thẳng chưa mở
    const rs = +d.rs || 0;
    if (rs > x.rs) {
      const q = String(d.rq || "").split(",").filter(Boolean), n = Math.min(rs - x.rs, q.length);
      x.rs = rs; q.slice(q.length - n).forEach(k => press(t, k));
      if (!(x.dc && x.dc.readyState === "open")) setS(t, "relay");
    }
  }

  function paintPanel() {
    if (!panelEl) return;
    panelEl.querySelectorAll(".mc-ipad-st").forEach(el => {
      const t = +el.dataset.t, s = st[t].s;
      el.dataset.s = s;
      el.querySelector("span").textContent = s === "on" ? "Connected" : s === "relay" ? "Connected (slow — no direct link)" : s === "wait" ? "Connecting…" : "Scan with the iPad camera";
    });
  }

  return {
    attach(c) {
      ctl = c; sid = rid();
      signal.write("host", { sid, n0: "", o0: "", n1: "", o1: "" }).catch(e => { failMsg = (e && e.message) || "iPad link unavailable"; paintPanel(); console.warn("iPad link", e); });
      [0, 1].forEach(t => unsubs.push(signal.listen("pad" + t, d => onPad(t, d))));
      tick = setInterval(() => {                                    // kênh thẳng im quá 4 s (iPad ngủ / rớt Wi-Fi) ⇒ "đang nối"
        st.forEach((x, t) => { if (x.s === "on" && performance.now() - x.last > 4000) setS(t, "wait"); });
      }, 1000);
    },
    detach() {
      if (!ctl) return; ctl = null; clearInterval(tick);
      unsubs.splice(0).forEach(f => { try { f(); } catch (e) { /* */ } });
      [0, 1].forEach(closePc);
      const old = sid; sid = "";
      if (old) signal.write("host", { sid: "", n0: "", o0: "", n1: "", o1: "" }).catch(() => {});
    },
    panel(el, { fight }) {
      panelEl = el; panelFight = !!fight;
      const teams = panelFight ? [0, 1] : [0];
      el.innerHTML = `<div class="mc-ipad">${teams.map(t => {
        const url = padUrl(t), m = TEAM_META[t];
        return `<div class="mc-ipad-card" style="--tc:${m.color}"><h3>${panelFight ? m.name : m.solo}</h3>
          <div class="mc-ipad-qr">${qrSvg(url, { quiet: 1 })}</div>
          <div class="mc-ipad-st" data-t="${t}"><i></i><span></span></div>
          <div class="mc-ipad-url">${url.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</div></div>`;
      }).join("")}</div>
      <p class="mc-pn-note">Open the camera on the iPad and scan. The iPad shows only the D-pad — the on-screen D-pad still works.${failMsg ? `<br><b class="mc-ipad-err">${failMsg}</b>` : ""}</p>`;
      paintPanel();
    },
    panelClosed() { panelEl = null; },
    get state() { return st.map(x => ({ s: x.s, served: x.served, dc: x.dc ? x.dc.readyState : "", ice: x.pc ? x.pc.iceConnectionState : "" })); },
  };
}

// =================================================================== iPAD
// onState({ s: "nogame" | "connecting" | "on" | "relay", rtt })
export function createPadClient({ signal, team, onState }) {
  const me = "pad" + (team ? 1 : 0), t = team ? 1 : 0;
  let sid = "", nonce = "", pc = null, dc = null, answered = false, rs = 0, rq = [], s = "", rtt = 0, ping = 0, pingAt = new Map(), relayT = 0, dead = false, tries = 0;
  const set = v => { if (v === s) return; s = v; onState && onState({ s, rtt }); };
  function closePc() { try { dc && dc.close(); } catch (e) { /* */ } try { pc && pc.close(); } catch (e) { /* */ } pc = dc = null; }
  function hello() {
    if (!sid || dead) return;
    closePc(); nonce = rid(); answered = false; rs = 0; rq = []; tries = 0; clearTimeout(relayT);
    set("connecting");
    signal.write(me, { sid, nonce, answer: "", rs: 0, rq: "" }).catch(e => console.warn("pad hello", e));
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
        if (m.startsWith("q:")) { const t0 = pingAt.get(m.slice(2)); if (t0) { rtt = Math.round(performance.now() - t0); pingAt.delete(m.slice(2)); onState && onState({ s, rtt }); } }
      };
    };
    await pc.setRemoteDescription(JSON.parse(offer));
    await pc.setLocalDescription(await pc.createAnswer());
    await gather(pc, 2500);
    if (pc !== mine || nonce !== my) return;
    await signal.write(me, { sid, nonce, answer: sdpOf(pc) });
    relayT = setTimeout(() => { if (pc === mine && !(dc && dc.readyState === "open")) set("relay"); }, 7000);   // không nối thẳng được ⇒ đi đường kho
  }
  const unsub = signal.listen("host", d => {
    if (dead) return;
    if (!d || !d.sid) { sid = ""; closePc(); set("nogame"); return; }
    if (d.sid !== sid) { sid = d.sid; hello(); return; }
    if (!answered && nonce && d["n" + t] === nonce && d["o" + t]) answer(d["o" + t]).catch(e => { console.warn("pad answer", e); set("relay"); });
  });
  const beat = setInterval(() => {
    if (dc && dc.readyState === "open") { const n = String(++ping); pingAt.set(n, performance.now()); if (pingAt.size > 20) pingAt.delete(pingAt.keys().next().value); try { dc.send("p:" + n); } catch (e) { /* */ } }
  }, 1000);
  // ĐÁ LẠI: kho bắt tay có thể làm rơi MỘT lần báo (thấy thật ở bàn thử: game đang nạp thì lỡ lời chào ⇒ iPad kẹt "Connecting…" mãi).
  // Chưa nối thẳng ⇒ cứ 4 s ghi lại chính tài liệu của mình (cùng nonce, chỉ tăng `hc`) để game đọc lại: chưa offer thì offer, có answer mà chưa
  // nhận thì nhận. Tối đa 8 lần mỗi lượt chào (≈ 32 s) cho khỏi ghi mãi khi game đã tắt.
  const nudge = setInterval(() => {
    if (dead || !sid || !nonce || s === "on" || tries >= 8) return;
    tries++; signal.write(me, { sid, nonce, hc: tries }).catch(() => {});
  }, 4000);
  const onVis = () => { if (document.visibilityState === "visible" && sid && !(dc && dc.readyState === "open")) hello(); };
  document.addEventListener("visibilitychange", onVis);
  return {
    send(k) {
      if (!KEYS.has(k)) return false;
      if (dc && dc.readyState === "open") { dc.send(k); return true; }
      if (!sid || !nonce) return false;
      rs++; rq.push(k); if (rq.length > 4) rq.shift();            // đường dự phòng qua kho
      signal.write(me, { sid, nonce, rs, rq: rq.join(",") }).catch(e => console.warn("pad relay", e));
      return true;
    },
    get state() { return { s, rtt, dc: dc ? dc.readyState : "", ice: pc ? pc.iceConnectionState : "" }; },
    reconnect: hello,
    destroy() { dead = true; clearInterval(beat); clearInterval(nudge); clearTimeout(relayT); document.removeEventListener("visibilitychange", onVis); try { unsub(); } catch (e) { /* */ } closePc(); },
  };
}

// =================================================================== KHO BẮT TAY CỤC BỘ (bàn thử myGame: 2 tab cùng trình duyệt)
export function localSignal(room = "slpad") {
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
