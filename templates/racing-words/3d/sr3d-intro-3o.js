// RACING WORDS mẫu 3o = sr3d-intro-3n.js + dòng GHI CÔNG mẫu 3D (tên mẫu · tác giả · CC-BY 4.0) dưới ô chọn xe; xe từ sr3d-xe3d-3o.js / sr3d-car-3o.js; destroy() trả card đồ hoạ (forceContextLoss).
// =============================================================
// RACING WORDS — INTRO XƯỞNG ANDREW STUDIO (mẫu 3n, 15/10/2026). Thầy chọn kịch bản A (tương tự intro Rocket Race):
//   MÀN CHỜ: xưởng tối, 2 đèn rọi xuống 2 xe đã chọn (sơn màu đội), pô thỉnh thoảng nổ, máy quay lượn chậm; ô chọn xe + START trên cảnh.
//   START ⇒ ~12 s: đèn trần bật "cạch" từng dãy + biển ANDREW STUDIO sáng → cận đuôi xe đội 1 nổ máy phụt lửa (thẻ tên) → xe đội 2 →
//   máy quay ngoài cửa nhìn vào, CỬA CUỐN kéo lên, nắng hoàng hôn tràn vào → 2 xe tăng tốc lao ra đường, chữ RACING WORDS →
//   xe vút qua máy quay, CHỚP SÁNG ⇒ onHandoff() (trang ẩn intro, game.start() ⇒ máy quay chui vào buồng lái, 5 đèn, GO).
// Cảnh riêng (canvas + WebGLRenderer riêng đè lên khung game); game tạm ngừng vẽ (game.hold) khi intro hiện.
// Âm thanh: intro phát "mốc" qua onCue(tên, đội) — lớp âm thanh gắn sau (lights, engine, pop, door, rollout, title, flyby, flash).
// Xe dựng bằng makeCar3d (sr3d-car-3l.js: lửa pô thật, bánh lăn) với bend = không cong (U = 0).
// =============================================================
import * as THREE from "../../rocket-race/vendor/three/three.module.min.js";
import { RectAreaLightUniformsLib } from "../../rocket-race/vendor/three/addons/RectAreaLightUniformsLib.js";
import { EffectComposer } from "../../rocket-race/vendor/three/addons/EffectComposer.js";
import { RenderPass } from "../../rocket-race/vendor/three/addons/RenderPass.js";
import { UnrealBloomPass } from "../../rocket-race/vendor/three/addons/UnrealBloomPass.js";
import { OutputPass } from "../../rocket-race/vendor/three/addons/OutputPass.js";
import { XE, prepXe } from "./sr3d-xe3d-3o.js";
import { makeCar3d } from "./sr3d-car-3o.js";

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const TEAMS = [{ name: "TEAM 1", color: "#3b8cff" }, { name: "TEAM 2", color: "#ff7a00" }];

// xưởng: rộng 26 m (x ±13), sâu 32 m (z −16 cửa … +16 tường sau), cao 9 m; xe ở x ±2,7, z 2, mũi hướng −z (ra cửa)
const W = 13, DOOR_Z = -16, BACK_Z = 16, H = 9, DOOR_W = 6.5, DOOR_H = 6;
const CAR_X = [2.7, -2.7], CAR_Z = 2;                    // máy quay màn chờ nhìn từ phía cửa vào ⇒ đội 1 ở +x mới nằm BÊN TRÁI màn (khớp ô chọn xe)
const START_T = { lights: [0.25, 0.55, 0.85, 1.15, 1.45], sign: 1.6, eng0: 2.25, eng1: 3.85, door: 5.35, doorEnd: 7.3, roll: 7.7, title: 9.3, flyby: 10.7, flash: 11.5, end: 11.75 };

function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; }
function tex(c, srgb = true) { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }

