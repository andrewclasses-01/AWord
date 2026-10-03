// CON VẬT — bản 1ag (30/9/2026), thầy: "quá nhiều con vật trên mặt đất":
//  • Mặt đất tại một lúc: TỐI ĐA 1 cặp đuổi nhau (cặp dải xa HOẶC cặp húc chữ — west-world-1ag điều phối) + TỐI ĐA 2 con ra xem tàu
//    (đàn ra xem ≤ 2 con; con húc chữ tính vào suất này). Trên trời giữ nguyên.
//  • Con ra xem tàu: chạy từ chỗ XA NHẤT mà máy quay còn nhìn thấy (không bị đồi/đụn cát che — dò tầm nhìn theo mặt đất thật)
//    tới gần (z −30…−42), đứng ngắm tàu, rồi quay về. Gặp cặp đang đuổi nhau lại gần ⇒ HOẢNG, chạy tránh ra xa rồi bỏ đi.
//  • Cặp đuổi nhau: chạy chéo từ XA về GẦN (z −125…−70 → −50…−32) băng qua khung hình; đường chạy thử trước tầm nhìn ở 3 điểm.
// CON VẬT — bản 1af (30/9/2026), 5 ý thầy:
//  • LỖI chìm đất: gò đất (Y0 −3,2) có chỗ nằm DƯỚI mặt đất thật (đồi xa nhô lên) ⇒ con vật bám gò bị vùi. Nay độ cao = max(gò, mặt đất).
//    Con húc chữ cũng vậy (max(đồi chữ, mặt đất)).
//  • Đuổi nhau: con TRƯỚC luôn nhanh hơn (khoảng cách chỉ giãn ra, không bao giờ co), khoảng hở giữa mõm con đuổi và đuôi con trốn
//    ≥ 2,5 m; con đuổi chạy lệch làn gần máy quay hơn. Chỉ sinh ra / xoá đi khi NGOÀI khung hình thật (setCamera) — hết cảnh
//    "chạy tới giữa màn thì biến mất" (trước đây xoá theo S.camX, mà màn chờ/intro/bàn Fight nhìn chỗ khác).
//  • Cảnh mới: cặp đang phi 4 chân thì ĐỨNG DẬY chạy 2 chân như người (A.rear 0→1: xoay thân quanh hông sau, chân sau bù góc
//    để chạm đất, chân trước thành tay đánh theo nhịp) · CHÓ đuổi VOI · ĐẠI BÀNG chạy bộ 2 chân (vừa chạy vừa vỗ cánh) đuổi đàn thú to.
// CON VẬT — bản 1aa (29/9/2026): như 1z + xuất groundBaseHeight (mặt đất không đụn) cho cây cỏ khúc cảnh.
// CON VẬT — bản 1l (29/9/2026): MỌI con vật dựng kiểu THẬT (ống trơn liền khối, màu lông đổ bóng ngược, chân nhiều khớp):
// ngựa, linh dương sừng nhánh, bò (đốm sữa / nâu), lợn, voi (vòi nhiều đốt, tai quạt, ngà), lạc đà (bướu), sư tử đực (bờm) + cái,
// sói, sói đồng cỏ, kangaroo (nhảy 2 chân), gà (mào, đuôi xoè). Dáng: đi 4 nhịp, nước kiệu, phi nước đại (chéo / xoay vòng),
// đứng ngắm (thở, ngoái cổ nhìn tàu, vẫy đuôi, gà mổ thóc). Dùng cho: con trên gò ra ngắm tàu, con húc chữ, cặp đuổi nhau.
// Gò đồi 1l: cây cỏ nhỏ + thưa + chi tiết hơn (west-props-1l farGrassKit).
import * as THREE from "../../rocket-race/vendor/three/three.module.min.js";
import { makeNoise, mulberry, makeRockKit, farGrassKit, scatterFarGrass } from "./west-props-1ag.js";
import { duneApply, DUNE } from "./dune-1z.js";

// ------------------------------------------------------------ gò đồi địa hình thật
const Y0 = -3.2, MZ = -72, MW = 72, MD = 54;
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function makeMound(seed, hillMap, rockKit) {
  const N = makeNoise(seed), r = mulberry(seed);
  const crest = 1 + r() * 2, H = 7.4 + r() * 1.2, skew = (r() - 0.5) * 0.35, bumpX = (r() - 0.5) * 14;
  const shape = (lx, lz) => {
    const ax = Math.abs(lx - bumpX * smooth(-20, 20, lz) + lz * skew) / (MW / 2);
    const hx = 1 - smooth(0.2, 1.0, ax);
    const dz = lz - crest;
    const hz = dz > 0 ? 1 - smooth(0, 1, dz / 24) : 1 - smooth(0, 1, -dz / 19);
    return hx * hz;
  };
  const h = (lx, lz) => {
    const b = shape(lx, lz);
    // 1k: gò MỀM — chỉ sóng đất to, thoải (bỏ gờ đá bậc thang + nhiễu nhỏ lởm chởm) ⇒ con vật leo lên đi xuống hợp lý
    const n = N(lx * 0.045, lz * 0.045) * 0.6 + N(lx * 0.1 + 7, lz * 0.1) * 0.22 + N(lx * 0.25, lz * 0.25 + 3) * 0.03;
    const y = H * Math.pow(b, 1.35) * (1 + n * 0.28) + n * 0.7 * b;
    return Y0 + y;
  };
  const NX = 110, NZ = 80;
  const geo = new THREE.PlaneGeometry(MW, MD, NX, NZ); geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, h(p.getX(i), p.getZ(i)));
  geo.computeVertexNormals();
  const nr = geo.attributes.normal, col = new Float32Array(p.count * 3), c = new THREE.Color();
  // màu đỉnh = sắc nhân lên vân đất (cùng vân với mặt đất gần) ⇒ gò hoà vào cảnh, không bệt màu
  const cSand = new THREE.Color(0xf2cfa8), cRock = new THREE.Color(0xd08658), cDeep = new THREE.Color(0xa85e38), cTop = new THREE.Color(0xffe4c4), cScrub = new THREE.Color(0xbdb46e);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), ny = nr.getY(i);
    const steep = smooth(0.95, 0.72, ny), top = smooth(H * 0.55, H, y - Y0);
    c.copy(cSand).lerp(cTop, top * 0.6).lerp(cRock, steep * 0.85);
    const band = 0.5 + 0.5 * Math.sin((y - Y0) * 3.1 + N(x * 0.2, z * 0.2) * 2);
    c.lerp(cDeep, steep * band * 0.45);
    const sc = smooth(0.15, 0.45, N(x * 0.11 + 30, z * 0.11)) * (1 - steep) * (1 - top * 0.6);
    c.lerp(cScrub, sc * 0.55);
    c.multiplyScalar(0.92 + N(x * 1.3, z * 1.3) * 0.12);
    col.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const gtex = farGrassKit().groundTex.clone(); gtex.repeat.set(MW / 6, MD / 6); gtex.needsUpdate = true; void hillMap;
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, map: gtex, roughness: 1 });
  const g = new THREE.Group();
  const m = new THREE.Mesh(geo, mat); m.receiveShadow = true; g.add(m);
  // đá lộ trên sườn + bụi cây khô lác đác
  let guard = 0;
  for (let k = 0; k < 14 && guard++ < 200; k++) {
    const lx = (r() - 0.5) * MW * 0.8, lz = (r() - 0.35) * MD * 0.7, b = shape(lx, lz);
    if (b < 0.12) { k--; continue; }
    const rock = new THREE.Mesh(rockKit.protos[k % rockKit.protos.length], rockKit.mat);
    const s = 0.5 + r() * 1.5; rock.scale.set(s * (1 + r()), s, s * (0.8 + r() * 0.6)); rock.rotation.y = r() * 6;
    rock.position.set(lx, h(lx, lz) - 0.15 * s, lz); g.add(rock);
  }
  // 1k: cỏ thật (búi cỏ mảnh + bụi sa mạc) mọc thành vạt thay khối cầu xanh
  const patch = (x, z) => Math.max(0, Math.min(1, (N(x * 0.07 + 30, z * 0.07) * 1.2 + N(x * 0.22, z * 0.22 + 4) * 0.35 - 0.05) * 2));   // 1l: vạt thưa, nhiều đất trống
  scatterFarGrass(g, h, { n: 1300, ns: 26, nf: 160, rx: MW / 2 * 0.95, rz: MD / 2 * 0.9, cz: 0, seed: seed + 3, s0: 0.22, s1: 0.5,
    inside: (lx, lz) => shape(lx, lz) > 0.05, patch });
  return { g, h, shape, crest };
}

const f32 = Math.fround;
const fr = x => f32(x - Math.floor(x));
const K1 = f32(233.34), K2 = f32(851.73), K3 = f32(23.45), K4 = f32(2.02), K5 = f32(3.1), K6 = f32(1.7);
function h21(x, y) { x = fr(f32(x * K1)); y = fr(f32(y * K2)); const d = f32(f32(x * f32(x + K3)) + f32(y * f32(y + K3))); x = f32(x + d); y = f32(y + d); return fr(f32(x * y)); }
function vn(x, y) { const ix = Math.floor(x), iy = Math.floor(y), fx = f32(x - ix), fy = f32(y - iy), ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const a = h21(ix, iy), b = h21(ix + 1, iy), c = h21(ix, iy + 1), d = h21(ix + 1, iy + 1);
  return (a * (1 - ux) + b * ux) * (1 - uy) + (c * (1 - ux) + d * ux) * uy; }
function fbm4(x, y) { x = f32(x); y = f32(y); let s = 0, a = 0.5; for (let i = 0; i < 5; i++) { s += a * vn(x, y); x = f32(f32(x * K4) + K5); y = f32(f32(y * K4) + K6); a *= 0.5; } return s; }
const sst = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export function groundHeight(x, z) {   // = groundH() trong shader mặt đất (west-world)
  return duneApply(groundBaseHeight(x, z), x, z);   /* 1x: đụn cát đỡ chữ */
}
// 1aa: độ cao mặt đất CHƯA có đụn cát (đụn đến rồi đi theo bảng chữ) — cây cỏ khúc cảnh đặt theo mặt này, đụn chỉ vùi chúng đi
export function groundBaseHeight(x, z) {
  const far = sst(45, 170, -z);
  const hills = Math.max(0, fbm4(f32(x) * f32(0.0035), f32(z) * f32(0.0035)) - 0.36) * 80 * far * (1 - 0.9 * sst(135, 165, -z) * (1 - sst(250, 300, -z)));   /* 1x: khớp dải phẳng 1u của shader */
  const mid = (fbm4(f32(x) * f32(0.02), f32(z) * f32(0.02)) - 0.5) * 3.2 * sst(22, 70, -z);
  const near = (vn(x * 0.12, z * 0.12) - 0.5) * 0.22 * sst(3, 9, Math.abs(z));
  return hills + mid + near;
}
DUNE.gh = groundHeight;

