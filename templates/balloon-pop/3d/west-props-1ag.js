// ĐẠO CỤ MIỀN TÂY — bản 1ag (30/9/2026): chữ bị húc đổ NẰM YÊN (bỏ cảnh chữ tự bật dựng lại trước mắt người xem — thầy: "vô lý");
// chỉ dựng lại khi bảng chữ đã KHUẤT khỏi khung hình: restoreHidden(isVisible) do west-world-1ag gọi mỗi khung.
// Phụ kiện cảnh — bản 1ab (30/9/2026): chim + ĐẠI BÀNG dựng lại thật (mỏ khoằm, đuôi quạt, cánh 2 khớp có ngón lông, lượn + nghiêng khi cua).
// Phụ kiện cảnh — bản 1aa (29/9/2026): swapAhead — hết cảnh 2 bảng chữ đè nhau lúc intro.
// Phụ kiện cảnh — bản 1z (29/9/2026): chữ trên đụn cát còn 70 %.
// Phụ kiện cảnh — bản 1y (29/9/2026): cả hai bảng chữ trên đụn cát (thấp lại, dune-1y).
// Phụ kiện cảnh — bản 1x (29/9/2026): đồi Atacama như 1v; ANDREW CLASSES đứng trên ĐỤN CÁT cao của mặt đất (?nh=1: cả NO HOMEWORK); chữ đổ rồi tự dựng lại.
// Phụ kiện cảnh — bản 1u (29/9/2026): đồi Atacama biến thể 3 thấp 1/2, sẫm hơn; chữ hạ thấp; ANDREW CLASSES luôn trước, 2 dãy núi tách xa.
// Phụ kiện cảnh — bản 1t (29/9/2026): thầy chọn đồi Atacama bản 3 ⇒ 5 biến thể chi tiết hơn (?nui=0..4).
// Phụ kiện cảnh — bản 1s (29/9/2026): đồi chữ kiểu ATACAMA (sống đao đỏ, rãnh xói, muối trắng) — 4 bản ?nui=0..3.
// Phụ kiện cảnh — bản 1r (29/9/2026): 5 kiểu đồi chữ để duyệt (HILL_STYLES, ?nui=0..4); còn lại như 1q.
// Phụ kiện cảnh — bản 1q (29/9/2026): như 1l + showBoth()/dropExtra() (màn chờ hiện cả 2 bảng chữ), đàn chim ra sớm.
// Phụ kiện cảnh — bản 1l (29/9/2026): cây cỏ nhỏ trên đồi/gò xa NHỎ + THƯA + CHI TIẾT (búi cỏ lá kim, hoa dại, bụi cành thưa);
// bụi tiền cảnh vẽ lại kiểu cành thưa lá nhỏ (shrubTexture).
// Phụ kiện cảnh viễn tây — bản 1k (29/9/2026): đồi chữ MỀM lại (vòm + sóng đất thoải) phủ cỏ thật (farGrassKit: búi cỏ
// mảnh + bụi sa mạc, mọc thành vạt); cỏ BÔNG LAU (reedTexture) cho tiền/hậu cảnh.
// Phụ kiện cảnh viễn tây — bản 1j (29/9/2026): đồi đỡ chữ Hollywood làm lại NHỌN, gồ ghề, lởm chởm (nhiễu gờ sắc nhiều lớp),
// có đốm cây cỏ xanh lác đác; cỏ mảnh + nhiều lá hơn (loại mới "fine" — cỏ cao mảnh).
// Bản 1i: saguaro sần sùi, mỗi cây một khác (phình/thắt, cong, gốc hoá gỗ, sẹo, mắt gai);
// chữ Hollywood có thể bị con vật HÚC ĐỔ từng chữ (knock) — chữ đổ về phía trước, nảy nhẹ, bụi tung.
// Bản 1f: chữ Hollywood đặt CAO hơn 3,5 (đồi đỡ chữ cao theo) để con vật trên gò phía trước không che chữ.
// Bản 1e: chữ Hollywood nhỏ lại + cột chống chỉ nửa dưới, khuất sau chữ; đàn chim bay liền mạch.
// Lịch sử 1d:
// • cỏ thẻ cong nhiều loại (cỏ khô cao có bông, cỏ vàng xanh, cỏ lún phún) · đá sa thạch chi tiết (lưới mịn, vân lớp, khe tối)
// • xương rồng tai thỏ (opuntia) mọc NỐI NHAU từ gốc · saguaro cao, gân sâu, ngọn tròn
// • chữ kiểu HOLLYWOOD trên đồi xa ("ANDREW CLASSES", "NO HOMEWORK - NO FUN") lần lượt từng bảng
// • lạc đà thỉnh thoảng chạy ra xem đoàn tàu rồi chạy đi · đàn chim đuổi nhau, đôi khi có đại bàng rượt
import * as THREE from "../../rocket-race/vendor/three/three.module.min.js";
import { DUNE_Z, DUNE_H, DUNE_N, DUNES, DUNE } from "./dune-1z.js";
import { mergeGeometries, mergeVertices } from "../../rocket-race/vendor/three/addons/BufferGeometryUtils.js";
import { FontLoader } from "../../rocket-race/vendor/three/addons/FontLoader.js";
import { TextGeometry } from "../../rocket-race/vendor/three/addons/TextGeometry.js";
import { makeBunchKit, GRASS_STYLES } from "./bunchgrass-1n.js";

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
// pháp tuyến bằng 0 (tam giác suy biến: chữ 3D, cực mặt cầu bị ép dẹt) ⇒ GPU normalize(0) = NaN ⇒ bloom loang ĐEN CẢ MÀN.
// Thay mọi pháp tuyến hỏng bằng (0,1,0).
export function fixNormals(geo) {
  const n = geo.attributes.normal; if (!n) return geo;
  for (let i = 0; i < n.count; i++) { const x = n.getX(i), y = n.getY(i), z = n.getZ(i), l = x * x + y * y + z * z; if (!(l > 1e-8)) n.setXYZ(i, 0, 1, 0); }
  n.needsUpdate = true; return geo;
}
const N3 = makeNoise(71);
const n3 = (x, y, z) => N3(x + z * 0.71, y - z * 0.43) * 0.6 + N3(y * 1.3 + 5, z * 1.3 - x * 0.5) * 0.4;
function canvasTexture(w, h, draw, repeat = false) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// ============================================================ CỎ
// thẻ cắt chéo, mỗi thẻ có 3 đốt để uốn cong ra ngoài (trông có khối), pháp tuyến hướng lên
export function bentCards(n, w, h, bend) {
  const parts = [];
  for (let i = 0; i < n; i++) {
    const g = new THREE.PlaneGeometry(w, h, 2, 3); g.translate(0, h / 2, 0);
    const p = g.attributes.position;
    for (let k = 0; k < p.count; k++) { const y = p.getY(k) / h; p.setZ(k, p.getZ(k) + y * y * bend * (Math.abs(p.getX(k)) / (w / 2) * 0.5 + 0.5)); }
    g.rotateY(i * Math.PI / n + (i % 2) * 0.2);
    const nr = g.attributes.normal; for (let k = 0; k < nr.count; k++) nr.setXYZ(k, 0, 1, 0);
    parts.push(g);
  }
  return mergeGeometries(parts);
}
// kind: "tall" cỏ khô cao có bông · "tuft" cỏ vàng xanh búi dày · "stub" cỏ lún phún thấp
export function grassTexture(kind) {
  return canvasTexture(1024, 1024, (ctx, w, h) => {
    const r = mulberry(kind.length * 97 + 3);
    const fine = kind === "fine";
    const count = kind === "stub" ? 760 : kind === "tuft" ? 640 : fine ? 900 : 560;
    const pal = fine ? [[214, 196, 132], [190, 176, 112], [168, 170, 96], [232, 214, 160], [150, 150, 88]] : kind === "tuft" ? [[176, 176, 84], [150, 160, 70], [214, 196, 104], [128, 146, 62]]
      : kind === "stub" ? [[200, 176, 110], [178, 160, 96], [150, 140, 84], [222, 200, 140]]
        : [[226, 204, 140], [206, 182, 118], [238, 222, 168], [180, 162, 104]];
    for (let i = 0; i < count; i++) {
      const spread = kind === "stub" ? 0.8 : fine ? 0.1 : kind === "tall" ? 0.18 : 0.36;   // 1j: cỏ cao mọc TOẢ từ gốc (hình quạt), không thành tấm
      const x0 = w / 2 + (r() - 0.5) * w * spread;
      const len = h * (kind === "stub" ? 0.18 + r() * 0.35 : kind === "tuft" ? 0.4 + r() * 0.5 : fine ? 0.55 + r() * 0.44 : 0.5 + r() * 0.48);
      const lean = (r() - 0.5) * w * (fine ? 0.85 : kind === "tall" ? 0.7 : 0.45), wid = fine ? 1.1 + r() * 1.6 : (kind === "stub" ? 1.4 : 1.8) + r() * 2.2;   // 1j: lá mảnh hơn
      const c = pal[Math.floor(r() * pal.length)];
      const grd = ctx.createLinearGradient(0, h, 0, h - len);
      grd.addColorStop(0, `rgb(${c[0] * 0.45 | 0},${c[1] * 0.45 | 0},${c[2] * 0.4 | 0})`);
      grd.addColorStop(0.5, `rgb(${c[0] * 0.85 | 0},${c[1] * 0.85 | 0},${c[2] * 0.8 | 0})`);
      grd.addColorStop(1, `rgb(${Math.min(255, c[0] * 1.08) | 0},${Math.min(255, c[1] * 1.08) | 0},${c[2] | 0})`);
      ctx.strokeStyle = grd; ctx.lineCap = "round";
      // lá thon dần: vẽ 3 đoạn với bề dày giảm dần
      const pts = []; for (let k = 0; k <= 3; k++) { const t = k / 3; pts.push([x0 + lean * t * t * (0.7 + r() * 0.3) + (r() - 0.5) * 6, h - len * t]); }
      for (let k = 0; k < 3; k++) { ctx.lineWidth = wid * (1 - k * 0.3); ctx.beginPath(); ctx.moveTo(pts[k][0], pts[k][1]); ctx.lineTo(pts[k + 1][0], pts[k + 1][1]); ctx.stroke(); }
      if ((kind === "tall" && r() < 0.35) || (fine && r() < 0.2)) {   // bông cỏ
        const [tx, ty] = pts[3];
        for (let s = 0; s < 11; s++) { ctx.fillStyle = `rgba(${240},${226},${180},${0.9})`; ctx.beginPath(); ctx.ellipse(tx + (r() - 0.5) * 8, ty + s * 5, 2.2, 5, (r() - 0.5), 0, 7); ctx.fill(); }
      }
      if (kind === "tuft" && r() < 0.1) { const [tx, ty] = pts[3]; ctx.fillStyle = "rgb(236,200,70)"; ctx.beginPath(); ctx.arc(tx, ty, 5 + r() * 4, 0, 7); ctx.fill(); }
    }
  });
}

