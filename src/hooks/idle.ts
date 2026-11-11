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

  const lastInteractionRef = useRef(Date.now());
  const triggeredRef = useRef(false);

  useEffect(() => {
    if (!active) {
      triggeredRef.current = false;
      return;
    }

    lastInteractionRef.current = Date.now();
    triggeredRef.current = false;

    const handleInteraction = () => {
      lastInteractionRef.current = Date.now();
      triggeredRef.current = false;
    };

    window.addEventListener('pointerdown', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    window.addEventListener('click', handleInteraction);

    const intervalId = window.setInterval(() => {
      const now = Date.now();
      if (!triggeredRef.current && isIdle(lastInteractionRef.current, now, timeoutMs)) {
        triggeredRef.current = true;
        onIdleRef.current();
      }
    }, 1000);

    return () => {
      window.removeEventListener('pointerdown', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('click', handleInteraction);
      window.clearInterval(intervalId);
    };
  }, [active, timeoutMs]);
}
