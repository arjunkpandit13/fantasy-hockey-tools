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
  accent,
  children,
}: {
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div className="panel relative overflow-hidden p-3.5">
      <span
        className="absolute inset-x-0 top-0 h-0.5"
        style={{ background: accent }}
        aria-hidden
      />
      <div className="mb-2.5 text-[11px] font-black uppercase tracking-wider text-text-muted">
        {title}
      </div>
      {children}
    </div>
  );
}

function StatList({
  rows,
  color,
  suffix,
}: {
  rows: { abbrev: string; name: string; value: number }[];
  color: string;
  suffix?: string;
}) {
  return (
    <ul className="space-y-1.5">
      {rows.map((r, i) => (
        <li key={r.abbrev} className="flex items-center gap-2">
          <span className="w-3.5 text-center text-[10px] font-black tabular-nums text-text-muted/60">
            {i + 1}
          </span>
          <span className="font-bold">{r.abbrev}</span>
          <span className="truncate text-xs text-text-muted">{r.name}</span>
          <span
            className="ml-auto shrink-0 text-sm font-black tabular-nums"
            style={{ color }}
          >
            {r.value}
            {suffix ? <span className="ml-0.5 text-[10px] font-bold opacity-70">{suffix}</span> : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function SummaryCards({ schedule }: Props) {
  const busiest = topBy(schedule.teams, (t) => t.gp, "max", 3);
  const bestOff = topBy(schedule.teams, (t) => t.offNightGames, "max", 3).filter(
    (t) => t.offNightGames > 0,
  );
  const lightest = topBy(schedule.teams, (t) => t.gp, "min", 3);

  const name = (t: TeamWeekSchedule) => t.team.commonName ?? t.team.name;

  return (
    <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
      <Card title="Fantasy Week" accent="linear-gradient(90deg,var(--accent),var(--accent-2))">
        <div className="text-base font-black leading-tight">
          {formatWeekRange(schedule.weekStart)}
        </div>
        <div className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-text-muted">
          Sun → Sat
        </div>
      </Card>

      <Card title="Busiest Teams" accent="var(--accent)">
        <StatList
          rows={busiest.map((t) => ({ abbrev: t.team.abbrev, name: name(t), value: t.gp }))}
          color="var(--accent)"
          suffix="GP"
        />
      </Card>

      <Card title="Best Off-Night" accent="var(--offnight)">
        {bestOff.length === 0 ? (
          <div className="text-sm text-text-muted">No off-night games</div>
        ) : (
          <StatList
            rows={bestOff.map((t) => ({
              abbrev: t.team.abbrev,
              name: name(t),
              value: t.offNightGames,
            }))}
            color="var(--offnight)"
            suffix="OFF"
          />
        )}
      </Card>

      <Card title="Lightest Schedule" accent="var(--b2b)">
        <StatList
          rows={lightest.map((t) => ({ abbrev: t.team.abbrev, name: name(t), value: t.gp }))}
          color="var(--b2b)"
          suffix="GP"
        />
      </Card>
    </div>
  );
}
