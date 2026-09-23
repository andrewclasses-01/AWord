// =============================================================
// WEREWOLF (ma sói) — the first FIXED game of AWord's GAMES tree (Đợt 373,
// 23/9/2026). Not a template: it never goes through core/engine.js or
// core/catalog.js, so it cannot be created, edited, converted or assigned —
// thầy's rule for everything in GAMES ("chỉ Claude tạo mới").
//
// A game-master screen for a LIVE class game: the teacher deals real cards,
// runs the night on an iPad (landscape), plays music over a Bluetooth speaker
// to cover the noise, and runs the day's vote on the same screen.
// Design approved over 5 rounds — D:\OTHERS\CLAUDE\AWord - thiet ke Werewolf\
// werewolf-v1…v5.html. Rules and the full hand-over: GHI CHU WEREWOLF.md.
//
//   mountWerewolf(root, ctx) -> dispose()
//     ctx.classes      {className: [{id, name}]}   (Settings › Classes)
//     ctx.data         {seats: {className: [studentId…]}}
//     ctx.saveSeats(className, order)
//     ctx.listTracks() / addTrack(file) / removeTrack(id)   (IndexedDB, ww-store.js)
//     ctx.onExit()
// Everything is scoped to `root` (class .ww, see werewolf.css).
// =============================================================

const BODY = `<div class="app" id="ww-shell">
  <aside class="side">
    <div class="brand">
      <div class="logo"><svg class="i" viewBox="0 0 24 24"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg></div>
      <div class="bt"><b>WEREWOLF</b><small id="subtitle">Game master</small></div>
      <button class="homebtn" id="wwHome" aria-label="Back to Games" title="Back to Games"><svg class="i" viewBox="0 0 24 24"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .7-1.53l7-6a2 2 0 0 1 2.6 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/></svg></button>
    </div>
    <div class="sec">
      <h4>Music<span class="sp"></span><span class="mini" id="autoLbl">Auto at night</span></h4>
      <div class="np"><div class="disc" id="disc"><svg class="i" viewBox="0 0 24 24"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg></div>
        <div class="t"><b id="trkName">—</b><small id="trkState">Paused</small></div></div>
      <div class="ctrl">
        <button class="sbtn" id="prevT" aria-label="Previous"><svg class="i" viewBox="0 0 24 24"><path d="M19 20 9 12l10-8v16Z"/><path d="M5 19V5"/></svg></button>
        <button class="pbtn" id="playT" aria-label="Play / pause"></button>
        <button class="sbtn" id="nextT" aria-label="Next"><svg class="i" viewBox="0 0 24 24"><path d="m5 4 10 8-10 8V4Z"/><path d="M19 5v14"/></svg></button>
        <button class="sbtn" id="fadeT" aria-label="Fade out" title="Fade out"><svg class="i" viewBox="0 0 24 24"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M22 9l-6 6"/><path d="m16 9 6 6"/></svg></button>
      </div>
      <div class="vol"><svg class="i" viewBox="0 0 24 24"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/></svg>
        <input type="range" id="vol" min="0" max="100" value="70" aria-label="Volume"><span id="volV">70%</span></div>
      <details class="tlist"><summary>Playlist ▾</summary>
        <div class="tracks" id="tracks"></div>
        <label class="addmp3"><input type="file" id="mp3" accept="audio/*" multiple>+ Add mp3 (kept on this device)</label>
      </details>
    </div>
    <div class="sec">
      <h4>Status</h4>
      <div class="score"><div class="w"><b id="wAlive">0</b><small>Wolves alive</small></div><div class="v"><b id="vAlive">0</b><small>Villagers alive</small></div></div>
      <div class="facts" id="facts"></div>
    </div>
    <div class="sec outsec">
      <h4>Out<span class="sp"></span><span class="mini" id="outN"></span></h4>
      <div class="outzone" id="outzone"></div>
    </div>
    <div class="sidefoot">
      <button id="rulesBtn">Rules</button>
      <button id="setBtn">Settings</button>
    </div>
  </aside>
  <main class="main" id="main">
    <div class="top" id="top"></div>
    <div class="ring" id="ring"></div>
  </main>
</div>`;

