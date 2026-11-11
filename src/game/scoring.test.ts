import { describe, it, expect } from 'vitest';
import { createStats, applyGuess, accuracyPercent, hitMilestone, STREAK_MILESTONES } from './scoring';

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
