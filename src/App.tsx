import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useGameStore } from './store/gameStore';
import { useIdleReturn } from './hooks/idle';
import { useFullscreen } from './hooks/fullscreen';
import { playTone, isSoundMuted, toggleSoundMuted, setSoundMuted } from './audio/tone';
import { loadPreferences, updatePreferences, type UserPreferences } from './prefs/prefs';
import { AttractScreen } from './components/AttractScreen';
import { SelectScreen } from './components/SelectScreen';
import { PlayingScreen } from './components/PlayingScreen';
import { RevealedPanel } from './components/RevealedPanel';
import { StatsScreen } from './components/StatsScreen';
import { SettingsPanel } from './components/SettingsPanel';

interface AppProps {
  store?: typeof useGameStore;
}

export const App: React.FC<AppProps> = ({ store = useGameStore }) => {
  const {
    screen,
    playerName,
    difficulty,
    roundsTarget,
    clearedModes,
    current,
    candidateTells,
    stats,
    lastGuessCorrect,
    lastRoundResult,
    milestoneHit,
    newPersonalBest,
    guessSeq,
    conceptsSeen,
    setPlayerName,
    setRoundsTarget,
    goToSelect,
    startRound,
    startTellPractice,
    guess,
    detailedGuess,
    next,
    showStats,
    replayMissedSession,
    returnToAttract,
  } = store();

  const [prefs, setPrefs] = useState<UserPreferences>(() => loadPreferences());
  const [muted, setMuted] = useState(isSoundMuted());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  // Support direct URL routing to /leaderboard
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.pathname === '/leaderboard') {
      showStats();
    }
  }, [showStats]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (screen === 'stats') {
      if (window.location.pathname !== '/leaderboard') {
        window.history.pushState(null, '', '/leaderboard');
      }
    } else if (screen === 'attract') {
      if (window.location.pathname === '/leaderboard') {
        window.history.pushState(null, '', '/');
      }
    }
  }, [screen]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handlePopState = () => {
      if (window.location.pathname === '/leaderboard') {
        showStats();
      } else {
        returnToAttract();
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [showStats, returnToAttract]);

  useEffect(() => {
    if (typeof store.getState().preloadItems === 'function') {
      void store.getState().preloadItems();
    }
  }, [store]);

  const handleToggleMute = () => {
    const nextVal = toggleSoundMuted();
    setMuted(nextVal);
    setPrefs((prev) => ({ ...prev, sound: !nextVal }));
  };

  const handleUpdatePrefs = (partial: Partial<Omit<UserPreferences, 'version'>>) => {
    const updated = updatePreferences(partial);
    setPrefs(updated);
    if (typeof partial.sound === 'boolean') {
      setSoundMuted(!partial.sound);
      setMuted(!partial.sound);
    }
  };

  // Keyboard shortcuts: Mute [M], Fullscreen [F]
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Never hijack browser shortcuts (Ctrl+F find, Ctrl+M, Cmd+F ...).
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      // While the Field Guide (or any modal) is open, keep global shortcuts quiet.
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        handleToggleMute();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleFullscreen]);

  // Kiosk auto-reset: Return to attract screen on 45s of user inactivity
  useIdleReturn(screen !== 'attract', () => {
    returnToAttract();
  });

  // Audio tone and Confetti milestone celebrations on each guess
  useEffect(() => {
    if (guessSeq > 0 && lastGuessCorrect !== null) {
      playTone(lastGuessCorrect ? 'correct' : 'incorrect');

      const shouldReduceMotion =
        prefs.motion === 'reduce'
          ? true
          : prefs.motion === 'full'
          ? false
          : typeof window !== 'undefined' &&
            Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

      if (milestoneHit && !shouldReduceMotion) {
        try {
          // Brass/ink palette, not the library's default rainbow — stays in the
          // project's existing aesthetic rather than competing with Signal.
          void confetti({
            particleCount: 90,
            spread: 65,
            origin: { y: 0.6 },
            colors: ['#d6933c', '#ad7329', '#7f9a5e', '#f4ede1'],
          });
        } catch {
          // Confetti fallback for non-canvas environments
        }
      }
    }
  }, [guessSeq, lastGuessCorrect, milestoneHit, prefs.motion]);

  // Screen reader live updates, derived from state (no effect needed)
  const announcement = useMemo(() => {
    if (screen === 'playing' && current) {
      return `Round ${(stats.roundsPlayed % roundsTarget) + 1} of ${roundsTarget}. New sample to analyze.`;
    }
    if (screen === 'revealed' && current) {
      const points = lastRoundResult ? ` ${lastRoundResult.pointsAwarded >= 0 ? '+' : ''}${lastRoundResult.pointsAwarded} points. Score ${stats.score}.` : '';
      const streak = stats.streak > 1 ? ` Streak: ${stats.streak} in a row.` : stats.streak === 0 && lastGuessCorrect === false ? ' Streak reset.' : '';
      return `Verdict: ${lastGuessCorrect ? 'Correct' : 'Not quite'}. It was ${
        current.isAI ? 'AI-generated' : 'human-made'
      }.${points}${streak} Tell: ${current.concept}.`;
    }
    if (screen === 'stats') {
      return `Session complete. Score: ${stats.score}. Accuracy: ${stats.correctCount} of ${stats.roundsPlayed}.`;
    }
    return '';
  }, [screen, current, lastGuessCorrect, lastRoundResult, stats, roundsTarget]);

  const reducedMotionSetting =
    prefs.motion === 'reduce' ? 'always' : prefs.motion === 'full' ? 'never' : 'user';

  return (
    <MotionConfig reducedMotion={reducedMotionSetting}>
    <main className="w-full h-full min-h-screen bg-ink text-paper font-body flex flex-col items-center justify-center relative">
      {/* Screen reader live updates */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
      {/* Floating Sound, Settings, and Fullscreen Controls */}
      <div className="no-print fixed top-2 sm:top-4 right-2 sm:right-4 z-50 flex items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          className="min-h-9 px-2 sm:px-3 py-1.5 sm:py-2 bg-panel border border-control-line text-muted hover:text-paper transition-colors text-[10px] sm:text-xs font-mono uppercase tracking-wider flex items-center space-x-1.5 cursor-pointer"
          title="Toggle fullscreen (F)"
        >
          <span>{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
          <span className="hidden sm:inline text-muted">[F]</span>
        </button>
        <button
          type="button"
          onClick={handleToggleMute}
          aria-label={muted ? 'Unmute sound' : 'Mute sound'}
          className="min-h-9 px-2 sm:px-3 py-1.5 sm:py-2 bg-panel border border-control-line text-muted hover:text-paper transition-colors text-[10px] sm:text-xs font-mono uppercase tracking-wider flex items-center space-x-1.5 cursor-pointer"
          title="Toggle sound (M)"
        >
          <span>Sound {muted ? 'off' : 'on'}</span>
          <span className="hidden sm:inline text-muted">[M]</span>
        </button>
        <button
          type="button"
          onClick={() => setIsSettingsOpen(true)}
          aria-label="Open settings"
          className="min-h-9 px-2 sm:px-3 py-1.5 sm:py-2 bg-panel border border-control-line text-muted hover:text-paper transition-colors text-[10px] sm:text-xs font-mono uppercase tracking-wider flex items-center space-x-1.5 cursor-pointer"
          title="Settings"
        >
          <span>Settings</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {screen === 'loading' && (
          <div
            key="loading"
            data-testid="loading-screen"
            className="flex flex-col items-center justify-center p-8 font-mono text-center min-h-[50vh]"
          >
            <div className="w-8 h-8 border-2 border-signal border-t-transparent rounded-full animate-spin mb-4" />
            <div className="text-sm uppercase tracking-wider text-muted">Loading question bank...</div>
          </div>
        )}

        {screen === 'attract' && (
          <AttractScreen
            key="attract"
            onStart={goToSelect}
            onStartDailyChallenge={() => startRound('daily-challenge')}
            onPracticeWeakTells={() => startRound('weak-tells')}
            onPracticeTell={startTellPractice}
          />
        )}

        {screen === 'select' && (
          <SelectScreen
            key="select"
            name={playerName}
            onNameChange={setPlayerName}
            onRoundsChange={setRoundsTarget}
            clearedModes={clearedModes}
            onSelect={startRound}
          />
        )}

        {screen === 'playing' && current && (
          <PlayingScreen
            key={`playing-${current.id}`}
            item={current}
            onGuess={guess}
            onDetailedGuess={detailedGuess}
            candidateTells={candidateTells}
            stats={stats}
            difficulty={difficulty}
            roundsTarget={roundsTarget}
          />
        )}

        {screen === 'revealed' && current && (
          <RevealedPanel
            key={`revealed-${current.id}`}
            correct={Boolean(lastGuessCorrect)}
            item={current}
            explanation={current.explanation}
            onNext={next}
            onShowStats={showStats}
            stats={stats}
            lastRoundResult={lastRoundResult}
            onPracticeTell={startTellPractice}
          />
        )}

        {screen === 'stats' && (
          <StatsScreen
            key="stats"
            playerName={playerName}
            stats={stats}
            difficulty={difficulty}
            roundsTarget={roundsTarget}
            newPersonalBest={newPersonalBest}
            conceptsSeen={conceptsSeen}
            onPlayAgain={goToSelect}
            onStartRound={startRound}
            onReplayMissed={replayMissedSession}
            onPracticeTell={startTellPractice}
          />
        )}
      </AnimatePresence>

      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        prefs={prefs}
        onUpdatePrefs={handleUpdatePrefs}
      />
    </main>
    </MotionConfig>
  );
};

export default App;
