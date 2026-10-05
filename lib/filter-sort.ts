import type { TeamWeekSchedule, Conference, Division } from "@/types/schedule";

export type SortKey = "team" | "gp" | "off" | "b2b" | "stream";
export type SortDir = "asc" | "desc";

export interface Filters {
  conference: "All" | Conference;
  division: "All" | Division;
  minGp: 0 | 2 | 3 | 4;
  offNightOnly: boolean;
  b2b: "all" | "has" | "none";
  search: string;
}

export const DEFAULT_FILTERS: Filters = {
  conference: "All",
  division: "All",
  minGp: 0,
  offNightOnly: false,
  b2b: "all",
  search: "",
};

/** Match a team against the free-text search (city, name, or abbrev). */
function matchesSearch(t: TeamWeekSchedule, q: string): boolean {
  if (!q) return true;
  const needle = q.trim().toLowerCase();
  const m = t.team;
  return (
    m.abbrev.toLowerCase().includes(needle) ||
    m.name.toLowerCase().includes(needle) ||
    m.placeName.toLowerCase().includes(needle) ||
    m.commonName.toLowerCase().includes(needle)
  );
}

export function applyFilters(
  teams: TeamWeekSchedule[],
  f: Filters,
): TeamWeekSchedule[] {
  return teams.filter((t) => {
    if (f.conference !== "All" && t.team.conference !== f.conference) return false;
    if (f.division !== "All" && t.team.division !== f.division) return false;
    if (f.minGp > 0 && t.gp < f.minGp) return false;
    if (f.offNightOnly && t.offNightGames <= 0) return false;
    if (f.b2b === "has" && t.b2bSets <= 0) return false;
    if (f.b2b === "none" && t.b2bSets > 0) return false;
    if (!matchesSearch(t, f.search)) return false;
    return true;
  });
}

function cmp(a: number, b: number): number {
  return a - b;
}

/**
 * Sort teams. Primary key per `key`/`dir`, with the product's documented
 * default tiebreak chain: GP desc, then Off-Night desc, then team A-Z.
 */
export function sortTeams(
  teams: TeamWeekSchedule[],
  key: SortKey,
  dir: SortDir,
): TeamWeekSchedule[] {
  const sign = dir === "asc" ? 1 : -1;
  const out = [...teams];
  out.sort((a, b) => {
    let primary = 0;
    switch (key) {
      case "team":
        primary = a.team.abbrev.localeCompare(b.team.abbrev) * sign;
        break;
      case "gp":
        primary = cmp(a.gp, b.gp) * sign;
        break;
      case "off":
        primary = cmp(a.offNightGames, b.offNightGames) * sign;
        break;
      case "b2b":
        primary = cmp(a.b2bSets, b.b2bSets) * sign;
        break;
      case "stream":
        primary = cmp(a.streamScore, b.streamScore) * sign;
        break;
    }
    if (primary !== 0) return primary;
    // Default tiebreak chain.
    if (b.gp !== a.gp) return b.gp - a.gp;
    if (b.offNightGames !== a.offNightGames) return b.offNightGames - a.offNightGames;
    return a.team.abbrev.localeCompare(b.team.abbrev);
  });
  return out;
}
