// =============================================================
// Standalone test page for the TRUE FALSE template.
// Works as soon as true-false.js + sample-true-false.js exist.
// Until then it shows a friendly "not built yet" message.
// =============================================================

const app = document.getElementById("app");

Promise.all([
  import("./true-false.js"),
  import("./sample-true-false.js"),
  import("../../core/engine.js")
]).then(([, data, engine]) => {
  engine.startGame(app, data.activity);
}).catch(err => {
  app.innerHTML =
    '<div style="font-family:sans-serif;padding:60px 20px;text-align:center;color:#4a5568">' +
    '<h2>Template "true-false" is not built yet</h2>' +
    '<p>Create <b>true-false.js</b> and <b>sample-true-false.js</b> in this folder.<br>' +
    'Read <b>GHI CHU TRUE-FALSE.md</b> to get started.</p></div>';
  console.error(err);
});
