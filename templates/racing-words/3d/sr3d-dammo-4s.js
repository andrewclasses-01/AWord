// RACING WORDS mẫu 4s (19/10/2026) = 4r + thầy: "tên lửa nhỏ hơn · bắn ra phải ĐẨY từ drone TIẾN LÊN phía trước · phía sau drone chỉ thấy KHÓI + LỬA, không thấy thân đuôi".
//   Cỡ ×1,9 → ×1,1–1,2 · phóng từ 1,5 m TRƯỚC bụng drone, bay ngang về phía trước ~10 m rồi mới chúc xuống · LỬA ĐUÔI = lõi hạt cộng sáng to (trắng nóng + màu đạn)
//   phát mỗi khung ngay sau đuôi ⇒ nhìn từ máy quay sau drone chỉ thấy quả cầu lửa + vệt khói, thân đạn bị che.
// ---- gốc 4r ----
// RACING WORDS mẫu 4r (19/10/2026) — ĐẠN DRONE (thiết kế thiet-ke-4k-drone-v2.html mục 3 + 4, thầy chốt ở "ok build 4k"):
//   3 loại cùng DÁNG TÊN LỬA (missileGeos của sr3d-missile-4i.js), khác MÀU + vệt sáng: HEART hồng · BOOST xanh ngọc · MISSILE bạc mũi đỏ.
//   Phóng từ bụng drone, chúc xuống, bay ~1,5 s theo đường cong Bézier, LẠNG LÁCH (dao động ngang + dọc giảm dần về cuối),
//   ĐỊNH VỊ TƯƠNG ĐỐI: có xe khoá ⇒ điểm rơi bám vị trí dự đoán của xe nhưng trôi ngang tối đa DA.DRIFT m/s, 0,45 s cuối khoá cứng ⇒ xe lái gắt vẫn né được.
//   Không khoá ⇒ rơi đúng điểm tâm ngắm trên đường. Lõi (sr3d-4r.js) quyết trúng XE hay trúng ĐƯỜNG + tác dụng; mô-đun này chỉ VẼ: bay, vệt, nổ.
//   fire({ kind, x, y, z, tx, ts, predict }) · update(dt, t) → [{ kind, x, s, team }] · burst(kind, x, s, onCar) · clear() · dispose()
import * as THREE from "../../rocket-race/vendor/three/three.module.min.js";
import { missileGeos, buildMissile, makeParticles } from "./sr3d-missile-4i.js";

export const DA = { T: 1.5, LOCK: 0.45, DRIFT: 3.0, RECHARGE: 0.06,
  COST: { heart: 0.40, boost: 0.25, missile: 0.35 }, CD: { heart: 4, boost: 3, missile: 3 } };
export const DA_COL = { heart: "#ff5fa2", boost: "#2ee6c9", missile: "#ff4d5e" };
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

