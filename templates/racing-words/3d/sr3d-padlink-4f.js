// RACING WORDS mẫu 4f (16/10/2026) — ĐƯỜNG NỐI iPAD ⇄ MÀN CHƠI = padlink-3y + 4 việc sau buổi thử TOMKO (thầy: "2 iPad thì 1 cái connect ngon,
// 1 cái slow connect nên không thể điều khiển nổi" + "kết nối trước intro, test ok mới cho start, chỉnh Options / Start again / đổi xe vẫn giữ kết nối"):
//   1. NỐI BỀN QUA NHIỀU VÁN: attach(ctl) / detach() chỉ GẮN / GỠ game — không đổi sid, không đóng kênh. Game dựng lại (Apply Options) ⇒ game mới gắn vào
//      đường nối đang sống, nhận ngay trạng thái từng đội. Chỉ close() mới đóng thật (chủ trang gọi khi rời hẳn game).
//   2. TỰ NỐI LẠI ĐƯỜNG THẲNG: cũ — lần bắt tay đầu trượt (ICE không thông) là kẹt "Connected (slow)" (đường kho Firestore ≤ 5 lần/giây, trễ
//      0,3–1 s ⇒ lái không nổi) tới lúc tải lại trang. Nay iPad tự bắt tay lại theo nấc 5 · 6 · 8 · 12 · 20 s… khi kênh thẳng chưa mở / ICE "failed" /
//      "disconnected" > 3 s; trong lúc thử lại vẫn lái qua kho (không rớt về "Connecting"). Màn lớn có reconnect(t) (khoá "k<t>" trong tài liệu host).
//   3. ĐƯỜNG KHO có NHỊP TIM 1,5 s (cũ: iPad để yên tay ⇒ không ghi ⇒ 4 s sau màn lớn tưởng mất iPad).
//   4. CHẨN ĐOÁN: mỗi đội ghi loại ứng viên ICE 2 phía (host / mDNS .local / srflx) + cặp được chọn + độ trễ + số lần thử ⇒ hiện trong ⚙ Settings ▸ iPad
//      và thẻ iPad ở xưởng ⇒ lần sau thấy ngay vì sao một iPad không nối thẳng được (Wi-Fi tách máy / khác mạng / chặn multicast mDNS…).
//   + live(t) cho thẻ thử xưởng: trạng thái, góc lái mới nhất, đã thử TRÁI / PHẢI chưa (cờ nằm trong đường nối ⇒ dựng lại game không phải thử lại).
//   + thêm máy STUN dự phòng (Google 2 máy + Cloudflare).
//   5. KHOÁ ĐỘI (thầy 16/10: "iPad 1 chọn Team 1 rồi, iPad 2 vẫn chọn được Team 1 ⇒ 2 máy cùng Connecting… mãi" — 2 iPad cùng ghi tài liệu "pad0",
//      mỗi lần chào đè nonce của nhau ⇒ máy chiếu mời bắt tay qua lại không dứt). Mỗi iPad có MÃ MÁY cố định (localStorage "rwpad.dev") ghi kèm lời chào.
//      Máy chiếu giữ CHỦ ĐỘI = máy của lời chào đầu tiên được nhận, ghi "u0"/"u1" vào tài liệu host; lời chào từ máy KHÁC bị bỏ qua.
//      Nhả chủ khi: chủ thoát ra màn chọn đội (destroy ⇒ ghi "left") · chủ mất hẳn > 8 s (iPad tắt / đóng Safari). Cùng máy tải lại trang = vẫn là chủ.
//      iPad thấy đội đã có chủ khác ⇒ KHÔNG chào, báo "taken"; màn chọn đội (watchTeams) làm mờ đội đã có iPad.
// Giao thức giữ nguyên 3y (thêm khoá "k0"/"k1" · "u0"/"u1" trong tài liệu host, "dev"/"left" trong tài liệu pad) — iPad 4f phải đi với màn lớn 4f.
// ---- gốc 3y ----
// RACING WORDS mẫu 3y (16/10/2026) — ĐƯỜNG NỐI iPAD ⇄ MÀN CHƠI = padlink-3e + 2 khoá mới (thầy "ok build" lái nghiêng iPad):
//   game → iPad:  "c:<json>"  KIỂU LÁI { mode: "touch"|"tilt", max: góc lái hết cỡ °, smooth: độ mượt % } — chọn ở nút iPad của game, gửi cả 2 iPad
//                 "r:<số tên lửa>,<pha>"  — bản RÚT GỌN của "i:" ghi vào kho khi ĐỔI: lúc Wi-Fi chặn nối thẳng ("Connected (slow)") iPad vẫn biết còn tên lửa
//   Cả "c" lẫn "r" như "m"/"q": kênh thẳng + ghi tài liệu "host" (c0/c1, r0/r1) + gửi lại khi iPad vừa nối.
// ---- gốc 3e ----
//   game → iPad:  "m:<0|1|2>" chế độ · "Q:<json>" câu hỏi · "i:<km/h>,<ô năng lượng>,<tên lửa>,<báo động>,<pha>,<nitro>" 4 lần/giây
//   iPad → game:  "s:<steer −100..100>,<boost>,<brake>" trạng thái lái (nhắc lại 120 ms khi giữ; game nhả nếu im > 450 ms) · "fire" · "a:<đáp án>:<số câu>" · "p:<n>" nhịp tim
// Bắt tay: kho `signal` 3 tài liệu MỖI TÀI LIỆU 1 NGƯỜI GHI ("host" / "pad0" / "pad1"), sid phiên + nonce iPad. ⛔ Không so đồng hồ 2 máy — chỉ so sid/nonce/số đếm.

