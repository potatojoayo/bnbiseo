import Link from 'next/link'
import { Metadata } from 'next'
import { SignupForm } from './signup-form'

export const metadata: Metadata = {
  title: '회원가입 — 비엔비서',
}

export default function SignupPage() {
  return (
    <div>
      {/* Heading */}
      <div className="mb-8 animate-fade-in-d1">
        <h1
          className="text-2xl font-bold tracking-tight mb-2"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--on-surface)' }}
        >
          시작하기
        </h1>
        <p
          className="text-sm leading-relaxed"
          style={{ color: 'var(--on-surface-subtle)', fontFamily: 'var(--font-body)' }}
        >
          비엔비서와 함께 숙소를 스마트하게 관리하세요
        </p>
      </div>

      <div className="animate-fade-in-d2">
        <SignupForm />
      </div>

      {/* Login redirect */}
      <p
        className="mt-7 text-sm text-center animate-fade-in-d3"
        style={{ color: 'var(--on-surface-subtle)', fontFamily: 'var(--font-body)' }}
      >
        이미 계정이 있으신가요?{' '}
        <Link
          href="/login"
          className="font-semibold underline underline-offset-2 transition-colors"
          style={{ color: 'var(--brand)' }}
        >
          로그인
        </Link>
      </p>
    </div>
  )
}
