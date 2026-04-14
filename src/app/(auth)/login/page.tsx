import Link from 'next/link'
import { Metadata } from 'next'
import { AuthForm } from './auth-form'
import { Logo } from '@/components/logo'

export const metadata: Metadata = {
  title: '로그인 · 회원가입 — 비앤비서',
}

export default function LoginPage() {
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
