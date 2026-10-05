"use client";

import { useEffect, useMemo, useState } from "react";
import type { WeekSchedule } from "@/types/schedule";
import {
  fetchLeagueRosters,
  type LeagueRostersResponse,
} from "@/lib/fantrax-client";
import {
  rankRosterStrength,
  computeRosterStrength,
  type RosterWeekStrength,
} from "@/lib/roster-schedule";
import { CONFIG } from "@/lib/config";
import { TeamLogo, streamScoreClass } from "@/components/ui-helpers";
import { weekdayLabel } from "@/lib/fantasy-week";

interface Props {
  week: WeekSchedule;
}

/** localStorage key so the user's team pick sticks across visits. */
const PICK_KEY = "fhtools.fantrax.teamId";

export function MyTeamPanel({ week }: Props) {
  const [data, setData] = useState<LeagueRostersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    fetchLeagueRosters()
      .then((d) => {
        if (!alive) return;
        setData(d);
        // Restore saved pick, else default to the "Arjun" team, else first.
        const saved = typeof window !== "undefined" ? localStorage.getItem(PICK_KEY) : null;
        const hint = CONFIG.fantrax.defaultTeamNameHint.toLowerCase();
        const def =
          (saved && d.teams.find((t) => t.teamId === saved)?.teamId) ||
          d.teams.find((t) => t.name.toLowerCase().includes(hint))?.teamId ||
          d.teams[0]?.teamId ||
          null;
        setTeamId(def);
      })
      .catch((e: unknown) => alive && setError(e instanceof Error ? e.message : "Unknown error"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  // Rank every roster for THIS week (recomputes when the week changes).
  const ranked = useMemo<RosterWeekStrength[]>(() => {
    if (!data) return [];
    return rankRosterStrength(
      data.teams.map((t) => ({ teamId: t.teamId, teamName: t.name, players: t.players })),
      week,
    );
  }, [data, week]);

  const selected = useMemo(() => {
    if (!data || !teamId) return null;
    const t = data.teams.find((x) => x.teamId === teamId);
    if (!t) return null;
    return computeRosterStrength(t.teamId, t.name, t.players, week);
  }, [data, teamId, week]);

  const rankOf = (id: string) => ranked.findIndex((r) => r.teamId === id) + 1;

  function pick(id: string) {
    setTeamId(id);
    if (typeof window !== "undefined") localStorage.setItem(PICK_KEY, id);
  }

  if (loading) {
    return (
      <div className="panel p-4">
        <div className="eyebrow mb-3">My Fantasy Team</div>
        <div className="skeleton h-24 w-full rounded-lg" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="panel p-4">
        <div className="eyebrow mb-2">My Fantasy Team</div>
        <p className="text-sm text-text-muted">
          Couldn&apos;t load your Fantrax league: {error}
        </p>
      </div>
    );
  }
  if (!data || !selected) return null;

  const maxPerDate = Math.max(1, ...Object.values(selected.perDate));
  const best = ranked.slice(0, 3);
  const worst = ranked.slice(-3).reverse();

  return (
    <div className="panel p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="eyebrow">My Fantasy Team · {data.name}</div>
          <div className="mt-1 text-xs text-text-muted">
            Schedule strength for this fantasy week · league rosters via Fantrax
          </div>
        </div>
        <select
          value={teamId ?? ""}
          onChange={(e) => pick(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold outline-none transition-colors [color-scheme:dark] focus:border-accent/60"
        >
          {data.teams.map((t) => (
            <option key={t.teamId} value={t.teamId}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* Headline metrics for the selected team */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Metric
          label="Schedule Score"
          value={selected.score}
          color="var(--accent)"
          sub={`#${rankOf(selected.teamId)} of ${ranked.length}`}
          big
          scoreColor={streamScoreClass(selected.score)}
        />
        <Metric label="Player-Games" value={selected.totalPlayerGames} color="var(--home)" />
        <Metric label="Off-Night Games" value={selected.offNightPlayerGames} color="var(--offnight)" />
        <Metric label="B2B Exposure" value={selected.totalB2BSets} color="var(--b2b)" />
      </div>

      {/* Your players playing each day */}
      <div className="mt-4">
        <div className="eyebrow mb-2">Your Players Playing · By Day</div>
        <div className="grid grid-cols-7 gap-1.5">
          {week.dates.map((d) => {
            const n = selected.perDate[d] ?? 0;
            const isOff = week.offNights.includes(d);
            const h = Math.round((n / maxPerDate) * 42) + 3;
            return (
              <div key={d} className="flex flex-col items-center gap-1">
                <div className="flex h-12 items-end">
                  <div
                    className={`w-6 rounded-md ${isOff ? "bg-offnight" : "bg-accent"}`}
                    style={{ height: `${h}px` }}
                    title={`${n} player${n === 1 ? "" : "s"} playing`}
                  />
                </div>
                <div className="text-[10px] font-black uppercase text-text-muted">
                  {weekdayLabel(d)}
                </div>
                <div className="text-sm font-black tabular-nums leading-none">{n}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Roster list */}
      <div className="mt-4">
        <div className="eyebrow mb-2">Roster · {selected.playerCount} players</div>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {selected.players.map((p) => (
            <div
              key={p.player.playerId}
              className="flex items-center gap-2 rounded-lg bg-surface-2/60 px-2.5 py-1.5"
            >
              {p.teamWeek ? (
                <TeamLogo team={p.teamWeek.team} size={20} />
              ) : (
                <span className="grid h-5 w-5 place-items-center rounded bg-surface text-[9px] text-text-muted">
                  ?
                </span>
              )}
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                {p.player.name}
              </span>
              <span className="shrink-0 text-[10px] font-bold uppercase text-text-muted">
                {p.player.nhlTeamAbbrev}
              </span>
              <span
                className={`shrink-0 text-xs font-black tabular-nums ${
                  p.gp > 0 ? "text-accent" : "text-text-muted/50"
                }`}
                title="Games this fantasy week"
              >
                {p.gp} GP
              </span>
              {p.offNightGames > 0 ? (
                <span className="shrink-0 text-[10px] font-bold text-offnight">
                  {p.offNightGames} OFF
                </span>
              ) : null}
            </div>
          ))}
        </div>
        {selected.unmatchedCount > 0 ? (
          <p className="mt-2 text-[11px] text-text-muted">
            {selected.unmatchedCount} rostered player
            {selected.unmatchedCount === 1 ? "" : "s"} couldn&apos;t be matched to an
            NHL team this week (minors, IR, or free-agent slots).
          </p>
        ) : null}
      </div>

      {/* League-wide best / worst roster schedules */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Leaderboard title="Best Schedules This Week" rows={best} rankOffset={0} highlight={selected.teamId} />
        <Leaderboard
          title="Toughest Schedules This Week"
          rows={worst}
          rankOffset={ranked.length - worst.length}
          highlight={selected.teamId}
          fromBottom
          total={ranked.length}
        />
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  color,
  sub,
  big,
  scoreColor,
}: {
  label: string;
  value: number;
  color: string;
  sub?: string;
  big?: boolean;
  scoreColor?: string;
}) {
  return (
    <div className="rounded-lg bg-surface-2/60 px-3 py-2.5 text-center">
      <div
        className={`font-black tabular-nums leading-none ${big ? "text-2xl" : "text-xl"} ${scoreColor ?? ""}`}
        style={scoreColor ? undefined : { color }}
      >
        {value}
      </div>
      <div className="mt-1 text-[9px] font-bold uppercase tracking-wide text-text-muted">
        {label}
      </div>
      {sub ? <div className="mt-0.5 text-[10px] font-semibold text-text-muted">{sub}</div> : null}
    </div>
  );
}

function Leaderboard({
  title,
  rows,
  rankOffset,
  highlight,
  fromBottom,
  total,
}: {
  title: string;
  rows: RosterWeekStrength[];
  rankOffset: number;
  highlight: string;
  fromBottom?: boolean;
  total?: number;
}) {
  return (
    <div className="panel-2 p-3">
      <div className="mb-2 text-[11px] font-black uppercase tracking-wide text-text-muted">
        {title}
      </div>
      <ul className="space-y-1.5">
        {rows.map((r, i) => {
          const rank = fromBottom && total ? total - i : rankOffset + i + 1;
          const isMe = r.teamId === highlight;
          return (
            <li
              key={r.teamId}
              className={`flex items-center gap-2 rounded-md px-1.5 py-1 ${
                isMe ? "bg-accent/10 ring-1 ring-inset ring-accent/30" : ""
              }`}
            >
              <span className="w-5 text-center text-[10px] font-black tabular-nums text-text-muted/60">
                {rank}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                {r.teamName}
                {isMe ? <span className="ml-1 text-[10px] font-bold text-accent">YOU</span> : null}
              </span>
              <span className="shrink-0 text-[10px] text-text-muted tabular-nums">
                {r.totalPlayerGames} GP
              </span>
              <span className={`shrink-0 text-sm font-black tabular-nums ${streamScoreClass(r.score)}`}>
                {r.score}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
