// RACING WORDS mẫu 3o = sr3d-xe3d.js, BỎ H3 Bugatti Divo (giấy phép CC-BY-NC, lớp học có thu phí ⇒ thầy chốt bỏ khi đưa lên AWord) ⇒ 13 xe CC-BY 4.0 (ghi công ở ô chọn xe).
// =============================================================
// SPEED RUN — XE 3D THẬT (15/10/2026)
// 14 xe thầy chọn trong chon-xe-3d.html, tải từ Sketchfab (CC-BY, riêng H3 CC-BY-NC), đã nén (meshopt + texture webp ≤1024) ở speed-run/xe3d/<id>.glb.
// loadXe(id) → THREE.Group đã CHUẨN HÓA: mũi xe hướng −z (như sr3d-car-1), bánh chạm y = 0, giữa xe ở x = z = 0, dài đúng L mét.
// setPaint(xe, màu | null) → sơn thân theo màu đội (null = màu gốc). Vật liệu sơn của từng xe ghi trong XE[].paint (tên vật liệu, dò bằng inspect.mjs).
// =============================================================
import * as THREE from "../../rocket-race/vendor/three/three.module.min.js";
import { GLTFLoader } from "../../rocket-race/vendor/three/addons/GLTFLoader.js";
import { MeshoptDecoder } from "../../rocket-race/vendor/three/addons/meshopt_decoder.module.js";

