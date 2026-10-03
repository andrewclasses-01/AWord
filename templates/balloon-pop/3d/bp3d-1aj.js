// TRAIN RUSH — lõi MẪU 1aj (03/10/2026): như 1ai + destroy() (dỡ sạch bàn chơi — AWord đổi chế độ / rời act không nạp lại trang).
// TRAIN RUSH — lõi MẪU 1ai (03/10/2026): thầy "ghép 1ab + 1ah thành 1 bản tốt nhất" — y hệt 1ah, chỉ mở nút Mode ▸ Fight (trước: "coming soon")
//   ⇒ onEvent("mode", "fight"); trang mau-1ai-train-rush.html lo chuyển chế độ. Chạy đơn = 1ab + mọi cải tiến 1ac→1ah (cảnh 1ag, âm thanh thật 1ah).
// TRAIN RUSH — lõi MẪU 1ag (30/9/2026): như 1af, cảnh west-world-1ag (ít con vật mặt đất, có điều phối; chữ đổ không tự dựng trước mắt).
// TRAIN RUSH — lõi MẪU 1af (30/9/2026): 10 ý thầy sau khi thử 1ae trên myActivity —
//   toa củi khắc LV.n theo màn · tàu trình diễn intro dùng toa gỗ khắc hoa văn (không bảng TEAM) · khinh khí cầu nhanh hơn 10 %,
//   càng lên màn càng nhanh hơn tàu · KHUNG MÁY QUAY: toa cuối sát mép (không để đất trống sau đuôi tàu), toa chờ ưu tiên giữa
//   màn nhưng đầu máy luôn thấy trọn · cảnh west-world-1af (thú không chìm đất, đuổi nhau có khoảng hở, cảnh mới, cỏ thưa dần).
// TRAIN RUSH — lõi MẪU 1ae (30/9/2026): INTRO ĐIỆN ẢNH cho Fight — fightIntro({ colors, onDone }) quay 2 đoàn tàu đỏ/xanh đua song song
// trong cảnh của bàn này (trang Fight cho bàn phủ cả màn lúc intro). Đạo diễn ở fight-cine-1ae.js.
// TRAIN RUSH — lõi MẪU 1ad (30/9/2026): thầy chọn Fight kiểu 1 (hai bàn trái–phải) + 3 ý:
//   • mirror: true — bàn soi gương (canvas lật ngang bằng CSS; chữ trên toa/khinh khí cầu/thùng/đầu máy/bảng đồi lật ngược lại
//                    cho đọc xuôi; chạm đổi toạ độ) ⇒ tàu chạy phải→trái, khinh khí cầu bay trái→phải. Dùng cho bàn TRÁI.
//   • trainColors: { engine: [màu đầu máy theo màn], box: [2 màu ván toa hàng] } — tàu 2 đội khác màu.
//   • setOrder(items): trang Fight đưa sẵn thứ tự từ cho từng đội (2 đội khác thứ tự, cùng vị trí toa không trùng từ).
// TRAIN RUSH — lõi MẪU 1ac (30/9/2026): thử chế độ FIGHT. Chép từ 1ab (luật chơi 1 màn hình giữ nguyên) + 2 cách chạy mới:
//   • embed: true  — một bàn nằm trong trang Fight (khung = kích thước ô chứa, ẩn hàng nút/đồng hồ/màn chờ riêng, bỏ intro,
//                    trang Fight bấm START / tạm dừng / kết thúc cho cả 2 bàn). seed: cùng hạt giống ⇒ 2 đội cùng thứ tự từ, cùng toa phụ.
//   • share: true  — MỘT tàu, MỘT bầu trời cho 2 đội: chạm nửa TRÁI = đội 1 (đỏ), nửa PHẢI = đội 2 (xanh); thùng mang viền màu đội;
//                    thùng đúng ĐẦU TIÊN chiếm toa (cắm cờ màu đội); khinh khí cầu bay xen kẽ phải→trái và trái→phải cho công bằng.
// BALLOON POP 3D — lõi MẪU 1ab (30/9/2026): đại bàng thật (mỏ khoằm, đuôi quạt, cánh 2 khớp — west-props-1ab), intro nhanh + cắt cảnh
// kiểu lia vụt (cine-1ab, nhoè theo chiều lia trong GRADE_SHADER), xương rồng tiền cảnh nhỏ lại, tốc độ nấc 10 gấp đôi (chia đều 1–10).
// BALLOON POP 3D — lõi MẪU 1aa (29/9/2026): sửa intro — 2 bảng chữ hết đè nhau (đổi bảng đúng lúc cắt cảnh);
// cỏ, cây, đá phủ đều mọi góc máy intro/màn chờ (khúc cảnh bám chỗ máy quay nhìn, west-world-1aa).
// BALLOON POP 3D — lõi MẪU 1z (29/9/2026): đụn cát cao 10, chữ còn 70 %.
// BALLOON POP 3D — lõi MẪU 1y (29/9/2026): hai bảng chữ trên đụn cát thấp (?cao=0..2).
// BALLOON POP 3D — lõi MẪU 1x (29/9/2026): ANDREW CLASSES trên đụn cát cao; đồi Atacama như 1v (?nh=0..1).
// BALLOON POP 3D — lõi MẪU 1w (29/9/2026): chữ lên cao trên gờ giữa vách núi (?chu=0..2), thú đuổi nhau quanh chữ.
// BALLOON POP 3D — lõi MẪU 1v (29/9/2026): như 1u, đống đá gần ray nhỏ 1/2 + ít 1/2, 4 thiết kế (?da=0..3).
// BALLOON POP 3D — lõi MẪU 1u (29/9/2026): đồi Atacama bản 3 thấp 1/2 + sẫm; ANDREW CLASSES luôn trước; mô đất gần ray chi tiết (?mo=0..4).
// BALLOON POP 3D — lõi MẪU 1t (29/9/2026): như 1s, đồi chữ = biến thể chi tiết của bản 3 (?nui=0..4).
// BALLOON POP 3D — lõi MẪU 1s (29/9/2026): như 1r, đồi chữ kiểu Atacama (4 bản ?nui=0..3).
// BALLOON POP 3D — lõi MẪU 1r (29/9/2026): màn chờ chỉ TRAIN RUSH + START kiểu miền Tây; intro mở đầu từ khung màn chờ; 5 kiểu đồi chữ (?nui).
// BALLOON POP 3D — lõi MẪU 1q (29/9/2026): màn chờ trên cao ngắm toàn cảnh + chỉ ANDREW STUDIO / START; intro Phim cao bồi (ANDREW STUDIO PRESENTS → TRAIN RUSH).
// BALLOON POP 3D — lõi MẪU 1p (29/9/2026): như 1o + INTRO ĐIỆN ẢNH khi bấm START (cine-1p.js, 4 bản ?intro=1..4).
// BALLOON POP 3D — lõi MẪU 1o (29/9/2026): bản chính — như 1l + đất cát đỏ gợn sóng + bụi cỏ sa mạc mẫu 0.
// BALLOON POP 3D — lõi MẪU 1n (29/9/2026): như 1m, cảnh west-world-1n (đất cát đỏ / đồng cỏ vàng + 5 mẫu bụi cỏ sa mạc).
// BALLOON POP 3D — lõi MẪU 1m (29/9/2026): như 1l, cảnh west-world-1m (6 kiểu mặt đất + cỏ để thầy duyệt, ?nen=0..5).
// BALLOON POP 3D — lõi MẪU 1l (29/9/2026): như 1k, cảnh west-world-1l (cây cỏ nhỏ tinh hơn, mọi con vật dựng kiểu thật).
// BALLOON POP 3D — lõi MẪU 1k (29/9/2026): như 1j, cảnh mới west-world-1k (đồi mềm có cỏ thật, cỏ bông lau, con vật đuổi nhau thật ở rất xa).
// BALLOON POP 3D — lõi MẪU 1j (29/9/2026): mỗi từ chơi MỘT lần — hết từ là xong ván (cả 3 kiểu đồng hồ); Count up có ô đồng hồ
// trong hàng nút; Options: ô giờ vuốt/chạm như AWord (phút ±1, giây ±10), Balloon/Train speed 1–10, Points off 0–10 (thanh đỏ),
// Max cars thanh kéo 3–20 + ∞, bỏ Drop guide, ô Bonus xanh lá + mặc định tắt; nút iPad thay Leaderboard; Menu có End game;
// bảng kết quả kiểu biển gỗ miền Tây; thùng ĐÚNG thứ 2, 3… trên cùng toa cũng được điểm; thùng văng chéo mạnh hơn;
// khinh khí cầu giữ nguyên tốc độ TRÊN MÀN (không chậm lại khi máy quay dừng).
// Lịch sử 1i: thùng rơi hơi NGHIÊNG sẵn + gỗ nảy hơn ⇒ chạm toa là nảy, chúi, xê dịch như thật;
// tàu + máy bay được LÀM CŨ (bụi đất, vệt chảy, gỉ, trầy xước, gồ ghề — grime-1i.js), hết bóng nhựa; người trong toa hoảng lâu hơn,
// thùng rơi liên tiếp ⇒ có người bật dậy chạy lung tung (coach-1i.js); saguaro sần sùi mỗi cây một khác + con vật húc đổ chữ
// Hollywood (west-world-1i.js); bảng Options làm theo đúng bố cục Options của AWord (Timer None/Count up/Count down, ô số, thanh trượt,
// ô tích, nút trò chơi + Apply).
// Lịch sử 1h: tàu vào ga CHẬM DẦN tới đúng tốc độ chạy, toa đáp án đầu dừng ĐÚNG giữa màn (máy quay đứng yên);
// máy quay lia bằng lò xo giảm chấn (tăng tốc/hãm từ từ, bám theo vận tốc tàu — không giật). Đồng hồ trái + THANH THỜI GIAN phải
// (vơi dần theo giờ còn lại) kiểu biển gỗ viền đồng miền Tây; HÀNG NÚT ra ngoài màn chơi như Rocket Race:
// Menu · Sound · Switch activity · Options · Leaderboard · Mode (bỏ Full screen).
// Lịch sử 1g: thùng đúng chạm toa nảy + lắc + xê dịch thêm; thùng chỉ tì MỘT PHẦN vào toa đúng
// vẫn tính điểm; thùng rơi vào toa khách nằm lại trên nóc (không tính điểm); khinh khí cầu HÚC ĐỔ chồng thùng cao —
// thùng đúng đã tính điểm bị húc rơi xuống đất thì trừ lại điểm của toa đó (toa mở lại, máy quay quay về toa đó);
// bỏ ô điểm trên thanh trên cùng (đồng hồ sang chỗ đó), điểm chỉ bay lên mỗi thùng đúng + hiện trên băng máy bay cuối vòng.
// Người trong toa: cổ nối liền đầu–thân, bóng người mờ nhoè sau rèm kính mờ (coach-1g.js).
// Lịch sử 1f: VẬT LÝ VẬT RẮN THẬT (cannon-es) — thùng gỗ cứng không méo, một toa chứa
// nhiều thùng (rơi chúi trước/sau, chồng, nghiêng, đổ theo va chạm thật), chạm toa chỉ trượt + lắc rất nhẹ;
// khinh khí cầu luôn bay vào từ NGOÀI mép phải; máy bay 2 tầng cánh chi tiết kéo băng vải phần phật với dây chạc thật;
// người trong toa ngồi thành cặp đối diện, mỗi người hoảng một kiểu, thêm phụ nữ + trẻ em (coach-1f.js);
// 8 loài vật trên gò đồi địa hình thật, thấp hơn (animals-1f.js qua west-world-1f.js).
// Lịch sử 1e: như 1d + 2 TOA PHỤ (toa khách có người / toa than) giữa các toa đáp án,
// máy quay giữ toa trống đầu tiên TỐI ĐA ở giữa màn (toa sau còn ngoài mép), va chạm khi đúng chỉ 1/10, thùng rơi
// vào toa than ⇒ than văng + trừ điểm, người trong toa chi tiết (ngón tay), con vật trên đồi xa, bỏ dấu ✓ ở điểm.
// Lịch sử 1d: như 1c + tàu nhanh chậm tự nhiên, bỏ ✓/✗ (chỉ điểm bay lên, Points off),
// thùng đúng phải TRƯỢT dừng hẳn mới tính (quá mép thì rơi), từ quay vòng tới hết giờ, máy bay bay trái→phải,
// toa than chỉ hoa văn, thỉnh thoảng có TOA KHÁCH (coach-1d.js), cảnh 1d (west-world-1d.js).
// Lịch sử 1c: chép từ 1b + đường ray thật, mặt đất cỏ/bụi/xương rồng (west-world-1c.js),
// logo ANDREW STUDIO trên đầu máy, MÁY QUAY LIA THEO TÀU khi đầu máy tới 75% màn, thùng hàng có VẬT LÝ (quán tính, va, văng, nảy).
// Lịch sử 1b: chép từ bp3d.js rồi nâng đồ hoạ (cảnh viễn tây west-world.js,
// đầu máy hơi nước 4-4-0 + toa than + toa hàng gỗ, khinh khí cầu vỏ vải, hậu kỳ bloom + chỉnh màu). Tàu nhỏ lại (TS).
// Luật như Wordwall (thầy chốt 29/9): màn N có N toa định nghĩa; bấm nổ khinh khí cầu ⇒ thùng mang TỪ
// RƠI THẲNG xuống, phải canh cho rơi trúng toa đúng. Toa rộng cố định, đoàn tàu dài hơn màn thì chạy vòng.
// createBalloonPop({ mount, view: "side" | "top", words, wordsTitle })
import * as THREE from "../../rocket-race/vendor/three/three.module.min.js";
import { EffectComposer } from "../../rocket-race/vendor/three/addons/EffectComposer.js";
import { RenderPass } from "../../rocket-race/vendor/three/addons/RenderPass.js";
import { UnrealBloomPass } from "../../rocket-race/vendor/three/addons/UnrealBloomPass.js";
import { ShaderPass } from "../../rocket-race/vendor/three/addons/ShaderPass.js";
import { OutputPass } from "../../rocket-race/vendor/three/addons/OutputPass.js";
import { createBpSound } from "./sound-1ah.js";
import * as CANNON from "../vendor/cannon-es.js";
import { createWestWorld, normalFromNoise, TRACK_TOP } from "./west-world-1ah.js";
import { makeCoach, addPassengers, animatePassengers, makeCoalCar, COACH_LEN, COAL_LEN, COAL_LUMP, coalMaterial } from "./coach-1i.js";
import { weather } from "./grime-1i.js";
import { createCine, INTROS, INTRO_ID } from "./cine-1ah.js";
import { createFightCine } from "./fight-cine-1ah.js";

const FONT = '"Baloo 2", system-ui, sans-serif';
const ASPECT = 16 / 10.5;                       // đúng khung act đơn của AWord
const PALETTE = [0x7a1a14, 0x1d4a2f, 0x1f3a6b, 0x4a1d3a, 0x2a2a2c, 0x16404a, 0x6b3a12, 0x243d5c, 0x5a2a14, 0x3d5a1f];
const CART_W = 6.2, CART_GAP = 0.45, CART_PITCH = CART_W + CART_GAP, ENGINE_LEN = 6.4, TENDER_LEN = 3.4;
const HEAD = ENGINE_LEN / 2 + CART_GAP + TENDER_LEN + CART_GAP;   // từ tâm đầu máy tới đầu toa hàng thứ nhất
const TS = 0.74, BS = 0.84, RAIL_TOP = 0.62;                      // tỉ lệ tàu, tỉ lệ khinh khí cầu, mặt ray
const ROOF_Y = 3.72, CRATE = 1.5, CRATE_W = 2.9, GRAV = 15;
const ROOF_W = RAIL_TOP + ROOF_Y * TS, CRATE_H = CRATE * TS / 2;   // nóc toa và nửa chiều cao thùng (thế giới)
const MAX_BLIMPS = 5;
const BAR_H = 80;                                                 // 1h: hàng nút ngoài màn chơi (như Rocket Race)

const VIEWS = {
  side: { cam: [0, 4.6, 25], look: [0, 6.1, 0], fov: 36, lanes: [7.3, 9.1, 10.9], guide: false },
  top:  { cam: [0, 21, 19.5], look: [0, 5.5, -2.4], fov: 40, lanes: [8.0, 9.8, 11.6], guide: true },
};

const DEFAULTS = { timerMode: "down", timer: 120, levels: 10, pointsOff: 0, balloonSpeed: 4, trainSpeed: 4, shuffle: true, showAnswers: true, bonusTime: false, bonusPoints: false, bonusX2: false };   // 1j: tốc độ 1–10, Points off 0–10, Max cars 3–20 + 21 = ∞   // 1i: Points off thang AWord 0–100

