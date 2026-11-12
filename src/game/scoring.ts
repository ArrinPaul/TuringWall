import type { Difficulty } from '../data/types';

export interface Stats {
  score: number;
  streak: number;
  bestStreak: number;
  roundsPlayed: number;
  correctCount: number;
}

export function createStats(): Stats {
  return {
    score: 0,
    streak: 0,
    bestStreak: 0,
    roundsPlayed: 0,
    correctCount: 0,
  };
}

/** Harder tiers are worth more points — the engagement hook for climbing tiers. */
export const DIFFICULTY_POINTS: Record<Difficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
  pro: 5,
};

export function applyGuess(stats: Stats, correct: boolean, points: number = 1): Stats {
  if (correct) {
    const newStreak = stats.streak + 1;
    return {
      score: stats.score + points,
      streak: newStreak,
      bestStreak: Math.max(stats.bestStreak, newStreak),
      roundsPlayed: stats.roundsPlayed + 1,
      correctCount: stats.correctCount + 1,
    };
  }

  return {
    score: stats.score,
    streak: 0,
    bestStreak: stats.bestStreak,
    roundsPlayed: stats.roundsPlayed + 1,
    correctCount: stats.correctCount,
  };
}

export function accuracyPercent(stats: Stats): number {
  if (stats.roundsPlayed === 0) {
    return 0;
  }
  return Math.round((stats.correctCount / stats.roundsPlayed) * 100);
}

export const STREAK_MILESTONES: number[] = [3, 5, 8, 12];

export function hitMilestone(prevStreak: number, newStreak: number): boolean {
  return newStreak > prevStreak && STREAK_MILESTONES.includes(newStreak);
}

export interface Rank {
  title: string;
  note: string;
}

/** A skill-progression ladder, not a gamer/trivia title — matches the stall's AI-literacy framing. */
export function getRank(accuracy: number): Rank {
  if (accuracy >= 90) {
    return { title: 'Model Whisperer', note: 'You read the statistical tells almost every time.' };
  }
  if (accuracy >= 75) {
    return { title: 'Signal Reader', note: 'You caught most of the subtle patterns.' };
  }
  if (accuracy >= 50) {
    return { title: 'Pattern Analyst', note: 'You are starting to spot the recurring tells.' };
  }
  return { title: 'Feature Spotter', note: 'The line between generated and genuine takes practice to see.' };
}

/** Short, non-decorative labels for an in-round streak celebration. */
export function getStreakLabel(streak: number): string | null {
  if (streak >= 12) return 'Near-perfect run';
  if (streak >= 8) return 'Consistent detector';
  if (streak >= 5) return 'Reading the signal';
  if (streak >= 3) return 'Pattern spotted';
  return null;
}
