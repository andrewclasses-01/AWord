// =============================================================
// qr.js — a tiny, self-contained QR CODE generator (no dependencies).
//
// WHY IT EXISTS: AWord needs a QR for every assignment link, and Teacher
// Andrew's other apps (myBoard, myActivity, mySpeaking...) need QR images to
// paste onto Google Sites. Pulling a library from a CDN would break offline
// use, so this file implements the encoder directly.
//
// REUSE IN ANOTHER APP: copy this ONE file, then
//     import { qrSvg, qrPngDataUrl } from "./qr.js";
//     el.innerHTML = qrSvg("https://example.com");            // crisp at any size
//     img.src = await qrPngDataUrl("https://example.com", 512); // for download/copy
// Nothing else in the file touches AWord, the DOM layout, or Firebase.
//
// SCOPE: byte mode (UTF-8), error-correction level M (~15% recoverable),
// versions 1..15 chosen automatically — plenty for links up to ~400 chars.
// =============================================================

// ---- Galois field GF(256) tables, used by Reed-Solomon ----------------------
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
(function buildTables() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;        // QR's generator polynomial
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();

function gfMul(a, b) {
  if (a === 0 || b === 0) return 0;
  return EXP[LOG[a] + LOG[b]];
}

// Reed-Solomon error correction bytes for one data block.
function rsEncode(data, ecLen) {
  // Build the generator polynomial for `ecLen` correction bytes.
  let gen = [1];
  for (let i = 0; i < ecLen; i++) {
    const next = new Array(gen.length + 1).fill(0);
    for (let j = 0; j < gen.length; j++) {
      next[j] ^= gen[j];
      next[j + 1] ^= gfMul(gen[j], EXP[i]);
    }
    gen = next;
  }
  const res = new Uint8Array(ecLen);
  for (const byte of data) {
    const factor = byte ^ res[0];
    res.copyWithin(0, 1);
    res[ecLen - 1] = 0;
    if (factor !== 0) {
      for (let i = 0; i < ecLen; i++) res[i] ^= gfMul(gen[i + 1], factor);
    }
  }
  return res;
}

// ---- Capacity tables for error-correction level M, versions 1..15 -----------
// [ total codewords, EC codewords per block, number of blocks in group 1,
//   number of blocks in group 2 ]  — group 2 blocks hold one extra data byte.
const VERSIONS = {
  1:  { total: 26,   ecPerBlock: 10, g1: 1,  g2: 0 },
  2:  { total: 44,   ecPerBlock: 16, g1: 1,  g2: 0 },
  3:  { total: 70,   ecPerBlock: 26, g1: 1,  g2: 0 },
  4:  { total: 100,  ecPerBlock: 18, g1: 2,  g2: 0 },
  5:  { total: 134,  ecPerBlock: 24, g1: 2,  g2: 0 },
  6:  { total: 172,  ecPerBlock: 16, g1: 4,  g2: 0 },
  7:  { total: 196,  ecPerBlock: 18, g1: 4,  g2: 0 },
  8:  { total: 242,  ecPerBlock: 22, g1: 2,  g2: 2 },
  9:  { total: 292,  ecPerBlock: 22, g1: 3,  g2: 2 },
  10: { total: 346,  ecPerBlock: 26, g1: 4,  g2: 1 },
  11: { total: 404,  ecPerBlock: 30, g1: 1,  g2: 4 },
  12: { total: 466,  ecPerBlock: 22, g1: 6,  g2: 2 },
  13: { total: 532,  ecPerBlock: 22, g1: 8,  g2: 1 },
  14: { total: 581,  ecPerBlock: 24, g1: 4,  g2: 5 },
  15: { total: 655,  ecPerBlock: 24, g1: 5,  g2: 5 }
};

// Where the alignment patterns go, per version (row/col centres).
const ALIGN = {
  1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34],
  7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50],
  11: [6, 30, 54], 12: [6, 32, 58], 13: [6, 34, 62], 14: [6, 26, 46, 66],
  15: [6, 26, 48, 70]
};

