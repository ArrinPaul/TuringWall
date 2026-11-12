import { describe, it, expect } from 'vitest';
import { nextTierUp } from './types';

describe('nextTierUp', () => {
  it('steps up through the ladder', () => {
    expect(nextTierUp('easy')).toBe('medium');
    expect(nextTierUp('medium')).toBe('hard');
    expect(nextTierUp('hard')).toBe('pro');
  });

  it('returns null at the top tier', () => {
    expect(nextTierUp('pro')).toBeNull();
  });
});
