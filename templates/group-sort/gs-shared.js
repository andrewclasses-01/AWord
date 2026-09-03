// =============================================================
// GROUP SORT — constants + the group-list normaliser shared by the game and
// its editor. A leaf module (no imports) so neither of them has to import the
// other: group-sort.js imports the editor, and the editor must not import the
// game back (a cycle that only works by accident of evaluation order).
// =============================================================

export const MAX_GROUPS = 8;
export const MIN_GROUPS = 2;
export const MAX_ITEMS = 150;

// The group list, cleaned: strings, trimmed, non-empty, unique (case-insensitive).
export function normalizeGroups(content) {
  const seen = new Set(), out = [];
  (Array.isArray(content?.groups) ? content.groups : []).forEach(g => {
    const name = String(g == null ? "" : g).trim();
    const key = name.toLowerCase();
    if (!name || seen.has(key)) return;
    seen.add(key); out.push(name);
  });
  return out.slice(0, MAX_GROUPS);
}

// Index of the group an item names, or -1.
export function groupIndexOf(groups, name) {
  const key = String(name == null ? "" : name).trim().toLowerCase();
  return groups.findIndex(g => g.toLowerCase() === key);
}
