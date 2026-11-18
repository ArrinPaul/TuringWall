import { describe, it, expect, afterEach } from 'vitest';
import { createGameStore } from './gameStore';
import type { Item } from '../data/types';

const fixture: Item[] = [
  { id: 'a', kind: 'text', text: 'Quote A', isAI: false, explanation: 'exp A', concept: 'Buzzword padding', difficulty: 'easy' },
  { id: 'b', kind: 'text', text: 'Quote B', isAI: true, explanation: 'exp B', concept: 'Buzzword padding', difficulty: 'easy' },
];

const tick = () => new Promise((r) => setTimeout(r, 20));

describe('question bank load failure', () => {
  const unhandled: unknown[] = [];
  const onUnhandled = (e: unknown) => unhandled.push(e);
  process.on('unhandledRejection', onUnhandled);
  afterEach(() => {
    unhandled.length = 0;
  });

  it('returns to the previous screen with an error instead of hanging on "loading"', async () => {
    const store = createGameStore(() => Promise.reject(new Error('chunk failed')), () => 0);
    store.getState().goToSelect();
    store.getState().startRound('easy');
    expect(store.getState().screen).toBe('loading');
    await tick();
    expect(store.getState().screen).toBe('select');
    expect(store.getState().loadError).toBe(true);
    expect(unhandled).toHaveLength(0);
  });

  it('retries the loader on the next attempt and recovers', async () => {
    let calls = 0;
    const store = createGameStore(() => {
      calls++;
      return calls === 1 ? Promise.reject(new Error('offline')) : Promise.resolve(fixture);
    }, () => 0);
    store.getState().goToSelect();
    store.getState().startRound('easy');
    await tick();
    expect(store.getState().loadError).toBe(true);

    store.getState().startRound('easy');
    await tick();
    expect(calls).toBe(2);
    expect(store.getState().screen).toBe('playing');
    expect(store.getState().loadError).toBe(false);
    expect(store.getState().current).not.toBeNull();
  });

  it('tell practice also recovers from a failed load', async () => {
    const store = createGameStore(() => Promise.reject(new Error('nope')), () => 0);
    store.getState().startTellPractice('Buzzword padding');
    await tick();
    expect(store.getState().screen).toBe('attract');
    expect(store.getState().loadError).toBe(true);
    expect(unhandled).toHaveLength(0);
  });

  it('a failed background preload does not raise an unhandled rejection', async () => {
    const store = createGameStore(() => Promise.reject(new Error('preload')), () => 0);
    store.getState().goToSelect();
    await tick();
    await store.getState().preloadItems().catch(() => {});
    await tick();
    expect(unhandled).toHaveLength(0);
  });

  it('treats a loader that resolves to nothing as a failure, not a hang', async () => {
    const store = createGameStore((() => Promise.resolve(undefined)) as never, () => 0);
    store.getState().goToSelect();
    store.getState().startRound('easy');
    await tick();
    expect(store.getState().screen).toBe('select');
    expect(store.getState().loadError).toBe(true);
    expect(unhandled).toHaveLength(0);
  });

  it('treats an empty question bank as a failure', async () => {
    const store = createGameStore(() => Promise.resolve([]), () => 0);
    store.getState().goToSelect();
    store.getState().startRound('easy');
    await tick();
    expect(store.getState().screen).toBe('select');
    expect(store.getState().loadError).toBe(true);
  });
});