// ống trơn theo đường cong trong mặt phẳng dọc (x tới, y lên); keys: [x, y, nửa-bề-ngang, nửa-bề-cao, hệ-số-bụng]
function loft(keys, col, rings = 26, seg = 18) {
  const curve = new THREE.CatmullRomCurve3(keys.map(k => new THREE.Vector3(k[0], k[1], 0)), false, "centripetal");
  const n = keys.length - 1, pos = [], cl = [], idx = [];
  const K = (u, j, d) => { const f = u * n, i = Math.min(n - 1, Math.floor(f)), t = f - i, s = t * t * (3 - 2 * t); return (keys[i][j] ?? d) * (1 - s) + (keys[i + 1][j] ?? d) * s; };
  const c3 = new THREE.Color();
  for (let a = 0; a <= rings; a++) {
    const u = a / rings, c = curve.getPoint(u), tg = curve.getTangent(u), ux = -tg.y, uy = tg.x;
    const rz = K(u, 2, 0.1), ry = K(u, 3, 0.1), bel = K(u, 4, 1);
    for (let b = 0; b <= seg; b++) {
      const th = b / seg * Math.PI * 2 - Math.PI / 2, s = Math.sin(th)   // đường nối vòng nằm dưới bụng (không lộ vệt gãy bên hông)
     , co = Math.cos(th), yy = s * ry * (s < 0 ? bel : 1);
      const px = c.x + ux * yy, py = c.y + uy * yy, pz = co * rz * (1 - 0.12 * Math.max(0, -s));
      pos.push(px, py, pz);
      col(c3, u, s, co, px, py, pz);
      const fur = 0.93 + 0.14 * vn(px * 23 + pz * 7, py * 23 - pz * 5);   // vân lông
      cl.push(c3.r * fur, c3.g * fur, c3.b * fur);
    }
  }
  for (let a = 0; a < rings; a++) for (let b = 0; b < seg; b++) { const i0 = a * (seg + 1) + b, i1 = i0 + seg + 1; idx.push(i0, i1, i0 + 1, i1, i1 + 1, i0 + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(cl, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}
const C = h => new THREE.Color(h);

// bảng loài (đơn vị ≈ mét; sc phóng lên cho dễ thấy ở xa). ws = sải bước đi (m); hs = tốc độ khi ra/vào gò; herd = số con
// Chân: trước 3 đốt, sau 4 đốt; mỗi đốt [dài, khoá ống, góc nghỉ]
const REAL = {
  horse: {
    sc: 1.35, run: 12, freq: 2.0, rotary: false, amp: 0.55, ws: 1.7, hs: 4.4, herd: [1, 3],
    pal: () => { const v = [[0x7a4526, 0x1c120c, 0xb88a64], [0x9a5a2e, 0x4a2a16, 0xd2a57c], [0x8f8272, 0x2e2822, 0xcfc4b6], [0x3a2a20, 0x120c08, 0x6a5444]][Math.floor(Math.random() * 4)]; return { coat: C(v[0]), point: C(v[1]), belly: C(v[2]) }; },
    torso: [[-1.02, 1.36, 0.03, 0.03], [-0.97, 1.38, 0.19, 0.22], [-0.8, 1.38, 0.29, 0.31], [-0.52, 1.34, 0.31, 0.34, 1.05], [-0.15, 1.29, 0.32, 0.37, 1.12], [0.25, 1.3, 0.31, 0.38, 1.12], [0.6, 1.36, 0.26, 0.38, 1.05], [0.8, 1.38, 0.19, 0.3], [0.9, 1.36, 0.05, 0.07]],
    neckAt: [0.58, 1.48], neck: [[-0.06, -0.12, 0.21, 0.36], [0.18, 0.3, 0.16, 0.27], [0.37, 0.63, 0.11, 0.18], [0.47, 0.8, 0.095, 0.14]], neckTilt: -0.12,
    head: [[-0.07, 0.03, 0.1, 0.12], [0.06, 0.0, 0.12, 0.15], [0.28, -0.13, 0.09, 0.115], [0.48, -0.26, 0.075, 0.095], [0.56, -0.3, 0.025, 0.035]],
    ears: { at: [0.0, 0.12], len: 0.14, w: 0.035 }, mane: true, eye: [0.1, 0.05, 0.1], forelock: true,
    tailAt: [-1.0, 1.52], tail: [[0, 0, 0.05, 0.06], [-0.18, -0.16, 0.08, 0.09], [-0.34, -0.45, 0.1, 0.07], [-0.42, -0.78, 0.07, 0.04], [-0.44, -0.9, 0.01, 0.01]], tailLift: -0.75, tailRest: 0, tailDark: true,
    front: { at: [0.55, 1.07, 0.15], segs: [[0.5, [[0, 0.1, 0.12, 0.14], [0, -0.25, 0.085, 0.1], [0, -0.5, 0.055, 0.065]], 0], [0.36, [[0, 0, 0.045, 0.055], [0, -0.36, 0.04, 0.05]], 0], [0.21, [[0, 0, 0.048, 0.055], [0.02, -0.13, 0.045, 0.05], [0.03, -0.21, 0.062, 0.07]], 0.18]] },
    hind: { at: [-0.64, 1.2, 0.15], segs: [[0.44, [[0, 0.16, 0.16, 0.22], [0, -0.2, 0.12, 0.15], [0, -0.44, 0.065, 0.08]], 0.35], [0.38, [[0, 0, 0.065, 0.08], [0, -0.38, 0.045, 0.058]], -0.85], [0.34, [[0, 0, 0.042, 0.05], [0, -0.34, 0.04, 0.047]], 0.55], [0.18, [[0, 0, 0.045, 0.05], [0.02, -0.11, 0.045, 0.05], [0.03, -0.18, 0.06, 0.068]], 0.05]] },
    hoof: true, darkLegs: 0.62,
  },
  pronghorn: {
    sc: 1.5, run: 12.5, freq: 2.5, rotary: false, amp: 0.6, ws: 1.0, hs: 4.8, herd: [2, 4],
    pal: () => ({ coat: C(0xb67a44), point: C(0x2a1c12), belly: C(0xf4ede0) }),
    torso: [[-0.62, 0.92, 0.02, 0.02], [-0.58, 0.94, 0.12, 0.14], [-0.46, 0.95, 0.17, 0.19], [-0.25, 0.92, 0.18, 0.21, 1.05], [0.05, 0.9, 0.18, 0.22, 1.1], [0.32, 0.93, 0.16, 0.22], [0.48, 0.94, 0.11, 0.17], [0.55, 0.94, 0.03, 0.04]],
    neckAt: [0.4, 1.02], neck: [[-0.02, -0.04, 0.1, 0.15], [0.12, 0.2, 0.07, 0.1], [0.24, 0.4, 0.055, 0.075], [0.28, 0.47, 0.05, 0.065]], neckTilt: -0.08,
    head: [[-0.04, 0.02, 0.06, 0.065], [0.05, 0.0, 0.07, 0.08], [0.18, -0.07, 0.05, 0.06], [0.28, -0.13, 0.038, 0.045], [0.31, -0.15, 0.01, 0.015]],
    ears: { at: [-0.01, 0.07], len: 0.1, w: 0.025 }, horns: true, eye: [0.06, 0.035, 0.065],
    tailAt: [-0.6, 1.0], tail: [[0, 0, 0.035, 0.04], [-0.06, -0.06, 0.03, 0.03], [-0.09, -0.12, 0.005, 0.005]], tailLift: -0.4, tailRest: 0,
    front: { at: [0.34, 0.74, 0.085], segs: [[0.3, [[0, 0.06, 0.065, 0.08], [0, -0.15, 0.045, 0.055], [0, -0.3, 0.03, 0.035]], 0], [0.28, [[0, 0, 0.024, 0.03], [0, -0.28, 0.02, 0.026]], 0], [0.16, [[0, 0, 0.024, 0.028], [0.015, -0.11, 0.022, 0.026], [0.02, -0.16, 0.03, 0.036]], 0.15]] },
    hind: { at: [-0.42, 0.86, 0.085], segs: [[0.3, [[0, 0.1, 0.09, 0.13], [0, -0.14, 0.07, 0.09], [0, -0.3, 0.035, 0.045]], 0.35], [0.28, [[0, 0, 0.035, 0.045], [0, -0.28, 0.024, 0.03]], -0.85], [0.26, [[0, 0, 0.022, 0.028], [0, -0.26, 0.02, 0.025]], 0.55], [0.12, [[0, 0, 0.022, 0.026], [0.012, -0.08, 0.022, 0.026], [0.018, -0.12, 0.03, 0.034]], 0.05]] },
    hoof: true, darkLegs: 0.85, pronghorn: true,
  },
  lioness: {
    sc: 1.45, run: 12.5, freq: 2.3, rotary: true, amp: 0.8, flex: 0.09, ws: 1.1, hs: 4.8, herd: [1, 2],
    pal: () => ({ coat: C(0xc2904e), point: C(0x6a4a2a), belly: C(0xecd8b4) }),
    torso: [[-0.8, 0.74, 0.03, 0.03], [-0.74, 0.76, 0.16, 0.17], [-0.56, 0.77, 0.2, 0.22], [-0.22, 0.73, 0.19, 0.22, 1.0], [0.18, 0.74, 0.2, 0.25, 1.05], [0.48, 0.78, 0.19, 0.26], [0.64, 0.76, 0.13, 0.18], [0.7, 0.74, 0.03, 0.04]],
    neckAt: [0.56, 0.82], neck: [[-0.04, 0.0, 0.15, 0.18], [0.14, 0.05, 0.13, 0.15], [0.28, 0.08, 0.11, 0.12]], neckTilt: 0,
    head: [[-0.06, 0.0, 0.1, 0.11], [0.07, 0.02, 0.12, 0.12], [0.19, -0.01, 0.1, 0.09], [0.28, -0.04, 0.065, 0.06], [0.32, -0.05, 0.02, 0.02]],
    roundEars: [0.0, 0.11, 0.08], eye: [0.14, 0.05, 0.075], nose: true, muzzleLight: true,
    tailAt: [-0.77, 0.84], tail: [[0, 0, 0.035, 0.035], [-0.28, -0.16, 0.03, 0.03], [-0.55, -0.2, 0.025, 0.025], [-0.8, -0.1, 0.02, 0.02], [-0.86, -0.06, 0.005, 0.005]], tailLift: -0.2, tailRest: 0.55, tuft: true,
    front: { at: [0.48, 0.62, 0.1], segs: [[0.3, [[0, 0.12, 0.1, 0.13], [0, -0.14, 0.07, 0.085], [0, -0.3, 0.05, 0.06]], 0], [0.24, [[0, 0, 0.05, 0.06], [0, -0.24, 0.04, 0.045]], 0], [0.08, [[0, 0, 0.042, 0.048], [0.03, -0.05, 0.05, 0.06], [0.05, -0.08, 0.05, 0.065]], 0.2]] },
    hind: { at: [-0.56, 0.7, 0.1], segs: [[0.3, [[0, 0.14, 0.12, 0.18], [0, -0.12, 0.09, 0.12], [0, -0.3, 0.05, 0.06]], 0.4], [0.28, [[0, 0, 0.05, 0.06], [0, -0.28, 0.035, 0.045]], -0.95], [0.16, [[0, 0, 0.034, 0.04], [0, -0.16, 0.034, 0.04]], 0.5], [0.07, [[0, 0, 0.04, 0.045], [0.03, -0.04, 0.045, 0.06], [0.05, -0.07, 0.045, 0.06]], 0.05]] },
  },
  wolf: {
    sc: 1.55, run: 12, freq: 2.4, rotary: true, amp: 0.75, flex: 0.07, ws: 0.9, hs: 4.6, herd: [1, 3],
    pal: () => { const v = [[0x8a7f72, 0x3a342e, 0xe2dbd0], [0x9a8266, 0x4a3a2a, 0xe8dcc6]][Math.floor(Math.random() * 2)]; return { coat: C(v[0]), point: C(v[1]), belly: C(v[2]) }; },
    torso: [[-0.6, 0.66, 0.03, 0.03], [-0.55, 0.68, 0.12, 0.14], [-0.4, 0.69, 0.15, 0.17], [-0.12, 0.66, 0.15, 0.18, 1.0], [0.2, 0.68, 0.16, 0.22, 1.05], [0.42, 0.72, 0.15, 0.22], [0.54, 0.7, 0.1, 0.15], [0.59, 0.68, 0.03, 0.04]],
    neckAt: [0.46, 0.78], neck: [[-0.04, -0.02, 0.12, 0.16], [0.12, 0.05, 0.1, 0.12], [0.24, 0.1, 0.08, 0.09]], neckTilt: 0,
    head: [[-0.05, 0.0, 0.08, 0.085], [0.06, 0.01, 0.09, 0.09], [0.16, -0.01, 0.06, 0.06], [0.28, -0.04, 0.035, 0.035], [0.31, -0.045, 0.01, 0.01]],
    ears: { at: [0.0, 0.08], len: 0.1, w: 0.035, sep: 0.05 }, eye: [0.1, 0.035, 0.05], nose: true, ruff: true, muzzleLight: true,
    tailAt: [-0.58, 0.74], tail: [[0, 0, 0.04, 0.04], [-0.14, -0.1, 0.07, 0.07], [-0.3, -0.22, 0.08, 0.08], [-0.44, -0.3, 0.05, 0.05], [-0.5, -0.33, 0.01, 0.01]], tailLift: -0.35, tailRest: 0.35, tailTip: true, wolfSaddle: true,
    front: { at: [0.4, 0.56, 0.08], segs: [[0.27, [[0, 0.1, 0.07, 0.09], [0, -0.12, 0.05, 0.06], [0, -0.27, 0.035, 0.04]], 0], [0.22, [[0, 0, 0.034, 0.04], [0, -0.22, 0.027, 0.032]], 0], [0.07, [[0, 0, 0.028, 0.032], [0.02, -0.045, 0.034, 0.045], [0.035, -0.07, 0.034, 0.045]], 0.2]] },
    hind: { at: [-0.44, 0.64, 0.08], segs: [[0.27, [[0, 0.12, 0.1, 0.14], [0, -0.1, 0.07, 0.09], [0, -0.27, 0.04, 0.045]], 0.4], [0.25, [[0, 0, 0.04, 0.045], [0, -0.25, 0.028, 0.034]], -0.95], [0.15, [[0, 0, 0.026, 0.03], [0, -0.15, 0.026, 0.03]], 0.5], [0.06, [[0, 0, 0.03, 0.034], [0.02, -0.04, 0.034, 0.045], [0.035, -0.06, 0.034, 0.045]], 0.05]] },
  },
  cow: {
    sc: 1.3, run: 8, freq: 1.9, rotary: false, amp: 0.45, ws: 1.2, hs: 3.5, herd: [1, 3],
    pal: () => Math.random() < 0.6 ? { coat: C(0xf2efe8), point: C(0x1a1816), belly: C(0xf6f2ea), patches: true, nose: C(0xd89a94) } : { coat: C(0x7a4526), point: C(0x3a2214), belly: C(0x9a6440), nose: C(0x4a3a34) },
    torso: [[-0.95, 1.08, 0.03, 0.03], [-0.9, 1.1, 0.22, 0.24], [-0.75, 1.12, 0.32, 0.33], [-0.4, 1.07, 0.36, 0.42, 1.12], [0.1, 1.06, 0.37, 0.44, 1.12], [0.5, 1.09, 0.33, 0.4], [0.72, 1.07, 0.24, 0.31], [0.82, 1.04, 0.05, 0.06]],
    neckAt: [0.66, 1.16], neck: [[-0.06, -0.06, 0.2, 0.3], [0.16, 0.0, 0.16, 0.22], [0.3, 0.02, 0.13, 0.16]], neckTilt: 0,
    head: [[-0.04, 0.02, 0.11, 0.13], [0.08, -0.02, 0.12, 0.14], [0.24, -0.14, 0.1, 0.11], [0.36, -0.24, 0.09, 0.09], [0.4, -0.27, 0.03, 0.03]],
    sideEars: [0.02, 0.06, 0.12], cowHorns: true, eye: [0.08, 0.04, 0.12], udder: [-0.45, 0.66], dewlap: true,
    tailAt: [-0.93, 1.36], tail: [[0, 0, 0.03, 0.03], [-0.04, -0.3, 0.025, 0.025], [-0.05, -0.65, 0.02, 0.02], [-0.05, -0.8, 0.005, 0.005]], tailLift: -0.35, tailRest: 0, tuft: true,
    front: { at: [0.5, 0.72, 0.17], segs: [[0.36, [[0, 0.1, 0.1, 0.12], [0, -0.18, 0.075, 0.085], [0, -0.36, 0.05, 0.06]], 0], [0.26, [[0, 0, 0.045, 0.05], [0, -0.26, 0.04, 0.047]], 0], [0.1, [[0, 0, 0.045, 0.05], [0.015, -0.06, 0.05, 0.055], [0.02, -0.1, 0.06, 0.07]], 0.1]] },
    hind: { at: [-0.64, 0.88, 0.17], segs: [[0.34, [[0, 0.14, 0.13, 0.2], [0, -0.16, 0.1, 0.13], [0, -0.34, 0.06, 0.07]], 0.3], [0.3, [[0, 0, 0.06, 0.07], [0, -0.3, 0.045, 0.05]], -0.75], [0.22, [[0, 0, 0.042, 0.048], [0, -0.22, 0.04, 0.046]], 0.45], [0.09, [[0, 0, 0.045, 0.05], [0.015, -0.05, 0.05, 0.055], [0.02, -0.09, 0.06, 0.07]], 0]] },
    hoof: true, darkLegs: 0.9,
  },
  pig: {
    sc: 1.55, run: 5, freq: 3.0, rotary: false, amp: 0.5, ws: 0.45, hs: 3.3, herd: [2, 3],
    pal: () => ({ coat: C(0xeaa89c), point: C(0xb07068), belly: C(0xf2c0b6) }),
    torso: [[-0.52, 0.5, 0.03, 0.03], [-0.48, 0.52, 0.17, 0.19], [-0.32, 0.53, 0.24, 0.26], [-0.02, 0.51, 0.27, 0.29, 1.05], [0.28, 0.52, 0.25, 0.27], [0.44, 0.53, 0.2, 0.22], [0.5, 0.53, 0.05, 0.06]],
    neckAt: [0.42, 0.56], neck: [[-0.04, -0.01, 0.18, 0.2], [0.08, 0.0, 0.16, 0.17]], neckTilt: 0,
    head: [[-0.03, 0.0, 0.14, 0.15], [0.09, -0.01, 0.12, 0.12], [0.19, -0.04, 0.08, 0.08], [0.25, -0.05, 0.068, 0.068], [0.26, -0.05, 0.03, 0.03]],
    flopEars: [0.02, 0.1, 0.08], eye: [0.08, 0.05, 0.09], snout: true,
    tailAt: [-0.5, 0.62], curlTail: true, tail: [[0, 0, 0.02, 0.02], [-0.03, 0.01, 0.015, 0.015]], tailLift: 0, tailRest: 0,
    front: { at: [0.3, 0.32, 0.12], segs: [[0.16, [[0, 0.06, 0.07, 0.08], [0, -0.08, 0.055, 0.06], [0, -0.16, 0.045, 0.05]], 0], [0.1, [[0, 0, 0.04, 0.045], [0, -0.1, 0.035, 0.04]], 0], [0.06, [[0, 0, 0.035, 0.04], [0.008, -0.035, 0.037, 0.042], [0.012, -0.06, 0.04, 0.045]], 0.1]] },
    hind: { at: [-0.32, 0.36, 0.12], segs: [[0.16, [[0, 0.08, 0.09, 0.1], [0, -0.08, 0.07, 0.075], [0, -0.16, 0.05, 0.055]], 0.3], [0.12, [[0, 0, 0.045, 0.05], [0, -0.12, 0.035, 0.04]], -0.7], [0.08, [[0, 0, 0.032, 0.036], [0, -0.08, 0.03, 0.034]], 0.4], [0.05, [[0, 0, 0.033, 0.037], [0.008, -0.03, 0.036, 0.04], [0.012, -0.05, 0.04, 0.045]], 0]] },
    hoof: true, darkLegs: 0.9,
  },
  elephant: {
    sc: 1.15, run: 6, freq: 1.4, rotary: false, amp: 0.3, ws: 1.9, hs: 3.0, herd: [1, 2], noGallop: true,
    pal: () => ({ coat: C(0x8c8680), point: C(0x5e5852), belly: C(0x77716b) }),
    torso: [[-1.15, 1.95, 0.04, 0.04], [-1.1, 2.0, 0.38, 0.42], [-0.9, 2.08, 0.56, 0.62], [-0.45, 2.12, 0.62, 0.74, 1.0], [0.15, 2.15, 0.63, 0.78], [0.55, 2.15, 0.57, 0.72], [0.82, 2.1, 0.38, 0.5], [0.92, 2.02, 0.08, 0.1]],
    neckAt: [0.82, 2.28], neck: [[-0.08, 0, 0.42, 0.52], [0.14, 0.0, 0.38, 0.46]], neckTilt: 0,
    head: [[-0.08, 0.1, 0.42, 0.54], [0.14, 0.08, 0.46, 0.6], [0.38, -0.08, 0.36, 0.46], [0.5, -0.3, 0.22, 0.24], [0.54, -0.44, 0.15, 0.15]],
    eye: [0.3, 0.08, 0.3], elephant: true, wrinkle: true,
    tailAt: [-1.12, 2.15], tail: [[0, 0, 0.04, 0.04], [-0.05, -0.4, 0.03, 0.03], [-0.06, -0.8, 0.02, 0.02], [-0.06, -0.9, 0.005, 0.005]], tailLift: -0.2, tailRest: 0, tuft: true,
    front: { at: [0.55, 1.45, 0.34], segs: [[0.72, [[0, 0.25, 0.24, 0.26], [0, -0.35, 0.19, 0.2], [0, -0.72, 0.17, 0.18]], 0], [0.64, [[0, 0, 0.17, 0.18], [0, -0.64, 0.16, 0.17]], 0], [0.09, [[0, 0, 0.17, 0.18], [0, -0.05, 0.19, 0.2], [0, -0.09, 0.2, 0.21]], 0]] },
    hind: { at: [-0.78, 1.5, 0.34], segs: [[0.7, [[0, 0.3, 0.26, 0.3], [0, -0.35, 0.2, 0.22], [0, -0.7, 0.17, 0.18]], 0.1], [0.62, [[0, 0, 0.17, 0.18], [0, -0.62, 0.16, 0.17]], -0.2], [0.1, [[0, 0, 0.16, 0.17], [0, -0.1, 0.16, 0.17]], 0.1], [0.08, [[0, 0, 0.17, 0.18], [0, -0.04, 0.19, 0.2], [0, -0.08, 0.2, 0.21]], 0]] },
  },
  camel: {
    sc: 1.2, run: 9, freq: 1.8, rotary: false, amp: 0.5, ws: 2.0, hs: 3.4, herd: [1, 2],
    pal: () => ({ coat: C(0xc49a66), point: C(0x7a5a3a), belly: C(0xdcc09a) }),
    torso: [[-0.82, 1.72, 0.03, 0.03], [-0.78, 1.75, 0.2, 0.22], [-0.58, 1.78, 0.28, 0.3], [-0.2, 1.76, 0.3, 0.34, 1.1], [0.25, 1.76, 0.29, 0.34, 1.1], [0.55, 1.74, 0.24, 0.3], [0.7, 1.7, 0.08, 0.1]],
    hump: [[-0.5, 2.0, 0.05, 0.03], [-0.3, 2.06, 0.2, 0.2], [-0.05, 2.12, 0.24, 0.26], [0.18, 2.06, 0.2, 0.2], [0.36, 1.98, 0.05, 0.03]],
    neckAt: [0.58, 1.85], neck: [[-0.06, -0.02, 0.15, 0.22], [0.25, -0.08, 0.12, 0.15], [0.5, 0.08, 0.09, 0.11], [0.6, 0.36, 0.08, 0.09], [0.62, 0.48, 0.075, 0.085]], neckTilt: 0,
    head: [[-0.04, 0.0, 0.08, 0.1], [0.08, 0.0, 0.09, 0.11], [0.24, -0.04, 0.07, 0.08], [0.34, -0.07, 0.06, 0.065], [0.37, -0.08, 0.02, 0.02]],
    ears: { at: [-0.02, 0.08], len: 0.06, w: 0.025 }, eye: [0.08, 0.05, 0.08],
    tailAt: [-0.8, 1.82], tail: [[0, 0, 0.03, 0.03], [-0.03, -0.25, 0.025, 0.025], [-0.04, -0.45, 0.02, 0.02], [-0.04, -0.5, 0.005, 0.005]], tailLift: -0.4, tailRest: 0, tuft: true,
    front: { at: [0.48, 1.45, 0.16], segs: [[0.62, [[0, 0.12, 0.1, 0.14], [0, -0.3, 0.07, 0.08], [0, -0.62, 0.05, 0.055]], 0], [0.58, [[0, 0, 0.045, 0.05], [0, -0.58, 0.04, 0.045]], 0], [0.25, [[0, 0, 0.04, 0.045], [0.03, -0.17, 0.045, 0.05], [0.05, -0.25, 0.08, 0.07]], 0.25]] },
    hind: { at: [-0.58, 1.55, 0.16], segs: [[0.55, [[0, 0.15, 0.13, 0.2], [0, -0.25, 0.09, 0.11], [0, -0.55, 0.05, 0.06]], 0.3], [0.5, [[0, 0, 0.05, 0.06], [0, -0.5, 0.04, 0.045]], -0.7], [0.42, [[0, 0, 0.04, 0.045], [0, -0.42, 0.038, 0.043]], 0.45], [0.2, [[0, 0, 0.04, 0.045], [0.03, -0.13, 0.045, 0.05], [0.05, -0.2, 0.08, 0.07]], 0.05]] },
  },
};
REAL.lion = { ...REAL.lioness, pal: () => ({ coat: C(0xc89452), point: C(0x5a3818), belly: C(0xeedab6) }), lionMane: true, sc: 1.55 };
REAL.coyote = { ...REAL.wolf, sc: 1.25, pal: () => ({ coat: C(0xa88a64), point: C(0x5a4a38), belly: C(0xeee2cc) }), herd: [1, 2] };
REAL.kangaroo = { special: "roo", sc: 1.5, hs: 4.4, herd: [1, 3], run: 9 };
// 1af: chó (dáng sói, nhỏ hơn, đuôi vểnh, lông vàng / đen trắng / nâu) · đại bàng chạy bộ (to như người, 2 chân, vỗ cánh)
REAL.dog = { ...REAL.wolf, sc: 1.05, ruff: false, wolfSaddle: false, tailLift: 0.45, tailRest: 0.55, herd: [1, 1],
  pal: () => { const v = [[0xc8923e, 0x7a5222, 0xf0d8a8], [0x1e1b18, 0x0e0c0a, 0xf2efe8], [0x7a4a2a, 0x3a2414, 0xd8b890]][Math.floor(Math.random() * 3)]; return { coat: C(v[0]), point: C(v[1]), belly: C(v[2]) }; } };
REAL.eagleRun = { special: "eagle", sc: 3.4, hs: 5, herd: [1, 1], run: 8 };
REAL.chicken = { special: "hen", sc: 2.3, hs: 2.6, herd: [3, 5], run: 4 };
const HERD_KINDS = ["horse", "pronghorn", "cow", "pig", "elephant", "camel", "lion", "lioness", "coyote", "kangaroo", "chicken"];

function vcol(geo, color) { const n = geo.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = color.r; a[i * 3 + 1] = color.g; a[i * 3 + 2] = color.b; } geo.setAttribute("color", new THREE.BufferAttribute(a, 3)); return geo; }
function disposeAnimal(scene, A) { scene.remove(A.g); A.g.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); }

function buildReal(kind) {
  const D = REAL[kind];
  if (D.special === "roo") return buildRoo();
  if (D.special === "hen") return buildHen();
  if (D.special === "eagle") return buildEagleRun();
  const P = D.pal();
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x14100c, roughness: 0.45 });
  const hornMat = new THREE.MeshStandardMaterial({ color: kind === "cow" ? 0xe8dcc0 : 0x1a1512, roughness: 0.5 });
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const mesh = (geo, m = mat) => { const o = new THREE.Mesh(geo, m); o.castShadow = true; return o; };
  const cc = new THREE.Color();
  // đốm bò sữa: vệt đen lớn theo nhiễu toạ độ (mỗi con một kiểu nhờ độ lệch ngẫu nhiên)
  const po = Math.random() * 50;
  const patch = (c, px, py, pz) => { if (P.patches && vn(px * 4.2 + po, (py + pz * 0.8) * 4.2 + po * 0.3) + 0.25 * vn(px * 11, py * 11 + pz * 7) > 0.78) c.copy(P.point); };
  const wr = D.wrinkle ? (c, px, py) => c.multiplyScalar(0.9 + 0.12 * vn(px * 40, py * 9)) : () => {};
  const torsoCol = (c, u, s, co, px, py, pz) => {
    c.copy(P.coat).lerp(P.belly, sst(0.05, -0.75, s));
    c.multiplyScalar(1 - Math.max(0, s) * 0.12);
    if (D.pronghorn) { if (u < 0.14 && s < 0.6) c.copy(P.belly); c.lerp(P.belly, sst(-0.12, -0.35, s)); }
    if (D.wolfSaddle && s > 0.35 && u > 0.2 && u < 0.8) c.lerp(P.point, 0.35);
    patch(c, px, py, pz); wr(c, px, py);
  };
  body.add(mesh(loft(D.torso, torsoCol, 32, 22)));
  if (D.hump) body.add(mesh(loft(D.hump, (c, u, s) => c.copy(P.coat).multiplyScalar(1 - Math.max(0, s) * 0.1), 18, 16)));
  if (D.udder) { const u = mesh(vcol(new THREE.SphereGeometry(1, 12, 10), C(0xe8a8a0))); u.scale.set(0.16, 0.1, 0.13); u.position.set(D.udder[0], D.udder[1], 0); body.add(u); }
  // cổ + bờm + đầu
  const neck = new THREE.Group(); neck.rotation.order = "YZX"; neck.position.set(D.neckAt[0], D.neckAt[1], 0); neck.rotation.z = D.neckTilt; body.add(neck);
  const nk = D.neck;
  neck.add(mesh(loft(nk, (c, u, s, co, px, py, pz) => { c.copy(P.coat).lerp(P.belly, sst(0.1, -0.8, s) * (D.pronghorn ? 1 : 0.8)); if (D.pronghorn && u > 0.35 && u < 0.55 && s < 0) c.copy(P.belly); patch(c, px, py + 3, pz); wr(c, px, py); }, 16, 16)));
  if (D.mane) {   // bờm: dải lông sẫm dọc sống cổ
    const mk = []; for (let i = 0; i < nk.length; i++) { const a = nk[Math.max(0, i - 1)], b = nk[Math.min(nk.length - 1, i + 1)], tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty) || 1; mk.push([nk[i][0] - ty / l * nk[i][3] * 0.9, nk[i][1] + tx / l * nk[i][3] * 0.9, 0.03, 0.07]); }
    mk[mk.length - 1][3] = 0.1;
    neck.add(mesh(loft(mk, c => c.copy(P.point), 14, 10)));
  }
  if (D.ruff) neck.add(mesh(loft([[-0.06, -0.04, 0.13, 0.17], [0.06, 0.02, 0.14, 0.16], [0.14, 0.05, 0.11, 0.12]], (c, u, s) => c.copy(P.coat).lerp(P.belly, sst(0.2, -0.6, s)).multiplyScalar(1.05), 10, 16)));
  if (D.lionMane) neck.add(mesh(loft([[-0.14, -0.06, 0.2, 0.24], [-0.02, 0.04, 0.27, 0.31], [0.14, 0.1, 0.28, 0.3], [0.26, 0.12, 0.2, 0.22], [0.32, 0.12, 0.08, 0.08]], (c, u, s, co, px, py, pz) => { c.copy(P.point).lerp(P.coat, 0.25 + 0.3 * vn(py * 30 + pz * 20, px * 12)); }, 18, 20)));
  if (D.dewlap) neck.add(mesh(loft([[-0.02, -0.18, 0.05, 0.08], [0.14, -0.2, 0.05, 0.08], [0.28, -0.12, 0.03, 0.04]], (c, u, s, co, px, py, pz) => { c.copy(P.coat); patch(c, px, py + 3, pz); }, 10, 10)));
  const last = nk[nk.length - 1], head = new THREE.Group(); head.position.set(last[0], last[1], 0); neck.add(head);
  const hk = D.head;
  head.add(mesh(loft(hk, (c, u, s, co, px, py, pz) => {
    c.copy(P.coat).lerp(P.belly, sst(0.0, -0.8, s) * 0.8);
    if (u > 0.8) c.lerp(P.point, kind === "horse" ? 0.3 : D.muzzleLight ? 0 : 0.55);
    if (D.muzzleLight && u > 0.6 && s < 0.3) c.lerp(P.belly, 0.7);
    if (D.pronghorn && u > 0.72) c.copy(P.point);
    if (P.patches) { if (Math.abs(pz) < 0.05 && s > 0) c.copy(P.coat); else patch(c, px, py + 7, pz); }
    if (P.nose && u > 0.88) c.copy(P.nose);
    wr(c, px, py);
  }, 20, 16)));
  const eye = D.eye; for (const z of [-1, 1]) { const e = mesh(new THREE.SphereGeometry(0.018 * (kind === "horse" || kind === "cow" ? 1.4 : kind === "elephant" ? 2 : 1), 8, 6), dark); e.position.set(eye[0], eye[1], z * eye[2]); head.add(e); }
  if (D.nose) { const n = mesh(new THREE.SphereGeometry(1, 10, 8), dark); n.scale.set(0.02, 0.018, 0.024); const t = hk[hk.length - 2]; n.position.set(t[0] + 0.02, t[1] + 0.012, 0); head.add(n); }
  if (D.forelock) { const f = mesh(loft([[-0.02, 0.1, 0.03, 0.02], [0.06, 0.06, 0.035, 0.02], [0.12, 0.0, 0.01, 0.01]], c => c.copy(P.point), 8, 8)); head.add(f); }
  if (D.ears) for (const z of [-1, 1]) {
    const e = mesh(vcol(new THREE.ConeGeometry(D.ears.w, D.ears.len, 8), cc.copy(P.coat).lerp(P.point, 0.35))); e.geometry.translate(0, D.ears.len / 2, 0);
    e.scale.z = 0.55; e.position.set(D.ears.at[0], D.ears.at[1], z * (D.ears.sep ?? 0.05)); e.rotation.set(z * 0.25, 0, 0.35); head.add(e);
  }
  if (D.sideEars) for (const z of [-1, 1]) {   // tai bò chìa ngang
    const e = mesh(vcol(new THREE.SphereGeometry(1, 10, 8), cc.copy(P.patches ? P.point : P.coat))); e.scale.set(0.05, 0.03, 0.09); e.position.set(D.sideEars[0], D.sideEars[1], z * (D.sideEars[2] + 0.06)); e.rotation.x = z * 0.3; head.add(e);
  }
  if (D.flopEars) for (const z of [-1, 1]) {   // tai lợn cụp về trước
    const e = mesh(vcol(new THREE.ConeGeometry(0.07, 0.14, 8), cc.copy(P.coat))); e.scale.z = 0.35; e.position.set(D.flopEars[0] + 0.05, D.flopEars[1], z * D.flopEars[2]); e.rotation.set(z * 0.4, 0, -1.2); head.add(e);
  }
  if (D.roundEars) for (const z of [-1, 1]) { const e = mesh(new THREE.SphereGeometry(1, 10, 8), dark); e.scale.set(0.02, 0.04, 0.035); e.position.set(D.roundEars[0], D.roundEars[1], z * D.roundEars[2]); head.add(e); }
  if (D.horns) for (const z of [-1, 1]) {
    const cv = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.0, 0.07, 0), new THREE.Vector3(-0.02, 0.13, 0), new THREE.Vector3(-0.055, 0.16, 0)]);
    const h = mesh(new THREE.TubeGeometry(cv, 8, 0.012, 6), hornMat); h.position.set(0.02, 0.06, z * 0.035); head.add(h);
    const prong = mesh(new THREE.ConeGeometry(0.01, 0.04, 6), hornMat); prong.position.set(0.015, 0.1, z * 0.035); prong.rotation.z = -0.9; head.add(prong);
  }
  if (D.cowHorns) for (const z of [-1, 1]) {
    const cv = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0.02, z * 0.07), new THREE.Vector3(0.02, 0.08, z * 0.11)]);
    const hn = mesh(new THREE.TubeGeometry(cv, 8, 0.016, 6), hornMat); hn.position.set(0.0, 0.12, z * 0.08); head.add(hn);
  }
  if (D.snout) { const s = mesh(vcol(new THREE.CylinderGeometry(0.066, 0.07, 0.04, 16), C(0xd88a84))); s.rotation.z = Math.PI / 2; const t = hk[hk.length - 1]; s.position.set(t[0], t[1], 0); head.add(s);
    for (const z of [-1, 1]) { const n = mesh(new THREE.SphereGeometry(0.013, 6, 5), dark); n.position.set(t[0] + 0.02, t[1], z * 0.025); head.add(n); } }
  const extra = {};
  if (D.elephant) {
    // vòi: chuỗi đốt ống trơn thon dần, uốn cong được
    extra.trunk = []; let seg = new THREE.Group(); const t = hk[hk.length - 1]; seg.position.set(t[0] - 0.03, t[1] + 0.02, 0); head.add(seg);
    for (let i = 0; i < 8; i++) {
      const r0 = 0.15 - i * 0.013, L = 0.2;
      seg.add(mesh(loft([[0, 0.02, r0 * 1.02, r0], [0, -L / 2, r0 * 0.96, r0 * 0.95], [0, -L - 0.02, r0 * 0.9, r0 * 0.9]], (c, u, s, co, px, py) => { c.copy(P.coat).multiplyScalar(0.95 + 0.1 * Math.sin(py * 160)); }, 6, 12)));
      const nx = new THREE.Group(); nx.position.y = -L; seg.add(nx); seg.rotation.z = i === 0 ? -0.25 : 0.08; extra.trunk.push(seg); seg = nx;
    }
    extra.ears = [];
    for (const z of [-1, 1]) {
      const ep = new THREE.Group(); ep.position.set(0.0, 0.14, z * 0.47); ep.scale.setScalar(1.3); head.add(ep);
      const sh = new THREE.Shape(); sh.moveTo(0, 0.25); sh.bezierCurveTo(-0.5, 0.45, -0.75, 0.05, -0.55, -0.45); sh.bezierCurveTo(-0.4, -0.75, -0.1, -0.6, 0, -0.3); sh.lineTo(0, 0.25);
      const eg = vcol(new THREE.ShapeGeometry(sh, 16), P.coat.clone().multiplyScalar(0.95)); const em = mat.clone(); em.side = THREE.DoubleSide;
      const ear = mesh(eg, em); ep.add(ear); ep.rotation.y = z * 0.25; extra.ears.push(ep);
      const cv = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.14, -0.2, 0), new THREE.Vector3(0.34, -0.26, 0), new THREE.Vector3(0.5, -0.14, 0)]);
      const tusk = mesh(new THREE.TubeGeometry(cv, 10, 0.035, 8), new THREE.MeshStandardMaterial({ color: 0xf2ead8, roughness: 0.45 })); tusk.position.set(0.4, -0.34, z * 0.17); head.add(tusk);
    }
  }
  // đuôi
  const tail = new THREE.Group(); tail.position.set(D.tailAt[0], D.tailAt[1], 0); body.add(tail);
  if (D.curlTail) { const c = mesh(vcol(new THREE.TorusGeometry(0.05, 0.014, 6, 14, Math.PI * 1.7), P.coat)); c.rotation.y = Math.PI / 2; c.position.set(-0.03, 0.03, 0); tail.add(c); }
  else tail.add(mesh(loft(D.tail, (c, u) => { c.copy(D.tailDark ? P.point : P.coat); if (D.tailTip && u > 0.8) c.copy(P.point); if (D.pronghorn) c.copy(P.belly); }, 16, 12)));
  if (D.tuft) { const t = D.tail[D.tail.length - 2], s = mesh(new THREE.SphereGeometry(1, 10, 8), dark); s.scale.set(0.045, 0.08, 0.045); s.position.set(t[0], t[1], 0); tail.add(s); }
  tail.rotation.z = D.tailRest || 0;
  // chân: chuỗi khớp, mỗi đốt một ống trơn; phía dưới sẫm dần
  const legs = [];
  for (const [def, front] of [[D.front, 1], [D.hind, 0]]) for (const side of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(def.at[0], def.at[1], side * def.at[2]); body.add(hip);
    const joints = []; let parent = hip, drop = 0;
    const total = def.segs.reduce((a, s) => a + s[0], 0);
    def.segs.forEach(([L, keys0, rest], k) => {
      const keys = k ? keys0 : [[0, keys0[0][1] + 0.1 * (L / 0.45), keys0[0][2] * 0.9, keys0[0][3]], ...keys0];
      const j = new THREE.Group(); if (k) j.position.y = -def.segs[k - 1][0]; parent.add(j);
      const d0 = drop;
      const legCol = (c, u, s, co, px, py, pz) => {
        const f = (d0 - py) / total;   // 0 ở vai/hông → 1 ở móng
        c.copy(P.coat).lerp(P.belly, (1 - f) * sst(0.2, -0.9, co * (front ? 1 : -1)) * 0.2);
        if (D.darkLegs && f > D.darkLegs) c.lerp(P.point, sst(D.darkLegs, D.darkLegs + 0.1, f));
        if (!D.hoof && f > 0.9) c.multiplyScalar(0.9);
        if (D.pronghorn && k === 0) c.lerp(P.belly, 0.25);
        if (P.patches && f < 0.5) patch(c, px + side * 3, py - 2, pz);
        wr(c, px, py);
      };
      j.add(mesh(loft(keys, legCol, 12, 12)));
      if (k) { const kn = mesh(new THREE.SphereGeometry(keys[0][2] * 1.05, 10, 8)); const f = drop / total; cc.copy(P.coat); if (D.darkLegs && f > D.darkLegs) cc.copy(P.point); vcol(kn.geometry, cc); kn.scale.set(keys[0][3] / keys[0][2], 1, 1); j.add(kn); }
      if (D.hoof && k === def.segs.length - 1) { const hf = mesh(new THREE.CylinderGeometry(keys[2][2] * 0.95, keys[2][2] * 1.12, 0.05, 12), dark); hf.position.set(keys[2][0], keys[2][1] - 0.01, 0); hf.scale.x = keys[2][3] / keys[2][2]; j.add(hf); }
      j.rotation.z = rest; j.userData.rest = rest; joints.push(j); parent = j; drop += L;
    });
    legs.push({ joints, front, side });
  }
  g.traverse(o => { if (o.isMesh) o.receiveShadow = true; });
  g.scale.setScalar(D.sc * (0.92 + Math.random() * 0.12));
  const box = new THREE.Box3().setFromObject(g);
  return { g, body, neck, head, tail, legs, D, kind, extra, phase: Math.random(), t: 0, front: box.max.x, sway: Math.random() * 6 };
}