export function mountWerewolf(root, ctx = {}){
root.classList.add('ww');
root.innerHTML = BODY;
document.body.classList.add('ww-open');
let dead = false;

// ================================================================ ICONS
const P = {
  wolf:'<path d="M4 3l4 5h8l4-5v9l-2.5 3.5L12 21l-5.5-5.5L4 12Z"/><path d="M9 12h.01"/><path d="M15 12h.01"/><path d="M10.5 16.5h3"/>',
  flask:'<path d="M10 2v7.5L4.7 20.5a1 1 0 0 0 .9 1.5h12.8a1 1 0 0 0 .9-1.5L14 9.5V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/>',
  eye:'<path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0"/><circle cx="12" cy="12" r="3"/>',
  shield:'<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z"/>',
  target:'<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  home:'<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .7-1.53l7-6a2 2 0 0 1 2.6 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
  q:'<path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
  claw:'<path d="M6 4c1 5 1 11-2 16"/><path d="M12 3c1 6 1 12-2 18"/><path d="M18 4c1 5 1 11-2 16"/>',
  heart:'<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  skull:'<circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><path d="M8 20v2h8v-2"/><path d="M16 20a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20"/>',
  lock:'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  moon:'<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  vote:'<path d="m9 12 2 2 4-4"/><path d="M5 7c0-1.1.9-2 2-2h10a2 2 0 0 1 2 2v12H5V7Z"/><path d="M22 19H2"/>',
  play:'<polygon points="7 4 20 12 7 20 7 4" fill="currentColor"/>',
  pause:'<rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor"/><rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor"/>',
  reset:'<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  undo:'<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  check:'<path d="M20 6 9 17l-5-5"/>',
  x:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  ban:'<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
  arrow:'<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  chat:'<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  cards:'<rect x="2" y="6" width="14" height="16" rx="2"/><path d="M8 2h12a2 2 0 0 1 2 2v14"/>'
};
const ic = n => `<svg class="i" viewBox="0 0 24 24">${P[n]}</svg>`;

// ================================================================ DATA
const MAX_PLAYERS = 20;
const ROLE = {
  wolf:{vi:'Werewolf',icon:'wolf',c:'var(--wolf)',call:'WEREWOLVES'},
  witch:{vi:'Witch',icon:'flask',c:'var(--witch)',call:'WITCH'},
  seer:{vi:'Seer',icon:'eye',c:'var(--seer)',call:'SEER'},
  guard:{vi:'Bodyguard',icon:'shield',c:'var(--guard)',call:'BODYGUARD'},
  hunter:{vi:'Hunter',icon:'target',c:'var(--hunter)',call:'HUNTER'},
  villager:{vi:'Villager',icon:'home',c:'var(--villager)',call:'VILLAGERS'}
};
const ORDER = ['wolf','witch','seer','guard','hunter'];
const CLASSES_DEMO = {
  A1C:['Minh Anh','Gia Bảo','Khánh Linh','Đức Huy','Ngọc Hân','Tuấn Kiệt','Bảo Ngọc','Quang Minh','Thu Trang','Hoàng Nam','Phương Vy','Đăng Khoa','Hà My','Trung Kiên','Yến Nhi','Nhật Minh','Thảo Vy','Anh Thư'],
  B1B:['Mai Chi','Quốc Anh','Diệu Linh','Thanh Tùng','Hải Yến','Minh Khôi','Tú Anh','Việt Hoàng','Như Quỳnh','Gia Huy','Bảo Trâm','Phúc An','Kim Ngân','Hữu Phước'],
  'CLASS 20':['An Nhiên','Bình Minh','Chi Mai','Duy Anh','Giang Sơn','Hà Linh','Hải Đăng','Hằng Nga','Hiếu Minh','Hoa Mai','Gia Huy','Khánh Vy','Lâm Phong','Linh Chi','Long Nhật','Mai Anh','Nam Khánh','Ngân Hà','Phong Vũ','Quân Bảo']
};

// Class rolls come from Settings › Classes ({className: [{id, name}]}); the
// demo roll is only for the standalone test page.
const CLASSES = ctx.classes || Object.fromEntries(Object.entries(CLASSES_DEMO).map(([k,v])=>[k, v.map((n,i)=>({id:k+'_'+i, name:n}))]));
const SEATS = (ctx.data && ctx.data.seats) || {};
let S, uid = Date.now() % 1e6;
function seatOrder(cls, players){
  const saved = (SEATS[cls] || []).filter(id => players.some(p=>p.id===id));
  return saved.concat(players.map(p=>p.id).filter(id => !saved.includes(id)));
}
function saveSeats(){ if (!S.cls) return; SEATS[S.cls] = S.order.slice(); ctx.saveSeats && ctx.saveSeats(S.cls, S.order.slice()); }
function fresh(cls){
  const players = (cls ? CLASSES[cls] || [] : []).slice(0, MAX_PLAYERS).map(st=>({id:String(st.id || ('p'+(uid++))), name:st.name, benched:false, role:null, dead:false, out:false, died:''}));
  return { screen:'setup', setupStep:'roster', verdict:null, cls, players, order:seatOrder(cls, players), outSeq:[], sizeN:0,
    cfg:{wolf:3, witch:true, seer:true, guard:true, hunter:true},
    night:0, stepIdx:0, phase:'', n:{}, used:{save:false, poison:false}, lastGuard:null,
    hunter:{target:null, locked:false}, seen:{}, votes:{}, voteMode:false, showLines:true, dawn:null };
}
S = fresh(null);
const hist = [];
function snap(){ hist.push(JSON.stringify(S)); if (hist.length>80) hist.shift(); }
function undo(){ if(!hist.length) return; tick(); S = JSON.parse(hist.pop()); closeOv(); flip(render); }

const pl = id => S.players.find(p=>p.id===id);
const inGame = () => S.players.filter(p=>!p.benched);
const alive = () => inGame().filter(p=>!p.dead);
const holders = r => inGame().filter(p=>p.role===r);
const needOf = r => r==='wolf' ? S.cfg.wolf : 1;
const steps = () => ORDER.filter(r => r==='wolf' || S.cfg[r]);
const curRole = () => steps()[S.stepIdx];
const $ = s => root.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rc = r => (ROLE[r]||{c:'var(--unknown)'}).c;
// Who sits on the ring right now, in seating order. Leaving the ring closes the gap.
const ringPlayers = () => S.order.map(pl).filter(p => p && !p.benched && !(S.screen!=='setup' && p.out));

// ================================================================ RING LAYOUT
// Card size is fixed for the whole game (from the head-count at the start), so cards
// never jump in size; only their places change. Places are always spread EVENLY around
// the four sides — when someone leaves, the rest slide apart to close the gap.
function cardSize(W, H, N){
  const g = 12;
  for (let w = 176; w >= 80; w -= 2){
    const h = Math.round(w * .86);
    const ch = Math.floor((W + g) / (w + g)), cv = Math.max(0, Math.floor((H - 2*h - g) / (h + g)));
    if (ch >= 2 && 2*ch + 2*cv >= N) return {w, h, ch, cv};
  }
  return {w:80, h:69, ch:Math.max(2, Math.floor(W/92)), cv:Math.max(0, Math.floor((H-150)/81))};
}
function ringPositions(W, H, N, sz){
  const {w, h, ch, cv} = sz; if (!N) return [];
  const per = 2*W + 2*Math.max(0, H-2*h), share = N*W/per;
  let t = Math.min(ch, Math.max(1, Math.round(share))), b = Math.min(ch, Math.max(0, Math.round(share)));
  if (t + b > N) b = N - t;
  let rest = N - t - b, r = Math.min(cv, Math.ceil(rest/2)), l = Math.min(cv, rest - r), over = rest - r - l;
  while (over > 0){ if (t <= b && t < ch) t++; else if (b < ch) b++; else if (t < ch) t++; else break; over--; }
  const pos = [];
  const row = (k, y, rev) => { const xs = []; for (let i=0;i<k;i++) xs.push(k===1 ? (W-w)/2 : i*(W-w)/(k-1)); if (rev) xs.reverse(); xs.forEach(x=>pos.push({x, y})); };
  const col = (k, x, rev) => { const gap = (H-2*h-k*h)/(k+1), ys = []; for (let j=0;j<k;j++) ys.push(h+gap+j*(h+gap)); if (rev) ys.reverse(); ys.forEach(y=>pos.push({x, y})); };
  row(t, 0, false); col(r, W-w, false); row(b, H-h, true); col(l, 0, true);
  return pos;
}

// ================================================================ RENDER
let L = null;          // {w,h,pos:{id:{x,y}}}
const SAVE_KEY = 'aword-werewolf-game';
function saveGame(){ try { if (S.screen!=='setup') localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch {} }
function dropSavedGame(){ try { localStorage.removeItem(SAVE_KEY); } catch {} }
function render(){
  if (dead) return;
  saveGame();
  $('#ww-shell').classList.toggle('night', S.screen==='night');
  $('#ww-shell').classList.toggle('allvoted', allVoted());
  $('#top').innerHTML = topHTML();
  const ring = $('#ring'), W = ring.clientWidth, H = ring.clientHeight;
  const ps = ringPlayers();
  const sz = cardSize(W, H, S.screen==='setup' ? ps.length : (S.sizeN || ps.length));
  const pts = ringPositions(W, H, ps.length, sz);
  L = {w:sz.w, h:sz.h, pos:{}};
  ps.forEach((p,i)=>L.pos[p.id] = pts[i]);
  const eb = Math.round(Math.max(30, Math.min(54, sz.w*.34))), nf = Math.round(Math.max(13, Math.min(19, sz.w*.125)));
  let h = `<svg class="lines" id="lines"></svg>`;
  ps.forEach(p=>{ const s = L.pos[p.id];
    // cards on an edge grow inwards (the pulsing vote leader must never poke out of the frame)
    const ox = s.x < 1 ? 'left' : s.x > W-sz.w-1 ? 'right' : 'center', oy = s.y < 1 ? 'top' : s.y > H-sz.h-1 ? 'bottom' : 'center';
    h += cardHTML(p, `left:${s.x}px;top:${s.y}px;width:${sz.w}px;height:${sz.h}px;--eb:${eb}px;--nf:${nf}px;transform-origin:${ox} ${oy}`); });
  h += `<div class="hub" style="left:${sz.w+14}px;top:${sz.h+14}px;width:${W-2*sz.w-28}px;height:${H-2*sz.h-28}px"><div class="hubcard ${S.screen==='setup'?'setup':''}">${hubHTML()}</div></div>`;
  h += `<svg class="dragline" id="dragline"></svg>`;
  ring.innerHTML = h;
  renderSide();
  wire();
  drawLines();
}

function topHTML(){
  let title, list = [];
  if (S.screen==='setup'){
    title = `${ic('cards')} Setup`;
    list = [`<div class="clsbox"><button class="clsbtn ${S.cls?'':'empty'}" id="clsBtn">${S.cls?`Class <b>${esc(S.cls)}</b>`:'Choose class'}<svg class="i" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg></button>
      <div class="clsmenu" id="clsMenu" hidden>${Object.keys(CLASSES).map(c=>`<button class="clsopt ${c===S.cls?'on':''}" data-cls="${esc(c)}"><b>${esc(c)}</b><small>${Math.min(CLASSES[c].length,MAX_PLAYERS)} pupils</small></button>`).join('')}</div></div>`];
  }
  else if (S.screen==='night'){
    title = `${ic('moon')} NIGHT ${S.night}`;
    list = steps().map((r,i)=>`<span class="step ${i<S.stepIdx?'done':''} ${i===S.stepIdx?'cur':''}" style="--rc:${rc(r)}">${ic(ROLE[r].icon)}${ROLE[r].vi}</span>`);
    list.push(`<span class="step">${ic('sun')}Dawn</span>`);
  } else {
    title = `${ic('sun')} DAY ${S.night}`;
    list = [`<span class="step ${!S.voteMode?'cur':''}">${ic('chat')}Discussion</span>`, `<span class="step ${S.voteMode?'cur':''}">${ic('vote')}Vote</span>`];
  }
  return `<div class="phase">${title}</div><div class="steps">${list.join('')}</div>` + (S.screen==='setup'?'':`<button class="topbtn icon" id="undoBtn" aria-label="Undo" title="Undo">${ic('undo')}</button>`);
}

function cardHTML(p, style){
  const R = ROLE[p.role] || {vi:'Unknown', icon:'q'};
  const cls = ['card']; let pc = '', ribbon = null;
  if (!p.role) cls.push('unknown');
  const badges = [];
  const bd = (icon, color) => badges.push(`<span class="bd" style="--bc:${color}">${ic(icon)}</span>`);
  if (S.screen==='night'){
    const r = curRole(), n = S.n, ph = S.phase;
    if (p.role===r && ph!=='fake') cls.push('awake');
    if (ph==='assign'){ if (p.role && p.role!==r) cls.push('nope'); }
    else if (ph!=='fake' && ph!=='save'){ if (!validTarget(r,p) && p.role!==r) cls.push('nope'); }
    if (n.poison===p.id) ribbon = ['flask','Poison','var(--witch)'];
    else if (n.wolf===p.id) ribbon = n.save ? ['heart','Saved','var(--good)'] : ['claw','Bitten','var(--wolf)'];
    else if (n.guard===p.id) ribbon = ['shield','Protected','var(--guard)'];
    else if (r==='hunter' && S.hunter.target===p.id) ribbon = ['target','Hunter’s target','var(--hunter)'];
    else if (r==='guard' && S.lastGuard===p.id) ribbon = ['shield','Last night','#9AA3B8'];
    if (r==='seer' && n.seer===p.id) cls.push('seer-pick');
    const pick = {wolf:n.wolf, guard:n.guard, hunter:S.hunter.target, witch: ph==='poison' ? n.poison : n.wolf}[r];
    if (ph!=='assign' && ph!=='fake' && pick===p.id){ cls.push('pick'); pc = ribbon ? ribbon[2] : rc(r); }
    if (n.guard===p.id && ribbon && ribbon[1]!=='Protected') bd('shield','var(--guard)');
  }
  if (S.hunter.target===p.id && !(ribbon && ribbon[0]==='target')) bd(S.hunter.locked?'lock':'target','var(--hunter)');
  if (S.seen[p.id] && !(S.screen==='night' && curRole()==='seer' && S.n.seer===p.id)) bd('eye', p.role==='wolf'?'var(--wolf)':'var(--seer)');
  let votes = '';
  if (S.screen==='day'){
    const t = tally(), max = Math.max(0, ...Object.values(t));
    if (t[p.id] && !S.verdict){ votes = `<span class="votes">${t[p.id]}</span>`; if (t[p.id]===max) cls.push('top-vote'); }
  }
  return `<div class="${cls.join(' ')}" data-id="${p.id}" style="${style};--rc:${rc(p.role)};${pc?`--pc:${pc}`:''}">
    <div class="emb">${ic(R.icon)}</div>
    <div class="nm">${esc(p.name)}</div>
    ${ribbon && L.h < 120 ? '' : `<div class="rl">${R.vi}</div>`}
    <div class="badges">${badges.join('')}</div>
    ${ribbon?`<div class="ribbon" style="--bc:${ribbon[2]}">${ic(ribbon[0])}${ribbon[1]}</div>`:''}
    ${votes}
  </div>`;
}

function validTarget(r, p){
  if (p.dead) return false;
  if (r==='wolf') return p.role!=='wolf';
  if (r==='witch') return S.phase==='poison' && (!S.used.poison || !!S.n.poison);
  if (r==='seer') return p.role!=='seer';
  if (r==='guard') return p.id!==S.lastGuard;
  if (r==='hunter') return hunterCanPick() && p.role!=='hunter';
  return true;
}
function hunterCanPick(){ const t=S.hunter.target; if(!t || pl(t)?.dead) return true; return !S.hunter.locked; }

function hubHTML(){
  if (S.screen==='setup') return setupHub();
  const emb = (icon, color) => `<div class="emb hub-emb" style="--rc:${color}">${ic(icon)}</div>`;
  const sleep = last => `${ic('check')}Done · sleep${last?' → dawn':''}`;
  let head='', title='', sub='', btns='';
  if (S.screen==='night'){
    const r = curRole(), R = ROLE[r], n = S.n, last = S.stepIdx===steps().length-1; head = emb(R.icon, R.c);
    if (S.phase==='assign'){
      const got = holders(r).length, need = needOf(r);
      title = `Wake the ${R.call}`; sub = `<span class="count">${got}/${need}</span>`;
      btns = `<button class="btn pri" data-a="assigned" ${got===need?'':'disabled'}>${ic('check')}All marked</button>`;
    } else if (S.phase==='fake'){
      title = `${R.call} dead · fake call`;
      btns = `<button class="btn pri" data-a="next">${sleep(last)}</button>`;
    } else if (r==='wolf'){
      title = n.wolf ? `Wolves bite ${esc(pl(n.wolf).name)}` : 'Wolves choose';
      btns = `<button class="btn pri" data-a="next">${sleep(last)}</button>`;
    } else if (r==='witch' && S.phase==='save'){
      title = `Wolves bite ${esc(pl(n.wolf).name)}`;
      btns = `<button class="btn big good" data-a="save">${ic('heart')}SAVE</button><button class="btn big" data-a="nosave">${ic('x')}DON'T SAVE</button>`;
    } else if (r==='witch'){
      head = emb('flask', R.c);
      title = S.used.poison && !n.poison ? 'Poison used' : n.poison ? `Poison: ${esc(pl(n.poison).name)}` : 'Poison';
      btns = `<button class="btn pri" data-a="next">${sleep(last)}</button>`;
    } else if (r==='seer'){
      title = n.seer ? `Checked ${esc(pl(n.seer).name)}` : 'Seer';
      btns = `<button class="btn pri" data-a="next">${sleep(last)}</button>`;
    } else if (r==='guard'){
      title = n.guard ? `Protect ${esc(pl(n.guard).name)}` : 'Bodyguard';
      btns = `<button class="btn pri" data-a="next">${sleep(last)}</button>`;
    } else if (r==='hunter'){
      const t = S.hunter.target;
      title = !t ? 'Hunter' : hunterCanPick() ? `Hunter aims at ${esc(pl(t).name)}` : `Locked: ${esc(pl(t).name)}`;
      btns = `<button class="btn pri" data-a="next" ${t?'':'disabled'}>${sleep(last)}</button>`;
    }
  } else if (S.verdict){
    const v = S.verdict;
    if (v.out){ const p = pl(v.out), R = ROLE[p.role];
      head = `<div class="card static verdict" data-verdict="${p.id}" style="--rc:${rc(p.role)}"><div class="emb">${ic(R.icon)}</div><div class="nm">${esc(p.name)}</div><div class="rl">${R.vi}</div><div class="ribbon" style="--bc:var(--bad)">${ic('vote')}${v.n} votes</div></div>`;
      title = `${esc(p.name)} is out`;
    } else {
      head = `<div class="vtie">${v.ids.map(id=>{const p=pl(id);return `<div class="card static small" style="--rc:${rc(p.role)}"><div class="emb">${ic(ROLE[p.role].icon)}</div><div class="nm">${esc(p.name)}</div></div>`;}).join('')}</div>`;
      title = `Tie (${v.n}) · nobody is out`;
    }
    btns = `<button class="btn pri night" data-a="sleep">${ic('moon')}Sleep → Night ${S.night+1}</button>`;
  } else if (!S.voteMode){
    title = 'Discussion';
    head = `<div class="bigclock"><div class="clock" id="clock"></div>
      <div class="tctrl"><button class="tbtn" id="tStart" aria-label="Start / pause"></button><button class="tbtn soft" id="tReset" aria-label="Reset">${ic('reset')}</button></div>
      <div class="chips" id="tChips"></div></div>`;
    btns = `<button class="btn pri" data-a="vote">${ic('vote')}Open vote</button>`;
  } else {
    head = emb('vote','var(--primary)');
    const t = tally(), arr = Object.entries(t).sort((a,b)=>b[1]-a[1]), cast = Object.keys(S.votes).length, max = arr[0]?.[1]||0, tops = arr.filter(x=>x[1]===max);
    title = !cast ? 'Vote' : tops.length>1 ? `Tie (${max})` : `${esc(pl(tops[0][0]).name)} · ${max} votes`;
    sub = `<span class="count">${cast}/${alive().length}</span> voted`;
    if (arr.length) sub += `<div class="tallies">${arr.slice(0,4).map(([id,v])=>`<span class="tally">${esc(pl(id).name)}<b>${v}</b></span>`).join('')}</div>`;
    btns = `<button class="btn" data-a="clearvotes" ${cast?'':'disabled'}>Clear votes</button><button class="btn pri" data-a="confirmvote" ${allVoted()?'':'disabled'}>${ic('check')}Confirm</button>`;
  }
  return `${head}<h2>${title}</h2>${sub?`<div class="sub">${sub}</div>`:''}<div class="hbtns">${btns}</div>`;
}
const allVoted = () => S.screen==='day' && S.voteMode && !S.verdict && alive().length>0 && alive().every(p=>S.votes[p.id] && !pl(S.votes[p.id]).dead);

function setupHub(){
  if (!S.cls) return `<div class="emb hub-emb" style="--rc:var(--primary)">${ic('cards')}</div><h2>Choose a class</h2>`;
  if (S.setupStep==='roster'){
    const full = S.players.length>=MAX_PLAYERS;
    return `<h2>Class ${esc(S.cls)} · <span class="count">${S.players.length}</span> pupils</h2>
      <div class="roster">${S.players.map(p=>`<span class="rchip">${esc(p.name)}<button data-del="${p.id}" aria-label="Remove ${esc(p.name)}">${ic('x')}</button></span>`).join('')}</div>
      <form class="addrow" id="addForm"><input id="addName" placeholder="Add a name" autocomplete="off" ${full?'disabled':''}><button class="btn" type="submit" ${full?'disabled':''}>Add</button></form>
      <div class="hbtns"><button class="btn pri" id="rosterOk" ${S.players.length>=4?'':'disabled'}>${ic('check')}Confirm</button></div>`;
  }
  const on = inGame().length;
  const special = ['witch','seer','guard','hunter'].filter(r=>S.cfg[r]).length;
  const vill = on - S.cfg.wolf - special, ok = S.cfg.wolf>=1 && vill>=1 && S.cfg.wolf < on-S.cfg.wolf;
  const roleRow = r => `<div class="rc" style="--rc:${rc(r)}"><div class="emb">${ic(ROLE[r].icon)}</div><span class="n">${ROLE[r].vi}</span>${
    r==='wolf' ? `<div class="stepper"><button data-wolf="-1" aria-label="Fewer wolves">−</button><b>${S.cfg.wolf}</b><button data-wolf="1" aria-label="More wolves">+</button></div>`
    : r==='villager' ? `<div class="stepper" style="border:0;background:transparent"><b>${Math.max(vill,0)}</b></div>`
    : `<button class="tog ${S.cfg[r]?'on':''}" data-tog="${r}" aria-label="Toggle ${ROLE[r].vi}"></button>`}</div>`;
  return `<div class="rolegrid">${['wolf','villager','witch','seer','guard','hunter'].map(roleRow).join('')}</div>
    <div class="sumline"><button class="linkbtn" id="rosterBack">${ic('cards')}Class ${esc(S.cls)}</button> · <b>${on}</b> pupils · <b style="color:var(--wolf)">${S.cfg.wolf}</b> Werewolves · <b style="color:var(--good)">${on-S.cfg.wolf}</b> Villagers</div>
    <button class="ready" id="readyBtn" ${ok?'':'disabled'}>${ic('moon')} READY</button>`;
}

function renderSide(){
  if (dead) return;
  const inG = S.screen!=='setup', w = alive().filter(p=>p.role==='wolf').length;
  const firstNight = S.screen==='night' && S.night===1;
  $('#wAlive').textContent = !inG && !S.cls ? 0 : !inG || firstNight ? S.cfg.wolf : w;
  $('#vAlive').textContent = !inG ? Math.max(0, inGame().length - S.cfg.wolf) : firstNight ? alive().length - S.cfg.wolf : alive().length - w;
  const nm = id => id ? esc(pl(id).name) : '—', f = [];
  if (S.cfg.witch) f.push(`<div class="fact" style="color:var(--witch)">${ic('flask')}<span class="k">Witch:</span><b class="${S.used.save?'used':''}">Save</b>·<b class="${S.used.poison?'used':''}">Poison</b></div>`);
  if (S.cfg.guard) f.push(`<div class="fact" style="color:var(--guard)">${ic('shield')}<span class="k">Protected last night:</span><b>${nm(S.lastGuard)}</b></div>`);
  if (S.cfg.hunter) f.push(`<div class="fact" style="color:var(--hunter)">${ic(S.hunter.locked?'lock':'target')}<span class="k">Hunter aims at:</span><b>${nm(S.hunter.target)}</b></div>`);
  if (S.cfg.seer){ const k = Object.keys(S.seen); f.push(`<div class="fact" style="color:var(--seer)">${ic('eye')}<span class="k">Checked:</span><b>${k.length?k.map(id=>esc(pl(id).name)+(pl(id).role==='wolf'?' (Wolf)':'')).join(', '):'—'}</b></div>`); }
  $('#facts').innerHTML = inG ? f.join('') : '';
  const outs = S.outSeq.map(pl).filter(p=>p && (p.benched || p.out));
  $('#outN').textContent = outs.length ? outs.length+' em' : '';
  $('#outzone').innerHTML = outs.map(p=>`<div class="outp ${flyingIds.has(p.id)?'arriving':''} ${p.benched?'benched':''}" data-out="${p.id}" style="--rc:${p.benched?'#9AA3B8':rc(p.role)}">
      <span class="ri">${ic(p.benched?'ban':ROLE[p.role||'villager'].icon)}</span>
      <span class="tx"><b>${esc(p.name)}</b><small>${p.benched?'Sitting out':(ROLE[p.role]?.vi||'')+' · '+esc(p.died)}</small></span></div>`).join('');
  $('#subtitle').textContent = inG ? `Class ${S.cls} · ${inGame().length} pupils` : 'Game master';
  if (!inG) root.querySelectorAll('#outzone .benched').forEach(c=>c.onclick=()=>unbench(c.dataset.out));
}

// ================================================================ LINES (vote · hunter)
function tally(){ const t={}; for (const k in S.votes){ const v=S.votes[k]; if(pl(v)&&!pl(v).dead&&pl(k)&&!pl(k).dead) t[v]=(t[v]||0)+1; } return t; }
function box(id){ const s = L && L.pos[id]; if(!s) return null; return {x:s.x+L.w/2, y:s.y+L.h/2, hw:L.w/2, hh:L.h/2}; }
function edge(b, tx, ty){ const dx=tx-b.x, dy=ty-b.y; const k = Math.min(b.hw/Math.abs(dx||1e-6), b.hh/Math.abs(dy||1e-6)); return {x:b.x+dx*Math.min(1,k), y:b.y+dy*Math.min(1,k)}; }
function arrow(a, b, color, w, dash){
  const mx=(a.x+b.x)/2, my=(a.y+b.y)/2, dx=b.x-a.x, dy=b.y-a.y, len=Math.hypot(dx,dy)||1, bend=Math.min(40,len*.12);
  return `<path d="M${a.x},${a.y} Q${mx-dy/len*bend},${my+dx/len*bend} ${b.x},${b.y}" stroke="${color}" stroke-width="${w}" fill="none" stroke-linecap="round" ${dash?`stroke-dasharray="${dash}"`:''} marker-end="url(#ah-${color.replace('#','')})" opacity=".8"/>`;
}
const marker = c => `<marker id="ah-${c.replace('#','')}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${c}"/></marker>`;
function link(from, to, color, w, dash){ const A=box(from), B=box(to); return A&&B ? arrow(edge(A,B.x,B.y), edge(B,A.x,A.y), color, w, dash) : ''; }
function drawLines(){
  const svg = $('#lines'); if (!svg) return;
  let h = `<defs>${marker('#3346C9')}${marker('#E08A2E')}</defs>`;
  if (S.screen==='day' && !S.verdict) for (const k in S.votes) h += link(k, S.votes[k], '#3346C9', 2.5);
  const hu = holders('hunter')[0];
  if (S.screen==='night' && curRole()==='hunter' && S.phase==='act' && hu && S.hunter.target) h += link(hu.id, S.hunter.target, '#E08A2E', 4, '10 8');
  svg.innerHTML = h;
}

// ================================================================ SOUND — a very soft "tick" on every pick
let actx;
function ctx(){ if(!actx) actx=new (window.AudioContext||window.webkitAudioContext)(); if(actx.state==='suspended') actx.resume(); return actx; }
function tick(){
  try{ const c=ctx(), t=c.currentTime, o=c.createOscillator(), g=c.createGain(), f=c.createBiquadFilter();
    o.type='triangle'; o.frequency.setValueAtTime(2400,t); o.frequency.exponentialRampToValueAtTime(1300,t+.025);
    f.type='highpass'; f.frequency.value=900;
    g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(.05,t+.003); g.gain.exponentialRampToValueAtTime(.0001,t+.045);
    o.connect(f).connect(g).connect(c.destination); o.start(t); o.stop(t+.05); }catch{}
}
function beep(){ try{ const c=ctx(); [0,.35,.7].forEach(t=>{ const o=c.createOscillator(), g=c.createGain(); o.frequency.value=880; g.gain.setValueAtTime(.0001,c.currentTime+t); g.gain.exponentialRampToValueAtTime(.3,c.currentTime+t+.02); g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+t+.3); o.connect(g).connect(c.destination); o.start(c.currentTime+t); o.stop(c.currentTime+t+.32); }); }catch{} }

// ================================================================ ACTIONS
function wire(){
  const cb = $('#clsBtn'); if (cb) cb.onclick = e=>{ e.stopPropagation(); tick(); const m=$('#clsMenu'); m.hidden=!m.hidden; };
  root.querySelectorAll('[data-cls]').forEach(b=>b.onclick=()=>{ tick(); const cfg=S.cfg; S=fresh(b.dataset.cls); S.cfg=cfg; hist.length=0; flip(render); });
  root.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{ tick(); const id=b.dataset.del; S.players=S.players.filter(p=>p.id!==id); S.order=S.order.filter(x=>x!==id); S.outSeq=S.outSeq.filter(x=>x!==id); flip(render); });
  const ro = $('#rosterOk'); if (ro) ro.onclick = ()=>{ tick(); S.setupStep='roles'; render(); };
  const rbk = $('#rosterBack'); if (rbk) rbk.onclick = ()=>{ tick(); S.setupStep='roster'; render(); };
  root.querySelectorAll('[data-wolf]').forEach(b=>b.onclick=()=>{ tick(); S.cfg.wolf=Math.max(1,S.cfg.wolf+ +b.dataset.wolf); render(); });
  root.querySelectorAll('[data-tog]').forEach(b=>b.onclick=()=>{ tick(); S.cfg[b.dataset.tog]=!S.cfg[b.dataset.tog]; render(); });
  const f = $('#addForm'); if (f) f.onsubmit = e=>{ e.preventDefault(); const v=$('#addName').value.trim(); if(!v || S.players.length>=MAX_PLAYERS) return; tick();
    const p = {id:'p'+(uid++),name:v,benched:false,role:null,dead:false,out:false,died:''}; S.players.push(p); S.order.push(p.id); flip(render); setTimeout(()=>$('#addName')?.focus(),0); };
  const rb = $('#readyBtn'); if (rb) rb.onclick = ()=>{ tick(); startNight(); };
  const ub = $('#undoBtn'); if (ub) ub.onclick = undo;
  const ts = $('#tStart'); if (ts){ ts.onclick = ()=>{ tick(); timer.run ? timer.pause() : timer.start(); }; $('#tReset').onclick = ()=>{ tick(); timer.pause(); timer.set(timer.total); }; timer.paint(); }
  root.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{ tick(); action(b.dataset.a); });
}
function unbench(id){ tick(); const p = pl(id); p.benched = false; S.outSeq = S.outSeq.filter(x=>x!==id); flip(render); }

