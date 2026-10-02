// =============================================================
// kiemtra-cham.js — PHÉP CHẤM của trang KIỂM TRA ĐẦU VÀO (Đợt 440, thầy chốt 02/10/2026).
//
// Tách riêng (không DOM) để: bàn thử node gọi thẳng, và dashboard myLesson có thể
// import cùng một phép chấm khi thầy bấm "chấm lại".
//
// Luật chấm (đúng luật skill `kiemtradauvao` thầy dùng nhiều năm + bảng đáp án v1 thầy duyệt):
//   · BỎ QUA: hoa/thường · dấu câu (. , ? ! ; : " …) · khoảng trắng thừa · dấu thanh.
//   · COI NHƯ NHAU: viết tắt ↔ viết đủ (don't = do not, can't = cannot = can not, I'm = I am…),
//                   số ↔ chữ (2 = two, 10 = ten).
//   · KHÔNG sửa lỗi chính tả từ (coffce ≠ coffee).
// ⚠️ "'s" KHÔNG tự đổi thành " is" — nó còn là sở hữu (Minh's) ⇒ chỉ đổi các dạng chắc chắn
//    (he's/she's/it's/that's/what's/where's/who's/there's/here's).
// =============================================================

const SO = { zero: "0", one: "1", two: "2", three: "3", four: "4", five: "5", six: "6", seven: "7", eight: "8", nine: "9",
  ten: "10", eleven: "11", twelve: "12", thirteen: "13", fourteen: "14", fifteen: "15", sixteen: "16", seventeen: "17",
  eighteen: "18", nineteen: "19", twenty: "20" };

const TAT = [
  [/\bcan'?t\b/g, "cannot"], [/\bcan not\b/g, "cannot"], [/\bwon'?t\b/g, "will not"], [/\bshan'?t\b/g, "shall not"],
  [/\bain'?t\b/g, "is not"],
  [/\b(do|does|did|is|are|was|were|has|have|had|could|would|should|must|need|might)n'?t\b/g, "$1 not"],
  [/\bi'm\b/g, "i am"], [/\bim\b/g, "i am"],
  [/\b(you|we|they|who|what)'re\b/g, "$1 are"],
  [/\b(he|she|it|that|what|where|who|there|here|how)'s\b/g, "$1 is"],
  [/\b(i|you|we|they|he|she|it|who|that|there)'ll\b/g, "$1 will"],
  [/\b(i|you|we|they|who)'ve\b/g, "$1 have"],
  [/\b(i|you|we|they|he|she|it|who|that|there)'d\b/g, "$1 would"]
];

/** Chuẩn hoá một câu trả lời để so. */
export function chuan(s) {
  let t = String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  t = t.replace(/[‘’ʼ`´]/g, "'");
  for (const [re, ra] of TAT) t = t.replace(re, ra);
  t = t.replace(/[^a-z0-9' ]+/g, " ").replace(/'/g, "");
  // "l" (L thường) đứng một mình = "I": phông Baloo vẽ I hoa và l thường gần như y hệt, bàn phím điện thoại lại tắt
  // tự viết hoa ⇒ em gõ "l like cats" mà nhìn như đúng (02/10 tối). Tiếng Anh không có từ "l" nên đổi an toàn.
  return t.split(/\s+/).filter(Boolean).map(w => (w === "l" ? "i" : SO[w] || w)).join(" ");
}

/** Câu trả lời `typed` có khớp một đáp án nào không. Rỗng ⇒ sai. */
export function dung(typed, acceptedAnswers) {
  const t = chuan(typed);
  if (!t) return false;
  return (acceptedAnswers || []).some(a => chuan(a) === t);
}
