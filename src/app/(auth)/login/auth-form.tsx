'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/api-client'
import { api } from '@/lib/api-client'
import { useInvalidateProfile } from '@/lib/hooks/use-profile'
import { CompoundInput, CompoundField, FloatingInput } from '@/components/ui/floating-input'
import { LoadingButton } from '@/components/ui/loading-button'

type Step = 'email' | 'login' | 'signup'

export function AuthForm() {
  const router = useRouter()
  const invalidateProfile = useInvalidateProfile()
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
        {/* Outer container — no divide-y here because extra fields slide in */}
        <div className="rounded-xl border border-[#B0B0B0] overflow-hidden">
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
              className="w-full bg-transparent text-[16px] text-[#222222] placeholder:text-[#C0C0C0] outline-none"
              style={font}
              autoFocus
            />
            {errors.email && (
              <p className="text-[12px] text-[#C13515] mt-1" style={font}>{errors.email}</p>
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
                <div className="border-t border-[#B0B0B0]">
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
                      className="w-full bg-transparent text-[16px] text-[#222222] placeholder:text-[#C0C0C0] outline-none"
                      style={font}
                    />
                  </CompoundField>
                </div>
              )}

              {/* Signup: name + password */}
              {visibleStep === 'signup' && (
                <>
                  <div className="border-t border-[#B0B0B0]">
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
                        className="w-full bg-transparent text-[16px] text-[#222222] placeholder:text-[#C0C0C0] outline-none"
                        style={font}
                      />
                      {errors.fullName && (
                        <p className="text-[12px] text-[#C13515] mt-1" style={font}>{errors.fullName}</p>
                      )}
                    </CompoundField>
                  </div>
                  <div className="border-t border-[#B0B0B0]">
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
                        className="w-full bg-transparent text-[16px] text-[#222222] placeholder:text-[#C0C0C0] outline-none"
                        style={font}
                      />
                      {errors.password && (
                        <p className="text-[12px] text-[#C13515] mt-1" style={font}>{errors.password}</p>
                      )}
                    </CompoundField>
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
        <LoadingButton
          type="submit"
          loading={pending}
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
