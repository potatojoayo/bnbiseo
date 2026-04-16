'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/api-client'

export function LoginForm() {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | undefined>()
  const [focused, setFocused] = useState<string | null>(null)

  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setMessage(undefined)

    const email = emailRef.current?.value.trim() ?? ''
    const password = passwordRef.current?.value ?? ''

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setMessage('이메일 또는 비밀번호가 올바르지 않습니다.')
      setPending(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Error banner */}
      {message && (
        <div
          className="mb-4 flex items-center gap-3 rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-[13px] text-danger"
          style={{ fontFamily: 'var(--font-body)' }}
          role="alert"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 5v3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
          </svg>
          {message}
        </div>
      )}

      {/* Compound input group */}
      <div className="rounded-xl border border-ink-faint overflow-hidden divide-y divide-ink-faint">
        {/* Email */}
        <div
          className="relative px-4 pt-[22px] pb-[10px]"
          style={{
            boxShadow: focused === 'email' ? 'inset 0 0 0 1px var(--on-surface)' : 'inset 0 0 0 0px var(--on-surface)',
            borderRadius: '12px 12px 0 0',
            transition: 'box-shadow 0.2s ease',
          }}
        >
          <label
            htmlFor="email"
            className="absolute top-[8px] left-4 text-[11px] font-semibold uppercase tracking-wider text-ink-muted"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            이메일
          </label>
          <input
            ref={emailRef}
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            onFocus={() => setFocused('email')}
            onBlur={() => setFocused(null)}
            className="w-full bg-transparent text-[15px] text-ink placeholder:text-ink-faint outline-none"
            style={{ fontFamily: 'var(--font-body)' }}
          />
        </div>

        {/* Password */}
        <div
          className="relative px-4 pt-[22px] pb-[10px]"
          style={{
            boxShadow: focused === 'password' ? 'inset 0 0 0 1px var(--on-surface)' : 'inset 0 0 0 0px var(--on-surface)',
            borderRadius: '0 0 12px 12px',
            transition: 'box-shadow 0.2s ease',
          }}
        >
          <label
            htmlFor="password"
            className="absolute top-[8px] left-4 text-[11px] font-semibold uppercase tracking-wider text-ink-muted"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            비밀번호
          </label>
          <input
            ref={passwordRef}
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            onFocus={() => setFocused('password')}
            onBlur={() => setFocused(null)}
            className="w-full bg-transparent text-[15px] text-ink placeholder:text-ink-faint outline-none"
            style={{ fontFamily: 'var(--font-body)' }}
          />
        </div>
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={pending}
        className="w-full h-12 rounded-lg text-[15px] font-semibold text-white mt-5 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
        style={{
          background: 'var(--brand-gradient)',
          fontFamily: 'var(--font-body)',
        }}
      >
        {pending ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin inline-block" />
            로그인 중...
          </span>
        ) : (
          '로그인'
        )}
      </button>
    </form>
  )
}
