// BỤI CỎ SA MẠC (bunchgrass) — bản 1n (29/9/2026)
// Thầy gửi ảnh đồng đất đỏ có các bụi cỏ khô lác đác ⇒ thay toàn bộ cây cỏ mặt đất (trừ xương rồng) bằng loại bụi này.
// Mỗi bụi dựng bằng HÌNH THẬT: vài chục lá mảnh mọc toả từ một gốc chụm, cong rủ ra ngoài, thon dần về ngọn,
// gốc sẫm → giữa vàng rơm → ngọn bạc nhạt; vài cọng trổ bông. Không dùng ảnh dán nên nhìn nghiêng/nhìn gần đều có khối.
// GRASS_STYLES: 5 mẫu để thầy chọn (?co=0..4).
import * as THREE from "../../rocket-race/vendor/three/three.module.min.js";

export const GRASS_STYLES = [
  { name: "Bụi cỏ như ảnh", n: 900, s: [0.55, 1.05], blades: [130, 30], h: 1.25, lean: 0.85, pal: "straw", heads: 0.12 },
  { name: "Bụi cỏ thưa, to", n: 420, s: [0.9, 1.5], blades: [170, 40], h: 1.35, lean: 0.9, pal: "straw", heads: 0.15 },
  { name: "Bụi cỏ dày, thấp", n: 1600, s: [0.4, 0.78], blades: [90, 22], h: 0.9, lean: 0.95, pal: "straw", heads: 0.05 },
  { name: "Bụi cỏ + bụi ngải xám", n: 700, s: [0.55, 1.05], blades: [130, 30], h: 1.25, lean: 0.85, pal: "straw", heads: 0.1, sage: 34 },
  { name: "Bụi cỏ ánh bạc có bông", n: 850, s: [0.55, 1.1], blades: [130, 30], h: 1.3, lean: 0.7, pal: "silver", heads: 0.4 },
];
export const CO = (() => { try { const v = parseInt(new URLSearchParams(location.search).get("co"), 10); return v >= 0 && v < GRASS_STYLES.length ? v : 0; } catch { return 0; } })();

function mulberry(s) { return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const PAL = {
  straw: { base: [0.26, 0.18, 0.1], mid: [0.52, 0.38, 0.22], tip: [0.76, 0.6, 0.38], alt: [[0.6, 0.58, 0.48], [0.56, 0.54, 0.36], [0.74, 0.6, 0.4]] },
  silver: { base: [0.26, 0.22, 0.16], mid: [0.62, 0.6, 0.52], tip: [0.88, 0.86, 0.8], alt: [[0.7, 0.68, 0.62], [0.58, 0.56, 0.46], [0.78, 0.72, 0.6]] },
};

// một bụi: `nb` lá toả từ gốc; trả về BufferGeometry (vị trí, pháp tuyến ngả lên, màu từng đỉnh)
function bunchGeometry(seed, nb, H, lean, pal, heads) {
  const r = mulberry(seed), P = PAL[pal], pos = [], nor = [], col = [], idx = [];
  const SEG = 4;
  const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const blade = (bx, bz, az, tilt, L, w0, cBase, cMid, cTip, head) => {
    const dx = Math.cos(az), dz = Math.sin(az), wx = -dz, wz = dx, v0 = pos.length / 3;
    const droop = L * (0.25 + tilt * 0.75);   // ngọn rủ xuống ⇒ bụi tròn như đài phun
    for (let k = 0; k <= SEG; k++) {
      const s = k / SEG, out = Math.sin(tilt) * L * s + droop * 0.35 * s * s, up = Math.cos(tilt) * L * s - droop * s * s;
      const cx = bx + dx * out, cy = Math.max(0, up), cz = bz + dz * out;
      const w = w0 * Math.pow(1 - s, 0.75) + (head && s > 0.7 ? w0 * 0.9 : 0.0015);
      pos.push(cx - wx * w, cy, cz - wz * w, cx + wx * w, cy, cz + wz * w);
      const ny = 1, nx = dx * 0.7, nz = dz * 0.7, l = Math.hypot(nx, ny, nz);
      nor.push(nx / l, ny / l, nz / l, nx / l, ny / l, nz / l);
      const c = s < 0.45 ? lerp3(cBase, cMid, s / 0.45) : lerp3(cMid, cTip, (s - 0.45) / 0.55);
      col.push(...c, ...c);
    }
    for (let k = 0; k < SEG; k++) { const a = v0 + k * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  };
  for (let i = 0; i < nb; i++) {
    const rr = Math.sqrt(r()) * 0.07, a0 = r() * Math.PI * 2;
    const inner = r();   // lá giữa đứng thẳng, lá ngoài ngả ra
    const tilt = (0.08 + inner * inner * 0.95) * lean, L = H * (0.55 + r() * 0.45) * (1 - inner * 0.25);
    const tint = r() < 0.25 ? P.alt[Math.floor(r() * P.alt.length)] : null, j = 0.9 + r() * 0.2;
    const mid = (tint || P.mid).map(v => v * j), tip = lerp3(P.tip, tint || P.tip, 0.3).map(v => Math.min(1, v * j));
    blade(Math.cos(a0) * rr, Math.sin(a0) * rr, a0 + (r() - 0.5) * 0.6, tilt, L, 0.013 + r() * 0.01, P.base, mid, tip, false);
  }
  const nh = Math.round(nb * heads * 0.25);
  for (let i = 0; i < nh; i++) {   // cọng trổ bông: mảnh, cao hơn, ngọn là bông hạt dẹt nhạt
    const a0 = r() * Math.PI * 2;
    blade(0, 0, a0, (0.1 + r() * 0.35) * lean, H * (1.05 + r() * 0.35), 0.008, P.base, P.mid, [0.92, 0.88, 0.76], true);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  return g;
}

export function makeBunchKit(style) {
  const S = style;
  // 3 dáng bụi gần (nhiều lá) + 1 dáng tầm giữa (nửa số lá) + 1 dáng xa (ít lá)
  const near = [0, 1, 2].map(k => bunchGeometry(101 + k * 17 + S.blades[0], S.blades[0], S.h, S.lean, S.pal, S.heads));
  const mid = bunchGeometry(211 + S.blades[0], Math.round(S.blades[0] * 0.5), S.h, S.lean, S.pal, S.heads);
  const far = bunchGeometry(301 + S.blades[1], S.blades[1], S.h, S.lean, S.pal, S.heads);
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 1, metalness: 0, envMapIntensity: 0.35 });
  mat.customProgramCacheKey = () => "bunch1n";
  mat.onBeforeCompile = sh => {
    sh.uniforms.time = { value: 0 }; mat.userData.shader = sh;
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nuniform float time;")
      .replace("#include <begin_vertex>", `vec3 transformed = vec3(position);
        #ifdef USE_INSTANCING
          float ph = instanceMatrix[3].x * 0.35 + instanceMatrix[3].z * 0.21;
        #else
          float ph = 0.;
        #endif
        float gust = 0.55 + 0.45 * sin(time * 0.5 + ph * 0.1);
        float hh = position.y * position.y;
        transformed.x += hh * 0.06 * gust * sin(time * 1.7 + ph);
        transformed.z += hh * 0.03 * cos(time * 1.2 + ph);`);
    // nắng xuyên lá cỏ khô (giờ vàng ngược sáng không đen sì)
    sh.fragmentShader = sh.fragmentShader.replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\n totalEmissiveRadiance += diffuseColor.rgb * vec3(0.18, 0.15, 0.1);");
  };
  return { geos: [...near, mid, far], mat };   // 0–2 gần, 3 giữa, 4 xa
}