function startNight(){
  snap();
  if (dead) return;
  if (S.screen==='setup'){ S.players.forEach(p=>{p.role=null;p.dead=false;p.out=false;p.died='';}); S.night=0; S.sizeN = inGame().length; saveSeats(); }
  S.night++; S.screen='night'; S.stepIdx=0; S.n={}; S.votes={}; S.voteMode=false; S.dawn=null; S.verdict=null;
  enterStep(); render();
  if (settings.autoMusic) music.fadeIn();
}
function enterStep(){
  const r = curRole();
  if (S.night===1 && holders(r).length < needOf(r)) S.phase='assign';
  else if (!holders(r).some(p=>!p.dead)) S.phase='fake';
  else S.phase = r==='witch' ? witchFirst() : 'act';
}
// Witch: SAVE / DON'T SAVE first (only if there is someone to save and the potion is left), then POISON.
const witchFirst = () => (S.n.wolf && !S.used.save) ? 'save' : 'poison';
function nextStep(){
  if (curRole()==='hunter' && S.phase==='act' && S.night>=2 && S.hunter.target) S.hunter.locked = true;
  if (S.stepIdx < steps().length-1){ S.stepIdx++; enterStep(); render(); } else dawn();
}
function action(a){
  const n = S.n;
  if (a==='assigned'){ snap(); S.phase = curRole()==='witch' ? witchFirst() : 'act'; render(); return; }
  if (a==='next'){
    const r = curRole(), empty = S.phase==='act' && ((r==='wolf' && !n.wolf) || (r==='guard' && !n.guard));
    if (empty) return confirmBox(r==='wolf' ? 'No bite tonight?' : 'Protect nobody tonight?', ()=>{ snap(); nextStep(); });
    snap(); nextStep(); return; }
  if (a==='confirmvote'){ confirmVote(); return; }
  if (a==='nokill'){ snap(); n.wolf=null; n.wolfNone=true; render(); return; }
  if (a==='noguard'){ snap(); n.guard=null; n.guardNone=true; render(); return; }
  if (a==='save'){ snap(); n.save=true; S.used.save=true; S.phase='poison'; render(); return; }
  if (a==='nosave'){ snap(); S.phase='poison'; render(); return; }
  if (a==='timer'){ timer.start(); return; }
  if (a==='vote'){ snap(); S.voteMode=true; timer.pause(); render(); return; }
  if (a==='lines'){ S.showLines=!S.showLines; render(); return; }
  if (a==='clearvotes'){ snap(); S.votes={}; render(); return; }
  if (a==='sleep'){ timer.pause(); sleepFromVerdict(); return; }
}

