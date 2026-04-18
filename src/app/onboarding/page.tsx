'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-provider'
import { api, supabase } from '@/lib/api-client'
import { PropertyForm } from './property-form'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { LoadingButton } from '@/components/ui/loading-button'

type Profile = { onboardingCompleted: boolean; role: 'user' | 'admin' | 'manager' }
type Property = { id: string }

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    if (authLoading || !user) return

    async function check() {
      try {
        const [profile, properties] = await Promise.all([
          api.get<Profile>('/profiles/me').catch(() => null),
          api.get<Property[]>('/properties').catch(() => []),
        ])

        if (!profile) {
          router.replace('/login')
          return
        }

        if (profile.role !== 'user') {
          router.replace('/login')
          return
        }

        if (profile.onboardingCompleted) {
          router.replace('/home')
          return
        }

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

  async function handleLogout() {
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" />
      </div>
    )
  }

  return (
    <>
      <div className="animate-fade-up-fast flex min-h-[calc(100dvh-48px)] flex-col">
        <PropertyForm animated={false} />

        <div className="mt-8 flex justify-center pb-8">
          <button
            type="button"
            onClick={() => setLogoutOpen(true)}
            className="text-[12px] text-ink-faint underline underline-offset-2 transition-colors hover:text-ink-muted"
          >
            로그아웃
          </button>
        </div>
      </div>

      <Drawer open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DrawerContent>
          <div className="w-full px-5 pb-8">
            <DrawerHeader className="px-0">
              <DrawerTitle className="text-[18px] font-semibold text-ink">
                로그아웃할까요?
              </DrawerTitle>
            </DrawerHeader>
            <p className="mb-6 text-[14px] text-ink-muted">
              다시 로그인하면 온보딩을 이어서 진행할 수 있어요.
            </p>
            <div className="flex flex-col gap-2">
              <LoadingButton
                type="button"
                variant="primary"
                loading={loggingOut}
                loadingText="로그아웃 중..."
                onClick={handleLogout}
              >
                로그아웃
              </LoadingButton>
              <button
                type="button"
                onClick={() => setLogoutOpen(false)}
                className="h-12 rounded-lg text-[15px] font-semibold text-ink-muted transition-colors active:bg-surface-soft md:hover:bg-surface-soft"
              >
                닫기
              </button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}
