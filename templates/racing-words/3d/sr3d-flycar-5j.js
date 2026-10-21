// RACING WORDS mẫu 5j (21/10/2026) — XE BAY "ROADSTER" (Ferrari 296 GTS) = 1 MẪU TRONG BỘ DRONE.
//   Thiết kế: speed-run/thiet-ke-5j-xe-bay-v2.html (thầy chốt) · gốc phần bay: xe-bay/mau-3.html + xe3.js (myGame).
//   Mẫu: drone3d/flycar-F296.glb (Sketchfab "2023 Ferrari 296 GTS" — Ddiaz Design, CC BY-NC-SA 4.0; 4 bánh tách sẵn Wheel_LF/RF/LB/RB + kẹp phanh _cal).
//   Đúng CỠ THẬT (dài 4,57 m). Mũi xe = −Z (như xe đua / drone của game). Mọi vật liệu qua bend() (đường cong chỉ uốn ở shader).
//   Phần bay (số đo lấy từ mẫu 3, hệ "mũi = +z" bên trong nhóm in, rồi xoay π):
//     · 4 ống GẦM (2 ngay sau bánh trước, 2 sau bánh sau) — chỉ KHÓI trắng mờ, cột khói tan sau ~3 m
//     · 4 ống ĐUÔI (dải lưới đen dưới đèn hậu) — lơ lửng xì nhẹ giữ cân, lao tới xì mạnh
//     · 4 ống HÔNG — mỗi nhịp 1 dải khói LIỀN phóng thẳng ngang ~2 m rồi CẢ dải tan cùng lúc; ống bên s phun ra s ⇒ đẩy xe về −s
//     · BỆ TÊN LỬA dáng nêm giữa nắp khoang máy, 3 nòng 1 hàng ngửa 37° — trái HEART · giữa BOOST · phải MISSILE (nòng đang chọn sáng màu đạn)
//   createFlyCar({ bend, U }) ⇒ { obj, smoke, load(), update(dt, st), muzzle(k, pos, dir), M, setTint(col|null), dispose() }
//   st = { t, air 0|1, lift 0..1 (lực gầm), rear 0..1 (ống đuôi), side { want: -1..1 (gia tốc ngang muốn, theo trục X thế giới), yaw }, carry: Vector3 vận tốc xe (m/s, thế giới),
//          spin (rad bánh quay thêm), pod 0..1, sel 0..2, alt (m) }
import * as THREE from "../../rocket-race/vendor/three/three.module.min.js";
import { GLTFLoader } from "../../rocket-race/vendor/three/addons/GLTFLoader.js";
import { MeshoptDecoder } from "../../rocket-race/vendor/three/addons/meshopt_decoder.module.js";
import { BEND_GLSL } from "./sr3d-world-4b.js";

const URL_GLB = new URL("../drone3d/flycar-F296.glb?v=5j", import.meta.url).href;
export const FLYCAR = { id: "F296", name: "Roadster", L: 4.57, W: 1.95, kind: "car", by: "Ddiaz Design", lic: "CC BY-NC-SA 4.0" };
const SC = 100;                                                   // mẫu tính bằng 1/100 m
// số đo (m, hệ mũi = +z, đất y = 0) — đo trên mẫu 3 bằng bắn tia
const UNDER = [[-0.6, 0.141, 0.7], [0.6, 0.14, 0.7], [-0.6, 0.126, -1.93], [0.6, 0.126, -1.93]];
const REAR = [[-0.4, 0.575, -2.175], [-0.135, 0.575, -2.234], [0.135, 0.575, -2.234], [0.4, 0.575, -2.175]];
const SIDE = [[-0.919, 0.45, 1.75, -1], [-0.933, 0.45, -1.95, -1], [0.919, 0.45, 1.75, 1], [0.933, 0.45, -1.95, 1]];
const POD = { y: 0.935, z: -1.15, w: 0.46, len: 0.46, h: 0.17, up: 0.03, down: -0.19, elev: 37 };
export const PAINT = "#1e8f4e";   /* 5j-c: tươi hơn (thầy: "đậm quá") — cũ #0f5c34 */                                           // 5j (thầy): Roadster sơn XANH LÁ CÂY ĐẬM
const AMMO_COL = ["#ff63c3", "#2ee6c9", "#ff2020"];             // heart · boost · missile (DA_COL)
const B_EMIT = 0.11, B_HOLD = 0.07, B_FADE = 0.22;              // 1 nhịp hông
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
let glbP = null;
export function prepFlyCar() { if (!glbP) glbP = loader.loadAsync(URL_GLB); return glbP; }

