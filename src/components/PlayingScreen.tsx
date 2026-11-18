import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Item, SessionMode } from '../data/types';
import type { Stats } from '../game/scoring';
import { getStreakLabel } from '../game/scoring';
import { SignalAvatar } from './SignalAvatar';
import type { SessionLength } from '../leaderboard/leaderboard';
import type { ConfidenceLevel, PredictionChoice } from '../learning/types';
import { Icon } from './Icon';

interface PlayingScreenProps {
  item: Item;
  onGuess: (g: 'human' | 'ai') => void;
  onDetailedGuess?: (
    prediction: PredictionChoice,
    confidence: ConfidenceLevel,
    selectedTell: string | null
  ) => void;
  candidateTells?: string[];
  stats?: Stats;
  difficulty?: SessionMode | null;
  roundsTarget?: SessionLength;
}

const DOTS_GRID_CLASS: Record<number, string> = {
  3: 'grid-cols-3',
  5: 'grid-cols-5',
  7: 'grid-cols-7',
  10: 'grid-cols-10',
};

export const PlayingScreen: React.FC<PlayingScreenProps> = ({
  item,
  onGuess,
  onDetailedGuess,
  candidateTells = [],
  stats,
  difficulty,
  roundsTarget = 10,
}) => {
  const [imageError, setImageError] = useState(false);
  const [selectedPrediction, setSelectedPrediction] = useState<PredictionChoice | null>(null);
  const [confidence, setConfidence] = useState<ConfidenceLevel>('medium');
  const [selectedTell, setSelectedTell] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showClue, setShowClue] = useState(false);

  // If detailed guess is not provided, fall back to onGuess immediately
  const handleSelectPrediction = useCallback(
    (pred: PredictionChoice) => {
      if (submitted) return;
      setSelectedPrediction(pred);

      // If no onDetailedGuess is provided, dispatch onGuess directly for backward compatibility
      if (!onDetailedGuess && (pred === 'human' || pred === 'ai')) {
        setSubmitted(true);
        onGuess(pred);
      }
    },
    [submitted, onDetailedGuess, onGuess]
  );

  const handleSubmitInquiry = useCallback(() => {
    if (submitted || !selectedPrediction) return;
    setSubmitted(true);

    if (onDetailedGuess) {
      onDetailedGuess(selectedPrediction, confidence, selectedTell);
    } else {
      onGuess(selectedPrediction === 'ai' ? 'ai' : 'human');
    }
  }, [submitted, selectedPrediction, confidence, selectedTell, onDetailedGuess, onGuess]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (submitted) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return; // leave browser shortcuts alone

      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setShowClue((prev) => !prev);
        return;
      }

      if (!selectedPrediction) {
        if (e.key === 'h' || e.key === 'H' || e.key === 'ArrowLeft') {
          e.preventDefault();
          handleSelectPrediction('human');
        } else if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowRight') {
          e.preventDefault();
          handleSelectPrediction('ai');
        } else if (e.key === 'u' || e.key === 'U') {
          e.preventDefault();
          handleSelectPrediction('unsure');
        }
      } else {
        // In inquiry step
        if (e.key === '1') {
          setConfidence('low');
        } else if (e.key === '2') {
          setConfidence('medium');
        } else if (e.key === '3') {
          setConfidence('high');
        } else if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          handleSubmitInquiry();
        } else if (e.key === 'Escape') {
          setSelectedPrediction(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [submitted, selectedPrediction, handleSelectPrediction, handleSubmitInquiry]);

  const currentRoundInBatch = ((stats?.roundsPlayed ?? 0) % roundsTarget) + 1;
  const currentStreak = stats?.streak ?? 0;
  const streakLabel = getStreakLabel(currentStreak);

  // Format content type label
  const contentTypeLabel =
    item.category || (item.kind === 'image' ? 'Image Analysis' : 'Text Sample');

  return (
    <motion.div
      data-testid="playing-root"
      className="flex flex-col min-h-screen w-full bg-ink text-paper font-body p-4 pt-16 sm:pt-20 md:p-8 md:pt-20 justify-between select-none"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header bar: round count, category tag, score, streak */}
      <div className="w-full max-w-4xl mx-auto flex flex-col space-y-2 py-2 border-b border-panel-line font-mono">
        <div className="flex flex-wrap items-center justify-between gap-y-1.5 text-muted text-xs sm:text-sm md:text-base">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="font-mono">
              Round <span className="text-paper font-500">{currentRoundInBatch}</span> / {roundsTarget}
            </span>
            {difficulty && (
              <span className="px-2 sm:px-2.5 py-0.5 bg-panel border border-signal/40 text-signal text-[10px] sm:text-xs uppercase tracking-wider font-mono">
                {difficulty}
              </span>
            )}
            <span className="hidden sm:inline-block px-2.5 py-0.5 bg-panel border border-panel-line text-signal text-xs uppercase tracking-wider font-mono">
              {contentTypeLabel}
            </span>
          </div>
          <div className="flex items-center gap-3 sm:gap-6 font-mono">
            <div>
              Score{' '}
              <motion.span
                key={`score-${stats?.score ?? 0}`}
                initial={{ scale: 1.5, y: -3 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 16 }}
                className="inline-block text-good font-500"
              >
                {stats?.score ?? 0}
              </motion.span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span>Streak</span>
              <motion.span
                key={`streak-${currentStreak}`}
                initial={{ scale: 1.5, y: -3 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 16 }}
                className="inline-block text-signal font-500"
              >
                {currentStreak}
              </motion.span>
              {streakLabel && (
                <span className="hidden sm:inline-block ml-1 text-xs text-signal border border-signal/40 px-2 py-0.5 font-mono">
                  {streakLabel}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div
          className={`grid ${DOTS_GRID_CLASS[roundsTarget] ?? 'grid-cols-10'} gap-1.5 pt-1 w-full`}
          role="progressbar"
          aria-valuenow={currentRoundInBatch}
          aria-valuemin={1}
          aria-valuemax={roundsTarget}
          aria-label={`Question ${currentRoundInBatch} of ${roundsTarget}`}
        >
          {Array.from({ length: roundsTarget }).map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 transition-all duration-300 ${
                idx < currentRoundInBatch ? 'bg-signal shadow-[0_0_8px_rgba(214,147,60,0.5)]' : 'bg-panel-line'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main Investigation Card */}
      <div className="flex-1 flex flex-col items-center justify-start sm:justify-center max-w-3xl w-full mx-auto mt-4 mb-4 sm:my-4">
        <div className="w-full bg-panel border border-panel-line border-l-4 border-l-signal p-4 sm:p-6 md:p-10 min-h-[180px] sm:min-h-[220px] flex flex-col items-center justify-center text-center shadow-lg relative">
          {item.kind === 'text' ? (
            <p className="font-display text-lg sm:text-2xl md:text-3xl leading-relaxed text-paper">
              &ldquo;{item.text}&rdquo;
            </p>
          ) : (
            <div className="w-full flex flex-col items-center">
              {imageError ? (
                <div className="w-full max-w-md h-40 sm:h-48 md:h-56 bg-ink border-2 border-dashed border-panel-line flex flex-col items-center justify-center p-6 text-muted font-mono">
                  <span className="text-lg font-500 text-bad mb-2">Image unavailable</span>
                  <span className="text-sm text-muted font-mono">{item.caption}</span>
                </div>
              ) : (
                <div className="w-full max-w-md h-40 sm:h-48 md:h-56 overflow-hidden border border-panel-line bg-ink flex items-center justify-center shadow-md">
                  <img
                    src={item.src}
                    alt={item.alt || item.caption || 'Investigate this image sample'}
                    onError={() => setImageError(true)}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <p className="mt-3 text-muted text-sm md:text-base font-mono italic">
                {item.caption}
              </p>
              {item.credit && (
                <p className="mt-1 text-muted text-[10px] font-mono opacity-70">{item.credit}</p>
              )}
            </div>
          )}
        </div>

        {/* Detective Investigation Status */}
        <div className="flex items-center gap-2 mt-3 text-muted font-mono text-xs md:text-sm">
          <SignalAvatar mood="thinking" size={28} />
          <span>
            {!selectedPrediction
              ? "Let's narrow it down. Was this created by a human or AI?"
              : `Locked in: ${selectedPrediction.toUpperCase()}. Now examine your conviction.`}
          </span>
        </div>

        {/* Investigative Clue Toggle */}
        <div className="mt-2 flex flex-col items-center">
          <button
            type="button"
            onClick={() => setShowClue((prev) => !prev)}
            className="min-h-10 text-[11px] font-mono text-muted hover:text-signal transition-colors flex items-center gap-1.5 cursor-pointer"
            aria-expanded={showClue}
          >
            <span>{showClue ? 'Hide clue [C]' : 'Need a clue? [C]'}</span>
          </button>
          {showClue && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 p-2.5 bg-panel border border-signal/40 text-xs font-mono text-paper max-w-lg w-full text-center shadow-sm"
            >
              <span className="text-signal font-600 uppercase text-[10px] block mb-0.5 tracking-wider">
                Stall Field Clue ({item.difficulty} tier)
              </span>
              <span>
                Examine clues related to <strong>{contentTypeLabel}</strong>. Look for whether the details and phrasing reflect messy real-world constraints or synthetic balance.
              </span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Inquiry Interaction Area */}
      <div className="w-full max-w-2xl mx-auto pb-4 sm:pb-2">
        <AnimatePresence mode="wait">
          {!selectedPrediction ? (
            /* Step 1: Human / AI / Unsure Choice */
            <motion.div
              key="step-predict"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col space-y-3"
            >
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                <div className="flex flex-col items-center">
                  <motion.button
                    type="button"
                    disabled={submitted}
                    onClick={() => handleSelectPrediction('human')}
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.02 }}
                    className="w-full min-h-16 h-16 sm:h-20 md:h-24 bg-good hover:brightness-110 transition-[filter] text-ink font-body font-600 text-lg sm:text-2xl md:text-3xl flex items-center justify-center cursor-pointer shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-signal"
                    aria-label="Guess Human-made"
                  >
                    Human
                  </motion.button>
                  <span className="text-muted text-xs mt-1.5 font-mono">[&larr;] or [H]</span>
                </div>

                <div className="flex flex-col items-center">
                  <motion.button
                    type="button"
                    disabled={submitted}
                    onClick={() => handleSelectPrediction('ai')}
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.02 }}
                    className="w-full min-h-16 h-16 sm:h-20 md:h-24 bg-signal hover:bg-signal-dim transition-colors text-ink font-body font-600 text-lg sm:text-2xl md:text-3xl flex items-center justify-center cursor-pointer shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-signal"
                    aria-label="Guess AI-made"
                  >
                    AI-made
                  </motion.button>
                  <span className="text-muted text-xs mt-1.5 font-mono">[&rarr;] or [A]</span>
                </div>
              </div>

              {/* Calibrated "Unsure" Option */}
              <div className="flex items-center justify-center pt-1">
                <button
                  type="button"
                  onClick={() => handleSelectPrediction('unsure')}
                  className="px-4 py-2 bg-panel/80 hover:bg-panel border border-control-line text-muted hover:text-paper text-xs sm:text-sm font-mono transition-colors flex items-center gap-2 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-signal"
                  title="Preserves streak and avoids heavy penalties when evidence is ambiguous"
                >
                  <span>Unsure / Low Signal</span>
                  <span className="text-[10px] text-signal/80 bg-ink px-1.5 py-0.5 border border-control-line">[U] Safe play</span>
                </button>
              </div>
            </motion.div>
          ) : (
            /* Step 2: Akinator-style Inquiry: Confidence & Tell Identification */
            <motion.div
              key="step-inquiry"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-panel border border-panel-line border-l-4 border-l-signal p-4 sm:p-5 flex flex-col space-y-4 shadow-xl"
            >
              {/* Prediction Summary Header */}
              <div className="flex items-center justify-between border-b border-panel-line pb-2.5 font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted uppercase">Your call:</span>
                  <span
                    className={`text-xs sm:text-sm uppercase font-600 px-2 py-0.5 ${
                      selectedPrediction === 'human'
                        ? 'bg-good/20 text-good border border-good/40'
                        : selectedPrediction === 'ai'
                        ? 'bg-signal/20 text-signal border border-signal/40'
                        : 'bg-panel text-muted border border-panel-line'
                    }`}
                  >
                    {selectedPrediction === 'human'
                      ? 'Human-made'
                      : selectedPrediction === 'ai'
                      ? 'AI-made'
                      : 'Unsure / Ambiguous'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPrediction(null)}
                  className="min-h-10 px-2 text-[11px] text-muted hover:text-paper font-mono uppercase underline cursor-pointer"
                >
                  Change [Esc]
                </button>
              </div>

              {/* Confidence Selection */}
              <div>
                <span className="block text-xs font-mono text-muted uppercase tracking-wider mb-2">
                  Confidence level:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {(['low', 'medium', 'high'] as const).map((level, idx) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setConfidence(level)}
                      className={`py-2 px-2 text-xs sm:text-sm font-mono uppercase tracking-wider border transition-all cursor-pointer ${
                        confidence === level
                          ? 'bg-signal text-ink border-signal font-600 shadow'
                          : 'bg-ink/60 border-control-line text-muted hover:text-paper hover:border-signal/50'
                      }`}
                    >
                      <span className="block font-500">{level}</span>
                      <span className="text-[10px] opacity-75 font-mono">[{idx + 1}]</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tell Identification (Partial Credit Hook) */}
              <div>
                <div className="flex items-center justify-between mb-2 font-mono">
                  <span className="text-xs text-muted uppercase tracking-wider">
                    Which tell influenced your answer?
                  </span>
                  <span className="text-[10px] text-good font-mono">+1 Partial Credit</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {candidateTells.map((tell) => (
                    <button
                      key={tell}
                      type="button"
                      onClick={() => setSelectedTell(selectedTell === tell ? null : tell)}
                      className={`p-2.5 text-left text-xs font-mono border transition-all cursor-pointer ${
                        selectedTell === tell
                          ? 'bg-signal/20 border-signal text-signal font-500 shadow-sm'
                          : 'bg-ink/50 border-control-line text-paper/85 hover:border-signal/40 hover:bg-ink'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="line-clamp-1">{tell}</span>
                        {selectedTell === tell && <Icon name="check" className="text-signal text-xs" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedTell(null)}
                  className={`min-h-10 px-2 text-xs font-mono text-muted hover:text-paper cursor-pointer ${
                    selectedTell === null ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  Clear tell selection
                </button>

                <motion.button
                  type="button"
                  onClick={handleSubmitInquiry}
                  whileTap={{ scale: 0.96 }}
                  className="px-6 py-3 bg-signal hover:bg-signal-dim text-ink font-body font-600 text-sm sm:text-base cursor-pointer shadow-md flex items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-paper"
                >
                  <span>Reveal Verdict</span>
                  <span className="font-mono text-xs opacity-80">[Enter]</span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
