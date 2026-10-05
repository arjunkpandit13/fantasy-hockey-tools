/**
 * Tunable V1 constants. Everything here is meant to be changed without touching
 * component or calculation code.
 */

export const CONFIG = {
  /** An NHL date with this many games or fewer is an "off-night". */
  offNightMaxGames: 6,

  /** Streaming-score weights (see lib/streaming-score.ts). */
  streaming: {
    gpWeight: 2,
    offNightWeight: 1.5,
    /** Penalty applied per back-to-back set. */
    congestionPenaltyPerB2B: 1.5,
    /** Raw score that maps to 100 on the normalized scale. */
    scoreAt100: 11, // ~ max GP(4)*2 + OFF(something) headroom
  },

  /** Reference season for season-wide lookups / season-boundary clamping. */
  defaultSeason: 20262027,

  /**
   * Fantrax league integration. The league ID is NOT a secret (it is public in
   * the league URL), so it is safe to ship here; an env var overrides it for
   * other deployments. No userSecretId is used — the roster overlay works from
   * the league's own team list via a picker.
   */
  fantrax: {
    leagueId: process.env.FANTRAX_LEAGUE_ID || "g0m6jyadmq2th10b",
    /** Default team to show first (matched by name substring, case-insensitive). */
    defaultTeamNameHint: "Arjun",
  },
} as const;
