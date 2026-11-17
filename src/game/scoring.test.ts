import { describe, it, expect } from 'vitest';
import {
  createStats,
  applyGuess,
  applyDetailedGuess,
  calculateRoundPoints,
  calculateCalibrationScore,
  getStrongestAndWeakestTells,
  tellAccuracyPercent,
  accuracyPercent,
  hitMilestone,
  STREAK_MILESTONES,
  getRank,
  getStreakLabel,
  DIFFICULTY_POINTS,
} from './scoring';
import type { RoundResult } from '../learning/types';

describe('createStats', () => {
  it('starts all fields at zero', () => {
    expect(createStats()).toEqual({ score: 0, streak: 0, bestStreak: 0, roundsPlayed: 0, correctCount: 0 });
  });
});

describe('applyGuess', () => {
  it('on a correct guess increments score, streak, roundsPlayed, correctCount, and raises bestStreak', () => {
    const s = applyGuess(applyGuess(createStats(), true), true);
    expect(s).toEqual({ score: 2, streak: 2, bestStreak: 2, roundsPlayed: 2, correctCount: 2 });
  });

  it('on an incorrect guess resets streak to 0 but keeps bestStreak and increments roundsPlayed', () => {
    const afterTwoCorrect = applyGuess(applyGuess(createStats(), true), true);
    const s = applyGuess(afterTwoCorrect, false);
    expect(s).toEqual({ score: 2, streak: 0, bestStreak: 2, roundsPlayed: 3, correctCount: 2 });
  });

  it('awards the given points for a correct guess instead of a flat 1, and nothing for an incorrect one', () => {
    const s = applyGuess(createStats(), true, DIFFICULTY_POINTS.pro);
    expect(s.score).toBe(5);
    const s2 = applyGuess(s, false, DIFFICULTY_POINTS.pro);
    expect(s2.score).toBe(5);
  });
});

describe('DIFFICULTY_POINTS', () => {
  it('increases strictly from easy to pro', () => {
    expect(DIFFICULTY_POINTS.easy).toBeLessThan(DIFFICULTY_POINTS.medium);
    expect(DIFFICULTY_POINTS.medium).toBeLessThan(DIFFICULTY_POINTS.hard);
    expect(DIFFICULTY_POINTS.hard).toBeLessThan(DIFFICULTY_POINTS.pro);
  });
});

describe('accuracyPercent', () => {
  it('returns 0 when no rounds have been played', () => {
    expect(accuracyPercent(createStats())).toBe(0);
  });

  it('returns the rounded percent of correct guesses', () => {
    const s = applyGuess(applyGuess(applyGuess(createStats(), true), true), false);
    expect(accuracyPercent(s)).toBe(67);
  });
});

describe('hitMilestone', () => {
  it('is true exactly when the streak newly reaches a milestone', () => {
    expect(hitMilestone(2, 3)).toBe(true);
    expect(STREAK_MILESTONES).toContain(3);
  });

  it('is false for a non-milestone streak value', () => {
    expect(hitMilestone(3, 4)).toBe(false);
  });

  it('is false when the streak resets to 0', () => {
    expect(hitMilestone(3, 0)).toBe(false);
  });
});

describe('getRank', () => {
  it('returns the four tiers at their thresholds, lowest to highest', () => {
    expect(getRank(0).title).toBe('Feature Spotter');
    expect(getRank(49).title).toBe('Feature Spotter');
    expect(getRank(50).title).toBe('Pattern Analyst');
    expect(getRank(74).title).toBe('Pattern Analyst');
    expect(getRank(75).title).toBe('Signal Reader');
    expect(getRank(89).title).toBe('Signal Reader');
    expect(getRank(90).title).toBe('Model Whisperer');
    expect(getRank(100).title).toBe('Model Whisperer');
  });
});

describe('getStreakLabel', () => {
  it('returns null below the first milestone', () => {
    expect(getStreakLabel(0)).toBeNull();
    expect(getStreakLabel(2)).toBeNull();
  });

  it('returns a label at and above each milestone', () => {
    expect(getStreakLabel(3)).toBe('Pattern spotted');
    expect(getStreakLabel(5)).toBe('Reading the signal');
    expect(getStreakLabel(8)).toBe('Consistent detector');
    expect(getStreakLabel(12)).toBe('Near-perfect run');
    expect(getStreakLabel(20)).toBe('Near-perfect run');
  });
});

describe('calculateRoundPoints and applyDetailedGuess', () => {
  it('awards points for difficulty tier plus bonus for high confidence and tell', () => {
    const points = calculateRoundPoints('hard', true, false, 'high', true);
    // 3 base + 1 high-conf + 1 tell = 5
    expect(points).toBe(5);
  });

  it('awards partial credit when tell is correctly identified even if source guess was wrong', () => {
    const points = calculateRoundPoints('medium', false, false, 'low', true);
    expect(points).toBe(1);
  });

  it('awards safe points for unsure without breaking streak in applyDetailedGuess', () => {
    const initial = createStats(true);
    initial.streak = 2;
    initial.bestStreak = 2;

    const roundResult: RoundResult = {
      itemId: 'x',
      concept: 'Buzzword padding',
      difficulty: 'easy',
      prediction: 'unsure',
      actualSource: 'ai',
      isCorrect: false,
      isUnsure: true,
      confidence: 'low',
      selectedTell: 'Buzzword padding',
      tellCorrect: true,
      pointsAwarded: 2, // 1 safe + 1 tell
      timestamp: Date.now(),
    };

    const next = applyDetailedGuess(initial, roundResult);
    expect(next.streak).toBe(2); // Streak preserved!
    expect(next.score).toBe(2);
    expect(next.unsureCount).toBe(1);
    expect(next.tellCorrectCount).toBe(1);
  });

  it('calculates calibration score appropriately', () => {
    const results: RoundResult[] = [
      {
        itemId: '1',
        concept: 'c1',
        difficulty: 'easy',
        prediction: 'human',
        actualSource: 'human',
        isCorrect: true,
        isUnsure: false,
        confidence: 'high',
        selectedTell: 'c1',
        tellCorrect: true,
        pointsAwarded: 2,
        timestamp: Date.now(),
      },
    ];
    expect(calculateCalibrationScore(results)).toBe(100);
  });

  it('determines strongest and weakest tells from results', () => {
    const results: RoundResult[] = [
      {
        itemId: '1',
        concept: 'Strong concept',
        difficulty: 'easy',
        prediction: 'human',
        actualSource: 'human',
        isCorrect: true,
        isUnsure: false,
        confidence: 'high',
        selectedTell: 'Strong concept',
        tellCorrect: true,
        pointsAwarded: 2,
        timestamp: Date.now(),
      },
      {
        itemId: '2',
        concept: 'Weak concept',
        difficulty: 'easy',
        prediction: 'ai',
        actualSource: 'human',
        isCorrect: false,
        isUnsure: false,
        confidence: 'high',
        selectedTell: 'other',
        tellCorrect: false,
        pointsAwarded: 0,
        timestamp: Date.now(),
      },
    ];
    const { strongest, weakest } = getStrongestAndWeakestTells(results);
    expect(strongest?.concept).toBe('Strong concept');
    expect(weakest?.concept).toBe('Weak concept');
  });
});
