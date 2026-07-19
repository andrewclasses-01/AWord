// =============================================================
// REGISTRY — "sổ đăng ký" các loại game.
// Mỗi loại game (quiz, anagram, ...) tự đăng ký vào đây.
// Engine tra sổ này để biết dùng module nào cho từng loại.
// Thêm game mới = viết 1 module rồi gọi registerTemplate() — không đụng lõi.
// =============================================================

const templates = new Map();

// Đăng ký 1 loại game
export function registerTemplate(template) {
  if (!template || !template.type) {
    throw new Error("Template phải có thuộc tính 'type'.");
  }
  templates.set(template.type, template);
}

// Lấy module game theo loại
export function getTemplate(type) {
  const t = templates.get(type);
  if (!t) throw new Error(`Chưa có game loại "${type}" trong registry.`);
  return t;
}

// Danh sách các loại game đã đăng ký (cho màn hình chọn game sau này)
export function listTemplates() {
  return [...templates.values()];
}
