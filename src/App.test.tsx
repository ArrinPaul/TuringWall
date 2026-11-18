import { MASTERY_STORAGE_KEY } from './learning/mastery';
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
    fireEvent.click(screen.getByText(/Reveal Verdict/i));
    expect(screen.getByTestId('verdict')).toHaveTextContent(/correct/i);
  });

  it('a rapid double-click on a guess button only registers one guess', () => {
    const store = createGameStore(fixtureItems, () => 0);
    render(<App store={store} />);
    startEasyRound();
    fireEvent.click(screen.getByText('Human'));
    const revealBtn = screen.getByText(/Reveal Verdict/i);
    fireEvent.click(revealBtn);
    fireEvent.click(revealBtn);
    expect(store.getState().stats.roundsPlayed).toBe(1);
  });

  it('completes the full inquiry loop with confidence and tell identification', () => {
    const store = createGameStore(fixtureItems, () => 0);
    render(<App store={store} />);
    startEasyRound();
    fireEvent.click(screen.getByText('Human'));
    expect(screen.getByText(/Confidence level:/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/high/i));
    fireEvent.click(screen.getByText(/Reveal Verdict/i));
    expect(screen.getByTestId('verdict')).toHaveTextContent(/correct/i);
    expect(screen.getByText(/The Tell/i)).toBeInTheDocument();
    expect(screen.getByText(/Educational principle/i)).toBeInTheDocument();
  });

  it('toggles investigative clue with C key in playing screen', () => {
    render(<App store={createGameStore(fixtureItems, () => 0)} />);
    startEasyRound();
    expect(screen.queryByText(/Stall Field Clue/i)).not.toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'c' });
    expect(screen.getByText(/Stall Field Clue/i)).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'c' });
    expect(screen.queryByText(/Stall Field Clue/i)).not.toBeInTheDocument();
  });

  it('allows bookmarking / saving question to review with B key on revealed screen', () => {
    render(<App store={createGameStore(fixtureItems, () => 0)} />);
    startEasyRound();
    fireEvent.click(screen.getByText('Human'));
    fireEvent.click(screen.getByText(/Reveal Verdict/i));

    expect(screen.getByText(/Save \[B\]/i)).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'b' });
    expect(screen.getByText(/Saved \[B\]/i)).toBeInTheDocument();
  });

  it('launches practice weak tells mode from attract screen', () => {
    render(<App store={createGameStore(fixtureItems, () => 0)} />);
    const weakTellsBtn = screen.getByText(/Practice weak tells/i);
    fireEvent.click(weakTellsBtn);
    expect(screen.getByTestId('playing-root')).toBeInTheDocument();
  });

  it('launches practice weak tells mode from select screen step 2', () => {
    render(<App store={createGameStore(fixtureItems, () => 0)} />);
    fireEvent.click(screen.getByTestId('attract-root'));
    fireEvent.click(screen.getByText(/Continue/i));
    const weakBtn = screen.getByText(/Practice weak tells/i);
    fireEvent.click(weakBtn);
    expect(screen.getByTestId('playing-root')).toBeInTheDocument();
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

  describe('idle timeout (kiosk mode only)', () => {
    beforeEach(() => {
      sessionStorage.clear();
      window.history.pushState(null, '', '/?kiosk=1');
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
      sessionStorage.clear();
      window.history.pushState(null, '', '/');
    });

    it('does NOT reset a normal (non-kiosk) visitor, however long they read', () => {
      sessionStorage.clear();
      window.history.pushState(null, '', '/');
      render(<App store={createGameStore(fixtureItems, () => 0)} />);
      startEasyRound();
      act(() => {
        vi.advanceTimersByTime(10 * 60 * 1000);
      });
      expect(screen.queryByText(/real or ai/i)).not.toBeInTheDocument();
      expect(screen.getByText('Human')).toBeInTheDocument();
    });

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

  describe('kiosk keyboard shortcuts', () => {
    it('toggles sound mute on M keypress', () => {
      render(<App store={createGameStore(fixtureItems, () => 0)} />);
      expect(screen.getByText(/Sound on/i)).toBeInTheDocument();

      fireEvent.keyDown(window, { key: 'm' });
      expect(screen.getByText(/Sound off/i)).toBeInTheDocument();

      fireEvent.keyDown(window, { key: 'M' });
      expect(screen.getByText(/Sound on/i)).toBeInTheDocument();
    });

    it('toggles fullscreen on F keypress', () => {
      const requestFullscreen = vi.fn(() => Promise.resolve());
      document.documentElement.requestFullscreen = requestFullscreen;

      render(<App store={createGameStore(fixtureItems, () => 0)} />);
      fireEvent.keyDown(window, { key: 'f' });
      expect(requestFullscreen).toHaveBeenCalledTimes(1);

      fireEvent.keyDown(window, { key: 'F' });
      expect(requestFullscreen).toHaveBeenCalledTimes(2);

      delete (document.documentElement as any).requestFullscreen;
    });
  });

  describe('leaderboard route and analysis view', () => {
    it('opens leaderboard directly when window.location.pathname is /leaderboard and toggles analysis view', () => {
      window.history.pushState(null, '', '/leaderboard');
      render(<App store={createGameStore(fixtureItems, () => 0)} />);
      expect(screen.getByText(/Real or AI\? Leaderboard/i)).toBeInTheDocument();

      // Analysis is NOT shown directly on page
      expect(screen.queryByTestId('analysis-modal')).not.toBeInTheDocument();

      // Click "View Analysis" button to open analysis
      fireEvent.click(screen.getByTestId('view-analysis-btn'));
      expect(screen.getByTestId('analysis-modal')).toBeInTheDocument();
      expect(screen.getByText(/AI Detection Analytics/i)).toBeInTheDocument();

      // Click "Back to Leaderboard" button to return
      fireEvent.click(screen.getAllByText(/Back to Leaderboard/i)[0]);
      expect(screen.queryByTestId('analysis-modal')).not.toBeInTheDocument();
      expect(screen.getByText(/Real or AI\? Leaderboard/i)).toBeInTheDocument();

      window.history.pushState(null, '', '/');
    });
  });
});

describe('round keyboard shortcuts (regression)', () => {
  beforeEach(() => {
    window.history.pushState(null, '', '/');
  });

  const setup = () => {
    const store = createGameStore(fixtureItems, () => 0);
    render(<App store={store} />);
    startEasyRound();
    return store;
  };

  it('H selects Human, 3 sets high confidence, Enter reveals, S opens stats', () => {
    const store = setup();
    fireEvent.keyDown(window, { key: 'h' });
    expect(screen.getByText(/Confidence level:/i)).toBeInTheDocument();
    fireEvent.keyDown(window, { key: '3' });
    fireEvent.keyDown(window, { code: 'Enter', key: 'Enter' });
    expect(store.getState().screen).toBe('revealed');
    fireEvent.keyDown(window, { key: 's' });
    expect(store.getState().screen).toBe('stats');
  });

  it('A / ArrowLeft / ArrowRight pick a side; Escape backs out; Space submits', () => {
    const store = setup();
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(screen.getByText(/Confidence level:/i)).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByText(/Confidence level:/i)).not.toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'a' });
    fireEvent.keyDown(window, { code: 'Space', key: ' ' });
    expect(store.getState().screen).toBe('revealed');
    expect(store.getState().lastRoundResult?.prediction).toBe('ai');
  });
});

