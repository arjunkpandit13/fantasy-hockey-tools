# Fantrax REST API — reference (for future V2 integration)

> Status: **NOT wired up in V1.** V1 is schedule-only (see the product spec,
> §26/§27). This file preserves the Fantrax API contract so the roster-import
> and league-aware features can be built later against the provider seam in
> `lib/integrations/` without rediscovering the API. Nothing here is called at
> runtime yet.

Fantrax API version: **v1.8 (Beta)**.

## Conventions

- REST, JSON responses. Extra request data via query string **or** a JSON POST body.
- Base: `https://www.fantrax.com/fxea/general/`
- Example — identical result either way:
  - `GET /getAdp?sport=MLB`
  - `POST /getAdp` with body `{"sport":"NFL"}`

## Endpoints

### getPlayerIds — `GET /getPlayerIds?sport=NHL`
Fantrax player IDs that every other call uses to refer to players. No other params.

### getAdp — `GET /getAdp?sport=NHL`
ADP (Average Draft Pick) info for all players in a sport.
- `sport` (required): NFL, MLB, **NHL**, NBA, NCAAF, NCAAB, PGA, NASCAR, EPL
- `position` (optional): standard position abbreviations
- `showAllPositions`: "true" | "false" (default position vs all Fantrax positions)
- `start`, `limit`
- `order`: "Name" | "ADP" (defaults to ADP)

### getLeagues — `GET /getLeagues?userSecretId=...`
League list: each league's name/ID plus the team name(s)/ID(s) the user owns.
- `userSecretId` (required): the Secret ID shown on the Fantrax User Profile screen.
  **This is a user credential — never hardcode; collect per-user and store server-side only.**

### getLeagueInfo — `GET /getLeagueInfo?leagueId=[ID]`
Team names/IDs, matchups, player pool, most league config settings.
- `rosterPeriods` and (H2H) `scoringPeriods`: each `{number, startDate, endDate}` —
  maps a **calendar date → period number** used by `getTeamRosters(&period=N)`.
  (Our app's Sunday–Saturday fantasy week is independent of these; map between them in V2.)
- `scoringSystem.type`: ROTISSERIE | POINTS_BASED | HEAD_TO_HEAD_POINTS_BASED |
  HEAD_TO_HEAD_ROTI_SINGLE_WIN | HEAD_TO_HEAD_ROTI_MULTI_WIN | BRACKET
- H2H `playoffs`: `used`, `lastRegularSeasonPeriod`, `firstPlayoffPeriod`,
  `numPlayoffTeams`, `mergePlayoffPeriods`
- `excludePlayerInfo` (optional, "true"): omit the large `playerInfo` element.

### getDraftPicks — `GET /getDraftPicks?leagueId=[ID]`
Future and current draft picks. No params.

### getDraftResults — `GET /getDraftResults?leagueId=[ID]`
Draft results (live during a draft). Auction-in-progress adds live bid state:
`nominatedPlayerId`, `currentBid`, `currentBidTeamId`, `currentBidTimeRemainingSec`
(present only while a player is on the block).

### getTeamRosters — `GET /getTeamRosters?leagueId=[ID]&period=6`
All rosters: players, statuses, positions, and salary/contract data if used.
Defaults to the upcoming/current period (rolls over when the period's last game starts).
- `period` (optional): lineup period number (from `getLeagueInfo.rosterPeriods`).

### getStandings — `GET /getStandings?leagueId=[ID]`
Rank, points, W-L-T, games back, win %. (Per-stat detail is a future Fantrax release.)

### getMatchupScores — `GET /getMatchupScores?leagueId=[ID]&period=5`
H2H matchup scores for a scoring period (live by default).
- Category H2H: per-matchup `categories` with each category's value + W/L/T, plus
  `categoryWins`/`categoryLosses`/`categoryTies`.
- Points H2H: per-matchup `categories` with each category's raw `value`
  (+ formatted string) and `points` contributed. (Omitted for "count best players" leagues.)
- Each team also carries `gamesPlayed` for the period.
- `period` (optional): scoring period number (from `getLeagueInfo.scoringPeriods`).

## How this maps to our app (V2 plan)

- **Roster import**: `getLeagues` (needs `userSecretId`) → pick a league →
  `getLeagueInfo` (team/player pool + period schedule) → `getTeamRosters` for the
  user's team. Intersect roster player → NHL team with our weekly schedule to
  drive the Streamer Finder (spec §27).
- **Player IDs**: `getPlayerIds` + `getAdp` for sport=NHL give the player universe
  and draft value; join to NHL schedule by team.
- **Period mapping**: Fantrax periods are league-defined date ranges; our fantasy
  week is fixed Sunday–Saturday. Convert via the `{startDate,endDate}` ranges —
  do not assume they align.
- **Credential handling**: `userSecretId` is a secret. Collect it per user, keep it
  server-side (never in the client bundle or URL state), and call Fantrax only from
  a server route — same pattern as the existing `/api/schedule/[date]` route.
