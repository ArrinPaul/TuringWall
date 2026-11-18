# TuringWall — Agent Brief (self-contained)

> **Status (2026-11-18): superseded.** Phases B–D and the v1.0.0 release are complete; see `docs/QA_FINDINGS.md` for the remaining manual checks. The sections below describe the project *before* that work (e.g. 54 enriched items, no CI) and are kept for history.

You are an engineer joining the **TuringWall** project. This file is everything you need. Read all of
sections 0–6 before touching code, then execute **one task** from section 8 (or the task you were assigned).
Do not start tasks you were not assigned: other agents are working in parallel (see section 9).

---

## 0. TL;DR

- **What it is:** a web game, "Real or AI?" — players judge whether a short piece of text or an image was
  human-made or AI-made, state confidence, pick the "tell" (the clue), then learn from an explanation and a
  counterexample. It tracks mastery per concept with spaced review.
- **Live:** https://turing-wall.vercel.app/ · **Repo:** `ArrinPaul/TuringWall`, branch `main`.
- **Stack:** Vite 8 + React 19 + TypeScript 6 + Tailwind CSS 4 + Zustand 5 + Framer Motion 14 + Vitest 5 (jsdom).
- **No backend.** Everything is `localStorage`. Keep it local-first.
- **Quality gate (must pass before every commit):**
  ```
  npx tsc -b && npx vitest run && npx oxlint && npm run build
  ```
  Current baseline: **19 test files, 177 tests, all passing; lint clean; build OK.**
- **Product principle (non-negotiable):** *no single signal proves whether something is human or AI-made.*
  Never write copy that treats a heuristic as proof. Use "clue", "points toward", "suggests".

---

## 1. Project context

TuringWall evolved from a kiosk "Stall Central" game (a station at a fair/class where passers-by play).
That origin explains: a 45-second idle auto-reset to the landing screen, big touch buttons, fullscreen and sound
toggles, and a service worker for offline play.

**Visual identity — preserve it.** Dark ink background, amber/gold "signal" accent, retro field-station /
lab-notebook feel, editorial serif display type (Fraunces), IBM Plex Sans/Mono, strong card layout.
Do **not** turn it into a generic SaaS dashboard or a childish edu theme. Design tokens are in `src/index.css`
(`@theme`): `ink #15110d`, `panel #221b14`, `panel-line #3c3022`, `control-line #7c6a52`, `paper #f4ede1`,
`muted #a99880`, `signal #d6933c`, `signal-dim #ad7329`, `good #7f9a5e`, `bad #b85a3d`.

**Akinator-inspired, not copied:** one dominant action per screen, persistent progress ("3 / 10"),
investigation-style microcopy ("Let's narrow it down"), a staged reveal. No mascot imitation or branding.
(The game has its own character, "Signal", in `src/character/signal.ts` + `SignalAvatar.tsx`.)

### The core loop

`Predict (Human / AI / Unsure) → choose confidence (low/medium/high) → identify the tell → reveal verdict →
highlighted evidence → explanation + counterexample → next round`

### Screens (state machine in `src/store/gameStore.ts`, type `Screen`)

`attract → select (3-step setup: name → difficulty → length) → playing → revealed → … → stats`

`stats` doubles as the leaderboard/analysis page and is also served at the URL path `/leaderboard`
(handled with `history.pushState`/`popstate` in `src/App.tsx`).

---

## 2. Repository map

