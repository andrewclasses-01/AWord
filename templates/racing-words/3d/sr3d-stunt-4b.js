// RACING WORDS mẫu 4b (16/10/2026) — đợt 3/5 (hồ sơ mục 36):
//   · createTwists — DỐC XOẮN ở mép đường (thầy: "ramp kiểu xoắn ở 2 bên mép đường để xe lao lên và xoay theo trục dọc"): mép trong nằm sát mặt đường,
//     mép ngoài nâng dần + mặt dốc VẶN dần quanh trục dọc tới TWIST.ROLL ⇒ xe chạy lên bị nghiêng dần theo mặt dốc, rời mép là lộn BARREL ROLL về phía
//     lòng đường. Mỗi dốc = vài tấm dùng chung vật liệu (vẽ trước khi vào trận ⇒ shader dịch sẵn).
//   · createPickups — PHẦN THƯỞNG trên đường cho 2 xe tranh nhau: BOOST (tia sét) · LIFE (trái tim) · MISSILE (quả tên lửa); vị trí TẤT ĐỊNH theo
//     số thứ tự (như cây), ăn rồi thì biến mất cho cả 2 xe. 3 InstancedMesh + 1 vòng sáng chung ⇒ 4 lệnh vẽ / máy quay.
import * as THREE from "../../rocket-race/vendor/three/three.module.min.js";

export const TWIST = { LEN: 14, W: 3.8, ROLL: 0.66 };            // dài 14 m, rộng 3,8 m, mặt vặn tới ~38° ở cuối
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const canvas = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; };
const hash = n => { let x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

/** góc vặn (rad, ≥ 0) tại u m tính từ chân dốc */
export const twistAngle = u => TWIST.ROLL * Math.pow(clamp(u / TWIST.LEN, 0, 1), 1.35);

function twistTex() {
  const [c, g] = canvas(256, 512);
  g.fillStyle = "#17191e"; g.fillRect(0, 0, 256, 512);
  for (let y = -256; y < 512; y += 64) { g.fillStyle = "#f5c518"; g.beginPath(); g.moveTo(0, y + 64); g.lineTo(128, y); g.lineTo(256, y + 64); g.lineTo(256, y + 92); g.lineTo(128, y + 28); g.lineTo(0, y + 92); g.closePath(); g.fill(); }
  g.fillStyle = "#e5262b"; g.fillRect(232, 0, 24, 512);                                   // mép ngoài đỏ
  g.fillStyle = "#f1efe8"; for (let y = 0; y < 512; y += 64) g.fillRect(232, y, 24, 32);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
}

export function createTwists({ scene, bend }) {
  const grp = new THREE.Group(); scene.add(grp);
  const tex = twistTex();
  const topM = bend(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, metalness: 0.1, emissive: new THREE.Color("#ffd23f"), emissiveIntensity: 0.12, emissiveMap: tex, side: THREE.DoubleSide }));
  const sideM = bend(new THREE.MeshStandardMaterial({ color: "#3a3f48", roughness: 0.55, metalness: 0.6, side: THREE.DoubleSide }));
  const geos = [];
  // mặt dốc vặn: lưới NU × NV; mép trong (v = 0) nằm trên đường, mép ngoài (v = 1) nâng theo góc vặn · side +1 = mép PHẢI đường
  function build(side) {
    const NU = 18, NV = 4, L = TWIST.LEN, W = TWIST.W, pos = [], uv = [], idx = [], wall = [], wIdx = [];
    for (let i = 0; i <= NU; i++) {
      const u = i / NU * L, th = twistAngle(u);
      for (let j = 0; j <= NV; j++) { const v = j / NV; pos.push(side * v * W * Math.cos(th), 0.02 + v * W * Math.sin(th), -u); uv.push(side > 0 ? v : 1 - v, u / 4); }
      const ox = side * W * Math.cos(th), oy = 0.02 + W * Math.sin(th);
      wall.push(ox, oy, -u, ox, 0, -u);                                                                       // vách ngoài: từ mép ngoài xuống đất
    }
    for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) { const a = i * (NV + 1) + j, b = a + NV + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    for (let i = 0; i < NU; i++) { const a = i * 2; wIdx.push(a, a + 2, a + 1, a + 2, a + 3, a + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const w = new THREE.BufferGeometry(); w.setAttribute("position", new THREE.Float32BufferAttribute(wall, 3)); w.setIndex(wIdx); w.computeVertexNormals();
    // mặt cuối (tam giác: chân trong, mép ngoài trên, mép ngoài dưới)
    const thE = twistAngle(L), e = new THREE.BufferGeometry(); e.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, -L, side * W * Math.cos(thE), 0.02 + W * Math.sin(thE), -L, side * W * Math.cos(thE), 0, -L], 3)); e.computeVertexNormals();
    geos.push(g, w, e);
    const m = new THREE.Group(); m.add(new THREE.Mesh(g, topM), new THREE.Mesh(w, sideM), new THREE.Mesh(e, sideM));
    m.children.forEach(x => { x.frustumCulled = false; });
    return m;
  }
  let list = [];
  return {
    get list() { return list; },
    /** arr: [{ s, side }] — mép trong ở x = side · (ROADX − W), mép ngoài sát rào */
    set(arr, roadX) {
      grp.clear(); geos.splice(0).forEach(x => x.dispose());
      list = arr.map(r => ({ ...r, xIn: r.side * (roadX - 0.1 - TWIST.W) }));
      list.forEach(r => { const g = build(r.side); g.position.set(r.xIn, 0, -r.s); grp.add(g); });
    },
    /** xe tâm (x, s) đang trên dốc xoắn nào? ⇒ { r, u, w (m từ mép trong ra), th } */
    find(x, s) {
      for (const r of list) { const u = s - r.s; if (u < 0 || u > TWIST.LEN) continue; const w = (x - r.xIn) * r.side; if (w < 0.15 || w > TWIST.W) continue; return { r, u, w, th: twistAngle(u) }; }
      return null;
    },
    dispose() { scene.remove(grp); geos.forEach(x => x.dispose()); topM.dispose(); sideM.dispose(); tex.dispose(); }
  };
}

