import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SessionMode } from '../data/types';
import type { PracticeMode } from '../learning/types';
import { DIFFICULTY_POINTS } from '../game/scoring';
import { ROUNDS_OPTIONS } from '../store/gameStore';
import type { SessionLength } from '../leaderboard/leaderboard';

interface SelectScreenProps {
  name: string;
  onNameChange: (name: string) => void;
  onRoundsChange: (n: SessionLength) => void;
  clearedModes: SessionMode[];
  onSelect: (mode: PracticeMode) => void;
}

const TIERS: {
  id: SessionMode;
  label: string;
  outcome: string;
  blurb: string;
  recommended?: boolean;
}[] = [
  {
    id: 'easy',
    label: 'Easy',
    outcome: 'Notice obvious signals',
    blurb: 'Blatant surface tells. A good warm-up round.',
  },
  {
    id: 'medium',
    label: 'Medium',
    outcome: 'Compare evidence',
    blurb: 'Close reading required. The balanced benchmark.',
    recommended: true,
  },
  {
    id: 'hard',
    label: 'Hard',
    outcome: 'Weigh conflicting signals',
    blurb: 'Requires deep contextual analysis, not just vibes.',
  },
  {
    id: 'pro',
    label: 'Pro',
    outcome: 'Calibrate uncertainty',
    blurb: 'Genuinely close calls. Good luck.',
  },
  {
    id: 'mixed',
    label: 'Mixed',
    outcome: 'Varied syllabus',
    blurb: 'All tiers shuffled together across all content types.',
  },
];

const ROUNDS_METADATA: Record<number, { duration: string; note: string }> = {
  3: { duration: '~1 min', note: 'About 1 minute' },
  5: { duration: '~2 mins', note: 'Quick practice' },
  7: { duration: '~3 mins', note: 'Deep dive' },
  10: { duration: '~5 mins', note: 'Full calibration' },
};

const STEPS = ['Name', 'Hardness', 'Length'] as const;
type Step = 0 | 1 | 2;

