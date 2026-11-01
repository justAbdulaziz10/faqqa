// Formatting helpers. No Intl/toLocale* here: Node and Safari disagree on Arabic
// locale output (calendar, digits), which breaks hydration on iPhone.

const MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

export function arDate(isoDate: string) {
  const d = new Date(isoDate + (isoDate.length === 10 ? "T00:00:00Z" : ""));
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

export function arMonth(m: number) {
  return MONTHS[m];
}

/** "1 نوفمبر، 6:05 م" in Riyadh time (UTC+3, no daylight saving). */
export function arDateTime(iso: string) {
  const d = new Date(Date.parse(iso) + 3 * 3_600_000);
  const h = d.getUTCHours();
  const m = String(d.getUTCMinutes()).padStart(2, "0");
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}، ${h % 12 || 12}:${m} ${h < 12 ? "ص" : "م"}`;
}

/** Removes Arabic diacritics (tashkeel) so model text matches the site's plain style. */
export function plain(s: string) {
  return s.replace(/[ً-ْٰ]/g, "");
}

export function deepPlain<T>(value: T): T {
  if (typeof value === "string") return plain(value) as T;
  if (Array.isArray(value)) return value.map(deepPlain) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, deepPlain(v)])) as T;
  }
  return value;
}

// Chance of truffles, from dry slate through rain and sand to red dune.
export const SCALE = [
  { min: 70, color: "#e0794a", label: "عالية" },
  { min: 45, color: "#e9cf8a", label: "متوسطة" },
  { min: 25, color: "#8cc4d8", label: "ضعيفة" },
  { min: 0, color: "#4d5d7e", label: "معدومة" },
] as const;

function band(score: number) {
  return SCALE.find((s) => score >= s.min) ?? SCALE[SCALE.length - 1];
}
export const scoreColor = (score: number) => band(score).color;
export const scoreLabel = (score: number) => band(score).label;
