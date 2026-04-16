"use client";

import { useState, useEffect, useRef } from "react";

const FLOW_STEPS = [
  {
    title: "청소 요청하기",
    content: "request",
  },
  {
    title: "숙소 선택",
    content: "property",
  },
  {
    title: "날짜 선택",
    content: "date",
  },
  {
    title: "결제",
    content: "payment",
  },
  {
    title: "예약 완료",
    content: "complete",
  },
];

export default function CleaningRequestDemo() {
  const [step, setStep] = useState(-1);
  const [started, setStarted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;

    if (step >= FLOW_STEPS.length - 1) {
      const resetTimer = setTimeout(() => {
        setStep(-1);
        setTimeout(() => setStep(0), 800);
      }, 3000);
      return () => clearTimeout(resetTimer);
    }

    const delay = step === -1 ? 800 : 1800;
    const timer = setTimeout(() => {
      setStep((s) => s + 1);
    }, delay);

    return () => clearTimeout(timer);
  }, [step, started]);

  return (
    <div
      ref={containerRef}
      className="bg-white rounded-2xl overflow-hidden shadow-lg border border-outline-dim"
    >
      {/* Phone header */}
      <div className="px-4 py-3 border-b border-outline-dim flex items-center justify-between">
        <span className="text-on-surface text-xs font-medium font-text">
          비앤비서
        </span>
        <div className="flex gap-1">
          {FLOW_STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-500 ${
                i <= step ? "w-5 bg-brand" : "w-2 bg-outline-dim"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Screen content */}
      <div className="p-5 h-[420px] flex flex-col">
        {/* Step 0: Request button */}
        {step === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 animate-fade-only">
            <div className="w-16 h-16 rounded-full bg-brand/10 flex items-center justify-center">
              <span className="text-3xl">🧹</span>
            </div>
            <div className="text-center">
              <div className="font-bold text-on-surface mb-1">청소가 필요하신가요?</div>
              <div className="text-on-surface-subtle text-sm">터치 한 번이면 전문 매니저가 출동합니다</div>
            </div>
            <div className="bg-brand text-white px-6 py-3 rounded-full text-sm font-semibold font-text">
              청소 요청하기 →
            </div>
          </div>
        )}

        {/* Step 1: Property select */}
        {step === 1 && (
          <div className="flex-1 flex flex-col animate-fade-only">
            <div className="text-sm font-bold text-on-surface mb-1">숙소를 선택하세요</div>
            <div className="text-on-surface-subtle text-xs mb-4">등록된 숙소 목록</div>
            <div className="flex flex-col gap-2">
              {[
                { name: "홍대 스튜디오 A", addr: "마포구 동교로 9길 29" },
                { name: "연남 레지던스", addr: "마포구 연남로 35" },
                { name: "홍대 스튜디오 B", addr: "마포구 와우산로 21길 8" },
              ].map((p, i) => (
                <div
                  key={i}
                  className={`p-3.5 rounded-xl border transition-all duration-300 ${
                    i === 0
                      ? "border-brand bg-brand/5 scale-[1.02]"
                      : "border-outline-dim"
                  }`}
                >
                  <div className="text-sm font-semibold text-on-surface">{p.name}</div>
                  <div className="text-xs text-on-surface-subtle mt-0.5">{p.addr}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Date select */}
        {step === 2 && (
          <div className="flex-1 flex flex-col animate-fade-only">
            <div className="text-sm font-bold text-on-surface mb-1">날짜를 선택하세요</div>
            <div className="text-on-surface-subtle text-xs mb-4">홍대 스튜디오 A</div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs mb-3">
              {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
                <div key={d} className="text-on-surface-subtle py-1">{d}</div>
              ))}
              {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
                <div
                  key={d}
                  className={`py-1.5 rounded-lg transition-all ${
                    d === 12
                      ? "bg-brand text-white font-bold"
                      : d < 10
                        ? "text-on-surface-subtle/40"
                        : "text-on-surface hover:bg-surface-dim"
                  }`}
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-auto">
              {["오전 (11~13시)", "오후 (13~15시)"].map((t, i) => (
                <div
                  key={i}
                  className={`flex-1 py-2.5 rounded-xl border text-center text-xs font-medium transition-all ${
                    i === 0
                      ? "border-brand bg-brand/5 text-brand"
                      : "border-outline-dim text-on-surface-subtle"
                  }`}
                >
                  {t}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 3 && (
          <div className="flex-1 flex flex-col animate-fade-only">
            <div className="text-sm font-bold text-on-surface mb-4">결제 확인</div>
            <div className="bg-surface-dim rounded-xl p-4 mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-on-surface-subtle">숙소</span>
                <span className="font-medium text-on-surface">홍대 스튜디오 A</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-on-surface-subtle">일시</span>
                <span className="font-medium text-on-surface">4/12(토) 오전</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-on-surface-subtle">서비스</span>
                <span className="font-medium text-on-surface">표준 청소</span>
              </div>
              <hr className="border-outline-dim my-2" />
              <div className="flex justify-between text-sm">
                <span className="font-bold text-on-surface">결제 금액</span>
                <span className="font-bold text-brand">35,000원</span>
              </div>
            </div>
            <div className="bg-brand text-white py-3.5 rounded-full text-center text-sm font-semibold font-text mt-auto">
              결제하기
            </div>
          </div>
        )}

        {/* Step 4: Complete */}
        {step === 4 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 animate-fade-only">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
              <span className="text-3xl">✅</span>
            </div>
            <div className="text-center">
              <div className="font-bold text-on-surface text-lg mb-1">예약 완료!</div>
              <div className="text-on-surface-subtle text-sm">4/12(토) 오전 · 홍대 스튜디오 A</div>
            </div>
            <div className="flex w-full items-center gap-3 rounded-xl bg-kakao-yellow p-3.5">
              <span className="text-2xl">💬</span>
              <div>
                <div className="text-xs font-bold text-kakao-brown">카카오톡 알림</div>
                <div className="text-xs text-kakao-brown/70">매니저 배정 완료! 상세 안내를 보내드렸어요.</div>
              </div>
            </div>
          </div>
        )}

        {/* Not started yet */}
        {step === -1 && (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-outline-dim border-t-brand animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
