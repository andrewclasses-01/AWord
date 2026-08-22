// =============================================================
// RECENT RESULTS — DOWNLOAD (Đợt 227, 22/8/2026)
//
// The little popup opened by the new download button in the detail view's
// header (core/showdown-setup.js's openDetail, between the Ranking toggle and
// Back — teacher: "nút này sẽ nằm giữa nút Ranking và nút back"). Lets the
// teacher pick RANKING or DETAILS, type a title (class · act · date), see a
// preview, and export:
//   RANKING -> one square PNG, the whole funnel + every pupil, no tick boxes.
//              Drawn with RAW CANVAS 2D CALLS (fillRect/roundRect/fillText),
//              not a DOM screenshot — see the PNG section below for why: the
//              obvious DOM-to-image trick (SVG foreignObject -> img -> canvas)
//              taints the canvas in Chromium even same-origin, discovered by
//              actually running this against a real class list, not assumed.
//   DETAILS -> a portrait A4 PDF via the browser's own print-to-PDF, same
//              idiom as core/print.js and templates/running-team/rt-print.js
//              (no PDF library anywhere in this app — a `.aw-print-sheet` is
//              hidden on screen and revealed only inside @media print).
//
// ⚠️ Pupil names, class/act/date text and every answer are the teacher's or
// a pupil's own words — they go in through `.textContent` ONLY, exactly the
// rule core/showdown-review.js states at its own top. The one exception is
// `mark()`'s icon glyph, which is trusted markup from core/icons.js. The rank
// sheet's medal/check/cross are plain "🥇"/"✓"/"✗" characters rather than
// this app's SVG icons — canvas `fillText` draws characters, not markup, so
// an SVG icon has no meaning there; the DETAILS sheet keeps the real icons
// since it is rendered by the browser itself, not through a canvas.
// =============================================================

import { el } from "./utils.js";
import { icons } from "./icons.js";
import { sound } from "./sound.js";
import { pctOf, pctBand, shortenName, fmtRoundMs, buildAnalysisRows } from "./showdown.js";
import { fitPodiumNames } from "./showdown-review.js";

const PCT_COLOR = { "is-p0": "#dc2626", "is-p1": "#ca8a04", "is-p2": "#ea580c", "is-p3": "#2563eb", "is-p4": "#16a34a" };
function pctColor(pct) { return PCT_COLOR[pctBand(pct)] || "#23303e"; }

const TIER_BG = [
  "linear-gradient(100deg, #fff7db, #ffe8a3)",
  "linear-gradient(100deg, #f8fafd, #e5ebf2)",
  "linear-gradient(100deg, #fdf0e4, #f6dcc2)",
];
// The SAME three gradients as CSS colour-stop pairs, for the canvas exporter
// (`CanvasGradient` takes stops, not a CSS string — see rankPngBlob's own note
// on why the PNG is drawn with raw Canvas 2D calls rather than reusing the DOM
// sheet below).
const TIER_BG_STOPS = [
  ["#fff7db", "#ffe8a3"],
  ["#f8fafd", "#e5ebf2"],
  ["#fdf0e4", "#f6dcc2"],
];
const TIER_BORDER = ["#efc03c", "#c3ced9", "#dda56a"];
const TIER_BADGE_COLOR = ["#e0a30c", "#97a4b2", "#c1793a"];
const MEDAL = ["🥇", "🥈", "🥉"];
// Same taper as core/showdown-review.js's POD_MAX_W/POD_MIN_W, kept as its own
// copy: this sheet is drawn in plain px, never `cqw`, so it has no business
// importing a pair of numbers that file documents as "a share of the
// container" — see that file's own note on why two copies of *these two
// numbers* is fine while everything else stays imported.
const POD_MAX_W = 80, POD_MIN_W = 52;
function taperPct(i, n) { return n > 1 ? POD_MAX_W - (POD_MAX_W - POD_MIN_W) * (i / (n - 1)) : POD_MAX_W; }

