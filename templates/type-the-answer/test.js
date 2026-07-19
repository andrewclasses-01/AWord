// =============================================================
// Standalone test page for the TYPE THE ANSWER template.
// Works as soon as you create type-the-answer.js + sample-type-the-answer.js.
// Until then it shows a friendly "not built yet" message.
// =============================================================

const app = document.getElementById("app");

Promise.all([
  import("./type-the-answer.js"),
  import("./sample-type-the-answer.js"),
  import("../../core/engine.js")
]).then(([, data, engine]) => {
  engine.startGame(app, data.activity);
}).catch(err => {
  app.innerHTML =
    '<div style="font-family:sans-serif;padding:60px 20px;text-align:center;color:#4a5568">' +
    '<h2>Template "type-the-answer" is not built yet</h2>' +
    '<p>Create <b>type-the-answer.js</b> and <b>sample-type-the-answer.js</b> in this folder.<br>' +
    'Read <b>GHI CHU TYPE-THE-ANSWER.md</b> to get started.</p></div>';
  console.error(err);
});
