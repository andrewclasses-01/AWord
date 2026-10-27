// RACING WORDS mẫu 5l (27/10/2026) = sr3d-world-5j.js + ĐƯỜNG CUA GẮT ~90° (thầy: "nhiều đoạn cua gấp hơn, gần như 90 độ và zigzag hơn"):
//   · UỐN XOAY THẬT: cũ chỉ XÔ NGANG (x += X(d), trần tan φ = 2 ⇒ ≤ 63°, mặt đường bị xiên hẹp lại) — nay mỗi đỉnh (x lệch ngang, a mét phía trước)
//     ⇒ tim đường C(a) + x·pháp tuyến(φ(a)) — bảng uBendT RGBA (phải, tới, φ) tính từ đường THẬT (sr3d-track-5l.js) mỗi máy quay.
//     Vật thể đi theo hướng đường (xe phía trước đã ôm cua thì quay đúng góc); pháp tuyến xoay theo ⇒ ánh sáng đúng.
//     Độ võng xa (uBend.y) tính theo khoảng cách TỚI THẬT sau khi xoay ⇒ đường / đất / biển cùng võng (không chui xuống đất sau khúc cua).
//   · ĐẤT + BIỂN theo TOẠ ĐỘ THẾ GIỚI THẬT (không uốn): cũ gắn theo (x lệch đường, s) — núi bên trái / biển bên phải; với cua 90° mặt đất phía trong cua
//     sẽ GẬP chồng lên nhau. Nay đỉnh lưới đất → toạ độ thật bằng 1 phép xoay + dời cứng (uTrk = tim đường + hướng tại máy quay), độ cao theo trường
//     KHOẢNG CÁCH tới đường (ảnh 1 kênh, ô 4 m): sát đường phẳng, xa lên đồi, rất xa thành núi; phía Nam vòng đua là bãi cát + biển.
//   · CÂY / BỤI / CỎ / DỪA / CỘT ĐÈN: rải theo (s, x) như cũ nhưng HAI BÊN đường, bỏ chỗ trong lòng cua gắt (κ·x > 0,55 — sẽ gập), bỏ chỗ sát một đoạn đường khác,
//     độ cao lấy ở toạ độ thật; dừa chỉ ở bãi cát ven biển.
// ---- gốc 5j ----
// RACING WORDS mẫu 5j (21/10/2026) = sr3d-world-4b.js + VÙNG CẢNH THỨ 2 quanh Roadster (thầy: "roadster đi quá xa, núi trống, không có cây"):
//   update(camPos, t, sMin, sMax, sAlt) — sAlt = chỗ xe bay; nằm ngoài cửa sổ cảnh của 2 xe ⇒ rải thêm cây / cột / bụi quanh nó (gần trước, xa sau; chung trần số cây).
// ---- gốc 4b ----
// RACING WORDS mẫu 4b (16/10/2026) = sr3d-world-4a.js + ĐƯỜNG CONG ĐÚNG VẬT LÝ (thầy: "xe đi thẳng nhưng đôi khi đoạn đường phía xa vắt sang trái,
//   vắt sang phải rất nhanh … cần đường đua giống thực tế vật lý"): cũ = 1 hệ số cong chung (trung bình 30–150 m) cho CẢ đoạn xa ⇒ mỗi khúc S mới lọt vào
//   tầm là cả đường xa quẹt ngang. Nay dịch ngang = HÌNH THẬT của đường phía trước: lõi tích phân độ cong bản đồ từ chỗ máy quay ra 1.400 m
//   (góc hướng φ(d) = ∫κ, lệch X(d) = ∫sin φ) ⇒ bảng 256 mẫu (uBendT, ảnh nổi 1 dòng), shader nội suy; ngoài 1.400 m theo tiếp tuyến (uBend.x).
//   Điểm nào trên đường cũng đứng YÊN trong thế giới — chỉ đổi khi máy quay thật sự đi tới / quay đầu. Bầu trời xoay theo HƯỚNG TUYỆT ĐỐI của đường
//   tại máy quay (U.uSkyYaw) — không còn xoay theo đường xa.
// ---- gốc 4a ----
// RACING WORDS mẫu 4a (16/10/2026) = sr3d-world-3r.js + đợt 2/5 (hồ sơ mục 35):
//   · CÂY CHI TIẾT HƠN mà vẫn rẻ: thông 4 tầng tán (mép tán lệch ngẫu nhiên), cây tròn 3 khối tán lồi lõm, vân sáng–tối VẼ SẴN vào màu đỉnh
//     (gốc tối, ngọn sáng ⇒ có khối như có bóng, 0 chi phí đèn) + BỤI CÂY và CỎ (InstancedMesh, cỏ chỉ ~430 m quanh xe) — vẫn 1 vật liệu chung, KHÔNG lá trong suốt.
//   · VẠCH "ANDREW STUDIO" sơn giữa đường kiểu đường đua, thỉnh thoảng (~420 m), né cầu nhảy / cổng (setAvoid) — 1 InstancedMesh.
//   · CỘT MỐC đoạn: 14 chỗ dùng lại theo cửa sổ quanh xe (cũ dựng sẵn MỌI mốc ⇒ đường ×3 = 300 lệnh vẽ); số in lúc cần, nhớ theo số.
//   · setTrack({ SEG, segs, LAP, laps }) — segs = Infinity ⇒ mốc không có "/ tổng"; cổng LAP chỉ khi đua theo độ dài.
//   · CỔNG ĐÍCH DỜI ĐƯỢC: setFinish(s | null) — đích tuỳ diễn biến trận (hết giờ / hết từ / hết mạng). Cổng luôn có trong cảnh (null ⇒ cất sau vạch xuất phát)
//     ⇒ shader đã dịch sẵn, hiện ra giữa trận không khựng.
// ---- gốc 3r ----
// 3r (16/10/2026, đo TOMKO): THỨ TỰ VẼ — bản cũ vẽ TRỜI đầu tiên (renderOrder −10, phủ kín màn, fbm mây) rồi đất (−5, 2 fbm/điểm ảnh) rồi biển,
//   sau cùng mới tới đường / xe / cây đè lên ⇒ GPU tính shader nhiễu cho cả những điểm ảnh bị che. Nay vật thường (0) và vạch (1) vẽ TRƯỚC,
//   rồi đất (2), biển (3), trời CUỐI (4; gl_Position.z = w ⇒ độ sâu 1,0 chỉ qua được chỗ còn trống) ⇒ loại sớm theo độ sâu (early-z), hình y như cũ.
// =============================================================
// SPEED RUN 3D — THẾ GIỚI (mẫu 3, 15/10/2026 — chép từ sr3d-world-1.js của mẫu 1/2)
// Mẫu 3 (thầy 15/10): BỎ dải phân cách cứng giữa 2 đội ⇒ vạch giữa = vạch TRẮNG ĐỨT (lấn sang được); ĐƯỜNG VÒNG nhiều vòng
//   ⇒ setTrack(L, SEG, LAP): vạch mỗi đoạn + cổng "LAP n" ở mỗi mốc vòng + cổng FINISH ở đích.
// Đường cao tốc ven biển lúc hoàng hôn, VÔ TẬN theo máy quay (kỹ thuật Train Rush west-world-1c):
//   · mặt đất = 1 tấm lưới bám máy quay; độ cao TÍNH TRONG SHADER theo toạ độ thế giới (đồi + núi bên trái, bãi cát bên phải)
//   · biển = tấm nước riêng (sóng lấp lánh theo mặt trời, bọt sát bờ — bờ lượn theo z)
//   · đường đôi 4 làn (mỗi đội 2 làn: đội 1 nửa TRÁI, đội 2 nửa PHẢI, dải phân cách vàng giữa) + rào hộ lan, bám máy quay, ghép mép theo bội số 48 m
//   · cột đèn / cây thông / cây tròn / cọc dừa = InstancedMesh, vị trí sinh TẤT ĐỊNH theo khúc (hash) ⇒ quay lại chỗ cũ thấy y như cũ
//   · vạch đoạn (mỗi câu đúng = 1 đoạn), vạch xuất phát, cổng đích ANDREW STUDIO
// CONG THẾ GIỚI ("curved world"): mọi vật liệu cảnh đi qua `bend()` — vertex dịch x += bx·dz², y −= by·dz² (dz = khoảng cách TRƯỚC máy quay)
// ⇒ đường có vẻ uốn lượn và đổ dốc ở xa, còn luật/máy quay/xe vẫn chạy trên trục z thẳng. Ô chữ/HUD là DOM nên không bị cong.
// ⚠️ Độ cao đất trong shader và trong JS (đặt cây) phải là CÙNG một hàm: JS dùng Math.fround từng phép để khớp float32 của GPU.
// =============================================================
import * as THREE from "../../rocket-race/vendor/three/three.module.min.js";

