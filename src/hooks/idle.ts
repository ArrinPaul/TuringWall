import { useEffect, useRef } from 'react';

export const IDLE_TIMEOUT_MS = 45000;

export function isIdle(lastInteractionAt: number, now: number, timeoutMs: number): boolean {
  return now - lastInteractionAt >= timeoutMs;
}

export function useIdleReturn(
  active: boolean,
  onIdle: () => void,
  timeoutMs: number = IDLE_TIMEOUT_MS
): void {
  const onIdleRef = useRef(onIdle);
  onIdleRef.current = onIdle;

  useEffect(() => {
    if (!active) {
      return;
    }

    let timerId: ReturnType<typeof setTimeout> | null = null;

    const resetTimer = () => {
      if (timerId !== null) {
        clearTimeout(timerId);
      }
      timerId = setTimeout(() => {
        onIdleRef.current();
      }, timeoutMs);
    };

    // Start timer on becoming active
    resetTimer();

    const handleInteraction = () => {
      resetTimer();
    };

    window.addEventListener('pointerdown', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    window.addEventListener('click', handleInteraction);

    return () => {
      if (timerId !== null) {
        clearTimeout(timerId);
      }
      window.removeEventListener('pointerdown', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('click', handleInteraction);
    };
  }, [active, timeoutMs]);
}
