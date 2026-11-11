import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

interface AttractScreenProps {
  onStart: () => void;
}

export const AttractScreen: React.FC<AttractScreenProps> = ({ onStart }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        onStart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStart]);

  return (
    <div
      data-testid="attract-root"
      onClick={onStart}
      className="flex flex-col items-center justify-center min-h-screen w-full bg-slate-950 text-slate-100 p-8 cursor-pointer select-none text-center relative overflow-hidden"
    >
      {/* Ambient background glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Floating teaser cards */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-25">
        <div className="absolute top-12 left-10 max-w-xs p-4 bg-slate-900/80 border border-slate-700/60 rounded-2xl rotate-[-6deg] text-xs text-slate-300 shadow-xl">
          <span className="text-emerald-400 font-bold block mb-1">Human?</span>
          "my cat just stared at a blank wall for 45 mins then sneezed..."
        </div>
        <div className="absolute bottom-16 left-16 max-w-xs p-4 bg-slate-900/80 border border-slate-700/60 rounded-2xl rotate-[5deg] text-xs text-slate-300 shadow-xl">
          <span className="text-indigo-400 font-bold block mb-1">AI-generated?</span>
          "Elevate your daily routine with this thoughtfully designed..."
        </div>
        <div className="absolute top-20 right-12 max-w-xs p-4 bg-slate-900/80 border border-slate-700/60 rounded-2xl rotate-[8deg] text-xs text-slate-300 shadow-xl">
          <span className="text-amber-400 font-bold block mb-1">Can you tell?</span>
          "Raindrops hum a quiet tune, dancing lightly past the moon..."
        </div>
        <div className="absolute bottom-24 right-16 max-w-xs p-4 bg-slate-900/80 border border-slate-700/60 rounded-2xl rotate-[-4deg] text-xs text-slate-300 shadow-xl">
          <span className="text-cyan-400 font-bold block mb-1">Human or Bot?</span>
          "git commit -m 'fixed bug on line 42, please do not ask why'..."
        </div>
      </div>

      <motion.div
        className="max-w-2xl mx-auto flex flex-col items-center space-y-7 z-10"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs md:text-sm font-semibold tracking-wider uppercase">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          <span>Interactive Kiosk Challenge</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent drop-shadow-sm">
          Real or AI?
        </h1>

        <p className="text-lg md:text-2xl text-slate-300 font-normal max-w-lg leading-relaxed">
          Can you spot the difference between genuine human creation and artificial generation?
        </p>

        <div className="pt-2">
          <div className="px-10 py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-2xl shadow-2xl shadow-indigo-600/40 border border-indigo-400/40 transition-transform active:scale-95">
            Tap Anywhere to Play
          </div>
          <div className="text-slate-400 text-xs mt-3 font-mono">
            or press <kbd className="px-2 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300">Space</kbd> / <kbd className="px-2 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300">Enter</kbd>
          </div>
        </div>

        <div className="text-slate-400 text-xs md:text-sm tracking-wide font-medium border-t border-slate-800/80 pt-6 flex items-center space-x-4">
          <span>⚡ 10-Round Session</span>
          <span>•</span>
          <span>🔥 Streak Celebrations</span>
          <span>•</span>
          <span>🎯 Accuracy Score</span>
        </div>
      </motion.div>
    </div>
  );
};
