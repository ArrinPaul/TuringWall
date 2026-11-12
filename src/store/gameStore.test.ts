import { describe, it, expect, beforeEach } from 'vitest';
import { createGameStore } from './gameStore';
import { loadLeaderboard } from '../leaderboard/leaderboard';

const fixtureItems = [
  { id: 'a', kind: 'text' as const, text: 'A', isAI: false, explanation: 'x', concept: 'c', difficulty: 'easy' as const },
  { id: 'b', kind: 'text' as const, text: 'B', isAI: true, explanation: 'x', concept: 'c', difficulty: 'easy' as const },
  { id: 'c', kind: 'text' as const, text: 'C', isAI: true, explanation: 'x', concept: 'c', difficulty: 'pro' as const },
];

describe('gameStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts on the attract screen', () => {
    const store = createGameStore(fixtureItems);
    expect(store.getState().screen).toBe('attract');
  });

  it('goToSelect moves from attract to the difficulty select screen', () => {
    const store = createGameStore(fixtureItems);
    store.getState().goToSelect();
    expect(store.getState().screen).toBe('select');
  });

  it('startRound(difficulty) moves to playing with a fresh zeroed stats and an item from that tier only', () => {
    const store = createGameStore(fixtureItems);
    store.getState().startRound('easy');
    const s = store.getState();
    expect(s.screen).toBe('playing');
    expect(s.difficulty).toBe('easy');
    expect(s.stats.roundsPlayed).toBe(0);
    expect(['a', 'b']).toContain(s.current?.id);
  });

  it('guess() while not on the playing screen is a no-op', () => {
    const store = createGameStore(fixtureItems);
    store.getState().guess('human');
    expect(store.getState().screen).toBe('attract');
    expect(store.getState().guessSeq).toBe(0);
  });

  it('a correct guess updates stats and moves to revealed, an incorrect guess also moves to revealed', () => {
    const store = createGameStore(fixtureItems, () => 0);
    store.getState().startRound('easy');
    const current = store.getState().current!;
    store.getState().guess(current.isAI ? 'ai' : 'human');
    const s = store.getState();
    expect(s.screen).toBe('revealed');
    expect(s.lastGuessCorrect).toBe(true);
    expect(s.stats.roundsPlayed).toBe(1);
    expect(s.guessSeq).toBe(1);
  });

  it('a correct guess on the pro tier awards more points than easy', () => {
    const store = createGameStore(fixtureItems, () => 0);
    store.getState().startRound('pro');
    const current = store.getState().current!;
    store.getState().guess(current.isAI ? 'ai' : 'human');
    expect(store.getState().stats.score).toBeGreaterThan(1);
  });

  it('next() while not on the revealed screen is a no-op', () => {
    const store = createGameStore(fixtureItems);
    store.getState().next();
    expect(store.getState().screen).toBe('attract');
  });

  it('next() after the 10th round routes to the stats screen', () => {
    const store = createGameStore(fixtureItems, () => 0);
    store.getState().startRound('easy');
    for (let i = 0; i < 10; i++) {
      const current = store.getState().current!;
      store.getState().guess(current.isAI ? 'ai' : 'human');
      store.getState().next();
    }
    expect(store.getState().screen).toBe('stats');
  });

  it('completing a 10-round session records a leaderboard entry under the player name', () => {
    const store = createGameStore(fixtureItems, () => 0);
    store.getState().setPlayerName('Rin');
    store.getState().startRound('easy');
    for (let i = 0; i < 10; i++) {
      const current = store.getState().current!;
      store.getState().guess(current.isAI ? 'ai' : 'human');
      store.getState().next();
    }
    const board = loadLeaderboard();
    expect(board).toHaveLength(1);
    expect(board[0].name).toBe('Rin');
    expect(board[0].difficulty).toBe('easy');
    // All 10 guesses are correct (guessing each item's real isAI), easy tier = 1 point each.
    expect(board[0].score).toBe(10);
  });

  it('falls back to "Anonymous" when no name was entered', () => {
    const store = createGameStore(fixtureItems, () => 0);
    store.getState().startRound('easy');
    for (let i = 0; i < 10; i++) {
      const current = store.getState().current!;
      store.getState().guess(current.isAI ? 'ai' : 'human');
      store.getState().next();
    }
    expect(loadLeaderboard()[0].name).toBe('Anonymous');
  });

  it('returnToAttract resets the screen to attract, clears the difficulty, and clears the player name', () => {
    const store = createGameStore(fixtureItems);
    store.getState().setPlayerName('Rin');
    store.getState().startRound('easy');
    store.getState().returnToAttract();
    expect(store.getState().screen).toBe('attract');
    expect(store.getState().difficulty).toBeNull();
    expect(store.getState().playerName).toBe('');
  });
});
