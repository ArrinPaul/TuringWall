import { describe, it, expect, beforeEach } from 'vitest';
import { withEntry, topEntries, formatAsText, loadLeaderboard, addEntry, type LeaderboardEntry } from './leaderboard';

function makeEntry(overrides: Partial<LeaderboardEntry> = {}): LeaderboardEntry {
  return {
    name: 'Rin',
    difficulty: 'easy',
    score: 5,
    accuracy: 80,
    bestStreak: 3,
    timestamp: 1700000000000,
    ...overrides,
  };
}

describe('withEntry', () => {
  it('appends and sorts by score descending', () => {
    const result = withEntry(
      [makeEntry({ name: 'Low', score: 2 }), makeEntry({ name: 'Mid', score: 5 })],
      makeEntry({ name: 'High', score: 9 })
    );
    expect(result.map((e) => e.name)).toEqual(['High', 'Mid', 'Low']);
  });

  it('caps the list at 50 entries', () => {
    const many = Array.from({ length: 50 }, (_, i) => makeEntry({ name: `p${i}`, score: i }));
    const result = withEntry(many, makeEntry({ name: 'newcomer', score: 100 }));
    expect(result.length).toBe(50);
    expect(result[0].name).toBe('newcomer');
  });
});

describe('topEntries', () => {
  it('returns only the first n entries', () => {
    const entries = [makeEntry({ name: 'a' }), makeEntry({ name: 'b' }), makeEntry({ name: 'c' })];
    expect(topEntries(entries, 2).map((e) => e.name)).toEqual(['a', 'b']);
  });
});

describe('formatAsText', () => {
  it('renders a tab-separated header and one row per entry', () => {
    const text = formatAsText([makeEntry()]);
    const lines = text.split('\n');
    expect(lines[0]).toBe('Name\tDifficulty\tScore\tAccuracy\tBest Streak\tDate');
    expect(lines[1]).toContain('Rin');
    expect(lines[1]).toContain('easy');
    expect(lines[1]).toContain('80%');
  });
});

describe('loadLeaderboard / addEntry (localStorage-backed)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts empty when nothing is stored', () => {
    expect(loadLeaderboard()).toEqual([]);
  });

  it('addEntry persists and loadLeaderboard reads it back', () => {
    addEntry(makeEntry({ name: 'Persisted' }));
    expect(loadLeaderboard().map((e) => e.name)).toEqual(['Persisted']);
  });

  it('survives corrupted storage by returning an empty list', () => {
    localStorage.setItem('real-or-ai-wall:leaderboard', 'not json');
    expect(loadLeaderboard()).toEqual([]);
  });
});