function fmtDate(ms) {
  const d = new Date(Number(ms) || Date.now());
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

function safeFileBit(s) {
  return String(s || "Showdown").trim().replace(/[\\/:*?"<>|]+/g, "-").slice(0, 80) || "Showdown";
}

// ---------------------------------------------------------------
// BRANDING LINE — Đợt 235 (teacher, 22/8/2026: "thêm dòng ANDREW CLASSES
// mỏng, mờ, size vừa nhỏ và ở bên trên cùng, căn giữa... của mọi nội dung
// show (kể cả các dạng file xuất) trong showdown"). Scope thầy chốt qua
// AskUserQuestion: the big real boards and the real exported files, NOT the
// small Recent Results match cards or the shrunk-down popup preview.
// ONE literal string, two renderers (DOM for buildDetailsContent/
// buildRankSheet, canvas for rankPngBlob/drawAnalysisCanvas) — every surface
// still picks its OWN size, since a print sheet's mm-based 9px world and a
// 1000px-square canvas have nothing in common to inherit from.
// ---------------------------------------------------------------
const BRAND_TEXT = "ANDREW CLASSES";

function brandingLineEl(fontSizePx, marginBottomPx) {
  const b = el("div");
  b.style.cssText = `text-align:center;font-weight:700;letter-spacing:.14em;` +
    `font-size:${fontSizePx}px;color:#b3bcc9;margin-bottom:${marginBottomPx}px;`;
  b.textContent = BRAND_TEXT;
  return b;
}

function drawBrandingCanvas(ctx, width, y, fontSizePx) {
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#b3bcc9";
  // canvas has no `letter-spacing`; fake it by hand — this string is short
  // and fixed, so measuring+walking it per-call costs nothing worth caching.
  ctx.font = `700 ${fontSizePx}px ${FONT_STACK}`;
  const tracked = BRAND_TEXT.split("").join("   ");
  ctx.fillText(tracked, width / 2, y);
  ctx.restore();
}

/** Icon + textContent, never icon + raw text in the same innerHTML — the same
 *  split core/showdown-review.js's own `mark()` uses, duplicated here rather
 *  than imported because that one is wired to `.aw-sd-rv-mk*`'s CSS and this
 *  sheet's classes are its own. */
function mark(cls, glyph, text) {
  const box = el("div", "aw-exp-mk " + cls);
  const txt = el("span", "aw-exp-mktxt");
  txt.textContent = String(text || "");
  box.append(el("span", "aw-exp-mkicon", glyph), txt);
  return box;
}

/** Run `anim`, and guarantee `after()` happens even if onfinish never fires
 *  (a backgrounded myActivity column freezes rAF — same rule as every other
 *  Showdown screen). */
function whenDone(anim, after, ms) {
  let done = false;
  const settle = () => {
    if (done) return;
    done = true;
    try { anim.cancel(); } catch { /* already gone */ }
    after();
  };
  anim.onfinish = settle;
  setTimeout(settle, ms);
}

// ---------------------------------------------------------------
// THE RANK SHEET — a self-contained, inline-styled square board.
// ---------------------------------------------------------------
// Built once, used both for the live preview (scaled down with a CSS
// `transform`) and for the final PNG (rasterised 1:1 through a canvas).
// Nothing here reads from app.css: a canvas rasteriser only sees what is
// physically IN the node, so every size and colour that matters is inline.
//
// ⭐ THE ROW HEIGHT IS CHOSEN, NOT MEASURED — the same idea
// templates/running-team/rt-print.js's `metrics()` uses for a printed sheet:
// decide the row height from the pupil COUNT and a target square size, rather
// than build first and see what height comes out. A class of 6 gets big
// roomy rows; a class of 40 gets a taller SQUARE (both sides grow together,
// see `SIZE` below) rather than rows so thin nobody could read them.
function computeRankLayout(n) {
  const W = 1000, PAD = 46, TITLE_H = 74, GAP = 10;
  const MIN_ROW_H = 44, MAX_ROW_H = 108;
  let rowH = (W - PAD * 2 - TITLE_H - GAP * (n - 1)) / n;
  rowH = Math.min(MAX_ROW_H, Math.max(MIN_ROW_H, rowH));
  const contentH = PAD * 2 + TITLE_H + rowH * n + GAP * (n - 1);
  const SIZE = Math.max(W, Math.round(contentH));
  // Content shorter than the square: pad top/bottom so it sits centred inside
  // a full SIZE x SIZE square instead of leaving the bottom third blank.
  const vPad = SIZE > contentH ? (SIZE - contentH) / 2 : 0;
  const nameFs = Math.max(15, Math.round(rowH * 0.32));
  const statFs = Math.max(13, Math.round(rowH * 0.26));
  const badgeSize = Math.round(rowH * 0.46);
  return { PAD, TITLE_H, GAP, rowH, SIZE, vPad, nameFs, statFs, badgeSize };
}

function buildRankSheet(ranked, titleText) {
  const n = Math.max(1, ranked.length);
  const { PAD, TITLE_H, GAP, rowH, SIZE, vPad, nameFs, statFs, badgeSize } = computeRankLayout(n);

  const sheet = el("div");
  sheet.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");   // needed once serialised into an <svg>
  sheet.style.cssText = `width:${SIZE}px;height:${SIZE}px;box-sizing:border-box;position:relative;` +
    `padding:${(PAD + vPad).toFixed(1)}px ${PAD}px;background:#ffffff;` +
    `font-family:'Baloo 2','Segoe UI',Arial,sans-serif;`;
  // ⭐ Đợt 235 — absolute, inside the fixed PAD margin above the title band,
  // so it never disturbs computeRankLayout()'s own row-height maths (that
  // function has nothing to do with this line and should stay that way).
  const brand = brandingLineEl(13, 0);
  brand.style.cssText += "position:absolute;top:16px;left:0;right:0;";
  sheet.append(brand);

  const title = el("div");
  title.style.cssText = `text-align:center;font-weight:800;color:#23303e;` +
    `font-size:30px;letter-spacing:.02em;line-height:1.3;margin-bottom:${TITLE_H - 36}px;` +
    `overflow-wrap:break-word;`;
  title.textContent = titleText;                                // teacher's own words: textContent only
  sheet.append(title);

  ranked.forEach((b, i) => {
    const w = taperPct(i, n);
    const tier = i < 3 ? i : -1;

    const rowWrap = el("div");
    rowWrap.style.cssText = `display:flex;justify-content:center;` + (i < n - 1 ? `margin-bottom:${GAP}px;` : "");

    const box = el("div");
    box.style.cssText = `width:${w}%;box-sizing:border-box;height:${rowH}px;` +
      `display:flex;align-items:center;justify-content:space-between;gap:12px;` +
      `padding:0 20px;border-radius:${Math.round(rowH * 0.22)}px;` +
      `background:${tier >= 0 ? TIER_BG[tier] : "#f3f6fa"};` +
      `border:2px solid ${tier >= 0 ? TIER_BORDER[tier] : "#e3e9f1"};`;

    const left = el("div");
    left.style.cssText = "display:flex;align-items:center;gap:10px;min-width:0;flex:1 1 auto;";
    const badge = el("span");
    badge.style.cssText = `flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;` +
      `width:${badgeSize}px;height:${badgeSize}px;font-weight:800;line-height:1;` +
      `font-size:${Math.round(badgeSize * (tier >= 0 ? 0.86 : 0.62))}px;` +
      `color:${tier >= 0 ? TIER_BADGE_COLOR[tier] : "#b3bcc9"};`;
    if (tier >= 0) badge.textContent = MEDAL[tier];
    else badge.textContent = String(i + 1);
    const nm = el("span", "aw-exp-rank-name");
    nm.dataset.full = b.name;
    nm.textContent = b.name;                                     // pupil's own name: textContent only
    nm.style.cssText = `font-weight:800;color:#23303e;font-size:${nameFs}px;` +
      `white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;`;
    left.append(badge, nm);

    const stats = el("div");
    stats.style.cssText = `flex:0 0 auto;display:flex;gap:10px;align-items:center;` +
      `font-weight:800;font-size:${statFs}px;white-space:nowrap;`;
    const ok = el("span");
    ok.style.color = "#2ec27e";
    ok.textContent = `✓ ${b.right}`;
    const bad = el("span");
    bad.style.color = "#e03131";
    bad.textContent = `✗ ${b.wrong}`;
    stats.append(ok, bad);
    const pct = pctOf(b);
    if (pct !== null) {
      const pc = el("span");
      pc.style.color = pctColor(pct);
      pc.textContent = pct + "%";
      stats.append(pc);
    }

    box.append(left, stats);
    rowWrap.append(box);
    sheet.append(rowWrap);
  });

  return { node: sheet, size: SIZE };
}

// ---------------------------------------------------------------
// THE DETAILS CONTENT — reused for the on-screen "paper" preview AND for the
// real print sheet. Portrait, mm-based (see templates/running-team/rt-print.js
// for why: a printed page has no container-query ancestor, so `cqw` would mean
// nothing here — `mm` is the one unit that means the same thing on paper as it
// does in this maths).
// ---------------------------------------------------------------
// ⭐ "tăng khoảng cách từ bạn trước đến bạn sau một chút nữa" (teacher) — the
// on-screen review packs pupils at `1cqw` apart (core/app.css's `.aw-sd-rv`);
// this sheet uses a flat 9mm, several times that share of the page, on purpose.
const DETAIL_BLOCK_GAP_MM = 9;

/** One "label: value" pair in a pupil's stats line. `valueHtml` is always
 *  either a plain number or a number wrapped in a colour `<span>` — never
 *  teacher/pupil text — so `innerHTML` here carries no untrusted content. */
function statEl(label, valueHtml) {
  const s = el("span");
  s.innerHTML = `${label} <b>${valueHtml}</b>`;
  return s;
}

const DETAILS_FONT_STACK = "'Baloo 2','Segoe UI',Arial,sans-serif";
// The one deliberate breathing room in the fit budget below — not measured
// from anything, just "a little" (teacher's own word) kept fixed regardless
// of font size, the same way `.aw-sd-rv-body`'s own `gap` is a flat value on
// screen rather than something that grows with the text inside it.
const DETAILS_COL_GAP_MM = 2;

/** mm → px, asked of the browser rather than assumed — the one thing this
 *  file never hard-codes a DPI constant for anywhere else either. */
function pxOfMm(mm) {
  const probe = el("div");
  probe.style.cssText = `position:fixed;left:-99999px;top:0;width:${mm}mm;`;
  document.body.append(probe);
  const px = probe.offsetWidth;
  probe.remove();
  return px;
}

/** Cheap, approximate, ONLY for picking WHICH row is worst — canvas metrics
 *  slightly under/overcount a mark()'s own icon+padding chrome, which is
 *  exactly why the real fontFitDetails() below re-measures the two winners
 *  with real DOM instead of trusting this number for the final size. */
function rankWidestDetailRows(ranked) {
  const ctx = document.createElement("canvas").getContext("2d");
  ctx.font = `700 10px ${DETAILS_FONT_STACK}`;
  let widestClue = null, widestClueW = -1;
  let widestAns = null, widestAnsW = -1;
  ranked.forEach(b => (b.rows || []).forEach(r => {
    const cw = ctx.measureText(r.question || "").width;
    if (cw > widestClueW) { widestClueW = cw; widestClue = r; }
    const timeTxt = (r.correct && r.roundMs != null) ? fmtRoundMs(r.roundMs).replace(/<[^>]+>/g, "") : "";
    const ansTxt = r.correct
      ? timeTxt + (r.correctText || "")
      : (r.answered ? (r.yourText || "") : "No answer") + (r.correctText || "");
    const aw = ctx.measureText(ansTxt).width;
    if (aw > widestAnsW) { widestAnsW = aw; widestAns = r; }
  }));
  return { widestClue, widestAns };
}

/**
 * ⭐⭐ Đợt 234 (teacher, 22/8/2026: "cần có thêm 1 bước xác định size chữ/ô
 * câu trả lời tối đa để... vị trí xa nhất của câu hỏi có text dài nhất và vị
 * trí xa nhất của câu có phần (thời gian + câu trả lời sai + câu trả lời
 * đúng) là chỉ gần chạm nhau, không vượt quá nhau") — finds the LARGEST font
 * size at which that still holds, for real, instead of the flat 9.5px every
 * earlier đợt of this sheet guessed at.
 *
 * Two REAL DOM probes, not canvas text metrics for the final decision: a
 * mark()'s pixel width is icon + padding + border-radius + Baloo 2 metrics,
 * and the only way to know that number exactly is to build the actual
 * element and ask the browser — the same reason `pxOfMm` above asks rather
 * than assumes a DPI. `rankWidestDetailRows` above picks WHICH row to probe
 * (canvas metrics are fine for ranking, just not for the final pixel count).
 *
 * Binary search, not a closed-form solve: `ctx.measureText` has no inverse,
 * and the widths here mix a fixed part (icon+padding, constant regardless of
 * font size) with a variable part (the text inside), so "how big can the
 * font be" has no algebra shortcut — it does have a monotonic one (bigger
 * font ⇒ never a narrower probe), which is exactly what binary search needs.
 */
async function computeDetailsFontSizePx(ranked) {
  await (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve());

  const { widestClue, widestAns } = rankWidestDetailRows(ranked);
  if (!widestClue || !widestAns) return { fontSizePx: 9.5, clueColPx: 0, ansColPx: 0 };

  const scratch = el("div");
  scratch.style.cssText = `position:fixed;left:-99999px;top:0;font-family:${DETAILS_FONT_STACK};`;
  document.body.append(scratch);

  const clueProbe = el("div");
  clueProbe.style.cssText = "display:inline-block;white-space:nowrap;font-weight:700;";
  clueProbe.textContent = widestClue.question;                   // the act's own text: textContent only

  const ansProbe = el("div");
  ansProbe.style.cssText = "display:flex;align-items:center;flex-wrap:nowrap;gap:1.6mm;";
  if (widestAns.correct) {
    if (widestAns.roundMs != null) {
      const t = el("span");
      t.style.cssText = "font-weight:800;white-space:nowrap;";
      t.innerHTML = fmtRoundMs(widestAns.roundMs);
      ansProbe.append(t);
    }
    ansProbe.append(mark("is-ok", icons.check, widestAns.correctText));
  } else {
    ansProbe.append(mark("is-bad", icons.cross, widestAns.answered ? widestAns.yourText : "No answer"));
    ansProbe.append(mark("is-ok", icons.check, widestAns.correctText));
  }
  scratch.append(clueProbe, ansProbe);

  const numColPx = pxOfMm(5.5);
  const rowGapPx = pxOfMm(3);
  const colGapPx = pxOfMm(DETAILS_COL_GAP_MM);
  const availablePx = pxOfMm(182) - numColPx - rowGapPx;         // 210mm − 14mm×2 @page margin

  const fits = px => {
    clueProbe.style.fontSize = px + "px";
    ansProbe.style.fontSize = px + "px";
    const clueW = clueProbe.getBoundingClientRect().width;
    const ansW = ansProbe.getBoundingClientRect().width;
    return (clueW + colGapPx + ansW) <= availablePx;
  };

  let lo = 7, hi = 16;
  if (fits(lo)) {
    for (let i = 0; i < 12; i++) {
      const mid = (lo + hi) / 2;
      if (fits(mid)) lo = mid; else hi = mid;
    }
  }
  // Floor, never round — rounding UP could land a hair past the last size
  // that actually fit.
  const fontSizePx = Math.floor(lo * 10) / 10;
  fits(fontSizePx);   // leave both probes at the size that is actually used
  // +2px of slack on each column: the exported PDF is measured in THIS
  // document but painted inside a separate iframe document (see
  // printDetailsSheet's own note on why) — same fonts, same engine, but
  // "exactly 0px to spare" is not a bet worth making across that boundary.
  const clueColPx = Math.ceil(clueProbe.getBoundingClientRect().width) + 2;
  const ansColPx = Math.ceil(ansProbe.getBoundingClientRect().width) + 2;

  scratch.remove();
  return { fontSizePx, clueColPx, ansColPx };
}

function buildDetailsContent(ranked, titleText, fit) {
  // A defensive fallback only — every real caller in this file always runs
  // computeDetailsFontSizePx() first and passes its result straight through.
  const f = fit || { fontSizePx: 9.5, clueColPx: null, ansColPx: null };
  const gridCols = (f.clueColPx != null && f.ansColPx != null)
    ? `${f.clueColPx}px ${f.ansColPx}px` : "1.5fr 1fr";

  const root = el("div");
  root.style.cssText = "width:100%;box-sizing:border-box;font-family:'Baloo 2','Segoe UI',Arial,sans-serif;color:#23303e;";
  root.append(brandingLineEl(7, 6));

  const title = el("div");
  title.style.cssText = "text-align:center;font-weight:800;font-size:15px;letter-spacing:.03em;" +
    "margin-bottom:7mm;overflow-wrap:break-word;";
  title.textContent = titleText;                                 // teacher's own words: textContent only
  root.append(title);

  // ⭐ Đợt 232 (teacher, 22/8/2026) — the printed sheet now reads the header the
  // same way the on-screen review does (core/showdown-review.js's
  // renderReviewList): no more "Team X" tag, and every number spelled out with
  // its own Vietnamese label instead of a bare icon — paper has no colour
  // legend to lean on the way the projector screen does.
  // "Xếp hạng" is this pupil's place in `ranked` itself: the array handed to
  // this function is already the WHOLE CLASS, already sorted by
  // core/showdown.js's rankBlocks() (matchBlocks() in core/showdown-setup.js
  // merges every team before ranking), so `i` IS the rank and `ranked.length`
  // IS the class size — nothing further to compute or look up.
  const classSize = ranked.length;

  ranked.forEach((b, i) => {
    const block = el("div");
    block.style.cssText = `margin-bottom:${i < ranked.length - 1 ? DETAIL_BLOCK_GAP_MM : 0}mm;` +
      "padding-bottom:3.4mm;border-bottom:0.3mm solid #e3e9f1;";
    // `break-inside:avoid` only bites when it can — a block taller than one
    // page still has to spill somewhere, which is what "avoid" (not "always")
    // means: best effort, never a silent crash.
    block.style.breakInside = "avoid";

    const head = el("div");
    head.style.cssText = "margin-bottom:2.2mm;";

    // ⭐ Đợt 234 — name + stats both centred (teacher's own call).
    const who = el("div");
    who.style.cssText = "font-weight:800;font-size:12.5px;overflow-wrap:break-word;margin-bottom:1.4mm;text-align:center;";
    who.textContent = `${i + 1}. ${b.name}`;                      // pupil's own name: textContent only
    head.append(who);

    const stats = el("div");
    stats.style.cssText = "display:flex;flex-wrap:wrap;justify-content:center;gap:1mm 5mm;font-size:9px;color:#6b7a90;font-weight:700;";
    // No round clock this game (`!b.hasTime`) ⇒ no time line — same rule the
    // on-screen tally uses, rather than printing "0:00" for a number that was
    // never actually measured.
    if (b.hasTime) {
      stats.append(statEl("Tổng thời gian xử lý:", `<span style="color:#2563eb">${fmtRoundMs(b.ms)}</span>`));
    }
    stats.append(statEl("Tổng số câu đúng/sai:",
      `<span style="color:#2ec27e">${b.right}</span>/<span style="color:#e03131">${b.wrong}</span>`));
    const pct = pctOf(b);
    if (pct !== null) {
      stats.append(statEl("Tỷ lệ xử lý đúng:", `<span style="color:${pctColor(pct)}">${pct}%</span>`));
    }
    stats.append(statEl("Xếp hạng:", `${i + 1}/${classSize}`));
    head.append(stats);
    block.append(head);

    // ⭐ Đợt 232 — one row PER QUESTION, answer(s) at the tail of the SAME row
    // (same grid split as `.aw-sd-rv-q`/`.aw-sd-rv-body` on screen: clue on the
    // left, answer mark(s) on the right, this question's own time past both),
    // replacing the old stacked "question line, then a line of marks below it".
    (b.rows || []).forEach(r => {
      const line = el("div");
      // ⭐ Đợt 234 — font-size is `f.fontSizePx` (computeDetailsFontSizePx's
      // answer, the LARGEST size the sheet's own worst-case row still fits at),
      // and `margin-bottom` is down to "a few px" (teacher's own words) from
      // the 2mm every earlier đợt used — the row-to-row gap that made this
      // sheet feel wasteful on a phone screen was spacing, not the text itself.
      line.style.cssText = `display:flex;align-items:center;gap:3mm;font-size:${f.fontSizePx}px;line-height:1.25;margin-bottom:0.7mm;`;
      const num = el("span");
      num.style.cssText = "flex:0 0 auto;width:5.5mm;color:#8b93a1;font-weight:700;";
      num.textContent = String(r.n);
      const body = el("div");
      // ⭐ Đợt 234 — fixed px columns from the SAME fit, not a `1.5fr 1fr` ratio:
      // a ratio just splits whatever width happens to be available, it does not
      // know where "the longest question" or "the widest answer group" actually
      // end — these two numbers are those two edges, measured for real.
      body.style.cssText = `flex:1 1 auto;min-width:0;display:grid;grid-template-columns:${gridCols};gap:${DETAILS_COL_GAP_MM}mm;align-items:center;`;
      const clue = el("div");
      clue.style.cssText = "font-weight:700;";
      clue.textContent = r.question;                             // the act's own text: textContent only
      body.append(clue);
      // ⭐ Đợt 233 (teacher, 22/8/2026) — the time sits INSIDE the answer column,
      // right against the mark it timed, not off on its own at the row's far
      // edge: it is a flex child of `ans` itself now, one small gap before the
      // mark, instead of a fourth sibling of `line` stranded past `body`.
      // ⛔ A WRONG row prints NO time at all (teacher's own call) — only ever
      // built for the `r.correct` branch, and a game with the round clock off
      // still has no `roundMs` on any row (same `:empty` idea as the on-screen
      // `.aw-sd-rv-qtime`), so both cases simply skip building the element.
      const ans = el("div");
      ans.style.cssText = "display:flex;align-items:center;flex-wrap:wrap;justify-content:flex-end;gap:1.6mm;";
      if (r.correct) {
        if (r.roundMs != null) {
          const qtime = el("span");
          qtime.style.cssText = "flex:0 0 auto;font-weight:800;color:#10151b;";
          qtime.innerHTML = fmtRoundMs(r.roundMs);
          ans.append(qtime);
        }
        ans.append(mark("is-ok", icons.check, r.correctText));
      } else {
        ans.append(mark("is-bad", icons.cross, r.answered ? r.yourText : "No answer"));
        ans.append(mark("is-ok", icons.check, r.correctText));
      }
      body.append(ans);
      line.append(num, body);
      block.append(line);
    });

    root.append(block);
  });

  return root;
}

// ---------------------------------------------------------------
// PNG — the rank sheet, drawn straight onto a canvas with raw Canvas 2D calls.
// ---------------------------------------------------------------
// ⚠️⚠️ MEASURED, NOT ASSUMED — the first version of this rasterised the DOM
// sheet above via SVG `<foreignObject>` -> `<img>` -> `drawImage`, which is
// the usual trick for "turn this DOM into a picture" without a library. Tried
// against a real class list it threw `SecurityError: Failed to execute
// 'toBlob' … Tainted canvases may not be exported` — Chromium marks ANY
// canvas that has drawn an SVG image containing `<foreignObject>` as tainted,
// same-origin or not, because a foreignObject can in principle carry content
// the renderer cannot statically prove is safe. There is no same-origin
// workaround for that; the only fix is to never let the PNG path touch an
// `<img>` at all. So this draws the funnel directly with `fillRect`/`fillText`
// — a canvas built entirely from primitive calls never gets tainted, and
// `canvas.toBlob` comes back clean. This is exactly why libraries like
// html2canvas exist as manual re-implementations instead of a foreignObject
// one-liner. The DOM sheet above is kept for the on-screen preview only,
// where no canvas is involved and the taint rule never applies.
const FONT_STACK = `'Baloo 2','Segoe UI',Arial,sans-serif`;

/** Shrink, then abbreviate (shortenName), then truncate with "…" — the same
 *  three-rung ladder core/showdown-review.js's fitPodiumNames uses on the DOM,
 *  reimplemented against `ctx.measureText` since canvas text has no CSS to
 *  lean on. Returns the text to draw and the font size to draw it at. */
function fitCanvasName(ctx, name, maxW, baseFs, weight = 800) {
  const font = fs => `${weight} ${fs}px ${FONT_STACK}`;
  const fits = (txt, fs) => { ctx.font = font(fs); return ctx.measureText(txt).width <= maxW; };
  if (fits(name, baseFs)) return { text: name, fs: baseFs };
  const floor = Math.max(10, baseFs * 0.62);
  let fs = baseFs;
  while (fs > floor && !fits(name, fs)) fs -= 1;
  if (fits(name, fs)) return { text: name, fs };
  const abbr = shortenName(name);
  if (fits(abbr, baseFs)) return { text: abbr, fs: baseFs };
  fs = baseFs;
  while (fs > floor && !fits(abbr, fs)) fs -= 1;
  if (fits(abbr, fs)) return { text: abbr, fs };
  // Last resort: truncate the abbreviation itself with an ellipsis, at the floor size.
  let txt = abbr;
  ctx.font = font(floor);
  while (txt.length > 1 && ctx.measureText(txt + "…").width > maxW) txt = txt.slice(0, -1);
  return { text: txt + "…", fs: floor };
}

async function rankPngBlob(ranked, titleText, scale = 2) {
  const n = Math.max(1, ranked.length);
  const { PAD, TITLE_H, GAP, rowH, SIZE, vPad, nameFs, statFs, badgeSize } = computeRankLayout(n);

  const canvas = document.createElement("canvas");
  canvas.width = SIZE * scale;
  canvas.height = SIZE * scale;
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.textBaseline = "middle";

  drawBrandingCanvas(ctx, SIZE, 22, 13);

  // ---- title, shrunk to fit one line ----
  ctx.fillStyle = "#23303e";
  ctx.textAlign = "center";
  let titleFs = 30;
  ctx.font = `800 ${titleFs}px ${FONT_STACK}`;
  const maxTitleW = SIZE - PAD * 2;
  while (ctx.measureText(titleText).width > maxTitleW && titleFs > 14) {
    titleFs -= 1;
    ctx.font = `800 ${titleFs}px ${FONT_STACK}`;
  }
  ctx.fillText(titleText, SIZE / 2, PAD + vPad + TITLE_H / 2);

  // ---- the funnel ----
  const availW = SIZE - PAD * 2;
  const roundRectPath = (x, y, w, h, r) => {
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); return; }
    const rr = Math.min(r, w / 2, h / 2);              // fallback for an engine without ctx.roundRect
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  };

  let y = PAD + vPad + TITLE_H;
  ranked.forEach((b, i) => {
    const boxW = availW * (taperPct(i, n) / 100);
    const boxX = PAD + (availW - boxW) / 2;
    const boxY = y;
    const tier = i < 3 ? i : -1;
    const radius = Math.round(rowH * 0.22);

    roundRectPath(boxX, boxY, boxW, rowH, radius);
    if (tier >= 0) {
      const g = ctx.createLinearGradient(boxX, boxY, boxX + boxW, boxY + rowH * 0.15);
      g.addColorStop(0, TIER_BG_STOPS[tier][0]);
      g.addColorStop(1, TIER_BG_STOPS[tier][1]);
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = "#f3f6fa";
    }
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = tier >= 0 ? TIER_BORDER[tier] : "#e3e9f1";
    ctx.stroke();

    // badge (medal emoji for the top three, a plain numeral after that)
    const badgeCx = boxX + 20 + badgeSize / 2;
    const badgeCy = boxY + rowH / 2;
    ctx.textAlign = "center";
    ctx.fillStyle = tier >= 0 ? TIER_BADGE_COLOR[tier] : "#b3bcc9";
    ctx.font = `800 ${Math.round(badgeSize * (tier >= 0 ? 0.86 : 0.62))}px ${FONT_STACK}`;
    ctx.fillText(tier >= 0 ? MEDAL[tier] : String(i + 1), badgeCx, badgeCy);

    // stats, measured first so the name knows how much room it actually has
    const pct = pctOf(b);
    const okTxt = `✓ ${b.right}`, badTxt = `✗ ${b.wrong}`, pctTxt = pct !== null ? `${pct}%` : "";
    ctx.font = `800 ${statFs}px ${FONT_STACK}`;
    const gapStats = 10;
    const wOk = ctx.measureText(okTxt).width, wBad = ctx.measureText(badTxt).width;
    const wPct = pctTxt ? ctx.measureText(pctTxt).width : 0;
    const statsW = wOk + gapStats + wBad + (pctTxt ? gapStats + wPct : 0);

    // name — left-aligned, after the badge, shrunk/abbreviated/truncated to
    // whatever room is left before the stats block (see fitCanvasName).
    const nameX = boxX + 20 + badgeSize + 10;
    const nameMaxW = Math.max(20, (boxX + boxW - 20) - statsW - 14 - nameX);
    const fit = fitCanvasName(ctx, b.name, nameMaxW, nameFs);
    ctx.textAlign = "left";
    ctx.fillStyle = "#23303e";
    ctx.font = `800 ${fit.fs}px ${FONT_STACK}`;
    ctx.fillText(fit.text, nameX, boxY + rowH / 2);

    // stats, right-aligned to the box's own right edge
    let sx = boxX + boxW - 20;
    ctx.textAlign = "right";
    ctx.font = `800 ${statFs}px ${FONT_STACK}`;
    if (pctTxt) { ctx.fillStyle = pctColor(pct); ctx.fillText(pctTxt, sx, boxY + rowH / 2); sx -= wPct + gapStats; }
    ctx.fillStyle = "#e03131"; ctx.fillText(badTxt, sx, boxY + rowH / 2); sx -= wBad + gapStats;
    ctx.fillStyle = "#2ec27e"; ctx.fillText(okTxt, sx, boxY + rowH / 2);

    y += rowH + GAP;
  });

  return await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

// ---------------------------------------------------------------
// PDF — printed from an IFRAME OF ITS OWN, not from this page.
//
// ⚠️⚠️ THE BUG THIS EXISTS FOR (22/8/2026, thầy: "xuất pdf phần answers thì file
// báo lỗi không đọc được", then "import vào photoshop được nhưng toàn trang
// trắng"). Forensics on thầy's own TEST.pdf, not a guess:
//   • 25 pages, Producer "Microsoft: Print To PDF"
//   • NO fonts and NO text operators anywhere — but 828 vector fills per page,
//     i.e. the answers WERE drawn correctly
//   • the LAST operator on every page draws one 2147x3154 JPEG, every pixel
//     (255,255,255), covering exactly the @page content box — the SAME image on
//     all 25 pages
//   • deleting that one `/Image1 Do` and re-rendering brings the whole sheet
//     back, perfectly laid out
// So the sheet was never the problem: something on the AWord page underneath was
// promoted to a composited layer, rasterised to an opaque white bitmap, and
// painted OVER the sheet on every page. The candidates are all white and all
// `inset:0` (`.aw-sd-recent`, `.aw-sd-rec-detail`, `.aw-sd-exp` in core/app.css),
// and the detail view is fullscreen while this runs, which puts it in the top
// layer where `@media print { #app { display:none } }` cannot reach it.
//
// Rather than chase which element wins that race in which browser, this prints a
// document that CANNOT contain any of them: a same-origin iframe holding nothing
// but the sheet. `frame.contentWindow.print()` prints that frame's own document,
// so no overlay, no top layer and no fullscreen state on this page can reach the
// paper. The page's own stylesheets are copied in (absolute hrefs + a <base>) so
// Baloo 2 and the `.aw-exp-mk` answer marks look exactly as they did before.
//
// The iframe hangs off `document.body`, deliberately NOT off the fullscreen
// element: leaving fullscreen makes core/showdown-setup.js's `closeDetail()`
// remove the detail view, which would take the iframe (and the half-printed
// document) with it.
// ---------------------------------------------------------------
function printDetailsSheet(ranked, titleText, fit) {
  let frame;
  try {
    frame = document.createElement("iframe");
    frame.setAttribute("aria-hidden", "true");
    frame.title = "AWord print sheet";
    // Off-screen but STILL LAID OUT — `display:none` would give the document no
    // layout at all, and a frame with no layout prints nothing.
    frame.style.cssText = "position:fixed;left:-10000px;top:0;width:210mm;height:297mm;border:0;";
    document.body.append(frame);

    const doc = frame.contentDocument;
    doc.open();
    doc.write("<!doctype html><html><head><meta charset='utf-8'>" +
              `<base href="${location.href.replace(/"/g, "&quot;")}">` +
              "</head><body></body></html>");
    doc.close();

    // The page's own CSS, by ABSOLUTE url (`link.href` resolves it for us — the
    // attribute as written is relative, and relative to this new document it
    // would point nowhere).
    document.querySelectorAll('link[rel="stylesheet"]').forEach(l => {
      const c = doc.createElement("link");
      c.rel = "stylesheet";
      c.href = l.href;
      doc.head.append(c);
    });

    const own = doc.createElement("style");
    own.textContent =
      "@page { size: A4; margin: 15mm 14mm; }" +
      "html,body { margin:0; background:#fff;" +
      // the ✓/✗ marks are background colours; without this they print blank
      // (same reason core/app.css sets it on `.aw-print-sheet`).
      "  -webkit-print-color-adjust: exact; print-color-adjust: exact; }";
    doc.head.append(own);

    // ⚠️ MUST carry `aw-print-sheet`, and this is not decoration: the copied
    // core/app.css hides `body > *:not(.aw-print-sheet)` inside @media print, so
    // an unclassed wrapper prints one perfectly blank page — measured, by doing
    // exactly that once. The class also hands it the sheet's own print rules
    // (Baloo 2, colour + `print-color-adjust: exact`).
    const sheet = doc.createElement("div");
    sheet.className = "aw-print-sheet";
    sheet.append(buildDetailsContent(ranked, titleText, fit));
    doc.body.append(sheet);

    let done = false;
    const cleanup = () => {
      if (done) return;
      done = true;
      frame.remove();
    };
    frame.contentWindow.addEventListener("afterprint", cleanup);

    const go = () => {
      try {
        frame.contentWindow.focus();
        frame.contentWindow.print();
      } catch (e) {
        console.warn("AWord: printing the sheet iframe failed", e);
        cleanup();
      }
    };
    // Web fonts first: printing mid-swap sets the whole sheet in the fallback
    // face. `fonts.ready` can sit unresolved on a backgrounded tab, so it races
    // a timeout, the same belt-and-braces every other screen here uses.
    let started = false;
    const once = () => { if (started) return; started = true; setTimeout(go, 60); };
    (doc.fonts && doc.fonts.ready ? doc.fonts.ready : Promise.resolve()).then(once, once);
    setTimeout(once, 3000);
    setTimeout(cleanup, 120000);
  } catch (e) {
    // Never leave the teacher with a dead button: fall back to the old
    // print-this-page route if an iframe is refused for any reason.
    console.warn("AWord: falling back to printing the page itself", e);
    if (frame) frame.remove();
    printDetailsSheetInPage(ranked, titleText, fit);
  }
}

/** The pre-Đợt-231 route, kept only as the fallback above. */
function printDetailsSheetInPage(ranked, titleText, fit) {
  const sheet = el("div", "aw-print-sheet");
  const style = document.createElement("style");
  style.textContent = `@page { size: A4; margin: 15mm 14mm; }`;
  sheet.append(style, buildDetailsContent(ranked, titleText, fit));
  document.body.append(sheet);

  let done = false;
  const cleanup = () => {
    if (done) return;
    done = true;
    sheet.remove();
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
  setTimeout(() => window.print(), 60);      // let the sheet lay out first
  setTimeout(cleanup, 120000);
}

// ---------------------------------------------------------------
// THE POPUP
// ---------------------------------------------------------------
/**
 * @param {object} opts
 *   mount      the element the popup is appended INTO. Must be the same node
 *              that gets `requestFullscreen()`'d by the caller (openDetail) —
 *              anything outside the fullscreen element goes invisible while
 *              it is active, so this popup has to live inside it, not beside it.
 *   ranked     this match's ranked pupil blocks (core/showdown.js's rankBlocks)
 *   className, actName, at   defaults for the three title fields
 *   defaultType  "table" | "rank" | "details" — which tab opens first, the
 *              caller's own current on-screen view (Đợt 235: the board and
 *              this popup now share the same three-way vocabulary)
 *   hasRows    whether per-question detail survived for this match (a match
 *              trimmed by fitToBudget has ranking only — same rule the detail
 *              view itself already shows a line about)
 *   toast      the panel's own toast, for a failed PNG build
 */
export function openExportDialog({ mount, ranked, className = "", actName = "", at, defaultType = "table", hasRows = true, toast = () => {} }) {
  if (!mount || mount.querySelector(".aw-sd-exp")) return;        // one at a time

  // ⭐ Đợt 233 — `layer` is now only the translucent backdrop; `box` is the
  // actual small card, sized to its own content (core/app.css's
  // `.aw-sd-exp`/`.aw-sd-exp-box` — same two-layer shape as `askConfirm`'s
  // `.aw-sd-confirm`/`.aw-sd-confirmbox` right above it in that file).
  const layer = el("div", "aw-sd-exp");
  const box = el("div", "aw-sd-exp-box");
  const head = el("div", "aw-sd-rec-head");
  const titleRow = el("div", "aw-sd-rec-title");
  titleRow.append(el("span", "aw-sd-rec-word", "DOWNLOAD"));
  const closeBtn = el("button", "aw-sd-rec-close", icons.close);
  closeBtn.type = "button";
  closeBtn.title = "Close";
  head.append(titleRow, closeBtn);

  const body = el("div", "aw-sd-exp-body");
  box.append(head, body);
  layer.append(box);
  mount.append(layer);
  layer.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150, easing: "ease-out" });
  box.animate([{ transform: "scale(.94)" }, { transform: "scale(1)" }], { duration: 200, easing: "cubic-bezier(.22,.9,.3,1)" });

  // ⭐ Đợt 235 — a THIRD tab, TABLE (the single-match twin of the multi-match
  // ANALYSIS chart), first in reading order to match the board's own new
  // default (teacher's own call: "Bảng đầu tiên... rồi Podium... cuối cùng
  // là list"). `defaultType` arrives as whatever the caller's board is
  // currently showing; DETAILS still needs `hasRows`, same guard as before.
  let type = defaultType;
  if (type === "details" && !hasRows) type = "table";
  if (type !== "table" && type !== "rank" && type !== "details") type = "table";

  const types = el("div", "aw-sd-exp-types");
  const tableBtn = el("button", "aw-sd-exp-type", `${icons.barChart}<span>TABLE</span>`);
  tableBtn.type = "button";
  const rankBtn = el("button", "aw-sd-exp-type", `${icons.trophy}<span>RANKING</span>`);
  rankBtn.type = "button";
  const detBtn = el("button", "aw-sd-exp-type", `${icons.assignment}<span>DETAILS</span>`);
  detBtn.type = "button";
  if (!hasRows) {
    detBtn.disabled = true;
    detBtn.title = "The answers for this match were not kept.";
  }
  types.append(tableBtn, rankBtn, detBtn);
  body.append(types);

  const fields = el("div", "aw-sd-exp-fields");
  const mkField = (labelTxt, value) => {
    const wrap = el("div", "aw-sd-exp-field");
    const lab = document.createElement("label");
    lab.textContent = labelTxt;
    const input = document.createElement("input");
    input.type = "text";
    input.value = value;
    wrap.append(lab, input);
    return { wrap, input };
  };
  const clsField = mkField("Class", className);
  const actField = mkField("Activity", actName || "Showdown");
  const dateField = mkField("Date", fmtDate(at));
  fields.append(clsField.wrap, actField.wrap, dateField.wrap);
  body.append(fields);

  const titleLine = el("div", "aw-sd-exp-titleline");
  body.append(titleLine);

  const previewBox = el("div", "aw-sd-exp-preview");
  body.append(previewBox);

  const actions = el("div", "aw-sd-exp-actions");
  const goBtn = el("button", "aw-btn aw-btn-primary aw-sd-exp-go");
  goBtn.type = "button";
  actions.append(goBtn);
  body.append(actions);

  function composedTitle() {
    return [clsField.input.value, actField.input.value, dateField.input.value]
      .map(s => String(s || "").trim()).filter(Boolean).join(" • ");
  }

  function paintTypes() {
    tableBtn.classList.toggle("is-on", type === "table");
    rankBtn.classList.toggle("is-on", type === "rank");
    detBtn.classList.toggle("is-on", type === "details");
    goBtn.textContent = type === "details" ? "Download PDF" : "Download PNG";
  }

  // ⭐ Đợt 235 — this match reshaped into `buildAnalysisRows`' own input shape
  // (ONE entry instead of the multi-match ANALYSE screen's several) — cheap
  // and pure, so unlike `ensureDetailsFit` this is just recomputed on demand
  // rather than cached.
  function singleMatchAnalysis(shown) {
    const entries = [{ matchId: "current", label: shown, at, blocks: ranked }];
    const { full, partial } = buildAnalysisRows(entries);
    return { entries, full, partial };
  }

  // ⭐ Đợt 234 — computed ONCE per dialog, not per keystroke: `ranked` (the
  // only thing the fit depends on) never changes while this popup is open,
  // only the Class/Activity/Date text and the rank↔details toggle do. Every
  // caller below — the live preview AND the real Download PDF button — reads
  // this SAME cached value, so the PDF a teacher downloads is guaranteed to
  // be laid out exactly like the preview they just looked at, not a second,
  // independently-computed fit that could drift from it.
  let detailsFit = null;
  async function ensureDetailsFit() {
    if (!detailsFit) detailsFit = await computeDetailsFontSizePx(ranked);
    return detailsFit;
  }

  async function paintPreview() {
    previewBox.innerHTML = "";
    const txt = composedTitle();
    titleLine.textContent = txt || "—";
    const shown = txt || "Showdown";
    if (type === "table") {
      const { entries, full, partial } = singleMatchAnalysis(shown);
      const { canvas, width, height } = drawAnalysisCanvas(full, partial, entries, shown, 1);
      const scale = Math.min(1, 260 / width);
      const frame = el("div", "aw-sd-exp-preview-frame");
      frame.style.width = Math.round(width * scale) + "px";
      frame.style.height = Math.round(height * scale) + "px";
      canvas.style.cssText = `width:${width}px;height:${height}px;transform:scale(${scale});transform-origin:top left;display:block;`;
      frame.append(canvas);
      previewBox.append(frame);
    } else if (type === "rank") {
      const { node, size } = buildRankSheet(ranked, shown);
      const scale = Math.min(1, 260 / size);
      const frame = el("div", "aw-sd-exp-preview-frame");
      frame.style.width = Math.round(size * scale) + "px";
      frame.style.height = Math.round(size * scale) + "px";
      const inner = el("div");
      inner.style.cssText = `width:${size}px;height:${size}px;transform:scale(${scale});transform-origin:top left;`;
      inner.append(node);
      frame.append(inner);
      previewBox.append(frame);
      // ⚠️ AFTER the append — fitPodiumNames measures, and a detached node has
      // no width to measure against (same rule as core/showdown-review.js's own).
      fitPodiumNames(node, ".aw-exp-rank-name");
    } else {
      const fit = await ensureDetailsFit();
      const PW = 210, PH = 297, scale = 260 / PW;
      const frame = el("div", "aw-sd-exp-preview-frame");
      frame.style.width = Math.round(PW * scale) + "px";
      frame.style.height = Math.round(PH * scale) + "px";
      const paper = el("div", "aw-sd-exp-paper");
      paper.style.cssText = `width:${PW}mm;min-height:${PH}mm;box-sizing:border-box;` +
        `padding:15mm 14mm;transform:scale(${scale});transform-origin:top left;background:#fff;`;
      paper.append(buildDetailsContent(ranked, shown, fit));
      frame.append(paper);
      previewBox.append(frame);
    }
  }

  tableBtn.onclick = () => { if (type === "table") return; sound.tick(); type = "table"; paintTypes(); paintPreview(); };
  rankBtn.onclick = () => { if (type === "rank") return; sound.tick(); type = "rank"; paintTypes(); paintPreview(); };
  detBtn.onclick = () => { if (detBtn.disabled || type === "details") return; sound.tick(); type = "details"; paintTypes(); paintPreview(); };
  [clsField.input, actField.input, dateField.input].forEach(inp => inp.addEventListener("input", paintPreview));

  function close() {
    const a = layer.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, easing: "ease-in", fill: "forwards" });
    whenDone(a, () => layer.remove(), 220);
  }
  closeBtn.onclick = () => { sound.click(); close(); };

  goBtn.onclick = async () => {
    sound.click();
    const shown = composedTitle() || "Showdown";
    if (type === "table") {
      goBtn.disabled = true;
      try {
        const { entries, full, partial } = singleMatchAnalysis(shown);
        const blob = await analysisPngBlob(full, partial, entries, shown, 2);
        if (!blob) throw new Error("aw/png-empty");
        triggerDownload(blob, safeFileBit(shown) + ".png");
      } catch (e) {
        console.warn("AWord: could not build the table image", e);
        toast("Could not create the image.");
      } finally {
        goBtn.disabled = false;
      }
    } else if (type === "rank") {
      goBtn.disabled = true;
      try {
        const blob = await rankPngBlob(ranked, shown, 2);
        if (!blob) throw new Error("aw/png-empty");
        triggerDownload(blob, safeFileBit(shown) + ".png");
      } catch (e) {
        console.warn("AWord: could not build the ranking image", e);
        toast("Could not create the image.");
      } finally {
        goBtn.disabled = false;
      }
    } else {
      printDetailsSheet(ranked, shown, await ensureDetailsFit());
    }
  };

  paintTypes();
  paintPreview();
}

