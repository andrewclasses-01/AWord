// MAZE CHASE 3D — SÀN TÀU VŨ TRỤ, bản 1f (như 1e; chữ ANDREW STUDIO nhỏ + tối, chỉ khắc chìm, không sáng).
// ---- ghi chú 1d: (mẫu 1d, 29/9/2026). Thầy: "làm sàn đẹp và chi tiết hơn, sàn hiện tại trông giả quá".
// Vẽ 4 lớp bằng canvas cho vật liệu PBR của three.js:
//   color (màu + trong suốt ở ô không sàn) · normal (độ gồ ghề, sinh từ bản đồ độ cao) · rough (chỗ bóng / chỗ nhám) · emit (đèn nhỏ).
// Nội dung: tấm thép lát so le (rãnh ghép + mép vát + đinh tán) — 3 loại: thép sơn, thép GÂN KIM CƯƠNG, LƯỚI thông gió (đèn hắt dưới) ·
// bẩn loang + xước + chữ in khu vực · viền sọc vàng-đen ở mép giáp khoảng trống + hàng đèn đường băng · bóng tối sát chân tường ·
// vòng đánh dấu chỗ xuất phát. Vẽ lại MỖI CÂU (vì bóng chân tường theo mê cung của câu đó), ~100–200 ms.
export const DECK_P = 160;                 // điểm ảnh / ô (ô = 4 đơn vị ⇒ 40 px / đơn vị)

const rnd = (a, b) => a + Math.random() * (b - a);
function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
const css = (c, k = 1, a = 1) => `rgba(${Math.round(Math.min(255, c[0] * k))},${Math.round(Math.min(255, c[1] * k))},${Math.round(Math.min(255, c[2] * k))},${a})`;
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

function noiseCanvas(w, h, scale, oct = 3) {        // bẩn loang: cộng vài lớp nhiễu phóng to (mềm)
  const out = document.createElement("canvas"); out.width = w; out.height = h;
  const g = out.getContext("2d"); g.fillStyle = "#808080"; g.fillRect(0, 0, w, h);
  for (let o = 0; o < oct; o++) {
    const sw = Math.max(2, Math.round(w / (scale / (1 << o)))), sh = Math.max(2, Math.round(h / (scale / (1 << o))));
    const s = document.createElement("canvas"); s.width = sw; s.height = sh;
    const sg = s.getContext("2d"), id = sg.createImageData(sw, sh);
    for (let i = 0; i < sw * sh; i++) { const v = Math.random() * 255; id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = v; id.data[i * 4 + 3] = 255; }
    sg.putImageData(id, 0, 0);
    g.globalAlpha = 0.5 / (o + 1); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high";
    g.drawImage(s, 0, 0, w, h);
  }
  g.globalAlpha = 1;
  return out;
}

