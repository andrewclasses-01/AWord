// =============================================================
// TEMPLATE: RACING WORDS — đua siêu xe 3D 2 đội  (Đợt 527, thầy 15/10/2026)
//
// Thầy: "đưa lên AWord, sử dụng options của AWord" ⇒ chốt (AskUserQuestion): Options = Cùng/khác câu hỏi · Số tên lửa tối đa ·
//   Độ dài đường + số vòng · Cầu nhảy bật/tắt · 13 xe (BỎ Bugatti Divo — CC-BY-NC) · iPad thật làm luôn ⇒ "ok build".
// Game THIẾT KẾ ở kho myGame (speed-run, tên cũ SPEED RUN; mẫu 3o = GÓI NHÚNG core/rw-3o.js ⇒ createRacingWords), chép vào ./3d bằng
//   `python tools/chep-racing-words.py` (+ ./xe3d 13 xe glb, ./sfx 29 tiếng thật). ⛔ Không sửa tay ./3d — sửa ở myGame (bản mới = tên mới).
// Khuôn ghép = STAR LOOT (maze-chase.js): ô `.aw-rw-host` gắn <body> phủ trọn trang · màn READY của engine bị bỏ (startScreen tự Play) ⇒
//   thầy thấy thẳng màn chờ XƯỞNG ANDREW STUDIO (chọn xe + START ⇒ phim intro 12 s ⇒ trận) · không gọi ui.finish (kết quả là màn của game) ·
//   hàng nút của game: Menu · Sound · Thư mục (act cùng thư mục) · Options (= bảng Options THẬT của engine qua ui.host.options) · iPad.
// Options lưu PHẲNG trong activity.options (proxy nháp engine chỉ thấy khoá cấp 1): srSameQ · srMsMax · srSteps · srLaps · srRamps.
//   Apply ⇒ ui.liveOptions ⇒ game.setOptions: cùng/khác câu hỏi + số tên lửa áp NGAY; đổi đường / vòng / cầu nhảy ⇒ false ⇒ engine dựng lại.
// iPad: ./rw-pad-signal.js (Firestore users/{uid}/items rwpad_host|pad0|pad1, kind "racingwords-pad") · nút iPad của game ≠ Off ⇒ claim
//   ipad_now {game:"racingwords"} ⇒ pad.html mở màn iPad của đội đã nhớ · `hold` từ lúc có iPad nối (Đợt 513). Mặc định iPad OFF (Đợt 514).
// Câu hỏi: content.questions[] = { question, answers:[{ text, correct }] } như Quiz / Star loot (editor dùng lại Quiz).
// =============================================================

import { registerTemplate } from "../../core/registry.js";
import { openQuizEditor } from "../quiz/quiz-editor.js";
import { showLoader3d, preloadLoader3d } from "../../core/loader3d.js";
const loader = () => { ensureCss(); return showLoader3d({ key: "racingwords", title: "RACING WORDS", theme: "space" }); };
preloadLoader3d("space");

const GAME = "./3d/rw-3o.js";                     // Đợt 527: myGame mẫu 3o
const CSS = ["sr3d-3g.css", "sr3d-3l.css", "sr3d-intro-3o.css", "rw-3o.css"];
const FONTS = "https://fonts.googleapis.com/css2?family=Exo+2:ital,wght@0,600;0,700;0,800;0,900;1,800;1,900&subset=vietnamese&display=swap";
// khoá game <-> khoá PHẲNG (activity.options)
const RW_DEF = { sameQ: true, msMax: 3, steps: 12, laps: 0, ramps: true };
const clampN = (v, lo, hi, d) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : d; };
const RW_FLAT = [["srSameQ", "sameQ", "b"], ["srMsMax", "msMax", "n", 1, 10], ["srSteps", "steps", "n", 3, 20], ["srLaps", "laps", "n", 0, 6], ["srRamps", "ramps", "b"]];
function gameOpts(o) {
  o = o || {}; const g = {};
  RW_FLAT.forEach(([f, k, t, lo, hi]) => {
    if (t === "n" && typeof o[f] === "number") g[k] = clampN(o[f], lo, hi, RW_DEF[k]);
    if (t === "b" && typeof o[f] === "boolean") g[k] = o[f];
  });
  return g;
}
function flatOpts(g) { const f = {}; RW_FLAT.forEach(([fk, k]) => { if (typeof g[k] === typeof RW_DEF[k]) f[fk] = g[k]; }); return f; }
const rwGame = act => ({ ...RW_DEF, ...gameOpts(act && act.options) });
// act chưa có khoá sr*: rải giá trị đầu vào activity.options TRONG BỘ NHỚ (không lưu) ⇒ bảng Options hiện đúng thứ game đang chơi
function flatSeed(act) { if (!act.options) act.options = {}; const f = flatOpts(rwGame(act)); Object.keys(f).forEach(k => { if (!(k in act.options)) act.options[k] = f[k]; }); }