// ---------------------------------------------------------------
// ANALYSIS — one PNG of BOTH boards (full + partial), Đợt 230.
// ---------------------------------------------------------------
// Opened by the Download button on the ANALYSE screen (core/showdown-setup.js's
// openAnalysis). Same "raw canvas, never an <img>" rule as the rank sheet above
// — see that section's own note on the Chromium taint bug this avoids.
//
// ⚠️ ONE drawing routine for BOTH the live preview and the final file:
// `drawAnalysisCanvas()` returns a real `<canvas>` synchronously; the preview
// inserts that canvas element as-is (shrunk with a CSS transform, same idiom
// as `buildRankSheet`'s DOM preview above) and the download redraws a second,
// higher-resolution one from the exact same function rather than keeping a
// DOM version and a canvas version that could drift apart.
//
// Colours are the SAME eight as core/showdown-setup.js's ANALYSE_COLORS, kept
// as this file's own copy rather than a static import of that file — see this
// file's own header/POD_MAX_W note on why two dynamic-import-only files never
// statically import each other for one small shared constant.
const ANALYSE_PNG_COLORS = ["#2f7dfd", "#9061f9", "#f5a623", "#14b8a6", "#ec4899", "#06b6d4", "#fb923c", "#64748b"];

const AN_BAR_W = 96, AN_BAR_GAP = 16, AN_GROUP_GAP = 30, AN_PAD = 40;
const AN_AXIS_W = 52, AN_TITLE_H = 96, AN_TOTAL_H = 36, AN_PLOT_H = 380, AN_NAME_H = 42;
const AN_LEGEND_ROW_H = 26, AN_LEGEND_GAP = 22, AN_LEGEND_SW = 13, AN_LEGEND_ITEM_GAP = 20;

