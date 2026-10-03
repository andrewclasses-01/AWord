// 1z: chốt đụn thấp (cao 10).
// 1y: đụn thấp lại (?cao=0..2).
// ĐỤN CÁT ĐỠ CHỮ — bản 1x (29/9/2026)
// Thầy: "không để chữ ANDREW CLASSES trên đồi đó nữa, mà ở phần đụn cát cao phía sau như trong ảnh".
// Đụn cát là một phần của CHÍNH mặt đất (cộng vào groundH trong shader + groundHeight bên JS) nên cùng màu cát, cùng
// đốm bụi cỏ, pháp tuyến/bóng liền mạch. Mỗi bảng chữ đặt trên đụn giữ 1 ô trong DUNES (x tâm, nửa bề ngang, bật).
// Hình đụn: đỉnh phẳng |lz| < 6 (chữ đứng + thú chạy vòng), sườn trước dốc hơn (về phía tàu), sườn sau thoải;
// hai đầu thoải dần 70 đơn vị, mép đầu lượn theo sin (không thẳng tắp).
export const CAO_STYLES = ["Thấp như gò cát tự nhiên (10)", "Vừa (13)", "Cao hơn chút (16)"];   // 1y: thầy muốn đụn thấp như bản trước (1x: 21)
export const CAO = (() => { try { const v = parseInt(new URLSearchParams(location.search).get("cao"), 10); return 0; } catch { return 0; } })();   // 1z: thầy chốt mức 0 (cao 10)
export const DUNE_Z = -105, DUNE_H = [10, 13, 16][CAO], DUNE_N = 3;
export const DUNES = new Float32Array(DUNE_N * 4);
export const DUNE = { gh: null };   // groundHeight (animals-1x gán) — cho con vật + bảng chữ dò độ cao

const sst = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export function duneApply(h, x, z) {
  for (let i = 0; i < DUNE_N; i++) {
    if (DUNES[i * 4 + 2] < 0.5) continue;
    const cx = DUNES[i * 4], hw = DUNES[i * 4 + 1];
    const lx = Math.abs(x - cx), lz = z - DUNE_Z, alz = Math.abs(lz);
    const wob = (Math.sin(x * 0.031) * 7 + Math.sin(x * 0.083 + 1.3) * 3) * sst(hw, hw + 20, lx);
    const ex = 1 - sst(hw, hw + 70, lx + wob);
    const zf = alz < 6 ? 1 : Math.exp(-Math.pow((alz - 6) / (lz > 0 ? 20 : 32), 2));
    const dn = DUNE_H * zf * ex, pl = (1 - sst(hw, hw + 8, lx)) * (1 - sst(6, 8, alz));
    h = Math.max(h, dn); h = h + (DUNE_H - h) * pl;
  }
  return h;
}
export const DUNE_GLSL = `
uniform vec4 uDune[${DUNE_N}];
float duneApply(float h, vec2 w){
  for (int i = 0; i < ${DUNE_N}; i++) {
    vec4 d = uDune[i]; if (d.z < 0.5) continue;
    float lx = abs(w.x - d.x), lz = w.y - (${DUNE_Z.toFixed(1)}), alz = abs(lz);
    float wob = (sin(w.x * 0.031) * 7. + sin(w.x * 0.083 + 1.3) * 3.) * smoothstep(d.y, d.y + 20., lx);
    float ex = 1. - smoothstep(d.y, d.y + 70., lx + wob);
    float zf = alz < 6. ? 1. : exp(-pow((alz - 6.) / (lz > 0. ? 20. : 32.), 2.));
    float dn = ${DUNE_H.toFixed(1)} * zf * ex, pl = (1. - smoothstep(d.y, d.y + 8., lx)) * (1. - smoothstep(6., 8., alz));
    h = max(h, dn); h = mix(h, ${DUNE_H.toFixed(1)}, pl);
  }
  return h;
}`;
