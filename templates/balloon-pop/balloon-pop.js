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
// ⭐⭐ Đợt 452 (thầy 03/10/2026: "Options… lấy Rocket Race làm mẫu · train rush bị size quá to"): khung + nút = Rocket Race
//   (myGame 1al); nút Options của game mở ĐÚNG bảng Options của engine (cầu `ui.host.options`) — Timer, bộ nghĩa, nút Template,
//   Shuffle / Show answers + mục riêng TRAIN RUSH (buildExtraOptions). Apply => `ui.liveOptions` => game.setOptions (không nạp lại 3D).
// ⭐⭐ Đợt 487 (thầy 06/10/2026): Mode ▸ Fight của game chạy trận NGAY TRONG ô Single (myGame 1ao, `3d/fight-1ao.js`) — hàng nút Fight
//   y hệt Single: Menu · Sound | Thư mục · Options · Mode. `ownFight` (đường engine.enterFight) vẫn giữ, nhưng hàng nút của nó không có
//   Thư mục / Options (không có cầu ui.host).
//   ⚠️ Options lưu PHẲNG trong activity.options (proxy nháp engine chỉ thấy khoá cấp 1): timer / timerTotalSeconds / shuffleQuestions /
//   showAnswers + trLevels · trPointsOff · trBalloonSpeed · trTrainSpeed · trBonusTime · trBonusPoints · trBonusX2.
//   `activity.options.trainRush` (Đợt 450–451) + khoá bp* của bản 2D chỉ còn là giá trị đầu (flatSeed).
// ⭐⭐⭐ Đợt 515 (thầy 14/10/2026 — myGame 1ap, duyệt bản phác thiet-ke-fight-1-man.html rồi "ok build"):
//   • FIGHT MỘT MÀN: 2 tàu song song trong MỘT cảnh (TEAM 1 đỏ ray gần, TEAM 2 xanh ray xa, góc máy quay A) — ./3d/fight-1ap.js.
//     Ô điểm đỏ/xanh = THANH GIỜ của màn; đội đầy toa ⇒ tàu phóng đi, đội kia làm nốt (chờ thoải mái); cả 2 xong ⇒ giờ thừa đổi
//     điểm (1 giây = 1 điểm) ⇒ màn mới. Thanh rút hết khi chưa xong ⇒ tàu dừng, OUT ⇒ đội kia làm nốt màn đó ⇒ hết trận.
//   • iPad như Rocket Race: mỗi đội 1 iPad (trang chủ ▸ nút iPad ▸ chọn đội) thấy cảnh 2D của RIÊNG đội mình, chạm quả = nổ trên màn lớn.
//     Nút iPad trong trận: Off · iPad + màn lớn (MẶC ĐỊNH) · Chỉ iPad. Bắt tay ./tr-pad-signal.js; iPad đi theo game qua core/ipad-now.js
//     (claim game "trainrush" khi nút iPad không Off; `hold` từ lúc có iPad nối — AWord mở nơi khác không kéo iPad khỏi trận).
//   • OPTIONS MỚI cho CẢ Single lẫn Fight (thầy chốt): LEVELS Off / 1–20 (Off = 1 màn chứa đủ cả bộ từ) THAY Max cars ·
//     TIME ROUND Off / 1–10 phút MỖI MÀN / ∞ (đếm lên) THAY None / Count up / Count down (hàng Timer của engine ẩn: hideTimerOption).
//     Mặc định LEVELS 5 · TIME ROUND 2 phút. KHOÁ MỚI trLevelCount (0–20) · trRound (0 Off · 1–10 · 11 = ∞) — KHÔNG dùng lại trLevels
//     (nghĩa cũ = Max cars) hay timer (nghĩa cũ = giờ cả ván). Act chưa có khoá mới ⇒ trRound suy từ timer cũ (None ⇒ Off, Count up ⇒ ∞,
//     Count down ⇒ số phút, kẹp 1–10); trLevelCount ⇒ 5.
// ⭐ Đợt 517 (thầy 14/10/2026 — myGame 1aq, thầy thử 1ap): Fight 1 màn chỉnh cỡ — tàu TO hơn, khinh khí cầu NHỎ hơn, 2 tàu nâng lên chừa đất +
//   cỏ tiền cảnh, máy bay kéo băng điểm bay THẤP (giữa 2 ray), thú đuổi nhau gần nhau 1/2. Single y hệt (lõi ./3d/bp3d-1aq.js, nhánh không duo).
//   iPad vẽ lại kiểu A "Miền Tây hoàng hôn" (pad.js ⇒ 3d/tr-padui-1aq.js); game gửi thêm điểm đội bạn · số màn · số đếm · thưởng giờ.
// =============================================================

