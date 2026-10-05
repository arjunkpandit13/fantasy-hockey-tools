"use client";

import type { TeamWeekSchedule } from "@/types/schedule";
import { TeamLogo, streamScoreClass } from "@/components/ui-helpers";
import { weekdayLabel } from "@/lib/fantasy-week";

interface Props {
  teams: TeamWeekSchedule[];
  offNights: Set<string>;
  onSelect: (abbrev: string) => void;
}

export function MobileTeamCards({ teams, offNights, onSelect }: Props) {
  if (teams.length === 0) {
    return (
      <div className="panel p-8 text-center text-text-muted">
        No teams match the current filters.
      </div>
    );
  }
  return (
    <div className="space-y-2.5">
      {teams.map((t) => {
        const secondLegs = new Set(t.secondLegDates);
        return (
          <button
            key={t.team.abbrev}
            onClick={() => onSelect(t.team.abbrev)}
            className="panel block w-full p-3 text-left transition-colors active:bg-surface-2/60"
          >
            {/* Header: logo + name, stream badge */}
            <div className="flex items-center gap-2.5">
              <TeamLogo team={t.team} size={30} />
              <div className="min-w-0 flex-1">
                <div className="text-base font-black leading-none">
                  {t.team.abbrev}
                </div>
                <div className="mt-0.5 truncate text-[11px] text-text-muted">
                  {t.team.commonName ?? t.team.name}
                </div>
              </div>
              <div
                className={`flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-surface-2 ${streamScoreClass(
                  t.streamScore,
                )}`}
                title="Streaming Score (schedule only)"
              >
                <span className="text-sm font-black leading-none tabular-nums">
                  {t.streamScore}
                </span>
                <span className="text-[7px] font-bold uppercase tracking-wide text-text-muted">
                  Stream
                </span>
              </div>
            </div>

            {/* Stat strip */}
            <div className="mt-2.5 grid grid-cols-3 gap-1.5">
              <Stat label="Games" value={t.gp} color="var(--accent)" />
              <Stat label="Off-Night" value={t.offNightGames} color="var(--offnight)" />
              <Stat label="B2B" value={t.b2bSets} color="var(--b2b)" />
            </div>

            {/* Game chips */}
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {t.games.length === 0 ? (
                <span className="text-sm text-text-muted">No games this week</span>
              ) : (
                t.games.map((g) => (
                  <span
                    key={g.id}
                    className={[
                      "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold",
                      g.isHome ? "bg-home/15 text-home" : "bg-away/15 text-away",
                      offNights.has(g.date) ? "ring-1 ring-inset ring-offnight/50" : "",
                      secondLegs.has(g.date) ? "ring-1 ring-inset ring-b2b/70" : "",
                    ].join(" ")}
                  >
                    <span className="text-[10px] font-black uppercase text-text-muted">
                      {weekdayLabel(g.date)}
                    </span>
                    {g.isHome ? g.opponent : `@${g.opponent}`}
                  </span>
                ))
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg bg-surface-2/70 px-2 py-1.5 text-center">
      <div className="text-lg font-black tabular-nums leading-none" style={{ color }}>
        {value}
      </div>
      <div className="mt-1 text-[9px] font-bold uppercase tracking-wide text-text-muted">
        {label}
      </div>
    </div>
  );
}
