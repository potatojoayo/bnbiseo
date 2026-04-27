'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-provider'
import { api } from '@/lib/api-client'
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
  const [ready, setReady] = useState(false)
  const rootNavPaths = ['/admin', '/admin/cleaning', '/admin/repair', '/admin/users', '/admin/properties', '/admin/managers']
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

  return (
    <SiteHeaderVisibilityContext.Provider value>
      <SidebarProvider
        style={
          {
            '--sidebar-width': 'calc(var(--spacing) * 68)',
            '--header-height': 'calc(var(--spacing) * 12)',
          } as React.CSSProperties
        }
        className="bg-white"
      >
        <AdminSidebar
          variant="inset"
          user={{ email: user?.email ?? '' }}
        />
        <SidebarInset className={showBottomNav ? 'pb-[72px] md:pb-0' : undefined}>
          {children}
        </SidebarInset>
      </SidebarProvider>
      {showBottomNav && (
        <div className="md:hidden">
          <AdminBottomNav />
        </div>
      )}
    </SiteHeaderVisibilityContext.Provider>
  )
}
