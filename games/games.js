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
    load: () => import("./werewolf/werewolf.js").then(m => m.mountWerewolf) }
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
