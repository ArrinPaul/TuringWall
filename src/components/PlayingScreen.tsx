import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { Item } from '../data/types';
import type { Stats } from '../game/scoring';

interface PlayingScreenProps {
  item: Item;
  onGuess: (g: 'human' | 'ai') => void;
  stats?: Stats;
}

export const PlayingScreen: React.FC<PlayingScreenProps> = ({ item, onGuess, stats }) => {
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

  const currentRoundInBatch = ((stats?.roundsPlayed ?? 0) % 10) + 1;
  const currentStreak = stats?.streak ?? 0;

  const getStreakLabel = (streak: number) => {
    if (streak >= 12) return '👑 Reality Master!';
    if (streak >= 8) return '🧠 Cyber Detective!';
    if (streak >= 5) return '⚡ Unstoppable!';
    if (streak >= 3) return '🔥 Heating Up!';
    return null;
  };

  const streakLabel = getStreakLabel(currentStreak);

  return (
    <motion.div
      className="flex flex-col min-h-screen w-full bg-slate-950 text-slate-100 p-4 md:p-8 justify-between select-none"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header bar: round count, progress pills, score, and current streak */}
      <div className="w-full max-w-4xl mx-auto flex flex-col space-y-2 py-2 border-b border-slate-800">
        <div className="flex items-center justify-between text-slate-300 text-sm md:text-base font-semibold">
          <div className="flex items-center space-x-3">
            <span>
              Round <span className="text-white font-bold">{currentRoundInBatch}</span> of 10
            </span>
            {item.category && (
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold uppercase tracking-wider">
                {item.category}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-6">
            <div>
              Score: <span className="text-emerald-400 font-bold">{stats?.score ?? 0}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span>Streak:</span>
              <span className="text-amber-400 font-bold">{currentStreak}</span>
              <span>🔥</span>
              {streakLabel && (
                <span className="hidden sm:inline-block ml-1 text-xs font-extrabold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                  {streakLabel}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 10-step Session Progress Dots */}
        <div className="grid grid-cols-10 gap-1.5 pt-1 w-full">
          {Array.from({ length: 10 }).map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all ${
                idx < currentRoundInBatch
                  ? 'bg-indigo-500 shadow-sm shadow-indigo-500/50'
                  : 'bg-slate-800'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main content display card */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-3xl w-full mx-auto my-4">
        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-10 shadow-2xl backdrop-blur-sm min-h-[220px] flex flex-col items-center justify-center text-center">
          {item.kind === 'text' ? (
            <p className="text-2xl md:text-3xl font-medium leading-relaxed text-slate-100 tracking-wide">
              "{item.text}"
            </p>
          ) : (
            <div className="w-full flex flex-col items-center">
              {imageError ? (
                <div className="w-full max-w-md h-48 md:h-56 bg-slate-800/80 border-2 border-dashed border-slate-700 rounded-2xl flex flex-col items-center justify-center p-6 text-slate-300">
                  <span className="text-lg font-semibold text-rose-400 mb-2">Image unavailable</span>
                  <span className="text-sm text-slate-400">{item.caption}</span>
                </div>
              ) : (
                <div className="w-full max-w-md h-48 md:h-56 rounded-2xl overflow-hidden shadow-lg border border-slate-700 bg-slate-950 flex items-center justify-center">
                  <img
                    src={item.src}
                    alt={item.caption}
                    onError={() => setImageError(true)}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <p className="mt-3 text-slate-300 text-sm md:text-base font-medium italic">
                {item.caption}
              </p>
            </div>
          )}
        </div>
        <p className="text-slate-400 text-xs md:text-sm mt-3 font-medium">Was this created by a human or AI?</p>
      </div>

      {/* Large Touch/Click Guess Buttons */}
      <div className="w-full max-w-2xl mx-auto grid grid-cols-2 gap-4 md:gap-6 pb-2">
        <div className="flex flex-col items-center">
          <button
            type="button"
            disabled={guessed}
            onClick={() => handleGuess('human')}
            className="w-full h-20 md:h-24 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 transition-all text-white font-bold text-2xl md:text-3xl shadow-lg shadow-emerald-950/40 border border-emerald-400/30 flex items-center justify-center cursor-pointer disabled:opacity-50"
          >
            Human
          </button>
          <span className="text-slate-400 text-xs mt-1.5 font-mono">Press [←] or [H]</span>
        </div>

        <div className="flex flex-col items-center">
          <button
            type="button"
            disabled={guessed}
            onClick={() => handleGuess('ai')}
            className="w-full h-20 md:h-24 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-95 transition-all text-white font-bold text-2xl md:text-3xl shadow-lg shadow-indigo-950/40 border border-indigo-400/30 flex items-center justify-center cursor-pointer disabled:opacity-50"
          >
            AI-made
          </button>
          <span className="text-slate-400 text-xs mt-1.5 font-mono">Press [→] or [A]</span>
        </div>
      </div>
    </motion.div>
  );
};
