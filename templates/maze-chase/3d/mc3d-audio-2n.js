// STAR LOOT — ÂM THANH (mẫu 2n, 02/10/2026): chép mc3d-audio-2m.js + close() (AWord dỡ game ⇒ tắt hẳn, trả AudioContext).
// ---- ghi chú 2m: STAR LOOT — ÂM THANH (mẫu 2m, 01/10/2026). Chép mc3d-audio-2l.js + thầy: tìm thấy / không thấy = tiếng MÁY MÓC, TÍN HIỆU (quét radar `intro.scan`,
//   không thấy = báo lỗi `tu_choi`, thấy = sonar + khoá mục tiêu) · nhạc chơi = "Interstellar Adventure – Space Theme Soundtrack" · nhạc kết thúc HÙNG TRÁNG:
//   thắng = "Path To Glory", thua = "Last Hero" (cả hai qua music() ⇒ chơi lại / về màn chờ thì mờ chéo, không chồng) · quà bom = chuông (`gift`, trước dùng nhạc thắng).
// ---- ghi chú 2l: STAR LOOT — ÂM THANH (mẫu 2l, 01/10/2026). Chép mc3d-audio-2k.js + thầy: nhạc chính = "Space Cinematic Epic" (bản B của 2k) ·
//   NOT FOUND = dàn dây hụt hẫng (`intro.notFound`) · ENEMY LOCATED = kèn đồng dứt khoát "tìm thấy rồi" (`intro.found`).
// ---- ghi chú 2k: STAR LOOT — ÂM THANH (mẫu 2k, 01/10/2026). Chép mc3d-audio-2j.js + ý thầy: bỏ nốt tiếng "teleport" điện tử ⇒ tiếng THẬT theo từng việc
//   (robot bị hút vào cổng = gió hút ngược `gateIn`, cổng hiện = gió trầm `gateOpen`, cổng tắt = gió vút nhẹ `gateClose`, robot trồi từ nắp boong =
//   xì thuỷ lực + khớp máy `hatch`, robot bay lên trời = động cơ ba lô `flyUp`) · nhạc thua = guitar + violin thật · nhạc nền chơi bớt du dương,
//   mạnh hơn chút: "Sci-Fi Inspiring" (mặc định) — thử bản "Space Cinematic Epic" bằng ?nhac=b.
// ---- ghi chú 2j: STAR LOOT — ÂM THANH (mẫu 2j, 01/10/2026). Chép mc3d-audio-2i.js + ý thầy:
//   • Chữ HUD intro (ENEMY LOCATED, POSITION/TARGET, tên thiên hà, NOT FOUND…) hiện từng chữ ⇒ tiếng GÕ PHÍM thật chạy đúng thời gian gõ (`intro.type`).
//   • Tàu ANDREW bắn tàu con: tiếng súng / trúng / nổ xa, âm lượng = 1/3 bình thường (`ship(kind)`).
//   • Lỗ không gian mở / đóng, tàu chui ra / chui vào ⇒ tiếng NỔ (`intro.hole`).
//   • Bỏ nhạc chơi dồn dập ⇒ giữ tiếng ù boong tàu + nhạc vũ trụ du dương kiểu Interstellar (`nhac_vutru`) suốt lúc chơi.
//   • Báo động = còi HÚ lên xuống "ào ao" (1 vòng hú 1,875 s = đúng 3 nhịp đèn đỏ) thay còi cũ.
//   • Bỏ mọi tiếng "tít" điện tử: đếm ngược = chốt khoá kim loại, GO = nhả chốt + xả khí, đúng = chuông ding thật, sai = va kim loại,
//     bấm nút = công tắc thật, hiện câu hỏi = tiếng gió vút. Robot nổ (mình + địch) = tiếng nổ thật. Bước chân = bước trên sàn kim loại (khẽ).
//   • Nút loa: 2 công tắc EFFECTS / BACKGROUND như Rocket Race (nhớ theo máy) — `prefs` / `setPrefs`.
// ---- ghi chú 2i: STAR LOOT — ÂM THANH THẬT (mẫu 2i, 30/9/2026). Thay hẳn bộ tiếng tổng hợp (mc3d-sound-1p.js, "tiếng hoạt hình") bằng FILE THU ÂM THẬT
//   chuẩn điện ảnh trong thư mục ../am-thanh/ (nguồn Pixabay — giấy phép Pixabay: dùng miễn phí trong game, không cần ghi tên; danh sách
//   nguồn từng file ở ../am-thanh/NGUON.md). Giữ nguyên tên hàm của bộ cũ ⇒ lõi game gọi y như trước.
//   Kênh: master → nén mềm (DynamicsCompressor) → loa · music / sfx / amb (tiếng nền) / intro (tắt được một lượt khi bỏ qua intro).
//   Nhạc: một bài chạy tại một thời điểm, đổi bài = mờ chéo; tiếng nổ lớn ⇒ nhạc nhỏ xuống thoáng chốc (duck).
//   Tải trước: file tải về (fetch) ngay khi mở trang; giải mã khi có AudioContext (sau cú bấm đầu tiên). File thiếu ⇒ im lặng, không lỗi.
const DIR = new URL("../am-thanh/", import.meta.url).href;
// id: { v: âm lượng trộn, bus, loop }
const LIB = {
  nhac_menu: { v: 0.55, bus: "music", loop: true }, nhac_intro: { v: 1.0, bus: "music" },   /* 2j: bỏ nhac_choi (dồn dập) */
  thang2: { v: 0.85, bus: "music" }, thua3: { v: 0.85, bus: "music" },   /* 2m: nhạc kết thúc hùng tráng */   /* 2k: nhac_thua2 = guitar + violin thật */
  dong_co_tau: { v: 0.2, bus: "intro", loop: true }, dong_co_khoi: { v: 0.8, bus: "intro" }, tau_bay_qua: { v: 0.75, bus: "intro" },
  tang_toc: { v: 0.9, bus: "intro" }, lo_giun: { v: 0.9, bus: "intro" }, braam: { v: 0.85, bus: "intro" }, tieng_dong: { v: 0.8, bus: "intro" },
  riser: { v: 0.5, bus: "intro" }, cua_khoang: { v: 0.7, bus: "intro" }, xi_hoi: { v: 0.45, bus: "intro" },
  jetpack: { v: 0.4, bus: "intro", loop: true }, servo: { v: 0.7, bus: "sfx" }, kim_loai: { v: 0.55, bus: "intro" },
  // 2j
  go_phim: { v: 0.55, bus: "intro" }, no_lo: { v: 0.8, bus: "intro" }, no_lo_b: { v: 0.8, bus: "intro" },
  ban_laser: { v: 0.6 / 3 }, no_xa: { v: 1.0 / 3 }, no_robot_b: { v: 0.8 },   // ban_laser / no_xa: tàu bắn nhau = 1/3 âm lượng thường
  coi_hu: { v: 0.32, bus: "sfx", loop: true },
  khoa_dem: { v: 0.7 }, chot_nha: { v: 0.7 }, xa_khi: { v: 0.55 }, chuong_dung: { v: 0.6 }, kim_loai_sai: { v: 0.6 }, cong_tac: { v: 0.7 },
  vut_gio: { v: 0.5 }, no_robot: { v: 0.95 }, buoc_kl: { v: 0.5 },
  tuong_dung: { v: 0.65 }, nap_boong: { v: 0.85 },   /* 2j: bỏ click/hien_cau_hoi/dem_nguoc/go/buoc_chan/dung/sai/dich_xuat_hien/hud_beep/bao_dong (tiếng tít điện tử) */
  trung_don: { v: 1.5 },   /* 2k: bỏ dich_chuyen (teleport điện tử) */
  cong_hut: { v: 0.6 }, cong_mo: { v: 0.5 }, quet: { v: 0.45, bus: "intro" }, tu_choi: { v: 0.6, bus: "intro" }, khoa_muc_tieu: { v: 0.45, bus: "intro" }, sonar: { v: 0.6, bus: "intro" }, nhac_vt2: { v: 0.5, bus: "music", loop: true }   /* 2m */,   // 2k
  tich_tac: { v: 0.45 }, bom_no: { v: 0.9 }, ong_boong: { v: 0.3, bus: "amb", loop: true },
};