// Pre-computed 18-bit version information (versions 7+ only).
const VERSION_BITS = {
  7: 0x07c94, 8: 0x085bc, 9: 0x09a99, 10: 0x0a4d3, 11: 0x0bbf6,
  12: 0x0c762, 13: 0x0d847, 14: 0x0e60d, 15: 0x0f928
};

function blockLayout(v) {
  const info = VERSIONS[v];
  const blocks = info.g1 + info.g2;
  const dataTotal = info.total - info.ecPerBlock * blocks;
  const g1Len = Math.floor(dataTotal / blocks);
  return { ...info, blocks, dataTotal, g1Len };
}

function capacityBytes(v) {
  const { dataTotal } = blockLayout(v);
  // 4 bits mode + 8 or 16 bits length, rounded down to whole bytes.
  const headerBits = 4 + (v < 10 ? 8 : 16);
  return dataTotal - Math.ceil(headerBits / 8);
}

// ---- bit stream ------------------------------------------------------------
function bitWriter() {
  const bits = [];
  return {
    put(value, len) { for (let i = len - 1; i >= 0; i--) bits.push((value >> i) & 1); },
    get length() { return bits.length; },
    bits
  };
}

// ---- matrix ----------------------------------------------------------------
function makeMatrix(size) {
  // null = not yet written (so we know which modules are free for data)
  return Array.from({ length: size }, () => new Array(size).fill(null));
}

function placeFinder(m, row, col) {
  for (let r = -1; r <= 7; r++) {
    for (let c = -1; c <= 7; c++) {
      const rr = row + r, cc = col + c;
      if (rr < 0 || cc < 0 || rr >= m.length || cc >= m.length) continue;
      const inRing = (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
                     (c >= 0 && c <= 6 && (r === 0 || r === 6));
      const inCore = r >= 2 && r <= 4 && c >= 2 && c <= 4;
      m[rr][cc] = inRing || inCore ? 1 : 0;
    }
  }
}

function placeFunctionPatterns(m, version) {
  const size = m.length;
  placeFinder(m, 0, 0);
  placeFinder(m, 0, size - 7);
  placeFinder(m, size - 7, 0);

  // timing patterns
  for (let i = 8; i < size - 8; i++) {
    m[6][i] = i % 2 === 0 ? 1 : 0;
    m[i][6] = i % 2 === 0 ? 1 : 0;
  }

  // alignment patterns (skip the three finder corners)
  const centres = ALIGN[version];
  for (const r of centres) {
    for (const c of centres) {
      if ((r <= 8 && c <= 8) || (r <= 8 && c >= size - 9) || (r >= size - 9 && c <= 8)) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const ring = Math.max(Math.abs(dr), Math.abs(dc));
          m[r + dr][c + dc] = ring === 1 ? 0 : 1;
        }
      }
    }
  }

  m[size - 8][8] = 1;   // the one module that is always dark

  // reserve format areas (filled in later)
  for (let i = 0; i < 9; i++) {
    if (m[8][i] === null) m[8][i] = 0;
    if (m[i][8] === null) m[i][8] = 0;
  }
  for (let i = 0; i < 8; i++) {
    if (m[8][size - 1 - i] === null) m[8][size - 1 - i] = 0;
    if (m[size - 1 - i][8] === null) m[size - 1 - i][8] = 0;
  }

  // version information block (versions 7+)
  if (version >= 7) {
    const bits = VERSION_BITS[version];
    for (let i = 0; i < 18; i++) {
      const bit = (bits >> i) & 1;
      const r = Math.floor(i / 3), c = i % 3;
      m[size - 11 + c][r] = bit;
      m[r][size - 11 + c] = bit;
    }
  }
}

// Which modules are function patterns (never carry data / never masked).
function reservedMask(version, size) {
  const probe = makeMatrix(size);
  placeFunctionPatterns(probe, version);
  return probe.map(row => row.map(v => v !== null));
}

const MASKS = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (r, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0
];

// Format information: EC level M (binary 00) + mask id, BCH-protected.
function formatBits(maskId) {
  const data = (0 << 3) | maskId;         // 0b00 = level M
  let value = data << 10;
  for (let i = 4; i >= 0; i--) {
    if ((value >> (i + 10)) & 1) value ^= 0x537 << i;
  }
  return ((data << 10) | value) ^ 0x5412;  // standard XOR mask
}

