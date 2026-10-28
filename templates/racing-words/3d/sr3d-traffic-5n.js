// RACING WORDS mẫu 5n (28/10/2026) = traffic-5l + SỐ XE theo thanh kéo (thầy: 0 % = không có, 100 % = gấp 10 lần ⇒ 140 xe; 10 % = 14 xe như cũ)
//   set(mode, sMin, sMax, n) · khoảng cách sinh xe chia theo n · MÀU từng xe rải đều vòng màu (bước tỉ lệ vàng 0,618) + độ đậm / sáng ngẫu nhiên, ~1/5 xe trắng–bạc–đen.
// ---- gốc 5l ----
// RACING WORDS mẫu 5l (27/10/2026) = sr3d-traffic-5j.js + XE GIAO THÔNG 3D THẬT (thầy: "các xe traffic hiện có do máy vẽ và quá xấu — dung lượng vừa phải"):
//   6 mẫu Quaternius CC0 (speed-run/traffic3d/, ~170–270 KB, 3–6k tam giác — NGUON.md): sedan A/B · SUV · taxi · bán tải · xe thể thao.
//   Nạp xong mỗi mẫu GỘP thành 1 lưới (màu vật liệu × màu ảnh atlas → màu đỉnh, aPaint = 1 ở vật liệu thân) ⇒ vẫn 1 vật liệu chung, 1 InstancedMesh / mẫu
//   (6 lệnh vẽ / máy quay). Chỉ phần THÂN nhận màu ngẫu nhiên từng xe (kính / đèn / bánh giữ màu thật); taxi + bán tải giữ sơn gốc.
//   Chưa nạp xong ⇒ dùng tạm hộp cũ (cùng thuộc tính ⇒ không dịch lại shader khi thay lưới). Mũi xe tự quay về −z (tìm theo vật liệu Headlights).
// ---- gốc 5j ----
// RACING WORDS mẫu 5j (21/10/2026) = sr3d-traffic-4c.js + XE GIAO THÔNG TRÚNG TÊN LỬA (thầy: "bị cháy và lật ngang hoặc lật ngửa như một vụ nổ"):
//   blast(v, side) — hất lên, lộn quanh trục dọc tới nằm NGHIÊNG (½ vòng) hoặc NGỬA (1 vòng ½), nảy, cháy 5,5 s (lõi phát lửa / khói theo .burning), sơn cháy đen dần rồi biến mất.
// ---- gốc 4c ----
// RACING WORDS mẫu 4c (16/10/2026) — đợt 4/5 (hồ sơ mục 37): XE KHÁC TRÊN ĐƯỜNG (thầy: "tắt bật việc có nhiều xe khác đi cùng hoặc ngược chiều trên đường đua
//   để thêm kịch tính trong những phần tránh nhau").
//   · mode "off" | "same" (cùng chiều, mọi làn) | "both" (cùng chiều làn NGOÀI ±6, NGƯỢC chiều làn TRONG ±2,4 — phải lách tránh đầu xe lao tới)
//   · xe đơn giản dựng bằng hình khối (KHÔNG dùng xe 3D thật): sedan + xe tải nhỏ, màu từng xe = instanceColor ⇒ 2 InstancedMesh + 1 bóng chung = 3 lệnh vẽ / máy quay
//   · vòng đệm 14 xe quanh 2 xe đua: ra khỏi cửa sổ thì sinh lại phía trước; gần cầu nhảy / dốc xoắn thì đổi sang làn trống
//   · đâm vào: xe đua mất đà, xe kia văng ngang, xoay, đứng lại rồi biến mất
import * as THREE from "../../rocket-race/vendor/three/three.module.min.js";
import { GLTFLoader } from "../../rocket-race/vendor/three/addons/GLTFLoader.js";

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const COLORS = ["#d9dde3", "#2a2f38", "#b3202a", "#2456a6", "#e8e2d0", "#6d7378", "#1f6b4a", "#c9a227", "#8a3ea8", "#f2f2ef"];

