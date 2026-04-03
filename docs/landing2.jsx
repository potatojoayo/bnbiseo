import { useState, useEffect, useRef } from "react";

function ChatDemo() {
  const [step, setStep] = useState(0);
  const ref = useRef(null);
  const msgs = [
    { f: "u", t: "마포 3호점 거실 전구가 나갔어요" },
    { f: "b", t: "거실 천장 LED 등기구\n삼성 SI-L60R1 확인했습니다.\n\n교체 비용: 12,000원 (부품+공임)\n방문 예약할까요?", opts: ["내일 오전", "내일 오후"] },
    { f: "u", t: "내일 오전" },
    { f: "b", t: "4/4(금) 오전 10~12시 예약 완료 ✓\nSI-L60R1 호환 전구를 가지고 방문합니다." },
  ];
  useEffect(() => {
    if (step < msgs.length) { const t = setTimeout(() => setStep(s => s + 1), step === 0 ? 600 : 1400); return () => clearTimeout(t); }
    const t = setTimeout(() => setStep(0), 3000); return () => clearTimeout(t);
  }, [step]);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [step]);

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-surface">
      <div className="px-4 py-3 border-b border-surface flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-500" />
        <span className="text-fg text-xs font-medium font-body">비앤비서 AI</span>
      </div>
      <div ref={ref} className="chat-scroll p-4 h-72 overflow-y-auto flex flex-col gap-2">
        {msgs.slice(0, step).map((m, i) => (
          <div key={i} className={`flex flex-col anim-in ${m.f === "u" ? "items-end" : "items-start"}`}>
            <div className={`px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line max-w-[85%] font-body ${m.f === "u" ? "bg-accent text-white rounded-t-xl rounded-bl-xl rounded-br-sm" : "bg-card text-fg rounded-t-xl rounded-br-xl rounded-bl-sm"}`}>
              {m.t}
            </div>
            {m.opts && (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {m.opts.map((o, j) => <span key={j} className="px-3 py-1 rounded-full border border-surface text-muted text-xs font-body">{o}</span>)}
              </div>
            )}
          </div>
        ))}
        {step > 0 && step < msgs.length && (
          <div className="flex flex-col items-start">
            <div className="bg-card rounded-xl px-4 py-2.5 flex gap-1 text-xs text-muted">
              <span className="blink-1">·</span><span className="blink-2">·</span><span className="blink-3">·</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function GuestDemo() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-surface">
      <div className="px-4 py-3 border-b border-surface flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-emerald-600" />
        <span className="text-fg text-xs font-medium font-body">숙소 가이드</span>
      </div>
      <div className="p-4 flex flex-col gap-2 min-h-[180px]">
        <div className="flex flex-col items-end">
          <div className="px-3.5 py-2.5 text-sm leading-relaxed text-white max-w-[85%] bg-emerald-600 rounded-t-xl rounded-bl-xl rounded-br-sm font-body">
            뜨거운 물이 안 나와요
          </div>
        </div>
        <div className="flex flex-col items-start">
          <div className="px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line text-fg max-w-[85%] bg-card rounded-t-xl rounded-br-xl rounded-bl-sm font-body">
            {"부엌 창가쪽 벽면 보일러\n(경동나비엔 NCB354)를 켜주세요.\n\n1. 전원 버튼 누르기\n2. '욕실' 버튼 선택\n3. 온도 50°C 설정\n\n약 3분 후 온수가 나옵니다."}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BnBiseoEditorial() {
  const [demo, setDemo] = useState("host");
  const [vis, setVis] = useState({});

  useEffect(() => {
    const obs = new IntersectionObserver(es => {
      es.forEach(e => { if (e.isIntersecting) setVis(p => ({ ...p, [e.target.id]: true })); });
    }, { threshold: 0.1 });
    document.querySelectorAll("[data-a]").forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const v = (id) => vis[id] ? "anim-visible" : "anim-hidden";

  return (
    <div className="min-h-screen bg-surface text-fg font-body antialiased overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;700;900&family=Sora:wght@300;400;500;600;700&display=swap');

        :root {
          --bg: #F6F4F0;
          --fg: #1a1a1a;
          --muted: #8a8a82;
          --accent: #D4421E;
          --card: #EDEAE4;
          --border: #d5d2cc;
        }

        .bg-surface { background: var(--bg); }
        .text-fg { color: var(--fg); }
        .text-muted { color: var(--muted); }
        .text-accent { color: var(--accent); }
        .bg-accent { background: var(--accent); }
        .bg-card { background: var(--card); }
        .border-surface { border-color: var(--border); }
        .bg-fg { background: var(--fg); }
        .text-surface { color: var(--bg); }

        .font-display { font-family: 'Noto Serif KR', serif; }
        .font-body { font-family: 'Sora', sans-serif; }

        /* Animations */
        @keyframes fadeIn { from { opacity: 0; transform: translateY(32px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes blink { 0%,100% { opacity:.2 } 50% { opacity:1 } }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }

        .anim-hidden { opacity: 0; transform: translateY(32px); transition: all 0.9s cubic-bezier(0.16, 1, 0.3, 1); }
        .anim-visible { opacity: 1; transform: translateY(0); }
        .anim-in { animation: fadeIn 0.3s ease both; }
        .anim-hero { animation: fadeIn 1s ease both; }
        .anim-marquee { animation: marquee 30s linear infinite; }

        .blink-1 { animation: blink 1s infinite 0s; }
        .blink-2 { animation: blink 1s infinite 0.2s; }
        .blink-3 { animation: blink 1s infinite 0.4s; }

        /* Hide chat scrollbar */
        .chat-scroll { scrollbar-width: none; -ms-overflow-style: none; }
        .chat-scroll::-webkit-scrollbar { display: none; }

        /* Hover effects */
        .hover-card:hover { background: var(--card); }

        /* Button hover */
        .btn-main:hover { background: var(--accent) !important; transform: scale(1.03); }
        .btn-main:hover .btn-arrow { transform: translateX(5px); }

        /* Nav blur */
        .nav-blur { background: rgba(246,244,240,0.9); backdrop-filter: blur(12px); }

        /* Hero title responsive */
        .hero-title { font-size: clamp(42px, 7vw, 80px); }
        .sec-title { font-size: clamp(28px, 4vw, 44px); }
        .cta-title { font-size: clamp(32px, 5vw, 56px); }
        /* Card number */
        .card-num { font-size: 48px; }

        /* Mobile overrides */
        @media (max-width: 768px) {
          .hero-title { font-size: 36px !important; }
          .card-num { font-size: 40px; }
          .mob-col { grid-template-columns: 1fr !important; }
          .mob-2col { grid-template-columns: 1fr 1fr !important; }
          .mob-show { display: flex !important; }
          .mob-hide-alt { display: none !important; }
          .mob-flex-col { flex-direction: column; }
        }
      `}</style>

      {/* Nav */}
      <nav className="nav-blur sticky top-0 z-50 px-12 py-5 flex justify-between items-center border-b border-surface max-md:px-6 max-md:py-4">
        <div className="font-display text-xl font-black tracking-tighter">비앤비서</div>
        <button className="font-body btn-main bg-fg text-surface border-none px-6 py-2.5 rounded-full text-sm font-semibold cursor-pointer" style={{ transition: "transform 0.2s, background 0.3s" }}>
          무료 등록
        </button>
      </nav>

      {/* Hero */}
      <section className="anim-hero max-w-5xl mx-auto px-12 pt-24 pb-20 max-md:px-6 max-md:pt-16 max-md:pb-14">
        <h1 className="font-display hero-title font-black leading-snug tracking-tighter mb-7">
          에어비앤비,
          <br />부업인데 왜
          <br /><span className="text-accent">본업</span>처럼 하시나요?
        </h1>
        <p className="text-muted text-lg font-light leading-relaxed max-w-lg mb-11 max-md:text-base">
          에어비앤비 유지보수, 비앤비서가 대신합니다.
          <br />숙소의 모든 시설물을 데이터화하고, 수리는 한마디면 끝.
        </p>
        <button className="font-body btn-main bg-fg text-surface border-none px-9 py-4 rounded-full text-base font-semibold cursor-pointer inline-flex items-center gap-3" style={{ transition: "transform 0.2s, background 0.3s, gap 0.3s" }}>
          무료로 숙소 등록하기
          <span className="btn-arrow text-lg" style={{ transition: "transform 0.3s" }}>→</span>
        </button>
        <div className="text-muted text-xs mt-4 font-normal">등록비 무료 · 서울 전 지역 · 가입 후 3일 내 방문</div>
      </section>

      {/* Marquee */}
      <div className="overflow-hidden border-y border-surface py-4">
        <div className="anim-marquee flex gap-16 w-max">
          {[...Array(2)].flatMap((_, k) =>
            ["공간 스캔", "디지털 트윈", "AI 챗봇 접수", "출장비 무료", "1회 방문 해결", "게스트 QR 가이드", "업계 최저가", "구독형 유지보수"].map((t, i) => (
              <span key={`${k}-${i}`} className="font-display text-sm text-muted whitespace-nowrap flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-accent opacity-50" />{t}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Problem */}
      <section id="prob" data-a className={`max-w-5xl mx-auto px-12 py-24 max-md:px-6 max-md:py-16 ${v("prob")}`}>
        <div className="text-accent text-xs font-bold tracking-widest uppercase mb-5">Problem</div>
        <h2 className="font-display sec-title font-black leading-tight tracking-tight mb-4">
          숙소가 늘수록<br />문제는 곱절이 됩니다
        </h2>
        <p className="text-muted text-sm leading-relaxed max-w-xl mb-12 font-light">
          수전 규격 확인하러 현장 방문, 업체 3곳에 견적 요청, 체크인 전 긴급 수리 — 이게 매주 반복됩니다.
        </p>

        <div className="grid grid-cols-3 mob-col gap-4">
          {[
            { icon: "🔍", t: "숙소마다 다른 규격", d: "5채의 수전이 다 다릅니다. 고장 나면 현장 방문 → 사진 → 업체 전송을 매번 반복해야 합니다." },
            { icon: "📞", t: "끝없는 게스트 DM", d: "\"보일러 어떻게 켜요?\" 5채에서 동시에 들어오면 대응이 불가능합니다." },
            { icon: "💸", t: "급할수록 비싼 수리비", d: "체크인 3시간 전 고장이면 웃돈 줘야 합니다. 부업 수익이 유지보수비로 새어나갑니다." },
          ].map((p, i) => (
            <div key={i} className="bg-card rounded-2xl p-7 max-md:p-5 transition-all duration-300 hover:scale-[1.02]">
              <div className="text-3xl mb-4">{p.icon}</div>
              <div className="text-base font-bold mb-2">{p.t}</div>
              <div className="text-muted text-xs leading-relaxed">{p.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <hr className="border-t border-surface mx-0" />

      {/* Solution */}
      <section id="sol" data-a className={`max-w-5xl mx-auto px-12 py-24 max-md:px-6 max-md:py-16 ${v("sol")}`}>
        <div className="text-accent text-xs font-bold tracking-widest uppercase mb-5">Solution</div>
        <h2 className="font-display sec-title font-black leading-tight tracking-tight mb-4">
          숙소를 통째로<br />데이터로 만듭니다
        </h2>
        <p className="text-muted text-sm leading-relaxed max-w-xl mb-12 font-light">
          전구 규격부터 보일러 모델까지. 한번 기록하면 수리 한마디에 부품·비용·일정이 자동으로 정리됩니다.
        </p>

        {/* Steps */}
        <div className="grid grid-cols-3 mob-col gap-4 mb-16">
          {[
            { icon: "📋", t: "공간 스캔", d: "전문가가 방문하여 조명·수전·보일러·가전·잠금장치의 브랜드·모델·규격을 기록합니다. 등록비 무료." },
            { icon: "🤖", t: "AI 챗봇 접수", d: "\"전구 나갔어요\" 한마디면 해당 숙소 DB를 조회해 정확한 부품과 비용을 안내하고 방문 예약까지." },
            { icon: "🔧", t: "방문 수리", d: "정확한 부품을 가지고 1회 방문으로 해결합니다. 구독 회원은 출장비 무료, 업계 최저가 보장." },
          ].map((s, i) => (
            <div key={i} className="bg-card rounded-2xl p-7 max-md:p-5 transition-all duration-300 hover:scale-[1.02]">
              <div className="text-3xl mb-4">{s.icon}</div>
              <div className="text-base font-bold mb-2">{s.t}</div>
              <div className="text-muted text-xs leading-relaxed">{s.d}</div>
            </div>
          ))}
        </div>

        {/* Demo Tabs (mobile) */}
        <div className="hidden mob-show rounded-xl overflow-hidden border border-surface mb-4">
          {[{ k: "host", l: "호스트 수리 접수" }, { k: "guest", l: "게스트 QR 가이드" }].map(t => (
            <button
              key={t.k}
              onClick={() => setDemo(t.k)}
              className={`flex-1 py-2.5 border-none cursor-pointer text-xs font-semibold font-body transition-all duration-200 ${demo === t.k ? "bg-card text-fg" : "bg-surface text-muted"}`}
            >{t.l}</button>
          ))}
        </div>

        {/* Demo Grid */}
        <div className="grid grid-cols-2 mob-col gap-8 items-start">
          <div className={demo !== "host" ? "mob-hide-alt" : ""}>
            <div className="text-xs font-semibold text-muted tracking-wide uppercase mb-3">호스트 수리 접수</div>
            <ChatDemo />
          </div>
          <div className={demo !== "guest" ? "mob-hide-alt" : ""}>
            <div className="text-xs font-semibold text-muted tracking-wide uppercase mb-3">게스트 QR 가이드</div>
            <GuestDemo />
          </div>
        </div>
      </section>

      <hr className="border-t border-surface mx-0" />

      {/* Repair Cost */}
      <section id="price" data-a className={`max-w-5xl mx-auto px-12 py-24 max-md:px-6 max-md:py-16 ${v("price")}`}>
        <div className="text-accent text-xs font-bold tracking-widest uppercase mb-5">Price</div>
        <h2 className="font-display sec-title font-black leading-tight tracking-tight mb-4">
          출장비 무료,<br />업계 최저가
        </h2>
        <p className="text-muted text-sm leading-relaxed max-w-xl mb-12 font-light">
          급할 때 바가지 쓸 일 없습니다. 부품+공임만, 출장비는 항상 무료.
        </p>

        <div className="grid grid-cols-4 mob-2col gap-4">
          {[
            { item: "전구 교체", before: "25,000~50,000", after: "12,000", save: "65" },
            { item: "수전 교체", before: "35,000~80,000", after: "15,000", save: "60" },
            { item: "보일러 점검", before: "50,000~100,000", after: "30,000", save: "55" },
            { item: "잠금장치 수리", before: "40,000~90,000", after: "20,000", save: "60" },
          ].map((r, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 max-md:p-5 border border-surface text-center transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
              <div className="text-muted text-xs font-medium mb-4">{r.item}</div>
              <div className="text-muted text-sm line-through opacity-50 mb-1">{r.before}원</div>
              <div className="text-accent font-bold text-2xl tracking-tight mb-2">{r.after}<span className="text-sm font-normal text-muted">원</span></div>
              <div className="inline-block bg-green-50 text-green-600 text-xs font-semibold px-3 py-1 rounded-full">▼ {r.save}% 절감</div>
            </div>
          ))}
        </div>

        <div className="text-center mt-6 text-muted text-xs">* 부품+공임 포함, 출장비 무료</div>
      </section>

      <hr className="border-t border-surface mx-0" />

      {/* CTA */}
      <section id="cta" data-a className={`max-w-5xl mx-auto px-12 py-28 text-center max-md:px-6 max-md:py-20 ${v("cta")}`}>
        <h2 className="font-display cta-title font-black leading-tight tracking-tighter mb-5">
          수리 걱정 없는
          <br />호스팅을 시작하세요
        </h2>
        <p className="text-muted text-base mb-10 font-light">등록비 무료 · 서울 전 지역 서비스 중</p>
        <button className="font-body btn-main bg-fg text-surface border-none px-9 py-4 rounded-full text-base font-semibold cursor-pointer inline-flex items-center gap-3 mx-auto" style={{ transition: "transform 0.2s, background 0.3s, gap 0.3s" }}>
          무료로 숙소 등록하기
          <span className="btn-arrow text-lg" style={{ transition: "transform 0.3s" }}>→</span>
        </button>
      </section>

      {/* Footer */}
      <footer className="px-12 py-7 border-t border-surface flex justify-between items-center text-muted text-xs max-md:px-6 max-md:flex-col max-md:gap-3">
        <span>© 2026 비앤비서 (BnBiseo)</span>
        <div className="flex gap-5 max-md:hidden">
          <a href="#" className="text-muted no-underline text-xs">이용약관</a>
          <a href="#" className="text-muted no-underline text-xs">개인정보처리방침</a>
          <a href="#" className="text-muted no-underline text-xs">문의하기</a>
        </div>
      </footer>
    </div>
  );
}
