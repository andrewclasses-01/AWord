// RACING WORDS mẫu 3p (15/10/2026, thầy: "khá lag — tham khảo cách tối ưu của Train Rush") = sr3d-car-3o.js + GỘP MẢNH:
//   đo Chrome thật (RTX 4060): 1.092 lệnh vẽ/khung, ~1.000 là của 2 xe — xe Sketchfab ~250 mảnh lưới, lại thêm bản sao "mũi xe" ở buồng lái,
//   frustumCulled tắt (thế giới cong) ⇒ CPU 9 ms/khung chỉ để gửi lệnh vẽ; hạ độ nét không đỡ được. Nay mỗi xe GỘP mọi mảnh TĨNH cùng vật liệu
//   thành 1 mảnh (mergeStatic) — bánh (đã tách vào trục quay) để riêng; cây mảnh gốc giữ NGOÀI cảnh (ghost) chỉ để bắn tia / dán vết cháy.
//   · ĐO SẴN: dựng 1 xe tốn 0,2–3,6 s (đo: ~97 % là raycast ~20 ms/tia × 150–300 tia tìm nóc / chân kính / capô / chỗ biển số), mỗi xe dựng 2 lần
//     (xưởng + trận) ⇒ "LOADING CARS rất lâu" + đổi xe bị đơ. Kết quả chỉ phụ thuộc mẫu xe ⇒ bảng sr3d-carmeta-3p.js (đo sẵn 13 xe) + nhớ trong
//     phiên (xe lạ đo 1 lần). carMeta() trả bảng đang nhớ (bàn thử sinh lại bảng khi đổi xe).
//   · kính transmission ⇒ kính trong suốt thường (noTransmission)
// RACING WORDS mẫu 3o = sr3d-car-3l.js (lửa pô thật), chỉ đổi nguồn xe sang sr3d-xe3d-3o.js (13 xe, bỏ Bugatti Divo CC-BY-NC — thầy chốt khi đưa lên AWord).
// =============================================================
// SPEED RUN 3D — XE 3D THẬT mẫu 3l (15/10/2026) = sr3d-car-3k.js + LỬA PÔ THẬT (thầy: "lửa xì ra từ xe trông giả quá, muốn giống thật"):
//   · thân lửa = 3 tấm cắt chéo quanh trục ống xả + 1 ĐĨA lửa quay ra sau (xe đối thủ nhìn đuôi xe mình từ phía sau ⇒ tấm dọc bị nhìn cạnh, cần đĩa);
//     hình lửa sinh bằng NHIỄU fbm cuộn theo thời gian: mép rách, lưỡi lửa tách ra, chập chờn mỗi khung; màu theo NHIỆT trắng → vàng → cam → đỏ sẫm
//   · boost: lửa dài, lõi XANH sát miệng ống + vòng kim cương (shock diamond) khi boost mạnh · pô nổ (màn chờ): lửa ngắn, phình, vàng hơn
//   · ĐÈN cam chập chờn ở đuôi xe ⇒ hắt sáng lên đuôi xe + mặt đường
// ---- gốc 3k ----
// SPEED RUN 3D — XE 3D THẬT mẫu 3k (15/10/2026) = sr3d-car-3j.js + thầy chỉnh:
//   · BÁNH LUÔN LĂN: góc quay CỘNG DỒN theo quãng đường mỗi khung (không tính lại từ tổng quãng đường), giới hạn 0,42 rad/khung
//     ⇒ xe rất nhanh vẫn thấy lăn TỚI (hết hiện tượng "bánh xe đứng / quay ngược" do hình 5 chấu trùng nhịp khung hình)
//   · 4 xe gộp bánh vào chung mảnh (Centenario, Zonda, P1 GTR, 720S) ⇒ TÁCH tam giác bánh theo 4 góc thành 4 mảnh riêng (dùng chung bộ đỉnh,
//     chỉ tạo chỉ số tam giác mới — KHÔNG sửa hình gốc vì các bản sao xe dùng chung) ⇒ cả 14 xe đều quay bánh
//   · ỐNG XẢ thật: dò mảnh/vật liệu tên exhaust/muffler/tailpipe ⇒ lửa pô đặt đúng miệng ống; update(…, pop) = xịt lửa ở màn chờ
// ---- gốc 3j ----
// SPEED RUN 3D — XE 3D THẬT mẫu 3j (15/10/2026) = sr3d-car-3i.js + thầy chỉnh:
//   · BUỒNG LÁI THẬT: mũi xe nhìn từ ghế lái = CHÍNH mũi xe đang chọn (bản sao xe, CẮT bằng mặt phẳng ở chân kính chắn gió — clippingPlanes,
//     lõi phải bật renderer.localClippingEnabled); mắt tài xế (eye/look) tính theo từng xe: sau chân kính 0,32 m, cao hơn mép capô 0,15 m.
//     Chân kính = điểm đầu tiên (từ mũi ra sau) tia chiếu xuống trúng vật liệu KÍNH.
//   · BIỂN SỐ "ANDREW TEAM" trước + sau: xe có mảnh biển gốc (License_Plate / ManufacturerPlate) ⇒ ẩn biển gốc, đặt đúng chỗ đó;
//     không có ⇒ dò mặt cản (tia ngang, lấy chỗ mặt phẳng quay ra ngoài ở độ cao gần 0,45 m sau / 0,36 m trước).
//   · TRÚNG TÊN LỬA: burn() chọn 1 điểm trên thân (tia từ bên hông/nóc) ⇒ lõi phun LỬA + khói tại đó ~2,6 s, rồi vết CHÁY ĐEN loang lổ
//     (DecalGeometry dán lên chính mảnh thân) hiện dần và ở lại tới hết trận (clearBurns khi đua lại).
// ---- gốc 3i ----
// SPEED RUN 3D — XE 3D THẬT trong game (mẫu 3i, 15/10/2026)
// Bọc xe Sketchfab (sr3d-xe3d.js) thành ĐÚNG giao diện makeCar của sr3d-car-1.js để lõi game dùng như cũ:
//   { rig, body, M, wheels, update(dt, {dist, accel, brake, steer, boost, t}), dispose() }
// rig → body (nhún/nghiêng) → xe đã chuẩn hóa (mũi −z, bánh y 0). M đo từ khung bao thật: L, W, r (bán kính bánh), top/roof (độ cao nóc
// đo bằng tia chiếu từ trên xuống ⇒ bệ tên lửa đặt đúng trên nóc, không bị cánh gió đánh lừa).
// Bánh QUAY: nhận mảnh TRÒN ở 4 góc (xem chú thích ở dưới) ⇒ mỗi góc 1 trục quay; mẫu gộp cả 4 bánh vào 1 mảnh ⇒ không quay (vẫn chạy được).
// Đèn PHANH: vật liệu tên tail/brake/rear light/stop… ⇒ sáng đỏ khi phanh. Mọi vật liệu qua `bend` (thế giới cong).
// =============================================================
import * as THREE from "../../rocket-race/vendor/three/three.module.min.js";
import { DecalGeometry } from "../../rocket-race/vendor/three/addons/DecalGeometry.js";
import { XE, buildXe, setPaint } from "./sr3d-xe3d-3o.js";
import { CAR_META } from "./sr3d-carmeta-3p.js";
// 3q: = sr3d-car-3p.js, lửa pô cong theo tiếp tuyến như sr3d-world-3q.js

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const WHEEL_RE = /wheel|rim|tyre|tire|jante|pneu|rueda|llanta|felge|reifen|disc|disk|brake_?rotor|hub/i;
const NOT_WHEEL_RE = /steer|volant|spare|interior|cockpit|seat|calip|callip/i;
const TAIL_RE = /tail|brake_?light|rear_?light|stop_?light|lig?ht_?red|backlight|light_?r(ear)?\b|LIGT_RED/i;

