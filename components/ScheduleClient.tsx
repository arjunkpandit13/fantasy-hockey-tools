"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { WeekSchedule } from "@/types/schedule";
import {
  getFantasyWeekStart,
  getNextFantasyWeek,
  getPreviousFantasyWeek,
  todayInZone,
} from "@/lib/fantasy-week";
import { FANTASY_REFERENCE_TZ } from "@/lib/timezone";
import {
  applyFilters,
  sortTeams,
  DEFAULT_FILTERS,
  type Filters,
  type SortKey,
  type SortDir,
} from "@/lib/filter-sort";
import { WeekNavigator } from "@/components/WeekNavigator";
import { DatePicker } from "@/components/DatePicker";
import { DailySlate } from "@/components/DailySlate";
import { SummaryCards } from "@/components/SummaryCards";
import { ScheduleFilters } from "@/components/ScheduleFilters";
import { ScheduleTable } from "@/components/ScheduleTable";
import { MobileTeamCards } from "@/components/MobileTeamCards";
import { TeamScheduleDrawer } from "@/components/TeamScheduleDrawer";
import { ScheduleSkeleton, ErrorState } from "@/components/StatesUI";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function ScheduleClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Current week start (a Sunday). Derived from ?week= or today.
  const weekParam = searchParams.get("week");
  const todayWeekStart = useMemo(
    () => getFantasyWeekStart(todayInZone(FANTASY_REFERENCE_TZ)),
    [],
  );
  const weekStart = useMemo(() => {
    if (weekParam && DATE_RE.test(weekParam)) return getFantasyWeekStart(weekParam);
    return todayWeekStart;
  }, [weekParam, todayWeekStart]);

  const [schedule, setSchedule] = useState<WeekSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  // Filters & sort from URL (so they are shareable), with sane defaults.
  const filters: Filters = useMemo(
    () => ({
      conference: (searchParams.get("conf") as Filters["conference"]) || "All",
      division: (searchParams.get("div") as Filters["division"]) || "All",
      minGp: (Number(searchParams.get("gp")) as Filters["minGp"]) || 0,
      offNightOnly: searchParams.get("off") === "1",
      b2b: (searchParams.get("b2b") as Filters["b2b"]) || "all",
      search: searchParams.get("q") || "",
    }),
    [searchParams],
  );
  const sortKey = (searchParams.get("sort") as SortKey) || "gp";
  const sortDir = (searchParams.get("dir") as SortDir) || "desc";

  const updateUrl = useCallback(
    (next: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(next)) {
        if (v === null || v === "") params.delete(k);
        else params.set(k, v);
      }
      router.replace(`/schedule?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const load = useCallback((wk: string) => {
    setLoading(true);
    setError(null);
    fetch(`/api/schedule/${wk}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);
        return data as WeekSchedule;
      })
      .then((data) => setSchedule(data))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Unknown error"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load(weekStart);
  }, [weekStart, load]);

  const goWeek = useCallback(
    (wk: string) => updateUrl({ week: getFantasyWeekStart(wk) }),
    [updateUrl],
  );

  const filteredSorted = useMemo(() => {
    if (!schedule) return [];
    return sortTeams(applyFilters(schedule.teams, filters), sortKey, sortDir);
  }, [schedule, filters, sortKey, sortDir]);

  const offNightSet = useMemo(
    () => new Set(schedule?.offNights ?? []),
    [schedule],
  );

  const selectedTeam = useMemo(
    () => schedule?.teams.find((t) => t.team.abbrev === selected) ?? null,
    [schedule, selected],
  );

  function onSort(key: SortKey) {
    if (key === sortKey) {
      updateUrl({ dir: sortDir === "desc" ? "asc" : "desc" });
    } else {
      updateUrl({ sort: key, dir: key === "team" ? "asc" : "desc" });
    }
  }

  function onFilterChange(next: Filters) {
    updateUrl({
      conf: next.conference === "All" ? null : next.conference,
      div: next.division === "All" ? null : next.division,
      gp: next.minGp === 0 ? null : String(next.minGp),
      off: next.offNightOnly ? "1" : null,
      b2b: next.b2b === "all" ? null : next.b2b,
      q: next.search || null,
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <WeekNavigator
          weekStart={weekStart}
          isCurrentWeek={weekStart === todayWeekStart}
          onPrev={() => goWeek(getPreviousFantasyWeek(weekStart).start)}
          onNext={() => goWeek(getNextFantasyWeek(weekStart).start)}
          onThisWeek={() => goWeek(todayWeekStart)}
        />
        <DatePicker
          value={weekStart}
          onJump={(d) => goWeek(d)}
          onToday={() => goWeek(todayWeekStart)}
        />
      </div>

      {loading ? (
        <ScheduleSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={() => load(weekStart)} />
      ) : schedule ? (
        <div className="rise space-y-4">
          <SummaryCards schedule={schedule} />
          <DailySlate schedule={schedule} />
          <ScheduleFilters
            filters={filters}
            onChange={onFilterChange}
            resultCount={filteredSorted.length}
          />

          {/* Desktop / tablet: matrix table (horizontal scroll on tablet). */}
          <div className="hidden md:block">
            <ScheduleTable
              teams={filteredSorted}
              dates={schedule.dates}
              offNights={offNightSet}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={onSort}
              showStream
              onSelect={setSelected}
            />
          </div>

          {/* Mobile: compact cards. */}
          <div className="md:hidden">
            <MobileTeamCards
              teams={filteredSorted}
              offNights={offNightSet}
              onSelect={setSelected}
            />
          </div>

          <p className="pt-1 text-center text-xs leading-relaxed text-text-muted">
            Off-nights are lower-volume NHL schedule days, making players on these
            teams easier to fit into fantasy lineups. Streaming Score evaluates
            schedule quality only and does not evaluate player skill.
          </p>
        </div>
      ) : null}

      <TeamScheduleDrawer
        team={selectedTeam}
        weekStart={weekStart}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
