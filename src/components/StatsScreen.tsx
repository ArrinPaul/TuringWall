import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { accuracyPercent, type Stats } from '../game/scoring';

interface StatsScreenProps {
  stats: Stats;
  onPlayAgain: () => void;
}

export const StatsScreen: React.FC<StatsScreenProps> = ({ stats, onPlayAgain }) => {
  const accuracy = accuracyPercent(stats);

  const getRank = (acc: number) => {
    if (acc >= 90) return { title: '👑 Cyber Oracle', badgeColor: 'from-amber-400 to-yellow-500', note: 'Mythic perception! Synthetic generation cannot fool you.' };
    if (acc >= 75) return { title: '🧠 Cyber Sleuth', badgeColor: 'from-indigo-400 to-purple-500', note: 'Sharp analytical eye! You caught the subtle tells with ease.' };
    if (acc >= 50) return { title: '⚡ Sharp Scout', badgeColor: 'from-teal-400 to-emerald-500', note: 'Solid instincts! The line is thin, but your radar is strong.' };
    return { title: '🔍 Digital Apprentice', badgeColor: 'from-slate-400 to-slate-500', note: 'The boundary between synthetic and human is blurring fast!' };
  };

  const rank = getRank(accuracy);

  // Keyboard shortcut to Play Again
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        onPlayAgain();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPlayAgain]);

  return (
    <motion.div
      className="flex flex-col min-h-screen w-full bg-slate-950 text-slate-100 p-6 md:p-10 justify-center items-center select-none text-center relative overflow-hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <div className="max-w-xl w-full mx-auto flex flex-col items-center space-y-6 z-10">
        <div>
          <span className="text-indigo-400 font-semibold tracking-wider uppercase text-xs md:text-sm">
            Session Summary
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-white mt-1 tracking-tight">
            Detection Scorecard
          </h1>

          {/* Detective Rank Pill */}
          <div className="mt-3 inline-block">
            <span className={`px-4 py-1.5 rounded-full text-sm md:text-base font-extrabold text-white bg-gradient-to-r ${rank.badgeColor} shadow-lg shadow-indigo-950/50`}>
              {rank.title}
            </span>
          </div>

          <p className="text-slate-300 mt-3 max-w-md mx-auto text-sm md:text-base leading-relaxed">
            {rank.note}
          </p>
        </div>

        {/* 4 Stats Cards Grid */}
        <div className="grid grid-cols-2 gap-3.5 w-full max-w-md">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col items-center shadow-lg">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Score</span>
            <span className="text-4xl md:text-5xl font-black text-emerald-400 mt-1">
              {stats.score}
            </span>
            <span className="text-xs text-slate-400 mt-1">correct answers</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col items-center shadow-lg">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Accuracy</span>
            <span className="text-4xl md:text-5xl font-black text-indigo-400 mt-1">
              {accuracy}%
            </span>
            <span className="text-xs text-slate-400 mt-1">
              {stats.correctCount} / {stats.roundsPlayed} rounds
            </span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col items-center shadow-lg">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Best Streak</span>
            <span className="text-4xl md:text-5xl font-black text-amber-400 mt-1">
              {stats.bestStreak}
            </span>
            <span className="text-xs text-slate-400 mt-1">consecutive correct</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col items-center shadow-lg">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Rounds</span>
            <span className="text-4xl md:text-5xl font-black text-cyan-400 mt-1">
              {stats.roundsPlayed}
            </span>
            <span className="text-xs text-slate-400 mt-1">total played</span>
          </div>
        </div>

        {/* Play Again Button */}
        <div className="pt-2 w-full max-w-md flex flex-col items-center">
          <button
            type="button"
            onClick={onPlayAgain}
            className="w-full h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all text-white font-bold text-2xl shadow-xl shadow-indigo-950/50 border border-indigo-400/30 cursor-pointer"
          >
            Play Again
          </button>
          <span className="text-slate-400 text-xs mt-2 font-mono">Press [Space] or [Enter]</span>
        </div>
      </div>
    </motion.div>
  );
};
