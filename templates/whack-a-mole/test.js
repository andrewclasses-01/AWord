// =============================================================
// Standalone test page for the WHACK-A-MOLE template.
// Works as soon as you create whack-a-mole.js + sample-whack-a-mole.js.
// Until then it shows a friendly "not built yet" message.
// =============================================================

const app = document.getElementById("app");

Promise.all([
  import("./whack-a-mole.js"),
  import("./sample-whack-a-mole.js"),
  import("../../core/engine.js")
]).then(([, data, engine]) => {
  engine.startGame(app, data.activity);
}).catch(err => {
  app.innerHTML =
    '<div style="font-family:sans-serif;padding:60px 20px;text-align:center;color:#4a5568">' +
    '<h2>Template "whack-a-mole" is not built yet</h2>' +
    '<p>Create <b>whack-a-mole.js</b> and <b>sample-whack-a-mole.js</b> in this folder.<br>' +
    'Read <b>GHI CHU WHACK-A-MOLE.md</b> to get started.</p></div>';
  console.error(err);
});