export const LANES = { left: [-2.4, -6.0], right: [2.4, 6.0] };   // [làn trong, làn ngoài] — đội 0 nửa trái, đội 1 nửa phải
export const ROAD_HALF = 10.2;                                     // mép rào hộ lan
const TILE = 48;                                                    // chiều dài 1 ô ảnh mặt đường (m)

// ---------- nhiễu dùng chung GLSL + JS (khớp nhau) ----------
const NOISE_GLSL = `
float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vnoise(vec2 p){ vec2 i = floor(p); vec2 f = fract(p); vec2 u = f*f*(3.0-2.0*f);
  float a = hash12(i), b = hash12(i+vec2(1.0,0.0)), c = hash12(i+vec2(0.0,1.0)), d = hash12(i+vec2(1.0,1.0));
  return mix(mix(a,b,u.x), mix(c,d,u.x), u.y); }
float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++){ s += a*vnoise(p); p = p*2.03 + vec2(17.1, 9.2); a *= 0.5; } return s; }
float shoreX(float z){ return 8.0*sin(z*0.013) + 5.0*sin(z*0.041 + 1.7); }
`;

// 5l: ĐỊA HÌNH THEO TOẠ ĐỘ THẬT q = (Đông, Nam) mét — d = khoảng cách tới tim đường gần nhất (ảnh uDistT), sy = quá bờ biển bao nhiêu (dương = trong biển)
const TERRAIN_GLSL = `uniform sampler2D uDistT; uniform vec4 uDistM; uniform float uShore; uniform vec4 uTrk;
float trkD(vec2 q){ vec2 uv = (q - uDistM.xy) * uDistM.zw; if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return 255.0; return texture2D(uDistT, uv).r * 255.0; }
float shoreY(vec2 q){ return q.y - uShore - shoreX(q.x); }
float groundH(vec2 q){ float d = trkD(q), sy = shoreY(q);
  float L = smoothstep(16.0, 62.0, d), HF = 1.0 - smoothstep(-230.0, -90.0, sy), R = smoothstep(-12.0, 50.0, sy) * smoothstep(13.0, 22.0, d);
  return HF * (L*(fbm(q*0.011)*42.0 + 3.0) + smoothstep(120.0, 420.0, d)*fbm(q*0.0042 + 3.7)*130.0) - R*5.0
    + smoothstep(11.0, 15.0, d)*(1.0 - smoothstep(15.0, 24.0, d))*0.35*(1.0 - HF) - 0.06*(1.0 - L); }
vec2 toW(vec3 b){ float f = uBendZ - b.z; return uTrk.xy + vec2(-uTrk.w, uTrk.z) * b.x + uTrk.zw * f; }   // điểm cảnh (đã ở khung máy quay) → toạ độ thật
`;
const f = Math.fround;
const fract = x => f(x - Math.floor(x));
const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function hash12(px, py) {
  const k = f(0.1031), c = f(33.33);
  let x = fract(f(px * k)), y = fract(f(py * k)), z = x;
  const d = f(f(f(x * f(y + c)) + f(y * f(z + c))) + f(z * f(x + c)));
  x = f(x + d); y = f(y + d); z = f(z + d);
  return fract(f(f(x + y) * z));
}
function vnoise(px, py) {
  const ix = Math.floor(px), iy = Math.floor(py), fx = f(px - ix), fy = f(py - iy);
  const ux = f(fx * fx * f(3 - 2 * fx)), uy = f(fy * fy * f(3 - 2 * fy));
  const a = hash12(ix, iy), b = hash12(ix + 1, iy), c = hash12(ix, iy + 1), d = hash12(ix + 1, iy + 1);
  const m1 = a + (b - a) * ux, m2 = c + (d - c) * ux; return m1 + (m2 - m1) * uy;
}
function fbm(px, py) { let s = 0, a = 0.5; px = f(px); py = f(py); for (let i = 0; i < 4; i++) { s += a * vnoise(px, py); px = f(f(px * f(2.03)) + f(17.1)); py = f(f(py * f(2.03)) + f(9.2)); a *= 0.5; } return s; }
const shoreX = z => 8 * Math.sin(z * 0.013) + 5 * Math.sin(z * 0.041 + 1.7);
// 5l: bản JS của groundH (đặt cây) — trk = buildTrack() (distAt song tuyến như GPU, SHORE_Y)
export function groundW(trk, X, Y) {
  const d = trk.distAt(X, Y), sy = Y - trk.SHORE_Y - shoreX(X);
  const L = sstep(16, 62, d), HF = 1 - sstep(-230, -90, sy), R = sstep(-12, 50, sy) * sstep(13, 22, d);
  return HF * (L * (fbm(X * 0.011, Y * 0.011) * 42 + 3) + sstep(120, 420, d) * fbm(X * 0.0042 + 3.7, Y * 0.0042 + 3.7) * 130) - R * 5
    + sstep(11, 15, d) * (1 - sstep(15, 24, d)) * 0.35 * (1 - HF) - 0.06 * (1 - L);
}
export const sandW = (trk, X, Y) => { const sy = Y - trk.SHORE_Y - shoreX(X); return sstep(-48, -26, sy) * sstep(12, 16, trk.distAt(X, Y)); };

// ---------- cong thế giới ----------
// 3q (thầy 15/10: "núi và cảnh phía xa thay đổi rất bất hợp lý … chóng mặt"): bản cũ lệch = b·d² ở MỌI khoảng cách ⇒ núi 1.000 m lệch
//   tới ~1.800 m mỗi lần độ cong đổi. Nay CONG THẬT trong BEND_D0 = 150 m (đúng tầm đọc khúc cua 30–150 m của bendFor), xa hơn đi theo
//   TIẾP TUYẾN ⇒ cảnh xa chỉ XOAY một góc atan(2·b·D0) như khi xe quay đầu thật; bầu trời xoay cùng góc (skyRot). bendQ JS = cùng công thức.
export const BEND_D0 = 150;
export const bendQ = d => { const a = -Math.min(d, 0); return a <= BEND_D0 ? a * a : BEND_D0 * (2 * a - BEND_D0); };
// 5l: bảng uBendT (RGBA float, 256 mẫu trên uBendD m phía trước máy quay): r = lệch PHẢI, g = TỚI của tim đường, b = φ (hướng đường so với tim tại máy quay)
//   ⇒ đỉnh (x, a) = C(a) + x·(cos φ, −sin φ) [phải, tới]; xa hơn uBendD ⇒ theo tiếp tuyến cuối. Sau lưng máy quay (a ≤ 0) ⇒ không uốn.
//   bPhi = φ của đỉnh vừa uốn (makeBend dùng để xoay pháp tuyến).
export const BEND_GLSL = `uniform vec2 uBend; uniform float uBendZ; uniform sampler2D uBendT; uniform float uBendD;
float bPhi;
float bendQ(float d){ float a = -d; return a <= 150.0 ? a*a : 150.0*(2.0*a - 150.0); }
vec4 bendW(vec4 w){ float a = uBendZ - w.z; bPhi = 0.0;
  if (uBendD <= 0.0 || a <= 0.0) return w;
  float f = clamp(a / uBendD, 0.0, 1.0) * 255.0; float i0 = min(floor(f), 254.0);
  vec3 p = mix(texelFetch(uBendT, ivec2(int(i0), 0), 0).rgb, texelFetch(uBendT, ivec2(int(i0) + 1, 0), 0).rgb, f - i0);
  float cs = cos(p.z), sn = sin(p.z); vec2 c = p.xy + max(a - uBendD, 0.0) * vec2(sn, cs);
  float fw = c.y - w.x * sn; w.x = c.x + w.x * cs; w.z = uBendZ - fw; w.y -= uBend.y * bendQ(-fw); bPhi = p.z; return w; }`;
