// =============================================================
// TEMPLATE: RACING WORDS — đua siêu xe 3D 2 đội  (Đợt 527, thầy 15/10/2026)
//
// Thầy: "đưa lên AWord, sử dụng options của AWord" ⇒ chốt (AskUserQuestion): Options = Cùng/khác câu hỏi · Số tên lửa tối đa ·
//   Độ dài đường + số vòng · Cầu nhảy bật/tắt · 13 xe (BỎ Bugatti Divo — CC-BY-NC) · iPad thật làm luôn ⇒ "ok build".
// ⭐ Đợt 534: myGame mẫu 3y (core/rw-3y.js) = 3r + LÁI NGHIÊNG iPad: tap-lô phanh trái · ga phải, dấu đỉnh vô lăng máy bay giấy, nút iPad thêm
//   Steering (Touch wheel / Tilt) + Full lock + Smoothing (gửi "c:"), iPad 3y (sr3d-padui-3y.js) + đường nối sr3d-padlink-3y.js ("c:" kiểu lái, "r:" tên lửa qua kho).
// ⭐ Đợt 533: myGame mẫu 3r (core/rw-3r.js) = 3q tối ưu MƯỢT trên TOMKO (đo act 572 trong myActivity: xưởng 37⇒60, phim 18⇒60, đua hết dịch shader giữa trận).
// ⭐ Đợt 531: myGame mẫu 3q (core/rw-3q.js) = 3p + Options kiểu Fight Rocket Race + cảnh xa đúng vật lý + 35 km/h; template CHỈ có Fight (fightOnly).
// ⭐ Đợt 529: myGame mẫu 3p (core/rw-3p.js) = 3o + CHẠM ĐÚP lúc phim intro ⇒ vào thẳng 5 đèn + tối ưu (gộp lưới xe, số đo xe sẵn, dịch sẵn shader).
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
import { block3dHere, block3dMessage } from "../../core/myact-board.js";   // ⭐ Đợt 530 — game 3D chỉ chạy ở bảng 1 của myActivity
const loader = () => { ensureCss(); return showLoader3d({ key: "racingwords", title: "RACING WORDS", theme: "space" }); };
preloadLoader3d("space");

const GAME = "./3d/rw-3y.js";                     // Đợt 534: myGame mẫu 3y (lái nghiêng iPad) · Đợt 533: myGame mẫu 3r (mượt TOMKO) · Đợt 531: myGame mẫu 3q (Fight options, cảnh xa đúng vật lý, 35 km/h) · Đợt 529: 3p · Đợt 527: 3o
const CSS = ["sr3d-3g.css", "sr3d-3l.css", "sr3d-intro-3o.css", "rw-3r.css"];
const FONTS = "https://fonts.googleapis.com/css2?family=Exo+2:ital,wght@0,600;0,700;0,800;0,900;1,800;1,900&subset=vietnamese&display=swap";
// khoá game <-> khoá PHẲNG (activity.options)
// ⭐ Đợt 531 (thầy) — Options kiểu FIGHT của Rocket Race: Lives (srLives 0 = tắt) · Missile damages 1–5 (srMsDmg) · Time delay (srTie giây,
//   0 = ∞, thang nấc như Fight AWord) · Miss wait (srMissWait giây 0–20, −1 = ∞) · Missile streak 1–10 (srMsStreak) · Missiles max 0–10 (srMsMax, 0 = Off).
//   Time delay / Miss wait chỉ có tác dụng khi Questions = Same (theo LƯỢT); Different = mỗi đội nhịp riêng.
const RW_DEF = { sameQ: true, msMax: 3, steps: 12, laps: 0, ramps: true, lives: 0, msDmg: 2, tieWait: 0.1, missWait: 20, streak: 3 };
const clampN = (v, lo, hi, d) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : d; };
const RW_FLAT = [["srSameQ", "sameQ", "b"], ["srMsMax", "msMax", "n", 0, 10], ["srSteps", "steps", "n", 3, 20], ["srLaps", "laps", "n", 0, 6], ["srRamps", "ramps", "b"],
  ["srLives", "lives", "n", 0, 10], ["srMsDmg", "msDmg", "n", 1, 5], ["srMsStreak", "streak", "n", 1, 10]];
