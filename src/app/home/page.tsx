'use client'

import { useAuth } from '@/lib/auth-provider'

export default function HomePage() {
  const { user } = useAuth()

  return (
    <div className="min-h-[100dvh] bg-white flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-[#222222] mb-2">
          홈
        </h1>
        <p className="text-[15px] text-[#717171]">
          {user?.email}님, 환영합니다.
        </p>
      </div>
    </div>
  )
}
