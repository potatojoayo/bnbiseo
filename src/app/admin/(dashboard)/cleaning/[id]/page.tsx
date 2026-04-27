'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  CalendarIcon,
  ClockIcon,
  CreditCardIcon,
  HomeIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon,
} from 'lucide-react'
import { MobileBackButton } from '@/components/mobile-back-button'
import { SiteHeader } from '@/components/site-header'
import { ImageWithSkeleton } from '@/components/ui/image-with-skeleton'
import { ReadOnlyPhotoGallery } from '@/components/read-only-photo-gallery'
import {
  CleaningStatusBadge,
  getCleaningStatusLabel,
  type CleaningStatus,
} from '@/components/cleaning-status-badge'
import { api } from '@/lib/api-client'
import { formatDateLabel, formatTimeKorean } from '@/lib/utils'
import {
  useAdminCleaningDetail,
  useAdminManagers,
  useInvalidateAdmin,
} from '@/lib/hooks/use-admin'
import { LoadingButton } from '@/components/ui/loading-button'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'

export default function AdminCleaningDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: cleaning, isLoading } = useAdminCleaningDetail(id)
  const { data: allManagers = [] } = useAdminManagers()
  const invalidate = useInvalidateAdmin()
  const activeManagers = allManagers.filter((m) => m.isActive)

  const [assignOpen, setAssignOpen] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [confirmManager, setConfirmManager] = useState<{ id: string; name: string; phone: string } | null>(null)
  const [statusOpen, setStatusOpen] = useState(false)
  const [updating, setUpdating] = useState(false)

  async function handleAssign(managerId: string) {
    setAssigning(true)
    try {
      await api.post(`/admin/cleaning/${id}/assign`, { managerId })
      invalidate.cleaning()
      invalidate.stats()
      setConfirmManager(null)
      setAssignOpen(false)
    } finally {
      setAssigning(false)
    }
  }

  async function handleStatusChange(status: string) {
    setUpdating(true)
    try {
      await api.post(`/admin/cleaning/${id}/status`, { status })
      invalidate.cleaning()
      invalidate.stats()
    } finally {
      setUpdating(false)
      setStatusOpen(false)
    }
  }

  if (isLoading) {
    return (
      <>
        <SiteHeader title="청소 요청 상세" />
        <div className="flex min-h-[100dvh] items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
        </div>
      </>
    )
  }

  if (!cleaning) {
    return (
      <>
        <SiteHeader title="청소 요청 상세" />
        <div className="flex flex-1 items-center justify-center px-6 py-20 text-center text-[14px] text-ink-muted">
          청소 요청을 찾을 수 없어요.
        </div>
      </>
    )
  }

  const showManagerSection = ['confirmed', 'in_progress', 'completed'].includes(cleaning.status)
  const canAssign = cleaning.status === 'pending'
  const canChangeStatus = ['pending', 'confirmed', 'in_progress'].includes(cleaning.status)
  const propertySummary = [
    cleaning.propertyPyeong != null && `${cleaning.propertyPyeong}평`,
    cleaning.propertyLivingRooms != null && `거실 ${cleaning.propertyLivingRooms}`,
    cleaning.propertyBedrooms != null && `침실 ${cleaning.propertyBedrooms}`,
    cleaning.propertyBathrooms != null && `욕실 ${cleaning.propertyBathrooms}`,
  ].filter(Boolean)
  const cleaningPhotos = cleaning.cleaningPhotos.map((photo) => ({
    id: photo.id,
    signedUrl: photo.signedUrl ?? photo.thumbnailSignedUrl,
  }))

  return (
    <>
      <SiteHeader title="청소 요청 상세" />
      <div className="mx-auto flex w-full max-w-[720px] flex-1 flex-col gap-6 p-6 max-md:animate-fade-up-fast max-md:p-5">
        <div className="-mb-2 md:hidden">
          <MobileBackButton href="/admin/cleaning" mode="back" />
          <h1 className="mt-2 text-[22px] font-semibold text-ink">청소 요청 상세</h1>
        </div>

        <div>
          <CleaningStatusBadge status={cleaning.status as CleaningStatus} />
        </div>

        {cleaning.propertyName && (
          <section className="rounded-xl border border-outline-dim px-4 py-4">
            <div className="flex items-center gap-2.5">
              <HomeIcon size={16} className="shrink-0 text-ink-muted" strokeWidth={1.5} />
              <div className="text-[14px] text-ink">
                <span className="font-medium">{cleaning.propertyName}</span>
                {propertySummary.length > 0 && (
                  <span className="ml-1.5 text-[12px] text-ink-muted">
                    {propertySummary.join(' · ')}
                  </span>
                )}
              </div>
            </div>
            {cleaning.propertyAddress && (
              <div className="mt-2.5 flex items-start gap-2.5">
                <MapPinIcon size={16} className="mt-0.5 shrink-0 text-ink-muted" strokeWidth={1.5} />
                <span className="text-[13px] leading-relaxed text-ink-muted">
                  {cleaning.propertyAddress}
                  {cleaning.propertyAddressDetail ? ` ${cleaning.propertyAddressDetail}` : ''}
                </span>
              </div>
            )}
          </section>
        )}

        <section className="flex flex-col gap-2.5 rounded-xl border border-outline-dim px-4 py-4">
          <div className="flex items-center gap-2.5">
            <CalendarIcon size={16} className="shrink-0 text-ink-muted" strokeWidth={1.5} />
            <span className="text-[14px] text-ink">{formatDateLabel(cleaning.scheduledDate)}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <ClockIcon size={16} className="shrink-0 text-ink-muted" strokeWidth={1.5} />
            <span className="text-[14px] text-ink">
              {formatTimeKorean(cleaning.scheduledTime)}
              {cleaning.cleaningType === 'urgent' && (
                <span className="ml-1.5 text-[12px] text-brand">긴급</span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <CreditCardIcon size={16} className="shrink-0 text-ink-muted" strokeWidth={1.5} />
            <span className="text-[14px] text-ink">
              {cleaning.finalPrice.toLocaleString()}원
              {cleaning.discount > 0 && (
                <span className="ml-1.5 text-[12px] text-brand">
                  {cleaning.discount.toLocaleString()}원 할인
                </span>
              )}
            </span>
          </div>
          {cleaning.memo && (
            <div className="mt-0.5 border-t border-outline-dim pt-2.5">
              <p className="text-[13px] text-ink-muted">{cleaning.memo}</p>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-outline-dim px-4 py-4">
          <p className="text-[13px] font-medium text-ink-muted">호스트</p>
          <div className="mt-2.5 flex flex-col gap-2.5">
            <div className="flex items-center gap-2.5">
              <UserIcon size={16} className="shrink-0 text-ink-muted" strokeWidth={1.5} />
              <span className="text-[14px] text-ink">{cleaning.hostName || cleaning.hostEmail || '-'}</span>
            </div>
            {cleaning.hostPhone && (
              <div className="flex items-center gap-2.5">
                <PhoneIcon size={16} className="shrink-0 text-ink-muted" strokeWidth={1.5} />
                <a
                  href={`tel:${cleaning.hostPhone.replaceAll('-', '')}`}
                  className="text-[13px] text-ink-muted underline underline-offset-2 transition-colors hover:text-ink"
                >
                  {cleaning.hostPhone}
                </a>
              </div>
            )}
          </div>
        </section>

        {showManagerSection && cleaning.managerName && (
          <section className="overflow-hidden rounded-xl border border-outline-dim">
            <div className="flex items-start">
              <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden bg-surface-soft">
                {cleaning.managerAvatarThumbnailSignedUrl ? (
                  <div className="relative h-full w-full">
                    <ImageWithSkeleton
                      src={cleaning.managerAvatarThumbnailSignedUrl}
                      alt=""
                      fill
                      sizes="112px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <UserIcon size={18} strokeWidth={1.75} />
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2.5 px-4 py-4">
                <p className="text-[13px] font-medium text-ink-muted">배정 매니저</p>
                <div className="flex items-center gap-2.5">
                  <UserIcon size={16} className="shrink-0 text-ink-muted" strokeWidth={1.5} />
                  <span className="text-[14px] text-ink">{cleaning.managerName}</span>
                </div>
                {cleaning.managerPhone && (
                  <div className="flex items-center gap-2.5">
                    <PhoneIcon size={16} className="shrink-0 text-ink-muted" strokeWidth={1.5} />
                    <a
                      href={`tel:${cleaning.managerPhone.replaceAll('-', '')}`}
                      className="text-[13px] text-ink-muted underline underline-offset-2 transition-colors hover:text-ink"
                    >
                      {cleaning.managerPhone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {cleaning.status === 'completed' && (
          <ReadOnlyPhotoGallery
            title="청소 사진"
            photos={cleaningPhotos}
            emptyMessage="등록된 청소 사진이 없어요."
            titleClassName="mx-0"
            emptyMessageClassName="text-center"
            disableCarousel
            imageClassName="object-contain"
            useIntrinsicAspect
          />
        )}

        {canAssign && (
          <div className="flex flex-col gap-2 pt-2 md:flex-row md:justify-end">
            <button
              type="button"
              onClick={() => setAssignOpen(true)}
              className="inline-flex h-12 items-center justify-center rounded-lg bg-ink px-4 text-[15px] font-semibold text-white transition-all active:scale-[0.98] md:min-w-[140px]"
            >
              매니저 배정
            </button>
            {/* {canChangeStatus && (
              <button
                type="button"
                onClick={() => setStatusOpen(true)}
                className="inline-flex h-12 items-center justify-center rounded-lg border border-outline-strong px-4 text-[14px] font-medium text-ink transition-colors hover:bg-surface-soft md:min-w-[140px]"
              >
                상태 변경
              </button>
            )} */}
          </div>
        )}
      </div>

      <Drawer open={assignOpen} onOpenChange={setAssignOpen}>
        <DrawerContent>
          <div className="w-full px-5 pb-8">
            <DrawerHeader className="px-0">
              <DrawerTitle className="text-[18px] font-semibold text-ink">매니저 배정</DrawerTitle>
            </DrawerHeader>
            {activeManagers.length === 0 ? (
              <p className="text-[14px] text-ink-muted">등록된 매니저가 없어요</p>
            ) : (
              <div className="flex flex-col gap-2">
                {activeManagers.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setConfirmManager({ id: m.id, name: m.name, phone: m.phone })}
                    className="inline-flex h-12 items-center justify-center rounded-lg border border-outline-strong px-4 text-[14px] font-medium text-ink transition-colors hover:bg-surface-soft"
                  >
                    {m.name} ({m.phone})
                  </button>
                ))}
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer
        open={!!confirmManager}
        onOpenChange={(open) => {
          if (!open) setConfirmManager(null)
        }}
      >
        <DrawerContent>
          <div className="w-full px-5 pb-8">
            <DrawerHeader className="px-0">
              <DrawerTitle className="text-[18px] font-semibold text-ink">매니저 배정 확인</DrawerTitle>
            </DrawerHeader>
            {confirmManager && (
              <p className="mb-6 text-[14px] text-ink-muted">
                <span className="font-semibold text-ink">{confirmManager.name}</span>
                <span className="text-ink-muted"> ({confirmManager.phone})</span>
                {' '}매니저를 이 청소 요청에 배정할까요?
              </p>
            )}
            <div className="flex flex-col gap-2">
              <LoadingButton
                type="button"
                loading={assigning}
                loadingText="배정 중..."
                onClick={() => confirmManager && handleAssign(confirmManager.id)}
              >
                배정하기
              </LoadingButton>
              <button
                type="button"
                onClick={() => setConfirmManager(null)}
                disabled={assigning}
                className="h-12 rounded-lg text-[15px] font-semibold text-ink-muted transition-colors active:bg-surface-soft disabled:opacity-50"
              >
                닫기
              </button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer open={statusOpen} onOpenChange={setStatusOpen}>
        <DrawerContent>
          <div className="w-full px-5 pb-8">
            <DrawerHeader className="px-0">
              <DrawerTitle className="text-[18px] font-semibold text-ink">상태 변경</DrawerTitle>
            </DrawerHeader>
            <div className="flex flex-col gap-2">
              {(['confirmed', 'in_progress', 'completed', 'cancelled'] as CleaningStatus[]).map(
                (status) => (
                  <LoadingButton
                    key={status}
                    type="button"
                    variant="outline"
                    loading={updating}
                    onClick={() => handleStatusChange(status)}
                  >
                    {getCleaningStatusLabel(status)}
                  </LoadingButton>
                ),
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}
