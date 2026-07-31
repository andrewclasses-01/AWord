// =============================================================
// Standalone test page for the FLYING FRUIT template.
// =============================================================

const app = document.getElementById("app");

Promise.all([
  import("./flying-fruit.js"),
  import("./sample-flying-fruit.js"),
  import("../../core/engine.js")
]).then(([, data, engine]) => {
  engine.startGame(app, data.activity);
}).catch(err => {
  app.innerHTML =
    '<div style="font-family:sans-serif;padding:60px 20px;text-align:center;color:#4a5568">' +
    '<h2>Template "flying-fruit" is not built yet</h2>' +
    '<p>Create <b>flying-fruit.js</b> and <b>sample-flying-fruit.js</b> in this folder.</p></div>';
  console.error(err);
});