// kangaroo: thân dựng nghiêng, đùi sau to, bàn chân dài, tay nhỏ, đuôi to chống đất, tai dài
function buildRoo() {
  const D = REAL.kangaroo, coat = [C(0xb4764a), C(0x9a6a48), C(0xc08a5c)][Math.floor(Math.random() * 3)], belly = C(0xe6cfae), point = C(0x3a2a1c);
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 }), dark = new THREE.MeshStandardMaterial({ color: 0x14100c, roughness: 0.45 });
  const mesh = (geo, m = mat) => { const o = new THREE.Mesh(geo, m); o.castShadow = true; return o; };
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const col = (c, u, s) => c.copy(coat).lerp(belly, sst(0.1, -0.7, s));
  body.add(mesh(loft([[-0.16, 0.5, 0.02, 0.02], [-0.12, 0.54, 0.19, 0.2], [0.0, 0.68, 0.21, 0.24, 1.05], [0.1, 0.88, 0.17, 0.2], [0.16, 1.04, 0.12, 0.13], [0.19, 1.12, 0.07, 0.07]], (c, u, s) => c.copy(coat).lerp(belly, sst(-0.05, 0.6, -s)), 24, 18)));
  const neck = new THREE.Group(); neck.rotation.order = "YZX"; neck.position.set(0.19, 1.12, 0); body.add(neck);
  neck.add(mesh(loft([[-0.02, -0.04, 0.08, 0.09], [0.02, 0.06, 0.065, 0.07]], col, 8, 12)));
  const head = new THREE.Group(); head.position.set(0.03, 0.1, 0); neck.add(head);
  head.add(mesh(loft([[-0.05, 0.01, 0.06, 0.07], [0.04, 0.0, 0.07, 0.075], [0.14, -0.04, 0.05, 0.05], [0.2, -0.06, 0.03, 0.03], [0.22, -0.065, 0.01, 0.01]], (c, u, s) => { col(c, u, s); if (u > 0.85) c.lerp(point, 0.6); }, 16, 14)));
  for (const z of [-1, 1]) {
    const e = mesh(vcol(new THREE.ConeGeometry(0.035, 0.17, 8), coat)); e.geometry.translate(0, 0.085, 0); e.scale.z = 0.5; e.position.set(-0.02, 0.05, z * 0.04); e.rotation.set(z * 0.3, 0, 0.2); head.add(e);
    const ey = mesh(new THREE.SphereGeometry(0.014, 8, 6), dark); ey.position.set(0.06, 0.03, z * 0.05); head.add(ey);
    const arm = mesh(loft([[0, 0, 0.03, 0.03], [0.06, -0.12, 0.022, 0.022], [0.1, -0.2, 0.015, 0.015]], col, 8, 8)); arm.position.set(0.18, 0.92, z * 0.1); body.add(arm);
  }
  const tail = new THREE.Group(); tail.position.set(-0.12, 0.52, 0); body.add(tail);
  tail.add(mesh(loft([[0, 0, 0.1, 0.1], [-0.3, -0.18, 0.075, 0.07], [-0.62, -0.36, 0.05, 0.045], [-0.9, -0.46, 0.03, 0.028], [-1.0, -0.48, 0.01, 0.01]], col, 18, 12)));
  const legs = [];
  for (const side of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(-0.02, 0.42, side * 0.12); body.add(hip);
    const j0 = new THREE.Group(); hip.add(j0); j0.add(mesh(loft([[0, 0.14, 0.1, 0.14], [0, -0.1, 0.09, 0.12], [0, -0.3, 0.045, 0.05]], col, 10, 12)));
    const j1 = new THREE.Group(); j1.position.y = -0.3; j0.add(j1); j1.add(mesh(loft([[0, 0, 0.04, 0.045], [0, -0.38, 0.03, 0.03]], col, 8, 10)));
    const j2 = new THREE.Group(); j2.position.y = -0.38; j1.add(j2); j2.add(mesh(loft([[0, 0.02, 0.03, 0.03], [0, -0.3, 0.028, 0.02], [0, -0.36, 0.01, 0.01]], (c) => c.copy(point).lerp(coat, 0.4), 8, 8)));
    j0.userData.rest = 0.9; j1.userData.rest = -2.0; j2.userData.rest = 2.67;
    [j0, j1, j2].forEach(j => { j.rotation.z = j.userData.rest; });
    legs.push({ joints: [j0, j1, j2], front: 0, side });
  }
  g.traverse(o => { if (o.isMesh) o.receiveShadow = true; });
  g.scale.setScalar(D.sc * (0.9 + Math.random() * 0.15));
  return { g, body, neck, head, tail, legs, D, kind: "kangaroo", extra: {}, phase: Math.random(), t: 0, front: 0.5 * g.scale.x, sway: Math.random() * 6 };
}

