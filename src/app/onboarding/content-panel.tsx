'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function ContentPanel({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isComplete = pathname === '/onboarding/complete'

  return (
    <div
      className={`flex-1 flex flex-col overflow-y-auto ${isComplete ? '' : 'lg:ml-[420px] xl:ml-[460px]'}`}
      style={{ backgroundColor: 'var(--surface)' }}
    >
      {isComplete && (
        <nav className="bg-surface sticky top-0 z-50 h-14 max-md:h-12 px-12 flex justify-between items-center border-b border-outline-dim max-md:px-6">
          <Link href="/">
            <span
              className="text-xl font-medium tracking-tighter"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              비엔비서
            </span>
          </Link>
        </nav>
      )}
      {children}
    </div>
  )
}
