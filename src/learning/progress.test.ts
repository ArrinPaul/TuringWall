import { describe, it, expect } from 'vitest';
import { calculateProgressComparison } from './progress';
import type { SessionRecord } from './sessions';

function makeSession(
  sourceAccuracy: number,
  tellAccuracy: number,
  calibration: number,
  id = 'sess'
): SessionRecord {
  return {
    id,
    startedAt: 1000,
    mode: 'easy',
    roundsTarget: 10,
    roundsPlayed: 10,
    status: 'completed',
    sourceAccuracy,
    tellAccuracy,
    calibration,
    score: 10,
  };
}

describe('progress delta calculation', () => {
  const current = {
    sourceAccuracy: 80,
    tellAccuracy: 70,
    calibration: 85,
  };

  it('hides comparison when there are 0 prior completed sessions', () => {
    const res = calculateProgressComparison(current, []);
    expect(res.hasSufficientHistory).toBe(false);
    expect(res.sourceAccuracyDelta).toBeNull();
  });

  it('hides comparison when there is only 1 prior completed session', () => {
    const res = calculateProgressComparison(current, [makeSession(70, 60, 80)]);
    expect(res.hasSufficientHistory).toBe(false);
    expect(res.sourceAccuracyDelta).toBeNull();
  });

  it('shows comparison with 2 prior completed sessions', () => {
    const history = [
      makeSession(70, 60, 80, '1'),
      makeSession(70, 60, 80, '2'),
    ];
    const res = calculateProgressComparison(current, history);
    expect(res.hasSufficientHistory).toBe(true);
    expect(res.priorSessionsCount).toBe(2);

    expect(res.sourceAccuracyDelta?.delta).toBe(10);
    expect(res.sourceAccuracyDelta?.formatted).toBe('Up 10 pts vs your last 2 runs');

    expect(res.tellAccuracyDelta?.delta).toBe(10);
    expect(res.tellAccuracyDelta?.formatted).toBe('Up 10 pts vs your last 2 runs');

    expect(res.calibrationDelta?.delta).toBe(5);
    expect(res.calibrationDelta?.formatted).toBe('Up 5 pts vs your last 2 runs');
  });

  it('handles negative deltas correctly', () => {
    const history = [
      makeSession(90, 80, 90, '1'),
      makeSession(90, 80, 90, '2'),
    ];
    const res = calculateProgressComparison(current, history);
    expect(res.hasSufficientHistory).toBe(true);
    expect(res.sourceAccuracyDelta?.delta).toBe(-10);
    expect(res.sourceAccuracyDelta?.formatted).toBe('Down 10 pts vs your last 2 runs');
  });

  it('handles ties (zero delta) correctly', () => {
    const history = [
      makeSession(80, 70, 85, '1'),
      makeSession(80, 70, 85, '2'),
    ];
    const res = calculateProgressComparison(current, history);
    expect(res.hasSufficientHistory).toBe(true);
    expect(res.sourceAccuracyDelta?.delta).toBe(0);
    expect(res.sourceAccuracyDelta?.formatted).toBe('Even with your last 2 runs');
  });

  it('uses the last 5 completed sessions when more than 5 exist', () => {
    const history = [
      makeSession(10, 10, 10, 'old1'),
      makeSession(10, 10, 10, 'old2'),
      // Most recent 5:
      makeSession(70, 70, 70, 'r1'),
      makeSession(70, 70, 70, 'r2'),
      makeSession(70, 70, 70, 'r3'),
      makeSession(70, 70, 70, 'r4'),
      makeSession(70, 70, 70, 'r5'),
    ];
    const res = calculateProgressComparison(current, history);
    expect(res.hasSufficientHistory).toBe(true);
    expect(res.priorSessionsCount).toBe(5);
    // Mean of last 5 is 70; current is 80 -> Up 10 pts
    expect(res.sourceAccuracyDelta?.delta).toBe(10);
    expect(res.sourceAccuracyDelta?.formatted).toBe('Up 10 pts vs your last 5 runs');
  });
});
