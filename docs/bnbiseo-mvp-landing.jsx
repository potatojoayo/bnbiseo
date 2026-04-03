import { useState, useEffect, useRef } from "react";

const PAIN_POINTS = [
  {
    icon: "🔍",
    title: "정보의 비대칭",
    desc: "수전 고장나면 규격 확인하러 직접 현장에 가야 하고, 업체마다 다른 견적에 시간만 낭비",
  },
  {
    icon: "📞",
    title: "반복되는 게스트 문의",
    desc: "\"보일러 어떻게 켜요?\" \"와이파이 비번 뭐예요?\" 매번 같은 질문에 같은 답변",
  },
  {
    icon: "💸",
    title: "감에 의존하는 운영",
    desc: "수리비 바가지, 급할 때 부르면 웃돈 — 부업 수익이 유지보수비로 새어나감",
  },
];

function ChatDemo() {
  const [step, setStep] = useState(0);
  const chatRef = useRef(null);
  const messages = [
    { from: "user", text: "거실 전구가 나갔어요" },
    { from: "bot", text: "거실 천장 LED 등기구\n(삼성 SI-L60R1) 확인했습니다.\n\n교체 비용: 12,000원\n(부품+공임, 구독 회원가)\n\n방문 예약할까요?", options: ["내일 오전", "내일 오후"] },
    { from: "user", text: "내일 오전" },
    { from: "bot", text: "4월 4일(금) 오전 10~12시\n방문 예약 완료했습니다. ✓\n\n기사가 삼성 SI-L60R1 호환 전구를\n가지고 방문합니다." },
  ];

  useEffect(() => {
    if (step < messages.length) {
      const t = setTimeout(() => setStep(s => s + 1), step === 0 ? 600 : 1400);
      return () => clearTimeout(t);
    }
    const reset = setTimeout(() => setStep(0), 3000);
    return () => clearTimeout(reset);
  }, [step]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [step]);

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-avatar" style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED)" }}>🔧</div>
        <div>
          <div style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>비앤비서 AI</div>
          <div style={{ color: "#22c55e", fontSize: 10 }}>● 온라인</div>
        </div>
      </div>
      <div ref={chatRef} className="chat-body">
        {messages.slice(0, step).map((m, i) => (
          <div key={i} className={`msg ${m.from === "user" ? "msg-user" : "msg-bot"}`}>
            <div className={`bubble ${m.from === "user" ? "bubble-user" : "bubble-bot"}`}>
              {m.text}
            </div>
            {m.options && (
              <div className="msg-options">
                {m.options.map((o, j) => (
                  <div key={j} className="msg-option">{o}</div>
                ))}
              </div>
            )}
          </div>
        ))}
        {step > 0 && step < messages.length && (
          <div className="msg msg-bot">
            <div className="bubble bubble-bot typing">
              <span>●</span><span>●</span><span>●</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function GuestDemo() {
  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-avatar" style={{ background: "linear-gradient(135deg, #059669, #2563EB)" }}>💬</div>
        <div>
          <div style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>숙소 가이드</div>
          <div style={{ color: "#64748b", fontSize: 10 }}>QR 코드로 접속</div>
        </div>
      </div>
      <div className="chat-body" style={{ height: "auto", minHeight: 200 }}>
        <div className="msg msg-user">
          <div className="bubble bubble-guest">뜨거운 물이 안 나와요</div>
        </div>
        <div className="msg msg-bot">
          <div className="bubble bubble-bot">
            부엌 창가쪽 벽면 보일러
            {"\n"}(경동나비엔 NCB354)를 켜주세요.
            {"\n"}
            {"\n"}1. 전원 버튼 누르기
            {"\n"}2. '욕실' 버튼 선택
            {"\n"}3. 온도 50°C 설정
            {"\n"}
            {"\n"}약 3분 후 온수가 나옵니다 ☺
          </div>
        </div>
      </div>
    </div>
  );
}

function CompareTable() {
  const rows = [
    { item: "수전 교체", before: "35,000 ~ 80,000", after: "15,000", save: "60%" },
    { item: "전구 교체", before: "25,000 ~ 50,000", after: "12,000", save: "65%" },
    { item: "보일러 점검", before: "50,000 ~ 100,000", after: "30,000", save: "55%" },
    { item: "잠금장치 수리", before: "40,000 ~ 90,000", after: "20,000", save: "60%" },
  ];

  return (
    <div className="compare-table-wrap">
      <table className="compare-table">
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>수리 항목</th>
            <th>일반 업체</th>
            <th>비앤비서</th>
            <th>절감율</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td style={{ textAlign: "left", fontWeight: 600, color: "#e2e8f0" }}>{r.item}</td>
              <td style={{ color: "#94a3b8", textDecoration: "line-through", opacity: 0.7 }}>{r.before}원</td>
              <td style={{ color: "#60a5fa", fontWeight: 700 }}>{r.after}원</td>
              <td><span className="save-badge">▼ {r.save}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ color: "#475569", fontSize: 11, marginTop: 10, textAlign: "center" }}>
        * 부품+공임 포함, 구독 회원 기준 (출장비 무료)
      </div>
    </div>
  );
}