// gà mái/gà trống: thân hình trứng, cánh ép, đuôi lông vũ xoè, mào + yếm đỏ, chân vàng 3 ngón
function buildHen() {
  const D = REAL.chicken;
  const pal = [[0xf4efe4, 0xd8cfbf], [0xa0522d, 0x5a2a12], [0x2b2622, 0x5a3a20], [0xe0a050, 0xa8642a]][Math.floor(Math.random() * 4)];
  const f1 = C(pal[0]), f2 = C(pal[1]);
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 });
  const red = new THREE.MeshStandardMaterial({ color: 0xc81e1e, roughness: 0.6 }), yellow = new THREE.MeshStandardMaterial({ color: 0xe8b23a, roughness: 0.6 }), dark = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 });
  const mesh = (geo, m = mat) => { const o = new THREE.Mesh(geo, m); o.castShadow = true; return o; };
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  body.add(mesh(loft([[-0.17, 0.4, 0.02, 0.02], [-0.13, 0.4, 0.09, 0.1], [-0.02, 0.37, 0.12, 0.13, 1.1], [0.08, 0.38, 0.11, 0.12], [0.13, 0.43, 0.07, 0.075], [0.15, 0.47, 0.04, 0.04]], (c, u, s) => c.copy(f1).lerp(f2, sst(0.2, 0.9, s) * 0.3), 20, 16)));
  for (const z of [-1, 1]) { const w = mesh(loft([[-0.12, 0.42, 0.02, 0.06], [0.0, 0.41, 0.03, 0.075], [0.08, 0.4, 0.02, 0.05]], c => c.copy(f2), 10, 10)); w.position.z = z * 0.1; body.add(w); }
  const tail = new THREE.Group(); tail.position.set(-0.14, 0.44, 0); body.add(tail);
  for (let i = 0; i < 6; i++) { const a = 0.5 + i * 0.18; const f = mesh(loft([[0, 0, 0.012, 0.03], [-0.08 * Math.cos(a), 0.12 * Math.sin(a) + 0.04, 0.01, 0.035], [-0.12 * Math.cos(a), 0.2 * Math.sin(a) + 0.02, 0.004, 0.01]], c => c.copy(i % 2 ? f2 : f1).multiplyScalar(0.9), 8, 8)); f.position.z = (i - 2.5) * 0.012; tail.add(f); }
  const neck = new THREE.Group(); neck.rotation.order = "YZX"; neck.position.set(0.14, 0.46, 0); body.add(neck);
  neck.add(mesh(loft([[-0.02, -0.02, 0.05, 0.06], [0.0, 0.08, 0.04, 0.045], [0.01, 0.13, 0.035, 0.04]], c => c.copy(f1), 8, 12)));
  const head = new THREE.Group(); head.position.set(0.01, 0.15, 0); neck.add(head);
  head.add(mesh(vcol(new THREE.SphereGeometry(0.05, 14, 10), f1)));
  const beak = mesh(new THREE.ConeGeometry(0.016, 0.05, 8), yellow); beak.rotation.z = -Math.PI / 2; beak.position.set(0.06, -0.01, 0); head.add(beak);
  for (let i = 0; i < 4; i++) { const cmb = mesh(new THREE.SphereGeometry(0.018, 8, 6), red); cmb.position.set(0.03 - i * 0.02, 0.05 - Math.abs(i - 1.5) * 0.006, 0); cmb.scale.set(0.8, 1.2, 0.5); head.add(cmb); }
  const wat = mesh(new THREE.SphereGeometry(0.016, 8, 6), red); wat.scale.set(0.7, 1.4, 0.5); wat.position.set(0.045, -0.045, 0); head.add(wat);
  for (const z of [-1, 1]) { const e = mesh(new THREE.SphereGeometry(0.008, 6, 4), dark); e.position.set(0.03, 0.012, z * 0.038); head.add(e); }
  const legs = [];
  for (const side of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(0.0, 0.32, side * 0.05); body.add(hip);
    const j0 = new THREE.Group(); hip.add(j0); j0.add(mesh(loft([[0, 0.04, 0.04, 0.05], [0, -0.1, 0.022, 0.025]], c => c.copy(f1).lerp(f2, 0.3), 8, 10)));
    const j1 = new THREE.Group(); j1.position.y = -0.1; j0.add(j1); j1.add(mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.14, 6).translate(0, -0.07, 0), yellow));
    const j2 = new THREE.Group(); j2.position.y = -0.14; j1.add(j2);
    for (const a of [-0.5, 0, 0.5]) { const toe = mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.06, 5), yellow); toe.rotation.set(a, 0, -Math.PI / 2); toe.position.set(0.028, -0.005, a * 0.03); j2.add(toe); }
    j0.userData.rest = 0.25; j1.userData.rest = -0.3; j2.userData.rest = 0.05; [j0, j1, j2].forEach(j => { j.rotation.z = j.userData.rest; });
    legs.push({ joints: [j0, j1, j2], front: 1, side });
  }
  g.scale.setScalar(D.sc * (0.9 + Math.random() * 0.15));
  return { g, body, neck, head, tail, legs, D, kind: "chicken", extra: {}, phase: Math.random(), t: 0, front: 0.2 * g.scale.x, sway: Math.random() * 6 };
}

