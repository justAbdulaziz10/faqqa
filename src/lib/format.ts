const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
export function arDate(isoDate: string) {
  const d = new Date(isoDate + (isoDate.length === 10 ? "T00:00:00Z" : ""));
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]}`;
}
export function arMonth(m: number) { return months[m]; }

// Dry slate → rain → wet sand → red dune. Higher = more likely.
export const SCALE = [
  { min: 70, color: "#e0794a", label: "ممتاز" },
  { min: 45, color: "#e9cf8a", label: "واعد" },
  { min: 25, color: "#8cc4d8", label: "ضعيف" },
  { min: 0, color: "#4d5d7e", label: "شبه معدوم" },
] as const;
export function scoreColor(score: number) {
  return (SCALE.find((s) => score >= s.min) ?? SCALE[SCALE.length - 1]).color;
}
