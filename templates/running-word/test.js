// =============================================================
// Standalone test page for the RUNNING WORD template.
// Same shape as every other template's test.js: load the module + its sample
// and hand them to the engine.
// =============================================================

const app = document.getElementById("app");

Promise.all([
  import("./running-word.js"),
  import("./sample-running-word.js"),
  import("../../core/engine.js")
]).then(([, data, engine]) => {
  engine.startGame(app, data.activity);
}).catch(err => {
  app.innerHTML =
    '<div style="font-family:sans-serif;padding:60px 20px;text-align:center;color:#4a5568">' +
    '<h2>Template "running-word" failed to load</h2>' +
    '<p>Check <b>running-word.js</b> and <b>sample-running-word.js</b> in this folder.<br>' +
    'Read <b>GHI CHU RUNNING-WORD.md</b> for the design notes.</p></div>';
  console.error(err);
});
