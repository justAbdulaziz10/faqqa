import type { Advisor } from "./schemas";
import type { AreaScore } from "./radar";
import { arDate, scoreLabel } from "./format";

/** Obvious attempts to change the assistant's role or pull its instructions. */
const INJECTION = [
  /ignore (all |any |the )?(previous|prior|above|earlier)/i,
  /disregard (all |the )?(previous|prior|above|instructions)/i,
  /(system|hidden|initial) prompt/i,
  /\b(jailbreak|DAN|developer mode)\b/i,
  /you are (now|no longer)|act as|pretend (to be|you)/i,
  /تجاهل (كل |جميع )?(التعليمات|الأوامر|اللي قبل|ما سبق|السابق)/,
  /انس[ىا]? (كل )?(التعليمات|الأوامر|اللي قبل|دورك)/,
  /(اطبع|اكتب|ارسل|أرسل|وش|ما هي|اعطني|عطني) (لي )?(التعليمات|البرومبت|الأوامر|تعليماتك|البرومت)/,
  /(أنت|انت) الحين|من الحين (أنت|انت)|تقمص|غير دورك/,
];

const GREETING = /^(السلام عليكم|سلام|هلا|اهلين|أهلين|اهلا|أهلا|مرحبا|مرحباً|هاي|hi|hello|hey|صباح الخير|مساء الخير)[\s!.؟?،]*$/i;

export function isInjection(q: string) {
  return INJECTION.some((r) => r.test(q));
}

export function cannedReply(q: string): Advisor | null {
  if (isInjection(q)) {
    return {
      kind: "reply",
      headline: "أنا فقاع، وشغلي الفقع بس",
      summary: "ما أقدر أغير دوري أو أشارك تعليماتي، بس أبشر بأي شي عن الفقع. جرب واحد من هذي:",
      recommendations: [],
      seasonOutlook: "",
      safety: [],
      confidence: "عالية",
    };
  }
  if (GREETING.test(q.trim())) {
    return {
      kind: "reply",
      headline: "هلا والله",
      summary: "أنا فقاع، أقرأ مطر الوسم في 24 منطقة وأقول لك وين تروح ومتى. جرب تسأل:",
      recommendations: [],
      seasonOutlook: "",
      safety: [],
      confidence: "عالية",
    };
  }
  return null;
}

/** A plain answer straight from the data, used when Llama is unavailable. */
export function fallbackPlan(areas: (AreaScore & { distanceKm: number | null })[], today: string): Advisor {
  const ranked = [...areas].sort((a, b) => b.score - (b.distanceKm ?? 0) / 40 - (a.score - (a.distanceKm ?? 0) / 40));
  const alive = ranked.filter((a) => a.label !== "معدومة");
  const nearest = [...areas].sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))[0];
  // Recommend only places with some chance; if nothing has rain yet, point at the nearest one.
  const picks = alive.length ? alive.slice(0, 3) : nearest ? [nearest] : [];

  const first = [...areas].filter((a) => a.emergenceWindow).sort((a, b) => a.emergenceWindow!.from.localeCompare(b.emergenceWindow!.from))[0];
  const days = first ? Math.round((Date.parse(first.emergenceWindow!.from) - Date.parse(today)) / 86_400_000) : null;

  return {
    kind: "plan",
    headline: !first ? "الموسم لسا بدري" : days! > 0 ? `أول فقع متوقع بعد ${days} يوم` : "وقت الفقع بدأ",
    summary: first
      ? `أقرب موعد للفقع في ${first.name}، والفقع متوقع فيها بين ${arDate(first.emergenceWindow!.from)} و${arDate(first.emergenceWindow!.to)}.`
      : "ما نزل مطر كافي على أي منطقة للحين. الفقع يحتاج 10 ملم أو أكثر من مطر الوسم.",
    recommendations: picks.map((a) => ({
      areaId: a.id,
      why: `نزل عليها ${a.wasmRain} ملم من بداية الوسم${a.thunderDays === 1 ? " مع يوم رعد" : a.thunderDays === 2 ? " مع يومين رعد" : a.thunderDays > 2 ? ` مع ${a.thunderDays} أيام رعد` : ""}، والفرصة ${scoreLabel(a.score)}.`,
      bestTime: a.emergenceWindow ? `بين ${arDate(a.emergenceWindow.from)} و${arDate(a.emergenceWindow.to)}` : "لسا ما نزل عليها مطر كافي",
      tip: "دور حول نبتة الرقروق وعند الأرض المفطورة، والصبح بدري أحسن.",
    })),
    seasonOutlook: first ? `أول فقع متوقع من ${arDate(first.emergenceWindow!.from)}.` : "ننتظر مطر الوسم.",
    safety: ["لا تدخل الأودية وقت السيل", "خذ ماء ووقود زيادة"],
    confidence: "منخفضة",
  };
}
