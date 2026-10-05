import Link from "next/link";

const NAV = [
  { label: "Schedule", href: "/schedule", ready: true },
  { label: "Streamers", href: "/streamers", ready: false },
  { label: "Players", href: "/players", ready: false },
  { label: "Playoff Schedule", href: "/playoff-schedule", ready: false },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg-elevated/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] items-center gap-6 px-3 py-3 sm:px-5">
        <Link href="/schedule" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-gradient-to-br from-accent to-accent-2 text-sm font-black text-bg">
            FH
          </span>
          <span className="text-sm font-extrabold tracking-wide sm:text-base">
            FANTASY HOCKEY TOOLS
          </span>
        </Link>
        <nav className="ml-auto flex items-center gap-1 text-sm">
          {NAV.map((item) =>
            item.ready ? (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-1.5 font-semibold text-text transition-colors hover:bg-surface-2"
              >
                {item.label}
              </Link>
            ) : (
              <span
                key={item.href}
                title="Coming soon"
                className="hidden cursor-default rounded-md px-3 py-1.5 font-medium text-text-muted sm:inline"
              >
                {item.label}
                <span className="ml-1 rounded bg-surface-2 px-1 py-0.5 text-[10px] font-semibold uppercase text-text-muted">
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
