"use client";

import { useState, useEffect, useRef } from "react";

const CHECKLIST = [
  { icon: "💡", label: "조명", status: "정상", ok: true },
  { icon: "🚿", label: "수전/배관", status: "정상", ok: true },
  { icon: "🔒", label: "도어락", status: "배터리 교체 필요", ok: false },
  { icon: "🔥", label: "보일러", status: "정상", ok: true },
  { icon: "❄️", label: "에어컨", status: "필터 청소 필요", ok: false },
  { icon: "🧺", label: "세탁기/건조기", status: "정상", ok: true },
  { icon: "🌀", label: "환기팬", status: "정상", ok: true },
  { icon: "🧴", label: "소모품 잔량", status: "세제 보충 필요", ok: false },
];

export default function ChecklistDemo() {
  const [visibleCount, setVisibleCount] = useState(0);
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
    if (!started || visibleCount >= CHECKLIST.length) {
      if (started && visibleCount >= CHECKLIST.length) {
        const resetTimer = setTimeout(() => {
          setVisibleCount(0);
          setTimeout(() => setVisibleCount(1), 600);
        }, 3000);
        return () => clearTimeout(resetTimer);
      }
      return;
    }

    const timer = setTimeout(() => {
      setVisibleCount((c) => c + 1);
    }, visibleCount === 0 ? 800 : 500);

    return () => clearTimeout(timer);
  }, [visibleCount, started]);

  const okCount = CHECKLIST.slice(0, visibleCount).filter((c) => c.ok).length;
  const warnCount = CHECKLIST.slice(0, visibleCount).filter((c) => !c.ok).length;

  return (
    <div
      ref={containerRef}
      className="bg-white rounded-2xl overflow-hidden shadow-lg border border-outline-dim"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-outline-dim flex items-center justify-between">
        <span className="text-on-surface text-xs font-medium font-text">
          시설 점검 리포트
        </span>
        <span className="text-on-surface-subtle text-[10px]">2026.04.12</span>
      </div>

      {/* Content */}
      <div className="p-4 h-[420px] flex flex-col">
        {/* Summary bar */}
        <div className="flex gap-3 mb-4">
          <div className="flex items-center gap-1.5 text-xs">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-on-surface-subtle">정상 {okCount}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-on-surface-subtle">주의 {warnCount}</span>
          </div>
        </div>

        {/* Checklist */}
        <div className="flex-1 flex flex-col gap-1.5 overflow-hidden">
          {CHECKLIST.slice(0, visibleCount).map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface-dim/60 animate-fade-only"
            >
              <span className="text-base shrink-0">{item.icon}</span>
              <span className="text-sm font-medium text-on-surface flex-1">{item.label}</span>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  item.ok
                    ? "bg-green-50 text-green-600"
                    : "bg-amber-50 text-amber-600"
                }`}
              >
                {item.ok ? "정상" : "주의"}
              </span>
            </div>
          ))}
        </div>

        {/* Detail preview for warning items */}
        {visibleCount >= CHECKLIST.length && (
          <div className="mt-3 p-3 rounded-xl bg-amber-50/50 border border-amber-200/50 animate-fade-only">
            <div className="text-[11px] font-semibold text-amber-700 mb-1.5">주의 항목 상세</div>
            {CHECKLIST.filter((c) => !c.ok).map((item, i) => (
              <div key={i} className="text-[11px] text-amber-600 leading-relaxed">
                {item.icon} {item.label}: {item.status}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
