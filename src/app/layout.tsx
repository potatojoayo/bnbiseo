import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/lib/auth-provider";
import { QueryProvider } from "@/lib/query-client";
import { KeyboardScrollFix } from "@/components/keyboard-scroll-fix";
import { Toaster } from "@/components/ui/sonner";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const sbAggro = localFont({
  variable: "--font-display",
  display: "swap",
  src: [
    { path: "../../public/fonts/SBAggroOTF-Light.otf", weight: "300" },
    { path: "../../public/fonts/SBAggroOTF-Medium.otf", weight: "500" },
    { path: "../../public/fonts/SBAggroOTF-Bold.otf", weight: "700" },
  ],
});

const paperlogy = localFont({
  variable: "--font-body",
  display: "swap",
  src: [
    { path: "../../public/fonts/Paperlogy-1Thin.ttf", weight: "100" },
    { path: "../../public/fonts/Paperlogy-2ExtraLight.ttf", weight: "200" },
    { path: "../../public/fonts/Paperlogy-3Light.ttf", weight: "300" },
    { path: "../../public/fonts/Paperlogy-4Regular.ttf", weight: "400" },
    { path: "../../public/fonts/Paperlogy-5Medium.ttf", weight: "500" },
    { path: "../../public/fonts/Paperlogy-6SemiBold.ttf", weight: "600" },
    { path: "../../public/fonts/Paperlogy-7Bold.ttf", weight: "700" },
    { path: "../../public/fonts/Paperlogy-8ExtraBold.ttf", weight: "800" },
    { path: "../../public/fonts/Paperlogy-9Black.ttf", weight: "900" },
  ],
});


const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.bnbiseo.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "에어비앤비 청소·시설관리 | 마포·서대문 비앤비서",
  description:
    "에어비앤비 전문 호텔식 청소 + 15항목 시설 점검 리포트. 이모님 펑크에도 당일 긴급 대응. 마포구·서대문구 호스트 전용.",
  openGraph: {
    title: "에어비앤비 청소·시설관리 | 마포·서대문 비앤비서",
    description: "에어비앤비 전문 호텔식 청소 + 15항목 시설 점검 리포트. 비앤비서가 전문 매니저를 바로 보내드릴게요.",
    url: SITE_URL,
    siteName: "비앤비서",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "에어비앤비 청소·시설관리 | 마포·서대문 비앤비서",
    description: "에어비앤비 전문 호텔식 청소 + 15항목 시설 점검 리포트.",
  },
  alternates: {
    canonical: SITE_URL,
  },
  verification: {
    other: {
      "naver-site-verification": "2b4f895ba0fc92371c8bc81a5cd33b7b2dc3ca13",
    },
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "@id": `${SITE_URL}/#business`,
      name: "비앤비서",
      alternateName: "BnBiseo",
      url: SITE_URL,
      telephone: "+82-10-2960-4676",
      email: "bohemiantoday4676@naver.com",
      description:
        "에어비앤비 호스트 전용 청소·시설관리 서비스. 호텔식 청소와 15항목 시설 점검 리포트, 당일 긴급 대응까지 한 번에.",
      address: {
        "@type": "PostalAddress",
        streetAddress: "방울내로6길 14, 302호",
        addressLocality: "마포구",
        addressRegion: "서울특별시",
        addressCountry: "KR",
      },
      areaServed: [
        { "@type": "City", name: "마포구" },
        { "@type": "City", name: "서대문구" },
      ],
      founder: { "@type": "Person", name: "최정호" },
      legalName: "실버백 가디언즈",
      taxID: "267-28-01998",
    },
    {
      "@type": "Service",
      "@id": `${SITE_URL}/#service`,
      serviceType: "에어비앤비 청소 및 시설관리",
      provider: { "@id": `${SITE_URL}/#business` },
      areaServed: [
        { "@type": "City", name: "마포구" },
        { "@type": "City", name: "서대문구" },
      ],
      description:
        "에어비앤비 전문 호텔식 청소, 15항목 시설 점검 리포트, 당일 긴급 청소, 담배냄새 특수 청소, 시설 보수 코디네이션.",
      offers: {
        "@type": "Offer",
        priceCurrency: "KRW",
        price: "35000",
        priceSpecification: {
          "@type": "PriceSpecification",
          priceCurrency: "KRW",
          minPrice: 35000,
          description: "표준 청소 35,000원부터",
        },
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "비앤비서",
      inLanguage: "ko-KR",
      publisher: { "@id": `${SITE_URL}/#business` },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      data-scroll-behavior="smooth"
      className={cn("h-full", "antialiased", sbAggro.variable, paperlogy.variable, "font-sans", geist.variable)}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
          <QueryProvider>
            <AuthProvider>
              <KeyboardScrollFix />
              {children}
              <Toaster position="top-center" />
            </AuthProvider>
          </QueryProvider>
        </body>
    </html>
  );
}
