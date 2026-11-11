import React from 'react';
import { motion } from 'framer-motion';
import { accuracyPercent, type Stats } from '../game/scoring';

interface StatsScreenProps {
  stats: Stats;
  onPlayAgain: () => void;
}

export const StatsScreen: React.FC<StatsScreenProps> = ({ stats, onPlayAgain }) => {
  const accuracy = accuracyPercent(stats);

  const getPerformanceMessage = (acc: number) => {
    if (acc >= 80) return 'Incredible radar! You have a sharp eye for authenticity.';
    if (acc >= 50) return 'Solid instincts! AI generation is tricky, but you caught many tells.';
    return 'The boundary between synthetic and human is blurring fast!';
  };

  return (
    <motion.div
      className="flex flex-col min-h-screen w-full bg-slate-950 text-slate-100 p-6 md:p-12 justify-center items-center select-none text-center relative overflow-hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
    >
      <div className="max-w-2xl w-full mx-auto flex flex-col items-center space-y-8 z-10">
        <div>
          <span className="text-indigo-400 font-semibold tracking-wider uppercase text-sm">
            Session Complete
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mt-1">
            Your Detection Stats
          </h1>
          <p className="text-slate-400 mt-2 max-w-md mx-auto text-base">
            {getPerformanceMessage(accuracy)}
          </p>
        </div>

        {/* 4 Stats Cards Grid */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center">
            <span className="text-slate-400 text-sm font-medium">Score</span>
            <span className="text-4xl md:text-5xl font-extrabold text-emerald-400 mt-2">
              {stats.score}
            </span>
            <span className="text-xs text-slate-400 mt-1">correct answers</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center">
            <span className="text-slate-300 text-sm font-medium">Accuracy</span>
            <span className="text-4xl md:text-5xl font-extrabold text-indigo-400 mt-2">
              {accuracy}%
            </span>
            <span className="text-xs text-slate-400 mt-1">
              {stats.correctCount} / {stats.roundsPlayed} rounds
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center">
            <span className="text-slate-300 text-sm font-medium">Best Streak</span>
            <span className="text-4xl md:text-5xl font-extrabold text-amber-400 mt-2">
              {stats.bestStreak}
            </span>
            <span className="text-xs text-slate-400 mt-1">consecutive correct</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center">
            <span className="text-slate-300 text-sm font-medium">Rounds</span>
            <span className="text-4xl md:text-5xl font-extrabold text-cyan-400 mt-2">
              {stats.roundsPlayed}
            </span>
            <span className="text-xs text-slate-400 mt-1">total played</span>
          </div>
        </div>

        {/* Play Again Button */}
        <div className="pt-4 w-full max-w-md">
          <button
            type="button"
            onClick={onPlayAgain}
            className="w-full h-18 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all text-white font-bold text-2xl shadow-xl shadow-indigo-950/50 border border-indigo-400/30 cursor-pointer"
          >
            Play Again
          </button>
        </div>
      </div>
    </motion.div>
  );
};
