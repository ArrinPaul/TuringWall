import React, { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useGameStore } from './store/gameStore';
import { useIdleReturn } from './hooks/idle';
import { playTone, isSoundMuted, toggleSoundMuted } from './audio/tone';
import { AttractScreen } from './components/AttractScreen';
import { PlayingScreen } from './components/PlayingScreen';
import { RevealedPanel } from './components/RevealedPanel';
import { StatsScreen } from './components/StatsScreen';

interface AppProps {
  store?: typeof useGameStore;
}

export const App: React.FC<AppProps> = ({ store = useGameStore }) => {
  const {
    screen,
    current,
    stats,
    lastGuessCorrect,
    milestoneHit,
    guessSeq,
    startRound,
    guess,
    next,
    showStats,
    returnToAttract,
  } = store();

  const [muted, setMuted] = useState(isSoundMuted());

  const handleToggleMute = () => {
    const nextVal = toggleSoundMuted();
    setMuted(nextVal);
  };

  // Keyboard shortcut for Mute [M]
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        handleToggleMute();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Kiosk auto-reset: Return to attract screen on 45s of user inactivity
  useIdleReturn(screen !== 'attract', () => {
    returnToAttract();
  });

  // Audio tone and Confetti milestone celebrations on each guess
  useEffect(() => {
    if (guessSeq > 0 && lastGuessCorrect !== null) {
      playTone(lastGuessCorrect ? 'correct' : 'incorrect');

      if (milestoneHit) {
        try {
          void confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // Confetti fallback for non-canvas environments
        }
      }
    }
  }, [guessSeq, lastGuessCorrect, milestoneHit]);

  return (
    <main className="w-full h-full min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center relative">
      {/* Floating Sound Control Button */}
      <button
        type="button"
        onClick={handleToggleMute}
        aria-label={muted ? 'Unmute sound' : 'Mute sound'}
        className="fixed top-4 right-4 z-50 p-2.5 rounded-full bg-slate-900/80 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800 backdrop-blur-sm transition-all text-sm flex items-center space-x-1.5 cursor-pointer shadow-lg"
        title="Toggle sound (M)"
      >
        <span>{muted ? '🔇' : '🔊'}</span>
        <span className="hidden sm:inline text-xs font-mono text-slate-400">[M]</span>
      </button>

      <AnimatePresence mode="wait">
        {screen === 'attract' && (
          <AttractScreen key="attract" onStart={startRound} />
        )}

        {screen === 'playing' && current && (
          <PlayingScreen
            key={`playing-${current.id}`}
            item={current}
            onGuess={guess}
            stats={stats}
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
          />
        )}

        {screen === 'stats' && (
          <StatsScreen
            key="stats"
            stats={stats}
            onPlayAgain={startRound}
          />
        )}
      </AnimatePresence>
    </main>
  );
};

export default App;
