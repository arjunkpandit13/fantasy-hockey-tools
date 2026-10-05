/**
 * Fantasy-platform integration seam (V2+).
 *
 * V1 is schedule-only. This interface exists so Fantrax / Yahoo / ESPN roster
 * import can be added later WITHOUT touching the schedule UI or the week logic:
 * a platform adapter implements `FantasyPlatformProvider`, and the Streamer
 * Finder consumes only this normalized shape. No adapter is wired into the app
 * yet — see `fantrax.ts` for a documented, intentionally-unimplemented stub.
 */

export type FantasySport = "NHL"; // only NHL is in scope for this product

/** A fantasy league the user belongs to on some platform. */
export interface FantasyLeague {
  platform: FantasyPlatformId;
  leagueId: string;
  name: string;
  /** Teams the authenticated user owns in this league. */
  ownedTeams: { teamId: string; name: string }[];
}

/** One roster slot resolved to an NHL team (what the schedule tools need). */
export interface RosterPlayer {
  playerId: string;
  name: string;
  /** NHL team abbreviation, used to join to our WeekSchedule. */
  nhlTeamAbbrev: string;
  positions: string[];
  status: string | null;
}

export interface FantasyRoster {
  leagueId: string;
  teamId: string;
  players: RosterPlayer[];
}

export type FantasyPlatformId = "fantrax" | "yahoo" | "espn";

/**
 * The contract every platform adapter implements. Credentials are passed per
 * call (never stored in the client); adapters run server-side only.
 */
export interface FantasyPlatformProvider {
  readonly id: FantasyPlatformId;

  /** List the user's leagues. `credential` is platform-specific (e.g. Fantrax userSecretId). */
  listLeagues(credential: string, sport: FantasySport): Promise<FantasyLeague[]>;

  /** Fetch one team's roster, normalized with NHL team abbreviations attached. */
  getRoster(
    leagueId: string,
    teamId: string,
    opts?: { period?: number },
  ): Promise<FantasyRoster>;
}

/** Error thrown by adapters so the UI can show a consistent integration-failure state. */
export class FantasyPlatformError extends Error {
  constructor(
    public readonly platform: FantasyPlatformId,
    message: string,
  ) {
    super(message);
    this.name = "FantasyPlatformError";
  }
}
