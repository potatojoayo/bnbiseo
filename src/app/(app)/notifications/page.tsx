'use client'

import { MobileBackButton } from '@/components/mobile-back-button'
import { NotificationPageContent } from '@/components/notification-page-content'

export default function NotificationsPage() {
  return (
    <div className="animate-fade-up-fast flex min-h-[calc(100dvh-80px)] flex-col px-6 pt-6 pb-10">
      <div className="mb-3">
        <MobileBackButton href="/home" />
      </div>
      <h1 className="mb-6 text-[22px] font-semibold text-ink">알림</h1>
      <NotificationPageContent />
    </div>
  )
}