function boxPart(w, h, l, x, y, z, col) {
  const g = new THREE.BoxGeometry(w, h, l).toNonIndexed().translate(x, y, z), n = g.attributes.position.count, a = new Float32Array(n * 3), c = new THREE.Color(col);
  for (let i = 0; i < n; i++) a.set([c.r, c.g, c.b], i * 3); g.setAttribute("color", new THREE.BufferAttribute(a, 3)); g.deleteAttribute("uv"); return g;
}
function wheelPart(x, z, r, col = "#111316") {
  const g = new THREE.CylinderGeometry(r, r, 0.26, 10).rotateZ(Math.PI / 2).toNonIndexed().translate(x, r, z), n = g.attributes.position.count, a = new Float32Array(n * 3), c = new THREE.Color(col);
  for (let i = 0; i < n; i++) a.set([c.r, c.g, c.b], i * 3); g.setAttribute("color", new THREE.BufferAttribute(a, 3)); g.deleteAttribute("uv"); return g;
}
function merge(parts) {
  const out = new THREE.BufferGeometry();
  ["position", "normal", "color", ...(parts.every(g => g.attributes.aPaint) ? ["aPaint"] : [])].forEach(nm => { const arr = new Float32Array(parts.reduce((a, g) => a + g.attributes[nm].array.length, 0)); let o = 0; parts.forEach(g => { arr.set(g.attributes[nm].array, o); o += g.attributes[nm].array.length; }); out.setAttribute(nm, new THREE.BufferAttribute(arr, 3)); });
  parts.forEach(g => g.dispose()); if (!out.attributes.aPaint) out.setAttribute("aPaint", new THREE.BufferAttribute(new Float32Array(out.attributes.position.count).fill(1), 1)); return out;   // 5l
}
// mũi xe hướng −z (như xe đua). Thân trắng (nhân màu từng xe); kính / bánh / đèn màu riêng (vẫn bị nhân màu xe ⇒ để tối / rất sáng)
function sedanGeo() {
  return merge([
    boxPart(1.86, 0.62, 4.5, 0, 0.62, 0, "#ffffff"), boxPart(1.6, 0.52, 2.3, 0, 1.18, 0.25, "#ffffff"),
    boxPart(1.62, 0.4, 2.0, 0, 1.2, 0.25, "#151a22"),                                                  // kính
    boxPart(0.5, 0.14, 0.04, -0.6, 0.72, -2.26, "#fffbe8"), boxPart(0.5, 0.14, 0.04, 0.6, 0.72, -2.26, "#fffbe8"),   // đèn pha
    boxPart(0.5, 0.12, 0.04, -0.6, 0.76, 2.26, "#ff2a1a"), boxPart(0.5, 0.12, 0.04, 0.6, 0.76, 2.26, "#ff2a1a"),     // đèn hậu
    wheelPart(-0.86, -1.45, 0.34), wheelPart(0.86, -1.45, 0.34), wheelPart(-0.86, 1.45, 0.34), wheelPart(0.86, 1.45, 0.34)]);
}
function vanGeo() {
  return merge([
    boxPart(2.1, 0.7, 5.6, 0, 0.75, 0, "#ffffff"), boxPart(2.06, 1.55, 3.9, 0, 1.85, 0.75, "#ffffff"), boxPart(2.04, 0.9, 1.5, 0, 1.5, -1.95, "#ffffff"),
    boxPart(1.9, 0.55, 0.04, 0, 1.62, -2.72, "#151a22"),
    boxPart(0.42, 0.16, 0.04, -0.7, 0.8, -2.82, "#fffbe8"), boxPart(0.42, 0.16, 0.04, 0.7, 0.8, -2.82, "#fffbe8"),
    boxPart(0.3, 0.3, 0.04, -0.85, 0.95, 2.82, "#ff2a1a"), boxPart(0.3, 0.3, 0.04, 0.85, 0.95, 2.82, "#ff2a1a"),
    wheelPart(-0.98, -1.85, 0.4), wheelPart(0.98, -1.85, 0.4), wheelPart(-0.98, 1.85, 0.4), wheelPart(0.98, 1.85, 0.4)]);
}
function blobTex() {
  const c = document.createElement("canvas"); c.width = 64; c.height = 128; const g = c.getContext("2d");
  const r = g.createRadialGradient(32, 64, 4, 32, 64, 60); r.addColorStop(0, "rgba(0,0,0,.75)"); r.addColorStop(0.6, "rgba(0,0,0,.45)"); r.addColorStop(1, "rgba(0,0,0,0)");
  g.save(); g.scale(1, 2); g.fillStyle = r; g.translate(0, -32); g.fillRect(0, 0, 64, 128); g.restore(); return new THREE.CanvasTexture(c);
}

