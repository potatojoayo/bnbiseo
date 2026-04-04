import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { properties } from '@/db/schema'
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

  // Fetch user's properties for the sidebar
  const userProperties = await db
    .select({ id: properties.id, name: properties.name })
    .from(properties)
    .where(eq(properties.hostId, user.id))
    .orderBy(properties.createdAt)

  // No properties → onboarding
  if (userProperties.length === 0) redirect('/onboarding')

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
