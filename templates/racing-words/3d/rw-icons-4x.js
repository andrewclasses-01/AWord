// RACING WORDS mẫu 4x (19/10/2026) — BỘ ICON 2D VẼ RIÊNG, kiểu A "NEON VIỀN" (thầy chọn ở thiet-ke-4w-icon.html) — thay mọi emoji trong game.
//   Lõi tối trong suốt + viền màu sáng dày + đường trắng mảnh giữa viền + quầng sáng (drop-shadow). Khung 32×32, KHÔNG dùng id (chèn nhiều bản không đụng nhau).
//   icon(tên, màu?) ⇒ chuỗi <svg class="rwi"> cao 1,15em, nằm cùng dòng chữ · iconize(chữ) ⇒ HTML: "[heart]" ⇒ icon tim (phần chữ còn lại được thoát HTML).
//   Tên: missile · heart · boost · ok · bad · warn · drone · hit.
export const ICON_COL = { missile: "#ff2020", heart: "#ff63c3", boost: "#2ee6c9", ok: "#38d39f", bad: "#ff5a5a", warn: "#f5c542", drone: "#b07cff", hit: "#ff8a3d" };
const SHAPES = {
  missile: { rot: 45, parts: [
    { k: "f", d: "M13 23 L19 23 L16 31 Z" },
    { k: "m", d: "M16 2 C19.2 5 20.5 8.5 20.5 11.5 L20.5 23 L11.5 23 L11.5 11.5 C11.5 8.5 12.8 5 16 2 Z" },
    { k: "d", d: "M11.5 16.5 L6.5 24 L11.5 22.5 Z M20.5 16.5 L25.5 24 L20.5 22.5 Z" },
    { k: "d", d: "M11.5 12 L20.5 12 L20.5 14 L11.5 14 Z" } ] },
  heart: { parts: [
    { k: "m", d: "M16 28.5 C6 21.5 2.8 15.6 2.8 10.8 C2.8 6.6 5.9 3.8 9.6 3.8 C12.5 3.8 14.6 5.5 16 7.8 C17.4 5.5 19.5 3.8 22.4 3.8 C26.1 3.8 29.2 6.6 29.2 10.8 C29.2 15.6 26 21.5 16 28.5 Z" } ] },
  boost: { parts: [
    { k: "m", d: "M19.5 1.5 L5.5 18.5 L14.2 18.5 L11.5 30.5 L26.5 12 L17.4 12 Z" } ] },
  ok: { parts: [
    { k: "m", d: "M3.5 16.8 L8.6 11.8 L13.2 16.4 L23.6 4.6 L28.8 9.4 L13.4 26.6 Z" } ] },
  bad: { parts: [
    { k: "m", d: "M7.6 3 L16 11.4 L24.4 3 L29 7.6 L20.6 16 L29 24.4 L24.4 29 L16 20.6 L7.6 29 L3 24.4 L11.4 16 L3 7.6 Z" } ] },
  warn: { parts: [
    { k: "m", d: "M16 2.5 C17 2.5 17.8 3 18.3 3.9 L30.2 25.4 C31.2 27.2 29.9 29.4 27.8 29.4 L4.2 29.4 C2.1 29.4 0.8 27.2 1.8 25.4 L13.7 3.9 C14.2 3 15 2.5 16 2.5 Z" },
    { k: "d", d: "M14.2 10 L17.8 10 L17.2 20.5 L14.8 20.5 Z M16 22.4 A2 2 0 1 1 16 26.4 A2 2 0 1 1 16 22.4 Z" } ] },
  drone: { parts: [
    { k: "d", d: "M8.5 10.5 L13 14 L14 13 L10.5 8.5 Z M23.5 10.5 L19 14 L18 13 L21.5 8.5 Z M8.5 21.5 L13 18 L14 19 L10.5 23.5 Z M23.5 21.5 L19 18 L18 19 L21.5 23.5 Z" },
    { k: "m", d: "M7.5 2.5 A5 5 0 1 1 7.5 12.5 A5 5 0 1 1 7.5 2.5 Z M24.5 2.5 A5 5 0 1 1 24.5 12.5 A5 5 0 1 1 24.5 2.5 Z M7.5 19.5 A5 5 0 1 1 7.5 29.5 A5 5 0 1 1 7.5 19.5 Z M24.5 19.5 A5 5 0 1 1 24.5 29.5 A5 5 0 1 1 24.5 19.5 Z" },
    { k: "m", d: "M12.5 11.5 L19.5 11.5 L21 16 L19.5 20.5 L12.5 20.5 L11 16 Z" } ] },
  hit: { parts: [
    { k: "m", d: "M16 2 A14 14 0 1 1 16 30 A14 14 0 1 1 16 2 Z M16 7 A9 9 0 1 0 16 25 A9 9 0 1 0 16 7 Z" },
    { k: "m", d: "M16 11.5 A4.5 4.5 0 1 1 16 20.5 A4.5 4.5 0 1 1 16 11.5 Z" },
    { k: "d", d: "M15 0 L17 0 L17 6 L15 6 Z M15 26 L17 26 L17 32 L15 32 Z M0 15 L6 15 L6 17 L0 17 Z M26 15 L32 15 L32 17 L26 17 Z" } ] },
};
const FLAME = "#f8d36b";
const cache = {};
/** icon kiểu Neon viền (chuỗi SVG) */
export function icon(name, col) {
  const sh = SHAPES[name]; if (!sh) return "";
  const c = col || ICON_COL[name], key = name + c; if (cache[key]) return cache[key];
  const body = sh.parts.map(p => p.k === "f" ? `<path d="${p.d}" fill="${FLAME}" stroke="#fff3c4" stroke-width="1"/>`
    : p.k === "d" ? `<path d="${p.d}" fill="${c}" opacity=".9"/>`
    : `<path d="${p.d}" fill="${c}" fill-opacity=".16" stroke="${c}" stroke-width="2.2"/><path d="${p.d}" fill="none" stroke="#fff" stroke-width=".7" opacity=".85"/>`).join("");
  const g = `<g fill-rule="evenodd" stroke-linejoin="round" stroke-linecap="round" style="filter:drop-shadow(0 0 1.5px ${c}) drop-shadow(0 0 4px ${c}99)">${body}</g>`;
  return (cache[key] = `<svg class="rwi rwi-${name}" viewBox="0 0 32 32" aria-hidden="true">${sh.rot ? `<g transform="rotate(${sh.rot} 16 16) translate(16 16) scale(1.14) translate(-16 -16)">${g}</g>` : g}</svg>`);
}
const esc = s => String(s).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
/** "+1 [heart] FROM DRONE" ⇒ HTML có icon */
export function iconize(text) { return String(text).split(/(\[[a-z]+\])/).map(p => { const m = /^\[([a-z]+)\]$/.exec(p); return m && SHAPES[m[1]] ? icon(m[1]) : esc(p); }).join(""); }
// cỡ chung: theo cỡ chữ chỗ đặt
if (typeof document !== "undefined" && !document.getElementById("rwi-css")) {
  const st = document.createElement("style"); st.id = "rwi-css";
  st.textContent = ".rwi{display:inline-block;width:1.15em;height:1.15em;vertical-align:-.22em;overflow:visible;flex:none}"
    + ".sr-res-rows .rw-dres b{white-space:nowrap}";   // dòng DRONE kết trận: icon + chữ không rớt dòng
  document.head.appendChild(st);
}
