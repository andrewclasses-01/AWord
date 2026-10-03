// INTRO — bản 1ab (30/9/2026): thầy chê "chậm, lề mề" ⇒ Phim cao bồi 15,8 s → 10,2 s (mở đầu 1,5 s, 4 cảnh ~1,8 s, trôi về góc chơi 1,5 s);
// mỗi cú cắt = LIA VỤT (máy quay quật ngang + nhoè ngang trong GRADE_SHADER.whip + tiếng vút), đầu mỗi cảnh máy quay lao vào rồi hãm (ease-out).
// INTRO — bản 1r (29/9/2026): Phim cao bồi mở đầu TỪ khung màn chờ (dải đen khép, màu ngả nâu dần) rồi mới cắt cảnh; chỉ ANDREW STUDIO / PRESENTS.
// INTRO — bản 1q (29/9/2026): thầy chọn bản 4 Phim cao bồi; chữ ANDREW STUDIO PRESENTS → TRAIN RUSH.
// INTRO ĐIỆN ẢNH — Balloon Pop 3D mẫu 1p (29/9/2026)
// Thầy: "một đoạn intro thật đẹp, ngầu, điện ảnh giống cách làm intro của Rocket race … vài bản để tôi chọn".
// Cách làm như Rocket Race: bấm START ⇒ một cảnh quay dựng sẵn (máy quay bay theo kịch bản, dải đen điện ảnh,
// chữ ANDREW CLASSES presents → BALLOON POP đập xuống + tiếng bùm), cuối cảnh máy quay TRÔI VỀ ĐÚNG góc nhìn của ván chơi
// trong lúc đoàn tàu đang lao tới đúng tốc độ vào ga ⇒ nối liền, không giật. Chạm màn hình = bỏ qua.
// 4 bản (?intro=1..4): 1 Cần cẩu toàn cảnh · 2 Bám theo đoàn tàu · 3 Đại bàng bay · 4 Phim cao bồi.
import * as THREE from "../../rocket-race/vendor/three/three.module.min.js";

export const INTROS = [
  null,
  { name: "Cần cẩu toàn cảnh", dur: 13, settle: 2.4, presents: 0.9, slam: 8.1 },
  { name: "Bám theo đoàn tàu", dur: 12, settle: 2.2, presents: 0.6, slam: 8.6 },
  { name: "Đại bàng bay", dur: 12, settle: 2.4, presents: 1.0, slam: 7.3 },
  { name: "Phim cao bồi", dur: 1.5 + 7.2 + 1.5, settle: 1.5, presents: 0.5, slam: 99, sepia: true, lead: 1.5, whip: 0.16 },   // 1ab: nhanh gọn (1r: 15,8 s)
];
export const INTRO_ID = 4;   // 1q: thầy chọn bản Phim cao bồi

const E = x => { x = Math.min(1, Math.max(0, x)); return x * x * x * (x * (x * 6 - 15) + 10); };   // smootherstep
const lerp = (a, b, t) => a + (b - a) * t;
const L3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const pose = (p, l, fov = 38, roll = 0) => ({ p, l, fov, roll });
const mixPose = (A, B, t) => pose(L3(A.p, B.p, t), L3(A.l, B.l, t), lerp(A.fov, B.fov, t), lerp(A.roll, B.roll, t));
// chuỗi cảnh: mỗi cảnh bắt đầu ở `at`; `mix` giây đầu hoà từ cảnh trước (0 = cắt cảnh)
function seq(t, segs) {
  let k = 0; while (k + 1 < segs.length && t >= segs[k + 1].at) k++;
  const s = segs[k], P = s.f(t);
  if (k > 0 && s.mix > 0 && t < s.at + s.mix) return mixPose(segs[k - 1].f(t), P, E((t - s.at) / s.mix));
  return P;
}

