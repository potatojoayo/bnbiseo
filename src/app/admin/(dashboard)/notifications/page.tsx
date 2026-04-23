'use client'

import { SiteHeader } from '@/components/site-header'
import { MobileBackButton } from '@/components/mobile-back-button'
import { NotificationPageContent } from '@/components/notification-page-content'

export default function AdminNotificationsPage() {
  return (
    <>
      <SiteHeader title="알림" />
      <div className="mx-auto flex w-full max-w-[960px] flex-1 flex-col p-6 max-md:animate-fade-up-fast max-md:pb-10">
        <div className="mb-3 md:hidden">
          <MobileBackButton href="/admin" />
        </div>
        <h1 className="mb-6 text-[22px] font-semibold text-ink md:hidden">알림</h1>
        <NotificationPageContent />
      </div>
    </>
  )
}
