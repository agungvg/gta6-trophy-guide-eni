# gta6-trophy-guide-eni

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/agungvg/gta6-trophy-guide-eni/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/agungvg/gta6-trophy-guide-eni/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

Leonida Legend — the complete offline guide and tracker for all 55 GTA VI PlayStation 5 trophies.

Every trophy carries its official name, description and grade, plus a guide written for this entry in its own words that cites its sources — with numbered steps, the PSN progress target where one exists, and an honest status: 42 confirmed, 8 reported, 5 not yet confirmed by any published guide as of 20 Nov 2026 (those five say so instead of guessing).

What it does:

- **Tracker** — a checklist saved in the browser, with export and import, filters by kind and grade, search, hide-earned, and per-trophy notes.
- **Next-up planner** — the next three unearned trophies in roadmap order, missable first.
- **Roadmap** — five stages to the platinum, each with its own earned progress bar.
- **Missable warning** — Positive Mental Attitude is the only trophy any published guide flags as possibly missable (meditate at Jason's house in Chapter 1).
- **Spoiler-safe mode** — story trophy names and descriptions stay hidden until earned.
- **Source matrix** — a table showing what each named source was used for and how many trophies cite it.
- **Offline** — static files only, no network requests, no Rockstar artwork or logo.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Or serve `app/` with any static server and open `index.html` — it works with the network off.

## Screenshots

All four are real renders of the app in a desktop browser (1280×800):

1. `1-cover.png` — hero, audit strip, progress (3 of 55 earned) and the next-up planner.
2. `2-guide.png` — the missable trophy's guide open: numbered steps, sources, note box.
3. `3-roadmap.png` — the five roadmap stages with per-stage progress.
4. `4-sources.png` — the source matrix and the sources & method section.

## Verify it

```sh
node --check app/app.js
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts   # writes out/dossier.json
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=p9r33tb4&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