```
index.html                     viewport meta (zoom allowed — keep it that way), manifest link
public/sw.js                   service worker (network-first HTML, cache-first /assets/*, SWR otherwise)
public/manifest.webmanifest    PWA manifest + icons
src/main.tsx                   entry; registers the SW in PRODUCTION only
src/App.tsx                    screen router, global shortcuts (M, F), aria-live announcer, MotionConfig, idle reset
src/index.css                  Tailwind import, theme tokens, print + reduced-motion rules
src/store/gameStore.ts         Zustand store (createGameStore(items, rng) factory + default useGameStore)
src/game/scoring.ts            points, streak, calibration, strongest/weakest tell, ranks
src/game/deck.ts               shuffled no-repeat deck
src/learning/types.ts          shared types (RoundResult, ConceptMastery, ConfidenceLevel, ConceptDetail, …)
src/learning/mastery.ts        mastery tiers, spaced review, deck selectors (weak / missed / daily)
src/character/fieldGuide.ts    36 concepts: definitions, chapters, details, search, getConceptDetail()
src/character/signal.ts        "Signal" persona lines
src/data/types.ts              Item types (TextItem | ImageItem), Difficulty, SessionMode
src/data/items.ts              THE QUESTION BANK (541 items, ~5.5k lines)
src/leaderboard/leaderboard.ts local leaderboard store (localStorage), sort views, formatting/export
src/audio/tone.ts              WebAudio beeps; mute flag (in-memory only — see task B4)
src/hooks/idle.ts              45 s idle → return to attract
src/hooks/fullscreen.ts        fullscreen toggle
src/components/
  AttractScreen.tsx            landing: CTA, Daily challenge, Practice weak tells (+due badge), Field Guide
  SelectScreen.tsx             3-step wizard (name → difficulty → length), recommended difficulty
  PlayingScreen.tsx            the round: Human/AI/Unsure, confidence, tell picker, clue, progress bar
  RevealedPanel.tsx            staged reveal: verdict → concept → highlighted evidence → explanation → counterexample
  StatsScreen.tsx              leaderboard + analysis (≈780 lines; split planned in D2)
  FieldGuide.tsx               modal: search, chapter/mastery filters, focus trap, ESC, focus restore
  FullLeaderboard.tsx          full leaderboard table/list
  SignalAvatar.tsx             the character SVG
src/assets/images/*            7 image items + SOURCES.md (licenses!)
docs/IMPLEMENTATION_PLAN.md    higher-level plan (this brief supersedes it for agents)
README.md, METHODOLOGY.md      user-facing docs
```

Tests live next to code (`*.test.ts[x]`), plus `src/data/contentValidation.test.ts`, `src/game/simulation.test.ts`,
`src/components/RevealedPanel.test.tsx`.

---

## 3. Data model (read before changing anything)

### 3.1 Items (`src/data/types.ts`)

```ts
type Difficulty = 'easy' | 'medium' | 'hard' | 'pro';
type SessionMode = Difficulty | 'mixed';

interface BaseItem {
  id: string;                 // unique, stable — mastery & missed-queue reference it
  isAI: boolean;              // ground truth
  explanation: string;        // short plain-language "why" (must not overclaim)
  concept: string;            // MUST be one of the 36 names in fieldGuide.ts (allConcepts())
  difficulty: Difficulty;
  category?: string;          // e.g. 'Chat', 'Poetry', 'Art' (24 categories today)
  evidenceHighlights?: string[]; // EXACT substrings of item.text (case-insensitive) — test-enforced; for images: visual markers
  temptingReason?: string;    // why the opposite answer was tempting
  counterexample?: string;    // when this clue fails for THIS item
  rememberThis?: string;
}
interface TextItem  extends BaseItem { kind: 'text';  text: string }
interface ImageItem extends BaseItem { kind: 'image'; src: string; caption: string; alt?: string; credit?: string }
```

- `caption` is visible; `alt` is the **neutral** screen-reader description and must not reveal the answer
  (test-enforced: no "AI", "generated", "synthetic", "digital art", "hybrid", "algorithmic", "render").
- Rendering fallbacks: the reveal shows `item.temptingReason || concept.whyFooled` and
  `item.counterexample || concept.counterexample`. So an un-enriched item still works, just generically.

**Bank statistics (measured):** 541 items = 534 text + 7 image. Tiers: easy 135, medium 142, hard 136, pro 128.
Enriched (highlights + tempting + counterexample): **54** (easy 19, medium 13, hard 12, pro 10).
36 concepts, from **1** item up to **59** items each. 24 categories.

