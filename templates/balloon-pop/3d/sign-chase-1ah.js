// THÚ ĐUỔI NHAU TRÊN GỜ CHỮ — bản 1ag (30/9/2026): CHỈ kiểu "húc" (chạy phía TRƯỚC dãy chữ, húc đổ một chữ) — bỏ kiểu "vòng" chạy ra
// SAU chữ (bị khuất; thầy: con vật phải luôn nhìn rõ). Chỉ sinh khi west-world cho phép (1 cặp đuổi nhau trên mặt đất một lúc).
// (1x: dùng animals-1x — chạy trên đụn cát)
// THÚ ĐUỔI NHAU TRÊN GỜ CHỮ — bản 1w (29/9/2026)
// Thầy: "thêm chi tiết các con vật đuổi nhau đôi khi chạy quanh chữ này, đôi khi va vào chữ làm chữ đổ".
// Một cặp (con chạy trốn + con đuổi) xuất hiện ở một đầu gờ khi bảng chữ đang trong tầm nhìn:
//  · "vòng": chạy dọc phía trước dãy chữ, vòng ra SAU chữ (khuất sau chữ), vòng lại phía trước rồi chạy mất;
//  · "húc": chạy dọc phía trước, con chạy trốn ngoặt gấp va vào một chữ ⇒ chữ đổ (bụi tung), loạng choạng rồi chạy tiếp.
// Chữ đổ nằm một lát rồi tự dựng lại (west-props-1w).
import * as THREE from "../../rocket-race/vendor/three/three.module.min.js";
import { buildReal, animateReal } from "./animals-1ah.js";

const PAIRS = [["pronghorn", "lioness"], ["horse", "wolf"], ["pronghorn", "wolf"], ["horse", "lioness"], ["pig", "wolf"]];   // [chạy trốn, đuổi]
const K = 1.6;                     // phóng to (xa ~230 đơn vị)
const FRONT = 14.4, BACK = 10.0;   // làn chạy trước / sau dãy chữ (toạ độ trong nhóm bảng chữ; chữ ở z ≈ 12)

