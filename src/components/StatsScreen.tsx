import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { accuracyPercent, getRank, type Stats } from '../game/scoring';
import {
  loadAllLeaderboards,
  topEntries,
  todaysEntries,
  roomStanding,
  downloadLeaderboardAsText,
  SESSION_LENGTHS,
  type SessionLength,
} from '../leaderboard/leaderboard';
import { nextTierUp, type SessionMode } from '../data/types';
import { SignalAvatar } from './SignalAvatar';
import { closingLine, type SignalMood } from '../character/signal';

interface StatsScreenProps {
  stats: Stats;
  difficulty: SessionMode | null;
  roundsTarget: SessionLength;
  newPersonalBest: boolean;
  conceptsSeen: string[];
  onPlayAgain: () => void;
  onStartRound: (mode: SessionMode) => void;
}

/** A brass-toned confetti burst — distinct from the mid-round streak celebration, reserved for a new best. */
function celebratePersonalBest() {
  try {
    const colors = ['#d6933c', '#ad7329', '#f4ede1'];
    void confetti({ particleCount: 70, spread: 55, angle: 60, origin: { x: 0, y: 0.6 }, colors });
    void confetti({ particleCount: 70, spread: 55, angle: 120, origin: { x: 1, y: 0.6 }, colors });
    void confetti({ particleCount: 60, spread: 100, origin: { y: 0.5 }, colors });
  } catch {
    // Confetti fallback for non-canvas environments
  }
}