// ---- khói riêng của xe: hạt mềm có cong, mỗi hạt có "vận tốc mang theo" (không bị cản) + lực cản riêng + nhịp chung
function makeSmoke(U, n = 2400) {
  const pos = new Float32Array(n * 3), vel = new Float32Array(n * 3), car = new Float32Array(n * 3), life = new Float32Array(n), max = new Float32Array(n);
  const sz = new Float32Array(n), grow = new Float32Array(n), a = new Float32Array(n), a0 = new Float32Array(n), drag = new Float32Array(n), own = new Int16Array(n), br = new Float32Array(n);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("aA", new THREE.BufferAttribute(a, 1)); g.setAttribute("aS", new THREE.BufferAttribute(sz, 1)); g.setAttribute("aB", new THREE.BufferAttribute(br, 1));
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uBend: U.uBend, uBendZ: U.uBendZ, uBendT: U.uBendT, uBendD: U.uBendD, uScale: { value: 400 } },
    vertexShader: BEND_GLSL + `uniform float uScale; attribute float aA; attribute float aS; attribute float aB; varying float vA; varying float vB;
      void main(){ vec4 w = bendW(modelMatrix * vec4(position,1.0)); vec4 mv = viewMatrix * w; gl_Position = projectionMatrix * mv;
        gl_PointSize = min(aS * uScale / max(-mv.z, 0.2), 700.0); vA = aA; vB = aB; }`,
    fragmentShader: `varying float vA; varying float vB; void main(){ vec2 p = gl_PointCoord - 0.5; float r = length(p); if (r > 0.5) discard;
      float al = smoothstep(0.5, 0.05, r) * vA; vec3 c = mix(vec3(.86,.88,.92), vec3(.84,.92,1.0), vB) * (0.6 + 0.5 * vB); gl_FragColor = vec4(c, al); }`
  });
  const mesh = new THREE.Points(g, m); mesh.frustumCulled = false; mesh.renderOrder = 6;
  for (let i = 0; i < n; i++) pos[i * 3 + 1] = -999;
  const NB = 32, bEnv = new Float32Array(NB), bT = new Float32Array(NB), bLive = new Uint8Array(NB), bS = new Float32Array(NB).fill(1);   /* 5j-d: bS = hệ số thời gian nhịp */ let bNext = 0, k = 0;
  return {
    mesh,
    burst(k = 1) { const b = bNext; bNext = (bNext + 1) % NB; bT[b] = 0; bEnv[b] = 1; bLive[b] = 1; bS[b] = k; return b; },
    // p: điểm phát · v: vận tốc riêng (bị cản) · c: vận tốc mang theo (KHÔNG bị cản, vd = vận tốc xe) · ownB: số nhịp (-1 = tự do)
    emit(p, v, c, life0, size, alpha, gr, dr, ownB = -1, bright = 0) {
      const i = k = (k + 1) % n;
      pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z; vel[i * 3] = v.x; vel[i * 3 + 1] = v.y; vel[i * 3 + 2] = v.z;
      car[i * 3] = c ? c.x : 0; car[i * 3 + 1] = c ? c.y : 0; car[i * 3 + 2] = c ? c.z : 0;
      life[i] = max[i] = life0; sz[i] = size; a0[i] = alpha; a[i] = 0; grow[i] = gr; drag[i] = dr; own[i] = ownB; br[i] = bright;
    },
    update(dt) {
      for (let b = 0; b < NB; b++) if (bLive[b]) { bT[b] += dt / bS[b]; const t = bT[b] - B_EMIT - B_HOLD; bEnv[b] = t <= 0 ? 1 : Math.max(0, 1 - t / B_FADE); if (bEnv[b] <= 0) bLive[b] = 0; }
      for (let i = 0; i < n; i++) {
        if (life[i] <= 0) { a[i] = 0; continue; }
        life[i] -= dt; const age = max[i] - life[i], kk = 1 - life[i] / max[i];
        const fd = (1 - Math.exp(-drag[i] * dt)) / drag[i], e = Math.exp(-drag[i] * dt);
        for (let j = 0; j < 3; j++) { pos[i * 3 + j] += vel[i * 3 + j] * fd + car[i * 3 + j] * dt; vel[i * 3 + j] *= e; }
        if (pos[i * 3 + 1] < 0.12) { pos[i * 3 + 1] = 0.12;
          if (vel[i * 3 + 1] < -0.5) { const sp = Math.abs(vel[i * 3 + 1]) * 0.55, an = Math.random() * 6.283; vel[i * 3] += Math.cos(an) * sp; vel[i * 3 + 2] += Math.sin(an) * sp; car[i * 3 + 1] = 0; grow[i] = Math.max(grow[i], 1.6); }
          vel[i * 3 + 1] = Math.abs(vel[i * 3 + 1]) * 0.08; }
        sz[i] += dt * grow[i];
        if (own[i] >= 0) { const b = own[i]; a[i] = Math.min(1, age * 40) * a0[i] * bEnv[b]; if (!bLive[b]) { life[i] = 0; a[i] = 0; } }
        else a[i] = a0[i] * Math.min(1, age * 25) * (1 - kk);
      }
      g.attributes.position.needsUpdate = g.attributes.aA.needsUpdate = g.attributes.aS.needsUpdate = g.attributes.aB.needsUpdate = true;
    },
    setScale(px) { m.uniforms.uScale.value = px; },
    clear() { life.fill(0); a.fill(0); for (let i = 0; i < n; i++) pos[i * 3 + 1] = -999; bLive.fill(0); },
    dispose() { g.dispose(); m.dispose(); }
  };
}

