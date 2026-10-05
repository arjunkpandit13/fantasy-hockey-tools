"use client";

import type { TeamWeekSchedule } from "@/types/schedule";
import { GameCell } from "@/components/GameCell";
import { TeamLogo, streamScoreClass } from "@/components/ui-helpers";
import { weekdayLabel } from "@/lib/fantasy-week";

interface Props {
  team: TeamWeekSchedule;
  dates: string[];
  offNights: Set<string>;
  showStream: boolean;
  onSelect: (abbrev: string) => void;
}

export function ScheduleRow({
  team,
  dates,
  offNights,
  showStream,
  onSelect,
}: Props) {
  const secondLegs = new Set(team.secondLegDates);
  return (
    <tr className="border-b border-border/50 transition-colors hover:bg-surface-2/40">
      {/* Sticky team column */}
      <th
        scope="row"
        className="sticky left-0 z-10 bg-surface px-3 py-2 text-left"
      >
        <button
          onClick={() => onSelect(team.team.abbrev)}
          className="flex items-center gap-2 font-black transition-colors hover:text-accent"
          title={`${team.team.name} - view week detail`}
        >
          <TeamLogo team={team.team} size={24} />
          <span>{team.team.abbrev}</span>
        </button>
      </th>

      {dates.map((d) => (
        <td key={d} className="px-1.5 py-2 text-center align-middle">
          <GameCell
            games={team.gamesByDate[d] ?? []}
            isOffNight={offNights.has(d)}
            secondLeg={secondLegs.has(d)}
          />
        </td>
      ))}

      <td className="px-2 py-2 text-center">
        <span className="inline-grid h-7 min-w-7 place-items-center rounded-md bg-accent/15 px-1.5 text-sm font-black tabular-nums text-accent">
          {team.gp}
        </span>
      </td>
      <td className="px-2 py-2 text-center">
        <span
          className={`text-sm font-bold tabular-nums ${
            team.offNightGames > 0 ? "text-offnight" : "text-text-muted/40"
          }`}
        >
          {team.offNightGames}
        </span>
      </td>
      <td className="px-2 py-2 text-center">
        <span
          className={`text-sm font-bold tabular-nums ${
            team.b2bSets > 0 ? "text-b2b" : "text-text-muted/40"
          }`}
        >
          {team.b2bSets}
        </span>
      </td>
      {showStream ? (
        <td className="px-2 py-2 text-center">
          <span
            className={`text-sm font-black tabular-nums ${streamScoreClass(
              team.streamScore,
            )}`}
          >
            {team.streamScore}
          </span>
        </td>
      ) : null}
    </tr>
  );
}
