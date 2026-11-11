import { describe, it, expect } from 'vitest';
import { isIdle } from './idle';

describe('isIdle', () => {
  it('is false before the timeout elapses', () => {
    expect(isIdle(1000, 1000 + 44999, 45000)).toBe(false);
  });

  it('is true once the timeout has fully elapsed', () => {
    expect(isIdle(1000, 1000 + 45000, 45000)).toBe(true);
  });
});