// ============================================================ 1l: CÂY CỎ NHỎ trên đồi/gò xa — nhỏ, thưa, lá mảnh, chi tiết
// Thầy (1k): "các dạng cây nhỏ như này không đẹp, quá dày và xấu ⇒ đẹp hơn, nhỏ hơn, chi tiết hơn".
// 3 loại thẻ vẽ độ phân giải cao: búi cỏ lá kim mảnh cong như đài phun (vài cọng trổ bông), cây hoa dại li ti
// (vàng/cam/tím), bụi sa mạc cành thưa lá nhỏ. Phủ bù ở xa nhẹ tay (không nhoè thành cục), rải thưa theo vạt.
function drawShrub(ctx, w, h, r, pal, flowers) {
  ctx.lineCap = "round";
  const twig = (x, y, a, L, wd, depth) => {
    const x2 = x + Math.cos(a) * L, y2 = y + Math.sin(a) * L;
    ctx.strokeStyle = `rgb(${86 + r() * 26 | 0},${66 + r() * 16 | 0},${48 + r() * 12 | 0})`; ctx.lineWidth = wd;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo((x + x2) / 2 + (r() - 0.5) * L * 0.3, (y + y2) / 2, x2, y2); ctx.stroke();
    if (depth > 0) for (let k = 0; k < 2 + (r() < 0.5 ? 1 : 0); k++) twig(x2, y2, a + (r() - 0.5) * 1.1, L * (0.55 + r() * 0.2), wd * 0.65, depth - 1);
    else for (let k = 0; k < 7; k++) {   // chùm lá nhỏ ở đầu cành
      const c = pal[Math.floor(r() * pal.length)], lx = x2 + (r() - 0.5) * 14, ly = y2 + (r() - 0.5) * 12;
      ctx.fillStyle = `rgb(${c[0] + (r() - 0.5) * 20 | 0},${c[1] + (r() - 0.5) * 20 | 0},${c[2] + (r() - 0.5) * 16 | 0})`;
      ctx.beginPath(); ctx.ellipse(lx, ly, 1.6 + r() * 2.2, 1 + r() * 1.3, r() * 3, 0, 7); ctx.fill();
      if (flowers && r() < 0.25) { ctx.fillStyle = flowers[Math.floor(r() * flowers.length)]; ctx.beginPath(); ctx.arc(lx, ly - 2, 1.8 + r() * 1.4, 0, 7); ctx.fill(); }
    }
  };
  for (let i = 0; i < 7; i++) twig(w / 2 + (r() - 0.5) * 20, h, -Math.PI / 2 + (r() - 0.5) * 1.5, h * (0.2 + r() * 0.12), 3 + r() * 2, 3);
}
// bụi tiền cảnh: cùng kiểu cành thưa lá nhỏ (thay vòm lá tròn như bắp cải)
export function shrubTexture(kind) {
  return canvasTexture(512, 512, (ctx, w, h) => {
    const r = mulberry(kind.length * 131 + 7);
    const pal = kind === "sage" ? [[130, 142, 112], [152, 162, 132], [112, 122, 96], [172, 178, 150]]
      : kind === "rabbit" ? [[128, 138, 76], [150, 152, 80], [110, 120, 64]] : [[84, 104, 54], [104, 124, 62], [70, 88, 44], [120, 136, 74]];
    drawShrub(ctx, w, h, r, pal, kind === "rabbit" ? ["rgb(232,196,72)", "rgb(240,208,90)", "rgb(214,170,52)"] : null);
  });
}
let FARKIT = null;
export function farGrassKit() {
  if (FARKIT) return FARKIT;
  const tuftTex = canvasTexture(512, 512, (ctx, w, h) => {
    const r = mulberry(5151);
    const pal = [[206, 186, 124], [188, 170, 108], [164, 158, 92], [140, 146, 80], [220, 204, 150], [124, 136, 72]];
    ctx.lineCap = "round";
    for (let i = 0; i < 30; i++) {   // lá kim mảnh, cong ra ngoài như đài phun
      const x0 = w / 2 + (r() - 0.5) * w * 0.08, len = h * (0.4 + r() * 0.55), lean = (r() - 0.5) * w * 0.95, c = pal[Math.floor(r() * pal.length)];
      const grd = ctx.createLinearGradient(0, h, 0, h - len);
      grd.addColorStop(0, `rgb(${c[0] * 0.45 | 0},${c[1] * 0.45 | 0},${c[2] * 0.4 | 0})`); grd.addColorStop(0.5, `rgb(${c[0] * 0.85 | 0},${c[1] * 0.85 | 0},${c[2] * 0.8 | 0})`); grd.addColorStop(1, `rgb(${c[0]},${c[1]},${c[2]})`);
      ctx.strokeStyle = grd; ctx.lineWidth = 2 + r() * 1.6;
      const ex = x0 + lean * 0.62, ey = h - len * (0.75 + r() * 0.25);
      ctx.beginPath(); ctx.moveTo(x0, h); ctx.quadraticCurveTo(x0 + lean * 0.12, h - len * 0.95, ex, ey); ctx.stroke();
      if (r() < 0.22) {   // cọng trổ bông: chuỗi hạt nhỏ ở ngọn
        for (let k = 0; k < 8; k++) { ctx.fillStyle = "rgba(236,220,178,0.85)"; ctx.beginPath(); ctx.ellipse(ex + (r() - 0.5) * 5, ey + k * 4, 1.6, 3.2, (r() - 0.5), 0, 7); ctx.fill(); }
      }
    }
  });
  const flowerTex = canvasTexture(256, 256, (ctx, w, h) => {
    const r = mulberry(7373), cols = ["rgb(246,196,52)", "rgb(238,132,48)", "rgb(186,120,196)", "rgb(250,232,120)"];
    ctx.lineCap = "round";
    for (let i = 0; i < 9; i++) {
      const x0 = w / 2 + (r() - 0.5) * 20, L = h * (0.35 + r() * 0.45), lean = (r() - 0.5) * w * 0.6, ex = x0 + lean, ey = h - L;
      ctx.strokeStyle = "rgb(104,128,64)"; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x0, h); ctx.quadraticCurveTo(x0 + lean * 0.2, h - L * 0.6, ex, ey); ctx.stroke();
      ctx.fillStyle = "rgb(120,146,70)"; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse(x0 + lean * (0.2 + k * 0.2), h - L * (0.25 + k * 0.2), 4, 1.6, 0.6 * (k % 2 ? 1 : -1), 0, 7); ctx.fill(); }
      const c = cols[Math.floor(r() * cols.length)];
      for (let k = 0; k < 5; k++) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(ex + Math.cos(k * 1.26) * 3.4, ey + Math.sin(k * 1.26) * 3.4, 2.6, 0, 7); ctx.fill(); }
      ctx.fillStyle = "rgb(120,80,30)"; ctx.beginPath(); ctx.arc(ex, ey, 1.8, 0, 7); ctx.fill();
    }
  });
  const shrubTex = canvasTexture(512, 512, (ctx, w, h) => drawShrub(ctx, w, h, mulberry(6262), [[96, 110, 58], [118, 128, 70], [80, 94, 50], [140, 146, 90]], null));
  const mk = (map, glow, size) => {
    const m = new THREE.MeshStandardMaterial({ map, alphaTest: 0.35, alphaToCoverage: true, side: THREE.DoubleSide, roughness: 1,
      emissive: new THREE.Color(glow, glow * 0.88, glow * 0.66), emissiveMap: map });
    m.onBeforeCompile = sh => {   // xa: bù độ phủ nhẹ tay (lá mảnh không mất, cũng không nhoè thành cục)
      sh.fragmentShader = sh.fragmentShader.replace("#include <alphatest_fragment>", `
        #ifdef USE_MAP
          vec2 tsz = vMapUv * ${size}.;
          float mipK = max(0., log2(max(length(dFdx(tsz)), length(dFdy(tsz)))));
          diffuseColor.a *= 1. + mipK * 0.14;
        #endif
        diffuseColor.a = clamp((diffuseColor.a - 0.42) / max(fwidth(diffuseColor.a), 0.0001) + 0.5, 0., 1.);
        if (diffuseColor.a < 0.02) discard;`);
    };
    m.customProgramCacheKey = () => "farcard" + size;
    return m;
  };
  const cards = (n, wd, ht) => { const parts = []; for (let i = 0; i < n; i++) { const g = new THREE.PlaneGeometry(wd, ht); g.translate(0, ht / 2, 0); g.rotateY(i * Math.PI / n + 0.3); const nr = g.attributes.normal; for (let k = 0; k < nr.count; k++) nr.setXYZ(k, 0, 1, 0); parts.push(g); } return mergeGeometries(parts); };
  // mặt đất đồi: đất cát + vô số sợi cỏ khô li ti (lặp dày) ⇒ gần/xa đều thấy vân cỏ, không bệt màu
  const groundTex = canvasTexture(512, 512, (ctx, w, h) => {
    const Nn = makeNoise(88), r = mulberry(88), img = ctx.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const n = Nn(x / 60, y / 60) * 0.5 + Nn(x / 14, y / 14) * 0.3 + (r() - 0.5) * 0.25, i = (y * w + x) * 4;
      img.data[i] = 214 + n * 50; img.data[i + 1] = 172 + n * 44; img.data[i + 2] = 124 + n * 36; img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    ctx.lineCap = "round";
    for (let i = 0; i < 6400; i++) {
      const x = r() * w, y = r() * h, L = 2 + r() * 5, a = -Math.PI / 2 + (r() - 0.5) * 1.4, t = r();
      ctx.strokeStyle = t < 0.45 ? `rgba(${170 + r() * 50 | 0},${150 + r() * 40 | 0},${84 + r() * 30 | 0},.75)` : t < 0.8 ? `rgba(${118 + r() * 30 | 0},${124 + r() * 26 | 0},${64 + r() * 20 | 0},.7)` : `rgba(${96 + r() * 20 | 0},${76 + r() * 16 | 0},${56 + r() * 12 | 0},.55)`;
      ctx.lineWidth = 0.6 + r() * 0.7; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); ctx.stroke();
    }
  }, true);
  return (FARKIT = { tuftGeo: cards(3, 1.25, 1.0), flowerGeo: cards(2, 0.9, 0.8), shrubGeo: cards(3, 1.0, 0.85), tuftMat: mk(tuftTex, 0.16, 512), flowerMat: mk(flowerTex, 0.14, 256), shrubMat: mk(shrubTex, 0.1, 512), groundTex });
}
// rải cỏ + hoa + bụi lên một địa hình h(lx,lz): mọc thành vạt theo nhiễu `patch` (0..1), tránh vùng `skip`
export function scatterFarGrass(group, h, { n = 2000, ns = 60, nf = 200, rx, rz, cz = 0, inside, skip = () => false, patch, s0 = 0.3, s1 = 0.65, seed = 1 }) {
  const K = farGrassKit(), r = mulberry(seed), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), s3 = new THREE.Vector3(), e = new THREE.Euler(), c = new THREE.Color();
  const put = (geo, mat, count, sa, sb, colFn) => {
    if (!count) return;
    const inst = new THREE.InstancedMesh(geo, mat, count); let k = 0, guard = 0;
    while (k < count && guard++ < count * 14) {
      const lx = (r() - 0.5) * 2 * rx, lz = cz + (r() - 0.5) * 2 * rz;
      if (!inside(lx, lz) || skip(lx, lz)) continue;
      const p = patch(lx, lz); if (r() > p) continue;
      const s = (sa + r() * (sb - sa)) * (0.75 + p * 0.35);
      m4.compose(v.set(lx, h(lx, lz) - 0.05 * s, lz), q.setFromEuler(e.set((r() - 0.5) * 0.16, r() * 6, (r() - 0.5) * 0.16)), s3.set(s * (0.85 + r() * 0.4), s * (0.75 + r() * 0.5), s));
      inst.setMatrixAt(k, m4); inst.setColorAt(k, colFn(c)); k++;
    }
    inst.count = k; inst.receiveShadow = true; group.add(inst); return inst;
  };
  put(K.tuftGeo, K.tuftMat, n, s0, s1, c => c.setRGB(1, 1, 1).offsetHSL((r() - 0.5) * 0.04, 0, (r() - 0.5) * 0.12));
  put(K.flowerGeo, K.flowerMat, nf, s0 * 0.7, s1 * 0.8, c => c.setRGB(1, 1, 1).offsetHSL(0, 0, (r() - 0.5) * 0.1));
  put(K.shrubGeo, K.shrubMat, ns, s0 * 1.5, s1 * 1.7, c => c.setRGB(1, 1, 1).offsetHSL((r() - 0.5) * 0.05, 0, (r() - 0.5) * 0.14));
}

