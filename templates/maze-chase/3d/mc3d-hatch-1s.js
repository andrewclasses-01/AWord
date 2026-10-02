// 1s (29/9): thầy "ở vị trí robot xuất phát thực sự có một ô tròn trên boong luôn ở đó; xuất hiện xong đóng nắp rồi ô tròn vẫn còn" ⇒ `fixtures()`.
// MAZE CHASE 3D — NẮP BOONG TRÒN + HẦM MÁY DƯỚI BOONG (mẫu 1j, 29/9/2026). Thầy: "vị trí boong mở ra rồi đóng lại cho robot lên/xuống
// đổi thành dạng HÌNH TRÒN; ở dưới boong không đen hoàn toàn mà có thể nhìn thấy một số máy móc, robot xa xa, mờ mờ phía bên dưới".
// Nắp = vành sọc cảnh báo + gờ thép + 6 đèn + 8 LÁ CỬA kiểu ống kính máy ảnh (thu vào vành khi mở).
// "Lỗ nhìn xuống": sàn tàu là mặt đục, nên lòng nắp là một ĐĨA CỬA SỔ: vẽ riêng thế giới dưới boong (lớp 5) bằng CHÍNH máy quay vào
// một ảnh phụ, rồi đĩa lấy đúng điểm ảnh theo toạ độ màn hình ⇒ nhìn qua lỗ thấy hầm máy đúng phối cảnh, có chiều sâu thật.
// Robot đang được nâng/hạ cũng bật lớp 5 ⇒ thấy nó đứng trên bệ nâng dưới giếng.
import * as THREE from "../../rocket-race/vendor/three/three.module.min.js";

export const UNDER = 5;                                               // lớp riêng của thế giới dưới boong
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const easeIO = u => u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
const easeOut = u => 1 - Math.pow(1 - u, 3), easeIn = u => u * u * u;
const rnd = (a, b) => a + Math.random() * (b - a);
function tex(w, h, draw, srgb = true) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
const onlyUnder = o => o.traverse(m => m.layers.set(UNDER));

