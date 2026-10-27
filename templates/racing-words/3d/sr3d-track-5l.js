// RACING WORDS mẫu 5l (27/10/2026) — ĐƯỜNG ĐUA THẬT (thầy: "đường thực tế dài hơn — không phải tăng vòng · nhiều cua gấp gần 90° và zigzag hơn").
//   Cũ: bản đồ Catmull-Rom 46 điểm co giãn theo vòng ~480 m, độ cong làm mượt ×0,22 và kẹp bán kính ≥ 154 m ⇒ đường chỉ lượn nhẹ, đua 1.920 m = 4 vòng lặp lại.
//   Nay: 1 vòng ĐA GIÁC thiết kế bằng mét (cạnh thẳng + cung tròn bo góc bán kính R), dài ~2,6 km, KHÔNG co giãn theo độ dài trận —
//   đích (FIN) nằm ở đâu trên vòng cũng được (cổng đích dời được). Có: đoạn thẳng xuất phát · zigzag vuông 4 cua ~80° (R 45) ở cạnh trên ·
//   kẹp tóc phải ở đầu phải · chicane ven biển ở cạnh dưới · 3 đoạn thẳng dài cho cầu nhảy / dốc xoắn (đáp đất vẫn còn đường thẳng).
// Toạ độ: "màn" (x sang phải = Đông, y xuống = Nam), góc hướng θ = atan2(dy, dx) ⇒ θ TĂNG = cua PHẢI (κ = dθ/ds > 0, cùng quy ước KAP cũ).
// Bảng mỗi 1 m: κ, θ, vị trí (x, y) ⇒ HÌNH (shader uốn xoay thật, sr3d-world-5l.js) và VẬT LÝ (psi' = lái − v·κ) dùng CHUNG một độ cong.
// Trường khoảng cách (ô 4 m, byte = mét tới tim đường gần nhất, trần 255) ⇒ địa hình theo toạ độ thế giới thật: sát đường phẳng, xa lên đồi núi, phía Nam là biển.

// [x, y, R] — R = bán kính bo góc tại đỉnh (m); đỉnh đầu = vạch xuất phát (giữa cạnh trái, chạy lên Bắc)
const POLY = [
  [0, 120, 0],
  [0, -40, 60],      // phải 90° ⇒ Đông
  [390, -40, 45],    // zigzag vuông: phải ~82° ⇒ xuống
  [410, 80, 45],     //   trái ⇒ Đông
  [560, 80, 45],     //   trái ⇒ lên
  [580, -40, 45],    //   phải ⇒ Đông
  [1000, -40, 50],   // chéo xuống (phải 45°)
  [1090, 50, 50],    //   về Đông (trái 45°)
  [1450, 50, 50],    // kẹp tóc phải: 90° xuống
  [1450, 250, 50],   //   90° về Tây
  [1050, 250, 45],   // chicane ven biển: trái 45° (xuống)
  [980, 320, 45],    //   phải 45° (Tây)
  [870, 320, 45],    //   phải 45° (lên)
  [800, 250, 45],    //   trái 45° (Tây)
  [0, 250, 60],      // phải 90° ⇒ Bắc
];
// chỗ đặt cầu nhảy / dốc xoắn: [chỉ số cạnh thẳng (cạnh từ đỉnh i), mét tính từ đầu đoạn thẳng, ±1] — xe bay dốc ~180–250 m ⇒ chỉ đặt ở đoạn thẳng còn đủ chỗ đáp
const RAMP_SITES = [[1, 20, 1], [7, 20, -1], [9, 40, 1], [13, 40, -1]];   // ±1 ⇒ x = ±4,1 (lệch về 2 nửa đường xen kẽ)
const TWIST_SITES = [[5, 60, 1], [13, 420, -1]];           // 2 dốc xoắn / vòng (đoạn 5 nằm trong trận mặc định 1.920 m)

const TAU = Math.PI * 2;
const wrapPI = a => a - TAU * Math.round(a / TAU);

