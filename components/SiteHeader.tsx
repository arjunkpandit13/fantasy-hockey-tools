import Link from "next/link";

const NAV = [
  { label: "Schedule", href: "/schedule", ready: true },
  { label: "Streamers", href: "/streamers", ready: false },
  { label: "Players", href: "/players", ready: false },
  { label: "Playoff Schedule", href: "/playoff-schedule", ready: false },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg-elevated/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-3 py-2.5 sm:px-5 sm:py-3">
        <Link href="/schedule" className="group flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-accent to-accent-2 text-sm font-black text-bg shadow-lg shadow-accent/20 transition-transform group-hover:scale-105">
            FH
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-sm font-black tracking-tight sm:text-base">
              Fantasy Hockey Tools
            </span>
            <span className="mt-0.5 hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted sm:block">
              NHL Schedule Dashboard
            </span>
          </span>
        </Link>
        <nav className="scroll-thin ml-auto flex items-center gap-1 overflow-x-auto text-sm">
          {NAV.map((item) =>
            item.ready ? (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg bg-surface-2/60 px-3 py-1.5 font-semibold text-text ring-1 ring-inset ring-border transition-colors hover:bg-surface-2 sm:bg-transparent sm:ring-0 sm:hover:bg-surface-2"
              >
                {item.label}
              </Link>
            ) : (
              <span
                key={item.href}
                title="Coming soon"
                className="flex cursor-default items-center gap-1 rounded-lg px-2.5 py-1.5 font-medium text-text-muted/70"
              >
                <span className="whitespace-nowrap">{item.label}</span>
                <span className="rounded bg-surface-2 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide text-text-muted">
                  Soon
                </span>
              </span>
            ),
          )}
        </nav>
      </div>
    </header>
  );
}