// ============================================================ 1k: CỎ BÔNG LAU (tiền/hậu cảnh)
// Thầy gửi ảnh cỏ lau: thân mảnh cao, bông lông tơ mềm rủ nghiêng, màu kem vàng óng khi ngược nắng. Nhỏ, nhẹ, thưa.
export function reedTexture(seed = 1) {
  return canvasTexture(512, 1024, (ctx, w, h) => {
    const r = mulberry(4040 + seed * 31);
    ctx.lineCap = "round";
    // lá gốc dài, mảnh, cong rủ
    for (let i = 0; i < 7; i++) {
      const x0 = w / 2 + (r() - 0.5) * 30, L = h * (0.18 + r() * 0.2), lean = (r() - 0.5) * w * 0.7;
      const g = ctx.createLinearGradient(0, h, 0, h - L); g.addColorStop(0, "rgb(92,80,50)"); g.addColorStop(1, "rgb(190,170,112)");
      ctx.strokeStyle = g; ctx.lineWidth = 4 + r() * 2;
      ctx.beginPath(); ctx.moveTo(x0, h); ctx.quadraticCurveTo(x0 + lean * 0.3, h - L * 0.95, x0 + lean, h - L * 0.72); ctx.stroke();
    }
    const stems = 3 + Math.floor(r() * 3);
    for (let s = 0; s < stems; s++) {
      const x0 = w / 2 + (r() - 0.5) * 40, ty = h * (0.3 + r() * 0.2), tx = x0 + (r() - 0.5) * w * 0.36;
      const cx = x0 + (tx - x0) * 0.25, cy = h - (h - ty) * 0.55;
      // thân: vẽ 3 đoạn thon dần (đủ dày để còn thấy ở xa)
      const g = ctx.createLinearGradient(0, h, 0, ty); g.addColorStop(0, "rgb(104,86,56)"); g.addColorStop(0.6, "rgb(196,166,108)"); g.addColorStop(1, "rgb(232,206,150)");
      ctx.strokeStyle = g;
      const Q = t => [(1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * tx, (1 - t) * (1 - t) * h + 2 * (1 - t) * t * cy + t * t * ty];
      for (let k = 0; k < 6; k++) { const [ax, ay] = Q(k / 6), [bx, by] = Q((k + 1) / 6); ctx.lineWidth = 6 - k * 0.6; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); }
      // bông: trục cong nghiêng rủ về một phía; lông tơ mọc xiên dọc trục như chiếc lông vũ
      const [px0, py0] = Q(0.97), ux0 = tx - px0, uy0 = ty - py0, ul = Math.hypot(ux0, uy0), ux = ux0 / ul, uy = uy0 / ul;
      const side = tx >= x0 ? 1 : -1, PL = h * (0.2 + r() * 0.1), droop = side * PL * (0.35 + r() * 0.4);
      const A = t => [tx + ux * PL * t * 0.8 + droop * t * t, ty + uy * PL * t * 0.8 + PL * 0.45 * t * t];
      ctx.strokeStyle = "rgb(214,190,146)"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(tx, ty); for (let k = 1; k <= 10; k++) { const [x, y] = A(k / 10); ctx.lineTo(x, y); } ctx.stroke();
      for (let k = 0; k < 900; k++) {
        const t = Math.pow(r(), 0.85), [px, py] = A(t), [qx, qy] = A(Math.min(1, t + 0.02));
        let dx = qx - px, dy = qy - py; const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
        const sgn = r() < 0.5 ? -1 : 1, ang = sgn * (0.2 + r() * 0.5), ca = Math.cos(ang), sa = Math.sin(ang);
        const fx = dx * ca - dy * sa, fy = dx * sa + dy * ca, L = (14 + r() * 34) * (1 - t * 0.5) * (0.6 + 0.4 * Math.sin(Math.PI * Math.min(1, t * 1.3 + 0.1)));
        const lum = r();
        ctx.strokeStyle = `rgba(${248 - lum * 22 | 0},${232 - lum * 30 | 0},${204 - lum * 44 | 0},${0.75 + r() * 0.25})`;
        ctx.lineWidth = 1.3 + r() * 1.2;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo(px + fx * L * 0.5, py + fy * L * 0.5 + 2, px + fx * L, py + fy * L + L * 0.18); ctx.stroke();
      }
    }
  });
}

// ============================================================ ĐÁ SA THẠCH
export function makeRockKit() {
  const protos = [];
  for (let s = 0; s < 4; s++) {
    const g = new THREE.IcosahedronGeometry(1, 5), p = g.attributes.position, col = new Float32Array(p.count * 3);
    const cBase = new THREE.Color(0xb86d3e), cLight = new THREE.Color(0xd9a06d), cDark = new THREE.Color(0x6e3a20), cTop = new THREE.Color(0xd8b08a), c = new THREE.Color();
    const sx = 1 + s * 0.25, ph = s * 3.7;
    for (let i = 0; i < p.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(p, i);
      const big = n3(v.x * 0.9 + ph, v.y * 0.9, v.z * 0.9) * 0.34, mid = n3(v.x * 2.6, v.y * 2.6 + ph, v.z * 2.6) * 0.1, fine = n3(v.x * 7, v.y * 7, v.z * 7 + ph) * 0.035;
      // lớp đá nằm ngang: bậc nhẹ theo độ cao
      const d = 1 + big + mid + fine;
      v.multiplyScalar(d);
      v.y = Math.round(v.y * 5) / 5 * 0.25 + v.y * 0.75;
      if (v.y < -0.35) v.y = -0.35 + (v.y + 0.35) * 0.15;   // đáy phẳng, nằm trên đất
      v.x *= sx; v.y *= 0.62;
      p.setXYZ(i, v.x, v.y, v.z);
      const band = 0.5 + 0.5 * Math.sin(v.y * 22 + N3(v.x * 2, v.z * 2) * 2);
      c.copy(cBase).lerp(cLight, band * 0.55).lerp(cDark, Math.max(0, -(big + mid) * 2.2)).lerp(cTop, Math.max(0, v.y) * 0.5);
      c.multiplyScalar(0.92 + (Math.random() - 0.5) * 0.12);
      col.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
    protos.push(g);
  }
  const pebble = new THREE.IcosahedronGeometry(1, 1);
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.93 });
  return { protos, pebble, mat };
}

