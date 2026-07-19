// =============================================================
// Standalone test page for the OPEN THE BOX template.
// Works as soon as you create open-the-box.js + sample-open-the-box.js.
// Until then it shows a friendly "not built yet" message.
// =============================================================

const app = document.getElementById("app");

Promise.all([
  import("./open-the-box.js"),
  import("./sample-open-the-box.js"),
  import("../../core/engine.js")
]).then(([, data, engine]) => {
  engine.startGame(app, data.activity);
}).catch(err => {
  app.innerHTML =
    '<div style="font-family:sans-serif;padding:60px 20px;text-align:center;color:#4a5568">' +
    '<h2>Template "open-the-box" is not built yet</h2>' +
    '<p>Create <b>open-the-box.js</b> and <b>sample-open-the-box.js</b> in this folder.<br>' +
    'Read <b>GHI CHU OPEN-THE-BOX.md</b> to get started.</p></div>';
  console.error(err);
});
