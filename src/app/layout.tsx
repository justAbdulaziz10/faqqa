import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic, Reem_Kufi } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SITE } from "@/lib/site";

const plex = IBM_Plex_Sans_Arabic({ subsets: ["arabic"], weight: ["300", "400", "500", "600", "700"], variable: "--font-plex", display: "swap" });
const kufi = Reem_Kufi({ subsets: ["arabic"], weight: ["400", "500", "600", "700"], variable: "--font-kufi", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} | ${SITE.tagline}`, template: `%s | ${SITE.name}` },
  description: "فقّاع يقرأ أمطار الوسم والرعد ورطوبة التربة من بيانات المناخ العالمية، ويستخدم Llama ليقول لك وين احتمال الفقع أعلى هالموسم، ويتعرف على نوع الفقعة من صورتها.",
  openGraph: { title: `${SITE.name} | ${SITE.tagline}`, description: "وين يطلع الفقع هالسنة؟ اسأل البيانات بدل التخمين.", locale: "ar_SA", type: "website" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#120d09" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className={`${plex.variable} ${kufi.variable}`}>
      <body className="min-h-dvh flex flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:right-3 focus:z-50 focus:bg-ember focus:text-night focus:px-4 focus:py-2 focus:rounded-lg">تخطَّ إلى المحتوى</a>
        <SiteHeader />
        <main id="main" className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
