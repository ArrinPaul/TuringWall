# Real or AI?

A kiosk game for the Daksh AIML stall: guess whether a piece of writing or art is human-made
or AI-generated, across four difficulty tiers and four session lengths (3/5/7/10 questions).
Runs fully offline after the first load — no network needed on the day.

A visitor's setup is a 3-step wizard (name -> hardness -> question count), then straight into
the round. Each session length has its own, separate leaderboard — a 3-question run is never
compared against a 10-question run.

## Running it at the stall

**Before the event**, with internet access, on the kiosk laptop:

```
npm install
npm run build
```

This produces a `dist/` folder — a complete, self-contained static site. You only need to do
this once; after that the app works fully offline.

**On the day**, serve that `dist/` folder locally and open it in Chrome:

```
npm run preview
```

This starts a local server (prints a `http://localhost:...` address) and does **not** need
internet. Open that address in Chrome.

If `npm` isn't available on the kiosk laptop itself, copy the `dist/` folder over and serve it
with any static file server, e.g. Python (`python -m http.server` from inside `dist/`), then
open `http://localhost:8000`.

### Go fullscreen

Click the **Fullscreen** button in the top-right corner of the app (or press `F`). This hides
the browser's address bar and tabs so it reads as a real kiosk, not "a website in a browser."
Press `F` again or `Esc` to exit.

### Resetting between visitors

Nothing to do manually — the app automatically returns to the attract screen after 45 seconds
of no interaction. Just let it sit; the next visitor taps to start fresh.

### Checking it's actually working offline

After the first successful load, you can verify offline support: open Chrome DevTools →
Application tab → confirm a service worker is registered, then toggle DevTools' "Offline"
network throttling and reload. The app should still load and play normally.

Images are cached the first time they're actually shown in a round, not all upfront — before
relying on this fully offline on stall day, play one or two sessions (ideally Mixed, so every
item category shows up at least once) while still online, so every image gets warmed into the
cache. If an image was never shown before going offline, the app shows a designed "Image
unavailable" fallback instead of a broken image — not a crash, but worth avoiding.

## At the end of the day

Every completed session is recorded on its own leaderboard, keyed by session length (3/5/7/10)
and separately rankable by difficulty tier — a 3-question run and a 10-question run are never
compared against each other. All of it is stored only in that browser's local storage on that
laptop. To get a copy:

1. From the stats screen after any session, click **View full board** to see every entry for
   that session length in one detailed table (name, difficulty, score, accuracy, best streak,
   and when it was played) — switch the 3q/5q/7q/10q tabs to see the others.
2. Click **Export .txt** (on the stats screen or inside the full board view) to download a
   plain tab-separated `.txt` file for that session length, openable directly in Notepad or
   Excel. Export each length separately if you want all four.
3. **Print takeaway** on the stats screen opens the browser print dialog with a clean,
   student/parent-facing one-page summary of that one session (score, accuracy, concepts
   practiced) — a physical thing to hand someone, not for the full leaderboard.

The leaderboard only resets if the browser's site data for this app is cleared — it will
**not** survive switching to a different browser or a different laptop.

## Troubleshooting

- **App seems frozen or stuck**: reload the page (`F5` or `Ctrl+R`). The idle timer and
  service worker will recover state automatically.
- **Fullscreen exited unexpectedly** (e.g. someone pressed `Esc`): click the Fullscreen
  button again.
- **Sound got muted and you want it back**: click the **Sound** button (or press `M`).
- **A real image item looks broken**: the app shows a designed "Image unavailable" fallback
  instead of a broken-image icon — this means the laptop reloaded without ever completing a
  first online load. Reconnect to the internet once, reload, and offline support will resume
  working afterward.

## Development

```
npm install       # install dependencies
npm run dev        # local dev server with hot reload
npm run test        # run the test suite (Vitest)
npm run build       # production build into dist/
npm run preview     # serve the production build locally
```

Built with React, TypeScript, Vite, Tailwind CSS, Framer Motion, and Zustand. See
`src/data/items.ts` for the content bank and `src/assets/images/SOURCES.md` for image
licensing.
