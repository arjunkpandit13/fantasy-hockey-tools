"use client";

import { formatWeekRange } from "@/lib/fantasy-week";

interface Props {
  weekStart: string;
  onPrev: () => void;
  onNext: () => void;
  onThisWeek: () => void;
  isCurrentWeek: boolean;
}

export function WeekNavigator({
  weekStart,
  onPrev,
  onNext,
  onThisWeek,
  isCurrentWeek,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold hover:bg-surface-2"
        >
          ← Previous Week
        </button>
        <button
          onClick={onThisWeek}
          disabled={isCurrentWeek}
          className={`rounded-lg px-3 py-2 text-sm font-bold ${
            isCurrentWeek
              ? "cursor-default bg-accent/20 text-accent"
              : "border border-border bg-surface hover:bg-surface-2"
          }`}
        >
          THIS WEEK
        </button>
        <button
          onClick={onNext}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold hover:bg-surface-2"
        >
          Next Week →
        </button>
      </div>
      <div className="text-lg font-extrabold tracking-wide sm:text-xl">
        {formatWeekRange(weekStart)}
      </div>
    </div>
  );
}
