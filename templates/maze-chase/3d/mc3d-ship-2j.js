// 1s (29/9): thầy "các tàu đuổi nhau giảm độ quành khi lái đi một chút, có thể đuổi nhau ra ngoài khung hình một chút rồi vòng lại" ⇒
//   điểm lượn: góc quay mỗi khúc 1,5–2,3 ⇒ 1,0–1,45 rad, bán kính 0,42–0,78 ⇒ 0,62–1,22 (NDC, >1 là ra ngoài khung), rượt 13–17 s.
// 2j (01/10/2026, chép mc3d-ship-2e.js): BIỂN CHỮ LED NEON "ANDREW STUDIO" ở ĐUÔI tàu mẹ (tấm biển tối dưới cụm động cơ, chữ neon nhìn từ phía
//   sau đọc xuôi, chập chờn cùng nhịp chữ ANDREW CLASSES) · móc âm thanh `opts.onFx(kind)`: "shot" (mỗi phát súng), "hit" (đạn trúng), "boom" (tàu con nổ).
// MAZE CHASE 3D — TÀU ANDREW CLASSES SĂN TÀU CON (mẫu 1j, 29/9/2026). Thầy: "tàu nhỏ còn 2/3 · xuất hiện chéo từ cạnh đáy màn hình (nửa trái
// hoặc phải), bay chéo lên, rượt đuổi 1 tàu nhỏ khác, bắn đạn từ 2 bên tàu thẳng tới tàu con; tàu con phát nổ ở chỗ NHÌN THẤY ĐƯỢC sau
// nhiều phát trúng · chữ ANDREW CLASSES ở GIỮA tàu, 1 chữ ngửa lên · bắn xong bay thẳng tiếp · lát sau quay lại săn con tàu khác hình dạng
// khác, cũng nổ · lửa giống thật, đẹp, chi tiết hơn · tàu chi tiết, giống thật hơn (đang như lego) · tàu con cũng chi tiết". Thầy chốt:
// 45–60 s/lượt; lượt sau vào từ hướng khác (dưới lên / trên xuống / đôi khi ngang hai bên), không trùng chỗ vào của lượt ngay trước.
// 1p (29/9): `cine.power(k)` — lửa đuôi nhỏ lúc hạm đội đậu, bùng lên lúc tăng tốc / nhảy siêu tốc.
// 1o (29/9): chế độ ĐIỆN ẢNH cho intro (`cine`): intro tự đặt vị trí/hướng/nghiêng/cỡ tàu mỗi khung; lửa, lưỡi lửa, khói, chữ,
//   súng hông (ngắm + bắn) vẫn chạy như lúc bay thật.
// 1n (29/9): SÚNG HÔNG — 5 khẩu mỗi bên sườn (đế + tháp + 2 nòng dài), xoay nòng NGẮM tàu con, đạn bắn ra từ ĐẦU NÒNG
//   khẩu phía có tàu con, giật nòng mỗi phát.
// 1m (29/9): tàu con LUÔN bị bắn nổ ở chỗ NHÌN THẤY: điểm nổ chọn ngoài vùng trạm (chiếu hộp mê cung lên màn), ngoài câu hỏi / hàng
//   chữ dưới / D-pad; phát đạn KẾT LIỄU bắn canh giờ tới đúng điểm nổ, trúng mới nổ.
// 1l (29/9): RƯỢT ĐUỔI vòng vòng trong màn (tàu lớn bám vệt tàu con, NGHIÊNG theo khúc cua) · laser mảnh hơn · chữ ANDREW CLASSES dời lên
//   phía mũi (hết bị thượng tầng che) · tàu con nổ ⇒ vụn NHỎ, tối, bốc khói và RƠI dần xuống.
// 1k (29/9): lửa đuôi NHẤP NHÔ (nón uốn theo nhiễu + lưỡi lửa liếm bằng hạt) · tàu con nổ ra BỘ MẢNH XÁC kiểu Rocket Race.
import * as THREE from "../../rocket-race/vendor/three/three.module.min.js";
import { mergeGeometries } from "../../rocket-race/vendor/three/addons/BufferGeometryUtils.js";
// 2e (30/9/2026): chép mc3d-ship-1x.js + GỘP mảnh ĐỨNG YÊN của thân tàu mẹ (Mesh gắn thẳng vào body, cùng vật liệu) thành 1 khối/vật liệu
//   ⇒ bớt hàng trăm lệnh vẽ mỗi khung (4 tàu × 177 mảnh) ⇒ bớt rác bộ nhớ (GC) + bớt tải GPU ⇒ bay mượt hơn. Súng, lửa, chữ slogan giữ nguyên.
function mergeStatic(body, skip) {                     // skip: các nhánh có chuyển động riêng (súng, lửa, slogan) — không đụng tới
  body.updateMatrixWorld(true);
  const inv = body.matrixWorld.clone().invert(), rel = new THREE.Matrix4(), groups = new Map();
  const walk = o => { for (const m of o.children.slice()) {
    if (skip.has(m) || !m.visible) continue;
    if (m.isMesh && !m.isInstancedMesh && !m.isSkinnedMesh && !m.children.length && !Array.isArray(m.material) && !m.morphTargetInfluences) {   // InstancedMesh: KHÔNG gộp (gộp là mất ma trận từng bản ⇒ thành khối trắng)
      const g = m.geometry, key = [m.material.uuid, Object.keys(g.attributes).sort().join(","), g.index ? 1 : 0, m.castShadow, m.receiveShadow, m.renderOrder, m.layers.mask].join("|");
      if (!groups.has(key)) groups.set(key, []); groups.get(key).push(m);
    } else if (!m.isMesh && !m.isInstancedMesh && !m.isLight && !m.isSprite && !m.isPoints) walk(m);
  } };
  walk(body);
  let n = 0;
  for (const list of groups.values()) {
    if (list.length < 2) continue;
    const geos = list.map(m => { rel.multiplyMatrices(inv, m.matrixWorld); const c = m.geometry.clone(); c.applyMatrix4(rel); c.clearGroups(); return c; });
    const merged = mergeGeometries(geos, false); geos.forEach(g => g.dispose()); if (!merged) continue;
    const mm = new THREE.Mesh(merged, list[0].material); mm.castShadow = list[0].castShadow; mm.receiveShadow = list[0].receiveShadow; mm.renderOrder = list[0].renderOrder; mm.layers.mask = list[0].layers.mask;
    list.forEach(m => m.parent.remove(m)); body.add(mm); n += list.length - 1;
  }
  return n;
}

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
function tex(w, h, draw, srgb = true) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
const noShadow = o => o.traverse(m => { if (m.isMesh) { m.castShadow = false; m.receiveShadow = false; } });

// ---------------------------------------------------------------- LỬA ĐỘNG CƠ (shader)
// 1k (thầy: "lửa ở đuôi tàu cháy nhấp nhô chân thực hơn, hiện tại bị cứng và giả quá"). Cũ: nón lửa CỨNG, mỗi khung
// nhân ngẫu nhiên độ dài ⇒ giật lắc như đèn hỏng. Mới: thân nón UỐN theo nhiễu chạy dọc (lửa phình/thắt từng nhịp,
// đuôi lắc lư), vân lửa cuộn (nhiễu uốn miền), đuôi tách thành các lưỡi lửa rồi tắt; dài/ngắn + sáng/tối đổi MƯỢT
// bằng tổng sóng lệch nhịp; thêm lớp quầng mờ ngoài cùng + lưỡi lửa liếm bay ra sau (hệ hạt trong createFleet).
const GLSL_N3 = `
  float h3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float n3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z); }
  float fbm(vec3 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * n3(p); p = p * 2.03 + vec3(1.7, 9.2, 3.1); a *= 0.5; } return s; }`;
const FLAME_VS = `uniform float uTime; uniform float uSeed; uniform float uBSeed; uniform float uLen; uniform float uBA; uniform float uWob;
  varying float vV; varying vec2 vD; varying vec3 vN; varying vec3 vVw;` + GLSL_N3 + `
  void main(){
    vec3 p = position; float v = uv.y;                              // 0 = miệng loa, 1 = chóp lửa
    vV = v; vD = normalize(p.xz + vec2(1e-5));
    float w1 = n3(vec3(vD * 1.3 + uSeed, v * 2.6 - uTime * 5.5)) - 0.5;
    p.xz *= 1.0 + uWob * (0.1 + 0.5 * v) * (w1 * 1.5 + 0.3 * sin(v * 11.0 - uTime * 15.0 + uSeed));   // phình / thắt chạy dọc thân lửa
    p.y *= uLen;
    float bx = n3(vec3(uBSeed, v * 1.7 - uTime * 2.4, 0.5)) - 0.5, bz = n3(vec3(uBSeed + 7.0, v * 1.7 - uTime * 2.4, 3.5)) - 0.5;
    p.x += uBA * v * v * bx * 2.6; p.z += uBA * v * v * bz * 2.6;     // đuôi lửa lắc lư (mọi lớp lắc CÙNG nhịp)
    vec4 mv = modelViewMatrix * vec4(p, 1.0); vN = normalize(normalMatrix * normal); vVw = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv; }`;
const FLAME_FS = `uniform float uTime; uniform float uPower; uniform vec3 uCore; uniform vec3 uEdge; uniform float uShock; uniform float uSeed; uniform float uSoft;
  varying float vV; varying vec2 vD; varying vec3 vN; varying vec3 vVw;` + GLSL_N3 + `
  void main(){
    float v = vV;
    float face = pow(abs(dot(normalize(vN), normalize(vVw))), 1.1);
    vec3 q = vec3(vD * 1.4 + uSeed, v * 3.2 - uTime * 6.5);
    vec3 w = vec3(fbm(q * 0.9 + vec3(0.0, 0.0, uTime * 0.8)), fbm(q * 0.9 + vec3(5.2, 1.3, 0.0)), 0.0);
    float f = fbm(q * 1.7 + w * 1.6);                               // vân lửa cuộn
    float body = pow(max(1.0 - v, 0.0), 1.3);   // 1v: MSAA ngoại suy v > 1 ⇒ pow(số âm) = NaN ⇒ bloom loang đen
    float tongue = mix(smoothstep(v * 1.05 - 0.2, v * 1.05 + 0.25, f * 1.2 + 0.1), 1.0 - v, uSoft);   // đuôi tách thành lưỡi lửa
    float flick = 0.72 + 0.56 * f;
    float shock = uShock * pow(max(0.0, sin(v * 28.0 - uTime * 1.5 + f * 1.5)), 10.0) * smoothstep(0.65, 0.0, v);   // vòng sốc chập chờn
    float I = body * tongue * flick + shock * 0.9;
    vec3 col = mix(uCore, uEdge, smoothstep(0.0, 0.75, v + (f - 0.5) * 0.4));
    col += uShock * vec3(0.45) * pow(max(1.0 - v, 0.0), 8.0);
    float a = clamp(I * face * uPower, 0.0, 1.0);
    gl_FragColor = vec4(col * I * face * uPower, a);
  }`;