let webglOk = null;
function canRun3d() {
  if (webglOk !== null) return webglOk;
  try { const c = document.createElement("canvas"); webglOk = !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { webglOk = false; }
  return webglOk;
}
function ensureCss() {
  if (document.querySelector("link[data-rw3d]")) return;
  [FONTS, ...CSS.map(f => new URL("./3d/" + f, import.meta.url).href)].forEach(href => {
    const l = document.createElement("link"); l.rel = "stylesheet"; l.href = href; l.dataset.rw3d = "1"; document.head.append(l);
  });
}
function playable(activity) {
  return (activity.content?.questions || [])
    .filter(q => q && Array.isArray(q.answers) && q.answers.some(a => a && a.correct) && q.answers.filter(a => a && a.text != null && a.text !== "").length >= 2)
    .map(q => ({ question: q.question || "", answers: q.answers.filter(a => a && a.text != null && a.text !== "").map(a => ({ text: String(a.text), correct: !!a.correct })) }));
}
function needMessage(root, text) {
  root.innerHTML = "";
  const d = document.createElement("div"); d.className = "aw-rw-need3d"; d.textContent = text; root.append(d);
}
let live3d = 0;   // số ván đang mở (lớp html.aw-rw-on)

// iPad: kênh bắt tay + claim ipad_now khi nút iPad của game ≠ Off; `hold` từ lúc có iPad nối
async function rwPadLink() {
  let S = null, P = null, N = null, claim = null, dead = false, mode = 0, linked = [false, false];
  try { [S, P] = await Promise.all([import("./rw-pad-signal.js"), import("./3d/sr3d-padlink-3e.js")]); } catch (e) { console.warn("Racing words iPad link", e); }
  import("../../core/ipad-now.js").then(m => { N = m; sync(); }).catch(() => {});
  function sync() {
    if (dead || !N) return;
    const hold = linked.some(Boolean);
    if (!mode) { if (claim) { claim.release(); claim = null; } return; }
    if (!claim) claim = N.claimIpad({ game: "racingwords", fight: true, ctl: mode === 2, hold });
    else claim.update({ hold, ctl: mode === 2 });
  }
  return {
    remote: S && P ? P.createPadHost({ signal: S.rwPadSignal(), padUrl: S.padUrl }) : null,
    onEvent(k, v) {
      if (k === "padMode") { mode = v | 0; sync(); }
      if (k === "pad" && v) { linked[v.team] = v.s === "on" || v.s === "relay"; sync(); }
    },
    release() { dead = true; if (claim) { claim.release(); claim = null; } }
  };
}

const racingWordsTemplate = {
  type: "racing_words",
  name: "Racing words",
  itemsKey: "questions",
  edit(container, activity, opts = {}) {
    openQuizEditor(container, activity, { ...opts, onSave: async updated => { if (updated) updated.type = "racing_words"; return opts.onSave?.(updated); } });
    const badge = container.querySelector(".aw-ed-typebadge"); if (badge) badge.textContent = "RACING WORDS";
  },
  toPrintItems(activity) {
    return (activity.content?.questions || []).filter(q => q && Array.isArray(q.answers) && q.answers.length)
      .map(q => ({ clue: q.question || "", answer: (q.answers.find(a => a.correct) || q.answers[0] || {}).text || "",
        options: q.answers.filter(a => a && a.text != null).map(a => ({ text: a.text, correct: !!a.correct })) }));
  },
  // game tự lo điểm + kết quả (về đích); engine không chấm, không đồng hồ, không trừ điểm
  timeCost: false,
  hidePointsOff: true,
  hideTimerOption: true,
  manualTimerStart: true,
  // ⭐ Đợt 527 — mục riêng của RACING WORDS trong bảng Options THẬT của engine (nút Options của game mở bảng này qua ui.host.options)
  buildExtraOptions({ panel, draft, mkCell, mkSeg, mkSliderCell, addCheck }) {
    const g = { ...RW_DEF, ...gameOpts(draft) };
    const qs = mkCell({ label: "Questions", wide: true });
    qs.ctl.append(mkSeg([{ value: "same", label: "Same for both teams" }, { value: "diff", label: "Different" }], g.sameQ ? "same" : "diff", v => { draft.srSameQ = v === "same"; }));
    panel.append(
      qs.cell,
      mkSliderCell({ label: "Missiles", sub: "most a car can hold", min: 1, max: 10, step: 1, value: g.msMax, tone: "red", onInput: v => { draft.srMsMax = v; } }).cell,
      mkSliderCell({ label: "Track length", sub: "segments · 1 per question", min: 3, max: 20, step: 1, value: g.steps, tone: "blue", onInput: v => { draft.srSteps = v; } }).cell,
      mkSliderCell({ label: "Laps", sub: "Auto = by track length", min: 0, max: 6, step: 1, value: g.laps, tone: "blue", offAt: 0,
        fmt: v => (v === 0 ? "Auto" : String(v)), onInput: v => { draft.srLaps = v; } }).cell
    );
    addCheck("Jump ramps", g.ramps, v => { draft.srRamps = v; }, { key: "srRamps" });
  },
  noAssignment: "Racing words is a classroom game for now — it cannot be set as homework yet.",
  // bỏ màn READY: Play ngay ⇒ thầy thấy thẳng xưởng ANDREW STUDIO. Không chạy được 3D ⇒ NÉM để engine giữ màn READY thường.
  startScreen({ play, ready }) {
    if (!canRun3d()) throw new Error("Racing words: no WebGL");
    const ld = loader();
    let gone = false;
    Promise.all([ready(), ld.ready]).then(() => { if (!gone) play(); });
    return { dispose() { gone = true; } };
  },
  mount(root, activity, ui) {
    const questions = playable(activity);
    if (!canRun3d()) { needMessage(root, "Racing words needs 3D graphics (WebGL), which this browser or device cannot run."); return () => {}; }
    if (!questions.length) { loader().drop(); needMessage(root, "No questions yet — add questions with one correct answer."); return () => {}; }
    const ld = loader();
    root.innerHTML = "";
    const box = document.createElement("div"); box.className = "aw-rw-host";
    document.body.append(box);
    document.documentElement.classList.add("aw-rw-on");
    live3d++;
    console.log("MYACT:3D:ON");   // myActivity: nhường card đồ hoạ (như Rocket race 3D)
    let dead = false, game = null, link = null;
    flatSeed(activity);
    if (ui.liveOptions) ui.liveOptions(o => (game && !dead ? game.setOptions({ ...RW_DEF, ...gameOpts(o) }) === true : false));
    const host = ui.host ? {
      listActs: () => ui.host.listActs(),
      openAct: id => ui.host.openAct(id),
      options: ui.host.options ? ov => ui.host.options(ov) : undefined,   // bảng Options thật của engine
      home: () => ui.host.home(),
      templates: () => ui.host.templates(),
      switchTemplate: t => ui.host.switchTemplate(t)
    } : null;
    const closeBox = () => {
      if (!box.isConnected) return;
      box.remove(); live3d = Math.max(0, live3d - 1);
      if (!live3d) document.documentElement.classList.remove("aw-rw-on");
      console.log("MYACT:3D:OFF");
    };
    Promise.all([import(GAME), rwPadLink()])
      .then(([m, L]) => {
        if (dead) { L.release(); return null; }
        link = L;
        return m.createRacingWords({ mount: box, questions, title: "RACING WORDS", options: rwGame(activity), host, remote: L.remote,
          onEvent: (k, v) => L.onEvent(k, v) });
      })
      .then(g => { if (!g) return; if (dead) g.destroy(); else game = g; ld.done(); })
      .catch(err => {
        console.error("Racing words failed to start", err);
        ld.drop();
        if (dead) return;
        if (link) { link.release(); link = null; }
        closeBox();
        needMessage(root, "Racing words could not start 3D graphics on this device.");
      });
    return function cleanup() {
      if (dead) return; dead = true;
      ld.drop();
      if (game) { try { game.destroy(); } catch (e) { console.warn("Racing words destroy", e); } game = null; }
      if (link) { link.release(); link = null; }
      closeBox();
    };
  },
  onPause() { /* RACING WORDS có MENU tạm dừng riêng; menu engine không mở được khi game phủ trọn màn */ }
};

registerTemplate(racingWordsTemplate);
export default racingWordsTemplate;
