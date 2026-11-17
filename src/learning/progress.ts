import type { SessionRecord } from './sessions';

export interface MetricDelta {
  current: number;
  priorMean: number;
  delta: number;
  formatted: string;
}

export interface ProgressComparison {
  hasSufficientHistory: boolean;
  priorSessionsCount: number;
  sourceAccuracyDelta: MetricDelta | null;
  tellAccuracyDelta: MetricDelta | null;
  calibrationDelta: MetricDelta | null;
}

/**
 * Compares current session performance against the average of the previous completed sessions (up to 5).
 * Requires at least 2 prior completed sessions to show comparison.
 */
export function calculateProgressComparison(
  current: {
    sourceAccuracy: number;
    tellAccuracy: number;
    calibration: number;
  },
  priorCompletedSessions: SessionRecord[]
): ProgressComparison {
  // Use up to 5 most recent prior completed sessions
  const recent = priorCompletedSessions.slice(-5);
  const count = recent.length;

  if (count < 2) {
    return {
      hasSufficientHistory: false,
      priorSessionsCount: count,
      sourceAccuracyDelta: null,
      tellAccuracyDelta: null,
      calibrationDelta: null,
    };
  }

  const meanSource = Math.round(recent.reduce((sum, s) => sum + s.sourceAccuracy, 0) / count);
  const meanTell = Math.round(recent.reduce((sum, s) => sum + s.tellAccuracy, 0) / count);
  const meanCal = Math.round(recent.reduce((sum, s) => sum + s.calibration, 0) / count);

  function formatDelta(currentVal: number, meanVal: number): MetricDelta {
    const delta = currentVal - meanVal;
    let formatted: string;
    const runsText = `your last ${count} runs`;
    if (delta > 0) {
      formatted = `Up ${delta} pts vs ${runsText}`;
    } else if (delta < 0) {
      formatted = `Down ${Math.abs(delta)} pts vs ${runsText}`;
    } else {
      formatted = `Even with ${runsText}`;
    }
    return {
      current: currentVal,
      priorMean: meanVal,
      delta,
      formatted,
    };
  }

  return {
    hasSufficientHistory: true,
    priorSessionsCount: count,
    sourceAccuracyDelta: formatDelta(current.sourceAccuracy, meanSource),
    tellAccuracyDelta: formatDelta(current.tellAccuracy, meanTell),
    calibrationDelta: formatDelta(current.calibration, meanCal),
  };
}
