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
  onStartDailyChallenge?: () => void;
  onPracticeWeakTells?: () => void;
  onPracticeTell?: (concept: string) => void;
}

function pickSampleQuote(): string {
  const textItems = ITEMS.filter((i): i is TextItem => i.kind === 'text');
  const pick = textItems[Math.floor(Math.random() * textItems.length)];
  return pick ? pick.text : 'Every round is a real sample. No tricks.';
}

export const AttractScreen: React.FC<AttractScreenProps> = ({
  onStart,
  onStartDailyChallenge,
  onPracticeWeakTells,
  onPracticeTell,
}) => {
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
      if (showGuide) return;
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        onStart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStart, showGuide]);

  return (
    <div
      data-testid="attract-root"
      onClick={onStart}
      className="relative flex flex-col min-h-screen w-full bg-ink text-paper font-body cursor-pointer select-none overflow-hidden"
    >
      <div className="relative z-10 flex-1 flex items-center px-6 py-10 md:px-12 lg:px-20">
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-10 lg:gap-16 items-center">
          {/* Left: Identity, Headline, Dominant CTA and Secondary learning actions */}
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
              Every round is a real piece of writing or art. Can you identify the tell that gives it away?
            </p>

            {/* Dominant Primary Action */}
            <div className="mt-7 flex flex-col items-start">
              <motion.button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onStart();
                }}
                whileTap={{ scale: 0.96 }}
                whileHover={{ scale: 1.02 }}
                className="px-8 sm:px-10 py-4 sm:py-5 bg-signal hover:bg-signal-dim text-ink font-body font-700 text-lg sm:text-xl shadow-xl transition-all cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-paper"
              >
                Start a round &rarr;
              </motion.button>
              <div className="text-muted text-xs mt-2.5 font-mono">
                Press <kbd className="px-2 py-0.5 bg-panel border border-panel-line text-paper">Space</kbd> or <kbd className="px-2 py-0.5 bg-panel border border-panel-line text-paper">Enter</kbd> to begin
              </div>
            </div>

            {/* Focused Secondary Learning Actions */}
            <div className="mt-5 flex items-center gap-2.5 sm:gap-3 flex-wrap">
              {onStartDailyChallenge && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartDailyChallenge();
                  }}
                  className="px-3.5 py-2 bg-panel hover:bg-panel-line border border-panel-line hover:border-signal/50 text-paper font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-signal"
                >
                  <span className="text-signal font-600">★</span>
                  <span>Today’s challenge (5 rounds)</span>
                </button>
              )}

              {onPracticeWeakTells && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPracticeWeakTells();
                  }}
                  className="px-3.5 py-2 bg-panel hover:bg-panel-line border border-panel-line hover:border-signal/50 text-paper font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-signal"
                >
                  <span className="text-signal font-600">⚡</span>
                  <span>Practice weak tells</span>
                </button>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowGuide(true);
                }}
                className="px-3.5 py-2 bg-panel hover:bg-panel-line border border-panel-line text-muted hover:text-paper font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-signal"
              >
                Practice a tell &middot; Field guide ({conceptCount})
              </button>
            </div>

            {/* Consolidated Status Line */}
            <div className="mt-8 pt-4 border-t border-panel-line w-full max-w-md flex flex-col gap-1.5 font-mono">
              {ticker && (
                <span className="text-signal text-xs uppercase tracking-wider">
                  {ticker.sessions} session{ticker.sessions === 1 ? '' : 's'} played today &middot; {ticker.avgAccuracy}% average accuracy
                </span>
              )}
              <p className="text-muted/80 text-xs sm:text-sm italic font-body">{spectatorLine}</p>
              <p className="text-muted text-[11px] leading-relaxed mt-0.5">
                Teaches critical analysis and calibration — no single clue guarantees human or AI origin.
              </p>
            </div>
          </motion.div>

          {/* Right: Subdued pinned-evidence board with reduced visual competition */}
          <motion.div
            className="relative hidden sm:block h-[22rem] lg:h-[26rem] opacity-80 hover:opacity-100 transition-opacity"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.85 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="absolute top-2 right-6 lg:right-10 max-w-[13rem] p-3.5 bg-panel/90 border border-panel-line border-l-4 border-l-signal rotate-[4deg] shadow-md text-left">
              <span className="font-mono text-[10px] uppercase tracking-widest text-signal block mb-1">AI tell?</span>
              <span className="font-mono text-xs text-muted">&ldquo;Elevate your daily routine with this thoughtfully designed...&rdquo;</span>
            </div>
            <div className="absolute bottom-4 left-0 lg:left-4 max-w-[13rem] p-3.5 bg-panel/90 border border-panel-line border-l-4 border-l-signal rotate-[-3deg] shadow-md text-left">
              <span className="font-mono text-[10px] uppercase tracking-widest text-signal block mb-1">Human tell?</span>
              <span className="font-mono text-xs text-muted">&ldquo;git commit -m 'fixed bug on line 42, please do not ask why'...&rdquo;</span>
            </div>

            <div className="absolute top-14 left-6 lg:left-10 right-6 lg:right-14 bg-panel border border-panel-line border-l-4 border-l-signal p-5 lg:p-6 shadow-xl rotate-[-1.5deg]">
              <span className="font-mono text-muted text-[10px] uppercase tracking-[0.2em] block mb-2">Sample Evidence</span>
              <p className="font-display text-base lg:text-lg text-paper leading-snug line-clamp-3">&ldquo;{sampleQuote}&rdquo;</p>
              <p className="text-muted font-mono text-xs uppercase tracking-wider mt-4 mb-2">Human or AI?</p>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="h-9 flex items-center justify-center bg-good/15 border border-good/40 text-good font-body text-xs">
                  Human
                </div>
                <div className="h-9 flex items-center justify-center bg-signal/15 border border-signal/40 text-signal font-body text-xs">
                  AI-made
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {showGuide && (
        <div onClick={(e) => e.stopPropagation()}>
          <FieldGuide
            onClose={() => setShowGuide(false)}
            onPracticeTell={(concept) => {
              setShowGuide(false);
              if (onPracticeTell) onPracticeTell(concept);
            }}
          />
        </div>
      )}
    </div>
  );
};