### 3.2 Concepts (`src/character/fieldGuide.ts`)

36 concepts. `getConceptDetail(concept)` returns a `ConceptDetail`:
`{ concept, category: 'writing'|'code'|'image'|'tone'|'reasoning', signalBias: 'human'|'ai'|'context-dependent',
definition, plainExplanation, positiveExample, counterexample, whyFooled, rememberThis, chapter }`.
`EDUCATIONAL_DISCLAIMER` is the mandatory disclaimer string (shown in the UI; test asserts it).

### 3.3 Round + mastery types (`src/learning/types.ts`)

```ts
type ConfidenceLevel = 'low' | 'medium' | 'high';
type PredictionChoice = 'human' | 'ai' | 'unsure';
type MasteryTier = 'new' | 'practicing' | 'familiar' | 'shaky' | 'mastered';
type PracticeMode = SessionMode | 'weak-tells' | 'review-missed' | 'daily-challenge';

interface RoundResult { itemId, concept, difficulty, category?, prediction, actualSource, isCorrect, isUnsure,
                        confidence, selectedTell, tellCorrect, pointsAwarded, timestamp }
interface ConceptMastery { concept, tier, correctCount, incorrectCount, tellIdentifiedCount,
                           lastPracticed, nextReview, consecutiveCorrect }
```

### 3.4 Scoring (`src/game/scoring.ts`)

- Points per correct answer by tier: **easy +1, medium +2, hard +3, pro +5** (`DIFFICULTY_POINTS`).
- **High-confidence correct: +1 bonus.** **Correct tell: +1 partial credit** (even if the source guess was wrong).
- **Unsure: +1 safe point**, does **not** break the streak. A wrong non-unsure answer resets streak to 0.
- `calculateCalibrationScore(results)` → 0–100. `getStrongestAndWeakestTells(results)`.
- Streak milestones `[3,5,8,12]` trigger confetti (skipped under reduced motion).

### 3.5 Mastery & spaced review (`src/learning/mastery.ts`)

- All 36 concepts are always present in the map (`loadMastery()` fills defaults), so "new" concepts are discoverable.
- Next review after a **wrong** answer: +12 h. After a **right** answer by tier: shaky +1 d, practicing +2 d,
  familiar +5 d, mastered +14 d.
- `getDueConcepts(map)` = tier `shaky` OR `nextReview <= now`.
- Deck selectors: `selectWeakTellsDeck`, `selectMissedQuestionsDeck`, `selectDailyChallengeDeck`
  (≤3 review/weak concepts + ≤2 "new" concepts, one item per concept, backfill if short).

### 3.6 Persistence (all `localStorage`, all reads wrapped in try/catch with safe defaults)

| Key | Owner | Contents |
|---|---|---|
| `real-or-ai-wall:leaderboard:v2` | `leaderboard.ts` | `{ [roundsTarget]: LeaderboardEntry[] }` |
| `real-or-ai-wall:mastery:v2` | `mastery.ts` (exported `MASTERY_STORAGE_KEY`) | `Record<concept, ConceptMastery>` |
| `real-or-ai-wall:missed-questions:v2` | `mastery.ts` | `string[]` of item ids |

`LeaderboardEntry`: `{ name, difficulty, score, accuracy, bestStreak, timestamp, roundsTarget (3|5|7|10),
calibration?, tellAccuracy?, conceptsMastered?, completed? }`. Older records lack the optional fields — readers
must default them (`calibration ?? accuracy`, `conceptsMastered ?? 0`).

> **Known gap:** the **sound mute flag is in-memory only** (`src/audio/tone.ts`, `let soundMuted = false`). It
> resets to "on" on every load. There is also **no stored settings object** and **no stored session history**
> beyond leaderboard entries. Task B4 fixes the former; B2/B3 need the latter.

---

## 4. Keyboard shortcuts (all are covered by tests; do not break them)