function tapCard(id){
  const p = pl(id);
  if (S.screen==='night'){
    const r = curRole(), n = S.n;
    if (S.phase==='assign'){
      if (p.role && p.role!==r) return;
      if (p.role!==r && holders(r).length>=needOf(r)) return;
      snap(); tick(); p.role = p.role===r ? null : r; render(); return;
    }
    if (S.phase==='fake' || S.phase==='save' || !validTarget(r,p)) return;
    snap(); tick();
    if (r==='wolf'){ n.wolf = n.wolf===id?null:id; n.wolfNone=false; }
    if (r==='witch'){ n.poison = n.poison===id?null:id; S.used.poison = !!n.poison; }
    if (r==='seer'){ if (n.seer && S.seen[n.seer]===S.night) delete S.seen[n.seer];
      if (n.seer===id) n.seer=null; else { n.seer=id; if (!S.seen[id]) S.seen[id]=S.night; } }
    if (r==='guard'){ n.guard = n.guard===id?null:id; n.guardNone=false; }
    if (r==='hunter'){ S.hunter.target = id; }
    render(); return;
  }
  if (S.screen==='day' && S.voteMode && S.votes[id]){ snap(); tick(); delete S.votes[id]; render(); }
}

function dawn(){
  const n = S.n, g = n.guard, dead = new Map();
  const kill = (id, why) => { if (id && id!==g && !pl(id).dead && !dead.has(id)) dead.set(id, why); };
  if (n.wolf && !n.save) kill(n.wolf, 'Bitten');
  if (n.poison) kill(n.poison, 'Poison');
  const h = holders('hunter')[0];
  if (h && dead.has(h.id) && S.hunter.target) kill(S.hunter.target, 'Taken by the Hunter');
  if (S.night===1) inGame().forEach(p=>{ if(!p.role) p.role='villager'; });
  dead.forEach((why,id)=>{ const p=pl(id); p.dead=true; p.died=`Night ${S.night} · ${why}`; });
  if (S.hunter.target && pl(S.hunter.target).dead){ S.hunter.target=null; S.hunter.locked=false; }
  S.lastGuard = g || null;
  S.dawn = {dead:[...dead].map(([id,why])=>({id,why}))};
  if (settings.autoMusic) music.fadeOut();
  showDawn();
}
function goDay(){
  snap(); timer.pause(); timer.set(timer.total); S.screen='day'; S.voteMode=false; S.votes={};
  const ids = S.dawn.dead.map(x=>x.id);
  if (!ids.length){ closeOv(); render(); return; }
  flyOut(ids, checkWin, id => root.querySelector(`.dawn [data-dead="${id}"]`));
}
function voteOut(id){
  const p = pl(id); snap(); tick();
  if (!p.dead){ p.dead=true; p.died=`Day ${S.night} · Voted out`; if (S.hunter.target===id){ S.hunter.target=null; S.hunter.locked=false; } }
  S.votes={}; S.voteMode=false;
  flyOut([id], checkWin);
}
function bench(id){ tick(); flyOut([id], null, null, p=>{ p.benched=true; }); }
function checkWin(){
  if (inGame().some(p=>!p.role)) return;
  const w = alive().filter(p=>p.role==='wolf').length, v = alive().length - w;
  const win = w===0 ? 'dan' : (w>=v ? 'soi' : null);
  if (win) setTimeout(()=>showWin(win), 300);
  return !!win;
}