export function createFlyCar({ bend, U }) {
  const B = m => { const x = bend(m); return x; };
  const mats = [];
  const MM = m => { mats.push(m); return B(m); };
  const M = {
    pipe: MM(new THREE.MeshStandardMaterial({ color: 0x1c1d20, metalness: 0.85, roughness: 0.3, side: THREE.DoubleSide })),
    hole: MM(new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide })),
    bronze: MM(new THREE.MeshStandardMaterial({ color: 0xb07a45, metalness: 1, roughness: 0.3 })),
    gun: MM(new THREE.MeshStandardMaterial({ color: 0x1b1e23, metalness: 0.85, roughness: 0.32 })),
    face: MM(new THREE.MeshStandardMaterial({ color: 0x07080a, metalness: 0.4, roughness: 0.55 })),
    steel: MM(new THREE.MeshStandardMaterial({ color: 0x9aa3ad, metalness: 1, roughness: 0.22 })),
    black: MM(new THREE.MeshStandardMaterial({ color: 0x050506, roughness: 0.6 })),
    slit: MM(new THREE.MeshStandardMaterial({ color: 0x1a0800, emissive: 0xff6a1a, emissiveIntensity: 0.4 })),
    under: MM(new THREE.MeshStandardMaterial({ color: 0x200500, emissive: 0xff3b1f, emissiveIntensity: 0 })),
  };
  const obj = new THREE.Group(); obj.name = "flycar";             // gốc: giữa xe, mặt đất, mũi −Z
  const inn = new THREE.Group(); inn.rotation.y = Math.PI; obj.add(inn);   // bên trong: hệ đo của mẫu 3 (mũi +z)
  const smoke = makeSmoke(U);
  const Z = new THREE.Vector3(0, 0, 1);
  const nozzle = (R, len, embed) => {
    const g = new THREE.Group(), L = len + embed;
    const o = new THREE.Mesh(new THREE.CylinderGeometry(R, R * 1.06, L, 20, 1, true), M.pipe); o.rotation.x = Math.PI / 2; o.position.z = len - L / 2;
    const i = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.82, R * 0.82, L, 20, 1, true), M.hole); i.rotation.x = Math.PI / 2; i.position.z = len - L / 2;
    const lip = new THREE.Mesh(new THREE.RingGeometry(R * 0.82, R, 20), M.bronze); lip.position.z = len;
    const cap = new THREE.Mesh(new THREE.CircleGeometry(R * 0.82, 20), M.hole); cap.position.z = len * 0.25;
    g.add(o, i, lip, cap); return g;
  };
  const parts = { under: [], rear: [], side: [], wheels: [], tubes: [], tubeLed: [], paint: [], pod: null };
  // ---- ống + bệ (dựng ngay, không cần chờ mẫu)
  for (const [x, y, z] of UNDER) { const g = nozzle(0.026, 0.03, 0.04); g.position.set(x, y, z); g.quaternion.setFromUnitVectors(Z, new THREE.Vector3(0, -1, 0)); inn.add(g); parts.under.push(g); }
  for (const [x, y, z] of REAR) { const g = nozzle(0.033, 0.045, 0.08); g.position.set(x, y, z); g.quaternion.setFromUnitVectors(Z, new THREE.Vector3(0, 0, -1)); inn.add(g); parts.rear.push(g); }
  // 5j-d: LỬA ống đuôi (thầy: "đuôi xe đẩy lửa tăng tốc") — nón cộng sáng, chỉ hiện khi st.flame > 0
  const flM = MM(new THREE.MeshBasicMaterial({ color: 0xff7a2a, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false })),
    flC = MM(new THREE.MeshBasicMaterial({ color: 0xffe2a8, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })),
    flG = new THREE.ConeGeometry(1, 1, 14, 1, true).rotateX(Math.PI / 2).translate(0, 0, 0.5);
  parts.flames = parts.rear.map(g => { const o = new THREE.Mesh(flG, flM), c = new THREE.Mesh(flG, flC); o.position.z = c.position.z = 0.045; o.visible = c.visible = false; o.renderOrder = c.renderOrder = 7; g.add(o, c); return { o, c }; });
  for (const [x, y, z, s] of SIDE) { const g = nozzle(0.022, 0.03, 0.06); g.position.set(x, y, z); g.quaternion.setFromUnitVectors(Z, new THREE.Vector3(s, 0, 0)); inn.add(g); parts.side.push({ g, s, z, emit: 0, b: -1, next: Math.random() }); }
  // đèn đỏ gầm (mảnh)
  for (const sx of [-1, 1]) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.008, 2.2), M.under); m.position.set(sx * 0.62, 0.118, -0.15); inn.add(m); }
  // bệ tên lửa dáng nêm
  {
    const mount = new THREE.Group(); mount.position.set(0, POD.y, POD.z); inn.add(mount);
    const lift = new THREE.Group(); mount.add(lift);
    const L = POD.len, H = POD.h, fz = L * 0.42, er = POD.elev * Math.PI / 180;
    const topF = [fz - Math.sin(er) * H * 1.05, H];
    const prof = new THREE.Shape(); prof.moveTo(-L * 0.55, 0); prof.lineTo(fz, 0); prof.lineTo(topF[0], topF[1]); prof.lineTo(-L * 0.3, H * 0.8); prof.lineTo(-L * 0.55, H * 0.32); prof.closePath();
    const bodyG = new THREE.ExtrudeGeometry(prof, { depth: POD.w - 0.03, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2 });
    bodyG.rotateY(-Math.PI / 2); bodyG.translate((POD.w - 0.03) / 2, 0, 0);
    lift.add(new THREE.Mesh(bodyG, M.gun));
    const nrm = new THREE.Vector3(0, Math.sin(er), Math.cos(er)), faceC = new THREE.Vector3(0, H * 0.5, (fz + topF[0]) / 2);
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(POD.w * 0.8, H * 0.9), M.face); plate.position.copy(faceC).addScaledVector(nrm, 0.004); plate.quaternion.setFromUnitVectors(Z, nrm); lift.add(plate);
    [-0.13, 0, 0.13].forEach((tx, k) => {
      // nòng trái (+x hệ trong = bên PHẢI xe sau khi xoay π) ⇒ xếp theo người lái nhìn về trước: k 0 = trái xe (HEART)
      const t = nozzle(0.03, 0.03, 0.14); t.position.copy(faceC).add(new THREE.Vector3(-tx, 0, 0)).addScaledVector(nrm, 0.004); t.quaternion.setFromUnitVectors(Z, nrm); lift.add(t);
      const ledM = MM(new THREE.MeshStandardMaterial({ color: 0x111111, emissive: new THREE.Color(AMMO_COL[k]), emissiveIntensity: 0.2 }));
      const led = new THREE.Mesh(new THREE.TorusGeometry(0.034, 0.005, 6, 24), ledM); led.position.copy(t.position).addScaledVector(nrm, 0.031); led.quaternion.copy(t.quaternion); lift.add(led);
      parts.tubes.push(t); parts.tubeLed.push(ledM);
    });
    for (const sx of [-1, 1]) {
      const slit = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.008, L * 0.62), M.slit); slit.position.set(sx * (POD.w / 2 + 0.003), H * 0.42, -L * 0.02); slit.rotation.x = -0.12; lift.add(slit);
      const a0 = new THREE.Vector3(sx * (POD.w / 2 - 0.012), H * 0.8 + 0.003, -L * 0.3), a1 = new THREE.Vector3(sx * (POD.w / 2 - 0.012), H + 0.003, topF[0]);
      const trim = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.005, a0.distanceTo(a1)), M.bronze); trim.position.copy(a0).add(a1).multiplyScalar(0.5); trim.quaternion.setFromUnitVectors(Z, a1.clone().sub(a0).normalize()); lift.add(trim);
    }
    // chữ A đồng mảnh trên nóc (đọc từ sau xe)
    const sh = new THREE.Shape(), W = 0.12, Hh = 0.11, t = 0.017;
    sh.moveTo(-W / 2, 0); sh.lineTo(-W / 2 + t * 1.15, 0); sh.lineTo(-W * 0.19, Hh * 0.3); sh.lineTo(W * 0.19, Hh * 0.3); sh.lineTo(W / 2 - t * 1.15, 0); sh.lineTo(W / 2, 0); sh.lineTo(t * 0.55, Hh); sh.lineTo(-t * 0.55, Hh); sh.closePath();
    const hole = new THREE.Path(); hole.moveTo(-W * 0.12, Hh * 0.43); hole.lineTo(W * 0.12, Hh * 0.43); hole.lineTo(0, Hh * 0.74); hole.closePath(); sh.holes.push(hole);
    const aG = new THREE.ExtrudeGeometry(sh, { depth: 0.006, bevelEnabled: false }); aG.translate(0, -Hh / 2, 0);
    const aM = MM(new THREE.MeshStandardMaterial({ color: 0xc8925a, metalness: 1, roughness: 0.22, emissive: 0xff7a2a, emissiveIntensity: 0.2 }));
    const topA = new THREE.Vector3(0, H * 0.8, -L * 0.3), topB = new THREE.Vector3(0, topF[1], topF[0]), dir = topB.clone().sub(topA).normalize(), up = new THREE.Vector3(0, dir.z, -dir.y);
    const A = new THREE.Mesh(aG, aM); A.position.copy(topA).add(topB).multiplyScalar(0.5).addScaledVector(up, 0.006);
    A.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(-1, 0, 0), dir, up)); lift.add(A);
    lift.position.y = POD.down; parts.pod = { lift, aM };
  }
  // biển ANDREW TEAM
  {
    const c = document.createElement("canvas"); c.width = 512; c.height = 128; const g = c.getContext("2d");
    g.fillStyle = "#f2f3f0"; g.fillRect(0, 0, 512, 128); g.strokeStyle = "#1b1d22"; g.lineWidth = 6; g.strokeRect(10, 10, 492, 108);
    g.fillStyle = "#16181d"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = "900 58px 'Exo 2', Arial Black, sans-serif"; g.fillText("ANDREW TEAM", 256, 68, 460);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.105), MM(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4 })));
    pl.position.set(0, 0.4, -2.259); pl.rotation.y = Math.PI; inn.add(pl);
  }
  obj.traverse(o => { o.frustumCulled = false; });
  let ready = false, base = null, loading = null, paint = PAINT, tintCol = null; const tubeSm = [0, 0, 0];
  return {
    obj, smoke, M: { L: FLYCAR.L, W: FLYCAR.W }, parts, get ready() { return ready; },
    load() {
      if (loading) return loading;
      return loading = (async () => {
      const gl = await prepFlyCar();
      base = gl.scene.clone(true); base.scale.setScalar(SC); inn.add(base); inn.updateMatrixWorld(true);
      const own = new Map();
      base.traverse(o => {
        if (!o.isMesh) return; o.frustumCulled = false;
        if (/Plate/i.test(o.name)) { o.visible = false; return; }   // 5j-e: bỏ hẳn biển gốc của mẫu (chỉ còn biển ANDREW TEAM)
        o.material = (Array.isArray(o.material) ? o.material : [o.material]).map(m => { if (!own.has(m)) { const c = m.clone(); if (/Window/i.test(c.name)) { c.transparent = true; c.depthWrite = false; } own.set(m, B(c)); mats.push(c); if (/Paint/i.test(c.name)) { if (c.map) c.map = null; c.color.set(paint); c.metalness = 0.45; c.roughness = 0.26; c.needsUpdate = true; parts.paint.push({ m: c, col: c.color.clone() }); } } return own.get(m); });
        if (o.material.length === 1) o.material = o.material[0];
      });
      // 5j-f: ĐÈN HẬU — mẫu gộp đèn trước + sau 1 mảnh ⇒ tách tam giác phía đuôi ra mảnh riêng (vật liệu riêng) để PHANH sáng đỏ (hình mới, không sửa hình dùng chung)
      base.traverse(o => { if (parts.tail || !o.isMesh || Array.isArray(o.material) || !/LightA/.test(o.material.name) || !o.geometry.index) return;
        const g = o.geometry, pa = g.attributes.position, ix = g.index, keep = [], rear = [], v = new THREE.Vector3();
        for (let t = 0; t < ix.count; t += 3) { let z = 0; for (let k = 0; k < 3; k++) { v.fromBufferAttribute(pa, ix.getX(t + k)).applyMatrix4(o.matrixWorld); inn.worldToLocal(v); z += v.z / 3; } (z < -1.7 ? rear : keep).push(ix.getX(t), ix.getX(t + 1), ix.getX(t + 2)); }
        if (!rear.length) return;
        const sub = arr => { const ng = new THREE.BufferGeometry(); for (const k in g.attributes) ng.setAttribute(k, g.attributes[k]); ng.setIndex(arr); return ng; };
        o.geometry = sub(keep);
        const tm = o.material.clone(); tm.emissive = new THREE.Color("#ff1a10"); tm.emissiveMap = tm.map; tm.emissiveIntensity = 0.35; B(tm); mats.push(tm);
        const tl = new THREE.Mesh(sub(rear), tm); tl.frustumCulled = false; tl.position.copy(o.position); tl.quaternion.copy(o.quaternion); tl.scale.copy(o.scale); o.parent.add(tl); parts.tail = tm; });
      // 4 bánh: trục quay đặt đúng tâm hộp bao
      const box = new THREE.Box3(), c = new THREE.Vector3();
      // 5j-c (thầy: "bánh chạy lệch, lủng lẳng"): bánh mẫu có CAMBER 2–3° ⇒ quay quanh trục X thẳng làm vành đảo ±2 cm. Nay quay quanh TRỤC THẬT của
      //   bánh (phương ít trải nhất của các đỉnh lốp) · tâm = đỉnh lốp − bán kính (đáy lốp mẫu bị ép phẳng ⇒ tâm hộp bao lệch xuống 4–6 mm)
      for (const key of ["LF", "RF", "LB", "RB"]) {
        const w = base.getObjectByName("Wheel_" + key); if (!w) continue;
        let big = null; w.traverse(o => { if (o.isMesh && (!big || o.geometry.attributes.position.count > big.geometry.attributes.position.count)) big = o; }); if (!big) continue;
        const pa = big.geometry.attributes.position, P = [], v = new THREE.Vector3(), mu = new THREE.Vector3(), cv = [0, 0, 0, 0, 0, 0];
        for (let i = 0; i < pa.count; i++) { v.fromBufferAttribute(pa, i).applyMatrix4(big.matrixWorld); inn.worldToLocal(v); P.push(v.clone()); mu.add(v); }
        mu.divideScalar(P.length);
        for (const q of P) { const a = q.x - mu.x, b = q.y - mu.y, e = q.z - mu.z; cv[0] += a * a; cv[1] += a * b; cv[2] += a * e; cv[3] += b * b; cv[4] += b * e; cv[5] += e * e; }
        const inv = new THREE.Matrix3().set(cv[0], cv[1], cv[2], cv[1], cv[3], cv[4], cv[2], cv[4], cv[5]).invert(), ax = new THREE.Vector3(1, 0, 0);
        for (let k = 0; k < 40; k++) ax.applyMatrix3(inv).normalize();
        if (ax.x < 0) ax.negate();
        box.setFromPoints(P); const R = (box.max.z - box.min.z) / 2;
        c.set((box.min.x + box.max.x) / 2, box.max.y - R, (box.min.z + box.max.z) / 2);
        const piv = new THREE.Group(); piv.position.copy(c); piv.userData.ax = ax; inn.add(piv); piv.attach(w); parts.wheels.push(piv);
      }
      obj.traverse(o => { o.frustumCulled = false; });
      ready = true; return this;
      })();   // gọi 2 lần (xưởng + game) ⇒ chỉ nạp 1 lần
    },
    setTint(col) {   // 2 drone: sơn màu đội (null = màu gốc)
      tintCol = col || null;
      parts.paint.forEach(p => { if (col) p.m.color.copy(p.col).lerp(new THREE.Color(col).multiplyScalar(2.2), 0.8); else p.m.color.copy(p.col); });
    },
    setPaint(col) {   // 5j-c: màu sơn gốc thầy chọn trong Settings (bảng màu)
      paint = /^#[0-9a-f]{6}$/i.test(col || "") ? col : PAINT;
      parts.paint.forEach(p => p.col.set(paint)); this.setTint(tintCol);
    },
    stealth(on) {     // 5j-c: XƯỞNG — xe đứng sàn như xe thường, giấu ống phụt + bệ tên lửa (chưa lộ là xe bay)
      [...parts.under, ...parts.rear].forEach(g => { g.visible = !on; }); parts.side.forEach(j => { j.g.visible = !on; });
      if (parts.pod) parts.pod.lift.visible = !on;
    },
    // điểm + hướng miệng nòng k (0 HEART · 1 BOOST · 2 MISSILE) trong hệ THẾ GIỚI
    puffTube(k) { if (parts.tubes[k]) tubeSm[k] = 1; },   // 5j-e: vừa bắn ⇒ miệng nòng còn vương khói ~1,4 s
    muzzle(k, pos, dir) { const t = parts.tubes[k]; obj.updateMatrixWorld(true); t.localToWorld(pos.set(0, 0, 0.04)); dir.set(0, 0, 1).transformDirection(t.matrixWorld); return pos; },
    update(dt, st) {
      const P = new THREE.Vector3(), V = new THREE.Vector3(), C = new THREE.Vector3(), q = obj.getWorldQuaternion(new THREE.Quaternion());
      obj.updateMatrixWorld(true);
      const carry = st.carry || new THREE.Vector3();
      // bánh
      parts.wheels.forEach(w => { w.rotateOnAxis(w.userData.ax, st.spin || 0); });   // 5j-c: quanh trục thật của bánh
      // bệ
      parts.pod.lift.position.y = POD.down + (POD.up - POD.down) * THREE.MathUtils.smoothstep(st.pod || 0, 0, 1);
      parts.pod.aM.emissiveIntensity = 0.15 + 0.5 * (st.pod || 0); M.slit.emissiveIntensity = 0.3 + 1.4 * (st.pod || 0);
      parts.tubeLed.forEach((m, k) => { m.emissiveIntensity = (st.pod || 0) * (k === st.sel ? 2.4 : 0.15); });
      M.under.emissiveIntensity = (st.lift || 0) * 3;
      if (parts.tail) parts.tail.emissiveIntensity = 0.35 + 3.4 * (st.brake || 0);   // 5j-f: đèn phanh
      // ống gầm: khói trắng mờ phụt xuống, đi theo xe 90 %, cột tan sau ~3 m
      const lift = st.lift || 0;
      if (lift > 0.05) for (const g of parts.under) {
        const n = Math.floor(lift * 110 * dt + Math.random());
        for (let k = 0; k < n; k++) {
          g.localToWorld(P.set((Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.02, 0.04));
          V.set((Math.random() - 0.5) * 0.8, -(10 + Math.random() * 4), (Math.random() - 0.5) * 0.8).applyQuaternion(q);
          smoke.emit(P, V, C.copy(carry).multiplyScalar(0.9), 0.32 + Math.random() * 0.2, 0.22 + Math.random() * 0.15, 0.5, 2.4, 1.3, -1, 0);
        }
      }
      // khói tràn mặt đường dưới gầm: st.ground 0..1 (xe sát đất + đang đẩy) — bung ra vòng quanh xe, ở lại trên đường
      const gr = st.ground || 0;
      if (gr > 0.03) { const n = Math.floor(gr * 110 * dt + Math.random());
        for (let k = 0; k < n; k++) {
          inn.localToWorld(P.set((Math.random() - 0.5) * 1.4, 0, (Math.random() - 0.5) * 3.2)); P.y = 0.18;
          const an = Math.random() * 6.283, sp = 3 + Math.random() * 6; V.set(Math.cos(an) * sp, 0.4 + Math.random() * 0.9, Math.sin(an) * sp);
          smoke.emit(P, V, C.copy(carry).multiplyScalar(0.45).setY(0), 1.1 + Math.random() * 1.0, 0.4 + Math.random() * 0.35, 0.26, 1.5, 1.5, -1, 0);
        } }
      // 5j-e: khói còn vương ở miệng nòng sau khi phóng (chùm đầu dày, sau mỏng dần, bám theo xe một chút rồi tụt lại)
      tubeSm.forEach((v, k) => { if (v <= 0) return; const t = parts.tubes[k]; if (!t) return; const n = Math.floor((v > 0.92 ? 260 : 26 * v) * dt + Math.random() * v);
        if (n) { t.localToWorld(P.set(0, 0, 0.03)); const dv = new THREE.Vector3(0, 0, 1).transformDirection(t.matrixWorld);
          for (let q = 0; q < n; q++) { V.copy(dv).multiplyScalar(0.3 + Math.random() * (v > 0.92 ? 2.5 : 0.6)); V.x += (Math.random() - 0.5) * 0.4; V.y += Math.random() * 0.35; V.z += (Math.random() - 0.5) * 0.4;
            smoke.emit(P, V, C.copy(carry).multiplyScalar(0.8), 0.7 + Math.random() * 0.6, 0.05 + Math.random() * 0.05, 0.4 * Math.min(1, v + 0.3), 0.7, 1.8, -1, 0.1); } }
        tubeSm[k] = Math.max(0, v - dt / 1.4); });
      // 5j-d: lửa đuôi
      const fl = st.flame || 0;
      parts.flames.forEach(f => { const on = fl > 0.02; f.o.visible = f.c.visible = on; if (on) { const L = (0.22 + 0.6 * fl) * (0.82 + Math.random() * 0.36); f.o.scale.set(0.034, 0.034, L); f.c.scale.set(0.018, 0.018, L * 0.55); } });
      // 5j-d: BẬT THRUST GIỮA KHÔNG TRUNG — 4 ống gầm nổ bung một lượt khói thật nhiều (st.blast) · st.swirl = khói XOÁY quanh trục dọc xe (đang lộn)
      const bl = st.blast || 0;
      if (bl > 0) {
        const dn = new THREE.Vector3(0, -1, 0).applyQuaternion(q), fw = new THREE.Vector3(0, 0, -1).applyQuaternion(q), ctr = obj.getWorldPosition(new THREE.Vector3()), rad = new THREE.Vector3(), tg = new THREE.Vector3();
        for (let k = 0, n = Math.round(300 * bl); k < n; k++) {
          parts.under[k % parts.under.length].localToWorld(P.set((Math.random() - 0.5) * 0.04, (Math.random() - 0.5) * 0.04, 0.05));
          const an = Math.random() * 6.283; rad.set(Math.cos(an), 0, Math.sin(an));
          V.copy(dn).multiplyScalar(8 + Math.random() * 18).addScaledVector(rad, 2 + Math.random() * 8 * bl);
          if (st.swirl) { tg.subVectors(P, ctr).cross(fw); if (tg.lengthSq() > 1e-6) V.addScaledVector(tg.normalize(), -st.swirl * (5 + Math.random() * 9)); }
          smoke.emit(P, V, C.copy(carry).multiplyScalar(0.45), 1.3 + Math.random() * 1.5, 0.3 + Math.random() * 0.5, 0.5, 2.5, 1.7, -1, 0.35);
        }
        for (let k = 0, n = Math.round(80 * bl); k < n; k++) { const g = parts.rear[k % parts.rear.length]; g.localToWorld(P.set(0, 0, 0.06));
          V.set((Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3, 6 + Math.random() * 10).applyQuaternion(q); smoke.emit(P, V, C.copy(carry).multiplyScalar(0.4), 0.9 + Math.random() * 0.8, 0.2 + Math.random() * 0.25, 0.55, 2, 1.6, -1, 0.3); }
      }
      // ống đuôi
      const rear = st.rear || 0;
      if (rear > 0.03) for (const g of parts.rear) {
        const n = Math.floor(rear * (rear > 0.3 ? 120 : 45) * dt + Math.random() * rear);
        for (let k = 0; k < n; k++) {
          g.localToWorld(P.set(0, 0, 0.06));
          V.set((Math.random() - 0.5) * 0.5, (Math.random() - 0.2) * 0.35, 1.5 + rear * 9 + Math.random() * 2).applyQuaternion(q);   // +z cục bộ nhóm in = ra sau xe
          smoke.emit(P, V, C.copy(carry).multiplyScalar(0.6), 0.6 + Math.random() * 0.5, 0.07 + rear * 0.08, 0.6, 0.9, 1.4, -1, 0.15);
        }
      }
      // ống hông: bộ điều khiển chọn đúng 1 ống (giữ cân) hoặc dồn bên cần đẩy (đang dạt / lái)
      const sd = st.side || { want: 0 };
      let active = parts.side.find(j => j.emit > 0);
      parts.side.forEach(j => { j.emit = Math.max(0, j.emit - dt); j.next -= dt; });
      if (st.air && !active) {
        const strong = Math.abs(sd.want) > 0.35;
        const due = parts.side.reduce((m, j) => Math.min(m, j.next), 9) <= 0 || strong;
        if (due) {
          // hướng phun (thế giới) của từng ống; muốn gia tốc +X ⇒ chọn ống phun về −X
          const want = Math.abs(sd.want) > 0.05 ? Math.sign(sd.want) : (Math.random() < 0.5 ? -1 : 1);
          const cand = parts.side.filter(j => { const d = new THREE.Vector3(j.s, 0, 0).applyQuaternion(inn.getWorldQuaternion(new THREE.Quaternion())); return Math.sign(d.x) === -want; });
          const pick = cand.length ? cand[(sd.yaw || 0) > 0 ? 0 : cand.length - 1] : null;
          if (pick) { pick.k = strong ? 1 : 0.5; pick.b = smoke.burst(pick.k); pick.emit = B_EMIT * pick.k; active = pick; }   // 5j-d: giữ cân ⇒ nhịp chỉ 1/2 thời gian
          parts.side.forEach(j => { j.next = strong ? 0.08 + Math.random() * 0.1 : (st.still ? 0.9 + Math.random() * 1.8 : 0.35 + Math.random() * 1.0); });   // đứng yên ⇒ phụt THƯA
        }
      }
      if (active) {
        const kk = active.k || 1, n = Math.floor((kk < 1 ? 450 : 900) * dt + Math.random());   // 5j-d: giữ cân ⇒ ít hơn
        const qi = inn.getWorldQuaternion(new THREE.Quaternion());
        for (let k = 0; k < n; k++) {
          active.g.localToWorld(P.set(0, 0, 0.04));
          V.set(active.s, 0, 0).multiplyScalar(2 + Math.random() * (kk < 1 ? 12 : 26));   // giữ cân ⇒ dải NGẮN hơn
          const vv = V.length(), g1 = Math.random() + Math.random() + Math.random() - 1.5, g2 = Math.random() + Math.random() + Math.random() - 1.5;
          V.y += g1 * vv * 0.077 + vv * 0.025; V.z += g2 * vv * 0.077; V.applyQuaternion(qi);
          smoke.emit(P, V, carry, 9, kk < 1 ? 0.03 : 0.035, kk < 1 ? 0.26 : 0.42, (0.6 + Math.random() * 0.8) * 0.7, 13, active.b, 1);   // giữ cân ⇒ MỜ hơn   // 5j: nhỏ 30 %, mờ hơn · carry có cả vận tốc LÊN / XUỐNG ⇒ dải khói không méo
        }
      }
      smoke.update(dt);
    },
    dispose() { mats.forEach(m => m.dispose()); smoke.dispose(); }
  };
}
