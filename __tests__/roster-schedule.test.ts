import { describe, it, expect } from "vitest";
import {
  computeRosterStrength,
  rankRosterStrength,
} from "@/lib/roster-schedule";
import type { WeekSchedule, TeamWeekSchedule, TeamMeta } from "@/types/schedule";
import type { RosterPlayer } from "@/lib/integrations/types";

function meta(abbrev: string): TeamMeta {
  return {
    abbrev,
    name: abbrev,
    placeName: abbrev,
    commonName: abbrev,
    conference: "Eastern",
    division: "Atlantic",
    logo: "",
  };
}

function teamWeek(
  abbrev: string,
  gp: number,
  offNightGames: number,
  b2bSets: number,
  dates: string[],
): TeamWeekSchedule {
  const games = dates.map((d, i) => ({
    id: i,
    date: d,
    startTimeUTC: `${d}T23:00:00Z`,
    opponent: "OPP",
    isHome: true,
    venue: null,
    teamAbbrev: abbrev,
  }));
  const gamesByDate: Record<string, typeof games> = {};
  for (const g of games) (gamesByDate[g.date] ??= []).push(g);
  return {
    team: meta(abbrev),
    gamesByDate,
    games,
    gp,
    offNightGames,
    b2bSets,
    streamScore: 0,
    secondLegDates: [],
  };
}

const DATES = [
  "2026-10-04",
  "2026-10-05",
  "2026-10-06",
  "2026-10-07",
  "2026-10-08",
  "2026-10-09",
  "2026-10-10",
];

const week: WeekSchedule = {
  weekStart: "2026-10-04",
  weekEnd: "2026-10-10",
  dates: DATES,
  slate: {},
  offNights: ["2026-10-05", "2026-10-07"],
  teams: [
    // TOR: 4 games, 2 on off-nights, 1 b2b
    teamWeek("TOR", 4, 2, 1, ["2026-10-04", "2026-10-05", "2026-10-07", "2026-10-10"]),
    // BUF: 2 games, 0 off-night, 0 b2b
    teamWeek("BUF", 2, 0, 0, ["2026-10-06", "2026-10-08"]),
    // BOS: 0 games (bye)
    teamWeek("BOS", 0, 0, 0, []),
  ],
};

function player(name: string, abbrev: string): RosterPlayer {
  return { playerId: name, name, nhlTeamAbbrev: abbrev, positions: ["C"], status: "ACTIVE" };
}

describe("computeRosterStrength", () => {
  it("sums player-games, off-night games, and b2b across the roster", () => {
    const s = computeRosterStrength("t1", "Team One", [player("A", "TOR"), player("B", "BUF")], week);
    expect(s.totalPlayerGames).toBe(6); // 4 + 2
    expect(s.offNightPlayerGames).toBe(2); // TOR 2 + BUF 0
    expect(s.totalB2BSets).toBe(1);
    expect(s.playerCount).toBe(2);
    expect(s.unmatchedCount).toBe(0);
  });

  it("counts the same NHL team twice when two players share it (start slots)", () => {
    const s = computeRosterStrength("t", "T", [player("A", "TOR"), player("B", "TOR")], week);
    expect(s.totalPlayerGames).toBe(8); // 4 + 4
    expect(s.perDate["2026-10-04"]).toBe(2); // both players' team plays
  });

  it("tracks per-date player counts", () => {
    const s = computeRosterStrength("t", "T", [player("A", "TOR"), player("B", "BUF")], week);
    expect(s.perDate["2026-10-04"]).toBe(1); // only TOR
    expect(s.perDate["2026-10-06"]).toBe(1); // only BUF
    expect(s.perDate["2026-10-09"] ?? 0).toBe(0); // neither
  });

  it("flags players not on the slate as unmatched without crashing", () => {
    const s = computeRosterStrength("t", "T", [player("A", "TOR"), player("X", "ZZZ")], week);
    expect(s.unmatchedCount).toBe(1);
    expect(s.totalPlayerGames).toBe(4); // only TOR counted
  });

  it("gives an empty roster a zero score", () => {
    const s = computeRosterStrength("t", "T", [], week);
    expect(s.score).toBe(0);
    expect(s.totalPlayerGames).toBe(0);
  });

  it("produces a 0-100 score", () => {
    const s = computeRosterStrength("t", "T", [player("A", "TOR")], week);
    expect(s.score).toBeGreaterThanOrEqual(0);
    expect(s.score).toBeLessThanOrEqual(100);
  });
});

describe("rankRosterStrength", () => {
  it("ranks a heavy-schedule roster above a light one", () => {
    const ranked = rankRosterStrength(
      [
        { teamId: "heavy", teamName: "Heavy", players: [player("A", "TOR"), player("B", "TOR")] },
        { teamId: "light", teamName: "Light", players: [player("C", "BOS"), player("D", "BOS")] },
      ],
      week,
    );
    expect(ranked[0]?.teamId).toBe("heavy");
    expect(ranked[1]?.teamId).toBe("light");
  });
});
