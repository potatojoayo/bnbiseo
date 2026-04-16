'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BrushCleaningIcon, HomeIcon, UserIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  {
    label: '홈',
    href: '/manager/home',
    icon: HomeIcon,
    exact: true,
  },
  {
    label: '청소 요청',
    href: '/manager/cleanings',
    icon: BrushCleaningIcon,
    exact: false,
  },
  {
    label: '마이',
    href: '/manager/profile',
    icon: UserIcon,
    exact: false,
  },
] as const

export function ManagerBottomNav() {
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
    void el.offsetHeight
    el.style.animation = 'tapBounce 0.45s cubic-bezier(0.22, 1, 0.36, 1)'
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-[480px] border-t border-outline-dim bg-white pb-[env(safe-area-inset-bottom)] sm:rounded-t-2xl sm:border-x">
      <div className="flex h-[56px] items-center justify-around">
        {tabs.map(({ label, href, icon: Icon, exact }) => {
          const active = isActive(href, exact)

          return (
            <Link
              key={href}
              href={href}
              ref={(el) => { refs.current[href] = el }}
              onClick={() => handleTap(href)}
              className={cn(
                'flex h-full flex-1 flex-col items-center justify-center gap-[3px]',
                active ? 'text-brand' : 'text-ink-faint',
              )}
            >
              <Icon size={24} strokeWidth={1.5} />
              <span className="text-[11px] font-medium leading-none">
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
