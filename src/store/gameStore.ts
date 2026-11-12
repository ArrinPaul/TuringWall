import { create, type UseBoundStore, type StoreApi } from 'zustand';
import type { Item, SessionMode } from '../data/types';
import { ITEMS } from '../data/items';
import { createDeck, type Deck } from '../game/deck';
import { createStats, applyGuess, hitMilestone, accuracyPercent, DIFFICULTY_POINTS, type Stats } from '../game/scoring';
import { addEntry } from '../leaderboard/leaderboard';

export type Screen = 'attract' | 'select' | 'playing' | 'revealed' | 'stats';

export const ROUNDS_OPTIONS = [5, 10] as const;
export const DEFAULT_ROUNDS = 10;

export interface GameState {
  screen: Screen;
  playerName: string;
  difficulty: SessionMode | null;
  roundsTarget: number;
  clearedModes: SessionMode[];
  current: Item | null;
  stats: Stats;
  lastGuessCorrect: boolean | null;
  milestoneHit: boolean;
  guessSeq: number;
  setPlayerName: (name: string) => void;
  setRoundsTarget: (n: number) => void;
  goToSelect: () => void;
  startRound: (mode: SessionMode) => void;
  guess: (guess: 'human' | 'ai') => void;
  next: () => void;
  showStats: () => void;
  returnToAttract: () => void;
}

function poolFor(items: Item[], mode: SessionMode): Item[] {
  if (mode === 'mixed') return items;
  const filtered = items.filter((i) => i.difficulty === mode);
  return filtered.length > 0 ? filtered : items;
}

export function createGameStore(
  items: Item[],
  rng: () => number = Math.random
): UseBoundStore<StoreApi<GameState>> {
  let deck: Deck<Item> | null = null;

  return create<GameState>((set, get) => ({
    screen: 'attract',
    playerName: '',
    difficulty: null,
    roundsTarget: DEFAULT_ROUNDS,
    clearedModes: [],
    current: null,
    stats: createStats(),
    lastGuessCorrect: null,
    milestoneHit: false,
    guessSeq: 0,

    setPlayerName: (name: string) => {
      set({ playerName: name });
    },

    setRoundsTarget: (n: number) => {
      set({ roundsTarget: n });
    },

    goToSelect: () => {
      set({ screen: 'select' });
    },

    startRound: (mode: SessionMode) => {
      deck = createDeck(poolFor(items, mode), rng);
      const firstItem = deck.next();
      set({
        screen: 'playing',
        difficulty: mode,
        current: firstItem,
        stats: createStats(),
        lastGuessCorrect: null,
        milestoneHit: false,
      });
    },

    guess: (g: 'human' | 'ai') => {
      const state = get();
      if (state.screen !== 'playing' || !state.current) {
        return;
      }

      const correct = (g === 'ai') === state.current.isAI;
      const prevStreak = state.stats.streak;
      // Points come from the item's own tier, not the session mode, so a
      // Mixed session still rewards a hard item more than an easy one.
      const points = DIFFICULTY_POINTS[state.current.difficulty];
      const nextStats = applyGuess(state.stats, correct, points);
      const isMilestone = hitMilestone(prevStreak, nextStats.streak);

      set({
        stats: nextStats,
        lastGuessCorrect: correct,
        milestoneHit: isMilestone,
        guessSeq: state.guessSeq + 1,
        screen: 'revealed',
      });
    },

    next: () => {
      const state = get();
      if (state.screen !== 'revealed') {
        return;
      }

      if (state.stats.roundsPlayed > 0 && state.stats.roundsPlayed % state.roundsTarget === 0) {
        if (state.difficulty) {
          addEntry({
            name: state.playerName.trim() || 'Anonymous',
            difficulty: state.difficulty,
            score: state.stats.score,
            accuracy: accuracyPercent(state.stats),
            bestStreak: state.stats.bestStreak,
            timestamp: Date.now(),
          });
        }
        set({
          screen: 'stats',
          milestoneHit: false,
          clearedModes: state.difficulty && !state.clearedModes.includes(state.difficulty)
            ? [...state.clearedModes, state.difficulty]
            : state.clearedModes,
        });
        return;
      }

      if (!deck) {
        deck = createDeck(state.difficulty ? poolFor(items, state.difficulty) : items, rng);
      }
      const nextItem = deck.next();

      set({
        screen: 'playing',
        current: nextItem,
        milestoneHit: false,
      });
    },

    showStats: () => {
      set({ screen: 'stats' });
    },

    returnToAttract: () => {
      deck = null;
      set({
        screen: 'attract',
        playerName: '',
        difficulty: null,
        roundsTarget: DEFAULT_ROUNDS,
        clearedModes: [],
        current: null,
        stats: createStats(),
        lastGuessCorrect: null,
        milestoneHit: false,
      });
    },
  }));
}

export const useGameStore = createGameStore(ITEMS);
