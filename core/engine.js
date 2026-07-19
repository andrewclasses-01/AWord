// =============================================================
// ENGINE — shared game controller (Wordwall style). 100% English UI.
//
// Game lifecycle:
//   1. READY screen (dark): template type on top, big lesson TITLE, giant
//      PLAY button, instruction below. Nothing starts until PLAY is clicked.
//   2. Game runs: timer top-left, score (✓ n) top-right,
//      bottom bar [☰ menu] ◁ "x of N" ▷ [🔊] [⛶].
//   3. Finish -> "Game complete" + confetti + fanfare, then the dark SUMMARY,
//      then ANDREW LEADERBOARD (type your name, Ok, Show answers, Back).
//   4. Start again -> back to the READY screen.
//
// Fullscreen letterboxes the 16:9 stage (keeps ratio, just zooms).
// Results (incl. per-question review) are saved to the local leaderboard.
// =============================================================

import { getTemplate } from "./registry.js";
import { computeResult } from "./scoring.js";
import { buildStage } from "./layout.js";
import { formatTime, el, ordinal, fmtSecsParts } from "./utils.js";
import { icons } from "./icons.js";
import { sound } from "./sound.js";
import { confettiBurst } from "./confetti.js";
import { addEntry, getEntries, getRank, updateName } from "./leaderboard.js";
import { saveActivity } from "./store.js";
import { TEMPLATES } from "./catalog.js";
import { fitOnce } from "./fit.js";
import { THEMES, loadTheme } from "./themes/manifest.js";
import { makeNumberStepper } from "./numberstepper.js";
import { openPrintPopup } from "./print.js";

// The full list of games (for the Template panel). Only entries whose `type`
// matches a template already built (registered) are clickable; the rest show
// "coming soon". Update this list as templates/<name>/ get built.
// Shared list of act types (single source of truth: core/catalog.js).
const ALL_TEMPLATES = TEMPLATES;

// Preview colors for the Style panel swatches (kept in sync with core/themes/*.css).
const THEME_SWATCH = {
  classic:   "linear-gradient(135deg, #ffffff 50%, #2f7bff 50%)",
  basic:     "linear-gradient(135deg, #ffffff 50%, #17255a 50%)",
  classroom: "linear-gradient(135deg, #fbf4e6 50%, #2f6b4f 50%)",
  beach:     "linear-gradient(135deg, #fdf8ec 50%, #17a3b8 50%)"
};

