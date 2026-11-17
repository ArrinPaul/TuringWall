import { describe, it, expect } from 'vitest';
import {
  loadMastery,
  calculateNextTier,
  calculateNextReviewTime,
  applyRoundToMastery,
  selectDailyChallengeDeck,
  selectWeakTellsDeck,
  selectMissedQuestionsDeck,
} from './mastery';
import type { RoundResult } from './types';
import type { Item } from '../data/types';

const mockItems: Item[] = [
  { id: '1', kind: 'text', text: 'T1', isAI: false, explanation: 'e1', concept: 'Buzzword padding', difficulty: 'easy', category: 'Marketing' },
  { id: '2', kind: 'text', text: 'T2', isAI: true, explanation: 'e2', concept: 'Buzzword padding', difficulty: 'medium', category: 'Chat' },
  { id: '3', kind: 'text', text: 'T3', isAI: false, explanation: 'e3', concept: 'Universal platitude', difficulty: 'easy', category: 'Inspiration' },
  { id: '4', kind: 'text', text: 'T4', isAI: true, explanation: 'e4', concept: 'Candid developer voice', difficulty: 'hard', category: 'Code' },
  { id: '5', kind: 'text', text: 'T5', isAI: false, explanation: 'e5', concept: 'Specific lived detail', difficulty: 'easy', category: 'Journal' },
  { id: '6', kind: 'text', text: 'T6', isAI: true, explanation: 'e6', concept: 'Formulaic symmetry', difficulty: 'medium', category: 'Image' },
];

describe('Mastery State Machine', () => {
  it('advances from new to practicing upon correct answer', () => {
    const next = calculateNextTier('new', true, true, 1);
    expect(next).toBe('practicing');
  });

  it('marks tier as shaky upon wrong answer from any state', () => {
    expect(calculateNextTier('new', false, false, 0)).toBe('shaky');
    expect(calculateNextTier('practicing', false, false, 0)).toBe('shaky');
    expect(calculateNextTier('familiar', false, false, 0)).toBe('shaky');
    expect(calculateNextTier('mastered', false, false, 0)).toBe('shaky');
  });

  it('advances from practicing to familiar with consecutive correct and tell identified', () => {
    const next = calculateNextTier('practicing', true, true, 2);
    expect(next).toBe('familiar');
  });

  it('advances from familiar to mastered with 4 consecutive correct and tell identified', () => {
    const next = calculateNextTier('familiar', true, true, 4);
    expect(next).toBe('mastered');
  });

  it('recovers from shaky to practicing upon getting it correct', () => {
    const next = calculateNextTier('shaky', true, false, 1);
    expect(next).toBe('practicing');
  });
});

describe('Spaced Review Scheduling', () => {
  it('schedules shorter review interval for shaky or missed items', () => {
    const now = 1000000;
    const timeWrong = calculateNextReviewTime('shaky', false, now);
    const timeCorrect = calculateNextReviewTime('mastered', true, now);
    expect(timeWrong - now).toBeLessThan(timeCorrect - now);
  });
});

describe('applyRoundToMastery', () => {
  it('updates concept mastery metrics and review time', () => {
    const initialMap = loadMastery();
    const roundResult: RoundResult = {
      itemId: '1',
      concept: 'Buzzword padding',
      difficulty: 'easy',
      prediction: 'ai',
      actualSource: 'ai',
      isCorrect: true,
      isUnsure: false,
      confidence: 'high',
      selectedTell: 'Buzzword padding',
      tellCorrect: true,
      pointsAwarded: 2,
      timestamp: Date.now(),
    };

    const { nextMap, updatedConcept } = applyRoundToMastery(initialMap, roundResult);
    expect(updatedConcept.correctCount).toBe(1);
    expect(updatedConcept.tellIdentifiedCount).toBe(1);
    expect(updatedConcept.tier).toBe('practicing');
    expect(nextMap['Buzzword padding'].tier).toBe('practicing');
  });
});

describe('Daily Challenge and Practice Deck Selection', () => {
  it('selects 5 items combining review and new concepts', () => {
    const initialMap = loadMastery();
    // mark one shaky
    initialMap['Buzzword padding'].tier = 'shaky';
    const deck = selectDailyChallengeDeck(mockItems, initialMap, 5, () => 0.1);
    expect(deck).toHaveLength(5);
  });

  it('selects weak tells deck prioritizing shaky concepts', () => {
    const initialMap = loadMastery();
    initialMap['Buzzword padding'].tier = 'shaky';
    const deck = selectWeakTellsDeck(mockItems, initialMap, 3);
    expect(deck.length).toBe(3);
    expect(deck.some((i) => i.concept === 'Buzzword padding')).toBe(true);
  });

  it('selects missed questions deck from queue', () => {
    const deck = selectMissedQuestionsDeck(mockItems, ['3', '5'], 2);
    expect(deck).toHaveLength(2);
    expect(deck.map((i) => i.id)).toEqual(['3', '5']);
  });

  it('never serves the exact item id most recently missed in daily challenge when an alternative exists', () => {
    const initialMap = loadMastery();
    initialMap['Buzzword padding'].tier = 'shaky';
    // '1' and '2' both belong to 'Buzzword padding'. If '1' was recently missed, '2' should be selected.
    const deck = selectDailyChallengeDeck(mockItems, initialMap, 5, () => 0.1, ['1']);
    const buzzwordItem = deck.find((i) => i.concept === 'Buzzword padding');
    expect(buzzwordItem).toBeDefined();
    expect(buzzwordItem?.id).toBe('2');
    expect(buzzwordItem?.id).not.toBe('1');
  });

  it('falls back gracefully to the only item when a concept has only 1 item and it was missed', () => {
    const initialMap = loadMastery();
    initialMap['Formulaic symmetry'].tier = 'shaky';
    // Item '6' is the only item for 'Formulaic symmetry'
    const deck = selectDailyChallengeDeck(mockItems, initialMap, 5, () => 0.1, ['6']);
    const item = deck.find((i) => i.concept === 'Formulaic symmetry');
    expect(item).toBeDefined();
    expect(item?.id).toBe('6');
  });
});
