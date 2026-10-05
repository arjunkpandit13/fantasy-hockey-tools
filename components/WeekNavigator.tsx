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
    <div className="panel flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
      <div className="flex flex-col gap-0.5">
        <span className="eyebrow">
          {isCurrentWeek ? "This Fantasy Week" : "Fantasy Week"}
        </span>
        <div className="text-xl font-black tracking-tight sm:text-2xl">
          {formatWeekRange(weekStart)}
        </div>
        <div className="text-[11px] font-medium text-text-muted">
          Sunday → Saturday
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          aria-label="Previous week"
          className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-2/60 px-3 py-2 text-sm font-semibold transition-colors hover:border-accent/50 hover:bg-surface-2"
        >
          <span className="text-base leading-none">←</span>
          <span className="hidden sm:inline">Previous</span>
        </button>
        <button
          onClick={onThisWeek}
          disabled={isCurrentWeek}
          className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${
            isCurrentWeek
              ? "cursor-default bg-accent/15 text-accent ring-1 ring-inset ring-accent/40"
              : "bg-gradient-to-br from-accent to-accent-2 text-bg shadow-md shadow-accent/20 hover:brightness-110"
          }`}
        >
          Today
        </button>
        <button
          onClick={onNext}
          aria-label="Next week"
          className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-2/60 px-3 py-2 text-sm font-semibold transition-colors hover:border-accent/50 hover:bg-surface-2"
        >
          <span className="hidden sm:inline">Next</span>
          <span className="text-base leading-none">→</span>
        </button>
      </div>
    </div>
  );
}
