// =============================================================
// Standalone test page for the SPEAKING template.
// =============================================================

const app = document.getElementById("app");

Promise.all([
  import("./speaking.js"),
  import("./sample-speaking.js"),
  import("../../core/engine.js")
]).then(([, data, engine]) => {
  engine.startGame(app, data.activity);
}).catch(err => {
  app.innerHTML =
    '<div style="font-family:sans-serif;padding:60px 20px;text-align:center;color:#4a5568">' +
    '<h2>Template "speaking" is not built yet</h2>' +
    '<p>Create <b>speaking.js</b> and <b>sample-speaking.js</b> in this folder.</p></div>';
  console.error(err);
});
