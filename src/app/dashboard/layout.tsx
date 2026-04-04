import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { properties, profiles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch profile and properties in parallel
  const [profile, userProperties] = await Promise.all([
    db
      .select({ onboardingCompleted: profiles.onboardingCompleted })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1)
      .then((rows) => rows[0] ?? null),
    db
      .select({ id: properties.id, name: properties.name })
      .from(properties)
      .where(eq(properties.hostId, user.id))
      .orderBy(properties.createdAt),
  ])

  // No properties → onboarding (first step)
  if (userProperties.length === 0) redirect('/onboarding')

  // Has properties but hasn't clicked "시작하기" → complete page
  if (!profile?.onboardingCompleted) redirect('/onboarding/complete')

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
        user={{ email: user.email ?? '' }}
        userProperties={userProperties}
      />
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
