'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/api-client'
import { api } from '@/lib/api-client'

type Step = 'email' | 'login' | 'signup'

export function AuthForm() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [pending, setPending] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<string | undefined>()
  const [focused, setFocused] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const extraRef = useRef<HTMLDivElement>(null)
  const [extraHeight, setExtraHeight] = useState(0)
  const [visibleStep, setVisibleStep] = useState<Step>('email')

  // When step changes, update visibleStep (for open) or start close animation
  useEffect(() => {
    if (step !== 'email') {
      setVisibleStep(step)
    } else {
      setExtraHeight(0)
      const timer = setTimeout(() => setVisibleStep('email'), 350)
      return () => clearTimeout(timer)
    }
  }, [step])

  // After visibleStep renders new fields, measure and animate open
  useEffect(() => {
    if (visibleStep !== 'email' && step !== 'email') {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (extraRef.current) {
            setExtraHeight(extraRef.current.scrollHeight)
          }
        })
      })
      const timer = setTimeout(() => {
        const id = step === 'login' ? 'password' : 'fullName'
        document.getElementById(id)?.focus()
      }, 350)
      return () => clearTimeout(timer)
    }
  }, [visibleStep, step])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (step === 'email') return handleEmailSubmit()
    if (step === 'login') return handleLogin()
    if (step === 'signup') return handleSignup()
  }

  async function handleEmailSubmit() {
    setPending(true)
    setMessage(undefined)
    setErrors({})

    const emailErr = validateEmail(email)
    if (emailErr) {
      setErrors({ email: emailErr })
      setPending(false)
      return
    }

    try {
      const { exists } = await api.post<{ exists: boolean }>('/auth/check-email', { email: email.trim() })
      setStep(exists ? 'login' : 'signup')
    } catch {
      setMessage('이메일 확인 중 오류가 발생했습니다.')
    } finally {
      setPending(false)
    }
  }

  function validateEmail(v: string) {
    if (!v.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return '유효한 이메일 주소를 입력해주세요.'
    return ''
  }

  function validateName(v: string) {
    if (!v.trim() || v.trim().length < 2) return '이름은 2자 이상 입력해주세요.'
    return ''
  }

  function validatePassword(v: string) {
    if (!v || v.length < 8) return '비밀번호는 8자 이상이어야 합니다.'
    if (!/[a-zA-Z]/.test(v)) return '영문자를 포함해야 합니다.'
    if (!/[0-9]/.test(v)) return '숫자를 포함해야 합니다.'
    return ''
  }

  function onEmailChange(v: string) {
    setEmail(v)
    if (step !== 'email') {
      setStep('email')
      setName('')
      setPassword('')
      setMessage(undefined)
      setErrors({})
      return
    }
    if (errors.email) {
      const err = validateEmail(v)
      setErrors((prev) => err ? { ...prev, email: err } : Object.fromEntries(Object.entries(prev).filter(([k]) => k !== 'email')))
    }
  }

  function onNameChange(v: string) {
    setName(v)
    if (errors.fullName) {
      const err = validateName(v)
      setErrors((prev) => err ? { ...prev, fullName: err } : Object.fromEntries(Object.entries(prev).filter(([k]) => k !== 'fullName')))
    }
  }

  function onPasswordChange(v: string) {
    setPassword(v)
    if (errors.password) {
      const err = step === 'signup' ? validatePassword(v) : ''
      setErrors((prev) => err ? { ...prev, password: err } : Object.fromEntries(Object.entries(prev).filter(([k]) => k !== 'password')))
    }
  }

  async function handleLogin() {
    setPending(true)
    setMessage(undefined)

    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })

    if (error) {
      setMessage('비밀번호가 올바르지 않습니다.')
      setPending(false)
      return
    }

    router.push('/dashboard')
  }

  async function handleSignup() {
    setPending(true)
    setMessage(undefined)
    setErrors({})

    const newErrors: Record<string, string> = {}
    const nameErr = validateName(name)
    if (nameErr) newErrors.fullName = nameErr
    const pwErr = validatePassword(password)
    if (pwErr) newErrors.password = pwErr

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setPending(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: name.trim() } },
      })

      if (error) {
        setMessage('회원가입 중 오류가 발생했습니다.')
        setPending(false)
        return
      }

      if (data.user) {
        await api.post('/auth/signup', { fullName: name.trim(), email: email.trim(), password }).catch(() => {})
      }

      router.push('/dashboard')
    } catch {
      setMessage('회원가입 중 오류가 발생했습니다.')
      setPending(false)
    }
  }

  function handleBack() {
    setStep('email')
    setName('')
    setPassword('')
    setMessage(undefined)
    setErrors({})
  }

  const inputCls = 'w-full bg-transparent text-[16px] text-[#222222] placeholder:text-[#C0C0C0] outline-none'
  const labelCls = 'absolute top-[8px] left-4 text-[11px] font-semibold uppercase tracking-wider text-[#717171]'
  const font = { fontFamily: 'var(--font-body)' }

  function focusStyle(field: string, radius?: string) {
    return {
      boxShadow: focused === field ? 'inset 0 0 0 1px #222222' : 'inset 0 0 0 0px #222222',
      borderRadius: radius ?? undefined,
      transition: 'box-shadow 0.2s ease',
    }
  }

  const isExpanded = step !== 'email'
  const emailRadius = isExpanded ? '12px 12px 0 0' : '12px'

  return (
    <>
      {/* Error banner */}
      {message && (
        <div
          className="flex items-center gap-3 px-4 py-3 mb-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[13px] text-[#B91C1C]"
          style={font}
          role="alert"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
            <circle cx="8" cy="8" r="7" stroke="#B91C1C" strokeWidth="1.5" />
            <path d="M8 5v3.5" stroke="#B91C1C" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="8" cy="11.5" r="0.75" fill="#B91C1C" />
          </svg>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="rounded-xl border border-[#B0B0B0] overflow-hidden">
          {/* Email — always visible */}
          <div
            className="relative px-4 pt-[22px] pb-[10px]"
            style={focusStyle('email', emailRadius)}
          >
            <label htmlFor="email" className={labelCls} style={font}>
              이메일
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
              className={inputCls}
              style={font}
              autoFocus
            />
            {errors.email && (
              <p className="text-[12px] text-[#C13515] mt-1" style={font}>{errors.email}</p>
            )}
          </div>

          {/* Extra fields — slide down */}
          <div
            style={{
              maxHeight: isExpanded ? extraHeight : 0,
              opacity: isExpanded ? 1 : 0,
              transition: 'max-height 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease',
              overflow: 'hidden',
            }}
          >
            <div ref={extraRef}>
              {/* Login: password only */}
              {visibleStep === 'login' && (
                <div className="border-t border-[#B0B0B0]">
                  <div
                    className="relative px-4 pt-[22px] pb-[10px]"
                    style={focusStyle('password', '0 0 12px 12px')}
                  >
                    <label htmlFor="password" className={labelCls} style={font}>
                      비밀번호
                    </label>
                    <input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => onPasswordChange(e.target.value)}
                      onFocus={() => setFocused('password')}
                      onBlur={() => setFocused(null)}
                      className={inputCls}
                      style={font}
                    />
                  </div>
                </div>
              )}

              {/* Signup: name + password */}
              {visibleStep === 'signup' && (
                <>
                  <div className="border-t border-[#B0B0B0]">
                    <div
                      className="relative px-4 pt-[22px] pb-[10px]"
                      style={focusStyle('fullName')}
                    >
                      <label htmlFor="fullName" className={labelCls} style={font}>
                        이름
                      </label>
                      <input
                        id="fullName"
                        type="text"
                        autoComplete="name"
                        placeholder="홍길동"
                        value={name}
                        onChange={(e) => onNameChange(e.target.value)}
                        onFocus={() => setFocused('fullName')}
                        onBlur={() => setFocused(null)}
                        className={inputCls}
                        style={font}
                      />
                      {errors.fullName && (
                        <p className="text-[12px] text-[#C13515] mt-1" style={font}>{errors.fullName}</p>
                      )}
                    </div>
                  </div>
                  <div className="border-t border-[#B0B0B0]">
                    <div
                      className="relative px-4 pt-[22px] pb-[10px]"
                      style={focusStyle('password', '0 0 12px 12px')}
                    >
                      <label htmlFor="password" className={labelCls} style={font}>
                        비밀번호
                      </label>
                      <input
                        id="password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="영문·숫자 포함 8자 이상"
                        value={password}
                        onChange={(e) => onPasswordChange(e.target.value)}
                        onFocus={() => setFocused('password')}
                        onBlur={() => setFocused(null)}
                        className={inputCls}
                        style={font}
                      />
                      {errors.password && (
                        <p className="text-[12px] text-[#C13515] mt-1" style={font}>{errors.password}</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Terms — signup only */}
        {step === 'signup' && (
          <p className="text-[12px] text-[#717171] leading-relaxed mt-4 mb-5 animate-fade-only" style={font}>
            가입하면{' '}
            <a href="/terms" className="text-[#222222] underline underline-offset-2 font-medium">이용약관</a>{' '}
            및{' '}
            <a href="/privacy" className="text-[#222222] underline underline-offset-2 font-medium">개인정보처리방침</a>에
            동의하게 됩니다.
          </p>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={pending}
          className="w-full h-12 rounded-lg text-[15px] font-semibold text-white mt-5 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: '#222222', ...font }}
        >
          {pending ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin inline-block" />
              {step === 'email' ? '확인 중...' : step === 'login' ? '로그인 중...' : '가입 중...'}
            </span>
          ) : (
            step === 'email' ? '계속' : step === 'login' ? '로그인' : '가입하기'
          )}
        </button>

        {/* Back link */}
        {isExpanded && (
          <button
            type="button"
            onClick={handleBack}
            className="w-full text-center text-sm text-[#717171] mt-4 hover:text-[#222222] transition-colors animate-fade-only"
            style={font}
          >
            다른 이메일로 계속하기
          </button>
        )}
      </form>
    </>
  )
}
