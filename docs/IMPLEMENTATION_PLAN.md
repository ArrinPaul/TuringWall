# TuringWall — Implementation Plan

Status snapshot (after commit `9c84476`): 19 test files / 177 tests green, build and lint clean.
This plan covers everything not yet done. Work top to bottom; every task is independently
committable and reversible.

## 0. Ground rules (apply to every task)

- **Gate before each commit:** `npx tsc -b && npx vitest run && npx oxlint && npm run build` — all must pass.
- **One task = one commit**, Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`, `refactor:`, `chore:`).
- **Test first** for behavior changes (write the failing test, then the code).
- **Copy rule:** no heuristic is presented as proof. Use "clue", "points toward", "suggests". The validation
  test in `src/data/contentValidation.test.ts` enforces banned phrases — extend it, never loosen it.
- **Local-first:** no new backend. Anything server-shaped goes behind `src/leaderboard/leaderboard.ts`.
- **Do not touch** `public/sw.js` behavior except in task 5.1.

## 1. Measured baseline (what the plan is sized against)

| Fact | Value | Implication |
|---|---|---|
| Items | 541 (534 text, 7 image) | Images are only 1.3% of the bank |
| Enriched items (highlights + tempting reason + counterexample) | 54 (easy 19/135, medium 13/142, hard 12/136, pro 10/128) | ~487 items still use generic concept text |
| Concepts | 36, from **1** item to **59** items each | Some concepts cannot give "varied examples" |
| CI | none (no `.github/`) | Nothing stops a red `main` |
| Large files | `StatsScreen.tsx` 779 lines, `items.ts` ~5.5k lines, JS bundle 680 kB | Refactor + code-split candidates |

---

## Phase A — Verify before building (≈0.5 day, no code)

Goal: turn unknowns into a findings list. Output: `docs/QA_FINDINGS.md` with pass/fail and screenshots.
Any fail becomes a task in Phase B/C.

| # | Check | How | Pass criteria |
|---|---|---|---|
| A1 | Real phone, portrait + landscape | Open the deployed URL on a phone | No horizontal scroll; all buttons tappable; no clipped text |
| A2 | Zoom 200% and 400% | Browser zoom on desktop at 1280 px | Content reflows, nothing overlaps, no loss of function |
| A3 | Keyboard-only full session | Tab / Shift+Tab / Enter / Space / Esc / H / A / arrows / 1-3 / S / M / F | Reach results without a mouse; focus always visible; no trap except the modal |
| A4 | Screen reader (NVDA or VoiceOver) | Landing → setup → one round → reveal → results | Headings, landmarks, live announcements read sensibly |
| A5 | Populated leaderboard on mobile | Seed ~20 entries in `localStorage` (script in `docs/`), view at 320 px | Table is readable as cards or scrolls with a visible cue |
| A6 | Abandoned vs completed sessions | Start a 10-question run, quit after 3, open stats | Abandoned run is labeled and excluded from "completed" metrics |
| A7 | Concept-label accuracy | Sample 5 items per concept (180 items) | Record every mismatch (known example: generic atoms sentence tagged "Hallucinated/impossible claims") |
| A8 | Contrast sweep | axe DevTools on every screen | List all AA failures, including borders that are the only control boundary |

---

## Phase B — Fix what Phase A finds + remaining spec features (≈2–3 days)

### B1. Fix Phase A failures
- One commit per finding class (`fix(a11y)`, `fix(layout)`). Add a regression test for each.

### B2. Abandoned vs completed sessions (if A6 fails)
- **Files:** `src/store/gameStore.ts`, `src/leaderboard/leaderboard.ts`, `src/components/StatsScreen.tsx`.
- **Change:** record `status: 'completed' | 'abandoned'` on session history; leaderboard ranks completed only;
  analysis view shows abandoned count separately.
- **Tests:** store test (quit mid-session → abandoned entry, no leaderboard entry); StatsScreen render test.
- **Done when:** abandoned sessions never appear on any leaderboard or inflate accuracy.

### B3. Personal improvement metrics
- **Files:** new `src/learning/progress.ts`, `StatsScreen.tsx`.
- **Change:** compare the current session with the average of the previous 5 completed sessions
  (accuracy, calibration, tell accuracy) → "Up 8 points vs your last 5 runs". Hide when fewer than 2 prior sessions.
  Label every number "You" vs "This device" — never "community".
- **Tests:** unit tests for the delta math, including 0, 1 and 5+ prior sessions and negative deltas.

### B4. Preferences object + settings control
- **Files:** new `src/prefs/prefs.ts`, small `SettingsPanel` opened from the top-right controls, `src/App.tsx`.
- **Shape:** `{ sound: boolean; motion: 'system' | 'reduce' | 'full'; showNameOnLeaderboard: boolean; version: 1 }`
  stored under one `localStorage` key with safe parsing and a default fallback.
- **Wire-up:** `MotionConfig reducedMotion` reads `motion`; confetti respects it; existing sound toggle migrates into it.
- **Tests:** load/save/corrupt-JSON fallback; motion override beats OS setting; sound migration from the old key.

### B5. Share and print privacy
- **Files:** `StatsScreen.tsx` share builder, `src/index.css` print rules.
- **Change:** share text never includes the player name unless `showNameOnLeaderboard` is on; add one visible line
  "This share text contains: score, accuracy, calibration — no name". Print view mirrors this.
- **Tests:** share text snapshot with name on/off.

### B6. Daily challenge variety
- **File:** `src/learning/mastery.ts` (`selectDailyChallengeDeck`).
- **Change:** exclude the exact item ids the player missed most recently; prefer a different `kind`/`category`
  than the missed item for the same concept; keep "3 review + 2 new".
- **Tests:** with a fixed rng, the deck never contains a just-missed id when an alternative exists; falls back
  cleanly when a concept has only one item.

### B7. Docs
- Update `README.md` (data stored, preferences, privacy) and `METHODOLOGY.md` (how mastery tiers, calibration and
  next-review intervals are computed). Document the leaderboard record shape and how older records are read.

---

## Phase C — Content depth (≈4–6 days, can run in parallel with B)

Only `src/data/items.ts`, `src/character/fieldGuide.ts`, `src/assets/images/*` and tests change here.

### C1. Authoring helper
- **Add** `scripts/missing-enrichment.mjs` (or a vitest-based reporter) that prints unenriched items grouped by
  tier and concept, with text and current explanation, 50 at a time.
- **Why:** last session's picker had to be rewritten twice; make it a repeatable tool.

### C2. Enrichment batches (≈487 items, 10 batches of ~50)
Order: **pro → hard → medium → easy** (hardest tiers get the least help today), then image items as added.
For each item write:
- `evidenceHighlights`: exact substrings of the text (case-insensitive) — validated by test.
- `temptingReason`: why the *other* answer was tempting (one sentence, no certainty words).
- `counterexample`: when this clue fails for *this* item (one sentence).
- Per batch: run the gate, spot-check 10 items, commit `feat(content): enrich <tier> items <n>–<m>`.
- **Raise the floor** in `contentValidation.test.ts` after each batch (54 → 100 → … → 100%). Final state: every
  text item must have all three fields; the "at least 45" test becomes "all".

### C3. Concept coverage balance
- **Problem:** concepts range from 1 to 59 items, so varied retrieval is impossible for thin concepts.
- **Change:** list concepts with fewer than 8 items; write 8+ new items for each across different categories
  (email, review, essay, code, caption). Keep the tier mix roughly even.
- **Test:** add "every concept has ≥ 8 items" to the validation test once met.

### C4. Concept-label corrections
- Apply every mismatch found in A7. Re-run validation. If a concept definition in `fieldGuide.ts` no longer fits
  its items, edit the definition, not the items.

### C5. More images (target 15–20)
- Source licensed images (Unsplash License for photos, Wikimedia Commons for AI-generated samples with `credit`).
- Each needs: neutral `alt` (validated — no "AI/generated/synthetic/render"), neutral `caption`,
  `evidenceHighlights` (visual markers), `temptingReason`, `counterexample`, entry in
  `src/assets/images/SOURCES.md`.
- Compress to ≤ 120 kB each (the current `abstract-art.png` is 578 kB — convert to WebP/JPEG).

---

## Phase D — Engineering health (≈2–3 days)

### D1. GitHub Actions CI
- **Add** `.github/workflows/ci.yml`: Node 22, `npm ci`, `tsc -b`, `vitest run`, `oxlint`, `npm run build`
  on push and PR to `main`. Cache npm.
- **Done when:** a deliberately failing test on a branch turns the check red.

### D2. Split `StatsScreen.tsx` (no behavior change)
- **Target structure:** `components/stats/LeaderboardView.tsx`, `AnalysisView.tsx`, `SessionSummary.tsx`,
  `MasteryOverview.tsx`, shared `StatCard.tsx`.
- **Method:** move code verbatim, keep props identical, run tests after each extraction. No new features in
  this commit.

### D3. Lazy-load the item bank (riskiest — do alone)
- **Problem:** `useGameStore = createGameStore(ITEMS)` imports all 5.5k lines at startup (bundle 680 kB).
- **Change:** `createGameStore` accepts an items provider; app loads `import('./data/items')` on first
  "Start", with a loading state; Field Guide and Attract screen use concept data only (no items import) except the
  sample-quote card, which gets a tiny static fallback list.
- **Tests:** store test with an injected provider (existing tests already inject fixtures); App test for the
  loading state; build output shows the main chunk < 500 kB.
- **Rollback plan:** single commit, revert if Phase E reveals offline breakage.

### D4. Playwright end-to-end suite
- **Add** `@playwright/test`, `e2e/` with: full playthrough (landing → results), abandoned session, Field Guide
  focus trap + focus restore, shortcuts (H/A/arrows/Enter/Space/S/Esc/M/F), 320 px no-overflow assertion,
  reduced-motion emulation.
- **CI:** run on PRs (chromium only).

### D5. Border and contrast follow-ups
- Apply fixes from A8. Rule: raise a border only when it is the sole indicator of a control; leave decorative
  card edges alone to preserve the "Stall Central" look.

---

## Phase E — Release verification (≈0.5 day)

| # | Step | Pass criteria |
|---|---|---|
| E1 | Deploy `main` to Vercel, open in a browser that already has the old service worker | New build loads on a normal reload (no hard refresh) |
| E2 | Offline test | After one load, airplane mode still plays a round |
| E3 | Re-run A1–A8 on the production URL | No regressions |
| E4 | Lighthouse (mobile) | Accessibility ≥ 95, Best Practices ≥ 95 |
| E5 | Update README "Known limits" and tag a release (`git tag v1.0.0`) | Tag pushed |

---

## Suggested sequence

1. **Week 1:** A (all) → D1 (CI first, so everything after is protected) → B1–B2 → start C1/C2 (pro, hard).
2. **Week 2:** B3–B7 → C2 (medium, easy) → C4.
3. **Week 3:** C3, C5 → D2 → D4 → D5.
4. **Week 4:** D3 (alone) → E.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Content batches introduce overclaiming copy | Banned-phrase test + 10-item spot check per batch |
| Lazy-loading breaks offline play | Do D3 after D4 (e2e exists), verify in E2, keep as one revertable commit |
| Highlights that don't match text | Existing test fails the build |
| New images with bad licenses | `SOURCES.md` entry required; no entry, no merge |
| Refactor (D2) changes behavior | Move-only commits; full test suite after every extraction |
| Windows Application Control blocks native build steps (noted in `vite.config.ts`) | Keep the hand-written service worker; don't add build-time PWA plugins |

## Decisions needed before starting

1. **Images:** OK to keep using Unsplash/Wikimedia, or only images you provide?
2. **Review cadence for content:** review every batch, or spot-check only?
3. **Target for concept balance (C3):** minimum 8 items per concept, or a different number?
4. **CI host:** GitHub Actions on `ArrinPaul/TuringWall` — confirm.
