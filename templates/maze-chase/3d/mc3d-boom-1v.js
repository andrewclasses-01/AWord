// MẪU 1j (29/9/2026): chép mc3d-boom-1i.js + thầy: robot MÌNH nổ ⇒ KHÔNG còn xác, mà tung ra rất nhiều ĐỐM SÁNG như đom đóm, bung ra rồi
//   từ từ bay lên và tắt (fireflies) · vệt cháy MỖI VỤ NỔ MỘT KIỂU (6 mẫu + xoay/co giãn ngẫu nhiên) · khói (vệt cháy, xác, gạch) chỉ
//   bốc một lát rồi thưa dần và TẮT (không cháy mãi).
// MẪU 1i (29/9/2026): chép mc3d-boom-1h.js + shatter(): robot mình VỠ TỪ CHÍNH HÌNH DẠNG của nó đang bay lên — mọi bộ phận thật bị
//   cắt thành mảnh nhỏ theo lưới (mặt vỏ cong, kính, ba lô, chữ khắc… giữ nguyên màu/vân), văng theo lực nổ từ dưới lên.
// ---- ghi chú 1h: chép mc3d-boom-1f.js + xác ROBOT MÌNH (astroParts, wreck(...,"astro")) + gạch vụn tường (rubble).
// MAZE CHASE 3D — VỤ NỔ + XÁC ROBOT, bản 1f (chép mc3d-boom.js của 1e; thầy: "mảnh vỡ robot đang chỉ là các mảnh hình dạng đơn điệu,
// cần giống mảnh vỡ thực sự của 1 con robot sau vụ nổ" ⇒ xác = đúng các BỘ PHẬN của robot địch: mảng vỏ cong mép rách, đoạn vòng đèn gãy,
// mảnh mặt nạ còn khe mắt, tay kẹp đứt, ăng-ten cong, cụm động cơ, nửa vương miện, ốc vít, dây điện đứt, mảnh bảng mạch).
// ---- ghi chú 1e: (mẫu 1e, 29/9/2026). Thầy: "tạo vụ nổ phải siêu chân thực, khói lửa như thật";
// "robot nổ tung ra nhiều mảnh nằm rải rác trên sàn gần vị trí nổ, các mảnh cháy đen và bốc khói".
// explode(x, z): chớp sáng (đèn điểm có sẵn — KHÔNG thêm/bớt đèn giữa trận vì three.js dịch lại shader ⇒ khựng) + cầu lửa HDR
//   (trắng→vàng→cam→đỏ sẫm, bloom ăn) + khói đen cuộn bốc lên tan chậm + tàn lửa + sóng xung kích sát sàn + vết cháy xém.
// wreck(x, z, color): mảnh vỡ văng ra có vật lý (rơi, nảy, lăn, dừng), nguội từ đỏ than sang đen, bốc khói mãi tới hết câu.
import * as THREE from "../../rocket-race/vendor/three/three.module.min.js";
// 1v (30/9): vá NaN — đom đóm sống quá tuổi 1 nhịp ⇒ pow(số âm) = NaN màu ⇒ bloom loang khối đen trên TOMKO · tàn lửa màu âm

function tex(size, draw) {
  const c = document.createElement("canvas"); c.width = c.height = size;
  draw(c.getContext("2d"), size);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function blobTex(soft, holes) {     // cụm mây/lửa cuộn: đốm to + đốm nhỏ + lỗ thủng mờ ⇒ có "thớ", không phải quả cầu sáng trơn
  return tex(256, (g, s) => {
    const puff = (x, y, r, a) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(0.6, `rgba(255,255,255,${a * 0.45})`); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); };
    for (let i = 0; i < 18; i++) { const a = Math.random() * 7, d = Math.random() * s * 0.16; puff(s / 2 + Math.cos(a) * d, s / 2 + Math.sin(a) * d, s * (0.14 + Math.random() * 0.16), soft); }
    for (let i = 0; i < 60; i++) { const a = Math.random() * 7, d = Math.random() * s * 0.3; puff(s / 2 + Math.cos(a) * d, s / 2 + Math.sin(a) * d, s * (0.03 + Math.random() * 0.06), soft * 0.8); }
    g.globalCompositeOperation = "destination-out";
    for (let i = 0; i < holes; i++) { const a = Math.random() * 7, d = Math.random() * s * 0.3; puff(s / 2 + Math.cos(a) * d, s / 2 + Math.sin(a) * d, s * (0.03 + Math.random() * 0.05), 0.5); }
    g.globalCompositeOperation = "source-over";
  });
}

