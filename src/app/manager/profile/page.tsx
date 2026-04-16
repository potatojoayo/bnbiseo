'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ClipboardListIcon, ChevronRightIcon } from 'lucide-react'
import { supabase } from '@/lib/api-client'
import { useManagerMe } from '@/lib/hooks/use-manager'
import { LoadingButton } from '@/components/ui/loading-button'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'

export default function ManagerProfilePage() {
  const router = useRouter()
  const { data: managerMe, isLoading } = useManagerMe()
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.replace('/manager/login')
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100dvh-80px)] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#EBEBEB] border-t-[#717171]" />
      </div>
    )
  }

  return (
    <div className="animate-fade-up-fast flex min-h-[calc(100dvh-80px)] flex-col">
      <div className="px-6 pb-6 pt-8">
        <h1 className="text-[22px] font-semibold text-[#222222]">
          {managerMe?.manager.name || managerMe?.profile.fullName || '마이페이지'}
        </h1>
        {(managerMe?.profile.email || managerMe?.manager.phone) && (
          <div className="mt-1 flex flex-col gap-0.5">
            {managerMe?.profile.email && (
              <p className="text-[14px] text-[#717171]">
                {managerMe.profile.email}
              </p>
            )}
            {managerMe?.manager.phone && (
              <p className="text-[14px] text-[#717171]">
                {managerMe.manager.phone}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col">
        <Link
          href="/manager/cleaning-history"
          className="flex items-center justify-between px-6 py-4 transition-colors active:bg-[#F7F7F7]"
        >
          <div className="flex items-center gap-3">
            <ClipboardListIcon size={20} className="text-[#717171]" strokeWidth={1.5} />
            <span className="text-[15px] text-[#222222]">청소 내역</span>
          </div>
          <ChevronRightIcon size={18} className="text-[#B0B0B0]" strokeWidth={1.5} />
        </Link>
      </div>

      <div className="mb-4 mt-auto flex items-center justify-center gap-2.5">
        <a href="/legal/terms" target="_blank" rel="noopener noreferrer" className="text-[12px] text-[#B0B0B0] transition-colors hover:text-[#717171]">
          이용약관
        </a>
        <div className="h-3 w-px bg-[#D0D0D0]" />
        <a href="/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-[12px] text-[#B0B0B0] transition-colors hover:text-[#717171]">
          개인정보처리방침
        </a>
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setLogoutOpen(true)}
          className="text-[12px] text-[#B0B0B0] underline underline-offset-2 transition-colors hover:text-[#717171]"
        >
          로그아웃
        </button>
      </div>

      <Drawer open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DrawerContent>
          <div className="w-full px-5 pb-8">
            <DrawerHeader className="px-0">
              <DrawerTitle className="text-[18px] font-semibold text-[#222222]">
                로그아웃할까요?
              </DrawerTitle>
            </DrawerHeader>
            <p className="mb-6 text-[14px] text-[#717171]">
              다시 로그인하면 배정된 청소와 요청을 다시 확인할 수 있어요.
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
                className="h-12 rounded-lg text-[15px] font-semibold text-[#717171] transition-colors active:bg-[#F7F7F7]"
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
