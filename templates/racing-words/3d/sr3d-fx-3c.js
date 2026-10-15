// =============================================================
// SPEED RUN 3D — CẦU NHẢY + VỆT GIÓ + NHOÈ CHUYỂN ĐỘNG (mẫu 3c, 15/10/2026 — = sr3d-fx-3.js, BỎ 2 cột biển JUMP cạnh dốc theo thầy)
// Thầy (15/10): "thiết kế cơ chế Jump Ramp (Cầu nhảy)": lực đẩy lên + tới giữ xe trên không lâu hơn thực tế, +20 % tốc độ lúc rời mép dốc,
//   máy quay lùi rộng + hạ thấp + FOV +15–20 %, motion blur + rung màn lúc cất cánh / đáp đất, vệt gió kéo dài sau đuôi xe,
//   điều khiển nhẹ trên không, phanh trên không = xoay 360° (mỗi vòng +Nitro), đáp đất 4 bánh song song (< 15°) = Landing Boost, nghiêng/lật = mất đà.
// Mô-đun này CHỈ VẼ: dốc (createRamps), vệt gió (createTrails), pass nhoè hướng tâm 2 nửa màn (RadialBlurShader).
// Luật bay / đáp đất nằm ở lõi sr3d-3.js. Mọi vật liệu cảnh đi qua `bend` (cong thế giới).
// =============================================================
import * as THREE from "../../rocket-race/vendor/three/three.module.min.js";

export const RAMP = { LEN: 10, H: 1.7 };                 // dốc dài 10 m, mép cao 1,7 m (≈ 9,7°)
export const RAMP_SLOPE = Math.atan2(RAMP.H, RAMP.LEN);

