# Faqqa (فقّاع) · AI Desert Truffle Radar for Saudi Arabia

> Where will desert truffles appear this season? Ask the data instead of guessing.

**Live:** https://faqqa.vercel.app

Every winter, thousands of Saudis head into the desert hunting for *faqaa* (desert truffles, *Terfezia*), which sell for hundreds of riyals per kilo. Folk wisdom says *"truffles come after the thunder of Al-Wasm"*, the autumn rain season that starts on 16 October. Faqqa turns that saying into numbers. It reads Wasm rainfall, thunder days, soil moisture and temperature from global climate models for 24 well-known truffle grounds in Saudi Arabia. **Meta Llama 4** then turns those numbers into a trip plan in Saudi dialect, and identifies truffle types from a photo.

The whole interface is in Arabic (RTL) and works on mobile and desktop.

> ⚠️ **Disclaimer:** Faqqa is a personal, educational project built for the Tuwaiq Academy bootcamp (with Meta and Startupbootcamp). All scores and AI answers are rough estimates, are **not 100% accurate**, and do not guarantee that truffles will be found anywhere.

## Features

| Feature | What it does |
|---|---|
| ⏳ **Answer-first hero** | Days until the first expected truffles and where, plus a season strip of real daily rain (thunder highlighted) against the expected truffle window. Shareable on WhatsApp. |
| 🗺️ **Live radar** | Interactive map that scores every truffle ground from 0 to 100. Shows daily Wasm rainfall, thunder days, soil moisture, temperature, the 7-day rain forecast and the expected emergence window. |
| ✨ **Ask Faqqa** | Ask in plain Arabic and pick your city. Llama reads the live data and returns a structured plan: the best 1 to 3 areas, timing, tips, safety notes and a confidence level. |
| 📍 **Home city** | Pick your city once (saved in the browser). Distances, "closest to me" sorting, the map marker and Ask Faqqa all use it. Each area has a directions link and a WhatsApp share. |
| 🌱 **Field guide** | An illustrated cross-section of the ground: Wasm rain, the Rogrog (*Helianthemum*) host plant, the cracked mound, and how deep to dig. |
| 📷 **Identify your truffle** | Upload a photo. Llama 4 Vision identifies the type (Zubaidi, Khalasi, Jibai, Hober), then estimates quality, freshness and an approximate price per kg. |

## Architecture

```
Browser (Next.js + Tailwind, Arabic RTL)
   │  POST /api/advisor   { question, originId }
   │  POST /api/identify  { image (data URL, resized client-side) }
   │  GET  /api/radar
   ▼
Next.js Route Handlers (Vercel)
   ├─ Input validation with zod (empty input, length limits, image format)
   ├─ Per-IP limits: 8 requests a minute, plus a daily cap (40 questions, 15 photos)
   ├─ Repeated questions answered from a cache keyed by the rain-data timestamp
   ├─ lib/radar.ts  → Open-Meteo (ECMWF / DWD ICON / ERA5) → scoring model (cached for 1h via "use cache")
   └─ lib/llama.ts  → Cloudflare Worker proxy (llama-worker/) → Workers AI @cf/meta/llama-4-scout-17b-16e-instruct
                       optional fallback: Vercel AI Gateway (off by default)
                       ├─ response_format: json_object
                       ├─ strict zod schema validation + check that every areaId really exists
                       └─ one automatic retry with the validation errors sent back to the model,
                          otherwise a clear error to the user (never a half-broken result)
```

No model credential reaches the browser: keys live only in server environment variables. The Cloudflare account is on the free plan with no payment method, so hitting the daily limit returns an error instead of a bill. A provider that reports its quota is used up is skipped until it resets, so fallbacks answer instantly.

## What Llama returns

The expected output format is defined in `src/lib/schemas.ts`, and every response is validated against it.

**Advisor** (`AdvisorSchema`):
```json
{
  "headline": "short title",
  "summary": "direct answer grounded in the data",
  "recommendations": [
    { "areaId": "rafha", "why": "reasoning with numbers", "bestTime": "when to go", "tip": "practical tip" }
  ],
  "seasonOutlook": "season outlook and expected emergence",
  "safety": ["safety note"],
  "confidence": "منخفضة | متوسطة | عالية"
}
```

**Photo identification** (`IdentifySchema`):
```json
{
  "isTruffle": true,
  "type": "زبيدي | خلاسي | جبي | هبر | غير محدد | ليس فقعاً",
  "confidence": 72,
  "description": "what the model sees",
  "quality": "ممتازة | جيدة | متوسطة | ضعيفة | غير معروف",
  "freshness": "freshness assessment",
  "priceRangeSar": { "min": 150, "max": 300 },
  "tips": ["cleaning / storage / cooking tip"],
  "warnings": ["spoilage or import warning"]
}
```

## Scoring model

```
weather = 0.45·rain + 0.15·thunder + 0.15·soil + 0.10·temp + 0.15·forecast
ground  = 0.35·reputation + 0.25·host + 0.20·soilType + 0.20·grazing
score   = 100 × weather × (0.55 + 0.45·ground)
```

