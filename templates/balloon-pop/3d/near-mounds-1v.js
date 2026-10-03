// ĐỐNG ĐÁ GẦN ĐƯỜNG RAY — bản 1v (29/9/2026)
// Thầy chọn kiểu 3 của 1u (đống đá tảng + sỏi) nhưng "giảm size còn một nửa và ít hơn còn một nửa. Thiết kế lại".
// ⇒ mọi kiểu: bề ngang 1/2 (0,45–1,1 thay 0,9–2,2), số đống 1/2 (14 thay 28 mỗi khúc). 4 thiết kế (?da=0..3):
// 0 đống đá cũ thu nhỏ (để so) · 1 đá tròn phong hoá + gò cát (vệt "sơn sa mạc" sẫm chảy từ đỉnh)
// · 2 đá phiến xếp chồng (lớp mỏng, mép sứt, địa y) · 3 tảng đá nứt đôi (mặt nứt tươi màu, mảnh vỡ, sỏi).
import * as THREE from "../../rocket-race/vendor/three/three.module.min.js";
import { mergeGeometries, mergeVertices } from "../../rocket-race/vendor/three/addons/BufferGeometryUtils.js";
import { makeNoise, mulberry, makeRockKit } from "./west-props-1u.js";

export const DA_STYLES = ["Đống đá cũ (thu nhỏ)", "Đá tròn phong hoá + gò cát", "Đá phiến xếp chồng", "Tảng đá nứt đôi"];
export const DA = (() => { try { const v = parseInt(new URLSearchParams(location.search).get("da"), 10); return v >= 0 && v < DA_STYLES.length ? v : 1; } catch { return 1; } })();
export const MO = 3;   // 1u: thầy chốt kiểu 3 (đống đá)
const sst = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const NA = makeNoise(4242), NB = makeNoise(4343);
const n3 = (x, y, z) => NA(x + z * 0.71, y - z * 0.43) * 0.6 + NB(y * 1.3 + 5, z * 1.3 - x * 0.5) * 0.4;
const col = hex => new THREE.Color(hex), TMP = new THREE.Vector3();

// khối đá: cầu chia mịn, gộp đỉnh (pháp tuyến mượt), nắn bằng 3 tầng nhiễu, đáy phẳng đặt đúng mặt đất (y = 0)
function blob(seed, o) {
  let g = new THREE.IcosahedronGeometry(1, o.detail);
  g.deleteAttribute("normal"); g.deleteAttribute("uv"); g = mergeVertices(g);
  const p = g.attributes.position, v = new THREE.Vector3(), ph = seed * 1.37, cut = -o.sy * 0.5, rr = mulberry(seed * 3 + 1), planes = [];
  for (let k = 0; k < (o.facets || 0); k++) { const a = rr() * 6.283, el = (rr() - 0.3) * 1.1, n = new THREE.Vector3(Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el)); planes.push([n.x, n.y, n.z, 0.72 + rr() * 0.2]); }
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const crack = Math.pow(1 - Math.abs(n3(v.x * 3.1 + ph, v.y * 3.1, v.z * 3.1)), 10) * (o.crack || 0);   // khe nứt mảnh
    const d = 1 + n3(v.x * 0.9 + ph, v.y * 0.9, v.z * 0.9) * o.big + n3(v.x * 2.7, v.y * 2.7 + ph, v.z * 2.7) * o.mid + n3(v.x * 8 + ph, v.y * 8, v.z * 8) * o.fine + n3(v.x * 19, v.y * 19 + ph, v.z * 19) * o.fine * 0.4 - crack;
    v.multiplyScalar(d);
    for (const [px, py, pz, pc] of planes) { const t = v.x * px + v.y * py + v.z * pz - pc; if (t > 0) v.addScaledVector(TMP.set(px, py, pz), -t * 0.9); }   // mặt khớp phẳng (vách đá)
    v.x *= o.sx; v.y *= o.sy; v.z *= o.sz;
    if (v.y < cut) v.y = cut + (v.y - cut) * 0.12;
    p.setXYZ(i, v.x, v.y - cut, v.z);
  }
  g.computeVertexNormals();
  return g;
}
// tô màu từng đỉnh theo vị trí + pháp tuyến (sau khi đã đặt vào đống)
function paint(g, fn) {
  const p = g.attributes.position, n = g.attributes.normal, a = new Float32Array(p.count * 3), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    fn(c, p.getX(i), p.getY(i), p.getZ(i), n.getX(i), n.getY(i), n.getZ(i), i);
    const lit = Math.max(0, n.getX(i) * -0.5 + n.getY(i) * 0.6 + n.getZ(i) * 0.62);   // nắng xiên vẽ sẵn (giống đồi chữ)
    c.multiplyScalar(0.62 + 0.55 * lit);
    a.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(a, 3));
  return g;
}
const place = (g, x, y, z, rx, ry, rz, s = 1) => g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(s, s, s)));
// sỏi: hạt nhỏ góc cạnh rải vòng quanh chân
function gravel(r, n, r0, r1, hex, flat = 0.5) {
  const out = [], base = col(hex);
  for (let k = 0; k < n; k++) {
    const g = new THREE.IcosahedronGeometry(1, 0), a = r() * 6.283, d = r0 + Math.pow(r(), 0.7) * (r1 - r0), s = 0.03 + r() * 0.07;
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(Math.cos(a) * d, s * flat * 0.6, Math.sin(a) * d), new THREE.Quaternion().setFromEuler(new THREE.Euler(r() * 3, r() * 3, r() * 3)), new THREE.Vector3(s * 1.3, s * flat, s)));
    g.computeVertexNormals();
    const t = 0.8 + r() * 0.35;
    out.push(paint(g, c => c.copy(base).multiplyScalar(t)));
  }
  return out;
}
const merge = parts => mergeGeometries(parts.map(g => { for (const k of Object.keys(g.attributes)) if (!["position", "normal", "color"].includes(k)) g.deleteAttribute(k); return g.index ? g.toNonIndexed() : g; }));

