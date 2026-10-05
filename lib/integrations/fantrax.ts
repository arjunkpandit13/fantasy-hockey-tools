/**
 * Fantrax adapter (V2+ stub — NOT wired into the app).
 *
 * The Fantrax REST API (v1.8 Beta) is documented in `docs/fantrax-api.md`. This
 * file records exactly how that API maps onto the `FantasyPlatformProvider`
 * contract, so the roster-import / Streamer Finder work (spec §26/§27) is a
 * fill-in rather than a redesign. The methods intentionally throw: V1 ships no
 * live Fantrax calls, and a half-wired integration would be worse than an
 * explicit "not implemented".
 *
 * When implementing:
 *   - All calls hit `https://www.fantrax.com/fxea/general/<endpoint>` (JSON).
 *   - `userSecretId` is the per-user credential for `getLeagues`; keep it
 *     server-side only (never the client bundle or URL), exactly like the
 *     existing `/api/schedule/[date]` route keeps fetching on the server.
 *   - Resolve each roster player's NHL team via getLeagueInfo's playerInfo /
 *     getPlayerIds, then join to our WeekSchedule by `nhlTeamAbbrev`.
 *   - Fantrax "periods" are league-defined date ranges (getLeagueInfo
 *     rosterPeriods/scoringPeriods); do NOT assume they align with our fixed
 *     Sunday-Saturday fantasy week — map via their {startDate,endDate}.
 */

import type {
  FantasyPlatformProvider,
  FantasyLeague,
  FantasyRoster,
  FantasySport,
} from "@/lib/integrations/types";
import { FantasyPlatformError } from "@/lib/integrations/types";

const FANTRAX_BASE = "https://www.fantrax.com/fxea/general";
const NOT_IMPLEMENTED =
  "Fantrax integration is a V2 feature and is not implemented in V1. " +
  "See docs/fantrax-api.md.";

export const fantraxProvider: FantasyPlatformProvider = {
  id: "fantrax",

  async listLeagues(
    _credential: string,
    _sport: FantasySport,
  ): Promise<FantasyLeague[]> {
    // V2: GET `${FANTRAX_BASE}/getLeagues?userSecretId=<credential>`
    // -> map each league + ownedTeams into FantasyLeague[].
    void FANTRAX_BASE;
    throw new FantasyPlatformError("fantrax", NOT_IMPLEMENTED);
  },

  async getRoster(
    _leagueId: string,
    _teamId: string,
    _opts?: { period?: number },
  ): Promise<FantasyRoster> {
    // V2: GET `${FANTRAX_BASE}/getTeamRosters?leagueId=<id>&period=<n>`
    // + getLeagueInfo/getPlayerIds to attach nhlTeamAbbrev per player.
    throw new FantasyPlatformError("fantrax", NOT_IMPLEMENTED);
  },
};
