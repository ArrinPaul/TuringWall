import React from 'react';
import { motion } from 'framer-motion';
import type { SessionMode } from '../data/types';
import { DIFFICULTY_POINTS } from '../game/scoring';
import { ROUNDS_OPTIONS } from '../store/gameStore';
import type { SessionLength } from '../leaderboard/leaderboard';

interface SelectScreenProps {
  name: string;
  onNameChange: (name: string) => void;
  roundsTarget: SessionLength;
  onRoundsChange: (n: SessionLength) => void;
  clearedModes: SessionMode[];
  onSelect: (mode: SessionMode) => void;
}

const TIERS: { id: SessionMode; label: string; blurb: string }[] = [
  { id: 'easy', label: 'Easy', blurb: 'Blatant tells. A good warm-up round.' },
  { id: 'medium', label: 'Medium', blurb: 'You have to actually read closely.' },
  { id: 'hard', label: 'Hard', blurb: 'Needs context, not just vibes.' },
  { id: 'pro', label: 'Pro', blurb: 'Genuinely close calls. Good luck.' },
  { id: 'mixed', label: 'Mixed', blurb: 'All tiers shuffled together.' },
];

export const SelectScreen: React.FC<SelectScreenProps> = ({
  name,
  onNameChange,
  roundsTarget,
  onRoundsChange,
  clearedModes,
  onSelect,
}) => {
  return (
    <motion.div
      data-testid="select-root"
      className="flex flex-col min-h-screen w-full bg-ink text-paper font-body p-6 md:p-10 justify-center items-center select-none text-center"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      <span className="text-signal font-mono uppercase text-xs md:text-sm tracking-[0.2em]">
        Choose a tier
      </span>
      <h1 className="font-display text-3xl md:text-5xl text-paper mt-1 mb-6">
        How hard do you want this?
      </h1>

      <label className="w-full max-w-sm mb-5 text-left">
        <span className="block font-mono text-muted text-xs uppercase tracking-wider mb-1.5">
          Name for the leaderboard (optional)
        </span>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value.slice(0, 24))}
          placeholder="Anonymous"
          maxLength={24}
          className="w-full bg-panel border border-panel-line px-4 py-3 text-paper font-body text-lg placeholder:text-muted focus:outline-none focus:border-signal"
        />
      </label>

      <div className="flex flex-wrap items-center justify-center gap-2 mb-8 font-mono text-xs uppercase tracking-wider max-w-sm sm:max-w-none">
        <span className="text-muted w-full sm:w-auto text-center sm:text-left">Session length</span>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {ROUNDS_OPTIONS.map((n) => (
            <motion.button
              key={n}
              type="button"
              onClick={() => onRoundsChange(n)}
              aria-pressed={roundsTarget === n}
              whileTap={{ scale: 0.92 }}
              className={`min-w-[3.25rem] min-h-11 px-3 py-2 border transition-colors cursor-pointer ${
                roundsTarget === n
                  ? 'bg-signal border-signal text-ink'
                  : 'bg-panel border-panel-line text-muted hover:text-paper'
              }`}
            >
              {n}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full max-w-2xl">
        {TIERS.map((tier) => {
          const cleared = clearedModes.includes(tier.id);
          return (
            <motion.button
              key={tier.id}
              type="button"
              onClick={() => onSelect(tier.id)}
              whileTap={{ scale: 0.96 }}
              className="group relative flex flex-col items-start text-left p-4 sm:p-5 bg-panel border border-panel-line border-l-4 border-l-signal hover:bg-panel-line/60 transition-colors cursor-pointer min-h-[5.5rem]"
            >
              {cleared && (
                <span className="absolute top-2 right-2 text-good font-mono text-[10px] uppercase tracking-wider border border-good/40 px-1.5 py-0.5">
                  Cleared
                </span>
              )}
              <div className="flex items-baseline justify-between w-full">
                <span className="font-display text-xl sm:text-2xl md:text-3xl text-paper">{tier.label}</span>
                {tier.id !== 'mixed' && (
                  <span className="font-mono text-signal text-sm">+{DIFFICULTY_POINTS[tier.id]} pts</span>
                )}
              </div>
              <span className="text-muted text-sm mt-1 font-body">{tier.blurb}</span>
            </motion.button>
          );
        })}
      </div>

      <p className="text-muted text-xs md:text-sm font-mono mt-8">score resets each session</p>
    </motion.div>
  );
};