| Screen | Keys |
|---|---|
| Global | `M` mute · `F` fullscreen (ignored when Ctrl/Cmd/Alt held, or a modal dialog is open) |
| Playing (before choice) | `H`/`←` Human · `A`/`→` AI · `U` Unsure · `C` toggle clue |
| Playing (after choice) | `1`/`2`/`3` confidence · `Enter`/`Space` reveal · `Esc` change choice |
| Revealed | `Space`/`Enter`/`→` next · `S` stats · `P` practice this tell · `B` bookmark |
| Field Guide | `Esc` closes; focus is trapped inside and restored to the opener |
| Inputs | name/search inputs stop key propagation so typing `m`/`f` works |

Handlers on `window` must start with a modifier guard: `if (e.ctrlKey || e.metaKey || e.altKey) return;`
(so Ctrl+F / Ctrl+P / Ctrl+S / Ctrl+C keep working). Don't remove it.

---

## 5. Conventions and gotchas

### Code
- TypeScript strict-ish: `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax` (use `import type`),
  `erasableSyntaxOnly` (**no `enum`, no parameter properties, no namespaces**).
- Lint is `oxlint` (`npx oxlint`) — keep it at **zero warnings**.
- Tailwind v4 utilities inline in JSX. **Unlayered CSS beats Tailwind utilities** — e.g. the rule in
  `index.css` that sets `border-color` on `input:not(:focus)` overrides `border-panel-line` but is deliberately
  excluded when focused so `focus:border-signal` still works.
- Touch targets ≥ 40 px tall on interactive controls (`min-h-10`); the setup/leaderboard filters were fixed to this.
- Framer Motion is wrapped in `<MotionConfig reducedMotion="user">`. Any new looping/decorative animation must
  also be neutralised by the `prefers-reduced-motion` rule in `index.css`.
- Don't use `useEffect` just to copy state into state (`react/set-state-in-effect` lint). Derive with `useMemo`
  or lazy `useState(() => …)`.

### Content
- `evidenceHighlights` strings must be **exact substrings** of `text` (case-insensitive) — otherwise the test fails.
- Banned certainty words in explanations (test-enforced): `proves/guarantees/definitive(ly)/dead giveaway/
  sure sign/strong human tell/unmistakable|y/genuinely human/textbook AI/classic AI/hallmark(s)`.
  Write "a clue, not proof" style copy instead.
- Every item's `concept` must exist in `allConcepts()` and that concept needs a non-empty counterexample.
- Image items need `alt` (>30 chars, neutral) and a license note in `src/assets/images/SOURCES.md`;
  CC BY-SA images need `credit`.
- `items.ts` text strings use single quotes; apostrophes are escaped (`\'`) or the string uses double quotes.

### Environment (Windows 11, PowerShell/Git Bash)
- **Line endings:** files in the working tree are **CRLF**; git warns "LF will be replaced by CRLF" — that warning
  is harmless. When scripting edits, read/write with `newline=''` (Python) and preserve the file's existing EOL.
- **Python/regex editing:** inserting regex-like strings (`\b`) through nested shell heredocs corrupted a file once
  (`\b` became a literal backspace char). Write scripts to a file first, or use `chr(92)` for backslashes, then
  verify with `git diff`.
- **Windows Application Control blocks native rollup on a second invocation** — that's why `vite-plugin-pwa` is not
  used and `public/sw.js` is hand-written. **Do not add build-time PWA plugins.**
- Dev server: `npx vite --port <free port> --strictPort --host 127.0.0.1`. Check the port isn't already used by
  another project (`netstat -ano | grep :PORT`).
- **A stale service worker can make you test old code.** If changes don't show up, unregister it in DevTools →
  Application → Service Workers and clear caches. (SW registers in production builds only now.)
- Real browser window can't be resized below ≈558 px on this machine; to test 320/375/768 px, use same-origin
  `<iframe>`s of those widths and measure `documentElement.scrollWidth` vs width.

