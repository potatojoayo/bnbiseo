'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CheckIcon } from 'lucide-react'
import { useOnboarding } from './onboarding-context'

const STEP_LABELS: Record<number, string> = {
  1: '숙소 유형',
  2: '정보 입력',
  3: '등록 완료',
}

export function MobileStepHeader() {
  const pathname = usePathname()
  const isComplete = pathname === '/onboarding/complete'
  const { panelStep: ctxStep } = useOnboarding()
  const panelStep = isComplete ? 3 : ctxStep
  const total = 3

  if (isComplete) return null

  return (
    <header className="flex items-center justify-between px-6 py-4 lg:hidden border-b border-outline bg-white shrink-0">
      <Link href="/">
        <span
          className="text-xl font-bold tracking-tight"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--brand)' }}
        >
          비엔비서
        </span>
      </Link>

      {isComplete ? (
        /* 완료 상태: 초록 뱃지 */
        <div
          className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#16a34a' }}
        >
          <CheckIcon className="size-3" strokeWidth={2.5} />
          등록 완료
        </div>
      ) : (
        /* 진행 중: 스텝 인디케이터 */
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: total }, (_, i) => {
              const num = i + 1
              const isDone = panelStep > num
              const isActive = panelStep === num
              return (
                <div
                  key={num}
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{
                    width: isActive ? 24 : 8,
                    backgroundColor: isActive
                      ? 'var(--brand)'
                      : isDone
                        ? 'var(--brand)'
                        : 'var(--outline)',
                    opacity: isDone && !isActive ? 0.4 : 1,
                  }}
                />
              )
            })}
          </div>
          <span
            className="text-xs font-medium tabular-nums"
            style={{ color: 'var(--on-surface-subtle)', fontFamily: 'var(--font-body)' }}
          >
            {panelStep}/{total} {STEP_LABELS[panelStep]}
          </span>
        </div>
      )}
    </header>
  )
}