const BURNT = new THREE.Color("#1b1714"), EU = new THREE.Euler(0, 0, 0, "YXZ");   // 5j
export const TRAFFIC_MODES = ["off", "same", "both"];
// 5l: cỡ đo lại sau khi nạp mẫu (bề ngang đích W, giữ tỉ lệ) — H = cao thân (nâng khi lật)
const MODELS = [
  { k: "sedanA", w: 0.2, W: 1.85, paint: /^LightBlue$/ }, { k: "sedanB", w: 0.2, W: 1.85, paint: /^Blue$/ }, { k: "suv", w: 0.2, W: 2.0, paint: /^White$/ },
  { k: "taxi", w: 0.12, W: 1.85, paint: null }, { k: "pickup", w: 0.14, W: 2.0, paint: null }, { k: "sport", w: 0.14, W: 1.95, paint: /^White$/ }];
export const TSIZE = Object.fromEntries(MODELS.map(m => [m.k, { W: m.W, L: m.W * 2.35, H: 1.5 }]));
const BOX_OF = { sedanA: "sedan", sedanB: "sedan", taxi: "sedan", sport: "sedan", suv: "van", pickup: "van" };
const loader = new GLTFLoader();
// gộp 1 cảnh glTF thành 1 BufferGeometry (position / normal / color / aPaint), mũi xe về −z, chạm đất y = 0, tâm x/z = 0, bề ngang = W
async function loadModel(M) {
  const g = await loader.loadAsync(new URL(`../traffic3d/${M.k}.glb`, import.meta.url).href); g.scene.updateMatrixWorld(true);
  const parts = [], pix = new Map(), ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  const sampler = tex => { if (!tex || !tex.image) return null; if (pix.has(tex)) return pix.get(tex); const im = tex.image, w = im.width, h = im.height;
    ctx.canvas.width = w; ctx.canvas.height = h; ctx.drawImage(im, 0, 0); const d = ctx.getImageData(0, 0, w, h).data;
    const f = (u, v) => { u = ((u % 1) + 1) % 1; v = ((v % 1) + 1) % 1; const i = (Math.min(h - 1, Math.floor(v * h)) * w + Math.min(w - 1, Math.floor(u * w))) * 4;
      return [Math.pow(d[i] / 255, 2.2), Math.pow(d[i + 1] / 255, 2.2), Math.pow(d[i + 2] / 255, 2.2)]; };   // ảnh sRGB → tuyến tính như màu vật liệu
    pix.set(tex, f); return f; };
  let headZ = 0, headN = 0;
  g.scene.traverse(o => { if (!o.isMesh) return; (Array.isArray(o.material) ? o.material : [o.material]).forEach((mt, mi) => {
    let geo = o.geometry.clone();
    if (Array.isArray(o.material)) { const gr = o.geometry.groups[mi]; if (!gr) return; geo = geo.index ? geo : geo; const ix = geo.index; const sub = new THREE.BufferGeometry();
      const idx = []; for (let q = gr.start; q < gr.start + gr.count; q++) idx.push(ix ? ix.getX(q) : q);
      ["position", "normal", "uv"].forEach(nm => { const a = geo.attributes[nm]; if (!a) return; const arr = new Float32Array(idx.length * a.itemSize); idx.forEach((vi, q) => { for (let c = 0; c < a.itemSize; c++) arr[q * a.itemSize + c] = a.getComponent(vi, c); }); sub.setAttribute(nm, new THREE.BufferAttribute(arr, a.itemSize)); });
      geo = sub; }
    else if (geo.index) geo = geo.toNonIndexed();
    geo.applyMatrix4(o.matrixWorld); if (!geo.attributes.normal) geo.computeVertexNormals();
    const n = geo.attributes.position.count, col = new Float32Array(n * 3), pt = new Float32Array(n), base = mt.color ? mt.color : new THREE.Color(1, 1, 1), smp = sampler(mt.map), uv = geo.attributes.uv;
    const isPaint = !!(M.paint && M.paint.test(mt.name || "")), lit = /light/i.test(mt.name || "");
    for (let i = 0; i < n; i++) { let c = [base.r, base.g, base.b]; if (smp && uv) { const t = smp(uv.getX(i), uv.getY(i)); c = [c[0] * t[0], c[1] * t[1], c[2] * t[2]]; }
      if (isPaint) c = [0.85, 0.85, 0.85]; if (lit) c = c.map(x => Math.min(1, x * 1.6 + 0.15));
      col.set(c, i * 3); pt[i] = isPaint ? 1 : 0; }
    if (/head/i.test(mt.name || "")) for (let i = 0; i < n; i++) { headZ += geo.attributes.position.getZ(i); headN++; }
    const out = new THREE.BufferGeometry(); out.setAttribute("position", geo.attributes.position); out.setAttribute("normal", geo.attributes.normal);
    out.setAttribute("color", new THREE.BufferAttribute(col, 3)); out.setAttribute("aPaint", new THREE.BufferAttribute(pt, 1)); parts.push(out); }); });
  const geo = merge(parts);
  geo.computeBoundingBox(); let bb = geo.boundingBox; const ctr = bb.getCenter(new THREE.Vector3());
  geo.translate(-ctr.x, -bb.min.y, -ctr.z);
  if (headN && headZ / headN > ctr.z) geo.rotateY(Math.PI);                 // đèn pha ở +z ⇒ quay mũi về −z
  geo.computeBoundingBox(); bb = geo.boundingBox; const sz = bb.getSize(new THREE.Vector3());
  const k = M.W / sz.x; geo.scale(k, k, k); geo.computeBoundingBox(); geo.boundingBox.getSize(sz);
  Object.assign(TSIZE[M.k], { W: sz.x, L: sz.z, H: sz.y });
  return geo;
}

