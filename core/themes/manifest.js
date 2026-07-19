// =============================================================
// THEME MANIFEST — every theme the "Style" button can switch to.
// Add a theme = add one entry here (id must match .theme-<id> in the CSS file).
// CSS is lazy-loaded on first use (loadTheme), so pages don't need a
// <link> tag per theme — only the DEFAULT theme's CSS is pre-linked.
// =============================================================

export const THEMES = [
  { id: "classic",    label: "Classic",    file: "classic.css" },
  { id: "basic",      label: "Basic",      file: "basic.css" },
  { id: "classroom",  label: "Classroom",  file: "classroom.css" },
  { id: "beach",      label: "Beach",      file: "beach.css" }
];

const loaded = new Set();

// Ensure a theme's CSS is on the page (inserts a <link> once per theme).
export function loadTheme(id) {
  if (loaded.has(id)) return;
  const t = THEMES.find(x => x.id === id);
  if (!t) return;
  const href = new URL(`./${t.file}`, import.meta.url).href;
  // If a <link> for this exact file is already present (e.g. pre-linked in
  // the HTML for the default theme), don't add a duplicate.
  if ([...document.styleSheets].some(s => s.href === href)) { loaded.add(id); return; }
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
  loaded.add(id);
}
