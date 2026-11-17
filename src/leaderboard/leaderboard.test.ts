import { describe, it, expect, beforeEach } from 'vitest';
import {
  withEntry,
  topEntries,
  todaysEntries,
  roomStanding,
  formatAsText,
  loadLeaderboard,
  loadAllLeaderboards,
  addEntry,
  type LeaderboardEntry,
} from './leaderboard';

function makeEntry(overrides: Partial<LeaderboardEntry> = {}): LeaderboardEntry {
  return {
    name: 'Rin',
    difficulty: 'easy',
    score: 5,
    accuracy: 80,
    bestStreak: 3,
    timestamp: 1700000000000,
    roundsTarget: 10,
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

  it('excludes entries that are abandoned or completed: false', () => {
    const existing = [makeEntry({ name: 'Valid', score: 10 })];
    const abandoned = makeEntry({ name: 'Abandoned', score: 99, completed: false });
    const result = withEntry(existing, abandoned);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Valid');
  });
});

describe('topEntries', () => {
  it('returns only the first n entries', () => {
    const entries = [makeEntry({ name: 'a' }), makeEntry({ name: 'b' }), makeEntry({ name: 'c' })];
    expect(topEntries(entries, 2).map((e) => e.name)).toEqual(['a', 'b']);
  });
});

describe('formatAsText', () => {
  it('renders a tab-separated header and one row per entry, including the session length', () => {
    const text = formatAsText([makeEntry({ roundsTarget: 7 })]);
    const lines = text.split('\n');
    expect(lines[0]).toBe('Name\tDifficulty\tRounds\tScore\tAccuracy\tBest Streak\tDate');
    expect(lines[1]).toContain('Rin');
    expect(lines[1]).toContain('easy');
    expect(lines[1]).toContain('7');
    expect(lines[1]).toContain('80%');
  });
});

describe('todaysEntries', () => {
  it('keeps only entries from the same calendar day as `now`', () => {
    const now = new Date(2026, 10, 12, 15, 0, 0).getTime();
    const sameDay = new Date(2026, 10, 12, 9, 0, 0).getTime();
    const yesterday = new Date(2026, 10, 11, 23, 59, 0).getTime();
    const entries = [
      makeEntry({ name: 'today', timestamp: sameDay }),
      makeEntry({ name: 'yesterday', timestamp: yesterday }),
    ];
    expect(todaysEntries(entries, now).map((e) => e.name)).toEqual(['today']);
  });
});

describe('roomStanding', () => {
  it('counts only same-mode entries, and how many this score beats', () => {
    const entries = [
      makeEntry({ difficulty: 'easy', score: 3 }),
      makeEntry({ difficulty: 'easy', score: 7 }),
      makeEntry({ difficulty: 'hard', score: 20 }),
    ];
    expect(roomStanding(entries, 'easy', 5)).toEqual({ beaten: 1, total: 2 });
  });

  it('returns zero/zero when nobody has played that mode today', () => {
    expect(roomStanding([], 'pro', 10)).toEqual({ beaten: 0, total: 0 });
  });
});

describe('loadLeaderboard / addEntry (localStorage-backed, segmented by session length)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts empty for every session length when nothing is stored', () => {
    expect(loadLeaderboard(3)).toEqual([]);
    expect(loadLeaderboard(5)).toEqual([]);
    expect(loadLeaderboard(7)).toEqual([]);
    expect(loadLeaderboard(10)).toEqual([]);
  });

  it('addEntry persists and loadLeaderboard reads it back on the matching length only', () => {
    addEntry(makeEntry({ name: 'Persisted', roundsTarget: 5 }));
    expect(loadLeaderboard(5).map((e) => e.name)).toEqual(['Persisted']);
    expect(loadLeaderboard(3)).toEqual([]);
    expect(loadLeaderboard(7)).toEqual([]);
    expect(loadLeaderboard(10)).toEqual([]);
  });

  it('a 3-question entry never appears on the 10-question board, and vice versa', () => {
    addEntry(makeEntry({ name: 'Short run', roundsTarget: 3, score: 3 }));
    addEntry(makeEntry({ name: 'Long run', roundsTarget: 10, score: 10 }));
    expect(loadLeaderboard(3).map((e) => e.name)).toEqual(['Short run']);
    expect(loadLeaderboard(10).map((e) => e.name)).toEqual(['Long run']);
  });

  it('loadAllLeaderboards returns every length bucket at once', () => {
    addEntry(makeEntry({ name: 'A', roundsTarget: 3 }));
    addEntry(makeEntry({ name: 'B', roundsTarget: 7 }));
    const all = loadAllLeaderboards();
    expect(all[3].map((e) => e.name)).toEqual(['A']);
    expect(all[7].map((e) => e.name)).toEqual(['B']);
    expect(all[5]).toEqual([]);
    expect(all[10]).toEqual([]);
  });

  it('survives corrupted storage by returning an empty list for every length', () => {
    localStorage.setItem('real-or-ai-wall:leaderboard:v2', 'not json');
    expect(loadLeaderboard(10)).toEqual([]);
  });
});
