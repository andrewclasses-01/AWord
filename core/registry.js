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

// ---------------------------------------------------------------
// GỐC WEB, suy từ CHÍNH file này (Đợt 128)
//
// `core/catalog.js` khai đường dẫn css kiểu "templates/quiz/quiz.css" — tương
// đối với GỐC WEB. Trước đây `loadCss` để trình duyệt tự giải theo TRANG đang
// mở, đúng với `index.html`/`play.html` (cả hai nằm ở gốc) nhưng SAI với trang
// test của template (`templates/<x>/test.html`, sâu 2 cấp): đổi template ở đó
// đi tìm `/templates/quiz/templates/anagram/anagram.css` → 404, game chạy
// nhưng mất sạch style. `registry.js` luôn nằm ở `/core/` nên `../` từ chính
// nó là gốc web — đúng ở MỌI trang, không phụ thuộc trang nào đang mở.
// ---------------------------------------------------------------
const WEB_ROOT = new URL("../", import.meta.url);
function assetUrl(path) { return new URL(path, WEB_ROOT).href; }

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

// ---------------------------------------------------------------
// NẠP TRƯỚC ẢNH CỦA TEMPLATE (Đợt 122, 12/8/2026)
//
// Ảnh nền khai trong CSS chỉ được trình duyệt đi lấy KHI phần tử dùng nó hiện
// ra — nên ván đầu hay nháy đúng lúc cần mượt nhất (vụ nổ đầu tiên của Flying
// fruit, hố chuột đầu tiên của Whack-a-mole).
//
// Cách quét: đọc thẳng `cssRules` của CHÍNH stylesheet template vừa nạp và
// nhặt mọi `url(...)`. Tự động đúng cho cả template làm sau này — không ai
// phải khai danh sách. Đọc được vì mọi file CSS đều CÙNG ORIGIN.
//
// ⚠️ BẪY: quét CSS KHÔNG thấy ảnh do JS tự dựng bằng `new Image()`/`el("img")`
// — `templates/flying-fruit` và `templates/whack-a-mole` làm đúng vậy. Hai
// template đó tự khai thêm mảng `preloadImages` trong module của mình (engine
// gộp cả 2 nguồn lại).
// ---------------------------------------------------------------
const PRELOAD_IMG_CONCURRENCY = 6;

// Mọi URL ảnh khai trong file CSS của một loại game.
export function cssImageUrls(type) {
  const entry = templateEntry(type);
  if (!entry || !entry.css) return [];
  const href = assetUrl(entry.css);   // theo GỐC WEB, không theo trang (xem WEB_ROOT)
  // Khớp lỏng theo TÊN FILE nữa, vì trang test của template
  // (`templates/<x>/test.html`) khai <link> bằng đường dẫn tương đối của
  // riêng nó chứ không đi qua ensureTemplate() — so cứng href sẽ trượt.
  const fileName = entry.css.split("/").pop();
  const out = new Set();
  for (const sheet of document.styleSheets) {
    if (!sheet.href) continue;
    if (sheet.href !== href && !sheet.href.endsWith(`/${fileName}`)) continue;
    let rules;
    try { rules = sheet.cssRules; } catch { continue; }   // sheet chưa áp xong / khác origin
    collectUrls(rules, out);
  }
  return [...out];
}

function collectUrls(rules, out) {
  if (!rules) return;
  for (const rule of rules) {
    // @media / @supports (và luật lồng nhau kiểu CSS Nesting) — đào tiếp vào trong.
    // ⚠️ BẪY ĐÃ DÍNH khi build Đợt 122: từ khi Chrome có CSS Nesting thì MỘT LUẬT
    // THƯỜNG cũng có `.cssRules` (rỗng nhưng vẫn "truthy"), nên bản đầu viết
    // `if (rule.cssRules) { ...; continue; }` đã nhảy qua SẠCH mọi luật và trả về
    // danh sách rỗng — im lặng, không lỗi gì. Phải xét ĐỘ DÀI, và tuyệt đối
    // không `continue`: luật lồng vẫn có khai báo của chính nó.
    if (rule.cssRules && rule.cssRules.length) collectUrls(rule.cssRules, out);
    const text = rule.style && rule.style.cssText;
    if (!text || text.indexOf("url(") < 0) continue;
    for (const m of text.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
      const raw = m[1].trim();
      if (!raw || raw.startsWith("data:")) continue;      // ảnh nhúng sẵn: không phải đi mạng
      if (/\.(woff2?|ttf|otf)$/i.test(raw)) continue;     // font để trình duyệt tự lo
      try { out.add(new URL(raw, rule.parentStyleSheet?.href || location.href).href); } catch { /* bỏ qua */ }
    }
  }
}

// Kéo trước cả rổ ảnh. KHÔNG BAO GIỜ reject — thiếu ảnh thì game vẫn phải chơi
// được. `onProgress({done, total})` để engine vẽ thanh %.
export async function preloadImages(urls, onProgress) {
  const list = [...new Set((urls || []).filter(Boolean))];
  const total = list.length;
  if (!total) return { done: 0, total: 0 };
  let done = 0, next = 0;
  const one = url => new Promise(resolve => {
    const img = new Image();
    img.decoding = "async";
    let over = false;
    const finish = () => { if (over) return; over = true; resolve(); };
    img.onload = finish;
    img.onerror = finish;                 // ảnh thiếu không được treo hàng đợi
    setTimeout(finish, 8000);             // mạng lớp học treo cứng cũng phải nhả
    img.src = url;
  });
  async function worker() {
    while (next < list.length) {
      await one(list[next++]);
      done++;
      if (onProgress) { try { onProgress({ done, total }); } catch { /* ignore */ } }
    }
  }
  await Promise.all(Array.from({ length: Math.min(PRELOAD_IMG_CONCURRENCY, total) }, worker));
  return { done, total };
}

// Chèn 1 <link rel=stylesheet> và đợi trình duyệt áp xong. Không bao giờ
// reject: CSS hỏng chỉ làm game xấu, không đáng chặn cả lượt chơi.
function loadCss(href) {
  if (!href) return Promise.resolve();
  // Giải về URL tuyệt đối theo GỐC WEB (xem WEB_ROOT ở trên) chứ không theo
  // trang đang mở.
  const url = assetUrl(href);
  // So bằng `l.href` (URL đã giải) chứ KHÔNG phải `getAttribute("href")` (chuỗi
  // thô): trang test khai `<link href="./anagram.css">` còn catalog khai
  // `templates/anagram/anagram.css` — hai chuỗi khác nhau nhưng CÙNG một file.
  // So chuỗi thô thì không nhận ra, và chèn thêm một bản CSS trùng nữa.
  const done = [...document.querySelectorAll("link[rel=stylesheet]")].some(l => l.href === url);
  if (done) return Promise.resolve();

  return new Promise(resolve => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = url;
    link.onload = resolve;
    link.onerror = resolve;
    document.head.append(link);
    // Mạng lớp học có lúc rất chậm — thà chơi trước, CSS vào sau, còn hơn treo.
    setTimeout(resolve, 4000);
  });
}
