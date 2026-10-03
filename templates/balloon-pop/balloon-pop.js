// =============================================================
// TEMPLATE: BALLOON POP = TRAIN RUSH 3D  (Đợt 450, thầy 03/10/2026)
//
// Thầy: "Bỏ dạng 2D của STAR LOOT và TRAIN RUSH đi, chỉ giữ dạng 3D cho mọi mode". Thầy chốt (AskUserQuestion):
//   • tạm CHƯA giao bài (`noAssignment`) — game ổn định rồi thầy mở sau · tạm CHƯA mở Showdown cho game 3D.
//   • thầy chưa từng giao bài Balloon pop ⇒ không cần giữ bản 2D cho bài cũ ⇒ bản 2D bị GỠ HẲN (lịch sử git trước Đợt 450).
// Hai chế độ, cùng một game TRAIN RUSH (myGame balloon-pop mẫu 1ak, chép vào ./3d bằng `python tools/chep-train-rush.py`):
//   • SINGLE — một bàn trọn màn (màn START, intro, Options, hàng nút riêng). Hàng nút NỐI THẬT qua cầu `ui.host` của engine:
//     Thư mục = act cùng thư mục · Options Apply ⇒ `activity.options.trainRush` + lưu act · Menu = Library + Change template ·
//     Mode ▸ Fight = MODE ▸ Fight của engine (ui.host.fight()).
//   • FIGHT — `ownFight` (Đợt 449): hai bàn trái–phải, intro điện ảnh, đếm 3-2-1. Single mode / Library trong bảng PAUSED.
// ⛔ Không sửa tay ./3d — sửa ở myGame (bản mới = tên mới), thầy OK rồi chạy lại công cụ chép.
// Ô game `.aw-tr-host` gắn vào <body> (phủ trọn trang; khung AWord có lớp tạo khung quy chiếu riêng), `html.aw-tr-on` khoá cuộn.
// Màn READY của engine bị bỏ qua (`startScreen` tự bấm Play) ⇒ thầy thấy thẳng màn START của TRAIN RUSH.
// Không gọi ui.finish (kết quả là màn của TRAIN RUSH) ⇒ đồng hồ engine không chạy (`manualTimerStart`).
// Data model (như Wordwall Balloon pop): activity.content.items[] = { keyword, definition } — editor + sample giữ nguyên.
// =============================================================

import { registerTemplate } from "../../core/registry.js";
import { resolveActivity } from "../../core/content-view.js";   // act từ vựng nhiều bộ nghĩa ⇒ đúng bộ đang chọn
import { openBalloonPopEditor } from "./balloon-pop-editor.js";
import { showLoader3d } from "../../core/loader3d.js";   // Đợt 451 — màn chờ thay khung trống lúc nạp 3D
const loader = () => { ensureTr3dCss(); return showLoader3d({ key: "trainrush", title: "TRAIN RUSH", theme: "west" }); };

// CSS của game (chép từ myGame) + phông miền Tây; nạp một lần khi game mở lần đầu.
const TR3D_CSS = ["bp3d.css", "bp3d-1j.css", "bp3d-1p.css", "bp3d-1q.css", "bp3d-1r.css", "bp3d-1ab.css", "fight-cine-1ae.css", "fight-1ak.css", "bp3d-1ak.css"];
const TR3D_FONTS = "https://fonts.googleapis.com/css2?family=Exo+2:ital,wght@1,800;1,900&family=Rye&display=swap";
// khoá Options của TRAIN RUSH (DEFAULTS trong 3d/bp3d-1ak.js) — lưu gọn trong activity.options.trainRush
const TR_KEYS = ["timerMode", "timer", "levels", "pointsOff", "balloonSpeed", "trainSpeed", "shuffle", "showAnswers", "bonusTime", "bonusPoints", "bonusX2"];

