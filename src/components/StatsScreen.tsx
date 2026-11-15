import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { accuracyPercent, getRank, type Stats } from '../game/scoring';
import {
  loadAllLeaderboards,
  todaysEntries,
  roomStanding,
  downloadLeaderboardAsText,
  SESSION_LENGTHS,
  type SessionLength,
  type LeaderboardEntry,
} from '../leaderboard/leaderboard';
import { nextTierUp, type SessionMode } from '../data/types';
import { SignalAvatar } from './SignalAvatar';
import { closingLine, type SignalMood } from '../character/signal';
import { CONCEPT_DEFINITIONS } from '../character/fieldGuide';

interface StatsScreenProps {
  stats: Stats;
  difficulty: SessionMode | null;
  roundsTarget: SessionLength;
  newPersonalBest: boolean;
  conceptsSeen: string[];
  onPlayAgain: () => void;
  onStartRound: (mode: SessionMode) => void;
}

/** Brass-toned confetti burst for new personal bests */
function celebratePersonalBest() {
  try {
    const colors = ['#d6933c', '#ad7329', '#f4ede1'];
    void confetti({ particleCount: 70, spread: 55, angle: 60, origin: { x: 0, y: 0.6 }, colors });
    void confetti({ particleCount: 70, spread: 55, angle: 120, origin: { x: 1, y: 0.6 }, colors });
    void confetti({ particleCount: 60, spread: 100, origin: { y: 0.5 }, colors });
  } catch {
    // Non-canvas fallback
  }
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
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
  const hasPlayedSession = stats.roundsPlayed > 0;
  const accuracy = accuracyPercent(stats);
  const rank = getRank(accuracy);

  const [allBoards] = useState(() => loadAllLeaderboards());
  const [activeLength, setActiveLength] = useState<SessionLength>(roundsTarget);
  const [filterMode, setFilterMode] = useState<'today' | 'all'>('today');

  // View state: toggle between 'leaderboard' and 'analysis'
  const [viewMode, setViewMode] = useState<'leaderboard' | 'analysis'>('leaderboard');

  const board = allBoards[activeLength] || [];
  const todays = todaysEntries(board);
  const entriesToDisplay = filterMode === 'today' ? (todays.length > 0 ? todays : board) : board;
  const isShowingAllTimeFallback = filterMode === 'today' && todays.length === 0 && board.length > 0;

  // Aggregate stats across all boards for stall analysis
  const allRecordedEntries: LeaderboardEntry[] = SESSION_LENGTHS.flatMap((len) => allBoards[len] || []);
  const allTodaysEntries: LeaderboardEntry[] = SESSION_LENGTHS.flatMap((len) => todaysEntries(allBoards[len] || []));
  const totalGamesCount = allRecordedEntries.length;
  const todaysGamesCount = allTodaysEntries.length;
  const avgCommunityAccuracy =
    allRecordedEntries.length > 0
      ? Math.round(allRecordedEntries.reduce((acc, e) => acc + e.accuracy, 0) / allRecordedEntries.length)
      : null;
  const maxCommunityStreak =
    allRecordedEntries.length > 0 ? Math.max(...allRecordedEntries.map((e) => e.bestStreak)) : 0;

  const ownLengthTodays = todaysEntries(allBoards[roundsTarget] || []);
  const standing = difficulty && hasPlayedSession ? roomStanding(ownLengthTodays, difficulty, stats.score) : null;
  const nextTier = difficulty && difficulty !== 'mixed' ? nextTierUp(difficulty) : null;
  const showNudge = nextTier && accuracy >= 85;
  const closingMood: SignalMood = !hasPlayedSession
    ? 'neutral'
    : accuracy >= 90
    ? 'smug'
    : accuracy >= 50
    ? 'correct'
    : 'incorrect';

  useEffect(() => {
    if (newPersonalBest) {
      celebratePersonalBest();
    }
  }, [newPersonalBest]);

  // Check URL hash on mount (e.g. #analysis)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#analysis') {
      setViewMode('analysis');
    }
  }, []);

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (viewMode === 'analysis') {
          e.preventDefault();
          setViewMode('leaderboard');
        }
      } else if (viewMode === 'leaderboard' && (e.code === 'Space' || e.code === 'Enter')) {
        e.preventDefault();
        onPlayAgain();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPlayAgain, viewMode]);

  const top3 = entriesToDisplay.slice(0, 3);

  return (
    <motion.div
      className="flex flex-col min-h-screen w-full bg-ink text-paper font-body p-4 sm:p-6 md:p-8 items-center select-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <div className="no-print w-full max-w-4xl mx-auto flex flex-col space-y-6">
        {/* Navigation / Header Bar */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-panel-line pb-4">
          <div className="flex items-center gap-3.5 text-left">
            <SignalAvatar mood={closingMood} size={48} className="shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-signal font-mono text-xs uppercase tracking-[0.2em]">Stall Central</span>
                <span className="px-1.5 py-0.5 bg-signal/15 text-signal border border-signal/30 text-[10px] font-mono uppercase tracking-wider rounded">
                  Live
                </span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl text-paper tracking-tight mt-0.5">
                {viewMode === 'leaderboard' ? 'Real or AI? Leaderboard' : 'Detection & Stall Analysis'}
              </h1>
            </div>
          </div>

          {/* Primary View Switcher & Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Toggle Buttons */}
            <div className="flex items-center bg-ink border border-panel-line p-1 rounded font-mono text-xs">
              <button
                type="button"
                onClick={() => setViewMode('leaderboard')}
                className={`px-3 py-1.5 transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'leaderboard'
                    ? 'bg-signal text-ink font-600 shadow-sm'
                    : 'text-muted hover:text-paper'
                }`}
              >
                <span>🏆 Leaderboard</span>
              </button>
              <button
                type="button"
                data-testid="view-analysis-btn"
                onClick={() => setViewMode('analysis')}
                className={`px-3 py-1.5 transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'analysis'
                    ? 'bg-signal text-ink font-600 shadow-sm'
                    : 'text-signal hover:text-paper hover:bg-signal/10'
                }`}
              >
                <span>📊 View Analysis</span>
              </button>
            </div>

            {viewMode === 'leaderboard' && (
              <button
                type="button"
                onClick={() => downloadLeaderboardAsText(board, activeLength)}
                className="px-3 py-2 bg-panel border border-panel-line text-muted hover:text-paper transition-colors font-mono text-xs uppercase tracking-wider cursor-pointer min-h-10"
                title="Export leaderboard as .txt"
              >
                Export .txt
              </button>
            )}

            <button
              type="button"
              onClick={onPlayAgain}
              className="px-4 py-2 bg-signal hover:bg-signal-dim text-ink font-body font-600 text-xs sm:text-sm uppercase tracking-wider transition-colors cursor-pointer min-h-10 flex items-center gap-1.5"
            >
              <span>Play Again</span>
              <span className="font-mono text-[10px] opacity-75 hidden sm:inline">[Space]</span>
            </button>
          </div>
        </header>

        {/* =========================================================================
            VIEW 1: PURE LEADERBOARD (No analysis clutter on page)
            ========================================================================= */}
        {viewMode === 'leaderboard' && (
          <motion.div
            key="leaderboard-view"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex flex-col space-y-5"
          >
            {/* Player Latest Result Highlight (if just played) */}
            {hasPlayedSession && (
              <div className="bg-panel/90 border border-panel-line border-l-4 border-l-signal p-4 sm:p-5 text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-muted font-mono text-xs uppercase tracking-wider">Your Latest Run:</span>
                    <span className="px-2 py-0.5 bg-signal/15 text-signal font-mono text-xs border border-signal/30 uppercase tracking-wide">
                      {rank.title}
                    </span>
                    {newPersonalBest && (
                      <span className="px-2 py-0.5 bg-good/20 text-good font-mono text-xs border border-good/40 uppercase tracking-wide">
                        New Personal Best!
                      </span>
                    )}
                  </div>
                  <p className="font-display italic text-paper text-sm sm:text-base mt-1">
                    &ldquo;{closingLine(rank.title)}&rdquo;
                  </p>
                  {standing && (
                    <p className="text-muted text-xs font-mono mt-1">
                      {standing.total <= 1
                        ? `You're the first to play ${difficulty} today at ${roundsTarget} questions.`
                        : `You scored higher than ${standing.beaten} of ${standing.total} players today on ${difficulty} (${roundsTarget}q).`}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right font-mono">
                    <div className="text-xs text-muted uppercase">Score</div>
                    <div className="text-2xl font-700 text-signal">{stats.score} pts</div>
                  </div>
                  <div className="text-right font-mono border-l border-panel-line pl-3">
                    <div className="text-xs text-muted uppercase">Accuracy</div>
                    <div className="text-2xl font-700 text-paper">{accuracy}%</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewMode('analysis')}
                    className="ml-2 px-3.5 py-2 bg-signal/15 hover:bg-signal/25 border border-signal/50 text-signal font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>View Analysis</span>
                    <span>&rarr;</span>
                  </button>
                </div>
              </div>
            )}

            {/* Board Controls: Session Length Tabs & Time Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-panel/40 border border-panel-line p-3">
              {/* Question Count Tabs */}
              <div role="tablist" aria-label="Leaderboard question count" className="flex items-center gap-1.5 flex-wrap">
                <span className="text-muted text-xs font-mono uppercase tracking-wider mr-1 hidden sm:inline">Rounds:</span>
                {SESSION_LENGTHS.map((len) => (
                  <button
                    key={len}
                    type="button"
                    role="tab"
                    aria-selected={activeLength === len}
                    onClick={() => setActiveLength(len)}
                    className={`min-w-14 min-h-9 px-3.5 py-1.5 text-xs uppercase tracking-wider font-mono border transition-all cursor-pointer ${
                      activeLength === len
                        ? 'bg-signal border-signal text-ink font-600 shadow-sm'
                        : 'bg-panel border-panel-line text-muted hover:text-paper hover:border-muted/50'
                    }`}
                  >
                    {len} Questions
                  </button>
                ))}
              </div>

              {/* Today vs All-Time Filter */}
              <div className="flex items-center gap-1 bg-ink border border-panel-line p-1 rounded font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setFilterMode('today')}
                  className={`px-3 py-1 transition-colors cursor-pointer ${
                    filterMode === 'today'
                      ? 'bg-panel text-signal font-600 shadow-xs'
                      : 'text-muted hover:text-paper'
                  }`}
                >
                  Today's Stall
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className={`px-3 py-1 transition-colors cursor-pointer ${
                    filterMode === 'all'
                      ? 'bg-panel text-signal font-600 shadow-xs'
                      : 'text-muted hover:text-paper'
                  }`}
                >
                  All-Time
                </button>
              </div>
            </div>

            {isShowingAllTimeFallback && (
              <p className="text-muted text-xs font-mono text-left">
                No {activeLength}-question sessions recorded yet today &mdash; displaying all-time high scores.
              </p>
            )}

            {/* Top 3 Podium Cards */}
            {top3.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {top3.map((entry, idx) => {
                  const rankNum = idx + 1;
                  const isFirst = rankNum === 1;
                  const badgeBg =
                    rankNum === 1
                      ? 'bg-signal text-ink font-700'
                      : rankNum === 2
                      ? 'bg-paper/80 text-ink font-700'
                      : 'bg-signal-dim/60 text-paper font-700';

                  return (
                    <div
                      key={`${entry.name}-${entry.timestamp}-podium`}
                      className={`bg-panel border p-4 text-left font-mono relative flex flex-col justify-between ${
                        isFirst ? 'border-signal shadow-md shadow-signal/5' : 'border-panel-line'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className={`w-6 h-6 rounded flex items-center justify-center text-xs ${badgeBg}`}>
                          #{rankNum}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-muted px-1.5 py-0.5 bg-ink border border-panel-line">
                          {entry.difficulty}
                        </span>
                      </div>

                      <div className="mt-3">
                        <div className="text-paper font-600 text-lg truncate" title={entry.name}>
                          {entry.name}
                        </div>
                        <div className="text-signal text-2xl font-700 mt-1">
                          {entry.score} <span className="text-xs text-muted font-normal">pts</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-panel-line text-xs text-muted flex items-center justify-between">
                        <span>{entry.accuracy}% accuracy</span>
                        <span>{entry.bestStreak} streak</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Full High Scores Table */}
            <div className="bg-panel border border-panel-line overflow-hidden text-left font-mono text-sm">
              <div className="px-4 py-3 bg-panel/90 border-b border-panel-line flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-muted font-600">
                  {activeLength}-Question Rankings ({entriesToDisplay.length} total)
                </span>
                <span className="text-xs text-muted">Sorted by Score</span>
              </div>

              {entriesToDisplay.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[34rem]">
                    <thead>
                      <tr className="bg-ink/60 text-muted text-[11px] uppercase tracking-wider border-b border-panel-line">
                        <th className="px-4 py-2.5 w-12">#</th>
                        <th className="px-4 py-2.5">Player</th>
                        <th className="px-4 py-2.5">Tier</th>
                        <th className="px-4 py-2.5 text-right">Score</th>
                        <th className="px-4 py-2.5 text-right">Accuracy</th>
                        <th className="px-4 py-2.5 text-right">Streak</th>
                        <th className="px-4 py-2.5 text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entriesToDisplay.map((entry, index) => {
                        const isMedalist = index < 3;
                        return (
                          <tr
                            key={`${entry.name}-${entry.timestamp}`}
                            className={`border-b border-panel-line/60 hover:bg-panel-line/30 transition-colors ${
                              index % 2 === 1 ? 'bg-panel/40' : 'bg-panel'
                            }`}
                          >
                            <td className="px-4 py-2.5 text-muted text-xs">
                              {isMedalist ? (
                                <span className="text-signal font-600">#{index + 1}</span>
                              ) : (
                                index + 1
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-paper font-500 max-w-[12rem] truncate" title={entry.name}>
                              {entry.name}
                            </td>
                            <td className="px-4 py-2.5">
                              <span className="px-1.5 py-0.5 bg-ink text-muted border border-panel-line text-[10px] uppercase">
                                {entry.difficulty}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-right font-600 text-signal">{entry.score}</td>
                            <td className="px-4 py-2.5 text-right text-paper">{entry.accuracy}%</td>
                            <td className="px-4 py-2.5 text-right text-muted">{entry.bestStreak}</td>
                            <td className="px-4 py-2.5 text-right text-muted text-xs whitespace-nowrap">
                              {formatDate(entry.timestamp)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 px-6 text-center text-muted">
                  <SignalAvatar mood="neutral" size={40} className="mx-auto mb-2 opacity-60" />
                  <p className="text-paper text-sm">No recorded runs on the {activeLength}-question board yet.</p>
                  <p className="text-xs text-muted mt-1">Play a session to claim the #1 spot on this board!</p>
                  <button
                    type="button"
                    onClick={onPlayAgain}
                    className="mt-4 px-4 py-2 bg-signal text-ink font-body font-600 text-xs uppercase tracking-wider cursor-pointer hover:bg-signal-dim transition-colors"
                  >
                    Start a {activeLength}-Question Game
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Bar with direct link to Analysis */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-muted font-mono">
              <span>Real or AI? &middot; Local Kiosk System</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="hover:text-paper transition-colors cursor-pointer"
                >
                  Print takeaway
                </button>
                <span>&middot;</span>
                <button
                  type="button"
                  onClick={() => setViewMode('analysis')}
                  className="text-signal hover:underline cursor-pointer flex items-center gap-1 font-600"
                >
                  <span>See Detection Analysis</span>
                  <span>&rarr;</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* =========================================================================
            VIEW 2: DEDICATED ANALYSIS VIEW (Opened when clicking "View Analysis")
            ========================================================================= */}
        {viewMode === 'analysis' && (
          <motion.div
            key="analysis-view"
            data-testid="analysis-modal"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex flex-col space-y-6 text-left"
          >
            {/* Analysis Header & Return Button */}
            <div className="bg-panel border border-panel-line border-t-4 border-t-signal p-4 sm:p-5 flex items-center justify-between">
              <div>
                <span className="text-signal font-mono text-xs uppercase tracking-[0.2em] block">
                  AI Detection Analytics
                </span>
                <h2 className="font-display text-2xl text-paper mt-0.5">Performance &amp; Concept Breakdown</h2>
              </div>
              <button
                type="button"
                onClick={() => setViewMode('leaderboard')}
                className="px-4 py-2 bg-ink border border-panel-line text-signal hover:text-paper hover:border-signal font-mono text-xs uppercase tracking-wider cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <span>&larr;</span>
                <span>Back to Leaderboard [Esc]</span>
              </button>
            </div>

            {/* Section A: Individual Session Analysis (if a game was played) */}
            {hasPlayedSession ? (
              <div className="space-y-4">
                <span className="text-signal font-mono text-xs uppercase tracking-wider font-600 block">
                  Your Session Results
                </span>

                <div className="bg-panel border border-panel-line p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-panel-line pb-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-signal font-mono text-sm uppercase tracking-wider font-700">
                          {rank.title}
                        </span>
                        <span className="text-muted text-xs font-mono">
                          ({difficulty} tier &middot; {roundsTarget} questions)
                        </span>
                      </div>
                      <p className="text-paper text-sm mt-1">{rank.note}</p>
                    </div>
                    <p className="font-display italic text-muted text-sm sm:text-right shrink-0">
                      &ldquo;{closingLine(rank.title)}&rdquo;
                    </p>
                  </div>

                  {/* 4-Stat Metric Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-center">
                    <div className="bg-ink border border-panel-line p-3">
                      <span className="text-muted text-[10px] uppercase tracking-wider block">Score</span>
                      <span className="text-3xl font-700 text-good mt-1 block">{stats.score}</span>
                      <span className="text-[10px] text-muted">points earned</span>
                    </div>

                    <div className="bg-ink border border-panel-line p-3">
                      <span className="text-muted text-[10px] uppercase tracking-wider block">Accuracy</span>
                      <span className="text-3xl font-700 text-signal mt-1 block">{accuracy}%</span>
                      <span className="text-[10px] text-muted">
                        {stats.correctCount} of {stats.roundsPlayed} correct
                      </span>
                    </div>

                    <div className="bg-ink border border-panel-line p-3">
                      <span className="text-muted text-[10px] uppercase tracking-wider block">Best Streak</span>
                      <span className="text-3xl font-700 text-signal mt-1 block">{stats.bestStreak}</span>
                      <span className="text-[10px] text-muted">consecutive tells</span>
                    </div>

                    <div className="bg-ink border border-panel-line p-3">
                      <span className="text-muted text-[10px] uppercase tracking-wider block">Rounds</span>
                      <span className="text-3xl font-700 text-paper mt-1 block">{stats.roundsPlayed}</span>
                      <span className="text-[10px] text-muted">questions answered</span>
                    </div>
                  </div>

                  {/* Progression Nudge */}
                  {showNudge && nextTier && (
                    <button
                      type="button"
                      onClick={() => onStartRound(nextTier)}
                      className="mt-4 w-full border border-signal/50 bg-signal/10 hover:bg-signal/20 transition-colors p-3.5 text-left cursor-pointer font-mono"
                    >
                      <span className="text-signal text-xs uppercase tracking-wider block font-600">Ready to level up</span>
                      <span className="font-display text-base text-paper mt-0.5 block">
                        Start {nextTier} tier round &rarr;
                      </span>
                    </button>
                  )}
                </div>

                {/* Practiced Concepts */}
                {conceptsSeen.length > 0 && (
                  <div className="bg-panel border border-panel-line p-5">
                    <span className="text-signal font-mono text-xs uppercase tracking-wider block mb-2 font-600">
                      Tells Practiced in This Session
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {conceptsSeen.map((concept) => (
                        <div
                          key={concept}
                          className="px-3 py-1.5 bg-ink border border-panel-line text-paper font-mono text-xs"
                        >
                          <span className="text-signal font-600">{concept}:</span>{' '}
                          <span className="text-muted">
                            {CONCEPT_DEFINITIONS[concept] || 'Identified statistical tell'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-panel border border-panel-line p-6 text-center">
                <SignalAvatar mood="neutral" size={44} className="mx-auto mb-2 opacity-80" />
                <h3 className="text-paper font-display text-lg">No Active Session In Memory</h3>
                <p className="text-muted text-xs font-mono max-w-md mx-auto mt-1">
                  You are viewing the leaderboard directly. Below is the community stall analytics across all players
                  who have taken the challenge!
                </p>
                <button
                  type="button"
                  onClick={onPlayAgain}
                  className="mt-4 px-5 py-2 bg-signal text-ink font-body font-600 text-xs uppercase tracking-wider cursor-pointer hover:bg-signal-dim transition-colors"
                >
                  Start a Game to Test Your Eye
                </button>
              </div>
            )}

            {/* Section B: Stall & Community Detection Analytics */}
            <div className="space-y-3">
              <span className="text-signal font-mono text-xs uppercase tracking-wider font-600 block">
                Stall &amp; Community Analytics
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-center">
                <div className="bg-panel border border-panel-line p-4">
                  <span className="text-muted text-[10px] uppercase tracking-wider block">Today's Sessions</span>
                  <span className="text-2xl sm:text-3xl font-700 text-paper mt-1 block">{todaysGamesCount}</span>
                  <span className="text-[10px] text-muted">completed runs</span>
                </div>

                <div className="bg-panel border border-panel-line p-4">
                  <span className="text-muted text-[10px] uppercase tracking-wider block">All-Time Games</span>
                  <span className="text-2xl sm:text-3xl font-700 text-paper mt-1 block">{totalGamesCount}</span>
                  <span className="text-[10px] text-muted">total recorded</span>
                </div>

                <div className="bg-panel border border-panel-line p-4">
                  <span className="text-muted text-[10px] uppercase tracking-wider block">Community Accuracy</span>
                  <span className="text-2xl sm:text-3xl font-700 text-signal mt-1 block">
                    {avgCommunityAccuracy !== null ? `${avgCommunityAccuracy}%` : 'N/A'}
                  </span>
                  <span className="text-[10px] text-muted">average across all</span>
                </div>

                <div className="bg-panel border border-panel-line p-4">
                  <span className="text-muted text-[10px] uppercase tracking-wider block">Stall Best Streak</span>
                  <span className="text-2xl sm:text-3xl font-700 text-signal mt-1 block">{maxCommunityStreak}</span>
                  <span className="text-[10px] text-muted">consecutive record</span>
                </div>
              </div>

              {/* Board Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                {SESSION_LENGTHS.map((len) => {
                  const lenBoard = allBoards[len] || [];
                  const lenTodays = todaysEntries(lenBoard);
                  const topScore = lenBoard.length > 0 ? lenBoard[0].score : 0;
                  return (
                    <div key={len} className="bg-panel border border-panel-line p-3 text-left">
                      <div className="text-signal font-700 uppercase mb-1">{len}-Question Board</div>
                      <div className="text-muted">Today: <span className="text-paper">{lenTodays.length}</span></div>
                      <div className="text-muted">Total: <span className="text-paper">{lenBoard.length}</span></div>
                      <div className="text-muted">High Score: <span className="text-signal font-600">{topScore} pts</span></div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section C: Educational Framing for Parents & Counselors */}
            <div className="bg-panel border border-panel-line border-l-4 border-l-signal p-5">
              <span className="text-signal font-mono text-xs uppercase tracking-wider font-600 block mb-1">
                Educational Context &amp; Research Note
              </span>
              <p className="text-paper text-sm leading-relaxed">
                What this stall tests is authentic machine learning literacy: identifying token-level repetition,
                overly diplomatic hedging, hallucinated claims, and formulaic composition. These patterns form the foundation
                of automated content auditing and model alignment research.
              </p>
            </div>

            {/* Section D: Analysis Action Buttons */}
            <div className="pt-2 flex items-center justify-between gap-3 border-t border-panel-line font-mono text-xs">
              <button
                type="button"
                onClick={() => setViewMode('leaderboard')}
                className="px-4 py-2 bg-ink border border-panel-line text-signal hover:text-paper transition-colors cursor-pointer"
              >
                &larr; Back to Leaderboard
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-2 bg-panel border border-panel-line text-muted hover:text-paper transition-colors cursor-pointer"
                >
                  Print Takeaway
                </button>
                <button
                  type="button"
                  onClick={onPlayAgain}
                  className="px-4 py-2 bg-signal text-ink font-600 uppercase tracking-wider hover:bg-signal-dim transition-colors cursor-pointer"
                >
                  Play Again
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Print-only one-page takeaway (for @media print) */}
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
