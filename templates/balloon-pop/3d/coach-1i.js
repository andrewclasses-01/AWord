// TOA KHÁCH + TOA THAN — bản 1i (29/9/2026): hoảng loạn LÂU hơn (2–2,8 s mỗi người, run tay run người); thùng rơi liên tiếp
// (≥ 2 lần trong 5 s) ⇒ toa LOẠN: 1–2 người bật dậy chạy lung tung dọc lối đi (giơ tay, ngoái lại), hết loạn thì về chỗ ngồi.
// Bản 1g: cổ nối liền thân–đầu (trước bị hở), rèm là kính mờ thật
// (vật liệu truyền sáng nhám) ⇒ bóng người nhoè mềm như bóng thật sau rèm.
// Bản 1f:
// • Người luôn ngồi THÀNH CẶP đối diện nhau và nói chuyện thay lượt (người nói khoa tay, người nghe gật gù).
// • Thêm phụ nữ (thân eo thon, tay áo phồng, tóc dài/búi, mũ rộng vành cắm lông) và trẻ em (bé trai đội mũ lưỡi trai,
//   bé gái buộc tóc 2 bên + nơ). Cặp ngẫu nhiên: ông–bà, mẹ–con, hai quý bà, hai ông…
// • Thùng rơi trúng toa: MỖI NGƯỜI hoảng một kiểu khác nhau (giơ 2 tay, ôm đầu cúi rạp, giữ mũ, ôm má hét,
//   ngả người chỉ lên trần, chồm sang ôm người đối diện), phản ứng lệch nhau vài phần giây, run tay.
// Lịch sử 1e: người chi tiết (thân, cổ, đầu có mũi/cằm/tai, mũ, tay 3 khớp, bàn tay 4 ngón + ngón cái). Toa than.
import * as THREE from "../../rocket-race/vendor/three/three.module.min.js";

export const COACH_LEN = 7.2, COAL_LEN = 6.6;
// rèm kính mờ: nhìn xuyên nhưng nhoè (độ nhám cao ⇒ ảnh phía sau bị làm mờ)
const CURTAIN = new THREE.MeshPhysicalMaterial({ color: 0xf3e2bf, transmission: 1, roughness: 0.48, thickness: 0.04, ior: 1.25, metalness: 0, emissive: 0x2a1c0c, emissiveIntensity: 0.4 });

export function makeCoach(paintHex, meshAdder, M) {
  const g = new THREE.Group(), add = meshAdder(g);
  const L = COACH_LEN, H = 2.5, D = 1.95, y0 = 1.1;
  const paint = new THREE.MeshPhysicalMaterial({ color: paintHex, metalness: 0.25, roughness: 0.4, clearcoat: 0.5 });
  add(new THREE.BoxGeometry(L, 0.26, 1.5), M.iron, 0, 0.95);
  add(new THREE.BoxGeometry(L, H, 0.08), paint, 0, y0 + H / 2, -D / 2 + 0.04);
  add(new THREE.BoxGeometry(0.08, H, D), paint, -L / 2 + 0.04, y0 + H / 2, 0);
  add(new THREE.BoxGeometry(0.08, H, D), paint, L / 2 - 0.04, y0 + H / 2, 0);
  add(new THREE.BoxGeometry(L, 0.08, D), M.woodDark, 0, y0 + 0.04, 0);
  const roof = add(new THREE.CylinderGeometry(1.25, 1.25, L + 0.3, 24, 1, false, -0.9, 1.8), M.iron, 0, y0 + H - 0.72, 0);
  roof.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(L - 0.2, H - 0.2), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.95, 0.66, 0.36) }));
  glow.position.set(0, y0 + H / 2, -D / 2 + 0.1); g.add(glow);
  const front = new THREE.Mesh(new THREE.PlaneGeometry(L, H), new THREE.MeshStandardMaterial({ map: coachSideTexture(paintHex), alphaTest: 0.5, roughness: 0.45, metalness: 0.15 }));
  front.position.set(0, y0 + H / 2, D / 2); front.castShadow = true; g.add(front);
  const curtain = new THREE.Mesh(new THREE.PlaneGeometry(L - 0.3, H * 0.42), CURTAIN);
  curtain.position.set(0, y0 + H * 0.62, D / 2 - 0.06); curtain.renderOrder = 3; g.add(curtain);
  for (const bx of [-L / 2 + 1.3, L / 2 - 1.3]) add(new THREE.BoxGeometry(1.7, 0.22, 1.5), M.iron, bx, 0.62);
  return { group: g, y0, roof: y0 + H + 0.53, bogies: [-L / 2 + 1.3, L / 2 - 1.3] };
}

