'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { MobileBackButton } from '@/components/mobile-back-button'
import { ManagerReportPhotoField } from '@/components/manager-report-photo-field'
import { api, ApiError } from '@/lib/api-client'
import { useManagerCleaningReport, type ManagerCleaningReport } from '@/lib/hooks/use-manager'
import { cn } from '@/lib/utils'
import { type UploadedManagerReportImage } from '@/lib/manager-report-image-upload'

type InspectionStatus = 'normal' | 'caution' | 'defective'

const SPACE_CATEGORY_LABELS: Record<ManagerCleaningReport['spaces'][number]['category'], string> = {
  living_room: '거실',
  bedroom: '침실',
  bathroom: '화장실',
}

const ASSET_CATEGORY_LABELS: Record<ManagerCleaningReport['assets'][number]['category'], string> = {
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

const STATUS_OPTIONS: Array<{
  value: InspectionStatus
  label: string
  activeClassName: string
}> = [
  { value: 'normal', label: '정상', activeClassName: 'border-success bg-success-soft text-success' },
  { value: 'caution', label: '주의', activeClassName: 'border-warning bg-warning-soft text-warning' },
  { value: 'defective', label: '불량', activeClassName: 'border-danger-border bg-danger-soft text-danger' },
]

type AssetDraft = {
  status: InspectionStatus | null
  memo: string
  photos: UploadedManagerReportImage[]
}

function parseSpaceName(location: string) {
  return location.split(' · ')[0]?.trim() ?? location
}

export default function ManagerCleaningReportPage() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading } = useManagerCleaningReport(id)

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

  return (
    <ManagerCleaningReportEditor key={data.id} id={id} data={data} />
  )
}

