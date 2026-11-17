import type { ConceptMastery, MasteryTier, RoundResult } from './types';
import { allConcepts } from '../character/fieldGuide';
import type { Item } from '../data/types';

export const MASTERY_STORAGE_KEY = 'real-or-ai-wall:mastery:v2';
const MISSED_QUESTIONS_KEY = 'real-or-ai-wall:missed-questions:v2';

export type MasteryMap = Record<string, ConceptMastery>;

function defaultMastery(concept: string): ConceptMastery {
  return {
    concept,
    tier: 'new',
    correctCount: 0,
    incorrectCount: 0,
    tellIdentifiedCount: 0,
    lastPracticed: null,
    nextReview: null,
    consecutiveCorrect: 0,
  };
}

export function loadMastery(): MasteryMap {
  try {
    const raw = localStorage.getItem(MASTERY_STORAGE_KEY);
    const map: MasteryMap = {};
    const existing = raw ? JSON.parse(raw) : {};

    for (const concept of allConcepts()) {
      if (existing && existing[concept]) {
        map[concept] = { ...defaultMastery(concept), ...existing[concept] };
      } else {
        map[concept] = defaultMastery(concept);
      }
    }
    return map;
  } catch {
    const map: MasteryMap = {};
    for (const concept of allConcepts()) {
      map[concept] = defaultMastery(concept);
    }
    return map;
  }
}

