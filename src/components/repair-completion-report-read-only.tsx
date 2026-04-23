import Image from 'next/image'
import type { RepairCompletionReport } from '@/lib/hooks/use-repair'

type RepairCompletionReportReadOnlyProps = {
  report: RepairCompletionReport['report']
  propertyName: string | null
}

export function RepairCompletionReportReadOnly({
  report,
  propertyName,
}: RepairCompletionReportReadOnlyProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-[12px] font-medium text-ink-muted">조치 보고서</p>
        <h2 className="mt-1 text-[18px] font-semibold text-ink">
          {propertyName || '숙소'}
        </h2>
      </div>

      {report.photos.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {report.photos.map((photo) => (
            <div
              key={photo.id}
              className="relative aspect-square overflow-hidden rounded-xl border border-outline-dim bg-surface-subtle"
            >
              {photo.thumbnailSignedUrl ? (
                <Image
                  src={photo.thumbnailSignedUrl}
                  alt="조치 사진"
                  fill
                  sizes="(max-width: 480px) 50vw, 240px"
                  className="object-cover"
                />
              ) : null}
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-outline-dim bg-white p-4">
        <p className="text-[12px] font-medium text-ink-muted">조치 내용</p>
        <p className="mt-2 whitespace-pre-wrap text-[14px] leading-relaxed text-ink">
          {report.actionNotes}
        </p>
      </div>

      {report.additionalNotes && (
        <div className="rounded-2xl border border-outline-dim bg-white p-4">
          <p className="text-[12px] font-medium text-ink-muted">추가 메모</p>
          <p className="mt-2 whitespace-pre-wrap text-[14px] leading-relaxed text-ink">
            {report.additionalNotes}
          </p>
        </div>
      )}
    </div>
  )
}
