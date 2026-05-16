'use client'

import { ReadOnlyPhotoGallery } from '@/components/read-only-photo-gallery'

type InspectionStatus = 'normal' | 'caution' | 'defective'
type SpaceCategory = 'living_room' | 'bedroom' | 'bathroom' | 'veranda' | 'exterior' | 'other'
type AssetCategory =
  | 'lighting'
  | 'furniture'
  | 'bedding'
  | 'faucet'
  | 'boiler'
  | 'appliance'
  | 'lock'
  | 'ac'
  | 'washer'
  | 'dryer'
  | 'vent'
  | 'other'

type ReportPhoto = {
  id: string
  signedUrl: string | null
  thumbnailSignedUrl: string | null
}

type ReportAsset = {
  assetId: string
  status: InspectionStatus | null
  memo: string | null
  photos: ReportPhoto[]
}

type Asset = {
  id: string
  category: AssetCategory
  name: string
  location: string
}

type Space = {
  id: string
  category: SpaceCategory
  name: string
  pyeong: number
}

const SPACE_CATEGORY_LABELS: Record<SpaceCategory, string> = {
  living_room: '거실',
  bedroom: '침실',
  bathroom: '화장실',
  veranda: '베란다',
  exterior: '외부',
  other: '기타',
}

const ASSET_CATEGORY_LABELS: Record<AssetCategory, string> = {
  lighting: '조명',
  furniture: '가구',
  bedding: '침구/침대',
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

function SectionHeader({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-1">
      <div className="min-w-0 space-y-1">
        <p className="text-[18px] font-semibold tracking-[-0.01em] text-ink">{title}</p>
        {description && <p className="text-[13px] text-ink-muted">{description}</p>}
      </div>
    </div>
  )
}

function SummaryStat({
  label,
  value,
  dotClassName,
}: {
  label: string
  value: string
  dotClassName?: string
}) {
  return (
    <div className="rounded-2xl border border-outline-dim bg-white/90 px-4 py-3 shadow-[0_8px_18px_rgba(0,0,0,0.04)] backdrop-blur">
      <p className="flex items-center gap-1.5 text-[11px] font-medium text-ink-faint">
        {dotClassName && <span className={`size-1.5 rounded-full ${dotClassName}`} />}
        {label}
      </p>
      <p className="mt-1 text-[16px] font-semibold tracking-[-0.01em] text-ink">{value}</p>
    </div>
  )
}

function AssetReadOnlyCard({
  asset,
  reportAsset,
}: {
  asset: Asset
  reportAsset?: ReportAsset
}) {
  const statusMeta = reportAsset?.status ? STATUS_META[reportAsset.status] : null
  const memo = reportAsset?.memo?.trim()
  const photos = (reportAsset?.photos ?? []).map((photo) => ({
    id: photo.id,
    signedUrl: photo.signedUrl ?? photo.thumbnailSignedUrl,
  }))
  const locationDetail = asset.location.includes(' · ')
    ? asset.location.split(' · ').slice(1).join(' · ')
    : ''

  return (
    <div className="overflow-hidden rounded-[24px] border border-outline-dim bg-white shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
      <div className="px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[16px] font-semibold tracking-[-0.01em] text-ink">{asset.name}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
              {ASSET_CATEGORY_LABELS[asset.category]}
              {locationDetail ? ` · ${locationDetail}` : ''}
            </p>
          </div>
          <span className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusMeta?.className ?? 'border-outline-dim bg-surface-soft text-ink-faint'}`}>
            {statusMeta?.label ?? '미기록'}
          </span>
        </div>

        {memo ? (
          <div className="mt-4 rounded-2xl bg-surface-subtle px-4 py-3">
            <p className="text-[14px] leading-relaxed text-ink">{memo}</p>
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-outline-dim px-4 py-3 text-[13px] text-ink-faint">
            기록된 메모가 없어요.
          </div>
        )}
      </div>

      {photos.length > 0 && (
        <div className="border-t border-outline-dim bg-[#fcfcfc] px-4 pt-4 pb-4">
          <ReadOnlyPhotoGallery
            title="점검 사진"
            photos={photos}
            titleClassName="text-[14px] font-semibold"
            disableCarousel
            imageClassName="object-contain"
            useIntrinsicAspect
          />
        </div>
      )}
    </div>
  )
}

export function CleaningReportReadOnly({
  propertyName,
  spaces,
  assets,
  report,
  showHeader = true,
}: {
  propertyName: string | null
  spaces: Space[]
  assets: Asset[]
  report: {
    summaryMemo: string
    assets: ReportAsset[]
  }
  showHeader?: boolean
}) {
  const groupedSpaces = spaces.map((space) => ({
    ...space,
    assets: assets.filter((asset) => parseSpaceName(asset.location) === space.name),
  }))
  const summaryMemo = report.summaryMemo?.trim() ?? ''

  const spaceNames = new Set(spaces.map((space) => space.name))
  const uncategorizedAssets = assets.filter((asset) => !spaceNames.has(parseSpaceName(asset.location)))

  const reportCounts = report.assets.reduce(
    (acc, item) => {
      if (item.status === 'normal') acc.normal += 1
      if (item.status === 'caution') acc.caution += 1
      if (item.status === 'defective') acc.defective += 1
      return acc
    },
    { normal: 0, caution: 0, defective: 0 },
  )

  return (
    <>
      {showHeader && (
        <div className="mt-2">
          <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-ink">시설물 점검 리포트</h1>
          <p className="mt-1 text-[14px] text-ink-muted">{propertyName || '숙소'}</p>
        </div>
      )}

      <section className={showHeader ? 'mt-0' : 'mt-0'}>
        <div>
          <div className="mt-5 grid grid-cols-3 gap-2.5">
            <SummaryStat label="정상" value={`${reportCounts.normal}개`} dotClassName="bg-success/45" />
            <SummaryStat label="주의" value={`${reportCounts.caution}개`} dotClassName="bg-warning/45" />
            <SummaryStat label="불량" value={`${reportCounts.defective}개`} dotClassName="bg-danger/45" />
          </div>
          {summaryMemo && (
            <div className="mt-5">
              <div className="rounded-xl border border-outline-dim bg-white p-4">
                <p className="text-[12px] font-medium text-ink-muted">특이사항</p>
                <div className="my-4 border-t border-dashed border-outline-strong" />
                <p className="text-[14px] leading-relaxed text-ink">
                  {summaryMemo}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="mt-8 flex flex-col gap-7">
        {groupedSpaces.map((space) => (
          <section key={space.id} className="space-y-3">
            <SectionHeader
              title={space.name}
              description={`${SPACE_CATEGORY_LABELS[space.category]} · ${space.pyeong}평`}
            />

            {space.assets.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-outline-strong bg-surface-subtle px-4 py-6 text-center text-[14px] text-ink-muted">
                등록된 시설물이 없어요.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {space.assets.map((asset) => (
                  <AssetReadOnlyCard
                    key={asset.id}
                    asset={asset}
                    reportAsset={report.assets.find((item) => item.assetId === asset.id)}
                  />
                ))}
              </div>
            )}
          </section>
        ))}

        {uncategorizedAssets.length > 0 && (
          <section className="space-y-3">
            <SectionHeader
              title="기타 위치"
              description="공간과 연결되지 않은 시설물입니다."
            />
            <div className="flex flex-col gap-3">
              {uncategorizedAssets.map((asset) => (
                <AssetReadOnlyCard
                  key={asset.id}
                  asset={asset}
                  reportAsset={report.assets.find((item) => item.assetId === asset.id)}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  )
}