function ManagerCleaningReportEditor({
  id,
  data,
}: {
  id: string
  data: ManagerCleaningReport
}) {
  const isReadOnly = data.status === 'completed'
  const queryClient = useQueryClient()
  const [summaryMemo, setSummaryMemo] = useState(data.report.summaryMemo ?? '')
  const [assetDrafts, setAssetDrafts] = useState<Record<string, AssetDraft>>(
    data.assets.reduce<Record<string, AssetDraft>>((acc, asset) => {
      const saved = data.report.assets.find((item) => item.assetId === asset.id)
      acc[asset.id] = {
        status: saved?.status ?? null,
        memo: saved?.memo ?? '',
        photos: (saved?.photos ?? []).map((photo) => ({
          storagePath: photo.storagePath,
          thumbnailStoragePath: photo.thumbnailStoragePath,
          previewUrl: photo.thumbnailSignedUrl || photo.signedUrl || '',
        })),
      }
      return acc
    }, {}),
  )
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const readyToAutosaveRef = useRef(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const groupedSpaces = useMemo(() => (
    data.spaces.map((space) => ({
      ...space,
      assets: data.assets.filter((asset) => parseSpaceName(asset.location) === space.name),
    }))
  ), [data])

  const uncategorizedAssets = useMemo(() => {
    const spaceNames = new Set(data.spaces.map((space) => space.name))
    return data.assets.filter((asset) => !spaceNames.has(parseSpaceName(asset.location)))
  }, [data])

  useEffect(() => {
    if (isReadOnly) return

    const frame = requestAnimationFrame(() => {
      readyToAutosaveRef.current = true
    })

    return () => {
      cancelAnimationFrame(frame)
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [isReadOnly])

  useEffect(() => {
    if (saveState !== 'saved') return

    const timeout = setTimeout(() => setSaveState('idle'), 1500)
    return () => clearTimeout(timeout)
  }, [saveState])

  async function saveDraft(nextSummaryMemo: string, nextAssetDrafts: Record<string, AssetDraft>) {
    try {
      const saved = await api.post<{ success: true; report: ManagerCleaningReport['report'] | null }>(`/manager/cleanings/${id}/report/draft`, {
        summaryMemo: nextSummaryMemo,
        assets: data.assets.map((asset) => ({
          assetId: asset.id,
          status: nextAssetDrafts[asset.id]?.status ?? null,
          memo: nextAssetDrafts[asset.id]?.memo?.trim() || null,
          photos: nextAssetDrafts[asset.id]?.photos.map((photo) => ({
            storagePath: photo.storagePath,
            thumbnailStoragePath: photo.thumbnailStoragePath,
          })) ?? [],
        })),
      })
      queryClient.setQueryData<ManagerCleaningReport>(
        ['manager', 'cleanings', 'report', id],
        (previous) => previous
          ? {
              ...previous,
              report: {
                summaryMemo: saved.report?.summaryMemo ?? '',
                assets: (saved.report?.assets ?? []).map((asset) => ({
                  ...asset,
                  photos: asset.photos.map((photo) => {
                    const localPhoto = nextAssetDrafts[asset.assetId]?.photos.find(
                      (item) => item.storagePath === photo.storagePath,
                    )

                    return {
                      ...photo,
                      signedUrl: photo.signedUrl ?? localPhoto?.previewUrl ?? null,
                      thumbnailSignedUrl: photo.thumbnailSignedUrl ?? localPhoto?.previewUrl ?? null,
                    }
                  }),
                })),
              },
            }
          : previous,
      )
      setSaveState('saved')
    } catch (error) {
      setSaveState('idle')
      if (error instanceof ApiError) {
        toast.error(error.message)
      } else {
        toast.error('임시 저장하지 못했어요.')
      }
    }
  }

  function updateSummaryMemo(value: string) {
    if (isReadOnly) return
    setSaveState('saving')
    setSummaryMemo(value)

    if (!readyToAutosaveRef.current) return

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      void saveDraft(value, assetDrafts)
    }, 600)
  }

  function updateAssetDraft(assetId: string, next: Partial<AssetDraft>, options?: { immediate?: boolean }) {
    if (isReadOnly) return
    const nextAssetDrafts = {
      ...assetDrafts,
      [assetId]: {
        status: assetDrafts[assetId]?.status ?? null,
        memo: assetDrafts[assetId]?.memo ?? '',
        photos: assetDrafts[assetId]?.photos ?? [],
        ...next,
      },
    }

    setSaveState('saving')
    setAssetDrafts(nextAssetDrafts)

    if (!readyToAutosaveRef.current) return

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (options?.immediate) {
      void saveDraft(summaryMemo, nextAssetDrafts)
      return
    }

    debounceRef.current = setTimeout(() => {
      void saveDraft(summaryMemo, nextAssetDrafts)
    }, 600)
  }

  return (
    <div className="animate-fade-up-fast flex min-h-[100svh] flex-col px-6 pt-6 pb-10">
      <div className="-mb-1">
        <MobileBackButton href={`/manager/cleanings/${id}`} mode="back" />
      </div>

      <div className="mt-2 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold text-ink">
            {isReadOnly ? '시설물 점검 리포트' : '시설물 점검 리포트 작성'}
          </h1>
          <p className="mt-1 text-[14px] text-ink-muted">{data.propertyName || '숙소'}</p>
        </div>
        {!isReadOnly && (
          <div
            className={cn(
              'pt-1 transition-all duration-200',
              saveState === 'saving' ? 'opacity-100 scale-100' : 'pointer-events-none opacity-0 scale-95',
            )}
          >
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
          </div>
        )}
      </div>

      <section className="mt-7 space-y-3">
        <p className="px-1 text-[13px] font-medium text-ink-muted">전체 특이사항</p>
        <textarea
          value={summaryMemo}
          onChange={(e) => updateSummaryMemo(e.target.value)}
          readOnly={isReadOnly}
          placeholder={isReadOnly ? '' : '청소 중 확인한 전반적인 특이사항을 남겨주세요'}
          className={cn(
            'min-h-28 w-full rounded-xl border border-outline-dim px-4 py-3 text-[16px] text-ink outline-none placeholder:text-ink-faint',
            isReadOnly && 'bg-surface-soft',
          )}
        />
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
                  const draft = assetDrafts[asset.id] ?? { status: null, memo: '', photos: [] }
                  const showPhotoField = draft.status === 'caution' || draft.status === 'defective' || draft.photos.length > 0

                  return (
                    <div key={asset.id} className="rounded-xl border border-outline-dim px-4 py-4">
                      <div className="space-y-1">
                        <p className="text-[15px] font-semibold text-ink">{asset.name}</p>
                        <p className="text-[13px] text-ink-muted">
                          {ASSET_CATEGORY_LABELS[asset.category]}
                          {asset.location.includes(' · ') ? ` · ${asset.location.split(' · ').slice(1).join(' · ')}` : ''}
                        </p>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2">
                        {STATUS_OPTIONS.map((option) => {
                          const active = draft.status === option.value
                          return (
                            <button
                            key={option.value}
                            type="button"
                            onClick={() =>
                              updateAssetDraft(asset.id, {
                                status: draft.status === option.value ? null : option.value,
                              }, { immediate: true })}
                            disabled={isReadOnly}
                              className={cn(
                                'h-10 rounded-lg border border-outline-dim text-[13px] font-medium text-ink-muted transition-colors active:scale-[0.98]',
                                active && option.activeClassName,
                                isReadOnly && 'cursor-default active:scale-100',
                              )}
                            >
                              {option.label}
                            </button>
                          )
                        })}
                      </div>

                      <textarea
                        value={draft.memo}
                        onChange={(e) => updateAssetDraft(asset.id, { memo: e.target.value })}
                        readOnly={isReadOnly}
                        placeholder={isReadOnly ? '' : '이상 사항이 있으면 메모를 남겨주세요'}
                        className={cn(
                          'mt-3 min-h-24 w-full rounded-xl border border-outline-dim px-4 py-3 text-[16px] text-ink outline-none placeholder:text-ink-faint',
                          isReadOnly && 'bg-surface-soft',
                        )}
                      />

                      {showPhotoField && (
                        <ManagerReportPhotoField
                          cleaningId={id}
                          assetId={asset.id}
                          images={draft.photos}
                          readOnly={isReadOnly}
                          onError={(message) => {
                            if (message) {
                              toast.error(message)
                            }
                          }}
                          onChange={(images) => updateAssetDraft(asset.id, { photos: images }, { immediate: true })}
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
                const draft = assetDrafts[asset.id] ?? { status: null, memo: '' }

                return (
                  <div key={asset.id} className="rounded-xl border border-outline-dim px-4 py-4">
                    <div className="space-y-1">
                      <p className="text-[15px] font-semibold text-ink">{asset.name}</p>
                      <p className="text-[13px] text-ink-muted">
                        {ASSET_CATEGORY_LABELS[asset.category]} · {asset.location}
                      </p>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {STATUS_OPTIONS.map((option) => {
                        const active = draft.status === option.value
                        return (
                          <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            updateAssetDraft(asset.id, {
                              status: draft.status === option.value ? null : option.value,
                            }, { immediate: true })}
                          disabled={isReadOnly}
                            className={cn(
                              'h-10 rounded-lg border border-outline-dim text-[13px] font-medium text-ink-muted transition-colors active:scale-[0.98]',
                              active && option.activeClassName,
                              isReadOnly && 'cursor-default active:scale-100',
                            )}
                          >
                            {option.label}
                          </button>
                        )
                      })}
                    </div>

                    <textarea
                      value={draft.memo}
                      onChange={(e) => updateAssetDraft(asset.id, { memo: e.target.value })}
                      readOnly={isReadOnly}
                      placeholder={isReadOnly ? '' : '이상 사항이 있으면 메모를 남겨주세요'}
                      className={cn(
                        'mt-3 min-h-24 w-full rounded-xl border border-outline-dim px-4 py-3 text-[16px] text-ink outline-none placeholder:text-ink-faint',
                        isReadOnly && 'bg-surface-soft',
                      )}
                    />
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
