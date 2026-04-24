'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-provider'
import { useProfile } from '@/lib/hooks/use-profile'
import { cn } from '@/lib/utils'

export function CtaButton({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const [navigating, setNavigating] = useState(false)

  function handleClick() {
    setNavigating(true)
    if (!user || !profile) {
      router.push('/login')
      return
    }
    router.push(profile.onboardingCompleted ? '/home' : '/onboarding')
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