const stepVariants = {
  enter: (dir: 1 | -1) => ({ opacity: 0, x: dir * 24 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: 1 | -1) => ({ opacity: 0, x: dir * -24 }),
};

export const SelectScreen: React.FC<SelectScreenProps> = ({
  name,
  onNameChange,
  onRoundsChange,
  clearedModes,
  onSelect,
}) => {
  const [step, setStep] = useState<Step>(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [pendingTier, setPendingTier] = useState<SessionMode | null>(null);

  const goTo = (next: Step) => {
    setDir(next > step ? 1 : -1);
    setStep(next);
  };

  const handleNameContinue = () => goTo(1);

  const handleTierPick = (tier: SessionMode) => {
    setPendingTier(tier);
    goTo(2);
  };

  const handleLengthPick = (n: SessionLength) => {
    onRoundsChange(n);
    if (pendingTier) onSelect(pendingTier);
  };

  return (
    <motion.div
      data-testid="select-root"
      className="flex flex-col min-h-screen w-full bg-ink text-paper font-body p-6 md:p-10 justify-center items-center select-none text-center overflow-hidden"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      {/* Step progress */}
      <div
        className="flex items-center gap-2 mb-8 font-mono text-xs uppercase tracking-wider"
        role="tablist"
        aria-label="Setup steps"
      >
        {STEPS.map((label, i) => (
          <React.Fragment key={label}>
            {i > 0 && <span className="w-5 h-px bg-panel-line" aria-hidden="true" />}
            <span
              role="tab"
              aria-selected={step === i}
              aria-label={`Step ${i + 1}: ${label}`}
              className={`flex items-center gap-1.5 ${
                step === i ? 'text-signal' : i < step ? 'text-good' : 'text-muted'
              }`}
            >
              <span
                className={`w-5 h-5 flex items-center justify-center border rounded-full text-[10px] ${
                  step === i
                    ? 'border-signal text-signal'
                    : i < step
                    ? 'border-good text-good'
                    : 'border-panel-line text-muted'
                }`}
              >
                {i < step ? '✓' : i + 1}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </span>
          </React.Fragment>
        ))}
      </div>

      <div className="w-full max-w-2xl min-h-[22rem] flex flex-col items-center justify-center relative">
        <AnimatePresence mode="wait" custom={dir}>
          {step === 0 && (
            <motion.div
              key="step-name"
              custom={dir}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.18 }}
              className="w-full flex flex-col items-center"
            >
              <span className="text-signal font-mono uppercase text-xs md:text-sm tracking-[0.2em]">
                Step 1 of 3
              </span>
              <h1 className="font-display text-3xl md:text-5xl text-paper mt-1 mb-6">
                Who's playing?
              </h1>

              <label className="w-full max-w-sm mb-6 text-left block">
                <span className="block font-mono text-muted text-xs uppercase tracking-wider mb-1.5">
                  Name for the leaderboard (optional)
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => onNameChange(e.target.value.slice(0, 24))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleNameContinue();
                  }}
                  placeholder="Anonymous"
                  maxLength={24}
                  autoFocus
                  className="w-full bg-panel border border-panel-line px-4 py-3 text-paper font-body text-lg placeholder:text-muted focus:outline-none focus:border-signal"
                />
              </label>

              <motion.button
                type="button"
                onClick={handleNameContinue}
                whileTap={{ scale: 0.96 }}
                className="w-full max-w-sm h-14 bg-signal hover:bg-signal-dim transition-colors text-ink font-body font-600 text-lg cursor-pointer shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-paper"
              >
                Continue &rarr;
              </motion.button>
              <span className="text-muted text-xs mt-2 font-mono">[Enter]</span>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step-tier"
              custom={dir}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.18 }}
              className="w-full flex flex-col items-center"
            >
              <span className="text-signal font-mono uppercase text-xs md:text-sm tracking-[0.2em]">
                Step 2 of 3
              </span>
              <h1 className="font-display text-3xl md:text-5xl text-paper mt-1 mb-6">
                How hard do you want this?
              </h1>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full">
                {TIERS.map((tier) => {
                  const cleared = clearedModes.includes(tier.id);
                  return (
                    <motion.button
                      key={tier.id}
                      type="button"
                      onClick={() => handleTierPick(tier.id)}
                      whileTap={{ scale: 0.96 }}
                      className={`group relative flex flex-col items-start text-left p-4 sm:p-5 bg-panel border transition-colors cursor-pointer min-h-[5.5rem] focus-visible:outline focus-visible:outline-2 focus-visible:outline-signal ${
                        tier.recommended
                          ? 'border-signal/80 bg-panel/90 border-l-4 border-l-signal shadow-md'
                          : 'border-panel-line border-l-4 border-l-signal hover:bg-panel-line/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 absolute top-2 right-2">
                        {tier.recommended && (
                          <span className="text-signal font-mono text-[9px] uppercase tracking-wider bg-ink border border-signal/40 px-1.5 py-0.5">
                            Recommended
                          </span>
                        )}
                        {cleared && (
                          <span className="text-good font-mono text-[10px] uppercase tracking-wider border border-good/40 px-1.5 py-0.5">
                            Cleared
                          </span>
                        )}
                      </div>

                      <div className="flex items-baseline justify-between w-full">
                        <span className="font-display text-xl sm:text-2xl text-paper">
                          {tier.label}
                        </span>
                        {tier.id !== 'mixed' && (
                          <span className="font-mono text-signal text-sm">
                            +{DIFFICULTY_POINTS[tier.id]} pts
                          </span>
                        )}
                      </div>

                      {/* Learning outcome */}
                      <span className="text-signal/90 text-xs font-mono uppercase tracking-wide mt-1">
                        Outcome: {tier.outcome}
                      </span>
                      <span className="text-muted text-xs sm:text-sm mt-0.5 font-body">
                        {tier.blurb}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Special Practice Mode: Weak Tells */}
              <div className="mt-4 w-full flex justify-center">
                <button
                  type="button"
                  onClick={() => onSelect('weak-tells')}
                  className="px-4 py-2.5 bg-panel border border-panel-line hover:border-signal text-signal hover:text-paper font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-signal"
                >
                  <span>⚡ Practice Weak Tells (Personalized Deck)</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => goTo(0)}
                className="mt-6 text-muted hover:text-paper font-mono text-xs uppercase tracking-wider cursor-pointer"
              >
                &larr; Back
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-length"
              custom={dir}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.18 }}
              className="w-full flex flex-col items-center"
            >
              <span className="text-signal font-mono uppercase text-xs md:text-sm tracking-[0.2em]">
                Step 3 of 3
              </span>
              <h1 className="font-display text-3xl md:text-5xl text-paper mt-1 mb-6">
                How many questions?
              </h1>

              <div
                data-testid="rounds-options"
                className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-lg"
              >
                {ROUNDS_OPTIONS.map((n) => {
                  const meta = ROUNDS_METADATA[n] ?? { duration: '', note: '' };
                  return (
                    <motion.button
                      key={n}
                      type="button"
                      data-testid={`rounds-${n}`}
                      onClick={() => handleLengthPick(n)}
                      whileTap={{ scale: 0.92 }}
                      className="flex flex-col items-center justify-center min-h-24 px-3 py-4 border border-panel-line bg-panel hover:bg-panel-line/60 text-paper transition-colors cursor-pointer group focus-visible:outline focus-visible:outline-2 focus-visible:outline-signal"
                    >
                      <span className="font-display text-3xl sm:text-4xl">{n}</span>
                      <span className="font-mono text-muted text-[10px] uppercase tracking-wider mt-1">
                        questions
                      </span>
                      <span className="font-mono text-signal text-[11px] mt-1 font-500">
                        {meta.duration}
                      </span>
                      <span className="text-muted/80 text-[9px] font-mono mt-0.5">
                        {meta.note}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => goTo(1)}
                className="mt-6 text-muted hover:text-paper font-mono text-xs uppercase tracking-wider cursor-pointer"
              >
                &larr; Back
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="text-muted text-xs md:text-sm font-mono mt-6">score resets each session</p>
    </motion.div>
  );
};
