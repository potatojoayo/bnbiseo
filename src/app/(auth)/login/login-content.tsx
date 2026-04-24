'use client'

import Link from 'next/link'
import { AuthForm } from './auth-form'
import { Logo } from '@/components/logo'
import { useAuth } from '@/lib/auth-provider'

export function LoginContent() {
  const { loading: authLoading } = useAuth()

  if (authLoading) {
    return (
      <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
    )
  }

  return (
    <div className="animate-fade-up-fast">
      <div className="text-center mb-8">
        <Link href="/" className="mb-6 inline-block">
          <Logo size="lg" />
        </Link>
        <h1
          className="text-[22px] font-semibold tracking-tight mb-2"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          로그인 또는 회원가입
        </h1>
      </div>

      <AuthForm />
    </div>
  )
}
