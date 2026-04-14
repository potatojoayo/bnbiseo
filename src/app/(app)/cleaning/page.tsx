'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircleIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-provider'
import { useProperties } from '@/lib/hooks/use-properties'
import { CompoundInput, CompoundField, FloatingTextarea } from '@/components/ui/floating-input'
import { LoadingButton } from '@/components/ui/loading-button'

function getTomorrow(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10)
}

export default function CleaningPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const { data: properties = [], isLoading: propertiesLoading } = useProperties()

  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('')
  const [date, setDate] = useState(getTomorrow())
  const [time, setTime] = useState('11:00')
  const [memo, setMemo] = useState('')
  const [dateFocused, setDateFocused] = useState(false)
  const [timeFocused, setTimeFocused] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const isUrgent = date === getToday()

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
  }, [user, loading, router])

  // Auto-select if single property
  useEffect(() => {
    if (!propertiesLoading && properties.length === 1 && !selectedPropertyId) {
      setSelectedPropertyId(properties[0].id)
    }
  }, [properties, propertiesLoading, selectedPropertyId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100dvh-80px)]">
        <div className="w-6 h-6 rounded-full border-2 border-[#EBEBEB] border-t-[#717171] animate-spin" />
      </div>
    )
  }

  if (!user) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedPropertyId) return
    setSubmitting(true)
    await new Promise((res) => setTimeout(res, 1500))
    setSubmitting(false)
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="animate-fade-up-fast flex flex-col items-center justify-center min-h-[calc(100dvh-80px)] px-6 text-center">
        <CheckCircleIcon size={56} className="text-brand mb-5" strokeWidth={1.5} />
        <h2 className="text-[20px] font-semibold text-[#222222] mb-2">
          청소 요청이 완료되었어요
        </h2>
        <p className="text-[14px] text-[#717171] leading-relaxed">
          매니저 배정 후 알림을 보내드릴게요
        </p>
        <Link
          href="/home"
          className="mt-8 px-6 h-12 rounded-lg bg-[#222222] text-white text-[15px] font-semibold inline-flex items-center justify-center active:scale-[0.98] transition-all"
        >
          홈으로
        </Link>
      </div>
    )
  }

  return (
    <div className="animate-fade-up-fast min-h-[calc(100dvh-80px)] flex flex-col px-6 pt-6 pb-10">
      {/* Header */}
      <h1 className="text-[22px] font-semibold text-[#222222] mb-6">
        청소 요청
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Property Selection — hidden when single property */}
        {properties.length >= 1 && (
          <div>
            <p className="text-[13px] font-medium text-[#717171] mb-2 px-1">
              숙소 선택
            </p>
            <div className="flex flex-col gap-2">
              {properties.map((p) => {
                const selected = selectedPropertyId === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPropertyId(p.id)}
                    className={cn(
                      'w-full text-left flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all active:scale-[0.99]',
                      selected ? 'border-[#222222]' : 'border-[#EBEBEB] hover:border-[#B0B0B0]'
                    )}
                  >
                    <div className={cn(
                      'w-[18px] h-[18px] rounded-full border-[1.5px] shrink-0 flex items-center justify-center transition-all',
                      selected ? 'border-[#222222]' : 'border-[#CCCCCC]'
                    )}>
                      {selected && <div className="w-[10px] h-[10px] rounded-full bg-[#222222]" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-semibold text-[#222222] leading-snug">
                        {p.name}
                      </p>
                      <p className="text-[13px] text-[#717171] mt-0.5 leading-snug">
                        {p.address}
                        {p.addressDetail ? ` ${p.addressDetail}` : ''}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
            <Link
              href="/my/properties/new"
              className="text-[13px] text-[#717171] underline underline-offset-2 hover:text-[#222222] transition-colors mt-1 px-1"
            >
              + 숙소 추가
            </Link>
          </div>
        )}

        {/* Date & Time */}
        <div>
          <CompoundInput>
            <CompoundField
              label="희망 날짜"
              focused={dateFocused}
              borderRadius="12px 12px 0 0"
            >
              <input
                type="date"
                value={date}
                min={getToday()}
                onChange={(e) => setDate(e.target.value)}
                onFocus={() => setDateFocused(true)}
                onBlur={() => setDateFocused(false)}
                required
                className="w-full bg-transparent text-[16px] text-[#222222] outline-none"
                style={{ fontFamily: 'var(--font-body)', colorScheme: 'light' }}
              />
            </CompoundField>
            <CompoundField
              label="희망 시간"
              focused={timeFocused}
              borderRadius="0 0 12px 12px"
            >
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                onFocus={() => setTimeFocused(true)}
                onBlur={() => setTimeFocused(false)}
                required
                className="w-full bg-transparent text-[16px] text-[#222222] outline-none"
                style={{ fontFamily: 'var(--font-body)', colorScheme: 'light' }}
              />
            </CompoundField>
          </CompoundInput>

          {isUrgent && (
            <p className="text-[13px] text-brand mt-2 px-1">
              당일 청소는 긴급 청소로 진행되며 별도 할증이 적용됩니다.
            </p>
          )}
        </div>

        {/* Memo */}
        <CompoundInput>
          <FloatingTextarea
            label="메모 (선택)"
            placeholder="특이사항이 있으면 알려주세요"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            borderRadius="12px"
          />
        </CompoundInput>

        {/* Submit */}
        <LoadingButton
          type="submit"
          variant="primary"
          loading={submitting}
          loadingText="요청 중..."
          disabled={!selectedPropertyId && !propertiesLoading}
        >
          청소 요청하기
        </LoadingButton>
      </form>
    </div>
  )
}
