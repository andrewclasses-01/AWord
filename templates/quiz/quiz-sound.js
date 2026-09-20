// =============================================================
// QUIZ SOUNDS — real mp3 sound effects for this template only (not
// core/sound.js's synthesized tones). Files live in ./sounds/, resolved
// relative to THIS file (import.meta.url) so they work from any page depth
// or host subpath — same pattern as core/sound.js's wrong() file and
// templates/anagram/anagram-sound.js.
// Respects the shared mute toggle via core/sound.js's isMuted().
// =============================================================

import { createPack } from "../../core/sfx.js";
import { wrapWrong } from "../../core/wrong-sound.js";
import { sound as coreSound } from "../../core/sound.js";

// Đợt 85 (7/8/2026) — the pack is now fetched AT IMPORT TIME (prime() below),
// which `ensureTemplate()` runs before the READY screen is drawn, instead of
// each file being fetched on its own first play. Measured on the live site:
// first play went from 67–363 ms down to 8 ms. `hot` = the effects that fire
// during play, so they are queued first. See core/sfx.js for the full story.
const pack = createPack(import.meta.url, {
  names: ["blockchipminor1", "blockchipminor2", "blockchipminor3",
          "blockchipfail1", "blockchipfail2", "blockchipfail3",
          "blockgameintro1", "blockgamerestart", "blockgametimeout", "blockgamesuccessful"],
  hot:   ["blockchipminor1", "blockchipminor2", "blockchipminor3",
          "blockchipfail1", "blockchipfail2", "blockchipfail3"]
});
// Same names + same signatures as the hand-rolled helpers this replaced, so the
// export block below is untouched.
const playFile = pack.play;    // (name, volume?)
const makePool = pack.pool;    // (names, volume?) — random variant, never twice in a row
pack.prime();

export const quizSound = {
  correct: makePool(["blockchipminor1", "blockchipminor2", "blockchipminor3"]),
  wrong: wrapWrong(makePool(["blockchipfail1", "blockchipfail2", "blockchipfail3"])),
  play: () => playFile("blockgameintro1"),
  restart: () => playFile("blockgamerestart"),
  timeWarning: () => playFile("blockgametimeout"),
  complete: () => playFile("blockgamesuccessful"),
  // ⭐ Đợt 364 (thầy, 20/9/2026) — HẾT MẠNG THÌ IM: trước đây `gameOver` mượn
  // "blockgametimeout" (nhạc dồn dập 5 giây cuối của đồng hồ đếm ngược, dài hơn
  // 6 s) làm tiếng thua ⇒ màn Game over + leaderboard đã hiện mà nhạc vẫn chạy thêm
  // 6 s. Thầy: "cần bỏ đoạn nhạc này". Tiếng ✗ của câu sai cuối đã kêu 1,5 s trước
  // đó, nên game over không cần thêm tiếng nào.
  gameOver: () => {},
  // Đợt 364 — cắt nhạc 5-giây-cuối nếu nó còn đang chạy lúc ván KẾT THÚC (hết mạng
  // giữa lúc đồng hồ tổng đang báo 5 s cuối, hoặc nộp bài lúc còn 3 s): ván đã xong
  // thì "sắp hết giờ" không còn nghĩa gì nữa.
  stopWarning: () => pack.stop("blockgametimeout"),
  // ⭐ Đợt 364 — TÍCH DỒN DẬP 5 GIÂY CUỐI của thanh Time limit (thầy: "trong 5s cuối
  // của thanh thời gian cần có âm thanh dồn dập"). Tổng hợp bằng core/sound.js
  // (tôn trọng nút loa chung) chứ không dùng "blockgametimeout": clip đó dài 6 s+,
  // mỗi câu lại kêu một lần suốt 30 câu thì phải cắt dở liên tục. `urgency` 0..1
  // (0 = còn 5 s, 1 = sắp hết): blip vuông ngắn, cao dần theo mức gấp.
  tick: (urgency = 0) => {
    const u = Math.max(0, Math.min(1, urgency));
    const f = 880 + 520 * u;
    coreSound.glide({ freq: f, freqEnd: f * 0.9, dur: 55, gain: 0.10 + 0.06 * u, type: "square" });
  }
};