// Vote confirmed: the most-voted pupil leaves the ring and flies to the centre.
function confirmVote(){
  const t = tally(), arr = Object.entries(t).sort((a,b)=>b[1]-a[1]), max = arr[0]?.[1]||0, tops = arr.filter(x=>x[1]===max).map(x=>x[0]);
  snap(); timer.pause();
  if (tops.length !== 1){ S.verdict = {ids:tops, out:null, n:max}; S.votes = {}; render(); return; }
  const id = tops[0], c = root.querySelector(`#ring .card[data-id="${id}"]`), r0 = c && c.getBoundingClientRect();
  const k = c && c.cloneNode(true);
  const p = pl(id); p.dead = true; p.out = true; p.died = `Day ${S.night} · Voted out`;
  if (S.hunter.target===id){ S.hunter.target=null; S.hunter.locked=false; }
  S.verdict = {ids:[id], out:id, n:max}; S.votes = {};
  flip(render);
  const dst = root.querySelector(`[data-verdict="${id}"]`); if (!k || !dst) return;
  k.removeAttribute('data-id'); k.classList.add('flying'); k.classList.remove('top-vote','drop-hot','drag-src');
  k.querySelector('.votes')?.remove();
  Object.assign(k.style,{position:'fixed',left:r0.left+'px',top:r0.top+'px',width:r0.width+'px',height:r0.height+'px',margin:0,animation:'none'});
  root.append(k); dst.style.opacity = 0;
  const r1 = dst.getBoundingClientRect(), sc = r1.width/r0.width;
  const an = k.animate([{transform:'none'},{transform:`translate(${(r1.left-r0.left)*.5}px,${(r1.top-r0.top)*.5-40}px) scale(${(1+sc)/2}) rotate(3deg)`,offset:.5},{transform:`translate(${r1.left-r0.left}px,${r1.top-r0.top}px) scale(${sc})`}],{duration:900,easing:'cubic-bezier(.45,0,.2,1)',fill:'forwards'});
  let fin=false; const end=()=>{ if(fin) return; fin=true; k.remove(); dst.style.opacity=''; dst.animate([{transform:'scale(1)'},{transform:'scale(1.06)'},{transform:'scale(1)'}],{duration:360}); };
  an.onfinish = end; setTimeout(end, 1150);
}
// "Đi ngủ": the voted-out card flies from the centre into ĐÃ OUT, then night falls.
function sleepFromVerdict(){
  const v = S.verdict;
  if (!v || !v.out){ startNight(); return; }
  flyOut([v.out], ()=>{ if (!checkWin()) startNight(); }, x => root.querySelector(`[data-verdict="${x}"]`), ()=>{});
}
function confirmBox(msg, yes, labels, no){
  const L2 = labels || {no:'Back', ok:'OK'};
  const d = ov(`<div class="modal confirm"><h2>${msg}</h2><div class="hbtns"><button class="btn big" id="cNo">${L2.no}</button><button class="btn big pri" id="cYes">${L2.ok}</button></div></div>`);
  $('#cNo').onclick = ()=>{ tick(); closeOv(); no && no(); }; $('#cYes').onclick = ()=>{ tick(); closeOv(); yes(); };
  d.onclick = e=>{ if (e.target===d) closeOv(); };
}

