// 1t (29/9, thầy: "giảm các khoảng trống ở các map; đến một điểm không khó quá, cũng không dễ quá"): chép mc3d-maps.js —
//   hình trạm khoét ÍT hơn (chỉ góc/khe nhỏ, bỏ các lỗ lớn), kiểu "arena" đặt vách 60% (cũ 42%), "rooms" chỉ 2 phòng 2×2.
// MAZE CHASE 3D — KHO MAP (mẫu 1c, 29/9/2026). Thầy: "mỗi màn cần một map khác nhau… tránh học sinh quen và thuộc lòng 1 map".
// Một MAP = HÌNH trạm (ô nào có sàn) + KIỂU mê cung (cách đục đường) + BẢNG MÀU. Mỗi câu bốc map kế tiếp trong bộ bài đã xáo;
// bên trong map đường đi vẫn SINH NGẪU NHIÊN ⇒ cùng một map chơi lại cũng không bao giờ giống hệt.
// Luật đục đường giữ như bản 2D: cây DFS/Prim rồi "braid" (không còn ngõ cụt) ⇒ luôn có vòng để né địch.

export const COLS = 15, ROWS = 7;
const DIRS = { u: [-1, 0, "d"], d: [1, 0, "u"], l: [0, -1, "r"], r: [0, 1, "l"] };
const DK = ["u", "d", "l", "r"];
const randi = n => Math.floor(Math.random() * n);
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = randi(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ---- HÌNH trạm: (r, c) ⇒ có sàn không. Mọi hình đều LIỀN một khối.
const SHAPES = {
  full:  () => true,
  cross: (r, c) => !((r < 1 || r > 5) && (c < 3 || c > 11)),
  ring:  (r, c) => !(r === 3 && c >= 6 && c <= 8),
  h:     (r, c) => !((r === 0 || r === 6) && c >= 5 && c <= 9),
  hex:   (r, c) => { const k = Math.max(0, Math.abs(r - 3) - 2) * 2; return c >= k && c <= 14 - k; },   // bát giác: đầu nhọn 1 ô = ngõ cụt không tránh được
  twin:  (r, c) => c !== 7 || r === 1 || r === 3 || r === 5,
  u:     (r, c) => !(r <= 1 && c >= 6 && c <= 8),
  s:     (r, c) => !((r === 0 && c >= 12) || (r === 6 && c <= 2)),
  quad:  (r, c) => !((r === 3 && (c <= 1 || c >= 13)) || (c === 7 && (r === 0 || r === 6))),
  plus:  (r, c) => !((r === 0 || r === 6) && (c <= 2 || c >= 12)),
};

// ---- BẢNG MÀU (thầy duyệt kiểu 1b: MỘT họ màu cho mê cung, sàn khác hẳn tường; bệ luôn vàng, địch đỏ/tím)
export const THEMES = {
  blue:    { wall: 0x1745c8, cap: 0x1f5fff, capE: 0x2f7bff, post: 0x1238a8, postE: 0x60a5fa, floor: ["#3a4462", "#323b57"], name: "Blue" },
  teal:    { wall: 0x0e7490, cap: 0x0891b2, capE: 0x22d3ee, post: 0x0b5f73, postE: 0x67e8f9, floor: ["#3b4158", "#33384d"], name: "Teal" },
  emerald: { wall: 0x157a4a, cap: 0x16a34a, capE: 0x22c55e, post: 0x0e5e38, postE: 0x86efac, floor: ["#3d4156", "#34384b"], name: "Emerald" },
  steel:   { wall: 0x5a6784, cap: 0x74839f, capE: 0x93a4c0, post: 0x455069, postE: 0xe2e8f0, floor: ["#2c3249", "#262b3f"], name: "Steel" },
  indigo:  { wall: 0x2a2d9a, cap: 0x3f46d8, capE: 0x5b63ff, post: 0x2c2f8f, postE: 0xa5b4fc, floor: ["#3a4058", "#32374c"], name: "Indigo" },
};

// ---- 10 MAP. `algo`: dfs = hành lang dài ngoằn ngoèo · prim = nhiều nhánh ngắn · rooms = có phòng rộng · arena = sân mở, vách rải rác
export const MAPS = [
  { name: "Classic Deck",  shape: "full",  algo: "dfs",   theme: "blue" },
  { name: "Cross Station", shape: "cross", algo: "prim",  theme: "teal" },
  { name: "Ring Module",   shape: "ring",  algo: "dfs",   theme: "indigo" },
  { name: "H-Bridge",      shape: "h",     algo: "rooms", theme: "emerald" },
  { name: "Hex Core",      shape: "hex",   algo: "prim",  theme: "steel" },
  { name: "Twin Docks",    shape: "twin",  algo: "dfs",   theme: "teal" },
  { name: "U-Bay",         shape: "u",     algo: "arena", theme: "blue" },
  { name: "Zigzag Wing",   shape: "s",     algo: "dfs",   theme: "emerald" },
  { name: "Four Labs",     shape: "quad",  algo: "rooms", theme: "indigo" },
  { name: "Open Arena",    shape: "plus",  algo: "arena", theme: "steel" },
];

// Bộ bài map cho một ván: xáo, không lặp map ngay sau nhau kể cả khi xáo lại vòng mới.
export function makeDeck() {
  let deck = [], last = -1;
  return () => {
    if (!deck.length) { deck = shuffle(MAPS.map((_, i) => i)); if (deck[0] === last && deck.length > 1) deck.push(deck.shift()); }
    last = deck.shift();
    return MAPS[last];
  };
}

export function genMap(map) {
  const act = SHAPES[map.shape] || SHAPES.full;
  const grid = Array.from({ length: ROWS }, (_, r) => Array.from({ length: COLS }, (_, c) => ({ u: false, d: false, l: false, r: false, on: !!act(r, c) })));
  const on = (r, c) => r >= 0 && r < ROWS && c >= 0 && c < COLS && grid[r][c].on;
  const link = (r, c, k) => { const [dr, dc, o] = DIRS[k]; grid[r][c][k] = true; grid[r + dr][c + dc][o] = true; };
  const nbrs = (r, c) => DK.filter(k => on(r + DIRS[k][0], c + DIRS[k][1]));
  const cells = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (grid[r][c].on) cells.push([r, c]);

  if (map.algo === "arena") {
    cells.forEach(([r, c]) => nbrs(r, c).forEach(k => link(r, c, k)));
    // đặt vách rải rác: đóng 1 cạnh nếu mê cung vẫn liền và 2 ô vẫn còn ≥ 2 lối (không tạo ngõ cụt)
    const edges = [];
    cells.forEach(([r, c]) => ["d", "r"].forEach(k => { if (grid[r][c][k]) edges.push([r, c, k]); }));
    shuffle(edges);
    const target = Math.floor(edges.length * 0.6);                 // 1t: nhiều vách hơn (0,42 ⇒ 0,6) — bớt sân trống
    let closed = 0;
    for (const [r, c, k] of edges) {
      if (closed >= target) break;
      const [dr, dc, o] = DIRS[k], a = grid[r][c], b = grid[r + dr][c + dc];
      if (DK.filter(x => a[x]).length <= 2 || DK.filter(x => b[x]).length <= 2) continue;
      a[k] = false; b[o] = false;
      if (connected()) closed++; else { a[k] = true; b[o] = true; }
    }
  } else {
    const seen = new Set(), [sr, sc] = cells[randi(cells.length)];
    seen.add(sr + "," + sc);
    if (map.algo === "prim" || map.algo === "rooms" && Math.random() < 0.5) {
      const front = nbrs(sr, sc).map(k => [sr, sc, k]);
      while (front.length) {
        const [r, c, k] = front.splice(randi(front.length), 1)[0];
        const nr = r + DIRS[k][0], nc = c + DIRS[k][1];
        if (seen.has(nr + "," + nc)) continue;
        link(r, c, k); seen.add(nr + "," + nc);
        nbrs(nr, nc).forEach(k2 => front.push([nr, nc, k2]));
      }
    } else {
      const stack = [[sr, sc]];
      while (stack.length) {
        const [r, c] = stack[stack.length - 1];
        const opts = nbrs(r, c).filter(k => !seen.has((r + DIRS[k][0]) + "," + (c + DIRS[k][1])));
        if (!opts.length) { stack.pop(); continue; }
        const k = opts[randi(opts.length)], nr = r + DIRS[k][0], nc = c + DIRS[k][1];
        link(r, c, k); seen.add(nr + "," + nc); stack.push([nr, nc]);
      }
    }
    if (map.algo === "rooms") {   // 3 phòng rộng: mở hết vách trong một khối 2×2 / 3×2 có sàn đủ
      let made = 0;
      for (let t = 0; t < 60 && made < 2; t++) {                 // 1t: 2 phòng 2×2 (cũ 3 phòng tới 3×2)
        const h = 2, w = 2, r0 = randi(ROWS - h + 1), c0 = randi(COLS - w + 1);
        let ok = true;
        for (let r = r0; r < r0 + h; r++) for (let c = c0; c < c0 + w; c++) if (!on(r, c)) ok = false;
        if (!ok) continue;
        for (let r = r0; r < r0 + h; r++) for (let c = c0; c < c0 + w; c++) { if (c < c0 + w - 1) link(r, c, "r"); if (r < r0 + h - 1) link(r, c, "d"); }
        made++;
      }
    }
    // braid: mở thêm 1 vách ở mọi ngõ cụt (như bản 2D)
    cells.forEach(([r, c]) => {
      const cl = grid[r][c];
      if (DK.filter(k => cl[k]).length > 1) return;
      const cand = shuffle(nbrs(r, c).filter(k => !cl[k]));
      if (cand.length) link(r, c, cand[0]);
    });
  }

  function connected() {
    const q = [cells[0]], seen = new Set([cells[0].join()]);
    while (q.length) {
      const [r, c] = q.shift();
      for (const k of DK) if (grid[r][c][k]) { const n = [r + DIRS[k][0], c + DIRS[k][1]]; if (!seen.has(n.join())) { seen.add(n.join()); q.push(n); } }
    }
    return seen.size === cells.length;
  }

  // xuất phát = ô có sàn gần tâm nhất; địch = ô có sàn gần 4 góc nhất
  const nearest = (tr, tc) => {
    let best = null, bd = 1e9;
    for (const [r, c] of shuffle(cells.slice())) { const d = Math.abs(r - tr) * 1.2 + Math.abs(c - tc); if (d < bd) { bd = d; best = [r, c]; } }
    return best;
  };
  const start = nearest(3, 7);
  const enemySpots = [[0, 0], [ROWS - 1, COLS - 1], [0, COLS - 1], [ROWS - 1, 0]].map(([r, c]) => nearest(r, c));
  return { grid, start: { r: start[0], c: start[1] }, enemySpots, theme: THEMES[map.theme] || THEMES.blue, map };
}
