import React, { useState } from 'react';
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

  const handleGuess = (guess: 'human' | 'ai') => {
    if (guessed) return;
    setGuessed(true);
    onGuess(guess);
  };

  return (
    <motion.div
      className="flex flex-col min-h-screen w-full bg-slate-950 text-slate-100 p-6 md:p-12 justify-between select-none"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
    >
      {/* Header bar: round count, score, and current streak */}
      <div className="flex items-center justify-between w-full max-w-4xl mx-auto py-2 border-b border-slate-800 text-slate-400 text-sm md:text-base font-semibold">
        <div>
          Round <span className="text-white">{(stats?.roundsPlayed ?? 0) + 1}</span>
        </div>
        <div className="flex items-center space-x-6">
          <div>
            Score: <span className="text-emerald-400 font-bold">{stats?.score ?? 0}</span>
          </div>
          <div>
            Streak: <span className="text-amber-400 font-bold">{stats?.streak ?? 0}</span> 🔥
          </div>
        </div>
      </div>

      {/* Main content display area */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-3xl w-full mx-auto my-8">
        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl backdrop-blur-sm min-h-[260px] flex flex-col items-center justify-center text-center">
          {item.kind === 'text' ? (
            <p className="text-2xl md:text-3xl font-medium leading-relaxed text-slate-100 tracking-wide">
              "{item.text}"
            </p>
          ) : (
            <div className="w-full flex flex-col items-center">
              {imageError ? (
                <div className="w-full max-w-md h-64 bg-slate-800/80 border-2 border-dashed border-slate-700 rounded-2xl flex flex-col items-center justify-center p-6 text-slate-400">
                  <span className="text-lg font-semibold text-rose-400 mb-2">Image unavailable</span>
                  <span className="text-sm text-slate-400">{item.caption}</span>
                </div>
              ) : (
                <div className="w-full max-w-md h-64 rounded-2xl overflow-hidden shadow-lg border border-slate-700 bg-slate-950 flex items-center justify-center">
                  <img
                    src={item.src}
                    alt={item.caption}
                    onError={() => setImageError(true)}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <p className="mt-4 text-slate-400 text-sm md:text-base font-medium italic">
                {item.caption}
              </p>
            </div>
          )}
        </div>
        <p className="text-slate-500 text-sm mt-4 font-medium">Was this created by a human or AI?</p>
      </div>

      {/* Large Touch/Click Guess Buttons */}
      <div className="w-full max-w-2xl mx-auto grid grid-cols-2 gap-4 md:gap-6 pb-4">
        <button
          type="button"
          disabled={guessed}
          onClick={() => handleGuess('human')}
          className="h-20 md:h-24 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 transition-all text-white font-bold text-2xl md:text-3xl shadow-lg shadow-emerald-950/40 border border-emerald-400/30 flex items-center justify-center cursor-pointer disabled:opacity-50"
        >
          Human
        </button>
        <button
          type="button"
          disabled={guessed}
          onClick={() => handleGuess('ai')}
          className="h-20 md:h-24 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-95 transition-all text-white font-bold text-2xl md:text-3xl shadow-lg shadow-indigo-950/40 border border-indigo-400/30 flex items-center justify-center cursor-pointer disabled:opacity-50"
        >
          AI-made
        </button>
      </div>
    </motion.div>
  );
};