### Testing patterns
- App tests inject a fixture bank: `createGameStore(fixtureItems, () => 0)` (deterministic rng) and render
  `<App store={store} />`.
- Helper in `src/App.test.tsx`: `startEasyRound()` clicks through the wizard (Continue → Easy → 10).
- `window.history.pushState(null, '', '/')` in `beforeEach` — an earlier test leaves the URL at `/leaderboard`.
- Clear `localStorage` in `beforeEach` for anything touching mastery/leaderboard.
- Test ids you can rely on: `attract-root`, `playing-root`, `verdict`, `due-badge`.
- Keyboard tests dispatch on `window` with `fireEvent.keyDown(window, { key: 'h' })` / `{ code: 'Enter' }`.

### Git
- Branch `main`; **Conventional Commits**, one logical change per commit.
- Commit message trailer used in this repo:
  `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`
- **Do not push or force-push unless explicitly told to.** Do not rewrite pushed history.

---

## 6. What is already done (don't redo)

- Core loop with confidence, tell identification, Unsure, partial credit, calibration, streaks, results page.
- Mastery tiers, spaced review, weak-tells / review-missed / daily-challenge modes, due-for-review badge.
- Field Guide: search, chapters, mastery filters, "seen last session", expand-for-detail, practice buttons,
  focus trap + restore + visible close + Esc.
- Results/analysis: strongest/weakest tell, concept accuracy, high-confidence misses, calibration, content-type
  breakdown, recommended next practice, missed-round replay; leaderboard sort views (High Score, Source Accuracy,
  Best Calibration, Best Streak, Concepts Mastered), Today/All-Time.
- Accessibility: zoom allowed, reduced-motion CSS + MotionConfig, aria-live announcer (round, verdict, points,
  score, streak, tell), semantic modal, stronger input borders (3:1), ≥40 px touch targets, shortcut modifier guard.
- Content: 54 enriched items (47 text + 7 image), neutral image alt text, copy softened across ~240 explanations,
  validation tests.
- PWA: service worker no longer pins stale builds.
- Verified in a real browser: no horizontal overflow at 320/375/768 on landing, setup, round, reveal, Field Guide,
  leaderboard (empty). Field Guide dialog semantics, Esc and focus restore OK.

## 7. Known problems / unverified (inputs to the tasks below)

1. **Sound preference not persisted** (see 3.6). The README previously claimed otherwise; now corrected.
2. **No `vercel.json`** — a direct visit to `/leaderboard` on the deployed site may 404 (SPA fallback). Verify in E1;
   fix = add `vercel.json` with a rewrite `{"source":"/(.*)","destination":"/index.html"}`.
3. **~487 items lack curated evidence/tempting/counterexample** and fall back to generic concept text.
4. **Concept balance:** some concepts have 1–7 items → "varied examples" impossible. 7 images total.
5. **Concept-label mismatches** suspected (e.g. a generic atoms sentence tagged "Hallucinated/impossible claims").
6. **Abandoned sessions:** `LeaderboardEntry.completed?` exists but it's unverified that quitting mid-run is
   excluded from completed metrics or shown separately.
7. **Populated leaderboard on mobile** never viewed (only the empty state).
8. **No CI**, no end-to-end browser tests.
9. **Bundle 680 kB** (items bank is imported at startup); `StatsScreen.tsx` is ~780 lines.
10. **Not yet tested:** real phone, 200–400% zoom, screen reader, full keyboard-only pass, axe contrast sweep.
11. `abstract-art.png` is 578 kB (should be compressed).

---

## 8. Tasks

Each task: **Goal · Files · Steps · Acceptance · Tests · Commit**. Always finish with the quality gate.
IDs are stable — refer to them in commit bodies.

### Phase A — Verification (no code; output `docs/QA_FINDINGS.md`)

For each check record PASS/FAIL, device/browser, and a screenshot path. File each FAIL as a new task.