// ============================================================ ảnh phụ "nhìn xuống hầm"
export function createPortal(renderer) {
  const rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: 2 });
  const uniforms = { uTex: { value: rt.texture }, uScreen: { value: new THREE.Vector2(1, 1) }, uOpen: { value: 1 } };
  const mat = () => new THREE.ShaderMaterial({
    uniforms: { uTex: uniforms.uTex, uScreen: uniforms.uScreen, uOpen: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform sampler2D uTex; uniform vec2 uScreen; uniform float uOpen; varying vec2 vUv;
      void main(){
        vec3 c = texture2D(uTex, gl_FragCoord.xy / uScreen).rgb;
        float r = length(vUv - 0.5) * 2.0;
        c *= mix(1.0, 0.35, smoothstep(0.55, 1.0, r));                 // mép giếng tối dần
        c = mix(vec3(0.01, 0.015, 0.03), c, uOpen);
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const clear = new THREE.Color(0x03050a);
  let active = false;
  function setSize(w, h) { rt.setSize(Math.max(2, Math.round(w * 0.6)), Math.max(2, Math.round(h * 0.6))); uniforms.uScreen.value.set(w, h); }
  function render(scene, camera) {
    const auto = renderer.shadowMap.autoUpdate, old = renderer.getRenderTarget(), oc = renderer.getClearColor(new THREE.Color()), oa = renderer.getClearAlpha();
    renderer.shadowMap.autoUpdate = false;
    camera.layers.set(UNDER);
    renderer.setRenderTarget(rt); renderer.setClearColor(clear, 1); renderer.clear(); renderer.render(scene, camera);
    camera.layers.set(0);
    renderer.setRenderTarget(old); renderer.setClearColor(oc, oa); renderer.shadowMap.autoUpdate = auto;
  }
  return { rt, setSize, render, material: mat, get active() { return active; }, set active(v) { active = v; } };
}

// ============================================================ hầm máy dưới boong (chỉ thấy qua lỗ nắp)
export function createUnderdeck(scene, { makeRobot, span = [70, 36] } = {}) {
  const g = new THREE.Group(); scene.add(g);
  const [SX, SZ] = span, FLOOR = -24;
  const std = o => new THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0.5, ...o });
  // sàn hầm: lưới vạch sáng mờ + vạch vàng lối đi
  const floorTex = tex(512, 512, (x, w) => {
    x.fillStyle = "#101521"; x.fillRect(0, 0, w, w);
    x.strokeStyle = "rgba(90,140,200,.35)"; x.lineWidth = 2; for (let i = 0; i <= w; i += 64) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, w); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); }
    x.fillStyle = "rgba(245,179,1,.55)"; x.fillRect(0, 240, w, 10); x.fillRect(0, 262, w, 10);
  });
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(SX / 16, SZ / 16);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(SX * 2.4, SZ * 2.4).rotateX(-Math.PI / 2), std({ map: floorTex, emissive: 0x6688cc, emissiveMap: floorTex, emissiveIntensity: 0.35, roughness: 0.8 }));
  floor.position.y = FLOOR; g.add(floor);
  // cột + dầm trần
  const colMat = std({ color: 0x2a3244 });
  for (let x = -SX; x <= SX; x += 18) for (let z = -SZ; z <= SZ; z += 18) {
    const c = new THREE.Mesh(new THREE.BoxGeometry(1.4, -FLOOR - 3, 1.4), colMat); c.position.set(x + 9, (FLOOR - 3) / 2, z + 9); g.add(c);
  }
  for (let z = -SZ; z <= SZ; z += 18) { const b = new THREE.Mesh(new THREE.BoxGeometry(SX * 2.4, 1.2, 1), colMat); b.position.set(0, -3.6, z + 9); g.add(b); }
  // máy móc (khối lớn nhỏ) — instanced
  const box = new THREE.BoxGeometry(1, 1, 1);
  const MN = 240, mach = new THREE.InstancedMesh(box, std({ color: 0xffffff, metalness: 0.55 }), MN);
  const PN = 160, panels = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ toneMapped: false, side: THREE.DoubleSide }), PN);   // màn hình / khe đèn trên máy
  let pn = 0;
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color();
  for (let i = 0; i < MN; i++) {
    const under = i < 160, sx = rnd(1.5, 6), sy = under ? rnd(3, 13) : rnd(1, 6), sz = rnd(1.5, 5);   // 2/3 số máy dồn NGAY DƯỚI trạm, cao hơn ⇒ nhìn qua lỗ nào cũng thấy
    const px = under ? rnd(-34, 34) : rnd(-SX, SX), pz = under ? rnd(-17, 17) : rnd(-SZ, SZ), rot = Math.random() < 0.5 ? 0 : Math.PI / 2;
    _m.compose(_p.set(px, FLOOR + sy / 2, pz), _q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rot), _s.set(sx, sy, sz));
    mach.setMatrixAt(i, _m); const k = rnd(0.09, 0.2); mach.setColorAt(i, _c.setRGB(k, k * 1.08, k * 1.3));
    if (pn < PN && Math.random() < 0.7) {                              // mặt máy có màn hình / khe đèn phát sáng
      const fx = rot ? sz : sx, top = FLOOR + sy;
      _m.compose(_p.set(px + (rot ? sz / 2 + 0.02 : 0), top - rnd(0.6, Math.min(2.5, sy - 0.3)), pz + (rot ? 0 : sz / 2 + 0.02)), _q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rot), _s.set(fx * rnd(0.3, 0.7), rnd(0.25, 0.9), 1));
      panels.setMatrixAt(pn, _m); const col = [[0.2, 1.4, 2.2], [0.3, 2, 0.8], [2, 1.2, 0.3], [0.8, 0.4, 2]][pn % 4], b = rnd(0.5, 1.3); panels.setColorAt(pn, _c.setRGB(col[0] * b, col[1] * b, col[2] * b)); pn++;
      _m.compose(_p.set(px, top + 0.02, pz), _q.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2), _s.set(sx * 0.5, sz * 0.12, 1));   // vạch đèn trên nóc (thấy từ trên nhìn xuống)
      if (pn < PN) { panels.setMatrixAt(pn, _m); panels.setColorAt(pn, _c.setRGB(0.3 * b, 1.2 * b, 1.8 * b)); pn++; }
    }
  }
  g.add(mach); panels.count = pn; g.add(panels);
  // bồn chứa + ống dẫn
  const tankMat = std({ color: 0x2c3548, metalness: 0.7, roughness: 0.35 }), pipeMat = std({ color: 0x4a3f2a, metalness: 0.6 }), pipeMat2 = std({ color: 0x24404a, metalness: 0.6 });
  for (let i = 0; i < 16; i++) {
    const r = rnd(1.2, 2.6), h = rnd(4, 9), t = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 20), tankMat); t.position.set(rnd(-SX, SX), FLOOR + h / 2, rnd(-SZ, SZ)); g.add(t);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), tankMat); cap.position.set(t.position.x, FLOOR + h, t.position.z); g.add(cap);
  }
  for (let i = 0; i < 10; i++) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, SX * 2.4, 10), i % 2 ? pipeMat : pipeMat2);
    p.rotation.z = Math.PI / 2; if (i % 3 === 0) p.rotation.y = Math.PI / 2;
    p.position.set(0, rnd(-19, -13), rnd(-SZ, SZ)); g.add(p);
  }
  // đèn trạng thái nhấp nháy
  const LN = 140, lamps = new THREE.InstancedMesh(new THREE.SphereGeometry(0.22, 8, 6), new THREE.MeshBasicMaterial({ toneMapped: false }), LN);
  const lampPh = [];
  for (let i = 0; i < LN; i++) { _m.compose(_p.set(i < 100 ? rnd(-34, 34) : rnd(-SX, SX), FLOOR + rnd(0.5, 14), i < 100 ? rnd(-17, 17) : rnd(-SZ, SZ)), _q.identity(), _s.set(1, 1, 1)); lamps.setMatrixAt(i, _m); lampPh.push([rnd(0, 7), rnd(1, 4), [[2, 0.3, 0.2], [0.3, 2, 0.6], [2, 1.4, 0.2], [0.4, 1.2, 2.4]][i % 4]]); }
  g.add(lamps);
  // băng chuyền + thùng chạy
  const belt = new THREE.Mesh(new THREE.BoxGeometry(SX * 2.2, 0.6, 2.2), std({ color: 0x1c2230 })); belt.position.set(0, FLOOR + 1.3, -4); g.add(belt);
  const crates = Array.from({ length: 9 }, (_, i) => { const c = new THREE.Mesh(box, std({ color: [0x8a6a3a, 0x3f6b8a, 0x7a3b3b][i % 3], metalness: 0.2 })); c.scale.set(1.8, 1.4, 1.6); c.position.set(-SX + i * SX * 0.25, FLOOR + 2.3, -4); g.add(c); return c; });
  // quạt thông gió lớn
  const fans = [];
  for (let i = 0; i < 4; i++) {
    const f = new THREE.Group(); f.position.set(rnd(-SX, SX) * 0.8, FLOOR + 0.3, rnd(-SZ, SZ) * 0.8); g.add(f);
    f.add(new THREE.Mesh(new THREE.TorusGeometry(3, 0.3, 8, 32).rotateX(Math.PI / 2), colMat));
    const blades = new THREE.Group(); f.add(blades);
    for (let k = 0; k < 5; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.08, 0.7), std({ color: 0x3a4152 })); b.position.x = 1.4; const h = new THREE.Group(); h.rotation.y = k * Math.PI * 2 / 5; h.add(b); b.rotation.x = 0.4; blades.add(h); }
    fans.push(blades);
  }
  // robot tuần tra (mờ, xa)
  const bots = [];
  if (makeRobot) for (let i = 0; i < 10; i++) {
    const r = makeRobot(i); r.g.scale.setScalar(1.3); g.add(r.g);
    bots.push({ r, cx: rnd(-30, 30), cz: rnd(-14, 14), rx: rnd(6, 16), rz: rnd(4, 10), sp: rnd(0.15, 0.3) * (Math.random() < 0.5 ? -1 : 1), ph: rnd(0, 7) });
  }
  // lớp sương mờ (cộng sáng rất nhẹ) ⇒ xa thì mờ
  const hazeTex = tex(256, 256, (x, w) => { for (let i = 0; i < 40; i++) { const px = Math.random() * w, py = Math.random() * w, r = rnd(30, 90), gr = x.createRadialGradient(px, py, 0, px, py, r); gr.addColorStop(0, "rgba(120,160,230,.25)"); gr.addColorStop(1, "rgba(120,160,230,0)"); x.fillStyle = gr; x.fillRect(0, 0, w, w); } });
  const hazes = [-9, -15, -20].map((y, i) => { const h = new THREE.Mesh(new THREE.PlaneGeometry(SX * 2.6, SZ * 2.6).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: hazeTex, transparent: true, opacity: 0.05 + i * 0.02, blending: THREE.AdditiveBlending, depthWrite: false })); h.position.y = y; g.add(h); return h; });
  // đèn riêng của hầm (chỉ lớp 5)
  const hemi = new THREE.HemisphereLight(0x5b76a8, 0x06080e, 0.35); g.add(hemi);
  const pts = [[0x5fd4ff, -30, -10], [0xffb347, 25, 8], [0x7f9cff, 0, 20], [0xff6a5a, 45, -18]].map(([c, x, z]) => { const l = new THREE.PointLight(c, 120, 45, 1.7); l.position.set(x, -14, z); g.add(l); return l; });
  const dir = new THREE.DirectionalLight(0x9fb4e0, 0.25); dir.position.set(10, 0, 20); g.add(dir); g.add(dir.target); dir.target.position.set(0, FLOOR, 0);
  void pts; void hazes;
  onlyUnder(g);

  function update(dt, t) {
    for (const f of fans) f.rotation.y += dt * 3;
    for (const c of crates) { c.position.x += dt * 2.2; if (c.position.x > SX * 1.1) c.position.x -= SX * 2.2; }
    for (let i = 0; i < LN; i++) { const [ph, fq, col] = lampPh[i]; const k = Math.sin(t * fq + ph) > 0.2 ? 1 : 0.12; lamps.setColorAt(i, _c.setRGB(col[0] * k, col[1] * k, col[2] * k)); }
    lamps.instanceColor.needsUpdate = true;
    for (const b of bots) {
      const a = t * b.sp + b.ph, x = b.cx + Math.cos(a) * b.rx, z = b.cz + Math.sin(a) * b.rz;
      b.r.g.position.set(x, FLOOR + 2.4 + Math.sin(t * 2 + b.ph) * 0.2, z);
      b.r.g.rotation.y = Math.atan2(-Math.sin(a) * b.rx * Math.sign(b.sp), Math.cos(a) * b.rz * Math.sign(b.sp));
    }
  }
  return { group: g, update };
}

