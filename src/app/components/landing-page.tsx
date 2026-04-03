"use client";

import { useState, useEffect } from "react";
import ChatDemo from "./chat-demo";
import GuestDemo from "./guest-demo";
import CompareTable from "./compare-table";

const PAIN_POINTS = [
  {
    icon: "🔍",
    title: "정보의 비대칭",
    desc: "수전 고장나면 규격 확인하러 직접 현장에 가야 하고, 업체마다 다른 견적에 시간만 낭비",
  },
  {
    icon: "📞",
    title: "반복되는 게스트 문의",
    desc: '"보일러 어떻게 켜요?" "와이파이 비번 뭐예요?" 매번 같은 질문에 같은 답변',
  },
  {
    icon: "💸",
    title: "감에 의존하는 운영",
    desc: "수리비 바가지, 급할 때 부르면 웃돈 — 부업 수익이 유지보수비로 새어나감",
  },
];

const STEPS = [
  {
    num: "01",
    icon: "📋",
    title: "공간 스캔",
    desc: "전문가가 방문하여 모든 시설물의 브랜드·모델·규격을 기록합니다. 등록비 무료.",
  },
  {
    num: "02",
    icon: "🤖",
    title: "AI 챗봇 접수",
    desc: '"전구 나갔어요" 한마디면 정확한 부품과 비용을 안내하고 방문 예약까지.',
  },
  {
    num: "03",
    icon: "🔧",
    title: "방문 수리",
    desc: "필요한 부품을 가지고 방문합니다. 구독 회원은 출장비 무료, 업계 최저가.",
  },
];

const SECTION = "px-9 md:px-8 max-w-[960px] mx-auto";
const SECTION_BADGE =
  "inline-block py-1 px-3.5 rounded-2xl bg-blue-600/10 border border-blue-600/20 text-blue-400 text-[11px] font-semibold mb-3.5";
const SECTION_TITLE =
  "text-[clamp(20px,5vw,26px)] md:text-[clamp(20px,3.5vw,28px)] font-extrabold text-white leading-[1.3] tracking-[-0.02em] mb-2";
const SECTION_DESC =
  "text-slate-500 text-[13px] md:text-sm leading-normal mb-6 md:mb-8";
const CTA_BUTTON =
  "bg-gradient-to-br from-blue-600 to-purple-600 text-white border-none py-4 px-10 rounded-[14px] text-[15px] md:text-base font-bold cursor-pointer shadow-[0_4px_28px_rgba(37,99,235,0.35)] font-[inherit] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_36px_rgba(37,99,235,0.45)] w-full max-w-[340px] md:w-auto md:max-w-none";

