// =============================================================
// ROCKET RACE 3D — TỰ GIỮ 60 KHUNG/GIÂY (Đợt 399; nguồn myGame rocket-race/core/auto-res.js, mẫu 5c, thầy 26/9/2026: "hiệu suất, độ mượt, nhạy tối đa" khi chạy trong myActivity trên TOMKO).
// Đo NHỊP KHUNG THẬT (khoảng cách giữa 2 lần rAF được vẽ). Máy không kịp (trung bình > 18,2 ms = rớt dưới ~55 khung) ⇒ HẠ độ nét
// (tỉ lệ điểm ảnh) một nấc; êm liên tục ~7 s ⇒ THỬ nâng lại 0,05. Thử nâng mà rớt ngay ⇒ chốt TRẦN thấp hơn (hết nhấp nhả).
// Không đổi gì khi máy đủ khoẻ (giữ nguyên độ nét tối đa). Đổi độ nét chỉ cấp lại bộ đệm vẽ — không dựng lại cảnh/bảng.
//   const ar = makeAutoRes({ max: 1.5, min: 0.8, key: "race", apply: pr => { ... } });  mỗi khung vẽ: ar.frame(rAFtimestamp)
// ⭐ Đợt 446 (thầy 2/10/2026, đo trên TOMKO: card 100 %, mỗi cảnh mới giật ~40 khung 50–133 ms rồi mới hạ độ nét):
//   (1) TRẦN TỪ TRANG CHỦ: `window.__awMaxPR` (myActivity v2.27.0 đặt 1,0 trên màn 4K) ⇒ không bao giờ vẽ nét hơn trần đó.
//       Đọc lại MỖI khung (rẻ) nên đặt muộn — sau khi cảnh đã dựng — vẫn ăn. Không có biến ⇒ y như cũ.
//   (2) NHỚ MỨC ĐÃ ÊM theo `key` + cỡ cửa sổ (localStorage): cảnh sau / ván sau / buổi sau vào THẲNG mức đó thay vì
//       bắt đầu ở mức cao nhất rồi giật lại từ đầu. Vẫn thử nâng 0,05 khi êm ~7 s như cũ ⇒ máy khoẻ lên thì tự nét lại.
//   Mức khởi đầu ≠ max ⇒ `apply()` gọi ở khung ĐẦU (không gọi trong hàm dựng: nơi gọi có thể chưa gán xong biến).
// ⭐ Đợt 478 (05/10/2026, thầy: "check Rocket race cũng đã tối ưu chưa" — sau TRAIN RUSH / STAR LOOT Đợt 475–477):
//   (3) NẤC MSAA (tuỳ chọn `aa: { on, set(on) }`): máy không kịp ⇒ BỎ MSAA TRƯỚC, rồi mới hạ độ nét (chữ ô đáp án giữ nét — đúng ý sàn 1,0).
//       Đo 2 game kia trên TOMKO: MSAA 4 HalfFloat là phần đắt nhất. Rocket Race chạy KHÔNG trần (Chrome, DPR 1,25) chỉ hạ được tới 1,05 + MSAA 4
//       ⇒ 58,6 fps, 10–14 khung > 33 ms / 12 s. Êm lâu ở độ nét tối đa ⇒ thử bật lại MSAA; thử mà rớt ⇒ thôi hẳn. Nhớ theo cỡ cửa sổ (`.aa`).
//       Không truyền `aa` ⇒ y như cũ.
//   (4) Rớt 2 lần ở CÙNG một mức độ nét ⇒ chốt trần dưới mức đó (màn chờ nhẹ / lúc chơi nặng làm thử–rớt lặp mãi).
// =============================================================
const hostCap = () => { const v = +window.__awMaxPR; return v > 0 ? v : Infinity; };
const memKey = key => key ? "aw.rr3d.pr." + key + "." + window.innerWidth + "x" + window.innerHeight + "@" + (window.devicePixelRatio || 1) : "";
const memGet = k => { try { const v = +localStorage.getItem(k); return v > 0 ? v : 0; } catch { return 0; } };
const memSet = (k, v) => { try { localStorage.setItem(k, String(v)); } catch { /* ignore */ } };