export function createDroneAmmo({ scene, bend, U }) {
  const P = missileGeos(), mats = [], geos = [];
  const M = m => { mats.push(m); return bend(m); };
  const LOOK = {
    heart: { body: M(new THREE.MeshStandardMaterial({ color: "#ff7fb4", roughness: 0.35, metalness: 0.35 })), nose: M(new THREE.MeshStandardMaterial({ color: "#ffffff", emissive: new THREE.Color("#ff5fa2"), emissiveIntensity: 1.2, roughness: 0.3 })), fin: M(new THREE.MeshStandardMaterial({ color: "#ffd1e4", roughness: 0.4, side: THREE.DoubleSide })), sc: 1.15 },
    boost: { body: M(new THREE.MeshStandardMaterial({ color: "#1fb8a4", roughness: 0.3, metalness: 0.6 })), nose: M(new THREE.MeshStandardMaterial({ color: "#c9fff6", emissive: new THREE.Color("#2ee6c9"), emissiveIntensity: 1.4, roughness: 0.3 })), fin: M(new THREE.MeshStandardMaterial({ color: "#0d3b37", roughness: 0.45, side: THREE.DoubleSide })), sc: 1.05 },
    missile: { body: M(new THREE.MeshStandardMaterial({ color: "#e9ecef", roughness: 0.3, metalness: 0.55 })), nose: M(new THREE.MeshStandardMaterial({ color: "#ff4d5e", emissive: new THREE.Color("#ff4d5e"), emissiveIntensity: 0.9, roughness: 0.3 })), fin: M(new THREE.MeshStandardMaterial({ color: "#2a2f36", roughness: 0.45, metalness: 0.6, side: THREE.DoubleSide })), sc: 1.15 },
  };
  // vệt sáng + tia nổ: 1 hệ hạt cộng sáng mỗi màu · bụi thường (khói nhẹ) dùng chung
  const glowP = {}; Object.keys(DA_COL).forEach(k => { glowP[k] = makeParticles({ U, n: 420, additive: true, color: DA_COL[k] }); scene.add(glowP[k].mesh); });
  const puff = makeParticles({ U, n: 240, color: "#e8e4ee" }); scene.add(puff.mesh);
  const hot = makeParticles({ U, n: 120, additive: true, color: "#fff4e0" }); scene.add(hot.mesh);   // 4s: lõi lửa đuôi trắng nóng
  // vòng sóng nở ra khi trúng xe (Heart / Boost) — mặt phẳng nằm, cộng sáng
  const ringG = new THREE.RingGeometry(0.86, 1, 48).rotateX(-Math.PI / 2); geos.push(ringG);
  const rings = [];
  const list = [];
  const B = new THREE.Vector3(), Bt = new THREE.Vector3(), tmp = new THREE.Vector3();
  function bez(m, u, out, tan) {
    const a = m.L0, p = m.P;
    const c1x = a.x, c1y = a.y - 0.4, c1z = a.z - 16;                // 4s: ĐẨY THẲNG về phía trước (gần ngang) rồi mới chúc xuống
    const c2x = p.x, c2y = p.y + 5, c2z = p.z + 7;                   // vồng xuống, cắm chéo vào điểm rơi
    const v = 1 - u, b0 = v * v * v, b1 = 3 * v * v * u, b2 = 3 * v * u * u, b3 = u * u * u;
    out.set(b0 * a.x + b1 * c1x + b2 * c2x + b3 * p.x, b0 * a.y + b1 * c1y + b2 * c2y + b3 * p.y, b0 * a.z + b1 * c1z + b2 * c2z + b3 * p.z);
    if (tan) { const d0 = 3 * v * v, d1 = 6 * v * u, d2 = 3 * u * u;
      tan.set(d0 * (c1x - a.x) + d1 * (c2x - c1x) + d2 * (p.x - c2x), d0 * (c1y - a.y) + d1 * (c2y - c1y) + d2 * (p.y - c2y), d0 * (c1z - a.z) + d1 * (c2z - c1z) + d2 * (p.z - c2z)); }
    return out;
  }
  const kill = m => { scene.remove(m.g); };
  return {
    get active() { return list.length; },
    fire({ kind, x, y, z, tx, ts, predict }) {
      const L = LOOK[kind] || LOOK.missile, g = new THREE.Group();
      buildMissile(g, P, L.body, L.nose, L.fin); g.scale.setScalar(L.sc); g.position.set(x, y, z);
      g.traverse(o => { o.frustumCulled = false; }); scene.add(g);
      const m = { kind, g, sc: L.sc, t: 0, L0: new THREE.Vector3(x, y, z), P: new THREE.Vector3(tx, 0.4, -ts), predict, ph: Math.random() * 6.28, last: new THREE.Vector3(x, y, z), trailD: 0 };
      list.push(m);
      for (let k = 0; k < 5; k++) puff.emit(x + (Math.random() - 0.5) * 0.4, y, z + (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 1.5, -0.5 - Math.random(), (Math.random() - 0.5) * 1.5, 0.5, 0.3, 0.35, 1.2, 1.8);   // 4s: khói phóng nhỏ
    },
    update(dt, t) {
      const hits = [];
      for (let i = list.length - 1; i >= 0; i--) {
        const m = list[i]; m.t += dt; const tl = DA.T - m.t;
        if (m.predict && tl > DA.LOCK) { const p = m.predict(tl); if (p) { const mx = DA.DRIFT * dt; m.P.x += clamp(p.x - m.P.x, -mx, mx); m.P.z = -p.s; } }   // định vị tương đối
        const x = clamp(m.t / DA.T, 0, 1), u = 0.3 * x + 0.7 * x * x;
        bez(m, u, B, Bt);
        const w = Math.sin(Math.PI * x) * (1 - x * 0.6);                                     // lạng lách: mạnh giữa đường bay, tắt dần lúc cắm xuống
        B.x += w * 0.75 * Math.sin(t * 11 + m.ph); B.y += w * 0.35 * Math.sin(t * 7.3 + m.ph * 1.7);
        m.g.position.copy(B); m.g.lookAt(tmp.copy(B).add(Bt)); m.g.rotateZ(t * 6);
        // 4s: LỬA ĐUÔI — 2 hạt cộng sáng to ngay sau đuôi mỗi khung (lõi trắng nóng + quầng màu đạn) ⇒ nhìn từ sau chỉ thấy lửa, không thấy thân
        { const d = Bt.lengthSq() > 1e-8 ? tmp.copy(Bt).normalize() : tmp.set(0, 0, -1), back = 0.62 * m.sc, hx = B.x - d.x * back, hy = B.y - d.y * back, hz = B.z - d.z * back, k = 0.75 + 0.25 * Math.sin(t * 47 + m.ph);
          glowP[m.kind].emit(hx, hy, hz, -d.x * 3, -d.y * 3, -d.z * 3, 0.09, 1.25 * k, 1, 0.5, 0); hot.emit(hx, hy, hz, 0, 0, 0, 0.06, 0.6 * k, 1, 0, 0); }
        const dist = m.last.distanceTo(B); m.trailD += dist;
        const gp = glowP[m.kind];
        while (m.trailD > 0.35) { m.trailD -= 0.35; tmp.lerpVectors(m.last, B, clamp(1 - m.trailD / Math.max(dist, 1e-4), 0, 1));
          gp.emit(tmp.x, tmp.y, tmp.z, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4, 0.35 + Math.random() * 0.25, 0.42, 0.75, 0.6, 0.4);
          puff.emit(tmp.x, tmp.y, tmp.z, 0, 0.2, 0, 0.8 + Math.random() * 0.5, 0.3, 0.22, 1.4, 0.6); }
        m.last.copy(B);
        if (m.t >= DA.T) { hits.push({ kind: m.kind, x: m.P.x, s: -m.P.z }); kill(m); list.splice(i, 1); }
      }
      for (let i = rings.length - 1; i >= 0; i--) { const r = rings[i]; r.t += dt; const k = r.t / r.life;
        r.m.scale.setScalar(r.r0 + (r.r1 - r.r0) * Math.sqrt(Math.min(k, 1))); r.m.material.opacity = Math.max(0, 1 - k) * 0.95;
        if (k >= 1) { scene.remove(r.m); r.m.material.dispose(); rings.splice(i, 1); } }
      Object.values(glowP).forEach(p => p.update(dt)); puff.update(dt); hot.update(dt);
      return hits;
    },
    /** hiệu ứng nổ: onCar = trúng xe (true) / rơi xuống đường (false). Missile trúng xe / đường do lõi gọi missiles.boom */
    burst(kind, x, s, onCar) {
      const z = -s, gp = glowP[kind] || glowP.missile;
      const ring = (r0, r1, life, y) => { const m = new THREE.Mesh(ringG, bend(new THREE.MeshBasicMaterial({ color: new THREE.Color(DA_COL[kind]).multiplyScalar(2.2), transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, side: THREE.DoubleSide })));
        m.position.set(x, y, z); m.renderOrder = 8; m.frustumCulled = false; scene.add(m); rings.push({ m, t: 0, life, r0, r1 }); };
      if (kind === "heart") {
        if (onCar) { ring(1, 7, 0.7, 0.5); ring(0.6, 4.5, 0.55, 1.4);
          for (let k = 0; k < 46; k++) { const a = Math.random() * 6.28, sp = 2 + Math.random() * 5; gp.emit(x, 1 + Math.random(), z, Math.cos(a) * sp, 3 + Math.random() * 6, Math.sin(a) * sp, 0.7 + Math.random() * 0.4, 0.5, 1, 0.4, 1.6); } }
        else for (let k = 0; k < 18; k++) { const a = Math.random() * 6.28, sp = 1 + Math.random() * 2; puff.emit(x, 0.4, z, Math.cos(a) * sp, 0.5 + Math.random(), Math.sin(a) * sp, 0.9, 0.9, 0.55, 2.4, 1.8); gp.emit(x, 0.5, z, Math.cos(a) * sp, Math.random(), Math.sin(a) * sp, 0.4, 0.3, 0.7, 0, 2); }
      } else if (kind === "boost") {
        if (onCar) { ring(1.2, 9, 0.6, 0.35); ring(0.8, 6, 0.45, 0.9);
          for (let k = 0; k < 40; k++) { const a = Math.random() * 6.28, sp = 6 + Math.random() * 10; gp.emit(x, 0.8, z, Math.cos(a) * sp, 1 + Math.random() * 3, Math.sin(a) * sp, 0.35 + Math.random() * 0.25, 0.22, 1, 0, 2.2); } }
        else for (let k = 0; k < 30; k++) { const a = Math.random() * 6.28, r = Math.random() * 2.5; gp.emit(x + Math.cos(a) * r, 0.15, z + Math.sin(a) * r, (Math.random() - 0.5) * 6, 0.5 + Math.random() * 2, (Math.random() - 0.5) * 6, 0.18 + Math.random() * 0.2, 0.2, 1, 0, 3); }   // tia điện nhảy trên mặt đường
      } else {
        for (let k = 0; k < 20; k++) { const a = Math.random() * 6.28, sp = 4 + Math.random() * 8; gp.emit(x, 0.8, z, Math.cos(a) * sp, 2 + Math.random() * 5, Math.sin(a) * sp, 0.4, 0.3, 1, 0, 1.4); }
      }
    },
    setScale(px) { Object.values(glowP).forEach(p => p.setScale(px)); puff.setScale(px); hot.setScale(px); },
    clear() { list.splice(0).forEach(kill); rings.splice(0).forEach(r => { scene.remove(r.m); r.m.material.dispose(); }); },
    dispose() { this.clear(); Object.values(glowP).forEach(p => { scene.remove(p.mesh); p.dispose(); }); scene.remove(puff.mesh); puff.dispose(); scene.remove(hot.mesh); hot.dispose(); mats.forEach(m => m.dispose()); geos.forEach(g => g.dispose()); },
  };
}