// ================================================================ ANIMATION
function flip(fn){
  const before = {}; root.querySelectorAll('#ring .card[data-id]').forEach(c=>before[c.dataset.id]=c.getBoundingClientRect());
  fn();
  root.querySelectorAll('#ring .card[data-id]').forEach(c=>{
    const b = before[c.dataset.id]; if (!b) { c.animate([{opacity:0,transform:'scale(.85)'},{opacity:1,transform:'none'}],{duration:320,easing:'ease-out'}); return; }
    const a = c.getBoundingClientRect(), dx=b.left-a.left, dy=b.top-a.top, sx=b.width/a.width;
    if (Math.abs(dx)<1 && Math.abs(dy)<1 && Math.abs(sx-1)<.01) return;
    c.animate([{transformOrigin:'0 0',transform:`translate(${dx}px,${dy}px) scale(${sx})`},{transformOrigin:'0 0',transform:'none'}],{duration:520,easing:'cubic-bezier(.22,.9,.3,1)'});
  });
}
// Cards leave (from the ring, or from the dawn screen) and glide into the OUT column; the
// ring closes up behind them; the OUT chip shows on landing.
const flyingIds = new Set();
function flyOut(ids, done, srcFor, mark){
  const clones = ids.map(id=>{
    const c = srcFor ? srcFor(id) : root.querySelector(`#ring .card[data-id="${id}"]`); if (!c) return null;
    const r = c.getBoundingClientRect(), k = c.cloneNode(true);
    k.removeAttribute('data-id'); k.classList.add('flying'); k.classList.remove('awake','pick','top-vote','seer-pick');
    Object.assign(k.style,{position:'fixed',left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px',margin:0});
    root.append(k); return {k, r, id};
  }).filter(Boolean);
  closeOv();
  ids.forEach(id=>{ const p = pl(id); (mark || (q=>{ q.out=true; }))(p); flyingIds.add(id); S.outSeq = S.outSeq.filter(x=>x!==id).concat(id); });
  flip(render);
  const zone = $('#outzone');
  let left = clones.length; if (!left){ ids.forEach(id=>flyingIds.delete(id)); render(); done&&done(); return; }
  clones.forEach((o,i)=>{
    const chip = zone.querySelector(`[data-out="${o.id}"]`);
    if (chip) chip.scrollIntoView({block:'nearest'});
    const t = (chip||zone).getBoundingClientRect();
    const s = Math.min(t.width/o.r.width, 1), dx = t.left-o.r.left, dy = t.top-o.r.top + (t.height - o.r.height*s)/2;
    const anim = o.k.animate([
      {transform:'translate(0,0) scale(1) rotate(0)', opacity:1},
      {transform:`translate(${dx*.35}px,${dy*.35-50}px) scale(.92) rotate(-4deg)`, opacity:1, offset:.35},
      {transform:`translate(${dx}px,${dy}px) scale(${s},${t.height/o.r.height}) rotate(0)`, opacity:.15}
    ], {duration:950, delay:i*260, easing:'cubic-bezier(.45,0,.2,1)', fill:'forwards'});
    let fin = false;
    const end = () => { if (fin) return; fin = true; o.k.remove(); flyingIds.delete(o.id);
      const ch = zone.querySelector(`[data-out="${o.id}"]`);
      if (ch){ ch.classList.remove('arriving'); ch.animate([{transform:'scale(.85)',opacity:.3},{transform:'scale(1.05)',opacity:1},{transform:'none'}],{duration:320,easing:'ease-out'}); }
      if (--left===0){ renderSide(); done&&done(); } };
    anim.onfinish = end; setTimeout(end, 950 + i*260 + 250);   // hidden tab: onfinish may never fire
  });
}

// ================================================================ GESTURES
let drag = null;
function ringDown(e){
  const c = e.target.closest('.card'); if (!c) return;
  drag = {id:c.dataset.id, x:e.clientX, y:e.clientY, moved:false, el:c};
  try { $('#ring').setPointerCapture(e.pointerId); } catch { /* synthetic or already-lifted pointer */ }
}
function clearHot(){ root.querySelectorAll('.drop-hot').forEach(x=>x.classList.remove('drop-hot')); $('#outzone').classList.remove('hot'); }
function ringMove(e){
  if (!drag) return;
  const dx = e.clientX-drag.x, dy = e.clientY-drag.y;
  if (!drag.moved && Math.hypot(dx,dy) < 10) return;
  if (S.screen==='night') return;
  drag.moved = true; clearHot();
  const under = document.elementFromPoint(e.clientX, e.clientY);
  const oz = under && under.closest('#outzone'); if (oz) $('#outzone').classList.add('hot');
  if (S.screen==='setup'){                           // re-seat or bench: the card follows the finger
    drag.el.classList.add('lift'); drag.el.style.transform = `translate(${dx}px,${dy}px) scale(1.07)`;
    const tc = !oz && cardAt(e, drag.id); if (tc) tc.classList.add('drop-hot');
    return;
  }
  const p = pl(drag.id); drag.el.classList.add('drag-src');
  const tc = under && under.closest('#ring .card');
  if (tc && tc.dataset.id!==drag.id && S.voteMode && !p.dead) tc.classList.add('drop-hot');
  const rr = $('#ring').getBoundingClientRect(), A = box(drag.id), pt = {x:e.clientX-rr.left, y:e.clientY-rr.top};
  const color = oz ? '#D64545' : '#3346C9';
  $('#dragline').innerHTML = `<defs>${marker(color)}</defs>` + arrow(edge(A,pt.x,pt.y), pt, color, 4, '8 7');
}
function ringUp(e){
  if (!drag) return;
  const d = drag; drag = null; clearHot();
  const dl = $('#dragline'); if (dl) dl.innerHTML='';
  d.el.classList.remove('drag-src');
  if (!d.moved){ tapCard(d.id); return; }
  const under = document.elementFromPoint(e.clientX, e.clientY), toOut = under && under.closest('#outzone');
  if (S.screen==='setup'){
    d.el.classList.remove('lift');
    if (toOut){ d.el.style.transform=''; return bench(d.id); }
    const tc = cardAt(e, d.id);
    if (!tc){ d.el.animate([{transform:d.el.style.transform},{transform:'none'}],{duration:260,easing:'ease-out'}); d.el.style.transform=''; return; }
    tick();
    const a = S.order.indexOf(d.id), b = S.order.indexOf(tc.dataset.id);
    flip(()=>{ [S.order[a], S.order[b]] = [S.order[b], S.order[a]]; render(); });
    saveSeats();
    return;
  }
  if (toOut) return voteOut(d.id);
  const tc = under && under.closest('#ring .card'), p = pl(d.id);
  if (tc && tc.dataset.id!==d.id && S.voteMode && !p.dead){ snap(); tick(); S.votes[d.id]=tc.dataset.id; render(); }
}
// the lifted card covers the one under the finger, so hit-test by position instead
function cardAt(e, self){
  const rr = $('#ring').getBoundingClientRect(), x = e.clientX-rr.left, y = e.clientY-rr.top;
  for (const id in L.pos){ if (id===self) continue; const s = L.pos[id];
    if (x>=s.x && x<=s.x+L.w && y>=s.y && y<=s.y+L.h) return root.querySelector(`#ring .card[data-id="${id}"]`); }
  return null;
}
const ringEl = $('#ring');
ringEl.addEventListener('pointerdown', ringDown);
ringEl.addEventListener('pointermove', ringMove);
ringEl.addEventListener('pointerup', ringUp);
ringEl.addEventListener('pointercancel', ringUp);

// ================================================================ OVERLAYS
function ov(html, cls='ov'){ if (dead) return document.createElement('div'); closeOv(); const d=document.createElement('div'); d.className=cls; d.id='ov'; d.innerHTML=html; root.append(d); return d; }
function closeOv(){ $('#ov')?.remove(); }
function showDawn(){
  const k = S.dawn.dead.length;
  const cards = S.dawn.dead.map(x=>{ const p = pl(x.id), R = ROLE[p.role];
    return `<div class="card static" data-dead="${p.id}" style="--rc:${rc(p.role)}"><div class="emb">${ic(R.icon)}</div><div class="nm">${esc(p.name)}</div><div class="rl">${R.vi}</div>
      <div class="ribbon" style="--bc:var(--bad)">${ic(x.why==='Poison'?'flask':x.why==='Bitten'?'claw':'target')}${x.why}</div></div>`; }).join('');
  ov(`<div class="sun"></div><div class="lbl">Morning · Day ${S.night}</div>
    <div class="num ${k?'':'zero'}">${k}</div>
    <div class="cap">${k ? (k===1?'person died last night':'people died last night') : 'Nobody died last night'}</div>
    ${k?`<div class="dcards">${cards}</div>`:''}
    <div class="row"><button class="btn pri" id="goDay">${ic('sun')}Start the day</button></div>`, 'dawn');
  $('#goDay').onclick = ()=>{ tick(); goDay(); };
}
function showWin(w){
  dropSavedGame();
  const soi = w==='soi';
  ov(`<div class="modal win"><div class="reveal" style="box-shadow:none;padding:6px"><div class="emb" style="--rc:${soi?'var(--wolf)':'var(--good)'}">${ic(soi?'wolf':'home')}</div>
    <h2 style="color:${soi?'var(--wolf)':'var(--good)'}">${soi?'WEREWOLVES WIN':'VILLAGERS WIN'}</h2></div>
    <div class="grid">${inGame().map(p=>`<div class="outp" style="--rc:${rc(p.role)}"><span class="ri">${ic(ROLE[p.role].icon)}</span><span class="tx"><b>${esc(p.name)}</b><small>${p.dead?esc(p.died):'Alive'}</small></span></div>`).join('')}</div>
    <div style="display:flex;gap:8px;justify-content:center"><button class="btn" id="wBack">${ic('undo')}Undo</button><button class="btn pri" id="wNew">${ic('cards')}New game</button></div></div>`);
  $('#wBack').onclick = undo;
  $('#wNew').onclick = ()=>{ tick(); closeOv(); newRound(); };
}
function newRound(){
  dropSavedGame();
  const order=S.order, ps=S.players.map(p=>({...p,role:null,dead:false,out:false,died:''})), c=S.cls, cfg=S.cfg, outSeq=S.outSeq.filter(id=>pl(id).benched);
  S=fresh(c); S.players=ps; S.order=order; S.cfg=cfg; S.outSeq=outSeq; hist.length=0; flip(render);
}
function showRules(){
  const d = ov(`<div class="modal"><h2>House rules</h2>
    <h5>Night</h5><ul><li>Werewolves → Witch → Seer → Bodyguard → Hunter → Dawn.</li><li>Night 1: tap the cards of whoever opens their eyes to record their role; everyone left is a Villager.</li><li>A dead role is still called (fake call).</li></ul>
    <h5>Who dies at dawn</h5><ul><li>The wolves' target, unless the Witch saves them.</li><li>The Witch's poison target.</li><li>If the Hunter dies at night, the Hunter’s target dies too.</li><li>Whoever the Bodyguard protects cannot die that night.</li><li>A Hunter voted out by day dies alone.</li></ul>
    <h5>Roles</h5><ul><li>Witch: one save and one poison per game; may save herself; may save and poison on the same night <i>(to confirm)</i>.</li><li>Bodyguard: never the same person two nights in a row.</li><li>Hunter: picks on night 1; may keep or change once on night 2, then locked until that person dies.</li></ul>
    <h5>Day</h5><ul><li>Everyone votes. A tie: nobody is out.</li><li>Wolves = Villagers → Werewolves win · no wolves left → Villagers win.</li></ul>
    <div style="text-align:right;margin-top:14px"><button class="btn pri" id="ovClose">Close</button></div></div>`);
  $('#ovClose').onclick = closeOv; d.onclick = e=>{ if(e.target===d) closeOv(); };
}
const settings = {autoMusic:true};
function showSettings(){
  const d = ov(`<div class="modal"><h2>Settings</h2>
    <div class="setrow"><span>Music fades in at night and out at dawn</span><button class="tog ${settings.autoMusic?'on':''}" style="--rc:var(--primary)" id="sAuto"></button></div>
    <div class="setrow" style="border:0"><span>Back to setup</span><button class="btn bad" id="sReset">Back to setup</button></div>
    <div style="text-align:right;margin-top:10px"><button class="btn pri" id="ovClose">Done</button></div></div>`);
  $('#sAuto').onclick = e=>{ settings.autoMusic=!settings.autoMusic; e.currentTarget.classList.toggle('on'); $('#autoLbl').textContent = settings.autoMusic?'Auto at night':'Auto: off'; };
  $('#sReset').onclick = ()=>{ closeOv(); newRound(); };
  $('#ovClose').onclick = closeOv; d.onclick = e=>{ if(e.target===d) closeOv(); };
}
let toastT;
function toast(m){ $('.toast')?.remove(); const t=document.createElement('div'); t.className='toast'; t.textContent=m; root.append(t); clearTimeout(toastT); toastT=setTimeout(()=>t.remove(),2200); }
$('#rulesBtn').onclick = showRules; $('#setBtn').onclick = showSettings;

// ================================================================ TIMER
const timer = {
  total:180, left:180, run:false, h:null,
  set(s){ this.total=s; this.left=s; this.paint(); },
  start(){ if(this.run) return; this.run=true; this.h=setInterval(()=>{ this.left--; if(this.left===0) beep(); this.paint(); },1000); this.paint(); },
  pause(){ this.run=false; clearInterval(this.h); this.paint(); },
  paint(){
    const s=Math.abs(this.left), txt=(this.left<0?'−':'')+Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
    const c=$('#clock'); if (!c) return; c.textContent=txt; c.className='clock'+(this.left<=0?' over':this.left<=30?' warn':'');
    $('#tStart').innerHTML = ic(this.run?'pause':'play');
    $('#tChips').innerHTML = [1,2,3,5].map(m=>`<button class="chip ${this.total===m*60?'on':''}" data-m="${m}">${m} min</button>`).join('');
    root.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{ tick(); this.pause(); this.set(b.dataset.m*60); });
  }
};


// ================================================================ MUSIC (real audio)
const music = {
  tracks:[{name:'Night forest (sample)', kind:'synth', base:110},{name:'Wind & crickets (sample)', kind:'synth', base:146.8}],
  idx:0, playing:false, vol:.7, fade:1, audio:new Audio(), nodes:null, fT:null,
  out(){ return this.vol*this.fade; },
  apply(){ this.audio.volume=Math.min(1,this.out()); if(this.nodes) this.nodes.g.gain.setTargetAtTime(this.out()*.35, ctx().currentTime, .05); },
  stopAll(){ this.audio.pause(); if(this.nodes){ try{this.nodes.src.forEach(s=>s.stop());}catch{} this.nodes=null; } },
  startTrack(){
    this.stopAll(); const t=this.tracks[this.idx];
    if (t.kind==='file'){ this.audio.src=t.url; this.audio.loop=true; this.apply(); this.audio.play().catch(()=>{}); return; }
    const c=ctx(), g=c.createGain(); g.gain.value=0; g.connect(c.destination);
    const lp=c.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=900; lp.connect(g);
    const src=[];
    [1,1.5,2,3].forEach((m,i)=>{ const o=c.createOscillator(); o.type=i%2?'triangle':'sine'; o.frequency.value=t.base*m; o.detune.value=(i-1.5)*6;
      const og=c.createGain(); og.gain.value=[.5,.25,.18,.07][i]; const l=c.createOscillator(), lg=c.createGain(); l.frequency.value=.07+i*.05; lg.gain.value=.12; l.connect(lg).connect(og.gain); l.start(); src.push(l);
      o.connect(og).connect(lp); o.start(); src.push(o); });
    const buf=c.createBuffer(1,c.sampleRate*2,c.sampleRate), d=buf.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
    const ns=c.createBufferSource(); ns.buffer=buf; ns.loop=true; const nf=c.createBiquadFilter(); nf.type='bandpass'; nf.frequency.value=t.base*20; nf.Q.value=.6; const ng=c.createGain(); ng.gain.value=.08; ns.connect(nf).connect(ng).connect(lp); ns.start(); src.push(ns);
    this.nodes={g,src}; this.apply();
  },
  play(){ this.playing=true; this.startTrack(); this.paint(); },
  pause(){ this.playing=false; this.stopAll(); this.paint(); },
  toggle(){ this.playing ? this.pause() : (this.fade=1, this.play()); },
  go(i){ this.idx=(i+this.tracks.length)%this.tracks.length; if(this.playing) this.startTrack(); this.paint(); },
  ramp(to, ms, done){ clearInterval(this.fT); const from=this.fade, t0=performance.now(); this.fT=setInterval(()=>{ const k=Math.min(1,(performance.now()-t0)/ms); this.fade=from+(to-from)*k; this.apply(); if(k>=1){ clearInterval(this.fT); done&&done(); } },50); },
  fadeIn(){ if(!this.playing){ this.fade=0; this.play(); } this.ramp(1,3000); },
  fadeOut(){ if(!this.playing) return; this.ramp(0,3000,()=>{ this.pause(); this.fade=1; }); },
  paint(){
    $('#trkName').textContent=this.tracks[this.idx].name; $('#trkState').textContent=this.playing?'Playing':'Paused';
    $('#playT').innerHTML=ic(this.playing?'pause':'play'); $('#disc').classList.toggle('spin',this.playing);
    $('#tracks').innerHTML=this.tracks.map((t,i)=>`<div class="trow"><button class="track ${i===this.idx?'on':''}" data-t="${i}"><span class="n">${i+1}</span>${esc(t.name)}</button>${t.kind==='file'?`<button class="trm" data-rm="${i}" aria-label="Remove ${esc(t.name)}">${ic('x')}</button>`:''}</div>`).join('');
    root.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{ tick(); this.idx=+b.dataset.t; this.fade=1; this.play(); });
    root.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{ const i=+b.dataset.rm, t=this.tracks[i]; if(!t) return;
      confirmBox(`Remove “${esc(t.name)}”?`, ()=>{ if (i===this.idx && this.playing) this.pause(); this.tracks.splice(i,1); try{URL.revokeObjectURL(t.url);}catch{}
        if (ctx.removeTrack && t.id) ctx.removeTrack(t.id); this.idx=Math.min(this.idx, this.tracks.length-1); this.paint(); }, {no:'Keep', ok:'Remove'}); });
  }
};
$('#playT').onclick=()=>{ tick(); music.toggle(); }; $('#prevT').onclick=()=>{ tick(); music.go(music.idx-1); }; $('#nextT').onclick=()=>{ tick(); music.go(music.idx+1); }; $('#fadeT').onclick=()=>{ tick(); music.fadeOut(); };
$('#vol').oninput=e=>{ music.vol=e.target.value/100; $('#volV').textContent=e.target.value+'%'; music.apply(); };
$('#mp3').onchange=async e=>{ const files=[...e.target.files]; e.target.value='';
  for (const f of files){ try { const rec = await (ctx.addTrack ? ctx.addTrack(f) : {id:'tmp'+Date.now(), name:f.name.replace(/\.[^.]+$/,''), blob:f});
    music.tracks.push({id:rec.id, name:rec.name, kind:'file', url:URL.createObjectURL(rec.blob)}); } catch { toast('Could not save that file'); } }
  if (files.length){ music.idx=music.tracks.length-1; music.paint(); } };
