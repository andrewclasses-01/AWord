// =============================================================
// core/words-picker-art.js — HÌNH VẼ 2D PHẲNG CỦA MÀN CHỌN ACT WORDS (Đợt 453)
// Sinh từ bản thiết kế D:\OTHERS\CLAUDE\AWord - thiet ke man chon WORDS\man-chon-v6.html
// (bộ C "Flat color" thầy chọn 04/10/2026). Các class trong SVG là VAI (f main · s second ·
// a accent · i inner · c bề mặt trắng · k chữ ...) — màu do core/words-picker.css quyết,
// KHÔNG tô thẳng ở đây. Thuần chuỗi SVG, không đụng DOM.
// =============================================================
const star=(cx,cy,R,r)=>{let p=[];for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,k=i%2?r:R;p.push((cx+k*Math.cos(a)).toFixed(1)+","+(cy+k*Math.sin(a)).toFixed(1))}return p.join(" ")};
const S=(x,y,R,c="s")=>`<path class="${c}" d="M${x} ${y-R}Q${x} ${y} ${x+R} ${y}Q${x} ${y} ${x} ${y+R}Q${x} ${y} ${x-R} ${y}Q${x} ${y} ${x} ${y-R}Z"/>`;
const T=(cls,x,y,s,t)=>`<text class="${cls}" x="${x}" y="${y}" text-anchor="middle" font-size="${s}">${t}</text>`;

/* ---- 11 glyphs on a 64 grid ---- */
const G={
quiz:`<path class="f" d="M14 12H50Q55 12 55 17V37Q55 42 50 42H35L22 53V42H14Q9 42 9 37V17Q9 12 14 12Z"/>${T("t",32,35,26,"?")}<circle class="a" cx="53" cy="11" r="4.6"/>`,
anagram:`<g transform="rotate(-10 12.5 36)"><rect class="c" x="4" y="26" width="17" height="21" rx="5"/>${T("k",12.5,41,14,"T")}</g><rect class="c" x="23.5" y="18" width="17" height="21" rx="5"/>${T("k",32,33,14,"A")}<g transform="rotate(10 51.5 36)"><rect class="c" x="43" y="26" width="17" height="21" rx="5"/>${T("k",51.5,41,14,"C")}</g><circle class="a" cx="32" cy="52" r="3.6"/>`,
match:`<g transform="rotate(-8 18 28)"><rect class="c" x="6" y="11" width="24" height="30" rx="6"/><circle class="a" cx="18" cy="26" r="6.5"/></g><g transform="rotate(8 42 35)"><rect class="c" x="30" y="19" width="24" height="30" rx="6"/><circle class="a" cx="42" cy="34" r="6.5"/></g><circle class="f" cx="32" cy="51" r="9.5"/><path class="ck" d="M27.5 51l3.6 3.6 6-7"/>`,
type:`<rect class="c" x="9" y="11" width="46" height="40" rx="11"/><rect class="sh" x="15" y="16" width="34" height="26" rx="7"/>${T("k",28,38,22,"A")}<rect class="a" x="39" y="22" width="3.4" height="16" rx="1.7"/>`,
box:`<path class="r" d="M19 15L13 11M45 15L51 11M32 6V2"/><polygon class="a" points="${star(32,19,9.5,4.2)}"/><rect class="f" x="12" y="33" width="40" height="22" rx="5"/><rect class="a" x="29" y="33" width="6" height="22"/><g transform="rotate(-12 10 32)"><rect class="s" x="7" y="24" width="48" height="10" rx="4"/><rect class="a" x="29" y="24" width="6" height="10"/></g>`,
show:`${S(11,16,6)}${S(54,14,5)}<rect class="f" x="9" y="43" width="46" height="11" rx="5.5"/><path class="a" d="M15 43Q15 21 32 21Q49 21 49 43Z"/><path class="hl" d="M23 36Q24.5 29 31 27"/>`,
mole:`<ellipse class="h" cx="32" cy="48" rx="21" ry="7"/><circle class="s" cx="19" cy="29" r="4.5"/><circle class="s" cx="45" cy="29" r="4.5"/><path class="f" d="M14 48Q14 20 32 20Q50 20 50 48Z"/><circle class="e" cx="25.5" cy="35" r="2.8"/><circle class="e" cx="38.5" cy="35" r="2.8"/><ellipse class="a" cx="32" cy="42" rx="4.5" ry="3.3"/><path class="h" d="M11 48A21 7 0 0 0 53 48Z"/><g transform="translate(51 5) rotate(30)"><rect class="s" x="-1.7" y="0" width="3.4" height="22" rx="1.7"/><rect class="a" x="-8.5" y="-6" width="17" height="11" rx="4"/></g>`,
fruit:`<circle class="f" cx="31" cy="35" r="19"/><circle class="i" cx="31" cy="35" r="14.5"/><path class="sp" d="M31 22V48M18 35H44M22 26L40 44M40 26L22 44"/><path class="l" d="M42 15Q50 4 59 12Q51 21 42 15Z"/><path class="r soft" d="M6 28Q2 36 6 44M11 21Q5 36 11 51"/>`,
cross:(()=>{const L=[["C","A","T"],["O",0,"O"],["W",0,"P"]];let s="";L.forEach((r,j)=>r.forEach((c,i)=>{const x=8+i*17,y=8+j*17,cl=c==="A"?"a":(c?"c":"b");s+=`<rect class="${cl}" x="${x}" y="${y}" width="14" height="14" rx="3.5"/>`;if(c)s+=T("k",x+7,y+11.4,11.5,c)}));return s})(),
speak:`<rect class="f" x="25" y="7" width="14" height="27" rx="7"/><path class="r" d="M17 28Q17 45 32 45Q47 45 47 28"/><path class="r" d="M32 45V55M23 56H41"/><path class="r soft" d="M9 20Q6 28 9 36M55 20Q58 28 55 36"/><circle class="a" cx="52" cy="9" r="3.8"/>`,
speed:`<rect class="f" x="28.5" y="6" width="9" height="7" rx="2.5"/><rect class="f" x="46" y="10" width="8" height="6" rx="2.5" transform="rotate(40 50 13)"/><circle class="f" cx="33" cy="36" r="21"/><circle class="i" cx="33" cy="36" r="16"/><polygon class="a" points="36,23 25,38 31,38 28,50 41,33 35,33"/><path class="r soft" d="M3 30H9M2 38H8M5 46H11"/>`
};
/* colours: [main, accent, second, tint] — A uses main, B main+accent+tint, C/D all */
const COL={quiz:["#6c4ff5","#ffc928","#b9a8ff","#ece8ff"],anagram:["#2f7bff","#ff5d8f","#9cc3ff","#e4eeff"],match:["#ff8a1f","#1fbf75","#ffc58a","#ffeedc"],type:["#4a47d9","#ffc928","#b5b3f5","#e9e8ff"],box:["#ff7a2f","#ffd23f","#ffbf94","#ffeadb"],show:["#e91e78","#ffd23f","#f7a3c8","#ffe3ef"],mole:["#8a5a2b","#ff8fb0","#c9a066","#e2f5dc"],fruit:["#ff8a1f","#4cc36b","#ffc58a","#fff0dc"],cross:["#12a594","#ffc928","#8adcd0","#dff6f2"],speak:["#f0345f","#ffc928","#ffa0b4","#ffe4ea"],speed:["#12a8c9","#ffc928","#8ddcee","#ddf5fa"]};
const iconSvg=k=>{const [c,c2,c3,tint]=COL[k];return `<svg viewBox="0 0 64 64" style="--ln:${c};--c:${c};--c2:${c2};--c3:${c3};--tint:${tint}"><rect class="plate pr" x="2" y="2" width="60" height="60" rx="17"/><circle class="plate pc" cx="32" cy="32" r="30"/>${G[k]}</svg>`};

