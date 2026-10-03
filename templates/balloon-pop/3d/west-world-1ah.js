// CẢNH MIỀN TÂY — bản 1ag (30/9/2026): ĐIỀU PHỐI con vật mặt đất — một lúc chỉ 1 cặp đuổi nhau (dải xa HOẶC quanh chữ) + tối đa
// 2 con ra xem tàu; con ra xem gặp cặp đuổi nhau thì chạy tránh. Chữ bị húc đổ nằm yên, chỉ
// dựng lại khi bảng chữ đã khuất khỏi khung hình (west-props-1ag restoreHidden). Trên trời giữ nguyên.
// CẢNH MIỀN TÂY — bản 1af (30/9/2026): dải CỎ THƯA DẦN sau vạt cỏ (z −104 → −190, mật độ giảm dần rồi hết — thầy: "xa xa tự dưng
// không còn cỏ ⇒ sai chân thực"); con vật dùng animals-1af (không chìm đất, đuổi nhau có khoảng hở, cảnh mới); setCamera() cho cặp đuổi nhau
// biết khung hình thật (chỉ sinh/xoá con vật NGOÀI khung hình — hết cảnh biến mất giữa màn).
// Cảnh viễn tây — bản 1ab (30/9/2026): saguaro tiền cảnh nhỏ lại (tallSaguaro), đại bàng/chim thật (west-props-1ab).
// Cảnh viễn tây — bản 1aa (29/9/2026): 8 khúc cảnh bám chỗ MÁY QUAY nhìn (quay vòng cả 2 chiều), cỏ/đá mọc tới sát máy quay (z 34),
// bỏ vạt cỏ thưa 9–14 ⇒ intro/màn chờ chỗ nào cũng đều cỏ, cây, đá.
// Cảnh viễn tây — bản 1z (29/9/2026): đụn cát cao 10, chữ 70 %.
// Cảnh viễn tây — bản 1y (29/9/2026): hai bảng chữ trên đụn cát thấp (dune-1y, ?cao=0..2).
// Cảnh viễn tây — bản 1x (29/9/2026): mặt đất có ĐỤN CÁT cao đỡ chữ ANDREW CLASSES (dune-1x); đồi Atacama như 1v.
// Cảnh viễn tây — bản 1w (29/9/2026): chữ trên gờ giữa vách núi + thú đuổi nhau quanh chữ; đá gần ray = kiểu 1 (đá tròn phong hoá).
// Cảnh viễn tây — bản 1v (29/9/2026): như 1u, mô đất gần ray = đống đá thu nhỏ 1/2, bớt 1/2 (near-mounds-1v.js, ?da=0..3).
// Cảnh viễn tây — bản 1u (29/9/2026): như 1t + mô đất gần đường ray chi tiết (near-mounds-1u.js, ?mo=0..4).
// Cảnh viễn tây — bản 1t (29/9/2026): như 1s, props/animals 1t.
// Cảnh viễn tây — bản 1s (29/9/2026): như 1r, đồi chữ kiểu Atacama (props 1s).
// Cảnh viễn tây — bản 1r (29/9/2026): như 1q, đồi chữ theo kiểu chọn (props 1r).
// Cảnh viễn tây — bản 1q (29/9/2026): như 1o, props/animals 1q (màn chờ 2 bảng chữ).
// Cảnh viễn tây — bản 1o (29/9/2026): CHỐT đất cát đỏ gợn sóng + bụi cỏ sa mạc mẫu 0 (thầy chọn từ 1m/1n). Không còn bảng chọn.
// Cảnh viễn tây — bản 1n (29/9/2026): đất ?dat=1 cát đỏ gợn sóng (mặc định) / 2 đồng cỏ khô vàng; cây cỏ mặt đất thay bằng
// BỤI CỎ SA MẠC dựng từng lá (bunchgrass-1n.js, 5 mẫu ?co=0..4); giữ xương rồng, đá, sỏi.
// Cảnh viễn tây — bản 1m (29/9/2026): 6 KIỂU MẶT ĐẤT + CỎ (GROUND_STYLES, chọn bằng ?nen=0..5) — kết cấu đất lặp liền mạch,
// gợn cát / nứt nẻ / sỏi / sợi cỏ; số cây từng loại theo kiểu. Phần còn lại như 1l.
// Cảnh viễn tây — bản 1l (29/9/2026): bụi tiền cảnh cành thưa lá nhỏ, ít + nhỏ hơn; cây cỏ đồi xa + con vật theo props/animals 1l.
// Cảnh viễn tây — bản 1k (29/9/2026): cỏ BÔNG LAU mọc khóm thưa thay cỏ cao lá to; đồi chữ + gò con vật MỀM, phủ cỏ thật;
// 2 con vật đuổi nhau làm lại giống thật, chạy ở RẤT XA (animals-1k createChase).
// Cảnh viễn tây — bản 1j (29/9/2026): cỏ mảnh + dày hơn (thêm loại cỏ cao mảnh "fine"), kangaroo, 2 con đuổi nhau ở vùng đất thấp,
// đồi chữ Hollywood nhọn gồ ghề (west-props-1j.js).
// Bản 1i: saguaro sần sùi mỗi cây một khác (khúc cảnh quay vòng thì MỌC LẠI cây mới, không lặp),
// con vật thỉnh thoảng húc đổ chữ Hollywood (animals-1i createSignCharger).
// Bản 1f: như 1e, nhưng gò đồi + con vật lấy từ animals-1f.js (8 loài, gò địa hình thật, thấp hơn).
// Cảnh MIỀN VIỄN TÂY — bản 1e (29/9/2026): con vật chi tiết chỉ trên gò đồi xa (animals-1e.js), chim liền mạch.
// Lịch sử 1d: như 1c + cỏ 3 loại chi tiết, đá sa thạch thật, xương rồng làm lại (west-props-1d.js),
// chữ kiểu Hollywood trên đồi xa, lạc đà chạy ra xem tàu, đàn chim + đại bàng rượt đuổi.
// Lịch sử 1c: thế giới "vô tận" theo máy quay lia ngang.
// • Mặt đất + 3 lớp dãy núi: độ cao tính TRONG SHADER theo toạ độ thế giới ⇒ lưới chỉ việc bám theo máy quay (nhảy
//   theo bước lưới), không bao giờ lộ mép, không lệch nối.
// • Tiền/trung cảnh chia KHÚC 48 đơn vị (cỏ búi, bụi ngải, bụi hoa vàng, đá sa thạch, xương rồng, ĐƯỜNG RAY): khúc rơi
//   lại sau máy quay thì dời lên phía trước.
// • Cột đá kiểu Monument Valley: rơi sau thì dời lên trước với dáng mới.
// Tất cả sinh bằng code (không tải ảnh ngoài).
import * as THREE from "../../rocket-race/vendor/three/three.module.min.js";
import { mergeGeometries } from "../../rocket-race/vendor/three/addons/BufferGeometryUtils.js";
import * as P from "./west-props-1ag.js";
import { DUNE_GLSL, DUNES, DUNE_N } from "./dune-1z.js";
import { nearMoundKit } from "./near-mounds-1v.js";
import { createFarAnimals, createSignCharger, createChase, groundBaseHeight } from "./animals-1ah.js";
import { createSignChase } from "./sign-chase-1ah.js";
import { makeBunchKit, GRASS_STYLES } from "./bunchgrass-1n.js";

export const SUN_DIR = new THREE.Vector3(-0.32, 0.13, -0.94).normalize();
export const TRACK_TOP = 0.62;             // mặt ray (bánh tàu đặt lên đây)
const CHUNK = 48, NCH = 8;   // 1aa: 5 → 8 khúc — màn chờ + intro nhìn rộng/xa hơn ván chơi
const Z_FRONT = 34;          // 1aa: cỏ/đá mọc tới sát máy quay (1z chỉ tới z 14 ⇒ cảnh toàn cảnh cuối intro thấy dải đất trơn)
const Z_BACK = 104;          // 1aa: bụi cỏ mọc lùi tới chân đụn cát chữ (1z chỉ tới z -76 ⇒ màn chờ thấy vạt đất trơn giữa cảnh)

