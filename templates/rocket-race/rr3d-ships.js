// ⭐ MẪU 12 (19/10/2026, thầy): TÀU + TÊN LỬA 3D CÓ SẴN thay 2 tàu dựng tay — chọn ở ⚙ Settings (như Racing Words).
//   · thầy chọn ở rocket-race/chon-tau-3d.html: S10 · S9 · S7 · S5 · R8 · R1 · R2 (+ "Classic" = tàu dựng tay cũ)
//   · 2 đội CÙNG một mẫu tàu, chỉ khác MÀU SƠN (xanh / cam) — sơn lại chỗ có màu của mẫu, giữ trắng/xám/đen
//   · file glb đã nén (texture webp ≤ 1024, ảnh phụ ≤ 512, meshopt, gộp lưới theo vật liệu) ở rocket-race/tau3d/
//   · mọi mẫu CHUẨN HOÁ về đúng khung tàu cũ: mũi +X, nóc +Y, đuôi x = −2,5, mũi x = 2,25 (dài 4,75 như SHIP_LEN của tên lửa)
//     ⇒ đường đua, camera, khoảng cách tên lửa giữ nguyên; lửa đuôi = ĐÚNG shader 2 nón của tàu cũ đặt ở từng vòi (engines)
//   · giấy phép CC Attribution: tác giả ghi ở bảng Settings (ô Ship) — đừng xoá trường by / src.
import * as THREE from "./vendor/three/three.module.min.js";
import { GLTFLoader } from "./vendor/three/addons/GLTFLoader.js";
import { MeshoptDecoder } from "./vendor/three/addons/meshopt_decoder.module.js";
import { mergeGeometries } from "./vendor/three/addons/BufferGeometryUtils.js";

const V3 = THREE.Vector3;
const BASE = new URL("./tau3d/", import.meta.url).href;
const VER = "?v=12a";                                    // đổi khi thay file cùng tên (Chrome giữ bản cũ 10 phút)
export const TAIL_X = -2.5, NOSE_X = 2.25, SHIP_L = NOSE_X - TAIL_X;

