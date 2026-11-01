import { NextResponse } from "next/server";
import { AREAS, AREA_IDS, ORIGINS, distanceKm } from "@/lib/areas";
import { buildRadar } from "@/lib/radar";
import { askLlamaJson } from "@/lib/llama";
import { AdvisorRequest, AdvisorSchema } from "@/lib/schemas";
import { fail, failFromError } from "@/lib/http";

export const maxDuration = 60;

const SYSTEM = `أنت «فقّاع»: خبير سعودي في الفقع (الكمأ) يجمع بين خبرة أهل البر والعلم الحديث.
مهمتك: الإجابة على سؤال المستخدم بالاعتماد فقط على بيانات المناخ الحية المرفقة (أمطار الوسم، أيام الرعد، رطوبة التربة، الحرارة، توقعات المطر، والمسافة من مدينته).

قواعد صارمة:
- لا تخترع أرقاماً أو أماكن. استخدم فقط معرفات المناطق (areaId) الموجودة في البيانات.
- إذا كانت المؤشرات ضعيفة فقلها بصراحة ولا تبالغ. الفقع يطلع عادة بعد ٦٠–٧٥ يوماً من أول مطر وسم فعّال (١٠ ملم أو أكثر)، والرعد يزيد الفرص.
- اكتب بالعربية بلهجة سعودية بيضاء ودودة، باختصار ووضوح.
- راعِ المسافة من مدينة المستخدم ووقته.
- السلامة: ذكّر بعدم دخول الأودية وقت السيل، وأخذ الماء والوقود، وعدم الدخول لأراضٍ خاصة أو محميات.

أرجع JSON فقط بهذا الشكل بالضبط:
{
  "headline": "عنوان قصير جذاب",
  "summary": "ملخص الوضع والإجابة المباشرة على سؤاله",
  "recommendations": [{"areaId": "معرف من البيانات", "why": "ليش هذا المكان بالأرقام", "bestTime": "أفضل توقيت للطلعة", "tip": "نصيحة عملية"}],
  "seasonOutlook": "نظرة على الموسم وموعد الطلوع المتوقع",
  "safety": ["نصيحة سلامة"],
  "confidence": "منخفضة" أو "متوسطة" أو "عالية"
}
من ١ إلى ٣ توصيات، ومن ١ إلى ٤ نصائح سلامة.`;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = AdvisorRequest.safeParse(body);
  if (!parsed.success) return fail(400, "invalid_input", parsed.error.issues[0]?.message ?? "مدخلات غير صحيحة");

  const { question, originId } = parsed.data;
  const origin = ORIGINS.find((o) => o.id === originId) ?? null;

  try {
    const radar = await buildRadar();
    const candidates = radar.areas
      .map((a) => ({ ...a, distanceKm: origin ? distanceKm(origin, a) : null }))
      .sort((a, b) => b.score - (b.distanceKm ?? 0) / 40 - (a.score - (a.distanceKm ?? 0) / 40))
      .slice(0, 10);

    const context = {
      today: radar.generatedAt.slice(0, 10),
      wasmSeasonStart: radar.seasonStart,
      daysIntoSeason: radar.daysIntoSeason,
      userCity: origin?.name ?? "غير محددة",
      areas: candidates.map((a) => ({
        areaId: a.id,
        name: a.name,
        region: a.region,
        score: a.score,
        label: a.label,
        wasmRainMm: a.wasmRain,
        rainyDays: a.rainDays,
        thunderDays: a.thunderDays,
        soilMoisture: a.soilMoisture,
        meanTempC: a.meanTemp,
        next7DaysRainMm: a.forecastRain,
        expectedEmergence: a.emergenceWindow,
        roadDistanceKm: a.distanceKm,
      })),
    };

    const { data, attempts } = await askLlamaJson({
      schema: AdvisorSchema,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: `بيانات المناخ الحية:\n${JSON.stringify(context)}\n\nسؤال المستخدم: ${question}` },
      ],
      refine: (v) => {
        const bad = v.recommendations.filter((r) => !AREA_IDS.has(r.areaId)).map((r) => r.areaId);
        return bad.length ? `معرفات مناطق غير موجودة في البيانات: ${bad.join("، ")}. استخدم فقط: ${candidates.map((c) => c.id).join("، ")}` : null;
      },
    });

    const recommendations = data.recommendations.map((r) => {
      const area = radar.areas.find((a) => a.id === r.areaId)!;
      return { ...r, area: { id: area.id, name: area.name, region: area.region, lat: area.lat, lon: area.lon, score: area.score, label: area.label, distanceKm: origin ? distanceKm(origin, area) : null } };
    });

    return NextResponse.json({ ok: true, model: "Llama 4 Scout", attempts, origin: origin?.name ?? null, result: { ...data, recommendations } });
  } catch (err) {
    return failFromError(err);
  }
}

export function GET() {
  return NextResponse.json({ ok: true, areas: AREAS.length, origins: ORIGINS.map((o) => o.id) });
}