// ============================================================ XƯƠNG RỒNG
export function makeCactusKit() {
  const sagMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82 });
  const padMat = new THREE.MeshStandardMaterial({ map: padTexture(), roughness: 0.62 });
  const fruitMat = new THREE.MeshStandardMaterial({ color: 0xb02a4a, roughness: 0.45 });
  const flowerMat = new THREE.MeshStandardMaterial({ color: 0xf2cf3a, roughness: 0.5, emissive: 0x3a2a00 });
  // gân dọc + màu: rãnh tối, sống gân sáng (gai), gốc sẫm, ngọn sáng
  function ribbed(geo, ribs, radial, depth, yMin, yMax) {
    const p = geo.attributes.position, n = geo.attributes.normal, col = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      const j = i % (radial + 1), a = j / radial * Math.PI * 2, rib = Math.cos(a * ribs);
      const d = (rib > 0 ? rib : rib * 0.6) * depth;
      p.setXYZ(i, p.getX(i) + n.getX(i) * d, p.getY(i) + n.getY(i) * d, p.getZ(i) + n.getZ(i) * d);
      const t = Math.min(1, Math.max(0, (p.getY(i) - yMin) / (yMax - yMin)));
      const ridge = Math.pow(rib * 0.5 + 0.5, 3);
      const base = [0.30 + 0.07 * t, 0.42 + 0.08 * t, 0.22 + 0.05 * t];
      const k = 0.55 + 0.45 * (rib * 0.5 + 0.5);
      col.set([base[0] * k + ridge * 0.16, base[1] * k + ridge * 0.14, base[2] * k + ridge * 0.08], i * 3);
    }
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals();
    return geo.index ? geo.toNonIndexed() : geo;
  }
  // 1i: SAGUARO sần sùi, mỗi cây một khác — thân phình/thắt theo mùa lớn, nghiêng/cong nhẹ, gân sâu có mắt gai nổi,
  // gốc hoá gỗ nâu xám, sẹo/vết cháy nắng, màu xanh mỗi cây một sắc; cành to nhỏ, chĩa lên/rủ xuống khác nhau.
  function saguaro(x, z, h, r) {
    const R = h * (0.058 + r() * 0.028), parts = [];
    const lean = (r() - 0.5) * 0.14 * h, leanZ = (r() - 0.5) * 0.1 * h, ph1 = r() * 6, ph2 = r() * 6, bulge = 0.04 + r() * 0.08, taper = 0.08 + r() * 0.12;
    const ribs = 12 + Math.floor(r() * 6), twist = (r() - 0.5) * 0.5;
    const rOf = t => R * (1.05 - taper * t) * (1 + bulge * Math.sin(t * 8 + ph1) + 0.035 * Math.sin(t * 21 + ph2)) * (t > 0.93 ? Math.sqrt(Math.max(0.02, 1 - Math.pow((t - 0.93) / 0.07, 2) * 0.85)) : 1);
    const axis = t => [lean * t * t, leanZ * t * t];
    // thân: ống đơn vị → gân + phình + cong + chóp tròn liền
    const RAD = 40, HS = 80;
    const trunk = new THREE.CylinderGeometry(1, 1, 1, RAD, HS, false); trunk.translate(0, 0.5, 0);
    const tp = trunk.attributes.position;
    for (let i = 0; i < tp.count; i++) {
      const lx = tp.getX(i), ly = tp.getY(i), lz = tp.getZ(i), a = Math.atan2(lz, lx), rr0 = Math.hypot(lx, lz);
      let t = ly, rad = rOf(t) * (rr0 > 0.5 ? 1 : 0);
      if (ly > 0.999 && rr0 < 0.5) { t = 1; rad = 0; }
      const rib = Math.cos(a * ribs + twist * t * 6), d = (rib > 0 ? rib : rib * 0.55);
      rad *= 1 + 0.13 * d;
      const [ax, az] = axis(Math.min(t, 1));
      tp.setXYZ(i, ax + Math.cos(a) * rad, Math.min(t, 1) * h + (ly > 0.999 && rr0 < 0.5 ? R * 0.55 : 0), az + Math.sin(a) * rad);
    }
    parts.push(trunk.index ? trunk.toNonIndexed() : trunk);
    // cành: số lượng/độ cao/chiều cong khác nhau (có cành rủ xuống rồi mới vểnh lên)
    const arms = r() < 0.12 ? 0 : 1 + Math.floor(r() * (h > 11 ? 5 : 3.5));
    for (let i = 0; i < arms; i++) {
      const ang = i * (Math.PI * 2 / arms) + r() * 1.1, tA = 0.32 + r() * 0.36, ay = h * tA;
      const [bx, bz] = axis(tA), rr = R * (0.5 + r() * 0.28), out = R * (1.7 + r() * 1.5), up = h * (0.12 + r() * 0.3), droop = r() < 0.25 ? R * (0.8 + r()) : 0;
      const dir = new THREE.Vector3(Math.cos(ang), 0, Math.sin(ang)), o = new THREE.Vector3(bx, 0, bz);
      const pts = [o.clone().setY(ay), o.clone().addScaledVector(dir, out * 0.5).setY(ay - rr * 0.2 - droop), o.clone().addScaledVector(dir, out * 0.95).setY(ay + out * 0.25 - droop * 0.6),
        o.clone().addScaledVector(dir, out * (1 + r() * 0.15)).setY(ay + out * 0.7 + up * 0.5), o.clone().addScaledVector(dir, out * (1 + r() * 0.2)).setY(ay + out * 0.7 + up)];
      const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, rr, 24, false);
      parts.push(ribbed(tube, 10 + Math.floor(r() * 3), 24, rr * 0.13, 0, h));
      const cap = new THREE.SphereGeometry(rr, 24, 8, 0, Math.PI * 2, 0, Math.PI / 2); cap.scale(1, 0.75, 1); cap.translate(pts[4].x, pts[4].y, pts[4].z);
      parts.push(ribbed(cap, 11, 24, rr * 0.1, 0, h));
    }
    let geo = mergeGeometries(parts.map(g => { const q = g.index ? g.toNonIndexed() : g; if (!q.attributes.color) q.setAttribute("color", new THREE.BufferAttribute(new Float32Array(q.attributes.position.count * 3), 3)); q.deleteAttribute("normal"); q.deleteAttribute("uv"); return q; }));
    geo = mergeVertices(geo, 1e-4);   // nối lại đỉnh trùng ⇒ pháp tuyến MƯỢT (không bị mặt phẳng từng tam giác)
    geo.computeVertexNormals();
    // sần sùi: u nổi nhiều lớp theo pháp tuyến + mắt gai lấm tấm
    const P = geo.attributes.position, Nn = geo.attributes.normal, col = geo.attributes.color, sd = r() * 50;
    const tint = [0.95 + r() * 0.35, 0.85 + r() * 0.25, 0.55 + r() * 0.3], barkH = 0.08 + r() * 0.2, sun = 0.3 + r() * 0.7;
    for (let i = 0; i < P.count; i++) {
      const px = P.getX(i), py = P.getY(i), pz = P.getZ(i);
      const lump = n3(px * 1.4 + sd, py * 1.1, pz * 1.4) * 0.16 * R + n3(px * 4 + sd, py * 3.2, pz * 4) * 0.07 * R + n3(px * 11, py * 9 + sd, pz * 11) * 0.03 * R;
      const areole = Math.pow(Math.max(0, n3(px * 12, py * 12 + sd, pz * 12) - 0.25), 2) * 0.35 * R;
      P.setXYZ(i, px + Nn.getX(i) * (lump + areole), py + Nn.getY(i) * (lump + areole), pz + Nn.getZ(i) * (lump + areole));
      const t = py / h, a = Math.atan2(pz, px);
      let cr = 0.3 + 0.07 * t, cg = 0.42 + 0.08 * t, cb = 0.22 + 0.05 * t;
      if (col.getX(i) > 0) { cr = col.getX(i); cg = col.getY(i); cb = col.getZ(i); }
      else { const rib = Math.cos(a * ribs + twist * t * 6), k = 0.55 + 0.45 * (rib * 0.5 + 0.5), ridge = Math.pow(rib * 0.5 + 0.5, 3); cr = cr * k + ridge * 0.16; cg = cg * k + ridge * 0.14; cb = cb * k + ridge * 0.08; }
      cr *= tint[0]; cg *= tint[1]; cb *= tint[2];
      // gốc hoá gỗ (ranh giới lởm chởm theo nhiễu)
      const bark = Math.min(1, Math.max(0, (barkH + n3(a * 2 + sd, py * 0.8, 0) * 0.05 - t) / 0.04));
      cr = cr * (1 - bark) + (0.34 + n3(px * 6, py * 6, pz * 6) * 0.06) * bark; cg = cg * (1 - bark) + 0.3 * bark; cb = cb * (1 - bark) + 0.24 * bark;
      // sẹo nâu + mảng cháy nắng vàng nhạt phía hướng nắng
      const scar = Math.max(0, n3(px * 2.2 + 9, py * 1.3 + sd, pz * 2.2) - 0.18) * 3.2;
      cr += (0.42 - cr) * Math.min(1, scar) * 0.8; cg += (0.33 - cg) * Math.min(1, scar) * 0.8; cb += (0.22 - cb) * Math.min(1, scar) * 0.8;
      const sunburn = Math.max(0, -Math.cos(a - 1.2)) * sun * Math.max(0, n3(px * 1.1, py * 0.7 + 4, pz * 1.1) + 0.2);
      cr += sunburn * 0.18; cg += sunburn * 0.12; cb += sunburn * 0.02;
      if (areole > 0.01 * R) { cr = cr * 0.45 + 0.4; cg = cg * 0.45 + 0.37; cb = cb * 0.45 + 0.3; }   // mắt gai trắng ngà
      col.setXYZ(i, cr, cg, cb);
    }
    geo.computeVertexNormals(); fixNormals(geo);
    const m = new THREE.Mesh(geo, sagMat); m.castShadow = true; m.receiveShadow = true;
    m.position.set(x, -0.15, z); m.rotation.y = r() * 6; m.userData.saguaro = true;
    return m;
  }
  // tai thỏ: mỗi tấm lá mọc từ mép trên tấm cha (nối liền), gốc chạm đất
  const padGeo = (() => {
    const g = new THREE.SphereGeometry(1, 26, 18), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const w = 0.52 * (1 - 0.25 * Math.max(0, -y));     // hình trứng ngược: dưới hẹp, trên rộng
      x *= w * (1 + N3(y * 3, x * 3) * 0.06); z *= 0.1 * (1 - Math.abs(y) * 0.4 + 0.25); y *= 0.66;
      p.setXYZ(i, x, y + 0.64, z);
    }
    g.computeVertexNormals(); return fixNormals(g);
  })();
  function opuntia(x, z, s, r) {
    const g = new THREE.Group();
    const grow = (parent, depth, tilt, yaw, sc) => {
      const pad = new THREE.Group();
      pad.rotation.set(0, yaw, tilt); pad.scale.setScalar(sc);
      const m = new THREE.Mesh(padGeo, padMat); m.castShadow = true; m.receiveShadow = true; pad.add(m);
      parent.add(pad);
      if (depth > 0) {
        const kids = 1 + Math.floor(r() * 2.2);
        for (let k = 0; k < kids; k++) {
          const joint = new THREE.Group(); joint.position.set((r() - 0.5) * 0.5, 1.18, 0); pad.add(joint);
          grow(joint, depth - 1, (r() - 0.5) * 1.1, (r() - 0.5) * 1.4, 0.72 + r() * 0.18);
        }
      } else if (r() < 0.6) {
        const n = 1 + Math.floor(r() * 3);
        for (let k = 0; k < n; k++) {
          const f = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), r() < 0.5 ? fruitMat : flowerMat);
          f.scale.set(1, 1.35, 1); f.position.set(-0.3 + k * 0.28, 1.28 - Math.abs(k - 1) * 0.06, 0); pad.add(f);
        }
      }
    };
    const bases = 2 + Math.floor(r() * 3);
    for (let i = 0; i < bases; i++) {
      const base = new THREE.Group(); base.position.set((r() - 0.5) * 0.9, -0.08, (r() - 0.5) * 0.7); g.add(base);
      grow(base, 1 + Math.floor(r() * 2), (r() - 0.5) * 0.7, r() * Math.PI, 0.9 + r() * 0.3);
    }
    g.scale.setScalar(s); g.position.set(x, 0, z); g.rotation.y = r() * 6;
    return g;
  }
  return { saguaro, opuntia };
}
function padTexture() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h * 0.45, 20, w / 2, h / 2, w * 0.6);
    g.addColorStop(0, "#9bb56a"); g.addColorStop(0.7, "#78964c"); g.addColorStop(1, "#6a6a52");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    const r = mulberry(5);
    for (let i = 0; i < 1400; i++) { ctx.fillStyle = `rgba(${60 + r() * 60},${90 + r() * 50},${40 + r() * 30},.18)`; ctx.fillRect(r() * w, r() * h, 2 + r() * 5, 2 + r() * 5); }
    // mắt gai xếp lưới chéo, mỗi mắt có túm gai trắng
    for (let y = 18; y < h; y += 44) for (let x = (y / 44 % 2) * 26 + 10; x < w; x += 52) {
      const px = x + (r() - 0.5) * 6, py = y + (r() - 0.5) * 6;
      ctx.fillStyle = "#5b4a2a"; ctx.beginPath(); ctx.arc(px, py, 4.5, 0, 7); ctx.fill();
      ctx.fillStyle = "#e9dfb8"; ctx.beginPath(); ctx.arc(px, py, 2.6, 0, 7); ctx.fill();
      ctx.strokeStyle = "rgba(246,240,214,.9)"; ctx.lineWidth = 1.4;
      for (let k = 0; k < 3; k++) { const a = -1.9 + r() * 1.4; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(a) * 14, py + Math.sin(a) * 14); ctx.stroke(); }
    }
  });
}

