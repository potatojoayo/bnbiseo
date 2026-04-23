import Image from 'next/image'
import type { RepairCompletionReport } from '@/lib/hooks/use-repair'

type RepairCompletionReportReadOnlyProps = {
  report: RepairCompletionReport['report']
}

export function RepairCompletionReportReadOnly({
  report,
}: RepairCompletionReportReadOnlyProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-[12px] font-medium text-ink-muted">조치 보고서</p>
      </div>

      {report.photos.length > 0 && (
        <div className="flex flex-col gap-3">
          {report.photos.map((photo) => (
            <div
              key={photo.id}
              className="relative aspect-[4/3] overflow-hidden rounded-xl border border-outline-dim bg-surface-subtle"
            >
              {photo.signedUrl ?? photo.thumbnailSignedUrl ? (
                <Image
                  src={photo.signedUrl ?? photo.thumbnailSignedUrl}
                  alt="조치 사진"
                  fill
                  sizes="(max-width: 768px) 100vw, 720px"
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
    </div>
  )
}
