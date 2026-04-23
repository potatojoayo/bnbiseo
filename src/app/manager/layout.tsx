'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-provider'
import { useManagerMe } from '@/lib/hooks/use-manager'
import { ManagerBottomNav } from '@/components/manager-bottom-nav'

const NAV_PAGES = ['/manager/home', '/manager/cleanings', '/manager/repairs', '/manager/profile']

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const { data: managerMe, isLoading: managerLoading, isError: managerError } = useManagerMe()
  const router = useRouter()
  const pathname = usePathname()
  const isLoginPage = pathname === '/manager/login'
  const loading = authLoading || (!!user && managerLoading)
  const showNav = NAV_PAGES.includes(pathname)

  useEffect(() => {
    if (isLoginPage) return
    if (loading) return

    if (!user) {
      router.replace('/manager/login')
      return
    }

    if (!managerMe || managerError) {
      router.replace('/manager/login')
    }
  }, [isLoginPage, loading, managerError, managerMe, router, user])

  if (isLoginPage) {
    return <>{children}</>
  }

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
      </div>
    )
  }

  if (!user || !managerMe) return null

  return (
    <div className="relative mx-auto flex w-full max-w-[480px] flex-col bg-white">
      <main className={showNav ? 'flex-1 pb-[80px]' : 'flex-1'}>
        {children}
      </main>
      {showNav && <ManagerBottomNav />}
    </div>
  )
}
