'use client'

import { Loader2Icon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  loadingText?: string
  variant?: 'primary' | 'outline' | 'destructive'
}

const variants = {
  primary: 'bg-[#222222] hover:bg-[#333333] text-white',
  outline: 'bg-white border border-[#B0B0B0] text-[#222222] hover:bg-[#F7F7F7]',
  destructive: 'bg-[#222222] hover:bg-[#333333] text-white',
}

export function LoadingButton({
  loading = false,
  loadingText,
  variant = 'primary',
  disabled,
  children,
  className,
  ...props
}: LoadingButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'w-full h-12 rounded-lg text-[15px] font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        className,
      )}
      {...props}
    >
      {loading ? (
        <>
          <Loader2Icon className="size-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  )
}