/** Wrap the legend's entries into centred rows that fit `maxW` — needs a real
 *  2D context to measure text, so the caller passes one in (a throwaway probe
 *  context before the real canvas exists, since the canvas's own HEIGHT
 *  depends on how many rows come out of this). */
function wrapAnalysisLegend(ctx, entries, maxW) {
  ctx.font = `700 13px ${FONT_STACK}`;
  const rows = [];
  let row = [], rowW = 0;
  entries.forEach((e, i) => {
    const txt = `${e.label} · ${fmtDate(e.at)}`;
    const w = AN_LEGEND_SW + 6 + ctx.measureText(txt).width;
    const addW = row.length ? AN_LEGEND_ITEM_GAP + w : w;
    if (row.length && rowW + addW > maxW) { rows.push(row); row = []; rowW = 0; }
    row.push({ i, txt, w });
    rowW += row.length === 1 ? w : AN_LEGEND_ITEM_GAP + w;
  });
  if (row.length) rows.push(row);
  return rows;
}

/**
 * Draws both boards onto ONE canvas and returns it (synchronously — no
 * `toBlob` here, so this doubles as the live preview's own renderer).
 *
 * ⚠️ SAME SCALING RULE AS THE ON-SCREEN CHART (core/showdown-setup.js's
 * renderChart) — `r.total` is already an AVERAGE (core/showdown.js's
 * buildAnalysisRows), so the axis is a fixed 0-100% here too, and each tier's
 * drawn height divides the match's real `seg.pct` by `r.count` the same way,
 * for the same reason: the stack's visible height has to land on the average
 * while the NUMBER printed inside a tier stays that match's real score.
 */
