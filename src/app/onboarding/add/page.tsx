import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { OnboardingWizard } from '../onboarding-wizard'

export default async function AddPropertyPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return <OnboardingWizard backHref="/onboarding/complete" />
}
