// ⭐ Đợt 407 (thầy 27/9/2026): chép NGUYÊN từ kho myGame `rocket-race/game6c/rr3d-missile.js` (MẪU 6c thầy duyệt, cam đậm).
// Sửa mô-đun này: làm ở myGame trước → thầy OK → chép sang (như cảnh phóng, GHI CHU ROCKET-RACE mục 32).
// =============================================================
// ROCKET RACE 3D — TÊN LỬA TẤN CÔNG giữa 2 tàu (MẪU 6c, thầy 27/9/2026 — sửa từ 6b: bỏ khung ô tên lửa + BOOST; sai-bị-lùi đúng lúc cũng né)
// (6b, thầy 26/9/2026 — sửa từ mẫu 6)
// Luật (do trang game / rocket-race.js giữ — mô-đun này CHỈ VẼ):
//   · đúng 3 câu LIÊN TIẾP = +1 tên lửa (tối đa 3 quả) — hiệu ứng nạp ngầu
//   · MỘT ô dưới cột đáp án (không chữ): quả to đã lên nòng + các quả dự phòng nhỏ; chạm ô = bắn
//   · 6b: lên nòng ⇒ cửa khoang (cắt ĐÚNG theo vỏ tàu, đóng lại gần như liền) mở, 2 CÁNH TAY ROBOT gập-duỗi đưa quả đỏ
//     lên, gắn SÁT và SONG SONG thân tàu; bắn xong tay thu vào, cửa đóng
//   · 6b: bắn ⇒ góc nhìn RỘNG (G.wideCam), tên lửa bay VÒNG LÊN rồi LAO THẲNG XUỐNG tàu địch (không lượn ngang)
//   · 1,5 s cuối: đội bị bắn trả lời ĐÚNG hoặc bấm BOOST ⇒ tàu vọt lên né, tên lửa lao hụt xuống rồi nổ
//   · 6b: BOOST = thanh năng lượng cyan (không chữ, không chấm), đầy khi đủ 5 câu liên tiếp; bỏ dấu ngắm đỏ
// Gắn vào rr3d-view.js qua `createMissiles(ctx)`; view gọi attach/buildConsole/poseRocket/tick/tap.
// =============================================================

