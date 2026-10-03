// =============================================================
// TEMPLATE: MAZE CHASE = STAR LOOT 3D  (Đợt 447, thầy 02/10/2026)
//
// ⭐ Đợt 450 (thầy 03/10/2026: "Bỏ dạng 2D của STAR LOOT và TRAIN RUSH đi, chỉ giữ dạng 3D cho mọi mode"): bản 2D
// (maze-chase-2d.js + mc-sound.js + img/ + sounds/) đã GỠ HẲN — máy không chạy được WebGL chỉ thấy một dòng báo.
// Vẫn chưa giao bài, chưa mở Showdown (thầy chốt: mở sau khi game ổn định).
//
// Thầy: "Đẩy bản đầy đủ lên AWord, có đủ mọi chế độ (trong đó có single và fight) và có thể
// liên kết với bộ từ vựng của act để chơi". Thầy chốt (AskUserQuestion):
//   • THAY HẲN Maze chase 2D — type vẫn là `maze_chase` (act cũ, đổi template, nút MODE… giữ nguyên đường đi),
//     bản 2D (maze-chase-2d.js) chỉ còn là ĐƯỜNG LÙI khi máy không chạy được 3D.
//   • CHƯA cho giao bài (`noAssignment`) — game 3D nặng (~12 MB tiếng), chưa thử trên điện thoại học sinh.
//   • Hàng nút GIỮ KIỂU STAR LOOT nhưng NỐI THẬT: Thư mục = act cùng thư mục, Options lưu theo act,
//     Menu có Library + Change template — đi qua cầu `ui.host` của core/engine.js (Đợt 447).
//
// Cách chạy: game được THIẾT KẾ ở kho myGame (maze-chase, mẫu 2n) và CHÉP sang ./3d/ + ./am-thanh/ bằng
// `python tools/chep-star-loot.py` — ⛔ đừng sửa tay file trong ./3d/, sửa ở myGame rồi chép lại.
// STAR LOOT tự vẽ TRỌN MÀN (màn START + intro, Single, Fight 2 đội chung một mê cung, Options, kết quả):
// ô `.aw-sl-host` gắn vào document.body (position:fixed phủ cả trang — trong khung AWord có lớp tạo khung
// quy chiếu riêng nên không gắn vào sân). Màn READY của engine bị bỏ qua (`startScreen` tự bấm Play ngay khi
// engine sẵn sàng) ⇒ thầy thấy thẳng màn START của STAR LOOT.
// Đồng hồ / điểm / kết quả là của STAR LOOT (không gọi ui.finish — Fight 2 đội không có một "điểm của em").
// "Liên kết bộ từ vựng": act từ vựng (anagram, ENG1/VI1…) ⇒ Change template ▸ Maze chase — core/convert.js
// dựng sẵn `content.questions` (đáp án đúng + 3 đáp án nhiễu) ⇒ STAR LOOT nhận y như act Maze chase thường.
// ⭐⭐ Đợt 452 (thầy 03/10/2026: "Options STAR LOOT không có đủ chức năng (ví dụ chuyển Template)… lấy Rocket Race làm mẫu"):
//   nút Options của game mở ĐÚNG bảng Options của engine (cầu `ui.host.options`, bảng gắn lên ô game) — Timer, bộ nghĩa,
//   nút Template (lưới có hình), Shuffle / Show answers của engine + mục riêng STAR LOOT (buildExtraOptions bên dưới).
//   Apply ⇒ `ui.liveOptions` ⇒ game.setOptions (áp ngay trong cảnh, không nạp lại 3D). Khung + hàng nút = Rocket Race (myGame 2o).
//   ⚠️ Options lưu PHẲNG trong activity.options (proxy nháp của engine chỉ thấy khoá cấp 1): timer / timerTotalSeconds /
//   shuffleQuestions / showAnswers / lives của engine + slFight · slDifficulty · slBombs · slBombGift · slDpad.
//   `activity.options.starLoot` (Đợt 447–451) chỉ còn là giá trị đầu cho act chưa lưu kiểu mới (flatSeed).
// =============================================================

import { registerTemplate } from "../../core/registry.js";
import { openMazeChaseEditor } from "./maze-chase-editor.js";
import { showLoader3d } from "../../core/loader3d.js";   // Đợt 451 — màn chờ thay khung trắng của AWord lúc nạp 3D
const loader = () => showLoader3d({ key: "starloot", title: "STAR LOOT", theme: "space" });