| Factor | Source | Normalisation |
|---|---|---|
| `rain` | Accumulated rainfall since 16 Oct (Wasm start) | full at 30 mm |
| `thunder` | Days with thunderstorm weather codes (≥ 95) | full at 2 days |
| `soil` | Soil moisture at 3–9 cm depth | 0.05 → 0.25 m³/m³ |
| `temp` | Mean temperature over the last 14 days | ideal 12–26 °C |
| `forecast` | Rain expected in the next 7 days | full at 15 mm |
| `reputation` | How well known the area is for truffles (folk knowledge, `areas.ts`) | 0.6 → 1.0 |
| `host` | Spring green-up of natural cover, a proxy for Rogrog (*Helianthemum*) and other host shrubs: MODIS MOD13Q1 NDVI, greenest composite Feb 18 – Apr 6, median of 2021–2025 over ~17×17 km, irrigated pixels (NDVI > 0.4) dropped | NDVI 0.09 → 0.16 |
| `soilType` | ISRIC SoilGrids 2.0, sand / clay / pH at 0–15 cm. Sandy loam to loam and alkaline is best; heavy clay and loose dune sand score lower | see `src/lib/ground.ts` |
| `grazing` | FAO Gridded Livestock of the World 4 (2015), sheep + goats per km² over ~50×50 km (no camel layer) | 0 → 50 head/km² |

Weather changes every few hours; the ground factors don't, so `scripts/ground-factors.py` measures them once a season into `src/data/ground.json`. The radar panel and each area page show how many points each ground factor took off the weather score ("ليش فرصتها كذا؟"). GBIF occurrence records of *Helianthemum* were tried for the host factor and rejected: 97% of the Saudi records come from a single survey, so a missing record does not mean a missing plant.

The score is shown to users as one of four words: **عالية** (high, ≥ 70), **متوسطة** (medium, ≥ 45), **ضعيفة** (low, ≥ 25) and **معدومة** (none).

When accumulated rain first crosses **10 mm** ("effective rain"), the expected emergence window is **60–75 days** later.

The scoring is a transparent heuristic, not a scientifically validated model. Llama only explains these numbers. The numbers shown on the cards always come from our data, never from the model's text.

## Error handling

| Case | Behaviour |
|---|---|
| Empty or too long question, unsupported image format | `400` with a clear Arabic message |
| Llama returns malformed or incomplete JSON | automatic retry with the errors fed back, then `502` |
| Llama invents an area that isn't in the data | rejected by validation and retried |
| Llama unavailable or timeout (45 s) | `502` with a friendly message |
| Climate API down | the page shows a notice instead of crashing |
| Too many requests from one IP | `429` |

## Project structure

```
src/
  app/
    page.tsx              # landing page: hero, radar, advisor, photo identifier
    about/ terms/ privacy/ # how it works, terms & disclaimer, privacy
    api/radar/route.ts    # live scores (GET)
    api/advisor/route.ts  # Llama trip advisor (POST)
    api/identify/route.ts # Llama vision identifier (POST)
  components/             # RadarMap (Leaflet), RadarSection, Advisor, Identify, ...
  lib/
    areas.ts              # truffle grounds + origin cities
    radar.ts              # Open-Meteo fetch + scoring model
    ground.ts             # soil, host plant, grazing and reputation factors
  data/ground.json        # measured ground factors (from scripts/ground-factors.py)
    llama.ts              # Llama client: JSON coercion, validation, retry
    schemas.ts            # zod schemas for requests and Llama output
llama-worker/             # optional fallback: Cloudflare Worker proxy to Workers AI
```

## Running locally

```bash
npm install
# .env.local: LLAMA_PROXY_URL and LLAMA_PROXY_SECRET from your deployed llama-worker (see below)
npm run dev
```

### Optional: Vercel AI Gateway

Set `AI_GATEWAY_ENABLED=1` on Vercel (OIDC auth) or `AI_GATEWAY_API_KEY` elsewhere. Its free monthly credits need a card on file on the Vercel team, so it is off by default.

### Cloudflare Workers AI proxy

`llama-worker/` is a small proxy to Workers AI. Deploy it with `npx wrangler deploy` and `npx wrangler secret put PROXY_SECRET`, then set `LLAMA_PROXY_URL` and `LLAMA_PROXY_SECRET`. Its free plan allows 10,000 neurons a day, which is roughly 100 to 150 calls once photos are involved.

## Tech stack

Next.js 16 (App Router, Cache Components) · React 19 · TypeScript · Tailwind CSS 4 · zod · Leaflet with Esri World Imagery tiles · Meta Llama 4 Scout on Cloudflare Workers AI · Vercel

## Data sources and licences

- Weather and climate: [Open-Meteo](https://open-meteo.com) (CC BY 4.0), which aggregates ECMWF, DWD ICON and ERA5
- Soil: [ISRIC SoilGrids 2.0](https://soilgrids.org) (CC BY 4.0)
- Vegetation: NASA MODIS MOD13Q1 NDVI via the [ORNL DAAC MODIS web service](https://modis.ornl.gov/data/modis_webservice.html) (public domain)
- Livestock: FAO [Gridded Livestock of the World 4](https://dataverse.harvard.edu/dataverse/glw_4) (CC0)
- Satellite imagery and map labels: © Esri, Maxar, Earthstar Geographics
- Hero image: AI-generated with FLUX.1 [schnell] on Cloudflare Workers AI
- AI model: Meta Llama 4, subject to the [Llama 4 Community License](https://www.llama.com/llama4/license/)

## Limitations

- Climate models estimate rain on a coarse grid, so the real rain in a specific *rawdah* or valley can differ.
- Area coordinates are approximate and represent well-known regions, not confirmed spots.
- Ground factors are coarse: SoilGrids is weak in deserts, spring green-up tracks shrubs in general rather than Rogrog itself, and the livestock map is from 2015 with no camels.
- Photo identification and prices are rough guidance only.

---

Built by [Abdulaziz Alkhlaiwe](https://github.com/justAbdulaziz10) · [☕ Buy me a coffee](https://buymeacoffee.com/someoneveryverybored)