// biển số ANDREW TEAM (EU dài 520 × 110 mm): nền trắng, viền đen, dải màu đội bên trái có chữ AT
const PLATE = {};
function plateTex(color) {
  if (PLATE[color]) return PLATE[color];
  const c = document.createElement("canvas"); c.width = 1024; c.height = 216; const g = c.getContext("2d");
  const rr = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  g.fillStyle = "#111"; rr(0, 0, 1024, 216, 26); g.fill();
  g.fillStyle = "#f4f5f2"; rr(10, 10, 1004, 196, 18); g.fill();
  g.fillStyle = color; rr(10, 10, 118, 196, 18); g.fill(); g.fillRect(90, 10, 38, 196);
  g.fillStyle = "#fff"; g.font = "italic 900 54px 'Exo 2', 'Arial Black', sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("AT", 69, 112);
  g.strokeStyle = "#111"; g.lineWidth = 7; rr(22, 22, 980, 172, 12); g.stroke();
  g.fillStyle = "#111"; g.font = "italic 900 124px 'Exo 2', 'Arial Black', sans-serif"; g.fillText("ANDREW TEAM", 570, 116, 840);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return (PLATE[color] = t);
}
// vết cháy: mảng đen loang lổ, mép rách (nhiều đốm chồng nhau), lõi hơi nâu cháy
let SCORCH = null;
function scorchTex() {
  if (SCORCH) return SCORCH;
  const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d");
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let k = 0; k < 70; k++) {
    const a = rnd() * Math.PI * 2, d = Math.pow(rnd(), 0.8) * 92, x = 128 + Math.cos(a) * d, y = 128 + Math.sin(a) * d, r = 14 + rnd() * 38 * (1 - d / 140);
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(8,6,5,${0.55 + rnd() * 0.35})`); gr.addColorStop(0.7, "rgba(12,9,7,.35)"); gr.addColorStop(1, "rgba(12,9,7,0)");
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  const core = g.createRadialGradient(128, 128, 0, 128, 128, 60); core.addColorStop(0, "rgba(40,22,10,.55)"); core.addColorStop(1, "rgba(40,22,10,0)");
  g.fillStyle = core; g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return (SCORCH = t);
}
const isGlass = m => !!m && m.transparent && /glass|window|wind|luna|vetro|vitre|win_|crist/i.test(m.name) && !/head|tail|light|red|badge|turn|int/i.test(m.name);
const PLATE_RE = /licen[sc]e_?plate(?!_?light)|manufacturer_?plate|number_?plate/i;

let SHADOW = null;
function shadowTex() {
  if (SHADOW) return SHADOW;
  const c = document.createElement("canvas"); c.width = 128; c.height = 256; const g = c.getContext("2d");
  const r0 = g.createRadialGradient(64, 128, 10, 64, 128, 128);
  r0.addColorStop(0, "rgba(0,0,0,.8)"); r0.addColorStop(0.55, "rgba(0,0,0,.5)"); r0.addColorStop(1, "rgba(0,0,0,0)");
  g.save(); g.scale(1, 2); g.fillStyle = r0; g.translate(0, -64); g.fillRect(0, 0, 128, 256); g.restore();
  return (SHADOW = new THREE.CanvasTexture(c));
}
const FLAME_VS = `uniform vec2 uBend; uniform float uBendZ; varying vec2 vUv;
void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position,1.0); float d = min(w.z - uBendZ, 0.0); float a = -d; float q = a <= 150.0 ? a*a : 150.0*(2.0*a - 150.0); w.x += uBend.x*q; w.y -= uBend.y*q; gl_Position = projectionMatrix * viewMatrix * w; }`;
// 3l: lửa thật — uEnd 0 = tấm dọc (vUv.y = dọc luồng lửa từ miệng ống), 1 = đĩa nhìn từ sau (toạ độ cực)
const FLAME_FS = `uniform float uT; uniform float uK; uniform float uPop; uniform float uSeed; uniform float uEnd; varying vec2 vUv;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }
float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * noise(p); p = p * 2.03 + 1.7; a *= 0.5; } return s; }
vec3 heatCol(float h){
  vec3 c = vec3(0.6, 0.05, 0.0);
  c = mix(c, vec3(1.0, 0.28, 0.02), smoothstep(0.05, 0.3, h));
  c = mix(c, vec3(1.0, 0.62, 0.12), smoothstep(0.3, 0.65, h));
  return mix(c, vec3(1.0, 0.95, 0.82), smoothstep(0.8, 1.05, h));
}
void main(){
  float flick = 0.82 + 0.36 * hash(vec2(floor(uT * 32.0), uSeed));
  float a, heat; vec3 col;
  if (uEnd > 0.5) {
    vec2 p = vUv * 2.0 - 1.0; float r = length(p), ang = atan(p.y, p.x);
    float n = fbm(vec2(ang * 1.6 + uSeed, r * 3.0 - uT * 9.0));
    a = 1.0 - smoothstep(0.18 + 0.55 * n, 0.95, r);
    heat = a * (1.0 - r) * (0.6 + 0.5 * n);
    col = heatCol(heat);
    col = mix(col, vec3(0.6, 0.75, 1.0), (1.0 - smoothstep(0.0, 0.32, r)) * (1.0 - uPop) * 0.6);
  } else {
    float v = vUv.y, u = vUv.x * 2.0 - 1.0;
    // "nhiệt" = khoảng cách tới trục (bề ngang lửa phình rồi thon) − độ xa miệng ống + nhiễu cuộn; chỉ chỗ nhiệt > ngưỡng mới cháy ⇒ lưỡi lửa rời, mép rách
    vec2 q = vec2(u * 2.2 + uSeed, v * 4.2 - uT * (9.0 + uPop * 6.0));
    float n = fbm(q), n2 = fbm(q * 2.6 + 4.7);
    float prof = mix(0.35, 1.0, smoothstep(0.0, 0.18, v)) * mix(1.0, 1.35, uPop);
    float uu = u + (n - 0.5) * 0.8 * v;
    float inten = (1.0 - abs(uu) / prof) * 1.35 - v * mix(1.05, 1.5, uPop) + (n - 0.5) * 1.3 + (n2 - 0.5) * 0.5 * v;
    inten *= smoothstep(0.0, 0.05, v);
    a = smoothstep(0.04, 0.3, inten);
    heat = clamp(inten, 0.0, 1.0);
    heat = heat * heat * (1.2 - 0.4 * v);
    col = heatCol(heat);
    float core = (1.0 - smoothstep(0.0, 0.26, v)) * (1.0 - smoothstep(0.0, 0.42, abs(u)));
    col = mix(col, vec3(0.5, 0.68, 1.0), core * (1.0 - uPop) * 0.7);       // lõi xanh khi boost
    float sd = (1.0 - uPop) * smoothstep(0.7, 1.0, uK) * pow(max(0.0, sin(v * 34.0)), 10.0) * (1.0 - smoothstep(0.05, 0.55, v)) * (1.0 - smoothstep(0.0, 0.28, abs(u)));
    col += vec3(0.65, 0.8, 1.0) * sd * 1.6;                                  // vòng kim cương (shock diamond)
  }
  float k = a * uK * flick;
  gl_FragColor = vec4(col * k * (uEnd > 0.5 ? 0.7 : 0.85), k);
}`;

// ---- 3p: gộp mảnh tĩnh theo vật liệu ----
// Mọi mảnh lưới (đang hiện) trong `src` ⇒ hình nướng sẵn toạ độ của `root`, gộp theo (vật liệu + bộ thuộc tính) ⇒ mảnh mới gắn vào root.
// Thuộc tính nén (meshopt: Int16/Int8 chuẩn hoá) đổi về Float32 trước khi nướng. Ma trận lật (định thức âm) ⇒ đảo chiều tam giác.
// Mảnh không gộp được (nhiều vật liệu, morph, skinned, instanced) ⇒ chuyển nguyên sang root (giữ vị trí thế giới).
// 3p: kính "transmission" (khúc xạ thật — Y4 Y5 Y6 H4 H7) bắt three.js VẼ LẠI CẢ CẢNH vào một ảnh nền cho mỗi camera, mỗi khung
//   (đo: 1 mảnh kính H4 kéo theo 192 lệnh vẽ) ⇒ đổi thành kính trong suốt thường (giữ màu / độ nhám, mờ 0,3–0,45).
function noTransmission(m) {
  if (!m || !(m.transmission > 0)) return;
  m.transmission = 0; m.transparent = true;
  m.opacity = m.opacity < 1 ? Math.min(0.45, Math.max(0.3, m.opacity + 0.08)) : 0.35;
  m.needsUpdate = true;
}
const MERGE_ATTRS = ["position", "normal", "uv", "uv1", "uv2", "color", "tangent"];
function toF32(a) {
  const n = a.count, k = a.itemSize, out = new Float32Array(n * k);
  for (let i = 0; i < n; i++) for (let j = 0; j < k; j++) out[i * k + j] = a.getComponent(i, j);
  return new THREE.BufferAttribute(out, k);
}
export function mergeStatic(root, src) {
  root.updateMatrixWorld(true);
  const inv = root.matrixWorld.clone().invert(), M4 = new THREE.Matrix4(), N3 = new THREE.Matrix3(), V3 = new THREE.Vector3();
  const groups = new Map(), loose = [];
  const shown = o => { for (let p = o; p && p !== root; p = p.parent) if (!p.visible) return false; return true; };
  src.traverse(o => {
    if (!o.isMesh || !shown(o)) return;
    const g = o.geometry;
    if (Array.isArray(o.material) || o.isSkinnedMesh || o.isInstancedMesh || !g.attributes.position || Object.keys(g.morphAttributes || {}).length) { loose.push(o); return; }
    const names = MERGE_ATTRS.filter(n => g.attributes[n]);
    const key = o.material.uuid + "|" + names.map(n => n + g.attributes[n].itemSize).join(",") + "|" + o.renderOrder;
    if (!groups.has(key)) groups.set(key, { mat: o.material, names, order: o.renderOrder, parts: [] });
    groups.get(key).parts.push(o);
  });
  const out = [];
  for (const { mat, names, order, parts } of groups.values()) {
    let nv = 0, ni = 0;
    for (const o of parts) { const g = o.geometry; nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
    const arr = {}; names.forEach(n => { arr[n] = new Float32Array(nv * parts[0].geometry.attributes[n].itemSize); });
    const idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
    let vo = 0, io = 0;
    for (const o of parts) {
      const g = o.geometry, cnt = g.attributes.position.count;
      M4.multiplyMatrices(inv, o.matrixWorld); N3.getNormalMatrix(M4);
      for (const n of names) {
        const a = g.attributes[n], k = a.itemSize, f = (a.array instanceof Float32Array && !a.isInterleavedBufferAttribute && !a.normalized) ? a : toF32(a), dst = arr[n];
        for (let i = 0; i < cnt; i++) {
          if (n === "position") { V3.fromBufferAttribute(f, i).applyMatrix4(M4); dst[(vo + i) * 3] = V3.x; dst[(vo + i) * 3 + 1] = V3.y; dst[(vo + i) * 3 + 2] = V3.z; }
          else if (n === "normal") { V3.fromBufferAttribute(f, i).applyMatrix3(N3).normalize(); dst[(vo + i) * 3] = V3.x; dst[(vo + i) * 3 + 1] = V3.y; dst[(vo + i) * 3 + 2] = V3.z; }
          else if (n === "tangent") { V3.set(f.getX(i), f.getY(i), f.getZ(i)).transformDirection(M4); const b = (vo + i) * 4; dst[b] = V3.x; dst[b + 1] = V3.y; dst[b + 2] = V3.z; dst[b + 3] = f.getW(i); }
          else for (let j = 0; j < k; j++) dst[(vo + i) * k + j] = f.getComponent(i, j);
        }
      }
      const flip = M4.determinant() < 0, gi = g.index;
      const m = gi ? gi.count : cnt;
      for (let t = 0; t < m; t += 3) {
        const a = gi ? gi.getX(t) : t, b = gi ? gi.getX(t + 1) : t + 1, c = gi ? gi.getX(t + 2) : t + 2;
        idx[io++] = vo + a; idx[io++] = vo + (flip ? c : b); idx[io++] = vo + (flip ? b : c);
      }
      vo += cnt;
    }
    const geo = new THREE.BufferGeometry();
    names.forEach(n => geo.setAttribute(n, new THREE.BufferAttribute(arr[n], parts[0].geometry.attributes[n].itemSize)));
    geo.setIndex(new THREE.BufferAttribute(idx, 1));
    geo.computeBoundingSphere(); geo.computeBoundingBox();
    const mesh = new THREE.Mesh(geo, mat); mesh.renderOrder = order; mesh.name = "merged:" + (mat.name || "");
    root.add(mesh); out.push(mesh);
  }
  loose.forEach(o => root.attach(o));
  return { meshes: out, geos: out.map(m => m.geometry), loose };
}

// 3p: CẮT MŨI XE BẰNG SHADER (thay material.clippingPlanes): renderer.compile()/compileAsync bỏ qua clippingPlanes của vật liệu ⇒ biến thể cắt
//   chỉ dịch được khi VẼ THẬT (đo: đứng 754 ms ở xưởng với Y4 + H7). Nay mặt phẳng là uniform + discard, khoá shader riêng "|hoodclip"
//   ⇒ dịch ngầm được như mọi vật liệu. So sánh trên vị trí ĐÃ CONG (bw — như clipping cũ so mvPosition đã cong); mũi xe sát camera nên gần như không cong.
function hoodClip(m, U) {
  const prev = m.onBeforeCompile, key = m.customProgramCacheKey;
  m.onBeforeCompile = (sh, r) => {
    if (prev) prev.call(m, sh, r);
    sh.uniforms.uHoodP = U;
    const tag = "gl_Position = projectionMatrix * mvPosition;";
    if (!sh.vertexShader.includes(tag)) console.warn("hoodClip: không thấy chỗ chèn");
    sh.vertexShader = "varying vec3 vHoodW;\n" + sh.vertexShader.replace(tag, tag + " vHoodW = bw.xyz;");
    sh.fragmentShader = "uniform vec4 uHoodP; varying vec3 vHoodW;\n" + sh.fragmentShader.replace("void main() {", "void main() {\n  if (dot(uHoodP.xyz, vHoodW) + uHoodP.w < 0.0) discard;");
  };
  m.customProgramCacheKey = () => (key ? key.call(m) : "") + "|hoodclip";
}

// 3p: số đo xe (nóc, chân kính, capô, chỗ biển số dò bằng tia) theo mã xe
const SO_DO = new Map();
export const carMeta = () => Object.fromEntries(SO_DO);

const nameChain = o => { let s = "", n = o; for (let k = 0; n && k < 4; k++, n = n.parent) s += " " + (n.name || ""); return s; };

/** makeCar3d({ id, color, num, bend, U }) — xe phải được prepXe(id) xong trước (buildXe đồng bộ). */
export function makeCar3d({ id = XE[0].id, color = "#3b8cff", num = 1, bend = m => m, U }) {
  const xe = buildXe(id), cfg = xe.userData.cfg;
  setPaint(xe, color);
  const rig = new THREE.Group(), body = new THREE.Group(); rig.add(body); body.add(xe);
  const sz = xe.userData.size;                                     // x = rộng, y = cao, z = dài
  const mats = new Set();
  xe.traverse(o => { if (!o.isMesh) return; (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => mats.add(m)); o.castShadow = o.receiveShadow = false; o.frustumCulled = false; });
  mats.forEach(noTransmission);                                   // 3p
  mats.forEach(m => { bend(m); if (m.envMapIntensity !== undefined) m.envMapIntensity = Math.max(m.envMapIntensity, 1.1); });
  xe.updateMatrixWorld(true);

  // ---- độ cao nóc: tia từ trên xuống ở giữa xe, dải dọc −25 % … +12 % chiều dài ----
  // 3j: lõi chuyển xe sang lớp riêng của đội ⇒ tia phải quét MỌI lớp (burn sau này)
  const ray = new THREE.Raycaster(), meshes = []; ray.layers.enableAll(); xe.traverse(o => { if (o.isMesh && !(o.material.transparent && o.material.opacity < 0.5)) meshes.push(o); });
  // 3p: số đo đã có (bảng đo sẵn / đã đo trong phiên) ⇒ bỏ qua toàn bộ tia dò
  const known = SO_DO.get(id) || CAR_META[id] || null, fresh = { pick: {} };
  let roofY = sz.y * 0.85, roofZ = 0, best = -1;
  if (known) ({ roofY, roofZ } = known);
  else for (let k = 0; k <= 10; k++) {
    const z = lerp(-0.25, 0.12, k / 10) * sz.z;
    ray.set(new THREE.Vector3(0, sz.y + 2, z), new THREE.Vector3(0, -1, 0));
    const h = ray.intersectObjects(meshes, false)[0];
    if (h && h.point.y > best && h.point.y < sz.y * 0.98) { best = h.point.y; roofZ = z; }
  }
  if (!known && best > 0.6) roofY = best;

  // ---- 3j: chân kính chắn gió (zWS) + mép capô (hoodY) + mắt tài xế ----
  const all = []; xe.traverse(o => { if (o.isMesh) all.push(o); });
  const DOWN = new THREE.Vector3(0, -1, 0), V = (x, y, z) => new THREE.Vector3(x, y, z);
  let zWS = known ? known.zWS : null;
  if (!known)
  for (let z = -sz.z / 2 + 0.3; z < roofZ + 0.3 && zWS == null; z += 0.03)
    for (const x of [0, 0.22, -0.22]) {
      ray.set(V(x, sz.y + 2, z), DOWN); const h = ray.intersectObjects(all, false)[0];
      if (h && h.point.y > 0.55 && isGlass(h.object.material)) { zWS = z; break; }
    }
  if (zWS == null) zWS = roofZ - 0.9;
  let hoodY = known ? known.hoodY : 0;
  if (!known)
  for (const x of [0, 0.25, -0.25, 0.45, -0.45]) { ray.set(V(x, sz.y + 2, zWS - 0.06), DOWN); const h = ray.intersectObjects(meshes, false).find(q => !isGlass(q.object.material)); if (h) hoodY = Math.max(hoodY, h.point.y); }
  if (hoodY < 0.5) hoodY = 0.85;
  // mắt SÁT mép capô (cao hơn 0,15 m, sau chân kính 0,32 m): màn chỉ thấy được tới ~25° dưới tầm mắt (dưới nữa là bảng điều khiển) ⇒ mắt cao thì capô
  // (siêu xe dốc xuống rất nhanh) lọt hết xuống dưới bảng; mắt thấp ⇒ capô + 2 vè trước nằm gọn trong khung như capô giả của mẫu cũ
  const eye = V(0, hoodY + 0.15, zWS + 0.32), look = V(0, eye.y - 0.24, eye.z - 9);
  const zCut = zWS + 0.02;

  // ---- 3j: biển số ANDREW TEAM trước + sau ----
  const plates = [], plateM = bend(new THREE.MeshStandardMaterial({ map: plateTex(color), roughness: 0.38, metalness: 0.1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  const plateG = new THREE.PlaneGeometry(0.46, 0.098);
  const addPlate = (p, rear) => { const m = new THREE.Mesh(plateG, plateM); m.position.copy(p); m.rotation.y = rear ? 0 : Math.PI; body.add(m); plates.push(m); };
  const orig = []; xe.traverse(o => { if (o.isMesh && PLATE_RE.test(o.name + " " + (o.parent?.name || ""))) orig.push(o); });
  const done = { rear: false, front: false };
  orig.forEach(o => { const b = new THREE.Box3().setFromObject(o), c = b.getCenter(V(0, 0, 0)); const rear = c.z > 0; if (done[rear ? "rear" : "front"]) { o.visible = false; return; }
    o.visible = false; done[rear ? "rear" : "front"] = true; addPlate(V(0, c.y, rear ? b.max.z + 0.012 : b.min.z - 0.012), rear); });
  for (const rear of [true, false]) {
    if (done[rear ? "rear" : "front"]) continue;
    if (known) { const q = known.pick && known.pick[rear ? "r" : "f"]; if (q) addPlate(V(q[0], q[1], q[2]), rear); continue; }   // 3p
    const yGoal = rear ? 0.45 : 0.36, dir = V(0, 0, rear ? -1 : 1); let pick = null;
    for (let y = 0.26; y <= 0.66; y += 0.02) {
      ray.set(V(0, y, rear ? sz.z : -sz.z), dir); const h = ray.intersectObjects(meshes, false)[0];
      if (!h || !h.face) continue;
      const n = h.face.normal.clone().transformDirection(h.object.matrixWorld);
      if ((rear ? n.z : -n.z) < 0.8 || Math.abs(h.point.z) < sz.z * 0.4) continue;
      // cả 2 mép biển (±0,2 m) cũng phải trúng gần cùng độ sâu ⇒ chỗ phẳng đủ rộng
      let flat = true; for (const x of [-0.2, 0.2]) { ray.set(V(x, y, rear ? sz.z : -sz.z), dir); const q = ray.intersectObjects(meshes, false)[0]; if (!q || Math.abs(q.point.z - h.point.z) > 0.07) flat = false; }
      if (!flat) continue;
      const sc = Math.abs(y - yGoal); if (!pick || sc < pick.sc) pick = { sc, p: V(0, y, h.point.z + (rear ? 0.014 : -0.014)) };
    }
    if (pick) addPlate(pick.p, rear);
    fresh.pick[rear ? "r" : "f"] = pick ? pick.p.toArray() : null;   // 3p
  }
  if (!known) SO_DO.set(id, { roofY, roofZ, zWS, hoodY, pick: fresh.pick });   // 3p: lần dựng sau (trận / mũi xe / đổi xe) không dò lại

  // ---- bánh: nhận theo HÌNH DẠNG (tên mảnh mỗi mẫu một kiểu): mảnh TRÒN nhìn ngang (cao ≈ dài), ở 4 góc xe, gần mặt đất.
  //   Lốp = mảnh tròn lớn nhất mỗi góc (cao 0,45–0,95 m); mâm/đĩa = mảnh tròn nhỏ hơn có tâm trùng lốp ⇒ quay cùng. Kẹp phanh không tròn ⇒ đứng yên.
  //   Mẫu gộp cả 4 bánh (hoặc bánh + thân) vào 1 mảnh ⇒ không đủ 4 góc ⇒ bánh không quay.
  const parts = [];
  xe.traverse(o => {
    if (!o.isMesh) return; const nm = nameChain(o) + " " + (Array.isArray(o.material) ? "" : o.material.name);
    if (NOT_WHEEL_RE.test(o.name + " " + (Array.isArray(o.material) ? "" : o.material.name))) return;
    const b = new THREE.Box3().setFromObject(o), s = b.getSize(new THREE.Vector3()), c = b.getCenter(new THREE.Vector3());
    const round = Math.abs(s.y - s.z) < 0.14 * Math.max(s.y, s.z), corner = Math.abs(c.x) > sz.x * 0.25 && Math.abs(c.z) > sz.z * 0.14;
    if (round && corner && s.x < 0.6 && s.y > 0.15 && s.y < 0.95 && c.y < 0.62 && Math.abs(c.y - s.y / 2) < 0.18) parts.push({ o, b, s, c });
  });
  const groups = new Map();
  for (const key of ["LF", "RF", "LB", "RB"]) {
    const q = parts.filter(p => (p.c.x > 0 ? "R" : "L") + (p.c.z < 0 ? "F" : "B") === key);
    const tire = q.filter(p => p.s.y >= 0.45).sort((u, v) => v.s.y - u.s.y)[0];
    if (!tire) continue;
    groups.set(key, q.filter(p => p.s.y <= tire.s.y + 0.02 && Math.hypot(p.c.y - tire.c.y, p.c.z - tire.c.z) < 0.12 && Math.abs(p.c.x - tire.c.x) < 0.35));
  }
  // không đủ 4 góc ⇒ thử lại theo TÊN mảnh (wheel/rim/tyre…) như bản đầu — Aventador chỉ nhận được cách này
  if (groups.size < 4) {
    groups.clear();
    xe.traverse(o => {
      if (!o.isMesh) return; const nm = nameChain(o) + " " + (Array.isArray(o.material) ? "" : o.material.name);
      if (!WHEEL_RE.test(nm) || NOT_WHEEL_RE.test(o.name + " " + (Array.isArray(o.material) ? "" : o.material.name))) return;
      const b = new THREE.Box3().setFromObject(o), s = b.getSize(new THREE.Vector3()), c = b.getCenter(new THREE.Vector3());
      if (Math.max(s.x, s.y, s.z) > 1.0 || s.y < 0.25 || c.y > 0.75 || Math.abs(c.x) < sz.x * 0.2 || Math.abs(c.z) < sz.z * 0.12) return;
      const key = (c.x > 0 ? "R" : "L") + (c.z < 0 ? "F" : "B");
      if (!groups.has(key)) groups.set(key, []); groups.get(key).push({ o, b });
    });
  }
  // 3k: vẫn chưa đủ 4 góc ⇒ mẫu GỘP bánh (1 mảnh chứa cả 2 hoặc 4 bánh) ⇒ tách tam giác bánh theo góc thành mảnh riêng
  if (groups.size < 4) {
    const split = new Map();
    const T0 = new THREE.Vector3(), T1 = new THREE.Vector3(), T2 = new THREE.Vector3(), Cn = new THREE.Vector3();
    xe.updateMatrixWorld(true);
    xe.traverse(o => {
      if (!o.isMesh || !o.geometry.attributes.position || (o.geometry.groups && o.geometry.groups.length > 1)) return;
      const nm = o.name + " " + (o.parent?.name || "") + " " + (Array.isArray(o.material) ? "" : o.material.name);   // chỉ tên mảnh + cha trực tiếp + vật liệu
      if (!/wheel|rim|tyre|tire|jante|pneu|rueda|llanta|felge|reifen|dis[ck]|hub/i.test(nm) || NOT_WHEEL_RE.test(o.name + " " + o.material.name)) return;
      const b = new THREE.Box3().setFromObject(o), sb = b.getSize(new THREE.Vector3());
      if (sb.x < sz.x * 0.5 && sb.z < sz.z * 0.4) return;                  // mảnh nhỏ 1 bánh đã xử lý ở trên — chỉ tách mảnh trải nhiều góc
      const g = o.geometry, pos = g.attributes.position, idx = g.index ? g.index.array : Array.from({ length: pos.count }, (_, k) => k);
      const keep = [], per = { LF: [], RF: [], LB: [], RB: [] }, bx = {}, cand = { LF: [], RF: [], LB: [], RB: [] };
      const tri = k => { T0.fromBufferAttribute(pos, idx[k]).applyMatrix4(o.matrixWorld); T1.fromBufferAttribute(pos, idx[k + 1]).applyMatrix4(o.matrixWorld); T2.fromBufferAttribute(pos, idx[k + 2]).applyMatrix4(o.matrixWorld);
        return Cn.copy(T0).add(T1).add(T2).multiplyScalar(1 / 3); };
      for (let k = 0; k < idx.length; k += 3) {
        tri(k);
        if (Cn.y > 0.95 || Math.abs(Cn.x) < sz.x * 0.18 || Math.abs(Cn.z) < sz.z * 0.12) { keep.push(idx[k], idx[k + 1], idx[k + 2]); continue; }
        cand[(Cn.x > 0 ? "R" : "L") + (Cn.z < 0 ? "F" : "B")].push([k, Cn.x, Cn.y, Cn.z]);
      }
      // mỗi góc: lấy TRUNG VỊ tâm tam giác làm tâm bánh, chỉ nhận tam giác cách tâm ≤ 0,55 m (lẫn mảnh chỗ khác ⇒ trả về thân) ⇒ trục quay đúng tâm bánh
      const med = a => { const q = a.slice().sort((u, v) => u - v); return q[q.length >> 1]; };
      for (const key of Object.keys(cand)) {
        const L = cand[key]; if (!L.length) continue;
        const mx = med(L.map(q => q[1])), my = med(L.map(q => q[2])), mz = med(L.map(q => q[3]));
        for (const [k, x, y, z] of L) {
          if (Math.abs(x - mx) < 0.4 && Math.hypot(y - my, z - mz) < 0.55) { per[key].push(idx[k], idx[k + 1], idx[k + 2]); tri(k); (bx[key] ||= new THREE.Box3()).expandByPoint(T0).expandByPoint(T1).expandByPoint(T2); }
          else keep.push(idx[k], idx[k + 1], idx[k + 2]);
        }
      }
      if (Object.values(per).filter(a => a.length).length < 2) return;
      const sub = arr => { const q = new THREE.BufferGeometry(); for (const [n, a] of Object.entries(g.attributes)) q.setAttribute(n, a); q.setIndex(arr); q.boundingSphere = null; return q; };
      o.geometry = sub(keep);                                               // mảnh gốc bỏ tam giác bánh (hình MỚI, không đụng hình dùng chung)
      for (const [key, arr] of Object.entries(per)) {
        if (!arr.length) continue;
        const m = new THREE.Mesh(sub(arr), o.material); m.position.copy(o.position); m.quaternion.copy(o.quaternion); m.scale.copy(o.scale); m.name = o.name + "_wheel" + key;
        o.parent.add(m);
        if (!split.has(key)) split.set(key, []); split.get(key).push({ o: m, b: bx[key] });
      }
    });
    if (split.size === 4) { groups.clear(); split.forEach((v, k) => groups.set(k, v)); }
  }
  const wheels = [];
  let rSum = 0, rN = 0;
  if (groups.size === 4) for (const [key, parts] of groups) {
    const b = new THREE.Box3(); parts.forEach(p => b.union(p.b));
    const c = b.getCenter(new THREE.Vector3()), r = b.getSize(new THREE.Vector3()).y / 2;
    rSum += r; rN++;
    const piv = new THREE.Group(); piv.position.copy(c); body.add(piv);
    const spin = new THREE.Group(); piv.add(spin);
    body.updateMatrixWorld(true);
    parts.forEach(p => spin.attach(p.o));
    wheels.push({ g: spin, steer: piv, front: key[1] === "F" });
  }
  const M = { L: sz.z, W: sz.x, r: rN ? rSum / rN : 0.34, clr: 0.12, belt: 0.8, taper: 0.7,
    top: [[0, roofY]], roof: [sz.z / 2 - roofZ, sz.z / 2 - roofZ], id, name: cfg.name };   // lõi tính zr = −((roof0+roof1)/2 − L/2) = roofZ

  // ---- đèn phanh ----
  const tails = [...mats].filter(m => TAIL_RE.test(m.name) && m.emissive);
  tails.forEach(m => { m.userData.e0 = m.emissive.clone(); m.userData.i0 = m.emissiveIntensity; });

  // ---- bóng blob (lõi tách nó ra khỏi rig theo renderOrder −1) ----
  const own = [];
  const shadowM = bend(new THREE.MeshBasicMaterial({ map: shadowTex(), transparent: true, depthWrite: false, color: 0x000000, opacity: 0.9 }));
  { const g = new THREE.PlaneGeometry(M.W + 0.7, M.L + 0.9).rotateX(-Math.PI / 2); g.translate(0, 0.03, 0); own.push(g); const s = new THREE.Mesh(g, shadowM); s.renderOrder = -1; rig.add(s); }
  // ---- lửa pô ----
  // 3l: mỗi ống 1 vật liệu (hạt nhiễu riêng ⇒ 2 lửa không giống hệt nhau); tấm dọc: y 0..1 xoay thành +z (ra sau xe), rộng 1 ⇒ scale theo bề ngang lửa
  const flameMs = [], mkFlameM = (end, seed) => { const m = new THREE.ShaderMaterial({ vertexShader: FLAME_VS, fragmentShader: FLAME_FS,
    uniforms: { uT: { value: 0 }, uK: { value: 0 }, uPop: { value: 0 }, uSeed: { value: seed }, uEnd: { value: end }, uBend: U.uBend, uBendZ: U.uBendZ },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false }); flameMs.push(m); return m; };
  const flameG = new THREE.PlaneGeometry(1, 1, 1, 10).translate(0, 0.5, 0).rotateX(Math.PI / 2); own.push(flameG);
  const discG = new THREE.PlaneGeometry(1, 1); own.push(discG);
  // 3k: ống xả thật (mảnh/vật liệu exhaust…) ⇒ 1 hoặc 2 miệng; không có ⇒ 2 miệng mặc định
  let exhaust = [];
  { const eb = []; xe.updateMatrixWorld(true);
    xe.traverse(o => { if (!o.isMesh) return; const nm = o.name + " " + (o.parent?.name || "") + " " + (Array.isArray(o.material) ? "" : o.material.name);
      if (/exhaust|muffler|tail_?pipe|escape|scarico|auspuff|echapp/i.test(nm)) { const b = new THREE.Box3().setFromObject(o); if (b.max.z > sz.z * 0.3 && b.getCenter(V(0, 0, 0)).y < 0.9) eb.push(b); } });
    if (eb.length) {
      const b = eb.reduce((a, q) => a.union(q), new THREE.Box3()), c = b.getCenter(V(0, 0, 0)), w = b.max.x - b.min.x;
      exhaust = w > 0.4 ? [V(b.min.x + 0.09, c.y, b.max.z + 0.02), V(b.max.x - 0.09, c.y, b.max.z + 0.02)] : [V(c.x - 0.07, c.y, b.max.z + 0.02), V(c.x + 0.07, c.y, b.max.z + 0.02)];
    } else exhaust = [V(-0.36, 0.38, M.L / 2 + 0.02), V(0.36, 0.38, M.L / 2 + 0.02)];
  }
  const flames = exhaust.map((p, j) => {
    const seed = j * 13.7 + num * 5.3, m = mkFlameM(0, seed), md = mkFlameM(1, seed + 3.1);
    const g = new THREE.Group(); g.position.copy(p); g.renderOrder = 3; body.add(g);
    const plume = new THREE.Group(); g.add(plume);
    [0, Math.PI / 3, 2 * Math.PI / 3].forEach(r => { const q = new THREE.Mesh(flameG, m); q.rotation.z = r; q.renderOrder = 3; q.frustumCulled = false; plume.add(q); });
    const disc = new THREE.Mesh(discG, md); disc.position.z = 0.03; disc.renderOrder = 3; disc.frustumCulled = false; g.add(disc);
    return { g, plume, disc, m, md };
  });
  // đèn cam ở đuôi xe: hắt sáng lên đuôi + mặt đường khi có lửa
  const fireLight = new THREE.PointLight(0xff7a2a, 0, 5.5, 2); fireLight.position.set(0, 0.45, M.L / 2 + 0.45); body.add(fireLight);

  // ---- 3p: gộp mảnh tĩnh của thân xe (bánh đã ở trục quay riêng, không nằm trong cây này) ----
  // cây gốc (ghost) rời cảnh — chỉ gắn lại TẠM trong burn() để tia + DecalGeometry dùng đúng mảnh nhỏ
  const ghost = xe.children[0], mg = mergeStatic(xe, ghost); xe.remove(ghost);
  mg.meshes.concat(mg.loose).forEach(o => { o.frustumCulled = false; o.castShadow = o.receiveShadow = false; });
  mg.geos.forEach(g => own.push(g));

  let pitch = 0, roll = 0, braking = -1, wheelAng = 0, lastDist = null;
  const burns = [], burnPool = [];   // 3p: burnPool = chỗ cháy làm sẵn
  const car = {
    rig, body, M, wheels, id, eye, look, exhaust,
    /** mũi xe nhìn từ ghế lái: bản sao xe CẮT ở chân kính (giữ phần z ≤ zCut) + tấm táp-lô tối phía sau. update() mỗi khung trước khi vẽ. */
    hoodView() {
      const h = buildXe(id); setPaint(h, color);
      const local = new THREE.Plane(V(0, 0, -1), zCut), wp = new THREE.Plane(), hm = new Set(), hoodU = { value: new THREE.Vector4(0, 0, -1, zCut) };
      h.traverse(o => { if (!o.isMesh) return; o.frustumCulled = false; (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => hm.add(m)); if (PLATE_RE.test(o.name + " " + (o.parent?.name || ""))) o.visible = false; });
      hm.forEach(m => { noTransmission(m); m.fog = false; bend(m); hoodClip(m, hoodU); });   // 3p: cắt bằng shader (hoodClip), không clippingPlanes
      // 3p: gộp mảnh tĩnh của bản sao (~250 mảnh ⇒ vài chục), cây gốc bỏ đi
      const hsrc = h.children[0], hmg = mergeStatic(h, hsrc); h.remove(hsrc); hmg.meshes.concat(hmg.loose).forEach(o => { o.frustumCulled = false; });
      const dg = new THREE.PlaneGeometry(2.6, 1.2).rotateX(-Math.PI / 2 + 0.12).translate(0, hoodY - 0.03, zCut + 0.62);
      const dm = new THREE.MeshStandardMaterial({ color: "#121418", roughness: 0.92, fog: false });
      const grp = new THREE.Group(); grp.add(h, new THREE.Mesh(dg, dm));
      return { grp, update() { grp.updateMatrixWorld(true); wp.copy(local).applyMatrix4(grp.matrixWorld); hoodU.value.set(wp.normal.x, wp.normal.y, wp.normal.z, wp.constant); },
        dispose() { hm.forEach(m => m.dispose()); hmg.geos.forEach(g => g.dispose()); dg.dispose(); dm.dispose(); } };
    },
    /** trúng tên lửa: chọn chỗ cháy trên thân ⇒ { p, n } (toạ độ body); lõi phun lửa ở đó; vết cháy hiện dần sau `delay` giây */
    // 3p: TÌM chỗ cháy (tia + DecalGeometry trên mảnh gốc: 6–110 ms/lần ở xe nặng) — tách khỏi burn() để làm SẴN lúc rảnh (prepBurns)
    _pick() {
      body.updateMatrixWorld(true);
      const inv = body.matrixWorld.clone().invert();
      const paint = new Set(xe.userData.paint), wheelSet = new Set(); wheels.forEach(w => w.g.traverse(o => wheelSet.add(o)));
      for (let k = 0; k < 24; k++) {
        // chỗ cháy phải là THÂN SƠN (vết đen nổi trên màu đội) — 16 lần đầu chỉ nhận vật liệu sơn, sau đó nhận mọi chỗ trừ bánh; tia hông cao 0,55–0,9 m
        const side = Math.random() < 0.5 ? -1 : 1, z = (Math.random() - 0.5) * M.L * 0.62, top = Math.random() < 0.5;
        const o = top ? V((Math.random() - 0.5) * M.W * 0.5, M.top[0][1] + 2, z) : V(side * (M.W + 1.5), 0.55 + Math.random() * 0.35, z);
        const oW = body.localToWorld(o.clone()), dW = top ? V(0, -1, 0) : body.localToWorld(V(-side, 0, 0)).sub(body.localToWorld(V(0, 0, 0))).normalize();
        ray.set(oW, dW); const h = ray.intersectObjects(meshes, false)[0];
        if (!h || !h.face || wheelSet.has(h.object) || h.point.y < 0.42 || (k < 16 && paint.size && !paint.has(h.object.material))) continue;
        const nW = h.face.normal.clone().transformDirection(h.object.matrixWorld);
        let geo; try {
          const ori = new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), nW));
          ori.z = Math.random() * Math.PI * 2;
          geo = new DecalGeometry(h.object, h.point, ori, V(0.95, 0.95, 0.7));
        } catch (e) { continue; }
        if (!geo.attributes.position || geo.attributes.position.count < 3) { geo.dispose(); continue; }
        geo.applyMatrix4(inv);
        return { geo, p: h.point.clone().applyMatrix4(inv), n: nW.clone().transformDirection(inv).normalize() };   // toạ độ body ⇒ dùng được ở mọi tư thế xe
      }
      return null;
    },
    /** trúng tên lửa: lấy chỗ cháy làm sẵn (không có thì tìm ngay) ⇒ { p, n } (toạ độ body); vết cháy hiện dần sau `delay` giây */
    burn(delay = 2.2) {
      const sp = burnPool.length ? burnPool.shift() : this._pick();
      if (!sp) return null;
      const m = bend(new THREE.MeshStandardMaterial({ map: scorchTex(), transparent: true, opacity: 0, depthWrite: false, roughness: 1, metalness: 0, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }));
      const d = new THREE.Mesh(sp.geo, m); d.layers.mask = rig.layers.mask; d.frustumCulled = false; body.add(d);
      burns.push({ d, m, t: -delay });
      return { p: sp.p, n: sp.n };
    },
    /** 3p: làm sẵn n chỗ cháy (gọi lúc rảnh: xưởng / màn kết quả) */
    prepBurns(n = 3) { while (burnPool.length < n) { const sp = this._pick(); if (!sp) break; burnPool.push(sp); } return burnPool.length; },
    clearBurns() { burns.forEach(b => { body.remove(b.d); b.d.geometry.dispose(); b.m.dispose(); }); burns.length = 0; },
    update(dt, { dist = 0, accel = 0, brake = 0, steer = 0, boost = 0, t = 0, pop = 0 } = {}) {
      // 3k: góc bánh CỘNG DỒN, mỗi khung tối đa 0,42 rad (chậm thì đúng tốc độ thật; nhanh thì vẫn thấy lăn tới, không bao giờ đứng/quay ngược)
      const dd = lastDist == null ? 0 : dist - lastDist; lastDist = dist;
      wheelAng -= Math.sign(dd) * Math.min(Math.abs(dd) / M.r, 0.42); const spin = wheelAng;
      wheels.forEach(w => { w.g.rotation.x = spin; w.steer.rotation.y = w.front ? clamp(-steer * 0.08, -0.35, 0.35) : 0; });
      pitch = lerp(pitch, clamp(-accel * 0.0045, -0.05, 0.05), 1 - Math.exp(-dt * 6));
      roll = lerp(roll, clamp(steer * 0.035, -0.12, 0.12), 1 - Math.exp(-dt * 7));
      body.rotation.x = pitch; body.rotation.z = roll;
      body.position.y = Math.sin(t * 23 + num) * 0.006 * clamp(Math.abs(accel) / 10 + 0.3, 0, 1);
      const b = brake > 0.05 ? 1 : 0;
      if (b !== braking) { braking = b; tails.forEach(m => { if (b) { m.emissive.setRGB(1, 0.05, 0.03); m.emissiveIntensity = 4; } else { m.emissive.copy(m.userData.e0); m.emissiveIntensity = m.userData.i0; } }); }
      burns.forEach(b => { b.t += dt; b.m.opacity = 0.93 * clamp(b.t / 1.4, 0, 1); });   // vết cháy hiện dần khi lửa tàn
      // 3l: lửa thật — pô nổ (pop) ngắn, phình, vàng; boost dài dần theo lực đạp, chập chờn độ dài mỗi khung
      const popMix = pop > boost ? 1 : 0, k = clamp(Math.max(boost, pop), 0, 1);
      flames.forEach(f => {
        f.g.visible = k > 0.03; if (!f.g.visible) return;
        f.m.uniforms.uT.value = t; f.m.uniforms.uK.value = k; f.m.uniforms.uPop.value = popMix;
        f.md.uniforms.uT.value = t; f.md.uniforms.uK.value = k; f.md.uniforms.uPop.value = popMix;
        const jit = 0.88 + Math.random() * 0.24;
        const len = popMix ? (0.42 + 0.3 * k) * jit : (0.35 + 1.25 * k) * jit, w = popMix ? 0.36 : 0.2 + 0.1 * k;
        f.plume.scale.set(w, w, len);
        const dsz = (popMix ? 0.26 : 0.14 + 0.08 * k) * (0.9 + Math.random() * 0.2); f.disc.scale.set(dsz, dsz, 1);
      });
      fireLight.intensity = k > 0.03 ? (popMix ? 3.2 : 1.2 + 2.2 * k) * (0.75 + Math.random() * 0.5) : 0;
    },
    dispose() { own.forEach(g => g.dispose()); mats.forEach(m => m.dispose()); shadowM.dispose(); flameMs.forEach(m => m.dispose()); plateM.dispose(); plateG.dispose(); burns.forEach(b => { b.d.geometry.dispose(); b.m.dispose(); }); }
  };
  // 3p: tìm chỗ cháy trên MẢNH GỐC — gắn cây gốc vào xe TẠM trong lúc tìm (không có khung nào vẽ nó)
  const pickOn = car._pick;
  car._pick = () => { xe.add(ghost); try { return pickOn.call(car); } finally { xe.remove(ghost); } };
  const disposeOn = car.dispose;
  car.dispose = () => { burnPool.splice(0).forEach(sp => sp.geo.dispose()); disposeOn.call(car); };
  car.merged = { meshes: mg.meshes.length, loose: mg.loose.length };
  return car;
}