export function makeBend(U) {
  return mat => {
    const prev = mat.onBeforeCompile;
    mat.onBeforeCompile = (sh, r) => {
      if (prev) prev(sh, r);
      const hasN = sh.vertexShader.includes("#include <normal_vertex>");   // 5l
      sh.uniforms.uBend = U.uBend; sh.uniforms.uBendZ = U.uBendZ; sh.uniforms.uBendT = U.uBendT; sh.uniforms.uBendD = U.uBendD;   // 4b
      sh.vertexShader = BEND_GLSL + "\n" + sh.vertexShader.replace("#include <project_vertex>", `
        vec4 bw = vec4( transformed, 1.0 );
        #ifdef USE_BATCHING
          bw = batchingMatrix * bw;
        #endif
        #ifdef USE_INSTANCING
          bw = instanceMatrix * bw;
        #endif
        bw = bendW(modelMatrix * bw);
        vec4 mvPosition = viewMatrix * bw;
        gl_Position = projectionMatrix * mvPosition;` + (hasN ? `
        #ifndef FLAT_SHADED
        if (bPhi != 0.0) { vec3 nw = transpose(mat3(viewMatrix)) * vNormal; float bc = cos(bPhi), bs = sin(bPhi);   // 5l: pháp tuyến xoay theo đường
          vNormal = normalize(mat3(viewMatrix) * vec3(bc * nw.x - bs * nw.z, nw.y, bs * nw.x + bc * nw.z)); }
        #endif` : ""));
    };
    mat.customProgramCacheKey = () => "bend5l|" + (prev ? prev.toString().length : 0);
    return mat;
  };
}

function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; }
function tex(c, srgb = true) { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
function mulberry(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---------- bầu trời hoàng hôn (vòm bám máy quay, không cong) ----------
export const SUN_DIR = new THREE.Vector3(0.38, 0.085, -0.92).normalize();   // mặt trời thấp, phía TRƯỚC-PHẢI trên biển
export const HAZE = new THREE.Color("#e7a982");
function makeSky() {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uSun: { value: SUN_DIR }, uHaze: { value: HAZE }, uT: { value: 0 }, uRot: { value: new THREE.Matrix3() } },
    vertexShader: `uniform mat3 uRot; varying vec3 vDir; void main(){ vDir = uRot * normalize((modelMatrix * vec4(position,1.0)).xyz - cameraPosition); gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position,1.0); gl_Position.z = gl_Position.w; }`,
    fragmentShader: NOISE_GLSL + `uniform vec3 uSun; uniform vec3 uHaze; uniform float uT; varying vec3 vDir;
      void main(){ vec3 d = normalize(vDir); float e = d.y;
        vec3 zen = vec3(0.13,0.19,0.40), mid = vec3(0.55,0.42,0.62), low = vec3(0.98,0.60,0.40), hor = vec3(1.0,0.80,0.56);
        vec3 c = mix(hor, low, smoothstep(0.0, 0.06, e)); c = mix(c, mid, smoothstep(0.05, 0.22, e)); c = mix(c, zen, smoothstep(0.2, 0.75, e));
        c = mix(c, uHaze, smoothstep(0.02, -0.06, e));
        float s = max(dot(d, uSun), 0.0);
        c += vec3(1.0,0.55,0.25) * (pow(s, 6.0)*0.35 + pow(s, 60.0)*0.6) + vec3(1.0,0.92,0.75) * smoothstep(0.9993, 0.9997, s) * 3.0;
        if (e > 0.0) { vec2 q = d.xz / (e + 0.12) * 1.6; float cl = smoothstep(0.55, 0.85, fbm(q*vec2(1.0,3.2) + vec2(uT*0.004, 0.0)));
          vec3 cc = mix(vec3(1.0,0.62,0.55), vec3(0.95,0.75,0.85), smoothstep(0.05, 0.3, e)) * (0.75 + 0.6*pow(s,4.0));
          c = mix(c, cc, cl * smoothstep(0.015, 0.08, e) * 0.75); }
        gl_FragColor = vec4(c, 1.0); }`,
    side: THREE.BackSide, depthWrite: false, fog: false
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(1800, 48, 24), mat); m.renderOrder = 4; m.frustumCulled = false;   // 3r: trời vẽ CUỐI (cũ −10)
  return m;
}

// ---------- mặt đất + biển (shader tự viết, có cong + sương) ----------
const FOGU = { uFogCol: { value: HAZE }, uFogNear: { value: 140 }, uFogFar: { value: 1150 } };
// 5l: đất / biển KHÔNG uốn — lưới bám máy quay, mỗi đỉnh tự đổi sang toạ độ thật (toW) để lấy độ cao; chỉ cộng độ võng xa (uBend.y) như đường
function terrU(U, T) { return { uBend: U.uBend, uBendZ: U.uBendZ, uBendT: U.uBendT, uBendD: U.uBendD, uTrk: U.uTrk, uDistT: T.tex, uDistM: T.m, uShore: T.shore }; }
function makeGround(U, KEY, T) {
  const g = new THREE.PlaneGeometry(1700, 1700, 170, 170).rotateX(-Math.PI / 2);
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...FOGU, ...terrU(U, T), uKey: { value: KEY } },
    vertexShader: NOISE_GLSL + BEND_GLSL + TERRAIN_GLSL + `
      varying vec3 vW; varying vec3 vN; varying float vFog;
      void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vec2 q = toW(w.xyz), R = vec2(-uTrk.w, uTrk.z), F = uTrk.zw;
        float h = groundH(q); float e = 1.5; float hx = groundH(q + R * e), hz = groundH(q - F * e);   // dốc theo trục khung máy quay (x phải, z lùi)
        vN = normalize(vec3(h - hx, e, h - hz)); vW = vec3(q.x, h, q.y);
        w.y = h - uBend.y * bendQ(min(w.z - uBendZ, 0.0)); vec4 mv = viewMatrix * w; vFog = length(mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: NOISE_GLSL + TERRAIN_GLSL.replace("uniform vec4 uTrk;", "uniform vec4 uTrk; uniform float uBendZ;") + `uniform vec3 uFogCol; uniform float uFogNear, uFogFar; uniform vec3 uKey;
      varying vec3 vW; varying vec3 vN; varying float vFog;
      void main(){ vec3 n = normalize(vN); float slope = 1.0 - n.y; float d = trkD(vW.xz), sy = shoreY(vW.xz);
        float nz = fbm(vW.xz * 0.09), nz2 = fbm(vW.xz * 0.6);
        vec3 grass = mix(vec3(0.20,0.27,0.10), vec3(0.36,0.40,0.15), nz) * (0.85 + 0.3*nz2);
        vec3 rock = mix(vec3(0.38,0.33,0.28), vec3(0.52,0.46,0.39), nz2);
        vec3 c = mix(grass, rock, smoothstep(0.25, 0.55, slope));
        c = mix(c, vec3(0.42,0.36,0.30), smoothstep(60.0, 120.0, vW.y) * 0.6);                         // núi cao: đá trơ
        float sand = smoothstep(-48.0, -26.0, sy) * smoothstep(11.5, 13.5, d);                          // 5l: bãi cát ven biển (phía Nam)
        vec3 sc = mix(vec3(0.86,0.73,0.52), vec3(0.93,0.82,0.62), nz2);
        sc = mix(sc, vec3(0.62,0.50,0.36), smoothstep(-0.6, -1.25, vW.y));                                 // cát ướt sát nước
        c = mix(c, sc, sand);
        c = mix(c, vec3(0.40,0.35,0.28) * (0.9 + 0.2*nz2), (1.0 - step(13.0, d)) * step(10.0, d) * (1.0 - sand*0.6));   // lề đất sát rào
        float dif = max(dot(n, normalize(uKey)), 0.0);
        vec3 lit = c * (vec3(0.52,0.46,0.50) + vec3(1.15,0.90,0.70) * dif);
        lit = mix(lit, uFogCol, smoothstep(uFogNear, uFogFar, vFog));
        gl_FragColor = vec4(lit, 1.0); }`,
    fog: false
  });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = 2;   // 3r: sau đường / xe / cây (cũ −5)
  return m;
}
function makeSea(U, T) {
  const g = new THREE.PlaneGeometry(1700, 1700, 85, 170).rotateX(-Math.PI / 2);   // 5l: phủ cả quanh máy quay (biển ở đâu là do toạ độ thật)
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...FOGU, ...terrU(U, T), uSun: { value: SUN_DIR }, uT: { value: 0 } },
    vertexShader: NOISE_GLSL + BEND_GLSL + TERRAIN_GLSL + `varying vec3 vW; varying float vFog; varying vec3 vB;
      void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vec2 q = toW(w.xyz); vW = vec3(q.x, w.y, q.y);
        w.y -= uBend.y * bendQ(min(w.z - uBendZ, 0.0)); vB = w.xyz; vec4 mv = viewMatrix * w; vFog = length(mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: NOISE_GLSL + TERRAIN_GLSL.replace("uniform vec4 uTrk;", "uniform vec4 uTrk; uniform float uBendZ;") + `uniform vec3 uFogCol; uniform float uFogNear, uFogFar; uniform vec3 uSun; uniform float uT;
      varying vec3 vW; varying float vFog; varying vec3 vB;
      void main(){ vec2 q = vW.xz;
        float n1 = vnoise(q*0.18 + vec2(uT*0.35, uT*0.2)), n2 = vnoise(q*0.47 - vec2(uT*0.5, -uT*0.3)), n3 = vnoise(q*1.3 + vec2(0.0, uT*0.9));
        vec3 N = normalize(vec3((n1 - 0.5)*0.55 + (n2 - 0.5)*0.35 + (n3-0.5)*0.15, 1.0, (n2 - 0.5)*0.5 + (n3 - 0.5)*0.2));
        vec3 V = normalize(vB - cameraPosition); vec3 R = reflect(V, N);
        float fres = pow(1.0 - max(dot(-V, N), 0.0), 4.0);
        vec3 deep = vec3(0.07,0.20,0.30), shallow = vec3(0.12,0.38,0.42);
        float dep = -1.3 - groundH(q);
        vec3 c = mix(shallow, deep, smoothstep(0.2, 3.5, dep));
        vec3 skyR = mix(vec3(1.0,0.66,0.45), vec3(0.55,0.45,0.62), smoothstep(0.0, 0.35, R.y));
        c = mix(c, skyR, 0.25 + 0.65*fres);
        float s = max(dot(R, uSun), 0.0); c += vec3(1.0,0.75,0.45) * (pow(s, 220.0)*4.0 + pow(s, 24.0)*0.35);
        float foam = smoothstep(0.55, 0.0, dep + 0.18*sin(uT*1.6 + q.x*0.9 + q.y*0.05)) * (0.55 + 0.45*n3);
        c = mix(c, vec3(0.97,0.93,0.86), foam*0.85);
        c = mix(c, uFogCol, smoothstep(uFogNear, uFogFar, vFog));
        gl_FragColor = vec4(c, 1.0); }`,
    fog: false
  });
  const m = new THREE.Mesh(g, mat); m.position.y = -1.3; m.frustumCulled = false; m.renderOrder = 3;   // 3r: (cũ −4)
  return m;
}

