// STAR LOOT 2b (30/9/2026) — cổng dán PHẲNG lên mặt vách: place() nhận thêm `tilt` (0 = không ngả).
// ---- ghi chú 1z: thầy: cổng KHÔNG viền, CHỈ ÁNH SÁNG (bỏ vòng kim loại/chân/đế/đinh; xoáy mép tan dần + quầng sáng + hạt sáng) ·
//   mở bằng một chớp sáng; `usable` = đã mở hẳn (robot chỉ qua được khi cổng sáng đủ).
// ---- ghi chú 1y: CỔNG KHÔNG GIAN: một cặp vòng cổng ĐỨNG, lõi lỗ giun xoáy (cùng họ shader lỗ giun ở intro).
//   createGates(parent) ⇒ { place(a, b), open(), close(), clear(), update(dt, t), setReady(i, [readyA, readyB], fight), warm(on), gates }
//   a / b = { x, z, yaw }  (yaw = hướng mặt cổng; robot đi xuyên theo pháp tuyến). Mở/thu bằng hệ số 0 → 1.
//   Mỗi cổng có 2 đèn nhỏ trên đỉnh (xanh = đội A, cam = đội B) chỉ hiện ở Fight: tắt = đội đó đang chờ hồi 4 s.
//   ⚠ bẫy NaN (TOMKO): mọi pow/log trong shader đều chặn số âm; không chia cho 0.
import * as THREE from "../../rocket-race/vendor/three/three.module.min.js";

const GATE_VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const GATE_FS = `uniform float uT, uI, uOpen; uniform vec3 uA, uB; varying vec2 vUv;
  void main(){
    vec2 p = vUv * 2.0 - 1.0; float L = length(p);
    float rr = clamp(L / max(uOpen, 0.02), 0.0, 4.0), a = atan(p.y, p.x + 1e-5), lr = log(rr + 0.05);
    float s1 = sin(a * 3.0 + lr * 7.0 - uT * 3.4) * 0.5 + 0.5, s2 = sin(a * 5.0 - lr * 11.0 + uT * 2.1) * 0.5 + 0.5;
    float inside = 1.0 - smoothstep(0.45, 1.0, rr);                         // 1z: mép tan dần, không có viền
    float core = pow(clamp(1.0 - rr * 1.25, 0.0, 1.0), 2.0);
    vec3 c = mix(uB, uA, s1) * (0.35 + 0.85 * s1 * s2) * inside + vec3(1.0, 0.95, 1.0) * core * 0.9;
    c += uA * exp(-rr * 2.2) * 0.35;                                         // 1z: lõi toả sáng mềm (không vạch viền)
    gl_FragColor = vec4(clamp(c * uI, 0.0, 8.0), 1.0);
  }`;

