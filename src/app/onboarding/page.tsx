'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-provider'
import { api } from '@/lib/api-client'
import { PropertyForm } from './property-form'

type Profile = { onboardingCompleted: boolean }
type Property = { id: string }

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (authLoading || !user) return

    async function check() {
      try {
        const profile = await api.get<Profile>('/profiles/me').catch(() => null)

        if (!profile) {
          router.replace('/login')
          return
        }

        if (profile.onboardingCompleted) {
          router.replace('/home')
          return
        }

        const properties = await api.get<Property[]>('/properties').catch(() => [])

        if (properties.length > 0) {
          router.replace('/onboarding/complete')
          return
        }

        setReady(true)
      } catch {
        router.replace('/login')
      }
    }

    check()
  }, [user, authLoading, router])

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" />
      </div>
    )
  }

  return <PropertyForm />
}
