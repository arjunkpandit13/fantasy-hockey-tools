"use client";

import type { TeamWeekSchedule } from "@/types/schedule";
import type { SortKey, SortDir } from "@/lib/filter-sort";
import { ScheduleRow } from "@/components/ScheduleRow";
import { weekdayLabel, parseDate } from "@/lib/fantasy-week";

interface Props {
  teams: TeamWeekSchedule[];
  dates: string[];
  offNights: Set<string>;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  showStream: boolean;
  onSelect: (abbrev: string) => void;
}

function SortHeader({
  label,
  active,
  dir,
  onClick,
  title,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  title?: string;
}) {
  return (
    <th
      className="px-2 py-2 text-center font-bold whitespace-nowrap"
      title={title}
    >
      <button
        onClick={onClick}
        className={`inline-flex items-center gap-1 ${
          active ? "text-accent" : "text-text-muted hover:text-text"
        }`}
      >
        {label}
        <span className="text-[9px]">
          {active ? (dir === "desc" ? "▼" : "▲") : "⇅"}
        </span>
      </button>
    </th>
  );
}

export function ScheduleTable({
  teams,
  dates,
  offNights,
  sortKey,
  sortDir,
  onSort,
  showStream,
  onSelect,
}: Props) {
  return (
    <div className="scroll-thin overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-[56px] z-20 bg-bg-elevated">
          <tr className="border-b border-border">
            <th className="sticky left-0 z-30 bg-bg-elevated px-3 py-2 text-left">
              <button
                onClick={() => onSort("team")}
                className={`inline-flex items-center gap-1 font-bold ${
                  sortKey === "team" ? "text-accent" : "text-text-muted hover:text-text"
                }`}
              >
                TEAM
                <span className="text-[9px]">
                  {sortKey === "team" ? (sortDir === "desc" ? "▼" : "▲") : "⇅"}
                </span>
              </button>
            </th>
            {dates.map((d) => {
              const isOff = offNights.has(d);
              const dayNum = parseDate(d).getUTCDate();
              return (
                <th
                  key={d}
                  className={`px-1.5 py-2 text-center font-bold ${
                    isOff ? "bg-offnight/10 text-offnight" : "text-text-muted"
                  }`}
                  title={isOff ? "Off-night: lower-volume NHL slate" : undefined}
                >
                  <div>{weekdayLabel(d)}</div>
                  <div className="text-[10px] font-medium opacity-70">{dayNum}</div>
                </th>
              );
            })}
            <SortHeader
              label="GP"
              active={sortKey === "gp"}
              dir={sortDir}
              onClick={() => onSort("gp")}
              title="Games played this fantasy week"
            />
            <SortHeader
              label="OFF"
              active={sortKey === "off"}
              dir={sortDir}
              onClick={() => onSort("off")}
              title="Off-nights are lower-volume NHL schedule days, making players on these teams easier to fit into fantasy lineups."
            />
            <SortHeader
              label="B2B"
              active={sortKey === "b2b"}
              dir={sortDir}
              onClick={() => onSort("b2b")}
              title="Back-to-back sets (games on consecutive calendar dates)"
            />
            {showStream ? (
              <SortHeader
                label="STREAM"
                active={sortKey === "stream"}
                dir={sortDir}
                onClick={() => onSort("stream")}
                title="Schedule-only streaming score (0-100). Evaluates schedule quality, NOT player skill."
              />
            ) : null}
          </tr>
        </thead>
        <tbody>
          {teams.length === 0 ? (
            <tr>
              <td
                colSpan={dates.length + (showStream ? 5 : 4)}
                className="px-4 py-12 text-center text-text-muted"
              >
                No teams match the current filters.
              </td>
            </tr>
          ) : (
            teams.map((t) => (
              <ScheduleRow
                key={t.team.abbrev}
                team={t}
                dates={dates}
                offNights={offNights}
                showStream={showStream}
                onSelect={onSelect}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
