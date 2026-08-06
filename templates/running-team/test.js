// =============================================================
// Standalone test page for the RUNNING TEAM template.
// Same shape as every other template's test.js: load the module + its sample
// and hand them to the engine.
// =============================================================

const app = document.getElementById("app");

Promise.all([
  import("./running-team.js"),
  import("./sample-running-team.js"),
  import("../../core/engine.js")
]).then(([, data, engine]) => {
  engine.startGame(app, data.activity);
}).catch(err => {
  app.innerHTML =
    '<div style="font-family:sans-serif;padding:60px 20px;text-align:center;color:#4a5568">' +
    '<h2>Template "running-team" failed to load</h2>' +
    '<p>Check <b>running-team.js</b> and <b>sample-running-team.js</b> in this folder.<br>' +
    'Read <b>GHI CHU RUNNING-TEAM.md</b> for the design notes.</p></div>';
  console.error(err);
});
