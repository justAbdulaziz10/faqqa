# Trip advisor

The advisor answers a user's Arabic question about where to hunt truffles. It ranks areas by live climate data and the distance from the user's city, then asks Llama for 1–3 recommendations that must use real area IDs.

## Sub-features

- `advisor-index`: `GET /api/advisor` lists the area count and origin city IDs.
- `advisor-validate`: rejects an empty question, a question over 600 characters, or a missing body, without calling Llama.
- `advisor-answer`: a valid question returns headline, summary, recommendations with area coordinates and distance, safety tips, and confidence. **Unproven offline.**

## How to get to it (user POV)

- A client posts `{ "question": "...", "originId": "riyadh" }` to `/api/advisor`.
- A client loads `/api/advisor` to get the city list for the origin picker.

## Driving it with verify-faqqa

Preconditions:

- Baseline preconditions from README.md.

- **City list.** Run `$V drive areas-index`. The response is `ok:true`, `areas` is 24, and `origins` has 13 entries including `riyadh`.
- **Bad input.** Run `$V drive advisor-validation`. Each request returns 400 `invalid_input`: an empty question gives `اكتب سؤالك أول`, a 601-character question gives `السؤال طويل. الحد 600 حرف`, and no body also returns 400. `llamaNotCalled` is true.
- **Answer (manual, network).** Run `curl -s -XPOST $BASE/api/advisor -H 'content-type: application/json' -d '{"question":"وين أطلع الأسبوع الجاي؟","originId":"riyadh"}'`. Open-Meteo is needed. The stub returns an identify-shaped payload, so expect 502 `llama_invalid` until the stub learns the advisor shape.

## Gotchas

- Validation runs before `buildRadar()`. Every valid question contacts `api.open-meteo.com`.
- If the area or origin counts change in `src/lib/areas.ts`, update `areas-index` in the CLI.
- An unconfigured proxy returns 503 `llama_unconfigured`. `up` always configures the stub, so this path is not driven.