// ------------------------------------------------------------ 1m: 6 KIỂU MẶT ĐẤT + CỎ để thầy duyệt (chọn bằng ?nen=0..5)
// soil: màu nền + biên độ vân · ripples (gợn cát) · cracks (nứt nẻ) · gravel (sỏi) · strokes (sợi cỏ vẽ lên đất)
// tint: 2 màu trộn theo vạt đất lớn (trong shader) · veg: số cây mỗi khúc 48 đơn vị · gt: màu nhuộm cỏ thấp
export const GROUND_STYLES = [
  { name: "Hiện tại (1l)", soil: { base: [206, 140, 92], amp: [60, 48, 36], specks: 2600 }, tA: [1.02, 0.95, 0.88], tB: [0.84, 0.62, 0.48], nrm: 0.7,
    veg: { reed: 150, fine: 320, stub: 1700, bush: [30, 20, 14], peb: 260, rock: 10, flowers: 0 }, gt: 0xffffff },
  { name: "Cát đỏ gợn sóng", soil: { base: [216, 132, 84], amp: [34, 28, 22], specks: 900, ripples: 1 }, tA: [1.06, 0.92, 0.82], tB: [0.92, 0.62, 0.46], nrm: 0.55,
    veg: { reed: 45, fine: 70, stub: 260, bush: [10, 6, 4], peb: 70, rock: 6, flowers: 0 }, gt: 0xffe8d0 },
  { name: "Đồng cỏ khô vàng", soil: { base: [184, 146, 94], amp: [40, 34, 26], specks: 800, strokes: 11000, sCol: [[214, 188, 120], [190, 164, 96], [232, 210, 150], [160, 140, 80]] }, tA: [1.02, 0.97, 0.82], tB: [0.86, 0.76, 0.56], nrm: 0.6,
    veg: { reed: 230, fine: 900, stub: 3200, bush: [16, 12, 8], peb: 50, rock: 4, flowers: 70 }, gt: 0xfff2cc },
  { name: "Đất nứt nẻ", soil: { base: [206, 166, 124], amp: [30, 26, 22], specks: 600, cracks: 1 }, tA: [1.06, 1.0, 0.95], tB: [0.9, 0.78, 0.66], nrm: 1.0,
    veg: { reed: 30, fine: 110, stub: 380, bush: [12, 8, 8], peb: 120, rock: 8, flowers: 0 }, gt: 0xfff0dc },
  { name: "Sỏi đá sa mạc", soil: { base: [172, 122, 88], amp: [40, 30, 24], specks: 800, gravel: 16000 }, tA: [1.0, 0.93, 0.86], tB: [0.82, 0.64, 0.52], nrm: 1.1,
    veg: { reed: 50, fine: 200, stub: 700, bush: [26, 10, 24], peb: 900, rock: 18, flowers: 24 }, gt: 0xffffff },
  { name: "Thảo nguyên xanh", soil: { base: [150, 128, 84], amp: [36, 32, 22], specks: 600, strokes: 14000, sCol: [[120, 146, 66], [146, 164, 82], [98, 124, 56], [178, 176, 104]] }, tA: [0.96, 1.0, 0.86], tB: [0.78, 0.74, 0.52], nrm: 0.6,
    veg: { reed: 120, fine: 1000, stub: 3600, bush: [10, 10, 30], peb: 60, rock: 4, flowers: 280 }, gt: 0xd4f0a4 },
];
// 1n: ?dat=1 (cát đỏ gợn sóng, mặc định) hoặc ?dat=2 (đồng cỏ khô vàng)
export const NEN = 1;   // 1o: thầy chốt đất CÁT ĐỎ GỢN SÓNG
const GR2 = GRASS_STYLES[0];   // 1o: thầy chốt bụi cỏ MẪU 0 "như ảnh"
const GS = GROUND_STYLES[NEN];
const f3 = a => `vec3(${a.map(v => v.toFixed(3)).join(", ")})`;

const GLSL_NOISE = `
float h21(vec2 p){ p = fract(p * vec2(233.34, 851.73)); p += dot(p, p + 23.45); return fract(p.x * p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), u.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), u.x), u.y); }
float fbm4(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 5; i++) { s += a * vn(p); p = p * 2.02 + vec2(3.1, 1.7); a *= .5; } return s; }
float ridge(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 6; i++) { float n = 1. - abs(vn(p) * 2. - 1.); s += a * n * n; p = p * 2.07 + vec2(5.3, 2.9); a *= .5; } return s; }
${DUNE_GLSL}
float groundH(vec2 w){
  float far = smoothstep(45., 170., -w.y);
  float hills = max(0., fbm4(w * 0.0035) - 0.36) * 80. * far * (1. - 0.9 * smoothstep(135., 165., -w.y) * (1. - smoothstep(250., 300., -w.y)));   /* 1u: dải trước đồi chữ phẳng lại (đồi chữ thấp 1/2 không bị che) */
  float mid = (fbm4(w * 0.02) - 0.5) * 3.2 * smoothstep(22., 70., -w.y);
  float near = (vn(w * 0.12) - 0.5) * 0.22 * smoothstep(3., 9., abs(w.y));
  return duneApply(hills + mid + near, w);   /* 1x: đụn cát đỡ chữ */
}`;

