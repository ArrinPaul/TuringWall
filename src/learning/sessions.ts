import type { SessionMode } from '../data/types';
import type { SessionLength } from '../leaderboard/leaderboard';

export type SessionStatus = 'completed' | 'abandoned';

export interface SessionRecord {
  id: string;
  startedAt: number;
  mode: SessionMode | string;
  roundsTarget: SessionLength | number;
  roundsPlayed: number;
  status: SessionStatus;
  sourceAccuracy: number;
  tellAccuracy: number;
  calibration: number;
  score: number;
}

export const SESSIONS_STORAGE_KEY = 'real-or-ai-wall:sessions:v1';
export const MAX_SESSIONS = 200;

export function loadSessionHistory(): SessionRecord[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is SessionRecord =>
        Boolean(
          item &&
            typeof item === 'object' &&
            typeof item.id === 'string' &&
            (item.status === 'completed' || item.status === 'abandoned')
        )
    );
  } catch {
    return [];
  }
}

export function saveSessionHistory(sessions: SessionRecord[]): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    const capped = sessions.slice(-MAX_SESSIONS);
    window.localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(capped));
  } catch {
    // quota exceeded or storage unavailable
  }
}

export function recordSession(record: SessionRecord): SessionRecord[] {
  const history = loadSessionHistory();
  const filtered = history.filter((s) => s.id !== record.id);
  const updated = [...filtered, record];
  saveSessionHistory(updated);
  return updated;
}

export function getSessionCounts(history: SessionRecord[] = loadSessionHistory()): {
  completed: number;
  abandoned: number;
  total: number;
} {
  const completed = history.filter((s) => s.status === 'completed').length;
  const abandoned = history.filter((s) => s.status === 'abandoned').length;
  return { completed, abandoned, total: history.length };
}
