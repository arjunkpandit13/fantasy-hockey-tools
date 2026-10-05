import type { Game, TeamMeta, TeamWeekSchedule, WeekSchedule } from "@/types/schedule";
import { CONFIG } from "@/lib/config";
import { getFantasyWeek, addDays } from "@/lib/fantasy-week";
import { streamScore } from "@/lib/streaming-score";

/**
 * Compute the league-wide slate: total games per date across all teams.
 * `games` is the flat set of team-attributed games; each real game appears
 * twice (once per team), so we de-duplicate by game id per date.
 */
export function computeSlate(games: Game[], dates: string[]): Record<string, number> {
  const seen: Record<string, Set<number>> = {};
  for (const d of dates) seen[d] = new Set();
  for (const g of games) {
    const bucket = seen[g.date];
    if (bucket) bucket.add(g.id);
  }
  const slate: Record<string, number> = {};
  for (const d of dates) slate[d] = seen[d]?.size ?? 0;
  return slate;
}

/** Dates whose slate is at or below the off-night threshold. */
export function computeOffNights(
  slate: Record<string, number>,
  dates: string[],
  maxGames: number = CONFIG.offNightMaxGames,
): string[] {
  return dates.filter((d) => (slate[d] ?? 0) > 0 && (slate[d] ?? 0) <= maxGames);
}

/**
 * Count back-to-back SETS for a team given its game dates. A B2B set is two
 * games on consecutive calendar dates. We also accept a `priorEdgeDate`: the
 * team's last game date in the PREVIOUS fantasy week, so a Saturday+Sunday pair
 * straddling the week boundary is still detected (the Sunday game counts as the
 * second half of a B2B for this week).
 */
export function countB2BSets(
  gameDates: string[],
  priorEdgeDate: string | null,
): number {
  const sorted = [...new Set(gameDates)].sort();
  let sets = 0;
  // Cross-boundary: previous week's last game immediately before this week's first.
  if (priorEdgeDate && sorted.length > 0 && sorted[0] === addDays(priorEdgeDate, 1)) {
    sets += 1;
  }
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]!;
    const cur = sorted[i]!;
    if (cur === addDays(prev, 1)) sets += 1;
  }
  return sets;
}

/** Which of a team's games are the SECOND leg of a B2B (for subtle UI highlight). */
export function secondLegDates(
  gameDates: string[],
  priorEdgeDate: string | null,
): Set<string> {
  const sorted = [...new Set(gameDates)].sort();
  const out = new Set<string>();
  if (priorEdgeDate && sorted.length > 0 && sorted[0] === addDays(priorEdgeDate, 1)) {
    out.add(sorted[0]!);
  }
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]!;
    const cur = sorted[i]!;
    if (cur === addDays(prev, 1)) out.add(cur);
  }
  return out;
}

export interface TeamGamesInput {
  team: TeamMeta;
  weekGames: Game[]; // games within the fantasy week (dates Sun..Sat)
  priorEdgeDate: string | null; // last game date in the previous week, if any
}

/**
 * Build a TeamWeekSchedule with all derived metrics for one team.
 */
export function buildTeamWeek(
  input: TeamGamesInput,
  dates: string[],
  offNights: Set<string>,
): TeamWeekSchedule {
  const games = [...input.weekGames].sort((a, b) =>
    a.date === b.date ? a.startTimeUTC.localeCompare(b.startTimeUTC) : a.date.localeCompare(b.date),
  );
  const gamesByDate: Record<string, Game[]> = {};
  for (const d of dates) gamesByDate[d] = [];
  for (const g of games) {
    (gamesByDate[g.date] ??= []).push(g);
  }

  const gameDates = games.map((g) => g.date);
  const gp = games.length;
  const offNightGames = games.filter((g) => offNights.has(g.date)).length;
  const b2bSets = countB2BSets(gameDates, input.priorEdgeDate);
  const secondLegs = secondLegDates(gameDates, input.priorEdgeDate);
  const score = streamScore({ gp, offNightGames, b2bSets });

  return {
    team: input.team,
    gamesByDate,
    games,
    gp,
    offNightGames,
    b2bSets,
    streamScore: score,
    secondLegDates: [...secondLegs],
  };
}

/**
 * Assemble a full WeekSchedule from per-team games. `weekStartDate` is any date
 * in the target week; it is normalized to the Sunday internally.
 */
export function buildWeekSchedule(
  weekStartDate: string,
  teamInputs: TeamGamesInput[],
): WeekSchedule {
  const week = getFantasyWeek(weekStartDate);
  const allGames = teamInputs.flatMap((t) => t.weekGames);
  const slate = computeSlate(allGames, week.dates);
  const offNightList = computeOffNights(slate, week.dates);
  const offNightSet = new Set(offNightList);

  const teams = teamInputs
    .map((t) => buildTeamWeek(t, week.dates, offNightSet))
    .filter((t) => t.gp > 0 || true); // keep all teams, even 0-GP, for completeness

  return {
    weekStart: week.start,
    weekEnd: week.end,
    dates: week.dates,
    slate,
    offNights: offNightList,
    teams,
  };
}
