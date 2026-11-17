import type { Difficulty, SessionMode } from '../data/types';

export type ConfidenceLevel = 'low' | 'medium' | 'high';

export type PredictionChoice = 'human' | 'ai' | 'unsure';

export type MasteryTier = 'new' | 'practicing' | 'familiar' | 'shaky' | 'mastered';

export type PracticeMode = SessionMode | 'weak-tells' | 'review-missed' | 'daily-challenge';

export interface ConceptMastery {
  concept: string;
  tier: MasteryTier;
  correctCount: number;
  incorrectCount: number;
  tellIdentifiedCount: number;
  lastPracticed: number | null;
  nextReview: number | null;
  consecutiveCorrect: number;
}

export interface RoundResult {
  itemId: string;
  concept: string;
  difficulty: Difficulty;
  category?: string;
  prediction: PredictionChoice;
  actualSource: 'human' | 'ai';
  isCorrect: boolean;
  isUnsure: boolean;
  confidence: ConfidenceLevel;
  selectedTell: string | null;
  tellCorrect: boolean;
  pointsAwarded: number;
  timestamp: number;
}

export interface CalibrationStats {
  score: number; // 0 - 100 calibration index
  highConfidenceTotal: number;
  highConfidenceCorrect: number;
  highConfidenceMisses: number;
  mediumConfidenceTotal: number;
  mediumConfidenceCorrect: number;
  lowConfidenceTotal: number;
  lowConfidenceCorrect: number;
  unsureCount: number;
}

export interface ConceptDetail {
  concept: string;
  category: 'writing' | 'code' | 'image' | 'tone' | 'reasoning';
  signalBias: 'human' | 'ai' | 'context-dependent';
  definition: string;
  plainExplanation: string;
  positiveExample: string;
  counterexample: string;
  whyFooled: string;
  rememberThis: string;
  chapter: string;
}

export interface SessionLearningSummary {
  mode: PracticeMode;
  roundsPlayed: number;
  score: number;
  sourceAccuracy: number;
  tellAccuracy: number;
  calibration: CalibrationStats;
  strongestTell: { concept: string; accuracy: number } | null;
  weakestTell: { concept: string; accuracy: number } | null;
  missedQuestionIds: string[];
  conceptsPracticed: string[];
  completed: boolean;
}
