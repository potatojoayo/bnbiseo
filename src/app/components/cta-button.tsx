'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/api-client'
import { api } from '@/lib/api-client'
import { cn } from '@/lib/utils'

type Destination = '/login' | '/onboarding' | '/dashboard'

export function CtaButton({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const router = useRouter()
  const [destination, setDestination] = useState<Destination>('/login')
  const [navigating, setNavigating] = useState(false)

  // Pre-fetch auth + profile state on mount so click is instant
  useEffect(() => {
    async function check() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setDestination('/login')
        return
      }

      try {
        const profile = await api.get<{ onboardingCompleted: boolean }>('/profiles/me')
        setDestination(profile.onboardingCompleted ? '/dashboard' : '/onboarding')
      } catch {
        // No profile — need to sign up properly
        setDestination('/login')
      }
    }

    check()
  }, [])

  function handleClick() {
    setNavigating(true)
    router.push(destination)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={navigating}
      className={cn(className, navigating && 'opacity-80')}
    >
      {children}
    </button>
  )
}
