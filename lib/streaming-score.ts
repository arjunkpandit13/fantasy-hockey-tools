import { CONFIG } from "@/lib/config";

export interface StreamScoreInputs {
  gp: number;
  offNightGames: number;
  b2bSets: number;
}

/**
 * Raw, schedule-only streaming score. Evaluates SCHEDULE QUALITY, not player
 * skill. Formula lives here (not in the UI) so weights are trivially tunable.
 *
 *   raw = GP*gpWeight + OFF*offNightWeight - b2bSets*congestionPenalty
 */
export function rawStreamScore(i: StreamScoreInputs): number {
  const { gpWeight, offNightWeight, congestionPenaltyPerB2B } = CONFIG.streaming;
  return (
    i.gp * gpWeight +
    i.offNightGames * offNightWeight -
    i.b2bSets * congestionPenaltyPerB2B
  );
}

/** Normalize the raw score onto a 0-100 scale, clamped. */
export function normalizeStreamScore(raw: number): number {
  const { scoreAt100 } = CONFIG.streaming;
  const pct = (raw / scoreAt100) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

export function streamScore(i: StreamScoreInputs): number {
  return normalizeStreamScore(rawStreamScore(i));
}
