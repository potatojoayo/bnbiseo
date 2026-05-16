'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckIcon, ChevronLeftIcon } from 'lucide-react'
import { toast } from 'sonner'
import { CalendarPicker } from '@/components/calendar-picker'
import { PropertyCard } from '@/components/property-card'
import { cn, getTomorrow, formatDateLabel, formatTimeKorean, ALL_TIME_SLOTS } from '@/lib/utils'
import { AC_FIRST_CLEANING_DISCOUNT, AC_PRICE_PER_UNIT, calculateAcCleaningPrice } from '@/lib/cleaning-pricing'
import { useProperties, usePropertyDetail } from '@/lib/hooks/use-properties'
import { useCleaningRequests } from '@/lib/hooks/use-cleaning'
import { useAuth } from '@/lib/auth-provider'
import { CompoundInput, CompoundField, FloatingTextarea } from '@/components/ui/floating-input'
import { LoadingButton } from '@/components/ui/loading-button'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'

export default function NewAcCleaningPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const { data: properties = [], isLoading: propertiesLoading } = useProperties()
  const { data: cleaningHistory = [], isLoading: cleaningLoading } = useCleaningRequests()

  const isFirstAcCleaning = cleaningHistory.every((req) => req.serviceType !== 'ac')

  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(searchParams.get('propertyId') ?? '')
  const [date, setDate] = useState(searchParams.get('date') ?? getTomorrow())
  const [time, setTime] = useState(searchParams.get('time') ?? '11:00')
  const [memo, setMemo] = useState(searchParams.get('memo') ?? '')
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>(
    searchParams.get('assetIds')?.split(',').filter(Boolean) ?? [],
  )

  const [dateDrawerOpen, setDateDrawerOpen] = useState(false)
  const [timeDrawerOpen, setTimeDrawerOpen] = useState(false)

  const activeProperties = properties.filter((property) => property.status === 'active')
  const pendingProperties = properties.filter((property) => property.status === 'pending_activation')
  const selectedProperty = activeProperties.find((p) => p.id === selectedPropertyId)

  const { data: propertyDetail, isLoading: detailLoading } = usePropertyDetail(selectedPropertyId)
  const acAssets = useMemo(
    () => (propertyDetail?.assets ?? []).filter((asset) => asset.category === 'ac'),
    [propertyDetail?.assets],
  )

  // Tomorrow is the minimum date for AC cleaning
  const minDateIso = getTomorrow()

  useEffect(() => {
    if (!propertiesLoading && activeProperties.length === 1 && !selectedPropertyId) {
      setSelectedPropertyId(activeProperties[0].id)
      return
    }
    if (!propertiesLoading && selectedPropertyId && !activeProperties.some((property) => property.id === selectedPropertyId)) {
      setSelectedPropertyId(activeProperties[0]?.id ?? '')
    }
  }, [activeProperties, propertiesLoading, selectedPropertyId])

  // When property changes, clear selected assets that don't belong
  useEffect(() => {
    if (!propertyDetail) return
    const validIds = new Set(acAssets.map((asset) => asset.id))
    setSelectedAssetIds((prev) => prev.filter((id) => validIds.has(id)))
  }, [propertyDetail, acAssets])

  const priceInfo = selectedAssetIds.length > 0
    ? calculateAcCleaningPrice({ acCount: selectedAssetIds.length })
    : null
  const discount = isFirstAcCleaning ? AC_FIRST_CLEANING_DISCOUNT : 0
  const estimatedPrice = priceInfo ? Math.max(priceInfo.total - discount, 0) : 0

  function toggleAsset(id: string) {
    setSelectedAssetIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  function handleDateSelect(newDate: string) {
    if (newDate < minDateIso) {
      toast.info('에어컨 청소는 내일부터 예약 가능합니다.')
      return
    }
    setDate(newDate)
    setTimeout(() => setDateDrawerOpen(false), 300)
  }

  function handleTimeSelect(newTime: string) {
    setTime(newTime)
    setTimeout(() => setTimeDrawerOpen(false), 300)
  }

  function handleNext(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedPropertyId) return
    if (selectedAssetIds.length === 0) return
    if (date < minDateIso) return

    const params = new URLSearchParams({
      propertyId: selectedPropertyId,
      date,
      time,
      assetIds: selectedAssetIds.join(','),
    })
    if (memo) params.set('memo', memo)
    router.push(`/cleaning/new/ac/review?${params.toString()}`)
  }

  const isPageLoading =
    authLoading || (!!user && (propertiesLoading || cleaningLoading))

  if (isPageLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100dvh-80px)]">
        <div className="w-6 h-6 rounded-full border-2 border-outline-dim border-t-ink-muted animate-spin" />
      </div>
    )
  }

  if (properties.length === 0) {
    return (
      <div className="animate-fade-up-fast flex flex-col min-h-[calc(100dvh-80px)] px-6 pt-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-3 -ml-4 inline-flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface-soft"
        >
          <ChevronLeftIcon size={32} />
        </button>
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <h2 className="text-[18px] font-semibold text-ink mb-2">등록된 숙소가 없어요</h2>
          <p className="text-[14px] text-ink-muted leading-relaxed">
            청소를 요청하려면 먼저 숙소를 등록해주세요
          </p>
          <Link
            href="/properties/new"
            className="mt-6 px-5 h-10 rounded-lg bg-brand text-white text-[14px] font-semibold inline-flex items-center justify-center active:scale-[0.98] transition-all"
          >
            숙소 등록하기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-up-fast min-h-[calc(100dvh-80px)] flex flex-col p-6 pb-10">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-3 -ml-4 inline-flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface-soft"
      >
        <ChevronLeftIcon size={32} />
      </button>
      <h1 className="text-[22px] font-semibold text-ink mb-6">에어컨 청소 요청</h1>

      <form onSubmit={handleNext} className="flex flex-col gap-5">
        {/* Property */}
        {activeProperties.length >= 1 && (
          <div>
            <div className="flex flex-col gap-3">
              {[...activeProperties, ...pendingProperties].map((p) => {
                const selected = p.status === 'active' && selectedPropertyId === p.id
                const disabled = p.status === 'pending_activation'
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      if (disabled) {
                        toast.info('등록 완료 후 청소를 요청할 수 있어요.')
                        return
                      }
                      setSelectedPropertyId(p.id)
                    }}
                    className={cn(
                      'w-full text-left transition-all active:scale-[0.99]',
                      disabled && 'opacity-70',
                    )}
                    aria-disabled={disabled}
                  >
                    <PropertyCard property={p} selected={selected} />
                  </button>
                )
              })}
            </div>
            <div className="flex justify-end mt-2">
              <Link
                href="/properties/new"
                className="text-[13px] text-ink-muted underline underline-offset-2 hover:text-ink transition-colors"
              >
                + 숙소 추가
              </Link>
            </div>
          </div>
        )}

        {/* AC list */}
        {selectedProperty && (
          <section>
            <p className="text-[14px] font-medium text-ink mb-2">청소할 에어컨 선택</p>
            {detailLoading ? (
              <div className="flex items-center justify-center py-6">
                <div className="w-5 h-5 rounded-full border-2 border-outline-dim border-t-ink-muted animate-spin" />
              </div>
            ) : acAssets.length === 0 ? (
              <div className="rounded-xl border border-dashed border-outline-strong px-4 py-6 text-center text-[14px] text-ink-muted leading-relaxed">
                이 숙소에는 등록된 에어컨이 없어요.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {acAssets.map((asset) => {
                  const checked = selectedAssetIds.includes(asset.id)
                  return (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => toggleAsset(asset.id)}
                      className={cn(
                        'flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors',
                        checked ? 'border-ink bg-surface-soft' : 'border-ink-faint hover:bg-surface-soft',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-[22px] w-[22px] items-center justify-center rounded-md border-[1.5px] shrink-0 transition-colors',
                          checked ? 'bg-ink border-ink' : 'border-outline',
                        )}
                      >
                        {checked && <CheckIcon size={14} strokeWidth={3} className="text-white" />}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-ink">{asset.name}</p>
                        <p className="mt-0.5 text-[12px] text-ink-muted">
                          {asset.location}
                          {asset.brand || asset.modelNumber
                            ? ` · ${[asset.brand, asset.modelNumber].filter(Boolean).join(' ')}`
                            : ''}
                        </p>
                      </div>
                      <span className="text-[13px] font-semibold text-ink">
                        +{AC_PRICE_PER_UNIT.toLocaleString()}원
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {/* Date & Time */}
        {acAssets.length > 0 && (
          <div>
            <CompoundInput>
              <button
                type="button"
                className="w-full text-left"
                onClick={() => setDateDrawerOpen(true)}
              >
                <CompoundField label="희망 날짜" borderRadius="12px 12px 0 0">
                  <span className="block w-full text-[16px] text-ink" style={{ fontFamily: 'var(--font-body)' }}>
                    {formatDateLabel(date)}
                  </span>
                </CompoundField>
              </button>
              <button
                type="button"
                className="w-full text-left"
                onClick={() => setTimeDrawerOpen(true)}
              >
                <CompoundField label="희망 시간" borderRadius="0 0 12px 12px">
                  <span className="block w-full text-[16px] text-ink" style={{ fontFamily: 'var(--font-body)' }}>
                    {formatTimeKorean(time)}
                  </span>
                </CompoundField>
              </button>
            </CompoundInput>
            <p className="text-[12px] text-ink-muted mt-2 px-1">
              에어컨 청소는 다음 날부터 예약 가능합니다.
            </p>
          </div>
        )}

        {/* Memo */}
        {acAssets.length > 0 && (
          <CompoundInput>
            <FloatingTextarea
              label="메모 (선택)"
              placeholder="특이사항이 있으면 알려주세요"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              borderRadius="12px"
            />
          </CompoundInput>
        )}

        {/* Price estimate */}
        {priceInfo && (
          <div className="rounded-xl border border-ink-faint px-4 py-4">
            <div className="flex items-center justify-between">
              <span className="text-[14px] text-ink-muted">에어컨 청소 금액</span>
              <div className="text-right">
                {isFirstAcCleaning && (
                  <span className="text-[14px] text-ink-faint line-through mr-2">
                    {priceInfo.total.toLocaleString()}원
                  </span>
                )}
                <span className="text-[20px] font-semibold text-ink">
                  {estimatedPrice.toLocaleString()}원
                </span>
              </div>
            </div>
            <p className="text-[12px] text-ink-muted mt-1.5 text-right">
              에어컨 {priceInfo.acCount}대 × {AC_PRICE_PER_UNIT.toLocaleString()}원
            </p>
            {isFirstAcCleaning && (
              <p className="text-[12px] text-brand mt-1 text-right">
                첫 에어컨 청소 {AC_FIRST_CLEANING_DISCOUNT.toLocaleString()}원 할인 적용
              </p>
            )}
          </div>
        )}

        <LoadingButton
          type="submit"
          variant="primary"
          disabled={!selectedPropertyId || selectedAssetIds.length === 0 || acAssets.length === 0}
        >
          {!selectedPropertyId
            ? '숙소를 선택해주세요'
            : acAssets.length === 0
              ? '등록된 에어컨이 없어요'
              : selectedAssetIds.length === 0
                ? '에어컨을 선택해주세요'
                : '청소 요청하기'}
        </LoadingButton>
      </form>

      {/* Date picker */}
      <Drawer open={dateDrawerOpen} onOpenChange={setDateDrawerOpen}>
        <DrawerContent>
          <DrawerHeader className="text-left px-4 pt-4 pb-2">
            <DrawerTitle className="text-[18px] font-semibold text-ink">날짜 선택</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6">
            <CalendarPicker
              selected={date}
              onSelect={handleDateSelect}
              minDate={minDateIso}
            />
          </div>
        </DrawerContent>
      </Drawer>

      {/* Time picker */}
      <Drawer open={timeDrawerOpen} onOpenChange={setTimeDrawerOpen}>
        <DrawerContent>
          <DrawerHeader className="text-left px-4 pt-4 pb-2">
            <DrawerTitle className="text-[18px] font-semibold text-ink">시간 선택</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto flex-1 pb-safe">
            {ALL_TIME_SLOTS.map((t, i) => {
              const isSelected = t === time
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleTimeSelect(t)}
                  className={cn(
                    'w-full flex items-center justify-between py-3 px-4 text-[15px] transition-colors',
                    i > 0 && 'border-t border-outline-dim',
                    isSelected ? 'font-semibold text-ink' : 'text-ink hover:bg-surface-soft active:bg-surface-dim',
                  )}
                >
                  <span>{formatTimeKorean(t)}</span>
                  {isSelected && (
                    <span className="w-[20px] h-[20px] rounded-full bg-ink flex items-center justify-center shrink-0">
                      <CheckIcon size={12} strokeWidth={3} className="text-white" />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
