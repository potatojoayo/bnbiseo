'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-provider'
import { useProfile } from '@/lib/hooks/use-profile'
import { BottomNav } from '@/components/bottom-nav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const { data: profile, isLoading: profileLoading } = useProfile()
  const router = useRouter()

  const loading = authLoading || (!!user && profileLoading)

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace('/login')
    } else if (!profile) {
      router.replace('/login')
    } else if (!profile.onboardingCompleted) {
      router.replace('/onboarding')
    }
  }, [user, profile, loading, router])

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-[#EBEBEB] border-t-[#717171] animate-spin" />
      </div>
    )
  }

  if (!user || !profile || !profile.onboardingCompleted) return null

  return (
    <div className="min-h-[100dvh] w-full flex flex-col mx-auto max-w-[480px] bg-white relative">
      <main className="flex-1 pb-[80px]">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
