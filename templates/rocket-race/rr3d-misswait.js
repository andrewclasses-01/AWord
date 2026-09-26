// ⭐ Đợt 409 (thầy 27/9/2026): chép NGUYÊN từ kho myGame `rocket-race/game6d/rr3d-misswait.js` (MẪU 6d thầy duyệt).
// Trên AWord đồng hồ MISS WAIT là của trọng tài core/fight.js — rocket-race.js (rr3dMissWait) đọc thanh DOM của trọng tài mỗi khung rồi gọi view.setMissWait.
// =============================================================
// ROCKET RACE 3D — THANH MISS WAIT GIỮA MÀN (MẪU 6d, thầy 27/9/2026)
// Thầy: "Thanh miss wait (khi đội 1 sai thì đội 2 còn từng đó thời gian để làm câu đó) được đưa ra chính giữa
// màn hình và được thiết kế lại cho đúng với phong cách của game".
// ⇒ vẽ bằng 3D trong lớp UI (cùng kính tối + viền sáng như thanh câu hỏi), ngay DƯỚI thanh câu hỏi, chính giữa:
//     ‹‹‹ [ ████████ ( 7 ) ████████ ]        — số giây trong huy hiệu tròn; 2 nửa thanh co dần VÀO huy hiệu;
//   màu = màu đội CÒN ĐƯỢC TRẢ LỜI, ≤ 25 % còn lại ⇒ ĐỎ nhấp nháy; mũi tên ‹‹‹ chạy về phía cột của đội đó.
// Mô-đun CHỈ VẼ: trang game (bản thử) / rocket-race.js (AWord, đọc thanh của trọng tài core/fight.js) gọi
// view.setMissWait({ side, frac, secs }) mỗi khung, hoặc null để tắt.
// =============================================================

