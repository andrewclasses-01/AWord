// =============================================================
// MANIFEST — kept only for older code/notes that still import it.
//
// ⚠️ KHÔNG thêm template ở đây nữa. Từ v0.9.7 mọi thứ về 1 chỗ duy nhất:
// `core/catalog.js` (type · label · blurb · built · css · load · sample).
// File này chỉ còn là 1 CÁI NHÌN suy ra từ danh sách đó, nên không bao giờ
// lệch pha được nữa.
//
// Thêm template mới = thêm 1 mục trong `core/catalog.js`. Hết.
// (Không phải sửa index.html, play.html, main.js hay file này.)
// =============================================================

import { TEMPLATES } from "./core/catalog.js";

export const FINISHED_TEMPLATES = TEMPLATES
  .filter(t => t.built)
  .map(({ type, label, load, sample }) => ({ type, label, load, sample }));
