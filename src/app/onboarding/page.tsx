import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { properties, profiles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { OnboardingWizard } from './onboarding-wizard'

export default async function OnboardingPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Check existing properties and profile in parallel
  const [existing, profile] = await Promise.all([
    db
      .select({ id: properties.id })
      .from(properties)
      .where(eq(properties.hostId, user.id))
      .limit(1),
    db
      .select({ onboardingCompleted: profiles.onboardingCompleted })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1)
      .then((rows) => rows[0] ?? null),
  ])

  if (existing.length > 0) {
    // Has properties and completed onboarding → dashboard
    if (profile?.onboardingCompleted) redirect('/dashboard')
    // Has properties but not completed → complete page
    redirect('/onboarding/complete')
  }

  return <OnboardingWizard />
}
