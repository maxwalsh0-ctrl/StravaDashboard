# Strava Running Dashboard

A personal running dashboard that pulls my training data from Strava and uses AI to coach me on each run. Mobile-first, no build step, deployed on Vercel.

## What it does

- **Run overview** — key metrics for the latest run, with animated count-ups and a split-by-split bar visual
- **AI coach** — reads splits and laps, detects interval sessions, and ties each run back to my training plan and goal race
- **Mobile-first layout** — designed for checking straight after a run, on a phone

## How it's built

```
.
├── index.html        # The dashboard (HTML, CSS, JS in one file)
├── api/
│   ├── strava.js     # Serverless proxy to the Strava API
│   └── gemini.js     # Serverless proxy to Google Gemini (AI coaching)
├── vercel.json
└── .env.example      # Names of the environment variables needed (no values)
```

The browser never sees an API key. All secrets live in Vercel environment variables and are only used inside the two serverless functions:

- **`api/strava.js`** refreshes the Strava access token server-side and caches it between calls. It only forwards an allow-list of read-only endpoints (athlete, activities, single activity, gear), so the public URL can't be used for anything beyond what the dashboard needs.
- **`api/gemini.js`** sends run data to Gemini for coaching commentary, with the key kept on the server.

## Version 1 (private repo)

The first version was a single-file dashboard connecting to Strava, Gemini, Supabase and Open-Meteo. It's kept private because it was a personal build with credentials in the page. This repo is the rebuild that moves them server-side.

What version 1 does:

- **Overview** — latest run metrics, an AI summary of each run with the weather at the time, and heart rate plotted against distance
- **History** — pace and heart-rate trends, filterable from last week to all-time
- **Predictions** — race-time predictions for 5K, 10K, half and full marathon using the Riegel formula, plus a PB table
- **Equipment** — mileage per pair of shoes, pulled from Strava gear data
- **Training plan** — set a goal race, distance, time and date, and it generates a detailed four-week plan, monthly phases and a long-term periodisation chart
- **Storage** — goals, plans and AI summaries saved in Supabase so they survive between sessions and devices

What version 2 changed: API keys moved into Vercel serverless functions so they never reach the browser, with an allow-list of read-only Strava endpoints. The AI coach was made smarter (it reads splits and laps and detects intervals), and the layout was rebuilt mobile-first.

## Running it yourself

1. Create a Strava API application and get a client ID, client secret and refresh token.
2. Get a Gemini API key from Google AI Studio.
3. Add the values listed in `.env.example` to your Vercel project's environment variables.
4. Deploy. Every push to `main` redeploys automatically.