export default function BnBiseoMVP() {
  const [activeDemo, setActiveDemo] = useState("host");
  const [visibleSections, setVisibleSections] = useState({});

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          setVisibleSections(prev => ({ ...prev, [e.target.id]: true }));
        }
      });
    }, { threshold: 0.15 });

    document.querySelectorAll("[data-animate]").forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const anim = (id) => visibleSections[id] ? "section-visible" : "section-hidden";

  return (
    <div className="page">
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');

        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }

        .page {
          min-height: 100vh;
          background: #0a0a1a;
          color: #e2e8f0;
          font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
          overflow-x: hidden;
        }

        /* Animations */
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes blink { 0%, 100% { opacity: 0.2; } 50% { opacity: 1; } }
        @keyframes gradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }

        .section-hidden { opacity: 0; transform: translateY(24px); transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1); }
        .section-visible { opacity: 1; transform: translateY(0); }

        /* Nav */
        .nav {
          position: sticky; top: 0; z-index: 100;
          padding: 16px 32px;
          display: flex; justify-content: space-between; align-items: center;
          backdrop-filter: blur(20px);
          background: rgba(10,10,26,0.85);
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .nav-logo { display: flex; align-items: center; gap: 8px; }
        .nav-logo-icon {
          width: 28px; height: 28px; border-radius: 8px;
          background: linear-gradient(135deg, #2563EB, #7C3AED);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 800; color: #fff;
        }
        .nav-logo-text { font-size: 17px; font-weight: 800; color: #fff; letter-spacing: -0.03em; }
        .nav-cta {
          background: #2563EB; color: #fff; border: none;
          padding: 8px 20px; border-radius: 8px;
          font-size: 13px; font-weight: 600; cursor: pointer;
          font-family: inherit;
        }

        /* Hero */
        .hero {
          padding: 72px 32px 56px;
          text-align: center;
          position: relative;
        }
        .hero-glow {
          position: absolute; top: -60px; left: 50%; transform: translateX(-50%);
          width: 500px; height: 500px; border-radius: 50%;
          background: radial-gradient(circle, rgba(37,99,235,0.1) 0%, transparent 70%);
          pointer-events: none;
        }
        .hero-sub {
          font-size: 16px; line-height: 1.5;
          color: #94a3b8; margin-bottom: 0;
        }
        .hero-h1 {
          font-size: clamp(28px, 6vw, 48px);
          font-weight: 800; color: #fff;
          line-height: 1.3; letter-spacing: -0.03em;
          margin-bottom: 14px;
        }
        .hero-em {
          color: #dc2626; font-style: normal;
        }
        .hero-cta-wrap { margin-top: 36px; display: flex; flex-direction: column; align-items: center; gap: 10px; }
        .hero-cta {
          background: linear-gradient(135deg, #2563EB, #7C3AED);
          color: #fff; border: none;
          padding: 16px 40px; border-radius: 14px;
          font-size: 16px; font-weight: 700; cursor: pointer;
          box-shadow: 0 4px 28px rgba(37,99,235,0.35);
          font-family: inherit;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .hero-cta:hover { transform: translateY(-2px); box-shadow: 0 6px 36px rgba(37,99,235,0.45); }
        .hero-cta-sub { color: #475569; font-size: 12px; }

        /* Section Titles */
        .section { padding: 0 32px; max-width: 960px; margin: 0 auto; }
        .section-title {
          font-size: clamp(20px, 3.5vw, 28px);
          font-weight: 800; color: #fff;
          line-height: 1.3; letter-spacing: -0.02em;
          margin-bottom: 8px;
        }
        .section-desc { color: #64748b; font-size: 14px; line-height: 1.5; margin-bottom: 32px; }
        .section-badge {
          display: inline-block; padding: 5px 14px; border-radius: 16px;
          background: rgba(37,99,235,0.1); border: 1px solid rgba(37,99,235,0.2);
          color: #60a5fa; font-size: 11px; font-weight: 600; margin-bottom: 14px;
        }

        /* Pain Points */
        .pains { padding-bottom: 64px; }
        .pain-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .pain-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px; padding: 28px 22px;
          transition: border-color 0.3s;
        }
        .pain-card:hover { border-color: rgba(220,38,38,0.3); }
        .pain-icon { font-size: 28px; margin-bottom: 14px; }
        .pain-title { color: #fff; font-size: 15px; font-weight: 700; margin-bottom: 8px; }
        .pain-desc { color: #94a3b8; font-size: 13px; line-height: 1.6; }

        /* Solution */
        .solution { padding-bottom: 64px; }
        .sol-divider {
          display: flex; align-items: center; gap: 14px;
          margin-bottom: 48px; padding: 0 32px;
          max-width: 960px; margin-left: auto; margin-right: auto;
        }
        .sol-divider-line { flex: 1; height: 1px; background: rgba(255,255,255,0.06); }

        /* Process Steps */
        .steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 48px; }
        .step-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px; padding: 28px 22px;
          position: relative; overflow: hidden;
          transition: border-color 0.3s;
        }
        .step-card:hover { border-color: rgba(37,99,235,0.3); }
        .step-num {
          position: absolute; top: 12px; right: 16px;
          color: rgba(255,255,255,0.04); font-size: 44px; font-weight: 900;
        }
        .step-icon { font-size: 32px; margin-bottom: 14px; }
        .step-title { color: #fff; font-size: 16px; font-weight: 700; margin-bottom: 8px; }
        .step-desc { color: #94a3b8; font-size: 13px; line-height: 1.6; }

        /* Chat Demos */
        .demo-section { margin-bottom: 48px; }
        .demo-tabs {
          display: flex; border-radius: 10px; overflow: hidden;
          border: 1px solid rgba(255,255,255,0.08); margin-bottom: 20px;
          max-width: 440px;
        }
        .demo-tab {
          flex: 1; padding: 11px 0; border: none; cursor: pointer;
          font-size: 13px; font-weight: 600; font-family: inherit;
          transition: all 0.2s;
        }
        .demo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start; }

        .chat-window {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 18px; overflow: hidden;
          max-width: 440px;
        }
        .chat-header {
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          display: flex; align-items: center; gap: 10px;
        }
        .chat-avatar {
          width: 30px; height: 30px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px;
        }
        .chat-body {
          padding: 14px; height: 300px; overflow-y: auto;
          display: flex; flex-direction: column; gap: 8px;
        }
        .msg { display: flex; flex-direction: column; animation: fadeUp 0.3s ease both; }
        .msg-user { align-items: flex-end; }
        .msg-bot { align-items: flex-start; }
        .bubble {
          padding: 10px 14px; font-size: 13px; line-height: 1.6;
          white-space: pre-line; color: #fff; max-width: 85%;
        }
        .bubble-user { background: #2563EB; border-radius: 14px 14px 4px 14px; }
        .bubble-guest { background: #059669; border-radius: 14px 14px 4px 14px; }
        .bubble-bot { background: rgba(255,255,255,0.08); border-radius: 14px 14px 14px 4px; }
        .typing { display: flex; gap: 4px; font-size: 10px; color: #64748b; padding: 10px 16px; }
        .typing span:nth-child(1) { animation: blink 1s infinite 0s; }
        .typing span:nth-child(2) { animation: blink 1s infinite 0.2s; }
        .typing span:nth-child(3) { animation: blink 1s infinite 0.4s; }
        .msg-options { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
        .msg-option {
          padding: 6px 13px; border-radius: 18px;
          border: 1px solid rgba(37,99,235,0.4);
          color: #60a5fa; font-size: 12px;
        }

        /* Compare */
        .compare-section { padding-bottom: 64px; }
        .compare-table-wrap {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px; padding: 24px; overflow-x: auto;
        }
        .compare-table { width: 100%; border-collapse: collapse; }
        .compare-table th {
          color: #64748b; font-size: 12px; font-weight: 600;
          padding: 0 12px 14px; text-align: center;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .compare-table td {
          padding: 14px 12px; text-align: center; font-size: 13px;
          border-bottom: 1px solid rgba(255,255,255,0.03);
        }
        .save-badge {
          background: rgba(34,197,94,0.12); color: #22c55e;
          padding: 3px 10px; border-radius: 10px;
          font-size: 12px; font-weight: 700;
        }

        /* CTA */
        .cta-section {
          padding: 80px 32px;
          text-align: center;
          border-top: 1px solid rgba(255,255,255,0.04);
        }
        .cta-title {
          font-size: clamp(22px, 4vw, 32px);
          font-weight: 800; color: #fff;
          line-height: 1.3; letter-spacing: -0.02em;
          margin-bottom: 12px;
        }
        .cta-desc { color: #64748b; font-size: 14px; margin-bottom: 32px; line-height: 1.5; }

        /* Footer */
        .footer {
          padding: 28px 32px;
          border-top: 1px solid rgba(255,255,255,0.04);
          text-align: center; color: #334155; font-size: 11px;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .nav { padding: 14px 20px; }
          .hero { padding: 48px 20px 40px; }
          .section { padding: 0 20px; }
          .pain-grid { grid-template-columns: 1fr; gap: 12px; }
          .pain-card { padding: 20px 18px; }
          .steps { grid-template-columns: 1fr; gap: 12px; }
          .step-card {
            display: flex; gap: 14px; align-items: flex-start;
            padding: 20px 18px;
          }
          .step-icon { font-size: 28px; margin-bottom: 0; flex-shrink: 0; margin-top: 2px; }
          .step-num { font-size: 32px; }
          .demo-grid { grid-template-columns: 1fr; }
          .demo-tabs { max-width: 100%; }
          .sol-divider { padding: 0 20px; }
          .cta-section { padding: 56px 20px; }
          .hero-cta { width: 100%; max-width: 340px; }
          .compare-table-wrap { padding: 16px 12px; }
          .compare-table td, .compare-table th { padding: 10px 6px; font-size: 12px; }
        }

        @media (max-width: 480px) {
          .hero-sub { font-size: 13px; padding: 0 8px; }
        }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
      `}</style>

      {/* Nav */}
      <nav className="nav">
        <div className="nav-logo">
          <div className="nav-logo-icon">B</div>
          <span className="nav-logo-text">비앤비서</span>
        </div>
        <button className="nav-cta">무료 등록</button>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-glow" />
        <div style={{ position: "relative", animation: "fadeUp 0.8s ease both" }}>
          <h1 className="hero-h1">
            부업인데 왜
            <br /><span className="hero-em">본업</span>처럼 하시나요
          </h1>
          <p className="hero-sub">에어비앤비 유지보수, 비앤비서가 대신합니다</p>
          <div className="hero-cta-wrap">
            <button className="hero-cta">무료로 숙소 등록하기</button>
            <div className="hero-cta-sub">등록비 무료 · 서울 전 지역</div>
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section id="pains" data-animate className={`section pains ${anim("pains")}`}>
        <div className="section-badge">Problem</div>
        <h2 className="section-title">호스트의 시간을 갉아먹는<br />'공간 운영'의 한계</h2>
        <div className="section-desc">수익은 줄고, 시간은 빠지고, 게스트 만족은 떨어지는 악순환</div>
        <div className="pain-grid">
          {PAIN_POINTS.map((p, i) => (
            <div key={i} className="pain-card" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="pain-icon">{p.icon}</div>
              <div className="pain-title">{p.title}</div>
              <div className="pain-desc">{p.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Solution Divider */}
      <div className="sol-divider">
        <div className="sol-divider-line" />
        <div className="section-badge" style={{ margin: 0 }}>Solution</div>
        <div className="sol-divider-line" />
      </div>

      {/* Solution Intro */}
      <section id="solution" data-animate className={`section solution ${anim("solution")}`}>
        <h2 className="section-title" style={{ textAlign: "center" }}>
          숙소를 <span style={{ color: "#60a5fa" }}>디지털 트윈</span>으로 만듭니다
        </h2>
        <div className="section-desc" style={{ textAlign: "center", maxWidth: 520, margin: "0 auto 40px" }}>
          전구 규격부터 보일러 모델까지 — 모든 시설물을 데이터화하면
          <br />수리 한마디에 부품·비용·일정이 자동으로 정리됩니다
        </div>

        {/* Steps */}
        <div className="steps">
          {[
            { num: "01", icon: "📋", title: "공간 스캔", desc: "전문가가 방문하여 모든 시설물의 브랜드·모델·규격을 기록합니다. 등록비 무료." },
            { num: "02", icon: "🤖", title: "AI 챗봇 접수", desc: "\"전구 나갔어요\" 한마디면 정확한 부품과 비용을 안내하고 방문 예약까지." },
            { num: "03", icon: "🔧", title: "방문 수리", desc: "필요한 부품을 가지고 방문합니다. 구독 회원은 출장비 무료, 업계 최저가." },
          ].map((s, i) => (
            <div key={i} className="step-card">
              <div className="step-num">{s.num}</div>
              <div className="step-icon">{s.icon}</div>
              <div>
                <div className="step-title">{s.title}</div>
                <div className="step-desc">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Chat Demos - Desktop: side by side, Mobile: tabbed */}
        <div className="demo-section">
          {/* Mobile tabs - only visible on mobile via CSS */}
          <div className="demo-tabs" style={{ display: "none" }}>
            <style>{`@media (max-width: 768px) { .demo-tabs { display: flex !important; } .demo-grid { display: block !important; } .demo-hide { display: none !important; } }`}</style>
            {[
              { key: "host", label: "🔧 호스트 수리 접수" },
              { key: "guest", label: "💬 게스트 QR 가이드" },
            ].map(tab => (
              <button
                key={tab.key}
                className="demo-tab"
                onClick={() => setActiveDemo(tab.key)}
                style={{
                  background: activeDemo === tab.key ? "rgba(37,99,235,0.15)" : "rgba(255,255,255,0.02)",
                  color: activeDemo === tab.key ? "#60a5fa" : "#64748b",
                  borderBottom: activeDemo === tab.key ? "2px solid #2563EB" : "2px solid transparent",
                }}
              >{tab.label}</button>
            ))}
          </div>

          <div className="demo-grid">
            <div className={activeDemo !== "host" ? "demo-hide" : ""}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <div style={{ width: 6, height: 6, borderRadius: 3, background: "#2563EB" }} />
                <span style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>호스트 수리 접수</span>
                <span style={{ color: "#475569", fontSize: 11 }}>— AI가 부품까지 파악</span>
              </div>
              <ChatDemo />
            </div>
            <div className={activeDemo !== "guest" ? "demo-hide" : ""}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <div style={{ width: 6, height: 6, borderRadius: 3, background: "#059669" }} />
                <span style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>게스트 QR 가이드</span>
                <span style={{ color: "#475569", fontSize: 11 }}>— 반복 문의 자동 응답</span>
              </div>
              <GuestDemo />
            </div>
          </div>
        </div>
      </section>

      {/* Price Compare */}
      <section id="compare" data-animate className={`section compare-section ${anim("compare")}`}>
        <div className="section-badge">Price</div>
        <h2 className="section-title">출장비 무료, 업계 최저가</h2>
        <div className="section-desc">구독 회원은 출장비 없이 부품+공임만 — 급할 때 바가지 쓸 일 없습니다</div>
        <CompareTable />
      </section>

      {/* CTA */}
      <section className="cta-section">
        <h2 className="cta-title">
          수리 걱정 없는<br />호스팅을 시작하세요
        </h2>
        <div className="cta-desc">
          등록비 무료 · 가입 후 3일 내 방문 데이터 수집
          <br />서울 전 지역 서비스 중
        </div>
        <button className="hero-cta">무료로 숙소 등록하기</button>
      </section>

      {/* Footer */}
      <footer className="footer">
        © 2026 비앤비서 · 에어비앤비 호스트를 위한 올인원 유지보수 서비스
      </footer>
    </div>
  );
}
