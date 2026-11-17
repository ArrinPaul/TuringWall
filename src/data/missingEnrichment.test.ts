import { describe, it, expect } from 'vitest';
import { ITEMS } from './items';
import type { Item, Difficulty } from './types';

export const TIERS: Difficulty[] = ['pro', 'hard', 'medium', 'easy'];

/**
 * Returns true if an item has all three enrichment fields:
 * 1. non-empty evidenceHighlights array
 * 2. non-empty temptingReason string
 * 3. non-empty counterexample string
 */
export function isItemEnriched(item: Item): boolean {
  const hasHighlights = Array.isArray(item.evidenceHighlights) && item.evidenceHighlights.length > 0;
  const hasTempting = typeof item.temptingReason === 'string' && item.temptingReason.trim().length > 0;
  const hasCounter = typeof item.counterexample === 'string' && item.counterexample.trim().length > 0;
  return Boolean(hasHighlights && hasTempting && hasCounter);
}

/**
 * Filters items for those lacking any of evidenceHighlights, temptingReason, or counterexample.
 */
export function getUnenrichedItems(items: Item[] = ITEMS): Item[] {
  return items.filter((item) => !isItemEnriched(item));
}

/**
 * Groups unenriched items by tier (pro, hard, medium, easy) and then by concept.
 */
export function groupUnenrichedItems(items: Item[] = ITEMS): {
  unenriched: Item[];
  byTier: Record<Difficulty, Map<string, Item[]>>;
  ordered: Item[];
} {
  const unenriched = getUnenrichedItems(items);
  const byTier: Record<Difficulty, Map<string, Item[]>> = {
    pro: new Map(),
    hard: new Map(),
    medium: new Map(),
    easy: new Map(),
  };

  for (const item of unenriched) {
    const tier = item.difficulty;
    const conceptsMap = byTier[tier];
    if (!conceptsMap) continue;

    const concept = item.concept || 'Uncategorized';
    const list = conceptsMap.get(concept) ?? [];
    list.push(item);
    conceptsMap.set(concept, list);
  }

  const ordered: Item[] = [];
  for (const tier of TIERS) {
    const conceptsMap = byTier[tier];
    const sortedConcepts = Array.from(conceptsMap.keys()).sort();
    for (const concept of sortedConcepts) {
      const itemsInConcept = conceptsMap.get(concept) ?? [];
      for (const item of itemsInConcept) {
        ordered.push(item);
      }
    }
  }

  return { unenriched, byTier, ordered };
}

/**
 * Formats a 50-item window report of unenriched items grouped by tier and concept.
 */
export function formatBatchReport(
  items: Item[] = ITEMS,
  options: { offset?: number; limit?: number } = {}
): string {
  const { offset = 0, limit = 50 } = options;
  const { unenriched, ordered } = groupUnenrichedItems(items);
  const total = unenriched.length;
  const page = ordered.slice(offset, offset + limit);

  const lines: string[] = [];
  lines.push('='.repeat(80));
  lines.push(
    `UNENRICHED ITEMS REPORT (Showing ${total === 0 ? 0 : offset + 1}-${Math.min(offset + limit, total)} of ${total})`
  );
  lines.push(`Offset: ${offset} | Limit: ${limit}`);

  const tierCounts = TIERS.map(
    (t) => `${t}: ${unenriched.filter((i) => i.difficulty === t).length}`
  ).join(', ');
  lines.push(`Tiers breakdown: ${tierCounts}`);
  lines.push('='.repeat(80));

  if (page.length === 0) {
    lines.push('\nNo items found for the given offset.');
    return lines.join('\n');
  }

  let currentTier: Difficulty | null = null;
  let currentConcept: string | null = null;

  for (let i = 0; i < page.length; i++) {
    const item = page[i];
    const itemIdx = offset + i + 1;

    if (item.difficulty !== currentTier) {
      currentTier = item.difficulty;
      currentConcept = null;
      lines.push(`\n${'#'.repeat(80)}`);
      lines.push(`TIER: ${currentTier.toUpperCase()}`);
      lines.push('#'.repeat(80));
    }

    if (item.concept !== currentConcept) {
      currentConcept = item.concept;
      lines.push(`\n--- Concept: ${currentConcept} ---`);
    }

    const itemText = item.kind === 'text' ? item.text : `[IMAGE] ${item.caption}`;

    lines.push(`\n[${itemIdx}] id: ${item.id}`);
    lines.push(`    concept: ${item.concept}`);
    lines.push(`    text: ${itemText}`);
    lines.push(`    current explanation: ${item.explanation}`);
  }

  lines.push('\n' + '='.repeat(80));
  if (offset + limit < total) {
    const nextOffset = offset + limit;
    lines.push(`Next batch: OFFSET=${nextOffset} npx vitest run src/data/missingEnrichment.test.ts`);
  } else {
    lines.push('Reached end of unenriched items.');
  }
  lines.push('='.repeat(80));

  return lines.join('\n');
}

describe('missing enrichment authoring helper', () => {
  it('identifies unenriched items lacking evidenceHighlights, temptingReason, or counterexample', () => {
    const mockUnenrichedItem: Item = {
      id: 'mock-test',
      kind: 'text',
      text: 'Test',
      isAI: false,
      explanation: 'Test',
      concept: 'Authentic casual brevity',
      difficulty: 'easy',
      category: 'Chat',
    };
    expect(isItemEnriched(mockUnenrichedItem)).toBe(false);
    expect(getUnenrichedItems([mockUnenrichedItem])).toHaveLength(1);
  });

  it('groups unenriched items by tier (pro, hard, medium, easy) and concept', () => {
    const mockItem: Item = {
      id: 'mock-group-test',
      kind: 'text',
      text: 'Test grouping',
      isAI: false,
      explanation: 'Test grouping explanation',
      concept: 'Authentic casual brevity',
      difficulty: 'easy',
      category: 'Chat',
    };
    const { byTier, ordered, unenriched } = groupUnenrichedItems([mockItem]);
    expect(Object.keys(byTier)).toEqual(['pro', 'hard', 'medium', 'easy']);
    expect(ordered.length).toBe(unenriched.length);
    expect(byTier.easy.get('Authentic casual brevity')?.length).toBe(1);
  });

  it('formats 50 items per run with optional offset', () => {
    const mockItem: Item = {
      id: 'mock-sample',
      kind: 'text',
      text: 'Sample text',
      isAI: true,
      explanation: 'Sample explanation',
      concept: 'Buzzword padding',
      difficulty: 'easy',
      category: 'Marketing',
    };
    const report = formatBatchReport([mockItem], { offset: 0, limit: 50 });
    expect(report).toContain('UNENRICHED ITEMS REPORT');
    expect(report).toContain('id: mock-sample');
    expect(report).toContain('concept: Buzzword padding');
    expect(report).toContain('text: Sample text');
    expect(report).toContain('current explanation: Sample explanation');
  });

  it('runs the missing-enrichment authoring report helper', () => {
    const offset = process.env.OFFSET ? Math.max(0, parseInt(process.env.OFFSET, 10) || 0) : 0;
    const report = formatBatchReport(ITEMS, { offset, limit: 50 });
    expect(report.length).toBeGreaterThan(0);
    // Log preview for authors running this test specifically
    console.log(report.slice(0, 500) + '...\n[Report generated successfully]');
  });
});
