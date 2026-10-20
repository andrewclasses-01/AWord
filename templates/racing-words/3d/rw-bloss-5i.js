// RACING WORDS mẫu 5i (20/10/2026) — PHẦN BOOST BỊ MẤT trên bàn đạp BOOST (dùng chung màn lớn sr3d-5i.js + iPad sr3d-padui-5i.js).
//   Thầy 20/10: "phần giảm sẽ hiện màu đỏ rồi xịt xuống và bốc khói đen ở cả bàn đạp boost".
//   · dải ĐỎ phủ đúng khúc năng lượng vừa mất (mức cũ → mức mới) trong khuôn bàn đạp (clip srgasclip của GAS_SVG), chớp sáng rồi XỊT XUỐNG (co về mức mới) + mờ dần.
//   · khói ĐEN bốc lên từ mép năng lượng mới (6 cụm HTML, chỉ transform + opacity — không filter: HUD đè canvas 4K, bẫy #13 của 5h).
//   CSS tự chèn 1 lần (LOSS_CSS) lúc dùng lần đầu ⇒ màn lớn và iPad dùng chung, không cần sửa danh sách CSS.
const NS = "http://www.w3.org/2000/svg";
const Y = f => 30 + 120 * (1 - Math.max(0, Math.min(1, f)));   // mép trên lớp năng lượng (viewBox bàn đạp 60 × 150: vùng nạp y 30 → 150)
const PUFFS = [[24, 52, 0, -14], [52, 64, 0.05, 6], [78, 50, 0.1, 16], [36, 46, 0.18, -22], [64, 56, 0.24, 18], [48, 48, 0.34, -4], [30, 40, 0.46, 10]];   // [x %, cỡ %, trễ s, trôi ngang %]

let cssOn = false;
export function lossFx(pedal, f0, f1) {
  if (!pedal || !(f0 > f1 + 0.004)) return;
  if (!cssOn) { cssOn = true; const st = document.createElement("style"); st.id = "rw-bloss-5i"; st.textContent = LOSS_CSS; document.head.appendChild(st); }
  const svg = pedal.querySelector("svg.sr-pedal-svg"), nf = svg && svg.querySelector(".sr-nfill");
  if (!svg || !nf) return;
  let r = svg.querySelector(".rw-nloss");
  if (!r) { r = document.createElementNS(NS, "rect"); r.setAttribute("class", "rw-nloss"); r.setAttribute("x", "0"); r.setAttribute("width", "60"); nf.parentNode.appendChild(r); }   // cùng nhóm clip ⇒ đúng khuôn bàn đạp
  const y0 = Y(f0), y1 = Y(f1);
  r.setAttribute("y", y0.toFixed(1)); r.setAttribute("height", Math.max(1.6, y1 - y0).toFixed(1));
  r.classList.remove("go"); void r.getBoundingClientRect(); r.classList.add("go");
  let sm = pedal.querySelector(".rw-psmk");
  if (!sm) { sm = document.createElement("i"); sm.className = "rw-psmk"; sm.setAttribute("aria-hidden", "true");
    sm.innerHTML = PUFFS.map(([x, s, d, dx]) => `<b style="--x:${x}%;--s:${s}%;--dl:${d}s;--dx:${dx}%"></b>`).join(""); pedal.appendChild(sm); }
  sm.style.setProperty("--sy", (y1 / 150 * 100).toFixed(1) + "%");
  sm.classList.remove("go"); void sm.offsetWidth; sm.classList.add("go");
}

const LOSS_CSS = `
.rw-nloss{fill:#ff2a2a;opacity:0;transform-box:fill-box;transform-origin:50% 100%;pointer-events:none}
.rw-nloss.go{animation:rwNloss5i 1.15s cubic-bezier(.3,.7,.4,1) forwards}
@keyframes rwNloss5i{0%{opacity:0;transform:none}7%{opacity:1;fill:#ff8a7a}22%{opacity:.95;fill:#ff2a2a;transform:none}100%{opacity:0;transform:scaleY(0)}}
.sr-root.is-paused .rw-nloss,.sr-root.is-paused .rw-psmk b{animation-play-state:paused}
.rw-psmk{position:absolute;left:0;right:0;top:var(--sy,50%);height:0;pointer-events:none;z-index:4}
.rw-psmk b{position:absolute;left:var(--x);top:0;width:var(--s);aspect-ratio:1;margin-left:calc(var(--s) / -2);transform:translateY(-50%) scale(.4);border-radius:50%;opacity:0;
  background:radial-gradient(circle,rgba(30,30,34,.95) 0,rgba(58,58,64,.85) 30%,rgba(120,122,130,.42) 52%,rgba(120,122,130,0) 70%)}   /* khói ĐEN có rìa xám sáng — đen tuyền chìm vào táp-lô tối */
.rw-psmk.go b{animation:rwPsmk5i 1.25s cubic-bezier(.2,.6,.4,1) var(--dl) forwards}
@keyframes rwPsmk5i{0%{opacity:0;transform:translate(0,-50%) scale(.4)}14%{opacity:.95}100%{opacity:0;transform:translate(var(--dx),-330%) scale(2.3)}}
`;
