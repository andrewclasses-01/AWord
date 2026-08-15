// =============================================================
// CONVERT — "phiên dịch" dữ liệu giữa các loại act, để đổi template
// ngay giữa lúc chơi mà vẫn giữ nguyên bộ nội dung.
//
// Ý tưởng: mỗi act được rút về một danh sách "record" chuẩn chung, rồi
// từ danh sách đó dựng lại content cho game đích. Chỉ đổi trong "nhóm hợp
// dữ liệu tốt" (thầy chốt 3/8/2026) — hàm switchTargets() trả về đúng các
// game đổi-được từ act hiện tại, engine chỉ hiện các game đó là bấm được.
//
// KHÔNG đụng dữ liệu gốc: convertActivity() dựng một act MỚI (id "conv_...",
// cờ _converted) để chơi tạm; act trong thư viện giữ nguyên.
//
// 4 "kind" record:
//   qa       { term, clue, altAnswers[], distractors[] }  (từ + đề/định nghĩa)
//   tf       { text, truth }                               (câu khẳng định đúng/sai)
//   sentence { sentence, clue }                            (nguyên 1 câu — Unjumble)
//   card     { text }                                      (chỉ có đề nói)
//
// Thêm template thứ 15 = thêm 1 nhánh trong toRecords() + buildContent() ở đây.
// =============================================================

import { templateEntry } from "./catalog.js";
import { shuffle } from "./utils.js";
import { resolveActivity } from "./content-view.js";
import { OPT_VER } from "./options-migrate.js";

// ---- Các loại đích theo từng "kind" nguồn -------------------------------
// (whack_a_mole nằm ở CẢ 2: nguồn/đích quiz-mode cho qa, tf-mode cho tf.)
const QA_TARGETS = [
  "anagram", "flying_fruit", "crossword", "find_the_match", "balloon_pop",
  "quiz", "gameshow", "maze_chase", "open_the_box", "type_the_answer",
  "whack_a_mole", "speaking_cards", "running_team"
];
// Running team needs SIX words to fill a round (one answer + five look-alike
// decoys). Hardcoded rather than imported from templates/running-team/rt-sets.js
// on purpose: this module deliberately imports only catalog + utils so that
// engine.js can import it statically without dragging template code onto the
// student page. Keep in step with MIN_POOL there.
const RUNNING_TEAM_MIN = 6;
const TF_TARGETS = ["true_false", "whack_a_mole", "speaking_cards"];
const SENTENCE_TARGETS = ["speaking_cards", "type_the_answer"];

// Các đích BẮT BUỘC phải có đề/định nghĩa (clue) mới ra kết quả tốt —
// nếu bộ nguồn không có clue (vd Anagram withClues:false) thì loại chúng ra.
const NEED_CLUE = new Set([
  "crossword", "find_the_match", "balloon_pop", "quiz", "gameshow",
  "maze_chase", "open_the_box", "whack_a_mole", "type_the_answer"
]);

