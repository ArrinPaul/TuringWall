import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SignalAvatar } from './SignalAvatar';
import type { SignalMood } from '../character/signal';

const MOODS: SignalMood[] = ['neutral', 'thinking', 'correct', 'incorrect', 'smug'];

describe('SignalAvatar', () => {
  it.each(MOODS)('renders an SVG without crashing for mood "%s"', (mood) => {
    const { container } = render(<SignalAvatar mood={mood} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
