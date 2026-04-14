'use client'

import { useAuth } from '@/lib/auth-provider'
import { BottomNav } from '@/components/bottom-nav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading || !user) return null

  return (
    <div className="min-h-[100dvh] w-full flex flex-col mx-auto max-w-[480px] bg-white relative">
      <main className="flex-1 pb-[80px]">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
