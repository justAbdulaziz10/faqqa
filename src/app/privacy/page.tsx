import type { Metadata } from "next";
import { PageShell, Block } from "@/components/Prose";

export const metadata: Metadata = { title: "الخصوصية", description: "كيف يتعامل فقاع مع بياناتك وصورك." };

export default function PrivacyPage() {
  return (
    <PageShell eyebrow="آخر تحديث: نوفمبر 2026" title="سياسة الخصوصية" intro="باختصار: ما نطلب منك تسجيل، وما نحفظ أسئلتك ولا صورك.">
      <Block title="وش نجمع؟">
        <ul>
          <li><b>لا حسابات ولا تسجيل دخول</b>، ولا نطلب اسمك أو رقمك أو بريدك.</li>
          <li><b>لا نطلب موقعك الجغرافي.</b> أنت تختار مدينتك من قائمة.</li>
          <li>لا نستخدم ملفات تتبع إعلانية.</li>
        </ul>
      </Block>
      <Block title="أسئلتك وصورك">
        <ul>
          <li>الصورة تصغر داخل متصفحك أولا، ثم ترسل مع سؤالك عبر اتصال مشفر لخادمنا، ومنه إلى نموذج Meta Llama على Cloudflare Workers AI لتحليلها، ثم تعرض النتيجة.</li>
          <li><b>لا نحفظ</b> الأسئلة ولا الصور في أي قاعدة بيانات. تعالج لحظيا وتنتهي.</li>
          <li>مزودو البنية التحتية (Vercel وCloudflare) قد يحتفظون بسجلات تشغيل تقنية مؤقتة حسب سياساتهم.</li>
          <li>تجنب رفع صور فيها أشخاص أو معلومات شخصية.</li>
        </ul>
      </Block>
      <Block title="خدمات خارجية">
        <p>صور الأقمار الصناعية والخرائط تحمل من خوادم Esri، وروابط «افتح في الخرائط» تفتح خرائط Google. هذه الخدمات لها سياسات خصوصية خاصة بها.</p>
      </Block>
    </PageShell>
  );
}
