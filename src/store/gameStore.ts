import { create, type UseBoundStore, type StoreApi } from 'zustand';
import type { Item, Difficulty } from '../data/types';
import { ITEMS } from '../data/items';
import { createDeck, type Deck } from '../game/deck';
import { createStats, applyGuess, hitMilestone, DIFFICULTY_POINTS, type Stats } from '../game/scoring';

export type Screen = 'attract' | 'select' | 'playing' | 'revealed' | 'stats';

export interface GameState {
  screen: Screen;
  difficulty: Difficulty | null;
  current: Item | null;
  stats: Stats;
  lastGuessCorrect: boolean | null;
  milestoneHit: boolean;
  guessSeq: number;
  goToSelect: () => void;
  startRound: (difficulty: Difficulty) => void;
  guess: (guess: 'human' | 'ai') => void;
  next: () => void;
  showStats: () => void;
  returnToAttract: () => void;
}

export function createGameStore(
  items: Item[],
  rng: () => number = Math.random
): UseBoundStore<StoreApi<GameState>> {
  let deck: Deck<Item> | null = null;

  return create<GameState>((set, get) => ({
    screen: 'attract',
    difficulty: null,
    current: null,
    stats: createStats(),
    lastGuessCorrect: null,
    milestoneHit: false,
    guessSeq: 0,

    goToSelect: () => {
      set({ screen: 'select' });
    },

    startRound: (difficulty: Difficulty) => {
      const pool = items.filter((i) => i.difficulty === difficulty);
      deck = createDeck(pool.length > 0 ? pool : items, rng);
      const firstItem = deck.next();
      set({
        screen: 'playing',
        difficulty,
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
      const points = state.difficulty ? DIFFICULTY_POINTS[state.difficulty] : 1;
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

      if (state.stats.roundsPlayed > 0 && state.stats.roundsPlayed % 10 === 0) {
        set({
          screen: 'stats',
          milestoneHit: false,
        });
        return;
      }

      if (!deck) {
        const pool = state.difficulty ? items.filter((i) => i.difficulty === state.difficulty) : items;
        deck = createDeck(pool.length > 0 ? pool : items, rng);
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
        difficulty: null,
        current: null,
        stats: createStats(),
        lastGuessCorrect: null,
        milestoneHit: false,
      });
    },
  }));
}

export const useGameStore = createGameStore(ITEMS);
