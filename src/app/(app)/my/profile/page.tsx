'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeftIcon } from 'lucide-react'
import { useProfile, useInvalidateProfile } from '@/lib/hooks/use-profile'
import { useAuth } from '@/lib/auth-provider'
import { api, supabase } from '@/lib/api-client'
import { CompoundInput, CompoundField, FloatingInput } from '@/components/ui/floating-input'
import { LoadingButton } from '@/components/ui/loading-button'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { data: profile, isLoading: profileLoading } = useProfile()
  const invalidateProfile = useInvalidateProfile()

  const [nameDraft, setNameDraft] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const email = profile?.email || user?.email || ''
  const name = nameDraft ?? (profile?.fullName || '')
  const hasChanges = name !== (profile?.fullName || '')

  async function handleSave() {
    if (!hasChanges) return
    setSaving(true)
    try {
      await api.patch('/profiles/me', { fullName: name })
      await invalidateProfile()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      // error
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await api.delete('/profiles/me')
      await supabase.auth.signOut()
      router.replace('/login')
    } catch {
      setDeleting(false)
    }
  }

  if (authLoading || profileLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
      </div>
    )
  }

  return (
    <div className="animate-fade-up-fast min-h-[100dvh] flex flex-col px-6 pt-6 pb-6">
      {/* Header */}
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-3 -ml-4 inline-flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface-soft"
      >
        <ChevronLeftIcon size={32} />
      </button>
      <h1 className="mb-6 text-[22px] font-semibold text-ink">
        내 정보 수정
      </h1>

      {/* Form */}
      <div className="flex flex-col gap-5">
        <CompoundInput>
          <CompoundField label="이메일" borderRadius="12px 12px 0 0">
            <span className="block w-full text-[16px] text-ink-faint">
              {email}
            </span>
          </CompoundField>
          <FloatingInput
            label="이름"
            value={name}
            onChange={(e) => setNameDraft(e.target.value)}
            borderRadius="0 0 12px 12px"
          />
        </CompoundInput>

        <LoadingButton
          type="button"
          variant="primary"
          loading={saving}
          loadingText="저장 중..."
          disabled={!hasChanges}
          onClick={handleSave}
        >
          {saved ? '저장되었어요' : '저장하기'}
        </LoadingButton>
      </div>

      {/* Spacer pushes the delete button to the bottom */}
      <div className="flex-1" />

      {/* Delete account */}
      <div className="flex justify-center pt-8">
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="text-[13px] text-ink-faint underline underline-offset-2 transition-colors hover:text-ink-muted"
        >
          회원탈퇴
        </button>
      </div>

      {/* Delete Drawer */}
      <Drawer open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DrawerContent>
          <div className="w-full px-5 pb-8">
            <DrawerHeader className="px-0">
              <DrawerTitle className="text-[18px] font-semibold text-ink">
                정말 탈퇴할까요?
              </DrawerTitle>
            </DrawerHeader>
            <div className="flex flex-col gap-1.5 mb-6">
              <p className="text-[14px] text-ink-muted">
                탈퇴하면 모든 숙소 정보와 청소 내역이 삭제돼요.
              </p>
              <p className="text-[13px] text-ink-faint">
                이 작업은 되돌릴 수 없어요.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <LoadingButton
                type="button"
                variant="destructive"
                loading={deleting}
                loadingText="탈퇴 중..."
                onClick={handleDelete}
              >
                탈퇴하기
              </LoadingButton>
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                className="h-12 rounded-lg text-[15px] font-semibold text-ink-muted transition-colors active:bg-surface-soft"
              >
                닫기
              </button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
