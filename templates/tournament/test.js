// =============================================================
// Standalone test page for the TOURNAMENT template.
// ?phut=2|3|5 &lv=easy|medium|hard &mode=one|list|free &giong=1 &bien=eng1|eng2|vi1|vi2
// ?trong=1 = giải chưa có từ nào.
// =============================================================

const app = document.getElementById("app");
const q = new URLSearchParams(location.search);

Promise.all([
  import("./tournament.js"),
  import("./sample-tournament.js"),
  import("../../core/engine.js")
]).then(([, data, engine]) => {
  const act = structuredClone(data.activity);
  const o = act.options;
  if (["2", "3", "5"].includes(q.get("phut"))) o.tnPhut = +q.get("phut");
  if (["easy", "medium", "hard"].includes(q.get("lv"))) o.tnLv = q.get("lv");
  if (["one", "list", "free"].includes(q.get("mode"))) o.wsMode = q.get("mode");
  if (["eng1", "eng2", "vi1", "vi2"].includes(q.get("bien"))) o.tnBien = q.get("bien");
  if (q.get("giong") === "1") o.tnGiong = true;
  if (q.get("trong") === "1") act.content.items = [];
  engine.startGame(app, act, { noLastTpl: true });
}).catch(err => {
  app.innerHTML = '<div style="font-family:sans-serif;padding:60px 20px;text-align:center;color:#4a5568"><h2>Tournament failed to load</h2></div>';
  console.error(err);
});