export function createBoomFX(scene) {
  const fireTexes = [blobTex(0.6, 26), blobTex(0.6, 26), blobTex(0.6, 26)], smokeTexes = [blobTex(0.42, 18), blobTex(0.42, 18), blobTex(0.42, 18)];
  const fireTex = fireTexes[0];
  // 1j: 6 kiểu vệt cháy — mỗi vụ nổ chọn một kiểu + xoay + co giãn + méo ngẫu nhiên ⇒ không vệt nào giống vệt nào
  const blot = (g, x, y, r, a) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(10,8,6,${a})`); gr.addColorStop(1, "rgba(10,8,6,0)"); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); };
  const ray = (g, s, n, r0, r1, w, a) => { g.strokeStyle = `rgba(0,0,0,${a})`; for (let i = 0; i < n; i++) { const t = Math.random() * 7, q = r1 * (0.6 + Math.random() * 0.4); g.lineWidth = w * (0.4 + Math.random()); g.beginPath(); g.moveTo(s / 2 + Math.cos(t) * r0, s / 2 + Math.sin(t) * r0); g.lineTo(s / 2 + Math.cos(t) * q, s / 2 + Math.sin(t) * q); g.stroke(); } };
  const scorchTexes = [
    tex(256, (g, s) => { for (let i = 0; i < 40; i++) { const a = Math.random() * 7, d = Math.random() * s * 0.22; blot(g, s / 2 + Math.cos(a) * d, s / 2 + Math.sin(a) * d, s * (0.08 + Math.random() * 0.2), 0.55); } ray(g, s, 30, s * 0.12, s * 0.48, 2, 0.35); }),        // loang + tia
    tex(256, (g, s) => { blot(g, s / 2, s / 2, s * 0.26, 0.8); ray(g, s, 70, s * 0.08, s * 0.5, 3.5, 0.3); ray(g, s, 24, s * 0.2, s * 0.5, 1.2, 0.5); }),                                   // sao nổ tia dài
    tex(256, (g, s) => { for (let k = 0; k < 90; k++) { const a = k / 90 * 7, d = s * (0.2 + Math.random() * 0.06); blot(g, s / 2 + Math.cos(a) * d, s / 2 + Math.sin(a) * d, s * 0.08, 0.5); } blot(g, s / 2, s / 2, s * 0.14, 0.35); }),   // vành cháy, lõi nhạt
    tex(256, (g, s) => { const ox = s * (0.4 + Math.random() * 0.2); for (let i = 0; i < 30; i++) blot(g, ox + (Math.random() - 0.3) * s * 0.4, s / 2 + (Math.random() - 0.5) * s * 0.3, s * (0.05 + Math.random() * 0.12), 0.6);
      for (let i = 0; i < 40; i++) { const a = Math.random() * 7, d = s * (0.25 + Math.random() * 0.22); blot(g, s / 2 + Math.cos(a) * d, s / 2 + Math.sin(a) * d, s * (0.01 + Math.random() * 0.025), 0.8); } }),                 // bắn toé lệch + giọt
    tex(256, (g, s) => { blot(g, s / 2, s / 2, s * 0.3, 0.6); g.strokeStyle = "rgba(0,0,0,.55)"; g.lineWidth = 1.5;
      for (let i = 0; i < 14; i++) { let x = s / 2, y = s / 2, a = Math.random() * 7; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 8; k++) { a += (Math.random() - 0.5) * 0.9; x += Math.cos(a) * s * 0.045; y += Math.sin(a) * s * 0.045; g.lineTo(x, y); } g.stroke(); } }),   // nứt than
    tex(256, (g, s) => { for (let i = 0; i < 26; i++) blot(g, s * (0.2 + Math.random() * 0.6), s / 2 + (Math.random() - 0.5) * s * 0.18, s * (0.06 + Math.random() * 0.1), 0.45); ray(g, s, 12, s * 0.05, s * 0.3, 1, 0.3); }),   // vệt muội kéo dài
  ];
  const ringTex = tex(256, (g, s) => {
    const gr = g.createRadialGradient(s / 2, s / 2, s * 0.3, s / 2, s / 2, s / 2);
    gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(0.75, "rgba(255,220,170,.9)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
  });

  // ---- bể hạt dạng sprite (lửa: cộng sáng; khói: che phủ thường)
  const group = new THREE.Group(); scene.add(group);
  const mkPool = (n, additive, maps) => Array.from({ length: n }, (_, i) => { const map = maps[i % maps.length];
    const m = new THREE.SpriteMaterial({ map, transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, rotation: Math.random() * 7 });
    const s = new THREE.Sprite(m); s.visible = false; group.add(s);
    return { s, m, life: 0, max: 1, vx: 0, vy: 0, vz: 0, s0: 1, s1: 1, spin: 0, kind: "" };
  });
  // lửa: PHỦ (không cộng sáng) — cộng sáng nhiều lớp chồng nhau ⇒ trắng kem như mây (đã thử); chỉ LÕI chớp đầu tiên là cộng sáng
  const fire = mkPool(90, false, fireTexes), smoke = mkPool(220, false, smokeTexes), core = mkPool(10, true, fireTexes);
  fire.forEach(p => { p.s.renderOrder = 8; }); smoke.forEach(p => { p.s.renderOrder = 7; }); core.forEach(p => { p.s.renderOrder = 9; });
  let fi = 0, si = 0;
  const FIRE_COL = [[1, 0.78, 0.38, 2.2], [1, 0.5, 0.12, 1.9], [0.92, 0.26, 0.05, 1.4], [0.42, 0.1, 0.03, 0.75], [0.1, 0.07, 0.06, 0.45]];   // vàng cam → cam đỏ → đỏ sẫm → khói nâu
  function fireColor(u, out) {          // u 0→1 dọc đời hạt; nhân > 1 ⇒ sáng HDR cho bloom
    const k = Math.min(FIRE_COL.length - 1.001, u * (FIRE_COL.length - 1)), i = Math.floor(k), f = k - i, a = FIRE_COL[i], b = FIRE_COL[i + 1];
    const m = a[3] + (b[3] - a[3]) * f;
    out.setRGB((a[0] + (b[0] - a[0]) * f) * m, (a[1] + (b[1] - a[1]) * f) * m, (a[2] + (b[2] - a[2]) * f) * m);
  }
  function spawnFire(x, y, z, big = 1) {
    const p = fire[fi++ % fire.length];
    const a = Math.random() * 7, sp = (2 + Math.random() * 5) * big;
    Object.assign(p, { life: 0, max: 0.55 + Math.random() * 0.55, vx: Math.cos(a) * sp, vy: 1.5 + Math.random() * 4.5, vz: Math.sin(a) * sp,
      s0: (0.7 + Math.random() * 0.9) * big, s1: (2.6 + Math.random() * 2.2) * big, spin: (Math.random() - 0.5) * 2, kind: "fire" });
    p.s.position.set(x + (Math.random() - 0.5) * 0.8, y + Math.random() * 0.6, z + (Math.random() - 0.5) * 0.8); p.s.visible = true;
  }
  function spawnSmoke(x, y, z, o = {}) {
    const p = smoke[si++ % smoke.length];
    const a = Math.random() * 7, sp = o.spread ?? (1 + Math.random() * 3);
    const grey = o.grey ?? (0.07 + Math.random() * 0.1);
    Object.assign(p, { life: -(o.delay || 0), max: o.max ?? (2.8 + Math.random() * 2.4), vx: Math.cos(a) * sp, vy: o.rise ?? (1.2 + Math.random() * 1.8), vz: Math.sin(a) * sp,
      s0: o.s0 ?? (1.5 + Math.random()), s1: o.s1 ?? (6 + Math.random() * 4), spin: (Math.random() - 0.5) * 0.8, kind: "smoke", op: o.op ?? 0.8 });
    p.m.color.setRGB(grey, grey, grey * 1.05);
    p.s.position.set(x + (Math.random() - 0.5) * 0.6, y, z + (Math.random() - 0.5) * 0.6); p.s.visible = false;
  }

  // ---- đèn chớp (thêm một lần lúc tạo, cường độ 0 khi rảnh)
  const flash = new THREE.PointLight(0xffa24a, 0, 34, 1.6); flash.position.set(0, 3, 0); scene.add(flash);
  let flashT = 9;

  // ---- sóng xung kích + vết xém + tàn lửa
  const rings = [], scorches = [];
  const ringGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  const sparks = [];
  const sparkGeo = new THREE.BufferGeometry(), NS = 260, sPos = new Float32Array(NS * 3), sCol = new Float32Array(NS * 3), sVel = new Float32Array(NS * 3), sLife = new Float32Array(NS);
  sparkGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3)); sparkGeo.setAttribute("color", new THREE.BufferAttribute(sCol, 3));
  const sparkPts = new THREE.Points(sparkGeo, new THREE.PointsMaterial({ size: 0.28, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, map: fireTex }));
  sparkPts.frustumCulled = false; sparkPts.renderOrder = 9; scene.add(sparkPts);
  let spi = 0;

  // ---- 1j: ĐOM ĐÓM — đốm sáng nhỏ bung ra từ thân robot, chậm lại, rồi lững lờ bay lên, lập loè và tắt dần
  const NF = 520, fPos = new Float32Array(NF * 3), fCol = new Float32Array(NF * 3), fVel = new Float32Array(NF * 3), fLife = new Float32Array(NF), fMax = new Float32Array(NF), fPh = new Float32Array(NF), fBase = new Float32Array(NF * 3), fHold = new Float32Array(NF);
  const flyGeo = new THREE.BufferGeometry(); flyGeo.setAttribute("position", new THREE.BufferAttribute(fPos, 3)); flyGeo.setAttribute("color", new THREE.BufferAttribute(fCol, 3));
  const dotTex = tex(64, (g, s) => { const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.25, "rgba(255,255,255,.75)"); gr.addColorStop(0.6, "rgba(255,255,255,.12)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, s, s); });
  const flyPts = new THREE.Points(flyGeo, new THREE.PointsMaterial({ size: 0.42, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, map: dotTex }));
  flyPts.frustumCulled = false; flyPts.renderOrder = 10; scene.add(flyPts);
  let fli = 0;
  const FLY_COL = [[1.5, 2.3, 0.55], [1.9, 2.0, 0.5], [2.3, 1.7, 0.45], [1.2, 2.4, 1.0]];   // xanh lá vàng · vàng chanh · vàng hổ phách · xanh bạc hà
  // 1l (thầy: "các đốm sáng nổ ra từ CHÍNH THÂN THỂ của robot cho chân thực"): o.pts = điểm lấy mẫu trên bề mặt các bộ phận robot
  //   (đúng tư thế lúc nổ) ⇒ khung đầu tiên đám đốm sáng còn nguyên hình robot, rồi bung ra theo hướng từ tâm thân ra ngoài.
  function fireflies(x, z, o = {}) {
    const n = o.n ?? 220, P = o.pts, cx = o.center ? o.center[0] : x, cy = o.center ? o.center[1] : 1.8, cz = o.center ? o.center[2] : z;
    for (let i = 0; i < n; i++) {
      const k = fli++ % NF, a = Math.random() * 7, el = Math.random() * 2 - 1, sp = 3 + Math.random() * 7.5;
      let px, py, pz;
      if (P && P.length) { const j = (i % (P.length / 3)) * 3; px = P[j] + (Math.random() - 0.5) * 0.05; py = P[j + 1] + (Math.random() - 0.5) * 0.05; pz = P[j + 2] + (Math.random() - 0.5) * 0.05; }
      else { px = x + (Math.random() - 0.5) * 1.2; py = 0.3 + Math.random() * 3.4; pz = z + (Math.random() - 0.5) * 1.2; }   // rải khắp thân robot
      fPos.set([px, py, pz], k * 3);
      if (P && P.length) {                                           // bung ra từ tâm thân (mảnh đầu bay lên, chân bay xuống/ngang) + hơi lệch
        let dx = px - cx, dy = py - cy, dz = pz - cz; const l = Math.hypot(dx, dy, dz) || 1, s2 = 2 + Math.random() * 6.5;
        dx = dx / l + (Math.random() - 0.5) * 0.7; dy = dy / l + (Math.random() - 0.5) * 0.7 + 0.25; dz = dz / l + (Math.random() - 0.5) * 0.7;
        fVel.set([dx * s2, dy * s2, dz * s2], k * 3);
      } else {
      const h = Math.sqrt(1 - el * el), up = el * 0.6 + 0.35;
      fVel.set([Math.cos(a) * h * sp, up * sp, Math.sin(a) * h * sp], k * 3);
      }
      fLife[k] = 0; fMax[k] = 2.4 + Math.random() * 2.4; fPh[k] = Math.random() * 100; fHold[k] = P && P.length ? (o.hold ?? 0.16) + Math.random() * 0.04 : 0;
      const c = FLY_COL[Math.floor(Math.random() * FLY_COL.length)]; fBase.set(c, k * 3);
    }
  }
  function updateFlies(dt) {
    let any = false;
    for (let k = 0; k < NF; k++) {
      if (fLife[k] >= fMax[k]) { fCol[k * 3] = fCol[k * 3 + 1] = fCol[k * 3 + 2] = 0; continue; }
      any = true; fLife[k] += dt; const t = fLife[k], u = t / fMax[k], ph = fPh[k];
      const hold = fHold[k] > 0 && t < fHold[k];                                                   // 1l: giữ nguyên HÌNH ROBOT một nhịp rồi mới bung
      const damp = hold ? 1 : Math.exp(-3.2 * dt);
      fVel[k * 3] = fVel[k * 3] * damp + Math.sin(t * 2.1 + ph) * 0.9 * dt;                        // chậm lại + chao lượn
      fVel[k * 3 + 2] = fVel[k * 3 + 2] * damp + Math.cos(t * 1.7 + ph * 1.3) * 0.9 * dt;
      fVel[k * 3 + 1] = fVel[k * 3 + 1] * damp + (0.9 + (ph % 1) * 0.8) * 1.6 * dt;                 // rồi từ từ bay lên
      if (!hold) { fPos[k * 3] += fVel[k * 3] * dt; fPos[k * 3 + 1] += fVel[k * 3 + 1] * dt; fPos[k * 3 + 2] += fVel[k * 3 + 2] * dt; }
      const tw = 0.55 + 0.45 * Math.sin(t * (5 + (ph % 3)) + ph) + (Math.sin(t * 23 + ph * 7) > 0.96 ? 0.6 : 0);   // lập loè
      const fade = (u < 0.05 && !fHold[k] ? u / 0.05 : 1) * (u > 0.45 ? Math.pow(Math.max(0, 1 - (u - 0.45) / 0.55), 1.6) : 1);
      const b = (hold ? 1.6 : Math.max(0, tw) * (1 + 1.2 * Math.max(0, 1 - (t - fHold[k]) / 0.4))) * fade;   // lúc giữ hình + vừa bung: sáng rực
      fCol[k * 3] = fBase[k * 3] * b; fCol[k * 3 + 1] = fBase[k * 3 + 1] * b; fCol[k * 3 + 2] = fBase[k * 3 + 2] * b;
    }
    if (any || flyGeo.userData.dirty) { flyGeo.attributes.position.needsUpdate = true; flyGeo.attributes.color.needsUpdate = true; flyGeo.userData.dirty = any; }
  }

  // ---- xác robot
  const wrecks = [];
  const RS = 1.6;                                               // robot địch dựng ở tỉ lệ 1,6 (makeDrone của 1b+)
  const rnd = (a, b) => a + Math.random() * (b - a);
  // mảng vỏ cầu: một "miếng" của mặt cầu, đỉnh xô lệch ⇒ mép rách lởm chởm, cong theo vỏ thật; đặt tâm về giữa miếng
  function shellGeo(R, dark) {
    const g = new THREE.SphereGeometry(R, 8, 6, rnd(0, 6.28), rnd(0.55, 1.2), dark ? rnd(1.6, 2.2) : rnd(0.25, 1.4), rnd(0.45, 0.85));
    const a = g.attributes.position, v = new THREE.Vector3();
    for (let k = 0; k < a.count; k++) { v.fromBufferAttribute(a, k); const n = v.clone().normalize(); v.addScaledVector(n, rnd(-0.03, 0.03) * R); v.x += rnd(-0.05, 0.05) * R; v.z += rnd(-0.05, 0.05) * R; a.setXYZ(k, v.x, v.y, v.z); }
    g.computeVertexNormals(); g.computeBoundingBox(); const c = g.boundingBox.getCenter(new THREE.Vector3()); g.translate(-c.x, -c.y, -c.z);
    return g;
  }
  function tubeGeo(len, r, bend) {
    const pts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(len * 0.35, rnd(-bend, bend), rnd(-bend, bend)), new THREE.Vector3(len * 0.7, rnd(-bend, bend), rnd(-bend, bend)), new THREE.Vector3(len, rnd(-bend, bend), rnd(-bend, bend))];
    const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, r, 6); g.translate(-len / 2, 0, 0); return g;
  }
  // mỗi mảnh = 1 Object3D + danh sách vật liệu (để cháy xém từng vật liệu theo kiểu của nó)
  function robotParts(color) {
    const C = new THREE.Color(color), glowC = C.clone().lerp(new THREE.Color(0xffffff), 0.35);
    const parts = [];
    const M = (o) => new THREE.MeshStandardMaterial({ metalness: 0.5, roughness: 0.4, envMapIntensity: 0.35, emissive: new THREE.Color(0xff5a14), emissiveIntensity: 0, ...o });
    const add = (obj, mats, r, kind) => { obj.traverse(o => { if (o.isMesh) { o.castShadow = true; } }); parts.push({ obj, mats, r, kind }); };
    const mesh = (geo, mat) => new THREE.Mesh(geo, mat);
    // 1) mảng vỏ màu robot (7) + vỏ đáy tối (2) — hai mặt (thấy mặt trong tối của vỏ)
    for (let k = 0; k < 7; k++) { const m = M({ color: C.clone(), side: THREE.DoubleSide, emissiveIntensity: 0.9 }); add(mesh(shellGeo(0.72 * RS, false), m), [{ m, kind: "hull" }], 0.35 * RS, "shell"); }
    for (let k = 0; k < 2; k++) { const m = M({ color: 0x1a1d2b, side: THREE.DoubleSide, metalness: 0.7 }); add(mesh(shellGeo(0.66 * RS, true), m), [{ m, kind: "dark" }], 0.32 * RS, "shell"); }
    // 2) đoạn vòng đèn gãy (còn le lói rồi tắt)
    for (let k = 0; k < 2; k++) { const m = M({ color: glowC, emissive: glowC, emissiveIntensity: 2.2 }); add(mesh(new THREE.TorusGeometry(0.74 * RS, 0.045 * RS, 6, 10, rnd(0.7, 1.3)).center(), m), [{ m, kind: "glow" }], 0.1 * RS, "ring"); }
    // 3) mặt nạ tối còn khe mắt vỡ
    { const face = M({ color: 0x14161f, side: THREE.DoubleSide, metalness: 0.7, roughness: 0.3 }), eye = M({ color: glowC, emissive: glowC, emissiveIntensity: 3 });
      const g = new THREE.Group();
      const fg = new THREE.SphereGeometry(0.7 * RS, 10, 5, Math.PI / 2 - 0.6, 1.2, 1.25, 0.45); fg.computeBoundingBox(); const c = fg.boundingBox.getCenter(new THREE.Vector3()); fg.translate(-c.x, -c.y, -c.z);
      g.add(mesh(fg, face));
      const e = mesh(new THREE.CapsuleGeometry(0.06 * RS, 0.28 * RS, 4, 8), eye); e.rotation.z = Math.PI / 2; e.scale.z = 0.45; e.position.set(0.05, 0.02, 0.06); g.add(e);
      add(g, [{ m: face, kind: "dark" }, { m: eye, kind: "glow" }], 0.25 * RS, "visor"); }
    // 4) tay kẹp đứt rời (vai–cánh tay–khuỷu–cẳng–2 càng)
    for (let k = 0; k < 2; k++) {
      const steel = M({ color: 0x8c93a8, metalness: 0.85, roughness: 0.3 }), dark = M({ color: 0x1a1d2b, metalness: 0.7 });
      const g = new THREE.Group(), s = RS;
      const j1 = mesh(new THREE.SphereGeometry(0.12 * s, 10, 8), dark); g.add(j1);
      const a1 = mesh(new THREE.CylinderGeometry(0.05 * s, 0.05 * s, 0.34 * s, 8), steel); a1.rotation.z = 0.9; a1.position.set(0.13 * s, -0.1 * s, 0); g.add(a1);
      const j2 = mesh(new THREE.SphereGeometry(0.07 * s, 8, 6), dark); j2.position.set(0.26 * s, -0.2 * s, 0); g.add(j2);
      const a2 = mesh(new THREE.CylinderGeometry(0.045 * s, 0.045 * s, 0.3 * s, 8), steel); a2.rotation.z = rnd(-0.4, 0.8); a2.position.set(0.36 * s, -0.3 * s, 0); g.add(a2);
      for (const q of [-1, 1]) { const cl = mesh(new THREE.ConeGeometry(0.035 * s, 0.18 * s, 6), steel); cl.position.set(0.44 * s, -0.42 * s, q * 0.04 * s); cl.rotation.z = Math.PI + q * 0.35; g.add(cl); }
      g.children.forEach(o => o.position.x -= 0.22 * s);
      add(g, [{ m: steel, kind: "steel" }, { m: dark, kind: "dark" }], 0.18 * RS, "arm");
    }
    // 5) ăng-ten cong gãy + đầu đèn
    { const steel = M({ color: 0x8c93a8, metalness: 0.85 }), tip = M({ color: glowC, emissive: glowC, emissiveIntensity: 2 });
      const g = new THREE.Group(); g.add(mesh(tubeGeo(0.5 * RS, 0.02 * RS, 0.12 * RS), steel));
      const t = mesh(new THREE.SphereGeometry(0.06 * RS, 8, 6), tip); t.position.x = 0.25 * RS; g.add(t);
      add(g, [{ m: steel, kind: "steel" }, { m: tip, kind: "glow" }], 0.06 * RS, "antenna"); }
    // 6) cụm động cơ dưới đáy (thân + vòng loa phụt)
    { const dark = M({ color: 0x1a1d2b, metalness: 0.8 }), noz = M({ color: glowC, emissive: glowC, emissiveIntensity: 1.5 });
      const g = new THREE.Group(); g.add(mesh(new THREE.CylinderGeometry(0.26 * RS, 0.2 * RS, 0.2 * RS, 16), dark));
      const n = mesh(new THREE.TorusGeometry(0.2 * RS, 0.04 * RS, 8, 20), noz); n.rotation.x = Math.PI / 2; n.position.y = -0.1 * RS; g.add(n);
      add(g, [{ m: dark, kind: "dark" }, { m: noz, kind: "glow" }], 0.12 * RS, "engine"); }
    // 7) nửa "vương miện" 6 cạnh trên nóc
    { const m = M({ color: 0x1a1d2b, metalness: 0.75 }); add(mesh(new THREE.CylinderGeometry(0.3 * RS, 0.42 * RS, 0.16 * RS, 6, 1, false, 0, rnd(2.2, 3.4)).center(), m), [{ m, kind: "dark" }], 0.08 * RS, "crown"); }
    // 8) ốc vít lục giác
    for (let k = 0; k < 6; k++) { const m = M({ color: 0x9aa1b3, metalness: 0.9, roughness: 0.25 }); const o = mesh(new THREE.CylinderGeometry(0.05 * RS, 0.05 * RS, 0.04 * RS, 6), m); add(o, [{ m, kind: "steel" }], 0.02 * RS, "bolt"); }
    // 9) dây điện đứt (đỏ / vàng / đen)
    for (const col of [0xdc2626, 0xfacc15, 0x111111]) { const m = M({ color: col, metalness: 0, roughness: 0.6 }); add(mesh(tubeGeo(rnd(0.35, 0.6) * RS, 0.018 * RS, 0.1 * RS), m), [{ m, kind: "wire" }], 0.03 * RS, "wire"); }
    // 10) mảnh bảng mạch xanh có linh kiện
    { const pcb = M({ color: 0x14532d, metalness: 0.2, roughness: 0.6 }), chip = M({ color: 0x111111, metalness: 0.3 }), led = M({ color: 0xff3030, emissive: 0xff3030, emissiveIntensity: 2 });
      const g = new THREE.Group(); g.add(mesh(new THREE.BoxGeometry(0.34 * RS, 0.025 * RS, 0.22 * RS), pcb));
      for (let k = 0; k < 3; k++) { const c = mesh(new THREE.BoxGeometry(0.07 * RS, 0.03 * RS, 0.05 * RS), chip); c.position.set(rnd(-0.12, 0.12) * RS, 0.025 * RS, rnd(-0.07, 0.07) * RS); g.add(c); }
      const l = mesh(new THREE.SphereGeometry(0.018 * RS, 6, 4), led); l.position.set(0.13 * RS, 0.03 * RS, 0.08 * RS); g.add(l);
      add(g, [{ m: pcb, kind: "pcb" }, { m: chip, kind: "dark" }, { m: led, kind: "glow" }], 0.02 * RS, "pcb"); }
    return parts;
  }

  // 1h: xác ROBOT MÌNH (phi hành gia, dựng ở tỉ lệ 1,75): mảnh mũ + kính vàng + mảnh thân + ba lô + 2 bình xanh + tay + găng + ủng
  //     + bảng ngực có đèn + đai lưng gãy + ốc + dây — cháy nhẹ hơn xác địch (bộ đồ vải/nhựa: xám khói chứ không đen kịt)
  const AS = 1.75;
  function astroParts() {
    const parts = [];
    const M = (o) => new THREE.MeshStandardMaterial({ metalness: 0.1, roughness: 0.7, envMapIntensity: 0.3, emissive: new THREE.Color(0xff5a14), emissiveIntensity: 0, ...o });
    const add = (obj, mats, r, kind) => { obj.traverse(o => { if (o.isMesh) o.castShadow = true; }); parts.push({ obj, mats, r, kind }); };
    const mesh = (geo, mat) => new THREE.Mesh(geo, mat);
    const SUIT = 0x8290a6, FAB = 0x5f6b82, BLUE = 0x2563eb, DARK = 0x2b3345;
    for (let k = 0; k < 4; k++) { const m = M({ color: SUIT, side: THREE.DoubleSide, emissiveIntensity: 0.6 }); add(mesh(shellGeo(0.5 * AS, false), m), [{ m, kind: "suit" }], 0.22 * AS, "shell"); }       // mảnh mũ
    for (let k = 0; k < 3; k++) { const m = M({ color: SUIT, side: THREE.DoubleSide, emissiveIntensity: 0.6 }); add(mesh(shellGeo(0.44 * AS, false), m), [{ m, kind: "suit" }], 0.2 * AS, "shell"); }      // mảnh thân
    { const m = M({ color: 0xffc861, metalness: 1, roughness: 0.18, envMapIntensity: 1.2, side: THREE.DoubleSide });                                                                                     // kính mũ vàng nứt
      const g = new THREE.SphereGeometry(0.5 * AS, 12, 6, Math.PI / 2 - 0.8, 1.6, 0.9, 0.9); g.computeBoundingBox(); const c = g.boundingBox.getCenter(new THREE.Vector3()); g.translate(-c.x, -c.y, -c.z);
      add(mesh(g, m), [{ m, kind: "steel" }], 0.18 * AS, "visor"); }
    { const suit = M({ color: SUIT }), dark = M({ color: DARK, metalness: 0.6 });                                                                                                                         // ba lô móp
      const g = new THREE.Group(); const b = mesh(new THREE.BoxGeometry(0.62 * AS, 0.5 * AS, 0.3 * AS), suit); b.rotation.z = 0.15; g.add(b);
      for (let i = 0; i < 3; i++) { const st = mesh(new THREE.BoxGeometry(0.3 * AS, 0.03 * AS, 0.03 * AS), dark); st.position.set(0, (0.12 - i * 0.08) * AS, 0.16 * AS); g.add(st); }
      add(g, [{ m: suit, kind: "suit" }, { m: dark, kind: "dark" }], 0.15 * AS, "engine"); }
    for (let k = 0; k < 2; k++) { const m = M({ color: BLUE, metalness: 0.3, roughness: 0.4 }); add(mesh(new THREE.CylinderGeometry(0.1 * AS, 0.1 * AS, 0.55 * AS, 14), m), [{ m, kind: "blue" }], 0.1 * AS, "tank"); }   // bình
    for (let k = 0; k < 2; k++) {                                                                                                                                                                         // cánh tay đứt + găng
      const suit = M({ color: SUIT }), fab = M({ color: FAB }), dark = M({ color: DARK, metalness: 0.6 }), blue = M({ color: BLUE });
      const g = new THREE.Group();
      const up = mesh(new THREE.CapsuleGeometry(0.12 * AS, 0.22 * AS, 4, 10), suit); up.rotation.z = Math.PI / 2; up.position.x = -0.18 * AS; g.add(up);
      const cuff = mesh(new THREE.TorusGeometry(0.12 * AS, 0.03 * AS, 6, 14), blue); cuff.rotation.y = Math.PI / 2; g.add(cuff);
      const fo = mesh(new THREE.CapsuleGeometry(0.11 * AS, 0.18 * AS, 4, 10), fab); fo.rotation.z = Math.PI / 2 + rnd(-0.6, 0.6); fo.position.x = 0.17 * AS; g.add(fo);
      const gl = mesh(new THREE.SphereGeometry(0.12 * AS, 12, 8), dark); gl.position.x = 0.34 * AS; g.add(gl);
      add(g, [{ m: suit, kind: "suit" }, { m: fab, kind: "suit" }, { m: dark, kind: "dark" }, { m: blue, kind: "blue" }], 0.12 * AS, "arm");
    }
    for (let k = 0; k < 2; k++) {                                                                                                                                                                         // ủng
      const dark = M({ color: DARK, metalness: 0.6 }), blue = M({ color: BLUE });
      const g = new THREE.Group(); g.add(mesh(new THREE.BoxGeometry(0.26 * AS, 0.14 * AS, 0.36 * AS), dark));
      const bs = mesh(new THREE.BoxGeometry(0.27 * AS, 0.04 * AS, 0.37 * AS), blue); bs.position.y = 0.08 * AS; g.add(bs);
      add(g, [{ m: dark, kind: "dark" }, { m: blue, kind: "blue" }], 0.07 * AS, "boot");
    }
    { const dark = M({ color: DARK, metalness: 0.6 }), scr = M({ color: 0x0b3b4a, emissive: 0x22d3ee, emissiveIntensity: 1.2 });                                                                        // bảng ngực + đèn
      const g = new THREE.Group(); g.add(mesh(new THREE.BoxGeometry(0.44 * AS, 0.07 * AS, 0.28 * AS), dark));
      const sc = mesh(new THREE.BoxGeometry(0.2 * AS, 0.02 * AS, 0.1 * AS), scr); sc.position.set(-0.08 * AS, 0.045 * AS, -0.04 * AS); g.add(sc);
      const leds = [0xef4444, 0x22c55e, 0xfacc15].map((c, i) => { const m = M({ color: c, emissive: c, emissiveIntensity: 1.4 }); const l = mesh(new THREE.CylinderGeometry(0.028 * AS, 0.028 * AS, 0.03 * AS, 10), m); l.position.set((0.04 + i * 0.06) * AS, 0.045 * AS, 0.07 * AS); g.add(l); return m; });
      add(g, [{ m: dark, kind: "dark" }, { m: scr, kind: "glow" }, ...leds.map(m => ({ m, kind: "glow" }))], 0.04 * AS, "pcb"); }
    { const m = M({ color: DARK, metalness: 0.7 }); add(mesh(new THREE.TorusGeometry(0.42 * AS, 0.065 * AS, 8, 16, rnd(1.6, 2.6)).center(), m), [{ m, kind: "dark" }], 0.07 * AS, "ring"); }      // đai lưng gãy
    for (let k = 0; k < 4; k++) { const m = M({ color: 0x9aa1b3, metalness: 0.9, roughness: 0.25 }); add(mesh(new THREE.CylinderGeometry(0.045 * AS, 0.045 * AS, 0.035 * AS, 6), m), [{ m, kind: "steel" }], 0.02 * AS, "bolt"); }
    for (const col of [0xdc2626, 0xfacc15]) { const m = M({ color: col, roughness: 0.6 }); add(mesh(tubeGeo(rnd(0.3, 0.5) * AS, 0.016 * AS, 0.08 * AS), m), [{ m, kind: "wire" }], 0.03 * AS, "wire"); }
    return parts;
  }
  // 1h: gạch vụn tường bị bom phá — khối màu tường + mảnh viền sáng, văng RA XA quả bom rồi nằm lại
  function rubble(x, z, fromX, fromZ, color, capColor) {
    const frags = [];
    const away = Math.atan2(z - fromZ, x - fromX);
    for (let k = 0; k < 9; k++) {
      const cap = k < 2, m = new THREE.MeshStandardMaterial({ color: cap ? capColor : color, metalness: 0.15, roughness: 0.5, envMapIntensity: 0.2, emissive: new THREE.Color(0xff5a14), emissiveIntensity: 0.4 });
      const sz = cap ? [rnd(0.5, 0.9), 0.1, rnd(0.2, 0.3)] : [rnd(0.3, 0.75), rnd(0.25, 0.6), rnd(0.2, 0.45)];
      const o = new THREE.Mesh(new THREE.BoxGeometry(...sz), m); o.castShadow = true;
      o.position.set(x + rnd(-0.8, 0.8), rnd(0.4, 2.2), z + rnd(-0.8, 0.8)); o.rotation.set(rnd(0, 7), rnd(0, 7), rnd(0, 7)); scene.add(o);
      const a = away + rnd(-0.9, 0.9), sp = rnd(2, 6);
      m.base = m.color.clone();
      frags.push({ m: o, mats: [{ m, kind: "wall", base: m.color.clone() }], r: sz[1] / 2, vx: Math.cos(a) * sp, vy: rnd(3, 8), vz: Math.sin(a) * sp,
        wx: rnd(-10, 10), wy: rnd(-10, 10), wz: rnd(-10, 10), rest: false, smokeT: 9, smokes: false });
    }
    for (let i = 0; i < 8; i++) spawnSmoke(x, 0.8, z, { delay: Math.random() * 0.2, spread: 1.5, rise: 0.8, s0: 0.8, s1: 3.5, max: 1.6, grey: 0.3, op: 0.55 });   // bụi tường
    wrecks.push({ x, z, frags, t: 0, plumeT: 0, noPlume: true, life: 6 });
  }

  // 1i: VỠ TỪ CHÍNH HÌNH DẠNG — lấy từng mesh của robot (đã đặt đúng chỗ trong thế giới), cắt tam giác của nó theo lưới ô ~cell
  //     (ranh giới ô xô lệch ngẫu nhiên ⇒ mép vỡ lởm chởm), mỗi ô = một mảnh vỏ thật; mảnh văng ra xa tâm nổ + hất lên.
  // ⚡ CẮT SẴN một lần (lần gọi đầu, lúc làm nóng khi tải trang): mảnh tính trong hệ toạ độ RIÊNG của từng mesh ⇒ lần nổ thật chỉ việc
  //    đặt mảnh theo tư thế robot lúc đó. Trước đó cắt ngay lúc nổ: khựng 0,12 s + rác bộ nhớ gây khựng thêm 0,16 s sau đó.
  const _v = new THREE.Vector3(), _m4 = new THREE.Matrix4(), _t4 = new THREE.Matrix4(), _q4 = new THREE.Quaternion(), _s4 = new THREE.Vector3();
  function buildCache(root, cell) {
    const cache = [];
    root.updateMatrixWorld(true);
    root.traverse(m => {
      if (!m.isMesh || !m.material || !m.material.isMeshStandardMaterial) return;
      const ws = m.matrixWorld.getMaxScaleOnAxis() || 1, lc = cell / ws;
      const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
      const P = g.attributes.position.array, Nn = g.attributes.normal && g.attributes.normal.array, U = g.attributes.uv && g.attributes.uv.array;
      g.computeBoundingBox(); const bb = g.boundingBox, sz = bb.getSize(new THREE.Vector3());
      const n = [sz.x, sz.y, sz.z].map(d => Math.min(4, Math.max(1, Math.round(d / lc))));
      const jit = lc * 0.3, buckets = new Map(), tri = P.length / 9;
      for (let t = 0; t < tri; t++) {
        const c = [0, 1, 2].map(a => (P[t * 9 + a] + P[t * 9 + 3 + a] + P[t * 9 + 6 + a]) / 3 + rnd(-jit, jit));
        const id = [0, 1, 2].map(a => Math.min(n[a] - 1, Math.max(0, Math.floor((c[a] - bb.min.getComponent(a)) / Math.max(1e-6, sz.getComponent(a)) * n[a]))));
        const k = id[0] + id[1] * 4 + id[2] * 16; let arr = buckets.get(k); if (!arr) buckets.set(k, arr = []); arr.push(t);
      }
      const pieces = [];
      for (const list of buckets.values()) {
        const pos = new Float32Array(list.length * 9), nor = Nn ? new Float32Array(list.length * 9) : null, uv = U ? new Float32Array(list.length * 6) : null;
        list.forEach((t, i) => { pos.set(P.subarray(t * 9, t * 9 + 9), i * 9); if (nor) nor.set(Nn.subarray(t * 9, t * 9 + 9), i * 9); if (uv) uv.set(U.subarray(t * 6, t * 6 + 6), i * 6); });
        const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        if (nor) pg.setAttribute("normal", new THREE.BufferAttribute(nor, 3)); else pg.computeVertexNormals();
        if (uv) pg.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
        pg.computeBoundingBox(); const c = pg.boundingBox.getCenter(new THREE.Vector3()); pg.translate(-c.x, -c.y, -c.z);
        const s3 = pg.boundingBox.getSize(new THREE.Vector3());
        pieces.push({ geo: pg, c, minDim: Math.min(s3.x, s3.y, s3.z), tris: list.length });
      }
      g.dispose();
      cache.push({ mesh: m, pieces });
    });
    return cache;
  }
  const bitGeos = [tubeGeo(0.35, 0.02, 0.1), new THREE.CylinderGeometry(0.05, 0.05, 0.05, 6), new THREE.TetrahedronGeometry(0.08)];
  // BỘ MẢNH dựng sẵn (mesh + vật liệu riêng từng bộ) — nổ lần sau lấy bộ đang rảnh ra đặt lại, không tạo mới gì ⇒ không khựng.
  //   Hai lần vỡ trong cùng một câu (xác cũ còn nằm đó) ⇒ dựng thêm bộ thứ hai. Dọn màn (clear) ⇒ các bộ rảnh lại.
  const BITS = [[0x9aa1b3, "steel"], [0x2b3345, "dark"], [0xdc2626, "wire"], [0xfacc15, "wire"]];
  function buildSet(cache) {
    const set = { inUse: false, items: [], bits: [] };
    for (const entry of cache) {
      const src = entry.mesh.material, mat = src.clone(); mat.side = THREE.DoubleSide; mat.userData.keep = true;
      const glow = src.emissiveIntensity > 0.5 && src.emissive.getHex() !== 0, kind = glow ? "glow" : src.metalness > 0.8 ? "steel" : "shard";
      const mm = { m: mat, kind, base: src.color.clone(), src, glow };
      for (const pc of entry.pieces) {
        const mesh = new THREE.Mesh(pc.geo, mat); mesh.userData.keepGeo = true; mesh.castShadow = pc.tris >= 24;   // mảnh vụn không đổ bóng
        set.items.push({ entry, pc, mesh, mm });
      }
    }
    for (let k = 0; k < 22; k++) {
      const [col, kind] = BITS[k % BITS.length], mat = new THREE.MeshStandardMaterial({ color: col, metalness: kind === "steel" ? 0.9 : 0.3, roughness: 0.4, emissive: new THREE.Color(0xff5a14), emissiveIntensity: 0 });
      mat.userData.keep = true;
      const mesh = new THREE.Mesh(kind === "wire" ? bitGeos[0] : bitGeos[1 + (k % 2)], mat); mesh.userData.keepGeo = true; mesh.scale.setScalar(rnd(0.7, 1.4));
      set.bits.push({ mesh, mm: { m: mat, kind, base: mat.color.clone() } });
    }
    return set;
  }
  function shatter(root, ox, oz, o = {}) {
    const cell = o.cell ?? 0.34, up = o.up ?? 7, frags = [];
    const cache = root.userData.shatterCache || (root.userData.shatterCache = buildCache(root, cell));
    const sets = root.userData.shatterSets || (root.userData.shatterSets = []);
    let set = sets.find(x => !x.inUse); if (!set) sets.push(set = buildSet(cache));
    set.inUse = true;
    root.updateMatrixWorld(true);
    let smokers = 0;                                                   // chỉ vài mảnh to bốc khói (khói nhiều = nặng máy)
    const reset = new Set();
    for (const it of set.items) {
      const { entry, pc, mesh, mm } = it, m = entry.mesh;
      if (!reset.has(mm)) {                                            // trả vật liệu về màu gốc (lần trước đã cháy xém)
        reset.add(mm); const mat = mm.m, src = mm.src;
        mat.color.copy(src.color); mat.roughness = src.roughness;
        if (mm.glow) { mat.emissive.copy(src.emissive); mat.emissiveIntensity = src.emissiveIntensity; mat.userData.e0 = src.emissiveIntensity; }
        else { mat.emissive.setHex(0xff5a14); mat.emissiveIntensity = 0.15; }
      }
      const ws = m.matrixWorld.getMaxScaleOnAxis() || 1;
      _m4.multiplyMatrices(m.matrixWorld, _t4.makeTranslation(pc.c.x, pc.c.y, pc.c.z)).decompose(mesh.position, mesh.quaternion, mesh.scale);
      scene.add(mesh);
      // lực nổ: đẩy RA XA tâm (theo phương ngang) + hất lên; mảnh ở thấp (gần vụ nổ) bị hất mạnh hơn
      const c = mesh.position, dx = c.x - ox, dz = c.z - oz, dl = Math.hypot(dx, dz) || 1, low = Math.max(0, 1 - c.y / 5);
      const sp = rnd(1.5, 4.5) + low * 2.5, light = pc.tris < 12;
      frags.push({ m: mesh, mats: [mm], r: Math.max(0.03, pc.minDim * ws * 0.5 + 0.02),
        vx: dx / dl * sp * (light ? 1.4 : 1) + rnd(-1, 1), vy: up * rnd(0.55, 1.15) + low * 3, vz: dz / dl * sp * (light ? 1.4 : 1) + rnd(-1, 1),
        wx: rnd(-14, 14), wy: rnd(-14, 14), wz: rnd(-14, 14), rest: false, smokeT: Math.random() * 1.5, smokes: pc.tris > 60 && smokers < 6 && !!(++smokers) });
    }
    // vụn nhỏ: ốc, mẩu dây, mạt kim loại — cho đống xác có chi tiết
    for (const b of set.bits) {
      b.mm.m.color.copy(b.mm.base); b.mm.m.emissiveIntensity = 0;
      b.mesh.position.set(ox + rnd(-0.4, 0.4), rnd(1, 3), oz + rnd(-0.4, 0.4)); scene.add(b.mesh);
      const a = rnd(0, 7), sp = rnd(3, 7);
      frags.push({ m: b.mesh, mats: [b.mm], r: 0.03, vx: Math.cos(a) * sp, vy: rnd(5, 11), vz: Math.sin(a) * sp, wx: rnd(-16, 16), wy: rnd(-16, 16), wz: rnd(-16, 16), rest: false, smokeT: 9, smokes: false });
    }
    wrecks.push({ x: ox, z: oz, frags, t: 0, plumeT: 0, set });
  }

  function explode(x, z, power = 1) {
    flash.position.set(x, 2.5, z); flashT = 0;
    for (let i = 0; i < core.length; i++) {                         // lõi chớp trắng-vàng, rất ngắn
      const p = core[i]; Object.assign(p, { life: 0, max: 0.16 + Math.random() * 0.12, vx: 0, vy: 0, vz: 0, s0: 1.5, s1: 4 + Math.random() * 2, spin: 0, kind: "core" });
      p.s.position.set(x + (Math.random() - 0.5), 1 + Math.random(), z + (Math.random() - 0.5)); p.s.visible = true;
    }
    for (let i = 0; i < 30 * power; i++) spawnFire(x, 0.6, z, power);
    for (let i = 0; i < 40 * power; i++) spawnSmoke(x, 0.8, z, { delay: 0.12 + Math.random() * 0.4, spread: 1.2 + Math.random() * 3, grey: 0.04 + Math.random() * 0.07, op: 0.9 });
    for (let i = 0; i < 14; i++) spawnSmoke(x, 0.2, z, { delay: 0.02, spread: 6 + Math.random() * 3, rise: 0.25, s0: 1, s1: 4, max: 1.8, grey: 0.25, op: 0.5 });   // bụi quét sàn
    for (let i = 0; i < 120 * power; i++) {
      const k = spi++ % NS, a = Math.random() * 7, sp = 6 + Math.random() * 14, up = 3 + Math.random() * 11;
      sPos.set([x, 0.8, z], k * 3); sVel.set([Math.cos(a) * sp, up, Math.sin(a) * sp], k * 3); sLife[k] = 0.6 + Math.random() * 1.2;
    }
    const rm = new THREE.MeshBasicMaterial({ map: ringTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffd9a0 });
    const ring = new THREE.Mesh(ringGeo, rm); ring.position.set(x, 0.12, z); ring.renderOrder = 6; scene.add(ring); rings.push({ m: ring, t: 0 });
    const sz = 7 + Math.random() * 4.5;
    const sc = new THREE.Mesh(new THREE.PlaneGeometry(sz, sz * (0.75 + Math.random() * 0.5)).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ map: scorchTexes[Math.floor(Math.random() * scorchTexes.length)], transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    sc.position.set(x, 0.03, z); sc.rotation.y = Math.random() * 7; scene.add(sc); scorches.push(sc);
    smolder(x, z, 5 + power * 2);                                      // 1j: vệt cháy âm ỉ bốc khói một lát rồi tắt
  }

  function wreck(x, z, color, type) {
    const frags = [];
    for (const p of (type === "astro" ? astroParts() : robotParts(color))) {
      const o = p.obj;
      o.position.set(x + rnd(-0.5, 0.5), 1.4 + rnd(0, 0.8), z + rnd(-0.5, 0.5));
      o.rotation.set(rnd(0, 7), rnd(0, 7), rnd(0, 7));
      scene.add(o);
      const light = p.kind === "bolt" || p.kind === "wire" || p.kind === "pcb";
      const a = rnd(0, 7), sp = light ? rnd(2.5, 5) : rnd(1.2, 3.4);       // mảnh nhẹ văng xa hơn, mảng vỏ nằm gần chỗ nổ
      p.mats.forEach(mm => { mm.base = mm.m.color.clone(); });
      frags.push({ m: o, mats: p.mats, r: p.r, vx: Math.cos(a) * sp, vy: rnd(3.5, 8), vz: Math.sin(a) * sp,
        wx: rnd(-12, 12), wy: rnd(-12, 12), wz: rnd(-12, 12), rest: false, smokeT: Math.random() * 1.5, smokes: p.kind === "shell" || p.kind === "engine" || p.kind === "visor" });
    }
    wrecks.push({ x, z, frags, t: 0, plumeT: 0, life: 8 });
  }
  // 1j: đám cháy âm ỉ không có mảnh (vệt cháy) — khói thưa dần rồi tắt
  function smolder(x, z, life = 6) { wrecks.push({ x, z, frags: [], t: 0, plumeT: 0.3, life, thin: true }); }

  const _c = new THREE.Color(), CHAR = new THREE.Color(0x121212);
  function update(dt) {
    updateFlies(dt);
    // chớp
    if (flashT < 1) { flashT += dt; flash.intensity = Math.max(0, 380 * Math.pow(1 - Math.min(1, flashT / 0.5), 2.2) * (0.85 + Math.random() * 0.3)); }
    else flash.intensity = 0;
    // lửa
    for (const p of fire) {
      if (!p.s.visible) continue;
      p.life += dt; const u = p.life / p.max;
      if (u >= 1) { p.s.visible = false; continue; }
      p.vx *= 1 - 3 * dt; p.vz *= 1 - 3 * dt; p.vy = p.vy * (1 - 1.5 * dt) + 2.2 * dt;
      p.s.position.x += p.vx * dt; p.s.position.y += p.vy * dt; p.s.position.z += p.vz * dt;
      p.s.scale.setScalar(p.s0 + (p.s1 - p.s0) * (1 - Math.pow(1 - u, 2.5)));
      fireColor(u, p.m.color); p.m.opacity = u < 0.06 ? u / 0.06 : 0.95 * (1 - Math.pow(u, 2.2));
      p.m.rotation += p.spin * dt;
    }
    for (const p of core) {
      if (!p.s.visible) continue;
      p.life += dt; const u = p.life / p.max;
      if (u >= 1) { p.s.visible = false; continue; }
      p.s.scale.setScalar(p.s0 + (p.s1 - p.s0) * u); p.m.color.setRGB(2.2, 1.6, 0.9); p.m.opacity = 0.55 * (1 - u);
    }
    // khói
    for (const p of smoke) {
      if (p.life < p.max && p.kind === "smoke") {
        p.life += dt;
        if (p.life < 0) continue;
        p.s.visible = true;
        const u = p.life / p.max;
        if (u >= 1) { p.s.visible = false; p.kind = ""; continue; }
        p.vx *= 1 - 1.6 * dt; p.vz *= 1 - 1.6 * dt; p.vy *= 1 - 0.35 * dt;
        p.s.position.x += p.vx * dt + 0.25 * dt; p.s.position.y += p.vy * dt; p.s.position.z += p.vz * dt;
        p.s.scale.setScalar(p.s0 + (p.s1 - p.s0) * Math.sqrt(u));
        p.m.opacity = p.op * (u < 0.12 ? u / 0.12 : Math.pow(1 - u, 1.4));
        p.m.rotation += p.spin * dt;
      }
    }
    // tàn lửa
    for (let k = 0; k < NS; k++) {
      if (sLife[k] <= 0) { sCol[k * 3] = sCol[k * 3 + 1] = sCol[k * 3 + 2] = 0; continue; }
      sLife[k] -= dt;
      sVel[k * 3 + 1] -= 18 * dt;
      for (let a = 0; a < 3; a++) { sVel[k * 3 + a] *= 1 - 0.8 * dt; sPos[k * 3 + a] += sVel[k * 3 + a] * dt; }
      if (sPos[k * 3 + 1] < 0.05) { sPos[k * 3 + 1] = 0.05; sVel[k * 3 + 1] *= -0.3; }
      const h = Math.max(0, Math.min(1, sLife[k])); sCol[k * 3] = 3 * h; sCol[k * 3 + 1] = 1.3 * h * h; sCol[k * 3 + 2] = 0.3 * h * h * h;
    }
    sparkGeo.attributes.position.needsUpdate = true; sparkGeo.attributes.color.needsUpdate = true;
    // sóng xung kích
    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i]; r.t += dt; const u = r.t / 0.45;
      if (u >= 1) { scene.remove(r.m); r.m.material.dispose(); rings.splice(i, 1); continue; }
      const s = 1 + 16 * (1 - Math.pow(1 - u, 3)); r.m.scale.set(s, 1, s); r.m.material.opacity = 1 - u;
    }
    // xác robot: vật lý mảnh + nguội dần + khói
    for (const w of wrecks) {
      w.t += dt;
      const cool = Math.min(1, w.t / 2.2), ch = Math.min(1, w.t / 1.1);
      for (const f of w.frags) {
        if (!f.rest) {
          f.vy -= 22 * dt;
          f.m.position.x += f.vx * dt; f.m.position.y += f.vy * dt; f.m.position.z += f.vz * dt;
          f.m.rotation.x += f.wx * dt; f.m.rotation.y += f.wy * dt; f.m.rotation.z += f.wz * dt;
          if (f.m.position.y < f.r) {
            f.m.position.y = f.r; f.vy *= -0.3; f.vx *= 0.5; f.vz *= 0.5; f.wx *= 0.4; f.wy *= 0.5; f.wz *= 0.4;
            if (Math.abs(f.vy) < 0.8 && Math.hypot(f.vx, f.vz) < 0.4) { f.rest = true; f.settle = 0; f.q0 = f.m.quaternion.clone();
              f.q1 = new THREE.Quaternion().setFromEuler(new THREE.Euler(rnd(-0.35, 0.35), rnd(0, 7), rnd(-0.35, 0.35))); }
          }
        } else if (f.settle < 1) {                                   // đổ nghiêng nằm xuống sàn (không lơ lửng nghiêng vô lý)
          f.settle = Math.min(1, f.settle + dt / 0.35); f.m.quaternion.slerpQuaternions(f.q0, f.q1, f.settle * f.settle);
        }
        for (const mm of f.mats) {                                     // cháy: vỏ màu → đen xém (còn ánh màu), thép → xám khói, đèn tắt dần
          const k = mm.kind;
          if (k === "glow") { mm.m.emissiveIntensity = Math.max(0, (mm.m.userData.e0 ??= mm.m.emissiveIntensity) * (1 - Math.min(1, w.t / 1.6)) + (Math.random() < 0.03 && w.t < 3 ? 1.5 : 0)); mm.m.color.copy(_c.copy(mm.base).lerp(CHAR, ch * 0.88)); continue; }
          const amt = k === "hull" ? 0.94 : k === "wire" ? 0.8 : k === "pcb" ? 0.8 : k === "suit" ? 0.72 : k === "shard" ? 0.62 : k === "blue" ? 0.6 : k === "wall" ? 0.45 : 0.6;   // vỏ địch gần đen; đồ phi hành gia xám khói; tường xém nhẹ
          mm.m.color.copy(_c.copy(mm.base).lerp(CHAR, ch * amt));
          mm.m.emissiveIntensity = k === "shard" ? 0.15 * Math.pow(1 - cool, 3) : (k === "hull" || k === "suit" || k === "wall") ? (k === "hull" ? 0.9 : 0.6) * Math.pow(1 - cool, 2) + (k === "hull" && Math.sin(w.t * 3 + f.smokeT * 9) > 0.97 ? 0.5 : 0) * (1 - cool * 0.7) : 0;
          mm.m.roughness = 0.4 + 0.5 * ch;
        }
        f.smokeT -= dt;
        if (f.rest && f.smokes && f.smokeT <= 0 && w.t < (w.life ?? 8) * Math.random()) {   // 1j: càng về sau càng hiếm, hết tuổi thì thôi                   // mảng vỏ / động cơ / mặt nạ thỉnh thoảng nhả khói mảnh
          f.smokeT = 0.5 + Math.random() * 1.1;
          spawnSmoke(f.m.position.x, f.m.position.y + 0.2, f.m.position.z, { spread: 0.3, rise: 1 + Math.random(), s0: 0.4, s1: 2.6, max: 2.6, grey: 0.12, op: 0.55 });
        }
      }
      w.plumeT -= dt;
      const k = Math.max(0, 1 - w.t / (w.life ?? 8));                              // 1j: sức cháy còn lại 1 → 0
      if (!w.noPlume && k > 0 && w.plumeT <= 0) {                                   // cột khói: thưa dần, mỏng dần rồi tắt
        w.plumeT = 0.22 + (1 - k) * 0.7;
        spawnSmoke(w.x + (Math.random() - 0.5), 0.5, w.z + (Math.random() - 0.5), { spread: 0.4, rise: 1.4 + Math.random() * 0.8 * k, s0: 0.9, s1: (w.thin ? 3.6 : 5) * (0.5 + 0.5 * k), max: 3.2, grey: 0.09, op: 0.6 * k });
      }
    }
  }

  function clear() {
    wrecks.forEach(w => w.frags.forEach(f => { scene.remove(f.m); f.m.traverse(o => { if (o.isMesh && !o.userData.keepGeo) o.geometry.dispose(); }); f.mats.forEach(mm => { if (!mm.m.userData.keep) mm.m.dispose(); }); }));
    wrecks.forEach(w => { if (w.set) w.set.inUse = false; });
    wrecks.length = 0;
    scorches.forEach(s => { scene.remove(s); s.material.dispose(); s.geometry.dispose(); }); scorches.length = 0;
    rings.forEach(r => { scene.remove(r.m); r.m.material.dispose(); }); rings.length = 0;
    fire.forEach(p => { p.s.visible = false; }); core.forEach(p => { p.s.visible = false; }); smoke.forEach(p => { p.s.visible = false; p.kind = ""; }); sLife.fill(0);
    flash.intensity = 0; flashT = 9;
    fLife.fill(0); fMax.fill(0); fCol.fill(0); flyGeo.attributes.color.needsUpdate = true;
  }
  return { explode, wreck, rubble, shatter, fireflies, smolder, update, clear };
}

// ---- quả bom đặt trên sàn: thân cầu thép đen + chóp + ngòi có tia lửa + đèn đỏ nhấp nháy + vòng cảnh báo sàn
export function makeBomb() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.62, 28, 20), new THREE.MeshStandardMaterial({ color: 0x15171d, metalness: 0.6, roughness: 0.35 }));
  body.position.y = 0.62; body.castShadow = true; g.add(body);
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.05, 8, 32), new THREE.MeshStandardMaterial({ color: 0x5b606e, metalness: 0.9, roughness: 0.3 }));
  band.position.y = 0.62; band.rotation.x = Math.PI / 2; g.add(band);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.22, 16), new THREE.MeshStandardMaterial({ color: 0x8a8f9c, metalness: 0.9, roughness: 0.25 }));
  cap.position.y = 1.28; g.add(cap);
  const fuse = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 1.38, 0), new THREE.Vector3(0.12, 1.6, 0.05), new THREE.Vector3(0.28, 1.68, 0.1)]), 12, 0.035, 6),
    new THREE.MeshStandardMaterial({ color: 0x8b6b3d, roughness: 0.9 }));
  g.add(fuse);
  const spark = new THREE.Sprite(new THREE.SpriteMaterial({ color: new THREE.Color(4, 2.4, 0.8), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    map: (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d"); const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "#fff"); gr.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })() }));
  spark.position.set(0.28, 1.7, 0.1); spark.scale.setScalar(0.6); g.add(spark);
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), new THREE.MeshStandardMaterial({ color: 0x300000, emissive: 0xff2020, emissiveIntensity: 3 }));
  led.position.set(0, 0.95, 0.5); g.add(led);
  const warn = new THREE.Mesh(new THREE.RingGeometry(1.25, 1.5, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xff3b30, transparent: true, opacity: 0.5, depthWrite: false }));
  warn.position.y = 0.06; g.add(warn);
  g.scale.setScalar(1.25);
  return { g, spark, led, warn };
}
