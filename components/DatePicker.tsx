"use client";

interface Props {
  value: string; // currently-shown week start (a Sunday)
  onJump: (date: string) => void;
  onToday: () => void;
}

export function DatePicker({ value, onJump, onToday }: Props) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-semibold text-text-muted" htmlFor="jump">
        Jump to Date
      </label>
      <input
        id="jump"
        type="date"
        defaultValue={value}
        onChange={(e) => {
          if (e.target.value) onJump(e.target.value);
        }}
        className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text [color-scheme:dark]"
      />
      <button
        onClick={onToday}
        className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold hover:bg-surface-2"
      >
        Today
      </button>
    </div>
  );
}
