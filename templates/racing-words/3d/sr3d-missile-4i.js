// RACING WORDS mẫu 4i (18/10/2026) = sr3d-missile-4b.js + (thầy, trang thiet-ke-4i mục 3):
//   · quỹ đạo THẤP: H 3,6–8,1 (đỉnh ~3–6,7 m) ⇒ H 4,6 cố định (đỉnh ~4 m) — tên lửa nằm trong tầm nhìn buồng lái suốt đường bay
//   · điểm rơi = QUẦNG ĐỎ nhỏ (~2,4 m) mép mờ, nhấp nháy nhanh dần — thay vòng ngắm 5,4 m + CỘT SÁNG đỏ 26 m
//   · BÁM MỤC TIÊU CÓ GIỚI HẠN: dọc đường vẫn theo tốc độ xe, NGANG chỉ trôi ≤ 2,5 m/s về phía xe; khoá hẳn khi còn 1,4 s (cũ: bám trọn tới 1 s cuối)
// ---- gốc 4b ----
// RACING WORDS mẫu 4b (16/10/2026) = sr3d-missile-3r.js, chỉ đổi công thức cong sang HÌNH THẬT của đường (bảng uBendT — xem sr3d-world-4b.js).
// ---- gốc 3r ----
// 3r (16/10/2026, đo TOMKO trong myActivity, act 572): mỗi phát bắn tạo ShaderMaterial CỘT SÁNG mới rồi dispose() khi nổ ⇒ three.js xoá luôn
//   shader stage (usedTimes về 0) ⇒ phát sau mang mã stage MỚI ⇒ khoá program mới ⇒ DỊCH LẠI SHADER mỗi lần bắn (17 lần / ván, mỗi lần khựng 30–130 ms;
//   pinPrograms không giữ được vì khoá đổi). Nay vật liệu cột sáng dùng lại (beamPool) — không bao giờ dispose giữa trận.
// 3q: bendW = công thức cong theo tiếp tuyến của sr3d-world-3q.js (cảnh xa không quét ngang).
// =============================================================
// SPEED RUN 3D — TÊN LỬA + HẠT (mẫu 3e = 3c bay chậm hơn, 15/10/2026) = sr3d-missile-2.js sửa theo thầy (15/10):
//   "Tên lửa to và thô quá, cần làm lại đẹp, nhỏ hơn và tinh tế hơn" ⇒ thân mảnh Ø 0,11 m dài ~1,2 m, mũi ogive, đai màu đội, 4 cánh đuôi + 4 cánh mũi nhỏ, loa phụt;
//     buildMissile() dùng chung cho tên lửa đang bay VÀ 2 quả nằm trên bệ phóng cánh tay robot trên nóc xe (lõi sr3d-3c.js).
//   "Tên lửa bay nhanh hơn một chút và quỹ đạo bay giống thực tế hơn" ⇒ MS.T 2,6 → 2,0 s; rời bệ chếch lên, LEO dốc (tăng tốc dần như động cơ đẩy),
//     vồng qua rồi BỔ NHÀO dốc xuống điểm rơi (top-attack); vệt khói mảnh hơn.
// ---- gốc mẫu 2 ----
// SPEED RUN 3D — TÊN LỬA + HẠT (mẫu 2, 11/10/2026)
// Thầy (11/10): "Xe có trang bị tên lửa, cơ chế bắn tương tự như rocket race, có thể tăng tốc hoặc phanh để tránh, có thể lái trái phải để tránh".
// ⇒ Tên lửa bay vòng cung (Bézier bậc 3: vọt lên từ nóc xe bắn, lao xuống) tới ĐIỂM RƠI DỰ ĐOÁN trên làn xe bị bắn:
//    · điểm rơi = chỗ xe đó SẼ ở lúc chạm (theo tốc độ + gia tốc hiện tại), cập nhật liên tục tới khi còn MS.LOCK giây thì KHOÁ
//    · sau khi khoá, xe đổi làn (lệch ngang) hoặc tăng tốc/phanh (lệch dọc) đủ xa khỏi vòng ngắm là NÉ được
//    · vòng ngắm đỏ nằm trên mặt đường ⇒ người lái nhìn thấy ngay trước mũi xe mình
// Mô-đun CHỈ VẼ + tính đường bay; xét trúng/trượt + phạt nằm ở lõi (sr3d-2.js).
// Mọi vật liệu đi qua `bend` (cong thế giới). Hạt (khói, lửa, tia lửa) dùng chung `makeParticles`.
// =============================================================
import * as THREE from "../../rocket-race/vendor/three/three.module.min.js";