// ⭐ Đợt 235 — exported for the single-match TABLE view (core/showdown-review.js's
// `renderReviewTable`), which dynamic-imports this module the same way
// core/showdown-setup.js's own DOWNLOAD button already does (see that file's
// own note on why two lazy-loaded siblings never statically import each other).
export function drawAnalysisCanvas(full, partial, entries, titleText, scale = 1) {
  const rows = [...full, ...partial];
  const hasGroupGap = full.length > 0 && partial.length > 0;
  const plotW = Math.max(1, rows.length) * AN_BAR_W + Math.max(0, rows.length - 1) * AN_BAR_GAP
    + (hasGroupGap ? AN_GROUP_GAP - AN_BAR_GAP : 0);
  const width = Math.max(620, AN_PAD * 2 + AN_AXIS_W + plotW);

  const probe = document.createElement("canvas").getContext("2d");
  const legendRows = rows.length ? wrapAnalysisLegend(probe, entries, width - AN_PAD * 2) : [];
  const height = AN_PAD * 2 + AN_TITLE_H + AN_TOTAL_H + AN_PLOT_H + AN_NAME_H + AN_LEGEND_GAP
    + Math.max(1, legendRows.length) * AN_LEGEND_ROW_H;

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.textBaseline = "middle";

  drawBrandingCanvas(ctx, width, 18, 12);

  // ---- title: a small "ANALYSIS" over the teacher's own class/date line ----
  ctx.textAlign = "center";
  ctx.fillStyle = "#2f7dfd";
  ctx.font = `800 20px ${FONT_STACK}`;
  ctx.fillText("ANALYSIS", width / 2, AN_PAD + 22);
  ctx.fillStyle = "#23303e";
  let titleFs = 28;
  ctx.font = `800 ${titleFs}px ${FONT_STACK}`;
  const maxTitleW = width - AN_PAD * 2;
  const shownTitle = titleText || "—";
  while (ctx.measureText(shownTitle).width > maxTitleW && titleFs > 14) {
    titleFs -= 1;
    ctx.font = `800 ${titleFs}px ${FONT_STACK}`;
  }
  ctx.fillText(shownTitle, width / 2, AN_PAD + 60);

  if (!rows.length) {
    ctx.fillStyle = "#98a2b2";
    ctx.font = `700 15px ${FONT_STACK}`;
    ctx.fillText("No pupils in common between these matches.", width / 2, height / 2);
    return { canvas, width, height };
  }

  // ---- plot: gridlines + the % axis, a fixed 0-100 (see this function's own
  //      note on why the axis no longer stretches per selection) ----
  const plotX = AN_PAD + AN_AXIS_W;
  const plotY = AN_PAD + AN_TITLE_H + AN_TOTAL_H;
  const plotBottom = plotY + AN_PLOT_H;
  ctx.textAlign = "right";
  for (let v = 0; v <= 100; v += 20) {
    const gy = plotBottom - (v / 100) * AN_PLOT_H;
    ctx.strokeStyle = "#e3e9f1";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(plotX, gy + 0.5);
    ctx.lineTo(plotX + plotW, gy + 0.5);
    ctx.stroke();
    ctx.fillStyle = "#98a2b2";
    ctx.font = `700 12px ${FONT_STACK}`;
    ctx.fillText(v + "%", plotX - 10, gy);
  }

  // ---- the bars — one per pupil, stacked oldest (bottom) to newest (top),
  //      full first then partial after a short gap, same order the on-screen
  //      chart draws them in ----
  let bx = plotX;
  rows.forEach((r, ri) => {
    if (ri === full.length && hasGroupGap) bx += AN_GROUP_GAP - AN_BAR_GAP;
    let by = plotBottom;
    r.segments.forEach((seg, i) => {
      if (seg.pct == null) return;                 // did not play this match — no tier at all
      const scaledPct = r.count ? seg.pct / r.count : 0;
      const h = (scaledPct / 100) * AN_PLOT_H;
      if (h > 0.4) {
        ctx.fillStyle = ANALYSE_PNG_COLORS[i % ANALYSE_PNG_COLORS.length];
        ctx.fillRect(bx, by - h, AN_BAR_W, h);
        if (h >= 16) {
          ctx.fillStyle = "#ffffff";
          ctx.textAlign = "center";
          ctx.font = `800 11px ${FONT_STACK}`;
          ctx.fillText(`${Math.round(seg.pct)}%`, bx + AN_BAR_W / 2, by - h / 2);
        }
      }
      by -= h;
    });

    // the average, big, on top of the stack (thầy: "số % trên đỉnh cột lớn hơn nhiều")
    ctx.fillStyle = "#1d2939";
    ctx.textAlign = "center";
    ctx.font = `900 20px ${FONT_STACK}`;
    ctx.fillText(`${Math.round(r.total)}%`, bx + AN_BAR_W / 2, by - 16);

    // the pupil's name — UPPERCASE always (thầy), shrunk/abbreviated to fit
    // the bar's own width by the same ladder the rank sheet's names use.
    const fit = fitCanvasName(ctx, r.name.toUpperCase(), AN_BAR_W, 13);
    ctx.fillStyle = "#23303e";
    ctx.font = `800 ${fit.fs}px ${FONT_STACK}`;
    ctx.textAlign = "center";
    ctx.fillText(fit.text, bx + AN_BAR_W / 2, plotBottom + AN_NAME_H / 2);

    bx += AN_BAR_W + AN_BAR_GAP;
  });

  // ---- legend, CENTRED — thầy: "được đưa ra chính giữa", and centred against
  //      the WHOLE image's width, so it reads centred under both boards
  //      together rather than under whichever one happens to be wider ----
  let ly = plotBottom + AN_NAME_H + AN_LEGEND_GAP;
  legendRows.forEach(row => {
    const rowW = row.reduce((a, it, i) => a + it.w + (i ? AN_LEGEND_ITEM_GAP : 0), 0);
    let lx = (width - rowW) / 2;
    row.forEach(it => {
      ctx.fillStyle = ANALYSE_PNG_COLORS[it.i % ANALYSE_PNG_COLORS.length];
      ctx.fillRect(lx, ly - AN_LEGEND_SW / 2, AN_LEGEND_SW, AN_LEGEND_SW);
      ctx.fillStyle = "#5b677a";
      ctx.textAlign = "left";
      ctx.font = `700 13px ${FONT_STACK}`;
      ctx.fillText(it.txt, lx + AN_LEGEND_SW + 6, ly);
      lx += it.w + AN_LEGEND_ITEM_GAP;
    });
    ly += AN_LEGEND_ROW_H;
  });

  return { canvas, width, height };
}