// 1af: ĐẠI BÀNG CHẠY BỘ — thân nâu sẫm, đầu + cổ trắng, mỏ vàng khoằm, đuôi trắng xoè, "quần" lông nâu, cẳng vàng móng đen,
// 2 cánh xoè được (vỗ khi chạy). Dựng theo khung gà (chân 3 khớp, animHen) nhưng to như người.
function buildEagleRun() {
  const D = REAL.eagleRun;
  const brown = C(0x4a2e18), brown2 = C(0x6a4424), white = C(0xf4f1ea);
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 });
  const yellow = new THREE.MeshStandardMaterial({ color: 0xe8b020, roughness: 0.5 }), dark = new THREE.MeshStandardMaterial({ color: 0x151210, roughness: 0.4 });
  const mesh = (geo, m = mat) => { const o = new THREE.Mesh(geo, m); o.castShadow = true; return o; };
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  body.add(mesh(loft([[-0.2, 0.42, 0.02, 0.02], [-0.15, 0.42, 0.09, 0.1], [-0.02, 0.4, 0.12, 0.13, 1.1], [0.08, 0.42, 0.11, 0.12], [0.13, 0.47, 0.08, 0.08], [0.15, 0.51, 0.05, 0.05]], (c, u, s) => c.copy(brown).lerp(brown2, sst(-0.2, -0.9, s) * 0.5), 20, 16)));
  const wings = [];
  for (const z of [-1, 1]) {
    const piv = new THREE.Group(); piv.position.set(0.06, 0.48, z * 0.1); piv.userData.side = z; body.add(piv);
    const sh = new THREE.Shape(); sh.moveTo(0.02, 0); sh.bezierCurveTo(-0.1, 0.03, -0.3, 0.0, -0.42, -0.08); sh.lineTo(-0.36, -0.12); sh.lineTo(-0.4, -0.17); sh.lineTo(-0.3, -0.19); sh.lineTo(-0.3, -0.25); sh.bezierCurveTo(-0.15, -0.22, -0.02, -0.14, 0.02, 0);
    const wm = new THREE.MeshStandardMaterial({ color: 0x3e2614, roughness: 0.85, side: THREE.DoubleSide });
    const w = mesh(new THREE.ShapeGeometry(sh, 12), wm); w.scale.set(1.25, 1.6, 1); piv.add(w); wings.push(piv);
  }
  const tail = new THREE.Group(); tail.position.set(-0.17, 0.44, 0); body.add(tail);
  for (let i = 0; i < 7; i++) { const a = (i - 3) * 0.14; const f = mesh(loft([[0, 0, 0.012, 0.03], [-0.12, -0.03, 0.01, 0.035], [-0.2, -0.05, 0.004, 0.012]], c => c.copy(white).multiplyScalar(0.95), 8, 8)); f.rotation.y = a; tail.add(f); }
  const neck = new THREE.Group(); neck.rotation.order = "YZX"; neck.position.set(0.14, 0.5, 0); body.add(neck);
  neck.add(mesh(loft([[-0.03, -0.03, 0.06, 0.07], [0.0, 0.07, 0.05, 0.055], [0.01, 0.12, 0.045, 0.05]], c => c.copy(white), 8, 12)));
  const head = new THREE.Group(); head.position.set(0.02, 0.15, 0); neck.add(head);
  const hd = mesh(vcol(new THREE.SphereGeometry(0.062, 16, 12), white)); hd.scale.set(1.15, 0.95, 0.9); head.add(hd);
  const beak = mesh(new THREE.ConeGeometry(0.024, 0.08, 10), yellow); beak.rotation.z = -Math.PI / 2; beak.position.set(0.09, -0.005, 0); head.add(beak);
  const hook = mesh(new THREE.ConeGeometry(0.012, 0.035, 8), yellow); hook.rotation.z = Math.PI * 0.95; hook.position.set(0.125, -0.022, 0); head.add(hook);
  for (const z of [-1, 1]) {
    const e = mesh(new THREE.SphereGeometry(0.011, 8, 6), dark); e.position.set(0.045, 0.018, z * 0.045); head.add(e);
    const brow = mesh(new THREE.BoxGeometry(0.04, 0.008, 0.012), mat); vcol(brow.geometry, white.clone().multiplyScalar(0.85)); brow.position.set(0.048, 0.032, z * 0.047); brow.rotation.z = -0.35; head.add(brow);   // mày cau có
  }
  const legs = [];
  for (const side of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(0.0, 0.33, side * 0.06); body.add(hip);
    const j0 = new THREE.Group(); hip.add(j0); j0.add(mesh(loft([[0, 0.05, 0.05, 0.06], [0, -0.1, 0.035, 0.04]], c => c.copy(brown2), 8, 10)));   // "quần" lông
    const j1 = new THREE.Group(); j1.position.y = -0.1; j0.add(j1); j1.add(mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.14, 6).translate(0, -0.07, 0), yellow));
    const j2 = new THREE.Group(); j2.position.y = -0.14; j1.add(j2);
    for (const a of [-0.5, 0, 0.5]) { const toe = mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.06, 5), yellow); toe.rotation.set(a, 0, -Math.PI / 2); toe.position.set(0.028, -0.005, a * 0.03); j2.add(toe);
      const claw = mesh(new THREE.ConeGeometry(0.006, 0.02, 5), dark); claw.rotation.z = -Math.PI * 0.75; claw.position.set(0.062, -0.012, a * 0.03 + a * 0.03); j2.add(claw); }
    j0.userData.rest = 0.25; j1.userData.rest = -0.3; j2.userData.rest = 0.05; [j0, j1, j2].forEach(j => { j.rotation.z = j.userData.rest; });
    legs.push({ joints: [j0, j1, j2], front: 1, side });
  }
  g.traverse(o => { if (o.isMesh) o.receiveShadow = true; });
  g.scale.setScalar(D.sc * (0.95 + Math.random() * 0.1));
  return { g, body, neck, head, tail, legs, D, kind: "eagleRun", extra: { wings }, phase: Math.random(), t: 0, front: 0.24 * g.scale.x, sway: Math.random() * 6 };
}

