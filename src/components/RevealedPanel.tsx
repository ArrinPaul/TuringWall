import React from 'react';
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
  return (
    <motion.div
      className="flex flex-col min-h-screen w-full bg-slate-950 text-slate-100 p-6 md:p-12 justify-between select-none"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.25 }}
    >
      {/* Top status bar */}
      <div className="flex items-center justify-between w-full max-w-4xl mx-auto py-2 border-b border-slate-800 text-slate-400 text-sm md:text-base font-semibold">
        <div>
          Round <span className="text-white">{stats.roundsPlayed}</span>
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
      <div className="flex-1 flex flex-col items-center justify-center max-w-3xl w-full mx-auto my-6">
        <div
          className={`w-full border rounded-3xl p-8 md:p-12 shadow-2xl backdrop-blur-sm flex flex-col items-center text-center transition-colors ${
            correct
              ? 'bg-emerald-950/40 border-emerald-500/40 shadow-emerald-950/40'
              : 'bg-rose-950/40 border-rose-500/40 shadow-rose-950/40'
          }`}
        >
          {/* Animated Verdict Pill */}
          <div
            className={`px-6 py-2 rounded-full font-extrabold text-2xl md:text-3xl tracking-wide uppercase shadow-md mb-6 ${
              correct
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}
          >
            {correct ? '✓ Correct!' : '✗ Not Quite!'}
          </div>

          {/* Actual Source */}
          <h2 className="text-xl md:text-2xl font-bold text-slate-200 mb-4">
            It was actually{' '}
            <span className={item.isAI ? 'text-indigo-400' : 'text-emerald-400'}>
              {item.isAI ? 'AI-generated' : 'Human-made'}
            </span>
          </h2>

          {/* Original item snippet */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 mb-6 max-w-xl w-full">
            {item.kind === 'text' ? (
              <p className="text-slate-300 italic text-base md:text-lg">"{item.text}"</p>
            ) : (
              <div className="flex items-center justify-center space-x-4">
                <img
                  src={item.src}
                  alt={item.caption}
                  className="w-16 h-16 rounded-lg object-cover border border-slate-700"
                />
                <span className="text-slate-300 italic text-sm">{item.caption}</span>
              </div>
            )}
          </div>

          {/* Explanation */}
          <div className="text-left w-full max-w-xl bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80">
            <span className="block text-xs uppercase font-bold text-slate-400 tracking-wider mb-1">
              Why / The Tell:
            </span>
            <p className="text-slate-200 text-base md:text-lg leading-relaxed font-normal">
              {explanation}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons: Next & Stats */}
      <div className="w-full max-w-xl mx-auto flex items-center space-x-4 pb-4">
        <button
          type="button"
          onClick={onShowStats}
          className="flex-1 h-16 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all text-slate-300 font-semibold text-lg border border-slate-700 cursor-pointer"
        >
          Stats
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex-2 h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all text-white font-bold text-xl shadow-lg shadow-indigo-950/40 border border-indigo-400/30 cursor-pointer"
        >
          Next Round →
        </button>
      </div>
    </motion.div>
  );
};