import { registerTemplate } from "../../core/registry.js";
import { resolveActivity } from "../../core/content-view.js";   // act từ vựng nhiều bộ nghĩa ⇒ đúng bộ đang chọn
import { openBalloonPopEditor } from "./balloon-pop-editor.js";
import { showLoader3d, preloadLoader3d } from "../../core/loader3d.js";   // Đợt 451 — màn chờ thay khung trống lúc nạp 3D
const loader = () => { ensureTr3dCss(); return showLoader3d({ key: "trainrush", title: "TRAIN RUSH", theme: "west" }); };
preloadLoader3d("west");   // Đợt 452 — phông Rye tải ngay lúc nạp template (màn chờ hiện là đã có chữ)

// CSS của game (chép từ myGame) + phông miền Tây; nạp một lần khi game mở lần đầu.
const TR3D_CSS = ["bp3d.css", "bp3d-1j.css", "bp3d-1p.css", "bp3d-1q.css", "bp3d-1r.css", "bp3d-1ab.css", "fight-cine-1ae.css", "fight-1al.css", "bp3d-1al.css", "fight-1ao.css", "fight-1ap.css"];
const TR3D_FONTS = "https://fonts.googleapis.com/css2?family=Exo+2:ital,wght@1,800;1,900&family=Rye&display=swap";
// Đợt 515 — khoá game (DEFAULTS trong 3d/bp3d-1ap.js) <-> khoá PHẲNG trong activity.options (engine + tr*)
const TR_DEF = { levelCount: 5, roundMin: 2, pointsOff: 0, balloonSpeed: 4, trainSpeed: 4, shuffle: true, showAnswers: true, bonusTime: false, bonusPoints: false, bonusX2: false };
const clampN = (v, lo, hi, d) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : d; };
// [khoá phẳng, khoá game, kiểu, min, max]
const TR_FLAT = [["trLevelCount", "levelCount", "n", 0, 20], ["trRound", "roundMin", "n", 0, 11], ["trPointsOff", "pointsOff", "n", 0, 10],
  ["trBalloonSpeed", "balloonSpeed", "n", 1, 10], ["trTrainSpeed", "trainSpeed", "n", 1, 10],
  ["trBonusTime", "bonusTime", "b"], ["trBonusPoints", "bonusPoints", "b"], ["trBonusX2", "bonusX2", "b"]];
