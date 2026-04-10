import Link from 'next/link'
import { Metadata } from 'next'
import { LoginForm } from './login-form'

export const metadata: Metadata = {
  title: '로그인 — 비엔비서',
}

export default function LoginPage() {
  return (
    <div>
      {/* Heading */}
      <div className="mb-8 animate-fade-in-d1">
        <h1
          className="text-2xl font-bold tracking-tight mb-2"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--on-surface)' }}
        >
          다시 오셨군요
        </h1>
        <p
          className="text-sm leading-relaxed"
          style={{ color: 'var(--on-surface-subtle)', fontFamily: 'var(--font-body)' }}
        >
          마포구·서대문구 에어비앤비 호스트를 위한 전문 청소 서비스
        </p>
      </div>

      <div className="animate-fade-in-d2">
        <LoginForm />
      </div>

      {/* Signup redirect */}
      <p
        className="mt-7 text-sm text-center animate-fade-in-d3"
        style={{ color: 'var(--on-surface-subtle)', fontFamily: 'var(--font-body)' }}
      >
        아직 계정이 없으신가요?{' '}
        <Link
          href="/signup"
          className="font-semibold underline underline-offset-2 transition-colors"
          style={{ color: 'var(--brand)' }}
        >
          회원가입
        </Link>
      </p>
    </div>
  )
}