// ---- 1: đá tròn phong hoá — 1 tảng lớn + 2–3 tảng tựa vào, gò cát bám chân, vệt sơn sa mạc sẫm chảy từ đỉnh xuống
function rounded(seed) {
  const r = mulberry(seed), parts = [];
  const base = col(0xbd7444), warm = col(0xd6955f), varn = col(0x4b2a1b), stain = col(0xdcb28a), pit = col(0x7a4027);
  const tint = (c, x, y, z, nx, ny, nz, H) => {
    c.copy(base).lerp(warm, 0.5 + 0.5 * n3(x * 0.8, y * 0.8, z * 0.8));
    const ang = Math.atan2(z, x), streak = sst(0.25, 0.75, NA(ang * 7 + seed, y * 0.6));
    c.lerp(varn, Math.min(0.85, sst(0.3, 0.95, ny) * 0.45 + streak * sst(0.25 * H, 0.95 * H, y) * 0.55));   // vệt sơn sa mạc
    c.lerp(stain, sst(0.28, 0.02, y) * 0.55);                                                                  // chân đá bám cát
    c.lerp(pit, Math.max(0, n3(x * 9, y * 9, z * 9) - 0.35) * 0.9);                                             // lỗ rỗ
  };
  const n = 2 + Math.floor(r() * 2), big = blob(seed, { detail: 13, big: 0.28, mid: 0.1, fine: 0.035, crack: 0.05, facets: 2, sx: 1.2 + r() * 0.3, sy: 0.95 + r() * 0.2, sz: 1 });
  place(big, 0, 0, 0, 0, r() * 6, 0); parts.push(paint(big, (c, x, y, z, nx, ny, nz) => tint(c, x, y, z, nx, ny, nz, 1.9)));
  for (let k = 0; k < n; k++) {
    const s = 0.38 + r() * 0.3, a = r() * 6.283, g = blob(seed + 11 * (k + 1), { detail: 8, big: 0.26, mid: 0.1, fine: 0.035, crack: 0.04, facets: 1, sx: 1.1 + r() * 0.3, sy: 0.9, sz: 1 });
    place(g, Math.cos(a) * (1.05 + s * 0.6), -0.03, Math.sin(a) * (0.85 + s * 0.5), (r() - 0.5) * 0.3, r() * 6, (r() - 0.5) * 0.3, s);
    parts.push(paint(g, (c, x, y, z, nx, ny, nz) => tint(c, x, y, z, nx, ny, nz, 1.9 * s + 0.2)));
  }
  // gò cát bám chân: đĩa phồng thấp, mép răng cưa theo nhiễu, gợn gió
  const sand = new THREE.PlaneGeometry(5.2, 5.2, 60, 60); sand.rotateX(-Math.PI / 2);
  const sp = sand.attributes.position, sa = col(0xb9683f), sb = col(0xcf8656);
  for (let i = 0; i < sp.count; i++) {
    const x = sp.getX(i), z = sp.getZ(i), ang = Math.atan2(z, x), R = 1.9 * (1 + NB(Math.cos(ang) * 1.6 + seed, Math.sin(ang) * 1.6) * 0.3);
    const q = Math.hypot(x / 1.25, z) / R;
    sp.setY(i, q < 1 ? 0.36 * Math.pow(1 - q * q, 1.3) - 0.13 + Math.sin(x * 9 + z * 3 + NA(x, z) * 2) * 0.01 : -0.3);
  }
  sand.computeVertexNormals();
  parts.push(paint(sand, (c, x, y, z) => c.copy(sa).lerp(sb, 0.5 + 0.5 * Math.sin(x * 9 + z * 3 + NA(x, z) * 2)).multiplyScalar(0.95 + NB(x * 6, z * 6) * 0.08)));
  parts.push(...gravel(r, 26, 1.1, 2.3, 0xa8653d));
  return merge(parts);
}

