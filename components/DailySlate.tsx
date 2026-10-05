"use client";

import type { WeekSchedule } from "@/types/schedule";
import { weekdayLabel } from "@/lib/fantasy-week";

interface Props {
  schedule: WeekSchedule;
}

/** Classify a day's slate strength from the actual game count (no fixed weekday assumptions). */
function slateClass(
  count: number,
  max: number,
): { label: string; cls: string; bar: string } {
  if (count === 0)
    return {
      label: "None",
      cls: "bg-surface-2 text-text-muted",
      bar: "var(--surface-2)",
    };
  // Thresholds derived relative to the week's own busiest day.
  if (count <= 6)
    return {
      label: "Light",
      cls: "bg-offnight/20 text-offnight",
      bar: "linear-gradient(180deg,var(--offnight),color-mix(in srgb,var(--offnight) 55%,transparent))",
    };
  if (count >= Math.max(10, Math.round(max * 0.8)))
    return {
      label: "Heavy",
      cls: "bg-b2b/20 text-b2b",
      bar: "linear-gradient(180deg,var(--b2b),color-mix(in srgb,var(--b2b) 55%,transparent))",
    };
  return {
    label: "Normal",
    cls: "bg-accent/15 text-accent",
    bar: "linear-gradient(180deg,var(--accent),color-mix(in srgb,var(--accent) 50%,transparent))",
  };
}

export function DailySlate({ schedule }: Props) {
  const counts = schedule.dates.map((d) => schedule.slate[d] ?? 0);
  const max = Math.max(1, ...counts);
  return (
    <div className="panel p-3.5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="eyebrow">Daily NHL Slate</h2>
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wide text-text-muted">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-offnight" /> Light
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-accent" /> Normal
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-b2b" /> Heavy
          </span>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {schedule.dates.map((d) => {
          const count = schedule.slate[d] ?? 0;
          const { label, cls, bar } = slateClass(count, max);
          const isOff = schedule.offNights.includes(d);
          const barH = Math.round((count / max) * 56) + 4;
          return (
            <div
              key={d}
              className={`flex flex-col items-center gap-1.5 rounded-lg p-1.5 ${
                isOff ? "bg-offnight/5 ring-1 ring-inset ring-offnight/25" : ""
              }`}
            >
              <div className="flex h-16 items-end">
                <div
                  className="w-7 rounded-md transition-all"
                  style={{ height: `${barH}px`, background: bar }}
                  title={`${count} games`}
                />
              </div>
              <div className="text-[11px] font-black uppercase tracking-wide">
                {weekdayLabel(d)}
              </div>
              <div className="text-base font-black tabular-nums leading-none">
                {count}
              </div>
              <div className={`rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide ${cls}`}>
                {label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