function flameMat(core, edge, shock, seed, bseed, ba, wob, soft = 0) {
  return new THREE.ShaderMaterial({ uniforms: { uTime: { value: 0 }, uPower: { value: 1 }, uLen: { value: 1 }, uBA: { value: ba }, uWob: { value: wob }, uSoft: { value: soft }, uBSeed: { value: bseed },
      uCore: { value: new THREE.Color(...core) }, uEdge: { value: new THREE.Color(...edge) }, uShock: { value: shock }, uSeed: { value: seed } },
    vertexShader: FLAME_VS, fragmentShader: FLAME_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false });
}
// một cụm lửa cho 1 miệng loa: lõi hẹp + thân + quầng mờ ngoài + quầng sáng tròn ở miệng
const glowTexC = tex(64, 64, (g, s) => { const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.3, "rgba(255,255,255,.5)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, s, s); });
function makeFlame(r, len, opt = {}) {
  const g = new THREE.Group(), seed = Math.random() * 50;
  const inner = flameMat(opt.core ?? [1.25, 1.55, 2.4], opt.mid ?? [0.35, 0.55, 1.5], 1, seed, seed, r * 0.8, 0.5);
  const outer = flameMat(opt.edge1 ?? [0.42, 0.5, 1.05], opt.edge2 ?? [1.05, 0.38, 0.1], 0, seed + 3.7, seed, r * 0.8, 1);
  const haze = flameMat(opt.haze1 ?? [0.3, 0.42, 0.9], opt.haze2 ?? [0.55, 0.2, 0.07], 0, seed + 9.1, seed, r * 0.8, 1.2, 0.65);
  const cone = (rr, l, m) => new THREE.Mesh(new THREE.ConeGeometry(rr, l, 24, 20, true).translate(0, l / 2, 0), m);
  const c1 = cone(r * 0.62, len * 0.8, inner), c2 = cone(r, len, outer), c3 = cone(r * 1.55, len * 1.12, haze);
  [c1, c2, c3].forEach(c => { c.rotation.z = Math.PI / 2; });              // mũi lửa hướng −x (ra sau tàu)
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexC, color: new THREE.Color(...(opt.halo ?? [0.35, 0.6, 1.3])), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  halo.scale.setScalar(r * 2.6);
  g.add(c3, c2, c1, halo);
  return { g, mats: [inner, outer, haze], halo, r, len, seed };
}
function tickFlame(f, t, power = 1) {
  const s = f.seed;
  const L = 1 + 0.07 * Math.sin(t * 7.3 + s) + 0.05 * Math.sin(t * 12.9 + s * 1.7) + 0.035 * Math.sin(t * 19.1 + s * 0.6);   // dài/ngắn MƯỢT, lệch nhịp
  const P = power * (0.9 + 0.06 * Math.sin(t * 9.7 + s * 2.3) + 0.04 * Math.sin(t * 16.3 + s));
  f.mats.forEach((m, i) => { m.uniforms.uTime.value = t + s; m.uniforms.uPower.value = P * (i === 2 ? 0.3 : i === 1 ? 0.7 : 0.85); m.uniforms.uLen.value = L * (1 + 0.05 * i * Math.sin(t * 5.1 + s + i)); });
  f.halo.material.opacity = 0.26 * P + 0.05 * Math.sin(t * 11 + s); f.halo.scale.setScalar(f.r * 2.6 * (0.94 + 0.08 * Math.sin(t * 8.3 + s)));
}

// ---------------------------------------------------------------- 1k: HỆ HẠT gọn (cả trăm hạt = 1 lượt vẽ): lưỡi lửa liếm sau đuôi tàu,
// lửa + khói kéo vệt sau mảnh xác, tàn lửa văng
const PT_VS = `attribute float aSize; attribute vec4 aCol; attribute float aRot; uniform float uScale; varying vec4 vC; varying float vR;
  void main(){ vC = aCol; vR = aRot; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = aSize * uScale / max(0.1, -mv.z); gl_Position = projectionMatrix * mv; }`;
const PT_FS = `uniform sampler2D uMap; varying vec4 vC; varying float vR;
  void main(){ vec2 p = gl_PointCoord - 0.5; float c = cos(vR), s = sin(vR); p = mat2(c, -s, s, c) * p + 0.5;
    vec4 t = texture2D(uMap, clamp(p, 0.0, 1.0)); float a = t.a * vC.a; if (a < 0.003) discard; gl_FragColor = vec4(vC.rgb * t.rgb, a); }`;
function makeParticles(scene, N, map, additive) {
  const geo = new THREE.BufferGeometry(), pos = new Float32Array(N * 3), col = new Float32Array(N * 4), size = new Float32Array(N), rot = new Float32Array(N);
  const A = [["position", pos, 3], ["aCol", col, 4], ["aSize", size, 1], ["aRot", rot, 1]].map(([n, a, k]) => { const b = new THREE.BufferAttribute(a, k); b.setUsage(THREE.DynamicDrawUsage); geo.setAttribute(n, b); return b; });
  const mat = new THREE.ShaderMaterial({ uniforms: { uMap: { value: map }, uScale: { value: 500 } }, vertexShader: PT_VS, fragmentShader: PT_FS,
    transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, toneMapped: false });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.renderOrder = additive ? 4 : 3; scene.add(pts);
  const P = Array.from({ length: N }, () => ({ life: 1, max: 1, p: new THREE.Vector3(), v: new THREE.Vector3(), s0: 1, s1: 1, c0: new THREE.Color(), c1: new THREE.Color(), a: 1, drag: 0, r: 0, w: 0 }));
  let head = 0, any = false;
  const c = new THREE.Color();
  function emit(o) {
    const q = P[head]; head = (head + 1) % N;
    q.p.copy(o.pos); q.v.copy(o.vel); q.life = 0; q.max = o.life; q.s0 = o.size; q.s1 = o.sizeEnd ?? o.size;
    q.c0.copy(o.color); q.c1.copy(o.colorEnd ?? o.color); q.a = o.alpha ?? 1; q.drag = o.drag ?? 0; q.r = Math.random() * 6.28; q.w = rnd(-1.5, 1.5); any = true;
  }
  function update(dt, scale) {
    mat.uniforms.uScale.value = scale;
    if (!any) return;
    let live = 0;
    for (let i = 0; i < N; i++) {
      const q = P[i];
      if (q.life >= q.max) { size[i] = 0; continue; }
      q.life += dt; const k = Math.min(1, q.life / q.max);
      if (k >= 1) { size[i] = 0; continue; }
      live++;
      q.v.multiplyScalar(Math.exp(-q.drag * dt)); q.p.addScaledVector(q.v, dt); q.r += q.w * dt;
      pos[i * 3] = q.p.x; pos[i * 3 + 1] = q.p.y; pos[i * 3 + 2] = q.p.z;
      size[i] = q.s0 + (q.s1 - q.s0) * Math.sqrt(k);
      c.copy(q.c0).lerp(q.c1, k);
      col[i * 4] = c.r; col[i * 4 + 1] = c.g; col[i * 4 + 2] = c.b; col[i * 4 + 3] = q.a * (k < 0.12 ? k / 0.12 : 1 - (k - 0.12) / 0.88);
      rot[i] = q.r;
    }
    A.forEach(b => { b.needsUpdate = true; });
    if (!live) any = false;
  }
  return { emit, update, pts };
}

// ---------------------------------------------------------------- 1k: XÁC TÀU CON (thầy: "nổ ra nhiều mảnh xác hơn, tương tự các mảnh xác
// của tàu bị nổ trong Rocket Race") — cách làm chép từ Rocket Race (rr3d-view.js · makeWreckKit): tấm vỏ RÁCH mép răng cưa, thủng lỗ,
// quăn + móp theo nhiễu 3D, loang muội (vertexColors), dải vỏ xoắn, ống gãy, cục máy móp; mảnh mới nổ còn ửng đỏ rồi nguội;
// mảnh nặng/đang cháy kéo lửa + khói. Bộ mảnh dựng SẴN, gắn ẩn trong tàu con ⇒ lúc nổ không phải tạo gì.
const nHash = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); };
const lerp = (a, b, k) => a + (b - a) * k;
function vnoise(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf), c = (a, b, d) => nHash(xi + a, yi + b, zi + d);
  return lerp(lerp(lerp(c(0, 0, 0), c(1, 0, 0), u), lerp(c(0, 1, 0), c(1, 1, 0), u), v), lerp(lerp(c(0, 0, 1), c(1, 0, 1), u), lerp(c(0, 1, 1), c(1, 1, 1), u), v), w);
}
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function crumple(geo, amp, f = 6) {
  const p = geo.attributes.position, sd = rnd(0, 99);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    p.setXYZ(i, x + amp * (vnoise(x * f + sd, y * f, z * f) - 0.5) * 2, y + amp * (vnoise(x * f, y * f + sd, z * f + 3) - 0.5) * 2, z + amp * (vnoise(x * f + 7, y * f, z * f + sd) - 0.5) * 2);
  }
  geo.computeVertexNormals(); return geo;
}
function soot(geo, scale = 1) {                                     // màu đỉnh loang muội; mép rách (edge = 0) đen kịt
  const p = geo.attributes.position, n = p.count, col = new Float32Array(n * 3), E = geo.userData.edge, sd = rnd(0, 99), f = 4.5 / scale;
  for (let i = 0; i < n; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    let c = 0.08 + 0.42 * smooth(0.32, 0.72, vnoise(x * f + sd, y * f, z * f) * 0.6 + vnoise(x * f * 2.1, y * f * 2.1 + 5, z * f * 2.1) * 0.4);
    if (E) c *= lerp(0.2, 1, smooth(0, 0.5, E[i]));
    col[i * 3] = c * 1.05; col[i * 3 + 1] = c; col[i * 3 + 2] = c * 0.95;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3)); return geo;
}
// tấm vỏ rách: lưới nx×ny, mép bước ngẫu nhiên (răng cưa), thủng lỗ sát mép + giữa, cong/xoắn/quăn mép
function tornPlate(w, h, o = {}) {
  const nx = o.nx ?? 6, ny = o.ny ?? 4, pos = [], uv = [], edge = [], idx = [];
  const cx = rnd(-1, 1) * (o.bend ?? 1.3), cy = rnd(-1, 1) * (o.bend ?? 1.3), tw = rnd(-1, 1) * (o.twist ?? 0.8), sd = rnd(0, 99), curl = (Math.random() < 0.7 ? 1 : -1) * (o.curl ?? 0.18);
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
    let x = (i / nx - 0.5) * w, y = (j / ny - 0.5) * h;
    const e = Math.min(i, nx - i, j, ny - j) / Math.max(1, Math.min(nx, ny) / 2);
    if (e === 0) { x += rnd(-0.4, 0.4) * w / nx; y += rnd(-0.4, 0.4) * h / ny; }
    const m = Math.min(w, h);
    const z = cx * x * x / w + cy * y * y / h + tw * x * y / Math.max(w, h) + (vnoise(x / m * 3 + sd, y / m * 3, sd) - 0.5) * 0.3 * m + curl * m * Math.pow(1 - Math.min(1, e * 1.8), 2);
    pos.push(x, y, z); uv.push(i / nx, j / ny); edge.push(e);
  }
  const W = nx + 1;
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const a = j * W + i, b = a + 1, c = a + W, d = c + 1, eq = Math.min(edge[a], edge[b], edge[c], edge[d]);
    if ((eq === 0 && Math.random() < (o.holes ?? 0.38)) || Math.random() < 0.05) continue;
    idx.push(a, b, d, a, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals(); g.userData.edge = edge;
  return g;
}
const SOOT = new THREE.Color("#1c1815");
function makeWreckKit(p) {
  const kit = new THREE.Group(); kit.visible = false; p.g.add(kit);
  const box = new THREE.Box3().setFromObject(p.g), S = box.getSize(new THREE.Vector3()), C = box.getCenter(new THREE.Vector3()), K = Math.max(S.x, S.z);
  // vật liệu CHÁY SẠM (màu gốc pha muội, hết bóng, loang lổ) — dùng cho cả mảnh rách lẫn các bộ phận gốc lúc nổ
  const sootOf = new Map(), count = new Map();
  p.parts.forEach(q => q.traverse(o => {
    if (!o.isMesh || o.material.isShaderMaterial) return;
    const m0 = o.material; count.set(m0, (count.get(m0) || 0) + 1);
    if (!sootOf.has(m0)) {
      const m = m0.clone(); m.color.lerp(SOOT, 0.86); m.roughness = 0.9; m.metalness = 0.4; m.vertexColors = true; m.side = THREE.DoubleSide;
      m.emissive = new THREE.Color(1, 0.35, 0.08); m.emissiveIntensity = 0; sootOf.set(m0, m);
    }
    if (!o.geometry.attributes.color) soot(o.geometry, K);            // có sẵn màu muội; lúc còn nguyên vật liệu gốc bỏ qua thuộc tính này
    o.userData.mat0 = m0;
  }));
  const byUse = [...count.entries()].sort((a, b) => b[1] - a[1]).map(e => sootOf.get(e[0]));
  const hullW = byUse[0], darkW = byUse[1] || byUse[0];
  const pieces = [];
  const add = (geo, mat, o = {}) => {
    if (o.crumple) crumple(geo, o.crumple * K, 6 / K);
    soot(geo, K);
    const m = new THREE.Mesh(geo, mat);
    const home = new THREE.Vector3(C.x + rnd(-0.45, 0.45) * S.x, C.y + rnd(-0.45, 0.45) * S.y, C.z + rnd(-0.45, 0.45) * S.z);
    m.position.copy(home); m.rotation.set(rnd(0, 6.3), rnd(0, 6.3), rnd(0, 6.3)); kit.add(m);
    pieces.push({ m, home, rot: m.rotation.clone(), heavy: !!o.heavy, big: !!o.big, v: new THREE.Vector3(), w: new THREE.Vector3(), burn: 0, smoke: 0, acc: 0, sacc: 0 });
  };
  // 1l (thầy: "tan thành NHIỀU MẢNH NHỎ, bốc khói và tối, rơi dần xuống"): toàn vụn nhỏ, không còn tấm to / bộ phận nguyên
  for (let i = 0; i < 70; i++) { const w = rnd(0.025, 0.075) * K; add(tornPlate(w, w * rnd(0.4, 0.9), { nx: 4, ny: 3 }), Math.random() < 0.72 ? hullW : darkW, { crumple: 0.004 }); }
  for (let i = 0; i < 8; i++) { const w = rnd(0.075, 0.12) * K; add(tornPlate(w, w * rnd(0.45, 0.8), { nx: 6, ny: 4 }), hullW, { crumple: 0.006, big: true }); }
  for (let i = 0; i < 6; i++) add(tornPlate(rnd(0.08, 0.16) * K, 0.02 * K, { nx: 8, ny: 2, twist: 3.2, holes: 0.15, curl: 0.05 }), hullW, { crumple: 0.006 });   // dải vỏ xoắn
  for (let i = 0; i < 3; i++) {                                                                          // ống gãy
    const a = rnd(0, 6.3), pts = [0, 1, 2, 3].map(k => new THREE.Vector3(Math.cos(a + k * 0.5) * 0.025 * K * k, k * 0.025 * K, Math.sin(a + k * 0.5) * 0.025 * K));
    add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, 0.005 * K, 5), darkW, { crumple: 0.003 });
  }
  for (let i = 0; i < 8; i++) add(new THREE.IcosahedronGeometry(rnd(0.012, 0.026) * K, 1), darkW, { crumple: 0.008, heavy: true });   // cục máy móp
  for (let i = 0; i < 14; i++) { const s = rnd(0.012, 0.035) * K, g = new THREE.BufferGeometry();       // mảnh vụn tam giác
    g.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, s, rnd(-0.3, 0.3) * s, 0, rnd(0.1, 0.9) * s, s * rnd(0.6, 1.1), rnd(-0.3, 0.3) * s], 3)); g.computeVertexNormals(); add(g, Math.random() < 0.6 ? hullW : darkW); }
  const hide = p.parts.filter(q => q.isMesh && new THREE.Box3().setFromObject(q).getSize(new THREE.Vector3()).length() / 2 > 0.35 * K);   // vỏ chính to ⇒ lúc nổ vỡ thành tấm (ẩn)
  p.kit = { g: kit, pieces, soot: [...sootOf.values()], sootOf, C, hide };
}

