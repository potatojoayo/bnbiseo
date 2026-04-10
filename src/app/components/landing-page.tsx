"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Marquee from "react-fast-marquee";
import CleaningRequestDemo from "./cleaning-request-demo";
import ChecklistDemo from "./checklist-demo";
import PropertyCardDemo from "./property-card-demo";

const PROBLEMS = [
  {
    icon: "🚨",
    t: "이모님이 갑자기 펑크 냈어요",
    d: "당일 체크인인데 청소 매니저가 연락두절. 급하게 이리저리 사람 찾아 헤매다 결국 직접 뛰어갑니다.",
  },
  {
    icon: "😰",
    t: "해외에서 시설 고장 연락이 왔어요",
    d: "출장 중인데 보일러 고장, 도어락 오류. 원격으로는 대응이 안 되고 건당 2~3배 비용을 물어야 합니다.",
  },
  {
    icon: "📋",
    t: "청소만 하고 시설은 아무도 안 봐요",
    d: "이모님은 청소만 하고 가시니까, 전구가 나가고 수전이 새는 건 게스트 리뷰로 알게 됩니다.",
  },
];

const STEPS = [
  {
    icon: "📝",
    t: "저희가 직접 찾아갈게요",
    d: "첫 등록 시 전문가가 숙소를 방문해서 시설물, 비품, 규격을 꼼꼼히 기록합니다. 방문비 무료!",
  },
  {
    icon: "📱",
    t: "필요할 때 터치 한 번",
    d: "표준 청소든, 당일 긴급이든, 터치 한 번이면 전문 매니저가 출동합니다. 단건 요청, 단건 결제.",
  },
  {
    icon: "✅",
    t: "호텔식 세팅 + 시설 점검 리포트",
    d: "에어비앤비 전문 호텔식 세팅은 기본. 매 청소마다 15항목 시설 점검 후 사진 리포트를 보내드려요.",
  },
];

const MARQUEE_ITEMS = [
  "에어비앤비 전문 청소",
  "호텔식 세팅",
  "당일 긴급 대응",
  "시설 점검 리포트",
  "15항목 체크리스트",
  "단건 요청 단건 결제",
  "숙소 정보 무료 등록",
  "담배냄새 특수 청소",
];

const SCENARIOS = [
  {
    icon: "🚨",
    t: "이모님이 갑자기 펑크 냈을 때",
    d: "당일 체크인 앞두고 연락두절? 할증만 내면 당일 매니저가 바로 투입됩니다.",
  },
  {
    icon: "🏨",
    t: "호텔식 세팅 전문가가 필요할 때",
    d: "에어비앤비 '마의 4시간'을 아는 전문 매니저가 체크아웃과 체크인 사이를 책임집니다.",
  },
  {
    icon: "📊",
    t: "시설 상태를 보고받고 싶을 때",
    d: "15항목 체크리스트 + 사진 리포트. 전구, 수전, 도어락, 보일러까지 매번 확인해 드려요.",
  },
  {
    icon: "🚬",
    t: "담배냄새를 빠르게 빼야 할 때",
    d: "게스트 흡연으로 다음 체크인이 걱정될 때, 특수 청소로 빠르게 대응합니다.",
  },
];

const FONT_DISPLAY = "font-heading";
const FONT_BODY = "font-text";
const SECTION = "max-w-5xl mx-auto px-12 max-md:px-6";
const BADGE = "text-brand text-xs font-bold tracking-widest uppercase mb-5";
const SEC_TITLE = `${FONT_DISPLAY} text-[clamp(28px,4vw,44px)] font-medium leading-tight tracking-tight mb-4`;
const SEC_DESC =
  "text-on-surface-subtle text-sm leading-relaxed max-w-xl mb-12";
