import React, { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useGameStore } from './store/gameStore';
import { useIdleReturn } from './hooks/idle';
import { useFullscreen } from './hooks/fullscreen';
import { playTone, isSoundMuted, toggleSoundMuted } from './audio/tone';
import { AttractScreen } from './components/AttractScreen';
import { SelectScreen } from './components/SelectScreen';
import { PlayingScreen } from './components/PlayingScreen';
import { RevealedPanel } from './components/RevealedPanel';
import { StatsScreen } from './components/StatsScreen';

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
    stats,
    lastGuessCorrect,
    milestoneHit,
    guessSeq,
    conceptsSeen,
    setPlayerName,
    setRoundsTarget,
    goToSelect,
    startRound,
    guess,
    next,
    showStats,
    returnToAttract,
  } = store();

  const [muted, setMuted] = useState(isSoundMuted());
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  const handleToggleMute = () => {
    const nextVal = toggleSoundMuted();
    setMuted(nextVal);
  };

  // Keyboard shortcuts: Mute [M], Fullscreen [F]
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
    <main className="w-full h-full min-h-screen bg-ink text-paper font-body flex flex-col items-center justify-center relative">
      {/* Floating Sound and Fullscreen Controls */}
      <div className="fixed top-4 right-4 z-50 flex items-center space-x-2">
        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          className="px-3 py-2 bg-panel border border-panel-line text-muted hover:text-paper transition-colors text-xs font-mono uppercase tracking-wider flex items-center space-x-1.5 cursor-pointer"
          title="Toggle fullscreen (F)"
        >
          <span>{isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}</span>
          <span className="hidden sm:inline text-muted">[F]</span>
        </button>
        <button
          type="button"
          onClick={handleToggleMute}
          aria-label={muted ? 'Unmute sound' : 'Mute sound'}
          className="px-3 py-2 bg-panel border border-panel-line text-muted hover:text-paper transition-colors text-xs font-mono uppercase tracking-wider flex items-center space-x-1.5 cursor-pointer"
          title="Toggle sound (M)"
        >
          <span>Sound {muted ? 'off' : 'on'}</span>
          <span className="hidden sm:inline text-muted">[M]</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {screen === 'attract' && (
          <AttractScreen key="attract" onStart={goToSelect} />
        )}

        {screen === 'select' && (
          <SelectScreen
            key="select"
            name={playerName}
            onNameChange={setPlayerName}
            roundsTarget={roundsTarget}
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
          />
        )}

        {screen === 'stats' && (
          <StatsScreen
            key="stats"
            stats={stats}
            difficulty={difficulty}
            conceptsSeen={conceptsSeen}
            onPlayAgain={goToSelect}
            onStartRound={startRound}
          />
        )}
      </AnimatePresence>
    </main>
  );
};

export default App;
