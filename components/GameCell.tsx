"use client";

import type { Game } from "@/types/schedule";
import { teamMetaFor } from "@/lib/teams";
import { formatReferenceDateTime } from "@/lib/timezone";

interface Props {
  games: Game[];
  isOffNight: boolean;
  secondLeg: boolean; // this date is the second leg of a B2B
}

/**
 * A single day's cell for a team. Usually 0 or 1 game, but renders multiple
 * gracefully (stacked) if the data ever contains more than one.
 */
export function GameCell({ games, isOffNight, secondLeg }: Props) {
  if (games.length === 0) {
    return <span className="text-text-muted/40">-</span>;
  }
  return (
    <div className="flex flex-col items-center gap-0.5">
      {games.map((g) => {
        const opp = teamMetaFor(g.opponent);
        const label = g.isHome ? g.opponent : `@${g.opponent}`;
        const tip = [
          `${g.isHome ? "vs" : "@"} ${opp.name}`,
          formatReferenceDateTime(g.startTimeUTC),
          g.isHome ? "Home" : "Away",
          g.venue ?? "",
        ]
          .filter(Boolean)
          .join("\n");
        return (
          <span
            key={g.id}
            title={tip}
            className={[
              "inline-flex min-w-[2.6rem] cursor-help items-center justify-center rounded px-1.5 py-0.5 text-xs font-bold tabular-nums",
              g.isHome
                ? "bg-home/15 text-home"
                : "bg-away/15 text-away",
              secondLeg ? "ring-1 ring-b2b/70" : "",
            ].join(" ")}
          >
            {label}
          </span>
        );
      })}
      {isOffNight ? (
        <span className="h-1 w-1 rounded-full bg-offnight" aria-hidden />
      ) : null}
    </div>
  );
}
