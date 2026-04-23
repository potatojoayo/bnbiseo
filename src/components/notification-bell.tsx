'use client'

import Link from 'next/link'
import { BellIcon } from 'lucide-react'
import { useNotifications } from '@/lib/hooks/use-notifications'

export function NotificationBell({
  href,
  className,
}: {
  href: string
  className?: string
}) {
  const { data } = useNotifications()
  const hasUnread = (data?.unreadCount ?? 0) > 0

  return (
    <Link href={href} className={className ?? 'relative inline-flex text-ink'}>
      <BellIcon size={20} strokeWidth={1.5} />
      {hasUnread && (
        <span className="absolute -right-[1px] -top-[3px] flex h-2.5 w-2.5 items-center justify-center rounded-full bg-white shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
        </span>
      )}
    </Link>
  )
}
