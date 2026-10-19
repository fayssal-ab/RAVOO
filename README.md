# RAVONEVERSLEEPS

Rewards hub for the Kick streamer **Ravo** (kick.com/ravoneversleeps). Viewers
sign up on Qzino with code **RAVO50**, wager, and compete here. The site is not
a casino and takes no deposits.

## Pages

- **Home**: mascot hero, Qzino perks, leaderboard band, Kick stream, milestones, store preview.
- **Leaderboard**: Q-boards points board with podium, countdown, search, rules and history.
- **Milestones**: lifetime wager tiers with a one-time cash reward each. Viewers claim, admin pays.
- **Stream**: Kick player when live (Ravo's banner when offline) and the weekly schedule.
- **Bonus hunts**: live hunt tracker with stats, biggest multi and break-even multi.
- **Raffles**: points tickets with a provably fair draw that viewers can re-check in the browser.
- **Store**: spend points on items. Each item needs a minimum rank.
- **Ranks**: 40 levels in 8 tiers, from lifetime points (XP).
- **Account**: Kick/Discord sign-in, Qzino username, points history.

Admin lives at **`/login`**. Credentials are `ADMIN_USERNAME` / `ADMIN_PASSWORD`
from `.env.local`. Every admin change is written to the audit log.

## Stack

Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · motion · MySQL 8
(`mysql2`, raw SQL migrations) · Zod · decimal.js for money.

Fonts come from Google via `next/font`:

| Font | Used for |
| --- | --- |
| Metal Mania | Display |
| Chakra Petch | Headings |
| Sora | Body text |
| JetBrains Mono | Numbers |
| Pixelify Sans | Small labels |

## Getting started

```bash
cp .env.example .env.local   # DB_*, ADMIN_*, SESSION_SECRET
npm install
npm run migrate              # creates the DB if allowed + applies db/migrations/*
npm run seed                 # 40 ranks, starter store items, starter milestones
npm run dev
```

The public leaderboard syncs automatically from Q-boards for **ravoneversleeps**.
It fetches event dates, prizes and every page of players from the public read
endpoints used by Q-boards itself; no casino API key is required. Rankings use Q-boards points exclusively (50 points displays as 50 pts).
Dollar wagers are never substituted for missing points. These snapshots are separate
from the manually verified wagers used by milestones.

Run `npm run migrate` to create `qboards_snapshots`. Set a strong `CRON_SECRET`
in the hosting environment (including Netlify Functions scope). On Netlify,
`netlify/functions/sync-leaderboard.mjs` calls the protected sync route every 6 hours
at **00:00, 06:00, 12:00 and 18:00 UTC** on published deploys. After deploying, use **Functions →
sync-leaderboard → Run now** for the first import. Other hosts can schedule a
GET or POST to `/api/cron/leaderboard` with `Authorization: Bearer <CRON_SECRET>`.
This repository prepares the scheduler; deploying and configuring the host is
required to activate it. Fetch failures keep the last successful snapshot, and
the public page shows its last sync time and flags delays over 9 hours.
The upstream endpoints are undocumented and may change.

Before the first successful sync the public leaderboard shows an empty state. **Admin → Leaderboard** still manages verified wager periods and CSV
imports for milestones; imported Q-boards points never grant milestone rewards.
Points are granted in **Admin → Users & points**, one at a time or as a bulk drop.

Viewer sign-in needs a Kick and/or Discord OAuth app (see `.env.example`).
Until those are set, the sign-in buttons are hidden.

If styles stop updating in dev, stop the server and delete `.next/`.
