# AWord — English games by Andrew Classes

Web app to **create and play English learning games** (Wordwall-style), with student
results and leaderboards. Built for Teacher Andrew (Andrew Classes).

**Live site:** https://andrewclasses-01.github.io/AWord/

---

## What it does

- **Library** — a Google-Drive-style home page: two fixed roots (**Activities** / **Results**),
  sub-folders, folder colours, drag & drop, search, recycle bin.
- **Games** — a shared 16:9 game engine with themes, timer, sound, fullscreen,
  celebration, summary panel, leaderboard and a "Show answers" review screen.
  **Quiz** is built; Anagram, Find the match, Type the answer and Open the box are planned.
- **Editor** — enter questions by hand or paste a whole table straight from Excel.
- **Print** — pick a paper format (Anagram / Crossword / Quiz / Unjumble) and print
  an A4 black-and-white worksheet.

100% English product UI. Project notes are written in Vietnamese for the teacher.

## Running it locally

No build step and no Node needed — it is plain HTML + CSS + ES modules.

```bash
python devserver.py 5510
```

Then open <http://localhost:5510/>.

> Use `devserver.py`, **not** `python -m http.server` — the dev server sends
> `Cache-Control: no-store`, otherwise the browser can keep serving stale `.js` files
> after an edit.

## Layout

| Path | What |
|---|---|
| `index.html`, `main.js` | The library home page |
| `core/` | Shared engine, styles, store, print, themes, assets |
| `templates/<game>/` | One folder per game (module + css + sample data + test page) |
| `docs/` | Wordwall research + architecture notes |

`APP_MASTER.md` is the main map of the project — read it first.
`core/HUONG DAN CORE.md` is the engine ↔ template contract.

## Credits

Built by Teacher Andrew (Pham Xuan Ninh) with Claude Code.
Font: [Baloo 2](https://fonts.google.com/specimen/Baloo+2) (SIL Open Font License).
