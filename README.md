# Real or AI?

A kiosk game for the Daksh AIML stall: guess whether a piece of writing or art is human-made
or AI-generated, across four difficulty tiers. Runs fully offline after the first load — no
network needed on the day.

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

## At the end of the day

Each completed session (all players, all difficulty tiers) is recorded in a local leaderboard,
stored only in that browser's local storage on that laptop. To get a copy:

1. Finish any session to reach the stats screen (or just open the app — the leaderboard
   persists across page loads on the same laptop/browser).
2. Click **Export .txt** next to "Today's Leaderboard" on the stats screen.
3. This downloads a plain tab-separated `.txt` file (name, difficulty, score, accuracy, best
   streak, timestamp) you can open directly in Notepad or Excel.

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
