// LỚP BỤI BẨN / TRẦY XƯỚC / GỒ GHỀ cho tàu + máy bay — bản 1i (29/9/2026)
// Thầy: "các chi tiết trên tàu, máy bay đang bị nhựa, bóng bẩy và trông khá giả ⇒ chi tiết hơn, bẩn hơn, bụi bặm hơn,
// gồ ghề hơn, xước hơn". Sinh 3 kết cấu bằng canvas (dùng chung): màu bẩn (bụi đất, vệt chảy, gỉ, ám khói),
// độ nhám (chỗ mòn/xước bóng hơn, chỗ bụi nhám hơn), độ gồ ghề (bump: rỗ, móp, vết xước).
// weather(root) đi qua mọi vật liệu PBR của một nhóm và "làm cũ" chúng một lần (đánh dấu userData.weathered).
import * as THREE from "../../rocket-race/vendor/three/three.module.min.js";

function mulberry(s) { return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function valueNoise(seed, size) {
  const r = mulberry(seed), g = new Float32Array(size * size);
  for (let i = 0; i < g.length; i++) g[i] = r();
  const at = (x, y) => g[((y % size + size) % size) * size + ((x % size + size) % size)];
  return (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    return (at(xi, yi) * (1 - u) + at(xi + 1, yi) * u) * (1 - v) + (at(xi, yi + 1) * (1 - u) + at(xi + 1, yi + 1) * u) * v; };
}
let KIT = null;
export function grimeKit() {
  if (KIT) return KIT;
  const S = 512, n1 = valueNoise(7, 64), n2 = valueNoise(19, 64), r = mulberry(33);
  const fbm = (x, y) => n1(x / 64, y / 64) * 0.5 + n1(x / 24, y / 24) * 0.25 + n2(x / 9, y / 9) * 0.15 + n2(x / 3.5, y / 3.5) * 0.1;
  // ---- màu bẩn (nhân vào màu vật liệu: trắng = sạch)
  const cd = document.createElement("canvas"); cd.width = cd.height = S; const d = cd.getContext("2d");
  const img = d.createImageData(S, S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const f = fbm(x, y), grime = Math.max(0, f - 0.34) * 2.1, dust = Math.max(0, n2(x / 40, y / 40 + 3) - 0.45) * 1.6;
    const k = (i, base) => Math.max(0, Math.min(255, base));
    const o = (y * S + x) * 4;
    // bụi đất ngả nâu vàng, ám khói ngả đen
    const speck = (n2(x / 1.3, y / 1.3) - 0.5) * 26;
    const R = 226 - grime * 120 - dust * 10 + speck, G = 218 - grime * 132 - dust * 30 + speck, B = 206 - grime * 146 - dust * 62 + speck;
    img.data[o] = k(0, R); img.data[o + 1] = k(1, G); img.data[o + 2] = k(2, B); img.data[o + 3] = 255;
  }
  d.putImageData(img, 0, 0);
  // vệt chảy (mưa + dầu) từ trên xuống
  for (let i = 0; i < 160; i++) { const x = r() * S, y = r() * S * 0.7, L = 30 + r() * 200, w = 1 + r() * 4;
    const g = d.createLinearGradient(0, y, 0, y + L); g.addColorStop(0, "rgba(58,40,26,.42)"); g.addColorStop(1, "rgba(60,42,28,0)");
    d.fillStyle = g; d.fillRect(x, y, w, L); }
  // mảng gỉ
  for (let i = 0; i < 48; i++) { const x = r() * S, y = r() * S, rr = 6 + r() * 30;
    const g = d.createRadialGradient(x, y, 0, x, y, rr); g.addColorStop(0, "rgba(118,58,22,.6)"); g.addColorStop(1, "rgba(120,62,26,0)");
    d.fillStyle = g; d.beginPath(); d.arc(x, y, rr, 0, 7); d.fill(); }
  // trầy xước sáng (sơn bong lộ kim loại)
  d.lineCap = "round";
  for (let i = 0; i < 260; i++) { const x = r() * S, y = r() * S, a = (r() - 0.5) * 1.2 + (r() < 0.5 ? 0 : Math.PI / 2), L = 4 + r() * 26;
    d.strokeStyle = `rgba(255,248,236,${0.18 + r() * 0.3})`; d.lineWidth = 0.6 + r() * 0.9;
    d.beginPath(); d.moveTo(x, y); d.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); d.stroke(); }
  const dirt = new THREE.CanvasTexture(cd); dirt.colorSpace = THREE.SRGBColorSpace; dirt.wrapS = dirt.wrapT = THREE.RepeatWrapping; dirt.anisotropy = 8;
  // ---- độ nhám (xám: 0 = bóng, 1 = nhám) — nhân với roughness của vật liệu
  const cr = document.createElement("canvas"); cr.width = cr.height = S; const rc = cr.getContext("2d");
  const im2 = rc.createImageData(S, S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const v = 150 + (fbm(x + 90, y + 30) - 0.5) * 170 + (n2(x / 2.2, y / 2.2) - 0.5) * 40; const o = (y * S + x) * 4; im2.data[o] = im2.data[o + 1] = im2.data[o + 2] = Math.max(60, Math.min(255, v)); im2.data[o + 3] = 255; }
  rc.putImageData(im2, 0, 0);
  for (let i = 0; i < 200; i++) { const x = r() * S, y = r() * S, a = (r() - 0.5) * 1.2, L = 4 + r() * 24; rc.strokeStyle = "rgba(70,70,70,.6)"; rc.lineWidth = 0.8; rc.beginPath(); rc.moveTo(x, y); rc.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); rc.stroke(); }
  const rough = new THREE.CanvasTexture(cr); rough.wrapS = rough.wrapT = THREE.RepeatWrapping;
  // ---- gồ ghề: rỗ đúc, móp, vết xước lõm
  const cb = document.createElement("canvas"); cb.width = cb.height = S; const bc = cb.getContext("2d");
  const im3 = bc.createImageData(S, S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const v = 128 + (n2(x / 1.6, y / 1.6) - 0.5) * 70 + (n1(x / 12, y / 12) - 0.5) * 90; const o = (y * S + x) * 4; im3.data[o] = im3.data[o + 1] = im3.data[o + 2] = Math.max(0, Math.min(255, v)); im3.data[o + 3] = 255; }
  bc.putImageData(im3, 0, 0);
  for (let i = 0; i < 180; i++) { const x = r() * S, y = r() * S, rr = 1 + r() * 3.5; bc.fillStyle = "rgba(20,20,20,.55)"; bc.beginPath(); bc.arc(x, y, rr, 0, 7); bc.fill(); }
  for (let i = 0; i < 240; i++) { const x = r() * S, y = r() * S, a = (r() - 0.5) * 1.2, L = 4 + r() * 26; bc.strokeStyle = "rgba(10,10,10,.5)"; bc.lineWidth = 0.7; bc.beginPath(); bc.moveTo(x, y); bc.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); bc.stroke(); }
  const bump = new THREE.CanvasTexture(cb); bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
  [dirt, rough, bump].forEach(t => { t.userData.shared = true; });
  return (KIT = { dirt, rough, bump });
}

