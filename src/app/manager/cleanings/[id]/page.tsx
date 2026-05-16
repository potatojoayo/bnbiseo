'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { MapPinIcon } from 'lucide-react'
import { ManagerCleaningPhotoField } from '@/components/manager-cleaning-photo-field'
import { ManagerPairedAfterField } from '@/components/manager-paired-after-field'
import { MobileBackButton } from '@/components/mobile-back-button'
import { CleaningStatusBadge } from '@/components/cleaning-status-badge'
import { CompoundField, CompoundInput } from '@/components/ui/floating-input'
import { ImageWithSkeleton } from '@/components/ui/image-with-skeleton'
import { CleaningPrepPhotoGrid } from '@/components/cleaning-prep-photo-grid'
import { LoadingButton } from '@/components/ui/loading-button'
import { AssetCard } from '@/components/asset-card'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { api, ApiError } from '@/lib/api-client'
import { useManagerCleaning, useManagerCleaningReport, useManagerOpenCleanings, useInvalidateManager, type ManagerCleaningDetail, type ManagerCleaningReport } from '@/lib/hooks/use-manager'
import type { UploadedManagerCleaningImage } from '@/lib/manager-cleaning-image-upload'
import { cn, formatDateLabel, formatTimeKorean } from '@/lib/utils'
import { calculateManagerPayout } from '@/lib/manager-payout'
import { useEffect, useMemo, useState } from 'react'