// ------------------------------------------------------------ chuyển động
const TAU = Math.PI * 2;
const GAITS = {
  gallop: { h: [0, 0.1], f: [0.44, 0.54], ds: 0.36 }, rotary: { h: [0, 0.1], f: [0.58, 0.48], ds: 0.36 },
  trot: { h: [0, 0.5], f: [0.52, 0.02], ds: 0.45 }, walk: { h: [0, 0.5], f: [0.75, 0.25], ds: 0.62 },
};
const BIPED = { h: [0, 0.5], f: [0.5, 0], ds: 0.4 };   // 1af: chạy 2 chân như người
function legCycle(A, G, amp, foldK) {
  const ph = A.phase;
  for (const L of A.legs) {
    const p = (ph - (L.front ? G.f : G.h)[L.side > 0 ? 1 : 0] + 1) % 1, ds = G.ds;
    let hipA, fold;
    if (p < ds) { const u = p / ds; hipA = amp * (1 - 2 * u); fold = 0; }
    else { const u = (p - ds) / (1 - ds); hipA = -amp + 2 * amp * (0.5 - 0.5 * Math.cos(Math.PI * u)); fold = Math.sin(Math.PI * Math.min(1, u * 1.15)) * foldK; }
    const J = L.joints, r = j => J[j].userData.rest, st = p < ds ? Math.sin(Math.PI * p / ds) : 0;
    if (L.front) {
      J[0].rotation.z = r(0) + hipA * 0.85 + fold * 0.25;
      J[1].rotation.z = r(1) - fold * 1.7 + Math.max(0, -hipA) * 0.1;
      J[2].rotation.z = r(2) - fold * 0.7 + st * 0.3 * foldK;
    } else {
      J[0].rotation.z = r(0) + hipA * 0.75 - fold * 0.1;
      J[1].rotation.z = r(1) - fold * 0.45;
      J[2].rotation.z = r(2) + fold * 0.85;
      J[3].rotation.z = r(3) - fold * 0.6 + st * 0.25 * foldK;
    }
  }
}
function relaxLegs(A, dt) { const k = Math.min(1, dt * 6); for (const L of A.legs) for (const j of L.joints) j.rotation.z += (j.userData.rest - j.rotation.z) * k; }
// mode: "run" (tốc độ speed, đơn vị cảnh/giây) · "stand" (đứng ngắm, lookYaw = góc ngoái về phía tàu)
function animateReal(A, dt, mode, speed = 0, lookYaw = 0) {
  A.t += dt;
  const D = A.D, s = A.g.scale.x;
  if (D.special === "roo") return animRoo(A, dt, mode, speed, lookYaw);
  if (D.special === "hen" || D.special === "eagle") return animHen(A, dt, mode, speed, lookYaw);
  let bob = 0, pitch = 0, tailZ = D.tailRest || 0, neckZ = D.neckTilt, headZ = 0;
  if (mode === "run" && speed > 0.05) {
    const ratio = speed / (D.run * s / D.sc);
    let gait = D.noGallop ? "walk" : ratio < 0.2 ? "walk" : ratio < 0.5 ? "trot" : (D.rotary ? "rotary" : "gallop");
    const G = GAITS[gait];
    const stride = gait === "walk" ? D.ws : gait === "trot" ? D.ws * 1.7 : D.run / (D.freq * D.sc);
    const freq = Math.min(3.2, Math.max(gait === "walk" ? 0.6 : 1.3, speed / (stride * s)));
    A.phase = (A.phase + dt * freq) % 1;
    const ph = A.phase;
    if (gait === "walk") { legCycle(A, G, 0.3, 0.55); bob = 0.012 * Math.cos(TAU * 2 * ph); pitch = 0.015 * Math.sin(TAU * 2 * ph); headZ = 0.06 * Math.sin(TAU * 2 * ph + 1); }
    else if (gait === "trot") { legCycle(A, G, 0.4, 0.8); bob = 0.03 * Math.cos(TAU * 2 * ph); pitch = 0.02 * Math.sin(TAU * 2 * ph); headZ = 0.04 * Math.sin(TAU * 2 * ph); tailZ = (D.tailRest || 0) * 0.5 + D.tailLift * 0.4; }
    else {
      legCycle(A, G, D.amp * Math.min(1, 0.7 + ratio * 0.3), 1);
      bob = 0.05 * Math.cos(TAU * (ph - 0.75)) * (D.rotary ? 1.2 : 1); pitch = 0.07 * Math.sin(TAU * (ph + 0.15));
      if (D.flex) A.body.scale.x = 1 + D.flex * Math.sin(TAU * (ph - 0.3));
      neckZ = D.neckTilt - 0.1 * Math.sin(TAU * (ph + 0.1)); headZ = 0.08 * Math.sin(TAU * (ph + 0.35));
      tailZ = D.tailLift + 0.12 * Math.sin(TAU * ph * 2);
    }
    A.neck.rotation.y += (0 - A.neck.rotation.y) * Math.min(1, dt * 4);
  } else {
    relaxLegs(A, dt);
    if (D.flex) A.body.scale.x += (1 - A.body.scale.x) * Math.min(1, dt * 4);
    bob = 0.006 * Math.sin(A.t * 1.7 + A.sway);   // thở
    pitch = 0.01 * Math.sin(A.t * 0.6 + A.sway);
    A.neck.rotation.y += (Math.max(-0.8, Math.min(0.8, lookYaw)) - A.neck.rotation.y) * Math.min(1, dt * 2);
    headZ = 0.06 * Math.sin(A.t * 0.9 + A.sway) + (Math.sin(A.t * 0.37 + A.sway) > 0.85 ? -0.15 : 0);
    A.tail.rotation.y = 0.35 * Math.sin(A.t * 2.1 + A.sway) * (Math.sin(A.t * 0.5 + A.sway) > 0 ? 1 : 0.2);   // vẫy đuôi đuổi ruồi
  }
  A.body.position.set(0, bob, 0); A.body.rotation.z = pitch;
  const rear = A.rear || 0;
  if (rear > 0.001 && mode === "run") {
    // 1af: ĐỨNG DẬY CHẠY 2 CHÂN — thân xoay quanh HÔNG SAU (hông giữ nguyên chỗ), chân sau bù đúng góc thân ⇒ vẫn chạm đất;
    // nửa sau của cú đứng dậy đổi sang nhịp 2 chân (sau trái ↔ sau phải, tay = chân trước đánh ngược chân cùng bên)
    const th = rear * (D.rearMax ?? 1.12), hx = D.hind.at[0], hy = D.hind.at[1];
    const c = Math.cos(th), sn = Math.sin(th);
    if (rear > 0.5) legCycle(A, BIPED, 0.62, 0.95);
    A.body.rotation.z = pitch * 0.4 + th;
    A.body.position.set(hx - (hx * c - hy * sn), bob * 0.6 + hy - (hx * sn + hy * c), 0);
    for (const L of A.legs) L.joints[0].rotation.z -= L.front ? th * 0.55 : th;
    neckZ = D.neckTilt - th * 0.85 + 0.06 * Math.sin(TAU * 2 * A.phase);
    tailZ -= th * 0.45;
  }
  A.neck.rotation.z += (neckZ - A.neck.rotation.z) * Math.min(1, dt * 8);
  A.head.rotation.z = headZ;
  A.tail.rotation.z += (tailZ - A.tail.rotation.z) * Math.min(1, dt * 5);
  if (mode === "run") A.tail.rotation.y = 0.12 * Math.sin(TAU * A.phase);
  const ex = A.extra;
  if (ex.ears) ex.ears.forEach((e, i) => { e.rotation.y = (i ? 1 : -1) * (0.25 + Math.max(0, Math.sin(A.t * 2.2 + i)) * 0.45); });
  if (ex.trunk) ex.trunk.forEach((sg, i) => { sg.rotation.z = (i === 0 ? -0.25 : 0.08) + Math.sin(A.t * 1.3 - i * 0.55) * (mode === "stand" ? 0.1 : 0.05) + (mode === "stand" && i > 4 ? -0.12 : 0); });
}
function animRoo(A, dt, mode, speed, lookYaw) {
  const J = L => L.joints;
  if (mode === "run" && speed > 0.05) {
    const freq = Math.min(2.6, Math.max(1.4, speed / (1.6 * A.g.scale.x)));
    A.phase = (A.phase + dt * freq) % 1;
    const ph = A.phase, air = ph > 0.3, u = air ? (ph - 0.3) / 0.7 : 0, hop = air ? Math.sin(Math.PI * u) : 0;
    A.body.position.y = hop * 0.32; A.body.rotation.z = -0.25 - hop * 0.1;
    for (const L of A.legs) { const j = J(L); const ext = air ? Math.sin(Math.PI * Math.min(1, u * 1.6)) : Math.sin(Math.PI * ph / 0.3) * 0.4;
      j[0].rotation.z = j[0].userData.rest - ext * 0.9; j[1].rotation.z = j[1].userData.rest + ext * 1.1; j[2].rotation.z = j[2].userData.rest - ext * 0.5; }
    A.tail.rotation.z = 0.15 + hop * 0.35;
    A.neck.rotation.y += (0 - A.neck.rotation.y) * Math.min(1, dt * 4);
  } else {
    relaxLegs(A, dt); A.body.position.y = 0.005 * Math.sin(A.t * 1.6); A.body.rotation.z += (0.05 - A.body.rotation.z) * Math.min(1, dt * 4);
    A.tail.rotation.z += (0 - A.tail.rotation.z) * Math.min(1, dt * 4);
    A.neck.rotation.y += (Math.max(-0.9, Math.min(0.9, lookYaw)) - A.neck.rotation.y) * Math.min(1, dt * 2);
    A.head.rotation.z = 0.08 * Math.sin(A.t * 0.9 + A.sway);
  }
}
function animHen(A, dt, mode, speed, lookYaw) {
  if (mode === "run" && speed > 0.05) {
    const freq = Math.min(5, Math.max(2.5, speed / (0.25 * A.g.scale.x)));
    A.phase = (A.phase + dt * freq) % 1; const ph = A.phase;
    for (const L of A.legs) { const p = (ph + (L.side > 0 ? 0.5 : 0)) % 1, sw = p > 0.5, u = sw ? (p - 0.5) * 2 : p * 2, j = L.joints;
      const a = sw ? -0.5 + Math.sin(Math.PI * u / 2) * 1.0 : 0.5 - u; j[0].rotation.z = j[0].userData.rest + a * 0.7; j[1].rotation.z = j[1].userData.rest - (sw ? Math.sin(Math.PI * u) * 0.9 : 0); }
    A.body.position.y = 0.01 * Math.abs(Math.sin(TAU * ph)); A.body.rotation.z = 0.15;
    A.neck.rotation.z = -0.3 + 0.25 * Math.sin(TAU * ph * 2);   // gật đầu theo bước
    A.neck.rotation.y += (0 - A.neck.rotation.y) * Math.min(1, dt * 5);
    if (A.extra.wings) {   // 1af: đại bàng chạy bộ vừa chạy vừa vỗ cánh phành phạch, thân chúi về trước
      const fl = 0.5 + 0.5 * Math.sin(TAU * ph * 1.5);
      A.extra.wings.forEach(w => { w.rotation.x = w.userData.side * (0.35 + fl * 1.15); });
      A.body.rotation.z = -0.12; A.neck.rotation.z = -0.15 + 0.12 * Math.sin(TAU * ph * 2);
    }
  } else {
    relaxLegs(A, dt); A.body.rotation.z += (0 - A.body.rotation.z) * Math.min(1, dt * 4);
    // mổ thóc thỉnh thoảng, còn lại nghiêng đầu nhìn tàu
    const peck = Math.sin(A.t * 0.8 + A.sway) > 0.7 ? Math.max(0, Math.sin(A.t * 12)) : 0;
    A.neck.rotation.z = -0.1 - peck * 1.1 + 0.08 * Math.sin(A.t * 2.4);
    A.neck.rotation.y += (Math.max(-1, Math.min(1, lookYaw)) - A.neck.rotation.y) * Math.min(1, dt * 3);
  }
}