export const StatsScreen: React.FC<StatsScreenProps> = ({
  stats,
  difficulty,
  roundsTarget,
  newPersonalBest,
  conceptsSeen,
  onPlayAgain,
  onStartRound,
}) => {
  const accuracy = accuracyPercent(stats);
  const rank = getRank(accuracy);
  // Snapshot on mount: the store already recorded this session's entry
  // before routing to this screen, so the boards below include it.
  const [allBoards] = useState(() => loadAllLeaderboards());
  const [activeLength, setActiveLength] = useState<SessionLength>(roundsTarget);

  const board = allBoards[activeLength];
  const todays = todaysEntries(board);
  const top = topEntries(todays, 5);
  const ownLengthTodays = todaysEntries(allBoards[roundsTarget]);
  const standing = difficulty ? roomStanding(ownLengthTodays, difficulty, stats.score) : null;
  const nextTier = difficulty && difficulty !== 'mixed' ? nextTierUp(difficulty) : null;
  const showNudge = nextTier && accuracy >= 85;
  const closingMood: SignalMood = accuracy >= 90 ? 'smug' : accuracy >= 50 ? 'correct' : 'incorrect';

  useEffect(() => {
    if (newPersonalBest) {
      celebratePersonalBest();
    }
    // Fire once on mount for this session's result — not on every tab switch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      className="flex flex-col min-h-screen w-full bg-ink text-paper font-body p-4 sm:p-6 md:p-10 justify-center items-center select-none text-center"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <div className="no-print max-w-xl w-full mx-auto flex flex-col items-center space-y-5 sm:space-y-6">
        <div>
          <SignalAvatar mood={closingMood} size={56} className="mx-auto mb-3" />

          <span className="text-signal font-mono uppercase text-xs md:text-sm tracking-[0.2em]">
            Session summary
          </span>
          <h1 className="font-display text-2xl sm:text-3xl md:text-5xl text-paper mt-1">
            Detection scorecard
          </h1>

          {newPersonalBest && (
            <motion.div
              initial={{ opacity: 0, scale: 0.6, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 16, delay: 0.1 }}
              className="mt-3 inline-block px-4 py-1.5 border border-signal bg-signal/15 text-signal font-mono text-sm md:text-base uppercase tracking-wider"
            >
              New personal best &middot; {roundsTarget}-question board
            </motion.div>
          )}

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
                ? `You're the first to play ${difficulty} today at ${roundsTarget} questions.`
                : `You scored higher than ${standing.beaten} of ${standing.total} players today on ${difficulty} (${roundsTarget}q).`}
            </p>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 w-full max-w-md font-mono">
          <div className="bg-panel border border-panel-line p-3.5 sm:p-5 flex flex-col items-center">
            <span className="text-muted text-xs uppercase tracking-wider">Score</span>
            <motion.span
              initial={{ scale: 1.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl text-good mt-1"
            >
              {stats.score}
            </motion.span>
            <span className="text-xs text-muted mt-1">correct answers</span>
          </div>

          <div className="bg-panel border border-panel-line p-3.5 sm:p-5 flex flex-col items-center">
            <span className="text-muted text-xs uppercase tracking-wider">Accuracy</span>
            <span className="text-3xl sm:text-4xl md:text-5xl text-signal mt-1">{accuracy}%</span>
            <span className="text-xs text-muted mt-1">
              {stats.correctCount} / {stats.roundsPlayed} rounds
            </span>
          </div>

          <div className="bg-panel border border-panel-line p-3.5 sm:p-5 flex flex-col items-center">
            <span className="text-muted text-xs uppercase tracking-wider">Best streak</span>
            <span className="text-3xl sm:text-4xl md:text-5xl text-signal mt-1">{stats.bestStreak}</span>
            <span className="text-xs text-muted mt-1">consecutive correct</span>
          </div>

          <div className="bg-panel border border-panel-line p-3.5 sm:p-5 flex flex-col items-center">
            <span className="text-muted text-xs uppercase tracking-wider">Rounds</span>
            <span className="text-3xl sm:text-4xl md:text-5xl text-paper mt-1">{stats.roundsPlayed}</span>
            <span className="text-xs text-muted mt-1">total played</span>
          </div>
        </div>

        {/* Progression nudge */}
        {showNudge && nextTier && (
          <motion.button
            type="button"
            onClick={() => onStartRound(nextTier)}
            whileTap={{ scale: 0.97 }}
            className="w-full max-w-md border border-signal/50 bg-signal/10 hover:bg-signal/20 transition-colors p-4 text-left cursor-pointer"
          >
            <span className="font-mono text-signal text-xs uppercase tracking-wider">Nice accuracy</span>
            <span className="block font-display text-xl text-paper mt-1">Ready for {nextTier}? &rarr;</span>
          </motion.button>
        )}

        {/* Leaderboard — one board per session length, never mixed */}
        <div className="w-full max-w-md bg-panel border border-panel-line p-4 sm:p-5 text-left font-mono">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <span className="text-signal text-xs uppercase tracking-wider">Leaderboard</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => window.print()}
                className="text-muted hover:text-paper text-xs uppercase tracking-wider border border-panel-line px-2 py-1 cursor-pointer transition-colors min-h-8"
              >
                Print takeaway
              </button>
              <button
                type="button"
                onClick={() => downloadLeaderboardAsText(board, activeLength)}
                className="text-muted hover:text-paper text-xs uppercase tracking-wider border border-panel-line px-2 py-1 cursor-pointer transition-colors min-h-8"
              >
                Export .txt
              </button>
            </div>
          </div>

          <div
            role="tablist"
            aria-label="Leaderboard session length"
            className="flex items-center gap-1.5 mb-3 flex-wrap"
          >
            {SESSION_LENGTHS.map((len) => (
              <button
                key={len}
                type="button"
                role="tab"
                aria-selected={activeLength === len}
                onClick={() => setActiveLength(len)}
                className={`min-w-11 min-h-9 px-3 py-1.5 text-xs uppercase tracking-wider border transition-colors cursor-pointer ${
                  activeLength === len
                    ? 'bg-signal border-signal text-ink'
                    : 'bg-ink border-panel-line text-muted hover:text-paper'
                }`}
              >
                {len}q
              </button>
            ))}
          </div>

          {top.length > 0 ? (
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
          ) : (
            <p className="text-muted text-sm">No {activeLength}-question sessions played today yet.</p>
          )}
        </div>

        {/* Concrete recap — the actual concepts practiced, not a vague claim */}
        {conceptsSeen.length > 0 && (
          <div className="w-full max-w-md bg-panel border border-panel-line p-4 sm:p-5 text-left">
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
        <div className="w-full max-w-md bg-panel border border-panel-line border-l-4 border-l-signal p-4 sm:p-5 text-left">
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
          <motion.button
            type="button"
            onClick={onPlayAgain}
            whileTap={{ scale: 0.96 }}
            className="w-full h-14 sm:h-16 bg-signal hover:bg-signal-dim transition-colors text-ink font-body font-600 text-xl sm:text-2xl cursor-pointer"
          >
            Play again
          </motion.button>
          <span className="text-muted text-xs mt-2 font-mono">[Space] or [Enter]</span>
        </div>
      </div>

      {/* Print-only one-page takeaway — a clean record for a parent/student to take home.
          Hidden on screen (see .print-takeaway in index.css); shown only via @media print. */}
      <div className="print-takeaway">
        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '28px', marginBottom: '4px' }}>
          Real or AI? &mdash; Session takeaway
        </h1>
        <p className="print-rule" style={{ borderBottom: '1px solid', paddingBottom: '8px', marginBottom: '12px', fontSize: '13px' }}>
          {difficulty ? `${difficulty} tier` : 'Session'} &middot; {roundsTarget} questions &middot; {rank.title}
        </p>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px', fontSize: '14px' }}>
          <tbody>
            <tr>
              <td style={{ padding: '4px 0' }}>Score</td>
              <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 600 }}>{stats.score}</td>
            </tr>
            <tr>
              <td style={{ padding: '4px 0' }}>Accuracy</td>
              <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 600 }}>
                {accuracy}% ({stats.correctCount}/{stats.roundsPlayed})
              </td>
            </tr>
            <tr>
              <td style={{ padding: '4px 0' }}>Best streak</td>
              <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 600 }}>{stats.bestStreak}</td>
            </tr>
          </tbody>
        </table>

        {conceptsSeen.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Concepts practiced this round</p>
            <ul style={{ fontSize: '13px', paddingLeft: '18px', margin: 0 }}>
              {conceptsSeen.slice(0, 5).map((concept) => (
                <li key={concept}>{concept}</li>
              ))}
            </ul>
          </div>
        )}

        <p className="print-rule" style={{ borderTop: '1px solid', paddingTop: '8px', fontSize: '12px' }}>
          Want the full list of tells? Open the Field Guide at the Real or AI? stall, or ask
          a volunteer &mdash; every concept above is one entry in it.
        </p>
      </div>
    </motion.div>
  );
};
