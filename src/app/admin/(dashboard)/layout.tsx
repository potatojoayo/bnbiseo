'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-provider'
import { api } from '@/lib/api-client'
import { useIsMobile } from '@/hooks/use-mobile'
import { AdminSidebar } from '@/components/admin-sidebar'
import { AdminBottomNav } from '@/components/admin-bottom-nav'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

type Profile = { role: string }

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const isMobile = useIsMobile()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace('/admin/login')
      return
    }

    async function checkAdmin() {
      try {
        const profile = await api.get<Profile>('/profiles/me')
        if (profile.role !== 'admin') {
          router.replace('/admin/login')
          return
        }
        setReady(true)
      } catch {
        router.replace('/admin/login')
      }
    }

    checkAdmin()
  }, [user, authLoading, router])

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 rounded-full border-2 border-[#EBEBEB] border-t-[#717171] animate-spin" />
      </div>
    )
  }

  // Mobile: bottom nav layout
  if (isMobile) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-white">
        <main className="flex-1 pb-[72px]">
          {children}
        </main>
        <AdminBottomNav />
      </div>
    )
  }

  // Desktop: sidebar layout
  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 68)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <AdminSidebar
        variant="inset"
        user={{ email: user?.email ?? '' }}
      />
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
