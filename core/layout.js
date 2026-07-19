// =============================================================
// LAYOUT — dựng "khung sân khấu" 16:9 dùng chung.
// Quy tắc bố cục (thầy yêu cầu):
//   - Khung game (stage) tỉ lệ 16:9, LUÔN nằm TRÊN CÙNG trang.
//   - MỌI nội dung trong game (số câu, đồng hồ, điểm, câu hỏi...) nằm TRONG khung.
//   - Tên game & phần chữ nằm DƯỚI khung.
// =============================================================

import { el } from "./utils.js";

export function buildStage(themeName = "classic") {
  const page = el("div", "aw-page");

  // Khung 16:9 (sân khấu chơi)
  const stage = el("div", `aw-stage theme-${themeName}`);
  const inner = el("div", "aw-stage-inner");
  stage.append(inner);

  // Vùng chữ dưới khung
  const below = el("div", "aw-below");

  page.append(stage, below);
  return { page, stage, inner, below };
}
