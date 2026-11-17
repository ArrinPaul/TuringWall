import { create, type UseBoundStore, type StoreApi } from 'zustand';
import type { Item, SessionMode } from '../data/types';
import { createDeck, type Deck } from '../game/deck';
import {
  createStats,
  applyDetailedGuess,
  calculateRoundPoints,
  hitMilestone,
  accuracyPercent,
  calculateCalibrationScore,
  type Stats,
} from '../game/scoring';
import { addEntry, loadLeaderboard, type SessionLength } from '../leaderboard/leaderboard';
import { recordSession } from '../learning/sessions';
import type {
  ConfidenceLevel,
  PredictionChoice,
  PracticeMode,
  RoundResult,
} from '../learning/types';
import {
  loadMastery,
  saveMastery,
  loadMissedQuestionIds,
  saveMissedQuestionIds,
  applyRoundToMastery,
  selectWeakTellsDeck,
  selectMissedQuestionsDeck,
  selectDailyChallengeDeck,
  type MasteryMap,
} from '../learning/mastery';
import { getCandidateTells } from '../character/fieldGuide';

export type Screen = 'attract' | 'select' | 'playing' | 'revealed' | 'stats' | 'loading';

export const ROUNDS_OPTIONS = [3, 5, 7, 10] as const satisfies readonly SessionLength[];
export const DEFAULT_ROUNDS: SessionLength = 10;

export interface GameState {
  screen: Screen;
  playerName: string;
  difficulty: SessionMode | null;
  practiceMode: PracticeMode | null;
  roundsTarget: SessionLength;
  clearedModes: SessionMode[];
  current: Item | null;
  candidateTells: string[];
  stats: Stats;
  lastGuessCorrect: boolean | null;
  lastRoundResult: RoundResult | null;
  milestoneHit: boolean;
  masteryMap: MasteryMap;
  missedQuestionIds: string[];
  /** Set once a completed session's score beats every prior score on this same length+tier board. */
  newPersonalBest: boolean;
  /** True once this session's result has been written to the leaderboard — guards against double-saving. */
  sessionSaved: boolean;
  guessSeq: number;
  /** Unique concept tags encountered this session, in first-seen order — the session's "syllabus". */
  conceptsSeen: string[];
  sessionId: string;
  sessionStartedAt: number;
  setPlayerName: (name: string) => void;
  setRoundsTarget: (n: SessionLength) => void;
  goToSelect: () => void;
  startRound: (mode: PracticeMode) => void;
  startTellPractice: (concept: string) => void;
  guess: (guess: 'human' | 'ai') => void;
  detailedGuess: (
    prediction: PredictionChoice,
    confidence: ConfidenceLevel,
    selectedTell: string | null
  ) => void;
  next: () => void;
  showStats: () => void;
  replayMissedSession: () => void;
  returnToAttract: () => void;
  preloadItems: () => Promise<Item[]>;
}

function poolFor(items: Item[], mode: PracticeMode, masteryMap: MasteryMap, missedIds: string[]): Item[] {
  if (mode === 'daily-challenge') {
    return selectDailyChallengeDeck(items, masteryMap, 5, Math.random, missedIds);
  }
  if (mode === 'weak-tells') {
    return selectWeakTellsDeck(items, masteryMap, 10);
  }
  if (mode === 'review-missed') {
    return selectMissedQuestionsDeck(items, missedIds, 10);
  }
  if (mode === 'mixed') return items;
  const filtered = items.filter((i) => i.difficulty === mode);
  return filtered.length > 0 ? filtered : items;
}

interface FinalizePatch {
  sessionSaved: true;
  newPersonalBest: boolean;
  clearedModes: SessionMode[];
}

