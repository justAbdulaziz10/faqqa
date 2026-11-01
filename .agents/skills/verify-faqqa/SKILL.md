---
name: verify-faqqa
description: Launch and drive Faqqa (فقاع, the Next.js truffle radar) over real HTTP against `next dev`, with the Llama proxy replaced by a local stub, and capture evidence. Use to prove a change to the home page, /api/advisor, /api/identify, or /api/radar actually works, or to check that a feature is broken.
---

# verify-faqqa

Faqqa is a Next.js 16 app (App Router, Turbopack). In this checkout, users touch these surfaces:

- **HTTP API** (primary): `GET /api/advisor`, `POST /api/advisor`, `POST /api/identify`, `GET /api/radar`.
- **Web page** `/`: the RTL Arabic layout (header, footer, skip link). The body has the hero with the season strip, the rain map, Ask Faqqa and the photo check.

The harness is the control CLI `bin/verify-faqqa.mjs`. It starts `next dev` on a free port, plus a local Llama stub that stands in for `/llama-worker`, the same boundary production isolates. Then it drives the routes with `fetch`. Every command prints one JSON object and exits nonzero when `"ok": false`.

```sh
V=.agents/skills/verify-faqqa/bin/verify-faqqa.mjs   # run from the repo root
$V --help
```

Read `node_modules/next/dist/docs/` before changing Next code. This Next version differs from training data (see AGENTS.md).

## Launch

Prerequisite: `node_modules` exists. If it does not, run `npm ci --offline` (from the npm cache) or `npm ci`.

```sh
$V up            # or: $V up --port 3100
```

`up` sets `LLAMA_PROXY_URL` to the stub, sets `LLAMA_PROXY_SECRET=verify-faqqa-secret`, and turns off telemetry. It counts the instance as ready only after the log line `✓ Ready in` appears **and** `GET /api/advisor` returns 200. That takes about 20 s cold. It returns `base`, the PIDs, and log paths. State lives in `artifacts/verify/.run/state.json`, alongside the logs `next-dev.log` and `stub-calls.jsonl` (one line per Llama call: auth header, model, forwarded image, and whether it was a retry with feedback).

Teardown: `$V down`.

## Doctor

```sh
$V doctor
```

Read-only. It checks that the next and stub PIDs from our state file are alive, that `GET /api/advisor` answers with `ok:true`, that the stub rejects an unauthenticated call (401), that the next log shows our port, and it reports the Next version (expected `16.4.3`). Run it before the first drive and after anything surprising. If it fails, run `down` then `up`.

## Drive

```sh
$V drive <feature>      # one drive
$V drive all            # every offline drive
```

| feature | user action | self-check (fails on mismatch) |
|---|---|---|
| `home` | `GET /` | 200, `<html lang="ar" dir="rtl">`, `<title>` contains `فقاع`, skip link to `#main` |
| `areas-index` | `GET /api/advisor` | `ok:true`, `areas` = 24, 13 origins including `riyadh` |
| `advisor-validation` | `POST /api/advisor` with an empty question, a 601-character question, and no body | each returns 400 `invalid_input` with the exact Arabic message, and Llama is **not** called |
| `identify` | `POST /api/identify` with a 1×1 PNG data URL and a note | 200, `model` `Llama 4 Scout (Vision)`, `attempts` 1, `type` `زبيدي`, price 300–600. The stub saw exactly one call with `Bearer` auth, the vision model id, and **the same image the user sent** |
| `identify-retry` | `POST /api/identify` with the note `STUB_BAD_FIRST` (the stub answers invalid JSON first) | 200, `attempts` 2, two stub calls, the second carrying the validation feedback |
| `identify-validation` | `POST /api/identify` with a GIF, then with an empty image | 400 with the exact Arabic messages, and Llama is not called |
| `radar` | `GET /api/radar` (**needs `--allow-network`**) | 200, 24 areas sorted by score, scores 0–100, and `seasonStart` ends `-10-16` |

The details for each feature are in [features/README.md](features/README.md).

Not drivable offline: `POST /api/advisor` with a valid question. It calls `buildRadar()`, which fetches `api.open-meteo.com` before Llama is called. `drive all` skips `radar` for the same reason.

## Evidence

Each drive writes `artifacts/verify/<feature>/<timestamp>/result.json`, which holds the request, status, full response body, the stub calls during the drive, and every named check. `home` also writes `home.html`. `artifacts/` is git-ignored.

Proof rules:

- Drive the real routes over HTTP. Never import route handlers or call internal functions.
- Assert both the response and the side effect at the Llama boundary (`stub-calls.jsonl`). A 200 with a plausible body is not enough: the deliberately broken route that dropped the photo still returned 200 `ok:true`.
- Mock only the Llama proxy, never Open-Meteo responses or zod schemas.
- A `drive` with `"ok": false` is a failure even if the HTTP status was 200.

## Cleanup

```sh
$V down
```

`down` signals only the process groups of the PIDs recorded in our state file, never by process name, then deletes the state file. Evidence under `artifacts/verify/` survives.

## Isolation and danger

- Run one instance per checkout. `next dev` takes a lock in `.next/dev`, and `up` refuses to start while our state file shows live PIDs. Other worktrees can run their own instance on other ports.
- Never point `LLAMA_PROXY_URL` at the real Cloudflare worker (`llama-worker/`) during verification. That costs Workers AI quota and needs the real secret, which requires the user's approval.
- `--allow-network` contacts Open-Meteo, a free public API with no side effects. It is still an external call, so it is off by default.
- `next/font/google` in `layout.tsx` tries to fetch Google Fonts. Offline, Next falls back and the page still renders, so `home` does not check fonts.
- Do not run `next build` as part of a drive: it fetches the fonts and is slow. It is not needed to drive the dev server.

## Proven vs unproven (2026-11-01)

- **Proven**: `up`, `doctor`, all six offline drives, a break that the drive caught, `down`, and the evidence surviving teardown. The break replaced the forwarded image with `""` in `src/app/api/identify/route.ts`. The route still returned 200, and `identify` failed with `photoForwarded`.
- **Unproven**: the `radar` drive (no network allowed in the run that built this skill), the full advisor answer flow (needs Open-Meteo), and the real Llama worker. Wire up an advisor drive once Open-Meteo can be stubbed or the network is allowed.

Keep this skill current with `maintain-verification-skill`.
