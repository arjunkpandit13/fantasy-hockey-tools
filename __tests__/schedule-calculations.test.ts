import { describe, it, expect } from "vitest";
import {
  computeSlate,
  computeOffNights,
  countB2BSets,
  secondLegDates,
  buildWeekSchedule,
  type TeamGamesInput,
} from "@/lib/schedule-calculations";
import { instantToFantasyDate } from "@/lib/timezone";
import type { Game, TeamMeta } from "@/types/schedule";

function game(
  id: number,
  teamAbbrev: string,
  opponent: string,
  date: string,
  isHome: boolean,
): Game {
  return {
    id,
    date,
    startTimeUTC: `${date}T23:00:00Z`,
    opponent,
    isHome,
    venue: null,
    teamAbbrev,
  };
}

const meta = (abbrev: string): TeamMeta => ({
  abbrev,
  name: abbrev,
  placeName: abbrev,
  commonName: abbrev,
  conference: "Eastern",
  division: "Atlantic",
  logo: "",
});

describe("GP calculation", () => {
  it("counts a team's games in the Sun..Sat week", () => {
    const dates = [
      "2026-10-04", "2026-10-05", "2026-10-06", "2026-10-07",
      "2026-10-08", "2026-10-09", "2026-10-10",
    ];
    const inputs: TeamGamesInput[] = [
      {
        team: meta("TOR"),
        weekGames: [
          game(1, "TOR", "MTL", "2026-10-04", false),
          game(2, "TOR", "BOS", "2026-10-06", true),
          game(3, "TOR", "NYR", "2026-10-07", false),
          game(4, "TOR", "DET", "2026-10-09", true),
        ],
        priorEdgeDate: null,
      },
    ];
    const wk = buildWeekSchedule("2026-10-04", inputs);
    const tor = wk.teams.find((t) => t.team.abbrev === "TOR")!;
    expect(tor.gp).toBe(4);
    expect(wk.dates).toEqual(dates);
  });
});

describe("slate + off-night calculation", () => {
  it("computes per-date league game counts and flags off-nights (<=6)", () => {
    const dates = ["2026-10-04", "2026-10-05"];
    // Day 1: 5 distinct games (off-night). Day 2: 7 distinct games (normal).
    const games: Game[] = [];
    for (let i = 0; i < 5; i++) {
      games.push(game(100 + i, "A", "B", "2026-10-04", true));
      games.push(game(100 + i, "B", "A", "2026-10-04", false)); // same id, both teams
    }
    for (let i = 0; i < 7; i++) {
      games.push(game(200 + i, "A", "B", "2026-10-05", true));
      games.push(game(200 + i, "B", "A", "2026-10-05", false));
    }
    const slate = computeSlate(games, dates);
    expect(slate["2026-10-04"]).toBe(5);
    expect(slate["2026-10-05"]).toBe(7);
    const off = computeOffNights(slate, dates, 6);
    expect(off).toEqual(["2026-10-04"]);
  });

  it("off-night count per team", () => {
    const inputs: TeamGamesInput[] = [
      {
        team: meta("TOR"),
        weekGames: [game(1, "TOR", "MTL", "2026-10-04", true)],
        priorEdgeDate: null,
      },
      // Fill Monday with 7 games so it is NOT an off-night.
      ...Array.from({ length: 7 }, (_, i) => ({
        team: meta(`X${i}`),
        weekGames: [game(50 + i, `X${i}`, `Y${i}`, "2026-10-05", true)],
        priorEdgeDate: null,
      })),
    ];
    const wk = buildWeekSchedule("2026-10-04", inputs);
    const tor = wk.teams.find((t) => t.team.abbrev === "TOR")!;
    // Sunday had only 1 game -> off-night -> TOR's single game counts.
    expect(tor.offNightGames).toBe(1);
  });
});

describe("back-to-back detection", () => {
  it("detects consecutive-day games as one B2B set", () => {
    expect(countB2BSets(["2026-10-09", "2026-10-10"], null)).toBe(1); // Fri+Sat
  });

  it("no B2B when games are a day apart", () => {
    expect(countB2BSets(["2026-10-06", "2026-10-08"], null)).toBe(0);
  });

  it("counts multiple B2B sets", () => {
    expect(
      countB2BSets(["2026-10-04", "2026-10-05", "2026-10-09", "2026-10-10"], null),
    ).toBe(2);
  });

  it("Saturday->Sunday across the week boundary is detected", () => {
    // priorEdgeDate = Saturday Oct 3 (previous week); first game Sun Oct 4.
    const sets = countB2BSets(["2026-10-04"], "2026-10-03");
    expect(sets).toBe(1);
    const legs = secondLegDates(["2026-10-04"], "2026-10-03");
    expect(legs.has("2026-10-04")).toBe(true); // Sunday is the 2nd leg
  });

  it("no cross-boundary B2B when the Sunday game is not the day after the Saturday", () => {
    expect(countB2BSets(["2026-10-05"], "2026-10-03")).toBe(0);
  });
});

describe("timezone day attribution", () => {
  it("a late-night UTC instant maps to the correct Eastern calendar day", () => {
    // 2026-10-08T00:30:00Z is Oct 7, 8:30pm ET -> belongs to Oct 7, not Oct 8.
    expect(instantToFantasyDate("2026-10-08T00:30:00Z")).toBe("2026-10-07");
    // A 7:00pm ET start on Oct 7 (23:00Z) stays Oct 7.
    expect(instantToFantasyDate("2026-10-07T23:00:00Z")).toBe("2026-10-07");
  });
});

describe("streaming score integration", () => {
  it("produces a 0-100 score reflecting GP, off-nights, and B2B penalty", () => {
    const inputs: TeamGamesInput[] = [
      {
        team: meta("TOR"),
        weekGames: [
          game(1, "TOR", "MTL", "2026-10-04", true),
          game(2, "TOR", "BOS", "2026-10-06", true),
          game(3, "TOR", "NYR", "2026-10-09", false),
          game(4, "TOR", "DET", "2026-10-10", true),
        ],
        priorEdgeDate: null,
      },
    ];
    const wk = buildWeekSchedule("2026-10-04", inputs);
    const tor = wk.teams.find((t) => t.team.abbrev === "TOR")!;
    expect(tor.streamScore).toBeGreaterThanOrEqual(0);
    expect(tor.streamScore).toBeLessThanOrEqual(100);
    expect(tor.b2bSets).toBe(1); // Fri+Sat
  });
});
