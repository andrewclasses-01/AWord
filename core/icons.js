// =============================================================
// ICONS — SVG icon set (Wordwall-like line icons, single color)
// + big white check/cross marks (dark outline) for answer feedback.
// =============================================================

export const icons = {
  menu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>`,
  prev: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>`,
  next: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>`,
  soundOn: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 8.5a4 4 0 0 1 0 7"/></svg>`,
  soundOff: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9l4 6M21 9l-4 6"/></svg>`,
  fullscreen: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l5 5L20 6"/></svg>`,
  cross: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`,
  minus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M5 12h14"/></svg>`,
  download: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="M7.5 10.5 12 15l4.5-4.5"/><path d="M4.5 16.5V19a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-2.5"/></svg>`,

  // ----- Below-stage toolbar icons -----
  options: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h10M18 6h2M4 12h4M10 12h10M4 18h13M21 18h-1"/><circle cx="16" cy="6" r="2.2"/><circle cx="7" cy="12" r="2.2"/><circle cx="17" cy="18" r="2.2"/></svg>`,
  template: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.6"/><rect x="13" y="3.5" width="7.5" height="7.5" rx="1.6"/><rect x="3.5" y="13" width="7.5" height="7.5" rx="1.6"/><rect x="13" y="13" width="7.5" height="7.5" rx="1.6"/></svg>`,
  style: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.9 1.8-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.7-1.6 1.6-1.6H16a4 4 0 0 0 4-4c0-4.4-3.6-8.2-8-8.2z"/><circle cx="7.3" cy="10.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="9.8" cy="7" r="1.1" fill="currentColor" stroke="none"/><circle cx="14.3" cy="7" r="1.1" fill="currentColor" stroke="none"/><circle cx="16.7" cy="10.5" r="1.1" fill="currentColor" stroke="none"/></svg>`,
  // ⭐ Đợt 272 — SHARE LIVE SESSION (footer of the Showdown Options popup): a
  // screen broadcasting outward, same idea as a Chromecast glyph — "this
  // column is sending its state out". Deliberately distinct in SHAPE from
  // `follow` right beside it (a device, not a signal) so the pair reads as
  // "send" vs "receive" even at the 19px size the footer buttons render at.
  cast: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"/><path d="M2 12a9 9 0 0 1 8 8"/><path d="M2 16a5 5 0 0 1 4 4"/><line x1="2" x2="2.01" y1="20" y2="20"/></svg>`,
  // FOLLOW LIVE SESSION — a plain device (this browser), for "this screen
  // mirrors what the shared session says" — see `cast`'s note above.
  follow: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2.2"/><line x1="12" x2="12.01" y1="18" y2="18"/></svg>`,
  // MODE (Đợt 124) — one screen split into two facing boards. Two panels with a
  // divider down the middle still reads at 22px, where a trophy or crossed
  // swords turn to mush.
  // ⭐ Đợt 191 (thầy) — the divider used to be the TALLEST thing in the icon
  // (17 units against boards of 12), which read as a mast rather than a split,
  // and the boards were nearly touching it. Now the bar is a shade SHORTER than
  // the boards (11 vs 12) and the gap either side is wider (2.4 vs 1.5): the two
  // boards read as the subject and the bar as what separates them.
  mode: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect x="2.1" y="6" width="7.5" height="12" rx="1.6"/><rect x="14.4" y="6" width="7.5" height="12" rx="1.6"/><path d="M12 6.5v11"/></svg>`,
  // SHOWDOWN (Đợt 155) — a winner's podium. It has to be legible at 22px AND
  // instantly distinct from `mode` right beside it: MODE is two panels side by
  // side, this is three blocks of DIFFERENT heights, which reads as ranking even
  // when the shape is too small to count.
  // ⭐ Đợt 191b (thầy) — REBASED ON TO THE SHARED BAND 6→18. Measured, this podium
  // used to run 5.5→20.5: two and a half units lower than every other mode icon,
  // which is what made the row look like it was sagging in the middle (the
  // teacher spotted it on a screenshot). The three heights keep their ratio
  // (15 : 11.5 : 9.5, scaled by 0.8) so it still reads as a ranking.
  showdown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="6" width="6" height="12" rx="1.2"/><rect x="2.5" y="10.4" width="6.5" height="7.6" rx="1.2"/><rect x="15" y="8.8" width="6.5" height="9.2" rx="1.2"/></svg>`,
  // SINGLE (Đợt 158) — one board, the plain state. Only ever shown INSIDE the
  // mode picker (as the tile you go back to), never in the toolbar: out there
  // "no mode" is expressed by the merged button simply not glowing.
  // ⭐ Đợt 191b — 5.5→18.5 became 6→18, the band every mode icon now shares.
  single: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="12" rx="1.8"/></svg>`,
  // MODES (Đợt 158) — the MERGED toolbar button that replaced MODE + SHOWDOWN.
  // Three panels of the same size with the middle one marked: "three modes, one
  // of them chosen". Deliberately NOT `mode` (two panels = fight) or `showdown`
  // (three heights = ranking) — the button no longer means either one of them,
  // it means the choice between them.
  modes: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect x="2.2" y="6" width="5.6" height="12" rx="1.4"/><rect x="9.2" y="6" width="5.6" height="12" rx="1.4"/><rect x="16.2" y="6" width="5.6" height="12" rx="1.4"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/></svg>`,
  // ⭐ Đợt 191 (thầy) — IPA MODE is the one idea in the picker that has no
  // picture: a mouth, a speech bubble and a microphone all already mean
  // something else in this app (Speaking, Speaking cards). The three letters ARE
  // the icon. Drawn as TEXT rather than as outlined letterforms so it stays
  // crisp at 22px, and given the app's own Baloo 2 at weight 800 so it reads as
  // a sibling of the drawn icons rather than as a caption.
  // ⚠️ `stroke="none"` is mandatory: every other icon here is stroke-only with
  // `fill:none`, and a glyph inheriting that pair would come out invisible.
  // ⚠️⚠️ SIZE AND BASELINE ARE MEASURED, NOT GUESSED (thầy, 18/8/2026: "chữ hiện
  // đang bé quá và có vẻ hơi lệch dưới"). Two things make this easy to get wrong:
  //   · a `<text>` is placed by its BASELINE, so the word hangs ABOVE `y` — y=12
  //     would put the whole thing in the top half;
  //   · `getBBox()` on a text node reports the EM box (ascender + descender of
  //     the font), NOT the ink of these three letters, so it centres the wrong
  //     rectangle. The first pass trusted it and still sat 0.7 units low.
  // Measured properly with canvas `measureText().actualBoundingBox*` in the app's
  // own Baloo 2 at weight 800.
  // ⭐ Đợt 191b — SIZED TO THE SHARED BAND. The other mode icons run 6→18 (height
  // 12); at font-size 15.4 this ink runs ~6.5→17.5 (height 11, width ~22.8),
  // which is as close as the band can be got. It cannot be matched exactly: ink
  // height 12 needs font-size 16.8, and three capitals at that size measure ~24.9
  // wide — wider than the 24-unit viewBox, so the word would be clipped at both
  // ends. Half a unit short top and bottom (~1px on the 48px tile) is the right
  // trade against losing the first and last letter.
  // Baseline **16.5** centres the ink on exactly 12, so the half unit it gives up
  // at the top it also gives up at the bottom (6.5 / 17.5). An earlier pass sat it
  // a touch high — the optical correction capitals usually want — but the teacher's
  // rule here is measurable parity of top and bottom across the row, and against
  // three neighbours that all run 6→18 the symmetric reading is the one that looks
  // right.
  // ⚠️ Re-measure if the font, weight or size ever changes: these numbers are for
  // Baloo 2 at 800, not a general rule.
  ipa: `<svg viewBox="0 0 24 24" fill="none" stroke="none"><text x="12" y="16.5" text-anchor="middle" font-family="'Baloo 2', system-ui, sans-serif" font-weight="800" font-size="15.4" letter-spacing="-0.3" fill="currentColor">IPA</text></svg>`,
  // ⭐ Đợt 191 (thầy) — SHUFFLE, replacing the magic wand on "Random teams". A
  // wand says "something magic happens"; two paths crossing over says WHAT
  // happens, and it is the symbol every music player has already taught the room.
  // ⭐ Đợt 192 — THE ONLY TWO COLOURED ICONS IN THIS FILE, and deliberately so.
  // Every other icon here is one-colour linework taking `currentColor` from the
  // button it sits in, which is what lets the same string serve a lit tile, a
  // dim toolbar and a hover state. These two cannot: the teacher asked for
  // "icon bé trai áo xanh" and "icon bé gái áo hồng", and the whole job of the
  // pair is to be told apart ACROSS the room on an 86" board, where the colour
  // is read a beat before the word under it. So they carry their own fills and
  // ignore `currentColor` entirely.
  // ⚠ Because they are filled, not stroked, the `stroke-width` rules that other
  // icon sizes rely on (see .aw-mp-icon in app.css) do nothing to them — they
  // scale cleanly at any size instead, which is the one bonus of the exception.
  boy: `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="6.6" r="3.4" fill="#f3c08b"/><path d="M8.6 5.2a3.4 3.4 0 0 1 6.8 0 6 6 0 0 0-3.4-1 6 6 0 0 0-3.4 1z" fill="#4a3728"/><path d="M6.4 20v-5.2a5.6 5.6 0 0 1 5.6-4.2 5.6 5.6 0 0 1 5.6 4.2V20z" fill="#2f6fed"/></svg>`,
  girl: `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="6.6" r="3.4" fill="#f3c08b"/><path d="M8.6 5.6a3.4 3.4 0 0 1 6.8 0c0 1.5.6 2.4.6 2.4l-1.6-1.2a5.6 5.6 0 0 0-4.8 0L8 8s.6-.9.6-2.4z" fill="#7b4a2d"/><path d="M12 10.6c2.6 0 3.6 2 4.4 4.2L18 20H6l1.6-5.2c.8-2.2 1.8-4.2 4.4-4.2z" fill="#ec4899"/></svg>`,
  shuffle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h3.6c1.2 0 2.3.6 3 1.6l4.8 6.8c.7 1 1.8 1.6 3 1.6H21"/><path d="M3 17h3.6c1.2 0 2.3-.6 3-1.6l4.8-6.8c.7-1 1.8-1.6 3-1.6H21"/><path d="M18.2 4.2L21 7l-2.8 2.8M18.2 14.2L21 17l-2.8 2.8"/></svg>`,
  // ⭐ Đợt 191 (thầy) — BACK, for "Reset teams": that button's real meaning is
  // "go back to the class screen and choose again", and a circular-arrow refresh
  // never said that. An arrow with a SHAFT, not a bare chevron — `prev` above is
  // already the chevron, and it means "the previous question" inside a game.
  back: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12H5"/><path d="M11 6l-6 6 6 6"/></svg>`,
  edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0 0-3l-1-1a2.1 2.1 0 0 0-3 0L4 15v5z"/><path d="M13.5 6.5l4 4"/></svg>`,
  assignment: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="14" height="17" rx="1.8"/><path d="M9 3.5h6a1 1 0 0 1 1 1V6H8V4.5a1 1 0 0 1 1-1z"/><path d="M8.5 11.5l2 2 4-4.2M8.5 17h7"/></svg>`,
  print: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 8.5V4h11v4.5"/><rect x="4.5" y="8.5" width="15" height="7.5" rx="1.6"/><rect x="6.5" y="13" width="11" height="7" rx="1"/></svg>`,
  home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11.5 12 4l8 7.5"/><path d="M6 10.5V20h12v-9.5"/><path d="M10 20v-5h4v5"/></svg>`,

  // Small lightbulb shown before each clue on the printed worksheets
  bulb: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.5.4.8.9.9 1.6l.1.5h5l.1-.5c.1-.7.4-1.2.9-1.6A6 6 0 0 0 12 3z"/></svg>`,

  // ----- Print-format picker icons (popup shown when Print is clicked) -----
  fmtAnagram: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="8.5" width="7" height="7" rx="1.4"/><rect x="14.5" y="8.5" width="7" height="7" rx="1.4"/><path d="M9.8 7.2l4.4 0" stroke-dasharray="0.1 3"/><path d="M13.4 5.4l1.8 1.8-1.8 1.8"/></svg>`,
  fmtCrossword: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="1.6"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/><rect x="3" y="3" width="6" height="6" fill="currentColor" stroke="none" opacity="0.18"/><rect x="15" y="9" width="6" height="6" fill="currentColor" stroke="none" opacity="0.18"/><rect x="9" y="15" width="6" height="6" fill="currentColor" stroke="none" opacity="0.18"/></svg>`,
  fmtQuiz: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="5" height="5" rx="1.2"/><rect x="3" y="13" width="5" height="5" rx="1.2"/><path d="M4.4 6.3l1 1 1.6-1.9"/><path d="M11 6.2h9M11 15.5h9"/></svg>`,
  fmtUnjumble: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h7M14 6h7"/><path d="M3 12h11M18 12h3"/><path d="M3 18h5M12 18h9"/><path d="M12 4l2 2-2 2M18 10l-2 2 2 2"/></svg>`,

  // ----- Đợt 148: the games that had no icon of their own -----
  // Same Lucide-ish stroke language as the four above. Added because the
  // Template picker now shows an icon beside every name (teacher: "các act thêm
  // icon phù hợp vào nữa cho đủ độ rộng và đẹp, cân đối hơn"), and these six
  // games had nothing that fitted: a box, a maze route, a mallet, a chequered
  // flag, a balloon and a piece of fruit.
  fmtBox: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 8.2 12 12.5l8.5-4.3"/><path d="M12 12.5V21"/><path d="M20.5 8.2v7.4a1.6 1.6 0 0 1-.9 1.4l-6.8 3.5a1.7 1.7 0 0 1-1.6 0l-6.8-3.5a1.6 1.6 0 0 1-.9-1.4V8.2a1.6 1.6 0 0 1 .9-1.4l6.8-3.5a1.7 1.7 0 0 1 1.6 0l6.8 3.5a1.6 1.6 0 0 1 .9 1.4z"/></svg>`,
  fmtMaze: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="18.5" r="2.4"/><circle cx="18.5" cy="5.5" r="2.4"/><path d="M8 18.5h7a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h7"/></svg>`,
  fmtMole: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20.2h16"/><path d="M7.6 20.2a4.4 4.4 0 0 1 8.8 0"/><path d="m13.2 8.6-4.4 4.4"/><path d="M14.2 3.6 20 9.4l-2.1 2.1-5.8-5.8z"/></svg>`,
  fmtRace: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V3.2"/><path d="M5 4.4s1.4-1 4-1 4.6 2 7.2 2 2.8-1 2.8-1v8.5s-.2 1-2.8 1-4.6-2-7.2-2-4 1-4 1z"/></svg>`,
  fmtBalloon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.8c-3.2 0-5.5 2.5-5.5 5.7 0 3.8 3 6.9 5.5 7.8 2.5-.9 5.5-4 5.5-7.8 0-3.2-2.3-5.7-5.5-5.7z"/><path d="m11 16.4.9 1.4h-1.8l.9 1.4"/><path d="M12 19.2v2"/></svg>`,
  fmtFruit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 7.8c-1.3-2.3-4.3-2.6-5.9-.8-1.7 1.9-1.4 5.4-.2 8 1.1 2.5 2.6 4.3 3.9 4.3 1.1 0 1.5-.7 2.2-.7s1.1.7 2.2.7c1.3 0 2.8-1.8 3.9-4.3 1.2-2.6 1.5-6.1-.2-8-1.6-1.8-4.6-1.5-5.9.8z"/><path d="M12 7.8V4.6"/><path d="M12.4 4.6c1.4 0 2.5-1 2.6-2.2-1.4-.1-2.6.9-2.6 2.2z"/></svg>`,

  // Modern gear (Settings) + a small folder (Activities/Results quick-nav) + search
  settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  folder: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2Z"/></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>`,

  // ⭐ Đợt 235 — the third view button next to the trophy (List/Podium), for
  // the new per-match TABLE view (core/showdown-export.js's single-match
  // analysis chart): four bars of different heights read as "a chart of
  // columns" at a glance, the same reason `trophy` reads as ranking.
  barChart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M9.5 20V4M15 20V13M20 20V7"/></svg>`,

  // ----- Showdown's ranking board (Đợt 177) -----
  // A cup with handles, stem and base. FILLED, not stroked: at podium size a
  // hairline outline vanishes on a projector, and the whole point of these three
  // is the gold/silver/bronze COLOUR, which `currentColor` inherits from the
  // wrapper app.css tints per place.
  trophy: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.4 3.2H5.6v1.1H2.2v2.1c0 2.6 1.9 4.7 4.4 5.1a5.9 5.9 0 0 0 4 3.3v3H8.1a1.9 1.9 0 0 0-1.9 1.9v1.1h11.6v-1.1a1.9 1.9 0 0 0-1.9-1.9h-2.5v-3a5.9 5.9 0 0 0 4-3.3c2.5-.4 4.4-2.5 4.4-5.1V4.3h-3.4V3.2zM4.1 6.4V6.2h1.5v3.2A3.4 3.4 0 0 1 4.1 6.4zm15.8 0a3.4 3.4 0 0 1-1.5 3V6.2h1.5v.2z"/></svg>`,
  // ⭐⭐ Đợt 207 (thầy, 20/8/2026: "Đổi icon 3 cúp thành icon 3 huy chương, có số
  // 1, 2, 3") — a ribbon above, a disc below, and the PLACE WRITTEN ON THE DISC.
  //
  // ⚠️ THREE SEPARATE ICONS, NOT ONE ICON PLUS A NUMBER LAID OVER IT. The digit
  // has to sit on the disc's centre at every size the app draws these at (2.7cqw
  // on the funnel, ~13px in a Recently-results column), and a separately
  // positioned `<span>` would have to be re-centred by hand at each of them.
  // Inside the SVG it is part of the drawing and scales with it, for free.
  //
  // ⚠️ `fill="currentColor"` on the ribbon+disc, exactly like the cup above, so
  // app.css keeps tinting place 1/2/3 gold/silver/bronze with the rules it
  // already has. The digit is punched OUT of the disc (`fill="#fff"`), which is
  // what keeps it legible against all three tints — a coloured digit on a
  // coloured disc goes to mud on a projector.
  //
  // ⚠️ The digits are drawn as `<path>`, not `<text>`: `<text>` would inherit the
  // page's font, and a fallback font (or a font that has not loaded yet — the
  // 7px-weight-400 trap of Đợt 153) changes the glyph's width and knocks it off
  // the disc's centre. A path is the same shape on every machine.
  medal1: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7.2 1.6H4l4.1 7.2a8 8 0 0 1 2.9-1.2L7.2 1.6zm9.6 0h-3.2l-3.8 6a8 8 0 0 1 2.9 1.2l4.1-7.2z"/><circle cx="12" cy="15.4" r="7"/><path fill="#fff" d="M12.9 11.3v8.2h-1.8v-6.1l-1.5.5v-1.5l2.4-1.1h.9z"/></svg>`,
  medal2: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7.2 1.6H4l4.1 7.2a8 8 0 0 1 2.9-1.2L7.2 1.6zm9.6 0h-3.2l-3.8 6a8 8 0 0 1 2.9 1.2l4.1-7.2z"/><circle cx="12" cy="15.4" r="7"/><path fill="#fff" d="M9.3 19.5V18l2.6-2.6c.5-.5.7-.9.7-1.3 0-.6-.4-1-1-1s-1.1.4-1.1 1.2H9.3c0-1.7 1-2.7 2.4-2.7 1.5 0 2.5.9 2.5 2.3 0 .8-.3 1.4-1.1 2.2l-1.6 1.6h2.8v1.5H9.3z"/></svg>`,
  medal3: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7.2 1.6H4l4.1 7.2a8 8 0 0 1 2.9-1.2L7.2 1.6zm9.6 0h-3.2l-3.8 6a8 8 0 0 1 2.9 1.2l4.1-7.2z"/><circle cx="12" cy="15.4" r="7"/><path fill="#fff" d="M11.8 19.7c-1.5 0-2.6-.9-2.6-2.4h1.6c0 .6.4 1 1 1s1-.4 1-1-.4-1-1.1-1h-.4v-1.4h.4c.6 0 1-.3 1-.9s-.4-.9-.9-.9-.9.4-.9 1H9.3c0-1.5 1.1-2.4 2.5-2.4s2.5.9 2.5 2.2c0 .7-.3 1.2-.9 1.5.6.3 1 .9 1 1.7 0 1.5-1.1 2.4-2.6 2.4z"/></svg>`,
  // The refresh spinner. A faint full ring with one bright arc over it — app.css
  // rotates the whole svg, and the arc is what makes the rotation readable.
  spinner: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><circle cx="12" cy="12" r="8.6" opacity=".25"/><path d="M12 3.4a8.6 8.6 0 0 1 8.6 8.6"/></svg>`,
  // ⭐ Đợt 196 — the warning triangle the Showdown class board uses to say what
  // it is MISSING (a team that has not published, a team on a different act).
  // Drawn in the same 24-box and the same 6→18 ink band as the mode icons, so it
  // sits level with a line of text without making the row lurch.
  alert: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5.2 20.8 18.8H3.2Z"/><path d="M12 10.4v3.6"/><path d="M12 16.6h.01"/></svg>`,

  // ----- Assignment report toolbar (v0.9.4) -----
  refresh: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 0 1 14.5-4.5M20 12a8 8 0 0 1-14.5 4.5"/><path d="M18.5 3.8v4h-4M5.5 20.2v-4h4"/></svg>`,
  link: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 13.5a3.6 3.6 0 0 0 5.1 0l3-3a3.6 3.6 0 0 0-5.1-5.1l-1.4 1.4"/><path d="M13.5 10.5a3.6 3.6 0 0 0-5.1 0l-3 3a3.6 3.6 0 0 0 5.1 5.1l1.4-1.4"/></svg>`,
  qr: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="3.3" y="3.3" width="6.6" height="6.6" rx="1.2"/><rect x="14.1" y="3.3" width="6.6" height="6.6" rx="1.2"/><rect x="3.3" y="14.1" width="6.6" height="6.6" rx="1.2"/><rect x="14.3" y="14.3" width="2.6" height="2.6" fill="currentColor" stroke="none"/><rect x="18.4" y="14.3" width="2.6" height="2.6" fill="currentColor" stroke="none"/><rect x="14.3" y="18.4" width="2.6" height="2.6" fill="currentColor" stroke="none"/><rect x="18.4" y="18.4" width="2.6" height="2.6" fill="currentColor" stroke="none"/></svg>`,
  openExternal: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6"/><path d="M20 4l-8.5 8.5"/><path d="M18 13.5V19a1.6 1.6 0 0 1-1.6 1.6H5.6A1.6 1.6 0 0 1 4 19V7.6A1.6 1.6 0 0 1 5.6 6H11"/></svg>`,

  // ----- Content-editor row toolbar icons (per-row buttons in a word/question list) -----
  mic: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0"/><path d="M12 17.5V21M9 21h6"/></svg>`,
  image: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="M20.3 15.5l-5-5-4.3 4.3-2.3-2.3-5.2 5.2"/></svg>`,
  dragHandle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><path d="M12 4v16M8 8l4-4 4 4M8 16l4 4 4-4"/></svg>`,
  duplicate: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3.5" y="3.5" width="13" height="13" rx="2"/><path d="M9.5 20.5H18a2.5 2.5 0 0 0 2.5-2.5V9.5" stroke-linecap="round"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 7h15"/><path d="M9.5 7V4.8c0-.7.6-1.3 1.3-1.3h2.4c.7 0 1.3.6 1.3 1.3V7"/><path d="M6.5 7l.7 12.2c.05.9.8 1.6 1.7 1.6h6.2c.9 0 1.65-.7 1.7-1.6L18.5 7"/><path d="M10.3 11v6M13.7 11v6"/></svg>`,
  eye: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3.2"/></svg>`,
  eyeOff: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18"/><path d="M10.6 5.7A10.6 10.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a15.6 15.6 0 0 1-3.4 4.2M7.4 7.3C4.9 8.9 2.5 12 2.5 12S6 18.5 12 18.5c1.4 0 2.6-.3 3.7-.8"/><path d="M9.9 10a3.2 3.2 0 0 0 4.2 4.3"/></svg>`,
  wand: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20L15 9"/><path d="M17.5 3.3l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z" fill="currentColor"/><path d="M4.7 13.2l.55 1.3 1.3.55-1.3.55-.55 1.3-.55-1.3-1.3-.55 1.3-.55z" fill="currentColor"/></svg>`,
  micOff: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0"/><path d="M12 17.5V21M9 21h6"/><path d="M3 3l18 18"/></svg>`,

  // On-screen keyboard show/hide toggle (bottom bar, next to Menu — Type the answer)
  keyboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="6" width="19" height="13" rx="2"/><path d="M6 10h.01M9.5 10h.01M13 10h.01M16.5 10h.01M6 13.5h.01M9.5 13.5h.01M13 13.5h.01M16.5 13.5h.01M8 17h8"/></svg>`,

  // Giant rounded PLAY triangle (start-game overlay)
  playBig: `<svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M8.2 5.6c0-1.4 1.5-2.2 2.7-1.5l9.4 5.8c1.1.7 1.1 2.3 0 3l-9.4 5.8c-1.2.7-2.7-.1-2.7-1.5V5.6z"/>
  </svg>`,

  // SUBMIT half of the same student start screen (Đợt 249). SAME picture as
  // `playBig` — only RE-FRAMED. `playBig` was drawn for the round `.aw-bigplay`
  // button, where a right-pointing triangle must sit right-of-centre to LOOK
  // centred inside its circle; borrowed for the duo (no circle, a word directly
  // underneath) that same offset just reads as crooked, and the shape only filled
  // 57×67 of its 106px box next to a target that filled all 106.
  // The `<g>` scales it 1.29× and re-centres it on the box, so bia bắn and tam
  // giác end up the same optical height (86px) with the SAME gap down to their
  // label. ⚠️ Not derived from `playBig` at runtime — if that path is ever
  // redrawn, copy the new `d` here too.
  submitBig: `<svg viewBox="0 0 24 24" fill="currentColor">
    <g transform="translate(-6.915 -1.306) scale(1.29005)">
      <path d="M8.2 5.6c0-1.4 1.5-2.2 2.7-1.5l9.4 5.8c1.1.7 1.1 2.3 0 3l-9.4 5.8c-1.2.7-2.7-.1-2.7-1.5V5.6z"/>
    </g>
  </svg>`,

  // Giant TARGET + ARROW — the PRACTICE half of the student start screen.
  // Đợt 248 (thầy đưa ảnh `icon target.png`): the amber dumbbell of Đợt 246 is gone;
  // "luyện tập" now reads as hitting the bullseye. Traced from thầy's PNG by
  // nearest-colour segmentation, so it is the SAME picture, not a look-alike —
  // 8 flat colours, no gradients, no external file. Colours are baked in on
  // purpose: unlike every other icon here it is NOT `currentColor`, so the CSS
  // rule `.is-practice .aw-startbtn-ic { color: ... }` no longer tints it.
  practiceBig: `<svg viewBox="0 0 24 24" fill="none">
    <g transform="translate(0.855 0.855) scale(0.93069)">
    <path fill="#FD646F" d="M12.33 3.14L9.75 3L8.34 3.19L6.7 3.66L4.97 4.5L3.56 5.53L2.06 7.12L1.27 8.34L0.33 10.59L0 12.28L0 14.72L0.33 16.41L1.27 18.66L2.06 19.88L2.91 20.77L4.73 21.94L6.38 22.59L8.16 22.97L10.36 23.02L13.03 22.45L14.67 21.7L16.17 20.67L17.34 19.55L18.38 18.14L17.3 17.34L16.41 18.66L15.33 19.69L14.2 20.44L12.28 21.19L9.75 21.38L7.59 20.86L5.95 19.97L4.5 18.66L3.14 16.45L2.58 14.16L2.58 12.84L2.86 11.34L3.98 9L5.77 7.17L7.73 6.09L9.8 5.62L11.06 5.62L12.61 5.91L14.11 6.52L15.28 7.31L16.36 6.38L16.08 4.59L14.2 3.66ZM13.5 9.05L11.67 8.25L9.8 8.16L7.78 8.81L6.28 10.08L5.77 10.83L5.25 12.09L5.11 14.16L5.77 16.17L6.8 17.48L6.84 17.2L8.72 17.86L10.55 17.81L12.19 17.2L13.55 16.08L13.64 15.8L12.61 15.28L13.17 13.97L12.61 15.14L12.05 15.66L11.25 16.08L10.03 16.17L8.86 15.66L8.11 14.81L7.78 13.92L7.92 12.56L8.86 11.34L10.03 10.83L10.88 10.83L11.67 11.06L13.55 9.19ZM17.62 7.64L16.69 8.58L17.81 10.64L18.33 12.8L18.14 15.33L17.44 17.2L18.09 15.89L19.08 16.36L19.31 16.31L19.97 13.36L19.92 11.2L19.41 9L18.84 7.78ZM14.48 10.78L12.94 12.33L13.12 13.83L13.31 13.64L14.58 14.2L14.86 12.28ZM7.03 17.58L8.34 18.47L9.61 18.8L7.69 18.05ZM13.92 17.53L13.22 18.05L11.77 18.7L13.22 18.14ZM15.66 14.81L15 16.27L14.48 16.97L15.09 16.27ZM14.81 10.45L15.75 12.66L15.42 11.39Z"/>
    <path fill="#FC4755" d="M19.36 7.88L18.84 7.83L19.5 9.52L19.88 11.3L19.92 13.27L19.64 15.05L19.17 16.31L18 15.8L17.25 17.58L18.28 18.14L17.3 19.45L15.84 20.81L14.58 21.66L12.33 22.59L10.73 22.92L8.72 22.97L7.17 22.73L5.67 22.27L4.31 21.61L2.67 20.48L2.77 20.72L4.12 21.94L5.53 22.83L7.36 23.58L9.14 23.95L11.72 23.95L13.22 23.67L15 23.02L16.78 21.94L18.14 20.72L19.31 19.22L20.34 17.16L20.81 15.42L20.95 14.3L20.81 11.58L20.34 9.84ZM14.95 10.55L14.77 10.5L14.53 10.73L14.81 12.38L14.58 14.06L13.17 13.55L12.98 14.48L12.52 15.38L13.55 15.89L12.66 16.78L11.16 17.58L9.61 17.86L8.3 17.72L6.42 16.83L6.38 17.02L7.64 18.09L8.62 18.56L9.94 18.84L11.81 18.7L13.73 17.77L15.05 16.31L15.75 14.39L15.66 12.14Z"/>
    <path fill="#F5F5F5" d="M12.61 5.86L9.98 5.58L8.3 5.86L7.03 6.33L5.3 7.45L4.17 8.62L3.28 10.08L2.81 11.34L2.53 13.03L2.58 14.48L2.91 15.98L3.47 17.3L4.41 18.66L6.19 19.78L8.62 20.44L10.36 20.44L11.77 20.16L14.16 18.98L16.03 17.06L15.98 16.88L14.86 16.45L13.88 17.58L12.52 18.42L10.73 18.84L9.47 18.75L8.39 18.42L7.03 17.58L6.19 16.69L5.34 15.05L5.11 13.78L5.34 11.95L6.19 10.31L7.27 9.23L8.62 8.48L10.17 8.16L12 8.39L13.55 9.14L15.33 7.36L14.25 6.52ZM10.08 10.78L9 11.16L8.34 11.72L7.83 12.66L7.73 13.88L8.11 14.95L8.67 15.61L9.66 16.12L10.83 16.22L11.91 15.84L12.47 15.28L10.12 14.2L9.8 13.88L9.66 13.5L9.8 12.94L11.58 11.11L11.11 10.83ZM16.45 8.86L14.86 10.55L15.38 11.44L15.7 12.52L15.8 13.78L15.66 14.77L16.92 15.28L17.39 13.41L17.39 11.67L17.16 10.41ZM12.89 12.42L12.23 13.17L13.17 13.55Z"/>
    <path fill="#E6E6E6" d="M16.97 8.91L16.64 8.62L14.86 10.41L15.61 11.95L14.95 10.5L16.55 9.05L17.11 10.5L17.34 11.77L17.34 13.31L17.06 14.72L16.78 15.19L15.61 14.67L15.38 15.52L14.62 16.83L14.95 16.5L15.94 17.02L14.06 18.94L12.23 19.92L10.27 20.39L8.34 20.34L6.75 19.92L4.45 18.61L3.7 17.58L2.67 15.05L3.09 16.55L3.84 17.95L5.25 19.55L6.28 20.3L7.5 20.91L9 21.33L11.3 21.42L12.38 21.23L13.73 20.77L15.19 19.92L16.45 18.75L17.25 17.67L17.91 16.31L18.33 14.67L18.38 12.7L18.19 11.58L17.72 10.22ZM13.08 12.61L12.89 12.38L10.88 14.3L10.17 14.2L9.75 13.73L9.7 13.22L9.66 13.78L10.03 14.25L12.52 15.33L13.03 14.53L13.17 13.5L12.38 13.08L12.89 12.56L13.17 13.17ZM11.72 5.67L14.2 6.56L15.23 7.31L13.5 9.05L12.23 8.39L11.81 8.39L13.59 9.14L15.38 7.36L13.83 6.28ZM11.58 10.97L11.06 10.83L11.48 11.06L9.84 12.7L9.66 13.12L11.62 11.11ZM4.45 8.39L3.47 9.66L2.67 11.95L3.33 10.17ZM8.95 5.72L7.08 6.28L6 6.89L5.34 7.5L7.12 6.38ZM6.33 10.12L5.72 10.88L5.2 12.33L5.81 10.88ZM9.09 8.3L7.83 8.77L7.08 9.38ZM5.25 14.86L5.72 16.12L6.28 16.83ZM7.12 17.67L7.73 18.19L8.91 18.66ZM13.78 17.67L12 18.66L13.17 18.19ZM8.72 15.56L9.33 16.03L10.12 16.22ZM5.25 7.55L4.5 8.3ZM12.23 15.52L11.06 16.17L11.86 15.89ZM7.78 14.11L8.06 14.91L8.39 15.23ZM9.84 10.83L9.05 11.11L8.72 11.44ZM6.98 9.42L6.38 10.03ZM8.39 11.77L7.83 12.7Z"/>
    <path fill="#7A6E79" d="M22.22 2.11L22.03 2.02L9.98 14.16L10.36 14.34L11.25 14.16L17.86 7.69L22.17 3.23L22.31 2.95Z"/>
    <path fill="#918291" d="M21.94 1.83L21.66 1.69L20.77 1.83L16.41 6.19L16.27 6L16.41 6.19L9.8 12.8L9.66 13.69L10.08 14.25L10.73 14.39L10.08 14.11L22.08 2.11Z"/>
    <path fill="#2B597F" d="M18.47 1.03L17.77 1.64L18.23 4.41L18.89 3.84ZM19.64 5.77L22.36 6.19L22.92 5.53L20.25 5.06Z"/>
    <path fill="#50758D" d="M23.95 4.31L21.33 3.94L17.72 7.64L19.97 8.06L20.53 8.02L22.31 6.14L19.78 5.67L20.3 5.16L22.97 5.58L23.95 4.59ZM17.86 1.69L15.94 3.52L16.31 6.28L18.28 4.45ZM19.69 0L19.41 0L18.42 0.98L18.84 3.8L20.06 2.67Z"/>
    </g>
  </svg>`,

  // Big WHITE check with dark outline (flies up on a correct answer)
  markCheck: `<svg viewBox="0 0 24 24" fill="none">
    <path d="M4.5 12.5l5 5L19.5 6.5" stroke="#3d4852" stroke-width="7.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M4.5 12.5l5 5L19.5 6.5" stroke="#ffffff" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  // QUICK ACCESS (Đợt 218) — the home page's left-hand panel of pinned folders.
  // Marks a pinned row, and names the action in a folder's ⁝ menu.
  pin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 3.5h5l-.7 5.2 3.2 2.6v2.2H7v-2.2l3.2-2.6z"/><path d="M12 13.5V21"/></svg>`,

  // Big WHITE cross with dark outline (flies up on a wrong answer)
  markCross: `<svg viewBox="0 0 24 24" fill="none">
    <path d="M6 6l12 12M18 6L6 18" stroke="#3d4852" stroke-width="7.5" stroke-linecap="round"/>
    <path d="M6 6l12 12M18 6L6 18" stroke="#ffffff" stroke-width="4.4" stroke-linecap="round"/>
  </svg>`
};
