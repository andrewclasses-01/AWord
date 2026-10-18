// RACING WORDS mẫu 4h (18/10/2026) — THANH LOADING CHIA ĐỀU THEO THỜI GIAN (thầy: "load đoạn đầu nhanh nhưng dừng ở 99 % khá lâu… cần chia đều %").
// Gốc cũ: % tính theo BYTE tải về ⇒ tải xong rất nhanh (mạng tốt) nhưng còn bước DỰNG game (trước 4h đơ ~20 s vì bóng xe) không có trong % ⇒ kẹt 99.
// Nay: thanh chia theo CHẶNG có thời gian dự kiến — "files" (tải) · "cars" (xe giải nén) · "race" (dựng trận) · "studio" (dựng xưởng) · "frame" (khung đầu đã vẽ = xong).
//   · Thời gian từng chặng NHỚ THEO MÁY (localStorage, trung bình trượt) ⇒ lần sau thanh chạy đều tay đúng nhịp máy đó.
//   · Trong một chặng: chạy THẲNG theo đồng hồ tới 85 % chặng; quá giờ dự kiến thì bò chậm dần (không đứng hình), không vượt mốc chặng sau.
//   · Mốc tới SỚM ⇒ đuổi lên mượt (không nhảy cóc); có số byte thật (bytes(): 0–1) thì chặng tải không tụt sau byte thật.
//   · ⭐ Dựng trận / vẽ khung đầu KHOÁ luồng chính ~1–2 s (đo máy nhà 1,7 s) ⇒ JS không vẽ được. paint(p, ahead, sec): thanh đặt tới giá trị
//     DỰ KIẾN sau `sec` giây bằng CSS transition (card đồ hoạ tự chạy kể cả khi luồng chính bận) ⇒ thanh vẫn nhích đều lúc trình duyệt bận.
//   · done() ⇒ chạy nốt tới 100 % trong ~0,35 s rồi gọi hàm kết thúc.
// Dùng: const lp = createLoadPace({ key: "rw", paint: (p, ahead, sec) => …, bytes: () => 0.4 }); lp.mark("cars"); … lp.done(() => ẩn màn chờ);  lp.stop() khi bỏ ngang.
export const LOAD_STEPS = ["files", "cars", "race", "studio", "frame"];
const DEF = { files: 3.0, cars: 0.35, race: 0.6, studio: 0.3, frame: 0.8 };   // giây — lần đầu trên máy (chưa có số đo)
const AHEAD = 1.6;                                                              // giây "chạy trước" bằng CSS (đo máy nhà: luồng chính khoá 1,5–2,2 s)

export function createLoadPace({ key = "rw", paint = () => {}, bytes = null } = {}) {
  const STEPS = LOAD_STEPS, LS = "loadpace." + key;
  let mem = null; try { mem = JSON.parse(localStorage.getItem(LS) || "null"); } catch (e) { mem = null; }
  const dur = {}; STEPS.forEach(k => { const v = mem && +mem[k]; dur[k] = v > 0.02 && v < 120 ? v : DEF[k]; });
  const total = STEPS.reduce((a, k) => a + dur[k], 0);
  const F = []; let acc = 0; STEPS.forEach(k => { F.push(acc / total); acc += dur[k]; }); F.push(1);   // F[i] = phần thanh lúc BẮT ĐẦU chặng i
  const t0 = performance.now(), at = {};   // at[k] = giây thật lúc chặng k XONG
  let cur = 0, curT = 0, shown = 0, raf = 0, ending = null, endAt = 0, ended = false;
  const now = () => (performance.now() - t0) / 1000;
  const target = t => {
    const d = dur[STEPS[cur]] || 0.3, x = (t - curT) / d;
    const fr = x < 0.85 ? x : 0.85 + 0.15 * (1 - Math.exp(-(x - 0.85) / 0.6));        // quá giờ ⇒ bò chậm dần, không chạm mốc sau
    let p = F[cur] + (F[cur + 1] - F[cur]) * Math.min(0.995, fr);
    if (cur === 0 && bytes) { try { const b = Math.max(0, Math.min(1, +bytes() || 0)); p = Math.max(p, F[1] * b * 0.98); } catch (e) { /* */ } }
    return Math.min(0.995, p);
  };
  let last = performance.now(), cssA = 0, cssB = 0, cssT = performance.now(), cssS = 1;   // lần vẽ trước: CSS đang chạy từ cssA tới cssB trong cssS giây
  const cssNow = tn => cssA + (cssB - cssA) * Math.min(1, (tn - cssT) / 1000 / cssS);   // thanh ĐANG ở đâu (card đồ hoạ tự chạy) ⇒ chữ % khớp thanh sau lúc bận
  const frame = () => {
    const tNow = performance.now(), dt = Math.min(0.1, (tNow - last) / 1000); last = tNow;
    if (ending) {
      const left = Math.max(0, endAt - tNow) / 1000;
      shown = left <= 0 ? 1 : shown + (1 - shown) * Math.min(1, dt / Math.max(dt, left));
      paint(shown, 1, Math.max(0.05, left));
      if (left <= 0) { ended = true; save(); const f = ending; ending = null; setTimeout(f, 60); return; }
    } else {
      const goal = target(now()), vMax = 2.5 / total;                              // đuổi lên mượt: tối đa ~2,5 lần nhịp thường
      if (goal > shown) shown = Math.min(goal, shown + vMax * dt);
      shown = Math.max(shown, Math.min(cssNow(tNow), 0.995));                        // sau lúc luồng chính bận: chữ % theo kịp thanh, không nhảy
      // chạy trước: theo nhịp ĐỀU dự kiến (1/total mỗi giây) — lúc luồng chính bận, các chặng sau vẫn đang qua mà JS chưa biết; trần 97 %
      const ahead = Math.min(0.97, Math.max(shown, target(now() + AHEAD), shown + AHEAD / total));
      paint(shown, ahead, AHEAD); cssA = shown; cssB = ahead; cssT = tNow; cssS = AHEAD;
    }
    raf = requestAnimationFrame(frame);
  };
  const save = () => {
    const m = {}; let prev = 0;
    STEPS.forEach(k => { if (at[k] != null) { const real = Math.max(0.05, at[k] - prev); m[k] = mem && +mem[k] > 0 ? mem[k] * 0.5 + real * 0.5 : real; prev = at[k]; } else m[k] = dur[k]; });
    try { localStorage.setItem(LS, JSON.stringify(m)); } catch (e) { /* */ }
  };
  raf = requestAnimationFrame(frame);
  return {
    mark(k) {                                     // chặng k XONG
      const i = STEPS.indexOf(k); if (i < 0 || at[k] != null) return;
      const t = now(); STEPS.slice(0, i + 1).forEach(s => { if (at[s] == null) at[s] = t; });
      if (i + 1 > cur) { cur = Math.min(STEPS.length - 1, i + 1); curT = t; }
    },
    done(fn) { if (ended) { fn && fn(); return; } if (ending) return; STEPS.forEach(k => { if (at[k] == null) at[k] = now(); }); ending = fn || (() => {}); endAt = performance.now() + 350; },
    stop() { cancelAnimationFrame(raf); },
    get expected() { return { ...dur, total }; },
    get times() { return { ...at }; }
  };
}
