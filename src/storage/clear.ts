/** Keys owned by the game; cleared only when the player explicitly asks to reset. */
const APP_STORAGE_PREFIX = 'real-or-ai-wall:';

export function clearSavedProgress(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(APP_STORAGE_PREFIX)) keys.push(key);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {
    // Storage unavailable: nothing to clear.
  }
}
