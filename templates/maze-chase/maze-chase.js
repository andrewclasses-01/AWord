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
// Options của STAR LOOT nằm gọn trong `activity.options.starLoot` (không đụng khoá `timer`… của engine).
// =============================================================

import { registerTemplate } from "../../core/registry.js";
import { openMazeChaseEditor } from "./maze-chase-editor.js";
import { showLoader3d } from "../../core/loader3d.js";   // Đợt 451 — màn chờ thay khung trắng của AWord lúc nạp 3D
const loader = () => showLoader3d({ key: "starloot", title: "STAR LOOT", theme: "space" });

const CSS_3D = new URL("./3d/mc3d-2n.css", import.meta.url).href;
const SL_KEYS = ["fight", "timer", "timerSec", "lives", "difficulty", "bombs", "bombGift", "dpadStyle", "shuffle", "showAnswers"];

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
function slOptions(activity) {
  const o = (activity && activity.options) || {};
  if (o.starLoot && typeof o.starLoot === "object") return o.starLoot;
  const seed = {};
  if (typeof o.lives === "number") seed.lives = o.lives;
  if (typeof o.difficulty === "number") seed.difficulty = o.difficulty;
  if (typeof o.shuffleQuestions === "boolean") seed.shuffle = o.shuffleQuestions;
  return seed;
}
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
  manualTimerStart: true,   // đồng hồ engine không chạy — đồng hồ LED là của STAR LOOT
  // ⛔ Thầy chốt 02/10/2026: chưa giao bài được (form giao bài làm mờ ô này và hiện câu dưới).
  noAssignment: "Star loot is a classroom game for now — it cannot be set as homework yet.",
  // Bỏ màn READY của engine: bấm Play ngay khi engine chuẩn bị xong ⇒ thầy thấy thẳng màn START của STAR LOOT.
  // Không chạy được 3D ⇒ NÉM để engine giữ màn READY thường; bấm Play ra dòng báo thiếu WebGL (Đợt 450: không còn bản 2D).
  startScreen({ play, ready }) {
    if (!canRun3d()) throw new Error("Star loot: no WebGL");
    loader();   // Đợt 451 — hiện NGAY khung đầu (che màn READY + khung trống của engine trong lúc nạp)
    let gone = false;
    Promise.resolve(ready()).then(() => { if (!gone) play(); });
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
    import("./3d/mc3d-2n.js")
      .then(m => m.createMazeChase({
        mount: box, view: "tilt", questions,
        title: activity.title || "", act: activity.title || "",
        options: slOptions(activity),
        host: ui.host ? {
          listActs: () => ui.host.listActs(),
          openAct: id => ui.host.openAct(id),
          saveOptions: o => {
            const keep = {};
            SL_KEYS.forEach(k => { if (k in o) keep[k] = o[k]; });
            ui.host.saveOptions({ starLoot: keep });
          },
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