// sàn bê tông mài bóng: vân loang + vết dầu + vạch sơn vàng khu đỗ
function floorTex() {
  const [c, g] = canvas(1024, 1024);
  g.fillStyle = "#4a4d52"; g.fillRect(0, 0, 1024, 1024);
  for (let k = 0; k < 2600; k++) { const x = Math.random() * 1024, y = Math.random() * 1024, r = 2 + Math.random() * 30, a = Math.random() * 0.06;
    g.fillStyle = Math.random() < 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
  for (let k = 0; k < 18; k++) { const x = Math.random() * 1024, y = Math.random() * 1024, r = 20 + Math.random() * 60;
    const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, "rgba(10,10,12,.35)"); gr.addColorStop(1, "rgba(10,10,12,0)"); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
  g.strokeStyle = "rgba(0,0,0,.35)"; g.lineWidth = 2; for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(k * 256, 0); g.lineTo(k * 256, 1024); g.stroke(); g.beginPath(); g.moveTo(0, k * 256); g.lineTo(1024, k * 256); g.stroke(); }
  const t = tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 4); return t;
}
// ô đỗ màu đội trên sàn: khung + chữ TEAM n
function padTex(color, label) {
  const [c, g] = canvas(512, 1024);
  g.clearRect(0, 0, 512, 1024);
  g.strokeStyle = color; g.lineWidth = 18; g.strokeRect(20, 20, 472, 984);
  g.fillStyle = color; g.globalAlpha = 0.14; g.fillRect(20, 20, 472, 984); g.globalAlpha = 1;
  g.font = "italic 900 120px 'Exo 2', 'Arial Black', sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = color;
  g.save(); g.translate(256, 900); g.fillText(label, 0, 0); g.restore();
  return tex(c);
}
// biển hiệu tường sau: ANDREW STUDIO (đèn chữ) + RACING WORDS
function signTex() {
  const [c, g] = canvas(2048, 512);
  g.clearRect(0, 0, 2048, 512);
  g.textAlign = "center"; g.textBaseline = "middle";
  g.font = "italic 900 230px 'Exo 2', 'Arial Black', sans-serif"; g.fillStyle = "#ffffff"; g.fillText("ANDREW STUDIO", 1024, 210, 1960);
  g.font = "italic 800 92px 'Exo 2', 'Arial Black', sans-serif"; g.fillStyle = "#ffcf7a"; g.fillText("R A C I N G   W O R D S", 1024, 420, 1700);
  return tex(c);
}
function skyMat() {
  return new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { uSun: { value: V(0.15, 0.08, -1).normalize() } },
    vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform vec3 uSun; varying vec3 vD;
      void main(){ float h = clamp(vD.y, -0.2, 1.0);
        vec3 c = mix(vec3(1.0, 0.62, 0.32), vec3(0.28, 0.42, 0.72), smoothstep(0.0, 0.55, h));
        c = mix(c, vec3(1.0, 0.45, 0.2), smoothstep(0.08, -0.05, h) * 0.6);
        float s = max(dot(vD, uSun), 0.0); c += vec3(1.0, 0.75, 0.4) * pow(s, 60.0) * 2.5 + vec3(1.0, 0.55, 0.25) * pow(s, 6.0) * 0.45;
        gl_FragColor = vec4(c, 1.0); }` });
}

export function createIntro({ mount, cars: ids = ["Y2", "H4"], title = "RACING WORDS", onStart = () => {}, onHandoff = () => {}, onCue = () => {}, onPick = null, onSetCar = null }) {
  // ---------- DOM: canvas + lớp chữ / chọn xe / START ----------
  const root = document.createElement("div"); root.className = "ri-root is-idle";
  root.innerHTML = `
    <canvas class="ri-cv"></canvas>
    <div class="ri-bars"><i></i><i></i></div>
    <div class="ri-ui">
      <div class="ri-studio"><i></i><span>ANDREW STUDIO</span><i></i></div>
      <div class="ri-title">${title}</div>
      ${[0, 1].map(i => `<div class="ri-pick ri-pick${i}" style="--team:${TEAMS[i].color}"><button class="ri-pb" data-d="-1" type="button">◀</button>
        <button class="ri-pn" type="button"><small>${TEAMS[i].name} · CHOOSE YOUR CAR</small><b></b><em></em></button>
        <button class="ri-pb" data-d="1" type="button">▶</button><div class="ri-list"></div><div class="ri-cred"></div></div>`).join("")}
      <button class="ri-start" type="button">▶&nbsp; START</button>
      <button class="ri-skip" type="button">SKIP ▸▸</button>
    </div>
    <div class="ri-card"><small></small><b></b></div>
    <div class="ri-big">${title}</div>
    <div class="ri-flash"></div>`;
  mount.appendChild(root);
  const $ = s => root.querySelector(s);
  const cv = $(".ri-cv");

  // ---------- renderer / cảnh ----------
  const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0; renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  RectAreaLightUniformsLib.init();
  const scene = new THREE.Scene(); scene.fog = new THREE.FogExp2(0x0b0c10, 0.012);
  const cam = new THREE.PerspectiveCamera(40, 16 / 9, 0.05, 600);
  const composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, cam));
  const bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.45, 0.6, 0.85); composer.addPass(bloom); composer.addPass(new OutputPass());
  const own = [];
  const add = (o) => { scene.add(o); return o; };

  // ---------- bên ngoài: trời hoàng hôn + đất + đường ----------
  const sky = add(new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), skyMat()));
  const ground = add(new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshStandardMaterial({ color: "#8a7356", roughness: 1 })));
  ground.rotation.x = -Math.PI / 2; ground.position.set(0, -0.02, -300);
  const road = add(new THREE.Mesh(new THREE.PlaneGeometry(12, 400), new THREE.MeshStandardMaterial({ color: "#2b2d31", roughness: 0.75 })));
  road.rotation.x = -Math.PI / 2; road.position.set(0, -0.005, DOOR_Z - 200);
  for (let k = 0; k < 40; k++) { const d = add(new THREE.Mesh(new THREE.PlaneGeometry(0.22, 3), new THREE.MeshBasicMaterial({ color: "#e9e4d6" }))); d.rotation.x = -Math.PI / 2; d.position.set(0, 0.001, DOOR_Z - 6 - k * 9); }
  const sun = add(new THREE.DirectionalLight("#ffb070", 0)); sun.position.set(-8, 10, -60); sun.target.position.set(0, 0, 4); add(sun.target);
  sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 10, far: 120 }); sun.shadow.bias = -0.0006;

  // ---------- xưởng ----------
  const concrete = new THREE.MeshPhysicalMaterial({ map: floorTex(), color: "#9a9ea6", roughness: 0.32, metalness: 0.0, clearcoat: 0.6, clearcoatRoughness: 0.18, envMapIntensity: 1.0 });
  const floor = add(new THREE.Mesh(new THREE.PlaneGeometry(W * 2, BACK_Z - DOOR_Z), concrete)); floor.rotation.x = -Math.PI / 2; floor.position.z = (BACK_Z + DOOR_Z) / 2; floor.receiveShadow = true;
  const wallM = new THREE.MeshStandardMaterial({ color: "#23262c", roughness: 0.82, metalness: 0.15 });
  const panelM = new THREE.MeshStandardMaterial({ color: "#2e323a", roughness: 0.6, metalness: 0.35 });
  const box = (w, h, d, m, x, y, z) => { const o = add(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m)); o.position.set(x, y, z); o.receiveShadow = true; return o; };
  box(0.4, H, BACK_Z - DOOR_Z, wallM, -W, H / 2, (BACK_Z + DOOR_Z) / 2); box(0.4, H, BACK_Z - DOOR_Z, wallM, W, H / 2, (BACK_Z + DOOR_Z) / 2);
  box(W * 2, H, 0.4, wallM, 0, H / 2, BACK_Z);
  box(W * 2, 0.4, BACK_Z - DOOR_Z, wallM, 0, H, (BACK_Z + DOOR_Z) / 2);
  // tường trước 2 bên cửa + dầm trên cửa
  box(W - DOOR_W, H, 0.5, wallM, -(W + DOOR_W) / 2, H / 2, DOOR_Z); box(W - DOOR_W, H, 0.5, wallM, (W + DOOR_W) / 2, H / 2, DOOR_Z);
  box(DOOR_W * 2, H - DOOR_H, 0.5, wallM, 0, DOOR_H + (H - DOOR_H) / 2, DOOR_Z);
  // ốp tường kim loại sọc + giàn thép trần
  for (let z = DOOR_Z + 2; z < BACK_Z; z += 4) { box(0.12, H - 1, 3.6, panelM, -W + 0.27, H / 2, z); box(0.12, H - 1, 3.6, panelM, W - 0.27, H / 2, z); }
  const steel = new THREE.MeshStandardMaterial({ color: "#3b3f47", roughness: 0.45, metalness: 0.8 });
  for (let z = DOOR_Z + 3; z < BACK_Z; z += 6) { box(W * 2, 0.35, 0.3, steel, 0, H - 0.6, z); }
  for (let x = -9; x <= 9; x += 6) box(0.25, 0.3, BACK_Z - DOOR_Z, steel, x, H - 0.9, (BACK_Z + DOOR_Z) / 2);
  // tủ đồ nghề + chồng lốp dọc tường
  const redM = new THREE.MeshStandardMaterial({ color: "#a3161b", roughness: 0.45, metalness: 0.5 }), tyreM = new THREE.MeshStandardMaterial({ color: "#111214", roughness: 0.9 });
  [-1, 1].forEach(s => { for (let z = -8; z <= 10; z += 6) { box(1.1, 1.05, 2.0, redM, s * (W - 0.95), 0.52, z); }
    for (let z = -11; z <= 12; z += 7.5) for (let k = 0; k < 4; k++) { const t = add(new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.14, 10, 24), tyreM)); t.rotation.x = Math.PI / 2; t.position.set(s * (W - 2.6), 0.14 + k * 0.28, z); t.castShadow = true; } });
  // ô đỗ màu đội
  [0, 1].forEach(i => { const p = add(new THREE.Mesh(new THREE.PlaneGeometry(3.4, 6.8), new THREE.MeshBasicMaterial({ map: padTex(TEAMS[i].color, TEAMS[i].name), transparent: true, depthWrite: false })));
    p.rotation.x = -Math.PI / 2; p.position.set(CAR_X[i], 0.004, CAR_Z + 0.4); });
  // biển hiệu tường sau
  const signM = new THREE.MeshBasicMaterial({ map: signTex(), transparent: true, color: new THREE.Color(0.04, 0.04, 0.05), toneMapped: false });
  const sign = add(new THREE.Mesh(new THREE.PlaneGeometry(14, 3.5), signM)); sign.position.set(0, 5.6, BACK_Z - 0.25); sign.rotation.y = Math.PI;
  // ---------- đèn trần: 5 dãy LED (vật phát sáng + RectAreaLight hắt vệt sáng lên sơn xe) ----------
  const rowZ = [-12, -6, 0, 6, 12];
  const ledM = rowZ.map(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(0.05, 0.05, 0.06), toneMapped: false }));
  const rects = rowZ.map((z, k) => {
    [-6, 0, 6].forEach(x => { const m = add(new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.08, 0.32), ledM[k])); m.position.set(x, H - 1.25, z); });
    const r = new THREE.RectAreaLight(0xf2f5ff, 0, 18, 0.6); r.position.set(0, H - 1.3, z); r.lookAt(0, 0, z); add(r); return r;
  });
  const fill = add(new THREE.HemisphereLight("#cfd8ff", "#1a1b1f", 0.05));
  // đèn rọi 2 xe (màn chờ) + quầng sáng hình nón
  const spots = [0, 1].map(i => { const s = add(new THREE.SpotLight("#fff3e2", 120, 18, 0.38, 0.55, 2)); s.position.set(CAR_X[i], H - 1.2, CAR_Z + 1.5); s.target.position.set(CAR_X[i], 0, CAR_Z); add(s.target);
    s.castShadow = true; s.shadow.mapSize.set(1024, 1024); s.shadow.bias = -0.0004; return s; });
  const beamM = new THREE.MeshBasicMaterial({ color: "#fff1d8", transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const beams = [0, 1].map(i => { const g = new THREE.ConeGeometry(2.6, H - 1.2, 40, 1, true); g.translate(0, -(H - 1.2) / 2, 0); const m = add(new THREE.Mesh(g, beamM)); m.position.set(CAR_X[i], H - 1.2, CAR_Z + 1.2); m.rotation.x = -0.08; return m; });
  // bụi lơ lửng trong ánh đèn
  const dustG = new THREE.BufferGeometry(), DN = 900, dp = new Float32Array(DN * 3);
  for (let k = 0; k < DN; k++) { dp[k * 3] = (Math.random() - 0.5) * 22; dp[k * 3 + 1] = Math.random() * 7; dp[k * 3 + 2] = DOOR_Z + Math.random() * 30; }
  dustG.setAttribute("position", new THREE.BufferAttribute(dp, 3));
  const dustM = new THREE.PointsMaterial({ color: "#ffe9c8", size: 0.025, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending });
  const dust = add(new THREE.Points(dustG, dustM));

  // ---------- cửa cuốn: các lá thép ngang, kéo lên cuộn vào trục trên cửa ----------
  const SLATS = 26, slatH = DOOR_H / SLATS;
  const slatM = new THREE.MeshStandardMaterial({ color: "#8f959e", roughness: 0.42, metalness: 0.85 });
  const doorG = new THREE.Group(); add(doorG);
  const slats = Array.from({ length: SLATS }, (_, k) => { const m = new THREE.Mesh(new THREE.BoxGeometry(DOOR_W * 2 - 0.1, slatH * 0.92, 0.08), slatM); m.castShadow = true; doorG.add(m); return m; });
  box(DOOR_W * 2 + 0.6, 0.7, 0.9, steel, 0, DOOR_H + 0.35, DOOR_Z + 0.2);              // hộp trục cuộn
  const doorLightM = new THREE.MeshBasicMaterial({ color: "#ffb36b", transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const doorGlow = add(new THREE.Mesh(new THREE.PlaneGeometry(DOOR_W * 2, DOOR_H), doorLightM)); doorGlow.position.set(0, DOOR_H / 2, DOOR_Z + 0.3);
  let doorOpen = 0;
  function layDoor() { slats.forEach((m, k) => { const y = slatH * (k + 0.5) + doorOpen * DOOR_H; m.visible = y < DOOR_H - slatH * 0.2; m.position.set(0, y, DOOR_Z - 0.02); }); }
  layDoor();

  // ---------- môi trường phản chiếu: chụp xưởng bằng CubeCamera mỗi khi đèn/cửa đổi ----------
  const cubeRT = new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType }); const cubeCam = new THREE.CubeCamera(0.1, 400, cubeRT); cubeCam.position.set(0, 1.2, CAR_Z); scene.add(cubeCam);
  let envDirty = true;
  function refreshEnv() { const vis = []; cars.forEach(c => c && (vis.push(c.rig.visible), c.rig.visible = false)); cubeCam.update(renderer, scene); cars.forEach((c, i) => c && (c.rig.visible = vis[i])); scene.environment = cubeRT.texture; envDirty = false; }

  // ---------- xe ----------
  const U = { uBend: { value: new THREE.Vector2() }, uBendZ: { value: 0 } };
  const cars = [null, null], carIds = ids.slice(0, 2), heads = [null, null];
  function buildCar(i) {
    if (cars[i]) { scene.remove(cars[i].rig); cars[i].dispose(); }
    const c = makeCar3d({ id: carIds[i], color: TEAMS[i].color, num: i + 1, U });
    c.rig.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    c.rig.position.set(CAR_X[i], 0, CAR_Z); scene.add(c.rig); cars[i] = c;
    // đèn pha: 2 đèn rọi phía trước (bật khi nổ máy)
    const hl = new THREE.SpotLight("#e8f1ff", 0, 40, 0.5, 0.6, 1.6); hl.position.set(0, 0.7, -c.M.L / 2 + 0.2); hl.target.position.set(0, 0.3, -c.M.L / 2 - 30); c.body.add(hl, hl.target); heads[i] = hl;
    envDirty = true; paintPick();
  }
  async function setCar(i, id, notify = true) {
    carIds[i] = id; paintPick();
    await prepXe(id); if (carIds[i] !== id) return;
    buildCar(i); if (notify && onSetCar) onSetCar(i, id);
  }

  // ---------- UI chọn xe ----------
  const GROUPS = [["ITALIAN SUPERCARS", "Y"], ["HYPERCARS", "H"]];
  const picks = [0, 1].map(i => $(".ri-pick" + i));
  picks.forEach((p, i) => {
    p.querySelector(".ri-list").innerHTML = GROUPS.map(([t, pre]) => `<div class="ri-lh">${t}</div>` + XE.filter(x => x.id[0] === pre).map(x => `<button type="button" data-id="${x.id}">${x.name}</button>`).join("")).join("");
    p.querySelectorAll(".ri-pb").forEach(b => b.addEventListener("click", e => { e.stopPropagation(); closeLists(); const k = XE.findIndex(x => x.id === carIds[i]), n = XE.length; setCar(i, XE[(k + +b.dataset.d + n) % n].id); }));
    p.querySelector(".ri-pn").addEventListener("click", e => { e.stopPropagation(); const on = !p.classList.contains("is-list"); closeLists(); if (on) p.classList.add("is-list"); });
    p.querySelector(".ri-list").addEventListener("click", e => { const b = e.target.closest("button[data-id]"); if (!b) return; e.stopPropagation(); closeLists(); setCar(i, b.dataset.id); });
  });
  function closeLists() { picks.forEach(p => p.classList.remove("is-list")); }
  root.addEventListener("pointerdown", e => { if (!e.target.closest(".ri-pick")) closeLists(); });
  function paintPick() { picks.forEach((p, i) => { const x = XE.find(q => q.id === carIds[i]); if (!x) return; p.querySelector(".ri-pn b").textContent = x.name; p.querySelector(".ri-pn em").textContent = `${XE.indexOf(x) + 1} / ${XE.length} · ▾ ALL CARS`;
    p.querySelector(".ri-cred").textContent = `3D model: ${x.name} by ${x.author} · ${x.lic} · Sketchfab`;   // 3o: ghi công CC-BY
    p.querySelectorAll(".ri-list button").forEach(b => b.classList.toggle("is-on", b.dataset.id === x.id)); }); }
  $(".ri-start").addEventListener("click", () => play());
  $(".ri-skip").addEventListener("click", () => { if (state === "play") handoff(); });

  // ---------- trạng thái + kịch bản ----------
  let state = "idle", T = 0, lastT = 0, raf = 0, dead = false, hidden = false;
  const fired = new Set(), popT = [1.2, 2.6], popK = [0, 0], lit = rowZ.map(() => 0);
  let signK = 0, sunK = 0, engOn = [false, false];
  const cue = (name, team) => { const key = name + (team ?? ""); if (fired.has(key)) return false; fired.add(key); onCue(name, team); return true; };
  function resetScene() {
    fired.clear(); T = 0; doorOpen = 0; layDoor(); signK = 0; sunK = 0; engOn = [false, false]; lit.fill(0);
    cars.forEach((c, i) => { if (!c) return; c.rig.position.set(CAR_X[i], 0, CAR_Z); c.rig.rotation.set(0, 0, 0); });
    heads.forEach(h => h && (h.intensity = 0));
    root.classList.remove("is-play", "is-card", "is-big", "is-flash", "is-done"); root.classList.add("is-idle"); envDirty = true;
  }
  function play() { if (state === "play") return; closeLists(); resetScene(); state = "play"; root.classList.remove("is-idle"); root.classList.add("is-play"); onStart(); cue("start"); }
  function handoff() { if (state !== "play") return; state = "out"; cue("handoff"); onHandoff(); }
  function card(i) { const x = XE.find(q => q.id === carIds[i]); $(".ri-card small").textContent = TEAMS[i].name; $(".ri-card b").textContent = x ? x.name : ""; $(".ri-card").style.setProperty("--team", TEAMS[i].color);
    root.classList.remove("is-card"); void root.offsetWidth; root.classList.add("is-card"); }
  function pop(i, big = false) { popK[i] = big ? 1.4 : 1; cue("pop", i); }

  const exW = i => { const c = cars[i]; if (!c || !c.exhaust || !c.exhaust.length) return V(P(i).x, 0.5, P(i).z + 2.2); c.rig.updateMatrixWorld(true); const e = c.exhaust.reduce((a, q) => a.add(q), V(0, 0, 0)).multiplyScalar(1 / c.exhaust.length); return c.body.localToWorld(e); };
  // khung hình máy quay theo thời gian kịch bản (mỗi cảnh = vị trí/nhìn đầu → cuối, cắt cứng giữa cảnh)
  const P = i => cars[i] ? cars[i].rig.position : V(CAR_X[i], 0, CAR_Z);
  function shot(t) {
    const c0 = P(0), c1 = P(1), mid = V((c0.x + c1.x) / 2, 0, (c0.z + c1.z) / 2);
    if (state !== "play") { const a = performance.now() / 1000 * 0.12;            // màn chờ: lượn chậm trước mũi 2 xe
      return { pos: V(Math.sin(a) * 5.5, 1.35 + Math.sin(a * 0.7) * 0.25, CAR_Z - 7.2 + Math.cos(a) * 1.2), look: V(0, 0.75, CAR_Z), fov: 40 }; }
    const k = (a, b) => ease(clamp((t - a) / (b - a), 0, 1));
    if (t < 2.05) { const u = k(0, 2.05); return { pos: V(lerp(-9, -7, u), lerp(6.8, 6.2, u), lerp(14, 12, u)), look: V(0, 1.2, -4), fov: 48 }; }                      // 1 rộng từ góc sau, đèn bật
    if (t < 3.7) { const u = k(2.05, 3.7), e = exW(0); return { pos: V(e.x - 1.5 + u * 0.35, e.y + 0.05, e.z + 2.6 - u * 0.4), look: V(e.x + 0.15, e.y, e.z - 0.2), fov: 36 }; }     // 2 cận ống xả xe đội 1 (thấy lửa nổ máy)
    if (t < 5.25) { const u = k(3.7, 5.25); return { pos: V(c1.x + 2.6 - u * 0.5, 0.8, c1.z - 3.6 + u * 0.4), look: V(c1.x - 0.2, 0.7, c1.z), fov: 34 }; }            // 3 cận đầu 3/4 xe đội 2
    if (t < 7.6) { const u = k(5.25, 7.6); return { pos: V(0, lerp(0.7, 1.1, u), DOOR_Z - lerp(9, 7.5, u)), look: V(0, lerp(1.3, 1.0, u), CAR_Z), fov: 42 }; }       // 4 ngoài cửa nhìn vào, cửa cuốn lên
    if (t < 10.4) { const u = k(7.6, 10.4), cz = mid.z; return { pos: V(lerp(8.5, 7.2, u), lerp(1.0, 1.6, u), cz - 2.5), look: V(0, 0.7, cz - 1), fov: 46 }; }        // 5 lia ngang theo xe lao ra
    const u = k(10.4, START_T.end); return { pos: V(0.6, 0.35, -52), look: V(lerp(0, 0.4, u), lerp(0.6, 1.4, u), mid.z), fov: 30 };                                  // 6 thấp trước mặt, xe vút qua
  }
  function carZ(t) { if (t < START_T.roll) return CAR_Z; const s = t - START_T.roll; return CAR_Z - 0.5 * 9.5 * s * s - 2 * s; }   // tăng tốc ra cửa

  function update(dt) {
    const t = T;
    if (state === "play") {
      START_T.lights.forEach((at, k) => { if (t >= at && cue("lights", k)) { lit[k] = 1; envDirty = true; } });
      if (t >= START_T.sign && cue("sign")) envDirty = true;
      if (t >= START_T.eng0 && cue("engine", 0)) { engOn[0] = true; pop(0, true); card(0); }
      if (t >= START_T.eng0 + 0.45 && cue("pop2", 0)) pop(0);
      if (t >= START_T.eng1 && cue("engine", 1)) { engOn[1] = true; pop(1, true); card(1); }
      if (t >= START_T.eng1 + 0.4 && cue("pop2", 1)) pop(1);
      if (t >= START_T.door) cue("door");
      if (t >= START_T.roll) cue("rollout");
      if (t >= START_T.title && cue("title")) { root.classList.remove("is-big"); void root.offsetWidth; root.classList.add("is-big"); }
      if (t >= START_T.flyby) cue("flyby");
      if (t >= START_T.flash && cue("flash")) root.classList.add("is-flash");
      if (t >= START_T.end) handoff();
      doorOpen = ease(clamp((t - START_T.door) / (START_T.doorEnd - START_T.door), 0, 1)); layDoor();
      if (doorOpen > 0 && doorOpen < 1 && Math.random() < 0.08) envDirty = true;
      signK = smooth(START_T.sign, START_T.sign + 0.25, t) * (t < START_T.sign + 0.25 ? (Math.random() < 0.5 ? 0.3 : 1) : 1);   // biển nháy rồi sáng hẳn
      sunK = doorOpen;
    } else { // màn chờ: pô thỉnh thoảng nổ
      [0, 1].forEach(i => { popT[i] -= dt; if (popT[i] <= 0) { popT[i] = 2.4 + Math.random() * 3.6; pop(i); if (Math.random() < 0.4) setTimeout(() => state === "idle" && pop(i), 170); } });
    }
    // đèn
    rects.forEach((r, k) => { const on = state === "play" ? lit[k] : 0; r.intensity = lerp(r.intensity, on ? 7 : 0, on ? 0.6 : 0.2); ledM[k].color.setScalar(on ? 3.2 : 0.05); });
    signM.color.setScalar(state === "play" ? 0.05 + signK * 2.4 : 0.06);
    const idleK = state === "play" ? 1 - smooth(0.2, 1.6, t) * 0.75 : 1;
    spots.forEach(s => s.intensity = 120 * idleK); beamM.opacity = 0.05 * idleK;
    fill.intensity = state === "play" ? 0.05 + 0.35 * smooth(0.2, 1.6, t) : 0.05;
    sun.intensity = 3.2 * sunK; doorLightM.opacity = 0.35 * sunK * (1 - smooth(START_T.roll, START_T.roll + 1.2, t));
    scene.fog.color.setRGB(lerp(0.043, 0.6, sunK * 0.35), lerp(0.047, 0.42, sunK * 0.35), lerp(0.063, 0.3, sunK * 0.35)); scene.fog.density = lerp(0.012, 0.006, sunK);
    // xe
    cars.forEach((c, i) => {
      if (!c) return;
      const z = state === "play" ? carZ(t) + (i ? -0.4 : 0) : CAR_Z; const dist = CAR_Z - z;
      c.rig.position.z = z;
      popK[i] = Math.max(0, popK[i] - dt * 4.5);
      const rolling = state === "play" && t >= START_T.roll;
      const boost = rolling ? clamp(0.55 + 0.4 * Math.sin(t * 9 + i), 0.3, 1) : 0;
      c.update(dt, { dist, accel: rolling ? 9.5 : 0, steer: 0, boost, t: performance.now() / 1000, pop: Math.min(1, popK[i]) });
      if (heads[i]) heads[i].intensity = lerp(heads[i].intensity, engOn[i] ? 4 : 0, 0.15);
    });
    // bụi trôi
    const a = dustG.attributes.position; for (let k = 0; k < DN; k += 7) { a.array[k * 3 + 1] += 0.004; if (a.array[k * 3 + 1] > 7) a.array[k * 3 + 1] = 0; } a.needsUpdate = true;
    dustM.opacity = 0.35 + 0.4 * sunK;
    // máy quay
    const s = shot(t); cam.position.copy(s.pos); cam.lookAt(s.look); if (cam.fov !== s.fov) { cam.fov = s.fov; cam.updateProjectionMatrix(); }
    if (state === "play" && t >= START_T.flyby - 0.2 && t < START_T.flash) { cam.position.x += (Math.random() - 0.5) * 0.06; cam.position.y += (Math.random() - 0.5) * 0.05; }
  }
  function fit() { const w = root.clientWidth, h = root.clientHeight; if (!w || !h) return; const pr = renderer.getPixelRatio();
    if (cv.width !== Math.round(w * pr) || cv.height !== Math.round(h * pr)) { renderer.setSize(w, h, false); composer.setSize(w, h); cam.aspect = w / h; cam.updateProjectionMatrix(); } }
  function loop(now) {
    if (dead) return; raf = requestAnimationFrame(loop);
    if (hidden) { lastT = 0; return; }
    const dt = Math.min(0.05, lastT ? (now - lastT) / 1000 : 1 / 60); lastT = now;
    if (state === "play") T += dt;
    fit(); update(dt);
    if (envDirty) refreshEnv();
    composer.render();
  }
  raf = requestAnimationFrame(loop);

  const ready = Promise.all(carIds.map((id, i) => prepXe(id).then(() => buildCar(i))));
  return {
    ready, setCar, get cars() { return carIds.slice(); }, get state() { return state; },
    show() { hidden = false; state = "idle"; resetScene(); root.style.display = ""; },
    hide() { hidden = true; root.style.display = "none"; },
    play, skip: handoff,
    step(n = 1, dt = 1 / 60) { for (let k = 0; k < n; k++) { if (state === "play") T += dt; update(dt); } fit(); if (envDirty) refreshEnv(); composer.render(); },
    seek(t) { if (state !== "play") play(); T = 0; while (T < t) { T += 1 / 30; update(1 / 30); } fit(); refreshEnv(); composer.render(); },
    destroy() { dead = true; cancelAnimationFrame(raf); cars.forEach(c => c && c.dispose()); composer.dispose(); cubeRT.dispose(); renderer.dispose(); renderer.forceContextLoss(); root.remove(); },   // 3o: trả card đồ hoạ
    root, scene, cam,
  };
}
