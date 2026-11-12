import { useState, useEffect, useCallback } from 'react';

/** Kiosk fullscreen toggle. Wrapped defensively: unsupported/blocked environments (some
 * desktop app views, restricted contexts) must never crash the guess flow over this. */
export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    try {
      if (document.fullscreenElement) {
        if (typeof document.exitFullscreen === 'function') {
          // Both branches: requestFullscreen/exitFullscreen return a Promise that can
          // reject (denied permission, no active user gesture, unsupported context).
          // A rejected promise is NOT caught by this try/catch — it must be .catch()'d
          // explicitly, or it surfaces as an unhandled rejection instead of failing quietly.
          document.exitFullscreen().catch(() => {});
        }
      } else if (typeof document.documentElement.requestFullscreen === 'function') {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch {
      // Fullscreen may be unsupported or blocked — never crash the app over this.
    }
  }, []);

  return { isFullscreen, toggleFullscreen };
}
