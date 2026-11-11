import { describe, it, expect } from 'vitest';
import { createGameStore } from './gameStore';

const fixtureItems = [
  { id: 'a', kind: 'text' as const, text: 'A', isAI: false, explanation: 'x' },
  { id: 'b', kind: 'text' as const, text: 'B', isAI: true, explanation: 'x' },
];

describe('gameStore', () => {
  it('starts on the attract screen', () => {
    const store = createGameStore(fixtureItems);
    expect(store.getState().screen).toBe('attract');
  });

  it('startRound moves to playing with a fresh zeroed stats and a current item from the deck', () => {
    const store = createGameStore(fixtureItems);
    store.getState().startRound();
    const s = store.getState();
    expect(s.screen).toBe('playing');
    expect(s.stats.roundsPlayed).toBe(0);
    expect(fixtureItems.map((i) => i.id)).toContain(s.current?.id);
  });

  it('guess() while not on the playing screen is a no-op', () => {
    const store = createGameStore(fixtureItems);
    store.getState().guess('human');
    expect(store.getState().screen).toBe('attract');
    expect(store.getState().guessSeq).toBe(0);
  });

  it('a correct guess updates stats and moves to revealed, an incorrect guess also moves to revealed', () => {
    const store = createGameStore(fixtureItems, () => 0);
    store.getState().startRound();
    const current = store.getState().current!;
    store.getState().guess(current.isAI ? 'ai' : 'human');
    const s = store.getState();
    expect(s.screen).toBe('revealed');
    expect(s.lastGuessCorrect).toBe(true);
    expect(s.stats.roundsPlayed).toBe(1);
    expect(s.guessSeq).toBe(1);
  });

  it('next() while not on the revealed screen is a no-op', () => {
    const store = createGameStore(fixtureItems);
    store.getState().next();
    expect(store.getState().screen).toBe('attract');
  });

  it('next() after the 10th round routes to the stats screen', () => {
    const store = createGameStore(fixtureItems, () => 0);
    store.getState().startRound();
    for (let i = 0; i < 10; i++) {
      const current = store.getState().current!;
      store.getState().guess(current.isAI ? 'ai' : 'human');
      store.getState().next();
    }
    expect(store.getState().screen).toBe('stats');
  });

  it('returnToAttract resets the screen to attract', () => {
    const store = createGameStore(fixtureItems);
    store.getState().startRound();
    store.getState().returnToAttract();
    expect(store.getState().screen).toBe('attract');
  });
});
