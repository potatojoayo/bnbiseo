'use client'

import { useParams, useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import {
  CleaningManualEditor,
  type CleaningManualSavePayload,
} from '@/components/cleaning-manual-editor'
import { MobileBackButton } from '@/components/mobile-back-button'
import { SiteHeader } from '@/components/site-header'
import { api, ApiError } from '@/lib/api-client'
import { uploadAdminCleaningManualImage } from '@/lib/admin-image-upload'
import { useAdminCleaningManual, useInvalidateAdmin } from '@/lib/hooks/use-admin'

export default function AdminCleaningManualEditPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const invalidate = useInvalidateAdmin()
  const { data, isLoading, error } = useAdminCleaningManual(id)

  const saveMutation = useMutation({
    mutationFn: (payload: CleaningManualSavePayload) =>
      api.put(`/admin/properties/${id}/cleaning-manual`, payload),
    onSuccess: () => {
      invalidate.cleaningManual(id)
      invalidate.propertyRegistration(id)
      router.replace(`/admin/properties/${id}/cleaning-manual`)
    },
  })

  if (isLoading) {
    return (
      <>
        <SiteHeader title="청소 매뉴얼 편집" />
        <div className="flex min-h-[calc(100dvh-80px)] items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
        </div>
      </>
    )
  }

  if (error || !data) {
    return (
      <>
        <SiteHeader title="청소 매뉴얼 편집" />
        <div className="flex flex-1 items-center justify-center px-6 py-20 text-center text-[14px] text-ink-muted">
          {error instanceof ApiError ? error.message : '매뉴얼을 불러오지 못했어요.'}
        </div>
      </>
    )
  }

  return (
    <>
      <SiteHeader title="청소 매뉴얼 편집" />
      <div className="mx-auto flex w-full max-w-[720px] flex-1 flex-col gap-6 p-6 max-md:gap-5 max-md:p-5">
        <div className="-mb-2 md:hidden">
          <MobileBackButton href={`/admin/properties/${id}/cleaning-manual`} mode="back" />
        </div>

        <CleaningManualEditor
          propertyName={data.propertyName}
          initialSteps={data.steps.map((step) => ({
            id: step.id,
            title: step.title,
            description: step.description,
            photos: step.photos,
          }))}
          uploadImage={(file) => uploadAdminCleaningManualImage(id, file)}
          onSave={(payload) => saveMutation.mutateAsync(payload).then(() => undefined)}
          isSaving={saveMutation.isPending}
          cancelHref={`/admin/properties/${id}/cleaning-manual`}
        />
      </div>
    </>
  )
}
