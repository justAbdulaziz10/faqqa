// Well-known truffle (فقع) grounds in Saudi Arabia.
// `reputation` (0.6–1.0) encodes folk knowledge of how reliably each area produces truffles
// when the rains are right. It is a heuristic, not a measurement; soil, host plants and grazing
// are measured separately (see ground.ts).
export type Area = {
  id: string;
  name: string;
  region: string;
  lat: number;
  lon: number;
  reputation: number;
};

export const AREAS: Area[] = [
  { id: "hafr", name: "حفر الباطن", region: "الشرقية", lat: 28.43, lon: 45.97, reputation: 1 },
  { id: "summan", name: "الصمان", region: "الشرقية", lat: 26.9, lon: 47.3, reputation: 0.95 },
  { id: "rafha", name: "رفحاء", region: "الحدود الشمالية", lat: 29.63, lon: 43.5, reputation: 1 },
  { id: "lina", name: "لينة", region: "الحدود الشمالية", lat: 28.75, lon: 43.77, reputation: 0.95 },
  { id: "uwayqilah", name: "العويقيلة", region: "الحدود الشمالية", lat: 30.33, lon: 42.83, reputation: 0.9 },
  { id: "arar", name: "عرعر", region: "الحدود الشمالية", lat: 30.97, lon: 41.02, reputation: 0.85 },
  { id: "turaif", name: "طريف", region: "الحدود الشمالية", lat: 31.67, lon: 38.66, reputation: 0.85 },
  { id: "qurayyat", name: "القريات", region: "الجوف", lat: 31.33, lon: 37.34, reputation: 0.8 },
  { id: "dumat", name: "دومة الجندل", region: "الجوف", lat: 29.81, lon: 39.87, reputation: 0.8 },
  { id: "sakaka", name: "سكاكا", region: "الجوف", lat: 29.97, lon: 40.2, reputation: 0.75 },
  { id: "nafud", name: "أطراف النفود الكبير", region: "حائل", lat: 28.3, lon: 40.8, reputation: 0.8 },
  { id: "baqaa", name: "بقعاء", region: "حائل", lat: 27.89, lon: 42.4, reputation: 0.85 },
  { id: "taymaa", name: "تيماء", region: "تبوك", lat: 27.63, lon: 38.55, reputation: 0.65 },
  { id: "asyah", name: "الأسياح", region: "القصيم", lat: 26.75, lon: 44.2, reputation: 0.8 },
  { id: "artawiyah", name: "الأرطاوية", region: "الرياض", lat: 26.5, lon: 45.35, reputation: 0.85 },
  { id: "zulfi", name: "الزلفي", region: "الرياض", lat: 26.3, lon: 44.8, reputation: 0.75 },
  { id: "majmaah", name: "المجمعة", region: "الرياض", lat: 25.9, lon: 45.35, reputation: 0.7 },
  { id: "rumah", name: "رماح", region: "الرياض", lat: 25.57, lon: 47.16, reputation: 0.8 },
  { id: "khuraim", name: "روضة خريم", region: "الرياض", lat: 25.38, lon: 47.25, reputation: 0.7 },
  { id: "dahna", name: "الدهناء", region: "الرياض", lat: 25.9, lon: 47.6, reputation: 0.75 },
  { id: "olaya", name: "قرية العليا", region: "الشرقية", lat: 27.55, lon: 47.7, reputation: 0.9 },
  { id: "nuayriyah", name: "النعيرية", region: "الشرقية", lat: 27.47, lon: 48.49, reputation: 0.85 },
  { id: "sarrar", name: "الصرار", region: "الشرقية", lat: 26.98, lon: 48.38, reputation: 0.8 },
  { id: "shamli", name: "الشملي", region: "حائل", lat: 26.98, lon: 40.07, reputation: 0.65 },
];

export const AREA_IDS = new Set(AREAS.map((a) => a.id));

export type Origin = { id: string; name: string; lat: number; lon: number };

export const ORIGINS: Origin[] = [
  { id: "riyadh", name: "الرياض", lat: 24.71, lon: 46.68 },
  { id: "jeddah", name: "جدة", lat: 21.49, lon: 39.19 },
  { id: "makkah", name: "مكة المكرمة", lat: 21.39, lon: 39.86 },
  { id: "madinah", name: "المدينة المنورة", lat: 24.47, lon: 39.61 },
  { id: "dammam", name: "الدمام", lat: 26.43, lon: 50.1 },
  { id: "ahsa", name: "الأحساء", lat: 25.38, lon: 49.59 },
  { id: "buraydah", name: "بريدة", lat: 26.33, lon: 43.97 },
  { id: "hail", name: "حائل", lat: 27.52, lon: 41.69 },
  { id: "sakaka", name: "سكاكا", lat: 29.97, lon: 40.2 },
  { id: "arar", name: "عرعر", lat: 30.97, lon: 41.02 },
  { id: "hafr", name: "حفر الباطن", lat: 28.43, lon: 45.97 },
  { id: "tabuk", name: "تبوك", lat: 28.38, lon: 36.57 },
  { id: "abha", name: "أبها", lat: 18.22, lon: 42.5 },
];

export function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  // Road distance is roughly 1.25x the great-circle distance in the Saudi desert.
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 1.25);
}
