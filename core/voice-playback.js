// =============================================================
// VOICE PLAYBACK — shared "listen to a pronunciation clip" engine, for any
// template whose content items can carry an optional `voice` (a
// voiceClips/{id} id, see core/voice-clips.js) + `hideText` flag. Extracted
// (10/8/2026) from templates/anagram/anagram.js — the first template with
// this feature — so the ~12 OTHER templates that "Change Template"
// (core/convert.js) can convert an Anagram-sourced activity into don't
// each need their own copy of the play/toggle/glow/delayed-first-play
// logic. Anagram itself is left untouched (already shipped + tested) and
// does NOT use this module — it keeps its own original implementation.
//
// Pairs with the shared CSS in core/app.css: `.aw-voicebtn` / `.aw-voicebtn-lg`
// / `.aw-voicebtn.is-playing` / `.aw-clue-voiceonly` — sized in `em` via
// `font: inherit`, so dropping the class into ANY template's question/clue
// element picks up that element's own font-size automatically, no
// per-template CSS needed.
//
// USAGE (inside a template's mount(), once per new question/item):
//   import { createVoicePlayer } from "../../core/voice-playback.js";
//   import { icons } from "../../core/icons.js";
//   const voicePlayer = createVoicePlayer();
//   ...
//   function render() {
//     voicePlayer.stop();   // silence whatever the PREVIOUS item was playing
//     ...
//     if (it.voice) {
//       const btn = el("button", "aw-voicebtn" + (it.hideText ? " aw-voicebtn-lg" : ""), icons.soundOn);
//       btn.type = "button";
//       btn.setAttribute("aria-label", "Listen to pronunciation");
//       btn.onclick = () => voicePlayer.toggle(it.voice, btn);
//       questionEl.append(btn);
//       voicePlayer.playDelayed(it.voice, btn, isFirstQuestion ? INTRO_DELAY_MS : 0);
//     }
//   }
//   ...
//   return function cleanup() { voicePlayer.stop(); };
//
// `playDelayed(clipId, btn, 0)` plays immediately — pass 0 for every
// question after the first (the intro-chime overlap only matters once, at
// the very start of a play). A reasonable flat delay for templates that
// don't measure their own intro chime's exact length (unlike Anagram's
// `anagramSound.introDurationMs()`) is exported as DEFAULT_INTRO_DELAY_MS.
// =============================================================

import { getVoiceClip } from "./voice-clips.js";

// Most templates' default "Play" chime (core/sound.js's synthesized
// `sound.start()`, or a template's own short one-shot mp3) is well under a
// second — this is a deliberately simple, "good enough" flat delay rather
// than measuring each template's own file duration (which only Anagram's
// anagram-sound.js does today, via core/sfx.js's `durationMs()`).
export const DEFAULT_INTRO_DELAY_MS = 650;

export function createVoicePlayer() {
  const cache = new Map();          // clipId -> data: URL
  let audioEl = null;               // currently-playing/loaded clip
  let btnEl = null;                 // listen button wired to audioEl's play state (for the glow)
  let delayTimer = null;            // pending delayed first-play, if any
  let epoch = 0;                    // bumped by stop(): clips requested before it must not start (Đợt 114)

  function setGlow(btn, on) {
    if (btn) btn.classList.toggle("is-playing", on);
  }

  // Silences whatever is playing/pending RIGHT NOW — call this at the top
  // of every new-question render, unconditionally (even if the new
  // question has no voice of its own), so a previous question's clip never
  // bleeds into the next one.
  function stop() {
    if (delayTimer) { clearTimeout(delayTimer); delayTimer = null; }
    if (audioEl) audioEl.pause();
    setGlow(btnEl, false);
    audioEl = null;
    btnEl = null;
    // Đợt 114 — cancel any clip still being FETCHED. Without this, stop() only
    // silenced what had already arrived: a clip whose getVoiceClip() round-trip
    // (IndexedDB, or Firestore on a cold cache) was still in flight went on to
    // play whenever it landed — bleeding the previous question's word into the
    // next one, and, when cleanup() was the caller, playing a dead game's
    // pronunciation over the next game's intro. Nothing to abort at the network
    // level; we just refuse to start a clip requested before this stop().
    epoch++;
  }

  function start(dataUrl, btn) {
    if (audioEl) { audioEl.pause(); setGlow(btnEl, false); }
    audioEl = new Audio(dataUrl);
    btnEl = btn || null;
    audioEl.addEventListener("ended", () => setGlow(btnEl, false));
    setGlow(btnEl, true);
    audioEl.play().catch(() => setGlow(btnEl, false));   // e.g. autoplay blocked -- fails silently, a tap still works
  }

  function play(clipId, btn) {
    if (!clipId) return;
    const cached = cache.get(clipId);
    if (cached) { start(cached, btn); return; }
    const myEpoch = epoch;
    getVoiceClip(clipId).then(clip => {
      if (!clip || !clip.audio) return;
      cache.set(clipId, clip.audio);          // keep the download either way -- it is still valid next time
      if (myEpoch !== epoch) return;          // stop() happened while this was loading (see stop)
      start(clip.audio, btn);
    }).catch(() => { /* no pronunciation audio -- not fatal, the game plays on without it */ });
  }

  // Tap handler: playing -> stop; anything else (stopped, or a fresh
  // question's first play) -> (re)play from the top.
  function toggle(clipId, btn) {
    if (audioEl && btnEl === btn && !audioEl.paused) { stop(); return; }
    play(clipId, btn);
  }

  // `delayMs` lets the caller hold off the FIRST question's auto-play until
  // its own "Play" intro chime has finished (0 = play immediately, the
  // normal case for every question after the first).
  function playDelayed(clipId, btn, delayMs) {
    if (delayTimer) { clearTimeout(delayTimer); delayTimer = null; }
    if (!delayMs) { play(clipId, btn); return; }
    delayTimer = setTimeout(() => { delayTimer = null; play(clipId, btn); }, delayMs);
  }

  return { play, playDelayed, toggle, stop };
}