// ---------------------------------------------------------------- TÀU LỚN (dài 1, phóng to sau)
function buildHunter() {
  const HW = 0.3, HT = 0.07, HB = 0.05;
  const hc = x => HT * (0.5 - x), hw = x => HW * (0.5 - x);
  const ship = new THREE.Group(), body = new THREE.Group(); ship.add(body);
  // vỏ: tấm thép nhiều cỡ, đường ghép, rãnh tối, nắp tròn, vết bẩn — map + bump (độ phân giải cao)
  const plating = tex(2048, 1024, (g, w, h) => {
    g.fillStyle = "#8a9099"; g.fillRect(0, 0, w, h);
    for (let s = 0; s < 3; s++) for (let i = 0; i < [500, 1600, 4000][s]; i++) {
      const v = 118 + Math.floor(Math.random() * 44); g.fillStyle = `rgb(${v},${v + 2},${v + 6})`;
      const sw = [rnd(60, 180), rnd(18, 60), rnd(5, 16)][s], sh = [rnd(30, 90), rnd(10, 36), rnd(4, 10)][s];
      g.fillRect(Math.random() * w, Math.random() * h, sw, sh);
    }
    g.strokeStyle = "rgba(38,42,50,.45)"; g.lineWidth = 1;
    for (let x = 0; x < w; x += 24) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    for (let y = 0; y < h; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.fillStyle = "rgba(28,31,38,.8)"; for (let i = 0; i < 90; i++) g.fillRect(Math.random() * w, Math.random() * h, rnd(60, 380), rnd(2, 5));
    for (let i = 0; i < 160; i++) { g.strokeStyle = "rgba(40,44,52,.6)"; g.lineWidth = 1.5; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, rnd(3, 9), 0, 7); g.stroke(); }
    for (let i = 0; i < 70; i++) { const x = Math.random() * w, y = Math.random() * h, r = rnd(40, 160), gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, "rgba(40,36,34,.18)"); gr.addColorStop(1, "rgba(40,36,34,0)"); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
    g.fillStyle = "#5a6069"; g.fillRect(0, h / 2 - 6, w, 12);
  });
  const hullMat = new THREE.MeshStandardMaterial({ map: plating, bumpMap: plating, bumpScale: 1.4, color: 0x9aa0a8, metalness: 0.45, roughness: 0.62, side: THREE.DoubleSide });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x2a2e36, metalness: 0.6, roughness: 0.5 });
  // thân trên (2 mặt dốc) + bậc hông nhiều tầng + bụng
  const wedge = (hwS, top, bot, inset, mat) => {
    const N = [0.5 - inset, 0, 0], RL = [-0.5, 0, -hwS], RR = [-0.5, 0, hwS], T = [-0.5, top, 0], B = [-0.5, -bot, 0];
    const tris = [[N, T, RL], [N, RR, T], [N, RL, B], [N, B, RR], [RL, T, RR], [RL, RR, B]], pos = [], uv = [];
    tris.forEach(t => t.forEach(p => { pos.push(...p); uv.push(p[0] + 0.5, (p[2] + HW) / (2 * HW)); }));
    const gg = new THREE.BufferGeometry(); gg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); gg.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); gg.computeVertexNormals();
    return new THREE.Mesh(gg, mat);
  };
  body.add(wedge(HW, HT, HB, 0, hullMat));
  [[1.035, 0.004, 0.012, 0.012, darkMat], [1.06, -0.012, 0.006, 0.02, hullMat], [1.075, -0.022, 0.006, 0.03, darkMat]].forEach(([k, y, tp, inset, m]) => {
    const w = wedge(HW * k, tp, tp, inset, m); w.position.y = y; body.add(w);    // các tầng hông xếp lớp như ảnh
  });
  // chi tiết phủ boong: cỡ phân bố lệch (rất nhiều khối li ti, ít khối vừa), 3 loại hình
  const box = new THREE.BoxGeometry(1, 1, 1), cyl = new THREE.CylinderGeometry(0.5, 0.5, 1, 10);
  const gMat = new THREE.MeshStandardMaterial({ metalness: 0.5, roughness: 0.58 });
  const GN = 3200, CN = 420, gre = new THREE.InstancedMesh(box, gMat, GN), gcy = new THREE.InstancedMesh(cyl, gMat, CN);
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color();
  let gi = 0, ci = 0;
  const shade = () => { const k = rnd(0.07, 0.15); return _c.setRGB(k, k * 1.01, k * 1.05); };   // cùng tông vỏ tàu (màu tuyến tính) ⇒ hết lấm tấm kiểu lego
  const addB = (x, y, z, sx, sy, sz, rx = 0, ry = 0) => { if (gi >= GN) return; _q.setFromEuler(_e.set(rx, ry, 0)); _m.compose(_p.set(x, y, z), _q, _s.set(sx, sy, sz)); gre.setMatrixAt(gi, _m); gre.setColorAt(gi, shade()); gi++; };
  const addC = (x, y, z, r, hh, rx = 0) => { if (ci >= CN) return; _q.setFromEuler(_e.set(rx, 0, 0)); _m.compose(_p.set(x, y, z), _q, _s.set(r, hh, r)); gcy.setMatrixAt(ci, _m); gcy.setColorAt(ci, shade()); ci++; };
  const onDeck = (x, z) => hc(x) * (1 - Math.abs(z) / Math.max(1e-4, hw(x)));
  const underText = (x, z) => x > -0.12 && x < 0.38 && Math.abs(z) < 0.045;   // 1l: dời theo chữ   // dải boong dưới chữ ANDREW CLASSES để trống (chữ không bị khối chi tiết đâm xuyên)
  for (let i = 0; i < 2600; i++) {
    const x = 0.5 - Math.pow(Math.random(), 0.75) * 0.97, w = hw(x) * 0.97, z = rnd(-w, w), top = onDeck(x, z), sl = Math.atan2(hc(x), hw(x)) * Math.sign(z);
    if (underText(x, z)) continue;
    const big = Math.random() < 0.06, s = big ? rnd(0.008, 0.02) : Math.exp(rnd(Math.log(0.0012), Math.log(0.007)));
    const sy = s * rnd(0.3, 0.9);
    addB(x, top + sy * 0.4, z, s * rnd(1, 2.4), sy, s * rnd(0.6, 1.4), sl, Math.random() < 0.2 ? rnd(-0.3, 0.3) : 0);
  }
  for (let i = 0; i < 260; i++) { const x = rnd(-0.45, 0.35), w = hw(x) * 0.9, z = rnd(-w, w), top = onDeck(x, z), r = rnd(0.0015, 0.005), hh = rnd(0.002, 0.012); if (!underText(x, z)) addC(x, top + hh / 2, z, r, hh); }
  for (let i = 0; i < 40; i++) { const x = rnd(0.39, 0.46); addB(x, hc(x) + 0.003, rnd(-0.004, 0.004), rnd(0.01, 0.05), 0.005, 0.006); }   // sống lưng (phía mũi, ngoài vùng chữ)
  // tháp pháo 2 bên sườn (cũng là chỗ bắn đạn)
  const turrets = [];
  const turMat = new THREE.MeshStandardMaterial({ color: 0x7d838c, metalness: 0.6, roughness: 0.45 });
  for (const s of [-1, 1]) for (let i = 0; i < 6; i++) {
    const x = -0.35 + i * 0.13, z = s * hw(x) * 0.78, y = onDeck(x, z);
    const t = new THREE.Group(); t.position.set(x, y + 0.004, z); body.add(t);
    t.add(new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.011, 0.006, 14), turMat));
    const hd = new THREE.Mesh(new THREE.SphereGeometry(0.007, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), turMat); hd.position.y = 0.003; t.add(hd);
    for (const b of [-0.003, 0.003]) { const br = new THREE.Mesh(new THREE.CylinderGeometry(0.0012, 0.0012, 0.02, 6), darkMat); br.rotation.z = Math.PI / 2; br.position.set(0.01, 0.006, b); t.add(br); }
    turrets.push({ g: t, side: s });
  }
  // 1n: SÚNG HÔNG (thầy: "trang bị thêm các khẩu súng bên hông để bắn cho chuẩn và hợp lý") — gắn ở bậc hông, xoay ngang (yaw) + ngẩng
  //   (pitch) theo mục tiêu; nòng đôi dài, đầu nòng có ống loe; mốc `tip` ở đầu nòng = chỗ đạn bay ra
  const guns = [];
  const gunMat = new THREE.MeshStandardMaterial({ color: 0x6b717a, metalness: 0.6, roughness: 0.45 });
  const gBase = new THREE.CylinderGeometry(0.011, 0.013, 0.006, 16), gHouse = new THREE.BoxGeometry(0.02, 0.011, 0.015), gDome = new THREE.SphereGeometry(0.0075, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const gBar = new THREE.CylinderGeometry(0.0016, 0.0019, 0.05, 8).rotateZ(-Math.PI / 2), gTip = new THREE.CylinderGeometry(0.0026, 0.0026, 0.005, 8).rotateZ(-Math.PI / 2);
  for (const s of [-1, 1]) for (let i = 0; i < 5; i++) {
    const x = -0.33 + i * 0.13, g = new THREE.Group(); g.position.set(x, -0.004, s * (hw(x) * 1.06 + 0.004)); body.add(g);
    const base = new THREE.Mesh(gBase, gunMat); base.rotation.x = Math.PI / 2; base.position.z = s * 0.002; g.add(base);
    const yaw = new THREE.Group(); yaw.position.z = s * 0.009; g.add(yaw);
    yaw.add(new THREE.Mesh(gHouse, gunMat));
    const dome = new THREE.Mesh(gDome, gunMat); dome.position.y = 0.005; yaw.add(dome);
    const pitch = new THREE.Group(); pitch.position.x = 0.006; yaw.add(pitch);
    const bars = new THREE.Group(); pitch.add(bars);
    for (const bz of [-0.0035, 0.0035]) {
      const b = new THREE.Mesh(gBar, darkMat); b.position.set(0.025, 0, bz); bars.add(b);
      const t = new THREE.Mesh(gTip, darkMat); t.position.set(0.05, 0, bz); bars.add(t);
    }
    const tip = new THREE.Object3D(); tip.position.set(0.055, 0, 0); bars.add(tip);
    guns.push({ g, yaw, pitch, bars, tip, side: s, ay: -s * 0.5, ap: 0.05, rec: 0 });
  }
  // thượng tầng: khối vát cạnh xếp bậc + cửa sổ + chi tiết
  const supMat = new THREE.MeshStandardMaterial({ map: plating, color: 0x8b9199, metalness: 0.45, roughness: 0.6 });
  const bev = (sx, sy, sz) => {
    const sh = new THREE.Shape(), a = sx / 2, b = sz / 2, c = Math.min(a, b) * 0.22;
    sh.moveTo(-a + c, -b); sh.lineTo(a - c, -b); sh.lineTo(a, -b + c); sh.lineTo(a, b - c); sh.lineTo(a - c, b); sh.lineTo(-a + c, b); sh.lineTo(-a, b - c); sh.lineTo(-a, -b + c); sh.closePath();
    const gg = new THREE.ExtrudeGeometry(sh, { depth: sy, bevelEnabled: true, bevelThickness: sy * 0.18, bevelSize: sy * 0.18, bevelSegments: 1 }); gg.rotateX(-Math.PI / 2); gg.translate(0, -sy / 2, 0);
    return gg;
  };
  const tiers = [[-0.34, 0.26, 0.045, 0.22, 0.068], [-0.37, 0.19, 0.034, 0.16, 0.107], [-0.393, 0.14, 0.028, 0.115, 0.138], [-0.41, 0.095, 0.022, 0.08, 0.163]];
  const winMat = new THREE.MeshBasicMaterial({ toneMapped: false });
  const WN = 700, win = new THREE.InstancedMesh(box, winMat, WN); let wi = 0;
  const addW = (x, y, z, ry) => { if (wi >= WN) return; _q.setFromEuler(_e.set(0, ry, 0)); _m.compose(_p.set(x, y, z), _q, _s.set(0.0035, 0.0018, 0.001)); win.setMatrixAt(wi, _m); const on = Math.random() < 0.78, k = on ? rnd(1.3, 2.3) : 0.04; win.setColorAt(wi, _c.setRGB(k, k * 0.88, k * 0.62)); wi++; };
  tiers.forEach(([x, sx, sy, sz, y]) => {
    const m = new THREE.Mesh(bev(sx, sy, sz), supMat); m.position.set(x, y, 0); body.add(m);
    for (let k = 0; k < 90; k++) { const s = Math.exp(rnd(Math.log(0.0015), Math.log(0.008))); addB(x + rnd(-sx / 2, sx / 2) * 0.9, y + sy / 2 + 0.001 + s * 0.2, rnd(-sz / 2, sz / 2) * 0.9, s * 1.6, s * 0.5, s); }
    for (let r = 0; r < 3; r++) for (let i = 0; i < 16; i++) for (const s of [-1, 1]) addW(x + rnd(-sx / 2, sx / 2) * 0.9, y - sy * 0.3 + r * sy * 0.25, s * (sz / 2 + 0.0008), 0);
  });
  // cổ tháp + đài chỉ huy + 2 vòm cầu có đai + thanh chống
  const neck = new THREE.Mesh(bev(0.03, 0.05, 0.022), supMat); neck.position.set(-0.43, 0.2, 0); body.add(neck);
  const bridge = new THREE.Mesh(bev(0.058, 0.02, 0.17), supMat); bridge.position.set(-0.43, 0.233, 0); body.add(bridge);
  for (let i = 0; i < 40; i++) addW(-0.4 + 0.0012, 0.232 + (i % 2) * 0.003, -0.07 + (i / 40) * 0.14, Math.PI / 2);
  const domeMat = new THREE.MeshStandardMaterial({ color: 0xbfc5ce, metalness: 0.45, roughness: 0.4, flatShading: true });
  for (const z of [-0.06, 0.06]) {
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.007, 0.022, 10), supMat); st.position.set(-0.435, 0.252, z); body.add(st);
    const d = new THREE.Mesh(new THREE.IcosahedronGeometry(0.017, 3), domeMat); d.position.set(-0.435, 0.268, z); body.add(d);
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.017, 0.0015, 6, 24).rotateX(Math.PI / 2), darkMat); band.position.copy(d.position); body.add(band);
  }
  for (let i = 0; i < 60; i++) addB(-0.43 + rnd(-0.028, 0.028), 0.244, rnd(-0.08, 0.08), rnd(0.002, 0.008), rnd(0.001, 0.004), rnd(0.002, 0.009));
  // cửa sổ dọc các tầng hông
  for (const s of [-1, 1]) { const ang = Math.atan2(HW, 1) * s; for (let i = 0; i < 420; i++) { const x = rnd(-0.49, 0.46), lay = i % 3; addW(x, 0.004 - lay * 0.012, s * hw(x) * (1.035 + lay * 0.02) + s * 0.0008, -ang); } }
  gre.count = gi; gcy.count = ci; win.count = wi;
  [gre, gcy, win].forEach(m => { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; body.add(m); });
  // slogan: MỘT dòng ở giữa tàu, ngửa lên trên, sáng đèn
  const sloganTex = tex(1024, 160, (g, w, h) => {
    g.textAlign = "center"; g.textBaseline = "middle"; g.font = "900 110px 'Arial Black', Arial, sans-serif";
    g.shadowColor = "rgba(120,220,255,1)"; g.shadowBlur = 20; g.fillStyle = "#e6fbff"; g.fillText("ANDREW CLASSES", w / 2, h / 2 + 5, w - 30);
    g.shadowBlur = 0; g.fillText("ANDREW CLASSES", w / 2, h / 2 + 5, w - 30);
  });
  const sloganMat = new THREE.MeshBasicMaterial({ map: sloganTex, transparent: true, depthWrite: false, toneMapped: false, color: new THREE.Color(2, 2.3, 2.6) });
  const slogans = [false, true].map(flip => {
    const L = 0.44, H = L * 160 / 1024, x0 = 0.13;   // 1l: trước ở 0,02 ⇒ đầu chữ sát thượng tầng, bị che
    const geo = new THREE.PlaneGeometry(L, H); if (flip) geo.rotateZ(Math.PI);
    const m = new THREE.Mesh(geo, sloganMat);
    m.position.set(x0, hc(x0) + 0.009, 0); m.rotation.set(-Math.PI / 2, 0, 0);
    m.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), -Math.atan(HT));  // theo dốc sống lưng (cao dần về đuôi)
    m.renderOrder = 3; body.add(m); return { m, flip };
  });
  // động cơ: loa phụt tiện tròn (lathe) + lõi sáng + lửa shader
  const engMat = new THREE.MeshStandardMaterial({ color: 0x3b4048, metalness: 0.75, roughness: 0.35, side: THREE.DoubleSide });
  const coreMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 2.0, 2.8), toneMapped: false });
  const flames = [];
  [[0.032, 0, 0.03], [0.032, -0.072, 0.03], [0.032, 0.072, 0.03], [0.014, -0.125, 0.016], [0.014, 0.125, 0.016], [0.012, -0.038, 0.064], [0.012, 0.038, 0.064]].forEach(([r, z, y]) => {
    const prof = [[r * 0.7, 0], [r * 0.95, 0.01], [r * 1.12, 0.03], [r * 1.18, 0.045], [r * 1.05, 0.05]].map(([a, b]) => new THREE.Vector2(a, b));
    const bell = new THREE.Mesh(new THREE.LatheGeometry(prof, 28), engMat); bell.rotation.z = Math.PI / 2; bell.position.set(-0.49, y, z); body.add(bell);
    const core = new THREE.Mesh(new THREE.CircleGeometry(r * 0.95, 24), coreMat); core.rotation.y = -Math.PI / 2; core.position.set(-0.528, y, z); body.add(core);
    const f = makeFlame(r * 1.05, r * 12); f.g.position.set(-0.535, y, z); body.add(f.g); flames.push(f);
  });
  // 2j: biển LED neon ANDREW STUDIO ở đuôi — tấm nền tối gắn dưới cụm động cơ, chữ neon trên mặt sau (nhìn từ sau đuôi đọc xuôi)
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.034, 0.27), new THREE.MeshStandardMaterial({ color: 0x14171d, metalness: 0.7, roughness: 0.45 }));
  plate.position.set(-0.488, -0.03, 0); body.add(plate);
  const rim = new THREE.Mesh(new THREE.BoxGeometry(0.041, 0.037, 0.274), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.25, 0.9, 1.6), toneMapped: false, wireframe: true }));
  rim.position.copy(plate.position); body.add(rim);
  const sternTex = tex(1024, 128, (g, w, h) => {
    g.textAlign = "center"; g.textBaseline = "middle"; g.font = "800 92px 'Baloo 2', 'Arial Black', Arial, sans-serif";
    const T = "ANDREW STUDIO";
    g.lineJoin = "round"; g.shadowColor = "rgba(255,80,220,1)"; g.shadowBlur = 26; g.strokeStyle = "rgba(255,90,225,.95)"; g.lineWidth = 9; g.strokeText(T, w / 2, h / 2 + 4, w - 40);   // ống neon hồng
    g.shadowBlur = 10; g.shadowColor = "rgba(255,200,250,1)"; g.strokeStyle = "#ffe6fb"; g.lineWidth = 3.5; g.strokeText(T, w / 2, h / 2 + 4, w - 40);                                 // lõi sáng trắng
  });
  const sternMat = new THREE.MeshBasicMaterial({ map: sternTex, transparent: true, depthWrite: false, toneMapped: false, color: new THREE.Color(2.2, 1.6, 2.2) });
  const stern = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.25 * 128 / 1024), sternMat);
  stern.position.set(-0.5085, -0.03, 0); stern.rotation.y = -Math.PI / 2; stern.renderOrder = 3; body.add(stern);
  noShadow(ship);
  return { g: ship, body, turrets, guns, flames, slogans, sloganMat, stern, sternMat, nozzles: flames.map(f => f.g.position.clone()) };
}

