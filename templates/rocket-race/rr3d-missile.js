// ⭐⭐⭐⭐ MẪU 7d (thầy 28/9/2026 — sửa từ game7c): bỏ vầng sáng mũi tàu (setNearWin ⇒ r.nearWin, view đổi lửa đuôi) ·
//   tên lửa trúng một tàu ⇒ tàu kia CÙNG NẤC BỊ Y HỆT (hitShip + inSplash, xét nấc thật lúc nổ); khung đỏ báo cả tàu cùng nấc
//   (Đợt 443, thầy 02/10/2026: bỏ "cách 1 nấc" — chênh 1 nấc trở lên KHÔNG bị lan)
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
  const MC = Object.assign({ dur: 3.8, window: 1.5, ammoCm: 8.5, boostCm: 2.6, gapCm: 0.7, alarm: "b", burnSecs: 8, carry: 0.32, charge: 2 }, cfg.missiles || {});   // Đợt 454: charge = giây nạp đỏ dần
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
  // ⭐ Đợt 441 (thầy) — PEACE: tên lửa 2 bên đổi XANH LÁ (vẫn nạp theo streak, không bắn được — trang game chặn bắn).
  // Mọi quả (trên tàu, trong bảng, đang bay) dùng CHUNG các vật liệu này ⇒ đổi màu vật liệu là đổi hết.
  let peace = false;
  const PAL = {
    war:   { body: "#d4121e", emis: "#ff1a24", dark: "#8e0b14", glow: [4.2, 0.35, 0.25], halo: [4, 0.5, 0.35], label: "#ff6a6a" },
    peace: { body: "#17a34a", emis: "#22ff66", dark: "#0b6b2c", glow: [0.3, 4.2, 0.6], halo: [0.45, 4, 0.6], label: "#6dff9e" }
  };
  const pal = () => (peace ? PAL.peace : PAL.war);
  function setPeace(on) {
    peace = !!on; const p = pal();
    mRed.color.set(p.body); mRed.emissive.set(p.emis);
    mRedDark.color.set(p.dark); mRedDark.emissive.set(p.emis);
    UI.forEach(U => { if (U) U.bigs.forEach(B => B.glowSp.material.color.setRGB(...p.halo)); });
    rings.forEach(o => o.m.material.color.setRGB(...p.halo));
  }
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
  // ⭐ Đợt 454b (thầy 03/10/2026: "màu đen trước khi nạp quá xấu") — ô đang nạp = BÓNG MỜ có sẵn (y như ô trống) + lớp ĐỎ "đổ đầy" từ
  // đuôi lên mũi. Mép nạp MỀM: shader lấy toạ độ DỌC quả (position.x — mọi hình đã nướng sẵn vị trí) ⇒ alpha = smoothstep quanh uFill
  // (±FILL_SOFT) + viền sáng nhẹ đúng mép. Không còn mặt phẳng cắt (mép sắc).
  const FILL_SOFT = 0.22;
  const BAND_GEO = [0.43, -0.72].map(x => GEO.band.clone().translate(x, 0, 0));
  function makeMissileWith(M) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(GEO.body, M.body), new THREE.Mesh(GEO.nose, M.body), new THREE.Mesh(GEO.tail, M.tail), new THREE.Mesh(GEO.glow, M.glow));
    BAND_GEO.forEach(geo => g.add(new THREE.Mesh(geo, M.white)));
    for (let k = 0; k < 4; k++) { const f = new THREE.Mesh(GEO.fin, M.dark); f.rotation.x = k * Math.PI / 2 + Math.PI / 4; g.add(f); }
    return { g };
  }
  function fillMat(base, uFill) {
    const m = base.clone(); m.transparent = true;
    m.onBeforeCompile = sh => {
      sh.uniforms.uFill = uFill;
      sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying float vLX;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvLX = position.x;");
      sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nvarying float vLX;\nuniform float uFill;")
        .replace("#include <color_fragment>", `#include <color_fragment>
          diffuseColor.a *= 1.0 - smoothstep(uFill - ${FILL_SOFT.toFixed(3)}, uFill + ${FILL_SOFT.toFixed(3)}, vLX);
          if (diffuseColor.a < 0.01) discard;`)
        .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
          totalEmissiveRadiance += vec3(1.6, 0.45, 0.3) * (1.0 - smoothstep(0.0, ${(FILL_SOFT * 1.2).toFixed(3)}, abs(vLX - uFill))) * step(uFill, 1.3);`);
    };
    m.customProgramCacheKey = () => "awFill454";
    return m;
  }
  function makeBigSlot(am, rotY, bigW, ammoH) {
    const uFill = { value: 9 }, mr = {};
    Object.entries({ body: mRed, dark: mRedDark, white: mWhite, tail: mDark, glow: mGlow }).forEach(([k, b]) => { mr[k] = fillMat(b, uFill); });
    const g = new THREE.Group(); g.rotation.y = rotY; g.visible = false; am.add(g);
    const under = ghostOf(), red = makeMissileWith(mr);
    under.g.traverse(o => { o.renderOrder = 1; }); red.g.traverse(o => { o.renderOrder = 2; });
    g.add(under.g, red.g);
    const ghost = ghostOf(); ghost.g.rotation.y = rotY; am.add(ghost.g);
    const glowSp = new THREE.Sprite(new THREE.SpriteMaterial({ map: flareTex, color: new THREE.Color(...pal().halo), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
    glowSp.scale.set(bigW * 1.3, ammoH * 0.6, 1); am.add(glowSp);
    return { g, red, under, mr, uFill, ghost, glowSp, fireK: 0, popBig: 0, flash: 0, k: 0 };
  }

  // ---------------------------------------------------------------- 6b: KHOANG + 2 CÁNH TAY ROBOT
  // Biên dạng vỏ — PHẢI khớp makeRocket (thân lathe): cửa khoang là LÁT CẮT của chính vỏ tàu ⇒ đóng lại gần như liền.
  const HULL_PTS = [[0.42, -1.9], [0.5, -1.6], [0.56, -1.2], [0.58, -0.6], [0.58, 0.5]];
  const hullR = y => { for (let i = 1; i < HULL_PTS.length; i++) { const [r0, y0] = HULL_PTS[i - 1], [r1, y1] = HULL_PTS[i]; if (y <= y1) return lerp(r0, r1, clamp((y - y0) / (y1 - y0), 0, 1)); } return 0.58; };
  // ⭐ Đợt 454 (thầy 03/10/2026): quả NHỎ đi 30 % · HAI khoang ở 2 BÊN HÔNG (lệch MOUNT_TH khỏi nóc — vẫn gần đỉnh) thay 1 khoang
  // trên nóc. Ô 0 = hông PHÍA NGƯỜI XEM (+Z mô hình = phía camera), ô 1 = hông khuất. Chỉ có 1 quả ⇒ luôn ở ô 0 (bắn ô 1 trước).
  const Y0 = -1.05, Y1 = 0.75, XC = (Y0 + Y1) / 2;       // cửa chạy dọc thân (trục Y mô hình = hướng bay của tàu)
  const DELTA = 0.3;                                     // nửa góc cửa (rad)
  const TOP = Math.PI * 1.5;                             // mô hình dựng dọc +Y, xoay −90° quanh Z ⇒ NÓC tàu = −X mô hình ⇒ φ = 270°
  const MOUNT_TH = Math.PI / 2;                          // 454b (thầy): ra HẲN bên hông — φ = 270° ± 90° (ngang thân)
  const MS = 1.05 * 0.7;                                 // cỡ quả trên tàu và lúc bay (Đợt 454: −30 %)
  const M_R = 0.2 * MS, M_LEN = 2.32 * MS;               // bán kính thân · dài cả quả (đuôi −1,15 → mũi 1,17)
  const Y_IN = 0.28, Y_OUT = 0.58 + 0.1 + M_R;           // tâm quả: nằm TRONG thân ↔ gắn sát ngoài hông (hở 0,1 cho thấy 2 tay kẹp)
  const LA = 0.5, LB = 0.5, SH_Y = 0.02;                 // 2 đốt tay + vai (sâu trong thân) — 455: dài hơn để đẩy quả ra xa EXT
  // ⭐ Đợt 455 (thầy 04/10/2026: "xoay ở ngang hông phải thật hơn, không lẹm vào thân tàu; có âm thanh xoay của robot"):
  // trước khi phóng, quả vẫn GẮN THEO TÀU: (1) EXT_T — 2 tay đẩy quả ra XA hông thêm EXT, đồng thời 2 cổ tay CHỤM về giữa bụng quả
  // thành trục xoay; (2) TILT_T — quả xoay 90° quanh TÂM cho mũi chĩa thẳng lên trời (lúc này cách vỏ đủ xa, không lẹm), tiếng servo;
  // (3) nhả ⇒ đánh lửa ngay. Đo: tâm quả cách trục tàu 1,13 > vỏ 0,58 + nửa sải vây quả.
  const EXT = 0.3, EXT_T = 0.3, TILT_T = 0.45;
  function sliceGeo(rs, phiStart, phiLen) {
    const pts = []; for (let i = 0; i <= 16; i++) { const y = lerp(Y0, Y1, i / 16); pts.push(new THREE.Vector2(hullR(y) * rs, y)); }
    return new THREE.LatheGeometry(pts, 10, phiStart, phiLen);
  }
  function attachSlot(r, sgn) {
    const C = TOP + sgn * MOUNT_TH;                      // tâm cửa (φ) — sgn +1 ⇒ phía +Z (người xem)
    const bay = new THREE.Group(); r.model.add(bay);      // cửa dựng trong không gian MÔ HÌNH (cùng trục lathe với vỏ)
    const pit = new THREE.Mesh(sliceGeo(0.94, C - DELTA, DELTA * 2), mPit); pit.visible = false; bay.add(pit);
    const door = s => {
      // bản lề ở MÉP NGOÀI cửa (φ = C ∓ δ, r = 0,58); cửa xoay quanh trục song song thân tàu
      const phi = C - s * DELTA, hx = 0.58 * Math.sin(phi), hz = 0.58 * Math.cos(phi);
      const geo = s > 0 ? sliceGeo(1.012, C - DELTA, DELTA) : sliceGeo(1.012, C, DELTA);
      geo.translate(-hx, 0, -hz);
      const h = new THREE.Group(); h.position.set(hx, 0, hz);
      const mesh = new THREE.Mesh(geo, r.hullMat); h.add(mesh);
      bay.add(h); return h;
    };
    const dL = door(1), dR = door(-1);
    // tay robot + quả: dựng trong không gian TÀU (+X hướng bay, +Y = pháp tuyến cửa) — xoay quanh trục thân về đúng hông
    const rig = new THREE.Group(); rig.position.x = XC; rig.rotation.x = sgn * MOUNT_TH; r.ship.add(rig);
    const ms = makeMissile(); ms.g.scale.setScalar(MS); ms.g.visible = false; rig.add(ms.g);
    const linkGeo = new THREE.BoxGeometry(1, 0.06, 0.06); linkGeo.translate(0.5, 0, 0);
    const jointGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.09, 16).rotateX(Math.PI / 2);
    const arms = [-0.45, 0.4].map(ax => {
      const sh = new THREE.Group(); sh.position.set(ax, SH_Y, 0); rig.add(sh);
      const up = new THREE.Mesh(linkGeo, mDark); up.scale.x = LA; sh.add(up);
      sh.add(new THREE.Mesh(jointGeo, mJoint));
      const elbow = new THREE.Group(); elbow.position.x = LA; sh.add(elbow);
      elbow.add(new THREE.Mesh(jointGeo, mJoint));
      const fore = new THREE.Mesh(linkGeo, mDark); fore.scale.x = LB; elbow.add(fore);
      const claw = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.04, 0.18), mJoint); rig.add(claw);   // kẹp: ôm dưới bụng quả
      return { ax, sh, elbow, claw };
    });
    return { bay, pit, dL, dR, rig, ms, arms, sgn, open: 0, rise: 0, wantRise: 0, has: false, ext: 0, tilt: 0 };
  }
  function attach(r) {
    r.mis = { slots: [attachSlot(r, 1), attachSlot(r, -1)] };
    poseMount(r, 0);
  }
  // 2 đốt tay (IK): vai cố định trong thân, cổ tay dính dưới bụng quả; khuỷu gập về phía MŨI tàu
  function poseArm(a, wristY, ax = a.ax) {
    const dy = wristY - SH_Y, d = clamp(Math.abs(dy), 0.03, LA + LB - 1e-3);
    const base = Math.PI / 2;                                             // cổ tay NGAY TRÊN vai
    const off = Math.acos(clamp((LA * LA + d * d - LB * LB) / (2 * LA * d), -1, 1));
    const sh = base - off;                                                // đốt trên nghiêng về +X (mũi tàu)
    const ex = Math.cos(sh) * LA, ey = Math.sin(sh) * LA;
    a.sh.rotation.z = sh;
    a.elbow.rotation.z = Math.atan2(dy - ey, 0 - ex) - sh;
    a.sh.position.x = ax;
    a.claw.position.set(ax, wristY + 0.025, 0);
  }
  function poseMount(r, dt) {
    if (r.mis) r.mis.slots.forEach(m => poseSlot(r, m, dt));
  }
  function poseSlot(r, m, dt) {
    m.rig.visible = r.model.visible && !r.wreck && !r.hidden;
    if (m.wantRise > m.rise) { if (m.open >= 0.97) m.rise = Math.min(m.wantRise, m.rise + dt / 0.7); }
    else if (m.wantRise < m.rise) { if (m.open >= 0.97) m.rise = Math.max(m.wantRise, m.rise - dt / 0.55); }
    // cửa chỉ mở lúc tay đang đưa ra / thu vào; quả đã gắn xong ⇒ cửa ĐÓNG lại dưới bụng quả (thân tàu như cũ, chỉ còn 2 tay kẹp)
    // Đợt 454: quả đang NẠP (wantRise tăng dần theo thanh nạp) ⇒ cửa mở sẵn từ lúc bắt đầu nạp
    const moving = m.wantRise !== m.rise || (m.rise > 0.02 && m.rise < 1) || (m.has && m.rise < 1);
    const openT = moving ? 1 : 0;
    m.open = clamp(m.open + clamp(openT - m.open, -dt / 0.4, dt / 0.35), 0, 1);
    const a = smooth(m.open) * 1.75;
    m.dL.rotation.y = -a; m.dR.rotation.y = a;
    m.pit.visible = m.open > 0.01;
    m.dL.visible = m.dR.visible = m.open > 0.01;          // 454b: cửa đóng = liền vỏ ⇒ ẩn hẳn (không che số đội sơn ở hông)
    const k = m.rise < 1 ? smooth(m.rise) : 1;
    const ke = smooth(m.ext), kt = smooth(m.tilt);
    const y = lerp(Y_IN, Y_OUT, k) + EXT * ke + (m.rise >= 1 && ke <= 0 ? Math.sin(G.t * 3 + r.idx) * 0.008 : 0);
    m.ms.g.position.set(0, y, 0);
    m.ms.g.rotation.y = m.sgn * Math.PI / 2 * kt;                        // 455: mũi xoay lên trời quanh tâm quả
    m.ms.g.visible = m.has && (m.open > 0.9 || m.rise > 0);            // cánh đuôi quả thò ra ngoài vỏ ⇒ chỉ hiện khi cửa đã mở
    const armOn = m.open > 0.02 || m.rise > 0;
    m.arms.forEach(arm => { arm.sh.visible = arm.claw.visible = armOn; poseArm(arm, y - M_R - 0.05, arm.ax * (1 - 0.85 * ke)); });   // 455: chụm thành trục xoay
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
  const A = [0, 1].map(() => ({ reserve: 0, loaded: false, pips: 0, pipsMax: 3, full: false, boost: false, boostPips: 0, boostMax: 5, locked: false, on: true, max: 3 }));   // 441: max = Missiles max (Infinity = ∞)
  const UI = [null, null];
  const pending = [];
  const later = (t, fn) => pending.push({ t, fn });
  // ⭐ Đợt 454 (thầy 03/10/2026) — HAI Ô SẴN SÀNG mỗi tàu (ô j ↔ khoang hông j). Trạng thái từng ô:
  //   empty → shuttle (quả nhỏ bay từ cột dự phòng sang, SHUTTLE s) → charge (đỏ dần + tiếng nạp + quả trên thân từ từ đưa ra,
  //   MC.charge s) → ready → (chạm bắn) firing (quả lùi khỏi màn, MC.carry) → empty khi quả rời thân tàu.
  //   queued = đã chạm bắn nhưng quả trước còn quá gần ⇒ tự phóng khi đủ xa.
  // Luật khoảng cách: quả trước phải bay xa thân tàu ≥ GAP_SHIP (gấp đôi chiều dài tàu) mới được bắn quả kế. NGOẠI LỆ: 2 ô cùng
  //   SẴN SÀNG lúc bắn quả đầu ⇒ quả thứ 2 được bắn NỐI ĐUÔI (rời bệ khi quả đầu đã bay PAIR_T s ⇒ mũi sau sát đuôi trước).
  const SL = [0, 1].map(() => [0, 1].map(() => ({ st: "empty", t: 0, k: 0, snd: null, need: 0, pair: false, to: 0 })));
  const lastF = [null, null];                          // { pending, f, pairOK, pairUsed } — lần bắn gần nhất của mỗi tàu
  const capOf = a => (a.max === Infinity ? 2 : clamp(a.max | 0, 0, 2));
  const SHUTTLE = 0.5, BIG_DY = 0.235, BIG_K = 0.74;
  const SHIP_LEN = 4.75 * RS, GAP_SHIP = 2 * SHIP_LEN;
  const T1 = 0.45, D1 = 2.2 * RS;                      // pha 1 khi phóng: lao THẲNG LÊN D1 trong T1 giây (nhanh dần)
  const ROT_T = 0;                                     // 455: xoay lên trời nay làm TRÊN BỆ (EXT_T + TILT_T, quả còn theo tàu) ⇒ rời bệ là đánh lửa
  const PAIR_T = T1 * Math.sqrt(Math.min(1, M_LEN * RS * 1.1 / D1));   // quả đầu đi được ~1 thân quả ⇒ quả sau rời bệ
  function gapOK(side, S) {
    const L = lastF[side]; if (!L) return true;
    if (S.pair) return G.t - L.t0 >= PAIR_T;            // 455: 2 quả cùng chuẩn bị trên bệ ⇒ quả sau bắt đầu sau quả đầu PAIR_T
    if (L.pending) return false;
    const f = L.f; if (!f || flights.indexOf(f) < 0) return true;
    return f.m.g.position.distanceTo(shipPos(rockets[side])) >= GAP_SHIP;
  }
  function tickSlots(side, dt) {
    const r = rockets[side], mounts = r.mis ? r.mis.slots : null;
    SL[side].forEach((S, j) => {
      if (S.st === "shuttle") { S.t += dt; if (S.t >= SHUTTLE) { S.st = "charge"; S.k = 0; S.snd = X.sfxCharge ? X.sfxCharge(MC.charge, 1) : null; } }
      else if (S.st === "charge") {
        S.k = Math.min(1, S.k + dt / MC.charge);
        if (S.k >= 1) {
          S.st = "ready"; S.snd = null;
          const B = UI[side] && UI[side].bigs[j]; if (B) B.flash = 1;
          if (mounts && r.model.visible && !r.hidden) { const p = new V3(); mounts[j].ms.g.getWorldPosition(p); burst(p, { n: 26, speed: 3, color: new THREE.Color(...pal().halo), colorEnd: new THREE.Color(1, 0.3, 0.2), size: 0.12, life: 0.35 }); }
        }
      } else if (S.st === "queued" && gapOK(side, S)) fireSlot(side, j);
      if (mounts) {
        const m = mounts[j];
        m.has = S.st !== "empty";
        m.wantRise = S.st === "charge" ? smooth(S.k) : (S.st === "ready" || S.st === "queued" || S.st === "firing") ? 1 : 0;
        if (S.st === "firing") { S.t += dt; m.ext = clamp(S.t / EXT_T, 0, 1); m.tilt = clamp((S.t - EXT_T) / TILT_T, 0, 1); }
        else m.ext = m.tilt = 0;
      }
    });
  }
  function fireSlot(from, j) {
    const S = SL[from][j], other = SL[from][1 - j];
    if (S.pair && lastF[from]) lastF[from].pairUsed = true;
    const rec = { pending: true, f: null, pairOK: !S.pair && other.st === "ready", pairUsed: false, t0: G.t };
    lastF[from] = rec;
    S.st = "firing"; S.pair = false; S.t = 0;
    const vis = rockets[from].model.visible && !rockets[from].hidden;
    if (vis && X.sfxServo) X.sfxServo(EXT_T, 0.55);                // 455: tiếng servo đẩy ra…
    const B = UI[from] && UI[from].bigs[j]; if (B) B.fireK = 1;   // 6d: quả to trong bảng lùi ra khỏi màn trước…
    const g0 = gen, to = S.to;
    later(EXT_T, () => { if (g0 === gen && vis && X.sfxServo) X.sfxServo(TILT_T, 1); });   // …và xoay lên
    later(EXT_T + TILT_T, () => {                                    // …rồi tên lửa (đã chĩa lên trời) mới rời bệ
      if (g0 !== gen) return;
      rec.pending = false; rec.f = liftoff(from, to, j);
      S.st = "empty";
    });
  }

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
  // ⭐ Đợt 441 (thầy, bố cục "cột dọc mọc lên") — Missiles max 0–5 / ∞: tối đa 4 quả dự phòng (1 quả to đã lên nòng) xếp CỘT từ dưới
  // lên, ô 0 ở đáy (−0,3·ammoH) — 3 ô đầu đúng chỗ cũ, ô thứ 4 mọc lên trên. Giữ ≥ 5 quả dự phòng (chỉ ở ∞) ⇒ nhãn "+X" trên đỉnh cột.
  const MINI_N = 4, MINI_PITCH = 0.3;
  const slotY = i => -MINI_PITCH + i * MINI_PITCH;                // × ammoH
  const slotsOf = a => (a.max === Infinity ? MINI_N : clamp((a.max | 0) - Math.min(2, a.max | 0), 0, MINI_N));   // Đợt 454: 2 ô sẵn sàng
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
    const minis = Array.from({ length: MINI_N }, (_, i) => { const m = makeMissile(); m.g.position.set(spX, slotY(i) * ammoH, 0.14); m.g.rotation.y = rotY; m.g.visible = false; am.add(m.g); return m; });   // 441: 4 ô
    // 441: nhãn "+X" (số quả dự phòng vượt 4) — chữ vẽ canvas, đặt trên ô trên cùng
    const plusCv = document.createElement("canvas"); plusCv.width = 256; plusCv.height = 128;
    const plusTex = new THREE.CanvasTexture(plusCv); plusTex.colorSpace = THREE.SRGBColorSpace;
    const plus = new THREE.Sprite(new THREE.SpriteMaterial({ map: plusTex, transparent: true, depthWrite: false }));
    plus.scale.set(spW * 1.5, spW * 0.75, 1); plus.position.set(spX, (slotY(MINI_N - 1) + MINI_PITCH * 0.95) * ammoH, 0.2); plus.visible = false; plus.renderOrder = 25; am.add(plus);
    // ⭐ Đợt 454: HAI ô sẵn sàng (ô 0 ↔ hông phía người xem, ô 1 ↔ hông khuất) — mỗi ô 1 quả xám + 1 quả đỏ chồng khít, cắt
    // bằng mặt phẳng: phần đỏ lan dần từ ĐUÔI tới MŨI theo thanh nạp.
    const bigs = [0, 1].map(() => makeBigSlot(am, rotY, bigW, ammoH));
    const shuttleMats = { body: mRed.clone(), dark: mRedDark.clone(), white: mWhite.clone(), tail: mDark.clone(), glow: mGlow.clone() };
    Object.values(shuttleMats).forEach(m => { m.transparent = true; });   // 454b: bay sang ô thì nhạt dần thành bóng mờ
    const shuttle = makeMissileWith(shuttleMats); shuttle.g.visible = false; shuttle.g.rotation.y = rotY; am.add(shuttle.g);
    // 6d: HAI vùng chạm — hàng quả nhỏ (nạp) · ô quả to (bắn)
    const hitSp = new THREE.Mesh(new THREE.PlaneGeometry(spW * 1.2, ammoH * 1.55), mHit); hitSp.position.set(spX - inSign * spW * 0.08, ammoH * 0.15, 0.3); am.add(hitSp);   // 441: phủ cả 4 ô
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
    UI[side] = { am, bst, minis, bigs, shuttle, shuttleMats, btn, btnRimMat, btnFaceMat, iconMat, pips, bGlow, areaW, warn, warnMat, inSign, miniS, bigS, bigX, spX, ammoH,
      msCol, msColW: colW, msN: -1, msSlots: -1, msPips: [], msFlash: 0, plus, plusCv, plusTex, plusN: -1, plusPal: "",
      press: { fire: 0, boost: 0, load: 0 }, pop: [0, 0, 0, 0], load: null, shakeK: 0, flash: 0, readyK: 0 };
  }
  function buildMsPips(U, n, slots) {
    U.msCol.children.slice().forEach(o => { U.msCol.remove(o); o.geometry && o.geometry.dispose(); });
    U.msPips = []; U.msN = n; U.msSlots = slots;
    if (n <= 0) return;
    // ⭐ Đợt 441 — cột vạch cao ĐÚNG bằng cột quả dự phòng của trận (số ô theo Missiles max), đáy thẳng đáy ô dưới cùng;
    // không có ô dự phòng (max 1) ⇒ cao bằng quả to.
    const nS = Math.max(1, slots), H = U.ammoH * MINI_PITCH * nS * 1.05 + (slots >= 1 ? 0 : U.ammoH * 0.2), y0 = slots >= 1 ? (slotY(0) - MINI_PITCH * 0.52) * U.ammoH : -H / 2;
    const gap = Math.min(H * 0.035, H / n * 0.18), h = (H - gap * (n - 1)) / n, w = U.msColW;
    for (let i = 0; i < n; i++) {
      const y = y0 + h / 2 + i * (h + gap);                               // i = 0 ở DƯỚI
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
    const slots = slotsOf(a), shown = a.on ? Math.min(slots, a.reserve) : 0;   // 441: tối đa 4 ô theo Missiles max
    const extra = a.on ? Math.max(0, a.reserve - MINI_N) : 0;                    // 441: ∞ giữ ≥ 5 quả dự phòng ⇒ "+X"
    if (extra !== U.plusN || pal().label !== U.plusPal) {
      U.plusN = extra; U.plusPal = pal().label;
      const g = U.plusCv.getContext("2d"); g.clearRect(0, 0, 256, 128);
      if (extra > 0) { g.font = `900 92px ${X.FONT_UI || "sans-serif"}`; g.textAlign = "center"; g.textBaseline = "middle"; g.shadowColor = "rgba(0,0,0,.85)"; g.shadowBlur = 14; g.fillStyle = "#fff"; g.lineWidth = 10; g.strokeStyle = U.plusPal; g.strokeText("+" + extra, 128, 68); g.fillText("+" + extra, 128, 68); }
      U.plusTex.needsUpdate = true;
    }
    U.plus.visible = extra > 0;
    U.minis.forEach((m, i) => {
      const vis = i < shown;
      if (vis && !m.g.visible) U.pop[i] = 1;
      m.g.visible = vis;
      U.pop[i] = Math.max(0, U.pop[i] - dt / 0.55);
      fat(m.g, U.miniS * Math.max(0.01, U.pop[i] > 0 ? easeOutBack(1 - U.pop[i]) : 1));
      m.g.position.y = slotY(i) * U.ammoH + Math.sin(G.t * 2 + i * 1.7) * 0.008;
      m.g.position.x = U.spX - U.inSign * U.press.load * 0.02;
    });
    const cap = capOf(a);
    const bigY = j => (cap >= 2 ? (j === 0 ? -BIG_DY : BIG_DY) : 0) * U.ammoH;   // ô 0 dưới, ô 1 trên
    const bigSc = U.bigS * (cap >= 2 ? BIG_K : 1);
    if (U.load) {                          // nạp: quả nhỏ bay sang ô sẵn sàng, lớn dần, đỏ NHẠT dần thành xám (chưa nạp năng lượng)
      U.load.t += dt; const k = smooth(U.load.t / SHUTTLE);
      U.shuttle.g.visible = true;
      U.shuttle.g.position.set(lerp(U.spX, U.bigX, k), lerp(U.load.fy * U.ammoH, bigY(U.load.j), k), 0.16 + Math.sin(k * Math.PI) * 0.3);
      fat(U.shuttle.g, lerp(U.miniS, bigSc, k));
      const M = U.shuttleMats;
      M.body.color.copy(mRed.color).lerp(mGhost.color, k); M.body.emissiveIntensity = 0.22 * (1 - k);
      M.dark.color.copy(mRedDark.color).lerp(mGhost.color, k); M.dark.emissiveIntensity = 0.1 * (1 - k);
      M.glow.color.copy(mGlow.color).lerp(mGhost.color, k);
      Object.values(M).forEach(m => { m.opacity = lerp(1, mGhost.opacity, k); m.depthWrite = k < 0.5; });
      if (U.load.t >= SHUTTLE) { U.bigs[U.load.j].popBig = 1; U.load = null; U.shuttle.g.visible = false; }
    }
    U.flash = Math.max(0, U.flash - dt * 1.6);
    let anyReady = false;
    U.bigs.forEach((B, j) => {
      const S = SL[side][j], use = a.on && j < cap;
      const loadingHere = U.load && U.load.j === j;
      const has = use && !loadingHere && (S.st === "charge" || S.st === "ready" || S.st === "queued");
      B.g.visible = has || B.fireK > 0;
      B.ghost.g.visible = use && !B.g.visible && !loadingHere;
      B.ghost.g.position.set(U.bigX, bigY(j), 0.12); fat(B.ghost.g, bigSc);
      B.popBig = Math.max(0, B.popBig - dt / 0.5);
      B.flash = Math.max(0, B.flash - dt * 1.8);
      const fill = S.st === "charge" ? S.k : 1;
      if (B.fireK > 0) {                     // 6d: bắn ⇒ quả LÙI (đuôi đi trước) ra khỏi MÉP NGOÀI màn — mang đi lắp vào chỗ bắn
        B.fireK = Math.max(0, B.fireK - dt / MC.carry); const k = 1 - B.fireK;
        const back = k < 0.18 ? -Math.sin(k / 0.18 * Math.PI) * 0.06 : Math.pow((k - 0.18) / 0.82, 2) * 3.2;   // nhún tới một chút rồi kéo lùi
        B.g.position.set(U.bigX - U.inSign * back * U.areaW, bigY(j) - k * k * U.ammoH * 0.15, 0.18);
        fat(B.g, bigSc * (1 - k * 0.25));
      } else {
        fat(B.g, bigSc * Math.max(0.01, B.popBig > 0 ? easeOutBack(1 - B.popBig) : 1));
        const q = S.st === "queued" ? Math.sin(G.t * 40) * 0.01 : 0;          // chờ bắn nối đuôi ⇒ rung nhẹ
        B.g.position.set(U.bigX + q, bigY(j) + Math.sin(G.t * 2.2 + j) * 0.012, 0.18);
      }
      // màu đỏ theo bảng màu hiện tại (PEACE = xanh lá) + lõi sáng dần khi nạp
      const pulse = 0.5 + 0.5 * Math.sin(G.t * (6 + fill * 16));
      B.mr.body.color.copy(mRed.color); B.mr.body.emissive.copy(mRed.emissive);
      B.mr.body.emissiveIntensity = S.st === "charge" ? 0.22 + 0.6 * fill * pulse : 0.22 + B.flash * 0.8;
      B.mr.dark.color.copy(mRedDark.color); B.mr.dark.emissive.copy(mRedDark.emissive);
      B.mr.glow.color.copy(mGlow.color);
      B.under.g.visible = fill < 1;          // 454b: bóng mờ bên dưới, đỏ đổ đầy từ đuôi (−1,15) lên mũi (1,17), mép mềm
      B.uFill.value = fill < 1 ? lerp(-1.15 - FILL_SOFT, 1.17 + FILL_SOFT, fill) : 9;
      const ready = (S.st === "ready" || S.st === "queued") && !a.locked && B.fireK <= 0;
      if (ready) anyReady = true;
      B.glowSp.position.set(U.bigX, bigY(j) - U.ammoH * 0.03, 0.06);
      B.glowSp.scale.set(U.areaW * 0.6 * 1.3, U.ammoH * (cap >= 2 ? 0.5 : 1.1), 1);
      B.glowSp.material.opacity = (ready ? (S.st === "queued" ? 0.3 + 0.25 * Math.sin(G.t * 18) : 0.22 + 0.12 * Math.sin(G.t * 4)) : 0)
        + (has && S.st === "charge" ? fill * 0.25 * pulse : 0) + B.flash * 0.8 + U.flash * 0.4;
    });
    // ⭐ MẪU 7b — cột vạch năng lượng tên lửa (đầy kho ⇒ mờ đi, không tích nữa)
    const msN = a.on ? clamp(a.pipsMax | 0, 0, 10) : 0;
    if (msN !== U.msN || slots !== U.msSlots) buildMsPips(U, msN, slots);
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
  // ⭐ Đợt 454 (thầy 03/10/2026): đường bay ĐÚNG VẬT LÝ — quả gắn dọc thân, mũi chĩa về trước ⇒ rời bệ LAO THẲNG RA TRƯỚC
  // (pha 1: D1 trong T1 giây, nhanh dần), rồi mới uốn VÒNG CUNG (Bézier: điểm điều khiển 1 vẫn thẳng phía trước ⇒ hướng bay liền
  // mạch; điểm 2 trên cao ngay trên tàu địch ⇒ đoạn cuối lao xuống). Tàu địch ở PHÍA SAU ⇒ vươn ra trước xa hơn (F) rồi vòng lên
  // quay lại; tàu địch phía trước ⇒ ra trước một chút rồi lượn lên. Nhịp tham số u(k) bậc 3: tốc độ đầu pha 2 khớp cuối pha 1,
  // cuối đường lao nhanh (u'(1) = 1,6).
  let gen = 0;                                     // clearAll() tăng ⇒ lần phóng đang chờ bị huỷ
  function launch(from, to) {
    const r = rockets[from]; if (!r.mis) return 0;
    const S = SL[from];
    if (S.some(s => s.st === "queued")) return 0;  // đã có 1 quả chờ phóng
    const j = [1, 0].find(i => S[i].st === "ready");   // bắn ô 1 (hông khuất) trước ⇒ còn 1 quả thì nó ở hông phía người xem
    if (j == null) return 0;                       // chưa có quả nạp xong
    const L = lastF[from];
    S[j].to = to; S[j].pair = false;
    if (gapOK(from, S[j])) { fireSlot(from, j); return 1; }       // quả trước đã đủ xa (hoặc chưa bắn quả nào)
    S[j].pair = !!(L && L.pairOK && !L.pairUsed);                 // quả trước còn gần: là quả thứ 2 của cặp ⇒ được nối đuôi
    if (gapOK(from, S[j])) fireSlot(from, j); else S[j].st = "queued";   // chưa tới lượt ⇒ tự phóng khi đủ xa
    return 1;
  }
  function liftoff(from, to, j) {
    const r = rockets[from], m = pool.find(p => !p.g.visible); if (!m || !r.mis) return null;
    const mount = r.mis.slots[j], src = mount.ms.g;
    const p0 = new V3(), q0 = new THREE.Quaternion();
    if (mount.has && src.visible) { src.getWorldPosition(p0); src.getWorldQuaternion(q0); }
    else { shipPos(r, p0).addScaledVector(UP, 0.9 * RS); q0.setFromUnitVectors(new V3(1, 0, 0), TRAVEL); }
    src.visible = false; mount.has = false; mount.wantRise = 0;   // quả rời tay ⇒ tay thu vào, cửa đóng
    // 454b (thầy): quả rời tay ⇒ XOAY quanh tâm 90° cho mũi chĩa THẲNG LÊN TRỜI (ROT_T), rồi mới đánh lửa phóng thẳng lên
    m.g.position.copy(p0); m.g.quaternion.copy(q0); m.g.visible = true; m.flame.visible = m.flare.visible = false;
    const a = clamp((2 * D1 / T1) * (MC.dur - ROT_T - T1) / (4 * 4 * RS), 0.6, 1.6), e = 1.6;
    const f = { id: nextId++, m, from, to, t: 0, dur: MC.dur, p0, prev: p0.clone(), dodged: false, anchor: null, passed: false, after: 0, vel: new V3(), beepT: 0,
      qA: q0.clone(), qB: new THREE.Quaternion().setFromUnitVectors(new V3(1, 0, 0), UP), lit: false,
      q0: p0.clone().addScaledVector(UP, D1), F: 4 * RS, ua: a, ub: 3 - 2 * a - e, uc: e + a - 2, k: 0 };
    flights.push(f);
    if (X.onLaunch) X.onLaunch(to, f.dur);              // Đợt 458: trang game kéo dài Time delay của bàn bị bắn
    G.wideCam = true;                                  // 6b: góc nhìn RỘNG để thấy cả đường bay + va chạm
    alarm(f, true);                                  // 6d: chuông báo động bên bị bắn
    return f;
  }
  function ignite(f) {                              // 454b: hết pha xoay ⇒ đánh lửa, khói phụt xuống dưới
    f.lit = true; const m = f.m, p0 = f.p0, down = UP.clone().multiplyScalar(-1);
    m.flame.visible = m.flare.visible = true;
    for (let i = 0; i < 12; i++) smoke.emit({ pos: p0.clone().addScaledVector(down, 0.8 * RS * MS).add(new V3(rand(-0.3, 0.3), rand(-0.15, 0.15), rand(-0.3, 0.3))), vel: down.clone().multiplyScalar(rand(1, 2.5)).add(new V3(rand(-1.2, 1.2), 0, rand(-1.2, 1.2))), life: rand(1, 1.6), size: 0.35, sizeEnd: 1.7, color: new THREE.Color(0.75, 0.75, 0.8), alpha: 0.4, drag: 1.2 });
    burst(p0.clone().addScaledVector(down, 0.8 * RS * MS), { n: 34, speed: 5, color: new THREE.Color(5, 2.2, 0.8), colorEnd: new THREE.Color(1.5, 0.2, 0.05), size: 0.14, life: 0.45 });
    sfx("mlaunch", 1);
    shake(0.15);
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
  // ⭐ Đợt 454 (thầy 03/10/2026) — CỠ NỔ: tên lửa nhỏ đi ⇒ trúng tàu nổ nhỏ hơn (0,75 → HIT_SC); 2 quả đâm nhau trên không chỉ
  // bằng NỬA vụ trúng tàu và XỊT (ít lửa, nhiều khói, tiếng nhỏ) — trúng tàu nổ mạnh vì trong tàu có nhiên liệu.
  const HIT_SC = 0.58, CLASH_SC = HIT_SC * 0.5;
  function airburst(pos, sc = 0.45) { explosion(pos, sc); sfx("boom", 0.5); }
  // ⭐⭐ Đợt 441 — mỗi quả bay ĐÚNG đường của nó; A→B và B→A gần như MỘT đường cong ngược chiều ⇒ tự gặp nhau.
  // ⭐ Đợt 454 (thầy): 2 quả ngược chiều KHÔNG BAO GIỜ được bay lướt qua nhau — trong tầm CLASH_SEEK hai đầu HÚT nhau (mạnh dần
  // khi gần); đoạn bay trong khung chạm nhau ⇒ nổ; lỡ đang xáp lại mà bắt đầu RỜI xa (đã lướt qua) trong tầm PASS_D ⇒ ép nổ
  // ngay giữa 2 quả. Áp cho MỌI cặp ngược chiều, kể cả quả đã bị né đang lao hụt.
  // VÙNG ẢNH HƯỞNG khi đâm nhau (CLASH_ZONE) nay rất SÁT tàu (≈ trên đầu thân tàu): chỉ khi tàu vừa phóng quả đáp trả lúc quả
  // địch đã kề sát ⇒ tàu đó chịu 50 % thiệt hại (tag "half"); nổ xa hơn ⇒ không ai sao.
  let lastClash = null;                                 // bàn thử: khoảng cách chỗ nổ → tàu
  const CLASH_HIT = 0.7 * RS, CLASH_NEAR = 3.0 * RS, CLASH_ZONE = CLASH_NEAR, CLASH_SEEK = 12 * RS, PASS_D = 5 * RS;
  const pairD = new Map();                              // "idA_idB" → { d, closing }
  // khoảng cách gần nhất giữa 2 đoạn bay trong khung này (a0→a1, b0→b1) — dò 6 điểm, đủ vì mỗi khung chỉ vài phần đơn vị
  function segGap(a0, a1, b0, b1) {
    let best = Infinity; const pa = new V3(), pb = new V3();
    for (let j = 0; j <= 6; j++) { pa.lerpVectors(a0, a1, j / 6); pb.lerpVectors(b0, b1, j / 6); best = Math.min(best, pa.distanceTo(pb)); }
    return best;
  }
  function dropFlight(f) { const i = flights.indexOf(f); if (i >= 0) flights.splice(i, 1); f.m.g.visible = false; f.m.flame.visible = f.m.flare.visible = false; }
  function clash(fa, fb) {
    const mid = fa.np.clone().add(fb.np).multiplyScalar(0.5);
    [fa, fb].forEach(dropFlight);
    // nổ XỊT: quả cầu lửa nhỏ + ít tia + cụm khói xám tản chậm
    explosion(mid.clone(), CLASH_SC);
    burst(mid, { n: 70, speed: 7, color: new THREE.Color(3.6, 1.7, 0.5), colorEnd: new THREE.Color(0.6, 0.1, 0.02), size: 0.13, life: 0.45 });
    for (let i = 0; i < 16; i++) smoke.emit({ pos: mid.clone().add(new V3(rand(-0.35, 0.35), rand(-0.35, 0.35), rand(-0.35, 0.35))), vel: new V3(rand(-1.3, 1.3), rand(-0.4, 1), rand(-1.3, 1.3)), life: rand(1.4, 2.3), size: 0.4, sizeEnd: 2.3, color: new THREE.Color(0.3, 0.29, 0.28), alpha: 0.45, drag: 1.5 });
    sfx("boom", 0.85); sfx("hit1", 0.8); shake(0.25);   // 454b: tiếng nổ to hơn
    const x = rings.find(z => z.t > 1.2); if (x) { x.t = 0; x.r = null; x.at = mid.clone(); x.big = 1; x.m.visible = true; }
    lastClash = { at: +G.t.toFixed(2), zone: +CLASH_ZONE.toFixed(2), d: [0, 1].map(s => ({ side: s, d: +mid.distanceTo(shipPos(rockets[s])).toFixed(2) })) };
    [0, 1].forEach(s => {
      const from = 1 - s, r = rockets[s];
      if (mid.distanceTo(shipPos(r)) < CLASH_ZONE) {       // nổ sát thân ⇒ dính 50 % (tag "half" ⇒ trang game chia đôi)
        stall(r); scorch(r);
        labelOn(r, "HIT 50%", "#ff8a6a");
        X.onEnd && X.onEnd(s, "hit", from, "half");
      } else X.onEnd && X.onEnd(s, "clash", from);
    });
  }
  // ⭐ Đợt 441 (thầy) — TÊN LỬA DẪN ĐƯỜNG: điểm đích của đường cong BÁM theo tàu một cách mượt (không nhảy theo từng nấc), đoạn
  // cuối khoá thẳng vào tàu ⇒ trả lời / BOOST sớm hơn cửa sổ né (MC.window) thì quả vẫn bẻ lái theo và trúng.
  function flightTarget(f, T, k, dt) {
    if (!f.Ts) f.Ts = T.clone();
    f.Ts.lerp(T, 1 - Math.exp(-dt * 3.5));
    const w = smooth((k - 0.78) / 0.2);
    return w > 0 ? f.Ts.clone().lerp(T, w) : f.Ts.clone();
  }
  // ⭐ Đợt 454 (thầy): CHẠM VỎ LÀ NỔ — dò mũi quả (4 điểm dọc đoạn bay khung này) trong hệ toạ độ TÀU ĐỊCH: +X = trục thân,
  // bán kính theo đúng biên dạng vỏ (HULL_PTS + mũi ogive). Không còn cắm vào tâm tàu rồi mới nổ.
  const hullRad = y => (y <= 0.5 ? hullR(y) : 0.58 * Math.pow(Math.max(0, 1 - Math.pow((y - 0.5) / 1.75, 2)), 0.62));
  const NOSE = 1.17 * MS * RS;
  function hullContact(f) {
    const r = rockets[f.to]; if (!r.model.visible || r.hidden || r.wreck) return null;
    const dir = f.np.clone().sub(f.prev), len = dir.length(); if (len < 1e-6) return null;
    dir.divideScalar(len);
    r.ship.updateWorldMatrix(true, false);
    const l = new V3();
    for (let j = 1; j <= 4; j++) {
      const p = f.prev.clone().lerp(f.np, j / 4).addScaledVector(dir, NOSE);
      r.ship.worldToLocal(l.copy(p));
      if (l.x < -2.05 || l.x > 2.2) continue;
      if (Math.hypot(l.y, l.z) <= hullRad(l.x) + 0.04) return p;
    }
    return null;
  }
  function pathPos(f, dt) {
    const T = f.anchor ? f.anchor : shipPos(rockets[f.to]);
    f.T = T;
    if (f.t < ROT_T) { flightTarget(f, T, 0, dt); f.k = 0; return f.p0.clone(); }                       // pha 0: đứng tại bệ, xoay
    if (f.t < ROT_T + T1) { const s = (f.t - ROT_T) / T1; flightTarget(f, T, 0, dt); f.k = 0; return f.p0.clone().addScaledVector(UP, D1 * s * s); }
    const k = clamp((f.t - ROT_T - T1) / (f.dur - ROT_T - T1), 0, 1);
    const u = clamp(k * (f.ua + k * (f.ub + k * f.uc)), 0, 1);
    const Tt = flightTarget(f, T, k, dt);
    const H = 9 + Math.abs(Tt.z - f.p0.z) * 0.18;     // lên cao theo khoảng cách 2 tàu; điểm điều khiển 3 NGAY TRÊN tàu địch
    f.k = k;
    // Bézier BẬC 4: P1 thẳng phía trước (hướng bay liền mạch với pha 1) · P2 phía trước + TRÊN CAO ⇒ quả NGÓC LÊN thành vòng cung
    // (tàu địch phía sau ⇒ vòng lên rồi lật ngược về sau) · P3 trên đầu tàu địch · P4 = tàu địch (lao xuống)
    // 454b: P1 thẳng TRÊN (liền mạch với pha lên thẳng) · P2 cao, đã nghiêng 35 % về phía tàu địch ⇒ vòng cung chúc xuống mục tiêu
    _bp[0].copy(f.q0); _bp[1].copy(f.q0).addScaledVector(UP, f.F);
    _bp[2].copy(Tt).sub(f.q0).multiplyScalar(0.35); _bp[2].addScaledVector(UP, -_bp[2].dot(UP)).add(f.q0).addScaledVector(UP, H * 0.9);
    _bp[3].copy(Tt).addScaledVector(UP, H); _bp[4].copy(Tt);
    const v = 1 - u, c = [v ** 4, 4 * v ** 3 * u, 6 * v * v * u * u, 4 * v * u ** 3, u ** 4], out = new V3();
    _bp.forEach((q, i) => out.addScaledVector(q, c[i]));
    return out;
  }
  const _bp = [0, 1, 2, 3, 4].map(() => new V3());
  const opposed = (a, b) => a.from !== b.from && a.np && b.np && a.t > 0.04 && b.t > 0.04;
  function stepFlights(dt) {
    // 1) vị trí mới của mọi quả (chưa vẽ) — quả đã qua đích (né được) thì lao hụt theo quán tính
    flights.forEach(f => {
      f.t += dt;
      if (f.passed) { f.after += dt; f.vel.multiplyScalar(1 + dt * 0.8); f.np = f.m.g.position.clone().addScaledVector(f.vel, dt); return; }
      f.np = pathPos(f, dt);
    });
    // 2) hai quả ngược chiều trong tầm ⇒ HÚT đầu vào nhau (mạnh dần khi gần) — chỉ quả còn đang săn mục tiêu mới bẻ lái
    flights.forEach(f => {
      if (f.passed || f.dodged || f.t <= 0.04) return;
      let g = null, gd = CLASH_SEEK;
      flights.forEach(h => { if (opposed(f, h)) { const d = f.prev.distanceTo(h.prev); if (d < gd) { gd = d; g = h; } } });
      if (g) f.np.lerp(g.np, 0.65 * smooth(1 - gd / CLASH_SEEK) * Math.min(1, dt * 10));
    });
    // 3) mọi cặp ngược chiều: chạm nhau, hoặc vừa lướt qua nhau ⇒ ĐÂM NHAU
    const hits = [];
    for (let i = 0; i < flights.length; i++) for (let j = i + 1; j < flights.length; j++) {
      const a = flights[i], b = flights[j];
      if (!opposed(a, b)) continue;
      const key = a.id < b.id ? a.id + "_" + b.id : b.id + "_" + a.id;
      const d = a.np.distanceTo(b.np), pr = pairD.get(key);
      const crossed = !!(pr && pr.closing && d > pr.d && pr.d < PASS_D && pr.d0 - pr.d > RS);   // đã thật sự xáp lại ≥ 1 đv rồi mới rời
      pairD.set(key, { d, d0: pr ? pr.d0 : d, closing: !pr || d < pr.d - 1e-4 });
      if (crossed || segGap(a.prev, a.np, b.prev, b.np) < CLASH_HIT) hits.push([a, b]);
    }
    hits.forEach(([a, b]) => { if (flights.indexOf(a) >= 0 && flights.indexOf(b) >= 0) clash(a, b); });
    if (!flights.length) pairD.clear();
    // 4) chạm vỏ tàu địch ⇒ nổ NGAY tại chỗ chạm
    for (let i = flights.length - 1; i >= 0; i--) {
      const f = flights[i];
      if (f.passed || f.dodged || f.t < ROT_T + T1 + 0.2) continue;
      const at = hullContact(f);
      if (at) { dropFlight(f); hitShip(f.to, f.from, at); }
    }
    // 5) vẽ
    for (let i = flights.length - 1; i >= 0; i--) {
      const f = flights[i]; const m = f.m;
      const T = f.T || (f.anchor ? f.anchor : shipPos(rockets[f.to]));
      let pos = f.np;
      if (!f.passed && f.t >= f.dur) {
        f.passed = true;
        if (!f.dodged) {                                   // TRÚNG (lưới an toàn — thường đã nổ lúc chạm vỏ ở bước 4)
          dropFlight(f);
          hitShip(f.to, f.from, T);                          // 6d vết cháy · 7d: tàu CÙNG NẤC cũng trúng (Đợt 443)
          continue;
        }
        X.onEnd && X.onEnd(f.to, "miss", f.from);            // né được: lao HỤT xuống thêm một đoạn rồi nổ
        f.vel.copy(pos).sub(f.prev).divideScalar(Math.max(1e-4, dt));
        if (f.vel.length() < 10) f.vel.setLength(10);
      }
      if (f.passed && f.after > 0.8) { dropFlight(f); airburst(pos); continue; }
      const vel = pos.clone().sub(f.prev);
      if (f.t < ROT_T) m.g.quaternion.slerpQuaternions(f.qA, f.qB, smooth(f.t / ROT_T));                 // 454b: xoay lên trời
      else {
        if (!f.lit) { m.g.quaternion.copy(f.qB); ignite(f); }
        if (vel.lengthSq() > 1e-8) { const q = new THREE.Quaternion().setFromUnitVectors(new V3(1, 0, 0), vel.clone().normalize()); m.g.quaternion.slerp(q, 0.6); }
      }
      m.g.position.copy(pos);
      const dist = vel.length(), n = Math.min(20, Math.ceil(dist / 0.1));
      const tail = new V3(-1.25 * RS * MS, 0, 0).applyQuaternion(m.g.quaternion);
      for (let j = 0; j < n; j++) {
        const p = f.prev.clone().lerp(pos, (j + 1) / n).add(tail);
        fire.emit({ pos: p, vel: new V3(rand(-0.3, 0.3), rand(-0.3, 0.3), rand(-0.3, 0.3)), life: rand(0.15, 0.3), size: 0.36, sizeEnd: 0.06, color: new THREE.Color(4, 1.8, 0.6), colorEnd: new THREE.Color(1.4, 0.2, 0.05), drag: 1 });
        if (j % 2 === 0) smoke.emit({ pos: p.clone(), vel: new V3(rand(-0.2, 0.2), rand(0, 0.3), rand(-0.2, 0.2)), life: rand(1.2, 1.8), size: 0.26, sizeEnd: 1.2, color: new THREE.Color(0.8, 0.8, 0.84), alpha: 0.28, drag: 0.6 });
      }
      m.flame.scale.set(1, 0.85 + Math.random() * 0.3, 1);
      f.prev.copy(pos);
      const left = f.dur - f.t;
      if (!f.passed && !f.dodged) { f.beepT -= dt; if (f.beepT <= 0) alarm(f, false, left); }
    }
  }

  // ---------------------------------------------------------------- hiệu ứng NẠP: năng lượng đỏ hút vào tàu → bùng → "MISSILE +1"
  const ringGeo = new THREE.RingGeometry(0.9, 1.0, 96);
  const rings = [0, 1, 2, 3].map(() => { const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 0.5, 0.35), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); m.visible = false; scene.add(m); return { m, t: 9, r: null }; });
  function chargeFx(side) {
    const r = rockets[side], c = shipPos(r);
    for (let i = 0; i < 130; i++) {
      const d = new V3(rand(-1, 1), rand(-0.6, 1), rand(-1, 1)).normalize(), R = rand(2.6, 4.8), life = rand(0.34, 0.48);
      fire.emit({ pos: c.clone().addScaledVector(d, R), vel: d.clone().multiplyScalar(-R / life), life, size: rand(0.14, 0.26), sizeEnd: 0.06, color: peace ? new THREE.Color(0.5, 4.5, 0.7) : new THREE.Color(4.5, 0.55, 0.35), colorEnd: peace ? new THREE.Color(1, 3, 1.2) : new THREE.Color(3, 1.4, 0.6), drag: 0 });
    }
    sfx("mcharge", 1);
    later(0.46, () => {
      const p = shipPos(r);
      burst(p, { n: 140, speed: 11, color: peace ? new THREE.Color(0.8, 5, 1) : new THREE.Color(5, 0.9, 0.55), colorEnd: peace ? new THREE.Color(0.1, 1.5, 0.2) : new THREE.Color(1.5, 0.1, 0.05), size: 0.22, life: 0.6 });
      for (let k = 0; k < 2; k++) { const x = rings.find(z => z.t > 1.2); if (x) { x.t = -k * 0.08; x.r = r; x.m.visible = true; } }
      labelOn(r, "MISSILE +1", pal().label);
      shake(0.25);
      if (UI[side]) UI[side].flash = 1;
    });
  }
  function stepRings(dt) {
    rings.forEach(o => {
      if (o.t > 1.2) return;
      o.t += dt; if (o.t < 0) return;
      const k = o.t / 0.7;
      if (o.at) o.m.position.copy(o.at); else o.m.position.copy(shipPos(o.r));   // 441: vòng sóng của vụ ĐÂM NHAU đứng ở chỗ nổ
      o.m.quaternion.copy(X.camera.quaternion);
      o.m.scale.setScalar((0.5 + k * 5.5) * (o.big ? CLASH_ZONE / 5.5 : 1)); o.m.material.opacity = Math.max(0, 0.9 * (1 - k));
      if (o.t > 0.7) { o.m.visible = false; o.t = 9; o.at = null; o.big = 0; }
    });
  }
  // Đợt 454: lên nòng vào ô sẵn sàng còn TRỐNG (ô 0 = hông phía người xem trước). Hết ô trống ⇒ false (trang game giữ quả, thử lại sau).
  // fromIdx = ô dự phòng vừa trống (quả nhỏ bay từ đó sang).
  function loadFx(side, fromIdx) {
    const r = rockets[side]; if (!r.mis) return false;
    const S = SL[side], cap = capOf(A[side]);
    const j = [0, 1].find(i => i < cap && S[i].st === "empty");
    if (j == null) return false;
    Object.assign(S[j], { st: "shuttle", t: 0, k: 0, pair: false });
    r.mis.slots[j].rise = 0;
    if (UI[side]) UI[side].load = { t: 0, j, fy: slotY(clamp(fromIdx == null ? A[side].reserve - 1 : fromIdx, 0, MINI_N - 1)) };
    sfx("mload", 1);
    return true;
  }
  function clearAll() {
    gen++;
    for (let i = flights.length - 1; i >= 0; i--) { const f = flights[i]; const p = f.m.g.position.clone(); f.m.g.visible = false; f.m.flame.visible = f.m.flare.visible = false; airburst(p, 0.4); }
    flights.length = 0; pairD.clear();
    // Đợt 454: quả đã chạm bắn mà chưa rời bệ (chờ nối đuôi / đang lùi khỏi màn) — trang game đã trừ ⇒ bỏ luôn; tắt tiếng nạp
    SL.forEach((arr, side) => { lastF[side] = null; arr.forEach(S => { if (S.st === "queued" || S.st === "firing") S.st = "empty"; if (S.snd) { S.snd.stop(); S.snd = null; } }); });
  }

  // ⭐ MẪU 7d (thầy): bỏ vầng sáng mũi tàu của 7c (quá chói) — còn 1 câu là thắng ⇒ r.nearWin, view cho lửa đuôi dài 1,5 lần + xanh dương.

  // ⭐ MẪU 7d (thầy): 2 tàu cùng nấc ⇒ tên lửa trúng tàu này thì tàu kia BỊ Y HỆT (lùi, khựng, cháy).
  // ⭐ Đợt 443 (thầy 02/10/2026): CHỈ khi cùng nấc — chênh 1 nấc (hơn hay kém) là KHÔNG ảnh hưởng (7d cũ: cách ≤ 1 nấc).
  // Xét theo nấc THẬT (r.p, số nguyên do view.move đặt) NGAY LÚC NỔ: tàu kia kịp BOOST / trả lời đúng / sai bị lùi ⇒ lệch nấc ⇒ thoát.
  const inSplash = side => Math.abs((rockets[side].p || 0) - (rockets[1 - side].p || 0)) < 0.5;
  // ⭐ Đợt 454 (thầy 03/10/2026): 2 tàu CÙNG NẤC ⇒ cả 2 cùng bị nhưng mỗi tàu chỉ 50 % thiệt hại (tag "half").
  let lastHit = null;                                         // bàn thử: chỗ nổ so với tâm tàu bị trúng
  function hitShip(to, from, pos, sc = HIT_SC) {
    lastHit = { to, at: +G.t.toFixed(2), d: +pos.distanceTo(shipPos(rockets[to])).toFixed(2) };
    const other = 1 - to, alsoOther = inSplash(other);        // xét TRƯỚC khi báo trúng (trang game lùi nấc ngay trong onEnd)
    explosion(pos.clone(), sc); sfx("hit2", 1); sfx("boom", 0.7);
    stall(rockets[to]); scorch(rockets[to]);
    if (alsoOther) labelOn(rockets[to], "HIT 50%", "#ff8a6a");
    X.onEnd && X.onEnd(to, "hit", from, alsoOther ? "half" : undefined);
    if (alsoOther) {
      const po = shipPos(rockets[other]);
      explosion(po.clone(), sc * 0.85); sfx("hit3", 0.9);
      stall(rockets[other]); scorch(rockets[other]);
      labelOn(rockets[other], "HIT 50%", "#ff8a6a");
      X.onEnd && X.onEnd(other, "hit", from, "half");
    }
  }
  // khung đỏ + BOOST nhấp nháy cả ở tàu CÙNG NẤC khi tên lửa đang bay vào tàu kia (để kịp chạy)
  function threatFor(side) { const m = incoming(side); return inSplash(side) ? Math.min(m, incoming(1 - side)) : m; }
  function tick(dt) {
    for (let i = pending.length - 1; i >= 0; i--) { const p = pending[i]; p.t -= dt; if (p.t <= 0) { pending.splice(i, 1); p.fn(); } }
    [0, 1].forEach(side => tickSlots(side, dt));      // Đợt 454: ô sẵn sàng (nạp / chờ nối đuôi) — trước poseMount
    rockets.forEach(r => { poseMount(r, dt); burnTick(r, dt); });
    stepFlights(dt); stepRings(dt);
    { const gl = pal().glow, pu = 0.75 + 0.25 * Math.sin(G.t * 6); mGlow.color.setRGB(gl[0] * (gl[0] > 1 ? pu : 1), gl[1] * (gl[1] > 1 ? pu : 1), gl[2]); }   // 441: PEACE = xanh lá
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
      setPeace, get peace() { return peace; },          // ⭐ Đợt 441
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
      get flights() { return flights.map(f => ({ id: f.id, from: f.from, to: f.to, t: +f.t.toFixed(2), left: +(f.dur - f.t).toFixed(2), dodged: f.dodged, passed: f.passed,
        // Đợt 454 bàn thử: so với tàu bắn — dọc hướng bay (+ = phía trước), độ cao, khoảng cách
        fwd: +f.m.g.position.clone().sub(shipPos(rockets[f.from])).dot(TRAVEL).toFixed(2), up: +f.m.g.position.clone().sub(shipPos(rockets[f.from])).dot(UP).toFixed(2),
        dist: +f.m.g.position.distanceTo(shipPos(rockets[f.from])).toFixed(2), tdist: +f.m.g.position.distanceTo(shipPos(rockets[f.to])).toFixed(2) })); },
      get lastHit() { return lastHit; },
      get steps() { return rockets.map(r => r.p || 0); },
      // Đợt 455 bàn thử: khoảng hở nhỏ nhất (đv mô hình) giữa thân quả trên bệ (kể cả vây ~0,25) và vỏ tàu — dò 21 điểm dọc trục quả
      mountGap(side, j) {
        const r = rockets[side], m = r.mis.slots[j]; r.ship.updateWorldMatrix(true, true); let best = Infinity; const p = new V3();
        for (let i = 0; i <= 20; i++) { p.set(lerp(-1.15, 1.17, i / 20), 0, 0); m.ms.g.localToWorld(p); r.ship.worldToLocal(p);
          const rad = p.x < -2.05 || p.x > 2.2 ? 0 : hullRad(p.x); best = Math.min(best, Math.hypot(p.y, p.z) - rad - (M_R + 0.25 * MS) / MS * MS); }
        return { gap: +best.toFixed(3), ext: +m.ext.toFixed(2), tilt: +m.tilt.toFixed(2) };
      },      // Đợt 454 bàn thử: nấc hiện tại 2 tàu
      get arsenal() { return A.map(a => ({ ...a })); },
      get slots() { return SL.map(arr => arr.map(S => ({ st: S.st, k: +S.k.toFixed(2) }))); },   // Đợt 454: bàn thử
      readyCount: side => SL[side].filter(S => S.st === "ready").length,
      gapShip: GAP_SHIP,
      get scorches() { return rockets.map(r => r.burn ? { spots: r.burn.spots.length, burning: +r.burn.t.toFixed(2) } : null); },   // bàn thử 6d
      scorch: side => scorch(rockets[side]),                                                                                 // bàn thử 6d
      windowSecs: MC.window
    }
  };
}