// rot = góc Euler (XYZ, rad) xoay mẫu GỐC cho mũi về +X, nóc về +Y.
// engines = [x, y, z, r] trong khung tàu ĐÃ chuẩn hoá (r = bán kính miệng vòi) · lift = vòi nâng dưới bụng (chỉ phi thuyền, intro cất cánh)
// paint: "accent" = chỉ đổi chỗ CÓ MÀU sang màu đội · "all" = phủ màu đội lên cả vỏ (giữ sáng tối của texture) · mats = chỉ các vật liệu này
// mount = chỗ treo 2 tên lửa [x, y, z] (z = khoảng cách ra hông khi đã gắn xong) · len = dài thật (mặc định 4,75)
export const SHIPS = [
  { id: "classic", name: "Classic", group: "ROCKETS", kind: "rocket" },
  { id: "R1", name: "Retro Toy", group: "ROCKETS", kind: "rocket", glow: 0.26, file: "R1-retro-toy-rocket", rot: [0, 0, -Math.PI / 2],
    engines: [[-1.5, 0.81, 0.94, 0.24], [-1.5, 0.81, -0.94, 0.24], [-1.5, -0.83, 0, 0.24], [-1.2, 0.12, 0, 0.32]], paint: { mode: "accent" },
    by: "Pixel-bit", lic: "CC BY 4.0", src: "https://sketchfab.com/3d-models/d74cf96877bf4c2e9e0970cf3bd61329" },
  { id: "R2", name: "Toy Rocket", group: "ROCKETS", kind: "rocket", glow: 0.26, file: "R2-toy-rocket", rot: [0, 0, -Math.PI / 2],
    engines: [[-2.45, 0.02, 0, 0.44]], paint: { mode: "accent" },
    by: "Desertsage", lic: "CC BY 4.0", src: "https://sketchfab.com/3d-models/eeca5464cafe42fd9ae35b2451c14858" },
  { id: "R8", name: "Cartoon Rocket", group: "ROCKETS", kind: "rocket", file: "R8-cartoon-rocket", rot: [0, 0, -Math.PI / 2], hide: ["Material.002"],
    engines: [[-2.38, 0, 0, 0.3], [-2.46, 0.75, 0.61, 0.12], [-2.46, 0.75, -0.61, 0.12], [-2.46, -0.75, 0.61, 0.12], [-2.46, -0.75, -0.61, 0.12]], paint: { mode: "accent" },
    by: "Stank", lic: "CC BY 4.0", src: "https://sketchfab.com/3d-models/0a31b2dda6a549b8a224d887da045ef0" },
  { id: "S5", name: "Low Poly Ship", group: "SPACESHIPS", kind: "ship", glow: 0.78, bright: 1.75, file: "S5-spaceship", rot: [0, -Math.PI / 2, 0],
    engines: [[-2.15, -0.2, 0, 0.2], [-2.05, 0.05, 0.42, 0.1], [-2.05, 0.05, -0.42, 0.1]], paint: { mode: "accent" },
    by: "Wender Silva", lic: "CC BY 4.0", src: "https://sketchfab.com/3d-models/8a3674c37d4c4afa9326f9c7ab0f90bf" },
  { id: "S7", name: "Space Fighter", group: "SPACESHIPS", kind: "ship", glow: 0.56, file: "S7-space-fighter", rot: [0, Math.PI / 2, 0],
    engines: [[-0.97, 0.03, 0.95, 0.19], [-0.97, 0.03, -0.95, 0.19], [-1.05, 0.35, 0.33, 0.08], [-1.05, 0.35, -0.33, 0.08]], paint: { mode: "all", k: 0.5, mats: ["15_-_Default"], accent: true },
    by: "Comrade1280", lic: "CC BY 4.0", src: "https://sketchfab.com/3d-models/e766136d4871441289d37d44a4bbcd3b" },
  { id: "S9", name: "Northstar", group: "SPACESHIPS", kind: "ship", glow: 0.28, bright: 1.2, file: "S9-northstar", rot: [0, 0, 0],
    engines: [[-2.45, 0.04, 0, 0.2]], paint: { mode: "all", k: 0.62, mats: ["Northstar_L_chi_bang", "Northstar_L_ji_shen"], accent: true },
    by: "Mark Bai", lic: "CC BY 4.0", src: "https://sketchfab.com/3d-models/a45170bb77fc4c568b7d94050ecbf54c" },
  { id: "S10", name: "Dvergr", group: "SPACESHIPS", kind: "ship", file: "S10-dvergr", rot: [0, Math.PI / 2, 0],
    engines: [[-1.88, 0.27, 0, 0.11], [-1.88, -0.03, 0, 0.11]], paint: { mode: "all", k: 0.6, mats: ["lambert11"], accent: true },
    by: "Star Conflict", lic: "CC BY 4.0", src: "https://sketchfab.com/3d-models/ecc16e103e79448faf9730f172a1d7e8" }
];
// tên lửa: chuẩn hoá về khung tên lửa cũ — dọc +X, đuôi −1,15 → mũi 1,17 (bảng nạp đỏ dần đọc position.x theo đúng dải này)
export const MISSILES = [
  { id: "classic", name: "Classic" },
  { id: "M1", name: "Sci-fi", file: "M1-scifi-missile", rot: [0, Math.PI / 2, 0], r: 0.16,
    by: "robnewman76", lic: "CC BY 4.0", src: "https://sketchfab.com/3d-models/1be9ec86a68d4657920fec178be1626c" },
  { id: "M2", name: "AIM-9", file: "M2-aim9", rot: [0, Math.PI / 2, 0], r: 0.16,
    by: "rickslash", lic: "CC BY 4.0", src: "https://sketchfab.com/3d-models/caaf15b49bac4144b6c6be577c2b872a" },
  { id: "M3", name: "AIM-120", file: "M3-aim120", rot: [0, 0, 0], r: 0.16,
    by: "Mustafa Garip", lic: "CC BY 4.0", src: "https://sketchfab.com/3d-models/81b5a823252f49e7846efb5cd81f1725" },
  { id: "M4", name: "Cartoon", file: "M4-ballistic", rot: [0, 0, 0], r: 0.16,
    by: "leslava", lic: "CC BY 4.0", src: "https://sketchfab.com/3d-models/41d1f34119fc49309d2ab6cb64ef4d30" },
  { id: "M5", name: "Heavy", file: "M5-missile-rocket", rot: [0, Math.PI, 0], r: 0.16,
    by: "Jawad Abedin", lic: "CC BY 4.0", src: "https://sketchfab.com/3d-models/dd7ddc0be97f423489e9afa6fde4d571" }
];
export const shipInfo = id => SHIPS.find(s => s.id === id) || SHIPS[0];
export const missileInfo = id => MISSILES.find(s => s.id === id) || MISSILES[0];

// ---------------------------------------------------------------- lựa chọn (máy này) — ⚙ Settings ghi, game đọc lúc dựng cảnh
export const SET_KEY = "rocketrace.ship.v1";
export function loadSettings() {
  const d = { ship: "classic", missile: "classic" };
  try { const j = JSON.parse(localStorage.getItem(SET_KEY) || "{}"); if (SHIPS.some(s => s.id === j.ship)) d.ship = j.ship; if (MISSILES.some(s => s.id === j.missile)) d.missile = j.missile; } catch (e) { /* trình duyệt chặn lưu */ }
  return d;
}
export function saveSettings(s) { try { localStorage.setItem(SET_KEY, JSON.stringify({ ship: s.ship, missile: s.missile })); } catch (e) { /* */ } }

