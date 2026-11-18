import React from 'react';
import type { Stats } from '../../game/scoring';
import type { SessionMode } from '../../data/types';
import type { SessionLength } from '../../leaderboard/leaderboard';
import type { ProgressComparison } from '../../learning/progress';
import type { RoundResult } from '../../learning/types';
import { CONCEPT_DEFINITIONS, getConceptDetail } from '../../character/fieldGuide';
import { StatCard } from './StatCard';

export interface SessionSummaryProps {
  stats: Stats;
  difficulty: SessionMode | null;
  roundsTarget: SessionLength;
  isCompletedSession: boolean;
  accuracy: number;
  tellAccuracy: number;
  calibrationScore: number;
  rank: { title: string; note: string };
  closingLineText: string;
  progressComparison: ProgressComparison | null;
  tellAnalysis: {
    strongest: { concept: string; accuracy: number } | null;
    weakest: { concept: string; accuracy: number } | null;
  };
  categoryBreakdown: { category: string; total: number; correct: number; pct: number }[];
  conceptsSeen: string[];
  highConfidenceMisses: RoundResult[];
  showNudge: boolean | null;
  nextTier: SessionMode | null;
  onPracticeTell?: (concept: string) => void;
  onReplayMissed?: () => void;
  onStartRound: (mode: SessionMode) => void;
}

export const SessionSummary: React.FC<SessionSummaryProps> = ({
  stats,
  difficulty,
  roundsTarget,
  isCompletedSession,
  accuracy,
  tellAccuracy,
  calibrationScore,
  rank,
  closingLineText,
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
}) => {
  return (
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
            &ldquo;{closingLineText}&rdquo;
          </p>
        </div>

        {/* Enhanced 5-Metric Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-center">
          <StatCard label="Score" value={stats.score} subtext="points" valueColor="text-good" />
          <StatCard
            label="Source Acc."
            value={`${accuracy}%`}
            subtext={`${stats.correctCount} of ${stats.roundsPlayed}`}
            valueColor="text-signal"
          />
          <StatCard
            label="Tell Acc."
            value={`${tellAccuracy}%`}
            subtext={`${stats.tellCorrectCount ?? 0} identified`}
            valueColor="text-paper"
          />
          <StatCard
            label="Calibration"
            value={`${calibrationScore}%`}
            subtext="conviction align"
            valueColor="text-good"
          />
          <StatCard
            label="Streak"
            value={stats.bestStreak}
            subtext="consecutive"
            valueColor="text-signal"
          />
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
                <div
                  key={b.category}
                  className="bg-ink p-2.5 border border-panel-line flex items-center justify-between"
                >
                  <span className="text-paper">{b.category}:</span>
                  <span className="text-signal font-600">
                    {b.pct}% ({b.correct}/{b.total})
                  </span>
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
              Calibration review: high-confidence misses ({highConfidenceMisses.length})
            </span>
            <p className="text-xs text-muted leading-relaxed font-body mb-2">
              You answered with high confidence but were misled by ambiguous cues. Reviewing
              counterexamples is the most effective way to calibrate judgment:
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
                Try the {nextTier} tier &rarr;
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