// làm cũ mọi vật liệu PBR trong `root` (một lần mỗi vật liệu)
export function weather(root, { repeat = 1.6, bump = 0.06, dirtOnMapped = false } = {}) {
  const K = grimeKit();
  root.traverse(o => {
    if (!o.isMesh && !o.isInstancedMesh) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of mats) {
      if (!m || !m.isMeshStandardMaterial || m.userData.weathered || m.transmission > 0 || m.transparent) continue;
      m.userData.weathered = true;
      if (!m.map) { m.map = K.dirt; }
      else if (!dirtOnMapped) { /* đã có hình vẽ riêng (gỗ, huy hiệu): chỉ thêm nhám + gồ ghề */ }
      m.roughnessMap = K.rough;
      m.roughness = Math.min(1, Math.max(0.5, m.roughness * 1.35 + 0.18));
      if (m.metalness > 0.5) m.metalness = Math.max(0.45, m.metalness - 0.25);
      if (!m.bumpMap && !m.normalMap) { m.bumpMap = K.bump; m.bumpScale = bump; }
      if (m.isMeshPhysicalMaterial) { m.clearcoat = Math.min(m.clearcoat, 0.08); m.clearcoatRoughness = 0.7; m.sheen = 0; }
      m.envMapIntensity = 0.45;
      if (m.metalness > 0.4 && m.color && m.color.r > m.color.b * 1.5) m.color.multiplyScalar(0.82);   // đồng thau xỉn màu
      m.needsUpdate = true;
    }
  });
  void repeat;
}
