'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { signup, type SignupFormState } from '@/actions/auth'

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3.5 px-4 rounded-xl text-sm font-semibold text-white transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      style={{
        backgroundColor: 'var(--on-surface)',
        fontFamily: 'var(--font-body)',
      }}
      onMouseEnter={(e) => {
        if (!pending)
          (e.currentTarget as HTMLButtonElement).style.backgroundColor =
            'var(--brand)'
      }}
      onMouseLeave={(e) => {
        if (!pending)
          (e.currentTarget as HTMLButtonElement).style.backgroundColor =
            'var(--on-surface)'
      }}
    >
      {pending ? (
        <span className="flex items-center justify-center gap-2">
          <span
            className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"
            style={{ display: 'inline-block' }}
          />
          가입 중...
        </span>
      ) : (
        '시작하기'
      )}
    </button>
  )
}

interface FieldProps {
  id: string
  name: string
  type?: string
  autoComplete?: string
  placeholder?: string
  label: string
  error?: string[]
}

function Field({
  id,
  name,
  type = 'text',
  autoComplete,
  placeholder,
  label,
  error,
}: FieldProps) {
  const hasError = error && error.length > 0

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-sm font-medium"
        style={{ color: 'var(--on-surface)', fontFamily: 'var(--font-body)' }}
      >
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required
        aria-invalid={hasError ? 'true' : undefined}
        aria-describedby={hasError ? `${id}-error` : undefined}
        className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all duration-150"
        style={{
          borderColor: hasError ? 'var(--brand)' : 'var(--outline-dim)',
          backgroundColor: '#FDFCFA',
          color: 'var(--on-surface)',
          fontFamily: 'var(--font-body)',
          boxShadow: 'none',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = hasError ? 'var(--brand)' : 'var(--on-surface)'
          e.currentTarget.style.boxShadow = hasError
            ? '0 0 0 3px rgba(212,66,30,0.12)'
            : '0 0 0 3px rgba(26,26,26,0.08)'
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = hasError ? 'var(--brand)' : 'var(--outline-dim)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      />
      {hasError && (
        <ul id={`${id}-error`} className="flex flex-col gap-0.5" role="alert">
          {error.map((err) => (
            <li
              key={err}
              className="text-xs"
              style={{ color: 'var(--brand)', fontFamily: 'var(--font-body)' }}
            >
              {err}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function SignupForm() {
  const [state, formAction] = useActionState<SignupFormState, FormData>(
    signup,
    undefined,
  )

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {/* Global error */}
      {state?.message && (
        <div
          className="text-sm px-4 py-3 rounded-xl flex items-start gap-2.5"
          style={{
            backgroundColor: '#FEE2E2',
            color: '#991B1B',
            fontFamily: 'var(--font-body)',
          }}
          role="alert"
        >
          <span className="shrink-0 mt-0.5">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" stroke="#991B1B" strokeWidth="1.5" />
              <path d="M7 4v3.5" stroke="#991B1B" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="7" cy="10.5" r="0.75" fill="#991B1B" />
            </svg>
          </span>
          {state.message}
        </div>
      )}

      <Field
        id="fullName"
        name="fullName"
        autoComplete="name"
        placeholder="홍길동"
        label="이름"
        error={state?.errors?.fullName}
      />

      <Field
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        label="이메일"
        error={state?.errors?.email}
      />

      <Field
        id="password"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="영문·숫자 포함 8자 이상"
        label="비밀번호"
        error={state?.errors?.password}
      />

      <div className="pt-1">
        <SubmitButton />
      </div>

      <p
        className="text-xs text-center leading-relaxed"
        style={{ color: 'var(--on-surface-subtle)', fontFamily: 'var(--font-body)' }}
      >
        가입 시{' '}
        <a
          href="/terms"
          className="underline underline-offset-2 transition-colors hover:text-on-surface"
        >
          이용약관
        </a>{' '}
        및{' '}
        <a
          href="/privacy"
          className="underline underline-offset-2 transition-colors hover:text-on-surface"
        >
          개인정보처리방침
        </a>
        에 동의합니다.
      </p>
    </form>
  )
}