// ---------------------------------------------------------------- người ngồi (đơn vị mét, nhìn nghiêng theo trục x)
const SIL = new THREE.MeshBasicMaterial({ color: 0x160f0a });
function limb(r0, r1, len) { const g = new THREE.CylinderGeometry(r1, r0, len, 10); g.translate(0, -len / 2, 0); return g; }
const lathe = (pts, sz) => { const g = new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), 20); g.scale(1, 1, sz); return g; };
const ell = (r, sx, sy, sz, ws = 14, hs = 10) => { const g = new THREE.SphereGeometry(r, ws, hs); g.scale(sx, sy, sz); return g; };
const GEO = {
  torso: lathe([[0.001, 0], [0.13, 0], [0.145, 0.08], [0.14, 0.2], [0.17, 0.36], [0.19, 0.48], [0.18, 0.56], [0.1, 0.61], [0.05, 0.64], [0.001, 0.65]], 0.62),
  torsoF: lathe([[0.001, 0], [0.14, 0], [0.15, 0.07], [0.115, 0.22], [0.14, 0.36], [0.15, 0.45], [0.13, 0.54], [0.08, 0.6], [0.042, 0.63], [0.001, 0.64]], 0.6),
  bust: ell(0.075, 1, 0.8, 1.6),
  lap: ell(0.16, 1.9, 0.55, 1.35),
  neck: limb(0.058, 0.047, 0.26),
  neckF: limb(0.046, 0.037, 0.26),
  skull: ell(0.105, 1, 1.12, 0.92, 20, 16),
  jaw: ell(0.075, 1.05, 0.8, 0.85, 16, 12),
  nose: new THREE.ConeGeometry(0.022, 0.05, 8),
  ear: ell(0.025, 0.6, 1.2, 0.4, 8, 6),
  brim: new THREE.CylinderGeometry(0.21, 0.21, 0.028, 24),
  crown: new THREE.CylinderGeometry(0.085, 0.1, 0.13, 18),
  bowler: new THREE.SphereGeometry(0.11, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2),
  bun: new THREE.SphereGeometry(0.055, 12, 10),
  hairBack: ell(0.1, 0.75, 1.55, 0.95),
  wideBrim: new THREE.CylinderGeometry(0.27, 0.27, 0.02, 28),
  lowCrown: new THREE.CylinderGeometry(0.1, 0.11, 0.08, 18),
  plume: ell(0.03, 1, 4.2, 0.5, 8, 8),
  cap: new THREE.SphereGeometry(0.108, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2),
  visor: ell(0.07, 1.4, 0.12, 1.2, 12, 6),
  tail: ell(0.045, 0.8, 1.8, 0.8, 10, 8),
  bow: ell(0.035, 1.6, 0.8, 0.5, 8, 6),
  puff: ell(0.075, 1.1, 1.0, 1.0, 12, 10),
  upper: limb(0.048, 0.04, 0.27),
  fore: limb(0.04, 0.032, 0.24),
  palm: (() => { const g = new THREE.BoxGeometry(0.08, 0.085, 0.028); g.translate(0, -0.042, 0); return g; })(),
  seg1: limb(0.0095, 0.0085, 0.038),
  seg2: limb(0.0085, 0.0072, 0.03),
  thumb1: limb(0.011, 0.0095, 0.035),
  thumb2: limb(0.0095, 0.008, 0.03),
  thigh: limb(0.075, 0.06, 0.4),
};
function hand(parent) {
  const h = new THREE.Group(); parent.add(h);
  h.add(new THREE.Mesh(GEO.palm, SIL));
  const fingers = [];
  const len = [0.95, 1.05, 1.0, 0.82];
  [-0.03, -0.01, 0.01, 0.03].forEach((x, i) => {
    const k1 = new THREE.Group(); k1.position.set(x, -0.085, 0); h.add(k1);
    const s1 = new THREE.Mesh(GEO.seg1, SIL); s1.scale.y = len[i]; k1.add(s1);
    const k2 = new THREE.Group(); k2.position.y = -0.038 * len[i]; k1.add(k2);
    const s2 = new THREE.Mesh(GEO.seg2, SIL); s2.scale.y = len[i]; k2.add(s2);
    fingers.push({ k1, k2 });
  });
  const t1 = new THREE.Group(); t1.position.set(0.04, -0.02, 0.012); t1.rotation.z = 0.7; h.add(t1);
  t1.add(new THREE.Mesh(GEO.thumb1, SIL));
  const t2 = new THREE.Group(); t2.position.y = -0.035; t1.add(t2); t2.add(new THREE.Mesh(GEO.thumb2, SIL));
  return { h, fingers, t1, t2 };
}
// gắn bộ phận vào khung và TRẢ VỀ bộ phận (Object3D.add trả về khung cha — dùng thẳng .position sẽ dời cả khung)
function part(parent, geo) { const m = new THREE.Mesh(geo, SIL); parent.add(m); return m; }
const FEMALE = new Set(["lady", "ladyHat", "girl"]), CHILD = new Set(["child", "girl"]);
function person(face, kind) {
  const female = FEMALE.has(kind), child = CHILD.has(kind);
  const p = new THREE.Group();
  p.add(new THREE.Mesh(female && !child ? GEO.torsoF : GEO.torso, SIL));
  if (female && !child) { part(p, GEO.bust).position.set(face * 0.085, 0.43, 0); part(p, GEO.lap).position.set(face * 0.2, 0.05, 0); }
  const thighs = [];
  for (const z of [-0.08, 0.08]) { const t = part(p, GEO.thigh); t.position.set(0, 0.02, z); t.rotation.z = face * Math.PI / 2; thighs.push(t); }
  const nk = part(p, female && !child ? GEO.neckF : GEO.neck); nk.position.y = 0.6; nk.rotation.z = Math.PI;   // cổ từ trong vai (0,6) lên tới cằm (0,86)
  const head = new THREE.Group(); head.position.y = 0.82; p.add(head);
  part(head, GEO.skull).position.set(-face * 0.01, 0.07, 0);
  const jaw = part(head, GEO.jaw); jaw.position.set(face * 0.025, 0.0, 0); if (female || child) jaw.scale.setScalar(0.88);
  const nose = part(head, GEO.nose); nose.rotation.z = -face * Math.PI / 2; nose.position.set(face * 0.11, 0.06, 0); if (child) nose.scale.setScalar(0.7);
  for (const z of [-0.095, 0.095]) part(head, GEO.ear).position.set(-face * 0.01, 0.06, z);
  if (kind === "cowboy") {
    const brim = part(head, GEO.brim); brim.position.y = 0.15; brim.rotation.z = face * 0.08;
    part(head, GEO.crown).position.y = 0.22;
  } else if (kind === "bowler") {
    const brim = part(head, GEO.brim); brim.scale.set(0.7, 1, 0.7); brim.position.y = 0.14;
    part(head, GEO.bowler).position.y = 0.14;
  } else if (kind === "lady") {
    part(head, GEO.bun).position.set(-face * 0.1, 0.13, 0);
    part(head, GEO.hairBack).position.set(-face * 0.06, -0.02, 0);
  } else if (kind === "ladyHat") {
    part(head, GEO.hairBack).position.set(-face * 0.06, -0.04, 0);
    const b = part(head, GEO.wideBrim); b.position.set(-face * 0.01, 0.16, 0); b.rotation.z = -face * 0.14;
    part(head, GEO.lowCrown).position.set(-face * 0.01, 0.2, 0);
    for (let k = 0; k < 3; k++) { const pl = part(head, GEO.plume); pl.position.set(-face * (0.08 + k * 0.03), 0.29 + k * 0.02, 0); pl.rotation.z = face * (0.7 + k * 0.25); }
  } else if (kind === "child") {
    part(head, GEO.cap).position.set(0, 0.1, 0);
    part(head, GEO.visor).position.set(face * 0.1, 0.11, 0);
  } else if (kind === "girl") {
    for (const z of [-0.1, 0.1]) { const tl = part(head, GEO.tail); tl.position.set(-face * 0.07, 0.02, z); tl.rotation.x = z > 0 ? -0.5 : 0.5; }
    part(head, GEO.bow).position.set(-face * 0.02, 0.19, 0);
  }
  if (child) head.scale.setScalar(1.18);
  const arms = [];
  for (const z of [0.2, -0.2]) {
    const sh = new THREE.Group(); sh.position.set(0, 0.56, z * (female && !child ? 0.85 : 1)); p.add(sh);
    sh.add(new THREE.Mesh(GEO.upper, SIL));
    if (female && !child) part(sh, GEO.puff).position.y = -0.03;
    const el = new THREE.Group(); el.position.y = -0.27; sh.add(el);
    el.add(new THREE.Mesh(GEO.fore, SIL));
    const wr = new THREE.Group(); wr.position.y = -0.24; el.add(wr);
    arms.push({ sh, el, wr, hand: hand(wr) });
  }
  return { p, head, arms, thighs };
}

