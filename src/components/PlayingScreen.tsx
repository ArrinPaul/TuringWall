import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { Item, SessionMode } from '../data/types';
import type { Stats } from '../game/scoring';
import { getStreakLabel } from '../game/scoring';
import { SignalAvatar } from './SignalAvatar';
import type { SessionLength } from '../leaderboard/leaderboard';

interface PlayingScreenProps {
  item: Item;
  onGuess: (g: 'human' | 'ai') => void;
  stats?: Stats;
  difficulty?: SessionMode | null;
  roundsTarget?: SessionLength;
}

const DOTS_GRID_CLASS: Record<number, string> = {
  3: 'grid-cols-3',
  5: 'grid-cols-5',
  7: 'grid-cols-7',
  10: 'grid-cols-10',
};

export const PlayingScreen: React.FC<PlayingScreenProps> = ({ item, onGuess, stats, difficulty, roundsTarget = 10 }) => {
  const [imageError, setImageError] = useState(false);
  const [guessed, setGuessed] = useState(false);

  const handleGuess = useCallback((guess: 'human' | 'ai') => {
    if (guessed) return;
    setGuessed(true);
    onGuess(guess);
  }, [guessed, onGuess]);

  // Keyboard navigation for kiosk laptop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (guessed) return;
      if (e.key === 'h' || e.key === 'H' || e.key === 'ArrowLeft') {
        e.preventDefault();
        handleGuess('human');
      } else if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowRight') {
        e.preventDefault();
        handleGuess('ai');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [guessed, handleGuess]);

  const currentRoundInBatch = ((stats?.roundsPlayed ?? 0) % roundsTarget) + 1;
  const currentStreak = stats?.streak ?? 0;
  const streakLabel = getStreakLabel(currentStreak);

  return (
    <motion.div
      className="flex flex-col min-h-screen w-full bg-ink text-paper font-body p-4 pt-16 sm:pt-20 md:p-8 md:pt-20 justify-between select-none"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header bar: round count, category tag, score, and current streak */}
      <div className="w-full max-w-4xl mx-auto flex flex-col space-y-2 py-2 border-b border-panel-line font-mono">
        <div className="flex flex-wrap items-center justify-between gap-y-1.5 text-muted text-xs sm:text-sm md:text-base">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span>
              Round <span className="text-paper font-500">{currentRoundInBatch}</span> / {roundsTarget}
            </span>
            {difficulty && (
              <span className="px-2 sm:px-2.5 py-0.5 bg-panel border border-signal/40 text-signal text-[10px] sm:text-xs uppercase tracking-wider">
                {difficulty}
              </span>
            )}
            {item.category && (
              <span className="hidden sm:inline-block px-2.5 py-0.5 bg-panel border border-panel-line text-signal text-xs uppercase tracking-wider">
                {item.category}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 sm:gap-6">
            <div>
              Score{' '}
              <motion.span
                key={`score-${stats?.score ?? 0}`}
                initial={{ scale: 1.5, y: -3 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 16 }}
                className="inline-block text-good font-500"
              >
                {stats?.score ?? 0}
              </motion.span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span>Streak</span>
              <motion.span
                key={`streak-${currentStreak}`}
                initial={{ scale: 1.5, y: -3 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 16 }}
                className="inline-block text-signal font-500"
              >
                {currentStreak}
              </motion.span>
              {streakLabel && (
                <span className="hidden sm:inline-block ml-1 text-xs text-signal border border-signal/40 px-2 py-0.5">
                  {streakLabel}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Session progress */}
        <div className={`grid ${DOTS_GRID_CLASS[roundsTarget] ?? 'grid-cols-10'} gap-1.5 pt-1 w-full`}>
          {Array.from({ length: roundsTarget }).map((_, idx) => (
            <div
              key={idx}
              className={`h-1 ${idx < currentRoundInBatch ? 'bg-signal' : 'bg-panel-line'}`}
            />
          ))}
        </div>
      </div>

      {/* Main content card — top-aligned on phone (a tall narrow viewport makes a centered
          card float in a large dead gap), centered from sm: up where there's more width
          than height and centering actually reads as intentional. */}
      <div className="flex-1 flex flex-col items-center justify-start sm:justify-center max-w-3xl w-full mx-auto mt-5 mb-4 sm:my-4">
        <div className="w-full bg-panel border border-panel-line border-l-4 border-l-signal p-4 sm:p-6 md:p-10 min-h-[180px] sm:min-h-[220px] flex flex-col items-center justify-center text-center">
          {item.kind === 'text' ? (
            <p className="font-display text-lg sm:text-2xl md:text-3xl leading-relaxed text-paper">
              &ldquo;{item.text}&rdquo;
            </p>
          ) : (
            <div className="w-full flex flex-col items-center">
              {imageError ? (
                <div className="w-full max-w-md h-40 sm:h-48 md:h-56 bg-ink border-2 border-dashed border-panel-line flex flex-col items-center justify-center p-6 text-muted">
                  <span className="text-lg font-500 text-bad mb-2">Image unavailable</span>
                  <span className="text-sm text-muted font-mono">{item.caption}</span>
                </div>
              ) : (
                <div className="w-full max-w-md h-40 sm:h-48 md:h-56 overflow-hidden border border-panel-line bg-ink flex items-center justify-center">
                  <img
                    src={item.src}
                    alt={item.caption}
                    onError={() => setImageError(true)}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <p className="mt-3 text-muted text-sm md:text-base font-mono italic">
                {item.caption}
              </p>
              {item.credit && (
                <p className="mt-1 text-muted text-[10px] font-mono opacity-70">{item.credit}</p>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 mt-3">
          <SignalAvatar mood="thinking" size={28} />
          <p className="text-muted text-xs md:text-sm font-mono">Was this created by a human or AI?</p>
        </div>
      </div>

      {/* Guess buttons */}
      <div className="w-full max-w-2xl mx-auto grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 pb-4 sm:pb-2">
        <div className="flex flex-col items-center">
          <motion.button
            type="button"
            disabled={guessed}
            onClick={() => handleGuess('human')}
            whileTap={{ scale: 0.94 }}
            whileHover={guessed ? undefined : { scale: 1.02 }}
            className="w-full min-h-16 h-16 sm:h-20 md:h-24 bg-good hover:brightness-110 transition-[filter] text-ink font-body font-600 text-lg sm:text-2xl md:text-3xl flex items-center justify-center cursor-pointer disabled:opacity-50"
          >
            Human
          </motion.button>
          <span className="text-muted text-xs mt-1.5 font-mono">[&larr;] or [H]</span>
        </div>

        <div className="flex flex-col items-center">
          <motion.button
            type="button"
            disabled={guessed}
            onClick={() => handleGuess('ai')}
            whileTap={{ scale: 0.94 }}
            whileHover={guessed ? undefined : { scale: 1.02 }}
            className="w-full min-h-16 h-16 sm:h-20 md:h-24 bg-signal hover:bg-signal-dim transition-colors text-ink font-body font-600 text-lg sm:text-2xl md:text-3xl flex items-center justify-center cursor-pointer disabled:opacity-50"
          >
            AI-made
          </motion.button>
          <span className="text-muted text-xs mt-1.5 font-mono">[&rarr;] or [A]</span>
        </div>
      </div>
    </motion.div>
  );
};
