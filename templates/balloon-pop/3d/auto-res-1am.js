// =============================================================
// TRAIN RUSH — TỰ GIỮ 60 KHUNG/GIÂY (mẫu 1am, 05/10/2026). Chép ý từ AWord templates/rocket-race/rr3d-autores.js (Đợt 399 + 446),
// thêm một nấc riêng cho MSAA vì đo trên TOMKO (Quadro T2000, màn 4K, DPR 1,25, trong myActivity) MSAA 4 mẫu HalfFloat là phần TỐN NHẤT:
//   1,25 + MSAA 4 ⇒ 36 fps · 1,0 + MSAA 4 ⇒ 48 · 1,25 + MSAA 0 ⇒ 53 · 1,0 + MSAA 0 ⇒ 59,5 (card 87 %) · bloom / bóng đổ ⇒ gần như không đổi.
// Thang chất lượng (cao ⇒ thấp): [max, MSAA 4] → [max, MSAA 0] → max − 0,1 … min (MSAA 0).
//   Máy đủ khoẻ: giữ nguyên nấc đầu (đúng như 1al: MSAA 4 chống lấp loá vật mảnh). Máy không kịp: bỏ MSAA TRƯỚC, rồi mới hạ độ nét.
// Đo NHỊP KHUNG THẬT (khoảng cách 2 lần rAF), mỗi 40 khung: trung bình > 18,2 ms ⇒ xuống 1 nấc (> 24 ms ⇒ 2 nấc);
// êm (< 17,4 ms) liên tục ~7 s ⇒ THỬ lên 1 nấc; thử lên mà rớt ngay ⇒ chốt TRẦN tại nấc dưới (hết nhấp nhả).
// TRẦN TỪ TRANG CHỦ: `window.__awMaxPR` (myActivity v2.27.0 đặt 1,0 trên màn 4K) — đọc lại mỗi khung, đặt muộn vẫn ăn.
// NHỚ nấc đã êm theo `key` + cỡ cửa sổ (localStorage `aw.bp3d.q.<key>.<WxH>@<dpr>`) ⇒ ván sau / buổi sau vào thẳng nấc đó.
//   const aq = makeAutoQuality({ max: 1.5, min: 0.8, key: "single", apply: ({ pr, msaa }) => { ... } });  mỗi khung vẽ: aq.frame(rAFts)
// =============================================================
const hostCap = () => { const v = +window.__awMaxPR; return v > 0 ? v : Infinity; };
const memKey = key => key ? "aw.bp3d.q." + key + "." + window.innerWidth + "x" + window.innerHeight + "@" + (window.devicePixelRatio || 1) : "";
const memGet = k => { try { const v = JSON.parse(localStorage.getItem(k) || "null"); return v && v.pr > 0 ? v : null; } catch { return null; } };
const memSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } };
const r2 = v => Math.round(v * 100) / 100;

export function makeAutoQuality({ max, min = 0.8, msaa = 4, apply, key = "" }) {
  let hc = hostCap(), levels = [];
  const build = () => {
    const top = r2(Math.min(max, hc)), lo = Math.min(min, top);
    levels = [{ pr: top, msaa }];
    if (msaa) levels.push({ pr: top, msaa: 0 });
    for (let p = r2(top - 0.1); p > lo + 1e-6; p = r2(p - 0.1)) levels.push({ pr: p, msaa: 0 });
    if (top > lo) levels.push({ pr: r2(lo), msaa: 0 });
  };
  const nearest = q => { let best = 0, d = Infinity; levels.forEach((l, i) => { const e = Math.abs(l.pr - q.pr) + (l.msaa !== q.msaa ? 0.05 : 0); if (e < d) { d = e; best = i; } }); return best; };
  build();
  const mk = memKey(key), learned = memGet(mk);
  let idx = learned ? nearest(learned) : 0, capIdx = 0;
  let sum = 0, n = 0, calm = 0, probing = false, lastT = 0, drops = 0, saved = learned ? JSON.stringify(learned) : "";
  let pending = idx !== 0 || levels[0].pr !== r2(max);   // khởi đầu khác cấu hình nơi gọi đã dựng ⇒ áp ở khung ĐẦU
  const cur = () => levels[idx];
  const save = () => { const s = JSON.stringify(cur()); if (mk && s !== saved) { saved = s; memSet(mk, cur()); } };
  const go = i => { i = Math.max(0, Math.min(levels.length - 1, i)); if (i !== idx) { idx = i; apply(cur()); } };
  const self = {
    get pr() { return cur().pr; },
    get msaa() { return cur().msaa; },
    get info() { return { ...cur(), level: idx, levels: levels.length, cap: capIdx, drops, hostCap: hc === Infinity ? null : hc, learned: learned || null }; },
    frame(now) {
      const h = hostCap();
      if (h !== hc) { const q = cur(); hc = h; build(); idx = nearest(q); capIdx = Math.min(capIdx, idx); apply(cur()); lastT = 0; return; }
      if (pending) { pending = false; apply(cur()); lastT = 0; return; }
      if (lastT) { const d = now - lastT; if (d > 0 && d < 100) { sum += d; n++; } }   // > 100 ms = vừa đóng băng/ẩn/dịch shader — bỏ qua
      lastT = now;
      if (n < 40) return;
      const avg = sum / n; sum = 0; n = 0;
      if (avg > 18.2) {
        drops++;
        if (probing) capIdx = Math.min(levels.length - 1, idx + 1);
        probing = false; calm = 0;
        go(idx + (avg > 24 ? 2 : 1));
        save();
      } else if (avg < 17.4) {
        if (probing) save();                                    // vừa nâng mà vẫn êm ⇒ nhớ nấc mới
        probing = false;
        if (++calm >= 10 && idx > capIdx) { calm = 0; probing = true; go(idx - 1); }
      } else calm = 0;
    },
    pause() { lastT = 0; sum = 0; n = 0; }
  };
  return self;
}
