// CHỈ ĐỌC: so từng act đã di trú với bản sao lưu (bỏ qua thứ tự khoá).
'use strict';
const fs = require('fs'), path = require('path'), https = require('https'), crypto = require('crypto');
const PROJECT = 'aword-70dae', EMAIL = 'namdaptrai01@gmail.com';
const KHOA = [path.join(process.env.LOCALAPPDATA || '', 'AndrewClasses', 'firebase-admin.json'), 'E:\\LAP TRINH APP\\mySpeaking-data\\data\\firebase-admin.json'];
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
const SL = 'E:\\LAP TRINH APP\\_SAO LUU FIRESTORE\\2026-10-05_2118_aword-items-truoc-dot484\\users_items.json';
function goi(url, o = {}) { return new Promise((res, rej) => { const u = new URL(url); const body = o.body || null;
  const r = https.request({ hostname: u.hostname, path: u.pathname + u.search, method: o.method || 'GET', headers: Object.assign({}, o.headers, body ? { 'Content-Length': Buffer.byteLength(body) } : {}) },
    x => { const ch = []; x.on('data', c => ch.push(c)); x.on('end', () => { let j = null; try { j = JSON.parse(Buffer.concat(ch).toString('utf8')); } catch (_) { } res({ s: x.statusCode, j }); }); });
  r.on('error', rej); if (body) r.write(body); r.end(); }); }
// chuẩn hoá giá trị Firestore REST: sắp khoá map, integerValue vs doubleValue giữ nguyên
const chuan = v => { if (Array.isArray(v)) return v.map(chuan); if (v && typeof v === 'object') { const o = {}; Object.keys(v).sort().forEach(k => o[k] = chuan(v[k])); return o; } return v; };
const bang = v => JSON.stringify(chuan(v));
(async () => {
  const sa = JSON.parse(fs.readFileSync(KHOA.find(p => fs.existsSync(p)), 'utf8').replace(/^\uFEFF/, ''));
  const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url'); const now = Math.floor(Date.now() / 1000);
  const p = b64({ alg: 'RS256', typ: 'JWT' }) + '.' + b64({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/cloud-platform', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 });
  const jwt = p + '.' + crypto.createSign('RSA-SHA256').update(p).sign(sa.private_key).toString('base64url');
  const t = await goi('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=' + encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer') + '&assertion=' + encodeURIComponent(jwt) });
  const H = { Authorization: 'Bearer ' + t.j.access_token };
  const sl = JSON.parse(fs.readFileSync(SL, 'utf8')); const uid = sl.uid;
  const goc = sl.documents.filter(d => d.fields.kind && d.fields.kind.stringValue === 'act' && d.fields.content.mapValue.fields.goiY && (d.fields.content.mapValue.fields.goiY.arrayValue.values || []).length);
  let dung = 0; const loai = {}; let vd = '';
  for (const d of goc) {
    const id = d.name.split('/').pop();
    const [a, g] = await Promise.all([goi(`${BASE}/users/${uid}/items/${id}`, { headers: H }), goi(`${BASE}/users/${uid}/items/gy_${id}`, { headers: H })]);
    const cGoc = { ...d.fields.content.mapValue.fields }; const bGoc = cGoc.goiY; delete cGoc.goiY;
    const cMoi = { ...a.j.fields.content.mapValue.fields }; const dau = cMoi.goiYTach; delete cMoi.goiYTach;
    const loi = [];
    if (cMoi.goiY) loi.push('act con goiY');
    if (!(dau && dau.booleanValue === true)) loi.push('thieu dau');
    if (bang(cMoi) !== bang(cGoc)) loi.push('content khac');
    const fGoc = { ...d.fields }; delete fGoc.content; const fMoi = { ...a.j.fields }; delete fMoi.content;
    if (bang(fGoc) !== bang(fMoi)) loi.push('truong khac: ' + Object.keys({ ...fGoc, ...fMoi }).filter(k => bang(fGoc[k]) !== bang(fMoi[k])).join(','));
    if (g.s !== 200) loi.push('khong co gy_'); else if (bang(g.j.fields.goiY) !== bang(bGoc)) loi.push('bang gy_ khac');
    if (!loi.length) dung++; else { loi.forEach(x => loai[x] = (loai[x] || 0) + 1); if (!vd) vd = id + ': ' + loi.join(' | '); }
  }
  console.log(`SO SÂU (bỏ thứ tự khoá): ${dung}/${goc.length} act đúng`, JSON.stringify(loai), vd ? '\nvd: ' + vd : '');
})().catch(e => console.error('LOI', e.message));