// ---------------------------------------------------------------- tải + chuẩn hoá (mỗi mẫu tải 1 lần)
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const cache = new Map();
function loadRaw(file) {
  if (!cache.has(file)) cache.set(file, loader.loadAsync(BASE + file + ".glb" + VER));
  return cache.get(file);
}
// nướng mọi lưới về KHUNG CHUẨN (một lưới / vật liệu, không còn transform node) ⇒ bảng nạp, va chạm, mảnh vỡ dùng toạ độ thật
function bake(scene, rot, fit, hide = []) {
  scene.updateMatrixWorld(true);
  const R = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...(rot || [0, 0, 0])));
  const parts = new Map();                                           // vật liệu → [geo]
  scene.traverse(o => {
    if (!o.isMesh || !o.geometry) return;
    if (hide.includes(o.name) || [].concat(o.material).some(m => hide.includes(m && m.name))) return;   // phần thừa của mẫu gốc (hộp nền, bệ…)
    // ⚠️ meshopt + lượng tử hoá: vị trí/pháp tuyến là số nguyên CHUẨN HOÁ (Int16 normalized) — xoay/phóng thẳng trên đó bị kẹp về [−1, 1]
    //   ⇒ chép ra Float32 trước (cả thuộc tính đan xen)
    const g = new THREE.BufferGeometry();
    for (const k of ["position", "normal", "uv", "color"]) { const a = o.geometry.attributes[k]; if (a) g.setAttribute(k, toFloat(a)); }
    if (o.geometry.index) g.setIndex(new THREE.BufferAttribute(Uint32Array.from(o.geometry.index.array), 1));
    o.geometry.groups.forEach(gr => g.addGroup(gr.start, gr.count, gr.materialIndex));
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(R, o.matrixWorld));
    if (!g.attributes.normal) g.computeVertexNormals();
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    if (mats.length > 1 && g.groups.length) {                      // lưới nhiều vật liệu ⇒ tách theo nhóm
      g.groups.forEach(gr => { const sub = g.clone(); sub.setIndex(g.index ? g.index.array.slice(gr.start, gr.start + gr.count) : null); sub.clearGroups(); push(mats[gr.materialIndex] || mats[0], sub); });
    } else push(mats[0], g);
  });
  function push(m, g) { if (!g.index) g = toIndexed(g); if (!parts.has(m)) parts.set(m, []); parts.get(m).push(g); }
  const list = [];
  parts.forEach((gs, m) => {
    const attrs = ["position", "normal", "uv", "color"].filter(a => gs.every(g => g.attributes[a]));
    gs.forEach(g => Object.keys(g.attributes).forEach(a => { if (!attrs.includes(a)) g.deleteAttribute(a); }));
    const geo = gs.length > 1 ? mergeGeometries(gs, false) : gs[0];
    if (geo) list.push({ geo, mat: m });
  });
  const box = new THREE.Box3(); list.forEach(p => { p.geo.computeBoundingBox(); box.union(p.geo.boundingBox); });
  // dài = fit.len, NHƯNG bề ngang/cao không quá 2 × fit.half (2 làn đua cách nhau 4,6 — tàu cũ rộng ~2,3) ⇒ mẫu bè thì nhỏ lại,
  //   khi đó tâm dọc thân giữ đúng tâm tàu cũ (fit.cx) thay vì dính đuôi vào −2,5
  const sz = box.getSize(new V3()), c = box.getCenter(new V3());
  const kl = fit.len / sz.x, k = Math.min(kl, fit.half ? 2 * fit.half / Math.max(sz.y, sz.z) : kl);
  const x0 = k < kl ? fit.cx - sz.x * k / 2 : fit.x0;
  const T = new THREE.Matrix4().makeScale(k, k, k).multiply(new THREE.Matrix4().makeTranslation(-box.min.x + x0 / k, -c.y, -c.z));
  list.forEach(p => { p.geo.applyMatrix4(T); p.geo.computeBoundingBox(); p.geo.computeBoundingSphere(); });
  const nb = new THREE.Box3(); list.forEach(p => nb.union(p.geo.boundingBox));
  return { list, box: nb };
}
function toFloat(a) {
  const n = a.count, s = a.itemSize, out = new Float32Array(n * s);
  for (let i = 0; i < n; i++) for (let k = 0; k < s; k++) out[i * s + k] = a.getComponent(i, k);   // getComponent tự khử chuẩn hoá + đan xen
  return new THREE.BufferAttribute(out, s);
}
function toIndexed(g) { const n = g.attributes.position.count, idx = new Uint32Array(n); for (let i = 0; i < n; i++) idx[i] = i; g.setIndex(new THREE.BufferAttribute(idx, 1)); return g; }