export function createCine({ stage, camera, gradeU, sfx, baseFov }) {
  // ---------------------------------------------------------------- lớp chữ + dải đen điện ảnh
  const ov = document.createElement("div"); ov.className = "bp-cine"; ov.hidden = true;
  ov.innerHTML = `<i class="bp-cine-bar top"></i><i class="bp-cine-bar bot"></i>
    <div class="bp-cine-pre"><span class="a">ANDREW STUDIO</span><span class="b">PRESENTS</span></div>
    <div class="bp-cine-title"><span>TRAIN RUSH</span></div>
    <div class="bp-cine-skip">Tap to skip ▸▸</div>`;
  stage.append(ov);
  const pre = ov.querySelector(".bp-cine-pre"), ttl = ov.querySelector(".bp-cine-title");
  ["pointerdown", "click"].forEach(ev => ov.addEventListener(ev, e => { e.stopPropagation(); if (ev === "click") api.skip(); }));   // chạm = bỏ qua

  // ---------------------------------------------------------------- tiếng điện ảnh (Web Audio tự tổng hợp)
  // 1ah: tiếng THU THẬT (core/sound-1ah.js) — không tự tổng hợp nữa
  function audio() { sfx.unlock(); sfx.music("intro"); }
  const boom = () => sfx.boom(0.9);
  const riser = dur => sfx.riser(dur);
  const whoosh = (dur = 0.9, peak = 0.35) => sfx.whoosh(dur, peak);
  const cry = () => sfx.cry(110);
  const windOn = () => sfx.amb(true);
  const windOff = () => {};   // gió sa mạc chạy suốt game (bộ máy âm thanh giữ)

  // ---------------------------------------------------------------- kịch bản từng bản
  let I = null, id = 0, T = 0, ctx = null, cues = [], fired = new Set(), shake = 0, active = false;
  const G = () => { const w = ctx.sway ? ctx.sway() : [0, 0, 0];   // cùng độ trôi nhẹ của máy quay ván chơi ⇒ khung nối không nhích
    return pose([ctx.C + ctx.V.cam[0] + w[0], ctx.V.cam[1] + w[1], ctx.V.cam[2]], [ctx.C + ctx.V.look[0] + w[2], ctx.V.look[1], ctx.V.look[2]], baseFov); };
  const H = t => ctx.head(t + (I.lead || 0));   // 1r: các cảnh tính theo giờ riêng (bỏ đoạn mở đầu)

  function shots(k) {
    if (k === 1) {   // CẦN CẨU TOÀN CẢNH: lướt qua đồi chữ → sà xuống đường ray, tàu ào qua → bay song song đầu máy → vút lên
      const sx = ctx.sign ? ctx.sign.x : H(0) + 60, Xp = H(7.0) + 2.5;
      return [
        { at: 0, f: t => pose([sx - 26 + t * 5, 23 - t * 0.8, -128 - t * 3.5], [sx + 4 + t * 1.5, 19.5, -203], 34) },
        { at: 4.0, mix: 2.3, f: t => pose([Xp + 1.5, lerp(3.2, 1.25, E((t - 4) / 2.6)), 7.2], [Math.min(H(t) + 1, Xp + 2.5), 1.9, 0], 40) },
        { at: 7.25, mix: 0.9, f: t => pose([H(t) - 1.2, 2.1, 7.8], [H(t) + 3.2, 2.5, 0], 38) },
        { at: 9.4, mix: 1.4, f: t => pose([H(t) - 10, 10.5, 24], [H(t) + 3, 3.5, 0], 38) },
      ];
    }
    if (k === 2) {   // BÁM THEO ĐOÀN TÀU: cận bánh + thanh truyền → lên ống khói → lùi dọc các toa → cần cẩu lên cao
      return [
        { at: 0, f: t => pose([H(t) + 0.4 - t * 0.35, 0.8, 3.3], [H(t) - 1.1, 0.9, 0.4], 34) },
        { at: 2.8, mix: 1.3, f: t => pose([H(t) + 1.6, 3.7, 4.4], [H(t) + 0.7, 3.9, 0], 40) },
        { at: 5.1, mix: 1.1, f: t => { const u = E((t - 5.1) / 3.1), x = H(t) - 2 - u * Math.max(6, ctx.len - 5); return pose([x, 2.6, 6.4], [x - 1.2, 2.3, 0], 42); } },
        { at: 8.2, mix: 1.4, f: t => pose([H(t) - 12, 10.5, 30], [H(t) - 3, 5.2, 0], 40) },
      ];
    }
    if (k === 3) {   // ĐẠI BÀNG BAY: lượn thấp qua gò đồi, xương rồng, cắt ngang trước mũi tàu rồi quay về góc chơi
      const X = H(6.4), pts = [[-105, 32, -165], [-76, 19, -98], [-42, 8.5, -46], [-6, 4.6, -9], [38, 3.6, 12], [64, 6.5, 24]].map(q => new THREE.Vector3(X + q[0], q[1], q[2]));
      const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal"), tan = new THREE.Vector3(), tan2 = new THREE.Vector3();
      return [{ at: 0, f: t => {
        const u = Math.min(1, t / 9.6), p = curve.getPoint(u); curve.getTangent(u, tan); curve.getTangent(Math.min(1, u + 0.04), tan2);
        const turn = Math.atan2(tan.x * tan2.z - tan.z * tan2.x, tan.x * tan2.x + tan.z * tan2.z);   // đổi hướng ⇒ nghiêng cánh
        let l = [p.x + tan.x * 12, p.y + tan.y * 12 - 1.2, p.z + tan.z * 12];
        const w = E((t - 5.4) / 2.2); l = L3(l, [H(t) + 1, 2.4, 0], w);
        return pose([p.x, p.y, p.z], l, 44, Math.max(-0.3, Math.min(0.3, -turn * 4)) * (1 - w));
      } }];
    }
    // k === 4 — PHIM CAO BỒI: bóng xương rồng ngược nắng → tàu lao thẳng vào ống kính → tàu vụt qua sát máy → toàn cảnh, màu về
    // 1ab: mỗi cảnh ~1,8 s; đầu cảnh máy quay LAO VÀO rồi hãm (Eo) cho có lực; cắt cảnh = lia vụt (whips bên dưới)
    const Eo = x => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
    const cac = ctx.saguaro, Xc = H(4.1) + 2, Xs = H(4.6);
    const A = cac ? (t => { const d = lerp(40, 25, Eo(t / 1.8)) * Math.max(0.6, cac.h / 12), hx = 0.32, hz = 0.94; return pose([cac.x + hx * d + 2.5, 1.1 + t * 0.2, cac.z + hz * d], [cac.x - 1.5, cac.h * 0.5, cac.z], 30); })
      : (t => pose([H(0) + 60, 1.2, 9], [H(0) + 70, 4, -40], 30));
    return [
      { at: 0, f: A, whip: 1 },
      { at: 1.8, whip: -1, f: t => { const u = Eo((t - 1.8) / 0.9); return pose([Xc, lerp(1.9, 1.05, u) + (t - 1.8) * 0.15, lerp(2.5, 0, u)], [H(t) - 2, 1.7, 0], lerp(30, 24, u)); } },
      { at: 3.7, whip: 1, f: t => { const u = Eo((t - 3.7) / 0.7); return pose([Xs - lerp(3, 0, u), 0.95, 5.3], [H(t) + 1.2, 1.9, 0], lerp(46, 40, u)); } },
      { at: 5.4, whip: -1, f: t => pose([H(t) - 8, 11 + (t - 5.4) * 1.1, 40 - Eo((t - 5.4) / 1.2) * 4], [H(t) - 2, 2.2, 0], 38) },
    ];
  }

  let SEG = null;
  function poseAt(t) {
    const S0 = I.dur - I.settle;
    const P = seq(Math.min(t, I.dur), SEG);
    if (t <= S0) return P;
    // máy quay trôi về ĐÚNG góc nhìn ván chơi (đi vòng lên một chút cho mềm)
    const u = E((t - S0) / I.settle), g = G();
    const R = mixPose(P, g, u); R.p[1] += Math.sin(Math.PI * u) * 1.2;
    return R;
  }
  const up = new THREE.Vector3(), fw = new THREE.Vector3();
  function apply(P, dt) {
    shake *= Math.exp(-dt * 6);
    const j = shake, jx = (Math.random() - 0.5) * j, jy = (Math.random() - 0.5) * j;
    camera.position.set(P.p[0] + jx, P.p[1] + jy, P.p[2]);
    camera.up.set(0, 1, 0); camera.lookAt(P.l[0] + jx * 0.5, P.l[1] + jy * 0.5, P.l[2]);
    if (P.roll) { fw.set(0, 0, -1).applyQuaternion(camera.quaternion); camera.rotateOnWorldAxis(fw, P.roll); }
    if (Math.abs(camera.fov - P.fov) > 1e-3) { camera.fov = P.fov; camera.updateProjectionMatrix(); }
  }

  // 1ab: LIA VỤT quanh mỗi cú cắt — cảnh cũ quật đi theo chiều lia, cảnh mới quật về từ phía bên kia; hình nhoè ngang theo độ lia
  const Y_AXIS = new THREE.Vector3(0, 1, 0);
  function whipFx() {
    let w = 0;
    if (I.whip && SEG) for (let k = 1; k < SEG.length; k++) {
      const s = SEG[k]; if (!s.whip || s.mix) continue;
      const d = T - s.at; if (Math.abs(d) >= I.whip) continue;
      const a = 1 - Math.abs(d) / I.whip, a2 = a * a;
      camera.rotateOnWorldAxis(Y_AXIS, (d < 0 ? -1 : 1) * s.whip * 0.5 * a2);
      w = s.whip * a2;
    }
    if (gradeU.whip) gradeU.whip.value = w;
  }
  function cue(at, fn) { cues.push({ at, fn }); }
  function begin(k, c) {
    id = k; I = INTROS[k]; ctx = c; T = 0; fired = new Set(); cues = []; shake = 0; active = true;
    SEG = shots(k);
    if (I.lead) {   // 1r: đoạn mở đầu = chính khung màn chờ, máy quay tiến chậm + chúc nhẹ trong lúc dải đen khép và màu ngả nâu
      const L = I.lead, ip = ctx.idle, d = [ip.l[0] - ip.p[0], ip.l[1] - ip.p[1], ip.l[2] - ip.p[2]], dl = Math.hypot(...d), u = d.map(v => v / dl);
      // 1ab: lao vào NHANH DẦN (không trôi đều) rồi lia vụt sang cảnh đầu
      const first = { at: 0, f: t => { const x = t / L, e = x * x * 0.75 + x * 0.25; return pose([ip.p[0] + u[0] * 16 * e, ip.p[1] + u[1] * 16 * e - 3 * e, ip.p[2] + u[2] * 16 * e], [ip.l[0], ip.l[1] - 14 * e, ip.l[2]], lerp(ip.fov, 31, e)); } };
      SEG = [first, ...SEG.map(sg => ({ at: sg.at + L, mix: sg.mix, whip: sg.whip, f: t => sg.f(t - L) }))];
    }
    audio(); windOn();
    ov.hidden = false; ov.className = "bp-cine is-on" + (I.sepia ? " is-film" : "");
    pre.classList.remove("is-in"); ttl.classList.remove("is-in", "is-out");
    cue(I.presents, () => { pre.classList.add("is-in"); });
    if (I.slam < 90) { cue(I.slam - 1.6, () => riser(1.6)); cue(I.slam, () => { ttl.classList.add("is-in"); boom(); shake = 0.35; }); }
    else cue(I.presents + 0.15, () => { boom(); });   // 1r: chỉ ANDREW STUDIO / PRESENTS, tiếng trầm nhẹ
    cue(I.dur - I.settle - 0.2, () => { ttl.classList.add("is-out"); ov.classList.add("is-open"); whoosh(1.4, 0.25); });
    if (k === 1) { cue(4.1, () => whoosh(1.8, 0.3)); cue(5.2, () => sfx.whistle()); cue(6.7, () => whoosh(0.9, 0.5)); }
    if (k === 2) { cue(3.0, () => sfx.whistle()); cue(8.2, () => whoosh(1.4, 0.3)); }
    if (k === 3) { cue(0.4, cry); cue(3.0, () => whoosh(1.6, 0.25)); cue(5.9, () => { sfx.whistle(); whoosh(1.0, 0.45); }); cue(7.0, cry); }
    const Ld = I.lead || 0;
    if (k === 4) {   // 1ab: nhịp mới — tiếng vút đúng mỗi cú lia (bắt đầu trước cắt một chút), còi tàu khi tàu lao vào ống kính, ù ù khi vụt qua
      cue(0.2 + Ld, cry); cue(2.0 + Ld, () => sfx.whistle()); cue(3.1 + Ld, () => sfx.whistle()); cue(4.3 + Ld, () => whoosh(0.8, 0.6));
      for (const c of [0, 1.8, 3.7, 5.4]) cue(Math.max(0, c + Ld - 0.14), () => whoosh(0.4, 0.3));
    }
    gradeU.sepia.value = I.sepia && !I.lead ? 1 : 0;
    apply(poseAt(0), 0);
  }
  function finish() {
    active = false; windOff(); ov.hidden = true; gradeU.sepia.value = 0; if (gradeU.whip) gradeU.whip.value = 0;
    camera.up.set(0, 1, 0); camera.fov = baseFov; camera.updateProjectionMatrix();
  }
  const api = {
    get active() { return active; },
    get t() { return T; },
    get dur() { return I ? I.dur : 0; },
    durationOf: k => INTROS[k].dur,
    begin,
    // trả về true khi xong (máy quay đã về đúng góc chơi)
    update(dt) {
      if (!active) return true;
      T += dt;
      for (const c of cues) if (T >= c.at && !fired.has(c)) { fired.add(c); c.fn(); }
      if (I.sepia) { const L = I.lead || 0; gradeU.sepia.value = T < L ? E(T / L) : 1 - E((T - L - 5.4) / 1.4); }   // 1r: màu ngả nâu DẦN từ khung màn chờ · 1ab: màu về sớm hơn
      apply(poseAt(T), dt);
      whipFx();
      if (T >= I.dur) { finish(); return true; }
      return false;
    },
    // bỏ qua: nhảy tới đoạn trôi về góc chơi
    skip() { if (!active) return; const S0 = I.dur - I.settle; if (T < S0 - 0.3) { T = S0 - 0.3; for (const c of cues) if (c.at < T) fired.add(c); pre.classList.remove("is-in"); if (I.slam < 90) ttl.classList.add("is-in"); ov.classList.add("is-open"); } },
    finish,
  };
  return api;
}
