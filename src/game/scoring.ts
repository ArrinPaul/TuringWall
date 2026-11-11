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

export function applyGuess(stats: Stats, correct: boolean): Stats {
  if (correct) {
    const newStreak = stats.streak + 1;
    return {
      score: stats.score + 1,
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