const CSS_3D = new URL("./3d/mc3d-2o.css", import.meta.url).href;
// Đợt 452 — khoá game (mc3d-2o DEFAULTS) <-> khoá PHẲNG trong activity.options (engine + sl*)
const SL_DEF = { fight: false, timer: "up", timerSec: 120, lives: 5, difficulty: 6, bombs: 1, bombGift: 3, dpadStyle: "ring", shuffle: true, showAnswers: true };
const DPADS = [["glass", "Glass"], ["ring", "Ring"], ["keys", "Keys"], ["console", "Console"], ["stick", "Stick"]];
const TM_TO_GAME = { none: "none", countUp: "up", countDown: "down" }, TM_TO_AW = { none: "none", up: "countUp", down: "countDown" };
const clampN = (v, lo, hi, d) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : d; };
// khoá phẳng => bộ Options của game
function gameOpts(o) {
  o = o || {};
  const g = {};
  if (TM_TO_GAME[o.timer]) g.timer = TM_TO_GAME[o.timer];
  if (typeof o.timerTotalSeconds === "number") g.timerSec = clampN(o.timerTotalSeconds, 5, 3599, 120);
  if (typeof o.shuffleQuestions === "boolean") g.shuffle = o.shuffleQuestions;
  if (typeof o.showAnswers === "boolean") g.showAnswers = o.showAnswers;
  if (typeof o.lives === "number") g.lives = clampN(o.lives, 1, 9, 5);
  if (typeof o.slFight === "boolean") g.fight = o.slFight;
  if (typeof o.slDifficulty === "number") g.difficulty = clampN(o.slDifficulty, 1, 10, 6);
  if (typeof o.slBombs === "number") g.bombs = clampN(o.slBombs, 0, 10, 1);
  if (typeof o.slBombGift === "number") g.bombGift = clampN(o.slBombGift, 0, 10, 3);
  if (DPADS.some(d => d[0] === o.slDpad)) g.dpadStyle = o.slDpad;
  return g;
}
// bộ Options của game => khoá phẳng (Mode trong game đổi Single/Fight => lưu qua đây)
function flatOpts(g) {
  const f = {};
  if (TM_TO_AW[g.timer]) f.timer = TM_TO_AW[g.timer];
  if (typeof g.timerSec === "number") f.timerTotalSeconds = g.timerSec;
  if (typeof g.shuffle === "boolean") f.shuffleQuestions = g.shuffle;
  if (typeof g.showAnswers === "boolean") f.showAnswers = g.showAnswers;
  if (typeof g.lives === "number") f.lives = g.lives;
  if (typeof g.fight === "boolean") f.slFight = g.fight;
  if (typeof g.difficulty === "number") f.slDifficulty = g.difficulty;
  if (typeof g.bombs === "number") f.slBombs = g.bombs;
  if (typeof g.bombGift === "number") f.slBombGift = g.bombGift;
  if (typeof g.dpadStyle === "string") f.slDpad = g.dpadStyle;
  return f;
}
// Act chưa có khoá phẳng: rải giá trị của game (mặc định / `starLoot` cũ) vào activity.options TRONG BỘ NHỚ (không lưu) để bảng
// Options của engine hiện đúng thứ game đang chơi (vd. Timer: STAR LOOT mặc định Count up 2:00). Khoá đã có thì giữ nguyên.
function flatSeed(activity) {
  if (!activity.options) activity.options = {};
  const o = activity.options;
  const old = o.starLoot && typeof o.starLoot === "object" ? o.starLoot : {};
  const base = { ...SL_DEF };
  Object.keys(SL_DEF).forEach(k => { if (k in old && typeof old[k] === typeof SL_DEF[k]) base[k] = old[k]; });
  if (!("lives" in old) && typeof o.lives === "number") base.lives = clampN(o.lives, 1, 9, 5);
  const f = flatOpts(base);
  // ⚠️ Act chưa từng lưu kiểu Đợt 452 (không có khoá sl*): `timer` ở gốc không phải giờ của STAR LOOT (bản 2D / mặc định Settings)
  // ⇒ lấy giờ của game (starLoot cũ / mặc định Count up 2:00).
  const fresh = !["slFight", "slDifficulty", "slBombs", "slBombGift", "slDpad"].some(k => k in o);
  Object.keys(f).forEach(k => { if (!(k in o) || (fresh && (k === "timer" || k === "timerTotalSeconds"))) o[k] = f[k]; });
}