/* ---- 3 flat scenes on a 360×190 grid ---- */
const SC={
rocket:{name:"Rocket Race",v:"--ln:#5b3df0;--tint:#ece8ff;--c:#fff;--c2:#ff4d6d;--c3:#ffb347;--bg:#2a2f86;--sa:#ff9f43;--sb:#4b53c9;--gr:#2a2f86;--kd:#2a2f86",
 svg:()=>{let st="";[[22,24,1.8],[64,66,1.4],[112,30,1.8],[170,16,1.4],[236,40,2],[318,24,1.6],[344,76,1.4],[18,112,1.4],[88,98,1.2],[270,98,1.4],[206,66,1.2]].forEach(([x,y,r])=>st+=`<circle class="w" cx="${x}" cy="${y}" r="${r}"/>`);
 return `<rect class="bg" width="360" height="190"/>${st}${S(140,50,7,"w")}${S(48,150,5,"w")}
<circle class="sa" cx="306" cy="176" r="76"/><circle class="sb" cx="286" cy="150" r="13"/><circle class="sb" cx="330" cy="160" r="9"/><ellipse class="rg" cx="306" cy="176" rx="122" ry="20" transform="rotate(-18 306 176)"/>
<path class="r" d="M8 168L96 128M0 128L66 98M48 188L128 152" style="stroke-width:3"/>
<g transform="translate(184 96) rotate(40)"><path class="a" d="M-9 36Q0 90 9 36Z"/><path class="a" d="M-14 6L-31 38L-14 31Z"/><path class="a" d="M14 6L31 38L14 31Z"/><path class="f" d="M0-52C22-32 20 20 13 36H-13C-20 20-22-32 0-52Z"/><path class="a" d="M0-52C10-44 15-37 17-29H-17C-15-37-10-44 0-52Z"/><circle class="kd" cx="0" cy="-6" r="10"/><circle class="w" cx="0" cy="-6" r="6"/></g>`}},
train:{name:"Train Rush",v:"--ln:#ff7a1a;--tint:#fff0e0;--c:#e63946;--c2:#ffe066;--c3:#a52a3a;--bg:#ffc47a;--sa:#ff9a62;--sb:#e8634a;--gr:#4a2c5e;--kd:#2b1a3d",
 svg:()=>`<rect class="bg" width="360" height="190"/><circle class="a" cx="296" cy="62" r="28"/>
<path class="sa" d="M0 142L58 98L110 132L168 86L230 136L290 106L360 142V190H0Z"/><path class="sb" d="M0 160L70 128L138 156L214 122L290 158L360 136V190H0Z"/><rect class="gr" y="160" width="360" height="30"/>
<path class="r" d="M0 177H360" style="stroke-width:3"/>
<rect class="s" x="6" y="136" width="42" height="26" rx="5"/><rect class="s" x="52" y="136" width="42" height="26" rx="5"/><rect class="w" x="13" y="143" width="9" height="9" rx="2"/><rect class="w" x="27" y="143" width="9" height="9" rx="2"/><rect class="w" x="59" y="143" width="9" height="9" rx="2"/><rect class="w" x="73" y="143" width="9" height="9" rx="2"/>
<rect class="f" x="132" y="128" width="96" height="30" rx="15"/><rect class="s" x="96" y="106" width="48" height="52" rx="6"/><rect class="kd" x="91" y="101" width="58" height="9" rx="4"/><rect class="w" x="106" y="118" width="26" height="18" rx="4"/><rect class="kd" x="198" y="104" width="14" height="26" rx="2"/><rect class="a" x="134" y="142" width="92" height="4"/><circle class="a" cx="228" cy="143" r="5"/>
<circle class="kd" cx="116" cy="165" r="11"/><circle class="kd" cx="158" cy="165" r="11"/><circle class="kd" cx="194" cy="165" r="11"/><circle class="w" cx="116" cy="165" r="3.4"/><circle class="w" cx="158" cy="165" r="3.4"/><circle class="w" cx="194" cy="165" r="3.4"/>
<circle class="w" cx="205" cy="92" r="8"/><circle class="w" cx="218" cy="76" r="11"/><circle class="w" cx="238" cy="58" r="14"/><circle class="w" cx="262" cy="40" r="16"/>`},
loot:{name:"Star Loot",v:"--ln:#0f9d8a;--tint:#dcf6f1;--c:#fff;--c2:#ffd23f;--c3:#0f9d8a;--bg:#12385a;--sa:#1aa7a1;--sb:#0e4b6e;--gr:#0e4b6e;--kd:#12385a",
 svg:()=>`<rect class="bg" width="360" height="190"/><rect class="sb" x="60" y="14" width="240" height="162" rx="18"/>
<rect class="sa" x="60" y="14" width="240" height="14" rx="7"/><rect class="sa" x="60" y="162" width="240" height="14" rx="7"/><rect class="sa" x="60" y="14" width="14" height="162" rx="7"/><rect class="sa" x="286" y="14" width="14" height="162" rx="7"/>
<rect class="sa" x="104" y="28" width="14" height="70" rx="7"/><rect class="sa" x="104" y="84" width="54" height="14" rx="7"/><rect class="sa" x="204" y="92" width="52" height="14" rx="7"/><rect class="sa" x="242" y="92" width="14" height="70" rx="7"/><rect class="sa" x="150" y="140" width="62" height="14" rx="7"/>
<circle class="a" cx="89" cy="56" r="6"/><circle class="a" cx="89" cy="104" r="6"/><circle class="a" cx="150" cy="52" r="6"/><circle class="a" cx="212" cy="52" r="6"/><circle class="a" cx="272" cy="122" r="6"/><circle class="a" cx="130" cy="122" r="6"/>
<polygon class="a" points="${star(180,100,27,11.5)}"/>${S(228,52,7,"w")}${S(136,76,5,"w")}<circle class="f" cx="89" cy="150" r="10"/><circle class="kd" cx="86" cy="148" r="2"/><circle class="kd" cx="93" cy="148" r="2"/>`}
};
const sceneSvg=k=>`<svg class="art" viewBox="0 0 360 190" preserveAspectRatio="xMidYMid slice">${SC[k].svg()}</svg>`;


export { iconSvg, sceneSvg, SC };
