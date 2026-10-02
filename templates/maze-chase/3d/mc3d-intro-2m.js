// STAR LOOT — INTRO (mẫu 2m, 01/10/2026). Chép mc3d-intro-2l.js + tiếng QUÉT RADAR lúc bắt đầu dò mỗi thiên hà (trước NOT FOUND / ENEMY LOCATED).
// ---- ghi chú 2l: STAR LOOT — INTRO (mẫu 2l, 01/10/2026). Chép mc3d-intro-2j.js + thầy: NOT FOUND hiện ĐỎ lại (2j lỡ đặt màu lúc dựng kịch bản ⇒ lệnh cuối
//   ENEMY LOCATED xanh đè, NOT FOUND ra xanh) — nay đặt màu đúng lúc chữ hiện · NOT FOUND có tiếng hụt hẫng, ENEMY LOCATED có tiếng "tìm thấy".
// ---- ghi chú 2j: STAR LOOT — INTRO (mẫu 2j, 01/10/2026). Chép mc3d-intro-2i.js + ý thầy:
//   • Mọi dải chữ HUD (ENEMY LOCATED, POSITION / TARGET, ANDREW STUDIO PRESENTS, tên thiên hà, NOT FOUND / ENEMY LOCATED) hiện TỪNG CHỮ theo đồng hồ
//     intro (`typeAt` + `tickType`), kèm tiếng GÕ PHÍM thật dài đúng bằng lúc gõ (bỏ tiếng "tít" HUD).
//   • Lỗ không gian XUẤT HIỆN / BIẾN MẤT, tàu CHUI RA / CHUI VÀO ⇒ tiếng nổ (`snd.hole`, xem `holeBooms`).
// ---- ghi chú 2i: STAR LOOT — INTRO (mẫu 2i, 30/9/2026). Chép mc3d-intro-2h.js + âm thanh THẬT: nhạc intro hùng tráng, động cơ tàu mẹ lặp, nổ máy, riser,
//   vọt tăng tốc, xuyên lỗ giun, tàu vút qua (góc rộng), braam, tít định vị, cửa khoang + xì thuỷ lực, động cơ ba lô robot, khớp máy, va kim loại.
// ---- ghi chú 2h: STAR LOOT — INTRO (mẫu 2h, 30/9/2026). Chép mc3d-intro-2g.js + ý thầy: báo động khi robot đã vào 2/3 thân (F3 + 0,68 s, đo thân 4,5 đv, cửa gầm y = B)
//   · bỏ dựng tường lúc quay người (lõi dựng 3 s trước khi địch trồi) · rút ngắn show lưng (2,9 ⇒ 2,0 s), xoay người (1,3 ⇒ 1,0 s), chờ lùi (1,5 ⇒ 1,1 s), lia về (3,8 ⇒ 3,0 s).
// ---- ghi chú 2g: STAR LOOT — INTRO (mẫu 2g, 30/9/2026). Chép mc3d-intro-2f.js + sửa: tới T = CH1 (7,8 s, lúc ANDREW STUDIO PRESENTS) độ NGHIÊNG máy quay
//   nhảy 0 ⇒ 0,02·sin(0,6T) ≈ −1,15° trong 1 khung ⇒ cả khung xoay ngược kim đồng hồ ~1°. Nay nghiêng tăng dần theo k (liên tục).
//   + quét gãy máy quay cả intro: đường lên boong/lùi về chạy theo chiều dài (getPointAt), góc zoom vào boong liền (50), nâng điểm nhìn êm.
// ---- ghi chú 2f: STAR LOOT — INTRO (mẫu 2f, 30/9/2026). Chép mc3d-intro-2e.js + ý thầy:
//   • Hết GÃY vận tốc ở T = 3,5 s (công thức tăng tốc a²·min(1, a/3) đổi đột ngột ⇒ tàu khựng khi bay tới hành tinh đỏ nhỏ).
//   • Chỗ tàu tiếp xúc mặt lỗ: VIỀN SÁNG nhòe (tự phát sáng theo khoảng cách tới mặt cắt, onBeforeCompile) thay vì mép cắt sắc.
//   • Ra khỏi lỗ: vẫn giữ TỐC ĐỘ CAO một chút rồi mới giảm, sau đó mới vọt vào lỗ kế · lỗ góc rộng TO như ở vũ trụ đích.
//   • Robot chui vào cửa gầm ⇒ đèn BÁO ĐỘNG đỏ quanh trạm (ctx.alarm) · robot quay người trên boong ⇒ TƯỜNG DỰNG luôn (ctx.raiseWalls).
// ---- ghi chú 2e: STAR LOOT — INTRO (mẫu 2e, 30/9/2026). Chép mc3d-intro-2d.js + ý thầy về CỔNG RA / CỔNG VÀO:
//   • Cổng ra: lỗ MỞ ĐỦ TO trước rồi tàu mới ra; tàu ra với cỡ THẬT ngay (không kéo giãn), phần chưa ra bị MẶT CẮT (clipping plane) giấu
//     ⇒ trông như chui ra từ lỗ; mũi tàu lúc ra hơi hướng về máy quay rồi mới lái cong sang nhắm cổng vào (đường Bézier theo độ dài cung).
//   • Cổng vào: tàu KHÔNG biến mất đột ngột — bay nguyên cỡ tới khi mũi CHẠM lỗ, rồi mới nhỏ dần trong lúc chui hẳn vào (mặt cắt thứ 2 giấu phần
//     đã vào), từng tàu hộ tống cũng vậy; tàu cuối đã vào hết thì lỗ mới CO LẠI, rồi mới trắng loá sang vũ trụ mới.
// ---- ghi chú 2d:
//   • Góc rộng vũ trụ 2-3 đổi sang bên kia đường bay ⇒ tàu bay TỪ TRÁI SANG PHẢI (đồng bộ với vũ trụ đích).
//   • Lỗ giun VÀO: chỉ mở (bung từ MỘT ĐIỂM) đúng lúc tàu bắt đầu vọt; tàu teo vào lõi thì lỗ CO LẠI theo.
//   • Vũ trụ đích = ANDREWMEDA GALAXY; 2 vũ trụ giữa = Andromeda, Whirlpool.
// ---- ghi chú 2c:
//   • CHỈ vũ trụ 1 quay sau đuôi tàu lúc chui vào lỗ giun. Vũ trụ 2 và 3: GÓC RỘNG — trong cùng một cảnh thấy tàu chui RA từ một lỗ không gian
//     rồi lao vào lỗ không gian khác (tàu teo vào lõi lỗ), trắng loá ngắn chuyển vũ trụ.
//   • Vọt xong là NHANH HƠN hẳn và giữ nguyên tốc đó tới lỗ giun (không chậm lại). Chỉ lúc vừa chui ra khỏi lỗ mới chậm hơn lúc lao vào.
// ---- ghi chú 2b:
//   • Trước lỗ giun: đúng KHOẢNH KHẮC lửa đuôi bùng nổ thì tàu VỌT bất ngờ (giật tới ngay, không tăng tốc từ từ) — surge() mới.
//   • Tới vũ trụ đích: bỏ cảnh nhìn đuôi tàu ⇒ cảnh quay TỪ XA: một LỖ ÁNH SÁNG mở ra, tàu mẹ + hộ tống chui ra (kéo giãn từ tâm lỗ),
//     hãm dần tới chỗ treo, rồi máy quay vào cảnh robot bay ra từ đáy tàu như cũ. Trắng loá lần cuối ngắn lại để kịp thấy lỗ sáng.
// ---- ghi chú 1t:
// STAR LOOT — INTRO (mẫu 1t, 29/9/2026). Chép mc3d-intro-1s.js + ý thầy:
//   • Tăng tốc phải có LỬA BÙNG NỔ ở đuôi tàu: lúc nổ máy (tăng tốc dần) + mỗi lần vọt trước lỗ giun — chùm lửa lớn phụt ngược ra sau từ
//     3 cụm động cơ đuôi, trong lúc vọt vẫn phụt liên tục; lửa đuôi của tàu (cine.power) cũng mạnh hơn.
//   • Phía trên NOT FOUND / ENEMY LOCATED có TÊN THIÊN HÀ thật: M51 Whirlpool · M104 Sombrero · M31 Andromeda.
// ---- ghi chú 1s:
// STAR LOOT — INTRO (mẫu 1s, 29/9/2026). Chép mc3d-intro-1r.js + ý thầy:
//   • Tàu KHÔNG chúi mũi / ngóc lên nữa (hướng bay luôn nằm ngang) — chỉ lắc lư chòng chành theo chiều ngang. Bấm START lúc nào thì
//     tàu đi tiếp từ đúng chỗ ấy (cùng "thời gian bay" c).
//   • Bấm START: hiện NGAY thông tin định vị + tàu bắt đầu đi dần luôn (ANDREW STUDIO PRESENTS dời ra sau).
//   • Tới gần lỗ giun: tàu ĐỘT NGỘT tăng tốc (lao vượt khỏi máy quay) rồi mới chui vào.
//   • Vùng không đúng (2 vùng giữa): nháy NOT FOUND đỏ ở góc — chỗ ENEMY LOCATED xanh lúc tới đích.
//   • Robot vừa ra khỏi tàu mẹ là vòng ngay xuống dưới trạm, bay thẳng tới cửa gầm, chui lên — nhanh, máy quay bám nhanh, KHÔNG dừng ngắm.
// ---- ghi chú 1r:
// STAR LOOT — INTRO (mẫu 1r, 29/9/2026). Chép mc3d-intro-1q.js + ý thầy:
//   • Mở game: CHƯA có tàu — hạm đội bay vào từ góc màn, chậm dần tới chỗ đậu; máy quay vẫn trôi tới (không đứng yên). Bấm START: vẫn trôi
//     chậm (nối liền, cùng "thời gian bay" c) rồi mới tăng tốc dần và đổi góc nhìn.
//   • Lỗ giun chỉ to hơn tàu một chút, mép mờ loang sáng (không viền tròn); hộ tống khép sát đuôi tàu mẹ để lọt lòng. Chui vào: trắng loá
//     TĂNG DẦN; ra: GIẢM DẦN (lớp trắng điều khiển từng khung, không dùng hiệu ứng bật/tắt) ⇒ đổi vùng không gian lúc trắng hẳn.
//   • Tới vũ trụ đích: chữ ENEMY LOCATED xanh lá nhấp nháy ở góc. Tàu mẹ treo XA trạm để địch không phát hiện sớm.
//   • Robot (đơn: 1 robot): lượn xuống sát trạm ⇒ dừng một nhịp nhìn ngắm ⇒ hạ xuống gầm ⇒ từ từ chui lên CỬA GẦM (mở/đóng) ⇒ trồi lên
//     ô xuất phát quay lưng (ANDREW TEAM) ⇒ quay mặt ⇒ CÂU HỎI ĐẦU HIỆN NGAY khi máy quay bắt đầu lùi (thời gian lùi tính vào thời gian đọc).
//   • Bỏ chữ STAR LOOT lúc lùi máy quay · bỏ chữ "Double-click to skip" · bấm đúp ⇒ nhảy tới lúc vừa ra khỏi lỗ giun cuối (sắp thả robot).
// Không thêm ĐÈN mới. Mọi vật mới vẽ thử dưới màn đen lúc tải trang.
import * as THREE from "../../rocket-race/vendor/three/three.module.min.js";

const V3 = THREE.Vector3;
const clamp01 = x => Math.max(0, Math.min(1, x));
const seg = (T, a, b) => clamp01((T - a) / (b - a));
const eio = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const eo = t => 1 - Math.pow(1 - t, 3);
const rnd = (a, b) => a + Math.random() * (b - a);
const lerp = (a, b, k) => a + (b - a) * k;

