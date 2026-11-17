import { describe, it, expect } from 'vitest';
import { buildShareText } from '../learning/share';

describe('buildShareText privacy', () => {
  const baseParams = {
    difficulty: 'easy' as const,
    roundsPlayed: 10,
    score: 18,
    accuracy: 90,
    calibration: 85,
    rankTitle: 'Signal Scout',
    playerName: 'Ada Lovelace',
  };

  it('omits player name when showNameOnLeaderboard is false', () => {
    const text = buildShareText({
      ...baseParams,
      showNameOnLeaderboard: false,
    });

    expect(text).not.toContain('Ada Lovelace');
    expect(text).not.toContain('Player:');
    expect(text).toContain('EASY tier · 10 questions');
    expect(text).toContain('Score: 18 pts · Accuracy: 90% · Calibration: 85%');
  });

  it('includes player name when showNameOnLeaderboard is true and playerName is provided', () => {
    const text = buildShareText({
      ...baseParams,
      showNameOnLeaderboard: true,
    });

    expect(text).toContain('Player: Ada Lovelace');
    expect(text).toContain('Score: 18 pts · Accuracy: 90% · Calibration: 85%');
  });

  it('omits player name line if playerName is empty even if showNameOnLeaderboard is true', () => {
    const text = buildShareText({
      ...baseParams,
      playerName: '',
      showNameOnLeaderboard: true,
    });

    expect(text).not.toContain('Player:');
  });
});
