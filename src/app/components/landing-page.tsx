import Link from "next/link";
import Marquee from "react-fast-marquee";
import { Logo } from "@/components/logo";
import { CtaButton } from "./cta-button";
import CleaningRequestDemo from "./cleaning-request-demo";
import ChecklistDemo from "./checklist-demo";
import PropertyCardDemo from "./property-card-demo";
import { AnimatedSection } from "./animated-section";

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
  return (
    <div
      className={`min-h-screen bg-surface text-on-surface ${FONT_BODY} antialiased`}
    >
      {/* Nav */}
      <nav className="bg-surface sticky top-0 z-50 h-14 max-md:h-12 px-12 flex justify-between items-center border-b border-outline-dim max-md:px-6">
        <a href="#"><Logo /></a>
        <CtaButton className={`${FONT_BODY} bg-on-surface text-surface border-none px-5 py-2 rounded-full text-sm font-semibold cursor-pointer transition-all duration-200 hover:bg-brand hover:scale-[1.03]`}>무료 등록</CtaButton>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-12 pt-24 pb-20 max-md:px-6 max-md:pt-16 max-md:pb-14">
        <h1
          className={`${FONT_DISPLAY} font-semibold tracking-tight mb-9`}
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
        <CtaButton className={`${BTN_MAIN} max-md:w-full max-md:justify-center`}>
          무료로 숙소 등록하기
          <span className="text-lg transition-transform duration-300 group-hover:translate-x-1.5">
            →
          </span>
        </CtaButton>
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
              className={`${FONT_BODY} text-sm font-normal text-on-surface-subtle whitespace-nowrap flex items-center gap-3 mx-8`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-brand opacity-50" />
              {t}
            </span>
          ))}
        </Marquee>
      </div>

      {/* Problem */}
      <AnimatedSection className={`${SECTION} py-24 max-md:py-16`}>
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
      </AnimatedSection>

      <hr className="border-t border-outline-dim mx-0" />

      {/* Solution */}
      <AnimatedSection className={`${SECTION} py-24 max-md:py-16`}>
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
            <div key={i} className="grid grid-cols-2 max-md:grid-cols-1 gap-6 items-start">
              <div className="bg-surface-dim rounded-2xl p-7 max-md:p-5 transition-all duration-300 hover:scale-[1.02]">
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
      </AnimatedSection>

      <hr className="border-t border-outline-dim mx-0" />

      {/* Before & After */}
      <AnimatedSection className={`${SECTION} py-24 max-md:py-16`}>
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
                { icon: "📋", label: "시설 점검", steps: "매 청소마다 15항목 체크리스트 + 사진 리포트 전송", time: "첫 청소 시" },
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
      </AnimatedSection>

      <hr className="border-t border-outline-dim mx-0" />

      {/* Pricing */}
      <AnimatedSection className={`${SECTION} py-24 max-md:py-16`}>
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
      </AnimatedSection>

      <hr className="border-t border-outline-dim mx-0" />

      {/* Use Cases */}
      <AnimatedSection className={`${SECTION} py-24 max-md:py-16`}>
        <div className={BADGE}>Use Cases</div>
        <h2 className={SEC_TITLE}>
          이럴 때
          <br />
          비앤비서를 찾으세요
        </h2>
        <p className={SEC_DESC}>
          급한 상황부터 루틴 관리까지,<br className='sm:hidden'/> 호스트가 가장 많이 겪는 순간들이에요.
        </p>

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
      </AnimatedSection>

      <hr className="border-t border-brand/15 mx-0" />

      {/* Launch Icon */}
      <AnimatedSection className="py-24 max-md:py-16">
        <div className={SECTION}>
          <div className={BADGE}>Open Event</div>
          <h2 className={SEC_TITLE}>
            지금 등록하면
            <br />
            특별 혜택을 드려요
          </h2>
          <p className={SEC_DESC}>
            오픈 기념 한정 혜택이에요.<br className='sm:hidden'/> 숙소 등록만 하면 바로 적용됩니다.
          </p>

          <div className="flex flex-col md:flex-row gap-5">
            {[
              {
                emoji: "🎁",
                title: "첫 청소 10,000원 할인",
                desc: "숙소 무료 등록만 하면 즉시 적용",
                value: "10,000원",
                label: "할인",
              },
              {
                emoji: "💐",
                title: "웰컴 세팅 무료",
                desc: "엽서 & 조화 침대 위 세팅 제공",
                value: "FREE",
                label: "무료 제공",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="group relative md:flex-1 transition-transform duration-300 hover:scale-[1.02]"
                style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.08)) drop-shadow(0 0 1px rgba(0,0,0,0.1))' }}
              >
                <div className="ticket-card flex bg-white rounded-2xl">
                  <div className="relative flex flex-col items-center justify-center px-6 py-7 bg-brand text-white w-[170px] max-md:w-[116px] shrink-0 rounded-l-2xl">
                    <span className="text-2xl mb-2">{item.emoji}</span>
                    <span className={`${FONT_BODY} text-[24px] max-md:text-[15px] font-bold tracking-tight leading-none`}>
                      {item.value}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest text-white/60 font-semibold mt-1.5">
                      {item.label}
                    </span>
                  </div>

                  {/* Vertical dashed line */}
                  <div className="w-0 relative">
                    <div className="ticket-dash absolute top-4 bottom-4 left-0" />
                  </div>

                  <div className="flex-1 flex flex-col justify-center px-6 py-5 max-md:px-4">
                    <div className="text-[16px] max-md:text-[15px] font-bold mb-1.5">{item.title}</div>
                    <div className="text-[14px] leading-relaxed text-ink-muted max-md:text-[13px]">{item.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      <hr className="border-t border-brand/15 mx-0" />

      {/* CTA */}
      <AnimatedSection className="px-12 py-28 text-center max-md:px-6 max-md:py-20">
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
        <CtaButton className={`${BTN_MAIN} mx-auto`}>
          무료로 숙소 등록하기
          <span className="text-lg transition-transform duration-300 group-hover:translate-x-1.5">
            →
          </span>
        </CtaButton>
      </AnimatedSection>

      {/* Footer */}
      <footer className="border-t border-outline-dim px-12 py-10 text-[13px] text-ink-muted max-md:px-6">
        <div className="max-w-[960px] mx-auto flex flex-col gap-4">
          {/* Business info */}
          <div className="flex flex-col gap-1 text-[12px] text-ink-faint">
            <p>실버백 고릴라즈 | 대표 최정호</p>
            <p>사업자등록번호 762-11-02534</p>
            <p>서울특별시 영등포구 신풍로 28, 2층 청년쿡 푸드테크 센터</p>
            <p>전화 010-2960-4676 | 이메일 potatojoayo@gmail.com</p>
          </div>

          {/* Links */}
          <div className="flex gap-4">
            <a href="/legal/terms" target="_blank" rel="noopener noreferrer" className="text-[12px] text-ink-faint transition-colors hover:text-ink-muted">
              이용약관
            </a>
            <div className="h-3 w-px self-center bg-outline-strong" />
            <a href="/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-[12px] text-ink-faint transition-colors hover:text-ink-muted">
              개인정보처리방침
            </a>
          </div>

          {/* Copyright */}
          <p className="text-[11px] text-ink-faint">
            © 2026 실버백 고릴라즈. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
