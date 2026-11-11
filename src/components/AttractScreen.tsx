import React from 'react';
import { motion } from 'framer-motion';

interface AttractScreenProps {
  onStart: () => void;
}

export const AttractScreen: React.FC<AttractScreenProps> = ({ onStart }) => {
  return (
    <div
      data-testid="attract-root"
      onClick={onStart}
      className="flex flex-col items-center justify-center min-h-screen w-full bg-slate-950 text-slate-100 p-8 cursor-pointer select-none text-center relative overflow-hidden"
    >
      {/* Decorative ambient background glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        className="max-w-2xl mx-auto flex flex-col items-center space-y-8 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-sm font-semibold tracking-wider uppercase">
          Interactive Kiosk Game
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
          Real or AI?
        </h1>

        <p className="text-xl md:text-2xl text-slate-400 font-medium max-w-lg">
          Can you tell the difference between human authenticity and artificial generation?
        </p>

        <div className="mt-6 px-10 py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-2xl shadow-xl shadow-indigo-600/30 border border-indigo-400/30">
          Tap Anywhere to Play
        </div>

        <div className="text-slate-400 text-sm tracking-wide font-medium">
          10-round challenges • Instant feedback • Streak celebrations
        </div>
      </motion.div>
    </div>
  );
};