const BTN_MAIN = `${FONT_BODY} bg-on-surface text-surface border-none px-9 py-4 rounded-full text-base font-semibold cursor-pointer inline-flex items-center gap-3 transition-all duration-200 hover:bg-brand hover:scale-[1.03] group`;

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
      className={`min-h-screen bg-surface text-on-surface ${FONT_BODY} antialiased`}
    >
      {/* Nav */}
      <nav className="bg-surface sticky top-0 z-50 h-14 max-md:h-12 px-12 flex justify-between items-center border-b border-outline-dim max-md:px-6">
        <Link href="/" className={`${FONT_DISPLAY} text-xl font-medium tracking-tighter transition-all duration-200 hover:text-brand hover:scale-[1.05]`}>
          비앤비서
        </Link>
        <Link href="/signup" className={`${FONT_BODY} bg-on-surface text-surface border-none px-5 py-2 rounded-full text-sm font-semibold cursor-pointer transition-all duration-200 hover:bg-brand hover:scale-[1.03]`}>무료 등록</Link>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-12 pt-24 pb-20 max-md:px-6 max-md:pt-16 max-md:pb-14">
        <h1
          className={`${FONT_DISPLAY} font-medium tracking-tight mb-9`}
        >
          <span className="block text-[clamp(36px,5.5vw,64px)] max-md:text-[34px] leading-tight animate-fade-in-d1">
            체크인 3시간 전,
          </span>
          <span className="block text-[clamp(48px,8vw,96px)] max-md:text-[44px] leading-tight animate-fade-in-d2">
            이모님이 <span className="text-brand">안 와요</span>
          </span>
        </h1>
        <p className="animate-fade-in-d3 text-on-surface-subtle text-base leading-relaxed max-w-md mb-11 max-md:text-base">
          이제 급하게 사람 찾지 마세요.
          <br />
          비앤비서가 전문 매니저를 바로 보내드릴게요.
        </p>
        <Link href="/signup" className={`${BTN_MAIN} max-md:w-full max-md:justify-center`}>
          무료로 숙소 등록하기
          <span className="text-lg transition-transform duration-300 group-hover:translate-x-1.5">
            →
          </span>
        </Link>
        <div className="text-on-surface-subtle text-xs mt-4 font-normal max-md:text-center">
          마포구·서대문구 먼저 시작해요 · 첫 청소 10,000원 할인
        </div>
      </section>

      {/* Marquee */}
      <div className="border-y border-outline-dim py-4">
        <Marquee speed={64} gradient={false} autoFill>
          {MARQUEE_ITEMS.map((t, i) => (
            <span
              key={i}
              className={`${FONT_DISPLAY} text-sm text-on-surface-subtle whitespace-nowrap flex items-center gap-3 mx-8`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-brand opacity-50" />
              {t}
            </span>
          ))}
        </Marquee>
      </div>

      {/* Problem */}
      <section
        id="prob"
        data-a
        className={`${SECTION} py-24 max-md:py-16 ${v("prob")}`}
      >
        <div className={BADGE}>Problem</div>
        <h2 className={SEC_TITLE}>
          숙소 관리,
          <br />
          혼자 감당하기 힘드시죠
        </h2>
        <p className={SEC_DESC}>
          이모님 관리, 긴급 대응, 시설 점검 <br className='sm:hidden'/> — 이게 매주 반복되면 지치잖아요.
        </p>

        <div className="grid grid-cols-3 max-md:grid-cols-1 gap-4">
          {PROBLEMS.map((p, i) => (
            <div
              key={i}
              className="bg-surface-dim rounded-2xl p-7 max-md:p-5 transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="text-3xl mb-4">{p.icon}</div>
              <div className="text-[17px] font-bold mb-2">{p.t}</div>
              <div className="text-on-surface-subtle text-sm leading-relaxed">
                {p.d}
              </div>
            </div>
          ))}
        </div>
      </section>

      <hr className="border-t border-outline-dim mx-0" />

      {/* Solution */}
      <section
        id="sol"
        data-a
        className={`${SECTION} py-24 max-md:py-16 ${v("sol")}`}
      >
        <div className={BADGE}>Solution</div>
        <h2 className={SEC_TITLE}>
          터치 한 번이면
          <br />
          전문 매니저가 출동합니다
        </h2>
        <p className={SEC_DESC}>
          에어비앤비 전문 청소 + 시설 점검.<br className='sm:hidden'/> 급할 때도, 정기적으로도.
        </p>

        {/* Steps + Demos: 2 columns, 3 rows */}
        <div className="flex flex-col gap-24 max-md:gap-10">
          {[
            { step: STEPS[0], demo: <PropertyCardDemo /> },
            { step: STEPS[1], demo: <CleaningRequestDemo /> },
            { step: STEPS[2], demo: <ChecklistDemo /> },
          ].map(({ step, demo }, i) => (
            <div key={i} className="grid grid-cols-2 max-md:grid-cols-1 gap-6 items-center">
              <div className="bg-surface-dim rounded-2xl p-7 max-md:p-5 transition-all duration-300 hover:scale-[1.02] h-full flex flex-col justify-center">
                <div className="text-on-surface-subtle text-xs font-semibold tracking-widest uppercase mb-3">Step {i + 1}</div>
                <div className="text-3xl mb-4">{step.icon}</div>
                <div className="text-[17px] font-bold mb-2">{step.t}</div>
                <div className="text-on-surface-subtle text-sm leading-relaxed">
                  {step.d}
                </div>
              </div>
              {demo}
            </div>
          ))}
        </div>
      </section>

      <hr className="border-t border-outline-dim mx-0" />

      {/* Before & After */}
      <section
        id="compare"
        data-a
        className={`${SECTION} py-24 max-md:py-16 ${v("compare")}`}
      >
        <div className={BADGE}>Before & After</div>
        <h2 className={SEC_TITLE}>
          혼자 전전긍긍 vs 터치 한 번
        </h2>
        <p className={SEC_DESC}>
          비앤비서 하나로 호스팅이 이렇게 달라져요.
        </p>

        <div className="grid grid-cols-2 max-md:grid-cols-1 gap-4">
          {/* Before */}
          <div className="bg-white rounded-2xl border border-outline-dim overflow-hidden transition-all duration-300 hover:scale-[1.02]">
            <div className="px-6 py-4 border-b border-outline-dim flex items-center gap-2">
              <span className="text-base">😩</span>
              <span className="text-sm font-bold text-on-surface-subtle">지금</span>
            </div>
            <div className="p-6 flex flex-col divide-y divide-outline-dim/30">
              {[
                { icon: "🧹", label: "청소", steps: "이모님 관리, 펑크 시 직접 뛰어가기, 호텔식 세팅은 기대 불가", time: "매번 불안" },
                { icon: "🚨", label: "긴급 대응", steps: "급하게 사람 찾아 헤매고, 웃돈 주고 부르고, 그래도 안 올 수 있음", time: "반나절 이상" },
                { icon: "📋", label: "시설 점검", steps: "아무도 안 봐줌. 게스트 리뷰로 고장을 알게 되는 구조", time: "체계 없음" },
              ].map((item, i) => (
                <div key={i} className="flex gap-3 py-4 first:pt-0 last:pb-0">
                  <span className="text-lg shrink-0 mt-0.5">{item.icon}</span>
                  <div>
                    <div className="text-sm font-bold mb-1">{item.label}</div>
                    <div className="text-on-surface-subtle text-sm leading-relaxed mb-1.5">{item.steps}</div>
                    <div className="inline-block bg-red-50 text-red-500 text-xs font-semibold px-2.5 py-0.5 rounded-full">{item.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* After */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-xl shadow-black/10 border border-outline-dim transition-all duration-300 hover:scale-[1.02]">
            <div className="px-6 py-4 border-b border-outline-dim flex items-center gap-2">
              <span className="text-base">✨</span>
              <span className={`${FONT_DISPLAY} text-sm font-medium tracking-tighter`}>비앤비서</span>
            </div>
            <div className="p-6 flex flex-col divide-y divide-outline-dim/30">
              {[
                { icon: "🧹", label: "청소", steps: "에어비앤비 전문 매니저가 호텔식 세팅. 35,000원부터.", time: "터치 한 번" },
                { icon: "🚨", label: "긴급 대응", steps: "할증만 내면 당일 매니저 출동. 해외에서도, 새벽에도.", time: "당일 해결" },
                { icon: "📋", label: "시설 점검", steps: "매 청소마다 15항목 체크리스트 + 사진 리포트 전송", time: "매회 자동" },
              ].map((item, i) => (
                <div key={i} className="flex gap-3 py-4 first:pt-0 last:pb-0">
                  <span className="text-lg shrink-0 mt-0.5">{item.icon}</span>
                  <div>
                    <div className="text-sm font-bold mb-1">{item.label}</div>
                    <div className="text-on-surface-subtle text-sm leading-relaxed mb-1.5">{item.steps}</div>
                    <div className="inline-block bg-green-50 text-green-600 text-xs font-semibold px-2.5 py-0.5 rounded-full">{item.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <hr className="border-t border-outline-dim mx-0" />

      {/* Pricing */}
      <section
        id="pricing"
        data-a
        className={`${SECTION} py-24 max-md:py-16 ${v("pricing")}`}
      >
        <div className={BADGE}>Pricing</div>
        <h2 className={SEC_TITLE}>
          단건 요청, 단건 결제
        </h2>
        <p className={SEC_DESC}>
          구독 없이, 필요할 때만 쓰세요.
        </p>

        <div className="grid grid-cols-3 max-md:grid-cols-1 gap-4">
          <div className="bg-white rounded-2xl border border-outline-dim p-7 max-md:p-5 transition-all duration-300 hover:scale-[1.02]">
            <div className="text-3xl mb-4">🧹</div>
            <div className="text-[17px] font-bold mb-1">표준 청소</div>
            <div className={`${FONT_DISPLAY} text-[28px] font-medium tracking-tight text-brand mb-3`}>35,000원~</div>
            <div className="text-on-surface-subtle text-sm leading-relaxed">
              면적·침구 수량 기준 산정. 에어비앤비 전문 호텔식 세팅 + 15항목 시설 점검 리포트 포함.
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-outline-dim p-7 max-md:p-5 transition-all duration-300 hover:scale-[1.02]">
            <div className="text-3xl mb-4">🚨</div>
            <div className="text-[17px] font-bold mb-1">긴급 청소</div>
            <div className={`${FONT_DISPLAY} text-[28px] font-medium tracking-tight text-brand mb-3`}>당일 대응</div>
            <div className="text-on-surface-subtle text-sm leading-relaxed">
              이모님 펑크, 급한 체크인 대응. 별도 할증이 있지만, 이리저리 사람 찾을 필요 없이 바로 해결.
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-outline-dim p-7 max-md:p-5 transition-all duration-300 hover:scale-[1.02]">
            <div className="text-3xl mb-4">🔧</div>
            <div className="text-[17px] font-bold mb-1">수리 서비스</div>
            <div className={`${FONT_DISPLAY} text-[28px] font-medium tracking-tight text-brand mb-3`}>건별 견적</div>
            <div className="text-on-surface-subtle text-sm leading-relaxed">
              청소 중 발견된 하자를 리포트로 알려드리고, 승인하시면 다음 방문에 수리까지 한 번에.
            </div>
          </div>
        </div>
      </section>

      <hr className="border-t border-outline-dim mx-0" />

      {/* Use Cases */}
      <section
        id="usecases"
        data-a
        className={`${SECTION} py-24 max-md:py-16 ${v("usecases")}`}
      >
        <div className={BADGE}>Use Cases</div>
        <h2 className={SEC_TITLE}>
          이럴 때
          <br />
          비앤비서를 찾으세요
        </h2>

        <div className="grid grid-cols-2 max-md:grid-cols-1 gap-4">
          {SCENARIOS.map((s, i) => (
            <div
              key={i}
              className="bg-surface-dim rounded-2xl p-7 max-md:p-5 transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="text-3xl mb-4">{s.icon}</div>
              <div className="text-[17px] font-bold mb-2">{s.t}</div>
              <div className="text-on-surface-subtle text-sm leading-relaxed">
                {s.d}
              </div>
            </div>
          ))}
        </div>
      </section>

      <hr className="border-t border-brand/15 mx-0" />

      {/* Launch Event */}
      <section
        id="event"
        data-a
        className={`bg-brand/5 py-24 max-md:py-16 ${v("event")}`}
      >
        <div className={SECTION}>
          <div className={BADGE}>Launch Event</div>
          <h2 className={SEC_TITLE}>
            지금 등록하면
            <br />
            특별 혜택을 드려요
          </h2>

          <div className="grid grid-cols-2 max-md:grid-cols-1 gap-4">
            {[
              {
                emoji: "🎁",
                title: "첫 청소 10,000원 할인",
                desc: "숙소 정보를 무료로 등록하기만 하면, 첫 청소 시 즉시 적용됩니다.",
              },
              {
                emoji: "💐",
                title: "웰컴 세팅 무료",
                desc: "웰컴메시지 엽서 & 조화 침대 위 세팅을 무료로 진행해 드립니다. 게스트 첫인상을 확 바꿔드려요.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="relative overflow-hidden bg-white border border-brand/25 rounded-2xl p-7 max-md:p-5 transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-brand/60 rounded-t-2xl" />
                <span className="inline-block text-[11px] font-semibold tracking-wide text-brand bg-brand/8 rounded-full px-2.5 py-0.5 mb-4">
                  런치 이벤트
                </span>
                <div className="text-3xl mb-3">{item.emoji}</div>
                <div className="text-[17px] font-bold mb-2">{item.title}</div>
                <div className="text-on-surface-subtle text-sm leading-relaxed">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="border-t border-brand/15 mx-0" />

      {/* CTA */}
      <section
        id="cta"
        data-a
        className={`px-12 py-28 text-center max-md:px-6 max-md:py-20 ${v("cta")}`}
      >
        <h2
          className={`${FONT_DISPLAY} text-[clamp(32px,5vw,56px)] font-medium leading-tight tracking-tighter mb-5`}
        >
          청소 걱정 없는
          <br />
          호스팅을 시작하세요
        </h2>
        <p className="text-on-surface-subtle text-sm sm:text-base mb-10">
          마포구·서대문구 먼저 시작해요 · 첫 청소 10,000원 할인
        </p>
        <Link href="/signup" className={`${BTN_MAIN} mx-auto`}>
          무료로 숙소 등록하기
          <span className="text-lg transition-transform duration-300 group-hover:translate-x-1.5">
            →
          </span>
        </Link>
      </section>

      {/* Footer */}
      <footer className="px-12 py-7 border-t border-outline-dim flex justify-between items-center text-on-surface-subtle text-xs max-md:px-6 max-md:flex-col max-md:gap-3">
        <span>© 2026 비앤비서 (BnBiseo)</span>
        <div className="flex gap-5 max-md:hidden">
          <a href="#" className="text-on-surface-subtle no-underline text-xs">
            이용약관
          </a>
          <a href="#" className="text-on-surface-subtle no-underline text-xs">
            개인정보처리방침
          </a>
          <a href="#" className="text-on-surface-subtle no-underline text-xs">
            문의하기
          </a>
        </div>
      </footer>
    </div>
  );
}
