import { z } from "zod";

// What Llama must return for the trip advisor.
export const AdvisorSchema = z.object({
  headline: z.string().min(3).max(140),
  summary: z.string().min(10).max(900),
  recommendations: z
    .array(
      z.object({
        areaId: z.string(),
        why: z.string().min(5).max(400),
        bestTime: z.string().min(2).max(200),
        tip: z.string().min(2).max(300),
      }),
    )
    .min(1)
    .max(3),
  seasonOutlook: z.string().min(5).max(500),
  safety: z.array(z.string().min(3).max(220)).min(1).max(4),
  confidence: z.enum(["منخفضة", "متوسطة", "عالية"]),
});
export type Advisor = z.infer<typeof AdvisorSchema>;

// What Llama must return for the photo identifier.
export const IdentifySchema = z.object({
  isTruffle: z.boolean(),
  type: z.enum(["زبيدي", "خلاسي", "جبي", "هبر", "غير محدد", "ليس فقعاً"]),
  confidence: z.number().min(0).max(100),
  description: z.string().min(5).max(500),
  quality: z.enum(["ممتازة", "جيدة", "متوسطة", "ضعيفة", "غير معروف"]),
  freshness: z.string().min(2).max(300),
  priceRangeSar: z
    .object({ min: z.number().min(0).max(2000), max: z.number().min(0).max(3000) })
    .nullable(),
  tips: z.array(z.string().min(2).max(220)).max(4),
  warnings: z.array(z.string().min(2).max(220)).max(4),
});
export type Identify = z.infer<typeof IdentifySchema>;

export const AdvisorRequest = z.object({
  question: z.string().trim().min(1, "اكتب سؤالك أول").max(600, "السؤال طويل. الحد 600 حرف"),
  originId: z.string().trim().min(1).max(30).optional(),
});

export const IdentifyRequest = z.object({
  image: z
    .string()
    .min(1, "ارفع صورة أول")
    .regex(/^data:image\/(png|jpe?g|webp);base64,/, "صيغة الصورة غير مدعومة (PNG أو JPG أو WEBP)")
    .max(4_000_000, "الصورة كبيرة. جرب صورة أصغر"),
  note: z.string().trim().max(300).optional(),
});
