const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
export function arDate(isoDate: string) {
  const d = new Date(isoDate + (isoDate.length === 10 ? "T00:00:00Z" : ""));
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]}`;
}
export function scoreColor(score: number) {
  if (score >= 70) return "#9fbf6b";
  if (score >= 45) return "#f2b45a";
  if (score >= 25) return "#d9694a";
  return "#7a6650";
}
