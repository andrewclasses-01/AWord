// =============================================================
// Standalone test page for the ANAGRAM template.
// Works as soon as you create anagram.js + sample-anagram.js here.
// Until then it shows a friendly "not built yet" message.
// =============================================================

const app = document.getElementById("app");

Promise.all([
  import("./anagram.js"),
  import("./sample-anagram.js"),
  import("../../core/engine.js")
]).then(([, data, engine]) => {
  engine.startGame(app, data.activity);
}).catch(err => {
  app.innerHTML =
    '<div style="font-family:sans-serif;padding:60px 20px;text-align:center;color:#4a5568">' +
    '<h2>Template "anagram" is not built yet</h2>' +
    '<p>Create <b>anagram.js</b> and <b>sample-anagram.js</b> in this folder.<br>' +
    'Read <b>GHI CHU ANAGRAM.md</b> to get started.</p></div>';
  console.error(err);
});
