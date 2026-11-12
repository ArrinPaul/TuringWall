import { describe, it, expect } from 'vitest';
import { pickLine, closingLine, moodForGuess } from './signal';

describe('pickLine', () => {
  it('returns the first line when rng returns 0', () => {
    expect(pickLine('correct', () => 0)).toBe('Correct. Predictable, but correct.');
  });

  it('returns the last line when rng returns just under 1', () => {
    expect(pickLine('correct', () => 0.999)).toBe('That one had a clean tell.');
  });

  it('never throws for any mood', () => {
    for (const mood of ['neutral', 'thinking', 'correct', 'incorrect', 'smug'] as const) {
      expect(() => pickLine(mood, () => 0.5)).not.toThrow();
    }
  });
});

describe('closingLine', () => {
  it('returns a specific line for each known rank', () => {
    expect(closingLine('Model Whisperer')).toContain('read it like I do');
    expect(closingLine('Feature Spotter')).toContain('sharpens');
  });

  it('falls back to a generic line for an unknown rank', () => {
    expect(closingLine('Something Else')).toBe('Good run.');
  });
});

describe('moodForGuess', () => {
  it('is "correct" on a correct guess below the smug streak threshold', () => {
    expect(moodForGuess(true, 1)).toBe('correct');
    expect(moodForGuess(true, 4)).toBe('correct');
  });

  it('is "smug" on a correct guess at or above a 5-streak', () => {
    expect(moodForGuess(true, 5)).toBe('smug');
    expect(moodForGuess(true, 9)).toBe('smug');
  });

  it('is "incorrect" on a wrong guess regardless of streak', () => {
    expect(moodForGuess(false, 0)).toBe('incorrect');
  });
});
