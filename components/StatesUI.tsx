"use client";

export function ScheduleSkeleton() {
  return (
    <div className="space-y-3">
      <div className="skeleton h-16 rounded-xl" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-24 rounded-xl" />
        ))}
      </div>
      <div className="skeleton h-32 rounded-xl" />
      <div className="rounded-xl border border-border bg-surface p-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="skeleton mb-2 h-9 rounded" />
        ))}
      </div>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="grid min-h-[40vh] place-items-center">
      <div className="max-w-md rounded-xl border border-b2b/40 bg-b2b/10 p-6 text-center">
        <div className="text-lg font-bold text-b2b">
          Unable to load the NHL schedule.
        </div>
        <p className="mt-2 text-sm text-text-muted">{message}</p>
        <button
          onClick={onRetry}
          className="mt-4 rounded-lg bg-accent px-4 py-2 font-bold text-bg hover:opacity-90"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