// The two copies are laid out exactly as the spec requires — bit 0 (LSB) first,
// running DOWN column 8 for copy 1 and RIGHT-to-left along row 8 for copy 2.
// (Getting these two transposed still "looks like" a QR code but no scanner can
// read it — verified against an independent encoder, see core/qr-test.html.)
function placeFormat(m, maskId) {
  const size = m.length;
  const bits = formatBits(maskId);
  for (let i = 0; i < 15; i++) {
    const bit = (bits >> i) & 1;
    // copy 1 — column 8, top to bottom (row 6 is the timing pattern, skipped)
    if (i < 6) m[i][8] = bit;
    else if (i < 8) m[i + 1][8] = bit;
    else m[size - 15 + i][8] = bit;
    // copy 2 — row 8, right to left then wrapping to the left edge
    if (i < 8) m[8][size - 1 - i] = bit;
    else if (i === 8) m[8][7] = bit;
    else m[8][14 - i] = bit;
  }
}

// Penalty score used to pick the mask that looks least confusing to a scanner.
function penalty(m) {
  const size = m.length;
  let score = 0;

  // rule 1 — runs of 5+ same-colour modules
  const runScore = line => {
    let s = 0, run = 1;
    for (let i = 1; i < line.length; i++) {
      if (line[i] === line[i - 1]) { run++; if (run === 5) s += 3; else if (run > 5) s++; }
      else run = 1;
    }
    return s;
  };
  for (let i = 0; i < size; i++) {
    score += runScore(m[i]);
    score += runScore(m.map(r => r[i]));
  }

  // rule 2 — 2x2 blocks of one colour
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const v = m[r][c];
      if (v === m[r][c + 1] && v === m[r + 1][c] && v === m[r + 1][c + 1]) score += 3;
    }
  }

  // rule 3 — finder-like 1:1:3:1:1 patterns
  const PAT_A = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
  const PAT_B = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
  const hasPattern = (line, i, pat) => pat.every((v, k) => line[i + k] === v);
  for (let i = 0; i < size; i++) {
    const row = m[i], col = m.map(r => r[i]);
    for (let j = 0; j + 11 <= size; j++) {
      if (hasPattern(row, j, PAT_A) || hasPattern(row, j, PAT_B)) score += 40;
      if (hasPattern(col, j, PAT_A) || hasPattern(col, j, PAT_B)) score += 40;
    }
  }

  // rule 4 — imbalance between dark and light
  let dark = 0;
  for (const row of m) for (const v of row) if (v) dark++;
  const pct = (dark * 100) / (size * size);
  score += Math.floor(Math.abs(pct - 50) / 5) * 10;

  return score;
}

// ---- the encoder ------------------------------------------------------------

