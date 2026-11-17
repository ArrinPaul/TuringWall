export type MotionPreference = 'system' | 'reduce' | 'full';

export interface UserPreferences {
  version: 1;
  sound: boolean;
  motion: MotionPreference;
  showNameOnLeaderboard: boolean;
}

export const PREFS_STORAGE_KEY = 'real-or-ai-wall:prefs:v1';

export const DEFAULT_PREFERENCES: UserPreferences = {
  version: 1,
  sound: true,
  motion: 'system',
  showNameOnLeaderboard: true,
};

export function loadPreferences(): UserPreferences {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { ...DEFAULT_PREFERENCES };
  }
  try {
    const raw = window.localStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return { ...DEFAULT_PREFERENCES };
    }
    const motion: MotionPreference =
      parsed.motion === 'reduce' || parsed.motion === 'full' || parsed.motion === 'system'
        ? parsed.motion
        : DEFAULT_PREFERENCES.motion;
    return {
      version: 1,
      sound: typeof parsed.sound === 'boolean' ? parsed.sound : DEFAULT_PREFERENCES.sound,
      motion,
      showNameOnLeaderboard:
        typeof parsed.showNameOnLeaderboard === 'boolean'
          ? parsed.showNameOnLeaderboard
          : DEFAULT_PREFERENCES.showNameOnLeaderboard,
    };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function savePreferences(prefs: UserPreferences): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    window.localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // localStorage full or unavailable
  }
}

export function updatePreferences(
  partial: Partial<Omit<UserPreferences, 'version'>>
): UserPreferences {
  const current = loadPreferences();
  const updated: UserPreferences = {
    ...current,
    ...partial,
    version: 1,
  };
  savePreferences(updated);
  return updated;
}