export function createSignChase(scene, signs, hook = null) {
  let C = null, t = 0, wait = 5 + Math.random() * 5;
  const puffs = [];
  const dustTex = (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d"), gr = x.createRadialGradient(32, 32, 2, 32, 32, 31); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.5, "rgba(255,255,255,.45)"); gr.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  function dust(x, y, z, s, n = 1) {
    for (let k = 0; k < n; k++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: dustTex, color: 0xd9a47c, transparent: true, depthWrite: false, opacity: 0.55 }));
      sp.position.set(x + (Math.random() - 0.5) * s, y + 0.3 * s, z + (Math.random() - 0.5) * s); scene.add(sp);
      puffs.push({ sp, t: 0, life: 1 + Math.random() * 0.8, s0: (0.8 + Math.random() * 0.6) * s, vx: (Math.random() - 0.5) * 1.5, vy: 0.5 + Math.random() * 0.8 });
    }
  }
  const mk = kind => { const A = buildReal(kind); A.g.scale.multiplyScalar(K); A.g.rotation.order = "YZX"; scene.add(A.g); return A; };
  const kill = () => { for (const A of [C.prey, C.chaser]) { scene.remove(A.g); A.g.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); } C = null; };

  // đường chạy (toạ độ trong nhóm bảng chữ) theo quãng đường s
  function path(s) {
    const { dir, L, R, mode } = C;
    if (mode === "bump") return [dir * (s - L), FRONT];
    // vòng: đoạn trước (trái→phải theo dir) · bán nguyệt ra sau · đoạn sau (ngược lại) · bán nguyệt ra trước · rồi chạy thẳng ra khỏi gờ
    const seg = 2 * L, arc = Math.PI * R, mid = (FRONT + BACK) / 2;
    if (s < seg) return [dir * (s - L), FRONT];
    s -= seg; if (s < arc) { const a = s / R; return [dir * (L + Math.sin(a) * R * 0.9), mid + Math.cos(a) * R]; }
    s -= arc; if (s < seg) return [dir * (L - s), BACK];
    s -= seg; if (s < arc) { const a = s / R; return [-dir * (L + Math.sin(a) * R * 0.9), mid - Math.cos(a) * R]; }
    s -= arc; return [dir * (s - L), FRONT];
  }
  function spawn(camX) {
    const sg = signs.current(); if (!sg || !sg.userData.hillH) return false;
    const w = sg.userData.width, sx = sg.position.x;
    if (Math.abs(sx - camX) > 75) return false;   // bảng chữ phải đang ở trước mặt
    const [pk, ck] = PAIRS[Math.floor(Math.random() * PAIRS.length)];
    const mode = "bump", dir = Math.random() < 0.5 ? 1 : -1;
    C = { sg, mode, dir, L: w / 2 + 7, R: (FRONT - BACK) / 2, s: 0, t: 0, prey: mk(pk), chaser: mk(ck), speed: 12 + Math.random() * 3, pd: 0, cd: 0, hit: null, stagger: 0 };
    C.prey.px = C.prey.pz = C.chaser.px = C.chaser.pz = null;
    if (mode === "bump") {   // chọn một chữ đang đứng, nằm giữa dãy
      const gl = sg.userData.glyphs.map((m, i) => ({ m, i })).filter(o => !o.m.userData.down), wp = new THREE.Vector3();
      if (gl.length) {
        const o = gl[Math.floor(gl.length * (0.25 + Math.random() * 0.5))];
        o.m.getWorldPosition(wp); C.hit = { i: o.i, x: wp.x - sx + (o.m.userData.w || 3) / 2, done: false };
      } else { kill(); return false; }   // 1ag: hết chữ đứng thì thôi (không chạy vòng ra sau chữ); kill() dọn 2 con vừa dựng
    }
    return true;
  }
  function place(A, lx, lz, dt, spd, key) {
    const sg = C.sg, H = sg.userData.hillH;
    const ox = A.px == null ? lx - C.dir : A.px, oz = A.pz == null ? lz : A.pz;
    A.px = lx; A.pz = lz;
    const dx = lx - ox, dz = lz - oz, yaw = Math.abs(dx) + Math.abs(dz) > 1e-4 ? Math.atan2(-dz, dx) : A.g.rotation.y;
    const y = H(lx, lz), fx = Math.cos(yaw), fz = -Math.sin(yaw), slope = (H(lx + fx, lz + fz) - H(lx - fx, lz - fz)) / 2;
    A.g.position.set(sg.position.x + lx, sg.position.y + y - 0.03, sg.position.z + lz); A.g.rotation.y = yaw; A.g.rotation.z = Math.atan(slope) * 0.8;
    animateReal(A, dt, spd > 0.5 ? "run" : "stand", spd);
    C[key] += dt; if (C[key] > 0.08 && spd > 3) { C[key] = 0; dust(A.g.position.x - fx * 0.9 * K, A.g.position.y, A.g.position.z - fz * 0.9 * K, K * 0.8); }
  }
  return {
    get active() { return C; },
    trigger(camX, mode) { if (C) kill(); const ok = spawn(camX); if (ok && mode && C) C.mode = mode === "bump" && C.hit ? "bump" : "loop"; return ok; },
    update(dt, camX, opts = {}) {
      for (let i = puffs.length - 1; i >= 0; i--) {
        const p = puffs[i]; p.t += dt; const k = p.t / p.life;
        p.sp.position.x += p.vx * dt; p.sp.position.y += p.vy * dt * (1 - k);
        p.sp.scale.setScalar(p.s0 * (1 + k * 2.2)); p.sp.material.opacity = 0.5 * (1 - k) * Math.min(1, p.t * 8);
        if (k >= 1) { scene.remove(p.sp); p.sp.material.dispose(); puffs.splice(i, 1); }
      }
      if (!C) { t += dt; if (t > wait && (!opts.canSpawn || opts.canSpawn())) { if (spawn(camX)) t = 0; else t = wait - 2; } return; }
      if (!C.sg.parent || signs.current() !== C.sg) { kill(); return; }
      C.t += dt;
      let sp = C.speed * (1 + 0.06 * Math.sin(C.t * 1.1));
      if (C.stagger > 0) { C.stagger -= dt; sp *= 0.25; }
      C.s += sp * dt;
      let [px, pz] = path(C.s);
      // húc: gần tới chữ thì ngoặt vào mặt chữ, chạm ⇒ chữ đổ, bật ra rồi chạy tiếp
      if (C.mode === "bump" && C.hit) {
        const d = (px - C.hit.x) * C.dir;   // < 0: chưa tới
        const into = Math.exp(-Math.pow((d + 0.3) / 2.2, 2));
        pz = FRONT - into * (FRONT - 12.9);
        if (!C.hit.done && d > -0.6) { C.hit.done = true; C.stagger = 0.7; signs.knock(C.hit.i); hook?.voice(C.prey.kind, C.sg.position.x + px, C.sg.position.z + pz); dust(C.sg.position.x + px, C.sg.position.y + C.sg.userData.hillH(px, pz), C.sg.position.z + 12.8, K * 1.6, 8); }
      }
      place(C.prey, px, pz, dt, sp, "pd");
      // con đuổi: bám theo đường của con chạy trốn, lúc áp sát lúc bị bỏ lại
      const gap = 5 + 2.5 * Math.sin(C.t * 0.7 + 1);
      let [cx, cz] = path(Math.max(0, C.s - gap));
      if (C.mode === "bump" && C.hit && C.hit.done) cz = FRONT + 0.6;   // né chữ đổ
      place(C.chaser, cx, cz, dt, C.s - gap > 0 ? sp * (C.stagger > 0 ? 3 : 1) : 0, "cd");
      const endS = C.mode === "bump" ? 2 * C.L + 30 : 4 * C.L + 2 * Math.PI * C.R + 30;
      if (C.s - gap > endS) { kill(); t = 0; wait = 10 + Math.random() * 10; }
    },
  };
}
