import Link from 'next/link'
import { Metadata } from 'next'
import { LoginForm } from './login-form'

export const metadata: Metadata = {
  title: '로그인 — 비앤비서',
}

export default function LoginPage() {
  return (
    <div>
      {/* Title */}
      <h1
        className="text-[22px] font-bold tracking-tight mb-2"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        로그인
      </h1>
      <p className="text-[15px] text-[#717171] mb-8" style={{ fontFamily: 'var(--font-body)' }}>
        다시 오신 것을 환영해요
      </p>

      <LoginForm />

      {/* Divider */}
      <div className="flex items-center gap-4 my-7">
        <div className="flex-1 h-px bg-[#DDDDDD]" />
        <span className="text-xs text-[#717171] shrink-0" style={{ fontFamily: 'var(--font-body)' }}>
          아직 계정이 없으신가요?
        </span>
        <div className="flex-1 h-px bg-[#DDDDDD]" />
      </div>

      {/* Signup link */}
      <Link
        href="/signup"
        className="flex items-center justify-center w-full h-12 rounded-lg border border-[#222222] text-sm font-semibold text-[#222222] transition-all hover:bg-[#F7F7F7] active:scale-[0.98]"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        회원가입
      </Link>
    </div>
  )
}
