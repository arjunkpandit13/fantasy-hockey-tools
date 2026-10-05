// Normalized, UI-facing domain model. These are provider-agnostic:
// the data-service layer maps any provider's raw payload into these shapes,
// so the UI never depends on NHL API specifics.

export type Conference = "Eastern" | "Western";
export type Division =
  | "Atlantic"
  | "Metropolitan"
  | "Central"
  | "Pacific";

export interface TeamMeta {
  abbrev: string;
  name: string; // full name, e.g. "Toronto Maple Leafs"
  placeName: string; // e.g. "Toronto"
  commonName: string; // e.g. "Maple Leafs"
  conference: Conference;
  division: Division;
  logo: string; // light-mode SVG URL
}

export interface Game {
  id: number;
  /** Fantasy calendar date this game belongs to ("YYYY-MM-DD", Eastern-anchored). */
  date: string;
  startTimeUTC: string;
  opponent: string; // opponent abbrev
  isHome: boolean;
  venue: string | null;
  teamAbbrev: string; // the team this game is attributed to
}

/** One team's games for a single fantasy week, with derived metrics. */
export interface TeamWeekSchedule {
  team: TeamMeta;
  /** Map of "YYYY-MM-DD" -> games that day for this team (usually 0 or 1). */
  gamesByDate: Record<string, Game[]>;
  games: Game[]; // flat, sorted by date/time
  gp: number; // games played in the fantasy week
  offNightGames: number;
  b2bSets: number;
  streamScore: number; // 0-100
  /** Dates ("YYYY-MM-DD") that are the second leg of a back-to-back. */
  secondLegDates: string[];
}

/** The whole league's schedule for one fantasy week. */
export interface WeekSchedule {
  weekStart: string; // Sunday "YYYY-MM-DD"
  weekEnd: string; // Saturday "YYYY-MM-DD"
  dates: string[]; // 7 dates Sun..Sat
  /** total NHL games per date across the league */
  slate: Record<string, number>;
  offNights: string[]; // dates flagged as off-nights
  teams: TeamWeekSchedule[];
}

export interface ScheduleError {
  error: string;
}
