// =============================================================
// TOURNAMENT CONTENT EDITOR — nội dung giải = bộ từ y hệt Anagram/A Show Speed
// (content.items[{word, clue}] + bộ ENG1/ENG2/VI1/VI2 + VOICE) nên DÙNG LẠI editor
// Anagram, chỉ đóng lại type "tournament" khi lưu và đổi nhãn.
// =============================================================

import { openAnagramEditor } from "../anagram/anagram-editor.js";

export function openTournamentEditor(container, activity, opts = {}) {
  openAnagramEditor(container, activity, {
    ...opts,
    onSave: async updated => {
      if (updated) updated.type = "tournament";
      return opts.onSave?.(updated);
    }
  });
  const badge = container.querySelector(".aw-ed-typebadge");
  if (badge) badge.textContent = "TOURNAMENT";
}
