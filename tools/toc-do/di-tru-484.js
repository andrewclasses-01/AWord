// Đợt 484 — DI TRÚ content.goiY của act ra doc gy_<actId> (khoá quản trị, REST).
//   node di-tru-484.js --thu          : chỉ đếm + thử truy vấn not-in (KHÔNG ghi)
//   node di-tru-484.js --sao-luu      : sao lưu toàn bộ users/{uid}/items ra file JSON
//   node di-tru-484.js --lam <file sao lưu> : di trú (ghi gy_ trước, sửa act sau, điều kiện updateTime), đọc lại kiểm từng act
//   node di-tru-484.js --hoan <file sao lưu> : HOÀN TÁC — trả content.goiY từ bản sao lưu vào act, bỏ dấu goiYTach
'use strict';
const fs = require('fs'), path = require('path'), https = require('https'), crypto = require('crypto');
const PROJECT = 'aword-70dae', EMAIL = 'namdaptrai01@gmail.com';
const KHOA = [path.join(process.env.LOCALAPPDATA || '', 'AndrewClasses', 'firebase-admin.json'),
  'E:\\LAP TRINH APP\\mySpeaking-data\\data\\firebase-admin.json', 'D:\\APP AND DATA\\mySpeaking-data\\data\\firebase-admin.json'];
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
function goi(url, o = {}) {
  return new Promise((res, rej) => {
    const u = new URL(url); const body = o.body || null;
    const r = https.request({ hostname: u.hostname, path: u.pathname + u.search, method: o.method || 'GET', headers: Object.assign({}, o.headers, body ? { 'Content-Length': Buffer.byteLength(body) } : {}) },
      x => { const ch = []; x.on('data', c => ch.push(c)); x.on('end', () => { const raw = Buffer.concat(ch).toString('utf8'); let j = null; try { j = JSON.parse(raw); } catch (_) { j = { _raw: raw.slice(0, 300) }; } res({ s: x.statusCode, j }); }); });
    r.setTimeout(60000, () => r.destroy(new Error('QUA_LAU'))); r.on('error', rej); if (body) r.write(body); r.end();
  });
}
let H;
async function dangNhap() {
  const sa = JSON.parse(fs.readFileSync(KHOA.find(p => fs.existsSync(p)), 'utf8').replace(/^\uFEFF/, ''));
  const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url'); const now = Math.floor(Date.now() / 1000);
  const p = b64({ alg: 'RS256', typ: 'JWT' }) + '.' + b64({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/cloud-platform', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 });
  const jwt = p + '.' + crypto.createSign('RSA-SHA256').update(p).sign(sa.private_key).toString('base64url');
  const t = await goi('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=' + encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer') + '&assertion=' + encodeURIComponent(jwt) });
  H = { Authorization: 'Bearer ' + t.j.access_token, 'Content-Type': 'application/json' };
  const lk = await goi(`https://identitytoolkit.googleapis.com/v1/projects/${PROJECT}/accounts:lookup`, { method: 'POST', headers: H, body: JSON.stringify({ email: [EMAIL] }) });
  return lk.j.users[0].localId;
}
async function tatCa(uid) {
  let tok = '', ds = [];
  do {
    const r = await goi(`${BASE}/users/${uid}/items?pageSize=300${tok ? '&pageToken=' + tok : ''}`, { headers: H });
    if (r.s !== 200) throw new Error('LIST ' + r.s + ' ' + JSON.stringify(r.j).slice(0, 200));
    ds = ds.concat(r.j.documents || []); tok = r.j.nextPageToken || '';
  } while (tok);
  return ds;
}
const idCua = d => d.name.split('/').pop();
const bangCua = d => { const c = d.fields && d.fields.content && d.fields.content.mapValue && d.fields.content.mapValue.fields; return c && c.goiY && c.goiY.arrayValue ? (c.goiY.arrayValue.values || []) : null; };
const laAct = d => d.fields && d.fields.kind && d.fields.kind.stringValue === 'act';
const coDau = d => { const c = d.fields.content && d.fields.content.mapValue && d.fields.content.mapValue.fields; return !!(c && c.goiYTach && c.goiYTach.booleanValue); };

(async () => {
  const mode = process.argv[2]; const uid = await dangNhap();
  if (mode === '--thu') {
    const ds = await tatCa(uid);
    const can = ds.filter(d => laAct(d) && (bangCua(d) || []).length);
    const kb = can.reduce((s, d) => s + JSON.stringify(bangCua(d)).length, 0);
    console.log('tổng doc', ds.length, '· act cần di trú', can.length, '· bảng ~', Math.round(kb / 1024), 'KB · act đã có dấu', ds.filter(d => laAct(d) && coDau(d)).length, '· gy_ đã có', ds.filter(d => d.fields.kind && d.fields.kind.stringValue === 'act-goiy').length);
    const q = await goi(`${BASE}/users/${uid}:runQuery`, { method: 'POST', headers: H, body: JSON.stringify({ structuredQuery: { from: [{ collectionId: 'items' }], where: { fieldFilter: { field: { fieldPath: 'kind' }, op: 'NOT_IN', value: { arrayValue: { values: [{ stringValue: 'showdown-history' }, { stringValue: 'act-goiy' }] } } } } } }) });
    const rows = (q.j || []).filter(x => x.document);
    console.log('runQuery NOT_IN: HTTP', q.s, '·', rows.length, 'doc ·', Math.round(rows.reduce((s, x) => s + JSON.stringify(x.document.fields).length, 0) / 1024), 'KB', q.j && q.j[0] && q.j[0].error ? JSON.stringify(q.j[0].error).slice(0, 200) : '');
    return;
  }
  if (mode === '--sao-luu') {
    const ds = await tatCa(uid);
    const d = new Date(); const tg = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}_${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;
    const thuMuc = path.join('E:\\LAP TRINH APP\\_SAO LUU FIRESTORE', tg + '_aword-items-truoc-dot484');
    fs.mkdirSync(thuMuc, { recursive: true });
    const f = path.join(thuMuc, 'users_items.json');
    fs.writeFileSync(f, JSON.stringify({ uid, luc: d.toISOString(), soDoc: ds.length, documents: ds }));
    const doc = JSON.parse(fs.readFileSync(f, 'utf8'));
    console.log('SAO LƯU', doc.documents.length, 'doc →', f, '·', Math.round(fs.statSync(f).size / 1024), 'KB');
    return;
  }
  if (mode === '--lam') {
    const sl = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
    if (sl.uid !== uid) throw new Error('sao lưu không phải của tài khoản này');
    const ds = await tatCa(uid);   // đọc MỚI (updateTime hiện tại)
    const can = ds.filter(d => laAct(d) && (bangCua(d) || []).length);
    const saoLuu = new Map(sl.documents.map(d => [idCua(d), d]));
    let ok = 0, loi = 0;
    for (const d of can) {
      const id = idCua(d);
      if (!saoLuu.has(id)) { console.log('  ⚠️ bỏ qua (không có trong sao lưu):', id); loi++; continue; }
      const bang = bangCua(d);
      // 1) doc gy_ (tạo/ghi đè) — có trước thì act đổi sau mới an toàn
      const g = await goi(`${BASE}/users/${uid}/items/gy_${id}`, { method: 'PATCH', headers: H, body: JSON.stringify({ fields: {
        kind: { stringValue: 'act-goiy' }, root: { stringValue: 'appdata' }, parentId: { nullValue: null }, trashed: { booleanValue: false },
        actId: { stringValue: id }, goiY: { arrayValue: { values: bang } }, updatedAt: { integerValue: String(Date.now()) } } }) });
      if (g.s !== 200) { console.log('  ❌ gy_', id, g.s, JSON.stringify(g.j).slice(0, 150)); loi++; continue; }
      // 2) act: bỏ content.goiY, thêm content.goiYTach — chỉ khi act CHƯA bị ai sửa từ lúc đọc (updateTime)
      const qs = 'updateMask.fieldPaths=content.goiY&updateMask.fieldPaths=content.goiYTach&currentDocument.updateTime=' + encodeURIComponent(d.updateTime);
      const a = await goi(`${BASE}/users/${uid}/items/${id}?${qs}`, { method: 'PATCH', headers: H, body: JSON.stringify({ fields: { content: { mapValue: { fields: { goiYTach: { booleanValue: true } } } } } }) });
      if (a.s !== 200) { console.log('  ❌ act', id, a.s, JSON.stringify(a.j).slice(0, 150)); loi++; continue; }
      // 3) đọc lại kiểm
      const [ra, rg] = await Promise.all([goi(`${BASE}/users/${uid}/items/${id}`, { headers: H }), goi(`${BASE}/users/${uid}/items/gy_${id}`, { headers: H })]);
      const dung = ra.s === 200 && !bangCua(ra.j) && coDau(ra.j) && rg.s === 200 && JSON.stringify(rg.j.fields.goiY.arrayValue.values) === JSON.stringify(bang)
        && JSON.stringify(ra.j.fields.content.mapValue.fields.items || null) === JSON.stringify(d.fields.content.mapValue.fields.items || null);
      if (dung) ok++; else { loi++; console.log('  ❌ đọc lại lệch', id); }
    }
    console.log(`DI TRÚ: ${ok}/${can.length} act đúng · ${loi} lỗi`);
    return;
  }
  if (mode === '--hoan') {
    const sl = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
    let n = 0;
    for (const d of sl.documents) {
      const b = laAct(d) && bangCua(d); if (!b || !b.length) continue;
      const id = idCua(d);
      const qs = 'updateMask.fieldPaths=content.goiY&updateMask.fieldPaths=content.goiYTach';
      const a = await goi(`${BASE}/users/${uid}/items/${id}?${qs}&currentDocument.exists=true`, { method: 'PATCH', headers: H, body: JSON.stringify({ fields: { content: { mapValue: { fields: { goiY: { arrayValue: { values: b } } } } } } }) });
      if (a.s === 200) n++; else console.log('  ❌', id, a.s);
    }
    console.log('HOÀN TÁC:', n, 'act đã trả bảng goiY');
    return;
  }
  console.log('chọn --thu | --sao-luu | --lam <file> | --hoan <file>');
})().catch(e => { console.error('LỖI', e.message); process.exit(1); });
