'use server'

import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { profiles } from '@/db/schema'
import { createServerClient } from '@/lib/supabase/server'

export async function completeOnboarding() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  await db
    .update(profiles)
    .set({ onboardingCompleted: true, updatedAt: new Date() })
    .where(eq(profiles.id, user.id))

  redirect('/dashboard')
}
