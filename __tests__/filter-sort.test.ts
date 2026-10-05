import { describe, it, expect } from "vitest";
import {
  applyFilters,
  sortTeams,
  DEFAULT_FILTERS,
  type Filters,
} from "@/lib/filter-sort";
import type { TeamWeekSchedule, TeamMeta } from "@/types/schedule";

function team(
  abbrev: string,
  partial: Partial<TeamWeekSchedule> & { meta?: Partial<TeamMeta> },
): TeamWeekSchedule {
  const m: TeamMeta = {
    abbrev,
    name: partial.meta?.name ?? abbrev,
    placeName: partial.meta?.placeName ?? abbrev,
    commonName: partial.meta?.commonName ?? abbrev,
    conference: partial.meta?.conference ?? "Eastern",
    division: partial.meta?.division ?? "Atlantic",
    logo: "",
  };
  return {
    team: m,
    gamesByDate: {},
    games: [],
    gp: partial.gp ?? 0,
    offNightGames: partial.offNightGames ?? 0,
    b2bSets: partial.b2bSets ?? 0,
    streamScore: partial.streamScore ?? 0,
    secondLegDates: [],
  };
}

const TEAMS: TeamWeekSchedule[] = [
  team("TOR", { gp: 4, offNightGames: 2, b2bSets: 1, streamScore: 80, meta: { name: "Toronto Maple Leafs", placeName: "Toronto", commonName: "Maple Leafs" } }),
  team("BOS", { gp: 3, offNightGames: 1, b2bSets: 0, streamScore: 60, meta: { conference: "Eastern", division: "Atlantic" } }),
  team("VGK", { gp: 4, offNightGames: 3, b2bSets: 0, streamScore: 90, meta: { conference: "Western", division: "Pacific" } }),
  team("COL", { gp: 2, offNightGames: 0, b2bSets: 1, streamScore: 30, meta: { conference: "Western", division: "Central" } }),
];

describe("applyFilters", () => {
  it("filters by conference", () => {
    const f: Filters = { ...DEFAULT_FILTERS, conference: "Western" };
    expect(applyFilters(TEAMS, f).map((t) => t.team.abbrev).sort()).toEqual(["COL", "VGK"]);
  });

  it("filters by division", () => {
    const f: Filters = { ...DEFAULT_FILTERS, division: "Pacific" };
    expect(applyFilters(TEAMS, f).map((t) => t.team.abbrev)).toEqual(["VGK"]);
  });

  it("filters by minimum GP", () => {
    const f: Filters = { ...DEFAULT_FILTERS, minGp: 4 };
    expect(applyFilters(TEAMS, f).map((t) => t.team.abbrev).sort()).toEqual(["TOR", "VGK"]);
  });

  it("filters off-night only", () => {
    const f: Filters = { ...DEFAULT_FILTERS, offNightOnly: true };
    expect(applyFilters(TEAMS, f).map((t) => t.team.abbrev).sort()).toEqual(["BOS", "TOR", "VGK"]);
  });

  it("filters has/no back-to-back", () => {
    expect(applyFilters(TEAMS, { ...DEFAULT_FILTERS, b2b: "has" }).map((t) => t.team.abbrev).sort())
      .toEqual(["COL", "TOR"]);
    expect(applyFilters(TEAMS, { ...DEFAULT_FILTERS, b2b: "none" }).map((t) => t.team.abbrev).sort())
      .toEqual(["BOS", "VGK"]);
  });

  it("search matches city, name, and abbreviation", () => {
    for (const q of ["Toronto", "Leafs", "TOR", "tor", "maple"]) {
      const res = applyFilters(TEAMS, { ...DEFAULT_FILTERS, search: q });
      expect(res.map((t) => t.team.abbrev)).toContain("TOR");
    }
  });
});

describe("sortTeams", () => {
  it("sorts by GP descending by default-direction", () => {
    const res = sortTeams(TEAMS, "gp", "desc").map((t) => t.team.abbrev);
    // GP: TOR 4, VGK 4, BOS 3, COL 2. Tiebreak within GP=4 -> off-night desc -> VGK(3) before TOR(2).
    expect(res).toEqual(["VGK", "TOR", "BOS", "COL"]);
  });

  it("sorts by GP ascending", () => {
    const res = sortTeams(TEAMS, "gp", "asc").map((t) => t.team.abbrev);
    expect(res[0]).toBe("COL");
  });

  it("sorts by off-night games", () => {
    const res = sortTeams(TEAMS, "off", "desc").map((t) => t.team.abbrev);
    expect(res[0]).toBe("VGK");
  });

  it("sorts by streaming score", () => {
    const res = sortTeams(TEAMS, "stream", "desc").map((t) => t.team.abbrev);
    expect(res[0]).toBe("VGK");
    expect(res[res.length - 1]).toBe("COL");
  });

  it("team sort is alphabetical", () => {
    const res = sortTeams(TEAMS, "team", "asc").map((t) => t.team.abbrev);
    expect(res).toEqual(["BOS", "COL", "TOR", "VGK"]);
  });

  it("default tiebreak chain: GP desc, then off desc, then team A-Z", () => {
    const tied = [
      team("ZZZ", { gp: 4, offNightGames: 2 }),
      team("AAA", { gp: 4, offNightGames: 2 }),
    ];
    const res = sortTeams(tied, "gp", "desc").map((t) => t.team.abbrev);
    expect(res).toEqual(["AAA", "ZZZ"]);
  });
});
