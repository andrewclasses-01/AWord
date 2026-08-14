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

  // ----- Below-stage toolbar icons -----
  options: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h10M18 6h2M4 12h4M10 12h10M4 18h13M21 18h-1"/><circle cx="16" cy="6" r="2.2"/><circle cx="7" cy="12" r="2.2"/><circle cx="17" cy="18" r="2.2"/></svg>`,
  template: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.6"/><rect x="13" y="3.5" width="7.5" height="7.5" rx="1.6"/><rect x="3.5" y="13" width="7.5" height="7.5" rx="1.6"/><rect x="13" y="13" width="7.5" height="7.5" rx="1.6"/></svg>`,
  style: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.9 1.8-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.7-1.6 1.6-1.6H16a4 4 0 0 0 4-4c0-4.4-3.6-8.2-8-8.2z"/><circle cx="7.3" cy="10.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="9.8" cy="7" r="1.1" fill="currentColor" stroke="none"/><circle cx="14.3" cy="7" r="1.1" fill="currentColor" stroke="none"/><circle cx="16.7" cy="10.5" r="1.1" fill="currentColor" stroke="none"/></svg>`,
  // MODE (Đợt 124) — one screen split into two facing boards. Two panels with a
  // divider down the middle still reads at 22px, where a trophy or crossed
  // swords turn to mush.
  mode: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="6" width="8" height="12" rx="1.6"/><rect x="13.5" y="6" width="8" height="12" rx="1.6"/><path d="M12 3.5v17"/></svg>`,
  // SHOWDOWN (Đợt 155) — a winner's podium. It has to be legible at 22px AND
  // instantly distinct from `mode` right beside it: MODE is two panels side by
  // side, this is three blocks of DIFFERENT heights, which reads as ranking even
  // when the shape is too small to count.
  showdown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="5.5" width="6" height="15" rx="1.2"/><rect x="2.5" y="11" width="6.5" height="9.5" rx="1.2"/><rect x="15" y="9" width="6.5" height="11.5" rx="1.2"/></svg>`,
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

  // Big WHITE check with dark outline (flies up on a correct answer)
  markCheck: `<svg viewBox="0 0 24 24" fill="none">
    <path d="M4.5 12.5l5 5L19.5 6.5" stroke="#3d4852" stroke-width="7.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M4.5 12.5l5 5L19.5 6.5" stroke="#ffffff" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  // Big WHITE cross with dark outline (flies up on a wrong answer)
  markCross: `<svg viewBox="0 0 24 24" fill="none">
    <path d="M6 6l12 12M18 6L6 18" stroke="#3d4852" stroke-width="7.5" stroke-linecap="round"/>
    <path d="M6 6l12 12M18 6L6 18" stroke="#ffffff" stroke-width="4.4" stroke-linecap="round"/>
  </svg>`
};