// 1ag: điểm (x, z) trên mặt đất có THẤY RÕ từ máy quay không: trong khung hình (lề `lim`) và đường ngắm tới thân con vật
// (cao 1,1 m) không bị mặt đất (đồi, đụn cát chữ) chắn
const _V = new THREE.Vector3();
function seen(cam, x, z, lim = 1) {
  if (!cam) return false;
  const y = groundHeight(x, z) + 1.1;
  _V.set(x, y, z).project(cam);
  if (!(_V.z < 1 && Math.abs(_V.x) < lim && Math.abs(_V.y) < lim)) return false;
  return clear(cam, x, z);
}
// không bị mặt đất / đoàn tàu che (không xét khung hình)
function clear(cam, x, z) {
  if (!cam) return true;
  const y = groundHeight(x, z) + 1.1;
  const c = cam.position, N = 24;
  for (let k = 2; k < N; k++) {
    const u = k / N, px = c.x + (x - c.x) * u, py = c.y + (y - c.y) * u, pz = c.z + (z - c.z) * u;
    if (groundHeight(px, pz) > py + 0.05) return false;
  }
  // đoàn tàu (nóc toa ~3,4 m ở z ≈ 0) cũng che: đường ngắm phải vượt qua nóc tàu (coi như bức tường cao 3,75 suốt bề ngang)
  if (c.z > 1.2 && z < -1.2) { const u0 = c.z / (c.z - z), yl = c.y + (y - c.y) * u0; if (yl < TRAIN_WALL) return false; }
  return true;
}
const TRAIN_WALL = 3.75;
// chỗ không bị che GẦN làn zp nhất (dò cả phía gần lẫn phía xa, trong z −30 … −170)
function nearestClear(cam, x, zp) {
  for (let d = 3; d <= 140; d += 3) for (const z of [zp - d, zp + d]) if (z <= -30 && z >= -170 && clear(cam, x, z)) return z;
  return null;
}

// ------------------------------------------------------------ con vật trên gò: từ sau gò chạy lên đỉnh ⇒ đứng ngắm tàu ⇒ quay đầu chạy về
let SID = 0;   // 1ah: số hiệu từng con cho tiếng chân lặp
export function createFarAnimals(scene, hillMat, hook = null) {
  const hillMap = hillMat.map.clone(); hillMap.repeat.set(7, 5); hillMap.needsUpdate = true;
  const rockKit = makeRockKit();
  const mounds = [];
  for (let i = 0; i < 4; i++) {
    const md = makeMound(400 + i * 17, hillMap, rockKit);
    md.g.position.set(-70 + i * 130, 0, MZ); scene.add(md.g); mounds.push(md);
  }
  // 1ag: CON RA XEM TÀU — tối đa 2 con; chạy từ xa (chỗ còn nhìn thấy) tới gần đứng ngắm; gặp cặp đuổi nhau thì hoảng chạy tránh
  let herd = null, t = 0, wait = 6 + Math.random() * 5, cam = null, lastCX = null, camVel = 0;   // camVel: máy quay đang lia theo tàu (m/s)
  function spawn(camX, kindWanted) {
    if (!cam) return false;
    const kind = kindWanted || HERD_KINDS[Math.floor(Math.random() * HERD_KINDS.length)], D = REAL[kind];
    const n = Math.min(2, D.herd[0] + Math.floor(Math.random() * (D.herd[1] - D.herd[0] + 1)));
    // chỗ đứng ngắm: GẦN NHẤT mà vẫn thấy rõ (không bị đồi / đụn cát / đoàn tàu che)
    let cx = null, zStop = null;
    // đón trước: máy quay lia theo tàu ⇒ chọn chỗ mà ~9 s nữa (lúc tới nơi đứng xem) vẫn ở giữa khung — thử trên khung hình dời trước
    const lead = camVel * 9, cp = cam.position.x;
    cam.position.x = cp + lead; cam.updateMatrixWorld();
    for (let k = 0; k < 16 && cx == null; k++) {
      const x = cam.position.x + (Math.random() * 2 - 1) * 30;
      for (let z = -30; z >= -100; z -= 3) if (seen(cam, x, z, 0.6)) { cx = x; zStop = z - Math.random() * 3; break; }
    }
    if (cx == null) { cam.position.x = cp; cam.updateMatrixWorld(); return false; }
    // chỗ xuất phát: XA NHẤT mà vẫn thấy rõ (đi dần lại gần từ z −105)
    let z0 = zStop - 12;
    for (let z = Math.min(-105, zStop - 30); z <= zStop - 12; z += 5) if (seen(cam, cx, z, 1.05)) { z0 = z; break; }
    cam.position.x = cp; cam.updateMatrixWorld();   // trả máy quay về chỗ thật
    const side = Math.random() < 0.5 ? 1 : -1, list = [];
    for (let i = 0; i < n; i++) {
      const A = buildReal(kind);
      A.x = cx + (i - (n - 1) / 2) * (kind === "chicken" ? 1.3 : kind === "elephant" ? 5.5 : 3.6) + (Math.random() - 0.5);
      A.z = z0 - i * 0.8 - Math.random(); A.z0 = A.z;
      A.stopZ = zStop + Math.random() * 1.5;
      A.delay = i * 0.5 + Math.random() * 0.4;
      A.yaw = -Math.PI / 2; A.g.rotation.order = "YZX"; A.g.rotation.y = A.yaw;
      A.watchYaw = -Math.PI / 2 + side * (0.75 + Math.random() * 0.5);
      A.watchT = 3.5 + Math.random() * 2.5; A.hs = D.hs * (0.9 + Math.random() * 0.2) * 1.4;   // chạy quãng dài hơn gò cũ
      A.st = "run"; A.tt = 0; A.g.visible = false;
      scene.add(A.g); list.push(A);
    }
    herd = { list };
    return true;
  }
  return {
    mounds,
    setCamera(c) { cam = c; },
    spawnNow(camX, kind) { if (herd) { herd.list.forEach(A => { if (!A.done) disposeAnimal(scene, A); }); herd = null; } return spawn(camX, kind); },
    get herd() { return herd; },
    // opts: { canSpawn(): bool, threats: [{x, z}] — con của cặp đang đuổi nhau }
    update(dt, camX, trainX, opts = {}) {
      if (lastCX != null && dt > 0) camVel += ((camX - lastCX) / dt - camVel) * Math.min(1, dt * 1.5);
      lastCX = camX;
      for (const m of mounds) if (m.g.position.x < camX - 260) m.g.position.x += 520;
      if (!herd) { t += dt; if (t > wait && (!opts.canSpawn || opts.canSpawn())) { if (spawn(camX)) t = 0; else t = wait - 2; } return; }
      const threats = opts.threats || [];
      for (const A of herd.list) {
        if (A.done) continue;
        A.tt += dt;
        if (A.tt < A.delay) continue;
        A.g.visible = true;
        // cặp đuổi nhau lao tới gần ⇒ hoảng, chạy tránh (không coi như không liên quan)
        if (A.st !== "flee" && A.st !== "leave") {
          let near = null, dmin = 16;
          for (const T of threats) { const d = Math.hypot(T.x - A.x, T.z - A.z); if (d < dmin) { dmin = d; near = T; } }
          if (near) { if (!herd.fled) { herd.fled = true; hook?.voice(A.kind, A.x, A.z); } A.st = "flee"; A.ft = 0; const fx = Math.sign(A.x - near.x) || 1, fz = -0.45; const l = Math.hypot(fx, fz); A.fdx = fx / l; A.fdz = fz / l; }   // né sang ngang + lùi xa (không lao về phía tàu — bị tàu che)
        }
        let want = A.yaw, speed = 0;
        if (A.st === "run") {
          want = -Math.PI / 2; speed = A.hs * Math.min(1, (A.stopZ - A.z) / 2.5 + 0.25);
          A.z += speed * dt;
          if (A.z >= A.stopZ - 0.05) { A.st = "watch"; A.t0 = A.tt; if (!herd.voiced && Math.random() < 0.75) { herd.voiced = true; hook?.voice(A.kind, A.x, A.z); } }
        } else if (A.st === "watch") {
          want = A.watchYaw;
          if (A.tt - A.t0 > A.watchT) A.st = "turn";
        } else if (A.st === "turn") {
          want = Math.PI / 2; speed = A.hs * 0.25; A.z -= speed * dt;
          if (Math.abs(Math.atan2(Math.sin(want - A.yaw), Math.cos(want - A.yaw))) < 0.35) A.st = "leave";
        } else if (A.st === "flee") {
          A.ft += dt; want = Math.atan2(-A.fdz, A.fdx); speed = A.hs * 1.5;
          A.x += A.fdx * speed * dt; A.z += A.fdz * speed * dt;
          if (A.ft > 2.6) A.st = "leave";
        } else if (A.st === "leave") {
          want = Math.PI / 2; speed = A.hs * 1.1; A.z -= speed * dt;
          if (A.z < A.z0 - 6 || (A.z < A.stopZ - 25 && !seen(cam, A.x, A.z, 1.1))) { A.done = true; disposeAnimal(scene, A); continue; }
        }
        let d = want - A.yaw; d = Math.atan2(Math.sin(d), Math.cos(d));
        A.yaw += d * Math.min(1, dt * (A.st === "turn" ? 2.2 : A.st === "flee" ? 5 : 3));
        const y = groundHeight(A.x, A.z), fx = Math.cos(A.yaw), fz = -Math.sin(A.yaw);
        const slope = (groundHeight(A.x + fx * 0.6, A.z + fz * 0.6) - groundHeight(A.x - fx * 0.6, A.z - fz * 0.6)) / 1.2;
        A.g.position.set(A.x, y, A.z); A.g.rotation.y = A.yaw; A.g.rotation.z = Math.atan(slope) * 0.85;
        let look = Math.atan2(A.g.position.z, trainX - A.g.position.x) - A.yaw; look = Math.atan2(Math.sin(look), Math.cos(look));
        animateReal(A, dt, A.st === "watch" ? "stand" : "run", speed, look);
        if (speed > 1.2) hook?.steps("w" + (A.sid ||= ++SID), A.kind, A.x, A.z, speed);   // 1ah: tiếng chân
      }
      if (herd.list.every(A => A.done)) { herd = null; t = 0; wait = 12 + Math.random() * 14; }
    },
  };
}

// ------------------------------------------------------------ con vật HÚC ĐỔ chữ Hollywood (dựng kiểu thật)
// Đồi đỡ chữ: chữ ở z ≈ -203, chân chữ y ≈ 17.
export function createSignCharger(scene, signs) {
  const CHARGERS = [["cow", 2.1], ["elephant", 1.9], ["horse", 1.9], ["camel", 1.9], ["lion", 2.0]];   // hệ số phóng thêm (xa + chữ to)
  let A = null, t = 0, wait = 14 + Math.random() * 10;
  const hillY = (sg, x, z) => Math.max(sg.userData.hillH(x - sg.position.x, z - sg.position.z), groundHeight(x, z));   // 1af: không chìm đất
  function spawn(camX) {
    const sg = signs.current(); if (!sg) return false;
    const glyphs = sg.userData.glyphs.map((m, i) => ({ m, i })).filter(o => !o.m.userData.down);
    if (!glyphs.length) return false;
    const wp = new THREE.Vector3();
    const vis = glyphs.filter(o => { o.m.getWorldPosition(wp); o.x = wp.x + (o.m.userData.w || 3) / 2; o.z = wp.z; return Math.abs(o.x - camX) < 45; });
    if (!vis.length) return false;
    const pick = vis[Math.floor(Math.random() * vis.length)];
    const [kind, k] = CHARGERS[Math.floor(Math.random() * CHARGERS.length)];
    A = buildReal(kind); A.g.scale.multiplyScalar(k); A.front *= k; A.g.rotation.order = "YZX";
    A.sg = sg; A.target = pick; A.x = pick.x; A.z = pick.z - 46; A.yaw = -Math.PI / 2;
    A.stopZ = pick.z - 0.4 - A.front; A.st = "charge"; A.tt = 0;
    scene.add(A.g);
    return true;
  }
  function dispose() { disposeAnimal(scene, A); A = null; }
  return {
    get active() { return A; },
    trigger(camX) { if (A) dispose(); return spawn(camX); },
    update(dt, camX, trainX, opts = {}) {
      if (!A) { t += dt; if (t > wait && (!opts.canSpawn || opts.canSpawn())) { if (spawn(camX)) t = 0; else t = wait - 3; } return; }
      if (!A.sg.parent) { dispose(); return; }
      A.tt += dt;
      const hs = A.D.hs * A.g.scale.x / A.D.sc;
      let mode = "run", speed = 0, want = -Math.PI / 2;
      if (A.st === "charge") {
        speed = hs * 1.8 * Math.min(1, A.tt / 1.2 + 0.3);   // lấy đà rồi lao
        A.z += speed * dt;
        if (A.z >= A.stopZ) { A.z = A.stopZ; A.st = "hit"; A.tt = 0; signs.knock(A.target.i); }
      } else if (A.st === "hit") {
        mode = A.tt > 0.6 ? "stand" : "run"; speed = 0; A.z -= Math.max(0, 0.6 - A.tt) * 2 * dt;   // bật lùi nhẹ sau cú húc
        if (A.tt > 2.6) { A.st = "turn"; A.tt = 0; }
      } else if (A.st === "turn") {
        want = Math.PI / 2; speed = hs * 0.3; A.z -= speed * dt;
        if (Math.abs(Math.atan2(Math.sin(want - A.yaw), Math.cos(want - A.yaw))) < 0.3) A.st = "leave";
      } else {
        want = Math.PI / 2; speed = hs * 1.3; A.z -= speed * dt;
        if (A.z < A.target.z - 50) { dispose(); t = 0; wait = 30 + Math.random() * 25; return; }
      }
      let d = want - A.yaw; d = Math.atan2(Math.sin(d), Math.cos(d));
      A.yaw += d * Math.min(1, dt * 2.4);
      const y = hillY(A.sg, A.x, A.z), fx = Math.cos(A.yaw), fz = -Math.sin(A.yaw);
      const slope = (hillY(A.sg, A.x + fx, A.z + fz) - hillY(A.sg, A.x - fx, A.z - fz)) / 2;
      A.g.position.set(A.x, y, A.z); A.g.rotation.y = A.yaw; A.g.rotation.z = Math.atan(slope) * 0.9;
      let look = Math.atan2(A.g.position.z, trainX - A.g.position.x) - A.yaw; look = Math.atan2(Math.sin(look), Math.cos(look));
      animateReal(A, dt, mode, speed, look);
      if (A.st === "charge") A.neck.rotation.z = A.D.neckTilt - 0.35;   // cúi đầu lao tới
    },
  };
}

