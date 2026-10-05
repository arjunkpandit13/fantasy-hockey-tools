import { describe, it, expect } from "vitest";
import {
  getFantasyWeek,
  getFantasyWeekStart,
  getFantasyWeekEnd,
  getNextFantasyWeek,
  getPreviousFantasyWeek,
  isDateInFantasyWeek,
  addDays,
  dayOfWeek,
  formatWeekRange,
  weekdayLabel,
} from "@/lib/fantasy-week";

describe("getFantasyWeekStart - Sunday-based", () => {
  it("Sunday selected -> same Sunday start", () => {
    expect(getFantasyWeekStart("2026-10-04")).toBe("2026-10-04"); // Sun
  });

  it("Monday selected -> previous Sunday", () => {
    expect(getFantasyWeekStart("2026-10-05")).toBe("2026-10-04"); // Mon
  });

  it("Wednesday Oct 7 2026 -> Sunday Oct 4 2026 (acceptance example)", () => {
    expect(getFantasyWeekStart("2026-10-07")).toBe("2026-10-04");
  });

  it("Saturday selected -> previous Sunday", () => {
    expect(getFantasyWeekStart("2026-10-10")).toBe("2026-10-04"); // Sat
  });

  it("never uses Monday-based / ISO weeks", () => {
    // Monday would give itself under ISO; we must give the previous Sunday.
    expect(getFantasyWeekStart("2026-10-05")).not.toBe("2026-10-05");
  });
});

describe("getFantasyWeek - acceptance example", () => {
  it("Wed Oct 7 2026 -> Sun Oct 4 .. Sat Oct 10", () => {
    const wk = getFantasyWeek("2026-10-07");
    expect(wk.start).toBe("2026-10-04");
    expect(wk.end).toBe("2026-10-10");
    expect(wk.dates).toEqual([
      "2026-10-04",
      "2026-10-05",
      "2026-10-06",
      "2026-10-07",
      "2026-10-08",
      "2026-10-09",
      "2026-10-10",
    ]);
  });

  it("every week starts on a Sunday and ends on a Saturday", () => {
    for (const d of ["2026-01-01", "2026-06-15", "2027-02-28", "2026-12-31"]) {
      const wk = getFantasyWeek(d);
      expect(dayOfWeek(wk.start)).toBe(0);
      expect(dayOfWeek(wk.end)).toBe(6);
    }
  });
});

describe("getFantasyWeekEnd", () => {
  it("returns the Saturday six days after the Sunday start", () => {
    expect(getFantasyWeekEnd("2026-10-07")).toBe("2026-10-10");
    expect(getFantasyWeekEnd("2026-10-04")).toBe("2026-10-10");
  });
});

describe("month boundary", () => {
  it("week spanning Oct->Nov 2026 resolves correctly", () => {
    // Nov 1 2026 is a Sunday.
    expect(getFantasyWeekStart("2026-11-01")).toBe("2026-11-01");
    // Oct 31 2026 is a Saturday -> previous Sunday Oct 25.
    const wk = getFantasyWeek("2026-10-31");
    expect(wk.start).toBe("2026-10-25");
    expect(wk.end).toBe("2026-10-31");
  });
});

describe("year boundary", () => {
  it("handles the Dec 2026 -> Jan 2027 crossover", () => {
    // Dec 30 2026 is a Wednesday; its week is Sun Dec 27 .. Sat Jan 2 2027.
    const wk = getFantasyWeek("2026-12-30");
    expect(wk.start).toBe("2026-12-27");
    expect(wk.end).toBe("2027-01-02");
    expect(wk.dates).toContain("2026-12-31");
    expect(wk.dates).toContain("2027-01-01");
  });
});

describe("next / previous fantasy week", () => {
  it("next week is exactly 7 days later", () => {
    const next = getNextFantasyWeek("2026-10-07");
    expect(next.start).toBe("2026-10-11");
    expect(next.end).toBe("2026-10-17");
  });

  it("previous week is exactly 7 days earlier", () => {
    const prev = getPreviousFantasyWeek("2026-10-07");
    expect(prev.start).toBe("2026-09-27");
    expect(prev.end).toBe("2026-10-03");
  });

  it("prev/next are inverse operations", () => {
    const start = "2026-10-04";
    const roundTrip = getPreviousFantasyWeek(getNextFantasyWeek(start).start).start;
    expect(roundTrip).toBe(start);
  });

  it("navigation works indefinitely across many weeks", () => {
    let cur = getFantasyWeekStart("2026-10-04");
    for (let i = 0; i < 60; i++) {
      const next = getNextFantasyWeek(cur);
      expect(dayOfWeek(next.start)).toBe(0);
      expect(addDays(cur, 7)).toBe(next.start);
      cur = next.start;
    }
  });
});

describe("isDateInFantasyWeek", () => {
  const start = "2026-10-04";
  it("includes the Sunday start and Saturday end", () => {
    expect(isDateInFantasyWeek("2026-10-04", start)).toBe(true);
    expect(isDateInFantasyWeek("2026-10-10", start)).toBe(true);
  });
  it("excludes the day before and after", () => {
    expect(isDateInFantasyWeek("2026-10-03", start)).toBe(false);
    expect(isDateInFantasyWeek("2026-10-11", start)).toBe(false);
  });
});

describe("label helpers", () => {
  it("weekdayLabel", () => {
    expect(weekdayLabel("2026-10-04")).toBe("SUN");
    expect(weekdayLabel("2026-10-10")).toBe("SAT");
  });
  it("formatWeekRange same month", () => {
    expect(formatWeekRange("2026-10-04")).toBe("OCT 4 - 10, 2026");
  });
  it("formatWeekRange cross month", () => {
    expect(formatWeekRange("2026-10-25")).toBe("OCT 25 - 31, 2026");
    expect(formatWeekRange("2026-12-27")).toBe("DEC 27 - JAN 2, 2027");
  });
});

describe("no UTC day-shift", () => {
  it("addDays never drifts across DST or month ends", () => {
    // US DST ends Nov 1 2026; adding days around it must stay calendar-correct.
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-11-01", 1)).toBe("2026-11-02");
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01"); // 2026 not leap
  });
});
