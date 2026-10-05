"use client";

import { useEffect, useState } from "react";
import type { TeamWeekSchedule, WeekSchedule } from "@/types/schedule";
import { TeamLogo, streamScoreClass } from "@/components/ui-helpers";
import { weekdayLabel, getNextFantasyWeek } from "@/lib/fantasy-week";
import { formatReferenceDateTime } from "@/lib/timezone";

interface Props {
  team: TeamWeekSchedule | null;
  weekStart: string;
  onClose: () => void;
}

function GameLine({
  date,
  opponent,
  isHome,
  startTimeUTC,
}: {
  date: string;
  opponent: string;
  isHome: boolean;
  startTimeUTC: string;
}) {
  return (
    <li className="flex items-center justify-between border-b border-border/50 py-1.5 text-sm">
      <span className="font-bold text-text-muted">{weekdayLabel(date)}</span>
      <span className={`font-bold ${isHome ? "text-home" : "text-away"}`}>
        {isHome ? opponent : `@${opponent}`}
      </span>
      <span className="text-xs text-text-muted">
        {formatReferenceDateTime(startTimeUTC).replace(/^\w+,\s/, "")}
      </span>
    </li>
  );
}

export function TeamScheduleDrawer({ team, weekStart, onClose }: Props) {
  const [nextWeek, setNextWeek] = useState<TeamWeekSchedule | null>(null);
  const [loadingNext, setLoadingNext] = useState(false);

  useEffect(() => {
    if (!team) {
      setNextWeek(null);
      return;
    }
    let cancelled = false;
    const nextStart = getNextFantasyWeek(weekStart).start;
    setLoadingNext(true);
    setNextWeek(null);
    fetch(`/api/schedule/${nextStart}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("failed"))))
      .then((data: WeekSchedule) => {
        if (cancelled) return;
        const t = data.teams.find((x) => x.team.abbrev === team.team.abbrev) ?? null;
        setNextWeek(t);
      })
      .catch(() => {
        if (!cancelled) setNextWeek(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingNext(false);
      });
    return () => {
      cancelled = true;
    };
  }, [team, weekStart]);

  if (!team) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden
      />
      <aside className="relative flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-border bg-bg-elevated p-5 shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <TeamLogo team={team.team} size={40} />
            <div>
              <h2 className="text-lg font-extrabold leading-tight">{team.team.name}</h2>
              <div className="text-xs text-text-muted">
                {team.team.conference} · {team.team.division}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-2 py-1 text-sm hover:bg-surface-2"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-surface p-2">
            <div className="text-xl font-extrabold tabular-nums">{team.gp}</div>
            <div className="text-[10px] uppercase text-text-muted">Games</div>
          </div>
          <div className="rounded-lg bg-surface p-2">
            <div className="text-xl font-extrabold tabular-nums text-offnight">
              {team.offNightGames}
            </div>
            <div className="text-[10px] uppercase text-text-muted">Off-Night</div>
          </div>
          <div className="rounded-lg bg-surface p-2">
            <div className="text-xl font-extrabold tabular-nums text-b2b">
              {team.b2bSets}
            </div>
            <div className="text-[10px] uppercase text-text-muted">B2B Sets</div>
          </div>
        </div>

        <div className="mt-3 rounded-lg bg-surface p-3 text-center">
          <span className="text-xs uppercase text-text-muted">Streaming Score </span>
          <span className={`text-xl font-extrabold ${streamScoreClass(team.streamScore)}`}>
            {team.streamScore}
          </span>
        </div>

        <h3 className="mt-5 text-sm font-bold uppercase tracking-wider text-text-muted">
          This Week · {team.gp} Games
        </h3>
        <ul className="mt-1">
          {team.games.length === 0 ? (
            <li className="py-2 text-sm text-text-muted">No games this week.</li>
          ) : (
            team.games.map((g) => (
              <GameLine
                key={g.id}
                date={g.date}
                opponent={g.opponent}
                isHome={g.isHome}
                startTimeUTC={g.startTimeUTC}
              />
            ))
          )}
        </ul>

        <h3 className="mt-5 text-sm font-bold uppercase tracking-wider text-text-muted">
          Next Week{nextWeek ? ` · ${nextWeek.gp} Games` : ""}
        </h3>
        {loadingNext ? (
          <div className="mt-2 space-y-1">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-6 rounded" />
            ))}
          </div>
        ) : nextWeek && nextWeek.games.length > 0 ? (
          <ul className="mt-1">
            {nextWeek.games.map((g) => (
              <GameLine
                key={g.id}
                date={g.date}
                opponent={g.opponent}
                isHome={g.isHome}
                startTimeUTC={g.startTimeUTC}
              />
            ))}
          </ul>
        ) : (
          <div className="mt-2 text-sm text-text-muted">No games next week.</div>
        )}
      </aside>
    </div>
  );
}