// ---------------- phần thưởng ----------------
export const PICK = { GAP: 190, START: 240, R: 1.7 };
const KINDS = ["boost", "life", "missile"];
function shapeGeo(sh, depth) { const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 1, steps: 1 }); g.center(); return g; }
function boltGeo() { const s = new THREE.Shape(); [[0.15, 0.62], [-0.32, -0.02], [-0.02, -0.02], [-0.18, -0.62], [0.34, 0.08], [0.04, 0.08], [0.15, 0.62]].forEach(([x, y], k) => k ? s.lineTo(x, y) : s.moveTo(x, y)); return shapeGeo(s, 0.22); }
function heartGeo() { const s = new THREE.Shape(); s.moveTo(0, -0.5); s.bezierCurveTo(-0.55, -0.1, -0.62, 0.38, -0.3, 0.48); s.bezierCurveTo(-0.12, 0.54, 0, 0.42, 0, 0.3); s.bezierCurveTo(0, 0.42, 0.12, 0.54, 0.3, 0.48); s.bezierCurveTo(0.62, 0.38, 0.55, -0.1, 0, -0.5); return shapeGeo(s, 0.24); }
function rocketGeo() {
  const parts = [new THREE.CylinderGeometry(0.13, 0.13, 0.72, 10).translate(0, 0, 0), new THREE.ConeGeometry(0.13, 0.32, 10).translate(0, 0.52, 0)];
  for (let k = 0; k < 4; k++) parts.push(new THREE.BoxGeometry(0.02, 0.24, 0.2).translate(0, -0.3, 0.17).rotateY(k * Math.PI / 2));
  const col = (g, c) => { const n = g.attributes.position.count, a = new Float32Array(n * 3), cc = new THREE.Color(c); for (let i = 0; i < n; i++) a.set([cc.r, cc.g, cc.b], i * 3); g.setAttribute("color", new THREE.BufferAttribute(a, 3)); };
  col(parts[0], "#f2f2f2"); col(parts[1], "#ff3b30"); parts.slice(2).forEach(p => col(p, "#ff3b30"));
  const list = parts.map(g => g.index ? g.toNonIndexed() : g), out = new THREE.BufferGeometry();
  ["position", "normal", "color"].forEach(nm => { const sz = list[0].attributes[nm].itemSize, arr = new Float32Array(list.reduce((a, g) => a + g.attributes[nm].count * sz, 0)); let o = 0; list.forEach(g => { arr.set(g.attributes[nm].array, o); o += g.attributes[nm].array.length; }); out.setAttribute(nm, new THREE.BufferAttribute(arr, sz)); });
  parts.forEach(g => g.dispose()); return out.rotateZ(-0.6);
}

