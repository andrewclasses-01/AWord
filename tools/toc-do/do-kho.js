// CHỈ ĐỌC: đo kích thước kho users/{uid}/items của thầy (AWord readAll tải hết lúc mở trang).
'use strict';
const fs = require('fs'), path = require('path'), https = require('https'), crypto = require('crypto');
const PROJECT = 'aword-70dae', EMAIL = 'namdaptrai01@gmail.com';
const KHOA = [path.join(process.env.LOCALAPPDATA || '', 'AndrewClasses', 'firebase-admin.json'),
  'E:\\LAP TRINH APP\\mySpeaking-data\\data\\firebase-admin.json', 'D:\\APP AND DATA\\mySpeaking-data\\data\\firebase-admin.json'];
function goi(url, o = {}) {
  return new Promise((res, rej) => {
    const u = new URL(url); const body = o.body || null;
    const r = https.request({ hostname: u.hostname, path: u.pathname + u.search, method: o.method || 'GET', headers: Object.assign({}, o.headers, body ? { 'Content-Length': Buffer.byteLength(body) } : {}) },
      x => { const ch = []; x.on('data', c => ch.push(c)); x.on('end', () => { const raw = Buffer.concat(ch); let j = null; try { j = JSON.parse(raw.toString('utf8')); } catch (_) { } res({ s: x.statusCode, j, n: raw.length }); }); });
    r.on('error', rej); if (body) r.write(body); r.end();
  });
}
(async () => {
  const sa = JSON.parse(fs.readFileSync(KHOA.find(p => fs.existsSync(p)), 'utf8').replace(/^\uFEFF/, ''));
  const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url'); const now = Math.floor(Date.now() / 1000);
  const p = b64({ alg: 'RS256', typ: 'JWT' }) + '.' + b64({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/cloud-platform', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 });
  const jwt = p + '.' + crypto.createSign('RSA-SHA256').update(p).sign(sa.private_key).toString('base64url');
  const t = await goi('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=' + encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer') + '&assertion=' + encodeURIComponent(jwt) });
  const H = { Authorization: 'Bearer ' + t.j.access_token, 'Content-Type': 'application/json' };
  const lk = await goi(`https://identitytoolkit.googleapis.com/v1/projects/${PROJECT}/accounts:lookup`, { method: 'POST', headers: H, body: JSON.stringify({ email: [EMAIL] }) });
  const uid = lk.j.users[0].localId;
  let tok = '', docs = 0, byte = 0; const kind = {}, to = [], truong = {};
  do {
    const r = await goi(`https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/users/${uid}/items?pageSize=300${tok ? '&pageToken=' + tok : ''}`, { headers: H });
    for (const d of r.j.documents || []) {
      const s = JSON.stringify(d.fields || {}).length; docs++; byte += s;
      const k = (d.fields.kind && d.fields.kind.stringValue) || '?'; kind[k] = kind[k] || { n: 0, b: 0 }; kind[k].n++; kind[k].b += s;
      to.push([s, k, (d.fields.template && d.fields.template.stringValue) || '']);
      for (const f in d.fields) { const fs2 = JSON.stringify(d.fields[f]).length; truong[f] = (truong[f] || 0) + fs2; }
    }
    tok = r.j.nextPageToken || '';
  } while (tok);
  to.sort((a, b) => b[0] - a[0]);
  console.log('tai lieu', docs, '· JSON REST ~', Math.round(byte / 1024), 'KB');
  console.log('theo kind:', Object.entries(kind).sort((a, b) => b[1].b - a[1].b).map(([k, v]) => `${k} ${v.n} doc ${Math.round(v.b / 1024)}KB`).join(' | '));
  console.log('truong nang nhat:', Object.entries(truong).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, v]) => `${k} ${Math.round(v / 1024)}KB`).join(' | '));
  console.log('10 doc to nhat:', to.slice(0, 10).map(x => `${Math.round(x[0] / 1024)}KB ${x[1]}/${x[2]}`).join(' | '));
})().catch(e => console.error('LOI', e.message));