// ============================================================ 1j: ĐỒI ĐỠ CHỮ nhọn, gồ ghề, lởm chởm, đốm cây xanh
// Toạ độ trong nhóm bảng chữ: chân chữ ở z = 12, y ≈ 17 (vùng chân chữ giữ phẳng vừa đủ để chữ đứng vững).
// ============================================================ 1s: ĐỒI CHỮ KIỂU ATACAMA (Thung lũng Mặt Trăng) — 4 bản (?nui=0..3)
// Thầy gửi ảnh Valle de la Luna: sống núi đỏ cam SẮC như lưỡi dao, sườn bị nước xói thành vô số RÃNH song song chạy từ
// đỉnh xuống, MUỐI TRẮNG đọng ở lòng trũng/rãnh, trơ trọi không cây.
// Cách dựng: địa hình vĩ mô = hợp (max) các "sống đao" (mặt cắt tam giác nhọn, sống chạy dọc x) + các gò nhỏ;
// rãnh xói = nhiễu gờ tần số cao theo x, thấp theo z ⇒ rãnh chạy dọc sườn xuống; sâu nhất ở sườn dốc, mờ ở đỉnh + chân.
export const HILL_STYLES = ["Bản 3 gốc (1s)", "Rãnh xói mịn 3 lớp", "Tầng đá phân lớp", "Sống răng cưa + nón đá vụn", "Muối rắc + phân lớp"];   // 1t: biến thể CHI TIẾT của bản 3 "Đỉnh nhọn hùng vĩ"
export const NUI = (() => { try { const v = parseInt(new URLSearchParams(location.search).get("nui"), 10); return 3; } catch { return 3; } })();   // 1u: thầy chốt biến thể 3 (răng cưa + nón đá vụn)
const OPTS = [   // res = độ mịn lưới · fine = lớp rãnh nhỏ thứ 3 · strata = vệt tầng đá · serr = răng cưa trên sống · talus = nón đá vụn chân sườn · bump = vân sạn nổi
  { H: 46, peaks: 4, sub: 4, flute: 1.25, sharp: 1.6, salt: 0.25, res: [320, 180], fine: 0, strata: 0, serr: 0, talus: 0, bump: 0 },
  { H: 46, peaks: 4, sub: 4, flute: 1.25, sharp: 1.6, salt: 0.25, res: [460, 260], fine: 0.55, strata: 0, serr: 0, talus: 0, bump: 1 },
  { H: 46, peaks: 4, sub: 4, flute: 1.25, sharp: 1.6, salt: 0.25, res: [460, 260], fine: 0.5, strata: 1, serr: 0, talus: 0.3, bump: 1 },
  { H: 46, peaks: 6, sub: 5, flute: 1.3, sharp: 1.7, salt: 0.25, res: [460, 260], fine: 0.5, strata: 0.3, serr: 1, talus: 1, bump: 1 },
  { H: 46, peaks: 4, sub: 4, flute: 1.25, sharp: 1.6, salt: 0.7, res: [460, 260], fine: 0.5, strata: 0.7, serr: 0.4, talus: 0.5, bump: 1 },
];
const smooth01 = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function ruggedHill(cx, soilMat, seed) {
  const HS = 0.5;   /* 1u: dãy núi thấp còn 1/2 */
  const O = OPTS[NUI], N = makeNoise(seed), N2 = makeNoise(seed + 7), N3 = makeNoise(seed + 13), r = mulberry(seed);
  const sx = cx * 0.78 + 34, sz = 40, cz = -16;
  // các sống đao: [x tâm, z tâm, nửa dài theo x, nửa rộng theo z, cao]
  const ridges = [];
  for (let i = 0; i < O.peaks; i++) {
    const t = O.peaks === 1 ? 0 : i / (O.peaks - 1) - 0.5;
    ridges.push([t * sx * 1.25 + (r() - 0.5) * 12, cz - 4 + (r() - 0.5) * 14, sx * (0.32 + r() * 0.22), 11 + r() * 8, O.H * (0.7 + r() * 0.35) * (1 - Math.abs(t) * 0.45)]);
  }
  for (let i = 0; i < O.sub; i++) ridges.push([(r() - 0.5) * sx * 1.6, cz + (r() - 0.35) * sz * 1.3, 6 + r() * 12, 5 + r() * 6, O.H * (0.18 + r() * 0.25)]);
  const macro = (lx, lz) => {
    // vòm nền: đỡ chân chữ (chữ đứng ở lz ≈ 12,5, cao ≈ 17) — các sống đao mọc CHỒNG lên vòm này
    const u = lx / sx, v = (lz - cz) / sz, r2 = u * u + v * v, base = r2 < 1 ? 31 * Math.pow(1 - r2, 0.8) : 0;
    let h = 0;
    for (const [x0, z0, a, b, hi] of ridges) {
      const dx = (lx - x0) / a, dz = (lz - z0 + Math.sin(lx * 0.05 + x0) * 3) / b;   // sống hơi uốn
      const k = 1 - Math.abs(dz) - dx * dx * 0.9; if (k <= 0) continue;
      h = Math.max(h, hi * Math.pow(k, O.sharp));
    }
    return base + h * 0.75;
  };
  const ridged = (N_, x, z) => { const v = 1 - Math.abs(N_(x, z)); return v * v; };
  const hh = (lx, lz) => {
    const u = lx / sx, v = (lz - cz) / sz, r2 = u * u + v * v;
    const edge = 1 - smooth01(0.7, 1.0, r2);
    const m = macro(lx, lz) * edge;
    const mask = (1 - Math.min(1, Math.max(0, (Math.abs(lx) - cx / 2 - 2) / 6))) * (1 - Math.min(1, Math.abs(lz - 12.5) / 5));
    // rãnh xói: gờ tần số cao theo x (rãnh chạy xuôi theo z = xuôi sườn), sâu ở sườn, nông ở đỉnh + chân
    const e = 0.9, sl = Math.min(1, (Math.abs(macro(lx + e, lz) - macro(lx - e, lz)) + Math.abs(macro(lx, lz + e) - macro(lx, lz - e))) / (2 * e) * 0.6);
    const warp = N(lx * 0.04, lz * 0.04) * 2.5;
    const f1 = ridged(N, lx * 0.42 + warp, lz * 0.07), f2 = ridged(N2, lx * 1.05 + warp * 1.7, lz * 0.16);
    const f3 = O.fine ? ridged(N3, lx * 2.4 + warp * 2.6, lz * 0.34) : 0;   /* 1t: lớp rãnh nhỏ thứ 3 */
    const flutes = (f1 * 0.75 + f2 * 0.35 + f3 * O.fine * 0.45 - 0.45 - O.fine * 0.12) * O.flute * sl * Math.min(1, m / 4) * (1 - mask * 0.9);
    const serr = O.serr ? O.serr * (ridged(N2, lx * 0.21 + 3, lz * 0.21) * 3.4 + ridged(N3, lx * 0.6, lz * 0.6) * 1.2 - 1.6) * smooth01(38, 58, m) : 0;   /* 1t: răng cưa trên sống */
    const bumps = N2(lx * 0.12, lz * 0.12) * 0.8 * edge;
    return -4 + (m + flutes * 3.2 + serr * (1 - mask) + bumps * (1 - mask)) * HS + (r2 >= 1 ? -(Math.sqrt(r2) - 1) * 8 : 0);
  };
  const W = sx * 2, D = sz * 2 * 1.15, geo = new THREE.PlaneGeometry(W, D, O.res[0], O.res[1]); geo.rotateX(-Math.PI / 2); geo.translate(0, 0, cz);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, hh(p.getX(i), p.getZ(i)));
  geo.computeVertexNormals();
  const nr = geo.attributes.normal, col = new Float32Array(p.count * 3), c = new THREE.Color();
  const cDeep = new THREE.Color(0x8e3a1e), cRed = new THREE.Color(0xc2552c), cOrg = new THREE.Color(0xe08650), cHi = new THREE.Color(0xf2ae78), cSalt = new THREE.Color(0xeee8de), cSand = new THREE.Color(0xc98a62), cTalus = new THREE.Color(0xd9a27a);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = (p.getY(i) + 4) / HS - 4, z = p.getZ(i), ny = nr.getY(i), mh = macro(x, z);   /* 1u: tô màu theo thang cao cũ */
    const steep = smooth01(0.9, 0.45, ny);
    c.copy(cSand).lerp(cRed, smooth01(0, 6, mh)).lerp(cOrg, smooth01(0.35, 0.8, (y + 4) / (O.H + 4)) * 0.7);
    const rel = (y + 4) - mh;                            // dưới mức vĩ mô = đáy rãnh (tối); trên = gờ (sáng)
    c.lerp(cDeep, smooth01(0, -2.0, rel) * 0.8 * steep).lerp(cHi, smooth01(0.2, 1.4, rel) * 0.75);
    if (O.strata) { const bd = Math.sin(y * 1.35 + N(x * 0.03, z * 0.03) * 2.4), bd2 = Math.sin(y * 4.1 + x * 0.02); c.multiplyScalar(1 + O.strata * (bd * 0.13 + bd2 * 0.05)); if (bd > 0.86) c.lerp(cHi, O.strata * 0.35); }   /* 1t: vệt tầng đá nằm ngang */
    if (O.talus) { const tl = smooth01(16, 3, mh) * smooth01(0.55, 0.85, ny) * (0.6 + 0.4 * N2(x * 0.3, z * 0.3)); c.lerp(cTalus, Math.max(0, tl) * O.talus * 0.7); }   /* 1t: nón đá vụn nhạt màu dưới chân sườn */
    // muối trắng: lòng trũng thấp + đáy rãnh ở tầng giữa, loang theo nhiễu
    const sn = N2(x * 0.09 + 11, z * 0.09) * 0.7 + N(x * 0.35, z * 0.35) * 0.3;
    const low = smooth01(5, 0.5, mh) * (1 - steep * 0.6), groove = smooth01(-0.4, -1.8, rel) * smooth01(3, 10, mh) * smooth01(O.H * 0.8, O.H * 0.4, mh);
    const lower = smooth01(O.H * 1.1, O.H * 0.35, mh), trough = smooth01(0, -1.1, rel);
    const salt = Math.max(0, Math.min(1, (low + groove + lower * 0.55 + trough * lower * 0.8) * O.salt * 1.7 + sn * 0.9 - 0.45));   // muối loang ở lòng trũng, đáy rãnh, nửa dưới sườn
    const lm = (1 - Math.min(1, Math.max(0, (Math.abs(x) - cx / 2 - 4) / 8))) * (1 - Math.min(1, Math.abs(z - 9) / 12));   // quanh chữ: ít muối (chữ trắng rõ)
    c.lerp(cSalt, Math.min(0.92, salt * 1.4) * (1 - lm * 0.85));
    // nắng xiên "vẽ sẵn" từ bên trái-trước: sống/rãnh nổi khối dù mặt đồi quay lưng về mặt trời thật
    const nx = nr.getX(i), nz = nr.getZ(i), lit = Math.max(0, nx * -0.55 + ny * 0.55 + nz * 0.63);
    c.multiplyScalar((0.55 + 0.75 * lit) * (0.92 + N(x * 1.6, z * 1.6) * 0.08) * 0.84);   /* 1u: sẫm hơn */
    col.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const tex = grainTex(); tex.repeat.set(W / 5, D / 5);
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, map: tex, roughness: 0.97, bumpMap: O.bump ? tex : null, bumpScale: O.bump ? 1.4 : 1 });   /* 1t: vân sạn nổi */
  mat.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\n totalEmissiveRadiance += diffuseColor.rgb * 0.22;"); };   // tự sáng nhẹ (đồi ngược nắng không đen)
  const hill = new THREE.Group();
  const mesh = new THREE.Mesh(fixNormals(geo), mat); mesh.receiveShadow = true; mesh.castShadow = false; hill.add(mesh);
  // đá vụn lăn xuống chân sườn
  const RK = makeRockKit();
  for (let k = 0, g = 0; k < 30 + O.talus * 70 && g < 1600; g++) {
    const lx = (r() - 0.5) * sx * 1.8, lz = cz + (r() - 0.5) * sz * 1.8;
    const mh = macro(lx, lz); if (mh > 5 || mh < 0.3 || (Math.abs(lz - 12.5) < 5 && Math.abs(lx) < cx / 2 + 4)) continue;
    const s = 0.4 + r() * 1.3, rock = new THREE.Mesh(RK.protos[k % RK.protos.length], RK.mat);
    rock.scale.set(s * (1 + r() * 0.6), s * (0.6 + r() * 0.5), s); rock.rotation.set(r(), r() * 6, r());
    rock.position.set(lx, hh(lx, lz) - 0.2 * s, lz); rock.receiveShadow = true; hill.add(rock); k++;
  }
  return { hill, hillH: hh };
}
// hạt đất đỏ li ti (lặp liền mạch) — cho mặt núi có vân sạn khi nhìn gần
function grainTex() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    const r = mulberry(909), img = ctx.createImageData(w, h);
    for (let i = 0; i < w * h; i++) { const v = 222 + (r() - 0.5) * 46; img.data[i * 4] = v; img.data[i * 4 + 1] = v * 0.93; img.data[i * 4 + 2] = v * 0.88; img.data[i * 4 + 3] = 255; }
    ctx.putImageData(img, 0, 0);
    for (let i = 0; i < 700; i++) { const x = r() * w, y = r() * h, s = 0.6 + r() * 1.8; ctx.fillStyle = r() < 0.5 ? "rgba(90,40,20,.35)" : "rgba(255,240,225,.3)"; ctx.fillRect(x, y, s, s); }
  }, true);
}

