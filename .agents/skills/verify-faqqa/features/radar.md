# Climate radar

`GET /api/radar` scores the 24 known truffle grounds from Open-Meteo rain, thunder, soil moisture, temperature, and the 7-day forecast since the Wasm season start (16 October). It returns them sorted by score, each with a label and an expected emergence window.

## Sub-features

- `radar-scores`: 24 areas, scores 0–100, sorted from best to worst.
- `radar-season`: `seasonStart` is 16 October of the current season.
- `radar-unavailable`: an upstream failure returns 502 `climate_unavailable`.

## How to get to it (user POV)

- A client loads `/api/radar` (cached for 3 h).

## Driving it with verify-faqqa

Preconditions:

- Baseline preconditions from README.md.
- Network access to `api.open-meteo.com` is allowed for this run.

- **Scores.** Run `$V drive radar --allow-network`. Expect 200, `areas24`, `sortedByScore`, `scoresInRange`, and `seasonStartOct16`.
- **No network.** Run `$V drive radar` without the flag. The result is `ok:false` with the reason `rerun with --allow-network`, not a pass.

## Gotchas

- **Unproven**: this drive has never been executed. The build run had no network permission.
- The response is cached (`revalidate` 3 h). Restart `up` to get fresh upstream data.


## Area pages and calendar reminders

Both read the same cached radar, so they need network access to Open-Meteo, the same as the `radar` drive. There is no scripted drive yet; check them by hand:

- `GET /area/<id>` returns 200 for every id in `src/lib/areas.ts`. The `<title>` is "الفقع في <name>: متى يطلع هالسنة؟", and there is FAQPage JSON-LD whenever radar data loaded.
- `GET /area/<unknown>` renders the not-found page with `<meta name="robots" content="noindex">`.
- `GET /api/remind/<id>` for an area with an `emergenceWindow` returns `text/calendar` with an all-day `VEVENT` from the window start to the day after its end, plus a `VALARM` with `TRIGGER:-P2D`.
- Without a window it returns 404 with code `no_window`; an unknown id returns 404 with code `unknown_area`.
- `/sitemap.xml` lists all 24 `/area/` URLs.
