# QA Findings

Status of every verification item from `docs/AGENT_BRIEF.md` (Phases A and E).
**PASS (auto)** = covered by an automated test that runs in CI. **PASS (manual)** = checked by hand, with the date.
**OPEN** = not yet done — needs a human with the right device or tool. Do not mark an item PASS without evidence.

Last audited: 2026-11-18 · Build `index-B7k7w-YH.js` (v1.0.0) + load-failure fix.

| ID | Check | Status | Evidence / notes |
|---|---|---|---|
| A1 | Real phone, portrait + landscape | **OPEN** | Needs a physical device. Only emulated widths were tested. |
| A2 | Zoom 200% and 400% at 1280 px | **OPEN** | Viewport meta allows zoom (no `maximum-scale`/`user-scalable`); reflow itself not exercised. |
| A3 | Keyboard-only full session | **PASS (auto)** | `e2e/shortcuts.spec.ts` plays a round by keyboard; `src/App.test.tsx` covers H/A/arrows/1–3/Enter/Space/S/Esc/M/F and modifier-key passthrough. A human tab-order pass is still worth doing. |
| A4 | Screen reader (NVDA / VoiceOver) | **OPEN** | The aria-live announcer (round, verdict, points, score, streak, tell) is unit-tested for its text only; real speech output unverified. |
| A5 | Populated leaderboard at 320 px | **OPEN** | Only the empty state was viewed in a browser. Seed ~20 entries under `real-or-ai-wall:leaderboard:v2` and view `/leaderboard`. |
| A6 | Abandoned vs completed sessions | **PASS (auto)** | `src/learning/sessions.test.ts` and store tests; analysis view shows both counts. |
| A7 | Concept-label audit (5 items × 36 concepts) | **PARTIAL** | One mismatch class fixed (`6e31ea8`). A full 180-item audit has not been done. |
| A8 | axe DevTools on every screen | **OPEN** | Input and control borders raised to AA (`39bdbbd`); no axe report exists. |
| A9 | Direct `/leaderboard` URL on production | **PASS (manual)** | Loaded the app directly on 2026-11-18; `vercel.json` rewrite works. |
| E1 | New build reaches a browser holding an old service worker | **PASS (manual)** | Live `sw.js` is `turingwall-v3`; the page and the served HTML reference the same bundle hash. Not tested from a profile that held the v1 worker. |
| E2 | Offline play after one load | **OPEN** | The item bank is preloaded on startup so it should be cached, but airplane-mode play was not tested. |
| E3 | Re-run A1–A9 on production | **OPEN** | Blocked by the open items above. |
| E4 | Lighthouse mobile (Accessibility ≥ 95, Best Practices ≥ 95) | **OPEN** | No report recorded. |
| E5 | README known limits + `v1.0.0` tag | **PASS (manual)** | Tag exists on the remote; README has a "Known Limits" section. |

## Automated coverage (runs in CI on every push and PR)

- 253 unit tests (`npx vitest run`) — scoring, mastery, sessions, prefs, share privacy, content validation,
  store, components.
- 10 Playwright tests against the production build (`npm run test:e2e`) — full playthrough, Field Guide focus trap and
  Esc/focus restore, keyboard shortcuts, 320 px no-overflow, reduced motion, corrupt saved data, a blocked question-bank
  chunk, and real-time kiosk vs normal-visitor idle behavior.

## Defects found during audit

| Defect | Found | Status |
|---|---|---|
| If the lazy question-bank chunk failed to load, the UI stayed on "Loading question bank…" forever, retry never re-called the loader, and the failure raised unhandled rejections. | 2026-11-18 | **Fixed** — failed attempts reset, a `loadError` state returns the player to the previous screen with a `role="alert"` message, retry re-invokes the loader. Regression tests in `src/store/loadFailure.test.ts` and `src/App.test.tsx`. |
| Corrupt `localStorage` (non-object leaderboard entries, an object stored as a name, invalid mastery tiers) crashed the whole app with "Objects are not valid as a React child". | 2026-11-18 | **Fixed** — entries are sanitized on load (`sanitizeEntry`, `sanitizeMastery`); fuzz tests in `src/hardening.test.tsx` and `e2e/resilience.spec.ts`. |
| My own `vite:preloadError` handler called `preventDefault()`, which made a failed chunk resolve to a module with no `ITEMS` and left the game stuck on the spinner (found by the production e2e test). | 2026-11-18 | **Fixed** — handler now only triggers a guarded one-time reload; an empty or missing bank is treated as a load failure; one failure path covers errors thrown while starting a round. |
| The 45-second idle reset applied to every visitor, which would eject public players mid-round or mid-explanation. | 2026-11-18 | **Fixed** — now opt-in via `?kiosk=1`. **Stall operators must open the kiosk URL with that flag** (see README). |

## Content licensing note

All 15 image items are documented in `src/assets/images/SOURCES.md`. The "public domain" status of the
AI-generated Wikimedia images is taken from each file's Commons page and has not been independently reviewed;
treat it as a legal judgment call before any commercial use.

## Still to do (in priority order)

1. A5 — seed and view a populated leaderboard at 320 px (small, likely to surface a real layout issue).
2. A8 + E4 — axe and Lighthouse reports; file each failure as its own task.
3. A1, A2, A4 — real phone, 200–400% zoom, screen reader.
4. E2 — airplane-mode playthrough after one load.
5. A7 — finish the label audit.