export const MS = { T: 2.45, LOCK: 1.4, DRIFT: 2.5, H: 4.6 };   // 4i: khoá 1,4 s · trôi ngang ≤ 2,5 m/s · vồng H 4,6                // 3e: bay CHẬM hơn 3c (2,0 s) theo thầy · khoá điểm rơi khi còn LOCK giây
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

const BEND_VS = `uniform vec2 uBend; uniform float uBendZ; uniform sampler2D uBendT; uniform float uBendD;
float bendQ(float d){ float a = -d; return a <= 150.0 ? a*a : 150.0*(2.0*a - 150.0); }
float bendX(float a){ if (uBendD <= 0.0) return 0.0; float f = clamp(a / uBendD, 0.0, 1.0) * 255.0; float i0 = min(floor(f), 254.0);
  float p = mix(texelFetch(uBendT, ivec2(int(i0), 0), 0).r, texelFetch(uBendT, ivec2(int(i0) + 1, 0), 0).r, f - i0); return p + uBend.x * max(a - uBendD, 0.0); }
vec4 bendW(vec4 w){ float d = min(w.z - uBendZ, 0.0); float q = bendQ(d); w.x += bendX(-d); w.y -= uBend.y*q; return w; }`;

// ---------- hạt điểm có cong (khói xám / lửa cộng sáng) ----------
export function makeParticles({ U, n = 400, additive = false, color = "#d2ccc6" }) {
  const P = { pos: new Float32Array(n * 3), vel: new Float32Array(n * 3), a: new Float32Array(n), a0: new Float32Array(n), sz: new Float32Array(n), grow: new Float32Array(n), life: new Float32Array(n), max: new Float32Array(n), drag: new Float32Array(n), i: 0 };
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(P.pos, 3)); g.setAttribute("aA", new THREE.BufferAttribute(P.a, 1)); g.setAttribute("aS", new THREE.BufferAttribute(P.sz, 1));
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    uniforms: { uBend: U.uBend, uBendZ: U.uBendZ, uBendT: U.uBendT, uBendD: U.uBendD, uScale: { value: 400 }, uCol: { value: new THREE.Color(color) } },
    vertexShader: BEND_VS + `uniform float uScale; attribute float aA; attribute float aS; varying float vA;
      void main(){ vec4 w = bendW(modelMatrix * vec4(position,1.0)); vec4 mv = viewMatrix * w; gl_Position = projectionMatrix * mv;
        gl_PointSize = min(aS * uScale / max(-mv.z, 0.2), 900.0); vA = aA; }`,
    fragmentShader: `uniform vec3 uCol; varying float vA; void main(){ vec2 p = gl_PointCoord - 0.5; float r = length(p); if (r > 0.5) discard;
      float a = smoothstep(0.5, ${additive ? "0.0" : "0.12"}, r) * vA; gl_FragColor = vec4(uCol * ${additive ? "2.2" : "1.0"}, a); }`
  });
  const mesh = new THREE.Points(g, m); mesh.frustumCulled = false; mesh.renderOrder = additive ? 7 : 6;
  return {
    mesh,
    emit(x, y, z, vx, vy, vz, life, size, alpha, grow = 2.2, drag = 1.2) {
      const i = P.i = (P.i + 1) % n;
      P.pos[i * 3] = x; P.pos[i * 3 + 1] = y; P.pos[i * 3 + 2] = z; P.vel[i * 3] = vx; P.vel[i * 3 + 1] = vy; P.vel[i * 3 + 2] = vz;
      P.life[i] = P.max[i] = life; P.sz[i] = size; P.a0[i] = alpha; P.a[i] = alpha; P.grow[i] = grow; P.drag[i] = drag;
    },
    update(dt) {
      for (let i = 0; i < n; i++) {
        if (P.life[i] <= 0) { P.a[i] = 0; continue; }
        P.life[i] -= dt; const t = 1 - P.life[i] / P.max[i], k = Math.exp(-P.drag[i] * dt);
        for (let j = 0; j < 3; j++) { P.vel[i * 3 + j] *= k; P.pos[i * 3 + j] += P.vel[i * 3 + j] * dt; }
        P.sz[i] += dt * P.grow[i]; P.a[i] = P.a0[i] * (1 - t) * Math.min(1, t * 12 + 0.15);
      }
      g.attributes.position.needsUpdate = g.attributes.aA.needsUpdate = g.attributes.aS.needsUpdate = true;
    },
    setScale(px) { m.uniforms.uScale.value = px; },
    dispose() { g.dispose(); m.dispose(); }
  };
}