// Returns { size, modules } where modules[r][c] is 1 (dark) or 0 (light).
export function qrMatrix(text) {
  const bytes = new TextEncoder().encode(String(text));

  let version = 0;
  for (let v = 1; v <= 15; v++) {
    if (bytes.length <= capacityBytes(v)) { version = v; break; }
  }
  // Version 15 at level M holds 412 bytes — far more than any AWord link needs.
  if (!version) throw new Error("QR: text too long (max 412 characters)");

  const layout = blockLayout(version);

  // 1. bit stream: mode (byte) + length + data + terminator + padding
  const bw = bitWriter();
  bw.put(0b0100, 4);
  bw.put(bytes.length, version < 10 ? 8 : 16);
  for (const b of bytes) bw.put(b, 8);
  const capacityBits = layout.dataTotal * 8;
  bw.put(0, Math.min(4, capacityBits - bw.length));
  while (bw.length % 8 !== 0) bw.put(0, 1);
  const dataBytes = [];
  for (let i = 0; i < bw.bits.length; i += 8) {
    dataBytes.push(bw.bits.slice(i, i + 8).reduce((acc, b) => (acc << 1) | b, 0));
  }
  const PAD = [0xec, 0x11];
  while (dataBytes.length < layout.dataTotal) dataBytes.push(PAD[dataBytes.length % 2 === 0 ? 0 : 1]);

  // 2. split into blocks, add Reed-Solomon bytes, then interleave
  const dataBlocks = [], ecBlocks = [];
  let at = 0;
  for (let b = 0; b < layout.blocks; b++) {
    const len = b < layout.g1 ? layout.g1Len : layout.g1Len + 1;
    const block = dataBytes.slice(at, at + len);
    at += len;
    dataBlocks.push(block);
    ecBlocks.push(rsEncode(block, layout.ecPerBlock));
  }
  const finalBytes = [];
  const maxData = Math.max(...dataBlocks.map(b => b.length));
  for (let i = 0; i < maxData; i++) {
    for (const block of dataBlocks) if (i < block.length) finalBytes.push(block[i]);
  }
  for (let i = 0; i < layout.ecPerBlock; i++) {
    for (const block of ecBlocks) finalBytes.push(block[i]);
  }

  // 3. draw the patterns, then snake the data through the free modules
  const size = version * 4 + 17;
  const m = makeMatrix(size);
  placeFunctionPatterns(m, version);
  const reserved = reservedMask(version, size);

  const stream = [];
  for (const byte of finalBytes) for (let i = 7; i >= 0; i--) stream.push((byte >> i) & 1);

  let idx = 0, upward = true;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--;                      // skip the vertical timing column
    for (let step = 0; step < size; step++) {
      const row = upward ? size - 1 - step : step;
      for (const c of [col, col - 1]) {
        if (reserved[row][c]) continue;
        m[row][c] = idx < stream.length ? stream[idx] : 0;
        idx++;
      }
    }
    upward = !upward;
  }

  // 4. try every mask, keep the least-penalised one
  let best = null;
  for (let maskId = 0; maskId < 8; maskId++) {
    const cand = m.map(row => row.slice());
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!reserved[r][c] && MASKS[maskId](r, c)) cand[r][c] ^= 1;
      }
    }
    placeFormat(cand, maskId);
    const score = penalty(cand);
    if (!best || score < best.score) best = { score, modules: cand };
  }

  return { size, modules: best.modules, version };
}

// ---- output helpers ---------------------------------------------------------

// Crisp-at-any-size SVG string. `quiet` = white border in modules (spec says 4).
export function qrSvg(text, { quiet = 4, dark = "#000000", light = "#ffffff" } = {}) {
  const { size, modules } = qrMatrix(text);
  const dim = size + quiet * 2;
  // One path for every dark module keeps the file small and scaling perfect.
  let d = "";
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (modules[r][c]) d += `M${c + quiet} ${r + quiet}h1v1h-1z`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dim} ${dim}" ` +
         `shape-rendering="crispEdges" width="100%" height="100%">` +
         `<rect width="${dim}" height="${dim}" fill="${light}"/>` +
         `<path d="${d}" fill="${dark}"/></svg>`;
}

// Draw onto a canvas — the basis for PNG download and clipboard copy.
export function qrCanvas(text, px = 512, { quiet = 4, dark = "#000000", light = "#ffffff" } = {}) {
  const { size, modules } = qrMatrix(text);
  const dim = size + quiet * 2;
  const scale = Math.max(1, Math.floor(px / dim));   // whole pixels = no blur
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = dim * scale;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = dark;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (modules[r][c]) ctx.fillRect((c + quiet) * scale, (r + quiet) * scale, scale, scale);
    }
  }
  return canvas;
}

export function qrPngDataUrl(text, px = 512, opts) {
  return qrCanvas(text, px, opts).toDataURL("image/png");
}

// Put the QR on the clipboard as a real IMAGE (paste straight into Google Sites,
// Zalo, Word...). Falls back to copying the link text where the browser refuses.
export async function copyQrImage(text, px = 512, opts) {
  const canvas = qrCanvas(text, px, opts);
  const blob = await new Promise(res => canvas.toBlob(res, "image/png"));
  if (!blob || !navigator.clipboard || !window.ClipboardItem) throw new Error("clipboard-unsupported");
  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
}

// Save the QR as a .png file.
export function downloadQrPng(text, filename = "qr.png", px = 1024, opts) {
  const a = document.createElement("a");
  a.href = qrPngDataUrl(text, px, opts);
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
}