let webglOk = null;
function canRun3d() {
  if (webglOk !== null) return webglOk;
  try { const c = document.createElement("canvas"); webglOk = !!(c.getContext("webgl2") || c.getContext("webgl")); }
  catch (e) { webglOk = false; }
  return webglOk;
}
function ensureTr3dCss() {
  if (document.querySelector("link[data-tr3d]")) return;
  [TR3D_FONTS, ...TR3D_CSS.map(f => new URL("./3d/" + f, import.meta.url).href)].forEach(href => {
    const l = document.createElement("link"); l.rel = "stylesheet"; l.href = href; l.dataset.tr3d = "1"; document.head.append(l);
  });
}
function wordsOf(act) {
  return ((resolveActivity(act) || act).content?.items || [])
    .filter(it => it && String(it.keyword || "").trim() && String(it.definition || "").trim())
    .map(it => ({ keyword: String(it.keyword).trim(), definition: String(it.definition).trim() }));
}
// Options đã lưu. Act Balloon pop cũ (2D) chỉ có bp* ở gốc ⇒ lấy làm giá trị đầu.
function trOptions(act) {
  const o = (act && act.options) || {};
  if (o.trainRush && typeof o.trainRush === "object") return { ...o.trainRush };
  const seed = {};
  if (typeof o.bpTimerSeconds === "number") { seed.timerMode = "down"; seed.timer = o.bpTimerSeconds; }
  if (typeof o.bpSpeed === "number") seed.balloonSpeed = o.bpSpeed;
  if (typeof o.bpLevels === "number") seed.levels = Math.max(3, Math.min(21, o.bpLevels));
  if (typeof o.shuffleQuestions === "boolean") seed.shuffle = o.shuffleQuestions;
  if (typeof o.showAnswers === "boolean") seed.showAnswers = o.showAnswers;
  if (typeof o.bpBonusTime === "boolean") seed.bonusTime = o.bpBonusTime;
  if (typeof o.bpBonusPoints === "boolean") seed.bonusPoints = o.bpBonusPoints;
  if (typeof o.bpBonusX2 === "boolean") seed.bonusX2 = o.bpBonusX2;
  return seed;
}
function noWebglMessage(root) {
  root.innerHTML = "";
  const d = document.createElement("div");
  d.className = "aw-tr-need3d";
  d.textContent = "Train rush needs 3D graphics (WebGL), which this browser or device cannot run.";
  root.append(d);
}
// Ô phủ trọn trang + dấu MYACT cho myActivity (nhường card đồ hoạ như Rocket race 3D). close() gọi lại vô hại.
function openHost() {
  ensureTr3dCss();
  const box = document.createElement("div");
  box.className = "aw-tr-host";
  document.body.append(box);
  document.documentElement.classList.add("aw-tr-on");
  console.log("MYACT:3D:ON");
  let gone = false;
  return {
    box,
    close() {
      if (gone) return; gone = true;
      box.remove();
      if (!document.querySelector(".aw-tr-host")) document.documentElement.classList.remove("aw-tr-on");
      console.log("MYACT:3D:OFF");
    }
  };
}

