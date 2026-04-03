"use client";

import { useState, useEffect, useRef } from "react";

const messages = [
  { from: "user" as const, text: "거실 전구가 나갔어요" },
  {
    from: "bot" as const,
    text: "거실 천장 LED 등기구\n(삼성 SI-L60R1) 확인했습니다.\n\n교체 비용: 12,000원\n(부품+공임, 구독 회원가)\n\n방문 예약할까요?",
    options: ["내일 오전", "내일 오후"],
  },
  { from: "user" as const, text: "내일 오전" },
  {
    from: "bot" as const,
    text: "4월 4일(금) 오전 10~12시\n방문 예약 완료했습니다. ✓\n\n기사가 삼성 SI-L60R1 호환 전구를\n가지고 방문합니다.",
  },
];

export default function ChatDemo() {
  const [step, setStep] = useState(0);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (step < messages.length) {
      const t = setTimeout(
        () => setStep((s) => s + 1),
        step === 0 ? 1500 : 3000
      );
      return () => clearTimeout(t);
    }
    const reset = setTimeout(() => setStep(0), 6000);
    return () => clearTimeout(reset);
  }, [step]);

  useEffect(() => {
    if (chatRef.current)
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [step]);

  return (
    <div className="max-w-full md:max-w-[440px] rounded-[18px] overflow-hidden bg-white/[0.03] border border-white/[0.08]">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/[0.06]">
        <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[13px] bg-gradient-to-br from-blue-600 to-purple-600">
          🔧
        </div>
        <div>
          <div className="text-white text-sm font-semibold">비앤비서 AI</div>
          <div className="text-green-500 text-[10px]">● 온라인</div>
        </div>
      </div>
      <div
        ref={chatRef}
        className="flex flex-col gap-2 p-3.5 h-[280px] md:h-[300px] overflow-y-auto"
      >
        {messages.slice(0, step).map((m, i) => (
          <div
            key={i}
            className={`flex flex-col animate-fade-up-fast ${
              m.from === "user" ? "items-end" : "items-start"
            }`}
          >
            <div
              className={`py-2.5 px-3.5 text-[13px] leading-relaxed whitespace-pre-line text-white max-w-[85%] ${
                m.from === "user"
                  ? "bg-blue-600 rounded-[14px_14px_4px_14px]"
                  : "bg-white/[0.08] rounded-[14px_14px_14px_4px]"
              }`}
            >
              {m.text}
            </div>
            {m.options && (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {m.options.map((o, j) => (
                  <div
                    key={j}
                    className="py-1.5 px-[13px] rounded-full border border-blue-600/40 text-blue-400 text-xs"
                  >
                    {o}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {step > 0 && step < messages.length && (
          <div className="flex flex-col items-start animate-fade-up-fast">
            <div className="flex gap-1 text-[10px] text-slate-500 py-2.5 px-4 bg-white/[0.08] rounded-[14px_14px_14px_4px]">
              <span className="animate-blink">●</span>
              <span className="animate-blink-2">●</span>
              <span className="animate-blink-3">●</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
