import type { Difficulty } from '../data/types';

export interface LeaderboardEntry {
  name: string;
  difficulty: Difficulty;
  score: number;
  accuracy: number;
  bestStreak: number;
  timestamp: number;
}

const STORAGE_KEY = 'real-or-ai-wall:leaderboard';
const MAX_ENTRIES = 50;

/** Pure: inserts an entry, re-sorts by score (desc), and caps the list. Exported for testing. */
export function withEntry(entries: LeaderboardEntry[], entry: LeaderboardEntry): LeaderboardEntry[] {
  return [...entries, entry].sort((a, b) => b.score - a.score).slice(0, MAX_ENTRIES);
}

/** Pure: the top n entries from an already-sorted list. */
export function topEntries(entries: LeaderboardEntry[], n: number): LeaderboardEntry[] {
  return entries.slice(0, n);
}

/** Pure: renders the leaderboard as a plain-text table, openable in any text editor. */
export function formatAsText(entries: LeaderboardEntry[]): string {
  const header = 'Name\tDifficulty\tScore\tAccuracy\tBest Streak\tDate';
  const rows = entries.map((e) => {
    const date = new Date(e.timestamp).toLocaleString();
    return `${e.name}\t${e.difficulty}\t${e.score}\t${e.accuracy}%\t${e.bestStreak}\t${date}`;
  });
  return [header, ...rows].join('\n');
}

export function loadLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addEntry(entry: LeaderboardEntry): LeaderboardEntry[] {
  const next = withEntry(loadLeaderboard(), entry);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Local storage may be unavailable (private browsing, quota); the
    // session still works, it just won't persist the leaderboard.
  }
  return next;
}

/** Triggers a browser download of the leaderboard as a .txt file. */
export function downloadLeaderboardAsText(entries: LeaderboardEntry[]): void {
  try {
    const blob = new Blob([formatAsText(entries)], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `real-or-ai-wall-leaderboard-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch {
    // Export is a bonus for the stall organizer; never block gameplay on it.
  }
}
