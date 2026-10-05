/**
 * Fantrax adapter (live).
 *
 * Implements the `FantasyPlatformProvider` contract against the Fantrax REST
 * API (v1.8 Beta, documented in `docs/fantrax-api.md`). Runs SERVER-SIDE ONLY
 * (called from /api/fantrax/* route handlers) so no Fantrax traffic or any
 * future credential ever reaches the browser bundle.
 *
 * Data chain (all league-ID-only, no userSecretId needed for roster overlay):
 *   getLeagueInfo   -> league name + the 12 teamInfo entries (teamId -> name)
 *   getTeamRosters  -> each team's rosterItems ({ id, position, status })
 *   getPlayerIds    -> fantraxId -> { name, team (NHL abbrev), position }
 * We join rosterItems.id against the player map to attach `nhlTeamAbbrev`,
 * which is what joins a roster to our WeekSchedule.
 *
 * `listLeagues` still needs the per-user `userSecretId`; it is implemented but
 * the roster-overlay feature does not call it (the user picks a team from the
 * league's own team list instead).
 */

import type {
  FantasyPlatformProvider,
  FantasyLeague,
  FantasyRoster,
  FantasySport,
  RosterPlayer,
} from "@/lib/integrations/types";
import { FantasyPlatformError } from "@/lib/integrations/types";

const FANTRAX_BASE = "https://www.fantrax.com/fxea/general";

/** Cache the big player-id map (≈1 MB, ~9k players) in-process; it rarely changes. */
let playerMapCache: { at: number; map: Map<string, FantraxPlayer> } | null = null;
const PLAYER_MAP_TTL_MS = 6 * 60 * 60 * 1000; // 6h

interface FantraxPlayer {
  name: string;
  team: string; // NHL abbrev
  position: string;
}

