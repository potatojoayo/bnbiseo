'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-provider'
import { supabase } from '@/lib/api-client'
import { LogOutIcon } from 'lucide-react'

export default function MyPage() {
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
    <div className="min-h-[calc(100dvh-80px)] flex flex-col">
      <div className="flex justify-end px-4 pt-4">
        <button
          onClick={async () => {
            await supabase.auth.signOut()
            router.push('/login')
          }}
          className="flex items-center gap-1.5 text-[13px] text-[#717171] hover:text-[#222222] transition-colors whitespace-nowrap"
        >
          <LogOutIcon className="size-4" />
          로그아웃
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <h1 className="text-2xl font-semibold text-[#222222]">마이</h1>
      </div>
    </div>
  )
}
