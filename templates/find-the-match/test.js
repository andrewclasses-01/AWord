// =============================================================
// Standalone test page for the FIND THE MATCH template.
// Works as soon as you create find-the-match.js + sample-find-the-match.js.
// Until then it shows a friendly "not built yet" message.
// =============================================================

const app = document.getElementById("app");

Promise.all([
  import("./find-the-match.js"),
  import("./sample-find-the-match.js"),
  import("../../core/engine.js")
]).then(([, data, engine]) => {
  engine.startGame(app, data.activity);
}).catch(err => {
  app.innerHTML =
    '<div style="font-family:sans-serif;padding:60px 20px;text-align:center;color:#4a5568">' +
    '<h2>Template "find-the-match" is not built yet</h2>' +
    '<p>Create <b>find-the-match.js</b> and <b>sample-find-the-match.js</b> in this folder.<br>' +
    'Read <b>GHI CHU FIND-THE-MATCH.md</b> to get started.</p></div>';
  console.error(err);
});
