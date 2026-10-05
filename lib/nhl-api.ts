import type {
  NhlApiScheduleResponse,
  NhlApiGame,
} from "@/types/nhl";
import type { Game, WeekSchedule } from "@/types/schedule";
import { teamMetaFor, ALL_TEAM_ABBREVS } from "@/lib/teams";
import { getFantasyWeek, addDays } from "@/lib/fantasy-week";
import { instantToFantasyDate } from "@/lib/timezone";
import { buildWeekSchedule, type TeamGamesInput } from "@/lib/schedule-calculations";

/**
 * Data-service layer. The rest of the app depends ONLY on the normalized
 * WeekSchedule returned by `getWeekSchedule`. To swap providers later,
 * implement a module with the same `ScheduleProvider` shape and point
 * `getWeekSchedule` at it; no UI changes required.
 */

const NHL_BASE = "https://api-web.nhle.com/v1";

export interface ScheduleProvider {
  /** Fetch raw games for a date range, inclusive, as normalized Game pairs. */
  fetchGames(startDate: string, endDate: string): Promise<Game[]>;
}

/** Only regular season (2) and playoffs (3) count for fantasy scheduling. */
function isCountedGame(g: NhlApiGame): boolean {
  return g.gameType === 2 || g.gameType === 3;
}

/**
 * Normalize one NHL API game into TWO team-attributed Game records (home+away).
 * The fantasy DAY is derived from the UTC start instant in the reference zone,
 * so the schedule never shifts due to UTC conversion.
 */
function normalizeGame(g: NhlApiGame): Game[] {
  const fantasyDate = instantToFantasyDate(g.startTimeUTC);
  const venue = g.venue?.default ?? null;
  const home = g.homeTeam.abbrev;
  const away = g.awayTeam.abbrev;
  const base = {
    id: g.id,
    date: fantasyDate,
    startTimeUTC: g.startTimeUTC,
    venue,
  };
  return [
    { ...base, teamAbbrev: home, opponent: away, isHome: true },
    { ...base, teamAbbrev: away, opponent: home, isHome: false },
  ];
}

/**
 * NHL provider using the public weekly schedule endpoint. The /schedule/{date}
 * endpoint returns a 7-day block starting on the given date's week; we query by
 * explicit dates and keep only games whose derived fantasy date is in range.
 */
export const nhlProvider: ScheduleProvider = {
  async fetchGames(startDate: string, endDate: string): Promise<Game[]> {
    // The weekly endpoint returns a block keyed off the requested date. We walk
    // in 7-day strides from startDate until we pass endDate, deduping by id.
    const collected = new Map<number, NhlApiGame>();
    let cursor = startDate;
    let guard = 0;
    while (cursor <= endDate && guard < 10) {
      guard++;
      const res = await fetch(`${NHL_BASE}/schedule/${cursor}`, {
        // Revalidate hourly; schedules change rarely but can be updated.
        next: { revalidate: 3600 },
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        throw new Error(`NHL API ${res.status} for ${cursor}`);
      }
      const data = (await res.json()) as NhlApiScheduleResponse;
      const days = data.gameWeek ?? [];
      for (const day of days) {
        for (const game of day.games) {
          if (isCountedGame(game)) collected.set(game.id, game);
        }
      }
      // Advance: prefer the API's own nextStartDate, else +7 days.
      const next = data.nextStartDate && data.nextStartDate > cursor
        ? data.nextStartDate
        : addDays(cursor, 7);
      cursor = next;
    }

    const games: Game[] = [];
    for (const g of collected.values()) {
      for (const ng of normalizeGame(g)) {
        if (ng.date >= startDate && ng.date <= endDate) games.push(ng);
      }
    }
    return games;
  },
};

/**
 * Public entry point: get the fully-built WeekSchedule for the fantasy week
 * containing `anyDate`. Also fetches the Saturday before the week so that a
 * Saturday+Sunday back-to-back straddling the boundary is detected.
 */
export async function getWeekSchedule(
  anyDate: string,
  provider: ScheduleProvider = nhlProvider,
): Promise<WeekSchedule> {
  const week = getFantasyWeek(anyDate);
  const priorSaturday = addDays(week.start, -1);

  // Fetch the week plus the prior Saturday in one range.
  const games = await provider.fetchGames(priorSaturday, week.end);

  // Split into in-week games and the prior-edge (Saturday) games per team.
  const byTeam = new Map<string, Game[]>();
  const priorEdgeByTeam = new Map<string, string>();
  for (const g of games) {
    if (g.date === priorSaturday) {
      // Track the team's last game date in the previous week (the Saturday).
      priorEdgeByTeam.set(g.teamAbbrev, g.date);
      continue;
    }
    if (!byTeam.has(g.teamAbbrev)) byTeam.set(g.teamAbbrev, []);
    byTeam.get(g.teamAbbrev)!.push(g);
  }

  // Build inputs for every known team (so 0-GP teams still render).
  const abbrevs = new Set<string>([...ALL_TEAM_ABBREVS, ...byTeam.keys()]);
  const teamInputs: TeamGamesInput[] = [...abbrevs].map((abbrev) => ({
    team: teamMetaFor(abbrev),
    weekGames: byTeam.get(abbrev) ?? [],
    priorEdgeDate: priorEdgeByTeam.get(abbrev) ?? null,
  }));

  return buildWeekSchedule(week.start, teamInputs);
}
