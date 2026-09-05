// =============================================================
// SCORING — tính điểm & gói kết quả 1 lượt chơi.
// Quy ước (giống Wordwall): điểm = số câu đúng; xếp hạng theo
// (số câu đúng nhiều hơn) rồi (thời gian ít hơn).
// Sau này kết quả này sẽ được gửi lên Firebase để xếp hạng.
// =============================================================

export function computeResult(raw, timeSeconds) {
  const perQuestion = raw.perQuestion || [];
  const correct = raw.correct ?? perQuestion.filter(q => q.correct).length;
  const total = raw.total ?? perQuestion.length;
  const incorrect = raw.incorrect ?? (total - correct);

  return {
    correct,
    incorrect,
    total,
    // Điểm dùng để XẾP HẠNG. Mặc định = số câu đúng (Quiz và mọi game khác), NHƯNG
    // một template có thể tự truyền điểm riêng qua raw.score (vd Gameshow: điểm theo
    // tốc độ + thưởng bonus) để leaderboard xếp & hiển thị theo điểm đó. Tương thích
    // ngược tuyệt đối: không truyền raw.score thì kết quả y như trước.
    score: raw.score ?? correct,
    // (Tuỳ chọn) chuỗi điểm đã định dạng sẵn (vd "1250") — khi có, bảng tổng kết &
    // leaderboard hiện NGUYÊN chuỗi này thay cho dạng "đúng/tổng".
    scoreText: raw.scoreText ?? null,
    // ⭐⭐ Đợt 294 (05/09/2026) — SỐ CÂU THẬT CỦA ĐỀ, tách hẳn khỏi `total`.
    // Từ Đợt 265b, bốn template cho mở lại câu đã sai (open-the-box · true-false ·
    // crossword · find-the-match) nộp `total` = SỐ LƯỢT ĐÃ TIÊU: mở lại một câu là
    // thêm một hàng. Con số đó ĐÚNG cho màn tổng kết trong game (thầy chốt Đợt 265b)
    // nhưng SAI khi ghi vào bài giao — bên myLesson đọc `score/total` để biết em ấy có
    // đạt điểm tối đa chưa, nên em làm đúng cả 30 câu mà lỡ sai một nhát giữa chừng bị
    // ghi 30/31 = 97% và bị chấm "chưa hoàn thành" (đo thật 04-05/09/2026, act
    // `4mmufy` lớp NNTNG4: 4 em dính).
    // ⇒ Template nào có thể hỏi lại một câu thì truyền thêm `items` = số câu của đề.
    // engine.js dùng nó LÀM MẪU SỐ KHI NỘP BÀI GIAO; màn tổng kết vẫn hiện `total`.
    // Template không truyền thì `null` ⇒ mọi thứ y hệt nết cũ.
    items: raw.items ?? null,
    timeSeconds,
    perQuestion,
    submittedAt: Date.now()
  };
}

// So sánh 2 kết quả để xếp hạng: điểm cao hơn -> hạng cao; hòa thì nhanh hơn -> hạng cao.
// (score mặc định = số câu đúng nên với các game cũ hành vi hoàn toàn không đổi.)
export function rankCompare(a, b) {
  if (b.score !== a.score) return b.score - a.score;
  return a.timeSeconds - b.timeSeconds;
}