// ---------- mặt đường ----------
function roadTexture() {
  const PX = 50, W = Math.round(ROAD_HALF * 2 * PX), H = TILE * 40;          // 20,4 m × 48 m → 1020 × 1920
  const [c, g] = canvas(W, H), X = x => (x + ROAD_HALF) * PX, Y = z => z * 40;
  g.fillStyle = "#3b3d41"; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 90000; i++) { const v = Math.random() < 0.5 ? 255 : 0; g.fillStyle = `rgba(${v},${v},${v},${0.03 + Math.random() * 0.07})`; g.fillRect(Math.random() * W, Math.random() * H, 1 + Math.random() * 2, 1 + Math.random() * 2); }
  [-6, -2.4, 2.4, 6].forEach(x => { const gr = g.createLinearGradient(X(x - 1.6), 0, X(x + 1.6), 0);   // vệt bánh xe tối
    gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(0.25, "rgba(0,0,0,.13)"); gr.addColorStop(0.4, "rgba(0,0,0,0)"); gr.addColorStop(0.6, "rgba(0,0,0,0)"); gr.addColorStop(0.75, "rgba(0,0,0,.13)"); gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr; g.fillRect(X(x - 1.6), 0, 3.2 * PX, H); });
  g.fillStyle = "rgba(70,72,76,.9)"; g.fillRect(X(-ROAD_HALF), 0, (ROAD_HALF - 7.9) * PX, H); g.fillRect(X(7.9), 0, (ROAD_HALF - 7.9) * PX, H);   // lề nhựa sáng hơn
  // dải gờ giảm tốc đỏ/trắng sát mép (vibe đường đua)
  for (let z = 0; z < TILE; z += 1) { g.fillStyle = (z % 2) ? "#e9e6df" : "#c8262b"; g.fillRect(X(-8.55), Y(z), 0.5 * PX, 40); g.fillRect(X(8.05), Y(z), 0.5 * PX, 40); }
  const line = (x, w, col) => { g.fillStyle = col; g.fillRect(X(x - w / 2), 0, w * PX, H); };
  line(-7.8, 0.16, "#f1efe8"); line(7.8, 0.16, "#f1efe8");                       // vạch mép trắng
  line(-7.55, 0.12, "#3b8cff"); line(7.55, 0.12, "#ff7a00");                     // chỉ màu ĐỘI trong vạch mép: đội 1 nửa trái xanh, đội 2 nửa phải cam
  g.fillStyle = "#f1efe8"; for (let z = 0; z < TILE; z += 8) g.fillRect(X(-0.09), Y(z), 0.18 * PX, 4 * 40);   // mẫu 3: vạch giữa TRẮNG ĐỨT (bỏ dải phân cách) ⇒ 2 đội lấn sang nhau được
  g.fillStyle = "#f1efe8"; for (let z = 0; z < TILE; z += 12) { g.fillRect(X(-4.2 - 0.07), Y(z), 0.14 * PX, 6 * 40); g.fillRect(X(4.2 - 0.07), Y(z), 0.14 * PX, 6 * 40); }   // vạch làn đứt 6 m / 6 m
  const t = tex(c); t.wrapS = THREE.ClampToEdgeWrapping; t.wrapT = THREE.RepeatWrapping; return t;
}
function railTexture() {
  const [c, g] = canvas(512, 128);                                            // 4 m × 1 m
  g.clearRect(0, 0, 512, 128);
  const gr = g.createLinearGradient(0, 18, 0, 66); gr.addColorStop(0, "#e9edf0"); gr.addColorStop(0.35, "#9aa3aa"); gr.addColorStop(0.55, "#d7dde1"); gr.addColorStop(1, "#6f777d");
  g.fillStyle = gr; g.fillRect(0, 18, 512, 48);                               // tôn sóng
  g.fillStyle = "rgba(0,0,0,.25)"; g.fillRect(0, 40, 512, 3);
  g.fillStyle = "#5b6267"; [0, 256].forEach(x => g.fillRect(x + 8, 18, 22, 110));    // cột 2 m
  g.fillStyle = "#ffd23f"; [0, 256].forEach(x => g.fillRect(x + 10, 26, 18, 10));    // mắt phản quang
  const t = tex(c); t.wrapS = THREE.RepeatWrapping; return t;
}

