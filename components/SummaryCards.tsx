"use client";

import type { WeekSchedule, TeamWeekSchedule } from "@/types/schedule";
import { formatWeekRange } from "@/lib/fantasy-week";

interface Props {
  schedule: WeekSchedule;
}

function topBy(
  teams: TeamWeekSchedule[],
  value: (t: TeamWeekSchedule) => number,
  dir: "max" | "min",
  limit: number,
): TeamWeekSchedule[] {
  const playing = teams.filter((t) => t.gp > 0);
  const sorted = [...playing].sort((a, b) =>
    dir === "max" ? value(b) - value(a) : value(a) - value(b),
  );
  return sorted.slice(0, limit);
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <div className="mb-2 text-xs font-bold uppercase tracking-wider text-text-muted">
        {title}
      </div>
      {children}
    </div>
  );
}

export function SummaryCards({ schedule }: Props) {
  const busiest = topBy(schedule.teams, (t) => t.gp, "max", 3);
  const bestOff = topBy(schedule.teams, (t) => t.offNightGames, "max", 3).filter(
    (t) => t.offNightGames > 0,
  );
  const lightest = topBy(schedule.teams, (t) => t.gp, "min", 3);

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Card title="Fantasy Week">
        <div className="text-base font-extrabold">{formatWeekRange(schedule.weekStart)}</div>
        <div className="mt-1 text-xs text-text-muted">Sunday → Saturday</div>
      </Card>

      <Card title="Busiest Teams">
        <ul className="space-y-0.5">
          {busiest.map((t) => (
            <li key={t.team.abbrev} className="flex justify-between text-sm font-semibold">
              <span>{t.team.abbrev}</span>
              <span className="tabular-nums text-accent">{t.gp}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Best Off-Night Schedule">
        {bestOff.length === 0 ? (
          <div className="text-sm text-text-muted">No off-night games</div>
        ) : (
          <ul className="space-y-0.5">
            {bestOff.map((t) => (
              <li key={t.team.abbrev} className="flex justify-between text-sm font-semibold">
                <span>{t.team.abbrev}</span>
                <span className="tabular-nums text-offnight">{t.offNightGames} OFF</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Lightest Schedule">
        <ul className="space-y-0.5">
          {lightest.map((t) => (
            <li key={t.team.abbrev} className="flex justify-between text-sm font-semibold">
              <span>{t.team.abbrev}</span>
              <span className="tabular-nums text-b2b">{t.gp} GP</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
