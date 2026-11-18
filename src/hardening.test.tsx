import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from './App';
import { createGameStore } from './store/gameStore';
import { loadLeaderboard, SESSION_LENGTHS } from './leaderboard/leaderboard';
import { loadMastery, loadMissedQuestionIds, MASTERY_STORAGE_KEY } from './learning/mastery';
import { loadSessionHistory, SESSIONS_STORAGE_KEY } from './learning/sessions';
import { loadPreferences, PREFS_STORAGE_KEY } from './prefs/prefs';
import { allConcepts } from './character/fieldGuide';
import type { Item } from './data/types';

const LEADERBOARD_KEY = 'real-or-ai-wall:leaderboard:v2';
const MISSED_KEY = 'real-or-ai-wall:missed-questions:v2';
const ALL_KEYS = [LEADERBOARD_KEY, MASTERY_STORAGE_KEY, MISSED_KEY, SESSIONS_STORAGE_KEY, PREFS_STORAGE_KEY];

const fixture: Item[] = [
  { id: 'a', kind: 'text', text: 'Quote A', isAI: false, explanation: 'exp A', concept: allConcepts()[0], difficulty: 'easy' },
  { id: 'b', kind: 'text', text: 'Quote B', isAI: true, explanation: 'exp B', concept: allConcepts()[1], difficulty: 'easy' },
];

const GARBAGE = [
  '{bad json',
  'null',
  '[]',
  '123',
  '"a string"',
  'true',
  '{"3":"x","5":[1,"two",null,{"score":"abc"}],"7":{"a":1},"10":[{"name":null,"score":{}}]}',
  '{"Buzzword padding":null,"x":1,"y":"z","Specific lived detail":{"tier":"bogus","correctCount":"many"}}',
  '[null,1,"x",{"id":5,"status":"weird"},{"status":"completed","score":"NaN"}]',
  '{"sound":"loud","motion":7,"showNameOnLeaderboard":"yes","version":99}',
];

beforeEach(() => {
  localStorage.clear();
  window.history.pushState(null, '', '/');
});

describe('corrupt localStorage never crashes the data layer', () => {
  for (const garbage of GARBAGE) {
    it(`loaders survive ${garbage.slice(0, 40)}`, () => {
      for (const key of ALL_KEYS) localStorage.setItem(key, garbage);

      for (const length of SESSION_LENGTHS) {
        const board = loadLeaderboard(length);
        expect(Array.isArray(board)).toBe(true);
        for (const entry of board) {
          expect(typeof entry).toBe('object');
          expect(typeof entry.score).toBe('number');
          expect(Number.isFinite(entry.score)).toBe(true);
          expect(typeof entry.name).toBe('string');
        }
      }
      const mastery = loadMastery();
      for (const concept of allConcepts()) {
        expect(mastery[concept]).toBeDefined();
        expect(['new', 'practicing', 'familiar', 'shaky', 'mastered']).toContain(mastery[concept].tier);
        expect(Number.isFinite(mastery[concept].correctCount)).toBe(true);
      }
      expect(Array.isArray(loadMissedQuestionIds())).toBe(true);
      expect(Array.isArray(loadSessionHistory())).toBe(true);
      const prefs = loadPreferences();
      expect(typeof prefs.sound).toBe('boolean');
      expect(['system', 'reduce', 'full']).toContain(prefs.motion);
    });
  }
});

describe('the app renders and plays with corrupt storage', () => {
  for (const garbage of GARBAGE) {
    it(`renders landing, plays a round and opens the leaderboard with ${garbage.slice(0, 30)}`, async () => {
      for (const key of ALL_KEYS) localStorage.setItem(key, garbage);
      const store = createGameStore(fixture, () => 0);
      const { unmount } = render(<App store={store} />);

      fireEvent.click(screen.getByTestId('attract-root'));
      fireEvent.click(screen.getByText(/Continue/i));
      fireEvent.click(screen.getByText('Easy'));
      fireEvent.click(screen.getByText('10'));
      fireEvent.click(screen.getByText('Human'));
      fireEvent.click(screen.getByText(/Reveal Verdict/i));
      expect(store.getState().screen).toBe('revealed');

      await act(async () => {
        store.getState().showStats();
      });
      expect(store.getState().screen).toBe('stats');
      expect(document.body.textContent).toMatch(/Leaderboard/i);
      unmount();
    });
  }
});

describe('storage that throws (private mode / quota) does not crash the app', () => {
  it('survives getItem and setItem throwing', async () => {
    const get = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    try {
      const store = createGameStore(fixture, () => 0);
      render(<App store={store} />);
      fireEvent.click(screen.getByTestId('attract-root'));
      fireEvent.click(screen.getByText(/Continue/i));
      fireEvent.click(screen.getByText('Easy'));
      fireEvent.click(screen.getByText('10'));
      fireEvent.click(screen.getByText('Human'));
      fireEvent.click(screen.getByText(/Reveal Verdict/i));
      expect(store.getState().screen).toBe('revealed');
    } finally {
      get.mockRestore();
      set.mockRestore();
    }
  });
});
