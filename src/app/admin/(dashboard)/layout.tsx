'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-provider'
import { api } from '@/lib/api-client'
import { useIsMobile } from '@/hooks/use-mobile'
import { AdminSidebar } from '@/components/admin-sidebar'
import { AdminBottomNav } from '@/components/admin-bottom-nav'
import { SiteHeaderVisibilityContext } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

type Profile = { role: string }

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const [ready, setReady] = useState(false)
  const rootNavPaths = ['/admin', '/admin/cleaning', '/admin/users', '/admin/properties', '/admin/managers']
  const showBottomNav = rootNavPaths.includes(pathname)

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
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
      </div>
    )
  }

  // Mobile: bottom nav layout
  if (isMobile) {
    return (
      <SiteHeaderVisibilityContext.Provider value={false}>
        <div className="min-h-[100dvh] flex flex-col bg-white">
          <main className={`flex-1 ${showBottomNav ? 'pb-[72px]' : ''}`}>
            <div key={pathname}>
              {children}
            </div>
          </main>
          {showBottomNav && <AdminBottomNav />}
        </div>
      </SiteHeaderVisibilityContext.Provider>
    )
  }

  // Desktop: sidebar layout
  return (
    <SiteHeaderVisibilityContext.Provider value>
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
    </SiteHeaderVisibilityContext.Provider>
  )
}
