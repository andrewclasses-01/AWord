// =============================================================
// TEMPLATE: RACING WORDS — đua siêu xe 3D 2 đội  (Đợt 527, thầy 15/10/2026)
//
// Thầy: "đưa lên AWord, sử dụng options của AWord" ⇒ chốt (AskUserQuestion): Options = Cùng/khác câu hỏi · Số tên lửa tối đa ·
//   Độ dài đường + số vòng · Cầu nhảy bật/tắt · 13 xe (BỎ Bugatti Divo — CC-BY-NC) · iPad thật làm luôn ⇒ "ok build".
// ⭐ Đợt 538: myGame mẫu 4f (core/rw-4f.js) — sau buổi thử TOMKO + 2 iPad: cổng iPad ở XƯỞNG (START chỉ mở khi 2 iPad nối THẲNG + đã bẻ thử trái/phải),
//   đường nối iPad SỐNG SUỐT TRANG (rwPadLink ⇒ PADLINK; Apply / Start again / đổi xe không nối lại), mở ngay từ màn chờ tải; iPad tự bắt tay lại khi "slow"
//   + nút Reconnect + dòng chẩn đoán ICE; iPad 4f lấy mốc nghiêng tuyệt đối theo hướng màn (bỏ LEVEL). pad.js nạp padlink-4f + padui-4f.
// ⭐ Đợt 537: myGame mẫu 4e (core/rw-4e.js) = 4d + ⚙ Settings mở được MỌI LÚC (cả trên xưởng intro) và TẠM DỪNG game · mặc định Drive on iPad + Tilt ·
//   Cockpit · Sky view Off · Traffic Off (nhớ theo máy, khoá ".v2") · bay xa hơn khi lên dốc bằng boost · nghiêng đúng chiều vô lăng, đáp nghiêng = BAD mất lái ·
//   bỏ chữ phủ màn xưởng. Màn chờ: ảnh tĩnh RIÊNG ./rw-loading.webp (theme "race" của core/loader3d.js), không còn cảnh "space" của STAR LOOT.
//   Options: chọn Race ⇒ làm MỜ thanh không có tác dụng (Length/Track length/Laps khi Time·Words; Time khi Length/Words).
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
import { showLoader3d, preloadLoader3d, filesOf } from "../../core/loader3d.js";
import { createLoadPace } from "./3d/rw-loadpace-4h.js";   // ⭐ Đợt 551: % màn chờ chia theo THỜI GIAN (myGame 4h) — hết đứng 99 %
import { FILES as LOAD_FILES, ALT as LOAD_ALT, CARS as LOAD_CARS } from "./load-files.js";   // ⭐ Đợt 544 — % load thật (tools/tao-load-files.py)
// Đợt 544: 2 xe đang chọn — cùng luật rw-4f (máy nhớ "speedrun.cars", không có ⇒ Y2 + H4)
const loadCars = () => { let c = null; try { c = JSON.parse(localStorage.getItem("speedrun.cars") || "null"); } catch (e) { /* */ }
  if (!Array.isArray(c) || c.length !== 2 || !c.every(id => LOAD_CARS[id])) c = ["Y2", "H4"];
  return c.map(id => ["templates/racing-words/xe3d/" + id + ".glb", LOAD_CARS[id] || 0, 0]); };
