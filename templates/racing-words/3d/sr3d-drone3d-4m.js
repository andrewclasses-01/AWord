// RACING WORDS mẫu 4m (19/10/2026) — MẪU DRONE 3D THẬT (thầy chọn ở chon-drone-4l.html: A1 · A6 · B3; nhóm D máy bay / E phi thuyền chọn thêm sau).
// Tải Sketchfab (CC Attribution — ghi công trong Settings ▸ Drone), nén meshopt (scratchpad process.mjs), để ở speed-run/drone3d/<file>.glb.
// loadDrone(id, bend) ⇒ { obj, mixer|null }: căn giữa, xoay cho MŨI = −Z (yaw), chuẩn cỡ bề ngang lớn nhất = SPAN m, vật liệu đi qua bend (thế giới cong),
//   frustumCulled = false. "basic" = drone tự dựng trong lõi (không file).
import * as THREE from "../../rocket-race/vendor/three/three.module.min.js";
import { GLTFLoader } from "../../rocket-race/vendor/three/addons/GLTFLoader.js";
import { MeshoptDecoder } from "../../rocket-race/vendor/three/addons/meshopt_decoder.module.js";

const BASE = new URL("../drone3d/", import.meta.url).href;
export const SPAN = 2.8;
export const DRONE_MODELS = [
  { id: "basic", name: "Basic", by: "", lic: "" },
  { id: "A1", name: "Mavic", file: "drone-A1-mavic2pro", yaw: Math.PI, by: "MattMaksymowicz", lic: "CC BY 4.0", kind: "quad" },
  { id: "A6", name: "Quad", file: "drone-A6-quadrocopter2", yaw: 0, by: "yanix", lic: "CC BY 4.0", kind: "quad" },
  { id: "B3", name: "Combat", file: "drone-B3-combat", yaw: Math.PI / 2, by: "AbhinavRaj50", lic: "CC BY 4.0", kind: "combat" },
];
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const cache = new Map();
export function droneInfo(id) { return DRONE_MODELS.find(d => d.id === id) || DRONE_MODELS[0]; }
export async function loadDrone(id, bend) {
  const d = droneInfo(id); if (!d.file) return null;
  if (!cache.has(d.id)) cache.set(d.id, loader.loadAsync(BASE + d.file + ".glb"));
  const gl = await cache.get(d.id);
  const src = gl.scene.clone(true);
  const inner = new THREE.Group(); inner.add(src); inner.rotation.y = d.yaw || 0;
  const box = new THREE.Box3().setFromObject(inner), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
  const k = SPAN / Math.max(size.x, size.z, 1e-6);
  const obj = new THREE.Group(); inner.position.sub(c); obj.add(inner); obj.scale.setScalar(k);
  const mats = new Map();
  obj.traverse(o => {
    o.frustumCulled = false;
    if (!o.isMesh) return;
    o.material = (Array.isArray(o.material) ? o.material : [o.material]).map(m => { if (!mats.has(m)) mats.set(m, bend(m.clone())); return mats.get(m); });
    if (o.material.length === 1) o.material = o.material[0];
  });
  let mixer = null;
  if (gl.animations && gl.animations.length) { mixer = new THREE.AnimationMixer(src); gl.animations.forEach(a => mixer.clipAction(a).play()); }
  return { obj, mixer, dispose() { mats.forEach(m => m.dispose()); } };
}
