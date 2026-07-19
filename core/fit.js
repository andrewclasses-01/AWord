// =============================================================
// FIT — auto-shrink text so a game's content always fits inside the
// 16:9 stage (no clipping, no scrollbars), the way Wordwall does.
//
// HOW IT WORKS: the content element exposes a CSS variable (e.g. --fit)
// that multiplies its font sizes, e.g.
//     .aw-quiz-question { font-size: calc(clamp(20px,4vw,52px) * var(--fit,1)); }
// This module binary-searches the largest `--fit` (<= 1) at which the
// content still fits its box, and applies it.
//
// IMPORTANT — measuring "needed height":
//   scrollHeight can't be used directly: when a card is stretched to
//   height:100% of its box, scrollHeight == clientHeight even if the real
//   content is much smaller, so the search would always think it overflows.
//   Pass a `measure()` that returns the TRUE content height (e.g. the sum of
//   the card's children). Default is content.scrollHeight, which is correct
//   only for content that is NOT height-stretched.
//
// USE IT for any template whose text can be long (Quiz question/answers,
// Anagram clues, Find-the-match options, etc). Returns a controller with
// .refit() (call on content change) and .destroy() (call in cleanup()).
// =============================================================

// One-shot fit (no resize listener) — for many small cells like a review grid,
// where adding a listener per cell would be wasteful. Shrinks the content's
// font (via `apply`) until it fits `box`. Uses scrollHeight, so `content`
// must NOT be height-stretched (a plain inline/block child of a sized box is fine).
export function fitOnce(box, content, apply, { min = 0.3, max = 1, steps = 12, slack = 1 } = {}) {
  const over = () => content.scrollHeight > box.clientHeight - slack || content.scrollWidth > box.clientWidth - slack;
  apply(max);
  if (!over()) return max;
  let lo = min, hi = max, best = min;
  for (let i = 0; i < steps; i++) {
    const mid = (lo + hi) / 2;
    apply(mid);
    if (over()) hi = mid; else { best = mid; lo = mid; }
  }
  apply(best);
  return best;
}

export function autoFit(box, content, apply, opts = {}) {
  const {
    min = 0.4, max = 1, steps = 14, slack = 2,
    // slack = extra vertical breathing room to keep free (px), e.g. for a 3D
    // box-shadow "lip" that isn't in layout height but would be clipped.
    measure = () => content.scrollHeight
  } = opts;

  // Height is the real constraint for a fixed-aspect (16:9) stage; long words
  // wrap horizontally via CSS, so we only fit on HEIGHT.
  const overflows = () => measure() > box.clientHeight - slack;

  function fit() {
    apply(max);
    if (!overflows()) return max;
    let lo = min, hi = max, best = min;
    for (let i = 0; i < steps; i++) {
      const mid = (lo + hi) / 2;
      apply(mid);
      if (overflows()) hi = mid; else { best = mid; lo = mid; }
    }
    apply(best);
    return best;
  }

  // Run now, and again once the web font finishes loading (its metrics differ
  // from the fallback font, which would otherwise mis-measure).
  fit();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit).catch(() => {});

  // Re-fit when the stage resizes (the 16:9 box scales with the window).
  let raf = 0;
  const onResize = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(fit); };
  window.addEventListener("resize", onResize);

  return {
    refit: fit,
    destroy() { window.removeEventListener("resize", onResize); cancelAnimationFrame(raf); }
  };
}