// cặp ngồi đối diện: [trái nhìn phải, phải nhìn trái]
const COMBOS = [["cowboy", "lady"], ["bowler", "ladyHat"], ["lady", "child"], ["cowboy", "bowler"], ["ladyHat", "girl"], ["lady", "ladyHat"], ["bowler", "child"], ["cowboy", "girl"], ["ladyHat", "cowboy"]];
export function addPassengers(coach, y0) {
  const people = [];
  // 3 cặp, mỗi người ngồi ngay sau 1 ô cửa sổ (tâm cửa: ±0,57 · ±1,7 · ±2,83); cặp giữa đôi khi trống
  const pairs = [[-2.83, -1.7], [-0.57, 0.56], [1.7, 2.83]].filter((_, i) => i !== 1 || Math.random() < 0.75);
  pairs.forEach(([xa, xb]) => {
    const combo = COMBOS[Math.floor(Math.random() * COMBOS.length)], swap = Math.random() < 0.5;
    const pair = { ph: Math.random() * 20, len: 2.2 + Math.random() * 2.2 };
    [[xa, 1], [xb, -1]].forEach(([x, face], role) => {
      const kind = combo[swap ? 1 - role : role], child = CHILD.has(kind);
      const q = person(face, kind);
      q.p.position.set(x - face * 0.1, y0 + 0.7 + (child ? 0.36 : 0), 0.1);   // trẻ em ngồi trên đệm/đầu gối cao hơn để thấy qua cửa sổ q.p.scale.setScalar(child ? 0.8 : 1.18);
      coach.add(q.p);
      people.push({ ...q, face, kind, child, y0: q.p.position.y, sc: q.p.scale.x, pair, role, ph: Math.random() * 6, style: Math.floor(Math.random() * 3) });
    });
  });
  return people;
}

