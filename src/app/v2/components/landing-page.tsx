"use client";

import { useState, useEffect } from "react";
import ChatDemo from "./chat-demo";
import GuestDemo from "./guest-demo";

const PROBLEMS = [
  {
    icon: "🔍",
    t: "숙소마다 규격이 다 달라요",
    d: "5채 수전이 전부 다른데, 고장 날 때마다 현장 가서 사진 찍고 업체에 보내고… 이걸 매번 해야 해요.",
  },
  {
    icon: "📞",
    t: "같은 질문이 끝없이 와요",
    d: '"보일러 어떻게 켜요?" 5채에서 동시에 들어오면 답장할 시간이 없어요.',
  },
  {
    icon: "💸",
    t: "급하면 바가지를 쓸 수밖에 없어요",
    d: "체크인 3시간 전에 고장 나면 웃돈 주고 부를 수밖에 없잖아요. 수익이 수리비로 다 새어나가요.",
  },
];

const STEPS = [
  {
    icon: "📋",
    t: "먼저 숙소를 스캔해요",
    d: "전문가가 직접 방문해서 조명, 수전, 보일러, 가전 등 모든 시설물의 규격을 기록해 드려요. 등록비는 무료!",
  },
  {
    icon: "🤖",
    t: "채팅으로 접수하면 끝",
    d: '"전구 나갔어요" 한마디면 알아서 부품이랑 비용 찾아드리고, 방문 예약까지 잡아드려요.',
  },
  {
    icon: "🔧",
    t: "부품 들고 바로 방문",
    d: "맞는 부품 가지고 한 번에 해결해요. 출장비는 무료, 업계 최저가 보장이에요.",
  },
];

const MARQUEE_ITEMS = [
  "공간 스캔",
  "디지털 트윈",
  "AI 챗봇 접수",
  "출장비 무료",
  "1회 방문 해결",
  "게스트 QR 가이드",
  "업계 최저가",
  "구독형 유지보수",
];

const FONT_DISPLAY = "font-[var(--font-display)]";
const FONT_BODY = "font-[var(--font-body)]";
const SECTION = "max-w-5xl mx-auto px-12 max-md:px-6";
const BADGE = "text-[#D4421E] text-xs font-bold tracking-widest uppercase mb-5";
const SEC_TITLE = `${FONT_DISPLAY} text-[clamp(28px,4vw,44px)] font-black leading-tight tracking-tight mb-4`;
const SEC_DESC =
  "text-[#8a8a82] text-sm leading-relaxed max-w-xl mb-12 font-light";
const BTN_MAIN = `${FONT_BODY} bg-[#1a1a1a] text-[#F6F4F0] border-none px-9 py-4 rounded-full text-base font-semibold cursor-pointer inline-flex items-center gap-3 transition-all duration-200 hover:bg-[#D4421E] hover:scale-[1.03] group`;

