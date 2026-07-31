// =============================================================
// Standalone test page for the CROSSWORD template.
// Loads ONLY core + this template — no home page, no other templates.
// Run the project server (python devserver.py 5510 at project root) then open:
//   http://localhost:5510/templates/crossword/test.html
// =============================================================

import "./crossword.js";
import { startGame } from "../../core/engine.js";
import { activity } from "./sample-crossword.js";

startGame(document.getElementById("app"), activity);