export function createGates(parent, { R = 1.3, cy = 1.5 } = {}) {
  const A = new THREE.Color(0.85, 0.45, 1.7), B = new THREE.Color(0.18, 0.08, 0.62);
  const metal = new THREE.MeshStandardMaterial({ color: 0x3a3f58, metalness: 0.85, roughness: 0.32 });
  const trim = new THREE.MeshStandardMaterial({ color: 0x1b1030, emissive: 0xa855f7, emissiveIntensity: 1.4, roughness: 0.4 });
  const ringGeo = new THREE.TorusGeometry(R, 0.17, 14, 56), trimGeo = new THREE.TorusGeometry(R - 0.14, 0.045, 8, 56);
  const footGeo = new THREE.BoxGeometry(0.34, 0.5, 0.5), plinthGeo = new THREE.CylinderGeometry(R * 0.95, R * 1.05, 0.08, 40);
  const boltGeo = new THREE.SphereGeometry(0.075, 10, 8), lampGeo = new THREE.SphereGeometry(0.11, 12, 10), dotGeo = new THREE.SphereGeometry(0.05, 8, 6);
  const glowTex = (() => { const cv = document.createElement("canvas"); cv.width = cv.height = 128; const g = cv.getContext("2d");
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.4, "rgba(255,255,255,.35)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; })();

  function build(k) {
    const g = new THREE.Group(); g.visible = false; parent.add(g);
    const body = new THREE.Group(); g.add(body);
    // 1z: bỏ vòng kim loại + đế + chân + đinh — chỉ còn ánh sáng
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: new THREE.Color(0.7, 0.3, 1.5), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    halo.position.y = cy; halo.scale.setScalar(R * 3.6); halo.renderOrder = 4; g.add(halo);
    const mat = new THREE.ShaderMaterial({ vertexShader: GATE_VS, fragmentShader: GATE_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: { uT: { value: k * 3.7 }, uI: { value: 1 }, uOpen: { value: 1 }, uA: { value: A.clone() }, uB: { value: B.clone() } } });
    const disk = new THREE.Mesh(new THREE.PlaneGeometry(R * 2.3, R * 2.3), mat); disk.position.y = cy; disk.renderOrder = 5; body.add(disk);
    const floorGlow = new THREE.Mesh(new THREE.PlaneGeometry(R * 4.2, R * 4.2).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: glowTex, color: new THREE.Color(0.8, 0.35, 1.6), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    floorGlow.position.y = 0.09; floorGlow.renderOrder = 2; g.add(floorGlow);
    const dots = [], dotMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.3, 0.9, 2.2), toneMapped: false });
    for (let i = 0; i < 10; i++) { const d = new THREE.Mesh(dotGeo, dotMat); body.add(d); dots.push({ d, ph: i / 10 * Math.PI * 2, sp: 1.3 + (i % 3) * 0.35 }); }
    const lamps = [[0.3, 1.1, 2.4], [2.4, 1.1, 0.3]].map((c, i) => { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: new THREE.Color(...c), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); m.scale.setScalar(0.55); m.position.set((i ? 1 : -1) * 0.38, cy + R + 0.3, 0); m.visible = false; body.add(m); m.material.emissiveIntensity = 1; return m; });   // 1z: đèn đội = đốm sáng
    return { g, body, mat, floorGlow, dots, lamps, dotMat, halo, x: 0, z: 0 };
  }
  const gates = [build(0), build(1)];
  let open = 0, want = 0, on = false;

  function place(a, b) {
    [a, b].forEach((p, i) => { const G = gates[i]; G.x = p.x; G.z = p.z; G.g.position.set(p.x, 0, p.z); G.body.rotation.set(p.tilt ?? ((p.yaw || 0) === 0 ? -0.38 : 0), p.yaw || 0, 0);   /* 2b: tilt 0 = dán phẳng lên vách */ /* ngả nhẹ về máy quay cho thấy mặt xoáy */ G.g.visible = true; });
    on = true; open = 0; want = 0; gates.forEach(G => { G.g.scale.setScalar(0.001); });
  }
  function clear() { on = false; open = want = 0; gates.forEach(G => { G.g.visible = false; }); }
  const ready = [[true, true], [true, true]];
  function setReady(i, rs, fight) {                    // i = cổng (0/1) · rs = [đội A sẵn sàng, đội B sẵn sàng]
    ready[i] = rs; const G = gates[i];
    G.lamps.forEach((l, k) => { l.visible = !!fight; l.material.opacity = rs[k] ? 1 : 0.08; });
    G.dim = fight ? (rs[0] || rs[1] ? 1 : 0.4) : (rs[0] ? 1 : 0.35);
  }
  function update(dt, t) {
    if (!on) return;
    open += (want - open) * Math.min(1, dt * 5); if (Math.abs(want - open) < 0.002) open = want;
    const s = open < 0.001 ? 0.001 : open;
    gates.forEach((G, i) => {
      G.g.scale.set(s, s, s);
      G.mat.uniforms.uT.value = t + i * 3.7;
      G.mat.uniforms.uOpen.value = Math.max(0.02, open);
      const dim = G.dim ?? 1; G.cur = (G.cur ?? 1) + (dim - (G.cur ?? 1)) * Math.min(1, dt * 6);
      G.mat.uniforms.uI.value = G.cur * (0.9 + 0.1 * Math.sin(t * 3 + i));
      G.floorGlow.material.opacity = 0.85 * G.cur * open; G.halo.material.opacity = (0.55 + 0.1 * Math.sin(t * 2.3 + i)) * G.cur * open;
      G.dots.forEach(o => { const an = o.ph + t * o.sp * (i ? -1 : 1), rr = R + 0.32 + 0.06 * Math.sin(t * 4 + o.ph * 3); o.d.position.set(Math.cos(an) * rr, cy + Math.sin(an) * rr, 0.12 * Math.sin(t * 2 + o.ph)); });
      if (G.pulse > 0) { G.pulse = Math.max(0, G.pulse - dt * 2.2); G.body.scale.setScalar(1 + 0.18 * G.pulse); G.mat.uniforms.uI.value += 1.2 * G.pulse; }
    });
  }
  return {
    gates, place, clear, update, setReady,
    open() { want = 1; gates.forEach(G => { G.pulse = 1; }); }, close() { want = 0; },
    get usable() { return on && want === 1 && open > 0.85; },
    pulse(i) { gates[i].pulse = 1; },
    get on() { return on; },
    warm(v) { gates.forEach((G, i) => { G.g.visible = v; G.g.position.set(i * 3, v ? -60 : 0, 0); G.g.scale.setScalar(1); }); },
  };
}
