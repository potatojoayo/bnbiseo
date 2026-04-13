'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-provider'
import { api } from '@/lib/api-client'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

type Property = { id: string; name: string }
type Profile = { onboardingCompleted: boolean }

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [properties, setProperties] = useState<Property[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) return // AuthProvider handles redirect

    async function check() {
      try {
        const [profile, props] = await Promise.all([
          api.get<Profile>('/profiles/me'),
          api.get<Property[]>('/properties'),
        ])

        if (props.length === 0) {
          router.replace('/onboarding')
          return
        }

        if (!profile.onboardingCompleted) {
          router.replace('/onboarding/complete')
          return
        }

        setProperties(props)
        setReady(true)
      } catch {
        router.replace('/login')
      }
    }

    check()
  }, [user, authLoading, router])

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" />
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
      <AppSidebar
        variant="inset"
        user={{ email: user?.email ?? '' }}
        userProperties={properties}
      />
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
