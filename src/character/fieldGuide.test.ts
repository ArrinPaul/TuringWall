import { describe, it, expect } from 'vitest';
import {
  CONCEPT_DEFINITIONS,
  allConcepts,
  definitionFor,
  getConceptDetail,
  getCandidateTells,
  searchConcepts,
  EDUCATIONAL_DISCLAIMER,
  CONCEPT_CHAPTERS,
} from './fieldGuide';
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

describe('getConceptDetail and educational metadata', () => {
  it('provides counterexample, positive example, and chapter for concepts', () => {
    const detail = getConceptDetail('Buzzword padding');
    expect(detail.counterexample).toBeTruthy();
    expect(detail.positiveExample).toBeTruthy();
    expect(detail.whyFooled).toBeTruthy();
    expect(detail.rememberThis).toBeTruthy();
  });

  it('includes educational disclaimer across learning modules', () => {
    expect(EDUCATIONAL_DISCLAIMER).toContain('No single signal proves');
  });

  it('groups all concepts into chapters', () => {
    const chapters = CONCEPT_CHAPTERS;
    expect(chapters.length).toBeGreaterThanOrEqual(4);
    const allGrouped = chapters.flatMap((c) => c.concepts);
    expect(allGrouped.length).toBe(allConcepts().length);
  });
});

describe('getCandidateTells and searchConcepts', () => {
  it('returns candidate tells containing the target concept and distractors', () => {
    const candidates = getCandidateTells('Universal platitude', 4);
    expect(candidates).toHaveLength(4);
    expect(candidates).toContain('Universal platitude');
    // Ensure all 4 are unique
    expect(new Set(candidates).size).toBe(4);
  });

  it('searches concepts by query keyword', () => {
    const results = searchConcepts('platitude');
    expect(results).toContain('Universal platitude');
  });

  it('filters concepts by category and signal', () => {
    const codeResults = searchConcepts('', 'code');
    expect(codeResults).toContain('Candid developer voice');
    expect(codeResults).not.toContain('Generic pretty imagery');
  });
});
