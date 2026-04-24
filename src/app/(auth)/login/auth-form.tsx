'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, api, ApiError } from '@/lib/api-client'
import { useAuth } from '@/lib/auth-provider'
import { useInvalidateProfile, useProfile } from '@/lib/hooks/use-profile'
import { CompoundField } from '@/components/ui/floating-input'
import { LoadingButton } from '@/components/ui/loading-button'

type Step = 'phone' | 'otp' | 'profile'

const RESEND_COOLDOWN_SECONDS = 60

export function AuthForm() {
  const router = useRouter()
  const { user } = useAuth()
  const { data: profile, isPending: profilePending } = useProfile()
  const invalidateProfile = useInvalidateProfile()

  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [name, setName] = useState('')
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | undefined>()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [focused, setFocused] = useState<string | null>(null)
  const [agreedTerms, setAgreedTerms] = useState(false)
  const [agreedPrivacy, setAgreedPrivacy] = useState(false)
  const [resendIn, setResendIn] = useState(0)
  const allAgreed = agreedTerms && agreedPrivacy
  const cooldownTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const font = { fontFamily: 'var(--font-body)' }

  useEffect(() => {
    return () => {
      if (cooldownTimer.current) clearInterval(cooldownTimer.current)
    }
  }, [])

  // Auto-verify when 6 digits are entered.
  useEffect(() => {
    if (step === 'otp' && otp.length === 6 && !pending) {
      handleOtpSubmit()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp, step])

  function startCooldown() {
    setOtp('')
    setResendIn(RESEND_COOLDOWN_SECONDS)
    if (cooldownTimer.current) clearInterval(cooldownTimer.current)
    cooldownTimer.current = setInterval(() => {
      setResendIn((n) => {
        if (n <= 1) {
          if (cooldownTimer.current) clearInterval(cooldownTimer.current)
          setOtp('')
          return 0
        }
        return n - 1
      })
    }, 1000)
  }

  function formatPhone(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    if (digits.length < 4) return digits
    if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
  }

  function toE164(value: string) {
    const digits = value.replace(/\D/g, '')
    if (digits.startsWith('0')) return `+82${digits.slice(1)}`
    return `+${digits}`
  }

  function validatePhone(value: string) {
    const digits = value.replace(/\D/g, '')
    if (!/^01\d{8,9}$/.test(digits)) return '010-0000-0000 형식으로 입력해주세요.'
    return ''
  }

  async function sendOtp() {
    const err = validatePhone(phone)
    if (err) {
      setErrors({ phone: err })
      return false
    }
    const { error } = await supabase.auth.signInWithOtp({
      phone: toE164(phone),
      options: { shouldCreateUser: true },
    })
    if (error) {
      setMessage(
        error.status === 429
          ? '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
          : '인증번호 전송에 실패했습니다. 잠시 후 다시 시도해주세요.',
      )
      return false
    }
    startCooldown()
    return true
  }

  async function handlePhoneSubmit() {
    setPending(true)
    setMessage(undefined)
    setErrors({})
    const ok = await sendOtp()
    if (ok) setStep('otp')
    setPending(false)
  }

  async function handleResend() {
    if (resendIn > 0 || pending) return
    setPending(true)
    setMessage(undefined)
    await sendOtp()
    setPending(false)
  }

  async function handleOtpSubmit() {
    if (pending) return
    setPending(true)
    setMessage(undefined)
    setErrors({})
    const digits = otp.replace(/\D/g, '')
    if (digits.length !== 6) {
      setErrors({ otp: '6자리 인증번호를 입력해주세요.' })
      setPending(false)
      return
    }

    const { error } = await supabase.auth.verifyOtp({
      phone: toE164(phone),
      token: digits,
      type: 'sms',
    })
    if (error) {
      setMessage('인증번호가 올바르지 않습니다. 다시 입력해주세요.')
      setOtp('')
      setPending(false)
      return
    }

    try {
      const profile = await api.get<{
        onboardingCompleted: boolean
        fullName: string | null
      }>('/profiles/me')
      await invalidateProfile()
      if (profile.fullName) {
        router.push(profile.onboardingCompleted ? '/home' : '/onboarding')
        return
      }
      setStep('profile')
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setStep('profile')
      } else {
        setMessage('프로필 확인 중 오류가 발생했습니다.')
      }
    } finally {
      setPending(false)
    }
  }

  async function handleProfileSubmit() {
    setPending(true)
    setMessage(undefined)
    setErrors({})
    const trimmed = name.trim()
    if (trimmed.length < 2) {
      setErrors({ name: '이름은 2자 이상 입력해주세요.' })
      setPending(false)
      return
    }
    try {
      await api.post('/auth/signup', { fullName: trimmed })
      await invalidateProfile()
      router.push('/onboarding')
    } catch {
      setMessage('회원가입 중 오류가 발생했습니다.')
      setPending(false)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (step === 'phone') return handlePhoneSubmit()
    if (step === 'otp') return handleOtpSubmit()
    if (step === 'profile') return handleProfileSubmit()
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    setMessage(undefined)
  }

  function handleChangePhone() {
    setStep('phone')
    setOtp('')
    setMessage(undefined)
    setErrors({})
  }

  if (user && profile && profile.role !== 'user') {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-[14px] leading-relaxed text-ink-muted" style={font}>
          호스트 계정으로 로그인해주세요.
        </p>
        <LoadingButton type="button" variant="primary" onClick={handleSignOut}>
          다른 계정으로 로그인
        </LoadingButton>
      </div>
    )
  }

  // User is authenticated and profile query is still in flight — wait before
  // deciding which step to show (avoids flashing the phone input).
  if (user && profilePending) {
    return (
      <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
    )
  }

  const submitLabel =
    step === 'phone' ? '인증번호 받기' : step === 'otp' ? '확인' : '가입하기'
  const loadingLabel =
    step === 'phone' ? '전송 중...' : step === 'otp' ? '확인 중...' : '가입 중...'

  return (
    <>
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

      <form onSubmit={handleSubmit} noValidate>
        <div className="rounded-xl border border-ink-faint overflow-hidden">
          {step === 'phone' && (
            <CompoundField label="휴대폰 번호" focused={focused === 'phone'} borderRadius="12px">
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                inputMode="numeric"
                placeholder="010-0000-0000"
                value={phone}
                onChange={(e) => {
                  setPhone(formatPhone(e.target.value))
                  if (errors.phone) setErrors({})
                }}
                onFocus={() => setFocused('phone')}
                onBlur={() => setFocused(null)}
                className="w-full bg-transparent text-[16px] text-ink placeholder:text-ink-faint outline-none"
                style={font}
                autoFocus
              />
              {errors.phone && (
                <p className="mt-1 text-[12px] text-destructive" style={font}>{errors.phone}</p>
              )}
            </CompoundField>
          )}

          {step === 'otp' && (
            <>
              <CompoundField label="휴대폰 번호" borderRadius="12px 12px 0 0">
                <div className="flex items-center justify-between">
                  <span className="text-[16px] text-ink" style={font}>{phone}</span>
                  <button
                    type="button"
                    onClick={handleChangePhone}
                    className="text-[13px] text-ink-muted underline underline-offset-2 hover:text-ink"
                    style={font}
                  >
                    변경
                  </button>
                </div>
              </CompoundField>
              <div className="border-t border-ink-faint">
                <CompoundField
                  label="인증번호 (6자리)"
                  focused={focused === 'otp'}
                  borderRadius="0 0 12px 12px"
                >
                  <div className="flex items-center gap-2">
                    <input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder={resendIn === 0 ? '만료됨' : '000000'}
                      value={otp}
                      disabled={pending || resendIn === 0}
                      onChange={(e) => {
                        setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                        if (errors.otp) setErrors({})
                      }}
                      onFocus={() => setFocused('otp')}
                      onBlur={() => setFocused(null)}
                      className="flex-1 bg-transparent text-[18px] tracking-[0.3em] text-ink placeholder:text-ink-faint outline-none disabled:opacity-60"
                      style={font}
                      autoFocus
                    />
                    {pending && (
                      <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
                    )}
                  </div>
                  {errors.otp && (
                    <p className="mt-1 text-[12px] text-destructive" style={font}>{errors.otp}</p>
                  )}
                </CompoundField>
              </div>
            </>
          )}

          {step === 'profile' && (
            <CompoundField label="이름" focused={focused === 'name'} borderRadius="12px">
              <input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="홍길동"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (errors.name) setErrors({})
                }}
                onFocus={() => setFocused('name')}
                onBlur={() => setFocused(null)}
                className="w-full bg-transparent text-[16px] text-ink placeholder:text-ink-faint outline-none"
                style={font}
                autoFocus
              />
              {errors.name && (
                <p className="mt-1 text-[12px] text-destructive" style={font}>{errors.name}</p>
              )}
            </CompoundField>
          )}
        </div>

        {step === 'otp' && (
          <div className="mt-3 text-center" style={font}>
            {resendIn > 0 ? (
              <p className="text-[13px] text-ink-muted">
                {resendIn}초 후 다시 받을 수 있습니다
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={pending}
                className="text-[13px] text-ink-muted underline underline-offset-2 hover:text-ink disabled:opacity-50"
              >
                인증번호 다시 받기
              </button>
            )}
          </div>
        )}

        {step === 'profile' && (
          <div className="flex flex-col gap-3 mt-4 mb-5 animate-fade-only" style={font}>
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

        {step !== 'otp' && (
          <LoadingButton
            type="submit"
            loading={pending}
            disabled={step === 'profile' && !allAgreed}
            loadingText={loadingLabel}
            className="mt-5"
          >
            {submitLabel}
          </LoadingButton>
        )}
      </form>
    </>
  )
}
