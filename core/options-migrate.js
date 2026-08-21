// =============================================================
// OPTIONS MIGRATION — bring a saved act's options onto the CURRENT scales
// (Đợt 143, 13/8/2026).
//
// WHY
// Đợt 143 put every penalty in the app on ONE scale: 0..100, step 1 (teacher:
// "đưa về 1 thang chung là 0-100, nấc 1 điểm"). Before that the same words
// "Points off" meant three different things:
//
//   scale     where                                          field
//   0..5      the shared control (11 games) + Unjumble's own  pointsOff
//   0..5      the three games that ship their own control —   minusAmount
//             Crossword, Type the answer, Whack-a-mole
//   0..10     Anagram, mode "On submit"                       pointsOff
//   0..100    Anagram, mode "Bonus and minus" (step 5)        letterPenalty
//
// ⚠️ TWO FIELD NAMES, not one. `minusAmount` is the same idea under an older
// name and it is easy to miss: it is what the Crossword / Type the answer /
// Whack-a-mole sliders write, while their LABEL says "Points off" like
// everyone else's. A migration that only converted `pointsOff` would have left
// those three games' penalties 20× too weak with nothing on screen to say so.
//
// The teacher chose "tự quy đổi giữ độ nặng": an act saved with -3 out of 5
// must keep costing the same share of a word, so it becomes -60 out of 100.
// Anything already on 0..100 (letterPenalty, timeCost) is left alone.
//
// ⚠️ THE TRAP THIS FILE EXISTS TO AVOID
// A migration that just multiplies on load multiplies AGAIN on the next load:
// -5 → -100 → -2000 → ... The act carries `optVer` and this runs at most once
// per act, ever. Every early return still STAMPS the version — an act with no
// options at all must be marked as current, otherwise the day the teacher first
// sets Points off on it (on the new scale) the next load would "convert" that
// brand-new value as if it were an old one.
//
// WHERE IT IS CALLED
//   core/store.js   — getActivity() and readAll(), i.e. everything the library
//                     hands out, so the migration is persisted the next time
//                     that act is saved for any reason.
//   core/engine.js  — once more at the top of a play, which is the belt to
//                     store.js's braces: samples, imported bundles and acts
//                     built on the fly (mistakes / converted copies) never come
//                     through the library at all.
// Both are safe to call repeatedly — that is the entire point of `optVer`.
// =============================================================

// Bump this ONLY when a new conversion step is added below, and add that step
// guarded by the version it upgrades FROM.
// v3 (Đợt 220, 21/8/2026) — allowSkip của Anagram/Unjumble lật true → false, xem allowSkipOff().
export const OPT_VER = 3;

// How much an old `pointsOff` must be multiplied by to mean the same thing on
// the 0..100 scale, per act type. Anything not listed used the shared 0..5
// control. Anagram is the one exception: its "On submit" penalty ran 0..10.
const POINTS_OFF_FACTOR = { anagram: 10 };
const DEFAULT_POINTS_OFF_FACTOR = 20;   // 0..5 -> 0..100

function factorFor(type) {
  return POINTS_OFF_FACTOR[type] || DEFAULT_POINTS_OFF_FACTOR;
}

// ⭐⭐ v2 → v3 (Đợt 220, 21/8/2026) — "ALLOW SKIP" THỐNG NHẤT MẶC ĐỊNH **TẮT**, HỒI TỐ.
// Thầy chốt "Thống nhất TẮT hết" — và từ Đợt 220 ô này còn là công tắc của luật chặn
// ‹ › trong Fight, nên một act cũ mang `true` là một act vẫn cho đội xong trước cắt
// ngang đội kia, đúng cái thầy đang chặn.
//
// ⛔⛔ CHỈ LẬT CHO **ANAGRAM + UNJUMBLE**, và ranh giới này là cả nội dung của bước:
//   · Ở hai game này ô tích trước Đợt 220 vẽ theo `!== false` — tức MẶC ĐỊNH ĐÃ TÍCH —
//     nên bất kỳ cú Apply nào (chỉnh timer, chỉnh lives, bất cứ gì) đều nướng `true`
//     vào options mà thầy không hề đụng tới ô đó. `lesson-import.js` (OPT_ANA) còn ghi
//     thẳng `allowSkip: true` vào MỌI act Anagram import. Một chữ `true` ở đây gần như
//     chắc chắn KHÔNG phải lựa chọn — nó là cặn của cái mặc định cũ.
//   · Quiz + Type the answer thì NGƯỢC LẠI: mặc định của chúng vốn là tắt (`=== true`),
//     nên `true` được lưu nghĩa là thầy đã CỐ Ý tích. Lật chỗ đó là xoá một lựa chọn
//     có chủ ý — đúng loại "dọn dẹp" mà hồ sơ dự án cấm.
function allowSkipOff(options, type) {
  if (!options || typeof options !== "object") return;
  if (type === "anagram" || type === "unjumble") {
    if (options.allowSkip === true) options.allowSkip = false;
  }
}

// Convert ONE options object, given the act type it belongs to.
// `letterPenalty` (Anagram) and `timeCost` were already 0..100 and are not
// touched — rescaling them would be the opposite of "giữ độ nặng".
function upgradeOptions(options, type) {
  if (!options || typeof options !== "object") return;
  const scale = (field, factor) => {
    const raw = Number(options[field]);
    if (Number.isFinite(raw) && raw > 0) {
      options[field] = Math.max(0, Math.min(100, Math.round(raw * factor)));
    }
  };
  scale("pointsOff", factorFor(type));
  // Always 0..5 wherever it appears — Anagram is the only template with a
  // different old scale and it has never used this field.
  scale("minusAmount", DEFAULT_POINTS_OFF_FACTOR);
}

/**
 * Bring one activity's options onto the current scales, at most once ever.
 * Mutates and returns the same object (callers pass library records straight in).
 */
export function migrateActivityOptions(act) {
  if (!act || typeof act !== "object") return act;
  const from = Number(act.optVer) || 0;
  if (from >= OPT_VER) return act;

  // ⚠️⚠️ TỪNG BƯỚC MỘT CHỐT RIÊNG THEO PHIÊN BẢN NÂNG **TỪ** — đây chính là cái bẫy
  // "-5 → -100 → -2000" đầu file: act đã ở v2 mà chạy lại phép nhân thang điểm là
  // điểm phạt bị nhân lần thứ hai. Bước v3 (allowSkip) tự nó chạy lại vô hại, nhưng
  // vẫn đi qua chốt cho cùng một khuôn — bước v4 sau này chỉ việc chép theo.
  if (from < 2) upgradeOptions(act.options, act.type);
  if (from < 3) allowSkipOff(act.options, act.type);

  // `templateOptions` (v0.9.27) remembers the options the teacher set for this
  // act under a DIFFERENT template — "change template, tweak, come back later
  // and it is still how you left it". Each entry is keyed by the type it was
  // saved for, so each converts with THAT type's factor, not the act's own.
  // Missing this would have left a whole second set of penalties on the old
  // scale, invisible until the teacher switched template.
  const per = act.templateOptions;
  if (per && typeof per === "object") {
    for (const type of Object.keys(per)) {
      if (from < 2) upgradeOptions(per[type], type);
      if (from < 3) allowSkipOff(per[type], type);
    }
  }

  act.optVer = OPT_VER;
  return act;
}