export function createMissWait(X) {
  const { THREE, ui, screenToLocal, screenSize, frameGeo, canvasTex, radialTex, FONT_UI, TEAMS, G, UID } = X;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const RED = new THREE.Color(1.9, 0.12, 0.1);
  let W = null;                       // bộ phận đang dựng (dựng lại mỗi lần buildUI)
  let info = null, vis = 0, pop = 0, lastSecs = null, lastSide = -1, fillK = 1;

  function capsuleGeo(x0, x1, h) {
    const L0 = Math.min(x0, x1), L1 = Math.max(x0, x1), r = h / 2, w = Math.max(L1 - L0, 1e-4);
    const sh = new THREE.Shape();
    if (w <= h) { sh.absellipse((L0 + L1) / 2, 0, w / 2, r, 0, Math.PI * 2, false, 0); return new THREE.ShapeGeometry(sh, 16); }
    sh.moveTo(L0 + r, -r); sh.lineTo(L1 - r, -r); sh.absarc(L1 - r, 0, r, -Math.PI / 2, Math.PI / 2, false);
    sh.lineTo(L0 + r, r); sh.absarc(L0 + r, 0, r, Math.PI / 2, Math.PI * 1.5, false);
    return new THREE.ShapeGeometry(sh, 16);
  }
  const basic = (color, op) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: op, depthWrite: false });

  // U: đổi cm thật → phần màn (như buildUI); yTop: mép dưới thanh câu hỏi (phần màn)
  function build(U, yTop) {
    const wF = U.cw(76), hF = U.ch(8), yF = yTop + U.ch(1.2) + hF / 2;
    const s = screenSize(wF, hF, UID), p = screenToLocal(0.5, yF, UID);
    const g = new THREE.Group(); g.position.copy(p); ui.add(g);
    const Wt = s.w, Ht = s.h, R = Ht * 0.5, bh = Ht * 0.34, plateH = Ht * 0.62;
    const chev = Ht * 0.9;                                   // chỗ cho mũi tên ‹‹‹ ở 2 đầu
    const xEnd = Wt / 2 - chev, xIn = R * 1.12;              // nửa thanh chạy từ xIn → xEnd
    const mats = [];
    const M = (m, base) => { mats.push({ m, base }); return m; };
    // tấm kính tối dạng viên thuốc + viền sáng màu đội
    const plate = new THREE.Mesh(capsuleGeo(-xEnd - plateH * 0.35, xEnd + plateH * 0.35, plateH), M(basic(new THREE.Color("#060b18"), 0.78), 0.78));
    const rimMat = M(basic(new THREE.Color(1, 1, 1), 0.95), 0.95);
    const rim = new THREE.Mesh(frameGeo(xEnd * 2 + plateH * 0.7 + 0.03, plateH + 0.03, plateH / 2 + 0.015, Math.min(Wt, Ht) * 0.03), rimMat);
    rim.position.z = 0.01;
    // rãnh 2 bên + dải màu
    const groove = [-1, 1].map(sg => { const m = new THREE.Mesh(capsuleGeo(sg * xIn, sg * xEnd, bh), M(basic(new THREE.Color("#0b1320"), 0.9), 0.9)); m.position.z = 0.02; return m; });
    const fillMat = M(basic(new THREE.Color(1, 1, 1), 1), 1);
    const fills = [-1, 1].map(sg => { const m = new THREE.Mesh(capsuleGeo(sg * xIn, sg * (xIn + 1e-4), bh * 0.74), fillMat); m.position.z = 0.03; return m; });
    // vệt sáng trắng mảnh trên dải (cho khối "năng lượng")
    const sheenMat = M(basic(new THREE.Color(1.6, 1.6, 1.6), 0.35), 0.35);
    const sheens = [-1, 1].map(sg => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, bh * 0.12), sheenMat); m.position.set(0, bh * 0.16, 0.035); return m; });
    // huy hiệu tròn giữa: nền tối + vòng màu đội + số giây
    const disc = new THREE.Mesh(new THREE.CircleGeometry(R * 0.96, 48), M(basic(new THREE.Color("#060b18"), 0.92), 0.92)); disc.position.z = 0.04;
    const ringMat = M(basic(new THREE.Color(1, 1, 1), 1), 1);
    const ring = new THREE.Mesh(new THREE.RingGeometry(R * 0.86, R * 1.0, 64), ringMat); ring.position.z = 0.045;
    const cv = document.createElement("canvas"); cv.width = cv.height = 256;
    const tex = canvasTex(cv);
    const numMat = M(new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 1, depthWrite: false }), 1);
    const num = new THREE.Mesh(new THREE.PlaneGeometry(R * 1.7, R * 1.7), numMat); num.position.z = 0.05;
    // quầng sáng sau huy hiệu (đỏ nhấp nháy khi sắp hết)
    const glowMat = new THREE.SpriteMaterial({ map: radialTex([[0, "rgba(255,255,255,1)"], [0.35, "rgba(255,255,255,0.35)"], [1, "rgba(0,0,0,0)"]], 128),
      blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 });
    const glow = new THREE.Sprite(glowMat); glow.scale.set(R * 4.2, R * 4.2, 1); glow.position.z = 0.005;
    // mũi tên ‹‹‹ (3 cái) — hiện ở phía đội còn trả lời, chạy dần ra ngoài
    const triGeo = (() => { const sh = new THREE.Shape(); const a = chev * 0.2, b = Ht * 0.2, t = chev * 0.09;
      sh.moveTo(a, b); sh.lineTo(-a + t, 0); sh.lineTo(a, -b); sh.lineTo(a - t * 1.1, -b); sh.lineTo(-a + t * -0.1, 0); sh.lineTo(a - t * 1.1, b); sh.closePath();
      return new THREE.ShapeGeometry(sh); })();
    const chevs = [0, 1, 2].map(i => { const m = new THREE.Mesh(triGeo, basic(new THREE.Color(1, 1, 1), 0)); m.position.z = 0.03; g.add(m); return m; });
    g.add(glow, plate, rim, ...groove, ...fills, ...sheens, disc, ring, num);
    g.visible = false;
    W = { g, Wt, Ht, R, bh, xIn, xEnd, chev, fills, sheens, fillMat, rimMat, ringMat, badge: [disc, ring, num], glow, glowMat, chevs, cv, tex, mats, fillW: -1 };
    lastSecs = null; lastSide = -1;
  }

  function drawNum(secs, urgent) {
    const g = W.cv.getContext("2d"), n = W.cv.width;
    g.clearRect(0, 0, n, n);
    const txt = secs === Infinity ? "∞" : String(Math.max(0, secs));
    const px = txt.length > 1 ? 132 : 158;
    g.font = `900 ${px}px ${FONT_UI}`; g.textAlign = "center"; g.textBaseline = "middle";
    g.shadowColor = urgent ? "rgba(255,40,30,.9)" : "rgba(0,0,0,.7)"; g.shadowBlur = 18;
    g.fillStyle = urgent ? "#ffd6d0" : "#ffffff";
    g.fillText(txt, n / 2, n / 2 + px * 0.05);
    W.tex.needsUpdate = true;
  }

  function tick(dt) {
    if (!W) return;
    const on = !!info && G.phase === "play";
    if (on && vis === 0) pop = 0;
    vis = clamp(vis + (on ? dt / 0.18 : -dt / 0.3), 0, 1);
    W.g.visible = vis > 0;
    if (!W.g.visible) return;
    if (on) pop = Math.min(1, pop + dt / 0.35);
    const I = info || { side: lastSide < 0 ? 0 : lastSide, frac: fillK, secs: lastSecs ?? 0 };
    const frac = clamp(I.frac, 0, 1), urgent = frac <= 0.25 && I.secs !== Infinity;
    // bật lên kiểu "ease out back" theo chiều dọc
    const c1 = 1.7, e = 1 + (c1 + 1) * Math.pow(pop - 1, 3) + c1 * Math.pow(pop - 1, 2);
    W.g.scale.set(1, Math.max(0.01, e), 1);
    const team = TEAMS[I.side] || TEAMS[0];
    const tc = team.color.clone();
    const pul = 0.5 + 0.5 * Math.sin(G.t * (urgent ? 14 : 4));
    const col = urgent ? RED.clone().multiplyScalar(0.8 + 0.5 * pul) : tc.clone().multiplyScalar(1.25);
    W.fillMat.color.copy(col);
    W.rimMat.color.copy(urgent ? RED.clone().multiplyScalar(0.7 + 0.5 * pul) : tc.clone().multiplyScalar(1.8));
    W.ringMat.color.copy(W.rimMat.color);
    W.glowMat.color.copy(urgent ? RED : tc); W.glowMat.opacity = vis * (urgent ? 0.25 + 0.35 * pul : 0.12);
    // 2 nửa thanh co vào giữa (vẽ lại hình viên thuốc khi dài đổi)
    fillK += (frac - fillK) * Math.min(1, dt * 12);
    if (Math.abs(frac - fillK) > 0.3) fillK = frac;          // nhảy (thanh mới) ⇒ khỏi trượt
    const L = (W.xEnd - W.xIn) * fillK;
    if (Math.abs(L - W.fillW) > (W.xEnd - W.xIn) * 0.003) {
      W.fillW = L;
      W.fills.forEach((m, i) => {
        const sg = i ? 1 : -1; m.visible = L > W.bh * 0.3;
        if (m.visible) { m.geometry.dispose(); m.geometry = capsuleGeo(sg * W.xIn, sg * (W.xIn + L), W.bh * 0.74); }
      });
      W.sheens.forEach((m, i) => { const sg = i ? 1 : -1; m.visible = L > W.bh; m.scale.x = Math.max(1e-4, L - W.bh * 0.8); m.position.x = sg * (W.xIn + L / 2); });
    }
    // mũi tên về phía cột của đội còn trả lời
    const sg = I.side === 0 ? -1 : 1;
    W.chevs.forEach((m, i) => {
      m.position.x = sg * (W.xEnd + W.chev * (0.18 + i * 0.3));
      m.rotation.z = sg < 0 ? 0 : Math.PI;
      const ph = ((G.t * (urgent ? 3 : 1.6)) - i * 0.28) % 1;
      m.material.color.copy(urgent ? RED : tc.clone().multiplyScalar(1.6));
      m.material.opacity = vis * (0.2 + 0.8 * Math.max(0, 1 - Math.abs(ph - 0.5) * 2.4));
    });
    W.mats.forEach(o => { o.m.opacity = o.base * vis; });
    const secs = I.secs === Infinity ? Infinity : Math.max(0, Math.ceil(I.secs - 1e-3));
    if (secs !== lastSecs || urgent !== W.urgent || I.side !== lastSide) { drawNum(secs, urgent); lastSecs = secs; W.urgent = urgent; lastSide = I.side; }
    const beat = urgent ? 1 + 0.08 * pul : 1;
    W.badge.forEach(o => o.scale.setScalar(beat));
  }

  return {
    build,
    tick,
    set(v) { info = v && Number.isFinite(v.frac) ? { side: v.side ? 1 : 0, frac: v.frac, secs: v.secs ?? Infinity } : null; },
    get info() { return info; }
  };
}
