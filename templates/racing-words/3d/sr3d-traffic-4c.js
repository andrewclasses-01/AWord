// RACING WORDS mẫu 4c (16/10/2026) — đợt 4/5 (hồ sơ mục 37): XE KHÁC TRÊN ĐƯỜNG (thầy: "tắt bật việc có nhiều xe khác đi cùng hoặc ngược chiều trên đường đua
//   để thêm kịch tính trong những phần tránh nhau").
//   · mode "off" | "same" (cùng chiều, mọi làn) | "both" (cùng chiều làn NGOÀI ±6, NGƯỢC chiều làn TRONG ±2,4 — phải lách tránh đầu xe lao tới)
//   · xe đơn giản dựng bằng hình khối (KHÔNG dùng xe 3D thật): sedan + xe tải nhỏ, màu từng xe = instanceColor ⇒ 2 InstancedMesh + 1 bóng chung = 3 lệnh vẽ / máy quay
//   · vòng đệm 14 xe quanh 2 xe đua: ra khỏi cửa sổ thì sinh lại phía trước; gần cầu nhảy / dốc xoắn thì đổi sang làn trống
//   · đâm vào: xe đua mất đà, xe kia văng ngang, xoay, đứng lại rồi biến mất
import * as THREE from "../../rocket-race/vendor/three/three.module.min.js";

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
  ["position", "normal", "color"].forEach(nm => { const arr = new Float32Array(parts.reduce((a, g) => a + g.attributes[nm].array.length, 0)); let o = 0; parts.forEach(g => { arr.set(g.attributes[nm].array, o); o += g.attributes[nm].array.length; }); out.setAttribute(nm, new THREE.BufferAttribute(arr, 3)); });
  parts.forEach(g => g.dispose()); return out;
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

export const TRAFFIC_MODES = ["off", "same", "both"];
export const TSIZE = { sedan: { W: 1.86, L: 4.5 }, van: { W: 2.1, L: 5.6 } };

export function createTraffic({ scene, bend }) {
  const N = 14;
  const mat = bend(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.45, metalness: 0.35 }));
  const meshes = { sedan: new THREE.InstancedMesh(sedanGeo(), mat, N), van: new THREE.InstancedMesh(vanGeo(), mat, N) };
  Object.values(meshes).forEach(m => { m.frustumCulled = false; m.count = 0; m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(N * 3).fill(1), 3); scene.add(m); });
  const bt = blobTex(), shM = bend(new THREE.MeshBasicMaterial({ map: bt, transparent: true, depthWrite: false, color: 0x000000 }));
  const shadow = new THREE.InstancedMesh(new THREE.PlaneGeometry(2.6, 6.2).rotateX(-Math.PI / 2), shM, N * 2); shadow.frustumCulled = false; shadow.count = 0; shadow.renderOrder = -1; scene.add(shadow);
  let mode = "off", list = [], seed = 1, blocked = () => false;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const lanesFor = dir => mode === "both" ? (dir > 0 ? [-6, 6] : [-2.4, 2.4]) : [-6, -2.4, 2.4, 6];
  function spawn(v, sAt) {
    const dir = mode === "both" && rnd() < 0.5 ? -1 : 1, lanes = lanesFor(dir), x = lanes[Math.floor(rnd() * lanes.length)];
    Object.assign(v, { kind: rnd() < 0.72 ? "sedan" : "van", s: sAt, x, tx: x, dir, v: dir > 0 ? 4.5 + rnd() * 2.5 : 7.5 + rnd() * 3.5, col: new THREE.Color(COLORS[Math.floor(rnd() * COLORS.length)]),
      hit: 0, vx: 0, yaw: 0, spin: 0, alive: true, fade: 1 });
    // không chồng lên xe khác cùng làn
    if (list.some(o => o !== v && o.alive && Math.abs(o.x - v.x) < 1.5 && Math.abs(o.s - v.s) < 14)) v.s += 18;
  }
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), P = new THREE.Vector3(), S = new THREE.Vector3(1, 1, 1), UP = new THREE.Vector3(0, 1, 0);
  const api = {
    get mode() { return mode; },
    get list() { return list.filter(v => v.alive); },
    setBlocked(fn) { blocked = fn || (() => false); },
    set(m, sMin = 0, sMax = 0) {
      mode = TRAFFIC_MODES.includes(m) ? m : "off"; list = []; seed = 7;
      if (mode !== "off") for (let k = 0; k < N; k++) { const v = {}; list.push(v); spawn(v, Math.max(sMax, 0) + 90 + k * 58 + rnd() * 20); }
      api.draw();
    },
    update(dt, sMin, sMax) {
      if (mode === "off") return;
      for (const v of list) {
        if (!v.alive || v.s < sMin - 70 || v.s > sMax + 760) { spawn(v, sMax + 260 + rnd() * 420); continue; }
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
      const cnt = { sedan: 0, van: 0 }; let ns = 0;
      for (const v of list) {
        if (!v.alive || mode === "off") continue;
        const m = meshes[v.kind], n = cnt[v.kind]++;
        Q.setFromAxisAngle(UP, (v.dir < 0 ? Math.PI : 0) + v.yaw); P.set(v.x, 0, -v.s); S.set(1, 1, 1); M4.compose(P, Q, S); m.setMatrixAt(n, M4); m.setColorAt(n, v.col);
        P.set(v.x, 0.03, -v.s); S.set(1, 1, v.kind === "van" ? 1.2 : 1); M4.compose(P, Q, S); shadow.setMatrixAt(ns++, M4);
      }
      Object.entries(meshes).forEach(([k, m]) => { m.count = cnt[k]; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; });
      shadow.count = ns; shadow.instanceMatrix.needsUpdate = true;
    },
    /** xe đua tâm (x, s), cỡ W × L chạm xe nào? */
    hit(x, s, W, L) {
      for (const v of list) { if (!v.alive || v.hit > 0) continue; const sz = TSIZE[v.kind]; if (Math.abs(v.x - x) < (W + sz.W) / 2 - 0.1 && Math.abs(v.s - s) < (L + sz.L) / 2 - 0.2) return v; }
      return null;
    },
    knock(v, side, k) { v.hit = 1.6; v.vx = side * (3 + 4 * k); v.spin = side * (3 + 5 * k) * (Math.random() < 0.5 ? 1 : -1); },
    dispose() { Object.values(meshes).forEach(m => { scene.remove(m); m.geometry.dispose(); }); mat.dispose(); scene.remove(shadow); shadow.geometry.dispose(); shM.dispose(); bt.dispose(); }
  };
  return api;
}