export function createWestWorld(scene, renderer) {
  const rnd = mulberry(11);
  const N = makeNoise(5);
  const U = { time: { value: 0 }, camX: { value: 0 } };

  // ------------------------------------------------------------ bầu trời (bám máy quay)
  const skyUniforms = { sunDir: { value: SUN_DIR.clone() }, time: U.time };
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms: skyUniforms,
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.); gl_Position = p.xyww; }`,
    fragmentShader: SKY_FRAG,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(2500, 64, 32), skyMat);
  sky.renderOrder = -10; sky.frustumCulled = false;
  scene.add(sky);

  const envScene = new THREE.Scene();
  envScene.add(new THREE.Mesh(new THREE.SphereGeometry(100, 32, 16), skyMat));
  const envGround = new THREE.Mesh(new THREE.CircleGeometry(90, 32), new THREE.MeshBasicMaterial({ color: 0x9a6a45 }));
  envGround.rotation.x = -Math.PI / 2; envGround.position.y = -2; envScene.add(envGround);
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(envScene, 0.02).texture;
  scene.environmentIntensity = 0.75;

  // ------------------------------------------------------------ ánh sáng giờ vàng (bóng đổ bám máy quay)
  scene.fog = new THREE.Fog(0xe9a98a, 320, 3400);
  scene.add(new THREE.HemisphereLight(0xa9c8f0, 0xa4643a, 0.85));
  const sun = new THREE.DirectionalLight(0xffc98f, 3.4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 2048);
  Object.assign(sun.shadow.camera, { left: -42, right: 42, top: 24, bottom: -24, near: 40, far: 320 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04; sun.shadow.radius = 3;
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight(0x9fb8e8, 0.55); scene.add(fill, fill.target);

  // ------------------------------------------------------------ mặt đất (độ cao + màu trong shader theo toạ độ thế giới)
  const GSEG = 5;
  const groundGeo = new THREE.PlaneGeometry(2400, 1500, 480, 260);
  groundGeo.rotateX(-Math.PI / 2); groundGeo.translate(0, 0, -700);
  const soil = soilTexture(GS.soil); const soilN = normalFromNoise(512, 5, 2.4, 8);
  const groundMat = new THREE.MeshStandardMaterial({ map: soil, normalMap: soilN, normalScale: new THREE.Vector2(GS.nrm, GS.nrm), roughness: 0.97 });
  const DUNE_U = Array.from({ length: DUNE_N }, () => new THREE.Vector4());   // 1x: ô đụn cát (x, nửa rộng, bật)
  groundMat.onBeforeCompile = sh => {
    sh.uniforms.uDune = { value: DUNE_U };
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vGW;\n" + GLSL_NOISE)
      .replace("#include <beginnormal_vertex>", `
        vec2 gw0 = (modelMatrix * vec4(position, 1.)).xz; float ge = 0.6;
        vec3 objectNormal = normalize(vec3(groundH(gw0 - vec2(ge, 0.)) - groundH(gw0 + vec2(ge, 0.)), 2. * ge, groundH(gw0 - vec2(0., ge)) - groundH(gw0 + vec2(0., ge))));
        #ifdef USE_TANGENT
          vec3 objectTangent = vec3(tangent.xyz);
        #endif`)
      .replace("#include <begin_vertex>", "vec3 transformed = vec3(position); transformed.y += groundH(gw0);")
      .replace("#include <uv_vertex>", "#include <uv_vertex>")
      .replace("#include <worldpos_vertex>", `#include <worldpos_vertex>
        vec4 gwp = modelMatrix * vec4(transformed, 1.); vGW = gwp.xyz;
        #ifdef USE_MAP
          vMapUv = gwp.xz * 0.11;
        #endif
        #ifdef USE_NORMALMAP
          vNormalMapUv = gwp.xz * 0.11;
        #endif`);
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vGW;\n" + GLSL_NOISE)
      .replace("#include <map_fragment>", `#include <map_fragment>
        float gn1 = fbm4(vGW.xz * 0.012), gn2 = vn(vGW.xz * 0.09), gd = -vGW.z;
        vec3 tint = mix(${f3(GS.tA)}, ${f3(GS.tB)}, smoothstep(0.35, 0.72, gn1));
        tint *= mix(0.9, 1.08, gn2);
        float shrub = smoothstep(0.74, 0.8, vn(vGW.xz * 0.55)) * smoothstep(60., 110., gd);
        tint = mix(tint, vec3(0.42, 0.42, 0.26), shrub * 0.7);
        tint = mix(tint, vec3(0.93, 0.66, 0.5), smoothstep(150., 700., gd) * 0.35);
        diffuseColor.rgb *= tint;`);
  };
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.receiveShadow = true; ground.frustumCulled = false;
  scene.add(ground);

  // ------------------------------------------------------------ 3 lớp dãy núi xa (shader, bám máy quay)
  const ranges = [
    { z: -1900, w: 7000, d: 700, amp: 230, f: 0.0011, seed: 1, tint: 0x7f7ea8, terr: 4 },
    { z: -1300, w: 5200, d: 500, amp: 150, f: 0.0017, seed: 2, tint: 0x9a7078, terr: 5 },
    { z: -880, w: 3800, d: 360, amp: 85, f: 0.0028, seed: 3, tint: 0xad6448, terr: 6 },
  ].map(R => { const m = makeRange(R); scene.add(m); return m; });

  // cột đá Monument Valley (dời lên trước khi rơi lại sau)
  const buttes = [];
  for (let i = 0; i < 14; i++) {
    const b = makeButte(i);
    b.position.set(-1600 + i * (3200 / 14) + rnd() * 120, -1, -500 - rnd() * 420);
    scene.add(b); buttes.push(b);
  }

  // ------------------------------------------------------------ tài nguyên tiền cảnh
  const grassGeo = crossCards(1.0, 0.85, 3);
  const bushGeo = crossCards(1.0, 0.9, 3);
  const grassMat = cardMaterial(grassTexture(), 0.07, 0.42);
  // 1k: bỏ cỏ cao lá to ⇒ CỎ BÔNG LAU (thân mảnh, bông lông tơ rủ, vàng kem óng ngược nắng) mọc thành khóm thưa,
  // + cỏ mảnh thấp mềm + cỏ lún phún sát đất
  const GR = {
    reed: { geo: P.bentCards(3, 0.9, 1.6, 0.1), mat: cardMaterial(P.reedTexture(1), 0.022, 0.6) },
    reed2: { geo: P.bentCards(3, 0.9, 1.6, 0.1), mat: cardMaterial(P.reedTexture(2), 0.026, 0.6) },
    fine: { geo: P.bentCards(3, 0.7, 0.8, 0.1), mat: cardMaterial(P.grassTexture("fine"), 0.05, 0.42) },
    stub: { geo: P.bentCards(3, 1.3, 0.42, 0.1), mat: cardMaterial(P.grassTexture("stub"), 0.03, 0.3) },
  };
  const BK = makeBunchKit(GR2); CARD_MATS.push(BK.mat);   // 1n: bụi cỏ sa mạc
  const ROCK = P.makeRockKit();
  const pebbleMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
  const bushMats = [cardMaterial(P.shrubTexture("sage"), 0.02, 0.2), cardMaterial(P.shrubTexture("rabbit"), 0.02, 0.22), cardMaterial(P.shrubTexture("green"), 0.02, 0.16)];   // 1l: bụi cành thưa lá nhỏ
  const cardDepth = mats => mats.map(m => new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: m.map, alphaTest: 0.45 }));
  const bushDepth = cardDepth(bushMats);
  const rockGeo = (() => { const g = new THREE.DodecahedronGeometry(1, 1), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(p, i); v.multiplyScalar(1 + N(v.x * 1.7 + 4, v.y * 1.7 + v.z) * 0.3); p.setXYZ(i, v.x, v.y * 0.55, v.z); } g.computeVertexNormals(); return g; })();
  const rockMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, flatShading: true });
  const ledgeGeo = (() => { const g = new THREE.BoxGeometry(1, 1, 1, 8, 3, 6), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const f = 1 + N(x * 3 + 1, z * 3) * 0.25; p.setXYZ(i, x * f, y + (y > 0 ? N(x * 4, z * 4) * 0.12 : 0), z * f); } g.computeVertexNormals(); return g; })();
  const ledgeMat = new THREE.MeshStandardMaterial({ map: strataTexture(), roughness: 0.95 });
  const NM = nearMoundKit();   // 1u: mô đất gần đường ray (null = gờ đá hộp cũ)
  // đường ray
  const ballastGeo = (() => { const s = new THREE.Shape(); s.moveTo(-1.9, 0); s.lineTo(1.9, 0); s.lineTo(1.35, 0.34); s.lineTo(-1.35, 0.34); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: CHUNK, bevelEnabled: false, steps: 1 }); g.rotateY(Math.PI / 2); return g; })();
  const ballastMat = new THREE.MeshStandardMaterial({ map: gravelTexture(), normalMap: normalFromNoise(256, 13, 3, 2), roughness: 0.95 });
  ballastMat.map.repeat.set(0.5, 0.5); ballastMat.normalMap.repeat.set(0.5, 0.5);
  const sleeperGeo = new THREE.BoxGeometry(0.3, 0.14, 2.55);
  const sleeperMat = new THREE.MeshStandardMaterial({ map: sleeperTexture(), roughness: 0.92 });
  const railGeo = (() => { const s = new THREE.Shape();
    const pts = [[-0.08, 0], [0.08, 0], [0.08, 0.02], [0.022, 0.035], [0.022, 0.11], [0.042, 0.12], [0.042, 0.16], [-0.042, 0.16], [-0.042, 0.12], [-0.022, 0.11], [-0.022, 0.035], [-0.08, 0.02]];
    s.moveTo(pts[0][0], pts[0][1]); pts.slice(1).forEach(([x, y]) => s.lineTo(x, y)); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: CHUNK, bevelEnabled: false }); g.rotateY(Math.PI / 2); return g; })();
  const railMat = new THREE.MeshStandardMaterial({ color: 0x8d8680, metalness: 0.9, roughness: 0.32 });
  const plateGeo = new THREE.BoxGeometry(0.22, 0.03, 0.3);
  const cactus = P.makeCactusKit();

  // ------------------------------------------------------------ các khúc tiền/trung cảnh
  const chunks = [];
  for (let i = 0; i < NCH; i++) {
    const c = buildChunk(1000 + i * 17);
    c.position.x = -CHUNK * 2 + i * CHUNK - CHUNK / 2;
    settle(c); scene.add(c); chunks.push(c);
  }

  // 1aa: cây cỏ/đá/xương rồng khúc cảnh ĐẶT THEO MẶT ĐẤT thật (1z đặt ở y 0 — xa ray đất nhô/trũng tới ±1,6 ⇒ lơ lửng/chìm);
  // khúc cảnh quay vòng sang chỗ mới thì đặt lại. Mặt đất không tính đụn cát: đụn cao hơn thì chỉ vùi cây đi.
  function keepBase(g) {
    for (let i = g.userData.nTrack; i < g.children.length; i++) {
      const o = g.children[i];
      if (o.isInstancedMesh) o.userData.baseM = o.instanceMatrix.array.slice(); else o.userData.baseY = o.position.y;
    }
  }
  // 1af: DẢI DỌN — intro Fight đặt ray thứ hai ở z −5,2 ⇒ ẩn cỏ/đá/cây mọc trong dải z [a, b] (đá cạnh ray từng mọc giữa 2 ray, che máy quay)
  var clearBand = null;   // var + function: settle() chạy ngay lúc dựng khúc cảnh (trên dòng này) — let/const sẽ lỗi TDZ
  function inBand(z) { return !!clearBand && z > clearBand[0] && z < clearBand[1]; }
  function settleOne(c, o) {
    if (o.isInstancedMesh) {
      const A = o.instanceMatrix.array, B = o.userData.baseM;
      for (let j = 0; j < o.count; j++) {
        A[j * 16 + 13] = B[j * 16 + 13] + groundBaseHeight(c.position.x + B[j * 16 + 12], B[j * 16 + 14]);
        const hide = inBand(B[j * 16 + 14]);
        for (const k of [0, 1, 2, 4, 5, 6, 8, 9, 10]) A[j * 16 + k] = hide ? 0 : B[j * 16 + k];
      }
      o.instanceMatrix.needsUpdate = true; o.boundingSphere = null; o.boundingBox = null;
    } else {
      if (o.userData.baseY != null) o.position.y = o.userData.baseY + groundBaseHeight(c.position.x + o.position.x, o.position.z);
      if (inBand(o.position.z)) { if (o.visible) { o.visible = false; o.userData.bandHid = true; } }
      else if (o.userData.bandHid) { o.visible = true; o.userData.bandHid = false; }
    }
  }
  function settle(c) { for (let i = c.userData.nTrack; i < c.children.length; i++) settleOne(c, c.children[i]); }

  // 1ab: saguaro cao — cây TIỀN CẢNH (gần ray) nhỏ lại còn ~55 %, lùi xa dần về cỡ cũ (thầy: "xương rồng tiền cảnh to quá")
  function tallSaguaro(r) {
    const x = r() * CHUNK, z = -16 - r() * 70, k = 0.55 + 0.45 * Math.min(1, Math.max(0, (-z - 25) / 35));
    return cactus.saguaro(x, z, (8.5 + r() * 7) * k, r);
  }

  function buildChunk(seed) {
    const r = mulberry(seed), g = new THREE.Group();
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s3 = new THREE.Vector3(), p3 = new THREE.Vector3(), e = new THREE.Euler();
    // đường ray: nền đá dăm + tà vẹt + đệm ray + 2 ray
    const ballast = new THREE.Mesh(ballastGeo, ballastMat); ballast.receiveShadow = true; g.add(ballast);
    const nS = Math.round(CHUNK / 0.62);
    const sleepers = new THREE.InstancedMesh(sleeperGeo, sleeperMat, nS);
    const plates = new THREE.InstancedMesh(plateGeo, rockMat, nS * 2);
    for (let i = 0; i < nS; i++) {
      const x = i * 0.62 + 0.31 + (r() - 0.5) * 0.04;
      m4.compose(p3.set(x, 0.41, (r() - 0.5) * 0.05), q.setFromEuler(e.set(0, (r() - 0.5) * 0.05, 0)), s3.set(1, 1, 1)); sleepers.setMatrixAt(i, m4);
      for (const k of [0, 1]) { m4.compose(p3.set(x, 0.49, k ? 0.68 : -0.68), q.identity(), s3.set(1, 1, 1)); plates.setMatrixAt(i * 2 + k, m4); plates.setColorAt(i * 2 + k, new THREE.Color(0x3a3430)); }
    }
    sleepers.receiveShadow = true; sleepers.castShadow = true; plates.receiveShadow = true; g.add(sleepers, plates);
    for (const z of [-0.68, 0.68]) { const rl = new THREE.Mesh(railGeo, railMat); rl.position.set(0, 0.46 + 0.005, z); rl.castShadow = true; rl.receiveShadow = true; g.add(rl); }
    g.userData.nTrack = g.children.length;   // 1aa: con từ đây trở đi là cây cỏ/đá (đặt theo mặt đất)
    const zOk = z => Math.abs(z) > 2.3;
    // 1n: BỤI CỎ SA MẠC như ảnh thầy gửi — thay toàn bộ lau, cỏ, bụi (giữ xương rồng). Gần: bụi nhiều lá; xa: bụi ít lá.
    {
      const lists = [[], [], [], [], []];
      const nG = Math.round(GR2.n * (Z_FRONT + Z_BACK) / 90);   // 1aa: giữ mật độ cũ trên dải rộng hơn
      for (let i = 0; i < nG; i++) {
        let z; do { z = Z_FRONT - (Z_FRONT + Z_BACK) * Math.pow(r(), 1.05); } while (!zOk(z));   // 1aa: bỏ vạt thưa z > 9
        const x = r() * CHUNK, sc = (GR2.s[0] + r() * (GR2.s[1] - GR2.s[0])) * (z > 1.5 && z < 11 ? 0.6 : 1);
        lists[z < -32 ? 4 : z < -8 ? 3 : i % 3].push([x, z, sc, r() * 6, 0.8 + r() * 0.45, (r() - 0.5) * 0.12]);
      }
      lists.forEach((L, k) => {
        if (!L.length) return;
        const inst = new THREE.InstancedMesh(BK.geos[k], BK.mat, L.length);
        L.forEach(([x, z, sc, ry, sy, tl], i) => { m4.compose(p3.set(x, -0.02, z), q.setFromEuler(e.set(tl, ry, tl * 0.7)), s3.set(sc, sc * sy, sc)); inst.setMatrixAt(i, m4); inst.setColorAt(i, new THREE.Color(1, 1, 1).offsetHSL(0, 0, (r() - 0.5) * 0.14)); });
        inst.castShadow = k < 4; inst.receiveShadow = true; g.add(inst);
      });
      // 1af: DẢI CHUYỂN — sau vạt cỏ (z −Z_BACK) cỏ thưa dần qua 86 đv rồi hết; lác đác vài bụi xa hơn nữa
      const band = [];
      const nB = Math.round(GR2.n * 86 / 90 * 0.8);
      for (let i = 0; i < nB; i++) {
        const u = r(), z = -Z_BACK - 86 * u;
        if (r() > Math.pow(1 - u, 1.6)) continue;           // càng xa càng thưa
        band.push([r() * CHUNK, z, (GR2.s[0] + r() * (GR2.s[1] - GR2.s[0])) * 1.1, r() * 6, 0.8 + r() * 0.45]);
      }
      for (let i = 0; i < 10; i++) band.push([r() * CHUNK, -Z_BACK - 86 - r() * 60, (GR2.s[0] + r() * (GR2.s[1] - GR2.s[0])) * 1.1, r() * 6, 0.8 + r() * 0.4]);
      if (band.length) {
        const inst = new THREE.InstancedMesh(BK.geos[4], BK.mat, band.length);
        band.forEach(([x, z, sc, ry, sy], i) => { m4.compose(p3.set(x, -0.02, z), q.setFromEuler(e.set(0, ry, 0)), s3.set(sc, sc * sy, sc)); inst.setMatrixAt(i, m4); inst.setColorAt(i, new THREE.Color(1, 1, 1).offsetHSL(0, 0, (r() - 0.5) * 0.14)); });
        inst.receiveShadow = true; g.add(inst);
      }
    }
    // mẫu có bụi ngải xám (như rặng bụi xa trong ảnh)
    if (GR2.sage) [[0, GR2.sage], [1, Math.round(GR2.sage * 0.3)]].forEach(([k, n]) => {
      const bush = new THREE.InstancedMesh(bushGeo, bushMats[k], n);
      for (let i = 0; i < n; i++) {
        let z; do { z = 12 - 88 * Math.pow(r(), 0.9); } while (!zOk(z) || (z > 1.5 && z < 11));
        const x = r() * CHUNK, sc = 0.6 + r() * 0.8;
        m4.compose(p3.set(x, -0.05, z), q.setFromEuler(e.set(0, r() * 6, 0)), s3.set(sc * (1.1 + r() * 0.5), sc * (0.6 + r() * 0.35), sc)); bush.setMatrixAt(i, m4);
        bush.setColorAt(i, new THREE.Color(0xffffff).offsetHSL(0, 0, (r() - 0.5) * 0.14));
      }
      bush.castShadow = true; bush.receiveShadow = true; bush.customDepthMaterial = bushDepth[k]; g.add(bush);
    });
    // đá sa thạch chi tiết (4 dáng) + sỏi nhỏ
    ROCK.protos.forEach((geo, k) => {
      const n = Math.max(1, Math.round(GS.veg.rock * (Z_FRONT + 71) / 85)), inst = new THREE.InstancedMesh(geo, ROCK.mat, n);
      for (let i = 0; i < n; i++) {
        let z; do { z = Z_FRONT - (Z_FRONT + 71) * r(); } while (!zOk(z));
        const sc = 0.18 + Math.pow(r(), 2.5) * (k === 3 ? 1.6 : 0.9);
        m4.compose(p3.set(r() * CHUNK, sc * 0.12, z), q.setFromEuler(e.set((r() - 0.5) * 0.3, r() * 6, (r() - 0.5) * 0.3)), s3.set(sc, sc * (0.8 + r() * 0.5), sc * (0.8 + r() * 0.5)));
        inst.setMatrixAt(i, m4);
      }
      inst.castShadow = true; inst.receiveShadow = true; g.add(inst);
    });
    const nP = Math.max(1, Math.round(GS.veg.peb * 1.3)), peb = new THREE.InstancedMesh(ROCK.pebble, pebbleMat, nP);
    for (let i = 0; i < nP; i++) {
      let z; do { z = 15 + (Z_FRONT - 15) * r() * r() - 60 * Math.pow(r(), 1.6); } while (!zOk(z));   // 1aa: thêm sỏi dải sát máy quay
      const sc = 0.03 + r() * 0.09;
      m4.compose(p3.set(r() * CHUNK, sc * 0.3, z), q.setFromEuler(e.set(r() * 3, r() * 3, r() * 3)), s3.set(sc * (1 + r()), sc * 0.6, sc)); peb.setMatrixAt(i, m4);
      peb.setColorAt(i, new THREE.Color().setHSL(0.06 + r() * 0.03, 0.35 + r() * 0.2, 0.32 + r() * 0.3));
    }
    peb.receiveShadow = true; g.add(peb);
    // 1m: hoa dại li ti (kiểu đồng cỏ / thảo nguyên)
    if (GR2.flowers) {   // 1n: bụi cỏ không kèm hoa
      const FK = P.farGrassKit(), nF = GS.veg.flowers, fl = new THREE.InstancedMesh(FK.flowerGeo, FK.flowerMat, nF);
      for (let i = 0; i < nF; i++) {
        let z; do { z = 14 - 88 * Math.pow(r(), 1.3); } while (!zOk(z));
        const sc = (0.45 + r() * 0.5) * (z > 1.5 && z < 11 ? 0.8 : 1);
        m4.compose(p3.set(r() * CHUNK, -0.03, z), q.setFromEuler(e.set(0, r() * 6, 0)), s3.set(sc, sc * (0.8 + r() * 0.4), sc)); fl.setMatrixAt(i, m4);
      }
      fl.receiveShadow = true; g.add(fl);
    }
    if (NM) for (const it of NM.items) {   /* 1u: mô đất chi tiết, rải gần + trung cảnh (tránh lòng đường ray) */
      const nM = Math.round(it.n * (Z_FRONT + 48) / 60), inst = new THREE.InstancedMesh(it.geo, it.mat, nM);   // 1aa: đống đá cả dải sát máy quay
      for (let i = 0; i < nM; i++) {
        let z; do { z = Z_FRONT - (Z_FRONT + 48) * Math.pow(r(), 1.2); } while (Math.abs(z) < 3.2 || (z > 5 && z < 12 && r() < 0.6));
        const w = it.w[0] + r() * (it.w[1] - it.w[0]), h = it.h ? it.h[0] + r() * (it.h[1] - it.h[0]) : w * (0.85 + r() * 0.3), k = z > 1.5 && z < 11 ? 0.6 : 1;
        m4.compose(p3.set(r() * CHUNK, -0.08, z), q.setFromEuler(e.set(0, r() * 6, 0)), s3.set(w * k, h * k, w * (0.7 + r() * 0.4) * k)); inst.setMatrixAt(i, m4);
      }
      inst.castShadow = true; inst.receiveShadow = true; g.add(inst);
    } else {
    const nL = 5, ledges = new THREE.InstancedMesh(ledgeGeo, ledgeMat, nL);
    for (let i = 0; i < nL; i++) {
      const z = -6 - r() * 55, x = r() * CHUNK, w = 2 + r() * 6;
      m4.compose(p3.set(x, 0.1, z), q.setFromEuler(e.set(0, r() * 3, 0)), s3.set(w, 0.5 + r() * 1.1, w * (0.4 + r() * 0.4))); ledges.setMatrixAt(i, m4);
    }
    ledges.castShadow = true; ledges.receiveShadow = true; g.add(ledges);
    }
    // xương rồng: saguaro CAO ở trung/xa cảnh, tai thỏ mọc nối nhau, thỉnh thoảng một cây ở tiền cảnh
    const nSag = 2 + Math.floor(r() * 2);
    for (let i = 0; i < nSag; i++) g.add(tallSaguaro(r));
    for (let i = 0; i < 3; i++) { let z; do { z = 3 - r() * 38; } while (!zOk(z)); g.add(cactus.opuntia(r() * CHUNK, z, (0.9 + r() * 0.8) * (z > -10 ? 0.6 : 1), r)); }   // 1ab: gần ray nhỏ lại (che bánh tàu); trả vùng cũ (1aa rải tới sát máy quay ⇒ bụi tai thỏ to chình ình góc dưới màn chơi)
    if (r() < 0.35) { const fx = 8 + r() * (CHUNK - 16); // tiền cảnh chỉ cây THẤP (dưới tầm bảng chữ toa đáp án đang ở giữa màn)
      if (r() < 0.5) g.add(cactus.saguaro(fx, 9 + r() * 4, (2.1 + r() * 0.5) * 0.7, r)); else g.add(cactus.opuntia(fx, 6 + r() * 5, (0.9 + r() * 0.3) * 0.65, r)); }   // 1ab: tiền cảnh nhỏ lại
    keepBase(g);
    return g;
  }

  // 1i: khúc cảnh quay vòng lên trước ⇒ saguaro cũ bỏ đi, mọc cây MỚI (dáng khác hẳn) ở chỗ khác
  function regrow(c) {
    const r = mulberry((Math.random() * 1e9) | 0);
    for (const o of c.children.slice()) if (o.userData.saguaro) { c.remove(o); o.geometry.dispose(); }
    const nSag = 2 + Math.floor(r() * 2), plant = o => { o.userData.baseY = o.position.y; settleOne(c, o); c.add(o); };   // 1aa: cây mới cũng đặt theo mặt đất
    for (let i = 0; i < nSag; i++) plant(tallSaguaro(r));
    if (r() < 0.18) { const fx = 8 + r() * (CHUNK - 16); plant(cactus.saguaro(fx, 9 + r() * 4, (2.1 + r() * 0.5) * 0.7, r)); }
  }

  // ------------------------------------------------------------ bụi vàng lấp lánh trong nắng (bám máy quay)
  const dustN = 520, dpos = new Float32Array(dustN * 3), dseed = new Float32Array(dustN);
  for (let i = 0; i < dustN; i++) { dpos.set([(rnd() - 0.5) * 70, rnd() * 18, -20 + rnd() * 40], i * 3); dseed[i] = rnd() * 100; }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dpos, 3));
  dustGeo.setAttribute("seed", new THREE.BufferAttribute(dseed, 1));
  const dustMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { time: U.time, camX: U.camX, px: { value: renderer.getPixelRatio() } },
    vertexShader: `attribute float seed; uniform float time; uniform float camX; uniform float px; varying float vA;
      void main(){ vec3 p = position; p.x = camX + mod(p.x + seed * 7. + time * 0.6 - camX + 35., 70.) - 35.; p.y += sin(time * 0.4 + seed) * 0.8; p.z += cos(time * 0.3 + seed * 1.7) * 0.6;
        vec4 mv = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv;
        float tw = 0.5 + 0.5 * sin(time * 2.3 + seed * 13.);
        vA = tw * smoothstep(60., 10., -mv.z);
        gl_PointSize = px * (2.0 + 3.0 * tw) * (18. / -mv.z); }`,
    fragmentShader: `varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d); gl_FragColor = vec4(1.0, 0.86, 0.6, a * vA * 0.55); }`,
  });
  const dust = new THREE.Points(dustGeo, dustMat); dust.frustumCulled = false; scene.add(dust);

  // ------------------------------------------------------------ kền kền lượn xa
  const birds = [];
  const birdMat = new THREE.MeshBasicMaterial({ color: 0x2a1f1c, side: THREE.DoubleSide });
  for (let i = 0; i < 4; i++) {
    const g = new THREE.Group();
    const wingGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0.3), new THREE.Vector3(0, 0, -0.3), new THREE.Vector3(2.4, 0.2, 0)]);
    const l = new THREE.Mesh(wingGeo, birdMat), r = new THREE.Mesh(wingGeo, birdMat); r.scale.x = -1;
    g.add(l, r); g.userData = { l, r, a: rnd() * 6, rad: 18 + rnd() * 14, cx: -60 + rnd() * 140, cz: -150 - rnd() * 60, y: 55 + rnd() * 25, sp: 0.08 + rnd() * 0.05 };
    scene.add(g); birds.push(g);
  }

  // ------------------------------------------------------------ chữ Hollywood · lạc đà · đàn chim
  const hillMat = new THREE.MeshStandardMaterial({ map: soil.clone(), color: 0xf0c49a, roughness: 1 });
  hillMat.map.repeat.set(10, 4); hillMat.map.needsUpdate = true;
  const signs = P.createHillSigns(scene, hillMat);
  // 1ah: TIẾNG con vật / chữ đổ — khoảng cách tính từ máy quay thật (xa ⇒ nhỏ, đục, vang)
  let sfxW = null;
  const camD = (x, y, z) => (viewCam ? Math.hypot(viewCam.position.x - x, viewCam.position.y - y, viewCam.position.z - z) : 80);
  const hook = {
    voice(kind, x, z) { if (sfxW) sfxW.animal(kind, camD(x, 1.5, z)); },
    steps(key, kind, x, z, spd) { if (sfxW) sfxW.steps(key, kind, camD(x, 0.5, z), spd); },
  };
  const animals = createFarAnimals(scene, hillMat, hook);
  const charger = createSignCharger(scene, signs);
  const chase = createChase(scene, hook);
  let viewCam = null; const _fr = new THREE.Frustum(), _pm = new THREE.Matrix4(), _bx = new THREE.Box3();   // 1ag
  { const knock0 = signs.knock, _gp = new THREE.Vector3();   // 1ah: chữ bị húc ⇒ gãy gỗ + chữ nặng đổ xuống cát
    signs.knock = i => { const ok = knock0(i); const sg = signs.current(); const m = sg && sg.userData.glyphs[i];
      if (ok && m && sfxW) { m.getWorldPosition(_gp); sfxW.knock(camD(_gp.x, _gp.y, _gp.z)); } return ok; }; }
  const signChase = createSignChase(scene, signs, hook);   // 1w: cặp thú đuổi nhau trên gờ chữ — chạy vòng quanh chữ / húc đổ chữ
  const flocks = P.createBirdFlocks(scene);

  // ------------------------------------------------------------ dựng
  function makeRange({ z, w, d, amp, f, seed, tint, terr }) {
    const geo = new THREE.PlaneGeometry(w, d, 420, 70); geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshStandardMaterial({ roughness: 1 });
    const base = new THREE.Color(tint), hi = base.clone().offsetHSL(0.01, -0.05, 0.12), lo = base.clone().offsetHSL(-0.01, 0.05, -0.12);
    mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, { rA: { value: amp }, rF: { value: f }, rT: { value: terr }, rZ: { value: z }, rD: { value: d }, rS: { value: seed * 17.3 }, cLo: { value: lo }, cBase: { value: base }, cHi: { value: hi } });
      const fn = `uniform float rA, rF, rT, rZ, rD, rS; varying float vH; varying vec2 vRW;
        float rangeH(vec2 w){ float nz = (w.y - rZ) / rD; float prof = smoothstep(0.5, -0.15, nz);
          float n = max(0., ridge(w * rF + rS) * 1.25 - 0.18); float t = n * rT; float ter = (floor(t) + smoothstep(0.25, 0.75, fract(t))) / rT;
          return rA * (ter * 0.8 + n * 0.2) * prof; }`;
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\n" + GLSL_NOISE + fn)
        .replace("#include <beginnormal_vertex>", `vec2 rw0 = (modelMatrix * vec4(position, 1.)).xz; float re = rD / 70.;
          vec3 objectNormal = normalize(vec3(rangeH(rw0 - vec2(re, 0.)) - rangeH(rw0 + vec2(re, 0.)), 2. * re, rangeH(rw0 - vec2(0., re)) - rangeH(rw0 + vec2(0., re))));`)
        .replace("#include <begin_vertex>", "vec3 transformed = vec3(position); vH = rangeH(rw0); transformed.y += vH; vRW = rw0;");
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", "#include <common>\nuniform float rA; uniform vec3 cLo, cBase, cHi; varying float vH; varying vec2 vRW;\n" + GLSL_NOISE)
        .replace("#include <color_fragment>", `#include <color_fragment>
          float band = 0.5 + 0.5 * sin(vH * 0.22 + vn(vec2(vRW.x * 0.01, vH * 0.05)) * 2.5);
          diffuseColor.rgb = mix(cLo, cBase, smoothstep(0., rA * 0.3, vH)); diffuseColor.rgb = mix(diffuseColor.rgb, cHi, band * 0.45);`);
    };
    const m = new THREE.Mesh(geo, mat);
    m.position.set(0, -2, z); m.frustumCulled = false; m.userData.step = w / 420;
    return m;
  }

  function makeButte(i) {
    const r = mulberry(300 + i), rad = 14 + r() * 50, h = 40 + r() * 55;
    const geo = new THREE.CylinderGeometry(rad, rad, h, 72, 40, false);
    const p = geo.attributes.position, col = new Float32Array(p.count * 3);
    const cA = new THREE.Color(0xb3542e), cB = new THREE.Color(0xd07a48), cC = new THREE.Color(0x8e3f24), cTop = new THREE.Color(0xc98a5a), c = new THREE.Color();
    for (let k = 0; k < p.count; k++) {
      let vx = p.getX(k), vy = p.getY(k), vz = p.getZ(k);
      const t = Math.max(0, Math.min(1, (vy + h / 2) / h)), a = Math.atan2(vz, vx), rr = Math.hypot(vx, vz);
      if (rr > 0.001) {
        let f = 1 + N(Math.cos(a) * 2 + i * 3, Math.sin(a) * 2 + t * 3) * 0.22 + N(a * 6, t * 9 + i) * 0.05;
        f += (Math.floor(t * 7) / 7 - t) * 0.06;
        if (t < 0.3) f *= 1 + Math.pow((0.3 - t) / 0.3, 1.6) * 1.1;
        vx *= f; vz *= f;
      }
      const yy = t < 0.3 ? h * (0.3 * Math.pow(t / 0.3, 1.25)) : vy + h / 2;
      p.setXYZ(k, vx, yy, vz);
      const band = 0.5 + 0.5 * Math.sin(t * 38 + N(a * 2, t * 4) * 3);
      c.copy(cA).lerp(cB, band * 0.6).lerp(cC, smooth(0.35, 0.05, t) * 0.5);
      if (vy > h / 2 - 0.01 && rr < rad * 0.999) c.copy(cTop);
      col.set([c.r, c.g, c.b], k * 3);
    }
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }));
    m.rotation.y = i * 1.3; m.receiveShadow = true;
    return m;
  }

  return {
    sun, animals, charger, signs, chase, signChase, flocks,   // 1ab: flocks cho bàn thử
    setCamera(cam) { chase.setCamera(cam); animals.setCamera(cam); viewCam = cam; },
    setSound(s) { sfxW = s; },   // 1ah   // 1af/1ag: con vật biết khung hình thật
    setClearBand(band) { clearBand = band; for (const c of chunks) settle(c); },   // 1af: [zMin, zMax] hoặc null
    update(dt, t, camX, trainX = camX, viewX = camX, regrowOK = true) {
      signs.update(camX, 95);
      // 1ag: điều phối — 1 cặp đuổi nhau (dải xa hoặc quanh chữ) · ≤ 2 con ra xem · con ra xem né cặp đuổi nhau
      const threats = [];
      if (chase.active) for (const A of chase.active.all) threats.push(A.g.position);
      if (signChase.active) for (const A of [signChase.active.prey, signChase.active.chaser]) threats.push(A.g.position);
      // bảng chữ đang ở trước mặt ⇒ nhường suất cho cặp húc chữ (không thì cặp dải xa chiếm suất gần như suốt)
      const signNear = () => { const sg = signs.current(); return !!sg && Math.abs(sg.position.x - camX) < 75; };
      chase.update(dt, camX, { canSpawn: () => !signChase.active && !signNear() });
      signChase.update(dt, camX, { canSpawn: () => !chase.active });
      animals.update(dt, camX, trainX, { threats });   // (con húc chữ từ sau đồi đã tắt từ 1w — chữ chỉ bị cặp đuổi quanh chữ húc đổ)
      // 1ag: chữ đổ chỉ dựng lại khi bảng chữ KHUẤT khỏi khung hình
      if (viewCam) {
        viewCam.updateMatrixWorld(); _pm.multiplyMatrices(viewCam.projectionMatrix, viewCam.matrixWorldInverse); _fr.setFromProjectionMatrix(_pm);
        signs.restoreHidden(b => _fr.intersectsBox(_bx.setFromObject(b.userData.letters || b)));
      }   /* 1w: bỏ con húc từ sau đồi (vách đứng) — thay bằng cặp đuổi nhau trên gờ */ flocks.update(dt, t, camX);
      U.time.value = t; U.camX.value = camX;
      for (let i = 0; i < DUNE_N; i++) DUNE_U[i].fromArray(DUNES, i * 4);
      for (const m of CARD_MATS) if (m.userData.shader) m.userData.shader.uniforms.time.value = t;
      sky.position.x = camX;
      const sx = Math.round(camX / 0.05) * 0.05;
      sun.position.set(sx, 0, 0).addScaledVector(SUN_DIR, 160); sun.target.position.set(sx, 0, 0);
      fill.position.set(camX + 10, 12, 40); fill.target.position.set(camX, 0, 0);
      ground.position.x = Math.round(camX / GSEG) * GSEG;
      for (const m of ranges) m.position.x = Math.round(camX / m.userData.step) * m.userData.step;
      for (const b of buttes) if (b.position.x < camX - 1700) { b.position.x += 3200; b.position.z = -500 - Math.random() * 420; b.rotation.y = Math.random() * 6; b.scale.setScalar(0.7 + Math.random() * 0.6); }
      // 1aa: khúc cảnh quay vòng CẢ 2 CHIỀU quanh chỗ máy quay nhìn (viewX); chỉ mọc lại saguaro khi đang chơi (intro cần cây đã chọn đứng yên)
      const span = NCH * CHUNK, lo = viewX - span / 2 + CHUNK * 0.5;   // lệch lên trước nửa khúc (tàu chạy về +x)
      for (const c of chunks) {
        if (c.position.x + CHUNK < lo) { c.position.x += span; if (regrowOK) regrow(c); settle(c); }
        else if (c.position.x >= lo + span) { c.position.x -= span; settle(c); }
      }
      for (const b of birds) {
        const u = b.userData; u.a += dt * u.sp;
        b.position.set(camX * 0.9 + u.cx + Math.cos(u.a) * u.rad, u.y + Math.sin(u.a * 2) * 2, u.cz + Math.sin(u.a) * u.rad);
        b.rotation.y = -u.a; b.rotation.z = 0.3;
        const fl = Math.sin(t * 3 + u.cx) * 0.25; u.l.rotation.z = fl; u.r.rotation.z = -fl;
      }
    },
  };
}