function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; }
function chevronTex() {                                    // mặt dốc: sọc vàng–đen + mũi tên ▲ chạy lên mép + vạch trắng mép trên
  const [c, g] = canvas(256, 512);
  g.fillStyle = "#1b1d22"; g.fillRect(0, 0, 256, 512);
  g.fillStyle = "#f5c518";
  for (let k = -2; k < 9; k++) { const y = k * 64; g.beginPath(); g.moveTo(0, y + 64); g.lineTo(128, y); g.lineTo(256, y + 64); g.lineTo(256, y + 92); g.lineTo(128, y + 28); g.lineTo(0, y + 92); g.closePath(); g.fill(); }
  g.fillStyle = "#f4f4f2"; g.fillRect(0, 0, 256, 18);
  g.fillStyle = "#c8262b"; g.fillRect(0, 0, 14, 512); g.fillRect(242, 0, 14, 512);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function signTex() {
  const [c, g] = canvas(256, 128);
  g.fillStyle = "#f5c518"; g.fillRect(0, 0, 256, 128); g.fillStyle = "#111"; g.fillRect(8, 8, 240, 112);
  g.fillStyle = "#f5c518"; g.font = "italic 900 74px 'Exo 2', 'Arial Black', sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("JUMP", 128, 68);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/** createRamps({ scene, bend }) → { set([{ s, x, w }]), find(x, s) → { r, h } | null, list, dispose() } — s = quãng đường của CHÂN dốc */
export function createRamps({ scene, bend }) {
  const grp = new THREE.Group(); scene.add(grp);
  const cT = chevronTex(), sT = signTex();
  const topM = bend(new THREE.MeshStandardMaterial({ map: cT, roughness: 0.6, metalness: 0.1, emissive: new THREE.Color("#ffd23f"), emissiveIntensity: 0.12, emissiveMap: cT }));
  const sideM = bend(new THREE.MeshStandardMaterial({ color: "#3a3f48", roughness: 0.55, metalness: 0.6 }));
  const lipM = bend(new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffe27a").multiplyScalar(2.4), toneMapped: false }));
  const signM = bend(new THREE.MeshStandardMaterial({ map: sT, roughness: 0.5, emissive: new THREE.Color("#ffffff"), emissiveIntensity: 0.4, emissiveMap: sT }));
  const postM = bend(new THREE.MeshStandardMaterial({ color: "#8a9196", metalness: 0.6, roughness: 0.5 }));
  const geos = [];
  let list = [];
  function build(w) {
    const L = RAMP.LEN, H = RAMP.H, Ls = Math.hypot(L, H);
    const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(L, H); sh.lineTo(L, 0); sh.closePath();       // dáng hông: u = tới trước, v = cao
    const body = new THREE.ExtrudeGeometry(sh, { depth: w, bevelEnabled: false }).rotateY(Math.PI / 2).translate(-w / 2, 0, 0);   // u → −z, bề ngang → x
    const top = new THREE.PlaneGeometry(w, Ls).rotateX(-Math.PI / 2);
    const lip = new THREE.BoxGeometry(w, 0.1, 0.16);
    const sign = new THREE.PlaneGeometry(2.4, 1.2), post = new THREE.CylinderGeometry(0.06, 0.06, 2.2, 6);
    geos.push(body, top, lip, sign, post);
    const g = new THREE.Group();
    g.add(new THREE.Mesh(body, sideM));
    const tm = new THREE.Mesh(top, topM); tm.rotation.x = RAMP_SLOPE; tm.position.set(0, H / 2 + 0.025, -L / 2); g.add(tm);
    const lm = new THREE.Mesh(lip, lipM); lm.position.set(0, H + 0.02, -L + 0.08); g.add(lm);
    return g;
  }
  return {
    get list() { return list; },
    set(arr) {
      grp.clear(); geos.splice(0).forEach(x => x.dispose());
      list = arr.map(r => ({ ...r }));
      list.forEach(r => { const g = build(r.w); g.position.set(r.x, 0, -r.s); grp.add(g); });
    },
    /** dốc dưới tâm xe (x, s): h = độ cao mặt dốc */
    find(x, s) {
      for (const r of list) { const u = s - r.s; if (u >= 0 && u <= RAMP.LEN && Math.abs(x - r.x) <= r.w / 2) return { r, h: RAMP.H * u / RAMP.LEN }; }
      return null;
    },
    /** dốc gần nhất phía trước (cho tự lái) */
    ahead(s, maxD = 120) { let best = null; for (const r of list) { const d = r.s - s; if (d > -RAMP.LEN - 1 && d < maxD && (!best || d < best.d)) best = { r, d }; } return best; },   // còn trên dốc vẫn tính (giữ thẳng tới mép)
    dispose() { scene.remove(grp); geos.forEach(x => x.dispose()); [topM, sideM, lipM, signM, postM].forEach(m => m.dispose()); cT.dispose(); sT.dispose(); }
  };
}

/** Vệt gió sau đuôi xe: mỗi xe 2 dải (2 góc sau), mỗi dải = 2 băng chéo (đứng + nằm) để nhìn góc nào cũng thấy.
 *  push(i, pA, pB, k): thêm điểm mới (toạ độ thế giới) với độ đậm k (0 = tắt dần). */
export function createTrails({ scene, bend, n = 2, N = 34, color = "#cfe9ff" }) {
  const col = new THREE.Color(color);
  const mat = bend(new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false }));
  const cars = [];
  for (let i = 0; i < n; i++) {
    const sides = [0, 1].map(() => {
      const pts = Array.from({ length: N }, () => new THREE.Vector3()), al = new Float32Array(N);
      const pos = new Float32Array(N * 4 * 3), cl = new Float32Array(N * 4 * 4), idx = [];
      for (let k = 0; k < N - 1; k++) for (const o of [0, 2]) { const a = k * 4 + o, b = a + 1, c = a + 4, d = a + 5; idx.push(a, b, c, b, d, c); }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.BufferAttribute(cl, 4)); g.setIndex(idx);
      const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = 6; scene.add(m);
      return { pts, al, pos, cl, g, m, live: false };
    });
    cars.push(sides);
  }
  const W = 0.09;
  return {
    push(i, pA, pB, k) {
      cars[i].forEach((sd, j) => {
        const p = j ? pB : pA;
        if (!sd.live) { sd.pts.forEach(q => q.copy(p)); sd.al.fill(0); sd.live = true; }
        for (let a = sd.pts.length - 1; a > 0; a--) { sd.pts[a].copy(sd.pts[a - 1]); sd.al[a] = sd.al[a - 1]; }
        sd.pts[0].copy(p); sd.al[0] = k;
        let any = 0;
        for (let a = 0; a < sd.pts.length; a++) {
          const q = sd.pts[a], f = (1 - a / (sd.pts.length - 1)), al = sd.al[a] * f * f, w = W * (0.4 + 0.6 * f), o = a * 12;
          sd.pos.set([q.x, q.y + w, q.z, q.x, q.y - w, q.z, q.x - w, q.y, q.z, q.x + w, q.y, q.z], o);
          for (let v = 0; v < 4; v++) sd.cl.set([col.r * al, col.g * al, col.b * al, al], a * 16 + v * 4);
          any += al;
        }
        sd.m.visible = any > 0.01;
        sd.g.attributes.position.needsUpdate = sd.g.attributes.color.needsUpdate = true;
      });
    },
    reset() { cars.forEach(c => c.forEach(sd => { sd.live = false; sd.m.visible = false; })); },
    dispose() { cars.forEach(c => c.forEach(sd => { scene.remove(sd.m); sd.g.dispose(); })); mat.dispose(); }
  };
}

/** Nhoè hướng tâm (motion blur kiểu "zoom") RIÊNG từng nửa màn: uK.x = nửa trái, uK.y = nửa phải; tâm = điểm chân trời giữa mỗi nửa.
 *  Mẫu lấy trong đúng nửa của mình (không loang qua vạch chia). */
export const RadialBlurShader = {
  uniforms: { tDiffuse: { value: null }, uK: { value: new THREE.Vector2() }, uC0: { value: new THREE.Vector2(0.25, 0.6) }, uC1: { value: new THREE.Vector2(0.75, 0.6) } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 uK; uniform vec2 uC0; uniform vec2 uC1; varying vec2 vUv;
    void main(){
      bool R = vUv.x > 0.5; float k = R ? uK.y : uK.x;
      vec4 c0 = texture2D(tDiffuse, vUv);
      if (k < 0.002) { gl_FragColor = c0; return; }
      vec2 c = R ? uC1 : uC0; vec2 d = (vUv - c) * k * 0.075;
      vec4 acc = c0; float lo = R ? 0.5015 : 0.0, hi = R ? 1.0 : 0.4985;
      for (int i = 1; i < 10; i++) { vec2 q = vUv - d * (float(i) / 9.0); q.x = clamp(q.x, lo, hi); acc += texture2D(tDiffuse, q); }
      gl_FragColor = acc / 10.0; }`
};
