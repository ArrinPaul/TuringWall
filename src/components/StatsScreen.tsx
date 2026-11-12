import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { accuracyPercent, getRank, type Stats } from '../game/scoring';
import { loadLeaderboard, topEntries, todaysEntries, roomStanding, downloadLeaderboardAsText } from '../leaderboard/leaderboard';
import { nextTierUp, type SessionMode } from '../data/types';
import { SignalAvatar } from './SignalAvatar';
import { closingLine, type SignalMood } from '../character/signal';

interface StatsScreenProps {
  stats: Stats;
  difficulty: SessionMode | null;
  conceptsSeen: string[];
  onPlayAgain: () => void;
  onStartRound: (mode: SessionMode) => void;
}

export const StatsScreen: React.FC<StatsScreenProps> = ({ stats, difficulty, conceptsSeen, onPlayAgain, onStartRound }) => {
  const accuracy = accuracyPercent(stats);
  const rank = getRank(accuracy);
  // Snapshot on mount: the store already recorded this session's entry
  // before routing to this screen, so the board below includes it.
  const [board] = useState(() => loadLeaderboard());
  const todays = todaysEntries(board);
  const top = topEntries(todays, 5);
  const standing = difficulty ? roomStanding(todays, difficulty, stats.score) : null;
  const nextTier = difficulty && difficulty !== 'mixed' ? nextTierUp(difficulty) : null;
  const showNudge = nextTier && accuracy >= 85;
  const closingMood: SignalMood = accuracy >= 90 ? 'smug' : accuracy >= 50 ? 'correct' : 'incorrect';

  // Keyboard shortcut to Play Again
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        onPlayAgain();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPlayAgain]);

  return (
    <motion.div
      className="flex flex-col min-h-screen w-full bg-ink text-paper font-body p-6 md:p-10 justify-center items-center select-none text-center"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <div className="max-w-xl w-full mx-auto flex flex-col items-center space-y-6">
        <div>
          <SignalAvatar mood={closingMood} size={56} className="mx-auto mb-3" />

          <span className="text-signal font-mono uppercase text-xs md:text-sm tracking-[0.2em]">
            Session summary
          </span>
          <h1 className="font-display text-3xl md:text-5xl text-paper mt-1">
            Detection scorecard
          </h1>

          <div className="mt-3 inline-block px-4 py-1 border border-signal/40 text-signal font-mono text-sm md:text-base uppercase tracking-wider">
            {rank.title}
          </div>

          <p className="text-muted mt-3 max-w-md mx-auto text-sm md:text-base leading-relaxed font-body">
            {rank.note}
          </p>

          <p className="font-display italic text-paper mt-2 max-w-md mx-auto text-sm md:text-base">
            &ldquo;{closingLine(rank.title)}&rdquo;
          </p>

          {standing && (
            <p className="text-paper mt-2 max-w-md mx-auto text-sm md:text-base font-mono">
              {standing.total <= 1
                ? `You're the first to play ${difficulty} today.`
                : `You scored higher than ${standing.beaten} of ${standing.total} players today on ${difficulty}.`}
            </p>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-md font-mono">
          <div className="bg-panel border border-panel-line p-5 flex flex-col items-center">
            <span className="text-muted text-xs uppercase tracking-wider">Score</span>
            <span className="text-4xl md:text-5xl text-good mt-1">{stats.score}</span>
            <span className="text-xs text-muted mt-1">correct answers</span>
          </div>

          <div className="bg-panel border border-panel-line p-5 flex flex-col items-center">
            <span className="text-muted text-xs uppercase tracking-wider">Accuracy</span>
            <span className="text-4xl md:text-5xl text-signal mt-1">{accuracy}%</span>
            <span className="text-xs text-muted mt-1">
              {stats.correctCount} / {stats.roundsPlayed} rounds
            </span>
          </div>

          <div className="bg-panel border border-panel-line p-5 flex flex-col items-center">
            <span className="text-muted text-xs uppercase tracking-wider">Best streak</span>
            <span className="text-4xl md:text-5xl text-signal mt-1">{stats.bestStreak}</span>
            <span className="text-xs text-muted mt-1">consecutive correct</span>
          </div>

          <div className="bg-panel border border-panel-line p-5 flex flex-col items-center">
            <span className="text-muted text-xs uppercase tracking-wider">Rounds</span>
            <span className="text-4xl md:text-5xl text-paper mt-1">{stats.roundsPlayed}</span>
            <span className="text-xs text-muted mt-1">total played</span>
          </div>
        </div>

        {/* Progression nudge */}
        {showNudge && nextTier && (
          <button
            type="button"
            onClick={() => onStartRound(nextTier)}
            className="w-full max-w-md border border-signal/50 bg-signal/10 hover:bg-signal/20 transition-colors p-4 text-left cursor-pointer"
          >
            <span className="font-mono text-signal text-xs uppercase tracking-wider">Nice accuracy</span>
            <span className="block font-display text-xl text-paper mt-1">Ready for {nextTier}? &rarr;</span>
          </button>
        )}

        {/* Leaderboard */}
        {top.length > 0 && (
          <div className="w-full max-w-md bg-panel border border-panel-line p-5 text-left font-mono">
            <div className="flex items-center justify-between mb-3">
              <span className="text-signal text-xs uppercase tracking-wider">Today&apos;s leaderboard</span>
              <button
                type="button"
                onClick={() => downloadLeaderboardAsText(board)}
                className="text-muted hover:text-paper text-xs uppercase tracking-wider border border-panel-line px-2 py-1 cursor-pointer transition-colors"
              >
                Export .txt
              </button>
            </div>
            <ol className="space-y-1.5 text-sm">
              {top.map((entry, i) => (
                <li key={`${entry.name}-${entry.timestamp}`} className="flex items-center justify-between text-paper">
                  <span className="truncate">
                    <span className="text-muted">{i + 1}.</span> {entry.name}{' '}
                    <span className="text-muted uppercase text-xs">({entry.difficulty})</span>
                  </span>
                  <span className="text-signal shrink-0 ml-3">{entry.score}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Concrete recap — the actual concepts practiced, not a vague claim */}
        {conceptsSeen.length > 0 && (
          <div className="w-full max-w-md bg-panel border border-panel-line p-5 text-left">
            <span className="block font-mono text-signal text-xs uppercase tracking-wider mb-2">
              Today you practiced spotting
            </span>
            <div className="flex flex-wrap gap-1.5">
              {conceptsSeen.map((concept) => (
                <span
                  key={concept}
                  className="px-2.5 py-1 bg-ink border border-panel-line text-paper font-mono text-xs"
                >
                  {concept}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* For parents & counselors — plain educational framing, no branding */}
        <div className="w-full max-w-md bg-panel border border-panel-line border-l-4 border-l-signal p-5 text-left">
          <span className="block font-mono text-signal text-xs uppercase tracking-wider mb-2">
            For parents &amp; counselors
          </span>
          <p className="text-paper text-sm leading-relaxed font-body">
            What your student just practiced is real pattern recognition — noticing repetition,
            tone, and statistical tells in generated text and images. It's the same kind of close
            reading used to audit AI systems and catch misinformation, and it's a core part of how
            AI and machine learning are studied, not just a party trick.
          </p>
        </div>

        {/* Play Again */}
        <div className="pt-2 w-full max-w-md flex flex-col items-center">
          <button
            type="button"
            onClick={onPlayAgain}
            className="w-full h-16 bg-signal hover:bg-signal-dim active:scale-95 transition-all text-ink font-body font-600 text-2xl cursor-pointer"
          >
            Play again
          </button>
          <span className="text-muted text-xs mt-2 font-mono">[Space] or [Enter]</span>
        </div>
      </div>
    </motion.div>
  );
};
