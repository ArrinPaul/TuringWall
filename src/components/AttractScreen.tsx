import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { loadAllLeaderboards, todaysEntries, SESSION_LENGTHS } from '../leaderboard/leaderboard';
import { SignalAvatar } from './SignalAvatar';
import { pickLine, pickSpectatorLine } from '../character/signal';
import { FieldGuide } from './FieldGuide';
import { allConcepts } from '../character/fieldGuide';
import { ITEMS } from '../data/items';
import type { TextItem } from '../data/types';

interface AttractScreenProps {
  onStart: () => void;
}

function pickSampleQuote(): string {
  const textItems = ITEMS.filter((i): i is TextItem => i.kind === 'text');
  const pick = textItems[Math.floor(Math.random() * textItems.length)];
  return pick ? pick.text : 'Every round is a real sample. No tricks.';
}

export const AttractScreen: React.FC<AttractScreenProps> = ({ onStart }) => {
  const [introLine] = useState(() => pickLine('neutral'));
  const [spectatorLine] = useState(() => pickSpectatorLine());
  const [sampleQuote] = useState(pickSampleQuote);
  const [showGuide, setShowGuide] = useState(false);
  const conceptCount = allConcepts().length;
  const [ticker] = useState(() => {
    const allBoards = loadAllLeaderboards();
    const todays = SESSION_LENGTHS.flatMap((length) => todaysEntries(allBoards[length]));
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
      className="relative flex flex-col min-h-screen w-full bg-ink text-paper font-body cursor-pointer select-none overflow-hidden"
    >
      <div className="relative z-10 flex-1 flex items-center px-6 py-10 md:px-12 lg:px-20">
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-16 items-center">
          {/* Left: identity, headline, CTA */}
          <motion.div
            className="flex flex-col items-start text-left"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex items-center gap-3 mb-5">
              <SignalAvatar mood="neutral" size={52} />
              <div className="flex flex-col">
                <span className="text-signal font-mono text-xs uppercase tracking-[0.2em]">Signal</span>
                <p className="font-display italic text-sm sm:text-base text-muted">&ldquo;{introLine}&rdquo;</p>
              </div>
            </div>

            <h1 className="font-display font-700 text-5xl sm:text-6xl lg:text-7xl text-paper leading-[0.95]">
              Real or AI?
            </h1>
            <div className="w-16 h-[3px] bg-signal my-5" />

            <p className="text-base sm:text-lg text-muted font-body max-w-md leading-relaxed">
              Every round is a real piece of writing or art. Can you tell which hand made it?
            </p>

            <div className="mt-7">
              <motion.div
                whileTap={{ scale: 0.95 }}
                className="inline-block px-8 sm:px-10 py-4 sm:py-5 bg-signal hover:bg-signal-dim text-ink font-body font-600 text-lg sm:text-xl shadow-lg transition-colors"
              >
                Tap anywhere to play
              </motion.div>
              <div className="text-muted text-xs mt-3 font-mono">
                or press <kbd className="px-2 py-0.5 bg-panel border border-panel-line text-paper">Space</kbd> / <kbd className="px-2 py-0.5 bg-panel border border-panel-line text-paper">Enter</kbd>
              </div>
            </div>

            {/* One consolidated status line instead of several stacked ones */}
            <div className="mt-9 pt-5 border-t border-panel-line w-full max-w-md flex flex-col gap-2">
              {ticker && (
                <span className="text-signal text-xs font-mono uppercase tracking-wider">
                  {ticker.sessions} session{ticker.sessions === 1 ? '' : 's'} played today &middot; {ticker.avgAccuracy}% average accuracy
                </span>
              )}
              <p className="text-muted/80 text-xs sm:text-sm italic font-body">{spectatorLine}</p>
              <div className="flex items-center gap-3 flex-wrap mt-1">
                <span className="text-muted text-xs leading-relaxed">
                  Trains the same close reading used to study how AI systems actually behave.
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowGuide(true);
                  }}
                  className="px-3 py-1.5 min-h-9 bg-panel border border-panel-line text-muted hover:text-paper transition-colors font-mono text-[11px] uppercase tracking-wider cursor-pointer shrink-0"
                >
                  Field guide &middot; {conceptCount}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Right: a small pinned-evidence board — real quotes, tilted and overlapping, not a clean aligned card */}
          <motion.div
            className="relative hidden sm:block h-[22rem] lg:h-[26rem]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="absolute top-2 right-6 lg:right-10 max-w-[13rem] p-4 bg-panel border border-panel-line border-l-4 border-l-signal rotate-[4deg] shadow-lg text-left">
              <span className="font-mono text-[10px] uppercase tracking-widest text-signal block mb-1">AI-made?</span>
              <span className="font-mono text-xs text-muted">&ldquo;Elevate your daily routine with this thoughtfully designed...&rdquo;</span>
            </div>
            <div className="absolute bottom-4 left-0 lg:left-4 max-w-[13rem] p-4 bg-panel border border-panel-line border-l-4 border-l-signal rotate-[-3deg] shadow-lg text-left">
              <span className="font-mono text-[10px] uppercase tracking-widest text-signal block mb-1">Human or model?</span>
              <span className="font-mono text-xs text-muted">&ldquo;git commit -m 'fixed bug on line 42, please do not ask why'...&rdquo;</span>
            </div>

            <div className="absolute top-14 left-6 lg:left-10 right-6 lg:right-14 bg-panel border border-panel-line border-l-4 border-l-signal p-6 lg:p-7 shadow-2xl rotate-[-1.5deg]">
              <span className="font-mono text-muted text-[10px] uppercase tracking-[0.2em] block mb-3">A sample round</span>
              <p className="font-display text-lg lg:text-xl text-paper leading-snug">&ldquo;{sampleQuote}&rdquo;</p>
              <p className="text-muted font-mono text-xs uppercase tracking-wider mt-5 mb-3">Human or AI?</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="h-11 flex items-center justify-center bg-good/15 border border-good/40 text-good font-body text-sm">
                  Human
                </div>
                <div className="h-11 flex items-center justify-center bg-signal/15 border border-signal/40 text-signal font-body text-sm">
                  AI-made
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {showGuide && (
        <div onClick={(e) => e.stopPropagation()}>
          <FieldGuide onClose={() => setShowGuide(false)} />
        </div>
      )}
    </div>
  );
};