// ---- 2: đá phiến xếp chồng — 3–5 phiến mỏng thu nhỏ dần, lệch nhau, mép sứt; 1 phiến vỡ dựng nghiêng bên cạnh
function slab(seed, w, t, d) {
  const g = new THREE.BoxGeometry(w, t, d, 24, 3, 18);   // không gộp đỉnh ⇒ cạnh phiến sắc
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const ex = x / (w / 2), ez = z / (d / 2), ang = Math.atan2(ez, ex);
    const chip = 1 - Math.max(0, NA(ang * 3 + seed, 0.5) * 0.2) - Math.abs(NB(ang * 13 + seed, 1.7)) * 0.07 - Math.abs(NA(ang * 37, y * 9 + seed)) * 0.025;   // mép sứt mẻ, răng cưa nhỏ
    x *= chip; z *= chip;
    y += (NA(x * 1.4 + seed, z * 1.4) * 0.05 + NB(x * 7, z * 7) * 0.012) * t * 3 * (y > 0 ? 1 : 0.3);           // mặt phiến gợn
    p.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  return g;
}
function slabs(seed) {
  const r = mulberry(seed), parts = [];
  const pal = [col(0xa95c3a), col(0xbb7a52), col(0x9c5a3c), col(0xc58d66), col(0xb06a46)], lich = col(0x9a9d74), dark = col(0x5a3020);
  const tint = (k, ch) => (c, x, y, z, nx, ny) => {
    c.copy(pal[(k + seed) % pal.length]).multiplyScalar(0.92 + n3(x * 3, y * 3, z * 3) * 0.1);
    const side = 1 - Math.abs(ny);
    c.multiplyScalar(1 - side * 0.2 + Math.sin(y * 70 + NA(x * 2, z * 2) * 3) * side * 0.07);          // mép lộ vân lớp mỏng
    if (ny > 0.7) { c.lerp(pal[3], 0.15); c.multiplyScalar(1 - Math.pow(1 - Math.abs(NA(x * 2.3 + ch, z * 2.3)), 14) * 0.45); c.lerp(lich, Math.max(0, NB(x * 7 + ch, z * 7) - 0.45) * 1.3); }   // mặt trên: vết nứt sẫm + địa y
    c.lerp(dark, sst(0.16, 0.0, y) * 0.35);
  };
  const n = 4 + Math.floor(r() * 3);
  let y = 0, w = 2.4 + r() * 0.5;
  for (let k = 0; k < n; k++) {
    const t = 0.11 + r() * 0.1, d = w * (0.6 + r() * 0.2), g = slab(seed + k * 5, w, t, d);
    place(g, (r() - 0.5) * 0.22 * k, y + t / 2, (r() - 0.5) * 0.18 * k, (r() - 0.5) * 0.08, r() * 0.9, (r() - 0.5) * 0.08);
    parts.push(paint(g, tint(k, k * 3.1)));
    y += t * 0.94; w *= 0.78 + r() * 0.1;
  }
  for (let k = 0; k < 1 + Math.floor(r() * 2); k++) {   // phiến vỡ dựng nghiêng / nằm bẹp cạnh đống
    const lw = 0.9 + r() * 0.5, g = slab(seed + 40 + k, lw, 0.14 + r() * 0.06, lw * 0.7), a = r() * 6.283, lean = k === 0 ? 1.0 + r() * 0.35 : 0.12;
    place(g, Math.cos(a) * 1.5, lw * 0.35 * Math.sin(lean) + 0.04, Math.sin(a) * 1.2, 0, -a, lean);
    parts.push(paint(g, tint(k + 2, 9 + k)));
  }
  parts.push(...gravel(r, 34, 0.9, 2.4, 0xc58458, 0.3));   // mảnh phiến vụn dẹt
  return merge(parts);
}