const CHASE_PAIRS = [["pronghorn", "lioness"], ["horse", "lioness"], ["pronghorn", "wolf"], ["horse", "wolf"], ["horse", "horse"], ["cow", "wolf"], ["camel", "lion"]];   // [con chạy trốn, con đuổi]
const BIG = ["elephant", "cow", "camel", "horse"];
// 1af: cảnh đuổi nhau (dải xa z ≈ −118). 4 kiểu: cặp thường · cặp ĐỨNG DẬY chạy 2 chân · CHÓ đuổi VOI · ĐẠI BÀNG chạy bộ đuổi đàn thú to.
// Luật: con TRƯỚC luôn nhanh hơn (con đuổi chậm hơn 0,3 m/s ⇒ khoảng cách chỉ giãn) · khoảng hở mõm con sau ↔ đuôi con trước ≥ 2,5 m
// · các con đi cùng một đường lượn (con sau đi lại đúng vết con trước, trễ theo khoảng cách) · con đuổi lệch 1,3 về phía máy quay.
// Sinh ra và xoá đi đều NGOÀI khung hình của máy quay thật (setCamera).
export function createChase(scene, hook = null) {
  let C = null, t = 0, wait = 10 + Math.random() * 10, cam = null;
  const Z = -118, GAP = 2.5, SLOWER = 0.3;
  const V3 = new THREE.Vector3(), BOX = new THREE.Box3();
  const dustTex = (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d"), gr = x.createRadialGradient(32, 32, 2, 32, 32, 31); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.5, "rgba(255,255,255,.45)"); gr.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); return t; })();
  const puffs = [];
  function dust(x, y, z, s) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: dustTex, color: 0xd9b48c, transparent: true, depthWrite: false, opacity: 0.5, fog: true }));
    sp.position.set(x, y + 0.3 * s, z); scene.add(sp);
    puffs.push({ sp, t: 0, life: 1.1 + Math.random() * 0.8, s0: (0.7 + Math.random() * 0.5) * s, vx: (Math.random() - 0.5) * 1.2, vy: 0.4 + Math.random() * 0.6 });
  }
  // điểm (x, z) có lọt khung hình không (tính cả thân cao ~3 m, lề 12 %)
  function inView(x, z) {
    if (!cam) return false;
    const y0 = groundHeight(x, z);
    for (const dy of [0.2, 3]) { V3.set(x, y0 + dy, z).project(cam); if (V3.z < 1 && Math.abs(V3.x) < 1.12 && Math.abs(V3.y) < 1.12) return true; }
    return false;
  }
  // 1ag: đường chạy CHÉO từ xa (z0) về gần (z1) theo quãng đã chạy dọc x; lượn nhẹ ±1,5
  const laneAt = x => { const u = Math.min(1, Math.max(0, (x - C.xs) * C.dir / C.L)), e = u * u * (3 - 2 * u); return C.z0 + (C.z1 - C.z0) * e + Math.sin(x * 0.09) * 1.1 + Math.sin(x * 0.23) * 0.4; };
  function mk(kind) {
    const A = buildReal(kind); A.g.rotation.order = "YZX";
    BOX.setFromObject(A.g); A.nose = BOX.max.x; A.tailX = -BOX.min.x;   // mõm / đuôi tính từ gốc (đứng thẳng, nhìn +x)
    A.px = 0; A.pz = Z; A.dd = 0; A.rear = 0; scene.add(A.g); return A;
  }
  const maxRun = A => A.D.run * A.g.scale.x / A.D.sc;
  function spawn(camX, force) {   // force (bàn thử): "pair" | "rear" | "dog" | "eagle"
    const dir = Math.random() < 0.5 ? 1 : -1, roll = force === "dog" ? 0.1 : force === "eagle" ? 0.3 : force ? 0.9 : Math.random();
    let preys, chaser, type;
    if (roll < 0.2) { type = "dog"; preys = [mk("elephant")]; chaser = mk("dog"); }
    else if (roll < 0.42) {
      type = "eagle"; const n = 1;   // 1ag: tối đa 2 con đuổi nhau ⇒ đại bàng đuổi MỘT con thú to
      preys = Array.from({ length: n }, () => mk(BIG[Math.floor(Math.random() * BIG.length)])); chaser = mk("eagleRun");
    } else { const [pk, ck] = CHASE_PAIRS[Math.floor(Math.random() * CHASE_PAIRS.length)]; type = "pair"; preys = [mk(pk)]; chaser = mk(ck); }
    // tốc độ: theo con chậm nhất (voi chạy chậm, không trượt chân)
    const sp = Math.min(12.5, ...preys.map(maxRun), maxRun(chaser) * 1.1) * (0.85 + Math.random() * 0.1);
    // xếp hàng dọc theo hướng chạy: con đầu đàn ở 0, mỗi con sau cách con trước (đuôi trước + mõm sau + khoảng hở)
    const all = [...preys, chaser]; let off = 0;
    all.forEach((A, i) => {
      if (i > 0) { const P = all[i - 1]; off += P.tailX + A.nose + (A === chaser ? GAP + 1 + Math.random() * 2 : 1.2 + Math.random() * 1.5); }
      A.off = off; A.zo = A === chaser ? 1.3 : (i % 2 ? -1.6 : 0.4);   // con đuổi lệch về phía máy quay
    });
    // 1ag: chọn đường xa→gần mà 3 điểm giữa đường đều THẤY RÕ (không khuất sau đồi/đụn cát chữ)
    const cx0 = cam ? cam.position.x : camX;
    let z0 = -140, z1 = -95;   // dự phòng: làn xa (thường đã thấy qua nóc tàu)
    const pathOK = (a, b) => [0.3, 0.5, 0.7].every(u => seen(cam, cx0 + dir * (u - 0.5) * 40, a + (b - a) * (u * u * (3 - 2 * u)), 1));
    search: for (let k = 0; k < 6; k++) {
      const a = -150 + Math.random() * 30;
      for (let b = -34; b >= a + 20; b -= 4) if (pathOK(a, b)) { z0 = a; z1 = b; break search; }   // đầu gần: gần nhất còn thấy rõ
    }
    // chỗ xuất phát: NGOÀI khung hình (lùi xa dần tới khi cả đoàn khuất) — ở làn xa z0
    let start = 40;
    const inAny = s0 => all.some(A => inView(cx0 - dir * (s0 + A.off), z0 + A.zo));
    while (inAny(start) && start < 420) start += 10;
    C = { dir, type, preys, chaser, all, sp, xs: cx0 - dir * start, L: 2 * start, z0, z1, x0: cx0 - dir * start, t: 0, gapGrow: 0, rearAt: type === "pair" && (force === "rear" || (!force && Math.random() < 0.5)) ? 3 + Math.random() * 4 : Infinity };
    return true;
  }
  function kill() { for (const A of C.all) disposeAnimal(scene, A); C = null; }
  function place(A, x, z, ox, oz, dt, spd) {
    const dx = x - ox, dz = z - oz, yaw = Math.atan2(-dz, dx);
    const y = groundHeight(x, z), s = A.g.scale.x;
    const fx = Math.cos(yaw), fz = -Math.sin(yaw), slope = (groundHeight(x + fx * 1.5, z + fz * 1.5) - groundHeight(x - fx * 1.5, z - fz * 1.5)) / 3;
    A.g.position.set(x, y - 0.03, z); A.g.rotation.y = yaw; A.g.rotation.z = Math.atan(slope) * 0.8 * (1 - A.rear);
    animateReal(A, dt, "run", spd);
    A.dd += dt; if (A.dd > 0.07) { A.dd = 0; dust(x - fx * 0.9 * s, y, z - fz * 0.9 * s, s * (A.D.special === "eagle" ? 0.6 : 1)); }
  }
  return {
    setCamera(c) { cam = c; },
    trigger(camX, type) { if (C) kill(); return spawn(camX, type); },
    get active() { return C; },
    update(dt, camX, opts = {}) {
      for (let i = puffs.length - 1; i >= 0; i--) {
        const p = puffs[i]; p.t += dt; const k = p.t / p.life;
        p.sp.position.x += p.vx * dt; p.sp.position.y += p.vy * dt * (1 - k);
        p.sp.scale.setScalar(p.s0 * (1 + k * 2.2)); p.sp.material.opacity = 0.45 * (1 - k) * Math.min(1, p.t * 8);
        if (k >= 1) { scene.remove(p.sp); p.sp.material.dispose(); puffs.splice(i, 1); }
      }
      if (!C) { t += dt; if (t > wait && (!opts.canSpawn || opts.canSpawn())) { spawn(camX); t = 0; } return; }
      C.t += dt;
      const sp = C.sp * (1 + 0.05 * Math.sin(C.t * 0.9));
      C.x0 += C.dir * sp * dt;
      C.gapGrow += SLOWER * dt;                              // con đuổi chậm hơn ⇒ khoảng cách chỉ giãn ra
      // đứng dậy chạy 2 chân (cặp thường, ~50 %): cả hai cùng đứng trong 0,9 s
      const rTarget = C.t > C.rearAt ? 1 : 0;
      for (const A of C.all) {
        const ox = A.px, oz = A.pz;
        const back = A.off + (A === C.chaser ? C.gapGrow : 0);
        A.px = C.x0 - C.dir * back;
        // đi lại đúng vết con phía trước (đường theo x); chỗ đó bị đồi/đụn/đoàn tàu che thì lượn sang chỗ GẦN NHẤT còn thấy (dò lại mỗi 0,2 s)
        const zp = laneAt(A.px) + A.zo;
        A.ck = (A.ck || 0) - dt;
        if (A.ck <= 0 || A.zT == null) { A.ck = 0.2; A.zT = clear(cam, A.px, zp) ? zp : (nearestClear(cam, A.px, zp) ?? zp); }
        if (A.zS == null) A.zS = A.zT;
        A.zS += (A.zT - A.zS) * Math.min(1, dt * 2.2);
        A.pz = A.zS;
        if (C.type === "pair") A.rear += (rTarget - A.rear) * Math.min(1, dt / 0.35);
        const spd = A === C.chaser ? sp - SLOWER : sp;
        if (C.t > 0.05) { place(A, A.px, A.pz, ox, oz, dt, spd); hook?.steps("c" + (A.sid ||= ++SID), A.kind, A.px, A.pz, spd); } else { A.g.position.set(A.px, groundHeight(A.px, A.pz), A.pz); A.g.rotation.y = C.dir > 0 ? 0 : Math.PI; }
      }
      // 1ah: con đuổi gầm / sủa khi vừa lọt khung hình; con bị đuổi kêu hoảng sau đó 1,4 s
      if (C.heardAt == null && inView(C.chaser.px, C.chaser.pz)) { C.heardAt = C.t; hook?.voice(C.chaser.kind, C.chaser.px, C.chaser.pz); }
      if (C.heardAt != null && !C.preyHeard && C.t - C.heardAt > 1.4) { C.preyHeard = true; const P = C.preys[0]; hook?.voice(P.kind, P.px, P.pz); }
      // xoá khi cả đoàn đã chạy qua xa VÀ khuất khỏi khung hình (hoặc quá xa hẳn)
      const tail = C.x0 - C.dir * (C.chaser.off + C.gapGrow);
      const past = (tail - camX) * C.dir;
      if ((past > 60 && !C.all.some(A => inView(A.px, A.pz))) || past > 480) { kill(); wait = 18 + Math.random() * 20; }
    },
  };
}

// bàn thử: dựng/chạy một con bất kỳ
export { buildReal, animateReal, REAL };
