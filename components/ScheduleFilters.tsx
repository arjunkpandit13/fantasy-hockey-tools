"use client";

import type { Filters } from "@/lib/filter-sort";

interface Props {
  filters: Filters;
  onChange: (next: Filters) => void;
  resultCount: number;
}

const SELECT_CLS =
  "rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-text outline-none transition-colors focus:border-accent/60 [color-scheme:dark]";
const LABEL_CLS = "text-[10px] font-black uppercase tracking-wide text-text-muted";

export function ScheduleFilters({ filters, onChange, resultCount }: Props) {
  function set<K extends keyof Filters>(key: K, value: Filters[K]) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="panel flex flex-wrap items-end gap-3 p-3">
      <div className="flex flex-1 flex-col gap-1 min-w-[180px]">
        <label className={LABEL_CLS}>Search Team</label>
        <input
          type="text"
          placeholder="Toronto, Leafs, TOR…"
          value={filters.search}
          onChange={(e) => set("search", e.target.value)}
          className={SELECT_CLS}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className={LABEL_CLS}>Conference</label>
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
        <label className={LABEL_CLS}>Division</label>
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
        <label className={LABEL_CLS}>Games Played</label>
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
        <label className={LABEL_CLS}>Back-to-Back</label>
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

      <div className="ml-auto flex items-center gap-1.5 pb-1.5">
        <span className="rounded-md bg-surface-2 px-2 py-1 text-xs font-black tabular-nums text-accent">
          {resultCount}
        </span>
        <span className="text-xs font-semibold text-text-muted">
          team{resultCount === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
}