function recordAbandonedIfMidSession(state: GameState): void {
  if (
    state.stats.roundsPlayed > 0 &&
    state.stats.roundsPlayed < state.roundsTarget &&
    !state.sessionSaved &&
    state.sessionId
  ) {
    const tellAcc =
      state.stats.roundsPlayed > 0
        ? Math.round(((state.stats.tellCorrectCount ?? 0) / state.stats.roundsPlayed) * 100)
        : 0;
    const calScore = calculateCalibrationScore(state.stats.results || []);
    recordSession({
      id: state.sessionId,
      startedAt: state.sessionStartedAt || Date.now(),
      mode: state.difficulty || 'mixed',
      roundsTarget: state.roundsTarget,
      roundsPlayed: state.stats.roundsPlayed,
      status: 'abandoned',
      sourceAccuracy: accuracyPercent(state.stats),
      tellAccuracy: tellAcc,
      calibration: calScore,
      score: state.stats.score,
    });
  }
}

function finalizeSessionIfComplete(state: GameState): FinalizePatch | null {
  if (state.sessionSaved) return null;
  if (state.stats.roundsPlayed < state.roundsTarget) return null;
  if (!state.difficulty) return null;

  const priorSameTier = loadLeaderboard(state.roundsTarget).filter((e) => e.difficulty === state.difficulty);
  const priorBest = priorSameTier.length > 0 ? Math.max(...priorSameTier.map((e) => e.score)) : null;
  const isNewBest = priorBest !== null && state.stats.score > priorBest;

  addEntry({
    name: state.playerName.trim() || 'Anonymous',
    difficulty: state.difficulty,
    score: state.stats.score,
    accuracy: accuracyPercent(state.stats),
    bestStreak: state.stats.bestStreak,
    timestamp: Date.now(),
    roundsTarget: state.roundsTarget,
    completed: true,
  });

  if (state.sessionId) {
    const tellAcc =
      state.stats.roundsPlayed > 0
        ? Math.round(((state.stats.tellCorrectCount ?? 0) / state.stats.roundsPlayed) * 100)
        : 0;
    const calScore = calculateCalibrationScore(state.stats.results || []);
    recordSession({
      id: state.sessionId,
      startedAt: state.sessionStartedAt || Date.now(),
      mode: state.difficulty,
      roundsTarget: state.roundsTarget,
      roundsPlayed: state.stats.roundsPlayed,
      status: 'completed',
      sourceAccuracy: accuracyPercent(state.stats),
      tellAccuracy: tellAcc,
      calibration: calScore,
      score: state.stats.score,
    });
  }

  return {
    sessionSaved: true,
    newPersonalBest: isNewBest,
    clearedModes:
      state.difficulty && !state.clearedModes.includes(state.difficulty)
        ? [...state.clearedModes, state.difficulty]
        : state.clearedModes,
  };
}

export type ItemsProvider = Item[] | (() => Promise<Item[]>);