function cv(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const glowTex = () => cv(64, 64, (g, s) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.3, "rgba(255,255,255,.55)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
// thiên hà xoắn ốc: lõi vàng trắng, cánh tay xanh/hồng, bụi tối xen giữa
function galaxyTex(core, arm1, arm2, arms = 3) {
  return cv(1024, 1024, (g, S) => {
    const c = S / 2;
    let gr = g.createRadialGradient(c, c, 0, c, c, S * 0.46); gr.addColorStop(0, `rgba(${core},0.95)`); gr.addColorStop(0.08, `rgba(${core},0.55)`); gr.addColorStop(0.35, `rgba(${arm1},0.12)`); gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 14000; i++) {
      const arm = i % arms, r = Math.pow(Math.random(), 0.75) * S * 0.46, th = arm * Math.PI * 2 / arms + r / (S * 0.46) * 5.2 + rnd(-0.35, 0.35) * (1 - r / (S * 0.5) * 0.6);
      const x = c + Math.cos(th) * r, y = c + Math.sin(th) * r, k = r / (S * 0.46);
      const col = k < 0.2 ? core : Math.random() < 0.55 ? arm1 : arm2;
      g.fillStyle = `rgba(${col},${(0.25 + Math.random() * 0.5) * (1 - k * 0.6)})`; const sz = Math.random() < 0.04 ? 3 : 1.4; g.fillRect(x, y, sz, sz);
    }
    for (let i = 0; i < 90; i++) { const th = rnd(0, 6.28), r = rnd(0.1, 0.42) * S, x = c + Math.cos(th) * r, y = c + Math.sin(th) * r, rr = rnd(8, 26); const gg = g.createRadialGradient(x, y, 0, x, y, rr); gg.addColorStop(0, `rgba(${Math.random() < 0.5 ? arm1 : arm2},0.35)`); gg.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gg; g.fillRect(x - rr, y - rr, 2 * rr, 2 * rr); }
  });
}
function bandTex(cols) {
  return cv(512, 256, (g, w, h) => {
    for (let y = 0; y < h; y++) { const k = y / h, i = Math.floor((Math.sin(k * 23 + Math.sin(k * 7) * 2) * 0.5 + 0.5) * (cols.length - 0.001)); g.fillStyle = cols[i]; g.fillRect(0, y, w, 1); }
    for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? "255,255,255" : "0,0,0"},${rnd(0.03, 0.09)})`; g.fillRect(rnd(0, w), rnd(0, h), rnd(30, 180), rnd(2, 8)); }
  });
}
function ringTex(inner, outer) {
  return cv(512, 16, (g, w, h) => { for (let x = 0; x < w; x++) { const k = x / w; g.fillStyle = `rgba(${k < 0.5 ? inner : outer},${(0.25 + 0.6 * Math.abs(Math.sin(k * 40))) * Math.sin(k * Math.PI)})`; g.fillRect(x, 0, 1, h); } });
}

// bầu trời mỗi thiên hà: nền (dưới, trên) · tinh vân 1 · tinh vân 2 · dải sáng — ENEMY = màu trời của game (điểm kết)
const SKIES = {
  home:  [[0.02, 0.02, 0.07], [0.08, 0.05, 0.2], [0.6, 0.12, 0.62], [0.05, 0.42, 0.66], [0.95, 0.55, 0.3]],
  teal:  [[0.01, 0.035, 0.05], [0.03, 0.12, 0.15], [0.06, 0.52, 0.42], [0.2, 0.34, 0.75], [0.35, 0.85, 0.6]],
  ember: [[0.06, 0.012, 0.02], [0.17, 0.04, 0.05], [0.75, 0.2, 0.08], [0.55, 0.36, 0.08], [0.95, 0.45, 0.2]],
  enemy: [[0.035, 0.02, 0.09], [0.11, 0.04, 0.22], [0.42, 0.10, 0.55], [0.08, 0.22, 0.55], [0.6, 0.25, 0.7]],
};

export function createIntro(ctx) {
  const { scene, fleet, snd } = ctx;
  let T = 0, active = false, cues = [], onDone = null, menuOn = false, menuT = 0, prep = 0, galaxy = "home";

  // ---------------- lớp chữ điện ảnh
  const ov = document.createElement("div"); ov.className = "mc-cine black";
  ov.innerHTML = `<i class="cine-bar t"></i><i class="cine-bar b"></i>
    <div class="cine-alert"><div class="al-h"><i>▲</i><span></span></div><div class="al-l"><span></span><b></b></div><div class="al-l"><span></span><b></b></div></div>
    <div class="cine-pre"><span></span><em></em></div>
    <div class="cine-title"><b data-t="STAR LOOT">STAR LOOT</b><i></i></div>
    <i class="cine-white"></i><div class="cine-found"><small></small><div><i></i><span></span></div></div><i class="cine-flash"></i><i class="cine-fade"></i>`;
  ctx.stage.appendChild(ov);
  const $ = s => ov.querySelector(s);
  $(".cine-title i").textContent = ctx.subtitle || "";
  const on = (sel, c, v = true) => (sel === ".mc-cine" ? ov : $(sel)).classList.toggle(c, v);
  function flash(k = 1, long = false) { const f = $(".cine-flash"); f.style.setProperty("--k", k); f.classList.remove("go"); f.classList.toggle("long", long); void f.offsetWidth; f.classList.add("go"); }
  const al = $(".cine-alert"), alL = [...ov.querySelectorAll(".cine-alert .al-h, .cine-alert .al-l")];   // 1q: khung cảnh báo
  // 2j: GÕ TỪNG CHỮ theo đồng hồ intro T (bấm đúp bỏ qua / dừng intro vẫn đúng) — parts: [[phần tử, chữ], …] gõ nối tiếp nhau, kèm tiếng gõ phím
  const CPS = 24;                                                   // chữ / giây
  let typers = [];
  function typeAt(t, parts, cps = CPS) {
    const len = parts.reduce((a, [, x]) => a + x.length, 0);
    at(t, () => { parts.forEach(([el]) => { el.textContent = ""; }); typers.push({ t0: T, parts, cps, n: -1 }); snd.type(len / cps); });
  }
  function tickType() {
    typers = typers.filter(ty => {
      const n = Math.max(0, Math.floor((T - ty.t0) * ty.cps) + 1);
      if (n !== ty.n) { ty.n = n; let k = n; ty.parts.forEach(([el, x]) => { const m = Math.min(x.length, Math.max(0, k)); if (el.textContent.length !== m) el.textContent = x.slice(0, m); k -= x.length; }); }
      return n < ty.parts.reduce((a, [, x]) => a + x.length, 0);
    });
  }
  const txtEl = (el, i = 0) => el.querySelectorAll("span, b, small, em")[i];

  // ---------------- bầu trời
  function setSky(name) {
    galaxy = name; const s = SKIES[name], u = ctx.sky.uniforms;
    ["uB0", "uB1", "uN1", "uN2", "uBand"].forEach((k, i) => u[k].value.setRGB(...s[i]));
  }

  // ---------------- cảnh vật mỗi thiên hà (xa: đi theo máy quay; gần: đứng yên để thấy thị sai)
  const gTex = glowTex();
  const farG = new THREE.Group(); scene.add(farG);                    // đi theo máy quay (vô cực)
  const addGal = (tex, pos, size, rot, tint) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, color: new THREE.Color(...tint) }));
    m.position.copy(pos); m.rotation.set(...rot); m.renderOrder = -5; farG.add(m); return m;
  };
  const planetMat = (tex, rough = 0.8) => new THREE.MeshStandardMaterial({ map: tex, roughness: rough, metalness: 0, envMapIntensity: 0.25 });
  const rimMat = col => new THREE.ShaderMaterial({ ...ctx.atmo, uniforms: { uColor: { value: new THREE.Color(col) } }, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  function planet(r, tex, col, pos, ring) {
    const g = new THREE.Group(); g.position.copy(pos);
    const p = new THREE.Mesh(new THREE.SphereGeometry(r, 48, 32), planetMat(tex)); g.add(p);
    const a = new THREE.Mesh(new THREE.SphereGeometry(r * 1.06, 48, 32), rimMat(col)); g.add(a);
    if (ring) { const rg = new THREE.Mesh(new THREE.RingGeometry(r * 1.35, r * 2.3, 96, 1), new THREE.MeshBasicMaterial({ map: ringTex(ring[0], ring[1]), transparent: true, side: THREE.DoubleSide, depthWrite: false }));
      const uv = rg.geometry.attributes.uv, pp = rg.geometry.attributes.position; for (let i = 0; i < uv.count; i++) { const d = Math.hypot(pp.getX(i), pp.getY(i)); uv.setXY(i, (d - r * 1.35) / (r * 0.95), 0.5); }
      rg.rotation.x = -Math.PI / 2 + 0.35; rg.rotation.y = 0.2; g.add(rg); }
    g.userData.spin = p; return g;
  }
  // HOME: thiên hà xoắn lớn trước mặt + 3 hành tinh nhiều màu
  const home = new THREE.Group(); scene.add(home);
  const homeFar = [addGal(galaxyTex("255,240,210", "140,190,255", "255,140,220"), new V3(60, 190, 980), 900, [0.45, 0.2, 0.4], [1.5, 1.5, 1.6]),
    addGal(galaxyTex("255,230,190", "255,160,120", "180,140,255", 2), new V3(460, -60, 900), 320, [0.1, -0.5, -0.9], [1.1, 1.1, 1.2])];
  home.add(planet(120, bandTex(["#6d3fb8", "#9b59d0", "#e59bd6", "#f3c4a0", "#7a3ca8"]), 0xd58cff, new V3(380, -40, 1380), ["255,210,170", "200,160,255"]));
  home.add(planet(46, bandTex(["#2f8fc9", "#6ad0e8", "#e9f7ff", "#3a78c2"]), 0x8fe3ff, new V3(-300, 150, 1300)));
  home.add(planet(22, bandTex(["#c9612f", "#e8a15a", "#f5d18a", "#9c4424"]), 0xffb07a, new V3(-190, -30, 1080)));
  // TEAL: hành tinh vành đai khổng lồ + vệ tinh
  const teal = new THREE.Group(); scene.add(teal); teal.visible = false;
  const tealFar = [addGal(galaxyTex("220,255,240", "90,230,200", "120,170,255"), new V3(260, 120, 960), 760, [0.2, -0.3, 0.9], [1.3, 1.4, 1.4])];
  teal.add(planet(170, bandTex(["#1f6f6a", "#39a58f", "#9fe0c4", "#2c8f86", "#dff5e6"]), 0x7affd8, new V3(-420, -120, 1420), ["210,255,235", "140,210,255"]));
  teal.add(planet(28, bandTex(["#b8c4d8", "#e6ecf5", "#8e9bb3"]), 0xcfe3ff, new V3(-150, 90, 1150)));
  // EMBER: lỗ đen với đĩa bồi tụ cam vàng
  const ember = new THREE.Group(); scene.add(ember); ember.visible = false;
  const emberFar = [addGal(galaxyTex("255,220,170", "255,120,60", "255,200,90"), new V3(-300, 60, 950), 700, [-0.3, 0.4, 0.2], [1.3, 1.1, 1.0])];
  const bh = new THREE.Group(); bh.position.set(260, 70, 1380); ember.add(bh);
  bh.add(new THREE.Mesh(new THREE.SphereGeometry(60, 40, 24), new THREE.MeshBasicMaterial({ color: 0x000000 })));
  const disk = new THREE.Mesh(new THREE.RingGeometry(70, 210, 128, 1), new THREE.MeshBasicMaterial({ map: cv(512, 16, (g, w, h) => { for (let x = 0; x < w; x++) { const k = x / w; g.fillStyle = `rgba(255,${Math.round(210 - 150 * k)},${Math.round(120 - 110 * k)},${Math.pow(1 - k, 1.4) * (0.6 + 0.4 * Math.abs(Math.sin(k * 60)))})`; g.fillRect(x, 0, 1, h); } }),
    transparent: true, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, color: new THREE.Color(2.2, 1.6, 1.2) }));
  { const uv = disk.geometry.attributes.uv, pp = disk.geometry.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, (Math.hypot(pp.getX(i), pp.getY(i)) - 70) / 140, 0.5); }
  disk.rotation.x = -Math.PI / 2 + 0.28; bh.add(disk);
  const bhGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: gTex, color: new THREE.Color(2.4, 1.2, 0.5), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); bhGlow.scale.setScalar(380); bh.add(bhGlow);
  ember.add(planet(34, bandTex(["#5a1f14", "#8c3a1c", "#c2622a", "#3b140e"]), 0xff7a3a, new V3(-200, -70, 1180)));
  const SETS = { home: [home, homeFar], teal: [teal, tealFar], ember: [ember, emberFar] };
  function showSet(name) { Object.entries(SETS).forEach(([k, [g, far]]) => { const v = k === name; g.visible = v; far.forEach(m => { m.visible = v; }); }); }



  // ---------------- LỖ GIUN: chỉ to hơn tàu một chút, KHÔNG viền tròn rõ — lòng xoáy sáng tan dần ra quầng sáng mờ
  const PORTAL_FS = `uniform float uT, uI, uOpen; uniform vec3 uA, uB; varying vec2 vUv;
    void main() {
      vec2 p = vUv * 2.0 - 1.0; float r = length(p) / max(uOpen, 0.001);
      float rr = r / 0.5, a = atan(p.y, p.x), lr = log(rr + 0.03);
      float s1 = sin(a * 4.0 + lr * 9.0 - uT * 4.2) * 0.5 + 0.5, s2 = sin(a * 7.0 - lr * 15.0 + uT * 2.6) * 0.5 + 0.5;
      float inside = 1.0 - smoothstep(0.55, 1.25, rr);                 // mép lòng mờ dần (không có vòng viền)
      float glow = exp(-max(rr - 0.7, 0.0) * 2.6) * 0.55;               // quầng sáng loang ra ngoài
      float core = pow(max(0.0, 1.0 - rr * 1.05), 2.2);
      vec3 swirl = mix(uB, uA, s1) * (0.3 + 0.9 * s1 * s2) * (0.45 + 0.6 * rr);
      vec3 c = swirl * inside + uA * glow * (1.0 - 0.5 * inside) + vec3(1.0, 0.97, 0.94) * core * 1.3;
      gl_FragColor = vec4(c * uI * (1.0 - smoothstep(0.8, 1.0, length(p))), 1.0);
    }`;
  const PORTAL_VS = `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
  const PORTAL_R = 64;                                               // bán kính lòng (tàu mẹ rộng ~56, dài ~94)
  function makePortal(a, b) {
    const g = new THREE.Group(); g.visible = false; scene.add(g);
    const m = new THREE.ShaderMaterial({ vertexShader: PORTAL_VS, fragmentShader: PORTAL_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: { uT: { value: 0 }, uI: { value: 1 }, uOpen: { value: 1 }, uA: { value: new THREE.Color(...a) }, uB: { value: new THREE.Color(...b) } } });
    const disk = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m); disk.scale.setScalar(PORTAL_R * 4); g.add(disk);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: gTex, color: new THREE.Color(...a).multiplyScalar(0.7), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    halo.scale.setScalar(PORTAL_R * 4.4); g.add(halo);
    return { g, m, halo };
  }
  const portals = [makePortal([0.35, 0.8, 1.4], [0.45, 0.2, 0.9]), makePortal([0.4, 1.3, 0.95], [0.9, 0.45, 0.15]), makePortal([1.4, 0.55, 0.25], [0.75, 0.15, 0.7])];

  // ---------------- bụi sao lấp lánh quanh tàu lúc bay nhanh
  const ND = 360, dPos = new Float32Array(ND * 3);
  const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute("position", new THREE.BufferAttribute(dPos, 3));
  const dMat = new THREE.PointsMaterial({ map: gTex, size: 2.6, color: new THREE.Color(0.75, 0.85, 1.0), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  const dust = new THREE.Points(dGeo, dMat); dust.frustumCulled = false; dust.visible = false; scene.add(dust);
  const dustSeed = (i, zc, near) => dPos.set([rnd(-260, 260), rnd(-120, 200), zc + (near ? rnd(-80, 520) : rnd(360, 560))], i * 3);
  let dustK = 0;
  function tickDust(zc) {
    dust.visible = dustK > 0.01; dMat.opacity = dustK; if (!dust.visible) return;
    for (let i = 0; i < ND; i++) if (dPos[i * 3 + 2] < zc - 90) dustSeed(i, zc, false);
    dGeo.attributes.position.needsUpdate = true;
  }
  function resetDust(zc) { for (let i = 0; i < ND; i++) dustSeed(i, zc, true); dGeo.attributes.position.needsUpdate = true; }

  // ---------------- hạm đội hộ tống + cửa khoang dưới bụng tàu mẹ
  // đội hình thường · đội hình KHÉP (lúc xuyên lỗ giun: nép sát đuôi tàu mẹ để lọt lòng lỗ giun) · trễ lúc bay vào màn chờ
  const escorts = [[-46, -6, -40, 0.62, [-52, -13, -24], 0.7], [46, -10, -52, 0.62, [-58, -15, 24], 1.2], [0, 20, -90, 0.5, [-86, -4, 0], 1.7]].map(([x, y, z, k, tuck, lag]) => {
    const g = fleet.group.clone(true); g.visible = false; g.children[0].scale.setScalar(47 * k); scene.add(g); return { g, off: new V3(x, y, z), tuck: new V3(...tuck), lag };
  });
  const body = fleet.group.children[0];
  const hangar = new THREE.Group(); hangar.position.set(0.02, -0.0262, 0); hangar.visible = false; body.add(hangar);
  const hglow = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.032), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.2, 2.2, 2.8), toneMapped: false, side: THREE.DoubleSide }));
  hglow.rotation.x = Math.PI / 2; hangar.add(hglow);
  const leafM = new THREE.MeshStandardMaterial({ color: 0x5b6069, metalness: 0.6, roughness: 0.45 });
  const leaves = [-1, 1].map(s => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.002, 0.034), leafM); l.position.set(s * 0.0125, -0.0012, 0); hangar.add(l); return { l, s }; });

  // ---------------- CỬA GẦM trạm (mỗi robot một cửa, ngay dưới ô xuất phát): lòng tối + viền đèn + 2 lá trượt
  const bayBlack = new THREE.MeshBasicMaterial({ color: 0x020308, side: THREE.DoubleSide });
  const bayRim = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.5, 1.6, 2.2), toneMapped: false });
  function makeBay() {
    const g = new THREE.Group(); g.visible = false; scene.add(g);
    const hole = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.9), bayBlack); hole.rotation.x = Math.PI / 2; g.add(hole);
    [[0, 1.02, 2.2, 0.12], [0, -1.02, 2.2, 0.12], [1.02, 0, 0.12, 2.2], [-1.02, 0, 0.12, 2.2]].forEach(([x, z, w, d]) => { const e = new THREE.Mesh(new THREE.BoxGeometry(w, 0.05, d), bayRim); e.position.set(x, -0.03, z); g.add(e); });
    const lv = [-1, 1].map(s => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.08, 1.92), leafM); l.position.set(s * 0.48, -0.06, 0); g.add(l); return { l, s }; });
    return { g, lv, set(k) { lv.forEach(({ l, s }) => { l.position.x = s * (0.48 + 0.98 * k); }); } };
  }
  const bays = [makeBay(), makeBay()];

  // ---------------- hạt (lửa phản lực ba lô)
  const parts = Array.from({ length: 480 }, () => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: gTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    s.visible = false; scene.add(s); return { s, life: 0, max: 1, v: new V3(), s0: 1, s1: 1, c0: new THREE.Color(), c1: new THREE.Color(), a: 1, drag: 0 };
  });
  let pi = 0;
  function emit(pos, vel, life, s0, s1, c0, c1, a = 1, drag = 1) {
    const p = parts[pi++ % parts.length]; p.s.position.copy(pos); p.v.copy(vel); p.life = 0; p.max = life; p.s0 = s0; p.s1 = s1; p.c0.setRGB(...c0); p.c1.setRGB(...c1); p.a = a; p.drag = drag; p.s.visible = true;
  }
  // 1t: chùm lửa phụt ngược ra sau từ 3 cụm động cơ ĐUÔI tàu mẹ (toạ độ theo thân tàu: đuôi ở x = −0,5)
  const EXH = [[-0.5, 0.012, 0], [-0.5, 0.012, -0.085], [-0.5, 0.012, 0.085]], exV = new V3(), exP = new V3(), shipV = new V3(), svA = new V3();
  function exhaust(n, k) {
    const sc = fleet.cine.sc; exV.set(-1, 0, 0).applyQuaternion(fleet.group.quaternion);
    for (let i = 0; i < n; i++) {
      const e = EXH[i % 3]; shipAt(e[0] * sc - rnd(0, 0.03) * sc, (e[1] + rnd(-0.012, 0.012)) * sc, (e[2] + rnd(-0.02, 0.02)) * sc, exP);
      emit(exP, exV.clone().multiplyScalar(rnd(40, 110) * k).addScaledVector(shipV, 0.78).add(tv3.set(rnd(-14, 14), rnd(-14, 14), rnd(-14, 14))), rnd(0.3, 0.6),   // bay theo đà tàu ⇒ chùm lửa bám đuôi
        rnd(6, 10) * (0.6 + 0.4 * k), rnd(20, 34) * (0.6 + 0.4 * k), [2.4, 1.0, 0.25], [0.9, 0.15, 0.02], 0.85, 2.5);   // cam đỏ (không trắng loá)
    }
  }
  function tickParts(dt) {
    for (const p of parts) {
      if (!p.s.visible) continue; p.life += dt; const k = p.life / p.max; if (k >= 1) { p.s.visible = false; continue; }
      p.v.multiplyScalar(Math.exp(-p.drag * dt)); p.s.position.addScaledVector(p.v, dt);
      p.s.scale.setScalar(p.s0 + (p.s1 - p.s0) * Math.sqrt(k)); p.s.material.color.copy(p.c0).lerp(p.c1, k); p.s.material.opacity = p.a * (1 - k);
    }
  }

  // ---------------- robot bay bằng phản lực: yaw quay mượt, dáng chuyển dần từ NẰM RẠP (bay nhanh) sang ĐỨNG (lơ lửng / chui vào)
  const tv = new V3(), tv2 = new V3(), tv3 = new V3();
  function jetPose(R, pos, yaw, prone, t, dt, power = 1) {
    const g = R.g; g.visible = true; g.position.copy(pos); g.scale.setScalar(1.75);
    if (R.yawS === undefined) R.yawS = yaw;
    let d = yaw - R.yawS; d = Math.atan2(Math.sin(d), Math.cos(d)); R.yawS += d * Math.min(1, dt * 2.6);
    g.rotation.set(0, R.yawS, 0);
    R.body.rotation.set(prone * (1.05 + 0.08 * Math.sin(t * 3)) + (1 - prone) * 0.06 * Math.sin(t * 1.3), 0, (0.12 * prone + 0.05) * Math.sin(t * 1.7)); R.body.position.y = 0;
    const sw = Math.sin(t * 2.2) * 0.08;
    R.legs[0].rotation.x = 0.25 * prone + 0.08 + sw; R.legs[1].rotation.x = 0.35 * prone + 0.16 - sw;
    R.arms[0].rotation.x = 0.5 * prone + 0.18; R.arms[1].rotation.x = 0.5 * prone + 0.18; R.arms[0].rotation.z = -0.35 * prone - 0.22; R.arms[1].rotation.z = 0.35 * prone + 0.22;
    R.jets.forEach(j => { j.material.emissiveIntensity = 3 + 3 * power; });
    R.g.updateMatrixWorld(true);
    R.jets.forEach(j => {
      j.getWorldPosition(tv3); tv2.set(0, -1, 0).transformDirection(R.body.matrixWorld);
      const n = power > 0.6 ? 2 : 1;
      for (let i = 0; i < n; i++) emit(tv3, tv2.clone().multiplyScalar(rnd(8, 16) * (0.5 + 0.5 * power)), rnd(0.12, 0.26) * (0.6 + 0.4 * power), 0.25, 0.8 * (0.6 + 0.4 * power), [2.6, 2.0, 1.2], [1.2, 0.3, 0.05], 0.85, 2);
    });
  }

  // ---------------- tiện ích
  const cp = new V3(), cl = new V3(), wp = new V3(), wl = new V3(), hp = new V3(), hl = new V3(), sp = new V3(), sp2 = new V3();
  const setCam = (p, l, fov, roll = 0) => ctx.setCam(p, l, fov, roll);
  const chaseRoll = T => 0.02 * Math.sin(T * 0.6);   /* 2g: độ nghiêng nhẹ khi quay sau đuôi — dùng chung để nối liền */
  const curve = pts => { const c = new THREE.CatmullRomCurve3(pts, false, "centripetal"); c.arcLengthDivisions = 2000; return c; };   /* 2g: đo chiều dài mịn cho getPointAt */
  const at = (t, fn) => cues.push({ t, fn, done: false });
  const shipAt = (x, y, z, out) => fleet.group.localToWorld(out.set(x, y, z));
  const FWD = new V3(0, 0, 1), BACK = new V3(0, 0, -1);
  const escOff = new V3();
  function placeFleet(pos, fwd, bank, speed, pow, tuck = 0, arriveC = null) {
    fleet.cine.set(pos, fwd, bank, speed); fleet.cine.power(pow);
    escorts.forEach(e => {
      e.g.visible = true; e.g.quaternion.copy(fleet.group.quaternion);
      escOff.copy(e.off).lerp(e.tuck, tuck).applyQuaternion(fleet.group.quaternion);
      e.g.position.copy(pos).add(escOff);
      if (arriveC !== null) e.g.position.add(arriveOff(arriveC - e.lag, tv3)).sub(arriveOff(arriveC, tv2));   // hộ tống bay vào trễ hơn tàu mẹ một chút
    });
  }

  // ============================================================== MÀN CHỜ + đoạn bay chậm: hàm theo "thời gian bay" c (chạy liền từ màn chờ sang intro)
  const MENU = { ship: new V3(-20, 34, 860), cam: new V3(70, 66, 560), look: new V3(-10, 70, 1300) };
  const FLYIN = 8.5, ARR0 = new V3(-330, -18, -330);                 // lúc mở game: tàu bay vào từ góc dưới trái, chậm dần tới chỗ đậu
  const arriveOff = (c, out) => out.copy(ARR0).multiplyScalar(Math.pow(1 - clamp01(c / FLYIN), 3));
  const drift = c => 70 * (1 - Math.exp(-c / 30));                    // cả hạm đội lẫn máy quay vẫn trôi tới trước, chậm dần
  const UPV = new V3(0, 1, 0), lvA = new V3(), lvB = new V3();
  const sway = c => 0.035 * Math.sin(c * 0.5) + 0.015 * Math.sin(c * 1.3);          // lắc lư ngang (nghiêng cánh), không chúi/ngóc
  function levelDir(c, T, out) {                                                    // hướng bay NẰM NGANG theo đường đi + lệch hướng nhẹ chòng chành
    shipPos2(T, lvA); shipPos2(T + 0.05, lvB); out.copy(lvB).sub(lvA); out.y = 0;
    if (out.lengthSq() < 1e-6) out.set(0, 0, 1);
    return out.normalize().applyAxisAngle(UPV, 0.03 * Math.sin(c * 0.35));
  }
  function shipBase(c, out) { arriveOff(c, out); return out.add(MENU.ship).add(tv2.set(0, Math.sin(c * 0.6) * 0.8, drift(c))); }
  function camBase(c, out) { return out.copy(MENU.cam).add(tv2.set(Math.sin(c * 0.07) * 6, Math.sin(c * 0.11) * 2, drift(c) + 26 * (1 - Math.exp(-c / 14)))); }
  function lookBase(c, out) { return out.copy(MENU.look).add(tv2.set(0, 0, drift(c))); }

  // ============================================================== KỊCH BẢN (giây) — chậm, êm, không cắt cảnh
  const AL = 0.4, AL_OUT = 5.8, PRE = 6.1;           // bấm START ⇒ thông tin định vị hiện NGAY · ANDREW STUDIO PRESENTS sau đó
  const ACC = 0.5, CH0 = 4.2, CH1 = 7.8;              // tàu đi dần luôn · máy quay chuyển dần ra SAU LƯNG tàu
  const JS = [10.6, 14.8, 19.0];                      // 3 lần xuyên lỗ giun (lần 3 = tới vũ trụ đích)
  const SURGE = 150, SURGE_T = 1.5;                   // 1t: vọt sớm hơn (1,5 s trước lỗ giun, 150 đv) để thấy rõ lửa bùng trước khi trắng loá
  const W_IN = 0.8, W_HOLD = 0.25, W_OUT = 1.9;       // trắng loá: sáng dần 1,3 s ⇒ giữ ⇒ tối dần 1,9 s
  const J3 = JS[2], WIDE0 = J3 + 0.8, WIDE1 = J3 + 4.2;
  const EMD = 0.95, EML = 0.7, EOPEN = [0.12, 0.85];  // 2e: cổng ra mở từ j+0,12 tới j+0,85 (đủ to) ⇒ j+0,95 tàu mới bắt đầu ló ra
  const ENTER_LEAD = 0.55, CLOSE_T = 0.4, PASS = 185, START_BACK = 70;   // 2e: cổng vào góc rộng: tàu cuối vào hết lúc j−0,55 ⇒ lỗ co 0,4 s ⇒ trắng loá j
  const jEnd = j => (j !== JS[0] ? j - ENTER_LEAD : j);                   //      (PASS: đoạn bay tiếp sau mặt lỗ cho cả đội hình lọt qua · START_BACK: xuất phát sau mặt lỗ ra)
  const EM0 = J3 + EMD, EM1 = EM0 + EML;              // 2b: tàu chui ra khỏi LỖ ÁNH SÁNG ở vũ trụ đích (kéo giãn từ tâm lỗ)
  const WIDE_IN = j => j !== JS[0];                   // 2c: lỗ giun 2 và 3 lao vào trong GÓC RỘNG (lỗ 1 vẫn sau đuôi tàu)
  const W3_HOLD = 0.12, W3_OUT = 0.75;                // 2b: trắng loá lần cuối ngắn ⇒ kịp thấy lỗ sáng mở + tàu chui ra
  const FAR_P = new V3(175, 42, 20), FAR_L = new V3(-10, 64, 380);   // 2b: máy quay XA nhìn lỗ sáng + chỗ tàu treo
  const HOPEN = [J3 + 2.6, J3 + 3.4], DROP = J3 + 3.6, HCLOSE = [DROP + 1.0, DROP + 1.8];
  const F1 = DROP + 3.4, F2 = F1, F3 = F1, F4 = F1 + 1.6;   // 1s: vòng xuống gầm + bay thẳng tới cửa gầm (nhanh) · chui lên (không dừng ngắm)
  const BAY_O = [F1 - 1.0, F1 - 0.2], BAY_C = [F4 + 0.1, F4 + 0.8];
  const DECK0 = F4 - 0.2, DECK1 = F4 + 2.2, RISE = DECK1 - 0.3;
  const TURN = RISE + 2.0, BACKOUT = TURN + 1.1, DUR = BACKOUT + 3.0;   // 2h: ngắn hơn (2g: 2,9 · 1,5 · 3,8)
  const SKIP_T = J3 + 0.15;                            // bấm đúp ⇒ tới ngay lúc vừa ra khỏi lỗ giun cuối
  const O = () => ctx.overview;
  let S = null, flight = [], c0 = 0, whiteK = 0, tailing = false, deckPos = new V3(), deckLook = new V3();
  const white = ov.querySelector(".cine-white"), found = ov.querySelector(".cine-found");
  // vị trí tàu mẹ theo thời gian (dùng cả để đặt lỗ giun đúng chỗ tàu sẽ tới)
  // 2b: VỌT BẤT NGỜ đúng lúc lửa bùng (j − SURGE_T): giật tới ngay (vận tốc lớn nhất ở đầu), rồi lao tiếp vào lỗ giun
  // 2c: vọt = cộng thêm một vận tốc LỚN, bật lên gần như tức thì (0,1 s) rồi GIỮ NGUYÊN tới lúc chui vào lỗ (không chậm lại như 2b)
  const SURGE_V = 125;
  function surge(T) { const j = JS.find(x => x >= T); if (j === undefined) return 0; const e = jEnd(j), tau = Math.min(T, e) - (e - SURGE_T); if (tau <= 0) return 0;
    return SURGE_V * (tau < 0.1 ? tau * tau / 0.2 : tau - 0.05); }
  // 2e: vũ trụ 2, 3 — đường bay CONG từ mặt lỗ ra E tới mặt lỗ vào N (Bézier, đi theo độ dài cung): ra hơi chếch về máy quay (máy quay phía −x),
  //     rồi lái về +z để lao thẳng vào N; sau N bay tiếp PASS cho cả đội hình lọt qua mặt cắt.
  const WPATH = new Map(), tvW = new V3();
  // 2f: vừa ra khỏi lỗ còn ĐÀ CAO (+EXIT_V) giữ EXIT_A giây rồi hãm mềm (cos) tới EXIT_B ⇒ chậm lại ⇒ sau đó mới vọt vào lỗ kế
  const EXIT_V = 170, EXIT_A = 0.35, EXIT_B = 1.3;
  const exitGv = t => t < EXIT_A ? 1 : t < EXIT_B ? 0.5 + 0.5 * Math.cos(Math.PI * (t - EXIT_A) / (EXIT_B - EXIT_A)) : 0;   // hệ số vận tốc
  const exitG = t => t < EXIT_A ? t : t < EXIT_B ? EXIT_A + (t - EXIT_A) / 2 + (EXIT_B - EXIT_A) / (2 * Math.PI) * Math.sin(Math.PI * (t - EXIT_A) / (EXIT_B - EXIT_A)) : EXIT_A + (EXIT_B - EXIT_A) / 2;   // tích phân
  function widePath(j0) {
    let P = WPATH.get(j0); if (P) return P;
    const jn = j0 === JS[0] ? JS[1] : J3, e = jEnd(jn);
    const dist = T => { const t = Math.max(0, T - j0 - EMD); return 84 * t + 5 * t * t + EXIT_V * exitG(t) + surge(T); };   /* 2f: + đà cao lúc vừa ra */
    const S = dist(e), E = new V3(-20, 40, 780), d0 = new V3(-0.45, 0.03, 1).normalize();
    const N = new V3(-12, 44, 780 + Math.max(400, S - PASS - START_BACK));   // 2e: 2 lỗ cách nhau ≥ 400
    const L = N.distanceTo(E);
    const start = E.clone().addScaledVector(d0, -START_BACK);
    const curve = new THREE.CubicBezierCurve3(start, E.clone().addScaledVector(d0, L * 0.38), N.clone().add(new V3(0, 0, -L * 0.34)), N.clone());
    P = { j0, jn, e, E, N, d0, curve, Lc: curve.getLength(), S, dist }; WPATH.set(j0, P); return P;
  }
  function widePos(T, out, tan) {
    const P = widePath(T < JS[1] ? JS[0] : JS[1]), s = Math.min(1, P.dist(T) / P.S) * (P.Lc + PASS);
    if (s <= P.Lc) { const u = s / P.Lc; P.curve.getPointAt(u, out); if (tan) P.curve.getTangentAt(Math.min(0.999, Math.max(0.001, u)), tan); }
    else { out.copy(P.N).add(tvW.set(0, 0, s - P.Lc)); if (tan) tan.set(0, 0, 1); }
    return out;
  }
  const HOLE3 = new V3(-10, 74, 435);                  // 2e: mặt lỗ ra ở vũ trụ đích (tàu đi −z, từ z 435 về chỗ treo z 135)
  const shipPos2 = (T, out) => (active || tailing) ? shipPos(T, out) : shipBase(T, out);   // màn chờ: T là menuT
  function shipPos(T, out) {
    if (T < JS[0]) { const a = Math.max(0, T - ACC); shipBase(c0 + T, out); out.z += 2.6 * a * a * a / (a + 3) + surge(T); return out; }   /* 2f: trước là a²·min(1, a/3) ⇒ GÃY vận tốc ở T = 3,5 s (23 ⇒ 16 đv/s trong 1 khung) = cú giật lúc bay tới hành tinh đỏ; nay trơn */
    if (T < J3) return widePos(T, out);                                            // 2e: đường cong lỗ ra → lỗ vào
    const t = Math.max(0, T - EM0), go = Math.max(0, T - BACKOUT - 0.8);   // 2b: đứng trong tâm lỗ sáng tới EM0 rồi mới chui ra
    return out.set(-10, 58 + 16 * Math.exp(-t), 135 + (300 + START_BACK * Math.exp(-t * 2.2)) * Math.exp(-t * 0.75) - 20 * go * go);   // 2e: xuất phát SAU mặt lỗ (z 505) rồi ló ra nguyên cỡ   // 2c: ra khỏi lỗ 225 đv/s < lúc lao vào (~260)   // treo XA trạm (z 135) để địch không phát hiện sớm
  }
  function setupCues() {
    cues = [];
    const A = ctx.act, N = ctx.target;
    // 2j: tiếng nổ lỗ không gian — 2 tiếng sát nhau (< 0,35 s, vd lỗ ra cũ tắt đúng lúc lỗ vào co lại) gộp thành MỘT tiếng (giữ tiếng lớn hơn)
    const holes = [];
    const holeAt = (t, k) => { const o = holes.find(h => Math.abs(h.t - t) < 0.35); if (o) { o.k = Math.max(o.k, k); return; } const h = { t, k }; holes.push(h); at(t, () => snd.hole(0, h.k)); };
    at(0.0, () => { snd.music("nhac_intro", 0.8); snd.engineOn(3, 0.7); on(".mc-cine", "bars"); snd.braam(0.2); });   /* 2i: nhạc intro + động cơ tàu mẹ lặp */
    at(PRE, () => on(".cine-pre", "in"));
    typeAt(PRE + 0.1, [[$(".cine-pre span"), "ANDREW STUDIO"], [$(".cine-pre em"), "PRESENTS"]], 20);   /* 2j */
    at(PRE + 2.6, () => on(".cine-pre", "out"));
    at(AL, () => { al.classList.add("in"); alL[0].classList.add("on"); });   /* 2j: chữ gõ từng chữ + tiếng gõ phím (bỏ tiếng tít) */
    typeAt(AL, [[txtEl(alL[0]), "ENEMY LOCATED"]]);
    at(AL + 1.0, () => alL[1].classList.add("on")); typeAt(AL + 1.0, [[txtEl(alL[1], 0), "POSITION: "], [txtEl(alL[1], 1), String(A)]]);
    at(AL + 1.9 + Math.max(0, String(A).length - 14) / CPS, () => alL[2].classList.add("on")); typeAt(AL + 1.9 + Math.max(0, String(A).length - 14) / CPS, [[txtEl(alL[2], 0), "TARGET: "], [txtEl(alL[2], 1), `${N} WORDS`]]);
    at(AL_OUT, () => { al.classList.add("out"); });
    at(ACC + 0.1, () => exhaust(40, 0.6));                          // nổ máy: lửa bùng ở đuôi
    at(ACC, () => { snd.ignite(); snd.engineOn(2, 1); });   /* 2i: nổ máy */
    JS.forEach((j, i) => {
      at(j - 2.6, () => { snd.riser(1.7); });   /* 2i: tiếng dâng kết thúc đúng lúc lao vào lỗ (warp j−0,9) */
      at(j - 0.9, () => snd.warp());
      at(j - SURGE_T, () => { exhaust(60, 1); snd.boost(); });   // vọt: lửa bùng NỔ ở đuôi
      // 2j: lỗ VÀO xuất hiện (lúc vọt) · tàu CHUI VÀO · lỗ vào BIẾN MẤT (góc rộng thấy co lại; lỗ 1 sau đuôi thì trắng loá luôn)
      const e = jEnd(j);
      holeAt(e - SURGE_T, 0.6);
      holeAt(WIDE_IN(j) ? e - 0.75 : j - 0.35, 1);
      if (WIDE_IN(j)) holeAt(e + CLOSE_T * 0.6, 0.7);
      if (i === 2) at(j + 0.4, () => snd.braam(0.05));
      else at(j + EMD + 0.15, () => snd.flyby(0, -0.3));   /* 2i: góc rộng — tàu vút ra khỏi lỗ, lao ngang khung */
    });
    // 2j: lỗ RA (vũ trụ 2, 3, đích): xuất hiện · tàu CHUI RA · biến mất
    JS.forEach(j => { const e1 = j + EMD + 2.0; holeAt(j + EOPEN[0], 0.6); holeAt(j + EMD + 0.05, 1); holeAt(e1 + 0.9, 0.55); });
    const foundTxt = (txt, gal) => [[found.querySelector("small"), gal], [found.querySelector("span"), txt]];   /* 2j: trả về phần gõ · 2l: màu đặt lúc hiện */
    const GAL = ["M31 · ANDROMEDA GALAXY", "M51 · WHIRLPOOL GALAXY", "ANDREWMEDA GALAXY"];   // 2d: 2 thiên hà nổi tiếng + vũ trụ đích ANDREWMEDA
    [JS[0], JS[1]].forEach((j, i) => {                               // vùng không đúng ⇒ NOT FOUND đỏ nháy ở góc
      at(j + 1.0, () => { found.classList.add("bad", "in"); snd.scan(); });   /* 2m: quét radar */ typeAt(j + 1.0, foundTxt("NOT FOUND", GAL[i]));
      at(j + 1.0 + (GAL[i].length + 4) / CPS, () => snd.notFound());   /* 2l: tiếng hụt hẫng khi gõ tới chữ NOT FOUND */   /* 2j: gõ tên thiên hà + NOT FOUND */
      at(JS[i + 1] - 1.4, () => found.classList.remove("in"));
    });
    at(J3 + 1.3, () => { found.classList.remove("bad"); found.classList.add("in"); snd.impact(0.05); snd.scan(); });   /* 2m: quét radar */ typeAt(J3 + 1.3, foundTxt("ENEMY LOCATED", GAL[2]));
    at(J3 + 1.3 + (GAL[2].length + 2) / CPS, () => snd.found());   /* 2l: kèn "tìm thấy rồi" khi gõ tới ENEMY LOCATED */
    at(HOPEN[0], () => { hangar.visible = true; snd.door(); snd.hiss(0.15); });
    at(DROP - 0.02, () => buildFlight());
    at(DROP, () => { snd.jet(F1 - DROP); snd.flyby(0.2, 0.4); });
    at(HCLOSE[0], () => { snd.clank(); snd.servo(); });
    at(F1 + 0.6, () => found.classList.remove("in"));
    at(F2, () => snd.jet(F4 - F2 + 0.4, 0));
    at(BAY_O[0], () => { snd.servo(); snd.hiss(); snd.engineOff(3); });   /* 2i: robot tới gầm trạm ⇒ tiếng tàu mẹ lùi xa */
    at(BAY_C[0], () => { snd.servo(); snd.clank(0.1); });
    at(F3 + 0.68, () => { if (ctx.alarm) ctx.alarm(true); });   /* 2h: robot đã vào 2/3 thân (2f: F3+0,15 mới ló đầu) */                   /* 2f: robot bắt đầu chui vào cửa gầm ⇒ báo động đỏ */
    at(RISE, () => { ctx.robot.rise(1.05, deckPos); ctx.teammate.rise(1.05, deckPos); });
    at(TURN, () => snd.servo());   /* 2h: tường không dựng ở đây nữa */    /* 2f: robot quay người ⇒ tường dựng luôn */
    at(BACKOUT, () => handOff());                                    // câu hỏi đầu hiện NGAY khi máy quay bắt đầu lùi (tính vào thời gian đọc)
    at(BACKOUT + 0.8, () => { fleet.cine.power(2); });
  }
  // đường bay robot (dựng lúc nhảy, theo vị trí tàu thật): cửa khoang ⇒ lượn xuống ⇒ lơ lửng trước mép trạm ⇒ hạ xuống gầm ⇒ dưới cửa gầm
  const BOT = () => ctx.deckBottom;
  function buildFlight() {
    const st = ctx.start(), D2 = ctx.D / 2, B = BOT();
    const h0 = shipAt(0.02 * fleet.cine.sc, -0.03 * fleet.cine.sc, 0, new V3());
    const mk = (x, z, dx) => ({                                      // ra khỏi bụng tàu ⇒ vòng ngay xuống dưới ⇒ luồn dưới mép trạm ⇒ thẳng tới dưới cửa gầm
      f1: curve([h0.clone().add(new V3(dx, 0, 0)), h0.clone().add(new V3(dx + 5, -12, -2)), new V3(x + 26 + dx, -2, 70), new V3(x + 10 + dx, B - 9, D2 + 16),
        new V3(x + 3 + dx * 0.3, B - 6, D2 + 2), new V3(x + 0.6, B - 3.8, z + 3), new V3(x, B - 3.2, z)]),
      bay: new V3(x, B, z),
    });
    flight = [mk(st.x, st.z, 0)];
    if (ctx.teammate.on) { const [mx, mz] = ctx.teammate.cell(); flight.push(mk(mx, mz, -5)); }
    flight.forEach((f, i) => { bays[i].g.position.copy(f.bay).setY(B - 0.02); bays[i].g.visible = true; bays[i].set(0); });
  }
  function tickShip(T) {
    const pos = shipPos(T, sp); shipPos(T + 0.02, svA); shipV.copy(svA).sub(pos).multiplyScalar(50);   // vận tốc tàu (cho lửa bay theo đà)
    if (T < JS[0]) {                                                  // vùng 1: trôi chậm ⇒ tăng tốc DẦN, hơi ngóc lên
      const k = seg(T, ACC, JS[0] - 1), su = seg(T, JS[0] - SURGE_T, JS[0]);
      const sk = su > 0 ? Math.min(1, su / 0.12) : 0;                   // 2b: tốc + lửa bật NGAY lúc bùng
      placeFleet(pos, levelDir(c0 + T, T, sp2), sway(c0 + T), 4 + 30 * k * k + 200 * sk, 0.5 + 1.3 * eio(k) + 2.6 * sk * (1 - su * 0.3), eio(seg(T, CH0, CH1)), c0 + T);
      if (su > 0 && su < 1) exhaust(4, 1); else if (T > ACC && T < ACC + 1.6) exhaust(2, 0.5);
      stretchFleet(T);
    } else if (T < J3) {                                              // vùng 2, 3: vừa thoát lỗ giun, lao tiếp
      const t = T - (T < JS[1] ? JS[0] : JS[1]), e = jEnd(T < JS[1] ? JS[1] : J3);
      const su = seg(T, e - SURGE_T, e);
      const sk = su > 0 ? Math.min(1, su / 0.12) : 0;                   // 2b: tốc + lửa bật NGAY lúc bùng
      widePos(T, tv, tv2);                                               // 2e: hướng mũi = tiếp tuyến đường cong (ra chếch về máy quay rồi lái vào lỗ)
      placeFleet(pos, tv2.normalize(), 0.05 * Math.sin(t * 0.9 + 0.5) + 0.02 * Math.sin(t * 2.1), 84 + 10 * t + EXIT_V * exitGv(Math.max(0, t - EMD)) + 200 * sk, 1.8 + 1.4 * exitGv(Math.max(0, t - EMD)) + 2.6 * sk, 1);
      if (su > 0 && su < 1 && t > EMD && fleet.group.userData.flOn !== false) exhaust(4, 1);   /* 2e: không phun khi tàu đang trong cổng */
      stretchFleet(T);
    } else {                                                          // vũ trụ đích: hãm dần, treo xa trạm rồi bỏ đi
      const t = Math.max(0, T - EM0), go = T > BACKOUT + 0.8;
      placeFleet(pos, BACK, 0.05 * Math.sin(t * 0.7), 225 * Math.exp(-t * 0.75), go ? 2 : 1 + 1.6 * Math.exp(-t * 2), 1 - eio(seg(T, EM0 + 0.3, J3 + 4)));
      stretchFleet(T);
    }
  }
  // 2b: tàu + hộ tống chui ra từ tâm lỗ sáng: trước EM0 teo mất trong lõi sáng · EM0 → EM1 kéo giãn dọc thân + nở ngang
  // 2c: mọi lỗ giun — ra: nằm trong lõi EMD s (teo mất) rồi kéo giãn chui ra · vào (góc rộng): DIVE s cuối teo dần vào lõi
  // 2e: MẶT CẮT — clipA giấu phần tàu còn SAU mặt lỗ ra, clipB giấu phần đã qua mặt lỗ vào (vật liệu tàu mẹ + hộ tống dùng chung ⇒ gắn 1 lần).
  //     Không dùng thì đặt ở rất xa (giữ nguyên số mặt cắt ⇒ không phải dịch lại shader).
  const clipA = new THREE.Plane(new V3(0, 1, 0), 1e9), clipB = new THREE.Plane(new V3(0, 1, 0), 1e9), FAR_CLIP = new V3(0, 1, 0);
  // 2f: VIỀN SÁNG ở chỗ thân tàu cắt mặt lỗ — phần thân càng sát mặt cắt càng tự phát sáng (màu lỗ, vượt 1 ⇒ bloom loang) ⇒ mép cắt nhòe vào ánh sáng
  const SEAM = { uSA: { value: new THREE.Vector4(0, 1, 0, 1e9) }, uSB: { value: new THREE.Vector4(0, 1, 0, 1e9) }, uSW: { value: 9 }, uSC: { value: new THREE.Color(2.6, 2.2, 3.2) } };
  function addSeamGlow(m) {
    const prev = m.onBeforeCompile;
    m.onBeforeCompile = (sh, r) => {
      if (prev) prev(sh, r);
      Object.assign(sh.uniforms, SEAM);
      sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vSeamWP;")
        .replace("#include <project_vertex>", "#include <project_vertex>\n{ vec4 _sw = vec4(transformed, 1.0);\n#ifdef USE_INSTANCING\n_sw = instanceMatrix * _sw;\n#endif\nvSeamWP = (modelMatrix * _sw).xyz; }");
      sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nvarying vec3 vSeamWP; uniform vec4 uSA, uSB; uniform float uSW; uniform vec3 uSC;")
        .replace("#include <opaque_fragment>", "{ float dA = max(dot(uSA.xyz, vSeamWP) + uSA.w, 0.0), dB = max(dot(uSB.xyz, vSeamWP) + uSB.w, 0.0);\n  float sg = exp(-dA / uSW) + exp(-dB / uSW); outgoingLight = mix(outgoingLight, uSC, clamp(sg, 0.0, 1.0) * 0.85) + uSC * sg * 0.6; }\n#include <opaque_fragment>");
    };
    const pk = m.customProgramCacheKey ? m.customProgramCacheKey.bind(m) : null;
    m.customProgramCacheKey = () => (pk ? pk() : "") + "|seam2f";
  }
  const syncSeam = () => { SEAM.uSA.value.set(clipA.normal.x, clipA.normal.y, clipA.normal.z, clipA.constant); SEAM.uSB.value.set(clipB.normal.x, clipB.normal.y, clipB.normal.z, clipB.constant); };
  { const mats = new Set(); fleet.group.traverse(o => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => mats.add(m)); });
    escorts.forEach(e => e.g.traverse(o => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => mats.add(m)); }));
    mats.forEach(m => { m.clippingPlanes = [clipA, clipB]; if (m.isShaderMaterial) m.clipping = true; else addSeamGlow(m); m.needsUpdate = true; }); }   /* 2e: needsUpdate — shader đã dịch từ trước (không mặt cắt) ⇒ phải dịch lại, trước lượt làm nóng */
  const keepFront = (pl, n, pt) => pl.setFromNormalAndCoplanarPoint(n, pt);   // giữ phía pháp tuyến chỉ tới
  let HM = 0; const halfLen = g => { const b = g.children[0], q = g.quaternion.clone(), sc = g.scale.clone(), ps = g.position.clone();
    g.quaternion.identity(); g.scale.set(1, 1, 1); g.position.set(0, 0, 0); g.updateMatrixWorld(true);
    const bx = new THREE.Box3().setFromObject(b), v = bx.getSize(new V3()); g.quaternion.copy(q); g.scale.copy(sc); g.position.copy(ps); g.updateMatrixWorld(true);
    return Math.max(v.x, v.z) / 2; };
  const nIn = new V3(0, 0, -1);
  // cỡ theo khoảng cách tâm tàu tới mặt lỗ vào: còn xa ⇒ nguyên cỡ; mũi chạm lỗ ⇒ bắt đầu nhỏ dần; chui hẳn vào ⇒ 0,3
  const enterScale = (z, Nz, H) => { const d = z - Nz; return d < -H ? 1 : lerp(1, 0.3, eio(clamp01((d + H) / (2 * H)))); };
  // 2e: lửa đuôi / quầng (shader riêng, mặt cắt không giấu được) ⇒ tắt khi đuôi tàu còn trong cổng ra hoặc tàu đang chui vào cổng vào
  const flameParts = g => g.userData.fl || (g.userData.fl = (() => { const a = []; g.traverse(o => { if ((o.isMesh && o.material && o.material.isShaderMaterial) || o.isSprite || o.isPoints) a.push([o, o.visible]); }); return a; })());
  const setFlames = (g, on) => { if (g.userData.flOn === on) return; g.userData.flOn = on; flameParts(g).forEach(([o, v0]) => { o.visible = on && v0; }); };
  const tvF = new V3();
  const pastExit = (g, n, E, H) => tvF.copy(g.position).sub(E).dot(n) > H * 0.95;
  function stretchFleet(T) {
    if (!HM) HM = halfLen(fleet.group) || 47;
    clipA.set(FAR_CLIP, 1e9); clipB.set(FAR_CLIP, 1e9);
    const j0 = [...JS].reverse().find(j => T >= j);
    let sM = 1; const sE = escorts.map(() => 1);
    if (j0 !== undefined) {
      const tt = T - j0;
      if (tt < EMD) sM = 1e-4;                                           // cổng ra chưa mở đủ ⇒ chưa có tàu
      else if (j0 === J3) keepFront(clipA, BACK, HOLE3);                  // vũ trụ đích: chỉ có cổng ra
      else {
        const P = widePath(j0); keepFront(clipA, P.d0, P.E);             // cổng ra (pháp tuyến = hướng tàu lúc ra)
        keepFront(clipB, nIn, P.N);                                       // cổng vào: giữ phần CHƯA qua mặt lỗ
        if (T >= P.e) sM = 1e-4;                                          // cả đội hình đã vào hết
        else {
          sM = enterScale(fleet.group.position.z, P.N.z, HM);
          escorts.forEach((e, i) => { sE[i] = enterScale(e.g.position.z, P.N.z, HM * e.g.children[0].scale.x / fleet.group.children[0].scale.x); });
        }
      }
    }
    fleet.group.scale.setScalar(sM); escorts.forEach((e, i) => e.g.scale.setScalar(sM < 1e-3 ? 1e-4 : sE[i])); syncSeam();
    // lửa: chỉ bật khi đuôi đã ra khỏi cổng ra và tàu chưa bắt đầu chui vào cổng vào
    const ex = j0 === undefined ? null : j0 === J3 ? [BACK, HOLE3] : [widePath(j0).d0, widePath(j0).E];
    const hE = i => HM * escorts[i].g.children[0].scale.x / fleet.group.children[0].scale.x;
    setFlames(fleet.group, sM > 0.999 && (!ex || pastExit(fleet.group, ex[0], ex[1], HM)));
    if (fleet.cine.emit) fleet.cine.emit(fleet.group.userData.flOn !== false);   /* khói + lưỡi lửa của module tàu */
    escorts.forEach((e, i) => setFlames(e.g, sE[i] > 0.999 && sM > 1e-3 && (!ex || pastExit(e.g, ex[0], ex[1], hE(i)))));
  }
  const exitP = makePortal([1.5, 0.9, 0.45], [0.8, 0.25, 0.6]);   // 2b: lỗ ánh sáng ở vũ trụ đích (tàu chui ra)
  // 2c: lỗ RA ở vũ trụ 2, 3 (cùng màu lỗ tàu vừa chui vào) + vũ trụ đích
  const exits = [{ j: JS[0], P: makePortal([0.35, 0.8, 1.4], [0.45, 0.2, 0.9]) }, { j: JS[1], P: makePortal([0.4, 1.3, 0.95], [0.9, 0.45, 0.15]) }, { j: J3, P: exitP }];
  function tickExit(T, dt) {
    exits.forEach(({ j, P }) => {
      const e0 = j + EMD, e1 = e0 + 2.0, vis = T >= j && T < e1 + 1.4; P.g.visible = vis; if (!vis) return;   // 2e: mở ĐỦ TO trước khi tàu ló ra, đóng khi cả đội hình đã ra
      if (j === J3) P.g.position.copy(HOLE3); else P.g.position.copy(widePath(j).E); P.g.lookAt(camera().position);
      P.g.scale.setScalar(1);                                             /* 2f: lỗ to như ở vũ trụ đích (2e: 0,62 — thầy thấy bé) */
      P.m.uniforms.uT.value += dt;
      const open = eo(seg(T, j + EOPEN[0], j + EOPEN[1])) * (1 - eio(seg(T, e1, e1 + 1.4)));
      P.m.uniforms.uOpen.value = Math.max(0.001, open);
      P.m.uniforms.uI.value = (j === J3 ? 1 : 0.8) * (0.9 + 0.9 * Math.exp(-Math.max(0, T - e0) * 1.5) * seg(T, j, e0));
      P.halo.material.opacity = (j === J3 ? 0.35 : 0.24) * open;
    });
  }
  function tickPortals(T, dt) {
    portals.forEach((p, i) => {
      const j = JS[i], e = jEnd(j), t0 = e - SURGE_T, vis = T >= t0 && T < (WIDE_IN(j) ? e + CLOSE_T + 0.02 : j + 0.2); p.g.visible = vis; if (!vis) return;   // 2d: chỉ mở khi tàu bắt đầu vọt
      if (WIDE_IN(j)) p.g.position.copy(widePath(JS[i - 1]).N); else shipPos(j - 1e-3, p.g.position);
      p.g.scale.setScalar(1);                                             /* 2f: lỗ vào cũng to như vũ trụ đích */
      if (WIDE_IN(j)) p.g.lookAt(camera().position); else p.g.rotation.set(0, 0, 0);   // 2c: góc rộng ⇒ mặt lỗ quay về máy quay
      p.m.uniforms.uT.value += dt;
      // 2d: bung ra từ MỘT ĐIỂM (0 → 1 trong 0,9 s) · góc rộng: tàu teo vào lõi thì lỗ co lại theo, tới lúc lao hẳn vào thì khép kín
      // 2e: bung từ một điểm lúc tàu vọt · góc rộng: GIỮ mở tới khi tàu cuối đã vào hết (e) rồi mới CO LẠI trong CLOSE_T
      p.m.uniforms.uOpen.value = Math.max(0.001, eo(seg(T, t0, t0 + 0.9)) * (WIDE_IN(j) ? 1 - eio(seg(T, e, e + CLOSE_T)) : 1));
      p.m.uniforms.uI.value = 0.85 + 2.2 * Math.pow(seg(T, e - 1.0, e), 2) * (WIDE_IN(j) ? 0.6 : 1);
      p.halo.material.opacity = (WIDE_IN(j) ? 0.24 : 0.3) * p.m.uniforms.uOpen.value;
    });
  }
  // độ trắng loá quanh mỗi lỗ giun: tăng dần khi chui vào, giảm dần khi ra (mượt, không bật tắt)
  function whiteAt(T) {
    let k = 0;
    JS.forEach(j => {
      const H = W3_HOLD, OUT = j === J3 ? W3_OUT : 0.6, IN = WIDE_IN(j) ? 0.14 : W_IN;   // 2b: lần cuối ra nhanh · 2c: mọi lần ra nhanh, vào góc rộng loá ngắn
      if (T >= j - IN && T < j) { const u = seg(T, j - IN, j); k = Math.max(k, u * u * (3 - 2 * u) * u); }
      else if (T >= j && T < j + H) k = 1;
      else if (T >= j + H && T < j + H + OUT) { const u = seg(T, j + H, j + H + OUT); k = Math.max(k, 1 - u * u * (3 - 2 * u)); }
    });
    return k;
  }
  const wE = new V3(), wN = new V3(), wM = new V3(), WOFF = new V3(-0.86, 0.2, -0.42).normalize();   // 2d: máy quay bên TRÁI đường bay ⇒ tàu chạy trái → phải
  // 2c: hành tinh GẦN của vũ trụ 2, 3 (đặt cho cảnh sau đuôi) chắn giữa cảnh góc rộng ⇒ lùi cả cụm ra SAU đường bay (phía xa máy quay)
  const backdrop = name => { const g = SETS[name][0]; if (!g.userData.back) { g.userData.back = true; g.position.addScaledVector(WOFF, -950).y -= 120; } };   /* 2e: xa + thấp hơn nữa ⇒ không đứng trước 2 lỗ */
  // 2g: điểm nhìn góc rộng bám tàu qua bộ lọc 2 tầng (tàu ló ra/chui hết vào ⇒ máy quay bắt đầu/dừng quay ÊM, không giật)
  const wF = new V3(), wFv = new V3(); let wFT = -1, wFj = -1;
  function widePose(T, outP, outL) {                                  // 2c: đứng xa bên hông, thấy trọn đoạn từ lỗ ra tới lỗ vào
    const j0 = T < JS[1] ? JS[0] : JS[1], jn = T < JS[1] ? JS[1] : J3;
    const P = widePath(j0); wE.copy(P.E); wN.copy(P.N); wM.copy(wE).add(wN).multiplyScalar(0.5);   // 2e: 2 mặt lỗ
    const d = Math.max(300, wE.distanceTo(wN) * 0.8), u = seg(T, j0, jn);   // 2e: đủ gần để tàu to rõ, vẫn thấy cả 2 lỗ   // 2e: lùi xa hơn — lỗ sáng không choán khung, thấy rõ tàu ló ra
    outP.copy(wM).addScaledVector(WOFF, d).add(tv.set(0, 0, 60 * u - 30));
    if (wFj !== j0 || T < wFT || T - wFT > 0.5) { wF.copy(fleet.group.position); wFv.copy(wF); wFj = j0; }
    else { const a = 1 - Math.exp(-(T - wFT) / 0.22); wFv.lerp(fleet.group.position, a); wF.lerp(wFv, a); }
    wFT = T;
    outL.copy(wM).add(tv.set(0, -0.04 * d, 0)).lerp(wF, 0.15);
  }
  function chasePose(outP, outL) { const sc = fleet.cine.sc, s = active ? surge(T) : 0; shipAt(-1.3 * sc, 0.33 * sc, 0, outP); shipAt(1.25 * sc, 0.06 * sc, 0, outL); outP.z -= s; outL.z -= s * 0.35; }
  const cHv = new V3(), lHv = new V3(), cUn = new V3(), lUn = new V3();
  function tickCam(T) {
    const o = O(), st = ctx.start(), fo = ctx.focus ? ctx.focus() : { ...st, k: 1 }, B = BOT(), D2 = ctx.D / 2;   // 1x: fo = điểm giữa 2 robot (Fight)
    if (T < CH1) {                                                    // góc rộng (vẫn trôi tới như màn chờ) ⇒ chuyển dần ra sau lưng tàu
      camBase(c0 + T, wp).add(tv.set(0.8 * T, 0, 1.6 * T));
      lookBase(c0 + T, wl).lerp(fleet.group.position, 0.3 * eio(seg(T, 1, 9)));
      const k = eio(seg(T, CH0, CH1));
      if (k > 0) { chasePose(hp, hl); wp.lerp(hp, k); wl.lerp(hl, k); }
      setCam(wp, wl, 44 + 4 * k, k * chaseRoll(T));   /* 2g: nghiêng vào DẦN (2f: 0 rồi nhảy −1,15° ở CH1) */
    } else if (T < JS[0]) {                                           // 2c: CHỈ vũ trụ 1 quay sau đuôi tàu
      chasePose(cp, cl); setCam(cp, cl, 48, chaseRoll(T));
    } else if (T < J3) {                                              // 2c: vũ trụ 2, 3 — GÓC RỘNG: tàu ra từ lỗ này, lao vào lỗ kia trong cùng cảnh
      widePose(T, cp, cl); setCam(cp, cl, 42, 0);
    } else if (T < DECK0) {                                           // vũ trụ đích: góc NGANG rộng ⇒ robot nhảy ⇒ máy quay bám sát sau robot ⇒ dưới gầm nhìn lên cửa gầm
      if (!S) S = { rc: null };
      const k = eio(seg(T, J3 + 2.3, DROP + 0.4));                    // 2b: cảnh XA (lỗ sáng + tàu chui ra) ⇒ vào dần góc thả robot
      wp.set(150, 50, 150); wl.set(-7, 30, 66);
      if (flight.length && T > DROP) wl.lerp(ctx.astro.g.position, eio(seg(T, DROP, DROP + 0.8)) * 0.6);
      const dr = seg(T, J3, J3 + 3); hp.copy(FAR_P).add(tv.set(-6 * dr, 2 * dr, 10 * dr)); hl.copy(FAR_L).lerp(fleet.group.position, 0.25 * eio(seg(T, EM0, EM1 + 1.5)));
      hp.lerp(wp, k); hl.lerp(wl, k);
      if (flight.length && T > DROP + 0.3) {                          // bám sau lưng robot (theo hướng bay), mượt nhưng nhanh
        const R = ctx.astro.g.position; flight[0].f1.getTangentAt(Math.min(0.999, seg(T, DROP, F1)), rv);
        cHv.copy(R).addScaledVector(rv, -9).add(tv.set(2.5, 3, 0)); lHv.copy(R).addScaledVector(rv, 6);
        if (!S.rc) S.rc = { p: cHv.clone(), l: lHv.clone() }; S.rc.p.lerp(cHv, Math.min(1, 0.016 * 6)); S.rc.l.lerp(lHv, Math.min(1, 0.016 * 8));
        const kc = eio(seg(T, DROP + 0.3, DROP + 1.1)); hp.lerp(S.rc.p, kc); hl.lerp(S.rc.l, kc);
        cUn.set(st.x + 7, B - 7, st.z + 10); lUn.set(st.x, B - 1.2, st.z + 1);                  // dưới gầm, nhìn lên cửa gầm
        const ku = eio(seg(T, F1 - 1.0, F1)); hp.lerp(cUn, ku); hl.lerp(lUn, ku);
      }
      cp.copy(hp); cl.copy(hl); setCam(cp, cl, 50, 0);
    } else if (T < BACKOUT) {                                         // vòng ra ngoài mép trạm, lên sát boong ô xuất phát — robot trồi lên quay lưng, rồi quay mặt
      if (!S.deck) { S.deck = curve([cp.clone(), new V3(fo.x + 12, B - 3, D2 + 13), new V3(fo.x + 7, 4, D2 + 11), deckPos.clone()]); S.deckL = curve([cl.clone(), new V3(fo.x + 1, B, fo.z + 4), deckLook.clone()]); }
      const u = eio(seg(T, DECK0, DECK1)), push = eio(seg(T, DECK1, BACKOUT));
      S.deck.getPointAt(u, cp); S.deckL.getPointAt(u, cl);   /* 2g: chạy theo CHIỀU DÀI (getPoint chia đều từng đoạn ⇒ qua điểm nối tốc độ nhảy) */
      cp.add(tv.set(-0.4 * push, 0.2 * push, -0.6 * push)); cl.y += 0.5 * eio(seg(T, RISE, RISE + 1.8));   /* 2g: nâng điểm nhìn êm (2f: thẳng ⇒ bắt đầu/dừng đột ngột) */
      setCam(cp, cl, lerp(50, 40, u), 0);   /* 2g: nối liền góc zoom 50 của pha trước (2f: nhảy 50 ⇒ 46) */
    } else {                                                          // lùi dần về góc chơi (câu hỏi đầu đang hiện)
      if (!S.back) { S.back = curve([cp.clone(), new V3(fo.x + 7, 10, fo.z + 22), o.pos.clone()]); S.backL = curve([cl.clone(), new V3(fo.x, 1, fo.z - 2), o.look.clone()]); }
      const u = eio(seg(T, BACKOUT, DUR - 0.2)); S.back.getPointAt(u, cp); S.backL.getPointAt(u, cl); /* 2g: theo chiều dài ⇒ hết nhảy tốc độ ở điểm giữa (7,10,22) */ setCam(cp, cl, lerp(40, o.fov, u), 0);
    }
  }
  // robot: F1 lượn (nằm rạp ⇒ đứng dần) · F2 lơ lửng ngó nghiêng · F3 hạ xuống gầm · F4 từ từ chui lên cửa gầm
  const rp = new V3(), rv = new V3();
  const lerpAng = (a, b, k) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * k;
  function tickRobots(T, dt) {
    if (T < DROP || !flight.length) return;
    ctx.robot.free(T < F4 + 0.2);
    const st = ctx.start();
    flight.forEach((f, i) => {
      const R = i === 0 ? ctx.astro : ctx.teammate.model, ph = T + i * 0.7;
      if (T < F1) {
        const u0 = seg(T, DROP, F1), u = u0 < 0.8 ? u0 * 1.1 : 0.88 + 0.12 * eo((u0 - 0.8) / 0.2);   // nhanh đều, hãm ngắn ở cuối
        f.f1.getPointAt(Math.min(1, u), rp); f.f1.getTangentAt(Math.min(0.999, u), rv);
        const prone = 1 - eio(seg(T, F1 - 0.7, F1));
        jetPose(R, rp, lerpAng(Math.PI, Math.atan2(rv.x, rv.z), prone), prone, ph, dt * 1.8, 1);
      } else if (T < F2) {                                            // dừng một nhịp: nhìn trái, nhìn phải
        const t = T - F1; rp.copy(f.hv).add(tv.set(0, Math.sin(t * 2.1) * 0.12, 0));
        jetPose(R, rp, Math.PI + 0.38 * Math.sin(t * 1.6) * seg(t, 0, 0.5), 0, ph, dt, 0.55);
      } else if (T < F3) {                                            // hạ thấp xuống gầm
        const u = eio(seg(T, F2, F3)); f.f3.getPointAt(u, rp); f.f3.getTangentAt(Math.min(0.999, u), rv);
        jetPose(R, rp, lerpAng(Math.atan2(rv.x, rv.z), Math.PI, seg(T, F3 - 0.8, F3)), 0.25 * Math.sin(Math.PI * seg(T, F2, F3)), ph, dt, 0.7);
      } else if (T < F4 + 0.2) {                                      // từ từ chui lên cửa gầm
        const u = eio(seg(T, F3, F4)); rp.copy(f.bay).setY(f.bay.y - 3.2 + 5.4 * u);
        jetPose(R, rp, Math.PI, 0, ph, dt, 0.6 * (1 - u) + 0.2);
        if (rp.y > f.bay.y + 1.9) R.g.visible = false;
      } else if (T < RISE) { R.g.visible = false; }
    });
    const bo = eio(seg(T, BAY_O[0], BAY_O[1])) * (1 - eio(seg(T, BAY_C[0], BAY_C[1])));
    flight.forEach((f, i) => bays[i].set(bo));
    if (T > BAY_C[1] + 0.2) bays.forEach(b => { b.g.visible = false; });
  }

  // ---------------- màn chờ: tàu bay vào từ góc màn, chậm dần; máy quay vẫn trôi tới
  function menuTick(dt) {
    menuT += dt;
    shipBase(menuT, sp); const k = 1 - clamp01(menuT / FLYIN);
    placeFleet(sp, levelDir(menuT, menuT, sp2), sway(menuT) - 0.22 * k * k, 2 + 60 * k * k, 0.45 + 1.0 * k * k, 0, menuT);
    setCam(camBase(menuT, cp), lookBase(menuT, cl), 44, 0);
    farG.position.copy(cp);
    spinPlanets(dt);
  }
  const spinPlanets = dt => [home, teal, ember].forEach(g => g.children.forEach(p => { if (p.userData.spin) p.userData.spin.rotation.y += dt * 0.02; }));
  function resetText() { typers = []; ov.querySelectorAll(".cine-alert span, .cine-alert b, .cine-pre span, .cine-pre em, .cine-found small, .cine-found span").forEach(e => { e.textContent = ""; }); al.classList.remove("in", "out"); alL.forEach(l => l.classList.remove("on")); found.classList.remove("in", "bad"); ["in", "out"].forEach(c => $(".cine-pre").classList.remove(c)); }
  function handOff() {                                                // trao cho game: câu hỏi đầu hiện, intro vẫn lái máy quay tới hết đoạn lùi
    const cb = onDone; active = false; ov.hidden = true; ov.classList.remove("bars");
    parts.forEach(p => { p.s.visible = false; }); ctx.robot.free(false);
    cb && cb(); tailing = true;
  }
  function endAll() {
    active = false; tailing = false; hangar.visible = false; ov.hidden = true; dustK = 0; dust.visible = false; white.style.opacity = 0;
    portals.forEach(p => { p.g.visible = false; }); bays.forEach(b => { b.g.visible = false; }); parts.forEach(p => { p.s.visible = false; });
    exits.forEach(e => { e.P.g.visible = false; }); fleet.group.scale.set(1, 1, 1); clipA.set(FAR_CLIP, 1e9); clipB.set(FAR_CLIP, 1e9); syncSeam(); escorts.forEach(e => e.g.scale.set(1, 1, 1)); setFlames(fleet.group, true); escorts.forEach(e => setFlames(e.g, true)); if (fleet.cine.emit) fleet.cine.emit(true);   // 2e: bỏ mặt cắt, bật lại lửa   // 2b
    escorts.forEach(e => { e.g.visible = false; }); fleet.cine.end(); ctx.clearCam(); ctx.robot.free(false);
  }

  const api = {
    get active() { return active; },
    get tailing() { return tailing; },
    menu() {
      endAll(); menuOn = true; menuT = 0; cues = []; setSky("home"); showSet("home");
      ctx.prepMap(); ctx.useMap();
      fleet.cine.begin(2.0); hangar.visible = false;
      ov.hidden = false; ov.classList.remove("bars", "fadein"); resetText();
      menuTick(0);
    },
    start(done) {
      onDone = done; active = true; tailing = false; menuOn = false; T = 0; S = null; c0 = menuT; ov.hidden = false; ov.classList.remove("black", "fadein");
      flight = []; resetText(); setupCues();
      const fo = ctx.focus ? ctx.focus() : { ...ctx.start(), k: 1 }; deckPos.set(fo.x + 2.8 * fo.k, 2.9 + 3.2 * (fo.k - 1), fo.z + 9.0 * fo.k); deckLook.set(fo.x, 1.5, fo.z);   // 1x: Fight lùi xa thấy cả 2 robot
      [ctx.astro, ctx.teammate.model].forEach(R => { if (R) R.yawS = undefined; });
    },
    update(dt) {
      if (prep < 3) {                                                 // vẽ thử cảnh VŨ TRỤ ĐÍCH (tàu mẹ + hộ tống, máy quay sau lưng) dưới màn đen — không làm thì khựng lúc tới nơi
        prep++; setSky("enemy"); showSet("none"); portals.forEach(p => { p.g.visible = false; });
        placeFleet(tv.set(-10, 60, 300), BACK, 0, 300, 1.5); chasePose(cp, cl); setCam(cp, cl, 48, 0);
        farG.position.copy(cp); return;
      }
      if (prep < 6) {                                                 // vẽ thử mọi cảnh vật các thiên hà + lỗ giun + bụi sao + cửa gầm
        prep++; if (prep === 4) { setSky("home"); showSet("home"); }
        const all = [home, teal, ember, ...homeFar, ...tealFar, ...emberFar]; all.forEach(o => { o.visible = true; });
        hangar.visible = true; for (let i = 0; i < 4; i++) emit(MENU.ship, new V3(), 0.1, 1, 1, [1, 1, 1], [1, 1, 1], 0.01);
        portals.forEach((p, i) => { p.g.visible = true; p.g.position.set(MENU.ship.x + i * 40, MENU.ship.y, MENU.ship.z + 200); });
        bays.forEach((b, i) => { b.g.visible = true; b.g.position.set(MENU.ship.x - 20 + i * 5, MENU.ship.y, MENU.ship.z - 60); });
        dustK = 0.01; resetDust(MENU.ship.z); dust.visible = true;
        menuT = 0; setCam(MENU.cam, MENU.look, 44, 0); farG.position.copy(MENU.cam);
        if (prep === 6) { hangar.visible = false; portals.forEach(p => { p.g.visible = false; }); bays.forEach(b => { b.g.visible = false; }); dustK = 0; dust.visible = false; showSet("home"); menuT = 0; ov.classList.remove("black"); ov.classList.add("fadein"); }
        return;
      }
      if (menuOn) { menuTick(dt); return; }
      if (!active && !tailing) return;
      T += dt;
      for (const c of cues) if (!c.done && c.t <= T) { c.done = true; c.fn(); }
      tickType();   /* 2j */
      if (tailing) {                                                  // chỉ còn lái máy quay lùi về góc chơi + tàu mẹ rời đi
        tickShip(T); tickCam(Math.min(T, DUR)); tickParts(dt);
        if (T >= DUR) endAll();
        return;
      }
      // xuyên lỗ giun: đổi vùng không gian lúc màn hình trắng hẳn
      if (T >= JS[0] + 0.08 && galaxy === "home") { setSky("teal"); showSet("teal"); backdrop("teal"); resetDust(780); }
      if (T >= JS[1] + 0.08 && galaxy === "teal") { setSky("ember"); showSet("ember"); backdrop("ember"); resetDust(780); }
      if (T >= J3 + 0.08 && galaxy === "ember") { setSky("enemy"); showSet("none"); }
      whiteK = whiteAt(T); white.style.opacity = whiteK.toFixed(3);
      tickShip(T);
      tickPortals(T, dt); tickExit(T, dt);
      dustK = galaxy === "enemy" || T >= JS[0] ? 0 : 0.85 * seg(T, ACC + 0.8, ACC + 3.5);   // 2c: góc rộng không cần bụi bay qua máy quay
      const open = eo(seg(T, HOPEN[0], HOPEN[1])) * (1 - eio(seg(T, HCLOSE[0], HCLOSE[1])));
      leaves.forEach(({ l, s }) => { l.position.x = s * (0.0125 + 0.026 * open); });
      if (T > HCLOSE[1] && hangar.visible) hangar.visible = false;
      tickRobots(T, dt);
      if (T >= TURN && T < BACKOUT + 0.5) { const k = eio(seg(T, TURN, TURN + 1.0)); /* 2h: 1,3 ⇒ 1,0 */ ctx.robot.turn(k); ctx.teammate.turn(k); }
      tickCam(Math.min(T, DUR));
      farG.position.copy(camera().position);
      tickDust(camera().position.z);
      tickParts(dt); spinPlanets(dt);
    },
    skip() {                                                           // bấm đúp ⇒ tới cảnh tàu vừa ra khỏi lỗ giun cuối, sắp thả robot
      if (!active || T >= SKIP_T) return;
      snd.stop(); T = SKIP_T; S = null;
      cues.forEach(c => { if (c.t < T) c.done = true; });
      resetText(); on(".mc-cine", "bars");
      setSky("enemy"); showSet("none"); portals.forEach(p => { p.g.visible = false; }); dustK = 0; dust.visible = false;
      snd.music("nhac_intro", 0.3); snd.braam(0.05);
    },
    abort() {
      if (!active && !tailing) return; snd.stop(); endAll(); ctx.teammate.clear(); setSky("enemy"); showSet("none");
    },
    get times() { return { AL, ACC, CH0, CH1, JS, DROP, F1, F2, F3, F4, RISE, TURN, BACKOUT, DUR }; },
  };
  const camera = () => ctx.camera;
  window.__intro = { api, dbg: () => ({ D: ctx.D, st: ctx.start(), ov: ctx.overview, T, ship: fleet.group.position.clone(), robot: ctx.astro.g.position.clone(), cam: camera().position.clone() }) };   // móc thử
  return api;
}
