import { describe, it, expect, vi, afterEach } from 'vitest';
import { playTone } from './tone';

describe('playTone', () => {
  afterEach(() => {
    // @ts-expect-error cleaning up a test-only global
    delete window.AudioContext;
  });

  it('does not throw when AudioContext is available', () => {
    const oscillator = {
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      frequency: {
        value: 0,
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
    };
    const gainNode = {
      connect: vi.fn(),
      gain: {
        value: 0,
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
    };
    const ctx = {
      createOscillator: () => oscillator,
      createGain: () => gainNode,
      destination: {},
      currentTime: 0,
      state: 'running',
      resume: vi.fn(),
    };
    // @ts-expect-error test stub
    window.AudioContext = class {
      constructor() {
        return ctx as any;
      }
    } as any;
    expect(() => playTone('correct')).not.toThrow();
    expect(oscillator.start).toHaveBeenCalled();
  });

  it('does not throw when AudioContext is unavailable', () => {
    // @ts-expect-error simulating a browser/environment with no Web Audio support
    delete window.AudioContext;
    expect(() => playTone('incorrect')).not.toThrow();
  });
});