import { qrSvg } from "./mc3d-qr.js";

const ICE = [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }, { urls: "stun:stun.cloudflare.com:3478" }];
const KEYS = new Set(["fire"]);
const isKey = k => KEYS.has(k) || /^a:\d+:\d+$/.test(k);
const rid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
// 5: mã máy iPad cố định (cùng máy tải lại trang vẫn là chủ đội cũ)
export function padDev() {
  const q = new URLSearchParams(location.search).get("dev"); if (q) return q;   // bàn thử: nhiều tab = nhiều iPad
  try { let v = localStorage.getItem("rwpad.dev"); if (!v) { v = rid(); localStorage.setItem("rwpad.dev", v); } return v; } catch (e) { return padDev.v || (padDev.v = rid()); }
}
/** 5: màn chọn đội nghe đội nào đã có iPad KHÁC ⇒ cb([bận0, bận1]) — trả hàm huỷ */
export function watchTeams(signal, cb) {
  const me = padDev();
  return signal.listen("host", d => { const on = !!(d && d.sid); cb([0, 1].map(t => on && !!d["u" + t] && d["u" + t] !== me)); });
}
function gather(pc, ms) {
  return new Promise(res => {
    if (pc.iceGatheringState === "complete") return res();
    const t = setTimeout(res, ms);
    pc.addEventListener("icegatheringstatechange", () => { if (pc.iceGatheringState === "complete") { clearTimeout(t); res(); } });
  });
}
const sdpOf = pc => JSON.stringify({ type: pc.localDescription.type, sdp: pc.localDescription.sdp });
// 4f: đếm ứng viên ICE trong SDP — "h" IP thật trong mạng · "m" tên mDNS .local (trình duyệt giấu IP) · "s" srflx (IP ngoài qua STUN) · "r" relay
export function candsOf(sdp) {
  const c = { h: 0, m: 0, s: 0, r: 0 };
  String(sdp || "").split(/\r?\n/).forEach(l => {
    const x = /^a=candidate:\S+ \d+ (\w+) \d+ (\S+) \d+ typ (\w+)/i.exec(l); if (!x || x[1].toLowerCase() !== "udp") return;
    if (x[3] === "host") { if (/\.local$/i.test(x[2])) c.m++; else c.h++; } else if (x[3] === "srflx" || x[3] === "prflx") c.s++; else if (x[3] === "relay") c.r++;
  });
  return c;
}
const candTxt = c => (c ? [c.h && "LAN " + c.h, c.m && "mDNS " + c.m, c.s && "STUN " + c.s, c.r && "TURN " + c.r].filter(Boolean).join(" ") || "none" : "?");
export const TEAM_META = [{ name: "TEAM 1", color: "#3b8cff" }, { name: "TEAM 2", color: "#ff7a00" }];
export function parseDrive(m) {                     // "s:-100,1,0" ⇒ { steer: −1, boost: 1, brake: 0 }
  const [a, b, c] = String(m).slice(2).split(",").map(Number);
  return { steer: Math.max(-1, Math.min(1, (a || 0) / 100)), boost: b ? 1 : 0, brake: c ? 1 : 0 };
}