export function createGameStore(
  itemsProvider: ItemsProvider,
  rng: () => number = Math.random
): UseBoundStore<StoreApi<GameState>> {
  let deck: Deck<Item> | null = null;
  let cachedItems: Item[] | null = Array.isArray(itemsProvider) ? itemsProvider : null;
  let loadingPromise: Promise<Item[]> | null = null;

  const ensureItems = (): Promise<Item[]> => {
    if (cachedItems) return Promise.resolve(cachedItems);
    if (loadingPromise) return loadingPromise;
    if (typeof itemsProvider === 'function') {
      loadingPromise = itemsProvider().then((loaded) => {
        cachedItems = loaded;
        loadingPromise = null;
        return loaded;
      });
      return loadingPromise;
    }
    cachedItems = itemsProvider;
    return Promise.resolve(cachedItems);
  };

  return create<GameState>((set, get) => ({
    screen: 'attract',
    playerName: '',
    difficulty: null,
    practiceMode: null,
    roundsTarget: DEFAULT_ROUNDS,
    clearedModes: [],
    current: null,
    candidateTells: [],
    stats: createStats(true),
    lastGuessCorrect: null,
    lastRoundResult: null,
    milestoneHit: false,
    masteryMap: loadMastery(),
    missedQuestionIds: loadMissedQuestionIds(),
    newPersonalBest: false,
    sessionSaved: false,
    guessSeq: 0,
    conceptsSeen: [],
    sessionId: '',
    sessionStartedAt: 0,

    preloadItems: () => ensureItems(),

    setPlayerName: (name: string) => {
      set({ playerName: name });
    },

    setRoundsTarget: (n: SessionLength) => {
      set({ roundsTarget: n });
    },

    goToSelect: () => {
      recordAbandonedIfMidSession(get());
      void ensureItems();
      set({ screen: 'select' });
    },

    startRound: (mode: PracticeMode) => {
      const state = get();
      recordAbandonedIfMidSession(state);

      const setupDeckAndPlay = (loadedItems: Item[]) => {
        const isSpecialPractice =
          mode === 'daily-challenge' || mode === 'weak-tells' || mode === 'review-missed';
        const targetRounds = mode === 'daily-challenge' ? 5 : get().roundsTarget;

        const itemsPool = poolFor(loadedItems, mode, get().masteryMap, get().missedQuestionIds);
        deck = createDeck(itemsPool, rng);
        const firstItem = deck.next();
        const candidateTells = firstItem ? getCandidateTells(firstItem.concept, 4, rng) : [];

        const sessionDifficulty: SessionMode | null = isSpecialPractice ? 'mixed' : (mode as SessionMode);
        const now = Date.now();
        const newSessionId = `sess_${now}_${Math.floor(rng() * 1000000)}`;

        set({
          screen: 'playing',
          sessionId: newSessionId,
          sessionStartedAt: now,
          difficulty: sessionDifficulty,
          practiceMode: mode,
          roundsTarget: targetRounds as SessionLength,
          current: firstItem,
          candidateTells,
          stats: createStats(true),
          lastGuessCorrect: null,
          lastRoundResult: null,
          milestoneHit: false,
          newPersonalBest: false,
          sessionSaved: false,
          conceptsSeen: [],
        });
      };

      if (cachedItems) {
        setupDeckAndPlay(cachedItems);
      } else {
        set({ screen: 'loading' });
        void ensureItems().then(setupDeckAndPlay);
      }
    },

    startTellPractice: (concept: string) => {
      const state = get();
      recordAbandonedIfMidSession(state);

      const setupPracticeAndPlay = (loadedItems: Item[]) => {
        const matchingItems = loadedItems.filter((i) => i.concept === concept);
        const pool = matchingItems.length > 0 ? matchingItems : loadedItems;
        deck = createDeck(pool, rng);
        const firstItem = deck.next();
        const candidateTells = firstItem ? getCandidateTells(firstItem.concept, 4, rng) : [];
        const now = Date.now();
        const newSessionId = `sess_${now}_${Math.floor(rng() * 1000000)}`;

        set({
          screen: 'playing',
          sessionId: newSessionId,
          sessionStartedAt: now,
          difficulty: 'mixed',
          practiceMode: 'weak-tells',
          roundsTarget: 5,
          current: firstItem,
          candidateTells,
          stats: createStats(true),
          lastGuessCorrect: null,
          lastRoundResult: null,
          milestoneHit: false,
          newPersonalBest: false,
          sessionSaved: false,
          conceptsSeen: [],
        });
      };

      if (cachedItems) {
        setupPracticeAndPlay(cachedItems);
      } else {
        set({ screen: 'loading' });
        void ensureItems().then(setupPracticeAndPlay);
      }
    },

    detailedGuess: (
      prediction: PredictionChoice,
      confidence: ConfidenceLevel = 'medium',
      selectedTell: string | null = null
    ) => {
      const state = get();
      if (state.screen !== 'playing' || !state.current) {
        return;
      }

      const isUnsure = prediction === 'unsure';
      const actualSource: 'human' | 'ai' = state.current.isAI ? 'ai' : 'human';
      const isCorrect = !isUnsure && prediction === actualSource;
      const tellCorrect = Boolean(selectedTell && selectedTell === state.current.concept);
      const points = calculateRoundPoints(
        state.current.difficulty,
        isCorrect,
        isUnsure,
        confidence,
        tellCorrect
      );

      const roundResult: RoundResult = {
        itemId: state.current.id,
        concept: state.current.concept,
        difficulty: state.current.difficulty,
        category: state.current.category,
        prediction,
        actualSource,
        isCorrect,
        isUnsure,
        confidence,
        selectedTell,
        tellCorrect,
        pointsAwarded: points,
        timestamp: Date.now(),
      };

      const prevStreak = state.stats.streak;
      const nextStats = applyDetailedGuess(state.stats, roundResult);
      const isMilestone = hitMilestone(prevStreak, nextStats.streak);

      // Update mastery and missed questions
      const { nextMap } = applyRoundToMastery(state.masteryMap, roundResult);
      saveMastery(nextMap);

      let nextMissed = state.missedQuestionIds;
      if (!isCorrect && !isUnsure) {
        if (!nextMissed.includes(state.current.id)) {
          nextMissed = [...nextMissed, state.current.id];
          saveMissedQuestionIds(nextMissed);
        }
      } else if (isCorrect) {
        nextMissed = nextMissed.filter((id) => id !== state.current?.id);
        saveMissedQuestionIds(nextMissed);
      }

      set({
        stats: nextStats,
        lastGuessCorrect: isCorrect,
        lastRoundResult: roundResult,
        milestoneHit: isMilestone,
        masteryMap: nextMap,
        missedQuestionIds: nextMissed,
        guessSeq: state.guessSeq + 1,
        screen: 'revealed',
        conceptsSeen: state.conceptsSeen.includes(state.current.concept)
          ? state.conceptsSeen
          : [...state.conceptsSeen, state.current.concept],
      });
    },

    guess: (g: 'human' | 'ai') => {
      get().detailedGuess(g, 'medium', null);
    },

    next: () => {
      const state = get();
      if (state.screen !== 'revealed') {
        return;
      }

      if (state.stats.roundsPlayed > 0 && state.stats.roundsPlayed % state.roundsTarget === 0) {
        const patch = finalizeSessionIfComplete(state);
        set({
          screen: 'stats',
          milestoneHit: false,
          ...(patch ?? {}),
        });
        return;
      }

      if (!deck) {
        const fallbackItems = cachedItems ?? [];
        const fallbackPool = poolFor(
          fallbackItems,
          state.practiceMode || state.difficulty || 'mixed',
          state.masteryMap,
          state.missedQuestionIds
        );
        deck = createDeck(fallbackPool, rng);
      }

      const nextItem = deck.next();
      const candidateTells = nextItem ? getCandidateTells(nextItem.concept, 4, rng) : [];

      set({
        screen: 'playing',
        current: nextItem,
        candidateTells,
        lastRoundResult: null,
        milestoneHit: false,
      });
    },

    showStats: () => {
      const state = get();
      recordAbandonedIfMidSession(state);
      const patch = finalizeSessionIfComplete(state);
      set({ screen: 'stats', ...(patch ?? {}) });
    },

    replayMissedSession: () => {
      const state = get();
      state.startRound('review-missed');
    },

    returnToAttract: () => {
      recordAbandonedIfMidSession(get());
      deck = null;
      set({
        screen: 'attract',
        sessionId: '',
        sessionStartedAt: 0,
        playerName: '',
        difficulty: null,
        practiceMode: null,
        roundsTarget: DEFAULT_ROUNDS,
        clearedModes: [],
        current: null,
        candidateTells: [],
        stats: createStats(true),
        lastGuessCorrect: null,
        lastRoundResult: null,
        milestoneHit: false,
        newPersonalBest: false,
        sessionSaved: false,
        conceptsSeen: [],
      });
    },
  }));
}

export const useGameStore = createGameStore(() =>
  import('../data/items').then((m) => m.ITEMS)
);