// các kiểu hoảng sợ: sh/el = [tay trước, tay sau] (góc vai/khuỷu), lean < 0 là chồm tới trước, dip = nhổm/hụp, head = ngửa đầu
const REACT = [
  { name: "handsUp", sh: [2.7, 2.6], el: [0.25, 0.35], wr: -0.3, curl: [-0.08, -0.08], lean: 0.06, dip: 0.06, head: 0.25 },
  { name: "duck", sh: [2.5, 2.4], el: [2.1, 2.2], wr: 0.3, curl: [0.35, 0.35], lean: -0.42, dip: -0.08, head: -0.35 },
  { name: "holdHat", sh: [2.55, 0.5], el: [1.7, 1.3], wr: 0.2, curl: [0.55, 0.6], lean: -0.1, dip: -0.03, head: 0.15 },
  { name: "cheeks", sh: [0.55, 0.5], el: [2.45, 2.5], wr: 0.4, curl: [0.0, 0.0], lean: 0.12, dip: 0.02, head: 0.3 },
  { name: "pointUp", sh: [2.95, 0.35], el: [0.1, 1.7], wr: 0, curl: ["point", 0.5], lean: 0.15, dip: 0.0, head: 0.75 },
  { name: "grab", sh: [1.45, 1.3], el: [0.35, 0.5], wr: -0.2, curl: [0.7, 0.7], lean: -0.25, dip: 0.0, head: 0.05 },
];
const CHILD_REACT = [0, 1, 5];
function assignReactions(people) {
  const order = [0, 1, 2, 3, 4, 5].sort(() => Math.random() - 0.5);
  let k = 0;
  for (const q of people) {
    let r = order[k++ % order.length];
    if (q.child && !CHILD_REACT.includes(r)) r = CHILD_REACT[Math.floor(Math.random() * CHILD_REACT.length)];
    if (r === 2 && (q.kind === "girl" || q.kind === "lady")) r = 3;   // không đội mũ thì ôm má
    q.react = REACT[r]; q.rDelay = Math.random() * 0.3; q.rDur = 2.0 + Math.random() * 0.8; q.rAmp = 0.8 + Math.random() * 0.25;   // 1i: hoảng lâu hơn
  }
}

