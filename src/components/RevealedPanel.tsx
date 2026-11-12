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
      className="flex flex-col min-h-screen w-full bg-ink text-paper font-body p-4 md:py-6 md:px-8 justify-between select-none"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      {/* Top status bar */}
      <div className="flex items-center justify-between w-full max-w-4xl mx-auto py-2 border-b border-panel-line text-muted text-sm md:text-base font-mono">
        <div className="flex items-center space-x-3">
          <span>
            Round <span className="text-paper font-500">{stats.roundsPlayed}</span>
          </span>
          {item.category && (
            <span className="px-2 py-0.5 bg-panel border border-panel-line text-muted text-xs uppercase tracking-wider">
              {item.category}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-6">
          <div>
            Score <span className="text-good font-500">{stats.score}</span>
          </div>
          <div>
            Streak <span className="text-signal font-500">{stats.streak}</span>
          </div>
        </div>
      </div>

      {/* Verdict & explanation card */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-2xl w-full mx-auto my-4">
        <div
          className={`w-full border border-l-4 p-6 md:p-8 flex flex-col items-center text-center ${
            correct
              ? 'bg-good-dim border-panel-line border-l-good'
              : 'bg-bad-dim border-panel-line border-l-bad'
          }`}
        >
          {/* Verdict */}
          <div
            className={`px-5 py-1.5 font-mono text-lg md:text-xl uppercase tracking-wide mb-4 border ${
              correct ? 'text-good border-good/40' : 'text-bad border-bad/40'
            }`}
          >
            {correct ? 'Correct' : 'Not quite'}
          </div>

          {/* Actual source */}
          <h2 className="font-display text-lg md:text-xl text-paper mb-3">
            It was actually{' '}
            <span className={item.isAI ? 'text-signal' : 'text-good'}>
              {item.isAI ? 'AI-generated' : 'human-made'}
            </span>
          </h2>

          {/* Original item snippet */}
          <div className="bg-ink border border-panel-line p-4 mb-4 max-w-lg w-full">
            {item.kind === 'text' ? (
              <p className="text-paper italic font-display text-base md:text-lg">&ldquo;{item.text}&rdquo;</p>
            ) : (
              <div className="flex items-center justify-center space-x-3">
                {thumbError ? (
                  <div className="w-14 h-14 bg-panel flex items-center justify-center text-xs text-bad font-mono border border-panel-line">
                    N/A
                  </div>
                ) : (
                  <img
                    src={item.src}
                    alt={item.caption}
                    onError={() => setThumbError(true)}
                    className="w-14 h-14 object-cover border border-panel-line"
                  />
                )}
                <span className="text-muted italic font-mono text-sm">{item.caption}</span>
              </div>
            )}
          </div>

          {/* Concept tag — the actual AI-literacy lesson for this round */}
          <div className="mb-3">
            <span className="inline-block px-3 py-1 bg-panel border border-panel-line text-signal font-mono text-xs uppercase tracking-wider">
              Concept &middot; {item.concept}
            </span>
          </div>

          {/* Explanation */}
          <div className="text-left w-full max-w-lg bg-ink/60 p-4 border border-panel-line">
            <span className="block text-xs uppercase font-mono text-muted tracking-wider mb-1">
              The tell
            </span>
            <p className="text-paper text-sm md:text-base leading-relaxed font-body">
              {explanation}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="w-full max-w-xl mx-auto flex flex-col items-center space-y-1.5 pb-2">
        <div className="w-full flex items-center space-x-4">
          <button
            type="button"
            disabled={navigating}
            onClick={handleShowStats}
            className="flex-1 h-16 bg-panel hover:bg-panel-line active:scale-95 transition-all text-paper font-body font-500 text-lg border border-panel-line cursor-pointer disabled:opacity-50"
          >
            Stats [S]
          </button>
          <button
            type="button"
            disabled={navigating}
            onClick={handleNext}
            className="flex-2 h-16 bg-signal hover:bg-signal-dim active:scale-95 transition-all text-ink font-body font-600 text-xl cursor-pointer disabled:opacity-50"
          >
            Next round &rarr;
          </button>
        </div>
        <span className="text-muted text-xs font-mono">[Space] or [Enter] for next</span>
      </div>
    </motion.div>
  );
};
