// =============================================================
// Standalone test page for the FIND THE GAP template.
//   ?mode=quiz|type|find   ?scoring=gap|sentence   ?choices=3..6
//   ?lives=N   ?points=N (points off)   ?timer=none|countUp|countDown
//   ?edit=1  → open the editor on the sample instead of playing
//   ?src=../../scratch/x.ftg.json → play a bundle made by tools/ftg-prepare.py
// =============================================================

const app = document.getElementById("app");
const p = new URLSearchParams(location.search);

Promise.all([
  import("./find-the-gap.js"),
  import("./sample-find-the-gap.js"),
  import("../../core/engine.js")
]).then(async ([tplMod, data, engine]) => {
  let act = JSON.parse(JSON.stringify(data.activity));
  // ?src=path/to/bundle.json → play the first act of a tools/ftg-prepare.py bundle instead
  if (p.get("src")) { const b = await fetch(p.get("src")).then(r => r.json()); act = b.activities ? b.activities[0] : b; act.id = act.id || "test_src"; }
  if (p.get("mode")) act.options.mode = p.get("mode");
  if (p.get("scoring")) act.options.scoring = p.get("scoring");
  if (p.get("choices")) act.options.choices = Number(p.get("choices"));
  if (p.get("lives")) act.options.lives = Number(p.get("lives"));
  if (p.get("points")) act.options.pointsOff = Number(p.get("points"));
  if (p.get("timer")) act.options.timer = p.get("timer");
  if (p.get("edit")) {
    tplMod.default.edit(app, act, {
      onSave: a => { console.log("SAVED", a); alert("Saved to console (test page has no library)"); },
      onCancel: () => location.replace(location.pathname)
    });
    return;
  }
  engine.startGame(app, act);
}).catch(err => {
  app.innerHTML =
    '<div style="font-family:sans-serif;padding:60px 20px;text-align:center;color:#4a5568">' +
    '<h2>Template "find-the-gap" could not load</h2><pre>' + String(err && err.stack || err) + '</pre></div>';
  console.error(err);
});
