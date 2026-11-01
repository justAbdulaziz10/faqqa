import type { Metadata, Viewport } from "next";
import { Alexandria, Readex_Pro } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SITE } from "@/lib/site";

const readex = Readex_Pro({ subsets: ["arabic", "latin"], weight: "variable", variable: "--font-readex", display: "swap" });
const alexandria = Alexandria({ subsets: ["arabic", "latin"], weight: "variable", variable: "--font-alexandria", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} | ${SITE.tagline}`, template: `%s | ${SITE.name}` },
  description: "فقاع يتابع مطر الوسم ورعده في 24 منطقة فقع، ويقول لك وين تروح ومتى، ويعرف نوع الفقعة من صورتها.",
  openGraph: { title: `${SITE.name} | ${SITE.tagline}`, description: "شوف وين نزل مطر الوسم هالسنة، ومتى يطلع الفقع.", locale: "ar_SA", type: "website" },
  twitter: { card: "summary_large_image" },
  appleWebApp: { capable: true, title: SITE.name, statusBarStyle: "black" },
};

export const viewport: Viewport = { themeColor: "#0f1729" };

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE.name,
  alternateName: "Faqqa",
  url: SITE.url,
  inLanguage: "ar",
  applicationCategory: "LifestyleApplication",
  operatingSystem: "Web",
  description: "يتابع مطر الوسم ورعده في 24 منطقة فقع في السعودية، ويقول لك وين تروح ومتى، ويعرف نوع الفقعة من صورتها.",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "SAR" },
  author: { "@type": "Person", name: SITE.author, url: SITE.github },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className={`${readex.variable} ${alexandria.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:right-3 focus:z-50 focus:rounded-lg focus:bg-bolt focus:px-4 focus:py-2 focus:text-ink">انتقل للمحتوى</a>
        <SiteHeader />
        <main id="main" className="flex-1">{children}</main>
        <SiteFooter />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      </body>
    </html>
  );
}
