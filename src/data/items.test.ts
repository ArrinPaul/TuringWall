import { describe, it, expect } from 'vitest';
import { ITEMS } from './items';

describe('ITEMS', () => {
  it('has 18-20 items with unique ids and both kinds represented', () => {
    expect(ITEMS.length).toBeGreaterThanOrEqual(18);
    expect(ITEMS.length).toBeLessThanOrEqual(20);
    const ids = new Set(ITEMS.map((i) => i.id));
    expect(ids.size).toBe(ITEMS.length);
    expect(ITEMS.some((i) => i.kind === 'image')).toBe(true);
    expect(ITEMS.filter((i) => i.kind === 'image').length).toBeGreaterThanOrEqual(4);
  });

  it('every item has a non-empty explanation and well-formed kind-specific fields', () => {
    for (const item of ITEMS) {
      expect(item.explanation.length).toBeGreaterThan(0);
      expect(typeof item.isAI).toBe('boolean');
      if (item.kind === 'text') {
        expect(item.text.length).toBeGreaterThan(0);
      } else {
        expect(item.src.length).toBeGreaterThan(0);
        expect(item.caption.length).toBeGreaterThan(0);
      }
    }
  });
});
