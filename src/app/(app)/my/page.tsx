'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-provider'
import { useProfile } from '@/lib/hooks/use-profile'
import { supabase } from '@/lib/api-client'
import {
  HomeIcon,
  ClipboardListIcon,
  ChevronRightIcon,
} from 'lucide-react'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { LoadingButton } from '@/components/ui/loading-button'

const menuItems = [
  { label: '내 숙소 관리', href: '/my/properties', icon: HomeIcon },
  { label: '청소 내역', href: '/my/cleaning-history', icon: ClipboardListIcon },
]

export default function MyPage() {
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const router = useRouter()
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const displayName = profile?.fullName || user?.user_metadata?.full_name || ''
  const email = profile?.email || user?.email || ''

  async function handleLogout() {
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="animate-fade-up-fast min-h-[calc(100dvh-80px)] flex flex-col">
      {/* Profile header */}
      <Link
        href="/my/profile"
        className="flex items-center justify-between px-6 pt-8 pb-6 active:bg-[#F7F7F7] transition-colors"
      >
        <div>
          <h1 className="text-[22px] font-semibold text-[#222222]">
            {displayName || '마이페이지'}
          </h1>
          {email && (
            <p className="text-[14px] text-[#717171] mt-1">{email}</p>
          )}
        </div>
        <ChevronRightIcon size={20} className="text-[#B0B0B0] shrink-0" strokeWidth={1.5} />
      </Link>

      {/* Menu list */}
      <div className="flex flex-col">
        {menuItems.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center justify-between px-6 py-4 active:bg-[#F7F7F7] transition-colors"
          >
            <div className="flex items-center gap-3">
              <Icon size={20} className="text-[#717171]" strokeWidth={1.5} />
              <span className="text-[15px] text-[#222222]">{label}</span>
            </div>
            <ChevronRightIcon size={18} className="text-[#B0B0B0]" strokeWidth={1.5} />
          </Link>
        ))}
      </div>

      {/* Legal links */}
      <div className="mt-auto flex items-center justify-center gap-2.5 mb-4">
        <a href="/legal/terms" target="_blank" rel="noopener noreferrer" className="text-[12px] text-[#B0B0B0] hover:text-[#717171] transition-colors">
          이용약관
        </a>
        <div className="w-px h-3 bg-[#D0D0D0]" />
        <a href="/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-[12px] text-[#B0B0B0] hover:text-[#717171] transition-colors">
          개인정보처리방침
        </a>
      </div>

      {/* Logout */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setLogoutOpen(true)}
          className="text-[12px] text-[#B0B0B0] underline underline-offset-2 hover:text-[#717171] transition-colors"
        >
          로그아웃
        </button>
      </div>

      {/* Logout Drawer */}
      <Drawer open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DrawerContent>
          <div className="w-full px-5 pb-8">
            <DrawerHeader className="px-0">
              <DrawerTitle className="text-[18px] font-semibold text-[#222222]">
                로그아웃할까요?
              </DrawerTitle>
            </DrawerHeader>
            <p className="text-[14px] text-[#717171] mb-6">
              다시 로그인하면 모든 정보를 확인할 수 있어요.
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
                className="h-12 rounded-lg text-[15px] font-semibold text-[#717171] active:bg-[#F7F7F7] transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