export const TEAM_COLORS = ["#e2402f", "#2f7fe2"];   // 1ac: đội 1 đỏ · đội 2 xanh
export async function createBalloonPop({ mount, view = "side", words, wordsTitle = "", embed = false, share = false, seed = null, mirror = false, trainColors = null, options = {}, onEvent = () => {} }) {
  const V0 = VIEWS[view] || VIEWS.side;
  // 1ac: bàn Fight DẸT (tầng trên–dưới) ⇒ máy quay tiến gần 28 % — khung dọc chỉ ôm từ mặt ray tới làn khinh khí cầu cao nhất
  const wide = embed && mount.clientWidth / Math.max(1, mount.clientHeight) > 2.6;
  const V = wide ? { ...V0, cam: [V0.cam[0], V0.look[1] + (V0.cam[1] - V0.look[1]) * 0.72, V0.cam[2] * 0.72], look: [V0.look[0], V0.look[1] + 0.3, V0.look[2]] } : V0;
  const opt = { ...DEFAULTS, guide: V.guide, ...options };
  // 1ac: hạt giống chung ⇒ 2 bàn Fight cùng thứ tự từ / toa phụ / làn bay (phần trang trí vẫn ngẫu nhiên)
  const rnd = seed != null ? mulberry(seed) : Math.random;
  const shuffleR = (a, r = rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  if (embed) mount.classList.add("is-embed");
  // 1ad: bàn soi gương — texture có chữ lật ngang sẵn, qua lần lật canvas thì đọc xuôi
  const tx = t => { if (mirror && t) { t.repeat.x = -1; t.offset.x = 1; t.needsUpdate = true; } return t; };
  let order = null;   // 1ad: thứ tự từ trang Fight đưa sẵn
  const sfx = createBpSound();
  try { await document.fonts.load(`800 60px ${FONT}`); await document.fonts.load(`600 60px ${FONT}`); await document.fonts.load(`italic 900 60px "Exo 2"`); await document.fonts.load(`400 60px Rye`); } catch (e) { /* vẽ bằng font dự phòng */ }

  // ------------------------------------------------------------------ khung + HUD
  mount.innerHTML = HUD_HTML;
  const stage = mount.querySelector(".bp-stage");
  const canvas = stage.querySelector("canvas");
  if (mirror) canvas.style.transform = "scaleX(-1)";   // 1ad: lật cả khung hình (không đụng hình học ⇒ không lỗi mặt khuất)
  const $ = s => stage.querySelector(s);
  const topEl = $(".bp-top");
  const clockEl = $(".bp-clock"), progEl = $(".bp-prog i"), scoreEl = $(".bp-score b"), signEl = $(".bp-sign");
  const ovStart = $(".bp-ov-start"), ovEnd = $(".bp-ov-end"), ovPause = $(".bp-ov-pause"), ovAns = $(".bp-ov-ans");
  $(".bp-words").textContent = `${words.length} words${wordsTitle ? " · " + wordsTitle : ""}`;
  if (embed) ovStart.hidden = true;   // 1ac: bàn Fight dùng màn chờ chung của trang

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  const PR = Math.min(window.devicePixelRatio || 1, 1.5);
  renderer.setPixelRatio(PR);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(V.fov, ASPECT, 0.5, 4000);
  camera.position.set(...V.cam);
  camera.lookAt(...V.look);
  camera.updateMatrixWorld();

  // nửa bề ngang nhìn thấy: HALF ở độ cao nóc toa (cho tàu), SKY ở làn khinh khí cầu cao nhất (cho trời)
  // 1ac: đo bằng máy quay phụ đặt đúng góc chơi (máy quay thật có thể đang ở màn chờ); khung đổi tỉ lệ thì đo lại
  let HALF = 18, SKY = 18, aspect = ASPECT;
  const halfAt = y => {
    const cam = new THREE.PerspectiveCamera(V.fov, aspect, 0.5, 4000); cam.position.set(...V.cam); cam.lookAt(...V.look); cam.updateMatrixWorld();
    const v = new THREE.Vector3(0, y, 0).project(cam), rc = new THREE.Raycaster(), p = new THREE.Vector3();
    rc.setFromCamera(new THREE.Vector2(1, v.y), cam);
    return rc.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), p) ? Math.abs(p.x) : 18;
  };
  function fit() {
    let w, h;
    if (embed) { w = Math.max(1, mount.clientWidth); h = Math.max(1, mount.clientHeight); }   // 1ac: bàn Fight lấp đầy ô chứa
    else {
      const W = window.innerWidth, Hh = window.innerHeight - BAR_H;   // 1h: chừa hàng nút bên dưới
      w = W; h = W / ASPECT;
      if (h > Hh) { h = Hh; w = h * ASPECT; }
    }
    stage.style.width = Math.floor(w) + "px";
    stage.style.height = Math.floor(h) + "px";
    renderer.setSize(Math.floor(w), Math.floor(h), false);
    if (composer) { composer.setPixelRatio(PR); composer.setSize(Math.floor(w), Math.floor(h)); }
    aspect = Math.floor(w) / Math.floor(h);
    if (Math.abs(camera.aspect - aspect) > 1e-4) { camera.aspect = aspect; camera.updateProjectionMatrix(); }
    HALF = halfAt(ROOF_W); SKY = Math.max(HALF, halfAt(V.lanes[2] + 1.5));
  }
  let composer = null;
  fit();
  window.addEventListener("resize", fit);
  document.addEventListener("fullscreenchange", fit);
  let dead = false;   // 1aj: destroy() ⇒ thôi vẽ, gỡ listener (AWord dỡ bàn khi đổi chế độ / rời act)

  const world = createWestWorld(scene, renderer);
  world.setSound(sfx);   // 1ah: tiếng con vật, chữ đổ
  world.setCamera(camera);   // 1af: cặp thú đuổi nhau chỉ sinh/xoá NGOÀI khung hình thật
  // quét 1 lượt: sửa mọi pháp tuyến bằng 0 còn sót trong cảnh
  { const seen = new Set(); scene.traverse(o => { const g = o.geometry; if (!g || seen.has(g) || !g.attributes.normal) return; seen.add(g); const n = g.attributes.normal; for (let i = 0; i < n.count; i++) { const l = n.getX(i) ** 2 + n.getY(i) ** 2 + n.getZ(i) ** 2; if (!(l > 1e-8)) { n.setXYZ(i, 0, 1, 0); n.needsUpdate = true; } } }); }

  // hậu kỳ điện ảnh: MSAA 4 mẫu (tránh lấp loá), bloom nhẹ cho mặt trời/đèn, chỉnh màu + vignette + hạt phim
  composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 }));
  composer.addPass(new RenderPass(scene, camera));
  // chốt an toàn: điểm ảnh NaN/Inf (từ bất kỳ vật liệu nào) bị xoá TRƯỚC bloom — không bao giờ loang thành màn đen nháy
  composer.addPass(new ShaderPass({
    uniforms: { tDiffuse: { value: null } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: `uniform sampler2D tDiffuse; varying vec2 vUv;
      void main(){ vec4 c = texture2D(tDiffuse, vUv); if (any(isnan(c)) || any(isinf(c))) c = vec4(0., 0., 0., 1.); gl_FragColor = min(c, vec4(64.)); }`,
  }));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.2, 0.32, 1.1);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const grade = new ShaderPass(GRADE_SHADER);
  composer.addPass(grade);
  const cine = createCine({ stage, camera, gradeU: grade.uniforms, sfx, baseFov: V.fov });   // 1p: intro điện ảnh
  let FC = null;   // 1ae: đạo diễn intro Fight (dựng sau khi có hàm dựng tàu — xem cuối phần tài nguyên)
  fit();

  // ------------------------------------------------------------------ tài nguyên dùng chung
  const envelopeGeo = (() => {
    const pts = [];
    for (let i = 0; i <= 48; i++) {
      const t = i / 48, y = -3.4 + t * 6.8;
      let r = 1.2 * Math.pow(Math.sin(Math.PI * Math.min(0.999, Math.max(0.001, t))), 0.5);
      if (t > 0.55) r *= 1 - 0.42 * Math.pow((t - 0.55) / 0.45, 1.4);
      pts.push(new THREE.Vector2(Math.max(0.001, r), y));
    }
    const geo = new THREE.LatheGeometry(pts, 64); geo.rotateZ(-Math.PI / 2); return geo;
  })();
  const finGeo = (() => {
    const s = new THREE.Shape(); s.moveTo(-0.9, 0); s.lineTo(0.75, 0); s.lineTo(0.95, 1.05); s.lineTo(0.1, 1.05); s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, { depth: 0.06, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 1 });
    geo.translate(0, 0, -0.03); geo.rotateX(Math.PI / 2); return geo;
  })();
  const G = {
    crate: new THREE.BoxGeometry(CRATE_W, CRATE, CRATE),
    shard: new THREE.PlaneGeometry(0.34, 0.22),
    blimp: new THREE.SphereGeometry(1, 40, 20),
    hitBlimp: new THREE.SphereGeometry(1, 12, 8),
    envelope: envelopeGeo, fin: finGeo,
    gondola: new THREE.CapsuleGeometry(0.3, 1.1, 6, 16),
    rope: new THREE.CylinderGeometry(0.012, 0.012, 0.55, 4),
    pod: new THREE.CapsuleGeometry(0.12, 0.35, 4, 10),
    blade: new THREE.BoxGeometry(0.03, 0.55, 0.08),
    banner: new THREE.PlaneGeometry(5.2, 1.26),
  };
  const woodN = normalFromNoise(256, 21, 1.6, 6); woodN.repeat.set(1, 1);
  const M = {
    iron: new THREE.MeshStandardMaterial({ color: 0x1d1d20, metalness: 0.75, roughness: 0.42 }),
    ironDouble: new THREE.MeshStandardMaterial({ color: 0x1d1d20, metalness: 0.75, roughness: 0.42, side: THREE.DoubleSide }),
    redIron: new THREE.MeshStandardMaterial({ color: 0x8a1d14, metalness: 0.35, roughness: 0.45 }),
    steel: new THREE.MeshStandardMaterial({ color: 0xb8bcc2, metalness: 1, roughness: 0.25 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xd9a441, metalness: 1, roughness: 0.22 }),
    brassDouble: new THREE.MeshStandardMaterial({ color: 0xd9a441, metalness: 1, roughness: 0.22, side: THREE.DoubleSide }),
    glass: new THREE.MeshStandardMaterial({ color: 0x151a22, metalness: 0.8, roughness: 0.08 }),
    lens: new THREE.MeshBasicMaterial({ color: new THREE.Color(4.0, 3.1, 1.8) }),
    cabWood: new THREE.MeshStandardMaterial({ map: plankTexture("#7a4526", "#5e331b", true), normalMap: woodN, roughness: 0.55, metalness: 0.05 }),
    boxcar: new THREE.MeshStandardMaterial({ map: trainColors && trainColors.box ? plankTexture(...trainColors.box, true) : plankTexture("#8a3b24", "#6d2c1a", true), normalMap: woodN, roughness: 0.82 }),
    woodDark: new THREE.MeshStandardMaterial({ color: 0x3b2618, roughness: 0.9 }),
    log: new THREE.MeshStandardMaterial({ color: 0x6b4a2e, roughness: 0.92 }),
    wheelDrive: new THREE.MeshStandardMaterial({ map: wheelTexture(true), metalness: 0.55, roughness: 0.45, alphaTest: 0.5 }),
    wheelSmall: new THREE.MeshStandardMaterial({ map: wheelTexture(false), metalness: 0.55, roughness: 0.45, alphaTest: 0.5 }),
    envelope: new THREE.MeshStandardMaterial({ map: fabricTexture(), color: 0xf2eee6, roughness: 0.55, metalness: 0.18 }),
    finRed: new THREE.MeshPhysicalMaterial({ color: 0xa3261b, roughness: 0.4, metalness: 0.2, clearcoat: 0.5 }),
    gondola: new THREE.MeshStandardMaterial({ map: plankTexture("#6b4428", "#4d2f1a", false), roughness: 0.6 }),
    gonWin: new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.25, 0.7) }),
    rope: new THREE.MeshStandardMaterial({ color: 0x3a2c20, roughness: 1 }),
    hit: new THREE.MeshBasicMaterial({ visible: false }),
    shard: new THREE.MeshStandardMaterial({ color: 0xece6da, roughness: 0.7, side: THREE.DoubleSide, transparent: true }),
    crateSide: new THREE.MeshStandardMaterial({ map: plankTexture("#b27a45", "#8c5a2e", false), normalMap: woodN, roughness: 0.85 }),
  };
  const smokeTex = softDotTexture();
  const flashTex = softDotTexture();
  // tài nguyên dùng chung: disposeTree() không được huỷ
  Object.values(G).forEach(x => { x.userData.shared = true; });
  Object.values(M).forEach(x => { x.userData.shared = true; if (x.map) x.map.userData.shared = true; if (x.normalMap) x.normalMap.userData.shared = true; });
  smokeTex.userData.shared = true;

  const viewDir = new THREE.Vector3();   // 1aa: hướng nhìn máy quay — khúc cảnh phủ theo chỗ máy quay nhìn
  // ------------------------------------------------------------------ trạng thái
  const S = {
    state: "attract", paused: false, level: 0, timeLeft: opt.timer, score: 0, x2: 0,
    train: null, carts: [], trainX: 0, trainLen: 0, trainV: 0, introT: 0, clearT: 0,
    blimps: [], crates: [], fx: [], spawnT: 0, deck: [], levels: [], bag: [], lastTick: 99, chugT: 0,
    plane: null, time: 0, camX: 0, camTarget: 0, camV: 0, shake: 0, cars: [], coaches: [], trainVel: 0, entry: 0,
    teams: [0, 0], nextDir: 1,   // 1ac: điểm 2 đội (share) · hướng bay khinh khí cầu kế tiếp
  };
  const sky = new THREE.Group(); scene.add(sky);
  const fxRoot = new THREE.Group(); scene.add(fxRoot);
  FC = createFightCine({ scene, camera, gradeU: grade.uniforms, sfx, stage, S, TS, RAIL_TOP, CART_W, ENGINE_LEN, TENDER_LEN, CART_GAP,
    makeEngine: (...a) => makeEngine(...a), makeTender: (...a) => makeTender(...a), makeCart: (...a) => makeCart(...a), makeFiller: (...a) => makeFiller(...a),
    weather, smokeTex, fxRoot, plankTexture, animatePassengers });

  // ------------------------------------------------------------------ bộ câu theo màn
  const norm = s => String(s).trim().toUpperCase().replace(/\s+/g, " ");
  const allKeys = [...new Set(words.map(w => norm(w.keyword)))];
  function nextLevelItems(n) {
    const out = [], used = new Set();
    let guard = 0;
    while (out.length < n && guard++ < 500) {
      if (!S.bag.length) break;   // 1j: mỗi từ chơi MỘT lần — hết từ là hết
      const it = S.bag.pop();
      const k = norm(it.keyword);
      if (used.has(k)) { S.bag.unshift(it); if (S.bag.every(w => used.has(norm(w.keyword)))) break; continue; }
      used.add(k); out.push(it);
    }
    return out;
  }

  // ------------------------------------------------------------------ đoàn tàu (đơn vị gốc; cả đoàn thu nhỏ TS, đặt trên mặt ray)
  function buildTrain(items, levelIdx) {
    if (S.train) { scene.remove(S.train); disposeTree(S.train); }
    // thùng còn nằm trên đoàn tàu cũ (đã chạy khỏi màn) đi theo tàu cũ
    for (const c of S.crates.slice()) if (c.onTrain || c.mesh.position.x > S.camX + HALF) { removeCrate(c); S.crates.splice(S.crates.indexOf(c), 1); }
    const train = new THREE.Group();
    const pal = trainColors && trainColors.engine ? trainColors.engine : PALETTE;   // 1ad: mỗi đội một bộ màu
    const paintHex = pal[levelIdx % pal.length];
    const engine = makeEngine(paintHex, levelIdx + 1);
    train.add(engine);
    const tender = makeTender(paintHex, "LV." + (levelIdx + 1));   // 1af: khắc số màn giữa hoa văn
    tender.position.x = -ENGINE_LEN / 2 - CART_GAP - TENDER_LEN / 2;
    train.add(tender);
    // Sau toa than củi: [toa đáp án] · 2 toa phụ · [toa đáp án] · 2 toa phụ · ... Toa phụ = toa khách có người (62%)
    // hoặc toa than đen. 2 toa phụ đủ dài để toa đáp án kế tiếp luôn nằm NGOÀI mép trái khi toa trước ở giữa màn.
    let cursor = -HEAD;
    S.cars = []; S.coaches = [];
    const fr = seed != null ? mulberry(seed * 31 + levelIdx * 977 + (S.round || 0)) : Math.random;   // 1ac: 2 đội cùng màn ⇒ cùng toa khách/toa than
    const addFiller = () => {
      let car;
      if (fr() < 0.62) {
        const co = makeCoach([0x1f4a33, 0x5a1a1a, 0x1f3050, 0x4a3a1a][Math.floor(Math.random() * 4)], meshAdder, M);
        car = { type: "coach", group: co.group, len: COACH_LEN, roof: co.roof, bogies: co.bogies, people: addPassengers(co.group, co.y0), startleT: null };
        S.coaches.push(car);
      } else {
        const cc = makeCoalCar(meshAdder, M, [0x2c2c2e, 0x3a2a22, 0x2a3036][Math.floor(Math.random() * 3)]);
        car = { type: "coal", group: cc.group, len: COAL_LEN, roof: cc.roof, bogies: cc.bogies };
      }
      for (const bx of car.bogies) for (const s of [-1, 1]) for (const dx of [-0.52, 0.52]) wheel(car.group, 0.38, bx + dx, s * 0.82, false);
      car.localX = cursor - car.len / 2; car.group.position.x = car.localX;
      train.add(car.group); S.cars.push(car); cursor -= car.len + CART_GAP;
    };
    S.carts = items.map((it, i) => {
      if (i > 0) { addFiller(); addFiller(); }
      const cart = makeCart(it.definition, i);
      const localX = cursor - CART_W / 2; cart.position.x = localX; cursor -= CART_W + CART_GAP;
      train.add(cart);
      const c = { type: "answer", group: cart, item: it, key: norm(it.keyword), filled: false, localX, len: CART_W, roof: ROOF_Y };
      S.cars.push(c);
      return c;
    });
    S.wheels = []; S.rods = [];
    train.traverse(o => { if (o.userData.wheelR) S.wheels.push(o); if (o.userData.rod) S.rods.push(o); });
    train.scale.setScalar(TS);
    train.position.y = RAIL_TOP;
    S.train = train; S.engine = engine; S.wheelA = 0;
    S.trainLen = (ENGINE_LEN / 2 - cursor - CART_GAP) * TS;
    weather(train);   // 1i: bụi bẩn, trầy xước, gồ ghề — hết bóng nhựa
    scene.add(train);
    buildTrainBody();
  }
  // trainX = mũi đầu máy (thế giới); gốc nhóm tàu = tâm đầu máy
  function placeTrain() { S.train.position.x = S.trainX - ENGINE_LEN / 2 * TS; }
  const cartWorldX = c => S.train.position.x + c.localX * TS;

  // 1ae: một toa phụ lẻ (toa khách có người / toa than) cho tàu trình diễn intro Fight
  function makeFiller(type, team) {
    let car;
    if (type === "coach") {
      const co = makeCoach([0x1f4a33, 0x1f3050][team] ?? 0x1f4a33, meshAdder, M);
      car = { group: co.group, len: COACH_LEN, bogies: co.bogies, people: addPassengers(co.group, co.y0) };
    } else {
      const cc = makeCoalCar(meshAdder, M, 0x2c2c2e);
      car = { group: cc.group, len: COAL_LEN, bogies: cc.bogies, people: null };
    }
    for (const bx of car.bogies) for (const s of [-1, 1]) for (const dx of [-0.52, 0.52]) wheel(car.group, 0.38, bx + dx, s * 0.82, false);
    return car;
  }
  function meshAdder(g) {
    return (geo, mat, x, y, z = 0, rx = 0, ry = 0, rz = 0) => {
      const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz);
      m.castShadow = true; m.receiveShadow = true; g.add(m); return m;
    };
  }
  function wheel(g, r, x, z, drive) {
    const face = drive ? M.wheelDrive : M.wheelSmall;
    const w = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.16, 40), [M.iron, face, face]);
    w.rotation.x = Math.PI / 2; w.position.set(x, r, z);
    w.userData.wheelR = r; w.castShadow = true; g.add(w);
    return w;
  }

  function makeEngine(paintHex, num) {
    const g = new THREE.Group(), add = meshAdder(g);
    const paint = new THREE.MeshPhysicalMaterial({ color: paintHex, metalness: 0.3, roughness: 0.34, clearcoat: 0.7, clearcoatRoughness: 0.22 });
    const cylX = (r, len, mat, x, y, z = 0) => add(new THREE.CylinderGeometry(r, r, len, 36), mat, x, y, z, 0, 0, Math.PI / 2);
    // khung + dầm đệm trước
    add(new THREE.BoxGeometry(6.3, 0.3, 1.4), M.iron, -0.15, 1.08);
    add(new THREE.BoxGeometry(0.2, 0.46, 2.0), M.redIron, 3.1, 1.02);
    // nồi hơi + đai đồng + hộp khói
    cylX(0.8, 3.9, paint, 0.85, 2.05);
    for (const x of [-0.95, 0.15, 1.2, 2.25]) cylX(0.815, 0.08, M.brass, x, 2.05);
    cylX(0.86, 0.8, M.iron, 2.95, 2.05);
    cylX(0.6, 0.05, M.brass, 3.37, 2.05);
    // ống khói loe kiểu miền Tây
    add(new THREE.CylinderGeometry(0.2, 0.25, 0.85, 24), M.iron, 2.72, 3.25);
    add(new THREE.CylinderGeometry(0.7, 0.21, 1.0, 32, 1, true), M.ironDouble, 2.72, 4.15);
    add(new THREE.CylinderGeometry(0.66, 0.7, 0.36, 32), M.iron, 2.72, 4.83);
    add(new THREE.CylinderGeometry(0.34, 0.66, 0.22, 32), M.iron, 2.72, 5.1);
    // đèn pha hộp + kính phát sáng
    add(new THREE.BoxGeometry(0.62, 0.66, 0.66), M.redIron, 3.25, 3.25);
    add(new THREE.BoxGeometry(0.7, 0.08, 0.74), M.brass, 3.25, 3.62);
    add(new THREE.CylinderGeometry(0.1, 0.16, 0.26, 12), M.iron, 3.25, 3.78);
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.24, 24), M.lens); lens.position.set(3.565, 3.24, 0); lens.rotation.y = Math.PI / 2; g.add(lens);
    // vòm hơi, vòm cát, chuông, còi
    for (const x of [1.45, 0.2]) {
      add(new THREE.CylinderGeometry(0.33, 0.38, 0.5, 28), M.brass, x, 3.02);
      add(new THREE.SphereGeometry(0.33, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), M.brass, x, 3.27);
    }
    const bell = new THREE.LatheGeometry([[0.001, 0.34], [0.12, 0.33], [0.16, 0.2], [0.2, 0.05], [0.26, 0]].map(([r, y]) => new THREE.Vector2(r, y)), 28);
    add(bell, M.brassDouble, 0.82, 2.88);
    add(new THREE.CylinderGeometry(0.05, 0.07, 0.42, 12), M.brass, -0.72, 3.0);
    // cabin gỗ đánh bóng + cửa sổ
    add(new THREE.BoxGeometry(2.1, 2.15, 1.95), M.cabWood, -1.95, 2.33);
    add(new THREE.BoxGeometry(2.2, 0.14, 2.05), paint, -1.95, 1.3);
    add(new THREE.BoxGeometry(2.55, 0.12, 2.35), M.iron, -1.95, 3.47);
    add(new THREE.BoxGeometry(2.3, 0.1, 2.1), paint, -1.95, 3.56);
    for (const s of [-1, 1]) for (const x of [-2.45, -1.5]) add(new THREE.BoxGeometry(0.62, 0.62, 0.02), M.glass, x, 2.72, s * 0.985);
    // gạt trâu (pilot) dạng thanh
    for (let i = -4; i <= 4; i++) {
      const z = i * 0.22, a = new THREE.Vector3(3.2, 0.98, z), b = new THREE.Vector3(4.05, 0.2, z * 0.3);
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, a.distanceTo(b), 6), M.redIron);
      bar.position.copy(a).add(b).multiplyScalar(0.5); bar.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
      bar.castShadow = true; g.add(bar);
    }
    add(new THREE.BoxGeometry(0.08, 0.08, 1.9), M.redIron, 3.25, 0.95);
    // xy lanh
    for (const s of [-1, 1]) {
      cylX(0.3, 1.05, M.iron, 2.2, 1.28, s * 0.95);
      cylX(0.31, 0.06, M.brass, 1.68, 1.28, s * 0.95);
      cylX(0.31, 0.06, M.brass, 2.72, 1.28, s * 0.95);
    }
    // bánh: 2 dẫn hướng nhỏ + 2 bánh lái lớn (kiểu 4-4-0), thanh truyền quay theo tay quay
    for (const s of [-1, 1]) {
      wheel(g, 0.42, 2.55, s * 0.9, false); wheel(g, 0.42, 1.62, s * 0.9, false);
      wheel(g, 0.82, 0.35, s * 0.98, true); wheel(g, 0.82, -1.45, s * 0.98, true);
      const rod = add(new THREE.BoxGeometry(2.1, 0.1, 0.06), M.steel, -0.55, 0.82, s * 1.1);
      rod.userData.rod = { x0: -0.55, y0: 0.82, r: 0.3, ph: s > 0 ? 0 : Math.PI / 2 };
      const main = add(new THREE.BoxGeometry(2.0, 0.09, 0.05), M.steel, 1.35, 1.1, s * 1.16);
      main.userData.rod = { x0: 1.35, y0: 1.1, r: 0.3, ph: s > 0 ? 0 : Math.PI / 2, tilt: true };
    }
    // huy hiệu ANDREW STUDIO trên hông cabin + số màn trên 2 hông đèn pha
    const emblem = new THREE.MeshStandardMaterial({ map: tx(emblemTexture()), metalness: 0.7, roughness: 0.3 });
    const numMat = new THREE.MeshStandardMaterial({ map: tx(badgeTexture(num)), metalness: 0.6, roughness: 0.35 });
    for (const s of [-1, 1]) {
      const badge = new THREE.Mesh(new THREE.CircleGeometry(0.46, 40), emblem);
      badge.position.set(-1.95, 1.88, s * 0.986); if (s < 0) badge.rotation.y = Math.PI; g.add(badge);
      const nb = new THREE.Mesh(new THREE.CircleGeometry(0.24, 28), numMat);
      nb.position.set(3.25, 3.25, s * 0.335); if (s < 0) nb.rotation.y = Math.PI; g.add(nb);
    }
    // bảng tên ANDREW STUDIO bằng đồng dọc thân nồi hơi
    for (const s of [-1, 1]) {
      const plate = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 0.42), new THREE.MeshStandardMaterial({ map: tx(nameplateTexture()), metalness: 0.8, roughness: 0.28, transparent: true }));
      plate.position.set(0.55, 2.05, s * 0.84); if (s < 0) plate.rotation.y = Math.PI; g.add(plate);
    }
    g.userData.stack = new THREE.Vector3(2.72, 5.3, 0);
    return g;
  }

  function makeTender(paintHex, label = null) {
    const g = new THREE.Group(), add = meshAdder(g);
    const paint = new THREE.MeshPhysicalMaterial({ color: paintHex, metalness: 0.3, roughness: 0.36, clearcoat: 0.6, clearcoatRoughness: 0.25 });
    add(new THREE.BoxGeometry(TENDER_LEN, 0.28, 1.4), M.iron, 0, 0.98);
    add(new THREE.BoxGeometry(TENDER_LEN - 0.1, 1.15, 1.9), paint, 0, 1.7);
    add(new THREE.BoxGeometry(TENDER_LEN, 0.1, 1.98), M.brass, 0, 2.3);
    // hoa văn vàng trang trí trên hông toa than (chữ ANDREW STUDIO chỉ ở đầu máy)
    for (const s of [-1, 1]) {
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(TENDER_LEN - 0.3, 0.8), new THREE.MeshStandardMaterial({ map: tx(ornamentTexture(label)), transparent: true, metalness: 0.5, roughness: 0.35 }));
      sign.position.set(0, 1.72, s * 0.96); if (s < 0) sign.rotation.y = Math.PI; g.add(sign);
    }
    add(new THREE.BoxGeometry(TENDER_LEN - 0.2, 0.08, 1.98), M.brass, 0, 1.18);
    const r = mulberry(9);
    for (let i = 0; i < 16; i++) {
      add(new THREE.CylinderGeometry(0.13, 0.13, 1.5 + r() * 0.3, 10), M.log, -1.3 + (i % 6) * 0.48 + r() * 0.1, 2.45 + Math.floor(i / 6) * 0.2, (r() - 0.5) * 0.5, Math.PI / 2, 0, (r() - 0.5) * 0.2);
    }
    for (const s of [-1, 1]) for (const x of [-1.15, -0.35, 0.45, 1.25]) wheel(g, 0.38, x, s * 0.9, false);
    return g;
  }

  function makeCart(definition, frame = trainColors && trainColors.frame, boxMat = M.boxcar) {   // 1ae: tàu trình diễn intro dùng màu đội kia
    const g = new THREE.Group(), add = meshAdder(g);
    add(new THREE.BoxGeometry(CART_W, 0.26, 1.5), M.iron, 0, 0.95);
    add(new THREE.BoxGeometry(CART_W - 0.1, 2.4, 1.95), [boxMat, boxMat, M.woodDark, M.woodDark, boxMat, boxMat], 0, 2.3);
    // đai sắt dọc + ngang
    for (const x of [-CART_W / 2 + 0.08, CART_W / 2 - 0.08]) for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.1, 2.44, 0.03), M.iron, x, 2.3, s * 0.99);
    for (const y of [1.14, 3.46]) for (const s of [-1, 1]) add(new THREE.BoxGeometry(CART_W - 0.05, 0.1, 0.03), M.iron, 0, y, s * 0.99);
    // mái + lối đi trên nóc
    add(new THREE.BoxGeometry(CART_W + 0.25, 0.14, 2.2), M.woodDark, 0, 3.57);
    add(new THREE.BoxGeometry(CART_W + 0.1, 0.07, 0.5), M.log, 0, ROOF_Y - 0.035);
    // bảng định nghĩa sơn trên hông toa (hướng về máy quay)
    if (definition == null) {   // 1af: toa hàng gỗ thường cho tàu trình diễn — hoa văn khắc vàng 2 bên, không bảng chữ
      const orn = new THREE.MeshStandardMaterial({ map: tx(ornamentTexture()), transparent: true, metalness: 0.5, roughness: 0.35 });
      for (const sd of [-1, 1]) { const o = new THREE.Mesh(new THREE.PlaneGeometry(CART_W - 0.7, 1.45), orn); o.position.set(0, 2.3, sd * 1.0); if (sd < 0) o.rotation.y = Math.PI; g.add(o); }
    } else {
      const face = new THREE.Mesh(new THREE.PlaneGeometry(CART_W - 0.5, 2.1), new THREE.MeshBasicMaterial({ map: tx(boardTexture(definition, frame)), color: new THREE.Color(1.04, 1.04, 1.04) }));
      face.position.set(0, 2.3, 1.0); g.add(face);
    }
    // 2 giá chuyển hướng (bogie) 4 bánh
    for (const bx of [-CART_W / 2 + 1.1, CART_W / 2 - 1.1]) {
      add(new THREE.BoxGeometry(1.7, 0.22, 1.5), M.iron, bx, 0.62);
      for (const s of [-1, 1]) for (const dx of [-0.52, 0.52]) wheel(g, 0.38, bx + dx, s * 0.82, false);
    }
    add(new THREE.BoxGeometry(0.45, 0.14, 0.14), M.iron, CART_W / 2 + 0.2, 0.9);
    return g;
  }

  // ------------------------------------------------------------------ khinh khí cầu
  function laneFree(y, fromX) {
    const dir = fromX >= S.camX ? 1 : -1;   // 1ac: chỉ xét quả cùng chiều bay
    return !S.blimps.some(b => Math.abs(b.baseY - y) < 0.5 && (b.dir || 1) === dir && (dir > 0 ? b.x > fromX - 8.5 : b.x < fromX + 8.5));
  }
  function drawKeyword() {
    const first = S.carts.find(c => !c.filled);
    const open = first ? [first.item.keyword] : [];
    if (!S.deck.length) {
      const inLevel = new Set(S.carts.map(c => c.key));
      const others = shuffleR(words.filter(w => !inLevel.has(norm(w.keyword))).map(w => w.keyword));
      const nDis = Math.max(1, Math.min(3, Math.ceil(open.length * 0.6)));
      S.deck = shuffleR([...open, ...open, ...others.slice(0, nDis)]);
    }
    let k = S.deck.pop();
    // từ của toa đã đầy thì đổi sang từ còn mở (không để trời đầy từ đã xong)
    const openSet = new Set(open.map(norm));
    const done = new Set(S.carts.filter(c => c.filled).map(c => c.key));
    if (done.has(norm(k)) && !openSet.has(norm(k)) && open.length) k = open[0];
    return k;
  }
  function spawnBlimp(x, attract) {
    const lanes = shuffleR(V.lanes.slice());
    // luôn NGOÀI mép phải (kể cả khi máy quay đang lia tới) và luôn SAU quả đang bay cuối cùng (không chen/đè nhau)
    // 1ac share: xen kẽ bay phải→trái (dir 1) và trái→phải (dir −1) ⇒ hai nửa màn gặp khinh khí cầu như nhau
    const dir = share && x == null && !attract ? (S.nextDir = -S.nextDir) : 1;
    const same = S.blimps.filter(b => !b.leaving && !b.attract && (b.dir || 1) === dir);
    const lastX = dir > 0 ? same.reduce((m, b) => Math.max(m, b.x), -Infinity) : same.reduce((m, b) => Math.min(m, b.x), Infinity);
    const spawnX = x ?? (dir > 0 ? Math.max(Math.max(S.camX, S.camTarget) + SKY + 7, lastX + 8.5) : Math.min(Math.min(S.camX, S.camTarget) - SKY - 7, lastX - 8.5));
    const y = lanes.find(l => x != null || laneFree(l, spawnX));
    if (y == null) return false;
    const bonusTypes = [opt.bonusTime && opt.timerMode === "down" && "time", opt.bonusPoints && "points", opt.bonusX2 && "x2"].filter(Boolean);
    const bonus = !attract && bonusTypes.length && Math.random() < 0.11 ? bonusTypes[Math.floor(Math.random() * bonusTypes.length)] : null;
    const word = bonus ? null : (attract ? words[Math.floor(Math.random() * words.length)].keyword : drawKeyword());
    const obj = bonus ? makeBonusBalloon(bonus) : makeBlimp(word);
    const boost = !attract && S.entry > 0 ? (S.entry--, 3.2) : 0;   // đầu màn: bay vào nhanh hơn chút rồi chậm dần về tốc độ thường
    const b = { obj, word, bonus, x: spawnX, baseY: y, y, phase: Math.random() * 6, attract: !!attract, leaving: false, vy: 0, boost, dir };
    if (dir < 0) obj.rotation.y = Math.PI;   // 1ac: mũi khinh khí cầu quay sang phải
    obj.position.set(b.x, y, 0);
    obj.userData.blimp = b;
    sky.add(obj);
    // thân va chạm: 3 cầu dọc thân khí cầu + 1 cầu khoang lái (chỉ va thùng đang nằm trên tàu)
    const bb = new CANNON.Body({ mass: 0, type: CANNON.Body.KINEMATIC, collisionFilterGroup: 4, collisionFilterMask: 2 });
    if (bonus) bb.addShape(new CANNON.Sphere(1.15 * BS));
    else { for (const x of [-1.7, 0, 1.7]) bb.addShape(new CANNON.Sphere(0.98 * BS * (x ? 0.85 : 1)), new CANNON.Vec3(x * BS, 0, 0)); bb.addShape(new CANNON.Sphere(0.42 * BS), new CANNON.Vec3(-0.3 * BS, -1.35 * BS, 0)); }
    bb.position.set(b.x, y, 0);
    bb.addEventListener("collide", () => { if (S.time - (b.bumpT || -9) > 0.4) { b.bumpT = S.time; b.bump = 1; sfx.bump(); } });
    PH.addBody(bb); b.body = bb; b.bump = 0;
    if (opt.guide && !bonus && !attract) b.guide = makeGuide(y);
    if (b.guide) sky.add(b.guide);
    S.blimps.push(b);
    return true;
  }
  function makeBlimp(word) {
    const g = new THREE.Group();
    const env = new THREE.Mesh(G.envelope, M.envelope); env.castShadow = true; env.receiveShadow = true; g.add(env);
    // 4 cánh đuôi
    for (let i = 0; i < 4; i++) {
      const pivot = new THREE.Group(); pivot.rotation.x = i * Math.PI / 2 + Math.PI / 4;
      const fin = new THREE.Mesh(G.fin, M.finRed); fin.position.set(2.2, 0, 0.42); fin.castShadow = true;
      pivot.add(fin); g.add(pivot);
    }
    // khoang lái + dây treo + 2 động cơ cánh quạt
    const gon = new THREE.Mesh(G.gondola, M.gondola); gon.rotation.z = Math.PI / 2; gon.position.set(-0.3, -1.4, 0); gon.castShadow = true; g.add(gon);
    const win = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.14, 0.6), M.gonWin); win.position.set(-0.3, -1.33, 0); g.add(win);
    for (const [x, z] of [[-0.9, 0.2], [0.3, 0.2], [-0.9, -0.2], [0.3, -0.2]]) {
      const c = new THREE.Mesh(G.rope, M.rope); c.position.set(x, -1.05, z); c.rotation.z = x < 0 ? -0.25 : 0.25; g.add(c);
    }
    g.userData.props = [];
    for (const s of [-1, 1]) {
      const pod = new THREE.Mesh(G.pod, M.steel); pod.rotation.z = Math.PI / 2; pod.position.set(0.55, -1.3, s * 0.62); pod.castShadow = true; g.add(pod);
      const prop = new THREE.Group(); prop.position.set(0.95, -1.3, s * 0.62);
      for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(G.blade, M.log); b.rotation.x = k * Math.PI * 2 / 3; prop.add(b); }
      g.add(prop); g.userData.props.push(prop);
    }
    const banner = new THREE.Mesh(G.banner, new THREE.MeshBasicMaterial({ map: tx(wordTexture(word)), transparent: true, depthWrite: false, color: new THREE.Color(1.04, 1.04, 1.04) }));
    banner.renderOrder = 5;
    g.add(banner); g.userData.banner = banner;
    const hit = new THREE.Mesh(G.hitBlimp, M.hit); hit.scale.set(3.8, 1.9, 1.9); g.add(hit); g.userData.hit = hit;
    g.scale.setScalar(BS);
    return g;
  }
  function makeBonusBalloon(type) {
    const g = new THREE.Group();
    const col = type === "time" ? 0x3f9cff : type === "points" ? 0xf2b726 : 0xa45cff;
    const mat = new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.18, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.08 });
    const ball = new THREE.Mesh(G.blimp, mat); ball.scale.set(1.15, 1.32, 1.15); ball.castShadow = true; g.add(ball);
    const knot = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.3, 12), mat); knot.position.y = -1.4; knot.rotation.x = Math.PI; g.add(knot);
    const str = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.8, 4), M.rope); str.position.y = -2.4; g.add(str);
    const icon = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), new THREE.MeshBasicMaterial({ map: iconTexture(type), transparent: true, depthWrite: false }));
    icon.renderOrder = 5; g.add(icon); g.userData.banner = icon;
    const hit = new THREE.Mesh(G.hitBlimp, M.hit); hit.scale.set(1.9, 2.1, 1.9); g.add(hit); g.userData.hit = hit;
    g.scale.setScalar(BS);
    return g;
  }
  function makeGuide(y) {
    const g = new THREE.Group();
    const h = y - 1.5 * BS - ROOF_W;
    const line = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, h, 5), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, depthWrite: false }));
    line.position.y = ROOF_W + h / 2; g.add(line);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.8, 28), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = ROOF_W + 0.08; g.add(ring);
    g.renderOrder = 4;
    return g;
  }
  function removeBlimp(b) {
    if (b.body) { PH.removeBody(b.body); b.body = null; }
    sky.remove(b.obj); disposeTree(b.obj);
    if (b.guide) { sky.remove(b.guide); disposeTree(b.guide); }
    const i = S.blimps.indexOf(b); if (i >= 0) S.blimps.splice(i, 1);
  }

  // ------------------------------------------------------------------ bấm
  const rc = new THREE.Raycaster(), ndc = new THREE.Vector2();
  canvas.addEventListener("pointerdown", e => {
    if (S.state !== "play" || S.paused) return;
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    if (mirror) ndc.x = -ndc.x;   // 1ad: khung hình lật ngang
    rc.setFromCamera(ndc, camera);
    const hits = rc.intersectObjects(S.blimps.filter(b => !b.leaving && !b.attract).map(b => b.obj.userData.hit), false);
    const team = share ? ((e.clientX - r.left) < r.width / 2 ? 0 : 1) : null;   // 1ac: nửa trái = đội 1, nửa phải = đội 2
    if (hits.length) popBlimp(hits[0].object.parent.userData.blimp, team);
  });

  function popBlimp(b, team = null) {
    sfx.pop();
    burst(b.obj.position, b.bonus ? 12 : 22);
    puff(b.obj.position, b.bonus ? 0.8 : 1.4);
    removeBlimp(b);
    if (b.bonus) return applyBonus(b.bonus, b.obj.position, team);
    dropCrate(b.word, b.obj.position.x, b.obj.position.y - 1.45 * BS, S.camV - (b.dir || 1) * (blimpV() + 2.2), team);   // 1j: văng chéo mạnh hơn theo đà khinh khí cầu
  }
  function applyBonus(type, pos, team = null) {
    sfx.bonus();
    if (type === "time") { S.timeLeft += 10; floatText("+10s", pos, "#7fd0ff"); flashClock("+10s"); }
    else if (type === "points") { addScore(10, team); floatText("+10", pos, "#ffd34d"); updateHud(); }
    else { S.x2 += 3; floatText("×2", pos, "#d9a8ff"); clockEl.classList.add("is-x2"); }
  }

  // ------------------------------------------------------------------ thùng hàng — VẬT LÝ VẬT RẮN THẬT (1f, cannon-es)
  // Thùng gỗ CỨNG: không méo, chỉ nảy/lắc. Một toa chứa được nhiều thùng: rơi lệch thì chúi về trước/sau, rơi lên thùng khác
  // thì chồng lên, nghiêng, đổ… đúng theo va chạm thật. Chạm nóc toa lần đầu: trượt + lắc RẤT nhẹ (tàu không bị ảnh hưởng —
  // đoàn tàu là vật "động học", không nhận lực). Thùng đúng nằm yên hẳn trên toa của nó mới cộng điểm, rồi gắn chặt vào toa
  // (thùng khác rơi lên vẫn va vào nó). Thùng SAI chạm toa thì văng khỏi toa như Wordwall (nhãn ửng đỏ, trừ Points off). Trúng đầu máy / toa khách:
  // văng xuống đất; trúng toa than: văng + than bắn + trừ điểm.
  const PH = new CANNON.World({ gravity: new CANNON.Vec3(0, -GRAV, 0) });
  PH.broadphase = new CANNON.NaiveBroadphase();
  PH.solver.iterations = 24; PH.solver.tolerance = 1e-5;
  const pmCrate = new CANNON.Material("crate"), pmCar = new CANNON.Material("car"), pmGround = new CANNON.Material("ground");
  const contactMat = (a, b, friction, restitution) => PH.addContactMaterial(new CANNON.ContactMaterial(a, b, { friction, restitution, contactEquationStiffness: 4e7, contactEquationRelaxation: 3, frictionEquationStiffness: 4e7, frictionEquationRelaxation: 3 }));
  contactMat(pmCrate, pmCar, 0.5, 0.32); contactMat(pmCrate, pmCrate, 0.6, 0.1); contactMat(pmCrate, pmGround, 0.7, 0.14);
  const groundBody = new CANNON.Body({ mass: 0, material: pmGround });
  groundBody.addShape(new CANNON.Plane()); groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  PH.addBody(groundBody);
  const ballastBody = new CANNON.Body({ mass: 0, material: pmGround });   // nền đá dăm dưới ray
  ballastBody.addShape(new CANNON.Box(new CANNON.Vec3(1e4, 0.2, 1.35))); ballastBody.position.set(0, 0.2, 0);
  PH.addBody(ballastBody);
  const CRATE_HALF = new CANNON.Vec3(CRATE_W * TS / 2, CRATE * TS / 2, CRATE * TS / 2);
  let trainBody = null;
  const shapeInfo = new Map(), contactQ = [];
  // cả đoàn tàu = MỘT vật động học ghép nhiều khối (mỗi khối biết mình thuộc toa nào)
  function buildTrainBody() {
    if (trainBody) PH.removeBody(trainBody);
    shapeInfo.clear();
    const b = new CANNON.Body({ mass: 0, type: CANNON.Body.KINEMATIC, material: pmCar });
    const box = (info, cx, y0, y1, hx, hz) => {
      const s = new CANNON.Box(new CANNON.Vec3(hx * TS, (y1 - y0) / 2 * TS, hz * TS));
      b.addShape(s, new CANNON.Vec3(cx * TS, (y0 + y1) / 2 * TS, 0)); shapeInfo.set(s, info);
    };
    box({ type: "head" }, -1.95, 0.9, 3.62, 1.2, 1.1);                 // cabin
    box({ type: "head" }, 1.0, 0.9, 2.9, 2.2, 0.9);                    // nồi hơi
    box({ type: "head" }, -ENGINE_LEN / 2 - CART_GAP - TENDER_LEN / 2, 0.9, 2.6, TENDER_LEN / 2, 1.0);
    for (const car of S.cars) {
      if (car.type === "answer") {
        box({ type: "answer", car }, car.localX, ROOF_Y - 0.16, ROOF_Y, CART_W / 2 + 0.12, 1.1);
        box({ type: "answer", car }, car.localX, 0.9, ROOF_Y - 0.16, CART_W / 2 - 0.05, 0.98);
      } else box({ type: car.type, car }, car.localX, 0.9, car.roof, car.len / 2, 0.98);
    }
    b.position.set(S.train.position.x, RAIL_TOP, 0);
    PH.addBody(b); trainBody = b;
  }
  // bước vật lý: đoàn tàu đi đúng quãng nó vừa chạy trong khung hình này (không lệch pha giữa thùng và toa)
  function stepPhysics(dt, tx0) {
    if (dt <= 0) return;
    const n = Math.max(1, Math.ceil(dt / (1 / 120))), h = dt / n;
    if (trainBody) { trainBody.position.set(tx0, RAIL_TOP, 0); trainBody.velocity.set((S.train.position.x - tx0) / dt, 0, 0); }
    for (const c of S.crates) c.touch.clear();
    for (let i = 0; i < n; i++) { PH.step(h); handleContacts(); collectTouches(); }
    if (trainBody) trainBody.position.x = S.train.position.x;
  }
  function collectTouches() {
    for (const eq of PH.contacts) {
      let crateB = null, shape = null;
      if (eq.bi === trainBody && eq.bj.userData && eq.bj.userData.crate) { crateB = eq.bj; shape = eq.si; }
      else if (eq.bj === trainBody && eq.bi.userData && eq.bi.userData.crate) { crateB = eq.bi; shape = eq.sj; }
      if (!crateB) continue;
      const info = shapeInfo.get(shape);
      if (info && info.type === "answer") crateB.userData.crate.touch.add(info.car);
    }
  }
  const cartUnder = x => S.carts.find(k => Math.abs(cartWorldX(k) - x) <= CART_W * TS / 2 + 0.05);
  const GROUND_Y = z => (Math.abs(z) < 1.35 ? 0.34 + Math.max(0, 0.14 * (1 - Math.abs(z) / 1.35)) : 0);
  function dropCrate(word, x, y, vx = 0, team = null) {
    const label = new THREE.MeshStandardMaterial({ map: tx(crateTexture(word, team)), normalMap: M.crateSide.normalMap, roughness: 0.85 });
    const mesh = new THREE.Mesh(G.crate, [M.crateSide, M.crateSide, label, M.crateSide, label, M.crateSide]);
    mesh.scale.setScalar(TS);
    mesh.castShadow = true; mesh.receiveShadow = true;
    mesh.position.set(x, y, 0);
    scene.add(mesh);
    const body = new CANNON.Body({ mass: 1, material: pmCrate, linearDamping: 0.02, angularDamping: 0.06, collisionFilterGroup: 1 });
    body.addShape(new CANNON.Box(CRATE_HALF.clone()));
    // 1i: thùng lủng lẳng dưới khinh khí cầu nên rơi ra hơi NGHIÊNG + xoay nhẹ ⇒ chạm toa bằng một góc/cạnh: nảy, chúi, lắc, xê dịch như thật
    body.position.set(x, y, 0); body.velocity.set(vx, 0.3, 0);
    body.quaternion.setFromEuler((Math.random() - 0.5) * 0.06, (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.2);   // nghiêng chủ yếu dọc đoàn tàu (thùng hẹp theo bề ngang toa, dễ lật khỏi toa)
    body.angularVelocity.set((Math.random() - 0.5) * 0.25, (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 1.0);
    body.allowSleep = false;
    const c = { mesh, body, label, word, team, key: norm(word), onTrain: false, judged: false, kicked: false, settle: 0, thudT: 0, nudgeT: 0, touch: new Set(), lostT: 0 };
    body.userData = { crate: c };
    // sự kiện "collide" của cannon-es dùng lại 1 đối tượng ⇒ chép ngay các giá trị cần (vận tốc va chạm tính TRƯỚC khi giải)
    body.addEventListener("collide", e => { const eq = e.contact; contactQ.push({ c, other: e.body, shape: eq.bi === e.body ? eq.si : eq.sj, imp: Math.abs(eq.getImpactVelocityAlongNormal()) }); });
    PH.addBody(body);
    S.crates.push(c);
    return c;
  }
  function handleContacts() {
    for (const { c, other, shape, imp } of contactQ) {
      if (c.removed || c.locked) continue;
      if (other === trainBody) {
        const info = shapeInfo.get(shape) || { type: "head" };
        if (info.type === "answer") touchTrain(c, info.car, imp);
        else if (info.type === "coach") { if (!c.kicked) touchTrain(c, null, imp); }
        else if (!c.kicked && !c.onTrain) {
          startle(c.body.position.x);
          if (info.type === "coal") coalHit(c, info.car, Math.min(1.6, imp / 9));
          else { sfx.thud(); kick(c, 0.8); S.shake = Math.max(S.shake, 0.12 * Math.min(1.6, imp / 9)); }
        }
      } else if (other.userData && other.userData.crate) {
        const o = other.userData.crate;
        if (o.onTrain && !c.kicked) touchTrain(c, cartUnder(c.body.position.x), imp);
        else if (imp > 1.8 && S.time - c.thudT > 0.25) { c.thudT = S.time; sfx.thud(); }
      } else if (imp > 2.2 && S.time - c.thudT > 0.25) {
        c.thudT = S.time; sfx.thud();
        if (imp > 4) dust(c.body.position);
      }
    }
    contactQ.length = 0;
  }
  // chạm toa đáp án (nóc toa, hoặc thùng đang nằm trên toa)
  function touchTrain(c, car, imp) {
    if (!c.onTrain) {
      c.onTrain = true;
      // thùng gỗ cứng tiếp đất: chỉ trượt + lắc RẤT nhẹ theo quán tính còn lại
      c.body.collisionFilterGroup = 3;   // đã nằm trên tàu: khinh khí cầu bay sát sẽ húc phải
      const v = c.body.velocity, tv = S.trainVel;
      v.x = tv + Math.max(-1.3, Math.min(1.3, (v.x - tv) * 0.6)) + (Math.random() - 0.5) * 0.6;   // 1j: cú chạm bằng góc thùng không biến thành cú văng ngang quá mạnh v.z *= 0.5;   // xê dịch thêm chút theo hướng ngẫu nhiên
      const w = c.body.angularVelocity, kk = Math.min(1, imp / 9);
      w.x = w.x * 0.5 + (Math.random() - 0.5) * 0.5 * kk; w.y *= 0.7; w.z = Math.max(-2.6, Math.min(2.6, w.z * 0.6 + (Math.random() - 0.5) * 3 * kk));   // chúi, lắc nhẹ
      sfx.thud(); startle(c.body.position.x);
      S.shake = Math.max(S.shake, 0.01 * Math.min(1.6, imp / 9));
    }
    if (!c.judged && car && S.state === "play") {
      c.judged = true;
      if (car.key !== c.key) { wrongCrate(c); kick(c, 1); }   // thầy chốt 29/9: thùng SAI văng khỏi toa như Wordwall
    }
  }
  function kick(c, strength) {
    c.kicked = true;
    const v = c.body.velocity, tv = S.trainVel;
    v.x = tv + (v.x - tv) * 0.35 + (Math.random() - 0.5) * 1.6;
    v.y = Math.abs(v.y) * 0.42 + 2.2 * strength;
    v.z = (2.4 + Math.random() * 1.4) * (Math.random() < 0.75 ? 1 : -1);
    c.body.angularVelocity.set((Math.random() - 0.5) * 9, (Math.random() - 0.5) * 5, -(v.x - tv) * 1.6 - 3);
  }
  // người trong các toa khách gần chỗ va chạm giật mình
  function startle(x = S.camX) {
    for (const co of S.coaches) if (Math.abs(S.train.position.x + co.localX * TS - x) < 20) {
      co.startleT = 0;
      co.hits = (co.hits || []).filter(t => S.time - t < 4.5); co.hits.push(S.time);
      if (co.hits.length >= 2) co.chaosT = 0;   // 1i: thùng rơi liên tiếp ⇒ toa loạn, có người chạy lung tung
    }
  }
  // thùng rơi vào TOA THAN: thùng văng, than bắn tung toé, trừ điểm
  function coalHit(c, car, impact) {
    sfx.wrong(); sfx.coalHit();   // 1ah: than bắn tung (tiếng thật)
    kick(c, 1.25);
    S.shake = Math.max(S.shake, 0.18 * impact);
    const roofW = RAIL_TOP + car.roof * TS;
    const bp = c.body.position, p0 = new THREE.Vector3(bp.x, bp.y, bp.z), cm = coalMaterial();
    for (let k = 0; k < 18; k++) {
      const m = new THREE.Mesh(COAL_LUMP, cm); m.castShadow = true;
      m.position.set(p0.x + (Math.random() - 0.5) * 1.6, roofW - 0.2, (Math.random() - 0.5) * 1.0);
      m.scale.setScalar(TS * (0.7 + Math.random() * 0.9));
      scene.add(m);
      S.fx.push({ obj: m, t: 0, life: 4 + Math.random(), kind: "coal", v: new THREE.Vector3(S.trainVel + (Math.random() - 0.5) * 5, 3 + Math.random() * 5, (Math.random() < 0.7 ? 1 : -1) * (1.5 + Math.random() * 3)), w: new THREE.Vector3(Math.random() * 12, Math.random() * 12, Math.random() * 12) });
    }
    for (let k = 0; k < 6; k++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, color: 0x1c1a18, transparent: true, depthWrite: false, opacity: 0.7 }));
      s.position.set(p0.x + (Math.random() - 0.5) * 1.5, roofW + 0.3, (Math.random() - 0.5)); s.scale.setScalar(0.8); fxRoot.add(s);
      S.fx.push({ obj: s, t: 0, life: 1.2, kind: "smoke", v: new THREE.Vector3(S.trainVel * 0.6 + (Math.random() - 0.5) * 2, 1.2 + Math.random(), (Math.random() - 0.5)), grow: 2.6 });
    }
    if (S.state === "play") {
      const pen = Math.max(2, opt.pointsOff);
      addScore(-pen, c.team);
      floatText("−" + pen, p0.clone().add(new THREE.Vector3(0, 1.2, 0)), "#ff7b6b");
      updateHud();
    }
  }
  function wrongCrate(c) {
    sfx.wrong();
    c.label.color.setRGB(1.0, 0.62, 0.55);
    if (opt.pointsOff > 0) {
      addScore(-opt.pointsOff, c.team);
      const p = c.body.position;
      floatText("−" + opt.pointsOff, new THREE.Vector3(p.x, p.y + 1.2, p.z), "#ff7b6b");
      updateHud();
    }
  }
  function updateCrates(dt) {
    for (let i = S.crates.length - 1; i >= 0; i--) {
      const c = S.crates[i], b = c.body, p = b.position;
      c.mesh.position.set(p.x, p.y, p.z);
      c.mesh.quaternion.set(b.quaternion.x, b.quaternion.y, b.quaternion.z, b.quaternion.w);
      if (!c.onTrain && !c.kicked && b.velocity.y < 0 && S.train) {
        // sắp chạm nóc toa: đà ngang ngược chiều tàu (quán tính khinh khí cầu) giảm dần ⇒ chạm toa chỉ nảy + xê dịch, không lật văng
        const car = S.cars.find(k => Math.abs(S.train.position.x + k.localX * TS - p.x) <= k.len * TS / 2 + 0.6);
        if (car && p.y - (RAIL_TOP + car.roof * TS) < 2.8) { const k = Math.exp(-dt * 7); b.velocity.x = S.trainVel + (b.velocity.x - S.trainVel) * k; }
      }
      if (c.onTrain && !c.kicked) {
        // nóc toa hẹp theo bề ngang: giữ thùng không trôi ra mép trước/sau (bập bênh rồi lật) — chỉ nảy/xê dịch dọc toa
        b.velocity.z = b.velocity.z * Math.exp(-dt * 6) - p.z * dt * 6;
        b.angularVelocity.x *= Math.exp(-dt * 5);
      }
      if (c.onTrain) {
        const rel = Math.hypot(b.velocity.x - S.trainVel, b.velocity.y, b.velocity.z), w = b.angularVelocity.length();
        if (p.y < ROOF_W - 0.35) { c.onTrain = false; c.settle = 0; }            // rơi khỏi toa: không tính
        else if (rel < 0.2 && w < 0.3) {
          c.settle += dt;
          if (c.settle > 0.3 && S.state === "play" && !c.scoredCart) {
            // toa đúng: nằm trên toa, hoặc chỉ TÌ MỘT PHẦN vào toa (nghiêng, nửa kia gác lên toa khác)
            const under = p.y > ROOF_W - 0.1 ? cartUnder(p.x) : null;
            const cands = [...c.touch, under].filter(Boolean);
            const cart = cands.find(k => k.key === c.key);   // 1j: toa đã có thùng đúng vẫn nhận thêm thùng đúng (mỗi thùng một lần điểm)
            if (cart) scoreCart(cart, c);
          }
        } else c.settle = 0;
      } else if (p.y < 1.9 && Math.abs(p.z) < 1.9 && Math.abs(b.velocity.y) < 1 && S.time - c.nudgeT > 0.5) {
        // nằm trên đường ray: hất ra lề (không nằm chắn đường tàu)
        c.nudgeT = S.time;
        b.velocity.z = (p.z >= 0 ? 1 : -1) * (2.6 + Math.random()); b.velocity.y = 2.4; b.velocity.x *= 0.7;
        b.angularVelocity.x += (Math.random() - 0.5) * 6;
      }
      // thùng đúng đã tính điểm bị húc/đẩy rơi xuống đất (hoặc văng hẳn sang toa khác) ⇒ trừ lại điểm, toa mở lại
      const sc = c.scoredCart;
      if (sc && S.state === "play" && S.levels[S.level] === S.carts && S.carts.includes(sc)) {
        const away = p.y < 2.2 || (!c.touch.has(sc) && cartUnder(p.x) !== sc);
        c.lostT = away ? c.lostT + dt : 0;
        if (c.lostT > (p.y < 2.2 ? 0 : 0.6)) unscore(c);
      }
      if (p.x < S.camX - HALF - 14 || p.y < -5) { removeCrate(c); S.crates.splice(i, 1); }
    }
  }
  function unscore(c) {
    const cart = c.scoredCart;
    addScore(-c.gain, c.team);
    const p = c.body.position;
    floatText("\u2212" + c.gain, new THREE.Vector3(p.x, Math.max(p.y, 2) + 1.2, p.z), "#ff7b6b");
    sfx.wrong();
    c.scoredCart = null;
    const left = share ? null : S.crates.find(k => k !== c && k.scoredCart === cart);   // toa còn thùng đúng khác thì vẫn đầy (share: toa mở lại, thùng đúng còn nằm đó tự chiếm lại)
    if (share) unclaim(cart);
    if (left) { cart.crate = left.mesh; cart.crateObj = left; } else { cart.filled = false; cart.crate = null; cart.crateObj = null; }
    c.gain = 0; c.lostT = 0; c.settle = 0;
    S.deck = [];
    updateHud();
  }
  // thùng đúng đã nằm yên: gắn chặt vào toa (thành một khối của đoàn tàu), hình thùng chuyển sang nhóm của toa
  function lockCrate(c, cart) {
    const q = c.body.quaternion, p = c.body.position;
    const s = new CANNON.Box(CRATE_HALF.clone());
    trainBody.addShape(s, new CANNON.Vec3(p.x - trainBody.position.x, p.y - trainBody.position.y, p.z), new CANNON.Quaternion(q.x, q.y, q.z, q.w));
    shapeInfo.set(s, { type: "answer", car: cart });
    PH.removeBody(c.body); c.body = null; c.locked = true;
    const m = c.mesh, local = cart.group.worldToLocal(m.position.clone());
    scene.remove(m); cart.group.add(m);
    m.position.copy(local); m.scale.setScalar(1);
    cart.filled = true; cart.crate = m; cart.crateObj = c;
  }
  function scoreCart(cart, c) {
    if (share && cart.filled) return;   // 1ac share: toa đã có đội chiếm — thùng đúng đến sau chỉ nằm đó, không điểm
    const gain = S.x2 > 0 ? 10 : 5;
    if (!cart.filled) { cart.crate = c.mesh; cart.crateObj = c; }
    cart.filled = true; c.scoredCart = cart; c.gain = gain;
    if (S.x2 > 0) { S.x2--; if (!S.x2) clockEl.classList.remove("is-x2"); }
    addScore(gain, c.team);
    if (share) claim(cart, c.team);
    sfx.correct();
    const wp = new THREE.Vector3(); cart.crate.getWorldPosition(wp);
    floatText("+" + gain, wp.clone().add(new THREE.Vector3(0, 1.3, 0)), "#9dffa9");
    S.deck = [];
    updateHud();
    if (S.state === "play" && S.carts.every(k => k.filled)) levelClear();
  }
  // 1ac: cộng/trừ điểm — share thì vào điểm đội, còn lại vào điểm bàn
  function addScore(d, team) {
    if (share && team != null) S.teams[team] += d; else S.score += d;
  }
  // 1ac share: đội chiếm toa ⇒ cắm cờ + dải màu đội dưới bảng định nghĩa
  const flagGeo = new THREE.PlaneGeometry(1.5, 0.95, 8, 1), poleGeo = new THREE.CylinderGeometry(0.05, 0.05, 2.6, 8), bandGeo = new THREE.PlaneGeometry(CART_W - 0.5, 0.3);
  function claim(cart, team) {
    unclaim(cart);
    const col = new THREE.Color(TEAM_COLORS[team]);
    const g = new THREE.Group();
    const pole = new THREE.Mesh(poleGeo, M.brass); pole.position.set(CART_W / 2 - 0.35, ROOF_Y + 1.3, 0.75); pole.castShadow = true; g.add(pole);
    const cloth = new THREE.Mesh(flagGeo, new THREE.MeshStandardMaterial({ color: col, roughness: 0.6, side: THREE.DoubleSide, emissive: col, emissiveIntensity: 0.25 }));
    cloth.position.set(CART_W / 2 - 0.35 - 0.78, ROOF_Y + 2.1, 0.75); cloth.castShadow = true; g.add(cloth);
    const band = new THREE.Mesh(bandGeo, new THREE.MeshBasicMaterial({ color: col.clone().multiplyScalar(1.15) })); band.position.set(0, 1.12, 1.005); g.add(band);
    cart.group.add(g); cart.flag = g; cart.team = team;
  }
  function unclaim(cart) {
    if (!cart.flag) return;
    cart.group.remove(cart.flag); cart.flag.traverse(o => { if (o.material && o.material !== M.brass) o.material.dispose(); });
    cart.flag = null; cart.team = null;
  }
  function removeCrate(c) {
    if (c.removed) return;
    c.removed = true;
    scene.remove(c.mesh);
    if (c.body) { PH.removeBody(c.body); c.body = null; }
    c.label.map.dispose(); c.label.dispose();
  }

  // ------------------------------------------------------------------ hiệu ứng
  function burst(pos, n) {
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(G.shard, M.shard.clone());
      m.position.copy(pos).add(new THREE.Vector3((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 1.5, 0));
      const v = new THREE.Vector3((Math.random() - 0.5) * 9, Math.random() * 6, (Math.random() - 0.5) * 5);
      fxRoot.add(m);
      S.fx.push({ obj: m, v, life: 1.6, t: 0, spin: new THREE.Vector3(Math.random() * 9, Math.random() * 9, 0), kind: "shard" });
    }
  }
  function spriteOf(tex, w, h) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false, toneMapped: false }));
    s.scale.set(w, h, 1); s.renderOrder = 10; return s;
  }
  function puff(pos, k) {
    const f = spriteOf(flashTex, 5 * k, 5 * k); f.material.blending = THREE.AdditiveBlending; f.material.color = new THREE.Color(2.2, 1.9, 1.5); f.position.copy(pos); fxRoot.add(f);
    S.fx.push({ obj: f, t: 0, life: 0.28, kind: "flash", base: 5 * k });
    for (let i = 0; i < 7; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, color: 0xf3ece2, transparent: true, depthWrite: false, opacity: 0.8 }));
      s.position.copy(pos).add(new THREE.Vector3((Math.random() - 0.5) * 2.6 * k, (Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 1.2)); s.scale.setScalar(1.2 * k); fxRoot.add(s);
      S.fx.push({ obj: s, t: 0, life: 1.1, kind: "smoke", v: new THREE.Vector3((Math.random() - 0.5) * 2, 0.6 + Math.random(), 0), grow: 3.2 * k });
    }
  }
  function popWord(pos) {
    const s = spriteOf(tx(popTexture()), 3.4, 1.7); s.position.copy(pos); fxRoot.add(s);
    S.fx.push({ obj: s, t: 0, life: 0.55, kind: "pop", base: 3.4 });
  }
  function floatText(text, pos, color) {
    const s = spriteOf(tx(textTexture(text, color)), 2.6, 1.3); s.position.copy(pos); fxRoot.add(s);
    S.fx.push({ obj: s, t: 0, life: 1.1, kind: "float" });
  }
  function mark(ok, pos) {
    const s = spriteOf(markTexture(ok), 1.9, 1.9); s.position.copy(pos); s.position.y += 1.4; fxRoot.add(s);
    S.fx.push({ obj: s, t: 0, life: 1.0, kind: "mark" });
  }
  function dust(pos) {
    for (let i = 0; i < 6; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, color: 0xd9b48a, transparent: true, depthWrite: false, opacity: 0.8 }));
      s.position.set(pos.x + (Math.random() - 0.5) * 1.5, 0.5, pos.z + (Math.random() - 0.5) * 1.2); s.scale.setScalar(0.8);
      fxRoot.add(s);
      S.fx.push({ obj: s, t: 0, life: 0.8, kind: "smoke", v: new THREE.Vector3((Math.random() - 0.5) * 2, 1, 0), grow: 2.2 });
    }
  }
  function smokePuff() {
    if (!S.train) return;
    const p = S.engine.userData.stack.clone(); S.engine.localToWorld(p);
    const shade = 0.55 + Math.random() * 0.35;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, color: new THREE.Color(shade * 0.8, shade * 0.77, shade * 0.74), transparent: true, depthWrite: false, opacity: 0.55 }));
    s.position.copy(p); s.scale.setScalar(0.7); s.material.rotation = Math.random() * 6; fxRoot.add(s);
    S.fx.push({ obj: s, t: 0, life: 2.6, kind: "smoke", v: new THREE.Vector3(-0.6 - S.trainV * 0.55, 1.9 + Math.random() * 0.6, -0.4), grow: 4.2 });
  }
  function updateFx(dt) {
    for (let i = S.fx.length - 1; i >= 0; i--) {
      const f = S.fx[i]; f.t += dt; const k = f.t / f.life;
      if (f.kind === "squash") {   // thùng vừa đáp: nảy về dáng thật, không huỷ
        const e = Math.min(1, k), b = 1 + Math.sin(e * Math.PI * 2.5) * (1 - e) * 0.25;
        f.obj.scale.set(1 + (1 / b - 1) * 0.6, b, 1 + (1 / b - 1) * 0.6);
        if (k >= 1) { f.obj.scale.set(1, 1, 1); S.fx.splice(i, 1); }
        continue;
      }
      if (f.kind === "coal") {   // cục than bắn ra: rơi, nảy, lăn rồi mờ dần (hình + vật liệu dùng chung, không huỷ)
        const o = f.obj;
        f.v.y -= GRAV * dt; o.position.addScaledVector(f.v, dt);
        o.rotation.x += f.w.x * dt; o.rotation.y += f.w.y * dt; o.rotation.z += f.w.z * dt;
        const gy = GROUND_Y(o.position.z) + 0.1;
        if (o.position.y < gy) { o.position.y = gy; if (Math.abs(f.v.y) > 1.5) { f.v.y *= -0.32; f.v.x *= 0.6; f.v.z *= 0.6; } else { f.v.y = 0; f.v.x *= 0.85; f.v.z *= 0.85; f.w.multiplyScalar(0.85); } }
        if (k > 0.8) o.scale.setScalar(Math.max(0.001, (1 - k) / 0.2) * TS);
        if (k >= 1 || o.position.x < S.camX - HALF - 14) { scene.remove(o); S.fx.splice(i, 1); }
        continue;
      }
      if (k >= 1) { fxRoot.remove(f.obj); f.obj.material.map && f.obj.kind !== "keep" && f.kind !== "smoke" && f.obj.material.map.dispose(); f.obj.material.dispose(); S.fx.splice(i, 1); continue; }
      if (f.kind === "shard") {
        f.v.y -= 7 * dt; f.v.multiplyScalar(1 - dt * 1.6); f.obj.position.addScaledVector(f.v, dt);
        f.obj.rotation.x += f.spin.x * dt; f.obj.rotation.y += f.spin.y * dt; f.obj.material.opacity = 1 - k;
      } else if (f.kind === "flash") {
        const s = f.base * (0.6 + k * 0.8); f.obj.scale.set(s, s, 1); f.obj.material.opacity = 1 - k;
      } else if (f.kind === "pop") {
        const s = f.base * (0.5 + Math.min(1, k * 3) * 0.7); f.obj.scale.set(s, s / 2, 1); f.obj.material.opacity = k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4;
      } else if (f.kind === "float" || f.kind === "mark") {
        f.obj.position.y += dt * 1.6; f.obj.material.opacity = k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4;
      } else if (f.kind === "smoke") {
        f.obj.position.addScaledVector(f.v, dt); f.obj.scale.setScalar(0.8 + k * f.grow); f.obj.material.opacity = 0.7 * (1 - k);
      }
    }
  }

  // ------------------------------------------------------------------ máy bay kéo băng điểm (1f)
  // Máy bay 2 tầng cánh chi tiết (động cơ hình sao, cánh quạt + vệt mờ, thanh chống, dây giằng, càng bánh, phi công khăn bay).
  // Băng vải kéo sau đúng như thật: dây kéo → khoen xoay → 2 dây chạc nối đầu + chân thanh đầu băng (có quả tạ giữ đứng).
  // Dây luôn vẽ lại từ 2 điểm nối thật mỗi khung hình (không bao giờ hở/lệch khi rung lắc); băng tụt lại theo quán tính
  // và PHẦN PHẬT trong gió (sóng chạy dọc băng, đuôi băng quật mạnh hơn).
  const BAN_W = 7.2, BAN_H = 1.6, ROPE = 3.4, LEAD = 0.9;
  function makeBiplane() {
    const g = new THREE.Group();
    const red = new THREE.MeshPhysicalMaterial({ color: 0xb8321f, roughness: 0.42, metalness: 0.12, clearcoat: 0.6, clearcoatRoughness: 0.3 });
    const cream = new THREE.MeshStandardMaterial({ color: 0xf1e4c4, roughness: 0.55 });
    const leather = new THREE.MeshStandardMaterial({ color: 0x4a2a16, roughness: 0.7 });
    const add = (geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, parent = g) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.castShadow = true; parent.add(m); return m; };
    const rod = (a, b, r, mat) => { const d = b.clone().sub(a); const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 6), mat); m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); m.castShadow = true; g.add(m); return m; };
    // thân thon dần từ mũi (+x) tới đuôi
    const prof = [[0.001, -1.95], [0.36, -1.9], [0.46, -1.65], [0.48, -1.1], [0.46, -0.4], [0.4, 0.3], [0.3, 1.0], [0.18, 1.6], [0.08, 1.95], [0.001, 2.02]];
    const fus = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 28); fus.rotateZ(Math.PI / 2);
    add(fus, red);
    add(new THREE.CylinderGeometry(0.335, 0.325, 0.1, 28), cream, -0.9, 0, 0, 0, 0, Math.PI / 2);   // đai kem
    // động cơ hình sao: nắp capô + 9 đầu xi lanh có gân + chóp cánh quạt
    add(new THREE.CylinderGeometry(0.5, 0.47, 0.34, 32, 1, true), M.ironDouble, 1.82, 0, 0, 0, 0, Math.PI / 2);
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * Math.PI * 2;
      const cyl = add(new THREE.CylinderGeometry(0.07, 0.08, 0.26, 10), M.steel, 1.9, Math.cos(a) * 0.33, Math.sin(a) * 0.33);
      cyl.rotation.x = a;
      for (let k = 0; k < 3; k++) add(new THREE.CylinderGeometry(0.095, 0.095, 0.015, 10), M.iron, 0, -0.04 + k * 0.05, 0, 0, 0, 0, cyl);
    }
    add(new THREE.ConeGeometry(0.17, 0.34, 20), red, 2.2, 0, 0, 0, 0, -Math.PI / 2);
    const prop = new THREE.Group(); prop.position.set(2.14, 0, 0); g.add(prop);
    const bladeGeo = new THREE.BoxGeometry(0.04, 0.95, 0.14); bladeGeo.translate(0, 0.5, 0);
    for (const s of [0, Math.PI]) { const b = add(bladeGeo, M.log, 0, 0, 0, s, 0.25, 0, prop); b.rotation.order = "XYZ"; }
    const blur = new THREE.Mesh(new THREE.CircleGeometry(0.98, 40), new THREE.MeshBasicMaterial({ color: 0x3a2a1e, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide }));
    blur.position.set(2.17, 0, 0); blur.rotation.y = Math.PI / 2; g.add(blur);
    // cánh: tấm bo tròn đầu mút, cánh trên lệch về trước
    const wingGeo = (() => { const s = new THREE.Shape(); s.moveTo(-0.5, -2.7); s.lineTo(0.35, -2.7); s.quadraticCurveTo(0.55, -2.7, 0.55, -2.45); s.lineTo(0.55, 2.45); s.quadraticCurveTo(0.55, 2.7, 0.35, 2.7); s.lineTo(-0.5, 2.7); s.quadraticCurveTo(-0.62, 2.7, -0.62, 2.5); s.lineTo(-0.62, -2.5); s.quadraticCurveTo(-0.62, -2.7, -0.5, -2.7);
      const geo = new THREE.ExtrudeGeometry(s, { depth: 0.07, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2 }); geo.translate(0, 0, -0.035); geo.rotateX(Math.PI / 2); return geo; })();
    add(wingGeo, red, 0.75, 0.82, 0); add(wingGeo, red, 0.55, -0.34, 0);
    for (const s of [-1, 1]) { add(new THREE.CircleGeometry(0.34, 28), cream, 0.7, 0.87, s * 1.9, -Math.PI / 2); add(new THREE.CircleGeometry(0.2, 28), red, 0.7, 0.875, s * 1.9, -Math.PI / 2); }
    // thanh chống giữa 2 tầng cánh + thanh đỡ cabin + dây giằng chéo
    for (const s of [-1, 1]) for (const dx of [0.25, -0.35]) rod(new THREE.Vector3(0.55 + dx, -0.31, s * 2.1), new THREE.Vector3(0.78 + dx, 0.79, s * 2.1), 0.03, M.log);
    for (const s of [-1, 1]) for (const dx of [0.3, -0.2]) rod(new THREE.Vector3(0.7 + dx, 0.38, s * 0.28), new THREE.Vector3(0.78 + dx, 0.79, s * 0.5), 0.025, M.iron);
    for (const s of [-1, 1]) { rod(new THREE.Vector3(0.55, -0.31, s * 0.4), new THREE.Vector3(0.85, 0.79, s * 2.1), 0.007, M.steel); rod(new THREE.Vector3(0.6, 0.79, s * 0.4), new THREE.Vector3(0.5, -0.31, s * 2.1), 0.007, M.steel); }
    // đuôi: cánh ngang, cánh đứng + bánh lái sọc kem
    add(new THREE.BoxGeometry(0.62, 0.04, 1.7), red, -1.78, 0.04, 0);
    const finS = new THREE.Shape(); finS.moveTo(0, 0); finS.lineTo(0.55, 0); finS.quadraticCurveTo(0.2, 0.75, -0.15, 0.78); finS.lineTo(-0.15, 0); finS.closePath();
    add(new THREE.ExtrudeGeometry(finS, { depth: 0.04, bevelEnabled: false }), red, -2.05, 0.05, -0.02);
    const rudder = add(new THREE.BoxGeometry(0.22, 0.75, 0.035), cream, -2.2, 0.45, 0);
    for (let k = 0; k < 3; k++) add(new THREE.BoxGeometry(0.225, 0.08, 0.04), red, 0, -0.25 + k * 0.25, 0, 0, 0, 0, rudder);
    // càng bánh + bánh + lốp + đuôi trượt
    for (const s of [-1, 1]) {
      rod(new THREE.Vector3(1.0, -0.38, s * 0.3), new THREE.Vector3(0.9, -0.95, s * 0.55), 0.03, M.iron);
      rod(new THREE.Vector3(0.45, -0.38, s * 0.3), new THREE.Vector3(0.9, -0.95, s * 0.55), 0.03, M.iron);
      add(new THREE.TorusGeometry(0.2, 0.07, 10, 24), M.iron, 0.9, -0.95, s * 0.6);
      add(new THREE.CylinderGeometry(0.15, 0.15, 0.06, 20), cream, 0.9, -0.95, s * 0.6, Math.PI / 2);
    }
    rod(new THREE.Vector3(0.9, -0.95, -0.55), new THREE.Vector3(0.9, -0.95, 0.55), 0.025, M.iron);
    rod(new THREE.Vector3(-1.75, -0.14, 0), new THREE.Vector3(-1.95, -0.35, 0), 0.02, M.iron);
    // buồng lái: gờ da, kính chắn gió, phi công (mũ da + kính bay + khăn bay phần phật)
    add(new THREE.TorusGeometry(0.26, 0.05, 8, 20), leather, -0.25, 0.4, 0, Math.PI / 2);
    const ws = add(new THREE.PlaneGeometry(0.34, 0.2), new THREE.MeshPhysicalMaterial({ color: 0xcfe6f0, transparent: true, opacity: 0.35, roughness: 0.05, side: THREE.DoubleSide }), 0.08, 0.52, 0, 0, Math.PI / 2, 0);
    ws.rotation.z = -0.5;
    add(new THREE.SphereGeometry(0.13, 16, 12), new THREE.MeshStandardMaterial({ color: 0xd9a27e, roughness: 0.7 }), -0.25, 0.63, 0);
    add(new THREE.SphereGeometry(0.14, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.6), leather, -0.27, 0.65, 0);
    add(new THREE.TorusGeometry(0.05, 0.018, 6, 12), M.brass, -0.14, 0.66, 0.06, 0, Math.PI / 2); add(new THREE.TorusGeometry(0.05, 0.018, 6, 12), M.brass, -0.14, 0.66, -0.06, 0, Math.PI / 2);
    const scarfGeo = new THREE.PlaneGeometry(0.7, 0.09, 8, 1); scarfGeo.translate(-0.35, 0, 0);
    const scarf = add(scarfGeo, new THREE.MeshStandardMaterial({ color: 0xf6f0e2, roughness: 0.8, side: THREE.DoubleSide }), -0.33, 0.52, 0.02);
    scarf.userData.base = scarfGeo.attributes.position.array.slice();
    // ống xả dọc sườn
    for (const s of [-1, 1]) add(new THREE.CylinderGeometry(0.03, 0.035, 1.1, 8), M.iron, 1.15, -0.18, s * 0.46, 0, 0, Math.PI / 2);
    g.traverse(o => { if (o.isMesh && o !== blur) o.castShadow = true; });
    return { g, prop, blur, scarf, hook: new THREE.Vector3(-2.0, -0.3, 0) };
  }
  function makeBanner(text) {
    const grp = new THREE.Group();
    const geo = new THREE.PlaneGeometry(BAN_W, BAN_H, 56, 8); geo.translate(-BAN_W / 2 - 0.06, 0, 0);
    const tex = tx(bannerTexture(text));
    const cloth = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.3, roughness: 0.75, side: THREE.DoubleSide }));
    cloth.castShadow = true; grp.add(cloth);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, BAN_H + 0.3, 8), M.log); grp.add(pole);
    const weight = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), M.iron); weight.position.y = -BAN_H / 2 - 0.2; grp.add(weight);
    // dây chạc: từ khoen xoay (trước băng LEAD) tới đầu + chân thanh
    const swivel = new THREE.Vector3(LEAD, 0, 0);
    for (const y of [BAN_H / 2 + 0.12, -BAN_H / 2 - 0.12]) {
      const a = new THREE.Vector3(0, y, 0), d = swivel.clone().sub(a);
      const line = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, d.length(), 4), M.rope);
      line.position.copy(a).add(swivel).multiplyScalar(0.5); line.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); grp.add(line);
    }
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.015, 6, 12), M.steel); ring.position.copy(swivel); grp.add(ring);
    return { grp, geo, base: geo.attributes.position.array.slice() };
  }
  function removePlane() {
    const p = S.plane; if (!p) return;
    [p.obj, p.banner.grp, p.rope].forEach(o => { scene.remove(o); disposeTree(o); });
    S.plane = null;
  }
  function flyPlane(text) {
    removePlane();
    const bp = makeBiplane(); weather(bp.g, { bump: 0.02 });
    bp.g.position.set(S.camX - SKY - 16, V.lanes[2] + 1.2, -3);
    scene.add(bp.g);
    const banner = makeBanner(text); scene.add(banner.grp);
    const rope = new THREE.Group(); scene.add(rope);
    const segGeo = new THREE.CylinderGeometry(0.016, 0.016, 1, 5);
    for (let k = 0; k < 10; k++) rope.add(new THREE.Mesh(segGeo, M.rope));
    const hookW = bp.hook.clone(); bp.g.localToWorld(hookW);
    S.plane = { obj: bp.g, bp, banner, rope, t: 0, dir: new THREE.Vector3(-1, -0.08, 0).normalize(), swivel: hookW.clone().add(new THREE.Vector3(-ROPE, -0.3, 0)) };
    updatePlane(0);
    sfx.plane();
  }
  const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
  function updatePlane(dt) {
    const p = S.plane; if (!p) return;
    p.t += dt;
    const g = p.obj, t = p.t;
    g.position.x += 12 * dt;
    const y0 = V.lanes[2] + 1.2, yy = y0 + Math.sin(t * 1.6) * 0.3 + Math.sin(t * 3.7) * 0.06;
    const climb = Math.cos(t * 1.6) * 0.3 * 1.6 / 12;
    g.position.y = yy;
    g.rotation.set(Math.sin(t * 0.9) * 0.07, 0, Math.atan(climb) + Math.sin(t * 5.3) * 0.01);
    p.bp.prop.rotation.x += dt * 55;
    p.bp.blur.material.opacity = 0.13 + Math.sin(t * 40) * 0.03;
    // khăn bay phần phật
    const sg = p.bp.scarf.geometry, sa = sg.attributes.position, sb = p.bp.scarf.userData.base;
    for (let i = 0; i < sa.count; i++) { const x = sb[i * 3], u = -x / 0.7; sa.setXYZ(i, x, sb[i * 3 + 1] + Math.sin(u * 7 - t * 24) * 0.03 * u, Math.sin(u * 5 - t * 19) * 0.06 * u); }
    sa.needsUpdate = true;
    // điểm móc kéo (thế giới) → khoen xoay: dây căng dài ROPE, hướng dây tụt dần theo quán tính + trọng lực + gió
    g.updateMatrixWorld();
    const hook = _v1.copy(p.bp.hook); g.localToWorld(hook);
    const cur = _v2.copy(p.swivel).sub(hook).normalize();
    const want = new THREE.Vector3(-1, -0.1 + Math.sin(t * 2.3) * 0.03, Math.sin(t * 1.3) * 0.04).normalize();
    cur.lerp(want, 1 - Math.exp(-dt * 2.2)).normalize();
    p.swivel.copy(hook).addScaledVector(cur, ROPE);
    // băng: thanh đầu băng nghiêng theo dây, lắc nhẹ quanh trục dây
    const bg = p.banner.grp;
    bg.rotation.set(Math.sin(t * 2.1) * 0.05, Math.sin(t * 1.3) * 0.05, Math.atan2(-cur.y, -cur.x) * 0.8);
    bg.updateMatrix();
    const lead = new THREE.Vector3(LEAD, 0, 0).applyEuler(bg.rotation);
    bg.position.copy(p.swivel).sub(lead);
    // dây kéo chính: đường cong võng nhẹ, vẽ lại từ đúng 2 điểm nối
    const segs = p.rope.children, n = segs.length, sag = 0.16;
    for (let k = 0; k < n; k++) {
      const a = new THREE.Vector3().lerpVectors(hook, p.swivel, k / n), b = new THREE.Vector3().lerpVectors(hook, p.swivel, (k + 1) / n);
      a.y -= Math.sin(Math.PI * k / n) * sag; b.y -= Math.sin(Math.PI * (k + 1) / n) * sag;
      const d = b.clone().sub(a), m = segs[k];
      m.position.copy(a).add(b).multiplyScalar(0.5); m.scale.set(1, d.length(), 1); m.quaternion.setFromUnitVectors(_up, d.normalize());
    }
    // vải phần phật: sóng chạy từ thanh đầu băng ra đuôi, đuôi quật mạnh + rung gấp
    const ga = p.banner.geo.attributes.position, gb = p.banner.base;
    for (let i = 0; i < ga.count; i++) {
      const x = gb[i * 3], y = gb[i * 3 + 1], u = Math.min(1, -x / BAN_W), v = y / BAN_H;
      const amp = 0.05 + 0.34 * Math.pow(u, 1.4);
      let z = Math.sin(u * 9.5 - t * 12.5 + v * 0.9) * amp + Math.sin(u * 19 - t * 23 + v * 2.3) * amp * 0.3;
      if (u > 0.82) z += Math.sin(t * 41 + v * 6) * (u - 0.82) * 0.5;
      const ph = u * 9.5 - t * 12.5 + v * 0.9;
      // mép trên/dưới gợn sóng theo nếp vải + băng co lại ở chỗ vải xoắn (nhìn ngang vẫn thấy phần phật)
      ga.setXYZ(i, x * (1 - 0.03 * Math.abs(Math.sin(ph))), y - u * u * 0.16 + Math.sin(t * 3 + u * 4) * 0.05 * u + Math.cos(ph) * amp * 0.28 * (0.35 + Math.abs(v)), z);
    }
    ga.needsUpdate = true; p.banner.geo.computeVertexNormals();
    if (bg.position.x - BAN_W - 1 > S.camX + SKY + 4) removePlane();
  }

  // ------------------------------------------------------------------ nhịp ván
  function clearSky() {
    S.blimps.slice().forEach(removeBlimp);
    S.crates.forEach(removeCrate); S.crates = [];
  }
  function startGame() {
    sfx.unlock(); sfx.amb(true); S.finalMus = false;
    if (!ovStart.hidden) { const gh = ovStart.cloneNode(true); gh.classList.add("is-leaving"); stage.append(gh); setTimeout(() => gh.remove(), 1100); }   // 1r: TRAIN RUSH + START mờ dần
    clearSky();
    removePlane();
    { const seen = new Set(), uniq = words.filter(w => { const k = norm(w.keyword); if (seen.has(k)) return false; seen.add(k); return true; });
      S.bag = order ? order.slice().reverse() : opt.shuffle ? shuffleR(uniq, seed != null ? mulberry(seed + 7919 * (S.round = (S.round || 0) + 1)) : Math.random) : uniq.reverse(); S.total = uniq.length; }
    S.levels = []; S.score = 0; S.teams = [0, 0]; S.nextDir = 1; S.x2 = 0; S.timeLeft = opt.timer; S.timeCap = opt.timer; S.elapsed = 0; S.level = 0; S.lastTick = 99;
    clockEl.classList.remove("is-x2");
    clockEl.classList.remove("is-warn");
    [ovStart, ovEnd, ovPause, ovAns].forEach(o => o.hidden = true);
    S.paused = false;
    if (cine.active) cine.finish();
    stage.querySelector(".bp-top").style.visibility = "";
    beginLevel(0);
    if (INTRO_ID && S.state === "intro" && !embed) startCine();
    else { camera.fov = V.fov; camera.updateProjectionMatrix(); }
    if (!embed) sfx.music(cine.active ? "intro" : "play");   // 1ah: nhạc giao hưởng (trang Fight tự điều khiển nhạc)
    updateHud();
  }
  // 1p: intro điện ảnh — tàu chạy ĐỀU đúng tốc độ vào ga (introV0) suốt cảnh, tới đúng điểm bắt đầu vào ga lúc cảnh kết;
  // tâm màn chơi dời lên phía trước tương ứng ⇒ lúc máy quay trôi về góc chơi thì mọi thứ khớp liền mạch.
  function startCine() {
    const k = INTRO_ID, Tc = INTROS[k].dur, V0 = S.introV0, old = S.camX;
    const shift = (old - 50 + V0 * Tc) - S.introFrom;
    S.camX += shift; S.camTarget += shift; S.introFrom += shift; S.introTo += shift;
    S.cineC = S.camX; S.cineV0 = V0; S.cineFocus = old; S.camV = 0; S.state = "cine";
    const head = t => S.introFrom - V0 * (Tc - t);
    S.trainX = head(0); placeTrain();
    let sag = null, best = 1e9; const tmp = new THREE.Vector3();
    scene.traverse(o => { if (!o.userData || !o.userData.saguaro) return; o.getWorldPosition(tmp); if (tmp.z > -18 || tmp.z < -50) return;
      const d = Math.abs(tmp.x - (head(INTROS[k].lead || 0) + 80)); if (d < best && d < 70) { best = d; o.geometry.computeBoundingBox(); sag = { x: tmp.x, z: tmp.z, h: o.geometry.boundingBox.max.y * o.scale.y }; } });
    // 1aa: 2 bảng màn chờ còn đứng tới lúc intro cắt khỏi khung màn chờ (hết lead) rồi mới đổi thành ANDREW CLASSES chỗ ván bắt đầu
    S.signSwap = !!INTROS[k].lead;
    if (!S.signSwap) world.signs.swapAhead(S.cineC + 10);
    const sg = world.signs.current();
    S.camX = old;
    const cd = new THREE.Vector3(); camera.getWorldDirection(cd); const cp = camera.position;
    const idle = { p: [cp.x, cp.y, cp.z], l: [cp.x + cd.x * 300, cp.y + cd.y * 300, cp.z + cd.z * 300], fov: camera.fov };   // 1r: khung màn chờ lúc bấm START
    cine.begin(k, { idle, C: S.cineC, V, head, len: S.trainLen, sway: () => [Math.sin(S.time * 0.11) * 0.18, Math.sin(S.time * 0.17) * 0.07, Math.sin(S.time * 0.09) * 0.1], saguaro: sag, sign: sg ? { x: sg.position.x } : null });
    signEl.classList.remove("is-in");
    stage.querySelector(".bp-top").style.visibility = "hidden";
  }
  function endCine() {
    if (!embed) sfx.music("play", 2.5);   // 1ah: hết phim ⇒ nhạc trận (nhỏ dưới hiệu ứng)
    if (S.signSwap) { world.signs.swapAhead(S.cineC + 10); S.signSwap = false; }   // 1aa: bỏ qua intro trước lúc cắt cảnh
    world.signs.commitAhead();   // 1u: bảng ANDREW CLASSES dựng sẵn thành bảng chính của ván; bỏ 2 bảng màn chờ (đã ở xa phía sau)
    S.state = "intro"; S.introT = 0; S.camX = S.cineC; S.camTarget = S.cineC; S.camV = 0; S.trainX = S.introFrom; placeTrain();
    stage.querySelector(".bp-top").style.visibility = "";
    signEl.classList.remove("is-in"); void signEl.offsetWidth; signEl.classList.add("is-in");
  }
  function beginLevel(i) {
    S.level = i;
    const cap = opt.levels >= 21 ? Infinity : opt.levels;   // Max cars: 3–20, nấc cuối = ∞
    const items = nextLevelItems(Math.min(i + 1, cap));
    if (!items.length) { endGame("done"); return; }         // hết từ ⇒ xong ván
    buildTrain(items, i);
    S.levels[i] = S.carts;
    S.deck = [];
    // tàu chạy nhanh vào tới vị trí rồi mới tính giờ
    S.trainX = S.camX - HALF - 1;
    S.introFrom = S.trainX;
    S.introTo = S.camX - frameRel(S.carts[0]);   // 1af: tàu dừng đúng khung (toa cuối sát mép / toa chờ giữa màn / đầu máy trọn)
    S.introDur = 3.4; S.introVc = cruiseV(); S.camIdx = null;
    S.introV0 = Math.max(S.introVc, 2 * (S.introTo - S.introFrom) / S.introDur - S.introVc);   // vận tốc giảm đều từ V0 về đúng tốc độ chạy
    S.camTarget = S.camX;
    S.introT = 0;
    S.trainV = 0;
    placeTrain();
    S.state = "intro";
    signEl.textContent = "Level " + (i + 1);
    signEl.classList.remove("is-in"); void signEl.offsetWidth; signEl.classList.add("is-in");
    sfx.whistle();
    updateHud();
  }
  // tàu thật: lúc nhanh lúc chậm nhẹ (2 sóng chậm chồng nhau)
  // 1ab: nấc 1 giữ nguyên, nấc 10 nhanh GẤP ĐÔI 1aa, các nấc giữa chia đều (tàu 1,35 → 9,0 · khinh khí cầu 0,85 → 6,2)
  const speedStep = (s, v1, v10) => v1 + (v10 - v1) * (s - 1) / 9;
  function cruiseV() { return speedStep(opt.trainSpeed, 1.35, 9.0) * (1 + 0.04 * (S.carts.length - 1)) * (1 + 0.11 * Math.sin(S.time * 0.21) + 0.05 * Math.sin(S.time * 0.57 + 1.3)); }
  function blimpV() { return speedStep(opt.balloonSpeed, 0.85, 6.2) * 1.1 * (1 + 0.06 * (S.level || 0)); }   // 1af: +10 %, mỗi màn +6 % (tàu chỉ +4 %/toa)

  function levelClear() {
    S.state = "clear"; S.clearT = 0;
    const bonus = opt.timerMode === "down" ? Math.ceil(S.timeLeft) : 0;
    S.score += bonus;
    S.timeLeft += 5;
    flashClock("+5s");
    S.blimps.forEach(b => { b.leaving = true; b.vy = 0; });
    sfx.levelUp(); setTimeout(() => sfx.whistle(), 350);
    flyPlane(share ? S.teams[0] + " : " + S.teams[1] : "Score " + S.score);
    updateHud();
  }
  function endGame(why) {   // why: "time" hết giờ · "done" hết từ · "ended" thầy bấm End game
    if (S.state === "over") return;
    if (cine.active) { cine.finish(); if (S.signSwap) { world.signs.swapAhead(S.cineC + 10); S.signSwap = false; } world.signs.commitAhead(); S.camX = S.cineC; S.camTarget = S.cineC; S.camV = 0; stage.querySelector(".bp-top").style.visibility = ""; }
    const wasState = S.state;
    S.state = "over";
    if (embed) { S.blimps.forEach(b => { b.frozen = true; }); onEvent("end", why); return; }   // 1ac: trang Fight tự báo kết quả 2 đội
    if (why === "done") sfx.win(); else sfx.timesUp();
    S.blimps.forEach(b => { b.frozen = true; });
    setTimeout(() => {
      $(".bp-end-title").textContent = why === "done" ? "ALL WORDS DONE!" : why === "time" ? "TIME'S UP!" : "GAME OVER";
      $(".bp-end-score").textContent = S.score;
      const done = S.levels.flat().filter(c => c.filled).length, e = Math.floor(S.elapsed || 0);
      $(".bp-end-time").textContent = Math.floor(e / 60) + ":" + String(e % 60).padStart(2, "0");
      $(".bp-end-match").textContent = done + " / " + (S.total || done);
      $(".bp-end-trains").textContent = S.levels.length - (wasState === "intro" ? 1 : 0) || 1;
      $(".bp-show").hidden = !(opt.showAnswers || why === "ended");
      ovEnd.hidden = false;
    }, why === "ended" ? 150 : 900);
  }
  function showAnswers() {
    const rows = S.levels.map((lv, i) => lv.map(c => `<div class="bp-ans-row ${c.filled ? "ok" : "no"}"><span class="bp-ans-lv">L${i + 1}</span><span class="bp-ans-key">${esc(c.item.keyword)}</span><span class="bp-ans-def">${esc(c.item.definition)}</span><span class="bp-ans-mk">${c.filled ? "✓" : "✗"}</span></div>`).join("")).join("");
    $(".bp-ans-list").innerHTML = rows;
    ovEnd.hidden = true; ovAns.hidden = false;
  }

  // ------------------------------------------------------------------ vòng lặp
  function update(dt) {
    S.time += dt;
    const st = S.state;
    const tx0 = S.train ? S.train.position.x : 0;
    // tàu
    if (S.train) {
      let v = 0;
      if (st === "cine") {
        const nx = S.introFrom - S.cineV0 * (INTROS[INTRO_ID].dur - cine.t);
        v = S.cineV0; S.trainX = nx;
      } else if (st === "intro") {
        S.introT += dt;
        const T = S.introDur, tt = Math.min(T, S.introT), k = tt / T;
        const nx = S.introFrom + S.introV0 * tt + (S.introVc - S.introV0) * tt * tt / (2 * T);
        v = (nx - S.trainX) / Math.max(dt, 1e-4); S.trainX = nx;
        // 2 khinh khí cầu đầu màn cùng bay vào từ ngoài mép phải, cách nhau đều (quả sau không đuổi kịp quả trước)
        if (k >= 1) { S.state = "play"; S.entry = 2; const x0 = Math.max(S.camX, S.camTarget) + SKY + 7; if (share) { spawnBlimp(); spawnBlimp(); } else { spawnBlimp(x0); spawnBlimp(x0 + 9.5); } S.spawnT = 6.5 / (blimpV() + 1); }
      } else if (st === "play" || st === "over") {
        v = st === "play" ? cruiseV() : 0;
        S.trainX += v * dt;
      } else if (st === "clear") {
        S.clearT += dt;
        S.trainV = Math.min(26, (S.trainV || cruiseV()) + dt * 6);   // tăng tốc êm hơn để thùng trên nóc không trượt văng
        v = S.trainV; S.trainX += v * dt;
        if (S.trainX - S.trainLen > S.camX + HALF + 2 && S.clearT > 3.2) {
          beginLevel(S.level + 1);
        }
      }
      if (st !== "clear") S.trainV = v;
      placeTrain();
      S.trainVel = dt > 0 ? (S.train.position.x - tx0) / dt : v;
      const dx = v * dt;
      for (const w of S.wheels) w.rotation.y -= dx / (w.userData.wheelR * TS);
      S.wheelA -= dx / (0.82 * TS);
      for (const r of S.rods) { const u = r.userData.rod, a = S.wheelA + u.ph; r.position.x = u.x0 + Math.cos(a) * u.r; r.position.y = u.y0 + Math.sin(a) * u.r * (u.tilt ? 0.5 : 1); if (u.tilt) r.rotation.z = Math.sin(a) * 0.12; }
      if (v > 0.05) {
        S.smokeT = (S.smokeT || 0) - dt;
        if (S.smokeT <= 0) { smokePuff(); S.smokeT = Math.max(0.07, 0.26 - v * 0.02); }
        sfx.train(v);   // 1ah: tiếng tàu hơi nước THẬT lặp liên tục, nhịp theo tốc độ (dừng hẳn ⇒ xì hơi)
      }
    }
    // đồng hồ
    if (st === "play" || st === "intro" || st === "clear") S.elapsed += dt;
    if (st === "play" && opt.timerMode === "down") {
      S.timeLeft -= dt;
      const s = Math.ceil(S.timeLeft);
      if (s <= 10 && s < S.lastTick && s > 0) { sfx.tick(); S.lastTick = s; clockEl.classList.add("is-warn"); }
      if (s <= 30 && !S.finalMus && S.timeCap > 40) { S.finalMus = true; sfx.music("final", 2); }   // 1ah: 30 giây cuối nhạc dồn dập
      if (s > 10) { clockEl.classList.remove("is-warn"); S.lastTick = 99; }
      if (S.timeLeft <= 0) { S.timeLeft = 0; endGame("time"); }
    }
    // khinh khí cầu
    const bv = blimpV();
    if (st !== "cine") updateCamera(dt);
    if (st === "play") {   // 1q: màn chờ không thả khinh khí cầu (máy quay trên cao)
      S.spawnT -= dt;
      const live = S.blimps.filter(b => !b.leaving).length;
      // khoảng cách giữa 2 khinh khí cầu tính theo tốc độ trôi TRÊN MÀN (bóng trôi + máy quay lia)
      const rel = bv;   // 1j: khinh khí cầu trôi đều TRÊN MÀN
      if (S.spawnT <= 0 && live < MAX_BLIMPS + (S.camV > 0.5 ? 1 : 0)) { if (spawnBlimp(undefined, st === "attract")) S.spawnT = (st === "attract" ? 11 : 6.5) / rel; else S.spawnT = 0.25; }
    }
    for (const b of S.blimps.slice()) {
      if (b.frozen) { if (b.body) b.body.velocity.set(0, 0, 0); continue; }
      if (b.leaving) { b.vy += dt * 9; b.baseY += b.vy * dt; if (b.baseY > 30) { removeBlimp(b); continue; } }
      else { b.x -= ((b.dir || 1) * (bv + b.boost) - S.camV) * dt; b.boost *= Math.exp(-dt * 0.55); }   // 1j: tốc độ trên màn không đổi khi máy quay lia/dừng
      b.y = b.baseY + Math.sin(S.time * 1.3 + b.phase) * 0.22;
      b.obj.position.set(b.x, b.y, 0);
      b.bump *= Math.exp(-dt * 2.5);   // vừa húc phải chồng thùng: khinh khí cầu chòng chành
      b.obj.rotation.z = Math.sin(S.time * 0.9 + b.phase) * 0.04 + Math.sin(S.time * 9) * 0.12 * b.bump;
      b.obj.rotation.x = Math.sin(S.time * 7 + 1) * 0.1 * b.bump;
      if (b.body && dt > 0) { const bp = b.body.position; b.body.velocity.set((b.x - bp.x) / dt, (b.y - bp.y) / dt, 0); }
      if (b.dir === -1) {   // 1ac: thân quay ngược ⇒ bảng chữ vẫn nhìn thẳng máy quay, vẫn ở phía trước thân
        const qi = b.obj.quaternion.clone().invert();
        b.obj.userData.banner.quaternion.copy(qi).multiply(camera.quaternion);
        b.obj.userData.banner.position.set(0, 0, 1.32).applyQuaternion(qi);
      } else {
        b.obj.userData.banner.quaternion.copy(camera.quaternion);
        b.obj.userData.banner.position.set(0, 0, 1.32);
      }
      if (b.obj.userData.props) for (const pr of b.obj.userData.props) pr.rotation.x += dt * 30;
      if (b.guide) { b.guide.position.x = b.x; b.guide.visible = !b.leaving; }
      if ((b.dir !== -1 && b.x < S.camX - SKY - 8) || (b.dir === -1 && b.x > S.camX + SKY + 8)) removeBlimp(b);
    }
    stepPhysics(dt, tx0);
    updateCrates(dt);
    updateFx(dt);
    updatePlane(dt);
    // đám mây trôi
    for (const co of S.coaches) {
      if (co.startleT != null) { co.startleT += dt; if (co.startleT > 5.2) co.startleT = null; }
      if (co.chaosT != null) { co.chaosT += dt; if (co.chaosT > 7) co.chaosT = null; }
      if (Math.abs(S.train.position.x + co.localX * TS - S.camX) < 24) animatePassengers(co.people, S.time, co.startleT, co.chaosT, dt);
    }
    // 1aa: khúc cảnh (cỏ, cây, đá, ray) phủ quanh chỗ MÁY QUAY THẬT đang nhìn (intro/màn chờ nhìn xa, nhìn ngược), không chỉ quanh S.camX
    camera.getWorldDirection(viewDir);
    world.update(dt, S.time, S.camX, S.trainX, camera.position.x + viewDir.x * 80, S.state === "play" || S.state === "intro");
    if (mirror) for (const b of [world.signs.current(), world.signs.extra]) if (b && b.userData.letters) b.userData.letters.scale.x = -1;   // 1ad: chữ đồi đọc xuôi
    S.shake *= Math.exp(-dt * 7);
    const sh = S.shake, jx = (Math.random() - 0.5) * sh, jy = (Math.random() - 0.5) * sh;
    camera.position.set(S.camX + V.cam[0] + Math.sin(S.time * 0.11) * 0.18 + jx, V.cam[1] + Math.sin(S.time * 0.17) * 0.07 + jy, V.cam[2]);
    camera.lookAt(S.camX + V.look[0] + Math.sin(S.time * 0.09) * 0.1 + jx * 0.5, V.look[1] + jy * 0.5, V.look[2]);
    if (S.state === "attract") {   // 1q: màn chờ — máy quay rất cao, trôi chậm ngắm toàn cảnh miền Tây (không thấy đường ray)
      world.signs.showBoth();
      const sg = world.signs.current(), ex = world.signs.extra;   // canh giữa 2 bảng chữ
      if (sg && ex) S.idleX = (sg.position.x + ex.position.x) / 2; else if (S.idleX == null) S.idleX = S.camX;
      const t = S.time, cx = S.idleX + Math.sin(t * 0.035) * 14;
      camera.position.set(cx, 58 + Math.sin(t * 0.06) * 2.5, 92);   /* 1u: lùi xa hơn — 2 dãy núi tách xa */
      camera.lookAt(cx + Math.sin(t * 0.035 + 0.9) * 10, 16 + Math.sin(t * 0.05) * 1.5, -300);
      if (camera.fov !== 40) { camera.fov = 40; camera.updateProjectionMatrix(); }
    }
    topEl.style.visibility = S.state === "attract" || S.state === "cine" || S.state === "fcine" ? "hidden" : "";
    if (S.state === "cine") {   // 1p: đạo diễn intro cầm máy quay
      const done = cine.update(dt);
      if (S.signSwap && cine.t >= INTROS[INTRO_ID].lead) { world.signs.swapAhead(S.cineC + 10); S.signSwap = false; }   // cùng khung hình với cú cắt cảnh
      S.cineFocus = Math.max(S.cineFocus, Math.min(camera.position.x, S.cineC)); S.camX = S.cineFocus;
      if (done) endCine();
    }
    if (S.state === "fcine") FC.update(dt);   // 1ae: intro Fight cầm máy quay
    grade.uniforms.time.value = S.time;
    updateHud();
  }

  // Máy quay: đứng yên tới khi mũi đầu máy chạm 75% bề ngang màn, rồi LIA THEO tàu liên tục (không bao giờ lùi).
  // Tàu dài hơn màn: ưu tiên giữ toa CHƯA đầy ngoài cùng bên trái ở ~25% màn để học sinh luôn thấy toa cần thả.
  // 1e (thầy): toa CHƯA có đáp án đầu tiên đi tới giữa màn thì máy quay lia theo, giữ nó TỐI ĐA ở chính giữa;
  // toa đáp án sau (cách 2 toa phụ) còn ở ngoài mép trái cho tới khi toa này được thả đúng.
  // 1af (thầy): vị trí máy quay mong muốn, tính TƯƠNG ĐỐI với mũi đầu máy (S.trainX) cho toa đang chờ `cur`:
  //   1. toa chờ ưu tiên ở GIỮA màn;
  //   2. nhưng đầu máy phải thấy TRỌN (máy quay dịch sang phải) — miễn toa chờ vẫn còn trọn trong khung;
  //   3. toa CUỐI tối đa chỉ tới sát mép trái — không để khoảng đất trống sau đuôi tàu (tàu ngắn thì cả đoàn nằm gọn, đuôi sát mép).
  // (Bàn soi gương chỉ lật hình ⇒ cùng một phép tính.)
  function frameRel(cur) {
    const rc = (cur.localX - ENGINE_LEN / 2) * TS, hw = CART_W * TS / 2;
    const engineNeed = 1.0 - HALF;                 // mũi + gạt trâu cách mép phải ≥ 0,35
    const cartKeep = rc + HALF - hw - 0.4;         // dịch phải tối đa mà toa chờ vẫn trọn trong khung
    const tailNeed = HALF - S.trainLen;            // mép trái không vượt quá đuôi tàu
    return Math.max(rc, Math.min(engineNeed, cartKeep), tailNeed);
  }
  function updateCamera(dt) {
    let tv = 0;   // vận tốc của đích (toa đang chờ chạy theo tàu)
    if (S.train && S.state === "play") {
      const cur = S.carts.find(c => !c.filled);
      if (cur) {
        // đích chưa tới (toa chờ mới còn ở phía sau): máy quay ĐỨNG CHỜ tàu chạy tới; tới rồi thì bám theo.
        // Chỉ khi một toa TRƯỚC bị mở lại (thùng đúng rơi mất) mới lia ngược về.
        const want = S.trainX + frameRel(cur), idx = S.carts.indexOf(cur);
        if (S.camIdx != null && idx < S.camIdx) S.camTarget = want;
        S.camIdx = idx;
        if (want >= S.camTarget - 0.01) { S.camTarget = want; tv = S.trainVel; }
      }
    }
    // 1h: lò xo giảm chấn tới hạn — lia tới toa mới thì tăng tốc từ từ rồi hãm từ từ, không bao giờ giật hay vọt quá
    const K = 2.2, a = K * K * (S.camTarget - S.camX) + 2 * K * (tv - S.camV);
    S.camV += a * dt; S.camX += S.camV * dt;
  }
  function updateHud() {
    const tm = opt.timerMode, t = tm === "up" ? Math.floor(S.elapsed || 0) : Math.max(0, Math.ceil(S.timeLeft));
    clockEl.textContent = Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0");
    clockEl.hidden = tm !== "down"; progEl.parentElement.hidden = tm !== "down";
    const up = mount.querySelector(".bp-uptime"); up.hidden = tm !== "up"; const e = Math.floor(S.elapsed || 0); up.lastChild.textContent = Math.floor(e / 60) + ":" + String(e % 60).padStart(2, "0");
    scoreEl.textContent = S.score;
    if (embed) onEvent("hud", { score: S.score, teams: S.teams, level: S.level, state: S.state });
    const lv = S.carts.length ? S.carts.filter(c => c.filled).length / S.carts.length : 0;
    // 1h: thanh THỜI GIAN — vơi dần theo giờ còn lại (cộng giờ thì dài ra); ≤ 10 giây chuyển đỏ
    S.timeCap = Math.max(S.timeCap || opt.timer, S.timeLeft);
    const p = S.state === "attract" ? 1 : Math.max(0, S.timeLeft) / S.timeCap;
    progEl.style.width = (p * 100).toFixed(2) + "%";
    progEl.parentElement.classList.toggle("is-warn", S.state !== "attract" && S.timeLeft <= 10);
  }
  function flashClock(txt) {
    const f = document.createElement("div"); f.className = "bp-clock-plus"; f.textContent = txt;
    stage.querySelector(".bp-top").append(f); setTimeout(() => f.remove(), 1200);
  }

  let last = 0, raf = 0, manual = false;
  function frame(ts) {
    if (dead) return;   // 1aj
    raf = requestAnimationFrame(frame);
    if (manual) return;
    const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0; last = ts;
    if (!S.paused) update(dt);
    composer.render(dt);
  }
  raf = requestAnimationFrame(frame);

  // ------------------------------------------------------------------ nút giao diện
  const press = (sel, fn) => mount.querySelector(sel).addEventListener("click", e => { e.stopPropagation(); fn(); });
  press(".bp-start", startGame);
  press(".bp-again", startGame);
  press(".bp-again2", startGame);
  press(".bp-again3", startGame);
  press(".bp-show", showAnswers);
  press(".bp-ans-back", () => { ovAns.hidden = true; ovEnd.hidden = false; });
  press(".bp-menu", () => { if (S.state === "attract" || S.state === "over") return; S.paused = true; ovPause.hidden = false; });
  press(".bp-resume", () => { S.paused = false; ovPause.hidden = true; last = 0; });
  press(".bp-endgame", () => { ovPause.hidden = true; S.paused = false; last = 0; endGame("ended"); });
  press(".bp-sound", () => { sfx.setMuted(!sfx.muted); mount.querySelector(".bp-sound").classList.toggle("is-off", sfx.muted); });
  const onEsc = e => { if (e.key === "Escape" && S.state === "play") mount.querySelector(".bp-menu").click(); };   // 1aj: có tên ⇒ destroy() gỡ được
  if (!embed) document.addEventListener("keydown", onEsc);
  // 1h: bảng nổi cho 4 nút hệ AWord — mở giữa ván thì tạm dừng, đóng thì chơi tiếp
  const ovPanel = $(".bp-ov-panel"), pnT = $(".bp-pn-t"), pnB = $(".bp-pn-b"), optsEl = $(".bp-opts"), optsHome = optsEl.parentNode;
  let panelPaused = false;
  function openPanel(kind) {
    if (!ovPanel.hidden) closePanel();
    if ((S.state === "play" || S.state === "intro" || S.state === "clear") && !S.paused) { S.paused = true; panelPaused = true; }
    pnB.innerHTML = ""; ovPanel.dataset.kind = kind;
    ovPanel.querySelector(".bp-pn").classList.toggle("is-aw", kind === "options");
    if (kind === "options") { pnT.textContent = ""; buildAwOptions(pnB); }
    else if (kind === "folder") {
      pnT.textContent = "Switch activity";
      pnB.innerHTML = `<div class="bp-pn-list">${["LSA2 S4 T4 — Words", "LSA2 S4 T3 — Words", "LSA2 S4 T2 — Words", "Wild West animals"].map((t, i) =>
        `<button class="bp-pn-row${i === 0 ? " is-on" : ""}">${ICON.folder}<span>${t}</span></button>`).join("")}</div><p class="bp-pn-note">Sample list — in AWord this shows the activities in the same folder.</p>`;
    } else if (kind === "ipad") {
      pnT.textContent = "iPad";
      pnB.innerHTML = `<div class="bp-pn-ipad">${ICON.ipad}<p>Reserved — the teacher will assign this button later.</p></div>`;
    } else if (kind === "mode") {
      pnT.textContent = "Mode";
      pnB.innerHTML = `<div class="bp-pn-modes"><button class="bp-pn-mode is-on">${ICON.mode}<span>Single</span></button><button class="bp-pn-mode bp-pn-fight">${ICON.fight}<span>Fight</span><small>2 teams</small></button></div>`;
      // 1ai: Fight mở được — trang chủ quản (mau-1ai) nghe onEvent("mode", "fight") và chuyển sang 2 bàn trái–phải
      pnB.querySelector(".bp-pn-fight").addEventListener("click", () => { closePanel(); onEvent("mode", "fight"); });
      pnB.querySelector(".bp-pn-mode.is-on").addEventListener("click", () => closePanel());
    }
    ovPanel.hidden = false;
  }
  function closePanel() {

    ovPanel.hidden = true; ovPanel.dataset.kind = "";
    if (panelPaused) { panelPaused = false; S.paused = false; last = 0; }
  }
  // 1i: bảng Options theo đúng bố cục AWord (core/options-panel.js): hàng Timer (None / Count up / Count down + ô giờ) ·
  // lưới 2 cột (ô số bên trái, thanh trượt bên phải) · khối ô tích · nút trò chơi + Apply (chỉ sáng khi có thay đổi).
  // Apply ⇒ lưu lựa chọn và về màn bắt đầu (như AWord chơi lại act).
  const AW_BALLOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5a6 6 0 0 0-6 6c0 3.7 3 6.8 6 7.2 3-.4 6-3.5 6-7.2a6 6 0 0 0-6-6z"/><path d="M11 17.6h2l-1-1.9zM12 17.6c.6 1.2-.8 2.2 0 3.9"/></svg>';
  function buildAwOptions(host) {
    const d = { ...opt };
    const slider = (k, label, sub, min, max, off) => `<div class="aw-o-cell"><div class="aw-o-lab">${label}${sub ? ` <small>${sub}</small>` : ""}</div>
      <div class="aw-o-sl${off ? " is-offable" : ""}"><input type="range" min="${min}" max="${max}" step="1" data-s="${k}"><b></b></div></div>`;
    host.innerHTML = `<div class="aw-o">
      <div class="aw-o-timer"><div class="aw-o-seg">${[["none", "None"], ["up", "Count up"], ["down", "Count down"]].map(([k, l]) => `<button data-tm="${k}">${l}</button>`).join("")}</div>
        <div class="aw-o-tstep"><button data-ts="-1">−</button><div class="aw-o-tmid"><div class="aw-o-zone" data-z="m" title="Tap or swipe up: +1 min · swipe down: −1 min"><span>02</span></div><i>:</i><div class="aw-o-zone" data-z="s" title="Tap or swipe up: +10 s · swipe down: −10 s"><span>00</span></div></div><button data-ts="1">+</button></div></div>
      <div class="aw-o-dash"></div>
      <div class="aw-o-grid">
        <div class="aw-o-col">${slider("levels", "MAX CARS", "per train", 3, 21)}${slider("pointsOff", "POINTS OFF", "wrong answer", 0, 10, true)}</div>
        <div class="aw-o-col">${slider("balloonSpeed", "BALLOON SPEED", "", 1, 10)}${slider("trainSpeed", "TRAIN SPEED", "", 1, 10)}</div>
      </div>
      <div class="aw-o-sep"></div>
      <div class="aw-o-checks">${[["shuffle", "Shuffle questions"], ["showAnswers", "Show answers at end"], ["bonusTime", "Bonus: extra time"], ["bonusPoints", "Bonus: points"], ["bonusX2", "Bonus: x2 score"]].map(([k, l]) =>
        `<label class="aw-o-chk${k.startsWith("bonus") ? " is-green" : ""}"><input type="checkbox" data-c="${k}"><i></i><span>${l}</span></label>`).join("")}</div>
      <div class="aw-o-foot"><button class="aw-o-tpl" title="In AWord this switches the game template">${AW_BALLOON}<span>Balloon pop</span></button><button class="aw-o-apply">Apply</button></div>
    </div>`;
    const q = sel => host.querySelector(sel), qa = sel => host.querySelectorAll(sel);
    const mmss = v => String(Math.floor(v / 60)).padStart(2, "0") + " : " + String(v % 60).padStart(2, "0");
    function paint() {
      qa("[data-tm]").forEach(b => b.classList.toggle("is-on", b.dataset.tm === d.timerMode));
      q(".aw-o-tstep").classList.toggle("is-dis", d.timerMode !== "down");
      qa("[data-s]").forEach(inp => {
        const k = inp.dataset.s, v = d[k]; inp.value = v;
        const p = (v - inp.min) / (inp.max - inp.min) * 100; inp.style.setProperty("--p", p + "%");
        const off = inp.parentElement.classList.contains("is-offable") && v === 0;
        inp.parentElement.classList.toggle("is-off", off); inp.nextElementSibling.textContent = off ? "OFF" : k === "levels" && v >= 21 ? "∞" : v;
      });
      qa("[data-c]").forEach(c => { c.checked = !!d[c.dataset.c]; });
      q(".aw-o-apply").disabled = Object.keys(d).every(k => d[k] === opt[k]);
    }
    host.onclick = e => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.tm) d.timerMode = b.dataset.tm;
      else if (b.dataset.ts && d.timerMode === "down") { setTime(d.timer + +b.dataset.ts); return; }
      else if (b.classList.contains("aw-o-apply")) { Object.assign(opt, d); closePanel(); toStart(); return; }
      paint();
    };
    // ô giờ kiểu AWord: chạm / vuốt lên số phút = +1 phút, vuốt xuống = −1 phút; số giây: lên +10, xuống −10 (bám mốc :10);
    // − / + hai bên: ±1 giây (giữ để chạy nhanh). Số cũ trượt ra, số mới trượt vào theo hướng đổi.
    const zm = q('[data-z="m"]'), zs = q('[data-z="s"]');
    const two = v => String(v).padStart(2, "0");
    zm.firstChild.textContent = two(Math.floor(d.timer / 60)); zs.firstChild.textContent = two(d.timer % 60);
    function slide(zone, text, dir) {
      const old = zone.lastChild; if (old.textContent === text) return;
      const nw = document.createElement("span"); nw.textContent = text; zone.append(nw);
      const ms = 180, ez = "cubic-bezier(.22,.9,.3,1)";
      old.animate([{ transform: "translateY(0)" }, { transform: `translateY(${dir > 0 ? -100 : 100}%)` }], { duration: ms, easing: ez, fill: "forwards" });
      nw.animate([{ transform: `translateY(${dir > 0 ? 100 : -100}%)` }, { transform: "translateY(0)" }], { duration: ms, easing: ez, fill: "forwards" });
      setTimeout(() => { zone.querySelectorAll("span").forEach(sp => { if (sp !== nw) sp.remove(); }); }, ms + 60);
    }
    function setTime(v) {
      v = Math.max(10, Math.min(3599, Math.round(v))); if (v === d.timer) return;
      const dir = v > d.timer ? 1 : -1; d.timer = v;
      slide(zm, two(Math.floor(v / 60)), dir); slide(zs, two(v % 60), dir); paint();
    }
    for (const z of [zm, zs]) {
      let y0 = null;
      z.addEventListener("pointerdown", e => { if (d.timerMode !== "down") return; y0 = e.clientY; z.setPointerCapture(e.pointerId); });
      z.addEventListener("pointerup", e => {
        if (y0 == null) return; const dy = e.clientY - y0; y0 = null;
        const down = dy > 10;   // vuốt xuống quá 10px mới là "giảm"; còn lại (chạm / vuốt lên) là "tăng"
        if (z.dataset.z === "m") setTime(d.timer + (down ? -60 : 60));
        else { const s = d.timer % 60, base = d.timer - s; setTime(down ? (s % 10 ? base + Math.floor(s / 10) * 10 : d.timer - 10) : base + (Math.floor(s / 10) + 1) * 10); }
      });
    }
    // giữ − / + để chạy nhanh
    for (const bt of host.querySelectorAll("[data-ts]")) {
      let hold = null;
      const stop = () => { clearTimeout(hold); clearInterval(hold); hold = null; };
      bt.addEventListener("pointerdown", () => { hold = setTimeout(() => { hold = setInterval(() => setTime(d.timer + +bt.dataset.ts * 5), 90); }, 380); });
      ["pointerup", "pointerleave", "pointercancel"].forEach(ev => bt.addEventListener(ev, stop));
    }
    host.oninput = e => { const t = e.target; if (t.dataset.s) d[t.dataset.s] = +t.value; if (t.dataset.c) d[t.dataset.c] = t.checked; paint(); };
    host.onchange = host.oninput;
    paint();
  }
  // về màn bắt đầu (sau khi Apply Options giữa ván)
  function toStart() {
    camera.fov = V.fov; camera.updateProjectionMatrix();
    if (cine.active) { cine.finish(); S.signSwap = false; world.signs.commitAhead(); stage.querySelector(".bp-top").style.visibility = ""; }   // 1aa: không để kẹt bảng dựng sẵn
    clearSky(); removePlane();
    if (S.train) { scene.remove(S.train); disposeTree(S.train); S.train = null; }
    if (trainBody) { PH.removeBody(trainBody); trainBody = null; }
    S.carts = []; S.cars = []; S.coaches = []; S.state = "attract"; S.paused = false; S.timeLeft = opt.timer; S.timeCap = opt.timer; S.elapsed = 0;
    [ovEnd, ovPause, ovAns].forEach(o => o.hidden = true); ovStart.hidden = false;
    if (!embed) sfx.music("menu");
    clockEl.classList.remove("is-warn", "is-x2");
    updateHud();
  }
  ["folder", "options", "ipad", "mode"].forEach(k => press(".bp-" + k, () => ovPanel.dataset.kind === k && !ovPanel.hidden ? closePanel() : openPanel(k)));
  press(".bp-pn-x", closePanel);
  ovPanel.addEventListener("click", e => { if (e.target === ovPanel) closePanel(); });

  // bảng Options trên màn bắt đầu
  const OPT_ROWS = [
    ["timer", "Timer", 30, 600, 15, v => Math.floor(v / 60) + ":" + String(v % 60).padStart(2, "0")],
    ["levels", "Max cars", 1, 10, 1, v => v],
    ["pointsOff", "Points off", 0, 5, 1, v => v],
    ["balloonSpeed", "Balloon speed", 1, 5, 1, v => v],
    ["trainSpeed", "Train speed", 1, 5, 1, v => v],
  ];
  const optBox = $(".bp-opts");
  optBox.innerHTML = OPT_ROWS.map(([k, label]) => `<div class="bp-opt"><span>${label}</span><button data-k="${k}" data-d="-1">−</button><b data-v="${k}"></b><button data-k="${k}" data-d="1">+</button></div>`).join("") +
    `<div class="bp-chips">${[["bonusTime", "Extra time"], ["bonusPoints", "Points"], ["bonusX2", "Double score"], ["guide", "Drop guide"]].map(([k, l]) => `<button class="bp-chip" data-t="${k}">${l}</button>`).join("")}</div>`;
  function paintOpts() {
    OPT_ROWS.forEach(([k, , , , , f]) => { optBox.querySelector(`[data-v="${k}"]`).textContent = f(opt[k]); });
    optBox.querySelectorAll("[data-t]").forEach(b => b.classList.toggle("on", !!opt[b.dataset.t]));
  }
  optBox.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.k) { const r = OPT_ROWS.find(x => x[0] === b.dataset.k); opt[r[0]] = Math.max(r[2], Math.min(r[3], opt[r[0]] + r[4] * +b.dataset.d)); }
    if (b.dataset.t) opt[b.dataset.t] = !opt[b.dataset.t];
    paintOpts();
  });
  paintOpts();
  if (!embed) { sfx.amb(true); sfx.music("menu"); }   // 1ah: màn START — gió sa mạc + nhạc chờ (phát sau lần chạm đầu)

  // bàn thử cho máy (khi khung xem trước bị ẩn rAF đứng)
  const api = window.__bp = {
    sfx, S, opt, get HALF() { return HALF; }, get SKY() { return SKY; }, camera, PH, world, cine, get cineOn() { return cine.active; }, get trainBody() { return trainBody; }, dropCrate, cartWorldX, spawnBlimp,
    start: startGame,
    // 1aj: dỡ hẳn bàn chơi — vòng vẽ dừng, listener gỡ, tiếng của bàn tắt, card đồ hoạ trả lại (dispose + forceContextLoss). Gọi lại vô hại.
    destroy() {
      if (dead) return; dead = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", fit); document.removeEventListener("fullscreenchange", fit); document.removeEventListener("keydown", onEsc);
      try { sfx.train(0); if (!embed) { sfx.music(null, 0.3); sfx.amb(false); } } catch (e) { /* bỏ qua */ }
      try { if (cine.active) cine.finish(); } catch (e) { /* bỏ qua */ }
      try { composer.dispose && composer.dispose(); } catch (e) { /* bỏ qua */ }
      try { renderer.dispose(); renderer.forceContextLoss(); } catch (e) { /* bỏ qua */ }
      mount.innerHTML = ""; mount.classList.remove("is-embed");
      if (window.__bp === api) delete window.__bp;
    },
    get dead() { return dead; },
    // 1ae: intro điện ảnh Fight — 2 tàu màu 2 đội đua nhau; xong thì bàn về màn chờ và gọi onDone
    fightIntro({ colors, onDone }) {
      if (FC.active) return;
      if (cine.active) cine.finish();
      clearSky(); removePlane();
      if (S.train) { scene.remove(S.train); disposeTree(S.train); S.train = null; }
      if (trainBody) { PH.removeBody(trainBody); trainBody = null; }
      S.carts = []; S.cars = []; S.coaches = []; S.paused = false;
      const cd = new THREE.Vector3(); camera.getWorldDirection(cd); const cp = camera.position;
      const idle = { p: [cp.x, cp.y, cp.z], l: [cp.x + cd.x * 300, cp.y + cd.y * 300, cp.z + cd.z * 300], fov: camera.fov };
      const x0 = (S.idleX ?? S.camX) + 40;
      S.state = "fcine";
      world.setClearBand([-9.5, -2.0]);   // 1af: dọn đá/cỏ trên dải ray thứ hai
      FC.begin({ colors, idle, x0, onDone: () => { world.setClearBand(null); S.state = "attract"; camera.fov = 40; camera.updateProjectionMatrix(); if (onDone) onDone(); } });
    },
    skipIntro() { FC.skip(); },
    get fightCine() { return FC; },
    setOrder(items) { order = items ? items.slice() : null; },   // 1ad: bag rút từ CUỐI ⇒ đảo ngược lúc bắt đầu
    setPaused(p) { if (S.state === "attract" || S.state === "over") return; S.paused = !!p; last = 0; },   // 1ac: trang Fight tạm dừng cả 2 bàn
    end: endGame,
    fit,
    step(n = 1, dt = 1 / 60) { manual = true; for (let i = 0; i < n; i++) if (!S.paused) update(dt); composer.render(dt); return S.state; },

    resume() { manual = false; last = 0; },
    render() { composer.render(0); },   // soi cận: đặt __bp.camera rồi gọi render()
    // thả thùng mang `word` ngay trên toa thứ `cartIdx`, có tính trước quãng tàu chạy trong lúc rơi
    testDrop(word, cartIdx = 0, fromY = 11) {
      const c = S.carts[cartIdx]; const tFall = Math.sqrt(2 * (fromY - ROOF_W - CRATE_H) / GRAV);
      dropCrate(word, cartWorldX(c) + cruiseV() * tFall, fromY, 0);
    },
    popWord(word) { const b = S.blimps.find(x => x.word && norm(x.word) === norm(word)); if (b) popBlimp(b); return !!b; },
  };
  return api;
}

