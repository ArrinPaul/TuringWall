import { describe, it, expect } from 'vitest';
import { CONCEPT_DEFINITIONS, allConcepts, definitionFor } from './fieldGuide';
import { ITEMS } from '../data/items';

describe('CONCEPT_DEFINITIONS', () => {
  it('defines every concept tag actually used in ITEMS', () => {
    const used = new Set(ITEMS.map((i) => i.concept));
    for (const concept of used) {
      expect(CONCEPT_DEFINITIONS[concept], `missing definition for "${concept}"`).toBeTruthy();
    }
  });

  it('has no empty definitions', () => {
    for (const [concept, def] of Object.entries(CONCEPT_DEFINITIONS)) {
      expect(def.length, `empty definition for "${concept}"`).toBeGreaterThan(0);
    }
  });
});

describe('allConcepts', () => {
  it('returns every concept, alphabetically sorted', () => {
    const list = allConcepts();
    expect(list.length).toBe(Object.keys(CONCEPT_DEFINITIONS).length);
    expect(list).toEqual([...list].sort((a, b) => a.localeCompare(b)));
  });
});

describe('definitionFor', () => {
  it('returns the matching definition', () => {
    expect(definitionFor('Universal platitude')).toContain('broad');
  });

  it('returns an empty string for an unknown concept', () => {
    expect(definitionFor('Not a real concept')).toBe('');
  });
});