// ---------------------------------------------------------------- TÀU CON (3 kiểu, dài ~1 rồi phóng to) — mũi hướng +x
function stdM(o) { return new THREE.MeshStandardMaterial({ metalness: 0.55, roughness: 0.45, ...o }); }
function panelTex(base, stripe) {
  return tex(256, 128, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 120; i++) { const v = Math.random() * 30 - 15; g.fillStyle = `rgba(${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${Math.abs(v) / 200})`; g.fillRect(Math.random() * w, Math.random() * h, rnd(10, 40), rnd(6, 20)); }
    g.strokeStyle = "rgba(0,0,0,.35)"; for (let x = 0; x < w; x += 20) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    g.fillStyle = stripe; g.fillRect(0, h * 0.42, w, h * 0.1);
  });
}
function buildFighter() {           // tiêm kích 4 cánh chữ X, thân nhọn, buồng lái kính, 4 động cơ, súng đầu cánh
  const g = new THREE.Group(), parts = [];
  const hull = stdM({ map: panelTex("#c9ccd2", "#b8452f"), color: 0xffffff }), dark = stdM({ color: 0x3a3f48 }), glass = stdM({ color: 0x0c1830, metalness: 0.9, roughness: 0.1 });
  const prof = [[0, 0.62], [0.035, 0.5], [0.06, 0.2], [0.07, -0.1], [0.075, -0.32], [0.06, -0.4], [0, -0.4]].map(([r, y]) => new THREE.Vector2(r, y));
  const fus = new THREE.Mesh(new THREE.LatheGeometry(prof, 18), hull); fus.rotation.z = -Math.PI / 2; g.add(fus); parts.push(fus);
  const can = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), glass); can.scale.set(1.8, 0.8, 1); can.position.set(0.08, 0.05, 0); g.add(can); parts.push(can);
  for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
    const w = new THREE.Group(); w.rotation.x = sz * sy * 0.28; g.add(w);
    const wing = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.012, 0.5), hull); wing.position.set(-0.12, sy * 0.02, sz * 0.3); w.add(wing);
    const eng = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.3, 14), dark); eng.rotation.z = Math.PI / 2; eng.position.set(-0.12, sy * 0.05, sz * 0.12); w.add(eng);
    const gun = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.5, 8), dark); gun.rotation.z = Math.PI / 2; gun.position.set(0.02, sy * 0.02, sz * 0.55); w.add(gun);
    parts.push(w);
  }
  return { g, parts, nozzles: [[-0.28, 0.05, 0.12], [-0.28, 0.05, -0.12], [-0.28, -0.05, 0.12], [-0.28, -0.05, -0.12]], flameR: 0.035 };
}
function buildFreighter() {         // tàu hàng hình đĩa: thân tròn dẹt, 2 càng trước, buồng lái ống bên hông, chảo ăng-ten, dải lửa sau
  const g = new THREE.Group(), parts = [];
  const hull = stdM({ map: panelTex("#b9bcc0", "#7a3b2f"), color: 0xffffff }), dark = stdM({ color: 0x3a3f48 });
  const prof = [[0, 0.07], [0.3, 0.06], [0.42, 0.03], [0.45, 0], [0.42, -0.03], [0.3, -0.05], [0, -0.06]].map(([r, y]) => new THREE.Vector2(r, y));
  const disc = new THREE.Mesh(new THREE.LatheGeometry(prof, 36), hull); g.add(disc); parts.push(disc);
  for (const s of [-1, 1]) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.05, 0.11), hull); m.position.set(0.5, 0, s * 0.1); g.add(m); parts.push(m); }
  const cock = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.28, 14), hull); cock.rotation.x = Math.PI / 2; cock.position.set(0.1, 0, 0.46); g.add(cock); parts.push(cock);
  const dish = new THREE.Mesh(new THREE.SphereGeometry(0.06, 14, 8, 0, Math.PI * 2, 0, Math.PI / 3), dark); dish.position.set(0.05, 0.1, -0.2); dish.rotation.x = -0.6; g.add(dish); parts.push(dish);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.04, 20), dark); top.position.y = 0.08; g.add(top); parts.push(top);
  for (let i = 0; i < 26; i++) { const a = rnd(0, 7), r = rnd(0.14, 0.4), b = new THREE.Mesh(new THREE.BoxGeometry(rnd(0.02, 0.06), 0.015, rnd(0.02, 0.05)), dark); b.position.set(Math.cos(a) * r, 0.06 - r * 0.04, Math.sin(a) * r); g.add(b); parts.push(b); }
  return { g, parts, nozzles: [[-0.44, 0, -0.18], [-0.45, 0, 0], [-0.44, 0, 0.18]], flameR: 0.05 };
}
function buildInterceptor() {       // tàu chặn: buồng lái cầu + 2 cánh lục giác đứng + khung nối
  const g = new THREE.Group(), parts = [];
  const hull = stdM({ color: 0x8e949c }), dark = stdM({ color: 0x2d3139 }), glass = stdM({ color: 0x101820, metalness: 0.9, roughness: 0.15 });
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.14, 20, 14), hull); g.add(ball); parts.push(ball);
  const win = new THREE.Mesh(new THREE.CircleGeometry(0.075, 8), glass); win.rotation.y = Math.PI / 2; win.position.x = 0.141; g.add(win); parts.push(win);
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.26), hull); arm.position.z = s * 0.17; g.add(arm); parts.push(arm);
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.02, 6), dark); w.rotation.x = Math.PI / 2; w.position.z = s * 0.3; g.add(w); parts.push(w);
    const frame = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.015, 4, 6), hull); frame.position.z = s * 0.3 + s * 0.012; g.add(frame); parts.push(frame);
    for (let k = 0; k < 6; k++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.4, 0.012), hull); sp.rotation.z = k * Math.PI / 3; sp.position.z = s * 0.3 + s * 0.013; g.add(sp); parts.push(sp); }
  }
  return { g, parts, nozzles: [[-0.14, 0, 0.05], [-0.14, 0, -0.05]], flameR: 0.03 };
}
const PREY = [buildFighter, buildFreighter, buildInterceptor];

