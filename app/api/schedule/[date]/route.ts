import { NextResponse } from "next/server";
import { getWeekSchedule } from "@/lib/nhl-api";

/**
 * GET /api/schedule/{date}
 * `date` is any "YYYY-MM-DD"; the response is the fantasy week (Sun-Sat)
 * containing it, fully built with derived metrics. Cached at the edge for an
 * hour, matching the data-service revalidation window.
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ date: string }> },
) {
  const { date } = await ctx.params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "Invalid date. Expected YYYY-MM-DD." },
      { status: 400 },
    );
  }
  try {
    const schedule = await getWeekSchedule(date);
    return NextResponse.json(schedule, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Unable to load the NHL schedule. ${message}` },
      { status: 502 },
    );
  }
}
