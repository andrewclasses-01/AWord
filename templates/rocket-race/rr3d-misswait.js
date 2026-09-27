// ⭐ Đợt 409 (thầy 27/9/2026): gốc chép từ kho myGame `rocket-race/game6d/rr3d-misswait.js` (MẪU 6d thầy duyệt).
// ⭐ Đợt 413 (thầy 27/9/2026) — VẼ LẠI: "Thanh Miss wait để xuống mép dưới màn hình và chỉ có 1 thanh cho 1 đội thôi. Thanh
// này ở chính giữa, thanh của đội nào thì vạch rút cạn về bên đó, không cần ô đếm thời gian".
//   ⇒ MỘT viên thuốc kính tối sát MÉP DƯỚI cảnh, chính giữa; dải màu đội còn được trả lời, GỐC neo ở đầu phía đội đó và
//     co dần về phía ấy; ≤ 25 % còn lại ⇒ đỏ nhấp nháy. Bỏ huy hiệu số giây + mũi tên.
// Trên AWord đồng hồ MISS WAIT là của trọng tài core/fight.js — rocket-race.js (rr3dMissWait) đọc thanh DOM của trọng tài
// mỗi khung rồi gọi view.setMissWait({ side, frac, secs } | null). Mô-đun CHỈ VẼ.
// =============================================================

