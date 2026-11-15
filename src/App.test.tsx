import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { createGameStore } from './store/gameStore';
import App from './App';

const fixtureItems = [
  { id: 'a', kind: 'text' as const, text: 'Quote A', isAI: false, explanation: 'exp A', concept: 'concept A', difficulty: 'easy' as const },
  { id: 'b', kind: 'text' as const, text: 'Quote B', isAI: false, explanation: 'exp B', concept: 'concept B', difficulty: 'easy' as const },
];

/** Helper: from attract, walk the setup wizard (name -> tier -> length) picking Easy / 10 questions. */
function startEasyRound() {
  fireEvent.click(screen.getByTestId('attract-root'));
  fireEvent.click(screen.getByText(/Continue/i));
  fireEvent.click(screen.getByText('Easy'));
  fireEvent.click(screen.getByText('10'));
}

describe('App', () => {
  it('renders the attract screen first', () => {
    render(<App store={createGameStore(fixtureItems)} />);
    expect(screen.getByText(/real or ai/i)).toBeInTheDocument();
  });

  it('tapping attract opens the setup wizard, starting on the name step', () => {
    render(<App store={createGameStore(fixtureItems, () => 0)} />);
    fireEvent.click(screen.getByTestId('attract-root'));
    expect(screen.getByTestId('select-root')).toBeInTheDocument();
    expect(screen.getByText("Who's playing?")).toBeInTheDocument();
  });

  it('continuing from the name step reaches the hardness step with all tiers', () => {
    render(<App store={createGameStore(fixtureItems, () => 0)} />);
    fireEvent.click(screen.getByTestId('attract-root'));
    fireEvent.click(screen.getByText(/Continue/i));
    expect(screen.getByText('Easy')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
  });

  it('choosing a tier starts a round and shows an item from it', () => {
    render(<App store={createGameStore(fixtureItems, () => 0)} />);
    startEasyRound();
    expect(screen.getByText(/quote a|quote b/i)).toBeInTheDocument();
  });

  it('guessing shows the reveal panel with the matching verdict', () => {
    render(<App store={createGameStore(fixtureItems, () => 0)} />);
    startEasyRound();
    fireEvent.click(screen.getByText('Human'));
    expect(screen.getByTestId('verdict')).toHaveTextContent(/correct/i);
  });

  it('a rapid double-click on a guess button only registers one guess', () => {
    const store = createGameStore(fixtureItems, () => 0);
    render(<App store={store} />);
    startEasyRound();
    const humanBtn = screen.getByText('Human');
    fireEvent.click(humanBtn);
    fireEvent.click(humanBtn);
    expect(store.getState().stats.roundsPlayed).toBe(1);
  });

  it('a broken image item shows the fallback instead of a broken image', () => {
    const imageItems = [
      {
        id: 'img1',
        kind: 'image' as const,
        src: '/nonexistent.svg',
        caption: 'A placeholder',
        isAI: true,
        explanation: 'x',
        concept: 'test concept',
        difficulty: 'easy' as const,
      },
    ];
    render(<App store={createGameStore(imageItems, () => 0)} />);
    fireEvent.click(screen.getByTestId('attract-root'));
    fireEvent.click(screen.getByText(/Continue/i));
    fireEvent.click(screen.getByText('Easy'));
    fireEvent.click(screen.getByText('10'));
    fireEvent.error(screen.getByRole('img'));
    expect(screen.getByText(/image unavailable/i)).toBeInTheDocument();
  });

  describe('idle timeout', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('returns to attract after 45s of no interaction', () => {
      render(<App store={createGameStore(fixtureItems, () => 0)} />);
      startEasyRound();
      act(() => {
        vi.advanceTimersByTime(46000);
      });
      expect(screen.getByText(/real or ai/i)).toBeInTheDocument();
    });

    it('does not return to attract if an interaction resets the timer first', () => {
      render(<App store={createGameStore(fixtureItems, () => 0)} />);
      startEasyRound();
      act(() => {
        vi.advanceTimersByTime(30000);
      });
      fireEvent.click(screen.getByText('Human'));
      act(() => {
        vi.advanceTimersByTime(30000);
      });
      expect(screen.queryByText(/real or ai/i)).not.toBeInTheDocument();
    });
  });
});
