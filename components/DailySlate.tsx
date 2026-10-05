"use client";

import type { WeekSchedule } from "@/types/schedule";
import { weekdayLabel } from "@/lib/fantasy-week";

interface Props {
  schedule: WeekSchedule;
}

/** Classify a day's slate strength from the actual game count (no fixed weekday assumptions). */
function slateClass(count: number, max: number): { label: string; cls: string } {
  if (count === 0) return { label: "NONE", cls: "bg-surface-2 text-text-muted" };
  // Thresholds derived relative to the week's own busiest day.
  if (count <= 6) return { label: "LIGHT", cls: "bg-offnight/20 text-offnight" };
  if (count >= Math.max(10, Math.round(max * 0.8)))
    return { label: "HEAVY", cls: "bg-b2b/20 text-b2b" };
  return { label: "NORMAL", cls: "bg-accent/15 text-accent" };
}

export function DailySlate({ schedule }: Props) {
  const counts = schedule.dates.map((d) => schedule.slate[d] ?? 0);
  const max = Math.max(1, ...counts);
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted">
          Daily NHL Slate
        </h2>
        <div className="flex items-center gap-3 text-[10px] font-semibold uppercase text-text-muted">
          <span className="text-offnight">■ Light</span>
          <span className="text-accent">■ Normal</span>
          <span className="text-b2b">■ Heavy</span>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {schedule.dates.map((d) => {
          const count = schedule.slate[d] ?? 0;
          const { label, cls } = slateClass(count, max);
          const isOff = schedule.offNights.includes(d);
          const barH = Math.round((count / max) * 36) + 2;
          return (
            <div key={d} className="flex flex-col items-center gap-1">
              <div className="flex h-10 items-end">
                <div
                  className={`w-6 rounded-t ${isOff ? "bg-offnight" : "bg-accent/70"}`}
                  style={{ height: `${barH}px` }}
                />
              </div>
              <div className="text-[11px] font-bold">{weekdayLabel(d)}</div>
              <div className="text-sm font-extrabold tabular-nums">{count}</div>
              <div className={`rounded px-1 py-0.5 text-[8px] font-bold ${cls}`}>
                {label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
