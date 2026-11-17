import { describe, it, expect, beforeEach } from 'vitest';
import {
  PREFS_STORAGE_KEY,
  DEFAULT_PREFERENCES,
  loadPreferences,
  savePreferences,
  updatePreferences,
} from './prefs';

describe('preferences storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns default preferences when storage is empty', () => {
    const prefs = loadPreferences();
    expect(prefs).toEqual(DEFAULT_PREFERENCES);
    expect(prefs.sound).toBe(true);
    expect(prefs.motion).toBe('system');
    expect(prefs.showNameOnLeaderboard).toBe(true);
  });

  it('saves and loads preferences correctly', () => {
    savePreferences({
      version: 1,
      sound: false,
      motion: 'reduce',
      showNameOnLeaderboard: false,
    });

    const prefs = loadPreferences();
    expect(prefs.sound).toBe(false);
    expect(prefs.motion).toBe('reduce');
    expect(prefs.showNameOnLeaderboard).toBe(false);
  });

  it('gracefully handles corrupted JSON in localStorage', () => {
    localStorage.setItem(PREFS_STORAGE_KEY, '{invalid-json-data');
    const prefs = loadPreferences();
    expect(prefs).toEqual(DEFAULT_PREFERENCES);
  });

  it('gracefully handles non-object or invalid types', () => {
    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify('string-value'));
    expect(loadPreferences()).toEqual(DEFAULT_PREFERENCES);

    localStorage.setItem(
      PREFS_STORAGE_KEY,
      JSON.stringify({ sound: 'not-a-boolean', motion: 'unknown-motion', showNameOnLeaderboard: 123 })
    );
    const prefs = loadPreferences();
    expect(prefs.sound).toBe(DEFAULT_PREFERENCES.sound);
    expect(prefs.motion).toBe(DEFAULT_PREFERENCES.motion);
    expect(prefs.showNameOnLeaderboard).toBe(DEFAULT_PREFERENCES.showNameOnLeaderboard);
  });

  it('partially updates preferences and persists them', () => {
    updatePreferences({ sound: false });
    let prefs = loadPreferences();
    expect(prefs.sound).toBe(false);
    expect(prefs.motion).toBe('system');

    updatePreferences({ motion: 'full', showNameOnLeaderboard: false });
    prefs = loadPreferences();
    expect(prefs.sound).toBe(false);
    expect(prefs.motion).toBe('full');
    expect(prefs.showNameOnLeaderboard).toBe(false);
  });
});