async function fx<T>(endpoint: string, params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams(params).toString();
  const url = `${FANTRAX_BASE}/${endpoint}?${qs}`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Accept: "application/json" },
      // Fantrax data changes slowly; cache at the fetch layer for an hour.
      next: { revalidate: 3600 },
    });
  } catch (e) {
    throw new FantasyPlatformError(
      "fantrax",
      `Network error calling ${endpoint}: ${e instanceof Error ? e.message : "unknown"}`,
    );
  }
  if (!res.ok) {
    throw new FantasyPlatformError("fantrax", `${endpoint} returned HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

/** Normalize a Fantrax NHL team abbrev to our schedule abbrevs where they differ. */
const TEAM_ALIAS: Record<string, string> = {
  // Fantrax and NHL mostly agree; map the known divergences defensively.
  TB: "TBL",
  LA: "LAK",
  SJ: "SJS",
  NJ: "NJD",
  WAS: "WSH",
  CLB: "CBJ",
};
function normAbbrev(a: string): string {
  const up = (a || "").toUpperCase();
  return TEAM_ALIAS[up] ?? up;
}

async function loadPlayerMap(): Promise<Map<string, FantraxPlayer>> {
  const now = Date.now();
  if (playerMapCache && now - playerMapCache.at < PLAYER_MAP_TTL_MS) {
    return playerMapCache.map;
  }
  const raw = await fx<Record<string, FantraxPlayer>>("getPlayerIds", { sport: "NHL" });
  const map = new Map<string, FantraxPlayer>();
  for (const [id, p] of Object.entries(raw)) {
    if (p && typeof p === "object" && p.name) map.set(id, p);
  }
  playerMapCache = { at: now, map };
  return map;
}

// ---- Raw Fantrax response shapes (only the fields we read) ----
interface RawLeagueInfo {
  leagueName?: string;
  teamInfo?: Record<string, { name?: string } | undefined> | { id: string; name: string }[];
}
interface RawRosterItem {
  id: string;
  position?: string;
  status?: string;
}
interface RawRosters {
  period?: number;
  rosters: Record<string, { teamName?: string; rosterItems?: RawRosterItem[] } | undefined>;
}

export interface FantraxLeagueSummary {
  leagueId: string;
  name: string;
  teams: { teamId: string; name: string }[];
}

/** All rosters for a league, each player resolved to an NHL team. */
export interface FantraxLeagueRosters {
  leagueId: string;
  period: number | null;
  name: string;
  teams: {
    teamId: string;
    name: string;
    players: RosterPlayer[];
    /** fantrax ids we could not resolve to a player (reported, not hidden). */
    unresolved: string[];
  }[];
}

function teamInfoToList(
  ti: RawLeagueInfo["teamInfo"],
): { teamId: string; name: string }[] {
  if (!ti) return [];
  if (Array.isArray(ti)) {
    return ti.map((t) => ({ teamId: t.id, name: t.name }));
  }
  return Object.entries(ti).map(([teamId, v]) => ({
    teamId,
    name: v?.name ?? teamId,
  }));
}

/** League name + team list (teamId -> name). League-ID only. */
export async function getLeagueSummary(leagueId: string): Promise<FantraxLeagueSummary> {
  const info = await fx<RawLeagueInfo>("getLeagueInfo", {
    leagueId,
    excludePlayerInfo: "true",
  });
  return {
    leagueId,
    name: info.leagueName ?? "Fantrax League",
    teams: teamInfoToList(info.teamInfo).sort((a, b) => a.name.localeCompare(b.name)),
  };
}

/** Every team's roster for the league, players resolved to NHL team abbrevs. */
export async function getLeagueRosters(
  leagueId: string,
  period?: number,
): Promise<FantraxLeagueRosters> {
  const [summary, rosters, playerMap] = await Promise.all([
    getLeagueSummary(leagueId),
    fx<RawRosters>("getTeamRosters", period ? { leagueId, period: String(period) } : { leagueId }),
    loadPlayerMap(),
  ]);

  const nameById = new Map(summary.teams.map((t) => [t.teamId, t.name]));
  const teams: FantraxLeagueRosters["teams"] = [];

  for (const [teamId, entry] of Object.entries(rosters.rosters ?? {})) {
    const items = entry?.rosterItems ?? [];
    const players: RosterPlayer[] = [];
    const unresolved: string[] = [];
    for (const it of items) {
      const p = playerMap.get(it.id);
      if (!p) {
        unresolved.push(it.id);
        continue;
      }
      players.push({
        playerId: it.id,
        name: p.name,
        nhlTeamAbbrev: normAbbrev(p.team),
        positions: [it.position || p.position].filter(Boolean),
        status: it.status ?? null,
      });
    }
    teams.push({
      teamId,
      name: entry?.teamName ?? nameById.get(teamId) ?? teamId,
      players,
      unresolved,
    });
  }

  teams.sort((a, b) => a.name.localeCompare(b.name));
  return {
    leagueId,
    period: rosters.period ?? null,
    name: summary.name,
    teams,
  };
}

// ---- FantasyPlatformProvider contract (kept for the generic seam) ----
export const fantraxProvider: FantasyPlatformProvider = {
  id: "fantrax",

  async listLeagues(credential: string, _sport: FantasySport): Promise<FantasyLeague[]> {
    void _sport;
    if (!credential) {
      throw new FantasyPlatformError("fantrax", "A Fantrax userSecretId is required to list leagues.");
    }
    const raw = await fx<{ leagues?: Record<string, { leagueName?: string; teamName?: string; teamId?: string }> }>(
      "getLeagues",
      { userSecretId: credential },
    );
    return Object.entries(raw.leagues ?? {}).map(([leagueId, v]) => ({
      platform: "fantrax" as const,
      leagueId,
      name: v?.leagueName ?? leagueId,
      ownedTeams: v?.teamId ? [{ teamId: v.teamId, name: v.teamName ?? "My Team" }] : [],
    }));
  },

  async getRoster(leagueId: string, teamId: string, opts?: { period?: number }): Promise<FantasyRoster> {
    const all = await getLeagueRosters(leagueId, opts?.period);
    const team = all.teams.find((t) => t.teamId === teamId);
    if (!team) {
      throw new FantasyPlatformError("fantrax", `Team ${teamId} not found in league ${leagueId}.`);
    }
    return { leagueId, teamId, players: team.players };
  },
};
