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
import { EDUCATIONAL_DISCLAIMER } from '../character/fieldGuide';
import { loadMastery, getMasteryCounts } from '../learning/mastery';
import { getSessionCounts, loadSessionHistory } from '../learning/sessions';
import { calculateProgressComparison } from '../learning/progress';
import { loadPreferences } from '../prefs/prefs';
import { buildShareText } from '../learning/share';
import { LeaderboardView } from './stats/LeaderboardView';
import { AnalysisView } from './stats/AnalysisView';
import type { SessionSummaryProps } from './stats/SessionSummary';

export interface StatsScreenProps {
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
    typeof window !== 'undefined' && window.location.hash === '#analysis'
      ? 'analysis'
      : 'leaderboard'
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
  const allRecordedEntries: LeaderboardEntry[] = SESSION_LENGTHS.flatMap(
    (len) => allBoards[len] || []
  );
  const allTodaysEntries: LeaderboardEntry[] = SESSION_LENGTHS.flatMap((len) =>
    todaysEntries(allBoards[len] || [])
  );
  const totalGamesCount = allRecordedEntries.length;
  const todaysGamesCount = allTodaysEntries.length;
  const avgCommunityAccuracy =
    allRecordedEntries.length > 0
      ? Math.round(
          allRecordedEntries.reduce((acc, e) => acc + e.accuracy, 0) / allRecordedEntries.length
        )
      : null;
  const maxCommunityStreak =
    allRecordedEntries.length > 0 ? Math.max(...allRecordedEntries.map((e) => e.bestStreak)) : 0;

  const ownLengthTodays = todaysEntries(allBoards[roundsTarget] || []);
  const standing =
    difficulty && hasPlayedSession ? roomStanding(ownLengthTodays, difficulty, stats.score) : null;
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

  const sessionSummaryProps: SessionSummaryProps | undefined = hasPlayedSession
    ? {
        stats,
        difficulty,
        roundsTarget,
        isCompletedSession,
        accuracy,
        tellAccuracy,
        calibrationScore,
        rank,
        closingLineText: closingLine(rank.title),
        progressComparison,
        tellAnalysis,
        categoryBreakdown,
        conceptsSeen,
        highConfidenceMisses,
        showNudge,
        nextTier,
        onPracticeTell,
        onReplayMissed,
        onStartRound,
      }
    : undefined;

  return (
    <motion.div
      data-testid="stats-root"
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
                <span className="text-signal font-mono text-xs uppercase tracking-[0.2em]">
                  Stall Central
                </span>
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
            <div className="flex items-center bg-panel border border-control-line p-1 font-mono text-xs">
              <button
                type="button"
                onClick={() => setViewMode('leaderboard')}
                className={`px-3 py-1.5 transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'leaderboard'
                    ? 'bg-signal text-ink font-600 shadow-sm'
                    : 'text-muted hover:text-paper'
                }`}
              >
                <span>Leaderboard</span>
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
                <span>View analysis</span>
              </button>
            </div>

            {hasPlayedSession && (
              <button
                type="button"
                onClick={handleShareResult}
                className="px-3 py-2 bg-panel border border-control-line text-signal hover:text-paper hover:border-signal transition-colors font-mono text-xs uppercase tracking-wider cursor-pointer min-h-10"
                title="Copy private, non-identifying session summary"
              >
                {copiedShare ? 'Copied' : 'Share Result'}
              </button>
            )}

            {viewMode === 'leaderboard' && (
              <button
                type="button"
                onClick={() => downloadLeaderboardAsText(board, activeLength)}
                className="px-3 py-2 bg-panel border border-control-line text-muted hover:text-paper transition-colors font-mono text-xs uppercase tracking-wider cursor-pointer min-h-10"
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
          <div
            data-testid="share-privacy-note"
            className="w-full text-right text-[11px] font-mono text-muted -mt-3"
          >
            This share text contains: score, accuracy, calibration —{' '}
            {showNameInShare ? playerName?.trim() : 'no name'}
          </div>
        )}

        {/* VIEW 1: LEADERBOARD VIEW */}
        {viewMode === 'leaderboard' && (
          <LeaderboardView
            activeLength={activeLength}
            setActiveLength={setActiveLength}
            filterMode={filterMode}
            setFilterMode={setFilterMode}
            sortView={sortView}
            setSortView={setSortView}
            standing={standing}
            difficulty={difficulty}
            entriesToDisplay={entriesToDisplay}
            formatDate={formatDate}
            onPlayAgain={onPlayAgain}
          />
        )}

        {/* VIEW 2: ANALYSIS VIEW */}
        {viewMode === 'analysis' && (
          <AnalysisView
            hasPlayedSession={hasPlayedSession}
            onBackToLeaderboard={() => setViewMode('leaderboard')}
            sessionSummaryProps={sessionSummaryProps}
            sessionCounts={sessionCounts}
            todaysGamesCount={todaysGamesCount}
            totalGamesCount={totalGamesCount}
            avgCommunityAccuracy={avgCommunityAccuracy}
            maxCommunityStreak={maxCommunityStreak}
            masteryCounts={masteryCounts}
            onPlayAgain={onPlayAgain}
          />
        )}
      </div>

      {/* Print-only Takeaway */}
      <div className="print-takeaway">
        <h1
          style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '28px', marginBottom: '4px' }}
        >
          Real or AI? &mdash; Session Takeaway
        </h1>
        {showNameInShare && (
          <p style={{ fontSize: '14px', marginBottom: '4px', fontWeight: 600 }}>
            Player: {playerName?.trim()}
          </p>
        )}
        <p
          className="print-rule"
          style={{
            borderBottom: '1px solid',
            paddingBottom: '8px',
            marginBottom: '12px',
            fontSize: '13px',
          }}
        >
          {difficulty ? `${difficulty} tier` : 'Session'} &middot; {roundsTarget} questions &middot;{' '}
          {rank.title}
        </p>
        <p style={{ fontSize: '11px', color: '#666', marginBottom: '8px' }}>
          {showNameInShare
            ? 'Player name included per device preferences.'
            : 'Private takeaway: no player name included.'}
        </p>
        <p style={{ fontSize: '12px', marginTop: '12px' }}>{EDUCATIONAL_DISCLAIMER}</p>
      </div>
    </motion.div>
  );
};
