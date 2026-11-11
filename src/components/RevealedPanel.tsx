import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { Item } from '../data/types';
import type { Stats } from '../game/scoring';

interface RevealedPanelProps {
  correct: boolean;
  item: Item;
  explanation: string;
  onNext: () => void;
  onShowStats: () => void;
  stats: Stats;
}

export const RevealedPanel: React.FC<RevealedPanelProps> = ({
  correct,
  item,
  explanation,
  onNext,
  onShowStats,
  stats,
}) => {
  const [thumbError, setThumbError] = useState(false);
  const [navigating, setNavigating] = useState(false);

  const handleNext = useCallback(() => {
    if (navigating) return;
    setNavigating(true);
    onNext();
  }, [navigating, onNext]);

  const handleShowStats = useCallback(() => {
    if (navigating) return;
    setNavigating(true);
    onShowStats();
  }, [navigating, onShowStats]);

  // Keyboard shortcut: Space, Enter, or ArrowRight triggers Next
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (navigating) return;
      if (e.code === 'Space' || e.code === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleShowStats();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigating, handleNext, handleShowStats]);

  return (
    <motion.div
      className="flex flex-col min-h-screen w-full bg-slate-950 text-slate-100 p-4 md:py-6 md:px-8 justify-between select-none"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      {/* Top status bar */}
      <div className="flex items-center justify-between w-full max-w-4xl mx-auto py-2 border-b border-slate-800 text-slate-300 text-sm md:text-base font-semibold">
        <div className="flex items-center space-x-3">
          <span>
            Round <span className="text-white font-bold">{stats.roundsPlayed}</span>
          </span>
          {item.category && (
            <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold uppercase tracking-wider">
              {item.category}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-6">
          <div>
            Score: <span className="text-emerald-400 font-bold">{stats.score}</span>
          </div>
          <div>
            Streak: <span className="text-amber-400 font-bold">{stats.streak}</span> 🔥
          </div>
        </div>
      </div>

      {/* Main verdict & explanation card */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-2xl w-full mx-auto my-4">
        <div
          className={`w-full border rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-sm flex flex-col items-center text-center transition-all ${
            correct
              ? 'bg-emerald-950/40 border-emerald-500/50 shadow-emerald-950/60 ring-1 ring-emerald-500/20'
              : 'bg-rose-950/40 border-rose-500/50 shadow-rose-950/60 ring-1 ring-rose-500/20'
          }`}
        >
          {/* Animated Verdict Pill */}
          <div
            className={`px-6 py-2 rounded-full font-black text-xl md:text-2xl tracking-wide uppercase shadow-md mb-4 ${
              correct
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}
          >
            {correct ? '✓ Correct!' : '✗ Not Quite!'}
          </div>

          {/* Actual Source */}
          <h2 className="text-lg md:text-xl font-bold text-slate-200 mb-3">
            It was actually{' '}
            <span className={item.isAI ? 'text-indigo-400 underline decoration-indigo-400/40 underline-offset-4' : 'text-emerald-400 underline decoration-emerald-400/40 underline-offset-4'}>
              {item.isAI ? 'AI-generated' : 'Human-made'}
            </span>
          </h2>

          {/* Original item snippet */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 mb-4 max-w-lg w-full">
            {item.kind === 'text' ? (
              <p className="text-slate-200 italic text-base md:text-lg">"{item.text}"</p>
            ) : (
              <div className="flex items-center justify-center space-x-3">
                {thumbError ? (
                  <div className="w-14 h-14 rounded-lg bg-slate-800 flex items-center justify-center text-xs text-rose-400 font-semibold border border-slate-700">
                    N/A
                  </div>
                ) : (
                  <img
                    src={item.src}
                    alt={item.caption}
                    onError={() => setThumbError(true)}
                    className="w-14 h-14 rounded-lg object-cover border border-slate-700"
                  />
                )}
                <span className="text-slate-300 italic text-sm">{item.caption}</span>
              </div>
            )}
          </div>

          {/* Explanation */}
          <div className="text-left w-full max-w-lg bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
            <span className="block text-xs uppercase font-bold text-slate-400 tracking-wider mb-1">
              Why / The Tell:
            </span>
            <p className="text-slate-200 text-sm md:text-base leading-relaxed font-normal">
              {explanation}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons: Next & Stats */}
      <div className="w-full max-w-xl mx-auto flex flex-col items-center space-y-1.5 pb-2">
        <div className="w-full flex items-center space-x-4">
          <button
            type="button"
            disabled={navigating}
            onClick={handleShowStats}
            className="flex-1 h-16 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all text-slate-200 font-semibold text-lg border border-slate-700 cursor-pointer disabled:opacity-50"
          >
            Stats [S]
          </button>
          <button
            type="button"
            disabled={navigating}
            onClick={handleNext}
            className="flex-2 h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all text-white font-bold text-xl shadow-lg shadow-indigo-950/40 border border-indigo-400/30 cursor-pointer disabled:opacity-50"
          >
            Next Round →
          </button>
        </div>
        <span className="text-slate-400 text-xs font-mono">Press [Space] or [Enter] for Next</span>
      </div>
    </motion.div>
  );
};
