/**
 * Centralized timezone logic. The fantasy schedule anchors each game to a
 * calendar DAY in a single reference zone (default US Eastern), because NHL
 * fantasy scheduling is conventionally read around NHL game dates. Keeping this
 * in one module means it can later become a per-user setting without touching
 * the week math or the UI.
 *
 * Game START TIMES are still shown in the viewer's own browser timezone; only
 * the DAY-attribution for the fantasy grid uses the reference zone.
 */

export const FANTASY_REFERENCE_TZ = "America/New_York";

/**
 * Convert an ISO instant (UTC) to the "YYYY-MM-DD" calendar date it falls on
 * in the fantasy reference timezone. This is the authoritative "which day does
 * this game belong to" convention.
 */
export function instantToFantasyDate(
  isoInstant: string,
  timeZone: string = FANTASY_REFERENCE_TZ,
): string {
  const d = new Date(isoInstant);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid instant: ${isoInstant}`);
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(d); // "YYYY-MM-DD"
}

/** Format a game start instant for display in the viewer's local timezone. */
export function formatLocalTime(isoInstant: string): string {
  const d = new Date(isoInstant);
  if (Number.isNaN(d.getTime())) return "TBD";
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(d);
}

/** Format a game start instant as a date+time in the reference zone (server-safe). */
export function formatReferenceDateTime(isoInstant: string): string {
  const d = new Date(isoInstant);
  if (Number.isNaN(d.getTime())) return "TBD";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: FANTASY_REFERENCE_TZ,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(d);
}
