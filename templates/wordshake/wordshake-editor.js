// =============================================================
// WORDSHAKE CONTENT EDITOR — Wordshake uses the SAME data shape as Anagram
// (content.items[{word, clue}] + the ENG1/ENG2/VI1/VI2 clue sets and VOICE
// clips), so — exactly like Rocket race reuses the Quiz editor — we REUSE the
// Anagram editor and only:
//   • stamp the activity's type back to "wordshake" on save (the Anagram
//     editor's normalize() stamps "anagram"),
//   • relabel the little type badge.
// Mode / letters are per-act options in the in-game Options panel.
// =============================================================

import { openAnagramEditor } from "../anagram/anagram-editor.js";

export function openWordshakeEditor(container, activity, opts = {}) {
  openAnagramEditor(container, activity, {
    ...opts,
    onSave: async updated => {
      if (updated) updated.type = "wordshake";
      return opts.onSave?.(updated);
    }
  });
  const badge = container.querySelector(".aw-ed-typebadge");
  if (badge) badge.textContent = "WORDSHAKE";
}
