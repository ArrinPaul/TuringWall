import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { loadLeaderboard, todaysEntries } from '../leaderboard/leaderboard';
import { SignalAvatar } from './SignalAvatar';
import { pickLine } from '../character/signal';

interface AttractScreenProps {
  onStart: () => void;
}

export const AttractScreen: React.FC<AttractScreenProps> = ({ onStart }) => {
  const [introLine] = useState(() => pickLine('neutral'));
  const [ticker] = useState(() => {
    const todays = todaysEntries(loadLeaderboard());
    if (todays.length === 0) return null;
    const avgAccuracy = Math.round(todays.reduce((sum, e) => sum + e.accuracy, 0) / todays.length);
    return { sessions: todays.length, avgAccuracy };
  });

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
      className="flex flex-col items-center justify-center min-h-screen w-full bg-ink text-paper font-body p-8 cursor-pointer select-none text-center relative overflow-hidden"
    >
      {/* Floating teaser snippets — evidence-card motif: flat panel, left accent tab, mono type */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-70">
        <div className="absolute top-14 left-10 max-w-xs p-4 bg-panel border border-panel-line border-l-4 border-l-signal rotate-[-4deg] text-left shadow-lg">
          <span className="font-mono text-[10px] uppercase tracking-widest text-signal block mb-1">Human?</span>
          <span className="font-mono text-xs text-muted">"my cat just stared at a blank wall for 45 mins then sneezed..."</span>
        </div>
        <div className="absolute bottom-20 left-16 max-w-xs p-4 bg-panel border border-panel-line border-l-4 border-l-signal rotate-[3deg] text-left shadow-lg">
          <span className="font-mono text-[10px] uppercase tracking-widest text-signal block mb-1">AI-made?</span>
          <span className="font-mono text-xs text-muted">"Elevate your daily routine with this thoughtfully designed..."</span>
        </div>
        <div className="absolute top-20 right-12 max-w-xs p-4 bg-panel border border-panel-line border-l-4 border-l-signal rotate-[5deg] text-left shadow-lg">
          <span className="font-mono text-[10px] uppercase tracking-widest text-signal block mb-1">Can you tell?</span>
          <span className="font-mono text-xs text-muted">"Raindrops hum a quiet tune, dancing lightly past the moon..."</span>
        </div>
        <div className="absolute bottom-24 right-16 max-w-xs p-4 bg-panel border border-panel-line border-l-4 border-l-signal rotate-[-3deg] text-left shadow-lg">
          <span className="font-mono text-[10px] uppercase tracking-widest text-signal block mb-1">Human or model?</span>
          <span className="font-mono text-xs text-muted">"git commit -m 'fixed bug on line 42, please do not ask why'..."</span>
        </div>
      </div>

      <motion.div
        className="max-w-2xl mx-auto flex flex-col items-center space-y-7 z-10"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
      >
        <SignalAvatar mood="neutral" size={72} />

        <div className="flex flex-col items-center space-y-1.5">
          <span className="text-signal font-mono text-xs uppercase tracking-[0.2em]">Signal</span>
          <p className="font-display italic text-lg md:text-xl text-paper max-w-sm">&ldquo;{introLine}&rdquo;</p>
        </div>

        <h1 className="font-display font-700 text-6xl md:text-8xl text-paper leading-none">
          Real or AI?
        </h1>
        <div className="w-16 h-[3px] bg-signal" />

        <p className="text-lg md:text-2xl text-muted font-body max-w-lg leading-relaxed">
          Every round is a real piece of writing or art. Can you tell which hand made it?
        </p>

        <div className="pt-2">
          <div className="px-10 py-5 bg-signal hover:bg-signal-dim text-ink font-body font-600 text-2xl shadow-lg transition-colors active:scale-95">
            Tap anywhere to play
          </div>
          <div className="text-muted text-xs mt-3 font-mono">
            or press <kbd className="px-2 py-0.5 bg-panel border border-panel-line text-paper">Space</kbd> / <kbd className="px-2 py-0.5 bg-panel border border-panel-line text-paper">Enter</kbd>
          </div>
        </div>

        <div className="text-muted text-xs md:text-sm font-mono border-t border-panel-line pt-6">
          104 pieces &middot; 4 difficulty tiers &middot; streak tracking
        </div>

        {ticker && (
          <div className="text-signal text-xs md:text-sm font-mono uppercase tracking-wider">
            {ticker.sessions} session{ticker.sessions === 1 ? '' : 's'} played today &middot; {ticker.avgAccuracy}% average accuracy
          </div>
        )}
      </motion.div>
    </div>
  );
};
