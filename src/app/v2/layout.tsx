import type { Metadata } from "next";
import { Noto_Serif_KR, Sora } from "next/font/google";

const notoSerifKr = Noto_Serif_KR({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

const sora = Sora({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "비앤비서 v2 — 에어비앤비 호스트를 위한 올인원 유지보수 서비스",
  description:
    "숙소를 디지털 트윈으로 만들어 수리·게스트 응대·시설 관리를 대신합니다. 등록비 무료, 서울 전 지역.",
};

export default function V2Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`${notoSerifKr.variable} ${sora.variable}`}>
      {children}
    </div>
  );
}
