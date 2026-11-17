import React from 'react';
import { motion } from 'framer-motion';
import { EDUCATIONAL_DISCLAIMER } from '../../character/fieldGuide';
import { SignalAvatar } from '../SignalAvatar';
import { SessionSummary, type SessionSummaryProps } from './SessionSummary';
import { StatCard } from './StatCard';

export interface AnalysisViewProps {
  hasPlayedSession: boolean;
  onBackToLeaderboard: () => void;
  sessionSummaryProps?: SessionSummaryProps;
  sessionCounts: { completed: number; abandoned: number; total: number };
  todaysGamesCount: number;
  totalGamesCount: number;
  avgCommunityAccuracy: number | null;
  maxCommunityStreak: number;
  masteryCounts: {
    mastered: number;
    familiar: number;
    practicing: number;
    shaky: number;
    new: number;
  };
  onPlayAgain: () => void;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({
  hasPlayedSession,
  onBackToLeaderboard,
  sessionSummaryProps,
  sessionCounts,
  todaysGamesCount,
  totalGamesCount,
  avgCommunityAccuracy,
  maxCommunityStreak,
  masteryCounts,
  onPlayAgain,
}) => {
  return (
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
          <h2 className="font-display text-2xl text-paper mt-0.5">
            Performance &amp; Concept Breakdown
          </h2>
        </div>
        <button
          type="button"
          onClick={onBackToLeaderboard}
          className="px-4 py-2 bg-ink border border-panel-line text-signal hover:text-paper hover:border-signal font-mono text-xs uppercase tracking-wider cursor-pointer transition-colors flex items-center gap-1.5"
        >
          <span>&larr;</span>
          <span>Back to Leaderboard [Esc]</span>
        </button>
      </div>

      {/* Individual Session Results */}
      {hasPlayedSession && sessionSummaryProps ? (
        <SessionSummary {...sessionSummaryProps} />
      ) : (
        <div className="bg-panel border border-panel-line p-6 text-center">
          <SignalAvatar mood="neutral" size={44} className="mx-auto mb-2 opacity-80" />
          <h3 className="text-paper font-display text-lg">No Active Session In Memory</h3>
          <p className="text-muted text-xs font-mono max-w-md mx-auto mt-1">
            Start a round from the landing page to evaluate your calibration and accuracy across AI
            literacy tells.
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
          <StatCard
            label="Completed"
            value={sessionCounts.completed}
            valueColor="text-good"
            className="!bg-panel"
          />
          <StatCard
            label="Abandoned"
            value={sessionCounts.abandoned}
            valueColor="text-bad"
            className="!bg-panel"
          />
          <StatCard
            label="Today's Runs"
            value={todaysGamesCount}
            valueColor="text-paper"
            className="!bg-panel"
          />
          <StatCard
            label="All-Time Runs"
            value={totalGamesCount}
            valueColor="text-paper"
            className="!bg-panel"
          />
          <StatCard
            label="Avg Accuracy"
            value={avgCommunityAccuracy !== null ? `${avgCommunityAccuracy}%` : 'N/A'}
            valueColor="text-signal"
            className="!bg-panel"
          />
          <StatCard
            label="Best Streak"
            value={maxCommunityStreak}
            valueColor="text-good"
            className="!bg-panel"
          />
          <StatCard
            label="Mastered Tells"
            value={masteryCounts.mastered}
            valueColor="text-signal"
            className="!bg-panel"
          />
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
  );
};