(async()=>{ const saved = ctx.listTracks ? await ctx.listTracks() : [];
  if (dead) return;
  saved.forEach(r=>music.tracks.push({id:r.id, name:r.name, kind:'file', url:URL.createObjectURL(r.blob)})); music.paint(); })();

root.addEventListener('pointerdown', e=>{ const m=$('#clsMenu'); if (m && !m.hidden && !e.target.closest('.clsbox')) m.hidden=true; });
let rsT; const ro = new ResizeObserver(()=>{ clearTimeout(rsT); rsT=setTimeout(()=>{ if(!drag) render(); },80); }); ro.observe(ringEl);
$('#wwHome').onclick = ()=>{ tick(); ctx.onExit && ctx.onExit(); };
timer.set(180); music.paint();
let resume = null; try { resume = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch {}
render();
if (resume && resume.screen && resume.screen!=='setup' && Array.isArray(resume.players)){
  confirmBox(`Continue the game in progress?<small class="rs">Class ${esc(resume.cls||'')} · ${resume.screen==='night'?'Night':'Day'} ${resume.night||1}</small>`,
    ()=>{ S = resume; render(); }, {no:'New game', ok:'Continue'}, dropSavedGame);
}

return function dispose(){
  if (dead) return; dead = true;
  timer.pause(); clearInterval(music.fT); music.stopAll(); clearTimeout(rsT); clearTimeout(toastT);
  try { ro.disconnect(); } catch {}
  try { actx && actx.close(); } catch {}
  music.tracks.forEach(t=>{ if (t.url) try { URL.revokeObjectURL(t.url); } catch {} });
  root.innerHTML = ''; root.classList.remove('ww'); document.body.classList.remove('ww-open');
};

}
