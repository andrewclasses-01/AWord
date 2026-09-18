// =============================================================
// FIND THE GAP — helpers shared by the game and its editor. A LEAF module
// (no imports) so neither side has to import the other (same reason as
// group-sort/gs-shared.js).
//
// DATA (content):
//   audio: "LSA2-S1.T1.P1-2-3"      lesson code in the myLesson-audio store,
//                                    or a full http(s) URL to an mp3
//   items: [{ speaker, text, gaps: [{ word, span?, answers?, choices? }],
//             start, end, enabled }]
//     text    the WHOLE spoken line, punctuation and all
//     gaps    each points at a TOKEN INDEX of `text` (whitespace split) — the
//             gap is the word, the text stays intact, so editing the sentence
//             never loses a gap. `span` (default 1) = how many consecutive
//             tokens the gap covers, so a PHRASE ("in the High Street") can be
//             one gap (thầy, 18/9 vòng 2). `answers` = extra accepted
//             spellings (the phrase itself is always accepted); `choices` =
//             teacher-set distractors for QUIZ mode (auto-picked when absent).
//     start/end  seconds inside the audio file
//     enabled    false = skipped by the game (kept in the editor)
// =============================================================

export const MAX_ITEMS = 300;
export const MIN_ITEMS = 1;
export const MAX_CHOICES = 6;
export const MIN_CHOICES = 3;
export const AUDIO_BASE = "https://andrewclasses-01.github.io/myLesson-audio/";

// Where an audio code lives (mirrors myLesson's audio-kho README: one folder
// per LEVEL = everything before the first "-"). A full URL passes through.
export function audioUrlOf(code) {
  const s = String(code || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s) || /^blob:/i.test(s) || s.startsWith("/") || s.startsWith("./") || s.startsWith("../")) return s;
  const level = s.split("-")[0];
  return AUDIO_BASE + encodeURIComponent(level) + "/" + encodeURIComponent(s) + ".mp3";
}

// A token is one whitespace-separated chunk: leading punctuation, the word
// core, trailing punctuation. "home." -> { lead:"", core:"home", trail:"." }.
export function tokenize(text) {
  return String(text || "").trim().split(/\s+/).filter(Boolean).map(raw => {
    const m = raw.match(/^([^\p{L}\p{N}]*)(.*?)([^\p{L}\p{N}]*)$/u);
    return { raw, lead: m ? m[1] : "", core: m ? m[2] : raw, trail: m ? m[3] : "" };
  });
}

// Can this token be a gap at all? (a bare "–" or "…" cannot)
export function gappable(tok) {
  return !!(tok && tok.core && /[\p{L}\p{N}]/u.test(tok.core));
}

// Case + accent insensitive comparison key (same rule as Type the answer).
export function normalize(str) {
  let s = String(str ?? "").trim().replace(/\s+/g, " ").replace(/[’‘]/g, "'");
  s = s.normalize("NFD").replace(/[̀-ͯ]/g, "");
  return s.toLowerCase();
}

// The words a gap covers (1 for a single word, more for a phrase).
export function spanOf(gap) { const n = Number(gap && gap.span); return Number.isInteger(n) && n > 1 ? n : 1; }
export function gapEnd(gap) { return gap.word + spanOf(gap) - 1; }   // last token index, inclusive

// The gap's own text: the cores of its tokens joined by a space
// ("Room 22?" spanning two tokens -> "Room 22").
export function gapText(item, gap) {
  const toks = item.tokens.slice(gap.word, gapEnd(gap) + 1);
  return toks.map(t => t.core).filter(Boolean).join(" ");
}

// Every spelling accepted for a gap: the text itself first, then the extras.
export function answersOf(item, gap) {
  const out = [];
  const push = s => { const t = String(s || "").trim(); if (t && !out.some(o => normalize(o) === normalize(t))) out.push(t); };
  push(gapText(item, gap));
  (Array.isArray(gap.answers) ? gap.answers : []).forEach(push);
  return out;
}

export function isRightAnswer(item, gap, typed) {
  const t = normalize(typed);
  return !!t && answersOf(item, gap).some(a => normalize(a) === t);
}

// Content -> playable items (tokens attached, gaps validated, order kept).
// `all` = true keeps disabled items too (the editor wants them).
export function normalizeItems(content, { all = false } = {}) {
  const src = Array.isArray(content?.items) ? content.items : [];
  const out = [];
  src.forEach(it => {
    if (!it || typeof it.text !== "string" || !it.text.trim()) return;
    const tokens = tokenize(it.text);
    const gaps = (Array.isArray(it.gaps) ? it.gaps : [])
      .map(g => ({ word: Number(g && g.word), span: spanOf(g), answers: Array.isArray(g && g.answers) ? g.answers : [], choices: Array.isArray(g && g.choices) ? g.choices : [] }))
      .filter(g => Number.isInteger(g.word) && g.word >= 0 && g.word < tokens.length && gappable(tokens[g.word]))
      .map(g => ({ ...g, span: Math.min(g.span, tokens.length - g.word) }))
      .sort((a, b) => a.word - b.word);
    // gaps must not overlap — the earlier one wins
    let lastEnd = -1;
    const uniq = gaps.filter(g => (g.word > lastEnd ? (lastEnd = gapEnd(g), true) : false));
    const enabled = it.enabled !== false;
    if (!all && (!enabled || uniq.length === 0)) return;
    out.push({
      speaker: String(it.speaker || "").trim(),
      text: it.text,
      tokens,
      gaps: uniq,
      start: Number(it.start) || 0,
      end: Number(it.end) || 0,
      enabled,
      src: it   // the ORIGINAL content object — "Start with mistakes" filters by it
    });
  });
  return out.slice(0, MAX_ITEMS);
}