async function analysisPngBlob(full, partial, entries, titleText, scale = 2) {
  const { canvas } = drawAnalysisCanvas(full, partial, entries, titleText, scale);
  return await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
}

/**
 * @param {object} opts
 *   mount                the element to append INTO — same rule as
 *                        `openExportDialog` above: must be whatever is
 *                        currently `requestFullscreen()`'d (the ANALYSE
 *                        screen), or this popup goes invisible right along
 *                        with everything else outside that element's subtree.
 *   className, at        defaults for the Class/Date fields (thầy chose these
 *                        two only — no "Activity" field, since this image can
 *                        span several different acts at once)
 *   full, partial, entries  straight from core/showdown.js's buildAnalysisRows
 *                        and core/showdown-setup.js's own `entries` array —
 *                        the exact same data the on-screen chart is drawn from
 *   toast                the panel's own toast, for a failed PNG build
 */
export function openAnalysisExportDialog({ mount, className = "", at, full = [], partial = [], entries = [], toast = () => {} }) {
  if (!mount || mount.querySelector(".aw-sd-exp")) return;        // one at a time

  // ⭐ Đợt 233 — same backdrop/box split as openExportDialog above.
  const layer = el("div", "aw-sd-exp");
  const box = el("div", "aw-sd-exp-box");
  const head = el("div", "aw-sd-rec-head");
  const titleRow = el("div", "aw-sd-rec-title");
  titleRow.append(el("span", "aw-sd-rec-word", "DOWNLOAD"));
  const closeBtn = el("button", "aw-sd-rec-close", icons.close);
  closeBtn.type = "button";
  closeBtn.title = "Close";
  head.append(titleRow, closeBtn);

  const body = el("div", "aw-sd-exp-body");
  box.append(head, body);
  layer.append(box);
  mount.append(layer);
  layer.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150, easing: "ease-out" });
  box.animate([{ transform: "scale(.94)" }, { transform: "scale(1)" }], { duration: 200, easing: "cubic-bezier(.22,.9,.3,1)" });

  const fields = el("div", "aw-sd-exp-fields");
  const mkField = (labelTxt, value) => {
    const wrap = el("div", "aw-sd-exp-field");
    const lab = document.createElement("label");
    lab.textContent = labelTxt;
    const input = document.createElement("input");
    input.type = "text";
    input.value = value;
    wrap.append(lab, input);
    return { wrap, input };
  };
  const clsField = mkField("Class", className);
  const dateField = mkField("Date", fmtDate(at));
  fields.append(clsField.wrap, dateField.wrap);
  body.append(fields);

  const titleLine = el("div", "aw-sd-exp-titleline");
  body.append(titleLine);

  const previewBox = el("div", "aw-sd-exp-preview");
  body.append(previewBox);

  const actions = el("div", "aw-sd-exp-actions");
  const goBtn = el("button", "aw-btn aw-btn-primary aw-sd-exp-go", "Download PNG");
  goBtn.type = "button";
  actions.append(goBtn);
  body.append(actions);

  function composedTitle() {
    return [clsField.input.value, dateField.input.value]
      .map(s => String(s || "").trim()).filter(Boolean).join(" • ");
  }

  function paintPreview() {
    previewBox.innerHTML = "";
    const txt = composedTitle();
    titleLine.textContent = txt || "—";
    const { canvas, width, height } = drawAnalysisCanvas(full, partial, entries, txt || "Analysis", 1);
    const scale = Math.min(1, 300 / width, 260 / height);
    const frame = el("div", "aw-sd-exp-preview-frame");
    frame.style.width = Math.round(width * scale) + "px";
    frame.style.height = Math.round(height * scale) + "px";
    canvas.style.cssText =
      `width:${width}px;height:${height}px;transform:scale(${scale});transform-origin:top left;display:block;`;
    frame.append(canvas);
    previewBox.append(frame);
  }

  [clsField.input, dateField.input].forEach(inp => inp.addEventListener("input", paintPreview));

  function close() {
    const a = layer.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, easing: "ease-in", fill: "forwards" });
    whenDone(a, () => layer.remove(), 220);
  }
  closeBtn.onclick = () => { sound.click(); close(); };

  goBtn.onclick = async () => {
    sound.click();
    const shown = composedTitle() || "Analysis";
    goBtn.disabled = true;
    try {
      const blob = await analysisPngBlob(full, partial, entries, shown, 2);
      if (!blob) throw new Error("aw/png-empty");
      triggerDownload(blob, safeFileBit("Analysis " + shown) + ".png");
    } catch (e) {
      console.warn("AWord: could not build the analysis image", e);
      toast("Could not create the image.");
    } finally {
      goBtn.disabled = false;
    }
  };

  paintPreview();
}
