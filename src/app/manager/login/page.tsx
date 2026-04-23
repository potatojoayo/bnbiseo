'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/logo'
import { supabase, api } from '@/lib/api-client'
import { useAuth } from '@/lib/auth-provider'
import { useManagerMe } from '@/lib/hooks/use-manager'
import { useInvalidateProfile } from '@/lib/hooks/use-profile'
import { CompoundInput, CompoundField } from '@/components/ui/floating-input'
import { LoadingButton } from '@/components/ui/loading-button'

export default function ManagerLoginPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { data: managerMe, isLoading: managerLoading } = useManagerMe()
  const invalidateProfile = useInvalidateProfile()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | undefined>()
  const [focused, setFocused] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && user && managerMe) {
      router.replace('/manager/home')
    }
  }, [authLoading, managerMe, router, user])

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setMessage(undefined)

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      setMessage('이메일 또는 비밀번호를 다시 확인해주세요.')
      setPending(false)
      return
    }

    await invalidateProfile()

    try {
      await api.get('/manager/me')
      router.replace('/manager/home')
    } catch {
      await supabase.auth.signOut()
      setMessage('연결된 매니저 계정으로 로그인해주세요.')
      setPending(false)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    setMessage(undefined)
  }

  if (authLoading || (user && managerLoading)) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-white px-6">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-white flex flex-col">
      <main className="flex-1 flex justify-center px-6 pt-[18vh] pb-10">
        <div className="w-full max-w-[440px]">
          <div className="w-full animate-fade-up-fast">
            <div className="mb-8 text-center">
              <Link href="/" className="mb-6 inline-block">
                <Logo size="lg" />
              </Link>
              <h1
                className="mb-2 text-[22px] font-semibold tracking-tight"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                매니저 로그인
              </h1>
              <p className="text-[14px] leading-relaxed text-ink-muted">
                연결된 매니저 계정으로 로그인해주세요.
              </p>
            </div>

            {message && (
              <div className="mb-4 rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-[13px] text-danger">
                {message}
              </div>
            )}

            {user && !managerMe ? (
              <div className="flex flex-col gap-3">
                <LoadingButton type="button" variant="primary" onClick={handleSignOut}>
                  다른 계정으로 로그인
                </LoadingButton>
              </div>
            ) : (
              <form onSubmit={handleLogin} noValidate>
                <CompoundInput>
                  <CompoundField
                    label="이메일"
                    focused={focused === 'email'}
                    borderRadius="12px 12px 0 0"
                  >
                    <input
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocused('email')}
                      onBlur={() => setFocused(null)}
                      className="w-full bg-transparent text-[16px] text-ink outline-none placeholder:text-ink-faint"
                      placeholder="you@example.com"
                    />
                  </CompoundField>
                  <CompoundField
                    label="비밀번호"
                    focused={focused === 'password'}
                    borderRadius="0 0 12px 12px"
                  >
                    <input
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocused('password')}
                      onBlur={() => setFocused(null)}
                      className="w-full bg-transparent text-[16px] text-ink outline-none placeholder:text-ink-faint"
                      placeholder="••••••••"
                    />
                  </CompoundField>
                </CompoundInput>

                <LoadingButton
                  type="submit"
                  className="mt-5"
                  loading={pending}
                  loadingText="로그인 중..."
                  disabled={!email || !password}
                >
                  로그인
                </LoadingButton>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
