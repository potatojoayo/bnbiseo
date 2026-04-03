"use client";

export default function GuestDemo() {
  return (
    <div className="max-w-full md:max-w-[440px] rounded-[18px] overflow-hidden bg-white/[0.03] border border-white/[0.08]">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/[0.06]">
        <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[13px] bg-gradient-to-br from-emerald-600 to-blue-600">
          💬
        </div>
        <div>
          <div className="text-white text-sm font-semibold">숙소 가이드</div>
          <div className="text-slate-500 text-[10px]">QR 코드로 접속</div>
        </div>
      </div>
      <div className="flex flex-col gap-2 p-3.5 min-h-[200px]">
        <div className="flex flex-col items-end animate-[fadeUp_0.3s_ease_both]">
          <div className="py-2.5 px-3.5 text-[13px] leading-relaxed whitespace-pre-line text-white max-w-[85%] bg-emerald-600 rounded-[14px_14px_4px_14px]">
            뜨거운 물이 안 나와요
          </div>
        </div>
        <div className="flex flex-col items-start animate-[fadeUp_0.3s_ease_both]">
          <div className="py-2.5 px-3.5 text-[13px] leading-relaxed whitespace-pre-line text-white max-w-[85%] bg-white/[0.08] rounded-[14px_14px_14px_4px]">
            부엌 창가쪽 벽면 보일러
            {"\n"}(경동나비엔 NCB354)를 켜주세요.
            {"\n"}
            {"\n"}1. 전원 버튼 누르기
            {"\n"}2. &apos;욕실&apos; 버튼 선택
            {"\n"}3. 온도 50°C 설정
            {"\n"}
            {"\n"}약 3분 후 온수가 나옵니다 ☺
          </div>
        </div>
      </div>
    </div>
  );
}