| ID | Check | Pass criteria |
|---|---|---|
| A1 | Real phone, portrait + landscape | no horizontal scroll, all buttons tappable, no clipped text |
| A2 | Zoom 200% and 400% at 1280 px | content reflows, nothing overlaps, all functions work |
| A3 | Keyboard-only full session | reach results with Tab/Shift+Tab/Enter/Space/Esc + shortcuts; focus always visible |
| A4 | Screen reader (NVDA or VoiceOver) | headings/landmarks sensible; live announcements read; modal announced |
| A5 | Populated leaderboard at 320 px | seed ~20 entries (script in `docs/seed-leaderboard.md`); readable or cleanly scrollable |
| A6 | Quit a 10-question run after 3 | abandoned run labeled, excluded from "completed" metrics and from leaderboards |
| A7 | Label audit: 5 items per concept (180 items) | list every mismatch (item id, current concept, correct concept) |
| A8 | axe DevTools on every screen | list AA failures incl. borders that are the sole control boundary |
| A9 | Direct URL `/leaderboard` on production | loads the app (not a 404) |

### Phase B — Features

**B1 — Fix Phase A failures.** One commit per finding class (`fix(a11y)`, `fix(layout)`), each with a regression test.

**B2 — Session status: completed vs abandoned** *(only if A6 fails; otherwise add the missing test)*
- Files: `src/store/gameStore.ts`, `src/leaderboard/leaderboard.ts`, `src/components/StatsScreen.tsx`,
  new `src/learning/sessions.ts` (session history, key `real-or-ai-wall:sessions:v1`, cap 200 entries).
- Steps: record `{ id, startedAt, mode, roundsTarget, roundsPlayed, status: 'completed'|'abandoned', sourceAccuracy,
  tellAccuracy, calibration, score }` when a session ends or is abandoned (return to attract / idle reset / new
  session started with rounds left). Leaderboards rank `completed` only. Analysis shows abandoned count separately.
- Acceptance: abandoned sessions never appear on any leaderboard or inflate averages; both counts visible in analysis.
- Tests: store (quit at round 3 → one abandoned record, zero leaderboard entries); sessions load/save/corrupt-JSON; UI.
- Commit: `feat(sessions): track completed vs abandoned sessions`

**B3 — Personal improvement metrics** *(depends on B2)*
- Files: new `src/learning/progress.ts`, `StatsScreen.tsx` (or its split components after D2).
- Steps: compare this session to the mean of the previous 5 **completed** sessions for source accuracy, tell
  accuracy and calibration → "Up 8 points vs your last 5 runs". Hide with <2 prior sessions. Label all personal
  numbers "You"; any aggregate across the device is "This device" — never "community".
- Tests: delta math for 0, 1, 2, 5+, negative deltas, ties.
- Commit: `feat(progress): personal improvement vs recent sessions`

**B4 — Preferences object + settings** 
- Files: new `src/prefs/prefs.ts`, new `src/components/SettingsPanel.tsx`, `src/App.tsx`, `src/audio/tone.ts`.
- Shape: `{ version: 1, sound: boolean, motion: 'system'|'reduce'|'full', showNameOnLeaderboard: boolean }`
  under key `real-or-ai-wall:prefs:v1`; safe parse + defaults; migrate nothing (sound had no stored value).
- Steps: persist the mute toggle; `MotionConfig reducedMotion` maps `system→"user"`, `reduce→"always"`,
  `full→"never"`; confetti honours it; settings opens from the top-right controls with a visible label, is a
  proper dialog (focus trap, Esc, restore focus) — reuse the Field Guide pattern; update README "Data" section.
- Tests: load/save/corrupt fallback; motion override beats OS media query; sound persists across reload.
- Commit: `feat(prefs): persisted settings (sound, motion, name privacy)`

**B5 — Share and print privacy** *(depends on B4)*
- Files: `StatsScreen.tsx` share builder, `src/index.css` print rules.
- Steps: share text omits the name unless `showNameOnLeaderboard`; add visible note "This share text contains:
  score, accuracy, calibration — no name"; print view obeys the same.
