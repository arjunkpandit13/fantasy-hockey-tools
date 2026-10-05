# Fantasy Hockey Tools

A fast, dark-mode-first fantasy hockey schedule dashboard. Fantasy weeks always
run **Sunday → Saturday**, enforced in the date logic (never ISO/Monday weeks).

Built with Next.js (App Router), React, TypeScript (strict), and Tailwind CSS.
Live NHL schedule data from the public NHL API (`api-web.nhle.com`); no hardcoded
schedule.

## Features (V1)

- Sunday–Saturday fantasy-week schedule matrix for all 32 NHL teams
- Games played (GP), opponents, home/away, off-nights, back-to-backs (incl.
  cross-week Saturday→Sunday detection)
- Off-night detection from actual league-wide game volume (configurable threshold)
- Schedule-only Streaming Score (0–100), formula isolated in `lib/streaming-score.ts`
- Week navigation (prev/this/next), Jump to Date, Today — works across the whole season
- Filters (conference, division, GP, off-night, back-to-back) + team search
- Sorting (GP, off-night, B2B, stream score, team) with a documented default chain
- Summary cards, daily slate strength, per-team detail drawer (this week + next week)
- Shareable URL state (`/schedule?week=YYYY-MM-DD`)
- Responsive: desktop matrix, mobile team cards; loading/empty/error states

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
```

## Build & test

```bash
npm run build      # production build
npm run start      # serve the production build
npm test           # 42 unit tests (fantasy-week, calculations, filter/sort)
```

## Architecture

- `lib/fantasy-week.ts` — Sunday–Saturday week math (UTC-noon anchored, no day-shift)
- `lib/timezone.ts` — centralized Eastern day-attribution (future user setting)
- `lib/schedule-calculations.ts` — GP, off-nights, B2B
- `lib/streaming-score.ts` + `lib/config.ts` — tunable scoring + off-night threshold
- `lib/nhl-api.ts` — swappable `ScheduleProvider` data-service layer
- `lib/integrations/` — V2 fantasy-platform seam (Fantrax stub + `docs/fantrax-api.md`)
- `app/api/schedule/[date]/route.ts` — server route (fetches NHL data server-side, cached)
- `components/` — presentational + the `ScheduleClient` state container

## Deploy to Vercel

This app has server-side API routes, so it needs a Node/serverless host (Vercel
is the natural fit). Push to GitHub, then import the repo at
[vercel.com/new](https://vercel.com/new) — it auto-detects Next.js and runs the
API routes as serverless functions.

## Notes / limitations

- NHL team logos are hotlinked from `assets.nhle.com`; schedule from NHL's public
  API. Fine for a personal/hobby site; not an official NHL product.
- Conference/division groupings are a static table (the per-game API doesn't carry
  them); abbreviations and logos are live.