export function createPickups({ scene, bend }) {
  const N = 10;
  const mk = (geo, mat) => { const m = new THREE.InstancedMesh(geo, bend(mat), N); m.frustumCulled = false; m.count = 0; scene.add(m); return m; };
  const meshes = {
    boost: mk(boltGeo(), new THREE.MeshStandardMaterial({ color: "#ffe14a", emissive: new THREE.Color("#ffb300"), emissiveIntensity: 1.6, roughness: 0.35, metalness: 0.2 })),
    life: mk(heartGeo(), new THREE.MeshStandardMaterial({ color: "#ff3355", emissive: new THREE.Color("#ff1040"), emissiveIntensity: 1.4, roughness: 0.35, metalness: 0.2 })),
    missile: mk(rocketGeo(), new THREE.MeshStandardMaterial({ vertexColors: true, emissive: new THREE.Color("#ff5a3c"), emissiveIntensity: 0.5, roughness: 0.4, metalness: 0.3 })),
  };
  const RCOL = { boost: new THREE.Color("#ffc21a"), life: new THREE.Color("#ff2d55"), missile: new THREE.Color("#ff6a3c") };
  const ringM = bend(new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.75, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  const ring = new THREE.InstancedMesh(new THREE.RingGeometry(0.85, 1.25, 28).rotateX(-Math.PI / 2), ringM, N * 3);
  ring.frustumCulled = false; ring.count = 0; ring.renderOrder = 1; ring.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(N * 3 * 3).fill(1), 3); scene.add(ring);
  let kinds = [...KINDS], avoid = () => false;
  const taken = new Set();
  const item = k => { const s = PICK.START + k * PICK.GAP + (hash(k) - 0.5) * 60; if (avoid(s)) return null;
    const x = [-2.4, 0, 2.4, -1.2, 1.2][Math.floor(hash(k + 0.37) * 5)], kind = kinds.length ? kinds[Math.floor(hash(k + 0.71) * kinds.length)] : null;
    return kind ? { k, s, x, kind } : null; };
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), P = new THREE.Vector3(), S = new THREE.Vector3(1, 1, 1), E = new THREE.Euler();
  let vis = [];
  return {
    /** kinds bật (["boost","life","missile"] lọc theo Options) · avoid(s) = true ⇒ không đặt (cầu nhảy / cổng) */
    set(k, av) { kinds = k.slice(); if (av) avoid = av; taken.clear(); vis = []; },
    reset() { taken.clear(); },
    update(t, sMin, sMax) {
      const k0 = Math.max(0, Math.floor((sMin - 20 - PICK.START) / PICK.GAP)), k1 = Math.ceil((sMax + 460 - PICK.START) / PICK.GAP);
      vis = []; for (let k = k0; k <= k1; k++) { if (taken.has(k)) continue; const it = item(k); if (it && it.s > sMin - 20) vis.push(it); }
      const cnt = { boost: 0, life: 0, missile: 0 }; let nr = 0;
      vis.forEach(it => {
        const m = meshes[it.kind], n = cnt[it.kind]; if (n >= N) return;
        const bob = Math.sin(t * 2.6 + it.k) * 0.12;
        E.set(0, t * 2.2 + it.k, 0); Q.setFromEuler(E); P.set(it.x, 1.05 + bob, -it.s); S.setScalar(1.25); M4.compose(P, Q, S); m.setMatrixAt(n, M4); cnt[it.kind]++;
        Q.identity(); P.set(it.x, 0.04, -it.s); S.setScalar(1 + 0.08 * Math.sin(t * 5 + it.k)); M4.compose(P, Q, S); ring.setMatrixAt(nr, M4); ring.setColorAt(nr, RCOL[it.kind]); nr++;
      });
      Object.entries(meshes).forEach(([kd, m]) => { m.count = cnt[kd]; m.instanceMatrix.needsUpdate = true; });
      ring.count = nr; ring.instanceMatrix.needsUpdate = true; if (ring.instanceColor) ring.instanceColor.needsUpdate = true;
    },
    /** xe tâm (x, s) chạm phần thưởng nào ⇒ { kind, x, s } (đánh dấu đã ăn) */
    take(x, s) {
      for (const it of vis) { if (taken.has(it.k)) continue; if (Math.abs(it.s - s) < PICK.R && Math.abs(it.x - x) < PICK.R) { taken.add(it.k); return it; } }
      return null;
    },
    get visible() { return vis.filter(it => !taken.has(it.k)); },
    dispose() { Object.values(meshes).forEach(m => { scene.remove(m); m.geometry.dispose(); m.material.dispose(); }); scene.remove(ring); ring.geometry.dispose(); ringM.dispose(); }
  };
}
