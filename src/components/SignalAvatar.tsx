import React from 'react';
import { motion } from 'framer-motion';
import type { SignalMood } from '../character/signal';

interface SignalAvatarProps {
  mood: SignalMood;
  size?: number;
  className?: string;
}

function eyesFor(mood: SignalMood) {
  switch (mood) {
    case 'correct':
      return (
        <>
          <path d="M18 28 Q24 20 30 28" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M34 28 Q40 20 46 28" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      );
    case 'incorrect':
      return (
        <>
          <path d="M18 24 Q24 32 30 24" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M34 24 Q40 32 46 24" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      );
    case 'smug':
      return (
        <>
          <line x1="18" y1="24" x2="30" y2="28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <line x1="34" y1="30" x2="46" y2="24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </>
      );
    case 'thinking':
      return (
        <>
          <circle cx="24" cy="27" r="2.5" fill="currentColor" />
          <circle cx="40" cy="27" r="2.5" fill="currentColor" />
        </>
      );
    default:
      return (
        <>
          <line x1="18" y1="27" x2="30" y2="27" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <line x1="34" y1="27" x2="46" y2="27" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </>
      );
  }
}

function mouthFor(mood: SignalMood) {
  switch (mood) {
    case 'correct':
      return <path d="M22 42 Q32 50 42 42" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />;
    case 'incorrect':
      return <path d="M22 46 Q32 38 42 46" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />;
    case 'smug':
      return <path d="M22 44 Q32 48 42 40" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />;
    case 'thinking':
      return (
        <path
          d="M24 44 L28 44 L32 46 L36 44 L40 44"
          stroke="currentColor"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="1 4"
        />
      );
    default:
      return <line x1="24" y1="44" x2="40" y2="44" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />;
  }
}

const MOOD_COLOR: Record<SignalMood, string> = {
  neutral: 'text-signal',
  thinking: 'text-signal',
  correct: 'text-good',
  smug: 'text-good',
  incorrect: 'text-bad',
};

export const SignalAvatar: React.FC<SignalAvatarProps> = ({ mood, size = 64, className = '' }) => {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={`${MOOD_COLOR[mood]} ${className}`}
      animate={mood === 'thinking' ? { rotate: [0, 3, -3, 0] } : { scale: [1, 1.04, 1] }}
      transition={{ duration: mood === 'thinking' ? 1.6 : 2.2, repeat: Infinity, ease: 'easeInOut' }}
    >
      <circle cx="32" cy="32" r="30" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.5" />
      <circle cx="32" cy="32" r="24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      {eyesFor(mood)}
      {mouthFor(mood)}
    </motion.svg>
  );
};
