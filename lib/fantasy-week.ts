/**
 * Fantasy-week logic. CORE PRODUCT RULE: a fantasy week ALWAYS runs
 * Sunday 00:00 -> Saturday 23:59:59. This is never ISO-week / Monday based.
 *
 * To avoid UTC-conversion day-shift bugs, we operate on plain calendar dates
 * ("YYYY-MM-DD") and anchor every Date at UTC noon. UTC noon is far enough from
 * either midnight that no timezone offset can push the displayed day across a
 * boundary. We never read local-time getters.
 */

const MS_PER_DAY = 86_400_000;

/** Parse "YYYY-MM-DD" into a Date anchored at 12:00:00 UTC. */
export function parseDate(dateStr: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!m) throw new Error(`Invalid date string: ${dateStr}`);
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  // Date.UTC avoids local-tz interpretation.
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
}

/** Format a UTC-anchored Date back to "YYYY-MM-DD" using UTC getters. */
export function formatDate(date: Date): string {
  const y = date.getUTCFullYear();
  const mo = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${mo}-${d}`;
}

/** Day of week with Sunday = 0 ... Saturday = 6, read in UTC. */
export function dayOfWeek(date: Date | string): number {
  const d = typeof date === "string" ? parseDate(date) : date;
  return d.getUTCDay();
}

/** Add (or subtract) whole days to a date string, returning a new string. */
export function addDays(dateStr: string, days: number): string {
  const d = parseDate(dateStr);
  return formatDate(new Date(d.getTime() + days * MS_PER_DAY));
}

export interface FantasyWeek {
  start: string; // Sunday "YYYY-MM-DD"
  end: string; // Saturday "YYYY-MM-DD"
  dates: string[]; // length 7, Sun..Sat
}

/**
 * Given ANY date, return the Sunday that starts its fantasy week.
 * Sunday maps to itself; Mon..Sat map back to the previous Sunday.
 */
export function getFantasyWeekStart(date: string | Date): string {
  const str = typeof date === "string" ? date : formatDate(date);
  const dow = dayOfWeek(str); // Sun=0..Sat=6
  return addDays(str, -dow);
}

/** The Saturday that ends the fantasy week containing `date`. */
export function getFantasyWeekEnd(date: string | Date): string {
  return addDays(getFantasyWeekStart(date), 6);
}

/** Full fantasy week (start, end, and all 7 dates) for any date. */
export function getFantasyWeek(date: string | Date): FantasyWeek {
  const start = getFantasyWeekStart(date);
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) dates.push(addDays(start, i));
  return { start, end: addDays(start, 6), dates };
}

/** The fantasy week after the one containing `date`. */
export function getNextFantasyWeek(date: string | Date): FantasyWeek {
  return getFantasyWeek(addDays(getFantasyWeekStart(date), 7));
}

/** The fantasy week before the one containing `date`. */
export function getPreviousFantasyWeek(date: string | Date): FantasyWeek {
  return getFantasyWeek(addDays(getFantasyWeekStart(date), -7));
}

/** Is `date` inside the fantasy week starting at `weekStart` (a Sunday)? */
export function isDateInFantasyWeek(date: string, weekStart: string): boolean {
  const end = addDays(weekStart, 6);
  return date >= weekStart && date <= end; // ISO date strings sort lexically
}

const WEEKDAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

/** Short weekday label for a date ("SUN".."SAT"). */
export function weekdayLabel(date: string): string {
  return WEEKDAY_LABELS[dayOfWeek(date)] ?? "";
}

const MONTH_LABELS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
] as const;

/** Human range label, e.g. "OCT 4 - OCT 10, 2026". */
export function formatWeekRange(weekStart: string): string {
  const start = parseDate(weekStart);
  const end = parseDate(addDays(weekStart, 6));
  const sMon = MONTH_LABELS[start.getUTCMonth()];
  const eMon = MONTH_LABELS[end.getUTCMonth()];
  const sD = start.getUTCDate();
  const eD = end.getUTCDate();
  const year = end.getUTCFullYear();
  if (sMon === eMon) return `${sMon} ${sD} - ${eD}, ${year}`;
  return `${sMon} ${sD} - ${eMon} ${eD}, ${year}`;
}

/** Today's calendar date in a given IANA tz (default Eastern), as "YYYY-MM-DD". */
export function todayInZone(timeZone = "America/New_York"): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  // en-CA yields "YYYY-MM-DD".
  return fmt.format(new Date());
}