function hillSoft(cx, soilMat, seed) {

  // 1k: thầy thấy đồi 1j "quá nhấp nhô" ⇒ đồi MỀM: vòm tròn + sóng đất thoải (không gờ sắc), con vật leo lên hợp lý;
  // phủ cỏ thật (farGrassKit) mọc thành vạt, đất lộ ở chỗ dốc
  const N = makeNoise(seed), r = mulberry(seed), sx = cx * 0.75 + 30, sz = 36, cz = -14, H = 38;
  const hh = (lx, lz) => {
    const u = lx / sx, v = (lz - cz) / sz, r2 = u * u + v * v;
    if (r2 >= 1) return -4 - (Math.sqrt(r2) - 1) * 8;
    const dome = Math.pow(1 - r2, 0.8);
    const inX = 1 - Math.min(1, Math.max(0, (Math.abs(lx) - cx / 2 - 2) / 6)), inZ = 1 - Math.min(1, Math.abs(lz - 12.5) / 4.5), mask = inX * inZ;
    const swell = N(lx * 0.018 + 3, lz * 0.022) * 7 + N(lx * 0.045, lz * 0.05 + 5) * 2.6 + N(lx * 0.12 + 9, lz * 0.12) * 0.6;   // vai đồi, yên ngựa, sống thoải
    const up = Math.sqrt(1 - r2);
    return -4 + H * dome + swell * up * (1 - 0.85 * mask);
  };
  const W = sx * 2, D = sz * 2 * 1.15, geo = new THREE.PlaneGeometry(W, D, 170, 96); geo.rotateX(-Math.PI / 2); geo.translate(0, 0, cz);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, hh(p.getX(i), p.getZ(i)));
  geo.computeVertexNormals();
  // vạt cỏ: nhiễu to (0..1) — dùng CHUNG cho màu đất dưới cỏ và mật độ búi cỏ
  const patch = (x, z) => { const v = N(x * 0.05 + 40, z * 0.06) * 1.1 + N(x * 0.17, z * 0.17 + 9) * 0.4; return Math.max(0, Math.min(1, (v - 0.02) * 2)); };   // 1l: vạt cỏ thưa, đất trống nhiều hơn
  const nr = geo.attributes.normal, col = new Float32Array(p.count * 3), c = new THREE.Color();
  const cSand = new THREE.Color(0xf4d8b8), cRock = new THREE.Color(0xcf9272), cDry = new THREE.Color(0xd8c088), cOlive = new THREE.Color(0xa7a468);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), ny = nr.getY(i);
    const steep = Math.min(1, Math.max(0, (0.8 - ny) / 0.35));
    c.copy(cSand).lerp(cRock, steep * 0.7);
    const g = patch(x, z) * (1 - steep * 0.7);
    c.lerp(N(x * 0.05 + 3, z * 0.05) > 0 ? cOlive : cDry, g * 0.55);
    c.multiplyScalar(0.93 + N(x * 0.8, z * 0.8) * 0.08);
    col.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const K = farGrassKit(), gtex = K.groundTex.clone(); gtex.repeat.set(W / 7, D / 7); gtex.needsUpdate = true;
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, map: gtex, roughness: 1 });
  const hill = new THREE.Group();
  const m = new THREE.Mesh(fixNormals(geo), mat); m.receiveShadow = true; hill.add(m);
  scatterFarGrass(hill, hh, { n: 2600, ns: 70, nf: 320, rx: sx, rz: sz, cz, seed: seed + 5, s0: 0.3, s1: 0.62,
    inside: (lx, lz) => (lx / sx) ** 2 + ((lz - cz) / sz) ** 2 < 0.93,
    skip: (lx, lz) => Math.abs(lz - 12.5) < 3.2 && Math.abs(lx) < cx / 2 + 1.5,   // chân chữ gọn
    patch });
  // đá sa thạch lộ trên sườn dốc
  const RK = makeRockKit();
  for (let k = 0, guard = 0; k < 26 && guard < 400; guard++) {
    const lx = (r() - 0.5) * sx * 1.7, lz = cz + (r() - 0.5) * sz * 1.7;
    if ((lx / sx) ** 2 + ((lz - cz) / sz) ** 2 > 0.8 || (Math.abs(lz - 12.5) < 5 && Math.abs(lx) < cx / 2 + 3)) continue;
    const e = 0.8, sl = Math.abs(hh(lx + e, lz) - hh(lx - e, lz)) + Math.abs(hh(lx, lz + e) - hh(lx, lz - e));
    if (sl < 1.1 && r() < 0.75) continue;
    const rock = new THREE.Mesh(RK.protos[k % RK.protos.length], RK.mat), s = 0.9 + r() * 2.2;
    rock.scale.set(s * (1 + r() * 0.8), s * (0.6 + r() * 0.5), s * (0.8 + r() * 0.6)); rock.rotation.set((r() - 0.5) * 0.3, r() * 6, (r() - 0.5) * 0.3);
    rock.position.set(lx, hh(lx, lz) - 0.25 * s, lz); rock.receiveShadow = true; hill.add(rock); k++;
  }
  return { hill, hillH: hh };
}

// ============================================================ CHỮ KIỂU HOLLYWOOD TRÊN ĐỒI XA
export const NH_STYLES = ["NO HOMEWORK ở đồi Atacama", "NO HOMEWORK cũng trên đụn cát"];
export const NH = (() => { try { const v = parseInt(new URLSearchParams(location.search).get("nh"), 10); return 1; } catch { return 1; } })();   // 1y: thầy chốt kiểu 1 — NO HOMEWORK cũng trên đụn cát
export function createHillSigns(scene, soilMat) {
  const TEXTS = ["ANDREW CLASSES", "NO HOMEWORK - NO FUN"];
  const Z = -215, LETTER_H = 4.2, LETTER_Y = 9;   /* 1z: chữ còn 70 % (6 → 4,2) */   // 1u: đồi thấp 1/2 ⇒ chữ hạ từ 17 xuống 9
  let font = null, idx = 0, cur = null, nextAt = null, extra = null, ahead = null;
  new FontLoader().load(new URL("../../rocket-race/vendor/three/helvetiker_bold.typeface.json", import.meta.url).href, f => { font = f; }, undefined, () => { font = "fail"; });
  const letterMat = new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.55, metalness: 0.1 });
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x4a3a2c, roughness: 0.9 });
  function build(text, x) {
    const g = new THREE.Group(), r = mulberry(text.length * 7 + idx);
    const chars = [...text];
    let cx = 0; const glyphs = [];
    for (const ch of chars) {
      if (ch === " ") { cx += LETTER_H * 0.55; continue; }
      let geo;
      if (font && font !== "fail") { geo = fixNormals(new TextGeometry(ch, { font, size: LETTER_H, depth: 0.5, curveSegments: 6, bevelEnabled: false })); geo.computeBoundingBox(); }
      else { geo = new THREE.BoxGeometry(LETTER_H * 0.7, LETTER_H, 0.5); geo.translate(LETTER_H * 0.35, LETTER_H / 2, 0); geo.computeBoundingBox(); }
      const bb = geo.boundingBox, lw = (bb.max.x - bb.min.x) * 0.82;
      const m = new THREE.Mesh(geo, letterMat); m.scale.x = 0.82; m.castShadow = true; m.receiveShadow = true;
      m.position.set(cx - bb.min.x * 0.82, (r() - 0.5) * 0.8, 0); m.rotation.set(-0.12 + (r() - 0.5) * 0.05, (r() - 0.5) * 0.06, (r() - 0.5) * 0.05);
      m.userData.w = lw; m.userData.rx0 = m.rotation.x; g.add(m); glyphs.push(m);
      // giàn chống phía sau
      // cột chống: chỉ nửa dưới chữ, đứng thẳng ngay SAU chữ (bị chữ che, không đè lên chữ)
      for (const px of [0.3, 0.7]) { const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, LETTER_H * 1.4, 6), poleMat); pole.position.set(m.position.x + lw * px, LETTER_H * 0.3 - LETTER_H * 0.7 - 0.3, -0.75); g.add(pole); }
      cx += lw + LETTER_H * 0.2;
    }
    g.children.forEach(o => { o.position.x -= cx / 2; });
    // đồi đỡ chữ: gò đất thoai thoải cùng màu nền
    // 1x: ANDREW CLASSES (và NO HOMEWORK nếu ?nh=1) đứng trên ĐỤN CÁT cao của mặt đất (dune-1x), không dựng đồi riêng
    if (text === TEXTS[0] || NH === 1) {
      const signs = new THREE.Group();
      g.position.set(0, DUNE_H, 12); signs.add(g);
      signs.position.set(x + cx / 2, 0, DUNE_Z - 12);
      signs.userData.width = cx; signs.userData.glyphs = glyphs; signs.userData.hill = null; signs.userData.letters = g; signs.userData.dune = true;
      signs.userData.hillH = (lx, lz) => DUNE.gh(signs.position.x + lx, signs.position.z + lz);
      scene.add(signs);
      return signs;
    }
    const { hill, hillH } = ruggedHill(cx, soilMat, text.length * 13 + idx);
    const signs = new THREE.Group(); signs.add(hill);
    g.position.set(0, LETTER_Y, 12); signs.add(g);
    signs.position.set(x + cx / 2, 0, Z);
    signs.userData.width = cx; signs.userData.glyphs = glyphs; signs.userData.hill = hill; signs.userData.hillH = hillH; signs.userData.letters = g;
    scene.add(signs);
    return signs;
  }
  // bụi tung khi chữ đổ
  const dustTex = canvasTexture(64, 64, (ctx) => { const gr = ctx.createRadialGradient(32, 32, 2, 32, 32, 31); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = gr; ctx.fillRect(0, 0, 64, 64); });
  const falling = [], puffs = [], rising = [];
  let lastT = performance.now();
  function step() {
    const now = performance.now(), dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
    for (let i = falling.length - 1; i >= 0; i--) {
      const f = falling[i], m = f.m;
      f.w += 3.2 * Math.sin(m.rotation.x) * dt + 0.5 * dt;         // mô-men trọng lực: càng nghiêng càng đổ nhanh
      m.rotation.x += f.w * dt;
      if (m.rotation.x >= f.end) {
        m.rotation.x = f.end;
        if (Math.abs(f.w) > 0.6) { f.w = -f.w * 0.28; dust(f); } else falling.splice(i, 1);   /* 1ag: nằm yên — không tự dựng lại trước mắt người xem */
      }
    }
    for (let i = rising.length - 1; i >= 0; i--) {   /* 1w: dựng chữ lại — nhấc lên, hơi quá đà rồi đứng yên */
      const q = rising[i], m = q.m; q.t += dt; if (q.t < 0) continue;
      const k = Math.min(1, q.t / 1.6), e = 1 - Math.pow(1 - k, 3) + Math.sin(k * Math.PI) * 0.08;
      m.rotation.x = q.a0 + (m.userData.rx0 - q.a0) * e;
      if (k >= 1) { m.rotation.x = m.userData.rx0; m.userData.down = false; rising.splice(i, 1); }
    }
    for (let i = puffs.length - 1; i >= 0; i--) {
      const p = puffs[i]; p.t += dt; const k = p.t / p.life;
      p.s.position.addScaledVector(p.v, dt); p.s.scale.setScalar(p.s0 * (1 + k * 2.5)); p.s.material.opacity = 0.75 * (1 - k);
      if (k >= 1) { p.s.parent && p.s.parent.remove(p.s); p.s.material.dispose(); puffs.splice(i, 1); }
    }
  }
  function dust(f) {
    const wp = new THREE.Vector3(); f.m.getWorldPosition(wp);
    for (let k = 0; k < 10; k++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dustTex, color: 0xd6b48a, transparent: true, depthWrite: false, opacity: 0.75 }));
      s.position.set(wp.x + f.wd * (0.2 + Math.random()), wp.y + 0.4, wp.z + 1 + Math.random() * 3); scene.add(s);
      puffs.push({ s, t: 0, life: 1.6 + Math.random(), s0: 1.2 + Math.random(), v: new THREE.Vector3((Math.random() - 0.5) * 3, 0.8 + Math.random() * 1.2, (Math.random() - 0.3) * 2) });
    }
  }
  function syncDunes() {
    DUNES.fill(0); let k = 0;
    for (const b of [cur, extra, ahead]) if (b && b.userData.dune && b.parent && k < DUNE_N) { DUNES.set([b.position.x, b.userData.width / 2 + 12, 1, 0], k * 4); k++; }
  }
  const api = {
    // bảng chữ đang hiện (hoặc null)
    current() { return cur && cur.userData.glyphs ? cur : null; },
    // húc đổ chữ thứ i về phía trước (về phía máy quay)
    knock(i) {
      if (!cur) return false;
      const m = cur.userData.glyphs[i]; if (!m || m.userData.down) return false;
      m.userData.down = true;
      falling.push({ m, w: 1.1, end: 1.42 + (Math.random() - 0.5) * 0.12, wd: m.userData.w || 3 });
      dust({ m, wd: m.userData.w || 3 });
      return true;
    },
    // 1q: màn chờ — hiện CẢ HAI bảng chữ cạnh nhau (bảng thứ hai đặt bên trái bảng chính)
    showBoth() {
      if (!font || !cur || extra) return !!extra;
      const text = TEXTS[idx % TEXTS.length];
      extra = build(text, 0);
      extra.position.x = cur.position.x + cur.userData.width / 2 + 95 + extra.userData.width / 2;   /* 1u: ANDREW CLASSES bên trái (trước), NO HOMEWORK bên phải, 2 dãy núi tách xa */
      return true;
    },
    // 1u: dựng sẵn bảng ANDREW CLASSES ở chỗ ván chơi sẽ bắt đầu (trong lúc intro), lúc vào ván thì nhận làm bảng chính
    aheadAt(x) { if (!font || ahead) return; ahead = build(TEXTS[0], x); },
    // 1aa: lúc intro CẮT khỏi khung màn chờ — bỏ 2 bảng màn chờ rồi mới dựng ANDREW CLASSES chỗ ván bắt đầu
    // (1z dựng thêm bảng khi 2 bảng màn chờ còn đó ⇒ ANDREW CLASSES đè lên NO HOMEWORK suốt intro)
    swapAhead(x) {
      if (!font || ahead) return;
      for (const b of [cur, extra]) if (b) { scene.remove(b); b.traverse(o => { if (o.geometry && o.geometry.type !== "SphereGeometry") o.geometry.dispose(); }); }
      extra = null; ahead = build(TEXTS[0], x); cur = ahead;
    },
    commitAhead() {
      const kill = b => { if (!b) return; scene.remove(b); b.traverse(o => { if (o.geometry && o.geometry.type !== "SphereGeometry") o.geometry.dispose(); }); };
      if (!ahead) { kill(extra); extra = null; return; }
      if (cur !== ahead) kill(cur); kill(extra); extra = null; cur = ahead; ahead = null; idx = 1; nextAt = null;
    },
    dropExtra() { if (!extra) return; scene.remove(extra); extra.traverse(o => { if (o.geometry && o.geometry.type !== "SphereGeometry") o.geometry.dispose(); }); extra = null; },
    get extra() { return extra; },
    // 1ag: dựng lại (tức thì) chữ đổ của những bảng đang KHUẤT khỏi khung hình — quay lại thì chữ đã đứng sẵn để húc đổ lần mới
    restoreHidden(isVisible) {
      for (const b of [cur, extra, ahead]) {
        if (!b || !b.userData.glyphs || !b.userData.glyphs.some(m => m.userData.down)) continue;
        if (isVisible(b)) continue;
        for (const m of b.userData.glyphs) if (m.userData.down) {
          m.rotation.x = m.userData.rx0; m.userData.down = false;
          for (let i = falling.length - 1; i >= 0; i--) if (falling[i].m === m) falling.splice(i, 1);
          for (let i = rising.length - 1; i >= 0; i--) if (rising[i].m === m) rising.splice(i, 1);
        }
      }
    },
    update(camX, halfFar) {
      step();
      if (!font) return;
      if (ahead) return;   /* 1u: đang chờ bảng dựng sẵn — không tự dựng/xoá */
      if (!cur) {
        const x = nextAt == null ? camX + 10 : Math.max(nextAt, camX + halfFar + 20);
        cur = build(TEXTS[idx % TEXTS.length], x); idx++;
      } else if (cur.position.x + cur.userData.width / 2 + 45 < camX - halfFar) {
        scene.remove(cur); cur.traverse(o => { if (o.geometry && o.geometry.type !== "SphereGeometry") o.geometry.dispose(); });
        cur = null; nextAt = camX + halfFar + 90;   // bảng sau hiện một lát sau khi bảng trước đã qua
      }
    },
  };
  for (const k of ["showBoth", "aheadAt", "swapAhead", "commitAhead", "dropExtra", "update"]) { const f = api[k]; api[k] = function (...a) { const r = f.apply(api, a); syncDunes(); return r; }; }
  return api;
}