// ---- 3: tảng đá nứt đôi — tảng lớn bị cắt bởi mặt nứt, 2 nửa tách hé và ngả ra; mặt nứt màu tươi, mảnh vỡ + sỏi ở khe
function split(seed) {
  const r = mulberry(seed), parts = [];
  const skin = col(0xb66c40), skin2 = col(0xd4925e), varn = col(0x4e2c1d), fresh = col(0xe8b687), fresh2 = col(0xd49a6a);
  const src = blob(seed, { detail: 14, big: 0.3, mid: 0.11, fine: 0.035, crack: 0.05, facets: 3, sx: 1.35 + r() * 0.2, sy: 1.05 + r() * 0.2, sz: 1.05 });
  const a0 = r() * 6.283, nP = new THREE.Vector3(Math.cos(a0), 0.12, Math.sin(a0)).normalize(), cx = (r() - 0.5) * 0.3;
  for (const sgn of [1, -1]) {
    const g = src.clone(), p = g.attributes.position, v = new THREE.Vector3(), cutF = new Uint8Array(p.count);
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i); v.x -= cx;
      const dd = v.dot(nP) * sgn;
      if (dd < 0.02) {   // bên kia mặt nứt ⇒ ép lên mặt nứt (mặt phẳng hơi sần)
        v.addScaledVector(nP, (-dd + 0.02 + NA(v.x * 5 + v.z * 5, v.y * 5) * 0.025) * sgn); cutF[i] = 1;
      }
      v.x += cx; p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    const gap = 0.14 + r() * 0.1, lean = (0.08 + r() * 0.07) * sgn, ax = new THREE.Vector3(-nP.z, 0, nP.x).normalize();
    g.applyMatrix4(new THREE.Matrix4().makeRotationAxis(ax, lean));
    g.translate(nP.x * gap * sgn, 0, nP.z * gap * sgn);
    parts.push(paint(g, (c, x, y, z, nx, ny, nz, i) => {
      if (cutF[i]) { c.copy(fresh).lerp(fresh2, 0.5 + 0.5 * NB(x * 4 + z * 4, y * 4)); c.multiplyScalar(0.9 + Math.max(0, y) * 0.05); return; }
      c.copy(skin).lerp(skin2, 0.5 + 0.5 * n3(x, y, z));
      c.lerp(varn, Math.min(0.7, sst(0.35, 0.95, ny) * 0.5 + sst(0.5, 0.8, NA(Math.atan2(z, x) * 8 + seed, y * 0.5)) * sst(0.6, 1.8, y) * 0.4));
      c.multiplyScalar(0.9 + n3(x * 10, y * 10, z * 10) * 0.12);
    }));
  }
  for (let k = 0; k < 2 + Math.floor(r() * 2); k++) {   // mảnh vỡ góc cạnh rơi ở hai đầu khe nứt
    const g = new THREE.IcosahedronGeometry(1, 1), s = 0.14 + r() * 0.14, end = r() < 0.5 ? 1 : -1, ax = new THREE.Vector3(-nP.z, 0, nP.x);
    const pp = g.attributes.position; for (let i = 0; i < pp.count; i++) pp.setXYZ(i, pp.getX(i) * (1 + NA(i * 0.7, seed) * 0.25), pp.getY(i) * 0.6, pp.getZ(i));
    g.computeVertexNormals();
    place(g, cx + ax.x * end * (1.3 + r() * 0.5) + (r() - 0.5) * 0.3, s * 0.3, ax.z * end * (1.2 + r() * 0.5) + (r() - 0.5) * 0.3, r() * 3, r() * 3, r() * 3, s);
    const f = r() < 0.5;
    parts.push(paint(g, (c, x, y, z, nx, ny) => c.copy(f ? fresh2 : skin).multiplyScalar(0.9 + ny * 0.1)));
  }
  parts.push(...gravel(r, 30, 1.2, 2.4, 0xb87448));
  return merge(parts);
}

