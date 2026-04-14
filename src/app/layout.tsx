import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/lib/auth-provider";

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


export const metadata: Metadata = {
  title: "비앤비서 — 에어비앤비 전문 청소·시설관리 서비스",
  description:
    "에어비앤비 전문 호텔식 청소 + 15항목 시설 점검 리포트. 이모님 펑크에도 당일 긴급 대응. 마포구·서대문구.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={cn("h-full", "antialiased", sbAggro.variable, paperlogy.variable, "font-sans", geist.variable)}
    >
      <body className="min-h-full flex flex-col">
          <AuthProvider>
            {children}
          </AuthProvider>
        </body>
    </html>
  );
}
