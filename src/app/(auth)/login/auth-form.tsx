'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/api-client'
import { api } from '@/lib/api-client'
import { useAuth } from '@/lib/auth-provider'
import { useInvalidateProfile, useProfile } from '@/lib/hooks/use-profile'
import { CompoundInput, CompoundField, FloatingInput } from '@/components/ui/floating-input'
import { LoadingButton } from '@/components/ui/loading-button'

type Step = 'email' | 'login' | 'signup'

export function AuthForm() {
  const router = useRouter()
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const invalidateProfile = useInvalidateProfile()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [pending, setPending] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<string | undefined>()
  const [focused, setFocused] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [agreedTerms, setAgreedTerms] = useState(false)
  const [agreedPrivacy, setAgreedPrivacy] = useState(false)
  const allAgreed = agreedTerms && agreedPrivacy
  const extraRef = useRef<HTMLDivElement>(null)
  const [extraHeight, setExtraHeight] = useState(0)
  const [visibleStep, setVisibleStep] = useState<Step>('email')

  const font = { fontFamily: 'var(--font-body)' }

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

    await invalidateProfile()
    try {
      const profile = await api.get<{ onboardingCompleted: boolean }>('/profiles/me')
      router.push(profile.onboardingCompleted ? '/home' : '/onboarding')
    } catch {
      router.push('/onboarding')
    }
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
        // Already registered — sign in instead
        if (error.message.toLowerCase().includes('already registered')) {
          const { error: loginError } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          })
          if (loginError) {
            setMessage('이미 가입된 이메일입니다. 비밀번호를 확인해주세요.')
            setPending(false)
            return
          }
          // Fall through to profile creation below
        } else {
          setMessage('회원가입 중 오류가 발생했습니다.')
          setPending(false)
          return
        }
      }

      // Wait for session to be set before calling authenticated API
      await new Promise<void>((resolve) => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
          if (event === 'SIGNED_IN') {
            subscription.unsubscribe()
            resolve()
          }
        })
        // Already signed in — resolve immediately
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            subscription.unsubscribe()
            resolve()
          }
        })
      })

      await api.post('/auth/signup', { fullName: name.trim(), email: email.trim() }).catch(() => {})
      await invalidateProfile()

      router.push('/onboarding')
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

  const isExpanded = step !== 'email'
  const emailRadius = isExpanded ? '12px 12px 0 0' : '12px'

  async function handleSignOut() {
    await supabase.auth.signOut()
    setMessage(undefined)
  }

  return (
    <>
      {/* Error banner */}
      {message && (
        <div
          className="mb-4 flex items-center gap-3 rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-[13px] text-danger"
          style={font}
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

      {user && profile?.role !== 'user' ? (
        <div className="flex flex-col gap-3">
          <p className="text-[14px] leading-relaxed text-ink-muted" style={font}>
            호스트 계정으로 로그인해주세요.
          </p>
          <LoadingButton type="button" variant="primary" onClick={handleSignOut}>
            다른 계정으로 로그인
          </LoadingButton>
        </div>
      ) : (
      <form onSubmit={handleSubmit} noValidate>
        {/* Outer container — no divide-y here because extra fields slide in */}
        <div className="rounded-xl border border-ink-faint overflow-hidden">
          {/* Email — always visible */}
          <CompoundField
            label="이메일"
            focused={focused === 'email'}
            borderRadius={emailRadius}
          >
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
              className="w-full bg-transparent text-[16px] text-ink placeholder:text-ink-faint outline-none"
              style={font}
              autoFocus
            />
            {errors.email && (
              <p className="mt-1 text-[12px] text-destructive" style={font}>{errors.email}</p>
            )}
          </CompoundField>

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
                <div className="border-t border-ink-faint">
                  <CompoundField
                    label="비밀번호"
                    focused={focused === 'password'}
                    borderRadius="0 0 12px 12px"
                  >
                    <input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => onPasswordChange(e.target.value)}
                      onFocus={() => setFocused('password')}
                      onBlur={() => setFocused(null)}
                      className="w-full bg-transparent text-[16px] text-ink placeholder:text-ink-faint outline-none"
                      style={font}
                    />
                  </CompoundField>
                </div>
              )}

              {/* Signup: name + password */}
              {visibleStep === 'signup' && (
                <>
                  <div className="border-t border-ink-faint">
                    <CompoundField
                      label="이름"
                      focused={focused === 'fullName'}
                    >
                      <input
                        id="fullName"
                        type="text"
                        autoComplete="name"
                        placeholder="홍길동"
                        value={name}
                        onChange={(e) => onNameChange(e.target.value)}
                        onFocus={() => setFocused('fullName')}
                        onBlur={() => setFocused(null)}
                        className="w-full bg-transparent text-[16px] text-ink placeholder:text-ink-faint outline-none"
                        style={font}
                      />
                      {errors.fullName && (
                        <p className="mt-1 text-[12px] text-destructive" style={font}>{errors.fullName}</p>
                      )}
                    </CompoundField>
                  </div>
                  <div className="border-t border-ink-faint">
                    <CompoundField
                      label="비밀번호"
                      focused={focused === 'password'}
                      borderRadius="0 0 12px 12px"
                    >
                      <input
                        id="password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="영문·숫자 포함 8자 이상"
                        value={password}
                        onChange={(e) => onPasswordChange(e.target.value)}
                        onFocus={() => setFocused('password')}
                        onBlur={() => setFocused(null)}
                        className="w-full bg-transparent text-[16px] text-ink placeholder:text-ink-faint outline-none"
                        style={font}
                      />
                      {errors.password && (
                        <p className="mt-1 text-[12px] text-destructive" style={font}>{errors.password}</p>
                      )}
                    </CompoundField>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Terms agreement — signup only */}
        {step === 'signup' && (
          <div className="flex flex-col gap-3 mt-4 mb-5 animate-fade-only" style={font}>
            {/* All agree */}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <button
                type="button"
                onClick={() => {
                  const next = !allAgreed
                  setAgreedTerms(next)
                  setAgreedPrivacy(next)
                }}
                className={`w-[18px] h-[18px] rounded border-[1.5px] shrink-0 flex items-center justify-center transition-all ${
                  allAgreed ? 'bg-ink border-ink' : 'border-outline'
                }`}
              >
                {allAgreed && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <span className="text-[13px] text-ink font-medium">전체 동의</span>
            </label>

            <div className="w-full h-px bg-outline-dim" />

            {/* Terms */}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <button
                type="button"
                onClick={() => setAgreedTerms(!agreedTerms)}
                className={`w-[18px] h-[18px] rounded border-[1.5px] shrink-0 flex items-center justify-center transition-all ${
                  agreedTerms ? 'bg-ink border-ink' : 'border-outline'
                }`}
              >
                {agreedTerms && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <span className="text-[12px] text-ink-muted flex-1">
                서비스 <a href="/legal/terms" target="_blank" rel="noopener noreferrer" className="text-ink underline underline-offset-2 font-medium">이용약관</a>에 동의합니다
                <span className="text-brand ml-0.5">(필수)</span>
              </span>
            </label>

            {/* Privacy */}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <button
                type="button"
                onClick={() => setAgreedPrivacy(!agreedPrivacy)}
                className={`w-[18px] h-[18px] rounded border-[1.5px] shrink-0 flex items-center justify-center transition-all ${
                  agreedPrivacy ? 'bg-ink border-ink' : 'border-outline'
                }`}
              >
                {agreedPrivacy && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <span className="text-[12px] text-ink-muted flex-1">
                <a href="/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-ink underline underline-offset-2 font-medium">개인정보 수집·이용</a>에 동의합니다
                <span className="text-brand ml-0.5">(필수)</span>
              </span>
            </label>
          </div>
        )}

        {/* Submit button */}
        <LoadingButton
          type="submit"
          loading={pending}
          disabled={step === 'signup' && !allAgreed}
          loadingText={step === 'email' ? '확인 중...' : step === 'login' ? '로그인 중...' : '가입 중...'}
          className="mt-5"
        >
          {step === 'email' ? '계속' : step === 'login' ? '로그인' : '가입하기'}
        </LoadingButton>

        {/* Back link */}
        {isExpanded && (
          <button
            type="button"
            onClick={handleBack}
            className="w-full text-center text-sm text-ink-muted mt-4 hover:text-ink transition-colors animate-fade-only"
            style={font}
          >
            다른 이메일로 계속하기
          </button>
        )}
      </form>
      )}
    </>
  )
}
