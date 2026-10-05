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
      <div className="rounded-xl border border-border bg-surface p-8 text-center text-text-muted">
        No teams match the current filters.
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {teams.map((t) => {
        const secondLegs = new Set(t.secondLegDates);
        return (
          <button
            key={t.team.abbrev}
            onClick={() => onSelect(t.team.abbrev)}
            className="block w-full rounded-xl border border-border bg-surface p-3 text-left"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TeamLogo team={t.team} size={26} />
                <span className="font-extrabold">{t.team.abbrev}</span>
                <span className="text-xs text-text-muted">{t.team.commonName}</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="text-accent">{t.gp} GP</span>
                <span className="text-offnight">{t.offNightGames} OFF</span>
                <span className="text-b2b">{t.b2bSets} B2B</span>
                <span className={streamScoreClass(t.streamScore)}>{t.streamScore}</span>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {t.games.length === 0 ? (
                <span className="text-sm text-text-muted">No games this week</span>
              ) : (
                t.games.map((g) => (
                  <span
                    key={g.id}
                    className={[
                      "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-bold",
                      g.isHome ? "bg-home/15 text-home" : "bg-away/15 text-away",
                      offNights.has(g.date) ? "ring-1 ring-offnight/50" : "",
                      secondLegs.has(g.date) ? "ring-1 ring-b2b/70" : "",
                    ].join(" ")}
                  >
                    <span className="text-text-muted">{weekdayLabel(g.date)}</span>
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
