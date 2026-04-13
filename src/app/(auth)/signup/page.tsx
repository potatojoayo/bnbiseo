import Link from 'next/link'
import { Metadata } from 'next'
import { SignupForm } from './signup-form'

export const metadata: Metadata = {
  title: '회원가입 — 비앤비서',
}

export default function SignupPage() {
  return (
    <div>
      {/* Title */}
      <h1
        className="text-[22px] font-bold tracking-tight mb-2"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        회원가입
      </h1>
      <p className="text-[15px] text-[#717171] mb-8" style={{ fontFamily: 'var(--font-body)' }}>
        에어비앤비 호스트를 위한 청소·시설관리 서비스
      </p>

      <SignupForm />

      {/* Divider */}
      <div className="flex items-center gap-4 my-7">
        <div className="flex-1 h-px bg-[#DDDDDD]" />
        <span className="text-xs text-[#717171] shrink-0" style={{ fontFamily: 'var(--font-body)' }}>
          이미 계정이 있으신가요?
        </span>
        <div className="flex-1 h-px bg-[#DDDDDD]" />
      </div>

      {/* Login link */}
      <Link
        href="/login"
        className="flex items-center justify-center w-full h-12 rounded-lg border border-[#222222] text-sm font-semibold text-[#222222] transition-all hover:bg-[#F7F7F7] active:scale-[0.98]"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        로그인
      </Link>
    </div>
  )
}
