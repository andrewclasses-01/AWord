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
float groundH(vec2 q){ float x = q.x;
  if (x < 0.0) { float L = smoothstep(13.0, 60.0, -x);
    return L*(fbm(q*0.011)*42.0 + 3.0) + smoothstep(110.0, 420.0, -x)*fbm(q*0.0042 + 3.7)*130.0 - 0.06*(1.0 - L); }
  float R = smoothstep(15.0, 70.0, x + shoreX(q.y));
  return -R*5.0 + smoothstep(11.0, 15.0, x)*(1.0 - smoothstep(15.0, 24.0, x))*0.35 - 0.06; }
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
export function groundH(x, z) {
  if (x < 0) { const L = sstep(13, 60, -x);
    return L * (fbm(f(x * f(0.011)), f(z * f(0.011))) * 42 + 3) + sstep(110, 420, -x) * fbm(f(f(x * f(0.0042)) + f(3.7)), f(f(z * f(0.0042)) + f(3.7))) * 130 - 0.06 * (1 - L); }
  const R = sstep(15, 70, x + shoreX(z));
  return -R * 5 + sstep(11, 15, x) * (1 - sstep(15, 24, x)) * 0.35 - 0.06;
}

// ---------- cong thế giới ----------
// 3q (thầy 15/10: "núi và cảnh phía xa thay đổi rất bất hợp lý … chóng mặt"): bản cũ lệch = b·d² ở MỌI khoảng cách ⇒ núi 1.000 m lệch
//   tới ~1.800 m mỗi lần độ cong đổi. Nay CONG THẬT trong BEND_D0 = 150 m (đúng tầm đọc khúc cua 30–150 m của bendFor), xa hơn đi theo
//   TIẾP TUYẾN ⇒ cảnh xa chỉ XOAY một góc atan(2·b·D0) như khi xe quay đầu thật; bầu trời xoay cùng góc (skyRot). bendQ JS = cùng công thức.
export const BEND_D0 = 150;
export const bendQ = d => { const a = -Math.min(d, 0); return a <= BEND_D0 ? a * a : BEND_D0 * (2 * a - BEND_D0); };
const BEND_GLSL = `uniform vec2 uBend; uniform float uBendZ;
float bendQ(float d){ float a = -d; return a <= 150.0 ? a*a : 150.0*(2.0*a - 150.0); }
vec4 bendW(vec4 w){ float d = min(w.z - uBendZ, 0.0); float q = bendQ(d); w.x += uBend.x*q; w.y -= uBend.y*q; return w; }`;
export function makeBend(U) {
  return mat => {
    const prev = mat.onBeforeCompile;
    mat.onBeforeCompile = (sh, r) => {
      if (prev) prev(sh, r);
      sh.uniforms.uBend = U.uBend; sh.uniforms.uBendZ = U.uBendZ;
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
        gl_Position = projectionMatrix * mvPosition;`);
    };
    mat.customProgramCacheKey = () => "bend|" + (prev ? prev.toString().length : 0);
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
function makeGround(U, KEY) {
  const g = new THREE.PlaneGeometry(1700, 1700, 170, 170).rotateX(-Math.PI / 2);
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...FOGU, uBend: U.uBend, uBendZ: U.uBendZ, uKey: { value: KEY } },
    vertexShader: NOISE_GLSL + BEND_GLSL + `
      varying vec3 vW; varying vec3 vN; varying float vFog;
      void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vec2 q = w.xz;
        float h = groundH(q); float e = 1.5; float hx = groundH(q + vec2(e, 0.0)), hz = groundH(q + vec2(0.0, e));
        vN = normalize(vec3(h - hx, e, h - hz)); w.y = h; vW = w.xyz;
        vec4 b = bendW(w); vec4 mv = viewMatrix * b; vFog = length(mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: NOISE_GLSL + `uniform vec3 uFogCol; uniform float uFogNear, uFogFar; uniform vec3 uKey;
      varying vec3 vW; varying vec3 vN; varying float vFog;
      void main(){ vec3 n = normalize(vN); float x = vW.x; float slope = 1.0 - n.y;
        float nz = fbm(vW.xz * 0.09), nz2 = fbm(vW.xz * 0.6);
        vec3 grass = mix(vec3(0.20,0.27,0.10), vec3(0.36,0.40,0.15), nz) * (0.85 + 0.3*nz2);
        vec3 rock = mix(vec3(0.38,0.33,0.28), vec3(0.52,0.46,0.39), nz2);
        vec3 c = mix(grass, rock, smoothstep(0.25, 0.55, slope));
        c = mix(c, vec3(0.42,0.36,0.30), smoothstep(60.0, 120.0, vW.y) * 0.6);                         // núi cao: đá trơ
        float sand = smoothstep(11.5, 13.5, x);
        vec3 sc = mix(vec3(0.86,0.73,0.52), vec3(0.93,0.82,0.62), nz2);
        sc = mix(sc, vec3(0.62,0.50,0.36), smoothstep(-0.6, -1.25, vW.y));                                 // cát ướt sát nước
        c = mix(c, sc, sand);
        c = mix(c, vec3(0.40,0.35,0.28) * (0.9 + 0.2*nz2), (1.0 - step(13.0, abs(x))) * step(10.0, abs(x)) * (1.0 - sand*0.6));   // lề đất sát rào
        float dif = max(dot(n, normalize(uKey)), 0.0);
        vec3 lit = c * (vec3(0.52,0.46,0.50) + vec3(1.15,0.90,0.70) * dif);
        lit = mix(lit, uFogCol, smoothstep(uFogNear, uFogFar, vFog));
        gl_FragColor = vec4(lit, 1.0); }`,
    fog: false
  });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = 2;   // 3r: sau đường / xe / cây (cũ −5)
  return m;
}
function makeSea(U) {
  const g = new THREE.PlaneGeometry(1400, 1700, 70, 170).rotateX(-Math.PI / 2); g.translate(712, 0, 0);
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...FOGU, uBend: U.uBend, uBendZ: U.uBendZ, uSun: { value: SUN_DIR }, uT: { value: 0 } },
    vertexShader: BEND_GLSL + `varying vec3 vW; varying float vFog; varying vec3 vB;
      void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vec4 b = bendW(w); vB = b.xyz; vec4 mv = viewMatrix * b; vFog = length(mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: NOISE_GLSL + `uniform vec3 uFogCol; uniform float uFogNear, uFogFar; uniform vec3 uSun; uniform float uT;
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
 * createWorld({ scene, U, bend, keyDir }) → { update(camPos, camS, t, minS, maxS), setTrack(L, SEG), groundH, dispose() }
 */
export function createWorld({ scene, U, bend, keyDir }) {
  const own = [], ownM = [], ownT = [];
  const keep = (o) => { o.traverse(x => { if (x.geometry) own.push(x.geometry); if (x.material) (Array.isArray(x.material) ? x.material : [x.material]).forEach(m => { ownM.push(m); ["map", "alphaMap"].forEach(k => m[k] && ownT.push(m[k])); }); }); return o; };
  const sky = keep(makeSky()); scene.add(sky);
  // 3q: cảnh xa (theo tiếp tuyến) lệch về +x một góc φ = atan(2·bx·D0) và chúc xuống α = atan(2·by·D0) ⇒ pixel nhìn hướng v phải lấy màu trời
  //   ở hướng R⁻¹·v (R = xoay đưa cảnh xa tới chỗ mới) ⇒ mặt trời, mây, chân trời đi cùng núi.
  const SE = new THREE.Euler(0, 0, 0, "YXZ"), SM = new THREE.Matrix4();
  function skyRot(bx, by) { SE.set(-Math.atan(2 * by * BEND_D0), -Math.atan(2 * bx * BEND_D0), 0, "YXZ"); SM.makeRotationFromEuler(SE).transpose(); sky.material.uniforms.uRot.value.setFromMatrix4(SM); }
  const ground = keep(makeGround(U, keyDir)); scene.add(ground);
  const sea = keep(makeSea(U)); scene.add(sea);

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
  // ----- cây: thông (trái) · cây tròn (trái) · dừa (phải, trên cát) -----
  const pineG = (() => { const t = new THREE.CylinderGeometry(0.16, 0.24, 2.2, 6).translate(0, 1.1, 0), c1 = new THREE.ConeGeometry(1.9, 4.2, 8).translate(0, 3.6, 0), c2 = new THREE.ConeGeometry(1.4, 3.2, 8).translate(0, 5.6, 0);
    paint(t, "#5a3d26"); paint(c1, "#ffffff"); paint(c2, "#ffffff"); const m = mergeGeos([t, c1, c2]); [t, c1, c2].forEach(x => x.dispose()); return m; })();
  const roundG = (() => { const t = new THREE.CylinderGeometry(0.18, 0.26, 2.6, 6).translate(0, 1.3, 0), c = new THREE.IcosahedronGeometry(2.3, 1).translate(0, 4.2, 0);
    paint(t, "#5a3d26"); paint(c, "#ffffff"); const m = mergeGeos([t, c]); t.dispose(); c.dispose(); return m; })();
  const palmG = (() => { const parts = []; let x = 0, y = 0;
    for (let i = 0; i < 6; i++) { const s = new THREE.CylinderGeometry(0.17 - i * 0.012, 0.2 - i * 0.012, 1.45, 7).translate(0, 0.72, 0).rotateZ(-0.06 * i).translate(x, y, 0); paint(s, i % 2 ? "#8a6a45" : "#7a5c3b"); parts.push(s); x += Math.sin(0.06 * i) * 1.45; y += Math.cos(0.06 * i) * 1.42; }
    for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2; const l = new THREE.PlaneGeometry(0.75, 3.6, 1, 4); const p = l.attributes.position;
      for (let i = 0; i < p.count; i++) { const v = p.getY(i) + 1.8; p.setZ(i, -0.13 * v * v); p.setX(i, p.getX(i) * (1 - Math.abs(v - 1.8) / 2.2)); }
      l.translate(0, 1.8, 0).rotateX(-1.15).rotateY(a).translate(x, y, 0); paint(l, "#ffffff"); parts.push(l); }
    const m = mergeGeos(parts); parts.forEach(q => q.dispose()); return m; })();
  const leafM = bend(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, side: THREE.DoubleSide }));
  const NP = 220, NR = 120, NPa = 110;
  const pines = new THREE.InstancedMesh(pineG, leafM, NP), rounds = new THREE.InstancedMesh(roundG, leafM, NR), palms = new THREE.InstancedMesh(palmG, leafM, NPa);
  [pines, rounds, palms].forEach(m => { m.frustumCulled = false; m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(m.count * 3).fill(1), 3); keep(m); scene.add(m); });

  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), P = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0), C = new THREE.Color();
  let win = "";
  function fillProps(s0, s1) {                                   // s = quãng đường (m) dương về phía trước; z = −s
    let nl = 0, np = 0, nr = 0, npa = 0;
    for (let c = Math.floor(s0 / 24); c <= Math.ceil(s1 / 24) && nl < NL; c++) {
      const side = (c & 1) ? 1 : -1; P.set(side * 11.0, 0, -c * 24); Q.setFromAxisAngle(UP, side > 0 ? Math.PI : 0); S.set(1, 1, 1);
      M4.compose(P, Q, S); poles.setMatrixAt(nl, M4); heads.setMatrixAt(nl, M4); nl++;
    }
    for (let c = Math.floor(s0 / TILE); c <= Math.ceil(s1 / TILE); c++) {
      const r = mulberry(c * 7919 + 13);
      for (let i = 0; i < 9; i++) {                               // trái: thông + cây tròn, dày dần ra xa đường
        const x = -(14.5 + Math.pow(r(), 1.6) * 75), z = -(c * TILE + r() * TILE), y = groundH(x, z) - 0.25, sc = 0.8 + r() * 0.7, kind = r() < 0.62;
        P.set(x, y, z); Q.setFromAxisAngle(UP, r() * 6.28); S.set(sc, sc * (0.85 + r() * 0.4), sc); M4.compose(P, Q, S);
        C.setHSL(kind ? 0.3 + r() * 0.05 : 0.22 + r() * 0.07, 0.45 + r() * 0.2, 0.2 + r() * 0.1);
        if (kind && np < NP) { pines.setMatrixAt(np, M4); pines.setColorAt(np, C); np++; } else if (!kind && nr < NR) { rounds.setMatrixAt(nr, M4); rounds.setColorAt(nr, C); nr++; }
      }
      for (let i = 0; i < 4 && npa < NPa; i++) {                   // phải: dừa trên cát (bỏ chỗ đã ngập nước)
        const x = 13.6 + r() * 14, z = -(c * TILE + r() * TILE), y = groundH(x, z); if (y < -0.9) continue;
        const sc = 0.9 + r() * 0.45; P.set(x, y - 0.1, z); Q.setFromAxisAngle(UP, Math.PI * 0.5 + (r() - 0.5) * 1.6); S.set(sc, sc, sc); M4.compose(P, Q, S);
        C.setHSL(0.27 + r() * 0.05, 0.5, 0.26 + r() * 0.08); palms.setMatrixAt(npa, M4); palms.setColorAt(npa, C); npa++;
      }
    }
    poles.count = heads.count = nl; pines.count = np; rounds.count = nr; palms.count = npa;
    [poles, heads, pines, rounds, palms].forEach(m => { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; });
  }

  // ----- vạch đoạn / xuất phát / cổng đích (dựng theo đường đua) -----
  let trackG = null;
  function setTrack(L, SEG, LAP = L * SEG) {
    if (trackG) { scene.remove(trackG); trackG.traverse(x => { if (x.geometry) x.geometry.dispose(); if (x.material) { if (x.material.map) x.material.map.dispose(); x.material.dispose(); } }); }
    trackG = new THREE.Group(); scene.add(trackG);
    const laps = Math.max(1, Math.round(L * SEG / LAP));
    const strip = (z, mat, d = 0.55) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(15.6, d).rotateX(-Math.PI / 2), mat); m.position.set(0, 0.03, z); m.renderOrder = 1; trackG.add(m); return m; };
    for (let k = 1; k < L; k++) {
      const mat = bend(new THREE.MeshBasicMaterial({ color: new THREE.Color(0.75, 0.95, 1.0).multiplyScalar(1.6), transparent: true, opacity: 0.85, toneMapped: false, depthWrite: false }));
      strip(-k * SEG, mat);
      [-1, 1].forEach(s => {                                        // biển số đoạn 2 bên đường
        const col = s < 0 ? "#3b8cff" : "#ff7a00";
        const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 2.1), bend(new THREE.MeshStandardMaterial({ map: signTexture(String(k), "/ " + L, col), roughness: 0.5, emissive: new THREE.Color("#ffffff"), emissiveIntensity: 0.25, emissiveMap: null })));
        sign.material.emissiveMap = sign.material.map; sign.position.set(s * 12.4, 3.4, -k * SEG); trackG.add(sign);
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.4, 6), bend(new THREE.MeshStandardMaterial({ color: "#8a9196", metalness: 0.6, roughness: 0.5 })));
        post.position.set(s * 12.4, 1.2, -k * SEG); trackG.add(post);
      });
    }
    // cổng: 2 trụ + xà + băng rôn (mặt quay về phía xe tới) — mẫu 3: cổng ở MỖI MỐC VÒNG ("LAP n / laps", "FINAL LAP") + FINISH ở đích
    const pm = bend(new THREE.MeshStandardMaterial({ color: "#1b2433", roughness: 0.4, metalness: 0.5 }));
    const gate = (z, text, stripZ = z) => {
      strip(stripZ, bend(new THREE.MeshStandardMaterial({ map: checkerTexture(16, 2), roughness: 0.7, polygonOffset: true, polygonOffsetFactor: -2 })), 1.6);
      [-1, 1].forEach(s => { const p = new THREE.Mesh(new THREE.BoxGeometry(1.1, 8.6, 1.1), pm); p.position.set(s * 11.4, 4.3, z); trackG.add(p);
        const lite = new THREE.Mesh(new THREE.BoxGeometry(0.2, 7.6, 1.14), bend(new THREE.MeshBasicMaterial({ color: new THREE.Color(s < 0 ? "#3b8cff" : "#ff7a00").multiplyScalar(2.2), toneMapped: false })));
        lite.position.set(s * 11.4 - s * 0.5, 4.3, z); trackG.add(lite); });
      const beam = new THREE.Mesh(new THREE.BoxGeometry(24, 2.3, 0.9), pm); beam.position.set(0, 9.4, z); trackG.add(beam);
      const ban = new THREE.Mesh(new THREE.PlaneGeometry(23.2, 2.9), bend(new THREE.MeshStandardMaterial({ map: bannerTexture(text), roughness: 0.5, emissive: new THREE.Color("#ffffff"), emissiveIntensity: 0.35 })));
      ban.material.emissiveMap = ban.material.map; ban.position.set(0, 9.4, z + 0.47); trackG.add(ban);
    };
    gate(-0.2, laps > 1 ? "LAP 1 / " + laps : "GO!", 0.8);
    for (let k = 1; k < laps; k++) gate(-k * LAP, k + 1 === laps ? "FINAL LAP" : "LAP " + (k + 1) + " / " + laps);
    gate(-L * SEG, "FINISH");
  }

  return {
    groundH,
    setTrack,
    setFog(n, f) { FOGU.uFogNear.value = n; FOGU.uFogFar.value = f; },
    /** camPos: vị trí máy quay (chưa cong) · t: giây · sMin/sMax: đoạn đường cần có cây/cột (m) */
    update(camPos, t, sMin, sMax) {
      skyRot(U.uBend.value.x, U.uBend.value.y);                // 3q: trời xoay CÙNG góc với cảnh xa
      sky.position.copy(camPos); sky.material.uniforms.uT.value = t; sea.material.uniforms.uT.value = t;
      const zc = Math.round(camPos.z / 10) * 10; ground.position.z = zc - 450; sea.position.z = zc - 450;
      const snap = Math.floor(camPos.z / TILE) * TILE; road.position.z = snap - ROAD_LEN / 2 + 200; rails.forEach(r => r.position.z = road.position.z);
      const s0 = Math.floor((sMin - 220) / TILE) * TILE, s1 = Math.ceil((sMax + 1000) / TILE) * TILE, k = s0 + ":" + s1;
      if (k !== win) { win = k; fillProps(s0, s1); }
    },
    dispose() { [...new Set(own)].forEach(g => g.dispose()); [...new Set(ownM)].forEach(m => m.dispose()); [...new Set(ownT)].forEach(t => t.dispose());
      if (trackG) trackG.traverse(x => { if (x.geometry) x.geometry.dispose(); if (x.material) { if (x.material.map) x.material.map.dispose(); x.material.dispose(); } }); }
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