- Tests: snapshot of share text with name on/off.
- Commit: `feat(share): explicit privacy for share and print`

**B6 — Daily challenge variety**
- File: `src/learning/mastery.ts` (`selectDailyChallengeDeck`), store call site.
- Steps: never serve the exact item ids most recently missed when an alternative exists; for a due concept prefer an
  item of a different `kind`/`category` than the missed one; keep "≤3 review + ≤2 new".
- Tests: fixed rng; never contains a just-missed id when alternatives exist; graceful with a 1-item concept.
- Commit: `feat(learning): vary daily challenge examples`

**B7 — Docs.** Update `README.md` (data stored, prefs, privacy, session history) and `METHODOLOGY.md` (tier rules,
calibration formula, review intervals from 3.5, leaderboard record shape, how legacy records are read).
Commit: `docs: methodology, data and privacy`

**B8 — SPA fallback** *(if A9 fails)*: add `vercel.json` rewrite (see 7.2); verify `/leaderboard` direct load and that
`/assets/*` and `/sw.js` are still served as files. Commit: `fix(deploy): SPA fallback for /leaderboard`

### Phase C — Content (touches only `items.ts`, `fieldGuide.ts`, `assets/images`, tests)

**C1 — Authoring helper.** Add `scripts/missing-enrichment.test-helper` (a vitest "reporter" test or a small node
script run via `npx vitest run <file>`; avoid native-binary tooling) that prints unenriched items grouped by tier
and concept: id, concept, text, current explanation — 50 per run (offset arg via env var). Commit: `chore(content): enrichment report`

**C2 — Enrichment batches (≈487 items, ~10 batches of ~50).** Order: **pro → hard → medium → easy**.
Per item add `evidenceHighlights` (exact substrings), `temptingReason`, `counterexample`:
- one sentence each; plain language; no certainty words; the counterexample must be specific to *this* item
  ("a prompted model can add typos on purpose" is generic filler — prefer item-specific reasons when possible);
- insert after the `difficulty:` line inside the item object; keep file EOL.
- After each batch: gate, spot-check 10 items, then raise the floor in `contentValidation.test.ts`
  (54 → 100 → … → every text item), commit `feat(content): enrich <tier> items <n>–<m>`.
- Final state: replace the "at least 45" test with "all items have all three fields".

**C3 — Concept coverage.** List concepts with <8 items; write ≥8 total per concept across different `category`s and
both `isAI` values; tiers roughly even; **new ids must be unique**; new texts must not duplicate existing ones
(test exists). Add test "every concept has ≥ 8 items". Commit: `feat(content): balance concept coverage`

**C4 — Label corrections.** Apply A7 findings; if a concept definition no longer fits its items, edit the
definition (`fieldGuide.ts`), not the items. Commit: `fix(content): correct concept labels`

**C5 — More images (target 15–20 total).** Licensed sources only (Unsplash License for photos; Wikimedia Commons
for AI-generated samples with `credit`). Each needs neutral `alt` and `caption`, visual `evidenceHighlights`,
`temptingReason`, `counterexample`, and a `SOURCES.md` row. Compress to ≤120 kB (convert `abstract-art.png`).
Commit: `feat(content): add image items`

### Phase D — Engineering

**D1 — CI.** `.github/workflows/ci.yml`: Node 22, `npm ci`, `npx tsc -b`, `npx vitest run`, `npx oxlint`,
`npm run build` on push + PR to `main`; cache npm. Acceptance: a deliberately failing test on a branch turns the
check red. Commit: `ci: add GitHub Actions workflow` *(do this first — it protects everything after)*

**D2 — Split `StatsScreen.tsx` (move-only, no behavior change).** Target:
`components/stats/{LeaderboardView,AnalysisView,SessionSummary,MasteryOverview,StatCard}.tsx`.
Keep props identical; run tests after each extraction; no new features in this commit.
Commit: `refactor(stats): split StatsScreen into components`