const balloonPopTemplate = {
  type: "balloon_pop",
  name: "Train rush",
  itemsKey: "items",
  timeCost: false,
  manualTimerStart: true,
  // ⛔ Thầy chốt 03/10/2026: chưa giao bài được (form giao bài làm mờ ô này và hiện câu dưới). Showdown: không khai `showdownMode`.
  noAssignment: "Train rush is a classroom game for now — it cannot be set as homework yet.",
  edit: openBalloonPopEditor,
  toPrintItems(activity) {
    return (activity.content?.items || [])
      .filter(it => it && it.keyword && it.definition)
      .map(it => ({ clue: it.definition, answer: it.keyword }));
  },
  // Bỏ màn READY của engine: bấm Play ngay khi engine chuẩn bị xong ⇒ thầy thấy thẳng màn START của TRAIN RUSH.
  // Không chạy được 3D ⇒ NÉM để engine giữ màn READY thường; bấm Play sẽ ra dòng báo thiếu WebGL (mount).
  startScreen({ play, ready }) {
    if (!canRun3d()) throw new Error("Train rush: no WebGL");
    loader();   // Đợt 451 — hiện NGAY khung đầu
    let gone = false;
    Promise.resolve(ready()).then(() => { if (!gone) play(); });
    return { dispose() { gone = true; } };
  },
  mount(root, activity, ui) {
    root.innerHTML = "";
    if (!canRun3d()) { noWebglMessage(root); return () => {}; }
    const words = wordsOf(activity);
    if (words.length < 2) {
      loader().drop();
      const d = document.createElement("div"); d.className = "aw-tr-need3d"; d.textContent = "No words yet — add at least 2 keywords with definitions.";
      root.append(d); return () => {};
    }
    const ld = loader();
    const h = openHost();
    let dead = false, game = null;
    const host = ui.host ? {
      listActs: () => ui.host.listActs(),
      openAct: id => ui.host.openAct(id),
      saveOptions: o => { const keep = {}; TR_KEYS.forEach(k => { if (k in o) keep[k] = o[k]; }); ui.host.saveOptions({ trainRush: keep }); },
      home: () => ui.host.home(),
      templates: () => ui.host.templates(),
      switchTemplate: t => ui.host.switchTemplate(t)
    } : null;
    import("./3d/bp3d-1ak.js")
      .then(m => m.createBalloonPop({
        mount: h.box, view: "side", words, wordsTitle: activity.title || "", options: trOptions(activity), host,
        onEvent: (k, d) => { if (k === "mode" && d === "fight" && ui.host && ui.host.fight) ui.host.fight(); }
      }))
      .then(g => { if (dead) g.destroy(); else game = g; ld.done(); })
      .catch(err => {
        console.error("Train rush failed to start", err);
        ld.drop();
        if (dead) return;
        h.close(); noWebglMessage(root);
      });
    return function cleanup() {
      if (dead) return; dead = true;
      ld.drop();
      if (game) { try { game.destroy(); } catch (e) { console.warn("Train rush destroy", e); } }
      h.close();
    };
  },
  // ⭐ Đợt 449 — MODE ▸ Fight = trận TRAIN RUSH 3D (core/engine.js gọi thay core/fight.js). Trả về cleanup.
  ownFight(root, act, { single, home }) { return mountTrainRushFight(root, act, { single, home }); },
  onPause() { /* TRAIN RUSH có Menu/PAUSED riêng; menu engine không mở được khi game phủ trọn màn */ }
};

// Trận TRAIN RUSH 3D (xem `ownFight`). Rời trận theo mọi đường đều dỡ sạch: nút Single mode / Library của trận, hoặc engine
// dựng lại `root` vì lý do khác (◀ trình duyệt, đổi act…) — MutationObserver trên root bắt việc đó.
function mountTrainRushFight(root, act, { single, home }) {
  const items = wordsOf(act);
  if (!canRun3d() || items.length < 2) { setTimeout(() => single(), 0); return () => {}; }
  const ld = loader();
  const h = openHost();
  let dead = false, fightApi = null;
  const o = trOptions(act);
  const time = Math.max(120, o.timerMode === "down" && Number(o.timer) ? Number(o.timer) : 0);   // trận 2 đội: ít nhất 2 phút (mẫu 1ah)
  const off = () => {
    if (dead) return; dead = true;
    ld.drop(); clearInterval(poll);
    obs.disconnect();
    try { fightApi && fightApi.destroy(); } catch (e) { console.warn("Train rush destroy", e); }
    h.close();
  };
  let poll = 0;   // Đợt 451 — chờ 2 bàn dựng xong (ô Loading… của trận ẩn) rồi mới mờ màn chờ
  const obs = new MutationObserver(() => { if (root.childNodes.length) off(); });
  obs.observe(root, { childList: true });
  import("./3d/fight-1ak.js")
    .then(m => m.createTrainRushFight({ mount: h.box, words: items, wordsTitle: act.title || "", time, onSingle: () => single(), onHome: () => home() }))
    .then(api => { if (dead) api.destroy(); else fightApi = api; })
    .then(() => { poll = setInterval(() => { const l = h.box.querySelector(".fb-ov-load"); if (dead || !l || l.hidden) { clearInterval(poll); ld.done(); } }, 100); })
    .catch(err => { console.error("Train rush fight failed — back to single", err); off(); single(); });
  return off;
}

registerTemplate(balloonPopTemplate);
export default balloonPopTemplate;
