import React from 'react';
import { motion } from 'framer-motion';
import type { Difficulty } from '../data/types';
import { DIFFICULTY_POINTS } from '../game/scoring';

interface SelectScreenProps {
  onSelect: (difficulty: Difficulty) => void;
}

const TIERS: { id: Difficulty; label: string; blurb: string }[] = [
  { id: 'easy', label: 'Easy', blurb: 'Blatant tells. A good warm-up round.' },
  { id: 'medium', label: 'Medium', blurb: 'You have to actually read closely.' },
  { id: 'hard', label: 'Hard', blurb: 'Needs context, not just vibes.' },
  { id: 'pro', label: 'Pro', blurb: 'Genuinely close calls. Good luck.' },
];

export const SelectScreen: React.FC<SelectScreenProps> = ({ onSelect }) => {
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
      <h1 className="font-display text-3xl md:text-5xl text-paper mt-1 mb-8">
        How hard do you want this?
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
        {TIERS.map((tier) => (
          <button
            key={tier.id}
            type="button"
            onClick={() => onSelect(tier.id)}
            className="group flex flex-col items-start text-left p-5 bg-panel border border-panel-line border-l-4 border-l-signal hover:bg-panel-line/60 active:scale-95 transition-all cursor-pointer"
          >
            <div className="flex items-baseline justify-between w-full">
              <span className="font-display text-2xl md:text-3xl text-paper">{tier.label}</span>
              <span className="font-mono text-signal text-sm">+{DIFFICULTY_POINTS[tier.id]} pts</span>
            </div>
            <span className="text-muted text-sm mt-1 font-body">{tier.blurb}</span>
          </button>
        ))}
      </div>

      <p className="text-muted text-xs md:text-sm font-mono mt-8">10 rounds &middot; score resets each round</p>
    </motion.div>
  );
};
