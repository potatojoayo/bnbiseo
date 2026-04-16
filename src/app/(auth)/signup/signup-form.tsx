'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/api-client'
import { api } from '@/lib/api-client'

export function SignupForm() {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<string | undefined>()
  const [focused, setFocused] = useState<string | null>(null)

  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setErrors({})
    setMessage(undefined)

    const name = nameRef.current?.value.trim() ?? ''
    const email = emailRef.current?.value.trim() ?? ''
    const password = passwordRef.current?.value ?? ''

    // Client validation
    const newErrors: Record<string, string> = {}
    if (!name || name.length < 2) newErrors.fullName = '이름은 2자 이상 입력해주세요.'
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = '유효한 이메일 주소를 입력해주세요.'
    if (!password || password.length < 8) newErrors.password = '비밀번호는 8자 이상이어야 합니다.'
    else if (!/[a-zA-Z]/.test(password)) newErrors.password = '영문자를 포함해야 합니다.'
    else if (!/[0-9]/.test(password)) newErrors.password = '숫자를 포함해야 합니다.'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setPending(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      })

      if (error) {
        if (error.message.toLowerCase().includes('already registered')) {
          setMessage('이미 가입된 이메일입니다.')
        } else {
          setMessage('회원가입 중 오류가 발생했습니다.')
        }
        setPending(false)
        return
      }

      if (data.user) {
        await api.post('/auth/signup', { fullName: name, email, password }).catch(() => {})
      }

      router.push('/dashboard')
    } catch {
      setMessage('회원가입 중 오류가 발생했습니다.')
      setPending(false)
    }
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

      {/* Compound input group — Airbnb style stacked inputs with shared borders */}
      <div className="rounded-xl border border-ink-faint overflow-hidden divide-y divide-ink-faint">
        {/* Name */}
        <div
          className="relative px-4 pt-[22px] pb-[10px]"
          style={{
            boxShadow: focused === 'fullName' ? 'inset 0 0 0 1px var(--on-surface)' : 'inset 0 0 0 0px var(--on-surface)',
            borderRadius: focused === 'fullName' ? '12px 12px 0 0' : '12px 12px 0 0',
            transition: 'box-shadow 0.2s ease',
          }}
        >
          <label
            htmlFor="fullName"
            className="absolute top-[8px] left-4 text-[11px] font-semibold uppercase tracking-wider text-ink-muted"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            이름
          </label>
          <input
            ref={nameRef}
            id="fullName"
            type="text"
            autoComplete="name"
            placeholder="홍길동"
            onFocus={() => setFocused('fullName')}
            onBlur={() => setFocused(null)}
            className="w-full bg-transparent text-[15px] text-ink placeholder:text-ink-faint outline-none"
            style={{ fontFamily: 'var(--font-body)' }}
          />
          {errors.fullName && (
            <p className="text-[12px] text-destructive mt-1" style={{ fontFamily: 'var(--font-body)' }}>{errors.fullName}</p>
          )}
        </div>

        {/* Email */}
        <div
          className="relative px-4 pt-[22px] pb-[10px]"
          style={{
            boxShadow: focused === 'email' ? 'inset 0 0 0 1px var(--on-surface)' : 'inset 0 0 0 0px var(--on-surface)',
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
          {errors.email && (
            <p className="text-[12px] text-destructive mt-1" style={{ fontFamily: 'var(--font-body)' }}>{errors.email}</p>
          )}
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
            autoComplete="new-password"
            placeholder="영문·숫자 포함 8자 이상"
            onFocus={() => setFocused('password')}
            onBlur={() => setFocused(null)}
            className="w-full bg-transparent text-[15px] text-ink placeholder:text-ink-faint outline-none"
            style={{ fontFamily: 'var(--font-body)' }}
          />
          {errors.password && (
            <p className="text-[12px] text-destructive mt-1" style={{ fontFamily: 'var(--font-body)' }}>{errors.password}</p>
          )}
        </div>
      </div>

      {/* Terms */}
      <p
        className="text-[12px] text-ink-muted leading-relaxed mt-4 mb-5"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        가입하면{' '}
        <a href="/terms" className="text-ink underline underline-offset-2 font-medium">이용약관</a>{' '}
        및{' '}
        <a href="/privacy" className="text-ink underline underline-offset-2 font-medium">개인정보처리방침</a>에
        동의하게 됩니다.
      </p>

      {/* Submit button — Airbnb gradient style */}
      <button
        type="submit"
        disabled={pending}
        className="w-full h-12 rounded-lg text-[15px] font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
        style={{
          background: 'var(--brand-gradient)',
          fontFamily: 'var(--font-body)',
        }}
      >
        {pending ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin inline-block" />
            가입 중...
          </span>
        ) : (
          '가입하기'
        )}
      </button>
    </form>
  )
}