export function createTraffic({ scene, bend }) {
  const NMAX = 140; let N = 14;   // 5n: N đổi theo thanh kéo, bộ đệm cấp sẵn NMAX
  const mat0 = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.42, metalness: 0.3 });
  mat0.onBeforeCompile = sh => {                              // 5l: màu từng xe CHỈ nhân vào phần thân sơn (aPaint)
    sh.vertexShader = "attribute float aPaint;\n" + sh.vertexShader.replace("#include <color_vertex>", `#include <color_vertex>
      #ifdef USE_INSTANCING_COLOR
        vColor.rgb = color.rgb * mix(vec3(1.0), instanceColor.rgb, aPaint);
      #endif`); };
  const mat = bend(mat0);
  const boxG = { sedan: sedanGeo(), van: vanGeo() };
  const meshes = Object.fromEntries(MODELS.map(M => [M.k, new THREE.InstancedMesh(boxG[BOX_OF[M.k]], mat, NMAX)]));
  MODELS.forEach(M => loadModel(M).then(g => { const m = meshes[M.k]; if (m) m.geometry = g; }).catch(e => console.warn("traffic 5l: không nạp được", M.k, e)));   // 5l
  Object.values(meshes).forEach(m => { m.frustumCulled = false; m.count = 0; m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(NMAX * 3).fill(1), 3); scene.add(m); });
  const bt = blobTex(), shM = bend(new THREE.MeshBasicMaterial({ map: bt, transparent: true, depthWrite: false, color: 0x000000 }));
  const shadow = new THREE.InstancedMesh(new THREE.PlaneGeometry(2.6, 6.2).rotateX(-Math.PI / 2), shM, NMAX * 2); shadow.frustumCulled = false; shadow.count = 0; shadow.renderOrder = -1; scene.add(shadow);
  let mode = "off", list = [], seed = 1, blocked = () => false;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  let hue = 0.13;
  function pickCol() {                                        // 5n: màu khác nhau rõ — bước tỉ lệ vàng trên vòng màu
    const c = new THREE.Color();
    if (rnd() < 0.2) return c.setHSL(0.6, 0.04, [0.08, 0.45, 0.72, 0.9][Math.floor(rnd() * 4)]);   // đen · bạc tối · bạc · trắng
    hue = (hue + 0.618034) % 1; return c.setHSL(hue, 0.55 + 0.4 * rnd(), 0.3 + 0.28 * rnd());
  }
  const lanesFor = dir => mode === "both" ? (dir > 0 ? [-6, 6] : [-2.4, 2.4]) : [-6, -2.4, 2.4, 6];
  function spawn(v, sAt) {
    const dir = mode === "both" && rnd() < 0.5 ? -1 : 1, lanes = lanesFor(dir), x = lanes[Math.floor(rnd() * lanes.length)];
    let q = rnd(), kind = MODELS[0].k; for (const M of MODELS) { if (q < M.w) { kind = M.k; break; } q -= M.w; }   // 5l: 6 mẫu theo tỉ lệ
    Object.assign(v, { kind, s: sAt, x, tx: x, dir, v: dir > 0 ? 4.5 + rnd() * 2.5 : 7.5 + rnd() * 3.5, col: pickCol(),   /* 5n */
      hit: 0, vx: 0, yaw: 0, spin: 0, alive: true, fade: 1, burn: 0, y: 0, vy: 0, roll: 0, rollV: 0, rollG: 0, fa: 0, sa: 0 });   // 5j: + cháy / lật
    // không chồng lên xe khác cùng làn
    if (list.some(o => o !== v && o.alive && Math.abs(o.x - v.x) < 1.5 && Math.abs(o.s - v.s) < 14)) v.s += 18;
  }
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), P = new THREE.Vector3(), S = new THREE.Vector3(1, 1, 1), UP = new THREE.Vector3(0, 1, 0);
  const api = {
    get mode() { return mode; },
    get list() { return list.filter(v => v.alive); },
    setBlocked(fn) { blocked = fn || (() => false); },
    get n() { return N; },
    set(m, sMin = 0, sMax = 0, n) {
      if (n != null) N = clamp(Math.round(n), 0, NMAX);
      mode = TRAFFIC_MODES.includes(m) && N > 0 ? m : "off"; list = []; seed = 7; hue = 0.13;
      const gap = 58 * 14 / Math.max(N, 1);                      // 5n: cùng quãng như 14 xe cũ ⇒ nhiều xe = dày hơn
      if (mode !== "off") for (let k = 0; k < N; k++) { const v = {}; list.push(v); spawn(v, Math.max(sMax, 0) + 90 + k * gap + rnd() * Math.min(20, gap)); }
      api.draw();
    },
    update(dt, sMin, sMax) {
      if (mode === "off") return;
      for (const v of list) {
        if (!v.alive || v.s < sMin - 70 || v.s > sMax + 760) { spawn(v, sMax + 260 + rnd() * 420); continue; }
        if (v.burn > 0) {                                     // 5j: trúng tên lửa — bay lên, lộn, rơi, nảy, nằm nghiêng / ngửa cháy
          v.burn -= dt; v.vy -= 15 * dt; v.y += v.vy * dt;
          if (v.y <= 0) { v.y = 0; v.vy = v.vy < -2 ? -v.vy * 0.22 : 0; v.rollV *= Math.exp(-dt * 7); v.roll += (v.rollG - v.roll) * (1 - Math.exp(-dt * 6)); v.vx *= Math.exp(-dt * 3); v.v *= Math.exp(-dt * 3); v.spin *= Math.exp(-dt * 3); }
          else { v.roll += v.rollV * dt; if ((v.rollG - v.roll) * Math.sign(v.rollG) <= 0) { v.roll = v.rollG; v.rollV = 0; } }   // lộn tới đúng nghiêng / ngửa thì thôi
          v.x = clamp(v.x + v.vx * dt, -8.6, 8.6); v.s += v.dir * v.v * dt; v.yaw += v.spin * dt; v.col.lerp(BURNT, Math.min(1, dt * 1.2));
          if (v.burn <= 0) v.alive = false; continue;
        }
        if (v.hit > 0) {                                      // bị đâm: văng ngang, xoay, chậm dần, mờ đi rồi biến mất
          v.hit -= dt; v.x += v.vx * dt; v.vx *= Math.exp(-dt * 2); v.v *= Math.exp(-dt * 2.5); v.yaw += v.spin * dt; v.spin *= Math.exp(-dt * 1.8);
          v.s += v.dir * v.v * dt; v.x = clamp(v.x, -8.6, 8.6); if (v.hit <= 0) v.alive = false; continue;
        }
        // làn bị cầu nhảy / dốc xoắn chiếm phía trước ⇒ sang làn trống gần nhất (cùng hướng)
        const ahead = v.s + v.dir * 26;
        if (blocked(ahead, v.tx)) { const alt = lanesFor(v.dir).concat([-6, -2.4, 2.4, 6]).find(x => !blocked(ahead, x)); if (alt != null) v.tx = alt; }
        else if (!blocked(ahead, v.x) && Math.abs(v.tx - v.x) < 0.05 && !lanesFor(v.dir).includes(v.tx)) v.tx = lanesFor(v.dir).reduce((a, b) => Math.abs(b - v.x) < Math.abs(a - v.x) ? b : a);
        const dx = clamp(v.tx - v.x, -2.2 * dt, 2.2 * dt); v.x += dx; v.yaw = -dx / Math.max(dt, 1e-3) / Math.max(v.v, 3) * 0.6 * v.dir;
        // không đâm đuôi xe cùng làn
        const front = list.find(o => o !== v && o.alive && !o.hit && o.dir === v.dir && Math.abs(o.x - v.x) < 1.6 && (o.s - v.s) * v.dir > 0 && (o.s - v.s) * v.dir < 12);
        const vv = front ? Math.min(v.v, front.v) : v.v;
        v.s += v.dir * vv * dt;
      }
      api.draw();
    },
    draw() {
      const cnt = Object.fromEntries(MODELS.map(M => [M.k, 0])); let ns = 0;
      for (const v of list) {
        if (!v.alive || mode === "off") continue;
        const m = meshes[v.kind], n = cnt[v.kind]++;
        const rl = v.roll || 0, sz = TSIZE[v.kind], hh = sz.H;   // 5j: lật quanh trục dọc ⇒ nâng để thân nằm trên mặt đường
        Q.setFromEuler(EU.set(0, (v.dir < 0 ? Math.PI : 0) + v.yaw, rl)); P.set(v.x, (v.y || 0) + Math.abs(Math.sin(rl)) * sz.W / 2 + (1 - Math.cos(rl)) / 2 * hh, -v.s); S.set(1, 1, 1); M4.compose(P, Q, S); m.setMatrixAt(n, M4); m.setColorAt(n, v.col);
        P.set(v.x, 0.03, -v.s); S.set(sz.W / 2.1, 1, sz.L / 5.2); M4.compose(P, Q, S); shadow.setMatrixAt(ns++, M4);
      }
      Object.entries(meshes).forEach(([k, m]) => { m.count = cnt[k]; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; });
      shadow.count = ns; shadow.instanceMatrix.needsUpdate = true;
    },
    /** xe đua tâm (x, s), cỡ W × L chạm xe nào? */
    hit(x, s, W, L) {
      for (const v of list) { if (!v.alive || v.hit > 0 || v.burn > 0) continue; const sz = TSIZE[v.kind]; if (Math.abs(v.x - x) < (W + sz.W) / 2 - 0.1 && Math.abs(v.s - s) < (L + sz.L) / 2 - 0.2) return v; }
      return null;
    },
    blast(v, side) { if (!v.alive || v.burn > 0) return; const sd = side || (Math.random() < 0.5 ? -1 : 1), up = Math.random() < 0.45;   // 5j
      Object.assign(v, { burn: 5.5, hit: 0, vy: 6.5 + Math.random() * 3.5, y: Math.max(v.y || 0, 0.05), vx: sd * (2 + Math.random() * 3), spin: (Math.random() - 0.5) * 3, rollG: up ? sd * Math.PI : sd * Math.PI / 2, roll: v.roll || 0, fa: 0, sa: 0 });
      v.rollV = v.rollG / (2 * v.vy / 15 * 0.85); },   // lộn xong ngay trước khi chạm đất
    get burning() { return list.filter(v => v.alive && v.burn > 0); },
    knock(v, side, k) { v.hit = 1.6; v.vx = side * (3 + 4 * k); v.spin = side * (3 + 5 * k) * (Math.random() < 0.5 ? 1 : -1); },
    dispose() { Object.values(meshes).forEach(m => { scene.remove(m); m.geometry.dispose(); }); Object.values(boxG).forEach(g => g.dispose()); mat.dispose(); scene.remove(shadow); shadow.geometry.dispose(); shM.dispose(); bt.dispose(); }
  };
  return api;
}
