'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { MapPinIcon } from 'lucide-react'
import { MobileBackButton } from '@/components/mobile-back-button'
import { CompoundField, CompoundInput } from '@/components/ui/floating-input'
import { LoadingButton } from '@/components/ui/loading-button'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { api, ApiError } from '@/lib/api-client'
import { useManagerCleaning, useInvalidateManager, type ManagerCleaningDetail } from '@/lib/hooks/use-manager'
import { formatDateLabel, formatTimeKorean } from '@/lib/utils'
import { useState } from 'react'

const SPACE_CATEGORY_LABELS: Record<ManagerCleaningDetail['spaces'][number]['category'], string> = {
  living_room: '거실',
  bedroom: '침실',
  bathroom: '화장실',
}

const ASSET_CATEGORY_LABELS: Record<ManagerCleaningDetail['assets'][number]['category'], string> = {
  lighting: '조명',
  furniture: '가구',
  faucet: '수도/배관',
  boiler: '보일러',
  appliance: '가전',
  lock: '잠금장치',
  ac: '에어컨',
  washer: '세탁기',
  dryer: '건조기',
  vent: '환기',
  other: '기타',
}

const CLEANING_TYPE_LABELS: Record<ManagerCleaningDetail['cleaningType'], string> = {
  standard: '일반 청소',
  urgent: '긴급 청소',
}

const STATUS_LABELS: Record<ManagerCleaningDetail['status'], string> = {
  pending: '배정 대기',
  confirmed: '배정 완료',
  in_progress: '청소 진행 중',
  completed: '청소 완료',
}

