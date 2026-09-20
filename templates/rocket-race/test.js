// =============================================================
// Standalone test page for the ROCKET-RACE template.
// Loads the game + its sample data + the engine, then starts a game.
// =============================================================

const app = document.getElementById("app");

Promise.all([
  import("./rocket-race.js"),
  import("./sample-rocket-race.js"),
  import("../../core/engine.js")
]).then(([, data, engine]) => {
  engine.startGame(app, data.activity);
}).catch(err => {
  app.innerHTML =
    '<div style="font-family:sans-serif;padding:60px 20px;text-align:center;color:#4a5568">' +
    '<h2>Template "rocket-race" failed to load</h2>' +
    '<pre style="text-align:left;max-width:800px;margin:20px auto;white-space:pre-wrap;color:#b32a2a"></pre></div>';
  app.querySelector("pre").textContent = (err && err.stack) || String(err);
  console.error(err);
});
