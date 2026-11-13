import { describe, it, expect, beforeEach } from 'vitest';
import { createGameStore } from './gameStore';
import { loadLeaderboard } from '../leaderboard/leaderboard';

const fixtureItems = [
  { id: 'a', kind: 'text' as const, text: 'A', isAI: false, explanation: 'x', concept: 'concept-a', difficulty: 'easy' as const },
  { id: 'b', kind: 'text' as const, text: 'B', isAI: true, explanation: 'x', concept: 'concept-b', difficulty: 'easy' as const },
  { id: 'c', kind: 'text' as const, text: 'C', isAI: true, explanation: 'x', concept: 'concept-a', difficulty: 'pro' as const },
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
    const board = loadLeaderboard(10);
    expect(board).toHaveLength(1);
    expect(board[0].name).toBe('Rin');
    expect(board[0].difficulty).toBe('easy');
    expect(board[0].roundsTarget).toBe(10);
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
    expect(loadLeaderboard(10)[0].name).toBe('Anonymous');
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

  it('returnToAttract resets roundsTarget back to the 10-round default', () => {
    const store = createGameStore(fixtureItems);
    store.getState().setRoundsTarget(5);
    store.getState().returnToAttract();
    expect(store.getState().roundsTarget).toBe(10);
  });

  it('setRoundsTarget(5) makes a session end, and record a leaderboard entry, after 5 rounds', () => {
    const store = createGameStore(fixtureItems, () => 0);
    store.getState().setRoundsTarget(5);
    store.getState().startRound('easy');
    for (let i = 0; i < 5; i++) {
      const current = store.getState().current!;
      store.getState().guess(current.isAI ? 'ai' : 'human');
      store.getState().next();
    }
    expect(store.getState().screen).toBe('stats');
    expect(loadLeaderboard(5)).toHaveLength(1);
    expect(loadLeaderboard(10)).toHaveLength(0);
  });

  it('separates leaderboard entries by session length — a 5-round run never lands on the 10-round board', () => {
    const store = createGameStore(fixtureItems, () => 0);
    store.getState().setRoundsTarget(5);
    store.getState().startRound('easy');
    for (let i = 0; i < 5; i++) {
      const current = store.getState().current!;
      store.getState().guess(current.isAI ? 'ai' : 'human');
      store.getState().next();
    }
    store.getState().returnToAttract();
    store.getState().startRound('easy');
    for (let i = 0; i < 10; i++) {
      const current = store.getState().current!;
      store.getState().guess(current.isAI ? 'ai' : 'human');
      store.getState().next();
    }
    expect(loadLeaderboard(5)).toHaveLength(1);
    expect(loadLeaderboard(10)).toHaveLength(1);
    expect(loadLeaderboard(5)[0].roundsTarget).toBe(5);
    expect(loadLeaderboard(10)[0].roundsTarget).toBe(10);
  });

  it('flags newPersonalBest only when this session beats a prior score on the same length+tier board', () => {
    const store = createGameStore(fixtureItems, () => 0);
    store.getState().setRoundsTarget(3);
    store.getState().startRound('easy');
    for (let i = 0; i < 3; i++) {
      const current = store.getState().current!;
      store.getState().guess(current.isAI ? 'ai' : 'human');
      store.getState().next();
    }
    // First-ever clear of this tier/length: nothing to beat yet.
    expect(store.getState().newPersonalBest).toBe(false);

    store.getState().returnToAttract();
    store.getState().setRoundsTarget(3);
    store.getState().startRound('easy');
    for (let i = 0; i < 3; i++) {
      const current = store.getState().current!;
      store.getState().guess(current.isAI ? 'ai' : 'human');
      store.getState().next();
    }
    // Same perfect score as before (tie), not strictly a new best.
    expect(store.getState().newPersonalBest).toBe(false);
  });

  it('startRound("mixed") draws from every tier, and each guess is worth its own item’s points', () => {
    const store = createGameStore(fixtureItems, () => 0);
    store.getState().startRound('mixed');
    expect(store.getState().difficulty).toBe('mixed');
    expect(['a', 'b', 'c']).toContain(store.getState().current?.id);

    // Drive to the 'pro' item (id 'c') and confirm it scores more than an easy item would.
    let current = store.getState().current!;
    while (current.id !== 'c') {
      store.getState().guess(current.isAI ? 'ai' : 'human');
      store.getState().next();
      current = store.getState().current!;
    }
    const scoreBefore = store.getState().stats.score;
    store.getState().guess(current.isAI ? 'ai' : 'human');
    expect(store.getState().stats.score - scoreBefore).toBeGreaterThan(1);
  });

  it('marks a mode as cleared only once a full session in it completes', () => {
    const store = createGameStore(fixtureItems, () => 0);
    store.getState().setRoundsTarget(5);
    expect(store.getState().clearedModes).toEqual([]);
    store.getState().startRound('easy');
    for (let i = 0; i < 5; i++) {
      const current = store.getState().current!;
      store.getState().guess(current.isAI ? 'ai' : 'human');
      store.getState().next();
    }
    expect(store.getState().clearedModes).toEqual(['easy']);
  });

  it('conceptsSeen accumulates unique concepts across guesses, in first-seen order, with no duplicates', () => {
    const store = createGameStore(fixtureItems, () => 0);
    store.getState().startRound('easy'); // pool: 'a' (concept-a), 'b' (concept-b)
    expect(store.getState().conceptsSeen).toEqual([]);

    let current = store.getState().current!;
    store.getState().guess(current.isAI ? 'ai' : 'human');
    expect(store.getState().conceptsSeen).toEqual([current.concept]);

    store.getState().next();
    current = store.getState().current!;
    store.getState().guess(current.isAI ? 'ai' : 'human');
    expect(store.getState().conceptsSeen.sort()).toEqual(['concept-a', 'concept-b']);

    // Third guess exhausts and reshuffles the 2-item pool, so the concept repeats — must not duplicate.
    store.getState().next();
    current = store.getState().current!;
    store.getState().guess(current.isAI ? 'ai' : 'human');
    expect(store.getState().conceptsSeen.sort()).toEqual(['concept-a', 'concept-b']);
  });

  it('conceptsSeen resets on a new round and on returnToAttract', () => {
    const store = createGameStore(fixtureItems, () => 0);
    store.getState().startRound('easy');
    const current = store.getState().current!;
    store.getState().guess(current.isAI ? 'ai' : 'human');
    expect(store.getState().conceptsSeen.length).toBe(1);

    store.getState().startRound('easy');
    expect(store.getState().conceptsSeen).toEqual([]);

    const current2 = store.getState().current!;
    store.getState().guess(current2.isAI ? 'ai' : 'human');
    store.getState().returnToAttract();
    expect(store.getState().conceptsSeen).toEqual([]);
  });
});