// ============================================================ nắp boong tròn kiểu ống kính
export function createHatches(parent, radius = 1.5, portal) {
  const R = radius, BL = 8;
  const stripeTex = tex(256, 256, (g, w) => {                          // vành sọc vàng-đen quanh tâm
    g.fillStyle = "#1b1d22"; g.fillRect(0, 0, w, w);
    for (let k = 0; k < 36; k++) { const a0 = k / 36 * Math.PI * 2; g.fillStyle = k % 2 ? "#1b1d22" : "#f5b301"; g.beginPath(); g.moveTo(w / 2, w / 2); g.arc(w / 2, w / 2, w / 2, a0, a0 + Math.PI * 2 / 36); g.fill(); }
  });
  const bladeTex = tex(256, 256, (g, w) => {
    g.fillStyle = "#4b525f"; g.fillRect(0, 0, w, w);
    for (let y = 20; y < w; y += 30) { g.fillStyle = "rgba(0,0,0,.25)"; g.fillRect(0, y, w, 3); g.fillStyle = "rgba(255,255,255,.08)"; g.fillRect(0, y + 3, w, 1); }
    for (let i = 0; i < 6; i++) { g.fillStyle = "#8a93a3"; g.beginPath(); g.arc(rnd(20, w - 20), rnd(20, w - 20), 4, 0, 7); g.fill(); }
  });
  const shaftTex = tex(256, 256, (g, w, h) => {                        // thành giếng: gân thép + dải đèn
    g.fillStyle = "#1a2030"; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 32) { g.fillStyle = "#262e42"; g.fillRect(x, 0, 12, h); }
    for (let y = 0; y < h; y += 64) { g.fillStyle = "#0e1320"; g.fillRect(0, y, w, 8); g.fillStyle = "rgba(80,200,255,.9)"; g.fillRect(0, y + 28, w, 4); }
  });
  shaftTex.wrapS = shaftTex.wrapT = THREE.RepeatWrapping; shaftTex.repeat.set(3, 0.5);
  const ringGeo = new THREE.RingGeometry(R, R + 0.42, 64).rotateX(-Math.PI / 2);
  const lipGeo = new THREE.TorusGeometry(R + 0.02, 0.07, 8, 64).rotateX(Math.PI / 2);
  const discGeo = new THREE.CircleGeometry(R + 0.005, 48).rotateX(-Math.PI / 2);
  const lampGeo = new THREE.SphereGeometry(0.09, 10, 8);
  const glowGeo = new THREE.CylinderGeometry(R * 0.9, R * 0.9, 3.2, 32, 1, true).translate(0, 1.6, 0);
  const shaftGeo = new THREE.CylinderGeometry(R, R, 1.3, 40, 1, true).translate(0, -0.65, 0);   // chỉ dày bằng sàn tàu ⇒ nhìn xuyên xuống hầm
  const platGeo = new THREE.CylinderGeometry(R * 0.9, R * 0.9, 0.22, 36).translate(0, -0.11, 0);
  const platRimGeo = new THREE.TorusGeometry(R * 0.9, 0.05, 6, 40).rotateX(Math.PI / 2);
  // lá cửa: hình quạt 1/8 đĩa, gốc ở mép vành (toạ độ gốc = điểm giữa cung ngoài), mép trong cong nhẹ kiểu ống kính
  const bladeGeo = (() => {
    const th = Math.PI / BL * 1.18, sh = new THREE.Shape();
    const P = (r, a) => [r * Math.cos(a) - R, r * Math.sin(a)];
    sh.moveTo(...P(R, -th));
    for (let k = 1; k <= 8; k++) sh.lineTo(...P(R, -th + 2 * th * k / 8));
    sh.quadraticCurveTo(-R * 0.35, R * 0.28, -R, 0);                  // mép trong cong
    sh.lineTo(...P(R, -th));
    const gg = new THREE.ExtrudeGeometry(sh, { depth: 0.05, bevelEnabled: false }); gg.rotateX(-Math.PI / 2);
    const uv = gg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 0.4 + 0.5, uv.getY(i) * 0.4 + 0.5);
    return gg;
  })();

  const live = [], pool = [];
  function build() {
    const g = new THREE.Group();
    const ringMat = new THREE.MeshStandardMaterial({ map: stripeTex, metalness: 0.5, roughness: 0.5 });
    const ring = new THREE.Mesh(ringGeo, ringMat); ring.position.y = 0.03; ring.receiveShadow = true; g.add(ring);
    const lipMat = new THREE.MeshStandardMaterial({ color: 0x8a93a3, metalness: 0.85, roughness: 0.3 });
    const lip = new THREE.Mesh(lipGeo, lipMat); lip.position.y = 0.06; g.add(lip);
    const lampMat = new THREE.MeshStandardMaterial({ color: 0x3a1a00, emissive: 0xff8a00, emissiveIntensity: 0 });
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2, l = new THREE.Mesh(lampGeo, lampMat); l.position.set(Math.cos(a) * (R + 0.26), 0.1, Math.sin(a) * (R + 0.26)); g.add(l); }
    const discMat = portal.material();
    const disc = new THREE.Mesh(discGeo, discMat); disc.position.y = 0.02; disc.renderOrder = 1; g.add(disc);
    const bladeMat = new THREE.MeshStandardMaterial({ map: bladeTex, metalness: 0.65, roughness: 0.4 });
    const blades = [];
    for (let i = 0; i < BL; i++) {
      const a = i / BL * Math.PI * 2, piv = new THREE.Group();
      piv.position.set(Math.cos(a) * R, 0.045 + i * 0.004, Math.sin(a) * R); piv.rotation.y = -a; g.add(piv);
      const b = new THREE.Mesh(bladeGeo, bladeMat); b.castShadow = true; b.receiveShadow = true; piv.add(b); blades.push({ piv, a });
    }
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const glow = new THREE.Mesh(glowGeo, glowMat); g.add(glow);
    // phần DƯỚI boong (chỉ thấy qua lỗ): thành giếng + bệ nâng
    const shaftMat = new THREE.MeshStandardMaterial({ map: shaftTex, emissive: 0x5fd4ff, emissiveMap: shaftTex, emissiveIntensity: 0.5, side: THREE.BackSide, metalness: 0.5, roughness: 0.6 });
    const shaft = new THREE.Mesh(shaftGeo, shaftMat); g.add(shaft); shaft.layers.set(UNDER);
    const platMat = new THREE.MeshStandardMaterial({ color: 0x2b3345, metalness: 0.7, roughness: 0.4 });
    // bệ nâng dạng KHUNG (vành + 6 nan + trục giữa) ⇒ nhìn xuyên được xuống hầm máy; robot đứng trên đĩa nhỏ giữa khung
    const plat = new THREE.Group(); const rim = new THREE.Mesh(platRimGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(0.5, 1.6, 2.4), toneMapped: false })); plat.add(rim);
    plat.add(new THREE.Mesh(new THREE.CylinderGeometry(R * 0.42, R * 0.42, 0.14, 24).translate(0, -0.07, 0), platMat));
    for (let k = 0; k < 6; k++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(R * 0.9, 0.08, 0.08).translate(R * 0.45, -0.04, 0), platMat); sp.rotation.y = k * Math.PI / 3; plat.add(sp); }
    const ram = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 20, 10).translate(0, -10.1, 0), platMat); plat.add(ram);   // trục nâng thuỷ lực
    g.add(plat); onlyUnder(plat);
    return { g, discMat, ringMat, lipMat, lampMat, bladeMat, glowMat, shaftMat, platMat, blades, disc, plat };
  }
  function make(x, z) {
    const h = pool.pop() || build();
    h.g.position.set(x, 0, z); h.g.scale.set(1, 1, 1); h.g.visible = true; parent.add(h.g);
    h.glowMat.opacity = 0; h.lampMat.emissiveIntensity = 0; h.disc.visible = false; h.plat.position.y = -5; h.plat.visible = false;
    h.blades.forEach(b => { b.piv.scale.set(1, 1, 1); b.piv.rotation.y = -b.a; });
    return h;
  }
  function run(x, z, { mode = "rise", depth = 5, speed = 1, onLift, onHidden, onDone, onOpen } = {}) {
    const h = make(x, z);
    const T = { in: 0.15, open: 0.42, move: mode === "rise" ? 0.9 : 0.75, close: 0.38, out: 0.15 };
    for (const k in T) T[k] /= speed;
    const fx = fix.find(f => Math.hypot(f.x - x, f.z - z) < 0.05); if (fx) fx.h.g.visible = false;   // 1s: nắp cố định tạm ẩn khi nắp động chạy đúng chỗ đó
    const o = { h, mode, depth, T, t: 0, onLift, onHidden, onDone, onOpen, hidden: false, opened: false, fx };
    if (mode === "rise" && onLift) onLift(-depth);
    live.push(o); return o;
  }
  function update(dt, time) {
    for (let i = live.length - 1; i >= 0; i--) {
      const o = live[i], T = o.T, h = o.h; o.t += dt;
      const t1 = T.in, t2 = t1 + T.open, t3 = t2 + T.move, t4 = t3 + T.close, t5 = t4 + T.out, t = o.t;
      const open = t < t1 ? 0 : t < t2 ? easeIO((t - t1) / T.open) : t < t3 ? 1 : t < t4 ? 1 - easeIO((t - t3) / T.close) : 0;
      h.blades.forEach(b => { b.piv.scale.x = Math.max(0.06, 1 - 0.94 * open); b.piv.rotation.y = -b.a - 0.55 * open; });   // thu vào vành + xoắn nhẹ
      h.disc.visible = open > 0.002; h.discMat.uniforms.uOpen.value = clamp(open * 1.4, 0, 1);
      h.lampMat.emissiveIntensity = t < t4 ? (Math.sin(time * 14) > 0 ? 3.2 : 0.3) : 0;
      h.glowMat.opacity = open * 0.06 * (t > t2 && t < t3 ? 1 : 0.5);   // cột sáng rất mờ ⇒ không che hầm bên dưới
      if (!o.opened && t >= t2) { o.opened = true; o.onOpen && o.onOpen(); }
      let y = 0;
      if (o.onLift) {
        const u = clamp((t - t2) / T.move, 0, 1);
        y = t < t2 ? (o.mode === "rise" ? -o.depth : 0) : o.mode === "rise" ? -o.depth * (1 - easeOut(u)) : -o.depth * easeIn(u);
        o.onLift(y);
      }
      h.plat.visible = open > 0.002; h.plat.position.y = Math.min(-0.02, y + 0.02);
      if (o.mode === "sink" && !o.hidden && t >= t3) { o.hidden = true; o.onHidden && o.onHidden(); }
      if (t >= t5) { parent.remove(h.g); pool.push(h); live.splice(i, 1); if (o.fx) o.fx.h.g.visible = true; o.onDone && o.onDone(); }
    }
    portal.active = live.some(o => o.h.disc.visible);
  }
  function clear() { live.splice(0).forEach(o => { parent.remove(o.h.g); pool.push(o.h); }); fix.forEach(f => { f.h.g.visible = true; }); portal.active = false; }
  // 1s: ô tròn CỐ ĐỊNH trên boong ở chỗ robot xuất phát — luôn có, đóng nắp, đèn viền sáng mờ; nắp động chạy trùng chỗ thì ô này tạm ẩn
  const fix = [];
  function fixtures(list) {
    fix.splice(0).forEach(f => { parent.remove(f.h.g); pool.push(f.h); });
    list.forEach(([x, z]) => { const h = make(x, z); h.g.visible = true; h.lampMat.emissiveIntensity = 0.6; fix.push({ h, x, z }); });
  }
  return { run, update, clear, fixtures, get busy() { return live.length; } };
}