// ====================================================================== kết cấu vẽ bằng canvas
function canvasTex(w, h, draw) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const ctx = c.getContext("2d"); draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
function wrapFit(ctx, text, maxW, maxH, maxPx, minPx, weight, maxLines, lh = 1.08) {
  const words = String(text).split(/\s+/);
  for (let px = maxPx; px >= minPx; px -= 3) {
    ctx.font = `${weight} ${px}px ${FONT}`;
    const lines = []; let cur = "";
    for (const w of words) {
      const t = cur ? cur + " " + w : w;
      if (ctx.measureText(t).width <= maxW || !cur) cur = t; else { lines.push(cur); cur = w; }
    }
    if (cur) lines.push(cur);
    const widest = Math.max(...lines.map(l => ctx.measureText(l).width));
    if (lines.length <= maxLines && lines.length * px * lh <= maxH && widest <= maxW) return { lines, px };
  }
  ctx.font = `${weight} ${minPx}px ${FONT}`;
  return { lines: [String(text)], px: minPx };
}
function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function drawLines(ctx, fit, cx, cy, lh = 1.08) {
  const total = fit.lines.length * fit.px * lh;
  fit.lines.forEach((l, i) => ctx.fillText(l, cx, cy - total / 2 + fit.px * lh * (i + 0.5) + fit.px * 0.06));
}
function boardTexture(text, frame = null) {   // 1ad: frame = màu viền bảng theo đội
  return canvasTex(1024, 400, (ctx, w, h) => {
    ctx.fillStyle = frame || "#5a2e1a"; ctx.fillRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#fbf3e0"); g.addColorStop(1, "#efe0bf");
    ctx.fillStyle = g; roundRect(ctx, 14, 14, w - 28, h - 28, 18); ctx.fill();
    ctx.strokeStyle = "rgba(90,46,26,.35)"; ctx.lineWidth = 4; roundRect(ctx, 26, 26, w - 52, h - 52, 12); ctx.stroke();
    ctx.fillStyle = "#1c0c04"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const fit = wrapFit(ctx, text, w - 80, h - 56, 118, 40, 800, 3, 1.04);
    ctx.font = `800 ${fit.px}px ${FONT}`;
    drawLines(ctx, fit, w / 2, h / 2, 1.06);
  });
}
function wordTexture(word) {
  return canvasTex(1024, 248, (ctx, w, h) => {
    ctx.fillStyle = "rgba(20,24,34,.25)"; roundRect(ctx, 14, 20, w - 20, h - 26, 60); ctx.fill();
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#ffffff"); g.addColorStop(1, "#e7ecf3");
    ctx.fillStyle = g; roundRect(ctx, 6, 8, w - 20, h - 26, 60); ctx.fill();
    ctx.lineWidth = 8; ctx.strokeStyle = "#2c3e57"; ctx.stroke();
    ctx.fillStyle = "#15202e"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const fit = wrapFit(ctx, word, w - 110, h - 60, 150, 60, 800, 1);
    ctx.font = `800 ${fit.px}px ${FONT}`;
    drawLines(ctx, fit, w / 2 - 7, (h - 18) / 2);
  });
}
function crateTexture(word, team = null) {
  return canvasTex(780, 404, (ctx, w, h) => {
    drawPlanks(ctx, w, h);
    if (team != null) { ctx.strokeStyle = TEAM_COLORS[team]; ctx.lineWidth = 34; ctx.strokeRect(17, 17, w - 34, h - 34); }   // 1ac: viền màu đội
    ctx.fillStyle = "#f7edd6"; roundRect(ctx, 42, 70, w - 84, h - 140, 20); ctx.fill();
    ctx.strokeStyle = "#5a2e1a"; ctx.lineWidth = 7; ctx.stroke();
    ctx.fillStyle = "#2a150a"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const fit = wrapFit(ctx, word, w - 130, h - 170, 150, 44, 800, 2, 1.0);
    ctx.font = `800 ${fit.px}px ${FONT}`;
    drawLines(ctx, fit, w / 2, h / 2, 1.0);
  });
}
function drawPlanks(ctx, w, h) {
  ctx.fillStyle = "#b07a45"; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 5; i++) { ctx.fillStyle = i % 2 ? "#a86f3c" : "#b8824c"; ctx.fillRect(0, i * h / 5, w, h / 5 - 4); }
  ctx.fillStyle = "#6b3e1e"; for (let i = 1; i < 5; i++) ctx.fillRect(0, i * h / 5 - 4, w, 4);
  ctx.strokeStyle = "#5a3217"; ctx.lineWidth = 28; ctx.strokeRect(14, 14, w - 28, h - 28);
  ctx.fillStyle = "#3b2414"; for (const [x, y] of [[30, 30], [w - 30, 30], [30, h - 30], [w - 30, h - 30]]) { ctx.beginPath(); ctx.arc(x, y, 7, 0, 7); ctx.fill(); }
}
function plankTexture(c1, c2, vertical) {
  const t = canvasTex(512, 512, (ctx, w, h) => {
    const r = mulberry(c1.length * 31 + (vertical ? 7 : 3)), n = 9;
    if (vertical) { ctx.translate(w, 0); ctx.rotate(Math.PI / 2); }
    for (let i = 0; i < n; i++) {
      const y0 = i * h / n;
      ctx.fillStyle = i % 2 ? c1 : c2; ctx.fillRect(0, y0, w, h / n);
      ctx.globalAlpha = 0.18;
      for (let k = 0; k < 40; k++) { ctx.fillStyle = r() < 0.5 ? "#000" : "#fff"; ctx.fillRect(r() * w, y0 + r() * h / n, 20 + r() * 120, 1 + r() * 2); }
      ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(20,10,5,.75)"; ctx.fillRect(0, y0, w, 3);
      ctx.fillStyle = "rgba(30,15,8,.8)"; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(24 + k * 230, y0 + h / n / 2, 4, 0, 7); ctx.fill(); }
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "rgba(40,20,10,.2)"); g.addColorStop(0.5, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(40,20,10,.35)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
// logo ANDREW STUDIO (như Rocket Race mẫu 4h): vòng tròn + mũi tên tên lửa đỏ, chữ nghiêng đậm Exo 2
function drawEmblem(ctx, cx, cy, R, ink) {
  ctx.lineWidth = R * 0.15; ctx.strokeStyle = ink; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = "#e3342f"; ctx.beginPath(); ctx.moveTo(cx, cy - R * 0.72); ctx.lineTo(cx + R * 0.36, cy + R * 0.46); ctx.lineTo(cx, cy + R * 0.22); ctx.lineTo(cx - R * 0.36, cy + R * 0.46); ctx.closePath(); ctx.fill();
}
function emblemTexture() {
  return canvasTex(512, 512, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h * 0.4, 20, w / 2, h / 2, w / 2); g.addColorStop(0, "#f3d27a"); g.addColorStop(1, "#a8792a");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(w / 2, h / 2, w / 2 - 4, 0, 7); ctx.fill();
    ctx.fillStyle = "#16181c"; ctx.beginPath(); ctx.arc(w / 2, h / 2, w / 2 - 34, 0, 7); ctx.fill();
    drawEmblem(ctx, w / 2, h * 0.42, w * 0.2, "#f4f1ea");
    ctx.fillStyle = "#f3d27a"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = `italic 900 58px "Exo 2", "Arial Black", sans-serif`; ctx.fillText("ANDREW", w / 2, h * 0.73);
    ctx.font = `italic 800 34px "Exo 2", "Arial Black", sans-serif`; ctx.fillText("S T U D I O", w / 2, h * 0.83);
  });
}
function lockupTexture() {
  return canvasTex(1024, 240, (ctx, w, h) => {
    const cap = 92, R = cap * 0.8;
    ctx.font = `italic 900 ${cap / 0.7}px "Exo 2", "Arial Black", sans-serif`;
    const tw = ctx.measureText("ANDREW STUDIO").width, total = R * 2.15 + cap * 0.55 + tw, sc = Math.min(1, (w - 40) / total);
    ctx.translate(w / 2 - total * sc / 2, h / 2); ctx.scale(sc, sc);
    ctx.shadowColor = "rgba(0,0,0,.45)"; ctx.shadowBlur = 6; ctx.shadowOffsetY = 3;
    drawEmblem(ctx, R * 1.075, 0, R, "#f1cf72");
    const gr = ctx.createLinearGradient(0, -cap, 0, cap); gr.addColorStop(0, "#fff0b8"); gr.addColorStop(0.5, "#e9bb52"); gr.addColorStop(1, "#b3822c");
    ctx.fillStyle = gr; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.fillText("ANDREW STUDIO", R * 2.15 + cap * 0.55, cap * 0.5);
  });
}
function ornamentTexture(label = null) {   // 1af: label (vd "LV.3") khắc vàng giữa hoa văn, thay ngôi sao
  return canvasTex(1024, 240, (ctx, w, h) => {
    const gold = ctx.createLinearGradient(0, 0, 0, h); gold.addColorStop(0, "#fff0b8"); gold.addColorStop(0.5, "#e2b24c"); gold.addColorStop(1, "#a77a28");
    ctx.strokeStyle = gold; ctx.fillStyle = gold; ctx.lineCap = "round";
    ctx.lineWidth = 7; ctx.beginPath(); ctx.roundRect(14, 14, w - 28, h - 28, 26); ctx.stroke();
    ctx.lineWidth = 2.5; ctx.beginPath(); ctx.roundRect(32, 32, w - 64, h - 64, 18); ctx.stroke();
    // cuộn lá góc
    const scroll = (x, y, sx, sy) => { ctx.save(); ctx.translate(x, y); ctx.scale(sx, sy); ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(60, -10, 90, 30, 60, 50); ctx.bezierCurveTo(40, 64, 22, 40, 40, 30); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-8, 50, 30, 80, 48, 64); ctx.stroke(); ctx.restore(); };
    scroll(48, 48, 1, 1); scroll(w - 48, 48, -1, 1); scroll(48, h - 48, 1, -1); scroll(w - 48, h - 48, -1, -1);
    // hoạ tiết giữa: oval + ngôi sao miền Tây + 2 nhánh lá
    const cx = w / 2, cy = h / 2;
    const ow = label ? 150 : 70, oh = label ? 66 : 58;
    ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(cx, cy, ow, oh, 0, 0, 7); ctx.stroke();
    if (label) {   // chữ khắc: rãnh tối lệch xuống + mặt chữ vàng
      ctx.font = `400 ${label.length > 4 ? 76 : 88}px Rye, serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(40,20,6,.85)"; ctx.fillText(label, cx + 3, cy + 7);
      ctx.fillStyle = gold; ctx.fillText(label, cx, cy + 3);
      ctx.fillStyle = gold;
    } else { ctx.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? 18 : 42; ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); }
    for (const s of [-1, 1]) {
      const b0 = ow + 10;
      ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx + s * b0, cy); ctx.bezierCurveTo(cx + s * (b0 + 100), cy - 40, cx + s * (b0 + 180), cy + 30, cx + s * 360, cy); ctx.stroke();
      for (let k = 0; k < 7; k++) { const x = cx + s * (b0 + 30 + k * (330 - b0) / 7), y = cy + Math.sin(k) * 10; if (s * (x - cx) > 350) continue; ctx.beginPath(); ctx.ellipse(x, y - 14, 14, 6, s * 0.6, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(x + s * 10, y + 14, 14, 6, -s * 0.6, 0, 7); ctx.fill(); }
    }
  });
}
function nameplateTexture() {
  return canvasTex(1024, 172, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#f7dc8e"); g.addColorStop(0.5, "#c89a3c"); g.addColorStop(1, "#8e6420");
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(4, 4, w - 8, h - 8, 80); ctx.fill();
    ctx.fillStyle = "#1c1410"; ctx.beginPath(); ctx.roundRect(16, 16, w - 32, h - 32, 70); ctx.fill();
    ctx.fillStyle = "#f3d27a"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = `italic 900 100px "Exo 2", "Arial Black", sans-serif`; if (ctx.letterSpacing !== undefined) ctx.letterSpacing = "10px";
    ctx.fillText("ANDREW STUDIO", w / 2, h / 2 + 6);
  });
}
function wheelTexture(drive) {

  return canvasTex(256, 256, (ctx) => {
    ctx.translate(128, 128);
    ctx.fillStyle = "#1a1a1c"; ctx.beginPath(); ctx.arc(0, 0, 126, 0, 7); ctx.arc(0, 0, 100, 0, 7, true); ctx.fill();
    ctx.fillStyle = drive ? "#8a1d14" : "#262628"; ctx.beginPath(); ctx.arc(0, 0, 104, 0, 7); ctx.arc(0, 0, 94, 0, 7, true); ctx.fill();
    ctx.strokeStyle = drive ? "#7a1a12" : "#222"; ctx.lineWidth = drive ? 9 : 11; ctx.lineCap = "round";
    const n = drive ? 16 : 10;
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 26, Math.sin(a) * 26); ctx.lineTo(Math.cos(a) * 98, Math.sin(a) * 98); ctx.stroke(); }
    if (drive) { ctx.fillStyle = "#6e1610"; ctx.beginPath(); ctx.arc(0, 0, 90, 2.2, 4.1); ctx.arc(0, 0, 50, 4.1, 2.2, true); ctx.fill(); }
    ctx.fillStyle = "#c9a045"; ctx.beginPath(); ctx.arc(0, 0, 26, 0, 7); ctx.fill();
    ctx.fillStyle = "#2a2a2a"; ctx.beginPath(); ctx.arc(0, 0, 10, 0, 7); ctx.fill();
  });
}
function fabricTexture() {
  const t = canvasTex(1024, 512, (ctx, w, h) => {
    ctx.fillStyle = "#e9e4da"; ctx.fillRect(0, 0, w, h);
    const r = mulberry(4);
    for (let i = 0; i < 24; i++) { ctx.fillStyle = `rgba(${150 + r() * 40},${140 + r() * 40},${130 + r() * 30},${0.08 + r() * 0.08})`; ctx.fillRect(i * w / 24, 0, w / 24, h); }
    ctx.strokeStyle = "rgba(90,80,70,.45)"; ctx.lineWidth = 2;
    for (let i = 0; i <= 24; i++) { ctx.beginPath(); ctx.moveTo(i * w / 24, 0); ctx.lineTo(i * w / 24, h); ctx.stroke(); }
    ctx.strokeStyle = "rgba(90,80,70,.25)"; ctx.lineWidth = 1.5;
    for (let j = 1; j < 10; j++) { ctx.beginPath(); ctx.moveTo(0, j * h / 10); ctx.lineTo(w, j * h / 10); ctx.stroke(); }
    // dải đỏ trang trí quanh thân
    ctx.fillStyle = "rgba(150,30,22,.9)"; ctx.fillRect(0, h * 0.62, w, 10); ctx.fillRect(0, h * 0.655, w, 4);
  });
  t.wrapS = THREE.RepeatWrapping;
  return t;
}

function badgeTexture(n) {
  return canvasTex(128, 128, (ctx, w, h) => {
    ctx.fillStyle = "#f6d36b"; ctx.beginPath(); ctx.arc(64, 64, 58, 0, 7); ctx.fill();
    ctx.strokeStyle = "#6b4a14"; ctx.lineWidth = 6; ctx.stroke();
    ctx.fillStyle = "#3b2508"; ctx.font = `800 76px ${FONT}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(String(n), 64, 70);
  });
}
function iconTexture(type) {
  return canvasTex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = "#ffffff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,.45)"; ctx.shadowBlur = 10;
    if (type === "time") { ctx.font = `800 120px ${FONT}`; ctx.fillText("+10s", 128, 138); }
    else if (type === "points") { ctx.font = `800 170px ${FONT}`; ctx.fillText("$", 128, 140); }
    else { ctx.font = `800 140px ${FONT}`; ctx.fillText("×2", 128, 140); }
  });
}
function popTexture() {
  return canvasTex(512, 256, (ctx, w, h) => {
    ctx.translate(w / 2, h / 2); ctx.fillStyle = "#ffd23f";
    ctx.beginPath(); for (let i = 0; i < 24; i++) { const r = i % 2 ? 80 : 124, a = i / 24 * Math.PI * 2; ctx.lineTo(Math.cos(a) * r * 1.8, Math.sin(a) * r * 0.9); } ctx.closePath(); ctx.fill();
    ctx.font = `800 120px ${FONT}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.lineWidth = 14; ctx.strokeStyle = "#7a1e3a"; ctx.strokeText("POP!", 0, 8); ctx.fillStyle = "#ff5c8a"; ctx.fillText("POP!", 0, 8);
  });
}
function textTexture(text, color) {
  return canvasTex(256, 128, (ctx, w, h) => {
    ctx.font = `800 92px ${FONT}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.lineWidth = 12; ctx.strokeStyle = "rgba(20,20,30,.8)"; ctx.strokeText(text, w / 2, h / 2 + 6); ctx.fillStyle = color; ctx.fillText(text, w / 2, h / 2 + 6);
  });
}
function markTexture(ok) {
  return canvasTex(256, 256, (ctx) => {
    ctx.fillStyle = ok ? "#22c55e" : "#ef4444"; ctx.beginPath(); ctx.arc(128, 128, 110, 0, 7); ctx.fill();
    ctx.lineWidth = 12; ctx.strokeStyle = "#ffffff"; ctx.stroke();
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 30; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.beginPath();
    if (ok) { ctx.moveTo(72, 132); ctx.lineTo(112, 172); ctx.lineTo(186, 92); } else { ctx.moveTo(84, 84); ctx.lineTo(172, 172); ctx.moveTo(172, 84); ctx.lineTo(84, 172); }
    ctx.stroke();
  });
}
function bannerTexture(text) {
  return canvasTex(1024, 240, (ctx, w, h) => {
    ctx.fillStyle = "#fff6dc"; roundRect(ctx, 8, 8, w - 16, h - 16, 20); ctx.fill();
    ctx.lineWidth = 10; ctx.strokeStyle = "#b8452f"; ctx.stroke();
    ctx.fillStyle = "#7a2416"; ctx.font = `800 150px ${FONT}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(text, w / 2, h / 2 + 10);
  });
}
function softDotTexture() {
  return canvasTex(128, 128, (ctx) => {
    const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 62); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  });
}

// ====================================================================== tiện ích
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function mulberry(s) { return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
function disposeTree(o) {
  o.traverse(x => {
    if (x.isMesh || x.isSprite) {
      if (x.geometry && !x.geometry.userData.shared) x.geometry.dispose?.();
      const mats = Array.isArray(x.material) ? x.material : [x.material];
      mats.forEach(m => { if (m && !m.userData.shared) { m.map && !m.map.userData.shared && m.map.dispose(); m.dispose(); } });
    }
  });
}

const GRADE_SHADER = {
  uniforms: { tDiffuse: { value: null }, time: { value: 0 }, sepia: { value: 0 }, whip: { value: 0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float time; uniform float sepia; uniform float whip; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      if (abs(whip) > 0.001) {   // 1ab: cắt cảnh kiểu LIA VỤT — nhoè ngang theo chiều lia + loé sáng nhẹ
        vec3 s = vec3(0.); for (int i = 0; i < 12; i++) s += texture2D(tDiffuse, vUv + vec2(whip * 0.11 * (float(i) / 11. - 0.5), 0.)).rgb;
        c = s / 12. * (1. + abs(whip) * 0.18);
      }
      float l = dot(c, vec3(0.299, 0.587, 0.114));
      c = mix(c, c * c * (3. - 2. * c), 0.16);
      c += vec3(-0.012, 0.0, 0.02) * (1. - l) + vec3(0.03, 0.012, -0.02) * l;
      c = mix(vec3(l), c, 1.08);
      float v = smoothstep(0.95, 0.3, length((vUv - 0.5) * vec2(1.25, 1.0)));
      c *= mix(0.74, 1.0, v);
      vec3 sp = vec3(dot(c, vec3(.393, .769, .189)), dot(c, vec3(.349, .686, .168)), dot(c, vec3(.272, .534, .131)));
      c = mix(c, sp * 0.9 * (0.96 + 0.04 * h(vec2(floor(time * 12.), 3.))), sepia * 0.88);   // 1p: phim cũ nâu + nhấp nháy
      c += (h(vUv * 900. + fract(time)) - 0.5) * (0.02 + sepia * 0.05);
      gl_FragColor = vec4(c, 1.);
    }`,
};
const ICON = {
  ipad: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="2.5" width="15" height="19" rx="2.2"/><path d="M11 18.3h2"/></svg>',
  folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/></svg>',
  options: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h10M18 6h2M4 12h4M10 12h10M4 18h13M21 18h-1"/><circle cx="16" cy="6" r="2.2"/><circle cx="7" cy="12" r="2.2"/><circle cx="17" cy="18" r="2.2"/></svg>',
  table: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.4 3.2H5.6v1.1H2.2v2.1c0 2.6 1.9 4.7 4.4 5.1a5.9 5.9 0 0 0 4 3.3v3H8.1a1.9 1.9 0 0 0-1.9 1.9v1.1h11.6v-1.1a1.9 1.9 0 0 0-1.9-1.9h-2.5v-3a5.9 5.9 0 0 0 4-3.3c2.5-.4 4.4-2.5 4.4-5.1V4.3h-3.4V3.2zM4.1 6.4V6.2h1.5v3.2A3.4 3.4 0 0 1 4.1 6.4zm15.8 0a3.4 3.4 0 0 1-1.5 3V6.2h1.5v.2z"/></svg>',
  mode: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="12" rx="1.8"/></svg>',
  fight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect x="2.1" y="6" width="7.5" height="12" rx="1.6"/><rect x="14.4" y="6" width="7.5" height="12" rx="1.6"/><path d="M12 6.5v11"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  sound: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path class="w" d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/><path class="x" d="m16 9 6 6m0-6-6 6"/></svg>',
  fs: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/></svg>',
};
const HUD_HTML = `
<div class="bp-stage">
  <canvas></canvas>
  <div class="bp-top">
    <div class="bp-clock">0:00</div>
    <div class="bp-prog"><i></i></div>
    <div class="bp-score" hidden><b>0</b></div>
  </div>
  <div class="bp-sign">Level 1</div>

  <div class="bp-ov bp-ov-start bp-idle">
    <div class="bp-logo"><span class="t">TRAIN RUSH</span><div class="bp-logo-rule"><i></i><b>★</b><i></i></div></div>
    <button class="bp-start bp-start-west"><span>START</span></button>
    <p class="bp-words" hidden></p>
    <div class="bp-opts" hidden></div>
  </div>
  <div class="bp-ov bp-ov-pause" hidden>
    <div class="bp-card"><h2>PAUSED</h2><button class="bp-big bp-resume">Resume</button><button class="bp-mid bp-again3">Start again</button><button class="bp-mid bp-endgame">End game</button></div>
  </div>
  <div class="bp-ov bp-ov-end" hidden>
    <div class="bp-wanted">
      <div class="bp-w-title bp-end-title">TIME'S UP</div>
      <div class="bp-w-rule"><i></i><span>★</span><i></i></div>
      <div class="bp-w-label">SCORE</div>
      <div class="bp-end-score">0</div>
      <div class="bp-w-stats">
        <div><span class="bp-w-ic">⏱</span><b class="bp-end-time">0:00</b><small>TIME</small></div>
        <div><span class="bp-w-ic">✔</span><b class="bp-end-match">0</b><small>MATCHED</small></div>
        <div><span class="bp-w-ic">🚂</span><b class="bp-end-trains">0</b><small>TRAINS</small></div>
      </div>
      <div class="bp-w-btns"><button class="bp-wbtn bp-show">Show answers</button><button class="bp-wbtn is-main bp-again">Start again</button></div>
    </div>
  </div>
  <div class="bp-ov bp-ov-ans" hidden>
    <div class="bp-card bp-card-wide"><h2>Show answers</h2><div class="bp-ans-list"></div>
      <div class="bp-ans-foot"><button class="bp-mid bp-ans-back">Back</button><button class="bp-big bp-again2">Start again</button></div></div>
  </div>
  <div class="bp-ov bp-ov-panel" hidden><div class="bp-card bp-pn">
    <button class="bp-pn-x" aria-label="Close">✕</button>
    <h2 class="bp-pn-t"></h2><div class="bp-pn-b"></div>
  </div></div>
</div>
<div class="bp-outbar">
  <button class="bp-tool bp-menu" title="Menu" aria-label="Menu">${ICON.menu}</button>
  <button class="bp-tool bp-sound" title="Sound" aria-label="Sound">${ICON.sound}</button>
  <div class="bp-uptime" hidden><span class="bp-uptime-ic"></span><b>0:00</b></div>
  <i class="bp-tool-gap"></i>
  <button class="bp-tool bp-folder" title="Switch activity" aria-label="Switch activity">${ICON.folder}</button>
  <button class="bp-tool bp-options" title="Options" aria-label="Options">${ICON.options}</button>
  <button class="bp-tool bp-ipad" title="iPad" aria-label="iPad">${ICON.ipad}</button>
  <button class="bp-tool bp-mode" title="Mode" aria-label="Mode">${ICON.mode}</button>
</div>`;
