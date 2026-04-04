import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { TopLoader } from "./components/top-loader";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

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
  title: "비앤비서 — 에어비앤비 호스트를 위한 올인원 유지보수 서비스",
  description:
    "숙소를 디지털 트윈으로 만들어 수리·게스트 응대·시설 관리를 대신합니다. 등록비 무료, 서울 전 지역.",
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
          <TopLoader />
          {children}
        </body>
    </html>
  );
}