// ============================================================ LẠC ĐÀ chạy ra xem tàu
export function createCamel(scene) {
  const tan = new THREE.MeshStandardMaterial({ color: 0xc39463, roughness: 0.95 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x5a3d26, roughness: 0.95 });
  const g = new THREE.Group();
  const add = (geo, mat, parent, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; parent.add(m); return m; };
  const body = new THREE.Group(); body.position.y = 1.75; g.add(body);
  add(new THREE.SphereGeometry(1, 24, 16), tan, body, 0, 0, 0).scale.set(1.25, 0.62, 0.55);
  add(new THREE.SphereGeometry(0.62, 20, 14), tan, body, -0.05, 0.5, 0).scale.set(1.15, 0.95, 0.8);   // bướu
  // cổ + đầu
  const neck = new THREE.Group(); neck.position.set(1.05, 0.15, 0); body.add(neck);
  const nk = add(new THREE.CylinderGeometry(0.17, 0.26, 1.25, 12), tan, neck, 0.35, 0.35, 0); nk.rotation.z = -0.75;
  const head = new THREE.Group(); head.position.set(0.72, 0.85, 0); neck.add(head);
  add(new THREE.SphereGeometry(0.22, 16, 12), tan, head, 0.15, 0, 0).scale.set(1.9, 0.9, 0.85);
  add(new THREE.SphereGeometry(0.05, 8, 6), dark, head, 0.18, 0.1, 0.15);
  add(new THREE.SphereGeometry(0.05, 8, 6), dark, head, 0.18, 0.1, -0.15);
  add(new THREE.ConeGeometry(0.05, 0.14, 6), tan, head, -0.05, 0.2, 0.1);
  add(new THREE.ConeGeometry(0.05, 0.14, 6), tan, head, -0.05, 0.2, -0.1);
  const tail = add(new THREE.CylinderGeometry(0.04, 0.02, 0.6, 6), dark, body, -1.25, -0.1, 0); tail.rotation.z = 0.5;
  // 4 chân: đùi + ống chân có khớp gối
  const legs = [];
  for (const [lx, lz] of [[0.75, 0.28], [0.75, -0.28], [-0.8, 0.28], [-0.8, -0.28]]) {
    const hip = new THREE.Group(); hip.position.set(lx, -0.25, lz); body.add(hip);
    add(new THREE.CylinderGeometry(0.12, 0.09, 0.8, 8), tan, hip, 0, -0.4, 0);
    const knee = new THREE.Group(); knee.position.y = -0.8; hip.add(knee);
    add(new THREE.CylinderGeometry(0.075, 0.06, 0.72, 8), tan, knee, 0, -0.36, 0);
    add(new THREE.SphereGeometry(0.1, 8, 6), dark, knee, 0.03, -0.72, 0).scale.set(1.4, 0.5, 1.1);
    legs.push({ hip, knee, side: lz > 0 ? 0 : Math.PI });
  }
  g.visible = false; g.scale.setScalar(1.15);
  scene.add(g);
  let st = "wait", t = 0, wait = 14 + Math.random() * 10, dir = 1, stopX = 0, speed = 0, phase = 0;
  return {
    update(dt, camX, trainX) {
      t += dt;
      if (st === "wait") { if (t > wait) { st = "enter"; t = 0; dir = Math.random() < 0.5 ? 1 : -1; g.position.set(camX - dir * 34, 0, -16 - Math.random() * 10); stopX = camX + (Math.random() - 0.5) * 16; g.visible = true; speed = 5.5; } return; }
      let moving = true;
      if (st === "enter") { g.position.x += dir * speed * dt; g.rotation.y = dir > 0 ? 0 : Math.PI; if ((stopX - g.position.x) * dir <= 0) { st = "watch"; t = 0; } }
      else if (st === "watch") {
        moving = false;
        // quay mặt về phía đoàn tàu (trục +x của mô hình là hướng mặt)
        const want = Math.atan2(g.position.z, trainX - g.position.x);
        let d = want - g.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d));
        g.rotation.y += d * Math.min(1, dt * 2);
        if (t > 5 + Math.random() * 0.02) { st = "leave"; t = 0; dir = Math.random() < 0.5 ? 1 : -1; }
      } else if (st === "leave") {
        g.position.x += dir * 6.5 * dt; g.position.z -= 2.6 * dt;
        g.rotation.y += ((dir > 0 ? 0.35 : Math.PI - 0.35) - g.rotation.y) * Math.min(1, dt * 3);
        if (Math.abs(g.position.x - camX) > 60 || t > 12) { st = "wait"; t = 0; wait = 35 + Math.random() * 30; g.visible = false; }
      }
      // dáng chạy: đùi vung, gối gập, thân nhún; đứng xem thì đầu gật nhẹ
      phase += dt * (moving ? 9 : 0);
      for (const L of legs) {
        const a = moving ? Math.sin(phase + L.side) : 0;
        L.hip.rotation.z = a * 0.55; L.knee.rotation.z = moving ? -Math.max(0, Math.sin(phase + L.side + 1.2)) * 0.9 : 0;
      }
      body.position.y = 1.75 + (moving ? Math.abs(Math.sin(phase)) * 0.1 : 0);
      neck.rotation.z = moving ? Math.sin(phase * 2) * 0.06 : Math.sin(t * 2) * 0.05 + 0.1;
      head.rotation.z = moving ? 0 : Math.sin(t * 1.3) * 0.12;
    },
  };
}