// nói chuyện ⇄ hoảng sợ ⇄ ngước nhìn trần ⇄ nói tiếp
export function animatePassengers(people, time, startleT, chaosT = null, dt = 1 / 60) {
  if (startleT != null && (people._lastS == null || startleT < people._lastS)) assignReactions(people);
  people._lastS = startleT;
  // toa loạn: chọn 1–2 người bật dậy chạy
  if (chaosT != null && !people._chaos) {
    people._chaos = true;
    const cand = people.filter(q => !q.run).sort(() => Math.random() - 0.5);
    cand.slice(0, Math.random() < 0.6 ? 2 : 1).forEach(q => { q.run = { x: q.p.position.x, home: q.p.position.x, tx: -3 + Math.random() * 6, dir: q.face, wait: Math.random() * 0.4 }; });
  }
  if (chaosT == null) people._chaos = false;
  for (const q of people) {
    const f = q.face;
    if (q.run && runPose(q, time, chaosT == null, dt)) continue;
    // mức hoảng e (0..1) và mức ngước nhìn trần
    let e = 0, lookUp = 0;
    if (startleT != null && q.react) {
      const u = (startleT - q.rDelay) / q.rDur;
      e = u < 0 ? 0 : u < 0.1 ? u / 0.1 : u < 1 ? 1 : u < 1.5 ? 1 - (u - 1) / 0.5 : 0;
      e = e * e * (3 - 2 * e) * q.rAmp;
      lookUp = u < 0.95 ? 0 : u < 1.08 ? (u - 0.95) / 0.13 : u < 1.4 ? 1 : Math.max(0, 1 - (u - 1.4) / 0.15);
    }
    const R = q.react || REACT[0], talk = 1 - Math.min(1, e + lookUp);
    // thay lượt nói trong cặp: người nói khoa tay, người nghe gật gù
    const speaking = Math.floor((time + q.pair.ph) / q.pair.len) % 2 === q.role;
    const g = speaking ? 1 : 0.15;
    const nod = speaking ? 0 : Math.max(0, Math.sin(time * 2.6 + q.ph)) * 0.06;
    const tremble = (Math.sin(time * 38 + q.ph) * 0.06 + Math.sin(time * 23 + q.ph * 2) * 0.04) * e;
    q.p.position.y = q.y0 + R.dip * e * (q.child ? 0.6 : 1);
    q.head.rotation.z = talk * (f * 0.07 * Math.sin(time * 4.5 + q.ph) * g - f * nod) + f * R.head * e + lookUp * 0.55 * f * (1 - e);
    q.p.rotation.z = talk * f * 0.03 * Math.sin(time * 1.3 + q.ph) + f * R.lean * e + Math.sin(time * 31 + q.ph) * 0.012 * e;   // run cả người
    q.arms.forEach((a, i) => {
      const w = i === 0 ? Math.max(0, Math.sin(time * 2.8 + q.ph)) : Math.max(0, Math.sin(time * 2.1 + q.ph + 2)) * 0.5;
      const k = g * w;
      const shT = 0.35 + k * 1.0, elT = 1.2 + k * 0.6, wrT = 0.2 * Math.sin(time * 3 + q.ph + i) * k;
      a.sh.rotation.z = f * (shT * (1 - e) + (R.sh[i] + tremble) * e);
      a.el.rotation.z = f * (elT * (1 - e) + R.el[i] * e);
      a.wr.rotation.z = f * (wrT * (1 - e) + R.wr * e);
      // ngón tay: nghe = hơi cong; nói = xoè/chỉ/nắm theo "tính cách"; hoảng = theo kiểu phản ứng
      a.hand.fingers.forEach((fg, j) => {
        let c = 0.6;
        if (k > 0.2) c = q.style === 0 ? 0.15 : q.style === 1 ? (j === 0 ? 0.05 : 1.3) : 0.3 + 0.5 * Math.sin(time * 5 + j);
        const rc = R.curl[i] === "point" ? (j === 0 ? 0 : 1.35) : R.curl[i];
        c = c * (1 - e) + rc * e;
        fg.k1.rotation.z = f * c; fg.k2.rotation.z = f * c * 1.1;
      });
      a.hand.t1.rotation.z = 0.7 - e * 0.4; a.hand.t2.rotation.z = (1 - e) * 0.4;
    });
  }
}