export default function LandingPage() {
  const [activeDemo, setActiveDemo] = useState("host");
  const [visibleSections, setVisibleSections] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisibleSections((prev) => ({
              ...prev,
              [e.target.id]: true,
            }));
          }
        });
      },
      { threshold: 0.15 }
    );

    document
      .querySelectorAll("[data-animate]")
      .forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const anim = (id: string) =>
    `transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
      visibleSections[id]
        ? "opacity-100 translate-y-0"
        : "opacity-0 translate-y-6"
    }`;

  return (
    <>
      {/* Nav */}
      <nav className="sticky top-0 z-50 py-3 px-7 md:py-4 md:px-8 flex justify-between items-center backdrop-blur-[20px] bg-[rgba(10,10,26,0.85)] border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-[13px] font-extrabold text-white">
            B
          </div>
          <span className="text-[17px] font-extrabold text-white tracking-[-0.03em]">
            비앤비서
          </span>
        </div>
        <button className="bg-blue-600 text-white border-none py-2 px-5 rounded-lg text-[13px] font-semibold cursor-pointer font-[inherit]">
          무료 등록
        </button>
      </nav>

      {/* Hero */}
      <section className="pt-20 pb-16 md:pt-28 md:pb-20 px-9 md:px-8 text-center relative">
        <div className="absolute -top-[60px] left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.1)_0%,transparent_70%)] pointer-events-none" />
        <div className="relative animate-fade-up">
          <h1 className="text-[clamp(26px,7vw,36px)] md:text-[clamp(28px,6vw,48px)] font-extrabold text-white leading-[1.3] tracking-[-0.03em] mb-3 md:mb-3.5">
            부업인데 왜
            <br />
            <span className="text-red-600 not-italic">본업</span>처럼 하시나요?
          </h1>
          <p className="text-sm md:text-base leading-normal text-slate-400">
            에어비앤비 유지보수, 비앤비서가 대신합니다
          </p>
          <div className="mt-7 md:mt-9 flex flex-col items-center gap-2.5">
            <button className={CTA_BUTTON}>무료로 숙소 등록하기</button>
            <div className="text-slate-600 text-xs">
              등록비 무료 · 서울 전 지역
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section
        id="pains"
        data-animate
        className={`${SECTION} pb-14 md:pb-[72px] ${anim("pains")}`}
      >
        <div className={SECTION_BADGE}>Problem</div>
        <h2 className={SECTION_TITLE}>
          호스트의 시간을 갉아먹는
          <br />
          &apos;공간 운영&apos;의 한계
        </h2>
        <div className={SECTION_DESC}>
          수익은 줄고, 시간은 빠지고, 게스트 만족은 떨어지는 악순환
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PAIN_POINTS.map((p, i) => (
            <div
              key={i}
              className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 md:py-7 md:px-[22px] transition-colors hover:border-red-600/30"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="text-2xl md:text-[28px] mb-2.5 md:mb-3.5">
                {p.icon}
              </div>
              <div className="text-white text-sm md:text-[15px] font-bold mb-2">
                {p.title}
              </div>
              <div className="text-slate-400 text-[13px] leading-relaxed">
                {p.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Solution */}
      <section
        id="solution"
        data-animate
        className={`${SECTION} pb-14 md:pb-[72px] ${anim("solution")}`}
      >
        <div className={SECTION_BADGE}>Solution</div>
        <h2 className={SECTION_TITLE}>
          숙소를 <span className="text-blue-400">디지털 트윈</span>으로
          만듭니다
        </h2>
        <div className={SECTION_DESC}>
          전구 규격부터 보일러 모델까지 — 모든 시설물을 데이터화하면 수리
          한마디에 부품·비용·일정이 자동으로 정리됩니다
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-9 md:mb-12">
          {STEPS.map((s, i) => (
            <div
              key={i}
              className="flex md:block gap-4 items-start bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 md:py-7 md:px-[22px] relative overflow-hidden transition-colors hover:border-blue-600/30"
            >
              <div className="absolute top-3 right-4 text-white/[0.04] text-[32px] md:text-[44px] font-black">
                {s.num}
              </div>
              <div className="text-[28px] md:text-[32px] md:mb-3.5 shrink-0 mt-0.5 md:mt-0">
                {s.icon}
              </div>
              <div>
                <div className="text-white text-[15px] md:text-base font-bold mb-2">
                  {s.title}
                </div>
                <div className="text-slate-400 text-[13px] leading-relaxed">
                  {s.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Chat Demos */}
        <div className="mb-12">
          {/* Mobile tabs */}
          <div className="flex md:hidden rounded-[10px] overflow-hidden border border-white/[0.08] mb-5">
            {[
              { key: "host", label: "🔧 호스트 수리 접수" },
              { key: "guest", label: "💬 게스트 QR 가이드" },
            ].map((tab) => (
              <button
                key={tab.key}
                className={`flex-1 py-2.5 border-none cursor-pointer text-[13px] font-semibold font-[inherit] transition-all duration-200 ${
                  activeDemo === tab.key
                    ? "bg-blue-600/15 text-blue-400 border-b-2 border-b-blue-600"
                    : "bg-white/[0.02] text-slate-500 border-b-2 border-b-transparent"
                }`}
                onClick={() => setActiveDemo(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="md:grid md:grid-cols-2 md:gap-6 md:items-start">
            <div className={activeDemo !== "host" ? "hidden md:block" : ""}>
              <div className="flex items-center gap-2 mb-3.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                <span className="text-white text-sm font-bold">
                  호스트 수리 접수
                </span>
                <span className="text-slate-600 text-[11px]">
                  — AI가 부품까지 파악
                </span>
              </div>
              <ChatDemo />
            </div>
            <div className={activeDemo !== "guest" ? "hidden md:block" : ""}>
              <div className="flex items-center gap-2 mb-3.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                <span className="text-white text-sm font-bold">
                  게스트 QR 가이드
                </span>
                <span className="text-slate-600 text-[11px]">
                  — 반복 문의 자동 응답
                </span>
              </div>
              <GuestDemo />
            </div>
          </div>
        </div>
      </section>

      {/* Price Compare */}
      <section
        id="compare"
        data-animate
        className={`${SECTION} w-full pb-16 md:pb-20 ${anim("compare")}`}
      >
        <div className={SECTION_BADGE}>Price</div>
        <h2 className={SECTION_TITLE}>출장비 무료, 업계 최저가</h2>
        <div className={SECTION_DESC}>
          구독 회원은 출장비 없이 부품+공임만 — 급할 때 바가지 쓸 일 없습니다
        </div>
        <CompareTable />
      </section>

      {/* CTA */}
      <section className="mt-20 py-14 md:py-20 px-9 md:px-8 text-center border-t border-white/[0.04]">
        <h2 className="text-[clamp(20px,5vw,28px)] md:text-[clamp(22px,4vw,32px)] font-extrabold text-white leading-[1.3] tracking-[-0.02em] mb-3">
          수리 걱정 없는
          <br />
          호스팅을 시작하세요
        </h2>
        <div className="text-slate-500 text-[13px] md:text-sm mb-6 md:mb-8 leading-normal">
          등록비 무료 · 가입 후 3일 내 방문 데이터 수집
          <br />
          서울 전 지역 서비스 중
        </div>
        <button className={CTA_BUTTON}>무료로 숙소 등록하기</button>
      </section>

      {/* Footer */}
      <footer className="py-5 md:py-7 px-9 md:px-8 border-t border-white/[0.04] text-center text-slate-700 text-[11px]">
        © 2026 비앤비서 · 에어비앤비 호스트를 위한 올인원 유지보수 서비스
      </footer>
    </>
  );
}