export default function LandingPage() {
  const [vis, setVis] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const obs = new IntersectionObserver(
      (es) => {
        es.forEach((e) => {
          if (e.isIntersecting)
            setVis((p) => ({ ...p, [e.target.id]: true }));
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll("[data-a]").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const v = (id: string) =>
    `transition-all duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
      vis[id] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
    }`;

  return (
    <div
      className={`min-h-screen bg-[#F6F4F0] text-[#1a1a1a] ${FONT_BODY} antialiased overflow-x-hidden`}
    >
      {/* Nav */}
      <nav className="bg-[rgba(246,244,240,0.9)] backdrop-blur-[12px] sticky top-0 z-50 px-12 py-5 flex justify-between items-center border-b border-[#d5d2cc] max-md:px-6 max-md:py-4">
        <div className={`${FONT_DISPLAY} text-xl font-black tracking-tighter`}>
          비앤비서
        </div>
        <button className={`${FONT_BODY} bg-[#1a1a1a] text-[#F6F4F0] border-none px-5 py-2 rounded-full text-sm font-semibold cursor-pointer transition-all duration-200 hover:bg-[#D4421E] hover:scale-[1.03]`}>무료 등록</button>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-12 pt-24 pb-20 max-md:px-6 max-md:pt-16 max-md:pb-14">
        <h1
          className={`${FONT_DISPLAY} font-black tracking-tighter mb-7`}
        >
          <span className="block text-[clamp(28px,4vw,48px)] max-md:text-[28px] leading-tight animate-fade-in-d1">
            에어비앤비,
          </span>
          <span className="block text-[clamp(36px,5.5vw,64px)] max-md:text-[36px] leading-tight animate-fade-in-d2">
            부업인데 왜
          </span>
          <span className="block text-[clamp(44px,7vw,80px)] max-md:text-[44px] leading-tight animate-fade-in-d3">
            <span className="text-[#D4421E]">본업</span>처럼 하시나요?
          </span>
        </h1>
        <p className="animate-fade-in-d4 text-[#8a8a82] text-lg font-light leading-relaxed max-w-lg mb-11 max-md:text-base">
          숙소 시설을 통째로 기억하는 AI 비서.
          <br />
          수리도, 게스트 문의도 한마디면 알아서 처리해 드립니다.
        </p>
        <button className={BTN_MAIN}>
          무료로 숙소 등록하기
          <span className="text-lg transition-transform duration-300 group-hover:translate-x-1.5">
            →
          </span>
        </button>
        <div className="text-[#8a8a82] text-xs mt-4 font-normal">
          등록비 무료 · 서울 전 지역 · 가입 후 3일 내 방문
        </div>
      </section>

      {/* Marquee */}
      <div className="overflow-hidden border-y border-[#d5d2cc] py-4">
        <div className="animate-marquee flex gap-16 w-max">
          {[...Array(4)].flatMap((_, k) =>
            MARQUEE_ITEMS.map((t, i) => (
              <span
                key={`${k}-${i}`}
                className={`${FONT_DISPLAY} text-sm text-[#8a8a82] whitespace-nowrap flex items-center gap-3`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4421E] opacity-50" />
                {t}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Problem */}
      <section
        id="prob"
        data-a
        className={`${SECTION} py-24 max-md:py-16 ${v("prob")}`}
      >
        <div className={BADGE}>Problem</div>
        <h2 className={SEC_TITLE}>
          숙소가 늘수록
          <br />
          문제는 곱절이 됩니다
        </h2>
        <p className={SEC_DESC}>
          현장 방문, 견적 비교, 긴급 수리 — 이게 매주 반복되면 지치잖아요.
        </p>

        <div className="grid grid-cols-3 max-md:grid-cols-1 gap-4">
          {PROBLEMS.map((p, i) => (
            <div
              key={i}
              className="bg-[#EDEAE4] rounded-2xl p-7 max-md:p-5 transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="text-3xl mb-4">{p.icon}</div>
              <div className="text-base font-bold mb-2">{p.t}</div>
              <div className="text-[#8a8a82] text-xs leading-relaxed">
                {p.d}
              </div>
            </div>
          ))}
        </div>
      </section>

      <hr className="border-t border-[#d5d2cc] mx-0" />

      {/* Solution */}
      <section
        id="sol"
        data-a
        className={`${SECTION} py-24 max-md:py-16 ${v("sol")}`}
      >
        <div className={BADGE}>Solution</div>
        <h2 className={SEC_TITLE}>
          숙소를 통째로
          <br />
          데이터로 만듭니다
        </h2>
        <p className={SEC_DESC}>
          전구 규격부터 보일러 모델까지, 한번 기록해 두면 다음부터는 알아서 척척 처리해 드려요.
        </p>

        {/* Steps */}
        <div className="grid grid-cols-3 max-md:grid-cols-1 gap-4 mb-16">
          {STEPS.map((s, i) => (
            <div
              key={i}
              className="bg-[#EDEAE4] rounded-2xl p-7 max-md:p-5 transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="text-3xl mb-4">{s.icon}</div>
              <div className="text-base font-bold mb-2">{s.t}</div>
              <div className="text-[#8a8a82] text-xs leading-relaxed">
                {s.d}
              </div>
            </div>
          ))}
        </div>

        {/* Demo Grid */}
        <div className="grid grid-cols-2 max-md:grid-cols-1 gap-8 items-start">
          <div>
            <div className="text-xs font-semibold text-[#8a8a82] tracking-wide uppercase mb-3">
              호스트 수리 접수
            </div>
            <ChatDemo />
          </div>
          <div>
            <div className="text-xs font-semibold text-[#8a8a82] tracking-wide uppercase mb-3">
              게스트 QR 가이드
            </div>
            <GuestDemo />
          </div>
        </div>
      </section>

      <hr className="border-t border-[#d5d2cc] mx-0" />

      {/* Before & After */}
      <section
        id="compare"
        data-a
        className={`${SECTION} py-24 max-md:py-16 ${v("compare")}`}
      >
        <div className={BADGE}>Before & After</div>
        <h2 className={SEC_TITLE}>
          반나절이 3분으로
        </h2>
        <p className={SEC_DESC}>
          비앤비서 하나로 호스팅이 이렇게 달라져요.
        </p>

        <div className="grid grid-cols-2 max-md:grid-cols-1 gap-4">
          {/* Before */}
          <div className="bg-white rounded-2xl border border-[#d5d2cc] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#d5d2cc] flex items-center gap-2">
              <span className="text-base">😩</span>
              <span className="text-sm font-bold text-[#8a8a82]">지금</span>
            </div>
            <div className="p-6 flex flex-col divide-y divide-[#d5d2cc]/50">
              {[
                { icon: "🔧", label: "수리 요청", steps: "고장 → 직접 현장 가서 사진 찍고 → 업체 찾고 → 견적 비교하고 → 예약하고 → 또 방문", time: "반나절 이상" },
                { icon: "💬", label: "게스트 문의", steps: "\"보일러 어떻게 켜요?\" 같은 메시지에 매번 직접 답장, 숙소마다 반복", time: "하루 30분~1시간" },
                { icon: "📋", label: "시설 관리", steps: "수전 규격? 보일러 모델? 기억에 의존하다 숙소 늘면 뒤죽박죽", time: "체계 없음" },
              ].map((item, i) => (
                <div key={i} className="flex gap-3 py-4 first:pt-0 last:pb-0">
                  <span className="text-lg shrink-0 mt-0.5">{item.icon}</span>
                  <div>
                    <div className="text-sm font-bold mb-1">{item.label}</div>
                    <div className="text-[#8a8a82] text-xs leading-relaxed mb-1.5">{item.steps}</div>
                    <div className="inline-block bg-red-50 text-red-500 text-xs font-semibold px-2.5 py-0.5 rounded-full">{item.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* After */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-xl shadow-black/10 border border-[#d5d2cc]">
            <div className="px-6 py-4 border-b border-[#d5d2cc] flex items-center gap-2">
              <span className="text-base">✨</span>
              <span className={`${FONT_DISPLAY} text-sm font-black tracking-tighter`}>비앤비서</span>
            </div>
            <div className="p-6 flex flex-col divide-y divide-[#d5d2cc]/30">
              {[
                { icon: "🔧", label: "수리 요청", steps: "\"전구 나갔어요\" 한마디면 부품·비용·일정까지 알아서 잡아드려요", time: "3분" },
                { icon: "💬", label: "게스트 문의", steps: "게스트가 QR 찍으면 AI가 그 숙소에 맞게 바로 답해줘요", time: "0분 (자동)" },
                { icon: "📋", label: "시설 관리", steps: "모든 시설물이 DB에 기록되어 있어서 언제든 바로 확인할 수 있어요", time: "완전 자동" },
              ].map((item, i) => (
                <div key={i} className="flex gap-3 py-4 first:pt-0 last:pb-0">
                  <span className="text-lg shrink-0 mt-0.5">{item.icon}</span>
                  <div>
                    <div className="text-sm font-bold mb-1">{item.label}</div>
                    <div className="text-[#8a8a82] text-xs leading-relaxed mb-1.5">{item.steps}</div>
                    <div className="inline-block bg-green-50 text-green-600 text-xs font-semibold px-2.5 py-0.5 rounded-full">{item.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        id="cta"
        data-a
        className={`bg-white px-12 py-28 text-center max-md:px-6 max-md:py-20 ${v("cta")}`}
      >
        <h2
          className={`${FONT_DISPLAY} text-[clamp(32px,5vw,56px)] font-black leading-tight tracking-tighter mb-5`}
        >
          수리 걱정 없는
          <br />
          호스팅을 시작하세요
        </h2>
        <p className="text-[#8a8a82] text-base mb-10 font-light">
          등록비 무료 · 서울 전 지역 · 지금 바로 시작할 수 있어요
        </p>
        <button className={`${BTN_MAIN} mx-auto`}>
          무료로 숙소 등록하기
          <span className="text-lg transition-transform duration-300 group-hover:translate-x-1.5">
            →
          </span>
        </button>
      </section>

      {/* Footer */}
      <footer className="px-12 py-7 border-t border-[#d5d2cc] flex justify-between items-center text-[#8a8a82] text-xs max-md:px-6 max-md:flex-col max-md:gap-3">
        <span>© 2026 비앤비서 (BnBiseo)</span>
        <div className="flex gap-5 max-md:hidden">
          <a href="#" className="text-[#8a8a82] no-underline text-xs">
            이용약관
          </a>
          <a href="#" className="text-[#8a8a82] no-underline text-xs">
            개인정보처리방침
          </a>
          <a href="#" className="text-[#8a8a82] no-underline text-xs">
            문의하기
          </a>
        </div>
      </footer>
    </div>
  );
}
