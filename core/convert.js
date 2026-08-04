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

// ---- Các loại đích theo từng "kind" nguồn -------------------------------
// (whack_a_mole nằm ở CẢ 2: nguồn/đích quiz-mode cho qa, tf-mode cho tf.)
const QA_TARGETS = [
  "anagram", "flying_fruit", "crossword", "find_the_match", "balloon_pop",
  "quiz", "gameshow", "maze_chase", "open_the_box", "type_the_answer",
  "whack_a_mole", "speaking_cards"
];
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
export function toRecords(activity) {
  const type = activity?.type;
  const c = activity?.content || {};
  const opt = activity?.options || {};

  switch (type) {
    case "anagram":
    case "flying_fruit": {
      const items = c.items || [];
      return { kind: "qa", records: items.map(i => qaRec(i.word, i.clue)) };
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
    default:
      return { kind: "unknown", records: [] };
  }
}

function qaRec(term, clue) {
  const t = String(term || "");
  return { term: t, clue: String(clue || ""), altAnswers: [t], distractors: [] };
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

  return {
    id: "conv_" + targetType + "_" + Math.floor(Math.random() * 1e9),
    schemaVersion: 1,
    type: targetType,
    title: activity.title || "",
    instruction,
    theme: activity.theme || "classic",
    options,
    content,
    _converted: true   // cờ đánh dấu act tạm (không lưu, không có trên thư viện)
  };
}

function buildContent(targetType, kind, records) {
  switch (targetType) {
    case "anagram":
    case "flying_fruit":
      return {
        withClues: records.some(r => clueOf(r, kind).trim()),
        items: records.map(r => ({ word: termOf(r, kind), clue: clueOf(r, kind) }))
      };
    case "crossword":
      return { words: records.map(r => ({ answer: termOf(r, kind), clue: clueOf(r, kind) })) };
    case "find_the_match":
      return { pairs: records.map(r => ({ keyword: termOf(r, kind), definition: clueOf(r, kind) })) };
    case "balloon_pop":
      return { items: records.map(r => ({ keyword: termOf(r, kind), definition: clueOf(r, kind) })) };
    case "quiz":
    case "gameshow":
    case "maze_chase":
      return { questions: records.map(r => buildMc(r, records, kind)) };
    case "open_the_box":
      return { items: records.map(r => buildMc(r, records, kind)) };
    case "whack_a_mole":
      if (kind === "tf") return { statements: records.map(r => ({ text: r.text, answer: !!r.truth })) };
      return { questions: records.map(r => buildMc(r, records, kind)) };
    case "true_false":
      return { statements: records.map(r => ({ text: r.text || "", answer: !!r.truth })) };
    case "type_the_answer":
      return {
        mode: "qa",
        items: records.map(r => ({ prompt: promptOf(r, kind), acceptedAnswers: acceptedOf(r, kind) }))
      };
    case "speaking_cards":
      return { cards: records.map(r => ({ text: cardText(r, kind) })) };
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
// gốc (nếu nguồn vốn là trắc nghiệm) bù thêm từ các term khác trong bộ.
function buildMc(r, all, kind) {
  const correct = termOf(r, kind);
  const distr = (r.distractors || []).filter(d => d && d !== correct).slice(0, 3);
  if (distr.length < 3) {
    const pool = shuffle(all.map(x => termOf(x, kind))
      .filter(t => t && t !== correct && !distr.includes(t)));
    for (const t of pool) {
      if (distr.length >= 3) break;
      if (!distr.includes(t)) distr.push(t);
    }
  }
  const answers = shuffle([
    { text: correct, correct: true },
    ...distr.map(d => ({ text: d, correct: false }))
  ]);
  return { question: (r.clue && r.clue.trim()) ? r.clue : correct, answers };
}
