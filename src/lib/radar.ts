import { cacheLife } from "next/cache";
import { AREAS, type Area } from "./areas";

// Al-Wasm (الوسم) season starts on 16 October. Truffles typically emerge
// ~60–75 days after the first effective Wasm rain, especially with thunder.
export type AreaScore = Area & {
  score: number;
  label: "ممتاز" | "واعد" | "ضعيف" | "شبه معدوم";
  wasmRain: number;
  forecastRain: number;
  rainDays: number;
  thunderDays: number;
  soilMoisture: number | null;
  meanTemp: number | null;
  effectiveRainDate: string | null;
  emergenceWindow: { from: string; to: string } | null;
  daily: { date: string; rain: number; thunder: boolean; forecast: boolean }[];
};

export type Radar = {
  generatedAt: string;
  seasonStart: string;
  daysIntoSeason: number;
  source: string;
  areas: AreaScore[];
};

const DAY = 86_400_000;

export function seasonStartFor(now: Date) {
  const y = now.getUTCMonth() >= 6 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
  return new Date(Date.UTC(y, 9, 16));
}

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const iso = (d: Date) => d.toISOString().slice(0, 10);

type OpenMeteoPoint = {
  daily: { time: string[]; precipitation_sum: (number | null)[]; weather_code: (number | null)[]; temperature_2m_mean: (number | null)[] };
  hourly: { time: string[]; soil_moisture_3_to_9cm: (number | null)[] };
};

export async function buildRadar(now = new Date()): Promise<Radar> {
  const start = seasonStartFor(now);
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const daysIntoSeason = Math.max(0, Math.round((today.getTime() - start.getTime()) / DAY));
  const pastDays = clamp(daysIntoSeason, 1, 92);

  const params = new URLSearchParams({
    latitude: AREAS.map((a) => a.lat).join(","),
    longitude: AREAS.map((a) => a.lon).join(","),
    daily: "precipitation_sum,weather_code,temperature_2m_mean",
    hourly: "soil_moisture_3_to_9cm",
    past_days: String(pastDays),
    forecast_days: "7",
    timezone: "Asia/Riyadh",
  });

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
    next: { revalidate: 3 * 3600 },
  });
  if (!res.ok) throw new Error(`open-meteo ${res.status}`);
  const raw = (await res.json()) as OpenMeteoPoint | OpenMeteoPoint[];
  const points = Array.isArray(raw) ? raw : [raw];
  if (points.length !== AREAS.length) throw new Error("open-meteo: unexpected point count");

  const todayIso = iso(today);
  const nowHour = now.toISOString().slice(0, 13);

  const areas = AREAS.map((area, i) => {
    const p = points[i];
    const daily = p.daily.time.map((date, k) => ({
      date,
      rain: Math.round((p.daily.precipitation_sum[k] ?? 0) * 10) / 10,
      thunder: (p.daily.weather_code[k] ?? 0) >= 95,
      temp: p.daily.temperature_2m_mean[k],
      forecast: date > todayIso,
    }));
    const past = daily.filter((d) => !d.forecast && d.date >= iso(start));
    const future = daily.filter((d) => d.forecast);

    const wasmRain = round1(past.reduce((s, d) => s + d.rain, 0));
    const forecastRain = round1(future.reduce((s, d) => s + d.rain, 0));
    const rainDays = past.filter((d) => d.rain >= 2).length;
    const thunderDays = past.filter((d) => d.thunder).length;
    const temps = past.slice(-14).map((d) => d.temp).filter((t): t is number => t != null);
    const meanTemp = temps.length ? round1(temps.reduce((s, t) => s + t, 0) / temps.length) : null;

    let soilMoisture: number | null = null;
    for (let k = p.hourly.time.length - 1; k >= 0; k--) {
      const v = p.hourly.soil_moisture_3_to_9cm[k];
      if (v != null && p.hourly.time[k].slice(0, 13) <= nowHour) { soilMoisture = Math.round(v * 1000) / 1000; break; }
    }

    // First day the cumulative Wasm rain crossed 10 mm = "effective rain".
    let cum = 0;
    let effectiveRainDate: string | null = null;
    for (const d of past) { cum += d.rain; if (cum >= 10) { effectiveRainDate = d.date; break; } }
    const emergenceWindow = effectiveRainDate
      ? { from: iso(new Date(Date.parse(effectiveRainDate) + 60 * DAY)), to: iso(new Date(Date.parse(effectiveRainDate) + 75 * DAY)) }
      : null;

    const rainScore = clamp(wasmRain / 30);
    const thunderScore = clamp(thunderDays / 2);
    const soilScore = soilMoisture == null ? 0 : clamp((soilMoisture - 0.05) / 0.2);
    const tempScore = meanTemp == null ? 0.5 : meanTemp >= 12 && meanTemp <= 26 ? 1 : clamp(1 - Math.abs(meanTemp - 19) / 20);
    const forecastScore = clamp(forecastRain / 15);
    const weighted = 0.45 * rainScore + 0.15 * thunderScore + 0.15 * soilScore + 0.1 * tempScore + 0.15 * forecastScore;
    const score = Math.round(100 * weighted * area.ground);
    const label: AreaScore["label"] = score >= 70 ? "ممتاز" : score >= 45 ? "واعد" : score >= 25 ? "ضعيف" : "شبه معدوم";

    return {
      ...area,
      score,
      label,
      wasmRain,
      forecastRain,
      rainDays,
      thunderDays,
      soilMoisture,
      meanTemp,
      effectiveRainDate,
      emergenceWindow,
      daily: daily.filter((d) => d.date >= iso(start)).map(({ date, rain, thunder, forecast }) => ({ date, rain, thunder, forecast })),
    } satisfies AreaScore;
  }).sort((a, b) => b.score - a.score);

  return {
    generatedAt: now.toISOString(),
    seasonStart: iso(start),
    daysIntoSeason,
    source: "Open-Meteo (ECMWF / DWD ICON / ERA5)",
    areas,
  };
}

function round1(n: number) { return Math.round(n * 10) / 10; }

/** Cached radar: climate models update a few times a day, so serve it for hours. */
export async function getRadar(): Promise<Radar> {
  "use cache";
  cacheLife("hours");
  return buildRadar();
}
