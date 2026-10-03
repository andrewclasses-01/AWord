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
import { startGame, setWordsPickerHook } from "./engine.js";
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

// Act này có phải act WORDS cần màn chọn, và nơi mở có được phép hiện không?
export function wantsPicker(node) {
  if (!node || node.kind !== "act" || !variantsOf(node.content)) return false;
  let p = null;
  try { p = new URLSearchParams(location.search); } catch { /* ignore */ }
  if (p && p.get("go") === "1") return false;
  if (p && p.get("pick") === "1") return true;
  return !/Electron\//i.test((navigator && navigator.userAgent) || "");
}

export async function openWordsPicker(root, node, { onExit } = {}) {
  await loadCss();
  const sets = variantsOf(node.content);
  const voiceSets = voiceVariantsOf(node.content);        // null ⇒ act không có giọng đọc
  const opts = node.options || {};
  const exit = () => { setWordsPickerHook(null); if (onExit) onExit(); };
  // Nút GAMES trên màn START quay về đây (engine.js đọc hook này).
  setWordsPickerHook({ actId: node.id, open: r => openWordsPicker(r, node, { onExit }) });

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
      b.onclick = () => { st.mode = m; paint(); };
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
      if (st.mode === "voice") st.voice = k; else st.text = k;
      paint();
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

  // ---- về thư viện (cùng chỗ, cùng class với nút Home của game) ----
  const home = el("button", "aw-iconbtn aw-wp-home", icons.home);
  home.type = "button"; home.title = "Home"; home.setAttribute("aria-label", "Home");
  home.onclick = () => { off(); exit(); };
  wp.append(home);

  function wire(b, type) {
    if (!usable(type)) { b.classList.add("is-soon"); b.setAttribute("aria-disabled", "true"); b.title = "Doesn't fit this content"; }
    b.addEventListener("mouseenter", () => { st.hi = type; paintHi(); });
    b.addEventListener("focus", () => { st.hi = type; paintHi(); });
    b.onclick = () => pick(type);
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
    wp.querySelectorAll(".wp-card, .wp-tile").forEach(b => b.classList.toggle("hi", b.dataset.t === st.hi));
  }
  if (mq && mq.addEventListener) mq.addEventListener("change", paint);

  // ---- bàn phím (thầy dùng chuột/chạm là chính; mũi tên + Enter cho tiện) ----
  function onKey(e) {
    if (!wp.isConnected) { off(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    let i = ORDER.indexOf(st.hi);
    const k = e.key;
    if (k === "Enter") { e.preventDefault(); pick(st.hi); return; }
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

  // ---- chọn xong ⇒ ghi lựa chọn rồi vào game bằng đúng đường mở act thường ----
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
    startGame(root, node, { onExit: exit });
  }

  paint();
  return true;
}

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
