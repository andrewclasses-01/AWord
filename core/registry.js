// =============================================================
// REGISTRY — "sổ đăng ký" các loại game.
// Mỗi loại game (quiz, anagram, ...) tự đăng ký vào đây.
// Engine tra sổ này để biết dùng module nào cho từng loại.
// Thêm game mới = viết 1 module rồi khai 1 dòng trong core/catalog.js.
// =============================================================

import { templateEntry } from "./catalog.js";

const templates = new Map();

// Đăng ký 1 loại game
export function registerTemplate(template) {
  if (!template || !template.type) {
    throw new Error("Template phải có thuộc tính 'type'.");
  }
  templates.set(template.type, template);
}

// Lấy module game theo loại (ĐỒNG BỘ — chỉ dùng khi chắc chắn đã nạp xong,
// ví dụ trong engine sau khi trang gọi ensureTemplate()).
export function getTemplate(type) {
  const t = templates.get(type);
  if (!t) throw new Error(`Chưa có game loại "${type}" trong registry.`);
  return t;
}

// Đã nạp loại này chưa?
export function hasTemplate(type) {
  return templates.has(type);
}

// Danh sách các loại đã nạp
export function listTemplates() {
  return [...templates.values()];
}

// ---------------------------------------------------------------
// NẠP THEO YÊU CẦU (v0.9.7)
//
// Trước đây mỗi trang phải tự `import` sẵn TỪNG template và khai TỪNG dòng
// <link> CSS trong HTML. Hậu quả: `play.html` (trang học sinh) chỉ khai mỗi
// quiz, nên giao assignment loại khác cho HS là gãy "Chưa có game loại ...".
//
// Nay trang chỉ cần `await ensureTemplate(activity.type)` trước khi chơi/sửa:
// hàm này tra `core/catalog.js`, chèn CSS của template (và ĐỢI CSS áp xong,
// nếu không game sẽ hiện 1 nháy không style) rồi import module — module tự
// gọi registerTemplate(). Mỗi loại chỉ nạp 1 lần; gọi song song vẫn an toàn
// vì lời hứa được nhớ lại trong `pending`.
//
// Nhờ vậy HS mở 1 assignment chỉ tải ĐÚNG 1 game, không tải cả 14.
// ---------------------------------------------------------------
const pending = new Map();

export function ensureTemplate(type) {
  if (templates.has(type)) return Promise.resolve(templates.get(type));
  if (pending.has(type)) return pending.get(type);

  const entry = templateEntry(type);
  if (!entry || !entry.built || typeof entry.load !== "function") {
    return Promise.reject(new Error(`Chưa có game loại "${type}" trong catalog.`));
  }

  const p = Promise.all([loadCss(entry.css), entry.load()])
    .then(() => {
      // Module vừa import PHẢI đã tự registerTemplate() — nếu không thì lỗi
      // nằm ở chính template đó, báo ngay còn hơn để engine gãy sau.
      if (!templates.has(type)) {
        throw new Error(`Module của "${type}" không gọi registerTemplate().`);
      }
      return templates.get(type);
    })
    .catch(err => { pending.delete(type); throw err; });

  pending.set(type, p);
  return p;
}

// Chèn 1 <link rel=stylesheet> và đợi trình duyệt áp xong. Không bao giờ
// reject: CSS hỏng chỉ làm game xấu, không đáng chặn cả lượt chơi.
function loadCss(href) {
  if (!href) return Promise.resolve();
  const done = [...document.querySelectorAll("link[rel=stylesheet]")]
    .some(l => l.getAttribute("href") === href);
  if (done) return Promise.resolve();

  return new Promise(resolve => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.onload = resolve;
    link.onerror = resolve;
    document.head.append(link);
    // Mạng lớp học có lúc rất chậm — thà chơi trước, CSS vào sau, còn hơn treo.
    setTimeout(resolve, 4000);
  });
}
