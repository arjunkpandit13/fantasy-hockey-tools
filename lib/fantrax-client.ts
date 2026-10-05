/** Shape returned by GET /api/fantrax/rosters (mirrors lib/integrations/fantrax). */
import type { RosterPlayer } from "@/lib/integrations/types";

export interface LeagueRostersResponse {
  leagueId: string;
  period: number | null;
  name: string;
  teams: {
    teamId: string;
    name: string;
    players: RosterPlayer[];
    unresolved: string[];
  }[];
}

/** Fetch the configured league's rosters through our server route. */
export async function fetchLeagueRosters(): Promise<LeagueRostersResponse> {
  const res = await fetch("/api/fantrax/rosters");
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data as LeagueRostersResponse;
}
