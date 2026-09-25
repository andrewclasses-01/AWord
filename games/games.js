// =============================================================
// FIXED GAMES — the list shown at the top of the GAMES tree (Đợt 373).
//
// These are NOT templates: no entry in core/catalog.js, so they never appear
// in "New activity", the in-game Template picker, Change template or Set
// assignment. Only Claude adds a game here (thầy's rule, 23/9/2026): one entry
// = one card in GAMES + one link ?g=<id>.
//
//   load()   -> the module; it exports mount(root, ctx) -> dispose()
//   css      -> stylesheet, relative to the web root (index.html)
// =============================================================

export const FIXED_GAMES = [
  { id: "werewolf", label: "Werewolf", kind: "Game master",
    blurb: "Run a live Werewolf game: night calls, music, votes.",
    css: "games/werewolf/werewolf.css",
    load: () => import("./werewolf/werewolf.js").then(m => m.mountWerewolf) },
  // ⭐ Đợt 386 — Wordshake: 16 letters, two teams, a word one team finds is taken.
  // `art` = the card's preview (main.js fixedGameCard); a game without it keeps
  // Werewolf's moon.
  { id: "wordshake", label: "Wordshake", kind: "Team game",
    blurb: "Two teams make words from the same 16 letters. A word one team finds is taken.",
    css: "games/wordshake/wordshake.css",
    art: { bg: "radial-gradient(110% 85% at 50% 40%,#0F4029 0%,#05170F 62%,#030D09 100%)",
           svg: '<svg viewBox="0 0 64 64" width="64" height="64" fill="none" stroke="#3DF58A" stroke-width="2.4" stroke-linejoin="round"><rect x="6" y="6" width="22" height="22" rx="4"/><rect x="36" y="6" width="22" height="22" rx="4"/><rect x="6" y="36" width="22" height="22" rx="4"/><rect x="36" y="36" width="22" height="22" rx="4" fill="#3DF58A" fill-opacity=".85"/></svg>' },
    load: () => import("./wordshake/wordshake.js").then(m => m.mountWordshake) }
];

export function fixedGame(id) { return FIXED_GAMES.find(g => g.id === id) || null; }

// Insert the game's stylesheet once and wait for it (a fixed game is a whole
// page — showing it unstyled for a moment would be worse than waiting).
export function loadGameCss(href) {
  const url = new URL("../" + href, import.meta.url).href;
  if ([...document.querySelectorAll("link[rel=stylesheet]")].some(l => l.href === url)) return Promise.resolve();
  return new Promise(resolve => {
    const link = document.createElement("link");
    link.rel = "stylesheet"; link.href = url;
    link.onload = link.onerror = () => resolve();
    document.head.append(link);
    setTimeout(resolve, 4000);
  });
}
