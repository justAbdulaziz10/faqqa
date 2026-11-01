import { NextResponse } from "next/server";
import { AREAS, AREA_IDS, ORIGINS, distanceKm } from "@/lib/areas";
import { getRadar } from "@/lib/radar";
import { askLlamaJson } from "@/lib/llama";
import { AdvisorRequest, AdvisorSchema } from "@/lib/schemas";
import { fail, failFromError, rateLimited } from "@/lib/http";
import { deepPlain } from "@/lib/format";

export const maxDuration = 60;

const SYSTEM = `أنت «فقاع»: خبير سعودي في الفقع (الكمأ) يجمع بين خبرة أهل البر والعلم الحديث.
مهمتك: تجاوب على سؤال المستخدم بالاعتماد فقط على البيانات الحية المرفقة.

قواعد صارمة:
- لا تخترع أرقام أو أماكن. استخدم فقط معرفات المناطق (areaId) الموجودة في البيانات.
- الفقع يطلع عادة بعد 60 إلى 75 يوم من أول مطر وسم فعال (10 ملم أو أكثر)، والرعد يزيد الفرصة.
- daysUntilEmergence لكل منطقة = كم يوم باقي على أول وقت متوقع للفقع. إذا كان أكبر من صفر فالفقع لسا ما طلع هناك: قلها بوضوح، ولا تقل إن الموسم بدأ أو إن فيه فقع الحين. إذا كان null فما نزل مطر كافي.
- driveHours = ساعات السواقة من مدينة المستخدم. لطلعة يوم أو يومين لا تنصح بمكان أكثر من 5 ساعات سواقة. إذا الأماكن اللي فيها فرصة كلها بعيدة، قلها بصراحة واذكر كم ساعة، واقترح الأقرب حتى لو فرصته ضعيفة.
- قيمة label هي فرصة الفقع في المنطقة: عالية، متوسطة، ضعيفة، معدومة. استخدم نفس الكلمات وبصيغة المفرد «الفرصة».
- إذا المستخدم يتكلم عن جماعة (طالعين، نروح) خاطبهم بالجمع.
- اكتب بلهجة سعودية بيضاء ودودة، بجمل قصيرة، بدون تشكيل، وبالأرقام الإنجليزية (1، 2، 3). لا تكتب السنة مع التواريخ.
- السلامة: ذكر بعدم دخول الأودية وقت السيل، وأخذ الماء والوقود، وعدم الدخول لأراضي خاصة أو محميات.

أرجع JSON فقط بهذا الشكل بالضبط:
{
  "headline": "جواب مباشر في جملة قصيرة",
  "summary": "الوضع والجواب على سؤاله في 2 إلى 3 جمل",
  "recommendations": [{"areaId": "معرف من البيانات", "why": "ليش هذا المكان بالأرقام", "bestTime": "أفضل وقت للطلعة", "tip": "نصيحة عملية"}],
  "seasonOutlook": "متى نتوقع الفقع هالموسم، بتاريخ expectedEmergence الحقيقي من البيانات",
  "safety": ["نصيحة سلامة"],
  "confidence": "منخفضة" أو "متوسطة" أو "عالية"
}
من 1 إلى 3 توصيات، ومن 1 إلى 4 نصائح سلامة.

مثال على الأسلوب المطلوب (الأرقام هنا للتوضيح فقط، لا تنسخها):
{"headline":"لسا بدري، أقرب فقع متوقع بعد 40 يوم","summary":"ما فيه فقع الحين في أي منطقة. أعلى فرصة قريبة منكم في الصمان، 4 ساعات سواقة، والفقع متوقع فيها من 10 ديسمبر.","recommendations":[{"areaId":"مثال","why":"نزل عليها 18 ملم مع يومين رعد، والفرصة متوسطة","bestTime":"من 10 ديسمبر، والصبح بدري أحسن","tip":"دوروا حول نبتة الرقروق وعند الأرض المفطورة"}],"seasonOutlook":"أول فقع متوقع من 10 ديسمبر، وإذا نزل مطر زيادة تكبر الفرصة","safety":["لا تدخلون الأودية وقت السيل"],"confidence":"متوسطة"}
اكتب الهمزات صح (أنصح، الآن، لأن، أقرب).`;

export async function POST(req: Request) {
  const limited = rateLimited(req);
  if (limited) return limited;
  const body = await req.json().catch(() => null);
  const parsed = AdvisorRequest.safeParse(body);
  if (!parsed.success) return fail(400, "invalid_input", parsed.error.issues[0]?.message ?? "مدخلات غير صحيحة");

  const { question, originId } = parsed.data;
  const origin = ORIGINS.find((o) => o.id === originId) ?? null;

  try {
    const radar = await getRadar();
    const withKm = radar.areas.map((a) => ({ ...a, distanceKm: origin ? distanceKm(origin, a) : null }));
    const best = [...withKm].sort((a, b) => b.score - (b.distanceKm ?? 0) / 40 - (a.score - (a.distanceKm ?? 0) / 40)).slice(0, 8);
    const near = [...withKm].sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0)).slice(0, 4);
    const candidates = [...new Map([...best, ...near].map((a) => [a.id, a])).values()];
    const today = radar.generatedAt.slice(0, 10);
    const daysUntil = (iso: string) => Math.round((Date.parse(iso) - Date.parse(today)) / 86_400_000);

    const context = {
      today,
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
        driveHours: a.distanceKm != null ? Math.round(a.distanceKm / 10) / 10 : null,
        daysUntilEmergence: a.emergenceWindow ? daysUntil(a.emergenceWindow.from) : null,
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

    return NextResponse.json({ ok: true, model: "Llama 4 Scout", attempts, origin: origin?.name ?? null, result: deepPlain({ ...data, recommendations }) });
  } catch (err) {
    return failFromError(err);
  }
}

export function GET() {
  return NextResponse.json({ ok: true, areas: AREAS.length, origins: ORIGINS.map((o) => o.id) });
}
