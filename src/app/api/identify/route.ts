import { NextResponse } from "next/server";
import { askLlamaJson, VISION_MODEL } from "@/lib/llama";
import { IdentifyRequest, IdentifySchema } from "@/lib/schemas";
import { fail, failFromError, rateLimited } from "@/lib/http";
import { deepPlain } from "@/lib/format";

export const maxDuration = 60;

const SYSTEM = `أنت خبير سعودي في الفقع (الكمأ الصحراوي) تفحص صورة يرسلها المستخدم. أغلب الصور اللي تجيك فقع، لأن الموقع خاص بالفقع.

الأنواع المعروفة في السعودية:
- زبيدي: أبيض مائل للكريمي أو البيج، كبير، الأغلى والأطيب.
- خلاسي: أحمر أو وردي مائل للبني، داخله أغمق، سعره متوسط إلى مرتفع.
- جبي: أسود أو داكن، أصغر، الأرخص.
- هبر: صغير جدا وأبيض، يطلع بدري.

انتبه: الفقع يشبه البطاطس، والخطأ الشائع في الاتجاهين. افحص العلامات:
- علامات الفقع: شكل متكتل غير منتظم فيه نتوءات وتعرجات، قشرة مطفية خشنة شوي، غالبا عليها رمل أو تراب، وما فيه عيون.
- علامات البطاطس: قشرة ناعمة رقيقة أو لامعة، شكل بيضاوي أو مستطيل منتظم، "عيون" (نقاط غائرة صغيرة) أو براعم، أو لون بنفسجي أو أحمر فاقع (الفقع ما يجي بنفسجي أبدا).
- قرر حسب العلامات اللي تشوفها فعلا، واذكرها في description. إذا العلامات متلخبطة، خل الثقة بين 50 و70.
- إذا الصورة شي ثاني واضح (مو فقع ولا يشبهه)، قل isTruffle=false و type="ليس فقعاً".

تحديد النوع من اللون: فاتح (أبيض، كريمي، بيج، بني فاتح) = زبيدي، وإذا صغير جدا = هبر. أحمر أو وردي أو بني محمر = خلاسي. أسود أو داكن = جبي. استخدم "غير محدد" بس إذا اللون ما يبان أبدا (صورة مظلمة أو مقطوعة).

ابدأ بـ description: صف اللي تشوفه بالضبط (الشكل، اللون، القشرة، هل فيه عيون، الخلفية) قبل ما تقرر النوع.
لا تبالغ في الثقة؛ التعرف من الصورة تقديري. الأسعار تقديرية للكيلو بالريال في السوق السعودي وتتغير حسب الموسم: زبيدي 250 إلى 700، خلاسي 150 إلى 400، جبي 50 إلى 150.
نبه إذا ظهرت علامات تلف أو عفن، أو إذا بدا مستوردا (شكل موحد جدا أو تغليف تجاري أو صورة متجر)، بس هذا ما يعني إنه مو فقع.
اكتب بلهجة سعودية بيضاء، بجمل قصيرة، وبدون تشكيل.

أرجع JSON فقط بهذا الترتيب:
{
  "description": "وصف اللي تشوفه في الصورة",
  "isTruffle": true,
  "type": "زبيدي" | "خلاسي" | "جبي" | "هبر" | "غير محدد" | "ليس فقعاً",
  "confidence": رقم من 0 إلى 100,
  "quality": "ممتازة" | "جيدة" | "متوسطة" | "ضعيفة" | "غير معروف",
  "freshness": "تقييم الطزاجة",
  "priceRangeSar": {"min": رقم, "max": رقم} أو null,
  "tips": ["نصيحة تنظيف أو حفظ أو طبخ"],
  "warnings": ["تحذير إن وجد"]
}`;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = IdentifyRequest.safeParse(body);
  if (!parsed.success) return fail(400, "invalid_input", parsed.error.issues[0]?.message ?? "مدخلات غير صحيحة");

  // Only requests that will reach Llama count toward the per-IP limit.
  const limited = rateLimited(req);
  if (limited) return limited;

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
      refine: (v) => {
        if (v.priceRangeSar && v.priceRangeSar.min > v.priceRangeSar.max) return "priceRangeSar.min لازم يكون أصغر من max";
        // Vision models often call desert truffles potatoes; only accept that if it saw potato eyes or sprouts.
        if (!v.isTruffle && /بطاط/.test(v.description) && !/عيون|عين|براعم|برعم|ناعم|ملس|لامع|بيضاوي|مستطيل|منتظم|بنفسج/.test(v.description))
          return "قلت بطاطس بدون ما تذكر أي علامة بطاطس (عيون، براعم، قشرة ناعمة أو لامعة، شكل بيضاوي منتظم، لون بنفسجي). راجع الصورة واذكر العلامات اللي تشوفها. إذا ما فيه علامة بطاطس وشكله متكتل خشن فهو فقع.";
        return null;
      },
    });
    return NextResponse.json({ ok: true, model: "Llama 4 Scout (Vision)", attempts, result: deepPlain(data) });
  } catch (err) {
    return failFromError(err);
  }
}
