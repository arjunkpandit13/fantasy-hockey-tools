"use client";

import type { Filters } from "@/lib/filter-sort";

interface Props {
  filters: Filters;
  onChange: (next: Filters) => void;
  resultCount: number;
}

const SELECT_CLS =
  "rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-text";

export function ScheduleFilters({ filters, onChange, resultCount }: Props) {
  function set<K extends keyof Filters>(key: K, value: Filters[K]) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-3">
      <div className="flex flex-1 flex-col gap-1 min-w-[180px]">
        <label className="text-[11px] font-semibold uppercase text-text-muted">
          Search Team
        </label>
        <input
          type="text"
          placeholder="Toronto, Leafs, TOR…"
          value={filters.search}
          onChange={(e) => set("search", e.target.value)}
          className={SELECT_CLS}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-semibold uppercase text-text-muted">
          Conference
        </label>
        <select
          value={filters.conference}
          onChange={(e) => set("conference", e.target.value as Filters["conference"])}
          className={SELECT_CLS}
        >
          <option>All</option>
          <option>Eastern</option>
          <option>Western</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-semibold uppercase text-text-muted">
          Division
        </label>
        <select
          value={filters.division}
          onChange={(e) => set("division", e.target.value as Filters["division"])}
          className={SELECT_CLS}
        >
          <option>All</option>
          <option>Atlantic</option>
          <option>Metropolitan</option>
          <option>Central</option>
          <option>Pacific</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-semibold uppercase text-text-muted">
          Games Played
        </label>
        <select
          value={String(filters.minGp)}
          onChange={(e) => set("minGp", Number(e.target.value) as Filters["minGp"])}
          className={SELECT_CLS}
        >
          <option value="0">All</option>
          <option value="4">4+</option>
          <option value="3">3+</option>
          <option value="2">2+</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-semibold uppercase text-text-muted">
          Back-to-Back
        </label>
        <select
          value={filters.b2b}
          onChange={(e) => set("b2b", e.target.value as Filters["b2b"])}
          className={SELECT_CLS}
        >
          <option value="all">All</option>
          <option value="has">Back-to-Back</option>
          <option value="none">No Back-to-Back</option>
        </select>
      </div>

      <label className="flex items-center gap-2 pb-1.5 text-sm font-semibold">
        <input
          type="checkbox"
          checked={filters.offNightOnly}
          onChange={(e) => set("offNightOnly", e.target.checked)}
          className="h-4 w-4 accent-[var(--accent)]"
        />
        Off-Night Games
      </label>

      <div className="ml-auto pb-1.5 text-sm text-text-muted">
        {resultCount} team{resultCount === 1 ? "" : "s"}
      </div>
    </div>
  );
}