export function saveMastery(map: MasteryMap): void {
  try {
    localStorage.setItem(MASTERY_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // QuotaExceeded or localStorage unavailable
  }
}

export function loadMissedQuestionIds(): string[] {
  try {
    const raw = localStorage.getItem(MISSED_QUESTIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveMissedQuestionIds(ids: string[]): void {
  try {
    // Keep max 50 recent missed questions
    const capped = Array.from(new Set(ids)).slice(-50);
    localStorage.setItem(MISSED_QUESTIONS_KEY, JSON.stringify(capped));
  } catch {
    // ignore
  }
}

/**
 * Calculates next mastery tier based on previous state and performance.
 */
export function calculateNextTier(
  currentTier: MasteryTier,
  isCorrect: boolean,
  tellCorrect: boolean,
  consecutiveCorrect: number
): MasteryTier {
  if (!isCorrect) {
    return 'shaky';
  }

  // If answer was correct
  if (currentTier === 'new') {
    return 'practicing';
  }

  if (currentTier === 'shaky') {
    return 'practicing';
  }

  if (currentTier === 'practicing') {
    if (consecutiveCorrect >= 2 && tellCorrect) {
      return 'familiar';
    }
    if (consecutiveCorrect >= 3) {
      return 'familiar';
    }
    return 'practicing';
  }

  if (currentTier === 'familiar') {
    if (consecutiveCorrect >= 4 && tellCorrect) {
      return 'mastered';
    }
    return 'familiar';
  }

  if (currentTier === 'mastered') {
    return 'mastered';
  }

  return 'practicing';
}

/**
 * Calculates spaced review interval in milliseconds.
 * Day 1: 1 day, Day 2: 3 days, Day 3: 7 days, Mastered: 14 days.
 */
export function calculateNextReviewTime(tier: MasteryTier, isCorrect: boolean, now = Date.now()): number {
  const ONE_DAY = 24 * 60 * 60 * 1000;
  if (!isCorrect) {
    return now + ONE_DAY * 0.5; // Review again in 12 hours
  }

  switch (tier) {
    case 'shaky':
      return now + ONE_DAY;
    case 'practicing':
      return now + ONE_DAY * 2;
    case 'familiar':
      return now + ONE_DAY * 5;
    case 'mastered':
      return now + ONE_DAY * 14;
    case 'new':
    default:
      return now + ONE_DAY;
  }
}

/**
 * Pure function: records a single round result and updates mastery map and missed questions.
 */
export function applyRoundToMastery(
  map: MasteryMap,
  result: RoundResult,
  now = Date.now()
): { nextMap: MasteryMap; updatedConcept: ConceptMastery } {
  const concept = result.concept;
  const current = map[concept] ? { ...map[concept] } : defaultMastery(concept);

  const nextConsecutive = result.isCorrect ? current.consecutiveCorrect + 1 : 0;
  const nextTier = calculateNextTier(
    current.tier,
    result.isCorrect,
    result.tellCorrect,
    nextConsecutive
  );
  const nextReview = calculateNextReviewTime(nextTier, result.isCorrect, now);

  const updatedConcept: ConceptMastery = {
    ...current,
    tier: nextTier,
    correctCount: current.correctCount + (result.isCorrect ? 1 : 0),
    incorrectCount: current.incorrectCount + (!result.isCorrect ? 1 : 0),
    tellIdentifiedCount: current.tellIdentifiedCount + (result.tellCorrect ? 1 : 0),
    lastPracticed: now,
    nextReview,
    consecutiveCorrect: nextConsecutive,
  };

  const nextMap = {
    ...map,
    [concept]: updatedConcept,
  };

  return { nextMap, updatedConcept };
}

/**
 * Returns concepts that are currently due for review or marked shaky.
 */
export function getDueConcepts(map: MasteryMap, now = Date.now()): string[] {
  return Object.values(map)
    .filter((m) => {
      if (m.tier === 'shaky') return true;
      if (m.nextReview && m.nextReview <= now) return true;
      return false;
    })
    .sort((a, b) => (a.nextReview ?? 0) - (b.nextReview ?? 0))
    .map((m) => m.concept);
}

/**
 * Returns concepts with shaky or practicing status (weak tells).
 */
export function getWeakConcepts(map: MasteryMap): string[] {
  return Object.values(map)
    .filter((m) => m.tier === 'shaky' || (m.incorrectCount > 0 && m.tier !== 'mastered'))
    .sort((a, b) => {
      const accA = a.correctCount / Math.max(1, a.correctCount + a.incorrectCount);
      const accB = b.correctCount / Math.max(1, b.correctCount + b.incorrectCount);
      return accA - accB;
    })
    .map((m) => m.concept);
}

/**
 * Returns concepts categorized by tier.
 */
export function getMasteryCounts(map: MasteryMap): Record<MasteryTier, number> {
  const counts: Record<MasteryTier, number> = {
    new: 0,
    practicing: 0,
    familiar: 0,
    shaky: 0,
    mastered: 0,
  };
  for (const m of Object.values(map)) {
    counts[m.tier] = (counts[m.tier] || 0) + 1;
  }
  return counts;
}

/**
 * Builds a deck tailored for "Practice Weak Tells":
 * Selects items matching the player's weak concepts, preferring items not seen recently.
 */
export function selectWeakTellsDeck(items: Item[], map: MasteryMap, count = 5): Item[] {
  const weak = getWeakConcepts(map);
  if (weak.length === 0) {
    // If no weak concepts yet, pick random items across all
    return [...items].sort(() => Math.random() - 0.5).slice(0, count);
  }

  const matching = items.filter((item) => weak.includes(item.concept));
  if (matching.length >= count) {
    return [...matching].sort(() => Math.random() - 0.5).slice(0, count);
  }

  // Backfill with other items
  const others = items.filter((item) => !weak.includes(item.concept));
  const backfill = [...others].sort(() => Math.random() - 0.5).slice(0, count - matching.length);
  return [...matching, ...backfill].sort(() => Math.random() - 0.5);
}

/**
 * Builds a deck tailored for "Review Missed Rounds":
 * Selects items whose IDs are in the player's missed-questions queue.
 */
export function selectMissedQuestionsDeck(items: Item[], missedIds: string[], count = 5): Item[] {
  if (missedIds.length === 0) {
    return [...items].sort(() => Math.random() - 0.5).slice(0, count);
  }

  const missedMap = new Map(items.map((i) => [i.id, i]));
  const matched: Item[] = [];
  for (const id of missedIds) {
    const item = missedMap.get(id);
    if (item && !matched.some((m) => m.id === item.id)) {
      matched.push(item);
    }
    if (matched.length >= count) break;
  }

  if (matched.length < count) {
    const remaining = items.filter((i) => !matched.some((m) => m.id === i.id));
    const extra = [...remaining].sort(() => Math.random() - 0.5).slice(0, count - matched.length);
    matched.push(...extra);
  }

  return matched;
}

/**
 * Builds a Daily Challenge deck:
 * Exactly 5 rounds composed of:
 * - 3 previously missed or due concepts (with varied examples across content types)
 * - 2 new concepts
 */
export function selectDailyChallengeDeck(
  items: Item[],
  map: MasteryMap,
  count = 5,
  rng: () => number = Math.random
): Item[] {
  const due = getDueConcepts(map);
  const weak = getWeakConcepts(map);
  const reviewPoolConcepts = Array.from(new Set([...due, ...weak]));

  const newConcepts = Object.values(map)
    .filter((m) => m.tier === 'new')
    .map((m) => m.concept);

  const selectedItems: Item[] = [];
  const usedConcepts = new Set<string>();

  // Pick up to 3 review items
  const reviewCandidates = items.filter((i) => reviewPoolConcepts.includes(i.concept));
  const shuffledReview = [...reviewCandidates].sort(() => rng() - 0.5);

  for (const item of shuffledReview) {
    if (!usedConcepts.has(item.concept)) {
      selectedItems.push(item);
      usedConcepts.add(item.concept);
    }
    if (selectedItems.length >= 3) break;
  }

  // Pick up to 2 new concept items
  const newCandidates = items.filter((i) => newConcepts.includes(i.concept));
  const shuffledNew = [...newCandidates].sort(() => rng() - 0.5);

  for (const item of shuffledNew) {
    if (!usedConcepts.has(item.concept)) {
      selectedItems.push(item);
      usedConcepts.add(item.concept);
    }
    if (selectedItems.length >= count) break;
  }

  // Backfill if needed
  if (selectedItems.length < count) {
    const remaining = items.filter((i) => !selectedItems.some((s) => s.id === i.id));
    const extra = [...remaining].sort(() => rng() - 0.5).slice(0, count - selectedItems.length);
    selectedItems.push(...extra);
  }

  return selectedItems.sort(() => rng() - 0.5);
}
