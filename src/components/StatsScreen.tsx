import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  accuracyPercent,
  tellAccuracyPercent,
  calculateCalibrationScore,
  getStrongestAndWeakestTells,
  getRank,
  type Stats,
} from '../game/scoring';
import {
  loadAllLeaderboards,
  todaysEntries,
  roomStanding,
  downloadLeaderboardAsText,
  sortLeaderboard,
  SESSION_LENGTHS,
  type SessionLength,
  type LeaderboardEntry,
  type LeaderboardSortView,
} from '../leaderboard/leaderboard';
import { nextTierUp, type SessionMode } from '../data/types';
import { SignalAvatar } from './SignalAvatar';
import { closingLine, type SignalMood } from '../character/signal';
import { CONCEPT_DEFINITIONS, getConceptDetail, EDUCATIONAL_DISCLAIMER } from '../character/fieldGuide';
import { loadMastery, getMasteryCounts } from '../learning/mastery';
import { getSessionCounts, loadSessionHistory } from '../learning/sessions';
import { calculateProgressComparison } from '../learning/progress';
import { loadPreferences } from '../prefs/prefs';
import { buildShareText } from '../learning/share';

interface StatsScreenProps {
  playerName?: string;
  stats: Stats;
  difficulty: SessionMode | null;
  roundsTarget: SessionLength;
  newPersonalBest: boolean;
  conceptsSeen: string[];
  onPlayAgain: () => void;
  onStartRound: (mode: SessionMode) => void;
  onReplayMissed?: () => void;
  onPracticeTell?: (concept: string) => void;
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
  playerName,
  stats,
  difficulty,
  roundsTarget,
  newPersonalBest,
  conceptsSeen,
  onPlayAgain,
  onStartRound,
  onReplayMissed,
  onPracticeTell,
}) => {
  const hasPlayedSession = stats.roundsPlayed > 0;
  const isCompletedSession = stats.roundsPlayed >= roundsTarget;
  const accuracy = accuracyPercent(stats);
  const tellAccuracy = tellAccuracyPercent(stats);
  const calibrationScore = calculateCalibrationScore(stats.results || []);
  const rank = getRank(accuracy);

  const prefs = loadPreferences();
  const showNameInShare = Boolean(prefs.showNameOnLeaderboard && playerName?.trim());

  const [allBoards] = useState(() => loadAllLeaderboards());
  const [activeLength, setActiveLength] = useState<SessionLength>(roundsTarget);
  const [filterMode, setFilterMode] = useState<'today' | 'all'>('today');
  const [sortView, setSortView] = useState<LeaderboardSortView>('score');

  // View state: toggle between 'leaderboard' and 'analysis'
  const [viewMode, setViewMode] = useState<'leaderboard' | 'analysis'>(() =>
    typeof window !== 'undefined' && window.location.hash === '#analysis' ? 'analysis' : 'leaderboard'
  );
  const [copiedShare, setCopiedShare] = useState(false);

  const handleShareResult = async () => {
    const shareText = buildShareText({
      difficulty,
      roundsPlayed: stats.roundsPlayed,
      score: stats.score,
      accuracy,
      calibration: calibrationScore,
      rankTitle: rank.title,
      playerName,
      showNameOnLeaderboard: prefs.showNameOnLeaderboard,
    });
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 2500);
      }
    } catch {
      // clipboard fallback
    }
  };

  const board = allBoards[activeLength] || [];
  const todays = todaysEntries(board);
  const rawEntries = filterMode === 'today' ? (todays.length > 0 ? todays : board) : board;
  const entriesToDisplay = sortLeaderboard(rawEntries, sortView);

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
  const showNudge = nextTier && accuracy >= 80;

  const masteryCounts = getMasteryCounts(loadMastery());
  const sessionCounts = React.useMemo(() => getSessionCounts(), []);
  const allCompletedSessions = React.useMemo(() => {
    const history = loadSessionHistory();
    const completed = history.filter((s) => s.status === 'completed');
    if (isCompletedSession && completed.length > 0) {
      return completed.slice(0, -1);
    }
    return completed;
  }, [isCompletedSession]);
  const progressComparison = hasPlayedSession
    ? calculateProgressComparison(
        {
          sourceAccuracy: accuracy,
          tellAccuracy,
          calibration: calibrationScore,
        },
        allCompletedSessions
      )
    : null;
  const tellAnalysis = getStrongestAndWeakestTells(stats.results || []);

  const highConfidenceMisses = (stats.results || []).filter(
    (r) => !r.isCorrect && !r.isUnsure && r.confidence === 'high'
  );

  // Content type breakdown
  const categoryBreakdown = React.useMemo(() => {
    const map = new Map<string, { total: number; correct: number }>();
    for (const r of stats.results || []) {
      const cat = r.category || 'General';
      const curr = map.get(cat) || { total: 0, correct: 0 };
      curr.total += 1;
      if (r.isCorrect) curr.correct += 1;
      map.set(cat, curr);
    }
    return Array.from(map.entries()).map(([category, { total, correct }]) => ({
      category,
      total,
      correct,
      pct: Math.round((correct / total) * 100),
    }));
  }, [stats.results]);

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
                {hasPlayedSession && (
                  <span
                    className={`px-1.5 py-0.5 border text-[10px] font-mono uppercase tracking-wider rounded ${
                      isCompletedSession
                        ? 'bg-good/20 text-good border-good/40'
                        : 'bg-signal/20 text-signal border-signal/40'
                    }`}
                  >
                    {isCompletedSession ? 'Completed Session' : 'Practice Run'}
                  </span>
                )}
              </div>
              <h1 className="font-display text-2xl sm:text-3xl text-paper mt-0.5">
                Real or AI? Leaderboard &amp; Analysis
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-panel border border-panel-line p-1 font-mono text-xs">
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

            {hasPlayedSession && (
              <button
                type="button"
                onClick={handleShareResult}
                className="px-3 py-2 bg-panel border border-panel-line text-signal hover:text-paper hover:border-signal transition-colors font-mono text-xs uppercase tracking-wider cursor-pointer min-h-10"
                title="Copy private, non-identifying session summary"
              >
                {copiedShare ? '✓ Copied' : 'Share Result'}
              </button>
            )}

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
              className="px-4 py-2 bg-signal hover:bg-signal-dim text-ink font-body font-600 text-xs sm:text-sm uppercase tracking-wider transition-colors cursor-pointer min-h-10 flex items-center gap-1.5 shadow-md"
            >
              <span>Play Again</span>
              <span className="font-mono text-xs opacity-75 hidden sm:inline">[Space]</span>
            </button>
          </div>
        </header>

        {hasPlayedSession && (
          <div data-testid="share-privacy-note" className="w-full text-right text-[11px] font-mono text-muted -mt-3">
            This share text contains: score, accuracy, calibration — {showNameInShare ? playerName?.trim() : 'no name'}
          </div>
        )}

        {/* =========================================================================
            VIEW 1: MULTI-METRIC LEADERBOARD VIEW
            ========================================================================= */}
        {viewMode === 'leaderboard' && (
          <motion.div
            key="leaderboard-view"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex flex-col space-y-5"
          >
            {/* Length selector & Time filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-panel border border-panel-line p-3 sm:px-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                <span className="text-muted text-xs font-mono uppercase tracking-wider shrink-0 mr-1">Board:</span>
                {SESSION_LENGTHS.map((len) => (
                  <button
                    key={len}
                    type="button"
                    onClick={() => setActiveLength(len)}
                    className={`min-h-10 px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer shrink-0 ${
                      activeLength === len
                        ? 'bg-signal text-ink font-600'
                        : 'bg-ink/50 text-muted hover:text-paper border border-panel-line'
                    }`}
                  >
                    {len} Questions
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-ink border border-panel-line p-0.5 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => setFilterMode('today')}
                    className={`min-h-10 px-3 py-1 transition-colors cursor-pointer ${
                      filterMode === 'today' ? 'bg-signal text-ink font-600' : 'text-muted hover:text-paper'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterMode('all')}
                    className={`min-h-10 px-3 py-1 transition-colors cursor-pointer ${
                      filterMode === 'all' ? 'bg-signal text-ink font-600' : 'text-muted hover:text-paper'
                    }`}
                  >
                    All-Time
                  </button>
                </div>
              </div>
            </div>

            {/* Metric Sort Filters */}
            <div className="flex items-center gap-2 flex-wrap font-mono text-xs bg-panel/60 border border-panel-line p-2.5">
              <span className="text-muted text-[10px] uppercase tracking-wider mr-1">Rank by:</span>
              {(
                [
                  { id: 'score', label: 'High Score' },
                  { id: 'accuracy', label: 'Source Accuracy' },
                  { id: 'calibration', label: 'Best Calibration' },
                  { id: 'streak', label: 'Best Streak' },
                  { id: 'mastered', label: 'Concepts Mastered' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSortView(tab.id)}
                  className={`min-h-10 px-3 py-1 border transition-colors cursor-pointer uppercase ${
                    sortView === tab.id
                      ? 'bg-signal text-ink border-signal font-600'
                      : 'bg-ink/60 border-panel-line text-muted hover:text-paper'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Room Standing Feedback */}
            {standing && (
              <div className="bg-panel border border-panel-line border-l-4 border-l-good p-3 sm:p-4 text-left font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span>
                  Your session scored higher than <strong className="text-good">{standing.beaten}</strong> of{' '}
                  <strong className="text-paper">{standing.total}</strong> players today in {difficulty} tier ({Math.round((standing.beaten / Math.max(1, standing.total)) * 100)}th percentile).
                </span>
                <span className="text-signal uppercase text-[11px] font-600 shrink-0">Local Kiosk Record</span>
              </div>
            )}

            {/* Responsive Table / Cards */}
            <div className="bg-panel border border-panel-line shadow-md overflow-hidden">
              {entriesToDisplay.length > 0 ? (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[34rem] font-mono">
                      <thead>
                        <tr className="bg-ink/60 text-muted text-[11px] uppercase tracking-wider border-b border-panel-line">
                          <th className="px-4 py-2.5 w-12">#</th>
                          <th className="px-4 py-2.5">Player</th>
                          <th className="px-4 py-2.5">Tier</th>
                          <th className="px-4 py-2.5 text-right">Score</th>
                          <th className="px-4 py-2.5 text-right">Accuracy</th>
                          <th className="px-4 py-2.5 text-right">Streak</th>
                          <th className="px-4 py-2.5 text-right">Calibration</th>
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
                              <td className="px-4 py-2.5 text-right text-good">
                                {entry.calibration ? `${entry.calibration}%` : `${entry.accuracy}%`}
                              </td>
                              <td className="px-4 py-2.5 text-right text-muted text-xs whitespace-nowrap">
                                {formatDate(entry.timestamp)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Responsive Cards */}
                  <div className="sm:hidden divide-y divide-panel-line">
                    {entriesToDisplay.map((entry, index) => (
                      <div key={`${entry.name}-${entry.timestamp}`} className="p-3.5 text-left font-mono text-xs flex flex-col space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-signal font-600">#{index + 1} {entry.name}</span>
                          <span className="px-1.5 py-0.5 bg-ink text-muted border border-panel-line text-[10px] uppercase">
                            {entry.difficulty}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-muted text-[11px] pt-1">
                          <span>Score: <strong className="text-good">{entry.score}</strong></span>
                          <span>Acc: <strong className="text-paper">{entry.accuracy}%</strong></span>
                          <span>Streak: <strong className="text-signal">{entry.bestStreak}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="py-12 px-6 text-center text-muted">
                  <SignalAvatar mood="neutral" size={40} className="mx-auto mb-2 opacity-60" />
                  <p className="text-paper text-sm">No recorded runs on the {activeLength}-question board yet.</p>
                  <button
                    type="button"
                    onClick={onPlayAgain}
                    className="mt-4 min-h-11 px-4 py-2 bg-signal text-ink font-body font-600 text-xs uppercase tracking-wider cursor-pointer hover:bg-signal-dim transition-colors"
                  >
                    Start a {activeLength}-Question Game
                  </button>
                </div>
              )}
            </div>

            {/* Privacy & Kiosk Copy */}
            <div className="p-3 bg-panel/60 border border-panel-line text-left text-xs font-mono text-muted space-y-1">
              <span className="text-signal uppercase text-[10px] tracking-wider block font-600">
                Privacy &amp; Data Notice
              </span>
              <p className="text-[11px] text-muted/90 leading-relaxed">
                Leaderboard scores and player aliases are preserved in your browser's local sandbox. No private credentials or personal data are collected. Playing as "Anonymous" keeps your session unlinked.
              </p>
            </div>
          </motion.div>
        )}

        {/* =========================================================================
            VIEW 2: DEDICATED INQUIRY & DETECTION ANALYSIS VIEW
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
            {/* Header */}
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

            {/* Individual Session Results */}
            {hasPlayedSession ? (
              <div className="space-y-4">
                <span className="text-signal font-mono text-xs uppercase tracking-wider font-600 block">
                  Your Session Results ({isCompletedSession ? 'Completed Session' : 'Abandoned Session'})
                </span>

                <div className="bg-panel border border-panel-line p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-panel-line pb-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-signal font-mono text-sm uppercase tracking-wider font-700">
                          {rank.title}
                        </span>
                        <span className="text-muted text-xs font-mono">
                          ({difficulty} tier &middot; {stats.roundsPlayed}/{roundsTarget} questions)
                        </span>
                      </div>
                      <p className="text-paper text-sm mt-1">{rank.note}</p>
                    </div>
                    <p className="font-display italic text-muted text-sm sm:text-right shrink-0">
                      &ldquo;{closingLine(rank.title)}&rdquo;
                    </p>
                  </div>

                  {/* Enhanced 5-Metric Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-center">
                    <div className="bg-ink border border-panel-line p-3">
                      <span className="text-muted text-[10px] uppercase tracking-wider block">Score</span>
                      <span className="text-2xl sm:text-3xl font-700 text-good mt-1 block">{stats.score}</span>
                      <span className="text-[10px] text-muted">points</span>
                    </div>

                    <div className="bg-ink border border-panel-line p-3">
                      <span className="text-muted text-[10px] uppercase tracking-wider block">Source Acc.</span>
                      <span className="text-2xl sm:text-3xl font-700 text-signal mt-1 block">{accuracy}%</span>
                      <span className="text-[10px] text-muted">{stats.correctCount} of {stats.roundsPlayed}</span>
                    </div>

                    <div className="bg-ink border border-panel-line p-3">
                      <span className="text-muted text-[10px] uppercase tracking-wider block">Tell Acc.</span>
                      <span className="text-2xl sm:text-3xl font-700 text-paper mt-1 block">{tellAccuracy}%</span>
                      <span className="text-[10px] text-muted">{stats.tellCorrectCount ?? 0} identified</span>
                    </div>

                    <div className="bg-ink border border-panel-line p-3">
                      <span className="text-muted text-[10px] uppercase tracking-wider block">Calibration</span>
                      <span className="text-2xl sm:text-3xl font-700 text-good mt-1 block">{calibrationScore}%</span>
                      <span className="text-[10px] text-muted">conviction align</span>
                    </div>

                    <div className="bg-ink border border-panel-line p-3">
                      <span className="text-muted text-[10px] uppercase tracking-wider block">Streak</span>
                      <span className="text-2xl sm:text-3xl font-700 text-signal mt-1 block">{stats.bestStreak}</span>
                      <span className="text-[10px] text-muted">consecutive</span>
                    </div>
                  </div>

                  {/* Personal Improvement Trend */}
                  {progressComparison?.hasSufficientHistory && (
                    <div
                      data-testid="personal-trend"
                      className="mt-3 p-3 bg-ink/70 border border-panel-line flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono"
                    >
                      <span className="text-signal uppercase text-[11px] tracking-wider font-semibold">
                        You &middot; Trend vs Recent Runs
                      </span>
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <span
                          className={
                            (progressComparison.sourceAccuracyDelta?.delta ?? 0) >= 0
                              ? 'text-good'
                              : 'text-bad'
                          }
                        >
                          Accuracy: {progressComparison.sourceAccuracyDelta?.formatted}
                        </span>
                        <span className="text-panel-line hidden sm:inline">|</span>
                        <span
                          className={
                            (progressComparison.calibrationDelta?.delta ?? 0) >= 0
                              ? 'text-good'
                              : 'text-bad'
                          }
                        >
                          Calibration: {progressComparison.calibrationDelta?.formatted}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Strongest & Weakest Tells */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    {tellAnalysis.strongest && (
                      <div className="p-3 bg-ink border border-good/40 border-l-4 border-l-good text-left">
                        <span className="text-[10px] font-mono text-good uppercase tracking-wider block">
                          Strongest Tell ({tellAnalysis.strongest.accuracy}% accuracy)
                        </span>
                        <span className="font-display text-sm text-paper mt-0.5 block">
                          {tellAnalysis.strongest.concept}
                        </span>
                        <p className="text-[11px] text-muted mt-1 leading-snug">
                          {CONCEPT_DEFINITIONS[tellAnalysis.strongest.concept]}
                        </p>
                      </div>
                    )}

                    {tellAnalysis.weakest && (
                      <div className="p-3 bg-ink border border-bad/40 border-l-4 border-l-bad text-left">
                        <span className="text-[10px] font-mono text-bad uppercase tracking-wider block">
                          Weakest Tell ({tellAnalysis.weakest.accuracy}% accuracy)
                        </span>
                        <span className="font-display text-sm text-paper mt-0.5 block">
                          {tellAnalysis.weakest.concept}
                        </span>
                        <p className="text-[11px] text-muted mt-1 leading-snug">
                          {CONCEPT_DEFINITIONS[tellAnalysis.weakest.concept]}
                        </p>
                        {onPracticeTell && (
                          <button
                            type="button"
                            onClick={() => onPracticeTell(tellAnalysis.weakest!.concept)}
                            className="mt-2 text-xs font-mono text-signal hover:underline cursor-pointer"
                          >
                            Practice this tell now &rarr;
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Content Medium Breakdown */}
                  {categoryBreakdown.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-panel-line/60">
                      <span className="text-muted text-xs font-mono uppercase tracking-wider block mb-2">
                        Accuracy by Content Medium
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-xs">
                        {categoryBreakdown.map((b) => (
                          <div key={b.category} className="bg-ink p-2.5 border border-panel-line flex items-center justify-between">
                            <span className="text-paper">{b.category}:</span>
                            <span className="text-signal font-600">{b.pct}% ({b.correct}/{b.total})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Session Concepts Syllabus */}
                  {conceptsSeen && conceptsSeen.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-panel-line/60 text-left">
                      <span className="text-muted text-xs font-mono uppercase tracking-wider block mb-2">
                        Session Syllabus ({conceptsSeen.length} tells encountered)
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {conceptsSeen.map((concept) => (
                          <span
                            key={concept}
                            className="px-2 py-0.5 bg-ink border border-panel-line text-signal font-mono text-[11px]"
                          >
                            {concept}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* High Confidence Misses Alert */}
                  {highConfidenceMisses.length > 0 && (
                    <div className="mt-4 p-3 bg-bad-dim border border-bad/40 text-left">
                      <span className="text-bad font-mono text-xs uppercase tracking-wider font-600 block mb-1">
                        ⚠ Calibration Review: High-Confidence Misses ({highConfidenceMisses.length})
                      </span>
                      <p className="text-xs text-muted leading-relaxed font-body mb-2">
                        You answered with high confidence but were misled by ambiguous cues. Reviewing counterexamples is the most effective way to calibrate judgment:
                      </p>
                      <ul className="space-y-1.5 font-mono text-xs">
                        {highConfidenceMisses.slice(0, 3).map((m, idx) => {
                          const det = getConceptDetail(m.concept);
                          return (
                            <li key={idx} className="bg-ink/70 p-2 border border-panel-line">
                              <span className="text-signal font-600">{m.concept}:</span>{' '}
                              <span className="text-muted">{det.counterexample}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {/* Next Practice Recommendation Card */}
                  <div className="mt-4 p-4 bg-signal/10 border border-signal/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-signal font-mono text-xs uppercase tracking-wider block font-600">
                        Recommended Next Activity
                      </span>
                      <p className="text-paper text-xs sm:text-sm mt-0.5">
                        {highConfidenceMisses.length > 0
                          ? 'Review missed questions to study why single signals fail.'
                          : 'Solid detection! Ready for higher tier or daily spaced retrieval.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {onReplayMissed && highConfidenceMisses.length > 0 && (
                        <button
                          type="button"
                          onClick={onReplayMissed}
                          className="px-3.5 py-2 bg-panel border border-signal text-signal hover:bg-signal hover:text-ink font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Replay Missed Rounds
                        </button>
                      )}
                      {showNudge && nextTier && (
                        <button
                          type="button"
                          onClick={() => onStartRound(nextTier)}
                          className="px-3.5 py-2 bg-signal text-ink font-mono text-xs uppercase font-600 hover:bg-signal-dim transition-colors cursor-pointer"
                        >
                          Level Up: {nextTier} &rarr;
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-panel border border-panel-line p-6 text-center">
                <SignalAvatar mood="neutral" size={44} className="mx-auto mb-2 opacity-80" />
                <h3 className="text-paper font-display text-lg">No Active Session In Memory</h3>
                <p className="text-muted text-xs font-mono max-w-md mx-auto mt-1">
                  Start a round from the landing page to evaluate your calibration and accuracy across AI literacy tells.
                </p>
                <button
                  type="button"
                  onClick={onPlayAgain}
                  className="mt-4 px-5 py-2 bg-signal text-ink font-body font-600 text-xs uppercase tracking-wider cursor-pointer hover:bg-signal-dim transition-colors"
                >
                  Start a Game
                </button>
              </div>
            )}

            {/* Device-Wide Statistics */}
            <div className="space-y-3">
              <span className="text-signal font-mono text-xs uppercase tracking-wider font-600 block">
                This Device &middot; Session History &amp; Activity
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 font-mono text-center">
                <div className="bg-panel border border-panel-line p-3">
                  <span className="text-muted text-[10px] uppercase tracking-wider block">Completed</span>
                  <span className="text-2xl sm:text-3xl font-700 text-good mt-1 block">{sessionCounts.completed}</span>
                </div>

                <div className="bg-panel border border-panel-line p-3">
                  <span className="text-muted text-[10px] uppercase tracking-wider block">Abandoned</span>
                  <span className="text-2xl sm:text-3xl font-700 text-bad mt-1 block">{sessionCounts.abandoned}</span>
                </div>

                <div className="bg-panel border border-panel-line p-3">
                  <span className="text-muted text-[10px] uppercase tracking-wider block">Today's Runs</span>
                  <span className="text-2xl sm:text-3xl font-700 text-paper mt-1 block">{todaysGamesCount}</span>
                </div>

                <div className="bg-panel border border-panel-line p-3">
                  <span className="text-muted text-[10px] uppercase tracking-wider block">All-Time Runs</span>
                  <span className="text-2xl sm:text-3xl font-700 text-paper mt-1 block">{totalGamesCount}</span>
                </div>

                <div className="bg-panel border border-panel-line p-3">
                  <span className="text-muted text-[10px] uppercase tracking-wider block">Avg Accuracy</span>
                  <span className="text-2xl sm:text-3xl font-700 text-signal mt-1 block">
                    {avgCommunityAccuracy !== null ? `${avgCommunityAccuracy}%` : 'N/A'}
                  </span>
                </div>

                <div className="bg-panel border border-panel-line p-3">
                  <span className="text-muted text-[10px] uppercase tracking-wider block">Best Streak</span>
                  <span className="text-2xl sm:text-3xl font-700 text-good mt-1 block">{maxCommunityStreak}</span>
                </div>

                <div className="bg-panel border border-panel-line p-3">
                  <span className="text-muted text-[10px] uppercase tracking-wider block">Mastered Tells</span>
                  <span className="text-2xl sm:text-3xl font-700 text-signal mt-1 block">{masteryCounts.mastered}</span>
                </div>
              </div>
            </div>

            {/* Educational Disclaimer */}
            <div className="bg-panel border border-panel-line border-l-4 border-l-signal p-4">
              <span className="text-signal font-mono text-xs uppercase tracking-wider font-600 block mb-1">
                Core Literacy Principle
              </span>
              <p className="text-xs text-muted font-mono leading-relaxed italic">
                {EDUCATIONAL_DISCLAIMER}
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Print-only Takeaway */}
      <div className="print-takeaway">
        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '28px', marginBottom: '4px' }}>
          Real or AI? &mdash; Session Takeaway
        </h1>
        {showNameInShare && (
          <p style={{ fontSize: '14px', marginBottom: '4px', fontWeight: 600 }}>
            Player: {playerName?.trim()}
          </p>
        )}
        <p className="print-rule" style={{ borderBottom: '1px solid', paddingBottom: '8px', marginBottom: '12px', fontSize: '13px' }}>
          {difficulty ? `${difficulty} tier` : 'Session'} &middot; {roundsTarget} questions &middot; {rank.title}
        </p>
        <p style={{ fontSize: '11px', color: '#666', marginBottom: '8px' }}>
          {showNameInShare ? 'Player name included per device preferences.' : 'Private takeaway: no player name included.'}
        </p>
        <p style={{ fontSize: '12px', marginTop: '12px' }}>{EDUCATIONAL_DISCLAIMER}</p>
      </div>
    </motion.div>
  );
};
