// ⚠️ ĐỢT 511 — CHÉP từ myGame rocket-race/core/rr-padscene-9.js (mẫu 9, myGame 4755fe1). Sửa ở myGame trước (mẫu mới) rồi chép lại; chỉ đổi đường import.
// ROCKET RACE mẫu 9 — BẢNG TÊN LỬA 3D TRÊN iPAD (13/10/2026, thầy: "vạch, tên lửa, nút boost cần có thiết kế 3D giống hệt trên game thật").
// KHÔNG vẽ lại: dựng CHÍNH bảng của game bằng `createMissiles(...).buildConsole` (game9/rr3d-missile.js — cùng hình, cùng vật liệu, cùng hoạt ảnh
// tickUI) trong một cảnh riêng KHÔNG có tàu, cùng bộ hậu kỳ của game (ACES · bloom · lọc NaN · vignette/hạt). Trạng thái lấy từ máy chiếu qua
// `api.mirror()` (chế độ GƯƠNG thêm vào game9). Bố cục: iPad NGANG ⇒ khu tên lửa trái · BOOST phải; DỌC ⇒ tên lửa trên · BOOST dưới
// (bảng trong game xếp tên lửa trên cột đáp án, BOOST dưới — iPad không có đáp án nên kéo 2 cụm sát nhau / đặt cạnh nhau). Khung cảnh báo đỏ
// của game được kéo to ra viền màn iPad.
//   createPadScene({ mount, team, onKey }) ⇒ { setInfo(o), event(name), destroy() } — onKey("fire"|"boost"|"load") khi chạm vùng chạm của game.
import * as THREE from "./vendor/three/three.module.min.js";
import { EffectComposer } from "./vendor/three/addons/EffectComposer.js";
import { RenderPass } from "./vendor/three/addons/RenderPass.js";
import { ShaderPass } from "./vendor/three/addons/ShaderPass.js";
import { UnrealBloomPass } from "./vendor/three/addons/UnrealBloomPass.js";
import { OutputPass } from "./vendor/three/addons/OutputPass.js";
import { RoomEnvironment } from "./vendor/three/addons/RoomEnvironment.js";
import { RoundedBoxGeometry } from "./vendor/three/addons/RoundedBoxGeometry.js";
import { createMissiles } from "./rr3d-missile.js";

const FONT_UI = '"Baloo 2", "Segoe UI", sans-serif';
// --- 3 hàm phụ CHÉP từ game9/rr3d-view.js (mô-đun tên lửa nhận chúng qua X) ---
function canvasTex(canvas) { const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
function radialTex(stops, size = 128) {
  const c = document.createElement("canvas"); c.width = c.height = size;
  const g = c.getContext("2d"), gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([o, col]) => gr.addColorStop(o, col)); g.fillStyle = gr; g.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}
function roundRectPath(p, w, h, r) {
  const x = -w / 2, y = -h / 2;
  p.moveTo(x + r, y); p.lineTo(x + w - r, y); p.quadraticCurveTo(x + w, y, x + w, y + r);
  p.lineTo(x + w, y + h - r); p.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  p.lineTo(x + r, y + h); p.quadraticCurveTo(x, y + h, x, y + h - r);
  p.lineTo(x, y + r); p.quadraticCurveTo(x, y, x + r, y);
  return p;
}
function frameGeo(w, h, r, t) {
  const s = roundRectPath(new THREE.Shape(), w, h, r);
  s.holes.push(roundRectPath(new THREE.Path(), w - 2 * t, h - 2 * t, Math.max(0.001, r - t)));
  return new THREE.ShapeGeometry(s, 12);
}

// Cỡ bảng (đơn vị = cm thật của bàn game trên TOMKO): bề rộng cột đáp án ~16 cm, lề như game (pad = 7 % cạnh ngắn của bàn ~20 cm)
const CON_W = 16, PAD = 1.4, MISSILES = { window: 1.25, dur: 3.8, boostCm: 6.5, gapCm: 2 };   // = cfg.missiles của trang game

