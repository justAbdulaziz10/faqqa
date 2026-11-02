# Faqqa feature map

These files describe what a client of Faqqa can do and how `verify-faqqa` proves each one.

| Feature | File | Drives |
|---|---|---|
| Home page shell | [home.md](home.md) | `home` |
| Trip advisor | [advisor.md](advisor.md) | `areas-index`, `advisor-validation` |
| Photo identifier | [identify.md](identify.md) | `identify`, `identify-retry`, `identify-validation` |
| Climate radar, area pages, reminders | [radar.md](radar.md) | `radar` (network); area pages and `.ics` checked by hand |

## Baseline preconditions

- `node_modules` is installed, and `$V up` returned `"ok": true`.
- `$V doctor` returns `"ok": true`.
- The Llama proxy is the local stub, never the real worker.

## Driving conventions

- `V=.agents/skills/verify-faqqa/bin/verify-faqqa.mjs`, run from the repo root.
- One instance per checkout. Drives reuse it, and `down` ends the session.
- Use routes and JSON fields as the handles. Error `code` values and the Arabic `message` strings are part of the user contract.

## Proof rules

- A drive passes only when every named check is `true`, and it exits 0.
- Check the Llama boundary through the stub log as well as the response.
- Keep `artifacts/verify/<feature>/<timestamp>/result.json` as evidence.