export function createDeckPainter(COLS, ROWS) {
  const P = DECK_P, W = COLS * P, H = ROWS * P;
  const mk = () => { const c = document.createElement("canvas"); c.width = W; c.height = H; return c; };
  const cv = { color: mk(), normal: mk(), rough: mk(), emit: mk() };
  const hcv = mk(), mask = mk();
  let grime = null;

  function paint(grid, theme, start, logo) {
    if (!grime) grime = noiseCanvas(W, H, 180, 4);
    const on = (r, c) => r >= 0 && r < ROWS && c >= 0 && c < COLS && grid[r][c].on;
    const g = cv.color.getContext("2d"), hg = hcv.getContext("2d"), rg = cv.rough.getContext("2d"), eg = cv.emit.getContext("2d");
    [g, hg, rg, eg].forEach(x => { x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = "source-over"; x.filter = "none"; });
    hg.fillStyle = "#808080"; hg.fillRect(0, 0, W, H);
    rg.fillStyle = "rgb(150,150,150)"; rg.fillRect(0, 0, W, H);
    eg.fillStyle = "#000"; eg.fillRect(0, 0, W, H);
    g.clearRect(0, 0, W, H);

    const base = hexRgb(theme.floor[0]), steel = [128, 136, 152];

    // ---- 1. tấm thép lát so le: hàng = 1 ô, rộng 1 / 1,5 / 2 ô, hàng lẻ lệch nửa tấm
    const plates = [];
    for (let r = 0; r < ROWS; r++) {
      let x = -(r % 2) * 0.75 * P;
      while (x < W) {
        const w = [1, 1.5, 1.5, 2][Math.floor(Math.random() * 4)] * P;
        const roll = Math.random(), type = roll < 0.55 ? "paint" : roll < 0.86 || w > 1.5 * P ? "tread" : "grate";
        plates.push({ x0: Math.max(0, x), x1: Math.min(W, x + w), y0: r * P, y1: (r + 1) * P, type, k: rnd(0.9, 1.07) });
        x += w;
      }
    }
    for (const p of plates) {
      const w = p.x1 - p.x0, h = p.y1 - p.y0;
      if (w < 8) continue;
      const col = p.type === "tread" ? mix(base, steel, 0.45) : p.type === "grate" ? mix(base, [30, 34, 44], 0.6) : base;
      // màu nền tấm + gradient rất nhẹ (ánh kim)
      const gr = g.createLinearGradient(p.x0, p.y0, p.x1, p.y1);
      gr.addColorStop(0, css(col, p.k * 1.04)); gr.addColorStop(1, css(col, p.k * 0.94));
      g.fillStyle = gr; g.fillRect(p.x0, p.y0, w, h);
      rg.fillStyle = p.type === "tread" ? "rgb(95,95,95)" : p.type === "grate" ? "rgb(120,120,120)" : `rgb(${Math.round(rnd(140, 170))},0,0)`;
      if (p.type === "paint") rg.fillStyle = `rgb(${Math.round(rnd(140, 172))},${Math.round(rnd(140, 172))},${Math.round(rnd(140, 172))})`;
      rg.fillRect(p.x0, p.y0, w, h);

      if (p.type === "tread") {                         // thép gân kim cương: gân dài chéo xen kẽ
        g.save(); g.beginPath(); g.rect(p.x0 + 10, p.y0 + 10, w - 20, h - 20); g.clip();
        hg.save(); hg.beginPath(); hg.rect(p.x0 + 10, p.y0 + 10, w - 20, h - 20); hg.clip();
        rg.save(); rg.beginPath(); rg.rect(p.x0 + 10, p.y0 + 10, w - 20, h - 20); rg.clip();
        let row = 0;
        for (let y = p.y0 + 4; y < p.y1; y += 13, row++) for (let x = p.x0 + (row % 2) * 13; x < p.x1; x += 26) {
          const ang = ((Math.floor((x - p.x0) / 26) + row) % 2 ? 1 : -1) * Math.PI / 4;
          for (const [ctx, st] of [[g, css(col, p.k * 1.28)], [hg, "#d8d8d8"], [rg, "rgb(70,70,70)"]]) {
            ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.fillStyle = st;
            ctx.beginPath(); ctx.ellipse(0, 0, 9, 2.6, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
          }
        }
        g.restore(); hg.restore(); rg.restore();
      } else if (p.type === "grate") {                  // lưới thông gió: khung + thanh, khe tối có đèn hắt dưới
        const ix = p.x0 + 16, iy = p.y0 + 16, iw = w - 32, ih = h - 32;
        g.fillStyle = "#0c0f16"; g.fillRect(ix, iy, iw, ih);
        hg.fillStyle = "#202020"; hg.fillRect(ix, iy, iw, ih);
        eg.fillStyle = "rgba(20,120,140,.55)"; eg.fillRect(ix + 4, iy + 4, iw - 8, ih - 8);
        for (let x = ix + 3; x < ix + iw - 4; x += 15) {
          g.fillStyle = css(steel, 0.9); g.fillRect(x, iy, 7, ih);
          g.fillStyle = "rgba(255,255,255,.12)"; g.fillRect(x, iy, 2, ih);
          hg.fillStyle = "#b0b0b0"; hg.fillRect(x, iy, 7, ih);
          eg.fillStyle = "#000"; eg.fillRect(x, iy, 7, ih);
          rg.fillStyle = "rgb(110,110,110)"; rg.fillRect(x, iy, 7, ih);
        }
        g.lineWidth = 3; g.strokeStyle = css(steel, 0.75); g.strokeRect(ix, iy, iw, ih);
      } else {                                          // thép sơn: đường ô bên trong mảnh + tấm vá
        g.strokeStyle = "rgba(0,0,0,.28)"; g.lineWidth = 2; g.strokeRect(p.x0 + 22, p.y0 + 22, w - 44, h - 44);
        hg.strokeStyle = "#606060"; hg.lineWidth = 2; hg.strokeRect(p.x0 + 22, p.y0 + 22, w - 44, h - 44);
        if (Math.random() < 0.3) {                     // tấm vá nhỏ bắt vít
          const px = p.x0 + rnd(30, Math.max(31, w - 90)), py = p.y0 + rnd(30, h - 80), pw = rnd(40, 60), ph = rnd(30, 44);
          g.fillStyle = css(col, p.k * 0.86); g.fillRect(px, py, pw, ph);
          g.strokeStyle = "rgba(0,0,0,.35)"; g.lineWidth = 1.5; g.strokeRect(px, py, pw, ph);
          hg.fillStyle = "#909090"; hg.fillRect(px, py, pw, ph);
          for (const [bx, by] of [[5, 5], [pw - 5, 5], [5, ph - 5], [pw - 5, ph - 5]]) { g.fillStyle = css(steel, 1.2); g.beginPath(); g.arc(px + bx, py + by, 2.2, 0, 7); g.fill(); }
        }
      }
      // mép vát (bản đồ độ cao): rãnh đen ở mép tấm, sáng dần vào trong
      for (let i = 0; i < 6; i++) { hg.strokeStyle = `rgb(${30 + i * 18},${30 + i * 18},${30 + i * 18})`; hg.lineWidth = 2; hg.strokeRect(p.x0 + i * 1.6, p.y0 + i * 1.6, w - i * 3.2, h - i * 3.2); }
      // rãnh ghép + mép sáng (mòn sơn) trên lớp màu
      g.strokeStyle = "rgba(0,0,0,.6)"; g.lineWidth = 3; g.strokeRect(p.x0 + 0.5, p.y0 + 0.5, w - 1, h - 1);
      g.strokeStyle = "rgba(255,255,255,.07)"; g.lineWidth = 2; g.strokeRect(p.x0 + 5, p.y0 + 5, w - 10, h - 10);
      // đinh tán 4 góc
      for (const [bx, by] of [[13, 13], [w - 13, 13], [13, h - 13], [w - 13, h - 13]]) {
        const x = p.x0 + bx, y = p.y0 + by;
        const rgd = g.createRadialGradient(x - 1.5, y - 1.5, 0.5, x, y, 5); rgd.addColorStop(0, css(steel, 1.5)); rgd.addColorStop(1, css(steel, 0.7));
        g.fillStyle = rgd; g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill();
        const hgd = hg.createRadialGradient(x, y, 0, x, y, 6); hgd.addColorStop(0, "#ffffff"); hgd.addColorStop(1, "#808080");
        hg.fillStyle = hgd; hg.beginPath(); hg.arc(x, y, 6, 0, 7); hg.fill();
        rg.fillStyle = "rgb(80,80,80)"; rg.beginPath(); rg.arc(x, y, 5, 0, 7); rg.fill();
      }
    }

    // ---- 2. dùng lâu: bẩn loang (nhân tối) + xước + chữ in khu vực
    g.save(); g.globalCompositeOperation = "multiply"; g.globalAlpha = 0.55; g.drawImage(grime, 0, 0); g.restore();
    rg.save(); rg.globalAlpha = 0.35; rg.globalCompositeOperation = "overlay"; rg.drawImage(grime, 0, 0); rg.restore();
    for (let i = 0; i < 420; i++) {
      const x = rnd(0, W), y = rnd(0, H), a = rnd(0, Math.PI), l = rnd(8, 55);
      g.strokeStyle = `rgba(255,255,255,${rnd(0.04, 0.11).toFixed(3)})`; g.lineWidth = rnd(0.6, 1.4);
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
      rg.strokeStyle = "rgba(70,70,70,.6)"; rg.lineWidth = 1; rg.beginPath(); rg.moveTo(x, y); rg.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); rg.stroke();
    }
    const TAGS = ["DECK 3", "B-07", "SEC 12", "A-21", "HULL 4", "C-03", "▲ 18", "KEEP CLEAR", "LVL 2"];
    g.font = "800 30px Arial, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
    for (let i = 0; i < 9; i++) {
      const p = plates[Math.floor(Math.random() * plates.length)];
      if (p.type !== "paint" || p.x1 - p.x0 < 120) continue;
      g.save(); g.translate((p.x0 + p.x1) / 2, (p.y0 + p.y1) / 2); if (Math.random() < 0.3) g.rotate(Math.PI / 2);
      g.fillStyle = "rgba(235,240,255,.13)"; g.fillText(TAGS[i % TAGS.length], 0, 0); g.restore();
    }

    // ---- 3. bóng tối sát chân tường (theo mê cung của câu này)
    const band = (x, y, len, horiz) => {
      const S = 38;
      const gd = horiz ? g.createLinearGradient(0, y - S, 0, y + S) : g.createLinearGradient(x - S, 0, x + S, 0);
      gd.addColorStop(0, "rgba(0,0,0,0)"); gd.addColorStop(0.5, "rgba(0,0,0,.55)"); gd.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = gd; horiz ? g.fillRect(x - 8, y - S, len + 16, S * 2) : g.fillRect(x - S, y - 8, S * 2, len + 16);
    };
    for (let r = 0; r <= ROWS; r++) for (let c = 0; c < COLS; c++) {
      const a = on(r - 1, c), b = on(r, c);
      if ((a || b) && !(a && b && grid[r - 1][c].d)) band(c * P, r * P, P, true);
    }
    for (let c = 0; c <= COLS; c++) for (let r = 0; r < ROWS; r++) {
      const a = on(r, c - 1), b = on(r, c);
      if ((a || b) && !(a && b && grid[r][c - 1].r)) band(c * P, r * P, P, false);
    }

    // ---- 4. mép giáp khoảng trống / mép trạm: sọc cảnh báo vàng-đen + đèn đường băng
    const hazard = (x, y, w, h) => {
      g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
      g.fillStyle = "#1c1c1f"; g.fillRect(x, y, w, h);
      g.fillStyle = "#d9a91a";
      for (let t = -h - 30; t < w + h + 30; t += 26) { g.beginPath(); g.moveTo(x + t, y); g.lineTo(x + t + 13, y); g.lineTo(x + t + 13 - h, y + h); g.lineTo(x + t - h, y + h); g.fill(); }
      g.restore();
      rg.fillStyle = "rgb(185,185,185)"; rg.fillRect(x, y, w, h);
    };
    const B = 18, L = 30;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      if (!on(r, c)) continue;
      const x = c * P, y = r * P;
      const sides = [[!on(r - 1, c), x, y + 8, P, B, true], [!on(r + 1, c), x, y + P - 8 - B, P, B, true],
                     [!on(r, c - 1), x + 8, y, B, P, false], [!on(r, c + 1), x + P - 8 - B, y, B, P, false]];
      for (const [edge, hx, hy, hw, hh, horiz] of sides) {
        if (!edge) continue;
        hazard(hx, hy, hw, hh);
        for (let k = L / 2; k < P; k += L) {             // đèn nhỏ cách đều dọc mép
          const lx = horiz ? hx + k : hx + hw + (hx < x + P / 2 ? 12 : -12), ly = horiz ? hy + hh + (hy < y + P / 2 ? 12 : -12) : hy + k;
          g.fillStyle = "#cfefff"; g.beginPath(); g.arc(lx, ly, 3.2, 0, 7); g.fill();
          eg.fillStyle = "rgb(90,210,255)"; eg.beginPath(); eg.arc(lx, ly, 3.4, 0, 7); eg.fill();
          hg.fillStyle = "#c0c0c0"; hg.beginPath(); hg.arc(lx, ly, 4, 0, 7); hg.fill();
        }
      }
    }

    // ---- 5. vòng xuất phát
    if (start) {
      const x = (start.c + 0.5) * P, y = (start.r + 0.5) * P;
      g.save(); g.strokeStyle = "rgba(250,204,21,.6)"; g.lineWidth = 5; g.setLineDash([22, 12]);
      g.beginPath(); g.arc(x, y, 56, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
      g.lineWidth = 2; g.strokeStyle = "rgba(250,204,21,.35)"; g.beginPath(); g.arc(x, y, 66, 0, Math.PI * 2); g.stroke(); g.restore();
      eg.strokeStyle = "rgba(120,95,10,1)"; eg.lineWidth = 5; eg.setLineDash([22, 12]); eg.beginPath(); eg.arc(x, y, 56, 0, Math.PI * 2); eg.stroke(); eg.setLineDash([]);
    }

    // ---- 5b. (1f) ANDREW STUDIO KHẮC CHÌM trên boong — thầy: "nhỏ hơn, tối hơn, chỉ cần như khắc trên sàn, không cần sáng lên".
    // Không đèn, không vàng: rãnh chữ tối + mép dưới rãnh bắt chút sáng (từ bản đồ độ cao) + lớp sơn mòn xám nhạt rất mờ.
    if (logo) {
      const x0 = logo.c0 * P + 24, x1 = (logo.c1 + 1) * P - 24, cx = (x0 + x1) / 2, cy = (logo.r + 0.5) * P;
      const font = f => `900 ${f}px "Arial Black", "Segoe UI Black", Arial, sans-serif`;
      let fs = 58; g.letterSpacing = "6px"; g.font = font(fs);
      while (g.measureText("ANDREW").width > (x1 - x0) * 0.62 && fs > 22) { fs -= 2; g.font = font(fs); }
      const fs2 = Math.round(fs * 0.4), sp2 = `${Math.round(fs * 0.3)}px`, ya = cy - fs * 0.24, yb = cy + fs * 0.5;
      const draw = (ctx, fill, dx = 0, dy = 0) => {
        ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = fill;
        ctx.font = font(fs); ctx.letterSpacing = "6px"; ctx.fillText("ANDREW", cx + dx, ya + dy);
        ctx.font = font(fs2); ctx.letterSpacing = sp2; ctx.fillText("STUDIO", cx + dx + fs * 0.15, yb + dy);
      };
      // khung khắc mảnh quanh cụm chữ
      const bw = fs * 4.6, bh = fs * 1.55, bx = cx - bw / 2, by = cy - bh / 2 - fs * 0.02;
      g.strokeStyle = "rgba(0,0,0,.45)"; g.lineWidth = 3; g.strokeRect(bx, by, bw, bh);
      g.strokeStyle = "rgba(255,255,255,.06)"; g.lineWidth = 1.5; g.strokeRect(bx + 2, by + 2, bw, bh);
      hg.strokeStyle = "#3a3a3a"; hg.lineWidth = 3; hg.strokeRect(bx, by, bw, bh);
      draw(g, "rgba(0,0,0,.5)", 2, 3);                  // lòng rãnh tối (bóng trong rãnh)
      draw(g, "rgba(150,160,180,.32)");                 // sơn mòn trong rãnh, xám nhạt rất mờ
      draw(hg, "#2a2a2a");                              // chìm xuống ⇒ mép chữ bắt sáng nhẹ
      draw(rg, "rgb(205,205,205)");                     // rãnh nhám hơn sàn
      [g, hg, eg, rg].forEach(x => { x.letterSpacing = "0px"; });
    }

    // ---- 6. cắt theo hình map (ô không sàn = trong suốt)
    const mg = mask.getContext("2d"); mg.clearRect(0, 0, W, H); mg.fillStyle = "#fff";
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (on(r, c)) mg.fillRect(c * P - 0.5, r * P - 0.5, P + 1, P + 1);
    g.save(); g.globalCompositeOperation = "destination-in"; g.drawImage(mask, 0, 0); g.restore();

    // ---- 7. độ cao ⇒ pháp tuyến (Sobel), mượt nhẹ trước cho khỏi răng cưa
    const ng = cv.normal.getContext("2d");
    ng.filter = "blur(0.8px)"; ng.drawImage(hcv, 0, 0); ng.filter = "none";
    const hd = ng.getImageData(0, 0, W, H).data, out = ng.createImageData(W, H), od = out.data, S = 2.2 / 255;
    for (let y = 0; y < H; y++) {
      const y0 = y > 0 ? y - 1 : y, y1 = y < H - 1 ? y + 1 : y;
      for (let x = 0; x < W; x++) {
        const x0 = x > 0 ? x - 1 : x, x1 = x < W - 1 ? x + 1 : x;
        const dx = (hd[(y * W + x1) * 4] - hd[(y * W + x0) * 4]) * S, dy = (hd[(y1 * W + x) * 4] - hd[(y0 * W + x) * 4]) * S;
        let nx = -dx, ny = dy, nz = 1; const l = 1 / Math.sqrt(nx * nx + ny * ny + 1); nx *= l; ny *= l; nz *= l;
        const i = (y * W + x) * 4;
        od[i] = (nx * 0.5 + 0.5) * 255; od[i + 1] = (ny * 0.5 + 0.5) * 255; od[i + 2] = (nz * 0.5 + 0.5) * 255; od[i + 3] = 255;
      }
    }
    ng.putImageData(out, 0, 0);
    return cv;
  }
  return { canvases: cv, paint, W, H };
}
