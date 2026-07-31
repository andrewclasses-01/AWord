// =============================================================
// Standalone test page for the BALLOON POP template.
// =============================================================

const app = document.getElementById("app");

Promise.all([
  import("./balloon-pop.js"),
  import("./sample-balloon-pop.js"),
  import("../../core/engine.js")
]).then(([, data, engine]) => {
  engine.startGame(app, data.activity);
}).catch(err => {
  app.innerHTML =
    '<div style="font-family:sans-serif;padding:60px 20px;text-align:center;color:#4a5568">' +
    '<h2>Template "balloon-pop" failed to load</h2>' +
    '<p>Check the console for the error.</p></div>';
  console.error(err);
});
