'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOutIcon } from 'lucide-react'
import { useAuth } from '@/lib/auth-provider'
import { useProfile } from '@/lib/hooks/use-profile'
import { supabase } from '@/lib/api-client'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CtaButton } from './cta-button'

const FONT_BODY = 'font-text'
const LINK_CLS = `${FONT_BODY} text-sm font-medium text-on-surface hover:text-brand transition-colors`
const CTA_CLS = `${FONT_BODY} bg-on-surface text-surface border-none px-5 py-2 rounded-full text-sm font-semibold cursor-pointer transition-all duration-200 hover:bg-brand hover:scale-[1.03]`

export function LandingNavActions() {
  const { user, loading: authLoading } = useAuth()
  const { data: profile, isLoading: profileLoading } = useProfile()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  if (authLoading || (user && profileLoading)) {
    return <div className="h-9 w-32" aria-hidden />
  }

  if (!user) {
    return (
      <>
        <Link href="/login" className={LINK_CLS}>
          로그인
        </Link>
        <CtaButton className={CTA_CLS}>무료 등록</CtaButton>
      </>
    )
  }

  const role = profile?.role
  const isAdmin = role === 'admin'
  const isManager = role === 'manager'
  const ctaHref = isAdmin ? '/admin' : isManager ? '/manager' : null
  const ctaLabel = isAdmin
    ? '관리자 페이지'
    : isManager
      ? '매니저 페이지'
      : profile?.onboardingCompleted
        ? '내 숙소 관리'
        : '숙소 등록 이어하기'
  const email = profile?.email || user.email || ''
  const displayName = profile?.fullName || user.user_metadata?.full_name || ''
  const initials = (displayName || email || 'U').charAt(0).toUpperCase()

  async function handleSignOut() {
    setSigningOut(true)
    await supabase.auth.signOut()
    router.refresh()
    setSigningOut(false)
  }

  return (
    <>
      {ctaHref ? (
        <Link href={ctaHref} className={CTA_CLS}>
          {ctaLabel}
        </Link>
      ) : (
        <CtaButton className={CTA_CLS}>{ctaLabel}</CtaButton>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger
          className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          aria-label="계정 메뉴"
        >
          <Avatar className="size-9">
            <AvatarFallback className="bg-on-surface text-surface text-sm font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8} className="min-w-56">
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar className="size-8">
                <AvatarFallback className="bg-on-surface text-surface text-sm font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 leading-tight">
                {displayName && (
                  <span className="truncate text-sm font-medium text-ink">
                    {displayName}
                  </span>
                )}
                {email && (
                  <span className="truncate text-xs text-muted-foreground">
                    {email}
                  </span>
                )}
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {!isAdmin && !isManager && (
            <DropdownMenuItem asChild>
              <Link href="/my">마이페이지</Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            disabled={signingOut}
            onSelect={(e) => {
              e.preventDefault()
              handleSignOut()
            }}
          >
            <LogOutIcon className="size-4" />
            <span>{signingOut ? '로그아웃 중...' : '로그아웃'}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
