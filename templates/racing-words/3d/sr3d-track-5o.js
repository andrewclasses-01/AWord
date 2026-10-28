// RACING WORDS mẫu 5o (28/10/2026) = track-5n + featSites: chỗ đặt dốc DÀY (thầy: "tăng số lượng dốc thẳng và dốc xoắn, quá ít" — chọn "bay qua góc cua"):
//   cứ ~255 m một chỗ, chỉ cần CHÂN dốc (+ 16 m) nằm trên khúc lượn; xe bay ~200–280 m có thể qua góc cua (trên không xe đi theo đường như khúc lượn). Lõi bốc thẳng / xoắn.
// RACING WORDS mẫu 5n (28/10/2026) = track-5l + thầy: "tăng gấp đôi chiều dài thực tế của bản đồ, không có chỗ nào thẳng tắp — hoặc gần vuông góc,
//   hoặc hơi lượn sóng" · "hồ ở giữa (bên phải đường), có bãi cát rồi đến nước; núi bao ngoài (bên trái)".
//   · Vòng ~7 km chạy THEO chiều kim đồng hồ (θ tăng = cua phải) ⇒ phía PHẢI xe luôn là TRONG vòng = hồ; phía TRÁI = ngoài vòng = núi.
//   · 17 đỉnh, góc gần 90° (zigzag, khúc lõm vào hồ). Mọi CẠNH đều lượn sóng: lệch ngang f(u) = W·sin(π·m·u/L)·cửa sổ(u)
//     (cửa sổ sin² 90 m ở 2 đầu ⇒ nối tiếp tuyến với cung bo góc), bước sóng ~230 m, bán kính lượn nhỏ nhất ~150–220 m (cua nhẹ, vẫn phải lái).
//     Đoạn gần thẳng chỉ còn ≤ ~40 m sát mỗi góc.
//   · Dốc nhảy / dốc xoắn đặt trên cạnh LƯỢN (thầy chọn) — xe bay theo đường lượn, đáp xuống khúc lượn nhẹ.
//   · Trường khoảng cách tính bằng cách "tô đĩa" quanh mỗi mẫu tim đường (nhanh ~10×) + cờ TRONG VÒNG (quét hàng ngang, chẵn–lẻ) ⇒ ảnh 2 kênh cho shader đất.
// ---- gốc 5l ----
// Toạ độ: "màn" (x sang phải = Đông, y xuống = Nam), góc hướng θ = atan2(dy, dx) ⇒ θ TĂNG = cua PHẢI (κ = dθ/ds > 0, cùng quy ước KAP cũ).
// Bảng mỗi 1 m: κ, θ, vị trí (x, y) ⇒ HÌNH (shader uốn xoay thật, sr3d-world) và VẬT LÝ (psi' = lái − v·κ) dùng CHUNG một độ cong.

// [x, y, R] — R = bán kính bo góc tại đỉnh (m); đỉnh đầu = vạch xuất phát (cạnh trái, chạy lên Bắc). x nhân 0,9 khi dựng.
const POLY0 = [
  [0, 200, 0],
  [0, -220, 60],      // phải ⇒ Đông
  [650, -220, 50],    // zigzag: phải ⇒ Nam
  [650, -80, 50],     //   trái ⇒ Đông
  [1100, -80, 50],    //   trái ⇒ Bắc
  [1100, -260, 50],   //   phải ⇒ Đông
  [1900, -260, 55],   // phải ⇒ Nam
  [1900, -110, 50],   //   trái ⇒ Đông
  [2900, -110, 60],   // phải ⇒ Nam (đầu Đông)
  [2900, 380, 60],    // phải ⇒ Tây
  [2300, 380, 50],    // khúc lõm vào hồ: phải ⇒ Bắc
  [2300, 200, 50],    //   trái ⇒ Tây
  [1800, 200, 50],    //   trái ⇒ Nam
  [1800, 470, 55],    // phải ⇒ Tây (bờ Nam dài)
  [700, 470, 55],     // phải ⇒ Bắc
  [700, 320, 50],     //   trái ⇒ Tây
  [0, 320, 60],       // phải ⇒ Bắc (về vạch)
];
const XK = 0.9;
const POLY = POLY0.map(([x, y, R]) => [x * XK, y, R]);
// chỗ đặt cầu nhảy / dốc xoắn: [chỉ số cạnh (từ đỉnh i), mét tính từ đầu phần cạnh sau cung, ±1]
const RAMP_SITES = [[1, 40, 1], [3, 30, -1], [5, 40, 1], [7, 40, -1], [8, 40, 1], [11, 40, -1], [13, 60, 1], [15, 40, -1]];
const TWIST_SITES = [[5, 380, -1], [7, 480, 1], [9, 60, -1], [13, 520, -1]];
const FEAT = { PITCH: 255, FROM: 200, LEN: 16 };   // 5o: khoảng cách 2 dốc · dốc đầu sau vạch xuất phát · phần cần nằm trên khúc lượn (dốc xoắn 14 m + lề)
const WAVE = { LEN: 230, TAPER: 90, RMIN: [150, 220] };     // bước sóng · cửa sổ đầu cạnh · bán kính lượn nhỏ nhất (ngẫu nhiên cố định theo cạnh)

