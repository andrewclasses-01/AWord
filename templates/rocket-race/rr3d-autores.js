// =============================================================
// ROCKET RACE 3D — TỰ GIỮ 60 KHUNG/GIÂY (Đợt 399; nguồn myGame rocket-race/core/auto-res.js, mẫu 5c, thầy 26/9/2026: "hiệu suất, độ mượt, nhạy tối đa" khi chạy trong myActivity trên TOMKO).
// Đo NHỊP KHUNG THẬT (khoảng cách giữa 2 lần rAF được vẽ). Máy không kịp (trung bình > 18,2 ms = rớt dưới ~55 khung) ⇒ HẠ độ nét
// (tỉ lệ điểm ảnh) một nấc; êm liên tục ~7 s ⇒ THỬ nâng lại 0,05. Thử nâng mà rớt ngay ⇒ chốt TRẦN thấp hơn (hết nhấp nhả).
// Không đổi gì khi máy đủ khoẻ (giữ nguyên độ nét tối đa). Đổi độ nét chỉ cấp lại bộ đệm vẽ — không dựng lại cảnh/bảng.
//   const ar = makeAutoRes({ max: 1.5, min: 0.8, apply: pr => { ... } });  mỗi khung vẽ: ar.frame(rAFtimestamp)
// =============================================================
export function makeAutoRes({ max, min = 0.8, apply }) {
  let pr = max, cap = max, sum = 0, n = 0, calm = 0, probing = false, lastT = 0, drops = 0;
  const set = v => { v = Math.round(v * 100) / 100; if (v !== pr) { pr = v; apply(pr); } };
  return {
    get pr() { return pr; },
    get info() { return { pr, cap, max, drops }; },
    frame(now) {
      if (lastT) { const d = now - lastT; if (d > 0 && d < 100) { sum += d; n++; } }   // > 100 ms = vừa đóng băng/ẩn — bỏ qua
      lastT = now;
      if (n < 40) return;
      const avg = sum / n; sum = 0; n = 0;
      if (avg > 18.2) {
        drops++;
        if (probing) cap = Math.max(min, pr - 0.05);
        probing = false; calm = 0;
        set(Math.max(min, pr - (avg > 24 ? 0.2 : 0.1)));
      } else if (avg < 17.4) {
        probing = false;
        if (++calm >= 10 && pr < cap) { calm = 0; probing = true; set(Math.min(cap, pr + 0.05)); }
      } else calm = 0;
    },
    setMax(m) { max = m; cap = Math.min(cap, m); if (pr > m) set(m); },   // cửa sổ đổi (tỉ lệ màn / chất lượng) ⇒ trần mới
    pause() { lastT = 0; sum = 0; n = 0; }
  };
}