function signTexture(text, sub, col) {
  const [c, g] = canvas(256, 256);
  g.fillStyle = "#0f1a2b"; g.fillRect(0, 0, 256, 256); g.strokeStyle = col; g.lineWidth = 14; g.strokeRect(7, 7, 242, 242);
  g.fillStyle = "#fff"; g.textAlign = "center"; g.textBaseline = "middle";
  g.font = "italic 900 130px 'Exo 2', 'Arial Black', sans-serif"; g.fillText(text, 128, 118);
  g.font = "800 34px 'Exo 2', sans-serif"; g.fillStyle = col; g.fillText(sub, 128, 205);
  return tex(c);
}
// 4a: vạch sơn "ANDREW STUDIO" giữa đường — chữ nghiêng đậm, viền đỏ, 2 dải tốc độ + mũi tên chevron 2 bên; sơn hơi mòn (lỗ chấm) cho thật
function logoTexture() {
  const W = 2048, H = 980, [c, g] = canvas(W, H);
  g.clearRect(0, 0, W, H);
  g.save(); g.transform(1, 0, -0.22, 1, 110, 0);                                     // nghiêng kiểu đua
  g.fillStyle = "rgba(200,38,43,.92)"; g.fillRect(170, 110, 1500, 46); g.fillRect(170, H - 156, 1500, 46);     // 2 dải đỏ
  g.fillStyle = "rgba(241,239,232,.95)"; g.fillRect(170, 176, 1500, 18); g.fillRect(170, H - 194, 1500, 18);   // chỉ trắng
  g.textAlign = "center"; g.textBaseline = "middle";
  g.font = "italic 900 330px 'Exo 2', 'Arial Black', sans-serif"; g.lineJoin = "round";
  g.lineWidth = 34; g.strokeStyle = "rgba(205,36,42,1)"; g.strokeText("ANDREW", 930, 360);
  g.fillStyle = "#fbfaf5"; g.fillText("ANDREW", 930, 360);
  g.font = "italic 900 250px 'Exo 2', 'Arial Black', sans-serif";
  g.lineWidth = 28; g.strokeText("STUDIO", 930, 640); g.fillText("STUDIO", 930, 640);
  g.restore();
  g.fillStyle = "rgba(245,197,24,.9)";                                               // chevron ▲ chỉ hướng chạy (2 bên)
  [[80, 1], [W - 80, 1]].forEach(([x]) => { for (let k = 0; k < 3; k++) { const y = 300 + k * 150; g.beginPath(); g.moveTo(x - 50, y + 60); g.lineTo(x, y); g.lineTo(x + 50, y + 60); g.lineTo(x + 50, y + 92); g.lineTo(x, y + 32); g.lineTo(x - 50, y + 92); g.closePath(); g.fill(); } });
  g.globalCompositeOperation = "destination-out";                                    // sơn mòn
  for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(0,0,0,${0.1 + Math.random() * 0.35})`; g.fillRect(Math.random() * W, Math.random() * H, 2 + Math.random() * 5, 2 + Math.random() * 5); }
  g.globalCompositeOperation = "source-over";
  const t = tex(c); return t;
}
function checkerTexture(cols = 16, rows = 2) {
  const [c, g] = canvas(cols * 32, rows * 32);
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) { g.fillStyle = (i + j) % 2 ? "#111" : "#f4f4f2"; g.fillRect(i * 32, j * 32, 32, 32); }
  const t = tex(c); t.magFilter = THREE.NearestFilter; return t;
}
function bannerTexture(text = "FINISH", sub = "ANDREW STUDIO · SPEED RUN") {
  const [c, g] = canvas(2048, 256);
  g.fillStyle = "#0c1424"; g.fillRect(0, 0, 2048, 256);
  for (let i = 0; i < 64; i++) for (let j = 0; j < 2; j++) { g.fillStyle = (i + j) % 2 ? "#111" : "#f4f4f2"; g.fillRect(i * 32, j * 24 + (j ? 208 : 0), 32, 24); g.fillRect(i * 32, j ? 232 : 0, 32, 24); }
  g.fillStyle = "#fff"; g.textAlign = "center"; g.textBaseline = "middle";
  g.font = "italic 900 132px 'Exo 2', 'Arial Black', sans-serif"; g.font = (text.length > 9 ? "italic 900 108px" : "italic 900 132px") + " 'Exo 2', 'Arial Black', sans-serif"; g.fillText(text, 1024, 112);
  g.font = "800 40px 'Exo 2', sans-serif"; g.fillStyle = "#ffcf4a"; g.fillText(sub, 1024, 186);
  return tex(c);
}

/**
 * createWorld({ scene, U, bend, keyDir, trk }) → { update(camPos, camS, t, minS, maxS), setTrack(L, SEG), groundH, dispose() } — 5l: trk = buildTrack()
 */
export function createWorld({ scene, U, bend, keyDir, trk }) {
  const own = [], ownM = [], ownT = [];
  const keep = (o) => { o.traverse(x => { if (x.geometry) own.push(x.geometry); if (x.material) (Array.isArray(x.material) ? x.material : [x.material]).forEach(m => { ownM.push(m); ["map", "alphaMap"].forEach(k => m[k] && ownT.push(m[k])); }); }); return o; };
  const sky = keep(makeSky()); scene.add(sky);
  // 3q: cảnh xa (theo tiếp tuyến) lệch về +x một góc φ = atan(2·bx·D0) và chúc xuống α = atan(2·by·D0) ⇒ pixel nhìn hướng v phải lấy màu trời
  //   ở hướng R⁻¹·v (R = xoay đưa cảnh xa tới chỗ mới) ⇒ mặt trời, mây, chân trời đi cùng núi.
  const SE = new THREE.Euler(0, 0, 0, "YXZ"), SM = new THREE.Matrix4();
  function skyRot(yaw, by) { SE.set(-Math.atan(2 * by * BEND_D0), -yaw, 0, "YXZ");   // 4b: yaw = hướng tuyệt đối của đường tại máy quay
    SM.makeRotationFromEuler(SE).transpose(); sky.material.uniforms.uRot.value.setFromMatrix4(SM); }
  // 5l: trường khoảng cách tới đường (byte = mét) ⇒ ảnh R8 lọc tuyến tính; uDistM = gốc lệch nửa ô + 1 / bề rộng (m) ⇒ uv tâm ô đúng như distAt JS
  const DF = trk.dist, distTex = new THREE.DataTexture(DF.data, DF.w, DF.h, THREE.RedFormat, THREE.UnsignedByteType);
  distTex.minFilter = distTex.magFilter = THREE.LinearFilter; distTex.generateMipmaps = false; distTex.needsUpdate = true; ownT.push(distTex);
  if (!U.uTrk) U.uTrk = { value: new THREE.Vector4(0, 0, 1, 0) };
  const TU = { tex: { value: distTex }, m: { value: new THREE.Vector4(DF.x0 - DF.cell / 2, DF.y0 - DF.cell / 2, 1 / (DF.w * DF.cell), 1 / (DF.h * DF.cell)) }, shore: { value: trk.SHORE_Y } };
  const ground = keep(makeGround(U, keyDir, TU)); scene.add(ground);
  const sea = keep(makeSea(U, TU)); scene.add(sea);
  const groundH = (X, Y) => groundW(trk, X, Y), WP = [0, 0];

  // mặt đường + rào: dài 1440 m (30 ô ảnh), bám máy quay theo bội số 48 m ⇒ ảnh liền mạch
  const ROAD_LEN = TILE * 30;
  const roadT = roadTexture(); roadT.repeat.set(1, ROAD_LEN / TILE);
  const road = keep(new THREE.Mesh(new THREE.PlaneGeometry(ROAD_HALF * 2, ROAD_LEN, 1, ROAD_LEN / 4).rotateX(-Math.PI / 2),
    bend(new THREE.MeshStandardMaterial({ map: roadT, roughness: 0.82, metalness: 0.0, polygonOffset: true, polygonOffsetFactor: -1 }))));
  road.position.y = 0.0; road.frustumCulled = false; scene.add(road);
  const railT = railTexture(); railT.repeat.set(ROAD_LEN / 4, 1);
  const railM = bend(new THREE.MeshStandardMaterial({ map: railT, transparent: false, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.45, metalness: 0.6 }));
  const rails = [-1, 1].map(s => { const m = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_LEN, 1.0, ROAD_LEN / 4, 1).rotateY(Math.PI / 2), railM);
    m.position.set(s * ROAD_HALF, 0.5, 0); m.frustumCulled = false; keep(m); scene.add(m); return m; });

  // ----- cột đèn (InstancedMesh: thân + tay vươn | đèn phát sáng) -----
  const poleG = (() => { const a = new THREE.CylinderGeometry(0.09, 0.14, 9, 8).translate(0, 4.5, 0), b = new THREE.BoxGeometry(2.6, 0.12, 0.12).translate(1.25, 8.9, 0);
    const m = mergeGeos([a, b]); a.dispose(); b.dispose(); return m; })();
  const headG = new THREE.BoxGeometry(0.75, 0.16, 0.34).translate(2.45, 8.78, 0);
  const NL = 72;
  const poles = new THREE.InstancedMesh(poleG, bend(new THREE.MeshStandardMaterial({ color: "#7e868c", roughness: 0.5, metalness: 0.6 })), NL);
  const heads = new THREE.InstancedMesh(headG, bend(new THREE.MeshStandardMaterial({ color: "#fff3d6", emissive: new THREE.Color("#ffd49a"), emissiveIntensity: 2.2 })), NL);
  [poles, heads].forEach(m => { m.frustumCulled = false; keep(m); scene.add(m); });
  // ----- 4a: cây CHI TIẾT HƠN: thông 4 tầng · cây tròn 3 khối tán · bụi · cỏ — vân sáng/tối vẽ sẵn (màu đỉnh × màu từng cây) -----
  const RG = mulberry(4242);
  const shade = (g, y0, y1, lo, hi, jit = 0.14) => { const p = g.attributes.position, n = p.count, a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const k = Math.max(0, Math.min(1, (p.getY(i) - y0) / (y1 - y0))), v = (lo + (hi - lo) * k) * (1 - jit / 2 + RG() * jit);
      a[3 * i] = v * (0.96 + 0.06 * k); a[3 * i + 1] = v; a[3 * i + 2] = v * (0.9 + 0.08 * k); }
    g.setAttribute("color", new THREE.BufferAttribute(a, 3)); return g; };
  const lumpy = (g, amt) => { const p = g.attributes.position, seen = new Map();   // lồi lõm: cùng 1 đỉnh (trùng vị trí) dịch cùng 1 lượng ⇒ không hở mép
    for (let i = 0; i < p.count; i++) { const key = p.getX(i).toFixed(3) + "," + p.getY(i).toFixed(3) + "," + p.getZ(i).toFixed(3);
      if (!seen.has(key)) seen.set(key, 1 + (RG() - 0.5) * 2 * amt); const k = seen.get(key); p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k); }
    g.computeVertexNormals(); return g; };
  const jitRing = (g, amt, yb) => { const p = g.attributes.position, seen = new Map();   // mép tán thông lệch ngẫu nhiên
    for (let i = 0; i < p.count; i++) { if (p.getY(i) > yb + 0.01) continue; const key = p.getX(i).toFixed(3) + "," + p.getZ(i).toFixed(3);
      if (!seen.has(key)) seen.set(key, [1 + (RG() - 0.5) * 2 * amt, (RG() - 0.5) * 0.35]); const [k, dy] = seen.get(key); p.setXYZ(i, p.getX(i) * k, p.getY(i) + dy, p.getZ(i) * k); }
    g.computeVertexNormals(); return g; };
  const cone = (r, h, y, seg = 9) => { const g = new THREE.ConeGeometry(r, h, seg, 1, true).translate(0, y, 0), q = g.toNonIndexed(); g.dispose(); return jitRing(q, 0.16, y - h / 2); };
  const pineG = (() => { const t = shade(new THREE.CylinderGeometry(0.13, 0.26, 2.4, 6).translate(0, 1.2, 0), 0, 2.4, 0.45, 0.7);
    const tiers = [[2.1, 3.0, 2.9], [1.75, 2.7, 4.4], [1.35, 2.4, 5.8], [0.85, 2.1, 7.1]].map(([r, h, y]) => shade(cone(r, h, y), y - h / 2, y + h / 2, 0.5, 1.22));
    const m = mergeGeos([t, ...tiers]); [t, ...tiers].forEach(x => x.dispose()); return m; })();
  const roundG = (() => { const t = shade(new THREE.CylinderGeometry(0.16, 0.28, 2.8, 6).translate(0, 1.4, 0), 0, 2.8, 0.42, 0.66);
    const br = shade(new THREE.CylinderGeometry(0.07, 0.1, 1.5, 5).rotateZ(0.7).translate(0.55, 2.7, 0), 2, 3.4, 0.45, 0.6);
    const blobs = [[2.2, 0, 4.4, 0], [1.6, 0.95, 5.3, 0.4], [1.45, -0.9, 5.0, -0.5]].map(([r, x, y, z]) => shade(lumpy(new THREE.IcosahedronGeometry(r, 1).toNonIndexed(), 0.14).translate(x, y, z), y - r, y + r, 0.5, 1.2));
    const m = mergeGeos([t, br, ...blobs]); [t, br, ...blobs].forEach(x => x.dispose()); return m; })();
  const bushG = (() => { const parts = [[0.95, 0, 0.55, 0], [0.7, 0.75, 0.45, 0.25], [0.65, -0.7, 0.42, -0.2]].map(([r, x, y, z]) => shade(lumpy(new THREE.IcosahedronGeometry(r, 0).toNonIndexed(), 0.2).scale(1, 0.78, 1).translate(x, y, z), 0, y + r, 0.5, 1.15));
    const m = mergeGeos(parts); parts.forEach(x => x.dispose()); return m; })();
  const grassG = (() => { const parts = []; for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 + RG() * 0.5, h = 0.38 + RG() * 0.3;
      parts.push(shade(new THREE.ConeGeometry(0.045, h, 3, 1).toNonIndexed().translate(0, h / 2, 0).rotateZ(0.25 + RG() * 0.35).rotateY(a).translate(Math.cos(a) * 0.09, 0, Math.sin(a) * 0.09), 0, h, 0.55, 1.3, 0.2)); }
    const m = mergeGeos(parts); parts.forEach(x => x.dispose()); return m; })();
  const palmG = (() => { const parts = []; let x = 0, y = 0;
    for (let i = 0; i < 6; i++) { const s = new THREE.CylinderGeometry(0.17 - i * 0.012, 0.2 - i * 0.012, 1.45, 7).translate(0, 0.72, 0).rotateZ(-0.06 * i).translate(x, y, 0); paint(s, i % 2 ? "#8a6a45" : "#7a5c3b"); parts.push(s); x += Math.sin(0.06 * i) * 1.45; y += Math.cos(0.06 * i) * 1.42; }
    for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2; const l = new THREE.PlaneGeometry(0.75, 3.6, 1, 4); const p = l.attributes.position;
      for (let i = 0; i < p.count; i++) { const v = p.getY(i) + 1.8; p.setZ(i, -0.13 * v * v); p.setX(i, p.getX(i) * (1 - Math.abs(v - 1.8) / 2.2)); }
      l.translate(0, 1.8, 0).rotateX(-1.15).rotateY(a).translate(x, y, 0); paint(l, "#ffffff"); parts.push(l); }
    const m = mergeGeos(parts); parts.forEach(q => q.dispose()); return m; })();
  const leafM = bend(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, side: THREE.DoubleSide }));
  const NP = 300, NR = 170, NPa = 110, NB = 320, NG = 1100;                                       // 4a: + bụi + cỏ, cây dày hơn và lên cao hơn trên núi
  const pines = new THREE.InstancedMesh(pineG, leafM, NP), rounds = new THREE.InstancedMesh(roundG, leafM, NR), palms = new THREE.InstancedMesh(palmG, leafM, NPa);
  const bushes = new THREE.InstancedMesh(bushG, leafM, NB), grass = new THREE.InstancedMesh(grassG, leafM, NG);
  [pines, rounds, palms, bushes, grass].forEach(m => { m.frustumCulled = false; m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(m.count * 3).fill(1), 3); keep(m); scene.add(m); });

  // ----- 4a: vạch "ANDREW STUDIO" sơn giữa đường (kiểu đường đua), mỗi ~420 m, né cầu nhảy / cổng -----
  const LOGO_GAP = 420, LOGO_W = 13.4, LOGO_L = 6.4, NLOGO = 6;
  const logoT = logoTexture();
  const logoM = bend(new THREE.MeshStandardMaterial({ map: logoT, transparent: true, depthWrite: false, roughness: 0.62, polygonOffset: true, polygonOffsetFactor: -2 }));
  const logos = new THREE.InstancedMesh(new THREE.PlaneGeometry(LOGO_W, LOGO_L).rotateX(-Math.PI / 2), logoM, NLOGO);
  logos.frustumCulled = false; logos.renderOrder = 1; logos.count = 0; keep(logos); scene.add(logos);
  let avoid = () => false;                                       // lõi báo chỗ có cầu nhảy / cổng
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), P = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0), C = new THREE.Color();
  let win = "";
  function fillProps(s0, s1, sNear = s0, R = [[s0, s1]]) {   // 5j: R = các đoạn cần rải (theo thứ tự ưu tiên)                       // s = quãng đường (m) dương về phía trước; z = −s · 4a: sNear = xe chậm hơn (cỏ chỉ quanh xe)
    let nl = 0, np = 0, nr = 0, npa = 0, nb = 0, ng = 0;
    // 5l: chỗ (s, x) dùng được? — không nằm trong lòng cua gắt (κ·x > 0,55 ⇒ đỉnh uốn sẽ gập) · không sát một đoạn đường KHÁC (dist < dMin)
    const kapMax = new Map(), kapOf = c => { if (!kapMax.has(c)) { let r = 0, l = 0; for (let u = c * TILE - 36; u <= c * TILE + TILE + 36; u += 6) { const k = trk.kapAt(u); r = Math.max(r, k); l = Math.max(l, -k); } kapMax.set(c, [r, l]); } return kapMax.get(c); };
    const okAt = (s, x, dMin) => { const [kr, kl] = kapOf(Math.floor(s / TILE)); if (x > 0 ? kr * x > 0.55 : kl * -x > 0.55) return false;
      trk.worldAt(s, x, WP); return trk.distAt(WP[0], WP[1]) >= dMin; };
    const hAt = () => groundH(WP[0], WP[1]), sandAt = () => sandW(trk, WP[0], WP[1]);
    for (const [a0, a1] of R) for (let c = Math.floor(a0 / 24); c <= Math.ceil(a1 / 24) && nl < NL; c++) {
      const side = (c & 1) ? 1 : -1; if (!okAt(c * 24, side * 11, 10.4)) continue;
      P.set(side * 11.0, 0, -c * 24); Q.setFromAxisAngle(UP, side > 0 ? Math.PI : 0); S.set(1, 1, 1);
      M4.compose(P, Q, S); poles.setMatrixAt(nl, M4); heads.setMatrixAt(nl, M4); nl++;
    }
    for (const [a0, a1] of R) for (let c = Math.floor(a0 / TILE); c <= Math.ceil(a1 / TILE); c++) {
      const r = mulberry(c * 7919 + 13);
      for (let i = 0; i < 14; i++) {                              // 5l: thông + cây tròn HAI bên, dày dần ra xa đường (tới ~135 m), bỏ bãi cát / nước
        const sd = r() < 0.5 ? -1 : 1, x = sd * (14.5 + Math.pow(r(), 1.7) * 120), sv = c * TILE + r() * TILE, sc = 0.8 + r() * 0.7, kind = r() < 0.6, rot = r() * 6.28, sy = 0.85 + r() * 0.4, hh = r(), ss = r(), ll = r();
        if (!okAt(sv, x, 13.5)) continue; const y = hAt() - 0.25; if (y < -0.3 || sandAt() > 0.4) continue;
        P.set(x, y, -sv); Q.setFromAxisAngle(UP, rot); S.set(sc, sc * sy, sc); M4.compose(P, Q, S);
        C.setHSL(kind ? 0.3 + hh * 0.05 : 0.22 + hh * 0.07, 0.45 + ss * 0.2, 0.2 + ll * 0.1);
        if (kind && np < NP) { pines.setMatrixAt(np, M4); pines.setColorAt(np, C); np++; } else if (!kind && nr < NR) { rounds.setMatrixAt(nr, M4); rounds.setColorAt(nr, C); nr++; }
      }
      for (let i = 0; i < 12 && nb < NB; i++) {                   // bụi 2 bên (gần đường dày hơn)
        const sd = r() < 0.5 ? -1 : 1, x = sd * (13 + Math.pow(r(), 1.4) * 60), sv = c * TILE + r() * TILE, sc = 0.6 + r() * 0.9, rot = r() * 6.28, sy = 0.75 + r() * 0.5, hh = r(), ss = r(), ll = r();
        if (!okAt(sv, x, 12.5)) continue; const y = hAt() - 0.12; if (y < -0.6) continue;
        P.set(x, y, -sv); Q.setFromAxisAngle(UP, rot); S.set(sc, sc * sy, sc); M4.compose(P, Q, S);
        C.setHSL(0.22 + hh * 0.08, 0.4 + ss * 0.2, 0.2 + ll * 0.1); bushes.setMatrixAt(nb, M4); bushes.setColorAt(nb, C); nb++;
      }
      const cs = c * TILE;
      if (cs + TILE > sNear - 40 && cs < sNear + 390) for (let i = 0; i < 125 && ng < NG; i++) {   // 4a: CỎ chỉ quanh xe (đứng gần mới thấy)
        const sd = r() < 0.5 ? -1 : 1, x = sd * (12.4 + Math.pow(r(), 1.3) * 26), sv = cs + r() * TILE, sc = 0.7 + r() * 0.9, rot = r() * 6.28, sy = 0.8 + r() * 0.6, hh = r(), ss = r(), ll = r();
        if (!okAt(sv, x, 12)) continue; const y = hAt() - 0.04; if (y < -0.4 || sandAt() > 0.5) continue;
        P.set(x, y, -sv); Q.setFromAxisAngle(UP, rot); S.set(sc, sc * sy, sc); M4.compose(P, Q, S);
        C.setHSL(0.17 + hh * 0.08, 0.45 + ss * 0.2, 0.26 + ll * 0.12); grass.setMatrixAt(ng, M4); grass.setColorAt(ng, C); ng++;
      }
      for (let i = 0; i < 6 && npa < NPa; i++) {                   // dừa: chỉ trên bãi cát ven biển (bỏ chỗ đã ngập nước)
        const sd = r() < 0.5 ? -1 : 1, x = sd * (13.6 + r() * 30), sv = c * TILE + r() * TILE, sc = 0.9 + r() * 0.45, rot = Math.PI * 0.5 + (r() - 0.5) * 1.6, hh = r(), ll = r();
        if (!okAt(sv, x, 13)) continue; if (sandAt() < 0.5) continue; const y = hAt(); if (y < -0.9) continue;
        P.set(x, y - 0.1, -sv); Q.setFromAxisAngle(UP, rot); S.set(sc, sc, sc); M4.compose(P, Q, S);
        C.setHSL(0.27 + hh * 0.05, 0.5, 0.26 + ll * 0.08); palms.setMatrixAt(npa, M4); palms.setColorAt(npa, C); npa++;
      }
    }
    let nlg = 0;                                                   // 4a: vạch ANDREW STUDIO
    for (let k = Math.max(0, Math.ceil((s0 - 260) / LOGO_GAP)); nlg < NLOGO; k++) { const sl = 260 + k * LOGO_GAP; if (sl > s1) break;
      if (avoid(sl, LOGO_L / 2 + 6)) continue; P.set(0, 0.035, -sl); Q.identity(); S.set(1, 1, 1); M4.compose(P, Q, S); logos.setMatrixAt(nlg++, M4); }
    logos.count = nlg; logos.instanceMatrix.needsUpdate = true;
    poles.count = heads.count = nl; pines.count = np; rounds.count = nr; palms.count = npa; bushes.count = nb; grass.count = ng;
    [poles, heads, pines, rounds, palms, bushes, grass].forEach(m => { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; });
  }

  // ----- 4a: mốc đoạn (14 chỗ dùng lại quanh xe) · cổng xuất phát · cổng LAP (đua theo độ dài) · cổng ĐÍCH dời được -----
  let trackG = null, trackO = { SEG: 80, segs: 12, LAP: 480, laps: 1 }, finG = null;
  const NMK = 12, mkSlots = [], signCache = new Map();
  const stripG = new THREE.PlaneGeometry(15.6, 0.55).rotateX(-Math.PI / 2), postG = new THREE.CylinderGeometry(0.07, 0.07, 2.4, 6), signG = new THREE.PlaneGeometry(2.1, 2.1);
  const stripM = bend(new THREE.MeshBasicMaterial({ color: new THREE.Color(0.75, 0.95, 1.0).multiplyScalar(1.6), transparent: true, opacity: 0.85, toneMapped: false, depthWrite: false }));
  const postM = bend(new THREE.MeshStandardMaterial({ color: "#8a9196", metalness: 0.6, roughness: 0.5 }));
  own.push(stripG, postG, signG); ownM.push(stripM, postM);
  const signTex = (k, side) => { const key = k + ":" + side + ":" + trackO.segs; if (!signCache.has(key)) signCache.set(key, signTexture(String(k), isFinite(trackO.segs) ? "/ " + trackO.segs : "", side < 0 ? "#3b8cff" : "#ff7a00")); return signCache.get(key); };
  const blankSign = signTexture("", "", "#3b8cff"); ownT.push(blankSign);   // ảnh giữ chỗ ⇒ shader có sẵn map (đổi ảnh không dịch lại)
  // vạch + cột của MỌI mốc = 2 InstancedMesh (2 lệnh vẽ); chỉ biển số là tấm riêng (mỗi biển 1 ảnh số)
  const mkStrips = new THREE.InstancedMesh(stripG, stripM, NMK), mkPosts = new THREE.InstancedMesh(postG, postM, NMK * 2);
  mkStrips.renderOrder = 1; [mkStrips, mkPosts].forEach(m => { m.frustumCulled = false; m.count = 0; scene.add(m); });
  for (let n = 0; n < NMK; n++) {
    const g = new THREE.Group(); g.visible = false; g.userData.k = -1;
    g.userData.signs = [-1, 1].map(sd => { const m = new THREE.Mesh(signG, bend(new THREE.MeshStandardMaterial({ map: blankSign, emissiveMap: blankSign, roughness: 0.5, emissive: new THREE.Color("#ffffff"), emissiveIntensity: 0.25 })));
      ownM.push(m.material); m.position.set(sd * 12.4, 3.4, 0); g.add(m); return { m, sd }; });
    scene.add(g); mkSlots.push(g);
  }
  const MK4 = new THREE.Matrix4();
  function placeMarkers(sMin) {
    const { SEG, segs } = trackO, k0 = Math.max(1, Math.floor((sMin - 60) / SEG));
    let moved = false, ns = 0;
    mkSlots.forEach((g, n) => { const k = k0 + n, on = k < segs; g.visible = on; if (on) ns++; if (!on || g.userData.k === k) return;
      moved = true; g.userData.k = k; g.position.set(0, 0, -k * SEG); g.userData.signs.forEach(({ m, sd }) => { m.material.map = m.material.emissiveMap = signTex(k, sd); m.material.needsUpdate = false; }); });
    if (!moved && mkStrips.count === ns) return;
    mkSlots.forEach((g, n) => { if (n >= ns) return; const z = g.position.z;
      MK4.makeTranslation(0, 0.03, z); mkStrips.setMatrixAt(n, MK4); MK4.makeTranslation(-12.4, 1.2, z); mkPosts.setMatrixAt(2 * n, MK4); MK4.makeTranslation(12.4, 1.2, z); mkPosts.setMatrixAt(2 * n + 1, MK4); });
    mkStrips.count = ns; mkPosts.count = ns * 2; mkStrips.instanceMatrix.needsUpdate = mkPosts.instanceMatrix.needsUpdate = true;
  }
  const pm = bend(new THREE.MeshStandardMaterial({ color: "#1b2433", roughness: 0.4, metalness: 0.5 }));
  const liteM = [-1, 1].map(sd => bend(new THREE.MeshBasicMaterial({ color: new THREE.Color(sd < 0 ? "#3b8cff" : "#ff7a00").multiplyScalar(2.2), toneMapped: false })));
  const chkM = bend(new THREE.MeshStandardMaterial({ map: checkerTexture(16, 2), roughness: 0.7, polygonOffset: true, polygonOffsetFactor: -2 }));
  ownM.push(pm, ...liteM, chkM); ownT.push(chkM.map);
  const postBG = new THREE.BoxGeometry(1.1, 8.6, 1.1), liteG = new THREE.BoxGeometry(0.2, 7.6, 1.14), beamG = new THREE.BoxGeometry(24, 2.3, 0.9), banG = new THREE.PlaneGeometry(23.2, 2.9), chkG = new THREE.PlaneGeometry(15.6, 1.6).rotateX(-Math.PI / 2);
  own.push(postBG, liteG, beamG, banG, chkG);
  // cổng: 2 trụ + xà + băng rôn (mặt quay về phía xe tới) — group ở z = 0, đặt bằng position
  function gate(parent, z, text, stripDz = 0) {
    const g = new THREE.Group(); g.position.z = z; parent.add(g);
    const st = new THREE.Mesh(chkG, chkM); st.position.set(0, 0.03, stripDz); st.renderOrder = 1; g.add(st);
    [-1, 1].forEach((sd, j) => { const p = new THREE.Mesh(postBG, pm); p.position.set(sd * 11.4, 4.3, 0); g.add(p);
      const l = new THREE.Mesh(liteG, liteM[j]); l.position.set(sd * 11.4 - sd * 0.5, 4.3, 0); g.add(l); });
    const beam = new THREE.Mesh(beamG, pm); beam.position.set(0, 9.4, 0); g.add(beam);
    const ban = new THREE.Mesh(banG, bend(new THREE.MeshStandardMaterial({ map: bannerTexture(text), roughness: 0.5, emissive: new THREE.Color("#ffffff"), emissiveIntensity: 0.35 })));
    ban.material.emissiveMap = ban.material.map; ban.position.set(0, 9.4, 0.47); g.add(ban); g.userData.ban = ban;
    return g;
  }
  const dropGate = g => { const b = g && g.userData.ban; if (b) { b.material.map.dispose(); b.material.dispose(); } };
  function setTrack(o) {
    trackO = { ...trackO, ...o };
    if (trackG) { scene.remove(trackG); trackG.children.forEach(dropGate); }
    trackG = new THREE.Group(); scene.add(trackG);
    signCache.forEach(t => t.dispose()); signCache.clear(); mkSlots.forEach(g => { g.userData.k = -1; });
    const { LAP, laps } = trackO;
    gate(trackG, -0.2, laps > 1 ? "LAP 1 / " + laps : "GO!", 1.0);
    for (let k = 1; k < laps; k++) gate(trackG, -k * LAP, k + 1 === laps ? "FINAL LAP" : "LAP " + (k + 1) + " / " + laps);
    finG = gate(trackG, 400, "FINISH");                          // cất SAU vạch xuất phát tới khi có đích (vẫn trong cảnh ⇒ shader dịch sẵn)
    placeMarkers(0);
  }
  function setFinish(s) { if (finG) finG.position.z = s == null ? 400 : -s; }

  return {
    groundH,
    setTrack,
    setFog(n, f) { FOGU.uFogNear.value = n; FOGU.uFogFar.value = f; },
    /** camPos: vị trí máy quay (chưa cong) · t: giây · sMin/sMax: đoạn đường cần có cây/cột (m) */
    setFinish,
    setAvoid(fn) { avoid = fn || (() => false); win = ""; },      // 4a: (s, r) ⇒ true nếu cách cầu nhảy / cổng < r m
    update(camPos, t, sMin, sMax, sAlt = null) {
      skyRot(U.uSkyYaw ? U.uSkyYaw.value : 0, U.uBend.value.y);   // 4b: trời xoay theo hướng tuyệt đối của đường
      sky.position.copy(camPos); sky.material.uniforms.uT.value = t; sea.material.uniforms.uT.value = t;
      const zc = Math.round(camPos.z / 10) * 10; ground.position.z = zc - 450; sea.position.z = zc - 450;
      const snap = Math.floor(camPos.z / TILE) * TILE; road.position.z = snap - ROAD_LEN / 2 + 200; rails.forEach(r => r.position.z = road.position.z);
      const s0 = Math.floor((sMin - 220) / TILE) * TILE, s1 = Math.ceil((sMax + 1000) / TILE) * TILE;
      let R = [[s0, s1]];
      if (sAlt != null) { const a0 = Math.floor((sAlt - 200) / TILE) * TILE, a1 = Math.ceil((sAlt + 900) / TILE) * TILE;   // 5j: vùng quanh xe bay
        if (a0 < s0 || a1 > s1) { if (a1 < s0 - TILE || a0 > s1 + TILE) { const sn = Math.min(s1, Math.ceil((sMax + 350) / TILE) * TILE), an = Math.min(a1, a0 + 6 * TILE);
            R = [[s0, sn], [a0, an], [sn + TILE, s1], [an + TILE, a1]].filter(([p, q]) => q >= p); }                     // tách xa ⇒ phần GẦN của cả 2 trước, phần xa sau
          else R = [[Math.min(s0, a0), Math.max(s1, a1)]]; } }
      const k = R.map(r => r.join(":")).join("|");
      if (k !== win) { win = k; fillProps(s0, s1, sMin, R); }
      placeMarkers(sMin);                                          // 4a: chỉ đổi khi 1 mốc ra khỏi cửa sổ
    },
    dispose() { [...new Set(own)].forEach(g => g.dispose()); [...new Set(ownM)].forEach(m => m.dispose()); [...new Set(ownT)].forEach(t => t.dispose());
      if (trackG) trackG.children.forEach(dropGate); signCache.forEach(t => t.dispose()); mkSlots.forEach(g => scene.remove(g)); scene.remove(mkStrips, mkPosts); mkStrips.dispose(); mkPosts.dispose(); }
  };
}

// ---------- tiện ích hình học ----------
function paint(g, hex) { const c = new THREE.Color(hex), n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set([c.r, c.g, c.b], i * 3); g.setAttribute("color", new THREE.BufferAttribute(a, 3)); return g; }
function mergeGeos(gs) {
  const list = gs.map(g => g.index ? g.toNonIndexed() : g);
  const names = ["position", "normal", "color"].filter(n => list.every(g => g.attributes[n]));
  const out = new THREE.BufferGeometry();
  names.forEach(n => { const sz = list[0].attributes[n].itemSize, arr = new Float32Array(list.reduce((a, g) => a + g.attributes[n].count * sz, 0)); let o = 0;
    list.forEach(g => { arr.set(g.attributes[n].array, o); o += g.attributes[n].array.length; }); out.setAttribute(n, new THREE.BufferAttribute(arr, sz)); });
  list.forEach((g, i) => { if (g !== gs[i]) g.dispose(); });
  return out;
}