export function createMissWait(X) {
  const { THREE, ui, screenToLocal, screenSize, frameGeo, radialTex, TEAMS, G, UID } = X;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const RED = new THREE.Color(1.9, 0.12, 0.1);
  let W = null;                       // bộ phận đang dựng (dựng lại mỗi lần buildUI)
  let info = null, vis = 0, pop = 0, lastSide = 0, fillK = 1;

  function capsuleGeo(x0, x1, h) {
    const L0 = Math.min(x0, x1), L1 = Math.max(x0, x1), r = h / 2, w = Math.max(L1 - L0, 1e-4);
    const sh = new THREE.Shape();
    if (w <= h) { sh.absellipse((L0 + L1) / 2, 0, w / 2, r, 0, Math.PI * 2, false, 0); return new THREE.ShapeGeometry(sh, 16); }
    sh.moveTo(L0 + r, -r); sh.lineTo(L1 - r, -r); sh.absarc(L1 - r, 0, r, -Math.PI / 2, Math.PI / 2, false);
    sh.lineTo(L0 + r, r); sh.absarc(L0 + r, 0, r, Math.PI / 2, Math.PI * 1.5, false);
    return new THREE.ShapeGeometry(sh, 16);
  }
  const basic = (color, op) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: op, depthWrite: false });

  // U: đổi cm thật → phần màn (như buildUI). Tham số thứ 2 (mép dưới thanh câu hỏi) không dùng nữa — thanh nằm ở mép DƯỚI.
  function build(U) {
    const wF = U.cw(70), hF = U.ch(2.6), yF = 1 - U.ch(1.6) - hF / 2;
    const s = screenSize(wF, hF, UID), p = screenToLocal(0.5, yF, UID);
    const g = new THREE.Group(); g.position.copy(p); ui.add(g);
    const Wt = s.w, Ht = s.h, bh = Ht * 0.5;
    const xEnd = Wt / 2 - Ht * 0.5;                          // dải chạy từ −xEnd → +xEnd
    const mats = [];
    const M = (m, base) => { mats.push({ m, base }); return m; };
    const plate = new THREE.Mesh(capsuleGeo(-Wt / 2, Wt / 2, Ht), M(basic(new THREE.Color("#060b18"), 0.78), 0.78));
    const rimMat = M(basic(new THREE.Color(1, 1, 1), 0.9), 0.9);
    const rim = new THREE.Mesh(frameGeo(Wt + 0.03, Ht + 0.03, Ht / 2 + 0.015, Math.min(Wt, Ht) * 0.06), rimMat);
    rim.position.z = 0.01;
    const groove = new THREE.Mesh(capsuleGeo(-xEnd, xEnd, bh), M(basic(new THREE.Color("#0b1320"), 0.9), 0.9)); groove.position.z = 0.02;
    const fillMat = M(basic(new THREE.Color(1, 1, 1), 1), 1);
    const fill = new THREE.Mesh(capsuleGeo(-xEnd, -xEnd + 1e-4, bh * 0.74), fillMat); fill.position.z = 0.03;
    const sheenMat = M(basic(new THREE.Color(1.6, 1.6, 1.6), 0.35), 0.35);
    const sheen = new THREE.Mesh(new THREE.PlaneGeometry(1, bh * 0.12), sheenMat); sheen.position.set(0, bh * 0.16, 0.035);
    const glowMat = new THREE.SpriteMaterial({ map: radialTex([[0, "rgba(255,255,255,1)"], [0.35, "rgba(255,255,255,0.35)"], [1, "rgba(0,0,0,0)"]], 128),
      blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 });
    const glow = new THREE.Sprite(glowMat); glow.scale.set(Wt * 1.15, Ht * 4, 1); glow.position.z = 0.005;
    g.add(glow, plate, rim, groove, fill, sheen);
    g.visible = false;
    W = { g, Wt, Ht, bh, xEnd, fill, sheen, fillMat, rimMat, glowMat, mats, fillW: -1, fillSide: -1 };
  }

  function tick(dt) {
    if (!W) return;
    const on = !!info && G.phase === "play";
    if (on && vis === 0) pop = 0;
    vis = clamp(vis + (on ? dt / 0.18 : -dt / 0.3), 0, 1);
    W.g.visible = vis > 0;
    if (!W.g.visible) return;
    if (on) pop = Math.min(1, pop + dt / 0.35);
    const I = info || { side: lastSide, frac: fillK, secs: 0 };
    const frac = clamp(I.frac, 0, 1), urgent = frac <= 0.25 && I.secs !== Infinity;
    const c1 = 1.7, e = 1 + (c1 + 1) * Math.pow(pop - 1, 3) + c1 * Math.pow(pop - 1, 2);
    W.g.scale.set(1, Math.max(0.01, e), 1);
    const tc = (TEAMS[I.side] || TEAMS[0]).color.clone();
    const pul = 0.5 + 0.5 * Math.sin(G.t * (urgent ? 14 : 4));
    W.fillMat.color.copy(urgent ? RED.clone().multiplyScalar(0.8 + 0.5 * pul) : tc.clone().multiplyScalar(1.25));
    W.rimMat.color.copy(urgent ? RED.clone().multiplyScalar(0.7 + 0.5 * pul) : tc.clone().multiplyScalar(1.8));
    W.glowMat.color.copy(urgent ? RED : tc); W.glowMat.opacity = vis * (urgent ? 0.2 + 0.3 * pul : 0.1);
    fillK += (frac - fillK) * Math.min(1, dt * 12);
    if (Math.abs(frac - fillK) > 0.3 || I.side !== lastSide) fillK = frac;   // thanh mới / đổi đội ⇒ khỏi trượt
    lastSide = I.side;
    // GỐC neo ở đầu phía đội (đội 0 = trái) ⇒ co lại là rút cạn về bên đó
    const L = 2 * W.xEnd * fillK, sg = I.side === 0 ? -1 : 1, x0 = sg * W.xEnd, x1 = x0 - sg * L;
    if (Math.abs(L - W.fillW) > W.xEnd * 0.004 || W.fillSide !== I.side) {
      W.fillW = L; W.fillSide = I.side;
      W.fill.visible = L > W.bh * 0.3;
      if (W.fill.visible) { W.fill.geometry.dispose(); W.fill.geometry = capsuleGeo(x0, x1, W.bh * 0.74); }
      W.sheen.visible = L > W.bh; W.sheen.scale.x = Math.max(1e-4, L - W.bh * 0.8); W.sheen.position.x = (x0 + x1) / 2;
    }
    W.mats.forEach(o => { o.m.opacity = o.base * vis; });
  }

  return {
    build,
    tick,
    set(v) { info = v && Number.isFinite(v.frac) ? { side: v.side ? 1 : 0, frac: v.frac, secs: v.secs ?? Infinity } : null; },
    get info() { return info; }
  };
}
