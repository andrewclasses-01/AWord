// ⭐ ĐỢT 523 (thầy 14/10/2026: "iPad khá nóng khi chơi Rocket Race — trên iPad không cần mượt") — GIẢM TẢI GPU (đo scratch/dot523-nhiet-ipad.html,
//   bảng 1024×768 ×2, truy vấn giờ GPU): vẽ PAD_FPS = 25 khung/giây (trước 60 — hoạt cảnh theo dt nên chỉ thưa khung) · độ nét tối đa PR_MAX = 1,5
//   (trước 2 ⇒ ít hơn 44 % điểm ảnh; ms GPU/khung 0,549 → 0,30) · TẮT antialias của canvas (ảnh đã qua bloom/OutputPass, khử răng cưa ở khung
//   cuối chỉ tốn thêm ~27 %: 0,549 → 0,401). Gộp lại: tải GPU mỗi giây ≈ 0,225 ms × 25 so với 0,549 ms × 60 ⇒ còn ~17 %.
// ⭐ ĐỢT 514 (thầy 14/10/2026, duyệt MẪU 11 ở myGame `fdc7fa3`) — BẢNG TÊN LỬA TRÊN iPAD THIẾT KẾ LẠI (thay bảng gương mẫu 9 của Đợt 511).
// Bản chép để tra ở myGame: rocket-race/core/rr-padscene-11.js (chỉ khác đường import three).
//   · BOOST sát mép TRÁI · cột vạch năng lượng (mảnh) ở giữa · 2 tên lửa to MŨI LÊN TRÊN sát mép PHẢI (ô trống để trống, không bóng mờ)
//   · hàng tên lửa con sát mép dưới: ∞ ⇒ 10 ô căn TRÁI + "+x" · giới hạn ⇒ (Missiles max − 2) ô căn GIỮA, ô chưa có quả = bóng mờ
//   · chạm quả to nào ⇒ bắn ĐÚNG quả đó (gửi "fire0"/"fire1") · BOOST ⇒ "boost". Không còn chạm hàng con để nạp (game tự nạp).
//   · máy chiếu báo ô j sang "firing" ⇒ quả đó ĐÁNH LỬA (khói cuộn ở bệ) rồi bay TỪ TỪ lên quá mép trên màn, đuôi phụt lửa + khói,
//     để lại khói mù tan dần ~5 s. Trong lúc quả còn trên màn, ô đó KHÔNG hiện quả mới.
//   · quả to bay khỏi màn rồi ⇒ quả con cuối hàng VÚT lên (0,32 s, vệt mờ + thân kéo dài), lúc rời hàng chỉ hiện phần ĐUÔI rồi đỏ dần
//     lên mũi; độ đầy đuổi kịp số nạp thật của game ⇒ sẵn sàng ĐÚNG lúc game sẵn sàng (tổng thời gian như kiểu cũ: game bắn ⇒ 0,75 s
//     xoay trên bệ ⇒ quả kế 0,5 s bay sang + 2 s nạp ≈ 3,6 s; iPad: 2,1 s bay lên + phần nạp còn lại).
//   createPadScene({ mount, team, onKey, topEl }) ⇒ { setInfo(o), event(name), step(sec), debug, destroy() }
//   o = rrPadState() của trang game: ph, ar { on, max(−1 = ∞), reserve, loaded, pips, pipsMax, full, boost, boostPips, boostMax, locked },
//   sl [[st, k], [st, k]] (empty · shuttle · charge · ready · queued · firing), thr (giây tới lúc nổ, −1 = không), win, pc (PEACE).
import * as THREE from "./vendor/three/three.module.min.js";
import { EffectComposer } from "./vendor/three/addons/EffectComposer.js";
import { RenderPass } from "./vendor/three/addons/RenderPass.js";
import { UnrealBloomPass } from "./vendor/three/addons/UnrealBloomPass.js";
import { OutputPass } from "./vendor/three/addons/OutputPass.js";
import { RoomEnvironment } from "./vendor/three/addons/RoomEnvironment.js";

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const easeOutBack = t => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };

// nhịp của game (rr3d-missile.js): SHUTTLE 0,5 s · MC.charge 2 s — dùng để tự chạy tiếp giữa 2 lần máy chiếu gửi
const G_SHUTTLE = 0.5, G_CHARGE = 2;
const FLY = { ign: 0.5, rise: 1.6 };            // đánh lửa (khói cuộn ở bệ) ⇒ bay lên quá mép trên
const LOAD_T = 0.32, LOAD_K0 = 0.14, CATCH_T = 0.9;
const BOOST_N = 5;

function radialTex(stops, size = 128) {
  const c = document.createElement("canvas"); c.width = c.height = size;
  const g = c.getContext("2d"), gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([o, col]) => gr.addColorStop(o, col)); g.fillStyle = gr; g.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}
function roundRectGeo(w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  const x = -w / 2, y = -h / 2, sh = new THREE.Shape();
  sh.moveTo(x + r, y); sh.lineTo(x + w - r, y); sh.quadraticCurveTo(x + w, y, x + w, y + r);
  sh.lineTo(x + w, y + h - r); sh.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  sh.lineTo(x + r, y + h); sh.quadraticCurveTo(x, y + h, x, y + h - r);
  sh.lineTo(x, y + r); sh.quadraticCurveTo(x, y, x + r, y);
  return new THREE.ShapeGeometry(sh, 8);
}

