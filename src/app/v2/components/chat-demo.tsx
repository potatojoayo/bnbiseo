"use client";

import { useState, useEffect, useRef } from "react";

const msgs = [
  { f: "u" as const, t: "마포 3호점 거실 전구가 나갔어요" },
  {
    f: "b" as const,
    t: "거실 천장 LED 등기구\n삼성 SI-L60R1 확인했습니다.\n\n교체 비용: 12,000원 (부품+공임)\n방문 예약할까요?",
    opts: ["내일 오전", "내일 오후"],
  },
  { f: "u" as const, t: "내일 오전" },
  {
    f: "b" as const,
    t: "4/4(금) 오전 10~12시 예약 완료 ✓\nSI-L60R1 호환 전구를 가지고 방문합니다.",
  },
];

export default function ChatDemo() {
  const [step, setStep] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (step < msgs.length) {
      const t = setTimeout(
        () => setStep((s) => s + 1),
        step === 0 ? 1500 : 3000
      );
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStep(0), 6000);
    return () => clearTimeout(t);
  }, [step]);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [step]);

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-[#d5d2cc]">
      <div className="px-4 py-3 border-b border-[#d5d2cc] flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-500" />
        <span className="text-[#1a1a1a] text-xs font-medium font-[var(--font-body)]">
          비앤비서 AI
        </span>
      </div>
      <div
        ref={ref}
        className="p-4 h-72 overflow-y-auto flex flex-col gap-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {msgs.slice(0, step).map((m, i) => (
          <div
            key={i}
            className={`flex flex-col animate-fade-in-fast ${
              m.f === "u" ? "items-end" : "items-start"
            }`}
          >
            <div
              className={`px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line max-w-[85%] font-[var(--font-body)] ${
                m.f === "u"
                  ? "bg-[#D4421E] text-white rounded-t-xl rounded-bl-xl rounded-br-sm"
                  : "bg-[#EDEAE4] text-[#1a1a1a] rounded-t-xl rounded-br-xl rounded-bl-sm"
              }`}
            >
              {m.t}
            </div>
            {m.opts && (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {m.opts.map((o, j) => (
                  <span
                    key={j}
                    className="px-3 py-1 rounded-full border border-[#d5d2cc] text-[#8a8a82] text-xs font-[var(--font-body)]"
                  >
                    {o}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        {step > 0 && step < msgs.length && (
          <div className="flex flex-col items-start">
            <div className="bg-[#EDEAE4] rounded-xl px-4 py-2.5 flex gap-1 text-xs text-[#8a8a82]">
              <span className="animate-blink">·</span>
              <span className="animate-blink-2">·</span>
              <span className="animate-blink-3">·</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