// Time delay: thang nấc y như Fight AWord (core/fight.js DELAY_STEPS) — 0,1 … 3,0 từng 0,1 · 3,5 … 10 từng 0,5 · nấc sau cùng = ∞
const DELAY_STEPS = (() => { const out = []; for (let t = 1; t <= 30; t++) out.push(t / 10); for (let t = 35; t <= 100; t += 5) out.push(t / 10); return out; })();
const snapDelay = s => DELAY_STEPS.reduce((b, v) => (Math.abs(v - s) < Math.abs(b - s) ? v : b), DELAY_STEPS[0]);
function gameOpts(o) {
  o = o || {}; const g = {};
  RW_FLAT.forEach(([f, k, t, lo, hi]) => {
    if (t === "n" && typeof o[f] === "number") g[k] = clampN(o[f], lo, hi, RW_DEF[k]);
    if (t === "b" && typeof o[f] === "boolean") g[k] = o[f];
  });
  if (typeof o.srTie === "number") g.tieWait = o.srTie === 0 ? Infinity : snapDelay(o.srTie);
  if (typeof o.srMissWait === "number") g.missWait = o.srMissWait < 0 ? Infinity : clampN(o.srMissWait, 0, 20, 20);
  return g;
}
function flatOpts(g) {
  const f = {}; RW_FLAT.forEach(([fk, k]) => { if (typeof g[k] === typeof RW_DEF[k]) f[fk] = g[k]; });
  if (typeof g.tieWait === "number") f.srTie = g.tieWait === Infinity ? 0 : g.tieWait;
  if (typeof g.missWait === "number") f.srMissWait = g.missWait === Infinity ? -1 : g.missWait;
  return f;
}
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
  try { [S, P] = await Promise.all([import("./rw-pad-signal.js"), import("./3d/sr3d-padlink-3y.js")]); } catch (e) { console.warn("Racing words iPad link", e); }
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
    qs.ctl.append(mkSeg([{ value: "same", label: "Same · in turns" }, { value: "diff", label: "Different" }], g.sameQ ? "same" : "diff", v => { draft.srSameQ = v === "same"; }));
    qs.cell.title = "Same: both teams get the same question at the same time (Time delay and Miss wait apply). Different: each team at its own pace";
    // ⭐ Đợt 531 — như Fight của Rocket Race (nhãn, màu, nấc ∞): xanh lá = tài nguyên · đỏ = phạt / tên lửa · xanh dương = thời gian chờ
    const lives = mkSliderCell({ label: "Lives", min: 0, max: 10, step: 1, value: g.lives, tone: "green", offAt: 0,
      fmt: v => (v === 0 ? "∞" : String(v)), onInput: v => { draft.srLives = v; } });
    lives.cell.title = "Wrong answer −1 life, missile hit −1 life. Out of lives = the car blows up and the other team wins. 0 = unlimited";
    const dmg = mkSliderCell({ label: "Missile damages", min: 1, max: 5, step: 1, value: g.msDmg, tone: "red",
      fmt: v => String(v), onInput: v => { draft.srMsDmg = v; } });
    dmg.cell.title = "How hard a missile hit is: the car spins and stands still about this many seconds, black smoke covers the windscreen longer (and −1 life when Lives is on)";
    const streak = mkSliderCell({ label: "Missile streak", min: 1, max: 10, step: 1, value: g.streak, tone: "red",
      fmt: v => String(v), onInput: v => { draft.srMsStreak = v; } });
    streak.cell.title = "Correct answers in a row that make 1 missile";
    const msMax = mkSliderCell({ label: "Missiles max", min: 0, max: 10, step: 1, value: g.msMax, tone: "red", offAt: 0,
      fmt: v => (v === 0 ? "Off" : String(v)), onInput: v => { draft.srMsMax = v; } });
    msMax.cell.title = "Most missiles a car can hold. 0 = no missiles";
    const UNLIM = DELAY_STEPS.length + 1;
    const tie = mkSliderCell({ label: "Time delay", sub: "let the other team finish", min: 1, max: UNLIM, step: 1,
      value: g.tieWait === Infinity ? UNLIM : DELAY_STEPS.indexOf(snapDelay(g.tieWait)) + 1, tone: "blue",
      fmt: p => (p >= UNLIM ? "∞" : DELAY_STEPS[p - 1].toFixed(1) + "s"), onInput: p => { draft.srTie = p >= UNLIM ? 0 : DELAY_STEPS[p - 1]; } });
    tie.cell.title = "Same questions: once one team answers right, how long the other team can still answer. Minimum = locked out at once; ∞ = waits";
    const WW = 21;
    const miss = mkSliderCell({ label: "Miss wait", sub: "after the other team's mistake", min: 0, max: WW, step: 1,
      value: g.missWait === Infinity ? WW : g.missWait, tone: "blue",
      fmt: v => (v >= WW ? "∞" : v + "s"), onInput: v => { draft.srMissWait = v >= WW ? -1 : v; } });
    miss.cell.title = "Same questions: once one team answers wrong, how long the other team still has before both move on. ∞ = waits";
    panel.append(
      qs.cell, lives.cell, dmg.cell, streak.cell, msMax.cell, tie.cell, miss.cell,
      mkSliderCell({ label: "Track length", sub: "segments · 1 per question", min: 3, max: 20, step: 1, value: g.steps, tone: "blue", onInput: v => { draft.srSteps = v; } }).cell,
      mkSliderCell({ label: "Laps", sub: "Auto = by track length", min: 0, max: 6, step: 1, value: g.laps, tone: "blue", offAt: 0,
        fmt: v => (v === 0 ? "Auto" : String(v)), onInput: v => { draft.srLaps = v; } }).cell
    );
    addCheck("Jump ramps", g.ramps, v => { draft.srRamps = v; }, { key: "srRamps" });
  },
  noAssignment: "Racing words is a classroom game for now — it cannot be set as homework yet.",
  // ⭐ Đợt 531 (thầy): "game hiện tại là chế độ FIGHT (2 đội đấu nhau), không phải single — mặc định Fight ở màn chọn, tạm tắt Single".
  //   fightOnly ⇒ màn chọn WORDS: FIGHT sáng sẵn, SINGLE mờ. Fight nằm NGAY TRONG ô (như Train Rush `boxMode`) ⇒ READY là chơi luôn;
  //   ownFight chỉ để engine biết game có Fight (MODE ▸ Fight từ đường khác ⇒ dựng lại đúng game này).
  fightOnly: true,
  boxMode() { /* chỉ có Fight — không có gì để đổi */ },
  ownFight(root, act) { return racingWordsTemplate.mount(root, act, {}); },
  // bỏ màn READY: Play ngay ⇒ thầy thấy thẳng xưởng ANDREW STUDIO. Không chạy được 3D ⇒ NÉM để engine giữ màn READY thường.
  startScreen({ play, ready }) {
    if (block3dHere()) { ready().then(() => play()); return { dispose() {} }; }   // Đợt 530: bảng 2..5 — không màn chờ 3D, không thử WebGL
    if (!canRun3d()) throw new Error("Racing words: no WebGL");
    const ld = loader();
    let gone = false;
    Promise.all([ready(), ld.ready]).then(() => { if (!gone) play(); });
    return { dispose() { gone = true; } };
  },
  mount(root, activity, ui) {
    if (block3dHere()) { root.innerHTML = ""; return block3dMessage(root, "Racing words"); }   // Đợt 530
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