// rotY: xoay thêm (radian) để mũi xe về −z sau khi đặt trục dài theo z · L: chiều dài thật (m)
export const XE = [{"id": "Y1", "name": "Lamborghini Aventador SV", "short": "Aventador SV", "L": 4.835, "rotY": 0, "paint": ["Body_Colour*"], "author": "Hari Prasath R", "lic": "CC-BY 4.0", "src": "https://sketchfab.com/3d-models/none-fec3fec276d240f6b8a660e2a7874435", "hide": [], "tris": 163489, "mb": 3.07, "ok": true},
  {"id": "Y2", "name": "Lamborghini Revuelto", "short": "Revuelto", "L": 4.947, "rotY": 3.14159, "paint": ["Body"], "author": "ALIEEEN", "lic": "CC-BY 4.0", "src": "https://sketchfab.com/3d-models/none-cf52245eb68f48daa909c7ad2a8deaa3", "hide": [], "tris": 91561, "mb": 1.18, "ok": true},
  {"id": "Y3", "name": "Lamborghini Centenario", "short": "Centenario", "L": 4.924, "rotY": 3.14159, "paint": ["Carbon_R"], "author": "SDC PERFORMANCE™️", "lic": "CC-BY 4.0", "src": "https://sketchfab.com/3d-models/none-d679af35b5694301a185c7454a700c73", "hide": ["Object_12"], "tris": 178079, "mb": 2.88, "ok": true},
  {"id": "Y4", "name": "Ferrari SF90 XX Stradale", "short": "SF90 XX", "L": 4.85, "rotY": 3.14159, "paint": ["Ferrari_SF90XXStradale_2024Paint*"], "author": "Ddiaz Design", "lic": "CC-BY 4.0", "src": "https://sketchfab.com/3d-models/none-2c80c667232544649328cf3589921bcd", "hide": [], "tris": 170783, "mb": 5.09, "ok": true},
  {"id": "Y5", "name": "Ferrari LaFerrari", "short": "LaFerrari", "L": 4.702, "rotY": 3.14159, "paint": ["MAT_Carpaint_Red"], "author": "Ddiaz Design", "lic": "CC-BY 4.0", "src": "https://sketchfab.com/3d-models/none-8b46fa49718647de846387ef4c1e95b3", "hide": [], "tris": 113666, "mb": 2.98, "ok": true},
  {"id": "Y6", "name": "Ferrari 488 Pista Widebody", "short": "488 Pista", "L": 4.605, "rotY": 0, "paint": ["GREEN_car_paint"], "author": "Dev365TH", "lic": "CC-BY 4.0", "src": "https://sketchfab.com/3d-models/none-16c28f5b3ed24991ac3d1208f4a8bc1f", "hide": [], "tris": 119329, "mb": 1.87, "ok": true},
  {"id": "Y7", "name": "Pagani Huayra", "short": "Huayra", "L": 4.605, "rotY": 3.14159, "paint": ["PAG_HUAYRA_PAINT"], "author": "Black Snow", "lic": "CC-BY 4.0", "src": "https://sketchfab.com/3d-models/none-c2d61a9f53a54a229547bb76e4b71e25", "hide": [], "tris": 210157, "mb": 2.35, "ok": true},
  {"id": "Y8", "name": "Pagani Utopia", "short": "Utopia", "L": 4.6, "rotY": 3.14159, "paint": ["CarPaint", "CarPaint2"], "author": "kevin (ケビン)", "lic": "CC-BY 4.0", "src": "https://sketchfab.com/3d-models/none-1f6a628a3b92460ea69e39ec0946f945", "hide": [], "tris": 185764, "mb": 2.8, "ok": true},
  {"id": "Y9", "name": "Pagani Zonda Cinque", "short": "Zonda Cinque", "L": 4.395, "rotY": 3.14159, "paint": ["~Material"], "author": "Ajay Gawde", "lic": "CC-BY 4.0", "src": "https://sketchfab.com/3d-models/none-71a48cb9822a4289a90f29f644ee564e", "hide": [], "tris": 15994, "mb": 0.68, "ok": true},
  {"id": "H4", "name": "Koenigsegg Jesko", "short": "Jesko", "L": 4.61, "rotY": 3.14159, "paint": ["~jeskoVehicle_Exterior_mm_ext1"], "author": "Ddiaz Design", "lic": "CC-BY 4.0", "src": "https://sketchfab.com/3d-models/none-c657f51fb0db43e38fea172dfa385287", "hide": [], "tris": 78215, "mb": 1.92, "ok": true},
  {"id": "H7", "name": "McLaren Senna", "short": "Senna", "L": 4.744, "rotY": 3.14159, "paint": ["mMcLaren_SennaLE_2018Paint*"], "author": "Ddiaz Design", "lic": "CC-BY 4.0", "src": "https://sketchfab.com/3d-models/none-6924eb7b4dde44b19d87c8c31edc74b4", "hide": [], "tris": 160828, "mb": 3.58, "ok": true},
  {"id": "H8", "name": "McLaren P1 GTR", "short": "P1 GTR", "L": 4.6, "rotY": 3.14159, "paint": ["~main_body"], "author": "ALIEEEN", "lic": "CC-BY 4.0", "src": "https://sketchfab.com/3d-models/none-d805bec04cf5407fa7c036c20c726d39", "hide": [], "tris": 71888, "mb": 1.81, "ok": true},
  {"id": "H9", "name": "McLaren 720S", "short": "720S", "L": 4.543, "rotY": 3.14159, "paint": ["body"], "author": "_shobh19", "lic": "CC-BY 4.0", "src": "https://sketchfab.com/3d-models/none-f7bece69400f4640a4a3be746b44998b", "hide": [], "tris": 6915, "mb": 0.28, "ok": true}];

const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const cache = new Map();
const BASE = new URL("../xe3d/", import.meta.url).href;

function load(id) {
  if (!cache.has(id)) cache.set(id, loader.loadAsync(BASE + id + ".glb").then(g => { ready.set(id, g.scene); return g.scene; }));
  return cache.get(id);
}

