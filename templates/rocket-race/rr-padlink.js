// ⚠️ ĐỢT 511 — CHÉP từ myGame rocket-race/core/rr-padlink-9.js (mẫu 9, myGame 4755fe1). Sửa ở myGame trước (mẫu mới) rồi chép lại; chỉ đổi đường import.
// ROCKET RACE mẫu 9 — ĐƯỜNG NỐI iPAD ⇄ MÀN CHƠI cho chế độ iPAD THAM GIA GAME (13/10/2026, thầy: "tham gia game thì sẽ chuyển toàn bộ
// phần bắn tên lửa và tránh vào ipad. Trên màn hình game vẫn hiển thị nhưng điều khiển ở ipad"). Thầy chốt: 2 iPad (mỗi đội 1),
// màn lớn VẪN bấm được (cả hai cùng điều khiển), iPad có nút BẮN + BOOST, báo động tên lửa tới, tiếng/rung, vị trí 2 tàu.
//
// Gốc = SPEED RUN `speed-run/core/sr3d-padlink-2.js` (bản HAI CHIỀU của STAR LOOT 2q `mc3d-padlink-2q.js` — thầy đã thử iPad thật 05/10 OK).
// Khác SPEED RUN: không có tay lái liên tục — iPad chỉ gửi lệnh RỜI; game gửi xuống TRẠNG THÁI kho tên lửa + SỰ KIỆN.
//
//   iPad → game:  "fire" | "boost" | "load"     — lệnh rời (y như chạm ô to / BOOST / hàng quả nhỏ trên màn lớn)
//                 "p:<n>"                        — nhịp tim (game trả "q:<n>" ⇒ iPad đo độ trễ)
//   game → iPad:  "i:<JSON>"                     — TRẠNG THÁI (game gửi ~10 lần/giây, chỉ khi đổi; xem rrPadState trong trang mẫu)
//                 "e:<tên>"                      — SỰ KIỆN cho tiếng/rung trên iPad: mplus · fire · boost · dodge · hit · refuse-fire ·
//                                                  refuse-boost · win · lose
//
// Bắt tay y như 2q: kho `signal` 3 tài liệu MỖI TÀI LIỆU 1 NGƯỜI GHI ("host" / "pad0" / "pad1"), sid phiên + nonce iPad, nudge 4 s × 8.
// Đường DỰ PHÒNG qua kho (Wi-Fi chặn nối thẳng): iPad ghi `rs`/`rq` (đuôi ≤ 4 lệnh). ⚠️ Đường kho KHÔNG gửi ngược ⇒ iPad đi đường kho
// vẫn bắn/BOOST được nhưng không thấy trạng thái (hiện "slow link"). ⛔ Không so đồng hồ 2 máy — chỉ so sid/nonce/số đếm.

const ICE = [{ urls: "stun:stun.l.google.com:19302" }];
// ⭐ Đợt 514: "fire0"/"fire1" = bắn ĐÚNG quả to ô 0 / ô 1 (bảng iPad mới — chạm quả nào bắn quả đó)
export const PAD_KEYS = new Set(["fire", "fire0", "fire1", "boost", "load"]);
const rid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
function gather(pc, ms) {
  return new Promise(res => {
    if (pc.iceGatheringState === "complete") return res();
    const t = setTimeout(res, ms);
    pc.addEventListener("icegatheringstatechange", () => { if (pc.iceGatheringState === "complete") { clearTimeout(t); res(); } });
  });
}
const sdpOf = pc => JSON.stringify({ type: pc.localDescription.type, sdp: pc.localDescription.sdp });
export const TEAM_META = [{ name: "TEAM 1", color: "#3b8cff" }, { name: "TEAM 2", color: "#ff7a00" }];   // = DEFAULT_TEAMS của rr3d-view.js

