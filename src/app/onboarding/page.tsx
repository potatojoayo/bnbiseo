import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { properties } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { OnboardingWizard } from './onboarding-wizard'

export default async function OnboardingPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // If user already has properties, send to dashboard
  const existing = await db
    .select({ id: properties.id })
    .from(properties)
    .where(eq(properties.hostId, user.id))
    .limit(1)

  if (existing.length > 0) redirect('/dashboard')

  return <OnboardingWizard />
}