// mặt cắt ngang theo x (24 khúc): tâm + bán trục y/z — tên lửa chạm vỏ khi lọt vào ellipse của khúc đó
function profileOf(list, box) {
  const N = 24, x0 = box.min.x, x1 = box.max.x, B = [...Array(N)].map(() => ({ y0: Infinity, y1: -Infinity, z0: Infinity, z1: -Infinity, n: 0 }));
  list.forEach(p => { const a = p.geo.attributes.position; for (let i = 0; i < a.count; i++) {
    const x = a.getX(i), j = Math.min(N - 1, Math.max(0, Math.floor((x - x0) / (x1 - x0) * N))), b = B[j], y = a.getY(i), z = a.getZ(i);
    b.y0 = Math.min(b.y0, y); b.y1 = Math.max(b.y1, y); b.z0 = Math.min(b.z0, z); b.z1 = Math.max(b.z1, z); b.n++; } });
  const P = B.map(b => b.n ? { cy: (b.y0 + b.y1) / 2, ry: Math.max(0.05, (b.y1 - b.y0) / 2), rz: Math.max(0.05, (b.z1 - b.z0) / 2) } : null);
  for (let j = 0; j < N; j++) if (!P[j]) P[j] = P[j - 1] || P.find(q => q) || { cy: 0, ry: 0.3, rz: 0.3 };
  return { x0, x1, N, P, at(x) { const t = (x - x0) / (x1 - x0) * N - 0.5, j = Math.max(0, Math.min(N - 1, Math.floor(t))), j2 = Math.min(N - 1, j + 1), f = Math.max(0, Math.min(1, t - j));
    const a = P[j], b = P[j2]; return { cy: a.cy + (b.cy - a.cy) * f, ry: a.ry + (b.ry - a.ry) * f, rz: a.rz + (b.rz - a.rz) * f }; } };
}

const tplCache = new Map();
export async function prepShip(id) {
  const info = shipInfo(id); if (!info.file) return null;
  if (!tplCache.has(id)) tplCache.set(id, loadRaw(info.file).then(gl => {
    const { list, box } = bake(gl.scene, info.rot, { len: info.len || SHIP_L, x0: TAIL_X, half: info.half || (info.kind === "ship" ? 1.7 : 1.3), cx: (TAIL_X + NOSE_X) / 2 }, info.hide);
    list.forEach(p => { p.mat = upgrade(p.mat, info.bright ?? (info.kind === "ship" ? 1.45 : 1.15)); });
    const prof = profileOf(list, box);
    const hit = new THREE.Mesh(mergeGeometries(list.map(p => { const g = new THREE.BufferGeometry(); g.setAttribute("position", p.geo.attributes.position); g.setAttribute("normal", p.geo.attributes.normal); g.setIndex(p.geo.index); return g; }), false));
    return { info, list, box, prof, hit, chunks: null };
  }));
  return tplCache.get(id);
}
export async function prepMissile(id) {
  const info = missileInfo(id); if (!info.file) return null;
  const key = "m:" + id;
  if (!tplCache.has(key)) tplCache.set(key, loadRaw(info.file).then(gl => {
    const { list, box } = bake(gl.scene, info.rot, { len: 2.32, x0: -1.15 });
    // tên lửa thật mảnh (bán kính thân ~0,06 khi dài 2,32) ⇒ khó thấy trên bảng / lúc bay: làm MẬP thân (y, z) cho bán kính thân ≈ info.r
    //   (bán kính thân = phân vị 40 % khoảng cách đỉnh tới trục — cánh đuôi không kéo số đo lên)
    const rs = []; list.forEach(p => { const a = p.geo.attributes.position; for (let i = 0; i < a.count; i += 3) rs.push(Math.hypot(a.getY(i), a.getZ(i))); });
    rs.sort((a, b) => a - b);
    const fat = Math.min(2.4, Math.max(1, (info.r ?? 0.15) / Math.max(0.02, rs[Math.floor(rs.length * 0.4)] || 0.15)));
    list.forEach(p => { p.geo.scale(1, fat, fat); p.geo.computeBoundingBox(); p.geo.computeBoundingSphere(); });
    box.min.y *= fat; box.max.y *= fat; box.min.z *= fat; box.max.z *= fat;
    list.forEach(p => { p.mat = addGlow(upgrade(p.mat, 1.1), info.glow ?? GLOW.missile); p.base = p.mat.color.clone(); });
    return { info, list, box, fat };
  }));
  return tplCache.get(key);
}
function upgrade(m, bright = 1) {                       // vật liệu glb vào cảnh: giữ texture, bỏ thứ đắt (2 mặt khi không cần, trong suốt giả)
  if (m.transparent && m.opacity > 0.97) { m.transparent = false; m.depthWrite = true; }
  if (m.map) m.map.anisotropy = 4;
  // ⭐ thầy 19/10: "các tàu mới bị tối quá" — cảnh vũ trụ gần như không có gì để KIM LOẠI phản chiếu ⇒ vỏ metal 1 ra đen. Hạ kim loại ≤ 0,45,
  //   bóng ≥ 0,32, phản chiếu môi trường ×2,6 và nâng màu nền (bright) — vẫn giữ texture / sáng tối của mẫu
  if (m.isMeshStandardMaterial) {
    m.metalness = Math.min(m.metalness ?? 0, 0.45); m.roughness = Math.max(m.roughness ?? 0.5, 0.32);
    m.envMapIntensity = 2.6;
    if (m.color && !(m.transparent && m.opacity < 0.6)) m.color.multiplyScalar(bright);
  }
  return m;
}