function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; }
// 4i: quầng đỏ MỜ MÉP (gradient tròn) — 128 px, vẽ 1 lần
function glowTex() {
  const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d");
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.22, "rgba(255,255,255,.85)"); r.addColorStop(0.5, "rgba(255,255,255,.35)"); r.addColorStop(0.78, "rgba(255,255,255,.08)"); r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function reticleTex() {
  const [c, g] = canvas(256, 256), C = 128;
  const fill = g.createRadialGradient(C, C, 10, C, C, 112); fill.addColorStop(0, "rgba(255,255,255,.55)"); fill.addColorStop(1, "rgba(255,255,255,.18)");
  g.fillStyle = fill; g.beginPath(); g.arc(C, C, 110, 0, Math.PI * 2); g.fill();          // nền đặc mờ: nhìn từ ghế lái (rất xiên) vẫn ra một vệt đỏ rõ
  g.strokeStyle = "#fff"; g.lineWidth = 14; g.beginPath(); g.arc(C, C, 104, 0, Math.PI * 2); g.stroke();
  g.lineWidth = 6; g.beginPath(); g.arc(C, C, 70, 0, Math.PI * 2); g.stroke();
  g.lineWidth = 10; [[C, 8, C, 60], [C, 196, C, 248], [8, C, 60, C], [196, C, 248, C]].forEach(([a, b, x, y]) => { g.beginPath(); g.moveTo(a, b); g.lineTo(x, y); g.stroke(); });
  g.fillStyle = "#fff"; g.beginPath(); g.arc(C, C, 12, 0, Math.PI * 2); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function scorchTex() {
  const [c, g] = canvas(256, 256), r = g.createRadialGradient(128, 128, 8, 128, 128, 126);
  r.addColorStop(0, "rgba(8,6,5,.95)"); r.addColorStop(0.45, "rgba(20,14,10,.75)"); r.addColorStop(1, "rgba(20,14,10,0)");
  g.fillStyle = r; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 26; i++) { const a = Math.random() * 6.28, l = 60 + Math.random() * 60; g.strokeStyle = "rgba(10,8,6,.5)"; g.lineWidth = 3 + Math.random() * 5;
    g.beginPath(); g.moveTo(128 + Math.cos(a) * 30, 128 + Math.sin(a) * 30); g.lineTo(128 + Math.cos(a) * l, 128 + Math.sin(a) * l); g.stroke(); }
  return new THREE.CanvasTexture(c);
}

const FLAME_VS = BEND_VS + `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * viewMatrix * bendW(modelMatrix * vec4(position,1.0)); }`;
const FLAME_FS = `uniform float uT; varying vec2 vUv; float h(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 45758.5); }
void main(){ float y = vUv.y; float n = h(vec2(floor(vUv.x*8.0), floor((y - uT*14.0)*10.0)));
  float a = smoothstep(0.0, 0.2, y) * (1.0 - y) * (0.6 + 0.4*n); vec3 c = mix(vec3(1.0,0.97,0.85), vec3(1.0,0.45,0.1), smoothstep(0.6, 0.0, y));
  gl_FragColor = vec4(c * a * 2.6, a); }`;

/**
 * createMissiles({ scene, bend, U }) →
 *   launch({ from, to, x, y, z, predict(tLeft) → {s, x}, color }) → id
 *   update(dt, t) → [{ id, from, to, P: {s, x} }]   (các quả vừa CHẠM trong khung này)
 *   incoming(team) → { tLeft, locked, s, x } | null  (quả gần chạm nhất đang bay tới đội đó)
 *   boom(x, z, kind "hit" | "graze" | "miss") · smoke/sparks/fire (hạt dùng chung cho lõi) · setScale(px) · clear() · dispose()
 */
