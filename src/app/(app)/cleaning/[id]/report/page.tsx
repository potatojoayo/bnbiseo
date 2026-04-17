'use client'

import { useParams } from 'next/navigation'
import { MobileBackButton } from '@/components/mobile-back-button'
import { ReadOnlyPhotoGallery } from '@/components/read-only-photo-gallery'
import { useCleaningReport, type CleaningRequestReport } from '@/lib/hooks/use-cleaning'

type InspectionStatus = NonNullable<CleaningRequestReport['report']['assets'][number]['status']>

const SPACE_CATEGORY_LABELS: Record<CleaningRequestReport['spaces'][number]['category'], string> = {
  living_room: '거실',
  bedroom: '침실',
  bathroom: '화장실',
}

const ASSET_CATEGORY_LABELS: Record<CleaningRequestReport['assets'][number]['category'], string> = {
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

const STATUS_META: Record<InspectionStatus, { label: string; className: string }> = {
  normal: { label: '정상', className: 'border-success bg-success-soft text-success' },
  caution: { label: '주의', className: 'border-warning bg-warning-soft text-warning' },
  defective: { label: '불량', className: 'border-danger-border bg-danger-soft text-danger' },
}

function parseSpaceName(location: string) {
  return location.split(' · ')[0]?.trim() ?? location
}

export default function CleaningReportPage() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading } = useCleaningReport(id)

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100dvh-80px)] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex min-h-[calc(100dvh-80px)] items-center justify-center px-6 text-center text-[14px] text-ink-muted">
        점검 리포트를 불러오지 못했어요.
      </div>
    )
  }

  const groupedSpaces = data.spaces.map((space) => ({
    ...space,
    assets: data.assets.filter((asset) => parseSpaceName(asset.location) === space.name),
  }))

  const spaceNames = new Set(data.spaces.map((space) => space.name))
  const uncategorizedAssets = data.assets.filter((asset) => !spaceNames.has(parseSpaceName(asset.location)))

  return (
    <div className="animate-fade-up-fast flex min-h-[100svh] flex-col px-6 pt-6 pb-10">
      <div className="-mb-1">
        <MobileBackButton href={`/cleaning/${id}`} mode="back" />
      </div>

      <div className="mt-2">
        <h1 className="text-[22px] font-semibold text-ink">시설물 점검 리포트</h1>
        <p className="mt-1 text-[14px] text-ink-muted">{data.propertyName || '숙소'}</p>
      </div>

      <section className="mt-7 space-y-3">
        <p className="px-1 text-[13px] font-medium text-ink-muted">전체 특이사항</p>
        <div className="min-h-28 rounded-xl border border-outline-dim bg-surface-soft px-4 py-3 text-[16px] leading-relaxed text-ink">
          {data.report.summaryMemo?.trim() || '전달된 특이사항이 없어요.'}
        </div>
      </section>

      <div className="mt-7 flex flex-col gap-7">
        {groupedSpaces.map((space) => (
          <section key={space.id} className="space-y-4">
            <div className="space-y-1 px-1">
              <p className="text-[16px] font-semibold text-ink">{space.name}</p>
              <p className="text-[13px] text-ink-muted">
                {space.floor}층 · {SPACE_CATEGORY_LABELS[space.category]} · {space.pyeong}평
              </p>
            </div>

            {space.assets.length === 0 ? (
              <div className="rounded-xl border border-dashed border-outline-strong px-4 py-6 text-center text-[14px] text-ink-muted">
                등록된 시설물이 없어요.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {space.assets.map((asset) => {
                  const reportAsset = data.report.assets.find((item) => item.assetId === asset.id)
                  const statusMeta = reportAsset?.status ? STATUS_META[reportAsset.status] : null

                  return (
                    <div key={asset.id} className="rounded-xl border border-outline-dim px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-[15px] font-semibold text-ink">{asset.name}</p>
                          <p className="text-[13px] text-ink-muted">
                            {ASSET_CATEGORY_LABELS[asset.category]}
                            {asset.location.includes(' · ') ? ` · ${asset.location.split(' · ').slice(1).join(' · ')}` : ''}
                          </p>
                        </div>
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusMeta?.className ?? 'border-outline-dim bg-surface-soft text-ink-faint'}`}>
                          {statusMeta?.label ?? '미기록'}
                        </span>
                      </div>

                      <div className="mt-3 rounded-xl bg-surface-soft px-4 py-3 text-[14px] leading-relaxed text-ink">
                        {reportAsset?.memo?.trim() || '메모가 없어요.'}
                      </div>

                      {(reportAsset?.photos.length ?? 0) > 0 && (
                        <ReadOnlyPhotoGallery
                          title="점검 사진"
                          photos={(reportAsset?.photos ?? []).map((photo) => ({
                            id: photo.id,
                            signedUrl: photo.signedUrl ?? photo.thumbnailSignedUrl,
                          }))}
                          className="mt-4"
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        ))}

        {uncategorizedAssets.length > 0 && (
          <section className="space-y-4">
            <div className="space-y-1 px-1">
              <p className="text-[16px] font-semibold text-ink">기타 위치</p>
              <p className="text-[13px] text-ink-muted">공간과 연결되지 않은 시설물입니다.</p>
            </div>

            <div className="flex flex-col gap-3">
              {uncategorizedAssets.map((asset) => {
                const reportAsset = data.report.assets.find((item) => item.assetId === asset.id)
                const statusMeta = reportAsset?.status ? STATUS_META[reportAsset.status] : null

                return (
                  <div key={asset.id} className="rounded-xl border border-outline-dim px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-[15px] font-semibold text-ink">{asset.name}</p>
                        <p className="text-[13px] text-ink-muted">
                          {ASSET_CATEGORY_LABELS[asset.category]} · {asset.location}
                        </p>
                      </div>
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusMeta?.className ?? 'border-outline-dim bg-surface-soft text-ink-faint'}`}>
                        {statusMeta?.label ?? '미기록'}
                      </span>
                    </div>

                    <div className="mt-3 rounded-xl bg-surface-soft px-4 py-3 text-[14px] leading-relaxed text-ink">
                      {reportAsset?.memo?.trim() || '메모가 없어요.'}
                    </div>

                    {(reportAsset?.photos.length ?? 0) > 0 && (
                      <ReadOnlyPhotoGallery
                        title="점검 사진"
                        photos={(reportAsset?.photos ?? []).map((photo) => ({
                          id: photo.id,
                          signedUrl: photo.signedUrl ?? photo.thumbnailSignedUrl,
                        }))}
                        className="mt-4"
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
