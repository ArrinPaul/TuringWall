import type { SessionMode } from '../data/types';

/** The four session lengths a round can be played at — each gets its own, non-comparable board. */
export const SESSION_LENGTHS = [3, 5, 7, 10] as const;
export type SessionLength = (typeof SESSION_LENGTHS)[number];

export interface LeaderboardEntry {
  name: string;
  difficulty: SessionMode;
  score: number;
  accuracy: number;
  bestStreak: number;
  timestamp: number;
  /** Which session length this run was played at — the board it belongs on. */
  roundsTarget: SessionLength;
}

const STORAGE_KEY = 'real-or-ai-wall:leaderboard:v2';
const MAX_ENTRIES = 50;

type LeaderboardStore = Record<SessionLength, LeaderboardEntry[]>;

function emptyStore(): LeaderboardStore {
  return { 3: [], 5: [], 7: [], 10: [] };
}

/** Pure: inserts an entry, re-sorts by score (desc), and caps the list. Exported for testing. */
export function withEntry(entries: LeaderboardEntry[], entry: LeaderboardEntry): LeaderboardEntry[] {
  return [...entries, entry].sort((a, b) => b.score - a.score).slice(0, MAX_ENTRIES);
}

/** Pure: the top n entries from an already-sorted list. */
export function topEntries(entries: LeaderboardEntry[], n: number): LeaderboardEntry[] {
  return entries.slice(0, n);
}

/** Pure: entries whose timestamp falls on the same calendar day as `now` (local time). */
export function todaysEntries(entries: LeaderboardEntry[], now: number = Date.now()): LeaderboardEntry[] {
  const today = new Date(now);
  return entries.filter((e) => {
    const d = new Date(e.timestamp);
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  });
}

export interface RoomStanding {
  /** How many same-mode sessions today scored strictly less than `score`. */
  beaten: number;
  /** How many same-mode sessions were played today, this one included. */
  total: number;
}

/**
 * Pure: among today's sessions in the same mode, how this score stacks up.
 * `entries` should already be today-only (see `todaysEntries`) and include this session's own entry.
 */
export function roomStanding(entries: LeaderboardEntry[], mode: SessionMode, score: number): RoomStanding {
  const sameMode = entries.filter((e) => e.difficulty === mode);
  const beaten = sameMode.filter((e) => e.score < score).length;
  return { beaten, total: sameMode.length };
}

/** Pure: renders the leaderboard as a plain-text table, openable in any text editor. */
export function formatAsText(entries: LeaderboardEntry[]): string {
  const header = 'Name\tDifficulty\tRounds\tScore\tAccuracy\tBest Streak\tDate';
  const rows = entries.map((e) => {
    const date = new Date(e.timestamp).toLocaleString();
    return `${e.name}\t${e.difficulty}\t${e.roundsTarget}\t${e.score}\t${e.accuracy}%\t${e.bestStreak}\t${date}`;
  });
  return [header, ...rows].join('\n');
}

function isSessionLength(n: unknown): n is SessionLength {
  return typeof n === 'number' && (SESSION_LENGTHS as readonly number[]).includes(n);
}

function loadStore(): LeaderboardStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw);
    const store = emptyStore();
    if (parsed && typeof parsed === 'object') {
      for (const length of SESSION_LENGTHS) {
        const bucket = (parsed as Record<string, unknown>)[String(length)];
        if (Array.isArray(bucket)) {
          store[length] = bucket;
        }
      }
    }
    return store;
  } catch {
    return emptyStore();
  }
}

function saveStore(store: LeaderboardStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Local storage may be unavailable (private browsing, quota); the
    // session still works, it just won't persist the leaderboard.
  }
}

/** Loads only the board for one session length — boards never mix across lengths. */
export function loadLeaderboard(length: SessionLength): LeaderboardEntry[] {
  return loadStore()[length];
}

/** Loads every board at once, keyed by session length — for the leaderboard screen's tabs. */
export function loadAllLeaderboards(): LeaderboardStore {
  return loadStore();
}

export function addEntry(entry: LeaderboardEntry): LeaderboardEntry[] {
  const length = isSessionLength(entry.roundsTarget) ? entry.roundsTarget : SESSION_LENGTHS[0];
  const store = loadStore();
  store[length] = withEntry(store[length], entry);
  saveStore(store);
  return store[length];
}

/** Triggers a browser download of one session length's leaderboard as a .txt file. */
export function downloadLeaderboardAsText(entries: LeaderboardEntry[], length?: SessionLength): void {
  try {
    const blob = new Blob([formatAsText(entries)], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const suffix = length ? `-${length}q` : '';
    a.download = `real-or-ai-wall-leaderboard${suffix}-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch {
    // Export is a bonus for the stall organizer; never block gameplay on it.
  }
}