// =============================================================
// 1) ĐỌC act hiện tại -> { kind, records }
// =============================================================
export function toRecords(activityIn) {
  // ⭐ Đợt 145 — flatten the chosen CLUE SET first. Change Template is normally
  // handed the ORIGINAL library act (engine.js switchList(): converting must
  // never read a throwaway converted copy), and for a vocabulary act that
  // object still holds all four clue sets with `.clue` mirroring the DEFAULT
  // one. Without this line a class reading the Vietnamese clues would switch
  // game and silently get the English ones back. Identity — literally the same
  // object — for every act without clue sets, i.e. everything else.
  const activity = resolveActivity(activityIn);
  const type = activity?.type;
  const c = activity?.content || {};
  const opt = activity?.options || {};

  switch (type) {
    case "anagram":
    case "flying_fruit": {
      const items = c.items || [];
      return { kind: "qa", records: items.map(i => qaRec(i.word, i.clue, i)) };
    }
    case "crossword": {
      const ws = c.words || [];
      return { kind: "qa", records: ws.map(w => qaRec(w.answer, w.clue)) };
    }
    case "find_the_match": {
      const ps = c.pairs || [];
      return { kind: "qa", records: ps.map(p => qaRec(p.keyword, p.definition)) };
    }
    case "balloon_pop": {
      const items = c.items || [];
      return { kind: "qa", records: items.map(i => qaRec(i.keyword, i.definition)) };
    }
    case "type_the_answer": {
      const items = c.items || [];
      return { kind: "qa", records: items.map(i => {
        const acc = (i.acceptedAnswers && i.acceptedAnswers.length) ? i.acceptedAnswers : [""];
        return { term: acc[0] || "", clue: i.prompt || "", altAnswers: acc.slice(), distractors: [] };
      }) };
    }
    case "quiz":
    case "gameshow":
    case "maze_chase":
    case "open_the_box":
      return { kind: "qa", records: fromMcQuestions(type === "open_the_box" ? c.items : c.questions) };
    case "whack_a_mole": {
      if (opt.mode === "quiz") return { kind: "qa", records: fromMcQuestions(c.questions) };
      const st = c.statements || [];
      return { kind: "tf", records: st.map(s => ({ text: s.text || "", truth: !!s.answer })) };
    }
    case "true_false": {
      const st = c.statements || [];
      return { kind: "tf", records: st.map(s => ({ text: s.text || "", truth: !!s.answer })) };
    }
    case "unjumble": {
      const items = c.items || [];
      return { kind: "sentence", records: items.map(i => ({
        sentence: i.sentence || i.word || i.text || "", clue: i.clue || ""
      })) };
    }
    case "speaking_cards": {
      const cards = c.cards || [];
      return { kind: "card", records: cards.map(cd => ({ text: cd.text || "" })) };
    }
    // Running team is a bare word pool — no clues exist to lose, and none are
    // wanted: its wrong answers are generated from the pool by look-alike score.
    // So it reads out as "qa" records with an empty clue, which correctly leaves
    // only the clue-free targets (Anagram, Flying fruit, Speaking cards) offered
    // on the way OUT, via the NEED_CLUE filter below.
    case "running_team": {
      const ws = c.words || [];
      return { kind: "qa", records: ws.map(w => qaRec(typeof w === "string" ? w : w?.word, "")) };
    }
    default:
      return { kind: "unknown", records: [] };
  }
}

// `extra` (10/8/2026) — the RAW source item, if the caller has one (only
// Anagram's own items carry `voice`/`voiceId`/`hideText` today; every other
// source template's items simply lack these fields, so they end up "").
// Carrying them through the record lets Change Template hand the SAME
// pronunciation + hide-text choice to whichever game the teacher switches
// to, instead of that choice only ever surviving inside Anagram itself.
function qaRec(term, clue, extra) {
  const t = String(term || "");
  return {
    term: t, clue: String(clue || ""), altAnswers: [t], distractors: [],
    voice: (extra && extra.voice) || "",
    voiceId: (extra && extra.voiceId) || "",
    hideText: !!(extra && extra.voice && extra.hideText)   // only ever true alongside a real voice
  };
}

// A quiz-shaped list [{question, answers:[{text,correct}]}] -> qa records.
function fromMcQuestions(list) {
  return (list || []).map(q => {
    const answers = q.answers || [];
    const correct = answers.find(a => a.correct) || answers[0] || { text: "" };
    const distractors = answers
      .filter(a => a !== correct && !a.correct)
      .map(a => a.text)
      .filter(Boolean);
    return { term: correct.text || "", clue: q.question || "", altAnswers: [correct.text || ""], distractors };
  });
}

// =============================================================
// 2) Danh sách game đổi-được từ act hiện tại (chỉ "nhóm hợp dữ liệu tốt")
//    -> [{ type, label }] (đã bỏ chính loại đang chơi, chỉ game đã build)
// =============================================================
export function switchTargets(activity) {
  const { kind, records } = toRecords(activity);
  if (!records.length) return [];

  let targets;
  if (kind === "qa") targets = QA_TARGETS.slice();
  else if (kind === "tf") targets = TF_TARGETS.slice();
  else if (kind === "sentence") targets = SENTENCE_TARGETS.slice();
  else return [];   // "card" (Speaking cards) không có đáp án -> không đổi được

  if (kind === "qa") {
    const n = records.length;
    const cluesPresent =
      records.filter(r => r.clue && r.clue.trim()).length >= Math.ceil(n * 0.6);
    targets = targets.filter(t => {
      // Crossword paginates at 30 answers/page up to 120 total (teacher
      // 4/8/2026, crossword.js) — 120 is the hard ceiling here too.
      if (t === "crossword" && (n < 2 || n > 120)) return false;
      if (t === "running_team" && n < RUNNING_TEAM_MIN) return false;
      if (NEED_CLUE.has(t) && !cluesPresent) return false;
      return true;
    });
  }

  return targets
    .filter(t => t !== activity.type)
    .map(t => templateEntry(t))
    .filter(e => e && e.built)
    .map(e => ({ type: e.type, label: e.label }));
}