// Đợt 515 — act chưa có trRound: suy từ đồng hồ CŨ (None ⇒ Off · Count up ⇒ ∞ · Count down ⇒ số phút, kẹp 1–10). Giờ cũ là của cả ván,
// nay là MỖI MÀN — chỉ là giá trị đầu cho bảng Options, thầy chỉnh lại bằng thanh TIME ROUND.
function roundFromOld(o) {
  // chỉ act ĐÃ TỪNG lưu Options Train rush (khoá tr* Đợt 452 / trainRush Đợt 450) mới có đồng hồ là ý thầy; act khác mang timer mặc định
  // của AWord ("none") ⇒ dùng mặc định thầy chốt (2 phút), không suy thành Off
  const savedTR = (o.trainRush && typeof o.trainRush === "object") || ["trLevels", "trPointsOff", "trBalloonSpeed", "trTrainSpeed", "trBonusTime", "trBonusPoints", "trBonusX2"].some(k => k in o);
  if (!savedTR) return TR_DEF.roundMin;
  const tm = o.timer ?? (o.trainRush && o.trainRush.timerMode === "down" ? "countDown" : o.trainRush && o.trainRush.timerMode === "up" ? "countUp" : o.trainRush && o.trainRush.timerMode === "none" ? "none" : undefined);
  const sec = typeof o.timerTotalSeconds === "number" ? o.timerTotalSeconds : o.trainRush && typeof o.trainRush.timer === "number" ? o.trainRush.timer : typeof o.bpTimerSeconds === "number" ? o.bpTimerSeconds : 120;
  if (tm === "none") return 0;
  if (tm === "countUp") return 11;
  if (tm === "countDown") return clampN(sec / 60, 1, 10, 2);
  return TR_DEF.roundMin;
}
// khoá phẳng => bộ Options của game
function gameOpts(o) {
  o = o || {};
  const g = {};
  if (typeof o.shuffleQuestions === "boolean") g.shuffle = o.shuffleQuestions;
  if (typeof o.showAnswers === "boolean") g.showAnswers = o.showAnswers;
  // tốc độ / bonus đã lưu kiểu Đợt 450–451 (activity.options.trainRush) hoặc bản 2D (bp*) ⇒ giá trị đầu
  const old = o.trainRush && typeof o.trainRush === "object" ? o.trainRush : {};
  if (typeof old.balloonSpeed === "number") g.balloonSpeed = clampN(old.balloonSpeed, 1, 10, 4); else if (typeof o.bpSpeed === "number") g.balloonSpeed = clampN(o.bpSpeed, 1, 10, 4);
  if (typeof old.trainSpeed === "number") g.trainSpeed = clampN(old.trainSpeed, 1, 10, 4);
  for (const k of ["bonusTime", "bonusPoints", "bonusX2"]) if (typeof old[k] === "boolean") g[k] = old[k];
  TR_FLAT.forEach(([f, k, t, lo, hi]) => {
    if (t === "n" && typeof o[f] === "number") g[k] = clampN(o[f], lo, hi, TR_DEF[k]);
    if (t === "b" && typeof o[f] === "boolean") g[k] = o[f];
  });
  if (typeof o.trRound !== "number") g.roundMin = roundFromOld(o);
  return g;
}
// bộ Options của game => khoá phẳng (không đụng timer / timerTotalSeconds / trLevels cũ)
function flatOpts(g) {
  const f = {};
  if (typeof g.shuffle === "boolean") f.shuffleQuestions = g.shuffle;
  if (typeof g.showAnswers === "boolean") f.showAnswers = g.showAnswers;
  TR_FLAT.forEach(([fk, k]) => { if (typeof g[k] === typeof TR_DEF[k]) f[fk] = g[k]; });
  return f;
}
const trGame = act => ({ ...TR_DEF, ...gameOpts(act && act.options) });
// ⭐ Đợt 487 — đang ở trận Fight mà chọn act khác ở nút Thư mục ⇒ act đó mở thẳng vào Fight (mount đọc trong 15 s rồi xoá)
let fightNextAt = 0;

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
// Đợt 452/515 — act chưa có khoá phẳng tr*: rải giá trị đầu vào activity.options TRONG BỘ NHỚ (không lưu) để bảng Options của engine
// hiện đúng thứ game đang chơi. Khoá đã có thì giữ nguyên.
function flatSeed(act) {
  if (!act.options) act.options = {};
  const f = flatOpts(trGame(act));
  Object.keys(f).forEach(k => { if (!(k in act.options)) act.options[k] = f[k]; });
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
// ⭐ Đợt 515 — iPad của trận Fight 1 màn: kênh bắt tay + claim ipad_now (iPad ở pad.html tự sang cảnh 2D của đội mình).
//   Nút iPad Off ⇒ thả claim (iPad về màn chờ chung). `hold` từ lúc có iPad nối (như STAR LOOT Đợt 513).
//   Trả { signal, onPad, release } — signal null nếu kênh không nạp được (trận vẫn chơi bằng màn lớn).
async function trPadLink() {
  let signal = null, claim = null, N = null, dead = false, last = null;
  try { const S = await import("./tr-pad-signal.js"); signal = S.trPadSignal(); } catch (e) { console.warn("Train rush iPad link", e); }
  import("../../core/ipad-now.js").then(m => { N = m; if (!dead && last) onPad(last); }).catch(() => {});
  function onPad(info) {
    last = info;
    if (dead || !N) return;
    const on = info.mode !== "off", hold = on && info.linked.some(s => s === "on" || s === "relay");
    if (!on) { if (claim) { claim.release(); claim = null; } return; }
    if (!claim) claim = N.claimIpad({ game: "trainrush", fight: true, ctl: false, hold });
    else claim.update({ hold });
  }
  return { signal, onPad, release() { dead = true; if (claim) { claim.release(); claim = null; } } };
}

const balloonPopTemplate = {
  type: "balloon_pop",
  name: "Train rush",
  itemsKey: "items",
  timeCost: false,
  hidePointsOff: true,      // Points off của TRAIN RUSH thang 0–10 riêng (trPointsOff, bên dưới)
  hideTimerOption: true,    // ⭐ Đợt 515 — đồng hồ = thanh TIME ROUND riêng (mỗi màn), không dùng None / Count up / Count down
  manualTimerStart: true,
  // ⭐ Đợt 452/515 — mục riêng của TRAIN RUSH trong bảng Options THẬT của engine (nút Options của game mở bảng này qua ui.host.options).
  buildExtraOptions({ panel, draft, mkSliderCell, addCheck }) {
    const g = { ...TR_DEF, ...gameOpts(draft) };
    panel.append(
      mkSliderCell({ label: "Levels", sub: "Off = all words, one train", min: 0, max: 20, step: 1, value: g.levelCount, tone: "green", offAt: 0,
        fmt: v => (v === 0 ? "Off" : String(v)), onInput: v => { draft.trLevelCount = v; } }).cell,
      mkSliderCell({ label: "Time round", sub: "minutes per level", min: 0, max: 11, step: 1, value: g.roundMin, tone: "green", offAt: 0,
        fmt: v => (v === 0 ? "Off" : v >= 11 ? "∞" : v + "'"), onInput: v => { draft.trRound = v; } }).cell,
      mkSliderCell({ label: "Balloon speed", min: 1, max: 10, step: 1, value: g.balloonSpeed, tone: "blue", onInput: v => { draft.trBalloonSpeed = v; } }).cell,
      mkSliderCell({ label: "Train speed", min: 1, max: 10, step: 1, value: g.trainSpeed, tone: "blue", onInput: v => { draft.trTrainSpeed = v; } }).cell,
      mkSliderCell({ label: "Points off", sub: "wrong answer", min: 0, max: 10, step: 1, value: g.pointsOff, tone: "red", offAt: 0,
        fmt: v => (v === 0 ? "Off" : "-" + v), onInput: v => { draft.trPointsOff = v; } }).cell
    );
    addCheck("Bonus: extra time", g.bonusTime, v => { draft.trBonusTime = v; }, { key: "trBonusTime" });
    addCheck("Bonus: points", g.bonusPoints, v => { draft.trBonusPoints = v; }, { key: "trBonusPoints" });
    addCheck("Bonus: x2 score", g.bonusX2, v => { draft.trBonusX2 = v; }, { key: "trBonusX2" });
  },
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
    const ld = loader();   // Đợt 451 — hiện NGAY khung đầu
    let gone = false;
    // Đợt 452 — chờ cả màn chờ đã vẽ xong tên game (ld.ready, tối đa 0,9 s) rồi mới Play ⇒ mount dựng cảnh 3D (khoá luồng chính)
    Promise.all([ready(), ld.ready]).then(() => { if (!gone) play(); });
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
    const h = openHost();
    let dead = false, game = null, fight = null, tok = 0, poll = 0, link = null;
    flatSeed(activity);
    // Options ▸ Apply của engine => áp ngay trong cảnh (game chưa dựng xong => false => engine dựng lại như thường)
    // Đợt 515 — Fight: setOptions(Options của game) ⇒ trận chơi lại từ đếm 3-2-1
    if (ui.liveOptions) ui.liveOptions(o => {
      if (dead) return false;
      const g = { ...TR_DEF, ...gameOpts(o) };
      if (fight) return fight.setOptions(g) === true;
      return game ? game.setOptions(g) === true : false;
    });
    const host = ui.host ? {
      listActs: () => ui.host.listActs(),
      openAct: id => ui.host.openAct(id),
      saveOptions: o => ui.host.saveOptions(flatOpts(o)),
      options: ui.host.options ? ov => ui.host.options(ov) : undefined,   // Đợt 452 — bảng Options thật của engine
      home: () => ui.host.home(),
      templates: () => ui.host.templates(),
      switchTemplate: t => ui.host.switchTemplate(t)
    } : null;
    // ⭐ Đợt 487 — Mode ▸ Fight chạy trận NGAY TRONG ô này (như STAR LOOT), không qua engine.enterFight ⇒ cầu ui.host còn dùng được.
    const fightHost = ui.host ? {
      listActs: () => ui.host.listActs(),
      openAct: id => { fightNextAt = Date.now(); ui.host.openAct(id); },
      options: ui.host.options ? ov => ui.host.options(ov) : undefined
    } : {};   // {} ⇒ trận ẩn nút Thư mục / Options (không có cầu)
    let ld = loader();
    const drop = () => {
      clearInterval(poll);
      if (game) { try { game.destroy(); } catch (e) { console.warn("Train rush destroy", e); } game = null; }
      if (fight) { try { fight.destroy(); } catch (e) { console.warn("Train rush fight destroy", e); } fight = null; }
      if (link) { link.release(); link = null; }
    };
    const failed = err => {
      console.error("Train rush failed to start", err);
      ld.drop();
      if (dead) return;
      h.close(); noWebglMessage(root);
    };
    function single() {
      const my = ++tok;
      drop();
      import("./3d/bp3d-1aq.js")
        .then(m => m.createBalloonPop({
          mount: h.box, view: "side", words, wordsTitle: activity.title || "", options: trGame(activity), host,
          onEvent: (k, d) => { if (k === "mode" && d === "fight") switchTo(toFight); }
        }))
        .then(g => { if (dead || my !== tok) { g.destroy(); return; } game = g; ld.done(); })
        .catch(failed);
    }
    function toFight() {
      const my = ++tok;
      drop();
      Promise.all([import("./3d/fight-1aq.js"), trPadLink()])
        .then(([m, L]) => {
          if (dead || my !== tok) { L.release(); return null; }
          link = L;
          return m.createTrainRushFight({ mount: h.box, words, wordsTitle: activity.title || "", options: trGame(activity), host: fightHost,
            onSingle: () => switchTo(single), onHome: ui.host ? () => ui.host.home() : null, padSignal: L.signal, onPad: L.onPad });
        })
        .then(api => {
          if (!api) return;
          if (dead || my !== tok) { api.destroy(); return; }
          fight = api;
          // Đợt 451 — chờ trận dựng xong (ô Loading… ẩn) rồi mới mờ màn chờ
          poll = setInterval(() => { const l = h.box.querySelector(".fb-ov-load"); if (dead || my !== tok || !l || l.hidden) { clearInterval(poll); ld.done(); } }, 100);
        })
        .catch(err => { console.error("Train rush fight failed — back to single", err); if (!dead && my === tok) single(); });
    }
    // đổi chế độ: hiện màn chờ, chờ nó vẽ xong (dựng cảnh 3D khoá luồng chính ~1–2 s) rồi mới dỡ / dựng
    function switchTo(fn) {
      ld = loader();
      const my = tok;
      ld.ready.then(() => { if (!dead && my === tok) fn(); });
    }
    const wantFight = Date.now() - fightNextAt < 15000;
    fightNextAt = 0;
    if (wantFight) toFight(); else single();
    return function cleanup() {
      if (dead) return; dead = true;
      ld.drop();
      drop();
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
  let dead = false, fightApi = null, link = null;
  if (act.options) flatSeed(act);
  const o = trGame(act);
  const off = () => {
    if (dead) return; dead = true;
    ld.drop(); clearInterval(poll);
    obs.disconnect();
    try { fightApi && fightApi.destroy(); } catch (e) { console.warn("Train rush destroy", e); }
    if (link) { link.release(); link = null; }
    h.close();
  };
  let poll = 0;   // Đợt 451 — chờ trận dựng xong (ô Loading… ẩn) rồi mới mờ màn chờ
  const obs = new MutationObserver(() => { if (root.childNodes.length) off(); });
  obs.observe(root, { childList: true });
  Promise.all([import("./3d/fight-1aq.js"), trPadLink()])   // Đợt 487: host {} ⇒ ẩn Thư mục / Options (đường engine không có cầu ui.host)
    .then(([m, L]) => {
      if (dead) { L.release(); return null; }
      link = L;
      return m.createTrainRushFight({ mount: h.box, words: items, wordsTitle: act.title || "", options: o, host: {}, onSingle: () => single(), onHome: () => home(), padSignal: L.signal, onPad: L.onPad });
    })
    .then(api => { if (!api) return; if (dead) api.destroy(); else fightApi = api; })
    .then(() => { poll = setInterval(() => { const l = h.box.querySelector(".fb-ov-load"); if (dead || !l || l.hidden) { clearInterval(poll); ld.done(); } }, 100); })
    .catch(err => { console.error("Train rush fight failed — back to single", err); off(); single(); });
  return off;
}

registerTemplate(balloonPopTemplate);
export default balloonPopTemplate;
