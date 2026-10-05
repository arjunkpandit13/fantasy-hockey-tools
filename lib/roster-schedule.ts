/**
 * Roster schedule strength — pure, testable logic.
 *
 * Given a fantasy team's roster (players resolved to NHL teams) and a
 * WeekSchedule (our Sunday–Saturday fantasy week), compute how good that
 * roster's SCHEDULE is: how many player-games land in the week, how many fall
 * on off-nights, back-to-back exposure, and a 0–100 roster schedule score.
 *
 * "Player-games" counts a game once per rostered player on the playing team —
 * two of your players on the same team playing the same night is two slots you
 * can start, which is the fantasy-relevant quantity. This evaluates SCHEDULE
 * only, never player skill (same disclaimer as the team streaming score).
 *
 * No UI, no fetching — this is consumed by the API route and the My Team view.
 */

import type { WeekSchedule, TeamWeekSchedule } from "@/types/schedule";
import type { RosterPlayer } from "@/lib/integrations/types";

export interface RosterPlayerSchedule {
  player: RosterPlayer;
  /** The player's NHL team's week schedule, or null if not matched to the slate. */
  teamWeek: TeamWeekSchedule | null;
  gp: number; // games the player's team plays this week
  offNightGames: number;
  b2bSets: number;
}

export interface RosterWeekStrength {
  teamId: string;
  teamName: string;
  /** Per-player breakdown (unmatched players kept, with gp 0, so nothing hides). */
  players: RosterPlayerSchedule[];
  playerCount: number;
  /** Rostered players we could not match to an NHL team on the slate. */
  unmatchedCount: number;
  /** Σ games across all rostered players (the start-slots the schedule offers). */
  totalPlayerGames: number;
  /** Σ games landing on off-nights (easier to slot without clogging a busy night). */
  offNightPlayerGames: number;
  /** Σ back-to-back sets across the roster (fatigue / goalie-rest risk). */
  totalB2BSets: number;
  /** Average games per player this week (density of the roster's slate). */
  avgGamesPerPlayer: number;
  /** 0–100 roster schedule score (higher = better fantasy week). */
  score: number;
  /** Per-date player-game counts: how many of your players play each day. */
  perDate: Record<string, number>;
}

/**
 * Score a roster's schedule on 0–100. Rewards volume (player-games) and
 * off-night games (easier to stream into lineups), lightly penalizes b2b
 * congestion. Weights kept here so they are easy to tune and are the only
 * place the formula lives.
 */
const WEIGHTS = {
  perPlayerGame: 1,
  perOffNightGame: 0.6,
  perB2B: -0.25,
  /** Raw points-per-player that maps to 100 (≈ a loaded 4-game, off-night-rich week). */
  scoreAt100PerPlayer: 4.2,
} as const;

function scoreRoster(
  totalPlayerGames: number,
  offNightPlayerGames: number,
  totalB2BSets: number,
  playerCount: number,
): number {
  if (playerCount === 0) return 0;
  const raw =
    totalPlayerGames * WEIGHTS.perPlayerGame +
    offNightPlayerGames * WEIGHTS.perOffNightGame +
    totalB2BSets * WEIGHTS.perB2B;
  const perPlayer = raw / playerCount;
  const normalized = (perPlayer / WEIGHTS.scoreAt100PerPlayer) * 100;
  return Math.max(0, Math.min(100, Math.round(normalized)));
}

/** Compute one fantasy team's roster schedule strength for a given week. */
export function computeRosterStrength(
  teamId: string,
  teamName: string,
  players: RosterPlayer[],
  week: WeekSchedule,
): RosterWeekStrength {
  const byAbbrev = new Map(week.teams.map((t) => [t.team.abbrev, t]));
  const perDate: Record<string, number> = {};
  for (const d of week.dates) perDate[d] = 0;

  const rows: RosterPlayerSchedule[] = [];
  let totalPlayerGames = 0;
  let offNightPlayerGames = 0;
  let totalB2BSets = 0;
  let unmatchedCount = 0;

  for (const player of players) {
    const tw = byAbbrev.get(player.nhlTeamAbbrev) ?? null;
    if (!tw) {
      unmatchedCount += 1;
      rows.push({ player, teamWeek: null, gp: 0, offNightGames: 0, b2bSets: 0 });
      continue;
    }
    totalPlayerGames += tw.gp;
    offNightPlayerGames += tw.offNightGames;
    totalB2BSets += tw.b2bSets;
    for (const g of tw.games) {
      if (g.date in perDate) perDate[g.date] = (perDate[g.date] ?? 0) + 1;
    }
    rows.push({
      player,
      teamWeek: tw,
      gp: tw.gp,
      offNightGames: tw.offNightGames,
      b2bSets: tw.b2bSets,
    });
  }

  const playerCount = players.length;
  const matched = playerCount - unmatchedCount;
  return {
    teamId,
    teamName,
    players: rows.sort((a, b) => b.gp - a.gp),
    playerCount,
    unmatchedCount,
    totalPlayerGames,
    offNightPlayerGames,
    totalB2BSets,
    avgGamesPerPlayer: matched > 0 ? totalPlayerGames / matched : 0,
    score: scoreRoster(totalPlayerGames, offNightPlayerGames, totalB2BSets, matched),
    perDate,
  };
}

/** Rank all fantasy teams' rosters by schedule score (best first). */
export function rankRosterStrength(
  rosters: { teamId: string; teamName: string; players: RosterPlayer[] }[],
  week: WeekSchedule,
): RosterWeekStrength[] {
  return rosters
    .map((r) => computeRosterStrength(r.teamId, r.teamName, r.players, week))
    .sort((a, b) => b.score - a.score || b.totalPlayerGames - a.totalPlayerGames);
}
