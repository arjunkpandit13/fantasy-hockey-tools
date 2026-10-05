import { NextResponse } from "next/server";
import { getLeagueRosters } from "@/lib/integrations/fantrax";
import { CONFIG } from "@/lib/config";

/**
 * GET /api/fantrax/rosters
 * Returns the configured Fantrax league's name + every team's roster, each
 * player resolved to an NHL team abbreviation. League-ID only (no credential).
 * The client ranks these against whatever WeekSchedule it already holds, so
 * this route is week-agnostic and cacheable.
 */
export async function GET() {
  try {
    const data = await getLeagueRosters(CONFIG.fantrax.leagueId);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Unable to load Fantrax rosters. ${message}` },
      { status: 502 },
    );
  }
}