// =================================================================== MÁY CHIẾU
// ctl = { press(team, "fire"|"boost"|"load"), status(team, "on"|"relay"|"wait"|"") }
export function createPadHost({ signal, padUrl }) {
  let ctl = null, sid = "", unsubs = [], tick = 0, panelEl = null, failMsg = "";
  const st = [0, 1].map(() => ({ pc: null, dc: null, served: "", offered: "", hc: 0, last: 0, rs: 0, s: "", sent: "" }));
  // c0/c1 trong tài liệu host = đội đó ĐANG có iPad nối ⇒ màn chọn đội trên iPad ghi "đã có iPad" (chỉ ghi khi đổi có/không)
  const busy = s => s === "on" || s === "relay";
  const setS = (t, s) => {
    const x = st[t]; if (x.s === s) return;
    const was = busy(x.s); x.s = s; if (s === "on") x.sent = "";
    if (sid && was !== busy(s)) signal.write("host", { sid, ["c" + t]: busy(s) ? 1 : 0 }).catch(() => {});
    ctl && ctl.status(t, s); paintPanel();
  };
  const press = (t, k) => { st[t].last = performance.now(); if (PAD_KEYS.has(k) && ctl) ctl.press(t, k); };
  function closePc(t) { const x = st[t]; try { x.dc && x.dc.close(); } catch (e) { /* */ } try { x.pc && x.pc.close(); } catch (e) { /* */ } x.pc = x.dc = null; }

  async function offerTo(t, nonce) {
    const x = st[t];
    // (Đợt 511 cũ: iPad đến sau giành quyền + báo "k:" — Đợt 514 bỏ: đội đang có iPad thì onPad đã từ chối trước khi tới đây)
    closePc(t);
    x.served = nonce; x.offered = ""; x.hc = 0; x.rs = 0; setS(t, "wait");
    const pc = new RTCPeerConnection({ iceServers: ICE }); x.pc = pc;
    const dc = pc.createDataChannel("pad", { ordered: true }); x.dc = dc;
    dc.onopen = () => { if (x.dc === dc) { x.last = performance.now(); setS(t, "on"); } };
    dc.onclose = () => { if (x.dc === dc) setS(t, "wait"); };
    dc.onmessage = e => {
      if (x.dc !== dc) return;
      const m = String(e.data);
      x.last = performance.now(); if (x.s !== "on") setS(t, "on");
      if (m.startsWith("p:")) { try { dc.send("q:" + m.slice(2)); } catch (er) { /* */ } return; }
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
    if (d.nonce !== x.served) {
      // ⭐ Đợt 514 (thầy 14/10): đội đang có iPad khác nối (còn nghe tiếng trong 4 s) ⇒ TỪ CHỐI, không giành (ghi x<t> = nonce bị từ chối)
      if (x.served && busy(x.s) && performance.now() - x.last < 4000) { if (x.rejected !== d.nonce) { x.rejected = d.nonce; signal.write("host", { sid, ["x" + t]: d.nonce }).catch(() => {}); } return; }
      offerTo(t, d.nonce).catch(e => console.warn("iPad offer", e)); return;
    }
    // iPad "đá lại" (hc tăng) mà chưa có answer ⇒ nó chưa thấy offer (lần báo bị rơi) ⇒ ghi lại offer + h_t mới
    if (!d.answer && x.offered && (+d.hc || 0) > x.hc) { x.hc = +d.hc; signal.write("host", { sid, ["n" + t]: x.served, ["o" + t]: x.offered, ["h" + t]: x.hc }).catch(() => {}); }
    if (d.answer && x.pc && !x.pc.remoteDescription) {
      try { await x.pc.setRemoteDescription(JSON.parse(d.answer)); } catch (e) { console.warn("iPad answer", e); }
    }
    const direct = x.dc && x.dc.readyState === "open";
    const rs = +d.rs || 0;
    if (rs > x.rs) {                                                   // đường dự phòng: iPad ghi lệnh vào kho khi kênh thẳng chưa mở
      const q = String(d.rq || "").split(",").filter(Boolean), n = Math.min(rs - x.rs, q.length);
      x.rs = rs; q.slice(q.length - n).forEach(k => press(t, k));
      if (!direct) setS(t, "relay");
    }
  }

  function paintPanel() {
    if (!panelEl) return;
    panelEl.querySelectorAll(".rp-ipad-st").forEach(el => {
      const t = +el.dataset.t, s = st[t].s;
      el.dataset.s = s;
      el.querySelector("span").textContent = s === "on" ? "iPad connected" : s === "relay" ? "iPad connected (slow — no direct link)" : s === "wait" ? "Connecting…" : "Waiting for an iPad";
    });
  }

  return {
    attach(c) {
      if (ctl) return;
      ctl = c; sid = rid();
      signal.write("host", { sid, n0: "", o0: "", n1: "", o1: "", c0: 0, c1: 0, x0: "", x1: "" }).catch(e => { failMsg = (e && e.message) || "iPad link unavailable"; paintPanel(); console.warn("iPad link", e); });
      [0, 1].forEach(t => unsubs.push(signal.listen("pad" + t, d => onPad(t, d))));
      tick = setInterval(() => {                                    // im quá 4 s (iPad ngủ / rớt Wi-Fi) ⇒ "đang nối"
        st.forEach((x, t) => { if ((x.s === "on" || x.s === "relay") && performance.now() - x.last > 4000) setS(t, "wait"); });
      }, 1000);
    },
    detach() {
      if (!ctl) return;
      const c = ctl; ctl = null; clearInterval(tick);
      unsubs.splice(0).forEach(f => { try { f(); } catch (e) { /* */ } });
      [0, 1].forEach(t => { closePc(t); st[t].s = ""; c.status(t, ""); });
      paintPanel();
      const old = sid; sid = "";
      if (old) signal.write("host", { sid: "", n0: "", o0: "", n1: "", o1: "", c0: 0, c1: 0 }).catch(() => {});
    },
    get attached() { return !!ctl; },
    /** game → iPad: trạng thái (object) — chỉ gửi khi KHÁC lần trước; kênh thẳng mới gửi được */
    state(t, obj) {
      const x = st[t]; if (!(x.dc && x.dc.readyState === "open")) return;
      const m = "i:" + JSON.stringify(obj); if (m === x.sent) return;
      try { x.dc.send(m); x.sent = m; } catch (e) { /* */ }
    },
    /** game → iPad: sự kiện cho tiếng/rung */
    event(t, name) { const x = st[t]; if (x.dc && x.dc.readyState === "open") { try { x.dc.send("e:" + name); } catch (e) { /* */ } } },
    status: t => st[t].s,
    // ⭐ 13/10 (thầy): KHÔNG quét QR — iPad đã đăng nhập cùng tài khoản AWord: trang chủ ▸ nút iPad ▸ chọn đội ⇒ tự vào màn tên lửa
    panel(el) {
      panelEl = el;
      el.innerHTML = `<div class="rp-ipad">${[0, 1].map(t => {
        const m = TEAM_META[t];
        return `<div class="rp-ipad-card" style="--tc:${m.color}"><h3>${m.name}</h3>
          <div class="rp-ipad-st" data-t="${t}"><i></i><span></span></div></div>`;
      }).join("")}</div>
      <p class="rp-ipad-note">On each iPad: AWord home ▸ <b>iPad</b> button ▸ choose the team. The iPad switches to the missile console by itself
      (FIRE · BOOST · incoming-missile alarm). The big screen keeps showing everything — and its buttons still work.${failMsg ? `<br><b class="rp-ipad-err">${failMsg}</b>` : ""}</p>`;
      paintPanel();
    },
    panelClosed() { panelEl = null; },
    get debug() { return st.map(x => ({ s: x.s, served: x.served, dc: x.dc ? x.dc.readyState : "", ice: x.pc ? x.pc.iceConnectionState : "" })); },
  };
}

// =================================================================== iPAD
// onState({ s: "nogame" | "connecting" | "on" | "relay" | "kicked", rtt }) · onInfo(obj) · onEvent(name)
// "kicked" = một iPad khác vừa chọn CÙNG đội và giành quyền ⇒ iPad này đứng yên (không tự chào lại) tới khi gọi reconnect() (giành lại).
export function createPadClient({ signal, team, onState, onInfo, onEvent }) {
  const me = "pad" + (team ? 1 : 0), t = team ? 1 : 0;
  let sid = "", nonce = "", pc = null, dc = null, answered = false, rs = 0, rq = [], s = "", rtt = 0, ping = 0, pingAt = new Map(), relayT = 0, dead = false, tries = 0, kicked = false;
  const set = v => { if (v === s) return; s = v; onState && onState({ s, rtt }); };
  function closePc() { try { dc && dc.close(); } catch (e) { /* */ } try { pc && pc.close(); } catch (e) { /* */ } pc = dc = null; }
  function hello() {
    if (!sid || dead || kicked) return;
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
        if (m.startsWith("q:")) { const t0 = pingAt.get(m.slice(2)); if (t0) { rtt = Math.round(performance.now() - t0); pingAt.delete(m.slice(2)); onState && onState({ s, rtt }); } return; }
        if (m.startsWith("i:")) { if (onInfo) { try { onInfo(JSON.parse(m.slice(2))); } catch (er) { /* */ } } return; }
        if (m.startsWith("e:")) { onEvent && onEvent(m.slice(2)); return; }
        if (m.startsWith("k:")) { kicked = true; clearTimeout(relayT); closePc(); set("kicked"); }
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
    if (d.sid !== sid) { sid = d.sid; kicked = false; hello(); return; }   // trận mới ⇒ bỏ trạng thái bị giành (chỉ 1 lần giành, không lặp)
    if (!answered && nonce && d["n" + t] === nonce && d["o" + t]) { answer(d["o" + t]).catch(e => { console.warn("pad answer", e); set("relay"); }); return; }
    // ⭐ Đợt 514: máy chủ từ chối (đội đã có iPad) ⇒ "taken"; vẫn đá lại mỗi 4 s, iPad kia rời là tự vào
    if (!answered && nonce && d["x" + t] === nonce && s !== "taken") { set("taken"); tries = 0; }
  });
  const beat = setInterval(() => {
    if (dc && dc.readyState === "open") { const n = String(++ping); pingAt.set(n, performance.now()); if (pingAt.size > 20) pingAt.delete(pingAt.keys().next().value); try { dc.send("p:" + n); } catch (e) { /* */ } }
  }, 1000);
  // ĐÁ LẠI: kho bắt tay có thể làm rơi MỘT lần báo ⇒ chưa nối thẳng thì cứ 4 s ghi lại tài liệu của mình (cùng nonce, tăng `hc`), tối đa 8 lần
  const nudge = setInterval(() => {
    if (dead || kicked || !sid || !nonce || s === "on" || (tries >= 8 && s !== "taken")) return;   // Đợt 514: "taken" ⇒ đá lại mãi
    tries++; signal.write(me, { sid, nonce, hc: tries }).catch(() => {});
  }, 4000);
  const onVis = () => { if (document.visibilityState === "visible" && sid && !(dc && dc.readyState === "open")) hello(); };
  document.addEventListener("visibilitychange", onVis);
  return {
    send(k) {
      if (!PAD_KEYS.has(k)) return false;
      if (dc && dc.readyState === "open") { dc.send(k); return true; }
      if (!sid || !nonce) return false;
      rs++; rq.push(k); if (rq.length > 4) rq.shift();
      signal.write(me, { sid, nonce, rs, rq: rq.join(",") }).catch(e => console.warn("pad relay", e));
      return true;
    },
    get state() { return { s, rtt, dc: dc ? dc.readyState : "", ice: pc ? pc.iceConnectionState : "" }; },
    reconnect() { kicked = false; hello(); },              // giành lại đội sau khi bị iPad khác giành
    destroy() { dead = true; clearInterval(beat); clearInterval(nudge); clearTimeout(relayT); document.removeEventListener("visibilitychange", onVis); try { unsub(); } catch (e) { /* */ } closePc(); },
  };
}

// =================================================================== KHO BẮT TAY CỤC BỘ (bàn thử myGame: 2 tab cùng trình duyệt)
export function localSignal(room = "rrpad9") {
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
