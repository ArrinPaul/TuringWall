import type { SessionMode } from '../data/types';

export interface BuildShareTextParams {
  difficulty: SessionMode | null;
  roundsPlayed: number;
  score: number;
  accuracy: number;
  calibration: number;
  rankTitle: string;
  playerName?: string;
  showNameOnLeaderboard: boolean;
}

export function buildShareText(params: BuildShareTextParams): string {
  const nameLine =
    params.showNameOnLeaderboard && params.playerName?.trim()
      ? `Player: ${params.playerName.trim()}\n`
      : '';
  const tierLine = params.difficulty ? `${params.difficulty.toUpperCase()} tier` : 'Practice';
  return `TuringWall: Real or AI?\n${nameLine}${tierLine} · ${params.roundsPlayed} questions\nScore: ${params.score} pts · Accuracy: ${params.accuracy}% · Calibration: ${params.calibration}%\nRank: ${params.rankTitle}\nhttps://turing-wall.vercel.app/`;
}