// --------------------------------------------------------------------- vật liệu thẻ cỏ/bụi (đung đưa trong gió)
function cardMaterial(map, sway, glow = 0.3) {
  // nắng xuyên lá: tự sáng một phần theo màu lá (ngược sáng giờ vàng thì cỏ vẫn vàng óng, không đen)
  const m = new THREE.MeshStandardMaterial({ map, alphaTest: 0.3, alphaToCoverage: true, side: THREE.DoubleSide,   // 1j: mép lá mịn (khử răng cưa theo alpha) ⇒ lá mảnh không dính thành tấm
    roughness: 1, emissive: new THREE.Color(glow, glow * 0.9, glow * 0.7), emissiveMap: map });
  m.customProgramCacheKey = () => "card" + sway;
  CARD_MATS.push(m);
  m.onBeforeCompile = sh => {
    sh.uniforms.time = { value: 0 };
    m.userData.shader = sh;
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nuniform float time;")
      .replace("#include <begin_vertex>", `vec3 transformed = vec3(position);
        #ifdef USE_INSTANCING
          float ph = instanceMatrix[3].x * 0.35 + instanceMatrix[3].z * 0.21;
        #else
          float ph = 0.;
        #endif
        float gust = 0.6 + 0.4 * sin(time * 0.45 + ph * 0.1);
        transformed.x += position.y * position.y * ${sway.toFixed(3)} * 14. * gust * sin(time * 1.8 + ph);
        transformed.z += position.y * position.y * ${sway.toFixed(3)} * 6. * cos(time * 1.3 + ph);`);
    // 1j: giữ sợi cỏ SẮC ở xa — bù độ phủ theo mức mip + làm sắc mép alpha (không nhoè thành tấm lá)
    sh.fragmentShader = sh.fragmentShader.replace("#include <alphatest_fragment>", `
      #ifdef USE_MAP
        vec2 tsz = vMapUv * 1024.;
        float mipK = max(0., log2(max(length(dFdx(tsz)), length(dFdy(tsz)))));
        diffuseColor.a *= 1. + mipK * 0.3;
      #endif
      diffuseColor.a = clamp((diffuseColor.a - 0.42) / max(fwidth(diffuseColor.a), 0.0001) + 0.5, 0., 1.);
      if (diffuseColor.a < 0.02) discard;`);
  };
  return m;
}
const CARD_MATS = [];

