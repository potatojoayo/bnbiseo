'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MobileBackButton } from '@/components/mobile-back-button'
import { SiteHeader } from '@/components/site-header'
import { api, ApiError } from '@/lib/api-client'
import { useInvalidateAdmin } from '@/lib/hooks/use-admin'
import { CompoundInput, FloatingInput } from '@/components/ui/floating-input'
import { LoadingButton } from '@/components/ui/loading-button'

function formatPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)

  if (digits.length <= 3) return digits
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

export default function AdminManagerCreatePage() {
  const router = useRouter()
  const invalidate = useInvalidateAdmin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [memo, setMemo] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setMessage(null)
    try {
      await api.post('/admin/managers', { email, password, name, phone, memo: memo || undefined })
      invalidate.managers()
      invalidate.stats()
      router.replace('/admin/managers')
    } catch (error) {
      if (error instanceof ApiError) {
        setMessage(error.message)
      } else {
        setMessage('매니저 생성에 실패했어요.')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <SiteHeader title="매니저 추가" />
      <div className="mx-auto flex w-full max-w-[720px] flex-1 flex-col gap-6 p-6 max-md:animate-fade-up-fast max-md:p-5">
        <div className="-mb-1 md:hidden">
          <MobileBackButton href="/admin/managers" mode="back" />
        </div>

        <h1 className="text-[22px] font-semibold text-ink">매니저 추가</h1>

        <div className="space-y-4">
          <CompoundInput>
            <FloatingInput label="이메일" type="email" placeholder="manager@example.com" value={email} onChange={(e) => setEmail(e.target.value)} borderRadius="12px 12px 0 0" />
            <FloatingInput label="비밀번호" type="password" autoComplete="new-password" placeholder="비밀번호를 입력해주세요" value={password} onChange={(e) => setPassword(e.target.value)} borderRadius="0 0 12px 12px" />
          </CompoundInput>

          <CompoundInput>
            <FloatingInput label="이름" placeholder="홍길동" value={name} onChange={(e) => setName(e.target.value)} borderRadius="12px 12px 0 0" />
            <FloatingInput label="전화번호" inputMode="numeric" placeholder="010-1234-5678" value={phone} onChange={(e) => setPhone(formatPhoneNumber(e.target.value))} borderRadius="0 0 12px 12px" />
          </CompoundInput>

          <CompoundInput>
            <FloatingInput label="메모 (선택)" placeholder="간단한 메모를 남겨주세요" value={memo} onChange={(e) => setMemo(e.target.value)} borderRadius="12px" />
          </CompoundInput>

          {message && (
            <p className="text-[13px] text-destructive">{message}</p>
          )}
        </div>

        <div className="mt-auto flex flex-col gap-3">
          <LoadingButton
            type="button"
            variant="primary"
            loading={saving}
            loadingText="저장 중..."
            disabled={!name || !phone || !email || !password}
            onClick={handleSave}
          >
            추가하기
          </LoadingButton>
        </div>
      </div>
    </>
  )
}