const SPACE_CATEGORY_LABELS: Record<ManagerCleaningDetail['spaces'][number]['category'], string> = {
  living_room: '거실',
  bedroom: '침실',
  bathroom: '화장실',
  veranda: '베란다',
  exterior: '외부',
  other: '기타',
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

type ManagerPrepPhoto = ManagerCleaningDetail['cleaningPrepPhotos']['cleaning_closet'][number]

function ManagerCleaningPrepReadGroup({
  title,
  text,
  photos,
}: {
  title: string
  text: string | null
  photos: ManagerPrepPhoto[]
}) {
  return (
    <div className="space-y-2">
      <p className="text-[13px] font-semibold text-ink">{title}</p>
      <CompoundInput>
        <CompoundField label="설명" borderRadius="12px">
          <span className="block w-full text-[16px] text-ink">{text || '-'}</span>
        </CompoundField>
      </CompoundInput>
      <CleaningPrepPhotoGrid photos={photos} />
    </div>
  )
}

export default function ManagerCleaningDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const invalidateManager = useInvalidateManager()
  const { data: openCleanings = [], isLoading: openCleaningsLoading } = useManagerOpenCleanings()
  const { data: cleaning, isLoading } = useManagerCleaning(id)
  const { data: report, isLoading: reportLoading } = useManagerCleaningReport(id)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [isClaimDrawerOpen, setIsClaimDrawerOpen] = useState(false)
  const [isActionDrawerOpen, setIsActionDrawerOpen] = useState(false)
  const [isSavingPhotos, setIsSavingPhotos] = useState(false)
  const [photosBySpace, setPhotosBySpace] = useState<Record<string, { before: UploadedManagerCleaningImage[]; afterBySlot: Record<number, UploadedManagerCleaningImage> }>>({})
  const serverPhotosBySpace = useMemo(() => {
    const result: Record<string, { before: UploadedManagerCleaningImage[]; afterBySlot: Record<number, UploadedManagerCleaningImage> }> = {}
    for (const group of cleaning?.cleaningPhotosBySpace ?? []) {
      const afterBySlot: Record<number, UploadedManagerCleaningImage> = {}
      for (const photo of group.after) {
        afterBySlot[photo.sortOrder] = {
          storagePath: photo.storagePath,
          thumbnailStoragePath: photo.thumbnailStoragePath,
          previewUrl: photo.thumbnailSignedUrl || photo.signedUrl || '',
        }
      }
      result[group.spaceId] = {
        before: [...group.before]
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((photo) => ({
            storagePath: photo.storagePath,
            thumbnailStoragePath: photo.thumbnailStoragePath,
            previewUrl: photo.thumbnailSignedUrl || photo.signedUrl || '',
          })),
        afterBySlot,
      }
    }
    return result
  }, [cleaning?.cleaningPhotosBySpace])

  useEffect(() => {
    setPhotosBySpace(serverPhotosBySpace)
  }, [serverPhotosBySpace])

  const openCleaning = openCleanings.find((item) => item.id === id)
  const previewCleaning = cleaning ?? openCleaning

  if (isLoading || openCleaningsLoading || (!!cleaning && reportLoading)) {
    return (
      <div className="flex min-h-[calc(100dvh-80px)] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
      </div>
    )
  }

  if (!previewCleaning) {
    return (
      <div className="flex min-h-[calc(100dvh-80px)] items-center justify-center px-6 text-center text-[14px] text-ink-muted">
        청소 요청을 찾을 수 없어요.
      </div>
    )
  }

  const details = [
    previewCleaning.propertyPyeong != null && `${previewCleaning.propertyPyeong}평`,
    previewCleaning.propertyLivingRooms != null && `거실 ${previewCleaning.propertyLivingRooms}`,
    previewCleaning.propertyBedrooms != null && `침실 ${previewCleaning.propertyBedrooms}`,
    previewCleaning.propertyBathrooms != null && `욕실 ${previewCleaning.propertyBathrooms}`,
  ].filter(Boolean)
  const actionStatus = cleaning?.status === 'confirmed'
    ? 'in_progress'
    : cleaning?.status === 'in_progress'
      ? 'completed'
      : null
  const actionLabel = actionStatus === 'in_progress'
    ? '청소 시작'
    : actionStatus === 'completed'
      ? '청소 완료'
      : null
  const canWriteReport = cleaning?.status === 'in_progress'
  const canViewReport = cleaning?.status === 'completed'
  const canEditBeforePhotos = cleaning?.status === 'confirmed'
  const canEditAfterPhotos = cleaning?.status === 'in_progress'
  const canViewPhotos = !!cleaning && ['confirmed', 'in_progress', 'completed'].includes(cleaning.status)
  const canClaimCleaning = previewCleaning.status === 'pending'
  const allAssetsInspected = cleaning?.assets.every((asset) =>
    report?.report.assets.some((item) => item.assetId === asset.id && item.status),
  ) ?? false
  const photoSpaces = cleaning?.cleaningPhotosBySpace ?? []
  const allSpacesHaveBefore = photoSpaces.length > 0 && photoSpaces.every(
    (space) => (photosBySpace[space.spaceId]?.before ?? []).length > 0,
  )
  const allSpacesPaired = photoSpaces.length > 0 && photoSpaces.every((space) => {
    const afterBySlot = photosBySpace[space.spaceId]?.afterBySlot ?? {}
    return space.before.every((before) => afterBySlot[before.sortOrder] != null)
  })
  const canStartCleaning = allSpacesHaveBefore
  const canCompleteCleaning = allAssetsInspected && allSpacesPaired

  async function handleClaim() {
    setIsClaiming(true)
    try {
      await api.post(`/manager/cleanings/${id}/claim`)
      setIsClaimDrawerOpen(false)
      toast.success('청소를 맡았어요.')
      await Promise.all([
        invalidateManager.openCleanings(),
        invalidateManager.myCleanings(),
        invalidateManager.cleaningDetail(id),
      ])
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message)
      } else {
        toast.error('청소 요청을 가져오지 못했어요.')
      }
    } finally {
      setIsClaiming(false)
    }
  }

  type SavedPhoto = {
    id: string
    storagePath: string
    thumbnailStoragePath: string
    sortOrder: number
    signedUrl: string | null
    thumbnailSignedUrl: string | null
  }

  async function postSpacePhotos(
    propertySpaceId: string,
    kind: 'before' | 'after',
    photos: Array<{ storagePath: string; thumbnailStoragePath: string; slotIndex: number; previewUrl: string }>,
  ) {
    const saved = await api.post<{
      success: true
      photos: SavedPhoto[]
    }>(`/manager/cleanings/${id}/photos`, {
      propertySpaceId,
      kind,
      photos: photos.map((p) => ({
        storagePath: p.storagePath,
        thumbnailStoragePath: p.thumbnailStoragePath,
        slotIndex: p.slotIndex,
      })),
    })

    queryClient.setQueryData<ManagerCleaningDetail>(
      ['manager', 'cleanings', 'detail', id],
      (previous) => previous
        ? {
            ...previous,
            cleaningPhotosBySpace: previous.cleaningPhotosBySpace.map((group) => {
              if (group.spaceId !== propertySpaceId) return group
              const savedWithFallback = saved.photos.map((photo) => {
                const localPhoto = photos.find((image) => image.storagePath === photo.storagePath)
                return {
                  ...photo,
                  signedUrl: photo.signedUrl ?? localPhoto?.previewUrl ?? null,
                  thumbnailSignedUrl: photo.thumbnailSignedUrl ?? localPhoto?.previewUrl ?? null,
                }
              })
              return {
                ...group,
                [kind]: savedWithFallback,
              }
            }),
          }
        : previous,
    )
  }

  async function saveBeforePhotos(propertySpaceId: string, nextImages: UploadedManagerCleaningImage[]) {
    setIsSavingPhotos(true)
    setPhotosBySpace((previous) => ({
      ...previous,
      [propertySpaceId]: {
        before: nextImages,
        afterBySlot: previous[propertySpaceId]?.afterBySlot ?? {},
      },
    }))
    try {
      await postSpacePhotos(
        propertySpaceId,
        'before',
        nextImages.map((image, index) => ({
          storagePath: image.storagePath,
          thumbnailStoragePath: image.thumbnailStoragePath,
          slotIndex: index,
          previewUrl: image.previewUrl,
        })),
      )
    } catch (error) {
      setPhotosBySpace(serverPhotosBySpace)
      toast.error(error instanceof ApiError ? error.message : '청소 전 사진을 저장하지 못했어요.')
    } finally {
      setIsSavingPhotos(false)
    }
  }

  async function saveAfterPhotos(
    propertySpaceId: string,
    nextAfterBySlot: Record<number, UploadedManagerCleaningImage>,
  ) {
    setIsSavingPhotos(true)
    setPhotosBySpace((previous) => ({
      ...previous,
      [propertySpaceId]: {
        before: previous[propertySpaceId]?.before ?? [],
        afterBySlot: nextAfterBySlot,
      },
    }))
    try {
      await postSpacePhotos(
        propertySpaceId,
        'after',
        Object.entries(nextAfterBySlot).map(([slotIndex, image]) => ({
          storagePath: image.storagePath,
          thumbnailStoragePath: image.thumbnailStoragePath,
          slotIndex: Number(slotIndex),
          previewUrl: image.previewUrl,
        })),
      )
    } catch (error) {
      setPhotosBySpace(serverPhotosBySpace)
      toast.error(error instanceof ApiError ? error.message : '청소 후 사진을 저장하지 못했어요.')
    } finally {
      setIsSavingPhotos(false)
    }
  }

  async function handleStatusUpdate() {
    if (!actionStatus || isSubmitting) return

    setIsSubmitting(true)
    try {
      await api.post(`/manager/cleanings/${id}/status`, { status: actionStatus })
      queryClient.setQueryData<ManagerCleaningDetail>(
        ['manager', 'cleanings', 'detail', id],
        (previous) => previous
          ? {
              ...previous,
              status: actionStatus,
            }
          : previous,
      )
      queryClient.setQueryData(
        ['manager', 'cleanings', 'report', id],
        (previous: ManagerCleaningReport | undefined) => previous
          ? {
              ...previous,
              status: actionStatus,
            }
          : previous,
      )
      invalidateManager.cleaningDetail(id)
      invalidateManager.cleaningReport(id)
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
        <h1 className="text-[22px] font-semibold text-ink">{previewCleaning.propertyName || '숙소'}</h1>
        <p className="text-[14px] leading-relaxed text-ink-muted">
          <MapPinIcon className="mr-1 inline-block size-3.5 align-[-2px] text-ink-faint" strokeWidth={1.75} />
          {previewCleaning.propertyAddress}
          {previewCleaning.propertyAddressDetail ? ` ${previewCleaning.propertyAddressDetail}` : ''}
        </p>
        {details.length > 0 && (
          <p className="text-[13px] text-ink-muted">{details.join(' · ')}</p>
        )}
      </div>

      <section className="mt-7 space-y-4">
        <p className="text-[16px] font-semibold text-ink">청소 요청 정보</p>
        <div className="rounded-xl border border-outline-dim px-4 py-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-ink-muted">
            <span>{formatDateLabel(previewCleaning.scheduledDate)}</span>
            <span>{formatTimeKorean(previewCleaning.scheduledTime)}</span>
          </div>
          <div className="mt-3 border-t border-outline-dim" />
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-[13px] text-ink-muted">청소 유형</p>
            <p className="text-[14px] font-medium text-ink">
              {CLEANING_TYPE_LABELS[previewCleaning.cleaningType]}
              <span className="ml-1.5 text-[12px] text-ink-muted">
                · {previewCleaning.cleaningPlan === 'regular' ? '정기' : '단건'}
              </span>
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-[13px] text-ink-muted">요청 상태</p>
            <CleaningStatusBadge
              status={previewCleaning.status}
              label={previewCleaning.status === 'pending' ? '배정 대기' : previewCleaning.status === 'confirmed' ? '배정 완료' : undefined}
            />
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-[13px] text-ink-muted">정산 예정</p>
            <p className="text-[15px] font-semibold text-ink">{calculateManagerPayout(previewCleaning.finalPrice).toLocaleString()}원</p>
          </div>
          {previewCleaning.memo && (
            <>
              <div className="mt-3 border-t border-outline-dim" />
              <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">{previewCleaning.memo}</p>
            </>
          )}
        </div>
      </section>

      {!cleaning && canClaimCleaning && (
        <div className="mt-7">
          <LoadingButton
            type="button"
            variant="primary"
            loading={false}
            onClick={() => setIsClaimDrawerOpen(true)}
            className="h-12 w-full rounded-xl text-[15px] font-semibold"
          >
            배정받기
          </LoadingButton>
        </div>
      )}

      {!cleaning && canClaimCleaning && (
        <Drawer open={isClaimDrawerOpen} onOpenChange={setIsClaimDrawerOpen}>
          <DrawerContent className="rounded-t-[24px] px-6 pb-8">
            <DrawerHeader className="px-0 pt-2 pb-0 text-left">
              <DrawerTitle className="text-[18px] font-semibold text-ink">
                이 요청을 배정받을까요?
              </DrawerTitle>
            </DrawerHeader>
            <p className="mt-3 text-[14px] leading-relaxed text-ink-muted">
              한 번 배정받은 요청은 취소할 수 없어요. 일정을 다시 확인한 뒤 배정받아주세요.
            </p>
            <div className="mt-4 rounded-xl border border-outline-dim px-4 py-4">
              <p className="text-[15px] font-semibold text-ink">{previewCleaning.propertyName || '숙소'}</p>
              <p className="mt-1 text-[13px] text-ink-muted">
                {formatDateLabel(previewCleaning.scheduledDate)} · {formatTimeKorean(previewCleaning.scheduledTime)}
              </p>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setIsClaimDrawerOpen(false)}
                className="flex h-12 items-center justify-center rounded-xl border border-outline-dim text-[15px] font-semibold text-ink"
              >
                닫기
              </button>
              <LoadingButton
                type="button"
                variant="primary"
                loading={isClaiming}
                loadingText="배정 중..."
                onClick={handleClaim}
                className="h-12 rounded-xl text-[15px] font-semibold"
              >
                배정받기
              </LoadingButton>
            </div>
          </DrawerContent>
        </Drawer>
      )}

      {!cleaning && (
        <div className="mt-7 rounded-xl border border-outline-dim bg-surface-subtle px-4 py-4">
          <p className="text-[14px] leading-relaxed text-ink-muted">
            배정 전 요청이라 상세 정보는 배정받은 뒤 확인할 수 있어요.
          </p>
        </div>
      )}

      {cleaning && (actionLabel || canWriteReport || canViewReport || canViewPhotos) && (
        <div className="mt-5 flex flex-col gap-3">
          {canViewPhotos && photoSpaces.length > 0 && (
            <section className="space-y-5">
              <div>
                <p className="text-[16px] font-semibold text-ink">공간별 청소 사진</p>
                <p className="mt-1 text-[12px] text-ink-muted">
                  {canEditBeforePhotos
                    ? '모든 공간의 청소 전 사진을 1장 이상 올려야 청소를 시작할 수 있어요.'
                    : canEditAfterPhotos
                      ? '모든 공간의 청소 후 사진을 1장 이상 올려야 청소를 완료할 수 있어요.'
                      : '청소 전/후 사진을 공간별로 확인하세요.'}
                </p>
              </div>
              <div className="flex flex-col gap-6">
                {photoSpaces.map((space) => {
                  const beforeImages = photosBySpace[space.spaceId]?.before ?? []
                  const afterBySlot = photosBySpace[space.spaceId]?.afterBySlot ?? {}
                  const showPaired = cleaning.status === 'in_progress' || cleaning.status === 'completed'
                  return (
                    <div key={space.spaceId} className="rounded-xl border border-outline-dim p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-[15px] font-semibold text-ink">{space.spaceName}</p>
                        <span className="text-[11px] font-medium text-ink-muted">
                          {SPACE_CATEGORY_LABELS[space.category]}
                        </span>
                      </div>
                      {canEditBeforePhotos && (
                        <ManagerCleaningPhotoField
                          cleaningId={id}
                          propertySpaceId={space.spaceId}
                          kind="before"
                          title="청소 전 사진"
                          emptyText="게스트가 사용한 현황을 사진으로 남겨주세요."
                          images={beforeImages}
                          readOnly={false}
                          onError={(message) => { if (message) toast.error(message) }}
                          onChange={(images) => {
                            if (isSavingPhotos) return
                            void saveBeforePhotos(space.spaceId, images)
                          }}
                        />
                      )}
                      {showPaired && (
                        <ManagerPairedAfterField
                          cleaningId={id}
                          propertySpaceId={space.spaceId}
                          beforePhotos={space.before}
                          afterBySlot={afterBySlot}
                          readOnly={!canEditAfterPhotos}
                          onError={(message) => { if (message) toast.error(message) }}
                          onChange={(nextAfterBySlot) => {
                            if (isSavingPhotos) return
                            void saveAfterPhotos(space.spaceId, nextAfterBySlot)
                          }}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )}
          {canWriteReport && (
            <Link
              href={`/manager/cleanings/${id}/report`}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-outline-dim text-[14px] font-medium text-ink transition-colors active:bg-surface-soft"
            >
              시설물 점검 리포트 작성
            </Link>
          )}
          {canViewReport && (
            <Link
              href={`/manager/cleanings/${id}/report`}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-outline-dim text-[14px] font-medium text-ink transition-colors active:bg-surface-soft"
            >
              시설물 점검 리포트
            </Link>
          )}
          {actionLabel && (
            <LoadingButton
              type="button"
              variant="primary"
              loading={false}
              onClick={() => {
                if (actionStatus === 'in_progress' && !canStartCleaning) {
                  toast.info('모든 공간의 청소 전 사진을 1장 이상 등록한 뒤 청소를 시작할 수 있어요.')
                  return
                }
                if (actionStatus === 'completed' && !canCompleteCleaning) {
                  if (!allAssetsInspected && !allSpacesPaired) {
                    toast.info('모든 시설물 점검과 청소 전 사진별 청소 후 사진을 등록한 뒤 청소를 완료할 수 있어요.')
                  } else if (!allAssetsInspected) {
                    toast.info('모든 시설물의 점검 상태를 선택한 뒤 청소를 완료할 수 있어요.')
                  } else {
                    toast.info('모든 청소 전 사진과 짝이 되는 청소 후 사진을 등록한 뒤 청소를 완료할 수 있어요.')
                  }
                  return
                }
                setIsActionDrawerOpen(true)
              }}
              className={cn(
                'h-12 w-full rounded-xl text-[15px] font-semibold',
                actionStatus === 'in_progress' && !canStartCleaning && 'opacity-50',
                actionStatus === 'completed' && !canCompleteCleaning && 'opacity-50',
              )}
              aria-disabled={
                (actionStatus === 'in_progress' && !canStartCleaning) ||
                (actionStatus === 'completed' && !canCompleteCleaning)
              }
            >
              {actionLabel}
            </LoadingButton>
          )}
        </div>
      )}

      {cleaning && (
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
      )}

      {cleaning && (
      <section className="mt-7 space-y-4">
        <p className="text-[16px] font-semibold text-ink">청소 준비 정보</p>
        <ManagerCleaningPrepReadGroup
          title="청소 도구함 위치"
          text={cleaning.cleaningClosetLocation}
          photos={cleaning.cleaningPrepPhotos.cleaning_closet}
        />
        <ManagerCleaningPrepReadGroup
          title="침구류 여분 위치"
          text={cleaning.extraLinenLocation}
          photos={cleaning.cleaningPrepPhotos.extra_linen}
        />
        <ManagerCleaningPrepReadGroup
          title="쓰레기 배출 장소"
          text={cleaning.trashDisposalLocation}
          photos={cleaning.cleaningPrepPhotos.trash_disposal}
        />
        {cleaning.linenWashLocation === 'external' && (
          <div className="space-y-2">
            <p className="text-[13px] font-semibold text-ink">외부 세탁소 주소</p>
            <CompoundInput>
              <CompoundField label="주소" borderRadius="12px">
                <span className="block w-full text-[16px] text-ink">
                  {cleaning.linenWashExternalAddress
                    ? `${cleaning.linenWashExternalAddress}${cleaning.linenWashExternalAddressDetail ? ` ${cleaning.linenWashExternalAddressDetail}` : ''}`
                    : '-'}
                </span>
              </CompoundField>
            </CompoundInput>
            {cleaning.cleaningPrepPhotos.linen_wash_external.length > 0 && (
              <CleaningPrepPhotoGrid photos={cleaning.cleaningPrepPhotos.linen_wash_external} />
            )}
          </div>
        )}
      </section>
      )}

      {cleaning && (
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
                    <ImageWithSkeleton
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
                    {SPACE_CATEGORY_LABELS[space.category]} · {space.pyeong}평
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
      )}

      {cleaning && (
      <section className="mt-7 space-y-4">
        <p className="text-[16px] font-semibold text-ink">시설물 정보</p>
        {cleaning.assets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-outline-strong px-4 py-6 text-center text-[14px] text-ink-muted">
            등록된 시설물이 없어요.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {cleaning.assets.map((asset) => (
              <AssetCard
                key={asset.id}
                name={asset.name}
                category={ASSET_CATEGORY_LABELS[asset.category]}
                location={asset.location}
                brand={asset.brand}
                modelNumber={asset.modelNumber}
                notes={asset.notes}
                imageUrl={asset.photos[0]?.signedUrl ?? asset.photos[0]?.thumbnailSignedUrl ?? null}
                href={`/manager/cleanings/${id}/assets/${asset.id}`}
              />
            ))}
          </div>
        )}
      </section>
      )}

      {cleaning && canClaimCleaning && (
        <div className="mt-7">
          <LoadingButton
            type="button"
            variant="primary"
            loading={false}
            onClick={() => setIsClaimDrawerOpen(true)}
            className="h-12 w-full rounded-xl text-[15px] font-semibold"
          >
            배정받기
          </LoadingButton>
        </div>
      )}

      {cleaning && canClaimCleaning && (
        <Drawer open={isClaimDrawerOpen} onOpenChange={setIsClaimDrawerOpen}>
          <DrawerContent className="rounded-t-[24px] px-6 pb-8">
            <DrawerHeader className="px-0 pt-2 pb-0 text-left">
              <DrawerTitle className="text-[18px] font-semibold text-ink">
                이 요청을 배정받을까요?
              </DrawerTitle>
            </DrawerHeader>
            <p className="mt-3 text-[14px] leading-relaxed text-ink-muted">
              한 번 배정받은 요청은 취소할 수 없어요. 일정을 다시 확인한 뒤 배정받아주세요.
            </p>
            <div className="mt-4 rounded-xl border border-outline-dim px-4 py-4">
              <p className="text-[15px] font-semibold text-ink">{previewCleaning.propertyName || '숙소'}</p>
              <p className="mt-1 text-[13px] text-ink-muted">
                {formatDateLabel(previewCleaning.scheduledDate)} · {formatTimeKorean(previewCleaning.scheduledTime)}
              </p>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setIsClaimDrawerOpen(false)}
                className="flex h-12 items-center justify-center rounded-xl border border-outline-dim text-[15px] font-semibold text-ink"
              >
                닫기
              </button>
              <LoadingButton
                type="button"
                variant="primary"
                loading={isClaiming}
                loadingText="배정 중..."
                onClick={handleClaim}
                className="h-12 rounded-xl text-[15px] font-semibold"
              >
                배정받기
              </LoadingButton>
            </div>
          </DrawerContent>
        </Drawer>
      )}

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
              <p className="text-[15px] font-semibold text-ink">{previewCleaning.propertyName || '숙소'}</p>
              <p className="mt-1 text-[13px] text-ink-muted">
                {formatDateLabel(previewCleaning.scheduledDate)} · {formatTimeKorean(previewCleaning.scheduledTime)}
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