// 3 thẻ cắt chéo, gốc ở đáy, pháp tuyến hướng lên (ánh sáng mềm như cỏ thật)
function crossCards(w, h, n) {
  const parts = [];
  for (let i = 0; i < n; i++) {
    const g = new THREE.PlaneGeometry(w, h); g.translate(0, h / 2, 0); g.rotateY(i * Math.PI / n);
    const nr = g.attributes.normal; for (let k = 0; k < nr.count; k++) nr.setXYZ(k, 0, 1, 0);
    parts.push(g);
  }
  return mergeGeometries(parts);
}

// --------------------------------------------------------------------- bộ xương rồng
function makeCactusKit(N) {
  const sagMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7 });
  const padMat = new THREE.MeshStandardMaterial({ map: padTexture(), roughness: 0.7 });
  const fruitMat = new THREE.MeshStandardMaterial({ color: 0xa3263a, roughness: 0.5 });
  const ribbedColor = (geo, ribs, radialSeg, isTube) => {
    const p = geo.attributes.position, n = geo.attributes.normal, col = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      const j = isTube ? i % (radialSeg + 1) : i % (radialSeg + 1);
      const a = j / radialSeg * Math.PI * 2, rib = Math.cos(a * ribs);
      const d = rib * 0.06;
      p.setXYZ(i, p.getX(i) + n.getX(i) * d, p.getY(i) + n.getY(i) * d, p.getZ(i) + n.getZ(i) * d);
      const k = 0.62 + 0.38 * (rib * 0.5 + 0.5);
      col.set([0.33 * k, 0.47 * k, 0.22 * k], i * 3);
    }
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals();
    return geo;
  };
  function saguaro(x, z, h, r) {
    const R = h * 0.075, parts = [];
    const trunk = new THREE.CylinderGeometry(R * 0.92, R, h, 28, 10, true); trunk.translate(0, h / 2, 0); parts.push(ribbedColor(trunk, 12, 28));
    const top = new THREE.SphereGeometry(R * 0.92, 28, 10, 0, Math.PI * 2, 0, Math.PI / 2); top.translate(0, h, 0); parts.push(ribbedColor(top, 12, 28));
    const arms = r() < 0.15 ? 0 : 1 + Math.floor(r() * 3);
    for (let i = 0; i < arms; i++) {
      const ang = r() * Math.PI * 2, ay = h * (0.35 + r() * 0.3), out = R * (2.2 + r()), up = h * (0.2 + r() * 0.22), rr = R * 0.72;
      const dir = new THREE.Vector3(Math.cos(ang), 0, Math.sin(ang));
      const pts = [new THREE.Vector3(0, ay, 0), dir.clone().multiplyScalar(out * 0.6).setY(ay + rr * 0.1), dir.clone().multiplyScalar(out).setY(ay + out * 0.55), dir.clone().multiplyScalar(out).setY(ay + out * 0.55 + up)];
      const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, rr, 20, false);
      parts.push(ribbedColor(tube, 10, 20, true));
      const cap = new THREE.SphereGeometry(rr, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2); cap.translate(pts[3].x, pts[3].y, pts[3].z); parts.push(ribbedColor(cap, 10, 20));
    }
    parts.forEach(p => { if (p.index) {} });
    const geo = mergeGeometries(parts.map(p => p.index ? p.toNonIndexed() : p));
    const m = new THREE.Mesh(geo, sagMat); m.castShadow = true; m.receiveShadow = true;
    m.position.set(x, -0.1, z); m.rotation.y = r() * 6;
    return m;
  }
  function opuntia(x, z, s, r) {
    const g = new THREE.Group();
    const pad = (px, py, pz, rz, ry, sc) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.5, 18, 12), padMat);
      m.scale.set(0.8 * sc, 1.0 * sc, 0.16 * sc); m.position.set(px, py, pz); m.rotation.set(0, ry, rz); m.castShadow = true; m.receiveShadow = true; g.add(m);
      if (r() < 0.35) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.07 * sc, 8, 6), fruitMat); f.position.set(px + Math.sin(-rz) * 0.5 * sc, py + Math.cos(rz) * 0.5 * sc, pz); g.add(f); }
      return [px + Math.sin(-rz) * 0.85 * sc, py + Math.cos(rz) * 0.85 * sc, pz];
    };
    const n = 3 + Math.floor(r() * 4);
    for (let i = 0; i < n; i++) {
      const [bx, by, bz] = pad((r() - 0.5) * 0.9, 0.42, (r() - 0.5) * 0.6, (r() - 0.5) * 0.8, r() * 3, 0.9 + r() * 0.3);
      if (r() < 0.8) { const [cx, cy, cz] = pad(bx, by + 0.35, bz, (r() - 0.5) * 1.2, r() * 3, 0.75 + r() * 0.2); if (r() < 0.5) pad(cx, cy + 0.3, cz, (r() - 0.5) * 1.3, r() * 3, 0.6); }
    }
    g.scale.setScalar(s); g.position.set(x, 0, z);
    return g;
  }
  return { saguaro, opuntia };
}