// =================================================================== MÁY CHIẾU
// ctl = { press(team, "fire"), drive(team, {steer, boost, brake}), status(team, "on"|"relay"|"wait"|""), answer(team, k, n) }
export function createPadHost({ signal, padUrl }) {
  let ctl = null, sid = "", unsubs = [], tick = 0, panelEl = null, failMsg = "", note = "", closed = false;
  const ctls = [];                                            // 4f: các bên đang gắn (mới nhất nhận iPad) — gỡ 1 bên thì bên trước nhận lại
  const cache = [{}, {}];                                     // chế độ + câu hỏi mới nhất mỗi đội (gửi lại khi iPad vừa nối)
  const st = [0, 1].map(() => ({ pc: null, dc: null, served: "", offered: "", hc: 0, last: 0, rs: 0, sn: 0, s: "",
    tries: 0, kick: 0, mine: null, theirs: null, pair: "", rtt: 0, ice: "", steer: 0, at: 0, tl: 0, tr: 0, via: "", owner: "", lostAt: 0 }));
  const OWN_GRACE = 8000;                                     // 5: chủ đội mất hẳn quá 8 s ⇒ nhả cho iPad khác
  const setOwner = (t, dev) => { const x = st[t]; if (x.owner === dev) return; x.owner = dev; x.lostAt = 0; if (sid) signal.write("host", { sid, ["u" + t]: dev }).catch(() => {}); emit(t); };
  const subs = new Set();                                     // 4f: thẻ thử ở xưởng nghe đổi trạng thái
  const emit = t => subs.forEach(f => { try { f(t); } catch (e) { /* */ } });
  const setS = (t, s) => {
    const x = st[t]; if (x.s === s) return; x.s = s;
    if (s !== "on" && s !== "relay") x.steer = 0;          // cờ đã thử TRÁI / PHẢI giữ nguyên khi iPad nối lại (cùng iPad — khỏi bắt thử lần nữa)
    ctl && ctl.status(t, s); paintPanel(); emit(t);
  };
  const press = (t, k) => {
    st[t].last = performance.now(); if (!ctl) return;
    if (KEYS.has(k)) ctl.press(t, k);
    else if (/^a:\d+:\d+$/.test(k) && ctl.answer) { const [, a, n] = k.split(":"); ctl.answer(t, +a, +n); }
  };
  const drive = (t, d, via) => {
    const x = st[t]; x.steer = d.steer; x.at = performance.now(); x.via = via;
    if (d.steer < -0.35 && !x.tl) { x.tl = 1; emit(t); }
    if (d.steer > 0.35 && !x.tr) { x.tr = 1; emit(t); }
    ctl && ctl.drive(t, d);
  };
  const WIRE = { m: "m:", q: "Q:", c: "c:", r: "r:" };
  const wire = (key, v) => (WIRE[key] || "Q:") + v;
  const resend = t => { const x = st[t]; if (!(x.dc && x.dc.readyState === "open")) return; for (const k of ["m", "q", "c", "r"]) if (cache[t][k] != null) { try { x.dc.send(wire(k, cache[t][k])); } catch (e) { /* */ } } };
  function closePc(t) { const x = st[t]; try { x.dc && x.dc.close(); } catch (e) { /* */ } try { x.pc && x.pc.close(); } catch (e) { /* */ } x.pc = x.dc = null; }

  // 4f: cặp ứng viên đang dùng + độ trễ (getStats) — "host→host 6 ms" = nối thẳng trong mạng LAN
  async function probe(t) {
    const x = st[t], pc = x.pc; if (!pc) return;
    try {
      const rep = await pc.getStats(); let pair = null; const byId = new Map();
      rep.forEach(r => { byId.set(r.id, r); });
      rep.forEach(r => { if (r.type === "transport" && r.selectedCandidatePairId) pair = byId.get(r.selectedCandidatePairId); });
      if (!pair) rep.forEach(r => { if (r.type === "candidate-pair" && r.state === "succeeded" && (r.nominated || r.selected) && !pair) pair = r; });
      if (!pair || x.pc !== pc) return;
      const lc = byId.get(pair.localCandidateId), rc = byId.get(pair.remoteCandidateId);
      x.pair = `${lc ? lc.candidateType : "?"}→${rc ? rc.candidateType : "?"}`;
      if (pair.currentRoundTripTime != null) x.rtt = Math.round(pair.currentRoundTripTime * 1000);
      paintPanel(); emit(t);
    } catch (e) { /* */ }
  }

  async function offerTo(t, nonce) {
    const x = st[t]; closePc(t);
    x.served = nonce; x.offered = ""; x.hc = 0; x.rs = 0; x.sn = 0; x.tries++; x.pair = ""; x.rtt = 0; x.theirs = null; x.ice = "";
    if (x.s !== "relay") setS(t, "wait");                     // 4f: đang lái qua kho mà thử nối thẳng lại ⇒ KHÔNG rớt về "đang nối"
    const pc = new RTCPeerConnection({ iceServers: ICE }); x.pc = pc;
    pc.oniceconnectionstatechange = () => { if (x.pc !== pc) return; x.ice = pc.iceConnectionState; paintPanel(); emit(t); };
    const dc = pc.createDataChannel("pad", { ordered: true }); x.dc = dc;
    dc.onopen = () => { if (x.dc === dc) { x.last = performance.now(); setS(t, "on"); resend(t); setTimeout(() => probe(t), 600); } };
    dc.onclose = () => { if (x.dc === dc) setS(t, "wait"); };
    dc.onmessage = e => {
      if (x.dc !== dc) return;
      const m = String(e.data);
      x.last = performance.now(); if (x.s !== "on") setS(t, "on");
      if (m.startsWith("p:")) { try { dc.send("q:" + m.slice(2)); } catch (er) { /* */ } return; }
      if (m.startsWith("s:")) { drive(t, parseDrive(m), "dc"); return; }
      press(t, m);
    };
    await pc.setLocalDescription(await pc.createOffer());
    await gather(pc, 2500);
    if (x.pc !== pc || !sid) return;
    x.offered = sdpOf(pc); x.mine = candsOf(pc.localDescription.sdp); paintPanel();
    await signal.write("host", { sid, ["n" + t]: nonce, ["o" + t]: x.offered });
  }
  async function onPad(t, d) {
    const x = st[t];
    if (!d || !sid || d.sid !== sid) return;
    const dev = String(d.dev || "");
    if (d.left) {                                              // 5: chủ thoát ra màn chọn đội ⇒ nhả đội ngay
      if (x.owner && dev === x.owner && d.left !== x.leftSeen) { x.leftSeen = d.left; closePc(t); x.served = ""; setS(t, ""); setOwner(t, ""); }
      return;
    }
    if (!d.nonce) return;
    if (d.nonce !== x.served) {
      if (x.owner && dev && dev !== x.owner) return;           // 5: đội đã có iPad khác ⇒ bỏ qua lời chào (không mời qua lại)
      if (dev) setOwner(t, dev);
      offerTo(t, d.nonce).catch(e => console.warn("iPad offer", e)); return;
    }
    if (!d.answer && x.offered && (+d.hc || 0) > x.hc) { x.hc = +d.hc; signal.write("host", { sid, ["n" + t]: x.served, ["o" + t]: x.offered, ["h" + t]: x.hc }).catch(() => {}); }
    if (d.answer && x.pc && !x.pc.remoteDescription) {
      try { const a = JSON.parse(d.answer); x.theirs = candsOf(a.sdp); await x.pc.setRemoteDescription(a); paintPanel(); emit(t); } catch (e) { console.warn("iPad answer", e); }
    }
    const direct = x.dc && x.dc.readyState === "open";
    const rs = +d.rs || 0;
    if (rs > x.rs) {
      const q = String(d.rq || "").split(",").filter(Boolean), n = Math.min(rs - x.rs, q.length);
      x.rs = rs; q.slice(q.length - n).forEach(k => press(t, k));
      if (!direct) setS(t, "relay");
    }
    const sn = +d.sn || 0;
    if (sn > x.sn) { x.sn = sn; x.last = performance.now(); if (d.st && !direct) drive(t, parseDrive(d.st), "kho"); if (!direct) setS(t, "relay"); }
  }

  const TXT = { on: "Connected", relay: "SLOW — no direct link (fixing…)", wait: "Connecting…", "": "Scan with the iPad camera" };
  // 4f: dòng chẩn đoán — để biết VÌ SAO một iPad không nối thẳng được
  function diag(t) {
    const x = st[t];
    if (!x.served) return "";
    const a = [];
    if (x.s === "on") a.push("direct " + (x.pair || "…") + (x.rtt ? " · " + x.rtt + " ms" : ""));
    else if (x.ice) a.push("ICE " + x.ice);
    a.push("PC: " + candTxt(x.mine), "iPad: " + candTxt(x.theirs));
    if (x.tries > 1) a.push("try " + x.tries);
    return a.join(" · ");
  }
  function paintPanel() {
    if (!panelEl) return;
    panelEl.querySelectorAll(".sr-ipad-st").forEach(el => {
      const t = +el.dataset.t, s = st[t].s;
      el.dataset.s = s;
      el.querySelector("span").textContent = TXT[s] || TXT[""];
      const dg = el.parentNode.querySelector(".sr-ipad-dg"); if (dg) dg.textContent = diag(t);
    });
  }

  return {
    // 4f: gắn game vào đường nối. Lần đầu mới mở phiên (sid); các lần sau (game dựng lại) chỉ báo lại trạng thái + gửi lại chế độ / câu hỏi
    attach(c) {
      if (closed || !c) return;
      const k = ctls.indexOf(c); if (k >= 0) ctls.splice(k, 1); ctls.push(c); ctl = c;
      if (sid) { [0, 1].forEach(t => { if (st[t].s) ctl.status(t, st[t].s); resend(t); }); return; }
      sid = rid();
      signal.write("host", { sid, n0: "", o0: "", n1: "", o1: "", u0: "", u1: "", m0: cache[0].m ?? "", m1: cache[1].m ?? "", q0: cache[0].q ?? "", q1: cache[1].q ?? "" }).catch(e => { failMsg = (e && e.message) || "iPad link unavailable"; paintPanel(); console.warn("iPad link", e); });
      [0, 1].forEach(t => unsubs.push(signal.listen("pad" + t, d => onPad(t, d))));
      tick = setInterval(() => {                                    // im quá 4 s (iPad ngủ / rớt Wi-Fi) ⇒ "đang nối"
        st.forEach((x, t) => { if ((x.s === "on" || x.s === "relay") && performance.now() - x.last > 4000) setS(t, "wait"); });
        st.forEach((x, t) => { if (x.s === "on" && x.pc) probe(t); });   // độ trễ hiện tại cho dòng chẩn đoán
        st.forEach((x, t) => {                                    // 5: chủ đội mất hẳn > 8 s ⇒ nhả
          if (!x.owner) return;
          if (x.s === "on" || x.s === "relay") { x.lostAt = 0; return; }
          const now = performance.now(); if (!x.lostAt) x.lostAt = now; else if (now - x.lostAt > OWN_GRACE) { closePc(t); x.served = ""; setS(t, ""); setOwner(t, ""); }
        });
      }, 1000);
    },
    /** 4f: gỡ GAME khỏi đường nối (game bị huỷ / dựng lại) — đường nối vẫn sống */
    detach(c) {
      const k = ctls.indexOf(c || ctl); if (k >= 0) ctls.splice(k, 1);
      const top = ctls[ctls.length - 1] || null; if (top === ctl) return;
      ctl = top; if (ctl) [0, 1].forEach(t => { if (st[t].s) ctl.status(t, st[t].s); });
    },
    /** đóng thật: rời hẳn game */
    close() {
      if (closed) return; closed = true; ctl = null; ctls.length = 0; clearInterval(tick);
      unsubs.splice(0).forEach(f => { try { f(); } catch (e) { /* */ } });
      [0, 1].forEach(closePc); subs.clear();
      const old = sid; sid = "";
      if (old) signal.write("host", { sid: "", n0: "", o0: "", n1: "", o1: "", u0: "", u1: "" }).catch(() => {});
    },
    get closed() { return closed; },
    /** 4f: màn lớn bảo iPad đội t bắt tay lại (nút Reconnect) */
    reconnect(t) { const x = st[t]; if (!sid) return; x.kick++; signal.write("host", { sid, ["k" + t]: x.kick + ":" + rid() }).catch(() => {}); },
    /** 4f: trạng thái 1 đội cho thẻ thử xưởng */
    live(t) { const x = st[t]; return { owner: x.owner, s: x.s, steer: x.steer, at: x.at, tl: !!x.tl, tr: !!x.tr, rtt: x.rtt, pair: x.pair, tries: x.tries, diag: diag(t), url: padUrl(t) }; },
    onChange(f) { subs.add(f); return () => subs.delete(f); },
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
          <div class="sr-ipad-dg" style="font-size:11px;opacity:.7;margin-top:4px;min-height:1.3em"></div>
          <div class="sr-ipad-url">${url.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</div></div>`;
      }).join("")}</div>
      <p class="sr-pn-note">Scan with the iPad camera. ${note}${failMsg ? `<br><b class="sr-ipad-err">${failMsg}</b>` : ""}</p>`;
      paintPanel();
    },
    panelClosed() { panelEl = null; },
    get state() { return st.map(x => ({ s: x.s, served: x.served, dc: x.dc ? x.dc.readyState : "", ice: x.pc ? x.pc.iceConnectionState : "", tries: x.tries, pair: x.pair, mine: x.mine, theirs: x.theirs })); },
  };
}

