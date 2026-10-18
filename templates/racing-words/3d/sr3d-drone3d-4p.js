// RACING WORDS mẫu 4p (19/10/2026) = 4o + thầy chốt GIỮ 5 mẫu: Mavic · Quad · Osprey · Northstar · Dvergr (bỏ Basic · Combat · F-2 · Fighter;
//   "basic" chỉ còn làm hình tạm lúc đang nạp, không hiện trong lưới). Sửa: QUAD KHÔNG QUAY — node cánh quạt lồng nhau (node cha + mesh con cùng tên "propeller")
//   bị bọc 2 trục quay NGƯỢC chiều ⇒ triệt tiêu; nay bỏ node có tổ tiên đã là cánh quạt. File Mavic đổi tên -v2 + ?v= ⇒ trình duyệt không dùng bản cũ đã lưu.
// ---- gốc 4o ----
// RACING WORDS mẫu 4o (19/10/2026) = 4n + SỬA TRỤC QUẠT (thầy: "cánh quạt của Mavic bị lỗi"): mọi cánh quạt quay quanh TRỌNG TÂM ĐỈNH của chính nó
//   (quạt 2 / 3 lá cân đối ⇒ trọng tâm = trục; bản 4n lấy trục đoán / tâm hộp bao ⇒ Osprey quay lệch) + VÒNG MỜ mỏng như quạt thật đang quay.
//   Mavic tách lại bằng tools/split2.mjs (theo MẢNH LIỀN — bản 1 cắt theo bán kính sót đầu cánh ⇒ mảnh vụn đứng yên).
// ---- gốc 4n ----
// RACING WORDS mẫu 4n (19/10/2026) — 8 MẪU DRONE 3D + CÁNH QUẠT QUAY (thầy: "cánh quạt phải quay, quỹ đạo bay lắng lắng như drone thật").
//   Thầy chọn: A1 Mavic · A6 Quad · B3 Combat (4m) + D1 F-2 · D6 Osprey · E1 Fighter · E3 Northstar · E4 Dvergr. Sketchfab CC BY (ghi công ở Settings ▸ Drone).
//   File ở speed-run/drone3d/: ảnh bề mặt ≤ 1024 webp + meshopt (scratchpad tex.mjs → process.mjs). Cánh quạt:
//   · A1 / D6 vốn LIỀN thân ⇒ đã tách sẵn bằng split.mjs thành node "PROP_<k>" (gốc node = trục quạt)
//   · A6 có sẵn node "quadrocopter_propeller_N" ⇒ trục = tâm hộp bao (quạt 2 cánh đối xứng)
//   loadDrone(id, bend) ⇒ { obj, mixer, props: [{ o, dir }], kind, dispose } — obj căn giữa, mũi = −Z, bề ngang lớn nhất = SPAN m.
//   kind: "quad" (4 cánh) · "bug" (côn trùng, có chuyển động sẵn) · "jet" (tiêm kích) · "tilt" (cánh quạt nghiêng Osprey) · "ship" (phi thuyền) — lõi dùng để chọn kiểu bay.
import * as THREE from "../../rocket-race/vendor/three/three.module.min.js";
import { GLTFLoader } from "../../rocket-race/vendor/three/addons/GLTFLoader.js";
import { MeshoptDecoder } from "../../rocket-race/vendor/three/addons/meshopt_decoder.module.js";