describe('browser shortcuts are not hijacked', () => {
  beforeEach(() => {
    window.history.pushState(null, '', '/');
  });

  it('Ctrl+M and Ctrl+F are left to the browser', () => {
    render(<App store={createGameStore(fixtureItems, () => 0)} />);
    const m = new KeyboardEvent('keydown', { key: 'm', ctrlKey: true, bubbles: true, cancelable: true });
    window.dispatchEvent(m);
    const f = new KeyboardEvent('keydown', { key: 'f', ctrlKey: true, bubbles: true, cancelable: true });
    window.dispatchEvent(f);
    expect(m.defaultPrevented).toBe(false);
    expect(f.defaultPrevented).toBe(false);
  });

  it('Ctrl+P on the reveal screen is not swallowed', () => {
    render(<App store={createGameStore(fixtureItems, () => 0)} />);
    startEasyRound();
    fireEvent.click(screen.getByText('Human'));
    fireEvent.click(screen.getByText(/Reveal Verdict/i));
    const p = new KeyboardEvent('keydown', { key: 'p', ctrlKey: true, bubbles: true, cancelable: true });
    window.dispatchEvent(p);
    expect(p.defaultPrevented).toBe(false);
  });

  it('announces points and streak after a guess', () => {
    render(<App store={createGameStore(fixtureItems, () => 0)} />);
    startEasyRound();
    fireEvent.click(screen.getByText('Human'));
    fireEvent.click(screen.getByText(/Reveal Verdict/i));
    const live = document.querySelector('[aria-live="polite"]');
    expect(live?.textContent).toMatch(/points\. Score \d+/);
  });
});