const loadFiles = () => filesOf(LOAD_FILES, LOAD_ALT, loadCars());
// Đợt 544 (thầy: "đợi tất cả tiếng"): intro xưởng chạy NGAY khi game dựng ⇒ tải sẵn toàn bộ tiếng TRƯỚC (bộ đếm % đếm luôn),
// game fetch lại cùng địa chỉ thì lấy từ bộ nhớ đệm trình duyệt ⇒ tiếng nền xưởng / nổ máy có ngay từ giây đầu.
const preloadSounds = () => Promise.all(loadFiles().filter(f => f[2]).map(([u]) => fetch(u).then(r => r.arrayBuffer()).catch(() => null)));
import { block3dHere, block3dMessage } from "../../core/myact-board.js";   // ⭐ Đợt 530 — game 3D chỉ chạy ở bảng 1 của myActivity
const LOAD_BG = new URL("./rw-loading.webp", import.meta.url).href;   // Đợt 537: ảnh tĩnh riêng (chụp xưởng ANDREW STUDIO của game, 1920×1080, 63 KB)
const loader = () => { ensureCss(); return showLoader3d({ key: "racingwords", title: "RACING WORDS", theme: "race", bg: LOAD_BG, files: loadFiles, pace: { create: createLoadPace, key: "rw" } }); };
preloadLoader3d("race", LOAD_BG);

const GAME = "./3d/rw-5n.js";   // ⭐ Đợt 591: myGame 5n (boost tối đa khi còn thanh + cân bằng theo mức dẫn, đường 7 km quanh HỒ, độ nhạy vô lăng, traffic 0–100 %)
// Đợt 589 (cũ): const GAME = "./3d/rw-5l.js";   // ⭐ Đợt 589: myGame 5l (đường thật 3,5 km cua gắt, cọ rào, bay chông chênh + lộn vòng, xe traffic 3D)
// Đợt 571 (cũ): const GAME = "./3d/rw-5k.js";   // ⭐ Đợt 571: myGame 5k (Roadster bám xe + tên lửa tự đuổi) ·                     // ⭐ Đợt 570: myGame 5j — XE BAY ROADSTER trong bộ Drone (Settings ▸ Drone ▸ FLYING CAR · Roadster).
// Đợt 558 (cũ): const GAME = "./3d/rw-5i.js";                     // ⭐ Đợt 558: myGame 5i — vạch lửa drone · Settings ▸ Boost · sửa tab Driver.
// Đợt 556 (cũ): const GAME = "./3d/rw-5h.js";                     // ⭐ Đợt 556: myGame 5h — tối ưu TOMKO (2 drone mượt, độ nét giữ 0,9–1,0).   // Đợt 554: ⭐ Đợt 554: myGame 5f — 2 DRONE (iPad thứ 4), drone trong xưởng, máy quay theo xe dẫn.
// Đợt 553 (cũ): const GAME = "./3d/rw-5d.js";                     // ⭐ Đợt 553: myGame 4k→5d — DRONE iPad thứ 3 (Settings ▸ Drone; mặc định Off). Trước: "./3d/rw-4j.js"
// const GAME_4J = "./3d/rw-4j.js";                     // ⭐ Đợt 551: myGame 4g→4j (kết trận slow motion · chờ câu mới 3 s · loading đều + hết đơ bóng xe · boost phát sáng · cửa sổ góc + tạm dừng chung + đèn 3-2-1 · Drive on iPad màn lớn lái cùng · tên lửa chỉ bắn phía trước / bay thấp / quầng đỏ · trúng đạn lệch + DAMAGE · mũi tên đối thủ dính mép · bảng đếm đầu vạch · nút bắn kiểu thẻ · giá tên lửa thấp) · Đợt 538: myGame mẫu 4f (cổng iPad ở xưởng: START khi 2 iPad nối thẳng + thử trái/phải · đường nối sống qua Apply / Start again / đổi xe · tự nối lại khi slow · mốc nghiêng tự lấy) · Đợt 537: myGame mẫu 4e (Settings mọi nơi + tạm dừng, mặc định mới, bay xa, nghiêng đúng chiều, BAD mất lái) · Đợt 535: myGame mẫu 4d (5 đợt sau 3y: chế độ đua, cong thật, lái tay, dốc xoắn, phần thưởng, xe khác, camera gộp) · Đợt 534: myGame mẫu 3y (lái nghiêng iPad) · Đợt 533: myGame mẫu 3r (mượt TOMKO) · Đợt 531: myGame mẫu 3q (Fight options, cảnh xa đúng vật lý, 35 km/h) · Đợt 529: 3p · Đợt 527: 3o
const CSS = ["sr3d-3g.css", "sr3d-3l.css", "sr3d-intro-3o.css", "rw-3r.css", "rw-3z.css", "rw-4a.css", "rw-4b.css", "rw-4c.css", "rw-4d.css", "rw-4e.css", "rw-4f.css", "rw-4g.css", "rw-4h.css", "rw-4i.css", "rw-4j-fb.css", "rw-4j.css", "rw-4k.css", "rw-4l.css", "rw-4o.css", "rw-4r.css", "rw-4w.css", "rw-4y.css", "rw-5e.css", "rw-5f.css", "rw-5h.css", "rw-5i.css"];   // ⭐ Đợt 558: + 5i (bảng FIRE LINE, tab Boost)   // ⭐ Đợt 556: + 5h (bỏ blur keyframes)   // ⭐ Đợt 554: + 5e (2 drone) · 5f (chọn drone ở xưởng)   // Đợt 551: + 4g…4j (đúng thứ tự) · Đợt 538: + rw-4f (cổng iPad) · Đợt 537: + rw-4e · Đợt 535: + 3z…4d (đúng thứ tự)
const FONTS = "https://fonts.googleapis.com/css2?family=Exo+2:ital,wght@0,600;0,700;0,800;0,900;1,800;1,900&subset=vietnamese&display=swap";
// khoá game <-> khoá PHẲNG (activity.options)
// ⭐ Đợt 531 (thầy) — Options kiểu FIGHT của Rocket Race: Lives (srLives 0 = tắt) · Missile damages 1–5 (srMsDmg) · Time delay (srTie giây,
//   0 = ∞, thang nấc như Fight AWord) · Miss wait (srMissWait giây 0–20, −1 = ∞) · Missile streak 1–10 (srMsStreak) · Missiles max 0–10 (srMsMax, 0 = Off).
//   Time delay / Miss wait chỉ có tác dụng khi Questions = Same (theo LƯỢT); Different = mỗi đội nhịp riêng.
// ⭐ Đợt 535 — Race (srRace len | time | words) · Length ×1 / ×1,5 / ×2 / ×3 (srLenK) · Time (srTimeS giây) · Twist ramps (srTwists) ·
//   Road pickups Boost / Life / Missile (srPkBoost · srPkLife · srPkMissile). Traffic + Sky view nằm trong ⚙ Settings của game (thói quen máy chiếu, không theo act).
const RW_DEF = { sameQ: true, msMax: 3, steps: 12, laps: 0, ramps: true, lives: 0, msDmg: 2, tieWait: 0.1, missWait: 20, streak: 3,
  race: "len", lenK: 2, timeS: 180, twists: true, pkBoost: true, pkLife: true, pkMissile: true };
