'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-provider'
import { useProfile } from '@/lib/hooks/use-profile'
import { BottomNav } from '@/components/bottom-nav'

const NAV_PAGES = ['/home', '/cleaning', '/repair', '/my']

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const { data: profile, isLoading: profileLoading } = useProfile()
  const router = useRouter()
  const pathname = usePathname()
  const loading = authLoading || (!!user && profileLoading)
  const showNav = NAV_PAGES.includes(pathname)

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace('/login')
    } else if (!profile) {
      router.replace('/login')
    } else if (profile.role !== 'user') {
      router.replace('/login')
    } else if (!profile.onboardingCompleted) {
      router.replace('/onboarding')
    }
  }, [user, profile, loading, router])

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
      </div>
    )
  }

  if (!user || !profile || profile.role !== 'user' || !profile.onboardingCompleted) return null

  return (
    <div className="min-h-[100dvh] w-full flex flex-col mx-auto max-w-[480px] bg-white relative">
      <main className={showNav ? 'flex-1 pb-[80px]' : 'flex-1'}>
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  )
}
