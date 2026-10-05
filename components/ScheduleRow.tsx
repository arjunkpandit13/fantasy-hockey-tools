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
    <tr className="border-b border-border/60 hover:bg-surface-2/40">
      {/* Sticky team column */}
      <th
        scope="row"
        className="sticky left-0 z-10 bg-surface px-3 py-2 text-left"
      >
        <button
          onClick={() => onSelect(team.team.abbrev)}
          className="flex items-center gap-2 font-bold hover:text-accent"
          title={`${team.team.name} - view week detail`}
        >
          <TeamLogo team={team.team} />
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

      <td className="px-2 py-2 text-center font-extrabold tabular-nums">
        {team.gp}
      </td>
      <td className="px-2 py-2 text-center tabular-nums text-offnight">
        {team.offNightGames}
      </td>
      <td className="px-2 py-2 text-center tabular-nums text-b2b">
        {team.b2bSets}
      </td>
      {showStream ? (
        <td
          className={`px-2 py-2 text-center font-extrabold tabular-nums ${streamScoreClass(
            team.streamScore,
          )}`}
        >
          {team.streamScore}
        </td>
      ) : null}
    </tr>
  );
}
