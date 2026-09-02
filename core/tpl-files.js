// =============================================================
// core/tpl-files.js — SINH TỰ ĐỘNG bởi `python tools/sinh-preload.py --write`
// ⛔ ĐỪNG SỬA TAY. Với từng template: file css + mọi module import tĩnh đi từ
// file `load:` trong core/catalog.js (bỏ core/ dùng chung — trang đã preload).
// registry.ensureTemplate() fetch() cả danh sách một lúc trước khi import()
// (Đợt 286). Thiếu/lệch danh sách chỉ làm chậm, không làm hỏng.
// =============================================================
export const TPL_FILES = {
  "quiz": ["templates/quiz/quiz.css", "templates/quiz/quiz.js", "templates/quiz/quiz-editor.js", "templates/quiz/quiz-sound.js"],
  "anagram": ["templates/anagram/anagram.css", "templates/anagram/anagram.js", "templates/anagram/anagram-sound.js", "templates/anagram/anagram-editor.js"],
  "find_the_match": ["templates/find-the-match/find-the-match.css", "templates/find-the-match/find-the-match.js", "templates/find-the-match/find-the-match-editor.js", "templates/find-the-match/ftm-sound.js"],
  "type_the_answer": ["templates/type-the-answer/type-the-answer.css", "templates/type-the-answer/type-the-answer.js", "templates/type-the-answer/type-the-answer-editor.js", "templates/type-the-answer/type-the-answer-sound.js"],
  "open_the_box": ["templates/open-the-box/open-the-box.css", "templates/open-the-box/open-the-box.js", "templates/open-the-box/otb-sound.js", "templates/open-the-box/open-the-box-editor.js"],
  "true_false": ["templates/true-false/true-false.css", "templates/true-false/true-false.js", "templates/true-false/true-false-editor.js", "templates/true-false/tf-sound.js"],
  "gameshow": ["templates/gameshow/gameshow.css", "templates/gameshow/gameshow.js", "templates/gameshow/gameshow-editor.js", "templates/gameshow/gs-sound.js"],
  "maze_chase": ["templates/maze-chase/maze-chase.css", "templates/maze-chase/maze-chase.js", "templates/maze-chase/mc-sound.js", "templates/maze-chase/maze-chase-editor.js", "templates/quiz/quiz-editor.js"],
  "whack_a_mole": ["templates/whack-a-mole/whack-a-mole.css", "templates/whack-a-mole/whack-a-mole.js", "templates/whack-a-mole/wam-sound.js", "templates/whack-a-mole/whack-a-mole-editor.js"],
  "flying_fruit": ["templates/flying-fruit/flying-fruit.css", "templates/flying-fruit/flying-fruit.js", "templates/flying-fruit/ff-sound.js", "templates/flying-fruit/flying-fruit-editor.js"],
  "balloon_pop": ["templates/balloon-pop/balloon-pop.css", "templates/balloon-pop/balloon-pop.js", "templates/balloon-pop/balloon-pop-sound.js", "templates/balloon-pop/balloon-pop-editor.js"],
  "crossword": ["templates/crossword/crossword.css", "templates/crossword/crossword.js", "templates/crossword/crossword-editor.js", "templates/crossword/crossword-sound.js"],
  "unjumble": ["templates/unjumble/unjumble.css", "templates/unjumble/unjumble.js", "templates/unjumble/unjumble-sound.js", "templates/unjumble/unjumble-editor.js"],
  "speaking_cards": ["templates/speaking-cards/speaking-cards.css", "templates/speaking-cards/speaking-cards.js", "templates/speaking-cards/speaking-cards-sound.js"],
  "running_word": ["templates/running-word/running-word.css", "templates/running-word/running-word.js", "templates/running-word/running-word-editor.js", "templates/running-word/rw-sound.js", "templates/running-word/rw-print.js", "templates/running-word/rw-sets.js"],
  "running_team": ["templates/running-team/running-team.css", "templates/running-team/running-team.js", "templates/running-team/running-team-editor.js", "templates/running-team/rt-sound.js", "templates/running-team/rt-print.js", "templates/running-team/rt-sets.js"],
  "speaking": ["templates/speaking/speaking.css", "templates/speaking/speaking.js", "templates/speaking/speaking-editor.js", "templates/speaking/speaking-sound.js"],
};