export function startGame(root, activity, { onExit } = {}) {
  root.innerHTML = "";

  const tpl = getTemplate(activity.type);
  const { page, stage, inner, below } = buildStage(activity.theme || "classic");

  // ----- Top bar (timer left · score right) -----
  const topbar = el("div", "aw-topbar");
  const timerEl = el("span", "aw-top-timer", "0:00");
  const scoreEl = el("span", "aw-top-score", `${icons.check} 0`);
  topbar.append(timerEl, scoreEl);

  // ----- Play area -----
  const playArea = el("div", "aw-playarea");

  // ----- Bottom bar -----
  const bottombar = el("div", "aw-bottombar");
  const menuBtn = iconBtn("aw-iconbtn", icons.menu, "Menu");
  const navWrap = el("div", "aw-nav");
  const navPrev = iconBtn("aw-navbtn", icons.prev, "Previous");
  const navLabel = el("span", "aw-nav-label", "");
  const navNext = iconBtn("aw-navbtn", icons.next, "Next");
  navWrap.append(navPrev, navLabel, navNext);
  const rightTools = el("div", "aw-tools");
  const soundBtn = iconBtn("aw-iconbtn", sound.isMuted() ? icons.soundOff : icons.soundOn, "Sound");
  soundBtn.classList.toggle("is-off", sound.isMuted());
  const fsBtn = iconBtn("aw-iconbtn", icons.fullscreen, "Fullscreen");
  rightTools.append(soundBtn, fsBtn);
  bottombar.append(menuBtn, navWrap, rightTools);

  inner.append(topbar, playArea, bottombar);

  // ----- Below the stage: TITLE (left) · Options/Template/Style (center) ·
  // Edit/Assignment/Print (right) -----
  // The specific game title sits on the SAME row as the tool buttons (the
  // instruction line under the stage was removed per the teacher's request).
  const belowLeft = el("div", "aw-below-left");
  belowLeft.append(el("div", "aw-below-title", escapeText(activity.title || "")));

  const belowCenter = el("div", "aw-below-center");
  const optionsBtn = toolBtn(icons.options, "Options");
  const templateBtn = toolBtn(icons.template, "Template");
  const styleBtn = toolBtn(icons.style, "Style");
  belowCenter.append(optionsBtn, templateBtn, styleBtn);

  const belowRight = el("div", "aw-below-right");
  const editBtn = toolBtn(icons.edit, "Edit", true);
  const assignBtn = toolBtn(icons.assignment, "Set assignment", true);
  const printBtn = toolBtn(icons.print, "Print", true);
  const homeBtn = toolBtn(icons.home, "Home", true);
  belowRight.append(editBtn, assignBtn, printBtn, homeBtn);
  homeBtn.onclick = () => { sound.click(); cleanupAll(); onExit?.(); };
  editBtn.onclick = () => {
    sound.click();
    if (!tpl.edit) { toast("Edit — coming soon"); return; }
    // Leave the game, open this game's editor. Save -> store + replay with the
    // new content; Cancel -> replay the original untouched.
    cleanupAll();
    tpl.edit(root, activity, {
      onSave: async updated => { const saved = await saveActivity(updated); startGame(root, saved, { onExit }); },
      onCancel: () => startGame(root, activity, { onExit })
    });
  };
  assignBtn.onclick = () => { sound.click(); toast("Set assignment — coming soon"); };
  // Print opens a popup to pick a worksheet FORMAT (Anagram/Crossword/Quiz/
  // Unjumble) — the whole flow lives in core/print.js (generic, template-agnostic).
  printBtn.onclick = () => { sound.click(); openPrintPopup(activity); };

  below.append(belowLeft, belowCenter, belowRight);

  function toolBtn(svg, title, small) {
    const b = el("button", "aw-toolbtn" + (small ? " aw-toolbtn-sm" : ""), svg);
    b.type = "button"; b.title = title; b.setAttribute("aria-label", title);
    return b;
  }

  root.append(page);

  // ----- READY screen (template type · big title · PLAY · instruction) -----
  const playOverlay = el("div", "aw-play-overlay");
  playOverlay.append(el("div", "aw-ready-type", "ANDREW CLASSES"));   // brand on top
  const readyCenter = el("div", "aw-ready-center");
  if (activity.title) readyCenter.append(el("div", "aw-ready-title", escapeText(activity.title).toUpperCase()));
  const bigPlay = el("button", "aw-bigplay", icons.playBig);
  bigPlay.type = "button"; bigPlay.title = "Play"; bigPlay.setAttribute("aria-label", "Play");
  readyCenter.append(bigPlay);
  // below the play button: the GAME (template) name, big & bold (replaces the instruction line)
  readyCenter.append(el("div", "aw-ready-game", escapeText(tpl.name || activity.type).toUpperCase()));
  playOverlay.append(readyCenter);
  inner.append(playOverlay);

  bigPlay.onclick = () => {
    bigPlay.disabled = true;
    sound.start();                              // startup chime
    playOverlay.style.pointerEvents = "none";   // never block the game, even if the fade stalls
    let removed = false;
    const removeOverlay = () => { if (removed) return; removed = true; playOverlay.remove(); };
    const fade = playOverlay.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, easing: "ease", fill: "forwards" });
    fade.onfinish = removeOverlay;
    setTimeout(removeOverlay, 350);   // fallback: a backgrounded/hidden tab can stall animation events
    begin();
  };

  // ----- Timer (starts at PLAY, measured precisely) -----
  // Modes (set via the Options panel): "none" | "countUp" | "countDown".
  // Count down auto-submits the game when it reaches 0.
  let timerId = null, startedAt = 0, cleanup = () => {};
  function timerMode() { return activity.options?.timer ?? "countUp"; }
  function timerTotal() { return activity.options?.timerTotalSeconds ?? 120; }
  timerEl.style.visibility = timerMode() === "none" ? "hidden" : "visible";

  function begin() {
    startedAt = performance.now();
    timerEl.style.visibility = timerMode() === "none" ? "hidden" : "visible";
    if (timerMode() !== "none") {
      // show the correct value immediately (don't wait for the first 500ms tick)
      timerEl.textContent = timerMode() === "countDown" ? formatTime(timerTotal()) : formatTime(0);
      timerId = setInterval(() => {
        const elapsed = Math.floor((performance.now() - startedAt) / 1000);
        if (timerMode() === "countDown") {
          const remaining = Math.max(0, timerTotal() - elapsed);
          timerEl.textContent = formatTime(remaining);
          if (remaining <= 0) { stopTimer(); submitHandler?.(); }
        } else {
          timerEl.textContent = formatTime(elapsed);
        }
      }, 500);
    }
    cleanup = tpl.mount(playArea, activity, ui) || (() => {});
  }
  const stopTimer = () => { if (timerId) clearInterval(timerId); timerId = null; };

  // ----- Sound / fullscreen buttons -----
  soundBtn.onclick = () => {
    const m = sound.toggle();
    soundBtn.innerHTML = m ? icons.soundOff : icons.soundOn;
    soundBtn.classList.toggle("is-off", m);
  };
  // Fullscreen the PAGE (a letterbox wrapper) so the 16:9 stage keeps its
  // ratio and just zooms — CSS handles the centering + black bars.
  fsBtn.onclick = () => {
    if (!document.fullscreenElement) page.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  // =============================================================
  // OUTER TOOLBAR POPOVERS — Options / Template / Style
  // One at a time: clicking a tool button makes it glow, opens a panel
  // centered under the 3-button cluster, and dims the WHOLE screen
  // (game included) behind it. Click outside (the dim, or elsewhere) closes it.
  // =============================================================
  let toolDim = null, toolPanelEl = null, activeToolBtn = null;

  // fade = true -> animate opacity out before removing (a real user-initiated
  // close: outside click, or toggling the open button again). fade = false ->
  // remove instantly (used when SWITCHING to a different tool button, since a
  // new panel fades in immediately on top — an extra fade-out there would just
  // look like a delay — and on full teardown/restart where no one is watching).
  function closeToolPanel(fade = true) {
    const dim = toolDim, panel = toolPanelEl, btn = activeToolBtn;
    toolDim = null; toolPanelEl = null; activeToolBtn = null;
    document.removeEventListener("pointerdown", onToolOutside);
    if (btn) btn.classList.remove("is-active");
    if (!dim && !panel) return;
    if (!fade) { dim?.remove(); panel?.remove(); return; }
    let done = false;
    const remove = () => { if (done) return; done = true; dim?.remove(); panel?.remove(); };
    const fadeOpts = { duration: 150, easing: "ease", fill: "forwards" };
    const a = dim?.animate([{ opacity: 1 }, { opacity: 0 }], fadeOpts);
    panel?.animate([{ opacity: 1 }, { opacity: 0 }], fadeOpts);
    if (a) a.onfinish = remove;
    setTimeout(remove, 220);   // fallback (a hidden/backgrounded tab can stall animation events)
  }
  function onToolOutside(ev) {
    if (!toolPanelEl) return;
    if (toolPanelEl.contains(ev.target)) return;
    if (belowCenter.contains(ev.target)) return;   // the 3 buttons themselves toggle via their own onclick
    closeToolPanel(true);
  }
  function openToolPanel(btn, buildContent) {
    if (activeToolBtn === btn) { closeToolPanel(true); return; }   // clicking the open one again closes it
    closeToolPanel(false);   // switching tools: drop the old one instantly, new one fades in
    sound.click();
    toolDim = el("div", "aw-tool-dim");
    toolDim.onclick = () => closeToolPanel(true);
    document.body.append(toolDim);
    toolPanelEl = el("div", "aw-tool-panel");
    buildContent(toolPanelEl);
    belowCenter.append(toolPanelEl);
    btn.classList.add("is-active");
    activeToolBtn = btn;
    setTimeout(() => document.addEventListener("pointerdown", onToolOutside), 0);
  }

  optionsBtn.onclick = () => openToolPanel(optionsBtn, buildOptionsPanel);
  templateBtn.onclick = () => openToolPanel(templateBtn, buildTemplatePanel);
  styleBtn.onclick = () => openToolPanel(styleBtn, buildStylePanel);

  // ----- OPTIONS panel: real controls, DRAFT model -----
  // Edits go into a local `draft` copy first. Nothing is saved to
  // activity.options until "Apply" is pressed; clicking outside (or
  // switching to another tool) without pressing Apply discards the draft.
  function buildOptionsPanel(panel) {
    const base = activity.options || {};
    const draft = { ...base };

    panel.append(el("div", "aw-tool-panel-head", "Options"));

    // TIMER
    const gTimer = el("div", "aw-opt-group");
    gTimer.append(el("div", "aw-opt-label", "Timer"));
    const timerRow = el("div", "aw-opt-row");
    const mkRadio = (value, label) => {
      const wrap = el("label", "aw-opt-choice");
      const r = el("input"); r.type = "radio"; r.name = "aw-timer"; r.value = value;
      r.checked = (draft.timer ?? "countUp") === value;
      r.onchange = () => { draft.timer = value; timeFields.style.display = value === "countDown" ? "inline-flex" : "none"; };
      wrap.append(r, document.createTextNode(label));
      return wrap;
    };
    timerRow.append(mkRadio("none", "None"), mkRadio("countUp", "Count up"), mkRadio("countDown", "Count down"));
    gTimer.append(timerRow);

    // countdown minutes/seconds — swipe-to-adjust steppers (drag the number up/down)
    const timeFields = el("span", "aw-opt-time");
    const total = draft.timerTotalSeconds ?? 120;
    const mm = makeNumberStepper(Math.floor(total / 60), 0, 59, v => { draft.timerTotalSeconds = v * 60 + ss.get(); });
    const ss = makeNumberStepper(total % 60, 0, 59, v => { draft.timerTotalSeconds = mm.get() * 60 + v; });
    timeFields.append(mm.el, document.createTextNode("m"), ss.el, document.createTextNode("s"));
    timeFields.style.display = (draft.timer ?? "countUp") === "countDown" ? "inline-flex" : "none";
    timerRow.append(timeFields);
    panel.append(gTimer);

    // RANDOM
    const gRandom = el("div", "aw-opt-group");
    gRandom.append(el("div", "aw-opt-label", "Random"));
    const rowRandom = el("div", "aw-opt-row");
    rowRandom.append(
      mkCheck(draft.shuffleQuestions !== false, "Shuffle question order", v => draft.shuffleQuestions = v),
      mkCheck(draft.shuffleAnswers !== false, "Shuffle answer order", v => draft.shuffleAnswers = v)
    );
    gRandom.append(rowRandom);
    panel.append(gRandom);

    // END OF GAME
    const gEnd = el("div", "aw-opt-group");
    gEnd.append(el("div", "aw-opt-label", "End of game"));
    const rowEnd = el("div", "aw-opt-row");
    rowEnd.append(mkCheck(draft.showAnswers !== false, "Show answers", v => draft.showAnswers = v));
    gEnd.append(rowEnd);
    panel.append(gEnd);

    // LETTERS ON ANSWERS
    const gLet = el("div", "aw-opt-group");
    gLet.append(el("div", "aw-opt-label", "Letters on answers"));
    const rowLet = el("div", "aw-opt-row");
    const mkRadioLet = (value, label) => {
      const wrap = el("label", "aw-opt-choice");
      const r = el("input"); r.type = "radio"; r.name = "aw-letters"; r.value = value;
      r.checked = (draft.lettersOnAnswers ?? "none") === value;
      r.onchange = () => { draft.lettersOnAnswers = value; };
      wrap.append(r, document.createTextNode(label));
      return wrap;
    };
    rowLet.append(mkRadioLet("abc", "A, B, C"), mkRadioLet("none", "None"));
    gLet.append(rowLet);
    panel.append(gLet);

    panel.append(el("div", "aw-opt-hint",
      playOverlay.isConnected ? "Timer & shuffle apply when you press Play." : "Timer & shuffle apply next time you press Start again."));

    // APPLY — only now does the draft get written into activity.options.
    // Clicking outside without pressing this discards every change above.
    const applyWrap = el("div", "aw-opt-apply-wrap");
    const applyBtn = el("button", "aw-btn aw-btn-primary aw-opt-apply", "Apply");
    applyBtn.type = "button";
    applyBtn.onclick = () => {
      sound.click();
      if (!activity.options) activity.options = {};
      Object.assign(activity.options, draft);
      timerEl.style.visibility = timerMode() === "none" ? "hidden" : "visible";
      // Persist these options for THIS act only (per-act override of the
      // Settings defaults). Safe no-op if the act isn't in the store yet.
      if (activity.id) saveActivity(activity);
      toast("Options applied");
      closeToolPanel(true);
    };
    applyWrap.append(applyBtn);
    panel.append(applyWrap);

    function mkCheck(checked, label, onChange) {
      const wrap = el("label", "aw-opt-choice");
      const c = el("input"); c.type = "checkbox"; c.checked = checked;
      c.onchange = () => onChange(c.checked);
      wrap.append(c, document.createTextNode(label));
      return wrap;
    }
  }

  // ----- TEMPLATE panel: switch games (only built templates are clickable) -----
  function buildTemplatePanel(panel) {
    panel.append(el("div", "aw-tool-panel-head", "Template"));
    const grid = el("div", "aw-tpl-grid");
    ALL_TEMPLATES.forEach(t => {
      const isCurrent = t.type === activity.type;
      const item = el("div", "aw-tpl-item" + (isCurrent ? " is-current" : " is-soon"), escapeText(t.label));
      if (!isCurrent) {
        item.onclick = () => { sound.click(); toast(`${t.label} — coming soon`); };
      }
      grid.append(item);
    });
    panel.append(grid);
  }

  // ----- STYLE panel: switch themes LIVE (no restart needed) -----
  function buildStylePanel(panel) {
    panel.append(el("div", "aw-tool-panel-head", "Style"));
    const grid = el("div", "aw-style-grid");
    THEMES.forEach(t => {
      const item = el("button", "aw-style-item" + (t.id === activity.theme ? " is-active" : ""));
      item.type = "button";
      const swatch = el("span", "aw-style-swatch");
      swatch.style.background = THEME_SWATCH[t.id] || "#ccc";
      item.append(swatch, el("span", "aw-style-name", t.label));
      item.onclick = () => {
        sound.click();
        loadTheme(t.id);
        stage.classList.forEach(c => { if (c.startsWith("theme-")) stage.classList.remove(c); });
        stage.classList.add(`theme-${t.id}`);
        activity.theme = t.id;
        grid.querySelectorAll(".aw-style-item").forEach(x => x.classList.remove("is-active"));
        item.classList.add("is-active");
      };
      grid.append(item);
    });
    panel.append(grid);
  }

  // ----- Menu (Submit answers · Start again · Resume · Change template) -----
  let submitHandler = null;
  let menuEl = null;
  menuBtn.onclick = () => (menuEl ? closeMenu() : openMenu());

  function onMenuOutside(ev) {
    if (menuEl && !menuEl.contains(ev.target) && !menuBtn.contains(ev.target)) closeMenu();
  }
  function openMenu() {
    menuEl = el("div", "aw-menu");
    menuEl.append(
      menuItem("Submit answers", () => { closeMenu(); submitHandler?.(); }),
      menuItem("Start again", restart),
      menuItem("Resume", closeMenu),
      menuItem("Change template", () => { closeMenu(); toast("Template switching — coming soon"); })
    );
    inner.append(menuEl);
    // clicking anywhere else closes the menu (deferred so the opening click doesn't trigger it)
    setTimeout(() => document.addEventListener("pointerdown", onMenuOutside), 0);
  }
  function closeMenu() {
    if (menuEl) { menuEl.remove(); menuEl = null; document.removeEventListener("pointerdown", onMenuOutside); }
  }
  function menuItem(label, action) {
    const b = el("button", "aw-menu-item", label);
    b.type = "button";
    b.onclick = () => { sound.click(); action(); };
    return b;
  }

  function restart() { cleanupAll(); startGame(root, activity, { onExit }); }
  function cleanupAll() { stopTimer(); closeMenu(); closeToolPanel(false); cleanup(); }

  // ----- Small toast message -----
  function toast(msg) {
    const t = el("div", "aw-toast", escapeText(msg));
    inner.append(t);
    setTimeout(() => t.remove(), 2200);
  }

  // ----- API handed to the template -----
  const ui = {
    playArea,
    setScore(n) { scoreEl.innerHTML = `${icons.check} ${n}`; },
    setNav({ index, total, onPrev = null, onNext = null, nextLabel = null }) {
      navLabel.textContent = `${index} of ${total}`;
      wireNav(navPrev, onPrev);
      wireNav(navNext, onNext);
      navNext.innerHTML = nextLabel ? nextLabel : icons.next;
      navNext.classList.toggle("is-finish", !!nextLabel);
    },
    onSubmit(fn) { submitHandler = fn; },
    sound,
    toast,
    finish(raw) {
      stopTimer();
      const timeMs = Math.round(performance.now() - startedAt);
      const result = computeResult(raw, timeMs / 1000);
      result.timeMs = timeMs;
      reviewData = raw.review || [];   // kept in memory for "Show answers"
      // Don't add to the leaderboard if the player answered NO question.
      const answered = raw.answered != null ? raw.answered : reviewData.filter(r => r.answered).length;
      let entryId = null;
      if (answered > 0) {
        // stored (incl. review) so it can sync later and students can compete.
        entryId = addEntry(activity.id, {
          name: "Player", score: result.correct, total: result.total, timeMs, review: raw.review || null
        });
      }
      celebrate(result, entryId);
    }
  };

  function wireNav(btn, handler) {
    btn.onclick = handler || null;
    btn.disabled = !handler;
  }

  // =============================================================
  // GAME COMPLETE — celebration, then the dark panels
  // =============================================================
  function celebrate(result, entryId) {
    navWrap.style.visibility = "hidden";
    const cover = el("div", "aw-celebrate");
    const text = el("div", "aw-gc-text", "Game complete");
    cover.append(text);
    inner.append(cover);
    confettiBurst(cover);
    sound.fanfare();
    setTimeout(() => {
      text.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: "forwards" });
      setTimeout(() => { cover.remove(); showSummary(result, entryId); }, 300);
    }, 1900);
  }

  // ----- Dark modal panels -----
  let backdrop = null;
  let reviewData = [];   // this play's per-question review (for "Show answers")
  function openBackdrop() {
    if (!backdrop) { backdrop = el("div", "aw-backdrop"); inner.append(backdrop); }
    backdrop.innerHTML = "";
    return backdrop;
  }

  function showSummary(result, entryId) {
    const bd = openBackdrop();
    const panel = el("div", "aw-panel");
    panel.append(el("div", "aw-panel-head", "GAME COMPLETE"));

    const stats = el("div", "aw-sum-stats");
    const t = fmtSecsParts(result.timeMs);
    stats.append(
      statBlock("Score", `${result.correct}`, `/${result.total}`),
      statBlock("Time", t.big, t.small)
    );
    panel.append(stats);

    const rank = getRank(activity.id, entryId);
    if (rank) panel.append(el("div", "aw-panel-rank", `YOU'RE ${ordinal(rank)} ON THE LEADERBOARD`));

    const items = el("div", "aw-panel-items");
    items.append(panelItem("Leaderboard", () => showLeaderboard(result, entryId)));
    if (reviewData.length && activity.options?.showAnswers !== false) {
      items.append(panelItem("Show answers", () => showReview(result, entryId)));
    }
    items.append(
      panelItem("Start again", restart),
      panelItem("Play a different template", () => toast("Template switching — coming soon"))
    );
    panel.append(items);
    bd.append(panel);
  }

  function showLeaderboard(result, entryId) {
    const bd = openBackdrop();
    const panel = el("div", "aw-panel aw-panel-wide");
    panel.append(el("div", "aw-panel-head", "ANDREW CLASSES"));

    const table = el("div", "aw-lb-table");
    const entries = getEntries(activity.id).slice(0, 10);
    let nameInput = null;
    entries.forEach((e, i) => {
      const row = el("div", "aw-lb-row" + (e.id === entryId ? " is-you" : ""));
      row.append(el("span", "aw-lb-rank", ordinal(i + 1).toLowerCase()));
      if (e.id === entryId) {
        nameInput = el("input", "aw-lb-name-input");
        nameInput.value = e.name;
        nameInput.maxLength = 20;
        nameInput.oninput = () => updateName(activity.id, e.id, nameInput.value.trim() || "Player");
        // press Enter to confirm the name (same as the Ok button)
        nameInput.onkeydown = ev => {
          if (ev.key === "Enter") {
            sound.click();
            updateName(activity.id, e.id, nameInput.value.trim() || "Player");
            nameInput.blur();
            toast("Name saved");
          }
        };
        const wrap = el("span", "aw-lb-name");
        wrap.append(nameInput);
        row.append(wrap);
      } else {
        row.append(el("span", "aw-lb-name", escapeText(e.name)));
      }
      const tp = fmtSecsParts(e.timeMs);
      row.append(
        el("span", "aw-lb-score", `${e.score}/${e.total}`),
        el("span", "aw-lb-time", `${tp.big}${tp.small}`)
      );
      table.append(row);
    });
    panel.append(table);

    const items = el("div", "aw-panel-items aw-panel-items-row");
    // Ok = confirm/save the typed name
    items.append(panelItem("Ok", () => {
      if (nameInput) updateName(activity.id, entryId, nameInput.value.trim() || "Player");
      toast("Name saved");
    }));
    items.append(panelItem("Back", () => showSummary(result, entryId)));
    panel.append(items);
    bd.append(panel);

    nameInput?.focus();
    nameInput?.select();
  }

  // =============================================================
  // SHOW ANSWERS — full 16:9 review: question | your answer | correct answer
  // =============================================================
  function showReview(result, entryId) {
    if (backdrop) backdrop.innerHTML = "";   // hide the panel behind
    const rv = el("div", "aw-review");
    const head = el("div", "aw-rv-head");
    head.append(el("div", "aw-rv-title", "ANSWERS"));
    const closeBtn = iconBtn("aw-rv-close", icons.close, "Close");
    closeBtn.onclick = () => { rv.remove(); showSummary(result, entryId); };
    head.append(closeBtn);
    rv.append(head);

    const list = el("div", "aw-rv-list");
    reviewData.forEach((r, i) => {
      const rowEl = el("div", "aw-rv-row");
      rowEl.append(cell("aw-rv-q", `${i + 1}. ${r.question}`, null));   // numbered question
      if (r.answered && r.yourCorrect) {
        // correct -> ONE wide box (spans both answer columns)
        rowEl.append(cell("aw-rv-a is-correct aw-rv-span", r.correctText, icons.check));
      } else {
        // your answer (wrong or none) + the correct answer
        if (!r.answered) rowEl.append(cell("aw-rv-a is-none", "No answer", null));
        else rowEl.append(cell("aw-rv-a is-wrong", r.yourText, icons.cross));
        rowEl.append(cell("aw-rv-a is-correct", r.correctText, icons.check));
      }
      list.append(rowEl);
    });
    rv.append(list);
    inner.append(rv);

    // Questions use ONE fixed size (CSS) — long ones wrap and grow the row height
    // (answer boxes stretch to match). Only the answer text auto-shrinks to fit
    // its now-narrower box.
    rv.querySelectorAll(".aw-rv-a").forEach(box => {
      const span = box.querySelector(".aw-rv-fit");
      fitOnce(box, span, s => span.style.setProperty("--fit", s), { max: 1, min: 0.35, slack: 2 });
    });
  }

  function cell(cls, text, mark) {
    const c = el("div", "aw-rv-cell " + cls);
    const inner2 = el("span", "aw-rv-fit");
    if (mark) inner2.append(el("span", "aw-rv-mark", mark));
    inner2.append(el("span", "aw-rv-txt", escapeText(text || "")));
    c.append(inner2);
    return c;
  }

  function statBlock(label, big, small) {
    const b = el("div", "aw-sum-stat");
    b.append(
      el("div", "aw-sum-label", label),
      el("div", "aw-sum-value", `${escapeText(big)}<span>${escapeText(small)}</span>`)
    );
    return b;
  }
  function panelItem(label, action) {
    const b = el("button", "aw-panel-item", label);
    b.type = "button";
    b.onclick = () => { sound.click(); action(); };
    return b;
  }
}

function iconBtn(cls, svg, title) {
  const b = el("button", cls, svg);
  b.type = "button";
  b.title = title;
  b.setAttribute("aria-label", title);
  return b;
}

function escapeText(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
