#!/usr/bin/env node
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

// Register hook to handle asset imports (e.g. .png, .jpg) when loading items.ts in Node
try {
  register(
    'data:text/javascript,' +
      encodeURIComponent(`
        export async function load(url, context, nextLoad) {
          if (/\\.(png|jpe?g|gif|svg|webp)$/i.test(url)) {
            return {
              format: 'module',
              shortCircuit: true,
              source: 'export default ' + JSON.stringify(url) + ';',
            };
          }
          return nextLoad(url, context);
        }
      `)
  );
} catch {
  // Ignore if loader registration is not supported or already registered
}

const { ITEMS } = await import('../src/data/items.ts');

export const TIERS = ['pro', 'hard', 'medium', 'easy'];

/**
 * Returns true if an item has all three enrichment fields:
 * 1. non-empty evidenceHighlights array
 * 2. non-empty temptingReason string
 * 3. non-empty counterexample string
 */
export function isItemEnriched(item) {
  const hasHighlights = Array.isArray(item.evidenceHighlights) && item.evidenceHighlights.length > 0;
  const hasTempting = typeof item.temptingReason === 'string' && item.temptingReason.trim().length > 0;
  const hasCounter = typeof item.counterexample === 'string' && item.counterexample.trim().length > 0;
  return Boolean(hasHighlights && hasTempting && hasCounter);
}

/**
 * Filters items for those lacking any of evidenceHighlights, temptingReason, or counterexample.
 */
export function getUnenrichedItems(items = ITEMS) {
  return items.filter((item) => !isItemEnriched(item));
}

/**
 * Groups unenriched items by tier (pro, hard, medium, easy) and then by concept.
 * Returns both the nested structure and a flattened ordered array for pagination.
 */
export function groupUnenrichedItems(items = ITEMS) {
  const unenriched = getUnenrichedItems(items);
  const byTier = {};
  for (const tier of TIERS) {
    byTier[tier] = new Map();
  }

  for (const item of unenriched) {
    const tier = item.difficulty;
    if (!byTier[tier]) {
      byTier[tier] = new Map();
    }
    const concept = item.concept || 'Uncategorized';
    if (!byTier[tier].has(concept)) {
      byTier[tier].set(concept, []);
    }
    byTier[tier].get(concept).push(item);
  }

  // Flatten into ordered list preserving tier (pro -> hard -> medium -> easy) and concept order
  const ordered = [];
  for (const tier of TIERS) {
    const conceptsMap = byTier[tier];
    if (!conceptsMap) continue;
    const sortedConcepts = Array.from(conceptsMap.keys()).sort();
    for (const concept of sortedConcepts) {
      const itemsInConcept = conceptsMap.get(concept);
      for (const item of itemsInConcept) {
        ordered.push(item);
      }
    }
  }

  return { unenriched, byTier, ordered };
}

/**
 * Parses offset and limit from CLI arguments or environment variables.
 */
export function parseOffset(argv = process.argv.slice(2), env = process.env) {
  let offset = 0;
  let limit = 50;

  if (env.OFFSET !== undefined) {
    const parsed = parseInt(env.OFFSET, 10);
    if (!Number.isNaN(parsed) && parsed >= 0) offset = parsed;
  }
  if (env.LIMIT !== undefined) {
    const parsed = parseInt(env.LIMIT, 10);
    if (!Number.isNaN(parsed) && parsed > 0) limit = parsed;
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (/^\d+$/.test(arg)) {
      offset = parseInt(arg, 10);
    } else if (arg.startsWith('--offset=')) {
      const parsed = parseInt(arg.split('=')[1], 10);
      if (!Number.isNaN(parsed) && parsed >= 0) offset = parsed;
    } else if (arg === '--offset' && i + 1 < argv.length) {
      const parsed = parseInt(argv[++i], 10);
      if (!Number.isNaN(parsed) && parsed >= 0) offset = parsed;
    } else if (arg.startsWith('--limit=')) {
      const parsed = parseInt(arg.split('=')[1], 10);
      if (!Number.isNaN(parsed) && parsed > 0) limit = parsed;
    } else if (arg === '--limit' && i + 1 < argv.length) {
      const parsed = parseInt(argv[++i], 10);
      if (!Number.isNaN(parsed) && parsed > 0) limit = parsed;
    }
  }

  return { offset, limit };
}

/**
 * Formats a 50-item window report of unenriched items grouped by tier and concept.
 */
export function formatBatchReport(items = ITEMS, options = {}) {
  const { offset = 0, limit = 50 } = options;
  const { unenriched, ordered } = groupUnenrichedItems(items);
  const total = unenriched.length;
  const page = ordered.slice(offset, offset + limit);

  const lines = [];
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

  let currentTier = null;
  let currentConcept = null;

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
    lines.push(`Next batch: OFFSET=${nextOffset} node scripts/missing-enrichment.mjs ${nextOffset}`);
  } else {
    lines.push('Reached end of unenriched items.');
  }
  lines.push('='.repeat(80));

  return lines.join('\n');
}

export function runCLI() {
  const { offset, limit } = parseOffset();
  const report = formatBatchReport(ITEMS, { offset, limit });
  console.log(report);
}

// Auto-run if executed as script entry point
const isMain =
  process.argv[1] &&
  (pathToFileURL(process.argv[1]).href === import.meta.url ||
    import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/')));

if (isMain) {
  runCLI();
}
