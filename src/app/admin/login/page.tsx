'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/api-client'
import { api } from '@/lib/api-client'
import { Logo } from '@/components/logo'
import { FloatingInput, CompoundInput } from '@/components/ui/floating-input'
import { LoadingButton } from '@/components/ui/loading-button'

type Profile = { role: string }

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [navigating, setNavigating] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (authError) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.')
        setLoading(false)
        return
      }

      // Check admin role
      const profile = await api.get<Profile>('/profiles/me')
      if (profile.role !== 'admin') {
        await supabase.auth.signOut()
        setError('관리자 권한이 없습니다.')
        setLoading(false)
        return
      }

      setNavigating(true)
      router.replace('/admin')
    } catch {
      setError('로그인에 실패했습니다.')
      setLoading(false)
    }
  }

  if (navigating) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-white px-6">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-white flex flex-col">
      <main className="flex-1 flex justify-center px-6 pt-[18vh] pb-10">
        <div className="animate-fade-up-fast w-full max-w-[400px]">
          <div className="mb-8 text-center">
            <Logo size="lg" />
            <p className="mt-2 text-[14px] text-ink-muted">관리자 로그인</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <CompoundInput>
              <FloatingInput
                label="이메일"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                borderRadius="12px 12px 0 0"
              />
              <FloatingInput
                label="비밀번호"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                borderRadius="0 0 12px 12px"
              />
            </CompoundInput>

            {error && (
              <p className="text-center text-[13px] text-destructive">{error}</p>
            )}

            <LoadingButton
              type="submit"
              variant="primary"
              loading={loading}
              loadingText="로그인 중..."
              disabled={!email || !password}
            >
              로그인
            </LoadingButton>
          </form>
        </div>
      </main>
    </div>
  )
}