// =============================================================
// 3) Dựng act MỚI của loại đích (chơi tạm, không đụng thư viện)
// =============================================================
export async function convertActivity(activity, targetType) {
  const { kind, records } = toRecords(activity);
  const content = buildContent(targetType, kind, records);

  // Options: nếu act này TỪNG được đổi sang đúng template đích và thầy đã Apply
  // chỉnh options, dùng LẠI bộ options đã nhớ (activity.templateOptions[type]).
  // Nếu chưa, lấy mặc định từ file sample của game đích. Instruction luôn lấy
  // từ sample cho hợp lệ.
  const remembered = activity.templateOptions && activity.templateOptions[targetType];
  let options = {}, instruction = "";
  try {
    const mod = await templateEntry(targetType).sample();
    const s = mod.activity || {};
    options = remembered ? { ...remembered } : { ...(s.options || {}) };
    instruction = s.instruction || "";
  } catch (_) {
    if (remembered) options = { ...remembered };   // sample lỗi vẫn giữ options đã nhớ
  }

  // Whack-a-mole is the one game with TWO content shapes picked by an OPTION
  // (options.mode: "quiz" -> content.questions, "trueFalse" -> content.statements).
  // The mode MUST follow the content we just built, so it is forced here, never
  // merely defaulted. It used to be set only `if (!options.mode)` — but the
  // options above are copied from whack-a-mole's own sample (mode:"trueFalse")
  // or from remembered options, so the flag was ALWAYS already present. A QA act
  // (Anagram, Quiz, Find the match...) therefore arrived carrying quiz questions
  // while claiming to be true/false, and the game showed "This activity has no
  // statements yet." — the switch looked available but was broken. (Teacher
  // reported it for Anagram and Quiz, 4/8/2026; it affected every QA source.)
  if (targetType === "whack_a_mole") options.mode = (kind === "tf") ? "trueFalse" : "quiz";

  // CONTENT MODE follows the WORDS across the switch (12/8/2026). Every option
  // above comes from the TARGET game's sample file, which knows nothing about
  // this act — so without this line a class playing an act in Text mode would
  // switch template and suddenly get hidden clues + auto-speech (the per-item
  // `hideText` flags travel with the content and AUTO mode would obey them).
  // Only carried when the source act actually stated a mode; an untouched old
  // act keeps arriving with none, i.e. AUTO, exactly as before.
  const srcMode = (activity && activity.options) ? activity.options.contentMode : null;
  if (srcMode) options.contentMode = srcMode;

  return {
    id: "conv_" + targetType + "_" + Math.floor(Math.random() * 1e9),
    schemaVersion: 1,
    type: targetType,
    title: activity.title || "",
    instruction,
    theme: activity.theme || "classic",
    // ⚠️ Đợt 169 (15/8/2026) — BẮT BUỘC phải có, cùng lý do content-view.js's
    // VIEW_ACT_KEYS đã ghi cho đường xem-riêng-bộ: `options` ở trên luôn lấy
    // từ sample của game ĐÍCH hoặc từ `templateOptions` đã nhớ — cả hai đều
    // đã ở đúng thang hiện tại — nhưng thiếu `optVer` thì act tạm này trông
    // như "act cũ chưa quy đổi" với MỌI `migrateActivityOptions()` sau đó
    // (core/engine.js gọi hàm này ở đầu MỌI startGame(), tức MỌI lần mount).
    // Lỗi thật thầy báo (15/8/2026): đổi Anagram→Quiz trong Fight mode, chỉnh
    // "Points off" xong không giữ mà tự nhảy số — vì core/fight.js's actFor()
    // dựng lại object cho mỗi bàn từ MỘT `activity` optVer-rỗng duy nhất mỗi
    // lần restart (Apply, Start again...), nên giá trị bị nhân lại (×20) MỖI
    // LẦN thay vì đúng 1 lần: -5 → -100 → -2000 → ... In single mode ít lộ
    // hơn vì `libAct`/`activity` được TÁI DÙNG qua các lần restart nên chỉ
    // dính đúng 1 lần rồi tự đóng dấu — nhưng lần đầu đó vẫn sai.
    optVer: OPT_VER,
    // ⛔⛔ Đợt 172 (15/8/2026) — LỖI THẬT: dòng `options,` này bị XOÁ MẤT khi
    // Đợt 169 chèn khối comment + `optVer` phía trên (thấy rõ qua
    // `git show 00ccb508` — diff đổi đúng dòng `options,` thành comment, không
    // dòng nào thêm nó trở lại). Từ đó MỌI lần "Change template" trả về một act
    // KHÔNG CÓ `options` — toàn bộ những gì tính ở khối phía trên (kể cả dòng
    // 227-235 "CONTENT MODE follows the WORDS across the switch" mà chính
    // comment đó mô tả) bị tính xong rồi vứt đi. Hậu quả đo được: act nguồn có
    // `variants` (act WORDS thật) đang ở Voice, đổi sang Type the answer rồi
    // chọn lại Text trong Options — vẫn tự phát giọng, vì act mới không có
    // `options.contentMode` nào cả nên rơi vào nhánh AUTO của voiceView(), mà
    // AUTO lại đọc `item.hideText` — và `resolveItem()` (content-view.js) LUÔN
    // đóng dấu `hideText:false` cho mọi act có variants (đúng thiết kế, vì act
    // dạng đó phải đọc mode qua contentMode, không qua cờ từng item) — nên AUTO
    // vẫn hiện chữ (trông như đúng) nhưng vẫn tự đọc (autoPlay:true trong nhánh
    // AUTO, không điều kiện gì). Bắt được bằng cách log trực tiếp
    // `convertActivity(...)`'s trả về trong `scratch/` — `.options` là
    // `undefined`. Vá bằng cách trả `options` lại, giữ nguyên `optVer` bên cạnh.
    options,
    content,
    _converted: true   // cờ đánh dấu act tạm (không lưu, không có trên thư viện)
  };
}