export function createPadScene({ mount, team, onKey }) {
  const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;touch-action:none;display:block";
  mount.append(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x03050b);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.45;
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 400);
  scene.add(camera);
  const key = new THREE.DirectionalLight(0xfff1e0, 3.2); key.position.set(30, 40, 60); scene.add(key);   // = ánh mặt trời của game
  scene.add(new THREE.AmbientLight(0x8090b0, 0.35));

  // hậu kỳ = game (rr3d-view.js): render target HalfFloat MSAA 4 · lọc NaN · bloom 0,85 · OutputPass · vignette + hạt
  const rt = new THREE.WebGLRenderTarget(16, 16, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new ShaderPass({
    uniforms: { tDiffuse: { value: null } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform sampler2D tDiffuse; varying vec2 vUv;
      void main(){ vec4 c = texture2D(tDiffuse, vUv); if (any(isnan(c.rgb)) || any(isinf(c.rgb))) c = vec4(0.0);
        gl_FragColor = vec4(clamp(c.rgb, 0.0, 64.0), 1.0); }`
  }));
  const bloom = new UnrealBloomPass(new THREE.Vector2(16, 16), 0.85, 0.65, 1.05);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const grade = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime; uniform vec2 uRes; varying vec2 vUv;
      void main(){ vec2 c = vUv - 0.5; float d = length(c*vec2(uRes.x/uRes.y, 1.0))*0.8;
        vec3 col = texture2D(tDiffuse, vUv).rgb; col *= mix(1.0, 0.78, smoothstep(0.5, 1.1, d));
        float g = fract(sin(dot(vUv*uRes + fract(uTime)*97.0, vec2(12.9898, 78.233)))*43758.5453); col += (g - 0.5)*0.03;
        gl_FragColor = vec4(col, 1.0); }`
  });
  composer.addPass(grade);

  // ---- bảng tên lửa của game, không có tàu ----
  const G = { t: 0 }, noop = () => {}, nopP = { emit: noop }, hitList = [];
  const M = createMissiles({
    THREE, scene, camera, rockets: [], G, hitList, frameGeo, RoundedBoxGeometry, canvasTex, radialTex, FONT_UI, renderer,
    cfg: { travelDir: new THREE.Vector3(1, 0, 0), rocketScale: 1, missiles: MISSILES },
    fire: nopP, smoke: nopP, burst: noop, explosion: noop, labelOn: noop, sfx: noop, stall: noop, shake: noop,
    onFire: () => onKey && onKey("fire"), onBoost: () => onKey && onKey("boost"), onLoad: () => onKey && onKey("load"),
    onEnd: noop, onLaunch: noop, sfxCharge: () => null, sfxServo: noop,
  });
  const api = M.api;
  const root = new THREE.Group(); scene.add(root);
  const inner = new THREE.Group(); root.add(inner);
  // s.h = khoảng cột đáp án giữa 2 cụm — iPad không có đáp án ⇒ 0 (bố cục đặt lại ngay sau)
  M.buildConsole({ side: team }, inner, { w: CON_W, h: 0 }, PAD, 1);
  const U = api.ui[team];
  const bh = new THREE.Group(); inner.add(bh); bh.add(U.bst); U.bst.position.y = 0;   // tickUI chỉ ghi bst.position.x (rung) ⇒ dời bằng nhóm cha
  const ammoH = MISSILES.ammoCm || 8.5, btnS = MISSILES.boostCm;
  const areaW = CON_W - PAD * 2;
  // ⭐ (thầy 13/10, kèm ảnh bảng game) bố trí ĐÚNG như bảng game: cột TÊN LỬA CON (dự phòng, 4 ô, xếp từ dưới) ở phía ngoài + nhãn "+X" trên đỉnh cột
  // cho số quả CHỜ vượt 4 + 2 quả to ĐÃ NẠP phía trong — tất cả do buildConsole/tickUI của game vẽ (bỏ nhãn "N MISSILES" tự thêm lần trước).
  // Cột vạch năng lượng: cao ĐÚNG bằng cột tên lửa con 4 ô, đáy thẳng đáy ô dưới cùng (= công thức buildMsPips của game khi Missiles max = ∞)
  // — để luôn dài đều, kể cả khi trận chỉ có 1 ô dự phòng (game khi đó cột chỉ cao 1 ô: thầy chê "ngắn quá").
  const MINI_PITCH = 0.3, slotY0 = -0.3;                          // = MINI_PITCH / slotY(0) của rr3d-missile.js
  const pipsY0 = (slotY0 - MINI_PITCH * 0.52) * ammoH;            // cột vạch: game9 nay LUÔN 4 ô (cả màn lớn) ⇒ không cần pipsSpan riêng
  // khung nội dung khu tên lửa (toạ độ trong U.am): đáy = đáy cột vạch · đỉnh = nhãn "+X" (trên ô dự phòng thứ 4)
  const AM_BOT = pipsY0 - ammoH * 0.03, AM_TOP = ammoH * 1.06;
  // cột đáp án trong game nghiêng; ở iPad nhìn THẲNG. Vùng cần thấy: khu tên lửa (rộng areaW, cao ~1,7 ammoH gồm cột dự phòng) + nút BOOST.
  const AM_H = AM_TOP - AM_BOT, AM_MID = (AM_TOP + AM_BOT) / 2, BOOST_BOX = btnS * 1.35;
  let fitW = 1, fitH = 1, landscape = true;
  function layout(aspect) {
    landscape = aspect >= 1.05;
    if (landscape) {
      // ⭐ (thầy 13/10) "nâng 2 tên lửa lớn lên giữa và cho cân bằng với nút boost": tâm 2 quả to (y = 0 trong U.am) ĐÚNG giữa chiều cao màn,
      // nút BOOST cùng độ cao với tâm 2 quả. Khung nhìn đối xứng quanh tâm đó ⇒ đủ chỗ cả đỉnh nhãn "+X" lẫn đáy cột vạch.
      const gapX = PAD * 2.4;
      fitW = areaW + gapX + BOOST_BOX; fitH = Math.max(2 * Math.max(AM_TOP, -AM_BOT), BOOST_BOX);
      U.am.position.set(-fitW / 2 + areaW / 2, 0, 0.05);
      bh.position.set(fitW / 2 - BOOST_BOX / 2, 0, 0.05);
    } else {
      const gapY = PAD * 2.2;
      fitW = Math.max(areaW, BOOST_BOX); fitH = AM_H + gapY + BOOST_BOX;
      U.am.position.set(0, fitH / 2 - AM_H / 2 - AM_MID, 0.05);
      bh.position.set(0, -fitH / 2 + BOOST_BOX / 2, 0.05);
    }
    // khoảng cách máy quay để vừa khít (lề 12 %)
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const dist = Math.max((fitH / 2) / t, (fitW / 2) / (t * aspect)) * 1.12;
    camera.position.set(0, 0, dist); camera.lookAt(0, 0, 0);
    // khung cảnh báo đỏ của game ⇒ viền cả màn iPad
    const vh = 2 * dist * t * 0.97, vw = vh * aspect * 0.985 / 0.97;
    U.warn.geometry.dispose();
    U.warn.geometry = frameGeo(vw, vh, Math.min(vw, vh) * 0.05, Math.min(vw, vh) * 0.012);
    U.warn.position.set(0, 0, 0.02);
  }
  function resize() {
    const w = Math.max(1, mount.clientWidth), h = Math.max(1, mount.clientHeight), pr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(pr); renderer.setSize(w, h, false);
    composer.setPixelRatio(pr); composer.setSize(w, h);
    bloom.resolution.set(w * pr, h * pr);
    grade.uniforms.uRes.value.set(w * pr, h * pr);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    layout(camera.aspect);
  }
  const ro = new ResizeObserver(resize); ro.observe(mount); resize();

  // ---- chạm: đúng 3 vùng chạm của game (quả nhỏ = nạp · quả to = bắn · BOOST) ----
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function onDown(e) {
    e.preventDefault();
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(hitList, false)[0];
    if (hit && hit.object.userData.ammo) M.tap(hit.object.userData.ammo);
  }
  renderer.domElement.addEventListener("pointerdown", onDown);

  // ---- vòng vẽ ----
  let raf = 0, last = performance.now(), dead = false;
  function frame(now) {
    if (dead) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    G.t += dt; grade.uniforms.uTime.value = G.t;
    api.mirrorTick(team, dt);
    composer.render();
  }
  raf = requestAnimationFrame(frame);

  return {
    /** o = trạng thái máy chiếu gửi (xem padState trang game): ar (kho), sl ([[st,k],[st,k]]), thr (giây, −1 = không), pc (PEACE) */
    setInfo(o) {
      if (!o || !o.ar) return;
      const ar = { ...o.ar, max: o.ar.max < 0 ? Infinity : o.ar.max };
      api.setArsenal(team, ar);
      api.mirror(team, { sl: o.sl, threat: o.ph === "play" ? o.thr : -1 });
      if (!!o.pc !== api.peace) api.setPeace(!!o.pc);
    },
    event(name) {
      if (name === "refuse-fire") api.refuse(team, "fire");
      else if (name === "refuse-boost") api.refuse(team, "boost");
      else if (name === "mplus") api.mirrorFlash(team);
    },
    step(n = 1) { for (let i = 0; i < n; i++) { G.t += 1 / 60; api.mirrorTick(team, 1 / 60); } composer.render(); },   // bàn thử (khung ẩn)
    get debug() { return { slots: api.slots[team], arsenal: api.arsenal[team], landscape, hits: hitList.length }; },
    destroy() { dead = true; cancelAnimationFrame(raf); ro.disconnect(); renderer.domElement.removeEventListener("pointerdown", onDown); renderer.dispose(); rt.dispose(); renderer.domElement.remove(); },
  };
}