// =================================================================== iPAD
// onState({ s: "nogame" | "connecting" | "on" | "relay", rtt }) · onInfo({ kmh, cells, ms, alarm, phase, nitro }) · onMode(0|1|2) · onQ({ n, ph, q, a, lock, pick, ok, rev })
// onSteer({ mode, max, smooth }) — kiểu lái do màn lớn chọn
export function createPadClient({ signal, team, onState, onInfo, onMode, onQ, onSteer }) {
  const me = "pad" + (team ? 1 : 0), t = team ? 1 : 0, dev = padDev();
  let taken = false, owned = false;                           // 5: đội đã có iPad khác · mình đang là chủ
  let sid = "", nonce = "", pc = null, dc = null, answered = false, rs = 0, rq = [], sn = 0, s = "", rtt = 0, ping = 0, pingAt = new Map(), relayT = 0, dead = false, tries = 0;
  let cur = "s:0,0,0", lastSent = "", sentAt = 0, relayAt = 0, relayPend = 0, mode = null, qRaw = "";
  let retryT = 0, retryN = 0, discT = 0, kick = null;          // 4f: tự bắt tay lại
  const RETRY = [5000, 6000, 8000, 12000, 20000];
  const gotMode = v => { const m = +v || 0; if (v === "" || v == null || m === mode) return; mode = m; onMode && onMode(m); };
  const gotQ = v => { if (!v || v === qRaw) return; qRaw = v; try { onQ && onQ(JSON.parse(v)); } catch (e) { /* */ } };
  let cRaw = "", lastInfo = { kmh: 0, cells: 0, ms: 0, alarm: 0, phase: "", nitro: 0 };
  const gotSteer = v => { if (!v || v === cRaw) return; cRaw = v; try { onSteer && onSteer(JSON.parse(v)); } catch (e) { /* */ } };
  const gotRelay = v => {
    if (!v || (dc && dc.readyState === "open")) return;                  // nối thẳng ⇒ đã có "i:" 4 lần/giây
    const [ms, ph] = String(v).split(","); lastInfo = { ...lastInfo, ms: +ms || 0, phase: ph || lastInfo.phase }; onInfo && onInfo(lastInfo);
  };
  const set = v => { if (v === s) return; s = v; onState && onState({ s, rtt, tries: retryN }); };
  const open = () => !!(dc && dc.readyState === "open");
  function closePc() { try { dc && dc.close(); } catch (e) { /* */ } try { pc && pc.close(); } catch (e) { /* */ } pc = dc = null; clearTimeout(discT); }
  // 4f: hẹn bắt tay lại khi kênh thẳng chưa mở (nấc 5 · 6 · 8 · 12 · 20 s, rồi cứ 20 s) — đang lái qua kho thì vẫn lái tiếp
  function planRetry(ms) {
    clearTimeout(retryT);
    retryT = setTimeout(() => { if (dead || !sid || open()) return; retryN++; hello(true); }, ms != null ? ms : RETRY[Math.min(retryN, RETRY.length - 1)]);
  }
  function hello(keep) {
    if (!sid || dead || taken) return;
    closePc(); nonce = rid(); answered = false; rs = 0; rq = []; sn = 0; tries = 0; clearTimeout(relayT);
    if (!(keep && s === "relay")) set("connecting");
    signal.write(me, { sid, nonce, dev, left: "", answer: "", rs: 0, rq: "", sn: 0, st: "" }).catch(e => console.warn("pad hello", e));
    planRetry(Math.max(9000, RETRY[Math.min(retryN, RETRY.length - 1)] + 3000));   // lỡ máy chiếu không trả lời ⇒ vẫn thử lại
  }
  async function answer(offer) {
    answered = true;
    const my = nonce;
    pc = new RTCPeerConnection({ iceServers: ICE });
    const mine = pc;
    pc.oniceconnectionstatechange = () => {                    // 4f: ICE hỏng / đứt lâu ⇒ bắt tay lại sớm
      if (pc !== mine || dead) return;
      const k = mine.iceConnectionState;
      clearTimeout(discT);
      if (k === "failed") planRetry(1000);
      else if (k === "disconnected") discT = setTimeout(() => { if (pc === mine && mine.iceConnectionState === "disconnected") planRetry(0); }, 3000);
    };
    pc.ondatachannel = e => {
      dc = e.channel;
      dc.onopen = () => { if (pc === mine) { clearTimeout(relayT); clearTimeout(retryT); retryN = 0; set("on"); } };
      dc.onclose = () => { if (pc === mine && !dead) { set("connecting"); setTimeout(() => { if (pc === mine) hello(); }, 800); } };
      dc.onmessage = ev => {
        const m = String(ev.data);
        if (m.startsWith("q:")) { const t0 = pingAt.get(m.slice(2)); if (t0) { rtt = Math.round(performance.now() - t0); pingAt.delete(m.slice(2)); onState && onState({ s, rtt, tries: retryN }); } return; }
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
    relayT = setTimeout(() => { if (pc === mine && !open()) { set("relay"); } }, 6000);
    planRetry();
  }
  const unsub = signal.listen("host", d => {
    if (dead) return;
    if (!d || !d.sid) { sid = ""; closePc(); clearTimeout(retryT); set("nogame"); return; }
    if (d["m" + t] != null) gotMode(d["m" + t]);
    if (d["q" + t]) gotQ(d["q" + t]);
    if (d["c" + t]) gotSteer(d["c" + t]);
    if (d["r" + t]) gotRelay(d["r" + t]);
    const k = d["k" + t] || "";
    // 5: đội đã có chủ là máy KHÁC ⇒ đứng yên báo "taken" (không chào, không giành); chủ nhả ⇒ tự chào
    const u = d["u" + t] || "";
    owned = u === dev;
    if (u && u !== dev) { if (!taken) { taken = true; sid = d.sid; nonce = ""; answered = false; closePc(); clearTimeout(retryT); clearTimeout(relayT); set("taken"); } return; }
    if (taken) { taken = false; sid = d.sid; kick = k; retryN = 0; hello(); return; }
    if (d.sid !== sid) { sid = d.sid; kick = k; retryN = 0; hello(); return; }
    if (kick !== null && k && k !== kick) { kick = k; retryN = 0; hello(true); return; }   // 4f: màn lớn bấm Reconnect
    kick = k;
    if (!answered && nonce && d["n" + t] === nonce && d["o" + t]) answer(d["o" + t]).catch(e => { console.warn("pad answer", e); set("relay"); planRetry(); });
  });
  const beat = setInterval(() => {
    if (open()) { const n = String(++ping); pingAt.set(n, performance.now()); if (pingAt.size > 20) pingAt.delete(pingAt.keys().next().value); try { dc.send("p:" + n); } catch (e) { /* */ } }
  }, 1000);
  const nudge = setInterval(() => {
    if (dead || !sid || !nonce || s === "on" || answered || tries >= 8) return;
    tries++; signal.write(me, { sid, nonce, hc: tries }).catch(() => {});
  }, 4000);
  // nhắc lại trạng thái lái khi ĐANG GIỮ (game nhả nếu im > 450 ms) · đường kho: ≤ 5 lần/giây khi đổi + NHỊP TIM 1,5 s (4f)
  function pushState(force) {
    const now = performance.now(), idle = cur === "s:0,0,0";
    if (open()) {
      if (force || cur !== lastSent || (!idle && now - sentAt > 120)) { try { dc.send(cur); lastSent = cur; sentAt = now; } catch (e) { /* */ } }
      return;
    }
    if (!sid || !nonce || s !== "relay" && !answered) return;
    if (cur === lastSent && !force && now - relayAt < 1500) return;
    if (now - relayAt < 200) { relayPend = 1; return; }
    relayAt = now; relayPend = 0; lastSent = cur; sn++;
    signal.write(me, { sid, nonce, sn, st: cur }).catch(e => console.warn("pad relay", e));
  }
  const rep = setInterval(() => pushState(!!relayPend), 60);
  const onVis = () => { if (document.visibilityState === "visible" && sid && !open()) { retryN = 0; hello(true); } };
  document.addEventListener("visibilitychange", onVis);
  return {
    /** tay lái: steer −1..1, boost/brake 0|1 */
    drive(steer, boost, brake) { cur = "s:" + Math.round(Math.max(-1, Math.min(1, steer)) * 100) + "," + (boost ? 1 : 0) + "," + (brake ? 1 : 0); pushState(false); },
    /** trả lời câu số n bằng đáp án k (chế độ 1) */
    answer(k, n) { return this.send("a:" + k + ":" + n); },
    get mode() { return mode; },
    send(k) {
      if (!isKey(k)) return false;
      if (open()) { dc.send(k); return true; }
      if (!sid || !nonce) return false;
      rs++; rq.push(k); if (rq.length > 4) rq.shift();
      signal.write(me, { sid, nonce, rs, rq: rq.join(",") }).catch(e => console.warn("pad relay", e));
      return true;
    },
    get state() { return { s, rtt, tries: retryN, dc: dc ? dc.readyState : "", ice: pc ? pc.iceConnectionState : "" }; },
    reconnect() { retryN = 0; hello(true); },
    destroy() {
      if (!dead && sid && !taken && (owned || nonce)) signal.write(me, { sid, dev, nonce: "", answer: "", left: rid() }).catch(() => {});   // 5: thoát ra màn chọn đội ⇒ nhả đội
      dead = true; clearInterval(beat); clearInterval(nudge); clearInterval(rep); clearTimeout(relayT); clearTimeout(retryT); clearTimeout(discT); document.removeEventListener("visibilitychange", onVis); try { unsub(); } catch (e) { /* */ } closePc(); },
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
