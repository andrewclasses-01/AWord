// =============================================================
// core/words-picker.js — MÀN CHỌN TEMPLATE + LOẠI ACT cho act WORDS  (Đợt 453, 04/10/2026)
//
// THẦY GIAO: act WORDS gộp nhiều act (4 bộ ENG1/ENG2/VI1/VI2 × TEXT/VOICE × ~14 template)
// nên bấm mở là vào ngay game thì rối. Nay thầy MỞ TAY một act WORDS thì hiện MÀN CHỌN trước:
//   · hàng trên: TEXT | VOICE  +  ENG1 ENG2 VI1 VI2 (VOICE thu VI1/VI2 lại, hiện loa sau ENG1/ENG2)
//   · khu trên: 3 game 3D (Rocket Race · Train Rush · Star Loot) — thẻ cảnh
//   · khu dưới: game thường
//   Chạm một ô ⇒ vào màn START CŨ của game đó (học sinh lên bảng, chờ hiệu lệnh, bấm Start).
// Thiết kế: D:\OTHERS\CLAUDE\AWord - thiet ke man chon WORDS\man-chon-v6.html (bộ C).
//
// ⭐ CHỌN XONG GHI GÌ: đúng những thứ Options đã ghi — `options.contentMode / contentVariant /
//   voiceVariant` (VIEW_SELECTOR_KEYS) và `lastTpl` (Đợt 400, qua store.setLastTemplate). Rồi
//   gọi startGame() như mọi lần mở act: engine tự chuyển sang `lastTpl`. Nên Options, Edit, Fight,
//   Showdown… chạy y như cũ — màn này không có đường chơi riêng.
// ⭐ Ô SÁNG SẴN = template chơi cuối (lastTpl); hai nửa TEXT/VOICE mỗi nửa nhớ bộ riêng của nó
//   (y luật Đợt 145: contentVariant ≠ voiceVariant).
//
// ⛔ AI KHÔNG ĐƯỢC THẤY MÀN NÀY:
//   · học sinh (play.js / session) — không đi qua main.js;
//   · app Electron (myActivity nhiều cột, myLesson): chúng mở `?a=N` rồi điều khiển bằng
//     `window.__awordBridge`, mà bridge chỉ có khi game ĐANG CHẠY ⇒ chặn ở màn chọn là gãy đồng bộ
//     các cột. Nhận ra bằng "Electron/" trong userAgent. `?go=1` = bỏ qua màn chọn, `?pick=1` = ép hiện.
//   · act không có `content.variants` (mọi act cũ) — `wantsPicker()` trả false, không đổi gì.
// ⚠️ Nút GAMES trên màn START (engine.js `setWordsPickerHook`) quay lại đây; hook xoá khi ra thư viện.
//
// ⭐⭐ Đợt 525 (thầy 15/10/2026) — CHỌN OPTIONS TRƯỚC KHI VÀO GAME. Máy tính: chạm một ô KHÔNG vào game ngay:
//   nền tối đi, ô sáng nổi BAY THẲNG từ chỗ của nó sang trái; khung Options TRƯỢT VÀO TỪ MÉP PHẢI; trên cùng
//   khung là thanh MODE (FIGHT · SINGLE · SHOWDOWN · RUNNING · IPA), dưới là bảng Options THẬT của engine;
//   nút READY xanh dương ở dưới hai khung ⇒ bấm Apply thật rồi hiện game (màn START).
//   Cách làm: game được dựng NGẦM trong một container ẩn ngay sau trang này (`.aw-wp-gamehost`), engine báo
//   mỗi lần dựng xong qua setPreflight ⇒ màn chọn gắn bảng Options của bàn đó vào khung phải (nhánh `embed`
//   của openToolPanel). Đổi mode = đúng hàm nút MODE dùng (dựng lại bàn) ⇒ gắn lại bảng. Không có bảng giả.
//   SHOWDOWN: bàn đứng single, READY xong mới mở bàn đội (màn chọn lớp/đội có sẵn). FIGHT của game có trận
//   riêng trọn màn (Train Rush) cũng vậy: chọn options ở single, READY xong mới vào trận.
//   Điện thoại (khung ≤ 700px) giữ đường cũ: chạm là vào màn START.
//   Thiết kế: D:\OTHERS\CLAUDE\AWord - thiet ke man chon WORDS\man-chon-v8-options.html.
// =============================================================

import "./unit.js";
import { el } from "./utils.js";
import { icons } from "./icons.js";
import { buildStage } from "./layout.js";
import { variantsOf, voiceVariantsOf, variantLabel } from "./content-view.js";
import { switchTargets } from "./convert.js";
import { templateEntry } from "./catalog.js";
import { setLastTemplate } from "./store.js";
import { ensureTemplate } from "./registry.js";
import { startGame, setWordsPickerHook, setPreflight } from "./engine.js";
import { iconSvg, sceneSvg, SC } from "./words-picker-art.js";

