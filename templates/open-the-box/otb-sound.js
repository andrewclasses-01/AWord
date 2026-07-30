// =============================================================
// OPEN THE BOX SOUNDS — real mp3 effects sourced directly from Wordwall's
// own "Open the box" theme (see D:\APP AND DATA\Source\Sound effect\OPEN
// THE BOX\GHI CHU.md for where each file came from), own copy under
// ./sounds/ (not cross-imported — every template stays self-contained).
// Same pool/mute pattern as anagram-sound.js.
//
// NOTE on gameOver/timesUp naming (Teacher Andrew's explicit call, 30/7/2026):
// Wordwall's own file itself documents "07 TimesUp" as the clock-hits-0
// *ding*, separate from "06 GameOver" (the lose screen). The teacher asked
// for a DIFFERENT split instead: gameOver = lose (ran out of time before
// finishing), timesUp = the WIN sound (finished every box in time). Built
// exactly as instructed — the original "05 GameCompleted" file is left
// unused as a result (see GHI CHU OPEN-THE-BOX.md).
// =============================================================

import { sound as coreSound } from "../../core/sound.js";

function urlFor(name) { return new URL(`./sounds/${name}.mp3`, import.meta.url).href; }

const cache = new Map();
function audioFor(name) {
  let a = cache.get(name);
  if (!a) { a = new Audio(urlFor(name)); a.preload = "auto"; cache.set(name, a); }
  return a;
}

function playFile(name) {
  if (coreSound.isMuted()) return;
  try {
    const a = audioFor(name);
    a.currentTime = 0;
    a.play().catch(() => {});
  } catch { /* ignore if the browser blocks audio */ }
}

function makePool(names) {
  let last = -1;
  return function play() {
    let i = Math.floor(Math.random() * names.length);
    if (names.length > 1 && i === last) i = (i + 1) % names.length;
    last = i;
    playFile(names[i]);
  };
}

export const otbSound = {
  intro: () => playFile("intro"),                                            // 01 — right when PLAY is pressed, before the grid appears
  openBox: makePool(["openbox-01", "openbox-02", "openbox-03"]),             // 02 — tapping a box open
  correct: makePool(["correct-01", "correct-02", "correct-03"]),             // 03 — correct answer
  wrong: makePool(["incorrect-01", "incorrect-02", "incorrect-03"]),         // 04 — wrong answer
  gameOver: () => playFile("gameover"),                                      // 06 — lose: time ran out before every box was solved
  timesUp: () => playFile("timesup"),                                        // 07 — win: every box solved before time ran out
  restart: () => playFile("restart"),                                        // 08 — "Start again"
  clockTick: () => playFile("clocktick"),                                    // 12 — once per second while the countdown runs
  shuffle: () => playFile("shuffle"),                                        // 13 — box/question order shuffled at the start of a play
  tileAppear: () => playFile("tileappear"),                                  // 14 — grid zooming in right after Play
  tileEliminate: () => playFile("tileeliminate")                             // 15 — a box locks (wrong answer) back on the grid
};