export function createMissiles(X) {
  const { THREE, scene, rockets, cfg, fire, smoke, burst, explosion, sfx, labelOn, shake, stall, hitList,
    frameGeo, RoundedBoxGeometry, radialTex, G } = X;
  const V3 = THREE.Vector3;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a, b) => a + Math.random() * (b - a);
  const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const easeOutBack = t => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  const MC = Object.assign({ dur: 3.8, window: 1.5, ammoCm: 8.5, boostCm: 2.6, gapCm: 0.7 }, cfg.missiles || {});
  const TRAVEL = cfg.travelDir.clone().normalize(), UP = new V3(0, 1, 0);
  const RS = cfg.rocketScale ?? 1;

  // ---------------------------------------------------------------- mô hình tên lửa (dọc +X, dài 2,3 đv)
  const mRed = new THREE.MeshPhysicalMaterial({ color: "#d4121e", metalness: 0.35, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.08,
    emissive: new THREE.Color("#ff1a24"), emissiveIntensity: 0.22, envMapIntensity: 0.8 });
  const mRedDark = new THREE.MeshPhysicalMaterial({ color: "#8e0b14", metalness: 0.4, roughness: 0.35, clearcoat: 0.8, emissive: new THREE.Color("#ff1a24"), emissiveIntensity: 0.1 });
  const mWhite = new THREE.MeshPhysicalMaterial({ color: "#eef0f3", metalness: 0.2, roughness: 0.35, clearcoat: 0.6 });
  const mDark = new THREE.MeshStandardMaterial({ color: "#2b3039", metalness: 0.85, roughness: 0.32 });
  const mJoint = new THREE.MeshStandardMaterial({ color: "#8a929e", metalness: 0.95, roughness: 0.25 });
  const mPit = new THREE.MeshStandardMaterial({ color: "#07080b", metalness: 0.4, roughness: 0.85, side: THREE.DoubleSide });
  const mGlow = new THREE.MeshBasicMaterial({ color: new THREE.Color(4.2, 0.35, 0.25) });
  const alongX = g => { g.rotateZ(-Math.PI / 2); return g; };                 // dựng dọc +Y → nằm dọc +X
  const lat = (pts, segs = 32) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), segs);
  const GEO = (() => {
    const nosePts = []; for (let i = 0; i <= 12; i++) { const y = i / 12 * 0.62; nosePts.push([Math.max(0.001, 0.2 * Math.pow(1 - Math.pow(y / 0.62, 2), 0.55)), y]); }
    const fs = new THREE.Shape(); fs.moveTo(0, 0); fs.lineTo(0.46, 0); fs.lineTo(0.3, 0.3); fs.lineTo(0.08, 0.3); fs.closePath();
    const fin = new THREE.ExtrudeGeometry(fs, { depth: 0.035, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2 });
    fin.translate(-1.1, 0.17, -0.0175);
    const flame = new THREE.ConeGeometry(0.15, 1.2, 16, 1, true); flame.rotateZ(Math.PI / 2); flame.translate(-1.75, 0, 0);
    return {
      body: alongX(new THREE.CylinderGeometry(0.2, 0.2, 1.5, 32)).translate(-0.2, 0, 0),
      nose: alongX(lat(nosePts)).translate(0.55, 0, 0),
      band: alongX(new THREE.CylinderGeometry(0.204, 0.204, 0.07, 32, 1, true)),
      glow: alongX(new THREE.CylinderGeometry(0.207, 0.207, 0.045, 32, 1, true)).translate(-0.86, 0, 0),
      tail: alongX(lat([[0.001, -0.2], [0.13, -0.2], [0.17, -0.12], [0.2, 0]])).translate(-0.95, 0, 0),
      fin, flame
    };
  })();
  const flareTex = radialTex([[0, "rgba(255,255,255,1)"], [0.2, "rgba(255,220,190,0.9)"], [0.5, "rgba(255,90,60,0.3)"], [1, "rgba(0,0,0,0)"]], 128);
  function makeMissile() {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(GEO.body, mRed), new THREE.Mesh(GEO.nose, mRed), new THREE.Mesh(GEO.tail, mDark), new THREE.Mesh(GEO.glow, mGlow));
    [0.43, -0.72].forEach(x => { const b = new THREE.Mesh(GEO.band, mWhite); b.position.x = x; g.add(b); });
    for (let k = 0; k < 4; k++) { const f = new THREE.Mesh(GEO.fin, mRedDark); f.rotation.x = k * Math.PI / 2 + Math.PI / 4; g.add(f); }
    const flame = new THREE.Mesh(GEO.flame, new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 1.5, 0.45), transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    const flare = new THREE.Sprite(new THREE.SpriteMaterial({ map: flareTex, color: new THREE.Color(5, 2.2, 1), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    flare.position.x = -1.25; flare.scale.setScalar(1.1);
    flame.visible = flare.visible = false;
    g.add(flame, flare);
    return { g, flame, flare };
  }

  // ---------------------------------------------------------------- 6b: KHOANG + 2 CÁNH TAY ROBOT
  // Biên dạng vỏ — PHẢI khớp makeRocket (thân lathe): cửa khoang là LÁT CẮT của chính vỏ tàu ⇒ đóng lại gần như liền.
  const HULL_PTS = [[0.42, -1.9], [0.5, -1.6], [0.56, -1.2], [0.58, -0.6], [0.58, 0.5]];
  const hullR = y => { for (let i = 1; i < HULL_PTS.length; i++) { const [r0, y0] = HULL_PTS[i - 1], [r1, y1] = HULL_PTS[i]; if (y <= y1) return lerp(r0, r1, clamp((y - y0) / (y1 - y0), 0, 1)); } return 0.58; };
  const Y0 = -1.4, Y1 = 0.95, XC = (Y0 + Y1) / 2;        // cửa chạy dọc thân (trục Y mô hình = hướng bay của tàu)
  const DELTA = 0.37;                                    // nửa góc cửa (rad) ⇒ lỗ mở rộng ~0,42 đv
  const TOP = Math.PI * 1.5;                             // mô hình dựng dọc +Y, xoay −90° quanh Z ⇒ NÓC tàu = −X mô hình ⇒ φ = 270°
  const MS = 1.05;                                       // cỡ quả trên tàu và lúc bay
  const M_R = 0.2 * MS;
  const Y_IN = 0.3, Y_OUT = 0.58 + 0.13 + M_R;           // tâm quả: nằm TRONG thân ↔ gắn sát trên nóc (hở 0,13 cho thấy 2 tay kẹp)
  const LA = 0.36, LB = 0.36, SH_Y = 0.02;               // 2 đốt tay + vai (sâu trong thân)
  function sliceGeo(rs, phiStart, phiLen) {
    const pts = []; for (let i = 0; i <= 16; i++) { const y = lerp(Y0, Y1, i / 16); pts.push(new THREE.Vector2(hullR(y) * rs, y)); }
    return new THREE.LatheGeometry(pts, 10, phiStart, phiLen);
  }
  function attach(r) {
    const bay = new THREE.Group(); r.model.add(bay);      // cửa dựng trong không gian MÔ HÌNH (cùng trục lathe với vỏ)
    const pit = new THREE.Mesh(sliceGeo(0.94, TOP - DELTA, DELTA * 2), mPit); pit.visible = false; bay.add(pit);
    const door = sgn => {
      // bản lề ở MÉP NGOÀI cửa (φ = 270° ∓ δ, r = 0,58); cửa xoay quanh trục song song thân tàu
      const phi = TOP - sgn * DELTA, hx = 0.58 * Math.sin(phi), hz = 0.58 * Math.cos(phi);
      const geo = sgn > 0 ? sliceGeo(1.012, TOP - DELTA, DELTA) : sliceGeo(1.012, TOP, DELTA);
      geo.translate(-hx, 0, -hz);
      const h = new THREE.Group(); h.position.set(hx, 0, hz);
      const mesh = new THREE.Mesh(geo, r.hullMat); h.add(mesh);
      bay.add(h); return h;
    };
    const dL = door(1), dR = door(-1);
    // tay robot + quả: dựng trong không gian TÀU (+X hướng bay, +Y nóc)
    const rig = new THREE.Group(); rig.position.x = XC; r.ship.add(rig);
    const ms = makeMissile(); ms.g.scale.setScalar(MS); ms.g.visible = false; rig.add(ms.g);
    const linkGeo = new THREE.BoxGeometry(1, 0.075, 0.075); linkGeo.translate(0.5, 0, 0);
    const jointGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.11, 16).rotateX(Math.PI / 2);
    const arms = [-0.62, 0.55].map(ax => {
      const sh = new THREE.Group(); sh.position.set(ax, SH_Y, 0); rig.add(sh);
      const up = new THREE.Mesh(linkGeo, mDark); up.scale.x = LA; sh.add(up);
      sh.add(new THREE.Mesh(jointGeo, mJoint));
      const elbow = new THREE.Group(); elbow.position.x = LA; sh.add(elbow);
      elbow.add(new THREE.Mesh(jointGeo, mJoint));
      const fore = new THREE.Mesh(linkGeo, mDark); fore.scale.x = LB; elbow.add(fore);
      const claw = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.24), mJoint); rig.add(claw);   // kẹp: ôm dưới bụng quả
      return { ax, sh, elbow, claw };
    });
    r.mis = { bay, pit, dL, dR, rig, ms, arms, open: 0, rise: 0, wantRise: 0, has: false };
    poseMount(r, 0);
  }
  // 2 đốt tay (IK): vai cố định trong thân, cổ tay dính dưới bụng quả; khuỷu gập về phía MŨI tàu
  function poseArm(a, wristY) {
    const dy = wristY - SH_Y, d = clamp(Math.abs(dy), 0.03, LA + LB - 1e-3);
    const base = Math.PI / 2;                                             // cổ tay NGAY TRÊN vai
    const off = Math.acos(clamp((LA * LA + d * d - LB * LB) / (2 * LA * d), -1, 1));
    const sh = base - off;                                                // đốt trên nghiêng về +X (mũi tàu)
    const ex = Math.cos(sh) * LA, ey = Math.sin(sh) * LA;
    a.sh.rotation.z = sh;
    a.elbow.rotation.z = Math.atan2(dy - ey, 0 - ex) - sh;
    a.claw.position.set(a.ax, wristY + 0.025, 0);
  }
  function poseMount(r, dt) {
    const m = r.mis; if (!m) return;
    m.rig.visible = r.model.visible && !r.wreck && !r.hidden;
    if (m.wantRise > m.rise) { if (m.open >= 0.97) m.rise = Math.min(m.wantRise, m.rise + dt / 0.7); }
    else if (m.wantRise < m.rise) { if (m.open >= 0.97) m.rise = Math.max(m.wantRise, m.rise - dt / 0.55); }
    // cửa chỉ mở lúc tay đang đưa ra / thu vào; quả đã gắn xong ⇒ cửa ĐÓNG lại dưới bụng quả (thân tàu như cũ, chỉ còn 2 tay kẹp)
    const moving = m.wantRise !== m.rise || (m.rise > 0.02 && m.rise < 1);
    const openT = moving ? 1 : 0;
    m.open = clamp(m.open + clamp(openT - m.open, -dt / 0.4, dt / 0.35), 0, 1);
    const a = smooth(m.open) * 1.75;
    m.dL.rotation.y = -a; m.dR.rotation.y = a;
    m.pit.visible = m.open > 0.01;
    const k = m.rise < 1 ? smooth(m.rise) : 1;
    const y = lerp(Y_IN, Y_OUT, k) + (m.rise >= 1 ? Math.sin(G.t * 3 + r.idx) * 0.008 : 0);
    m.ms.g.position.set(0, y, 0);
    m.ms.g.visible = m.has && (m.open > 0.9 || m.rise > 0);            // cánh đuôi quả thò ra ngoài vỏ ⇒ chỉ hiện khi cửa đã mở
    const armOn = m.open > 0.02 || m.rise > 0;
    m.arms.forEach(arm => { arm.sh.visible = arm.claw.visible = armOn; poseArm(arm, y - M_R - 0.05); });
  }

  // ---------------------------------------------------------------- trạng thái kho (do trang game đặt)
  const A = [0, 1].map(() => ({ reserve: 0, loaded: false, pips: 0, pipsMax: 3, full: false, boost: false, boostPips: 0, boostMax: 5, locked: false, on: true }));
  const UI = [null, null];
  const pending = [];
  const later = (t, fn) => pending.push({ t, fn });

  // ---------------------------------------------------------------- 6c: KHÔNG KHUNG — tên lửa nổi ngay dưới cột đáp án + thanh BOOST dạng viên thuốc
  // Thầy (27/9): "khung trông xấu quá" ⇒ bỏ hết khung/ô: quả to (đã lên nòng) + quả nhỏ dự phòng nổi tự do, dưới quả to là quầng đỏ
  // mềm khi sẵn sàng; chưa có quả ⇒ bóng mờ hình quả (biết chỗ để chạm). BOOST: rãnh mờ + dải cyan bo tròn 2 đầu, không viền.
  // Vùng chạm là mặt phẳng TÀNG HÌNH phủ đúng khu vực (to hơn hình vẽ cho dễ chạm).
  const mGhost = new THREE.MeshBasicMaterial({ color: new THREE.Color("#8fa0c0"), transparent: true, opacity: 0.16, depthWrite: false });
  const mHit = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
  function capsuleGeo(x0, x1, h) {                          // viên thuốc từ x0 → x1, cao h (2 đầu tròn)
    const L0 = Math.min(x0, x1), L1 = Math.max(x0, x1), r = h / 2, w = Math.max(L1 - L0, 1e-4);
    const sh = new THREE.Shape();
    if (w <= h) { sh.absellipse((L0 + L1) / 2, 0, w / 2, r, 0, Math.PI * 2, false, 0); return new THREE.ShapeGeometry(sh, 16); }
    sh.moveTo(L0 + r, -r); sh.lineTo(L1 - r, -r); sh.absarc(L1 - r, 0, r, -Math.PI / 2, Math.PI / 2, false);
    sh.lineTo(L0 + r, r); sh.absarc(L0 + r, 0, r, Math.PI / 2, Math.PI * 1.5, false);
    return new THREE.ShapeGeometry(sh, 16);
  }
  const fat = (g, k) => g.scale.set(k, k * 1.35, k * 1.35);       // quả trong bảng: mập hơn cho dễ nhìn
  function ghostOf() {
    const m = makeMissile();
    m.g.traverse(o => { if (o.isMesh && o !== m.flame) o.material = mGhost; });
    m.flame.visible = m.flare.visible = false;
    return m;
  }
  function buildConsole(con, inner, s, pad, cm) {
    const side = con.side;
    const areaW = s.w - pad * 2;
    const ammoH = MC.ammoCm * cm, boostH = MC.boostCm * cm, gap = MC.gapCm * cm;
    const yAmmo = -s.h / 2 - gap - ammoH / 2, yBoost = yAmmo - ammoH / 2 - gap - boostH / 2;
    const inSign = side === 0 ? 1 : -1;                       // phía TRONG (giữa màn) = quả to; phía ngoài = quả dự phòng
    const am = new THREE.Group(); am.position.set(0, yAmmo, 0.05); inner.add(am);
    const bigW = areaW * 0.66, spW = areaW * 0.28;
    const bigX = inSign * (areaW / 2 - bigW / 2), spX = -inSign * (areaW / 2 - spW / 2);
    const miniS = spW * 0.95 / 2.3, bigS = bigW * 0.95 / 2.3;
    const rotY = inSign > 0 ? 0 : Math.PI;                    // mũi chĩa về phía tàu địch
    const minis = [0.2, -0.2].map(fy => { const m = makeMissile(); m.g.position.set(spX, fy * ammoH, 0.14); m.g.rotation.y = rotY; m.g.visible = false; am.add(m.g); return m; });
    const big = makeMissile(); big.g.position.set(bigX, 0, 0.18); big.g.rotation.y = rotY; big.g.visible = false; am.add(big.g);
    const ghost = ghostOf(); ghost.g.position.set(bigX, 0, 0.12); ghost.g.rotation.y = rotY; fat(ghost.g, bigS); am.add(ghost.g);
    const glowSp = new THREE.Sprite(new THREE.SpriteMaterial({ map: flareTex, color: new THREE.Color(4, 0.5, 0.35), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
    glowSp.scale.set(bigW * 1.3, ammoH * 1.1, 1); glowSp.position.set(bigX, -ammoH * 0.05, 0.06); am.add(glowSp);
    const shuttle = makeMissile(); shuttle.g.visible = false; shuttle.g.rotation.y = rotY; am.add(shuttle.g);
    const hitAm = new THREE.Mesh(new THREE.PlaneGeometry(areaW * 1.05, ammoH * 1.1), mHit); hitAm.position.z = 0.3; am.add(hitAm);
    // BOOST: rãnh mờ + dải cyan (gốc ở mép NGOÀI, dài vào giữa màn) + quầng cyan khi đầy
    const bst = new THREE.Group(); bst.position.set(0, yBoost, 0.05); inner.add(bst);
    const barH = boostH * 0.5, x0 = -inSign * areaW / 2;
    const track = new THREE.Mesh(capsuleGeo(-areaW / 2, areaW / 2, barH), new THREE.MeshBasicMaterial({ color: new THREE.Color("#0b1320"), transparent: true, opacity: 0.6, depthWrite: false }));
    bst.add(track);
    const fillMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0, 0.55, 0.78), transparent: true, opacity: 1, depthWrite: false });
    const fill = new THREE.Mesh(capsuleGeo(x0, x0 + inSign * 1e-4, barH * 0.8), fillMat); fill.position.z = 0.01; fill.visible = false; bst.add(fill);
    const bGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: flareTex, color: new THREE.Color(0.2, 1.6, 2.2), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
    bGlow.scale.set(areaW * 1.3, boostH * 2.2, 1); bGlow.position.z = -0.02; bst.add(bGlow);
    const hitB = new THREE.Mesh(new THREE.PlaneGeometry(areaW * 1.05, boostH * 1.3), mHit); hitB.position.z = 0.3; bst.add(hitB);
    // khung cảnh báo đỏ bao cả cột (chỉ hiện khi bị bắn)
    const top = s.h / 2, bot = yBoost - boostH / 2, fh = top - bot + pad, fw = s.w + pad * 0.6;
    const warnMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 0.35, 0.3), transparent: true, opacity: 0, depthWrite: false });
    const warn = new THREE.Mesh(frameGeo(fw, fh, Math.min(fw, fh) * 0.06, Math.min(fw, fh) * 0.014), warnMat);
    warn.position.set(0, (top + bot) / 2, 0.02); warn.visible = false; inner.add(warn);
    [[hitAm, "fire"], [hitB, "boost"]].forEach(([m, kind]) => { m.userData.ammo = { side, kind }; hitList.push(m); });
    UI[side] = { am, bst, minis, big, ghost, glowSp, shuttle, fill, fillMat, bGlow, x0, areaW, barH, warn, warnMat, inSign, miniS, bigS, bigX, spX, ammoH,
      press: { fire: 0, boost: 0 }, pop: [0, 0], popBig: 0, load: null, fireK: 0, shakeK: 0, flash: 0, fillK: 0, fillW: -1 };
  }
  function tickUI(side, dt) {
    const U = UI[side]; if (!U) return;
    const a = A[side], inc = incoming(side), win = inc <= MC.window;
    const shown = a.on ? Math.min(2, a.reserve) : 0;
    U.minis.forEach((m, i) => {
      const vis = i < shown;
      if (vis && !m.g.visible) U.pop[i] = 1;
      m.g.visible = vis;
      U.pop[i] = Math.max(0, U.pop[i] - dt / 0.55);
      fat(m.g, U.miniS * Math.max(0.01, U.pop[i] > 0 ? easeOutBack(1 - U.pop[i]) : 1));
      m.g.position.y = [0.2, -0.2][i] * U.ammoH + Math.sin(G.t * 2 + i * 1.7) * 0.008;
    });
    if (U.load) {                          // nạp: quả nhỏ bay sang chỗ quả to, lớn dần
      U.load.t += dt; const k = smooth(U.load.t / 0.5);
      U.shuttle.g.visible = true;
      U.shuttle.g.position.set(lerp(U.spX, U.bigX, k), lerp(0.2 * U.ammoH, 0, k), 0.16 + Math.sin(k * Math.PI) * 0.3);
      fat(U.shuttle.g, lerp(U.miniS, U.bigS, k));
      if (U.load.t >= 0.5) { U.load = null; U.shuttle.g.visible = false; U.popBig = 1; U.flash = 1; }
    }
    const bigVis = a.on && a.loaded && !U.load && U.fireK <= 0;
    U.big.g.visible = bigVis || U.fireK > 0;
    U.ghost.g.visible = a.on && !U.big.g.visible && !U.load;
    U.popBig = Math.max(0, U.popBig - dt / 0.5);
    if (U.fireK > 0) {                     // bắn: quả to vút về phía giữa màn rồi mất
      U.fireK = Math.max(0, U.fireK - dt / 0.3); const k = 1 - U.fireK;
      U.big.g.position.x = U.bigX + U.inSign * k * k * U.areaW * 0.9; fat(U.big.g, U.bigS * (1 + k * 0.4));
      U.big.flame.visible = U.big.flare.visible = true;
      if (U.fireK <= 0) { U.big.g.position.x = U.bigX; U.big.flame.visible = U.big.flare.visible = false; }
    } else {
      fat(U.big.g, U.bigS * Math.max(0.01, U.popBig > 0 ? easeOutBack(1 - U.popBig) : 1));
      U.big.g.position.y = Math.sin(G.t * 2.2) * 0.012;
    }
    U.flash = Math.max(0, U.flash - dt * 1.6);
    const ready = bigVis && !a.locked;
    U.glowSp.material.opacity = (ready ? 0.22 + 0.12 * Math.sin(G.t * 4) : 0) + U.flash * 0.8;
    // BOOST: dải cyan dài theo số câu liên tiếp (đầy = có BOOST), trượt mượt; vẽ lại hình viên thuốc khi độ dài đổi
    const want = a.boost ? 1 : clamp(a.boostPips / a.boostMax, 0, 1);
    U.fillK += (want - U.fillK) * Math.min(1, dt * 6);
    const w = U.fillK * U.areaW;
    if (Math.abs(w - U.fillW) > U.areaW * 0.004) {
      U.fillW = w; U.fill.visible = w > U.barH * 0.3;
      if (U.fill.visible) { U.fill.geometry.dispose(); U.fill.geometry = capsuleGeo(U.x0 + U.inSign * U.barH * 0.1, U.x0 + U.inSign * Math.max(U.barH * 0.9, w - U.barH * 0.1), U.barH * 0.8); }
    }
    const pul = 0.5 + 0.5 * Math.sin(G.t * (win ? 16 : 5));
    const full = a.boost && !a.locked;
    U.fillMat.color.setRGB(0, 0.55, 0.78).multiplyScalar(full ? (win ? 1.1 + 1.0 * pul : 1.25 + 0.2 * pul) : 1);   /* ACES làm nhạt màu sáng ⇒ cường độ thấp cho ra CYAN đậm */
    U.bGlow.material.opacity = full ? (win ? 0.35 + 0.45 * pul : 0.14 + 0.08 * pul) : 0;
    ["fire", "boost"].forEach(k => { U.press[k] = Math.max(0, U.press[k] - dt * 4); });
    U.am.scale.setScalar(1 - U.press.fire * 0.05);
    U.shakeK = Math.max(0, U.shakeK - dt * 3);
    U.bst.scale.setScalar(1 - U.press.boost * 0.05);
    U.bst.position.x = U.shakeK > 0 ? Math.sin(G.t * 60) * 0.03 * U.shakeK : 0;
    U.warn.visible = inc < Infinity;       // khung đỏ: chậm khi tên lửa đang bay, NHANH trong 1,5 s cuối
    U.warnMat.opacity = inc < Infinity ? (win ? 0.35 + 0.65 * pul : 0.15 + 0.3 * pul) : 0;
  }

  // ---------------------------------------------------------------- tên lửa đang bay: VÒNG LÊN rồi LAO THẲNG XUỐNG
  const pool = [0, 1, 2, 3, 4, 5].map(() => { const m = makeMissile(); m.g.visible = false; m.g.scale.setScalar(RS * MS); scene.add(m.g); return m; });
  const flights = [];
  let nextId = 1;
  const shipPos = (r, out = new V3()) => out.setFromMatrixPosition(r.ship.matrixWorld);
  function bez(p0, p1, p2, p3, u, out) {
    const a = (1 - u) ** 3, b = 3 * (1 - u) ** 2 * u, c = 3 * (1 - u) * u * u, d = u ** 3;
    return out.set(0, 0, 0).addScaledVector(p0, a).addScaledVector(p1, b).addScaledVector(p2, c).addScaledVector(p3, d);
  }
  function ctrl(f, T) {
    // lên cao theo khoảng cách 2 tàu; điểm điều khiển cuối NGAY TRÊN tàu địch ⇒ đoạn cuối rơi thẳng đứng (thấy rõ va / hụt)
    const H = 9 + Math.abs(T.z - f.p0.z) * 0.18;
    return { p1: f.p0.clone().addScaledVector(UP, H), p2: T.clone().addScaledVector(UP, H) };
  }
  function launch(from, to) {
    const r = rockets[from], m = pool.find(p => !p.g.visible); if (!m || !r.mis) return 0;
    const src = r.mis.ms.g;
    const p0 = new V3(), q0 = new THREE.Quaternion();
    if (r.mis.has && src.visible) { src.getWorldPosition(p0); src.getWorldQuaternion(q0); }
    else { shipPos(r, p0).addScaledVector(UP, 1.1); q0.setFromUnitVectors(new V3(1, 0, 0), TRAVEL); }
    src.visible = false; r.mis.has = false; r.mis.wantRise = 0;   // quả rời tay ⇒ tay thu vào, cửa đóng
    m.g.position.copy(p0); m.g.quaternion.copy(q0); m.g.visible = true; m.flame.visible = m.flare.visible = true;
    const f = { id: nextId++, m, from, to, t: 0, dur: MC.dur, p0, prev: p0.clone(), dodged: false, anchor: null, passed: false, after: 0, vel: new V3(), beepT: 0 };
    flights.push(f);
    G.wideCam = true;                                  // 6b: góc nhìn RỘNG để thấy cả đường bay + va chạm
    for (let i = 0; i < 16; i++) smoke.emit({ pos: p0.clone().add(new V3(rand(-0.4, 0.4), rand(-0.2, 0.2), rand(-0.4, 0.4))), vel: new V3(rand(-1.5, 1.5), rand(0.5, 2), rand(-1.5, 1.5)), life: rand(1.2, 1.9), size: 0.5, sizeEnd: 2.4, color: new THREE.Color(0.75, 0.75, 0.8), alpha: 0.4, drag: 1.2 });
    burst(p0, { n: 50, speed: 6, color: new THREE.Color(5, 2.2, 0.8), colorEnd: new THREE.Color(1.5, 0.2, 0.05), size: 0.18, life: 0.5 });
    sfx("mlaunch", 1);
    shake(0.2);
    if (UI[from]) UI[from].fireK = 1;
    return f.id;
  }
  function timeLeft(f) { return f.passed || f.dodged ? Infinity : Math.max(0, f.dur - f.t); }
  function incoming(side) { let m = Infinity; flights.forEach(f => { if (f.to === side) m = Math.min(m, timeLeft(f)); }); return m; }
  // 6c: né TIẾN (trả lời đúng / BOOST) hoặc né LÙI (trả lời SAI mà Options có trừ điểm ⇒ tàu bị lùi đúng lúc) — back: true
  function dodge(side, opts = {}) {
    let any = false;
    flights.forEach(f => {
      if (f.to !== side || f.dodged || f.passed || f.dur - f.t > MC.window + 0.05) return;
      f.dodged = true; f.anchor = shipPos(rockets[side]); any = true;
    });
    if (any) {
      const r = rockets[side], dir = opts.back ? -1 : 1;
      if (!r.surge) r.surge = { t: 0, back: 0, dir };
      labelOn(r, "DODGE!", "#7fe6ff"); sfx("mdodge", 1);
      if (dir > 0) { r.boost = 1; sfx("boost", 0.6); burst(shipPos(r).addScaledVector(TRAVEL, -2.6), { n: 90, speed: 9, color: new THREE.Color(1.2, 2.6, 5), colorEnd: new THREE.Color(0.2, 0.4, 1.6), size: 0.24, life: 0.6 }); }
    }
    return any;
  }
  // tàu né: VỌT LÊN phía trước rồi TỪ TỪ về chỗ cũ (không cộng nấc) — giữ ở phía trước tới khi quả tên lửa lao qua hẳn
  function poseRocket(r, i, dt) {
    const s = r.surge; if (!s) return;
    s.t += dt;
    const hold = flights.some(f => f.to === i && f.dodged && f.t < f.dur + 0.35);
    if (s.t > 0.35 && !hold) s.back += dt / 1.4;
    const k = (1 - Math.pow(1 - clamp(s.t / 0.35, 0, 1), 3)) * (1 - smooth(s.back));
    r.rig.position.addScaledVector(TRAVEL, 3.6 * k * (s.dir || 1));     // 6c: dir −1 = giật LÙI (cùng lúc tàu lùi nấc vì trả lời sai)
    if (s.back >= 1) r.surge = null;
  }
  function airburst(pos, sc = 0.6) { explosion(pos, sc); sfx("boom", 0.55); }
  function stepFlights(dt) {
    for (let i = flights.length - 1; i >= 0; i--) {
      const f = flights[i]; const m = f.m;
      f.t += dt;
      const T = f.anchor ? f.anchor : shipPos(rockets[f.to]);
      let pos;
      if (!f.passed) {
        const k = clamp(f.t / f.dur, 0, 1), u = 0.6 * k + 0.4 * k * k;     // lên chậm, lao xuống nhanh dần
        const c = ctrl(f, T);
        pos = bez(f.p0, c.p1, c.p2, T, u, new V3());
        if (k >= 1) {
          f.passed = true;
          if (!f.dodged) {                                   // TRÚNG
            flights.splice(i, 1); m.g.visible = false; m.flame.visible = m.flare.visible = false;
            explosion(T.clone(), 0.75); sfx("hit2", 1); sfx("boom", 0.7);
            stall(rockets[f.to]);
            X.onEnd && X.onEnd(f.to, "hit", f.from);
            continue;
          }
          X.onEnd && X.onEnd(f.to, "miss", f.from);            // né được: lao HỤT xuống thêm một đoạn rồi nổ
          f.vel.copy(pos).sub(f.prev).divideScalar(Math.max(1e-4, dt));
          if (f.vel.length() < 10) f.vel.setLength(10);
        }
      }
      if (f.passed) {
        f.after += dt; f.vel.multiplyScalar(1 + dt * 0.8);
        pos = m.g.position.clone().addScaledVector(f.vel, dt);
        if (f.after > 0.8) { flights.splice(i, 1); m.g.visible = false; m.flame.visible = m.flare.visible = false; airburst(pos); continue; }
      }
      const vel = pos.clone().sub(f.prev);
      if (vel.lengthSq() > 1e-8) { const q = new THREE.Quaternion().setFromUnitVectors(new V3(1, 0, 0), vel.clone().normalize()); m.g.quaternion.slerp(q, f.t < 0.15 ? 0.25 : 0.6); }
      m.g.position.copy(pos);
      const dist = vel.length(), n = Math.min(20, Math.ceil(dist / 0.1));
      const tail = new V3(-1.25 * RS * MS, 0, 0).applyQuaternion(m.g.quaternion);
      for (let j = 0; j < n; j++) {
        const p = f.prev.clone().lerp(pos, (j + 1) / n).add(tail);
        fire.emit({ pos: p, vel: new V3(rand(-0.3, 0.3), rand(-0.3, 0.3), rand(-0.3, 0.3)), life: rand(0.15, 0.3), size: 0.5, sizeEnd: 0.08, color: new THREE.Color(4, 1.8, 0.6), colorEnd: new THREE.Color(1.4, 0.2, 0.05), drag: 1 });
        if (j % 2 === 0) smoke.emit({ pos: p.clone(), vel: new V3(rand(-0.2, 0.2), rand(0, 0.3), rand(-0.2, 0.2)), life: rand(1.2, 1.8), size: 0.35, sizeEnd: 1.6, color: new THREE.Color(0.8, 0.8, 0.84), alpha: 0.28, drag: 0.6 });
      }
      m.flame.scale.set(1, 0.85 + Math.random() * 0.3, 1);
      f.prev.copy(pos);
      const left = f.dur - f.t;
      if (!f.passed && !f.dodged) { f.beepT -= dt; if (f.beepT <= 0) { sfx("mwarn", left <= MC.window ? 0.9 : 0.5); f.beepT = left <= MC.window ? 0.16 : 0.5; } }
    }
  }

  // ---------------------------------------------------------------- hiệu ứng NẠP: năng lượng đỏ hút vào tàu → bùng → "MISSILE +1"
  const ringGeo = new THREE.RingGeometry(0.9, 1.0, 96);
  const rings = [0, 1, 2, 3].map(() => { const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 0.5, 0.35), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); m.visible = false; scene.add(m); return { m, t: 9, r: null }; });
  function chargeFx(side) {
    const r = rockets[side], c = shipPos(r);
    for (let i = 0; i < 130; i++) {
      const d = new V3(rand(-1, 1), rand(-0.6, 1), rand(-1, 1)).normalize(), R = rand(2.6, 4.8), life = rand(0.34, 0.48);
      fire.emit({ pos: c.clone().addScaledVector(d, R), vel: d.clone().multiplyScalar(-R / life), life, size: rand(0.14, 0.26), sizeEnd: 0.06, color: new THREE.Color(4.5, 0.55, 0.35), colorEnd: new THREE.Color(3, 1.4, 0.6), drag: 0 });
    }
    sfx("mcharge", 1);
    later(0.46, () => {
      const p = shipPos(r);
      burst(p, { n: 140, speed: 11, color: new THREE.Color(5, 0.9, 0.55), colorEnd: new THREE.Color(1.5, 0.1, 0.05), size: 0.22, life: 0.6 });
      for (let k = 0; k < 2; k++) { const x = rings.find(z => z.t > 1.2); if (x) { x.t = -k * 0.08; x.r = r; x.m.visible = true; } }
      labelOn(r, "MISSILE +1", "#ff6a6a");
      shake(0.25);
      if (UI[side]) UI[side].flash = 1;
    });
  }
  function stepRings(dt) {
    rings.forEach(o => {
      if (o.t > 1.2) return;
      o.t += dt; if (o.t < 0) return;
      const k = o.t / 0.7;
      o.m.position.copy(shipPos(o.r)); o.m.quaternion.copy(X.camera.quaternion);
      o.m.scale.setScalar(0.5 + k * 5.5); o.m.material.opacity = Math.max(0, 0.9 * (1 - k));
      if (o.t > 0.7) { o.m.visible = false; o.t = 9; }
    });
  }
  function loadFx(side) {
    const r = rockets[side]; if (!r.mis) return;
    r.mis.has = true; r.mis.wantRise = 1; r.mis.rise = 0;
    if (UI[side]) UI[side].load = { t: 0 };
    sfx("mload", 1);
  }
  function clearAll() {
    for (let i = flights.length - 1; i >= 0; i--) { const f = flights[i]; const p = f.m.g.position.clone(); f.m.g.visible = false; f.m.flame.visible = f.m.flare.visible = false; airburst(p, 0.5); }
    flights.length = 0;
  }

  function tick(dt) {
    for (let i = pending.length - 1; i >= 0; i--) { const p = pending[i]; p.t -= dt; if (p.t <= 0) { pending.splice(i, 1); p.fn(); } }
    rockets.forEach(r => poseMount(r, dt));
    stepFlights(dt); stepRings(dt);
    mGlow.color.setRGB(4.2 * (0.75 + 0.25 * Math.sin(G.t * 6)), 0.35, 0.25);
    UI.forEach((u, side) => tickUI(side, dt));
  }
  function tap(info) {
    const U = UI[info.side]; if (!U) return;
    if (info.kind === "fire") { U.press.fire = 1; if (X.onFire) X.onFire(info.side); }
    else { U.press.boost = 1; if (X.onBoost) X.onBoost(info.side); }
  }
  function refuse(side, kind) { const U = UI[side]; if (!U) return; if (kind === "boost") U.shakeK = 1; else U.press.fire = 1; }

  rockets.forEach(attach);
  return {
    buildConsole, poseRocket, tick, tap,
    api: {
      setArsenal(side, st) { Object.assign(A[side], st); },
      chargeFx, loadFx, launch, dodge, incoming, clearAll, refuse,
      // 6b: góc nhìn rộng — bật khi bắn; trang game tắt ở câu trả lời KẾ TIẾP khi không còn quả nào đang bay
      setWide(on) { G.wideCam = !!on; },
      get wide() { return !!G.wideCam; },
      get busy() { return flights.length > 0; },
      get flights() { return flights.map(f => ({ id: f.id, from: f.from, to: f.to, t: +f.t.toFixed(2), left: +(f.dur - f.t).toFixed(2), dodged: f.dodged, passed: f.passed })); },
      get arsenal() { return A.map(a => ({ ...a })); },
      windowSecs: MC.window
    }
  };
}
