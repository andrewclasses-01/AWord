// =============================================================
// Standalone test page for the QUIZ template.
// Loads ONLY core + this template — no home page, no other templates.
// Run the shared server (python -m http.server 5510 at project root)
// then open:  http://localhost:5510/templates/quiz/test.html
// =============================================================

import "./quiz.js";
import { startGame } from "../../core/engine.js";
import { activity } from "./sample-quiz.js";

startGame(document.getElementById("app"), activity);