const RACES = ["len", "time", "words"], LENKS = [1, 1.5, 2, 3];
const clampN = (v, lo, hi, d) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : d; };
const RW_FLAT = [["srSameQ", "sameQ", "b"], ["srMsMax", "msMax", "n", 0, 10], ["srSteps", "steps", "n", 3, 20], ["srLaps", "laps", "n", 0, 6], ["srRamps", "ramps", "b"],
  ["srLives", "lives", "n", 0, 10], ["srMsDmg", "msDmg", "n", 1, 5], ["srMsStreak", "streak", "n", 1, 10],
  ["srTimeS", "timeS", "n", 60, 600], ["srTwists", "twists", "b"], ["srPkBoost", "pkBoost", "b"], ["srPkLife", "pkLife", "b"], ["srPkMissile", "pkMissile", "b"]];   // Đợt 535
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
  if (RACES.includes(o.srRace)) g.race = o.srRace;                                  // Đợt 535
  if (LENKS.includes(o.srLenK)) g.lenK = o.srLenK;
  return g;
}
function flatOpts(g) {
  const f = {}; RW_FLAT.forEach(([fk, k]) => { if (typeof g[k] === typeof RW_DEF[k]) f[fk] = g[k]; });
  if (typeof g.tieWait === "number") f.srTie = g.tieWait === Infinity ? 0 : g.tieWait;
  if (typeof g.missWait === "number") f.srMissWait = g.missWait === Infinity ? -1 : g.missWait;
  if (RACES.includes(g.race)) f.srRace = g.race;                                    // Đợt 535
  if (LENKS.includes(g.lenK)) f.srLenK = g.lenK;
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

// iPad: kênh bắt tay + claim ipad_now khi chế độ iPad của game ≠ Off; `hold` từ lúc có iPad nối
// ⭐ Đợt 538 (thầy thử TOMKO 16/10: "1 iPad slow không lái nổi" + "kết nối trước intro, test ok mới cho start, chỉnh Options / Start again / đổi xe vẫn giữ kết nối"):
//   ĐƯỜNG NỐI SỐNG SUỐT TRANG — một bản cho cả trang (PADLINK), không còn dựng lại theo mỗi mount: Apply Options (engine dựng lại game) ⇒ game mới chỉ GẮN vào
//   đường nối đang sống (createPadHost 4f: attach/detach), iPad không bắt tay lại, không nháy "Waiting for the game". Mở NGAY từ màn chờ tải (startScreen) ⇒
//   iPad bắt tay song song lúc 3D đang nạp; claim ipad_now theo chế độ nhớ trên máy ("racingwords.padMode.v2", mặc định 2 = Drive on iPad).
//   Hết người dùng (rời Racing words) ⇒ nhả claim ngay (ipad-now gộp 1,5 s nên dựng lại game không nháy), đóng đường nối sau 30 s nếu không ai mở lại.
//   Cổng START ở xưởng + tự nối lại khi slow + chẩn đoán: trong gói nhúng 4f (./3d/rw-4f.js, ./3d/sr3d-padlink-4f.js).
const PADM_KEY = "racingwords.padMode.v2";
const savedPadMode = () => { try { const v = localStorage.getItem(PADM_KEY); return v === "0" || v === "1" || v === "2" ? +v : 2; } catch (e) { return 2; } };
let PADLINK = null;
function rwPadLink() {
  if (PADLINK && !PADLINK.dead) { PADLINK.use(); return PADLINK.ready; }
  let N = null, claim = null, mode = savedPadMode(), linked = [false, false, false, false],   /* Đợt 554: + [3] iPad DRONE 2 */ users = 1, dropT = 0;   // Đợt 553: + [2] iPad DRONE
  const L = {
    dead: false, remote: null,
    onEvent(k, v) {
      if (k === "padMode") { mode = v | 0; sync(); }
      if (k === "pad" && v) { linked[v.team] = v.s === "on" || v.s === "relay"; sync(); }
    },
    use() { users++; clearTimeout(dropT); sync(); },
    release() {                                   // một mount thôi dùng
      users = Math.max(0, users - 1); if (users) return;
      if (claim) { claim.release(); claim = null; }
      clearTimeout(dropT); dropT = setTimeout(close, 30000);
    }
  };
  function sync() {
    if (L.dead || !N) return;
    const hold = linked.some(Boolean);
    if (!mode || !users) { if (claim) { claim.release(); claim = null; } return; }
    if (!claim) claim = N.claimIpad({ game: "racingwords", fight: true, ctl: mode === 2, hold });
    else claim.update({ hold, ctl: mode === 2 });
  }
  function close() {
    if (users || L.dead) return;
    L.dead = true; if (PADLINK === L) PADLINK = null;
    if (claim) { claim.release(); claim = null; }
    try { L.remote && L.remote.close && L.remote.close(); } catch (e) { /* */ }
  }
  import("../../core/ipad-now.js").then(m => { N = m; sync(); }).catch(() => {});
  L.ready = Promise.all([import("./rw-pad-signal.js"), import("./3d/sr3d-padlink-5m.js")]).then(([S, P]) => {   // ⭐ Đợt 590: 5m (TAKEN chỉ khi chỗ đang nối thật · chủ treo 6 s thì nhường)   // ⭐ Đợt 554: 5e (4 chỗ: 2 đội + 2 drone)   // ⭐ Đợt 553: 5a (3 chỗ: 2 đội + drone)
    if (L.dead) return L;
    const r = P.createPadHost({ signal: S.rwPadSignal(), padUrl: S.padUrl });
    // mở phiên NGAY (chưa có game): game gắn sau sẽ nhận lại trạng thái từng đội
    r.attach({ press() {}, drive() {}, answer() {}, status(t, s) { L.onEvent("pad", { team: t, s }); } });
    r.onChange(t => L.onEvent("pad", { team: t, s: r.live(t).s }));
    L.remote = r;
    return L;
  }).catch(e => { console.warn("Racing words iPad link", e); return L; });
  PADLINK = L;
  return L.ready;
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
    // ⭐ Đợt 535 — CHẾ ĐỘ ĐUA: mọi kiểu thắng đều phải chạy qua vạch đích (hết giờ / hết từ / hết mạng ⇒ đích hiện trước xe thắng)
    const race = mkCell({ label: "Race", wide: true });
    race.ctl.append(mkSeg([{ value: "len", label: "Length" }, { value: "time", label: "Time" }, { value: "words", label: "Words" }], g.race, v => { draft.srRace = v; lockRace(v); }));
    race.cell.title = "Length: a fixed track. Time: countdown — the team further ahead when time is up drives to the finish line. Words: race until the words run out — the finish line appears near the last words";
    const lenK = mkSliderCell({ label: "Length", sub: "Race = Length", min: 0, max: 3, step: 1, value: Math.max(0, LENKS.indexOf(g.lenK)), tone: "blue",
      fmt: p => "×" + String(LENKS[p]).replace(".", ","), onInput: p => { draft.srLenK = LENKS[p]; } });
    lenK.cell.title = "Track length × Track segments (×2 = twice as long as before)";
    const timeS = mkSliderCell({ label: "Time", sub: "Race = Time", min: 1, max: 10, step: 1, value: Math.round(g.timeS / 60), tone: "blue",
      fmt: v => v + " min", onInput: v => { draft.srTimeS = v * 60; } });
    timeS.cell.title = "Countdown for Race = Time";
    // ⭐ Đợt 537 (thầy): thanh không có tác dụng với chế độ đua đang chọn ⇒ MỜ + không chạm được (.is-locked, luật Đợt 188 "mất màu chứ không ẩn")
    //   Length · Track length · Laps chỉ dùng khi Race = Length (Time / Words: đường mở, đích dời) · Time chỉ dùng khi Race = Time.
    const segs = mkSliderCell({ label: "Track length", sub: "segments · 1 per question", min: 3, max: 20, step: 1, value: g.steps, tone: "blue", onInput: v => { draft.srSteps = v; } });
    const laps = mkSliderCell({ label: "Laps", sub: "Auto = by track length", min: 0, max: 6, step: 1, value: g.laps, tone: "blue", offAt: 0,
      fmt: v => (v === 0 ? "Auto" : String(v)), onInput: v => { draft.srLaps = v; } });
    function lockRace(r) {
      [lenK, segs, laps].forEach(c => c.cell.classList.toggle("is-locked", r !== "len"));
      timeS.cell.classList.toggle("is-locked", r !== "time");
    }
    lockRace(g.race);
    panel.append(
      race.cell, lenK.cell, timeS.cell,
      qs.cell, lives.cell, dmg.cell, streak.cell, msMax.cell, tie.cell, miss.cell,
      segs.cell, laps.cell
    );
    addCheck("Jump ramps", g.ramps, v => { draft.srRamps = v; }, { key: "srRamps" });
    addCheck("Twist ramps", g.twists, v => { draft.srTwists = v; }, { key: "srTwists" });            // Đợt 535
    addCheck("Road pickups: Boost", g.pkBoost, v => { draft.srPkBoost = v; }, { key: "srPkBoost" });
    addCheck("Road pickups: Life", g.pkLife, v => { draft.srPkLife = v; }, { key: "srPkLife" });
    addCheck("Road pickups: Missile", g.pkMissile, v => { draft.srPkMissile = v; }, { key: "srPkMissile" });
  },
  noAssignment: "Racing words is a classroom game for now — it cannot be set as homework yet.",
  // ⭐ Đợt 531 (thầy): "game hiện tại là chế độ FIGHT (2 đội đấu nhau), không phải single — mặc định Fight ở màn chọn, tạm tắt Single".
  //   fightOnly ⇒ màn chọn WORDS: FIGHT sáng sẵn, SINGLE mờ. Fight nằm NGAY TRONG ô (như Train Rush `boxMode`) ⇒ READY là chơi luôn;
  //   ownFight chỉ để engine biết game có Fight (MODE ▸ Fight từ đường khác ⇒ dựng lại đúng game này).
  fightOnly: true,
  boxMode() { /* chỉ có Fight — không có gì để đổi */ },
  ownFight(root, act) { return racingWordsTemplate.mount(root, act, {}); },
  // bỏ màn READY: Play ngay ⇒ thầy thấy thẳng xưởng ANDREW STUDIO. Không chạy được 3D ⇒ NÉM để engine giữ màn READY thường.
  startScreen({ play, ready, preflight }) {
    if (preflight) return { dispose() {} };   // ⭐ Đợt 549 — màn chọn WORDS đang dựng NHẸ (chỉ lấy bảng Options): chưa nạp 3D, chưa Play — READY mới dựng thật
    if (block3dHere()) { ready().then(() => play()); return { dispose() {} }; }   // Đợt 530: bảng 2..5 — không màn chờ 3D, không thử WebGL
    if (!canRun3d()) throw new Error("Racing words: no WebGL");
    const ld = loader();
    // ⭐ Đợt 538: iPad bắt tay NGAY lúc 3D đang nạp — giữ đường nối tới khi màn chờ đi (dispose, ngay trước mount) hoặc tối đa 90 s nếu thầy rời trang chờ
    let early = null; const letGo = () => { if (early) { const p = early; early = null; p.then(L => L.release()); } };
    if (savedPadMode()) { early = rwPadLink(); setTimeout(letGo, 90000); }
    let gone = false;
    Promise.all([ready(), ld.ready]).then(() => { if (!gone) play(); });
    return { dispose() { gone = true; letGo(); } };
  },
  mount(root, activity, ui) {
    if (ui && ui.preflight) { root.innerHTML = ""; return () => {}; }   // ⭐ Đợt 549 — bàn ngầm dựng NHẸ của màn chọn: không nạp 3D
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
    let framed = () => {}; const frameP = new Promise(r => { framed = r; });   // Đợt 551: màn chờ đi khi KHUNG ĐẦU đã vẽ
    Promise.all([import(GAME), rwPadLink(), preloadSounds()])
      .then(([m, L]) => {
        if (dead) { L.release(); return null; }
        link = L;   // Đợt 538: đường nối dùng chung cả trang (L.remote sống qua các lần dựng lại game)
        return m.createRacingWords({ mount: box, questions, title: "RACING WORDS", options: rwGame(activity), host, remote: L.remote,
          onEvent: (k, v) => L.onEvent(k, v), onProgress: k => { try { ld.mark && ld.mark(k); } catch (e) { /* */ } if (k === "frame") framed(); } });   // Đợt 551
      })
      .then(g => { if (!g) return; if (dead) { g.destroy(); return; } game = g; Promise.race([frameP, new Promise(r => setTimeout(r, 6000))]).then(() => ld.done()); })
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
