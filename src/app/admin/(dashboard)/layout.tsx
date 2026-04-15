'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-provider'
import { api } from '@/lib/api-client'
import { AdminSidebar } from '@/components/admin-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

type Profile = { role: string }

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
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