const PAD_FPS = 25, PR_MAX = 1.5;   // Đợt 523: iPad nóng ⇒ thưa khung + bớt điểm ảnh
export function createPadScene({ mount, team, onKey, topEl }) {
  const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });   // Đợt 523: tắt — ảnh đã qua bloom
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;touch-action:none;display:block";
  mount.append(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x03050b);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.45;
  const FOV = 24, VH = 100;                                         // khung nhìn ở z = 0 cao đúng 100 đơn vị
  const camera = new THREE.PerspectiveCamera(FOV, 1, 1, 2000);
  camera.position.set(0, 0, (VH / 2) / Math.tan(THREE.MathUtils.degToRad(FOV / 2)));
  const keyL = new THREE.DirectionalLight(0xfff1e0, 3.2); keyL.position.set(30, 40, 60); scene.add(keyL);
  scene.add(new THREE.AmbientLight(0x8090b0, 0.35));
  const fireLight = new THREE.PointLight(0xff8a3a, 0, 60, 1.6); scene.add(fireLight);
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(16, 16), 0.6, 0.5, 1.05);
  composer.addPass(bloom); composer.addPass(new OutputPass());
  { const g = new THREE.BufferGeometry(), n = 220, p = new Float32Array(n * 3);   // vài ngôi sao mờ
    for (let i = 0; i < n; i++) { p[i * 3] = rand(-160, 160); p[i * 3 + 1] = rand(-80, 80); p[i * 3 + 2] = rand(-300, -60); }
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0x8090c0, size: 1.1, transparent: true, opacity: 0.5 }))); }

  // ---------------------------------------------------------------- mô hình tên lửa (CHÉP rr3d-missile.js — dọc +X, dài 2,32 đv)
  const mRed = new THREE.MeshPhysicalMaterial({ color: "#d4121e", metalness: 0.35, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.08,
    emissive: new THREE.Color("#ff1a24"), emissiveIntensity: 0.22, envMapIntensity: 0.8 });
  const mRedDark = new THREE.MeshPhysicalMaterial({ color: "#8e0b14", metalness: 0.4, roughness: 0.35, clearcoat: 0.8, emissive: new THREE.Color("#ff1a24"), emissiveIntensity: 0.1 });
  const mWhite = new THREE.MeshPhysicalMaterial({ color: "#eef0f3", metalness: 0.2, roughness: 0.35, clearcoat: 0.6 });
  const mDark = new THREE.MeshStandardMaterial({ color: "#2b3039", metalness: 0.85, roughness: 0.32 });
  const mGlow = new THREE.MeshBasicMaterial({ color: new THREE.Color(4.2, 0.35, 0.25) });
  const mGhost = new THREE.MeshBasicMaterial({ color: new THREE.Color("#8fa0c0"), transparent: true, opacity: 0.16, depthWrite: false });
  const mHit = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
  // PEACE (Đợt 441): tên lửa đổi XANH LÁ — như game
  const PAL = { war: { body: "#d4121e", emis: "#ff1a24", dark: "#8e0b14", glow: [4.2, 0.35, 0.25], halo: [4, 0.5, 0.35], label: "#ff6a6a" },
    peace: { body: "#17a34a", emis: "#22ff66", dark: "#0b6b2c", glow: [0.3, 4.2, 0.6], halo: [0.45, 4, 0.6], label: "#6dff9e" } };
  let peace = false;
  const fillSets = [];                                              // vật liệu "đổ đầy" của 2 quả to (đổi màu theo PEACE)
  const alongX = g => { g.rotateZ(-Math.PI / 2); return g; };
  const lat = (pts, segs = 32) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), segs);
  const GEO = (() => {
    const nosePts = []; for (let i = 0; i <= 12; i++) { const y = i / 12 * 0.62; nosePts.push([Math.max(0.001, 0.2 * Math.pow(1 - Math.pow(y / 0.62, 2), 0.55)), y]); }
    const fs = new THREE.Shape(); fs.moveTo(0, 0); fs.lineTo(0.46, 0); fs.lineTo(0.3, 0.3); fs.lineTo(0.08, 0.3); fs.closePath();
    const fin = new THREE.ExtrudeGeometry(fs, { depth: 0.035, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2 });
    fin.translate(-1.1, 0.17, -0.0175);
    return {
      body: alongX(new THREE.CylinderGeometry(0.2, 0.2, 1.5, 32)).translate(-0.2, 0, 0),
      nose: alongX(lat(nosePts)).translate(0.55, 0, 0),
      band: alongX(new THREE.CylinderGeometry(0.204, 0.204, 0.07, 32, 1, true)),
      glow: alongX(new THREE.CylinderGeometry(0.207, 0.207, 0.045, 32, 1, true)).translate(-0.86, 0, 0),
      tail: alongX(lat([[0.001, -0.2], [0.13, -0.2], [0.17, -0.12], [0.2, 0]])).translate(-0.95, 0, 0),
      fin
    };
  })();
  const BAND_GEO = [0.43, -0.72].map(x => GEO.band.clone().translate(x, 0, 0));
  function makeMissile(M = { body: mRed, dark: mRedDark, white: mWhite, tail: mDark, glow: mGlow }) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(GEO.body, M.body), new THREE.Mesh(GEO.nose, M.body), new THREE.Mesh(GEO.tail, M.tail), new THREE.Mesh(GEO.glow, M.glow));
    BAND_GEO.forEach(geo => g.add(new THREE.Mesh(geo, M.white)));
    for (let k = 0; k < 4; k++) { const f = new THREE.Mesh(GEO.fin, M.dark); f.rotation.x = k * Math.PI / 2 + Math.PI / 4; g.add(f); }
    return g;
  }
  const ghostMissile = () => { const g = makeMissile(); g.traverse(o => { if (o.isMesh) o.material = mGhost; }); return g; };
  const FILL_SOFT = 0.22;                                           // "đổ đầy đỏ từ đuôi lên mũi" — y như game (Đợt 454b)
  function fillMat(base, uFill) {
    const m = base.clone(); m.transparent = true;
    m.onBeforeCompile = sh => {
      sh.uniforms.uFill = uFill;
      sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying float vLX;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvLX = position.x;");
      sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nvarying float vLX;\nuniform float uFill;")
        .replace("#include <color_fragment>", `#include <color_fragment>
          diffuseColor.a *= 1.0 - smoothstep(uFill - ${FILL_SOFT.toFixed(3)}, uFill + ${FILL_SOFT.toFixed(3)}, vLX);
          if (diffuseColor.a < 0.01) discard;`)
        .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
          totalEmissiveRadiance += vec3(1.6, 0.45, 0.3) * (1.0 - smoothstep(0.0, ${(FILL_SOFT * 1.2).toFixed(3)}, abs(vLX - uFill))) * step(uFill, 1.3);`);
    };
    m.customProgramCacheKey = () => "awFill454";
    return m;
  }
  const upright = g => { g.rotation.order = "ZYX"; g.rotation.z = Math.PI / 2; return g; };   // ZYX ⇒ rotation.x = xoay quanh CHÍNH trục dọc quả
  const BIG_K = 0.85;
  const fat = (g, k) => g.scale.set(k, k * 1.35, k * 1.35);          // quả trong bảng mập hơn cho dễ nhìn (như game)
  const flareTex = radialTex([[0, "rgba(255,255,255,1)"], [0.2, "rgba(255,220,190,0.9)"], [0.5, "rgba(255,90,60,0.3)"], [1, "rgba(0,0,0,0)"]], 128);
  const softTex = radialTex([[0, "rgba(255,255,255,0.95)"], [0.35, "rgba(255,255,255,0.55)"], [0.7, "rgba(255,255,255,0.15)"], [1, "rgba(255,255,255,0)"]], 128);

  // ---------------------------------------------------------------- dựng bảng (đơn vị cảnh — khung nhìn cao 100)
  const root = new THREE.Group(); scene.add(root);
  const cluster = new THREE.Group(); root.add(cluster);             // BOOST · cột vạch · 2 tên lửa
  const rowG = new THREE.Group(); root.add(rowG);                    // hàng tên lửa con
  const BAR_H = 32, BAR_W = 2.2, BTN = 40, BIG_LEN = 50, BIG_PITCH = 28, GAP = 9;
  const BIG_SC = BIG_LEN / 2.32;
  let xBtn = 0, xBar = 0; const xBigs = [0, 0];                       // layout() đặt theo bề rộng màn

  // --- BOOST: nút vuông bo góc + 5 vạch trong + icon 2 mũi tên kép — như game, to hơn
  const bst = new THREE.Group(); cluster.add(bst);
  const btnRimMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.2, 0.9, 1.2), transparent: true, opacity: 0.5, depthWrite: false });
  const btnFaceMat = new THREE.MeshBasicMaterial({ color: new THREE.Color("#0b1624"), transparent: true, opacity: 0.9, depthWrite: false });
  const btn = new THREE.Group(); bst.add(btn);
  const rim = new THREE.Mesh(roundRectGeo(BTN, BTN, BTN * 0.22), btnRimMat); rim.renderOrder = 20;
  const face = new THREE.Mesh(roundRectGeo(BTN * 0.92, BTN * 0.92, BTN * 0.19), btnFaceMat); face.position.z = 0.01; face.renderOrder = 21;
  btn.add(rim, face);
  const pipsB = [];
  { const inW = BTN * 0.78, inH = BTN * 0.78, gap = inW * 0.04, w = (inW - gap * (BOOST_N - 1)) / BOOST_N;
    for (let i = 0; i < BOOST_N; i++) {
      const x = -inW / 2 + w / 2 + i * (w + gap);
      const back = new THREE.Mesh(roundRectGeo(w, inH, w * 0.3), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.03, 0.09, 0.14), transparent: true, opacity: 0.9, depthWrite: false }));
      back.position.set(x, 0, 0.02); back.renderOrder = 22;
      const fm = new THREE.MeshBasicMaterial({ color: new THREE.Color(0, 0.55, 0.78), transparent: true, opacity: 0, depthWrite: false });
      const f = new THREE.Mesh(roundRectGeo(w, inH, w * 0.3), fm); f.position.set(x, 0, 0.03); f.renderOrder = 23;
      btn.add(back, f); pipsB.push({ fm, k: 0 });
    } }
  const iconTex = (() => { const cv = document.createElement("canvas"); cv.width = cv.height = 256; const g = cv.getContext("2d");
    g.strokeStyle = "#fff"; g.lineCap = "round"; g.lineJoin = "round"; g.lineWidth = 30;
    [166, 112].forEach(y => { g.beginPath(); g.moveTo(66, y + 42); g.lineTo(128, y - 20); g.lineTo(190, y + 42); g.stroke(); });
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const iconMat = new THREE.MeshBasicMaterial({ map: iconTex, color: new THREE.Color(0.35, 0.6, 0.75), transparent: true, opacity: 0.55, depthWrite: false });
  const icon = new THREE.Mesh(new THREE.PlaneGeometry(BTN * 0.66, BTN * 0.66), iconMat); icon.position.z = 0.04; icon.renderOrder = 24; btn.add(icon);
  const bGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: flareTex, color: new THREE.Color(0.2, 1.6, 2.2), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
  bGlow.scale.set(BTN * 2.2, BTN * 2.2, 1); bGlow.position.z = -0.5; bst.add(bGlow);
  const nowCv = document.createElement("canvas"); nowCv.width = 768; nowCv.height = 128;
  const nowTex = new THREE.CanvasTexture(nowCv); nowTex.colorSpace = THREE.SRGBColorSpace;
  const paintNow = () => { const g = nowCv.getContext("2d"); g.clearRect(0, 0, 768, 128); g.font = '900 78px "Exo 2", sans-serif'; g.textAlign = "center"; g.textBaseline = "middle";
    g.shadowColor = "rgba(0,200,255,.9)"; g.shadowBlur = 16; g.fillStyle = "#fff"; g.fillText("BOOST NOW!", 384, 66); nowTex.needsUpdate = true; };
  paintNow(); if (document.fonts && document.fonts.ready) document.fonts.ready.then(paintNow).catch(() => {});
  const boostNow = new THREE.Sprite(new THREE.SpriteMaterial({ map: nowTex, transparent: true, depthWrite: false, opacity: 0 }));
  boostNow.material.toneMapped = false; boostNow.scale.set(BTN * 1.5, BTN * 0.25, 1); boostNow.position.set(0, -BTN * 0.68, 1); boostNow.renderOrder = 30; bst.add(boostNow);
  const hitBoost = new THREE.Mesh(new THREE.PlaneGeometry(BTN * 1.2, BTN * 1.2), mHit); hitBoost.position.z = 2; hitBoost.userData.k = "boost"; bst.add(hitBoost);

  // --- CỘT VẠCH NĂNG LƯỢNG (giữa, mảnh) — sáng từ dưới lên, đủ vạch ⇒ +1 tên lửa con
  const barG = new THREE.Group(); cluster.add(barG);
  let barPips = [], barN = -1, barFlash = 0;
  function buildBar(n) {
    barG.children.slice().forEach(o => { barG.remove(o); o.geometry.dispose(); o.material.dispose(); });
    barPips = []; barN = n;
    if (n <= 0) return;
    const gap = Math.min(BAR_H * 0.03, BAR_H / n * 0.16), h = (BAR_H - gap * (n - 1)) / n;
    for (let i = 0; i < n; i++) {
      const y = -BAR_H / 2 + h / 2 + i * (h + gap);
      const back = new THREE.Mesh(roundRectGeo(BAR_W, h, Math.min(BAR_W, h) * 0.5), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.16, 0.17, 0.2), transparent: true, opacity: 0.85, depthWrite: false }));
      back.position.y = y; back.renderOrder = 21;
      const fm = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 1.55, 1.65), transparent: true, opacity: 0, depthWrite: false });
      const f = new THREE.Mesh(roundRectGeo(BAR_W, h, Math.min(BAR_W, h) * 0.5), fm); f.position.set(0, y, 0.02); f.renderOrder = 22;
      barG.add(back, f); barPips.push({ back, fm, k: 0 });
    }
  }

  // --- 2 TÊN LỬA TO (mũi lên) — lớp đỏ "đổ đầy" từ đuôi lên mũi + quầng sáng khi sẵn sàng · vệt mờ khi quả con vút lên
  const bigs = [0, 1].map(j => {
    const g = new THREE.Group(); cluster.add(g);
    const uFill = { value: 9 };
    const mats = { body: fillMat(mRed, uFill), dark: fillMat(mRedDark, uFill), white: fillMat(mWhite, uFill), tail: fillMat(mDark, uFill), glow: mGlow };
    fillSets.push(mats);
    const red = makeMissile(mats); upright(red); fat(red, BIG_SC * BIG_K); red.visible = false; g.add(red);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: flareTex, color: new THREE.Color(4, 0.5, 0.35), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
    glow.scale.set(BIG_PITCH * 1.25, BIG_LEN * 1.15, 1); glow.position.z = -1; g.add(glow);
    const hit = new THREE.Mesh(new THREE.PlaneGeometry(BIG_PITCH * 0.98, BIG_LEN * 1.05), mHit); hit.position.z = 3; hit.userData.k = "fire" + j; g.add(hit);
    const trail = Array.from({ length: 6 }, () => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex, color: new THREE.Color(2.4, 0.45, 0.32),
      blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 })); sp.visible = false; sp.renderOrder = 4; g.add(sp); return sp; });
    // d = cách hiện: "none" | "load" (đang vút lên + đuổi kịp số nạp) | "show" · fly = quả của ô này còn bay trên màn
    // after = quả vừa bay khỏi màn ⇒ quả kế (dù game đã nạp xong) vẫn phải VÚT lên từ hàng con cho thấy
    return { g, red, glow, uFill, trail, hit, d: "none", mv: null, k: 0, flash: 0, rot: rand(0, 6), fly: false, after: false };
  });
  function setPeace(on) {
    peace = !!on; const p = peace ? PAL.peace : PAL.war;
    [mRed, ...fillSets.map(m => m.body)].forEach(m => { m.color.set(p.body); m.emissive.set(p.emis); });
    [mRedDark, ...fillSets.map(m => m.dark)].forEach(m => { m.color.set(p.dark); m.emissive.set(p.emis); });
    mGlow.color.setRGB(...p.glow);
    bigs.forEach(B => B.glow.material.color.setRGB(...p.halo));
    plusN = -1;
  }

  // --- HÀNG TÊN LỬA CON (sát mép dưới) — 10 ô + chỗ cho "+x"
  const ROW_N = 10, MINI_LEN = 11, MINI_PITCH = 8.6, PLUS_W = 13;
  const MINI_SC = MINI_LEN / 2.32, ROW_W = ROW_N * MINI_PITCH + PLUS_W;
  const minis = Array.from({ length: ROW_N }, () => {
    const g = new THREE.Group(); rowG.add(g);
    const m = makeMissile(); upright(m); fat(m, MINI_SC * BIG_K); g.add(m);
    const gh = ghostMissile(); upright(gh); fat(gh, MINI_SC * BIG_K); g.add(gh);
    return { g, m, gh, pop: 0, was: false, rot: rand(0, 6) };
  });
  const plusCv = document.createElement("canvas"); plusCv.width = 256; plusCv.height = 128;
  const plusTex = new THREE.CanvasTexture(plusCv); plusTex.colorSpace = THREE.SRGBColorSpace;
  const plus = new THREE.Sprite(new THREE.SpriteMaterial({ map: plusTex, transparent: true, depthWrite: false })); plus.scale.set(PLUS_W * 1.15, PLUS_W * 0.575, 1); plus.renderOrder = 25; rowG.add(plus);
  let plusN = -1;
  const rowLine = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.25), new THREE.MeshBasicMaterial({ color: 0x334155, transparent: true, opacity: 0.7, depthWrite: false })); rowG.add(rowLine);

  // ---------------------------------------------------------------- KHÓI: một hệ hạt Points (1 lần vẽ — nhẹ cho iPad)
  const SMOKE_N = 900;
  const sPos = new Float32Array(SMOKE_N * 3), sCol = new Float32Array(SMOKE_N * 3), sSize = new Float32Array(SMOKE_N), sA = new Float32Array(SMOKE_N);
  const sGeo = new THREE.BufferGeometry();
  sGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3)); sGeo.setAttribute("color", new THREE.BufferAttribute(sCol, 3));
  sGeo.setAttribute("size", new THREE.BufferAttribute(sSize, 1)); sGeo.setAttribute("alpha", new THREE.BufferAttribute(sA, 1));
  const sMat = new THREE.ShaderMaterial({
    uniforms: { map: { value: softTex }, scale: { value: 400 } },
    vertexShader: `attribute float size; attribute float alpha; attribute vec3 color; varying float vA; varying vec3 vC; uniform float scale;
      void main(){ vA = alpha; vC = color; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = size * scale / -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform sampler2D map; varying float vA; varying vec3 vC;
      void main(){ vec4 t = texture2D(map, gl_PointCoord); float a = t.a * vA; if (a < 0.004) discard; gl_FragColor = vec4(vC, a); }`,
    transparent: true, depthWrite: false,
  });
  const smokePts = new THREE.Points(sGeo, sMat); smokePts.frustumCulled = false; smokePts.renderOrder = 5; scene.add(smokePts);
  const P = Array.from({ length: SMOKE_N }, () => ({ life: 0, max: 1, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, s0: 1, s1: 4, hot: 0, a: 1 }));
  let pI = 0, smokeLive = false;
  function puff(x, y, z, vx, vy, vz, s0, s1, life, hot, a = 1) {
    const p = P[pI = (pI + 1) % SMOKE_N];
    p.x = x; p.y = y; p.z = z; p.vx = vx; p.vy = vy; p.vz = vz; p.s0 = s0; p.s1 = s1; p.max = life; p.life = life; p.hot = hot; p.a = a;
    smokeLive = true;
  }
  function stepSmoke(dt) {
    if (!smokeLive) return;
    const drag = Math.pow(0.18, dt); let any = false;
    for (let i = 0; i < SMOKE_N; i++) {
      const p = P[i];
      if (p.life <= 0) { sA[i] = 0; continue; }
      p.life -= dt; if (p.life <= 0) { sA[i] = 0; continue; }
      any = true;
      const k = 1 - p.life / p.max;
      p.vx *= drag; p.vy = p.vy * drag + 1.6 * dt; p.vz *= drag;
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      sPos[i * 3] = p.x; sPos[i * 3 + 1] = p.y; sPos[i * 3 + 2] = p.z;
      sSize[i] = lerp(p.s0, p.s1, 1 - Math.pow(1 - k, 2.2));
      const heat = Math.max(0, p.hot - k * 2.6);                       // nóng ⇒ cam sáng, nguội ⇒ xám
      sCol[i * 3] = lerp(0.55, 3.2, heat); sCol[i * 3 + 1] = lerp(0.56, 1.5, heat); sCol[i * 3 + 2] = lerp(0.6, 0.5, heat);
      sA[i] = (k < 0.08 ? k / 0.08 : 1) * Math.pow(1 - k, 1.3) * (0.55 + 0.25 * (1 - heat)) * p.a;
    }
    smokeLive = any;
    sGeo.attributes.position.needsUpdate = sGeo.attributes.color.needsUpdate = sGeo.attributes.size.needsUpdate = sGeo.attributes.alpha.needsUpdate = true;
  }

  // ---------------------------------------------------------------- PHÓNG (quả rời ô j): đánh lửa + khói bệ ⇒ bay từ từ lên quá mép trên
  function makeFlame() {
    const g = new THREE.Group();
    const coneGeo = new THREE.ConeGeometry(0.15, 1.2, 20, 1, true); coneGeo.rotateZ(Math.PI); coneGeo.translate(0, -0.6, 0);   // đáy ở vòi phun, đỉnh chĩa xuống
    const outer = new THREE.Mesh(coneGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 1.4, 0.4), transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    const inner = new THREE.Mesh(coneGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 4.2, 3), transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    inner.scale.set(0.55, 0.6, 0.55);
    const flare = new THREE.Sprite(new THREE.SpriteMaterial({ map: flareTex, color: new THREE.Color(5, 2.4, 1.1), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    g.add(outer, inner, flare);
    return { g, outer, inner, flare };
  }
  const flyPool = [], flights = [];
  function launch(j) {
    const B = bigs[j], wp = new THREE.Vector3();
    B.g.updateWorldMatrix(true, false); B.g.getWorldPosition(wp);
    let h = flyPool.pop();
    if (!h) { const m = makeMissile(); upright(m); const g = new THREE.Group(); g.add(m); const fl = makeFlame(); g.add(fl.g); scene.add(g); h = { g, m, fl }; }
    const sc = BIG_SC * BIG_K * cluster.scale.x;
    fat(h.m, sc); h.m.rotation.x = B.red.rotation.x; h.g.visible = true; h.g.position.copy(wp); h.g.rotation.set(0, 0, 0);
    const tailY = -1.15 * sc; h.fl.g.position.set(0, tailY, 0); h.fl.g.scale.setScalar(0.001);
    flights.push({ j, t: 0, h, x0: wp.x, y0: wp.y, sc, tailY, top: VH / 2 + BIG_LEN * cluster.scale.x * 0.7 - wp.y });
    B.fly = true; B.after = false; B.d = "none"; B.mv = null; B.red.visible = false; B.trail.forEach(m => { m.visible = false; });
  }
  function stepFlights(dt) {
    let light = 0, lx = 0, ly = 0;
    for (let i = flights.length - 1; i >= 0; i--) {
      const f = flights[i]; f.t += dt;
      const fl = f.h.fl, ig = f.t < FLY.ign, tr = Math.max(0, f.t - FLY.ign);
      const a = 2 * f.top / (FLY.rise * FLY.rise);                     // gia tốc đều ⇒ bay lên NHANH DẦN
      const y = f.y0 + 0.5 * a * tr * tr;
      const shake = ig ? Math.sin(f.t * 90) * 0.12 * (f.t / FLY.ign) : Math.sin(f.t * 47) * 0.06;
      f.h.g.position.set(f.x0 + shake + Math.sin(tr * 3.1) * 0.25 * tr, y, 0.5);
      f.h.g.rotation.z = Math.sin(tr * 2.3) * 0.015 * tr;
      const v = a * tr, grow = ig ? smooth(f.t / FLY.ign) : 1, flick = 0.85 + 0.3 * Math.random();
      const len = f.sc * (0.55 + Math.min(0.75, v / 90)) * grow * flick, wid = f.sc * 1.05 * grow * (0.9 + 0.2 * Math.random());
      fl.g.scale.setScalar(1);
      fl.outer.scale.set(wid, len, wid); fl.inner.scale.set(wid * 0.55, len * 0.6, wid * 0.55);
      fl.flare.scale.setScalar(f.sc * 1.6 * grow * flick); fl.flare.position.y = -f.sc * 0.15;
      const nx = f.h.g.position.x, ny = y + f.tailY - f.sc * 0.2;    // vòi phun
      if (ig) {                                     // khói cuộn NGANG ra hai bên bệ (như bệ phóng thật) + mù đọng ở bệ
        if (Math.random() < 0.5) puff(nx, ny, 0.3, rand(-6, 6), rand(0, 2), 0, rand(8, 10), rand(24, 34), rand(4.5, 6), 0.3, 0.38);
        const n = Math.round(lerp(3, 10, f.t / FLY.ign));
        for (let q = 0; q < n; q++) { const s = Math.random() < 0.5 ? -1 : 1;
          puff(nx, ny, 0.3, s * rand(10, 34), rand(-1, 5), rand(-3, 3), rand(3, 5), rand(12, 22), rand(1.8, 3), 0.9); }
      } else {
        const n = 7 + Math.round(Math.min(8, v / 30));                 // đuôi nhiều khói
        for (let q = 0; q < n; q++) puff(nx, ny - Math.random() * Math.min(10, v * dt * 1.5), 0.3, rand(-4, 4), -rand(5, 12), rand(-2, 2), rand(2.6, 4.2), rand(10, 18), rand(1.8, 3), 1);
        if (Math.random() < 0.7) puff(nx, ny - Math.random() * 6, 0.3, rand(-2.5, 2.5), rand(-1.5, 0.5), rand(-2, 2), rand(6, 9), rand(20, 30), rand(4.2, 6), 0.2, 0.42);   // mù đọng dọc đường bay
        if (tr < 0.5) for (let q = 0; q < 2; q++) { const s = Math.random() < 0.5 ? -1 : 1;
          puff(f.x0, f.y0 + f.tailY, 0.3, s * rand(10, 24), rand(0, 3), 0, rand(3, 5), rand(10, 16), rand(1.6, 2.6), 0.6); }
      }
      light = Math.max(light, grow * (1.5 + 0.5 * Math.random())); lx = nx; ly = ny;
      if (y - f.y0 > f.top) {
        f.h.g.visible = false; flyPool.push(f.h); flights.splice(i, 1);
        const B = bigs[f.j]; B.fly = flights.some(o => o.j === f.j); if (!B.fly) B.after = true;
      }
    }
    fireLight.intensity = light * 260; fireLight.position.set(lx, ly - 2, 8);
  }

  // ---------------------------------------------------------------- bố cục theo khung màn
  let VW = 133;
  function layout() {
    const w = Math.max(1, mount.clientWidth), h = Math.max(1, mount.clientHeight), pr = Math.min(window.devicePixelRatio || 1, PR_MAX);
    renderer.setPixelRatio(pr); renderer.setSize(w, h, false);
    composer.setPixelRatio(pr); composer.setSize(w, h); bloom.resolution.set(w * pr, h * pr);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    sMat.uniforms.scale.value = h * pr / (2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)));
    VW = VH * camera.aspect;
    const mr = mount.getBoundingClientRect(), tb = topEl ? topEl.getBoundingClientRect().bottom - mr.top : 0;
    const topBar = VH * Math.max(0, tb) / h + 2;
    const rowK = Math.min(1, (VW - 8) / (ROW_W + 4));
    rowG.scale.setScalar(rowK);
    const rowY = -VH / 2 + 3 + MINI_LEN * 0.62 * rowK;
    rowG.position.set(0, rowY, 0);
    rowLine.scale.set(Math.min(VW - 10, (ROW_W + 10) * rowK) / rowK, 1, 1); rowLine.position.set(0, MINI_LEN * 0.95, 0);
    const top = VH / 2 - topBar, bot = rowY + MINI_LEN * 0.95 * rowK + 2.5;
    const k = Math.max(0.2, Math.min(1.15, (top - bot - 6) / (BIG_LEN + 6), (VW - 12) / (BTN + BIG_PITCH * 2 + GAP * 2 + BAR_W + 10)));
    cluster.scale.setScalar(k);
    cluster.position.set(0, (top + bot) / 2, 0);
    const mW = Math.max(4, VW * 0.05);                               // thầy 14/10: BOOST sát mép trái, 2 tên lửa sát mép phải
    xBtn = (-VW / 2 + mW) / k + BTN / 2;
    xBigs[1] = (VW / 2 - mW) / k - BIG_PITCH / 2; xBigs[0] = xBigs[1] - BIG_PITCH;
    xBar = ((xBtn + BTN / 2) + (xBigs[0] - BIG_PITCH / 2)) / 2;
    bst.position.x = xBtn; barG.position.x = xBar; bigs.forEach((B, j) => { B.g.position.x = xBigs[j]; });
  }
  const ro = new ResizeObserver(layout); ro.observe(mount); if (topEl) ro.observe(topEl); layout();

  // ---------------------------------------------------------------- trạng thái máy chiếu ⇒ hiển thị
  const A = { on: false, max: 3, reserve: 0, pips: 0, pipsMax: 3, full: false, boost: false, boostPips: 0, locked: false };
  const SL = [0, 1].map(() => ({ st: "empty", k: 0, t: 0 }));
  let threat = -1, win = 1.25, shakeK = 0, pressB = 0, got = false;
  const isInf = () => A.max < 0 || A.max === Infinity;
  const capBig = () => (isInf() ? 2 : clamp(A.max | 0, 0, 2));
  const rowCap = () => (isInf() ? ROW_N : clamp((A.max | 0) - 2, 0, ROW_N));
  // ô j của game: sang "firing" ⇒ phóng · shuttle/charge ⇒ nạp (đợi quả cũ bay khỏi màn) · ready/queued ⇒ hiện đủ
  function slotFrom(j, st, k) {
    const S = SL[j], prev = S.st;
    if (prev === st) { if (st === "charge" && Math.abs((k || 0) - S.k) > 0.15) S.k = k || 0; return; }
    S.st = st; S.t = 0; S.k = st === "charge" ? (k || 0) : st === "ready" || st === "queued" ? 1 : 0;
    if (st === "firing" && !bigs[j].fly && got) launch(j);
  }
  function setInfo(o) {
    if (!o || !o.ar) return;
    Object.assign(A, o.ar);
    (o.sl || []).forEach(([st, k], j) => { if (j < 2) slotFrom(j, st, k); });
    got = true;
    threat = o.ph === "play" && o.thr >= 0 ? o.thr : -1;
    win = o.win || 1.25;
    if (!!o.pc !== peace) setPeace(!!o.pc);
  }
  function event(name) {
    if (name === "refuse-fire" || name === "refuse-boost") shakeK = 1;
    else if (name === "mplus") barFlash = 1;
  }

  function tick(dt, t) {
    // --- giữa 2 lần gửi: tự chạy tiếp như game
    SL.forEach(S => {
      if (S.st === "shuttle") { S.t += dt; if (S.t >= G_SHUTTLE) { S.st = "charge"; S.k = 0; S.t = 0; } }
      else if (S.st === "charge") S.k = Math.min(1, S.k + dt / G_CHARGE);
    });
    if (threat >= 0) threat = Math.max(0, threat - dt);
    const on = !!A.on;
    // --- BOOST
    const full = !!A.boost && !A.locked, thr = threat >= 0, inWin = thr && threat <= win;
    const soft = 0.5 + 0.5 * Math.sin(t * 5), hard = 0.5 + 0.5 * Math.sin(t * 38);
    const nLit = full ? BOOST_N : clamp(Math.round(A.boostPips || 0), 0, BOOST_N);
    pipsB.forEach((p, i) => { p.k += ((i < nLit ? 1 : 0) - p.k) * Math.min(1, dt * 10); p.fm.opacity = p.k;
      p.fm.color.setRGB(0, 0.55, 0.78).multiplyScalar(full ? (thr ? 0.9 + 0.55 * hard : 1.1 + 0.2 * soft) : 1); });
    let glow = 0, rimB = 0.35, iconB = 0.55, scl = 1;
    if (full && thr) { glow = 0.12 + 0.3 * hard; rimB = 1 + 1.1 * hard; iconB = 1; scl = 1 + 0.06 * hard; }
    else if (full) { glow = 0.18 + 0.12 * soft; rimB = 1.3 + 0.5 * soft; iconB = 0.9 + 0.1 * soft; scl = 1 + 0.025 * soft; }
    btnRimMat.color.setRGB(0.2, 0.9, 1.2).multiplyScalar(rimB / 1.2); btnRimMat.opacity = full ? 1 : 0.45;
    btnFaceMat.color.set("#0b1624").lerp(new THREE.Color(0, 0.32, 0.46), full ? 0.6 + 0.4 * (thr ? hard : soft) : 0);
    iconMat.color.setRGB(0.35, 0.6, 0.75).lerp(new THREE.Color(1.2, 1.4, 1.55), full ? 1 : 0); iconMat.opacity = iconB;
    bGlow.material.opacity = glow;
    pressB = Math.max(0, pressB - dt * 4); shakeK = Math.max(0, shakeK - dt * 3);
    btn.scale.setScalar(scl * (1 - pressB * 0.08));
    bst.position.x = xBtn + (shakeK > 0 ? Math.sin(t * 60) * 0.5 * shakeK : 0);
    boostNow.material.opacity = inWin && full ? 0.6 + 0.4 * hard : 0;
    // --- cột vạch
    barG.visible = on;
    const n = on ? clamp(A.pipsMax | 0, 0, 10) : 0;
    if (n !== barN) buildBar(n);
    const lit = A.full ? 0 : clamp(Math.round(A.pips || 0), 0, n);
    barPips.forEach((p, i) => { p.k += ((i < lit ? 1 : 0) - p.k) * Math.min(1, dt * 10); p.fm.opacity = p.k;
      p.fm.color.setRGB(1.5, 1.55, 1.65).multiplyScalar(1 + barFlash * 0.8); p.back.material.opacity = A.full || A.locked ? 0.35 : 0.85; });
    barFlash = Math.max(0, barFlash - dt * 1.6);
    // --- hàng tên lửa con
    rowG.visible = on;
    const cap = rowCap(), shown = Math.min(Math.max(0, A.reserve | 0), ROW_N);
    const x0 = isInf() ? -ROW_W / 2 + MINI_PITCH / 2 : -(cap * MINI_PITCH) / 2 + MINI_PITCH / 2;   // ∞ căn TRÁI · giới hạn căn GIỮA
    minis.forEach((M, i) => {
      const filled = i < shown, slot = isInf() ? filled : i < cap;
      M.g.visible = on && (slot || filled);
      M.m.visible = filled; M.gh.visible = !filled && slot;
      if (filled && !M.was) M.pop = 1; M.was = filled;
      M.pop = Math.max(0, M.pop - dt / 0.55);
      fat(M.m, MINI_SC * BIG_K * Math.max(0.01, M.pop > 0 ? easeOutBack(1 - M.pop) : 1));
      M.rot += dt * 0.5; M.m.rotation.x = M.gh.rotation.x = Math.sin(M.rot + i) * 0.35;
      M.g.position.set(x0 + i * MINI_PITCH, Math.sin(t * 2 + i * 1.7) * 0.15, 0);
    });
    const extra = on && isInf() ? Math.max(0, (A.reserve | 0) - ROW_N) : 0;
    if (extra !== plusN) { plusN = extra; const g = plusCv.getContext("2d"); g.clearRect(0, 0, 256, 128);
      if (extra > 0) { g.font = '900 92px "Exo 2", sans-serif'; g.textAlign = "center"; g.textBaseline = "middle"; g.shadowColor = "rgba(0,0,0,.85)"; g.shadowBlur = 14;
        g.lineWidth = 10; g.strokeStyle = (peace ? PAL.peace : PAL.war).label; g.fillStyle = "#fff"; g.strokeText("+" + extra, 128, 68); g.fillText("+" + extra, 128, 68); }
      plusTex.needsUpdate = true; }
    plus.visible = extra > 0; plus.position.set(-ROW_W / 2 + ROW_N * MINI_PITCH + PLUS_W / 2, 0, 0.5);
    // --- 2 tên lửa to
    bigs.forEach((B, j) => {
      const S = SL[j], use = on && j < capBig();
      B.g.visible = use;
      const loading = S.st === "shuttle" || S.st === "charge", ready = S.st === "ready" || S.st === "queued";
      const target = S.st === "charge" ? S.k : ready ? 1 : 0;
      if (!use || B.fly || !(loading || ready)) { if (!B.fly) { B.d = "none"; B.mv = null; } }
      else if (B.d === "none") {
        if (loading || B.after) {                                     // quả con cuối hàng VÚT lên (vừa rời hàng ⇒ đúng chỗ của nó)
          const i = clamp(Math.min(Math.max(0, A.reserve | 0), ROW_N - 1), 0, ROW_N - 1);
          rowG.updateWorldMatrix(true, true); B.g.updateWorldMatrix(true, false);
          const from = new THREE.Vector3(); minis[i].g.getWorldPosition(from); B.g.worldToLocal(from);
          B.mv = { t: 0, from, s0: MINI_SC * BIG_K * rowG.scale.x / cluster.scale.x, trail: [], tl: 0 };
          B.d = "load"; B.k = LOAD_K0; B.after = false;
        } else { B.d = "show"; B.k = target; }                       // mới nối / mới mở ⇒ hiện luôn, không bay
      }
      const showRed = use && !B.fly && B.d !== "none";
      B.red.visible = showRed;
      B.flash = Math.max(0, B.flash - dt * 1.8);
      B.rot += dt * 0.35; B.red.rotation.x = Math.sin(B.rot) * 0.35;
      const bob = Math.sin(t * 2.2 + j) * 0.25;
      if (showRed && B.d === "load") {
        const mv = B.mv; mv.tl += dt;
        // độ đầy: bắt đầu từ phần ĐUÔI, đuổi kịp số nạp thật của game trong CATCH_T giây rồi đi theo nó
        B.k = mv.tl < CATCH_T ? Math.max(B.k, lerp(LOAD_K0, Math.max(LOAD_K0, target), smooth(mv.tl / CATCH_T))) : Math.max(B.k, target);
        if (mv.t < LOAD_T) {
          mv.t += dt; const k = smooth(mv.t / LOAD_T), e = 1 - Math.pow(1 - k, 3);
          const prev = B.red.position.clone();
          B.red.position.set(lerp(mv.from.x, 0, e), lerp(mv.from.y, bob, k), Math.sin(k * Math.PI) * 6);
          const sc = lerp(mv.s0, BIG_SC * BIG_K, e), cur = B.red.position;
          const sp = mv.t <= dt ? 0 : cur.distanceTo(prev) / Math.max(dt, 1e-3), stv = 1 + Math.min(0.35, sp / 900);
          B.red.scale.set(sc * stv, sc * 1.35 / Math.sqrt(stv), sc * 1.35 / Math.sqrt(stv));   // vút nhanh ⇒ thân hơi kéo dài theo hướng bay
          mv.trail.unshift(cur.clone()); if (mv.trail.length > 7) mv.trail.pop();
          const ang = Math.atan2(cur.y - prev.y, cur.x - prev.x) - Math.PI / 2, w = sc * 0.62;
          B.trail.forEach((m, i) => { const q = mv.trail[i + 1]; m.visible = !!q && k < 0.98; if (!q) return;
            m.position.set(q.x, q.y, q.z - 0.5); m.material.rotation = ang; m.scale.set(w * (1 - i * 0.1), w * 2.6, 1); m.material.opacity = 0.32 * (1 - i / 6) * (1 - k * k); });
          if (mv.t >= LOAD_T) B.trail.forEach(m => { m.visible = false; });
        } else { fat(B.red, BIG_SC * BIG_K); B.red.position.set(0, bob, 0); }
        if (ready && B.k >= 0.999 && mv.t >= LOAD_T) { B.d = "show"; B.flash = Math.max(B.flash, 1); }
      } else if (showRed) {
        B.k = ready ? 1 : Math.max(B.k, target);
        fat(B.red, BIG_SC * BIG_K); B.red.position.set(0, bob, 0);
      }
      if (!showRed) B.trail.forEach(m => { m.visible = false; });
      // chờ nối đuôi (queued) ⇒ rung nhẹ · bấm bị từ chối ⇒ lắc
      B.red.position.x += (S.st === "queued" ? Math.sin(t * 40) * 0.25 : 0) + (shakeK > 0 ? Math.sin(t * 60 + j) * 0.4 * shakeK : 0);
      const fill = showRed ? clamp(B.k, 0, 1) : 1;
      B.uFill.value = fill < 0.999 ? lerp(-1.15 - FILL_SOFT, 1.17 + FILL_SOFT, fill) : 9;
      const pulse = 0.5 + 0.5 * Math.sin(t * (6 + fill * 16)), charging = showRed && fill < 0.999;
      B.red.traverse(o => { if (o.isMesh && o.material.emissive && o.material !== mGlow) o.material.emissiveIntensity = charging ? 0.15 + 0.45 * fill * pulse : 0.15 + B.flash * 0.8; });
      B.glow.position.set(B.red.position.x, B.red.position.y, -1);
      B.glow.material.opacity = !showRed ? 0 : 0.5 * ((ready && !charging && !A.locked ? 0.22 + 0.12 * Math.sin(t * 4) : 0) + (charging ? fill * 0.25 * pulse : 0) + B.flash * 0.8);
      B.hit.visible = use;
    });
  }

  // ---------------------------------------------------------------- chạm: BOOST · quả to j (bắn đúng quả đó)
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const hits = [hitBoost, ...bigs.map(B => B.hit)];
  const visible = o => { let p = o; while (p) { if (!p.visible) return false; p = p.parent; } return true; };
  function onDown(e) {
    e.preventDefault();
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const h = ray.intersectObjects(hits.filter(visible), false)[0];
    if (!h) return;
    const k = h.object.userData.k;
    if (k === "boost") pressB = 1;
    if (onKey) onKey(k);
  }
  renderer.domElement.addEventListener("pointerdown", onDown);

  // ---------------------------------------------------------------- vòng vẽ
  let raf = 0, last = performance.now(), T = 0, dead = false;
  function update(dt) { T += dt; tick(dt, T); stepFlights(dt); stepSmoke(dt); }
  function frame(now) {
    if (dead) return;
    raf = requestAnimationFrame(frame);
    if (now < last) last = now;                                    // giờ rAF có thể sớm hơn performance.now() lúc dựng ⇒ không dt âm
    if (now - last < 1000 / PAD_FPS - 2) return;                  // Đợt 523: bỏ khung — 25 khung/giây (−2 ms: rAF 60 Hz rơi đúng nhịp)
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    update(dt); composer.render();
  }
  raf = requestAnimationFrame(frame);

  return {
    setInfo, event,
    step(sec = 1 / 60) { for (let i = 0; i < Math.max(1, Math.round(sec * 60)); i++) update(1 / 60); composer.render(); },   // bàn thử (khung ẩn)
    get debug() { return { slots: SL.map(S => ({ st: S.st, k: +S.k.toFixed(2) })), show: bigs.map(B => ({ d: B.d, k: +B.k.toFixed(2), fly: B.fly, vis: B.red.visible })), flights: flights.length, A: { ...A } }; },
    destroy() {
      dead = true; cancelAnimationFrame(raf); ro.disconnect(); renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.dispose(); pmrem.dispose(); renderer.domElement.remove();
    },
  };
}
