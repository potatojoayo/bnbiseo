'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { HomeIcon, BrushCleaningIcon, UserIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  {
    label: '홈',
    href: '/home',
    icon: HomeIcon,
    exact: true,
  },
  {
    label: '청소',
    href: '/cleaning',
    icon: BrushCleaningIcon,
    exact: false,
  },
  {
    label: '마이',
    href: '/my',
    icon: UserIcon,
    exact: false,
  },
] as const

export function BottomNav() {
  const pathname = usePathname()
  const refs = useRef<Record<string, HTMLAnchorElement | null>>({})

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  function handleTap(href: string) {
    const el = refs.current[href]
    if (!el) return
    el.style.animation = 'none'
    // Force reflow
    void el.offsetHeight
    el.style.animation = 'tapBounce 0.45s cubic-bezier(0.22, 1, 0.36, 1)'
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-[480px] border-t border-outline-dim bg-white pb-[env(safe-area-inset-bottom)] sm:rounded-t-2xl sm:border-x">
      <div className="flex items-center justify-around h-[56px]">
        {tabs.map(({ label, href, icon: Icon, exact }) => {
          const active = isActive(href, exact)
          return (
            <Link
              key={href}
              href={href}
              ref={(el) => { refs.current[href] = el }}
              onClick={() => handleTap(href)}
              className={cn(
                'flex flex-col items-center justify-center gap-[3px] flex-1 h-full',
                active ? 'text-brand' : 'text-ink-faint'
              )}
            >
              <Icon
                size={24}
                strokeWidth={1.5}
              />
              <span className={cn(
                'leading-none',
                'text-[11px] font-medium'
              )}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
