// =============================================================
// Standalone test page for the WORDSHAKE template.
// ?mode=one|list|free picks the Wordshake mode for a quick look.
// =============================================================

const app = document.getElementById("app");
const mode = new URLSearchParams(location.search).get("mode");

Promise.all([
  import("./wordshake.js"),
  import("./sample-wordshake.js"),
  import("../../core/engine.js")
]).then(([, data, engine]) => {
  const act = structuredClone(data.activity);
  if (["one", "list", "free"].includes(mode)) act.options.wsMode = mode;
  engine.startGame(app, act);
}).catch(err => {
  app.innerHTML = '<div style="font-family:sans-serif;padding:60px 20px;text-align:center;color:#4a5568"><h2>Wordshake failed to load</h2></div>';
  console.error(err);
});