export function nearMoundKit(style = DA) {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.93 });
  const NL = String.fromCharCode(10);
  mat.onBeforeCompile = sh => {   // hạt đá mịn + lấm tấm (nhiễu 3D theo toạ độ vật) — chi tiết nhỏ hơn mật độ đỉnh
    sh.vertexShader = "varying vec3 vRp;" + NL + sh.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>" + NL + " vRp = position;");
    sh.fragmentShader = "varying vec3 vRp;" + NL + "float h3(vec3 p){ p = fract(p * 0.3183 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }" + NL +
      "float vn3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y), mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z); }" + NL +
      sh.fragmentShader.replace("#include <color_fragment>", "#include <color_fragment>" + NL +
      " { float g1 = vn3(vRp * 14.0), g2 = vn3(vRp * 45.0), sp = step(0.93, vn3(vRp * 90.0)); diffuseColor.rgb *= 0.84 + 0.2 * g1 + 0.1 * g2; diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.9, 0.8, 0.68), sp * 0.18); }")
      .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>" + NL + " totalEmissiveRadiance += diffuseColor.rgb * 0.1;");
  };
  const items = [], N = [4, 3, 4, 3];   // 14 đống mỗi khúc (1u: 28)
  if (style === 0) {   // đống đá cũ của 1u kiểu 3, chỉ thu nhỏ + bớt số lượng
    const RK = makeRockKit(), r = mulberry(1100), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    for (let k = 0; k < 4; k++) {
      const parts = [], seed = 1100 + k * 7, n = 4 + Math.floor(r() * 4);
      for (let j = 0; j < n; j++) {
        const s = j === 0 ? 1 : 0.35 + r() * 0.55, geo = RK.protos[(j + seed) % RK.protos.length].clone(), a = r() * 6, d = j === 0 ? 0 : 0.6 + r() * 0.7;
        m4.compose(new THREE.Vector3(Math.cos(a) * d, s * 0.35 + (j > 3 ? 0.5 : 0), Math.sin(a) * d), q.setFromEuler(e.set(r() * 3, r() * 6, r() * 3)), new THREE.Vector3(s * (0.9 + r() * 0.5), s * (0.7 + r() * 0.4), s));
        geo.applyMatrix4(m4); parts.push(geo);
      }
      parts.push(...gravel(r, 40, 0.9, 2.2, 0x9e9e9e));
      items.push({ geo: merge(parts), mat: RK.mat, w: [0.45, 1.1], h: [0.4, 0.9], n: N[k] });
    }
    return { items };
  }
  const make = style === 1 ? rounded : style === 2 ? slabs : split;
  for (let k = 0; k < 4; k++) items.push({ geo: make(1200 + k * 17), mat, w: [0.45, 1.1], n: N[k] });   // h bỏ trống ⇒ cao theo tỉ lệ bề ngang (không méo đá)
  return { items };
}