// Voice/hideText travel the SAME across every target (10/8/2026) — every
// item shape below gets these 3 extra fields on top of its own normal
// ones, regardless of target type, so each template's play-side code can
// check `item.voice`/`item.hideText` with one shared convention instead of
// a different property name per game. "tf"/"sentence"/"card" records never
// carry them (only Anagram's "qa" records do, via qaRec's `extra` param
// above) — voiceOf/voiceIdOf/hideTextOf just read "" / false for those,
// same as any other QA record with no voice.
function voiceOf(r) { return r.voice || ""; }
function voiceIdOf(r) { return r.voiceId || ""; }
function hideTextOf(r) { return !!(r.voice && r.hideText); }

function buildContent(targetType, kind, records) {
  switch (targetType) {
    case "anagram":
    case "flying_fruit":
      return {
        withClues: records.some(r => clueOf(r, kind).trim()),
        items: records.map(r => ({
          word: termOf(r, kind), clue: clueOf(r, kind),
          voice: voiceOf(r), voiceId: voiceIdOf(r), hideText: hideTextOf(r)
        }))
      };
    case "crossword":
      return { words: records.map(r => ({
        answer: termOf(r, kind), clue: clueOf(r, kind),
        voice: voiceOf(r), voiceId: voiceIdOf(r), hideText: hideTextOf(r)
      })) };
    case "find_the_match":
      return { pairs: records.map(r => ({
        keyword: termOf(r, kind), definition: clueOf(r, kind),
        voice: voiceOf(r), voiceId: voiceIdOf(r), hideText: hideTextOf(r)
      })) };
    case "balloon_pop":
      return { items: records.map(r => ({
        keyword: termOf(r, kind), definition: clueOf(r, kind),
        voice: voiceOf(r), voiceId: voiceIdOf(r), hideText: hideTextOf(r)
      })) };
    case "quiz":
    case "gameshow":
    case "maze_chase":
      return { questions: records.map(r => buildMc(r, records, kind)) };
    case "open_the_box":
      return { items: records.map(r => buildMc(r, records, kind)) };
    case "whack_a_mole":
      if (kind === "tf") return { statements: records.map(r => ({
        text: r.text, answer: !!r.truth,
        voice: voiceOf(r), voiceId: voiceIdOf(r), hideText: hideTextOf(r)
      })) };
      return { questions: records.map(r => buildMc(r, records, kind)) };
    case "true_false":
      return { statements: records.map(r => ({
        text: r.text || "", answer: !!r.truth,
        voice: voiceOf(r), voiceId: voiceIdOf(r), hideText: hideTextOf(r)
      })) };
    case "type_the_answer":
      return {
        mode: "qa",
        items: records.map(r => ({
          prompt: promptOf(r, kind), acceptedAnswers: acceptedOf(r, kind),
          voice: voiceOf(r), voiceId: voiceIdOf(r), hideText: hideTextOf(r)
        }))
      };
    case "speaking_cards":
      return { cards: records.map(r => ({
        text: cardText(r, kind), voice: voiceOf(r), voiceId: voiceIdOf(r), hideText: hideTextOf(r)
      })) };
    // Only the terms travel: the clue (if the source had one) is dropped on
    // purpose, because this game never shows a clue — and with no clue
    // there is nothing for hideText to stand in for either, so voice/
    // hideText are deliberately NOT carried into Running team.
    case "running_team":
      return { words: records.map(r => termOf(r, kind)).filter(Boolean), gameSets: [] };
    default:
      return {};
  }
}

