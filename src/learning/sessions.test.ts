import { describe, it, expect, beforeEach } from 'vitest';
import {
  SESSIONS_STORAGE_KEY,
  MAX_SESSIONS,
  loadSessionHistory,
  saveSessionHistory,
  recordSession,
  getSessionCounts,
  type SessionRecord,
} from './sessions';

describe('sessions storage and tracking', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const sampleSession: SessionRecord = {
    id: 'sess-1',
    startedAt: 1000,
    mode: 'easy',
    roundsTarget: 10,
    roundsPlayed: 10,
    status: 'completed',
    sourceAccuracy: 80,
    tellAccuracy: 70,
    calibration: 85,
    score: 15,
  };

  it('loads empty array when storage is empty', () => {
    expect(loadSessionHistory()).toEqual([]);
    expect(getSessionCounts()).toEqual({ completed: 0, abandoned: 0, total: 0 });
  });

  it('records completed and abandoned sessions correctly', () => {
    recordSession(sampleSession);
    recordSession({
      ...sampleSession,
      id: 'sess-2',
      roundsPlayed: 3,
      status: 'abandoned',
    });

    const history = loadSessionHistory();
    expect(history).toHaveLength(2);
    expect(history[0].status).toBe('completed');
    expect(history[1].status).toBe('abandoned');

    const counts = getSessionCounts();
    expect(counts).toEqual({ completed: 1, abandoned: 1, total: 2 });
  });

  it('updates existing record when matching id is passed', () => {
    recordSession({ ...sampleSession, status: 'abandoned', roundsPlayed: 4 });
    expect(loadSessionHistory()[0].status).toBe('abandoned');

    recordSession({ ...sampleSession, status: 'completed', roundsPlayed: 10 });
    const history = loadSessionHistory();
    expect(history).toHaveLength(1);
    expect(history[0].status).toBe('completed');
  });

  it('caps history at MAX_SESSIONS', () => {
    const list: SessionRecord[] = [];
    for (let i = 0; i < MAX_SESSIONS + 20; i++) {
      list.push({
        ...sampleSession,
        id: `sess-${i}`,
      });
    }
    saveSessionHistory(list);
    const loaded = loadSessionHistory();
    expect(loaded).toHaveLength(MAX_SESSIONS);
    expect(loaded[loaded.length - 1].id).toBe(`sess-${MAX_SESSIONS + 19}`);
  });

  it('handles corrupted JSON gracefully', () => {
    localStorage.setItem(SESSIONS_STORAGE_KEY, '{invalid json');
    expect(loadSessionHistory()).toEqual([]);
  });

  it('filters out malformed session objects', () => {
    localStorage.setItem(
      SESSIONS_STORAGE_KEY,
      JSON.stringify([{ invalid: true }, 'string', null, sampleSession])
    );
    const loaded = loadSessionHistory();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe('sess-1');
  });
});