// người bật dậy chạy lung tung dọc lối đi (true = đang chạy, đã tự đặt dáng)
function runPose(q, time, goHome, dt) {
  const R = q.run, f = q.face;
  if (R.wait > 0) { R.wait -= dt; return false; }
  if (goHome) R.tx = R.home;
  const dx = R.tx - R.x;
  if (Math.abs(dx) < 0.08) {
    if (goHome) {   // về tới chỗ: ngồi xuống lại
      q.run = null; q.p.position.set(R.home, q.y0, q.p.position.z); q.p.scale.x = q.sc; q.p.rotation.z = 0;
      q.thighs.forEach(t => { t.rotation.z = f * Math.PI / 2; });
      return false;
    }
    R.tx = -3.1 + Math.random() * 6.2;   // chọn chỗ chạy tiếp
  } else { R.dir = Math.sign(dx); R.x += R.dir * Math.min(Math.abs(dx), (goHome ? 1.8 : 2.8) * dt); }
  const d = R.dir, st = time * 13 + q.ph;
  q.p.position.x = R.x;
  q.p.position.y = q.y0 + 0.3 * (q.child ? 0.7 : 1) + Math.abs(Math.sin(st)) * 0.05;   // đứng dậy, nhún theo bước chạy
  q.p.scale.x = q.sc * d * f;                      // quay mặt theo hướng chạy (lật hình)
  q.p.rotation.z = -d * 0.2;                       // chồm tới trước
  q.thighs.forEach((t, i) => { t.rotation.z = f * (0.45 * Math.sin(st + i * Math.PI)); });
  q.head.rotation.z = f * (0.25 + Math.sin(time * 3 + q.ph) * 0.2);   // ngoái nhìn lên trần
  q.arms.forEach((a, i) => {
    a.sh.rotation.z = f * (2.5 + Math.sin(time * 9 + i * 2 + q.ph) * 0.45);   // giơ tay quơ loạn
    a.el.rotation.z = f * (0.3 + Math.sin(time * 11 + i) * 0.3);
    a.wr.rotation.z = f * Math.sin(time * 13 + i) * 0.3;
    a.hand.fingers.forEach(fg => { fg.k1.rotation.z = -f * 0.08; fg.k2.rotation.z = 0; });
  });
  return true;
}