let webglOk = null;
function canRun3d() {
  if (webglOk !== null) return webglOk;
  try {
    const c = document.createElement("canvas");
    webglOk = !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch (e) { webglOk = false; }
  return webglOk;
}
function ensureCss() {
  if (document.querySelector(`link[data-sl3d]`)) return;
  const l = document.createElement("link");
  l.rel = "stylesheet"; l.href = CSS_3D; l.dataset.sl3d = "1";
  document.head.append(l);
}
// Options đã lưu của STAR LOOT. Act Maze chase cũ (2D) chỉ có lives / difficulty / shuffleQuestions ở gốc ⇒ lấy làm giá trị đầu.
function slOptions(activity) { flatSeed(activity); return { ...SL_DEF, ...gameOpts(activity.options) }; }
function playable(activity) {
  return (activity.content?.questions || [])
    .filter(q => q && Array.isArray(q.answers) && q.answers.some(a => a && a.correct) && q.answers.filter(a => a && a.text != null && a.text !== "").length >= 2)
    .map(q => ({ question: q.question || "", answers: q.answers.filter(a => a && a.text != null && a.text !== "").map(a => ({ text: String(a.text), correct: !!a.correct })) }));
}

function needMessage(root, text) {
  root.innerHTML = "";
  const d = document.createElement("div");
  d.className = "aw-sl-need3d";
  d.textContent = text;
  root.append(d);
}
let live3d = 0;   // số ván 3D đang mở (lớp html.aw-sl-on)

const starLootTemplate = {
  type: "maze_chase",
  name: "Star loot",
  itemsKey: "questions",
  edit: openMazeChaseEditor,
  toPrintItems(activity) {
    return (activity.content?.questions || [])
      .filter(q => q && Array.isArray(q.answers) && q.answers.length)
      .map(q => ({
        clue: q.question || "",
        answer: (q.answers.find(a => a.correct) || q.answers[0] || {}).text || "",
        options: q.answers.filter(a => a && a.text != null).map(a => ({ text: a.text, correct: !!a.correct }))
      }));
  },
  // STAR LOOT tự lo điểm + kết quả; engine không chấm (không có ô điểm / bảng kết quả của engine phía sau).
  timeCost: false,
  hidePointsOff: true,      // STAR LOOT không trừ điểm (mất mạng thay vào đó)
  manualTimerStart: true,   // đồng hồ engine không chạy — đồng hồ LED là của STAR LOOT
  // ⭐ Đợt 452 — mục riêng của STAR LOOT trong bảng Options THẬT của engine (nút Options của game mở bảng này qua ui.host.options).
  buildExtraOptions({ panel, draft, mkCell, mkSeg, mkSliderCell }) {
    const g = { ...SL_DEF, ...gameOpts(draft) };
    const mode = mkCell({ label: "Mode", wide: true });
    mode.ctl.append(mkSeg([{ value: "single", label: "Single" }, { value: "fight", label: "Fight · 2 teams" }],
      g.fight ? "fight" : "single", v => { draft.slFight = v === "fight"; }));
    const dpad = mkCell({ label: "D-pad style", wide: true });
    dpad.ctl.append(mkSeg(DPADS.map(([value, label]) => ({ value, label })), g.dpadStyle, v => { draft.slDpad = v; }));
    panel.append(
      mode.cell,
      mkSliderCell({ label: "Lives", min: 1, max: 9, step: 1, value: g.lives, tone: "green", onInput: v => { draft.lives = v; } }).cell,
      mkSliderCell({ label: "Difficulty", sub: "enemies", min: 1, max: 10, step: 1, value: g.difficulty, tone: "blue",
        fmt: v => v + "/10", onInput: v => { draft.slDifficulty = v; } }).cell,
      mkSliderCell({ label: "Bombs", sub: "each player", min: 0, max: 10, step: 1, value: g.bombs, tone: "amber", offAt: 0,
        fmt: v => (v === 0 ? "Off" : String(v)), onInput: v => { draft.slBombs = v; } }).cell,
      mkSliderCell({ label: "Bomb gift", sub: "every N correct", min: 0, max: 10, step: 1, value: g.bombGift, tone: "amber", offAt: 0,
        fmt: v => (v === 0 ? "Off" : String(v)), onInput: v => { draft.slBombGift = v; } }).cell,
      dpad.cell
    );
  },
  // ⛔ Thầy chốt 02/10/2026: chưa giao bài được (form giao bài làm mờ ô này và hiện câu dưới).
  noAssignment: "Star loot is a classroom game for now — it cannot be set as homework yet.",
  // Bỏ màn READY của engine: bấm Play ngay khi engine chuẩn bị xong ⇒ thầy thấy thẳng màn START của STAR LOOT.
  // Không chạy được 3D ⇒ NÉM để engine giữ màn READY thường; bấm Play ra dòng báo thiếu WebGL (Đợt 450: không còn bản 2D).
  startScreen({ play, ready }) {
    if (!canRun3d()) throw new Error("Star loot: no WebGL");
    const ld = loader();   // Đợt 451 — hiện NGAY khung đầu (che màn READY + khung trống của engine trong lúc nạp)
    let gone = false;
    // Đợt 452 — chờ cả màn chờ đã vẽ xong tên game (ld.ready, tối đa 0,9 s) rồi mới Play ⇒ mount dựng cảnh 3D (khoá luồng chính)
    Promise.all([ready(), ld.ready]).then(() => { if (!gone) play(); });
    return { dispose() { gone = true; } };
  },
  mount(root, activity, ui) {
    const questions = playable(activity);
    if (!canRun3d()) { needMessage(root, "Star loot needs 3D graphics (WebGL), which this browser or device cannot run."); return () => {}; }
    if (!questions.length) { loader().drop(); needMessage(root, "No questions yet — add questions with one correct answer."); return () => {}; }
    const ld = loader();   // Đợt 451 — cùng màn chờ từ startScreen (hoặc mới nếu vào thẳng mount)
    ensureCss();
    root.innerHTML = "";
    const box = document.createElement("div");
    box.className = "aw-sl-host";
    document.body.append(box);
    document.documentElement.classList.add("aw-sl-on");
    live3d++;
    let dead = false, game = null;
    console.log("MYACT:3D:ON");   // myActivity: nhường card đồ hoạ (như Rocket race 3D)
    // Đợt 452 — Options ▸ Apply của engine => áp ngay trong cảnh (game chưa dựng xong => false => engine dựng lại như thường)
    if (ui.liveOptions) ui.liveOptions(o => (game && !dead ? game.setOptions({ ...SL_DEF, ...gameOpts(o) }) === true : false));
    import("./3d/mc3d-2o.js")
      .then(m => m.createMazeChase({
        mount: box, view: "tilt", questions,
        title: activity.title || "", act: activity.title || "",
        options: slOptions(activity),
        host: ui.host ? {
          listActs: () => ui.host.listActs(),
          openAct: id => ui.host.openAct(id),
          saveOptions: o => ui.host.saveOptions(flatOpts(o)),   // Mode trong game (Single/Fight) => khoá phẳng
          options: ui.host.options ? ov => ui.host.options(ov) : undefined,   // Đợt 452 — bảng Options thật của engine
          home: () => ui.host.home(),
          templates: () => ui.host.templates(),
          switchTemplate: t => ui.host.switchTemplate(t)
        } : null
      }))
      .then(g => { if (dead) g.destroy(); else game = g; ld.done(); })
      .catch(err => {
        console.error("Star loot failed to start", err);
        ld.drop();
        if (dead) return;
        try { box.remove(); } catch (e) { /* đã gỡ */ }
        live3d = Math.max(0, live3d - 1);
        if (!live3d) document.documentElement.classList.remove("aw-sl-on");
        console.log("MYACT:3D:OFF");
        needMessage(root, "Star loot could not start 3D graphics on this device.");
      });
    return function cleanup() {
      if (dead) return;
      dead = true;
      ld.drop();
      if (game) { try { game.destroy(); } catch (e) { console.warn("Star loot destroy", e); } }
      if (box.isConnected) {
        box.remove();
        live3d = Math.max(0, live3d - 1);
        if (!live3d) document.documentElement.classList.remove("aw-sl-on");
        console.log("MYACT:3D:OFF");
      }
    };
  },
  onPause() { /* STAR LOOT có Menu/Paused riêng; menu engine không mở được khi game phủ trọn màn */ }
};

registerTemplate(starLootTemplate);
export default starLootTemplate;