// ---------------------------------------------------------------- TỰ SÁNG (thầy 19/10 lần 2: "màu và độ sáng của tàu vẫn còn rất tối, muốn sáng rõ ràng")
// Đèn cảnh vũ trụ tối + mặt khuất nắng ⇒ dù nâng màu / phản chiếu vẫn tối. Cộng thêm phát sáng = CHÍNH màu bề mặt (texture đã sơn đội × màu) × GLOW
//   ngay sau emissivemap_fragment ⇒ mặt khuất vẫn thấy rõ màu + chi tiết, mặt có nắng vẫn có bóng đổ / bóng sáng như cũ. Vật liệu có sẵn emissiveMap (đèn
//   của mẫu) vẫn giữ. Hư hại (setDamageLook đổi màu) làm tối luôn phần tự sáng vì nó lấy từ diffuseColor.
export const GLOW = { ship: 0.45, rocket: 0.34, missile: 0.27 };   // 12e (thầy): R1 R2 −, S9 −−, S5 ++, S7 + ⇒ trường glow / bright riêng trong SHIPS · 12d: thầy "hơi sáng chói" ⇒ giảm ~18 % (12c: 0,55 · 0,42 · 0,32)
export function addGlow(m, k) {
  if (!m || !m.isMeshStandardMaterial || k <= 0) return m;
  const prev = m.onBeforeCompile;
  m.userData.glow = { value: k };
  m.onBeforeCompile = (sh, r) => {
    if (prev) prev(sh, r);
    sh.uniforms.uGlow = m.userData.glow;
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nuniform float uGlow;")
      .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * uGlow;");
  };
  const key = m.customProgramCacheKey ? m.customProgramCacheKey.bind(m) : null;
  m.customProgramCacheKey = () => (key ? key() : "") + "|rrGlow";
  return m;
}

