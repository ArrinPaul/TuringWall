import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { Item } from '../data/types';
import type { Stats } from '../game/scoring';
import { SignalAvatar } from './SignalAvatar';
import { pickLine, moodForGuess } from '../character/signal';
import { getConceptDetail, EDUCATIONAL_DISCLAIMER } from '../character/fieldGuide';
import type { RoundResult } from '../learning/types';
import { loadMissedQuestionIds, saveMissedQuestionIds } from '../learning/mastery';

interface RevealedPanelProps {
  correct: boolean;
  item: Item;
  explanation: string;
  onNext: () => void;
  onShowStats: () => void;
  stats: Stats;
  lastRoundResult?: RoundResult | null;
  onPracticeTell?: (concept: string) => void;
}

function renderHighlightedText(text: string, highlights?: string[]) {
  if (!highlights || highlights.length === 0) {
    return text;
  }
  const escaped = highlights
    .filter((h) => h.trim().length > 0)
    .map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (escaped.length === 0) return text;

  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, i) => {
    const isHighlight = highlights.some((h) => h.toLowerCase() === part.toLowerCase());
    return isHighlight ? (
      <mark
        key={i}
        className="bg-signal/30 text-signal-bright border-b border-signal px-1 py-0.5 rounded font-600 not-italic shadow-sm"
      >
        {part}
      </mark>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    );
  });
}