export function makeAutoRes({ max, min = 0.8, apply, key = "", aa = null }) {
  let want = max, hc = hostCap();
  max = Math.min(want, hc);
  const mk = memKey(key), learned = memGet(mk);
  let pr = learned ? Math.max(Math.min(min, max), Math.min(max, learned)) : max;
  let cap = max, sum = 0, n = 0, calm = 0, probing = false, lastT = 0, drops = 0, saved = learned;
  let pending = pr !== want;                                    // khởi đầu khác mức nơi gọi đã dựng ⇒ áp ở khung đầu
  // Đợt 478: nấc MSAA + đếm rớt theo mức
  const aaKey = mk && mk + ".aa";
  let aaOn = !!(aa && aa.on), aaOK = true, aaProbe = false, aaFails = 0;
  if (aaOn && aaKey && (() => { try { return localStorage.getItem(aaKey) === "0"; } catch { return false; } })()) { aaOn = false; pending = true; }   // vẫn được thử bật lại 1 lần khi êm
  const fails = new Map();
  const setAA = on => { if (!aa || on === aaOn) return; aaOn = on; try { aa.set(on); } catch (e) { /* bỏ qua */ } if (aaKey) memSet(aaKey, on ? "1" : "0"); };
  const save = () => { if (mk && pr !== saved) { saved = pr; memSet(mk, pr); } };
  const set = v => { v = Math.round(v * 100) / 100; if (v !== pr) { pr = v; apply(pr); } };
  const self = {
    get pr() { return pr; },
    get aa() { return aaOn; },
    get info() { return { pr, cap, max, drops, hostCap: hc === Infinity ? null : hc, learned: learned || null, ...(aa ? { aa: aaOn, aaOK } : {}) }; },
    frame(now) {
      const h = hostCap();
      if (h !== hc) { hc = h; self.setMax(want); }
      if (pending) { pending = false; apply(pr); if (aa && !aaOn) try { aa.set(false); } catch (e) { /* bỏ qua */ } lastT = 0; return; }
      if (lastT) { const d = now - lastT; if (d > 0 && d < 100) { sum += d; n++; } }   // > 100 ms = vừa đóng băng/ẩn — bỏ qua
      lastT = now;
      if (n < 40) return;
      const avg = sum / n; sum = 0; n = 0;
      if (avg > 18.2) {
        drops++; calm = 0;
        if (aaOn) {                                             // Đợt 478: bỏ MSAA trước
          if (aaProbe || ++aaFails >= 2) aaOK = false;          // vừa thử bật lại mà rớt / rớt 2 lần khi đang bật ⇒ thôi hẳn
          aaProbe = false; probing = false; setAA(false); return;
        }
        aaProbe = false;
        const k = String(pr), f = (fails.get(k) || 0) + 1; fails.set(k, f);
        if (probing || f >= 2) cap = Math.max(min, pr - 0.05);   // Đợt 478: rớt 2 lần ở cùng mức ⇒ chốt trần
        probing = false;
        set(Math.max(min, pr - (avg > 24 ? 0.2 : 0.1)));
        save();
      } else if (avg < 17.4) {
        if (probing) save();                                    // vừa nâng mà vẫn êm ⇒ nhớ mức mới
        probing = false; aaProbe = false;
        if (++calm >= 10) {
          calm = 0;
          if (pr < cap) { probing = true; set(Math.min(cap, pr + 0.05)); }
          else if (aa && !aaOn && aaOK) { aaProbe = true; setAA(true); }   // Đợt 478: độ nét đã tối đa ⇒ thử bật lại MSAA
        }
      } else calm = 0;
    },
    setMax(m) { want = m; m = Math.min(m, hc); max = m; cap = Math.min(cap, m); if (pr > m) set(m); },   // cửa sổ đổi (tỉ lệ màn / chất lượng) ⇒ trần mới
    pause() { lastT = 0; sum = 0; n = 0; }
  };
  return self;
}
