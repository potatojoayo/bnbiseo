'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeftIcon } from 'lucide-react'

export function MobileBackButton({
  href,
  mode = 'link',
}: {
  href: string
  mode?: 'link' | 'back'
}) {
  const router = useRouter()

  if (mode === 'back') {
    return (
      <button
        type="button"
        onClick={() => {
          if (window.history.length > 1) {
            router.back()
            return
          }
          router.push(href)
        }}
        className="-ml-4 inline-flex h-10 w-10 items-center justify-center rounded-full text-[#222222] transition-colors hover:bg-[#F7F7F7]"
        aria-label="뒤로가기"
      >
        <ChevronLeftIcon size={32} />
      </button>
    )
  }

  return (
    <Link
      href={href}
      className="-ml-4 inline-flex h-10 w-10 items-center justify-center rounded-full text-[#222222] transition-colors hover:bg-[#F7F7F7]"
    >
      <ChevronLeftIcon size={32} />
    </Link>
  )
}
