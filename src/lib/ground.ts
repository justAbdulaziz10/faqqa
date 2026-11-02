import data from "@/data/ground.json";
import type { Area } from "./areas";

// The ground decides how much of a good rain turns into truffles. Weather can change daily; these
// don't, so they are measured once a season by scripts/ground-factors.py into src/data/ground.json.

export type GroundKey = "reputation" | "host" | "soil" | "grazing";

export type GroundFactor = {
  key: GroundKey;
  label: string;
  /** 0 (bad for truffles) to 1 (ideal). */
  fit: number;
  /** Plain words for the measurement behind the fit. */
  detail: string;
};

type Measured = { sand: number | null; clay: number | null; ph: number | null; springNdvi: number | null; livestock: number | null };

const MEASURED = data.areas as Record<string, Measured>;
export const GROUND_SOURCES = data.sources;
export const GROUND_MEASURED_AT = data.measuredAt;

/** How much each factor counts inside the ground score. */
export const GROUND_WEIGHTS: Record<GroundKey, number> = { reputation: 0.35, host: 0.25, soil: 0.2, grazing: 0.2 };
/** The worst possible ground keeps this share of the weather score; the best keeps all of it. */
export const GROUND_FLOOR = 0.55;

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Desert truffles (Terfezia, Tirmania) do best in sandy-loam to loam, alkaline, calcareous soil;
 * heavy clay holds water and resists the mycelium, and loose dune sand dries too fast.
 */
function soilFit(m: Measured) {
  if (m.sand == null || m.clay == null) return 0.5;
  const sand = m.sand >= 30 && m.sand <= 75 ? 1 : m.sand < 30 ? clamp((m.sand - 15) / 15) : clamp((90 - m.sand) / 15);
  const clay = clamp(1 - (m.clay - 20) / 25);
  const ph = m.ph == null ? 0.8 : m.ph >= 7 && m.ph <= 8.6 ? 1 : clamp(1 - Math.abs(m.ph - 7.8) / 1.5);
  return 0.4 * sand + 0.4 * clay + 0.2 * ph;
}

/** Spring green-up of the natural cover, a proxy for رقروق and the other dwarf shrubs that host truffles. */
const hostFit = (m: Measured) => (m.springNdvi == null ? 0.5 : clamp((m.springNdvi - 0.09) / 0.07));

/** Heavy sheep and goat grazing strips the host shrubs and packs the soil. */
const grazingFit = (m: Measured) => (m.livestock == null ? 0.5 : clamp(1 - m.livestock / 50));

/** Folk knowledge of how reliably the area gives truffles when the rain is right (0.6–1 in areas.ts). */
const reputationFit = (a: Area) => clamp((a.reputation - 0.6) / 0.4);

function soilWords(m: Measured) {
  if (m.sand == null || m.clay == null) return "ما عندنا قياس للتربة هنا";
  const kind = m.clay >= 32 ? "طينية ثقيلة" : m.clay >= 26 ? "طميية فيها طين" : m.sand >= 40 ? "رملية طميية" : "طميية";
  return `${kind}: رمل ${Math.round(m.sand)}٪ وطين ${Math.round(m.clay)}٪${m.ph != null && m.ph >= 7.2 ? "، وقلوية" : ""}`;
}

const hostWords = (fit: number) =>
  fit >= 0.7 ? "تخضر زين في الربيع، علامة على شجيرات مثل الرقروق" : fit >= 0.4 ? "اخضرارها في الربيع متوسط" : "اخضرارها في الربيع قليل، والرقروق غالبا متفرق";

/** Arabic counting for "head of livestock": 3–10 take the plural. */
const heads = (n: number) => (n <= 1 ? "رأس واحد" : n === 2 ? "رأسين" : n <= 10 ? `${n} رؤوس` : `${n} رأس`);

function grazingWords(m: Measured) {
  if (m.livestock == null) return "ما عندنا تقدير للرعي هنا";
  if (m.livestock < 5) return "رعي خفيف";
  const n = Math.round(m.livestock);
  return `${m.livestock < 20 ? "رعي متوسط" : "رعي كثيف"}، حوالي ${heads(n)} غنم وماعز لكل كم²`;
}

const reputationWords = (fit: number) =>
  fit >= 0.75 ? "مشهورة عند أهل البر بالفقع" : fit >= 0.4 ? "معروفة بالفقع في السنين الزينة" : "فقعها قليل حتى في السنين الزينة";

export function groundOf(area: Area) {
  const m = MEASURED[area.id] ?? { sand: null, clay: null, ph: null, springNdvi: null, livestock: null };
  const reputation = reputationFit(area);
  const host = hostFit(m);
  const factors: GroundFactor[] = [
    { key: "reputation", label: "سمعة المكان", fit: r2(reputation), detail: reputationWords(reputation) },
    { key: "host", label: "النبات المضيف", fit: r2(host), detail: hostWords(host) },
    { key: "soil", label: "التربة", fit: r2(soilFit(m)), detail: soilWords(m) },
    { key: "grazing", label: "الرعي", fit: r2(grazingFit(m)), detail: grazingWords(m) },
  ];
  const fit = factors.reduce((s, f) => s + GROUND_WEIGHTS[f.key] * f.fit, 0);
  return { factors, multiplier: r2(GROUND_FLOOR + (1 - GROUND_FLOOR) * fit) };
}

/**
 * Points each ground factor costs the final score. They add up to the gap between the weather
 * score and the final score, so the UI can say exactly what held an area back.
 */
export function groundCosts(weatherScore: number, factors: GroundFactor[]) {
  return factors.map((f) => ({ key: f.key, points: Math.round(weatherScore * (1 - GROUND_FLOOR) * GROUND_WEIGHTS[f.key] * (1 - f.fit)) }));
}
