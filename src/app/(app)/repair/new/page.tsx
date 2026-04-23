'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { CheckIcon, ChevronLeftIcon, PlusIcon, XIcon } from 'lucide-react'
import { toast } from 'sonner'
import { CalendarPicker } from '@/components/calendar-picker'
import { PropertyCard } from '@/components/property-card'
import { cn, formatDateLabel, formatTimeKorean, ALL_TIME_SLOTS, getMinTime, getAvailableTimeSlots, getDefaultTime, getTomorrow } from '@/lib/utils'
import { PROPERTY_REGISTRATION_STEPS } from '@/lib/process-steps'
import { useProperties, usePropertyDetail } from '@/lib/hooks/use-properties'
import { useAuth } from '@/lib/auth-provider'
import { api } from '@/lib/api-client'
import { CompoundInput, CompoundField } from '@/components/ui/floating-input'
import { LoadingButton } from '@/components/ui/loading-button'
import { ProcessDrawer } from '@/components/process-drawer'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { uploadRepairRequestImage, type UploadedRepairImage } from '@/lib/repair-image-upload'
import { useInvalidateRepair } from '@/lib/hooks/use-repair'
import { AssetCard } from '@/components/asset-card'

export default function NewRepairPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const { data: properties = [], isLoading: propertiesLoading } = useProperties()
  const invalidateRepair = useInvalidateRepair()

  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(searchParams.get('propertyId') ?? '')
  const { data: propertyDetail } = usePropertyDetail(selectedPropertyId)

  const [description, setDescription] = useState('')
  const [descriptionFocused, setDescriptionFocused] = useState(false)
  const [date, setDate] = useState(getTomorrow())
  const [time, setTime] = useState('11:00')
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([])
  const [draftAssetIds, setDraftAssetIds] = useState<string[]>([])
  const [photos, setPhotos] = useState<UploadedRepairImage[]>([])

  const [dateDrawerOpen, setDateDrawerOpen] = useState(false)
  const [timeDrawerOpen, setTimeDrawerOpen] = useState(false)
  const [assetDrawerOpen, setAssetDrawerOpen] = useState(false)
  const [registrationDrawerOpen, setRegistrationDrawerOpen] = useState(false)

  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const activeProperties = properties.filter((p) => p.status === 'active')
  const pendingProperties = properties.filter((p) => p.status === 'pending_activation')
  const selectedProperty = activeProperties.find((p) => p.id === selectedPropertyId)
  const timeSlots = getAvailableTimeSlots(date)
  const assets = propertyDetail?.assets ?? []
  const selectedAssets = assets.filter((a) => selectedAssetIds.includes(a.id))

  useEffect(() => {
    if (!propertiesLoading && activeProperties.length === 1 && !selectedPropertyId) {
      setSelectedPropertyId(activeProperties[0].id)
      return
    }

    if (!propertiesLoading && selectedPropertyId && !activeProperties.some((p) => p.id === selectedPropertyId)) {
      setSelectedPropertyId(activeProperties[0]?.id ?? '')
    }
  }, [activeProperties, propertiesLoading, selectedPropertyId])

  // 숙소 바뀌면 선택된 시설물 초기화
  useEffect(() => {
    setSelectedAssetIds([])
  }, [selectedPropertyId])

  function handleDateSelect(newDate: string) {
    setDate(newDate)
    const slots = getAvailableTimeSlots(newDate)
    if (!slots.includes(time)) {
      setTime(getDefaultTime(newDate))
    }
    setTimeout(() => setDateDrawerOpen(false), 300)
  }

  function handleTimeSelect(newTime: string) {
    setTime(newTime)
    setTimeout(() => setTimeDrawerOpen(false), 300)
  }

  function toggleDraftAsset(assetId: string) {
    setDraftAssetIds((prev) =>
      prev.includes(assetId) ? prev.filter((id) => id !== assetId) : [...prev, assetId],
    )
  }

  function openAssetDrawer() {
    setDraftAssetIds(selectedAssetIds)
    setAssetDrawerOpen(true)
  }

  function confirmAssetSelection() {
    setSelectedAssetIds(draftAssetIds)
    setAssetDrawerOpen(false)
  }

  function removeSelectedAsset(assetId: string) {
    setSelectedAssetIds((prev) => prev.filter((id) => id !== assetId))
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    e.target.value = '' // reset input

    setUploading(true)
    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          toast.error('이미지 파일만 업로드할 수 있어요.')
          continue
        }
        const uploaded = await uploadRepairRequestImage(file)
        setPhotos((prev) => [...prev, uploaded])
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '사진 업로드에 실패했어요.')
    } finally {
      setUploading(false)
    }
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedPropertyId || !user) return
    if (!description.trim()) {
      toast.error('상세 설명을 입력해주세요.')
      return
    }
    const minTime = getMinTime(date)
    if (minTime && time < minTime) {
      setTime(minTime)
      return
    }

    setSubmitting(true)
    try {
      const created = await api.post<{ id: string }>('/repair', {
        propertyId: selectedPropertyId,
        description: description.trim(),
        preferredScheduledDate: date,
        preferredScheduledTime: time,
        assetIds: selectedAssetIds,
        photos: photos.map((p) => ({
          storagePath: p.storagePath,
          thumbnailStoragePath: p.thumbnailStoragePath,
        })),
      })

      await invalidateRepair()
      toast.success('수리 요청이 접수되었어요')
      router.replace(`/repair/${created.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '요청에 실패했어요.')
      setSubmitting(false)
    }
  }

  const isPageLoading = authLoading || (!!user && propertiesLoading)

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
          <h2 className="text-[18px] font-semibold text-ink mb-2">
            등록된 숙소가 없어요
          </h2>
          <p className="text-[14px] text-ink-muted leading-relaxed">
            수리를 요청하려면 먼저 숙소를 등록해주세요
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

  if (activeProperties.length === 0) {
    return (
      <div className="animate-fade-up-fast min-h-[calc(100dvh-80px)] flex flex-col px-6 pt-6 pb-10">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-3 -ml-4 inline-flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface-soft"
        >
          <ChevronLeftIcon size={32} />
        </button>
        <h1 className="text-[22px] font-semibold text-ink mb-6">수리 요청</h1>

        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <h2 className="text-[18px] font-semibold text-ink mb-2">
            숙소 등록 완료 후 수리를 요청할 수 있어요
          </h2>
          <p className="text-[14px] text-ink-muted leading-relaxed">
            48시간 이내 직접 방문해 숙소 등록을 완료해드려요.
          </p>
          <button
            type="button"
            onClick={() => setRegistrationDrawerOpen(true)}
            className="text-[13px] text-ink-muted underline underline-offset-2 hover:text-ink transition-colors mt-4"
          >
            숙소 등록은 어떻게 진행되나요?
          </button>
        </div>

        <ProcessDrawer
          open={registrationDrawerOpen}
          onOpenChange={setRegistrationDrawerOpen}
          title="숙소 등록 진행 과정"
          steps={PROPERTY_REGISTRATION_STEPS}
        />
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
      <h1 className="text-[22px] font-semibold text-ink mb-6">수리 요청</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* 숙소 선택 */}
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
                      toast.info('등록 완료 후 수리를 요청할 수 있어요.')
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

        {/* 상세 설명 */}
        <CompoundInput>
          <CompoundField label="상세 설명 (필수)" focused={descriptionFocused} borderRadius="12px">
            <textarea
              rows={4}
              placeholder="증상과 현재 상황을 자유롭게 적어주세요"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onFocus={() => setDescriptionFocused(true)}
              onBlur={() => setDescriptionFocused(false)}
              className="block w-full resize-none bg-transparent text-[16px] text-ink leading-[1.4] placeholder:text-ink-faint outline-none"
              style={{ fontFamily: 'var(--font-body)' }}
            />
          </CompoundField>
        </CompoundInput>

        {/* 사진 첨부 */}
        <div>
          <p className="px-1 mb-2 text-[13px] font-medium text-ink-muted">사진 (선택)</p>
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo, i) => (
              <div key={i} className="relative aspect-square overflow-hidden rounded-lg border border-outline-dim">
                <Image src={photo.previewUrl} alt={`사진 ${i + 1}`} fill sizes="(max-width: 480px) 33vw, 120px" className="object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
                  aria-label="사진 삭제"
                >
                  <XIcon size={12} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex aspect-square flex-col items-center justify-center rounded-lg border border-dashed border-outline-strong text-ink-muted transition-colors hover:bg-surface-soft disabled:opacity-50"
            >
              {uploading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
              ) : (
                <>
                  <PlusIcon size={20} />
                  <span className="mt-0.5 text-[11px]">사진 추가</span>
                </>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>

        {/* 시설물 선택 */}
        <div>
          <p className="px-1 mb-2 text-[13px] font-medium text-ink-muted">관련 시설물 (선택)</p>
          <div className="flex flex-col gap-2">
            {selectedAssets.map((asset) => (
              <AssetCard
                key={asset.id}
                name={asset.name}
                location={asset.location}
                imageUrl={asset.photos[0]?.signedUrl ?? asset.photos[0]?.thumbnailSignedUrl ?? null}
                onRemove={() => removeSelectedAsset(asset.id)}
              />
            ))}
            <button
              type="button"
              onClick={openAssetDrawer}
              className="w-full rounded-xl border border-outline-dim bg-white px-4 py-3 text-left transition-all active:scale-[0.99]"
            >
              <span className="text-[14px] text-ink-faint">
                {selectedAssets.length === 0 ? '시설물 선택하기' : '시설물 추가하기'}
              </span>
            </button>
          </div>
          <p className="mt-1.5 px-1 text-[12px] text-ink-faint leading-relaxed">
            선택하시면 매니저가 필요한 부품을 미리 준비할 수 있어요.
          </p>
        </div>

        {/* 희망 날짜/시간 */}
        <div>
          <CompoundInput>
            <button type="button" className="w-full text-left" onClick={() => setDateDrawerOpen(true)}>
              <CompoundField label="희망 날짜" borderRadius="12px 12px 0 0">
                <span className="block w-full text-[16px] text-ink" style={{ fontFamily: 'var(--font-body)' }}>
                  {formatDateLabel(date)}
                </span>
              </CompoundField>
            </button>
            <button type="button" className="w-full text-left" onClick={() => setTimeDrawerOpen(true)}>
              <CompoundField label="희망 시간" borderRadius="0 0 12px 12px">
                <span className="block w-full text-[16px] text-ink" style={{ fontFamily: 'var(--font-body)' }}>
                  {formatTimeKorean(time)}
                </span>
              </CompoundField>
            </button>
          </CompoundInput>
          <p className="mt-1.5 px-1 text-[12px] text-ink-faint leading-relaxed">
            매니저가 유선으로 최종 일정을 조율해요.
          </p>
        </div>

        <LoadingButton
          type="submit"
          variant="primary"
          loading={submitting}
          loadingText="요청 중..."
          disabled={!selectedPropertyId || uploading}
        >
          {!selectedPropertyId ? '숙소를 선택해주세요' : '수리 요청하기'}
        </LoadingButton>
      </form>

      {/* 날짜 선택 */}
      <Drawer open={dateDrawerOpen} onOpenChange={setDateDrawerOpen}>
        <DrawerContent>
          <DrawerHeader className="text-left px-4 pt-4 pb-2">
            <DrawerTitle className="text-[18px] font-semibold text-ink">날짜 선택</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6">
            <CalendarPicker selected={date} onSelect={handleDateSelect} />
          </div>
        </DrawerContent>
      </Drawer>

      {/* 시간 선택 */}
      <Drawer open={timeDrawerOpen} onOpenChange={setTimeDrawerOpen}>
        <DrawerContent>
          <DrawerHeader className="text-left px-4 pt-4 pb-2">
            <DrawerTitle className="text-[18px] font-semibold text-ink">시간 선택</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto flex-1 pb-safe">
            {ALL_TIME_SLOTS.map((t, i) => {
              const isSelected = t === time
              const isDisabled = !timeSlots.includes(t)
              return (
                <button
                  key={t}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => !isDisabled && handleTimeSelect(t)}
                  className={cn(
                    'w-full flex items-center justify-between py-3 px-4 text-[15px] transition-colors',
                    i > 0 && 'border-t border-outline-dim',
                    isDisabled
                      ? 'text-outline-strong cursor-default'
                      : isSelected
                        ? 'font-semibold text-ink'
                        : 'text-ink hover:bg-surface-soft active:bg-surface-dim',
                  )}
                >
                  <span>{formatTimeKorean(t)}</span>
                  {isSelected && !isDisabled && (
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

      {/* 시설물 선택 */}
      <Drawer open={assetDrawerOpen} onOpenChange={setAssetDrawerOpen}>
        <DrawerContent>
          <DrawerHeader className="text-left px-4 pt-4 pb-2">
            <DrawerTitle className="text-[18px] font-semibold text-ink">관련 시설물 선택</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto flex-1">
            {assets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <p className="text-[14px] text-ink-muted">등록된 시설물이 없어요</p>
                <p className="mt-1 text-[12px] text-ink-faint">요청 내용만으로 접수할 수 있어요</p>
              </div>
            ) : (
              <div className="pb-2">
                {assets.map((asset, i) => {
                  const isSelected = draftAssetIds.includes(asset.id)
                  const thumbUrl = asset.photos[0]?.signedUrl ?? asset.photos[0]?.thumbnailSignedUrl
                  return (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => toggleDraftAsset(asset.id)}
                      className={cn(
                        'w-full flex items-center gap-3 py-3 px-4 transition-colors',
                        i > 0 && 'border-t border-outline-dim',
                        'hover:bg-surface-soft active:bg-surface-dim',
                      )}
                    >
                      <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-outline-dim bg-surface-subtle">
                        {thumbUrl ? (
                          <Image
                            src={thumbUrl}
                            alt={asset.name}
                            fill
                            sizes="48px"
                            className="object-contain"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <p className="text-[14px] font-medium text-ink truncate">{asset.name}</p>
                        <p className="text-[12px] text-ink-muted truncate">{asset.location}</p>
                      </div>
                      <span
                        className={cn(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                          isSelected ? 'border-brand bg-brand' : 'border-outline-strong bg-white',
                        )}
                      >
                        {isSelected && <CheckIcon size={12} strokeWidth={3} className="text-white" />}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          <div className="border-t border-outline-dim px-4 py-3 flex gap-2">
            <button
              type="button"
              onClick={() => setAssetDrawerOpen(false)}
              className="flex-1 h-11 rounded-lg border border-outline-dim text-[14px] font-medium text-ink-muted transition-colors hover:bg-surface-soft"
            >
              닫기
            </button>
            <button
              type="button"
              onClick={confirmAssetSelection}
              className="flex-1 h-11 rounded-lg bg-ink text-[14px] font-semibold text-white transition-all active:scale-[0.98]"
            >
              {draftAssetIds.length > 0 ? `${draftAssetIds.length}개 선택 완료` : '완료'}
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