// How alike two words look — for picking QUIZ distractors that are not
// giveaways. Higher = more alike. (Same spirit as convert.js rankByLookalike.)
function lookalike(a, b) {
  const x = normalize(a), y = normalize(b);
  if (!x || !y) return 0;
  let s = 0;
  if (x[0] === y[0]) s += 2;
  if (x[x.length - 1] === y[y.length - 1]) s += 1;
  s += 3 - Math.min(3, Math.abs(x.length - y.length));
  const wx = x.split(" ").length, wy = y.split(" ").length;
  if (wx === wy) s += 2;
  return s;
}

// ⭐ Thầy (18/9, sau khi bấm tay): nhiễu phải KHÓ — cùng một từ ở dạng khác
// (số ít/nhiều, thêm/bớt s·es·ed·ing·e) để thử thách âm đuôi, rồi mới tới
// từ khác trong bài. Trả về các biến thể hình thái của `word`, giữ kiểu hoa
// thường của chữ cái đầu. Luật nắn đuôi cố ý ĐƠN GIẢN (tiếng Anh phổ thông);
// dạng sai ngữ pháp vẫn là nhiễu tốt cho tai nghe ("photoes", "leaved").
export function wordVariants(word) {
  const w = String(word || "").trim();
  if (!w || /\s/.test(w) || !/^[A-Za-z][A-Za-z']*$/.test(w)) return [];
  const cap = /^[A-Z]/.test(w) && !/^[A-Z]{2,}$/.test(w);
  const lower = w.toLowerCase();
  const out = [];
  const push = v => { if (v && v !== lower && v.length >= 2 && !out.includes(v)) out.push(v); };
  const stem = lower.replace(/e$/, "");
  // 1) number: plural ↔ singular
  if (/ies$/.test(lower)) push(lower.slice(0, -3) + "y");
  else if (/(s|x|z|ch|sh)es$/.test(lower)) push(lower.slice(0, -2));
  else if (/[^s]s$/.test(lower)) push(lower.slice(0, -1));
  else if (/[^aeiou]y$/.test(lower)) push(lower.slice(0, -1) + "ies");
  else if (/(s|x|z|ch|sh|o)$/.test(lower)) push(lower + "es");
  else push(lower + "s");
  // 2) verb forms
  if (/ing$/.test(lower)) { const b = lower.slice(0, -3); push(b); push(b + "e"); push(b + "ed"); push(b + "s"); }
  else if (/ed$/.test(lower)) { const b = lower.slice(0, -2); push(b); push(b + "e"); push(b + "ing"); push(b + "s"); }
  else { push(stem + "ing"); push(/e$/.test(lower) ? lower + "d" : lower + "ed"); }
  // 3) a bare -e / +e twin ("hous" is nonsense, so only when the twin is plausible)
  if (/e$/.test(lower) && lower.length > 4) push(stem);
  return out.map(v => (cap ? v[0].toUpperCase() + v.slice(1) : v));
}

// The tile texts for one gap in QUIZ mode: the right word plus up to n-1
// distractors, hardest first: (1) teacher-set `gap.choices`, (2) the number
// twin of the right word (plural/singular), (3) answers of
// OTHER gaps in the same activity, most look-alike first. Anything that is
// itself an accepted answer for this gap is never a distractor. The caller
// shuffles the result.
export function buildChoices(item, gap, pool, n) {
  const want = Math.max(2, Math.min(MAX_CHOICES, n | 0 || MAX_CHOICES));
  const accepted = answersOf(item, gap);
  const right = accepted[0] || "";
  const out = [right];
  const taken = new Set(accepted.map(normalize));
  const add = s => { const k = normalize(s); if (!k || taken.has(k) || out.length >= want) return; taken.add(k); out.push(String(s).trim()); };
  (gap.choices || []).forEach(add);
  const variants = wordVariants(right);
  variants.slice(0, 1).forEach(add);   // the number twin (passport ↔ passports) is always in
  if (out.length < want) {
    [...pool]
      .filter(w => !taken.has(normalize(w)))
      .sort((a, b) => lookalike(right, b) - lookalike(right, a))
      .forEach(add);
  }
  variants.slice(2).forEach(add);   // still short (tiny activity): more forms of the same word
  return out;
}

// Every distinct gap word in the activity — the distractor pool + FIND tiles.
export function answerPool(items) {
  const seen = new Set(), out = [];
  items.forEach(it => it.gaps.forEach(g => {
    const a = answersOf(it, g)[0];
    if (!a || seen.has(normalize(a))) return;
    seen.add(normalize(a)); out.push(a);
  }));
  return out;
}

export function fmtTime(sec) {
  const s = Math.max(0, Number(sec) || 0);
  const m = Math.floor(s / 60), r = s - m * 60;
  return `${m}:${r < 10 ? "0" : ""}${r.toFixed(1)}`;
}

export function escapeHtml(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