/** hình học tên lửa mảnh (mũi chĩa +z), tạo 1 lần dùng chung cho mọi quả */
let MG = null;
export function missileGeos() {
  if (MG) return MG;
  const lathe = new THREE.LatheGeometry([[0, 0.5], [0.022, 0.46], [0.045, 0.38], [0.055, 0.28], [0.056, 0.2]].map(([r, y]) => new THREE.Vector2(r, y)), 18).rotateX(Math.PI / 2);   // mũi ogive
  const body = new THREE.CylinderGeometry(0.056, 0.056, 0.82, 16).rotateX(Math.PI / 2).translate(0, 0, -0.21);
  const band = new THREE.CylinderGeometry(0.058, 0.058, 0.09, 16).rotateX(Math.PI / 2).translate(0, 0, 0.12);
  const noz = new THREE.CylinderGeometry(0.04, 0.05, 0.08, 14).rotateX(Math.PI / 2).translate(0, 0, -0.66);
  const fin = new THREE.BufferGeometry(); {                      // cánh đuôi tam giác vát (1 tấm, xoay 4 hướng)
    const v = [0.05, 0, -0.62, 0.17, 0, -0.62, 0.05, 0, -0.4,  0.05, 0.004, -0.62, 0.05, 0.004, -0.4, 0.17, 0.004, -0.62];
    fin.setAttribute("position", new THREE.Float32BufferAttribute(v, 3)); fin.computeVertexNormals(); }
  const can = new THREE.BoxGeometry(0.075, 0.006, 0.07).translate(0.085, 0, 0.1);   // cánh mũi nhỏ
  return (MG = { lathe, body, band, noz, fin, can });
}
/** dựng 1 quả vào nhóm g (mũi +z) */
export function buildMissile(g, P, bodyM, noseM, finM) {
  g.add(new THREE.Mesh(P.body, bodyM), new THREE.Mesh(P.lathe, bodyM), new THREE.Mesh(P.band, noseM), new THREE.Mesh(P.noz, finM));
  for (let k = 0; k < 4; k++) { const f = new THREE.Mesh(P.fin, finM); f.rotation.z = k * Math.PI / 2 + Math.PI / 4; f.material.side = THREE.DoubleSide; g.add(f);
    const c = new THREE.Mesh(P.can, finM); c.rotation.z = k * Math.PI / 2 + Math.PI / 4; g.add(c); }
  return g;
}