export default function ManagerCleaningDetailPage() {
  const { id } = useParams<{ id: string }>()
  const invalidateManager = useInvalidateManager()
  const { data: cleaning, isLoading } = useManagerCleaning(id)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isActionDrawerOpen, setIsActionDrawerOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100dvh-80px)] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
      </div>
    )
  }

  if (!cleaning) {
    return (
      <div className="flex min-h-[calc(100dvh-80px)] items-center justify-center px-6 text-center text-[14px] text-ink-muted">
        청소 요청을 찾을 수 없어요.
      </div>
    )
  }

  const details = [
    cleaning.propertyPyeong != null && `${cleaning.propertyPyeong}평`,
    cleaning.propertyLivingRooms != null && `거실 ${cleaning.propertyLivingRooms}`,
    cleaning.propertyBedrooms != null && `침실 ${cleaning.propertyBedrooms}`,
    cleaning.propertyBathrooms != null && `욕실 ${cleaning.propertyBathrooms}`,
  ].filter(Boolean)
  const actionStatus = cleaning.status === 'confirmed'
    ? 'in_progress'
    : cleaning.status === 'in_progress'
      ? 'completed'
      : null
  const actionLabel = actionStatus === 'in_progress'
    ? '청소 시작'
    : actionStatus === 'completed'
      ? '청소 완료'
      : null

  async function handleStatusUpdate() {
    if (!actionStatus || isSubmitting) return

    setIsSubmitting(true)
    try {
      await api.post(`/manager/cleanings/${id}/status`, { status: actionStatus })
      invalidateManager.cleaningDetail(id)
      invalidateManager.myCleanings()
      invalidateManager.openCleanings()
      toast.success(actionStatus === 'in_progress' ? '청소를 시작했어요.' : '청소를 완료했어요.')
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message)
      } else {
        toast.error('상태를 변경하지 못했어요.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="animate-fade-up-fast flex min-h-[calc(100dvh-80px)] flex-col px-6 pt-6 pb-10">
      <div className="-mb-1">
        <MobileBackButton href="/manager/home" mode="back" />
      </div>

      <div className="mt-2 space-y-2">
        <h1 className="text-[22px] font-semibold text-ink">{cleaning.propertyName || '숙소'}</h1>
        <p className="text-[14px] leading-relaxed text-ink-muted">
          <MapPinIcon className="mr-1 inline-block size-3.5 align-[-2px] text-ink-faint" strokeWidth={1.75} />
          {cleaning.propertyAddress}
          {cleaning.propertyAddressDetail ? ` ${cleaning.propertyAddressDetail}` : ''}
        </p>
        {details.length > 0 && (
          <p className="text-[13px] text-ink-muted">{details.join(' · ')}</p>
        )}
      </div>

      <section className="mt-7 space-y-4">
        <p className="text-[16px] font-semibold text-ink">청소 요청 정보</p>
        <div className="rounded-xl border border-outline-dim px-4 py-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-ink-muted">
            <span>{formatDateLabel(cleaning.scheduledDate)}</span>
            <span>{formatTimeKorean(cleaning.scheduledTime)}</span>
          </div>
          <div className="mt-3 border-t border-outline-dim" />
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-[13px] text-ink-muted">청소 유형</p>
            <p className="text-[14px] font-medium text-ink">{CLEANING_TYPE_LABELS[cleaning.cleaningType]}</p>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-[13px] text-ink-muted">요청 상태</p>
            <p className="text-[14px] font-medium text-ink">{STATUS_LABELS[cleaning.status]}</p>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-[13px] text-ink-muted">청소 금액</p>
            <p className="text-[15px] font-semibold text-ink">{cleaning.finalPrice.toLocaleString()}원</p>
          </div>
          {cleaning.memo && (
            <>
              <div className="mt-3 border-t border-outline-dim" />
              <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">{cleaning.memo}</p>
            </>
          )}
        </div>
      </section>

      {actionLabel && (
        <div className="mt-5">
          <LoadingButton
            type="button"
            variant="primary"
            loading={false}
            onClick={() => setIsActionDrawerOpen(true)}
            className="h-12 w-full rounded-xl text-[15px] font-semibold"
          >
            {actionLabel}
          </LoadingButton>
        </div>
      )}

      <section className="mt-7 space-y-4">
        <p className="text-[16px] font-semibold text-ink">출입 및 와이파이 정보</p>
        <CompoundInput>
          <CompoundField label="현관 비밀번호" borderRadius="12px 12px 0 0">
            <span className="block w-full text-[16px] text-ink">{cleaning.entrancePassword || '-'}</span>
          </CompoundField>
          <CompoundField label="도어락 비밀번호">
            <span className="block w-full text-[16px] text-ink">{cleaning.doorLockPassword || '-'}</span>
          </CompoundField>
          <CompoundField label="와이파이 이름">
            <span className="block w-full text-[16px] text-ink">{cleaning.wifiSsid || '-'}</span>
          </CompoundField>
          <CompoundField label="와이파이 비밀번호" borderRadius="0 0 12px 12px">
            <span className="block w-full text-[16px] text-ink">{cleaning.wifiPassword || '-'}</span>
          </CompoundField>
        </CompoundInput>
      </section>

      <section className="mt-7 space-y-4">
        <p className="text-[16px] font-semibold text-ink">공간 정보</p>
        {cleaning.spaces.length === 0 ? (
          <div className="rounded-xl border border-dashed border-outline-strong px-4 py-6 text-center text-[14px] text-ink-muted">
            등록된 공간이 없어요.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {cleaning.spaces.map((space) => (
              <Link
                key={space.id}
                href={`/manager/cleanings/${id}/spaces/${space.id}`}
                className="overflow-hidden rounded-xl border border-outline-dim transition-all active:scale-[0.99] md:hover:-translate-y-0.5 md:hover:border-outline-strong md:hover:shadow-[0_10px_24px_rgba(0,0,0,0.06)]"
              >
                <div className="relative aspect-[16/10] w-full bg-surface-soft">
                  {space.photos[0]?.signedUrl ? (
                    <Image
                      src={space.photos[0].signedUrl}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 100vw, 720px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[13px] text-ink-faint">
                      사진 없음
                    </div>
                  )}
                </div>
                <div className="px-4 py-4">
                  <p className="text-[15px] font-semibold text-ink">{space.name}</p>
                  <p className="mt-1 text-[13px] text-ink-muted">
                    {space.floor}층 · {SPACE_CATEGORY_LABELS[space.category]} · {space.pyeong}평
                  </p>
                  {space.notes && (
                    <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-ink-muted">{space.notes}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mt-7 space-y-4">
        <p className="text-[16px] font-semibold text-ink">시설물 정보</p>
        {cleaning.assets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-outline-strong px-4 py-6 text-center text-[14px] text-ink-muted">
            등록된 시설물이 없어요.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {cleaning.assets.map((asset) => (
              <Link
                key={asset.id}
                href={`/manager/cleanings/${id}/assets/${asset.id}`}
                className="overflow-hidden rounded-xl border border-outline-dim transition-all active:scale-[0.99] md:hover:-translate-y-0.5 md:hover:border-outline-strong md:hover:shadow-[0_10px_24px_rgba(0,0,0,0.06)]"
              >
                <div className="flex items-stretch">
                  <div className="relative w-[104px] shrink-0 overflow-hidden bg-surface-soft">
                    {asset.photos[0]?.signedUrl ? (
                      <Image
                        src={asset.photos[0].signedUrl}
                        alt=""
                        fill
                        sizes="104px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[12px] text-ink-faint">
                        사진 없음
                      </div>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 items-start px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold text-ink">{asset.name}</p>
                      <p className="mt-1 text-[13px] text-ink-muted">
                        {ASSET_CATEGORY_LABELS[asset.category]} · {asset.location}
                      </p>
                      {(asset.brand || asset.modelNumber) && (
                        <p className="mt-1 text-[13px] text-ink-muted">
                          {[asset.brand, asset.modelNumber].filter(Boolean).join(' · ')}
                        </p>
                      )}
                      {asset.notes && (
                        <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-ink-muted">{asset.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {actionLabel && (
        <Drawer open={isActionDrawerOpen} onOpenChange={setIsActionDrawerOpen}>
          <DrawerContent className="rounded-t-[24px] px-6 pb-8">
            <DrawerHeader className="px-0 pt-2 pb-0 text-left">
              <DrawerTitle className="text-[18px] font-semibold text-ink">
                {actionStatus === 'in_progress' ? '청소를 시작할까요?' : '청소를 완료할까요?'}
              </DrawerTitle>
            </DrawerHeader>
            <p className="mt-3 text-[14px] leading-relaxed text-ink-muted">
              {actionStatus === 'in_progress'
                ? '청소를 시작하면 진행 중 상태로 바뀌어요.'
                : '청소를 완료하면 완료 상태로 바뀌고 다시 되돌릴 수 없어요.'}
            </p>
            <div className="mt-4 rounded-xl border border-outline-dim px-4 py-4">
              <p className="text-[15px] font-semibold text-ink">{cleaning.propertyName || '숙소'}</p>
              <p className="mt-1 text-[13px] text-ink-muted">
                {formatDateLabel(cleaning.scheduledDate)} · {formatTimeKorean(cleaning.scheduledTime)}
              </p>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setIsActionDrawerOpen(false)}
                className="flex h-12 items-center justify-center rounded-xl border border-outline-dim text-[15px] font-semibold text-ink"
              >
                닫기
              </button>
              <LoadingButton
                type="button"
                variant="primary"
                loading={isSubmitting}
                onClick={async () => {
                  await handleStatusUpdate()
                  setIsActionDrawerOpen(false)
                }}
                className="h-12 rounded-xl text-[15px] font-semibold"
              >
                {actionLabel}
              </LoadingButton>
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  )
}
