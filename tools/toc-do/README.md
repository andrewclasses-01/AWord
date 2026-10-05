# tools/toc-do — bộ đo tốc độ (Đợt 479–485, 05/10/2026)

Đọc **`docs/TOI-UU-TOC-DO-WEB.md`** trước: quy trình 5 bước, các thủ phạm đã gặp, bẫy của chính công cụ đo, cách áp dụng cho web khác.

Chuẩn bị (thư mục tạm, KHÔNG trong repo):
```
npm i playwright pngjs pixelmatch@5 esbuild
npx playwright install webkit
```
Các script nguyên bản dùng trong phiên 05/10 — vài đường dẫn/cổng cố định (7701–7712, thư mục `src`/`goc`/`min`), đọc đầu file rồi sửa cho ca mới.
Script đụng Firestore thật bằng khoá quản trị: `do-kho.js` CHỈ ĐỌC; `di-tru-484.js` GHI (chỉ chạy khi thầy cho phép, luôn `--sao-luu` trước).
