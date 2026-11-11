import { create, type UseBoundStore, type StoreApi } from 'zustand';
import type { Item } from '../data/types';
import { ITEMS } from '../data/items';
import { createDeck, type Deck } from '../game/deck';
import { createStats, applyGuess, hitMilestone, type Stats } from '../game/scoring';

export type Screen = 'attract' | 'playing' | 'revealed' | 'stats';

export interface GameState {
  screen: Screen;
  current: Item | null;
  stats: Stats;
  lastGuessCorrect: boolean | null;
  milestoneHit: boolean;
  guessSeq: number;
  startRound: () => void;
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
    current: null,
    stats: createStats(),
    lastGuessCorrect: null,
    milestoneHit: false,
    guessSeq: 0,

    startRound: () => {
      deck = createDeck(items, rng);
      const firstItem = deck.next();
      set({
        screen: 'playing',
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
      const nextStats = applyGuess(state.stats, correct);
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
        deck = createDeck(items, rng);
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
      set({
        screen: 'attract',
        current: null,
        stats: createStats(),
        lastGuessCorrect: null,
        milestoneHit: false,
      });
    },
  }));
}

export const useGameStore = createGameStore(ITEMS);
