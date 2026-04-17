'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ClipboardListIcon, ChevronRightIcon, FileTextIcon, ShieldCheckIcon } from 'lucide-react'
import { supabase } from '@/lib/api-client'
import { useManagerMe } from '@/lib/hooks/use-manager'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LoadingButton } from '@/components/ui/loading-button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'

const MANAGER_PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120' fill='none'%3E%3Crect width='120' height='120' rx='60' fill='%23F4F4F4'/%3E%3Ccircle cx='60' cy='46' r='18' fill='%23C8C8C8'/%3E%3Cpath d='M28 94c4-16 18-26 32-26s28 10 32 26' fill='%23C8C8C8'/%3E%3C/svg%3E"

function ManagerAvatar({ src, fallback }: { src: string; fallback: string }) {
  const [avatarLoading, setAvatarLoading] = useState(true)

  return (
    <div className="relative size-16 shrink-0">
      {avatarLoading && (
        <Skeleton className="absolute inset-0 rounded-full bg-outline-strong" />
      )}
      <Avatar className="size-16">
        <AvatarImage
          src={src}
          alt=""
          onLoad={() => setAvatarLoading(false)}
          onError={() => setAvatarLoading(false)}
        />
        <AvatarFallback className="bg-surface-soft text-[20px] font-semibold text-ink-muted">
          {fallback}
        </AvatarFallback>
      </Avatar>
    </div>
  )
}

export default function ManagerProfilePage() {
  const router = useRouter()
  const { data: managerMe, isLoading } = useManagerMe()
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const avatarSrc =
    managerMe?.profile.avatarThumbnailSignedUrl
    || managerMe?.profile.avatarSignedUrl
    || MANAGER_PLACEHOLDER_IMAGE

  async function handleLogout() {
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.replace('/manager/login')
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100dvh-80px)] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-outline-dim border-t-ink-muted" />
      </div>
    )
  }

  return (
    <div className="animate-fade-up-fast flex min-h-[calc(100dvh-80px)] flex-col">
      <Link
        href="/manager/profile/edit"
        className="mt-3 flex items-center gap-4 rounded-xl px-6 pb-6 pt-5 transition-all active:bg-surface-soft md:hover:bg-surface-subtle md:hover:translate-x-0.5"
      >
        <ManagerAvatar
          key={avatarSrc}
          src={avatarSrc}
          fallback={(managerMe?.manager.name || managerMe?.profile.fullName || 'M').trim().charAt(0)}
        />

        <div className="min-w-0 flex-1">
          <h1 className="text-[22px] font-semibold text-ink">
            {managerMe?.manager.name || managerMe?.profile.fullName || '마이페이지'}
          </h1>
          {(managerMe?.profile.email || managerMe?.manager.phone) && (
            <div className="mt-1 flex flex-col gap-0.5">
              {managerMe?.profile.email && (
                <p className="truncate text-[14px] text-ink-muted">
                  {managerMe.profile.email}
                </p>
              )}
              {managerMe?.manager.phone && (
                <p className="text-[14px] text-ink-muted">
                  {managerMe.manager.phone}
                </p>
              )}
            </div>
          )}
        </div>

        <ChevronRightIcon size={18} className="shrink-0 text-ink-faint" strokeWidth={1.5} />
      </Link>

      <div className="flex flex-col">
        <Link
          href="/manager/cleaning-history"
          className="flex items-center justify-between rounded-xl px-6 py-4 transition-all active:bg-surface-soft md:hover:bg-surface-subtle md:hover:translate-x-0.5"
        >
          <div className="flex items-center gap-3">
            <ClipboardListIcon size={20} className="text-ink-muted" strokeWidth={1.5} />
            <span className="text-[15px] text-ink">청소 내역</span>
          </div>
          <ChevronRightIcon size={18} className="text-ink-faint" strokeWidth={1.5} />
        </Link>
        <a
          href="/legal/terms"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-xl px-6 py-4 transition-all active:bg-surface-soft md:hover:bg-surface-subtle md:hover:translate-x-0.5"
        >
          <div className="flex items-center gap-3">
            <FileTextIcon size={20} className="text-ink-muted" strokeWidth={1.5} />
            <span className="text-[15px] text-ink">이용약관</span>
          </div>
          <ChevronRightIcon size={18} className="text-ink-faint" strokeWidth={1.5} />
        </a>
        <a
          href="/legal/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-xl px-6 py-4 transition-all active:bg-surface-soft md:hover:bg-surface-subtle md:hover:translate-x-0.5"
        >
          <div className="flex items-center gap-3">
            <ShieldCheckIcon size={20} className="text-ink-muted" strokeWidth={1.5} />
            <span className="text-[15px] text-ink">개인정보처리방침</span>
          </div>
          <ChevronRightIcon size={18} className="text-ink-faint" strokeWidth={1.5} />
        </a>
      </div>

      <div className="mt-auto flex justify-center">
        <button
          type="button"
          onClick={() => setLogoutOpen(true)}
          className="text-[12px] text-ink-faint underline underline-offset-2 transition-colors hover:text-ink-muted"
        >
          로그아웃
        </button>
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
                className="h-12 rounded-lg text-[15px] font-semibold text-ink-muted transition-colors active:bg-surface-soft"
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