describe('due-for-review badge', () => {
  beforeEach(() => {
    window.history.pushState(null, '', '/');
    localStorage.clear();
  });

  it('shows no badge on a fresh profile', () => {
    render(<App store={createGameStore(fixtureItems, () => 0)} />);
    expect(screen.queryByTestId('due-badge')).not.toBeInTheDocument();
  });

  it('shows how many concepts are due once one is overdue', () => {
    localStorage.setItem(
      MASTERY_STORAGE_KEY,
      JSON.stringify({ 'Buzzword padding': { concept: 'Buzzword padding', tier: 'shaky', nextReview: 1 } })
    );
    render(<App store={createGameStore(fixtureItems, () => 0)} />);
    expect(screen.getByTestId('due-badge')).toHaveTextContent('1 due for review');
  });
});

describe('settings dialog and preferences persistence', () => {
  beforeEach(() => {
    window.history.pushState(null, '', '/');
    localStorage.clear();
  });

  it('opens and closes the settings dialog from the top-right button', () => {
    render(<App store={createGameStore(fixtureItems, () => 0)} />);
    expect(screen.queryByTestId('settings-panel')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /open settings/i }));
    expect(screen.getByTestId('settings-panel')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /close settings/i }));
    expect(screen.queryByTestId('settings-panel')).not.toBeInTheDocument();
  });

  it('toggling mute persists sound preference to localStorage', () => {
    render(<App store={createGameStore(fixtureItems, () => 0)} />);
    const soundBtn = screen.getByRole('button', { name: /mute sound/i });
    expect(soundBtn).toHaveTextContent(/sound on/i);

    fireEvent.click(soundBtn);
    expect(soundBtn).toHaveTextContent(/sound off/i);

    const stored = JSON.parse(localStorage.getItem('real-or-ai-wall:prefs:v1') ?? '{}');
    expect(stored.sound).toBe(false);
  });

  it('displays the loading screen when items are still being fetched', async () => {
    let resolveItems!: (items: typeof fixtureItems) => void;
    const asyncProvider = () =>
      new Promise<typeof fixtureItems>((res) => {
        resolveItems = res;
      });

    const store = createGameStore(asyncProvider, () => 0);
    render(<App store={store} />);

    act(() => {
      store.getState().startRound('easy');
    });

    expect(screen.getByTestId('loading-screen')).toBeInTheDocument();
    expect(screen.getByText(/loading question bank/i)).toBeInTheDocument();

    await act(async () => {
      resolveItems(fixtureItems);
    });

    expect(screen.queryByTestId('loading-screen')).not.toBeInTheDocument();
    expect(screen.getByText(/quote a|quote b/i)).toBeInTheDocument();
  });
});

describe('question bank load failure UI', () => {
  beforeEach(() => {
    window.history.pushState(null, '', '/');
    localStorage.clear();
  });

  it('shows a retryable alert instead of an endless spinner, then recovers', async () => {
    let calls = 0;
    const store = createGameStore(() => {
      calls++;
      return calls === 1 ? Promise.reject(new Error('offline')) : Promise.resolve(fixtureItems);
    }, () => 0);
    render(<App store={store} />);
    startEasyRound();
    await act(async () => {
      await new Promise((r) => setTimeout(r, 30));
    });
    expect(screen.queryByTestId('loading-screen')).not.toBeInTheDocument();
    expect(screen.getByTestId('load-error')).toHaveAttribute('role', 'alert');

    // Retry: the wizard restarts at its first step (the name is kept in the store).
    fireEvent.click(screen.getByText(/Continue/i));
    fireEvent.click(screen.getByText('Easy'));
    fireEvent.click(screen.getByText('10'));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 30));
    });
    expect(calls).toBe(2);
    expect(screen.queryByTestId('load-error')).not.toBeInTheDocument();
    expect(store.getState().screen).toBe('playing');
  });
});
