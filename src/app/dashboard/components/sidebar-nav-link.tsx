'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface SidebarNavLinkProps {
  href: string
  icon?: React.ReactNode
  children: React.ReactNode
  className?: string
  exact?: boolean
}

export function SidebarNavLink({
  href,
  icon,
  children,
  className,
  exact = false,
}: SidebarNavLinkProps) {
  const pathname = usePathname()
  const isActive = exact ? pathname === href : pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors',
        isActive
          ? 'bg-brand/6 text-brand font-medium'
          : 'text-[#4b5563] hover:bg-surface hover:text-on-surface',
        className,
      )}
    >
      {icon}
      <span className="truncate">{children}</span>
    </Link>
  )
}
