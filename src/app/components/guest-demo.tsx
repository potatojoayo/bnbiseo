"use client";

export default function GuestDemo() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-outline-dim">
      <div className="px-4 py-3 border-b border-outline-dim flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-emerald-600" />
        <span className="text-on-surface text-xs font-medium font-text">
          숙소 가이드
        </span>
      </div>
      <div className="p-4 flex flex-col gap-2 h-96">
        <div className="flex flex-col items-end">
          <div className="px-3.5 py-2.5 text-sm leading-relaxed text-white max-w-[85%] bg-emerald-600 rounded-t-xl rounded-bl-xl rounded-br-sm font-text">
            뜨거운 물이 안 나와요
          </div>
        </div>
        <div className="flex flex-col items-start">
          <div className="px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line text-on-surface max-w-[85%] bg-surface-dim rounded-t-xl rounded-br-xl rounded-bl-sm font-text">
            {"부엌 창가쪽 벽면 보일러\n(경동나비엔 NCB354)를 켜주세요.\n\n1. 전원 버튼 누르기\n2. '욕실' 버튼 선택\n3. 온도 50°C 설정\n\n약 3분 후 온수가 나옵니다."}
          </div>
        </div>
      </div>
    </div>
  );
}
