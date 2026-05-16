'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  BanknoteIcon,
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
import type { AdminCleaningDetail, AdminCleaningPhoto } from '@/lib/hooks/use-admin'
import {
  CleaningStatusBadge,
  getCleaningStatusLabel,
  type CleaningStatus,
} from '@/components/cleaning-status-badge'
import { api } from '@/lib/api-client'
import { formatDateLabel, formatTimeKorean, formatKoreanPhone } from '@/lib/utils'
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

const ADMIN_SPACE_CATEGORY_LABELS: Record<AdminCleaningDetail['cleaningPhotosBySpace'][number]['category'], string> = {
  living_room: '거실',
  bedroom: '침실',
  bathroom: '화장실',
  veranda: '베란다',
  exterior: '외부',
  other: '기타',
}

function AdminSpacePhotoGrid({ photos, emptyText }: { photos: AdminCleaningPhoto[]; emptyText: string }) {
  if (photos.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-outline-strong px-3 py-4 text-center text-[12px] text-ink-muted">
        {emptyText}
      </div>
    )
  }
  return (
    <div className="grid grid-cols-3 gap-2">
      {photos.map((photo) => {
        const url = photo.thumbnailSignedUrl || photo.signedUrl
        return (
          <div key={photo.id} className="relative aspect-square overflow-hidden rounded-lg bg-surface-soft">
            {url ? (
              <ImageWithSkeleton src={url} alt="" fill sizes="(max-width: 768px) 33vw, 240px" className="object-cover" />
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

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
  const [bankTransferOpen, setBankTransferOpen] = useState(false)
  const [confirmingBankTransfer, setConfirmingBankTransfer] = useState(false)

  async function handleConfirmBankTransfer() {
    setConfirmingBankTransfer(true)
    try {
      await api.post(`/admin/cleaning/${id}/confirm-bank-transfer`)
      invalidate.cleaning()
      invalidate.stats()
      setBankTransferOpen(false)
    } finally {
      setConfirmingBankTransfer(false)
    }
  }

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
  const isBankTransferPending =
    cleaning.status === 'pending_payment' && cleaning.paymentMethod === 'bank_transfer'
  const canChangeStatus = ['pending', 'confirmed', 'in_progress'].includes(cleaning.status)
  const propertySummary = [
    cleaning.propertyPyeong != null && `${cleaning.propertyPyeong}평`,
    cleaning.propertyLivingRooms != null && `거실 ${cleaning.propertyLivingRooms}`,
    cleaning.propertyBedrooms != null && `침실 ${cleaning.propertyBedrooms}`,
    cleaning.propertyBathrooms != null && `욕실 ${cleaning.propertyBathrooms}`,
  ].filter(Boolean)
  const photoSpaces = cleaning.cleaningPhotosBySpace
  const showBeforePhotos = cleaning.status === 'in_progress' || cleaning.status === 'completed'
  const showAfterPhotos = cleaning.status === 'completed'

  return (
    <>
      <SiteHeader title="청소 요청 상세" />
      <div className="mx-auto flex w-full max-w-[720px] flex-1 flex-col gap-6 p-6 max-md:animate-fade-up-fast max-md:p-5">
        <div className="-mb-2 md:hidden">
          <MobileBackButton href="/admin/cleaning" mode="back" />
          <h1 className="mt-2 text-[22px] font-semibold text-ink">청소 요청 상세</h1>
        </div>

        <div>
          <CleaningStatusBadge
            status={cleaning.status as CleaningStatus}
            label={isBankTransferPending ? '입금 대기' : undefined}
          />
        </div>

        {isBankTransferPending && (
          <section className="rounded-2xl border border-outline-dim bg-white px-4 py-4 shadow-[0_10px_28px_rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-2 mb-2">
              <BanknoteIcon size={18} className="shrink-0 text-ink" strokeWidth={1.75} />
              <p className="text-[14px] font-semibold text-ink">무통장 입금 대기 중</p>
            </div>
            <p className="text-[13px] text-ink-muted leading-relaxed">
              호스트의 입금 확인 후 아래 버튼으로 처리해주세요. 처리 시 매니저 풀에 노출되고 호스트에게 알림이 발송됩니다.
            </p>
            <button
              type="button"
              onClick={() => setBankTransferOpen(true)}
              className="mt-3 inline-flex h-10 items-center justify-center rounded-lg bg-ink px-4 text-[13px] font-semibold text-white transition-all active:scale-[0.98]"
            >
              입금 확인 처리
            </button>
          </section>
        )}

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
              <span className="ml-1.5 text-[12px] text-ink-muted">
                · {cleaning.cleaningPlan === 'regular' ? '정기' : '단건'}
              </span>
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
              <span className="ml-1.5 text-[12px] text-ink-muted">
                · {cleaning.paymentMethod === 'bank_transfer' ? '무통장 입금' : '카드/간편 결제'}
                {cleaning.paidAt && ' · 입금 확인'}
              </span>
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
                  href={`tel:${cleaning.hostPhone.replace(/\D/g, '')}`}
                  className="text-[13px] text-ink-muted underline underline-offset-2 transition-colors hover:text-ink"
                >
                  {formatKoreanPhone(cleaning.hostPhone)}
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
                      href={`tel:${cleaning.managerPhone.replace(/\D/g, '')}`}
                      className="text-[13px] text-ink-muted underline underline-offset-2 transition-colors hover:text-ink"
                    >
                      {formatKoreanPhone(cleaning.managerPhone)}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {showBeforePhotos && photoSpaces.length > 0 && (
          <section className="space-y-4">
            <div>
              <p className="text-[16px] font-semibold text-ink">공간별 청소 사진</p>
              <p className="mt-1 text-[12px] text-ink-muted">
                {showAfterPhotos ? '매니저가 촬영한 공간별 청소 전/후 사진입니다.' : '매니저가 도착해 촬영한 청소 전 현황입니다.'}
              </p>
            </div>
            <div className="flex flex-col gap-4">
              {photoSpaces.map((space) => (
                <div key={space.spaceId} className="rounded-xl border border-outline-dim p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[15px] font-semibold text-ink">{space.spaceName}</p>
                    <span className="text-[11px] font-medium text-ink-muted">
                      {ADMIN_SPACE_CATEGORY_LABELS[space.category]}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[12px] font-semibold text-ink-muted tracking-wider uppercase">청소 전</p>
                    <AdminSpacePhotoGrid photos={space.before} emptyText="청소 전 사진이 없어요." />
                  </div>
                  {showAfterPhotos && (
                    <div className="space-y-2">
                      <p className="text-[12px] font-semibold text-ink-muted tracking-wider uppercase">청소 후</p>
                      <AdminSpacePhotoGrid photos={space.after} emptyText="청소 후 사진이 없어요." />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
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

      <Drawer open={bankTransferOpen} onOpenChange={setBankTransferOpen}>
        <DrawerContent>
          <div className="w-full px-5 pb-8">
            <DrawerHeader className="px-0">
              <DrawerTitle className="text-[18px] font-semibold text-ink">입금 확인 처리</DrawerTitle>
            </DrawerHeader>
            <p className="mb-6 text-[14px] text-ink-muted leading-relaxed">
              호스트가 <span className="font-semibold text-ink">{cleaning.finalPrice.toLocaleString()}원</span>을 입금했음을 확인했나요?
              확인 시 청소 요청이 정식 접수되고 매니저 풀에 노출됩니다.
            </p>
            <div className="flex flex-col gap-2">
              <LoadingButton
                type="button"
                loading={confirmingBankTransfer}
                loadingText="처리 중..."
                onClick={handleConfirmBankTransfer}
              >
                입금 확인 완료
              </LoadingButton>
              <button
                type="button"
                onClick={() => setBankTransferOpen(false)}
                disabled={confirmingBankTransfer}
                className="h-12 rounded-lg text-[15px] font-semibold text-ink-muted transition-colors active:bg-surface-soft disabled:opacity-50"
              >
                닫기
              </button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

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