// 3 game 3D (khu trên) → cảnh trong words-picker-art.js
const G3 = [["rocket_race", "rocket"], ["balloon_pop", "train"], ["maze_chase", "loot"]];
// game thường (khu dưới), THEO THỨ TỰ HIỆN. Ba game cuối cùng là thầy dặn xuống dưới cùng.
// Running word/team/IPA KHÔNG ở đây: chúng là MODE trong game (Đợt 400), không phải template.
const G2 = [
  ["quiz", "quiz"], ["anagram", "anagram"], ["find_the_match", "match"], ["type_the_answer", "type"],
  ["open_the_box", "box"], ["whack_a_mole", "mole"], ["crossword", "cross"], ["wordshake", "speed"],
  ["flying_fruit", "fruit"], ["gameshow", "show"], ["speaking_cards", "speak"]
];
const ORDER = [...G3.map(g => g[0]), ...G2.map(g => g[0])];

const SVG_TEXT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 6h14M12 6v13M9 19h6"/></svg>';
const SVG_VOICE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>';

// Kích thước hàng nút, TÍNH BẰNG PX CỦA BẢN THIẾT KẾ (xem words-picker.css: nhân `--p`).
// Máy tính (khung 1280) và điện thoại (khung 375, tràn viền) khác nhau.
const DIM = {
  desk:  { pad: 4, gap: 2, mode: 262, setsText: 440, setsVoice: 282 },
  phone: { pad: 2, gap: 2, mode: 98,  setsText: 170, setsVoice: 104 }
};

let cssReady = null;
function loadCss() {
  if (cssReady) return cssReady;
  cssReady = new Promise(res => {
    const url = new URL("./words-picker.css", import.meta.url).href;
    if ([...document.querySelectorAll("link[rel=stylesheet]")].some(l => l.href === url)) return res();
    const link = document.createElement("link");
    link.rel = "stylesheet"; link.href = url;
    link.onload = () => res(); link.onerror = () => res();   // lỗi mạng: vẫn mở, chỉ kém đẹp
    document.head.append(link);
    setTimeout(res, 3000);
  });
  return cssReady;
}

