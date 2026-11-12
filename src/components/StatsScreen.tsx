import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { accuracyPercent, getRank, type Stats } from '../game/scoring';

interface StatsScreenProps {
  stats: Stats;
  onPlayAgain: () => void;
}

export const StatsScreen: React.FC<StatsScreenProps> = ({ stats, onPlayAgain }) => {
  const accuracy = accuracyPercent(stats);
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
      className="flex flex-col min-h-screen w-full bg-ink text-paper font-body p-6 md:p-10 justify-center items-center select-none text-center"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <div className="max-w-xl w-full mx-auto flex flex-col items-center space-y-6">
        <div>
          <span className="text-signal font-mono uppercase text-xs md:text-sm tracking-[0.2em]">
            Session summary
          </span>
          <h1 className="font-display text-3xl md:text-5xl text-paper mt-1">
            Detection scorecard
          </h1>

          <div className="mt-3 inline-block px-4 py-1 border border-signal/40 text-signal font-mono text-sm md:text-base uppercase tracking-wider">
            {rank.title}
          </div>

          <p className="text-muted mt-3 max-w-md mx-auto text-sm md:text-base leading-relaxed font-body">
            {rank.note}
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-md font-mono">
          <div className="bg-panel border border-panel-line p-5 flex flex-col items-center">
            <span className="text-muted text-xs uppercase tracking-wider">Score</span>
            <span className="text-4xl md:text-5xl text-good mt-1">{stats.score}</span>
            <span className="text-xs text-muted mt-1">correct answers</span>
          </div>

          <div className="bg-panel border border-panel-line p-5 flex flex-col items-center">
            <span className="text-muted text-xs uppercase tracking-wider">Accuracy</span>
            <span className="text-4xl md:text-5xl text-signal mt-1">{accuracy}%</span>
            <span className="text-xs text-muted mt-1">
              {stats.correctCount} / {stats.roundsPlayed} rounds
            </span>
          </div>

          <div className="bg-panel border border-panel-line p-5 flex flex-col items-center">
            <span className="text-muted text-xs uppercase tracking-wider">Best streak</span>
            <span className="text-4xl md:text-5xl text-signal mt-1">{stats.bestStreak}</span>
            <span className="text-xs text-muted mt-1">consecutive correct</span>
          </div>

          <div className="bg-panel border border-panel-line p-5 flex flex-col items-center">
            <span className="text-muted text-xs uppercase tracking-wider">Rounds</span>
            <span className="text-4xl md:text-5xl text-paper mt-1">{stats.roundsPlayed}</span>
            <span className="text-xs text-muted mt-1">total played</span>
          </div>
        </div>

        {/* For parents & counselors — plain educational framing, no branding */}
        <div className="w-full max-w-md bg-panel border border-panel-line border-l-4 border-l-signal p-5 text-left">
          <span className="block font-mono text-signal text-xs uppercase tracking-wider mb-2">
            For parents &amp; counselors
          </span>
          <p className="text-paper text-sm leading-relaxed font-body">
            What your student just practiced is real pattern recognition — noticing repetition,
            tone, and statistical tells in generated text and images. It's the same kind of close
            reading used to audit AI systems and catch misinformation, and it's a core part of how
            AI and machine learning are studied, not just a party trick.
          </p>
        </div>

        {/* Play Again */}
        <div className="pt-2 w-full max-w-md flex flex-col items-center">
          <button
            type="button"
            onClick={onPlayAgain}
            className="w-full h-16 bg-signal hover:bg-signal-dim active:scale-95 transition-all text-ink font-body font-600 text-2xl cursor-pointer"
          >
            Play again
          </button>
          <span className="text-muted text-xs mt-2 font-mono">[Space] or [Enter]</span>
        </div>
      </div>
    </motion.div>
  );
};
