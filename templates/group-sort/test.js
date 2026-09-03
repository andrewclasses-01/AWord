// =============================================================
// Standalone test page for the GROUP SORT template.
//   ?mode=drag   → start the sample in drag mode (default: tap)
//   ?check=instant → drag mode graded on every drop (default: submit)
// =============================================================

const app = document.getElementById("app");
const p = new URLSearchParams(location.search);

Promise.all([
  import("./group-sort.js"),
  import("./sample-group-sort.js"),
  import("../../core/engine.js")
]).then(([, data, engine]) => {
  const act = JSON.parse(JSON.stringify(data.activity));
  if (p.get("mode")) act.options.mode = p.get("mode");
  if (p.get("check")) act.options.dragCheck = p.get("check");
  if (p.get("speed")) act.options.speed = Number(p.get("speed"));
  if (p.get("lives")) act.options.lives = Number(p.get("lives"));
  engine.startGame(app, act);
}).catch(err => {
  app.innerHTML =
    '<div style="font-family:sans-serif;padding:60px 20px;text-align:center;color:#4a5568">' +
    '<h2>Template "group-sort" is not built yet</h2>' +
    '<p>Create <b>group-sort.js</b> and <b>sample-group-sort.js</b> in this folder.</p></div>';
  console.error(err);
});