const BASE = new URL("../drone3d/", import.meta.url).href;
export const SPAN = 2.8;
export const DRONE_MODELS = [
  { id: "basic", name: "Basic", kind: "quad", by: "", lic: "", hide: true },   // 4p: chỉ là hình tạm lúc nạp
  { id: "A1", name: "Mavic", file: "drone-A1-mavic2pro-v2", yaw: Math.PI, kind: "quad", by: "MattMaksymowicz", lic: "CC BY 4.0" },
  { id: "A6", name: "Quad", file: "drone-A6-quadrocopter2", yaw: 0, kind: "quad", by: "yanix", lic: "CC BY 4.0" },
  { hide: true, id: "B3", name: "Combat", file: "drone-B3-combat", yaw: Math.PI / 2, kind: "bug", by: "AbhinavRaj50", lic: "CC BY 4.0" },
  { hide: true, id: "D1", name: "F-2 Jet", file: "drone-D1-f2a", yaw: Math.PI, kind: "jet", span: 3.4, by: "Yi Tsung Lee", lic: "CC BY 4.0" },
  { id: "D6", name: "Osprey", file: "drone-D6-osprey", yaw: 0, kind: "tilt", span: 3.6, by: "Muhamad Mirza Arrafi", lic: "CC BY 4.0" },
  { hide: true, id: "E1", name: "Fighter", file: "drone-E1-spacefighter", yaw: Math.PI, kind: "ship", span: 3.2, by: "Comrade1280", lic: "CC BY 4.0" },
  { id: "E3", name: "Northstar", file: "drone-E3-northstar", yaw: Math.PI / 2, kind: "ship", span: 3.4, by: "Mark Bai", lic: "CC BY 4.0" },
  { id: "E4", name: "Dvergr", file: "drone-E4-dvergr", yaw: Math.PI, kind: "ship", span: 3.2, by: "Star Conflict", lic: "CC BY 4.0" },
];
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const cache = new Map();
export function droneInfo(id) { return DRONE_MODELS.find(d => d.id === id) || DRONE_MODELS[0]; }
export const DRONE_PICK = DRONE_MODELS.filter(d => !d.hide);   // 4p: mẫu hiện trong lưới chọn
export async function loadDrone(id, bend) {
  const d = droneInfo(id); if (!d.file) return null;
  if (!cache.has(d.id)) cache.set(d.id, loader.loadAsync(BASE + d.file + ".glb?v=4p"));
  const gl = await cache.get(d.id);
  const src = gl.scene.clone(true);
  // cánh quạt: node PROP_k (gốc = trục) · node tên có "propeller" (bọc vào trục đặt ở tâm hộp bao)
  const props = [];
  src.updateMatrixWorld(true);
  const isProp = o => /^PROP_/.test(o.name) || /propeller/i.test(o.name);
  const found = []; src.traverse(o => { if (!isProp(o)) return; for (let a = o.parent; a; a = a.parent) if (isProp(a)) return; found.push(o); });   // 4p: bỏ node con của cánh quạt đã có
  // 4o: trục = TRỌNG TÂM các đỉnh (hệ thế giới của mẫu, y hướng lên) · r = tầm xa nhất theo phương ngang (cho vòng mờ)
  const W = new THREE.Vector3();
  found.forEach((o, k) => {
    const c = new THREE.Vector3(); let n = 0;
    o.traverse(m => { if (!m.isMesh) return; const a = m.geometry.attributes.position; for (let i = 0; i < a.count; i++) { c.add(W.fromBufferAttribute(a, i).applyMatrix4(m.matrixWorld)); n++; } });
    if (!n) return; c.divideScalar(n);
    let r = 0; o.traverse(m => { if (!m.isMesh) return; const a = m.geometry.attributes.position; for (let i = 0; i < a.count; i++) { W.fromBufferAttribute(a, i).applyMatrix4(m.matrixWorld); r = Math.max(r, Math.hypot(W.x - c.x, W.z - c.z)); } });
    const par = o.parent, piv = new THREE.Group(); piv.name = "PIVOT_" + k; par.worldToLocal(piv.position.copy(c)); par.add(piv); piv.attach(o);
    const ps = new THREE.Vector3(); par.getWorldScale(ps); props.push({ o: piv, dir: k % 2 ? -1 : 1, r: r / (ps.x || 1) });   // r theo hệ của node cha (mẫu Sketchfab hay có node thu nhỏ)
  });
  const inner = new THREE.Group(); inner.add(src); inner.rotation.y = d.yaw || 0;
  const box = new THREE.Box3().setFromObject(inner), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
  const k = (d.span || SPAN) / Math.max(size.x, size.z, 1e-6);
  const obj = new THREE.Group(); inner.position.sub(c); obj.add(inner); obj.scale.setScalar(k);
  // trục quay mỗi quạt = phương THẲNG ĐỨNG của mẫu, đổi về hệ toạ độ RIÊNG của node quạt (mẫu Sketchfab hay có node xoay Z-up ⇒ không giả định trục Y)
  obj.updateMatrixWorld(true);
  const q = new THREE.Quaternion();
  props.forEach(p => { p.o.parent.getWorldQuaternion(q); const up = new THREE.Vector3(0, 1, 0).applyQuaternion(q.invert()); p.axis = up.applyQuaternion(p.o.quaternion.clone().invert()).normalize(); });
  // 4o: VÒNG MỜ quạt quay (đĩa trong, mỏng) — nằm vuông góc trục, bán kính = tầm cánh; cùng quay theo trục (tròn ⇒ không thấy quay)
  const discG = new THREE.CircleGeometry(1, 40), discM = bend(new THREE.MeshBasicMaterial({ color: "#d8dee8", transparent: true, opacity: 0.09, depthWrite: false, side: THREE.DoubleSide }));
  props.forEach(p => { if (!p.r) return; const disc = new THREE.Mesh(discG, discM); disc.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), p.axis); disc.scale.setScalar(p.r * 0.97); disc.frustumCulled = false; disc.renderOrder = 2; p.o.add(disc); });
  const mats = new Map();
  obj.traverse(o => {
    o.frustumCulled = false;
    if (!o.isMesh) return;
    o.material = (Array.isArray(o.material) ? o.material : [o.material]).map(m => { if (!mats.has(m)) mats.set(m, bend(m.clone())); return mats.get(m); });
    if (o.material.length === 1) o.material = o.material[0];
  });
  let mixer = null;
  if (gl.animations && gl.animations.length) { mixer = new THREE.AnimationMixer(src); gl.animations.forEach(a => mixer.clipAction(a).play()); }
  return { obj, mixer, props, kind: d.kind, dispose() { mats.forEach(m => m.dispose()); discG.dispose(); discM.dispose(); } };
}
