// TRAIN RUSH — INTRO ĐIỆN ẢNH CHẾ ĐỘ FIGHT (mẫu 1af, 30/9/2026: toa hàng gỗ khắc hoa văn thay toa bảng TEAM 1/2; còn lại như 1ae)
// Thầy: "làm intro điện ảnh cho chế độ Fight — thể hiện 2 tàu, 2 team thi đua với nhau".
// Quay trong cảnh của MỘT bàn (trang Fight cho bàn đó phủ cả màn trong lúc intro). Cùng phong cách intro bản đơn 1ab
// (mở đầu từ khung màn chờ, ngả nâu, cắt cảnh LIA VỤT), ~11 s:
//   0    mở đầu : máy quay lao xuống từ khung màn chờ — ANDREW STUDIO / PRESENTS
//   1,4  cảnh 1 : sát mặt đất bám ngang 2 đoàn tàu đua song song (tàu đỏ ray gần, tàu xanh ray xa), vượt nhau liên tục
//   3,2  cảnh 2 : cận đầu máy ĐỎ — thẻ TEAM 1 trượt vào từ trái, còi tàu
//   4,9  cảnh 3 : cận đầu máy XANH — thẻ TEAM 2 trượt vào từ phải, còi tàu; màu về dần
//   6,6  cảnh 4 : đối đầu — máy quay lùi trước mũi 2 tàu đang lao tới, chữ VS đập xuống
//   8,4  cảnh 5 : cần cẩu vút lên sau lưng 2 tàu — TRAIN RUSH / FIGHT đập xuống
//  10,4  sập tối ⇒ trang Fight tách 2 bàn, đếm 3-2-1
// Chạm màn hình = bỏ qua (nhảy tới đoạn sập tối).
import * as THREE from "../../rocket-race/vendor/three/three.module.min.js";

const E = x => { x = Math.min(1, Math.max(0, x)); return x * x * x * (x * (x * 6 - 15) + 10); };
const Eo = x => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
const lerp = (a, b, t) => a + (b - a) * t;
const pose = (p, l, fov = 38) => ({ p, l, fov });
const DUR = 11.0, LEAD = 1.4, FADE = 0.6, WHIP = 0.16;
const Z_FAR = -5.2, LIFT = 0.28;   // ray thứ hai: sau ray chính 5,2; đắp nền cao thêm 0,28 (vùi bụi cỏ mọc sẵn trên đất)
const V = 15;                      // tốc độ đua (đơn vị thế giới / giây)

