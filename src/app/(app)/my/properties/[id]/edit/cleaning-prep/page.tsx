'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeftIcon } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { api, ApiError } from '@/lib/api-client'
import { usePropertyDetail, type CleaningPrepPhoto } from '@/lib/hooks/use-properties'
import { cn } from '@/lib/utils'
import { CompoundInput, FloatingInput } from '@/components/ui/floating-input'
import { LoadingButton } from '@/components/ui/loading-button'
import { AdminImageUploadField } from '@/components/admin-image-upload-field'
import type { UploadedAdminImage } from '@/lib/admin-image-upload'
import { uploadHostPropertyPhoto } from '@/lib/host-property-photo-upload'

const toUploadedImages = (photos: CleaningPrepPhoto[]): UploadedAdminImage[] =>
  photos.map((photo) => ({
    storagePath: photo.storagePath,
    thumbnailStoragePath: photo.thumbnailStoragePath,
    previewUrl: photo.thumbnailSignedUrl || photo.signedUrl || '',
  }))

export default function MyPropertyCleaningPrepEditPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const id = params.id as string
  const { data: property, isLoading } = usePropertyDetail(id)

  const [cleaningClosetLocation, setCleaningClosetLocation] = useState('')
  const [extraLinenLocation, setExtraLinenLocation] = useState('')
  const [trashDisposalLocation, setTrashDisposalLocation] = useState('')
  const [linenWashLocation, setLinenWashLocation] = useState<'in_house' | 'external' | null>(null)
  const [linenWashExternalAddress, setLinenWashExternalAddress] = useState('')
  const [linenWashExternalAddressDetail, setLinenWashExternalAddressDetail] = useState('')
  const [cleaningClosetPhotos, setCleaningClosetPhotos] = useState<UploadedAdminImage[]>([])
  const [extraLinenPhotos, setExtraLinenPhotos] = useState<UploadedAdminImage[]>([])
  const [trashDisposalPhotos, setTrashDisposalPhotos] = useState<UploadedAdminImage[]>([])
  const [linenWashExternalPhotos, setLinenWashExternalPhotos] = useState<UploadedAdminImage[]>([])

  const [initialized, setInitialized] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  if (property && !initialized) {
    setCleaningClosetLocation(property.cleaningClosetLocation ?? '')
    setExtraLinenLocation(property.extraLinenLocation ?? '')
    setTrashDisposalLocation(property.trashDisposalLocation ?? '')
    setLinenWashLocation(property.linenWashLocation)
    setLinenWashExternalAddress(property.linenWashExternalAddress ?? '')
    setLinenWashExternalAddressDetail(property.linenWashExternalAddressDetail ?? '')
    setCleaningClosetPhotos(toUploadedImages(property.cleaningPrepPhotos.cleaning_closet))
    setExtraLinenPhotos(toUploadedImages(property.cleaningPrepPhotos.extra_linen))
    setTrashDisposalPhotos(toUploadedImages(property.cleaningPrepPhotos.trash_disposal))
    setLinenWashExternalPhotos(toUploadedImages(property.cleaningPrepPhotos.linen_wash_external))
    setInitialized(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      await api.patch(`/properties/${id}`, {
        cleaningClosetLocation: cleaningClosetLocation.trim() || null,
        extraLinenLocation: extraLinenLocation.trim() || null,
        trashDisposalLocation: trashDisposalLocation.trim() || null,
        linenWashLocation,
        linenWashExternalAddress: linenWashExternalAddress.trim() || null,
        linenWashExternalAddressDetail: linenWashExternalAddressDetail.trim() || null,
        cleaningPrepPhotos: {
          cleaning_closet: cleaningClosetPhotos.map(({ storagePath, thumbnailStoragePath }) => ({
            storagePath,
            thumbnailStoragePath,
          })),
          extra_linen: extraLinenPhotos.map(({ storagePath, thumbnailStoragePath }) => ({
            storagePath,
            thumbnailStoragePath,
          })),
          trash_disposal: trashDisposalPhotos.map(({ storagePath, thumbnailStoragePath }) => ({
            storagePath,
            thumbnailStoragePath,
          })),
          linen_wash_external: linenWashExternalPhotos.map(({ storagePath, thumbnailStoragePath }) => ({
            storagePath,
            thumbnailStoragePath,
          })),
        },
      })
      await queryClient.invalidateQueries({ queryKey: ['properties'] })
      await queryClient.invalidateQueries({ queryKey: ['properties', id] })
      await queryClient.invalidateQueries({ queryKey: ['properties', 'detail', id] })
      router.back()
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : '수정 중 문제가 생겼어요. 다시 시도해주세요.')
      setSaving(false)
    }
  }

  const upload = (file: File) => uploadHostPropertyPhoto(id, 'cleaning-prep', file)

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
      </div>
    )
  }

  if (!property) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
        <p className="mb-4 text-[14px] text-ink-muted">숙소를 찾을 수 없어요</p>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-[13px] text-ink-muted underline underline-offset-2"
        >
          돌아가기
        </button>
      </div>
    )
  }

  return (
    <div className="animate-fade-up-fast bg-white flex flex-col px-6 pt-6 pb-10">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-3 -ml-4 inline-flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface-soft"
      >
        <ChevronLeftIcon size={32} />
      </button>
      <h1 className="text-[22px] font-semibold text-ink mb-6">청소 준비 정보 수정</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-7">
        <div className="space-y-3">
          <CompoundInput>
            <FloatingInput
              label="청소 도구함 위치"
              value={cleaningClosetLocation}
              onChange={(e) => setCleaningClosetLocation(e.target.value)}
              placeholder="예: 현관 신발장 오른쪽 하단"
              borderRadius="12px"
            />
          </CompoundInput>
          <AdminImageUploadField
            propertyId={id}
            kind="cleaning-prep"
            images={cleaningClosetPhotos}
            onChange={setCleaningClosetPhotos}
            title="청소 도구함 사진"
            description="실제 위치 사진을 여러 장 올리면 매니저가 빠르게 찾을 수 있어요."
            emptyText="아직 추가된 사진이 없어요."
            onError={setMessage}
            upload={upload}
          />
        </div>

        <div className="space-y-3">
          <CompoundInput>
            <FloatingInput
              label="침구류 여분 위치"
              value={extraLinenLocation}
              onChange={(e) => setExtraLinenLocation(e.target.value)}
              placeholder="예: 안방 붙박이장 맨 위칸"
              borderRadius="12px"
            />
          </CompoundInput>
          <AdminImageUploadField
            propertyId={id}
            kind="cleaning-prep"
            images={extraLinenPhotos}
            onChange={setExtraLinenPhotos}
            title="침구류 여분 사진"
            description="여분 침구가 보관된 모습을 사진으로 남겨주세요."
            emptyText="아직 추가된 사진이 없어요."
            onError={setMessage}
            upload={upload}
          />
        </div>

        <div className="space-y-3">
          <CompoundInput>
            <FloatingInput
              label="쓰레기 배출 장소"
              value={trashDisposalLocation}
              onChange={(e) => setTrashDisposalLocation(e.target.value)}
              placeholder="예: 건물 뒷편 분리수거장"
              borderRadius="12px"
            />
          </CompoundInput>
          <AdminImageUploadField
            propertyId={id}
            kind="cleaning-prep"
            images={trashDisposalPhotos}
            onChange={setTrashDisposalPhotos}
            title="쓰레기 배출 장소 사진"
            description="배출 장소와 표지판이 보이는 사진이면 좋아요."
            emptyText="아직 추가된 사진이 없어요."
            onError={setMessage}
            upload={upload}
          />
        </div>

        <div>
          <p className="text-[13px] font-semibold text-ink mb-2">침구류 세탁 위치 (선택)</p>
          <p className="text-[12px] text-ink-muted mb-2.5">설정해두면 청소 요청 시 침구류 세탁 옵션이 노출됩니다.</p>
          <div className="grid grid-cols-1 gap-2">
            {([
              { value: 'in_house' as const, label: '숙소 내 세탁기/건조기', price: 10000 },
              { value: 'external' as const, label: '외부 코인 세탁기/건조기', price: 20000 },
            ]).map((option) => {
              const selected = linenWashLocation === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setLinenWashLocation(selected ? null : option.value)}
                  className={cn(
                    'flex items-center justify-between rounded-xl border-[1.5px] px-4 py-3.5 text-left transition-colors',
                    selected ? 'border-ink bg-surface-soft' : 'border-outline-dim hover:bg-surface-soft',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'flex h-[18px] w-[18px] items-center justify-center rounded-full border-[1.5px] shrink-0 transition-colors',
                        selected ? 'border-ink' : 'border-outline-strong',
                      )}
                    >
                      {selected && <span className="h-[10px] w-[10px] rounded-full bg-ink" />}
                    </span>
                    <span className={cn('text-[14px]', selected ? 'font-semibold text-ink' : 'font-medium text-ink')}>
                      {option.label}
                    </span>
                  </div>
                  <span className="text-[13px] text-ink-muted">
                    +{option.price.toLocaleString()}원
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {linenWashLocation === 'external' && (
          <div className="space-y-3 rounded-xl border border-outline-dim p-4">
            <p className="text-[13px] font-semibold text-ink">외부 세탁소 정보</p>
            <CompoundInput>
              <FloatingInput
                label="기본 주소"
                value={linenWashExternalAddress}
                onChange={(e) => setLinenWashExternalAddress(e.target.value)}
                placeholder="예: 서울특별시 강남구 테헤란로 123"
                borderRadius="12px 12px 0 0"
              />
              <FloatingInput
                label="상세 주소 (선택)"
                value={linenWashExternalAddressDetail}
                onChange={(e) => setLinenWashExternalAddressDetail(e.target.value)}
                placeholder="예: 1층 코인세탁소"
                borderRadius="0 0 12px 12px"
              />
            </CompoundInput>
            <AdminImageUploadField
              propertyId={id}
              kind="cleaning-prep"
              images={linenWashExternalPhotos}
              onChange={setLinenWashExternalPhotos}
              title="외부 세탁소 사진"
              description="세탁소 외관·기기 사진을 올려두면 좋아요."
              emptyText="아직 추가된 사진이 없어요."
              onError={setMessage}
              upload={upload}
            />
          </div>
        )}

        {message && (
          <div className="rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-[13px] text-danger">
            {message}
          </div>
        )}

        <LoadingButton
          type="submit"
          variant="primary"
          loading={saving}
          loadingText="저장 중..."
        >
          저장하기
        </LoadingButton>
      </form>
    </div>
  )
}
