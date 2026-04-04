import Link from 'next/link'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* Left brand panel — hidden on mobile */}
      <div
        className="relative hidden lg:flex lg:w-[480px] xl:w-[520px] flex-col justify-between p-14 shrink-0 animate-slide-in-left rounded-r-2xl"
        style={{ background: 'radial-gradient(ellipse at 80% 85%, #2d1208 0%, #1e1210 35%, #1a1a1a 60%)' }}
      >
        {/* Noise texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.1] mix-blend-overlay pointer-events-none rounded-r-2xl"
          style={{ backgroundImage: 'url(/noise.png)', backgroundRepeat: 'repeat', backgroundSize: '256px' }}
        />

        {/* Logo */}
        <Link href="/" className="relative block">
          <span
            className="text-2xl font-bold tracking-tight text-white"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            비엔비서
          </span>
        </Link>

        {/* Value proposition */}
        <div className="relative">
          <p
            className="text-4xl xl:text-[42px] font-medium leading-tight tracking-tight text-white mb-6"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            숙소 관리,
            <br />
            이제 맡기세요.
          </p>
          <p
            className="text-base leading-relaxed"
            style={{ color: '#8a8a82', fontFamily: 'var(--font-body)' }}
          >
            AI가 게스트 문의를 대신 답하고,
            <br />
            시설 수리까지 한 번에 해결합니다.
          </p>

          {/* Proof points */}
          <div className="mt-12 flex flex-col gap-4">
            {[
              { icon: '✓', text: '공간 스캔 무료 등록' },
              { icon: '✓', text: '게스트 QR 챗봇 제공' },
              { icon: '✓', text: '출장비 무료 · 업계 최저가' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ backgroundColor: '#D4421E', color: '#fff' }}
                >
                  {item.icon}
                </span>
                <span
                  className="text-sm"
                  style={{ color: '#d5d2cc', fontFamily: 'var(--font-body)' }}
                >
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer tagline */}
        <p
          className="relative text-xs"
          style={{ color: '#6b6b63', fontFamily: 'var(--font-body)' }}
        >
          에어비앤비 호스트를 위한 AI 공간 관리 대행 서비스
        </p>
      </div>

      {/* Right form panel */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-6 py-14"
        style={{ backgroundColor: '#F6F4F0' }}
      >
        {/* Mobile-only logo */}
        <Link href="/" className="mb-10 block lg:hidden">
          <span
            className="text-2xl font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-display)', color: '#1a1a1a' }}
          >
            비엔비서
          </span>
        </Link>

        <div className="w-full max-w-[400px]">{children}</div>
      </div>
    </div>
  )
}
