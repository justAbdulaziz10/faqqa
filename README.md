# فقّاع · رادار الفقع الذكي

> وين يطلع الفقع هالسنة؟ اسأل البيانات بدل التخمين.

**الموقع:** https://faqqa.vercel.app

فقّاع يحوّل الحكمة الشعبية «الفقع يطلع بعد رعد الوسم» لأرقام. يقرأ أمطار الوسم والرعد ورطوبة التربة من نماذج مناخ عالمية لـ 24 منطقة فقع معروفة في السعودية، ثم يستخدم **Meta Llama 4** ليعطيك خطة طلعة بلهجتك، ويتعرف على نوع الفقعة من صورتها.

> ⚠️ مشروع شخصي تعليمي بنيته ضمن معسكر أكاديمية طويق (مع Meta وStartupbootcamp). التقديرات تقريبية **وليست دقيقة 100٪** ولا تضمن وجود الفقع.

## المزايا

| الميزة | الوصف |
|---|---|
| 🗺️ **الرادار الحي** | خريطة تفاعلية تعطي كل منطقة مؤشراً من 100، مع أمطار الوسم اليومية وأيام الرعد ورطوبة التربة والحرارة وتوقعات 7 أيام ونافذة الطلوع المتوقعة |
| ✨ **اسأل فقّاع** | تكتب سؤالك بالعامية وتختار مدينتك، وLlama يحلل البيانات الحية ويرجع خطة منظمة: أفضل 1–3 مناطق، والتوقيت، والنصائح، والسلامة |
| 📷 **صوّر فقعتك** | يتعرف Llama 4 Vision على النوع (زبيدي، خلاسي، جبي، هبر)، ويقدّر الجودة والطزاجة والسعر التقريبي |

## البنية

```
المتصفح (Next.js + Tailwind، عربي RTL)
   │  POST /api/advisor   { question, originId }
   │  POST /api/identify  { image(dataURL) }
   │  GET  /api/radar
   ▼
Next.js Route Handlers (Vercel)
   ├─ تحقق من المدخلات بـ zod (فارغ، أطوال، صيغ الصور) + حد للطلبات لكل IP
   ├─ lib/radar.ts → Open-Meteo (ECMWF / DWD ICON / ERA5) → معادلة المؤشر (مخزنة لساعة)
   └─ lib/llama.ts → Cloudflare Worker (llama-worker/) → Workers AI: @cf/meta/llama-4-scout-17b-16e-instruct
                      ├─ response_format: json_object
                      ├─ تحقق zod صارم + تحقق أن areaId موجود فعلاً
                      └─ إعادة محاولة واحدة مع إرسال أخطاء التحقق للنموذج، وإلا خطأ واضح للمستخدم
```

### ماذا يرجع Llama؟

**المستشار** (`AdvisorSchema` في `src/lib/schemas.ts`):
```json
{ "headline": "...", "summary": "...",
  "recommendations": [{ "areaId": "rafha", "why": "...", "bestTime": "...", "tip": "..." }],
  "seasonOutlook": "...", "safety": ["..."], "confidence": "منخفضة | متوسطة | عالية" }
```

**التعرف على الصورة** (`IdentifySchema`):
```json
{ "isTruffle": true, "type": "زبيدي", "confidence": 72, "description": "...",
  "quality": "جيدة", "freshness": "...", "priceRangeSar": { "min": 150, "max": 300 },
  "tips": ["..."], "warnings": ["..."] }
```

### معادلة المؤشر
`score = 100 × ground × (0.45·rain + 0.15·thunder + 0.15·soil + 0.10·temp + 0.15·forecast)`
- `rain`: أمطار الوسم منذ 16 أكتوبر (تكتمل عند 30 ملم)
- `thunder`: أيام الرعد (رموز الطقس ≥ 95)
- `soil`: رطوبة التربة على عمق 3–9 سم
- `temp`: ملاءمة الحرارة (12–26°)
- `forecast`: مطر الأسبوع القادم
- `ground`: معامل شهرة المنطقة بالفقع (معرفة شعبية)
- نافذة الطلوع = 60–75 يوماً بعد أول تراكم مطر ≥ 10 ملم

### معالجة الأخطاء
- مدخل فارغ أو طويل أو صورة بصيغة خاطئة: 400 مع رسالة عربية واضحة
- رد Llama ناقص أو مكسور: إعادة محاولة تلقائية، ثم 502 برسالة واضحة
- Llama غير متاح أو انتهت المهلة (45 ثانية): 502
- بيانات المناخ غير متاحة: الصفحة تعرض تنبيهاً بدل أن تنهار
- طلبات كثيرة: 429

## التشغيل محلياً

```bash
npm install
cp .env.example .env.local   # ضع رابط ومفتاح الـ Worker
npm run dev
```

### نشر الـ Worker (Llama)
```bash
cd llama-worker
npx wrangler deploy
npx wrangler secret put PROXY_SECRET
```

## التقنيات
Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · zod · Leaflet + OpenStreetMap/CARTO · Meta Llama 4 Scout (Cloudflare Workers AI) · Vercel

## المصادر والرخص
- بيانات الطقس: [Open-Meteo](https://open-meteo.com) (CC BY 4.0)
- الخرائط: © OpenStreetMap contributors · © CARTO
- النموذج: Meta Llama 4، خاضع لـ [Llama 4 Community License](https://www.llama.com/llama4/license/)

---
صنعه [عبدالعزيز الخليوي](https://github.com/justAbdulaziz10) · [☕ ادعمني بقهوة](https://buymeacoffee.com/justAbdulaziz10)