const TAU = Math.PI * 2;
const wrapPI = a => a - TAU * Math.round(a / TAU);
const hash = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

export function buildTrack() {
  const n = POLY.length, V = POLY.map(([x, y, R]) => ({ x, y, R }));
  V.forEach((v, i) => { const a = V[(i + n - 1) % n], b = V[(i + 1) % n];
    v.th0 = Math.atan2(v.y - a.y, v.x - a.x); v.th1 = Math.atan2(b.y - v.y, b.x - v.x); v.d = wrapPI(v.th1 - v.th0); v.tl = v.R * Math.tan(Math.abs(v.d) / 2); });
  // 1) tim đường dày (bước 0,5 m): [cạnh lượn i] rồi [cung tại đỉnh i+1]
  const PX = [], PY = [], EDGE = [];                          // EDGE: mẫu thuộc cạnh nào (−1 = cung)
  const STEP = 0.5;
  for (let i = 0; i < n; i++) {
    const v = V[i], w = V[(i + 1) % n], L0 = Math.hypot(w.x - v.x, w.y - v.y), L = L0 - v.tl - w.tl;
    if (L < 5) throw new Error(`track 5n: cạnh ${i} quá ngắn cho 2 cung (${L.toFixed(1)} m)`);
    const ux = (w.x - v.x) / L0, uy = (w.y - v.y) / L0, nx = -uy, ny = ux, ax = v.x + ux * v.tl, ay = v.y + uy * v.tl;
    const m = Math.max(1, Math.round(2 * L / WAVE.LEN)), k = Math.PI * m / L;
    const rmin = WAVE.RMIN[0] + (WAVE.RMIN[1] - WAVE.RMIN[0]) * hash(i);
    // cạnh ngắn < 160 m (nối 2 góc của zigzag) KHÔNG lượn; biên độ ≤ 8 m (cạnh 1 nhịp sóng sẽ ra bướu to, cua gắt)
    const W = L < 160 ? 0 : Math.min(8, (1 / rmin) / (k * k)) * (hash(i + 50) < 0.5 ? -1 : 1);
    const T = Math.min(WAVE.TAPER, L / 3);
    const f = u => { const e = Math.min(u, L - u), g = e >= T ? 1 : Math.sin(Math.PI / 2 * e / T) ** 2; return W * Math.sin(k * u) * g; };
    const cnt = Math.max(2, Math.ceil(L / STEP));
    for (let q = 0; q < cnt; q++) { const u = q / cnt * L, o = f(u); PX.push(ax + ux * u + nx * o); PY.push(ay + uy * u + ny * o); EDGE.push(i); }
    if (w.R > 0) {
      const sg = Math.sign(w.d), cx = w.x - Math.cos(w.th0) * w.tl, cy = w.y - Math.sin(w.th0) * w.tl, len = w.R * Math.abs(w.d), kp = sg / w.R, R = 1 / kp;
      const c2 = Math.max(2, Math.ceil(len / STEP));
      for (let q = 0; q < c2; q++) { const u = q / c2 * len, a = w.th0 + kp * u; PX.push(cx + R * (Math.sin(a) - Math.sin(w.th0))); PY.push(cy - R * (Math.cos(a) - Math.cos(w.th0))); EDGE.push(-1); }
    }
  }
  // 2) chiều dài cộng dồn ⇒ lấy mẫu đều 1 m
  const M = PX.length, CS = new Float64Array(M + 1);
  for (let q = 1; q <= M; q++) { const a = q % M; CS[q] = CS[q - 1] + Math.hypot(PX[a] - PX[q - 1], PY[a] - PY[q - 1]); }
  const LAP = CS[M], N = Math.ceil(LAP), DS = LAP / N;
  const kap = new Float32Array(N + 1), th = new Float64Array(N + 1), px = new Float64Array(N + 1), py = new Float64Array(N + 1), eg = new Int16Array(N + 1);
  let q = 0;
  for (let k = 0; k <= N; k++) {
    const s = Math.min(k * DS, LAP - 1e-9); while (q < M - 1 && CS[q + 1] <= s) q++;
    const a = q, b = (q + 1) % M, f = (s - CS[q]) / Math.max(1e-9, CS[q + 1] - CS[q]);
    px[k] = PX[a] + (PX[b] - PX[a]) * f; py[k] = PY[a] + (PY[b] - PY[a]) * f; eg[k] = EDGE[a];
  }
  for (let k = 0; k <= N; k++) { const a = (k + N - 1) % N, b = (k + 1) % N; th[k] = Math.atan2(py[b] - py[a], px[b] - px[a]); }
  for (let k = 1; k <= N; k++) th[k] = th[k - 1] + wrapPI(th[k] - th[k - 1]);
  const TURN = th[N] - th[0];
  for (let k = 0; k <= N; k++) { const a = Math.max(0, k - 1), b = Math.min(N, k + 1); kap[k] = (th[b] - th[a]) / ((b - a) * DS); }
  // κ làm mượt ±3 m ⇒ vào / ra cua không giật vô lăng
  const kapS = new Float32Array(N + 1); for (let k = 0; k <= N; k++) { let a = 0; for (let d = -3; d <= 3; d++) a += kap[((k + d) % N + N) % N]; kapS[k] = a / 7; }
  const idx = s => { const u = (((s % LAP) + LAP) % LAP) / DS, k = Math.min(Math.floor(u), N - 1); return [k, u - k]; };
  const kapAt = s => { const [k, f] = idx(s); return kapS[k] + (kapS[k + 1] - kapS[k]) * f; };
  const thAt = s => { const [k, f] = idx(s); return th[k] + (th[k + 1] - th[k]) * f + Math.floor(s / LAP) * TURN; };
  const posAt = (s, out = [0, 0]) => { const [k, f] = idx(s); out[0] = px[k] + (px[k + 1] - px[k]) * f; out[1] = py[k] + (py[k + 1] - py[k]) * f; return out; };
  const worldAt = (s, x, out = [0, 0]) => { posAt(s, out); const a = thAt(s); out[0] -= Math.sin(a) * x; out[1] += Math.cos(a) * x; return out; };
  // các cạnh lượn (thay "đoạn thẳng" 5l): [s0, s1] mỗi cạnh — chỗ đặt dốc
  const straights = [];
  for (let k = 0, cur = null; k <= N; k++) {
    const e = k < N ? eg[k] : -2;
    if (cur && e !== cur.i) { cur.s1 = k * DS; straights.push(cur); cur = null; }
    if (!cur && e >= 0) cur = { i: e, s0: k * DS, s1: 0 };
  }

  // 3) trường khoảng cách (ô 4 m, byte = mét, trần 255) — tô đĩa 255 m quanh mỗi mẫu 4 m của tim đường
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let k = 0; k <= N; k++) { x0 = Math.min(x0, px[k]); x1 = Math.max(x1, px[k]); y0 = Math.min(y0, py[k]); y1 = Math.max(y1, py[k]); }
  const CELL = 4, PAD = 260; x0 -= PAD; y0 -= PAD; x1 += PAD; y1 += PAD;
  const DW = Math.ceil((x1 - x0) / CELL) + 1, DH = Math.ceil((y1 - y0) / CELL) + 1, d2 = new Float32Array(DW * DH).fill(65025);
  const RC = Math.ceil(255 / CELL);
  for (let k = 0; k < N; k += 4) {
    const X = px[k], Y = py[k], ci = Math.round((X - x0) / CELL), cj = Math.round((Y - y0) / CELL);
    for (let j = Math.max(0, cj - RC); j <= Math.min(DH - 1, cj + RC); j++) {
      const dy = y0 + j * CELL - Y, dy2 = dy * dy; if (dy2 >= 65025) continue; const row = j * DW;
      for (let i = Math.max(0, ci - RC); i <= Math.min(DW - 1, ci + RC); i++) { const dx = x0 + i * CELL - X, v = dx * dx + dy2; if (v < d2[row + i]) d2[row + i] = v; }
    }
  }
  const dist = new Uint8Array(DW * DH); for (let c = 0; c < dist.length; c++) dist[c] = Math.min(255, Math.round(Math.sqrt(d2[c])));
  // cờ TRONG VÒNG (= phía phải xe = hồ): quét từng hàng, đếm giao với đa giác tim đường (mẫu 4 m)
  const ins = new Uint8Array(DW * DH), xs = [];
  const SXn = []; for (let k = 0; k < N; k += 4) SXn.push(k);
  for (let j = 0; j < DH; j++) {
    const Y = y0 + j * CELL; xs.length = 0;
    for (let a = 0; a < SXn.length; a++) {
      const k1 = SXn[a], k2 = SXn[(a + 1) % SXn.length], ya = py[k1], yb = py[k2];
      if ((ya <= Y) !== (yb <= Y)) xs.push(px[k1] + (Y - ya) / (yb - ya) * (px[k2] - px[k1]));
    }
    xs.sort((a, b) => a - b);
    for (let p = 0; p + 1 < xs.length; p += 2) {
      const ia = Math.max(0, Math.ceil((xs[p] - x0) / CELL)), ib = Math.min(DW - 1, Math.floor((xs[p + 1] - x0) / CELL));
      for (let i = ia; i <= ib; i++) ins[j * DW + i] = 255;
    }
  }
  const bil = (A, X, Y, out) => {                            // song tuyến như GPU (LinearFilter) — ngoài bảng ⇒ out
    const u = (X - x0) / CELL, v = (Y - y0) / CELL; if (u < 0 || v < 0 || u > DW - 1 || v > DH - 1) return out;
    const i = Math.min(Math.floor(u), DW - 2), j = Math.min(Math.floor(v), DH - 2), fu = u - i, fv = v - j, D = (a, b) => A[b * DW + a];
    return (D(i, j) * (1 - fu) + D(i + 1, j) * fu) * (1 - fv) + (D(i, j + 1) * (1 - fu) + D(i + 1, j + 1) * fu) * fv;
  };
  const distAt = (X, Y) => bil(dist, X, Y, 255);
  const insideAt = (X, Y) => bil(ins, X, Y, 0) / 255;       // 0 = ngoài (núi) · 1 = trong vòng (hồ)
  const SHORE_Y = Math.max(...POLY.map(p => p[1])) + 55;     // (5l — giữ cho mã cũ; 5n dùng insideAt)

  // bản đồ SVG (khung viewBox 40 10 940 180): co đều cả 2 chiều, căn giữa
  const sc = Math.min(900 / (x1 - x0 - 2 * PAD), 160 / (y1 - y0 - 2 * PAD)), ox = 510 - (x0 + PAD + (x1 - x0 - 2 * PAD) / 2) * sc, oy = 100 - (y0 + PAD + (y1 - y0 - 2 * PAD) / 2) * sc;
  const MAPN = 600, mapPts = []; for (let m = 0; m < MAPN; m++) { const p = posAt(m / MAPN * LAP); mapPts.push([ox + p[0] * sc, oy + p[1] * sc]); }

  const site = ([si, d, v], need) => { const st = straights.find(q => q.i === si); return st && st.s0 + d < st.s1 - need ? { s: st.s0 + d, v, room: st.s1 - st.s0 - d } : null; };
  let minR = Infinity; for (let k = 0; k < N; k++) if (Math.abs(kapS[k]) > 1e-6) minR = Math.min(minR, 1 / Math.abs(kapS[k]));
  const featSites = []; for (let s = FEAT.FROM; s < LAP - 100;) {   // 5o
    if (straights.some(e => s >= e.s0 + 10 && s + FEAT.LEN <= e.s1)) { featSites.push(Math.round(s)); s += FEAT.PITCH; } else s += 5; }
  return { LAP, N, DS, TURN, kapAt, thAt, posAt, worldAt, straights, mapPts, MAPN, minR, featSites,
    dist: { data: dist, ins, w: DW, h: DH, x0, y0, cell: CELL }, distAt, insideAt, SHORE_Y,
    rampSites: RAMP_SITES.map(q => site(q, 240)).filter(Boolean), twistSites: TWIST_SITES.map(q => site(q, 230)).filter(Boolean) };
}
