import React from 'react';
import { motion } from 'framer-motion';
import {
  SESSION_LENGTHS,
  type SessionLength,
  type LeaderboardEntry,
  type LeaderboardSortView,
  type RoomStanding,
} from '../../leaderboard/leaderboard';
import type { SessionMode } from '../../data/types';
import { SignalAvatar } from '../SignalAvatar';

export interface LeaderboardViewProps {
  activeLength: SessionLength;
  setActiveLength: (len: SessionLength) => void;
  filterMode: 'today' | 'all';
  setFilterMode: (mode: 'today' | 'all') => void;
  sortView: LeaderboardSortView;
  setSortView: (view: LeaderboardSortView) => void;
  standing: RoomStanding | null;
  difficulty: SessionMode | null;
  entriesToDisplay: LeaderboardEntry[];
  formatDate: (ts: number) => string;
  onPlayAgain: () => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  activeLength,
  setActiveLength,
  filterMode,
  setFilterMode,
  sortView,
  setSortView,
  standing,
  difficulty,
  entriesToDisplay,
  formatDate,
  onPlayAgain,
}) => {
  return (
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
          <span className="text-muted text-xs font-mono uppercase tracking-wider shrink-0 mr-1">
            Board:
          </span>
          {SESSION_LENGTHS.map((len) => (
            <button
              key={len}
              type="button"
              onClick={() => setActiveLength(len)}
              className={`min-h-10 px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer shrink-0 ${
                activeLength === len
                  ? 'bg-signal text-ink font-600'
                  : 'bg-ink/50 text-muted hover:text-paper border border-control-line'
              }`}
            >
              {len} Questions
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-ink border border-control-line p-0.5 font-mono text-xs">
            <button
              type="button"
              onClick={() => setFilterMode('today')}
              className={`min-h-10 px-3 py-1 transition-colors cursor-pointer ${
                filterMode === 'today'
                  ? 'bg-signal text-ink font-600'
                  : 'text-muted hover:text-paper'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`min-h-10 px-3 py-1 transition-colors cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-signal text-ink font-600'
                  : 'text-muted hover:text-paper'
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
                : 'bg-ink/60 border-control-line text-muted hover:text-paper'
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
            Your session scored higher than <strong className="text-good">{standing.beaten}</strong>{' '}
            of <strong className="text-paper">{standing.total}</strong> players today in{' '}
            {difficulty} tier (
            {Math.round((standing.beaten / Math.max(1, standing.total)) * 100)}th percentile).
          </span>
          <span className="text-signal uppercase text-[11px] font-600 shrink-0">
            Local Kiosk Record
          </span>
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
                        <td
                          className="px-4 py-2.5 text-paper font-500 max-w-[12rem] truncate"
                          title={entry.name}
                        >
                          {entry.name}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="px-1.5 py-0.5 bg-ink text-muted border border-panel-line text-[10px] uppercase">
                            {entry.difficulty}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-600 text-signal">
                          {entry.score}
                        </td>
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

            {/* Mobile Card View */}
            <div className="sm:hidden divide-y divide-panel-line/60 font-mono">
              {entriesToDisplay.map((entry, index) => (
                <div key={`${entry.name}-${entry.timestamp}`} className="p-3.5 space-y-2 text-left">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-600 text-signal">#{index + 1}</span>
                      <span className="text-paper font-500 text-sm">{entry.name}</span>
                    </div>
                    <span className="text-signal font-600 text-sm">{entry.score} pts</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span className="uppercase text-[10px] px-1 bg-ink border border-panel-line">
                      {entry.difficulty}
                    </span>
                    <span>Acc: {entry.accuracy}%</span>
                    <span>Cal: {entry.calibration ?? entry.accuracy}%</span>
                    <span>Streak: {entry.bestStreak}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="py-12 px-6 text-center text-muted">
            <SignalAvatar mood="neutral" size={40} className="mx-auto mb-2 opacity-60" />
            <p className="text-paper text-sm">
              No recorded runs on the {activeLength}-question board yet.
            </p>
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
          Leaderboard scores and player aliases are preserved in your browser's local sandbox. No
          private credentials or personal data are collected. Playing as &ldquo;Anonymous&rdquo;
          keeps your session unlinked.
        </p>
      </div>
    </motion.div>
  );
};
