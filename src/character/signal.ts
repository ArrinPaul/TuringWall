export type SignalMood = 'neutral' | 'thinking' | 'correct' | 'incorrect' | 'smug';

const LINES: Record<SignalMood, string[]> = {
  neutral: [
    "I'm Signal. I read patterns for a living.",
    'Every round is a real sample. No tricks.',
    'Ready when you are.',
  ],
  thinking: [
    'Take your time. I already know.',
    'Reading... reading...',
    'Hm. This one is interesting.',
  ],
  correct: [
    'Correct. Predictable, but correct.',
    "You're catching the pattern.",
    'Good eye.',
    'That one had a clean tell.',
  ],
  incorrect: [
    'The pattern fooled you. It happens.',
    'Close. The tell was subtler than usual.',
    'Not quite. Look again next time.',
    'Even I miss the quiet ones.',
  ],
  smug: [
    "I'm barely trying.",
    'A streak like that gets attention.',
    "You're starting to read like I do.",
  ],
};

export function pickLine(mood: SignalMood, rng: () => number = Math.random): string {
  const lines = LINES[mood];
  const index = Math.min(lines.length - 1, Math.floor(rng() * lines.length));
  return lines[index];
}

const RANK_LINES: Record<string, string> = {
  'Model Whisperer': 'Unsettling, honestly. You read it like I do.',
  'Signal Reader': "You're not guessing anymore. You're reading.",
  'Pattern Analyst': 'The tells are starting to show themselves to you.',
  'Feature Spotter': 'Keep going. The eye sharpens with reps.',
};

export function closingLine(rankTitle: string): string {
  return RANK_LINES[rankTitle] ?? 'Good run.';
}

/** The mood a guess outcome should put Signal in, factoring in streak for the smug variant. */
export function moodForGuess(correct: boolean, streak: number): SignalMood {
  if (correct && streak >= 5) return 'smug';
  return correct ? 'correct' : 'incorrect';
}
