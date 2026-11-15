import { describe, it, expect } from 'vitest';
import { ITEMS } from './items';
import { DIFFICULTIES } from './types';

describe('ITEMS', () => {
  it('has 500+ items with unique ids and both kinds represented', () => {
    expect(ITEMS.length).toBeGreaterThanOrEqual(500);
    const ids = new Set(ITEMS.map((i) => i.id));
    expect(ids.size).toBe(ITEMS.length);
    expect(ITEMS.some((i) => i.kind === 'image')).toBe(true);
    expect(ITEMS.filter((i) => i.kind === 'image').length).toBeGreaterThanOrEqual(6);
  });

  it('has every difficulty tier deep enough that a 10-round session never repeats', () => {
    for (const tier of DIFFICULTIES) {
      const count = ITEMS.filter((i) => i.difficulty === tier).length;
      expect(count).toBeGreaterThanOrEqual(120);
    }
  });

  it('has no two items sharing substantially identical text', () => {
    const seen = new Map<string, string>();
    for (const item of ITEMS) {
      if (item.kind !== 'text') continue;
      const normalized = item.text.trim().toLowerCase();
      const existing = seen.get(normalized);
      expect(existing, `"${item.id}" has the same text as "${existing}"`).toBeUndefined();
      seen.set(normalized, item.id);
    }
  });

  it('every item has a non-empty explanation, concept tag, valid difficulty, and well-formed kind-specific fields', () => {
    for (const item of ITEMS) {
      expect(item.explanation.length).toBeGreaterThan(0);
      expect(item.concept.length).toBeGreaterThan(0);
      expect(DIFFICULTIES).toContain(item.difficulty);
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
