import { describe, it, expect } from 'vitest';
import { ITEMS } from './items';
import { DIFFICULTIES } from './types';
import { allConcepts, getConceptDetail } from '../character/fieldGuide';

describe('content validation', () => {
  const concepts = new Set(allConcepts());

  it('every item concept resolves to a Field Guide entry with learning content', () => {
    for (const item of ITEMS) {
      expect(concepts.has(item.concept), `${item.id}: unknown concept "${item.concept}"`).toBe(true);
      const d = getConceptDetail(item.concept);
      expect(d.plainExplanation.length, item.id).toBeGreaterThan(0);
      expect(d.positiveExample.length, item.id).toBeGreaterThan(0);
      expect(d.counterexample.length, `${item.id}: missing counterexample`).toBeGreaterThan(0);
      expect(d.rememberThis.length, item.id).toBeGreaterThan(0);
    }
  });

  it('every item has a source label, tier, explanation and content type', () => {
    for (const item of ITEMS) {
      expect(typeof item.isAI, item.id).toBe('boolean');
      expect(DIFFICULTIES).toContain(item.difficulty);
      expect(item.explanation.trim().length, item.id).toBeGreaterThan(0);
      expect(['text', 'image']).toContain(item.kind);
    }
  });

  it('image items carry accessible alternative text (caption)', () => {
    for (const item of ITEMS) {
      if (item.kind !== 'image') continue;
      expect(item.caption.trim().length, item.id).toBeGreaterThan(10);
      expect((item.alt ?? '').trim().length, `${item.id}: missing alt`).toBeGreaterThan(30);
      expect(`${item.alt} ${item.caption}`, `${item.id}: alt/caption leaks the answer`).not.toMatch(
        /\b(AI|generated|synthetic|digital art|hybrid|algorithmic|render(ed)?)\b/i
      );
    }
  });

  it('evidence highlights, when present, appear in the item text', () => {
    for (const item of ITEMS) {
      if (item.kind !== 'text' || !item.evidenceHighlights) continue;
      for (const h of item.evidenceHighlights) {
        expect(item.text.toLowerCase(), `${item.id}: "${h}"`).toContain(h.toLowerCase());
      }
    }
  });

  it('explanations do not claim certainty', () => {
    const banned = /\b(proves?|guarantees?|definitive(ly)?|dead giveaway|sure sign|strong human tell|unmistakabl[ey]|genuinely human|textbook AI|classic AI|hallmarks?)\b/i;
    for (const item of ITEMS) expect(item.explanation, item.id).not.toMatch(banned);
  });

  it('has curated evidence, a tempting-reason and a counterexample on at least 213 text items', () => {
    const enriched = ITEMS.filter(
      (i) => i.kind === 'text' && i.evidenceHighlights?.length && i.temptingReason && i.counterexample
    );
    expect(enriched.length).toBeGreaterThanOrEqual(213);
  });
});
