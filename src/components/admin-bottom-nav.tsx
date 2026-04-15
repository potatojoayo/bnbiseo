'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboardIcon,
  BrushCleaningIcon,
  UserCheckIcon,
  Building2Icon,
  UsersIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { label: '대시보드', href: '/admin', icon: LayoutDashboardIcon },
  { label: '청소', href: '/admin/cleaning', icon: BrushCleaningIcon },
  { label: '매니저', href: '/admin/managers', icon: UserCheckIcon },
  { label: '숙소', href: '/admin/properties', icon: Building2Icon },
  { label: '회원', href: '/admin/users', icon: UsersIcon },
]

export function AdminBottomNav() {
  const pathname = usePathname()
  const refs = useRef<Record<string, HTMLAnchorElement | null>>({})

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  function handleTap(href: string) {
    const el = refs.current[href]
    if (!el) return
    el.style.animation = 'none'
    void el.offsetHeight
    el.style.animation = 'tapBounce 0.45s cubic-bezier(0.22, 1, 0.36, 1)'
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#EBEBEB] pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-[56px]">
        {tabs.map(({ label, href, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              ref={(el) => { refs.current[href] = el }}
              onClick={() => handleTap(href)}
              className={cn(
                'flex flex-col items-center justify-center gap-[3px] flex-1 h-full',
                active ? 'text-brand' : 'text-[#999999]'
              )}
            >
              <Icon size={22} strokeWidth={1.5} />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
