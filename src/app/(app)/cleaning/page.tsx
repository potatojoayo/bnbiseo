'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-provider'

export default function CleaningPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100dvh-80px)]">
        <div className="w-6 h-6 rounded-full border-2 border-[#EBEBEB] border-t-[#717171] animate-spin" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex items-center justify-center min-h-[calc(100dvh-80px)] px-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-[#222222]">
          청소
        </h1>
      </div>
    </div>
  )
}