export function createMissiles({ scene, bend, U }) {
  const smoke = makeParticles({ U, n: 900, color: "#cfc8c2" });
  const dark = makeParticles({ U, n: 300, color: "#3a3330" });
  const fire = makeParticles({ U, n: 500, additive: true, color: "#ff8a2a" });
  const sparks = makeParticles({ U, n: 300, additive: true, color: "#ffd27a" });
  [smoke, dark, fire, sparks].forEach(p => scene.add(p.mesh));

  // hình tên lửa: mũi chĩa +z (Object3D.lookAt quay trục +z về phía mục tiêu)
  const geos = [], mats = [];
  const G = (g) => { geos.push(g); return g; }, Mt = (m) => { mats.push(m); return m; };
  const P = missileGeos();
  const flameG = G(new THREE.ConeGeometry(0.07, 1.1, 10, 1, true).translate(0, -0.55, 0).rotateX(Math.PI / 2).translate(0, 0, -0.64));   // đỉnh nón chĩa −z (ra sau)
  const bodyM = Mt(bend(new THREE.MeshStandardMaterial({ color: "#e9ecef", roughness: 0.3, metalness: 0.55 })));
  const finM = Mt(bend(new THREE.MeshStandardMaterial({ color: "#2a2f36", roughness: 0.45, metalness: 0.6 })));
  const flameU = { uT: { value: 0 }, uBend: U.uBend, uBendZ: U.uBendZ, uBendT: U.uBendT, uBendD: U.uBendD };
  const flameM = Mt(new THREE.ShaderMaterial({ vertexShader: FLAME_VS, fragmentShader: FLAME_FS, uniforms: flameU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  const ringG = G(new THREE.PlaneGeometry(3.4, 3.4).rotateX(-Math.PI / 2));   // 4i: quầng đỏ (ảnh mờ mép ⇒ phần thấy rõ ~2,4 m)
  // CỘT SÁNG đỏ đứng thẳng tại điểm rơi: vòng ngắm phẳng trên đường nhìn từ mắt người lái (cao 1,1 m) ở 30 m chỉ còn 3–4 px ⇒ cần vật ĐỨNG
  const beamG = G(new THREE.CylinderGeometry(1.1, 1.6, 26, 20, 8, true).translate(0, 13, 0));
  const ringT = glowTex(), scT = scorchTex();   // 4i: quầng mờ thay vòng ngắm
  const scorchG = G(new THREE.PlaneGeometry(5.5, 5.5).rotateX(-Math.PI / 2));
  const flashG = G(new THREE.IcosahedronGeometry(1, 2));
  const BEAM_VS = BEND_VS + `varying float vY; varying vec3 vN; varying vec3 vV; void main(){ vY = position.y / 26.0; vec4 w = bendW(modelMatrix * vec4(position,1.0));
    vN = normalize(mat3(modelMatrix) * normal); vV = normalize(cameraPosition - w.xyz); gl_Position = projectionMatrix * viewMatrix * w; }`;
  const BEAM_FS = `uniform float uA; uniform float uT; varying float vY; varying vec3 vN; varying vec3 vV;
    void main(){ float rim = 1.0 - abs(dot(normalize(vN), normalize(vV))); float band = 0.75 + 0.25 * sin(vY * 40.0 - uT * 18.0);
      float a = uA * (1.0 - smoothstep(0.05, 1.0, vY)) * (0.45 + 0.55 * rim) * band; gl_FragColor = vec4(mix(vec3(1.2, 0.06, 0.03), vec3(1.6, 0.5, 0.3), rim * 0.4), a * 0.8); }`;   // trộn thường (không cộng sáng): nền trời hoàng hôn rất sáng, cộng sáng thì cột bị nhoà
  const light = new THREE.PointLight("#ffaa55", 0, 60, 1.6); scene.add(light);
  let lightK = 0;

  const list = [], scorches = [], flashes = [];
  let seq = 0;
  const B = new THREE.Vector3(), Bt = new THREE.Vector3(), tmp = new THREE.Vector3(), dv = new THREE.Vector3();
  function bez(m, u, out, tan) {
    const a = m.L0, d = dv.subVectors(m.P, a), H = m.H;
    const c1x = a.x + d.x * 0.12, c1y = a.y + H * 1.15, c1z = a.z + d.z * 0.18;          // rời bệ CHẾCH LÊN, leo dốc
    const c2x = m.P.x - d.x * 0.04, c2y = m.P.y + H * 1.05, c2z = m.P.z - d.z * 0.06;    // vồng qua ngay trên điểm rơi ⇒ BỔ NHÀO gần thẳng đứng
    const v = 1 - u, b0 = v * v * v, b1 = 3 * v * v * u, b2 = 3 * v * u * u, b3 = u * u * u;
    out.set(b0 * a.x + b1 * c1x + b2 * c2x + b3 * m.P.x, b0 * a.y + b1 * c1y + b2 * c2y + b3 * m.P.y, b0 * a.z + b1 * c1z + b2 * c2z + b3 * m.P.z);
    if (tan) { const d0 = 3 * v * v, d1 = 6 * v * u, d2 = 3 * u * u;
      tan.set(d0 * (c1x - a.x) + d1 * (c2x - c1x) + d2 * (m.P.x - c2x), d0 * (c1y - a.y) + d1 * (c2y - c1y) + d2 * (m.P.y - c2y), d0 * (c1z - a.z) + d1 * (c2z - c1z) + d2 * (m.P.z - c2z)); }
    return out;
  }
  const beamPool = [];                                       // 3r: vật liệu cột sáng dùng lại (không dispose ⇒ giữ shader stage)
  const kill = m => { scene.remove(m.g, m.ring); m.rm.dispose(); m.nose.dispose(); };   // 4i: không còn cột sáng

  return {
    smoke, sparks, fire, dark,
    launch({ from, to, x, y, z, predict, color = "#ff3b3b" }) {
      const g = new THREE.Group();
      const noseM = bend(new THREE.MeshStandardMaterial({ color, emissive: new THREE.Color(color), emissiveIntensity: 0.6, roughness: 0.3 }));
      buildMissile(g, P, bodyM, noseM, finM);
      const fl = new THREE.Mesh(flameG, flameM); fl.renderOrder = 8; g.add(fl);
      g.position.set(x, y, z); scene.add(g);
      const rm = bend(new THREE.MeshBasicMaterial({ map: ringT, color: new THREE.Color(1.0, 0.16, 0.1).multiplyScalar(3.2), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -4 }));
      const ring = new THREE.Mesh(ringG, rm); ring.renderOrder = 4; scene.add(ring);
      const m = { id: ++seq, from, to, t: 0, L0: new THREE.Vector3(x, y, z), P: new THREE.Vector3(), H: MS.H, g, ring, rm, nose: noseM, predict, locked: false, trailD: 0, last: new THREE.Vector3(x, y, z) };
      const p0 = predict(MS.T); m.P.set(p0.x, 0.6, -p0.s);   // 4i: vồng cố định thấp (đỉnh ~4 m)
      list.push(m);
      for (let k = 0; k < 14; k++) smoke.emit(x + (Math.random() - 0.5) * 0.6, y, z + (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 3, Math.random() * 2, (Math.random() - 0.5) * 3, 1.2, 0.8, 0.5, 2.6, 1.8);
      return m.id;
    },
    update(dt, t) {
      flameU.uT.value = t;
      const hits = [];
      for (let i = list.length - 1; i >= 0; i--) {
        const m = list[i]; m.t += dt;
        const tLeft = MS.T - m.t;
        if (tLeft > MS.LOCK) { const p = m.predict(tLeft), mx = MS.DRIFT * dt; m.P.set(m.P.x + clamp(p.x - m.P.x, -mx, mx), 0.6, -p.s); } else m.locked = true;   // 4i: ngang trôi có giới hạn ⇒ né được
        const x = clamp(m.t / MS.T, 0, 1), u = 0.38 * x + 0.62 * x * x;   // động cơ đẩy: chậm lúc rời bệ, nhanh dần          // đầu đường bay nhanh hơn xe ⇒ người bắn thấy tên lửa vọt lên TRƯỚC mũi xe mình
        bez(m, u, B, Bt);
        m.g.position.copy(B); m.g.lookAt(tmp.copy(B).add(Bt));
        // vệt khói rải đều theo QUÃNG ĐƯỜNG (không theo khung hình) ⇒ liền mạch khi bay nhanh
        const dist = m.last.distanceTo(B); m.trailD += dist;
        while (m.trailD > 0.4) { m.trailD -= 0.4; const k = 1 - m.trailD / Math.max(dist, 1e-4);
          tmp.lerpVectors(m.last, B, clamp(k, 0, 1));
          smoke.emit(tmp.x, tmp.y, tmp.z, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5 + 0.25, (Math.random() - 0.5) * 0.5, 1.3 + Math.random() * 0.7, 0.45, 0.45, 1.6, 0.6);
          fire.emit(tmp.x, tmp.y, tmp.z, 0, 0, 0, 0.14, 0.32, 0.75, 0.3, 0); }
        m.last.copy(B);
        // 4i: QUẦNG ĐỎ trên mặt đường — hiện dần, nhấp nháy nhanh dần theo lúc rơi; khoá ⇒ nháy gấp, co nhẹ
        m.ring.position.set(m.P.x, 0.07, m.P.z);
        const pulse = 0.55 + 0.45 * Math.sin(t * (m.locked ? 30 : 8 + 20 * x));
        m.rm.opacity = Math.min(1, m.t * 2) * (0.45 + 0.55 * pulse); m.ring.scale.setScalar(m.locked ? 0.9 + 0.08 * pulse : 1.1 - 0.15 * x);
        m.nose.emissiveIntensity = 0.6 + 2.5 * (0.5 + 0.5 * Math.sin(t * 24));
        if (m.t >= MS.T) { hits.push({ id: m.id, from: m.from, to: m.to, P: { s: -m.P.z, x: m.P.x } }); kill(m); list.splice(i, 1); }
      }
      // nổ: quả cầu lửa phồng rồi tắt + đèn chớp
      for (let i = flashes.length - 1; i >= 0; i--) { const f = flashes[i]; f.t += dt; const k = f.t / 0.55;
        f.m.scale.setScalar(f.r * (0.4 + 1.6 * Math.sqrt(Math.min(k, 1)))); f.m.material.opacity = Math.max(0, 1 - k) * 0.9;
        if (k >= 1) { scene.remove(f.m); f.m.material.dispose(); flashes.splice(i, 1); } }
      lightK = Math.max(0, lightK - dt * 3.5); light.intensity = lightK * lightK * 900;
      for (let i = scorches.length - 1; i >= 0; i--) { const s = scorches[i]; s.t += dt; s.m.material.opacity = 0.85 * (1 - clamp((s.t - 6) / 3, 0, 1));
        if (s.t > 9) { scene.remove(s.m); s.m.material.dispose(); scorches.splice(i, 1); } }
      smoke.update(dt); dark.update(dt); fire.update(dt); sparks.update(dt);
      return hits;
    },
    incoming(team) {
      let best = null;
      list.forEach(m => { if (m.to !== team) return; const tl = MS.T - m.t; if (!best || tl < best.tLeft) best = { tLeft: tl, locked: m.locked, s: -m.P.z, x: m.P.x }; });
      return best;
    },
    get active() { return list.map(m => ({ id: m.id, from: m.from, to: m.to, t: +m.t.toFixed(2), locked: m.locked, P: { s: +(-m.P.z).toFixed(1), x: +m.P.x.toFixed(2) }, pos: m.g.position.toArray().map(v => +v.toFixed(1)) })); },
    boom(x, z, kind = "hit") {
      const big = kind === "hit" ? 1 : kind === "graze" ? 0.8 : 0.65, y = 0.8;
      const fm = new THREE.Mesh(flashG, bend(new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.62, 0.25).multiplyScalar(3), transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })));
      fm.position.set(x, y, z); fm.renderOrder = 9; scene.add(fm); flashes.push({ m: fm, t: 0, r: 3.2 * big });
      light.position.set(x, 3, z); lightK = 1;
      for (let k = 0; k < 46 * big; k++) { const a = Math.random() * 6.28, sp = 3 + Math.random() * 9;
        fire.emit(x, y + Math.random(), z, Math.cos(a) * sp, 2 + Math.random() * 7, Math.sin(a) * sp, 0.45 + Math.random() * 0.4, 1.4 * big, 0.9, 3.5, 2.6); }
      for (let k = 0; k < 40 * big; k++) { const a = Math.random() * 6.28, sp = 1 + Math.random() * 4;
        dark.emit(x + Math.cos(a), y + Math.random() * 1.5, z + Math.sin(a), Math.cos(a) * sp, 2 + Math.random() * 4, Math.sin(a) * sp, 2.2 + Math.random() * 1.6, 1.8 * big, 0.6, 2.8, 0.9); }
      for (let k = 0; k < 40; k++) { const a = Math.random() * 6.28, sp = 8 + Math.random() * 16;
        sparks.emit(x, y, z, Math.cos(a) * sp, 4 + Math.random() * 10, Math.sin(a) * sp, 0.5 + Math.random() * 0.5, 0.16, 1, 0, 0.8); }
      const sm = new THREE.Mesh(scorchG, bend(new THREE.MeshBasicMaterial({ map: scT, transparent: true, opacity: 0.85, depthWrite: false, color: 0xffffff, polygonOffset: true, polygonOffsetFactor: -3 })));
      sm.position.set(x, 0.05, z); sm.rotation.y = Math.random() * 6.28; sm.renderOrder = 2; scene.add(sm); scorches.push({ m: sm, t: 0 });
    },
    setScale(px) { [smoke, dark, fire, sparks].forEach(p => p.setScale(px)); },
    clear() {
      list.splice(0).forEach(kill);
      scorches.splice(0).forEach(s => { scene.remove(s.m); s.m.material.dispose(); });
      flashes.splice(0).forEach(f => { scene.remove(f.m); f.m.material.dispose(); });
    },
    dispose() {
      this.clear(); [smoke, dark, fire, sparks].forEach(p => { scene.remove(p.mesh); p.dispose(); }); scene.remove(light);
      geos.forEach(g => g.dispose()); mats.forEach(m => m.dispose()); beamPool.splice(0).forEach(m => m.dispose()); ringT.dispose(); scT.dispose();
    }
  };
}
