// =============================================================
// ROCKET RACE 3D — bộ tiếng THẬT của trận Fight 3D (Đợt 392, 26/9/2026).
// File mp3 trong ./sfx/ — nguồn và giấy phép (tất cả CC0) ở sfx/NGUON AM THANH.md.
// Chạy qua core/sfx.js (createPack: nạp trước, blob, tôn trọng nút 🔊 tắt tiếng).
// Chỉ được import() ĐỘNG từ nhánh Fight 3D — file mp3 không bao giờ tải ở Solo/Teams.
// =============================================================
import { createPack } from "../../core/sfx.js";
import { sound as coreSound } from "../../core/sound.js";

const NAMES = ["ambient", "engine", "fire", "boost", "stall", "hit1", "hit2", "hit3", "boom", "boomlow",
  "turbo", "tap", "gate", "portal", "win", "whoosh", "v3", "v2", "v1", "vgo", "vwin"];
const pack = createPack(import.meta.url, {
  names: NAMES,
  hot: ["boost", "stall", "tap", "whoosh", "v3", "v2", "v1", "vgo"],
  skip: ["ambient"],                 // nhạc nền dài: phát kiểu stream, đừng kéo trước cho nghẽn
  dir: "sfx"
});

// Âm lượng gốc từng tiếng (file Kenney to nhỏ không đều — chỉnh tai theo nhau)
const BASE = { ambient: 0.35, engine: 0.3, fire: 0.6, boost: 0.55, stall: 0.6, boom: 0.85, boomlow: 0.9,
  turbo: 0.6, tap: 0.5, gate: 0.7, portal: 0.7, win: 0.8, whoosh: 0.7, v3: 0.9, v2: 0.9, v1: 0.9, vgo: 0.95, vwin: 0.95 };

export function createRr3dSound() {
  const loops = new Map();            // tên → { el, vol } các tiếng lặp đang MUỐN chạy
  let paused = false;
  function vol(name, v) { return Math.max(0, Math.min(1, (v ?? 1) * (BASE[name] ?? 0.8))); }
  function play(name, v) {
    if (paused) return null;
    try { return pack.play(name, vol(name, v)); } catch { return null; }
  }
  function loop(name, on, v) {
    const cur = loops.get(name);
    if (!on) {
      if (cur) { loops.delete(name); try { cur.el && cur.el.pause(); } catch { /* ignore */ } }
      return;
    }
    if (cur) return;
    const rec = { el: null, vol: vol(name, v) };
    loops.set(name, rec);
    startLoop(name, rec);
  }
  function startLoop(name, rec) {
    if (paused || coreSound.isMuted()) return;
    try {
      const a = pack.play(name, rec.vol);
      if (a) { a.loop = true; rec.el = a; }
    } catch { /* ignore */ }
  }
  // Nút 🔊 tắt/bật giữa trận: tiếng lặp phải tắt/bật theo (pack.play chỉ chặn tiếng MỚI).
  const muteTimer = setInterval(() => {
    const m = coreSound.isMuted();
    loops.forEach((rec, name) => {
      if ((m || paused) && rec.el && !rec.el.paused) { try { rec.el.pause(); } catch { /* ignore */ } }
      else if (!m && !paused) {
        if (!rec.el) startLoop(name, rec);
        else if (rec.el.paused) { try { rec.el.play().catch(() => {}); } catch { /* ignore */ } }
      }
    });
  }, 400);
  return {
    play, loop,
    pause(on) { paused = !!on; },
    stopAll() {
      clearInterval(muteTimer);
      loops.forEach(rec => { try { rec.el && rec.el.pause(); } catch { /* ignore */ } });
      loops.clear();
    }
  };
}
