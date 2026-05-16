'use client'

import { useParams } from 'next/navigation'
import { MobileBackButton } from '@/components/mobile-back-button'
import { AssetCard } from '@/components/asset-card'
import { ImageWithSkeleton } from '@/components/ui/image-with-skeleton'
import {
  useManagerCleaning,
  type ManagerCleaningDetail,
} from '@/lib/hooks/use-manager'

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

function isAssetLinkedToSpace(location: string, spaceName: string) {
  return location === spaceName || location.startsWith(`${spaceName} · `)
}

export default function ManagerCleaningSpaceDetailPage() {
  const { id, spaceId } = useParams<{ id: string; spaceId: string }>()
  const { data, isLoading } = useManagerCleaning(id)

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100dvh-80px)] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
      </div>
    )
  }

  const space = data?.spaces.find((item) => item.id === spaceId)
  if (!space || !data) {
    return (
      <div className="flex min-h-[calc(100dvh-80px)] items-center justify-center px-6 text-center text-[14px] text-ink-muted">
        공간 정보를 찾을 수 없어요.
      </div>
    )
  }

  const linkedAssets = data.assets.filter((asset) => isAssetLinkedToSpace(asset.location, space.name))

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-1 flex-col gap-6 p-6 animate-fade-up-fast max-md:p-5">
      <div className="-mb-1">
        <MobileBackButton href={`/manager/cleanings/${id}`} mode="back" />
        <h1 className="mt-2 text-[22px] font-semibold text-ink">{space.name}</h1>
      </div>

      <section className="space-y-2">
        <p className="text-[14px] text-ink-muted">
          {space.floor}층 · {SPACE_CATEGORY_LABELS[space.category]} · {space.pyeong}평
        </p>
        {space.notes && (
          <p className="text-[14px] leading-relaxed text-ink-muted">{space.notes}</p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        {space.photos.length > 0 ? (
          space.photos.map((photo) => (
            <div
              key={photo.id}
              className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-surface-soft"
            >
              {photo.signedUrl ? (
                <ImageWithSkeleton
                  src={photo.signedUrl}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 720px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[13px] text-ink-faint">사진 없음</div>
              )}
            </div>
          ))
        ) : (
          <div className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-surface-soft text-[13px] rounded-2xl text-ink-faint">
            사진 없음
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-[16px] font-semibold text-ink">등록된 시설물</p>
          <p className="mt-1 text-[13px] text-ink-muted">이 공간에 등록된 시설물을 함께 확인할 수 있어요.</p>
        </div>

        {linkedAssets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-outline-strong px-4 py-6 text-center text-[14px] text-ink-muted">
            등록된 시설물이 없어요.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {linkedAssets.map((asset) => (
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
    </div>
  )
}