// ---------------------------------------------------------------- SƠN MÀU ĐỘI
const _hsl = {}, _c = new THREE.Color();
const smoothstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function rgb2hsl(r, g, b) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0;
  if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; }
  return [h, s, l];
}
function hsl2rgb(h, s, l, out) { _c.setHSL(h, s, l, THREE.LinearSRGBColorSpace); out[0] = _c.r; out[1] = _c.g; out[2] = _c.b; return out; }
// một pixel/màu sRGB 0..1 → pha sang màu đội (mode accent: chỉ chỗ có màu · all: mọi chỗ, giữ độ sáng)
function shade(r, g, b, team, mode, out, k = 1) {
  const [h, s, l] = rgb2hsl(r, g, b);
  const w = k * (mode === "all" ? 1 : smoothstep(0.16, 0.38, s) * smoothstep(0.04, 0.12, l) * (1 - smoothstep(0.9, 0.98, l)));
  if (w <= 0.001) { out[0] = r; out[1] = g; out[2] = b; return out; }
  // accent: chỗ màu TỐI (xanh đậm, nâu…) sáng lên một chút ⇒ cam / xanh đội vẫn ra màu, không thành nâu đen
  const L = mode === "all" ? Math.min(0.78, 0.22 + l * 0.75) : (l < 0.42 ? l + (0.42 - l) * 0.45 : l);
  const S = mode === "all" ? team.s : Math.max(s, team.s * 0.85);
  hsl2rgb(team.h, S, L, out);
  out[0] = r + (out[0] - r) * w; out[1] = g + (out[1] - g) * w; out[2] = b + (out[2] - b) * w; return out;
}
const texCache = new Map();
function paintTex(t, team, mode, k) {
  const key = t.uuid + "|" + team.hex + "|" + mode + "|" + k;
  if (texCache.has(key)) return texCache.get(key);
  const img = t.image, w = img.width, h = img.height, cv = document.createElement("canvas"); cv.width = w; cv.height = h;
  const g = cv.getContext("2d", { willReadFrequently: true }); g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, w, h), a = d.data, o = [0, 0, 0];
  for (let i = 0; i < a.length; i += 4) { shade(a[i] / 255, a[i + 1] / 255, a[i + 2] / 255, team, mode, o, k); a[i] = o[0] * 255; a[i + 1] = o[1] * 255; a[i + 2] = o[2] * 255; }
  g.putImageData(d, 0, 0);
  const n = new THREE.CanvasTexture(cv);
  for (const k of ["colorSpace", "wrapS", "wrapT", "flipY", "channel", "anisotropy", "magFilter", "minFilter"]) n[k] = t[k];
  n.offset.copy(t.offset); n.repeat.copy(t.repeat); n.rotation = t.rotation; n.center.copy(t.center);
  texCache.set(key, n); return n;
}
function teamHSL(color) { const c = new THREE.Color(color); const hs = {}; c.getHSL(hs, THREE.SRGBColorSpace); return { h: hs.h, s: hs.s, l: hs.l, hex: c.getHexString() }; }
// rule: { mode: "accent" | "all", k: độ phủ 0..1, mats: [tên] (chỉ các vật liệu này theo mode; vật liệu khác vẫn "accent" nếu accent: true) }
function paintMat(m, team, rule) {
  const inList = !rule.mats || rule.mats.includes(m.name);
  const mode = inList ? (rule.mode || "accent") : (rule.accent ? "accent" : null), k = inList ? (rule.k ?? 1) : 1;
  if (!mode || !m.color) return m;
  const n = m.clone();
  if (m.map && m.map.image) n.map = paintTex(m.map, team, mode, k);
  const s = m.color.clone().convertLinearToSRGB(), o = [0, 0, 0];
  if (!m.map) {                                          // màu đã nâng sáng (bright) có thể > 1 ⇒ đổi màu trên phần chuẩn hoá rồi nhân lại
    const mx = Math.max(1, s.r, s.g, s.b);
    shade(s.r / mx, s.g / mx, s.b / mx, team, mode, o, k); n.color.setRGB(o[0], o[1], o[2], THREE.SRGBColorSpace); n.color.multiplyScalar(Math.pow(mx, 2.2));
  }
  return n;
}

// ---------------------------------------------------------------- dựng 1 tàu (CÙNG giao diện makeRocket cũ)
const _flameCone = (r, h, seg) => { const g = new THREE.ConeGeometry(r, h, 32, seg, true); g.rotateX(Math.PI); g.translate(0, -h / 2, 0); return g; };
const GEO = { outer: _flameCone(0.42, 2.6, 8), inner: _flameCone(0.22, 1.5, 6), glow: new THREE.CircleGeometry(0.34, 32) };
// nhóm lửa NHIỀU vòi mà code cũ vẫn gọi như 1 nhóm: .visible + .scale.set(x, y, z) (y = độ dài lửa)
class FlameSet {
  constructor(groups, k) {
    this.g = groups; this.k = k; this._v = true; const self = this;
    this.scale = new (class extends THREE.Vector3 { set(x, y, z) { super.set(x, y, z); self.apply(); return this; } setScalar(s) { return this.set(s, s, s); } })(1, 1, 1);
  }
  get visible() { return this._v; }
  set visible(v) { this._v = v; this.g.forEach(g => { g.visible = v; }); }
  apply() { const s = this.scale; this.g.forEach((g, i) => { const k = this.k[i]; g.scale.set(s.x * k.r, s.y * k.l, s.z * k.r); }); }
}
// khung MÔ HÌNH của tàu cũ = khung tàu xoay −90° quanh Z: điểm tàu (x, y, z) ⇒ mô hình (−y, x, z)
const toModel = (x, y, z) => new V3(-y, x, z);