export const RevealedPanel: React.FC<RevealedPanelProps> = ({
  correct,
  item,
  explanation,
  onNext,
  onShowStats,
  stats,
  lastRoundResult,
  onPracticeTell,
}) => {
  const [thumbError, setThumbError] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [bookmarked, setBookmarked] = useState(() => loadMissedQuestionIds().includes(item.id));
  const mood = moodForGuess(correct, stats.streak);
  const [line] = useState(() => pickLine(mood));

  const conceptDetail = getConceptDetail(item.concept);

  const handleToggleBookmark = useCallback(() => {
    const currentMissed = loadMissedQuestionIds();
    if (currentMissed.includes(item.id)) {
      saveMissedQuestionIds(currentMissed.filter((id) => id !== item.id));
      setBookmarked(false);
    } else {
      saveMissedQuestionIds([...currentMissed, item.id]);
      setBookmarked(true);
    }
  }, [item.id]);

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
      if (e.ctrlKey || e.metaKey || e.altKey) return; // leave browser shortcuts (Ctrl+P, Ctrl+S ...) alone
      if (e.code === 'Space' || e.code === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleShowStats();
      } else if ((e.key === 'p' || e.key === 'P') && onPracticeTell) {
        e.preventDefault();
        onPracticeTell(item.concept);
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        handleToggleBookmark();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigating, handleNext, handleShowStats, onPracticeTell, handleToggleBookmark, item.concept]);

  const isUnsure = lastRoundResult?.isUnsure ?? false;
  const tellIdentified = lastRoundResult?.tellCorrect ?? false;
  const isHighConfMiss =
    !correct && !isUnsure && lastRoundResult?.confidence === 'high';

  return (
    <motion.div
      data-testid="revealed-root"
      className="flex flex-col min-h-screen w-full bg-ink text-paper font-body p-4 pt-16 sm:pt-20 md:py-6 md:px-8 md:pt-20 justify-between select-none overflow-y-auto"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      {/* Top status bar */}
      <div className="flex flex-wrap items-center justify-between gap-y-1.5 w-full max-w-4xl mx-auto py-2 border-b border-panel-line text-muted text-xs sm:text-sm md:text-base font-mono">
        <div className="flex items-center gap-2 sm:gap-3">
          <span>
            Round <span className="text-paper font-500">{stats.roundsPlayed}</span>
          </span>
          {item.category && (
            <span className="hidden sm:inline-block px-2 py-0.5 bg-panel border border-panel-line text-muted text-xs uppercase tracking-wider font-mono">
              {item.category}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 sm:gap-6 font-mono">
          <div>
            Score <span className="text-good font-500">{stats.score}</span>
          </div>
          <div>
            Streak <span className="text-signal font-500">{stats.streak}</span>
          </div>
        </div>
      </div>

      {/* Staged Verdict & Reveal Card */}
      <div className="flex-1 flex flex-col items-center justify-start max-w-2xl w-full mx-auto mt-4 mb-4">
        <div
          className={`w-full border border-l-4 p-4 sm:p-6 md:p-8 flex flex-col items-center text-center shadow-xl ${
            correct
              ? 'bg-good-dim border-panel-line border-l-good'
              : isUnsure
              ? 'bg-panel border-panel-line border-l-signal'
              : 'bg-bad-dim border-panel-line border-l-bad'
          }`}
        >
          {/* Signal reaction quote */}
          <div className="flex items-center gap-3 mb-4 w-full justify-start">
            <SignalAvatar mood={mood} size={40} />
            <p className="font-display italic text-sm md:text-base text-paper text-left">
              &ldquo;{line}&rdquo;
            </p>
          </div>

          {/* Stage 1: Verdict */}
          <motion.div
            data-testid="verdict"
            initial={{ scale: 0.4, opacity: 0, rotate: correct ? -6 : 6 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 14, delay: 0.1 }}
            className={`px-5 py-1.5 font-mono text-base sm:text-lg md:text-xl uppercase tracking-wide mb-2 border ${
              correct
                ? 'text-good border-good/40 bg-good/10'
                : isUnsure
                ? 'text-signal border-signal/40 bg-signal/10'
                : 'text-bad border-bad/40 bg-bad/10'
            }`}
          >
            {correct ? 'Correct' : isUnsure ? 'Calibrated Caution' : 'Not quite'}
          </motion.div>

          {/* Scoring Feedback Pill */}
          <div className="flex items-center gap-2 mb-4 flex-wrap justify-center font-mono text-xs">
            {lastRoundResult && (
              <span className="text-good bg-ink px-2 py-0.5 border border-panel-line">
                +{lastRoundResult.pointsAwarded} pts awarded
              </span>
            )}
            {tellIdentified && (
              <span className="text-signal bg-ink px-2 py-0.5 border border-signal/40">
                ✓ Identified the tell (+1)
              </span>
            )}
            {isHighConfMiss && (
              <span className="text-bad bg-ink px-2 py-0.5 border border-bad/40">
                ⚠ High-confidence miss (calibrate uncertainty)
              </span>
            )}
          </div>

          {/* Stage 2: Actual Source */}
          <motion.h2
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-display text-lg md:text-2xl text-paper mb-3"
          >
            It was actually{' '}
            <span className={item.isAI ? 'text-signal font-600' : 'text-good font-600'}>
              {item.isAI ? 'AI-generated' : 'human-made'}
            </span>
          </motion.h2>

          {/* Stage 3: Highlighted Evidence Card */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-ink border border-panel-line p-4 mb-4 max-w-lg w-full text-left"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="block text-[11px] uppercase font-mono text-signal tracking-wider">
                The Evidence
              </span>
              {item.evidenceHighlights && item.evidenceHighlights.length > 0 && (
                <span className="text-[10px] font-mono text-signal bg-signal/15 border border-signal/30 px-1.5 py-0.5">
                  Tells Highlighted
                </span>
              )}
            </div>
            {item.kind === 'text' ? (
              <p className="text-paper italic font-display text-base md:text-lg leading-relaxed">
                &ldquo;{renderHighlightedText(item.text, item.evidenceHighlights)}&rdquo;
              </p>
            ) : (
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-3">
                  {thumbError ? (
                    <div className="w-14 h-14 bg-panel flex items-center justify-center text-xs text-bad font-mono border border-panel-line">
                      N/A
                    </div>
                  ) : (
                    <img
                      src={item.src}
                      alt={item.alt || item.caption}
                      onError={() => setThumbError(true)}
                      className="w-14 h-14 object-cover border border-panel-line"
                    />
                  )}
                  <span className="text-muted italic font-mono text-sm">{item.caption}</span>
                </div>
                {item.evidenceHighlights && item.evidenceHighlights.length > 0 && (
                  <p className="text-xs font-mono text-signal bg-signal/10 border border-signal/30 p-2">
                    Key Visual Region / Marker: {item.evidenceHighlights.join(', ')}
                  </p>
                )}
              </div>
            )}
          </motion.div>

          {/* Concept Header */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mb-3"
          >
            <span className="inline-block px-3 py-1 bg-panel border border-panel-line text-signal font-mono text-xs uppercase tracking-wider">
              Concept &middot; {item.concept}
            </span>
          </motion.div>

          {/* Stage 4: Educational Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-left w-full max-w-lg bg-ink/70 p-4 border border-panel-line space-y-3"
          >
            <div>
              <span className="block text-xs uppercase font-mono text-muted tracking-wider mb-1">
                The Tell
              </span>
              <p className="text-paper text-sm md:text-base leading-relaxed font-body">
                {explanation || conceptDetail.definition}
              </p>
            </div>

            {/* Why the opposite answer was tempting */}
            {(item.temptingReason || conceptDetail.whyFooled) && (
              <div className="pt-2 border-t border-panel-line/60">
                <span className="block text-xs uppercase font-mono text-muted tracking-wider mb-1">
                  Why this fooled people
                </span>
                <p className="text-muted text-xs sm:text-sm leading-relaxed">
                  {item.temptingReason || conceptDetail.whyFooled}
                </p>
              </div>
            )}

            {/* Positive Wild Example */}
            {conceptDetail.positiveExample && (
              <div className="pt-2 border-t border-panel-line/60">
                <span className="block text-xs uppercase font-mono text-good tracking-wider mb-1">
                  Example in the wild
                </span>
                <p className="text-paper text-xs sm:text-sm font-mono bg-ink p-2.5 border border-panel-line">
                  {conceptDetail.positiveExample}
                </p>
              </div>
            )}

            {/* Counterexample: Context matters! */}
            {(item.counterexample || conceptDetail.counterexample) && (
              <div className="pt-2 border-t border-panel-line/60">
                <span className="block text-xs uppercase font-mono text-signal tracking-wider mb-1">
                  When this signal fails (Counterexample)
                </span>
                <p className="text-muted text-xs sm:text-sm leading-relaxed">
                  {item.counterexample || conceptDetail.counterexample}
                </p>
              </div>
            )}

            {/* Remember This Summary */}
            {conceptDetail.rememberThis && (
              <div className="pt-2 border-t border-panel-line/60">
                <span className="block text-xs uppercase font-mono text-good tracking-wider mb-1">
                  Remember this
                </span>
                <p className="text-paper text-xs sm:text-sm leading-relaxed font-500">
                  {conceptDetail.rememberThis}
                </p>
              </div>
            )}
          </motion.div>

          {/* Educational Disclaimer Banner */}
          <div className="mt-4 p-3 bg-panel/60 border border-panel-line text-left w-full max-w-lg">
            <span className="block text-[10px] uppercase font-mono text-muted tracking-wider mb-0.5">
              Educational principle
            </span>
            <p className="text-[11px] sm:text-xs text-muted/90 font-mono leading-relaxed italic">
              {EDUCATIONAL_DISCLAIMER}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="w-full max-w-xl mx-auto flex flex-col items-center space-y-2 pb-4 sm:pb-2">
        <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <motion.button
            type="button"
            disabled={navigating}
            onClick={handleShowStats}
            whileTap={{ scale: 0.94 }}
            className="h-13 sm:h-14 bg-panel hover:bg-panel-line transition-colors text-paper font-body font-500 text-xs sm:text-sm border border-panel-line cursor-pointer disabled:opacity-50 flex items-center justify-center"
          >
            Stats [S]
          </motion.button>

          <motion.button
            type="button"
            disabled={navigating}
            onClick={handleToggleBookmark}
            whileTap={{ scale: 0.94 }}
            className={`h-13 sm:h-14 border transition-colors font-body font-500 text-xs sm:text-sm cursor-pointer disabled:opacity-50 flex items-center justify-center ${
              bookmarked
                ? 'bg-signal/20 text-signal border-signal'
                : 'bg-panel hover:bg-panel-line text-muted hover:text-paper border-panel-line'
            }`}
            title="Save this question to your review queue"
          >
            {bookmarked ? '★ Saved [B]' : '☆ Save [B]'}
          </motion.button>

          {onPracticeTell && (
            <motion.button
              type="button"
              disabled={navigating}
              onClick={() => onPracticeTell(item.concept)}
              whileTap={{ scale: 0.94 }}
              className="h-13 sm:h-14 bg-panel hover:bg-panel-line transition-colors text-signal font-body font-500 text-xs sm:text-sm border border-panel-line cursor-pointer disabled:opacity-50 flex items-center justify-center"
              title="Practice more questions tagged with this concept"
            >
              Practice Tell [P]
            </motion.button>
          )}

          <motion.button
            type="button"
            disabled={navigating}
            onClick={handleNext}
            whileTap={{ scale: 0.94 }}
            className="h-13 sm:h-14 bg-signal hover:bg-signal-dim transition-colors text-ink font-body font-600 text-sm sm:text-base cursor-pointer disabled:opacity-50 shadow-md flex items-center justify-center col-span-2 sm:col-span-1"
          >
            Next &rarr;
          </motion.button>
        </div>
        <span className="text-muted text-xs font-mono">[Space] or [Enter] for next</span>
      </div>
    </motion.div>
  );
};