export function buildTrack() {
  const n = POLY.length, V = POLY.map(([x, y, R]) => ({ x, y, R }));
  // mỗi đỉnh: hướng vào / ra, góc quay, đoạn tiếp tuyến R·tan(|Δ|/2)
  V.forEach((v, i) => { const a = V[(i + n - 1) % n], b = V[(i + 1) % n];
    v.th0 = Math.atan2(v.y - a.y, v.x - a.x); v.th1 = Math.atan2(b.y - v.y, b.x - v.x); v.d = wrapPI(v.th1 - v.th0); v.tl = v.R * Math.tan(Math.abs(v.d) / 2); });
  // ghép: [cung tại đỉnh i] rồi [thẳng i → i+1]; vạch xuất phát = điểm cuối cung của đỉnh 0 (đỉnh 0 R = 0 ⇒ chính đỉnh)
  const parts = [];
  for (let i = 0; i < n; i++) {
    const v = V[i], w = V[(i + 1) % n], L = Math.hypot(w.x - v.x, w.y - v.y), free = L - v.tl - w.tl;
    if (free < 5) throw new Error(`track 5l: cạnh ${i} quá ngắn cho 2 cung (${free.toFixed(1)} m)`);
    const ux = (w.x - v.x) / L, uy = (w.y - v.y) / L;
    parts.push({ k: "line", i, x0: v.x + ux * v.tl, y0: v.y + uy * v.tl, th: v.th1, len: free });
    if (w.R > 0) { const sg = Math.sign(w.d), cx = w.x - Math.cos(w.th0) * w.tl, cy = w.y - Math.sin(w.th0) * w.tl;   // cung bắt đầu tại tiếp điểm vào
      parts.push({ k: "arc", i: (i + 1) % n, x0: cx, y0: cy, th: w.th0, len: w.R * Math.abs(w.d), kap: sg / w.R }); }
  }
  // bảng 1 m
  const LAP = parts.reduce((s, p) => s + p.len, 0), N = Math.ceil(LAP);
  const DS = LAP / N, kap = new Float32Array(N + 1), th = new Float64Array(N + 1), px = new Float64Array(N + 1), py = new Float64Array(N + 1);
  const straights = []; let s0 = 0;
  parts.forEach(p => { p.s0 = s0; s0 += p.len; if (p.k === "line") straights.push({ i: p.i, s0: p.s0, s1: p.s0 + p.len }); });
  let pi = 0;
  for (let k = 0; k <= N; k++) {
    const s = Math.min(k * DS, LAP - 1e-9); while (pi < parts.length - 1 && s >= parts[pi].s0 + parts[pi].len) pi++;
    const p = parts[pi], u = s - p.s0;
    if (p.k === "line") { kap[k] = 0; th[k] = p.th; px[k] = p.x0 + Math.cos(p.th) * u; py[k] = p.y0 + Math.sin(p.th) * u; }
    else { const a = p.th + p.kap * u, R = 1 / p.kap;   // cung: tâm ở bên phải (κ > 0) / trái hướng ban đầu
      kap[k] = p.kap; th[k] = a; px[k] = p.x0 + R * (Math.sin(a) - Math.sin(p.th)); py[k] = p.y0 - R * (Math.cos(a) - Math.cos(p.th)); }
  }
  // θ liên tục (không nhảy ±π) ⇒ cả vòng cộng đúng 2π
  for (let k = 1; k <= N; k++) th[k] = th[k - 1] + wrapPI(th[k] - th[k - 1]);
  const TURN = th[N] - th[0];
  // κ hơi làm mượt (±3 m) ⇒ vào / ra cua không giật vô lăng (hình vẫn lấy vị trí THẬT ở bảng px/py)
  const kapS = new Float32Array(N + 1); for (let k = 0; k <= N; k++) { let a = 0; for (let d = -3; d <= 3; d++) a += kap[((k + d) % N + N) % N]; kapS[k] = a / 7; }
  const idx = s => { const u = (((s % LAP) + LAP) % LAP) / DS, k = Math.min(Math.floor(u), N - 1); return [k, u - k]; };
  const kapAt = s => { const [k, f] = idx(s); return kapS[k] + (kapS[k + 1] - kapS[k]) * f; };
  const thAt = s => { const [k, f] = idx(s); return th[k] + (th[k + 1] - th[k]) * f + Math.floor(s / LAP) * TURN; };
  const posAt = (s, out = [0, 0]) => { const [k, f] = idx(s); out[0] = px[k] + (px[k + 1] - px[k]) * f; out[1] = py[k] + (py[k + 1] - py[k]) * f; return out; };
  // vị trí THẬT của điểm (s, x lệch ngang): phải của hướng θ = (−sin θ, cos θ)
  const worldAt = (s, x, out = [0, 0]) => { posAt(s, out); const a = thAt(s); out[0] -= Math.sin(a) * x; out[1] += Math.cos(a) * x; return out; };

  // trường khoảng cách (ô 4 m) — vét cạn theo mẫu 4 m của tim đường (1 lần lúc dựng, ~ vài chục ms)
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let k = 0; k <= N; k++) { x0 = Math.min(x0, px[k]); x1 = Math.max(x1, px[k]); y0 = Math.min(y0, py[k]); y1 = Math.max(y1, py[k]); }
  const CELL = 4, PAD = 260; x0 -= PAD; y0 -= PAD; x1 += PAD; y1 += PAD;
  const DW = Math.ceil((x1 - x0) / CELL) + 1, DH = Math.ceil((y1 - y0) / CELL) + 1, dist = new Uint8Array(DW * DH);
  const SX = [], SY = []; for (let k = 0; k < N; k += 4) { SX.push(px[k]); SY.push(py[k]); }
  for (let j = 0; j < DH; j++) for (let i = 0; i < DW; i++) {
    const X = x0 + i * CELL, Y = y0 + j * CELL; let m = 65025;
    for (let q = 0; q < SX.length; q++) { const dx = SX[q] - X, dy = SY[q] - Y, d2 = dx * dx + dy * dy; if (d2 < m) m = d2; }
    dist[j * DW + i] = Math.min(255, Math.round(Math.sqrt(m)));
  }
  const distAt = (X, Y) => {                                // song tuyến như GPU (LinearFilter) — ngoài bảng ⇒ xa
    const u = (X - x0) / CELL, v = (Y - y0) / CELL; if (u < 0 || v < 0 || u > DW - 1 || v > DH - 1) return 255;
    const i = Math.min(Math.floor(u), DW - 2), j = Math.min(Math.floor(v), DH - 2), fu = u - i, fv = v - j, D = (a, b) => dist[b * DW + a];
    return (D(i, j) * (1 - fu) + D(i + 1, j) * fu) * (1 - fv) + (D(i, j + 1) * (1 - fu) + D(i + 1, j + 1) * fu) * fv;
  };
  const SHORE_Y = Math.max(...POLY.map(p => p[1])) + 55;     // bờ biển: phía Nam đường ven biển ~55 m

  // bản đồ SVG (khung viewBox 40 10 940 180): co đều cả 2 chiều, căn giữa
  const sc = Math.min(900 / (x1 - x0 - 2 * PAD), 160 / (y1 - y0 - 2 * PAD)), ox = 510 - (x0 + PAD + (x1 - x0 - 2 * PAD) / 2) * sc, oy = 100 - (y0 + PAD + (y1 - y0 - 2 * PAD) / 2) * sc;
  const MAPN = 400, mapPts = []; for (let m = 0; m < MAPN; m++) { const p = posAt(m / MAPN * LAP); mapPts.push([ox + p[0] * sc, oy + p[1] * sc]); }

  const site = ([si, d, v], need) => { const st = straights.find(q => q.i === si); return st && st.s0 + d < st.s1 - need ? { s: st.s0 + d, v, room: st.s1 - st.s0 - d } : null; };
  return { LAP, N, DS, TURN, kapAt, thAt, posAt, worldAt, straights, mapPts, MAPN, minR: Math.min(...POLY.filter(p => p[2] > 0).map(p => p[2])),
    dist: { data: dist, w: DW, h: DH, x0, y0, cell: CELL }, distAt, SHORE_Y,
    rampSites: RAMP_SITES.map(q => site(q, 240)).filter(Boolean), twistSites: TWIST_SITES.map(q => site(q, 230)).filter(Boolean) };
}