export function makeShipRocket(T, team, idx, opts) {
  const { flameMat, hull } = opts;
  const info = T.info;
  const rig = new THREE.Group(), ship = new THREE.Group(), model = new THREE.Group();
  rig.add(ship); model.rotation.z = -Math.PI / 2; ship.add(model);
  const body = new THREE.Group(); body.rotation.z = Math.PI / 2; model.add(body);   // thân glb nằm thẳng trong KHUNG TÀU
  const tm = teamHSL(team.css || "#" + team.color.getHexString());
  const mats = [];
  T.list.forEach(p => {
    const m = paintMat(p.mat, tm, info.paint || {});
    if (!m.userData.glow) addGlow(m, info.glow ?? GLOW[info.kind] ?? 0.35);
    const mesh = new THREE.Mesh(p.geo, m); mesh.castShadow = true; body.add(mesh);
    if (m.color && !(m.transparent && m.opacity < 0.5) && !mats.includes(m)) mats.push(m);
  });
  // lửa: shader 2 nón Y HỆT tàu cũ, mỗi vòi một cặp (vật liệu CHUNG ⇒ code cũ đổi uniform 1 lần là đổi hết)
  const flameOuter = new THREE.Mesh(GEO.outer, flameMat([4, 3.2, 2], [3.2, 0.9, 0.2], 1.4));
  const flameInner = new THREE.Mesh(GEO.inner, flameMat([6, 6, 6], [3, 2.6, 1.8], 1.0));
  const glowMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 1.6, 0.6), side: THREE.DoubleSide });
  const groups = [], ks = [], glows = new THREE.Group(); glows.material = glowMat;
  const eng = info.engines || [[TAIL_X + 0.05, 0, 0, 0.36]];
  eng.forEach(([x, y, z, r]) => {
    const g = new THREE.Group(); g.position.copy(toModel(x, y, z));
    g.add(groups.length ? new THREE.Mesh(GEO.outer, flameOuter.material) : flameOuter, groups.length ? new THREE.Mesh(GEO.inner, flameInner.material) : flameInner);
    model.add(g); groups.push(g);
    const s = r / 0.42; ks.push({ r: s, l: Math.max(0.55, Math.sqrt(s)) });
    const gl = new THREE.Mesh(GEO.glow, glowMat); gl.scale.setScalar(r / 0.36); gl.rotation.x = Math.PI / 2; gl.position.copy(toModel(x + 0.06, y, z)); glows.add(gl);
  });
  model.add(glows);
  const flameGroup = new FlameSet(groups, ks);
  // vòi nâng (phi thuyền cất cánh thẳng đứng ở intro) — lửa chĩa XUỐNG
  const liftG = [], liftK = [];
  // phi thuyền không khai lift ⇒ tự đặt 3 vòi nâng dưới BỤNG (đo theo mặt cắt thân ở x đó)
  const belly = x => { const e = T.prof.at(x); return e.cy - e.ry + 0.04; };
  const lift = info.lift || (info.kind === "ship" ? [[-0.7, belly(-0.7), 0.3, 0.17], [-0.7, belly(-0.7), -0.3, 0.17], [0.7, belly(0.7), 0, 0.15]] : []);
  lift.forEach(([x, y, z, r]) => {
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.z = 0;   // khung tàu: nón mặc định chĩa −Y = xuống
    g.add(new THREE.Mesh(GEO.outer, flameOuter.material), new THREE.Mesh(GEO.inner, flameInner.material)); ship.add(g); liftG.push(g);
    const s = r / 0.42; liftK.push({ r: s, l: s });
  });
  const liftFlames = new FlameSet(liftG, liftK); liftFlames.visible = false;
  const nozzles = eng.map(([x, y, z]) => new V3(x - 0.05, y, z));
  const tail = eng.reduce((m, e) => Math.min(m, e[0]), 0), cy = eng.reduce((s, e) => s + e[1], 0) / eng.length, cz = eng.reduce((s, e) => s + e[2], 0) / eng.length;
  const light = new THREE.PointLight(0xff8a3d, 12, 9, 2); light.position.set(tail - 0.4, cy, cz); ship.add(light);
  // khiên turbo: ellipsoid ôm hộp bao tàu
  const sz = T.box.getSize(new V3()), cc = T.box.getCenter(new V3());
  const shield = new THREE.Mesh(new THREE.SphereGeometry(1.7, 32, 16), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uCol: { value: new THREE.Color(0.12, 0.5, 1.1) }, uA: { value: 0 } },
    vertexShader: `varying vec3 vN; void main(){ vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `varying vec3 vN; uniform vec3 uCol; uniform float uA; void main(){ float f = pow(1.0 - abs(vN.z), 4.0); gl_FragColor = vec4(uCol*f*uA, f*uA); }`
  }));
  shield.scale.set(sz.x * 0.62 / 1.7, Math.max(1.1, sz.y * 0.8) / 1.7, Math.max(1.1, sz.z * 0.62) / 1.7); shield.position.copy(cc);
  ship.add(shield);
  const teamMat = new THREE.MeshStandardMaterial({ color: team.color, emissive: team.color, emissiveIntensity: 0 });   // code cũ còn chạm teamMat.emissiveIntensity
  const base = mats.map(m => ({ color: m.color.clone(), rough: m.roughness ?? 0.5, metal: m.metalness ?? 0 }));
  // chỗ treo tên lửa: hông, giữa thân; ra ngoài đủ xa vỏ ở chỗ đó
  const pr = T.prof.at(-0.15);
  const mount = info.mount ? { x: info.mount[0], y: info.mount[1], out: info.mount[2] } : { x: -0.15, y: pr.cy, out: pr.rz + 0.25 };
  return {
    team, idx, rig, ship, model, body, hullMat: mats[0] || teamMat, teamMat, mats, base, flameGroup, flameOuter, flameInner, light, shield, nozzleGlow: glows,
    p: 0, vis: 0, thrust: 1, boost: 0, stall: 0, turbo: 0, dmg: 0, wreck: false, exploding: 0, hidden: false,
    homeRun: false, wob: Math.random() * Math.PI * 2, sparkT: 0, smokeT: 0,
    glb: T, kind: info.kind, nozzles, nozzleR: eng.map(e => e[3]), liftFlames, mount
  };
}

// ---------------------------------------------------------------- MẢNH VỠ: cắt CHÍNH thân tàu thành ~26 mảnh theo lưới không gian
export function shipWreckKit(r, THREE_, { soot } = {}) {
  const T = r.glb;
  const kit = new THREE.Group(); kit.visible = false; r.body.add(kit);
  const SOOT = new THREE.Color("#1c1815");
  const pieces = [], hot = [];
  const NX = 6, NY = 2, NZ = 3, b = T.box, sz = b.getSize(new V3());
  const cell = p => { const ix = Math.min(NX - 1, Math.floor((p.x - b.min.x) / sz.x * NX)), iy = Math.min(NY - 1, Math.floor((p.y - b.min.y) / sz.y * NY)), iz = Math.min(NZ - 1, Math.floor((p.z - b.min.z) / sz.z * NZ)); return (ix * NY + iy) * NZ + iz; };
  const wm = new Map();
  r.body.children.forEach(mesh => {
    if (!mesh.isMesh || mesh === kit) return;
    const src = mesh.material;
    if (!wm.has(src)) { const w = src.clone(); if (w.color) w.color.lerp(SOOT, 0.5); w.roughness = 0.85; w.metalness = Math.min(0.5, w.metalness ?? 0); w.emissive = new THREE.Color(1, 0.35, 0.08); w.emissiveIntensity = 0; w.side = THREE.DoubleSide; wm.set(src, w); hot.push(w); }
    const g = mesh.geometry, pos = g.attributes.position, idx = g.index.array, buckets = new Map(), c = new V3();
    for (let t = 0; t < idx.length; t += 3) {
      c.set(0, 0, 0); for (let k = 0; k < 3; k++) c.x += pos.getX(idx[t + k]) / 3, c.y += pos.getY(idx[t + k]) / 3, c.z += pos.getZ(idx[t + k]) / 3;
      const id = cell(c); if (!buckets.has(id)) buckets.set(id, []); buckets.get(id).push(idx[t], idx[t + 1], idx[t + 2]);
    }
    buckets.forEach(list => {
      if (list.length < 9) return;
      const sub = new THREE.BufferGeometry(); for (const a of Object.keys(g.attributes)) sub.setAttribute(a, g.attributes[a]);
      sub.setIndex(list); const geo = sub.toNonIndexed(); geo.computeBoundingBox();
      const ctr = geo.boundingBox.getCenter(new V3()); geo.translate(-ctr.x, -ctr.y, -ctr.z); geo.computeBoundingSphere();
      const m = new THREE.Mesh(geo, wm.get(src)); m.position.copy(ctr); kit.add(m);
      const size = geo.boundingSphere.radius;
      pieces.push({ m, size, burn: Math.random() < 0.3, heavy: size > 0.7, noSmoke: size < 0.12 });
    });
  });
  return { kit, pieces, hot, used: false };
}

// ---------------------------------------------------------------- VẾT CHÁY: dò điểm trên vỏ thật (tia từ trên-hông chiếu vào trục)
const _ray = new THREE.Raycaster();
export function hullSpot(T, rnd) {
  for (let i = 0; i < 12; i++) {
    const x = T.box.min.x + (0.2 + rnd() * 0.65) * (T.box.max.x - T.box.min.x);
    const a = (rnd() < 0.5 ? -1 : 1) * (0.25 + rnd() * 0.9), dir = new V3(0, -Math.cos(a), -Math.sin(a));
    const o = new V3(x, 0, 0).addScaledVector(dir, -6);
    _ray.set(o, dir); const h = _ray.intersectObject(T.hit, false)[0];
    if (h && h.face) return { p: h.point.clone(), n: h.face.normal.clone() };
  }
  return null;
}

// ---------------------------------------------------------------- tên lửa glb: lưới đã nướng dọc +X
export function missileMeshes(MT, matFor) {
  const g = new THREE.Group();
  MT.list.forEach((p, i) => g.add(new THREE.Mesh(p.geo, matFor ? matFor(p.mat, i) : p.mat)));
  return g;
}