// ---------------------------------------------------------------- toa than
const COAL_MAT = new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.45, metalness: 0.35 });
export const COAL_LUMP = new THREE.DodecahedronGeometry(0.16, 0);
export function coalMaterial() { return COAL_MAT; }
export function makeCoalCar(meshAdder, M, paintHex) {
  const g = new THREE.Group(), add = meshAdder(g);
  const L = COAL_LEN, y0 = 1.1, H = 1.25, D = 1.9;
  const side = new THREE.MeshStandardMaterial({ color: paintHex, roughness: 0.75, metalness: 0.3 });
  add(new THREE.BoxGeometry(L, 0.26, 1.5), M.iron, 0, 0.95);
  add(new THREE.BoxGeometry(L, 0.12, D), M.iron, 0, y0 + 0.06);
  for (const s of [-1, 1]) add(new THREE.BoxGeometry(L, H, 0.1), side, 0, y0 + H / 2, s * (D / 2 - 0.05));
  for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.1, H, D), side, s * (L / 2 - 0.05), y0 + H / 2, 0);
  // gân sắt dọc hông
  for (let i = 0; i <= 6; i++) for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.08, H, 0.04), M.iron, -L / 2 + 0.2 + i * (L - 0.4) / 6, y0 + H / 2, s * (D / 2 + 0.01));
  // đống than: gò + nhiều cục than trên mặt
  const heap = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2), COAL_MAT);
  heap.scale.set(L / 2 - 0.2, 0.75, D / 2 - 0.12); heap.position.y = y0 + H - 0.25; heap.receiveShadow = true; g.add(heap);
  const n = 70, lumps = new THREE.InstancedMesh(COAL_LUMP, COAL_MAT, n), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  for (let i = 0; i < n; i++) {
    const u = Math.random() * 2 - 1, v = Math.random() * 2 - 1; if (u * u + v * v > 1) { i--; continue; }
    const x = u * (L / 2 - 0.3), z = v * (D / 2 - 0.2), y = y0 + H - 0.25 + 0.75 * Math.sqrt(Math.max(0, 1 - u * u - v * v));
    m4.compose(new THREE.Vector3(x, y, z), q.setFromEuler(e.set(Math.random() * 3, Math.random() * 3, Math.random() * 3)), new THREE.Vector3(1, 1, 1).multiplyScalar(0.6 + Math.random() * 0.9));
    lumps.setMatrixAt(i, m4);
  }
  lumps.castShadow = true; g.add(lumps);
  for (const bx of [-L / 2 + 1.2, L / 2 - 1.2]) add(new THREE.BoxGeometry(1.7, 0.22, 1.5), M.iron, bx, 0.62);
  return { group: g, roof: y0 + H + 0.45, bogies: [-L / 2 + 1.2, L / 2 - 1.2] };
}

function coachSideTexture(paintHex) {
  const c = document.createElement("canvas"); c.width = 1024; c.height = 356;
  const ctx = c.getContext("2d"), w = c.width, h = c.height;
  ctx.fillStyle = "#" + new THREE.Color(paintHex).getHexString(); ctx.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 16) { ctx.fillStyle = "rgba(0,0,0,.14)"; ctx.fillRect(x, 0, 2, h); }
  ctx.strokeStyle = "#d9b25a"; ctx.lineWidth = 5; ctx.strokeRect(10, 10, w - 20, h - 20);
  ctx.lineWidth = 2; ctx.strokeRect(22, 22, w - 44, h - 44);
  ctx.fillStyle = "#d9b25a"; ctx.fillRect(22, h * 0.8, w - 44, 4);
  const n = 6, ww = 104, wh = 128, gap = (w - n * ww) / (n + 1), wy = h * 0.2;
  for (let i = 0; i < n; i++) {
    const x = gap + i * (ww + gap);
    ctx.fillStyle = "#3b2414"; ctx.beginPath(); ctx.roundRect(x - 9, wy - 9, ww + 18, wh + 18, 16); ctx.fill();
    ctx.save(); ctx.globalCompositeOperation = "destination-out"; ctx.beginPath(); ctx.roundRect(x, wy, ww, wh, 12); ctx.fill(); ctx.restore();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

// tài nguyên dùng chung giữa các toa: disposeTree() của lõi game không được huỷ
Object.values(GEO).forEach(g => { g.userData.shared = true; });
[SIL, COAL_MAT, COAL_LUMP, CURTAIN].forEach(x => { x.userData.shared = true; });