const PREF_KEY = "starloot.sound";   // 2j: { fx, bg } nhớ theo máy
function readPrefs() { try { const p = JSON.parse(localStorage.getItem(PREF_KEY) || "null"); if (p && typeof p === "object") return { fx: p.fx !== false, bg: p.bg !== false }; } catch (e) { /* bỏ qua */ } return { fx: true, bg: true }; }
function savePrefs(p) { try { localStorage.setItem(PREF_KEY, JSON.stringify(p)); } catch (e) { /* bỏ qua */ } }
const STEPS = [0.05, 0.42, 0.74, 1.07, 1.39, 1.72, 2.05, 2.38, 2.71, 3.08];   // 2j: chỗ từng bước trong buoc_kl.mp3

const TRACK = "nhac_vt2";   // 2m: nhạc kiểu Interstellar / vũ trụ (2l: Space Cinematic Epic)

export function createMcSound() {
  let ac = null, master = null, muted = false;
  const prefs = readPrefs();
  const fxG = () => (prefs.fx ? 1 : 0), bgG = () => (prefs.bg ? 1 : 0);
  const bus = {}, buf = {}, raw = {};
  // tải trước file (chưa cần AudioContext)
  Object.keys(LIB).forEach(id => { raw[id] = fetch(DIR + id + ".mp3").then(r => (r.ok ? r.arrayBuffer() : null)).catch(() => null); });
  function decodeAll() {
    Object.keys(LIB).forEach(id => {
      if (buf[id] !== undefined) return; buf[id] = null;
      raw[id].then(ab => (ab ? ac.decodeAudioData(ab.slice(0)) : null)).then(b => { buf[id] = b || false; if (b && pend[id]) pend[id].forEach(f => f()); delete pend[id]; }).catch(() => { buf[id] = false; delete pend[id]; });
    });
  }
  const pend = {};   // lệnh phát trong lúc file đang giải mã (vd nhạc intro lúc vừa bấm START) ⇒ phát ngay khi xong nếu còn kịp
  let closed = false;   // 2n: đã close() ⇒ không bao giờ mở AudioContext mới
  function ensure() {
    if (closed) return false;
    if (ac) { if (ac.state === "suspended") ac.resume(); return true; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ac = new AC();
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 3.5; comp.attack.value = 0.004; comp.release.value = 0.25;
    master = ac.createGain(); master.gain.value = muted ? 0 : 1; master.connect(comp).connect(ac.destination);
    // 2j: 2 nhóm theo nút loa — BACKGROUND (nhạc + tiếng nền) · EFFECTS (hiệu ứng + tiếng intro)
    bus.bg = ac.createGain(); bus.bg.gain.value = bgG(); bus.bg.connect(master);
    bus.fx = ac.createGain(); bus.fx.gain.value = fxG(); bus.fx.connect(master);
    bus.music = ac.createGain(); bus.music.connect(bus.bg);
    bus.sfx = ac.createGain(); bus.sfx.connect(bus.fx);
    bus.amb = ac.createGain(); bus.amb.connect(bus.bg);
    newIntroBus();
    decodeAll();
    return true;
  }
  function newIntroBus() { bus.intro = ac.createGain(); bus.intro.connect(bus.fx); }
  const ok = () => ac && !muted;
  const now = () => ac.currentTime;

  // phát một file: o = { v, rate, delay, loop, fade (vào), dur (tự tắt sau dur giây, mờ ra `out`), out, offset, pan, bus }
  function play(id, o = {}) {
    if (!ac) return null;
    const L = LIB[id]; if (!L) return null;
    const b = buf[id];
    if (!b) {   // chưa giải mã xong ⇒ xếp hàng, phát ngay khi xong nếu chưa trễ quá `late` giây
      if (!o._late && buf[id] !== false) { const t0 = now(); (pend[id] = pend[id] || []).push(() => { if (now() - t0 < (o.late ?? 0.6)) { const h = play(id, { ...o, _late: 1 }); if (h && o.onStart) o.onStart(h); } }); }
      return null;
    }
    const t = now() + (o.delay || 0), src = ac.createBufferSource(), g = ac.createGain();
    src.buffer = b; src.loop = !!(o.loop ?? L.loop); if (o.rate) src.playbackRate.value = o.rate;
    const vol = (o.v ?? 1) * L.v;
    if (o.fade) { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + o.fade); } else g.gain.setValueAtTime(vol, t);
    let out = g;
    if (o.pan && ac.createStereoPanner) { const p = ac.createStereoPanner(); p.pan.value = o.pan; g.connect(p); out = p; }
    src.connect(g); out.connect(bus[o.bus || L.bus || "sfx"]);
    src.start(t, o.offset || 0);
    const h = { src, g, stop(f = 0.3) { try { const n = now(); g.gain.cancelScheduledValues(n); g.gain.setValueAtTime(g.gain.value, n); g.gain.linearRampToValueAtTime(0.0001, n + f); src.stop(n + f + 0.05); } catch (e) { /* đã dừng */ } } };
    if (o.dur) { const end = t + o.dur, f = o.out ?? 0.5; g.gain.setValueAtTime(vol, Math.max(t + (o.fade || 0), end - f)); g.gain.linearRampToValueAtTime(0.0001, end); src.stop(end + 0.05); }
    return h;
  }
  // nhạc nền: một bài một lúc, đổi bài mờ chéo
  let song = null, songId = "";
  function music(id, fade = 1.5, o = {}) {
    if (!ok()) return;
    if (songId === id && song) return;
    if (song) song.stop(fade);
    songId = id; song = play(id, { fade, late: 8, ...o, onStart: h => { if (songId === id) song = h; else h.stop(0.2); } });
  }
  function musicStop(fade = 1.2) { if (song) song.stop(fade); song = null; songId = ""; }
  function duck(depth = 0.35, hold = 0.6, back = 1.4) {
    if (!ac) return; const g = bus.music.gain, n = now();
    g.cancelScheduledValues(n); g.setValueAtTime(g.value, n); g.linearRampToValueAtTime(depth, n + 0.06); g.setValueAtTime(depth, n + hold); g.linearRampToValueAtTime(1, n + hold + back);
  }
  const loops = {};   // tiếng lặp đặt tên (động cơ, báo động, tiếng nền)
  function loopOn(key, id, o = {}) { if (!ok() || loops[key]) return; loops[key] = play(id, { loop: true, fade: 1, ...o }); }
  function loopOff(key, f = 0.8) { if (loops[key]) { loops[key].stop(f); delete loops[key]; } }
  const vary = (a = 0.06) => 1 + (Math.random() * 2 - 1) * a;

  // ---------------- tiếng INTRO (kênh riêng, tắt được cả lượt)
  const intro = {
    stop() { if (!ac) return; const b = bus.intro; try { b.gain.setTargetAtTime(0.0001, now(), 0.1); } catch (e) { /* bỏ qua */ } setTimeout(() => { try { b.disconnect(); } catch (e) { /* bỏ qua */ } }, 800); newIntroBus(); delete loops.engine; delete loops.jet; },
    music(id, fade = 1.2) { music(id, fade); },
    engineOn(fade = 2.5, v = 1) { loopOn("engine", "dong_co_tau", { fade, v }); },
    engineOff(f = 1.5) { loopOff("engine", f); },
    ignite(delay = 0) { if (ok()) play("dong_co_khoi", { delay }); },
    braam(delay = 0) { if (ok()) { play("braam", { delay }); setTimeout(() => duck(0.45, 1.2, 2), delay * 1000); } },
    impact(delay = 0) { if (ok()) play("tieng_dong", { delay }); },
    riser(lead = 0) { if (!ok()) return; const b = buf.riser; play("riser", { offset: b && lead ? Math.max(0, b.duration - lead) : 0 }); },   // lead: tiếng dâng KẾT THÚC sau `lead` giây
    boost(delay = 0) { if (ok()) play("tang_toc", { delay }); },
    warp(delay = 0) { if (ok()) { play("lo_giun", { delay }); setTimeout(() => duck(0.5, 0.8, 1.6), delay * 1000); } },
    flyby(delay = 0, pan = 0) { if (ok()) play("tau_bay_qua", { delay, pan }); },
    beep(delay = 0, rate = 1) { if (ok()) play("hud_beep", { delay, rate }); },
    door(delay = 0) { if (ok()) play("cua_khoang", { delay }); },
    hiss(delay = 0) { if (ok()) play("xi_hoi", { delay }); },
    jet(dur = 2.5, delay = 0) { if (ok()) play("jetpack", { delay, dur, fade: 0.25, out: 0.6, loop: true }); },
    servo(delay = 0) { if (ok()) play("servo", { delay, rate: vary(0.05) }); },
    clank(delay = 0) { if (ok()) play("kim_loai", { delay }); },
    // 2j: gõ phím trong `dur` giây (chữ HUD hiện từng chữ) — một đoạn ngẫu nhiên của bản gõ phím thật
    type(dur, delay = 0, v = 1) { if (!ok()) return; const b = buf.go_phim, L = b ? b.duration : 8; play("go_phim", { delay, v, dur: dur + 0.06, out: 0.06, offset: Math.random() * Math.max(0, L - dur - 0.4) }); },
    // 2j: lỗ không gian mở / đóng · tàu chui ra / chui vào ⇒ tiếng NỔ (k: độ lớn)
    scan(delay = 0) { if (ok()) play("quet", { delay }); },                                              // 2m: quét radar dò thiên hà
    notFound(delay = 0) { if (ok()) play("tu_choi", { delay }); },                                        // 2m: báo lỗi — không có mục tiêu
    found(delay = 0) { if (ok()) { play("sonar", { delay }); play("khoa_muc_tieu", { delay: delay + 0.35 }); } },   // 2m: dội sonar + khoá mục tiêu
    hole(delay = 0, k = 1) { if (ok()) { play(Math.random() < 0.5 ? "no_lo" : "no_lo_b", { delay, v: k, rate: vary(0.06) }); setTimeout(() => duck(0.55, 0.4, 1.2), delay * 1000); } },
  };

  function setPrefs(p) {
    Object.assign(prefs, p); savePrefs(prefs);
    if (ac) { bus.fx.gain.setTargetAtTime(fxG(), now(), 0.06); bus.bg.gain.setTargetAtTime(bgG(), now(), 0.06); }
  }
  let stepI = 0;
  if (typeof window !== "undefined") window.__snd = { buf, loops, bus, prefs, get song() { return songId; }, get ctx() { return ac; } };   // bàn thử
  return {
    intro,
    unlock: ensure,
    music, musicStop,
    get muted() { return muted; },
    get prefs() { return { ...prefs }; }, setPrefs,   /* 2j: nút loa EFFECTS / BACKGROUND */
    setMuted(m) { muted = m; if (master) master.gain.setTargetAtTime(m ? 0 : 1, now(), 0.05); },
    click()    { if (ok()) play("cong_tac", { rate: vary(0.04) }); },   /* 2j: công tắc thật */
    reveal()   { if (ok()) play("vut_gio"); },                          /* 2j: gió vút */
    build()    { if (ok()) play("tuong_dung"); },
    sink()     { if (ok()) play("nap_boong", { rate: 0.92 }); },
    count()    { if (ok()) play("khoa_dem", { rate: vary(0.03) }); },   /* 2j: chốt khoá kim loại */
    go()       { if (ok()) { play("chot_nha"); play("xa_khi", { delay: 0.05 }); music(TRACK, 3); } },   /* 2k: nhạc nền mạnh hơn chút */   /* 2j: nhả chốt + xả khí · nhạc vũ trụ du dương (bỏ nhạc dồn dập) */
    // 2j: MỘT bước chân robot trên boong kim loại (side 0/1 = chân trái/phải), khẽ
    step(side = 0, v = 1) { if (!ok()) return; stepI = (stepI + 1 + (Math.random() * 3 | 0)) % STEPS.length; play("buoc_kl", { offset: STEPS[stepI], dur: 0.3, out: 0.08, v: v * (0.8 + 0.2 * Math.random()), rate: vary(0.05), pan: side ? 0.12 : -0.12 }); },
    correct()  { if (ok()) play("chuong_dung"); },                       /* 2j: chuông ding thật */
    wrong()    { if (ok()) play("kim_loai_sai", { rate: vary(0.04) }); }, /* 2j: va kim loại */
    hit()      { if (ok()) play("trung_don", { rate: vary(0.05) }); },
    robotBoom(big = true) { if (ok()) { play(big ? "no_robot" : "no_robot_b", { rate: vary(0.06) }); duck(0.45, 0.4, 1.2); } },   /* 2j: robot nổ = nổ thật */
    ship(kind) {                                                          /* 2j: tàu ANDREW bắn tàu con — 1/3 âm lượng */
      if (!ok()) return;
      if (kind === "shot") play("ban_laser", { rate: vary(0.08), v: 0.7 + 0.3 * Math.random() });
      else if (kind === "hit") play("no_robot_b", { rate: 1.3 * vary(0.08), v: 0.6 / 3 });
      else if (kind === "boom") play("no_xa", { rate: vary(0.05) });
    },
    boom()     { if (ok()) { play("bom_no", { rate: vary(0.05) }); duck(0.4, 0.5, 1.2); } },
    // 2k: tiếng thật cho cổng / nắp boong / bay lên (thay "teleport" điện tử)
    gateIn()    { if (ok()) play("cong_hut", { rate: vary(0.04), offset: 2.35, dur: 1.1, out: 0.4 }); },   // gió hút ngược: đỉnh (2,65 s trong file) rơi đúng lúc robot bị hút
    gateOpen()  { if (ok()) play("cong_mo", { rate: vary(0.05), offset: 1.5 }); },   // dâng lên, đỉnh ~0,85 s sau khi cổng bắt đầu nở
    gateClose() { if (ok()) play("vut_gio", { v: 0.55, rate: 0.85 }); },
    hatch()     { if (ok()) { play("xi_hoi", { bus: "sfx", v: 0.7 }); play("servo", { delay: 0.1, rate: vary(0.05) }); } },
    flyUp()     { if (ok()) play("jetpack", { bus: "sfx", v: 0.9, dur: 1.8, fade: 0.15, out: 0.6, loop: true }); },
    teleport()  { this.gateOpen(); },
    enemy()    { if (ok()) { play("servo", { rate: 0.8 }); play("kim_loai", { bus: "sfx", v: 0.6, delay: 0.25 }); } },   /* 2j: địch trồi = máy móc thật */
    tick()     { if (ok()) play("tich_tac"); },
    win()      { if (ok()) music("thang2", 0.4); },   /* 2m: hùng tráng */
    over()     { if (ok()) music("thua3", 0.4); },
    gift()     { if (ok()) play("chuong_dung", { rate: 1.25 }); },   /* 2m: quà bom (trước gọi win() ⇒ nhạc thắng) */
    alarm(on)  { if (on) loopOn("alarm", "coi_hu", { fade: 0.15 }); else loopOff("alarm", 1.2); },   /* 2j: còi hú "ào ao" */
    menu()     { if (ok()) music("nhac_menu", 2); },
    humOn()    { loopOn("hum", "ong_boong", { fade: 2 }); },
    humOff()   { loopOff("hum", 0.8); loopOff("alarm", 0.6); },
    suspend()  { if (ac && ac.state === "running") ac.suspend(); },
    resume()   { if (ac && ac.state === "suspended") ac.resume(); },
    // 2n: đóng hẳn (AWord dỡ game) — mọi tiếng tắt ngay, AudioContext trả lại cho trình duyệt; lệnh phát sau đó là vô hại (ac = null)
    close()    { closed = true; const a = ac; ac = null; song = null; songId = ""; Object.keys(pend).forEach(k => delete pend[k]); if (a) { try { a.close(); } catch (e) { /* bỏ qua */ } } },
  };
}
