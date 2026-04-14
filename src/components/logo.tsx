import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
}

export function Logo({ className, size = 'md' }: LogoProps) {
  return (
    <span
      className={cn(
        sizes[size],
        'font-medium tracking-tight',
        className,
      )}
      style={{ fontFamily: 'var(--font-display)', color: 'var(--brand)' }}
    >
      비앤비서
    </span>
  )
}
