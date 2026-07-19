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
    score: correct,          // điểm cơ bản = số câu đúng
    timeSeconds,
    perQuestion,
    submittedAt: Date.now()
  };
}

// So sánh 2 kết quả để xếp hạng: đúng nhiều hơn -> hạng cao; hòa thì nhanh hơn -> hạng cao.
export function rankCompare(a, b) {
  if (b.correct !== a.correct) return b.correct - a.correct;
  return a.timeSeconds - b.timeSeconds;
}
