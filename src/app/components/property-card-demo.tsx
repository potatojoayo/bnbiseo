"use client";

import { useState, useEffect, useRef } from "react";

const INFO_ITEMS = [
  { label: "주소", value: "마포구 동교로 9길 29" },
  { label: "도어락", value: "1234*" },
  { label: "침구", value: "퀸 1, 싱글 1" },
  { label: "쓰레기장", value: "건물 뒤편 분리수거장" },
  { label: "배출 요일", value: "월·수·금" },
  { label: "보일러", value: "경동나비엔 NCB354" },
  { label: "에어컨", value: "LG 휘센 2구" },
  { label: "세탁기", value: "삼성 WW90T 드럼" },
];

export default function PropertyCardDemo() {
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
    if (!started || visibleCount >= INFO_ITEMS.length) {
      if (started && visibleCount >= INFO_ITEMS.length) {
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
    }, visibleCount === 0 ? 800 : 400);

    return () => clearTimeout(timer);
  }, [visibleCount, started]);

  return (
    <div
      ref={containerRef}
      className="bg-white rounded-2xl overflow-hidden shadow-lg border border-outline-dim"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-outline-dim flex items-center justify-between">
        <span className="text-on-surface text-xs font-medium font-text">
          숙소 정보
        </span>
        <span className="inline-block text-[10px] font-semibold text-green-600 bg-green-50 rounded-full px-2 py-0.5">
          등록 완료
        </span>
      </div>

      {/* Content */}
      <div className="p-4 h-[420px] flex flex-col">
        {/* Property name */}
        <div className="mb-4">
          <div className="text-base font-bold text-on-surface">홍대 스튜디오 A</div>
          <div className="text-on-surface-subtle text-xs mt-0.5">에어비앤비 · 원룸 · 게스트 2명</div>
        </div>

        {/* Info list */}
        <div className="flex-1 flex flex-col gap-1.5 overflow-hidden">
          {INFO_ITEMS.slice(0, visibleCount).map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-surface-dim/60 animate-fade-only"
            >
              <span className="text-on-surface-subtle text-xs">{item.label}</span>
              <span className="text-on-surface text-xs font-medium">{item.value}</span>
            </div>
          ))}
        </div>

        {/* Bottom note */}
        {visibleCount >= INFO_ITEMS.length && (
          <div className="mt-3 text-center animate-fade-only">
            <div className="text-on-surface-subtle text-[11px]">
              한 번 등록하면 매번 설명할 필요 없어요
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
