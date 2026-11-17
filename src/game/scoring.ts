import type { Difficulty } from '../data/types';
import type { RoundResult, ConfidenceLevel } from '../learning/types';

export interface Stats {
  score: number;
  streak: number;
  bestStreak: number;
  roundsPlayed: number;
  correctCount: number;
  tellCorrectCount?: number;
  unsureCount?: number;
  highConfidenceMisses?: number;
  results?: RoundResult[];
}

export function createStats(extended = false): Stats {
  const base = {
    score: 0,
    streak: 0,
    bestStreak: 0,
    roundsPlayed: 0,
    correctCount: 0,
  };
  if (extended) {
    return {
      ...base,
      tellCorrectCount: 0,
      unsureCount: 0,
      highConfidenceMisses: 0,
      results: [],
    };
  }
  return base;
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
    const res: Stats = {
      score: stats.score + points,
      streak: newStreak,
      bestStreak: Math.max(stats.bestStreak, newStreak),
      roundsPlayed: stats.roundsPlayed + 1,
      correctCount: stats.correctCount + 1,
    };
    if (stats.tellCorrectCount !== undefined) res.tellCorrectCount = stats.tellCorrectCount;
    if (stats.unsureCount !== undefined) res.unsureCount = stats.unsureCount;
    if (stats.highConfidenceMisses !== undefined) res.highConfidenceMisses = stats.highConfidenceMisses;
    if (stats.results !== undefined) res.results = stats.results;
    return res;
  }

  const res: Stats = {
    score: stats.score,
    streak: 0,
    bestStreak: stats.bestStreak,
    roundsPlayed: stats.roundsPlayed + 1,
    correctCount: stats.correctCount,
  };
  if (stats.tellCorrectCount !== undefined) res.tellCorrectCount = stats.tellCorrectCount;
  if (stats.unsureCount !== undefined) res.unsureCount = stats.unsureCount;
  if (stats.highConfidenceMisses !== undefined) res.highConfidenceMisses = stats.highConfidenceMisses;
  if (stats.results !== undefined) res.results = stats.results;
  return res;
}

/**
 * Calculates score for a detailed inquiry round:
 * - Rewards source correctness with tier points + confidence bonus
 * - Grants partial credit (+1) for identifying the correct tell regardless of source guess
 * - Protects score and streak on calibrated "Unsure" answers (+1 safe point)
 */
export function calculateRoundPoints(
  difficulty: Difficulty,
  isCorrect: boolean,
  isUnsure: boolean,
  confidence: ConfidenceLevel,
  tellCorrect: boolean
): number {
  let points = 0;

  if (isCorrect) {
    points += DIFFICULTY_POINTS[difficulty] ?? 1;
    if (confidence === 'high') {
      points += 1; // High confidence conviction bonus
    }
  } else if (isUnsure) {
    points += 1; // Safe calibrated score without penalization
  }

  if (tellCorrect) {
    points += 1; // Partial credit for identifying the underlying tell
  }

  return points;
}

export function applyDetailedGuess(stats: Stats, roundResult: RoundResult): Stats {
  const currentResults = stats.results ? [...stats.results, roundResult] : [roundResult];
  const isCorrect = roundResult.isCorrect;
  const isUnsure = roundResult.isUnsure;
  const tellCorrect = roundResult.tellCorrect;
  const isHighConfidenceMiss = !isCorrect && !isUnsure && roundResult.confidence === 'high';

  let nextStreak = stats.streak;
  if (isCorrect) {
    nextStreak = stats.streak + 1;
  } else if (isUnsure) {
    // Unsure preserves streak without breaking it
    nextStreak = stats.streak;
  } else {
    nextStreak = 0;
  }

  const newScore = stats.score + roundResult.pointsAwarded;
  const newBestStreak = Math.max(stats.bestStreak, nextStreak);

  return {
    score: newScore,
    streak: nextStreak,
    bestStreak: newBestStreak,
    roundsPlayed: stats.roundsPlayed + 1,
    correctCount: stats.correctCount + (isCorrect ? 1 : 0),
    tellCorrectCount: (stats.tellCorrectCount ?? 0) + (tellCorrect ? 1 : 0),
    unsureCount: (stats.unsureCount ?? 0) + (isUnsure ? 1 : 0),
    highConfidenceMisses: (stats.highConfidenceMisses ?? 0) + (isHighConfidenceMiss ? 1 : 0),
    results: currentResults,
  };
}

export function accuracyPercent(stats: Stats): number {
  if (stats.roundsPlayed === 0) {
    return 0;
  }
  return Math.round((stats.correctCount / stats.roundsPlayed) * 100);
}

export function tellAccuracyPercent(stats: Stats): number {
  if (stats.roundsPlayed === 0) {
    return 0;
  }
  return Math.round(((stats.tellCorrectCount ?? 0) / stats.roundsPlayed) * 100);
}

/**
 * Calculates a calibration score (0 - 100) based on confidence calibration:
 * High confidence + correct = well calibrated (1.0)
 * High confidence + incorrect = poor calibration (0.0)
 * Low confidence / unsure = calibrated awareness of uncertainty (0.75 - 0.8)
 */
export function calculateCalibrationScore(results: RoundResult[]): number {
  if (!results || results.length === 0) {
    return 100;
  }

  let totalScore = 0;
  for (const r of results) {
    if (r.isUnsure) {
      totalScore += 80;
    } else if (r.confidence === 'high') {
      totalScore += r.isCorrect ? 100 : 10;
    } else if (r.confidence === 'medium') {
      totalScore += r.isCorrect ? 85 : 45;
    } else {
      // low confidence
      totalScore += r.isCorrect ? 70 : 65;
    }
  }

  return Math.round(totalScore / results.length);
}

/**
 * Identifies the player's strongest and weakest tells based on round results.
 */
export function getStrongestAndWeakestTells(results: RoundResult[]): {
  strongest: { concept: string; accuracy: number } | null;
  weakest: { concept: string; accuracy: number } | null;
} {
  if (!results || results.length === 0) {
    return { strongest: null, weakest: null };
  }

  const map = new Map<string, { total: number; correct: number }>();
  for (const r of results) {
    const entry = map.get(r.concept) || { total: 0, correct: 0 };
    entry.total += 1;
    if (r.isCorrect || r.tellCorrect) entry.correct += 1;
    map.set(r.concept, entry);
  }

  const entries = Array.from(map.entries()).map(([concept, { total, correct }]) => ({
    concept,
    accuracy: Math.round((correct / total) * 100),
  }));

  entries.sort((a, b) => b.accuracy - a.accuracy);

  return {
    strongest: entries[0] ?? null,
    weakest: entries[entries.length - 1] ?? null,
  };
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
