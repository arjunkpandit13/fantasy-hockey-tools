// Raw shapes from the NHL public API (api-web.nhle.com).
// Only the fields we consume are modeled.

export interface NhlApiTeam {
  id: number;
  abbrev: string;
  commonName?: { default: string };
  placeName?: { default: string };
  logo?: string;
  darkLogo?: string;
}

export interface NhlApiGame {
  id: number;
  season: number;
  gameType: number;
  gameDate?: string; // local calendar date for the game ("YYYY-MM-DD") on season endpoint
  startTimeUTC: string; // ISO instant
  easternUTCOffset?: string; // e.g. "-04:00"
  venueUTCOffset?: string;
  venueTimezone?: string;
  venue?: { default: string };
  neutralSite?: boolean;
  gameState?: string;
  awayTeam: NhlApiTeam;
  homeTeam: NhlApiTeam;
}

export interface NhlApiGameWeekDay {
  date: string; // "YYYY-MM-DD"
  dayAbbrev: string;
  numberOfGames: number;
  games: NhlApiGame[];
}

export interface NhlApiScheduleResponse {
  nextStartDate?: string;
  previousStartDate?: string;
  gameWeek?: NhlApiGameWeekDay[];
}