// --------------------------------------------------------------------- kết cấu vẽ bằng canvas
function canvasTexture(w, h, draw, repeat = true) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
function grassTexture() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    const r = mulberry(77);
    for (let i = 0; i < 230; i++) {
      const x0 = w / 2 + (r() - 0.5) * w * 0.34, len = h * (0.35 + r() * 0.6), lean = (r() - 0.5) * w * 0.7, wid = 2 + r() * 4;
      const tone = r();
      const col = tone < 0.4 ? [196 + r() * 40, 170 + r() * 40, 90 + r() * 30] : tone < 0.75 ? [150 + r() * 40, 150 + r() * 30, 70 + r() * 20] : [220 + r() * 30, 200 + r() * 30, 130 + r() * 30];
      const grd = ctx.createLinearGradient(0, h, 0, h - len);
      grd.addColorStop(0, `rgb(${col[0] * 0.55 | 0},${col[1] * 0.55 | 0},${col[2] * 0.5 | 0})`); grd.addColorStop(1, `rgb(${col[0] | 0},${col[1] | 0},${col[2] | 0})`);
      ctx.strokeStyle = grd; ctx.lineWidth = wid; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(x0, h); ctx.quadraticCurveTo(x0 + lean * 0.2, h - len * 0.6, x0 + lean, h - len); ctx.stroke();
      if (r() < 0.25) { ctx.fillStyle = `rgba(${col[0] | 0},${col[1] * 0.95 | 0},${col[2] * 0.8 | 0},1)`; ctx.beginPath(); ctx.ellipse(x0 + lean, h - len, 3, 9, lean / w, 0, 7); ctx.fill(); }
    }
  }, false);
}
function bushTexture(kind) {
  return canvasTexture(512, 512, (ctx, w, h) => {
    const r = mulberry(kind.length * 13);
    const pal = kind === "sage" ? [[128, 138, 104], [150, 160, 124], [104, 112, 84], [170, 176, 140]]
      : kind === "rabbit" ? [[122, 134, 70], [150, 150, 70], [208, 180, 70], [226, 196, 86]]
        : [[82, 100, 52], [100, 120, 60], [70, 86, 44], [124, 138, 76]];
    // cành
    ctx.strokeStyle = "rgb(84,66,48)"; ctx.lineCap = "round";
    for (let i = 0; i < 26; i++) { const a = -Math.PI / 2 + (r() - 0.5) * 2.2, L = h * (0.25 + r() * 0.4); ctx.lineWidth = 2 + r() * 3; ctx.beginPath(); ctx.moveTo(w / 2 + (r() - 0.5) * 40, h); ctx.lineTo(w / 2 + Math.cos(a) * L, h + Math.sin(a) * L); ctx.stroke(); }
    // tán lá: nhiều chấm nhỏ thành vòm
    for (let i = 0; i < 2600; i++) {
      const a = r() * Math.PI, rr = Math.sqrt(r()), x = w / 2 + Math.cos(a) * rr * w * 0.46 * (r() < 0.5 ? 1 : -1) * 1, y = h - Math.sin(a) * rr * h * 0.78 - 10;
      const top = 1 - (y / h);
      const c = pal[Math.min(3, Math.floor(r() * 2 + top * 2.2))];
      ctx.fillStyle = `rgb(${c[0] + (r() - 0.5) * 20 | 0},${c[1] + (r() - 0.5) * 20 | 0},${c[2] + (r() - 0.5) * 20 | 0})`;
      ctx.beginPath(); ctx.ellipse(x, y, 3 + r() * 5, 2 + r() * 4, r() * 3, 0, 7); ctx.fill();
    }
  }, false);
}
// nhiễu giá trị LẶP LIỀN MẠCH (chu kỳ P ô) ⇒ kết cấu đất ghép không lộ đường nối
function tileNoise(seed, P) {
  const r = mulberry(seed), g = new Float32Array(P * P); for (let i = 0; i < g.length; i++) g[i] = r();
  const at = (x, y) => g[((y % P + P) % P) * P + ((x % P + P) % P)];
  return (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    return (at(xi, yi) * (1 - u) + at(xi + 1, yi) * u) * (1 - v) + (at(xi, yi + 1) * (1 - u) + at(xi + 1, yi + 1) * u) * v - 0.5; };
}
function soilTexture(S) {
  return canvasTexture(1024, 1024, (ctx, w, h) => {
    const r = mulberry(21), n1 = tileNoise(21, 8), n2 = tileNoise(22, 32), n3 = tileNoise(23, 128), img = ctx.createImageData(w, h);
    const k = w / 1024;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let n = n1(x / 128, y / 128) * 0.9 + n2(x / 32, y / 32) * 0.55 + n3(x / 8, y / 8) * 0.3 + (r() - 0.5) * 0.2;
      if (S.ripples) n += Math.sin((y + n1(x / 128 + 3, y / 128) * 160 + x * (114 / 1024)) / (1024 / 108) * Math.PI) * 0.22 * (0.6 + n2(x / 32 + 7, y / 32));   // gợn cát theo gió
      const i = (y * w + x) * 4;
      img.data[i] = S.base[0] + n * S.amp[0]; img.data[i + 1] = S.base[1] + n * S.amp[1]; img.data[i + 2] = S.base[2] + n * S.amp[2]; img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    // vẽ 9 bản lệch ±w/±h với CÙNG dãy ngẫu nhiên ⇒ nét vắt qua mép khớp nhau (lặp liền mạch)
    const wrap = (seed, fn) => { for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) { ctx.save(); ctx.translate(ox, oy); fn(mulberry(seed)); ctx.restore(); } };
    const offs = (x, y, m) => { const xs = [0], ys = [0]; if (x < m) xs.push(w); if (x > w - m) xs.push(-w); if (y < m) ys.push(h); if (y > h - m) ys.push(-h); const o = []; for (const a of xs) for (const b of ys) o.push([a, b]); return o; };
    if (S.cracks) {   // mạng nứt đa giác: lưới điểm lệch có chu kỳ, nối láng giềng bằng đường gãy khúc
      const N = 12, pts = []; for (let j = 0; j < N; j++) for (let i2 = 0; i2 < N; i2++) pts.push([(i2 + 0.2 + r() * 0.6) * w / N, (j + 0.2 + r() * 0.6) * h / N]);
      const P2 = (i2, j) => { const p = pts[((j % N + N) % N) * N + ((i2 % N + N) % N)]; return [p[0] + Math.floor(i2 / N) * w, p[1] + Math.floor(j / N) * h]; };
      const segs = []; for (let j = 0; j < N; j++) for (let i2 = 0; i2 < N; i2++) { segs.push([P2(i2, j), P2(i2 + 1, j)], [P2(i2, j), P2(i2, j + 1)]); if (r() < 0.5) segs.push([P2(i2, j), P2(i2 + 1, j + 1)]); }
      wrap(91, r => {
        for (const [p, q] of segs) {
          ctx.strokeStyle = "rgba(92,58,34,.85)"; ctx.lineWidth = 2 + r() * 2.5; ctx.beginPath(); ctx.moveTo(p[0], p[1]);
          for (let t = 1; t <= 5; t++) ctx.lineTo(p[0] + (q[0] - p[0]) * t / 5 + (t < 5 ? (r() - 0.5) * 10 : 0), p[1] + (q[1] - p[1]) * t / 5 + (t < 5 ? (r() - 0.5) * 10 : 0));
          ctx.stroke();
          ctx.strokeStyle = "rgba(250,226,196,.35)"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(p[0] + 2, p[1] + 2); ctx.lineTo(q[0] + 2, q[1] + 2); ctx.stroke();   // mép vảy đất cong lên bắt nắng
        }
        for (let i2 = 0; i2 < 900; i2++) { ctx.strokeStyle = "rgba(110,70,44,.4)"; ctx.lineWidth = 0.8; const x = r() * w, y = r() * h; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (r() - 0.5) * 16, y + (r() - 0.5) * 16); ctx.stroke(); }
      });
    }
    const gr = S.gravel || 0, st = S.strokes || 0, sp = S.specks || 0;
    for (let i2 = 0; i2 < sp; i2++) { const s = (1 + r() * 4) * k, v = 110 + r() * 110, x = r() * w, y = r() * h, e1 = s * (0.6 + r() * 0.4), ro = r() * 3; ctx.fillStyle = `rgba(${v + 40 | 0},${v | 0},${v * 0.7 | 0},${0.5 + r() * 0.5})`;
      for (const [ox, oy] of offs(x, y, 8)) { ctx.beginPath(); ctx.ellipse(x + ox, y + oy, s, e1, ro, 0, 7); ctx.fill(); } }
    for (let i2 = 0; i2 < gr; i2++) {   // sỏi: viên tròn cạnh, có bóng đổ + điểm sáng
      const x = r() * w, y = r() * h, s = (1.5 + Math.pow(r(), 2) * 7) * k, v = 90 + r() * 120, hue = r(), e1 = s * (0.6 + r() * 0.3), ro = r() * 3;
      const col = hue < 0.5 ? `rgb(${v + 30 | 0},${v * 0.8 | 0},${v * 0.6 | 0})` : hue < 0.8 ? `rgb(${v | 0},${v * 0.95 | 0},${v * 0.9 | 0})` : `rgb(${v * 0.7 | 0},${v * 0.6 | 0},${v * 0.55 | 0})`;
      for (const [ox, oy] of offs(x, y, 12)) {
        const X = x + ox, Y = y + oy;
        ctx.fillStyle = "rgba(40,24,14,.35)"; ctx.beginPath(); ctx.ellipse(X + s * 0.35, Y + s * 0.4, s, s * 0.7, 0, 0, 7); ctx.fill();
        ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(X, Y, s, e1, ro, 0, 7); ctx.fill();
        ctx.fillStyle = "rgba(255,240,220,.35)"; ctx.beginPath(); ctx.ellipse(X - s * 0.3, Y - s * 0.3, s * 0.35, s * 0.22, 0, 0, 7); ctx.fill();
      }
    }
    ctx.lineCap = "round";
    for (let i2 = 0; i2 < st; i2++) {   // sợi cỏ thấp nằm/đứng trên đất
      const x = r() * w, y = r() * h, c = S.sCol[Math.floor(r() * S.sCol.length)], L = (3 + r() * 9) * k, a = -Math.PI / 2 + (r() - 0.5) * 1.8;
      ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${0.55 + r() * 0.4})`; ctx.lineWidth = (0.8 + r() * 1.2) * k;
      for (const [ox, oy] of offs(x, y, 14)) { ctx.beginPath(); ctx.moveTo(x + ox, y + oy); ctx.lineTo(x + ox + Math.cos(a) * L, y + oy + Math.sin(a) * L); ctx.stroke(); }
    }
    wrap(92, r => {
      ctx.strokeStyle = "rgba(90,50,30,.14)"; ctx.lineWidth = 1.2;
      for (let i2 = 0; i2 < 8; i2++) { let x = r() * w, y = r() * h; ctx.beginPath(); ctx.moveTo(x, y); for (let q = 0; q < 6; q++) { x += (r() - 0.5) * 40; y += (r() - 0.5) * 40; ctx.lineTo(x, y); } ctx.stroke(); }
    });
  });
}
function gravelTexture() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = "#6f6258"; ctx.fillRect(0, 0, w, h);
    const r = mulberry(8);
    for (let i = 0; i < 9000; i++) { const v = 70 + r() * 110, s = 1.5 + r() * 5; ctx.fillStyle = `rgb(${v + 12 | 0},${v | 0},${v * 0.88 | 0})`; ctx.beginPath(); ctx.ellipse(r() * w, r() * h, s, s * (0.5 + r() * 0.5), r() * 3, 0, 7); ctx.fill(); }
  });
}
function sleeperTexture() {
  return canvasTexture(256, 64, (ctx, w, h) => {
    ctx.fillStyle = "#5a4636"; ctx.fillRect(0, 0, w, h);
    const r = mulberry(3);
    for (let i = 0; i < 120; i++) { ctx.fillStyle = r() < 0.5 ? "rgba(30,20,12,.35)" : "rgba(160,140,120,.18)"; ctx.fillRect(0, r() * h, w, 1 + r() * 2); }
    for (let i = 0; i < 6; i++) { ctx.fillStyle = "rgba(20,14,8,.5)"; ctx.fillRect(r() * w, r() * h, 10 + r() * 30, 2); }
  });
}
function strataTexture() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    const r = mulberry(12);
    for (let y = 0; y < h; y += 4) { const v = r(); ctx.fillStyle = v < 0.3 ? "#b86a3e" : v < 0.6 ? "#c98555" : v < 0.85 ? "#d69c6c" : "#a95c35"; ctx.fillRect(0, y, w, 4); }
    ctx.fillStyle = "rgba(240,210,170,.35)"; ctx.fillRect(0, 0, w, 30);
  });
}
function padTexture() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2); g.addColorStop(0, "#7ea24c"); g.addColorStop(1, "#5a7a36");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    const r = mulberry(5);
    for (let i = 0; i < 60; i++) { const x = r() * w, y = r() * h; ctx.fillStyle = "#d8cf9a"; ctx.beginPath(); ctx.arc(x, y, 2.2, 0, 7); ctx.fill(); ctx.strokeStyle = "rgba(240,235,200,.8)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 5, y - 6); ctx.stroke(); }
  });
}

// --------------------------------------------------------------------- shader bầu trời
const SKY_FRAG = `
uniform vec3 sunDir; uniform float time; varying vec3 vDir;
float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.-2.*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y); }
float fbm(vec2 p){ float s = 0., a = .5; for(int i=0;i<6;i++){ s += a*noise(p); p = p*2.03 + vec2(1.7, 9.2); a *= .5; } return s; }
void main(){
  vec3 d = normalize(vDir);
  float h = d.y;
  float sd = max(dot(d, sunDir), 0.);
  vec3 hor = vec3(1.00, 0.60, 0.36), rose = vec3(0.93, 0.62, 0.58), mid = vec3(0.34, 0.56, 0.86), zen = vec3(0.07, 0.19, 0.46);
  vec3 col = mix(hor, rose, smoothstep(0.0, 0.05, h));
  col = mix(col, mid, smoothstep(0.03, 0.17, h));
  col = mix(col, zen, smoothstep(0.15, 0.7, h));
  col = mix(col, vec3(0.80, 0.52, 0.36), smoothstep(0.0, -0.08, h));
  float hz = 1. - smoothstep(0.0, 0.25, abs(h));
  col += vec3(1.0, 0.55, 0.22) * pow(sd, 10.) * 0.35 * hz;
  col += vec3(1.0, 0.70, 0.38) * pow(sd, 60.) * 0.7;
  col += vec3(1.0, 0.85, 0.60) * pow(sd, 700.) * 1.2;
  col += vec3(1.0, 0.95, 0.85) * smoothstep(0.99955, 0.9998, sd) * 9.;
  if (h > -0.01) {
    float hh = max(h, 0.0);
    vec2 uv = d.xz / (hh + 0.10);
    vec2 w = vec2(time * 0.008, time * 0.003);
    float cu = fbm(uv * 0.42 + w);
    float cov = smoothstep(0.50, 0.66, cu) * smoothstep(0.01, 0.08, hh) * (1. - smoothstep(0.45, 0.9, hh));
    float dens = smoothstep(0.52, 0.85, cu);
    float top = fbm(uv * 0.42 + w + vec2(0.0, -0.06));
    float lightSide = clamp((cu - top) * 6. + 0.5, 0., 1.);
    vec3 belly = vec3(0.46, 0.38, 0.50), lit = vec3(1.0, 0.86, 0.70);
    vec3 shade = mix(belly, lit, 0.35 + 0.65 * lightSide * (1. - dens * 0.5));
    shade = mix(shade, vec3(1.0, 0.72, 0.42), pow(sd, 6.) * 0.75);
    float rim = smoothstep(0.50, 0.56, cu) * (1. - smoothstep(0.56, 0.66, cu));
    shade += vec3(1.0, 0.68, 0.32) * rim * (0.35 + 1.6 * pow(sd, 5.));
    col = mix(col, shade, cov * 0.95);
    float ci = fbm(vec2(uv.x * 0.18, uv.y * 1.3) + w * 1.6 + 11.);
    float cir = smoothstep(0.60, 0.80, ci) * smoothstep(0.06, 0.3, hh) * (1. - cov);
    col = mix(col, vec3(1.0, 0.80, 0.70) + vec3(0.25, 0.1, 0.) * pow(sd, 4.), cir * 0.4);
  }
  gl_FragColor = vec4(col, 1.);
}`;

// --------------------------------------------------------------------- tiện ích
function smooth(a, b, x) { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
export function mulberry(s) { return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export function makeNoise(seed) {
  const r = mulberry(seed), perm = new Uint8Array(512), p = [...Array(256).keys()];
  for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const g = [[1, 1], [-1, 1], [1, -1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]];
  const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
  const dot = (h, x, y) => { const v = g[h & 7]; return v[0] * x + v[1] * y; };
  return (x, y) => {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, xf = x - Math.floor(x), yf = y - Math.floor(y), u = fade(xf), v = fade(yf);
    const aa = perm[perm[X] + Y], ab = perm[perm[X] + Y + 1], ba = perm[perm[X + 1] + Y], bb = perm[perm[X + 1] + Y + 1];
    const x1 = dot(aa, xf, yf) + u * (dot(ba, xf - 1, yf) - dot(aa, xf, yf));
    const x2 = dot(ab, xf, yf - 1) + u * (dot(bb, xf - 1, yf - 1) - dot(ab, xf, yf - 1));
    return x1 + v * (x2 - x1);
  };
}
export function normalFromNoise(size, seed, strength, scale = 10) {
  const Nn = makeNoise(seed), r = mulberry(seed + 1), H = new Float32Array(size * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) H[y * size + x] = Nn(x / scale, y / scale) * 0.6 + Nn(x / 3, y / 3) * 0.3 + (r() - 0.5) * 0.35;
  const c = document.createElement("canvas"); c.width = c.height = size;
  const ctx = c.getContext("2d"), img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const hL = H[y * size + ((x - 1 + size) % size)], hR = H[y * size + ((x + 1) % size)], hD = H[((y - 1 + size) % size) * size + x], hU = H[((y + 1) % size) * size + x];
    const v = new THREE.Vector3((hL - hR) * strength, (hD - hU) * strength, 1).normalize();
    const i = (y * size + x) * 4; img.data[i] = (v.x * 0.5 + 0.5) * 255; img.data[i + 1] = (v.y * 0.5 + 0.5) * 255; img.data[i + 2] = (v.z * 0.5 + 0.5) * 255; img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