// ============================================================ ĐÀN CHIM đuổi nhau, đôi khi có ĐẠI BÀNG rượt (1e: bay LIỀN MẠCH)
// Mỗi con có vị trí + VẬN TỐC thật; lái mượt về phía điểm đích (con đầu đàn đi theo đường cong êm, các con khác bám
// theo vị trí xoay vòng quanh con đầu ⇒ vượt nhau, tụt lại). Hướng thân quay theo vận tốc đã làm mượt ⇒ không giật, không nháy.
// Đại bàng lái về con mồi, đổi mồi từ từ (không nhảy chỗ).
export function createBirdFlocks(scene) {
  // 1ab: dựng lại chim THẬT (thầy: "đại bàng trông giả quá, cần có mỏ và đuôi bình thường") — thân tròn thon (lathe), đầu + cổ,
  // MỎ khoằm vàng, mắt, ĐUÔI quạt mép lượn sóng, chân vàng co dưới bụng; cánh 2 KHỚP (cánh trong + bàn cánh có 5 "ngón" lông)
  // vỗ lệch pha như chim thật; đại bàng vỗ vài nhịp rồi LƯỢN, nghiêng mình khi đổi hướng. Hình dùng chung (không tạo lại mỗi đàn).
  const DS = THREE.DoubleSide;
  const M = {
    brown: new THREE.MeshStandardMaterial({ color: 0x4a3120, roughness: 0.95, side: DS }),
    brownDark: new THREE.MeshStandardMaterial({ color: 0x22160c, roughness: 0.95, side: DS }),
    white: new THREE.MeshStandardMaterial({ color: 0xf1ede2, roughness: 0.9, side: DS }),
    yellow: new THREE.MeshStandardMaterial({ color: 0xe3a92b, roughness: 0.5 }),
    eye: new THREE.MeshStandardMaterial({ color: 0x1a1208, roughness: 0.3 }),
    small: new THREE.MeshStandardMaterial({ color: 0x2c2420, roughness: 1, side: DS }),
    smallBeak: new THREE.MeshStandardMaterial({ color: 0x4a4038, roughness: 0.6 }),
  };
  const flat = (pts, bend) => {   // hình phẳng (x ngang, y = hướng bay) ⇒ nằm ngang, y → +z; bend(x) uốn cong lên
    const sh = new THREE.Shape(); pts.forEach(([x, y], i) => i ? sh.lineTo(x, y) : sh.moveTo(x, y));
    const g = new THREE.ShapeGeometry(sh); g.rotateX(Math.PI / 2);
    if (bend) { const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, p.getY(i) + bend(p.getX(i), p.getZ(i))); }
    g.computeVertexNormals(); return g;
  };
  const lathe = prof => { const g = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 14); g.rotateX(Math.PI / 2); return g; };
  const G = {
    // đại bàng: dài ~1,15, sải cánh ~2,7 (tỉ lệ đại bàng đầu trắng thật)
    eBody: lathe([[0.001, -0.6], [0.08, -0.52], [0.16, -0.32], [0.21, -0.08], [0.22, 0.12], [0.17, 0.32], [0.11, 0.44], [0.001, 0.5]]),
    eHood: lathe([[0.175, 0.3], [0.17, 0.4], [0.155, 0.5], [0.13, 0.59], [0.095, 0.67], [0.05, 0.72], [0.001, 0.735]]),   // đầu + cổ trắng liền một khối
    eBeak: (() => { const g = new THREE.ConeGeometry(0.055, 0.17, 10); g.rotateX(Math.PI / 2); return g; })(),
    eHook: (() => { const g = new THREE.ConeGeometry(0.028, 0.09, 8); g.rotateX(Math.PI); g.rotateX(-0.55); return g; })(),
    eye: new THREE.SphereGeometry(0.022, 8, 6),
    eTail: flat([[-0.07, 0], [-0.25, -0.46], ...Array.from({ length: 9 }, (_, i) => [-0.25 + i * 0.0625, -0.5 - 0.035 * Math.cos(i * Math.PI)]), [0.25, -0.46], [0.07, 0]]),
    eLeg: (() => { const g = new THREE.CylinderGeometry(0.028, 0.022, 0.2, 6); g.rotateX(Math.PI / 2); return g; })(),
    eArm: flat([[0, 0.19], [0.5, 0.16], [0.5, -0.32], [0.25, -0.35], [0, -0.3]], x => 0.03 * Math.sin(x * 5)),
    eHand: flat([[-0.06, 0.165], [0, 0.16], [0.28, 0.11], [0.46, 0.04],
      [0.78, 0.0], [0.77, -0.04], [0.54, -0.06], [0.82, -0.09], [0.8, -0.13], [0.54, -0.14], [0.8, -0.18], [0.77, -0.22], [0.52, -0.21],
      [0.74, -0.27], [0.7, -0.3], [0.48, -0.27], [0.64, -0.34], [0.58, -0.36], [0.36, -0.33], [0, -0.32], [-0.06, -0.32]], x => 0.07 * x * x),
    // chim nhỏ: cánh nhọn thon (kiểu nhạn), đuôi chẻ
    sBody: lathe([[0.001, -0.42], [0.07, -0.34], [0.12, -0.12], [0.13, 0.05], [0.1, 0.22], [0.001, 0.3]]),
    sHead: new THREE.SphereGeometry(0.1, 10, 8),
    sBeak: (() => { const g = new THREE.ConeGeometry(0.03, 0.11, 6); g.rotateX(Math.PI / 2); return g; })(),
    sTail: flat([[-0.04, 0], [-0.14, -0.36], [-0.05, -0.24], [0, -0.26], [0.05, -0.24], [0.14, -0.36], [0.04, 0]]),
    sArm: flat([[0, 0.1], [0.34, 0.08], [0.34, -0.14], [0, -0.16]]),
    sHand: flat([[-0.04, 0.08], [0, 0.08], [0.3, 0.02], [0.7, -0.14], [0.26, -0.13], [0, -0.14], [-0.04, -0.14]], x => 0.05 * x * x),
  };
  const part = (parent, geo, mat, x, y, z, sx = 1, sy = 1, sz = 1) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); parent.add(m); return m; };
  function wing(rig, side, eagle) {   // side = 1 trái (+x), -1 phải (lật gương)
    const root = new THREE.Group(); root.position.set(side * (eagle ? 0.12 : 0.07), eagle ? 0.07 : 0.04, eagle ? 0.06 : 0.02); root.scale.x = side; rig.add(root);
    part(root, eagle ? G.eArm : G.sArm, eagle ? M.brown : M.small, 0, 0, 0);
    const hand = new THREE.Group(); hand.position.x = eagle ? 0.5 : 0.34; root.add(hand);
    part(hand, eagle ? G.eHand : G.sHand, eagle ? M.brownDark : M.small, 0, 0, 0);
    return { root, hand };
  }
  function bird(eagle) {
    const g = new THREE.Group(), rig = new THREE.Group(); g.add(rig);
    if (eagle) {
      part(rig, G.eBody, M.brown, 0, 0, 0, 1, 0.85, 1);
      part(rig, G.eHood, M.white, 0, 0.03, 0, 1, 0.92, 1);
      part(rig, G.eBeak, M.yellow, 0, 0.02, 0.77, 1, 1.35, 1);
      part(rig, G.eHook, M.yellow, 0, -0.01, 0.85);                        // chóp mỏ khoằm xuống
      for (const sx of [-1, 1]) part(rig, G.eye, M.eye, sx * 0.082, 0.08, 0.63);
      const tail = part(rig, G.eTail, M.white, 0, 0.02, -0.5); tail.rotation.x = -0.08;
      for (const sx of [-1, 1]) part(rig, G.eLeg, M.yellow, sx * 0.06, -0.13, -0.3);
    } else {
      part(rig, G.sBody, M.small, 0, 0, 0, 1, 0.85, 1);
      part(rig, G.sHead, M.small, 0, 0.05, 0.3);
      part(rig, G.sBeak, M.smallBeak, 0, 0.04, 0.42);
      part(rig, G.sTail, M.small, 0, 0.01, -0.36);
    }
    const L = wing(rig, 1, eagle), R = wing(rig, -1, eagle);
    g.userData = { rig, L, R, ph: Math.random() * 6, eagle, bank: 0 };
    g.scale.setScalar(eagle ? 1.9 : 1.1);
    scene.add(g); return g;
  }
  // vỗ cánh: cánh trong lên xuống, bàn cánh trễ pha (gập khi vỗ lên, duỗi khi đập xuống) — như chim thật
  function flap(m, time) {
    const u = m.userData; let a, h;
    if (u.eagle) {   // vỗ 3 nhịp (~1,4 s) rồi lượn ~3 s, cánh hơi nhấc chữ V khi lượn
      const P = 4.4, c = (time + u.ph) % P, env = c < 1.45 ? Math.sin(Math.PI * Math.min(1, c / 1.45)) : 0, w = 2 * Math.PI * 2.1 * c;
      a = 0.13 + env * 0.62 * Math.sin(w); h = 0.08 + env * 0.5 * Math.sin(w - 0.9) + (1 - env) * Math.sin(time * 0.9 + u.ph) * 0.03;
    } else {
      const w = time * 12 + u.ph; a = 0.1 + 0.75 * Math.sin(w); h = 0.1 + 0.55 * Math.sin(w - 1.1);
    }
    u.L.root.rotation.z = a; u.R.root.rotation.z = -a; u.L.hand.rotation.z = h; u.R.hand.rotation.z = h;
  }
  const UP = new THREE.Vector3(0, 1, 0), tmp = new THREE.Vector3(), des = new THREE.Vector3(), m4 = new THREE.Matrix4(), qT = new THREE.Quaternion();
  // lái: gia tốc về phía đích, giới hạn tốc độ; hướng thân nội suy cầu (slerp) theo vận tốc; 1ab: nghiêng mình vào vòng cua
  function steer(o, target, maxSpeed, accel, dt) {
    des.subVectors(target, o.pos);
    const dist = des.length(); if (dist > 1e-4) des.multiplyScalar(Math.min(maxSpeed, dist * 1.5) / dist);
    const px = o.vel.x, pz = o.vel.z;
    tmp.subVectors(des, o.vel); const a = tmp.length(); if (a > accel * dt) tmp.multiplyScalar(accel * dt / a);
    o.vel.add(tmp);
    o.pos.addScaledVector(o.vel, dt);
    o.m.position.copy(o.pos);
    const hv = Math.hypot(px, pz) * Math.hypot(o.vel.x, o.vel.z);
    const rate = hv > 1e-3 && dt > 0 ? (pz * o.vel.x - px * o.vel.z) / hv / dt : 0;   // tốc độ đổi hướng (rad/s), + = rẽ về phía cánh trái
    const u = o.m.userData; u.bank += (Math.max(-0.8, Math.min(0.8, -rate * 0.9)) - u.bank) * Math.min(1, dt * 3); u.rig.rotation.z = u.bank;
    if (o.vel.lengthSq() > 0.01) {
      m4.lookAt(tmp.set(0, 0, 0), tmp.clone().sub(o.vel), UP);   // trục +z mô hình = hướng bay
      qT.setFromRotationMatrix(m4);
      o.m.quaternion.slerp(qT, Math.min(1, dt * 5));
    }
  }
  let flock = null, wait = 2 + Math.random() * 2, t = 0;   // 1q: đàn chim ra sớm cho màn chờ
  function spawn(camX) {
    const dir = Math.random() < 0.5 ? 1 : -1;
    const n = 6 + Math.floor(Math.random() * 6);
    const lead = new THREE.Vector3(camX - dir * 150, 45 + Math.random() * 15, -130 - Math.random() * 60);
    flock = { dir, t: 0, lead, birds: [], eagle: null, prey: 0, preyT: 0 };
    for (let i = 0; i < n; i++) {
      const m = bird(false), pos = lead.clone().add(new THREE.Vector3((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 10));
      m.position.copy(pos);
      flock.birds.push({ m, pos, vel: new THREE.Vector3(dir * 12, 0, 0), off: new THREE.Vector3((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 8), sp: 0.4 + Math.random() * 0.6, k: Math.random() * 6 });
    }
    if (Math.random() < 0.5) { const m = bird(true), pos = lead.clone().add(new THREE.Vector3(-dir * 22, 6, 0)); m.position.copy(pos); flock.eagle = { m, pos, vel: new THREE.Vector3(dir * 14, 0, 0) }; }
  }
  const goal = new THREE.Vector3();
  return {
    update(dt, time, camX) {
      if (!flock) { t += dt; if (t > wait) { t = 0; spawn(camX); } return; }
      const F = flock; F.t += dt;
      const speed = F.eagle ? 15 : 11;
      // con đầu đàn: đường cong êm (vận tốc đổi chậm)
      F.lead.x += F.dir * speed * dt; F.lead.y += Math.sin(F.t * 0.5) * 2.2 * dt; F.lead.z += Math.cos(F.t * 0.37) * 3 * dt;
      for (const b of F.birds) {
        goal.set(Math.sin(F.t * b.sp + b.k) * 6 + b.off.x, Math.cos(F.t * b.sp * 1.2 + b.k) * 2.5 + b.off.y, Math.sin(F.t * b.sp * 0.8 + b.k * 2) * 4 + b.off.z);
        if (F.eagle) goal.multiplyScalar(0.8);
        goal.add(F.lead);
        steer(b, goal, speed * 1.5, 18, dt);
        flap(b.m, time);
      }
      if (F.eagle) {
        F.preyT += dt; if (F.preyT > 4) { F.preyT = 0; F.prey = (F.prey + 1 + Math.floor(Math.random() * 2)) % F.birds.length; }
        const prey = F.birds[F.prey];
        goal.copy(prey.pos).add(tmp.set(-F.dir * 4, 2.5 + Math.sin(F.t * 1.3) * 1.5, 0));
        steer(F.eagle, goal, speed * 1.35, 10, dt);
        flap(F.eagle.m, time);
      }
      if (Math.abs(F.lead.x - camX) > 200 && F.t > 5) {
        [...F.birds.map(b => b.m), F.eagle && F.eagle.m].filter(Boolean).forEach(m => scene.remove(m));   // 1ab: hình dùng chung — không dispose
        flock = null; wait = 20 + Math.random() * 22;
      }
    },
    bird, flap,   // 1ab: bàn thử soi cận
  };
}
