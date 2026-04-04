'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { CheckIcon, LogOutIcon } from 'lucide-react'
import { logout } from '@/actions/auth'
import { useOnboarding } from './onboarding-context'

const STEPS = [
  { num: 1 as const, title: '숙소 유형', desc: '에어비앤비 등록 여부를 선택합니다' },
  { num: 2 as const, title: '정보 입력', desc: '링크 또는 주소를 입력합니다' },
  { num: 3 as const, title: '등록 완료', desc: '최종 확인 후 등록을 완료하세요' },
]

export function OnboardingPanel() {
  const { panelStep: step, maxReachedPanel, goToPanel } = useOnboarding()

  return (
    <div
      className="relative hidden lg:flex lg:w-[420px] xl:w-[460px] flex-col justify-between p-14 shrink-0 animate-slide-in-left rounded-r-2xl"
      style={{
        background:
          'radial-gradient(ellipse at 80% 85%, #2d1208 0%, #1e1210 35%, #1a1a1a 60%)',
      }}
    >
      {/* Noise texture */}
      <div
        className="absolute inset-0 opacity-[0.1] mix-blend-overlay pointer-events-none rounded-r-2xl"
        style={{
          backgroundImage: 'url(/noise.png)',
          backgroundRepeat: 'repeat',
          backgroundSize: '256px',
        }}
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

      {/* Content */}
      <div className="relative">
        <p
          className="text-4xl xl:text-[42px] font-medium leading-tight tracking-tight text-white mb-6"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          첫 숙소를
          <br />
          등록해보세요.
        </p>
        <p
          className="text-base leading-relaxed mb-10"
          style={{ color: '#8a8a82', fontFamily: 'var(--font-body)' }}
        >
          몇 가지 정보만 입력하면 AI 공간 관리가 시작됩니다.
        </p>

        <div className="flex flex-col gap-1">
          {STEPS.map((s, i) => {
            const isActive = step === s.num
            const isDone = step > s.num
            const canClick = s.num <= maxReachedPanel && !isActive

            return (
              <div key={s.num}>
                <button
                  type="button"
                  onClick={() => canClick && goToPanel(s.num)}
                  disabled={!canClick}
                  className={cn(
                    'flex items-center gap-4 rounded-lg px-3 py-2.5 w-full text-left transition-all duration-300',
                    isActive && 'bg-white/[0.08] cursor-default',
                    canClick && 'hover:bg-white/[0.12]',
                    !canClick && !isActive && 'cursor-default opacity-40',
                  )}
                >
                  {/* Number / Check */}
                  <div
                    className={cn(
                      'size-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-500',
                      isActive
                        ? 'text-white shadow-lg'
                        : isDone
                          ? 'bg-white/20 text-white'
                          : 'bg-white/[0.06] text-white/30',
                    )}
                    style={isActive ? { backgroundColor: '#D4421E' } : {}}
                  >
                    {isDone ? (
                      <CheckIcon className="size-3.5" strokeWidth={2.5} />
                    ) : (
                      <span
                        className="leading-none"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        {s.num}
                      </span>
                    )}
                  </div>

                  {/* Text */}
                  <div className="min-w-0">
                    <p
                      className={cn(
                        'text-[15px] font-medium transition-all duration-500',
                        isActive ? 'text-white' : canClick ? 'text-white/70' : 'text-white/30',
                      )}
                    >
                      {s.title}
                    </p>
                    <p
                      className={cn(
                        'text-sm mt-px leading-relaxed transition-all duration-500',
                        isActive ? 'text-white/60' : canClick ? 'text-white/40' : 'text-white/20',
                      )}
                    >
                      {s.desc}
                    </p>
                  </div>
                </button>

                {/* Connector */}
                {i < STEPS.length - 1 && (
                  <div className="flex justify-start pl-[27px] py-0.5">
                    <div
                      className={cn(
                        'w-px h-3 transition-all duration-500',
                        isDone ? 'bg-white/30' : 'bg-white/[0.08]',
                      )}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="relative flex items-center justify-between">
        <p
          className="text-xs"
          style={{ color: '#6b6b63', fontFamily: 'var(--font-body)' }}
        >
          에어비앤비 호스트를 위한 AI 공간 관리 대행 서비스
        </p>
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            <LogOutIcon className="size-3" />
            로그아웃
          </button>
        </form>
      </div>
    </div>
  )
}