// ---------------------------------------------------------------------------
// myActivity (nhiều cột) — ĐỢT 453b. Cột 0 là cột CHỦ, cột 1..N là cột THEO.
//   · myActivity (v2.31.0) gắn " myActivityHost/1" vào UA của trang AWord (nó đã GỠ chữ Electron
//     khỏi UA để đăng nhập Google, nên không còn cách nào khác để AWord biết mình ở đó).
//   · Link act đẩy sang cột theo có thêm `f=1`.
//   · Cột CHỦ hiện màn chọn như thường. Cột THEO gặp act WORDS mà link chưa có `tpl` thì ĐỨNG CHỜ
//     (màn tối + tên act); chọn xong, cột chủ đổi địa chỉ của nó thành
//     `?a=N&tpl=<template>&cm=<text|voice>&cv=<bộ TEXT>&vv=<bộ VOICE>`, myActivity chép đúng địa chỉ đó
//     (kèm f=1) sang cột theo ⇒ chúng mở thẳng vào màn START với đúng lựa chọn, KHÔNG đọc lại
//     Firebase (tránh chậm/lệch). Bấm GAMES ở cột chủ ⇒ địa chỉ về trơn ⇒ cột theo lại chờ.
//   · Cột theo CHỈ áp lựa chọn trong bộ nhớ, không ghi Firebase (cột chủ đã ghi rồi).
const PICK_PARAMS = ["tpl", "cm", "cv", "vv"];
const sp = () => { try { return new URLSearchParams(location.search); } catch { return new URLSearchParams(); } };
export function inMyActivity() { return /myActivityHost\//.test((navigator && navigator.userAgent) || ""); }

// Act này có phải act WORDS cần màn chọn, và nơi mở có được phép hiện không?
export function wantsPicker(node) {
  if (!node || node.kind !== "act" || !variantsOf(node.content)) return false;
  const p = sp();
  if (p.get("go") === "1") return false;
  if (p.get("pick") === "1") return true;
  if (inMyActivity()) return true;                                   // cột chủ của myActivity
  return !/Electron\//i.test((navigator && navigator.userAgent) || "");   // myLesson… giữ nguyên
}

// Đặt/gỡ lựa chọn trên địa chỉ (CHỈ trong myActivity — ở Chrome thường giữ link sạch). replaceState
// vẫn làm myActivity nghe `did-navigate-in-page` ⇒ mirrorAword chép sang cột theo.
function setPickUrl(type, sel) {
  if (!inMyActivity()) return;
  try {
    const u = new URL(location.href);
    PICK_PARAMS.concat("f").forEach(k => u.searchParams.delete(k));
    if (type) {
      u.searchParams.set("tpl", type);
      if (sel.contentMode) u.searchParams.set("cm", sel.contentMode);
      if (sel.contentVariant) u.searchParams.set("cv", sel.contentVariant);
      if (sel.voiceVariant) u.searchParams.set("vv", sel.voiceVariant);
    }
    if (u.toString() !== location.href) history.replaceState(history.state, "", u.toString());
  } catch { /* ignore */ }
}

// Lựa chọn ĐANG LƯU của một act WORDS (để nối vào link khi chuyển act ngay trong game).
function savedPick(node) {
  const o = node.options || {};
  const sets = variantsOf(node.content) || [], vs = voiceVariantsOf(node.content);
  const sel = { contentVariant: sets.includes(o.contentVariant) ? o.contentVariant : sets[0] };
  if (vs) { sel.contentMode = o.contentMode === "voice" ? "voice" : "text"; sel.voiceVariant = vs.includes(o.voiceVariant) ? o.voiceVariant : vs[0]; }
  return sel;
}
// Nút chuyển act ngay trong game KHÔNG qua màn chọn (vào thẳng template chơi cuối) ⇒ nếu địa chỉ
// mới của cột chủ trơn thì cột theo gặp act WORDS sẽ đứng chờ mãi. Nối sẵn lựa chọn đang lưu.
export function urlForSwitch(url, node) {
  if (!inMyActivity() || !node || !variantsOf(node.content)) return url;
  try {
    const u = new URL(url, location.href);
    const sel = savedPick(node);
    u.searchParams.set("tpl", node.lastTpl || node.type);
    Object.entries({ cm: sel.contentMode, cv: sel.contentVariant, vv: sel.voiceVariant }).forEach(([k, v]) => { if (v) u.searchParams.set(k, v); });
    return u.toString();
  } catch { return url; }
}

// CỔNG VÀO DUY NHẤT cho main.js (thư viện bấm act, link ?a=). Trả true = đã tự dựng màn (màn chọn /
// màn chờ), false = để main.js mở game như thường (có thể sau khi áp lựa chọn cho cột theo).
export async function enterWords(root, node, { onExit } = {}) {
  if (!node || node.kind !== "act" || !variantsOf(node.content)) return false;
  const p = sp();
  if (p.get("go") === "1") return false;
  if (inMyActivity() && p.get("f") === "1") {
    const tpl = p.get("tpl");
    if (!tpl) { await openFollowerWait(root, node); return true; }
    applyFollowerPick(node, p, tpl);
    return false;
  }
  if (!wantsPicker(node)) return false;
  return openWordsPicker(root, node, { onExit });
}

function applyFollowerPick(node, p, tpl) {
  const sets = variantsOf(node.content) || [], vs = voiceVariantsOf(node.content);
  const sel = {};
  if (sets.includes(p.get("cv"))) sel.contentVariant = p.get("cv");
  if (vs && vs.includes(p.get("vv"))) sel.voiceVariant = p.get("vv");
  if (vs && (p.get("cm") === "text" || p.get("cm") === "voice")) sel.contentMode = p.get("cm");
  node.options = { ...(node.options || {}), ...sel };
  if (tpl === node.type) delete node.lastTpl; else node.lastTpl = tpl;   // engine kiểm tpl hợp lệ (rememberedTemplate)
}

// Cột theo đứng chờ: tối, tên act, vòng xoay nhỏ. Khi cột chủ chọn xong, myActivity nạp lại trang này.
async function openFollowerWait(root, node) {
  await loadCss();
  root.innerHTML = "";
  const { page, stage, inner, below } = buildStage("classic");
  stage.classList.add("act-wordswait");
  const w = el("div", "aw-wp-wait");
  w.append(el("div", "aw-wp-slogan", "ANDREW CLASSES"), el("div", "aw-wp-wtitle", esc(node.title || "")), el("div", "aw-wp-spin"));
  inner.append(w);
  root.append(page);
  const bl = el("div", "aw-below-left");
  bl.append(el("div", "aw-below-title", esc(node.title || "")));
  below.append(bl);
}

export async function openWordsPicker(root, node, { onExit, onBack } = {}) {
  await loadCss();
  const sets = variantsOf(node.content);
  const voiceSets = voiceVariantsOf(node.content);        // null ⇒ act không có giọng đọc
  const opts = node.options || {};
  const exit = () => { setWordsPickerHook(null); setPreflight(null); if (onExit) onExit(); };
  // Nút GAMES trên màn START quay về đây (engine.js đọc hook này).
  setWordsPickerHook({ actId: node.id, open: r => openWordsPicker(r, node, { onExit, onBack }) });
  setPickUrl(null);   // myActivity: địa chỉ về trơn ⇒ cột theo (đang mở game) quay lại CHỜ

  // game nào chơi được với nội dung này — cùng luật nút Template trong Options (switchTargets)
  const ok = new Set([node.type]);
  try { switchTargets(node).forEach(t => ok.add(t.type)); } catch { /* act lạ: chỉ còn loại gốc */ }
  const usable = t => ok.has(t) && !!(templateEntry(t) && templateEntry(t).built);

  const st = {
    mode: voiceSets && opts.contentMode === "voice" ? "voice" : "text",
    text: sets.includes(opts.contentVariant) ? opts.contentVariant : sets[0],
    voice: voiceSets ? (voiceSets.includes(opts.voiceVariant) ? opts.voiceVariant : voiceSets[0]) : null,
    hi: "", busy: false
  };
  const last = node.lastTpl && usable(node.lastTpl) ? node.lastTpl : node.type;
  st.hi = ORDER.includes(last) ? last : "anagram";

  root.innerHTML = "";
  const { page, stage, inner, below } = buildStage("classic");
  stage.classList.add("act-wordspicker");
  const wp = el("div", "aw-wp");
  inner.append(wp);
  root.append(page);
  page.addEventListener("contextmenu", e => e.preventDefault());

  // dưới khung: tên act, như mọi màn game
  const belowLeft = el("div", "aw-below-left");
  belowLeft.append(el("div", "aw-below-title", esc(node.title || "")));
  below.append(belowLeft);

  wp.append(el("div", "aw-wp-slogan", "ANDREW CLASSES"));
  const head = el("div", "aw-wp-head");
  head.append(el("div", "aw-wp-title", esc(node.title || "")));
  wp.append(head);

  // ---- hàng chọn loại act ----
  const ctl = el("div", "aw-wp-ctl");
  let modeSeg = null, modeTh = null;
  if (voiceSets) {
    modeSeg = el("div", "aw-wp-seg aw-wp-mode");
    modeTh = el("span", "wp-th");
    modeSeg.append(modeTh);
    [["text", "TEXT", SVG_TEXT], ["voice", "VOICE", SVG_VOICE]].forEach(([m, label, svg]) => {
      const b = el("button", "");
      b.type = "button"; b.dataset.m = m;
      b.append(el("span", "wp-ic", svg), document.createTextNode(label));
      b.onclick = () => { if (st.mode === m) return; st.mode = m; paint(); preSelChanged(); };
      modeSeg.append(b);
    });
    ctl.append(modeSeg);
  }
  const setsSeg = el("div", "aw-wp-seg aw-wp-sets");
  const setsTh = el("span", "wp-th");
  setsSeg.append(setsTh);
  sets.forEach(k => {
    const b = el("button", "");
    b.type = "button"; b.dataset.k = k;
    b.append(document.createTextNode(variantLabel(node.content, k)), el("span", "wp-spk", SVG_VOICE));
    b.onclick = () => {
      if (b.classList.contains("gone")) return;
      if ((st.mode === "voice" ? st.voice : st.text) === k) return;
      if (st.mode === "voice") st.voice = k; else st.text = k;
      paint(); preSelChanged();
    };
    setsSeg.append(b);
  });
  ctl.append(setsSeg);
  wp.append(ctl);

  // ---- hai khu ----
  const z3 = el("div", "aw-wp-z3");
  G3.forEach(([type, key]) => {
    const b = el("button", "wp-card");
    b.type = "button"; b.dataset.t = type; b.style.cssText = SC[key].v;
    b.innerHTML = sceneSvg(key) + `<span class="wp-nm">${SC[key].name}</span>`;
    wire(b, type);
    z3.append(b);
  });
  const z2 = el("div", "aw-wp-z2");
  G2.forEach(([type, key]) => {
    const b = el("button", "wp-tile");
    b.type = "button"; b.dataset.t = type;
    b.innerHTML = `<span class="wp-tic">${iconSvg(key)}</span><span class="wp-nm">${esc((templateEntry(type) || {}).label || type)}</span>`;
    wire(b, type);
    z2.append(b);
  });
  wp.append(z3, el("div", "aw-wp-rule"), z2);

  // ---- nút QUAY LẠI (mũi tên) góc dưới trái: về thư mục chứa act, như bấm Back. Home trong game
  //      vẫn về trang chủ (onExit); riêng nút này dùng `onBack` (main.js: thư mục cha của act). ----
  const backBtn = el("button", "aw-wp-exit", icons.backArrow);
  backBtn.type = "button"; backBtn.title = "Back"; backBtn.setAttribute("aria-label", "Back");
  backBtn.onclick = () => { off(); setWordsPickerHook(null); (onBack || onExit || (() => {}))(); };
  wp.append(backBtn);

  function wire(b, type) {
    if (!usable(type)) { b.classList.add("is-soon"); b.setAttribute("aria-disabled", "true"); b.title = "Doesn't fit this content"; }
    b.addEventListener("mouseenter", () => { st.hi = type; paintHi(); });
    b.addEventListener("focus", () => { st.hi = type; paintHi(); });
    b.onclick = () => { if (mq && mq.matches) pick(type); else openPre(type, b); };
  }

  // ---- vẽ lại trạng thái ----
  const mq = window.matchMedia ? window.matchMedia("(max-width: 700px)") : null;
  const dim = () => (mq && mq.matches ? DIM.phone : DIM.desk);
  const num = n => `calc(${n} * var(--p))`;
  function paint() {
    const d = dim(), voice = st.mode === "voice";
    if (modeSeg) {
      const bw = (d.mode - 2 * d.pad - d.gap) / 2, i = voice ? 1 : 0;
      modeTh.style.left = num(d.pad + i * (bw + d.gap)); modeTh.style.width = num(bw);
      modeSeg.querySelectorAll("button").forEach(b => b.classList.toggle("on", b.dataset.m === st.mode));
    }
    // hàng bộ nghĩa THỞ: VOICE thu lại còn ENG1/ENG2 (kèm loa), TEXT mở đủ 4
    const visible = voice && voiceSets ? sets.filter(k => voiceSets.includes(k)) : sets;
    const cur = voice ? st.voice : st.text;
    const total = voice ? d.setsVoice : d.setsText;
    const bw = (total - 2 * d.pad - (visible.length - 1) * d.gap) / visible.length;
    setsSeg.style.width = num(total);
    setsSeg.classList.toggle("is-voice", voice);
    setsTh.style.width = num(bw);
    setsTh.style.left = num(d.pad + Math.max(0, visible.indexOf(cur)) * (bw + d.gap));
    setsSeg.querySelectorAll("button").forEach(b => {
      b.classList.toggle("on", b.dataset.k === cur);
      b.classList.toggle("gone", !visible.includes(b.dataset.k));
    });
    paintHi();
  }
  function paintHi() {
    wp.querySelectorAll(".aw-wp-z3 .wp-card, .aw-wp-z2 .wp-tile").forEach(b => b.classList.toggle("hi", b.dataset.t === st.hi && !pre));
    paintPickset();
  }
  if (mq && mq.addEventListener) mq.addEventListener("change", paint);

  // ---- bàn phím (thầy dùng chuột/chạm là chính; mũi tên + Enter cho tiện) ----
  function onKey(e) {
    if (!wp.isConnected) { off(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (pre) {
      // Game đang dựng NGẦM phía sau cũng nghe bàn phím (Enter/Space = bắt đầu chơi…) ⇒ khung mở thì chặn
      // phím ở đây; riêng ô gõ trong bảng (tên đội Running word…) vẫn nhận chữ như thường.
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target && e.target.tagName) || "") && optEl.contains(e.target);
      if (e.key === "Escape") { e.preventDefault(); closePre(); }
      else if (e.key === "Enter" && !typing) { e.preventDefault(); ready(); }
      if (!typing) e.stopImmediatePropagation();
      return;
    }
    let i = ORDER.indexOf(st.hi);
    const k = e.key;
    if (k === "Enter") {
      e.preventDefault();
      if (mq && mq.matches) pick(st.hi); else openPre(st.hi, wp.querySelector(`.aw-wp-z3 [data-t="${st.hi}"], .aw-wp-z2 [data-t="${st.hi}"]`));
      return;
    }
    if (k === "ArrowRight") i = Math.min(ORDER.length - 1, i + 1);
    else if (k === "ArrowLeft") i = Math.max(0, i - 1);
    else if (k === "ArrowDown") i = i < 3 ? 3 + i * 2 : Math.min(ORDER.length - 1, i + (i < 9 ? 6 : 5));
    else if (k === "ArrowUp") i = i >= 3 && i < 9 ? Math.min(2, Math.floor((i - 3) / 2)) : Math.max(0, i - (i >= 9 ? 6 : 0));
    else return;
    e.preventDefault();
    st.hi = ORDER[i]; paintHi();
  }
  function off() {
    document.removeEventListener("keydown", onKey, true);
    if (mq && mq.removeEventListener) mq.removeEventListener("change", paint);
  }
  document.addEventListener("keydown", onKey, true);


  // =====================================================================================
  // ⭐⭐ Đợt 525 — KHUNG CHỌN OPTIONS (máy tính). Xem khối chú thích đầu file.
  // Toạ độ theo PX CỦA BẢN THIẾT KẾ 1280×840 (nhân --p, như mọi thứ khác trên màn này).
  // =====================================================================================
  const G = { cardW: 260, cardH: 492, gap: 24, panelW: 860, top: 226, readyW: 330, readyTop: 746 };
  G.gx = (1280 - (G.cardW + G.gap + G.panelW)) / 2;
  G.px = G.gx + G.cardW + G.gap;
  const MODES = [
    ["fight", "FIGHT", '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 17.5 3 6V3h3l11.5 11.5"/><path d="M13 19l6-6M16 16l4 4M19 21l2-2"/><path d="M9.5 6.5 14 2h3v3l-4.5 4.5"/><path d="M5 14l-2 2 2 2M8 17l-2 2"/></svg>'],
    ["single", "SINGLE", '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7.5" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/></svg>'],
    ["showdown", "SHOWDOWN", '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/></svg>'],
    ["running", "RUNNING", '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="15" cy="4.5" r="2"/><path d="M5 21l4-6 3 2 2-5 3 3h3"/><path d="M8 11l3-4 4 1 1 4"/></svg>'],
    ["ipa", "IPA", '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4 3 12l4 8M17 4l4 8-4 8"/><path d="M10 16c0-3 4-3 4-6a2 2 0 0 0-4 0"/></svg>']
  ];
  const PLANE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.54 21.69a.5.5 0 0 0 .94-.03l6.5-19a.5.5 0 0 0-.64-.64l-19 6.5a.5.5 0 0 0-.02.94l7.93 3.18a2 2 0 0 1 1.11 1.11z" fill="currentColor" fill-opacity=".18"/><path d="m21.85 2.15-10.94 10.94"/></svg>';
  const XSVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';
  const RUN_LABEL = { running_word: "WORD", running_team: "TEAM" };

  const dimEl = el("div", "aw-wp-dim");
  const optEl = el("div", "aw-wp-opt");
  optEl.style.cssText = `left:${num(G.px)};top:${num(G.top)};width:${num(G.panelW)};height:${num(G.cardH)};--from:${num(1280 - G.px + 30)}`;
  const mbar = el("div", "aw-wp-mbar");
  const mth = el("span", "wp-th");
  mbar.append(mth);
  MODES.forEach(([k, label, svg]) => {
    const b = el("button", "", svg + `<span>${label}</span>`);
    b.type = "button"; b.dataset.pm = k;
    b.onclick = () => pickMode(k);
    mbar.append(b);
  });
  const runSeg = el("div", "aw-wp-runseg");
  const obody = el("div", "aw-wp-obody");
  optEl.append(mbar, runSeg, obody);
  const readyBtn = el("button", "aw-wp-ready", `<span class="rt">READY</span><span class="rp">${PLANE}</span>`);
  readyBtn.type = "button";
  readyBtn.style.cssText = `left:${num((1280 - G.readyW) / 2)};top:${num(G.readyTop)};width:${num(G.readyW)}`;
  readyBtn.onclick = () => ready();
  const xBtn = el("button", "aw-wp-x", XSVG);
  xBtn.type = "button"; xBtn.title = "Close"; xBtn.setAttribute("aria-label", "Close");
  xBtn.style.cssText = `left:${num(G.px + G.panelW - 24)};top:${num(G.top - 24)}`;
  xBtn.onclick = () => closePre();
  dimEl.onclick = () => closePre();
  wp.append(dimEl, optEl, readyBtn, xBtn);

  // pre = khung đang mở: { type, tile, fly, host (container game), api, intent, sub, avail, boot, done, after }
  let pre = null;
  const later = [];
  const wait = (fn, ms) => later.push(setTimeout(fn, ms));
  const clearLater = () => { later.forEach(clearTimeout); later.length = 0; };
  const curSel = () => { const sel = { contentVariant: st.text }; if (voiceSets) { sel.contentMode = st.mode; sel.voiceVariant = st.voice; } return sel; };
  const kOf = () => wp.getBoundingClientRect().width / 1280 || 1;   // px màn hình / px thiết kế

  function paintPickset() {
    const ps = pre && pre.fly && pre.fly.querySelector(".wp-pickset");
    if (!ps) return;
    const setK = st.mode === "voice" ? st.voice : st.text;
    ps.innerHTML = `<span>${esc(variantLabel(node.content, setK))}</span>` + (voiceSets ? `<span>${st.mode === "voice" ? "VOICE" : "TEXT"}</span>` : "");
  }

  async function openPre(type, tile) {
    if (pre || st.busy || !usable(type) || !tile) return;
    st.hi = type;
    pre = { type, tile, intent: null, sub: null, avail: null, boot: true, done: false, api: null, after: null };
    // 1) ô bay THẲNG từ lưới sang trái, sáng nổi; nền tối; khung options trượt vào từ mép phải
    const k = kOf(), wr = wp.getBoundingClientRect(), r = tile.getBoundingClientRect();
    const fly = tile.cloneNode(true);
    fly.classList.remove("hi", "is-loading");
    fly.classList.add("wp-fly");
    fly.removeAttribute("data-t");
    fly.append(el("div", "wp-pickset"));
    fly.style.left = num((r.left - wr.left) / k); fly.style.top = num((r.top - wr.top) / k);
    fly.style.width = num(r.width / k); fly.style.height = num(r.height / k);
    wp.append(fly);
    pre.fly = fly;
    tile.classList.add("is-away");
    wp.classList.add("is-pre");
    paintHi();
    fly.getBoundingClientRect();   // chốt vị trí đầu trước khi đổi sang vị trí cuối (để có chuyển động)
    fly.classList.add("is-lit");
    fly.style.left = num(G.gx); fly.style.top = num(G.top); fly.style.width = num(G.cardW); fly.style.height = num(G.cardH);
    obody.innerHTML = ""; obody.classList.add("is-loading"); obody.append(el("div", "aw-wp-spin"));
    paintBar(); runSeg.innerHTML = ""; runSeg.classList.remove("on");
    optEl.classList.add("on");
    wait(() => { readyBtn.classList.add("on"); xBtn.classList.add("on"); }, 380);
    // 2) lưu lựa chọn TEXT/VOICE + bộ nghĩa + template chơi cuối (y như trước), rồi dựng game NGẦM
    await mountBehind();
  }

  async function mountBehind() {
    if (!pre) return;
    const me = pre;
    const type = pre.type, sel = curSel();
    try { await ensureTemplate(type); } catch (e) { console.warn("AWord: template load failed", e); }
    try { await setLastTemplate(node.id, type, sel); } catch (e) { console.warn("AWord: could not remember the pick", e); }
    if (pre !== me) return;   // thầy đã đóng khung trong lúc chờ
    node.options = { ...(node.options || {}), ...sel };
    if (type === node.type) delete node.lastTpl; else node.lastTpl = type;
    if (!me.host) {
      me.rootPos = root.style.position;
      if (!me.rootPos) root.style.position = "relative";   // container ngầm neo đúng đầu trang này
      me.host = el("div", "aw-wp-gamehost");
      root.append(me.host);
      // Game 3D trọn màn (Train Rush `.aw-tr-host`, Star Loot `.aw-sl-host`) gắn ô của nó vào <body>, ngoài
      // container ngầm ⇒ lớp này giấu chúng cho tới READY (words-picker.css).
      document.documentElement.classList.add("aw-wp-ngam");
    }
    me.boot = true;
    setPreflight({ onMount: api => onBoard(me, api) });
    // noAutoFight: Fight do màn chọn quyết (thanh MODE), không tự vào như mở act thường.
    startGame(me.host, node, { onExit: exit, noAutoFight: true });
  }

  // Engine báo: một bàn vừa dựng xong (single / bàn 0 của trận / bàn mượn Running·IPA).
  function onBoard(me, api) {
    if (pre !== me) return;
    me.api = api;
    if (me.done) {   // READY đã bấm, Apply vừa dựng lại bàn ⇒ làm nốt việc còn lại rồi thôi nghe
      setPreflight(null);
      runAfter(me, api);
      return;
    }
    if (!me.avail) me.avail = { fight: api.can.fight, showdown: api.can.showdown, running: api.can.running.slice(), ipa: api.can.ipa, ownFight: api.ownFight };
    if (me.boot) {
      me.boot = false;
      if (!me.intent) me.intent = api.fightFirst && me.avail.fight ? "fight" : "single";
      // mode cần dựng lại bàn ⇒ gọi đúng cửa của nó, chờ lần báo kế
      if (me.intent === "fight" && !me.avail.ownFight && api.setMode("fight")) return;
      if (me.intent === "running" && api.setMode("running", me.sub)) return;
      if (me.intent === "ipa" && api.setMode("ipa")) return;
    }
    if (api.mode === "running") me.sub = api.type;
    obody.innerHTML = "";
    const inner = el("div", "aw-wp-oin");
    obody.append(inner);
    api.embedOptions(inner);
    obody.classList.remove("is-loading");
    paintBar(); paintRun();
    fitPanel();
    // ảnh vẽ chữ/ô trượt có thể tự đo lại sau một nhịp — đo lại lần nữa cho chắc
    requestAnimationFrame(() => fitPanel());
  }

  // ⭐ KHÔNG CUỘN: bảng Options thật viết theo px; phóng nó to ra cho vừa khung rồi CO ĐỀU lại nếu cao quá.
  function fitPanel() {
    const inner = obody.querySelector(".aw-wp-oin");
    if (!inner || !inner.firstChild) return;
    const bw = obody.clientWidth, bh = obody.clientHeight;
    if (!bw || !bh) return;
    let z = Math.max(.7, Math.min(1.9, bw / 620));
    for (let i = 0; i < 4; i++) {
      inner.style.zoom = z; inner.style.width = (bw / z) + "px";
      const h = inner.getBoundingClientRect().height;   // đã nhân zoom
      if (h <= bh + .5) break;
      z = Math.max(.45, z * (bh / h) * .995);
    }
  }
  if (window.ResizeObserver) { const ro = new ResizeObserver(() => { if (pre && !obody.classList.contains("is-loading")) fitPanel(); }); ro.observe(obody); }

  function curMode() {
    if (!pre || !pre.api) return pre && pre.intent;
    return pre.intent || pre.api.mode;
  }
  function modeOk(k) {
    const a = pre && pre.avail;
    if (!a) return k === "single";
    if (k === "single") return true;
    if (k === "fight") return a.fight;
    if (k === "showdown") return a.showdown;
    if (k === "running") return a.running.length > 0;
    if (k === "ipa") return a.ipa;
    return false;
  }
  function paintBar() {
    const cur = curMode() || "single";
    const i = Math.max(0, MODES.findIndex(m => m[0] === cur));
    mth.style.transform = `translateX(calc(${i} * (100% + 3 * var(--p))))`;
    mbar.querySelectorAll("button").forEach(b => {
      const ok = modeOk(b.dataset.pm);
      b.classList.toggle("on", b.dataset.pm === cur);
      b.classList.toggle("no", !ok);
      b.title = ok ? "" : "Not for this game";
    });
  }
  function paintRun() {
    const show = curMode() === "running" && pre.avail && pre.avail.running.length > 1;
    runSeg.classList.toggle("on", !!show);
    runSeg.innerHTML = "";
    if (!show) return;
    pre.avail.running.forEach(t => {
      const b = el("button", t === pre.sub ? "on" : "", RUN_LABEL[t] || t);
      b.type = "button";
      b.onclick = () => { if (t === pre.sub || !pre.api) return; pre.sub = t; loading(); if (!pre.api.setMode("running", t)) onBoard(pre, pre.api); };
      runSeg.append(b);
    });
  }
  function loading() { obody.innerHTML = ""; obody.classList.add("is-loading"); obody.append(el("div", "aw-wp-spin")); }

  // Thanh MODE: đổi mode thật (dựng lại bàn) — trừ SHOWDOWN và Fight của trận riêng trọn màn (chỉ ghi ý định,
  // bàn đứng single để chọn options; READY xong mới mở).
  function pickMode(k) {
    if (!pre || !pre.api || pre.done || !modeOk(k) || obody.classList.contains("is-loading")) return;
    if (curMode() === k) return;
    pre.intent = k;
    paintBar(); paintRun();
    const api = pre.api;
    let target = k;
    if (k === "showdown" || (k === "fight" && pre.avail.ownFight)) target = "single";
    if (k === "running" && !pre.sub) pre.sub = pre.avail.running[0];
    if (api.mode === target && (target !== "running" || api.type === pre.sub)) { paintRun(); return; }   // bàn đã đúng: chỉ đổi ý định
    loading();
    if (!api.setMode(target, pre.sub)) onBoard(pre, api);   // không dựng lại được ⇒ gắn lại bảng cũ
  }

  // TEXT/VOICE hay bộ nghĩa đổi khi khung đang mở ⇒ lưu + dựng lại bàn với lựa chọn mới (mỗi bộ có Options riêng).
  function preSelChanged() {
    if (!pre || pre.done) return;
    paintPickset();
    if (pre.api) pre.api.close();
    loading();
    mountBehind();
  }

  function ready() {
    if (!pre || pre.done || !pre.api || obody.classList.contains("is-loading")) return;
    const me = pre;
    me.done = true;
    clearLater();
    readyBtn.classList.add("go");
    me.after = me.intent === "showdown" ? "showdown" : (me.intent === "fight" && me.avail.ownFight ? "fight" : null);
    const hadChanges = me.api.apply();   // Apply thật (nếu có gì đổi) — engine dựng lại bàn ⇒ onBoard(done)
    setPickUrl(me.type, curSel());       // myActivity: cột theo mở đúng lựa chọn
    if (!hadChanges) { setPreflight(null); runAfter(me, me.api); }
    else setTimeout(() => { if (!me.ran) { setPreflight(null); runAfter(me, me.api); } }, 1500);   // lỡ không có lần báo kế
    // hiện game: container ngầm hiện dần trên trang này, rồi trang này rời đi
    setTimeout(() => reveal(me), 320);
  }
  function runAfter(me, api) {
    if (me.ran) return;
    me.ran = true;
    const go = () => {
      if (me.after === "showdown") api.openShowdown();
      else if (me.after === "fight") api.enterFight();
    };
    if (me.revealed) go(); else me.go = go;
  }
  function reveal(me) {
    const host = me.host;
    off();
    if (host) {
      host.classList.add("is-in");
      document.documentElement.classList.remove("aw-wp-ngam");   // game 3D trọn màn hiện ra luôn
      const done = () => {
        host.classList.remove("aw-wp-gamehost", "is-in");
        page.remove();
        root.style.position = me.rootPos || "";
        me.revealed = true;
        if (me.go) { const g = me.go; me.go = null; g(); }
      };
      setTimeout(done, 300);
    }
  }

  function closePre() {
    if (!pre || pre.done) return;
    const me = pre;
    pre = null;
    clearLater();
    setPreflight(null);
    try { me.api && me.api.close(); } catch { /* bàn đã gỡ */ }
    // gỡ container ⇒ engine tự dọn ván (lưới an toàn "ván rời trang", Đợt 295) — kể cả ô 3D ở <body>
    if (me.host) { me.host.remove(); me.host = null; root.style.position = me.rootPos || ""; }
    document.documentElement.classList.remove("aw-wp-ngam");
    optEl.classList.remove("on"); readyBtn.classList.remove("on", "go"); xBtn.classList.remove("on");
    wp.classList.remove("is-pre");
    // ô bay ngược về chỗ cũ trong lưới
    const k = kOf(), wr = wp.getBoundingClientRect(), r = me.tile.getBoundingClientRect();
    me.fly.classList.remove("is-lit");
    me.fly.style.left = num((r.left - wr.left) / k); me.fly.style.top = num((r.top - wr.top) / k);
    me.fly.style.width = num(r.width / k); me.fly.style.height = num(r.height / k);
    setTimeout(() => { me.fly.remove(); me.tile.classList.remove("is-away"); paintHi(); }, 520);
    paintHi();
  }

  // ---- chọn xong ⇒ ghi lựa chọn rồi vào game bằng đúng đường mở act thường (ĐIỆN THOẠI; máy tính: openPre) ----
  async function pick(type) {
    if (st.busy || !usable(type)) return;
    st.busy = true;
    const btn = wp.querySelector(`[data-t="${type}"]`);
    if (btn) btn.classList.add("is-loading");
    const sel = { contentVariant: st.text };
    if (voiceSets) { sel.contentMode = st.mode; sel.voiceVariant = st.voice; }
    try { await ensureTemplate(type); } catch (e) { console.warn("AWord: template load failed", e); }
    // store ghi Firebase (selector + lastTpl). ⚠️ Không chặn việc vào game nếu mạng lỗi.
    try { await setLastTemplate(node.id, type, sel); } catch (e) { console.warn("AWord: could not remember the pick", e); }
    // và chép lên chính object đang cầm (có thể không phải bản đệm của store)
    node.options = { ...(node.options || {}), ...sel };
    if (type === node.type) delete node.lastTpl; else node.lastTpl = type;
    off();
    setPickUrl(type, sel);   // myActivity: địa chỉ mang lựa chọn ⇒ chép sang cột theo, chúng mở theo
    startGame(root, node, { onExit: exit });
  }

  paint();
  return true;
}

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