// ---- Trích trường theo kind ---------------------------------------------
function termOf(r, kind) {
  if (kind === "sentence") return r.sentence || "";
  return r.term || "";
}
function clueOf(r, kind) {
  return String(r.clue || "");
}
function promptOf(r, kind) {
  if (kind === "sentence") return (r.clue && r.clue.trim()) ? r.clue : "Type the sentence:";
  return (r.clue && r.clue.trim()) ? r.clue : (r.term || "");
}
function acceptedOf(r, kind) {
  if (kind === "sentence") return [r.sentence || ""];
  return (r.altAnswers && r.altAnswers.length) ? r.altAnswers.slice() : [r.term || ""];
}
function cardText(r, kind) {
  if (kind === "tf") return r.text || "";
  if (kind === "sentence") return r.sentence || "";
  if (kind === "card") return r.text || "";
  // qa: ưu tiên đề/định nghĩa (giàu ý để nói), không có thì lấy chính từ
  return (r.clue && r.clue.trim()) ? r.clue : (r.term || "");
}

// Dựng 1 câu trắc nghiệm: đáp án đúng = term, đáp án nhiễu = distractors
// gốc (nếu nguồn vốn là trắc nghiệm) bù thêm từ các term khác trong bộ —
// ưu tiên chữ TRÔNG GIỐNG đáp án đúng (cùng chữ cái đầu, độ dài xấp xỉ) để
// gây nhiễu thật, thay vì random hoàn toàn (thầy yêu cầu 15/8/2026, áp dụng
// mọi đích trắc nghiệm: Quiz, Open the box, Gameshow, Maze chase, Whack-a-mole).
function buildMc(r, all, kind) {
  const correct = termOf(r, kind);
  const distr = (r.distractors || []).filter(d => d && d !== correct).slice(0, 3);
  if (distr.length < 3) {
    const pool = all.map(x => termOf(x, kind))
      .filter(t => t && t !== correct && !distr.includes(t));
    for (const t of rankByLookalike(correct, pool)) {
      if (distr.length >= 3) break;
      if (!distr.includes(t)) distr.push(t);
    }
  }
  const answers = shuffle([
    { text: correct, correct: true },
    ...distr.map(d => ({ text: d, correct: false }))
  ]);
  return {
    question: (r.clue && r.clue.trim()) ? r.clue : correct, answers,
    voice: voiceOf(r), voiceId: voiceIdOf(r), hideText: hideTextOf(r)
  };
}

// Điểm càng THẤP càng "giống" đáp án đúng: lệch chữ cái đầu bị phạt nặng
// (x100) nên luôn vét hết ứng viên cùng chữ cái đầu (xếp theo độ dài gần
// nhất) trước, hết mới rơi xuống nhóm khác chữ cái đầu — bộ ít từ vẫn luôn
// đủ 3 nhiễu, chỉ là kém giống dần chứ không bao giờ bỏ trống. Shuffle
// trước khi sort để các ứng viên đồng điểm không luôn ra cùng thứ tự.
function rankByLookalike(term, pool) {
  const t = String(term || "");
  const firstChar = t.charAt(0).toLowerCase();
  const len = t.length;
  function confusionScore(s) {
    const sameFirst = s.charAt(0).toLowerCase() === firstChar;
    return (sameFirst ? 0 : 100) + Math.abs(s.length - len);
  }
  return shuffle(pool).sort((a, b) => confusionScore(a) - confusionScore(b));
}