**D3 — Lazy-load the item bank (do alone; riskiest).**
- Problem: `export const useGameStore = createGameStore(ITEMS)` imports all items at startup.
- Steps: make the default store obtain items via `import('./data/items')` on first start (loading state on
  "Start"/practice buttons); Field Guide/Attract must not import items (give the Attract sample-quote card a tiny
  static fallback list); tests keep injecting fixtures.
- Acceptance: main chunk < 500 kB in `npm run build`; offline play still works (E2).
- Commit: `perf: code-split the question bank`

**D4 — Playwright e2e.** `@playwright/test`, `e2e/`: full playthrough; abandoned session; Field Guide focus trap +
restore; all shortcuts; 320 px no-overflow; reduced-motion emulation. Chromium only; run in CI on PRs.
Note: the Windows Application Control issue may block native binaries locally — if so, run e2e in CI only and say so.
Commit: `test(e2e): playwright suite`

**D5 — Contrast follow-ups.** Apply A8 findings. Rule: raise a border only where it is the sole indicator of a
control; leave decorative card edges alone to protect the visual identity. Commit: `fix(a11y): contrast follow-ups`

### Phase E — Release verification (no code unless something fails)

| ID | Step | Pass criteria |
|---|---|---|
| E1 | Deploy `main`; open in a browser holding the old SW | new build on a normal reload, no hard refresh |
| E2 | Offline test after one load | airplane mode still plays a round |
| E3 | Re-run A1–A9 on production | no regressions |
| E4 | Lighthouse mobile | Accessibility ≥ 95, Best Practices ≥ 95 |
| E5 | Update README "Known limits"; `git tag v1.0.0` | tag exists (push only if told to) |

---

## 9. Parallelisation and ownership (to avoid merge conflicts)

| Stream | Tasks | Owns (files) | Must not touch |
|---|---|---|---|
| **Content** | C1–C5 | `src/data/items.ts`, `src/character/fieldGuide.ts`, `src/assets/images/*`, `src/data/contentValidation.test.ts` | any `.tsx`, store, scoring |
| **Features** | B2–B8 | `src/store/*`, `src/learning/*`, `src/leaderboard/*`, `src/prefs/*`, components | `items.ts`, `fieldGuide.ts` |
| **Platform** | D1, D4 | `.github/*`, `e2e/*`, `package.json` (devDependencies only) | app source |
| **Refactor** | D2, D3 | `src/components/stats/*`, `src/store/gameStore.ts` entry | start **only after B2–B5 are merged** (they edit `StatsScreen.tsx`/store) |
| **QA** | A*, E* | `docs/QA_FINDINGS.md` | source |

Hard ordering: **D1 first.** B2 → B3 → B5 (B5 also needs B4). D2 after B2/B3/B5. D3 last of the code tasks.
C-stream is independent of everything else; several agents can split C2 by tier (pro / hard / medium / easy) as
long as they edit different line ranges — **rebase before committing** and re-run `contentValidation.test.ts`.

## 10. Definition of done (per task)

1. Acceptance criteria in the task are met.
2. New behavior has tests; a bug fix has a regression test that failed before the fix.
3. Quality gate green (`tsc`, `vitest`, `oxlint` with zero warnings, `build`).
4. No certainty claims in copy; banned-phrase test passes.
5. Visual identity unchanged (tokens, fonts, card layout).
6. Keyboard shortcuts still work (section 4) and no new element is mouse-only.
7. One focused Conventional Commit per task, with the trailer from section 5. **Do not push unless told.**
8. If you discover a new problem, don't fix it silently — add it to section 7 of this file in your commit.

## 11. Quick commands

```
npm install                 # first time
npm run dev                 # vite dev (use --port/--host flags if 5173 is taken)
npx vitest run              # all tests once
npx vitest run src/path     # one file
npx tsc -b                  # type check
npx oxlint                  # lint (must be zero warnings)
npm run build               # tsc -b && vite build
npx vite preview            # serve the production build (this one registers the service worker)
```
