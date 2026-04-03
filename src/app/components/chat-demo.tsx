"use client";

import { useState, useEffect, useRef } from "react";

const msgs = [
  { f: "u" as const, t: "천장 전구 나갔어" },
  {
    f: "b" as const,
    t: "어느 방 전구가 나갔어요?",
    opts: ["거실", "침실", "화장실"],
  },
  { f: "u" as const, t: "거실" },
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
  const [typing, setTyping] = useState(false);
  const [started, setStarted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  // Start animation when scrolled into view
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

  // Step through messages once: message → pause → typing → pause → next message
  useEffect(() => {
    if (!started || step >= msgs.length) return;

    // Show typing indicator after a pause
    const typingDelay = setTimeout(() => {
      setTyping(true);
    }, step === 0 ? 600 : 800);

    // Then show the actual message
    const msgDelay = setTimeout(
      () => {
        setTyping(false);
        setStep((s) => s + 1);
      },
      step === 0 ? 1600 : 2400
    );

    return () => {
      clearTimeout(typingDelay);
      clearTimeout(msgDelay);
    };
  }, [step, started]);

  useEffect(() => {
    if (chatRef.current)
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [step, typing]);

  return (
    <div
      ref={containerRef}
      className="bg-white rounded-2xl overflow-hidden shadow-lg border border-[#d5d2cc]"
    >
      <div className="px-4 py-3 border-b border-[#d5d2cc] flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-500" />
        <span className="text-[#1a1a1a] text-xs font-medium font-[var(--font-body)]">
          비앤비서 AI
        </span>
      </div>
      <div
        ref={chatRef}
        className="p-4 h-96 overflow-y-auto flex flex-col gap-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {msgs.slice(0, step).map((m, i) => (
          <div
            key={i}
            className={`flex flex-col animate-fade-only ${
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
        {typing && step < msgs.length && (
          <div
            className={`flex flex-col animate-fade-only ${msgs[step].f === "u" ? "items-end" : "items-start"}`}
          >
            <div
              className={`rounded-xl px-4 py-2.5 flex gap-1 text-xs ${
                msgs[step].f === "u"
                  ? "bg-[#D4421E]/80 text-white/60"
                  : "bg-[#EDEAE4] text-[#8a8a82]"
              }`}
            >
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
