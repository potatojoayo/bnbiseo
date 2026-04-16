'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

const FONT = { fontFamily: 'var(--font-body)' }

const labelCls =
  'pointer-events-none absolute top-[8px] left-4 text-[11px] font-semibold uppercase tracking-wider text-ink-muted'
const inputCls =
  'w-full bg-transparent text-[16px] text-ink placeholder:text-ink-faint outline-none'

// ─── CompoundInput ────────────────────────────────────────────────────────────
// Outer wrapper: rounded-xl border with divide-y between children

interface CompoundInputProps {
  children: React.ReactNode
  className?: string
}

export function CompoundInput({ children, className }: CompoundInputProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-input divide-y divide-input',
        className,
      )}
    >
      {children}
    </div>
  )
}

// ─── CompoundField ────────────────────────────────────────────────────────────
// Individual field row inside a CompoundInput (or standalone wrapper)

interface CompoundFieldProps {
  label: string
  children: React.ReactNode
  focused?: boolean
  /** Override border-radius on the focus box-shadow element */
  borderRadius?: string
  /** Background override, e.g. surface token for readonly fields */
  bg?: string
  className?: string
}

export function CompoundField({
  label,
  children,
  focused,
  borderRadius,
  bg,
  className,
}: CompoundFieldProps) {
  return (
    <div
      className={cn('relative px-4 pt-[26px] pb-[10px]', className)}
      style={{
        boxShadow: focused
          ? 'inset 0 0 0 1px var(--on-surface)'
          : 'inset 0 0 0 0px var(--on-surface)',
        borderRadius: borderRadius ?? undefined,
        transition: 'box-shadow 0.2s ease',
        background: bg,
      }}
    >
      <span className={labelCls} style={FONT}>
        {label}
      </span>
      {children}
    </div>
  )
}

// ─── FloatingInput ────────────────────────────────────────────────────────────
// Self-contained single input with floating label + focus shadow.
// Renders its own CompoundField wrapper — use directly or inside CompoundInput.

interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  /** Override border-radius on focus shadow (e.g. '12px 12px 0 0') */
  borderRadius?: string
  /** Background for the field wrapper */
  bg?: string
  /** Error message to render below the input */
  error?: string
  /** Validate on change — return error string or empty for valid */
  validate?: (value: string) => string
  /** Ref forwarded to the underlying <input> */
  inputRef?: React.Ref<HTMLInputElement>
}

// ─── FloatingTextarea ─────────────────────────────────────────────────────────
// Auto-resizing textarea with floating label. No line breaks allowed.

interface FloatingTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'rows'> {
  label: string
  borderRadius?: string
  bg?: string
  error?: string
  /** Validate on change — return error string or empty for valid */
  validate?: (value: string) => string
}

export function FloatingTextarea({
  label,
  borderRadius,
  bg,
  error: externalError,
  validate,
  onFocus,
  onBlur,
  onChange,
  className,
  ...props
}: FloatingTextareaProps) {
  const [focused, setFocused] = React.useState(false)
  const [internalError, setInternalError] = React.useState('')
  const [touched, setTouched] = React.useState(false)
  const error = externalError || (touched ? internalError : '')

  function resize(el: HTMLTextAreaElement) {
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }

  return (
    <CompoundField
      label={label}
      focused={focused}
      borderRadius={borderRadius}
      bg={bg}
    >
      <textarea
        rows={1}
        ref={(el) => { if (el) resize(el) }}
        onFocus={(e) => { setFocused(true); onFocus?.(e) }}
        onBlur={(e) => { setFocused(false); setTouched(true); onBlur?.(e) }}
        onChange={(e) => {
          const val = e.target.value.replace(/\n/g, '')
          e.target.value = val
          resize(e.target)
          if (validate && touched) setInternalError(validate(val))
          onChange?.(e)
        }}
        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLElement).blur() }}
        className={cn(inputCls, 'resize-none overflow-hidden block leading-[1.25]', className)}
        style={FONT}
        {...props}
      />
      {error && (
        <p className="mt-1 text-[12px] text-destructive" style={FONT}>
          {error}
        </p>
      )}
    </CompoundField>
  )
}

// ─── FloatingInput ────────────────────────────────────────────────────────────

export function FloatingInput({
  label,
  borderRadius,
  bg,
  error: externalError,
  validate,
  inputRef,
  onFocus,
  onBlur,
  onChange,
  className,
  ...props
}: FloatingInputProps) {
  const [focused, setFocused] = React.useState(false)
  const [internalError, setInternalError] = React.useState('')
  const [touched, setTouched] = React.useState(false)
  const error = externalError || (touched ? internalError : '')

  return (
    <CompoundField
      label={label}
      focused={focused}
      borderRadius={borderRadius}
      bg={bg}
    >
      <input
        ref={inputRef}
        onFocus={(e) => { setFocused(true); onFocus?.(e) }}
        onBlur={(e) => { setFocused(false); setTouched(true); onBlur?.(e) }}
        onChange={(e) => {
          if (validate && touched) setInternalError(validate(e.target.value))
          onChange?.(e)
        }}
        className={cn(inputCls, className)}
        style={FONT}
        {...props}
      />
      {error && (
        <p className="mt-1 text-[12px] text-destructive" style={FONT}>
          {error}
        </p>
      )}
    </CompoundField>
  )
}