// prepXe(id): tải trước (Promise) · buildXe(id): dựng NGAY (đồng bộ) khi đã tải — game dùng cặp này · loadXe = cả hai
export const prepXe = id => load(id);
const ready = new Map();
export async function loadXe(id) { await load(id); return buildXe(id); }
export function buildXe(id) {
  const cfg = XE.find(x => x.id === id);
  const src = ready.get(id);
  if (!src) throw new Error("Xe chưa tải: " + id);
  const scene = src.clone(true);
  // vật liệu riêng cho mỗi bản sao (để 2 đội sơn 2 màu khác nhau)
  const mats = new Map();
  scene.traverse(o => { if (o.isMesh) { o.material = Array.isArray(o.material) ? o.material.map(m => cloneMat(m, mats)) : cloneMat(o.material, mats); } });
  // mảnh lạ làm sai khung bao (vd. Y3 Centenario: Object_12 cao 2 m ⇒ cả xe bị nâng lơ lửng) ⇒ ẩn + bỏ khỏi cảnh trước khi đo
  if (cfg.hide && cfg.hide.length) { const rm = []; scene.traverse(o => { if (cfg.hide.includes(o.name)) rm.push(o); }); rm.forEach(o => o.parent.remove(o)); }
  const inner = new THREE.Group(); inner.add(scene);
  // trục dài theo z
  let box = new THREE.Box3().setFromObject(inner), sz = box.getSize(new THREE.Vector3());
  if (sz.x > sz.z) inner.rotation.y = Math.PI / 2;
  inner.rotation.y += cfg.rotY || 0;
  inner.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(inner); sz = box.getSize(new THREE.Vector3());
  const k = cfg.L / sz.z; inner.scale.setScalar(k); inner.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(inner); const c = box.getCenter(new THREE.Vector3());
  inner.position.set(-c.x, -box.min.y, -c.z);
  const xe = new THREE.Group(); xe.add(inner); xe.name = id;
  xe.userData.cfg = cfg; xe.userData.size = box.getSize(new THREE.Vector3());
  xe.userData.paint = [...mats.values()].filter(m => isPaint(m, cfg));
  xe.userData.paint.forEach(m => { m.userData.orig = m.color.clone(); });
  xe.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return xe;
}

function cloneMat(m, mats) { if (!mats.has(m)) mats.set(m, m.clone()); return mats.get(m); }
// tên vật liệu sơn: "Body" = bỏ texture, sơn phẳng màu đội · "~Body" = GIỮ texture (vân, chữ) và nhân màu đội lên · "Body*" = mọi vật liệu bắt đầu bằng Body
function isPaint(m, cfg) { return (cfg.paint || []).some(p => { const keep = p[0] === "~", q = keep ? p.slice(1) : p;
  const hit = q === m.name || (q.endsWith("*") && m.name.startsWith(q.slice(0, -1))); if (hit) m.userData.keepMap = keep; return hit; }); }

export function setPaint(xe, color) {
  for (const m of xe.userData.paint) {
    if (color == null) { m.color.copy(m.userData.orig); if (m.userData.map !== undefined) { m.map = m.userData.map; m.needsUpdate = true; } continue; }
    // sơn có texture màu ⇒ bỏ texture để màu đội ra đúng
    if (m.userData.map === undefined) m.userData.map = m.map;
    m.map = m.userData.keepMap && m.userData.map ? grey(m.userData.map) : null;
    m.color.set(color); m.needsUpdate = true;
  }
}

// texture sơn có hoa văn màu (vd. P1 GTR xanh lá) ⇒ bản TRẮNG ĐEN giữ vân/chữ, rồi nhân màu đội lên (dùng chung cho mọi bản sao)
const greyCache = new WeakMap();
function grey(t) {
  if (greyCache.has(t)) return greyCache.get(t);
  const img = t.image, w = img.width, h = img.height, c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d"); g.filter = "grayscale(1) brightness(1.25)"; g.drawImage(img, 0, 0);
  const n = new THREE.CanvasTexture(c);
  for (const k of ["colorSpace", "wrapS", "wrapT", "flipY", "channel", "anisotropy", "magFilter", "minFilter"]) n[k] = t[k];
  n.offset.copy(t.offset); n.repeat.copy(t.repeat); n.rotation = t.rotation; n.center.copy(t.center);
  greyCache.set(t, n); return n;
}
