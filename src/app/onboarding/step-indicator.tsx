'use client'

import { usePathname } from 'next/navigation'
import { useOnboarding } from './onboarding-context'
import { CheckIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const STEPS = [
  { num: 1 as const, label: '숙소 유형' },
  { num: 2 as const, label: '정보 입력' },
  { num: 3 as const, label: '등록 완료' },
]

export function StepIndicator() {
  const pathname = usePathname()
  const isComplete = pathname === '/onboarding/complete'
  const { panelStep, maxReachedPanel, goToPanel } = useOnboarding()
  const currentStep = isComplete ? 3 : panelStep

  if (isComplete) return null

  return (
    <div className="flex items-center justify-center gap-0">
      {STEPS.map((step, i) => {
        const isDone = currentStep > step.num
        const isActive = currentStep === step.num

        const canClick = step.num <= maxReachedPanel && !isActive

        return (
          <div key={step.num} className="flex items-center">
            {/* Step node */}
            <button
              type="button"
              onClick={() => canClick && goToPanel(step.num)}
              disabled={!canClick}
              className={cn(
                'flex flex-col items-center gap-1.5 transition-opacity',
                canClick && 'cursor-pointer hover:opacity-70',
                !canClick && 'cursor-default',
              )}
            >
              <div
                className={cn(
                  'size-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300',
                  isActive && 'bg-[#222] text-white',
                  isDone && 'bg-[#222]/15 text-[#222]',
                  !isActive && !isDone && 'bg-[#F0F0F0] text-[#B0B0B0]',
                )}
              >
                {isDone ? (
                  <CheckIcon className="size-3.5" strokeWidth={2.5} />
                ) : (
                  <span>{step.num}</span>
                )}
              </div>
              <span
                className={cn(
                  'text-[11px] font-medium whitespace-nowrap transition-colors duration-300',
                  isActive && 'text-[#222]',
                  isDone && 'text-[#717171]',
                  !isActive && !isDone && 'text-[#B0B0B0]',
                )}
              >
                {step.label}
              </span>
            </button>

            {/* Connector line between steps */}
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  'h-px w-16 sm:w-24 mx-2 mb-5 transition-colors duration-300',
                  isDone ? 'bg-[#222]/20' : 'bg-[#EBEBEB]',
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