export function createFightCine(k) {
  // k: { scene, camera, gradeU, sfx, stage, S, TS, RAIL_TOP, CART_W, ENGINE_LEN, TENDER_LEN, CART_GAP,
  //      makeEngine, makeTender, makeCart, makeFiller, weather, smokeTex, fxRoot, boardTexture }
  const { scene, camera, gradeU, sfx, stage, S, TS, RAIL_TOP } = k;

  // ------------------------------------------------------------ lớp chữ
  const ov = document.createElement("div"); ov.className = "fc"; ov.hidden = true;
  ov.innerHTML = `<i class="fc-bar top"></i><i class="fc-bar bot"></i>
    <div class="fc-pre"><span class="a">ANDREW STUDIO</span><span class="b">PRESENTS</span></div>
    <div class="fc-team t0"><small>TEAM</small><b>1</b></div>
    <div class="fc-team t1"><small>TEAM</small><b>2</b></div>
    <div class="fc-vs"><span class="l">TEAM 1</span><b>VS</b><span class="r">TEAM 2</span></div>
    <div class="fc-title"><span class="a">TRAIN RUSH</span><span class="b">FIGHT</span></div>
    <div class="fc-black"></div>
    <div class="fc-skip">Tap to skip ▸▸</div>`;
  stage.append(ov);
  const $ = s => ov.querySelector(s);
  ["pointerdown", "click"].forEach(ev => ov.addEventListener(ev, e => { e.stopPropagation(); if (ev === "click") api.skip(); }));

  // ------------------------------------------------------------ tiếng (Web Audio tự tổng hợp, như intro bản đơn)
  // 1ah: tiếng THU THẬT dùng chung bộ máy âm thanh của trang (core/sound-1ah.js) — không tự tổng hợp nữa
  function audio() { sfx.unlock(); sfx.amb(true); sfx.music("intro"); }
  const boom = (p = 0.85) => sfx.boom(p);
  const whoosh = (dur = 0.9, peak = 0.35) => sfx.whoosh(dur, peak);
  const riser = dur => sfx.riser(dur);

  // ------------------------------------------------------------ ray thứ hai (chỉ có trong intro)
  function buildTrack(x0, len) {
    const g = new THREE.Group();
    const ballast = new THREE.Mesh(new THREE.BoxGeometry(len, 0.34 + LIFT, 3.4), new THREE.MeshStandardMaterial({ color: 0x6f5a48, roughness: 0.97 }));
    ballast.position.set(x0 + len / 2, (0.34 + LIFT) / 2 - 0.02, Z_FAR); ballast.receiveShadow = true; g.add(ballast);
    const shoulder = new THREE.Mesh(new THREE.BoxGeometry(len, 0.2 + LIFT, 4.4), new THREE.MeshStandardMaterial({ color: 0x8a6446, roughness: 1 }));
    shoulder.position.set(x0 + len / 2, (0.2 + LIFT) / 2 - 0.05, Z_FAR); shoulder.receiveShadow = true; g.add(shoulder);
    const n = Math.round(len / 0.62);
    const sl = new THREE.InstancedMesh(new THREE.BoxGeometry(0.3, 0.14, 2.55), new THREE.MeshStandardMaterial({ color: 0x4a3526, roughness: 0.92 }), n);
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < n; i++) { m4.makeTranslation(x0 + i * 0.62 + 0.31, 0.41 + LIFT, Z_FAR); sl.setMatrixAt(i, m4); }
    sl.receiveShadow = true; g.add(sl);
    const railMat = new THREE.MeshStandardMaterial({ color: 0x8d8680, metalness: 0.9, roughness: 0.32 });
    for (const dz of [-0.68, 0.68]) {
      const r = new THREE.Mesh(new THREE.BoxGeometry(len, 0.16, 0.1), railMat); r.position.set(x0 + len / 2, 0.54 + LIFT, Z_FAR + dz); r.castShadow = true; r.receiveShadow = true; g.add(r);
    }
    scene.add(g); return g;
  }

  // ------------------------------------------------------------ 2 đoàn tàu trình diễn
  function buildShow(team, col) {
    const g = new THREE.Group();
    const eng = k.makeEngine(col.engine[0], team + 1); g.add(eng);
    const ten = k.makeTender(col.engine[0]); ten.position.x = -k.ENGINE_LEN / 2 - k.CART_GAP - k.TENDER_LEN / 2; g.add(ten);
    let cursor = -k.ENGINE_LEN / 2 - k.CART_GAP - k.TENDER_LEN - k.CART_GAP;
    const boxMat = new THREE.MeshStandardMaterial({ map: k.plankTexture(...col.box, true), roughness: 0.82 });
    const add = (obj, len) => { obj.position.x = cursor - len / 2; g.add(obj); cursor -= len + k.CART_GAP; };
    add(k.makeCart(null, col.frame, boxMat), k.CART_W);   // 1af: toa hàng gỗ thường, hoa văn khắc — không bảng TEAM
    const f1 = k.makeFiller("coach", team); add(f1.group, f1.len);
    add(k.makeCart(null, col.frame, boxMat), k.CART_W);   // 1af: toa hàng gỗ thường, hoa văn khắc — không bảng TEAM
    const f2 = k.makeFiller("coal", team); add(f2.group, f2.len);
    g.scale.setScalar(TS);
    k.weather(g);
    const wheels = [], rods = [];
    g.traverse(o => { if (o.userData.wheelR) wheels.push(o); if (o.userData.rod) rods.push(o); });
    scene.add(g);
    return { g, eng, wheels, rods, ang: 0, x: 0, smokeT: 0, chugT: 0, z: team === 0 ? 0 : Z_FAR, y: RAIL_TOP + (team === 0 ? 0 : LIFT), people: f1.people, coach: f1 };
  }

  // ------------------------------------------------------------ kịch bản
  let T = 0, active = false, done = null, X0 = 0, tr = [], track = null, idle = null, cues = [], fired = new Set(), shake = 0, finished = false;
  // mũi đầu máy (thế giới): 2 tàu nhích lên/tụt lại quanh nhau ⇒ vượt nhau liên tục
  const headOf = (i, t) => X0 + V * t + (i === 0 ? 2.4 * Math.sin(0.95 * t + 0.3) : 2.4 * Math.sin(0.95 * t + 0.3 + 2.6));
  const mid = t => (headOf(0, t) + headOf(1, t)) / 2;
  const lead = t => Math.max(headOf(0, t), headOf(1, t));
  const SEG = [
    { at: 0, f: t => { const x = t / LEAD, e = x * x * 0.75 + x * 0.25, ip = idle;
      const d = [ip.l[0] - ip.p[0], ip.l[1] - ip.p[1], ip.l[2] - ip.p[2]], dl = Math.hypot(...d);
      return pose([ip.p[0] + d[0] / dl * 16 * e, ip.p[1] + d[1] / dl * 16 * e - 3 * e, ip.p[2] + d[2] / dl * 16 * e], [ip.l[0], ip.l[1] - 14 * e, ip.l[2]], lerp(ip.fov, 31, e)); } },
    // cảnh 1: góc chéo PHÍA TRƯỚC, hơi cao — thấy cả 2 đầu máy cạnh nhau (nhìn ngang thì tàu gần che mất tàu xa)
    { at: LEAD, whip: 1, f: t => { const u = Eo((t - LEAD) / 0.9), m = mid(t); return pose([m + lerp(17, 10, u), lerp(3.8, 2.5, u), lerp(12, 8.2, u)], [m - 4, 1.5, Z_FAR / 2], 38); } },
    { at: 3.2, whip: -1, f: t => { const u = Eo((t - 3.2) / 0.7), h = headOf(0, t); return pose([h + lerp(9, 5.2, u), 0.95, lerp(5.5, 3.6, u)], [h - 1.0, 1.9, 0], lerp(40, 32, u)); } },
    { at: 4.9, whip: 1, f: t => { const u = Eo((t - 4.9) / 0.7), h = headOf(1, t); return pose([h + lerp(9, 5.2, u), 1.25, Z_FAR + lerp(5.3, 3.4, u)], [h - 1.0, 2.2, Z_FAR], lerp(40, 32, u)); } },
    { at: 6.6, whip: -1, f: t => { const s = t - 6.6, L = lead(6.6) + 17 + V * 0.72 * s; return pose([L, 1.35, Z_FAR / 2], [L - 12, 1.9, Z_FAR / 2], 44); } },
    { at: 8.4, whip: 1, f: t => { const u = E((t - 8.4) / 2.2), m = mid(t); return pose([m - 17 + u * 3, 2.6 + u * 8, 11 + u * 5], [m + 9, 2.2 + u * 0.8, Z_FAR / 2], 40); } },
  ];
  function poseAt(t) { let i = 0; while (i + 1 < SEG.length && t >= SEG[i + 1].at) i++; return SEG[i].f(t); }
  const Y = new THREE.Vector3(0, 1, 0);
  function apply(P, dt) {
    shake *= Math.exp(-dt * 6);
    const jx = (Math.random() - 0.5) * shake, jy = (Math.random() - 0.5) * shake;
    camera.position.set(P.p[0] + jx, P.p[1] + jy, P.p[2]);
    camera.up.set(0, 1, 0); camera.lookAt(P.l[0] + jx * 0.5, P.l[1] + jy * 0.5, P.l[2]);
    if (Math.abs(camera.fov - P.fov) > 1e-3) { camera.fov = P.fov; camera.updateProjectionMatrix(); }
    // lia vụt quanh mỗi cú cắt: quật ngang + nhoè ngang (GRADE_SHADER.whip)
    let w = 0;
    for (let i = 1; i < SEG.length; i++) {
      const s = SEG[i], d = T - s.at; if (Math.abs(d) >= WHIP) continue;
      const a = 1 - Math.abs(d) / WHIP, a2 = a * a;
      camera.rotateOnWorldAxis(Y, (d < 0 ? -1 : 1) * s.whip * 0.5 * a2); w = s.whip * a2;
    }
    gradeU.whip.value = w;
  }
  function stepTrains(dt) {
    tr.forEach((o, i) => {
      const nx = headOf(i, T), dx = nx - o.x; o.x = nx;
      o.g.position.set(nx - k.ENGINE_LEN / 2 * TS, o.y, o.z);
      for (const w of o.wheels) w.rotation.y -= dx / (w.userData.wheelR * TS);
      o.ang -= dx / (0.82 * TS);
      for (const r of o.rods) { const u = r.userData.rod, a = o.ang + u.ph; r.position.x = u.x0 + Math.cos(a) * u.r; r.position.y = u.y0 + Math.sin(a) * u.r * (u.tilt ? 0.5 : 1); if (u.tilt) r.rotation.z = Math.sin(a) * 0.12; }
      const v = dx / Math.max(dt, 1e-4);
      o.smokeT -= dt;
      if (o.smokeT <= 0) {   // khói ống khói dạt về sau theo tốc độ
        o.smokeT = 0.07;
        const p = o.eng.userData.stack.clone(); o.eng.localToWorld(p);
        const sh = 0.55 + Math.random() * 0.35;
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: k.smokeTex, color: new THREE.Color(sh * 0.8, sh * 0.77, sh * 0.74), transparent: true, depthWrite: false, opacity: 0.55 }));
        s.position.copy(p); s.scale.setScalar(0.7); s.material.rotation = Math.random() * 6; k.fxRoot.add(s);
        S.fx.push({ obj: s, t: 0, life: 2.2, kind: "smoke", v: new THREE.Vector3(v * 0.35, 1.9 + Math.random() * 0.6, -0.4), grow: 4.4 });
      }
      o.chugT -= dt; if (o.chugT <= 0 && i === 0) { sfx.chug(Math.min(v, 9)); o.chugT = 0.16; }
      if (o.people) k.animatePassengers(o.people, S.time, null, null, dt);
    });
  }
  function cue(at, fn) { cues.push({ at, fn }); }
  function show(sel, on = true) { $(sel).classList.toggle("is-in", on); }

  function begin(ctx) {
    if (active) return;
    done = ctx.onDone; idle = ctx.idle; X0 = ctx.x0; T = 0; active = true; finished = false; shake = 0; cues = []; fired = new Set();
    track = buildTrack(X0 - 60, 420);
    tr = [buildShow(0, ctx.colors[0]), buildShow(1, ctx.colors[1])];
    tr.forEach((o, i) => { o.x = headOf(i, 0); });
    stepTrains(0);
    audio();
    ov.hidden = false; ov.className = "fc is-on";
    ov.querySelectorAll(".is-in, .is-out").forEach(e => e.classList.remove("is-in", "is-out"));
    // chữ + tiếng
    cue(0.3, () => { show(".fc-pre"); boom(0.5); });
    cue(LEAD - 0.1, () => show(".fc-pre", false));
    for (const s of SEG.slice(1)) cue(Math.max(0, s.at - 0.14), () => whoosh(0.4, 0.32));
    cue(LEAD + 0.3, () => { sfx.whistle(); });
    cue(3.35, () => { show(".fc-team.t0"); boom(0.45); sfx.whistle(); });
    cue(4.75, () => show(".fc-team.t0", false));
    cue(5.05, () => { show(".fc-team.t1"); boom(0.45); sfx.whistle(); });
    cue(6.45, () => show(".fc-team.t1", false));
    cue(6.2, () => riser(0.9));
    cue(7.1, () => { show(".fc-vs"); boom(0.9); shake = 0.35; });
    cue(8.25, () => show(".fc-vs", false));
    cue(8.4, () => riser(0.6));
    cue(9.0, () => { show(".fc-title"); boom(1); shake = 0.3; });
    cue(DUR - FADE, () => { ov.classList.add("is-dark"); whoosh(1.0, 0.25); });
    apply(poseAt(0), 0);
  }
  function end() {
    if (!active) return;
    active = false;
    gradeU.sepia.value = 0; gradeU.whip.value = 0;
    camera.up.set(0, 1, 0);
    for (const o of tr) { scene.remove(o.g); o.g.traverse(x => { if (x.geometry && !x.geometry.userData.shared) x.geometry.dispose(); }); }
    tr = [];
    if (track) { scene.remove(track); track.traverse(x => { if (x.geometry) x.geometry.dispose(); if (x.material) x.material.dispose(); }); track = null; }
    const cb = done; done = null;
    ov.hidden = true; ov.className = "fc";
    if (cb) cb();
  }
  const api = {
    get active() { return active; },
    get t() { return T; },
    dur: DUR,
    begin,
    update(dt) {
      if (!active) return;
      T += dt;
      for (const c of cues) if (T >= c.at && !fired.has(c)) { fired.add(c); c.fn(); }
      // màu: ngả nâu dần trong đoạn mở đầu, giữ nâu qua 2 cảnh đội, về màu thật trước khi đối đầu
      gradeU.sepia.value = T < LEAD ? E(T / LEAD) : 1 - E((T - 5.2) / 1.4);
      stepTrains(dt);
      S.camX = mid(T); S.trainX = lead(T);   // khúc cảnh, bảng chữ, con vật bám quanh 2 tàu
      apply(poseAt(Math.min(T, DUR)), dt);
      if (T >= DUR) end();
    },
    // bỏ qua: nhảy tới lúc sập tối
    skip() {
      if (!active || T >= DUR - FADE) return;
      T = DUR - FADE; for (const c of cues) if (c.at < T) fired.add(c);
      ov.querySelectorAll(".is-in").forEach(e => e.classList.remove("is-in"));
      ov.classList.add("is-dark");
    },
    end,
  };
  return api;
}
