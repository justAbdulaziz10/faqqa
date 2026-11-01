import { NextResponse } from "next/server";
import { askLlamaJson, VISION_MODEL } from "@/lib/llama";
import { IdentifyRequest, IdentifySchema } from "@/lib/schemas";
import { fail, failFromError, rateLimited } from "@/lib/http";
import { deepPlain } from "@/lib/format";

export const maxDuration = 60;

const SYSTEM = `أنت خبير سعودي في الفقع (الكمأ الصحراوي) تفحص صورة يرسلها المستخدم.
الأنواع المعروفة في السعودية:
- زبيدي: أبيض مائل للكريمي، كبير، قشرته ناعمة، الأغلى والأطيب.
- خلاسي: أحمر/وردي مائل للبني، داخله أغمق، سعره متوسط إلى مرتفع.
- جبي: أسود أو داكن، أصغر، الأقل سعراً.
- هبر: صغير جداً، أبيض، يطلع مبكراً.
إذا لم تكن الصورة لفقع فقل ذلك بوضوح (isTruffle=false و type="ليس فقعاً").
لا تبالغ في الثقة؛ التعرف من الصورة تقديري. الأسعار تقديرية للكيلو بالريال في السوق السعودي وتتغير حسب الموسم.
اكتب بلهجة سعودية بيضاء بجمل قصيرة وبدون تشكيل.
نبّه إذا ظهرت علامات تلف أو عفن، أو إذا بدا مستورداً (مثلاً شكل موحّد جداً أو تغليف تجاري).
اكتب بالعربية بلهجة سعودية بيضاء.

أرجع JSON فقط بهذا الشكل:
{
  "isTruffle": true,
  "type": "زبيدي" | "خلاسي" | "جبي" | "هبر" | "غير محدد" | "ليس فقعاً",
  "confidence": رقم من 0 إلى 100,
  "description": "وصف ما تراه في الصورة",
  "quality": "ممتازة" | "جيدة" | "متوسطة" | "ضعيفة" | "غير معروف",
  "freshness": "تقييم الطزاجة",
  "priceRangeSar": {"min": رقم, "max": رقم} أو null,
  "tips": ["نصيحة تنظيف أو حفظ أو طبخ"],
  "warnings": ["تحذير إن وجد"]
}`;

export async function POST(req: Request) {
  const limited = rateLimited(req);
  if (limited) return limited;
  const body = await req.json().catch(() => null);
  const parsed = IdentifyRequest.safeParse(body);
  if (!parsed.success) return fail(400, "invalid_input", parsed.error.issues[0]?.message ?? "مدخلات غير صحيحة");

  try {
    const { data, attempts } = await askLlamaJson({
      schema: IdentifySchema,
      model: VISION_MODEL,
      maxTokens: 900,
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: [
            { type: "text", text: `افحص هذه الصورة.${parsed.data.note ? ` ملاحظة المستخدم: ${parsed.data.note}` : ""}` },
            { type: "image_url", image_url: { url: parsed.data.image } },
          ],
        },
      ],
      refine: (v) => (v.priceRangeSar && v.priceRangeSar.min > v.priceRangeSar.max ? "priceRangeSar.min يجب أن يكون أصغر من max" : null),
    });
    return NextResponse.json({ ok: true, model: "Llama 4 Scout (Vision)", attempts, result: deepPlain(data) });
  } catch (err) {
    return failFromError(err);
  }
}
