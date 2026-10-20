// RACING WORDS mẫu 5i (20/10/2026) = padui-5g + bàn đạp BOOST trên iPad cũng hiện KHÚC BOOST MẤT (đỏ → xịt xuống + khói đen, rw-bloss-5i.js) như màn lớn.
//   Tin "i:" không đổi (đường nối padlink-5e giữ nguyên): iPad tự nhận ra boost TỤT ĐỘT NGỘT giữa 2 tin — tin tới ~4 lần / giây, đốt boost liên tục chỉ tụt ~3,5 % / tin
//   ⇒ tụt > 7,5 % giữa 2 tin mới tính (ngưỡng CHUNG: ở chế độ trả lời trên iPad, ga đạp ở màn lớn — iPad không biết có đang đạp không).
//   Sai câu và trúng tên lửa (mất boost) đều hiện — cả hai đều là boost bị mất. Boost off < 7,5 % thì iPad không hiện (màn lớn vẫn hiện).
//   Màn chọn vai + iPad drone giữ nguyên 5g.
import { mountPadApp as mountPadApp5g, mountPadChooser, mountDroneApp } from "./sr3d-padui-5g.js";
import { lossFx } from "./rw-bloss-5i.js";
export { mountPadChooser, mountDroneApp };

export function mountPadApp(mount, o) {
  const r = mountPadApp5g(mount, o);
  const gas = mount.querySelector(".ip-gas");
  let last = null;
  const setInfo = r.setInfo.bind(r);
  r.setInfo = i => {
    const n = Math.max(0, Math.min(1, +i.nitro || 0));
    if (last != null && gas && i.phase === "race" && last - n > 0.075) lossFx(gas, last, n);
    last = n;
    setInfo(i);
  };
  return r;
}
