import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  loadAllLeaderboards,
  todaysEntries,
  downloadLeaderboardAsText,
  SESSION_LENGTHS,
  type SessionLength,
} from '../leaderboard/leaderboard';

interface FullLeaderboardProps {
  initialLength: SessionLength;
  onClose: () => void;
}

const DISPLAY_CAP = 20;

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** The full, detailed leaderboard — every column, every session-length board, score-sorted. */
export const FullLeaderboard: React.FC<FullLeaderboardProps> = ({ initialLength, onClose }) => {
  const [allBoards] = useState(() => loadAllLeaderboards());
  const [activeLength, setActiveLength] = useState<SessionLength>(initialLength);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const board = allBoards[activeLength];
  const today = todaysEntries(board);
  const rows = (today.length > 0 ? today : board).slice(0, DISPLAY_CAP);
  const showingToday = today.length > 0;

  return (
    <motion.div
      data-testid="full-leaderboard"
      className="fixed inset-0 z-40 bg-ink text-paper font-body flex flex-col items-center p-6 md:p-10 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-3xl">
        <div className="flex items-start justify-between mb-4 gap-3">
          <div>
            <span className="text-signal font-mono uppercase text-xs md:text-sm tracking-[0.2em]">Leaderboard</span>
            <h1 className="font-display text-3xl md:text-4xl text-paper mt-1">
              {activeLength}-question board
            </h1>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 min-h-11 bg-panel border border-panel-line text-muted hover:text-paper transition-colors font-mono text-xs uppercase tracking-wider cursor-pointer shrink-0"
          >
            Close [Esc]
          </button>
        </div>

        <div role="tablist" aria-label="Leaderboard session length" className="flex items-center gap-1.5 mb-5 flex-wrap">
          {SESSION_LENGTHS.map((len) => (
            <button
              key={len}
              type="button"
              role="tab"
              aria-selected={activeLength === len}
              onClick={() => setActiveLength(len)}
              className={`min-w-12 min-h-10 px-3.5 py-2 text-sm uppercase tracking-wider border font-mono transition-colors cursor-pointer ${
                activeLength === len
                  ? 'bg-signal border-signal text-ink'
                  : 'bg-panel border-panel-line text-muted hover:text-paper'
              }`}
            >
              {len}q
            </button>
          ))}
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => downloadLeaderboardAsText(board, activeLength)}
            className="min-h-10 px-3.5 py-2 bg-panel border border-panel-line text-muted hover:text-paper transition-colors font-mono text-xs uppercase tracking-wider cursor-pointer"
          >
            Export .txt
          </button>
        </div>

        {!showingToday && board.length > 0 && (
          <p className="text-muted text-xs font-mono mb-3">
            No {activeLength}-question sessions played today yet &mdash; showing all-time results.
          </p>
        )}

        {rows.length > 0 ? (
          <div className="overflow-x-auto border border-panel-line">
            <table className="w-full text-left font-mono text-sm min-w-[36rem]">
              <thead>
                <tr className="bg-panel text-muted text-xs uppercase tracking-wider">
                  <th className="px-3 py-2.5">#</th>
                  <th className="px-3 py-2.5">Name</th>
                  <th className="px-3 py-2.5">Difficulty</th>
                  <th className="px-3 py-2.5 text-right">Score</th>
                  <th className="px-3 py-2.5 text-right">Accuracy</th>
                  <th className="px-3 py-2.5 text-right">Best streak</th>
                  <th className="px-3 py-2.5 text-right">Played</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((entry, i) => (
                  <tr
                    key={`${entry.name}-${entry.timestamp}`}
                    className={`border-t border-panel-line ${i % 2 === 1 ? 'bg-panel/40' : ''}`}
                  >
                    <td className="px-3 py-2 text-muted">{i + 1}</td>
                    <td className="px-3 py-2 text-paper truncate max-w-[10rem]">{entry.name}</td>
                    <td className="px-3 py-2 text-muted uppercase">{entry.difficulty}</td>
                    <td className="px-3 py-2 text-signal text-right">{entry.score}</td>
                    <td className="px-3 py-2 text-paper text-right">{entry.accuracy}%</td>
                    <td className="px-3 py-2 text-paper text-right">{entry.bestStreak}</td>
                    <td className="px-3 py-2 text-muted text-right whitespace-nowrap">{formatDate(entry.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted text-sm">No sessions recorded yet on the {activeLength}-question board.</p>
        )}
      </div>
    </motion.div>
  );
};