// ---------------------------------------------------------------- HẠM ĐỘI
export function createFleet(scene, camera, opts = {}) {
  const LEN = opts.length ?? 47, DIST = opts.dist ?? 330, CROSS_S = opts.cross ?? 19, PREY_LEN = LEN * 0.3;
  const fx = k => { try { opts.onFx && opts.onFx(k); } catch (e) { /* âm thanh lỗi không làm hỏng cảnh */ } };   // 2j
  const H = buildHunter(); mergeStatic(H.body, new Set([...H.slogans.map(o => o.m), H.stern, ...H.guns.map(G => G.g), ...H.flames.map(f => f.g)])); H.body.scale.setScalar(LEN); H.g.visible = false; scene.add(H.g);   // 2e: gộp mảnh đứng yên
  const preyBuilt = PREY.map(fn => { const p = fn(); makeWreckKit(p); p.g.scale.setScalar(PREY_LEN); p.g.visible = false; scene.add(p.g);
    p.flames = p.nozzles.map(n => { const f = makeFlame(p.flameR, p.flameR * 7, { core: [1.8, 1.6, 1.2], mid: [1.6, 1.0, 0.5], edge1: [1.4, 0.8, 0.4], edge2: [1.2, 0.4, 0.1], halo: [1.6, 1.0, 0.5] }); f.g.position.set(...n); p.g.add(f.g); return f; });
    noShadow(p.g); p.parts.forEach(q => { q.userData.home = { p: q.position.clone(), r: q.rotation.clone(), s: q.scale.clone() }; }); return p; });

  // đạn laser + tia lửa trúng + vụ nổ (bể dùng lại)
  const boltGeo = new THREE.CylinderGeometry(0.16, 0.16, 8, 6).rotateZ(Math.PI / 2);   // 1l: mảnh hơn (0,35 ⇒ 0,16)
  const bolts = Array.from({ length: 36 }, () => { const m = new THREE.Mesh(boltGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 0.5, 0.4), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexC, color: new THREE.Color(2.4, 0.4, 0.3), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false })); glow.scale.set(3.2, 3.2, 1); m.add(glow);
    m.visible = false; scene.add(m); return { m, v: new THREE.Vector3(), life: 0, hit: false }; });
  const fireTex = tex(128, 128, (g, s) => { for (let i = 0; i < 16; i++) { const a = rnd(0, 7), d = rnd(0, s * 0.18), x = s / 2 + Math.cos(a) * d, y = s / 2 + Math.sin(a) * d, r = rnd(s * 0.15, s * 0.3), gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, "rgba(255,255,255,.7)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, s, s); } });
  const puffs = Array.from({ length: 70 }, () => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: fireTex, transparent: true, depthWrite: false })); s.visible = false; scene.add(s); return { s, life: 0, max: 1, v: new THREE.Vector3(), s0: 1, s1: 2, kind: "" }; });
  let pi = 0;
  const puff = (pos, kind, o = {}) => { const p = puffs[pi++ % puffs.length]; p.s.position.copy(pos); p.s.visible = true; p.life = 0; p.max = o.max ?? 1; p.kind = kind; p.s0 = o.s0 ?? 3; p.s1 = o.s1 ?? 10; p.v.set(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).multiplyScalar(o.sp ?? 6).add(o.drift ?? new THREE.Vector3());
    p.s.material.blending = kind === "smoke" ? THREE.NormalBlending : THREE.AdditiveBlending; p.s.material.rotation = rnd(0, 7); };

  // 1k: hạt lửa (cộng sáng) + hạt khói — lưỡi lửa liếm sau đuôi, vệt lửa/khói sau mảnh xác, tàn lửa văng
  const fireP = makeParticles(scene, 800, fireTex, true), smokeP = makeParticles(scene, 1800, fireTex, false);
  const RDR = opts.renderer, v2 = new THREE.Vector2(), shipV = new THREE.Vector3(), lickOff = new THREE.Vector3(), dv = new THREE.Vector3(), cA = new THREE.Color(), cB = new THREE.Color();
  let lickAcc = 0, preyLick = 0, emitOn = true;   /* 2e: emitOn — intro tắt khói/lưỡi lửa khi tàu đang trong cổng không gian */
  // vệt khói sau tàu lớn (thế giới)
  const smk = Array.from({ length: 70 }, () => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexC, color: 0x9aa6bd, transparent: true, opacity: 0, depthWrite: false })); s.visible = false; scene.add(s); return { s, life: 0, max: 1, v: new THREE.Vector3() }; });
  let smi = 0, smAcc = 0;

  // ---- đường bay theo màn hình (NDC) — 6 cửa vào, không trùng lượt trước
  const ENTRIES = ["BL", "BR", "TL", "TR", "L", "R"];
  let lastEntry = null, lastPrey = -1;
  const ndc = (nx, ny, dist, out) => out.copy(camera.position).addScaledVector(new THREE.Vector3(nx, ny, 0.5).unproject(camera).sub(camera.position).normalize(), dist);
  function pathFor(e) {
    const band = () => Math.random() < 0.5 ? rnd(0.56, 0.7) : rnd(-0.8, -0.64);
    switch (e) {
      case "BL": { const x = rnd(-0.85, -0.2); return [[x, -1.35], [x + rnd(0.7, 1.3), 1.35]]; }
      case "BR": { const x = rnd(0.2, 0.85); return [[x, -1.35], [x - rnd(0.7, 1.3), 1.35]]; }
      case "TL": { const x = rnd(-0.85, -0.2); return [[x, 1.35], [x + rnd(0.7, 1.3), -1.35]]; }
      case "TR": { const x = rnd(0.2, 0.85); return [[x, 1.35], [x - rnd(0.7, 1.3), -1.35]]; }
      case "L": { const y = band(); return [[-1.4, y], [1.4, y + rnd(-0.06, 0.06)]]; }
      default: { const y = band(); return [[1.4, y], [-1.4, y + rnd(-0.06, 0.06)]]; }
    }
  }
  const dir = new THREE.Vector3(), fwd = new THREE.Vector3(), pfwd = new THREE.Vector3();
  let state = "wait", wait = opts.firstWait ?? rnd(12, 20), t = 0, P = null, hits = 0, fireT = 0, fireSide = 1, preyDead = false, deadT = 0;
  // 1l (thầy: "tàu ANDREW CLASSES nghiêng ngả, lái theo hướng chạy của tàu con · 2 tàu đuổi nhau vòng vòng trong màn một chút, không nhất
  //   thiết bay thẳng và bắn nổ ngay"): MỘT đường cong (Catmull-Rom) vào từ mép màn, lượn vòng quanh giữa màn (cùng một chiều quay), kết ở
  //   điểm nổ (vùng nhìn thấy) rồi thẳng ra ngoài. Tàu con chạy trước; tàu lớn bám ĐÚNG vệt đó, cách sau ~1,7 thân ⇒ cua theo từng khúc cua
  //   của tàu con. Cả hai NGHIÊNG theo gia tốc hướng tâm (v² × độ cong). Rượt 11–15 s, trúng đạn chỉ toé lửa/khói; tới điểm cuối mới nổ.
  let killFired = false; const kpos = new THREE.Vector3();
  let route = null, routeL = 1, sKill = 1, sp = 30, sH = 0, sP = 0, bankH = 0, bankP = 0, flipNow = false, flipWant = false, flipT = 0;
  const LAG = LEN * 1.7;
  let SC = LEN, cineAim = null, hPow = 1;                                   // 1o: cỡ tàu hiện tại (intro phóng to) · mục tiêu súng lúc intro
  const visibleZone = v => { const q = v.clone().project(camera); return (q.y > 0.5 || q.y < -0.6 || Math.abs(q.x) > 0.9) && Math.abs(q.x) < 0.98 && Math.abs(q.y) < 0.95; };
  const onScreen = v => { const q = v.clone().project(camera); return Math.abs(q.x) < 1 && Math.abs(q.y) < 1 && q.z < 1; };
  function orient(obj, fwd) {
    const f = fwd.clone().normalize(), u0 = new THREE.Vector3(0, 1, 0), z = new THREE.Vector3().crossVectors(f, u0).normalize(), u = new THREE.Vector3().crossVectors(z, f).normalize();
    obj.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(f, u, z));
  }
  const WUP = new THREE.Vector3(0, 1, 0), fT = new THREE.Vector3(), fT2 = new THREE.Vector3(), fT3 = new THREE.Vector3(), fR = new THREE.Vector3();
  const clampU = s => Math.min(1, Math.max(0, s / routeL));
  function frameAt(s, pos, tan) { const u = clampU(s); route.getPointAt(u, pos); if (tan) route.getTangentAt(u, tan); }
  function bankAt(s, v) {                                          // nghiêng theo gia tốc hướng tâm có dấu: cua phải ⇒ nghiêng phải
    const ds = routeL * 0.004;
    route.getTangentAt(clampU(s), fT2); route.getTangentAt(clampU(s + ds), fT3); fR.crossVectors(fT2, WUP).normalize();
    const acc = v * v * fT3.sub(fT2).dot(fR) / ds;
    return Math.max(-0.4, Math.min(0.4, Math.atan(acc / 30)));   // 1x: nghiêng nhẹ — tàu lớn không lật gắt
  }
  function nearestS(pt) { let best = 0, bd = 1e18; const q = new THREE.Vector3(); for (let i = 0; i <= 600; i++) { route.getPointAt(i / 600, q); const d = q.distanceToSquared(pt); if (d < bd) { bd = d; best = i / 600; } } return best * routeL; }
  function sloganFlip() {                                          // chữ luôn đọc xuôi trên màn (đổi mặt khi tàu quay đầu)
    const a = H.g.position.clone().project(camera), b = tmp.copy(H.g.position).addScaledVector(fwd, 20).project(camera);
    return Math.abs(b.x - a.x) < 0.004 ? flipNow : b.x < a.x;
  }
  function launch() {
    if (P) P.g.visible = false;                                      // 1k: xác tàu con lượt trước (nếu còn trôi) tắt hẳn
    camera.updateMatrixWorld();
    const e = pick(ENTRIES.filter(x => x !== lastEntry)); lastEntry = e;
    const [[x0, y0], [x1, y1]] = pathFor(e);
    const il = Math.hypot(x1 - x0, y1 - y0), nd = [[x0 - (x1 - x0) / il * 0.55, y0 - (y1 - y0) / il * 0.55], [x0, y0]];
    // 1x: thầy — tàu lớn không bẻ lái gắt: bỏ các vòng lượn; từ mép màn đi MỘT CUNG MỀM (Bézier bậc 2) tới điểm nổ rồi đi thẳng ra
    // 1m: điểm nổ CHẮC CHẮN nhìn thấy: ngoài hình chiếu mê cung (+ lề), dưới câu hỏi, trên hàng chữ dưới, tránh góc D-pad, không sát mép
    const br = opts.blockRect ? opts.blockRect() : { x0: -0.9, x1: 0.9, y0: -0.5, y1: 0.45 }, top = !(y0 > 0);   // 1x: điểm nổ ở nửa màn đối diện chỗ vào ⇒ cung đủ dài, không phải vòng
    const okKill = (x, y) => !(x > br.x0 - 0.08 && x < br.x1 + 0.08 && y > br.y0 - 0.08 && y < br.y1 + 0.08) && y < 0.62 && y > -0.74 && !(x > 0.5 && y < -0.3) && !(x < -0.5 && y < -0.3) && Math.abs(x) < 0.8;
    let kill = null;
    for (let i = 0; i < 160 && !kill; i++) { const x = rnd(-0.78, 0.78), y = (i < 80 ? top : !top) ? rnd(0.05, 0.62) : rnd(-0.74, -0.05); if (okKill(x, y)) kill = [x, y]; }
    const K = kill || [rnd(-0.4, 0.4), Math.min(0.62, br.y1 + 0.12)];
    { const mx = (x0 + K[0]) / 2, my = (y0 + K[1]) / 2, L = Math.hypot(K[0] - x0, K[1] - y0) || 1, off = (Math.random() < 0.5 ? 1 : -1) * rnd(0.12, 0.3) * L;
      const C = [mx - (K[1] - y0) / L * off, my + (K[0] - x0) / L * off], tl = Math.hypot(C[0] - x0, C[1] - y0) || 1;
      nd[0] = [x0 - (C[0] - x0) / tl * 0.55, y0 - (C[1] - y0) / tl * 0.55];                 // vào màn đúng theo hướng cung ⇒ không gãy khúc
      for (const u of [0.25, 0.5, 0.75]) nd.push([(1 - u) * (1 - u) * x0 + 2 * u * (1 - u) * C[0] + u * u * K[0], (1 - u) * (1 - u) * y0 + 2 * u * (1 - u) * C[1] + u * u * K[1]]);
      nd.push(K); nd.__C = C; }
    const [kx, ky] = nd[nd.length - 1], [qx, qy] = nd.__C, ol = Math.hypot(kx - qx, ky - qy) || 1;
    nd.push([kx + (kx - qx) / ol * 0.9, ky + (ky - qy) / ol * 0.9], [kx + (kx - qx) / ol * 2.2, ky + (ky - qy) / ol * 2.2]);   // nổ xong tàu lớn bay thẳng ra khỏi màn (theo màn hình, không lao vào máy quay)
    const pts = nd.map(([x, y], i) => ndc(x, y, DIST * (i >= nd.length - 2 ? 1.02 : rnd(0.95, 1.08)), new THREE.Vector3()));
    const kp = pts[pts.length - 3];
    route = new THREE.CatmullRomCurve3(pts, false, "centripetal"); routeL = route.getLength();
    sKill = nearestS(kp); const sEntry = nearestS(pts[1]);
    sp = Math.min(22, (sKill - sEntry) / rnd(12, 15)); sH = 0; sP = LAG;   // 1x: chậm hơn (trần tốc độ)
    let k; do { k = Math.floor(Math.random() * PREY.length); } while (k === lastPrey); lastPrey = k; P = preyBuilt[k];
    P.parts.forEach(q => { const h = q.userData.home; q.position.copy(h.p); q.rotation.copy(h.r); q.scale.copy(h.s); q.visible = true; q.traverse(o => { if (o.userData.mat0) o.material = o.userData.mat0; }); });
    P.kit.g.visible = false; P.kit.pieces.forEach(k => { k.m.position.copy(k.home); k.m.rotation.copy(k.rot); k.m.scale.setScalar(1); });
    P.flames.forEach(f => { f.g.visible = true; });
    H.g.visible = true; P.g.visible = true;
    frameAt(sH, H.g.position, fwd); orient(H.g, fwd); frameAt(sP, P.g.position, pfwd); orient(P.g, pfwd); dir.copy(pfwd);
    flipNow = flipWant = sloganFlip(); H.slogans.forEach(o => { o.m.visible = o.flip === flipNow; });
    state = "fly"; t = 0; hits = 0; preyDead = false; fireT = 1.2; deadT = 0; bankH = bankP = 0; killFired = false;
  }
  const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), muzzle = new THREE.Vector3();
  // 1n: súng hông xoay theo mục tiêu (trong hệ toạ độ thân tàu); nòng chỉ quay ra phía NGOÀI mạn của mình
  const gv = new THREE.Vector3(), gp = new THREE.Vector3();
  function aimGuns(dt, target) {
    for (const G of H.guns) {
      let ty = -G.side * 0.5, tp = 0.05;
      if (target) {
        gv.copy(target); H.body.worldToLocal(gv); gp.copy(G.g.position).add(G.yaw.position); gv.sub(gp);
        ty = Math.atan2(-gv.z, gv.x);
        if (G.side > 0) { if (ty > 0) ty = ty < Math.PI / 2 ? -0.12 : -Math.PI + 0.12; ty = Math.min(-0.12, Math.max(-Math.PI + 0.12, ty)); }
        else { if (ty < 0) ty = ty > -Math.PI / 2 ? 0.12 : Math.PI - 0.12; ty = Math.max(0.12, Math.min(Math.PI - 0.12, ty)); }
        tp = Math.max(-0.45, Math.min(0.75, Math.atan2(gv.y, Math.hypot(gv.x, gv.z))));
      }
      G.ay += (ty - G.ay) * Math.min(1, dt * 5); G.ap += (tp - G.ap) * Math.min(1, dt * 5);
      G.yaw.rotation.y = G.ay; G.pitch.rotation.z = G.ap;
      G.rec = Math.max(0, G.rec - dt * 4); G.bars.position.x = -0.008 * G.rec;               // giật nòng rồi trả về
    }
  }
  function fireFrom(target) {                                        // chọn khẩu ở mạn có mục tiêu, gần mục tiêu theo chiều dọc tàu, đang rảnh
    gv.copy(target); H.body.worldToLocal(gv);
    const sd = gv.z >= 0 ? 1 : -1, gx = Math.max(-0.33, Math.min(0.19, gv.x));
    let best = null, bd = 1e9;
    for (const G of H.guns) { if (G.side !== sd) continue; const d = G.rec * 2 + Math.abs(G.g.position.x - gx) + Math.random() * 0.12; if (d < bd) { bd = d; best = G; } }
    H.g.updateMatrixWorld(true); best.tip.getWorldPosition(muzzle); best.rec = 1;
    return muzzle;
  }
  function update(dt, time) {
    if (state === "wait") { wait -= dt; if (wait <= 0) launch(); }
    if (state === "cine") {                                          // 1o: intro điều khiển tàu; ở đây chỉ chạy hiệu ứng + súng + đạn
      aimGuns(dt, cineAim);
      for (const b of bolts) { if (!b.m.visible) continue; b.life += dt; b.m.position.addScaledVector(b.v, dt); if (b.life > 2.5) b.m.visible = false; }
      hunterFx(dt, time);
    }
    if (state === "fly") {
      t += dt;
      if (preyDead) sp *= 1 + dt * 0.2;                              // hạ xong: tăng tốc bay thẳng ra
      sH += sp * dt;
      frameAt(sH, H.g.position, fwd);
      bankH += (bankAt(sH, sp) - bankH) * Math.min(1, dt * 1.2);
      orient(H.g, fwd); H.g.rotateX(bankH); H.g.updateMatrixWorld(true);
      shipV.copy(fwd).multiplyScalar(sp);
      aimGuns(dt, preyDead ? null : P.g.position);
      if (!preyDead) {
        sP += sp * dt;
        frameAt(sP, P.g.position, pfwd); dir.copy(pfwd);
        bankP += (bankAt(sP, sp) * 1.15 - bankP) * Math.min(1, dt * 2);
        orient(P.g, pfwd); P.g.rotateX(bankP + Math.sin(t * 1.4) * 0.07);   // nghiêng theo khúc cua + lắc nhẹ né đạn
        P.flames.forEach(f => tickFlame(f, time, 1));
        P.g.updateMatrixWorld(true); preyLick += dt * 26;
        while (preyLick > 1) { preyLick--; const f = pick(P.flames), rw = f.r * PREY_LEN; P.g.localToWorld(tmp.copy(f.g.position).add(lickOff.set(-rnd(0.2, 0.7) * f.len, 0, 0)));
          fireP.emit({ pos: tmp, vel: tmp2.copy(pfwd).multiplyScalar(sp * rnd(0.55, 0.78)), life: rnd(0.22, 0.4), size: rw * 1.6, sizeEnd: rw * 3, color: cA.setRGB(1.6, 0.9, 0.4), colorEnd: cB.setRGB(0.4, 0.08, 0.02), alpha: 0.4, drag: 0.4 }); }
        // bắn: 2 bên sườn luân phiên, khi cả hai đã vào màn; ngắm đón đầu theo hướng tàu con đang chạy
        fireT -= dt;
        if (fireT <= 0 && onScreen(H.g.position) && onScreen(P.g.position)) {
          fireT = rnd(0.2, 0.42);
          fireFrom(P.g.position);                                     // 1n: đạn ra từ đầu nòng súng hông
          const b = bolts.find(x => !x.m.visible) || bolts[0];
          const aim = tmp2.copy(P.g.position).addScaledVector(pfwd, sp * P.g.position.distanceTo(muzzle) / 260);
          const miss = Math.random() < 0.4;
          if (miss) { fR.crossVectors(pfwd, WUP).normalize(); aim.addScaledVector(fR, rnd(5, 10) * (Math.random() < 0.5 ? -1 : 1)).addScaledVector(WUP, rnd(-4, 4)); }
          b.v.copy(aim).sub(muzzle).normalize().multiplyScalar(260); b.m.position.copy(muzzle); orient(b.m, b.v); b.m.visible = true; b.life = 0;
          b.hit = !miss; b.kill = false;
          puff(muzzle, "flash", { max: 0.1, s0: 1.4, s1: 2.6, sp: 0 }); fx("shot");   /* 2j */
        }
        // 1m: phát KẾT LIỄU — canh giờ để đạn tới điểm nổ đúng lúc tàu con tới đó; trúng mới nổ (dự phòng: quá điểm nổ 0,6 s)
        if (!killFired) {
          frameAt(sKill, kpos);
          const tt = H.g.position.distanceTo(kpos) / 260;
          if ((sKill - sP) / sp <= tt) {
            fireFrom(kpos);
            const b = bolts.find(x => !x.m.visible) || bolts[0];
            b.v.copy(kpos).sub(muzzle).normalize().multiplyScalar(260); b.m.position.copy(muzzle); orient(b.m, b.v); b.m.visible = true; b.life = 0; b.hit = true; b.kill = true;
            puff(muzzle, "flash", { max: 0.12, s0: 1.8, s1: 3.2, sp: 0 }); killFired = true; fireT = 9; fx("shot");   /* 2j */
          }
        }
        if (sP >= sKill + sp * 0.6) explodePrey();
      }
      // đạn bay: trúng thì toé lửa + khói (tàu con bị thương), chưa nổ
      for (const b of bolts) {
        if (!b.m.visible) continue;
        b.life += dt; b.m.position.addScaledVector(b.v, dt);
        if (b.life > 2.5) { b.m.visible = false; continue; }
        if (b.hit && !preyDead && b.m.position.distanceTo(P.g.position) < PREY_LEN * 0.7) {
          b.m.visible = false; hits++; if (!b.kill) fx("hit");   /* 2j */
          puff(P.g.position, "spark", { max: 0.35, s0: 3, s1: 7, sp: 10 }); puff(P.g.position, "smoke", { max: 1.6, s0: 3, s1: 8, sp: 3 });
          if (b.kill) explodePrey();
        }
      }
      hunterFx(dt, time);
      if (sH >= routeL) { state = "wait"; wait = rnd(45, 60); H.g.visible = false; if (!preyDead) P.g.visible = false; bolts.forEach(b => { b.m.visible = false; }); }
    }
    if (P && preyDead && P.g.visible) updateDebris(dt);
    if (RDR) RDR.getDrawingBufferSize(v2);
    const psc = camera.projectionMatrix.elements[5] * (RDR ? v2.y : innerHeight) * 0.5;
    fireP.update(dt, psc); smokeP.update(dt, psc);
    for (const p of smk) { if (!p.s.visible) continue; p.life += dt; const k = p.life / p.max; if (k >= 1) { p.s.visible = false; continue; } p.s.position.addScaledVector(p.v, dt); p.s.scale.setScalar(SC * (0.03 + 0.1 * Math.sqrt(k))); p.s.material.opacity = 0.28 * (k < 0.1 ? k / 0.1 : 1 - k); }
    for (const p of puffs) {
      if (!p.s.visible) continue; p.life += dt; const k = p.life / p.max; if (k >= 1) { p.s.visible = false; continue; }
      p.s.position.addScaledVector(p.v, dt); p.v.multiplyScalar(Math.exp(-2 * dt)); p.s.scale.setScalar(p.s0 + (p.s1 - p.s0) * Math.sqrt(k));
      const m = p.s.material;
      if (p.kind === "fire") { const c = k < 0.3 ? [3, 2.2, 1.2] : k < 0.6 ? [2.2, 0.9, 0.3] : [0.6, 0.2, 0.08]; m.color.setRGB(...c); m.opacity = 1 - k; }
      else if (p.kind === "smoke") { m.color.setRGB(0.12, 0.12, 0.13); m.opacity = 0.55 * (1 - k); }
      else if (p.kind === "spark") { m.color.setRGB(3, 2, 1); m.opacity = 1 - k; }
      else { m.color.setRGB(4, 3, 2); m.opacity = 1 - k; }
    }
  }
  // lửa + lưỡi lửa + khói đuôi + chữ chập chờn/đổi mặt — dùng chung cho bay thật và intro điện ảnh
  function hunterFx(dt, time) {
    // khói đuôi + lửa + slogan chập chờn
    H.flames.forEach(f => tickFlame(f, time, hPow));
    // 1k: lưỡi lửa LIẾM bay ra sau đuôi (tụt lại sau tàu, nở to, cam → đỏ sẫm rồi tắt) ⇒ đuôi lửa không còn cứng một khối
    lickAcc += emitOn ? dt * 75 * hPow : 0;
    while (lickAcc > 1) {
      lickAcc--; const k = Math.random() < 0.7 ? Math.floor(Math.random() * 3) : 3 + Math.floor(Math.random() * 4), f = H.flames[k], rw = f.r * SC;
      H.body.localToWorld(tmp.copy(H.nozzles[k]).add(lickOff.set(-rnd(0.15, 0.7) * f.len, rnd(-0.3, 0.3) * f.r, rnd(-0.3, 0.3) * f.r)));
      fireP.emit({ pos: tmp, vel: tmp2.copy(shipV).multiplyScalar(rnd(0.55, 0.78)).add(lickOff.set(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).multiplyScalar(rw * 0.8)), life: rnd(0.3, 0.6),
        size: rw * rnd(0.8, 1.2), sizeEnd: rw * rnd(1.8, 2.6), color: cA.setRGB(1.2, 0.7, 0.35), colorEnd: cB.setRGB(0.3, 0.06, 0.02), alpha: 0.3, drag: 0.4 });
    }
    smAcc += emitOn ? dt * 18 : 0;
    while (smAcc > 1) { smAcc--; const n = H.nozzles[Math.floor(Math.random() * 3)], p = smk[smi++ % smk.length]; H.body.localToWorld(tmp.copy(n).add(new THREE.Vector3(-0.06, 0, 0))); p.s.position.copy(tmp); p.s.visible = true; p.life = 0; p.max = rnd(2, 3.2); p.v.copy(fwd).multiplyScalar(-sp * 0.1).add(new THREE.Vector3(rnd(-0.5, 0.5), rnd(-0.3, 0.5), rnd(-0.5, 0.5))); }
    // chữ: tàu quay đầu ⇒ đổi mặt chữ cho xuôi; đổi đúng lúc chữ đang chập tắt (khỏi thấy nhảy)
    const want = sloganFlip(); if (want !== flipWant) { flipWant = want; flipT = 0; }
    let dim = glitch(dt);
    if (flipWant !== flipNow) { flipT += dt; if (!dim && flipT > 0.05) { gl = rnd(0.18, 0.3); dim = true; } if (dim) { flipNow = flipWant; H.slogans.forEach(o => { o.m.visible = o.flip === flipNow; }); } }
    const g = Math.random(); H.sloganMat.color.setRGB(2, 2.3, 2.6).multiplyScalar(dim ? (g < 0.4 ? 0.08 : g < 0.6 ? 0.45 : 1.15) : 1);
    H.sternMat.color.setRGB(2.2, 1.6, 2.2).multiplyScalar(dim ? (g < 0.4 ? 0.15 : g < 0.6 ? 0.5 : 1.1) : 0.92 + 0.08 * Math.sin(time * 9));   /* 2j: neon đuôi chập chờn cùng nhịp */
  }
  let gl = 0, glNext = rnd(2, 5);
  function glitch(dt) { glNext -= dt; if (glNext <= 0 && gl <= 0) { gl = rnd(0.25, 0.6); glNext = rnd(2.5, 6); } if (gl > 0) { gl -= dt; return true; } return false; }
  function explodePrey() {
    preyDead = true; deadT = 0; fx("boom");   /* 2j */
    const c = P.g.position.clone();
    puff(c, "flash", { max: 0.25, s0: 10, s1: 30, sp: 0 });
    for (let i = 0; i < 18; i++) puff(c, "fire", { max: rnd(0.6, 1.2), s0: rnd(3, 6), s1: rnd(10, 18), sp: rnd(6, 14) });
    for (let i = 0; i < 14; i++) puff(c, "smoke", { max: rnd(1.5, 2.6), s0: rnd(4, 7), s1: rnd(12, 20), sp: rnd(3, 7) });
    for (let i = 0; i < 10; i++) puff(c, "spark", { max: rnd(0.4, 0.9), s0: 1, s1: 2, sp: rnd(20, 34) });
    P.flames.forEach(f => { f.g.visible = false; });
    P.parts.forEach(q => { q.visible = false; });                   // 1l: tàu vỡ vụn hết — chỉ còn bộ vụn nhỏ
    const K = P.kit; K.g.visible = true; K.soot.forEach(m => { m.emissiveIntensity = 0.18; });
    P.g.updateMatrixWorld(true);
    K.gw = new THREE.Vector3(0, -1, 0).applyQuaternion(camera.quaternion);                     // "xuống dưới" theo màn hình (thế giới)
    K.gl = K.gw.clone().applyQuaternion(P.g.quaternion.clone().invert()).multiplyScalar(1 / PREY_LEN);   // … đổi sang toạ độ trong tàu con
    K.pieces.forEach(k => {
      const out = k.home.clone().sub(K.C); if (out.lengthSq() < 1e-8) out.set(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1));
      out.normalize().add(dv.set(rnd(-0.4, 0.4), rnd(-0.4, 0.4), rnd(-0.4, 0.4))).normalize();
      k.v.copy(out).multiplyScalar(k.heavy ? rnd(0.12, 0.35) : rnd(0.3, 1.1)).add(dv.set(rnd(0.1, 0.35), 0, 0));   // bung ra + còn đà bay tới
      k.w.set(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).multiplyScalar(k.heavy ? 2 : rnd(3, 9));
      k.burn = k.heavy || Math.random() < 0.15 ? rnd(1.2, 2.8) : 0;
      k.smoke = rnd(6, 8.5); k.fall = rnd(0.7, 1.3); k.acc = rnd(0, 1); k.sacc = rnd(0, 1);   // 1l: MỌI mảnh bốc khói suốt lúc rơi
    });
    for (let i = 0; i < 40; i++) fireP.emit({ pos: c, vel: dv.set(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).normalize().multiplyScalar(rnd(12, 34)), life: rnd(0.7, 1.6), size: rnd(0.35, 0.7), sizeEnd: 0.15,
      color: cA.setRGB(3, 1.9, 0.7), colorEnd: cB.setRGB(1.1, 0.2, 0.04), alpha: 1, drag: 1.1 });   // tàn lửa văng
  }
  // 1k: xác trôi, xoay, nguội dần; mảnh cháy kéo lửa, mảnh lớn kéo khói; sau ~6,5 s thu nhỏ tan dần
  function updateDebris(dt) {
    deadT += dt; const K = P.kit, hot = Math.exp(-deadT / 0.9);
    K.soot.forEach(m => { m.emissiveIntensity = 0.22 * hot; });   // vừa nổ còn ửng đỏ, nguội nhanh
    const fade = deadT < 7.5 ? 1 : Math.max(0, 1 - (deadT - 7.5) / 1.5), damp = Math.exp(-0.45 * dt), sc = Math.max(0.001, fade);   // 1l: rơi lâu hơn rồi mới tan
    P.g.updateMatrixWorld(true);
    const smokeAt = (pos, f, big, burning) => smokeP.emit({ pos, vel: dv.set(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).multiplyScalar(0.9).addScaledVector(K.gw, -2.2), life: rnd(1.6, 2.8), size: rnd(0.9, 1.5) * big, sizeEnd: rnd(3.6, 5.4) * big,
      color: burning ? cA.setRGB(0.2, 0.11, 0.06) : cA.setRGB(0.13, 0.12, 0.12), colorEnd: cB.setRGB(0.06, 0.056, 0.062), alpha: rnd(0.45, 0.6) * (0.45 + 0.55 * f) * fade, drag: 0.5 });
    for (const k of K.pieces) {
      k.v.addScaledVector(K.gl, 7 * k.fall * dt);                                  // 1l: rơi dần xuống (lực kéo + cản ⇒ rơi đều, chậm)
      k.m.position.addScaledVector(k.v, dt); k.v.multiplyScalar(damp);
      k.m.rotation.x += k.w.x * dt; k.m.rotation.y += k.w.y * dt; k.m.rotation.z += k.w.z * dt; k.m.scale.setScalar(sc);
      const burning = k.burn > deadT;
      if (!burning && k.smoke <= deadT) continue;
      tmp.copy(k.m.position).applyMatrix4(P.g.matrixWorld);
      if (burning) { const f = 1 - deadT / k.burn; k.acc += dt * 28 * f;
        while (k.acc > 1) { k.acc--; fireP.emit({ pos: tmp, vel: dv.set(rnd(-0.6, 0.6), rnd(-0.6, 0.6), rnd(-0.6, 0.6)), life: rnd(0.22, 0.45), size: rnd(0.6, 1.1), sizeEnd: 0.25,
          color: cA.setRGB(2.4, 1.3, 0.4), colorEnd: cB.setRGB(0.8, 0.1, 0.02), alpha: 0.9 * fade, drag: 1.5 }); } }
      if (k.smoke > deadT) { const f = 1 - deadT / k.smoke; k.sacc += dt * (k.heavy || k.big || k.burn ? 10 : 5) * (0.35 + 0.65 * f); while (k.sacc > 1) { k.sacc--; smokeAt(tmp, f, k.heavy || k.big ? 1 : 0.6, burning); } }
    }
    if (fade <= 0) P.g.visible = false;
  }
  // 1o: API ĐIỆN ẢNH cho intro
  const cine = {
    begin(scale = 1) {
      if (P) P.g.visible = false; bolts.forEach(b => { b.m.visible = false; });
      state = "cine"; SC = LEN * scale; H.body.scale.setScalar(SC); H.g.visible = true; fwd.set(0, 0, -1); flipNow = flipWant = false;
      H.slogans.forEach(o => { o.m.visible = o.flip === flipNow; });
    },
    set(pos, f, bank = 0, speed = 30) {
      H.g.position.copy(pos); fwd.copy(f).normalize(); orient(H.g, fwd); H.g.rotateX(bank); H.g.updateMatrixWorld(true);
      sp = speed; shipV.copy(fwd).multiplyScalar(speed);
    },
    aim(target) { cineAim = target ? target.clone() : null; },
    emit(on) { emitOn = !!on; },   /* 2e */
    fire(target, speed = 260) {
      const m = fireFrom(target), b = bolts.find(x => !x.m.visible) || bolts[0];
      b.v.copy(target).sub(m).normalize().multiplyScalar(speed); b.m.position.copy(m); orient(b.m, b.v); b.m.visible = true; b.life = 0; b.hit = false; b.kill = false;
      puff(m, "flash", { max: 0.12, s0: 1.8, s1: 3.2, sp: 0 }); fx("shot");   /* 2j */
    },
    power(k) { hPow = k; },
    get sc() { return SC; },
    end(waitS = rnd(25, 40)) { hPow = 1; state = "wait"; wait = waitS; H.g.visible = false; SC = LEN; H.body.scale.setScalar(LEN); cineAim = null; bolts.forEach(b => { b.m.visible = false; }); },
    get active() { return state === "cine"; },
  };
  return { update, launch, cine, group: H.g, get flying() { return state === "fly"; }, warmObjects: () => [H.g, ...preyBuilt.map(p => p.g), ...preyBuilt.map(p => p.kit.g)] };
}
