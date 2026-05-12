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
import { RepairStatusBadge } from '@/components/repair-status-badge'
import type { RepairStatus } from '@/lib/hooks/use-repair'
import { api } from '@/lib/api-client'
import { formatDateLabel, formatTimeKorean, formatKoreanPhone } from '@/lib/utils'
import {
  useAdminRepairDetail,
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

export default function AdminRepairDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: repair, isLoading } = useAdminRepairDetail(id)
  const { data: allManagers = [] } = useAdminManagers()
  const invalidate = useInvalidateAdmin()
  const activeManagers = allManagers.filter((m) => m.isActive)

  const [assignOpen, setAssignOpen] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [confirmManager, setConfirmManager] = useState<{ id: string; name: string; phone: string } | null>(null)

  async function handleAssign(managerId: string) {
    setAssigning(true)
    try {
      await api.post(`/admin/repair/${id}/assign`, { managerId })
      invalidate.repair()
      invalidate.stats()
      setConfirmManager(null)
      setAssignOpen(false)
    } finally {
      setAssigning(false)
    }
  }

  if (isLoading) {
    return (
      <>
        <SiteHeader title="수리 요청 상세" />
        <div className="flex min-h-[100dvh] items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
        </div>
      </>
    )
  }

  if (!repair) {
    return (
      <>
        <SiteHeader title="수리 요청 상세" />
        <div className="flex flex-1 items-center justify-center px-6 py-20 text-center text-[14px] text-ink-muted">
          수리 요청을 찾을 수 없어요.
        </div>
      </>
    )
  }

  const showManagerSection = !!repair.managerName
  const canAssign = !repair.managerId && !['completed', 'cancelled'].includes(repair.status)
  const displayDate = repair.scheduledDate ?? repair.preferredScheduledDate
  const displayTime = repair.scheduledTime ?? repair.preferredScheduledTime
  const requestPhotos = repair.photos.map((photo) => ({
    id: photo.id,
    signedUrl: photo.signedUrl ?? photo.thumbnailSignedUrl,
  }))
  const reportPhotos = (repair.report?.photos ?? []).map((photo) => ({
    id: photo.id,
    signedUrl: photo.signedUrl ?? photo.thumbnailSignedUrl,
  }))

  return (
    <>
      <SiteHeader title="수리 요청 상세" />
      <div className="mx-auto flex w-full max-w-[720px] flex-1 flex-col gap-6 p-6 max-md:animate-fade-up-fast max-md:p-5">
        <div className="-mb-2 md:hidden">
          <MobileBackButton href="/admin/repair" mode="back" />
          <h1 className="mt-2 text-[22px] font-semibold text-ink">수리 요청 상세</h1>
        </div>

        <div>
          <RepairStatusBadge status={repair.status as RepairStatus} />
        </div>

        {repair.propertyName && (
          <section className="rounded-xl border border-outline-dim px-4 py-4">
            <div className="flex items-center gap-2.5">
              <HomeIcon size={16} className="shrink-0 text-ink-muted" strokeWidth={1.5} />
              <div className="text-[14px] text-ink">
                <span className="font-medium">{repair.propertyName}</span>
              </div>
            </div>
            {repair.propertyAddress && (
              <div className="mt-2.5 flex items-start gap-2.5">
                <MapPinIcon size={16} className="mt-0.5 shrink-0 text-ink-muted" strokeWidth={1.5} />
                <span className="text-[13px] leading-relaxed text-ink-muted">
                  {repair.propertyAddress}
                  {repair.propertyAddressDetail ? ` ${repair.propertyAddressDetail}` : ''}
                </span>
              </div>
            )}
          </section>
        )}

        <section className="flex flex-col gap-2.5 rounded-xl border border-outline-dim px-4 py-4">
          <div className="flex items-center gap-2.5">
            <CalendarIcon size={16} className="shrink-0 text-ink-muted" strokeWidth={1.5} />
            <span className="text-[14px] text-ink">
              {formatDateLabel(displayDate)}
              {!repair.scheduledDate && (
                <span className="ml-1.5 text-[12px] text-ink-muted">(호스트 희망)</span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <ClockIcon size={16} className="shrink-0 text-ink-muted" strokeWidth={1.5} />
            <span className="text-[14px] text-ink">{formatTimeKorean(displayTime)}</span>
          </div>
          {repair.quotedCost != null && (
            <div className="flex items-center gap-2.5">
              <CreditCardIcon size={16} className="shrink-0 text-ink-muted" strokeWidth={1.5} />
              <span className="text-[14px] text-ink">
                {repair.quotedCost.toLocaleString()}원
              </span>
            </div>
          )}
          <div className="mt-0.5 border-t border-outline-dim pt-2.5">
            <p className="text-[13px] leading-relaxed text-ink-muted">{repair.description}</p>
            {repair.quoteNote && (
              <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
                {repair.quoteNote}
              </p>
            )}
          </div>
        </section>

        {requestPhotos.length > 0 && (
          <ReadOnlyPhotoGallery
            title="요청 사진"
            photos={requestPhotos}
            emptyMessage="등록된 요청 사진이 없어요."
            titleClassName="mx-0"
            emptyMessageClassName="text-center"
            disableCarousel
            imageClassName="object-contain"
            useIntrinsicAspect
          />
        )}

        <section className="rounded-xl border border-outline-dim px-4 py-4">
          <p className="text-[13px] font-medium text-ink-muted">호스트</p>
          <div className="mt-2.5 flex flex-col gap-2.5">
            <div className="flex items-center gap-2.5">
              <UserIcon size={16} className="shrink-0 text-ink-muted" strokeWidth={1.5} />
              <span className="text-[14px] text-ink">{repair.hostName || repair.hostEmail || '-'}</span>
            </div>
            {repair.hostPhone && (
              <div className="flex items-center gap-2.5">
                <PhoneIcon size={16} className="shrink-0 text-ink-muted" strokeWidth={1.5} />
                <a
                  href={`tel:${repair.hostPhone.replace(/\D/g, '')}`}
                  className="text-[13px] text-ink-muted underline underline-offset-2 transition-colors hover:text-ink"
                >
                  {formatKoreanPhone(repair.hostPhone)}
                </a>
              </div>
            )}
          </div>
        </section>

        {showManagerSection && (
          <section className="overflow-hidden rounded-xl border border-outline-dim">
            <div className="flex items-start">
              <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden bg-surface-soft">
                {repair.managerAvatarThumbnailSignedUrl ? (
                  <div className="relative h-full w-full">
                    <ImageWithSkeleton
                      src={repair.managerAvatarThumbnailSignedUrl}
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
                  <span className="text-[14px] text-ink">{repair.managerName}</span>
                </div>
                {repair.managerPhone && (
                  <div className="flex items-center gap-2.5">
                    <PhoneIcon size={16} className="shrink-0 text-ink-muted" strokeWidth={1.5} />
                    <a
                      href={`tel:${repair.managerPhone.replace(/\D/g, '')}`}
                      className="text-[13px] text-ink-muted underline underline-offset-2 transition-colors hover:text-ink"
                    >
                      {formatKoreanPhone(repair.managerPhone)}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {repair.report && (
          <section className="rounded-xl border border-outline-dim px-4 py-4">
            <p className="text-[13px] font-medium text-ink-muted">조치 보고서</p>
            <p className="mt-2.5 text-[14px] leading-relaxed text-ink">{repair.report.actionNotes}</p>
            {repair.report.additionalNotes && (
              <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
                {repair.report.additionalNotes}
              </p>
            )}
          </section>
        )}

        {reportPhotos.length > 0 && (
          <ReadOnlyPhotoGallery
            title="조치 사진"
            photos={reportPhotos}
            emptyMessage="등록된 조치 사진이 없어요."
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
                    {m.name} ({formatKoreanPhone(m.phone)})
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
                <span className="text-ink-muted"> ({formatKoreanPhone(confirmManager.phone)})</span>
                {' '}매니저를 이 수리 요청에 배정할까요?
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
    </>
  )
}
