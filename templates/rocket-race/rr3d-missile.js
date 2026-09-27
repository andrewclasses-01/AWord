// ⭐⭐⭐⭐ MẪU 7d (thầy 28/9/2026 — sửa từ game7c): bỏ vầng sáng mũi tàu (setNearWin ⇒ r.nearWin, view đổi lửa đuôi) ·
//   tên lửa trúng một tàu ⇒ tàu kia cùng nấc / cách đúng 1 nấc BỊ Y HỆT (hitShip + inSplash, xét nấc thật lúc nổ); khung đỏ báo cả tàu kề
// ⭐⭐⭐ MẪU 7c (thầy 27/9/2026 — sửa từ game7b):
//   · 2 tên lửa cùng bay ⇒ HÚT nhau, va + nổ giữa đường; nổ quá gần một tàu (CLASH_NEAR) ⇒ tàu đó vẫn tính bị trúng
//   · cột vạch năng lượng MỎNG hơn + màu TRẮNG; quả dự phòng nhỏ hơn, cách cột xa hơn
//   · SỬA LỖI: ô trống trong nút BOOST bị mặt nút vẽ đè không đều (trông như "đã có 3 vạch") ⇒ ép thứ tự vẽ (renderOrder)
//   · setNearWin(side, on): còn 1 câu đúng nữa là thắng ⇒ vầng sáng mạnh trước mũi tàu
// ⭐⭐ MẪU 7b (thầy 27/9/2026 — sửa từ game7 = AWord Đợt 416):
//   · MỘT nút BOOST to hơn, CHÍNH GIỮA dưới cột đáp án, bỏ vạch nấc bên cạnh; thanh 5 đoạn đầy dần TRÁI → PHẢI BÊN TRONG nút
//   · bỏ "BOOST giương sẵn" (armBoost thành không làm gì) — né phải tự canh; boostFx(side) = hiệu ứng tàu vọt 1 nấc
//   · cột VẠCH NĂNG LƯỢNG tên lửa sát MÉP NGOÀI màn (số vạch = pipsMax, 1–10, đổi được lúc chạy)
// ⭐ Đợt 417 (thầy 28/9/2026 "ok, ghép 7d vào AWord"): chép NGUYÊN từ kho myGame `rocket-race/game7d/` (MẪU 7b + 7c + 7d).
// Sửa về sau: làm ở myGame (tools/chep-aword-sang-game.py lấy bản này ra thư mục game mới) → thầy OK → chép sang.
// ⭐ Đợt 409 (thầy 27/9/2026): chép NGUYÊN từ kho myGame `rocket-race/game6d/rr3d-missile.js` (MẪU 6d thầy duyệt), chuông báo động kiểu b.
// ⚠️ Đợt 413 (thầy 27/9/2026) sửa THẲNG ở AWord (tự nạp, nút BOOST vuông + vạch nấc, tên lửa lên trên cột đáp án, BOOST giương sẵn)
// ⇒ file này NAY KHÁC myGame game6d/. Làm mẫu mới ở myGame thì chép bản này ngược về trước.
// =============================================================
// ROCKET RACE 3D — TÊN LỬA TẤN CÔNG giữa 2 tàu (MẪU 6d, thầy 27/9/2026 — sửa từ 6c:
//   · đủ 3 câu liên tiếp ⇒ +1 quả NHỎ ở hàng dự phòng (tối đa 3); CHƯA lên nòng, trên tàu chưa có gì
//   · CHẠM quả nhỏ ⇒ quả chuyển sang ô to (sẵn sàng) + tay robot đưa quả lên thân tàu (X.onLoad → trang game gọi loadFx)
//   · CHẠM quả to ⇒ quả to LÙI ra khỏi màn (mang đi lắp vào chỗ bắn) rồi tên lửa mới phóng từ tàu
//   · chuông BÁO ĐỘNG khẩn cấp kiểu điện ảnh (3 kiểu thử: cfg.missiles.alarm = a|b|c) thay tiếng bíp
//   · trúng ⇒ thân tàu thêm MẢNG CHÁY ĐEN + lửa nhỏ ở đúng chỗ, lửa tắt sau ~8 s không bị bắn nữa (vết đen ở lại)
// (6c, thầy 27/9/2026 — sửa từ 6b: bỏ khung ô tên lửa + BOOST; sai-bị-lùi đúng lúc cũng né)
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
  const MC = Object.assign({ dur: 3.8, window: 1.5, ammoCm: 8.5, boostCm: 2.6, gapCm: 0.7, alarm: "b", burnSecs: 8, carry: 0.32 }, cfg.missiles || {});
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

  // ---------------------------------------------------------------- 6d: VẾT CHÁY ĐEN + LỬA NHỎ trên thân tàu bị trúng
  // Mảng cháy là LÁT CẮT vỏ (cùng biên dạng HULL_PTS, nhô 1,8 %) dán texture muội đen vẽ bằng canvas; nằm 2 bên sườn trên
  // (tránh khe cửa khoang). Mỗi quả trúng thêm 1 mảng (tối đa 6, cũ nhất nhường chỗ). Lửa + khói nhỏ phụt ra ở mọi mảng,
  // tắt dần khi đã burnSecs giây không bị trúng thêm; vết đen ở lại tới hết trận.
  function scorchCanvas(seed, ember) {
    let s = seed * 9301 + 49297; const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    const n = 256, cv = document.createElement("canvas"); cv.width = cv.height = n; const g = cv.getContext("2d");
    if (ember) { g.fillStyle = "#000"; g.fillRect(0, 0, n, n); }
    for (let i = 0; i < (ember ? 14 : 90); i++) {
      const a = rnd() * Math.PI * 2, d = Math.pow(rnd(), ember ? 1.6 : 0.75) * n * (ember ? 0.16 : 0.34);
      const x = n / 2 + Math.cos(a) * d, y = n / 2 + Math.sin(a) * d * 0.85, r = (ember ? 3 + rnd() * 6 : 18 + rnd() * 38) * (1 - d / n);
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      if (ember) { gr.addColorStop(0, "rgba(255,190,90,1)"); gr.addColorStop(0.5, "rgba(255,80,10,0.6)"); gr.addColorStop(1, "rgba(0,0,0,0)"); }
      else { const k = 0.5 + rnd() * 0.45; gr.addColorStop(0, "rgba(10,8,7," + k + ")"); gr.addColorStop(0.6, "rgba(22,16,12," + (k * 0.6) + ")"); gr.addColorStop(1, "rgba(30,22,16,0)"); }
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    }
    if (!ember) {                                     // lõi đen đặc + vệt muội toả ra
      const c = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n * 0.3); c.addColorStop(0, "rgba(3,2,2,1)"); c.addColorStop(0.6, "rgba(6,4,3,0.85)"); c.addColorStop(1, "rgba(6,4,3,0)");
      g.fillStyle = c; g.fillRect(0, 0, n, n);
      g.strokeStyle = "rgba(12,9,8,0.35)"; g.lineCap = "round";
      for (let i = 0; i < 18; i++) { const a = rnd() * Math.PI * 2, r0 = n * 0.1, r1 = n * (0.28 + rnd() * 0.18); g.lineWidth = 2 + rnd() * 6; g.beginPath(); g.moveTo(n / 2 + Math.cos(a) * r0, n / 2 + Math.sin(a) * r0); g.lineTo(n / 2 + Math.cos(a) * r1, n / 2 + Math.sin(a) * r1); g.stroke(); }
    }
    const t = new THREE.CanvasTexture(cv); t.colorSpace = ember ? THREE.NoColorSpace : THREE.SRGBColorSpace; t.anisotropy = 4; return t;
  }
  const SC_MAPS = [1, 2, 3].map(sd => ({ map: scorchCanvas(sd, false), em: scorchCanvas(sd + 7, true) }));
  const SC_MAX = 6, SC_DPHI = 0.62, SC_HY = 0.44;
  const emberFlare = radialTex([[0, "rgba(255,255,255,1)"], [0.3, "rgba(255,200,120,0.6)"], [1, "rgba(0,0,0,0)"]], 64);
  function burnKit(r) {                              // dựng SẴN vật liệu cho từng tàu (trước warmBoom ⇒ shader biên dịch sẵn)
    const mats = SC_MAPS.map(t => new THREE.MeshStandardMaterial({ map: t.map, emissiveMap: t.em, emissive: new THREE.Color(1, 0.35, 0.06), emissiveIntensity: 0,
      transparent: true, depthWrite: false, roughness: 0.95, metalness: 0.05, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    const glowMat = new THREE.SpriteMaterial({ map: emberFlare, color: new THREE.Color(3, 1.1, 0.25), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 });
    const warm = new THREE.Mesh(sliceGeo(1.018, TOP + 0.9, 0.2), mats[0]); warm.visible = false; r.model.add(warm);   // để warmBoom biên dịch
    const warmS = new THREE.Sprite(glowMat); warmS.visible = false; r.model.add(warmS);
    r.burn = { mats, glowMat, spots: [], t: 0, acc: 0, n: 0, warm: [warm, warmS] };
  }
  function scorch(r) {
    if (!r || !r.burn) return;
    const B = r.burn;
    B.warm.forEach(o => { if (o.parent) o.parent.remove(o); });
    if (B.spots.length >= SC_MAX) { const o = B.spots.shift(); r.model.remove(o.mesh, o.glow); o.mesh.geometry.dispose(); }
    // chỗ mới: xen kẽ 2 bên sườn trên, trải dọc thân, không trùng chỗ cũ
    let phi, y, tries = 0;
    do {
      const sd = (B.n + tries) % 2 ? 1 : -1;
      phi = TOP + sd * rand(0.62, 1.25); y = rand(-1.35, 0.35); tries++;
    } while (tries < 12 && B.spots.some(o => Math.abs(o.y - y) < 0.4 && Math.abs(o.phi - phi) < 0.5));
    B.n++;
    const pts = []; for (let i = 0; i <= 8; i++) { const yy = y - SC_HY + (i / 8) * SC_HY * 2; pts.push(new THREE.Vector2(hullR(yy) * 1.018, yy)); }
    const mesh = new THREE.Mesh(new THREE.LatheGeometry(pts, 10, phi - SC_DPHI, SC_DPHI * 2), B.mats[B.n % B.mats.length]);
    const R0 = hullR(y) * 1.06, glow = new THREE.Sprite(B.glowMat);
    glow.position.set(Math.sin(phi) * R0, y, Math.cos(phi) * R0); glow.scale.setScalar(0.4);
    r.model.add(mesh, glow);
    B.spots.push({ mesh, glow, phi, y, local: glow.position.clone(), nrm: new V3(Math.sin(phi), 0, Math.cos(phi)) });
    B.t = MC.burnSecs;                               // bị trúng ⇒ lửa MỌI mảng cháy lại từ đầu
  }
  const _p = new V3(), _n = new V3();
  function burnTick(r, dt) {
    const B = r.burn; if (!B || !B.spots.length) return;
    const alive = r.model.visible && !r.hidden && !r.wreck;
    B.t = Math.max(0, B.t - dt);
    const k = alive ? Math.min(1, B.t / 2) : 0;       // 2 s cuối lửa lụi dần
    const flick = 0.75 + 0.25 * Math.sin(G.t * 23 + r.idx) * Math.sin(G.t * 13.7);
    B.mats.forEach(m => { m.emissiveIntensity = (0.12 + 0.7 * k) * flick * (k > 0 ? 1 : 0.2); });   // than hồng còn âm ỉ chút ít sau khi tắt lửa
    B.glowMat.opacity = k * 0.3 * flick;
    if (k <= 0) return;
    r.model.updateWorldMatrix(true, false);
    B.acc += dt * 26 * k;
    while (B.acc >= 1) {
      B.acc -= 1;
      const o = B.spots[Math.floor(Math.random() * B.spots.length)];
      _p.copy(o.local); r.model.localToWorld(_p);
      _n.copy(o.nrm).transformDirection(r.model.matrixWorld);
      const vel = _n.clone().multiplyScalar(rand(0.3, 0.8)).addScaledVector(UP, rand(0.8, 1.6)).addScaledVector(TRAVEL, -rand(1.2, 2.4)).add(new V3(rand(-0.2, 0.2), 0, rand(-0.2, 0.2)));
      fire.emit({ pos: _p.clone().add(new V3(rand(-0.08, 0.08), rand(-0.05, 0.05), rand(-0.08, 0.08))), vel, life: rand(0.22, 0.42), size: rand(0.22, 0.34) * RS, sizeEnd: 0.05,
        color: new THREE.Color(4, 1.5, 0.35), colorEnd: new THREE.Color(1.6, 0.22, 0.04), drag: 1.2 });
      if (Math.random() < 0.3) smoke.emit({ pos: _p.clone(), vel: vel.clone().multiplyScalar(0.7).addScaledVector(UP, 0.4), life: rand(1.1, 1.7), size: 0.28 * RS, sizeEnd: 1.3 * RS,
        color: new THREE.Color(0.08, 0.075, 0.07), alpha: 0.4, drag: 0.8 });
    }
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
  const MINI_Y = [0.3, 0, -0.3];                                  // 6d: 3 quả nhỏ xếp dọc (quả chưa nạp)
  function ghostOf() {
    const m = makeMissile();
    m.g.traverse(o => { if (o.isMesh && o !== m.flame) o.material = mGhost; });
    m.flame.visible = m.flare.visible = false;
    return m;
  }
  // ⭐ Đợt 413 (thầy 27/9/2026): hình chữ nhật bo góc (nút BOOST vuông + vạch nấc)
  function roundRectGeo(w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    const x = -w / 2, y = -h / 2, sh = new THREE.Shape();
    sh.moveTo(x + r, y); sh.lineTo(x + w - r, y); sh.quadraticCurveTo(x + w, y, x + w, y + r);
    sh.lineTo(x + w, y + h - r); sh.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    sh.lineTo(x + r, y + h); sh.quadraticCurveTo(x, y + h, x, y + h - r);
    sh.lineTo(x, y + r); sh.quadraticCurveTo(x, y, x + r, y);
    return new THREE.ShapeGeometry(sh, 8);
  }
  // icon "boost tốc độ": 2 mũi tên kép chĩa LÊN (tàu lao về phía trước) + 3 vệt tốc độ — vẽ trắng, tô màu bằng material
  let boostIconTex = null;
  function boostIcon() {
    if (boostIconTex) return boostIconTex;
    const cv = document.createElement("canvas"); cv.width = cv.height = 256;
    const g = cv.getContext("2d");
    g.strokeStyle = "#fff"; g.lineCap = "round"; g.lineJoin = "round"; g.lineWidth = 30;
    [[150, 0], [96, 1]].forEach(([y]) => { g.beginPath(); g.moveTo(66, y + 42); g.lineTo(128, y - 20); g.lineTo(190, y + 42); g.stroke(); });
    g.lineWidth = 12; g.globalAlpha = 0.75;
    [[92, 196, 214], [128, 206, 236], [164, 196, 214]].forEach(([x, y0, y1]) => { g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y1); g.stroke(); });
    boostIconTex = new THREE.CanvasTexture(cv); boostIconTex.colorSpace = THREE.SRGBColorSpace;
    return boostIconTex;
  }
  function buildConsole(con, inner, s, pad, cm) {
    const side = con.side;
    const areaW = s.w - pad * 2;
    const ammoH = MC.ammoCm * cm, boostH = MC.boostCm * cm, gap = MC.gapCm * cm;
    // ⭐ Đợt 413 (thầy): TÊN LỬA LÊN TRÊN cụm đáp án, BOOST vẫn ở dưới; cả hai cách cụm đáp án xa hơn (gapCm)
    const yAmmo = s.h / 2 + gap + ammoH / 2, yBoost = -s.h / 2 - gap - boostH / 2;
    const inSign = side === 0 ? 1 : -1;                       // phía TRONG (giữa màn) = quả to; phía ngoài = quả dự phòng
    const am = new THREE.Group(); am.position.set(0, yAmmo, 0.05); inner.add(am);
    // 7b: cột vạch năng lượng chiếm dải ngoài cùng (colW) — cột đáp án nghiêng ra ngoài nên đặt sát mép s.w bị màn cắt mất
    const colW = pad * 0.24, colGap = pad * 0.55;              // 7c: cột MỎNG hơn, cách hàng quả nhỏ xa hơn
    const bigW = areaW * 0.6, spW = areaW * 0.36 - colW - colGap;   // 6d: hàng quả nhỏ (chỗ CHẠM để nạp) — 7b nhường chỗ cho cột vạch
    const bigX = inSign * (areaW / 2 - bigW / 2), spX = -inSign * (areaW / 2 - colW - colGap - spW / 2);
    const miniS = spW * 0.72 / 2.3, bigS = bigW * 0.95 / 2.3;   // 7c: quả dự phòng NHỎ hơn (0,95 → 0,72)
    const rotY = inSign > 0 ? 0 : Math.PI;                    // mũi chĩa về phía tàu địch
    const minis = MINI_Y.map(fy => { const m = makeMissile(); m.g.position.set(spX, fy * ammoH, 0.14); m.g.rotation.y = rotY; m.g.visible = false; am.add(m.g); return m; });   // 6d: 3 quả
    const big = makeMissile(); big.g.position.set(bigX, 0, 0.18); big.g.rotation.y = rotY; big.g.visible = false; am.add(big.g);
    const ghost = ghostOf(); ghost.g.position.set(bigX, 0, 0.12); ghost.g.rotation.y = rotY; fat(ghost.g, bigS); am.add(ghost.g);
    const glowSp = new THREE.Sprite(new THREE.SpriteMaterial({ map: flareTex, color: new THREE.Color(4, 0.5, 0.35), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
    glowSp.scale.set(bigW * 1.3, ammoH * 1.1, 1); glowSp.position.set(bigX, -ammoH * 0.05, 0.06); am.add(glowSp);
    const shuttle = makeMissile(); shuttle.g.visible = false; shuttle.g.rotation.y = rotY; am.add(shuttle.g);
    // 6d: HAI vùng chạm — hàng quả nhỏ (nạp) · ô quả to (bắn)
    const hitSp = new THREE.Mesh(new THREE.PlaneGeometry(spW * 1.2, ammoH * 1.1), mHit); hitSp.position.set(spX - inSign * spW * 0.08, 0, 0.3); am.add(hitSp);
    const hitAm = new THREE.Mesh(new THREE.PlaneGeometry(bigW * 1.08, ammoH * 1.1), mHit); hitAm.position.set(bigX + inSign * bigW * 0.02, 0, 0.3); am.add(hitAm);
    // ⭐ MẪU 7b (thầy 27/9/2026): MỘT nút BOOST to hơn, CHÍNH GIỮA dưới cột đáp án, bỏ vạch nấc bên cạnh. Bên trong nút là
    // thanh năng lượng 5 đoạn đầy dần TỪ TRÁI SANG PHẢI (mỗi câu đúng liên tiếp = 1 đoạn; sai ⇒ xịt về 0). Đủ 5 ⇒ nút sáng + thở nhẹ;
    // có tên lửa địch đang bay tới ⇒ nhấp nháy MẠNH (báo nguy — KHÔNG tự né: học sinh tự canh 1,25 s cuối mà bấm).
    const bst = new THREE.Group(); bst.position.set(0, yBoost, 0.05); inner.add(bst);
    const btnS = boostH, btnX = 0;
    const btn = new THREE.Group(); btn.position.set(btnX, 0, 0.02); bst.add(btn);
    const btnRimMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.2, 0.9, 1.2), transparent: true, opacity: 0.5, depthWrite: false });
    const btnRim = new THREE.Mesh(roundRectGeo(btnS, btnS, btnS * 0.22), btnRimMat);
    const btnFaceMat = new THREE.MeshBasicMaterial({ color: new THREE.Color("#0b1624"), transparent: true, opacity: 0.88, depthWrite: false });
    const btnFace = new THREE.Mesh(roundRectGeo(btnS * 0.92, btnS * 0.92, btnS * 0.19), btnFaceMat); btnFace.position.z = 0.005;
    btn.add(btnRim, btnFace);
    const pipN = Math.max(1, A[side].boostMax || 5), inW = btnS * 0.78, inH = btnS * 0.78, pipGap = inW * 0.04;
    const pipW = (inW - pipGap * (pipN - 1)) / pipN;
    const pips = [];
    for (let i = 0; i < pipN; i++) {
      const x = -inW / 2 + pipW / 2 + i * (pipW + pipGap);                 // i = 0 ở TRÁI màn (inner không lật gương)
      const back = new THREE.Mesh(roundRectGeo(pipW, inH, pipW * 0.3), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.03, 0.09, 0.14), transparent: true, opacity: 0.9, depthWrite: false }));   // 7c: ô trống tối hẳn
      back.position.set(x, 0, 0.007);
      const fm = new THREE.MeshBasicMaterial({ color: new THREE.Color(0, 0.55, 0.78), transparent: true, opacity: 0, depthWrite: false });
      const f = new THREE.Mesh(roundRectGeo(pipW, inH, pipW * 0.3), fm); f.position.set(x, 0, 0.008);
      btn.add(back, f); pips.push({ back, f, fm, k: 0 });
    }
    const iconMat = new THREE.MeshBasicMaterial({ map: boostIcon(), color: new THREE.Color(0.35, 0.6, 0.75), transparent: true, opacity: 0.55, depthWrite: false });
    const icon = new THREE.Mesh(new THREE.PlaneGeometry(btnS * 0.66, btnS * 0.66), iconMat); icon.position.z = 0.012;
    btn.add(icon);
    // 7c SỬA LỖI: các lớp nút nằm sát nhau (0,005–0,012) + cột nghiêng ⇒ trình vẽ xếp lớp trong suốt theo khoảng cách từng vật,
    // mặt nút đè lên một số ô trống ⇒ ô ngoài sáng hơn ô trong, trông như "đã có 3 vạch". Ép thứ tự cố định: viền → mặt → ô → icon.
    btnRim.renderOrder = 20; btnFace.renderOrder = 21;
    pips.forEach(pp => { pp.back.renderOrder = 22; pp.f.renderOrder = 23; });
    icon.renderOrder = 24;
    const bGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: flareTex, color: new THREE.Color(0.2, 1.6, 2.2), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
    bGlow.scale.set(btnS * 2.4, btnS * 2.4, 1); bGlow.position.set(btnX, 0, -0.02); bst.add(bGlow);
    const hitB = new THREE.Mesh(new THREE.PlaneGeometry(btnS * 1.35, btnS * 1.25), mHit); hitB.position.set(btnX, 0, 0.3); bst.add(hitB);
    // ⭐ MẪU 7b: cột VẠCH NĂNG LƯỢNG tên lửa sát MÉP NGOÀI màn, cạnh hàng quả nhỏ — sáng từ DƯỚI lên theo số câu đúng liên tiếp,
    // đủ số vạch (Options 1–10) ⇒ +1 tên lửa. Số vạch đổi lúc chạy ⇒ tickUI dựng lại cột (buildMsPips).
    const msCol = new THREE.Group(); msCol.position.set(-inSign * (areaW / 2 - colW / 2), 0, 0.06); am.add(msCol);
    // khung cảnh báo đỏ bao cả cột (chỉ hiện khi bị bắn)
    const top = yAmmo + ammoH / 2, bot = yBoost - boostH / 2, fh = top - bot + pad, fw = s.w + pad * 0.6;
    const warnMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 0.35, 0.3), transparent: true, opacity: 0, depthWrite: false });
    const warn = new THREE.Mesh(frameGeo(fw, fh, Math.min(fw, fh) * 0.06, Math.min(fw, fh) * 0.014), warnMat);
    warn.position.set(0, (top + bot) / 2, 0.02); warn.visible = false; inner.add(warn);
    [[hitSp, "load"], [hitAm, "fire"], [hitB, "boost"]].forEach(([m, kind]) => { m.userData.ammo = { side, kind }; hitList.push(m); });
    UI[side] = { am, bst, minis, big, ghost, glowSp, shuttle, btn, btnRimMat, btnFaceMat, iconMat, pips, bGlow, areaW, warn, warnMat, inSign, miniS, bigS, bigX, spX, ammoH,
      msCol, msColW: colW, msN: -1, msPips: [], msFlash: 0,
      press: { fire: 0, boost: 0, load: 0 }, pop: [0, 0, 0], popBig: 0, load: null, fireK: 0, shakeK: 0, flash: 0, readyK: 0 };
  }
  function buildMsPips(U, n) {
    U.msCol.children.slice().forEach(o => { U.msCol.remove(o); o.geometry && o.geometry.dispose(); });
    U.msPips = []; U.msN = n;
    if (n <= 0) return;
    const H = U.ammoH * 1.05, gap = Math.min(H * 0.035, H / n * 0.18), h = (H - gap * (n - 1)) / n, w = U.msColW;
    for (let i = 0; i < n; i++) {
      const y = -H / 2 + h / 2 + i * (h + gap);                           // i = 0 ở DƯỚI
      const back = new THREE.Mesh(roundRectGeo(w, h, Math.min(w, h) * 0.5), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.16, 0.17, 0.2), transparent: true, opacity: 0.7, depthWrite: false }));   // 7c: xám (không lẫn màu đỏ tên lửa)
      back.position.set(0, y, 0);
      const fm = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 1.55, 1.65), transparent: true, opacity: 0, depthWrite: false });   // 7c: TRẮNG
      const f = new THREE.Mesh(roundRectGeo(w, h, Math.min(w, h) * 0.5), fm); f.position.set(0, y, 0.004);
      back.renderOrder = 21; f.renderOrder = 22;
      U.msCol.add(back, f); U.msPips.push({ back, f, fm, k: 0 });
    }
  }
  function tickUI(side, dt) {
    const U = UI[side]; if (!U) return;
    const a = A[side], inc = threatFor(side), win = inc <= MC.window;   // 7d: cả mối đe doạ lan (tàu kề)
    const shown = a.on ? Math.min(3, a.reserve) : 0;   // 6d: quả chưa nạp nằm hết ở hàng nhỏ (tối đa 3)
    U.minis.forEach((m, i) => {
      const vis = i < shown;
      if (vis && !m.g.visible) U.pop[i] = 1;
      m.g.visible = vis;
      U.pop[i] = Math.max(0, U.pop[i] - dt / 0.55);
      fat(m.g, U.miniS * Math.max(0.01, U.pop[i] > 0 ? easeOutBack(1 - U.pop[i]) : 1));
      m.g.position.y = MINI_Y[i] * U.ammoH + Math.sin(G.t * 2 + i * 1.7) * 0.008;
      m.g.position.x = U.spX - U.inSign * U.press.load * 0.02;
    });
    if (U.load) {                          // nạp: quả nhỏ bay sang chỗ quả to, lớn dần
      U.load.t += dt; const k = smooth(U.load.t / 0.5);
      U.shuttle.g.visible = true;
      U.shuttle.g.position.set(lerp(U.spX, U.bigX, k), lerp(U.load.fy * U.ammoH, 0, k), 0.16 + Math.sin(k * Math.PI) * 0.3);
      fat(U.shuttle.g, lerp(U.miniS, U.bigS, k));
      if (U.load.t >= 0.5) { U.load = null; U.shuttle.g.visible = false; U.popBig = 1; U.flash = 1; }
    }
    const bigVis = a.on && a.loaded && !U.load && U.fireK <= 0;
    U.big.g.visible = bigVis || U.fireK > 0;
    U.ghost.g.visible = a.on && !U.big.g.visible && !U.load;
    U.popBig = Math.max(0, U.popBig - dt / 0.5);
    if (U.fireK > 0) {                     // 6d: bắn ⇒ quả to LÙI (đuôi đi trước) ra khỏi MÉP NGOÀI màn — mang đi lắp vào chỗ bắn
      U.fireK = Math.max(0, U.fireK - dt / MC.carry); const k = 1 - U.fireK;
      const back = k < 0.18 ? -Math.sin(k / 0.18 * Math.PI) * 0.06 : Math.pow((k - 0.18) / 0.82, 2) * 3.2;   // nhún tới một chút rồi kéo lùi
      U.big.g.position.x = U.bigX - U.inSign * back * U.areaW;
      U.big.g.position.y = -k * k * U.ammoH * 0.15;
      fat(U.big.g, U.bigS * (1 - k * 0.25));
      if (U.fireK <= 0) { U.big.g.position.set(U.bigX, 0, 0.18); }
    } else {
      fat(U.big.g, U.bigS * Math.max(0.01, U.popBig > 0 ? easeOutBack(1 - U.popBig) : 1));
      U.big.g.position.y = Math.sin(G.t * 2.2) * 0.012;
    }
    U.flash = Math.max(0, U.flash - dt * 1.6);
    const ready = bigVis && !a.locked;
    U.glowSp.material.opacity = (ready ? 0.22 + 0.12 * Math.sin(G.t * 4) : 0) + U.flash * 0.8;
    // ⭐ MẪU 7b — cột vạch năng lượng tên lửa (đầy kho ⇒ mờ đi, không tích nữa)
    const msN = a.on ? clamp(a.pipsMax | 0, 0, 10) : 0;
    if (msN !== U.msN) buildMsPips(U, msN);
    U.msCol.visible = msN > 0;
    const msLit = a.full ? 0 : clamp(Math.round(a.pips), 0, msN);
    U.msPips.forEach((p, i) => {
      p.k += ((i < msLit ? 1 : 0) - p.k) * Math.min(1, dt * 10);
      p.fm.opacity = p.k;
      p.fm.color.setRGB(1.5, 1.55, 1.65).multiplyScalar(1 + U.flash * 0.8);
      p.back.material.opacity = a.full || a.locked ? 0.35 : 0.85;
    });
    // ⭐ Đợt 413 — BOOST: vạch nấc sáng dần theo số câu đúng liên tiếp; ĐỦ ⇒ nút sáng + nhịp thở nhẹ (~0,8 lần/s);
    // có tên lửa địch đang bay tới ⇒ nhấp nháy MẠNH (6 lần/s, quầng to); đã "giương" (bấm sớm) ⇒ sáng đứng, trắng hơn.
    const full = a.boost && !a.locked, armed = false;          // 7b: không còn "giương sẵn"
    const lit = full;
    const nLit = lit ? U.pips.length : clamp(Math.round(a.boostPips), 0, U.pips.length);
    const threat = inc < Infinity;
    const soft = 0.5 + 0.5 * Math.sin(G.t * 5);                  // thở nhẹ
    const hard = 0.5 + 0.5 * Math.sin(G.t * 38);                 // nhấp nháy mạnh
    U.readyK += ((lit ? 1 : 0) - U.readyK) * Math.min(1, dt * 8);
    U.pips.forEach((p, i) => {
      p.k += ((i < nLit ? 1 : 0) - p.k) * Math.min(1, dt * 10);
      p.fm.opacity = p.k;
      const b = full ? (threat ? 1.1 + 1.1 * hard : 1.2 + 0.25 * soft) : armed ? 1.6 : 1;
      p.fm.color.setRGB(0, 0.55, 0.78).multiplyScalar(b);   /* ACES làm nhạt màu sáng ⇒ cường độ thấp cho ra CYAN đậm */
    });
    let glow = 0, rimB = 0.35, iconB = 0.55, scl = 1;
    if (armed) { glow = 0.45; rimB = 2.2; iconB = 1; }
    else if (full && threat) { glow = 0.25 + 0.6 * hard; rimB = 1.2 + 2.2 * hard; iconB = 1; scl = 1 + 0.07 * hard; }
    else if (full) { glow = 0.18 + 0.12 * soft; rimB = 1.3 + 0.5 * soft; iconB = 0.9 + 0.1 * soft; scl = 1 + 0.025 * soft; }
    U.btnRimMat.color.setRGB(0.2, 0.9, 1.2).multiplyScalar(rimB / 1.2); U.btnRimMat.opacity = 0.45 + 0.55 * U.readyK;
    U.btnFaceMat.color.set("#0b1624").lerp(new THREE.Color(0, 0.32, 0.46), U.readyK * (armed ? 1 : 0.6 + 0.4 * (threat && full ? hard : soft)));
    U.iconMat.color.setRGB(0.35, 0.6, 0.75).lerp(new THREE.Color(1.6, 1.9, 2.1), U.readyK); U.iconMat.opacity = iconB;
    U.bGlow.material.opacity = glow * U.readyK;
    ["fire", "boost", "load"].forEach(k => { U.press[k] = Math.max(0, U.press[k] - dt * 4); });
    U.am.scale.setScalar(1 - U.press.fire * 0.05);
    U.shakeK = Math.max(0, U.shakeK - dt * 3);
    U.btn.scale.setScalar(scl * (1 - U.press.boost * 0.08));
    U.bst.position.x = U.shakeK > 0 ? Math.sin(G.t * 60) * 0.03 * U.shakeK : 0;
    const pul = 0.5 + 0.5 * Math.sin(G.t * (win ? 16 : 5));
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
  let gen = 0;                                     // clearAll() tăng ⇒ lần phóng đang chờ bị huỷ
  function launch(from, to) {
    const r = rockets[from]; if (!r.mis) return 0;
    if (UI[from]) UI[from].fireK = 1;               // 6d: quả to trong bảng lùi ra khỏi màn trước…
    const g0 = gen;
    later(MC.carry * 0.85, () => { if (g0 === gen) liftoff(from, to); });   // …rồi tên lửa trên tàu mới rời bệ
    return 1;
  }
  function liftoff(from, to) {
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
    alarm(f, true);                                  // 6d: chuông báo động bên bị bắn
    shake(0.2);
    return f.id;
  }
  // 6d: CHUÔNG BÁO ĐỘNG khẩn cấp (thay tiếng bíp) — 3 kiểu thử: a = còi tàu ngầm (klaxon), b = còi báo động đỏ, c = chuông điện
  // mỗi kiểu 2 file: nhịp thường (lúc tên lửa đang bay) + nhịp GẤP (1,5 s cuối)
  const ALARM = { a: [1.05, 0.42], b: [0.95, 0.4], c: [1.0, 0.5] };   // AWord Đợt 409: chỉ mang file kiểu b (thầy chọn) — sfx/malarm_b + malarmf_b
  function alarm(f, first, left = f.dur) {
    const v = ALARM[MC.alarm] ? MC.alarm : "a", fast = left <= MC.window + 0.05;
    sfx((fast ? "malarmf_" : "malarm_") + v, fast ? 1 : first ? 0.95 : 0.8);
    f.beepT = ALARM[v][fast ? 1 : 0];
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
  // ⭐ MẪU 7b: bấm BOOST = tàu tiến THẬT 1 nấc (trang game gọi view.move) — đây chỉ là hiệu ứng lửa xanh + chữ
  function boostFx(side) {
    const r = rockets[side]; r.boost = 1; sfx("boost", 0.8);
    burst(shipPos(r).addScaledVector(TRAVEL, -2.6), { n: 110, speed: 10, color: new THREE.Color(1.2, 2.6, 5), colorEnd: new THREE.Color(0.2, 0.4, 1.6), size: 0.26, life: 0.65 });
    if (UI[side]) UI[side].flash = 0.6;
  }
  function airburst(pos, sc = 0.6) { explosion(pos, sc); sfx("boom", 0.55); }
  // ⭐ MẪU 7c (thầy): 2 tên lửa ngược chiều cùng đang bay ⇒ HÚT nhau: mỗi quả trượt dần về điểm giữa 2 quả (pull 0 → 1 trong
  // CLASH_PULL s) rồi VA + NỔ giữa đường. Nổ cách một tàu < CLASH_NEAR ⇒ tàu đó vẫn tính bị trúng (lùi nấc như trúng thật).
  let lastClash = null;                                 // bàn thử: khoảng cách chỗ nổ → tàu
  const CLASH_PULL = 1.1, CLASH_HIT = 0.9, CLASH_NEAR = 3.4 * RS;
  function rawPos(f, t) {
    const T = f.anchor ? f.anchor : shipPos(rockets[f.to]);
    const k = clamp(t / f.dur, 0, 1), u = 0.6 * k + 0.4 * k * k;
    const c = ctrl(f, T);
    return bez(f.p0, c.p1, c.p2, T, u, new V3());
  }
  const live = f => !f.passed && !f.dodged && f.t > 0.12;
  function pairUp(dt) {
    flights.forEach(f => { f.mate = null; });
    const a = flights.filter(f => live(f) && f.from === 0), b = flights.filter(f => live(f) && f.from === 1);
    a.forEach((fa, i) => {
      const fb = b[i]; if (!fb) return;
      const pa = rawPos(fa, fa.t + dt), pb = rawPos(fb, fb.t + dt), mid = pa.clone().add(pb).multiplyScalar(0.5);
      [fa, fb].forEach(f => { f.mate = f === fa ? fb : fa; f.pull = Math.min(1, (f.pull || 0) + dt / CLASH_PULL); f.mid = mid; });
    });
    flights.forEach(f => { if (!f.mate) f.pull = 0; });
  }
  function clash(fa, fb) {
    const mid = fa.m.g.position.clone().add(fb.m.g.position).multiplyScalar(0.5);
    [fa, fb].forEach(f => { const i = flights.indexOf(f); if (i >= 0) flights.splice(i, 1); f.m.g.visible = false; f.m.flame.visible = f.m.flare.visible = false; });
    explosion(mid.clone(), 1.0); sfx("boom", 1); sfx("hit3", 0.8); shake(0.35);
    burst(mid, { n: 160, speed: 13, color: new THREE.Color(5, 2, 0.7), colorEnd: new THREE.Color(1.4, 0.15, 0.04), size: 0.26, life: 0.7 });
    lastClash = { at: +G.t.toFixed(2), d: [fa, fb].map(f => ({ to: f.to, d: +mid.distanceTo(shipPos(rockets[f.to])).toFixed(2) })) };
    let hitDone = false;                                  // 7d: một vụ nổ chỉ tính trúng MỘT lần (hitShip đã lo tàu kề)
    [fa, fb].forEach(f => {
      const d = mid.distanceTo(shipPos(rockets[f.to]));
      if (d < CLASH_NEAR && !hitDone) { hitDone = true; hitShip(f.to, f.from, shipPos(rockets[f.to]), 0.6); }   // nổ sát tàu ⇒ như bị trúng (7d: cả tàu kề)
      else X.onEnd && X.onEnd(f.to, "clash", f.from);
    });
  }
  function stepFlights(dt) {
    pairUp(dt);
    for (let i = flights.length - 1; i >= 0; i--) {
      const f = flights[i]; const m = f.m;
      f.t += dt;
      const T = f.anchor ? f.anchor : shipPos(rockets[f.to]);
      let pos;
      if (!f.passed) {
        const k = clamp(f.t / f.dur, 0, 1), u = 0.6 * k + 0.4 * k * k;     // lên chậm, lao xuống nhanh dần
        const c = ctrl(f, T);
        pos = bez(f.p0, c.p1, c.p2, T, u, new V3());
        if (f.mate && f.mid) pos.lerp(f.mid, smooth(f.pull));   // 7c: bị quả kia hút về điểm giữa
        if (k >= 1 && !f.mate) {
          f.passed = true;
          if (!f.dodged) {                                   // TRÚNG
            flights.splice(i, 1); m.g.visible = false; m.flame.visible = m.flare.visible = false;
            hitShip(f.to, f.from, T);                          // 6d vết cháy · 7d: tàu kề ≤ 1 nấc cũng trúng
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
      if (!f.passed && !f.dodged) { f.beepT -= dt; if (f.beepT <= 0) alarm(f, false, left); }
    }
    // 7c: đã hút sát nhau (hoặc hết hành trình khi đang hút) ⇒ va chạm
    flights.slice().forEach(f => {
      const g = f.mate; if (!g || f.from !== 0 || flights.indexOf(g) < 0 || flights.indexOf(f) < 0) return;
      if (f.m.g.position.distanceTo(g.m.g.position) < CLASH_HIT || f.pull >= 1 || f.t >= f.dur || g.t >= g.dur) clash(f, g);
    });
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
    if (UI[side]) UI[side].load = { t: 0, fy: MINI_Y[clamp(A[side].reserve, 0, 2)] };   // quả nhỏ ở chỗ vừa trống bay sang ô to
    sfx("mload", 1);
  }
  function clearAll() {
    gen++;
    for (let i = flights.length - 1; i >= 0; i--) { const f = flights[i]; const p = f.m.g.position.clone(); f.m.g.visible = false; f.m.flame.visible = f.m.flare.visible = false; airburst(p, 0.5); }
    flights.length = 0;
  }

  // ⭐ MẪU 7d (thầy): bỏ vầng sáng mũi tàu của 7c (quá chói) — còn 1 câu là thắng ⇒ r.nearWin, view cho lửa đuôi dài 1,5 lần + xanh dương.

  // ⭐ MẪU 7d (thầy): 2 tàu cùng nấc hoặc cách nhau ĐÚNG 1 nấc ⇒ tên lửa trúng tàu này thì tàu kia BỊ Y HỆT (lùi, khựng, cháy).
  // Xét theo nấc THẬT (r.p) NGAY LÚC NỔ: tàu kia kịp BOOST / trả lời đúng (tiến) hoặc sai bị lùi ra xa hơn 1 nấc ⇒ thoát.
  const SPLASH = 1;
  const inSplash = side => Math.abs((rockets[side].p || 0) - (rockets[1 - side].p || 0)) <= SPLASH;
  function hitShip(to, from, pos, sc = 0.75) {
    const other = 1 - to, alsoOther = inSplash(other);        // xét TRƯỚC khi báo trúng (trang game lùi nấc ngay trong onEnd)
    explosion(pos.clone(), sc); sfx("hit2", 1); sfx("boom", 0.7);
    stall(rockets[to]); scorch(rockets[to]);
    X.onEnd && X.onEnd(to, "hit", from);
    if (alsoOther) {
      const po = shipPos(rockets[other]);
      explosion(po.clone(), sc * 0.85); sfx("hit3", 0.9);
      stall(rockets[other]); scorch(rockets[other]);
      labelOn(rockets[other], "HIT TOO!", "#ff8a6a");
      X.onEnd && X.onEnd(other, "hit", from, "splash");
    }
  }
  // khung đỏ + BOOST nhấp nháy cả ở tàu KỀ khi tên lửa đang bay vào tàu kia (để kịp chạy)
  function threatFor(side) { const m = incoming(side); return inSplash(side) ? Math.min(m, incoming(1 - side)) : m; }
  function tick(dt) {
    for (let i = pending.length - 1; i >= 0; i--) { const p = pending[i]; p.t -= dt; if (p.t <= 0) { pending.splice(i, 1); p.fn(); } }
    rockets.forEach(r => { poseMount(r, dt); burnTick(r, dt); });
    stepFlights(dt); stepRings(dt);
    mGlow.color.setRGB(4.2 * (0.75 + 0.25 * Math.sin(G.t * 6)), 0.35, 0.25);
    UI.forEach((u, side) => tickUI(side, dt));
  }
  function tap(info) {
    const U = UI[info.side]; if (!U) return;
    if (info.kind === "fire") { U.press.fire = 1; if (X.onFire) X.onFire(info.side); }
    else if (info.kind === "load") { U.press.load = 1; if (X.onLoad) X.onLoad(info.side); }
    else { U.press.boost = 1; if (X.onBoost) X.onBoost(info.side); }
  }
  function refuse(side, kind) { const U = UI[side]; if (!U) return; if (kind === "boost") U.shakeK = 1; else if (kind === "load") U.press.load = 1; else U.press.fire = 1; }

  rockets.forEach(r => { attach(r); burnKit(r); });
  return {
    buildConsole, poseRocket, tick, tap,
    api: {
      setArsenal(side, st) { Object.assign(A[side], st); },
      armBoost() { /* 7b: bỏ — né phải tự canh */ },
      boostFx,                                          // 7b: hiệu ứng BOOST tiến 1 nấc

      get lastClash() { return lastClash; }, clashNear: CLASH_NEAR,
      setNearWin(side, on) { if (rockets[side]) rockets[side].nearWin = !!on; },   // 7d: còn 1 câu là thắng ⇒ lửa đuôi dài + xanh
      get nearWin() { return rockets.map(r => !!r.nearWin); },
      inSplash,                                         // 7d: bàn thử
      chargeFx, loadFx, launch, dodge, incoming, clearAll, refuse,
      // 6b: góc nhìn rộng — bật khi bắn; trang game tắt ở câu trả lời KẾ TIẾP khi không còn quả nào đang bay
      setWide(on) { G.wideCam = !!on; },
      get wide() { return !!G.wideCam; },
      get busy() { return flights.length > 0; },
      get flights() { return flights.map(f => ({ id: f.id, from: f.from, to: f.to, t: +f.t.toFixed(2), left: +(f.dur - f.t).toFixed(2), dodged: f.dodged, passed: f.passed })); },
      get arsenal() { return A.map(a => ({ ...a })); },
      get scorches() { return rockets.map(r => r.burn ? { spots: r.burn.spots.length, burning: +r.burn.t.toFixed(2) } : null); },   // bàn thử 6d
      scorch: side => scorch(rockets[side]),                                                                                 // bàn thử 6d
      windowSecs: MC.window
    }
  };
}
